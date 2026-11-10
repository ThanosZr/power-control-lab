"""Scripted scenarios (3.13, ROADMAP §30): change parameters, run simulations, export the results.

The code drives the simulation from outside, like a PLECS or Simulink script. The Python block (§10) is
different: it runs inside the simulation, at the controller's samples.

    import pcl
    p = pcl.load('buck.pcl.json')                 # or pcl.tutorial('buck', load='R')
    p.set('L1.L', 47e-6); p.set('PWM1.fs', 50e3)  # <id>.<parameter>, as in the live-parameters table
    r = p.run(t_end=5e-3)                         # solver='browser' (web/studio/mna.js in Node) or 'scipy'
    r.to_csv('out.csv'); r.to_mat('out.mat'); df = r.frame()
    sw = p.sweep({'L1.L': [22e-6, 47e-6, 100e-6]}, t_end=5e-3, measure={'dI': ('I:L1', 'pp', 10)})
    sw.to_csv('sweep.csv')
    for ch in p.stream(t_end=0.5, chunk=0.05, state='run.state', to='run.csv'):   # 3.16: chunk by chunk, state on disk
        print(ch.meta['t1'], ch.measured)
    r = p.run(t_end=1.0, resume='run.state')       # continues from where it stopped (the same numbers as one long run)

* 'browser': the same web/studio/*.js as the app (pcl/runner.js), so the results are the app's.
* 'scipy': the same netlist (MNA.exportForBatch) solved by engine.batch.simulate.

The same module runs in the app's "Σενάρια" panel (3.14, Pyodide in a worker): there `_backend` answers the requests
in the worker itself, `pcl.current()` is the circuit on the screen, `pcl.show()` puts a table or a chart in the panel,
and the files the script writes become downloads. MATLAB and Octave call `job()` through `python -m pcl job` (matlab/).
"""
import copy
import csv
import datetime
import hashlib
import io
import itertools
import json
import math
import os
import re
import shutil
import struct
import subprocess
import sys
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RUNNER = Path(__file__).resolve().parent / 'runner.js'
STATS = ('avg', 'rms', 'min', 'max', 'pp', 'end', 'at', 'thd')
UNITS = {'V': 'V', 'I': 'A', 'P': 'W', 'N': 'V', 'D': '', 'G': '', 'Y': '', 'E': 'J', 'W': 'rad/s', 'T': 'N·m'}
_SI = {'f': -15, 'p': -12, 'n': -9, 'u': -6, 'µ': -6, 'μ': -6, 'm': -3, '': 0, 'k': 3, 'K': 3, 'M': 6, 'G': 9}


class PclError(RuntimeError):
    pass


def version():
    try:
        from engine import __version__
        return __version__
    except Exception:            # noqa: BLE001 - the package also runs from a copy without the engine
        return '?'


def parse_value(v):
    """'47u' → 4.7e-05, '5m' → 0.005, '1e-3' → 0.001; anything else (a program 't:value', a word) stays text."""
    if isinstance(v, (int, float)):
        return v
    s = str(v).strip()
    m = re.fullmatch(r'([-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)\s*([fpnuµμmkKMG]?)', s)
    if m:          # through the exponent, so 50u is exactly 5e-05
        x = m.group(1)
        if 'e' in x.lower():
            return float(x) * 10.0 ** _SI[m.group(2)]
        return float(f'{x}e{_SI[m.group(2)]}')
    return s


IN_BROWSER = sys.platform == 'emscripten'      # Pyodide in the app's worker
_backend = None          # the app's worker answers the solver's requests itself (3.14)
_show_hook = None        # and shows tables and charts in the panel
_progress_hook = None
_batch_hook = None       # 3.15: requests in parallel on the page's pool of solvers (None: not available, in order)
_default = None          # the project of the module-level functions pcl.set/run/sweep


def _node(q, timeout=None):
    if _backend is not None:
        return _backend(q)
    if IN_BROWSER:
        raise PclError('Ο λύτης του browser δεν είναι διαθέσιμος εδώ.')
    if shutil.which('node') is None:
        raise PclError('Χρειάζεται το Node.js για τον λύτη του browser (https://nodejs.org). Αλλιώς solver="scipy".')
    r = subprocess.run(['node', str(RUNNER)], input=json.dumps(q), capture_output=True, text=True, timeout=timeout, cwd=str(ROOT))
    if r.returncode:
        raise PclError(r.stderr.strip() or 'Ο λύτης του browser σταμάτησε.')
    return json.loads(r.stdout)


class _Session:
    """A solver kept open between requests (3.16, ROADMAP §41.1): in the app's worker the requests go to `_backend`,
    here to one Node process (pcl/runner.js --session), one JSON line per request and per answer."""

    def __init__(self, timeout=None):
        self.proc = None
        self.timeout = timeout
        if _backend is not None:
            return
        if IN_BROWSER:
            raise PclError('Ο λύτης του browser δεν είναι διαθέσιμος εδώ.')
        if shutil.which('node') is None:
            raise PclError('Χρειάζεται το Node.js για τον λύτη του browser (https://nodejs.org).')
        import tempfile
        self.err = tempfile.TemporaryFile(mode='w+', encoding='utf-8')
        self.proc = subprocess.Popen(['node', str(RUNNER), '--session'], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=self.err,
                                     text=True, encoding='utf-8', cwd=str(ROOT), bufsize=1)

    def __call__(self, q):
        if self.proc is None:
            return _backend(q)
        try:
            self.proc.stdin.write(json.dumps(q) + '\n')
            self.proc.stdin.flush()
            line = self.proc.stdout.readline()
        except (BrokenPipeError, OSError):
            line = ''
        if not line:
            self.err.seek(0)
            raise PclError(self.err.read().strip()[-2000:] or 'Ο λύτης του browser σταμάτησε.')
        r = json.loads(line)
        if 'error' in r:
            raise PclError(r['error'])
        return r['ok']

    def close(self):
        if self.proc is not None:
            try:
                self.proc.stdin.close()
                self.proc.wait(timeout=10)
            except Exception:       # noqa: BLE001
                self.proc.kill()
                self.proc.wait()
            self.proc.stdout.close()
            self.err.close()
        self.proc = None

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        self.close()


STATE_FORMAT = 'pcl-run-state'


def read_state(path):
    """A run state saved by stream(state=…) or run(save_state=…): {project, t, T, channels, sim, …}."""
    d = path if isinstance(path, dict) else json.loads(Path(path).read_text(encoding='utf-8'))
    if not isinstance(d, dict) or d.get('format') != STATE_FORMAT or 'sim' not in d:
        raise PclError(f'{path}: δεν είναι αποθηκευμένη κατάσταση προσομοίωσης του Power & Control Lab.')
    return d


def _write_atomic(path, text):
    tmp = f'{path}.tmp'
    Path(tmp).write_text(text, encoding='utf-8')
    os.replace(tmp, path)


def tutorials():
    """The tutorials and their options: [{id, title, group, options: [{k, label, def, choices}]}]."""
    return _node({'action': 'tutorials'})


def tutorial(tid, **options):
    """The project a tutorial builds, with its options (as in the app's tutorial panel)."""
    return Project(_node({'action': 'tutorial', 'id': tid, 'options': options}), name=tid)


def load(path):
    """A project saved from the app (Αρχείο → Αποθήκευση) or written by pcl."""
    p = Path(path)
    data = json.loads(p.read_text(encoding='utf-8'))
    if isinstance(data, dict) and data.get('format') == STATE_FORMAT:      # 3.16: the project of a saved run
        return Project(data['project'], name=data.get('name') or p.stem)
    if not isinstance(data, dict) or not isinstance(data.get('components'), list):
        raise PclError(f'{p}: δεν είναι project του Power & Control Lab (λείπουν τα components).')
    return Project(data, name=p.stem)


# module-level functions on one project (in the app: the circuit on the screen), as in the ROADMAP:
#   pcl.set('L1.L', 47e-6); r = pcl.run(t_end=5e-3); sw = pcl.sweep({...}, measure={...})
def use(project):
    """Makes `project` (a Project, a path or 'tutorial:<id>') the one of pcl.set/get/run/sweep. Returns it."""
    global _default
    _default = project if isinstance(project, Project) else _open(project)
    return _default


def current():
    """The project of the module-level functions; in the app, a copy of the circuit on the screen."""
    if _default is None:
        raise PclError('Δεν υπάρχει τρέχον κύκλωμα: pcl.use(pcl.load(...)) ή pcl.use("tutorial:buck").')
    return _default


def set(key, value):          # noqa: A001 - the API of the ROADMAP
    return current().set(key, value)


def get(key):
    return current().get(key)


def run(**kw):
    return current().run(**kw)


def sweep(grid=None, **kw):
    return current().sweep(grid, **kw)


def params():
    return current().params()


def bifurcation(param, values=None, **kw):
    return current().bifurcation(param, values, **kw)


class Plot(dict):
    """y(x) for pcl.show: {'x': [...], 'series': {name: [...]}, 'xlabel', 'ylabel'}."""


def plot(x, ys, title=None, xlabel='', ylabel=''):
    """A chart of one or more series against x: plot(L, {'προσομοίωση': dI, 'θεωρία': th}, xlabel='L (H)').
    In the app's panel a chart; here matplotlib if it is installed, else a table."""
    if not isinstance(ys, dict):
        ys = {ylabel or 'y': ys}
    return show(Plot(x=[float(v) for v in x], series={k: [None if v is None else float(v) for v in y] for k, y in ys.items()},
                     xlabel=xlabel, ylabel=ylabel), title)


def show(obj, title=None):
    """A table or chart in the app's panel; here a text table (or a matplotlib chart for pcl.plot)."""
    if _show_hook is not None:
        return _show_hook(obj, title)
    if isinstance(obj, Plot):
        try:
            import matplotlib.pyplot as plt
            plt.figure()
            for k, y in obj['series'].items():
                plt.plot(obj['x'], y, 'o-', label=k)
            plt.xlabel(obj['xlabel'])
            plt.ylabel(obj['ylabel'])
            if title:
                plt.title(title)
            plt.legend()
            plt.grid(True)
            plt.show()
        except ImportError:
            names = list(obj['series'])
            print('\t'.join([obj['xlabel'] or 'x'] + names))
            for i, xv in enumerate(obj['x']):
                print('\t'.join([f'{xv:.6g}'] + [f'{obj["series"][n][i]:.6g}' for n in names]))
        return obj
    if isinstance(obj, BifurcationResult):
        try:
            import matplotlib.pyplot as plt
            plt.figure()
            for v, ys in zip(obj.values, obj.y):
                plt.plot([v] * len(ys), ys, 'k.', markersize=2)
            plt.xlabel(obj.param)
            plt.ylabel(f'{obj.meta.get("key", "")} ({obj.meta.get("stat", "")})')
            if title:
                plt.title(title)
            plt.grid(True)
            plt.show()
        except ImportError:
            for v, p in obj.changes():
                print(f'από {v:.6g}: ' + (f'{p}T' if p else 'χωρίς περίοδο'))
        return obj
    if isinstance(obj, SweepResult):
        cols = obj.params + obj.names
        print('\t'.join(cols))
        for r in obj.rows:
            print('\t'.join(f'{r[c]:.6g}' if isinstance(r.get(c), (int, float)) else str(r.get(c, '')) for c in cols))
    elif isinstance(obj, Result):
        print(repr(obj))
        for k, v in obj.measured.items():
            print(f'{k} = {v:.6g}')
    else:
        print(obj)
    return obj


def _open(src):
    """A Project from a Project, a project object (dict), 'tutorial:<id>[?k=v&…]' or a path."""
    if isinstance(src, Project):
        return src.copy()
    if isinstance(src, dict):
        if isinstance(src.get('tutorial'), dict) and 'components' not in src:
            return tutorial(src['tutorial']['id'], **(src['tutorial'].get('options') or {}))
        return Project(src, name=src.get('name') or 'project')
    s = str(src)
    if s.startswith('tutorial:'):
        tid, _, q = s[9:].partition('?')
        opts = dict(x.split('=', 1) for x in q.split('&') if '=' in x)
        return tutorial(tid, **opts)
    return load(s)


def _pairs(x, key='key', val='value'):
    """{k: v}, [[k, v], …] or [{key: k, value: v}, …] (what jsonencode makes from MATLAB) → [(k, v), …]."""
    if not x:
        return []
    if isinstance(x, dict):
        if key in x:
            x = [x]
        else:
            return list(x.items())
    out = []
    for it in x:
        if isinstance(it, dict):
            out.append((it[key], it.get(val, it.get('values'))))
        else:
            out.append((it[0], it[1]))
    return out


def _clean(x):
    """NaN and ±Inf → None (null), so the JSON is strict (browsers, MATLAB's jsondecode)."""
    if isinstance(x, float) and (x != x or x in (float('inf'), float('-inf'))):
        return None
    if isinstance(x, dict):
        return {k: _clean(v) for k, v in x.items()}
    if isinstance(x, (list, tuple)):
        return [_clean(v) for v in x]
    return x


def job(spec, allow_paths=True):
    """One request as data (the CLI's `job`, the server's scenario_run/scenario_sweep, MATLAB/Octave):
    {project | tutorial, set, run: {..., save_state, resume} | sweep: {grid, points, mode, measure, t_end, …, to, resume}
     | bifurcation: {param, values | start, stop, n, channel, stat, transient, record}} → a JSON-able dict."""
    if not isinstance(spec, dict):
        raise PclError('Το αίτημα πρέπει να είναι αντικείμενο JSON.')
    src = spec.get('project')
    if src is None and spec.get('tutorial'):
        t = spec['tutorial']
        src = {'tutorial': t if isinstance(t, dict) else {'id': t}}
    if src is None:
        raise PclError('Λείπει το project (αντικείμενο, αρχείο ή "tutorial:<id>").')
    if isinstance(src, str) and not src.startswith('tutorial:') and not allow_paths:
        raise PclError('Εδώ το project δίνεται ως αντικείμενο JSON ή "tutorial:<id>", όχι ως διαδρομή αρχείου.')
    if not allow_paths and any(k in (spec.get(w) or {}) for w in ('run', 'sweep') for k in ('save_state', 'resume', 'to')):
        raise PclError('Εδώ δεν γράφονται ούτε διαβάζονται αρχεία κατάστασης (save_state, resume, to): από τη γραμμή εντολών ή την Python.')
    p = _open(src)
    for k, v in _pairs(spec.get('set')):
        p.set(k, v)
    if 'sweep' in spec:
        o = dict(spec['sweep'] or {})
        grid = _pairs(o.pop('grid', None), 'key', 'values')
        grid = {k: (v if isinstance(v, (list, tuple)) else _as_list(v) if isinstance(v, str) else [v]) for k, v in grid} or None
        sw = p.sweep(grid=grid, **{k: v for k, v in o.items() if k in ('points', 't_end', 'measure', 'workers', 'solver', 'mode', 'hdiv', 'method', 'step', 'rtol', 'hmax', 'channels', 'scipy_method', 'timeout')
                                   or (allow_paths and k in ('to', 'resume'))})
        return _clean({'kind': 'sweep', 'meta': sw.meta, 'params': sw.params, 'measure': sw.names, 'vars': [_matname(c) for c in sw.params + sw.names], 'rows': sw.rows})
    if 'bifurcation' in spec:          # 3.15
        o = dict(spec['bifurcation'] or {})
        b = p.bifurcation(o.pop('param', None), **{k: v for k, v in o.items() if k in ('values', 'start', 'stop', 'n', 'channel', 'stat', 'transient', 'record', 'hdiv', 'method', 'workers')})
        return _clean({'kind': 'bifurcation', 'meta': b.meta, 'param': b.param, 'values': b.values, 'y': b.y, 'period': b.period,
                       'changes': [{'value': v, 'period': q} for v, q in b.changes()]})
    o = dict(spec.get('run') or {})
    if 'from' in o:
        o['t_from'] = o.pop('from')
    r = p.run(**{k: v for k, v in o.items() if k in ('t_end', 'solver', 'channels', 'hdiv', 'method', 'step', 'rtol', 'hmax', 't_from', 'max_points', 'measure', 'timeout', 'scipy_method', 'waveforms')
                 or (allow_paths and k in ('save_state', 'resume'))})
    return _clean(r.as_dict())


def _inner_parts(defn, inst):
    """The parts of a subcircuit definition with the values of one instance: public parameters (bound to inner
    parameters), then the values of this instance only ('L1.L'; 'X2/L1.L' passes down to the nested X2).
    The same rules as innerParts in web/studio/subcircuit.js."""
    parts = [{**c, 'params': dict(c.get('params') or {})} for c in defn.get('components') or []]
    by_id = {c['id']: c for c in parts}
    ip = inst.get('params') or {}

    def put(cid, k, v):
        if cid in by_id:
            by_id[cid]['params'][k] = v
    for pp in defn.get('params') or []:
        v = ip.get(pp['k'])
        if v is None or v == '':
            v = pp.get('def')
        if v is None or v == '':
            continue
        for cid, k in pp.get('bind') or []:
            put(cid, k, v)
    for key, v in ip.items():
        if key.startswith('$') or key == 'def' or '.' not in key:
            continue
        dot, sl = key.index('.'), key.find('/')
        if 0 < sl < dot:
            put(key[:sl], key[sl + 1:], v)
        else:
            put(key[:dot], key[dot + 1:], v)
    return parts


def _sub_parts(data, path):
    """A part inside subcircuit instances by path ('X1/L1', 'X1/X2/L1'): (part, its parameters for that instance)."""
    names = path.split('/')
    defs = data.get('subcircuits') or {}
    comps = data.get('components') or []
    c = None
    for i, n in enumerate(names):
        c = next((k for k in comps if k.get('id') == n), None)
        if c is None:
            raise PclError(f'Δεν υπάρχει «{"/".join(names[:i + 1])}».')
        if i < len(names) - 1:
            if c.get('type') != 'SUB':
                raise PclError(f'«{"/".join(names[:i + 1])}» δεν είναι υποκύκλωμα.')
            d = defs.get((c.get('params') or {}).get('def'))
            if d is None:
                raise PclError(f'Δεν υπάρχει ο ορισμός του «{"/".join(names[:i + 1])}».')
            comps = _inner_parts(d, c)
    return c, c.get('params') or {}


class Project:
    """A circuit as the app saves it: components, wires, solver settings (solve, sim), scope."""

    def __init__(self, data, name='project'):
        self.data = copy.deepcopy(data)
        self.name = name
        self.changes = {}

    # ------------------------------------------------------------- parameters
    def comp(self, cid):
        for c in self.data['components']:
            if c.get('id') == cid:
                return c
        ids = ', '.join(c.get('id') for c in self.data['components'] if c.get('type') not in ('JUNC', 'GND'))
        raise PclError(f'Δεν υπάρχει στοιχείο «{cid}». Υπάρχουν: {ids}')

    def get(self, key):
        head, _, prm = key.partition('.')
        if head in ('solve', 'sim'):
            return (self.data.get(head) or {}).get(prm)
        if '/' in head:
            return _sub_parts(self.data, head)[1].get(prm)
        return (self.comp(head).get('params') or {}).get(prm)

    def set(self, key, value):
        """'<id>.<parameter>' (e.g. 'L1.L', 'PWM1.fs', 'V1.sched'), or 'solve.<k>' / 'sim.<k>' for the solver
        (solve.step = 'var', solve.rtol, solve.hmax; sim.hDiv, sim.method). Values: numbers, '47u', or programs 't:value'.
        A list gives one value per element of a block on a bus (3.18): p.set('KD.K', [-1.57, 1.57]) = 'KD.K' = '-1.57; 1.57'."""
        head, dot, prm = key.partition('.')
        if not dot or not prm:
            raise PclError(f'«{key}»: γράψε <id>.<παράμετρος>, π.χ. L1.L')
        if isinstance(value, (list, tuple)):
            value = '; '.join(repr(float(x)) if isinstance(x, (int, float)) else str(x) for x in value)
        v = parse_value(value)
        if head in ('solve', 'sim'):
            self.data.setdefault(head, {})[prm] = v
        elif '/' in head:
            # inside a subcircuit instance (3.17): a value of this instance only, kept on the top instance as
            # '<inner path>.<parameter>' (the same as web/studio/subcircuit.js setParam)
            _sub_parts(self.data, head)
            top, rest = head.split('/', 1)
            self.comp(top).setdefault('params', {})[rest + '.' + prm] = v
        else:
            c = self.comp(head)
            c.setdefault('params', {})[prm] = v
        self.changes[key] = v
        return self

    def copy(self):
        q = Project(self.data, self.name)
        q.changes = dict(self.changes)
        return q

    def save(self, path):
        Path(path).write_text(json.dumps(self.data, ensure_ascii=False, indent=1), encoding='utf-8')

    def hash(self):
        keep = {k: self.data.get(k) for k in ('components', 'wires', 'solve', 'subcircuits')}
        return hashlib.sha256(json.dumps(keep, sort_keys=True, ensure_ascii=False).encode()).hexdigest()[:16]

    def params(self):
        """{id: {'type': …, <parameter>: value, …}} of every element: the names pcl.set takes."""
        return {c['id']: {'type': c.get('type'), **(c.get('params') or {})} for c in self.data['components'] if c.get('type') not in ('JUNC', 'GND')}

    def channels(self):
        """Every channel the project has (V:<id>, I:<id>, N:<node>, Y:<block>, …) and the base period T."""
        return _node({'action': 'channels', 'project': self.data})

    # ------------------------------------------------------------- running
    def _settings(self, hdiv, method, step, rtol, hmax):
        sim = self.data.get('sim') or {}
        st = None
        if step or rtol or hmax:
            st = {'mode': step or (self.data.get('solve') or {}).get('step') or 'fixed'}
            if rtol:
                st['rtol'] = float(rtol)
            if hmax:
                st['hmax'] = float(hmax)
        return int(hdiv or sim.get('hDiv') or 200), method or sim.get('method') or 'TR', st

    def run(self, t_end=None, solver='browser', channels=None, hdiv=None, method=None, step=None, rtol=None, hmax=None,
            t_from=0.0, max_points=200000, measure=None, timeout=None, scipy_method='Radau', waveforms=True, save_state=None, resume=None,
            events=False):
        """One simulation. t_end: duration in s (default the tutorial's stopT). channels: keys as in the app's scope
        (default the project's scope, else V and I of every element). step='var' for the variable step (§40).
        solver='scipy' runs engine.batch.simulate on the same netlist (method scipy_method, rtol, max step hmax in s).
        3.16: save_state='file' keeps the end state; resume='file' continues from a saved state up to the time t_end
        (the end time, not a duration), with the same numbers as one run. Browser solver only.
        3.19: events=True (or a list of kinds, e.g. ['switch', 'cmp']) keeps the event log in Result.events (both solvers)."""
        if save_state is not None or resume is not None:
            if solver != 'browser':
                raise PclError('Η αποθήκευση και η συνέχεια της κατάστασης γίνονται με τον λύτη του browser (solver="browser").')
            res = list(self.stream(t_end, chunk='all', channels=channels, hdiv=hdiv, method=method, step=step, rtol=rtol, hmax=hmax,
                                   t_from=t_from, max_points=max_points, measure=measure, state=save_state, resume=resume, timeout=timeout,
                                   waveforms=waveforms))
            return res[-1]
        t_end = float(parse_value(t_end if t_end is not None else (self.data.get('sim') or {}).get('stopT') or 0))
        if not t_end > 0:
            raise PclError('Δώσε διάρκεια t_end > 0 (σε s, π.χ. 5e-3 ή "5m").')
        meas = _measures(measure)
        keys = list(channels) if channels else None
        if meas and keys is not None:
            keys += [m['key'] for m in meas if m['key'] not in keys]
        if solver == 'browser':
            hd, mt, st = self._settings(hdiv, method, step, rtol, hmax)
            out = _node({'action': 'run', 'project': self.data, 't_end': t_end, 'channels': keys, 'hdiv': hd, 'method': mt,
                         'step': st, 'from': t_from, 'max_points': max_points, 'measure': meas, 'waveforms': bool(waveforms),
                         'events': events or False}, timeout=timeout)
            return self._result(out)
        if solver == 'scipy':
            return self._run_scipy(t_end, keys, scipy_method, rtol, hmax, max_points, meas, t_from, events)
        raise PclError(f'Άγνωστος λύτης «{solver}»: browser ή scipy.')

    def stream(self, t_end=None, chunk=None, channels=None, hdiv=None, method=None, step=None, rtol=None, hmax=None, t_from=0.0,
               max_points=200000, measure=None, state=None, resume=None, to=None, timeout=None, waveforms=True, set=None):  # noqa: A002
        """Results in chunks (3.16, ROADMAP §41.1): a generator of Results, one per chunk of whole base periods, each one as
        soon as it is solved. The solver stays open between chunks, so the numbers are those of one run(t_end).
          chunk     seconds per chunk (rounded to whole base periods T), default a tenth of the run; 'all' = one chunk
          state     a file that holds the state after every chunk: if the run stops, resume=… continues from there
          resume    a state file (or read_state()) to continue from; t_end is then the end time. If this project differs
                    from the saved one (a parameter changed), the states pass over as with a change while running
          to        a CSV file that gets the rows of every chunk as it comes (appended when resuming)
          set       {'<id>': value} (a «Σταθερά» block) or {'<id>.<param>': value}, applied before the first chunk
        Each Result has meta t0, t1 (the chunk), chunk (its number); the last one also the solver's messages (diag)."""
        meas = _measures(measure)
        saved = read_state(resume) if resume is not None else None
        t_end = float(parse_value(t_end if t_end is not None else (self.data.get('sim') or {}).get('stopT') or 0))
        if not t_end > 0:
            raise PclError('Δώσε t_end > 0 (σε s, π.χ. 5e-3 ή "5m").')
        if to is not None and Path(to).suffix.lower() != '.csv':
            raise PclError('Τα κομμάτια γράφονται σε CSV (to="….csv"). Για άλλη μορφή: r.save(…) σε κάθε κομμάτι.')
        sess = _Session(timeout)
        try:
            if saved:
                o = sess({'action': 'open', 'project': self.data, 'saved': saved['project'], 'state': saved['sim'],
                          'channels': list(channels) if channels else saved.get('channels'), 'measure': meas})
            else:
                hd, mt, st = self._settings(hdiv, method, step, rtol, hmax)
                o = sess({'action': 'open', 'project': self.data, 'channels': list(channels) if channels else None,
                          'hdiv': hd, 'method': mt, 'step': st, 'measure': meas})
            sid, keys, T, t = o['sid'], o['keys'], float(o['T']), float(o['t'])
            if not t_end > t * (1 + 1e-12):
                raise PclError(f'Η προσομοίωση είναι ήδη στο t = {t:.6g} s: το t_end είναι ο χρόνος τέλους, δώσε μεγαλύτερο.')
            if chunk == 'all':
                per = None
            else:
                per = max(1, round(float(parse_value(chunk)) / T)) if chunk else max(1, math.ceil((t_end - t) / T / 10))
            fmt = (lambda v: '' if v is None or (isinstance(v, float) and math.isnan(v)) else repr(float(v)))
            new_file = to is not None and not (saved and Path(to).is_file())
            if new_file:
                with open(to, 'w', encoding='utf-8', newline='') as f:
                    f.write(f'# pcl: {json.dumps(version())}\n# project: {json.dumps(self.name, ensure_ascii=False)}\n# hash: {json.dumps(self.hash())}\n# T: {T!r}\n')
                    csv.writer(f).writerow(['t [s]'] + [f'{k} [{_unit(k)}]' if _unit(k) else k for k in keys])
            k_chunk, first = 0, True
            while t < t_end * (1 - 1e-12):
                if per is None:
                    te = t_end
                else:
                    k = round(t / T)
                    te = min(t_end, (k + per) * T)
                    if not te > t * (1 + 1e-12):
                        te = min(t_end, (k + per + 1) * T)
                q = {'action': 'advance', 'sid': sid, 't_end': te, 'from': t_from, 'max_points': max_points, 'measure': meas,
                     'waveforms': bool(waveforms) or to is not None}
                if first and set:
                    q['set'] = {k2: parse_value(v) for k2, v in dict(set).items()}
                first = False
                out = sess(q)
                t = float(out['t1'])
                last = t >= t_end * (1 - 1e-12)
                if state is not None:
                    snap = sess({'action': 'state', 'sid': sid})
                    _write_atomic(state, json.dumps({'format': STATE_FORMAT, 'version': 1, 'pcl': version(), 'name': self.name, 'hash': self.hash(),
                                                     'date': datetime.datetime.now().isoformat(timespec='seconds'), 't': t, 'T': T,
                                                     'channels': keys, 'project': self.data, 'sim': snap}, ensure_ascii=False))
                tt = out.get('t') or []
                if to is not None:
                    with open(to, 'a', encoding='utf-8', newline='') as f:
                        w = csv.writer(f)
                        for i, tv in enumerate(tt):
                            w.writerow([fmt(tv)] + [fmt(out['ch'][kk][i]) for kk in keys])
                diag = []
                meta = {**out['meta'], 'solver': 'browser (web/studio/mna.js' + (')' if IN_BROWSER else ', Node)'), 'chunk': k_chunk,
                        't0': out['t0'], 't1': t, 't_end': t, 'T': T, 'resumed_from': saved['t'] if saved else None}
                if last:
                    fin = sess({'action': 'close', 'sid': sid})
                    diag = fin['diag']
                    meta.update({'warnings': fin['warnings'], 'steps_total': fin['steps']})
                res = Result(tt if waveforms else [], keys, (out.get('ch') or {}) if waveforms else {}, meta, self, out.get('measure') or {}, diag)
                k_chunk += 1
                yield res
        finally:
            sess.close()

    def _result(self, out):
        meta = {**out['meta'], 'solver': 'browser (web/studio/mna.js' + (')' if IN_BROWSER else ', Node)')}
        res = Result(out.get('t') or [], out['keys'], out.get('ch') or {}, meta, self, out.get('measure') or {}, out.get('diag') or [])
        if out.get('events'):
            res.events, res.meta['events'] = out['events']['list'], {k: out['events'][k] for k in ('n', 'kinds', 'max')}
        return res

    def _query(self, t_end=None, channels=None, hdiv=None, method=None, step=None, rtol=None, hmax=None, t_from=0.0, max_points=200000,
               measure=None, **_):
        """The request of run() for the browser's solver, without running it (a sweep sends many at once to the pool, 3.15)."""
        t_end = float(parse_value(t_end if t_end is not None else (self.data.get('sim') or {}).get('stopT') or 0))
        if not t_end > 0:
            raise PclError('Δώσε διάρκεια t_end > 0 (σε s, π.χ. 5e-3 ή "5m").')
        meas = _measures(measure)
        keys = list(channels) if channels else ([m['key'] for m in meas] if meas else None)
        hd, mt, st = self._settings(hdiv, method, step, rtol, hmax)
        return {'action': 'run', 'project': self.data, 't_end': t_end, 'channels': keys, 'hdiv': hd, 'method': mt, 'step': st,
                'from': t_from, 'max_points': max_points, 'measure': meas, 'waveforms': False, 'check': False}

    def _run_scipy(self, t_end, keys, method, rtol, hmax, max_points, meas, t_from, events=False):
        import numpy as np
        from engine.batch import simulate, BatchError
        if keys is None:
            keys = [k for k in self.channels()['keys'] if k[:2] in ('V:', 'I:')]
        exp = _node({'action': 'export', 'project': self.data, 'channels': keys})
        missing = [k for k in keys if k not in exp['channels']]
        if missing:
            raise PclError('Ο λύτης SciPy δεν έχει τα κανάλια: ' + ', '.join(missing))
        try:
            r = simulate({'net': exp['net'], 'channels': exp['channels'], 't_end': t_end, 'method': method,
                          'rtol': float(rtol) if rtol else 1e-6, 'max_step': float(parse_value(hmax)) if hmax else 0,
                          'max_points': max_points, '_local': True, 'events': 20000 if events else 0})
        except BatchError as e:
            raise PclError(str(e)) from e
        t = np.array(r['t'], dtype=float)
        ch = {k: np.array([np.nan if v is None else v for v in r['ch'][k]], dtype=float) for k in keys}
        if t_from > 0:
            m = t >= t_from
            t = t[m]
            ch = {k: v[m] for k, v in ch.items()}
        meta = {'solver': f'scipy ({method}, engine/batch.py)', 'method': method, 'rtol': r['rtol'], 'max_step': r['max_step'],
                't_end': r['t_end'], 'status': r['status'], 'message': r['message'], 'points': r['stats']['points'], 'returned': len(t),
                'wall_s': r['stats']['wall_s'], 'T': _base_T(self)}
        res = Result(t.tolist(), keys, {k: v.tolist() for k, v in ch.items()}, meta, self, {}, r.get('diag') or [])
        if events and r.get('events'):
            kinds = frozenset(events) if isinstance(events, (list, tuple, frozenset)) or type(events).__name__ == 'set' else None
            res.events = [e for e in r['events']['list'] if kinds is None or e['kind'] in kinds]
            res.meta['events'] = {'n': r['events']['n'], 'max': r['events']['max']}
        for m in meas:
            res.measured[m['name']] = res.measure(m['key'], m['stat'], m.get('periods', 1), at=m.get('at'), f1=m.get('f1'))
        return res

    def sweep(self, grid=None, points=None, t_end=None, measure=None, workers=None, solver='browser', mode='grid', progress=None,
              to=None, resume=False, **run_kw):
        """A run per point: grid={'L1.L': [...], 'R1.R': [...]} (every combination, or mode='zip' side by side),
        or points=[{'L1.L': 22e-6, 'R1.R': 5}, …]. measure={'name': (key, stat, periods)} with stat in
        avg, rms, min, max, pp (over the last periods base periods), end, ('at', t), thd. In parallel on `workers`.
        3.16: to='file' writes every point as soon as it is done (CSV; for .parquet/.h5/.mat/.json a <file>.part.csv
        meanwhile, and the file at the end); resume=True skips the points already in it (a sweep that stopped)."""
        meas = _measures(measure)
        if not meas:
            raise PclError('Η σάρωση θέλει μετρήσεις: measure={"Vo": ("V:C1", "avg", 10)}.')
        if points is None:
            if not grid:
                raise PclError('Δώσε grid={...} ή points=[...].')
            names = list(grid)
            vals = [[parse_value(v) for v in (grid[n] if isinstance(grid[n], (list, tuple)) else _as_list(grid[n]))] for n in names]
            combos = zip(*vals) if mode == 'zip' else itertools.product(*vals)
            points = [dict(zip(names, c)) for c in combos]
        jobs = []
        for pt in points:
            q = self.copy()
            for k, v in pt.items():
                q.set(k, v)
            jobs.append((q.data, pt))
        kw = dict(run_kw, t_end=t_end, solver=solver, measure=measure)
        n = len(jobs)
        if not n:
            raise PclError('Η σάρωση δεν έχει σημεία.')
        progress = progress or _progress_hook
        rows = [None] * n
        names = [m['name'] for m in meas]
        out = _SweepFile(to, list(points[0]), names, n, resume) if to is not None else None
        if out is not None:
            for i, r in out.done.items():
                rows[i] = {**jobs[i][1], **{k: v for k, v in r.items() if k not in jobs[i][1]}}
        todo = [i for i in range(n) if rows[i] is None]
        n_done = n - len(todo)

        def finish(row_i, row):
            nonlocal n_done
            rows[row_i] = row
            n_done += 1
            if out is not None:
                out.add(row_i, row)
            if progress:
                progress(n_done, n)

        def result(nw):
            sw = SweepResult(rows, list(points[0]) if points else [], names, self._sweep_meta(n, solver, meas, kw, nw))
            if out is not None:
                out.close(sw)
            return sw
        # in the app's panel (3.15): all the points at once to the page's pool of solvers, when the page allows it
        if IN_BROWSER and solver == 'browser' and workers != 1 and len(todo) > 1 and _batch_hook is not None:
            res = _batch_hook([Project(jobs[i][0])._query(**kw) for i in todo])
            if res is not None:
                for i, o in zip(todo, res['outs']):
                    finish(i, {**jobs[i][1], **(o.get('out') or {}).get('measure', {}), **({'error': o['error']} if o.get('error') else {})})
                return result(res['workers'])
        workers = 1 if IN_BROWSER else max(1, min(int(workers or os.cpu_count() or 1), max(1, len(todo))))
        if workers == 1:                # in the app's worker (no threads in Pyodide), or asked for
            for i in todo:
                m, err = _sweep_point(jobs[i][0], kw)
                finish(i, {**jobs[i][1], **m, **({'error': err} if err else {})})
        else:
            from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor, as_completed    # here: Pyodide has no multiprocessing
            Pool = ThreadPoolExecutor if solver == 'browser' else ProcessPoolExecutor   # the browser solver is a Node process already
            with Pool(max_workers=workers) as ex:
                futs = {ex.submit(_sweep_point, jobs[i][0], kw): i for i in todo}
                for f in as_completed(futs):          # each point to the file as soon as it is done (3.16)
                    i = futs[f]
                    m, err = f.result()
                    finish(i, {**jobs[i][1], **m, **({'error': err} if err else {})})
        return result(workers)

    def _sweep_meta(self, n, solver, meas, kw, workers):
        return {'pcl': version(), 'project': self.name, 'hash': self.hash(), 'solver': solver, 'points': n, 'workers': workers,
                'measure': {m['name']: [m['key'], m['stat'], m.get('periods', 1)] for m in meas}, 'run': {k: v for k, v in kw.items() if k != 'measure'},
                'date': datetime.datetime.now().isoformat(timespec='seconds')}

    def bifurcation(self, param, values=None, start=None, stop=None, n=50, channel=None, stat='min', transient=200, record=50,
                    hdiv=None, method=None, workers=None, progress=None):
        """The bifurcation diagram as a sweep (3.15): for each value of param ('R1.R') a run of `transient` base periods,
        then one sample of `channel` per period over `record` periods (stat: min, max, avg or end), and the period of the
        samples (1, 2, 4, … or 0 for none: chaos or a slow transient). values=[…], or start, stop and n evenly spaced
        (the same values as the app's diagram). The same solver call as the app (MNA.sweepPoint), so the same numbers."""
        comp, _, par = str(param).partition('.')
        if not par:
            raise PclError('Η παράμετρος γράφεται <id>.<παράμετρος>, π.χ. R1.R.')
        self.comp(comp)
        if not channel:
            raise PclError('Δώσε κανάλι: channel="I:L1" (όπως στο scope).')
        if stat not in ('min', 'max', 'avg', 'end'):
            raise PclError('stat: min, max, avg ή end.')
        if values is None:
            if start is None or stop is None:
                raise PclError('Δώσε values=[...] ή start, stop (και n).')
            a, b, n = float(parse_value(start)), float(parse_value(stop)), max(2, int(n))
            values = [a + (b - a) * k / (n - 1) for k in range(n)]
        values = [float(parse_value(v)) for v in (values if isinstance(values, (list, tuple)) else values.tolist() if hasattr(values, 'tolist') else _as_list(values))]
        if not values:
            raise PclError('Η διακλάδωση δεν έχει τιμές.')
        base = {'action': 'bifurcation', 'project': self.data, 'comp': comp, 'param': par, 'key': channel, 'stat': stat,
                'transient': int(transient), 'record': int(record), 'hdiv': hdiv, 'method': method}
        progress = progress or _progress_hook
        pts, mode = [None] * len(values), 1
        # in the app's panel: all the values at once to the page's pool of solvers (3.15)
        if IN_BROWSER and workers != 1 and len(values) > 2 and _batch_hook is not None:
            res = _batch_hook([{**base, 'values': [v]} for v in values])
            if res is not None:
                for i, o in enumerate(res['outs']):
                    if o.get('error'):
                        raise PclError(o['error'])
                    pts[i] = o['out']['points'][0]
                mode = res['workers']
        if not pts[-1]:
            nw = 1 if IN_BROWSER else max(1, min(int(workers or os.cpu_count() or 1), len(values)))
            chunks = [list(range(len(values)))[k::nw] for k in range(nw)]
            if nw == 1:                # one value per request, for the progress
                for i, v in enumerate(values):
                    pts[i] = _node({**base, 'values': [v]})['points'][0]
                    if progress:
                        progress(i + 1, len(values))
            else:                      # a Node process per worker, with its share of the values
                from concurrent.futures import ThreadPoolExecutor
                with ThreadPoolExecutor(max_workers=nw) as ex:
                    futs = [ex.submit(_node, {**base, 'values': [values[i] for i in ch]}) for ch in chunks]
                    for ch, f in zip(chunks, futs):
                        for i, p in zip(ch, f.result()['points']):
                            pts[i] = p
            mode = nw
        meta = {'pcl': version(), 'project': self.name, 'hash': self.hash(), 'param': param, 'key': channel, 'stat': stat,
                'transient': int(transient), 'record': int(record), 'T': pts[0]['T'], 'workers': mode,
                'date': datetime.datetime.now().isoformat(timespec='seconds')}
        return BifurcationResult([p['value'] for p in pts], [p['y'] for p in pts], [p['period'] for p in pts], meta)


class _SweepFile:
    """The points of a sweep written as they finish (3.16, ROADMAP §41.1): a CSV with the point's number 'point' first,
    in the order they finish, so a stopped sweep continues with resume=True. At the end the file is written in the
    usual form (in the order of the points); for another format there is a <file>.part.csv meanwhile."""

    def __init__(self, path, params, names, n, resume):
        self.path = str(path)
        self.csv = self.path if Path(self.path).suffix.lower() == '.csv' else self.path + '.part.csv'
        self.cols = ['point'] + list(params) + list(names) + ['error']
        self.done = {}
        if resume and Path(self.csv).is_file():
            self.done = self._read(self.csv, params, names, n)
        with open(self.csv, 'w', encoding='utf-8', newline='') as f:     # again, with the points already done (clean, and in our columns)
            w = csv.writer(f)
            w.writerow(self.cols)
            for i, r in sorted(self.done.items()):
                w.writerow(self._line(i, r))

    @staticmethod
    def _val(v):
        if v == '':
            return None
        try:
            return float(v)
        except ValueError:
            return v

    def _read(self, path, params, names, n):
        with open(path, encoding='utf-8', newline='') as f:
            lines = [ln for ln in f if not ln.startswith('#')]
        rd = list(csv.reader(lines))
        if not rd:
            return {}
        head, body = rd[0], rd[1:]
        out = {}
        for k, row in enumerate(body):
            d = dict(zip(head, row))
            i = int(float(d['point'])) if d.get('point') not in (None, '') else k     # the final form has no 'point': the points in order
            if not 0 <= i < n or any(c not in d for c in names):
                continue
            r = {c: self._val(d[c]) for c in list(params) + list(names) if c in d}
            if d.get('error'):
                continue                       # a point that failed is tried again
            out[i] = r
        return out

    def _line(self, i, r):
        fmt = (lambda v: '' if v is None else format(float(v), '.17g') if isinstance(v, (int, float)) else str(v))
        return [str(i)] + [fmt(r.get(c)) for c in self.cols[1:]]

    def add(self, i, r):
        with open(self.csv, 'a', encoding='utf-8', newline='') as f:
            csv.writer(f).writerow(self._line(i, r))

    def close(self, sw):
        sw.save(self.path)
        if self.csv != self.path and Path(self.csv).is_file():
            os.remove(self.csv)


def _sweep_point(data, kw):
    try:
        r = Project(data).run(**kw, waveforms=kw.get('solver', 'browser') != 'browser')
        return dict(r.measured), None
    except Exception as e:      # noqa: BLE001 - one bad point does not stop the sweep
        return {}, str(e)


def _as_list(v):
    """'22u,47u,100u' or 'a:b:n' (n points from a to b)."""
    s = str(v)
    if s.count(':') == 2 and ',' not in s:
        a, b, n = s.split(':')
        a, b, n = parse_value(a), parse_value(b), int(n)
        return [a + (b - a) * i / (n - 1) for i in range(n)] if n > 1 else [a]
    return [x for x in s.split(',') if x.strip()]


def _spec(spec):
    """(key, stat[, periods | time]), 'V:C1:avg:10', 'N:C1:p:max:5', 'I:L1:at:2m', or {key, stat, periods | at}."""
    if isinstance(spec, dict):
        arg = spec.get('at', spec.get('periods', spec.get('arg')))
        if arg in ([], '', None):         # MATLAB's jsonencode writes an empty field as []
            arg = None
        return [spec['key'], spec.get('stat', 'avg')] + ([arg] if arg is not None else [])
    if isinstance(spec, str):
        tok = spec.split(':')
        i = max((j for j, x in enumerate(tok) if x in STATS), default=-1)
        if i < 1:
            return [spec, 'avg']
        return [':'.join(tok[:i]), tok[i], *tok[i + 1:]]
    return list(spec)


def _measures(measure):
    out = []
    if not measure:
        return out
    if isinstance(measure, dict) and 'key' in measure:
        measure = [measure]
    items = measure.items() if isinstance(measure, dict) else ((m.get('name') if isinstance(m, dict) else None, m) for m in measure)
    for name, spec in items:
        spec = _spec(spec)
        key, stat = spec[0], (spec[1] if len(spec) > 1 else 'avg')
        if stat not in STATS:
            raise PclError(f'Άγνωστη μέτρηση «{stat}»: {", ".join(STATS)}.')
        m = {'key': key, 'stat': stat, 'name': name or f'{key}:{stat}'}
        if stat == 'at':
            if len(spec) < 3:
                raise PclError(f'«{m["name"]}»: η μέτρηση at θέλει χρόνο, π.χ. ("V:C1", "at", 2e-3).')
            m['at'] = float(parse_value(spec[2]))
        elif len(spec) > 2:
            m['periods'] = max(1, int(float(parse_value(spec[2]))))
        out.append(m)
    return out


def _base_T(p):
    try:
        return p.channels().get('T')
    except Exception:           # noqa: BLE001
        return None


def _unit(key):
    return UNITS.get(key.split(':', 1)[0], '')


def _matname(key):
    n = re.sub(r'\W', '_', key, flags=re.ASCII).strip('_') or 'x'
    return n if n[0].isalpha() else 'x_' + n


class Result:
    """The waveforms of one run: t, one column per channel, the solver's settings and messages."""

    def __init__(self, t, keys, ch, meta, project, measured=None, diag=None):
        self.t = t
        self.keys = list(keys)
        self.ch = ch
        self.measured = dict(measured or {})
        self.diag = list(diag or [])
        self.events = []                # 3.19: the event log (run(events=True)): dicts t, kind, id, src, v, side, …
        pm = {'project': project.name, 'hash': project.hash(), 'changes': dict(project.changes)} if project is not None else {}
        self.meta = {'pcl': version(), **pm, 'date': datetime.datetime.now().isoformat(timespec='seconds'), **meta}

    def __getitem__(self, key):
        return self.ch[key]

    def __repr__(self):
        return f'<pcl.Result {len(self.t)} σημεία × {len(self.keys)} κανάλια, {self.meta.get("solver")}>'

    def events_csv(self, path, kinds=None):
        """The event log (3.19) as CSV: t, kind, id, source, value, side, unit, clock, n, from; kinds limits it."""
        cols = ('t', 'kind', 'id', 'src', 'v', 'side', 'u', 'clk', 'n', 'from')
        with open(path, 'w', encoding='utf-8', newline='') as f:
            w = csv.writer(f)
            w.writerow(['t [s]', 'kind', 'id', 'source', 'value', 'side', 'unit', 'clock', 'n', 'from'])
            for e in self.events:
                if kinds is None or e.get('kind') in kinds:
                    w.writerow(['' if e.get(c) is None else e.get(c) for c in cols])
        return path

    def measure(self, key, stat='avg', periods=1, at=None, f1=None):
        """Over the last `periods` base periods T: avg, rms, min, max, pp (trapezoidal in time); end; at (a time); thd (%).
        Pure Python (no numpy), so it is the same in the app's panel."""
        t = [float(v) for v in self.t]
        y = [float('nan') if v is None else float(v) for v in self.ch[key]]
        if not t:
            return float('nan')

        def interp(x):
            if x <= t[0]:
                return y[0]
            if x >= t[-1]:
                return y[-1]
            lo, hi = 0, len(t) - 1
            while hi - lo > 1:
                m = (lo + hi) // 2
                if t[m] <= x:
                    lo = m
                else:
                    hi = m
            return y[lo] + (y[hi] - y[lo]) * (x - t[lo]) / (t[hi] - t[lo]) if t[hi] > t[lo] else y[hi]
        if stat == 'end':
            return y[-1]
        if stat == 'at':
            return interp(float(at))
        T = self.meta.get('T') or (t[-1] - t[0])
        ta = max(t[0], t[-1] - periods * T)
        tt = [ta] + [v for v in t if v > ta]
        yy = [interp(ta)] + [y[i] for i, v in enumerate(t) if v > ta]
        d = tt[-1] - tt[0]
        if stat == 'thd':
            f = f1 or 1 / T
            P = max(1, round(d * f))
            n = 4096
            w0 = tt[-1] - P / f
            yu = [interp(w0 + (P / f) * i / n) for i in range(n)]

            def amp(h):
                c = sum(v * math.cos(2 * math.pi * h * i / n) for i, v in enumerate(yu))
                q = sum(v * math.sin(2 * math.pi * h * i / n) for i, v in enumerate(yu))
                return 2 * math.hypot(c, q) / n
            a1 = amp(P)
            return 100 * math.sqrt(sum(amp(h * P) ** 2 for h in range(2, 51) if h * P < n // 2)) / a1 if a1 > 0 else float('nan')
        if not d > 0:
            return yy[-1]
        if stat in ('avg', 'rms'):
            s0 = s2 = 0.0
            for i in range(1, len(tt)):
                h, a, b = tt[i] - tt[i - 1], yy[i - 1], yy[i]
                s0 += h * (a + b) / 2
                s2 += h * (a * a + a * b + b * b) / 3
            return s0 / d if stat == 'avg' else math.sqrt(max(0.0, s2 / d))
        if stat == 'min':
            return min(yy)
        if stat == 'max':
            return max(yy)
        if stat == 'pp':
            return max(yy) - min(yy)
        raise PclError(f'Άγνωστη μέτρηση «{stat}».')

    def frame(self):
        """pandas.DataFrame (index t) if pandas is installed, else {name: list}."""
        cols = {'t': self.t, **{k: self.ch[k] for k in self.keys}}
        try:
            import pandas as pd
            return pd.DataFrame(cols).set_index('t')
        except ImportError:
            return cols

    def _meta_lines(self):
        m = {k: v for k, v in self.meta.items() if k not in ('warnings',)}
        return [f'# {k}: {json.dumps(v, ensure_ascii=False)}' for k, v in m.items()]

    def to_csv(self, path, sep=',', decimal='.', meta=True):
        """Units in the header ('V:C1 [V]'). sep=';' and decimal=',' for a Greek Excel. Metadata as '#' lines
        (pandas: read_csv(..., comment='#'); MATLAB: readtable(..., 'CommentStyle', '#'))."""
        fmt = (lambda v: '' if v is None or (isinstance(v, float) and math.isnan(v)) else repr(float(v)).replace('.', decimal))
        with open(path, 'w', encoding='utf-8', newline='') as f:
            if meta:
                f.write('\n'.join(self._meta_lines()) + '\n')
            w = csv.writer(f, delimiter=sep)
            w.writerow(['t [s]'] + [f'{k} [{_unit(k)}]' if _unit(k) else k for k in self.keys])
            for i, t in enumerate(self.t):
                w.writerow([fmt(t)] + [fmt(self.ch[k][i]) for k in self.keys])
        return path

    def _vars(self):
        names, seen = [], {'t'}
        for k in self.keys:
            n = _matname(k)
            while n in seen:
                n += '_'
            seen.add(n)
            names.append(n)
        return names

    def as_dict(self):
        return {'kind': 'run', 'meta': self.meta, 'keys': self.keys, 'vars': self._vars(), 'units': {k: _unit(k) for k in self.keys},
                't': self.t, 'ch': self.ch, 'measure': self.measured, 'diag': self.diag}

    def to_json(self, path):
        Path(path).write_text(json.dumps(self.as_dict(), ensure_ascii=False), encoding='utf-8')
        return path

    def to_mat(self, path):
        """MATLAB .mat (level 5, compressed): t and one variable per channel (V:C1 → V_C1), names{} with the original keys,
        vars{}, units{}, meta (JSON text). Written here, without SciPy, so it works in the app's panel too."""
        items = [('t', [float(v) for v in self.t])]
        for k, n in zip(self.keys, self._vars()):
            items.append((n, [float('nan') if v is None else float(v) for v in self.ch[k]]))
        items += [('names', list(self.keys)), ('vars', self._vars()), ('units', [_unit(k) for k in self.keys]),
                  ('meta', json.dumps(self.meta, ensure_ascii=True))]
        _savemat(path, items)
        return path

    def to_parquet(self, path, compression='gzip'):
        """Parquet (3.15): t and one column per channel with its key as the name, the meta as JSON in the file's metadata.
        Written here, without pyarrow: pandas.read_parquet, Polars, DuckDB and MATLAB parquetread read it."""
        from .formats import write_parquet
        cols = [('t', self.t)] + [(k, self.ch[k]) for k in self.keys]
        write_parquet(path, cols, meta={**self.meta, 'units': {k: _unit(k) for k in self.keys}, 'measure': self.measured}, compression=compression, created_by='pcl ' + version())
        return path

    def to_hdf5(self, path):
        """HDF5 (3.15, needs h5py): a dataset per channel (named by its key), attributes meta and columns."""
        from .formats import write_hdf5
        write_hdf5(path, [('t', self.t)] + [(k, self.ch[k]) for k in self.keys], meta={**self.meta, 'units': {k: _unit(k) for k in self.keys}, 'measure': self.measured})
        return path

    def save(self, path, **kw):
        return _save(self, path, **kw)


def _save(res, path, **kw):
    ext = Path(path).suffix.lower()
    f = {'.csv': res.to_csv, '.json': res.to_json, '.mat': res.to_mat, '.parquet': res.to_parquet, '.pq': res.to_parquet,
         '.h5': res.to_hdf5, '.hdf5': res.to_hdf5}.get(ext, res.to_csv)
    return f(path, **kw)


class SweepResult:
    """One row per point: the parameters, then the measurements."""

    def __init__(self, rows, params, names, meta):
        self.rows = rows
        self.params = params
        self.names = names
        self.meta = meta

    def __repr__(self):
        return f'<pcl.SweepResult {len(self.rows)} σημεία: {", ".join(self.params)} → {", ".join(self.names)}>'

    def column(self, name):
        return [r.get(name) for r in self.rows]

    def frame(self):
        try:
            import pandas as pd
            return pd.DataFrame(self.rows)
        except ImportError:
            return {k: self.column(k) for k in self.params + self.names}

    def to_csv(self, path, sep=',', decimal='.', meta=True):
        cols = self.params + self.names + (['error'] if any('error' in r for r in self.rows) else [])
        fmt = (lambda v: '' if v is None else format(float(v), '.12g').replace('.', decimal) if isinstance(v, (int, float)) else str(v))
        with open(path, 'w', encoding='utf-8', newline='') as f:
            if meta:
                f.write('\n'.join(f'# {k}: {json.dumps(v, ensure_ascii=False)}' for k, v in self.meta.items()) + '\n')
            w = csv.writer(f, delimiter=sep)
            w.writerow(cols)
            for r in self.rows:
                w.writerow([fmt(r.get(c)) for c in cols])
        return path

    def to_json(self, path):
        Path(path).write_text(json.dumps({'meta': self.meta, 'params': self.params, 'measure': self.names, 'rows': self.rows}, ensure_ascii=False), encoding='utf-8')
        return path

    def to_mat(self, path):
        cols = self.params + self.names
        items = [(_matname(c), [float('nan') if x is None or isinstance(x, str) else float(x) for x in self.column(c)]) for c in cols]
        items += [('columns', cols), ('meta', json.dumps(self.meta, ensure_ascii=True))]
        _savemat(path, items)
        return path

    def _columns(self):
        cols = self.params + self.names + (['error'] if any('error' in r for r in self.rows) else [])
        return [(c, self.column(c)) for c in cols]

    def to_parquet(self, path, compression='gzip'):
        """Parquet (3.15): one row per point, the parameters, the measurements and the errors (if any)."""
        from .formats import write_parquet
        write_parquet(path, self._columns(), meta=self.meta, compression=compression, created_by='pcl ' + version())
        return path

    def to_hdf5(self, path):
        from .formats import write_hdf5
        write_hdf5(path, self._columns(), meta=self.meta)
        return path

    def save(self, path, **kw):
        return _save(self, path, **kw)


class BifurcationResult:
    """The bifurcation diagram (3.15): values[i], the samples y[i] (one per base period) and their period[i]
    (1, 2, 4, …; 0 = none found: chaos or a slow transient)."""

    def __init__(self, values, y, period, meta):
        self.values = [float(v) for v in values]
        self.y = [[None if v is None else float(v) for v in r] for r in y]
        self.period = [None if p is None else int(p) for p in period]
        self.meta = meta
        self.param = meta.get('param', 'value')

    def __repr__(self):
        return f'<pcl.BifurcationResult {len(self.values)} τιμές του {self.param}, {self.meta.get("record")} δείγματα η καθεμία>'

    def changes(self):
        """The first value of each new period along the sweep, as the app's table: [(value, period)]."""
        out = []
        for k in range(1, len(self.values)):
            p0, p1 = self.period[k - 1], self.period[k]
            if (p1 != p0 and p1 != 0) or (p1 == 0 and (p0 or 0) > 0):
                out.append((self.values[k], p1))
        return out

    def rows(self):
        """Long form: one row per sample (value, k, y, period)."""
        return [{self.param: v, 'k': k, 'y': y, 'period': p} for v, ys, p in zip(self.values, self.y, self.period) for k, y in enumerate(ys)]

    def _columns(self):
        r = self.rows()
        return [(c, [x[c] for x in r]) for c in (self.param, 'k', 'y', 'period')]

    def frame(self):
        try:
            import pandas as pd
            return pd.DataFrame(self.rows())
        except ImportError:
            return dict(self._columns())

    def plot(self, title=None):
        return show(self, title)

    def to_csv(self, path, sep=',', decimal='.', meta=True):
        fmt = (lambda v: '' if v is None else format(float(v), '.12g').replace('.', decimal))
        with open(path, 'w', encoding='utf-8', newline='') as f:
            if meta:
                f.write('\n'.join(f'# {k}: {json.dumps(v, ensure_ascii=False)}' for k, v in self.meta.items()) + '\n')
            w = csv.writer(f, delimiter=sep)
            w.writerow([self.param, 'k', self.meta.get('key', 'y') + f' ({self.meta.get("stat", "")})', 'period'])
            for r in self.rows():
                w.writerow([fmt(r[self.param]), r['k'], fmt(r['y']), r['period']])
        return path

    def to_json(self, path):
        Path(path).write_text(json.dumps({'meta': self.meta, 'values': self.values, 'y': self.y, 'period': self.period}, ensure_ascii=False), encoding='utf-8')
        return path

    def to_mat(self, path):
        """values (n×1), Y (n×record, one row per value), period (n×1), meta (JSON)."""
        _savemat(path, [('values', self.values), ('Y', self.y), ('period', [float('nan') if p is None else p for p in self.period]),
                        ('meta', json.dumps(self.meta, ensure_ascii=True))])
        return path

    def to_parquet(self, path, compression='gzip'):
        from .formats import write_parquet
        write_parquet(path, self._columns(), meta=self.meta, compression=compression, created_by='pcl ' + version())
        return path

    def to_hdf5(self, path):
        from .formats import write_hdf5
        write_hdf5(path, [('values', self.values), ('period', self.period)], meta=self.meta, matrices={'Y': self.y})
        return path

    def save(self, path, **kw):
        return _save(self, path, **kw)


# ----------------------------------------------------------------- MATLAB level-5 .mat, without SciPy
# A column of doubles (n×1), a text (1×m char, ASCII) or a list of texts (k×1 cell). Each variable is zlib-compressed
# (miCOMPRESSED), as MATLAB writes them; MATLAB, Octave and scipy.io.loadmat read it.
_MI_INT8, _MI_INT32, _MI_UINT32, _MI_DOUBLE, _MI_MATRIX, _MI_COMPRESSED, _MI_UTF8 = 1, 5, 6, 9, 14, 15, 16
_MX_CELL, _MX_CHAR, _MX_DOUBLE = 1, 4, 6


def _el(kind, payload):
    pad = (-len(payload)) % 8
    return struct.pack('<II', kind, len(payload)) + payload + b'\0' * pad


def _matrix(name, cls, dims, data):
    head = _el(_MI_UINT32, struct.pack('<II', cls, 0)) + _el(_MI_INT32, struct.pack(f'<{len(dims)}i', *dims)) + _el(_MI_INT8, name.encode('ascii'))
    return _el(_MI_MATRIX, head + data)


def _ascii(text):
    """MATLAB counts UTF-16 units and Octave UTF-8 bytes, so a text in the .mat is plain ASCII: N·m → N*m, μ → u,
    anything else as \\uXXXX (the meta is JSON with ensure_ascii, so it decodes back exactly)."""
    t = str(text).replace('·', '*').replace('μ', 'u').replace('µ', 'u')
    return t.encode('ascii', 'backslashreplace').decode('ascii')


def _mat_char(name, text):
    b = _ascii(text).encode('ascii')
    return _matrix(name, _MX_CHAR, (1, len(b)) if b else (0, 0), _el(_MI_UTF8, b))


def _mat_value(name, v):
    if isinstance(v, str):
        return _mat_char(name, v)
    if v and all(isinstance(x, (list, tuple)) for x in v):          # a matrix, one list per row (column-major in the file)
        m = max(len(r) for r in v)
        vals = [float('nan') if j >= len(r) or r[j] is None else float(r[j]) for j in range(m) for r in v]
        return _matrix(name, _MX_DOUBLE, (len(v), m), _el(_MI_DOUBLE, struct.pack(f'<{len(vals)}d', *vals)))
    if v and all(isinstance(x, str) for x in v):
        return _matrix(name, _MX_CELL, (len(v), 1), b''.join(_mat_char('', x) for x in v))
    vals = [float(x) for x in v]
    return _matrix(name, _MX_DOUBLE, (len(vals), 1), _el(_MI_DOUBLE, struct.pack(f'<{len(vals)}d', *vals)))


def _savemat(path, items):
    head = f'MATLAB 5.0 MAT-file, Platform: pcl, Created on: {datetime.datetime.now():%a %b %d %H:%M:%S %Y}'.encode('ascii')[:116]
    out = [head.ljust(116, b' ') + b'\0' * 8 + struct.pack('<H', 0x0100) + b'IM']
    for name, v in items:
        if not re.fullmatch(r'[A-Za-z]\w{0,62}', name):
            raise PclError(f'Μη έγκυρο όνομα μεταβλητής MATLAB: {name}')
        z = zlib.compress(_mat_value(name, v))
        out.append(struct.pack('<II', _MI_COMPRESSED, len(z)) + z)      # compressed elements are not padded
    Path(path).write_bytes(b''.join(out))
