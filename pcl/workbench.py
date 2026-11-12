"""The circuit of the app as the plant of the Control Workbench EV/DC (3.16, ROADMAP §38 stage 2, §19).

The workbench's schemes (PID, indirect adaptive inverse, multi-objective, harmonic injection) touch a plant only through
its contract: step(u, dt) → y, output(), measured(), measured_scale(), u_range(), y_range(), reset_state(), clone(),
viz_state(), name, p. CircuitPlant answers that contract with a circuit of Power & Control Lab: u goes into a signal of
the circuit (a «Σταθερά» block, or a signal input that gets one), the circuit runs dt with the app's solver (the same
web/studio/*.js, in a Node process kept open), and y and the state are the circuit's measurements. So the same schemes
control a switched converter with its ripple, dead time and saturation, not the workbench's averaged model.

The circuit comes from a file, a tutorial, or the app open in the browser through the link (pcl.link):

    import pcl, pcl.workbench as wb
    app = pcl.link.connect()                                      # the circuit on the screen
    Plant = wb.plant_class(app.project(), input='AC1R', measure='M1:w', state=['AM1:y'],
                           u_range=(0, 150), y_range=(0, 160), name='Μηχανή ΣΡ (PCL)')
    wb.register(Plant, '/path/to/control_workbench')              # appears in the workbench's plant list
    # then: python examples/workbench_plant.py --workbench /path/to/control_workbench --link

The steps run where the solver is (here), the results can go back to the app's panel with app.show(...).
"""
import sys
from pathlib import Path

from .core import PclError, Project, _Session, _open, parse_value


def _chan(keys, sig):
    cid, _, pin = str(sig).partition(':')
    if not pin:
        pin = 'y'
    for k in (f'Y:{cid}:{pin}', f'Y:{cid}', f'{sig}'):
        if k in keys:
            return k
    raise PclError(f'Δεν βρέθηκε κανάλι για το σήμα «{sig}». Υπάρχουν π.χ. {", ".join(keys[:12])} …')


def prepare(project, input, measure, state=()):   # noqa: A002 - the workbench's word
    """The project with a «Σταθερά» block for the plant input (or the one given), and the input block's id.
    input: the id of a «Σταθερά / πρόγραμμα» block (it is set directly), or '<id>:<pin>' of a signal input
    (a block WBU is added and connected there; a PWM's duty goes to mode 'ext')."""
    pr = Project(project.data if isinstance(project, Project) else project).data
    comps = pr['components']
    ids = {c['id']: c for c in comps}
    cid, _, pin = str(input).partition(':')
    if not pin:
        c = ids.get(cid)
        if not c or c.get('type') != 'CONST':
            raise PclError(f'Η είσοδος «{input}»: δώσε μπλοκ «Σταθερά / πρόγραμμα» ή <id>:<ακροδέκτη> εισόδου σήματος.')
        uid = cid
    else:
        c = ids.get(cid)
        if not c:
            raise PclError(f'Δεν υπάρχει το στοιχείο «{cid}».')
        uid = 'WBU'
        comps[:] = [x for x in comps if x['id'] != uid]
        comps.append({'id': uid, 'type': 'CONST', 'x': min(x.get('x', 0) for x in comps) - 120, 'y': min(x.get('y', 0) for x in comps) - 120,
                      'rot': 0, 'flip': False, 'label': 'u (workbench)', 'params': {'v': '0'}})
        if c['type'] == 'PWM' and pin == 'd':
            c['params']['mode'] = 'ext'
        c.setdefault('params', {})['in_' + pin] = uid + ':y'
    for s in [measure, *state]:
        if str(s).partition(':')[0] not in ids:
            raise PclError(f'Δεν υπάρχει η μέτρηση «{s}».')
    return pr, uid


class CircuitPlant:
    """A workbench Plant made of a circuit (use plant_class to fix the circuit and its signals)."""

    id = 'pcl_circuit'
    name = 'Κύκλωμα του Power & Control Lab'
    input_name, input_unit, output_name, output_unit = 'u', '', 'y', ''
    PARAMS = {}
    substeps = 1
    # set by plant_class
    PROJECT = None
    INPUT = None
    MEASURE = None
    STATE = ()
    U_RANGE = (-1.0, 1.0)
    Y_RANGE = (-1.0, 1.0)
    STATE_SCALE = None
    SETTLE = 0.0
    SOLVER = {}

    def __init__(self, params=None):
        if self.PROJECT is None:
            raise PclError('Φτιάξε την κλάση με pcl.workbench.plant_class(project, input=…, measure=…).')
        self.p = {**self.PARAMS, **(params or {})}
        self.data, self.uid = prepare(self.PROJECT, self.INPUT, self.MEASURE, self.STATE)
        q = Project(self.data)
        for k, v in self.p.items():                  # '<id>.<param>' in the workbench's Settings are circuit parameters
            if '.' in str(k):
                q.set(k, v)
        self.data = q.data
        self.sess = None
        self.sid = None
        self.t = 0.0
        self.last_u = 0.0
        self.vals = {}
        self.snap = None
        self.pending = {}

    # ------------------------------------------------------------------ the solver, opened on the first step
    def _open(self):
        self.sess = _Session()
        keys = self.sess({'action': 'channels', 'project': self.data})['keys']
        self.ch_y = _chan(keys, self.MEASURE)
        self.ch_s = [_chan(keys, s) for s in self.STATE]
        q = {'action': 'open', 'project': self.data, 'channels': [self.ch_y] + self.ch_s, 'check': False}
        sv = self.SOLVER or {}
        q.update({k: sv[k] for k in ('hdiv', 'method') if k in sv})
        if self.snap is not None:
            q.update({'state': self.snap, 'saved': self.data})
        o = self.sess(q)
        self.sid, self.t = o['sid'], float(o['t'])
        self.T = float(o['T'])
        if self.snap is None:
            self._read(None)
            if self.SETTLE > 0:                         # a settled start (e.g. a converter in steady state), kept for every reset
                self._advance(self.SETTLE, None)
            self.snap = self.sess({'action': 'state', 'sid': self.sid})
            self.vals0 = dict(self.vals)

    def _read(self, out):
        if out is None:
            self.vals = {k: 0.0 for k in [self.ch_y] + self.ch_s}
            return
        for k in [self.ch_y] + self.ch_s:
            v = out['ch'][k]
            if v:
                self.vals[k] = float(v[-1])

    def _advance(self, dt, u):
        q = {'action': 'advance', 'sid': self.sid, 't_end': self.t + float(dt), 'max_points': 4}
        if u is not None or self.pending:
            q['set'] = {**self.pending, **({self.uid: float(u)} if u is not None else {})}
            self.pending = {}
        out = self.sess(q)
        self.t = float(out['t1'])
        self._read(out)

    def set_live(self, values):
        """4.8.1: changes of the circuit for the next step, as in the app while it runs ({'M1.TL': 2}: a parameter, the
        states kept; {'KL': 3}: a «Σταθερά» block). A reset returns to the circuit as it was."""
        self.pending.update({str(k): v for k, v in dict(values).items()})

    def close(self):
        if self.sess is not None:
            try:
                self.sess({'action': 'close', 'sid': self.sid})
            except PclError:
                pass
            self.sess.close()
            self.sess = None

    def __del__(self):
        try:
            self.close()
        except Exception:        # noqa: BLE001
            pass

    # ------------------------------------------------------------------ the workbench's contract
    def step(self, u, dt):
        """The circuit dt seconds with u held (zero-order hold, as a sampled controller); returns y."""
        lo, hi = self.u_range()
        u = min(hi, max(lo, float(u)))
        if self.sess is None:
            self._open()
        self.last_u = u
        self._advance(dt, u)
        return self.output()

    def output(self):
        if self.sess is None:
            self._open()
        return self.vals.get(self.ch_y, 0.0)

    def measured(self):
        if self.sess is None:
            self._open()
        out = [self.vals.get(self.ch_y, 0.0)] + [self.vals.get(k, 0.0) for k in self.ch_s]
        try:
            import numpy as np
            return np.array(out)
        except ImportError:
            return out

    def measured_scale(self):
        ys = max(abs(self.Y_RANGE[0]), abs(self.Y_RANGE[1])) or 1.0
        sc = [ys] + [float(v) for v in (self.STATE_SCALE or [1.0] * len(self.STATE))]
        try:
            import numpy as np
            return np.array(sc)
        except ImportError:
            return sc

    def u_range(self):
        return tuple(float(v) for v in self.U_RANGE)

    def y_range(self):
        return tuple(float(v) for v in self.Y_RANGE)

    def reset_state(self):
        """Back to the start (t = 0, or the settled state): the saved state, without solving the start again."""
        if self.sess is not None:
            try:
                self.sess({'action': 'close', 'sid': self.sid})
            except PclError:
                pass
            q = {'action': 'open', 'project': self.data, 'channels': [self.ch_y] + self.ch_s, 'state': self.snap, 'saved': self.data}
            o = self.sess(q)
            self.sid, self.t = o['sid'], float(o['t'])
            self.vals = dict(self.vals0)
        self.last_u = 0.0
        self.pending = {}

    def clone(self):
        return type(self)(dict(self.p))

    def viz_state(self):
        d = {'output': self.vals.get(getattr(self, 'ch_y', ''), 0.0), 'input': self.last_u, 't': self.t}
        for s, k in zip(self.STATE, getattr(self, 'ch_s', [])):
            d[s] = self.vals.get(k, 0.0)
        if self.STATE:
            d['current'] = d.get(self.STATE[0], 0.0)      # the workbench's visuals read a current
        d['speed'] = d['output']
        return d

    def params_dict(self):
        return dict(self.p)

    # unused by the schemes (the step is the circuit's), kept for the contract
    def initial_state(self):
        return [0.0]

    def deriv(self, x, u):
        raise NotImplementedError('Το σύστημα υπό έλεγχο (plant) είναι το κύκλωμα: step(u, dt), όχι deriv.')


def plant_class(project, input, measure, state=(), u_range=(-1.0, 1.0), y_range=(-1.0, 1.0), state_scale=None,  # noqa: A002
                name=None, pid='pcl_circuit', settle=0.0, solver=None, params=None, input_name='u', output_name='y'):
    """A CircuitPlant class bound to one circuit (a pcl.Project, a project dict, a file or 'tutorial:<id>').
    input: the plant input (see prepare); measure: the output y ('M1:w'); state: more measurements ('AM1:y');
    settle: seconds to run before the first step (every reset_state returns there); solver: {'hdiv', 'method'};
    params: the plant's PARAMS for the workbench's Settings ('<id>.<param>' entries change the circuit)."""
    p = project if isinstance(project, Project) else _open(project) if not isinstance(project, dict) else Project(project)
    attrs = {'id': pid, 'name': name or f'Κύκλωμα PCL ({p.name})', 'PROJECT': p.data, 'INPUT': input, 'MEASURE': measure,
             'STATE': tuple(state), 'U_RANGE': tuple(float(parse_value(v)) for v in u_range), 'Y_RANGE': tuple(float(parse_value(v)) for v in y_range),
             'STATE_SCALE': list(state_scale) if state_scale else None, 'SETTLE': float(parse_value(settle)), 'SOLVER': dict(solver or {}),
             'PARAMS': dict(params or {}), 'input_name': input_name, 'output_name': output_name}
    return type('PclCircuitPlant', (CircuitPlant,), attrs)


def serve(inp=None, out=None):
    """4.8.1 (ROADMAP §48): a CircuitPlant over JSON lines, for MATLAB and Octave (matlab/PclPlant.m, `python -m pcl plant`).
    The first line opens it: {project, set: [[key, value], …], input, measure, state, u_range, y_range, settle, hdiv, method};
    then {op: 'step', u, dt} → {t, y, m, u}; {op: 'reset'}; {op: 'set', values: {key: value}}; {op: 'info'}; {op: 'close'}.
    One answer line per request: {"ok": …} or {"error": "…"}. The steps are those of the Python CircuitPlant, so a
    controller written in MATLAB sees the same numbers as the same controller in Python."""
    import json
    inp = inp or sys.stdin
    out = out or sys.stdout
    pl = None

    def state():
        m = [float(v) for v in pl.measured()]
        return {'t': pl.t, 'y': m[0], 'm': m, 'u': pl.last_u}

    for line in inp:
        if not line.strip():
            continue
        done = False
        try:
            q = json.loads(line)
            op = q.get('op', 'open' if pl is None else '')
            if op == 'open':
                pr = q.get('project')
                p = Project(pr) if isinstance(pr, dict) else _open(str(pr))
                for k, v in (q.get('set') or []):
                    p.set(k, v)
                st = q.get('state') or []
                st = [st] if isinstance(st, str) else list(st)
                solver = {k: q[k] for k in ('hdiv', 'method') if q.get(k)}
                Plant = plant_class(p, q['input'], q['measure'], st, q.get('u_range') or (-1, 1), q.get('y_range') or (-1, 1),
                                    settle=q.get('settle') or 0, solver=solver)
                if pl is not None:
                    pl.close()
                pl = Plant()
                pl.output()
                r = {**state(), 'keys': [pl.ch_y, *pl.ch_s], 'T': pl.T, 'input': pl.uid, 'u_range': list(pl.u_range())}
            elif pl is None:
                raise PclError('Άνοιξε πρώτα το σύστημα (project, input, measure).')
            elif op == 'step':
                pl.step(float(q.get('u', 0.0)), float(q['dt']))
                r = state()
            elif op == 'reset':
                pl.reset_state()
                r = state()
            elif op == 'set':
                pl.set_live(q.get('values') or {})
                r = {'pending': sorted(pl.pending)}
            elif op == 'info':
                r = {**state(), 'keys': [pl.ch_y, *pl.ch_s], 'T': pl.T}
            elif op == 'close':
                pl.close()
                pl = None
                r = {}
                done = True
            else:
                raise PclError(f'Άγνωστη εντολή «{op}» (step, reset, set, info, close).')
            ans = {'ok': r}
        except (PclError, KeyError, ValueError, TypeError) as e:
            ans = {'error': str(e) if not isinstance(e, KeyError) else f'Λείπει το πεδίο {e}.'}
        out.write(json.dumps(ans, ensure_ascii=False) + '\n')
        out.flush()
        if done:
            break
    if pl is not None:
        pl.close()


def register(cls, workbench=None):
    """Registers the plant class in the workbench's registry (core.registry.register_plant). workbench: its folder,
    put on sys.path if given. Returns the class."""
    if workbench:
        w = str(Path(workbench).resolve())
        if w not in sys.path:
            sys.path.insert(0, w)
    try:
        from core.registry import register_plant
    except ImportError as e:
        raise PclError(f'Δεν βρέθηκε το Control Workbench (core.registry): δώσε τον φάκελό του. ({e})') from None
    return register_plant(cls)


def run_scheme(plant, scheme_cls, reference, dt, params=None):
    """Runs a workbench scheme on the plant without the workbench's GUI: all its steps, in order (for the indirect
    inverse: excite, emulator, controller, online). Returns the scheme (log, metrics()). The GUI does the same."""
    sc = scheme_cls(plant, reference, dt, params or {})
    for st in sc.steps():
        sc.run_step(st.id)
    return sc


def launch(workbench, project, input, measure, state=(), u_range=(-1, 1), y_range=(-1, 1), state_scale=None, name=None,  # noqa: A002
           solver=None, settle=0.0, headless=None, dt=0.01, steps=(0.3, 0.7, 0.5), n=60, app=None):
    """The workbench with the circuit as a plant (`python -m pcl workbench …`). Without headless: its GUI, where the
    plant is in the list. headless=['iaic', 'pid']: those schemes on a staircase reference (fractions `steps` of the
    output range, n samples each, sample dt), a row of metrics per scheme, and the table to the app if `app`."""
    Plant = plant_class(project, input, measure, state, u_range, y_range, state_scale, name, settle=settle, solver=solver)
    register(Plant, workbench)
    import bootstrap  # noqa: F401 - the workbench's own plants and schemes
    if not headless:
        import main as wb_main
        wb_main.main()
        return None
    import numpy as np
    from core.registry import scheme_classes
    lo, hi = Plant.Y_RANGE
    ref = np.concatenate([np.full(int(n), lo + f * (hi - lo)) for f in steps])
    rows = []
    for cls in scheme_classes():
        if cls.id not in headless:
            continue
        sc = run_scheme(Plant(), cls, ref, float(dt))
        m = sc.metrics()
        rows.append({'scheme': cls.name, 'plant': Plant.name, **{k: round(float(v), 5) for k, v in m.items() if isinstance(v, (int, float))}})
    if app is not None and rows:
        app.show(rows, title='Workbench με το κύκλωμα ως σύστημα υπό έλεγχο')
    return rows
