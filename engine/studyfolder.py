"""The study folder (5.0, ROADMAP §91, THEORY §8ΩΕ, decision 344): a folder the user chose, where every run of the simulation
writes what it is and what it gave, and where the line models are kept by the hash of what they were fitted from. The
idea is that of the EMTP (the design folder with the netlist, the project folder with the log and the plot files) and of
PSCAD (the temporary folder of a project with the output files); the files and the layout are ours:

    <folder>/study.json                         the study: format, id, created, title, the tool
    <folder>/models/lines/<label>_<hash12>/     a line model: input.json (its key and data), model.json (what the solver
                                                reads), result.json (with the report and the curves, when fitted here),
                                                the file in the format of the EMTP (_WB.mod, _FD.mod, _Nominal_PI.mod or
                                                the CP netlist) and report.txt
    <folder>/runs/<NNNN>-<YYYYMMDD-HHMMSS>/     a run: run.json (identity and status), project.json (the project as it
                                                ran), channels.json, data.f64 (or data.f32: little-endian rows
                                                [t, channel 1 … N], appended while it runs: the complete rows are
                                                size // rowBytes), events.jsonl, log.jsonl, summary.json and summary.html,
                                                and, when asked, netlist.json and netlist.txt

What a run records is decided in web/studio/study.js (the channels, the rows, the netlist, the summary); this module
makes the folders, keeps the identity, stores and finds the line models, and reads back a run, or a file of the EMTP
(<name>m.m with its .mda), of PSCAD (<name>.inf with its .out files) or a CSV, for the viewer (web/viewer/) and for
pcl.results. Only for this computer (the server checks the client); every path is absolute and checked.
"""
import datetime
import hashlib
import html
import json
import os
import re
import shutil
import time
import uuid
from pathlib import Path

FORMAT = 1                              # the version of study.json, run.json and the line model folders
KEEP = 20                               # the runs a study keeps (the oldest untagged ones go when a new run starts)
MAX_PUT = 64 * 1024 * 1024              # the bytes of one file written through put (netlist.json of a large network)
MAX_APPEND = 64 * 1024 * 1024           # the bytes of one append of rows
RUN = re.compile(r'runs/\d{4,6}-\d{8}-\d{6}')
PUT_NAMES = {'channels.json', 'netlist.json', 'netlist.txt', 'summary.json'}
_idx = {}                               # path of a source → (stamp, parsed source) for the files that do not grow


def home():
    from . import recording
    return recording.home()


def now_iso():
    return datetime.datetime.now().astimezone().isoformat(timespec='seconds')


def _safe(title, n=40):
    t = re.sub(r'[^\w\-]+', '_', str(title or 'study'), flags=re.UNICODE).strip('_')[:n]
    return t or 'study'


def _write_json(p, obj):
    """Atomically: a reader (the viewer) never sees half a file."""
    tmp = p.with_name(p.name + f'.tmp{os.getpid()}')
    tmp.write_text(json.dumps(obj, ensure_ascii=False, indent=1, allow_nan=False, default=str), encoding='utf-8')
    os.replace(tmp, p)


def _read_json(p):
    try:
        return json.loads(Path(p).read_text(encoding='utf-8'))
    except (OSError, ValueError):
        return None


# ---------------------------------------------------------------- settings
def settings():
    """The remembered choices: {'dir', 'recent': [...], 'keep', 'mode', 'dtype', 'dt', 'netlist'}."""
    s = _read_json(home() / 'settings.json')
    r = s.get('study') if isinstance(s, dict) else None
    r = r if isinstance(r, dict) else {}
    rec = [x for x in r.get('recent', []) if isinstance(x, str)][:12]
    return {'dir': r.get('dir') if isinstance(r.get('dir'), str) else None, 'recent': rec,
            'keep': int(r['keep']) if isinstance(r.get('keep'), int) and 1 <= r['keep'] <= 1000 else KEEP,
            'mode': r.get('mode') if r.get('mode') in ('all', 'sim', 'scope') else 'all',
            'dtype': 'float32' if r.get('dtype') == 'float32' else 'float64',
            'dt': float(r['dt']) if isinstance(r.get('dt'), (int, float)) and r['dt'] > 0 else 0.0,
            'netlist': bool(r.get('netlist'))}


def save_settings(**kw):
    p = home() / 'settings.json'
    s = _read_json(p)
    s = s if isinstance(s, dict) else {}
    r = settings()
    for k, v in kw.items():
        if k in ('dir', 'keep', 'mode', 'dtype', 'dt', 'netlist'):
            r[k] = v
    if kw.get('dir'):
        r['recent'] = [kw['dir']] + [x for x in r['recent'] if x != kw['dir']][:11]
    s['study'] = settings_clean(r)
    home().mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(s, ensure_ascii=False, indent=1), encoding='utf-8')
    return settings()


def settings_clean(r):
    return {'dir': r.get('dir'), 'recent': r.get('recent', [])[:12], 'keep': int(r.get('keep') or KEEP), 'mode': r.get('mode', 'all'),
            'dtype': r.get('dtype', 'float64'), 'dt': float(r.get('dt') or 0), 'netlist': bool(r.get('netlist'))}


# ---------------------------------------------------------------- the study and its runs
def folder(path, create=False):
    """A study folder the user chose (absolute, a directory, writable), or the default one under ~/.pcl/studies."""
    from . import recording
    return recording.user_folder(path, create)


def default_folder(title):
    d = home() / 'studies' / _safe(title)
    d.mkdir(parents=True, exist_ok=True)
    return d.resolve()


def open_study(path=None, title='', create=False):
    """The study of a folder (study.json made the first time). Returns its description with the runs."""
    d = folder(path, create) if path else default_folder(title or 'study')
    sj = d / 'study.json'
    st = _read_json(sj)
    if not (isinstance(st, dict) and st.get('format') == 'pcl-study'):
        from . import __version__
        st = {'format': 'pcl-study', 'version': FORMAT, 'id': str(uuid.uuid4()), 'created': now_iso(), 'title': str(title or d.name)[:200],
              'tool': {'name': 'Power & Control Lab', 'version': __version__}}
        _write_json(sj, st)
    return {**st, 'path': str(d), 'runs': list_runs(d)}


def _study_dir(path):
    d = folder(path)
    if not (d / 'study.json').is_file():
        raise ValueError('Ο φάκελος δεν είναι φάκελος μελέτης (λείπει το study.json).')
    return d


def _run_dir(study, run):
    d = _study_dir(study)
    if not isinstance(run, str) or not RUN.fullmatch(run):
        raise ValueError('Μη έγκυρο τρέξιμο.')
    r = (d / run).resolve()
    if r.parent != (d / 'runs').resolve() or not (r / 'run.json').is_file():
        raise ValueError('Το τρέξιμο δεν υπάρχει.')
    return r


def list_runs(d):
    out = []
    for r in sorted((Path(d) / 'runs').glob('*-*-*')):
        j = _read_json(r / 'run.json')
        if not isinstance(j, dict) or j.get('format') != 'pcl-run':
            continue
        di = j.get('data') or {}
        rb = di.get('rowBytes') or 0
        f = r / (di.get('file') or 'data.f64')
        rows = f.stat().st_size // rb if rb and f.exists() else 0
        out.append({'run': 'runs/' + r.name, 'n': j.get('n'), 'title': j.get('title'), 'status': j.get('status'), 'started': j.get('started'),
                    'finished': j.get('finished'), 'tag': j.get('tag'), 'channels': di.get('cols', 1) - 1, 'rows': rows,
                    'bytes': f.stat().st_size if f.exists() else 0, 'source': j.get('source')})
    return out


def _prune(d, keep):
    runs = list_runs(d)
    old = [r for r in runs if not r.get('tag') and r.get('status') != 'running']
    for r in old[:max(0, len(runs) - keep + 1)]:
        shutil.rmtree(Path(d) / r['run'], ignore_errors=True)


def project_hash(project):
    return hashlib.sha256(json.dumps(project, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode()).hexdigest()


def begin_run(study, project, title='', source='page', solver=None, data=None, tutorial=None, keep=None):
    """A new run folder: run.json with status 'running', project.json, and the line models of the project in the folder.
    data: the descriptor of the rows (study.js dataInfo: file, dtype, cols, rowBytes, dt, mode). Returns {'run', 'path',
    'n', 'models'}."""
    from . import __version__
    d = _study_dir(study)
    if not isinstance(project, dict):
        raise ValueError('Λείπει το έργο.')
    di = dict(data or {})
    if di.get('dtype') not in ('float64', 'float32') or not isinstance(di.get('cols'), int) or di['cols'] < 1:
        raise ValueError('Μη έγκυρη περιγραφή των δεδομένων.')
    di['file'] = 'data.f32' if di['dtype'] == 'float32' else 'data.f64'
    di['rowBytes'] = di['cols'] * (4 if di['dtype'] == 'float32' else 8)
    di['order'] = 'little'
    (d / 'runs').mkdir(exist_ok=True)
    st = _read_json(d / 'study.json') or {}
    # the number of a run is never used again (the study keeps the last one it gave, a pruned run leaves a gap)
    n = 1 + max([int(r.name.split('-')[0]) for r in (d / 'runs').glob('*-*-*') if r.name.split('-')[0].isdigit()] + [int(st.get('last') or 0)])
    _prune(d, keep or settings()['keep'])
    name = f'{n:04d}-' + time.strftime('%Y%m%d-%H%M%S')
    r = d / 'runs' / name
    r.mkdir()
    st['last'] = n
    _write_json(d / 'study.json', st)
    models = [store_line_model(d, m) for m in line_models_of(project)]
    j = {'format': 'pcl-run', 'version': FORMAT, 'id': str(uuid.uuid4()), 'study': st.get('id'), 'n': n, 'title': str(title or '')[:200],
         'status': 'running', 'started': now_iso(), 'finished': None, 'source': source,
         'tool': {'name': 'Power & Control Lab', 'version': __version__},
         'project': {'file': 'project.json', 'hash': project_hash(project), 'tutorial': tutorial},
         'models': [m for m in models if m], 'solver': solver or {}, 'data': di, 'progress': {'t': None, 'rows': 0}}
    _write_json(r / 'project.json', project)
    _write_json(r / 'run.json', j)
    for f in (di['file'], 'events.jsonl', 'log.jsonl'):          # the same files in every run, empty until something comes
        (r / f).write_bytes(b'')
    return {'run': 'runs/' + name, 'path': str(r), 'n': n, 'models': j['models'], 'data': di}


def put(study, run, name, obj=None, text=None):
    r = _run_dir(study, run)
    if name not in PUT_NAMES:
        raise ValueError('Μη επιτρεπτό αρχείο τρεξίματος.')
    if name.endswith('.json'):
        s = json.dumps(obj, ensure_ascii=False, indent=None if name == 'netlist.json' else 1, allow_nan=False, default=str)
    else:
        s = str(text if text is not None else '')
    if len(s) > MAX_PUT:
        raise ValueError('Πολύ μεγάλο αρχείο.')
    tmp = r / (name + '.tmp')
    tmp.write_text(s, encoding='utf-8')
    os.replace(tmp, r / name)
    if name == 'netlist.json':
        j = _read_json(r / 'run.json')
        j['netlist'] = {'file': 'netlist.json', 'text': 'netlist.txt', 'hash': hashlib.sha256(s.encode()).hexdigest()}
        _write_json(r / 'run.json', j)
    return {'name': name, 'bytes': len(s.encode())}


def append(study, run, data):
    """Rows at the end of the data file of a running run (whole rows only)."""
    r = _run_dir(study, run)
    j = _read_json(r / 'run.json')
    if j.get('status') != 'running':
        raise ValueError('Το τρέξιμο έχει τελειώσει.')
    di = j['data']
    if not isinstance(data, (bytes, bytearray)) or len(data) % di['rowBytes'] or len(data) > MAX_APPEND:
        raise ValueError('Τα δεδομένα δεν είναι ακέραιο πλήθος γραμμών.')
    with open(r / di['file'], 'ab') as f:
        f.write(data)
        size = f.tell()
    return {'rows': size // di['rowBytes'], 'bytes': size}


def append_lines(study, run, which, rows):
    r = _run_dir(study, run)
    if which not in ('events', 'log') or not isinstance(rows, list) or len(rows) > 200000:
        raise ValueError('Μη έγκυρες γραμμές.')
    with open(r / f'{which}.jsonl', 'a', encoding='utf-8') as f:
        for x in rows:
            f.write(json.dumps(x, ensure_ascii=False, default=str) + '\n')
    return {'n': len(rows)}


def end_run(study, run, status='done', stats=None, error=None):
    """The run ends: its status and statistics in run.json, and the summary as an HTML page."""
    r = _run_dir(study, run)
    j = _read_json(r / 'run.json')
    j['status'] = status if status in ('done', 'stopped', 'error') else 'done'
    j['finished'] = now_iso()
    if error:
        j['error'] = str(error)[:2000]
    if isinstance(stats, dict):
        j['stats'] = stats
    di = j['data']
    f = r / di['file']
    rows = f.stat().st_size // di['rowBytes'] if f.exists() else 0
    j['progress'] = {'rows': rows, 't': _last_t(f, di, rows)}
    _write_json(r / 'run.json', j)
    try:
        (r / 'summary.html').write_text(summary_html(r), encoding='utf-8')
    except Exception as e:          # the summary is a convenience: a failure in it never loses the run
        (r / 'summary.html').write_text(f'<!doctype html><meta charset="utf-8"><p>{html.escape(str(e))}</p>', encoding='utf-8')
    return {'run': run, 'status': j['status'], 'rows': rows}


def tag_run(study, run, tag):
    r = _run_dir(study, run)
    j = _read_json(r / 'run.json')
    j['tag'] = str(tag)[:80] if tag else None
    _write_json(r / 'run.json', j)
    return {'run': run, 'tag': j['tag']}


def _last_t(f, di, rows):
    if not rows:
        return None
    import numpy as np
    w = di['rowBytes']
    with open(f, 'rb') as fh:
        fh.seek((rows - 1) * w)
        b = fh.read(4 if di['dtype'] == 'float32' else 8)
    return float(np.frombuffer(b, '<f4' if di['dtype'] == 'float32' else '<f8')[0])


# ---------------------------------------------------------------- line models by the hash of their key
def line_hash(src):
    return hashlib.sha256(str(src).encode('utf-8')).hexdigest()


def line_models_of(project):
    """The parts TLM of a project at every level (and in its subcircuits) with a model: [{cid, label, src, mdl, data, len, f}]."""
    out = []

    def walk(comps, pre):
        for c in comps or []:
            if not isinstance(c, dict):
                continue
            p = c.get('params') or {}
            if c.get('type') == 'TLM' and isinstance(p.get('mdl'), str):
                try:
                    m = json.loads(p['mdl'])
                except ValueError:
                    m = None
                if isinstance(m, dict) and m.get('src'):
                    out.append({'cid': pre + str(c.get('id')), 'label': c.get('label') or c.get('id'), 'src': m['src'], 'mdl': m,
                                'model': m.get('type'), 'data': p.get('data'), 'len': p.get('len'), 'f': p.get('f')})
    walk(project.get('components'), '')
    for name, sub in (project.get('subcircuits') or {}).items():
        if isinstance(sub, dict):
            walk(sub.get('components'), f'{name}:')
    return out


def _model_dir(d, src):
    h = line_hash(src)[:12]
    for q in (Path(d) / 'models' / 'lines').glob(f'*_{h}'):
        inp = _read_json(q / 'input.json')
        if isinstance(inp, dict) and inp.get('src') == src:
            return q
    return None


def lookup_line_model(study, src):
    """The model of the key src kept in the study folder, or None: {'mdl', 'report', 'curves', 'cached': True, 'dir'}."""
    try:
        d = _study_dir(study) if not isinstance(study, Path) else study
    except ValueError:
        return None
    q = _model_dir(d, src)
    if not q:
        return None
    res = _read_json(q / 'result.json')
    mdl = _read_json(q / 'model.json')
    if not isinstance(mdl, dict) or mdl.get('src') != src:
        return None
    out = res if isinstance(res, dict) and isinstance(res.get('mdl'), dict) else {'mdl': mdl, 'report': None, 'curves': None}
    out['mdl'] = mdl
    out['cached'] = True
    out['dir'] = str(q.relative_to(d))
    return out


def store_line_model(study, item, result=None):
    """A line model in the folder, once per key: input.json, model.json, result.json (when the report and the curves come
    with it), the file of the EMTP and report.txt. Returns {'cid', 'label', 'hash', 'dir', 'type', 'new'}."""
    d = study if isinstance(study, Path) else _study_dir(study)
    mdl = (result or {}).get('mdl') if result else item.get('mdl')
    src = item.get('src') or (mdl or {}).get('src')
    if not isinstance(mdl, dict) or not src:
        return None
    h = line_hash(src)
    q = _model_dir(d, src)
    new = q is None
    if new:
        q = Path(d) / 'models' / 'lines' / f'{_safe(item.get("label") or item.get("cid") or "line", 30)}_{h[:12]}'
        q.mkdir(parents=True, exist_ok=True)
        _write_json(q / 'model.json', mdl)
        emtp, note = _emtp_file(q, item, mdl)
        _write_json(q / 'input.json', {'format': 'pcl-line-model', 'version': FORMAT, 'src': src, 'hash': h, 'label': item.get('label'),
                                       'cid': item.get('cid'), 'type': mdl.get('type') or item.get('model'), 'created': now_iso(),
                                       'emtp': emtp, 'emtp_note': note})
        (q / 'report.txt').write_text(_model_report(item, mdl, emtp), encoding='utf-8')
    if result and not (q / 'result.json').exists():
        _write_json(q / 'result.json', result)
    return {'cid': item.get('cid'), 'label': item.get('label'), 'hash': h, 'dir': str(q.relative_to(d)).replace('\\', '/'),
            'type': mdl.get('type') or item.get('model'), 'new': new}


def _emtp_file(q, item, mdl):
    """The model in the format of the EMTP (pcl/linereport.py, pcl/wideband.py): (file name, note)."""
    lab = _safe(item.get('label') or 'line', 30)
    try:
        from pcl import linereport, wideband
        t = mdl.get('type')
        if t == 'wb':
            name, text = f'{lab}_WB.mod', wideband.write_wb_mod(mdl)
        elif t == 'fd' or mdl.get('modes') and all(m.get('fd') for m in mdl['modes']):
            name, text = f'{lab}_FD.mod', linereport.write_fd_mod(mdl)
        elif t == 'pi':
            data = json.loads(item['data']) if isinstance(item.get('data'), str) else item.get('data')
            name, text = f'{lab}_Nominal_PI.mod', linereport.write_nominal_pi(data, float(mdl.get('f') or 50.0), float(mdl.get('length')))
        else:
            name, text = f'{lab}_CP.net', linereport.write_cp_netlist(mdl, name=lab)
        (q / name).write_text(text, encoding='utf-8')
        return name, None
    except Exception as e:           # a model the writers do not take: model.json is what the solver reads anyway
        return None, f'{type(e).__name__}: {e}'[:300]


def _model_report(item, mdl, emtp):
    L = [f'Μοντέλο γραμμής «{item.get("label")}» ({item.get("cid")})', f'Είδος: {mdl.get("type") or "cp"} · αγωγοί/ρυθμοί M = {mdl.get("M")}']
    if mdl.get('length') is not None:
        L.append(f'Μήκος: {mdl.get("length")} km')
    for i, m in enumerate(mdl.get('modes') or []):
        if not isinstance(m, dict):
            continue
        s = f'  ρυθμός {i + 1}: τ = {m.get("tau")} s'
        if m.get('Zc') is not None:
            s += f', Z_c = {m.get("Zc")} Ω'
        if isinstance(m.get('kr'), dict):
            s += f', πόλοι Z_c: {len(m["kr"].get("p") or [])}'
        if isinstance(m.get('ka'), dict):
            s += f', πόλοι A: {len(m["ka"].get("p") or [])}'
        L.append(s)
    for g in mdl.get('groups') or []:
        if isinstance(g, dict):
            L.append(f'  ομάδα: τ = {g.get("tau")} s, {len(g.get("p") or [])} πόλοι')
    for k in ('err', 'errYc', 'errH', 'passive', 'fit'):
        if k in mdl and not isinstance(mdl[k], (list, dict)):
            L.append(f'{k}: {mdl[k]}')
    L.append(f'Αρχείο του EMTP: {emtp}' if emtp else 'Αρχείο του EMTP: —')
    L.append(f'Κλειδί (SHA-256): {line_hash(mdl.get("src"))}')
    return '\n'.join(L) + '\n'


# ---------------------------------------------------------------- the summary page of a run
def summary_html(r):
    """A page of one file (no outside resources), like the HTML page of a run of the EMTP: the files, the network, the
    solver, the start, the timers, the messages."""
    e = html.escape
    j = _read_json(r / 'run.json') or {}
    sm = _read_json(r / 'summary.json') or {}
    ch = _read_json(r / 'channels.json') or []
    di = j.get('data') or {}
    files = [(f.name, f.stat().st_size) for f in sorted(r.iterdir()) if f.is_file() and not f.name.endswith('.tmp')]
    num = lambda v: e(f'{v:.6g}') if isinstance(v, (int, float)) and not isinstance(v, bool) else e(str(v if v is not None else '—'))
    tab = lambda rows, head=None: ('<table>' + (('<tr>' + ''.join(f'<th>{e(h)}</th>' for h in head) + '</tr>') if head else '') +
                                   ''.join('<tr>' + ''.join(f'<td>{c}</td>' for c in row) + '</tr>' for row in rows) + '</table>')
    st = j.get('stats') or {}
    out = ['<!doctype html><html lang="el"><head><meta charset="utf-8"><title>', e(f'Τρέξιμο {j.get("n")} · {j.get("title") or ""}'), '</title><style>',
           'body{font:14px/1.45 system-ui,sans-serif;margin:24px;color:#222;max-width:1100px}table{border-collapse:collapse;margin:6px 0 14px}',
           'td,th{border:1px solid #ccc;padding:3px 8px;text-align:left;vertical-align:top}th{background:#f2f2f2}h1{font-size:20px}h2{font-size:16px;margin-top:22px}',
           '.bad{color:#b00}.muted{color:#777}</style></head><body>',
           f'<h1>Τρέξιμο {e(str(j.get("n")))} · {e(j.get("title") or "")}</h1>',
           tab([['Κατάσταση', e(str(j.get('status')))], ['Αρχή', e(str(j.get('started')))], ['Τέλος', e(str(j.get('finished')))],
                ['Από', e(str(j.get('source')))], ['Εργαλείο', e(f'{(j.get("tool") or {}).get("name")} {(j.get("tool") or {}).get("version")}')],
                ['Ταυτότητα', e(str(j.get('id')))], ['Κατακερματισμός έργου', e(str((j.get('project') or {}).get('hash')))]])]
    if j.get('error'):
        out.append(f'<p class="bad">{e(j["error"])}</p>')
    out.append('<h2>Αρχεία</h2>' + tab([[f'<a href="{e(n)}">{e(n)}</a>', num(b)] for n, b in files], ['Αρχείο', 'bytes']))
    out.append('<h2>Καταγραφή</h2>' + tab([['Κανάλια', num(len(ch))], ['Γραμμές', num((j.get('progress') or {}).get('rows'))],
                                          ['Τελευταία χρονική στιγμή', num((j.get('progress') or {}).get('t'))], ['Ακρίβεια', e(str(di.get('dtype')))],
                                          ['Ανάλυση', num(di.get('dt')) + ' s' if di.get('dt') else 'κάθε βήμα'], ['Τι', e(str(di.get('mode')))]]))
    if j.get('models'):
        out.append('<h2>Μοντέλα γραμμής</h2>' + tab([[e(str(m.get('label'))), e(str(m.get('type'))), e(str(m.get('dir'))), e(str(m.get('hash'))[:16])]
                                                     for m in j['models']], ['Γραμμή', 'Είδος', 'Φάκελος', 'Κλειδί']))
    if sm:
        out.append('<h2>Το δίκτυο</h2>' + tab([['Άγνωστοι', num(sm.get('unknowns'))], ['Κόμβοι', num(sm.get('nodes'))], ['Μπλοκ σημάτων', num(sm.get('blocks'))],
                                               ['Κανάλια', num(sm.get('channels'))]]))
        out.append(tab([[e(k), num(v)] for k, v in sorted((sm.get('parts') or {}).items())], ['Στοιχείο του σχεδίου', 'Πλήθος']))
        out.append(tab([[e(k), num(v)] for k, v in sorted((sm.get('elements') or {}).items())], ['Στοιχείο του πίνακα', 'Πλήθος']))
        so = sm.get('solver') or {}
        out.append('<h2>Ο λύτης</h2>' + tab([[e(k), num(so.get(k))] for k in ('kind', 'refac', 'kernel', 'method', 'step', 'h', 'T', 'nnzA', 'nnzLU')]))
        if so.get('proposal'):
            out.append(f'<p class="muted">{e(so["proposal"])}</p>')
        nodes = (sm.get('start') or {}).get('nodes') or []
        if nodes:
            out.append('<h2>Τάσεις κόμβων στην αρχή</h2>' + tab([[e(str(n)), num(v)] for n, v in nodes], ['Κόμβος', 'V']))
        if sm.get('warnings'):
            out.append('<h2>Προειδοποιήσεις</h2><ul>' + ''.join(f'<li>{e(w)}</li>' for w in sm['warnings']) + '</ul>')
    if st:
        out.append('<h2>Στατιστικά και χρόνοι</h2>' + tab([[e(k), num(v)] for k, v in st.items() if not isinstance(v, (list, dict))]))
    log = []
    try:
        with open(r / 'log.jsonl', encoding='utf-8') as f:
            log = [json.loads(x) for x in f][-400:]
    except (OSError, ValueError):
        pass
    if log:
        out.append('<h2>Μηνύματα</h2>' + tab([[e(str(x.get('level', ''))), e(str(x.get('msg', '')))] for x in log], ['Είδος', 'Μήνυμα']))
    out.append('</body></html>')
    return ''.join(out)


# ---------------------------------------------------------------- reading back: a run, a file of the EMTP, of PSCAD, a CSV
class Source:
    """What the viewer and pcl.results read: info() and the arrays t, column(key)."""
    kind = ''

    def info(self):
        raise NotImplementedError

    def arrays(self):
        """(t, {key: column index}, getter(index) → array)"""
        raise NotImplementedError


class RunSource(Source):
    kind = 'run'

    def __init__(self, r):
        self.dir = Path(r)
        self.j = _read_json(self.dir / 'run.json')
        if not isinstance(self.j, dict) or self.j.get('format') != 'pcl-run':
            raise ValueError('Δεν είναι τρέξιμο φακέλου μελέτης.')
        self.ch = _read_json(self.dir / 'channels.json') or []
        self.di = self.j['data']

    def _mm(self):
        import numpy as np
        f = self.dir / self.di['file']
        rows = f.stat().st_size // self.di['rowBytes'] if f.exists() else 0
        if not rows:
            return np.zeros((0, self.di['cols']))
        return np.memmap(f, dtype='<f4' if self.di['dtype'] == 'float32' else '<f8', mode='r', shape=(rows, self.di['cols']))

    def info(self):
        A = self._mm()
        return {'kind': 'run', 'path': str(self.dir), 'title': self.j.get('title'), 'n': self.j.get('n'), 'status': self.j.get('status'),
                'started': self.j.get('started'), 'finished': self.j.get('finished'), 'channels': self.ch, 'rows': int(A.shape[0]),
                't0': float(A[0, 0]) if A.shape[0] else None, 't1': float(A[-1, 0]) if A.shape[0] else None, 'data': self.di,
                'tag': self.j.get('tag'), 'events': (self.dir / 'events.jsonl').exists()}

    def arrays(self):
        A = self._mm()
        return A[:, 0], {c['key']: c['i'] for c in self.ch}, lambda i: A[:, i]

    def events(self, n=2000):
        try:
            with open(self.dir / 'events.jsonl', encoding='utf-8') as f:
                rows = [json.loads(x) for x in f]
        except (OSError, ValueError):
            rows = []
        return {'rows': rows[-n:], 'n': len(rows)}


EMTP_UNIT = {'v': 'V', 'i': 'A', 'p': 'W'}


class EmtpSource(Source):
    """The plot file of the EMTP: <name>m.m (the columns by group, MATLAB syntax) and the binary <name>.mda (rows of
    float64 in Fortran records, a 4-byte length before and after each). Frequency files (f=1) give magnitude and angle."""
    kind = 'emtp'

    def __init__(self, p):
        import numpy as np
        self.path = Path(p)
        txt = self.path.read_text(encoding='latin-1')
        var, names = {}, {}
        for line in txt.splitlines():
            line = line.strip().rstrip(';')
            m = re.fullmatch(r"(\w+)='([^']*)'", line)
            if m:
                k, v = m.groups()
                if k.startswith('N') and k not in ('Ntime',) and k[1:]:
                    names[k[1:]] = [v]
                else:
                    var[k] = v
                continue
            m = re.fullmatch(r"N(\w+)=strvcat\(N\w+,'([^']*)'\)", line)
            if m:
                names.setdefault(m.group(1), []).append(m.group(2))
                continue
            m = re.fullmatch(r'(\w+)=(\d+):(\d+):(\d+)', line)
            if m:
                var[m.group(1)] = list(range(int(m.group(2)), int(m.group(4)) + 1, int(m.group(3))))
                continue
            m = re.fullmatch(r'(\w+)=([-+0-9.eEdD]+)', line)
            if m:
                var[m.group(1)] = m.group(2)
        n = int(var.get('n_scopes', 0))
        if not n or 'filn' not in var:
            raise ValueError('Δεν μοιάζει με αρχείο αποτελεσμάτων του EMTP (<όνομα>m.m).')
        self.freq = var.get('f') == '1'
        self.ch, self.col = [], {}
        for grp, nm in names.items():
            for suffix, unit_kind in (('', ''), ('mag', ' μέτρο'), ('ang', ' γωνία')):
                cols = var.get(grp + suffix)
                if not isinstance(cols, list):
                    continue
                for name, c in zip(nm, cols):
                    if grp in ('time', 'frequency'):
                        continue
                    key = f'{grp}{suffix}:{name}'
                    unit = 'deg' if suffix == 'ang' else ('' if grp == 'control' else EMTP_UNIT.get(grp[0], ''))
                    self.col[key] = c - 1
                    self.ch.append({'i': c - 1, 'key': key, 'name': name + unit_kind, 'unit': unit, 'kind': grp + suffix, 'comp': name,
                                    'type': grp, 'label': name})
        self.ch.sort(key=lambda c: c['i'])
        self.data = self.path.with_name(var['filn'])
        if not self.data.is_file():
            raise ValueError(f'Λείπει το δυαδικό αρχείο {var["filn"]} δίπλα στο {self.path.name}.')
        prec = var.get('precision', 'float64')
        bw = 4 if prec == 'float32' else 8
        size = self.data.stat().st_size
        rec = n * bw + 8
        if size % rec:
            raise ValueError('Το .mda δεν έχει ακέραιο πλήθος γραμμών του n_scopes.')
        dt = np.dtype([('a', '<i4'), ('d', '<f4' if bw == 4 else '<f8', (n,)), ('b', '<i4')])
        mm = np.memmap(self.data, dtype=dt, mode='r')
        if len(mm) and not (int(mm['a'][0]) == n * bw and int(mm['b'][0]) == n * bw):
            raise ValueError('Το .mda δεν έχει τη μορφή των εγγραφών Fortran που περιμέναμε.')
        self.A = mm['d']
        self.n = n

    def info(self):
        A = self.A
        return {'kind': 'emtp', 'path': str(self.path), 'title': self.path.stem, 'status': 'done', 'channels': self.ch, 'rows': int(A.shape[0]),
                't0': float(A[0, 0]) if len(A) else None, 't1': float(A[-1, 0]) if len(A) else None, 'x': 'f' if self.freq else 't'}

    def arrays(self):
        A = self.A
        return A[:, 0], dict(self.col), lambda i: A[:, i]


class PscadSource(Source):
    """The legacy output of EMTDC: <name>.inf (a line per output channel: PGB(n) Output Desc="…" Group="…" Max= Min=
    Units="…") and the text files <name>.out, or <name>_01.out, _02.out … with at most 10 channels after the time."""
    kind = 'pscad'
    LINE = re.compile(r'PGB\((\d+)\)\s+Output\s+(.*)')

    def __init__(self, p):
        import numpy as np
        self.path = Path(p)
        self.ch = []
        for line in self.path.read_text(encoding='latin-1').splitlines():
            m = self.LINE.match(line.strip())
            if not m:
                continue
            k = int(m.group(1))
            f = dict(re.findall(r'(\w+)=("[^"]*"|\S+)', m.group(2)))
            g = lambda x: (f.get(x) or '').strip('"')
            self.ch.append({'i': k, 'key': f'PGB{k}:{g("Desc")}', 'name': g('Desc') or f'PGB({k})', 'unit': g('Units'), 'kind': g('Group'),
                            'comp': g('Group'), 'type': 'PSCAD', 'label': g('Desc')})
        if not self.ch:
            raise ValueError('Δεν μοιάζει με αρχείο .inf του PSCAD (γραμμές PGB(n) Output …).')
        one = self.path.with_suffix('.out')
        parts = [one] if one.is_file() else sorted(self.path.parent.glob(self.path.stem + '_*.out'),
                                                     key=lambda q: [int(x) for x in re.findall(r'\d+', q.stem[len(self.path.stem):])])
        if not parts:
            raise ValueError('Λείπουν τα αρχεία .out δίπλα στο .inf.')
        blocks = [_numeric_table(q) for q in parts]
        nmin = min(len(b) for b in blocks)
        cols = [blocks[0][:nmin, 0]]
        for b in blocks:
            cols.extend(b[:nmin, c] for c in range(1, b.shape[1]))
        self.A = np.column_stack(cols) if cols else np.zeros((0, 1))
        self.ch = [c for c in self.ch if c['i'] < self.A.shape[1]]

    def info(self):
        A = self.A
        return {'kind': 'pscad', 'path': str(self.path), 'title': self.path.stem, 'status': 'done', 'channels': self.ch, 'rows': int(A.shape[0]),
                't0': float(A[0, 0]) if len(A) else None, 't1': float(A[-1, 0]) if len(A) else None}

    def arrays(self):
        A = self.A
        return A[:, 0], {c['key']: c['i'] for c in self.ch}, lambda i: A[:, i]


def _numeric_table(q):
    """The numeric rows of a text file (whitespace, comma or semicolon), skipping the lines that are not numbers."""
    import numpy as np
    rows, n = [], None
    with open(q, encoding='latin-1') as f:
        for line in f:
            s = line.strip()
            if not s or s[0] == '#':
                continue
            parts = re.split(r'[,;\s]+', s)
            try:
                v = [float(x) for x in parts if x]
            except ValueError:
                continue
            if n is None:
                n = len(v)
            if len(v) == n:
                rows.append(v)
    return np.array(rows, dtype=float) if rows else np.zeros((0, 1))


class CsvSource(Source):
    """A CSV with a header (the first column the time): the recordings of the scope, Result.to_csv, exports of other
    programs. Lines starting with # are comments."""
    kind = 'csv'

    def __init__(self, p):
        import numpy as np
        self.path = Path(p)
        head = None
        with open(self.path, encoding='utf-8-sig', errors='replace') as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    head = line.rstrip('\r\n')
                    break
        if head is None:
            raise ValueError('Άδειο CSV.')
        sep = ';' if head.count(';') > head.count(',') else (',' if ',' in head else None)
        names = [x.strip().strip('"') for x in (head.split(sep) if sep else head.split())]
        try:
            [float(x) for x in names]
            numeric_head = True
        except ValueError:
            numeric_head = False
        A = _numeric_table(self.path)
        if numeric_head:
            names = ['t'] + [f'c{i}' for i in range(1, A.shape[1])]
        self.A = A
        self.ch = [{'i': i, 'key': nm or f'c{i}', 'name': nm or f'c{i}', 'unit': _csv_unit(nm), 'kind': '', 'comp': '', 'type': 'CSV', 'label': nm}
                   for i, nm in enumerate(names) if 0 < i < A.shape[1]]

    def info(self):
        A = self.A
        return {'kind': 'csv', 'path': str(self.path), 'title': self.path.stem, 'status': 'done', 'channels': self.ch, 'rows': int(A.shape[0]),
                't0': float(A[0, 0]) if len(A) else None, 't1': float(A[-1, 0]) if len(A) else None}

    def arrays(self):
        A = self.A
        return A[:, 0], {c['key']: c['i'] for c in self.ch}, lambda i: A[:, i]


def _csv_unit(name):
    m = re.search(r'\(([^()]*)\)\s*$', name or '')
    return m.group(1) if m else ''


def source(path):
    """The source at an absolute path: a run folder, a study folder (its last run), <name>m.m of the EMTP, <name>.inf of
    PSCAD or a CSV. The files that do not grow are parsed once while they do not change."""
    if not isinstance(path, str) or not path.strip() or '\x00' in path:
        raise ValueError('Δώσε μια διαδρομή.')
    p = Path(os.path.expanduser(path.strip()))
    if not p.is_absolute():
        raise ValueError('Η διαδρομή πρέπει να είναι πλήρης.')
    if p.is_dir():
        if (p / 'run.json').is_file():
            return RunSource(p)
        if (p / 'study.json').is_file():
            runs = list_runs(p)
            if not runs:
                raise ValueError('Ο φάκελος μελέτης δεν έχει ακόμη τρέξιμο.')
            return RunSource(p / runs[-1]['run'])
        raise ValueError('Ο φάκελος δεν είναι φάκελος μελέτης ούτε τρέξιμο.')
    if not p.is_file():
        raise ValueError('Το αρχείο δεν υπάρχει.')
    st = p.stat()
    stamp = (st.st_size, st.st_mtime_ns)
    hit = _idx.get(str(p))
    if hit and hit[0] == stamp:
        return hit[1]
    low = p.name.lower()
    if low.endswith('.m'):
        s = EmtpSource(p)
    elif low.endswith('.inf'):
        s = PscadSource(p)
    elif low.endswith(('.csv', '.txt', '.dat', '.out')):
        s = CsvSource(p)
    else:
        raise ValueError('Άγνωστο είδος αρχείου (φάκελος μελέτης, <όνομα>m.m του EMTP, .inf του PSCAD ή CSV).')
    if len(_idx) > 16:
        _idx.clear()
    _idx[str(p)] = (stamp, s)
    return s


def read_range(src, t0, t1, keys=None, n=1000):
    """The samples of [t0, t1] for the keys: the rows themselves when they are at most 2n, otherwise per pixel column the
    first, minimum, maximum, mean and last value (the same answer as engine/recording.py read_range)."""
    import numpy as np
    t0, t1, n = float(t0), float(t1), max(2, min(int(n), 20000))
    if not t1 > t0:
        raise ValueError('Μη έγκυρο διάστημα.')
    t, col, get = src.arrays()
    want = [k for k in (keys or list(col)) if k in col]
    if not len(t) or t1 < t[0] or t0 > t[-1]:
        return {'t0': t0, 't1': t1, 'rows': 0, 'raw': True, 't': [], 'cols': {k: {'v': []} for k in want},
                'have': [float(t[0]), float(t[-1])] if len(t) else [None, None]}
    a = int(np.searchsorted(t, t0, side='left'))
    b = int(np.searchsorted(t, t1, side='right'))
    lo, hi = max(0, a - 1), min(len(t), b + 1)        # one sample on each side, so that a trace reaches the edges
    cols = {k: np.asarray(get(col[k])[lo:hi], dtype=float) for k in want}
    out = _reduce(np.asarray(t[lo:hi], dtype=float), cols, t0, t1, n)
    out['have'] = [float(t[0]), float(t[-1])]
    return out


def read_diff(a, ka, b, kb, t0, t1, n=1000):
    """A − B on the times of A in [t0, t1], B interpolated linearly (np.interp), at the full resolution of the files,
    then reduced per pixel column as read_range: the difference of two runs, of a run and a file of the EMTP or PSCAD."""
    import numpy as np
    t0, t1, n = float(t0), float(t1), max(2, min(int(n), 20000))
    ta, ca, ga = a.arrays()
    tb, cb, gb = b.arrays()
    if ka not in ca or kb not in cb:
        raise ValueError('Άγνωστο κανάλι για τη διαφορά.')
    if not len(ta) or not len(tb):
        return {'t0': t0, 't1': t1, 'rows': 0, 'raw': True, 't': [], 'cols': {'d': {'v': []}}}
    i0 = max(0, int(np.searchsorted(ta, t0, side='left')) - 1)
    i1 = min(len(ta), int(np.searchsorted(ta, t1, side='right')) + 1)
    tt = np.asarray(ta[i0:i1], dtype=float)
    va = np.asarray(ga(ca[ka])[i0:i1], dtype=float)
    tbf = np.asarray(tb, dtype=float)
    vb = np.interp(tt, tbf, np.asarray(gb(cb[kb]), dtype=float), left=np.nan, right=np.nan)
    d = va - vb
    out = _reduce(tt, {'d': d}, t0, t1, n)
    fin = np.isfinite(d) & (tt >= t0) & (tt <= t1)
    ref = np.nanmax(np.abs(va[fin])) if fin.any() else 0.0
    out['stats'] = {'max': float(np.nanmax(np.abs(d[fin]))) if fin.any() else None, 'rms': float(np.sqrt(np.nanmean(d[fin] ** 2))) if fin.any() else None,
                    'ref': float(ref), 'n': int(fin.sum())}
    return out


def _reduce(tt, cols, t0, t1, n):
    import numpy as np
    clean = lambda a: [None if not np.isfinite(x) else float(x) for x in a]
    out = {'t0': t0, 't1': t1, 'rows': int(len(tt)), 'raw': True, 't': [], 'cols': {}}
    if len(tt) <= 2 * n:
        out['t'] = tt.tolist()
        out['cols'] = {k: {'v': clean(v)} for k, v in cols.items()}
        return out
    out['raw'] = False
    inside = (tt >= t0) & (tt <= t1)
    tt = tt[inside]
    edges = np.linspace(t0, t1, n + 1)
    bi = np.clip(np.searchsorted(edges, tt, side='right') - 1, 0, n - 1)
    starts = np.searchsorted(bi, np.arange(n), side='left')
    ends = np.searchsorted(bi, np.arange(n), side='right')
    has = ends > starts
    idx = np.nonzero(has)[0]
    out['has'] = has.astype(int).tolist()
    out['tf'] = [float(tt[s]) if h else None for s, h in zip(starts, has)]
    out['tl'] = [float(tt[e - 1]) if h else None for e, h in zip(ends, has)]
    for k, v0 in cols.items():
        v = v0[inside]
        mn, mx, av = np.full(n, np.nan), np.full(n, np.nan), np.full(n, np.nan)
        if len(idx):
            mn[idx] = np.fmin.reduceat(v, starts[idx])
            mx[idx] = np.fmax.reduceat(v, starts[idx])
            fin = np.isfinite(v)
            with np.errstate(invalid='ignore', divide='ignore', over='ignore'):
                sm = np.add.reduceat(np.where(fin, v, 0.0), starts[idx])
                cn = np.add.reduceat(fin.astype(float), starts[idx])
                av[idx] = np.where(cn > 0, sm / np.maximum(cn, 1), np.nan)
        out['cols'][k] = {'fi': [float(v[s]) if h else None for s, h in zip(starts, has)],
                          'la': [float(v[e - 1]) if h else None for e, h in zip(ends, has)],
                          'mn': clean(mn), 'mx': clean(mx), 'av': clean(av)}
    return out


# ---------------------------------------------------------------- /api/study
def handle(data):
    op = data.get('op')
    if op == 'settings':
        kw = {}
        if 'dir' in data:
            kw['dir'] = str(folder(data['dir'], bool(data.get('create')))) if data['dir'] else None
        for k, ok in (('keep', lambda v: isinstance(v, int) and 1 <= v <= 1000), ('mode', lambda v: v in ('all', 'sim', 'scope')),
                      ('dtype', lambda v: v in ('float64', 'float32')), ('dt', lambda v: isinstance(v, (int, float)) and v >= 0),
                      ('netlist', lambda v: isinstance(v, bool))):
            if k in data and ok(data[k]):
                kw[k] = data[k]
        s = save_settings(**kw) if kw else settings()
        return {**s, 'default': str(home() / 'studies')}
    if op == 'open':
        return open_study(data.get('path') or None, data.get('title') or '', bool(data.get('create')))
    if op == 'runs':
        return {'path': str(_study_dir(data.get('study'))), 'runs': list_runs(_study_dir(data.get('study')))}
    if op == 'begin':
        return begin_run(data.get('study'), data.get('project'), data.get('title') or '', data.get('source') or 'page', data.get('solver'),
                         data.get('data'), data.get('tutorial'))
    if op == 'put':
        return put(data.get('study'), data.get('run'), data.get('name'), data.get('obj'), data.get('text'))
    if op in ('events', 'log'):
        return append_lines(data.get('study'), data.get('run'), op, data.get('rows'))
    if op == 'end':
        return end_run(data.get('study'), data.get('run'), data.get('status') or 'done', data.get('stats'), data.get('error'))
    if op == 'tag':
        return tag_run(data.get('study'), data.get('run'), data.get('tag'))
    if op == 'info':
        return source(data.get('source')).info()
    if op == 'range':
        return read_range(source(data.get('source')), data.get('t0'), data.get('t1'), data.get('keys'), data.get('n') or 1000)
    if op == 'diff':
        A, B = data.get('a') or {}, data.get('b') or {}
        return read_diff(source(A.get('source')), A.get('key'), source(B.get('source')), B.get('key'), data.get('t0'), data.get('t1'), data.get('n') or 1000)
    if op == 'events_read':
        s = source(data.get('source'))
        return s.events(int(min(20000, max(1, data.get('n') or 2000)))) if isinstance(s, RunSource) else {'rows': [], 'n': 0}
    raise ValueError('Άγνωστη ενέργεια του φακέλου μελέτης.')
