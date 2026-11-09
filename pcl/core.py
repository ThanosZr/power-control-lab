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

* 'browser': the same web/studio/*.js as the app (pcl/runner.js), so the results are the app's.
* 'scipy': the same netlist (MNA.exportForBatch) solved by engine.batch.simulate.
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
import subprocess
from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor
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


def _node(q, timeout=None):
    if shutil.which('node') is None:
        raise PclError('Χρειάζεται το Node.js για τον λύτη του browser (https://nodejs.org). Αλλιώς solver="scipy".')
    r = subprocess.run(['node', str(RUNNER)], input=json.dumps(q), capture_output=True, text=True, timeout=timeout, cwd=str(ROOT))
    if r.returncode:
        raise PclError(r.stderr.strip() or 'Ο λύτης του browser σταμάτησε.')
    return json.loads(r.stdout)


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
    if not isinstance(data, dict) or not isinstance(data.get('components'), list):
        raise PclError(f'{p}: δεν είναι project του Power Converter Lab (λείπουν τα components).')
    return Project(data, name=p.stem)


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
        return (self.comp(head).get('params') or {}).get(prm)

    def set(self, key, value):
        """'<id>.<parameter>' (e.g. 'L1.L', 'PWM1.fs', 'V1.sched'), or 'solve.<k>' / 'sim.<k>' for the solver
        (solve.step = 'var', solve.rtol, solve.hmax; sim.hDiv, sim.method). Values: numbers, '47u', or programs 't:value'."""
        head, dot, prm = key.partition('.')
        if not dot or not prm:
            raise PclError(f'«{key}»: γράψε <id>.<παράμετρος>, π.χ. L1.L')
        v = parse_value(value)
        if head in ('solve', 'sim'):
            self.data.setdefault(head, {})[prm] = v
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
        keep = {k: self.data.get(k) for k in ('components', 'wires', 'solve')}
        return hashlib.sha256(json.dumps(keep, sort_keys=True, ensure_ascii=False).encode()).hexdigest()[:16]

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
            t_from=0.0, max_points=200000, measure=None, timeout=None, scipy_method='Radau', waveforms=True):
        """One simulation. t_end: duration in s (default the tutorial's stopT). channels: keys as in the app's scope
        (default the project's scope, else V and I of every element). step='var' for the variable step (§40).
        solver='scipy' runs engine.batch.simulate on the same netlist (method scipy_method, rtol, max step hmax in s)."""
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
                         'step': st, 'from': t_from, 'max_points': max_points, 'measure': meas, 'waveforms': bool(waveforms)}, timeout=timeout)
            meta = {**out['meta'], 'solver': 'browser (web/studio/mna.js, Node)'}
            return Result(out.get('t') or [], out['keys'], out.get('ch') or {}, meta, self, out.get('measure') or {}, out.get('diag') or [])
        if solver == 'scipy':
            return self._run_scipy(t_end, keys, scipy_method, rtol, hmax, max_points, meas, t_from)
        raise PclError(f'Άγνωστος λύτης «{solver}»: browser ή scipy.')

    def _run_scipy(self, t_end, keys, method, rtol, hmax, max_points, meas, t_from):
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
                          'max_points': max_points, '_local': True})
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
        for m in meas:
            res.measured[m['name']] = res.measure(m['key'], m['stat'], m.get('periods', 1), at=m.get('at'), f1=m.get('f1'))
        return res

    def sweep(self, grid=None, points=None, t_end=None, measure=None, workers=None, solver='browser', mode='grid', progress=None, **run_kw):
        """A run per point: grid={'L1.L': [...], 'R1.R': [...]} (every combination, or mode='zip' side by side),
        or points=[{'L1.L': 22e-6, 'R1.R': 5}, …]. measure={'name': (key, stat, periods)} with stat in
        avg, rms, min, max, pp (over the last periods base periods), end, ('at', t), thd. In parallel on `workers`."""
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
        workers = max(1, min(int(workers or os.cpu_count() or 1), n))
        Pool = ThreadPoolExecutor if solver == 'browser' else ProcessPoolExecutor   # the browser solver is a Node process already
        rows = [None] * n
        with Pool(max_workers=workers) as ex:
            futs = {ex.submit(_sweep_point, d, kw): i for i, (d, _) in enumerate(jobs)}
            done = 0
            for f in futs:
                i = futs[f]
                m, err = f.result()
                rows[i] = {**{k: v for k, v in jobs[i][1].items()}, **m, **({'error': err} if err else {})}
                done += 1
                if progress:
                    progress(done, n)
        meta = {'pcl': version(), 'project': self.name, 'hash': self.hash(), 'solver': solver, 'points': n,
                'measure': {m['name']: [m['key'], m['stat'], m.get('periods', 1)] for m in meas}, 'run': {k: v for k, v in kw.items() if k != 'measure'},
                'date': datetime.datetime.now().isoformat(timespec='seconds')}
        return SweepResult(rows, list(points[0]) if points else [], [m['name'] for m in meas], meta)


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
    """(key, stat[, periods | time]) or 'V:C1:avg:10', 'N:C1:p:max:5', 'I:L1:at:2m'."""
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
    items = measure.items() if isinstance(measure, dict) else ((None, m) for m in measure)
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
        self.meta = {'pcl': version(), 'project': project.name, 'hash': project.hash(), 'changes': dict(project.changes),
                     'date': datetime.datetime.now().isoformat(timespec='seconds'), **meta}

    def __getitem__(self, key):
        return self.ch[key]

    def __repr__(self):
        return f'<pcl.Result {len(self.t)} σημεία × {len(self.keys)} κανάλια, {self.meta.get("solver")}>'

    def measure(self, key, stat='avg', periods=1, at=None, f1=None):
        """Over the last `periods` base periods T: avg, rms, min, max, pp (trapezoidal in time); end; at (a time); thd (%)."""
        import numpy as np
        t = np.asarray(self.t, dtype=float)
        y = np.asarray(self.ch[key], dtype=float)
        if stat == 'end':
            return float(y[-1])
        if stat == 'at':
            return float(np.interp(float(at), t, y))
        T = self.meta.get('T') or (t[-1] - t[0])
        ta = max(t[0], t[-1] - periods * T)
        tt = np.concatenate(([ta], t[t > ta]))
        yy = np.concatenate(([np.interp(ta, t, y)], y[t > ta]))
        d = tt[-1] - tt[0]
        if stat == 'thd':
            f = f1 or 1 / T
            n = max(64, 2 ** int(math.ceil(math.log2(len(tt) * 2))))
            P = max(1, round(d * f))
            tu = np.linspace(tt[-1] - P / f, tt[-1], n, endpoint=False)
            yu = np.interp(tu, tt, yy)
            A = np.abs(np.fft.rfft(yu)) * 2 / n
            h1 = A[P]
            hs = A[2 * P:min(len(A), 51 * P):P]
            return float(100 * math.sqrt(float((hs ** 2).sum())) / h1) if h1 > 0 else float('nan')
        if not d > 0:
            return float(yy[-1])
        if stat == 'avg':
            return float(np.trapezoid(yy, tt) / d) if hasattr(np, 'trapezoid') else float(np.trapz(yy, tt) / d)
        if stat == 'rms':
            h = np.diff(tt)
            return float(math.sqrt(max(0.0, float((h * (yy[:-1] ** 2 + yy[:-1] * yy[1:] + yy[1:] ** 2) / 3).sum() / d))))
        if stat == 'min':
            return float(yy.min())
        if stat == 'max':
            return float(yy.max())
        if stat == 'pp':
            return float(yy.max() - yy.min())
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

    def to_json(self, path):
        Path(path).write_text(json.dumps({'meta': self.meta, 'keys': self.keys, 'units': {k: _unit(k) for k in self.keys}, 't': self.t,
                                          'ch': self.ch, 'measure': self.measured, 'diag': self.diag}, ensure_ascii=False), encoding='utf-8')
        return path

    def to_mat(self, path):
        """MATLAB .mat: t and one variable per channel (V:C1 → V_C1), names{} with the original keys, units{}, meta (JSON text)."""
        import numpy as np
        from scipy.io import savemat
        d = {'t': np.asarray(self.t, dtype=float).reshape(-1, 1)}
        names = []
        for k in self.keys:
            n = _matname(k)
            while n in d:
                n += '_'
            d[n] = np.asarray(self.ch[k], dtype=float).reshape(-1, 1)
            names.append(n)
        d['names'] = np.array(self.keys, dtype=object).reshape(-1, 1)
        d['vars'] = np.array(names, dtype=object).reshape(-1, 1)
        d['units'] = np.array([_unit(k) for k in self.keys], dtype=object).reshape(-1, 1)
        d['meta'] = json.dumps(self.meta, ensure_ascii=False)
        savemat(path, d, do_compression=True)
        return path

    def save(self, path, **kw):
        ext = Path(path).suffix.lower()
        return {'.csv': self.to_csv, '.json': self.to_json, '.mat': self.to_mat}.get(ext, self.to_csv)(path, **kw)


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
        import numpy as np
        from scipy.io import savemat
        d = {}
        for c in self.params + self.names:
            v = self.column(c)
            d[_matname(c)] = np.array([np.nan if x is None or isinstance(x, str) else x for x in v], dtype=float).reshape(-1, 1)
        d['columns'] = np.array(self.params + self.names, dtype=object).reshape(-1, 1)
        d['meta'] = json.dumps(self.meta, ensure_ascii=False)
        savemat(path, d, do_compression=True)
        return path

    def save(self, path, **kw):
        ext = Path(path).suffix.lower()
        return {'.csv': self.to_csv, '.json': self.to_json, '.mat': self.to_mat}.get(ext, self.to_csv)(path, **kw)
