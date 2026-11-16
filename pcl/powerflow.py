"""Steady-state solvers on sparse matrices (4.19.1, ROADMAP §68 point 3): the load flow of pcl.network in several ways,
with the same solution from each one, and the choice of the engine from the network («Αυτόματα») with its reason.

One kernel, three scales:

* one load flow: Newton–Raphson in polar coordinates on a sparse Jacobian with a fixed pattern (the values are written
  straight into their places; no sparse algebra inside the iteration), the reference of everything else; fast decoupled
  (XB, BX); Newton with current injections in rectangular coordinates; the backward/forward sweep for radial networks;
  Gauss–Seidel (for teaching); the DC load flow;
* many load flows of the same topology (time series, Monte Carlo, training data): Newton with common factors in a batch,
  one factorization at the base point and every scenario as one more right-hand side of the same solve; each scenario
  is verified with its true mismatch and whatever does not converge goes to the reference path;
* N−1: PTDF and LODF for the DC screening, and the AC solution of every outage as a batch on the factors of the base
  case with a low-rank correction (Woodbury) for the branch that leaves.

Everything works in per unit on the arrays of a Case (built from a Network by its own load-flow model, so a new element
of the network needs nothing here). xp = numpy; the batch routines only use array operations and the multi-right-hand
solve, so that a GPU backend (CuPy, double precision) can take them over without a change of the algorithm (4.19.2).

Sources (THEORY §8Ζ): Tinney & Hart 1967; the Jacobian in complex matrix notation as in Zimmerman, MATPOWER Technical
Note 2; Stott & Alsaç 1974 (fast decoupled); da Costa, Martins & Pereira 1999 (current injections); Shirmohammadi, Hong,
Semlyen & Luo 1988 (sweep); Wang, Wende-von Berg & Braun 2021 (batches with one pattern); Chan & Brandwajn 1986 and the
matrix inversion lemma for the outages.
"""
import math
import time

import numpy as np
from scipy import sparse as sp
from scipy.sparse.linalg import splu

PQ, PV, REF = 0, 1, 2
METHODS = ('auto', 'nr', 'nr_dense', 'nr_ci', 'fdxb', 'fdbx', 'sweep', 'gs', 'dc')
TXT = {'nr': 'αραιός Newton–Raphson (πολικές συντεταγμένες, σταθερό μοτίβο)', 'nr_dense': 'πυκνός Newton–Raphson (ο δρόμος αναφοράς ως την 4.19)',
       'nr_ci': 'Newton με εγχύσεις ρεύματος (ορθογώνιες συντεταγμένες)', 'fdxb': 'fast-decoupled XB', 'fdbx': 'fast-decoupled BX',
       'sweep': 'εμπρός–πίσω σάρωση', 'gs': 'Gauss–Seidel', 'dc': 'ροή φορτίου DC (γραμμική προσέγγιση)'}


class PowerFlowError(ValueError):
    pass


def _csr(n, m, rows, cols, vals, dtype=complex):
    A = sp.csr_matrix((np.asarray(vals, dtype), (np.asarray(rows, int), np.asarray(cols, int))), shape=(n, m))
    A.sum_duplicates()
    A.sort_indices()
    return A


class Case:
    """A network in per unit as arrays: Y (CSR, with its diagonal), the branches of the π model (f, t, y, bsh, tap, rating),
    the bus shunts, the injections, the ZIP loads, the bus types and the generators with their limits and costs."""

    def __init__(self, net):
        raw = {}
        names, idx, _, Sg, load, types, Vset, ang, qlim = net._lf_model(raw)
        n = len(names)
        self.net, self.names, self.idx, self.n, self.S_base = net, names, idx, n, net.S_base
        rows, cols, vals = raw['stamps']
        self.stamps = (rows, cols, vals)                      # as they were written, for the dense path (same sums as load_flow)
        self.Y = _csr(n, n, list(rows) + list(range(n)), list(cols) + list(range(n)), list(vals) + [0.0] * n)
        br = raw['branches']
        self.nl = nl = len(br)
        self.br_name = [b[0] for b in br]
        self.f = np.array([b[1] for b in br], int)
        self.t = np.array([b[2] for b in br], int)
        self.y = np.array([b[3] for b in br], complex)
        self.bsh = np.array([b[4] for b in br], float)
        self.tap = np.array([b[5] for b in br], complex)
        self.rate = np.array([b[6] if b[6] else np.nan for b in br], float)
        self.ysh = np.zeros(n, complex)
        for i, v in raw['shunts']:
            self.ysh[i] += v
        # the four admittances of each branch: I_f = Yff·V_f + Yft·V_t, I_t = Ytf·V_f + Ytt·V_t
        self.Yff = (self.y + 0.5j * self.bsh) / np.abs(self.tap) ** 2
        self.Yft = -self.y / np.conj(self.tap)
        self.Ytf = -self.y / self.tap
        self.Ytt = self.y + 0.5j * self.bsh
        k = np.arange(nl)
        self.Yf = _csr(nl, n, np.r_[k, k], np.r_[self.f, self.t], np.r_[self.Yff, self.Yft])
        self.Yt = _csr(nl, n, np.r_[k, k], np.r_[self.f, self.t], np.r_[self.Ytf, self.Ytt])
        self.Sg = np.array(Sg, complex)
        self.load = np.array(load, complex)
        code = {'PQ': PQ, 'PV': PV, 'slack': REF}
        self.typ = np.array([code[types[b]] for b in names], int)
        if not (self.typ == REF).any():
            raise PowerFlowError('no slack bus (a feeder or a generator with slack=True)')
        self.Vset = np.array([Vset[b] for b in names], float)
        self.ang0 = np.radians([ang[b] for b in names])
        self.qmin = np.full(n, -np.inf)
        self.qmax = np.full(n, np.inf)
        for b, (lo, hi) in qlim.items():
            self.qmin[idx[b]], self.qmax[idx[b]] = lo, hi
        self.has_qlim = bool(qlim)
        self._jac = {}
        self._tree = None

    # ---------------------------------------------------------------- sets, start, mismatch
    def sets(self, typ=None):
        typ = self.typ if typ is None else typ
        return np.flatnonzero(typ == PV), np.flatnonzero(typ == PQ), np.flatnonzero(typ == REF)

    def start(self, flat=False):
        """The start of the iteration: the voltages of the buses as given (flat = False), or 1∠0 at the PQ buses and the set
        magnitude at angle 0 at the PV buses; the slack as given."""
        Vm = np.where(self.typ == PQ, 1.0 if flat else self.Vset, self.Vset)
        Va = np.where(self.typ == REF, self.ang0, 0.0 if flat else self.ang0)
        return Vm * np.exp(1j * Va)

    def zip(self, Vm, load=None):
        L = self.load if load is None else load
        return L[:, 0] * Vm ** 2 + L[:, 1] * Vm + L[:, 2]

    def mismatch(self, V, Sg=None):
        """S(V) − (S_g − S_load(|V|)) per bus (pu) and the injected currents Y·V."""
        I = self.Y @ V
        return V * np.conj(I) - ((self.Sg if Sg is None else Sg) - self.zip(np.abs(V))), I

    def err(self, V, typ=None, Sg=None):
        pv, pq, _ = self.sets(typ)
        m, _ = self.mismatch(V, Sg)
        return max(np.max(np.abs(m[pv].real), initial=0.0), np.max(np.abs(m[pq]), initial=0.0) if len(pq) else 0.0,
                   np.max(np.abs(m[pq].real), initial=0.0), np.max(np.abs(m[pq].imag), initial=0.0))

    def jac(self, typ=None):
        typ = self.typ if typ is None else typ
        key = typ.tobytes()
        J = self._jac.get(key)
        if J is None:
            if len(self._jac) > 8:
                self._jac.clear()
            J = self._jac[key] = Jacobian(self, typ)
        return J

    # ---------------------------------------------------------------- the graph
    def graph(self):
        """Facts of the network that decide the method: loops (branches − buses + islands), radial or not, depth of the tree
        from the slack, PV buses, the largest R/X of a branch, parallel branches, transformers (taps) and phase shifters."""
        n, nl = self.n, self.nl
        pairs = {(min(a, b), max(a, b)) for a, b in zip(self.f.tolist(), self.t.tolist())}
        A = sp.csr_matrix((np.ones(2 * nl), (np.r_[self.f, self.t], np.r_[self.t, self.f])), shape=(n, n))
        ncomp, _ = sp.csgraph.connected_components(A, directed=False)
        loops = len(pairs) - n + ncomp
        z = 1 / self.y
        with np.errstate(divide='ignore', invalid='ignore'):
            rx = np.where(np.abs(z.imag) > 0, np.abs(z.real / z.imag), np.inf)
        out = {'buses': n, 'branches': nl, 'islands': int(ncomp), 'loops': int(loops), 'radial': bool(loops == 0 and ncomp == 1 and len(pairs) == nl),
               'pv': int((self.typ == PV).sum()), 'slack': int((self.typ == REF).sum()), 'rx_max': float(np.max(rx, initial=0.0)),
               'rx_median': float(np.median(rx)) if nl else 0.0, 'shifters': int((np.abs(np.angle(self.tap)) > 1e-12).sum()),
               'taps': int((np.abs(np.abs(self.tap) - 1) > 1e-12).sum()), 'depth': None}
        if out['radial']:
            out['depth'] = int(self.tree()['depth'].max())
        return out

    def tree(self):
        """The radial network as a tree from the slack: for every bus its parent branch and its depth, the buses by level."""
        if self._tree is not None:
            return self._tree
        n, nl = self.n, self.nl
        root = int(np.flatnonzero(self.typ == REF)[0])
        adj = [[] for _ in range(n)]
        for k in range(nl):
            adj[self.f[k]].append((self.t[k], k))
            adj[self.t[k]].append((self.f[k], k))
        parent = np.full(n, -1)
        pbr = np.full(n, -1)
        depth = np.full(n, -1)
        depth[root] = 0
        order = [root]
        for u in order:
            for v, k in adj[u]:
                if depth[v] < 0:
                    depth[v], parent[v], pbr[v] = depth[u] + 1, u, k
                    order.append(v)
        if len(order) != n or nl != n - 1:
            raise PowerFlowError('the backward/forward sweep needs a radial network (a tree from the slack bus, no loops, no parallel branches)')
        child = np.array(order[1:], int)
        k = pbr[child]
        down = self.f[k] == parent[child]               # the parent is the «from» end of the branch
        lev = [child[depth[child] == d] for d in range(1, int(depth.max()) + 1)]
        self._tree = {'root': root, 'parent': parent, 'pbr': pbr, 'depth': depth, 'child': child, 'levels': lev,
                      'down': dict(zip(child.tolist(), down.tolist()))}
        return self._tree


# -------------------------------------------------------------------- the Jacobian on a fixed pattern
class Jacobian:
    """The Jacobian of the polar Newton–Raphson for given bus types, with the pattern found once: per iteration the values of
    dS/dθ and dS/d|V| on the non-zeros of Y (MATPOWER TN2: dS/dθ = j·diag(V)·conj(diag(I) − Y·diag(V)), dS/d|V| =
    diag(V)·conj(Y·diag(V/|V|)) + conj(diag(I))·diag(V/|V|)) go straight to their places in the CSC arrays. The column order of
    the first factorization is kept for the next ones (SuperLU then skips its ordering)."""

    def __init__(self, case, typ):
        Y, n = case.Y, case.n
        self.case = case
        self.pv, self.pq, self.ref = case.sets(typ)
        self.pvpq = pvpq = np.r_[self.pv, self.pq]
        self.na, self.nm = na, nm = len(pvpq), len(self.pq)
        self.N = N = na + nm
        self.ri = ri = np.repeat(np.arange(n), np.diff(Y.indptr))
        self.ci = ci = Y.indices.copy()
        self.dg = np.flatnonzero(ri == ci)
        pa = np.full(n, -1)
        pa[pvpq] = np.arange(na)
        pm = np.full(n, -1)
        pm[self.pq] = np.arange(nm)
        ra, ca, rm, cm = pa[ri], pa[ci], pm[ri], pm[ci]
        self.m = m = ((ra >= 0) & (ca >= 0), (ra >= 0) & (cm >= 0), (rm >= 0) & (ca >= 0), (rm >= 0) & (cm >= 0))
        rows = np.r_[ra[m[0]], ra[m[1]], na + rm[m[2]], na + rm[m[3]]]
        cols = np.r_[ca[m[0]], na + cm[m[1]], ca[m[2]], na + cm[m[3]]]
        A = sp.csc_matrix((np.arange(1.0, len(rows) + 1), (rows, cols)), shape=(N, N))
        A.sort_indices()
        self.perm = (A.data - 1).astype(np.intp)                 # place in the CSC data → index of the value
        self.J = sp.csc_matrix((np.zeros(len(rows)), A.indices.copy(), A.indptr.copy()), shape=(N, N))
        self.q = None                                            # the column order of the first factorization
        self.Jq = self.map_q = None
        self.nfact = 0

    def fill(self, V, I, load=None, J=None):
        L = self.case.load if load is None else load
        Vm = np.abs(V)
        A = V[self.ri] * np.conj(self.case.Y.data * V[self.ci])
        d = V * np.conj(I)
        dSa = -1j * A
        dSa[self.dg] += 1j * d
        dSm = A / Vm[self.ci]
        dSm[self.dg] += d / Vm + (2 * L[:, 0] * Vm + L[:, 1])
        m = self.m
        vals = np.r_[dSa.real[m[0]], dSm.real[m[1]], dSa.imag[m[2]], dSm.imag[m[3]]]
        (self.J if J is None else J).data[:] = vals[self.perm]

    def factor(self, reuse=True):
        """LU of the present values. reuse: with the column order of the first factorization (no ordering again)."""
        self.nfact += 1
        if not reuse:
            return _LU(splu(self.J), None)
        if self.q is None:
            lu = splu(self.J)
            self.q = np.argsort(lu.perm_c)
            Aq = sp.csc_matrix((np.arange(1.0, self.J.nnz + 1), self.J.indices, self.J.indptr), shape=self.J.shape)[:, self.q]
            Aq.sort_indices()
            self.map_q = (Aq.data - 1).astype(np.intp)
            self.Jq = sp.csc_matrix((np.zeros(self.J.nnz), Aq.indices.copy(), Aq.indptr.copy()), shape=self.J.shape)
            return _LU(lu, None)
        self.Jq.data[:] = self.J.data[self.map_q]
        return _LU(splu(self.Jq, permc_spec='NATURAL'), self.q)

    def rhs(self, mis):
        return np.r_[mis[self.pvpq].real, mis[self.pq].imag]

    def apply(self, V, dx):
        Va, Vm = np.angle(V), np.abs(V)
        Va[self.pvpq] += dx[:self.na]
        Vm[self.pq] += dx[self.na:]
        return Vm * np.exp(1j * Va)


class _LU:
    """Factors with the column order that was applied before the factorization (q), for one or many right-hand sides."""

    def __init__(self, lu, q):
        self.lu, self.q = lu, q
        self.nnz = lu.L.nnz + lu.U.nnz

    def solve(self, b):
        x = self.lu.solve(b)
        if self.q is None:
            return x
        out = np.empty_like(x)
        out[self.q] = x
        return out


# -------------------------------------------------------------------- Newton–Raphson, polar, sparse (the reference)
def newton(case, V, tol=1e-8, max_iter=20, typ=None, Sg=None, reuse=True, damp=False):
    """Returns (V, iterations, converged, info). damp: a step that makes the mismatch larger is halved (up to 5 times), for a
    start far from the solution."""
    J = case.jac(typ)
    it, info = 0, {'fact': 0, 'nnzJ': int(J.J.nnz), 'nnzLU': None}
    mis, I = case.mismatch(V, Sg)
    F = J.rhs(mis)
    e = np.max(np.abs(F), initial=0.0)
    while e >= tol and it < max_iter:
        it += 1
        J.fill(V, I)
        lu = J.factor(reuse)
        info['fact'] += 1
        info['nnzLU'] = lu.nnz
        dx = lu.solve(-F)
        Vn = J.apply(V, dx)
        mis, I = case.mismatch(Vn, Sg)
        Fn = J.rhs(mis)
        en = np.max(np.abs(Fn), initial=0.0)
        k = 0
        while damp and not en < e and k < 5 and np.isfinite(e):
            k += 1
            dx = dx / 2
            Vn = J.apply(V, dx)
            mis, I = case.mismatch(Vn, Sg)
            Fn = J.rhs(mis)
            en = np.max(np.abs(Fn), initial=0.0)
        V, F, e = Vn, Fn, en
        if not np.isfinite(e):
            break
    return V, it, bool(e < tol), info


def newton_dense(case, V, tol=1e-8, max_iter=30, typ=None, Sg=None):
    """The dense Newton–Raphson of pcl.network (the path up to 4.19), on the same case."""
    from .network import _nr, _coo
    pv, pq, _ = case.sets(typ)
    Yd = case.Y.toarray() if case.stamps is None else _coo(case.n, *case.stamps)
    V, it, ok = _nr(Yd, V.copy(), (case.Sg if Sg is None else Sg).copy(), case.load, pv.tolist(), pq.tolist(), tol, max_iter)
    return V, it, ok, {}


# -------------------------------------------------------------------- fast decoupled (Stott & Alsaç; XB and BX)
def _b_matrices(case, scheme):
    """B′ and B″ as in the fast decoupled load flow: XB: B′ without resistances, charging, shunts and tap ratios, B″ without
    phase shifts; BX: B′ without charging, shunts and tap ratios, B″ without resistances and phase shifts."""
    n = case.n

    def ybus(y, bsh, tap, ysh):
        Yff, Yft, Ytf, Ytt = (y + 0.5j * bsh) / np.abs(tap) ** 2, -y / np.conj(tap), -y / tap, y + 0.5j * bsh
        return _csr(n, n, np.r_[case.f, case.f, case.t, case.t, np.arange(n)], np.r_[case.f, case.t, case.f, case.t, np.arange(n)],
                    np.r_[Yff, Yft, Ytf, Ytt, ysh])
    z = 1 / case.y
    yx = 1 / (1j * z.imag)                                    # resistance left out
    shift = np.exp(1j * np.angle(case.tap))
    zero, nosh = np.zeros(case.nl), np.zeros(n, complex)
    Bp = -ybus(yx if scheme == 'xb' else case.y, zero, shift, nosh).imag
    Bpp = -ybus(case.y if scheme == 'xb' else yx, case.bsh, np.abs(case.tap).astype(complex), case.ysh).imag
    return Bp.tocsc(), Bpp.tocsc()


def fast_decoupled(case, V, scheme='xb', tol=1e-8, max_iter=200, typ=None, Sg=None):
    """Half iterations P–θ and Q–|V| with two constant matrices, each factorized once. Returns (V, iterations, converged, info);
    the convergence is that of the full mismatch, so the solution is that of Newton within tol."""
    pv, pq, _ = case.sets(typ)
    pvpq = np.r_[pv, pq]
    Bp, Bpp = _b_matrices(case, scheme)
    lup = splu(Bp[pvpq][:, pvpq].tocsc())
    lupp = splu(Bpp[pq][:, pq].tocsc()) if len(pq) else None
    Va, Vm = np.angle(V), np.abs(V)
    it, ok = 0, False

    def PQm(V):
        m, _ = case.mismatch(V, Sg)
        return m.real[pvpq], m.imag[pq]
    P, Q = PQm(V)
    e = max(np.max(np.abs(P), initial=0.0), np.max(np.abs(Q), initial=0.0))
    while e >= tol and it < max_iter:
        it += 1
        Va[pvpq] -= lup.solve(P / Vm[pvpq])
        V = Vm * np.exp(1j * Va)
        P, Q = PQm(V)
        if lupp is not None and max(np.max(np.abs(P), initial=0.0), np.max(np.abs(Q), initial=0.0)) >= tol:
            Vm[pq] -= lupp.solve(Q / Vm[pq])
            V = Vm * np.exp(1j * Va)
            P, Q = PQm(V)
        e = max(np.max(np.abs(P), initial=0.0), np.max(np.abs(Q), initial=0.0))
        if not np.isfinite(e):
            break
    return V, it, bool(e < tol), {'fact': 2}


# -------------------------------------------------------------------- Newton with current injections (da Costa et al.)
def newton_ci(case, V, tol=1e-8, max_iter=30, typ=None, Sg=None):
    """Newton–Raphson on the current mismatches in rectangular coordinates: F_k = (Y·V)_k − conj(S_k/V_k) = 0 at every bus but
    the slack. The off-diagonal 2×2 blocks of the Jacobian are the elements of Y and stay constant; only the diagonal blocks
    change. A PV bus has its reactive power as one more unknown and |V|² = V_set² as one more equation. Returns (V, iterations,
    converged, info); the convergence is checked on the power mismatch, as in the other methods."""
    n = case.n
    pv, pq, ref = case.sets(typ)
    Sg = (case.Sg if Sg is None else Sg).copy()
    bus = np.r_[pq, pv]                       # the buses with unknown voltage
    nb, npv = len(bus), len(pv)
    pos = np.full(n, -1)
    pos[bus] = np.arange(nb)
    Y = case.Y
    ri = np.repeat(np.arange(n), np.diff(Y.indptr))
    ci = Y.indices
    keep = (pos[ri] >= 0) & (pos[ci] >= 0)
    r, c, y = pos[ri[keep]], pos[ci[keep]], Y.data[keep]
    N = 2 * nb + npv
    # rows: Re F (nb), Im F (nb), |V|² (npv); columns: V_r (nb), V_i (nb), Q (npv)
    ppv = pos[pv]
    kq = np.arange(npv)
    rows = np.r_[r, r, nb + r, nb + r, ppv, nb + ppv, 2 * nb + kq, 2 * nb + kq]
    cols = np.r_[c, nb + c, c, nb + c, 2 * nb + kq, 2 * nb + kq, ppv, nb + ppv]
    const = np.r_[y.real, -y.imag, y.imag, y.real, np.zeros(4 * npv)]
    A = sp.csc_matrix((np.arange(1.0, len(rows) + 1), (rows, cols)), shape=(N, N))
    A.sort_indices()
    perm = (A.data - 1).astype(np.intp)
    J = sp.csc_matrix((const[perm], A.indices, A.indptr), shape=(N, N))
    inv = np.empty(len(rows), np.intp)
    inv[perm] = np.arange(len(rows))          # index of a value → its place in the CSC data
    dgk = np.flatnonzero(r == c)              # the diagonal entries among the kept non-zeros (one per bus, in the order of r)
    dpos = np.empty(nb, np.intp)
    dpos[r[dgk]] = dgk
    nk = len(r)
    i11, i12, i21, i22 = inv[dpos], inv[nk + dpos], inv[2 * nk + dpos], inv[3 * nk + dpos]
    o = 4 * nk
    q1, q2, q3, q4 = inv[o + kq], inv[o + npv + kq], inv[o + 2 * npv + kq], inv[o + 3 * npv + kq]
    base = J.data.copy()
    L = case.load
    Q = np.zeros(n)
    Q[pv] = (V * np.conj(Y @ V)).imag[pv] + case.zip(np.abs(V)).imag[pv]          # the start of the unknown reactive powers
    it, ok, e = 0, False, np.inf
    while it <= max_iter:
        Vm = np.abs(V)
        S = Sg.copy()
        S[pv] = Sg.real[pv] + 1j * Q[pv]
        S = S - case.zip(Vm)                                                      # net specified injection
        I = Y @ V
        mis = V * np.conj(I) - S
        e = max(np.max(np.abs(mis[bus].real), initial=0.0), np.max(np.abs(mis[pq].imag), initial=0.0),
                np.max(np.abs(Vm[pv] - case.Vset[pv]), initial=0.0))
        if e < tol or it == max_iter or not np.isfinite(e):
            break
        it += 1
        Vb, Sb = V[bus], S[bus]
        cV = np.conj(Vb)
        a = np.conj(Sb) / cV ** 2                       # −d(conj(S/V))/dV_r ; d/dV_i = −j·a
        # the voltage dependence of the ZIP load inside S: dS/d|V| = −S₀·(2z|V| + i)
        dS = -(2 * L[bus, 0] * Vm[bus] + L[bus, 1])
        g = -np.conj(dS) / cV / Vm[bus]                 # −d(conj(S)/conj(V))/d|V| per unit of d|V| = (V_r·dV_r + V_i·dV_i)/|V|
        d_r, d_i = a + g * Vb.real, -1j * a + g * Vb.imag
        J.data[:] = base
        J.data[i11] += d_r.real
        J.data[i12] += d_i.real
        J.data[i21] += d_r.imag
        J.data[i22] += d_i.imag
        if npv:
            w = 1j / np.conj(V[pv])                     # dF/dQ
            J.data[q1], J.data[q2] = w.real, w.imag
            J.data[q3], J.data[q4] = 2 * V[pv].real, 2 * V[pv].imag
        F = (I - np.conj(S / V))[bus]
        rhs = -np.r_[F.real, F.imag, np.abs(V[pv]) ** 2 - case.Vset[pv] ** 2]
        dx = splu(J).solve(rhs)
        V = V.copy()
        V[bus] += dx[:nb] + 1j * dx[nb:2 * nb]
        Q[pv] += dx[2 * nb:]
    return V, it, bool(e < tol), {'fact': it}


# -------------------------------------------------------------------- backward/forward sweep (radial networks)
def sweep(case, V, tol=1e-8, max_iter=200, typ=None, Sg=None):
    """Current summation on the tree from the slack bus, level by level, with the exact π model of every branch (charging, tap,
    shift): backward the currents of the subtrees, forward the voltages. No matrix is factorized. PV buses are not handled:
    the caller asks for another method then. Returns (V, iterations, converged, info)."""
    typ = case.typ if typ is None else typ
    if (typ == PV).any():
        raise PowerFlowError('the backward/forward sweep here has no PV buses (only the slack keeps its voltage): use Newton–Raphson')
    T = case.tree()
    Sg = case.Sg if Sg is None else Sg
    lev = T['levels']
    par, pbr = T['parent'], T['pbr']
    dn = np.zeros(case.n, bool)
    for b, d in T['down'].items():
        dn[b] = d
    V = V.copy()
    it, e = 0, case.err(V, typ, Sg)
    Yff, Yft, Ytf, Ytt = case.Yff, case.Yft, case.Ytf, case.Ytt
    while e >= tol and it < max_iter:
        it += 1
        # the current that each bus draws: load and shunt minus generation
        J = np.conj((case.zip(np.abs(V)) - Sg) / V) + case.ysh * V
        for c in reversed(lev):                       # backward: the current into each branch at its parent end
            k, p = pbr[c], par[c]
            d = dn[c]
            # the current that the branch draws from its parent: from the voltage of the parent and the current J_c that the
            # child end delivers (the child voltage eliminated: V_c = (−Y_cp·V_p − J_c)/Y_cc)
            Ycc, Ycp = np.where(d, Ytt[k], Yff[k]), np.where(d, Ytf[k], Yft[k])
            Ypp, Ypc = np.where(d, Yff[k], Ytt[k]), np.where(d, Yft[k], Ytf[k])
            np.add.at(J, p, Ypp * V[p] + Ypc * (-Ycp * V[p] - J[c]) / Ycc)
        for c in lev:                                 # forward: the voltage of each child from its parent and its current
            k, p = pbr[c], par[c]
            d = dn[c]
            # child at «to»:  −I_t = J_c  →  V_c = (−Ytf·V_p − J_c)/Ytt ; child at «from»: V_c = (−Yft·V_p − J_c)/Yff
            V[c] = np.where(d, (-Ytf[k] * V[p] - J[c]) / Ytt[k], (-Yft[k] * V[p] - J[c]) / Yff[k])
        e = case.err(V, typ, Sg)
        if not np.isfinite(e):
            break
    return V, it, bool(e < tol), {'fact': 0}


# -------------------------------------------------------------------- Gauss–Seidel (for teaching)
def gauss_seidel(case, V, tol=1e-8, max_iter=20000, typ=None, Sg=None, accel=1.0):
    """V_k ← (conj(S_k/V_k) − Σ_{m≠k} Y_km·V_m)/Y_kk bus by bus, a PV bus with its reactive power from the present voltages and
    its magnitude put back. accel: acceleration factor (1: none). Slow by nature: for small networks and for teaching."""
    typ = case.typ if typ is None else typ
    Sg = case.Sg if Sg is None else Sg
    Y = case.Y
    ip, ix, dat = Y.indptr, Y.indices, Y.data
    ydg = Y.diagonal()
    V = V.copy()
    order = [k for k in range(case.n) if typ[k] != REF]
    L = case.load
    it, e = 0, case.err(V, typ, Sg)
    while e >= tol and it < max_iter:
        it += 1
        for k in order:
            sl = slice(ip[k], ip[k + 1])
            s = dat[sl] @ V[ix[sl]]
            vm = abs(V[k])
            Sk = Sg[k] - (L[k, 0] * vm * vm + L[k, 1] * vm + L[k, 2])
            if typ[k] == PV:
                Sk = complex(Sk.real, (V[k] * np.conj(s)).imag)        # the reactive power that the present voltages give
            vn = (np.conj(Sk / V[k]) - (s - ydg[k] * V[k])) / ydg[k]
            vn = V[k] + accel * (vn - V[k])
            if typ[k] == PV:
                vn = vn / abs(vn) * case.Vset[k]
            V[k] = vn
        e = case.err(V, typ, Sg)
        if not np.isfinite(e):
            break
    return V, it, bool(e < tol), {'fact': 0}


# -------------------------------------------------------------------- DC load flow, PTDF, LODF
def dc_model(case):
    """B_bus, B_f and the injections of the phase shifters: P_f = B_f·θ + P_finj, P_bus = B_bus·θ + P_businj (MATPOWER's DC
    model: b = 1/(x·τ), no resistance, no charging)."""
    x = (1 / case.y).imag
    b = 1 / (x * np.abs(case.tap))
    shift = np.angle(case.tap)
    k = np.arange(case.nl)
    Bf = _csr(case.nl, case.n, np.r_[k, k], np.r_[case.f, case.t], np.r_[b, -b], float)
    Cft = _csr(case.nl, case.n, np.r_[k, k], np.r_[case.f, case.t], np.r_[np.ones(case.nl), -np.ones(case.nl)], float)
    Pf_inj = -b * shift
    return (Cft.T @ Bf).tocsr(), Bf, Cft.T @ Pf_inj, Pf_inj


def dc_flow(case, P=None):
    """θ (rad, 0 at the slack) and the branch flows P_f (pu) of the DC load flow. P: net injections per bus (default: the
    generation minus the load at |V| = 1 minus the shunt conductances)."""
    Bbus, Bf, Pbi, Pfi = dc_model(case)
    if P is None:
        P = (case.Sg - case.zip(np.ones(case.n))).real - case.ysh.real
    pv, pq, ref = case.sets()
    nr = np.r_[pv, pq]
    th = np.zeros(case.n)
    th[ref] = case.ang0[ref]
    rhs = (P - Pbi)[nr] - Bbus[nr][:, ref] @ th[ref]
    th[nr] = splu(Bbus[nr][:, nr].tocsc()).solve(rhs)
    return th, Bf @ th + Pfi


def ptdf(case):
    """H (branches × buses): the change of each branch flow per unit of injection at each bus, taken out at the slack."""
    Bbus, Bf, _, _ = dc_model(case)
    pv, pq, ref = case.sets()
    nr = np.r_[pv, pq]
    H = np.zeros((case.nl, case.n))
    lu = splu(Bbus[nr][:, nr].T.tocsc())
    H[:, nr] = lu.solve(Bf[:, nr].T.toarray()).T
    return H


def lodf(case, H=None):
    """L (branches × branches): L[l, k] = the part of the flow of branch k that passes to branch l when k goes out. A column of
    NaN: the outage of that branch splits the network (a bridge)."""
    H = ptdf(case) if H is None else H
    Hft = H[:, case.f] - H[:, case.t]
    d = 1 - np.diag(Hft)
    with np.errstate(divide='ignore', invalid='ignore'):
        Lm = Hft / np.where(np.abs(d) > 1e-8, d, np.nan)
    Lm[np.arange(case.nl), np.arange(case.nl)] = -1.0
    Lm[:, np.abs(d) <= 1e-8] = np.nan
    return Lm


def bridges(case):
    """The branches whose outage splits the network (bridges of the graph; parallel branches are never bridges)."""
    n, nl = case.n, case.nl
    adj = [[] for _ in range(n)]
    for k in range(nl):
        adj[case.f[k]].append((int(case.t[k]), k))
        adj[case.t[k]].append((int(case.f[k]), k))
    disc, low, out, time_ = [-1] * n, [0] * n, np.zeros(nl, bool), 0
    for s in range(n):
        if disc[s] >= 0:
            continue
        stack = [(s, -1, iter(adj[s]))]
        disc[s] = low[s] = time_
        time_ += 1
        while stack:
            u, pe, itr = stack[-1]
            for v, k in itr:
                if k == pe:
                    continue
                if disc[v] < 0:
                    disc[v] = low[v] = time_
                    time_ += 1
                    stack.append((v, k, iter(adj[v])))
                    break
                low[u] = min(low[u], disc[v])
            else:
                stack.pop()
                if stack:
                    p = stack[-1][0]
                    low[p] = min(low[p], low[u])
                    if low[u] > disc[p]:
                        out[pe] = True
    return out


# -------------------------------------------------------------------- the choice of the engine
def advise(case, study='pf', scenarios=1):
    """The method that the engine proposes for this network and study, with its reason (in Greek, as shown in the app):
    {'method', 'why', 'facts'}. study: 'pf' (one load flow), 'batch' (many load flows of one topology), 'n1'."""
    g = case.graph()
    n = case.n
    if study == 'batch':
        return {'method': 'batch', 'facts': g, 'why': f'{scenarios} σενάρια με το ίδιο μοτίβο: Newton με κοινούς παράγοντες σε παρτίδα (μία παραγοντοποίηση στο '
                'σημείο βάσης, όλα τα σενάρια ως δεξιά μέλη μιας λύσης)· κάθε σενάριο επαληθεύεται με το υπόλοιπό του και όποιο δεν συγκλίνει '
                'λύνεται με τον αραιό Newton–Raphson'}
    if study == 'n1':
        return {'method': 'lodf+batch', 'facts': g, 'why': f'{case.nl} διαταραχές: σάρωση με LODF (γραμμική) και λύση AC ως παρτίδα πάνω στους παράγοντες της '
                'βάσης, με διόρθωση χαμηλής τάξης για τον κλάδο που βγαίνει· οι κλάδοι που χωρίζουν το δίκτυο αναφέρονται χωριστά'}
    if g['radial'] and g['pv'] == 0 and g['depth'] * SWEEP_WIDTH <= n:
        return {'method': 'sweep', 'facts': g, 'why': f'ακτινικό και πλατύ δίκτυο ({n} ζυγοί σε {g["depth"]} επίπεδα από τον ζυγό ταλάντωσης, κανένας βρόχος, '
                'κανένας ζυγός PV): εμπρός–πίσω σάρωση ανά επίπεδο, χωρίς παραγοντοποίηση πίνακα'}
    if g['radial'] and g['pv'] == 0 and n > DENSE_MAX:
        return {'method': 'nr', 'facts': g, 'why': f'ακτινικό αλλά βαθύ δίκτυο ({n} ζυγοί σε {g["depth"]} επίπεδα): η σάρωση κοστίζει ανά επίπεδο και εδώ ο αραιός '
                f'Newton–Raphson είναι ταχύτερος (μέτρηση: η σάρωση κερδίζει όταν κάθε επίπεδο έχει κατά μέσο όρο πάνω από {SWEEP_WIDTH} ζυγούς)'}
    if n <= DENSE_MAX:
        return {'method': 'nr_dense', 'facts': g, 'why': f'μικρό δίκτυο ({n} ζυγοί): ο πυκνός Newton–Raphson, με τους ίδιους αριθμούς με τη load_flow· '
                f'ο αραιός κερδίζει πάνω από {DENSE_MAX} ζυγούς'}
    why = f'{n} ζυγοί, {g["loops"]} βρόχοι' + (f', {g["pv"]} ζυγοί PV' if g['pv'] else '')
    return {'method': 'nr', 'facts': g, 'why': why + ': αραιός Newton–Raphson με σταθερό μοτίβο και την ίδια διάταξη στηλών σε κάθε επανάληψη'}


DENSE_MAX = 40          # buses up to which «Αυτόματα» keeps the dense reference path (measured: the sparse path wins above)
SWEEP_WIDTH = 12        # buses per level of the tree above which the sweep is faster than the sparse Newton (measured)


# -------------------------------------------------------------------- one load flow, with reactive limits and fallbacks
def solve(case, method='auto', tol=1e-8, max_iter=None, q_limits=False, flat=False, V0=None, typ=None):
    """One load flow. Returns {'V', 'typ', 'converged', 'iterations', 'method', 'advice', 'path', 'time', 'info'}: path lists
    what ran (a fallback adds a line). With «auto» a Newton–Raphson that fails starts again from a flat start with step
    control before the result is «not converged»."""
    if method not in METHODS:
        raise PowerFlowError(f'method: one of {", ".join(METHODS)}')
    adv = advise(case)
    m = adv['method'] if method == 'auto' else method
    V = case.start(flat) if V0 is None else np.array(V0, complex)
    typ = (case.typ if typ is None else typ).copy()
    Sg = case.Sg.copy()
    t0 = time.perf_counter()
    path, it_total, info = [], 0, {}
    run = {'nr': newton, 'nr_dense': newton_dense, 'nr_ci': newton_ci, 'sweep': sweep, 'gs': gauss_seidel,
           'fdxb': lambda *a, **k: fast_decoupled(*a, scheme='xb', **k), 'fdbx': lambda *a, **k: fast_decoupled(*a, scheme='bx', **k)}
    if m == 'dc':
        th, Pf = dc_flow(case)
        return {'V': np.exp(1j * th), 'typ': typ, 'converged': True, 'iterations': 1, 'method': 'dc', 'advice': adv, 'path': ['dc'],
                'time': time.perf_counter() - t0, 'info': {'Pf': Pf, 'theta': th}}
    while True:
        kw = {'tol': tol, 'typ': typ, 'Sg': Sg}
        if max_iter:
            kw['max_iter'] = max_iter
        V1, it, ok, info = run[m](case, V, **kw)
        path.append(m)
        it_total += it
        if not ok and method == 'auto':
            # a second try from a flat start with step control (the first may have started far from the solution)
            V1, it, ok, info = newton(case, case.start(True), tol=tol, typ=typ, Sg=Sg, damp=True, max_iter=40)
            path.append('nr (επίπεδη εκκίνηση με έλεγχο βήματος)')
            it_total += it
        V = V1
        if not (ok and q_limits and case.has_qlim):
            break
        S = V * np.conj(case.Y @ V) + case.zip(np.abs(V))
        Q = S.imag
        over = (typ == PV) & ((Q > case.qmax + 1e-9) | (Q < case.qmin - 1e-9))
        if not over.any():
            break
        typ[over] = PQ
        Sg[over] = Sg.real[over] + 1j * np.clip(Q[over], case.qmin[over], case.qmax[over])
        if m == 'sweep':
            m = 'nr'
    return {'V': V, 'typ': typ, 'converged': bool(ok), 'iterations': it_total, 'method': m, 'advice': adv, 'path': path,
            'time': time.perf_counter() - t0, 'info': info, 'Sg': Sg}


# -------------------------------------------------------------------- many load flows of one topology (batch)
def _iterate(Ffun, solve, V, pvpq, pq, tol, max_it, mem=8):
    """The iteration of the batch routines for B columns of V (n × B) at once: Broyden's method on a fixed first Jacobian
    (Kelley, Iterative Methods for Linear and Nonlinear Equations, SIAM 1995, algorithm «brsol»): every iteration costs one
    solve with the factors of that Jacobian for all the columns together, and a few inner products with the steps taken so
    far, which turn the linear convergence of the plain chord iteration into a superlinear one. Ffun(V_act, act) → the
    mismatches (N × b); solve(R, act) → J₀⁻¹·R. A column is done only when its own mismatch is under tol; one that grows, or
    is not there after max_it iterations, is marked bad. Returns (done, bad, iterations)."""
    B = V.shape[1]
    na = len(pvpq)
    done, bad, its = np.zeros(B, bool), np.zeros(B, bool), np.zeros(B, int)
    act = np.arange(B)
    F = Ffun(V, act)
    e = np.max(np.abs(F), axis=0) if F.size else np.zeros(B)
    done[e < tol] = True
    bad[~np.isfinite(e)] = True
    live = ~done & ~bad
    act, F, e_prev = act[live], F[:, live], e
    if not len(act):
        return done, bad, its
    steps = []                                            # s_0 … s_n, each N × B (the columns of the scenarios still active are valid)
    s = np.zeros((F.shape[0], B))
    s[:, act] = solve(-F, act)
    for it in range(1, max_it + 1):
        steps.append(s)
        Va = V[:, act]
        ang, Vm = np.angle(Va), np.abs(Va)
        ang[pvpq] += s[:na, act]
        Vm[pq] += s[na:, act]
        V[:, act] = Vm * np.exp(1j * ang)
        its[act] += 1
        F = Ffun(V[:, act], act)
        e = np.max(np.abs(F), axis=0)
        ok = e < tol
        grow = ~ok & (((e > 4 * e_prev[act]) & (it > 2)) | ~np.isfinite(e))
        done[act[ok]] = True
        bad[act[grow]] = True
        e_prev[act] = e
        keep = ~ok & ~grow
        act, F = act[keep], F[:, keep]
        if not len(act):
            break
        if it == max_it:
            bad[act] = True
            break
        z = solve(-F, act)
        if len(steps) > mem:                              # restart: the memory of the steps is full
            steps = []
            s = np.zeros_like(s)
            s[:, act] = z
            continue
        for j in range(len(steps) - 1):
            sj = steps[j][:, act]
            z += steps[j + 1][:, act] * (np.einsum('nb,nb->b', sj, z) / np.einsum('nb,nb->b', sj, sj))
        sn = steps[-1][:, act]
        den = 1 - np.einsum('nb,nb->b', sn, z) / np.einsum('nb,nb->b', sn, sn)
        den = np.where(np.abs(den) > 0.05, den, 1.0)      # a step almost against the last one: the plain chord step
        s = np.zeros_like(s)
        s[:, act] = z / den
    return done, bad, its


def batch(case, dS, V0=None, tol=1e-8, max_it=30, typ=None, lu=None, fallback=True, chunk=None):
    """Load flows for B scenarios that differ in their constant-power injections: dS (B × n, complex, pu) is added to the net
    injection of the base case (generation minus load). One Jacobian, factorized once at the base solution V0, serves every
    scenario: each iteration evaluates all the mismatches at once and solves all the right-hand sides in one call (_iterate).
    A scenario is accepted only when its own true mismatch is under tol; one that does not get there is solved by the sparse
    Newton–Raphson from the base solution (fallback), so the result is that of the reference path within tol.
    Returns {'V' (B × n), 'converged' (B), 'iterations' (B), 'chord' (scenarios solved on the common factors), 'newton'
    (scenarios solved by the fallback), 'time', 'fact' (factorizations)}."""
    t0 = time.perf_counter()
    dS = np.atleast_2d(np.asarray(dS, complex))
    B, n = dS.shape
    if n != case.n:
        raise PowerFlowError(f'dS: {case.n} columns, one per bus')
    typ = case.typ if typ is None else typ
    if V0 is None:
        r = solve(case, 'nr', tol=min(tol, 1e-10), typ=typ)
        if not r['converged']:
            raise PowerFlowError('the base case does not converge')
        V0 = r['V']
    J = case.jac(typ)
    if lu is None:
        _, I0 = case.mismatch(V0)
        J.fill(V0, I0)
        lu = J.factor()
    pvpq, pq = J.pvpq, J.pq
    Y, L = case.Y, case.load
    chunk = chunk or int(np.clip(8e4 // max(1, J.N), 16, 2048))        # blocks that stay in the cache (measured: larger blocks are slower per scenario)
    Vout = np.empty((B, n), complex)
    done, its = np.zeros(B, bool), np.zeros(B, int)
    for c0 in range(0, B, chunk):
        sl = slice(c0, min(B, c0 + chunk))
        Sspec = case.Sg[:, None] + dS[sl].T                            # n × b

        def Ffun(Va, act):
            Vm = np.abs(Va)
            mis = Va * np.conj(Y @ Va) - (Sspec[:, act] - (L[:, 0:1] * Vm ** 2 + L[:, 1:2] * Vm + L[:, 2:3]))
            return np.vstack((mis.real[pvpq], mis.imag[pq]))
        V = np.repeat(V0[:, None], sl.stop - sl.start, axis=1)
        d, _, i = _iterate(Ffun, lambda R, act: lu.solve(R), V, pvpq, pq, tol, max_it)
        Vout[sl], done[sl], its[sl] = V.T, d, i
    nchord, nnew = int(done.sum()), 0
    if fallback:
        for b in np.flatnonzero(~done):
            Vb, it, ok, _ = newton(case, V0.copy(), tol=tol, typ=typ, Sg=case.Sg + dS[b], damp=True, max_iter=30)
            Vout[b], done[b] = Vb, ok
            its[b] += it
            nnew += 1
    return {'V': Vout, 'converged': done, 'iterations': its, 'chord': nchord, 'newton': nnew, 'time': time.perf_counter() - t0, 'fact': 1 + nnew}


# -------------------------------------------------------------------- N−1 in AC, as a batch with a low-rank correction
def _branch_jac(case, k, V):
    """The part of the branches k in the power mismatch and in its Jacobian at V: S_f, S_t and the 4×4 real matrices
    d[P_f, P_t, Q_f, Q_t]/d[θ_f, θ_t, |V_f|, |V_t|] (one per branch)."""
    f, t = case.f[k], case.t[k]
    Vf, Vt = V[f], V[t]
    If = case.Yff[k] * Vf + case.Yft[k] * Vt
    It = case.Ytf[k] * Vf + case.Ytt[k] * Vt
    Sf, St = Vf * np.conj(If), Vt * np.conj(It)
    a, b = Vf * np.conj(case.Yft[k] * Vt), Vt * np.conj(case.Ytf[k] * Vf)
    mf, mt = np.abs(Vf), np.abs(Vt)
    dSf = np.stack((1j * a, -1j * a, Sf / mf + Vf * np.conj(case.Yff[k] * Vf) / mf, a / mt), axis=-1)
    dSt = np.stack((-1j * b, 1j * b, b / mf, St / mt + Vt * np.conj(case.Ytt[k] * Vt) / mt), axis=-1)
    M = np.stack((dSf.real, dSt.real, dSf.imag, dSt.imag), axis=-2)          # … × 4 × 4
    return Sf, St, M


def contingency_ac(case, V0, outages=None, tol=1e-8, max_it=30, typ=None, chunk=None, fallback=True):
    """The load flow after the outage of each branch (one at a time), all of them as a batch on the factors of the base case:
    the Jacobian without branch k is J₀ − U·M_k·Wᵀ (four rows and columns), so its solves come from the solves of J₀ by the
    matrix inversion lemma, and the iteration is that of the batch (_iterate). Each outage is verified with its own mismatch;
    whatever does not converge is solved by the sparse Newton–Raphson on the network without the branch (fallback): if that
    fails too, the outage is reported as not converged (often a voltage collapse). Bridges (the outage splits the network)
    are not solved.
    Returns {'outages', 'V' (K × n, NaN rows for bridges), 'converged', 'island', 'iterations', 'chord', 'newton', 'time'}."""
    t0 = time.perf_counter()
    typ = case.typ if typ is None else typ
    outs = np.arange(case.nl) if outages is None else np.asarray(outages, int)
    K, n = len(outs), case.n
    isl = bridges(case)[outs]
    J = case.jac(typ)
    _, I0 = case.mismatch(V0)
    J.fill(V0, I0)
    lu = J.factor()
    N, na = J.N, J.na
    pa = np.full(n, -1)
    pa[J.pvpq] = np.arange(na)
    pm = np.full(n, -1)
    pm[J.pq] = na + np.arange(J.nm)
    Vout = np.full((K, n), np.nan, complex)
    conv = np.zeros(K, bool)
    its = np.zeros(K, int)
    nchord = nnew = 0
    Y, L = case.Y, case.load
    todo = np.flatnonzero(~isl)
    chunk = chunk or int(np.clip(8e4 // max(1, N), 16, 512))
    for c0 in range(0, len(todo), chunk):
        sel = todo[c0:c0 + chunk]
        k = outs[sel]
        B = len(k)
        f, t = case.f[k], case.t[k]
        col = np.arange(B)
        # rows and columns of the reduced system touched by each outage (−1: the equation or unknown does not exist)
        idx = np.stack((pa[f], pa[t], pm[f], pm[t]))                                  # 4 × B (rows P_f, P_t, Q_f, Q_t; columns θ_f, θ_t, |V_f|, |V_t|)
        has = idx >= 0
        _, _, M = _branch_jac(case, k, V0)                                           # B × 4 × 4
        M = M * has.T[:, :, None] * has.T[:, None, :]
        U = np.zeros((N, 4 * B))
        jj = np.repeat(col, 4) * 4 + np.tile(np.arange(4), B)
        ii = idx.T.reshape(-1)
        ok_e = ii >= 0
        U[ii[ok_e], jj[ok_e]] = 1.0
        Z = lu.solve(U).reshape(N, B, 4)                                             # J₀⁻¹·U per outage
        WZ = np.where(has.T[:, :, None], Z[np.where(has, idx, 0).T, col[:, None], :], 0.0)      # B × 4 × 4 = Wᵀ·Z
        # (J₀ − U·M·Wᵀ)⁻¹·r = y + Z·C·(Wᵀ·y),  C = (I − M·Wᵀ·Z)⁻¹·M,  y = J₀⁻¹·r
        A = np.eye(4)[None] - M @ WZ
        good = np.abs(np.linalg.det(A)) > 1e-10
        C = np.zeros_like(M)
        C[good] = np.linalg.solve(A[good], M[good])
        V = np.repeat(V0[:, None], B, axis=1)
        gi = np.flatnonzero(good)                          # the outages of this block that the correction can take

        def Ffun(Va, act):
            a = gi[act]
            ka, fa, ta, ca = k[a], f[a], t[a], np.arange(len(a))
            Vm = np.abs(Va)
            I = Y @ Va
            I[fa, ca] -= case.Yff[ka] * Va[fa, ca] + case.Yft[ka] * Va[ta, ca]
            I[ta, ca] -= case.Ytf[ka] * Va[fa, ca] + case.Ytt[ka] * Va[ta, ca]
            mis = Va * np.conj(I) - (case.Sg[:, None] - (L[:, 0:1] * Vm ** 2 + L[:, 1:2] * Vm + L[:, 2:3]))
            return np.vstack((mis.real[J.pvpq], mis.imag[J.pq]))

        def solve_c(R, act):
            a = gi[act]
            yv = lu.solve(R)                                                          # N × b
            ia, ha = idx[:, a], has[:, a]
            wy = np.where(ha, yv[np.where(ha, ia, 0), np.arange(len(a))], 0.0)        # 4 × b
            cw = np.einsum('bij,jb->bi', C[a], wy)                                    # b × 4
            return yv + np.einsum('nbi,bi->nb', Z[:, a, :], cw)
        Vg = V[:, gi]
        dg_, _, ig = _iterate(Ffun, solve_c, Vg, J.pvpq, J.pq, tol, max_it)
        V[:, gi] = Vg
        done = np.zeros(B, bool)
        done[gi] = dg_
        its[sel[gi]] += ig
        bad = ~done
        Vout[sel[done]] = V[:, done].T
        conv[sel[done]] = True
        nchord += int(done.sum())
        if fallback:
            for b in np.flatnonzero(bad):
                c2 = without(case, int(k[b]))
                Vb, it, ok, _ = newton(c2, V0.copy(), tol=tol, typ=typ, damp=True, max_iter=30)
                Vout[sel[b]], conv[sel[b]] = Vb, ok
                its[sel[b]] += it
                nnew += 1
    return {'outages': outs, 'V': Vout, 'converged': conv, 'island': isl, 'iterations': its, 'chord': nchord, 'newton': nnew,
            'time': time.perf_counter() - t0}


def without(case, k):
    """A copy of the case without branch k (its four stamps taken out of Y; the pattern stays)."""
    import copy
    c = copy.copy(case)
    f, t = int(case.f[k]), int(case.t[k])
    D = _csr(case.n, case.n, [f, f, t, t], [f, t, f, t], [case.Yff[k], case.Yft[k], case.Ytf[k], case.Ytt[k]])
    c.Y = (case.Y - D).tocsr()
    c.Y = _csr(case.n, case.n, np.r_[c.Y.tocoo().row, np.arange(case.n)], np.r_[c.Y.tocoo().col, np.arange(case.n)], np.r_[c.Y.tocoo().data, np.zeros(case.n)])
    c._jac, c._tree, c.stamps = {}, None, None
    return c


def branch_flows(case, V, Y=None):
    """S_f, S_t (pu) of every branch at the voltages V (n) or (K × n)."""
    V = np.asarray(V)
    Vf, Vt = V[..., case.f], V[..., case.t]
    return Vf * np.conj(case.Yff * Vf + case.Yft * Vt), Vt * np.conj(case.Ytf * Vf + case.Ytt * Vt)


__all__ = ['Case', 'Jacobian', 'PowerFlowError', 'METHODS', 'TXT', 'newton', 'newton_dense', 'newton_ci', 'fast_decoupled', 'sweep',
           'gauss_seidel', 'dc_model', 'dc_flow', 'ptdf', 'lodf', 'bridges', 'advise', 'solve', 'batch', 'contingency_ac', 'without',
           'branch_flows', 'PQ', 'PV', 'REF', 'DENSE_MAX', 'SWEEP_WIDTH']
_ = math
