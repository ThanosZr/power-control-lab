"""Recording to a file while the simulation runs (4.8): the page sends the new samples of the scope's channels every
second or so, and they are appended to a CSV in ~/.pcl/recordings (or $PCL_HOME/recordings). The memory of the app holds
only the last part of a run (circular buffers); the file holds all of it, so a run of hours keeps its history on disk.

Only for this computer (the server checks the client). A recording is named by the server (date, time and a short
title), and the page refers to it by that name only: nothing outside the folders of the recordings.

4.11 (ROADMAP §45, decision 4.11-θ): the scope reads its recording back.
* Folders: 'temp' (the folder above; the oldest temporary recordings go when it passes a size or an age) or a folder
  the user chose on this computer (checked: absolute, a directory, writable), remembered in ~/.pcl/settings.json if asked.
  The page still refers to a recording by its name; the server keeps which folder holds it.
* Reading back: an index of the file (the time and the byte offset of every INDEX_ROWS-th row, extended as the file
  grows) finds the bytes of a time range; numpy parses them; with more rows than the page has pixels the answer is the
  first, minimum, maximum and last value of each pixel column, otherwise the rows themselves.
* Estimates: the free space of the folder (shutil.disk_usage) and the bytes of a row, for the page's warnings.
* Events beside the file: <name>.events.csv (t, kind, source, value), so that a recording keeps what happened in it.
"""
import json
import os
import re
import shutil
import time
from pathlib import Path

MAX_CHUNK = 8 * 1024 * 1024            # bytes of one append (about a second of many channels)
MAX_FILE = 4 * 1024 ** 3               # a recording stops growing at 4 GB
INDEX_ROWS = 256                       # a point of the index every so many rows
MAX_READ = 512 * 1024 * 1024           # the bytes one range read may parse
TEMP_MAX = 2 * 1024 ** 3               # the temporary recordings stay below 2 GB …
TEMP_DAYS = 7                          # … and a week
NAME = re.compile(r'[\w\-]+\.csv', flags=re.UNICODE)
_where = {}                            # name → folder, for the recordings of the chosen folders
_index = {}                            # path → {'size', 'rows', 't': [...], 'off': [...], 'last': t, 'ncol'}


def home():
    return Path(os.environ.get('PCL_HOME') or (Path.home() / '.pcl'))


def folder():
    d = home() / 'recordings'
    d.mkdir(parents=True, exist_ok=True)
    return d


def settings():
    """The remembered choices of the recordings: {'dir': a folder or None, 'auto': bool, 'dest': 'temp' | 'dir'}."""
    try:
        s = json.loads((home() / 'settings.json').read_text(encoding='utf-8'))
        r = s.get('recording') if isinstance(s, dict) else None
    except (OSError, ValueError):
        r = None
    r = r if isinstance(r, dict) else {}
    return {'dir': r.get('dir') if isinstance(r.get('dir'), str) else None, 'auto': bool(r.get('auto')),
            'dest': 'dir' if r.get('dest') == 'dir' and isinstance(r.get('dir'), str) else 'temp'}


def save_settings(**kw):
    p = home() / 'settings.json'
    try:
        s = json.loads(p.read_text(encoding='utf-8'))
        s = s if isinstance(s, dict) else {}
    except (OSError, ValueError):
        s = {}
    r = settings()
    r.update({k: v for k, v in kw.items() if k in ('dir', 'auto', 'dest')})
    s['recording'] = r
    home().mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(s, ensure_ascii=False, indent=1), encoding='utf-8')
    return r


def user_folder(path, create=False):
    """A folder the user chose: an absolute path to a directory where a file can be written."""
    if not isinstance(path, str) or not path.strip() or '\x00' in path:
        raise ValueError('Δώσε τη διαδρομή ενός φακέλου.')
    p = Path(os.path.expanduser(path.strip()))
    if not p.is_absolute():
        raise ValueError('Η διαδρομή πρέπει να είναι πλήρης (π.χ. C:\\Users\\…\\Καταγραφές ή /home/…/καταγραφές).')
    if not p.exists():
        if not create:
            raise ValueError('Ο φάκελος δεν υπάρχει (επίλεξε «δημιουργία»).')
        p.mkdir(parents=True, exist_ok=True)
    if not p.is_dir():
        raise ValueError('Η διαδρομή δεν είναι φάκελος.')
    probe = p / f'.pcl-probe-{os.getpid()}'
    try:
        probe.write_text('', encoding='utf-8')
        probe.unlink()
    except OSError:
        raise ValueError('Δεν γράφεται αρχείο σε αυτόν τον φάκελο.') from None
    return p.resolve()


def _safe(title):
    t = re.sub(r'[^\w\-]+', '_', str(title or 'run'), flags=re.UNICODE).strip('_')[:40]
    return t or 'run'


def _path(name):
    if not isinstance(name, str) or not NAME.fullmatch(name):
        raise ValueError('Μη έγκυρο όνομα καταγραφής.')
    d = _where.get(name) or folder()
    if name not in _where and not (d / name).exists():         # a recording of the chosen folder from an earlier session
        u = settings()['dir']
        if u and (Path(u) / name).is_file():
            d = Path(u).resolve()
    p = d / name
    if p.parent != d:
        raise ValueError('Μη έγκυρο όνομα καταγραφής.')
    return p


def cleanup_temp(max_bytes=TEMP_MAX, max_days=TEMP_DAYS, keep=()):
    """The oldest temporary recordings (only files named by this server) go, beyond the size or the age."""
    files = sorted((f for f in folder().glob('*.csv') if NAME.fullmatch(f.name) and re.match(r'\d{8}-\d{6}-', f.name)
                    and f.name not in keep), key=lambda f: f.stat().st_mtime)
    now, gone = time.time(), []
    total = sum(f.stat().st_size for f in folder().glob('*.csv'))
    for f in files:
        old = now - f.stat().st_mtime > max_days * 86400
        if not (old or total > max_bytes):
            break
        total -= f.stat().st_size
        for g in (f, f.with_name(f.stem + '.events.csv')):
            try:
                g.unlink()
            except OSError:
                pass
        _index.pop(str(f), None)
        gone.append(f.name)
    return gone


def disk(dest='temp', path=None):
    """{'folder', 'free', 'total'} of the folder the recordings go to."""
    d = folder() if dest != 'dir' else user_folder(path or settings()['dir'] or '')
    u = shutil.disk_usage(d)
    return {'folder': str(d), 'free': u.free, 'total': u.total}


def start(title, header, dest='temp', path=None, remember=False, create=False):
    """A new file with the header line; returns {'name', 'path', 'folder', 'free', 'removed'}."""
    if not isinstance(header, str) or '\n' in header or len(header) > 200000:
        raise ValueError('Μη έγκυρη κεφαλίδα.')
    removed = []
    if dest == 'dir':
        d = user_folder(path or settings()['dir'] or '', create)
        if remember:
            save_settings(dir=str(d), dest='dir')
    else:
        d = folder()
        removed = cleanup_temp()
        if remember:
            save_settings(dest='temp')
    base = time.strftime('%Y%m%d-%H%M%S') + '-' + _safe(title)
    name, k = base + '.csv', 1
    while (d / name).exists() or (name in _where and _where[name] != d):
        k += 1
        name = f'{base}-{k}.csv'
    p = d / name
    p.write_text(header + '\n', encoding='utf-8')
    if d != folder():
        _where[name] = d
    return {'name': name, 'path': str(p), 'folder': str(d), 'free': shutil.disk_usage(d).free, 'removed': removed}


def append(name, text):
    """Rows (lines of numbers separated by commas) at the end of the file; returns its size."""
    p = _path(name)
    if not p.exists():
        raise ValueError('Η καταγραφή δεν υπάρχει.')
    if not isinstance(text, str) or len(text) > MAX_CHUNK:
        raise ValueError('Μη έγκυρο κομμάτι καταγραφής.')
    if text and not re.fullmatch(r'[0-9eE+\-.,\nNaInfity ]*', text):
        raise ValueError('Η καταγραφή δέχεται μόνο αριθμούς.')
    size = p.stat().st_size
    if size + len(text) > MAX_FILE:
        return {'name': name, 'bytes': size, 'full': True}
    with open(p, 'a', encoding='utf-8') as f:
        f.write(text if not text or text.endswith('\n') else text + '\n')
    return {'name': name, 'bytes': p.stat().st_size, 'full': False}


def events(name, rows):
    """Events beside the recording: rows [t, kind, source, value] appended to <name>.events.csv."""
    p = _path(name)
    if not p.exists():
        raise ValueError('Η καταγραφή δεν υπάρχει.')
    if not isinstance(rows, list) or len(rows) > 200000:
        raise ValueError('Μη έγκυρα γεγονότα.')
    e = p.with_name(p.stem + '.events.csv')
    new = not e.exists()
    q = lambda s: '"' + str(s).replace('"', '""') + '"'
    with open(e, 'a', encoding='utf-8') as f:
        if new:
            f.write('t,kind,source,value\n')
        for r in rows:
            if not (isinstance(r, (list, tuple)) and len(r) == 4):
                raise ValueError('Μη έγκυρο γεγονός.')
            t, v = float(r[0]), r[3]
            f.write(f'{t:.12g},{q(str(r[1])[:40])},{q(str(r[2])[:120])},{v if isinstance(v, (int, float)) else q(v)}\n')
    return {'name': e.name, 'bytes': e.stat().st_size}


# ---------------------------------------------------------------- reading back (4.11)
def _extend_index(p):
    """The index of the file, extended over the rows written since the last call."""
    key = str(p)
    ix = _index.get(key)
    size = p.stat().st_size
    with open(p, 'rb') as f:
        if ix is None:
            head = f.readline()
            ix = {'size': len(head), 'rows': 0, 't': [], 'off': [], 'last': None, 'first': None,
                  'cols': head.decode('utf-8').rstrip('\r\n').split(',')}
            _index[key] = ix
        if size <= ix['size']:
            return ix
        f.seek(ix['size'])
        off = ix['size']
        for line in f:
            if not line.endswith(b'\n'):          # a row still being written
                break
            try:
                t = float(line[:line.index(b',')] if b',' in line else line)
            except ValueError:
                t = None
            if t is not None:
                if ix['rows'] % INDEX_ROWS == 0:
                    ix['t'].append(t)
                    ix['off'].append(off)
                if ix['first'] is None:
                    ix['first'] = t
                ix['last'] = t
                ix['rows'] += 1
            off += len(line)
        ix['size'] = off
    return ix


def info(name):
    """{'name', 'cols', 'rows', 't0', 't1', 'bytes'} of a recording (the index extended to the end of the file)."""
    p = _path(name)
    if not p.exists():
        raise ValueError('Η καταγραφή δεν υπάρχει.')
    ix = _extend_index(p)
    return {'name': name, 'cols': ix['cols'], 'rows': ix['rows'], 't0': ix['first'], 't1': ix['last'], 'bytes': ix['size']}


def read_range(name, t0, t1, keys=None, n=1000):
    """The samples of [t0, t1] for the columns keys (header names; all when None): the rows themselves when they are at
    most 2n, otherwise per column of n equal intervals the first, minimum, maximum and last value and the times of the
    first and last sample. Returns {'t0', 't1', 'rows', 'raw', 't', 'cols': {key: …}, 'have': [first, last]}."""
    import numpy as np
    p = _path(name)
    if not p.exists():
        raise ValueError('Η καταγραφή δεν υπάρχει.')
    t0, t1, n = float(t0), float(t1), max(2, min(int(n), 20000))
    if not t1 > t0:
        raise ValueError('Μη έγκυρο διάστημα.')
    ix = _extend_index(p)
    cols = ix['cols']
    want = [k for k in (keys or cols[1:]) if k in cols]
    ci = [cols.index(k) for k in want]
    out = {'t0': t0, 't1': t1, 'rows': 0, 'raw': True, 't': [], 'cols': {k: {} for k in want}, 'have': [ix['first'], ix['last']]}
    if not ix['rows'] or ix['last'] is None or t1 < ix['first'] or t0 > ix['last']:
        out['cols'] = {k: {'v': []} for k in want}
        return out
    import bisect
    a = max(0, bisect.bisect_right(ix['t'], t0) - 1)
    b = bisect.bisect_right(ix['t'], t1)
    start = ix['off'][a]
    stop = ix['off'][b] if b < len(ix['off']) else ix['size']
    if stop - start > MAX_READ:
        raise ValueError('Το διάστημα είναι πολύ μεγάλο για μία ανάγνωση: μίκρυνε το παράθυρο.')
    with open(p, 'rb') as f:
        f.seek(start)
        block = f.read(stop - start)
    nc = len(cols)
    try:
        A = np.array(block.replace(b'\n', b',').decode('ascii').rstrip(',').split(','), dtype=float).reshape(-1, nc)
    except ValueError:
        raise ValueError('Η καταγραφή δεν διαβάζεται σε αυτό το διάστημα (γραμμή με άλλο πλήθος στηλών).') from None
    t = A[:, 0]
    sel = (t >= t0) & (t <= t1)
    # one sample on each side, so that a trace reaches the edges of the window
    k = np.nonzero(sel)[0]
    if len(k):
        lo, hi = max(0, k[0] - 1), min(len(t), k[-1] + 2)
    else:
        j = np.searchsorted(t, t0)
        lo, hi = max(0, j - 1), min(len(t), j + 1)
    A = A[lo:hi]
    t = A[:, 0]
    out['rows'] = int(len(t))
    if len(t) <= 2 * n:
        out['t'] = t.tolist()
        out['cols'] = {kk: {'v': [None if not np.isfinite(x) else float(x) for x in A[:, c]]} for kk, c in zip(want, ci)}
        return out
    out['raw'] = False
    A = A[(A[:, 0] >= t0) & (A[:, 0] <= t1)]          # per column only the samples inside the window
    t = A[:, 0]
    edges = np.linspace(t0, t1, n + 1)
    b = np.clip(np.searchsorted(edges, t, side='right') - 1, 0, n - 1)
    starts = np.searchsorted(b, np.arange(n), side='left')
    ends = np.searchsorted(b, np.arange(n), side='right')
    has = ends > starts
    out['has'] = has.astype(int).tolist()
    out['tf'] = [float(t[s]) if h else None for s, h in zip(starts, has)]
    out['tl'] = [float(t[e - 1]) if h else None for e, h in zip(ends, has)]
    for kk, c in zip(want, ci):
        v = A[:, c]
        fi = [float(v[s]) if h else None for s, h in zip(starts, has)]
        la = [float(v[e - 1]) if h else None for e, h in zip(ends, has)]
        mn = np.full(n, np.nan)
        mx = np.full(n, np.nan)
        idx = np.nonzero(has)[0]
        if len(idx):
            mn[idx] = np.fmin.reduceat(v, starts[idx])
            mx[idx] = np.fmax.reduceat(v, starts[idx])
        out['cols'][kk] = {'fi': fi, 'la': la, 'mn': [None if not np.isfinite(x) else float(x) for x in mn],
                           'mx': [None if not np.isfinite(x) else float(x) for x in mx]}
    return out


def handle(data):
    op = data.get('op')
    if op == 'start':
        return start(data.get('title'), data.get('header'), data.get('dest') or 'temp', data.get('dir'),
                     bool(data.get('remember')), bool(data.get('create')))
    if op == 'append':
        return append(data.get('name'), data.get('rows', ''))
    if op == 'events':
        return events(data.get('name'), data.get('rows'))
    if op == 'info':
        return info(data.get('name'))
    if op == 'range':
        return read_range(data.get('name'), data.get('t0'), data.get('t1'), data.get('keys'), data.get('n') or 1000)
    if op == 'settings':
        if any(k in data for k in ('dir', 'auto', 'dest')):
            kw = {}
            if 'dir' in data:
                kw['dir'] = str(user_folder(data['dir'], bool(data.get('create')))) if data['dir'] else None
            if 'auto' in data:
                kw['auto'] = bool(data['auto'])
            if 'dest' in data:
                kw['dest'] = 'dir' if data['dest'] == 'dir' else 'temp'
            save_settings(**kw)
        s = settings()
        out = {**s, 'temp': str(folder())}
        try:
            out['disk'] = disk(s['dest'], s['dir'])
        except (ValueError, OSError) as e:
            out['disk'] = {'error': str(e)}
        return out
    if op == 'check':
        return disk(data.get('dest') or 'temp', data.get('dir'))
    if op == 'list':
        out = {'folder': str(folder()), 'files': sorted(f.name for f in folder().glob('*.csv') if not f.name.endswith('.events.csv'))[-50:]}
        d = settings()['dir']
        if d:
            try:
                dd = user_folder(d)
                out['dir'] = str(dd)
                out['dir_files'] = sorted(f.name for f in dd.glob('*.csv') if NAME.fullmatch(f.name) and not f.name.endswith('.events.csv'))[-50:]
            except (ValueError, OSError):
                pass
        return out
    raise ValueError('Άγνωστη ενέργεια καταγραφής.')
