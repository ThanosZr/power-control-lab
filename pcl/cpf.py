"""Continuation load flow (4.19.4, ROADMAP §73): how far the load of a network can grow before the load flow has no
solution, and the curve of every bus voltage on the way there and past it (the «nose» curve, P–V).

    run(net)        → the points of the curve, the nose (the loading margin), the weakest bus, and what happened on the way

The loads grow together from their values in the network, S_load·(1 + λ), and the generators (the slack apart) follow with
their active power, P_g·(1 + λ); a direction of one's own can be given instead. The equations of the load flow get the
one unknown more, F(θ, |V|, λ) = 0, and a plain Newton load flow stops working at the nose, where the Jacobian is singular.
The continuation method goes around it (Ajjarapu & Christy 1992):

* predictor: a step along the tangent of the curve, [J  F_λ; e_kᵀ]·t = e_last;
* corrector: Newton on the load-flow equations with one more equation that holds the continuation parameter x_k at its
  predicted value, so that the matrix is regular at the nose too;
* the continuation parameter is λ far from the nose and, near it, the voltage that changes fastest (local
  parametrisation): chosen from the tangent at every step.

With q_limits a generator that reaches a reactive limit stops holding its voltage (its bus becomes a load bus with the
reactive power of the limit): the usual reason the nose comes much earlier than the network alone would give.

Sources (THEORY §8Μ): V. Ajjarapu, C. Christy, «The continuation power flow: a tool for steady state voltage stability
analysis», IEEE Trans. Power Systems 7(1), 1992 (predictor, corrector, local parametrisation, the choice of the parameter);
H.-D. Chiang, A. J. Flueck, K. S. Shah, N. Balu, «CPFLOW», IEEE Trans. Power Systems 10(2), 1995 (step length control);
C. A. Cañizares, F. L. Alvarado, IEEE Trans. Power Systems 8(1), 1993 (the point of collapse and the limits)."""
import time

import numpy as np
from scipy import sparse as sp
from scipy.sparse.linalg import splu

from . import powerflow as PF


class CpfError(ValueError):
    pass


class _Sys:
    """F(x, λ) for given bus types: P at the PV and PQ buses, Q at the PQ buses."""

    def __init__(self, case, typ, dP, dL, qfix):
        self.case, self.typ, self.J = case, typ, case.jac(typ)
        self.dP, self.dL, self.qfix = dP, dL, qfix            # direction of the generation (pu), of the loads (ZIP rows), fixed Q of converted buses
        self.pvpq, self.pq, self.na = self.J.pvpq, self.J.pq, self.J.na

    def load(self, lam):
        return self.case.load + lam * self.dL

    def F(self, V, lam):
        c = self.case
        I = c.Y @ V
        Vm = np.abs(V)
        L = self.load(lam)
        S = V * np.conj(I) - (c.Sg.real + lam * self.dP + 1j * self.qfix - (L[:, 0] * Vm ** 2 + L[:, 1] * Vm + L[:, 2]))
        return np.r_[S[self.pvpq].real, S[self.pq].imag], I, S

    def Fl(self, V):
        """dF/dλ."""
        Vm = np.abs(V)
        d = -self.dP + (self.dL[:, 0] * Vm ** 2 + self.dL[:, 1] * Vm + self.dL[:, 2])
        return np.r_[d[self.pvpq].real, d[self.pq].imag]

    def aug(self, V, I, lam, k):
        """[J  F_λ; e_kᵀ] as one sparse matrix (k = N: the parameter is λ)."""
        self.J.fill(V, I, load=self.load(lam))
        N = self.J.N
        ek = sp.csr_matrix(([1.0], ([0], [k])), shape=(1, N + 1))
        return sp.vstack([sp.hstack([self.J.J, sp.csc_matrix(self.Fl(V).reshape(-1, 1))]), ek], format='csc')

    def x(self, V, lam):
        return np.r_[np.angle(V)[self.pvpq], np.abs(V)[self.pq], lam]

    def put(self, V, x):
        Va, Vm = np.angle(V), np.abs(V)
        Va[self.pvpq] = x[:self.na]
        Vm[self.pq] = x[self.na:-1]
        return Vm * np.exp(1j * Va), float(x[-1])


def _correct(sys, V, lam, k, target, tol, max_it=12):
    """Newton on [F; x_k − target] from (V, λ). Returns (V, λ, iterations, converged)."""
    for it in range(max_it):
        F, I, _ = sys.F(V, lam)
        x = sys.x(V, lam)
        r = np.r_[F, x[k] - target]
        if np.max(np.abs(r)) < tol:
            return V, lam, it, True
        if not np.all(np.isfinite(r)):
            break
        try:
            dx = splu(sys.aug(V, I, lam, k)).solve(-r)
        except RuntimeError:
            break
        if not np.all(np.isfinite(dx)):
            break
        V, lam = sys.put(V, x + dx)
        if np.any(np.abs(V) > 5) or np.any(np.abs(V) < 1e-3):
            break
    return V, lam, max_it, False


def run(net, direction=None, q_limits=False, step=0.05, step_max=0.3, step_min=1e-5, lower=True, stop=0.0, max_points=400, tol=1e-8, V_stop=0.3):
    """direction: None (every load and every generator but the slack grow together), or {'load': {bus: factor}, 'gen':
    {bus: factor}} (the part of each bus in the growth: S_load·(1 + λ·factor); buses that are not named do not grow).
    q_limits: the reactive limits of the generators on the way.
    step: the first step along the tangent (the tangent is scaled so that its largest component is 1; λ in parts of the load
    as it is, voltages in pu, angles in rad); it grows to step_max while the corrector converges fast and is halved when it
    does not. lower: go on past the nose along the lower part of the curve until λ falls to stop (or a voltage to V_stop).

    Returns {'converged' (the nose was found), 'lambda': [...], 'V': {bus: [|V| at each point]}, 'points', 'nose': {'lambda',
    'point', 'bus' (the bus whose voltage falls fastest there), 'V', 'Vmin', 'Vmin_bus', 'load_MW' (the load at the nose),
    'margin_MW' (how much more than now)}, 'load_MW' (now), 'events': [{'lambda', 'bus', 'what'}], 'steps': {'taken', 'cut'},
    'parameter': [what was held at each point], 'q_limits', 'time', 'message'}."""
    t0 = time.perf_counter()
    case = net.case()
    n = case.n
    names = case.names
    typ = case.typ.copy()
    dL = case.load.copy()
    dP = case.Sg.real.copy()
    dP[typ == PF.REF] = 0.0
    if direction is not None:
        fl, fg = np.zeros(n), np.zeros(n)
        for key, arr in (('load', fl), ('gen', fg)):
            for b, v in (direction.get(key) or {}).items():
                if str(b) not in case.idx:
                    raise CpfError(f'direction: δεν υπάρχει ζυγός {b}')
                arr[case.idx[str(b)]] = float(v)
        dL, dP = dL * fl[:, None], dP * fg
    if not np.any(np.abs(dL) > 0):
        raise CpfError('η κατεύθυνση δεν αυξάνει κανένα φορτίο')
    base = PF.solve(case, 'nr', tol=min(tol, 1e-8), q_limits=q_limits)
    if not base['converged']:
        raise CpfError('η ροή φορτίου του δικτύου όπως είναι δεν συγκλίνει: δεν υπάρχει σημείο για να ξεκινήσει η καμπύλη')
    V = base['V'].copy()
    typ = base.get('typ', typ).copy() if q_limits else typ
    qfix = case.Sg.imag.copy()
    events = []
    if q_limits:                                              # the buses the load flow has already taken off voltage control
        for i in np.flatnonzero((typ == PF.PQ) & (case.typ == PF.PV)):
            S = V[i] * np.conj((case.Y @ V)[i]) + case.zip(np.abs(V))[i]
            qfix[i] = case.qmax[i] if abs(S.imag - case.qmax[i]) < abs(S.imag - case.qmin[i]) else case.qmin[i]
            events.append({'lambda': 0.0, 'bus': names[i], 'what': 'η γεννήτρια είναι ήδη σε όριο αέργου'})
    sys = _Sys(case, typ, dP, dL, qfix)
    lam = 0.0
    lams, Vs, par = [0.0], [np.abs(V)], ['λ']
    k = sys.J.N                                               # the continuation parameter: λ at first
    sign = 1.0
    h = float(step)
    taken = cut = 0
    passed = False
    msg = ''
    tprev = None
    while len(lams) < max_points:
        F, I, _ = sys.F(V, lam)
        N = sys.J.N
        rhs = np.zeros(N + 1)
        rhs[-1] = sign
        try:
            t = splu(sys.aug(V, I, lam, k)).solve(rhs)
        except RuntimeError:
            msg = 'ο πίνακας της εφαπτομένης είναι ιδιόμορφος'
            break
        if not np.all(np.isfinite(t)):
            msg = 'η εφαπτομένη δεν είναι πεπερασμένη'
            break
        t = t / np.max(np.abs(t))
        if tprev is not None and len(tprev) == len(t) and float(t @ tprev) < 0:
            t = -t                                            # keep going the same way along the curve
        x = sys.x(V, lam)
        ok = False
        while h >= step_min:
            xp = x + h * t
            # the parameter of the corrector: the unknown that moves most along the tangent (voltages and λ; angles are not used)
            cand = np.r_[np.abs(t[sys.na:-1]), abs(t[-1])]
            kk = sys.na + int(np.argmax(cand))
            Vp, lp = sys.put(V.copy(), xp)
            Vn, ln, its, ok = _correct(sys, Vp, lp, kk, xp[kk], tol)
            if ok:
                break
            h *= 0.5
            cut += 1
        if not ok:
            msg = 'το βήμα έγινε μικρότερο από το ελάχιστο χωρίς να συγκλίνει ο διορθωτής'
            break
        if q_limits:
            Sn = Vn * np.conj(case.Y @ Vn) + (sys.load(ln)[:, 0] * np.abs(Vn) ** 2 + sys.load(ln)[:, 1] * np.abs(Vn) + sys.load(ln)[:, 2])
            pv = np.flatnonzero(typ == PF.PV)
            over = pv[(Sn.imag[pv] > case.qmax[pv] + 1e-9) | (Sn.imag[pv] < case.qmin[pv] - 1e-9)]
            if len(over):
                if h > 4 * step_min and len(over) > 1:        # come closer, so that the generators reach their limits one at a time
                    h *= 0.5
                    cut += 1
                    continue
                for i in over:
                    typ[i] = PF.PQ
                    qfix[i] = case.qmax[i] if Sn.imag[i] > case.qmax[i] else case.qmin[i]
                    events.append({'lambda': float(ln), 'bus': names[i], 'what': 'η γεννήτρια έφτασε το ' + ('άνω' if Sn.imag[i] > case.qmax[i] else 'κάτω') + ' όριο αέργου: ο ζυγός δεν κρατά πια την τάση του'})
                sys = _Sys(case, typ, dP, dL, qfix)
                k, tprev = sys.J.N, None
                sign = -1.0 if passed else 1.0
                Vn, ln, _, okq = _correct(sys, Vn, ln, sys.J.N, ln, tol, 30)      # the same λ with the new bus types
                if not okq:                                   # no solution at this λ with the limit: the nose is the limit itself
                    events[-1]['what'] += ' (και από εδώ δεν υπάρχει λύση με περισσότερο φορτίο)'
                    passed = True
                    msg = 'το όριο αέργου μιας γεννήτριας είναι το σημείο πέρα από το οποίο δεν υπάρχει λύση'
                    break
        taken += 1
        if ln < lam - 1e-12:
            passed = True
        tprev = t if len(t) == sys.J.N + 1 else None
        V, lam, k = Vn, ln, (kk if not (q_limits and tprev is None) else sys.J.N)
        sign = float(np.sign(t[k])) if tprev is not None and t[k] != 0 else sign
        lams.append(lam)
        Vs.append(np.abs(V))
        par.append('λ' if k == sys.J.N else '|V| ' + names[sys.pq[k - sys.na]])
        h = min(step_max, h * (1.6 if its <= 3 else 1.0 if its <= 5 else 0.7))
        if passed and (not lower or lam <= stop or np.min(np.abs(V)) < V_stop):
            break
    lam_a = np.array(lams)
    j = int(np.argmax(lam_a))
    found = bool(passed and 0 < j)
    VV = np.array(Vs)
    Pl0 = float(case.zip(np.ones(n)).real.sum() * net.S_base / 1e6)
    grow = float((dL[:, 0] + dL[:, 1] + dL[:, 2]).real.sum() * net.S_base / 1e6)
    lam_max, jn = float(lam_a[j]), j
    if found and 0 < j < len(lams) - 1:                       # the top of the parabola through the three points around the largest λ, against the arc length
        s = np.r_[0.0, np.cumsum(np.linalg.norm(np.diff(VV[j - 1:j + 2], axis=0), axis=1) + np.abs(np.diff(lam_a[j - 1:j + 2])))]
        c = np.polyfit(s, lam_a[j - 1:j + 2], 2)
        if c[0] < 0:
            lam_max = float(max(lam_a[j], c[2] - c[1] ** 2 / (4 * c[0])))
    drop = (VV[j] - VV[j - 1]) if j > 0 else np.zeros(n)
    wk = int(np.argmin(drop))
    lo = int(np.argmin(VV[j]))
    out = {'converged': found, 'lambda': [float(x) for x in lam_a], 'V': {b: [float(x) for x in VV[:, i]] for i, b in enumerate(names)}, 'points': len(lams),
           'nose': {'lambda': lam_max, 'point': jn, 'bus': names[wk], 'V': float(VV[j, wk]), 'Vmin': float(VV[j, lo]), 'Vmin_bus': names[lo],
                    'load_MW': Pl0 + lam_max * grow, 'margin_MW': lam_max * grow},
           'load_MW': Pl0, 'events': events, 'steps': {'taken': taken, 'cut': cut}, 'parameter': par, 'q_limits': bool(q_limits), 'time': time.perf_counter() - t0,
           'message': msg or ('η μύτη της καμπύλης βρέθηκε' if found else 'η καμπύλη σταμάτησε πριν από τη μύτη (max_points)')}
    return out


__all__ = ['run', 'CpfError']
