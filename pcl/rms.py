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
             'KF': 0.058, 'TF': 0.62},
}
PSS_DEFAULTS = {'KS': 20.0, 'TW': 1.4, 'T1': 0.154, 'T2': 0.033, 'T3': 0.0, 'T4': 0.0, 'VSMIN': -0.1, 'VSMAX': 0.1}
GOV_DEFAULTS = {
    'steam': {'Pr': 1.0, 'R': 0.05, 'KAX': 149.0, 'V1': 0.02, 'TSR': 0.7, 'TSM': 0.23, 'LC1': 1.0, 'LC2': -3.0,
              'TCH': 0.3, 'TRH': 7.0, 'TCO': 0.5, 'FHP': 0.3, 'FIP': 0.3, 'FLP': 0.4},
    'hydro': {'Pr': 1.0, 'gFL': 0.96, 'gNL': 0.16, 'RP': 0.04, 'RT': 0.4, 'TR': 5.0, 'TP': 0.05, 'KS': 5.0,
              'Rclose': 0.16, 'Ropen': 0.16, 'TG': 0.2, 'Tw': 1.0},
}
SUB_KEYS = ('Xd', 'Xdp', 'Xdpp', 'Xq', 'Xqp', 'Xqpp', 'Xl', 'Td0p', 'Td0pp', 'Tq0p', 'Tq0pp', 'Ra', 'H', 'D', 'SG10', 'SG12')
AVR_STATES = {'st1a': ('avr_tr', 'avr_ll1', 'avr_ll2', 'avr_va', 'avr_rf'),
              'dc1a': ('avr_tr', 'avr_ll1', 'avr_ll2', 'avr_vr', 'avr_efd', 'avr_rf')}
PSS_STATES = ('pss_w', 'pss_l1', 'pss_l2')
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
        st = ['delta', 'omega', 'eq', 'ed', 'psi1d', 'psi2q']
        self.i_avr = len(st)
        st += list(AVR_STATES.get(avr, ()))
        self.i_pss = len(st)
        st += list(PSS_STATES) if pss else []
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
    def _pss(self, Z, w):
        q = self.p['pss']
        u = w - 1.0
        y, f0 = _wash(Z[:, 0], u, q['TW'], q['KS'])
        y, f1 = _leadlag(Z[:, 1], y, q['T1'], q['T2'])
        y, f2 = _leadlag(Z[:, 2], y, q['T3'], q['T4'])
        return _clip(y, q['VSMIN'], q['VSMAX']), np.c_[f0, f1, f2]

    def _avr(self, Z, vt, ifd, vs):
        """ST1A or DC1A as the AVR of the EMT (netlib.js avrDef), in deviations from the start. The rate feedback
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
        else:
            vr, f_vr = _nwlag(Z[:, 3], x, q['VR0'], q['KA'], q['TA'], q['VRMIN'], q['VRMAX'], self._hold('vr'))
            xe = Z[:, 4]
            a, bb, ke = q['AEX'], q['BEX'], q['KE']
            selfx = np.isnan(ke)
            kk = np.where(selfx, 0.0, ke)
            loss = np.where(selfx, a * np.exp(bb * (e0 + xe)) - a * np.exp(bb * e0), kk + a * np.exp(bb * (e0 + xe)))
            f_e = (q['VR0'] + vr - loss * (e0 + xe)) / q['TE']
            efd = efd_s
            mid = [f_vr, f_e]
        f_rf = np.where(rf, ((efd - e0) - Z[:, k]) / tf, 0 * Z[:, k])
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
            if self.avr == 'dc1a':
                ke = q['KE']
                q['VR0'] = np.where(np.isnan(ke), 0.0, (np.where(np.isnan(ke), 0.0, ke) + q['AEX'] * np.exp(q['BEX'] * q['e0'])) * q['e0'])
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
            vs, Fp = self._pss(X[:, self.i_pss:self.i_pss + 3], w)
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
        vs = self._pss(X[:, self.i_pss:self.i_pss + 3], w)[0] if self.pss else 0 * w
        efd = self._avr(X[:, self.i_avr:self.i_pss], np.sqrt(Vr * Vr + Vi * Vi), Ifd, vs)[0] if self.avr else p['Efd0'] + 0 * w
        tm = self._gov(X[:, self.i_gov:], w)[0] if self.gov else p['Tm0'] + 0 * w
        Ir, Ii = Id * c - Iq * s, Id * s + Iq * c
        return {'P': Vr * Ir + Vi * Ii, 'Q': Vi * Ir - Vr * Ii, 'V': np.sqrt(Vr * Vr + Vi * Vi), 'Efd': efd, 'Tm': tm,
                'Te': Te, 'Ifd': Ifd, 'vs': vs}


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
KNOWN_ELEMENTS = {'generator', 'load', 'branch', 'feeder', 'shunt', 'line', 'reactor', 'transformer', 'transformer3'}   # 5.0.13: the passive ones of the network as Y


# ---------------------------------------------------------------- the system
class System:
    """The DAE of a network of pcl.network with machines, from a load flow.

    machines: {name of a generator: {'model': 'classical' | 'two_axis', 'Xd', 'Xdp', 'Xq', 'Xqp', 'Td0p', 'Tq0p', 'Ra',
    'H', 'D', 'Sn'}} in pu on the rating Sn (VA; default the base of the network); a generator not listed gets the model
    `default` with the typical values TYPICAL on its rating Sr (the next step brings the library of models). A feeder
    (an external grid) is a Source behind its short-circuit impedance, or a stiff one (X 10⁻⁴ pu).
    loads: 'Z' (constant impedance, as in a classical study), 'I', 'P', or {'z': a, 'i': b, 'p': c} the shares of P and Q.
    f: the frequency of the network (Hz; default net.f). pf: the result of net.power_flow() (computed if not given)."""

    def __init__(self, net, machines=None, default='two_axis', loads='Z', f=None, pf=None, vmin=0.7):
        bad = sorted({e['kind'] for e in net.elements} - KNOWN_ELEMENTS)
        if bad:
            raise RMSError('δεν ταιριάζουν στον πυρήνα RMS ακόμη, γιατί δεν έχουν μοντέλο RMS: ' + ', '.join(bad))
        self.net, self.f = net, float(f or getattr(net, 'f', 50.0) or 50.0)
        self.wb = 2 * math.pi * self.f
        self.case = c = net.case()
        self.n, self.names, self.idx = c.n, c.names, c.idx
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
        for e in gens:
            md = dict(machines.get(e['name'], {}))
            model = md.pop('model', default)
            if model not in KINDS and model != 'subtransient':
                raise RMSError('άγνωστο μοντέλο μηχανής %r (%s, subtransient)' % (model, ', '.join(KINDS)))
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
                raise RMSError('άγνωστη διέγερση %r (st1a, dc1a)' % at)
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
            if pss:
                ctl['pss'] = {q: _num(pss if isinstance(pss, dict) else {}, q, v) for q, v in PSS_DEFAULTS.items()}
            if gt:
                g = {q: _num(gov, q, v) for q, v in GOV_DEFAULTS[gt].items()}
                g['Pr'] /= k                                # the rating of the turbine on the base of the system
                g['dP'] = 0.0
                ctl['gov'] = g
            units.setdefault((model, at, bool(pss), gt), []).append((e['name'], self.idx[e['bus']], vals, ctl))
        for model, L in groups.items():
            p = {q: np.array([v[q] for _, _, v in L]) for q in MACHINE_KEYS}
            self.kinds.append(KINDS[model]([a for a, _, _ in L], [b for _, b, _ in L], p))
        for (model, at, ps, gt), L in units.items():
            p = {q: np.array([v[q] for _, _, v, _ in L], float) for q in SUB_KEYS}
            for part in ('avr', 'pss', 'gov'):
                if L[0][3].get(part):
                    p[part] = {q: np.array([c[part][q] for _, _, _, c in L], float) for q in L[0][3][part]}
            self.kinds.append(Unit([a for a, _, _, _ in L], [b for _, b, _, _ in L], p, model=model, avr=at, pss=ps, gov=gt))
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
        self.Sg = Sg
        # the states
        off = 0
        for K in self.kinds:
            K.x0 = off
            off += K.nx * K.m
        self.nx = off
        self.ny = 2 * self.n
        self.state_names = [(K.names[i], s) for K in self.kinds for i in range(K.m) for s in K.states]
        self._y_build()
        self.events_done = []
        self.x = None

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
            gi = K.x0 + np.arange(m)[:, None] * k + np.arange(k)[None, :]         # global index of each state
            br, bi = nx + K.bus, nx + n + K.bus
            outs_r = np.c_[gi, br, bi]                                          # rows: f of each state, g_r, g_i of the bus
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
    def _apply(self, ev):
        k = ev['kind']
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
        elif k in ('gen', 'vref', 'pref'):                  # 5.0.13: trip of a unit, step of its voltage or load reference
            K, i = self._unit(ev['gen'])
            if k == 'gen':
                K.p['on'][i] = 0.0
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
            if isinstance(K, Unit) and name in K.names:
                return K, K.names.index(name)
        raise RMSError('καμία μονάδα με όνομα %r (μόνο μηχανές με το μοντέλο της 5.0.13 δέχονται αυτά τα συμβάντα)' % name)

    def _reset_units(self):
        for K in self.kinds:
            if isinstance(K, Unit):
                K.p['on'] = np.ones(K.m)
                if K.avr:
                    K.p['avr']['dV'] = np.zeros(K.m)
                if K.gov:
                    K.p['gov']['dP'] = np.zeros(K.m)

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
        core of 4.23). Returns {'t', 'x', 'V' (complex bus voltages), 'stats', 'events' (5.0.13: (t, kind, unit) as applied)}."""
        if self.x is None:
            self.init()
        self._y_build()
        self._reset_units()
        x, y, t = self.x0.copy(), self.y0.copy(), 0.0
        evs = sorted([dict(e) for e in events], key=lambda e: e['t'])
        nx, n = self.nx, self.n
        T, Xs, Vs = [0.0], [x.copy()], [y[:n] + 1j * y[n:]]
        done = []
        st = {'steps': 0, 'newton': 0, 'lu': 0, 'rejected': 0, 'events': 0, 'nonconv': 0}
        f_n, _ = self.fg(x, y, t)
        lu, lu_h, slow = None, None, False
        hist = []                                            # (t, x) of the accepted points since the last event
        h0 = min(h, max(hmin, 1e-3))                         # the first step of the variable step, and after an event
        hc = h0 if step == 'var' else h
        t0 = time.perf_counter()
        ei = 0
        while t < t_end - 1e-12:
            while ei < len(evs) and evs[ei]['t'] <= t + 1e-12:
                self._apply(evs[ei])
                done.append({**{k: v for k, v in evs[ei].items() if k in ('kind', 'gen', 'bus', 'branch', 'dV', 'dP', 'id')}, 't': t, 'i': len(T)})
                y, ok = self._consistent(x, y, t)
                if not ok:
                    st['nonconv'] += 1
                f_n, _ = self.fg(x, y, t)
                lu, hist, hc = None, [], (min(hc, h, h0) if step == 'var' else hc)
                st['events'] += 1
                ei += 1
                T.append(t); Xs.append(x.copy()); Vs.append(y[:n] + 1j * y[n:])
            tn = evs[ei]['t'] if ei < len(evs) else t_end
            hh = min(hc, tn - t, t_end - t)
            if method == 'alternating':
                xn, yn, it, ok = self._step_alt(x, y, f_n, t, hh, tol)
            else:
                if lu is None or lu_h != hh or slow:
                    M = self._iter_matrix(x, y, t + hh, hh)
                    lu, lu_h = spla.splu(M), hh
                    st['lu'] += 1
                xn, yn, it, ok = self._step_tr(x, y, f_n, t, hh, tol, lu)
                if not ok:                                    # refactorize at the new point and try once more
                    M = self._iter_matrix(x, y, t + hh, hh)
                    lu, lu_h = spla.splu(M), hh
                    st['lu'] += 1
                    xn, yn, it2, ok = self._step_tr(x, y, f_n, t, hh, tol, lu)
                    it += it2
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
            f_n, _ = self.fg(x, y, t)
            st['steps'] += 1
            if st['steps'] % record_every == 0 or t >= t_end - 1e-12:
                T.append(t); Xs.append(x.copy()); Vs.append(y[:n] + 1j * y[n:])
        st['time'] = time.perf_counter() - t0
        self.x, self.y, self.t = x, y, t
        return {'t': np.array(T), 'x': np.array(Xs), 'V': np.array(Vs), 'stats': st, 'events': done}

    def _iter_matrix(self, x, y, t, h):
        J = self.jac(x, y, t).tocsr()
        nx = self.nx
        E = sp.diags(np.r_[np.ones(nx), np.zeros(self.ny)])
        S = sp.diags(np.r_[np.full(nx, -0.5 * h), np.ones(self.ny)])
        return (E + S @ J).tocsc()

    def _units(self):
        return [K for K in self.kinds if isinstance(K, Unit) and (K.avr or K.gov)]

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

    def _project(self, x):
        """After a step: every state of a limit without windup back within its limits (a limit reached inside the step:
        the state stops there, as the hold of the EMT, whose steps are µs)."""
        for K in self._units():
            X = x[K.x0:K.x0 + K.nx * K.m].reshape(K.m, K.nx)
            for j, base, lo, hi, on in K.limits():
                X[:, j] = np.where(on, np.clip(base + X[:, j], lo, hi) - base, X[:, j])
        return x

    def _step_tr(self, x, y, f_n, t, h, tol, lu):
        """One trapezoidal step, network and states together; the iteration matrix lu is kept (Newton with a fixed matrix).
        5.0.13: the holds of the limits without windup are those of the start of the step (_freeze, _project)."""
        nx = self.nx
        z = np.r_[x + h * f_n, y]                            # Euler predictor
        self._freeze(x, y, t)
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
        return self._project(z[:nx].copy()), z[nx:], it, ok

    def _step_alt(self, x, y, f_n, t, h, tol):
        """One trapezoidal step with the alternating solution: the network for the states (Newton on g with g_y), then the
        states for the voltages (a fixed-point iteration of the trapezoidal rule), repeated to convergence. 5.0.13: the
        holds of the limits without windup as in _step_tr."""
        self._freeze(x, y, t)
        try:
            xk, yk, it, ok = self._alt(x, y, f_n, t, h, tol)
        finally:
            self._thaw()
        return self._project(xk.copy()), yk, it, ok

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
