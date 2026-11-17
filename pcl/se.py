"""State estimation (4.19.5, ROADMAP §79, THEORY §8Ξ): the voltages of a network from a redundant set of measurements with
errors, and which of the measurements are wrong.

- The measurements are voltage magnitudes, power injections and power flows at either end of a branch, each with the
  standard deviation of its error. The state is the angle of every bus but the reference and the magnitude of every bus.
- Weighted least squares (Abur & Gómez Expósito 2004, ch. 2): Gauss–Newton on the normal equations, G = Hᵀ·R⁻¹·H on the
  pattern of the network, with the buses that have neither load nor generation as equality constraints (ch. 3.5), not as
  measurements with a large weight.
- Observability is numerical: the matrix of the first iteration is factorized, and a singular one means that the
  measurements do not fix the state.
- Bad data (ch. 5): the χ² test on the objective function, the normalized residuals r_i/√Ω_ii with Ω = R − H·Σ_x·Hᵀ, and the
  largest normalized residual test: the measurement with the largest one above the threshold is taken out and the estimate is
  made again. A measurement with Ω_ii = 0 is critical: its error cannot be seen.

Everything is in per unit on the base of the network. Only NumPy and SciPy."""
import math
import time

import numpy as np
import scipy.sparse as sp
import scipy.sparse.linalg as spla

from . import powerflow as PF

TYPES = ('V', 'P', 'Q', 'Pf', 'Qf', 'Pt', 'Qt')
TXT = {'V': 'τάση ζυγού', 'P': 'έγχυση P', 'Q': 'έγχυση Q', 'Pf': 'ροή P (άκρο «από»)', 'Qf': 'ροή Q (άκρο «από»)',
       'Pt': 'ροή P (άκρο «προς»)', 'Qt': 'ροή Q (άκρο «προς»)'}
SIGMA = {'V': 0.004, 'flow': 0.008, 'inj': 0.010}          # pu: the standard deviations of the examples of the book
PLANS = ('all', 'scada', 'flows', 'tree')
PLAN_TXT = {'all': 'τάση και εγχύσεις σε κάθε ζυγό, ροές στα δύο άκρα κάθε κλάδου', 'scada': 'τάση στους ζυγούς με γεννήτρια, εγχύσεις σε κάθε ζυγό, ροές στο ένα άκρο κάθε κλάδου',
            'flows': 'τάση στον ζυγό ταλάντωσης και ροές στο ένα άκρο κάθε κλάδου', 'tree': 'τάση στον ζυγό ταλάντωσης και ροές μόνο στους κλάδους ενός δέντρου (καμία περίσσεια)'}
CRITICAL = 1e-8                                            # Ω_ii below this part of σ²: the measurement is critical
SINGULAR = 1e-13                                           # smallest pivot against the largest of the scaled matrix: singular


class SeError(ValueError):
    pass


def _class(kind):
    return 'V' if kind == 'V' else 'inj' if kind in ('P', 'Q') else 'flow'


def _chi2(p, k):
    """The value that a χ² variable with k degrees of freedom stays below with probability p."""
    from scipy.special import chdtri
    return float(chdtri(k, 1.0 - p)) if k > 0 else 0.0


# -------------------------------------------------------------------- the measured quantities and their derivatives
def quantities(case, V, deriv=True):
    """Every quantity that can be measured, at the voltages V, in the order: |V| of every bus, P and Q injected at every
    bus (generation minus load, what the bus gives to the network), P and Q into every branch at its «from» end and at its
    «to» end. Returns (h, A): the values (3·n + 4·nl) and, with deriv, their derivatives as a sparse matrix whose columns
    are the angle of every bus and then the magnitude of every bus."""
    n, nl = case.n, case.nl
    Vm = np.abs(V)
    I = case.Y @ V
    Sb = V * np.conj(I)
    If, It = case.Yf @ V, case.Yt @ V
    Sf, St = V[case.f] * np.conj(If), V[case.t] * np.conj(It)
    h = np.r_[Vm, Sb.real, Sb.imag, Sf.real, Sf.imag, St.real, St.imag]
    if not deriv:
        return h, None
    dV, dE = sp.diags(V), sp.diags(V / Vm)
    dSa = 1j * dV @ (sp.diags(I) - case.Y @ dV).conj()                       # ∂S_bus/∂θ and ∂S_bus/∂|V|
    dSm = dV @ (case.Y @ dE).conj() + sp.diags(np.conj(I)) @ dE
    rows = [sp.hstack([sp.csr_matrix((n, n)), sp.identity(n, format='csr')]), sp.hstack([dSa.real, dSm.real]), sp.hstack([dSa.imag, dSm.imag])]
    k = np.arange(nl)
    for Yb, end, Ib in ((case.Yf, case.f, If), (case.Yt, case.t, It)):
        C = sp.csr_matrix((np.ones(nl), (k, end)), shape=(nl, n))
        dIc, dVe = sp.diags(np.conj(Ib)), sp.diags(V[end])
        da = 1j * (dIc @ C @ dV - dVe @ (Yb @ dV).conj())
        dm = dVe @ (Yb @ dE).conj() + dIc @ C @ dE
        rows += [sp.hstack([da.real, dm.real]), sp.hstack([da.imag, dm.imag])]
    return h, sp.vstack(rows, format='csr')


def _rows(case, meas):
    """The row of every measurement in the list of quantities, its value and its standard deviation."""
    n, nl = case.n, case.nl
    off = {'V': 0, 'P': n, 'Q': 2 * n, 'Pf': 3 * n, 'Qf': 3 * n + nl, 'Pt': 3 * n + 2 * nl, 'Qt': 3 * n + 3 * nl}
    bri = {b: i for i, b in enumerate(case.br_name)}
    row, z, s = [], [], []
    for i, m in enumerate(meas):
        kind = m.get('type')
        if kind not in TYPES:
            raise SeError(f'measurement {i}: type one of {", ".join(TYPES)}')
        if kind in ('V', 'P', 'Q'):
            if m.get('bus') not in case.idx:
                raise SeError(f'measurement {i} ({kind}): no bus {m.get("bus")!r}')
            row.append(off[kind] + case.idx[m['bus']])
        else:
            if m.get('branch') not in bri:
                raise SeError(f'measurement {i} ({kind}): no branch {m.get("branch")!r}')
            row.append(off[kind] + bri[m['branch']])
        sg = float(m.get('sigma', SIGMA[_class(kind)]))
        if not (sg > 0 and math.isfinite(sg) and math.isfinite(float(m['value']))):
            raise SeError(f'measurement {i} ({kind}): a finite value and a standard deviation above zero')
        z.append(float(m['value']))
        s.append(sg)
    return np.array(row, int), np.array(z), np.array(s)


def zero_injection(case):
    """The buses with neither load nor generation (their injection is zero exactly), without the slack buses."""
    quiet = (np.abs(case.Sg) == 0) & (np.abs(case.load).sum(axis=1) == 0) & (case.typ == PF.PQ)
    return np.flatnonzero(quiet)


# -------------------------------------------------------------------- the measurements of a study
def measure(net, plan='scada', noise=1.0, seed=1, sigma=None, bad=None, zero_injections=True):
    """A set of measurements from the load flow of the network (for studies and tests): the plan says where the meters are,
    noise scales the Gaussian errors (0: exact values, the standard deviations stay), seed makes them repeatable, and bad
    puts gross errors: a list of {'type', 'bus' or 'branch', 'error' (in standard deviations, default 20)}, or 'flow',
    'injection', 'voltage', 'two' for the usual cases. With zero_injections the buses without load and generation are
    not measured (the estimator knows that they inject nothing).
    Returns {'measurements': [...], 'truth': the load flow, 'plan', 'bad': the indices of the gross errors}."""
    if plan not in PLANS:
        raise SeError(f'plan: one of {", ".join(PLANS)}')
    sg = dict(SIGMA, **(sigma or {}))
    lf = net.power_flow('nr', tol=1e-10)
    if not lf['converged']:
        raise SeError('the load flow of the network does not converge: no measurements to take')
    case = net.case()
    V = lf['_V']
    h, _ = quantities(case, V, deriv=False)
    n, nl = case.n, case.nl
    zi = set(zero_injection(case).tolist()) if zero_injections else set()
    ref = np.flatnonzero(case.typ == PF.REF)
    meas = []

    def add(kind, where, row):
        key = 'bus' if kind in ('V', 'P', 'Q') else 'branch'
        meas.append({'type': kind, key: where, 'value': float(h[row]), 'sigma': sg[_class(kind)]})

    vb = range(n) if plan == 'all' else np.flatnonzero(case.typ != PF.PQ) if plan == 'scada' else ref[:1]
    for i in vb:
        add('V', case.names[i], i)
    if plan in ('all', 'scada'):
        for i in range(n):
            if i not in zi:
                add('P', case.names[i], n + i)
                add('Q', case.names[i], 2 * n + i)
    br = range(nl)
    if plan == 'tree':
        links = set(case.link_tree().links.tolist())
        br = [k for k in range(nl) if k not in links]
    for k in br:
        add('Pf', case.br_name[k], 3 * n + k)
        add('Qf', case.br_name[k], 3 * n + nl + k)
        if plan == 'all':
            add('Pt', case.br_name[k], 3 * n + 2 * nl + k)
            add('Qt', case.br_name[k], 3 * n + 3 * nl + k)
    rng = np.random.default_rng(seed)
    e = rng.standard_normal(len(meas)) * float(noise)
    for m, ei in zip(meas, e):
        m['true'] = m['value']
        m['value'] = m['value'] + ei * m['sigma']
    hit = []
    if bad:
        if isinstance(bad, str):
            val = lambda kind: [(abs(m['true']), i) for i, m in enumerate(meas) if m['type'] == kind]
            pick = {'flow': ['Pf'], 'injection': ['P'], 'voltage': ['V'], 'two': ['Pf', 'P']}.get(bad)
            if pick is None:
                raise SeError("bad: 'flow', 'injection', 'voltage', 'two' or a list of measurements")
            bad = []
            for kind in pick:
                c = val(kind)
                if not c:
                    raise SeError(f'Το σχέδιο μετρήσεων «{plan}» δεν έχει μέτρηση αυτού του είδους ({TXT[kind]}): διάλεξε άλλη λανθασμένη μέτρηση ή άλλο σχέδιο.')
                i = max(c)[1] if kind != 'V' else min(c)[1]                    # the largest flow, the largest injection, the lowest voltage
                bad.append(dict({k: meas[i][k] for k in ('type', 'bus', 'branch') if k in meas[i]}, error=20.0 if kind != 'P' else -20.0))
        for b in bad:
            key = 'bus' if b['type'] in ('V', 'P', 'Q') else 'branch'
            i = next((i for i, m in enumerate(meas) if m['type'] == b['type'] and m.get(key) == b.get(key)), None)
            if i is None:
                raise SeError(f'bad: no measurement {b["type"]} at {b.get(key)!r} in the plan {plan!r}')
            meas[i]['value'] += float(b.get('error', 20.0)) * meas[i]['sigma']
            meas[i]['gross'] = float(b.get('error', 20.0))
            hit.append(i)
    return {'measurements': meas, 'truth': lf, 'plan': plan, 'bad': hit}


# -------------------------------------------------------------------- the estimator
class _Problem:
    """One weighted least squares problem: the measurements in use, the equality constraints, the reference."""

    def __init__(self, case, row, z, s, crow, V0):
        self.case, self.row, self.z, self.s, self.crow = case, row, z, s, crow
        n = case.n
        self.ref = int(np.flatnonzero(case.typ == PF.REF)[0])
        self.cols = np.r_[np.delete(np.arange(n), self.ref), n + np.arange(n)]        # the state: angles but the reference, magnitudes
        self.ns, self.nc, self.m = 2 * n - 1, len(crow), len(row)
        self.V0 = V0

    def system(self, V):
        h, A = quantities(self.case, V)
        H = A[self.row][:, self.cols].tocsr()
        r = self.z - h[self.row]
        w = 1 / self.s ** 2
        G = (H.T @ sp.diags(w) @ H).tocsc()
        rhs = H.T @ (w * r)
        # scaled so that the gain matrix has a unit diagonal and every constraint a unit row: the pivots are then comparable
        g = G.diagonal()
        d = np.where(g > 0, 1 / np.sqrt(np.where(g > 0, g, 1.0)), 1.0)
        D = sp.diags(d)
        K = D @ G @ D
        rhs = d * rhs
        if self.nc:
            C = (A[self.crow][:, self.cols] @ D).tocsr()
            cs = 1 / np.maximum(np.sqrt(np.asarray(C.multiply(C).sum(axis=1)).ravel()), 1e-300)
            C = sp.diags(cs) @ C
            K = sp.bmat([[K, C.T], [C, None]], format='csc')
            rhs = np.r_[rhs, -cs * h[self.crow]]
        self.d = d
        return K.tocsc(), rhs, H, r

    def factor(self, K):
        """The factors of the (scaled) matrix, or None when it is singular."""
        try:
            lu = spla.splu(K, permc_spec='COLAMD')
        except RuntimeError:
            return None
        d = np.abs(lu.U.diagonal())
        if not np.all(np.isfinite(d)) or d.min() < SINGULAR * d.max():
            return None
        return lu

    def solve(self, tol, max_iter):
        n, ref = self.case.n, self.ref
        V = self.V0.copy()
        ang, Vm = np.angle(V), np.abs(V)
        lu = None
        for it in range(1, max_iter + 1):
            K, rhs, H, r = self.system(V)
            lu = self.factor(K)
            if lu is None:
                return {'V': V, 'iterations': it, 'converged': False, 'observable': it > 1, 'lu': None, 'H': H, 'r': r}
            dx = self.d * lu.solve(rhs)[:self.ns]
            if not np.all(np.isfinite(dx)):
                return {'V': V, 'iterations': it, 'converged': False, 'observable': True, 'lu': None, 'H': H, 'r': r}
            da = np.insert(dx[:n - 1], ref, 0.0)
            ang, Vm = ang + da, Vm + dx[n - 1:]
            V = Vm * np.exp(1j * ang)
            if np.max(np.abs(dx)) < tol:
                K, rhs, H, r = self.system(V)
                lu = self.factor(K)
                return {'V': V, 'iterations': it, 'converged': lu is not None, 'observable': True, 'lu': lu, 'H': H, 'r': r}
        return {'V': V, 'iterations': max_iter, 'converged': False, 'observable': True, 'lu': lu, 'H': H, 'r': r}

    def omega(self, lu, H, chunk=256):
        """The diagonal of the covariance of the residuals, Ω_ii = σ_i² − h_i·Σ_x·h_iᵀ, with Σ_x the covariance of the
        estimate (the block of the states of the inverse of the matrix): one solve per measurement, in blocks."""
        k = np.empty(self.m)
        Ht = H.T.tocsc()
        for a in range(0, self.m, chunk):
            b = min(self.m, a + chunk)
            B = np.zeros((self.ns + self.nc, b - a))
            B[:self.ns] = self.d[:, None] * Ht[:, a:b].toarray()                 # in the scaling of the factors
            X = lu.solve(B)[:self.ns]
            k[a:b] = np.einsum('ij,ij->j', B[:self.ns], X)
        return self.s ** 2 - k


def residual_covariance(H, sigma):
    """Ω = R − H·(Hᵀ·R⁻¹·H)⁻¹·Hᵀ for a dense Jacobian (the check of the fast path, and small problems)."""
    H = np.asarray(H, float)
    R = np.diag(np.asarray(sigma, float) ** 2)
    G = H.T @ np.linalg.inv(R) @ H
    return R - H @ np.linalg.solve(G, H.T)


def _decoupled(case, meas, zi, part):
    """The rows of the decoupled model with every branch of unit reactance (what observability depends on: where the meters
    are, not what they read): for the active part (part 'P') one row per flow and per injection of active power, with the
    buses of zero injection as injections; for the reactive part the same with Q, and one row per voltage magnitude.
    Returns the list of (kind, place, row as {bus: coefficient})."""
    bri = {b: i for i, b in enumerate(case.br_name)}
    inc = [[] for _ in range(case.n)]
    for k, (a, b) in enumerate(zip(case.f.tolist(), case.t.tolist())):
        inc[a].append((b, k))
        inc[b].append((a, k))

    def inj(i):
        row = {}
        for j, _ in inc[i]:
            row[i] = row.get(i, 0.0) + 1.0
            row[j] = row.get(j, 0.0) - 1.0
        return row

    rows = []
    for m in meas:
        t = m['type']
        if t == part:
            rows.append(('inj', case.idx[m['bus']], inj(case.idx[m['bus']])))
        elif t in (part + 'f', part + 't'):
            k = bri[m['branch']]
            rows.append(('flow', k, {int(case.f[k]): 1.0, int(case.t[k]): -1.0}))
        elif t == 'V' and part == 'Q':
            rows.append(('V', case.idx[m['bus']], {case.idx[m['bus']]: 1.0}))
    for i in zi:
        rows.append(('inj', int(i), inj(int(i))))
    return rows


def _matrix(rows, n):
    r, c, v = [], [], []
    for i, (_, _, row) in enumerate(rows):
        for j, a in row.items():
            r.append(i), c.append(j), v.append(a)
    return sp.csr_matrix((v, (r, c)), shape=(len(rows), n))


def _regular(G):
    """Whether a symmetric matrix of the decoupled model is regular (sparse factors, the smallest pivot against the largest)."""
    if G.shape[0] == 0:
        return True
    try:
        lu = spla.splu(G.tocsc())
    except RuntimeError:
        return False
    d = np.abs(lu.U.diagonal())
    return bool(np.all(np.isfinite(d)) and d.min() > 1e-12 * d.max())


def observability(net, measurements, zero_injections=True):
    """Whether the measurements fix the state, by the numerical method on the decoupled model with unit reactances (Abur &
    Gómez Expósito 2004, ch. 4.6; Monticelli & Wu 1985): the angles from the flows and injections of active power, the
    magnitudes from those of reactive power and the voltage measurements. When the angles are not fixed, the branches whose
    flow cannot be found are taken out with the injections next to them, again and again, and what is left are the observable
    islands. Returns {'observable', 'angles', 'magnitudes' (the two parts), 'islands': [[bus, ...], ...] (largest first),
    'branches': the names of the unobservable branches, 'dropped': the injections that give nothing}."""
    case = net.case() if hasattr(net, 'case') else net
    meas = measurements['measurements'] if isinstance(measurements, dict) else measurements
    _rows(case, meas)                                                        # the same checks as the estimator
    n = case.n
    zi = zero_injection(case) if zero_injections else np.zeros(0, int)
    ref = int(np.flatnonzero(case.typ == PF.REF)[0])
    keep = np.delete(np.arange(n), ref)
    rp = _decoupled(case, meas, zi, 'P')
    Hp = _matrix(rp, n)
    ang = _regular((Hp.T @ Hp)[keep][:, keep])
    Hq = _matrix(_decoupled(case, meas, zi, 'Q'), n)
    mag = _regular(Hq.T @ Hq)
    out = {'observable': bool(ang and mag), 'angles': bool(ang), 'magnitudes': bool(mag), 'islands': [list(case.names)], 'branches': [], 'dropped': []}
    if ang:
        return out
    if n > 3000:
        out['islands'] = None                                                # the islands need dense algebra
        return out
    f, t = case.f, case.t
    alive = np.ones(case.nl, bool)                                           # branches not yet found unobservable
    use = np.ones(len(rp), bool)
    while True:
        rows = []
        for u, (kind, at, row) in zip(use, rp):
            if not u:
                continue
            if kind == 'inj':                                                # an injection over the branches still in the network
                row = {}
                for k in np.flatnonzero(alive & ((f == at) | (t == at))):
                    j = int(t[k] if f[k] == at else f[k])
                    row[at] = row.get(at, 0.0) + 1.0
                    row[j] = row.get(j, 0.0) - 1.0
            elif not alive[at]:
                continue
            rows.append(row)
        H = np.zeros((len(rows), n))
        for i, row in enumerate(rows):
            for j, a in row.items():
                H[i, j] = a
        w, Q = np.linalg.eigh(H.T @ H)
        N = Q[:, w < 1e-9 * max(1.0, w.max(initial=1.0))]                    # the angle patterns that no measurement sees
        cut = alive & (np.max(np.abs(N[f] - N[t]), axis=1) > 1e-7)
        if not cut.any():
            break
        alive &= ~cut
        touched = np.zeros(n, bool)
        touched[f[cut]] = touched[t[cut]] = True
        for i, (kind, at, _) in enumerate(rp):
            if use[i] and kind == 'inj' and touched[at]:
                use[i] = False
    A = sp.csr_matrix((np.ones(int(alive.sum())), (f[alive], t[alive])), shape=(n, n))
    _, lab = sp.csgraph.connected_components(A, directed=False)
    isl = {}
    for i, c in enumerate(lab):
        isl.setdefault(int(c), []).append(case.names[i])
    out['islands'] = sorted(isl.values(), key=lambda q: (-len(q), q[0]))
    out['branches'] = [case.br_name[k] for k in np.flatnonzero(~alive)]
    out['dropped'] = sorted({case.names[at] for u, (kind, at, _) in zip(use, rp) if not u})
    return out


def uncovered(case, meas):
    """The buses that no measurement touches: neither their voltage, nor their injection or that of a neighbour, nor a flow
    of one of their branches."""
    seen = np.zeros(case.n, bool)
    bri = {b: i for i, b in enumerate(case.br_name)}
    nb = [[] for _ in range(case.n)]
    for a, b in zip(case.f.tolist(), case.t.tolist()):
        nb[a].append(b)
        nb[b].append(a)
    for m in meas:
        if m['type'] in ('V', 'P', 'Q'):
            i = case.idx[m['bus']]
            seen[i] = True
            if m['type'] != 'V':
                seen[nb[i]] = True
        else:
            k = bri[m['branch']]
            seen[[case.f[k], case.t[k]]] = True
    return [case.names[i] for i in np.flatnonzero(~seen)]


def run(net, measurements=None, plan='scada', noise=1.0, seed=1, sigma=None, bad=None, zero_injections=True, detect=True,
        threshold=3.0, confidence=0.99, max_bad=10, tol=1e-8, max_iter=30, start='flat'):
    """The state of the network from measurements. measurements: a list of {'type': 'V', 'P', 'Q' (at a 'bus'), 'Pf', 'Qf',
    'Pt', 'Qt' (of a 'branch', at its «from» or «to» end), 'value' (pu), 'sigma' (pu)}, or the output of measure(); without it a
    set is made from the load flow of the network (plan, noise, seed, sigma, bad: see measure). zero_injections: the buses
    without load and generation as equality constraints. detect: the χ² test at `confidence` and the largest normalized
    residual test with `threshold`, taking out up to max_bad measurements. start: 'flat' (1 pu, zero angles) or 'given' (the
    voltages of the network data).

    Returns {'converged', 'observable', 'iterations', 'rounds', 'buses' {bus: V, angle, P, Q (as a load flow gives them, from
    the estimate)}, 'branches', 'measurements' [{type, bus/branch, value, sigma, estimate, residual, rN, critical, used}],
    'J', 'dof', 'chi2', 'suspect', 'bad' [{index, type, at, value, rN, error (estimated), corrected}], 'critical' (indices),
    'm', 'n', 'constraints', 'redundancy', 'largest' (the largest normalized residual left), 'error' (against the load flow, when
    the measurements were made from it), 'first' (the estimate before any measurement was taken out), 'message', 'time'}."""
    t0 = time.perf_counter()
    truth, made, planted = None, None, []
    if measurements is None:
        made = measure(net, plan=plan, noise=noise, seed=seed, sigma=sigma, bad=bad, zero_injections=zero_injections)
        measurements = made
    if isinstance(measurements, dict):
        truth, planted = measurements.get('truth'), list(measurements.get('bad') or [])
        plan = measurements.get('plan', plan)
        measurements = measurements['measurements']
    else:
        plan = None
    meas = [dict(m) for m in measurements]
    if not meas:
        raise SeError('no measurements')
    if not 0 < confidence < 1:
        raise SeError('confidence: between 0 and 1')
    if start not in ('flat', 'given'):
        raise SeError("start: 'flat' or 'given'")
    case = net.case()
    n, nl = case.n, case.nl
    row, z, s = _rows(case, meas)
    zi = zero_injection(case) if zero_injections else np.zeros(0, int)
    crow = np.r_[n + zi, 2 * n + zi].astype(int)
    V0 = case.start(start == 'flat')
    if start == 'flat':
        V0 = np.full(n, np.exp(1j * case.ang0[np.flatnonzero(case.typ == PF.REF)[0]]))                # 1 pu at the angle of the reference
    ns = 2 * n - 1
    out = {'converged': False, 'observable': True, 'iterations': 0, 'rounds': 0, 'm': len(meas), 'n': ns, 'constraints': len(crow),
           'redundancy': (len(meas) + len(crow)) / ns, 'plan': plan, 'bad': [], 'critical': [], 'message': '', 'S_base': net.S_base,
           'threshold': float(threshold), 'confidence': float(confidence), 'planted': planted, 'zero_buses': [case.names[i] for i in zi]}
    used = np.ones(len(meas), bool)
    first, sol, om, rN = None, None, None, None
    its = 0
    for rnd in range(max_bad + 1):
        P = _Problem(case, row[used], z[used], s[used], crow, V0)
        if P.m + P.nc < ns:
            out.update(observable=False, message=f'{P.m} measurements and {P.nc} constraints for {ns} unknowns: the state cannot be found')
            sol = None
            break
        if rnd == 0:
            ob = observability(case, meas, zero_injections)
            if not ob['observable']:
                un = uncovered(case, meas)
                isl = ob['islands'] or []
                out.update(observable=False, uncovered=un, islands=isl, unobservable_branches=ob['branches'],
                           message=('the measurements do not fix the angles: ' + (f'{len(isl)} observable islands, {len(ob["branches"])} branches whose flow cannot be found' if isl else 'more than one observable island')
                                    if not ob['angles'] else 'the measurements do not fix the voltage magnitudes (reactive measurements or a voltage are missing)')
                           + (f'; no measurement touches the bus{"es" if len(un) > 1 else ""} {", ".join(un[:8])}' if un else ''))
                sol = None
                break
        sol = P.solve(tol, max_iter)
        its += sol['iterations']
        if not sol['observable']:
            out.update(observable=False, message='the measurements do not fix the state (the matrix of the first iteration is singular)')
            sol = None
            break
        if not sol['converged']:
            out['message'] = f'the estimate did not converge in {sol["iterations"]} iterations'
            break
        om = P.omega(sol['lu'], sol['H'])
        r = sol['r']
        crit = om < CRITICAL * P.s ** 2
        with np.errstate(divide='ignore', invalid='ignore'):
            rN = np.where(crit, 0.0, np.abs(r) / np.sqrt(np.where(crit, 1.0, om)))
        J = float(np.sum((r / P.s) ** 2))
        dof = P.m + P.nc - ns
        state = {'V': sol['V'], 'J': J, 'dof': dof, 'chi2': _chi2(confidence, dof), 'r': r, 'rN': rN, 'om': om, 'crit': crit, 'idx': np.flatnonzero(used)}
        state['suspect'] = bool(dof > 0 and J > state['chi2'])
        if first is None:
            first = state
        out['rounds'] = rnd + 1
        k = int(np.argmax(rN)) if len(rN) else 0
        if not detect or not len(rN) or rN[k] <= threshold or rnd == max_bad:
            break
        i = int(state['idx'][k])                                               # the largest normalized residual: out, and again
        err = float(P.s[k] ** 2 / om[k] * r[k])
        out['bad'].append({'index': i, 'type': meas[i]['type'], 'at': meas[i].get('bus', meas[i].get('branch')), 'value': meas[i]['value'],
                           'sigma': meas[i]['sigma'], 'rN': float(rN[k]), 'residual': float(r[k]), 'error': err, 'corrected': meas[i]['value'] - err})
        used[i] = False
        V0 = sol['V']
    out['iterations'] = its
    for i, m in enumerate(meas):
        m.update(used=bool(used[i]), estimate=None, residual=None, rN=None, critical=False)
    if sol is not None and sol['converged']:
        V = state['V']
        h, _ = quantities(case, V, deriv=False)
        for j, i in enumerate(state['idx']):
            meas[i].update(estimate=float(h[row[i]]), residual=float(state['r'][j]), rN=float(state['rN'][j]), critical=bool(state['crit'][j]))
        for i in np.flatnonzero(~used):
            meas[i].update(estimate=float(h[row[i]]), residual=float(z[i] - h[row[i]]))
        code = {PF.PQ: 'PQ', PF.PV: 'PV', PF.REF: 'slack'}
        lf = net._lf_result(case.names, case.idx, V, case.Y @ V, case.load, {b: code[int(case.typ[i])] for i, b in enumerate(case.names)}, True, its)
        out.update(converged=True, buses=lf['buses'], branches=lf['branches'], losses=lf['losses'], types=lf['types'], _V=V, _idx=case.idx,
                   J=state['J'], dof=state['dof'], chi2=state['chi2'], suspect=state['suspect'],
                   critical=[int(i) for i in state['idx'][state['crit']]], largest=float(np.max(state['rN'], initial=0.0)),
                   first={'J': first['J'], 'dof': first['dof'], 'chi2': first['chi2'], 'suspect': first['suspect'], 'largest': float(np.max(first['rN'], initial=0.0)),
                          'V': [float(v) for v in np.abs(first['V'])], 'angle': [float(a) for a in np.degrees(np.angle(first['V']))]})
        if out['bad'] and out['rounds'] > max_bad and out['largest'] > threshold:
            out['message'] = f'{max_bad} measurements were taken out and the largest normalized residual is still {out["largest"]:.1f}'
        if truth is not None:
            Vt = truth['_V']
            d = V - Vt
            dang = np.degrees(np.angle(V * np.conj(Vt)))
            d1 = first['V'] - Vt
            out['error'] = {'V_max': float(np.max(np.abs(np.abs(V) - np.abs(Vt)))), 'V_bus': case.names[int(np.argmax(np.abs(np.abs(V) - np.abs(Vt))))],
                            'angle_max': float(np.max(np.abs(dang))), 'angle_bus': case.names[int(np.argmax(np.abs(dang)))],
                            'V_rms': float(np.sqrt(np.mean((np.abs(V) - np.abs(Vt)) ** 2))), 'vector_max': float(np.max(np.abs(d))),
                            'first_V_max': float(np.max(np.abs(np.abs(first['V']) - np.abs(Vt)))), 'first_vector_max': float(np.max(np.abs(d1)))}
            for b in case.names:
                tb = truth['buses'][b]
                out['buses'][b].update(V_true=tb['V'], angle_true=tb['angle'], dV=out['buses'][b]['V'] - tb['V'])
            mv = np.array([abs(m['value'] - m['true']) / m['sigma'] for m in meas if 'true' in m])
            out['error']['measured_max_sigma'] = float(mv.max(initial=0.0))
    out['measurements'] = meas
    # for the picture: the largest normalized residual of the measurements of every bus and of every branch (a measurement taken
    # out counts with the one it had when it was taken out)
    at = {b['index']: b['rN'] for b in out['bad']}
    mp = {'bus': {}, 'branch': {}}
    for i, m in enumerate(meas):
        v = at.get(i, m['rN'])
        if v is None:
            continue
        key, where = ('bus', m['bus']) if 'bus' in m else ('branch', m['branch'])
        mp[key][where] = max(mp[key].get(where, 0.0), float(v))
    out['map'] = mp
    out['counts'] = {t: sum(m['type'] == t for m in meas) for t in TYPES if any(m['type'] == t for m in meas)}
    gr = lambda x, d=2: f'{x:.{d}f}'.replace('.', ',')             # noqa: E731
    out['advice'] = {'why': f'{out["m"]} μετρήσεις' + (f' και {out["constraints"]} ισότητες μηδενικής έγχυσης' if out['constraints'] else '') + f' για {ns} αγνώστους (περίσσεια {gr(out["redundancy"])}): '
                            'ελάχιστα τετράγωνα με βάρη 1/σ², Gauss–Newton στις κανονικές εξισώσεις με αραιή παραγοντοποίηση'}
    out['time'] = time.perf_counter() - t0
    return out


__all__ = ['SeError', 'TYPES', 'PLANS', 'SIGMA', 'quantities', 'zero_injection', 'measure', 'residual_covariance', 'observability', 'uncovered', 'run']
