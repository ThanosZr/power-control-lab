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
  V_f) are located as roots inside the segment.

The result is a reference waveform with controlled local error (rtol/atol) to
compare against the browser solver.
"""
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
        self.has_cont = any(b['type'] in ('INT', 'LPF', 'PLL') or (b['type'] == 'EXPR' and '["t"]' in json.dumps(b.get('ast'))) for b in self.blocks)
        self.sv = [0.0] * self.nsig
        self.yb = [0.0] * len(self.blocks)
        self.yo = [[0.0] * len(b.get('outList') or []) for b in self.blocks]
        E = self.els
        self.iL = [i for i, e in enumerate(E) if e['k'] == 'L']
        self.iC = [i for i, e in enumerate(E) if e['k'] == 'C']
        self.iD = [i for i, e in enumerate(E) if e['k'] == 'D']
        self.iS = [i for i, e in enumerate(E) if e['k'] == 'S']
        self.iP = [i for i, e in enumerate(E) if e['k'] == 'CPL']
        self.iG = [i for i, e in enumerate(E) if e['k'] == 'G']
        self.iGs = [i for i in self.iG if E[i].get('sched')]
        self.iV = [i for i, e in enumerate(E) if e['k'] == 'V']
        self.iI = [i for i, e in enumerate(E) if e['k'] == 'I']
        self.iX = [i for i, e in enumerate(E) if e['k'] == 'X']
        self.iGY = [i for i, e in enumerate(E) if e['k'] == 'GY']      # machine gyrators (3.1)
        self.n = size + len(self.iC)
        self.crow = {ci: size + j for j, ci in enumerate(self.iC)}
        self.ns = len(self.iL) + len(self.iC)
        self.on = {i: False for i in self.iD + self.iS}
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
        for k, i in enumerate(self.iL):
            e = E[i]
            if e['a'] >= 0:
                self.Bx[e['a'], k] -= 1
                self.Dm[k, e['a']] += 1 / e['L']
            if e['b'] >= 0:
                self.Bx[e['b'], k] += 1
                self.Dm[k, e['b']] -= 1 / e['L']
        for j, i in enumerate(self.iC):
            r = self.crow[i]
            self.Bx[r, len(self.iL) + j] = 1
            self.Dm[len(self.iL) + j, r] = 1 / E[i]['C']
        self.Bc = np.zeros((n, len(self.iP)))
        self.Cv = np.zeros((len(self.iP), n))
        for q, i in enumerate(self.iP):
            e = E[i]
            if e['a'] >= 0:
                self.Bc[e['a'], q] -= 1
                self.Cv[q, e['a']] += 1
            if e['b'] >= 0:
                self.Bc[e['b'], q] += 1
                self.Cv[q, e['b']] -= 1
        self.x0 = np.array([_f(E[i].get('i')) for i in self.iL] + [_f(E[i].get('v')) for i in self.iC])
        if ns == 0:     # purely resistive circuit (e.g. diode rectifier into R, E): a dummy
            self.ns = 1  # constant state lets the ODE solver march in time and find events
            self.Bx, self.Dm, self.x0 = np.zeros((n, 1)), np.zeros((1, n)), np.zeros(1)
        clk = next((b for b in self.blocks if b['type'] in ('CLK', 'RAMP')), None)
        self.base_T = min([k.T for k in self.ctrls], default=None) or (1 / max(_f(clk.get('f'), 1e5), 1e-6) if clk else None) or next(
            (1 / max(1e-6, _f(E[i]['src'].get('f'), 50)) for i in self.iV if E[i]['src'].get('kind') == 'ac'), 1e-3)
        self._z = None
        self._yb = []
        self._yo = []
        self.started = False

    # ------------------------------------------------------------ sources
    def R(self, e, t):
        return max(sched_at(e.get('sched'), t, e['R']), 1e-9)

    def Vsrc(self, e, t):
        n = e.get('sigIn')
        if isinstance(n, int) and n >= 0:     # a voltage source controlled by a signal (e.g. OCV(SOC))
            return self.sig_in(n)
        s = e['src']
        if s.get('kind') == 'dc':
            return sched_at(s.get('sched'), t, _f(s.get('V')))
        return _f(s.get('off')) + _f(s.get('Vpk')) * math.sin(2 * math.pi * _f(s.get('f')) * t + _f(s.get('ph')))

    def topo(self, t):
        key = (tuple(self.on[i] for i in self.iD + self.iS), tuple(self.R(self.els[i], t) for i in self.iGs), self.cap_rs)
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
        return {'Ainv': Ainv, 'M': M, 'J': M @ self.Bx, 'bd': bd, 'Z1': Ainv @ self.Bc if self.iP else None}

    def bsrc(self, t):
        b = np.zeros(self.n)
        E = self.els
        for i in self.iV:
            b[E[i]['row']] = self.Vsrc(E[i], t)
        for i in self.iI:
            e = E[i]
            n = e.get('sigIn')
            I = self.sig_in(n) if isinstance(n, int) and n >= 0 else sched_at(e.get('sched'), t, _f(e.get('I')))
            if e['a'] >= 0:
                b[e['a']] += I
            if e['b'] >= 0:
                b[e['b']] -= I
        return b

    def solve_z(self, t, x, tp):
        b = self.Bx @ x + self.bsrc(t) + tp['bd']
        z0 = tp['Ainv'] @ b
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
        nl = len(self.iL)
        iscale = float(np.max(np.abs(x[:nl]))) if nl else 0.0
        vscale = float(np.max(np.abs(x[nl:]))) if len(x) > nl else 0.0
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
            if not bad:
                return tp, z
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
            return float(sum(c * self.current(i, t, x, z) for i, c in rec['i']))
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

    def current(self, i, t, x, z):
        e = self.els[i]
        k = e['k']
        V = lambda nd: z[nd] if nd is not None and nd >= 0 else 0.0
        if k == 'L':
            return float(x[self.iL.index(i)])
        if k == 'C':
            return float(z[self.crow[i]])
        if k == 'V':
            return float(-z[e['row']])
        if k in ('X', 'GY'):
            return float(z[e['row']])
        if k == 'I':
            return sched_at(e.get('sched'), t, _f(e.get('I')))
        if k == 'CPL':
            return float(self.icpl[self.iP.index(i)])
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
        for b in pend:                  # z⁻¹ stores its input; PI back-calculation: dx_i/dt = K_i·(e + tr/K_p)
            if b['type'] == 'PIB':
                b['st']['xi'] += b['st']['kt'] * rd(b['ins'].get('tr'))
            else:
                b['st']['mem'] = rd(b['ins'].get('u'))
        for b, v in cont:
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
            elif ty in ('PIB', 'UD', 'PY'):
                ts = self.sh_next(b, t)
                if t + eps < ts < tn:
                    tn = ts
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
        tn = self.block_events(t, tn, eps)
        if self.has_cont:               # continuous blocks are integrated at segment ends, as the browser does at its steps
            tn = min(tn, t + self.base_T / 200)
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
    # default step limit: diode events inside a long smooth segment (AC sources)
    # must not be stepped over, and the reference trace needs enough points
    auto_step = max_step <= 0
    if auto_step:
        max_step = ckt.base_T / (50 if ckt.ctrls else 200)
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
    ckt.sh_sample(0.0, x, z)
    ckt.eval_blocks(0.0, x, z, 'sample', force=True)
    ckt.sample(0.0, x, z, force=True)
    record(t, x, z)
    stuck = 0
    implicit = method in IMPLICIT
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
        if (tuple(ckt.on.values()), tuple(ckt.gon.values())) != before:
            ckt.eval_blocks(t, x, z, 'commit')
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
            if ckt.iP:
                return ckt.Dm @ zof(tt, yy)
            return tp['M'] @ (ckt.Bx @ yy + ckt.bsrc(tt) + tp['bd'])
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
        for b in ckt.zc:                # comparator outputs: roots of the crossing function
            def ev(tt, yy, b=b):
                ckt.eval_blocks(tt, yy, zof(tt, yy), 'trial', left=True)
                return b['f1']
            ev.direction = -1 if b['st']['s'] else 1
            ev.terminal = True
            events.append(ev)
            owners.append(b)
        kw = dict(method=method, rtol=rtol, atol=atol, max_step=max_step, events=events or None)
        if implicit and not ckt.iP:
            kw['jac'] = (lambda tt, yy, J=tp['J']: J) if method == 'LSODA' else tp['J']
        sol = solve_ivp(fun, (t, tn), x, **kw)
        stats['segments'] += 1
        stats['nfev'] += int(sol.nfev)
        stats['njev'] += int(sol.njev)
        stats['nlu'] += int(sol.nlu)
        stats['steps'] += max(0, len(sol.t) - 1)
        if sol.status == -1:
            raise BatchError(f'Ο {method} απέτυχε στο t = {t:.6g} s: {sol.message}')
        for j in range(1, len(sol.t)):
            yy = sol.y[:, j]
            record(float(sol.t[j]), yy, zof(float(sol.t[j]), yy))
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
                    else:
                        ckt.on[owners[q]] = not ckt.on[owners[q]]
                        stats['diode_events'] += 1
            stuck = stuck + 1 if te - t < 1e-12 * ckt.base_T else 0
            if stuck > 60:
                raise BatchError(f'Συνεχείς μεταγωγές χωρίς πρόοδο στο t = {te:.6g} s (chattering).')
            t = te
            tp, z = ckt.consistent(t, x)
            ckt.eval_blocks(t, x, z, 'commit', flip=flip)
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
    }


def batch_sim(data):
    try:
        return simulate(data)
    except BatchError:
        raise
    except (KeyError, TypeError, IndexError) as e:
        raise BatchError(f'Μη έγκυρο netlist: {e}') from e
