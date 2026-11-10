"""Add-ons and the link to outside programs (3.15, ROADMAP §35, §36).

* Add-ons: folders with a manifest `pcl-addon.json` and a page (`entry`, HTML + JS files) that the app opens in a
  sandboxed frame. The page talks to the app only through messages (web/studio/addons.js, addon_client.js): read and
  change the circuit, run simulations and sweeps, run Python, show tables and charts, write files. The built-in ones
  are in web/addons/, the user's in ~/.pcl/addons/ (they survive a new version of the app).
* The link: a program on the same computer (Python, MATLAB, any language with HTTP) calls the same API on the circuit
  open in the browser. The program posts a call with the token of ~/.pcl/link.json, the page (when the user has turned
  the link on) takes it with a long poll, runs it and posts the answer back.
Only from this computer (127.0.0.1) and with the Host header of this computer (no DNS rebinding).
"""
import base64
import io
import json
import os
import re
import secrets
import shutil
import threading
import time
import zipfile
from pathlib import Path

BUILTIN = Path(__file__).resolve().parent.parent / 'web' / 'addons'
HOME = Path(os.environ.get('PCL_HOME') or (Path.home() / '.pcl'))
# the user's add-ons, one folder per version: <app>/addons/<id>/<version>/ (outside git and the zip of the app, so the
# repository carries no large files; PCL_ADDONS moves it). The active version is the newest, or the one in <id>/active.
USER = Path(os.environ.get('PCL_ADDONS') or (Path(__file__).resolve().parent.parent / 'addons'))
VER_RE = re.compile(r'[0-9A-Za-z][0-9A-Za-z.\-]{0,31}')
ID_RE = re.compile(r'[a-z0-9][a-z0-9\-]{1,39}')
MAX_ZIP = 20 << 20
KINDS = {'panel', 'params', 'plot'}
PERMS = {'project.read', 'project.write', 'run', 'python', 'files', 'show'}


class AddonError(ValueError):
    pass


def _manifest(folder):
    f = folder / 'pcl-addon.json'
    m = json.loads(f.read_text(encoding='utf-8'))
    if not isinstance(m, dict):
        raise AddonError('Το pcl-addon.json πρέπει να είναι αντικείμενο JSON.')
    aid = str(m.get('id', ''))
    if not ID_RE.fullmatch(aid):
        raise AddonError('Το id του πρόσθετου: 2–40 χαρακτήρες a–z, 0–9 και «-».')
    entry = str(m.get('entry') or 'index.html')
    if '..' in entry or entry.startswith('/') or not (folder / entry).is_file():
        raise AddonError(f'Δεν βρέθηκε η σελίδα του πρόσθετου ({entry}).')
    k0 = m.get('kind') or ['panel']
    kinds = [k for k in (k0 if isinstance(k0, list) else [k0]) if k in KINDS] or ['panel']
    perms = [p for p in (m.get('permissions') or []) if p in PERMS]
    targets = [t for t in (m.get('targets') or []) if isinstance(t, dict) and isinstance(t.get('type'), str)]
    return {'id': aid, 'name': str(m.get('name') or aid), 'version': str(m.get('version') or ''), 'description': str(m.get('description') or ''),
            'author': str(m.get('author') or ''), 'entry': entry, 'kind': kinds, 'permissions': perms, 'targets': targets,
            'python': [str(x) for x in (m.get('python') or []) if isinstance(x, str) and x.endswith('.py') and '..' not in x and '/' not in x]}


def _vkey(v):
    """Version order: numbers as numbers (1.10 after 1.9), then the rest as text."""
    return [(0, int(x), '') if x.isdigit() else (1, 0, x) for x in re.split(r'[.\-]', v)]


def versions(aid):
    d = USER / aid
    if not d.is_dir():
        return []
    return sorted((v.name for v in d.iterdir() if v.is_dir() and (v / 'pcl-addon.json').is_file()), key=_vkey)


def active(aid):
    vs = versions(aid)
    f = USER / aid / 'active'
    want = f.read_text(encoding='utf-8').strip() if f.is_file() else ''
    return want if want in vs else (vs[-1] if vs else None)


def listing():
    """The built-in add-ons (web/addons/<id>/) and the user's (addons/<id>/<version>/: the active version, and all of them)."""
    out = []
    if BUILTIN.is_dir():
        for d in sorted(BUILTIN.iterdir()):
            if not (d / 'pcl-addon.json').is_file():
                continue
            try:
                m = _manifest(d)
            except (AddonError, ValueError, OSError) as e:
                out.append({'id': d.name, 'name': d.name, 'error': str(e), 'builtin': True})
                continue
            if m['id'] == d.name:
                out.append({**m, 'builtin': True, 'base': f'/addons/{m["id"]}/', 'versions': [m['version']], 'active': m['version']})
    seen = {a['id'] for a in out}
    if USER.is_dir():
        for d in sorted(USER.iterdir()):
            if not d.is_dir() or not ID_RE.fullmatch(d.name) or d.name in seen:
                continue
            v = active(d.name)
            if not v:
                continue
            try:
                m = _manifest(d / v)
            except (AddonError, ValueError, OSError) as e:
                out.append({'id': d.name, 'name': d.name, 'error': str(e), 'builtin': False, 'versions': versions(d.name), 'active': v})
                continue
            out.append({**m, 'version': v, 'builtin': False, 'base': f'/addons/{d.name}/{v}/', 'versions': versions(d.name), 'active': v})
    return out


def user_file(rel):
    """A file of a user add-on, for /addons/<id>/<version>/<path> (the built-in ones are served from web/ itself)."""
    parts = rel.split('/', 2)
    if len(parts) != 3 or not ID_RE.fullmatch(parts[0]) or not VER_RE.fullmatch(parts[1]):
        return None
    base = (USER / parts[0] / parts[1]).resolve()
    f = (base / (parts[2] or 'index.html')).resolve()
    return f if f.is_relative_to(base) and f.is_file() else None


def activate(data):
    aid, v = str(data.get('id') or ''), str(data.get('version') or '')
    if not ID_RE.fullmatch(aid) or v not in versions(aid):
        raise AddonError('Δεν υπάρχει αυτή η έκδοση του πρόσθετου.')
    (USER / aid / 'active').write_text(v, encoding='utf-8')
    return {'ok': True, 'id': aid, 'active': v}


def install(data):
    """{name, zip: base64} → extracts the add-on into ~/.pcl/addons/<id>/ (replacing an older one of the same id)."""
    try:
        raw = base64.b64decode(str(data.get('zip') or ''), validate=True)
    except Exception as e:                          # noqa: BLE001
        raise AddonError('Το zip δεν διαβάστηκε.') from e
    if not raw or len(raw) > MAX_ZIP:
        raise AddonError('Το zip πρέπει να είναι ως 20 MB.')
    try:
        z = zipfile.ZipFile(io.BytesIO(raw))
    except zipfile.BadZipFile as e:
        raise AddonError('Δεν είναι αρχείο zip.') from e
    names = [n for n in z.namelist() if not n.endswith('/')]
    man = [n for n in names if n.split('/')[-1] == 'pcl-addon.json' and n.count('/') <= 1]
    if len(man) != 1:
        raise AddonError('Το zip πρέπει να έχει ένα pcl-addon.json στη ρίζα (ή σε έναν φάκελο).')
    prefix = man[0][:-len('pcl-addon.json')]
    total = sum(z.getinfo(n).file_size for n in names)
    if total > 4 * MAX_ZIP or len(names) > 2000:
        raise AddonError('Πολύ μεγάλο πρόσθετο.')
    USER.mkdir(parents=True, exist_ok=True)
    tmp = USER / ('.install-' + secrets.token_hex(4))
    try:
        for n in names:
            if not n.startswith(prefix):
                continue
            rel = n[len(prefix):]
            if not rel or rel.startswith('/') or '..' in rel.split('/') or '\\' in rel:
                raise AddonError(f'Μη έγκυρη διαδρομή στο zip: {n}')
            dst = tmp / rel
            dst.parent.mkdir(parents=True, exist_ok=True)
            dst.write_bytes(z.read(n))
        m = _manifest(tmp)
        if (BUILTIN / m['id']).is_dir():
            raise AddonError(f'Το id «{m["id"]}» ανήκει σε ενσωματωμένο πρόσθετο.')
        v = m['version'] or '0'
        if not VER_RE.fullmatch(v):
            raise AddonError('Η έκδοση (version) του πρόσθετου: γράμματα, ψηφία, «.» και «-», π.χ. 1.2.0.')
        dest = USER / m['id'] / v
        if dest.exists():
            if not data.get('replace'):
                raise AddonError(f'Η έκδοση {v} του «{m["id"]}» υπάρχει ήδη. Ανέβασε νέα έκδοση (version στο pcl-addon.json) ή αντικατάστησέ την.')
            shutil.rmtree(dest)
        dest.parent.mkdir(parents=True, exist_ok=True)
        tmp.rename(dest)
        (USER / m['id'] / 'active').write_text(v, encoding='utf-8')     # the new version becomes the active one
        return {**m, 'version': v, 'builtin': False, 'base': f'/addons/{m["id"]}/{v}/', 'versions': versions(m['id']), 'active': v}
    finally:
        if tmp.exists():
            shutil.rmtree(tmp, ignore_errors=True)


def remove(data):
    """{id} removes every version, {id, version} only that one."""
    aid, v = str(data.get('id') or ''), data.get('version')
    if not ID_RE.fullmatch(aid) or not (USER / aid).is_dir():
        raise AddonError('Δεν υπάρχει τέτοιο πρόσθετο του χρήστη.')
    if v:
        if str(v) not in versions(aid):
            raise AddonError('Δεν υπάρχει αυτή η έκδοση.')
        shutil.rmtree(USER / aid / str(v))
        if not versions(aid):
            shutil.rmtree(USER / aid)
    else:
        shutil.rmtree(USER / aid)
    return {'ok': True, 'id': aid, 'versions': versions(aid)}


# ---------------------------------------------------------------- the link
class Link:
    """Calls from outside programs wait here until the page takes them and answers."""

    def __init__(self):
        self.token = secrets.token_urlsafe(24)
        self.cv = threading.Condition()
        self.calls = []          # waiting for the page
        self.answers = {}        # id → answer
        self.seq = 0
        self.seen = 0.0          # the last time the page asked for calls
        self.waiting = 0         # pages waiting for calls right now
        self.knocks = {}         # a program asks while the link is closed: id → {client, t, state: new | shown | denied}
        self.kseq = 0

    def write_file(self, url):
        """~/.pcl/link.json with the address and the token, readable only by this user (pcl.link and pcl_link.m read it)."""
        home = Path(os.environ.get('PCL_HOME') or HOME)      # read now: a test or a second server may move it
        try:
            home.mkdir(parents=True, exist_ok=True)
            f = home / 'link.json'
            f.write_text(json.dumps({'url': url, 'token': self.token, 'pid': os.getpid()}), encoding='utf-8')
            try:
                os.chmod(f, 0o600)
            except OSError:
                pass
            return f
        except OSError:
            return None

    def ok(self, token):
        return isinstance(token, str) and secrets.compare_digest(token, self.token)

    def connected(self):
        # a page waits for calls now (its long poll), or asked a moment ago (between two polls). A closed page drops out
        # within a second (alive), so a program does not wait for a page that is gone
        return self.waiting > 0 or time.time() - self.seen < 3

    def call(self, method, args, timeout=120.0, client='', knock_wait=60.0):
        """A call of a program. With the link closed it knocks: the page shows «Αποδοχή / Απόρριψη», and the call waits
        up to knock_wait s for the answer (on demand, Thanos 10/11)."""
        if not isinstance(method, str) or not re.fullmatch(r'[a-z][a-z_.]{1,40}', method):
            raise AddonError('Άγνωστη μέθοδος.')
        if not self.connected():
            self.knock(client, knock_wait)
        with self.cv:
            self.seq += 1
            cid = self.seq
            self.calls.append({'id': cid, 'method': method, 'args': args if isinstance(args, dict) else {}})
            self.cv.notify_all()
            end = time.time() + max(1.0, min(float(timeout or 120), 3600.0))
            while cid not in self.answers:
                left = end - time.time()
                if left <= 0:
                    self.calls = [c for c in self.calls if c['id'] != cid]
                    raise TimeoutError('Η εφαρμογή δεν απάντησε εγκαίρως.')
                self.cv.wait(left)
            return self.answers.pop(cid)

    def knock(self, client, wait):
        with self.cv:
            self.kseq += 1
            kid = self.kseq
            self.knocks[kid] = {'id': kid, 'client': str(client or 'πρόγραμμα')[:80], 't': time.time(), 'state': 'new'}
            self.cv.notify_all()
            end = time.time() + max(0.0, float(wait))
            try:
                while not self.connected():
                    if self.knocks[kid]['state'] == 'denied':
                        raise AddonError('Η εφαρμογή απέρριψε τη σύνδεση.')
                    left = end - time.time()
                    if left <= 0:
                        raise AddonError('Η σύνδεση με εξωτερικά προγράμματα είναι κλειστή και κανείς δεν την αποδέχτηκε: άνοιξε την εφαρμογή '
                                         '(python run.py) και πάτησε «Αποδοχή» στο μήνυμα, ή άνοιξε τη σύνδεση στο πάνελ «Πρόσθετα και σύνδεση».')
                    self.cv.wait(min(left, 0.5))
            finally:
                self.knocks.pop(kid, None)

    def knock_next(self, wait=25.0, alive=None):
        """For the page, also with the link closed: the next program that knocks, or None."""
        with self.cv:
            end = time.time() + wait
            while True:
                if alive is not None and not alive():
                    return None
                k = next((k for k in self.knocks.values() if k['state'] == 'new'), None)
                if k:
                    k['state'] = 'shown'
                    return {x: k[x] for x in ('id', 'client')}
                left = end - time.time()
                if left <= 0:
                    return None
                self.cv.wait(min(left, 1.0))

    def deny(self, kid):
        with self.cv:
            k = self.knocks.get(int(kid))
            if k:
                k['state'] = 'denied'
            self.cv.notify_all()

    def next(self, wait=25.0, alive=None):
        """The next call for the page, or None after `wait` s. `alive()` tells whether the page that asks is still there:
        a page closed while it waited must not take a call (it would be lost), so the wait goes in short slices."""
        self.seen = time.time()
        with self.cv:
            self.waiting += 1
            self.cv.notify_all()            # a knocking call waits for the page to be connected
            try:
                end = time.time() + wait
                while True:
                    if alive is not None and not alive():
                        return None
                    if self.calls:
                        return self.calls.pop(0)
                    left = end - time.time()
                    if left <= 0:
                        return None
                    self.cv.wait(min(left, 1.0))
                    self.seen = time.time()
            finally:
                self.waiting -= 1

    def reply(self, cid, answer):
        with self.cv:
            self.answers[int(cid)] = answer
            self.cv.notify_all()
