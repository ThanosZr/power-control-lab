"""Travelling waves on a network of lossless lines, solved independently of the studio's solver (4.22).

The method of characteristics on a fine uniform time grid (our own reference, not Dommel's companion models): each line
end carries an arriving wave a(t) and a leaving wave b(t), with the node voltage V = a + b and the current into the line
(b − a)/Z; the wave that arrives at one end is the one that left the other end τ earlier (linear interpolation on the
grid). At every step the node voltages solve Kirchhoff's current law with the arriving waves known,
Σ (V − 2a_k)/Z_k + G·V + C·(V − V_prev)/Δt + Σ g_nm·(V_n − V_m) = injections, by backward Euler for the
capacitances; the voltage sources are fixed nodes. A line with an initial voltage v₀ and no current starts with
a = b = v₀/2 at both ends (a trapped charge).

A network comes from a project of the studio (components and wires) with lossless lines (TL), resistances,
capacitances to earth, voltage sources (VDC, VIMP ramp) and spark gaps closing at a given time (SG); the probes are
nets. It is used to check the tutorials of the GIS (tests/test_gis.py, tools/verify.py).
"""
import math

import numpy as np

PINS = {'TL': ('a1', 'b1', 'a2', 'b2'), 'R': ('a', 'b'), 'C': ('p', 'n'), 'VIMP': ('p', 'n'), 'VDC': ('p', 'n'),
        'SG': ('a', 'b'), 'GND': ('g',), 'JUNC': ('j',), 'VP': ('p',), 'DS': ('a', 'b')}


def eng(v):
    if isinstance(v, (int, float)):
        return float(v)
    s = str(v).strip().replace(',', '.')
    mul = {'p': 1e-12, 'n': 1e-9, 'u': 1e-6, 'μ': 1e-6, 'm': 1e-3, 'k': 1e3, 'M': 1e6, 'G': 1e9}
    if s and s[-1] in mul:
        return float(s[:-1]) * mul[s[-1]]
    return float(s)


def tl_params(p):
    """Z and τ of a TL of the studio (the specs zt, zl, lc and the coaxial one of 4.22)."""
    spec = p.get('spec', 'zt')
    if spec == 'zt':
        return eng(p['Z']), eng(p['tau'])
    if spec == 'zl':
        return eng(p['Z']), eng(p['len']) / eng(p['vel'])
    if spec == 'lc':
        L, C = eng(p['Lp']), eng(p['Cp'])
        return math.sqrt(L / C), eng(p['len']) * math.sqrt(L * C)
    if spec == 'coax':
        D, d, er, k = eng(p['Dco']), eng(p['dco']), eng(p.get('erco', 1)), eng(p.get('kv', .96))
        return 60 * math.log(D / d) / math.sqrt(er), eng(p['len']) * math.sqrt(er) / (k * 299792458.0)
    raise ValueError('spec ' + spec)


def from_project(pr, t_close=None):
    """The network of a studio project: {'lines', 'R', 'C', 'src', 'gaps', 'nets', 'ground'}. t_close: {SG id: time}
    overrides the closing time of a gap (the studio closes it at the start of the step after its trigger)."""
    parent = {}

    def f(x):
        while parent.setdefault(x, x) != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def u(a, b):
        parent[f(a)] = f(b)

    comps = {c['id']: c for c in pr['components']}
    for c in pr['components']:
        for p in PINS.get(c['type'], ()):
            f((c['id'], p))
    for w in pr['wires']:
        u((w['a']['c'], w['a']['p']), (w['b']['c'], w['b']['p']))
    gnd = {f((c['id'], 'g')) for c in pr['components'] if c['type'] == 'GND'}
    net = lambda cid, p: 'G' if f((cid, p)) in gnd else f((cid, p))
    out = {'lines': [], 'R': [], 'C': [], 'src': [], 'gaps': [], 'probes': {}}
    for c in pr['components']:
        t, p, i = c['type'], c.get('params', {}), c['id']
        if t == 'TL':
            Z, tau = tl_params(p)
            assert net(i, 'b1') == 'G' and net(i, 'b2') == 'G', i + ': the return conductor must be earthed'
            out['lines'].append((net(i, 'a1'), net(i, 'a2'), Z, tau, eng(p.get('v0', 0) or 0)))
        elif t == 'R':
            out['R'].append((net(i, 'a'), net(i, 'b'), eng(p['R'])))
        elif t == 'C':
            a, b = net(i, 'p'), net(i, 'n')
            assert b == 'G', i + ': only capacitances to earth'
            out['C'].append((a, eng(p['C']), eng(p.get('v0', 0) or 0)))
        elif t in ('VIMP', 'VDC'):
            assert net(i, 'n') == 'G'
            if t == 'VDC':
                V = eng(p['V'])
                out['src'].append((net(i, 'p'), lambda tt, V=V: V))
            else:
                assert p.get('shape') == 'ramp', 'only the ramp of VIMP'
                S, V0 = eng(p['S']), eng(p['Vpk'])
                out['src'].append((net(i, 'p'), lambda tt, S=S, V0=V0: min(S * tt, V0) if V0 >= 0 else max(-S * tt, V0)))
        elif t == 'SG':
            tc = (t_close or {}).get(i, eng(p.get('trig')) if str(p.get('trig', '')).strip() else math.inf)
            out['gaps'].append((net(i, 'a'), net(i, 'b'), eng(p.get('Rarc', .1)), tc))
        elif t == 'VP':
            out['probes'][i] = net(i, 'p')
    return out


def solve(nw, t_end, dt, probes=None):
    """March the network to t_end with the step dt; returns {'t': array, probe: array of the node voltage}."""
    nodes = sorted({x for l in nw['lines'] for x in l[:2]} | {x for r in nw['R'] for x in r[:2]} |
                   {c[0] for c in nw['C']} | {g for gp in nw['gaps'] for g in gp[:2]} | {s[0] for s in nw['src']}, key=str)
    nodes = [n for n in nodes if n != 'G']
    fixed = {s[0]: s[1] for s in nw['src']}
    free = [n for n in nodes if n not in fixed]
    ix = {n: k for k, n in enumerate(free)}
    nf = len(free)
    L = nw['lines']
    ends = [(a, Z, j, 0) for j, (a, b, Z, tau, v0) in enumerate(L)] + [(b, Z, j, 1) for j, (a, b, Z, tau, v0) in enumerate(L)]
    ne = len(ends)
    nsteps = int(round(t_end / dt))
    B = np.zeros((nsteps + 2, ne))                       # the leaving waves on the grid (row k = time k·dt)
    v0e = np.array([L[j][4] for (_, _, j, s) in ends])
    B[0] = v0e / 2
    far = np.array([(k + len(L)) % ne for k in range(ne)])   # the other end of the same line
    tau_e = np.array([L[j][3] for (_, _, j, _) in ends])
    Ze = np.array([Z for (_, Z, _, _) in ends])
    node_e = np.array([ix.get(n, -1) for (n, _, _, _) in ends])
    fixed_e = [(k, fixed[n]) for k, (n, _, _, _) in enumerate(ends) if n in fixed]
    Cn = np.zeros(nf)
    V = np.zeros(nf)
    for n, C, v0 in nw['C']:
        if n in ix:
            Cn[ix[n]] += C
            V[ix[n]] = v0
    for k, (n, Z, j, s) in enumerate(ends):           # nodes on charged lines start at the line's voltage
        if n in ix and v0e[k]:
            V[ix[n]] = v0e[k]

    def matrix(closed):
        A = np.zeros((nf, nf))
        for k in range(ne):
            if node_e[k] >= 0:
                A[node_e[k], node_e[k]] += 1 / Ze[k]
        A[np.arange(nf), np.arange(nf)] += Cn / dt
        for a, b, R in nw['R'] + [(a, b, R) for (a, b, R, tc), c in zip(nw['gaps'], closed) if c]:
            g = 1 / R
            for x, y in ((a, b), (b, a)):
                if x in ix:
                    A[ix[x], ix[x]] += g
                    if y in ix:
                        A[ix[x], ix[y]] -= g
        return np.linalg.inv(A)

    closed = [False] * len(nw['gaps'])
    Ainv = matrix(closed)
    pr = probes or {}
    T = np.arange(nsteps + 1) * dt
    out = {k: np.zeros(nsteps + 1) for k in pr}
    Vall = lambda tt: {**{n: V[ix[n]] for n in free}, **{n: fn(tt) for n, fn in fixed.items()}, 'G': 0.0}
    for k, n in pr.items():
        out[k][0] = Vall(0.0)[n]
    for step in range(1, nsteps + 1):
        t = step * dt
        now = [t >= tc - 1e-18 for (_, _, _, tc) in nw['gaps']]
        if now != closed:
            closed = now
            Ainv = matrix(closed)
        # arriving waves: the far end's leaving wave at t − τ (before t = 0: v₀/2)
        q = (t - tau_e) / dt
        i0 = np.floor(q).astype(int)
        fr = q - i0
        lo = np.where(i0 >= 0, B[np.clip(i0, 0, nsteps), far], v0e[far] / 2)
        hi = np.where(i0 + 1 >= 0, B[np.clip(i0 + 1, 0, nsteps), far], v0e[far] / 2)
        a = lo + (hi - lo) * fr
        rhs = Cn / dt * V
        np.add.at(rhs, node_e[node_e >= 0], (2 * a / Ze)[node_e >= 0])
        for (x, y, R) in nw['R'] + [(x, y, R) for (x, y, R, tc), c in zip(nw['gaps'], closed) if c]:
            for p_, q_ in ((x, y), (y, x)):
                if p_ in ix and q_ in fixed:
                    rhs[ix[p_]] += fixed[q_](t) / R
        V = Ainv @ rhs
        Vn = np.where(node_e >= 0, V[np.clip(node_e, 0, max(nf - 1, 0))], 0.0)
        for k, fn in fixed_e:
            Vn[k] = fn(t)
        B[step] = Vn - a
        if pr:
            va = Vall(t)
            for k, n in pr.items():
                out[k][step] = va[n]
    out['t'] = T
    return out
