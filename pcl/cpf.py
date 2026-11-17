"""Continuation load flow (4.19.5, ROADMAP §77, THEORY §8Μ): how far the load of a network can grow before the load flow
has no solution, and the voltage of every bus on the way there and past it (the «nose» curve, P–V).

    run(net)        → the points of the curve, the nose (the loading margin), the weakest buses, and what happened on the way

The loads grow together from their values in the network, S_load·(1 + λ), and the generators (the slack apart) follow with
their active power, P_g·(1 + λ); a direction of one's own can be given instead. The load-flow equations get one unknown
more, F(θ, |V|, λ) = 0: a curve in the space of the unknowns. A plain Newton load flow stops working at the nose of the
curve, where its Jacobian is singular. The continuation method walks along the curve instead:

* predictor: a step along the tangent of the curve, [F_x  F_λ; e_kᵀ]·t = e_last;
* corrector: Newton on the load-flow equations with one equation more, which holds one unknown (the continuation
  parameter x_k) at its predicted value: the matrix is the one of the predictor, regular at the nose too;
* the continuation parameter is chosen at every point from the tangent: the unknown that moves most (local
  parametrisation). Far from the nose it is λ, near it a voltage or an angle;
* the length of the step: no unknown may move more than its own limit in one step (λ by `step`, a voltage by `dV`, an
  angle by STEP_A), and the step shrinks or grows with the number of iterations of the corrector;
* the nose: where dλ along the tangent changes sign. It is then found as a point of the curve itself (dλ/dx_k = 0 by
  bracketing), not read off the neighbouring points;
* with q_limits a generator that reaches a reactive limit stops holding its voltage. The curve is brought exactly onto
  the point where that happens (the equations with the limit in force and the voltage still at its set value) and goes
  on from there with the new equations, in the direction in which the voltage of that bus falls (upper limit) or rises
  (lower limit). When that direction has a decreasing λ, the limit itself is the end of the solutions: the «nose» is a
  corner (immediate instability, 'kind': 'limit').

What is not modelled: active limits of the generators, a slack bus at a reactive limit, a bus at a limit that takes up
voltage control again, taps and switched shunts that move with the load.

Sources (THEORY §8Μ): V. Ajjarapu, C. Christy, «The continuation power flow: a tool for steady state voltage stability
analysis», IEEE Trans. Power Systems 7(1), 1992 (the load parameter, predictor, corrector, local parametrisation, the choice
of the parameter, the tangent as a measure of weak buses and the index); H.-D. Chiang, A. J. Flueck, K. S. Shah, N. Balu,
«CPFLOW: a practical tool for tracing power system steady-state stationary behavior due to load and generation
variations», IEEE Trans. Power Systems 10(2), 1995 (the control of the step length: a limit per unknown, the count of the
iterations); C. A. Cañizares, F. L. Alvarado, «Point of collapse and continuation methods for large AC/DC systems», IEEE
Trans. Power Systems 8(1), 1993 (the limits on the way, the instability at a reactive limit)."""
import time

import numpy as np
from scipy import sparse as sp
from scipy.optimize import brentq
from scipy.sparse.linalg import splu

from . import powerflow as PF

STEP_A = 0.1            # rad: the most an angle may move in one step
SIGMA_MIN = 1e-7        # the smallest part of a full step before the curve is given up
Q_TOL = 1e-9            # pu: how far over a reactive limit counts as over it (as in pcl.powerflow.solve)
V_TOL = 1e-9            # pu: how far past its set voltage a bus at a limit counts as past it


class CpfError(ValueError):
    pass


class _Sys:
    """F(θ, |V|, λ) for given bus types: P at the PV and PQ buses, Q at the PQ buses; and the matrix [F_x  F_λ; e_kᵀ] on a
    pattern that is found once (the Jacobian of pcl.powerflow with one column and one full row more)."""

    def __init__(self, case, typ, dP, dL, qg):
        self.case, self.typ = case, typ
        self.dP, self.dL, self.qg = dP, dL, qg                # growth of the generation (pu) and of the loads (ZIP rows) per unit of λ; Q of the sources
        J = self.J = PF.Jacobian(case, typ)
        self.pvpq, self.pq, self.na, self.N = J.pvpq, J.pq, J.na, J.N
        n, N = case.n, J.N
        self.pm = np.full(n, -1)
        self.pm[J.pq] = J.na + np.arange(J.nm)                # bus → place of its voltage among the unknowns
        ip, nnz = J.J.indptr, J.J.nnz
        self.pJ = np.arange(nnz) + np.repeat(np.arange(N), np.diff(ip))
        self.pR = ip[1:] + np.arange(N)                       # the last row, one place per column
        self.pC = nnz + N + np.arange(N)                      # the last column
        self.pK = nnz + 2 * N                                 # the corner
        ind = np.empty(nnz + 2 * N + 1, dtype=J.J.indices.dtype)
        ind[self.pJ], ind[self.pR], ind[self.pC], ind[self.pK] = J.J.indices, N, np.arange(N), N
        ptr = np.r_[ip[:-1] + np.arange(N), nnz + N, nnz + 2 * N + 1].astype(J.J.indptr.dtype)
        self.A = sp.csc_matrix((np.zeros(len(ind)), ind, ptr), shape=(N + 1, N + 1))
        self.count = [0]                                      # factorizations (a list, so that the systems of one curve count together)

    def load(self, lam):
        return self.case.load + lam * self.dL

    def F(self, Va, Vm, lam):
        """The mismatches (pu), the voltages and the injected currents."""
        c = self.case
        V = Vm * np.exp(1j * Va)
        I = c.Y @ V
        L = self.load(lam)
        mis = V * np.conj(I) - (c.Sg.real + lam * self.dP + 1j * self.qg - (L[:, 0] * Vm ** 2 + L[:, 1] * Vm + L[:, 2]))
        return np.r_[mis[self.pvpq].real, mis[self.pq].imag], V, I

    def factor(self, V, I, Vm, lam, k):
        """LU of [F_x  F_λ; e_kᵀ] at a point (k = N: the parameter is λ)."""
        self.J.fill(V, I, load=self.load(lam))
        d = self.A.data
        d[self.pJ] = self.J.J.data
        d[self.pR] = 0.0
        g = -self.dP + (self.dL[:, 0] * Vm ** 2 + self.dL[:, 1] * Vm + self.dL[:, 2])        # dF/dλ
        d[self.pC] = np.r_[g[self.pvpq].real, g[self.pq].imag]
        d[self.pK] = 0.0
        d[self.pK if k == self.N else self.pR[k]] = 1.0
        self.count[0] += 1
        return splu(self.A)

    def get(self, Va, Vm, lam, k):
        return lam if k == self.N else (Va[self.pvpq[k]] if k < self.na else Vm[self.pq[k - self.na]])

    def moved(self, Va, Vm, lam, dx):
        Va, Vm = Va.copy(), Vm.copy()
        Va[self.pvpq] += dx[:self.na]
        Vm[self.pq] += dx[self.na:self.N]
        return Va, Vm, lam + float(dx[self.N])

    def full(self, t):
        """A vector of the unknowns as (dθ per bus, d|V| per bus, dλ)."""
        n = self.case.n
        dA, dM = np.zeros(n), np.zeros(n)
        dA[self.pvpq] = t[:self.na]
        dM[self.pq] = t[self.na:self.N]
        return dA, dM, float(t[self.N])

    def name(self, k):
        nm = self.case.names
        return 'λ' if k == self.N else ('θ ' + str(nm[self.pvpq[k]]) if k < self.na else '|V| ' + str(nm[self.pq[k - self.na]]))


def _tangent(sys, P, k):
    """dx/dx_k at a point of the curve: the solution of [F_x  F_λ; e_kᵀ]·t = e_last."""
    Va, Vm, lam = P
    _, V, I = sys.F(Va, Vm, lam)
    rhs = np.zeros(sys.N + 1)
    rhs[-1] = 1.0
    t = sys.factor(V, I, Vm, lam, k).solve(rhs)
    if not np.all(np.isfinite(t)):
        raise RuntimeError('tangent')
    return t


def _correct(sys, P, k, target, tol, max_it=8):
    """Newton on [F; x_k − target] from the point P. Returns (point, iterations, converged)."""
    Va, Vm, lam = P
    for it in range(max_it + 1):
        F, V, I = sys.F(Va, Vm, lam)
        rk = sys.get(Va, Vm, lam, k) - target
        e = np.max(np.abs(F), initial=0.0)                    # the mismatch on which every load-flow method stops
        if not np.isfinite(e + rk):
            break
        if e < tol and abs(rk) < 1e-12:
            return (Va, Vm, lam), it, True
        if it == max_it:
            break
        try:
            dx = sys.factor(V, I, Vm, lam, k).solve(-np.r_[F, rk])
        except RuntimeError:
            break
        if not np.all(np.isfinite(dx)):
            break
        Va, Vm, lam = sys.moved(Va, Vm, lam, dx)
        if np.any(Vm > 5.0) or np.any(Vm < 1e-3):
            break
    return (Va, Vm, lam), max_it, False


def _mix(P0, P1, f):
    return P0[0] + f * (P1[0] - P0[0]), P0[1] + f * (P1[1] - P0[1]), P0[2] + f * (P1[2] - P0[2])


def _fold(sys, P0, P1, tol, scale):
    """The nose between two points of one curve whose tangents have dλ of opposite sign: the point where dλ/dx_k = 0, for
    the unknown x_k (not λ) that moves most between the two. Returns (point, k) or None."""
    d = np.r_[np.abs((P1[0] - P0[0])[sys.pvpq]) / scale[0], np.abs((P1[1] - P0[1])[sys.pq]) / scale[1]]
    if not len(d) or d.max() == 0.0:
        return None
    k = int(np.argmax(d))
    a, b = sys.get(*P0, k), sys.get(*P1, k)
    memo = {}

    def g(x):
        Q, _, ok = _correct(sys, _mix(P0, P1, (x - a) / (b - a)), k, x, tol, 12)
        if not ok:
            raise RuntimeError('fold')
        memo[x] = Q
        return _tangent(sys, Q, k)[sys.N]
    try:
        x = brentq(g, min(a, b), max(a, b), xtol=1e-13, rtol=1e-14, maxiter=80)
    except (RuntimeError, ValueError):
        return None
    Q = memo.get(x)
    if Q is None:
        Q, _, ok = _correct(sys, _mix(P0, P1, (x - a) / (b - a)), k, x, tol, 12)
        if not ok:
            return None
    return Q, k


def _direction(case, direction):
    """(growth of the ZIP rows of the loads, growth of the active generation) per unit of λ, in pu."""
    n = case.n
    dL = case.load.copy()
    dP = case.Sg.real.copy()
    dP[case.typ == PF.REF] = 0.0
    if direction is None or direction == 'all':
        return dL, dP
    if direction == 'load':                                   # the loads only: the slack bus covers the growth
        return dL, np.zeros(n)
    if not isinstance(direction, dict) or set(direction) - {'load', 'gen', 'add'}:
        raise CpfError("direction: 'all', 'load' ή {'load': {ζυγός: συντελεστής}, 'gen': {ζυγός: συντελεστής}, 'add': {ζυγός: [P σε MW, Q σε Mvar]}}")
    fl, fg = np.zeros(n), np.zeros(n)
    try:
        for key, arr in (('load', fl), ('gen', fg)):
            for b, v in (direction.get(key) or {}).items():
                if str(b) not in case.idx:
                    raise CpfError(f'direction: δεν υπάρχει ζυγός {b}')
                arr[case.idx[str(b)]] = float(v)
        dL, dP = dL * fl[:, None], dP * fg
        for b, v in (direction.get('add') or {}).items():     # a constant-power load that is not there now, per unit of λ
            if str(b) not in case.idx:
                raise CpfError(f'direction: δεν υπάρχει ζυγός {b}')
            dL[case.idx[str(b)], 2] += complex(float(v[0]), float(v[1])) * 1e6 / case.S_base
    except CpfError:
        raise
    except (TypeError, ValueError, IndexError, AttributeError):
        raise CpfError("direction: συντελεστές ως αριθμοί, και add = {ζυγός: [P σε MW, Q σε Mvar]}") from None
    dP[case.typ == PF.REF] = 0.0
    return dL, dP


def run(net, direction=None, q_limits=False, step=0.1, dV=0.02, lower=True, stop=0.0, V_stop=0.2, max_points=1000, tol=1e-8):
    """The curve of the load-flow solutions as the load grows.

    direction: None or 'all' (every load and every generator but the slack grow together: S_load·(1 + λ), P_g·(1 + λ)),
        'load' (the loads only: the slack bus covers the growth), or
        {'load': {bus: factor}, 'gen': {bus: factor}, 'add': {bus: [P in MW, Q in Mvar]}}: the part of each bus in the growth,
        S_load·(1 + λ·factor), P_g·(1 + λ·factor); 'add' is a constant-power load that grows from zero, λ·(P + jQ). Buses that are
        not named do not grow.
    q_limits: the reactive limits of the generators on the way.
    step, dV: the most that λ and a voltage (pu) may move in one step (an angle: STEP_A rad).
    lower: go on past the nose along the lower part of the curve, until λ is back at `stop` or a voltage is below V_stop.

    Returns {'converged' (the nose was found), 'lambda': [...], 'load_MW': [...] (the load at nominal voltage at each point),
    'V': {bus: [|V| at each point]}, 'points', 'parameter': [what was held at each point], 'index': [−d(load)/d|V| of the
    weakest bus at each point, 'index_unit' (MW/pu): zero at a nose that is a fold], 'index_bus',
    'nose': {'lambda', 'point', 'kind' ('fold' | 'limit'), 'refined', 'bus' (the weakest: the largest part in the tangent
             there), 'V', 'Vmin', 'Vmin_bus', 'load_MW', 'margin_MW', 'load_Mvar', 'margin_Mvar', 'margin' (of the load as it is)},
    'buses': {bus: {'V', 'angle' (at the nose), 'V0' (now), 'drop', 'share' (its part in the tangent at the nose), 'type',
                    'limit' ('max' | 'min' | None: the reactive limit its generators are at, at the nose)}},
    'weak': the ten buses with the largest share, 'base': {'load_MW', 'load_Mvar', 'Vmin', 'Vmin_bus'},
    'growth': {'load_MW', 'load_Mvar', 'gen_MW'} per unit of λ,
    'events': [{'lambda', 'point', 'bus', 'limit' ('max' | 'min'), 'to' ('PQ': the bus stops holding its voltage, 'PV': it holds it again), 'what'}],
    'steps': {'points', 'cut', 'iterations', 'factorizations'}, 'q_limits', 'advice', 'time', 'message'}."""
    t0 = time.perf_counter()
    step, dV = float(step), float(dV)
    if not (step > 0 and dV > 0):
        raise CpfError('step και dV: θετικοί αριθμοί')
    case = net.case()
    n, names = case.n, case.names
    dL, dP = _direction(case, direction)
    if not np.any(np.abs(dL) > 0):
        raise CpfError('η κατεύθυνση δεν αυξάνει κανένα φορτίο')
    limits = bool(q_limits) and case.has_qlim
    base = PF.solve(case, 'nr', tol=tol, q_limits=limits)
    if not base['converged']:
        raise CpfError('η ροή φορτίου του δικτύου όπως είναι δεν συγκλίνει: δεν υπάρχει σημείο για να ξεκινήσει η καμπύλη')
    typ, qg = base['typ'].copy(), base['Sg'].imag.copy()
    if not ((typ == PF.PQ) | (typ == PF.PV)).any():
        raise CpfError('το δίκτυο έχει μόνο ζυγό ταλάντωσης')
    at = np.zeros(n, int)                                      # +1 / −1: the generators of the bus are at their upper / lower reactive limit
    cv = (typ == PF.PQ) & (case.typ == PF.PV)
    at[cv] = np.where(qg[cv] >= case.qmax[cv], 1, -1)
    scale = (STEP_A, dV, step)
    MW = case.S_base / 1e6
    nom = case.zip(np.ones(n))
    grow = dL.sum(axis=1)
    Pl0, Ql0, gP, gQ = float(nom.real.sum() * MW), float(nom.imag.sum() * MW), float(grow.real.sum() * MW), float(grow.imag.sum() * MW)
    use_q = abs(gP) < 1e-12                                    # a growth of reactive load only: the index in Mvar per pu
    nfact = [0]

    def system(typ, qg):
        s = _Sys(case, typ, dP, dL, qg)
        s.count = nfact
        return s

    def qgen(P):
        """The reactive power of the sources of every bus (pu) at a point."""
        V = P[1] * np.exp(1j * P[0])
        return (V * np.conj(case.Y @ V)).imag + case.zip(P[1], case.load + P[2] * dL).imag

    def first(sys, at, P, P1, Q0, skip):
        """The first change of bus type between two points: (part of the way, 'PQ' | 'PV', bus, +1 | −1) or None. 'PQ': a
        generator over a reactive limit; 'PV': a bus at a limit whose voltage is back at its set value."""
        out = None
        pv = np.flatnonzero(sys.typ == PF.PV)
        if len(pv):
            Q1 = qgen(P1)
            hi, lo = Q1[pv] > case.qmax[pv] + Q_TOL, Q1[pv] < case.qmin[pv] - Q_TOL
            for i, h in zip(pv[hi | lo], hi[hi | lo]):
                if i == skip:
                    continue
                lim = case.qmax[i] if h else case.qmin[i]
                den = Q1[i] - Q0[i]
                f = min(1.0, max(0.0, (lim - Q0[i]) / den)) if den != 0 else 0.0
                if out is None or f < out[0]:
                    out = (f, 'PQ', int(i), 1 if h else -1)
        for i in np.flatnonzero(at):
            if i == skip:
                continue
            if (P1[1][i] - case.Vset[i]) * at[i] > V_TOL:      # at the upper limit and above the set voltage, or the mirror of it
                den = P1[1][i] - P[1][i]
                f = min(1.0, max(0.0, (case.Vset[i] - P[1][i]) / den)) if den != 0 else 0.0
                if out is None or f < out[0]:
                    out = (f, 'PV', int(i), int(at[i]))
        return out

    def change(sys, at, P, P1, Q0):
        """The point between P and P1 where the first bus changes type, and the equations after it:
        (point, system, at, (kind, bus, side)), None when no bus changes, or False when the point was not found."""
        new, skip = None, -1
        for _ in range(2 * n + 2):
            ev = first(sys, at, P, P1, Q0, skip)
            if ev is None:
                return new
            f, kind, i, side = ev
            typ2, qg2, at2 = sys.typ.copy(), sys.qg.copy(), at.copy()
            if kind == 'PQ':                                    # the equations with the limit in force, and the voltage still at its set value
                typ2[i], qg2[i], at2[i] = PF.PQ, (case.qmax[i] if side > 0 else case.qmin[i]), side
                sys2 = system(typ2, qg2)
                Pq, _, ok = _correct(sys2, _mix(P, P1, f), int(sys2.pm[i]), case.Vset[i], tol, 12)
                if not ok:
                    Pq, _, ok = _correct(sys2, P, int(sys2.pm[i]), case.Vset[i], tol, 12)
            else:                                               # the equations as they are, with the voltage of the bus at its set value
                Pq, _, ok = _correct(sys, _mix(P, P1, f), int(sys.pm[i]), case.Vset[i], tol, 12)
                if not ok:
                    Pq, _, ok = _correct(sys, P, int(sys.pm[i]), case.Vset[i], tol, 12)
                typ2[i], qg2[i], at2[i] = PF.PV, case.Sg.imag[i], 0
                sys2 = system(typ2, qg2)
            if not ok:
                return False
            P1, new, skip = Pq, (Pq, sys2, at2, (kind, i, side)), i
        return False

    WHAT = {('PQ', 1): 'η γεννήτρια έφτασε το άνω όριο αέργου: ο ζυγός δεν κρατά πια την τάση του', ('PQ', -1): 'η γεννήτρια έφτασε το κάτω όριο αέργου: ο ζυγός δεν κρατά πια την τάση του',
            ('PV', 1): 'η γεννήτρια έφυγε από το άνω όριο αέργου: ο ζυγός κρατά ξανά την τάση του', ('PV', -1): 'η γεννήτρια έφυγε από το κάτω όριο αέργου: ο ζυγός κρατά ξανά την τάση του'}
    sys = system(typ, qg)
    P = (np.angle(base['V']), np.abs(base['V']), 0.0)
    events, notes = [], []
    # ---- the starting point: a load flow whose buses at a limit are on the right side of their set voltage
    if limits or np.max(np.abs(sys.F(*P)[0]), initial=0.0) >= tol:
        for rnd in range(4 * n + 4):
            P, _, ok = _correct(sys, P, sys.N, 0.0, tol, 30)
            if not ok:
                raise CpfError('το σημείο εκκίνησης δεν βρέθηκε με τα όρια αέργου σε ισχύ')
            if not limits:
                break
            back = [i for i in np.flatnonzero(at) if (P[1][i] - case.Vset[i]) * at[i] > V_TOL]
            Q = qgen(P)
            pv = np.flatnonzero(sys.typ == PF.PV)
            over = pv[(Q[pv] > case.qmax[pv] + Q_TOL) | (Q[pv] < case.qmin[pv] - Q_TOL)]
            if not back and not len(over):
                break
            typ2, qg2 = sys.typ.copy(), sys.qg.copy()
            Vm = P[1].copy()
            for i in back:
                typ2[i], qg2[i], at[i], Vm[i] = PF.PV, case.Sg.imag[i], 0, case.Vset[i]
            if not back:                                        # (one way at a time: first what comes back, then what goes over)
                for i in over:
                    up_ = Q[i] > case.qmax[i]
                    typ2[i], qg2[i], at[i] = PF.PQ, (case.qmax[i] if up_ else case.qmin[i]), (1 if up_ else -1)
            sys, P = system(typ2, qg2), (P[0], Vm, 0.0)
        else:
            notes.append('στο σημερινό φορτίο τα όρια αέργου δεν βρήκαν μόνιμη κατάσταση των γεννητριών (η εναλλαγή δεν σταμάτησε)')
    for i in np.flatnonzero(at):
        events.append({'lambda': 0.0, 'point': 0, 'bus': names[i], 'limit': 'max' if at[i] > 0 else 'min', 'to': 'PQ', 'what': 'η γεννήτρια είναι σε όριο αέργου ήδη στο σημερινό φορτίο'})
    typ0, at0 = sys.typ.copy(), at.copy()

    pts, par, idx, idx_bus, tangs = [P], ['λ'], [], [], []
    k = sys.N
    sigma, cut, iters = 1.0, 0, 0
    tprev, want, up, tc = None, None, True, None               # the last direction; what must hold after a change of type; λ was growing; a tangent known already
    nose, msg = None, ''
    Q0 = qgen(P) if limits else None

    def orient(sys, t, ref, flip=None):
        """The tangent as a direction of travel, (dθ, d|V|, dλ) per bus: its largest part against the limits of the step is 1."""
        dA, dM, dl = sys.full(t)
        if flip is None:
            flip = dl < 0 if ref is None else (dA @ ref[0]) / scale[0] ** 2 + (dM @ ref[1]) / scale[1] ** 2 + dl * ref[2] / scale[2] ** 2 < 0
        if flip:
            dA, dM, dl = -dA, -dM, -dl
        s = max(np.max(np.abs(dA), initial=0.0) / scale[0], np.max(np.abs(dM), initial=0.0) / scale[1], abs(dl) / scale[2])
        return dA / s, dM / s, dl / s

    def weakest(sys, d):
        """(the bus whose voltage moves most along d, the index −d(load)/d|V| of that bus)."""
        if not len(sys.pq):
            return -1, None
        j = int(sys.pq[np.argmax(np.abs(d[1][sys.pq]))])
        return j, (None if d[1][j] == 0 else float(-(gQ if use_q else gP) * d[2] / d[1][j]))

    while True:
        # ---- the tangent at the present point, in the direction of travel
        try:
            t = tc if tc is not None else _tangent(sys, P, k)
        except RuntimeError:
            msg = 'ο πίνακας της εφαπτομένης είναι ιδιόμορφος'
            break
        tc, flip = None, None
        if want is not None:
            # after a change of type the curve goes on where the change holds: the voltage of a bus at its upper limit falls
            # (at its lower limit: rises); the reactive power of a bus that holds its voltage again moves inside its limits
            kind, i, side = want
            dA, dM, dl = sys.full(t)
            if kind == 'PQ':
                val = -side * dM[i]
            else:
                h = 1e-6 / max(np.max(np.abs(dA), initial=0.0), np.max(np.abs(dM), initial=0.0), abs(dl))
                val = -side * (qgen((P[0] + h * dA, P[1] + h * dM, P[2] + h * dl))[i] - qgen((P[0] - h * dA, P[1] - h * dM, P[2] - h * dl))[i]) / (2 * h)
            flip = bool(val < 0) if abs(val) > 1e-9 else None
        d = orient(sys, t, tprev, flip)
        if want is not None and up and d[2] < 0 and nose is None:      # the change of type is the end of the solutions: a corner, not a fold
            nose = {'point': len(pts) - 1, 'kind': 'limit', 'dir': d, 'refined': True}
            events[-1]['what'] += ' · από εδώ δεν υπάρχει λύση με περισσότερο φορτίο (άμεση αστάθεια στο όριο)'
        want = None
        up = d[2] > 0
        j, ix = weakest(sys, d)
        idx.append(ix)
        idx_bus.append(names[j] if j >= 0 else None)
        tangs.append(d)
        if len(pts) >= max_points:
            msg = f'η καμπύλη σταμάτησε στα {max_points} σημεία (max_points)'
            break
        low = bool(len(sys.pq)) and np.min(P[1][sys.pq]) < V_stop
        if nose is not None and (not lower or P[2] <= stop or low):
            break
        if low:                                                 # (loads that fall with the voltage: the curve may have no nose at all)
            msg = f'μια τάση έπεσε κάτω από {V_stop:g} pu χωρίς να βρεθεί όριο φόρτισης: με αυτά τα φορτία η καμπύλη δεν γυρίζει ως εκεί'.replace('.', ',', 1)
            break
        # ---- the parameter of the step: the unknown that moves most against its limit
        dx = np.r_[d[0][sys.pvpq], d[1][sys.pq], d[2]]
        kk = int(np.argmax(np.r_[np.abs(dx[:sys.na]) / scale[0], np.abs(dx[sys.na:sys.N]) / scale[1], abs(dx[sys.N]) / scale[2]]))
        # ---- predictor and corrector, with a shorter step when the corrector fails or moves farther than the step itself
        P1 = None
        while sigma >= SIGMA_MIN:
            Pp = sys.moved(*P, sigma * dx)
            Pc, its, ok = _correct(sys, Pp, kk, sys.get(*Pp, kk), tol)
            if ok:
                ok = max(np.max(np.abs(Pc[0] - Pp[0]), initial=0.0) / scale[0], np.max(np.abs(Pc[1] - Pp[1]), initial=0.0) / scale[1], abs(Pc[2] - Pp[2]) / scale[2]) <= sigma
            if ok:
                P1 = Pc
                break
            sigma *= 0.5
            cut += 1
        if P1 is None:
            msg = 'το βήμα έγινε μικρότερο από το ελάχιστο χωρίς να συγκλίνει ο διορθωτής'
            break
        iters += its
        k1, new = kk, None
        # ---- a bus that changes type on the way: back onto the point where the first one does
        if limits:
            new = change(sys, at, P, P1, Q0)
            if new is False:                                    # the point was not found from here: come closer first
                sigma *= 0.5
                cut += 1
                if sigma < SIGMA_MIN:
                    msg = 'το σημείο όπου μια γεννήτρια φτάνει το όριο αέργου δεν βρέθηκε'
                    break
                continue
            if new:
                P1 = new[0]
        # ---- a nose between the two points (on the curve of the equations that held between them)
        dlast = d
        if up and nose is None:
            try:
                t1 = _tangent(sys, P1, kk)
                tin = orient(sys, t1, d)
            except RuntimeError:
                t1 = tin = None
            if tin is not None and tin[2] < 0:
                up = False
                fold = _fold(sys, P, P1, tol, scale)
                if fold is not None:
                    Pn, kn = fold
                    dlast = orient(sys, _tangent(sys, Pn, kn), d)
                    pts.append(Pn)
                    par.append(sys.name(kn))
                    idx.append(0.0)
                    idx_bus.append(names[weakest(sys, dlast)[0]] if len(sys.pq) else None)
                    tangs.append(dlast)
                    nose = {'point': len(pts) - 1, 'kind': 'fold', 'dir': dlast, 'refined': True}
                    if not lower:
                        break
                else:                                           # the nose was not found as a point: the higher of the two stands in for it
                    nose = {'point': len(pts) - (1 if P[2] >= P1[2] else 0), 'kind': 'fold', 'dir': d if P[2] >= P1[2] else tin, 'refined': False}
            elif not new:
                tc = t1
        # ---- on the lower part, end exactly on λ = stop
        if nose is not None and not new and P1[2] < stop < P[2]:
            Ps, _, oks = _correct(sys, _mix(P, P1, (stop - P[2]) / (P1[2] - P[2])), sys.N, stop, tol, 12)
            if oks:
                P1, k1, tc = Ps, sys.N, None
        # ---- the point is taken
        tprev = dlast
        pts.append(P1)
        if new:
            _, sys, at, (kind, i, side) = new
            events.append({'lambda': float(P1[2]), 'point': len(pts) - 1, 'bus': names[i], 'limit': 'max' if side > 0 else 'min', 'to': kind, 'what': WHAT[(kind, side)]})
            k1 = int(sys.pm[i]) if kind == 'PQ' else sys.N
            want = (kind, i, side)
            par.append(('όριο Q ' if kind == 'PQ' else 'τάση ρύθμισης ') + str(names[i]))
        else:
            par.append(sys.name(k1))
        P, k = P1, k1
        if limits:
            Q0 = qgen(P)
        sigma = min(1.0, sigma * (2.0 if its <= 2 else 1.4 if its <= 3 else 1.0 if its <= 5 else 0.6))
    # ---------------------------------------------------------------- the result
    lam = np.array([p[2] for p in pts])
    VV = np.array([p[1] for p in pts])
    while len(idx) < len(pts):                                  # (the curve stopped before the tangent of its last point)
        idx.append(None)
        idx_bus.append(None)
    found = nose is not None
    jn = nose['point'] if found else int(np.argmax(lam))
    dn = nose['dir'] if found else (tangs[jn] if jn < len(tangs) else None)
    Vn, An = VV[jn], pts[jn][0]
    share = np.zeros(n)                                         # the part of every bus in the tangent at the nose: 1 at the weakest
    if dn is not None and np.max(np.abs(dn[1]), initial=0.0) > 0:
        share = dn[1] / dn[1][int(np.argmax(np.abs(dn[1])))]
    wk = int(np.argmax(share)) if share.any() else int(np.argmin(Vn))
    lo, lo0 = int(np.argmin(Vn)), int(np.argmin(VV[0]))
    lmax = float(lam[jn])
    code = {PF.PQ: 'PQ', PF.PV: 'PV', PF.REF: 'slack'}
    tn, an = typ0.copy(), at0.copy()                           # the types at the nose: what changed up to that point
    for e in events:
        if 0 < e['point'] <= jn:
            i = case.idx[e['bus']]
            tn[i], an[i] = (PF.PQ, 1 if e['limit'] == 'max' else -1) if e['to'] == 'PQ' else (PF.PV, 0)
    buses = {b: {'V': float(Vn[i]), 'angle': float(np.degrees(An[i])), 'V0': float(VV[0, i]), 'drop': float(VV[0, i] - Vn[i]), 'share': float(share[i]),
                 'type': code[int(tn[i])], 'limit': {1: 'max', -1: 'min'}.get(int(an[i]))} for i, b in enumerate(names)}
    order = [i for i in np.argsort(-share) if share[i] > 0][:10]
    if found and not nose['refined']:
        notes.append('η μύτη δεν βρέθηκε ως σημείο της καμπύλης: δίνεται το ψηλότερο από τα δύο σημεία γύρω της')
    if not msg:
        msg = ('το όριο φόρτισης βρέθηκε: ' + ('μύτη της καμπύλης (ιδιόμορφος πίνακας της ροής φορτίου)' if nose['kind'] == 'fold' else 'αλλαγή τύπου ζυγού σε όριο αέργου (άμεση αστάθεια)')) if found else \
            'η καμπύλη σταμάτησε πριν από το όριο φόρτισης'
    msg = ' · '.join([msg] + notes)
    g = case.graph()
    adv = {'method': 'cpf', 'facts': g, 'why': f'{n} ζυγοί, {g["pv"]} ζυγοί PV: συνέχιση κατά μήκος της καμπύλης των λύσεων με πρόβλεψη στην εφαπτομένη και διόρθωση Newton '
           'με τοπική παραμετροποίηση (ο άγνωστος που αλλάζει περισσότερο κρατιέται σταθερός), ώστε ο πίνακας να μένει ομαλός και στη μύτη'
           + ('· τα όρια αέργου των γεννητριών εφαρμόζονται στο σημείο όπου η καθεμία τα φτάνει' if limits else '')}
    return {'converged': found, 'lambda': [float(x) for x in lam], 'load_MW': [float(Pl0 + x * gP) for x in lam],
            'V': {b: [float(x) for x in VV[:, i]] for i, b in enumerate(names)}, 'points': len(pts), 'parameter': par, 'index': idx, 'index_bus': idx_bus,
            'index_unit': 'Mvar/pu' if use_q else 'MW/pu',
            'nose': {'lambda': lmax, 'point': jn, 'kind': nose['kind'] if found else None, 'refined': bool(found and nose['refined']), 'bus': names[wk], 'V': float(Vn[wk]),
                     'Vmin': float(Vn[lo]), 'Vmin_bus': names[lo], 'load_MW': Pl0 + lmax * gP, 'margin_MW': lmax * gP, 'load_Mvar': Ql0 + lmax * gQ, 'margin_Mvar': lmax * gQ,
                     'margin': (lmax * gP / Pl0) if abs(Pl0) > 0 else None},
            'buses': buses, 'weak': [{'bus': names[i], 'V0': float(VV[0, i]), 'V': float(Vn[i]), 'drop': float(VV[0, i] - Vn[i]), 'share': float(share[i])} for i in order],
            'base': {'load_MW': Pl0, 'load_Mvar': Ql0, 'Vmin': float(VV[0, lo0]), 'Vmin_bus': names[lo0]},
            'growth': {'load_MW': gP, 'load_Mvar': gQ, 'gen_MW': float(dP.sum() * MW)}, 'events': events,
            'steps': {'points': len(pts), 'cut': cut, 'iterations': iters, 'factorizations': nfact[0]}, 'q_limits': limits, 'advice': adv,
            'time': time.perf_counter() - t0, 'message': msg}


__all__ = ['run', 'CpfError', 'STEP_A']
