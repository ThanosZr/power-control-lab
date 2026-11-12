"""Recording to a file while the simulation runs (4.8): the page sends the new samples of the scope's channels every
second or so, and they are appended to a CSV in ~/.pcl/recordings (or $PCL_HOME/recordings). The memory of the app holds
only the last part of a run (circular buffers); the file holds all of it, so a run of hours keeps its history on disk.

Only for this computer (the server checks the client). A recording is named by the server (date, time and a short
title), and the page refers to it by that name only: no paths from the page, nothing outside the folder.
"""
import os
import re
import time
from pathlib import Path

MAX_CHUNK = 8 * 1024 * 1024            # bytes of one append (about a second of many channels)
MAX_FILE = 4 * 1024 ** 3               # a recording stops growing at 4 GB


def folder():
    home = Path(os.environ.get('PCL_HOME') or (Path.home() / '.pcl'))
    d = home / 'recordings'
    d.mkdir(parents=True, exist_ok=True)
    return d


def _safe(title):
    t = re.sub(r'[^\w\-]+', '_', str(title or 'run'), flags=re.UNICODE).strip('_')[:40]
    return t or 'run'


def _path(name):
    if not isinstance(name, str) or not re.fullmatch(r'[\w\-]+\.csv', name, flags=re.UNICODE):
        raise ValueError('Μη έγκυρο όνομα καταγραφής.')
    p = folder() / name
    if p.parent != folder():
        raise ValueError('Μη έγκυρο όνομα καταγραφής.')
    return p


def start(title, header):
    """A new file with the header line; returns {'name', 'path'}."""
    if not isinstance(header, str) or '\n' in header or len(header) > 200000:
        raise ValueError('Μη έγκυρη κεφαλίδα.')
    base = time.strftime('%Y%m%d-%H%M%S') + '-' + _safe(title)
    name, k = base + '.csv', 1
    while (folder() / name).exists():
        k += 1
        name = f'{base}-{k}.csv'
    p = folder() / name
    p.write_text(header + '\n', encoding='utf-8')
    return {'name': name, 'path': str(p)}


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


def handle(data):
    op = data.get('op')
    if op == 'start':
        return start(data.get('title'), data.get('header'))
    if op == 'append':
        return append(data.get('name'), data.get('rows', ''))
    if op == 'list':
        return {'folder': str(folder()), 'files': sorted(f.name for f in folder().glob('*.csv'))[-50:]}
    raise ValueError('Άγνωστη ενέργεια καταγραφής.')
