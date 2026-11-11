"""Reference ("batch") simulation of a studio circuit with SciPy's solve_ivp.

The browser sends the netlist it built for its own fixed-step solver (same
elements, node numbering and controllers), so both runs describe exactly the
same circuit. Here the circuit is a switched linear system:

* in every topology (switch and diode states) the resistive network is solved
  exactly for the node voltages and branch currents, given the inductor
  currents and capacitor voltages (the states), and the states are integrated
  with an adaptive ODE solver: RK45, RK23, DOP853 (explicit) or Radau, BDF,
  LSODA (implicit, for stiff circuits);
* topology changes are events. PWM edges (with dead time), controller sampling
  instants, schedules and thyristor pulses are known in advance and end a
  segment; diode turn-off (current through zero) and turn-on (voltage above
  V_f) are located as roots inside the segment. Spark gaps (3.10) close at
  |v| = U_b or at a trigger time and open at a current zero (or I_ext);
* a lossless line (3.8, Bergeron) is a conductance 1/Z at each end with a
  history current from the other end at t − τ. Segments are at most τ long,
  so that history is always known (method of steps), and it is recorded
  after each segment from the solver's own points;
* surge arresters (3.9) are nonlinear injections, solved with Newton on their
  voltages inside every evaluation of the network (with the voltage limited
  on the steep part, as in the browser).

The result is a reference waveform with controlled local error (rtol/atol) to
compare against the browser solver.
"""
import bisect
import json
import math
import time

import numpy as np
from scipy.integrate import solve_ivp

GMIN = 1e-9
METHODS = ('Radau', 'BDF', 'LSODA', 'RK45', 'RK23', 'DOP853')
IMPLICIT = {'Radau', 'BDF', 'LSODA'}
LIMITS = {'els': 800, 'nodes': 600, 't_end': 10.0, 'wall': 45.0, 'points': 600000, 'periods': 20000}


class BatchError(ValueError):
    """Input or solver failure, reported to the user."""


def sched_at(s, t, dflt):
    if not s:
        return dflt
    v = s[0][1]
    if t < s[0][0]:
        return dflt
    for ts, val in s:
        if ts <= t + 1e-15:
            v = val
        else:
            break
    return v


def wave_at(w, t):
    """Lightning current (3.5): Heidler (I₀/η)·(t/τ₁)ⁿ/(1 + (t/τ₁)ⁿ)·e^(−t/τ₂), or double exponential (I₀/η)·(e^(−t/τ₂) − e^(−t/τ₁))."""
    t = t - _f(w.get('t0'))
    if t <= 0:
        return 0.0
    k = _f(w.get('I0')) / _f(w.get('eta'), 1)
    if w.get('kind') == 'ramp':           # a ramp up to the peak (3.9)
        return k * min(1.0, t / w['tr'])
    if w.get('kind') == 'dexp':
        return k * (math.exp(-t / w['tau2']) - math.exp(-t / w['tau1']))
    x = (t / w['tau1']) ** _f(w.get('n'), 10)
    return k * x / (1 + x) * math.exp(-t / w['tau2'])


def mov_seg(pts):
    """Segments of a surge-arrester characteristic through the points (current, voltage): i = I_k·(v/V_k)^a_k in log-log."""
    return [(pts[k][0], pts[k][1], math.log(pts[k + 1][0] / pts[k][0]) / math.log(pts[k + 1][1] / pts[k][1])) for k in range(len(pts) - 1)]


def _powr(x, a):
    return math.exp(min(a * math.log(x), 700.0))


def mov_cur(e, v):
    """Arrester current and di/dv at voltage v (symmetric)."""
    x = abs(v)
    if not x > 0:
        return 0.0, 0.0
    pts, seg = e['pts'], e['seg']
    k = 0
    while k < len(seg) - 1 and x >= pts[k + 1][1]:
        k += 1
    I, V, a = seg[k]
    i = I * _powr(x / V, a)
    return math.copysign(i, v), a * i / x


def mov_inv(e, i):
    y = abs(i)
    if not y > 0:
        return 0.0
    pts, seg = e['pts'], e['seg']
    k = 0
    while k < len(seg) - 1 and y >= pts[k + 1][0]:
        k += 1
    I, V, a = seg[k]
    return math.copysign(V * _powr(y / I, 1 / a), i)


def sat_d(q, i):
    """Saturated d axis (3.6): f(i) = L_dsat·i + ψ_k·(1 − e^(−(L_d − L_dsat)·|i|/ψ_k))·sign(i) and the incremental inductance."""
    a, dL = abs(i), q['Ld'] - q['Ldsat']
    e = math.exp(-dL * a / q['psik'])
    return math.copysign(q['Ldsat'] * a + q['psik'] * (1 - e), i), q['Ldsat'] + dL * e


def sat_d_inv(q, psi):
    a = abs(psi)
    i = a / q['Ld']
    for _ in range(50):
        f, L = sat_d(q, i)
        di = (f - a) / L
        i -= di
        if abs(di) < 1e-13 * (1 + i):
            break
    return math.copysign(i, psi)


def f2_phi(w0, z, dt):
    """Φ = e^{A·dt} of the second-order filter (3.19), A = ω₀·[[0, 1], [−1, −2ζ]]; the same lines as mna.js f2Phi."""
    s, D = -z * w0, w0 * w0 * (z * z - 1)
    x = D * dt * dt
    if abs(x) < 1e-4:
        e = math.exp(s * dt)
        eC, eS = e * (1 + x / 2 + x * x / 24 + x * x * x / 720), e * dt * (1 + x / 6 + x * x / 120 + x * x * x / 5040)
    elif D > 0:
        r = math.sqrt(D)
        ep, em = math.exp((s + r) * dt), math.exp((s - r) * dt)
        eC, eS = (ep + em) / 2, (ep - em) / (2 * r)
    else:
        r = math.sqrt(-D)
        e = math.exp(s * dt)
        eC, eS = e * math.cos(r * dt), e * math.sin(r * dt) / r
    a, c = z * w0 * eS, w0 * eS
    return eC + a, c, -c, eC - a


def _f(v, d=0.0):
    try:
        v = float(v)
    except (TypeError, ValueError):
        return d
    return v if math.isfinite(v) else d


class Ctrl:
    """PWM / PI / PID block, same rules as the browser (web/studio/mna.js)."""
    FIELDS = ('id', 'mode', 'carrier', 'qty', 'ff', 'upd', 'dIn')

    def __init__(self, k):
        for f in self.FIELDS:
            setattr(self, f, k.get(f))
        self.T = _f(k.get('T'), 1e-4)
        for f in ('D', 'phase', 'dt', 'Kp', 'Ki', 'Kd', 'Tf', 'D0', 'dmin', 'dmax', 'm', 'fref', 'refphase'):
            setattr(self, f, _f(k.get(f)))
        self.dsched = k.get('dsched')
        self.ref = k.get('ref') or [[0, 0]]
        self.sensor = k.get('sensorRec')
        self.ffA = k.get('ffARec')
        self.ffB = k.get('ffBRec')
        self.d = self.D
        self.dOn = self.dOff = self.D      # duty of the turn-on / turn-off edge of the period
        self.dPrevOff = None
        self.h = None
        self.xi = 0.0
        self.k = None
        self.tk = 0.0
        self.tkPrev = None
        self.dPrev = None
        self.meas = 0.0
        self.refNow = 0.0
        self.ePrev = None
        self.dF = 0.0

    def dbl(self):
        return self.upd == 'double' and self.mode not in ('spwm', 'pp') and self.carrier != 'saw'

    def raw(self, out, t, tk, dd, dd2=None):
        T = self.T
        if self.mode == 'spwm':
            ph = ((t / T - self.phase) % 1 + 1) % 1
            car = 1 - 4 * ph if ph < .5 else -3 + 4 * ph
            ref = self.m * math.sin(2 * math.pi * self.fref * t + self.refphase)
            a, b = ref > car, -ref > car
        else:
            tau, d = t - tk, min(1.0, max(0.0, dd))
            d2 = d if dd2 is None else min(1.0, max(0.0, dd2))
            if self.mode == 'pp':
                h = T / 2
                a = -1e-15 <= tau < d * h * (1 - 1e-12)
                b = h * (1 - 1e-12) <= tau < h + d * h * (1 - 1e-12)
            else:
                e0, e1 = (0, d * T) if self.carrier == 'saw' else ((1 - d) * T / 2, (1 + d2) * T / 2)
                a = e0 * (1 - 1e-12) - 1e-18 <= tau < e1 * (1 - 1e-12)
                b = a
        return a if out == 'a' else (not a) if out == 'na' else b if out == 'b' else (not b)

    def gate(self, out, t):
        if not self.dt > 0:
            return self.raw(out, t, self.tk, self.dOn, self.dOff)
        if not self.raw(out, t, self.tk, self.dOn, self.dOff):
            return False
        td = t - self.dt
        if self.mode == 'spwm' or td >= self.tk - 1e-15 * self.T:
            return self.raw(out, td, self.tk, self.dOn, self.dOff)
        dp = self.dPrev if self.dPrev is not None else self.dOn
        return self.raw(out, td, self.tkPrev if self.tkPrev is not None else self.tk - self.T,
                        dp, self.dPrevOff if self.dPrevOff is not None else dp)

    def carrier_at(self, t):
        """Carrier value as in the browser: sawtooth τ/T, symmetric triangle |1 − 2τ/T|."""
        T = self.T
        if self.mode == 'spwm':
            ph = ((t / T - self.phase) % 1 + 1) % 1
            return 1 - 4 * ph if ph < .5 else -3 + 4 * ph
        u = min(1.0, max(0.0, (t - self.tk) / T))
        if self.mode == 'pp':
            return (2 * u) % 1
        return u if self.carrier == 'saw' else abs(1 - 2 * u)

    def edges(self):
        T, d, d2 = self.T, min(1.0, max(0.0, self.dOn)), min(1.0, max(0.0, self.dOff))
        if self.mode == 'pp':
            h = T / 2
            E = [self.tk + d * h, self.tk + h, self.tk + h + d * h, self.tk + T]
        else:
            e0, e1 = (0, d * T) if self.carrier == 'saw' else ((1 - d) * T / 2, (1 + d2) * T / 2)
            E = [self.tk + e0, self.tk + e1, self.tk + T]
        if self.dt > 0:
            E = E + [self.tk + self.dt] + [e + self.dt for e in E]
        return E


_FUN = {'sin': math.sin, 'cos': math.cos, 'tan': math.tan, 'asin': math.asin, 'acos': math.acos, 'atan': math.atan, 'atan2': math.atan2,
        'sinh': math.sinh, 'cosh': math.cosh, 'tanh': math.tanh, 'exp': math.exp, 'log': math.log, 'log10': math.log10, 'sqrt': math.sqrt,
        'abs': abs, 'min': min, 'max': max, 'pow': math.pow, 'floor': math.floor, 'ceil': math.ceil, 'round': lambda x: math.floor(x + .5),
        'sign': lambda x: (x > 0) - (x < 0), 'hypot': math.hypot, 'clamp': lambda x, a, b: min(max(x, a), b), 'mod': lambda a, b: a - b * math.floor(a / b),
        'lut': lambda x, *p: _lut(x, p)}


def _lut(x, p):
    n = len(p) // 2
    if x <= p[0]:
        return p[1]
    for k in range(1, n):
        if x <= p[2 * k]:
            x0, y0, x1, y1 = p[2 * k - 2], p[2 * k - 1], p[2 * k], p[2 * k + 1]
            return y0 + (y1 - y0) * (x - x0) / (x1 - x0) if x1 > x0 else y1
    return p[2 * n - 1]


def eval_ast(n, v, t):
    """Evaluate the tree of an expression block (built by web/studio/expr.js), with the browser's semantics."""
    k = n[0]
    if k == 'num':
        return n[1]
    if k == 'var':
        return v[n[1]]
    if k == 't':
        return t
    if k == 'un':
        a = eval_ast(n[2], v, t)
        return -a if n[1] == '-' else (0.0 if a else 1.0)
    if k == 'if':
        return eval_ast(n[2], v, t) if eval_ast(n[1], v, t) else eval_ast(n[3], v, t)
    if k == 'call':
        return float(_FUN[n[1]](*[eval_ast(a, v, t) for a in n[2]]))
    op, a, b = n[1], eval_ast(n[2], v, t), eval_ast(n[3], v, t)
    if op == '+': return a + b
    if op == '-': return a - b
    if op == '*': return a * b
    if op == '/': return a / b if b else (math.copysign(math.inf, a) if a else math.nan)
    if op == '%': return a - b * math.floor(a / b)
    if op == '^': return math.pow(a, b)
    return float({'<': a < b, '>': a > b, '<=': a <= b, '>=': a >= b, '==': a == b, '!=': a != b, '&&': bool(a and b), '||': bool(a or b)}[op])


def make_python_block(code, ins, outs, pars, Ts, label):
    """Same contract as web/studio/pyrt.js: step(t, u, s, p) with init(p); returns the list of outputs."""
    g = {'math': math, '__name__': 'pcl_block'}
    try:
        exec(compile(code, '<μπλοκ>', 'exec'), g)
    except SyntaxError as e:
        raise BatchError(f'{label}: γραμμή {e.lineno}: SyntaxError: {e.msg}')
    step = g.get('step')
    if not callable(step):
        raise BatchError(f'{label}: ο κώδικας πρέπει να ορίζει συνάρτηση step(t, u, s, p)')
    p = {**pars, 'Ts': Ts}
    init = g.get('init')
    box = [(init(p) if callable(init) else {}) or {}]

    def call(t, uvals):
        try:
            r = step(t, dict(zip(ins, uvals)), box[0], p)
        except Exception as e:
            import traceback
            ln = [f.lineno for f in traceback.extract_tb(e.__traceback__) if f.filename == '<μπλοκ>']
            raise BatchError(f'{label} (t = {t:.6g} s): ' + (f'γραμμή {ln[-1]}: ' if ln else '') + f'{type(e).__name__}: {e}')
        if isinstance(r, tuple) and len(r) == 2 and isinstance(r[1], dict):
            r, box[0] = r
        if isinstance(r, dict):
            return [float(r.get(k, 0.0)) for k in outs]
        if isinstance(r, (list, tuple)):
            return [float(x) for x in r][:len(outs)] + [0.0] * max(0, len(outs) - len(r))
        return [float(r)] + [0.0] * (len(outs) - 1)
    return call


class Circuit:
    def __init__(self, net):
        self.els = net['els']
        self.nN = int(net['nNodes'])
        size = int(net['size'])
        if len(self.els) > LIMITS['els'] or self.nN > LIMITS['nodes']:
            raise BatchError('Πολύ μεγάλο κύκλωμα για τον batch λύτη.')
        self.ctrls = [Ctrl(k) for k in net.get('ctrls', [])]
        self.cmap = {k.id: k for k in self.ctrls}
        # Sample & Hold blocks: triggers on the carrier of their clock PWM
        self.shs = []
        for q in net.get('shs', []) or []:
            ci = q.get('clock')
            h0 = q.get('h0')
            self.shs.append({'id': q.get('id'), 'rec': q.get('rec'), 'sig': bool(q.get('sig')), 'clk': q.get('clk'), 'clock': ci if isinstance(ci, int) and 0 <= ci < len(self.ctrls) else None,
                             'trig': q.get('trig') if q.get('trig') in ('start', 'mid', 'both') else 'start',
                             'h': float(h0) if h0 is not None else math.nan, 'last': None, 't': [], 'v': []})
        # signal blocks (3.0), already in evaluation order
        sig = net.get('sig') or {}
        self.nsig = int(sig.get('n') or 0)
        self.blocks = []
        for b in sig.get('blocks') or []:
            b = dict(b)
            b['st'] = dict(b.get('st') or {})
            ci = b.get('clock')
            b['clock'] = ci if isinstance(ci, int) and 0 <= ci < len(self.ctrls) else None
            self.blocks.append(b)
        self.zc = [b for b in self.blocks if b['type'] == 'CMP']
        # continuous in time: integrators, filters, the PLL, and expressions of t (e.g. I_dc + I_ac·sin(2πft))
        self.has_cont = any(b['type'] in ('INT', 'LPF', 'PLL', 'FEST', 'F2', 'RLIM') or (b['type'] == 'EXPR' and '["t"]' in json.dumps(b.get('ast'))) for b in self.blocks)
        # 3.19 (question 5 of 3.18): with sources driven by signals (a controlled source, a PWM with its duty from a signal, a
        # gate from a signal) the continuous blocks are integrated over T/1000 instead of T/200, close to the browser's step,
        # so a control loop through them has the same transients; data['cont_div'] sets it
        isint = lambda n: isinstance(n, int) and n >= 0
        self.sig_src = any(isint(e.get('sigIn')) or (e.get('gate') == 'sig' and isint(e.get('gIn'))) for e in net['els']) or \
            any(isint(k.get('dIn')) for k in net.get('ctrls', []))
        self.cont_div = 1000 if self.sig_src else 200
        self.sv = [0.0] * self.nsig
        self.yb = [0.0] * len(self.blocks)
        self.yo = [[0.0] * len(b.get('outList') or []) for b in self.blocks]
        E = self.els
        self.iL = [i for i, e in enumerate(E) if e['k'] == 'L']
        self.iC = [i for i, e in enumerate(E) if e['k'] == 'C']
        self.iD = [i for i, e in enumerate(E) if e['k'] == 'D' and not e.get('gap')]
        self.iSG = [i for i, e in enumerate(E) if e['k'] == 'D' and e.get('gap')]     # spark gaps (3.10)
        for i in self.iSG:
            gp = E[i]['gap']
            gp['trig'] = _f(gp.get('trig'), math.inf) if gp.get('trig') is not None else math.inf
            gp['Ub'] = _f(gp.get('Ub'), math.inf)
            gp['Iext'] = _f(gp.get('Iext'), 0)
            if gp.get('de'):            # volt–time curve (3.11): D = ∫ (|v| − U₀)^k dt over |v| > U₀, closes at D
                gp['de'] = {q: _f(gp['de'].get(q)) for q in ('U0', 'k', 'D')}
            E[i]['trig_done'] = False
        self.just_off = {}
        self.iT = [i for i, e in enumerate(E) if e['k'] == 'TL']       # lines (3.8), with lumped losses in N sections (3.11)
        for i in self.iT:
            e = E[i]
            N = int(e.get('N') or 1)
            r = _f(e.get('Rl'), 0) / (4 * N)
            e['N'], e['ts'], e['Ze'] = N, e['tau'] / N, e['Z'] + r
            e['hh'] = (e['Z'] - r) / e['Ze']
            e['H'] = {'t': [], 'c': [[] for _ in range(3 * N + 1)]}
        self.tau_min = min((E[i]['ts'] for i in self.iT), default=math.inf)
        self.iN = [i for i, e in enumerate(E) if e['k'] == 'NL']       # surge arresters (3.9)
        for i in self.iN:
            E[i]['pts'] = [(float(a), float(b)) for a, b in E[i]['pts']]
            E[i]['seg'] = mov_seg(E[i]['pts'])
        self.vnl = np.zeros(len(self.iN))
        self.inl = np.zeros(len(self.iN))
        self.iS = [i for i, e in enumerate(E) if e['k'] == 'S']
        self.iP = [i for i, e in enumerate(E) if e['k'] == 'CPL']
        self.iG = [i for i, e in enumerate(E) if e['k'] == 'G']
        self.iGs = [i for i in self.iG if E[i].get('sched')]
        self.iV = [i for i, e in enumerate(E) if e['k'] == 'V']
        self.iI = [i for i, e in enumerate(E) if e['k'] == 'I']
        self.iX = [i for i, e in enumerate(E) if e['k'] == 'X']
        self.iGY = [i for i, e in enumerate(E) if e['k'] == 'GY']      # machine gyrators (3.1)
        # multiports (3.5): coupled inductors (flux element 'F', one current state per port) and conductance matrices ('MG');
        # the flux element of a synchronous machine has machine states instead (below)
        self.iF = [i for i, e in enumerate(E) if e['k'] == 'F' and e.get('sm') is None and e.get('srm') is None and e.get('gen') is None]
        self.iMG = [i for i, e in enumerate(E) if e['k'] == 'MG']
        self.cur = [(i, None) for i in self.iL] + [(i, q) for i in self.iF for q in range(int(E[i]['N']))]
        self.nI = len(self.cur)
        self.n = size + len(self.iC)
        self.crow = {ci: size + j for j, ci in enumerate(self.iC)}
        self.ns = self.nI + len(self.iC)
        self.on = {i: False for i in self.iD + self.iS + self.iSG}
        self.ev, self.ev_n, self._evon, self.ev_max = [], 0, {}, 20000      # 3.19: the event log, as Sim.logEv in the browser
        self.gon = {i: False for i in self.iD if E[i].get('gk')}
        self.cap_rs = 0.0
        self.cache = {}
        self.icpl = np.zeros(len(self.iP))
        for i in self.iP:
            E[i]['Vmin'] = max(_f(E[i].get('Vmin'), 5), 1e-3)
        # states -> right-hand side, and node solution -> state derivatives
        n, ns = self.n, self.ns
        self.Bx = np.zeros((n, ns))
        self.Dm = np.zeros((ns, n))
        for k, (i, q) in enumerate(self.cur):
            e = E[i]
            a, b = (e['a'], e['b']) if q is None else e['ports'][q]
            if a >= 0:
                self.Bx[a, k] -= 1
            if b >= 0:
                self.Bx[b, k] += 1
            if q is None:
                row = [(a, b, 1 / e['L'])]
            else:               # di_q/dt = Σ_j Γ_qj·v_j
                N = int(e['N'])
                row = [(e['ports'][j][0], e['ports'][j][1], e['Gam'][q * N + j]) for j in range(N)]
            for aj, bj, g in row:
                if aj >= 0:
                    self.Dm[k, aj] += g
                if bj >= 0:
                    self.Dm[k, bj] -= g
        for j, i in enumerate(self.iC):
            r = self.crow[i]
            self.Bx[r, self.nI + j] = 1
            self.Dm[self.nI + j, r] = 1 / E[i]['C']
        self.inj = self.iP + self.iN          # nonlinear current injections a → b: constant-power loads, then arresters
        self.Bc = np.zeros((n, len(self.inj)))
        self.Cv = np.zeros((len(self.inj), n))
        for q, i in enumerate(self.inj):
            e = E[i]
            if e['a'] >= 0:
                self.Bc[e['a'], q] -= 1
                self.Cv[q, e['a']] += 1
            if e['b'] >= 0:
                self.Bc[e['b'], q] += 1
                self.Cv[q, e['b']] -= 1
        self.x0 = np.array([_f(E[i].get('i')) if q is None else _f(E[i]['i'][q]) for i, q in self.cur] + [_f(E[i].get('v')) for i in self.iC])
        if ns == 0:     # purely resistive circuit (e.g. diode rectifier into R, E): a dummy
            self.ns = 1  # constant state lets the ODE solver march in time and find events
            self.Bx, self.Dm, self.x0 = np.zeros((n, 1)), np.zeros((1, n)), np.zeros(1)
        # induction machines (3.4): ψ_Rα, ψ_Rβ, ω, θ appended to the states; their stator sources e = −(R_R/L_M − jω_r)ψ_R
        self.ims = net.get('ims') or []
        self.nsn = self.ns
        for q, m in enumerate(self.ims):
            m['kL'] = [self.iL.index(ph['L']) for ph in m['ph']]
            m['k0'] = self.nsn + 4 * q
            for k, ph in enumerate(m['ph']):
                E[ph['V']]['im'] = (q, k)
            st = m.get('st') or {}
            self.x0 = np.concatenate([self.x0, [_f(st.get('pa')), _f(st.get('pb')), _f(st.get('w')), _f(st.get('th'))]])
        # synchronous machines (3.5): ψ_α, ψ_β, ω, θ (electrical) appended; their port currents are sources computed from the states
        self.sms = net.get('sms') or []
        for q, m in enumerate(self.sms):
            m['k0'] = self.nsn + 4 * len(self.ims) + 4 * q
            F = E[m['F']]
            m['ports'] = F['ports']
            psi = F.get('psi') or [0.0, 0.0]
            st = m.get('st') or {}
            self.x0 = np.concatenate([self.x0, [(2 * _f(psi[0]) - _f(psi[1])) / 3, _f(psi[1]) / math.sqrt(3), _f(st.get('w')), _f(st.get('the'))]])
        # switched reluctance machines (3.6): ψ of each phase, ω, θ (electrical, phase 1); phase currents i(θ, ψ) as current sources
        self.srms = net.get('srms') or []
        k0 = self.nsn + 4 * (len(self.ims) + len(self.sms))
        for m in self.srms:
            m['k0'] = k0
            F = E[m['F']]
            m['ports'] = F['ports']
            m['I'] = np.array(m['I'], dtype=float)
            m['C'] = np.array(m['C'], dtype=float)
            st = m.get('st') or {}
            self.x0 = np.concatenate([self.x0, [_f(v) for v in (F.get('psi') or [0.0] * m['N'])], [_f(st.get('w')), _f(st.get('the'))]])
            k0 += m['N'] + 2
        # generators (4.3): the fluxes of the ports (stator a, b, c and rotor windings), then the angles and the speeds of the
        # masses of the shaft; the port currents i = Γ(θ)·ψ are sources, dψ/dt is the port voltage (as the machines above)
        self.gens = net.get('gens') or []
        for m in self.gens:
            m['k0'] = k0
            F = E[m['F']]
            m['ports'] = F['ports']
            for key in ('Gd', 'Gq'):
                m[key] = np.array(m[key], dtype=float)
            st = m.get('st') or {}
            M = m['sh']['N']
            self.x0 = np.concatenate([self.x0, [_f(v) for v in (F.get('psi') or [0.0] * m['N'])], [_f(v) for v in st.get('ph', [0.0] * M)],
                                      [_f(v, 1.0) for v in st.get('w', [1.0] * M)]])
            k0 += m['N'] + 2 * M
        for q, m in enumerate(self.gens):
            E[m['fV']]['gen'] = q
        if self.ims or self.sms or self.srms or self.gens:
            extra = 4 * (len(self.ims) + len(self.sms)) + sum(m['N'] + 2 for m in self.srms) + sum(m['N'] + 2 * m['sh']['N'] for m in self.gens)
            self.Bx = np.hstack([self.Bx, np.zeros((n, extra))])
            self.Dm = np.vstack([self.Dm, np.zeros((extra, n))])
            self.ns = self.nsn + extra
        # spark gaps on a volt–time curve (3.11): their disruptive effect is one more state, integrated with the circuit
        self.iDE = [i for i in self.iSG if E[i]['gap'].get('de')]
        if self.iDE:
            for q, i in enumerate(self.iDE):
                E[i]['kD'] = self.ns + q
            m = len(self.iDE)
            self.Bx = np.hstack([self.Bx, np.zeros((n, m))])
            self.Dm = np.vstack([self.Dm, np.zeros((m, n))])
            self.x0 = np.concatenate([self.x0, np.zeros(m)])
            self.ns += m
        clk = next((b for b in self.blocks if b['type'] in ('CLK', 'RAMP')), None)
        lg = [_f(E[i]['wave'].get('T1'), 1e-6) for i in self.iI if E[i].get('wave')]     # a lightning current: its front time (3.5)
        lg += [_f(E[i]['src']['w'].get('T1'), 1e-6) for i in self.iV if E[i]['src'].get('kind') == 'wave']   # an impulse voltage (3.8)
        lg += [E[i]['tau'] for i in self.iT]
        tb = _f(net.get('tbase'), 0)          # time base of the circuit settings (3.10), when no source sets one
        self.base_T = min([k.T for k in self.ctrls], default=None) or (1 / max(_f(clk.get('f'), 1e5), 1e-6) if clk else None) or next(
            (1 / max(1e-6, _f(E[i]['src'].get('f'), 50)) for i in self.iV if E[i]['src'].get('kind') == 'ac'), None) or (
            1 / self.gens[0]['f'] if self.gens else None) or (min(lg) if lg else (tb if tb > 0 else 1e-3))
        self._z = None
        self._yb = []
        self._yo = []
        self.started = False

    # ------------------------------------------------------------ sources
    def R(self, e, t):
        return max(sched_at(e.get('sched'), t, e['R']), 1e-9)

    def im_e(self, m, x):
        """Stator sources of a machine (a, b, c) from its states."""
        k0 = m['k0']
        pa, pb, w = x[k0], x[k0 + 1], x[k0 + 2]
        g, wr = m['RR'] / m['LM'], m['p'] * w
        ea, eb = -g * pa - wr * pb, -g * pb + wr * pa
        q = math.sqrt(3) / 2
        return ea, -ea / 2 + q * eb, -ea / 2 - q * eb

    def im_deriv(self, m, t, x):
        k0, kL = m['k0'], m['kL']
        ia, ib, ic = x[kL[0]], x[kL[1]], x[kL[2]]
        al, be = (2 * ia - ib - ic) / 3, (ib - ic) / math.sqrt(3)
        pa, pb, w = x[k0], x[k0 + 1], x[k0 + 2]
        g, wr = m['RR'] / m['LM'], m['p'] * w
        te = 1.5 * m['p'] * (pa * be - pb * al)
        n = m.get('tl')
        tl = self.sig_in(n) if isinstance(n, int) and n >= 0 else sched_at(m.get('sched'), t, (m.get('sched') or [[0, 0]])[0][1])
        return [m['RR'] * al - g * pa - wr * pb, m['RR'] * be - g * pb + wr * pa, (te - tl - m['b'] * w) / m['J'], w], te

    # ------------------------------------------------------------ synchronous machine (3.5)
    @staticmethod
    def sm_cur(m, x):
        """α, β currents and d, q currents from ψ_αβ and θ: i_αβ = R(θ)·diag(1/L_d, 1/L_q)·R(θ)ᵀ·(ψ − ψ_m·(cos θ, sin θ))."""
        k0 = m['k0']
        pa, pb, th = x[k0], x[k0 + 1], x[k0 + 3]
        c, s = math.cos(th), math.sin(th)
        q = m.get('sat')
        if q:                           # saturated d axis (3.6): i_d from ψ_d − ψ_m = f(i_d) by Newton
            idq = (sat_d_inv(q, c * pa + s * pb - m['psim']), (-s * pa + c * pb) / m['Lq'])
        else:
            idq = ((c * pa + s * pb - m['psim']) / m['Ld'], (-s * pa + c * pb) / m['Lq'])
        return c * idq[0] - s * idq[1], s * idq[0] + c * idq[1], idq[0], idq[1]

    def sm_ports(self, m, x):
        """Port currents (a → c, b → c): i_a = i_α, i_b = −i_α/2 + (√3/2)·i_β."""
        ia, ib = self.sm_cur(m, x)[:2]
        return ia, -ia / 2 + math.sqrt(3) / 2 * ib

    def sm_deriv(self, m, t, x, z):
        k0 = m['k0']
        V = lambda nd: z[nd] if nd >= 0 else 0.0
        (a1, b1), (a2, b2) = m['ports']
        v1, v2 = V(a1) - V(b1), V(a2) - V(b2)
        ia, ib, _, _ = self.sm_cur(m, x)
        te = 1.5 * m['p'] * (x[k0] * ib - x[k0 + 1] * ia)
        n = m.get('tl')
        tl = self.sig_in(n) if isinstance(n, int) and n >= 0 else sched_at(m.get('sched'), t, (m.get('sched') or [[0, 0]])[0][1])
        w = x[k0 + 2]
        return [(2 * v1 - v2) / 3, v2 / math.sqrt(3), (te - tl - m['b'] * w) / m['J'], m['p'] * w], te

    # ------------------------------------------------------------ switched reluctance machine (3.6)
    # ψ(θ, i) = Σ_m c_m(i)·cos(m·θ), c_m linear in i between the grid currents (same representation as Parts.srmMag in the browser)
    @staticmethod
    def srm_A(m, th):
        mm = np.arange(m['M'] + 1)
        return m['C'] @ np.cos(mm * th), -(m['C'] @ (mm * np.sin(mm * th)))

    @staticmethod
    def _seg(L, a):
        k = int(np.searchsorted(L, a, side='right')) - 1
        return min(max(k, 0), len(L) - 2)

    def srm_cur(self, m, th, psi):
        A = self.srm_A(m, th)[0]
        a = abs(psi)
        k = self._seg(A, a)
        I = m['I']
        return math.copysign(I[k] + (a - A[k]) * (I[k + 1] - I[k]) / (A[k + 1] - A[k]), psi) if psi else 0.0

    def srm_torque(self, m, th, i):
        D = self.srm_A(m, th)[1]
        I = m['I']
        a = abs(i)
        k = self._seg(I, a)
        w = float(np.sum((D[:k] + D[1:k + 1]) / 2 * np.diff(I[:k + 1])))
        x, h = a - I[k], I[k + 1] - I[k]
        return m['Nr'] * (w + D[k] * x + (D[k + 1] - D[k]) / h * x * x / 2)

    def srm_currents(self, m, x):
        k0, N = m['k0'], m['N']
        th = x[k0 + N + 1]
        return [self.srm_cur(m, th - 2 * math.pi * k / N, x[k0 + k]) for k in range(N)]

    def srm_deriv(self, m, t, x, z):
        k0, N = m['k0'], m['N']
        V = lambda nd: z[nd] if nd >= 0 else 0.0
        th, w = x[k0 + N + 1], x[k0 + N]
        cur = self.srm_currents(m, x)
        te = sum(self.srm_torque(m, th - 2 * math.pi * k / N, cur[k]) for k in range(N))
        n = m.get('tl')
        tl = self.sig_in(n) if isinstance(n, int) and n >= 0 else sched_at(m.get('sched'), t, (m.get('sched') or [[0, 0]])[0][1])
        return [V(a) - V(b) for a, b in m['ports']] + [(te - tl - m['b'] * w) / m['J'], m['Nr'] * w], te

    # ------------------------------------------------------------ synchronous generator (4.3)
    # the same model as Sim.genStep / Parts.genGamma in the browser: power-invariant Park, d axis at the angle of the
    # generator mass, Γ = Pᵀ·blockdiag(Γ_d, Γ_q, 1/L₀)·P on the ports (a, b, c, d rotor windings, q rotor windings)
    def gen_cur(self, m, x):
        """Port currents, the stator d, q currents and fluxes at the present angle."""
        k0, N, nd, nq = m['k0'], m['N'], m['nd'], m['nq']
        psi = x[k0:k0 + N]
        th = x[k0 + N + m['sh']['gm']]
        a = th - np.arange(3) * 2 * math.pi / 3
        dr, qr = math.sqrt(2 / 3) * np.cos(a), -math.sqrt(2 / 3) * np.sin(a)
        pd, pq, p0 = float(dr @ psi[:3]), float(qr @ psi[:3]), float(np.sum(psi[:3])) / math.sqrt(3)
        idv = m['Gd'] @ np.concatenate([[pd], psi[3:3 + nd]])
        iqv = m['Gq'] @ np.concatenate([[pq], psi[3 + nd:3 + nd + nq]])
        i0 = m['g0'] * p0
        i = np.empty(N)
        i[:3] = dr * idv[0] + qr * iqv[0] + i0 / math.sqrt(3)
        i[3:3 + nd] = idv[1:]
        i[3 + nd:] = iqv[1:]
        return i, idv[0], iqv[0], pd, pq

    def gen_efd(self, m, t):
        if m['exc'] == 'sig':
            return self.sig_in(m.get('efdIn'))
        if m['exc'] == 'sched':
            return sched_at(m['efdS'], t, m['efdS'][0][1])
        return m['Efd0']

    def gen_tm(self, m, t):
        if m['mech'] == 'sig':
            return self.sig_in(m.get('tmIn'))
        if m['mech'] == 'sched':
            return sched_at(m['tmS'], t, m['tmS'][0][1])
        return m['Tm0']

    def gen_deriv(self, m, t, x, z):
        k0, N, sh = m['k0'], m['N'], m['sh']
        M = sh['N']
        V = lambda nd: z[nd] if nd >= 0 else 0.0
        _, i_d, i_q, pd, pq = self.gen_cur(m, x)
        tem = (pd * i_q - pq * i_d) * m['wb'] / m['Sn']
        ph, w = x[k0 + N:k0 + N + M], x[k0 + N + M:k0 + N + 2 * M]
        Tm = self.gen_tm(m, t)
        dw = np.empty(M)
        for j in range(M):
            T = Tm * sh['fr'][j] - sh['D'][j] * (w[j] - 1) + (tem if j == sh['gm'] else 0.0)
            if j > 0:
                T += sh['K'][j - 1] * (ph[j - 1] - ph[j]) + sh['Dmu'][j - 1] * (w[j - 1] - w[j])
            if j < M - 1:
                T -= sh['K'][j] * (ph[j] - ph[j + 1]) + sh['Dmu'][j] * (w[j] - w[j + 1])
            dw[j] = T / (2 * sh['H'][j])
        return np.concatenate([[V(a) - V(b) for a, b in m['ports']], m['wb'] * w, dw])

    def gen_out(self, m, t, x, z):
        k0, N, sh = m['k0'], m['N'], m['sh']
        M, gm = sh['N'], sh['gm']
        i, i_d, i_q, pd, pq = self.gen_cur(m, x)
        V = lambda nd: z[nd] if nd >= 0 else 0.0
        vn = V(m['nN'])
        v = [V(n) - vn for n in m['term']]
        ph = x[k0 + N:k0 + N + M]
        d = ph[gm] + math.pi - m['wb'] * t
        d -= 2 * math.pi * math.floor((d + math.pi) / (2 * math.pi))
        out = {'w': float(x[k0 + N + M + gm]), 'te': -(pd * i_q - pq * i_d) * m['wb'] / m['Sn'],
               'pe': -(v[0] * i[0] + v[1] * i[1] + v[2] * i[2]) / m['Sn'],
               'qe': -((v[1] - v[2]) * i[0] + (v[2] - v[0]) * i[1] + (v[0] - v[1]) * i[2]) / (math.sqrt(3) * m['Sn']),
               'vt': math.hypot(math.sqrt(2 / 3) * (v[0] - (v[1] + v[2]) / 2), (v[1] - v[2]) / math.sqrt(2)) / m['Un'],
               'ifd': float(i[3]) * m['ifK'], 'd': math.degrees(d)}
        for j in range(M - 1):
            out[f'ts{j + 1}'] = sh['K'][j] * (ph[j] - ph[j + 1])
        return out

    def Vsrc(self, e, t, x=None):
        if 'gen' in e:                  # the field of a generator: E_fd·(R_fd/X_ad)·U_n
            m = self.gens[e['gen']]
            return self.gen_efd(m, t) * m['vfK']
        if 'im' in e:
            return self.im_e(self.ims[e['im'][0]], x if x is not None else self.x0)[e['im'][1]]
        n = e.get('sigIn')
        if isinstance(n, int) and n >= 0:     # a voltage source controlled by a signal (e.g. OCV(SOC))
            return self.sig_in(n)
        s = e['src']
        if s.get('kind') == 'dc':
            return sched_at(s.get('sched'), t, _f(s.get('V')))
        if s.get('kind') == 'wave':          # impulse voltage (3.8): the same double exponential as the lightning current
            return wave_at(s['w'], t)
        return _f(s.get('off')) + _f(s.get('Vpk')) * math.sin(2 * math.pi * _f(s.get('f')) * t + _f(s.get('ph')))

    def topo(self, t):
        key = (tuple(self.on[i] for i in self.iD + self.iS + self.iSG), tuple(self.R(self.els[i], t) for i in self.iGs), self.cap_rs)
        tp = self.cache.get(key)
        if tp is None:
            if len(self.cache) > 400:
                self.cache.clear()
            tp = self.build(t)
            self.cache[key] = tp
        return tp

    def build(self, t):
        n, E = self.n, self.els
        A = np.zeros((n, n))
        for i in range(self.nN):
            A[i, i] += GMIN

        def g(a, b, G):
            if a >= 0:
                A[a, a] += G
            if b >= 0:
                A[b, b] += G
            if a >= 0 and b >= 0:
                A[a, b] -= G
                A[b, a] -= G

        def vrow(a, b, r):
            if a >= 0:
                A[a, r] += 1
                A[r, a] += 1
            if b >= 0:
                A[b, r] -= 1
                A[r, b] -= 1
        bd = np.zeros(n)
        for i in self.iG:
            g(E[i]['a'], E[i]['b'], 1 / self.R(E[i], t))
        for i in self.iS:
            e = E[i]
            g(e['a'], e['b'], 1 / e['Ron'] if self.on[i] else 1 / e['Roff'])
        for i in self.iD:
            e = E[i]
            if self.on[i]:
                g(e['a'], e['b'], 1 / e['Ron'])
                j = e['Vf'] / e['Ron']
                if e['a'] >= 0:
                    bd[e['a']] += j
                if e['b'] >= 0:
                    bd[e['b']] -= j
            else:
                g(e['a'], e['b'], 1 / e['Roff'])
        for i in self.iSG:
            e = E[i]
            g(e['a'], e['b'], 1 / e['Ron'] if self.on[i] else 1 / e['Roff'])
        for i in self.iT:
            e = E[i]
            g(e['a1'], e['b1'], 1 / e['Ze'])
            g(e['a2'], e['b2'], 1 / e['Ze'])
        for i in self.iV:
            vrow(E[i]['a'], E[i]['b'], E[i]['row'])
        for i in self.iC:
            r = self.crow[i]
            vrow(E[i]['a'], E[i]['b'], r)
            A[r, r] -= self.cap_rs
        for i in self.iGY:              # gyrator: v_ab = ψ·ω (node m), torque ψ·i into node m
            e, r, Y = E[i], E[i]['row'], E[i]['psi']
            for node, s in ((e['a'], 1), (e['b'], -1)):
                if node >= 0:
                    A[node, r] += s
                    A[r, node] += s
            if e['m'] >= 0:
                A[r, e['m']] -= Y
                A[e['m'], r] -= Y
        for i in self.iMG:              # conductance matrix: i_k = Σ_j G_kj·v_j (3.5)
            e = E[i]
            N = int(e['N'])
            for k in range(N):
                for j in range(N):
                    G = e['Gm'][k * N + j]
                    for r, sr in ((e['ports'][k][0], 1), (e['ports'][k][1], -1)):
                        for q, sq in ((e['ports'][j][0], 1), (e['ports'][j][1], -1)):
                            if r >= 0 and q >= 0:
                                A[r, q] += sr * sq * G
        for i in self.iX:
            e, r = E[i], E[i]['row']
            N = e['n']
            for node, s in ((e['s1'], 1), (e['s2'], -1), (e['p1'], -N), (e['p2'], N)):
                if node >= 0:
                    A[node, r] += s
                    A[r, node] += s
        try:
            if A.shape[0] == 0:         # only signal blocks, no electrical circuit
                Ainv = np.zeros((0, 0))
            else:
                cond = np.linalg.cond(A)
                if not math.isfinite(cond) or cond > 1e17:
                    raise np.linalg.LinAlgError
                Ainv = np.linalg.inv(A)
        except np.linalg.LinAlgError:
            if self.cap_rs == 0 and self.iC:
                # a capacitor directly across an ideal voltage source: give the
                # capacitors a tiny series resistance and rebuild
                self.cap_rs = 1e-6
                self.cache.clear()
                return self.build(t)
            raise BatchError('Ιδιόμορφο σύστημα στον batch λύτη (βρόχος ιδανικών πηγών ή κόμβος χωρίς διαδρομή).')
        M = self.Dm @ Ainv
        return {'Ainv': Ainv, 'M': M, 'J': M @ self.Bx, 'bd': bd, 'Z1': Ainv @ self.Bc if self.inj else None}

    def bsrc(self, t, x=None):
        b = np.zeros(self.n)
        E = self.els
        for i in self.iV:
            b[E[i]['row']] = self.Vsrc(E[i], t, x)
        for m in self.srms:
            for (a, bb), i in zip(m['ports'], self.srm_currents(m, x if x is not None else self.x0)):
                if a >= 0:
                    b[a] -= i
                if bb >= 0:
                    b[bb] += i
        for m in self.gens:
            for (a, bb), i in zip(m['ports'], self.gen_cur(m, x if x is not None else self.x0)[0]):
                if a >= 0:
                    b[a] -= i
                if bb >= 0:
                    b[bb] += i
        for m in self.sms:
            for (a, bb), i in zip(m['ports'], self.sm_ports(m, x if x is not None else self.x0)):
                if a >= 0:
                    b[a] -= i
                if bb >= 0:
                    b[bb] += i
        for i in self.iT:
            e = E[i]
            for (a, bb), ih in zip(((e['a1'], e['b1']), (e['a2'], e['b2'])), self.tl_ih(e, t)):
                if a >= 0:
                    b[a] -= ih
                if bb >= 0:
                    b[bb] += ih
        for i in self.iI:
            e = E[i]
            n = e.get('sigIn')
            I = wave_at(e['wave'], t) if e.get('wave') else self.sig_in(n) if isinstance(n, int) and n >= 0 else sched_at(e.get('sched'), t, _f(e.get('I')))
            if e['a'] >= 0:
                b[e['a']] += I
            if e['b'] >= 0:
                b[e['b']] -= I
        return b

    def solve_z(self, t, x, tp):
        b = self.Bx @ x + self.bsrc(t, x) + tp['bd']
        z0 = tp['Ainv'] @ b
        if self.iN:
            return self.solve_nl(t, z0, tp)
        if not self.iP:
            return z0
        # constant-power loads: Newton on i = P/v (resistive below V_min)
        K = self.Cv @ tp['Z1']
        v0 = self.Cv @ z0
        P = np.array([sched_at(self.els[i].get('sched'), t, _f(self.els[i].get('P'))) for i in self.iP])
        Vm = np.array([self.els[i]['Vmin'] for i in self.iP])
        icp = self.icpl.copy()
        for _ in range(30):
            v = v0 + K @ icp
            big = np.abs(v) >= Vm
            g = np.where(big, P / np.where(big, v, 1), P * v / Vm ** 2)
            dg = np.where(big, -P / np.where(big, v, 1) ** 2, P / Vm ** 2)
            F = icp - g
            if np.max(np.abs(F)) <= 1e-10 * (1 + np.max(np.abs(icp))):
                break
            Jf = np.eye(len(icp)) - dg[:, None] * K
            icp = icp - np.linalg.solve(Jf, F)
        self.icpl = icp
        return z0 + tp['Z1'] @ icp

    def solve_nl(self, t, z0, tp):
        """Arresters (and constant-power loads with them): Newton on the injection voltages v = v₀ + K·g(v), with the voltage
        limited on the steep part of an arrester (the voltage that gives the linearized current on the true curve)."""
        E = self.els
        K = self.Cv @ tp['Z1']
        v0 = self.Cv @ z0
        nP = len(self.iP)
        P = [sched_at(E[i].get('sched'), t, _f(E[i].get('P'))) for i in self.iP]
        v = np.concatenate([np.where(np.abs(v0[:nP]) > 0, v0[:nP], 1.0), self.vnl]) if nP else self.vnl.copy()

        def gfun(q, vq):
            if q < nP:
                Vm = E[self.iP[q]]['Vmin']
                return (P[q] / vq, -P[q] / vq ** 2) if abs(vq) >= Vm else (P[q] * vq / Vm ** 2, P[q] / Vm ** 2)
            ii, gg = mov_cur(E[self.iN[q - nP]], vq)
            return ii, gg + 1e-12
        m = len(v)
        for _ in range(80):
            gi = np.empty(m)
            gd = np.empty(m)
            for q in range(m):
                gi[q], gd[q] = gfun(q, v[q])
            J = gi - gd * v
            vn = np.linalg.solve(np.eye(m) - K * gd[None, :], v0 + K @ J)
            for q in range(nP, m):
                if abs(vn[q]) > abs(v[q]):
                    it2 = gd[q] * vn[q] + J[q]
                    vi = mov_inv(E[self.iN[q - nP]], it2)
                    if math.copysign(1, it2) == math.copysign(1, vn[q]) and abs(vi) < abs(vn[q]):
                        vn[q] = vi
            done = np.all(np.abs(vn - v) <= 1e-9 * (1 + np.abs(vn)))
            v = vn
            if done:
                break
        inj = np.array([gfun(q, v[q])[0] for q in range(m)])
        self.vnl = v[nP:].copy()
        self.inl = inj[nP:].copy()
        if nP:
            self.icpl = inj[:nP].copy()
        return z0 + tp['Z1'] @ inj

    # ------------------------------------------------------------ lines (3.8)
    def tl_hist(self, e, tq):
        """All history columns at tq by linear interpolation; zero before t = 0 (de-energized line).
        Column j <= N: voltage of junction j (0 = start, N = end); N+1+j: current into section j at its start; 2N+1+j: at its end."""
        H = e['H']
        T, C = H['t'], H['c']
        if tq < 0 or not T:
            return [0.0] * len(C)
        j = bisect.bisect_right(T, tq)
        if j >= len(T):
            return [c[-1] for c in C]
        if j == 0:
            return [c[0] for c in C]
        t0, t1 = T[j - 1], T[j]
        f = (tq - t0) / (t1 - t0) if t1 > t0 else 1.0
        return [c[j - 1] + (c[j] - c[j - 1]) * f for c in C]

    @staticmethod
    def tl_sec(e, q, j):
        """History sources (start, end) of section j from the columns at t − τ/N (Dommel, lumped R/4, R/2, R/4)."""
        N, Ze, h = e['N'], e['Ze'], e['hh']
        AL = q[j] / Ze + h * q[N + 1 + j]
        AR = q[j + 1] / Ze + h * q[2 * N + 1 + j]
        return -(1 + h) / 2 * AR - (1 - h) / 2 * AL, -(1 + h) / 2 * AL - (1 - h) / 2 * AR

    def tl_ih(self, e, t):
        q = self.tl_hist(e, t - e['ts'])
        return self.tl_sec(e, q, 0)[0], self.tl_sec(e, q, e['N'] - 1)[1]

    def tl_record(self, t, z):
        for i in self.iT:
            e = self.els[i]
            H = e['H']
            if H['t'] and t < H['t'][-1]:
                continue
            V = lambda nd: z[nd] if nd >= 0 else 0.0
            N, Ze, C = e['N'], e['Ze'], H['c']
            q = self.tl_hist(e, t - e['ts'])
            S = [self.tl_sec(e, q, j) for j in range(N)]
            v = [V(e['a1']) - V(e['b1'])] + [-Ze * (S[k - 1][1] + S[k][0]) / 2 for k in range(1, N)] + [V(e['a2']) - V(e['b2'])]
            H['t'].append(t)
            for k in range(N + 1):
                C[k].append(v[k])
            for j in range(N):
                C[N + 1 + j].append(v[j] / Ze + S[j][0])
                C[2 * N + 1 + j].append(v[j + 1] / Ze + S[j][1])

    # ------------------------------------------------------------ gates and states
    def scr_u(self, e, t):
        F = e['fire']
        return F['f'] * t + F['ph0'] / (2 * math.pi) - (F['alpha'] + F['shift']) / 360

    def scr_gate(self, e, t):
        u = self.scr_u(e, t)
        return u - math.floor(u) < e['fire']['pw'] / 360

    def scr_edges(self, e, t):
        F = e['fire']
        u = self.scr_u(e, t)
        fl = math.floor(u + 1e-9)
        back = lambda uu: (uu - F['ph0'] / (2 * math.pi) + (F['alpha'] + F['shift']) / 360) / F['f']
        return [back(fl + F['pw'] / 360), back(fl + 1), back(fl + 1 + F['pw'] / 360)]

    def gate_state(self, e, t):
        if e.get('gate') == 'on':
            return True
        if e.get('gate') == 'pwm':
            k = self.cmap.get(e.get('pwm'))
            return bool(k and k.gate(e.get('out') or 'a', t))
        if e.get('gate') == 'alpha':
            return self.scr_gate(e, t)
        if e.get('gate') == 'sig':
            n = e.get('gIn', -1)
            return (self.sv[n] if isinstance(n, int) and n >= 0 else 0.0) >= .5
        return False

    def set_gates(self, t):
        for i in self.iS:
            self.on[i] = self.gate_state(self.els[i], t)
        for i in self.gon:
            self.gon[i] = self.gate_state(self.els[i], t)
            if self.els[i]['gk'] == 'igbt' and not self.gon[i]:
                self.on[i] = False

    def may_turn_on(self, i, init=False):
        gk = self.els[i].get('gk')
        return not gk or self.gon[i] or (init and gk == 'scr')

    def tolerances(self, x):
        nl = self.nI
        iscale = float(np.max(np.abs(x[:nl]))) if nl else 0.0
        vscale = float(np.max(np.abs(x[nl:self.nsn]))) if self.nsn > nl else 0.0
        return 1e-9 * (1 + iscale), 1e-7 * (1 + vscale)

    def consistent(self, t, x, init=False):
        itol, vtol = self.tolerances(x)
        for it in range(80):
            tp = self.topo(t)
            z = self.solve_z(t, x, tp)
            bad = []
            for i in self.iD:
                e = self.els[i]
                v = (z[e['a']] if e['a'] >= 0 else 0) - (z[e['b']] if e['b'] >= 0 else 0)
                if self.on[i]:
                    cur = (v - e['Vf']) / e['Ron']
                    if cur < -itol:
                        bad.append((-cur * e['Ron'], i))
                elif self.may_turn_on(i, init) and v > e['Vf'] + vtol:
                    bad.append((v - e['Vf'], i))
            for i in self.iSG:          # spark gaps: close at |v| > U_b or at the trigger (opening is an event)
                e = self.els[i]
                if self.on[i]:
                    continue
                gp = e['gap']
                if not e['trig_done'] and t >= gp['trig'] - 1e-9 * self.base_T:
                    bad.append((math.inf, i))
                    continue
                if gp.get('de') or abs(t - self.just_off.get(i, -math.inf)) <= 1e-12 * self.base_T:
                    continue            # volt–time gap: closes by its event. Or just opened at a current zero: the residual current through R_off is not a breakdown
                v = (z[e['a']] if e['a'] >= 0 else 0) - (z[e['b']] if e['b'] >= 0 else 0)
                if abs(v) > gp['Ub'] * (1 + 1e-9):
                    bad.append((abs(v) - gp['Ub'], i))
            if not bad:
                return tp, z
            for _, i in bad:
                if i in self.iSG and not self.on[i] and t >= self.els[i]['gap']['trig'] - 1e-9 * self.base_T:
                    self.els[i]['trig_done'] = True
            if it < 25:
                for _, i in bad:
                    self.on[i] = not self.on[i]
            else:   # flip the worst one only: breaks oscillation between parallel diodes
                i = max(bad)[1]
                self.on[i] = not self.on[i]
        raise BatchError(f'Οι καταστάσεις των διόδων δεν συγκλίνουν στο t = {t:.6g} s.')

    # ------------------------------------------------------------ controllers
    def value(self, rec, t, x, z):
        if not rec:
            return 0.0
        if 'v' in rec:
            return float(sum(c * z[nd] for nd, c in rec['v'] if nd >= 0))
        if 'i' in rec:
            return float(sum(it[1] * self.current(it[0], t, x, z, it[2] if len(it) > 2 else 0) for it in rec['i']))
        if 'prod' in rec:
            a, b = rec['prod']
            return self.value(a, t, x, z) * self.value(b, t, x, z)
        if 'sum' in rec:
            return float(sum(self.value(r, t, x, z) for r in rec['sum']))
        if 'ctrl' in rec:
            ci, field = rec['ctrl']
            return float(getattr(self.ctrls[ci], field))
        if 'gate' in rec:
            ci, out = rec['gate']
            return 1.0 if self.ctrls[ci].gate(out, t) else 0.0
        if 'sh' in rec:
            return float(self.shs[rec['sh']]['h'])
        if 'srm' in rec:                # flux of one phase of a switched reluctance machine
            q, k = rec['srm']
            return float(x[self.srms[q]['k0'] + k])
        if 'car' in rec:
            return float(self.ctrls[rec['car']].carrier_at(t))
        if 'blk' in rec:                # signal block output, from the last pass at this point
            j = rec['blk']
            if rec.get('out'):
                return float(self._yo[j][rec['out']]) if j < len(self._yo) else 0.0
            return float(self._yb[j]) if j < len(self._yb) else 0.0
        if 'sw' in rec:                 # gate pulse of one switch (after dead time)
            i = rec['sw']
            on = self.on.get(i, False) if self.els[i]['k'] == 'S' else self.gon.get(i, False)
            return 1.0 if on else 0.0
        return 0.0

    def current(self, i, t, x, z, port=0):
        e = self.els[i]
        k = e['k']
        V = lambda nd: z[nd] if nd is not None and nd >= 0 else 0.0
        if k == 'L':
            return float(x[self.cur.index((i, None))])
        if k == 'F':
            if e.get('srm') is not None:
                return float(self.srm_currents(self.srms[e['srm']], x)[port])
            if e.get('sm') is not None:
                return float(self.sm_ports(self.sms[e['sm']], x)[port])
            if e.get('gen') is not None:
                return float(self.gen_cur(self.gens[e['gen']], x)[0][port])
            return float(x[self.cur.index((i, port))])
        if k == 'MG':
            N = int(e['N'])
            return float(sum(e['Gm'][port * N + j] * (V(e['ports'][j][0]) - V(e['ports'][j][1])) for j in range(N)))
        if k == 'C':
            return float(z[self.crow[i]])
        if k == 'V':
            return float(-z[e['row']])
        if k in ('X', 'GY'):
            return float(z[e['row']])
        if k == 'I':
            if e.get('wave'):
                return wave_at(e['wave'], t)
            return sched_at(e.get('sched'), t, _f(e.get('I')))
        if k == 'CPL':
            return float(self.icpl[self.iP.index(i)])
        if k == 'NL':
            return float(self.inl[self.iN.index(i)])
        if k == 'TL':
            e2 = (e['a1'], e['b1']) if port == 0 else (e['a2'], e['b2'])
            return (V(e2[0]) - V(e2[1])) / e['Ze'] + self.tl_ih(e, t)[port]
        v = V(e.get('a')) - V(e.get('b'))
        if k == 'G':
            return v / self.R(e, t)
        if k == 'S':
            return v / (e['Ron'] if self.on[i] else e['Roff'])
        if k == 'D':
            return (v - e['Vf']) / e['Ron'] if self.on[i] else v / e['Roff']
        return 0.0

    def prime(self, t):
        """Carrier phase and open-loop duty before the first consistent solution."""
        for k in self.ctrls:
            idx = math.floor((t + 1e-12 * k.T) / k.T - k.phase)
            k.tk = (idx + k.phase) * k.T
            if k.mode in ('fixed', 'pp'):
                k.d = k.dOn = k.dOff = sched_at(k.dsched, t, k.D)
            elif k.mode == 'ext':
                k.d = k.dOn = k.dOff = self.sig_in(k.dIn)

    def sig_in(self, n):
        v = self.sv[n] if isinstance(n, int) and 0 <= n < self.nsig else 0.0
        return v if math.isfinite(v) else 0.0

    def sh_grid(self, q):
        clk = q.get('clk')
        if clk:                         # a clock block: its rising edges
            T = 1 / max(_f(clk.get('f'), 1e5), 1e-6)
            b0 = _f(clk.get('ph')) * T
        elif q.get('clock') is None:
            return None
        else:
            k = self.ctrls[q['clock']]
            T, b0 = k.T, k.phase * k.T
        return (b0 + (T / 2 if q['trig'] == 'mid' else 0.0), T / 2 if q['trig'] == 'both' else T)

    def sh_next(self, q, t):
        g = self.sh_grid(q)
        if g is None:
            return math.inf
        b, d = g
        return b + (math.floor((t - b) / d + 1e-7) + 1) * d

    def log_ev(self, t, kind, src, v, **x):
        """One entry of the event log (3.19): the same kinds and fields as Sim.logEv in the browser, with the part's id."""
        self.ev_n += 1
        if len(self.ev) < self.ev_max:
            self.ev.append({'t': t, 'kind': kind, 'id': src, 'src': src, 'v': v, 'side': 't+', **x})

    def ev_switches(self, t):
        for i in self.iD + self.iS + self.iSG:
            on = 1 if self.on[i] else 0
            e = self.els[i]
            if i in self._evon and self._evon[i] != on:
                kind = 'switch' if e['k'] == 'S' else 'gap' if e.get('gap') else 'scr' if (e.get('gk') or e.get('fire')) else 'diode'
                self.log_ev(t, kind, e.get('cid'), on)
            self._evon[i] = on

    def sh_sample(self, t, x, z):
        """Samples due at t (state at t, before any switching at that instant)."""
        any_ = False
        for q in self.shs:
            g = self.sh_grid(q)
            if g is None or q['sig']:
                continue
            u = (t - g[0]) / g[1]
            n = round(u)
            if abs(u - n) > 1e-7 or q['last'] == n:
                continue
            q['last'] = n
            v = self.value(q['rec'], t, x, z)
            q['h'] = v
            q['t'].append(t)
            q['v'].append(v)
            self.log_ev(t, 'sample', q['id'], v, n=n)
            any_ = True
        return any_

    def sample(self, t, x, z, force=False):
        changed = False
        for k in self.ctrls:
            T = k.T
            idx = math.floor((t + 1e-12 * T) / T - k.phase)
            dbl = k.dbl()
            half = math.floor((t + 1e-12 * T) / (T / 2) - 2 * k.phase) if dbl else None
            if not force and k.k == idx and (not dbl or k.h == half):
                continue
            changed = True
            period = force or k.k != idx
            first = k.k is None
            if period:
                if not first:
                    k.tkPrev, k.dPrev, k.dPrevOff = k.tk, k.dOn, k.dOff
                k.k = idx
                k.tk = (idx + k.phase) * T
            k.h = half
            T = T / 2 if dbl else T       # controller sampling period
            if k.mode in ('fixed', 'pp'):
                k.d = sched_at(k.dsched, t, k.D)
            elif k.mode == 'ext':
                k.d = self.sig_in(k.dIn)
            elif k.mode == 'pi':
                k.refNow = sched_at(k.ref, t, k.ref[0][1])
                k.meas = self.value(k.sensor, t, x, z)
                if not math.isfinite(k.meas):
                    k.meas = 0.0
                ff = 0.0
                if k.ff == 'ratio':
                    a, b = self.value(k.ffA, t, x, z), self.value(k.ffB, t, x, z)
                    ff = 1 - a / b if abs(b) > 1e-9 else 0.0
                elif k.ff == 'const':
                    ff = k.D0
                e = k.refNow - k.meas
                if force and not self.started:
                    k.xi, k.ePrev, k.dF = 0.0, None, 0.0
                der = 0.0
                if k.Kd:
                    raw = 0.0 if k.ePrev is None else (e - k.ePrev) / T
                    k.dF = (k.Tf * k.dF + T * raw) / (k.Tf + T) if k.Tf > 0 else raw
                    der = k.Kd * k.dF
                k.ePrev = e
                k.xi += k.Ki * T * e
                d = ff + k.Kp * e + k.xi + der
                if d > k.dmax or d < k.dmin:
                    k.xi -= k.Ki * T * e
                    d = min(k.dmax, max(k.dmin, ff + k.Kp * e + k.xi + der))
                k.d = d
            if period:
                k.dOn = k.dOff = k.d
            else:
                k.dOff = k.d
            if not force:
                self.log_ev(t, 'duty', k.id, k.d, n=idx, **({} if period else {'half': True}))
            if first or k.tkPrev is None:
                k.tkPrev, k.dPrev, k.dPrevOff = k.tk - k.T, k.dOn, k.dOff
        return changed

    # ------------------------------------------------------------ signal blocks (3.0)
    @staticmethod
    def cmp_f(b, s, pv, nv):
        g = pv - nv
        tol = 1e-9 * (abs(pv) + abs(nv)) + 1e-12
        h = max(_f(b.get('hys')), 4 * tol) / 2
        return g + h - tol if s else g - h + tol

    def blk_due(self, b, t, force):
        g = self.sh_grid(b)
        if g is None:
            return False
        u = (t - g[0]) / g[1]
        n = round(u)
        if abs(u - n) > 1e-7 or (not force and b['st'].get('last') == n):
            return False
        b['st']['last'] = n
        return True

    def eval_blocks(self, t, x, z, mode, force=False, left=False, flip=(), outs=False):
        """Same pass as Sim.evalBlocks in the browser. Returns (block outputs, discrete update happened);
        with outs=True the first item is (main outputs, all outputs per block)."""
        if not self.blocks:
            return ([], []) if outs else [], False
        trial, disc = mode == 'trial', mode in ('sample', 'init')
        sv = [0.0] * self.nsig
        yb = [0.0] * len(self.blocks)
        yo = [[0.0] * len(b.get('outList') or []) for b in self.blocks]
        cont, Q3, P2 = [], math.sqrt(3), 2 * math.pi
        tt = t - 1e-8 * self.base_T if left else t
        rd = lambda n: sv[n] if isinstance(n, int) and n >= 0 else 0.0
        sampled, pend = False, []
        for j, b in enumerate(self.blocks):
            st, I, ty = b['st'], b['ins'], b['type']
            y, ys = 0.0, None
            if ty in ('VM', 'AM', 'MEAS'):
                y = self.value(b.get('rec'), t, x, z)
                if not math.isfinite(y):
                    y = 0.0
            elif ty == 'CONST':
                y = sched_at(b['sched'], tt, b['sched'][0][1])
            elif ty == 'GAIN':
                y = _f(b.get('K'), 1) * rd(I.get('u'))
            elif ty == 'SUM':
                sg = b['sg']
                y = sg[0] * rd(I.get('a')) + sg[1] * rd(I.get('b')) + (sg[2] * rd(I['c']) if 'c' in I else 0.0)
            elif ty == 'MUL':
                y = rd(I.get('a')) * rd(I.get('b'))
            elif ty == 'DIV':
                d = rd(I.get('b'))
                y = rd(I.get('a')) / d if abs(d) > _f(b.get('eps')) else st.get('y', 0.0)
                if not trial:
                    st['y'] = y
            elif ty == 'SAT':
                y = min(_f(b.get('hi'), 1), max(_f(b.get('lo')), rd(I.get('u'))))
            elif ty == 'CMP':
                if b['id'] in flip:        # root located by the ODE solver: the output changes here
                    st['s'] = 1 - st['s']
                pv, nv = rd(I.get('p')), rd(I.get('n'))
                f = self.cmp_f(b, st['s'], pv, nv)
                s2 = (0 if f < 0 else 1) if st['s'] else (1 if f > 0 else 0)
                if trial:
                    b['f1'] = f
                else:
                    if s2 != st['s'] and not disc:
                        self.log_ev(t, 'cmp', b['id'], s2)
                    st['s'], st['f0'] = s2, self.cmp_f(b, s2, pv, nv)
                y = float(s2)
            elif ty == 'LOGIC':
                a, c = rd(I.get('a')) >= .5, rd(I.get('b')) >= .5
                y = 1.0 if {'and': a and c, 'or': a or c, 'xor': a != c, 'not': not a, 'nand': not (a and c), 'nor': not (a or c)}[b.get('op', 'or')] else 0.0
            elif ty == 'PIB':
                if disc and self.blk_due(b, t, force):
                    Ts, e = self.sh_grid(b)[1], rd(I.get('u'))
                    if force and not self.started:
                        st['xi'] = 0.0
                    st['xi'] += b['Ki'] * Ts * e
                    q = b['y0'] + b['Kp'] * e + st['xi']
                    if q > b['ymax'] or q < b['ymin']:
                        st['xi'] -= b['Ki'] * Ts * e
                        q = min(b['ymax'], max(b['ymin'], b['y0'] + b['Kp'] * e + st['xi']))
                    st['y'] = q
                    sampled = True
                    if b.get('track'):
                        st['kt'] = min(1.0, b['Ki'] * Ts / b['Kp']) if b['Kp'] > 0 else 1.0
                        pend.append(b)
                y = st['y']
            elif ty == 'EXPR':
                v = [rd(I.get(k)) for k in b['inNames']] + list(b.get('parVals') or [])
                try:
                    y = eval_ast(b['ast'], v, tt)
                except (ValueError, ZeroDivisionError, OverflowError):
                    y = 0.0
                if not math.isfinite(y):
                    y = 0.0
            elif ty == 'PY':
                if mode == 'sample' and self.blk_due(b, t, force):
                    if '_rt' not in b:
                        g = self.sh_grid(b)
                        b['_rt'] = make_python_block(b['code'], b['inNames'], b['outNames'], b.get('pars') or {}, g[1] if g else 0.0, b['id'])
                    st['ys'] = b['_rt'](t, [rd(I.get(k)) for k in b['inNames']])
                    sampled = True
                ys = {k: (st['ys'][i] if st.get('ys') else _f(b.get('y0'), 0)) for i, k in enumerate(b['outNames'])}
            elif ty == 'SRM':
                m = self.srms[b['srm']]
                k0, N = m['k0'], m['N']
                ys = {'w': x[k0 + N], 'te': self.srm_deriv(m, t, x, z)[1], 'th': x[k0 + N + 1] % P2}
                ys.update({f'i{k + 1}': c for k, c in enumerate(self.srm_currents(m, x))})
            elif ty == 'GEN3':
                ys = self.gen_out(self.gens[b['gen']], t, x, z)
            elif ty == 'SM':
                m = self.sms[b['sm']]
                k0 = m['k0']
                _, _, i_d, i_q = self.sm_cur(m, x)
                te = self.sm_deriv(m, t, x, z)[1]
                ys = {'w': x[k0 + 2], 'te': te, 'th': x[k0 + 3] % P2, 'id': i_d, 'iq': i_q}
            elif ty == 'IM':
                m = self.ims[b['im']]
                k0 = m['k0']
                te = self.im_deriv(m, t, x)[1]
                f, r = math.atan2(x[k0 + 1], x[k0]), m['p'] * x[k0 + 3]
                ys = {'w': x[k0 + 2], 'te': te, 'psi': math.hypot(x[k0], x[k0 + 1]), 'thf': f % P2, 'thr': r % P2}
            elif ty == 'UD':
                if disc and self.blk_due(b, t, force):
                    st['y'] = b['y0'] if force else st['mem']
                    pend.append(b)
                    sampled = True
                y = st['y']
            elif ty == 'SR':
                S, Rr = rd(I.get('s')) >= .5, rd(I.get('r')) >= .5
                q = st['q']
                if S and not st['sp']:
                    q = 1
                if Rr:
                    q = 0
                if not trial:
                    if q != st['q']:
                        self.log_ev(t, 'latch', b['id'], q)
                    st['q'], st['sp'] = q, S
                ys = {'q': float(q), 'nq': float(1 - q)}
            elif ty == 'INT':
                dt = max(0.0, t - st['t'])
                v = min(b['hi'], max(b['lo'], st['s'] + dt * st['u']))
                if b.get('wrap'):
                    v -= P2 * math.floor(v / P2)
                y = v
                if not trial:
                    cont.append((b, v))
            elif ty == 'LPF':
                dt = max(0.0, t - st['t'])
                y = st['u'] + (st['s'] - st['u']) * math.exp(-dt / b['tau'])
                if not trial:
                    cont.append((b, y))
            elif ty == 'F2':            # 3.19: input held since the previous evaluation, exact (Φ = e^{A·dt})
                dt = max(0.0, t - st['t'])
                F = f2_phi(b['w0'], b['z'], dt)
                d1, d2 = st['s'][0] - st['u'], st['s'][1]
                q1, q2 = st['u'] + F[0] * d1 + F[1] * d2, F[2] * d1 + F[3] * d2
                u, k = rd(I.get('u')), b.get('kind')
                y = q1 if k == 'lp' else 2 * b['z'] * q2 if k == 'bp' else u - q1 - 2 * b['z'] * q2 if k == 'hp' else u - 2 * b['z'] * q2
                if not trial:
                    cont.append((b, [q1, q2]))
            elif ty == 'RLIM':
                dt = max(0.0, t - st['t'])
                y = st['s'] + min(b['up'] * dt, max(-b['dn'] * dt, st['u'] - st['s']))
                if not trial:
                    cont.append((b, y))
            elif ty == 'RT':
                if disc and self.blk_due(b, t, force):
                    if b.get('mode') == 'delay':
                        st['y'] = b['y0'] if force else st['mem']
                        pend.append(b)
                    else:
                        st['y'] = rd(I.get('u'))
                    sampled = True
                y = st['y']
            elif ty == 'EDGE':
                lv = rd(I.get('u')) >= .5
                e = lv != bool(st['p']) and (b['edge'] == 'both' or (b['edge'] == 'rise') == lv)
                n, ton = st['n'], st['tOn']
                if not trial:
                    if e:
                        n, ton = n + 1, t
                        st['n'], st['tOn'] = n, ton
                        self.log_ev(t, 'edge', b['id'], n)
                    st['p'] = 1 if lv else 0
                tw = b.get('tw') or 0.0
                on = e or (ton is not None and (t < ton + tw - 1e-9 * self.base_T if tw > 0 else t == ton))
                ys = {'y': 1.0 if on else 0.0, 'n': float(n + 1 if e and trial else n)}
            elif ty == 'CLARKE':
                a, bb, c = rd(I.get('a')), rd(I.get('b')), rd(I.get('c'))
                k = math.sqrt(1.5) if b.get('pw') else 1.0
                ys = {'al': k * (2 * a - bb - c) / 3, 'be': k * (bb - c) / Q3}
            elif ty == 'ICLARKE':
                k = math.sqrt(2 / 3) if b.get('pw') else 1.0
                al, be = k * rd(I.get('al')), k * rd(I.get('be'))
                ys = {'a': al, 'b': -al / 2 + Q3 / 2 * be, 'c': -al / 2 - Q3 / 2 * be}
            elif ty == 'PARK':
                al, be, th = rd(I.get('al')), rd(I.get('be')), rd(I.get('th'))
                ys = {'d': al * math.cos(th) + be * math.sin(th), 'q': -al * math.sin(th) + be * math.cos(th)}
            elif ty == 'IPARK':
                d, q, th = rd(I.get('d')), rd(I.get('q')), rd(I.get('th'))
                ys = {'al': d * math.cos(th) - q * math.sin(th), 'be': d * math.sin(th) + q * math.cos(th)}
            elif ty == 'PLL':
                dt = max(0.0, t - st['t'])
                th = st['th'] + dt * st['w']
                th -= P2 * math.floor(th / P2)
                a, bb, c = rd(I.get('a')), rd(I.get('b')), rd(I.get('c'))
                al, be = (2 * a - bb - c) / 3, (bb - c) / Q3
                vd, vq, amp = al * math.cos(th) + be * math.sin(th), -al * math.sin(th) + be * math.cos(th), math.hypot(al, be)
                e = vq / amp if amp > 1e-9 else 0.0
                xi = st['xi'] + b['Ki'] * dt * e
                w = b['w0'] + b['Kp'] * e + xi
                if not trial:
                    st['th'], st['xi'], st['w'], st['t'] = th, xi, w, t
                ys = {'th': th, 'w': w, 'amp': vd}
            elif ty == 'DCM':
                ys = {k: self.value(r, t, x, z) for k, r in (b.get('recs') or {}).items()}
            elif ty == 'MOD3':
                v = [rd(I.get('va')), rd(I.get('vb')), rd(I.get('vc'))]
                dc = max(abs(rd(I.get('vdc'))), 1e-9)
                o = -(max(v) + min(v)) / 2 if b.get('mode') == 'svpwm' else 0.0
                d = [(1.0 if q > 0 else 0.0) if b.get('mode') == 'square' else min(1.0, max(0.0, .5 + (q + o) / dc)) for q in v]
                ys = {'da': d[0], 'db': d[1], 'dc': d[2]}
            elif ty == 'FEST':          # current model of the rotor flux, as the browser (trapezoidal, inputs held)
                dt = max(0.0, t - st['t'])
                ia0, ib0, w0 = st['u']
                g, k = b['RR'] / b['LM'], dt / 2
                a11, a12 = 1 + k * g, k * w0
                r1 = (1 - k * g) * st['pa'] - k * w0 * st['pb'] + dt * b['RR'] * ia0
                r2 = (1 - k * g) * st['pb'] + k * w0 * st['pa'] + dt * b['RR'] * ib0
                det = a11 * a11 + a12 * a12
                pa, pb = (a11 * r1 - a12 * r2) / det, (a11 * r2 + a12 * r1) / det
                ps, th = math.hypot(pa, pb), math.atan2(pb, pa)
                iq = -rd(I.get('al')) * math.sin(th) + rd(I.get('be')) * math.cos(th)
                if not trial:
                    cont.append((b, (pa, pb)))
                ys = {'th': th % P2, 'psi': ps, 'w1': rd(I.get('wr')) + (b['RR'] * iq / ps if ps > 1e-6 else 0.0)}
            elif ty == 'CLK':
                u = b['f'] * tt - b['ph']
                y = 1.0 if u - math.floor(u + 1e-11) < b['duty'] - 1e-11 else 0.0
            elif ty == 'RAMP':
                u = b['f'] * tt - b['ph']
                fr = max(0.0, u - math.floor(u + 1e-11))
                y = b['lo'] + (b['hi'] - b['lo']) * (abs(1 - 2 * fr) if b.get('shape') == 'tri' else fr)
            elif ty == 'DISP':
                y = rd(I.get('u'))
            elif ty == 'SH':
                q = self.shs[b['sh']]
                if b.get('sig') and disc:
                    g = self.sh_grid(q)
                    if g is not None:
                        u = (t - g[0]) / g[1]
                        n = round(u)
                        if abs(u - n) <= 1e-7 and (force or q['last'] != n):
                            v = rd(I.get('u'))
                            q['h'] = v
                            sampled = True
                            if mode == 'sample':
                                if q['last'] != n:
                                    q['t'].append(t)
                                    q['v'].append(v)
                                elif q['v']:
                                    q['v'][-1] = v
                                q['last'] = n
                y = q['h']
            ol, o = b.get('outList') or [], b['outs']
            if ol:
                if ys is None:
                    ys = {ol[0]: y}
                y = ys.get(ol[0], 0.0)
            yb[j] = y
            for k, name in enumerate(ol):
                v = ys.get(name, 0.0)
                yo[j][k] = v
                if o.get(name, -1) >= 0:
                    sv[o[name]] = v
        if sampled and not trial and mode == 'sample':
            for b in self.blocks:
                st = b['st']
                if b['type'] in ('PIB', 'UD', 'RT', 'PY') and st.get('last') is not None and st.get('evN') != st['last']:
                    st['evN'] = st['last']
                    v = (st['ys'][0] if st.get('ys') else _f(b.get('y0'), 0)) if b['type'] == 'PY' else st['y']
                    self.log_ev(t, 'sample', b['id'], v, n=st['last'])
        for b in pend:                  # z⁻¹ stores its input; PI back-calculation: dx_i/dt = K_i·(e + tr/K_p)
            if b['type'] == 'PIB':
                b['st']['xi'] += b['st']['kt'] * rd(b['ins'].get('tr'))
            else:
                b['st']['mem'] = rd(b['ins'].get('u'))
        for b, v in cont:
            if b['type'] == 'FEST':
                b['st']['pa'], b['st']['pb'] = v
                b['st']['u'] = [rd(b['ins'].get('al')), rd(b['ins'].get('be')), rd(b['ins'].get('wr'))]
                b['st']['t'] = t
            else:
                b['st']['s'], b['st']['u'], b['st']['t'] = v, rd(b['ins'].get('u')), t
        if not trial:
            self.sv, self.yb, self.yo = sv, yb, yo
        return ((yb, yo) if outs else yb), sampled

    def block_events(self, t, tn, eps):
        for b in self.blocks:
            ty = b['type']
            if ty in ('CLK', 'RAMP'):
                u = b['f'] * t - b['ph']
                nx = lambda k, o=0.0, b=b: (k + o + b['ph']) / b['f']
                c = [nx(math.floor(u + 1e-9) + 1)]
                if ty == 'CLK' and 0 < b['duty'] < 1:
                    c.append(nx(math.floor(u - b['duty'] + 1e-9) + 1, b['duty']))
                if ty == 'RAMP' and b.get('shape') == 'tri':
                    c.append(nx(math.floor(u - .5 + 1e-9) + 1, .5))
                for te in c:
                    if t + eps < te < tn:
                        tn = te
            elif ty == 'CONST':
                for ts, _ in b['sched'] or []:
                    if t + eps < ts < tn:
                        tn = ts
            elif ty in ('PIB', 'UD', 'PY', 'RT'):
                ts = self.sh_next(b, t)
                if t + eps < ts < tn:
                    tn = ts
            elif ty == 'EDGE' and (b.get('tw') or 0) > 0 and b['st'].get('tOn') is not None:
                te = b['st']['tOn'] + b['tw']
                if t + eps < te < tn:
                    tn = te
        return tn

    # ------------------------------------------------------------ events
    def next_event(self, t, tmax):
        tn = tmax
        eps = self.base_T * 1e-9
        for k in self.ctrls:
            if k.mode == 'spwm':
                continue
            for e in k.edges():
                if t + eps < e < tn:
                    tn = e
            tv = k.tk + k.T / 2           # carrier minimum (triangle)
            if k.mode != 'pp' and k.carrier != 'saw' and t + eps < tv < tn:
                tn = tv
        for q in self.shs:
            ts = self.sh_next(q, t)
            if t + eps < ts < tn:
                tn = ts

        def sch(s):
            nonlocal tn
            for ts, _ in s or []:
                if t + eps < ts < tn:
                    tn = ts
        for e in self.els:
            sch(e.get('sched'))
            if e['k'] == 'V':
                sch(e['src'].get('sched'))
        for k in self.ctrls:
            sch(k.dsched)
            if k.mode == 'pi':
                sch(k.ref)
        for e in self.els:
            if e.get('fire'):
                for te in self.scr_edges(e, t):
                    if t + eps < te < tn:
                        tn = te
        for i in self.iSG:
            gp = self.els[i]['gap']
            if not self.els[i]['trig_done'] and t + eps < gp['trig'] < tn:
                tn = gp['trig']
        if self.iT:                     # method of steps: the history at t − τ must already be recorded
            tn = min(tn, t + self.tau_min)
        tn = self.block_events(t, tn, eps)
        if self.has_cont:               # continuous blocks are integrated at segment ends, as the browser does at its steps
            tn = min(tn, t + self.base_T / self.cont_div)
        sp = [k for k in self.ctrls if k.mode == 'spwm']
        if sp:
            outs = ('a', 'na', 'b', 'nb') if any(k.dt > 0 for k in sp) else ('a', 'b')
            sig = lambda s: tuple(k.gate(o, s) for k in sp for o in outs)
            step = min(k.T for k in sp) / 40
            s0 = sig(t + step * 1e-7)
            lo = t
            while lo < tn:
                hi = min(lo + step, tn)
                if sig(hi) != s0:
                    a, b = lo, hi
                    for _ in range(60):
                        m = (a + b) / 2
                        if sig(m) == s0:
                            a = m
                        else:
                            b = m
                    tn = max(b, t + eps * 10)
                    break
                lo = hi
        return tn


def _decimate(t, cols, limit):
    n = len(t)
    if n <= limit:
        return np.arange(n)
    buckets = max(1, limit // (2 + 2 * len(cols)))
    edges = np.linspace(0, n, buckets + 1).astype(int)
    keep = set()
    for a, b in zip(edges[:-1], edges[1:]):
        if b <= a:
            continue
        keep.update((a, b - 1))
        for c in cols:
            seg = c[a:b]
            keep.update((a + int(np.argmin(seg)), a + int(np.argmax(seg))))
    return np.array(sorted(keep))


def _diagnose(ckt, tp, method, max_step):
    """Messages for the diagnostics console (3.13), in the browser's format {sev, grp, id, msg, fix}:
    the fastest modes of the circuit at t = 0 (eigenvalues of the state Jacobian) against the method."""
    out = []
    J = tp.get('J') if isinstance(tp, dict) else None
    if J is None or not hasattr(J, 'shape') or not J.shape[0] or J.shape[0] > 400:
        return out
    try:
        lam, vec = np.linalg.eig(J)
    except np.linalg.LinAlgError:
        return out
    E = ckt.els

    def owner(k):
        if k < ckt.nI:
            return E[ckt.cur[k][0]].get('cid')
        j = k - ckt.nI
        return E[ckt.iC[j]].get('cid') if j < len(ckt.iC) else None
    a = np.abs(lam)
    if not len(a) or not np.isfinite(a).any():
        return out
    k = int(np.nanargmax(a))
    lmax = float(a[k])
    if not lmax > 0:
        return out
    w = np.abs(vec[:, k])
    ids = []
    for q in np.argsort(-w):
        if w[q] < 0.3 * w.max() or len(ids) >= 3:
            break
        cid = owner(int(q))
        if cid and cid not in ids:
            ids.append(cid)
    tau = 1 / lmax
    from engine.templates import eng

    def _g(x, d=3):
        return f'{x:.{d}g}'.replace('.', ',')
    if method not in IMPLICIT and lmax * max_step > 3:
        out.append({'sev': 'warn', 'grp': 'server', 'id': ids[0] if ids else None, 'key': 'srv:explicit',
                    'msg': f'Ο {method} είναι ρητή μέθοδος και το κύκλωμα έχει σταθερά χρόνου {eng(tau, "s", 3)}'
                           + (f' ({", ".join(ids)})' if ids else '') + f': το βήμα του θα πέσει κάτω από {eng(2.8 * tau, "s", 3)} για να μείνει ευσταθής.',
                    'fix': 'Διάλεξε Radau, BDF ή LSODA (πεπλεγμένες): το βήμα τους ορίζεται από την ακρίβεια, όχι από την ευστάθεια.'})
    elif lmax * max_step > 1e4:
        out.append({'sev': 'info', 'grp': 'server', 'id': ids[0] if ids else None, 'key': 'srv:stiff',
                    'msg': f'Άκαμπτο κύκλωμα: σταθερά χρόνου {eng(tau, "s", 3)}' + (f' ({", ".join(ids)})' if ids else '')
                           + f', {_g(lmax * max_step)} φορές μικρότερη από το μέγιστο βήμα. Ο {method} τη χειρίζεται.',
                    'fix': 'Αν ο LSODA αποτύχει ή αργεί, Radau.'})
    return out


def simulate(data):
    """Action 'batch_sim'. Input: {net, channels, t_end, method, rtol, atol, max_step, max_points}."""
    if not isinstance(data, dict) or not isinstance(data.get('net'), dict):
        raise BatchError('Λείπει το κύκλωμα.')
    blocks = (data['net'].get('sig') or {}).get('blocks') or []
    if any(isinstance(b, dict) and b.get('type') == 'PY' for b in blocks) and not data.get('_local'):
        # user code runs only on a server that the user runs for himself
        raise BatchError('Τα μπλοκ Python εκτελούνται στον server μόνο όταν τρέχει τοπικά (python run.py, διεύθυνση 127.0.0.1).')
    method = data.get('method', 'Radau')
    if method not in METHODS:
        raise BatchError('Άγνωστη μέθοδος: ' + str(method))
    t_end = _f(data.get('t_end'), 0)
    if not 0 < t_end <= LIMITS['t_end']:
        raise BatchError(f'Η διάρκεια πρέπει να είναι 0 … {LIMITS["t_end"]} s.')
    rtol = min(1e-2, max(1e-12, _f(data.get('rtol'), 1e-6)))
    atol = min(1.0, max(1e-14, _f(data.get('atol'), 1e-9)))
    max_step = _f(data.get('max_step'), 0)
    max_points = int(min(200000, max(1000, _f(data.get('max_points'), 40000))))
    wall = min(LIMITS['wall'], max(1.0, _f(data.get('wall'), LIMITS['wall'])))
    channels = data.get('channels') or {}
    if not isinstance(channels, dict) or len(channels) > 40:
        raise BatchError('Μέχρι 40 σήματα.')
    ckt = Circuit(data['net'])
    ckt.ev_max = int(min(200000, max(0, _f(data.get('events'), 20000))))   # 3.19: entries of the event log (0: none)
    if data.get('cont_div'):
        ckt.cont_div = int(min(20000, max(10, _f(data.get('cont_div'), ckt.cont_div))))
    # default step limit: diode events inside a long smooth segment (AC sources)
    # must not be stepped over, and the reference trace needs enough points
    auto_step = max_step <= 0
    if auto_step:
        max_step = ckt.base_T / (50 if ckt.ctrls else 200)
        if ckt.iT:                      # the line history is interpolated between the solver's points
            max_step = min(max_step, ckt.tau_min / 50)
    if t_end / ckt.base_T > LIMITS['periods']:
        raise BatchError(f'Πάνω από {LIMITS["periods"]} περίοδοι: μείωσε τη διάρκεια.')
    keys = list(channels)
    T, Y = [], [[] for _ in keys]
    stats = {'segments': 0, 'diode_events': 0, 'cmp_events': 0, 'nfev': 0, 'njev': 0, 'nlu': 0, 'steps': 0}
    start = time.perf_counter()
    status, message = 'ok', ''

    has_blk = any('blk' in (channels[k] or {}) for k in keys)

    def record(t, x, z):
        if has_blk:
            ckt._yb, ckt._yo = ckt.eval_blocks(t, x, z, 'trial', outs=True)[0]
        T.append(t)
        for j, k in enumerate(keys):
            Y[j].append(ckt.value(channels[k], t, x, z))

    t, x = 0.0, ckt.x0.copy()
    ckt.eval_blocks(0.0, x, np.zeros(ckt.n), 'init', force=True)   # node voltages 0, states at their initial values
    ckt.prime(0.0)
    ckt.set_gates(0.0)
    tp, z = ckt.consistent(0.0, x, init=True)
    ckt.tl_record(0.0, z)
    ckt.sh_sample(0.0, x, z)
    ckt.eval_blocks(0.0, x, z, 'sample', force=True)
    ckt.sample(0.0, x, z, force=True)
    record(t, x, z)
    stuck = 0
    implicit = method in IMPLICIT
    diag = _diagnose(ckt, tp, method, max_step)
    while t < t_end * (1 - 1e-12):
        if time.perf_counter() - start > wall:
            status, message = 'timeout', f'Σταμάτησε στο t = {t:.6g} s (όριο {wall:.0f} s). ' + (
                'Οι ρητές μέθοδοι (RK) θέλουν πολύ μικρά βήματα σε άκαμπτα κυκλώματα (R_off, DCM): δοκίμασε Radau ή BDF.' if not implicit else 'Μεγάλωσε τα rtol/atol ή μείωσε τη διάρκεια.')
            break
        if len(T) > LIMITS['points']:
            status, message = 'points', f'Σταμάτησε στο t = {t:.6g} s: πάνω από {LIMITS["points"]} σημεία.'
            break
        tn = ckt.next_event(t, t_end)
        before = (tuple(ckt.on.values()), tuple(ckt.gon.values()))
        ckt.set_gates((t + tn) / 2)
        tp, z = ckt.consistent(t, x)
        ckt.ev_switches(t)              # 3.19: the states for (t, t_n), logged at t as in the browser
        if (tuple(ckt.on.values()), tuple(ckt.gon.values())) != before:
            ckt.eval_blocks(t, x, z, 'commit')
            ckt.tl_record(t, z)
            record(t, x, z)            # the point right after switching: vertical edges
        itol, vtol = ckt.tolerances(x)
        cache = {}

        def zof(tt, yy, tp=tp):
            key = (tt, yy.tobytes())
            if cache.get('k') != key:
                cache['k'] = key
                cache['z'] = ckt.solve_z(tt, yy, tp)
            return cache['z']

        def fun(tt, yy, tp=tp):
            d = ckt.Dm @ zof(tt, yy) if ckt.inj else tp['M'] @ (ckt.Bx @ yy + ckt.bsrc(tt, yy) + tp['bd'])
            for m in ckt.ims:                  # machine states: ψ_R, ω, θ from the stator currents
                d[m['k0']:m['k0'] + 4] = ckt.im_deriv(m, tt, yy)[0]
            for m in ckt.sms:                  # synchronous machines: ψ_αβ from the port voltages, ω, θ
                d[m['k0']:m['k0'] + 4] = ckt.sm_deriv(m, tt, yy, zof(tt, yy))[0]
            for m in ckt.srms:                 # switched reluctance machines: ψ of each phase, ω, θ
                d[m['k0']:m['k0'] + m['N'] + 2] = ckt.srm_deriv(m, tt, yy, zof(tt, yy))[0]
            for m in ckt.gens:                 # generators (4.3): port fluxes, angles and speeds of the masses
                d[m['k0']:m['k0'] + m['N'] + 2 * m['sh']['N']] = ckt.gen_deriv(m, tt, yy, zof(tt, yy))
            for i in ckt.iDE:                  # volt–time gaps: dD/dt = (|v| − U₀)^k above U₀, while open
                e = ckt.els[i]
                q = e['gap']['de']
                if ckt.on[i]:
                    d[e['kD']] = 0.0
                else:
                    zz = zof(tt, yy)
                    u = abs((zz[e['a']] if e['a'] >= 0 else 0) - (zz[e['b']] if e['b'] >= 0 else 0)) - q['U0']
                    d[e['kD']] = u ** q['k'] if u > 0 else 0.0
            return d
        events, owners = [], []
        for i in ckt.iD:
            e = ckt.els[i]
            a, b = e['a'], e['b']
            if ckt.on[i]:
                def ev(tt, yy, a=a, b=b, e=e):
                    zz = zof(tt, yy)
                    return ((zz[a] if a >= 0 else 0) - (zz[b] if b >= 0 else 0) - e['Vf']) / e['Ron'] + itol
                ev.direction = -1
            elif ckt.may_turn_on(i):
                def ev(tt, yy, a=a, b=b, e=e):
                    zz = zof(tt, yy)
                    return (zz[a] if a >= 0 else 0) - (zz[b] if b >= 0 else 0) - e['Vf'] - vtol
                ev.direction = 1
            else:
                continue
            ev.terminal = True
            events.append(ev)
            owners.append(i)
        for i in ckt.iSG:               # spark gaps: |v| up through U_b, or the current down through zero (or I_ext) after flowing
            e = ckt.els[i]
            gp, a, b = e['gap'], e['a'], e['b']
            vab = lambda tt, yy, a=a, b=b: (lambda zz: (zz[a] if a >= 0 else 0) - (zz[b] if b >= 0 else 0))(zof(tt, yy))
            if ckt.on[i]:
                i0 = ckt.current(i, t, x, z)
                if gp.get('ext') == 'never' or i0 == 0:
                    continue
                sg = 1.0 if i0 > 0 else -1.0
                lim = gp['Iext'] if gp.get('ext') == 'iext' and abs(i0) >= gp['Iext'] else 0.0
                def ev(tt, yy, vab=vab, sg=sg, lim=lim, e=e):
                    return sg * vab(tt, yy) / e['Ron'] - lim
                ev.direction = -1
            elif gp.get('de'):          # volt–time curve: closes when D reaches its constant; D restarts when |v| falls below U₀
                q, kD = gp['de'], e['kD']
                def ev(tt, yy, q=q, kD=kD):
                    return yy[kD] - q['D']
                ev.direction = 1
                def ev0(tt, yy, vab=vab, q=q):
                    return abs(vab(tt, yy)) - q['U0']
                ev0.direction = -1
                ev0.terminal = True
                events.append(ev0)
                owners.append(('de', i))
            else:
                def ev(tt, yy, vab=vab, gp=gp):
                    return abs(vab(tt, yy)) - gp['Ub']
                ev.direction = 1
            ev.terminal = True
            events.append(ev)
            owners.append(i)
        for b in ckt.zc:                # comparator outputs: roots of the crossing function
            def ev(tt, yy, b=b):
                ckt.eval_blocks(tt, yy, zof(tt, yy), 'trial', left=True)
                return b['f1']
            ev.direction = -1 if b['st']['s'] else 1
            ev.terminal = True
            events.append(ev)
            owners.append(b)
        kw = dict(method=method, rtol=rtol, atol=atol, max_step=max_step, events=events or None)
        if implicit and not ckt.iP and not ckt.iN and not ckt.ims and not ckt.sms and not ckt.srms and not ckt.iDE:     # the machines make the system nonlinear: numerical Jacobian
            kw['jac'] = (lambda tt, yy, J=tp['J']: J) if method == 'LSODA' else tp['J']
        sol = solve_ivp(fun, (t, tn), x, **kw)
        stats['segments'] += 1
        stats['nfev'] += int(sol.nfev)
        stats['njev'] += int(sol.njev)
        stats['nlu'] += int(sol.nlu)
        stats['steps'] += max(0, len(sol.t) - 1)
        if sol.status == -1:
            raise BatchError(f'Ο {method} απέτυχε στο t = {t:.6g} s: {sol.message}' + (
                ' Δοκίμασε Radau (πεπλεγμένη, για άκαμπτα κυκλώματα).' if method != 'Radau' else ' Δοκίμασε μικρότερο μέγιστο βήμα ή χαλαρότερα rtol/atol.'))
        for j in range(1, len(sol.t)):
            yy = sol.y[:, j]
            zj = zof(float(sol.t[j]), yy)
            ckt.tl_record(float(sol.t[j]), zj)
            record(float(sol.t[j]), yy, zj)
        t_new = float(sol.t[-1])
        x = sol.y[:, -1].copy()
        if sol.status == 1:
            te = min(float(ts[0]) for ts in sol.t_events if len(ts))
            flip = set()
            for q, ts in enumerate(sol.t_events):
                if len(ts) and abs(float(ts[0]) - te) <= 1e-12 * ckt.base_T + 1e-18:
                    if isinstance(owners[q], dict):
                        flip.add(owners[q]['id'])
                        stats['cmp_events'] += 1
                    elif isinstance(owners[q], tuple):  # a volt–time gap below U₀ again: its effect restarts
                        x[ckt.els[owners[q][1]]['kD']] = 0.0
                    else:
                        ckt.on[owners[q]] = not ckt.on[owners[q]]
                        if owners[q] in ckt.iSG and not ckt.on[owners[q]]:
                            ckt.just_off[owners[q]] = te
                        stats['diode_events'] += 1
            stuck = stuck + 1 if te - t < 1e-12 * ckt.base_T else 0
            if stuck > 60:
                raise BatchError(f'Συνεχείς μεταγωγές χωρίς πρόοδο στο t = {te:.6g} s (chattering).')
            t = te
            for i in ckt.iDE:                   # a gap that conducts starts from zero effect when it opens again
                if ckt.on[i]:
                    x[ckt.els[i]['kD']] = 0.0
            tp, z = ckt.consistent(t, x)
            ckt.eval_blocks(t, x, z, 'commit', flip=flip)
            ckt.tl_record(t, z)
            record(t, x, z)
        else:
            t = tn if abs(t_new - tn) < 1e-9 * ckt.base_T else t_new
            ckt.started = True
            zt = zof(t_new, x)
            ckt.eval_blocks(t, x, zt, 'commit')
            sampled = ckt.sh_sample(t, x, zt)   # t_sample before t_update, as in the browser
            sampled = ckt.eval_blocks(t, x, zt, 'sample')[1] or sampled
            if ckt.sample(t, x, zt) or sampled:
                record(t, x, zt)                # held value / duty step drawn vertically
    ckt.started = True
    wall_s = time.perf_counter() - start
    T = np.array(T)
    cols = [np.array(c) for c in Y]
    keep = _decimate(T, cols, max_points)
    r6 = lambda a: [float(f'{v:.7g}') if math.isfinite(v) else None for v in a]
    return {
        'method': method, 'rtol': rtol, 'atol': atol, 'max_step': max_step, 'auto_step': auto_step,
        't_end': float(T[-1]) if len(T) else 0.0, 'requested_t_end': t_end, 'status': status, 'message': message,
        'stats': {**stats, 'points': int(len(T)), 'returned': int(len(keep)), 'wall_s': round(wall_s, 3),
                  'cap_rs': ckt.cap_rs, 'states': ckt.ns, 'unknowns': ckt.n},
        't': [float(f'{v:.12g}') for v in T[keep]],
        'ch': {k: r6(cols[j][keep]) for j, k in enumerate(keys)},
        'samples': {q['id']: {'t': [float(f'{v:.12g}') for v in q['t']], 'v': r6(q['v'])} for q in ckt.shs},
        'events': {'list': ckt.ev, 'n': ckt.ev_n, 'max': ckt.ev_max},
        'diag': diag + ([{'sev': 'warn', 'grp': 'server', 'id': None, 'key': 'srv:' + status, 'msg': message, 'fix': ''}] if status != 'ok' else []),
    }


def batch_sim(data):
    try:
        return simulate(data)
    except BatchError:
        raise
    except (KeyError, TypeError, IndexError) as e:
        raise BatchError(f'Μη έγκυρο netlist: {e}') from e
