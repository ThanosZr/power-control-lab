"""The numerical core of RMS dynamics and of small-signal stability (4.23, ROADMAP §71, THEORY §8ΩΔ). Experimental.

The network is algebraic, in phasors (Y·V = I); the machines and their controls are differential: a semi-explicit DAE
    x' = f(x, y, t),   0 = g(x, y, t),   y = (V_r, V_i) of every bus.
g is the balance of currents at each bus: the currents the devices inject, less Y_aug·V, with the loads of constant
impedance in Y_aug. The step is milliseconds, not microseconds: large networks and tens of seconds.

What is here (the core, in a separate step from the models and the tutorials):
* the start from a load flow (pcl.powerflow): every device begins with all its derivatives zero, and a run without a
  disturbance does not move (System.init, System.simulate without events);
* the integration of the DAE: the trapezoidal rule with the network and the dynamics solved together (Newton on the whole
  system, the reference), and the alternating solution (the network for given states, the states for given voltages,
  repeated to convergence); a fixed step or a variable one with an estimate of the local error; events (fault, clearing,
  opening of a branch, change of a load) as discontinuities of the algebraic variables, with a consistent new start of
  y and a new factorization;
* the Jacobian with a fixed pattern (that of the network with every branch, the devices on their buses), its values by
  differentiation with a complex step on the variables of each device (exact to rounding), and the sparse LU kept while
  Newton converges (refactorized when it slows, after an event or a new step);
* many disturbances as a batch (System.batch) and the critical clearing time by bisection (System.cct);
* the eigenvalues: the state matrix A = f_x − f_y·g_y⁻¹·g_x, the whole spectrum with QR for small systems, and a few
  eigenvalues near a frequency with the Arnoldi method with shift and invert on the augmented pencil (J − σE)⁻¹E, without
  forming A, for large ones; frequency, damping ratio, participation factors, mode shape.

The devices (enough for the core and its checks; the full library is the next step): the classical machine (E′ behind
X′_d), the two-axis machine (E′_q, E′_d, constant E_fd and P_m), a source behind an impedance (an infinite bus), loads of
constant impedance, current or power (ZIP). Our own formulation from the standard equations (THEORY §8ΩΔ for the
references). An element of the network without an RMS model is refused by name, never left out silently.
"""
import bisect
import cmath
import math
import time

import numpy as np
import scipy.sparse as sp
import scipy.sparse.linalg as spla

CS = 1e-30                     # the complex step


class RMSError(ValueError):
    pass


# ---------------------------------------------------------------- devices (vectorized over the members of a kind)
class Kind:
    """Devices of one kind. Each member has nx states on one bus. eval(X, Vr, Vi, t) → (F, Ir, Ii): the derivatives of
    the states and the current injected into the bus, for all members at once, in arithmetic that a complex step goes
    through (so the local Jacobian is exact to rounding)."""
    nx = 0
    states = ()

    def __init__(self, names, bus, p):
        self.names, self.bus, self.p = list(names), np.asarray(bus, int), p
        self.m = len(self.names)
        self.x0 = 0                                   # offset in the global state vector

    def eval(self, X, Vr, Vi, t):
        raise NotImplementedError


class Classical(Kind):
    """The classical machine: a constant E′ behind X′_d (and R_a), the swing equation. States δ (rad), ω (pu)."""
    nx, states = 2, ('delta', 'omega')

    def init(self, V, S, wb):
        p = self.p
        I = np.conj(S / V)
        E = V + (p['Ra'] + 1j * p['Xdp']) * I
        p['E'], p['Pm'], p['wb'] = np.abs(E), (E * np.conj(I)).real, wb
        return np.c_[np.angle(E), np.ones(self.m)]

    def eval(self, X, Vr, Vi, t):
        p = self.p
        d, w = X[:, 0], X[:, 1]
        Er, Ei = p['E'] * np.cos(d), p['E'] * np.sin(d)
        z = p['Ra'] ** 2 + p['Xdp'] ** 2
        ar, ai = Er - Vr, Ei - Vi                     # I = (E − V)/(R + jX′)
        Ir = (ar * p['Ra'] + ai * p['Xdp']) / z
        Ii = (ai * p['Ra'] - ar * p['Xdp']) / z
        Pe = Er * Ir + Ei * Ii
        F = np.empty_like(X)
        F[:, 0] = p['wb'] * (w - 1.0)
        F[:, 1] = (p['Pm'] - Pe - p['D'] * (w - 1.0)) / (2.0 * p['H'])
        return F, Ir, Ii

    def power(self, X, Vr, Vi):
        _, Ir, Ii = self.eval(X, Vr, Vi, 0.0)
        return Vr * Ir + Vi * Ii


class TwoAxis(Kind):
    """The two-axis machine: E′_q and E′_d behind X′_d, X′_q (and R_a), constant E_fd and P_m. States δ, ω, E′_q, E′_d.
    The q axis at δ; V_d + jV_q = V·e^(−j(δ − π/2)). Where T′_q0 = 0 there is no q winding: X′_q = X_q and E′_d = 0."""
    nx, states = 4, ('delta', 'omega', 'eq', 'ed')

    def init(self, V, S, wb):
        p = self.p
        noq = p['Tq0p'] <= 0
        p['Xqp'] = np.where(noq, p['Xq'], p['Xqp'])
        I = np.conj(S / V)
        d = np.angle(V + (p['Ra'] + 1j * p['Xq']) * I)
        rot = np.exp(-1j * (d - np.pi / 2))
        v, i = V * rot, I * rot
        Vd, Vq, Id, Iq = v.real, v.imag, i.real, i.imag
        ed = (p['Xq'] - p['Xqp']) * Iq
        eq = Vq + p['Ra'] * Iq + p['Xdp'] * Id
        p['Efd'] = eq + (p['Xd'] - p['Xdp']) * Id
        p['Pm'] = ed * Id + eq * Iq + (p['Xqp'] - p['Xdp']) * Id * Iq   # the air-gap torque at ω = 1
        p['wb'], p['noq'] = wb, noq
        return np.c_[d, np.ones(self.m), eq, ed]

    def currents(self, X, Vr, Vi):
        p = self.p
        d, eq, ed = X[:, 0], X[:, 2], X[:, 3]
        c, s = np.cos(d - np.pi / 2), np.sin(d - np.pi / 2)
        Vd, Vq = Vr * c + Vi * s, -Vr * s + Vi * c
        # E′_d − V_d − R I_d + X′_q I_q = 0,  E′_q − V_q − R I_q − X′_d I_d = 0
        R, xd, xq = p['Ra'], p['Xdp'], p['Xqp']
        a, b = ed - Vd, eq - Vq
        det = R * R + xd * xq                         # [[R, −X′_q], [X′_d, R]]·[I_d, I_q] = [a, b]
        Id = (R * a + xq * b) / det
        Iq = (R * b - xd * a) / det
        return c, s, Vd, Vq, Id, Iq

    def eval(self, X, Vr, Vi, t):
        p = self.p
        w, eq, ed = X[:, 1], X[:, 2], X[:, 3]
        c, s, Vd, Vq, Id, Iq = self.currents(X, Vr, Vi)
        Ir, Ii = Id * c - Iq * s, Id * s + Iq * c
        Te = ed * Id + eq * Iq + (p['Xqp'] - p['Xdp']) * Id * Iq
        F = np.empty_like(X)
        F[:, 0] = p['wb'] * (w - 1.0)
        F[:, 1] = (p['Pm'] - Te - p['D'] * (w - 1.0)) / (2.0 * p['H'])
        F[:, 2] = (p['Efd'] - eq - (p['Xd'] - p['Xdp']) * Id) / p['Td0p']
        Tq = np.where(p['noq'], 1.0, p['Tq0p'])
        F[:, 3] = np.where(p['noq'], 0.0 * ed, (-ed + (p['Xq'] - p['Xqp']) * Iq) / Tq)
        return F, Ir, Ii

    def power(self, X, Vr, Vi):
        _, Ir, Ii = self.eval(X, Vr, Vi, 0.0)
        return Vr * Ir + Vi * Ii


class Source(Kind):
    """A constant voltage behind an impedance (an infinite bus with its Thévenin impedance). No states."""
    nx, states = 0, ()

    def init(self, V, S, wb):
        p = self.p
        I = np.conj(S / V)
        p['E'] = V + (p['R'] + 1j * p['X']) * I
        return np.zeros((self.m, 0))

    def eval(self, X, Vr, Vi, t):
        p = self.p
        z = p['R'] ** 2 + p['X'] ** 2
        ar, ai = p['E'].real - Vr, p['E'].imag - Vi
        return np.zeros((len(Vr), 0), dtype=np.result_type(Vr, float)), (ar * p['R'] + ai * p['X']) / z, (ai * p['R'] - ar * p['X']) / z


class ZIPLoad(Kind):
    """A load of constant current and constant power (the constant impedance part goes into Y_aug), from the voltage of
    the start: S(V) = S_i·|V|/|V_0| + S_p, as an injection −conj(S/V). Below V_min the constant power part is taken as
    an impedance (so that a fault does not ask for infinite currents)."""
    nx, states = 0, ()

    def init(self, V, S, wb):
        self.p['V0'] = np.abs(V)
        return np.zeros((self.m, 0))

    def eval(self, X, Vr, Vi, t):
        p = self.p
        v2 = Vr * Vr + Vi * Vi
        v = np.sqrt(v2)
        vmin = p['Vmin']
        Sp = p['Sp'] * np.where(v.real < vmin, v2 / vmin ** 2, 1.0)
        S = p['Si'] * v / p['V0'] + Sp
        # I = conj(S / V) injected with a minus: −(P − jQ)(Vr + jVi)/|V|²
        Ir = -(S.real * Vr + S.imag * Vi) / v2
        Ii = -(S.real * Vi - S.imag * Vr) / v2
        return np.zeros((len(Vr), 0), dtype=Ir.dtype), Ir, Ii


class ExpLoad(Kind):
    """5.0.13: a load with exponential voltage dependence, P = P₀·(|V|/|V₀|)^a, Q = Q₀·(|V|/|V₀|)^b, as an injection
    −conj(S/V). a = b = 2 is a constant impedance, 1 a constant current, 0 a constant power. Below V_min it is taken as an
    impedance from there (S·(|V|/V_min)² with S at V_min), as the constant power of ZIPLoad."""
    nx, states = 0, ()

    def init(self, V, S, wb):
        self.p['V0'] = np.abs(V)
        return np.zeros((self.m, 0))

    def eval(self, X, Vr, Vi, t):
        p = self.p
        v2 = Vr * Vr + Vi * Vi
        v = np.sqrt(v2)
        vmin = p['Vmin']
        low = v.real < vmin
        vv = np.where(low, vmin + 0 * v, v) / p['V0']
        sc = np.where(low, v2 / vmin ** 2, 1.0 + 0 * v)
        P = p['P0'] * vv ** p['a'] * sc
        Q = p['Q0'] * vv ** p['b'] * sc
        Ir = -(P * Vr + Q * Vi) / v2
        Ii = -(P * Vi - Q * Vr) / v2
        return np.zeros((len(Vr), 0), dtype=Ir.dtype), Ir, Ii


# ---------------------------------------------------------------- 5.0.13: the library of models (ROADMAP §101 step 1)
# The blocks of the controls, vectorized over the members of a Unit and in arithmetic that a complex step goes through.
# Each takes its state(s) and input, returns (output, derivative(s)); a time constant 0 makes the block a gain and its
# state stays at 0. The controls are written as deviations from the start (every state of a control starts at 0), as
# the blocks of the EMT (web/studio/netlib.js ctlKit, avrDef, pssDef, govDef), so that the two are the same models.
def _re(u):
    return u.real if np.iscomplexobj(u) else u


def _clip(u, lo, hi):
    r = _re(u)
    return np.where(r < lo, lo + 0 * u, np.where(r > hi, hi + 0 * u, u))


def _lag(x, u, T):
    """1/(1 + sT): out = x, x′ = (u − x)/T; T = 0: out = u."""
    pos = T > 0
    Ts = np.where(pos, T, 1.0)
    return np.where(pos, x, u), np.where(pos, (u - x) / Ts, 0 * x)


def _leadlag(x, u, Tn, Td):
    """(1 + sT_n)/(1 + sT_d) = T_n/T_d + (1 − T_n/T_d)/(1 + sT_d), the lag on u; T_d = 0: a gain of 1."""
    pos = Td > 0
    Ts = np.where(pos, Td, 1.0)
    a = Tn / Ts
    return np.where(pos, a * u + (1 - a) * x, u), np.where(pos, (u - x) / Ts, 0 * x)


def _wash(x, u, T, K):
    """K·sT/(1 + sT) as K·(u − lag(u)) (T = 0: output 0, as the EMT)."""
    l, dx = _lag(x, u, T)
    return K * (u - l), dx


def _held(tot, rr, lo, hi):
    """At a limit and pushing outwards (the hold of a limit without windup)."""
    return ((tot >= hi) & (rr > 0)) | ((tot <= lo) & (rr < 0))


def _nwlag(x, u, base, K, T, lo, hi, hold=_held):
    """K/(1 + sT) whose total base + x stays within [lo, hi] without windup: the derivative is 0 at a limit while it
    pushes outwards (the nwLag of the EMT); T = 0: clip(base + K·u) − base. hold: Unit._hold inside a step (5.0.13)."""
    pos = T > 0
    Ts = np.where(pos, T, 1.0)
    r = (K * u - x) / Ts
    held = hold(_re(base + x), _re(r), lo, hi)
    out = np.where(pos, _clip(base + x, lo, hi) - base, _clip(base + K * u, lo, hi) - base)
    return out, np.where(pos & ~held, r, 0 * x)


# 5.0.16: the tree of an expression block of the drawing (web/studio/expr.js, as engine/batch.py eval_ast reads it), in an
# arithmetic that a complex step goes through: the comparisons, the conditions, min and max on the real parts, the functions
# of numpy on complex numbers (atan2, floor, ceil, round, sign and mod on the real parts: their derivative is 0 or none)
def _cmp(a, b, op):
    a, b = np.real(a), np.real(b)
    return float({'<': a < b, '>': a > b, '<=': a <= b, '>=': a >= b, '==': a == b, '!=': a != b}[op])


def _lut_c(x, p):
    n = len(p) // 2
    xr = np.real(x)
    if xr <= p[0]:
        return p[1] + 0 * x
    for k in range(1, n):
        if xr <= p[2 * k]:
            x0, y0, x1, y1 = p[2 * k - 2], p[2 * k - 1], p[2 * k], p[2 * k + 1]
            return y0 + (y1 - y0) * (x - x0) / (x1 - x0) if np.real(x1) > np.real(x0) else y1 + 0 * x
    return p[2 * n - 1] + 0 * x


_CFUN = {'sin': np.sin, 'cos': np.cos, 'tan': np.tan, 'asin': np.arcsin, 'acos': np.arccos, 'atan': np.arctan,
         'atan2': lambda a, b: math.atan2(np.real(a), np.real(b)), 'sinh': np.sinh, 'cosh': np.cosh, 'tanh': np.tanh, 'exp': np.exp,
         'log': np.log, 'log10': np.log10, 'sqrt': np.sqrt, 'abs': lambda a: a if np.real(a) >= 0 else -a,
         'min': lambda *a: min(a, key=np.real), 'max': lambda *a: max(a, key=np.real), 'pow': lambda a, b: a ** b,
         'floor': lambda a: math.floor(np.real(a)), 'ceil': lambda a: math.ceil(np.real(a)), 'round': lambda a: math.floor(np.real(a) + .5),
         'sign': lambda a: float((np.real(a) > 0) - (np.real(a) < 0)), 'hypot': lambda a, b: np.sqrt(a * a + b * b),
         'clamp': lambda x, a, b: min(max((x, a), key=np.real), b, key=np.real),
         'mod': lambda a, b: a - b * math.floor(np.real(a) / np.real(b)), 'lut': lambda x, *q: _lut_c(x, q)}


def _expr(n, v, t):
    """The value of the tree n of an expression with the inputs and parameters v (in the order of the block) at the time t."""
    k = n[0]
    if k == 'num':
        return n[1]
    if k == 'var':
        return v[n[1]]
    if k == 't':
        return t
    if k == 'un':
        a = _expr(n[2], v, t)
        return -a if n[1] == '-' else (0.0 if np.real(a) else 1.0)
    if k == 'if':
        return _expr(n[2], v, t) if np.real(_expr(n[1], v, t)) else _expr(n[3], v, t)
    if k == 'call':
        return _CFUN[n[1]](*[_expr(a, v, t) for a in n[2]])
    op, a, b = n[1], _expr(n[2], v, t), _expr(n[3], v, t)
    if op == '+':
        return a + b
    if op == '-':
        return a - b
    if op == '*':
        return a * b
    if op == '/':
        return a / b if np.real(b) or np.imag(b) else (math.copysign(math.inf, np.real(a)) if np.real(a) else math.nan)
    if op == '%':
        return a - b * math.floor(np.real(a) / np.real(b))
    if op == '^':
        return a ** b
    if op == '&&':
        return float(bool(np.real(a)) and bool(np.real(b)))
    if op == '||':
        return float(bool(np.real(a)) or bool(np.real(b)))
    return _cmp(a, b, op)


def _tbreaks(n, out=None):
    """5.0.16: the times at which an expression compares t with a number (t < 1, 0.3 >= t): its jumps in time."""
    out = set() if out is None else out
    if isinstance(n, list) and n:
        if n[0] == 'bin' and n[1] in ('<', '>', '<=', '>=', '==', '!='):
            a, b = n[2], n[3]
            if a == ['t'] and isinstance(b, list) and b[0] == 'num':
                out.add(float(b[1]))
            elif b == ['t'] and isinstance(a, list) and a[0] == 'num':
                out.add(float(a[1]))
        for q in n[1:]:
            if isinstance(q, list):
                _tbreaks(q, out)
    return out


def _num(d, k, default):
    v = d.get(k, default)
    if v is None or (isinstance(v, str) and v.strip() == ''):
        return default
    return float(v)


def _sat_ab(s1, s2):
    """The exponential saturation S(V) = A_G·e^(B_G·(V − 0,8)) of Power System Control and Stability (§5.10 (5.83)–(5.87),
    App. D (D.6)–(D.10)) from the saturation factors s1 = S_G1,0 and s2 = S_G1,2 of a machine: S(1,0) = s1 and S(1,2) = 1,2·s2,
    the field current needed above the air-gap line at V (in units of the field current of 1 pu on that line):
    A_G = s1²/(1,2·s2), B_G = 5·ln(1,2·s2/s1)."""
    if s1 <= 0 or s2 <= 0:
        return 0.0, 0.0
    return s1 * s1 / (1.2 * s2), 5.0 * math.log(1.2 * s2 / s1)


# The defaults of the controls: those of the AVR, PSS and GOV elements of the EMT (netlib.js), so that a drawing and its
# RMS model have the same controls. ST1A and DC1A of the excitation, the stabilizer on the speed deviation, the
# governor and turbine for steam (tandem-compound, single reheat) or water (nonlinear turbine, inelastic water column).
AVR_DEFAULTS = {
    'st1a': {'TR': 0.0, 'TC': 0.0, 'TB': 0.0, 'TC1': 0.0, 'TB1': 0.0, 'KA': 200.0, 'TA': 0.0, 'VAMIN': -math.inf,
             'VAMAX': math.inf, 'VIMIN': -math.inf, 'VIMAX': math.inf, 'VRMIN': -6.4, 'VRMAX': 7.0, 'KC': 0.0,
             'KLR': 0.0, 'ILR': 4.4, 'KF': 0.0, 'TF': 1.0},
    'dc1a': {'TR': 0.0, 'TC': 0.0, 'TB': 0.0, 'TC1': 0.0, 'TB1': 0.0, 'KA': 187.0, 'TA': 0.89, 'VRMIN': -1.7,
             'VRMAX': 1.7, 'VIMIN': -math.inf, 'VIMAX': math.inf, 'KE': None, 'TE': 1.15, 'AEX': 0.014, 'BEX': 1.55,
             'KF': 0.058, 'TF': 0.62,
             # 5.1: the saturation of the exciter as IEEE Std 421.5 gives it, by two points (E1, SE(E1)), (E2, SE(E2)) of
             # S_E(E_FD) (Annex C, (C.3)), fitted here as S_E = A·e^(B·E) through them (the standard leaves the curve to the
             # program); and VXEXP = 1 for V_X = A_EX·e^(B_EX·E_FD) itself, the form of (8.21) of Power System Stability and
             # Control, whose sample data A_EX, B_EX are given for it (0: V_X = E_FD·A_EX·e^(B_EX·E_FD), as before)
             'E1': None, 'SE1': None, 'E2': None, 'SE2': None, 'VXEXP': 0.0},
    # 5.1: the AC1A of IEEE Std 421.5-2016 (§7.2–7.3, Fig. 8 and 9: the alternator-rectifier exciter with non-controlled
    # rectifiers, the demagnetizing K_D·I_FD, the rectifier regulation F_EX(I_N) of Annex D, the rate feedback from V_FE);
    # the defaults are the sample data of its Annex H (Table H.8, for AC1C; V_Emin = 0, V_FEmax = ∞ make it the AC1A)
    'ac1a': {'TR': 0.0, 'TC': 0.0, 'TB': 0.0, 'TC1': 0.0, 'TB1': 0.0, 'KA': 400.0, 'TA': 0.02, 'VAMIN': -14.5, 'VAMAX': 14.5,
             'VRMIN': -5.43, 'VRMAX': 6.03, 'VIMIN': -math.inf, 'VIMAX': math.inf, 'KE': 1.0, 'TE': 0.8, 'KC': 0.2, 'KD': 0.38,
             'KF': 0.03, 'TF': 1.0, 'AEX': 0.0, 'BEX': 0.0, 'E1': 4.18, 'SE1': 0.10, 'E2': 3.14, 'SE2': 0.03, 'VXEXP': 0.0,
             'VEMIN': 0.0},
}
PSS_DEFAULTS = {'KS': 20.0, 'TW': 1.4, 'T1': 0.154, 'T2': 0.033, 'T3': 0.0, 'T4': 0.0, 'VSMIN': -0.1, 'VSMAX': 0.1}
# 5.1: the stabilizers of IEEE Std 421.5-2016 (§9.2 Fig. 31, §9.4–9.5 Fig. 32). PSS1A: the input (INPUT 1: the speed
# deviation, 2: the electrical power on the rating of the machine) through 1/(1 + sT6), K_S, sT5/(1 + sT5), 1/(1 + A1·s + A2·s²)
# and two lead-lags, within [V_STmin, V_STmax]; the defaults are those of the PSS above with T6 = A1 = A2 = 0 (the same
# stabilizer). PSS2B: speed and electrical power, two washouts on each (T_W4 = 0: the second on the power bypassed), the
# integral of the electrical power K_S2/(1 + sT7), the ramp-tracking filter [(1 + sT8)/(1 + sT9)^M]^N and three lead-lags; the
# defaults are the sample data of Table H.24 of Annex H (for PSS2C; T10 = T11, the third lead-lag not used), with
# K_S2 = T7/(2H) when not given (its note a).
PSS1A_DEFAULTS = {**PSS_DEFAULTS, 'T6': 0.0, 'A1': 0.0, 'A2': 0.0, 'INPUT': 1.0}
PSS2B_DEFAULTS = {'KS1': 20.0, 'KS2': None, 'KS3': 1.0, 'T6': 0.0, 'T7': 10.0, 'TW1': 10.0, 'TW2': 10.0, 'TW3': 10.0, 'TW4': 0.0,
                  'T8': 0.3, 'T9': 0.15, 'M': 2.0, 'N': 4.0, 'T1': 0.16, 'T2': 0.02, 'T3': 0.16, 'T4': 0.02, 'T10': 0.0,
                  'T11': 0.0, 'VSTMAX': 0.2, 'VSTMIN': -0.066, 'VSI1MAX': 2.0, 'VSI1MIN': -2.0, 'VSI2MAX': 2.0, 'VSI2MIN': -2.0}
PSS_TYPES = ('pss', 'pss1a', 'pss2b')
GOV_DEFAULTS = {
    'steam': {'Pr': 1.0, 'R': 0.05, 'KAX': 149.0, 'V1': 0.02, 'TSR': 0.7, 'TSM': 0.23, 'LC1': 1.0, 'LC2': -3.0,
              'TCH': 0.3, 'TRH': 7.0, 'TCO': 0.5, 'FHP': 0.3, 'FIP': 0.3, 'FLP': 0.4},
    'hydro': {'Pr': 1.0, 'gFL': 0.96, 'gNL': 0.16, 'RP': 0.04, 'RT': 0.4, 'TR': 5.0, 'TP': 0.05, 'KS': 5.0,
              'Rclose': 0.16, 'Ropen': 0.16, 'TG': 0.2, 'Tw': 1.0},
}
SUB_KEYS = ('Xd', 'Xdp', 'Xdpp', 'Xq', 'Xqp', 'Xqpp', 'Xl', 'Td0p', 'Td0pp', 'Tq0p', 'Tq0pp', 'Ra', 'H', 'D', 'SG10', 'SG12')
AVR_STATES = {'st1a': ('avr_tr', 'avr_ll1', 'avr_ll2', 'avr_va', 'avr_rf'),
              'dc1a': ('avr_tr', 'avr_ll1', 'avr_ll2', 'avr_vr', 'avr_efd', 'avr_rf'),
              'ac1a': ('avr_tr', 'avr_ll1', 'avr_ll2', 'avr_va', 'avr_ve', 'avr_rf')}
PSS_STATES = ('pss_w', 'pss_l1', 'pss_l2')


def _pss_states(ps):
    """5.1: the states of a stabilizer: True or 'pss' (PSS_STATES, as before), 'pss1a', or ('pss2b', M, N)."""
    if not ps:
        return ()
    if ps is True or ps == 'pss':
        return PSS_STATES
    if ps == 'pss1a':
        return ('pss_t6', 'pss_w', 'pss_f1', 'pss_f2', 'pss_l1', 'pss_l2')
    _, M, N = ps
    return (('pss_w1', 'pss_w2', 'pss_t6', 'pss_w3', 'pss_w4', 'pss_t7')
            + tuple('pss_r%d_%d' % (i, j) for i in range(N) for j in range(M)) + ('pss_l1', 'pss_l2', 'pss_l3'))


def _exc_sat(E, q):
    """5.1: V_X of a rotating exciter at its output E: E·S_E(E) with S_E = A·e^(B·E) (A, B from the two points of IEEE
    Std 421.5 Annex C or A_EX, B_EX), or A·e^(B·E) itself when VXEXP (the (8.21) of Power System Stability and Control)."""
    a, b = q['SA'], q['SB']
    s = a * np.exp(b * E)
    return np.where(q['VXEXP'] > 0, s, E * s)


def _exc_ab(q):
    """5.1: A, B of S_E = A·e^(B·E) through (E1, SE1), (E2, SE2) where they are given (B = ln(SE1/SE2)/(E1 − E2),
    A = SE1·e^(−B·E1)), else A_EX, B_EX."""
    E1, S1, E2, S2 = (np.asarray(q[k], float) for k in ('E1', 'SE1', 'E2', 'SE2'))
    two = ~np.isnan(E1) & ~np.isnan(E2) & (np.nan_to_num(S1) > 0) & (np.nan_to_num(S2) > 0) & (np.nan_to_num(E1 - E2) != 0)
    with np.errstate(all='ignore'):
        B = np.where(two, np.log(np.where(two, S1 / S2, 1.0)) / np.where(two, E1 - E2, 1.0), q['BEX'])
        A = np.where(two, np.where(two, S1, 0.0) * np.exp(-B * np.where(two, E1, 0.0)), q['AEX'])
    return A, B


def _fex(In):
    """5.1: the rectifier regulation of IEEE Std 421.5 Annex D (Fig. D.2): F_EX(I_N), its three modes, 0 above I_N = 1."""
    r = _re(In)
    return np.where(r <= 0.433, 1 - 0.577 * In,
                    np.where(r < 0.75, np.sqrt(np.where(r < 0.75, 0.75 - In * In, 1.0 + 0 * In)),
                             np.where(r <= 1.0, 1.732 * (1 - In), 0 * In)))


def _ve0(efd, ifd, kc):
    """5.1: the exciter voltage V_E with V_E·F_EX(K_C·I_FD/V_E) = E_FD (the start of the AC1A), mode by mode in closed form:
    1: V_E = E_FD + 0,577·K_C·I_FD; 2: V_E = √((E_FD² + (K_C·I_FD)²)/0,75); 3: V_E = E_FD/1,732 + K_C·I_FD."""
    c = kc * ifd
    v1 = efd + 0.577 * c
    v2 = np.sqrt((efd * efd + c * c) / 0.75)
    v3 = efd / 1.732 + c
    with np.errstate(all='ignore'):
        i1, i2 = np.where(v1 > 0, c / v1, 0.0), np.where(v2 > 0, c / v2, 0.0)
    return np.where(i1 <= 0.433, v1, np.where(i2 < 0.75, v2, v3))
GOV_STATES = {'steam': ('gov_sr', 'gov_cv', 'gov_ch', 'gov_rh', 'gov_co'),
              'hydro': ('gov_g', 'gov_td', 'gov_pv', 'gov_gs', 'gov_u')}


class Unit(Kind):
    """5.0.13: a synchronous machine with its controls, as one device on its bus (the composite model of a generating
    unit). The members of one Unit share the model of the machine and the types of the controls; the parameters are per
    member (arrays). States: δ, ω, E′_q, E′_d, ψ_1d, ψ_2q of the machine, then those of the AVR, the PSS and the
    governor (AVR_STATES, PSS_STATES, GOV_STATES).

    The machine (model 'subtransient', THEORY §8ΩΝ): the voltage behind the subtransient reactance (Power System Control
    and Stability §4.15.2, (4.270)–(4.273), Example 9.10), with a second circuit on the q axis as its Problem 4.33, in the
    axes and signs of the two-axis model of this module (V_d + jV_q = V·e^(−j(δ − π/2))):
        T″_d0·ψ′_1d = −ψ_1d + E′_q − (X′_d − X_l)·I_d
        T′_d0·E′_q′ = E_fd − (1 + K_d)·E′_q + K_d·ψ_1d − X_xd·I_d − E_Δ
        T″_q0·ψ′_2q = −ψ_2q − E′_d − (X′_q − X_l)·I_q
        T′_q0·E′_d′ = −(1 + K_q)·E′_d − K_q·ψ_2q + X_xq·I_q
        E″_q = k_1d·E′_q + (1 − k_1d)·ψ_1d,  E″_d = k_1q·E′_d − (1 − k_1q)·ψ_2q
        E″_d − V_d − R_a·I_d + X″_q·I_q = 0,  E″_q − V_q − R_a·I_q − X″_d·I_d = 0
        T_e = E″_d·I_d + E″_q·I_q + (X″_q − X″_d)·I_d·I_q,  2H·ω′ = T_m − T_e − D·(ω − 1),  δ′ = ω_B·(ω − 1)
    with k_1d = (X″_d − X_l)/(X′_d − X_l), K_d = (X_d − X′_d)(X′_d − X″_d)/(X′_d − X_l)², X_xd = (X_d − X′_d)(X″_d − X_l)/(X′_d
    − X_l) and the same on q. E_Δ = S(|E″|)·E″_q/|E″| is the saturation on the field (§4.15.2 (4.273): the field current
    needed above the air-gap line at the voltage behind the subtransient reactance, _sat_ab), on the d axis only.
    Model 'two_axis': X″ = X′ (no ψ_1d, ψ_2q), the same equations as TwoAxis. No
    circuit where its time constant is 0: T″_d0 = 0 makes X″_d = X′_d; T′_q0 = 0 makes X′_q = X_q (E′_d = 0); T″_q0 = 0
    makes X″_q = X′_q; the states of a missing circuit stay at their start.

    The field current of the controls is E = E_fd − T′_d0·E′_q′ (equal to E_fd at rest, as i_fd of the GEN3 of the EMT).
    A unit tripped by an event (p['on'] = 0) injects nothing and its states stay where they were."""

    def __init__(self, names, bus, p, model='subtransient', avr=None, pss=False, gov=None):
        super().__init__(names, bus, p)
        self.model, self.avr, self.pss, self.gov = model, avr, pss, gov
        self.pss_mn = None
        if isinstance(pss, tuple):                    # 5.1: ('pss2b', M, N): the type, and the order of its ramp-tracking filter
            self.pss, self.pss_mn = pss[0], tuple(pss[1:])
        st = ['delta', 'omega', 'eq', 'ed', 'psi1d', 'psi2q']
        self.i_avr = len(st)
        st += list(AVR_STATES.get(avr, ()))
        self.i_pss = len(st)
        st += list(_pss_states(pss))                  # 5.1: by the type of the stabilizer (PSS_STATES for the PSS of the EMT)
        self.i_gov = len(st)
        st += list(GOV_STATES.get(gov, ()))
        self.states, self.nx = tuple(st), len(st)
        self._fz, self._rec = None, None

    # -------------------------------------------------------------- the limits without windup inside a step
    def _hold(self, key):
        """The hold of the limit `key` without windup: as at the start of the step while the System solves one (_fz, set
        by System._freeze), else from the point itself. A hold decided at each Newton iteration has no solution when the
        limit is reached inside the step (the state lands below the limit when held and above it when not): the iteration
        cycles between the two."""
        def hold(tot, rr, lo, hi):
            h = _held(tot, rr, lo, hi)
            if self._rec is not None:
                self._rec[key] = h
            if self._fz is not None and key in self._fz:
                return self._fz[key]
            return h
        return hold

    def limits(self):
        """[(state index, base, lo, hi, active)] of the states held by a limit without windup."""
        out, q = [], self.p
        if self.avr == 'st1a':
            a = q['avr']
            out.append((self.i_avr + 3, a['e0'], a['VAMIN'], a['VAMAX'], a['TA'] > 0))
        elif self.avr == 'dc1a':
            a = q['avr']
            out.append((self.i_avr + 3, a['VR0'], a['VRMIN'], a['VRMAX'], a['TA'] > 0))
        elif self.avr == 'ac1a':                      # 5.1: V_A within [V_AMIN, V_AMAX], the exciter V_E above V_EMIN
            a = q['avr']
            out.append((self.i_avr + 3, a['VA0'], a['VAMIN'], a['VAMAX'], a['TA'] > 0))
            out.append((self.i_avr + 4, a['VE0'], a['VEMIN'], math.inf, np.ones(self.m, bool)))
        if self.gov:
            g = q['gov']
            base = g['c0'] if self.gov == 'steam' else g['g0']
            out.append((self.i_gov + (1 if self.gov == 'steam' else 0), base, 0.0, 1.0, np.ones(self.m, bool)))
        return out

    # -------------------------------------------------------------- the machine
    def _prep(self):
        p = self.p
        if p.get('_prep'):
            return
        two = self.model == 'two_axis'
        nod2 = two | (p['Td0pp'] <= 0)
        noq1 = p['Tq0p'] <= 0
        p['Xqp'] = np.where(noq1, p['Xq'], p['Xqp'])
        noq2 = two | (p['Tq0pp'] <= 0)
        p['Xdpp'] = np.where(nod2, p['Xdp'], p['Xdpp'])
        p['Xqpp'] = np.where(noq2, p['Xqp'], p['Xqpp'])
        Xl = p['Xl']
        p['k1d'] = (p['Xdpp'] - Xl) / (p['Xdp'] - Xl)
        p['Kd'] = (p['Xd'] - p['Xdp']) * (p['Xdp'] - p['Xdpp']) / (p['Xdp'] - Xl) ** 2
        p['Xxd'] = (p['Xd'] - p['Xdp']) * (p['Xdpp'] - Xl) / (p['Xdp'] - Xl)
        dq = np.where(noq1, 1.0, p['Xqp'] - Xl)
        p['k1q'] = np.where(noq1, 0.0, (p['Xqpp'] - Xl) / dq)
        p['Kq'] = np.where(noq1, 0.0, (p['Xq'] - p['Xqp']) * (p['Xqp'] - p['Xqpp']) / dq ** 2)
        p['Xxq'] = np.where(noq1, 0.0, (p['Xq'] - p['Xqp']) * (p['Xqpp'] - Xl) / dq)
        # with no transient circuit on q (E′_d = 0) the subtransient one alone: E″_d = −(X_q − X″_q)/(X_q − X_l)·ψ_2q
        p['k2q'] = np.where(noq1, (p['Xq'] - p['Xqpp']) / (p['Xq'] - Xl), 1 - p['k1q'])
        p['nod2'], p['noq1'], p['noq2'] = nod2, noq1, noq2
        ag, bg = np.vectorize(_sat_ab)(p['SG10'], p['SG12'])
        p['AG'], p['BG'] = np.atleast_1d(ag).astype(float), np.atleast_1d(bg).astype(float)
        p['_prep'] = True

    def _machine(self, X, Vr, Vi):
        p = self.p
        d, eq, ed, p1, p2 = X[:, 0], X[:, 2], X[:, 3], X[:, 4], X[:, 5]
        c, s = np.cos(d - np.pi / 2), np.sin(d - np.pi / 2)
        Vd, Vq = Vr * c + Vi * s, -Vr * s + Vi * c
        Eqpp = p['k1d'] * eq + (1 - p['k1d']) * p1
        Edpp = p['k1q'] * ed - p['k2q'] * p2
        R, xd, xq = p['Ra'], p['Xdpp'], p['Xqpp']
        a, b = Edpp - Vd, Eqpp - Vq
        det = R * R + xd * xq
        Id = (R * a + xq * b) / det
        Iq = (R * b - xd * a) / det
        Te = Edpp * Id + Eqpp * Iq + (xq - xd) * Id * Iq
        e2 = Edpp * Edpp + Eqpp * Eqpp
        Epp = np.sqrt(e2)
        Ed = np.where(p['AG'] > 0, p['AG'] * np.exp(p['BG'] * (Epp - 0.8)) * Eqpp / Epp, 0 * Eqpp)
        # the field current in the units of E_fd (E_fd at rest)
        Ifd = (1 + p['Kd']) * eq - p['Kd'] * p1 + p['Xxd'] * Id + Ed
        return c, s, Vd, Vq, Id, Iq, Te, Ifd, Eqpp, Edpp

    def _machine_f(self, X, Id, Iq, Ifd, Efd, Tm, Te):
        p = self.p
        w, eq, ed, p1, p2 = X[:, 1], X[:, 2], X[:, 3], X[:, 4], X[:, 5]
        F = np.empty((X.shape[0], 6), dtype=np.result_type(X, Id, Efd, Tm))
        F[:, 0] = p['wb'] * (w - 1.0)
        F[:, 1] = (Tm - Te - p['D'] * (w - 1.0)) / (2.0 * p['H'])
        F[:, 2] = (Efd - Ifd) / p['Td0p']
        Tq1 = np.where(p['noq1'], 1.0, p['Tq0p'])
        F[:, 3] = np.where(p['noq1'], 0 * ed, (-(1 + p['Kq']) * ed - p['Kq'] * p2 + p['Xxq'] * Iq) / Tq1)
        Td2 = np.where(p['nod2'], 1.0, p['Td0pp'])
        F[:, 4] = np.where(p['nod2'], 0 * p1, (-p1 + eq - (p['Xdp'] - p['Xl']) * Id) / Td2)
        Tq2 = np.where(p['noq2'], 1.0, p['Tq0pp'])
        F[:, 5] = np.where(p['noq2'], 0 * p2, (-p2 - ed - (p['Xqp'] - p['Xl']) * Iq) / Tq2)
        return F

    # -------------------------------------------------------------- the controls
    def _pss(self, Z, w, pe=None):
        q, ps = self.p['pss'], self.pss
        u = w - 1.0
        if ps is True or ps == 'pss':
            y, f0 = _wash(Z[:, 0], u, q['TW'], q['KS'])
            y, f1 = _leadlag(Z[:, 1], y, q['T1'], q['T2'])
            y, f2 = _leadlag(Z[:, 2], y, q['T3'], q['T4'])
            return _clip(y, q['VSMIN'], q['VSMAX']), np.c_[f0, f1, f2]
        dp = 0 * u if pe is None else q['kb'] * (pe - q['pe0'])      # the electrical power on the rating of the machine
        if ps == 'pss1a':                             # 5.1: IEEE Std 421.5 PSS1A (Fig. 31)
            vsi = np.where(q['INPUT'] > 1.5, dp, u)
            y, f6 = _lag(Z[:, 0], vsi, q['T6'])
            y, f5 = _wash(Z[:, 1], y, q['TW'], q['KS'])
            # 1/(1 + A1·s + A2·s²): z1′ = z2, A2·z2′ = y − z1 − A1·z2 (A2 = 0: a lag A1 on z1; both 0: a gain of 1)
            a1, a2 = q['A1'], q['A2']
            two, one = a2 > 0, (a2 <= 0) & (a1 > 0)
            z1, z2 = Z[:, 2], Z[:, 3]
            g1 = np.where(two, z2, np.where(one, (y - z1) / np.where(one, a1, 1.0), 0 * z1))
            g2 = np.where(two, (y - z1 - a1 * z2) / np.where(two, a2, 1.0), 0 * z2)
            y = np.where(two | one, z1, y)
            y, f1 = _leadlag(Z[:, 4], y, q['T1'], q['T2'])
            y, f2 = _leadlag(Z[:, 5], y, q['T3'], q['T4'])
            return _clip(y, q['VSMIN'], q['VSMAX']), np.c_[f6, f5, g1, g2, f1, f2]
        M, N = self.pss_mn                            # 5.1: IEEE Std 421.5 PSS2B (Fig. 32 without the fourth lead-lag)
        u1 = _clip(u, q['VSI1MIN'], q['VSI1MAX'])
        u2 = _clip(dp, q['VSI2MIN'], q['VSI2MAX'])
        y1, fw1 = _wash(Z[:, 0], u1, q['TW1'], 1.0)
        y1, fw2 = _wash(Z[:, 1], y1, q['TW2'], 1.0)
        y1, f6 = _lag(Z[:, 2], y1, q['T6'])
        y2, fw3 = _wash(Z[:, 3], u2, q['TW3'], 1.0)
        byp = q['TW4'] <= 0                           # the block bypass logic: T_W4 = 0 leaves the second washout out
        y2b, fw4 = _wash(Z[:, 4], y2, np.where(byp, 1.0, q['TW4']), 1.0)
        y2 = np.where(byp, y2, y2b)
        fw4 = np.where(byp, 0 * fw4, fw4)
        yy, f7 = _lag(Z[:, 5], y2, q['T7'])
        yy = q['KS2'] * yy
        r = y1 + q['KS3'] * yy
        F = [fw1, fw2, f6, fw3, fw4, f7]
        k = 6
        for _i in range(N):                           # [(1 + sT8)/(1 + sT9)^M]^N: a lead-lag, then M − 1 lags, N times
            r, fr = _leadlag(Z[:, k], r, q['T8'], q['T9'])
            F.append(fr)
            k += 1
            for _j in range(M - 1):
                r, fr = _lag(Z[:, k], r, q['T9'])
                F.append(fr)
                k += 1
        y = q['KS1'] * (r - yy)
        y, f1 = _leadlag(Z[:, k], y, q['T1'], q['T2'])
        y, f2 = _leadlag(Z[:, k + 1], y, q['T3'], q['T4'])
        y, f3 = _leadlag(Z[:, k + 2], y, q['T10'], q['T11'])
        return _clip(y, q['VSTMIN'], q['VSTMAX']), np.column_stack(F + [f1, f2, f3])

    def _avr(self, Z, vt, ifd, vs):
        """ST1A or DC1A as the AVR of the EMT (netlib.js avrDef), or the AC1A of IEEE Std 421.5 (5.1, only here), in
        deviations from the start. The rate feedback
        K_F·s/(1 + sT_F) of E_fd − e0 enters the first summing point; its lag is the last state. E_fd is taken from the
        states first (DC1A: the exciter; ST1A: V_A with T_A > 0), so the feedback makes no algebraic loop (ST1A with
        K_F > 0 and T_A = 0 is refused when the system is built)."""
        q, typ = self.p['avr'], self.avr
        e0 = q['e0']
        k = len(AVR_STATES[typ]) - 1
        rf = (q['KF'] > 0) & (q['TF'] > 1e-6)
        tf = np.where(rf, q['TF'], 1.0)
        c, f_tr = _lag(Z[:, 0], vt - q['v0'], q['TR'])

        def st1a_out(dva):
            over = _re(ifd) - q['ILR'] > 0
            e = e0 + dva - np.where(over, q['KLR'] * (ifd - q['ILR']), 0 * ifd)
            lo, hi = vt * q['VRMIN'], vt * q['VRMAX'] - q['KC'] * ifd
            r = _re(e)
            return np.where(r < _re(lo), lo, np.where(r > _re(hi), hi, e))
        if typ == 'st1a':
            efd_s = st1a_out(_clip(e0 + Z[:, 3], q['VAMIN'], q['VAMAX']) - e0)
        elif typ == 'ac1a':                           # 5.1: the rate feedback is from V_FE, a function of the states and I_FD
            ve = q['VE0'] + Z[:, 4]
            vfe = _exc_sat(ve, q) + q['KE'] * ve + q['KD'] * ifd
            efd_s = vfe - q['VFE0'] + e0
        else:
            efd_s = e0 + Z[:, 4]
        fb = np.where(rf, q['KF'] / tf * ((efd_s - e0) - Z[:, k]), 0 * vt)
        err = _clip(q['dV'] - c + vs - fb, q['VIMIN'], q['VIMAX'])
        x, f_l1 = _leadlag(Z[:, 1], err, q['TC'], q['TB'])
        x, f_l2 = _leadlag(Z[:, 2], x, q['TC1'], q['TB1'])
        if typ == 'st1a':
            dva, f_va = _nwlag(Z[:, 3], x, e0, q['KA'], q['TA'], q['VAMIN'], q['VAMAX'], self._hold('va'))
            efd = st1a_out(dva)
            mid = [f_va]
            fbs = efd
        elif typ == 'ac1a':
            # IEEE Std 421.5 AC1A (Fig. 8, 9): V_A = K_A/(1 + sT_A) within [V_AMIN, V_AMAX] without windup, E_FE = V_A within
            # [V_RMIN, V_RMAX], T_E·V_E′ = E_FE − V_FE with V_E ≥ V_EMIN (without windup), E_FD = V_E·F_EX(K_C·I_FD/V_E)
            dva, f_va = _nwlag(Z[:, 3], x, q['VA0'], q['KA'], q['TA'], q['VAMIN'], q['VAMAX'], self._hold('va'))
            efe = _clip(q['VA0'] + dva, q['VRMIN'], q['VRMAX'])
            r = (efe - vfe) / q['TE']
            f_ve = np.where(self._hold('ve')(_re(ve), _re(r), q['VEMIN'], math.inf), 0 * r, r)
            vv = np.where(_re(ve) > 1e-6, ve, 1e-6 + 0 * ve)
            efd = ve * _fex(q['KC'] * ifd / vv)
            mid = [f_va, f_ve]
            fbs = efd_s                               # the feedback signal: V_FE − V_FE0 + e0
        else:
            vr, f_vr = _nwlag(Z[:, 3], x, q['VR0'], q['KA'], q['TA'], q['VRMIN'], q['VRMAX'], self._hold('vr'))
            xe = Z[:, 4]
            a, bb, ke = q['SA'], q['SB'], q['KE']
            selfx = np.isnan(ke)
            kk = np.where(selfx, 0.0, ke)
            loss = np.where(selfx, a * np.exp(bb * (e0 + xe)) - a * np.exp(bb * e0), kk + a * np.exp(bb * (e0 + xe)))
            # 5.1: V_X = A·e^(B·E) itself (VXEXP, (8.21) of the book): the self-excited K_E = −V_X(e0)/e0, so V_R = 0 at rest
            vxe = q['VXEXP'] > 0
            f_e = (q['VR0'] + vr - loss * (e0 + xe)) / q['TE']
            if np.any(vxe):
                E = e0 + xe
                lossx = np.where(selfx, -_exc_sat(e0, q) / np.where(e0 != 0, e0, 1.0) * E, kk * E) + _exc_sat(E, q)
                f_e = np.where(vxe, (q['VR0'] + vr - lossx) / q['TE'], f_e)
            efd = efd_s
            mid = [f_vr, f_e]
            fbs = efd
        f_rf = np.where(rf, ((fbs - e0) - Z[:, k]) / tf, 0 * Z[:, k])
        return efd, np.c_[(f_tr, f_l1, f_l2, *mid, f_rf)]

    def _gov(self, Z, w):
        q, typ = self.p['gov'], self.gov
        pr = q['Pr']
        if typ == 'steam':
            c0 = q['c0']
            kg = np.where(q['R'] > 0, 1 / np.where(q['R'] > 0, q['R'], 1.0), 20.0)
            dw = w - 1.0
            sg = q['dP'] - kg * dw - q['KAX'] * np.where(_re(dw - q['V1']) > 0, dw - q['V1'], 0 * dw)
            sr, f_sr = _lag(Z[:, 0], sg, q['TSR'])
            xc = Z[:, 1]
            rcv = _clip((sr - xc) / q['TSM'], q['LC2'], q['LC1'])
            f_cv = np.where(self._hold('cv')(_re(c0 + xc), _re(rcv), 0.0, 1.0), 0 * rcv, rcv)
            cv = _clip(c0 + xc, 0.0, 1.0)
            ch, f_ch = _lag(Z[:, 2], cv - c0, q['TCH'])
            rh, f_rh = _lag(Z[:, 3], ch, q['TRH'])
            co, f_co = _lag(Z[:, 4], rh, q['TCO'])
            pm = c0 + q['FHP'] * ch + q['FIP'] * rh + q['FLP'] * co
            F = np.c_[f_sr, f_cv, f_ch, f_rh, f_co]
        else:
            g0, At, unl = q['g0'], q['At'], q['unl']
            rp = np.maximum(q['RP'], 1e-6)
            xg = Z[:, 0]
            td, f_td = _wash(Z[:, 1], xg, q['TR'], q['RT'])
            er = rp * q['dP'] / At - (w - 1.0) - rp * xg - td
            pv, f_pv = _lag(Z[:, 2], er, q['TP'])
            rg = _clip(q['KS'] * pv, -q['Rclose'], q['Ropen'])
            f_g = np.where(self._hold('g')(_re(g0 + xg), _re(rg), 0.0, 1.0), 0 * rg, rg)
            gs, f_gs = _lag(Z[:, 3], xg, q['TG'])
            g = _clip(g0 + gs, 0.0, 1.0)
            u0 = g0 * At
            xu = Z[:, 4]
            gg = At * g
            gg = np.where(_re(gg) < 1e-3, 1e-3 + 0 * gg, gg)
            h = ((u0 + xu) / gg) ** 2
            f_u = (1 - h) / np.maximum(q['Tw'], 1e-6)
            pm = (u0 + xu - unl) * h
            F = np.c_[f_g, f_td, f_pv, f_gs, f_u]
        tm = pm * pr / np.where(_re(w) < 0.1, 0.1 + 0 * w, w)
        return tm, F

    # -------------------------------------------------------------- start and evaluation
    def init(self, V, S, wb):
        self._prep()
        p = self.p
        p['wb'] = wb
        I = np.conj(S / V)
        d = np.angle(V + (p['Ra'] + 1j * p['Xq']) * I)
        rot = np.exp(-1j * (d - np.pi / 2))
        v, i = V * rot, I * rot
        Vq, Id, Iq = v.imag, i.real, i.imag
        ed = np.where(p['noq1'], 0.0, (p['Xq'] - p['Xqp']) * Iq)
        eq = Vq + p['Ra'] * Iq + p['Xdp'] * Id
        p1 = eq - (p['Xdp'] - p['Xl']) * Id
        p2 = -ed - (p['Xqp'] - p['Xl']) * Iq
        X = np.zeros((self.m, self.nx))
        X[:, 0], X[:, 1], X[:, 2], X[:, 3], X[:, 4], X[:, 5] = d, 1.0, eq, ed, p1, p2
        _, _, _, _, Id2, Iq2, Te, Ifd, _, _ = self._machine(X, V.real, V.imag)
        p['Efd0'], p['Tm0'] = Ifd.copy(), Te.copy()
        if self.avr:
            q = p['avr']
            q['e0'], q['v0'] = p['Efd0'], np.where(np.isnan(q['Vref']), np.abs(V), q['Vref'])
            if self.avr in ('dc1a', 'ac1a'):
                q['SA'], q['SB'] = _exc_ab(q)
            if self.avr == 'dc1a':
                ke = q['KE']
                q['VR0'] = np.where(q['VXEXP'] > 0, np.where(np.isnan(ke), 0.0, np.where(np.isnan(ke), 0.0, ke) * q['e0'] + _exc_sat(q['e0'], q)),
                                    np.where(np.isnan(ke), 0.0, (np.where(np.isnan(ke), 0.0, ke) + q['SA'] * np.exp(q['SB'] * q['e0'])) * q['e0']))
            elif self.avr == 'ac1a':                  # 5.1: V_E from E_FD and I_FD, then V_FE = E_FE = V_A at rest
                ve = _ve0(q['e0'], Ifd, q['KC'])
                q['VE0'] = ve
                q['VFE0'] = _exc_sat(ve, q) + q['KE'] * ve + q['KD'] * Ifd
                q['VA0'] = q['VFE0'].copy()
        if self.pss and 'pss' in p:
            p['pss']['pe0'] = (V * np.conj(I)).real       # 5.1: the electrical power at the start (system base)
        if self.gov:
            q = p['gov']
            m0 = p['Tm0']
            if self.gov == 'steam':
                q['c0'] = m0 / q['Pr']
            else:
                At = 1 / np.maximum(q['gFL'] - q['gNL'], 1e-6)
                q['At'], q['unl'] = At, At * q['gNL']
                q['g0'] = (m0 / q['Pr'] + q['unl']) / At
        p.setdefault('on', np.ones(self.m))
        return X

    def eval(self, X, Vr, Vi, t):
        p = self.p
        on = p['on']
        c, s, Vd, Vq, Id, Iq, Te, Ifd, _, _ = self._machine(X, Vr, Vi)
        w = X[:, 1]
        F = [None]
        vs = 0 * w
        if self.pss:
            vs, Fp = self._pss(X[:, self.i_pss:self.i_gov], w, Vd * Id + Vq * Iq)
        if self.avr:
            efd, Fa = self._avr(X[:, self.i_avr:self.i_pss], np.sqrt(Vr * Vr + Vi * Vi), Ifd, vs)
            F.append(Fa)
        else:
            efd = p['Efd0'] + 0 * w
        if self.pss:
            F.append(Fp)
        if self.gov:
            tm, Fg = self._gov(X[:, self.i_gov:], w)
            F.append(Fg)
        else:
            tm = p['Tm0'] + 0 * w
        F[0] = self._machine_f(X, Id, Iq, Ifd, efd, tm, Te)
        F = np.concatenate(F, axis=1) * on[:, None]
        return F, (Id * c - Iq * s) * on, (Id * s + Iq * c) * on

    def outputs(self, X, Vr, Vi):
        """The quantities of each member for the results: P, Q, |V|, E_fd, T_m, the field current, I_d, I_q."""
        p = self.p
        c, s, Vd, Vq, Id, Iq, Te, Ifd, _, _ = self._machine(X, Vr, Vi)
        w = X[:, 1]
        vs = self._pss(X[:, self.i_pss:self.i_gov], w, Vd * Id + Vq * Iq)[0] if self.pss else 0 * w
        efd = self._avr(X[:, self.i_avr:self.i_pss], np.sqrt(Vr * Vr + Vi * Vi), Ifd, vs)[0] if self.avr else p['Efd0'] + 0 * w
        tm = self._gov(X[:, self.i_gov:], w)[0] if self.gov else p['Tm0'] + 0 * w
        Ir, Ii = Id * c - Iq * s, Id * s + Iq * c
        return {'P': Vr * Ir + Vi * Ii, 'Q': Vi * Ir - Vr * Ii, 'V': np.sqrt(Vr * Vr + Vi * Vi), 'Efd': efd, 'Tm': tm,
                'Te': Te, 'Ifd': Ifd, 'vs': vs}


# ---------------------------------------------------------------- 5.0.14: the converters (ROADMAP §101 step 2, THEORY §8ΩΞ)
# The phasor models of our EMT averaged converters with their controls: the grid-forming control GFMC (droop, VSM, PSC, the
# direct inner control) and the robust vector current control of the MMCC (the grid-following station, mode P), each as one
# device on the bus of a generator of the network (its injection from the load flow). Per unit on the rating S_n of the
# converter; the network sees I_own·S_n/S_base. Our own formulation from our EMT (THEORY §8ΩΞ); the WECC models wait for
# their sources (ROADMAP §101).
GFM_DEFAULTS = {'mp': 2.0, 'nq': 5.0, 'fp': 5.0, 'H': 2.0, 'tv': 0.01, 'kp': 50.0, 'KE': 5.0, 'TE': 0.05, 'Xc': 0.15, 'Rf': 0.0,
                'Rv': 0.0, 'Xv': 0.0, 'Imax': 1.2, 'ac': 600.0}
GFL_DEFAULTS = {'X': 0.255, 'acc': 4.0, 'bw': 20.0, 'mf': 5.0, 'Tf': 0.05, 'Ilim': 1.1, 'slope': 0.0}
# 5.0.15: the grid-following converter with the control 'pi' of the MMCC (its default in the EMT): the outer integrals of P
# and Q (T_p, T_q, the 5 % response), the inner PI on its reactor X, R (T_i), the limit of i_d
GFL_PI_DEFAULTS = {'Tp': 0.1, 'Tq': 0.1, 'Ti': 0.01, 'R': 0.003, 'Idlim': 1.1}
# the SVC (the IEEE basic models of 1994): our defaults within the ranges of the paper (K_R 20–100 pu, T_R 20–150 ms)
SVC_DEFAULTS = {'basic': 1.0, 'KR': 25.0, 'TR': 0.05, 'T1': 0.0, 'T2': 0.0, 'Tm': 0.0, 'KSL': 0.04, 'KI': 500.0, 'KP': 0.0,
                'TP': 0.0, 'Bmin': -1.0, 'Bmax': 1.0}
# the STATCOM (Fig. 11.68 of the book): our defaults within its ranges (T_C 10–30 ms), ρ 3 %
STATCOM_DEFAULTS = {'K': 150.0, 'rho': 0.03, 'TC': 0.02, 'Tm': 0.0, 'ICmax': 1.0, 'ILmax': 1.0}
STORE_DEFAULTS = {'E': 1.0, 'soc0': 0.5, 'smin': 0.1, 'smax': 0.9}
CONVERTERS = ('gfm', 'gfl', 'statcom', 'svc')
GFM_LAWS = ('droop', 'vsm', 'psc')
CONV_STATES = {'droop': ('theta', 'pf', 'qf'), 'vsm': ('theta', 'wv', 'psi'), 'psc': ('theta', 'xe'),
               'gfl': ('pll', 'xi', 'xq', 'wf'), 'gflpi': ('pll', 'xi', 'xp', 'xq', 'id', 'iq', 'zd', 'zq', 'wf')}


class _Holds:
    """The holds of the limits without windup inside a step (as Unit._hold, 5.0.13): decided at the start of the step while
    the System solves one (_fz, set by System._freeze), else from the point itself."""
    _fz = _rec = None

    def _hold(self, key):
        def hold(tot, rr, lo, hi):
            h = _held(tot, rr, lo, hi)
            if self._rec is not None:
                self._rec[key] = h
            if self._fz is not None and key in self._fz:
                return self._fz[key]
            return h
        return hold


def _hyp(a, b):
    return np.sqrt(a * a + b * b)


def _floor(u, lo):
    return np.where(_re(u) < lo, lo + 0 * u, u)


class Converter(_Holds, Kind):
    """5.0.14: a converter with its control, as one device on its bus (THEORY §8ΩΞ). kind 'gfm' (law 'droop', 'vsm', 'psc')
    or 'gfl' (also a STATCOM: 'gfl' with P_ref = 0 and a slope). The members of one Converter share the kind, the law and
    the options; the parameters are per member, on the rating S_n.

    Grid-forming (the GFMC of the EMT with the direct inner control): the EMF E∠θ behind the filter R_f + jX_c and the
    virtual impedance R_v + jX_v. Below the limit the inner control makes the converter voltage its reference exactly, so
    i = (E·e^(jθ) − v)/(R_f + R_v + j(X_c + X_v)). In the limit (|i| above I′ = I_max·α/(α + R_f), α = a_c·X_c/ω₀, the
    proportional gain of the inner control) the steady state of that control: i = k·(E·e^(jθ) − v)/(α(1 − k) + R_f + k·R_v +
    jk(X_c + X_v)) with |i| = I′ (k from a quadratic). droop: ω = 1 − m_p·(P_f − P_ref), E = V_ref − n_q·(Q_f − Q_ref), P_f and
    Q_f through 2π·f_p; VSM: 2H·ω′ = P_ref − P_E/ω − (ω − 1)/m_p, ψ′ = (Q_ref − Q_E + (V_ref − |v|)/n_q)·n_q/t_v (only
    unwinding in the limit), E = ω·ψ, P_E and Q_E at the EMF; PSC: ω = 1 + k_p·(P_ref − P)/ω₀, E = V_ref + x_E, x_E′ =
    (K_E·(U_ref − |v|) − x_E)/T_E (|x_E| ≤ 0,5). θ′ = ω₀·(ω − 1).

    Grid-following (the robust vector current control of the MMCC, mode P): the PLL (K_p = 2·0,7071·ω_n, K_i = ω_n²,
    ω_n = 2π·bw, the error v_q/|v|) gives the frame; i_d = (P_ref − Δp)/V_ref + (V_ref − v_d)/R_a, i_q = −v_q/R_a − x_q,
    x_q′ = (ω₀/R_a)·(V_ref + slope·i_q − v_d) with R_a = acc·X; |i| ≤ I_lim by scaling both (x_q held there while it would push
    further); the frequency response Δp = (ω_f − 1)/m_f with ω_f the PLL's frequency through T_f (frq). The inner loop
    and the filters of the measurements are taken as ideal (i = its reference).

    storage (grid-following only): the state of charge, soc′ = −P·S_n/(E·3,6·10⁹) (E in MWh); the d current that discharges
    (charges) it falls linearly to 0 over the last 1 % of its range at s_min (s_max). pv: P ≤ P_av, and the frequency
    response only for a frequency above 1 pu (a plant at its available power cannot raise it)."""

    def __init__(self, names, bus, p, kind='gfm', law='droop', frq=False, avc=True, storage=False, pv=False, cc='robust'):
        super().__init__(names, bus, p)
        self.kind, self.law, self.frq, self.avc, self.storage, self.pv = kind, (law if kind == 'gfm' else 'gfl'), frq, avc, storage, pv
        if kind == 'gfl' and cc == 'pi':                    # 5.0.15: the control 'pi' of the MMCC
            self.law = 'gflpi'
        st = list(CONV_STATES[self.law])
        self.i_soc = len(st)
        if storage:
            st.append('soc')
        self.states, self.nx = tuple(st), len(st)

    def limits(self):
        out = []
        if self.law == 'psc' and self.avc:
            out.append((1, 0.0, -0.5, 0.5, np.ones(self.m, bool)))
        return out

    # -------------------------------------------------------------- the current of the grid-forming converter
    def _gfm_i(self, E, th, Vr, Vi):
        p = self.p
        Er, Ei = E * np.cos(th), E * np.sin(th)
        Wr, Wi = Er - Vr, Ei - Vi
        w2 = Wr * Wr + Wi * Wi
        al, Rf, Rv, C = p['al'], p['Rf'], p['Rv'], p['Xc'] + p['Xv']
        Im = p['Imax'] * al / (al + Rf)
        # in the limit or not: as at the start of the step inside its Newton (the current has a kink there)
        lim = self._hold('ilim')(_re(w2) - Im * Im * ((Rf + Rv) ** 2 + C * C), 1.0, -math.inf, 0.0)
        A, Bc = al + Rf, Rv - al
        a2 = w2 - Im * Im * (Bc * Bc + C * C)
        a1 = -2 * Im * Im * A * Bc + 0 * w2
        a0 = -Im * Im * A * A + 0 * w2
        # (inside a step whose start was in the limit |i| stays I′ even where the point falls below it: smooth in the step)
        disc = a1 * a1 - 4 * a2 * a0
        ok = lim & (_re(disc) > 0)
        disc = np.where(ok, disc, 1.0 + 0 * w2)
        k = np.where(ok, 2 * a0 / (-a1 - np.sqrt(disc)), 1.0 + 0 * w2)
        Dr, Di = A + k * Bc, k * C
        den = Dr * Dr + Di * Di
        ir = k * (Wr * Dr + Wi * Di) / den
        ii = k * (Wi * Dr - Wr * Di) / den
        return Er, Ei, ir, ii, lim

    def _taper(self, X):
        """The factors of the current that discharges (charges) the store: 1 within its range, falling linearly to 0 over the
        last 1 % of the range at s_min (s_max) (our choice: a smooth stop, without a decision at each step)."""
        q = self.p['store']
        soc, band = X[:, self.i_soc], 0.01 * (q['smax'] - q['smin'])
        return _clip((soc - q['smin']) / band, 0.0, 1.0), _clip((q['smax'] - soc) / band, 0.0, 1.0)

    def _gfm(self, X, Vr, Vi):
        p, law = self.p, self.law
        th = X[:, 0]
        pref = p['Pref'] + p['dP']
        vref = p['Vref'] + p['dV']
        F = [None] * len(CONV_STATES[law])
        if law == 'droop':
            pf, qf = X[:, 1], X[:, 2]
            w = 1 - p['mp'] * (pf - pref)
            E = vref - p['nq'] * (qf - p['Qref'])
        elif law == 'vsm':
            wv, psi = X[:, 1], X[:, 2]
            w = wv
            E = wv * psi
        else:
            E = vref + (X[:, 1] if self.avc else 0 * th)
        Er, Ei, ir, ii, lim = self._gfm_i(E, th, Vr, Vi)
        blk = p.get('blk')
        if blk is not None:                                 # 5.1.1: a blocked station of pcl.rms.HVDC: no current, and its law sees
            ir, ii = ir * (1.0 - blk), ii * (1.0 - blk)     # P = Q = 0 (the GFMC of the EMT measures zero currents)
        P, Q = Vr * ir + Vi * ii, Vi * ir - Vr * ii
        vm = _hyp(Vr, Vi)
        if law == 'droop':
            wf = 2 * math.pi * p['fp']
            F[1], F[2] = wf * (P - pf), wf * (Q - qf)
        elif law == 'vsm':
            PE, QE = Er * ir + Ei * ii, Ei * ir - Er * ii
            F[1] = (pref - PE / _floor(wv, 0.5) - (wv - 1) / p['mp']) / (2 * p['H'])
            g = (p['Qref'] - QE + (vref - vm) / p['nq']) * p['nq'] / p['tv']
            held = self._hold('psi')(np.where(lim, 1.0, 0.0), _re(g), -math.inf, 0.5)
            F[2] = np.where(held, 0 * g, g)
        else:
            w = 1 + p['kp'] * (pref - P) / p['w0']
            if self.avc:
                xe = X[:, 1]
                r = (p['KE'] * (p['Uref'] - vm) - xe) / p['TE']
                F[1] = np.where(self._hold('xe')(_re(xe), _re(r), -0.5, 0.5), 0 * r, r)
            else:
                F[1] = 0 * th
        F[0] = p['w0'] * (w - 1)
        return F, ir, ii, {'P': P, 'Q': Q, 'w': w, 'E': E, 'lim': lim}

    def _gfl(self, X, Vr, Vi):
        p = self.p
        dp, xi, xq, wf = X[:, 0], X[:, 1], X[:, 2], X[:, 3]
        c, s = np.cos(dp), np.sin(dp)
        hd, hq = Vr * c + Vi * s, -Vr * s + Vi * c
        vm = _hyp(Vr, Vi)
        e = hq / _floor(vm, 1e-6)
        F0, F1 = p['Kp'] * e + xi, p['Ki'] * e
        wp = 1 + F0 / p['w0']
        if self.frq:
            F3 = (wp - wf) / p['Tf']
            dpf = (wf - 1) / p['mf']
            if self.pv:
                dpf = np.where(_re(dpf) > 0, dpf, 0 * dpf)
        else:
            F3, dpf = 0 * wf, 0 * wf
        pc = p['Pref'] + p['dP'] - dpf
        if self.pv:
            pc = np.where(_re(pc) > p['Pav'], p['Pav'] + 0 * pc, pc)
        er = p['Vref'] + p['dV']
        Ra = p['Ra']
        idu = pc / np.maximum(er, 0.1) + (er - hd) / Ra
        iqu = -(hq / Ra + xq)
        mag = _hyp(idu, iqu)
        over = self._hold('ilim')(_re(mag) - p['Ilim'], 1.0, -math.inf, 0.0)
        sk = np.where(over, p['Ilim'] / _floor(mag, 1e-9), 1.0 + 0 * mag)
        idl, iql = sk * idu, sk * iqu
        if self.storage:                                    # the store near empty (full): the current that discharges (charges) it tapers
            fd, fc = self._taper(X)
            idl = np.where(_re(idl) > 0, idl * fd, idl * fc)
        g = p['w0'] / Ra * (er + p['slope'] * iqu - hd)
        # held while the current is limited and the error would push the q current into the converter further
        held = self._hold('xq')(np.where(over, 1.0, 0.0), _re(g * (-iqu)), -math.inf, 0.5)
        F2 = np.where(held, 0 * g, g)
        ir, ii = idl * c - iql * s, idl * s + iql * c
        P, Q = Vr * ir + Vi * ii, Vi * ir - Vr * ii
        return [F0, F1, F2, F3], ir, ii, {'P': P, 'Q': Q, 'w': wp, 'lim': over}

    def _gflpi(self, X, Vr, Vi):
        """5.0.15: the grid-following converter with the control 'pi' of the MMCC (mode P, Q; THEORY §8ΩΟ.2): the PLL as
        _gfl; the outer integrals x_p′ = (3/T_p)·(P_ref − Δp − P), x_q′ = (3/T_q)·(Q_ref − Q) with i_d,ref = x_p/v_d, i_q,ref =
        −x_q/v_d (the currents out of the converter in the frame of the PLL); the limit with the priority to P (|i_d| ≤ I_dlim,
        |i| ≤ I_lim; the integrals held while it holds them and the error would drive them further); the inner PI on the
        reactor, L·i′ = K_p·(i_ref − i) + z − R·i, z′ = K_i·(i_ref − i), L = X/ω₀, K_p = L/τ, K_i = max(R/τ, K_p/(4τ)), τ = T_i/3."""
        p = self.p
        dp, xi, xp, xq, i_d, i_q, zd, zq, wf = (X[:, j] for j in range(9))
        c, s = np.cos(dp), np.sin(dp)
        hd, hq = Vr * c + Vi * s, -Vr * s + Vi * c
        vm = _hyp(Vr, Vi)
        e = hq / _floor(vm, 1e-6)
        F0, F1 = p['Kp'] * e + xi, p['Ki'] * e
        wp = 1 + F0 / p['w0']
        if self.frq:
            F8 = (wp - wf) / p['Tf']
            dpf = (wf - 1) / p['mf']
        else:
            F8, dpf = 0 * wf, 0 * wf
        vdn = _floor(hd, 0.1)
        idr, iqr = xp / vdn, -xq / vdn
        idl = _clip(idr, -p['Idlim'], p['Idlim'])
        qm = np.sqrt(_floor(p['Ilim'] ** 2 - idl * idl, 0.0) + 0 * idl)
        iql = np.where(_re(iqr) > _re(qm), qm, np.where(_re(iqr) < -_re(qm), -qm, iqr))
        P, Q = hd * i_d + hq * i_q, hq * i_d - hd * i_q
        rp = 3 / p['Tp'] * (p['Pref'] + p['dP'] - dpf - P)
        rq = 3 / p['Tq'] * (p['Qref'] - Q)
        F2 = np.where(self._hold('xp')(_re(idr - idl), _re(rp), -1e-12, 1e-12), 0 * rp, rp)
        F3 = np.where(self._hold('xq')(_re(iqr - iql), _re(-rq), -1e-12, 1e-12), 0 * rq, rq)
        ed, eq = idl - i_d, iql - i_q
        F4, F5 = (p['kpi'] * ed + zd - p['R'] * i_d) / p['Lx'], (p['kpi'] * eq + zq - p['R'] * i_q) / p['Lx']
        F6, F7 = p['kii'] * ed, p['kii'] * eq
        ir, ii = i_d * c - i_q * s, i_d * s + i_q * c
        Pn, Qn = Vr * ir + Vi * ii, Vi * ir - Vr * ii
        lim = np.where(_re(_hyp(idr, iqr)) > _re(_hyp(idl, iql)) + 1e-9, True, False)
        return [F0, F1, F2, F3, F4, F5, F6, F7, F8], ir, ii, {'P': Pn, 'Q': Qn, 'w': wp, 'lim': lim}

    def _core(self, X, Vr, Vi):
        F, ir, ii, o = (self._gfm if self.kind == 'gfm' else self._gflpi if self.law == 'gflpi' else self._gfl)(X, Vr, Vi)
        if self.storage:
            F = F + [-o['P'] * self.p['store']['k']]
        return F, ir, ii, o

    # -------------------------------------------------------------- start and evaluation
    def init(self, V, S, wb):
        p = self.p
        p['w0'] = wb
        m = self.m
        k = p['k']
        s = S * k                                           # on S_n
        i = np.conj(s / V)
        X = np.zeros((m, self.nx))
        if self.kind == 'gfm':
            p['al'] = p['ac'] * p['Xc'] / wb
            E = V + (p['Rf'] + p['Rv'] + 1j * (p['Xc'] + p['Xv'])) * i
            Im = p['Imax'] * p['al'] / (p['al'] + p['Rf'])
            if np.any(np.abs(i) > Im * (1 + 1e-9)):
                raise RMSError('μετατροπέας στο όριο ρεύματος ήδη από τη ροή φορτίου: ' + ', '.join(n for n, a in zip(self.names, np.abs(i) > Im) if a))
            P, Q = s.real, s.imag
            PE, QE = (E * np.conj(i)).real, (E * np.conj(i)).imag
            X[:, 0] = np.angle(E)
            if self.law == 'droop':
                p['Pref'] = np.where(np.isnan(p['Pref']), P, p['Pref'])
                p['Qref'] = np.where(np.isnan(p['Qref']), Q, p['Qref'])
                p['Vref'] = np.where(np.isnan(p['Vref']), np.abs(E) + p['nq'] * (Q - p['Qref']), p['Vref'])
                X[:, 1], X[:, 2] = P, Q
            elif self.law == 'vsm':
                p['Pref'] = np.where(np.isnan(p['Pref']), PE, p['Pref'])
                p['Qref'] = np.where(np.isnan(p['Qref']), QE, p['Qref'])
                p['Vref'] = np.where(np.isnan(p['Vref']), np.abs(V) - p['nq'] * (p['Qref'] - QE), p['Vref'])
                X[:, 1], X[:, 2] = 1.0, np.abs(E)
            else:
                p['Pref'] = np.where(np.isnan(p['Pref']), P, p['Pref'])
                p['Uref'] = np.where(np.isnan(p['Uref']), np.abs(V), p['Uref'])
                xe0 = p['KE'] * (p['Uref'] - np.abs(V)) if self.avc else np.zeros(m)
                p['Vref'] = np.where(np.isnan(p['Vref']), np.abs(E) - xe0, p['Vref'])
                if self.avc:
                    X[:, 1] = xe0
        elif self.law == 'gflpi':                        # 5.0.15: at rest with the currents of the load flow
            wn = 2 * math.pi * p['bw']
            p['Kp'], p['Ki'] = 2 * 0.7071 * wn, wn * wn
            tau = p['Ti'] / 3
            p['Lx'] = p['X'] / wb
            p['kpi'] = p['Lx'] / tau
            p['kii'] = np.maximum(p['R'] / tau, p['kpi'] / (4 * tau))
            if np.any(np.abs(i) > p['Ilim'] * (1 + 1e-9)) or np.any(np.abs((i * np.exp(-1j * np.angle(V))).real) > p['Idlim'] * (1 + 1e-9)):
                raise RMSError('μετατροπέας στο όριο ρεύματος ήδη από τη ροή φορτίου: ' + ', '.join(self.names))
            ph = np.angle(V)
            ip = i * np.exp(-1j * ph)
            vd = np.abs(V)
            X[:, 0], X[:, 4], X[:, 5] = ph, ip.real, ip.imag
            X[:, 2], X[:, 3] = ip.real * np.maximum(vd, 0.1), -ip.imag * np.maximum(vd, 0.1)
            X[:, 6], X[:, 7], X[:, 8] = p['R'] * ip.real, p['R'] * ip.imag, 1.0
            p['Pref'] = np.where(np.isnan(p['Pref']), vd * ip.real, p['Pref'])
            p['Qref'] = np.where(np.isnan(p['Qref']), -vd * ip.imag, p['Qref'])
        else:
            p['Ra'] = p['acc'] * p['X']
            wn = 2 * math.pi * p['bw']
            p['Kp'], p['Ki'] = 2 * 0.7071 * wn, wn * wn
            if np.any(np.abs(i) > p['Ilim'] * (1 + 1e-9)):
                raise RMSError('μετατροπέας στο όριο ρεύματος ήδη από τη ροή φορτίου: ' + ', '.join(n for n, a in zip(self.names, np.abs(i) > p['Ilim']) if a))
            dp = np.angle(V)
            ip = i * np.exp(-1j * dp)
            # at rest: V_ref + slope·i_q = |V| (the reference at zero current, with the slope), and P_ref so that i_d of the
            # start is that of the load flow: P_ref/V_ref + (V_ref − |V|)/R_a = i_d
            p['Vref'] = np.where(np.isnan(p['Vref']), np.abs(V) - p['slope'] * ip.imag, p['Vref'])
            p['Pref'] = np.where(np.isnan(p['Pref']), (ip.real - (p['Vref'] - np.abs(V)) / p['Ra']) * np.maximum(p['Vref'], 0.1), p['Pref'])
            if self.pv:
                p['Pav'] = np.where(np.isnan(p['Pav']), p['Pref'], p['Pav'])
            X[:, 0], X[:, 2], X[:, 3] = dp, -ip.imag, 1.0
        if self.storage:
            q = p['store']
            q['k'] = p['Sn'] / (q['E'] * 3.6e9)
            X[:, self.i_soc] = q['soc0']
        p['dP'], p['dV'] = np.zeros(m), np.zeros(m)
        p.setdefault('on', np.ones(m))
        return X

    def eval(self, X, Vr, Vi, t):
        on = self.p['on']
        F, ir, ii, _ = self._core(X, Vr, Vi)
        F = np.stack([np.broadcast_to(f, (X.shape[0],)) for f in F], axis=1) if F else np.zeros((X.shape[0], 0))
        k = self.p['k']
        return F * on[:, None], ir / k * on, ii / k * on

    def outputs(self, X, Vr, Vi):
        """P, Q (pu on S_base), |V|, |I| (pu on S_n), ω (pu: of the EMF, or of the PLL), the flag of the current limit,
        E (grid-forming) and the state of charge."""
        p = self.p
        F, ir, ii, o = self._core(X, Vr, Vi)
        k, on = p['k'], p['on']
        out = {'P': o['P'] / k * on, 'Q': o['Q'] / k * on, 'V': _hyp(Vr, Vi), 'I': _hyp(ir, ii) * on, 'omega': o['w'],
               'limited': np.where(o['lim'], 1.0, 0.0) * on}
        if 'E' in o:
            out['E'] = o['E'] + 0 * o['w']
        if self.storage:
            out['soc'] = X[:, self.i_soc]
        return out


class SVC(_Holds, Kind):
    """5.0.14: a static var compensator as a controlled susceptance B (pu on S_n, capacitive positive), with the basic models
    of «Static Var Compensator Models for Power Flow and Dynamic Performance Simulation» (IEEE Trans. Power Systems 9(1),
    1994, Figs. 4–8; THEORY §8ΩΞ.4): the measurement lag T_m (Fig. 6; 0: none), then
    model 1 (Fig. 7): the lead-lag (1 + sT_1)/(1 + sT_2) and K_R/(1 + sT_R) on the error V_ref − V_m, B within [B_min, B_max]
    without windup (K_R the inverse of the slope);
    model 2 (Fig. 8): a PI K_P + K_I/s (non-windup) on V_ref − V_m − K_SL·I with the current I = B·V_m, and the lag
    1/(1 + sT_P) (0: none).
    The thyristor susceptance control (Fig. 9) is not represented, as the paper advises for stability programs."""
    nx, states = 3, ('vm', 'r', 'b')

    def __init__(self, names, bus, p, model=1):
        super().__init__(names, bus, p)
        self.model = model

    def limits(self):
        on = np.ones(self.m, bool)
        if self.model == 1:
            return [(2, 0.0, self.p['Bmin'], self.p['Bmax'], self.p['TR'] > 0)]
        return [(1, 0.0, self.p['Bmin'], self.p['Bmax'], on), (2, 0.0, self.p['Bmin'], self.p['Bmax'], self.p['TP'] > 0)]

    def init(self, V, S, wb):
        p = self.p
        s = S * p['k']
        v = np.abs(V)
        b0 = s.imag / v ** 2
        if np.any(b0 > p['Bmax'] + 1e-12) or np.any(b0 < p['Bmin'] - 1e-12):
            raise RMSError('SVC έξω από τα όριά του ήδη από τη ροή φορτίου: ' + ', '.join(self.names))
        if np.any(np.abs(s.real) > 1e-6):
            raise RMSError('SVC με P ≠ 0 στη ροή φορτίου: ' + ', '.join(n for n, a in zip(self.names, np.abs(s.real) > 1e-6) if a))
        X = np.zeros((self.m, 3))
        X[:, 0], X[:, 2] = v, b0
        if self.model == 1:
            p['Vref'] = np.where(np.isnan(p['Vref']), v + b0 / p['KR'], p['Vref'])
            X[:, 1] = p['Vref'] - v                                    # the lag of the lead-lag at its input
        else:
            p['Vref'] = np.where(np.isnan(p['Vref']), v + p['KSL'] * b0 * v, p['Vref'])
            X[:, 1] = b0
        p['dV'] = np.zeros(self.m)
        p.setdefault('on', np.ones(self.m))
        return X

    def _core(self, X, Vr, Vi):
        p = self.p
        v = _hyp(Vr, Vi)
        vm, F0 = _lag(X[:, 0], v, p['Tm'])
        vm = np.where(p['Tm'] > 0, vm, v)
        if self.model == 1:
            e = p['Vref'] + p['dV'] - vm
            y, F1 = _leadlag(X[:, 1], e, p['T1'], p['T2'])
            b, F2 = _nwlag(X[:, 2], y, 0.0, p['KR'], p['TR'], p['Bmin'], p['Bmax'], self._hold('b'))
        else:
            x = X[:, 1]
            if True:
                # B as the output of the PI (through its lag): with T_P = 0 the loop K_P·K_SL·V_m is solved for B
                bs = np.where(p['TP'] > 0, X[:, 2], 0 * x)
                bu = (p['KP'] * (p['Vref'] + p['dV'] - vm) + x) / (1 + p['KP'] * p['KSL'] * vm)
                b = np.where(p['TP'] > 0, bs, _clip(bu, p['Bmin'], p['Bmax']))
            e = p['Vref'] + p['dV'] - vm - p['KSL'] * b * vm
            r = p['KI'] * e
            F1 = np.where(self._hold('x')(_re(x), _re(r), p['Bmin'], p['Bmax']), 0 * r, r)
            u = p['KP'] * e + x
            _, F2 = _nwlag(X[:, 2], u, 0.0, 1.0, p['TP'], p['Bmin'], p['Bmax'], self._hold('b'))
        return [F0, F1, F2], b, v

    def eval(self, X, Vr, Vi, t):
        p = self.p
        F, b, _ = self._core(X, Vr, Vi)
        on, k = p['on'], p['k']
        F = np.stack([np.broadcast_to(f, (X.shape[0],)) for f in F], axis=1)
        return F * on[:, None], b * Vi / k * on, -b * Vr / k * on          # injected −jB·V: Q = B·|V|² out of the bus

    def outputs(self, X, Vr, Vi):
        p = self.p
        _, b, v = self._core(X, Vr, Vi)
        on = p['on']
        return {'P': 0 * b, 'Q': b * v * v / p['k'] * on, 'V': v, 'I': np.abs(b) * v * on, 'B': b * on}


class Statcom(_Holds, Kind):
    """5.0.14: a STATCOM as the simplified dynamic model of «Power System Dynamics: Stability and Control» (3rd ed., §11.7.1,
    Fig. 11.68; THEORY §8ΩΞ.3): an integral regulator K/s on V_ref − V_m − ρ·I (ρ the droop of the static characteristic),
    its output (the reference of the current) within [−I_Lmax, I_Cmax] without windup, and the converter as a first-order lag
    T_C; the current I (pu on S_n, capacitive positive) is injected 90° ahead of the voltage. The measurement lag T_m (0: none)
    is our addition."""
    nx, states = 3, ('vm', 'x', 'i')

    def limits(self):
        return [(1, 0.0, -self.p['ILmax'], self.p['ICmax'], np.ones(self.m, bool))]

    def init(self, V, S, wb):
        p = self.p
        s = S * p['k']
        v = np.abs(V)
        i0 = s.imag / v
        if np.any(i0 > p['ICmax'] + 1e-12) or np.any(i0 < -p['ILmax'] - 1e-12):
            raise RMSError('STATCOM έξω από τα όριά του ήδη από τη ροή φορτίου: ' + ', '.join(self.names))
        if np.any(np.abs(s.real) > 1e-6):
            raise RMSError('STATCOM με P ≠ 0 στη ροή φορτίου: ' + ', '.join(n for n, a in zip(self.names, np.abs(s.real) > 1e-6) if a))
        p['Vref'] = np.where(np.isnan(p['Vref']), v + p['rho'] * i0, p['Vref'])
        p['dV'] = np.zeros(self.m)
        p.setdefault('on', np.ones(self.m))
        X = np.zeros((self.m, 3))
        X[:, 0], X[:, 1], X[:, 2] = v, i0, i0
        return X

    def _core(self, X, Vr, Vi):
        p = self.p
        v = _hyp(Vr, Vi)
        vm, F0 = _lag(X[:, 0], v, p['Tm'])
        vm = np.where(p['Tm'] > 0, vm, v)
        x, i = X[:, 1], X[:, 2]
        r = p['K'] * (p['Vref'] + p['dV'] - vm - p['rho'] * i)
        F1 = np.where(self._hold('x')(_re(x), _re(r), -p['ILmax'], p['ICmax']), 0 * r, r)
        io, F2 = _lag(i, _clip(x, -p['ILmax'], p['ICmax']), p['TC'])
        return [F0, F1, F2], io, v

    def eval(self, X, Vr, Vi, t):
        p = self.p
        F, i, v = self._core(X, Vr, Vi)
        on, k = p['on'], p['k']
        F = np.stack([np.broadcast_to(f, (X.shape[0],)) for f in F], axis=1)
        vv = _floor(v, 1e-6)
        return F * on[:, None], i * Vi / vv / k * on, -i * Vr / vv / k * on   # injected −j·I·V/|V|: Q = |V|·I

    def outputs(self, X, Vr, Vi):
        p = self.p
        _, i, v = self._core(X, Vr, Vi)
        on = p['on']
        return {'P': 0 * i, 'Q': i * v / p['k'] * on, 'V': v, 'I': np.abs(i) * on,
                'limited': np.where((_re(X[:, 1]) >= p['ICmax']) | (_re(X[:, 1]) <= -p['ILmax']), 1.0, 0.0) * on}


# ---------------------------------------------------------------- 5.0.15: HVDC and DC grids (ROADMAP §101 step 2)
# The station data of the RMS model: those of the MMCC (the upper level control of an MMC station) of the EMT, per unit on
# the station's rating S_n, so that a drawing and its RMS model have the same controls. W (kJ/MVA): the energy of the
# converter's capacitance (its C = 2·W·S_n/U_n² on its DC bus); X, R: the converter reactance behind which a station that
# forms its island's voltage (Vf) is a source; T_dc: the lag of a DC/DC converter (s).
STATION_DEFAULTS = {'Tp': 0.1, 'Tq': 0.1, 'Tvdc': 0.1, 'H': 0.03, 'Tvac': 0.1, 'Xpcc': 0.1, 'Tvf': 0.1, 'kdv': 0.2, 'X': 0.255,
                    'R': 0.0, 'Ti': 0.01, 'bw': 20.0, 'Ilim': 1.1, 'Idlim': 1.1, 'W': 30.0, 'Ldc': 0.0, 'Rd': 0.0, 'fd': 10.0,
                    'ovl': 0.0, 'Vdcmax': 1.1, 'kov': 10.0, 'prot': 0.0, 'tprot': 0.3, 'Idcmax': 2.0, 'Vuv': 0.1, 'tuv': 0.02,
                    'tcb': 0.04}
# ovl (5.0.17): 1, the limiter of the DC overvoltage of the MMCC in the modes P and droop: above V_dc,max (pu) the d current is
# cut by k_ov·(U_dc − V_dc,max) and the integrator of P holds (the EMT's OVL); 0 (the default, as 5.0.15): without it
# prot (5.1.1, THEORY §8ΩΦ): 1, the protection of the MMCC as events (System.simulate, HVDC._protection): after t_prot, the
# AC voltage of the station below V_uv (pu) blocks it, and t_uv after the voltage is back it deblocks; its DC current at the
# terminals above I_dc,max (pu of S_n/U_n) blocks it for good, and t_cb later its AC breaker opens (the station out, as 'gen');
# 0 (the default of the API, so that the results before 5.1.1 stay): without it. From a drawing as its MMCC (prot, tprot,
# Idcmax; V_uv, t_uv and t_cb are those of the EMT, fixed there)
# Ldc (H): the DC side of the station behind its terminals, its capacitance inside (as Model 4 of an MMC: C_dc = 6C/N behind
# 2L_arm/3), with the active damping R_d (Ω) on the part of its current above f_d (Hz), as the EMT; without a resistance in
# series, so that the start is the AC/DC load flow (whose stations are lossless on their DC side); Ldc = 0: the capacitance
# of the station on its DC bus (CIGRE TB 604, §2.6.1: «all capacitances can be aggregated per DC bus»)
DCDC_DEFAULTS = {'Tdc': 0.005}
# 5.0.18: the data of the law of a grid-forming station (model 'gfm'), as a grid-forming converter of pcl.rms (GFM_DEFAULTS; m_p, n_q in
# %; the references P_ref, Q_ref out of the station to the AC side, pu of S_n); X_c, R_f the reactor of the station unless given
GFM_STATION_KEYS = set(GFM_DEFAULTS) | {'law', 'avc', 'Pref', 'Qref', 'Vref', 'Uref'}
STATION_STATES = ('pll', 'xi', 'xd', 'xq', 'id', 'iq', 'zd', 'zq')
VF_STATES = ('xv', 'il')


class HVDC(_Holds, Kind):
    """5.0.15: the DC grids of a network with their converter stations (vsc) and DC/DC converters (dcdc) as one device across
    the AC buses of its stations (THEORY §8ΩΟ): the phasor model of a VSC station (Type 6 of CIGRE TB 604, §2.6) with the upper
    level controls of the MMCC of our EMT and the inner current control as a lag (TB 604, §2.6.4), the DC side by the balance
    of power, the DC capacitances aggregated per DC bus, and the DC lines as R–L with their capacitance at the two ends (TB
    604, (2.40)–(2.43); «Modeling of Multi-Terminal VSC HVDC Systems With Distributed DC Voltage Control», (4)–(6)).

    One member (m = 1) whose states are, in order: the voltage of every DC bus (pu of its U_n); the current of every DC line
    with an inductance (pu of S_base/U_n, from a to b); per station that controls a current (P, V, droop) the PLL angle and
    its integral, the integrals of the outer d (P, V_dc or droop) and q (Q or V_ac) controls, and the d and q currents into
    the converter in the frame of its PLL; per station that forms its island's voltage (Vf) the integral of its AC voltage
    control and the low-pass of its d current; per DC/DC converter its power (pu of S_base). The AC side: the current
    into each station's bus (pu of S_base); the buses of the device are those of its stations (self.bus).
    5.0.16: the current sources of a DC grid (dc_source): its current, or with dynamic data {'expr': the tree of an expression
    block (web/studio/expr.js), 'ins': the DC buses whose voltages (V) are its inputs, 'pars', 'gain', 'tau': the time
    constants of the low-pass blocks on the way, 'k': ±1 into the bus} the current k·gain·expr(U, t) (A) through them; per
    low-pass one state (pu of S_base/U_n of its bus), after those of the DC/DC converters."""
    multi = True

    def __init__(self, net, pf, stations, Sb, idx, wb):
        self.Sb, self.wb = Sb, wb
        stations = stations or {}
        dcb = getattr(net, 'dc_buses', {})
        self.dc_names = list(dcb)
        self.dc_idx = {b: k for k, b in enumerate(self.dc_names)}
        nd = len(self.dc_names)
        self.Un = np.array([dcb[b]['Un'] for b in self.dc_names], float)
        Cb = np.array([float(dcb[b].get('C', 0.0)) for b in self.dc_names])
        Gb = np.array([1.0 / dcb[b]['R'] if dcb[b].get('R') else 0.0 for b in self.dc_names])
        # the lines: R and L of the loop (poles conductors), the capacitance between the poles split at the two ends
        self.lines = []
        for e in net.elements:
            if e['kind'] != 'dc_line':
                continue
            a, b = self.dc_idx[e['a']], self.dc_idx[e['b']]
            if self.Un[a] != self.Un[b]:
                raise RMSError(f'{e["name"]}: DC line between buses of different U_n')
            n, Z = e['poles'], self.Un[a] ** 2 / Sb
            if e.get('C'):
                Cb[a] += e['C'] / n / 2
                Cb[b] += e['C'] / n / 2
            self.lines.append({'name': e['name'], 'a': a, 'b': b, 'r': n * e['R'] / Z, 'l': n * e.get('L', 0.0) / Z, 'rd': 0.0, 'wf': 0.0})
        # the stations
        vs = [e for e in net.elements if e['kind'] == 'vsc']
        for e in vs:
            if e['control'] in ('idroop', 'I'):
                raise RMSError(f'{e["name"]}: control {e["control"]} is not in the RMS model of the stations yet (P, V, droop, Vf)')
            if any(e.get(q) for q in ('Rtr', 'Xtr', 'Bf')):
                raise RMSError(f'{e["name"]}: the transformer and the filter of a station are elements of the AC network in the RMS model '
                               '(CIGRE TB 604, §2.6.1): R_tr, X_tr, B_f must be 0')
        # 5.0.18: a station whose data say model 'gfm' forms the voltage of its AC side with a grid-forming law (THEORY §8ΩΤ); its
        # start is a station P (the network has another source on its side) or Vf (an island) of the load flow
        isg = [(stations.get(e['name']) or {}).get('model') == 'gfm' for e in vs]
        for e, q in zip(vs, isg):
            if q and e['control'] not in ('P', 'Vf'):
                raise RMSError(f'{e["name"]}: a grid-forming station starts from a station P or Vf of the load flow (its DC voltage from the others)')
        self.gs = [e for e, q in zip(vs, isg) if e['control'] != 'Vf' and not q]    # the stations that control a current
        self.vf = [e for e, q in zip(vs, isg) if e['control'] == 'Vf' and not q]
        self.gm = [e for e, q in zip(vs, isg) if q]
        self.dd = [e for e in net.elements if e['kind'] == 'dcdc']
        for e in self.dd:
            if e['control'] != 'P':
                raise RMSError(f'{e["name"]}: a DC/DC converter with control {e["control"]} is not in the RMS model yet (P)')
        self.ss = [e for e in net.elements if e['kind'] == 'dc_source']             # 5.0.16
        if any(e['kind'] == 'dc_dispatcher' for e in net.elements):
            raise RMSError('the dispatcher of a DC grid (dc_dispatcher) is a steady-state control: not in the RMS model yet')
        conv = pf['converters']
        dres = pf['dc']

        def data(e, defaults, md=None):
            md = dict(stations.get(e['name'], {})) if md is None else md
            inner = md.pop('inner', 'pi')
            if inner not in ('pi', 'lag'):
                raise RMSError(f"{e['name']}: inner 'pi' (the PI of the EMT on its reactor) or 'lag' (CIGRE TB 604, §2.6.4)")
            bad = set(md) - set(defaults) - {'Sn', 'Pref', 'Qref', 'Vref', 'Vacref', 'kd'}
            if bad:
                raise RMSError(f'{e["name"]}: unknown data {", ".join(sorted(bad))}')
            v = {q: _num(md, q, d) for q, d in defaults.items()}
            v['pi'] = 1.0 if inner == 'pi' else 0.0
            v['Sn'] = _num(md, 'Sn', e.get('Prated') or Sb)
            for q in ('Pref', 'Qref', 'Vref', 'Vacref', 'kd'):
                v[q] = _num(md, q, math.nan)
            return v
        G = [data(e, STATION_DEFAULTS) for e in self.gs]
        F = [data(e, STATION_DEFAULTS) for e in self.vf]
        # 5.0.18: a grid-forming station: the data of its DC side as the others, and those of its law as a grid-forming converter
        # of pcl.rms (System._converter, on its rating), with the reactor X, R of the station as X_c, R_f unless given
        M, MG = [], []
        for e in self.gm:
            md = dict(stations.get(e['name']) or {})
            md.pop('model')
            gf = {q: md.pop(q) for q in list(md) if q in GFM_STATION_KEYS}
            v = data(e, STATION_DEFAULTS, md)
            gf.setdefault('Xc', v['X'])
            gf.setdefault('Rf', v['R'])
            key, vals = System._converter(e['name'], 'gfm', gf, Sb / v['Sn'], v['Sn'])
            M.append(v)
            MG.append((key, vals))
        D = [data(e, DCDC_DEFAULTS) for e in self.dd]
        allst = self.gs + self.vf + self.gm
        self.st_line = {}
        Cb, Gb = list(Cb), list(Gb)
        for e, v in zip(allst, G + F + M):
            k = self.dc_idx[e['dc']]
            Cs = 2 * v['W'] * 1e3 * v['Sn'] / 1e6 / self.Un[k] ** 2           # W kJ/MVA → C = 2·W·S_n/U_n²
            if v['Ldc'] > 0:                                # its own node behind L_dc, R_dc (and R_d above f_d)
                Z = self.Un[k] ** 2 / Sb
                node = e['name'] + '/dc'
                self.dc_idx[node] = len(self.dc_names)
                self.dc_names.append(node)
                self.Un = np.r_[self.Un, self.Un[k]]
                Cb.append(Cs)
                Gb.append(0.0)
                self.st_line[e['name']] = len(self.lines)
                self.lines.append({'name': node, 'a': self.dc_idx[node], 'b': k, 'r': 0.0, 'l': v['Ldc'] / Z, 'rd': v['Rd'] / Z,
                                   'wf': 2 * math.pi * v['fd']})
                e = dict(e, dc=node)
            else:
                Cb[k] += Cs
            v['_dc'], v['_dcm'] = self.dc_idx[e['dc']], k                # (the injection, the measurement: the terminals)
            v['_cs'] = 0.0 if v['Ldc'] > 0 else Cs * self.Un[k] ** 2 / Sb
            v['_ln'] = self.st_line.get(e['name'], -1)
        Cb, Gb = np.array(Cb), np.array(Gb)
        nd = len(self.dc_names)
        self.lname = [q['name'] for q in self.lines]
        self.la = np.array([q['a'] for q in self.lines], int)
        self.lb = np.array([q['b'] for q in self.lines], int)
        self.lr = np.array([q['r'] for q in self.lines], float)
        self.ll = np.array([q['l'] for q in self.lines], float)
        self.lrd = np.array([q['rd'] for q in self.lines], float)
        self.lwf = np.array([q['wf'] for q in self.lines], float)
        self.lL = np.flatnonzero(self.ll > 0)                 # the lines with an inductance: their current is a state
        self.lR = np.flatnonzero(~(self.ll > 0))
        self.lD = np.flatnonzero(self.lrd > 0)                # with an active damping: the low-pass of their current
        if np.any(self.lr[self.lR] <= 0):
            raise RMSError('a DC line without inductance needs R > 0')
        if not set(self.lD) <= set(self.lL):
            raise RMSError('an active damping needs L_dc > 0')
        if np.any(Cb <= 0):
            raise RMSError('DC bus without capacitance (no station and no line with C): ' + ', '.join(b for b, c in zip(self.dc_names, Cb) if c <= 0))
        self.c = Cb * self.Un ** 2 / Sb                         # s
        self.g = Gb * self.Un ** 2 / Sb
        self.st_names = [e['name'] for e in allst]
        self.dd_names = [e['name'] for e in self.dd]
        bus = [idx[e['bus']] for e in allst]
        super().__init__(['DC'], np.array(bus, int), {})
        ng, nf, nk, nm = len(self.gs), len(self.vf), len(self.dd), len(self.gm)
        self.ng, self.nf, self.nk, self.nd, self.nm = ng, nf, nk, nd, nm
        # 5.0.16: the current sources, constant or from an expression
        self.src = []
        for e in self.ss:
            md = dict(stations.get(e['name'], {}))
            bad = set(md) - {'expr', 'ins', 'pars', 'gain', 'tau', 'k'}
            if bad:
                raise RMSError(f'{e["name"]}: unknown data {", ".join(sorted(bad))}')
            b = self.dc_idx[e['bus']]
            q = {'name': e['name'], 'bus': b, 'I': float(e['I']) * self.Un[b] / Sb, 'ast': md.get('expr'), 'k': float(md.get('k', 1.0)),
                 'gain': float(md.get('gain', 1.0)), 'pars': [float(x) for x in md.get('pars') or []], 'tau': [float(x) for x in md.get('tau') or []]}
            if q['ast'] is not None:
                try:
                    q['ins'] = [self.dc_idx[str(x)] for x in md.get('ins') or []]
                except KeyError as x:
                    raise RMSError(f'{e["name"]}: no DC bus {x} for an input of its expression') from None
            elif q['tau']:
                raise RMSError(f'{e["name"]}: a constant source has no low-pass (tau) in the RMS model')
            if any(not T > 0 for T in q['tau']):
                raise RMSError(f'{e["name"]}: the time constants of its low-pass blocks > 0')
            self.src.append(q)
        self.sr_names = [q['name'] for q in self.src]
        # the jumps of the expressions in time: the simulation stops at each (System.simulate, 'tick'), and the step that ends
        # there takes the value just before it (self.left), as the EMT, whose step is much smaller
        self.breaks = sorted({c for q in self.src if q['ast'] is not None for c in _tbreaks(q['ast'])})
        self.left = 0.0

        def arr(L, q):
            return np.array([v[q] for v in L], float)
        p = self.p
        p['g'] = {q: arr(G, q) for q in list(STATION_DEFAULTS) + ['Sn', 'Pref', 'Qref', 'Vref', 'Vacref', 'kd']}
        p['f'] = {q: arr(F, q) for q in list(STATION_DEFAULTS) + ['Sn', 'Vref']}
        p['m'] = {q: arr(M, q) for q in list(STATION_DEFAULTS) + ['Sn']}
        p['m']['k'] = Sb / p['m']['Sn']
        # 5.0.18: the grid-forming stations grouped by their law as converters of pcl.rms (their holds those of this device)
        self.gfm = []
        for key in dict.fromkeys(k for k, _ in MG):
            ix = np.array([j for j, (k, _) in enumerate(MG) if k == key], int)
            vals = [MG[j][1] for j in ix]
            cv = Converter([self.gm[j]['name'] for j in ix], np.zeros(len(ix), int), {q: np.array([v[q] for v in vals], float) for q in vals[0]},
                           kind='gfm', law=key[1], avc=key[3])
            cv._hold = (lambda pre: lambda q: self._hold(pre + q))(f'm{len(self.gfm)}.')
            self.gfm.append((cv, ix))
        p['d'] = {q: arr(D, q) for q in list(DCDC_DEFAULTS) + ['Sn', 'Pref']}
        g = p['g']
        g['k'] = Sb / g['Sn']
        p['f']['k'] = Sb / p['f']['Sn']
        for q, L in (('g', G), ('f', F), ('m', M)):
            p[q]['dcb'] = np.array([v['_dc'] for v in L], int)
            p[q]['dcm'] = np.array([v['_dcm'] for v in L], int)
            p[q]['cs'] = np.array([v['_cs'] for v in L], float)
            p[q]['ln'] = np.array([max(v['_ln'], 0) for v in L], int)
            p[q]['hasL'] = np.array([v['_ln'] >= 0 for v in L], bool)
        p['d']['a'] = np.array([self.dc_idx[e['a']] for e in self.dd], int)
        p['d']['b'] = np.array([self.dc_idx[e['b']] for e in self.dd], int)
        g['mode'] = np.array([{'P': 0, 'V': 1, 'droop': 2}[e['control']] for e in self.gs], int)
        g['qv'] = np.array([e.get('Vac') is not None for e in self.gs], bool)       # the AC voltage, else Q
        # the droop k_d (pu of S_n per pu of U_n) from the element: P = P₀ − R·(U − U₀), R = P_rated/(ρ·U_n) W/V
        for j, e in enumerate(self.gs):
            if e['control'] == 'droop' and math.isnan(g['kd'][j]):
                Un = self.Un[g['dcb'][j]]
                Rw = e['R'] if e.get('R') else e['Prated'] / (e['droop'] * Un)
                g['kd'][j] = g['Sn'][j] / (Rw * Un)
        # the losses of the stations (the vsc of the load flow): the phase reactor R_c (pu of S_base) and a + b·I + c·I² (A)
        for q, L in (('g', self.gs), ('f', self.vf), ('m', self.gm)):
            p[q]['Rc'] = np.array([e.get('Rc', 0.0) for e in L])
            p[q]['la'] = np.array([e.get('a_loss', 0.0) for e in L]) / Sb
            p[q]['lb'] = np.array([e.get('b_loss', 0.0) for e in L])
            p[q]['lc'] = np.array([[e.get('crec', 0.0), e.get('cinv', 0.0)] for e in L]).reshape(len(L), 2)
            p[q]['Ib'] = np.array([Sb / (math.sqrt(3) * net.buses[e['bus']]['Un']) for e in L])
        for j, e in enumerate(self.vf):                     # the reactor of the station, if given, else X of the data
            if e.get('Xc'):
                p['f']['X'][j] = e['Xc'] * p['f']['Sn'][j] / Sb
        wn = 2 * math.pi * g['bw']
        g['Kp'], g['Ki'] = 2 * 0.7071 * wn, wn * wn
        zt = 0.8
        wv = 3 / (zt * g['Tvdc'])
        g['kpv'], g['kiv'] = 2 * zt * wv * 2 * g['H'], 2 * g['H'] * wv * wv
        g['tau'] = g['Ti'] / 3
        # the inner PI of the EMT on the reactor X (L = X/ω₀, R): K_p = X/(ω₀τ), K_i = max(R/τ, K_p/(4τ)) (Yazdani & Iravani (8.56),
        # (8.57), as the MMCC); with the decoupling the d and q loops are L·i′ = K_p·(i_ref − i) + z − R·i, z′ = K_i·(i_ref − i)
        g['pi'] = np.array([v['pi'] for v in G], float) > 0
        g['Lx'] = g['X'] / wb
        g['kpi'] = g['Lx'] / np.maximum(g['tau'], 1e-9)
        g['kii'] = np.maximum(g['R'] / np.maximum(g['tau'], 1e-9), g['kpi'] / (4 * np.maximum(g['tau'], 1e-9)))
        if np.any(g['pi'] & ~(g['tau'] > 0)):
            raise RMSError('inner pi: T_i > 0')
        # the layout of the states
        o = 0
        self.i_u = np.arange(o, o + nd); o += nd
        self.i_l = np.arange(o, o + len(self.lL)); o += len(self.lL)
        self.i_lf = np.arange(o, o + len(self.lD)); o += len(self.lD)
        self.i_g = o + 8 * np.arange(ng)[:, None] + np.arange(8)[None, :]; o += 8 * ng
        self.i_f = o + 2 * np.arange(nf)[:, None] + np.arange(2)[None, :]; o += 2 * nf
        self.i_d = np.arange(o, o + nk); o += nk
        for q in self.src:                                  # 5.0.16: the low-pass states of the sources
            q['x'] = np.arange(o, o + len(q['tau'])); o += len(q['tau'])
        self.i_m = o + 3 * np.arange(nm)[:, None] + np.arange(3)[None, :]; o += 3 * nm      # 5.0.18: θ and the two of its law
        self.nx = o
        mst = [None] * nm
        for cv, ix in self.gfm:
            for j in ix:
                mst[j] = (list(CONV_STATES[cv.law]) + ['-'])[:3]
        self.states = tuple(['U ' + b for b in self.dc_names] + ['I ' + self.lname[j] for j in self.lL] + ['If ' + self.lname[j] for j in self.lD] +
                            [f'{n}.{s}' for n in self.st_names[:ng] for s in STATION_STATES] +
                            [f'{n}.{s}' for n in self.st_names[ng:ng + nf] for s in VF_STATES] + [f'{n}.p' for n in self.dd_names] +
                            [f'{q["name"]}.x{k + 1}' for q in self.src for k in range(len(q['tau']))] +
                            [f'{n}.{s}' for n, ss in zip(self.st_names[ng + nf:], mst) for s in ss])
        self._pf = (conv, dres)
        # 5.1.1: the blocking of the stations (THEORY §8ΩΦ): by the protection of the MMCC (prot) or by an event ('block',
        # 'deblock'); the blocks, the DC reactors of blocked stations and the states to set to zero at a block (System._fix).
        # A device without protection and without such an event computes nothing of it (can_block False)
        self.has_prot = any(bool(np.any(p[q]['prot'] > 0)) for q in ('g', 'f', 'm'))
        self.can_block = self.has_prot
        self._blocks_reset()

    def _blocks_reset(self):
        """5.1.1: every station deblocked, and the state of the protection as at the start."""
        p = self.p
        for q, n in (('g', self.ng), ('f', self.nf), ('m', self.nm)):
            p[q]['blk'] = np.zeros(n)
        self.lblk = np.zeros(len(self.lines), bool)
        self._zero = []
        ns = len(self.st_names)
        self.pr = {'uv': np.zeros(ns, bool), 'lat': np.zeros(ns, bool), 'out': np.zeros(ns, bool), 'rel': np.full(ns, np.inf),
                   'trip': np.full(ns, np.inf), 'by': [None] * ns}
        self.can_block = self.has_prot

    def _block(self, q, j, on):
        """5.1.1: block (on) or deblock the station j of group q ('g', 'f', 'm'), as the blocking of the MMC in the EMT: no
        current on its AC side; a station that controls a current holds the integrals of its outer and inner controls, and its
        currents are zero from the block (System._fix), so that a deblock starts from zero current with the integrals where they
        were, as the MMCC; a station that forms its island's voltage holds the integral of its AC voltage; a grid-forming station
        gives no current, and its law sees P = Q = 0 (the GFMC of the EMT measures zero currents). A station with its DC reactor
        (L_dc, Model 4) has the switch to its capacitance open: no current through L_dc, the capacitance keeps its voltage."""
        s = self.p[q]
        s['blk'][j] = 1.0 if on else 0.0
        self.can_block = True
        if s['hasL'][j]:
            ln = int(s['ln'][j])
            self.lblk[ln] = bool(on)
            if on:
                self._zero += [int(i) for i in self.i_l[self.lL == ln]] + [int(i) for i in self.i_lf[self.lD == ln]]
        if on and q == 'g':
            self._zero += [int(self.i_g[j, 4]), int(self.i_g[j, 5])]

    def _protection(self, x, Vr, Vi, t):
        """5.1.1: the protection of the MMCC of each station with prot, decided at the point (x, V) at t, the start of a step
        (as the limits): the AC voltage |V| of its bus below V_uv blocks it (if not blocked) and holds; when |V| is back, a
        deblock t_uv later (the integrator of the EMT falls from 1 at 1/t_uv), cancelled if |V| falls again; |I_dc| at its
        terminals (P_t/U_dc, pu of S_n/U_n) above I_dc,max blocks it for good, and t_cb later opens its AC breaker (the station
        out). Only after t_prot (t > t_prot, as the EMT). Returns (the events now: {'t', 'kind': 'block' | 'deblock' | 'gen',
        'gen', 'by': 'prot', 'why': 'uv' | 'oc' | 'brk'}, the later times at which to look again)."""
        o = self._core(x, Vr, Vi, t)[3]
        P, now, later = self.pr, [], []
        for q, off, n in (('g', 0, self.ng), ('f', self.ng, self.nf), ('m', self.ng + self.nf, self.nm)):
            if not n:
                continue
            s = self.p[q]
            for j in range(n):
                if not (s['prot'][j] > 0 and s['on'][j] > 0 and t > s['tprot'][j] + 1e-12):
                    continue
                i, nm = off + j, self.st_names[off + j]
                blk = s['blk'][j] > 0

                def ev(kind, why):
                    return {'t': t, 'kind': kind, 'gen': nm, 'by': 'prot', 'why': why}
                v = float(np.real(o[q]['V'][j]))
                I = abs(float(np.real(o[q]['Pt'][j]))) / max(float(np.real(o[q]['Udc'][j])), 0.05) * s['k'][j]
                if not P['lat'][i] and I > s['Idcmax'][j]:
                    P['lat'][i], P['trip'][i] = True, t + s['tcb'][j]
                    later.append(P['trip'][i])
                    if not blk:
                        now.append(ev('block', 'oc'))
                        P['by'][i], blk = 'oc', True
                if v < s['Vuv'][j]:
                    P['rel'][i] = np.inf
                    if not P['uv'][i]:
                        P['uv'][i] = True
                        if not blk:
                            now.append(ev('block', 'uv'))
                            P['by'][i], blk = 'uv', True
                elif P['uv'][i]:
                    if P['rel'][i] == np.inf:
                        P['rel'][i] = t + s['tuv'][j]
                        later.append(P['rel'][i])
                    if t >= P['rel'][i] - 1e-12:
                        P['uv'][i], P['rel'][i] = False, np.inf
                        if blk and P['by'][i] == 'uv' and not P['lat'][i]:
                            now.append(ev('deblock', 'uv'))
                            P['by'][i] = None
                if P['lat'][i] and not P['out'][i] and t >= P['trip'][i] - 1e-12:
                    P['out'][i] = True
                    now.append(ev('gen', 'brk'))
        return now, [tq for tq in later if tq > t + 1e-12]

    # -------------------------------------------------------------- the AC/DC parts
    def _loss(self, q, P, Ir, Ii):
        """The losses of the stations of group q (pu of S_base): R_c·|I|² and a + b·I + c·I² (I in A, c_rec while it takes
        power from the AC grid, c_inv while it gives), as the station of the load flow (pcl.dcgrid.station)."""
        s = self.p[q]
        I2 = Ir * Ir + Ii * Ii                      # pu of S_base and of the bus base
        IA = np.sqrt(I2 + 1e-30) * s['Ib']
        c = np.where(_re(P) > 0, s['lc'][:, 0], s['lc'][:, 1])
        return s['Rc'] * I2 + s['la'] + (s['lb'] * IA + c * IA * IA) / self.Sb

    def _source(self, q, u, t):
        """5.0.16: the current of a source into its bus (pu of S_base/U_n) as its expression gives it now, before its lags."""
        v = [u[b] * self.Un[b] for b in q['ins']] + q['pars']
        return q['k'] * q['gain'] * _expr(q['ast'], v, t) * self.Un[q['bus']] / self.Sb

    def _core(self, x, Vr, Vi, t=0.0):
        p, g, f, d = self.p, self.p['g'], self.p['f'], self.p['d']
        ng, nf, nm = self.ng, self.nf, self.nm
        u = x[self.i_u]
        F = 0 * x
        Idc = 0 * u                                         # the currents into each DC bus (pu)
        out = {}
        # the lines
        il = 0 * self.lr + 0 * u[:1].sum()
        if len(self.lL):
            il[self.lL] = x[self.i_l]
            dmp = 0 * il
            if len(self.lD):                                # the active damping: R_d·(i − its low-pass at f_d)
                dmp[self.lD] = self.lrd[self.lD] * (il[self.lD] - x[self.i_lf])
                F[self.i_lf] = self.lwf[self.lD] * (il[self.lD] - x[self.i_lf])
            F[self.i_l] = (u[self.la[self.lL]] - u[self.lb[self.lL]] - self.lr[self.lL] * x[self.i_l] - dmp[self.lL]) / self.ll[self.lL]
            if self.can_block and self.lblk.any():          # 5.1.1: the DC reactor of a blocked station: no current (zero from the block)
                F[self.i_l] = np.where(self.lblk[self.lL], 0 * F[self.i_l], F[self.i_l])
                if len(self.lD):
                    F[self.i_lf] = np.where(self.lblk[self.lD], 0 * F[self.i_lf], F[self.i_lf])
        if len(self.lR):
            il[self.lR] = (u[self.la[self.lR]] - u[self.lb[self.lR]]) / self.lr[self.lR]
        il = il * p['lon']
        np.add.at(Idc, self.la, -il)
        np.add.at(Idc, self.lb, il)
        Idc = Idc - self.g * u
        out['il'] = il
        Ir = 0 * np.zeros(ng + nf + nm) + 0 * u[:1].sum()
        Ii = 0 * np.zeros(ng + nf + nm) + 0 * u[:1].sum()
        if ng:
            X = x[self.i_g]
            vr, vi = Vr[:ng], Vi[:ng]
            ph, xi, xd, xq, idx_, iqx, zd, zq = (X[:, j] for j in range(8))
            c, s = np.cos(ph), np.sin(ph)
            vd, vq = vr * c + vi * s, -vr * s + vi * c
            vm = _hyp(vr, vi)
            e = vq / _floor(vm, 1e-6)
            F0, F1 = g['Kp'] * e + xi, g['Ki'] * e
            ud = u[g['dcm']]
            vdn = _floor(vd, 0.1)
            on = g['on']
            # the references of the outer controls (the MMCC of the EMT): d from P, V_dc or droop, q from Q or V_ac
            vref = g['Vref'] + g['dV']
            erV = vref - ud
            isV = g['mode'] == 1
            # 5.0.17: the limiter of the DC overvoltage (ovl, the modes P and droop), decided at the start of the step
            ova = self._hold('ov')(_re(ud), 1.0 + 0 * _re(ud), -np.inf, g['Vdcmax']) & (g['ovl'] > 0) & ~isV
            ovo = np.where(ova, ud - g['Vdcmax'], 0 * ud)
            idr = np.where(isV, g['kpv'] * erV + xd, xd / vdn - g['kov'] * ovo)
            iqr = np.where(g['qv'], xq, -xq / vdn)
            # the current limit with the priority to P (EMTP Fig. 20, as the EMT)
            idl = _clip(idr, -g['Idlim'], g['Idlim'])
            qm = np.sqrt(_floor(g['Ilim'] ** 2 - idl * idl, 0.0) + 0 * idl)
            iql = np.where(_re(iqr) > _re(qm), qm, np.where(_re(iqr) < -_re(qm), -qm, iqr))
            # the currents into the converter: the lag of the inner control (τ = T_i/3; 0: the reference itself)
            i_d, Fid = _lag(idx_, idl, g['tau'])
            i_q, Fiq = _lag(iqx, iql, g['tau'])
            ed, eq = idl - idx_, iql - iqx
            Lx = np.where(g['pi'], g['Lx'], 1.0)
            Fid = np.where(g['pi'], (g['kpi'] * ed + zd - g['R'] * idx_) / Lx, Fid)
            Fiq = np.where(g['pi'], (g['kpi'] * eq + zq - g['R'] * iqx) / Lx, Fiq)
            Fzd = np.where(g['pi'], g['kii'] * ed, 0 * ed)
            Fzq = np.where(g['pi'], g['kii'] * eq, 0 * eq)
            pin, qin = vd * i_d + vq * i_q, -vd * i_q + vq * i_d
            erP = g['Pref'] + g['dP'] - pin + np.where(g['mode'] == 2, erV / np.where(g['mode'] == 2, g['kd'], 1.0), 0.0)
            rd = np.where(isV, g['kiv'] * erV, 3 / g['Tp'] * erP)
            rq = np.where(g['qv'], 3 / (g['Tvac'] * g['Xpcc']) * (g['Vacref'] + g['dVac'] - vm), 3 / g['Tq'] * (g['Qref'] - qin))
            # held while the limit holds the reference and the error would drive it further (d ↑ with x_d; q: Q ↓ with x_q)
            hd = self._hold('xd')(_re(idr - idl), _re(rd), -1e-12, 1e-12)
            hq = self._hold('xq')(_re(iqr - iql), _re(np.where(g['qv'], rq, -rq)), -1e-12, 1e-12)
            Fxd = np.where(hd | ova, 0 * rd, rd)
            Fxq = np.where(hq, 0 * rq, rq)
            onb = on
            if self.can_block:                              # 5.1.1: blocked: the integrals and the currents (zero from the block) held,
                nb = 1.0 - g['blk']                         # the PLL follows the voltage (as the EMT), no losses
                Fxd, Fxq, Fid, Fiq, Fzd, Fzq = Fxd * nb, Fxq * nb, Fid * nb, Fiq * nb, Fzd * nb, Fzq * nb
                onb = on * nb
            ir_in, ii_in = i_d * c - i_q * s, i_d * s + i_q * c
            Pin = (vr * ir_in + vi * ii_in) / g['k']       # into the converter, pu of S_base
            Ir[:ng], Ii[:ng] = -ir_in / g['k'] * on, -ii_in / g['k'] * on
            Pdc = (Pin - self._loss('g', Pin, ir_in / g['k'], ii_in / g['k'])) * onb
            np.add.at(Idc, g['dcb'], Pdc / _floor(u[g['dcb']], 0.05))
            Fg = np.stack([F0, F1, Fxd, Fxq, Fid, Fiq, Fzd, Fzq], axis=1) * on[:, None]
            F[self.i_g] = Fg
            out['g'] = {'P': -Pin * on, 'Q': -(vi * ir_in - vr * ii_in) / g['k'] * on, 'Pdc': Pdc, 'V': vm, 'Udc': ud,
                        'id': i_d * on, 'iq': i_q * on, 'I': _hyp(i_d, i_q) * on, 'omega': 1 + F0 / self.wb,
                        'limited': np.where((_re(_hyp(idr, iqr)) > _re(_hyp(idl, iql)) + 1e-9), 1.0, 0.0) * onb}
            if self.can_block:
                out['g']['blocked'] = g['blk'] + 0 * vm
        if nf:
            X = x[self.i_f]
            xv, ilf = X[:, 0], X[:, 1]
            vr, vi = Vr[ng:ng + nf], Vi[ng:ng + nf]
            vm = _hyp(vr, vi)
            on = f['on']
            Zr, Zx = f['R'], f['X']
            z2 = Zr * Zr + Zx * Zx
            yr, yx = Zr / z2, -Zx / z2                      # 1/Z
            cw, sw = np.cos(f['th']), np.sin(f['th'])
            wr, wi = vr * cw + vi * sw, -vr * sw + vi * cw  # v·e^(−jθ)
            rvz = wr * yr - wi * yx                         # Re(v·e^(−jθ)/Z)
            vref = f['Vref'] + f['dV']
            E = (vref + xv + f['kdv'] * (rvz - ilf)) / (1 + f['kdv'] * yr)
            # the current out of the station: (E·e^(jθ) − v)/Z
            Wr, Wi = E * cw - vr, E * sw - vi
            ior, ioi = Wr * yr - Wi * yx, Wr * yx + Wi * yr
            if self.can_block:                              # 5.1.1: blocked: no current, the integral of the AC voltage held
                nbf = 1.0 - f['blk']
                ior, ioi = ior * nbf, ioi * nbf
            idin = -(ior * cw + ioi * sw)                   # the d current into the converter (the frame θ)
            Fxv = 3 / f['Tvf'] * (vref - vm)
            Fxv = np.where(self._hold('xv')(_re(xv), _re(Fxv), -1.0, 1.0), 0 * Fxv, Fxv)
            if self.can_block:
                Fxv = Fxv * nbf
            Fil = (idin - ilf) * (2 * math.pi * 10.0)
            Pin = -(vr * ior + vi * ioi) / f['k']
            Ir[ng:ng + nf], Ii[ng:ng + nf] = ior / f['k'] * on, ioi / f['k'] * on
            Pdc = (Pin - self._loss('f', Pin, ior / f['k'], ioi / f['k'])) * (on * nbf if self.can_block else on)
            np.add.at(Idc, f['dcb'], Pdc / _floor(u[f['dcb']], 0.05))
            F[self.i_f] = np.stack([Fxv, Fil], axis=1) * on[:, None]
            out['f'] = {'P': -Pin * on, 'Q': (vi * ior - vr * ioi) / f['k'] * on, 'Pdc': Pdc, 'V': vm, 'Udc': u[f['dcm']], 'E': E,
                        'I': _hyp(ior, ioi) * on, 'omega': 1.0 + 0 * vm, 'limited': 0 * vm}
            if self.can_block:
                out['f']['blocked'] = f['blk'] + 0 * vm
        if nm:                                              # 5.0.18: the grid-forming stations, by the law of each
            pm = p['m']
            vr, vi = Vr[ng + nf:], Vi[ng + nf:]
            dt = np.result_type(x, vr, vi)
            ir, ii = np.zeros(nm, dt), np.zeros(nm, dt)
            o = {q: np.zeros(nm, dt) for q in ('P', 'Q', 'w', 'E')}
            lim = np.zeros(nm, bool)
            Fm = np.zeros((nm, 3), dt)
            for cv, ix in self.gfm:
                cv.p['on'], cv.p['dP'], cv.p['dV'] = pm['on'][ix], pm['dP'][ix], pm['dV'][ix]
                cv.p['blk'] = pm['blk'][ix] if self.can_block else None        # 5.1.1: a blocked station (Converter._gfm)
                Fc, ir[ix], ii[ix], oc = cv._core(x[self.i_m[ix, :cv.nx]], vr[ix], vi[ix])
                for j, fj in enumerate(Fc):
                    Fm[ix, j] = fj
                for q in o:
                    o[q][ix] = oc[q]
                lim[ix] = np.asarray(oc['lim'], bool)
            on, k = pm['on'], pm['k']
            F[self.i_m] = Fm * on[:, None]
            Ir[ng + nf:], Ii[ng + nf:] = ir / k * on, ii / k * on       # out of the station into its bus
            Pin = -o['P'] / k * on                          # into the converter, pu of S_base
            Pdc = (Pin - self._loss('m', Pin, ir / k, ii / k)) * (on * (1.0 - pm['blk']) if self.can_block else on)
            np.add.at(Idc, pm['dcb'], Pdc / _floor(u[pm['dcb']], 0.05))
            out['m'] = {'P': -Pin, 'Q': o['Q'] / k * on, 'Pdc': Pdc, 'V': _hyp(vr, vi), 'Udc': u[pm['dcm']], 'E': o['E'],
                        'I': _hyp(ir, ii) * on, 'omega': o['w'], 'limited': np.where(lim, 1.0, 0.0) * on}
            if self.can_block:
                out['m']['blocked'] = pm['blk'] + 0 * _hyp(vr, vi)
        if self.nk:
            pk = x[self.i_d]
            pd, Fp = _lag(pk, (d['Pref'] + d['dP']) * d['on'], d['Tdc'])
            F[self.i_d] = Fp
            np.add.at(Idc, d['a'], -pd / _floor(u[d['a']], 0.05))
            np.add.at(Idc, d['b'], pd / _floor(u[d['b']], 0.05))
            out['d'] = {'P': pd}
        if self.src:                                        # 5.0.16: the current sources
            Is = []
            for j, q in enumerate(self.src):
                if q['ast'] is None:
                    i = q['I'] + 0 * u[0]
                else:
                    i = self._source(q, u, t)
                    for k, T in enumerate(q['tau']):
                        F[q['x'][k]] = (i - x[q['x'][k]]) / T
                        i = x[q['x'][k]]
                i = i * p['s']['on'][j]
                Idc[q['bus']] = Idc[q['bus']] + i
                Is.append(i)
            out['s'] = {'I': Is}
        F[self.i_u] = Idc / self.c
        out['Idc'] = Idc
        # the power at the terminals of each station into the DC grid (as the EMT measures it): through L_dc, or the
        # converter's less the charging of its own capacitance on the bus
        for q in ('g', 'f', 'm'):
            if q in out:
                s_ = p[q]
                um = u[s_['dcm']]
                thru = um * il[s_['ln']] if len(il) else 0 * um
                out[q]['Pt'] = np.where(s_['hasL'], thru, out[q]['Pdc'] - s_['cs'] * um * F[self.i_u][s_['dcm']])
        return F, Ir, Ii, out

    # -------------------------------------------------------------- start and evaluation
    def init(self, V, wb):
        """From the AC/DC load flow (pcl.dcgrid.acdc_flow): every derivative zero."""
        conv, dres = self._pf
        p, g, f, d = self.p, self.p['g'], self.p['f'], self.p['d']
        Sb = self.Sb
        x = np.zeros(self.nx)
        u = np.array([dres['buses'][b]['U'] if b in dres['buses'] else math.nan for b in self.dc_names]) / self.Un
        p['lon'] = np.ones(len(self.lines))
        # the internal node of a station with L_dc: at the start the voltage of its bus, the current of the station's power
        iL = np.array([(u[a] - u[b]) / r if r > 0 else 0.0 for a, b, r in zip(self.la, self.lb, self.lr)])
        for e in self.gs + self.vf + self.gm:
            if e['name'] in self.st_line:
                l = self.st_line[e['name']]
                u[self.la[l]] = u[self.lb[l]]
                iL[l] = conv[e['name']]['Pdc'] / Sb / u[self.lb[l]]
        x[self.i_u] = u
        if len(self.lL):
            x[self.i_l] = iL[self.lL]
            x[self.i_lf] = iL[self.lD]
        Vs = V[self.bus]
        for j, e in enumerate(self.gs):
            c = conv[e['name']]
            Ss = complex(c['Ps'], c['Qs']) / g['Sn'][j]                    # given to the AC bus, pu of S_n
            v = Vs[j]
            iin = -np.conj(Ss / v)                                          # into the converter
            ph = cmath.phase(v)
            idq = iin * cmath.exp(-1j * ph)
            vd = abs(v)
            pin = (v * np.conj(iin)).real
            X = np.zeros(8)
            X[0] = ph
            X[4], X[5] = idq.real, idq.imag
            if g['pi'][j]:                                                 # the integrals of the inner PI hold R·i
                X[6], X[7] = g['R'][j] * idq.real, g['R'][j] * idq.imag
            m = g['mode'][j]
            if m == 1:                                                     # V_dc: the integral is the current
                g['Vref'][j] = g['Vref'][j] if not math.isnan(g['Vref'][j]) else e['V']
                X[2] = idq.real - g['kpv'][j] * (g['Vref'][j] - u[g['dcm'][j]])
            else:
                X[2] = idq.real * max(vd, 0.1)
                if math.isnan(g['Vref'][j]):
                    g['Vref'][j] = e['V']
                if math.isnan(g['Pref'][j]):                               # so that the integral rests at the start
                    dr = (g['Vref'][j] - u[g['dcm'][j]]) / g['kd'][j] if m == 2 else 0.0
                    g['Pref'][j] = pin - dr
            if g['qv'][j]:
                X[3] = idq.imag
                if math.isnan(g['Vacref'][j]):
                    g['Vacref'][j] = vd
            else:
                X[3] = -idq.imag * max(vd, 0.1)
                if math.isnan(g['Qref'][j]):
                    g['Qref'][j] = -vd * idq.imag                         # into the converter (v_q = 0 on the PLL)
            x[self.i_g[j]] = X
        for j, e in enumerate(self.vf):
            c = conv[e['name']]
            Ss = complex(c['Ps'], c['Qs']) / f['Sn'][j]
            v = Vs[self.ng + j]
            iout = np.conj(Ss / v)
            Z = f['R'][j] + 1j * f['X'][j]
            Ec = v + Z * iout
            f.setdefault('th', np.zeros(self.nf))[j] = cmath.phase(Ec)
            if math.isnan(f['Vref'][j]):
                f['Vref'][j] = abs(v)
            idin = (-iout * cmath.exp(-1j * cmath.phase(Ec))).real
            x[self.i_f[j]] = [abs(Ec) - f['Vref'][j], idin]
        f.setdefault('th', np.zeros(self.nf))
        # 5.0.18: a grid-forming station as its converter of pcl.rms from the injection of the load flow (its references, if not
        # given, so that it rests there; with the references of a drawing, as the EMT, it does not rest: the states of its law
        # given; our choice): the EMF continuous at t = 0 and, for droop, ω = 1 there (P_f = P_ref, Q_f from E; PSC: x_E from E)
        for cv, ix in self.gfm:
            S = np.array([complex(conv[self.gm[j]['name']]['Ps'], conv[self.gm[j]['name']]['Qs']) for j in ix]) / Sb
            v, q = Vs[self.ng + self.nf + ix], cv.p
            given = {k: ~np.isnan(q[k]) for k in ('Pref', 'Qref', 'Vref')}
            X = cv.init(v, S, wb)
            E = np.abs(v + (q['Rf'] + q['Rv'] + 1j * (q['Xc'] + q['Xv'])) * np.conj(S * q['k'] / v))
            if cv.law == 'droop':
                X[:, 1] = np.where(given['Pref'], q['Pref'], X[:, 1])
                X[:, 2] = np.where(given['Vref'], q['Qref'] + (q['Vref'] - E) / q['nq'], X[:, 2])
            elif cv.law == 'psc' and cv.avc:
                X[:, 1] = np.where(given['Vref'], np.clip(E - q['Vref'], -0.5, 0.5), X[:, 1])
            x[self.i_m[ix, :cv.nx]] = X
        for j, e in enumerate(self.dd):
            P = dres['dcdc'][e['name']]['P'] / Sb
            d['Pref'][j] = P
            x[self.i_d[j]] = P
        for q in self.src:                                  # 5.0.16: the lags of a source at its value at the start
            if q['ast'] is not None and len(q['x']):
                x[q['x']] = self._source(q, u, 0.0)
        p['s'] = {}
        for q, n in (('g', self.ng), ('f', self.nf), ('d', self.nk), ('s', len(self.src)), ('m', self.nm)):
            p[q]['on'], p[q]['dP'], p[q]['dV'] = np.ones(n), np.zeros(n), np.zeros(n)
        g['dVac'] = np.zeros(self.ng)
        self._blocks_reset()
        self.x_start = x.copy()
        return x[None, :]

    def eval(self, X, Vr, Vi, t):
        F, Ir, Ii, _ = self._core(X[0], Vr, Vi, t - self.left)
        return F[None, :], Ir, Ii

    def outputs(self, X, Vr, Vi, t=0.0):
        return self._core(X[0], Vr, Vi, t)[3]

    def limits(self):
        out = [(int(j), 0.0, -1.0, 1.0, np.ones(1, bool)) for j in self.i_f[:, 0]] if self.nf else []
        for cv, ix in self.gfm:                             # 5.0.18: x_E of a PSC with the control of the AC voltage
            out += [(int(self.i_m[j, i]), base, lo, hi, np.ones(1, bool)) for i, base, lo, hi, _ in cv.limits() for j in ix]
        return out

    def find(self, name):
        """(group, index) of a station or DC/DC converter by its name."""
        if name in self.st_names:
            j = self.st_names.index(name)
            return ('g', j) if j < self.ng else ('f', j - self.ng) if j < self.ng + self.nf else ('m', j - self.ng - self.nf)
        if name in self.dd_names:
            return 'd', self.dd_names.index(name)
        if name in self.sr_names:                           # 5.0.16: a current source (only 'gen': it stops)
            return 's', self.sr_names.index(name)
        return None


# ---------------------------------------------------------------- 5.1.4: the wind turbines of IEC 61400-27-1 (ROADMAP §101, THEORY §8ΩΨ)
# The generic models of type 4A (the full converter without the aerodynamic and mechanical parts) and type 4B (with the two-mass
# drive train and a constant aerodynamic torque) of IEC 61400-27-1:2020 (§6.2.5, the modules of §7 and the blocks of Annex D),
# each as one device on the bus of a generator of the network (its injection from the load flow), per unit on the rating S_n
# of the turbine (or of the aggregate). The standard gives no parameter values: WT_DEFAULTS are ours (time constants of at
# least 0,01 s, the rule of §5.1 for a step of 5 ms). Not here: the electrical system as more than its breaker (r_es, x_es,
# g_es, b_es zero: the transformer is in the network, as §7.5.1 says it normally is), the hooks (zero), the type 3A generator
# system in a type 4 model, the plant control (§7.9) and the types 1–3. K_qv: in the convention of §3.1.5 (i_q > 0 generates Q)
# and with Δu the washout of u_WTCfilt as in Fig. 34, a dip gives Δu < 0, so a current injected in a dip needs K_qv < 0 (our
# reading of the figure; our default −2, the injection of 2 pu per pu of the grid codes).
WT_DEFAULTS = {
    'Tpfilt': 0.01, 'Tqfilt': 0.01, 'Tufilt': 0.01,                         # grid measurement for control (§7.8.2)
    'TPLL': 0.01, 'uPLL1': 0.1, 'uPLL2': 0.05,                              # reference frame rotation (§7.4.5)
    'Tg': 0.01, 'dipmax': 99.0, 'diqmax': 99.0, 'diqmin': -99.0,            # type 4 generator system (§7.4.4)
    'Tpordp': 0.01, 'dpmaxp': 1.0, 'TpWTref': 0.05, 'dprefmax': 1.0,        # P control 4A (§7.7.3) and 4B (§7.7.4)
    'dprefmin': -1.0, 'MpUscale': 0.0, 'updip': 0.9, 'Tpaero': 0.05,
    'HWTR': 2.5, 'Hgen': 0.5, 'kdrt': 100.0, 'cdrt': 1.0,                   # two-mass (§7.3.1)
    'MqG': 1.0, 'MqFRT': 1.0, 'KPq': 0.0, 'KIq': 0.5, 'KPu': 1.0,           # Q control (§7.7.5)
    'KPuFRT': 0.0, 'KIu': 20.0, 'udb1': -0.1, 'udb2': 0.1, 'Tuss': 30.0, 'Kqv': -2.0, 'umax': 1.1, 'umin': 0.9, 'uref0': 0.0,
    'uqdip': 0.9, 'uqrise': 1.1, 'Tqord': 0.05, 'Tpost': 0.0, 'iqmax': 1.05, 'iqmin': -1.05, 'iqh1': 1.05, 'iqpost': 0.0,
    'rdrop': 0.0, 'xdrop': 0.0,
    'imax': 1.1, 'imaxdip': 1.1, 'Mqpri': 1.0, 'upqumax': 1.1, 'Kpqu': 20.0,  # current limitation (§7.7.6)
    'qmax': 0.33, 'qmin': -0.33,                                            # constant Q limitation (§7.7.7)
    'prot': 0.0, 'uover': 1.15, 'uunder': 0.85, 'fover': 1.03, 'funder': 0.95,   # grid protection (§7.8.1), off from the API
    'Tufiltp': 0.01, 'Tffilt': 0.1, 'dPhimax': 0.1, 'Ts': 0.005,            # its measurement (§7.8.2); T_s of Table 12
}
# the lookup tables (x, y), as lists of pairs: the voltage dependency of the current limits (§7.7.6, Table 32), the QP and QU
# limitation (§7.7.8: used with 'qlim': 'qpqu'), and the disconnection times of the protection (§7.8.1, Table 35)
WT_TABLES = {
    'ipmaxu': [[0.0, 1.1], [1.0, 1.1]], 'iqmaxu': [[0.0, 1.05], [1.0, 1.05]],
    'qmaxp': [[0.0, 0.33], [1.0, 0.33]], 'qminp': [[0.0, -0.33], [1.0, -0.33]],
    'qmaxu': [[0.9, 0.33], [1.1, 0.33]], 'qminu': [[0.9, -0.33], [1.1, -0.33]],
    'Tuover': [[1.15, 1.0], [1.3, 0.1]], 'Tuunder': [[0.0, 0.15], [0.85, 3.0]],
    'Tfover': [[1.03, 0.1], [1.05, 0.1]], 'Tfunder': [[0.95, 0.1], [0.97, 0.1]],
}
WIND_MODELS = ('wt4a', 'wt4b')
WT_STATES = {'wt4a': ('pf', 'qf', 'uf', 'phi', 'ip', 'iq', 'pr', 'po', 'qi', 'qo', 'ui', 'us'),
             'wt4b': ('pf', 'qf', 'uf', 'phi', 'ip', 'iq', 'pl', 'po', 'pa', 'wr', 'wg', 'tk', 'qi', 'qo', 'ui', 'us')}
WT_PROT_STATES = ('up', 'fa', 'fr', 'ff')


def _lut(tab, x):
    """The lookup table of Annex D.6 on the real part of x (a complex step goes through): linear between the points, the
    nearest y outside the range (extension, not extrapolation)."""
    xs, ys = tab
    xr = float(np.real(x))
    if xr <= xs[0]:
        return ys[0] + 0 * x
    if xr >= xs[-1]:
        return ys[-1] + 0 * x
    j = int(np.searchsorted(xs, xr, side='right'))
    x0, x1, y0, y1 = xs[j - 1], xs[j], ys[j - 1], ys[j]
    return y0 + (y1 - y0) * (x - x0) / (x1 - x0)


def _luts(tabs, x):
    """The tables of the members at their x: one table for all (a tuple (xs, ys)), vectorized; else one per member."""
    if isinstance(tabs, tuple):
        xs, ys = tabs
        if len(xs) == 1:
            return ys[0] + 0 * x
        xr = _re(x)
        k = np.clip(np.searchsorted(xs, xr, side='right'), 1, len(xs) - 1)
        x0, x1, y0, y1 = xs[k - 1], xs[k], ys[k - 1], ys[k]
        v = y0 + (y1 - y0) * (x - x0) / np.where(x1 > x0, x1 - x0, 1.0)
        return np.where(xr <= xs[0], ys[0] + 0 * x, np.where(xr >= xs[-1], ys[-1] + 0 * x, v))
    return np.array([_lut(tb, xi) for tb, xi in zip(tabs, x)])


def _ang(w_r, w_i):
    """The angle of w (−π, π) as 2·atan(Im/(|w| + Re)): a complex step goes through."""
    return 2 * np.arctan(w_i / (_hyp(w_r, w_i) + w_r))


def _mn(a, b):
    return np.where(_re(a) <= _re(b), a, b + 0 * a)


def _mx(a, b):
    return np.where(_re(a) >= _re(b), a, b + 0 * a)


class Wind(_Holds, Kind):
    """5.1.4: the wind turbines of IEC 61400-27-1:2020, type 4A and type 4B (THEORY §8ΩΨ), from the block diagrams of its §7
    and Annex D. The members of one Wind share the type and whether they have the grid protection; the parameters (and the
    modes M_qG, M_qFRT, M_pUscale, M_qpri) are per member, on the rating S_n.

    Grid measurement (§7.8.2): p, q and u at the terminals through T_pfilt, T_qfilt, T_ufilt. Reference frame rotation
    (§7.4.5): i = (i_p − j·i_q)·e^(jθ), θ the angle of u, or its filter through T_PLL while |u| < u_PLL1 (frozen below u_PLL2).
    Type 4 generator system (§7.4.4): i_p and i_q the lags T_g of the commands, with the ramp rates di_pmax (up), di_qmax,
    di_qmin and the limits i_pmax, i_qmax, i_qmin of the current limitation. P control 4A (§7.7.3): p_WTref through T_pWTref with
    its ramp rates, times u while u < u_pdip (M_pUscale 1), through T_pordp with the ramp dp_maxp and the limit u·i_pmax, over
    u_WTCfilt (at least 0,01). 4B (§7.7.4): p_WTref through the stand-alone ramp limiter (Annex D.4), p_aero through T_paero, and
    the power order of p·ω_gen; the two-mass drive train (§7.3.1). Q control (§7.7.5): the modes M_qG (0 voltage, 1 Q, 2 Q open
    loop, 3 power factor, 4 power factor open loop), the PI of Q (a voltage reference) and of u (a current), the voltage drop
    (1), the FRT flag F_FRT (0 normal, 1 below u_qdip or above u_qrise, 2 for T_post after a dip) that freezes the integrators,
    and the FRT injection M_qFRT (0 K_qv·Δu, 1 and 2 the pre-fault current plus K_qv·Δu, 2 with i_qpost after the dip) within
    [i_qmin, i_qh1]. Current limitation (§7.7.6): i_max (i_maxdip during the dip), the priority M_qpri, the tables i_pmax(u),
    i_qmax(u), the slope K_pqu below u_pqumax. Q limitation: constant (§7.7.7) or 'qpqu' (§7.7.8, the tables frozen with F_FRT).
    Grid protection (§7.8.1, with 'prot'): over/under voltage and frequency against their tables of disconnection time; it
    opens the breaker, and there is no reconnection; the frequency of the angle of u (s/(2πf_n), the ramp limit dΦ_max,
    T_ffilt).

    The discrete parts (the flags, the timers, the held values of a freeze) are decided at the start of each step from the
    point there (_decide, as the limits of 5.0.13). Our formulation of the blocks of Annex D in continuous time: the first order
    filter with its absolute limits (the state held at a limit while pushing outwards, and projected after the step), its
    rate limits (which side decided at the start of the step) and its freeze; the stand-alone ramp limiter (D.4) and the
    derivative of the angle as states that follow their input with the time constant T_s (the step of Table 12; our default
    5 ms): at a ramp limit the slope is exact, otherwise the output lags by T_s, as the discrete limiter does by one step."""

    def __init__(self, names, bus, p, model='wt4a', prot=False, qlim='const'):
        super().__init__(names, bus, p)
        self.model, self.prot, self.qlim = model, bool(prot), qlim
        st = list(WT_STATES[model]) + (list(WT_PROT_STATES) if prot else [])
        self.states, self.nx = tuple(st), len(st)
        self.j = {s: i for i, s in enumerate(st)}
        self.d = None

    # -------------------------------------------------------------- the decisions inside a step
    def _dec(self, key, val):
        if self._rec is not None:
            self._rec[key] = val
        if self._fz is not None and key in self._fz:
            return self._fz[key]
        return val

    def _rate(self, key, r, lo, hi):
        """A rate r within [lo, hi] (a ramp limit): which side decided at the start of the step."""
        side = self._dec(key, np.where(_re(r) > hi, 1, np.where(_re(r) < lo, -1, 0)))
        return np.where(side > 0, hi + 0 * r, np.where(side < 0, lo + 0 * r, r))

    def _flt(self, key, x, r, lo, hi):
        """The derivative r of a state x with the absolute limits [lo, hi] of Annex D.5: 0 at a limit while pushing outwards."""
        held = self._hold(key)(_re(x), _re(r), lo, hi)
        return np.where(held, 0 * r, r)

    def _d0(self, um):
        p, m = self.p, self.m
        return {'F': np.zeros(m), 'tdip': np.full(m, -math.inf), 'pll1': um < p['uPLL1'], 'pll2': um < p['uPLL2'],
                'usc': (p['MpUscale'] > 0) & (um < p['updip']), 'iqol': np.zeros(m), 'hu': np.zeros(m), 'hp': np.zeros(m),
                'tr': {q: np.full(m, math.nan) for q in ('uo', 'uu', 'fo', 'fu')}, 'ocb': np.zeros(m, bool)}

    def _snap(self):
        d = self.d
        return {**{q: v.copy() for q, v in d.items() if q != 'tr'}, 'tr': {q: v.copy() for q, v in d['tr'].items()}}

    # -------------------------------------------------------------- the model
    def _core(self, X, Vr, Vi):
        """The derivatives (in the order of the states), the current injected (pu on S_n) and the signals of the modules."""
        p, d, j = self.p, self.d, self.j
        S = lambda q: X[:, j[q]]                            # noqa: E731
        F = {}
        um = _hyp(Vr, Vi)                                   # u_WT = u_WTC: the electrical system is its breaker only
        Fl = d['F']
        frz = Fl >= 1                                       # the freeze of the Q control (F_FRT ≥ 1)
        # grid measurement for control (§7.8.2): the filters of p, q, u (p and q from the current, below)
        pf, qf, uf = S('pf'), S('qf'), S('uf')
        F['uf'] = (um - uf) / p['Tufilt']
        uf1 = _floor(uf, 0.01)
        # reference frame rotation (§7.4.5): the angle of u, or its filter while |u| < u_PLL1 (frozen below u_PLL2)
        phi = S('phi')
        cph, sph = np.cos(phi), np.sin(phi)
        e = _ang(Vr * cph + Vi * sph, Vi * cph - Vr * sph)
        F['phi'] = np.where(d['pll2'], 0 * e, e / p['TPLL'])
        um9 = _floor(um, 1e-9)
        c = np.where(d['pll1'], cph, Vr / um9)
        s = np.where(d['pll1'], sph, Vi / um9)
        # Q limitation: constant (§7.7.7) or QP and QU (§7.7.8, the inputs frozen with F_FRT)
        if self.qlim == 'qpqu':
            uq = np.where(frz, d['hu'] + 0 * uf, uf)
            pq = np.where(frz, d['hp'] + 0 * pf, pf)
            qmax = _mn(_luts(p['t_qmaxu'], uq), _luts(p['t_qmaxp'], pq))
            qmin = _mx(_luts(p['t_qminu'], uq), _luts(p['t_qminp'], pq))
        else:
            qmax, qmin = p['qmax'] + 0 * uf, p['qmin'] + 0 * uf
        # Q control (§7.7.5)
        mq, mf = p['MqG'], p['MqFRT']
        xref = p['Xref'] + p['dX']
        qref = np.where((mq == 3) | (mq == 4), pf * p['tanphi'], xref + 0 * pf)
        eq = _mx(_mn(qref, qmax), qmin) - qf
        qi = S('qi')                                        # (held in the modes that do not use it: at rest, no wind-up unseen)
        F['qi'] = np.where(frz | ((mq != 1) & (mq != 3)), 0 * eq, self._flt('qi', qi, p['KIq'] * eq, p['umin'], p['umax']))
        uref = np.where(mq == 0, p['uref0'] + xref + 0 * qi, _clip(qi, p['umin'], p['umax']) + p['KPq'] * eq)
        uref = _clip(uref, p['umin'], p['umax'])
        a1 = uf - p['rdrop'] * pf / uf1 - p['xdrop'] * qf / uf1          # the voltage drop (1)
        a2 = p['xdrop'] * pf / uf1 - p['rdrop'] * qf / uf1
        eu = uref - _hyp(a1, a2)
        ui = S('ui')
        F['ui'] = np.where(frz | (mq == 2) | (mq == 4), 0 * eu, self._flt('ui', ui, p['KIu'] * eu, p['iqmin'], p['iqmax']))
        kpu = _mx(_mn(p['KPu'] * eu, qmax / uf1), qmin / uf1)
        iq_cl = _clip(ui, p['iqmin'], p['iqmax']) + np.where(frz, p['KPuFRT'] * eu, kpu)
        qo = S('qo')
        F['qo'] = np.where(frz | ((mq != 2) & (mq != 4)), 0 * qo, self._flt('qo', qo, (qref - qo) / p['Tqord'], _re(qmin), _re(qmax)))
        iq_ol_now = _clip(_mx(_mn(qo, qmax), qmin) / uf1, p['iqmin'], p['iqmax'])
        iq_ol = np.where(frz, d['iqol'] + 0 * iq_ol_now, iq_ol_now)
        iqbase = np.where((mq == 2) | (mq == 4), iq_ol, iq_cl)
        us = S('us')
        F['us'] = (uf - us) / p['Tuss']
        du = uf - us                                        # the washout sT_uss/(1 + sT_uss) of u_WTCfilt
        dd = np.where(_re(du) < p['udb1'], du - p['udb1'], np.where(_re(du) > p['udb2'], du - p['udb2'], 0 * du))
        iqv = p['Kqv'] * dd                                 # (the dead band of Annex D.16)
        a = np.where(mf == 0, iqv, iqv + iqbase)
        f1 = _clip(a, p['iqmin'], p['iqh1'])
        f2 = _clip(np.where(mf == 2, iqbase + p['iqpost'], a), p['iqmin'], p['iqh1'])
        iqcmd = np.where(Fl == 0, iqbase, np.where(Fl == 1, f1, f2))
        # P control: the input of the lag of the power order
        pref = p['Pref'] + p['dP']
        if self.model == 'wt4a':                            # §7.7.3
            pr = S('pr')
            F['pr'] = self._rate('r_pr', (pref - pr) / p['TpWTref'], p['dprefmin'], p['dprefmax'])
            pin = np.where(d['usc'], pr * um, pr + 0 * um)
        else:                                               # §7.7.4: the stand-alone ramp limiter (D.4), p_aero, ω_gen
            pl = S('pl')
            F['pl'] = self._rate('r_pl', (pref - pl) / p['Ts'], p['dprefmin'], p['dprefmax'])
            psel = np.where(d['usc'], pl * um, pl + 0 * um)
            pa = S('pa')
            F['pa'] = (psel - pa) / p['Tpaero']
            pin = psel * S('wg')
        # current limitation (§7.7.6; M_DFSLim 0, as for type 4)
        po = S('po')
        imt = np.where(Fl == 1, p['imaxdip'], p['imax'])
        ipu, iqu = _luts(p['t_ipmaxu'], uf), _luts(p['t_iqmaxu'], uf)
        fq = (Fl * p['Mqpri']) > 0                          # F_qpri: the priority of the reactive current during the FRT
        a = _mn(po / uf1, ipu)                              # (i_pcmd as the state of the power order over u: below its limit)
        iqmax0 = _mn(np.sqrt(_floor(imt * imt - a * a, 0.0) + 0 * a), iqu)
        b = _mn(np.where(_re(iqcmd) < 0, -iqcmd, iqcmd), iqu)
        ipq = _mn(np.sqrt(_floor(imt * imt - b * b, 0.0) + 0 * b), ipu)
        iqmx = np.where(fq, iqu + 0 * iqmax0, iqmax0)
        ipmax = np.where(fq, ipq, ipu + 0 * ipq)
        iqmin_c = -iqmx
        v = _mn(iqmx, p['Kpqu'] * (p['upqumax'] - uf))
        iqmax_c = np.where(_re(iqmin_c) < _re(v), v, iqmin_c)
        # the power order through T_pordp with its ramp dp_maxp and its limit u·i_pmax, over u_WTCfilt
        plim = um * ipmax
        rpo = self._rate('r_po', (pin - po) / p['Tpordp'], -math.inf, p['dpmaxp'])
        F['po'] = self._flt('po', po, rpo, -math.inf, _re(plim))
        ipcmd = _mn(po, plim) / uf1
        # type 4 generator system (§7.4.4): the lags of the commands with their ramp rates and the limits of the current limitation
        ip, iq = S('ip'), S('iq')
        rip = self._rate('r_ip', (ipcmd - ip) / p['Tg'], -math.inf, p['dipmax'])
        F['ip'] = self._flt('ip', ip, rip, -math.inf, _re(ipmax))
        riq = self._rate('r_iq', (iqcmd - iq) / p['Tg'], p['diqmin'], p['diqmax'])
        F['iq'] = self._flt('iq', iq, riq, _re(iqmin_c), _re(iqmax_c))
        ipo = _mn(ip, ipmax)
        iqo = _mx(_mn(iq, iqmax_c), iqmin_c)
        ir, ii = ipo * c + iqo * s, ipo * s - iqo * c       # i = (i_p − j·i_q)·e^(jθ): p = |u|·i_p, q = |u|·i_q
        P, Q = Vr * ir + Vi * ii, Vi * ir - Vr * ii
        F['pf'] = (P - pf) / p['Tpfilt']
        F['qf'] = (Q - qf) / p['Tqfilt']
        o = {'P': P, 'Q': Q, 'V': um, 'ip': ipo, 'iq': iqo, 'ipcmd': ipcmd, 'iqcmd': iqcmd, 'ipmax': ipmax, 'iqmax': iqmax_c,
             'iqmin': iqmin_c, 'iqol': iq_ol_now, 'uf': uf, 'pf': pf, 'plim': plim, 'qmax': qmax, 'qmin': qmin}
        if self.model == 'wt4b':                            # the two-mass drive train (§7.3.1), p_ag = p (no losses)
            wr, wg, tk = S('wr'), S('wg'), S('tk')
            tau = p['cdrt'] * (wr - wg) + tk
            F['wr'] = (pa / _floor(wr, 0.1) - tau) / (2 * p['HWTR'])
            F['wg'] = (tau - P / _floor(wg, 0.1)) / (2 * p['Hgen'])
            F['tk'] = p['kdrt'] * (wr - wg)
            o['wgen'], o['wtr'], o['paero'] = wg, wr, pa
        if self.prot:                                       # the measurement for the protection (§7.8.2)
            up = S('up')
            F['up'] = (um - up) / p['Tufiltp']
            fa = S('fa')
            ea = _ang(Vr * np.cos(fa) + Vi * np.sin(fa), Vi * np.cos(fa) - Vr * np.sin(fa)) / p['Ts']
            F['fa'] = ea                                    # the angle followed with T_s: its derivative ea, rad/s
            fr = S('fr')
            F['fr'] = self._rate('r_fr', (ea / p['w0'] - fr) / p['Ts'], -p['dPhimax'], p['dPhimax'])
            ff = S('ff')
            F['ff'] = (fr - ff) / p['Tffilt']
            o['up'], o['fP'] = up, 1.0 + ff
        return [F[q] for q in self.states], ir, ii, o

    # -------------------------------------------------------------- start, the decisions, the evaluation
    def init(self, V, S, wb):
        p, m, j = self.p, self.m, self.j
        p['w0'] = wb
        k = p['k']
        s = S * k                                           # on S_n
        um = np.abs(V)
        P0, Q0 = s.real, s.imag
        if np.any(um < 0.5):
            raise RMSError('ανεμογεννήτρια με |V| < 0,5 pu στη ροή φορτίου: ' + ', '.join(self.names))
        self.d = self._d0(um)
        p['dP'], p['dX'] = np.zeros(m), np.zeros(m)
        p.setdefault('on', np.ones(m))
        X = np.zeros((m, self.nx))
        ip0, iq0 = P0 / um, Q0 / um
        X[:, j['pf']], X[:, j['qf']], X[:, j['uf']] = P0, Q0, um
        X[:, j['phi']] = np.angle(V)
        X[:, j['ip']], X[:, j['iq']] = ip0, iq0
        usc = self.d['usc']
        pr0 = np.where(usc, P0 / um, P0)
        p['Pref'] = np.where(np.isnan(p['Pref']), pr0, p['Pref'])
        if self.model == 'wt4a':
            X[:, j['pr']] = p['Pref']
        else:
            X[:, j['pl']], X[:, j['pa']] = p['Pref'], P0
            X[:, j['wr']], X[:, j['wg']], X[:, j['tk']] = 1.0, 1.0, P0
        X[:, j['po']] = P0
        # the Q control at rest: the reference of its mode, its integrators where the errors are zero
        uf1 = np.maximum(um, 0.01)
        a1 = um - p['rdrop'] * P0 / uf1 - p['xdrop'] * Q0 / uf1
        a2 = p['xdrop'] * P0 / uf1 - p['rdrop'] * Q0 / uf1
        ucomp = np.hypot(a1, a2)
        mq = p['MqG']
        p['tanphi'] = np.where(np.abs(P0) > 0, Q0 / np.where(np.abs(P0) > 0, P0, 1.0), 0.0)
        x0 = np.where(mq == 0, ucomp - p['uref0'], Q0)
        p['Xref'] = np.where(np.isnan(p['Xref']), np.where((mq == 3) | (mq == 4), 0.0, x0), p['Xref'])
        X[:, j['qi']] = ucomp
        X[:, j['ui']] = iq0
        X[:, j['qo']] = Q0
        X[:, j['us']] = um
        self.d['iqol'] = iq0.copy()
        self.d['hu'], self.d['hp'] = um.copy(), P0.copy()
        if self.prot:
            X[:, j['up']], X[:, j['fa']], X[:, j['fr']], X[:, j['ff']] = um, np.angle(V), 0.0, 0.0
        self.d_init = self._snap()
        # what cannot be at rest
        F, ir, ii, o = self._core(X, V.real, V.imag)
        bad = []
        closed = (mq == 0) | (mq == 1) | (mq == 3)
        for i, nm in enumerate(self.names):
            if closed[i] and not (p['umin'][i] - 1e-9 <= (ucomp[i] if mq[i] != 0 else p['uref0'][i] + p['Xref'][i]) <= p['umax'][i] + 1e-9):
                bad.append('%s: η τάση αναφοράς έξω από [u_min, u_max]' % nm)
            if not (p['iqmin'][i] - 1e-9 <= iq0[i] <= p['iqmax'][i] + 1e-9):
                bad.append('%s: i_q της ροής φορτίου έξω από [i_qmin, i_qmax]' % nm)
            if not (np.real(o['qmin'][i]) - 1e-9 <= Q0[i] <= np.real(o['qmax'][i]) + 1e-9):
                bad.append('%s: Q της ροής φορτίου έξω από [q_WTmin, q_WTmax]' % nm)
            if ip0[i] > np.real(o['ipmax'][i]) + 1e-9 or not (np.real(o['iqmin'][i]) - 1e-9 <= iq0[i] <= np.real(o['iqmax'][i]) + 1e-9):
                bad.append('%s: στο όριο ρεύματος ήδη από τη ροή φορτίου' % nm)
        if bad:
            raise RMSError('ανεμογεννήτρια: ' + '· '.join(bad))
        return X

    def _decide(self, X, Vr, Vi, t):
        """At the start of a step (after the events of that moment): the flags of the reference frame rotation and of the P
        control, the FRT flag with its delay (Annex D.14) and the values held at the start of a freeze, the timers of the
        protection (Annex D.8). Returns (changed, the events of the protection now, the later times at which to look again)."""
        p, d = self.p, self.d
        old = self._snap()
        _, _, _, o = self._core(X, Vr, Vi)
        um = np.real(o['V'])
        uf = np.real(o['uf'])
        d['pll1'], d['pll2'] = um < p['uPLL1'], um < p['uPLL2']
        d['usc'] = (p['MpUscale'] > 0) & (um < p['updip'])
        dip = uf < p['uqdip']
        d['tdip'] = np.where(dip, t, d['tdip'])
        post = ~dip & (t - d['tdip'] < p['Tpost'] - 1e-12)
        Fn = np.where(dip | (uf > p['uqrise']), 1.0, np.where(post, 2.0, 0.0))
        start = (Fn >= 1) & (d['F'] < 1)                    # a freeze starts: the values held from here
        d['iqol'] = np.where(start, np.real(o['iqol']), d['iqol'])
        d['hu'] = np.where(start, uf, d['hu'])
        d['hp'] = np.where(start, np.real(o['pf']), d['hp'])
        d['F'] = Fn
        later = [float(x) for x in (d['tdip'] + p['Tpost'])[post] if x > t + 1e-12]
        events = []
        if self.prot:
            up, fP = np.real(o['up']), np.real(o['fP'])
            tr = d['tr']
            for key, over, lim, val in (('uo', True, p['uover'], up), ('uu', False, p['uunder'], up),
                                        ('fo', True, p['fover'], fP), ('fu', False, p['funder'], fP)):
                cnt = val >= lim if over else val <= lim
                tr[key] = np.where(cnt, np.where(np.isnan(tr[key]), t, tr[key]), math.nan)
                tab = p['t_T' + {'uo': 'uover', 'uu': 'uunder', 'fo': 'fover', 'fu': 'funder'}[key]]
                for i in np.nonzero(cnt & ~d['ocb'] & (p['on'] > 0))[0]:
                    T = float(np.real(_lut(tab if isinstance(tab, tuple) else tab[i], val[i])))
                    if t - tr[key][i] > T - 1e-12 and t > tr[key][i]:
                        d['ocb'][i] = True
                        events.append({'t': float(t), 'kind': 'gen', 'gen': self.names[i], 'by': 'prot', 'why': key})
                    elif tr[key][i] + T > t + 1e-12:
                        later.append(tr[key][i] + T + 1e-9)
        changed = any(not np.array_equal(old[q], d[q]) for q in ('F', 'pll1', 'pll2', 'usc')) or bool(events)
        return changed, events, later

    def eval(self, X, Vr, Vi, t):
        on = self.p['on']
        F, ir, ii, _ = self._core(X, Vr, Vi)
        F = np.stack([np.broadcast_to(f, (X.shape[0],)) for f in F], axis=1)
        k = self.p['k']
        return F * on[:, None], ir / k * on, ii / k * on

    def _jac_block(self, X, Vr, Vi, t):
        """The complex steps of System.jac (each state, then V_r, V_i of the bus) as one evaluation of nx + 2 copies of the
        members (the same arithmetic per element, so the same numbers as one evaluation per step; less time for the many small
        operations of this model). Returns [D_j]: (m, nx + 2) per step j."""
        m, k = self.m, self.nx
        c = k + 2
        Xc = np.tile(X.astype(complex), (c, 1))
        vr = np.tile(Vr.astype(complex), c)
        vi = np.tile(Vi.astype(complex), c)
        for j in range(k):
            Xc[j * m:(j + 1) * m, j] += 1j * CS
        vr[k * m:(k + 1) * m] += 1j * CS
        vi[(k + 1) * m:] += 1j * CS

        def tile(v):
            if isinstance(v, np.ndarray) and v.shape[:1] == (m,):
                return np.tile(v, c)
            if isinstance(v, list) and len(v) == m:
                return v * c
            if isinstance(v, dict):
                return {q: tile(w) for q, w in v.items()}
            return v
        keep = (self.p, self.d, self._fz, self.m)
        try:
            self.p, self.d, self.m = tile(self.p), tile(self.d), m * c
            if self._fz is not None:
                self._fz = tile(self._fz)
            F, ir, ii = self.eval(Xc, vr, vi, t)
        finally:
            self.p, self.d, self._fz, self.m = keep
        D = np.c_[F.imag, ir.imag, ii.imag] / CS
        return [D[j * m:(j + 1) * m] for j in range(c)]

    def limits(self):
        return []

    def _project_limits(self, X, Vr, Vi):
        """After a step: the states with absolute limits (Annex D.5) back within them, the limits at the new point."""
        _, _, _, o = self._core(X, Vr, Vi)
        p, j = self.p, self.j
        R = lambda a: np.real(a)                            # noqa: E731
        X[:, j['po']] = np.minimum(X[:, j['po']], R(o['plim']))
        X[:, j['ip']] = np.minimum(X[:, j['ip']], R(o['ipmax']))
        X[:, j['iq']] = np.clip(X[:, j['iq']], R(o['iqmin']), np.maximum(R(o['iqmax']), R(o['iqmin'])))
        X[:, j['qi']] = np.clip(X[:, j['qi']], p['umin'], p['umax'])
        X[:, j['ui']] = np.clip(X[:, j['ui']], p['iqmin'], p['iqmax'])
        X[:, j['qo']] = np.clip(X[:, j['qo']], R(o['qmin']), np.maximum(R(o['qmax']), R(o['qmin'])))
        return X

    def outputs(self, X, Vr, Vi):
        """P, Q (pu on S_base), |V|, the currents i_p, i_q and their commands and limits (pu on S_n), F_FRT, and for 4B the
        speeds and p_aero; with the protection its frequency f_WTPfilt (pu) and the flag of the breaker."""
        p = self.p
        _, _, _, o = self._core(X, Vr, Vi)
        k, on = p['k'], p['on']
        out = {'P': o['P'] / k * on, 'Q': o['Q'] / k * on, 'V': o['V'], 'I': _hyp(o['ip'], o['iq']) * on,
               'ip': o['ip'] * on, 'iq': o['iq'] * on, 'ipcmd': o['ipcmd'], 'iqcmd': o['iqcmd'], 'ipmax': o['ipmax'],
               'iqmax': o['iqmax'], 'iqmin': o['iqmin'], 'frt': self.d['F'] + 0 * o['V']}
        if self.model == 'wt4b':
            out['omega_gen'], out['omega_wtr'], out['paero'] = o['wgen'], o['wtr'], o['paero']
        if self.prot:
            out['fP'] = o['fP']
            out['tripped'] = np.where(self.d['ocb'], 1.0, 0.0) + 0 * o['V']
        return out

KINDS = {'classical': Classical, 'two_axis': TwoAxis}
MACHINE_KEYS = ('Xd', 'Xdp', 'Xq', 'Xqp', 'Td0p', 'Tq0p', 'Ra', 'H', 'D')
TYPICAL = {'Xd': 1.8, 'Xdp': 0.3, 'Xq': 1.7, 'Xqp': 0.55, 'Td0p': 8.0, 'Tq0p': 0.4, 'Ra': 0.0, 'H': 4.0, 'D': 0.0}
# 5.0.13: the typical values of the subtransient model where no data are given (our choice, within the ranges of the
# typical data of Power System Control and Stability, App. D, Table D.3; THEORY §8ΩΝ)
TYPICAL_SUB = {**TYPICAL, 'Xdpp': 0.23, 'Xqpp': 0.25, 'Xl': 0.15, 'Td0pp': 0.03, 'Tq0pp': 0.05, 'SG10': 0.0, 'SG12': 0.0}
# 5.0.13: typical dynamic data for a large network (typical='af'): the machine of one fossil-steam unit of Power System Control
# and Stability, Table D.3 (the unit of 448 MVA, whose row is complete), on the rating of each generator; the inertia by size,
# W_R/S_n of the unit of that table nearest in rating (its pairs (MVA, MW·s)).
AF_UNIT = {'Xd': 1.67, 'Xdp': 0.265, 'Xdpp': 0.205, 'Xq': 1.60, 'Xqp': 0.46, 'Xqpp': 0.205, 'Xl': 0.150, 'Ra': 0.0043, 'Td0p': 3.70,
           'Td0pp': 0.032, 'Tq0p': 0.47, 'Tq0pp': 0.060, 'SG10': 0.091, 'SG12': 0.400, 'D': 2.0}
AF_WR = ((25.0, 125.4), (35.29, 154.9), (51.2, 260.0), (75.0, 464.0), (100.0, 498.5), (125.0, 596.0), (147.1, 431.0), (160.0, 634.0),
         (192.0, 634.0), (233.0, 960.5), (270.0, 1115.0), (330.0, 992.0), (384.0, 1006.5), (448.0, 1190.0), (512.0, 1347.2), (552.0, 3010.0),
         (590.0, 1368.0), (835.0, 2206.4), (896.0, 2625.0), (911.0, 2265.0))


def typical(net, kind='af', pf=None, load=0.8, controls=True):
    """5.0.13: typical dynamic data for every generator of a network that has none (a test network): the subtransient machine
    AF_UNIT on a rating S_n = max(|S| of the load flow/load, 2·X_d·Q absorbed, 10 MVA/load) (our choice: the unit at 80 % of its
    rating, and within its limit of underexcitation), H by size
    (AF_WR), an ST1A with the defaults of the EMT, and a steam governor (P_r 0,9 of S_n) where the unit gives P > 0. Written as
    typical values, not data of the network (ROADMAP §101). Returns {generator: data} for Network.dynamic(machines=…)."""
    if kind != 'af':
        raise RMSError("typical: 'af' (οι τυπικές τιμές του Πίν. D.3 του βιβλίου αναφοράς)")
    pf = pf or net.power_flow()
    Sb = net.S_base
    out = {}
    for e in net.elements:
        if e['kind'] != 'generator':
            continue
        d = pf['buses'].get(e['bus'], {})
        n_on = max(1, sum(1 for q in net.elements if q['kind'] == 'generator' and q['bus'] == e['bus']))
        P, Q = d.get('P', 0.0) / n_on, d.get('Q', 0.0) / n_on
        # a unit that absorbs Q within its limit of underexcitation: |Q|/S_n ≤ 1/(2·X_d) (else E_fd < 0 and no steady state)
        Sn = max(abs(complex(P, Q)) / load, 2 * AF_UNIT['Xd'] * max(-Q, 0.0), 10e6 / load)
        mva = Sn / 1e6
        H = min(AF_WR, key=lambda q: abs(math.log(q[0] / mva)))
        g = {'model': 'subtransient', 'Sn': Sn, **AF_UNIT, 'H': H[1] / H[0]}
        if controls:
            g['avr'] = {'type': 'st1a'}
            if P > 1e-6 * Sb:
                g['gov'] = {'type': 'steam', 'Pr': 0.9}
        out[e['name']] = g
    return out


# 5.1: the two-area system of Example 12.6 of Power System Stability and Control (pcl.network case 'two_area', THEORY §8ΩΥ):
# the unit of the example on its 900 MVA (p. 813). Its saturation A_Sat = 0,015, B_Sat = 9,6, ψ_T1 = 0,9 is ψ_I = A_Sat·e^(B_Sat·(ψ_at
# − ψ_T1)) above ψ_T1: the same exponential as S(V) = A_G·e^(B_G·(V − 0,8)) here (§8ΩΝ.1) through S(1,0) = 0,015·e^0,96 and
# S(1,2) = 0,015·e^2,88, so S_G1,0 = 0,015·e^0,96, S_G1,2 = 0,015·e^2,88/1,2; below ψ_T1 ours is not 0 (S(0,9) = 0,015).
TWO_AREA_UNIT = {'model': 'subtransient', 'Sn': 900e6, 'Xd': 1.8, 'Xq': 1.7, 'Xl': 0.2, 'Xdp': 0.3, 'Xqp': 0.55, 'Xdpp': 0.25,
                 'Xqpp': 0.25, 'Ra': 0.0025, 'Td0p': 8.0, 'Tq0p': 0.4, 'Td0pp': 0.03, 'Tq0pp': 0.05, 'D': 0.0,
                 'SG10': 0.015 * math.exp(9.6 * 0.1), 'SG12': 0.015 * math.exp(9.6 * 0.3) / 1.2}
TWO_AREA_H = {'G1': 6.5, 'G2': 6.5, 'G3': 6.175, 'G4': 6.175}
# the excitation of part (b) of the example (p. 814): (i) the self-excited DC exciter of Fig. 8.40 (DC1A, V_X of (8.21)), (ii) the
# thyristor exciter with a high transient gain, (iii) with the transient gain reduction (1 + sT_A)/(1 + sT_B) of Fig. E12.9 (the
# lead-lag T_C/T_B of the ST1A here), (iv) with the stabilizer of Fig. E12.9 (the PSS here: K_STAB, T_W, T1–T4)
TWO_AREA_EXCITATION = {
    'manual': {},
    'dc': {'avr': {'type': 'dc1a', 'KA': 20.0, 'TA': 0.055, 'TE': 0.36, 'KF': 0.125, 'TF': 1.8, 'AEX': 0.0056, 'BEX': 1.075,
                   'TR': 0.05, 'KE': None, 'VXEXP': 1.0, 'VRMIN': -99.0, 'VRMAX': 99.0}},
    'thyristor': {'avr': {'type': 'st1a', 'KA': 200.0, 'TR': 0.01, 'VRMIN': -99.0, 'VRMAX': 99.0}},
    'tgr': {'avr': {'type': 'st1a', 'KA': 200.0, 'TR': 0.01, 'TC': 1.0, 'TB': 10.0, 'VRMIN': -99.0, 'VRMAX': 99.0}},
    'pss': {'avr': {'type': 'st1a', 'KA': 200.0, 'TR': 0.01, 'VRMIN': -99.0, 'VRMAX': 99.0},
            'pss': {'KS': 20.0, 'TW': 10.0, 'T1': 0.05, 'T2': 0.02, 'T3': 3.0, 'T4': 5.4, 'VSMIN': -99.0, 'VSMAX': 99.0}},
}
TWO_AREA_LOADS = {'a': 1.0, 'b': 2.0}     # the loads of the example: P of constant current, Q of constant impedance


def two_area_machines(excitation='manual', limits=False):
    """5.1: the machines of the two-area system (case 'two_area') for Network.dynamic(machines=…, loads=TWO_AREA_LOADS):
    the unit of Example 12.6 with the excitation of its part (a) 'manual' (constant E_fd) or (b) 'dc', 'thyristor', 'tgr',
    'pss'. The example gives no limits: here ±99 pu (the "large number" of IEEE Std 421.5), so the regulators are linear, as in its
    eigenvalues; limits=True keeps the
    limits of the defaults (ST1A: V_R within [−6,4·V_t, 7,0·V_t]; DC1A: V_R within ±1,7; PSS: ±0,1) for large disturbances."""
    if excitation not in TWO_AREA_EXCITATION:
        raise RMSError('two_area_machines: %s' % ', '.join(TWO_AREA_EXCITATION))
    out = {}
    for g, H in TWO_AREA_H.items():
        d = {**TWO_AREA_UNIT, 'H': H}
        for part, v in TWO_AREA_EXCITATION[excitation].items():
            v = dict(v)
            if limits:
                for q in ('VRMIN', 'VRMAX', 'VSMIN', 'VSMAX'):
                    v.pop(q, None)
            d[part] = v
        out[g] = d
    return out


KNOWN_ELEMENTS = {'generator', 'load', 'branch', 'feeder', 'shunt', 'line', 'reactor', 'transformer', 'transformer3',   # 5.0.13: the passive ones of the network as Y
                  'vsc', 'dc_line', 'dcdc', 'dc_dispatcher', 'dc_source'}                                                    # 5.0.15: the DC grids (HVDC); 5.0.16: dc_source


# ---------------------------------------------------------------- the system
class System:
    """The DAE of a network of pcl.network with machines, from a load flow.

    machines: {name of a generator: {'model': 'classical' | 'two_axis', 'Xd', 'Xdp', 'Xq', 'Xqp', 'Td0p', 'Tq0p', 'Ra',
    'H', 'D', 'Sn'}} in pu on the rating Sn (VA; default the base of the network); a generator not listed gets the model
    `default` with the typical values TYPICAL on its rating Sr (the next step brings the library of models). A feeder
    (an external grid) is a Source behind its short-circuit impedance, or a stiff one (X 10⁻⁴ pu).
    loads: 'Z' (constant impedance, as in a classical study), 'I', 'P', or {'z': a, 'i': b, 'p': c} the shares of P and Q.
    f: the frequency of the network (Hz; default net.f). pf: the result of net.power_flow() (computed if not given).
    5.1.4: a generator can be a wind turbine of IEC 61400-27-1, {'model': 'wt4a' | 'wt4b', …} (Wind, _wind)."""

    def __init__(self, net, machines=None, default='two_axis', loads='Z', f=None, pf=None, vmin=0.7, stations=None):
        bad = sorted({e['kind'] for e in net.elements} - KNOWN_ELEMENTS)
        if bad:
            raise RMSError('δεν ταιριάζουν στον πυρήνα RMS ακόμη, γιατί δεν έχουν μοντέλο RMS: ' + ', '.join(bad))
        self.net, self.f = net, float(f or getattr(net, 'f', 50.0) or 50.0)
        self.wb = 2 * math.pi * self.f
        self.case = c = net.case()
        self.n, self.names, self.idx = c.n, c.names, c.idx
        dcnet = any(e['kind'] == 'vsc' for e in net.elements)
        if pf is None and dcnet:                            # 5.0.15: a network with DC grids starts from its AC/DC load flow
            pf = net.acdc_flow()
            if not pf.get('converged'):
                raise RMSError('η ροή φορτίου AC/DC δεν συγκλίνει: δεν υπάρχει αρχή για τη δυναμική')
        elif dcnet and 'converters' not in pf:
            raise RMSError('ένα δίκτυο με σταθμούς HVDC ξεκινά από τη ροή φορτίου AC/DC (net.acdc_flow()), όχι από τη ροή φορτίου AC')
        self.pf = pf or net.power_flow()
        V0 = np.asarray(self.pf['_V'], complex)
        self.V0 = V0
        Sb = c.S_base
        buses = dict(self.pf['buses'])
        # loads: constant impedance into Y_aug, the rest as a ZIP device
        Sl = np.asarray(c.load, complex)
        Sl = Sl[:, 0] * np.abs(V0) ** 2 + Sl[:, 1] * np.abs(V0) + Sl[:, 2] if Sl.ndim == 2 else Sl
        expo = isinstance(loads, dict) and ('a' in loads or 'b' in loads)
        if expo:                                            # 5.0.13: P ∝ |V|^a, Q ∝ |V|^b
            share = (0, 0, 0)
        else:
            share = {'Z': (1, 0, 0), 'I': (0, 1, 0), 'P': (0, 0, 1)}.get(loads) if isinstance(loads, str) else \
                (loads.get('z', 0), loads.get('i', 0), loads.get('p', 0))
            if share is None or abs(sum(share) - 1) > 1e-9:
                raise RMSError("loads: 'Z', 'I', 'P', the shares {'z', 'i', 'p'} with sum 1, or the exponents {'a', 'b'}")
        self.yload = share[0] * np.conj(Sl) / np.abs(V0) ** 2
        self.kinds = []
        if expo:
            li = [k for k in range(self.n) if abs(Sl[k]) > 0]
            if li:
                self.kinds.append(ExpLoad(['load@' + self.names[k] for k in li], li,
                                          {'P0': Sl[li].real, 'Q0': Sl[li].imag, 'a': float(loads.get('a', 2.0)),
                                           'b': float(loads.get('b', 2.0)), 'Vmin': vmin}))
        else:
            li = [k for k in range(self.n) if abs(Sl[k]) > 0 and (share[1] or share[2])]
            if li:
                L = ZIPLoad(['load@' + self.names[k] for k in li], li,
                            {'Si': share[1] * Sl[li], 'Sp': share[2] * Sl[li], 'Vmin': vmin})
                self.kinds.append(L)
        # machines and sources
        gens = [e for e in net.elements if e['kind'] == 'generator']
        feeders = [e for e in net.elements if e['kind'] == 'feeder']
        per_bus = {}
        for e in gens + feeders:
            per_bus.setdefault(e['bus'], []).append(e)
        if any(len(v) > 1 and any(e['kind'] == 'feeder' for e in v) for v in per_bus.values()):
            raise RMSError('ένα εξωτερικό δίκτυο και άλλη πηγή στον ίδιο ζυγό: δεν μοιράζεται ακόμη η ισχύς της ροής φορτίου ανάμεσά τους')
        machines = machines or {}
        groups, units = {}, {}
        self.share = {}                                     # 5.0.13: the share of each generator in the injection of its bus
        convs = {}
        winds = {}                                          # 5.1.4
        for e in gens:
            md = dict(machines.get(e['name'], {}))
            model = md.pop('model', default)
            if model in CONVERTERS:                          # 5.0.14: a converter on the bus of the generator
                Sn = float(md.pop('Sn', e.get('Sr') or Sb))
                key, vals = self._converter(e['name'], model, md, Sb / Sn, Sn)
                convs.setdefault(key, []).append((e['name'], self.idx[e['bus']], vals))
                continue
            if model in WIND_MODELS:                         # 5.1.4: a wind turbine of IEC 61400-27-1 on the bus of the generator
                Sn = float(md.pop('Sn', e.get('Sr') or Sb))
                key, vals = self._wind(e['name'], model, md, Sb / Sn, Sn)
                winds.setdefault(key, []).append((e['name'], self.idx[e['bus']], vals))
                continue
            if model not in KINDS and model != 'subtransient':
                raise RMSError('άγνωστο μοντέλο μηχανής %r (%s, subtransient, %s, %s)' % (model, ', '.join(KINDS), ', '.join(CONVERTERS),
                                                                                       ', '.join(WIND_MODELS)))
            Sn = float(md.pop('Sn', e.get('Sr') or Sb))
            k = Sb / Sn                                     # to the system base: impedances ×k, H and D ÷k
            avr, pss, gov = md.pop('avr', None), md.pop('pss', None), md.pop('gov', None)
            if model in KINDS and not (avr or pss or gov):
                vals = {q: float(md.get(q, TYPICAL[q])) for q in MACHINE_KEYS}
                for q in ('Xd', 'Xdp', 'Xq', 'Xqp', 'Ra'):
                    vals[q] *= k
                vals['H'] /= k
                vals['D'] /= k
                groups.setdefault(model, []).append((e['name'], self.idx[e['bus']], vals))
                continue
            if model == 'classical':
                raise RMSError('η κλασική μηχανή %s έχει σταθερή E′: χωρίς AVR, PSS ή ρυθμιστή (μοντέλο two_axis ή subtransient)' % e['name'])
            vals = {q: _num(md, q, TYPICAL_SUB[q]) for q in SUB_KEYS}
            if model == 'two_axis':
                vals['Xdpp'], vals['Xqpp'], vals['Td0pp'], vals['Tq0pp'] = vals['Xdp'], vals['Xqp'], 0.0, 0.0
            for q in ('Xd', 'Xdp', 'Xdpp', 'Xq', 'Xqp', 'Xqpp', 'Xl', 'Ra'):
                vals[q] *= k
            vals['H'] /= k
            vals['D'] /= k
            # the leakage below the subtransient reactances (our choice where the data put it above)
            xs = min(vals['Xdpp'] if vals['Td0pp'] > 0 else vals['Xdp'], vals['Xqpp'] if vals['Tq0pp'] > 0 else vals['Xqp'])
            vals['Xl'] = min(vals['Xl'], 0.8 * xs)
            at = (avr or {}).get('type', 'st1a') if avr else None
            if at and at not in AVR_DEFAULTS:
                raise RMSError('άγνωστη διέγερση %r (st1a, dc1a, ac1a)' % at)
            pt = None                                   # 5.1: the type of the stabilizer ('pss' as before, 'pss1a', 'pss2b')
            if pss:
                pt = (pss.get('type') or 'pss') if isinstance(pss, dict) else 'pss'
                if pt not in PSS_TYPES:
                    raise RMSError('άγνωστος σταθεροποιητής %r (%s)' % (pt, ', '.join(PSS_TYPES)))
            gt = (gov or {}).get('type', 'steam') if gov else None
            if gt and gt not in GOV_DEFAULTS:
                raise RMSError('άγνωστος ρυθμιστής %r (steam, hydro)' % gt)
            ctl = {}
            if at:
                a = {q: (_num(avr, q, v) if v is not None else (float(avr[q]) if str(avr.get(q, '')).strip() not in ('', 'None') else math.nan))
                     for q, v in AVR_DEFAULTS[at].items()}
                a['dV'] = 0.0
                a['Vref'] = _num(avr, 'Vref', math.nan)         # a given reference (else |V| of the load flow, as the EMT)
                if at == 'st1a' and a['KF'] > 0 and a['TF'] > 1e-6 and not a['TA'] > 0:
                    raise RMSError('ST1A της %s με K_F > 0 και T_A = 0: αλγεβρικός βρόχος μέσα από την ανάδραση ρυθμού' % e['name'])
                ctl['avr'] = a
            if pt == 'pss':
                ctl['pss'] = {q: _num(pss if isinstance(pss, dict) else {}, q, v) for q, v in PSS_DEFAULTS.items()}
            elif pt == 'pss1a':
                ctl['pss'] = {q: _num(pss, q, v) for q, v in PSS1A_DEFAULTS.items()}
                ctl['pss']['kb'] = k                    # the electrical power to the rating of the machine
            elif pt == 'pss2b':
                ps = {q: _num(pss, q, v) for q, v in PSS2B_DEFAULTS.items() if v is not None}
                Hm = _num(md, 'H', TYPICAL_SUB['H'])    # K_S2 = T7/(2H), H on the rating of the machine (note a of Table H.24)
                ps['KS2'] = _num(pss, 'KS2', ps['T7'] / (2 * Hm))
                ps['kb'] = k
                M, N = int(round(ps['M'])), int(round(ps['N']))
                if M < 1 or N < 1 or M * N > 40:
                    raise RMSError('PSS2B της %s: M, N ακέραιοι από 1, με M·N ως 40' % e['name'])
                pt = ('pss2b', M, N)
                ctl['pss'] = ps
            if gt:
                g = {q: _num(gov, q, v) for q, v in GOV_DEFAULTS[gt].items()}
                g['Pr'] /= k                                # the rating of the turbine on the base of the system
                g['dP'] = 0.0
                ctl['gov'] = g
            units.setdefault((model, at, (True if pt == 'pss' else pt) if pt else False, gt), []).append((e['name'], self.idx[e['bus']], vals, ctl))
        for model, L in groups.items():
            p = {q: np.array([v[q] for _, _, v in L]) for q in MACHINE_KEYS}
            self.kinds.append(KINDS[model]([a for a, _, _ in L], [b for _, b, _ in L], p))
        for (model, at, ps, gt), L in units.items():
            p = {q: np.array([v[q] for _, _, v, _ in L], float) for q in SUB_KEYS}
            for part in ('avr', 'pss', 'gov'):
                if L[0][3].get(part):
                    p[part] = {q: np.array([c[part][q] for _, _, _, c in L], float) for q in L[0][3][part]}
            self.kinds.append(Unit([a for a, _, _, _ in L], [b for _, b, _, _ in L], p, model=model, avr=at, pss=ps, gov=gt))
        for key, L in convs.items():                         # 5.0.14: the converters, one device per kind and options
            p = {q: np.array([v[q] for _, _, v in L], float) for q in L[0][2] if q != 'store'}
            if 'store' in L[0][2]:
                p['store'] = {q: np.array([v['store'][q] for _, _, v in L], float) for q in STORE_DEFAULTS}
            names, bus = [a for a, _, _ in L], [b for _, b, _ in L]
            if key[0] == 'svc':
                self.kinds.append(SVC(names, bus, p, model=key[1]))
            elif key[0] == 'statcom':
                self.kinds.append(Statcom(names, bus, p))
            else:
                self.kinds.append(Converter(names, bus, p, kind=key[0], law=key[1], frq=key[2], avc=key[3], storage=key[4], pv=key[5],
                                           cc=key[6] if len(key) > 6 else 'robust'))
        for key, L in winds.items():                         # 5.1.4: the wind turbines, one device per type, protection, Q limitation
            p = {q: np.array([v[q] for _, _, v in L], float) for q in L[0][2] if not q.startswith('t_')}
            for q in L[0][2]:
                if q.startswith('t_'):                       # one table for all the members (vectorized), or one each
                    tl = [v[q] for _, _, v in L]
                    same = all(np.array_equal(a[0], tl[0][0]) and np.array_equal(a[1], tl[0][1]) for a in tl)
                    p[q] = tl[0] if same else tl
            self.kinds.append(Wind([a for a, _, _ in L], [b for _, b, _ in L], p, model=key[0], prot=key[1], qlim=key[2]))
        if feeders:
            X = []
            for e in feeders:
                Sk = e.get('Sk') or e.get('Ssc')
                X.append(Sb / Sk if Sk else 1e-4)
            self.kinds.append(Source([e['name'] for e in feeders], [self.idx[e['bus']] for e in feeders],
                                     {'R': 0.1 * np.array(X), 'X': np.array(X)}))
        # several generators on one bus (5.0.13): P as their set points scaled to the P of the bus in the load flow, Q in
        # proportion to their ratings (our choice); one generator takes the whole injection
        for b, v in per_bus.items():
            if len(v) > 1:
                Ps = np.array([float(e.get('P') or 0.0) for e in v])
                Ss = np.array([float(e.get('Sr') or 1.0) for e in v])
                wp = Ps / Ps.sum() if abs(Ps.sum()) > 0 else Ss / Ss.sum()
                wq = Ss / Ss.sum()
                for e, a, q in zip(v, wp, wq):
                    self.share[e['name']] = (float(a), float(q))
        # the injections of the sources from the load flow
        Sg = np.zeros(self.n, complex)
        for b, d in buses.items():
            Sg[self.idx[b]] = (d['P'] + 1j * d['Q']) / Sb
        if dcnet:                                           # 5.0.15: the stations of the DC grids, one device across their buses
            for nm, cv in self.pf['converters'].items():
                Sg[self.idx[cv['bus']]] -= (cv['Ps'] + 1j * cv['Qs']) / Sb
            self.kinds.append(HVDC(net, self.pf, stations, Sb, self.idx, self.wb))
        elif stations:
            raise RMSError('stations: το δίκτυο δεν έχει σταθμούς HVDC (vsc)')
        self.Sg = Sg
        # the states
        off = 0
        for K in self.kinds:
            K.x0 = off
            off += K.nx * K.m
        self.nx = off
        self.ny = 2 * self.n
        self.state_names = [(K.names[i], s) for K in self.kinds for i in range(K.m) for s in K.states]
        self._conv = any(isinstance(K, (Converter, SVC, Statcom, HVDC, Wind)) for K in self.kinds)
        self._y_build()
        self.events_done = []
        self.x = None

    @staticmethod
    def _converter(name, model, md, k, Sn):
        """5.0.14: the data of a converter (THEORY §8ΩΞ): (the key of its group, the values on its rating S_n)."""
        nan = math.nan
        vals = {'k': k, 'Sn': Sn}
        store = md.get('storage')
        if model == 'svc':
            vals.update({q: _num(md, q, v) for q, v in SVC_DEFAULTS.items()})
            vals['Vref'] = _num(md, 'Vref', nan)
            mod = int(vals.pop('basic'))
            if mod not in (1, 2):
                raise RMSError('SVC %s: basic 1 ή 2 (τα βασικά μοντέλα του 1994)' % name)
            ok = vals['Bmin'] < vals['Bmax'] and min(vals['Tm'], vals['T1'], vals['T2'], vals['TP']) >= 0 and \
                ((mod == 1 and vals['KR'] > 0 and vals['TR'] >= 0) or (mod == 2 and vals['KI'] > 0 and vals['KSL'] >= 0 and vals['KP'] >= 0))
            if not ok:
                raise RMSError('SVC %s: B_min < B_max, K_R > 0 (μοντέλο 1) ή K_I > 0 (μοντέλο 2), σταθερές χρόνου ≥ 0' % name)
            return ('svc', mod, False, True, False, False), vals
        if model == 'statcom':
            vals.update({q: _num(md, q, v) for q, v in STATCOM_DEFAULTS.items()})
            vals['Vref'] = _num(md, 'Vref', nan)
            if not (vals['K'] > 0 and vals['rho'] >= 0 and vals['TC'] >= 0 and vals['Tm'] >= 0 and vals['ICmax'] > 0 and vals['ILmax'] > 0):
                raise RMSError('STATCOM %s: K > 0, ρ ≥ 0, T_C, T_m ≥ 0, I_Cmax, I_Lmax > 0' % name)
            return ('statcom', None, False, True, False, False), vals
        if model == 'gfm':
            law = md.get('law', 'droop')
            if law not in GFM_LAWS:
                raise RMSError('νόμος grid-forming %r της %s: %s (dVOC και matching δεν είναι ακόμη στο RMS)' % (law, name, ', '.join(GFM_LAWS)))
            vals.update({q: _num(md, q, v) for q, v in GFM_DEFAULTS.items()})
            vals['mp'] /= 100.0
            vals['nq'] /= 100.0
            for q in ('Pref', 'Qref', 'Vref', 'Uref'):
                vals[q] = _num(md, q, nan)
            avc = md.get('avc', 'vac') != 'fixed'
            if not (vals['mp'] > 0 and vals['nq'] > 0 and vals['Xc'] > 0 and vals['Imax'] > 0):
                raise RMSError('grid-forming %s: m_p, n_q, X_c και I_max > 0' % name)
            key = ('gfm', law, False, avc, bool(store), False)
        else:
            vals.update({q: _num(md, q, v) for q, v in GFL_DEFAULTS.items()})
            vals['mf'] /= 100.0
            for q in ('Pref', 'Vref', 'Pav'):
                vals[q] = _num(md, q, nan)
            frq = md.get('frq') in ('droop', True, 'on')
            pv = bool(md.get('pv'))
            if not (vals['X'] > 0 and vals['acc'] > 0 and vals['bw'] > 0 and vals['Ilim'] > 0 and vals['mf'] > 0 and vals['Tf'] > 0):
                raise RMSError('grid-following %s: X, acc, bw, I_lim, m_f, T_f > 0' % name)
            cc = md.get('cc', 'robust')
            if cc not in ('robust', 'pi'):
                raise RMSError("grid-following %s: cc 'robust' (5.0.14) ή 'pi' (ο έλεγχος PI του MMCC)" % name)
            if cc == 'pi':                                  # 5.0.15: the control 'pi' of the MMCC
                if store or pv:
                    raise RMSError('grid-following %s με cc pi: χωρίς αποθήκη και φωτοβολταϊκό ακόμη' % name)
                vals.update({q: _num(md, q, v) for q, v in GFL_PI_DEFAULTS.items()})
                vals['Qref'] = _num(md, 'Qref', nan)
                if not (min(vals['Tp'], vals['Tq'], vals['Ti']) > 0 and vals['R'] >= 0 and vals['Idlim'] > 0):
                    raise RMSError('grid-following %s: T_p, T_q, T_i > 0, R ≥ 0, I_dlim > 0' % name)
                key = ('gfl', None, frq, True, False, False, 'pi')
                return key, vals
            key = ('gfl', None, frq, True, bool(store), pv)
        if store:
            if model != 'gfl':
                raise RMSError('αποθήκη ενέργειας στην %s: μόνο με grid-following ακόμη (ένας grid-forming στο όριο της αποθήκης δεν έχει μοντέλο)' % name)
            s = store if isinstance(store, dict) else {}
            vals['store'] = {q: _num(s, q, v) for q, v in STORE_DEFAULTS.items()}
            if not (vals['store']['E'] > 0 and 0 <= vals['store']['smin'] < vals['store']['smax'] <= 1):
                raise RMSError('αποθήκη της %s: E > 0 (MWh) και 0 ≤ s_min < s_max ≤ 1' % name)
        return key, vals

    @staticmethod
    def _wind(name, model, md, k, Sn):
        """5.1.4: the data of a wind turbine of IEC 61400-27-1 (THEORY §8ΩΨ): (the key of its group, the values on its rating
        S_n). The parameters by their text names of the standard (WT_DEFAULTS; the ramp rates and the lags of the P control
        without the suffix 4A, 4B), the tables (WT_TABLES) as lists of pairs (x, y), 'qlim': 'const' or 'qpqu', 'prot': 1 for
        the grid protection, 'Pref' (p_WTref) and 'Xref' (x_WTref) when not those of the load flow. A key that is not of the
        model is refused by name, never left out."""
        nan = math.nan
        known = set(WT_DEFAULTS) | set(WT_TABLES) | {'qlim', 'Pref', 'Xref'}
        bad = sorted(set(md) - known)
        if bad:
            es = [q for q in bad if q in ('res', 'xes', 'ges', 'bes')]
            if es and all(float(md[q] or 0) == 0 for q in es):
                bad = [q for q in bad if q not in es]
            if bad:
                why = ' (το ηλεκτρικό σύστημα μόνο ως ο διακόπτης του: ο μετασχηματιστής στο δίκτυο)' if es else ''
                raise RMSError('ανεμογεννήτρια %s: άγνωστα δεδομένα %s%s' % (name, ', '.join(bad), why))
        vals = {'k': k, 'Sn': Sn}
        vals.update({q: _num(md, q, v) for q, v in WT_DEFAULTS.items()})
        vals['Pref'], vals['Xref'] = _num(md, 'Pref', nan), _num(md, 'Xref', nan)
        for q, v in WT_TABLES.items():
            tab = md.get(q, v)
            try:
                pts = sorted((float(a), float(b)) for a, b in tab)
            except (TypeError, ValueError):
                raise RMSError('ανεμογεννήτρια %s: ο πίνακας %s ως λίστα ζευγών (x, y)' % (name, q))
            if not pts:
                raise RMSError('ανεμογεννήτρια %s: ο πίνακας %s χωρίς σημεία' % (name, q))
            vals['t_' + q] = (np.array([a for a, _ in pts]), np.array([b for _, b in pts]))
        qlim = md.get('qlim', 'const')
        if qlim not in ('const', 'qpqu'):
            raise RMSError("ανεμογεννήτρια %s: qlim 'const' (§7.7.7) ή 'qpqu' (§7.7.8)" % name)
        lags = ['Tpfilt', 'Tqfilt', 'Tufilt', 'TPLL', 'Tg', 'Tpordp', 'Tqord', 'Tuss', 'Tufiltp', 'Tffilt', 'Ts']
        lags += ['TpWTref'] if model == 'wt4a' else ['Tpaero']
        z = [q for q in lags if not vals[q] > 0]
        if z:
            raise RMSError('ανεμογεννήτρια %s: σταθερές χρόνου > 0 (%s)' % (name, ', '.join(z)))
        modes = {'MqG': (0, 1, 2, 3, 4), 'MqFRT': (0, 1, 2), 'MpUscale': (0, 1), 'Mqpri': (0, 1)}
        for q, ok in modes.items():
            if vals[q] not in ok:
                extra = ' (το 3, ο ορισμός του χρήστη, δεν είναι εδώ)' if q == 'MqFRT' and vals[q] == 3 else ''
                raise RMSError('ανεμογεννήτρια %s: %s ένα από %s%s' % (name, q, ', '.join(map(str, ok)), extra))
        checks = [(vals['uPLL2'] <= vals['uPLL1'], 'u_PLL2 ≤ u_PLL1'), (vals['umin'] < vals['umax'], 'u_min < u_max'),
                  (vals['iqmin'] < vals['iqmax'], 'i_qmin < i_qmax'), (vals['iqmin'] <= vals['iqh1'], 'i_qmin ≤ i_qh1'),
                  (vals['qmin'] < vals['qmax'], 'q_min < q_max'), (vals['imax'] > 0 and vals['imaxdip'] > 0, 'i_max, i_maxdip > 0'),
                  (vals['udb1'] <= vals['udb2'], 'Δu_db1 ≤ Δu_db2'), (vals['dprefmin'] <= vals['dprefmax'], 'dp_refmin ≤ dp_refmax'),
                  (vals['diqmin'] <= vals['diqmax'], 'di_qmin ≤ di_qmax'), (vals['dpmaxp'] > 0 and vals['dipmax'] > 0, 'dp_maxp, di_pmax > 0'),
                  (vals['dPhimax'] > 0, 'dΦ_max > 0')]
        if model == 'wt4b':
            checks.append((vals['HWTR'] > 0 and vals['Hgen'] > 0 and vals['kdrt'] > 0 and vals['cdrt'] >= 0, 'H_WTR, H_gen, k_drt > 0, c_drt ≥ 0'))
        bad = [w for ok, w in checks if not ok]
        if bad:
            raise RMSError('ανεμογεννήτρια %s: %s' % (name, ', '.join(bad)))
        return (model, bool(vals['prot'] > 0), qlim), vals

    # ------------------------------------------------------------ network
    def _y_build(self):
        c = self.case
        Y = sp.csr_matrix(c.Y) + sp.diags(self.yload)
        self.Ybase = Y.tocsr()
        self.yshunt = np.zeros(self.n, complex)              # the shunts of events (faults)
        self.dY = sp.csr_matrix((self.n, self.n), dtype=complex)   # the branches opened by events
        self.br_open = set()
        self._ypat()

    def _ypat(self):
        Y = (self.Ybase + self.dY + sp.diags(self.yshunt)).tocsr()
        Y.eliminate_zeros()
        self.Y = Y

    def _yreal(self):
        """−[[G, −B], [B, G]] as the network part of g_y, with the full pattern of the network (every branch)."""
        Y = (self.Ybase + sp.diags(self.yshunt + 1e-300) + self.dY).tocoo()
        n = self.n
        G, B = Y.data.real, Y.data.imag
        r, c = Y.row, Y.col
        rows = np.r_[r, r, r + n, r + n]
        cols = np.r_[c, c + n, c, c + n]
        vals = -np.r_[G, -B, B, G]
        return rows, cols, vals

    # ------------------------------------------------------------ evaluation
    def _split(self, z):
        return z[:self.nx], z[self.nx:self.nx + self.n], z[self.nx + self.n:]

    def fg(self, x, y, t=0.0):
        """f (states) and g (the current balance at every bus) at (x, y)."""
        n = self.n
        Vr, Vi = y[:n], y[n:]
        dt = np.result_type(x, y, float)
        f = np.zeros(self.nx, dt)
        Ir = np.zeros(n, dt)
        Ii = np.zeros(n, dt)
        for K in self.kinds:
            X = x[K.x0:K.x0 + K.nx * K.m].reshape(K.m, K.nx)
            F, ir, ii = K.eval(X, Vr[K.bus], Vi[K.bus], t)
            f[K.x0:K.x0 + K.nx * K.m] = F.reshape(-1)
            np.add.at(Ir, K.bus, ir)
            np.add.at(Ii, K.bus, ii)
        V = Vr + 1j * Vi if dt != complex else None
        if V is not None:
            YV = self.Y @ V
            g = np.r_[Ir - YV.real, Ii - YV.imag]
        else:                                               # (complex step: the network part is linear and real-valued)
            Y = self.Y
            G, B = Y.real, Y.imag
            g = np.r_[Ir - (G @ Vr - B @ Vi), Ii - (B @ Vr + G @ Vi)]
        return f, g

    def jac(self, x, y, t=0.0):
        """The Jacobian [[f_x, f_y], [g_x, g_y]] (sparse, CSC): the network exactly, each device by a complex step on its
        own variables (all members of a kind at once)."""
        n, nx = self.n, self.nx
        rows, cols, vals = self._yreal()
        R, C, Vv = [rows + nx], [cols + nx], [vals]
        Vr, Vi = y[:n], y[n:]
        for K in self.kinds:
            m, k = K.m, K.nx
            X = x[K.x0:K.x0 + k * m].reshape(m, k)
            if getattr(K, 'multi', False):                  # 5.0.15: one device across buses, a complex step per variable
                nb = len(K.bus)
                rows = np.r_[K.x0 + np.arange(k), nx + K.bus, nx + n + K.bus]
                vr0, vi0 = Vr[K.bus].astype(complex), Vi[K.bus].astype(complex)
                for j in range(k + 2 * nb):
                    Xc, vr, vi = X.astype(complex), vr0.copy(), vi0.copy()
                    if j < k:
                        Xc[0, j] += 1j * CS
                        col = K.x0 + j
                    elif j < k + nb:
                        vr[j - k] += 1j * CS
                        col = nx + K.bus[j - k]
                    else:
                        vi[j - k - nb] += 1j * CS
                        col = nx + n + K.bus[j - k - nb]
                    F, ir, ii = K.eval(Xc, vr, vi, t)
                    D = np.r_[F[0].imag, ir.imag, ii.imag] / CS
                    nzr = D != 0
                    R.append(rows[nzr])
                    C.append(np.full(int(nzr.sum()), col))
                    Vv.append(D[nzr])
                continue
            gi = K.x0 + np.arange(m)[:, None] * k + np.arange(k)[None, :]         # global index of each state
            br, bi = nx + K.bus, nx + n + K.bus
            outs_r = np.c_[gi, br, bi]                                          # rows: f of each state, g_r, g_i of the bus
            if isinstance(K, Wind):                         # 5.1.4: all the complex steps in one evaluation (the same numbers)
                Ds = K._jac_block(X, Vr[K.bus], Vi[K.bus], t)
                for j in range(k + 2):
                    R.append(outs_r.reshape(-1))
                    C.append(np.repeat(gi[:, j] if j < k else (br if j == k else bi), k + 2))
                    Vv.append(Ds[j].reshape(-1))
                continue
            for j in range(k + 2):
                Xc = X.astype(complex)
                vr, vi = Vr[K.bus].astype(complex), Vi[K.bus].astype(complex)
                if j < k:
                    Xc[:, j] += 1j * CS
                    col = gi[:, j]
                elif j == k:
                    vr = vr + 1j * CS
                    col = br
                else:
                    vi = vi + 1j * CS
                    col = bi
                F, ir, ii = K.eval(Xc, vr, vi, t)
                D = np.c_[F.imag, ir.imag, ii.imag] / CS                        # (m, k + 2)
                R.append(outs_r.reshape(-1))
                C.append(np.repeat(col, k + 2))
                Vv.append(D.reshape(-1))
        J = sp.coo_matrix((np.concatenate(Vv), (np.concatenate(R), np.concatenate(C))), shape=(nx + 2 * n, nx + 2 * n))
        return J.tocsc()

    # ------------------------------------------------------------ start
    def init(self):
        """Every device from the load flow, with all its derivatives zero. Returns the norms of f and g at the start."""
        V = self.V0
        x = np.zeros(self.nx)
        for K in self.kinds:
            if getattr(K, 'multi', False):                  # 5.0.15: the DC grids, from the AC/DC load flow
                x[K.x0:K.x0 + K.nx] = K.init(V, self.wb).reshape(-1)
                continue
            if isinstance(K, (ZIPLoad, ExpLoad)):
                S = np.zeros(K.m)
            else:
                S = self.Sg[K.bus].copy()
                for i, nm in enumerate(K.names):
                    if nm in self.share:
                        a, q = self.share[nm]
                        S[i] = S[i].real * a + 1j * S[i].imag * q
            X0 = K.init(V[K.bus], S, self.wb)
            x[K.x0:K.x0 + K.nx * K.m] = X0.reshape(-1)
        y = np.r_[V.real, V.imag]
        self.x, self.y, self.t = x, y, 0.0
        f, g = self.fg(x, y)
        self.x0, self.y0 = x.copy(), y.copy()
        return {'f': float(np.max(np.abs(f))) if len(f) else 0.0, 'g': float(np.max(np.abs(g)))}

    def state(self, name, which):
        for K in self.kinds:
            if name in K.names and which in K.states:
                return K.x0 + K.names.index(name) * K.nx + K.states.index(which)
        raise KeyError((name, which))

    def internal_emf(self):
        """E′ of every classical machine (complex, rad) at the start: for the check against a published example."""
        out = {}
        for K in self.kinds:
            if isinstance(K, Classical):
                X = self.x0[K.x0:K.x0 + 2 * K.m].reshape(K.m, 2)
                for i, nm in enumerate(K.names):
                    out[nm] = K.p['E'][i] * np.exp(1j * X[i, 0])
        return out

    # ------------------------------------------------------------ events
    def _hvdc(self, name):
        for K in self.kinds:
            if isinstance(K, HVDC):
                w = K.find(name)
                if w:
                    return K, w
                if name in K.lname:
                    return K, ('l', K.lname.index(name))
        return None, None

    def _apply(self, ev):
        k = ev['kind']
        if k in ('block', 'deblock'):                       # 5.1.1: a station of a DC grid blocked or deblocked
            K, w = self._hvdc(str(ev.get('gen')))
            if K is None or w[0] not in ('g', 'f', 'm'):
                raise RMSError('συμβάν %r: μόνο ένας σταθμός ενός δικτύου DC (pcl.rms.HVDC) μπλοκάρει, όχι το %r' % (k, ev.get('gen')))
            q, j = w
            K._block(q, j, k == 'block')
            if ev.get('by') != 'prot':                      # by hand: the protection looks at the station afresh
                i = K.st_names.index(str(ev['gen']))
                K.pr['uv'][i], K.pr['rel'][i], K.pr['by'][i] = False, np.inf, None
            return
        if k in ('gen', 'vref', 'pref', 'trip'):            # 5.0.15: a station, a DC/DC converter or a DC line
            K, w = self._hvdc(str(ev.get('gen', ev.get('branch'))))
            if K is not None:
                q, j = w
                if k == 'trip' or q == 'l':
                    if q != 'l' or k != 'trip':
                        raise RMSError('συμβάν %r στη γραμμή DC %s: μόνο trip' % (k, K.lname[j] if q == 'l' else ev.get('gen')))
                    K.p['lon'][j] = 0.0
                elif k == 'gen':
                    K.p[q]['on'][j] = 0.0
                elif q == 's':
                    raise RMSError('η πηγή ρεύματος DC %s δέχεται μόνο το συμβάν gen' % ev['gen'])
                elif k == 'pref':
                    if q == 'f':
                        raise RMSError('ο σταθμός %s σχηματίζει την τάση του νησιού του (Vf): δεν έχει αναφορά P' % ev['gen'])
                    K.p[q]['dP'][j] = float(ev['dP']) * (K.p['d']['Sn'][j] / self.case.S_base if q == 'd' else 1.0)
                else:
                    if q == 'd':
                        raise RMSError('ο μετατροπέας DC/DC %s δεν έχει αναφορά τάσης' % ev['gen'])
                    if q == 'g' and K.p['g']['mode'][j] == 0:
                        raise RMSError('ο σταθμός %s κρατά P: δεν έχει αναφορά τάσης DC' % ev['gen'])
                    K.p[q]['dV'][j] = float(ev['dV'])
                return
        if k == 'fault':
            b = self.idx[str(ev['bus'])]
            z = complex(ev.get('z', 0) or 0)
            self.yshunt[b] += 1e6 if z == 0 else 1 / z
            ev['_y'] = 1e6 if z == 0 else 1 / z
        elif k == 'clear':
            b = self.idx[str(ev['bus'])]
            self.yshunt[b] = 0
        elif k == 'trip':
            c = self.case
            name = ev['branch']
            i = c.br_name.index(name) if isinstance(name, str) else int(name)
            if i in self.br_open:
                return
            f, t = c.f[i], c.t[i]
            Yff, Ytt = c.Yff[i], c.Ytt[i]
            if ev.get('shunts') == 'keep':                  # only the series part (the line charging stays, as some textbooks do)
                Yff, Ytt = c.y[i] / np.abs(c.tap[i]) ** 2, c.y[i]
            d = sp.coo_matrix(([-Yff, -c.Yft[i], -c.Ytf[i], -Ytt], ([f, f, t, t], [f, t, f, t])), shape=(self.n, self.n))
            self.dY = (self.dY + d).tocsr()
            self.br_open.add(i)
        elif k == 'shunt':                                  # a change of a constant-impedance load or shunt (pu)
            b = self.idx[str(ev['bus'])]
            self.Ybase = (self.Ybase + sp.coo_matrix(([complex(ev['y'])], ([b], [b])), shape=(self.n, self.n))).tocsr()
        elif k == 'load':                                   # 5.0.13: a step of load (MW, Mvar) as an impedance at |V₀|
            b = self.idx[str(ev['bus'])]
            dS = (float(ev.get('P', 0)) + 1j * float(ev.get('Q', 0))) * 1e6 / self.case.S_base
            y = np.conj(dS) / abs(self.V0[b]) ** 2
            self.Ybase = (self.Ybase + sp.coo_matrix(([y], ([b], [b])), shape=(self.n, self.n))).tocsr()
        elif k in ('gen', 'vref', 'pref', 'qref'):          # 5.0.13: trip of a unit, step of its voltage or load reference
            K, i = self._unit(ev['gen'])
            if k == 'gen':
                K.p['on'][i] = 0.0
            elif isinstance(K, Wind):                       # 5.1.4: p_WTref (dP), x_WTref in M_qG 0 (dV) or in 1, 2 (dQ), pu of S_n
                mq = int(K.p['MqG'][i])
                if k == 'pref':
                    K.p['dP'][i] = float(ev['dP'])
                elif k == 'vref':
                    if mq != 0:
                        raise RMSError('η ανεμογεννήτρια %s δεν είναι σε έλεγχο τάσης (M_qG 0): η αναφορά Q αλλάζει με το συμβάν qref' % ev['gen'])
                    K.p['dX'][i] = float(ev['dV'])
                else:
                    if mq not in (1, 2):
                        raise RMSError('η ανεμογεννήτρια %s δεν είναι σε έλεγχο Q (M_qG 1 ή 2): το συμβάν qref δεν έχει αναφορά' % ev['gen'])
                    K.p['dX'][i] = float(ev['dQ'])
            elif k == 'qref':
                raise RMSError('το συμβάν qref είναι μόνο για τις ανεμογεννήτριες (%s)' % ev['gen'])
            elif not isinstance(K, Unit):                   # 5.0.14: a converter (dP, dV in pu on its S_n)
                if k == 'vref':
                    K.p['dV'][i] = float(ev['dV'])
                elif isinstance(K, (SVC, Statcom)):
                    raise RMSError('το %s δεν έχει αναφορά P' % ev['gen'])
                else:
                    K.p['dP'][i] = float(ev['dP'])
            elif k == 'vref':
                if not K.avr:
                    raise RMSError('η %s δεν έχει AVR' % ev['gen'])
                K.p['avr']['dV'][i] = float(ev['dV'])
            else:
                if not K.gov:
                    raise RMSError('η %s δεν έχει ρυθμιστή στροφών' % ev['gen'])
                K.p['gov']['dP'][i] = float(ev['dP'])
            return
        else:
            raise RMSError('άγνωστο συμβάν %r' % k)
        self._ypat()

    def _unit(self, name):
        for K in self.kinds:
            if isinstance(K, (Unit, Converter, SVC, Statcom, Wind)) and name in K.names:
                return K, K.names.index(name)
        raise RMSError('καμία μονάδα με όνομα %r (μόνο μηχανές με το μοντέλο της 5.0.13 και μετατροπείς της 5.0.14 δέχονται αυτά τα συμβάντα)' % name)

    def _reset_units(self):
        for K in self.kinds:
            if isinstance(K, Unit):
                K.p['on'] = np.ones(K.m)
                if K.avr:
                    K.p['avr']['dV'] = np.zeros(K.m)
                if K.gov:
                    K.p['gov']['dP'] = np.zeros(K.m)
            elif isinstance(K, (Converter, SVC, Statcom)):
                K.p['on'] = np.ones(K.m)
                K.p['dV'] = np.zeros(K.m)
                if 'dP' in K.p:
                    K.p['dP'] = np.zeros(K.m)
            elif isinstance(K, Wind):                       # 5.1.4: and its flags, timers and held values as at the start
                K.p['on'] = np.ones(K.m)
                K.p['dP'], K.p['dX'] = np.zeros(K.m), np.zeros(K.m)
                if getattr(K, 'd_init', None) is not None:
                    K.d = {**{q: v.copy() for q, v in K.d_init.items() if q != 'tr'}, 'tr': {q: v.copy() for q, v in K.d_init['tr'].items()}}
            elif isinstance(K, HVDC):                       # 5.0.15
                K.p['lon'] = np.ones(len(K.lines))
                for q, nn in (('g', K.ng), ('f', K.nf), ('d', K.nk), ('m', K.nm)):
                    K.p[q]['on'], K.p[q]['dP'], K.p[q]['dV'] = np.ones(nn), np.zeros(nn), np.zeros(nn)
                K._blocks_reset()                           # 5.1.1

    def _fix(self, x):
        """5.1.1: the states that an event sets to zero (the currents of a station at its block: HVDC._block)."""
        for K in self.kinds:
            z = getattr(K, '_zero', None)
            if z:
                x = x.copy()
                x[K.x0 + np.array(z, int)] = 0.0
                K._zero = []
        return x

    def _protect(self, x, y, t):
        """5.1.1: the protection of the stations of the DC grids at the point (x, y) at t (HVDC._protection): the events to apply
        now, and the later times at which to look again."""
        n, now, later = self.n, [], []
        for K in self.kinds:
            if isinstance(K, HVDC) and K.has_prot:
                a, b = K._protection(x[K.x0:K.x0 + K.nx], y[:n][K.bus], y[n:][K.bus], t)
                now += a
                later += b
        return now, later

    def _consistent(self, x, y, t, tol=1e-10):
        """y with x fixed after a discontinuity: Newton on g(x, y) = 0."""
        nx = self.nx
        for _ in range(30):
            _, g = self.fg(x, y, t)
            if np.max(np.abs(g)) < tol:
                return y, True
            J = self.jac(x, y, t)[nx:, nx:]
            y = y - spla.splu(J.tocsc()).solve(g)
        return y, False

    # ------------------------------------------------------------ integration
    def simulate(self, t_end, events=(), h=0.005, method='simultaneous', step='fixed', rtol=1e-4, atol=1e-6,
                 hmin=1e-5, hmax=0.05, tol=1e-9, record_every=1, slow_after=4):
        """From the start (System.init) to t_end (s). events: [{'t', 'kind': 'fault' (bus, z pu), 'clear' (bus),
        'trip' (branch: name or index; shunts: 'keep' removes only the series part), 'shunt' (bus, y pu)}]. method: 'simultaneous' (Newton on the whole system, the
        reference) or 'alternating'. step: 'fixed' (h) or 'var' (from h, with the local error of the states below
        rtol·|x| + atol). slow_after (5.0.13): the Newton iterations of a step above which the next step refactorizes (4: the
        core of 4.23). Returns {'t', 'x', 'V' (complex bus voltages), 'stats', 'events' (5.0.13: (t, kind, unit) as applied)}.
        5.1.1 (THEORY §8ΩΦ): the events 'block' and 'deblock' of a station of a DC grid (gen: its name), and the protection of the
        MMCC of the stations with prot (HVDC._protection), decided at the start of every step after the events of that moment:
        its events are applied there and recorded with 'by': 'prot' and 'why'; a release or an opening later stops a step at its
        time. While a station is blocked, and in the step after a deblock, each step is two half steps of backward Euler
        (_step_be2; with method 'simultaneous')."""
        if self.x is None:
            self.init()
        self._y_build()
        self._reset_units()
        x, y, t = self.x0.copy(), self.y0.copy(), 0.0
        evs = sorted([dict(e) for e in events], key=lambda e: e['t'])
        # 5.0.16: the jumps in time of the expressions of a device (HVDC: its current sources) as points where the step stops
        brk = [K for K in self.kinds if getattr(K, 'breaks', None)]
        ticks = sorted({c for K in brk for c in K.breaks if 0 < c < t_end})
        if ticks:
            evs = sorted(evs + [{'t': c, 'kind': 'tick'} for c in ticks], key=lambda e: e['t'])
        nx, n = self.nx, self.n
        T, Xs, Vs = [0.0], [x.copy()], [y[:n] + 1j * y[n:]]
        winds = [K for K in self.kinds if isinstance(K, Wind)]   # 5.1.4: their discrete parts at every point of the result
        Ds = [[K._snap() for K in winds]] if winds else None
        wlater = set()

        def rec(t, x, y):
            T.append(t); Xs.append(x.copy()); Vs.append(y[:n] + 1j * y[n:])
            if winds:
                Ds.append([K._snap() for K in winds])
        done = []
        st = {'steps': 0, 'newton': 0, 'lu': 0, 'rejected': 0, 'events': 0, 'nonconv': 0}
        f_n, _ = self.fg(x, y, t)
        lu, lu_h, slow = None, None, False
        hist = []                                            # (t, x) of the accepted points since the last event
        h0 = min(h, max(hmin, 1e-3))                         # the first step of the variable step, and after an event
        hc = h0 if step == 'var' else h
        t0 = time.perf_counter()
        ei = 0
        prot = any(isinstance(K, HVDC) and K.has_prot for K in self.kinds)     # 5.1.1: the protection of the stations
        cda = False                                          # 5.1.1: the next step damps (_step_be2)
        blkd = [K for K in self.kinds if isinstance(K, HVDC)]
        keys = ('kind', 'gen', 'bus', 'branch', 'dV', 'dP', 'dQ', 'id', 'by', 'why')
        while t < t_end - 1e-12:
            while ei < len(evs) and evs[ei]['t'] <= t + 1e-12:
                if evs[ei]['kind'] == 'tick':                 # 5.0.16: past a jump of an expression: a new start of y and f
                    y, ok = self._consistent(x, y, t)
                    if not ok:
                        st['nonconv'] += 1
                    f_n, _ = self.fg(x, y, t)
                    lu, hist = None, []
                    ei += 1
                    continue
                if evs[ei]['kind'] == 'prot':                 # 5.1.1: a time at which the protection looks again (below)
                    ei += 1
                    continue
                self._apply(evs[ei])
                x = self._fix(x)
                cda = cda or evs[ei]['kind'] in ('block', 'deblock')
                done.append({**{k: v for k, v in evs[ei].items() if k in keys}, 't': t, 'i': len(T)})
                y, ok = self._consistent(x, y, t)
                if not ok:
                    st['nonconv'] += 1
                f_n, _ = self.fg(x, y, t)
                lu, hist, hc = None, [], (min(hc, h, h0) if step == 'var' else hc)
                st['events'] += 1
                ei += 1
                rec(t, x, y)
            if prot:                                          # 5.1.1: decided at the start of the step, after the events of t
                acts, later = self._protect(x, y, t)
                for tq in later:                              # the step stops there
                    evs.insert(bisect.bisect_right([e['t'] for e in evs], tq, lo=ei), {'t': tq, 'kind': 'prot'})
                if acts:
                    for e in acts:
                        self._apply(e)
                        x = self._fix(x)
                        cda = cda or e['kind'] in ('block', 'deblock')
                        done.append({**{k: v for k, v in e.items() if k in keys}, 't': t, 'i': len(T)})
                        st['events'] += 1
                    y, ok = self._consistent(x, y, t)
                    if not ok:
                        st['nonconv'] += 1
                    f_n, _ = self.fg(x, y, t)
                    lu, hist, hc = None, [], (min(hc, h, h0) if step == 'var' else hc)
                    rec(t, x, y)
            if winds:                                         # 5.1.4: the flags, timers and protection of the wind turbines
                chg, acts = False, []
                for K in winds:
                    ch, ev_w, later = K._decide(x[K.x0:K.x0 + K.nx * K.m].reshape(K.m, K.nx), y[:n][K.bus], y[n:][K.bus], t)
                    chg, acts = chg or ch, acts + ev_w
                    for tq in later:                          # the step stops there
                        if tq < t_end and tq not in wlater:
                            wlater.add(tq)
                            evs.insert(bisect.bisect_right([e['t'] for e in evs], tq, lo=ei), {'t': tq, 'kind': 'prot'})
                for e in acts:
                    self._apply(e)
                    done.append({**{k: v for k, v in e.items() if k in keys}, 't': t, 'i': len(T)})
                    st['events'] += 1
                if chg:
                    y, ok = self._consistent(x, y, t)
                    if not ok:
                        st['nonconv'] += 1
                    f_n, _ = self.fg(x, y, t)
                    lu, hist, hc = None, [], (min(hc, h, h0) if step == 'var' else hc)
                    rec(t, x, y)
            if blkd and not cda:                              # 5.1.1: while a station is blocked, every step damps
                cda = any(K.can_block and (K.lblk.any() or any(K.p[q]['blk'].any() for q in 'gfm')) for K in blkd)
            tn = evs[ei]['t'] if ei < len(evs) else t_end
            hh = min(hc, tn - t, t_end - t)
            if brk:                                           # 5.0.16: a step that ends on a jump takes the value before it
                left = 1e-9 if ei < len(evs) and evs[ei]['kind'] == 'tick' and abs(t + hh - evs[ei]['t']) < 1e-12 else 0.0
                for K in brk:
                    K.left = left
            if method == 'alternating':
                xn, yn, it, ok = self._step_alt(x, y, f_n, t, hh, tol)
            else:
                if lu is None or lu_h != hh or slow:
                    M = self._iter_matrix(x, y, t + hh, hh)
                    lu, lu_h = spla.splu(M), hh
                    st['lu'] += 1
                be, cda = cda, False
                if be:                                        # 5.1.1: blocked, or after a deblock: two half steps of backward Euler
                    xn, yn, it, ok, _ = self._step_be2(x, y, t, hh, tol, lu)
                    if not ok:                                # (Newton with a new matrix at each iteration)
                        xn, yn, it2, ok, n_lu = self._step_be2(x, y, t, hh, tol, None, full=True)
                        it += it2
                        st['lu'] += n_lu
                        lu = None
                    hist = []                                 # (the local error of the trapezoidal rule is not that of this step)
                else:
                    xn, yn, it, ok = self._step_tr(x, y, f_n, t, hh, tol, lu)
                if not ok and not be:                         # refactorize at the new point and try once more
                    M = self._iter_matrix(x, y, t + hh, hh)
                    lu, lu_h = spla.splu(M), hh
                    st['lu'] += 1
                    xn, yn, it2, ok = self._step_tr(x, y, f_n, t, hh, tol, lu)
                    it += it2
                if not ok and not be and self._conv:          # 5.0.14: a limit of a converter crossed inside the step:
                    # the holds as at the point where the iteration ended, and Newton with a new matrix at each iteration
                    xn, yn, it3, ok, n_lu = self._step_full(x, y, f_n, t, hh, tol, (xn, yn))
                    it += it3
                    st['lu'] += n_lu
                    lu = None
                slow = it > slow_after
            st['newton'] += it
            if not ok:
                st['nonconv'] += 1
            if step == 'var' and len(hist) >= 2:
                err = self._lte(hist, t, x, t + hh, xn, rtol, atol)
                if err > 1.0 and hh > hmin * 1.0001:
                    hc = max(hmin, hh * max(0.2, 0.9 * err ** (-1 / 3)))
                    st['rejected'] += 1
                    continue
                hc = min(hmax, hh * min(2.0, max(0.2, 0.9 * (err + 1e-12) ** (-1 / 3))))
            elif step == 'var':
                hc = min(hmax, hh)
            hist = (hist + [(t, x)])[-2:]
            x, y, t = xn, yn, t + hh
            for K in brk:
                K.left = 0.0
            f_n, _ = self.fg(x, y, t)
            st['steps'] += 1
            if st['steps'] % record_every == 0 or t >= t_end - 1e-12:
                rec(t, x, y)
        st['time'] = time.perf_counter() - t0
        self.x, self.y, self.t = x, y, t
        out = {'t': np.array(T), 'x': np.array(Xs), 'V': np.array(Vs), 'stats': st, 'events': done}
        if winds:
            out['d'] = Ds
        return out

    def _iter_matrix(self, x, y, t, h):
        J = self.jac(x, y, t).tocsr()
        nx = self.nx
        E = sp.diags(np.r_[np.ones(nx), np.zeros(self.ny)])
        S = sp.diags(np.r_[np.full(nx, -0.5 * h), np.ones(self.ny)])
        return (E + S @ J).tocsc()

    def _units(self):
        return [K for K in self.kinds if (isinstance(K, Unit) and (K.avr or K.gov)) or isinstance(K, (Converter, SVC, Statcom, HVDC, Wind))]

    def _freeze(self, x, y, t):
        """5.0.13: the holds of the limits without windup as at the start of the step, for its Newton (Unit._hold)."""
        n = self.n
        for K in self._units():
            K._fz, K._rec = None, {}
            K.eval(x[K.x0:K.x0 + K.nx * K.m].reshape(K.m, K.nx), y[:n][K.bus], y[n:][K.bus], t)
            K._fz, K._rec = K._rec, None

    def _thaw(self):
        for K in self._units():
            K._fz = None

    def _project(self, x, y=None):
        """After a step: every state of a limit without windup back within its limits (a limit reached inside the step:
        the state stops there, as the hold of the EMT, whose steps are µs). 5.1.4: a wind turbine with its limits at the new
        point y (Wind._project_limits: the limits of its current limitation move with |u|)."""
        n = self.n
        for K in self._units():
            X = x[K.x0:K.x0 + K.nx * K.m].reshape(K.m, K.nx)
            for j, base, lo, hi, on in K.limits():
                X[:, j] = np.where(on, np.clip(base + X[:, j], lo, hi) - base, X[:, j])
            if y is not None and isinstance(K, Wind):
                K._project_limits(X, y[:n][K.bus], y[n:][K.bus])
        return x

    def _step_tr(self, x, y, f_n, t, h, tol, lu, at=None):
        """One trapezoidal step, network and states together; the iteration matrix lu is kept (Newton with a fixed matrix).
        5.0.13: the holds of the limits without windup are those of the start of the step (_freeze, _project); 5.0.14: or
        those of the point `at` (x, y)."""
        nx = self.nx
        z = np.r_[x + h * f_n, y]                            # Euler predictor
        self._freeze(*(at or (x, y)), t)
        ok = False
        try:
            for it in range(1, 16):
                f, g = self.fg(z[:nx], z[nx:], t + h)
                R = np.r_[z[:nx] - x - 0.5 * h * (f + f_n), g]
                dz = lu.solve(R)
                z -= dz
                if np.max(np.abs(dz)) < tol * (1 + np.max(np.abs(z))):
                    ok = True
                    break
        finally:
            self._thaw()
        return self._project(z[:nx].copy(), z[nx:]), z[nx:], it, ok

    def _step_be2(self, x, y, t, h, tol, lu, full=False):
        """5.1.1: the step after a block or a deblock of a station (THEORY §8ΩΦ.3): two half steps of backward Euler, with the
        iteration matrix of the trapezoidal step h (E − (h/2)·J is that of backward Euler with h/2), as the critical damping
        adjustment of the EMT programs. The open DC reactor of a blocked station leaves a light, fast mode of the DC lines
        (their L with the capacitance at the open end, some hundred Hz): the trapezoidal rule with a step of ms keeps it ringing
        from step to step, where backward Euler damps it. The holds as at the start of each half step. full: the iteration
        matrix anew at every iteration (after a jump of the state: the block, the clearing of a fault). Returns (x, y,
        iterations, converged, factorizations)."""
        nx = self.nx
        its, ok_all, nf = 0, True, 0
        for k in (1, 2):
            t0 = t + (k - 1) * h / 2
            z = np.r_[x, y]
            self._freeze(x, y, t0)
            ok = False
            try:
                for it in range(1, 21 if full else 16):
                    f, g = self.fg(z[:nx], z[nx:], t0 + h / 2)
                    R = np.r_[z[:nx] - x - 0.5 * h * f, g]
                    if full:
                        lu = spla.splu(self._iter_matrix(z[:nx], z[nx:], t0 + h / 2, h))
                        nf += 1
                    dz = lu.solve(R)
                    z -= dz
                    if np.max(np.abs(dz)) < tol * (1 + np.max(np.abs(z))):
                        ok = True
                        break
            finally:
                self._thaw()
            its += it
            ok_all = ok_all and ok
            x, y = self._project(z[:nx].copy(), z[nx:]), z[nx:]
        return x, y, its, ok_all, nf

    def _step_full(self, x, y, f_n, t, h, tol, at, iters=20):
        """5.0.14: one trapezoidal step by Newton with the iteration matrix at every iteration (the holds of the limits as at
        the point `at`): for a step in which a limit of a converter is crossed and the iteration with a fixed matrix only
        creeps (its matrix from the other side of the kink). Returns (x, y, iterations, converged, factorizations)."""
        nx = self.nx
        z = np.r_[at[0], at[1]]
        self._freeze(*at, t)
        ok, n = False, 0
        try:
            for it in range(1, iters + 1):
                f, g = self.fg(z[:nx], z[nx:], t + h)
                R = np.r_[z[:nx] - x - 0.5 * h * (f + f_n), g]
                dz = spla.splu(self._iter_matrix(z[:nx], z[nx:], t + h, h)).solve(R)
                n += 1
                z -= dz
                if np.max(np.abs(dz)) < tol * (1 + np.max(np.abs(z))):
                    ok = True
                    break
        finally:
            self._thaw()
        return self._project(z[:nx].copy(), z[nx:]), z[nx:], it, ok, n

    def _step_alt(self, x, y, f_n, t, h, tol):
        """One trapezoidal step with the alternating solution: the network for the states (Newton on g with g_y), then the
        states for the voltages (a fixed-point iteration of the trapezoidal rule), repeated to convergence. 5.0.13: the
        holds of the limits without windup as in _step_tr."""
        self._freeze(x, y, t)
        try:
            xk, yk, it, ok = self._alt(x, y, f_n, t, h, tol)
        finally:
            self._thaw()
        return self._project(xk.copy(), yk), yk, it, ok

    def _alt(self, x, y, f_n, t, h, tol):
        nx = self.nx
        xk = x + h * f_n
        yk = y
        gy = None
        for it in range(1, 60):
            for _ in range(8):
                _, g = self.fg(xk, yk, t + h)
                if np.max(np.abs(g)) < tol:
                    break
                if gy is None:
                    gy = spla.splu(self.jac(xk, yk, t + h)[nx:, nx:].tocsc())
                yk = yk - gy.solve(g)
            f, _ = self.fg(xk, yk, t + h)
            x1 = x + 0.5 * h * (f + f_n)
            d = np.max(np.abs(x1 - xk)) if nx else 0.0
            xk = x1
            if d < tol * (1 + np.max(np.abs(xk))):
                _, g = self.fg(xk, yk, t + h)
                if np.max(np.abs(g)) < 1e3 * tol:
                    return xk, yk, it, True
        return xk, yk, it, False

    @staticmethod
    def _lte(hist, t, x, t1, x1, rtol, atol):
        """The local error of the trapezoidal step from the quadratic predictor through the last three points
        (Milne): the predictor misses by x‴·(t1−t)(t1−t_a)(t1−t_b)/6, the trapezoid by −x‴·h³/12."""
        (ta, xa), (tb, xb) = hist[-2], hist[-1]
        if not (ta < tb < t < t1):
            return 0.0
        # Newton form through (ta, xa), (tb, xb), (t, x)
        d1 = (xb - xa) / (tb - ta)
        d2 = (x - xb) / (t - tb)
        d12 = (d2 - d1) / (t - ta)
        xp = x + d2 * (t1 - t) + d12 * (t1 - t) * (t1 - tb)
        h = t1 - t
        cp = (t1 - t) * (t1 - tb) * (t1 - ta) / 6.0
        ct = -h ** 3 / 12.0
        lte = (x1 - xp) * ct / (ct - cp)
        sc = rtol * np.maximum(np.abs(x), np.abs(x1)) + atol
        return float(np.max(np.abs(lte) / sc))

    # ------------------------------------------------------------ batch and critical clearing time
    def batch(self, scenarios, t_end, **kw):
        """Many disturbances from the same start: scenarios = [events, …]. Returns the result of each, with 'stable'
        (every rotor angle within 180° of the centre of inertia to the end)."""
        out = []
        for evs in scenarios:
            r = self.simulate(t_end, events=evs, **kw)
            r['stable'] = self.stable(r)
            out.append(r)
        return out

    def quantities(self, r):
        """5.0.13: the time series of every machine from a result of simulate: δ (rad), ω, P, Q (pu on the base of the
        system), |V|, and with the model of 5.0.13 E_fd, T_m, T_e, the field current and the output of the PSS; and |V| of
        every bus ('buses'). A tripped unit gives P = Q = 0 from its trip."""
        V = r['V']
        out = {'t': r['t'], 'buses': {b: np.abs(V[:, i]) for i, b in enumerate(self.names)}}
        for K in self.kinds:
            if 'delta' not in K.states:
                continue
            Xs = r['x'][:, K.x0:K.x0 + K.nx * K.m].reshape(len(r['t']), K.m, K.nx)
            Vb = V[:, K.bus]
            if isinstance(K, Unit):
                # the references and the trips as they were at each point of the result: from the start (simulate resets
                # them), each event from the point recorded after it (its index 'i')
                keep = (K.p['on'].copy(), K.p['avr']['dV'].copy() if K.avr else None, K.p['gov']['dP'].copy() if K.gov else None)
                K.p['on'] = np.ones(K.m)
                if K.avr:
                    K.p['avr']['dV'] = np.zeros(K.m)
                if K.gov:
                    K.p['gov']['dP'] = np.zeros(K.m)
                evs = [e for e in r.get('events', ()) if e.get('gen') in K.names and e['kind'] in ('vref', 'pref')]
                cols, ei = {}, 0
                for ti in range(len(r['t'])):
                    while ei < len(evs) and evs[ei]['i'] <= ti:
                        j = K.names.index(evs[ei]['gen'])
                        if evs[ei]['kind'] == 'vref':
                            K.p['avr']['dV'][j] = float(evs[ei]['dV'])
                        else:
                            K.p['gov']['dP'][j] = float(evs[ei]['dP'])
                        ei += 1
                    o = K.outputs(Xs[ti], Vb[ti].real, Vb[ti].imag)
                    for key, val in o.items():
                        cols.setdefault(key, np.empty((len(r['t']), K.m)))[ti] = val
                K.p['on'] = keep[0]
                if K.avr:
                    K.p['avr']['dV'] = keep[1]
                if K.gov:
                    K.p['gov']['dP'] = keep[2]
            else:
                cols = {'P': np.empty((len(r['t']), K.m)), 'Q': np.empty((len(r['t']), K.m))}
                for ti in range(len(r['t'])):
                    _, ir, ii = K.eval(Xs[ti], Vb[ti].real, Vb[ti].imag, 0.0)
                    cols['P'][ti] = Vb[ti].real * ir + Vb[ti].imag * ii
                    cols['Q'][ti] = Vb[ti].imag * ir - Vb[ti].real * ii
                cols['V'] = np.abs(Vb)
            for i, nm in enumerate(K.names):
                d = {'delta': Xs[:, i, 0], 'omega': Xs[:, i, 1]}
                d.update({key: val[:, i] for key, val in cols.items()})
                for e in r.get('events', ()):
                    if e['kind'] == 'gen' and e.get('gen') == nm:      # tripped: nothing out from the trip on
                        late = np.arange(len(r['t'])) >= e['i']
                        for key in ('P', 'Q', 'Te'):
                            if key in d:
                                d[key] = np.where(late, 0.0, d[key])
                out[nm] = d
        # 5.0.14: the converters, with their references and trips as at each point of the result
        for K in self.kinds:
            if not isinstance(K, (Converter, SVC, Statcom)):
                continue
            Xs = r['x'][:, K.x0:K.x0 + K.nx * K.m].reshape(len(r['t']), K.m, K.nx)
            Vb = V[:, K.bus]
            keep = {q: K.p[q].copy() for q in ('on', 'dP', 'dV') if q in K.p}
            K.p['on'], K.p['dV'] = np.ones(K.m), np.zeros(K.m)
            if 'dP' in K.p:
                K.p['dP'] = np.zeros(K.m)
            evs = [e for e in r.get('events', ()) if e.get('gen') in K.names and e['kind'] in ('vref', 'pref', 'gen')]
            cols, ei = {}, 0
            for ti in range(len(r['t'])):
                while ei < len(evs) and evs[ei]['i'] <= ti:
                    j, kd = K.names.index(evs[ei]['gen']), evs[ei]['kind']
                    if kd == 'gen':
                        K.p['on'][j] = 0.0
                    elif kd == 'vref':
                        K.p['dV'][j] = float(evs[ei]['dV'])
                    else:
                        K.p['dP'][j] = float(evs[ei]['dP'])
                    ei += 1
                o = K.outputs(Xs[ti], Vb[ti].real, Vb[ti].imag)
                for key, val in o.items():
                    cols.setdefault(key, np.empty((len(r['t']), K.m)))[ti] = np.real(val)
            K.p.update(keep)
            for i, nm in enumerate(K.names):
                d = {key: val[:, i] for key, val in cols.items()}
                for j, s in enumerate(K.states):
                    d.setdefault(s, Xs[:, i, j])
                out[nm] = d
        # 5.1.4: the wind turbines, with their references, trips and discrete parts as at each point of the result
        winds = [K for K in self.kinds if isinstance(K, Wind)]
        for wi, K in enumerate(winds):
            Xs = r['x'][:, K.x0:K.x0 + K.nx * K.m].reshape(len(r['t']), K.m, K.nx)
            Vb = V[:, K.bus]
            keep = ({q: K.p[q].copy() for q in ('on', 'dP', 'dX')}, K.d)
            K.p['on'], K.p['dP'], K.p['dX'] = np.ones(K.m), np.zeros(K.m), np.zeros(K.m)
            evs = [e for e in r.get('events', ()) if e.get('gen') in K.names and e['kind'] in ('vref', 'pref', 'qref', 'gen')]
            cols, ei = {}, 0
            for ti in range(len(r['t'])):
                while ei < len(evs) and evs[ei]['i'] <= ti:
                    j, kd = K.names.index(evs[ei]['gen']), evs[ei]['kind']
                    if kd == 'gen':
                        K.p['on'][j] = 0.0
                    elif kd == 'pref':
                        K.p['dP'][j] = float(evs[ei]['dP'])
                    else:
                        K.p['dX'][j] = float(evs[ei]['dV'] if kd == 'vref' else evs[ei]['dQ'])
                    ei += 1
                K.d = r['d'][ti][wi]
                o = K.outputs(Xs[ti], Vb[ti].real, Vb[ti].imag)
                for key, val in o.items():
                    cols.setdefault(key, np.empty((len(r['t']), K.m)))[ti] = np.real(val)
            K.p.update(keep[0])
            K.d = keep[1]
            for i, nm in enumerate(K.names):
                d = {key: val[:, i] for key, val in cols.items()}
                for j, st_ in enumerate(K.states):
                    d.setdefault(st_, Xs[:, i, j])
                out[nm] = d
        # 5.0.15: the DC grids, with the references and trips of their stations as at each point of the result
        for K in self.kinds:
            if not isinstance(K, HVDC):
                continue
            nt = len(r['t'])
            Xs = r['x'][:, K.x0:K.x0 + K.nx]
            Vb = V[:, K.bus]
            keep = {'lon': K.p['lon'].copy(), **{(q, a): K.p[q][a].copy() for q in 'gfdsm' for a in ('on', 'dP', 'dV')}}
            kblk = ({q: K.p[q]['blk'].copy() for q in 'gfm'}, K.lblk.copy(), K.pr, K.can_block)      # 5.1.1
            K.p['lon'] = np.ones(len(K.lines))
            for q in 'gfdsm':
                K.p[q]['on'], K.p[q]['dP'], K.p[q]['dV'] = np.ones(len(K.p[q]['on'])), 0 * K.p[q]['dP'], 0 * K.p[q]['dV']
            evs = [e for e in r.get('events', ()) if e['kind'] in ('gen', 'vref', 'pref', 'trip', 'block', 'deblock')
                   and self._hvdc(str(e.get('gen', e.get('branch'))))[0] is K]
            K._blocks_reset()
            K.can_block = K.has_prot or any(e['kind'] in ('block', 'deblock') for e in evs)
            st = {nm: {} for nm in K.st_names}
            dd = {nm: np.empty(nt) for nm in K.dd_names}
            ss = {nm: np.empty(nt) for nm in K.sr_names}
            il = np.empty((nt, len(K.lines)))
            ei = 0
            for ti in range(nt):
                while ei < len(evs) and evs[ei]['i'] <= ti:
                    self._apply(dict(evs[ei]))
                    ei += 1
                o = K.outputs(Xs[ti][None, :], Vb[ti].real, Vb[ti].imag, float(r['t'][ti]))
                il[ti] = np.real(o['il'])
                for q, names in (('g', K.st_names[:K.ng]), ('f', K.st_names[K.ng:K.ng + K.nf]), ('m', K.st_names[K.ng + K.nf:])):
                    if q in o:
                        for key, val in o[q].items():
                            for j, nm in enumerate(names):
                                st[nm].setdefault(key, np.empty(nt))[ti] = np.real(val[j])
                if 'd' in o:
                    for j, nm in enumerate(K.dd_names):
                        dd[nm][ti] = np.real(o['d']['P'][j])
                if 's' in o:
                    for j, nm in enumerate(K.sr_names):
                        ss[nm][ti] = np.real(o['s']['I'][j])
            K.p['lon'] = keep.pop('lon')
            for (q, a), v in keep.items():
                K.p[q][a] = v
            for q in 'gfm':                                 # 5.1.1
                K.p[q]['blk'] = kblk[0][q]
            K.lblk, K.pr, K.can_block, K._zero = kblk[1], kblk[2], kblk[3], []
            out['dc'] = {'buses': {b: Xs[:, K.i_u[k]] for k, b in enumerate(K.dc_names)}, 'stations': st, 'dcdc': dd, 'sources': ss,
                         'lines': {nm: il[:, j] for j, nm in enumerate(K.lname)}, 'device': K}
        return out

    def stable(self, r, limit=math.pi):
        idx, H = [], []
        for K in self.kinds:
            if 'delta' in K.states:
                on = K.p.get('on', np.ones(K.m))
                for i in range(K.m):
                    if on[i] == 0:                          # a tripped unit (5.0.13) is out of the centre of inertia
                        continue
                    idx.append(K.x0 + i * K.nx)
                    H.append(K.p['H'][i])
        if not idx:
            return True
        D = r['x'][:, idx]
        H = np.array(H)
        coi = D @ H / H.sum()
        return bool(np.all(np.isfinite(D)) and np.max(np.abs(D - coi[:, None])) < limit)

    def cct(self, fault, clear, t_fault=0.1, lo=0.0, hi=0.5, t_end=3.0, tol=1e-3, **kw):
        """The critical clearing time by bisection: fault (an event without 't'), clear (the events that clear it, without
        't'), the fault at t_fault. Returns (the longest stable duration, the shortest unstable one, runs)."""
        runs = 0

        def ok(d):
            nonlocal runs
            runs += 1
            evs = [{**fault, 't': t_fault}] + [{**c, 't': t_fault + d} for c in clear]
            return self.stable(self.simulate(t_end, events=evs, **kw))
        if not ok(lo):
            return None, lo, runs
        if ok(hi):
            return hi, None, runs
        while hi - lo > tol:
            mid = 0.5 * (lo + hi)
            if ok(mid):
                lo = mid
            else:
                hi = mid
        return lo, hi, runs

    # ------------------------------------------------------------ small signal
    def linearize(self, x=None, y=None):
        """The blocks of the Jacobian at (x, y) (default the start) and, for a small system, the state matrix
        A = f_x − f_y·g_y⁻¹·g_x."""
        x = self.x0 if x is None else x
        y = self.y0 if y is None else y
        J = self.jac(x, y).tocsc()
        nx = self.nx
        out = {'J': J, 'states': self.state_names}
        if nx <= 2000:
            fx, fy = J[:nx, :nx].toarray(), J[:nx, nx:].toarray()
            gx, gy = J[nx:, :nx].tocsc(), J[nx:, nx:].tocsc()
            out['A'] = fx - fy @ spla.splu(gy).solve(gx.toarray())
        return out

    def eigen(self, method='auto', sigma=None, k=8, x=None, y=None):
        """The eigenvalues of the linearized system with their modes. method: 'qr' (all, from A), 'arnoldi' (k near sigma,
        rad/s complex, by shift and invert on the augmented pencil, without forming A), 'auto' (QR up to 400 states).
        Each mode: lambda, f (Hz), zeta, the states that participate most (participation factors) and the shape on the
        rotor speeds."""
        if method == 'auto':
            method = 'qr' if self.nx <= 400 else 'arnoldi'
        nx = self.nx
        if method == 'qr':
            lam, Vr = np.linalg.eig(self.linearize(x, y)['A'])
            Wl = np.linalg.inv(Vr)                         # rows: the left eigenvectors, W·V = I
        else:
            # J·v = λ·E·v (E = I on the states, 0 on the network): (J − σE)⁻¹·E·v = v/(λ − σ). The left vectors from the
            # adjoint: E·(J − σE)⁻ᴴ·u = u/conj(λ − σ), w = (J − σE)⁻ᴴ·u, ψ = conj(w) on the states.
            J = self.jac(self.x0 if x is None else x, self.y0 if y is None else y).tocsc()
            if sigma is None:
                sigma = 2j * math.pi * 1.0
            E = sp.diags(np.r_[np.ones(nx), np.zeros(self.ny)]).tocsc()
            Ms = (J - sigma * E).astype(complex).tocsc()
            lu, luH = spla.splu(Ms), spla.splu(Ms.conj().T.tocsc())
            N = J.shape[0]
            kk = min(k, nx - 2)
            nu, Vv = spla.eigs(spla.LinearOperator((N, N), matvec=lambda v: lu.solve(E @ v), dtype=complex), k=kk, which='LM', tol=1e-13)
            mu, Uu = spla.eigs(spla.LinearOperator((N, N), matvec=lambda v: E @ luH.solve(v), dtype=complex), k=kk, which='LM', tol=1e-13)
            lam = sigma + 1.0 / nu
            lamL = sigma + 1.0 / np.conj(mu)
            Vr = Vv[:nx, :]
            Wl = np.empty((len(lam), nx), complex)
            for i, l in enumerate(lam):
                j = int(np.argmin(np.abs(lamL - l)))
                w = np.conj(luH.solve(Uu[:, j]))[:nx]
                s = w @ Vr[:, i]
                Wl[i] = w / s if abs(s) > 0 else w
        modes = []
        wi = [i for i, (_, s) in enumerate(self.state_names) if s == 'omega']
        for i in np.argsort(-np.real(lam)):
            l = lam[i]
            p = np.abs(Wl[i] * Vr[:, i])
            p = p / p.sum() if p.sum() > 0 else p
            top = [(self.state_names[j][0], self.state_names[j][1], float(p[j])) for j in np.argsort(-p)[:4]]
            shape = Vr[wi, i]
            if len(shape) and np.max(np.abs(shape)) > 0:
                shape = shape / shape[np.argmax(np.abs(shape))]
            modes.append({'lambda': complex(l), 'f': abs(l.imag) / (2 * math.pi), 'zeta': float(-l.real / abs(l)) if abs(l) > 0 else 1.0,
                          'part': top, 'shape': {self.state_names[j][0]: complex(s) for j, s in zip(wi, shape)}})
        return {'method': method, 'n': nx, 'modes': modes, 'lambda': np.array([m['lambda'] for m in modes])}

    # ------------------------------------------------------------ the classical network reduced to the internal nodes
    def reduced_y(self, which='pre', events=()):
        """The admittance matrix of the network with the loads as impedances and X′_d of the classical machines, reduced
        to their internal nodes (Kron): the classical formulation of a stability study, for its checks."""
        self._y_build()
        for e in events:
            self._apply(dict(e))
        K = next(k for k in self.kinds if isinstance(k, Classical))
        n, m = self.n, K.m
        Y = sp.lil_matrix((n + m, n + m), dtype=complex)
        Y[:n, :n] = self.Y
        for i in range(m):
            y = 1 / (K.p['Ra'][i] + 1j * K.p['Xdp'][i])
            b = K.bus[i]
            Y[n + i, n + i] += y
            Y[b, b] += y
            Y[n + i, b] -= y
            Y[b, n + i] -= y
        Y = Y.toarray()
        Ynn, Ynr, Yrn, Yrr = Y[n:, n:], Y[n:, :n], Y[:n, n:], Y[:n, :n]
        out = Ynn - Ynr @ np.linalg.solve(Yrr, Yrn)
        self._y_build()
        return out
