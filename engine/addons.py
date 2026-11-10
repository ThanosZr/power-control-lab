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
USER = HOME / 'addons'
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


def listing():
    """The built-in and the user's add-ons (a user add-on with the id of a built-in one is skipped)."""
    out, seen = [], set()
    for base, builtin in ((BUILTIN, True), (USER, False)):
        if not base.is_dir():
            continue
        for d in sorted(base.iterdir()):
            if not (d / 'pcl-addon.json').is_file():
                continue
            try:
                m = _manifest(d)
            except (AddonError, ValueError, OSError) as e:
                out.append({'id': d.name, 'name': d.name, 'error': str(e), 'builtin': builtin})
                continue
            if m['id'] in seen or m['id'] != d.name:
                continue
            seen.add(m['id'])
            out.append({**m, 'builtin': builtin, 'base': f'/addons/{m["id"]}/'})
    return out


def user_file(rel):
    """A file of a user add-on, for /addons/<id>/<path> (the built-in ones are served from web/ itself)."""
    parts = rel.split('/', 1)
    if len(parts) != 2 or not ID_RE.fullmatch(parts[0]):
        return None
    base = (USER / parts[0]).resolve()
    f = (base / (parts[1] or 'index.html')).resolve()
    return f if f.is_relative_to(base) and f.is_file() else None


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
    tmp = HOME / ('.install-' + secrets.token_hex(4))
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
        USER.mkdir(parents=True, exist_ok=True)
        dest = USER / m['id']
        if dest.exists():
            shutil.rmtree(dest)
        tmp.rename(dest)
        return {**m, 'builtin': False, 'base': f'/addons/{m["id"]}/'}
    finally:
        if tmp.exists():
            shutil.rmtree(tmp, ignore_errors=True)


def remove(data):
    aid = str(data.get('id') or '')
    if not ID_RE.fullmatch(aid) or not (USER / aid).is_dir():
        raise AddonError('Δεν υπάρχει τέτοιο πρόσθετο του χρήστη.')
    shutil.rmtree(USER / aid)
    return {'ok': True, 'id': aid}


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

    def write_file(self, url):
        """~/.pcl/link.json with the address and the token, readable only by this user (pcl.link and pcl_link.m read it)."""
        try:
            HOME.mkdir(parents=True, exist_ok=True)
            f = HOME / 'link.json'
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
        return time.time() - self.seen < 40

    def call(self, method, args, timeout=120.0):
        if not isinstance(method, str) or not re.fullmatch(r'[a-z][a-z_.]{1,40}', method):
            raise AddonError('Άγνωστη μέθοδος.')
        if not self.connected():
            raise AddonError('Η εφαρμογή δεν είναι ανοιχτή ή η σύνδεση με εξωτερικά προγράμματα είναι κλειστή (κουμπί «Σύνδεση» στο πάνελ «Πρόσθετα»).')
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

    def next(self, wait=25.0, alive=None):
        """The next call for the page, or None after `wait` s. `alive()` tells whether the page that asks is still there:
        a page closed while it waited must not take a call (it would be lost), so the wait goes in short slices."""
        self.seen = time.time()
        with self.cv:
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

    def reply(self, cid, answer):
        with self.cv:
            self.answers[int(cid)] = answer
            self.cv.notify_all()
