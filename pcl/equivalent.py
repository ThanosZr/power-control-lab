"""5.0.3 (ROADMAP §96 B.2, decisions 359, 364): the rest of the network as an equivalent at the fundamental, after a load
flow. Experimental.

The buses are split in three: the internal ones (the study area), the boundary buses (kept, and the only ones that touch
the rest), and the external ones (everything that is reached from the internal buses only through a boundary bus). With
the admittance matrix Y of the load flow, Y_ext the part of it from the elements that touch an external bus (E), and the
base case of the full network (V⁰, and the injections S_E⁰ = S_g − S_load(|V⁰|) at the external buses):

* **Ward** (the equivalent circuits of the original paper on power-flow studies, 1949): the external buses are eliminated
  (Kron reduction, the Schur complement):
      Y_eq = Y_ext,BB − Y_BE · Y_EE⁻¹ · Y_EB,     I_eq = −Y_BE · Y_EE⁻¹ · I_E,    I_E = conj(S_E⁰ / V_E⁰).
  Y_eq becomes branches between the boundary buses (−Y_eq,ij) and a shunt at each (the row sums), and I_eq a constant
  power injection at each boundary bus, S_eq = V_B⁰ · conj(I_eq) (the «Ward injection»). The reduced network gives the
  base case of the full network at every kept bus (exactly, within the tolerance of the load flow).
* **Extended Ward** (the paper on real-time external equivalents for static security analysis, 1979): the Ward, and at
  every boundary bus that is PQ a fictitious PV bus (P = 0, |V| = |V⁰|) behind an admittance Y_i that stands for the
  reactive support of the external generators: the reduction is done again with the external PV buses grounded, and Y_i is
  the shunt it gives at bus i less the shunt of the first reduction (our reading of the paper's «large shunt admittance at
  each boundary bus»). In the base case no current flows to the fictitious buses.
* **Norton / Thevenin of many ports**, for EMT: the same Y_eq and I_eq as a current source and an admittance at the
  boundary (the external loads as constant currents of the base case); and with the machines (Ym, Im): the external
  generators behind x″d, the feeders behind Z_Q and the loads as constant admittances of the base case, the sources from the
  solution: Z_th = Ym⁻¹, E = Z_th · Im, and S″k of each port (the contribution of the external network alone).

* **For the short circuit** ('sc'): the same reduction on the sequence networks of IEC 60909-0 (the machines behind their
  corrected impedances, the transformers with K_T, the loads and the line capacitances left out, as in the standard), in
  the positive and in the zero sequence, as reactors between the boundary buses and to earth. The reduced network gives
  the same I″k as the full one at every kept bus, for every kind of fault; not the same i_p by method C or I_b, which
  need the external machines one by one.

When the slack bus is external, a boundary bus becomes the slack (the feeder there has S″k from Z_th of its port), with its
voltage of the base case: the reduced network then gives the base case again. Networks with DC buses or converters are not
reduced yet.

5.0.4 (ROADMAP §96 B.2, THEORY §8ΩΘ): the equivalent in EMT (emt_ports, to_emt), after CIGRE TB 39 (Guidelines for
Representation of Network Elements When Calculating Transients, 2000), §5.1 and Fig. 15: the rest of the network as a source of
positive sequence behind its passive equivalent, the same circuit in the positive and in the zero sequence. Here for N boundary
buses at once (our extension of the figure, which has one): the Thevenin of N ports in each sequence, with the external network
as Network.to_emt would export it (generators behind X″d of their GEN3, branches and lines as π sections with the zero
sequence of their data or the positive one, loads and shunts as earthed constant admittances of the base case, feeders behind
c·U_n²/S″k), so the base case of the full network is exact at the boundary. fig '15b' adds at each bus R_s (the surge impedance
of the external lines that reach it) in series with C (the charging of the external network, which then leaves the
short-circuit impedance), fig '15c' R_s across the short-circuit impedance; both keep the base case exact through E.

5.0.7 (ROADMAP §96 B.3, THEORY §8ΩΙ): the frequency scan of the network beyond the boundary (scan: Z₁(f), Z₀(f) seen from the
boundary buses with every element at the frequency f) and, for one boundary bus, the Foster circuit of Fig. 15a fitted to it
(foster; emt_ports and to_emt with fig '15a'): blocks (L + R′) ∥ (C + R″) ∥ R_p in series behind the source, every element ≥ 0,
the RL branch of each block coupled between the phases so that the zero sequence has its own L and R′ (as the R + L of fig '50'),
C, R″ the same in both sequences. R_p is our addition to the figure (a «similar circuit» of the TB): without it the blocks have
Z(∞) = ΣR″ and cannot follow a network that is capacitive at high frequencies. E from the fitted impedance at f₀ keeps the base
case exact.
"""
import copy
import numpy as np
import scipy.sparse as sp
import scipy.sparse.linalg as spla

from . import network as N
from . import powerflow as PF

KINDS = ('ward', 'xward', 'norton', 'sc')
BUS_KEYS = ('bus', 'a', 'b', 'c', 'hv', 'lv')


class EquivalentError(ValueError):
    pass


def _buses_of(e):
    out = [e[k] for k in BUS_KEYS if e.get(k) is not None]
    if e['kind'] == 'transformer3':
        out.append('_' + e['name'] + '*')               # the star point of a three-winding transformer goes with it
    return out


def split(net, boundary, internal=None):
    """(internal, boundary, external) bus names. boundary: the kept buses that separate the study area from the rest; internal:
    one or more buses of the study area (None: every bus that is not cut off from the first boundary bus's other side is
    found by the graph: the side with the slack is external unless internal is given). The external buses are those reached
    from no internal bus without passing a boundary bus."""
    B = [str(b) for b in boundary]
    for b in B:
        if b not in net.buses:
            raise EquivalentError(f'unknown boundary bus {b}')
    if not B:
        raise EquivalentError('no boundary bus')
    adj = {b: set() for b in net.buses}
    for e in net.elements:
        bs = _buses_of(e)
        for i in range(len(bs)):
            for j in range(i + 1, len(bs)):
                adj[bs[i]].add(bs[j])
                adj[bs[j]].add(bs[i])
    Bs = set(B)

    def reach(start):
        seen, stack = set(start), list(start)
        while stack:
            u = stack.pop()
            for v in adj[u]:
                if v not in seen and v not in Bs:
                    seen.add(v)
                    stack.append(v)
        return seen
    if internal is None:
        # the components of the network without the boundary buses: the one with the slack is external, the rest internal
        rest = [b for b in net.buses if b not in Bs]
        comps, done = [], set()
        for b in rest:
            if b not in done:
                c = reach([b])
                done |= c
                comps.append(c)
        slack = {e['bus'] for e in net.elements if e['kind'] in ('feeder', 'generator', 'unit') and e.get('slack')} | {b for b, v in net.buses.items() if v.get('type') == 'slack'}
        ext = set().union(*[c for c in comps if c & slack]) if any(c & slack for c in comps) else set()
        I = [b for b in rest if b not in ext]
    else:
        I0 = [str(b) for b in internal]
        for b in I0:
            if b not in net.buses:
                raise EquivalentError(f'unknown internal bus {b}')
            if b in Bs:
                raise EquivalentError(f'bus {b} is both internal and boundary')
        Iset = reach(I0)
        I = [b for b in net.buses if b in Iset and b not in Bs]
    E = [b for b in net.buses if b not in Bs and b not in set(I)]
    if not E:
        raise EquivalentError('nothing to reduce: no bus lies beyond the boundary')
    if not I:
        raise EquivalentError('no internal bus: the boundary does not enclose a study area')
    # every external bus must touch only external or boundary buses
    for u in E:
        bad = [v for v in adj[u] if v in set(I)]
        if bad:
            raise EquivalentError(f'bus {u} touches the internal bus {bad[0]} without a boundary bus between them')
    return I, B, E


def area(net, buses):
    """5.0.6 (ROADMAP §94 step γ, §96 B.1): the study area as the buses chosen in the diagram of the network (by clicks, a
    window or a lasso) → (internal, boundary, external), as split() gives them. The boundary is every chosen bus that touches
    a bus that was not chosen; the internal buses are the other chosen ones; the external buses are all that were not chosen.
    A bus of type 'internal' (the star point of a three-winding transformer, an unloaded tertiary) is not chosen by itself:
    it goes with the area exactly when every other bus it touches is chosen."""
    A = []
    for b in buses:
        b = str(b)
        if b not in net.buses:
            raise EquivalentError(f'unknown bus {b}')
        if b not in A:
            A.append(b)
    if not A:
        raise EquivalentError('no bus chosen')
    adj = {b: set() for b in net.buses}
    for e in net.elements:
        bs = _buses_of(e)
        for i in range(len(bs)):
            for j in range(i + 1, len(bs)):
                adj[bs[i]].add(bs[j])
                adj[bs[j]].add(bs[i])
    star = {b for b, v in net.buses.items() if v.get('type') == 'internal'}
    As = {b for b in A if b not in star}
    for s in [b for b in net.buses if b in star]:
        seen = adj[s] - star
        if seen and seen <= As:
            As.add(s)
    B = [b for b in net.buses if b in As and any(v not in As for v in adj[b])]
    if not B:
        raise EquivalentError('the chosen buses touch no other bus: nothing lies beyond them')
    I = [b for b in net.buses if b in As and b not in set(B)]
    if not I:
        raise EquivalentError('every chosen bus touches a bus that was not chosen, so all are boundary buses: '
                              'choose also the buses behind them, inside the area')
    return split(net, B, I)


def _copy(net):
    """A copy without the caches (a deep copy: the file of to_dict leaves out buses of the type 'internal', which a network
    may also have by its own hand, as the tertiary of T4 in the test network of IEC TR 60909-4)."""
    r = copy.deepcopy(net)
    for k in [k for k in r.__dict__ if k.startswith('_')]:
        del r.__dict__[k]
    r._imp = {}
    return r


def _retained(net, E):
    """A copy of the network without the external buses and every element that touches one."""
    Es = set(E)
    r = _copy(net)
    r.elements = [e for e in r.elements if not (set(_buses_of(e)) & Es)]
    for b in E:
        del r.buses[b]
    r.__dict__.pop('_names', None)
    return r


def _short_circuit(net, I, B, E, mode):
    """kind 'sc': the external part of the sequence networks of IEC 60909-0 reduced to the boundary, as reactors."""
    names, idx = net._index()
    parts = net._sc_parts(mode, 1.0, 1.1)
    ret = _retained(net, E)
    rn, ridx = ret._index()
    rparts = ret._sc_parts(mode, 1.0, 1.1)
    iB, iE = [idx[b] for b in B], [idx[b] for b in E]
    jB = [ridx[b] for b in B]
    out = {'kind': 'sc', 'mode': mode, 'internal': I, 'boundary': B, 'external': E, 'fictitious': [], 'slack': None, 'Ysc': {}}
    r = ret
    pre = '~eq'
    Ys = {}
    for seq in (1, 0):
        Y = net._ybus(parts, seq, idx, len(names))
        Yr = ret._ybus(rparts, seq, ridx, len(rn))
        Yeq = Y[np.ix_(iB, iB)] - Y[np.ix_(iB, iE)] @ np.linalg.solve(Y[np.ix_(iE, iE)], Y[np.ix_(iE, iB)]) - Yr[np.ix_(jB, jB)]
        Ys[seq] = (Yeq + Yeq.T) / 2
        out['Ysc'][seq] = Yeq
    nB = len(B)
    for a in range(nB):
        for b in range(a + 1, nB):
            y1, y0 = -Ys[1][a, b], -Ys[0][a, b]
            if y1 == 0 and y0 == 0:
                continue
            zb = net._zb(B[a])
            # no threshold: a zero sequence without earthing is held only by the 1e-12 pu of _ybus, and the reduction keeps it
            z1, z0 = (1 / y * zb if y != 0 else complex(0, 1e30) for y in (y1, y0))
            r.reactor(B[a], z1.imag, z1.real, b=B[b], X0=z0.imag, R0=z0.real, name=f'{pre}:{B[a]}-{B[b]}')
    for a in range(nB):
        y1, y0 = Ys[1][a].sum(), Ys[0][a].sum()
        if y1 == 0 and y0 == 0:
            continue
        zb = net._zb(B[a])
        z1, z0 = (1 / y * zb if y != 0 else complex(0, 1e30) for y in (y1, y0))
        r.reactor(B[a], z1.imag, z1.real, X0=z0.imag, R0=z0.real, name=f'{pre}:sh:{B[a]}')
    out['net'] = r
    return out


def reduce(net, boundary, internal=None, kind='ward', lf=None, slack=None, tol=1e-10, mode='max'):
    """The equivalent of the network beyond the boundary (see the module). kind: 'ward', 'xward' (extended Ward), 'norton'
    or 'sc' (for the short circuit of IEC 60909-0, mode 'max' or 'min'; it needs no load flow).
    lf: the load flow of the full network (net.power_flow(tol=tol) when None). slack: the boundary bus that becomes the slack
    when the slack is external (default: the boundary bus with the largest equivalent injection).
    Returns {'kind', 'internal', 'boundary', 'external' (bus names), 'Y' (pu, boundary × boundary), 'I' (pu), 'S' (pu, the
    Ward injections), 'Ym', 'Im' (the Norton with the machines), 'Z', 'E' (its Thevenin, pu, None when singular), 'Sk' (VA
    per boundary bus: the contribution of the external network, from Z_th), 'net' (the
    reduced Network for 'ward' and 'xward'), 'fictitious' ([(boundary bus, fictitious bus, admittance in pu)]), 'slack'
    (the boundary bus made slack, or None), 'asym' (the largest |Y_ij − Y_ji|: phase shifters beyond the boundary)}.
    For 'sc': {'kind', 'mode', 'internal', 'boundary', 'external', 'Ysc' ({1: …, 0: …}, pu, boundary × boundary), 'net'}."""
    if kind not in KINDS:
        raise EquivalentError(f'kind: one of {", ".join(KINDS)}')
    if getattr(net, 'dc_buses', None):
        raise EquivalentError('networks with DC buses and converters are not reduced yet')
    I, B, E = split(net, boundary, internal)
    if kind == 'sc':
        if mode not in ('max', 'min'):
            raise EquivalentError("mode: 'max' or 'min'")
        return _short_circuit(net, I, B, E, mode)
    c = net.case()
    if lf is None:
        lf = net.power_flow(tol=tol)
    if not lf.get('converged', True):
        raise EquivalentError('the load flow of the full network did not converge')
    V0 = np.array([_v(lf, b) for b in c.names], complex)
    ix = c.idx
    iB, iE = np.array([ix[b] for b in B]), np.array([ix[b] for b in E])
    Y = c.Y.tocsr()
    ret = _retained(net, E)
    _, ridx, Yr = _ymat(ret)
    jB = np.array([ridx[b] for b in B])
    YBB = Y[iB][:, iB].toarray() - Yr[jB][:, jB].toarray()          # the part of the boundary from the elements that touch E
    YBE = Y[iB][:, iE].tocsc()
    YEB = Y[iE][:, iB].tocsc()
    YEE = Y[iE][:, iE].tocsc()
    IE = (Y @ V0)[iE]                                               # the injected currents of the base case (PV buses: their solved Q)
    lu = spla.splu(YEE)
    X = lu.solve(YEB.toarray())                                     # Y_EE⁻¹ · Y_EB
    Yeq = YBB - YBE @ X
    Ieq = -(YBE @ lu.solve(IE))
    Seq = V0[iB] * np.conj(Ieq)
    asym = float(np.max(np.abs(Yeq - Yeq.T))) if len(B) > 1 else 0.0
    # the Thevenin of many ports with the machines: the external generators behind x″d, the feeders behind Z_Q, the loads as
    # constant admittances of the base case; the sources follow from the solution, so the base case stays exact
    yx = np.zeros(len(E), complex)
    Ee = {b: k for k, b in enumerate(E)}
    load0 = c.zip(np.abs(V0))
    for k, b in enumerate(E):
        yx[k] += np.conj(load0[ix[b]]) / abs(V0[ix[b]]) ** 2
    for e in net.elements:
        k = Ee.get(e.get('bus'))
        if k is None:
            continue
        Un = net.buses[e['bus']]['Un']
        if e['kind'] in ('generator', 'unit') and e.get('xd2') and e.get('Sr'):
            yx[k] += (e['Sr'] / net.S_base) * (e.get('Ur', Un) / Un) ** 2 / (1j * e['xd2'])
        elif e['kind'] == 'feeder':
            Sk0 = e.get('Sk') or (e['Ik'] * np.sqrt(3) * (e.get('Un') or Un) if e.get('Ik') else None)
            if Sk0:
                rx = e.get('RX', 0.1)
                yx[k] += 1 / ((rx + 1j) / np.hypot(rx, 1.0) * 1.1 * net.S_base / Sk0)
    YEEm = (YEE + sp.diags(yx)).tocsc()
    lum = spla.splu(YEEm)
    Ym = YBB - YBE @ lum.solve(YEB.toarray())
    Im = -(YBE @ lum.solve((YEEm @ V0[iE]) + (YEB @ V0[iB])))          # J_E = (Y_EE + Y_x)·V_E⁰ + Y_EB·V_B⁰: the sources behind the admittances
    try:
        Zth, Eth = np.linalg.inv(Ym), None
        Eth = Zth @ Im
    except np.linalg.LinAlgError:
        Zth = Eth = None
    Sk = {b: (float(abs(V0[iB[k]]) ** 2 / abs(Zth[k, k]) * net.S_base) if Zth is not None and abs(Zth[k, k]) > 0 else None) for k, b in enumerate(B)}
    out = {'kind': kind, 'internal': I, 'boundary': B, 'external': E, 'Y': Yeq, 'I': Ieq, 'S': Seq, 'Ym': Ym, 'Im': Im, 'Z': Zth, 'E': Eth, 'Sk': Sk,
           'asym': asym, 'fictitious': [], 'slack': None, 'net': None, 'V0': {b: complex(V0[ix[b]]) for b in I + B}}
    if kind == 'norton':
        return out
    # the reduced network: the kept part, the equivalent branches and shunts, the Ward injections
    r = ret
    pre = '~eq'
    nB = len(B)
    Ys = (Yeq + Yeq.T) / 2
    for a in range(nB):
        for b in range(a + 1, nB):
            y = -Ys[a, b]
            if abs(y) > 1e-12:
                z = 1 / y
                r.branch_pu(B[a], B[b], z.real, z.imag, name=f'{pre}:{B[a]}-{B[b]}')
    for a in range(nB):
        ysh = Ys[a].sum()
        if abs(ysh) > 1e-14:
            r.shunt(B[a], P=ysh.real * net.S_base, Q=-ysh.imag * net.S_base, name=f'{pre}:sh:{B[a]}')
        s = Seq[a]
        if abs(s) > 1e-14:
            r.load(B[a], P=-s.real * net.S_base, Q=-s.imag * net.S_base, name=f'{pre}:inj:{B[a]}')
    # the slack: kept, or a boundary bus when it was external
    has_slack = any(e['kind'] in ('feeder', 'generator', 'unit') and e.get('slack') for e in ret.elements)
    if not has_slack:
        sb = str(slack) if slack is not None else B[int(np.argmax(np.abs(Seq)))]
        if sb not in B:
            raise EquivalentError(f'slack {sb}: not a boundary bus')
        k = B.index(sb)
        v = V0[ix[sb]]
        r.feeder(sb, Sk=Sk[sb] or 1e12, V=float(abs(v)), angle=float(np.degrees(np.angle(v))), name=f'{pre}:slack:{sb}')
        out['slack'] = sb
    if kind == 'xward':
        pvE = np.array([c.typ[i] != PF.PQ for i in iE])
        if pvE.any():
            G = sp.diags(np.where(pvE, 1e10, 0.0).astype(complex)).tocsc()
            Yg = YBB - YBE @ spla.splu((YEE + G).tocsc()).solve(YEB.toarray())
            extra = ((Yg + Yg.T) / 2).sum(axis=1) - Ys.sum(axis=1)
            cr = r.case()
            typ_r = {b: int(cr.typ[cr.idx[b]]) for b in B}
            for a, b in enumerate(B):
                y = extra[a]
                if typ_r.get(b) != PF.PQ or abs(y) < 1e-9:
                    continue
                m = f'{pre}:pv:{b}'
                r.bus(m, net.buses[b]['Un'], 'PV', float(abs(V0[ix[b]])), float(np.degrees(np.angle(V0[ix[b]]))))
                z = 1 / y
                r.branch_pu(b, m, z.real, z.imag, name=f'{pre}:x:{b}')
                r.generator(m, Sr=net.S_base, Ur=net.buses[b]['Un'], xd2=0.2, cosphi=0.9, P=0.0, V=float(abs(V0[ix[b]])), name=f'{pre}:gen:{b}')
                out['fictitious'].append((b, m, complex(y)))
    out['net'] = r
    return out


def _v(lf, b):
    """The complex voltage of bus b in a load-flow result (pu)."""
    if '_V' in lf and b in lf.get('_idx', {}):
        return complex(lf['_V'][lf['_idx'][b]])
    q = lf['buses'][b]
    return q['V'] * np.exp(1j * np.radians(q['angle']))


def _ymat(net):
    """(names, idx, Y) of the load flow of a network, from its stamps (no slack bus needed)."""
    raw = {}
    names, idx = net._lf_model(raw)[:2]
    rows, cols, vals = raw['stamps']
    n = len(names)
    return names, idx, sp.coo_matrix((np.asarray(vals, complex), (np.asarray(rows, int), np.asarray(cols, int))), shape=(n, n)).tocsr()


def compare(net, eq, outages=None, tol=1e-10):
    """The reduced network against the full one: the base case and, for each outage of a branch among the kept buses
    (outages: names; None: every branch of the study area), the largest |V| difference (pu) and angle difference (deg) at the
    kept buses, and the largest flow difference on the kept branches (MW). Returns {'base': {...}, 'outages': [{...}]}."""
    red = eq['net']
    if red is None:
        raise EquivalentError('compare: the Norton equivalent has no network; use ward or xward')
    keep = eq['internal'] + eq['boundary']
    ks = set(keep)
    names = [e['name'] for e in net.elements if e['kind'] in ('line', 'branch', 'transformer') and set(_buses_of(e)) <= ks
             and not str(e['name']).startswith('~eq')]
    if outages is None:
        outages = names
    nset = set(names)

    def diff(fn, rn):
        try:
            a = fn.power_flow(tol=tol)
            b = rn.power_flow(tol=tol)
        except Exception as x:
            # 5.0.7: an island leaves a singular Jacobian; whether the factorization says so («Factor is exactly singular») or
            # Newton stops without converging depends on the rounding of the processor: the same answer either way
            if isinstance(x, np.linalg.LinAlgError) or 'singular' in str(x).lower():
                return {'error': 'no convergence'}
            return {'error': str(x)}
        if not (a.get('converged', True) and b.get('converged', True)):
            return {'error': 'no convergence'}
        dv = max(abs(a['buses'][k]['V'] - b['buses'][k]['V']) for k in keep)
        da = max(abs(np.degrees(np.angle(_v(b, k) / _v(a, k)))) for k in keep)
        fa = {f['name']: f for f in a['branches']}
        fb = {f['name']: f for f in b['branches']}
        dp = max([abs(fa[k]['Pa'] - fb[k]['Pa']) for k in fa if k in fb and k in nset] or [0.0])
        return {'dV': dv, 'dA': da, 'dP': dp / 1e6}
    out = {'base': diff(net, red), 'outages': []}
    for o in outages:
        f2, r2 = _copy(net), _copy(red)
        f2.remove(o)
        r2.remove(o)
        d = diff(f2, r2)
        d['outage'] = o
        out['outages'].append(d)
    return out



# ---------------------------------------------------------------- 5.0.4: the equivalent in EMT (CIGRE TB 39, Fig. 15)
# the typical machine of GEN3 (web/studio/parts.js): what Network.to_emt gives a generator without data in `machines`
GEN3_TYPICAL = {'Ra': 0.003, 'X0': 0.15, 'Xdp': 0.3, 'Xdpp': 0.23, 'Td0pp': 0.03, 'neut': 'gnd'}
FIGS = ('50', '15b', '15c')
FOSTER = '15a'                  # 5.0.7: Fig. 15a, one port (emt_ports, to_emt, EQV3 'fig')
FDNE = 'fdne'                   # 5.0.9: the frequency dependent network equivalent of many ports (emt_ports, to_emt, EQV3 'fig')
EMT_KINDS = ('generator', 'feeder', 'load', 'shunt', 'branch', 'line', 'reactor')


def _gen3(net, e, machines):
    """(y₁, y₀) of a generator in per unit of S_base, as GEN3 has it: behind X″d (X′d without a d damper, T″d0 = 0), and X₀
    with the star point earthed (0 when isolated)."""
    q = {'Sn': e['Sr'], **GEN3_TYPICAL, **(machines or {}).get(e['name'], {})}
    x2 = q['Xdpp'] if float(q.get('Td0pp') or 0) > 0 else q['Xdp']
    k = q['Sn'] / net.S_base
    neut = q.get('neut', 'gnd')
    if neut not in ('gnd', 'iso'):
        raise EquivalentError(f'{e["name"]}: the star point «{neut}» of its GEN3 is not in the EMT equivalent yet (earthed or isolated)')
    return k / complex(q['Ra'], x2), (0.0 if neut == 'iso' else k / complex(q['Ra'], q['X0']))


def _ext_y(net, lf, E, machines, seq, charging=True):
    """(names, idx, Y) of the elements that touch an external bus, in the sequence seq (1 or 0), at the fundamental, with the
    machines and the loads as admittances (see the module); Y dense, per unit."""
    raw = {}
    names, idx = net._lf_model(raw)[:2]
    n = len(names)
    Es = set(E)
    iE = {idx[b] for b in E}
    el = {e['name']: e for e in net.elements}
    Y = np.zeros((n, n), complex)
    for e in net.elements:
        if set(_buses_of(e)) & Es and e['kind'] not in EMT_KINDS:
            raise EquivalentError(f'{e["name"]}: {e["kind"]} beyond the boundary is not in the EMT equivalent yet ({", ".join(EMT_KINDS)})')
    for name, i, j, y, bsh, ta, _ in raw['branches']:
        if not (i in iE or j in iE):
            continue
        e = el[str(name).split('#')[0]]
        if abs(np.angle(ta)) > 1e-12:
            raise EquivalentError(f'{e["name"]}: a phase shift beyond the boundary has no symmetric EMT equivalent')
        if seq == 0:
            if e['kind'] == 'line' and e.get('R0') is not None and e.get('X0') is not None:
                y = 1 / (complex(e['R0'], e['X0']) * e['length'] / e['parallel'] / net._zb(e['a']))
            elif e['kind'] == 'reactor' and e.get('X0') is not None:
                y = 1 / (complex(e.get('R0') or 0.0, e['X0']) / net._zb(e['a']))
        b = bsh if charging else 0.0
        t = abs(ta)
        Y[i, i] += (y + 0.5j * b) / t ** 2
        Y[i, j] += -y / t
        Y[j, i] += -y / t
        Y[j, j] += y + 0.5j * b
    V0 = {b: _v(lf, b) for b in E}
    for e in net.elements:
        b = e.get('bus')
        if b not in Es:
            continue
        i = idx[b]
        k = e['kind']
        if k == 'generator':
            Y[i, i] += _gen3(net, e, machines)[0 if seq == 1 else 1]
        elif k == 'feeder':
            Un = e.get('Un') or net.buses[b]['Un']
            Sk = e.get('Sk') or (e['Ik'] * np.sqrt(3) * Un if e.get('Ik') else None)
            if not Sk:
                raise EquivalentError(f'{e["name"]}: a feeder beyond the boundary needs S″k or I″k')
            rx = e.get('RX', 0.1)
            z1 = (rx + 1j) / np.hypot(rx, 1.0) * 1.1 * net.S_base / Sk
            if seq == 1:
                Y[i, i] += 1 / z1
            elif e.get('X0X') is not None:
                x0 = e['X0X'] * z1.imag
                Y[i, i] += 1 / complex((e.get('R0X0') or 0.0) * x0, x0)
        elif k == 'load':
            Vm = abs(V0[b])
            zz, ii, pp = e['zip']
            Y[i, i] += complex(e['P'], -e['Q']) / net.S_base * (zz + ii / Vm + pp / Vm ** 2)
        elif k == 'shunt':
            Y[i, i] += complex(e['P'], -e['Q']) / net.S_base
        elif k == 'reactor' and e.get('b') is None:
            X, R = (e['X0'], e.get('R0') or 0.0) if (seq == 0 and e.get('X0') is not None) else (e['X'], e['R'])
            Y[i, i] += 1 / (complex(R, X) / net._zb(b))
    return names, idx, Y


def _kron(Y, iB, iE):
    YEE = Y[np.ix_(iE, iE)]
    return Y[np.ix_(iB, iB)] - Y[np.ix_(iB, iE)] @ np.linalg.solve(YEE, Y[np.ix_(iE, iB)])


# ---------------------------------------------------------------- 5.0.7: the scan of the network beyond the boundary
SCAN_LINES = ('pi', 'distributed')
SCAN_FMIN, SCAN_FMAX, SCAN_N = 5.0, 2000.0, 300
SCAN_MAX_N, SCAN_MAX_F = 2000, 1e6


class _Ext:
    """The elements that touch an external bus at any frequency f = h·f₀, in the sequence seq: what _ext_y has at the
    fundamental, with every resistance constant and every reactance as h·X (a capacitance as h·B): the branches R + jhX with
    their charging as h·B (line 'distributed': the hyperbolic corrections of the long line on the lines with charging, as
    pcl.harmonic has them), the generators R_a + jhX″d (R_a + jhX₀), the feeders R + jhX of their short-circuit impedance, the
    loads and the shunts as G in parallel with L (Q > 0) or C (Q < 0) from their admittance in the base case (LOAD3 'z' of the
    export), the shunt reactors R + jhX."""

    def __init__(self, net, lf, E, machines, seq, charging=True, line='pi'):
        if line not in SCAN_LINES:
            raise EquivalentError(f'line: one of {", ".join(SCAN_LINES)}')
        raw = {}
        names, idx = net._lf_model(raw)[:2]
        self.names, self.idx, self.n = names, idx, len(names)
        Es = set(E)
        iE = {idx[b] for b in E}
        el = {e['name']: e for e in net.elements}
        for e in net.elements:
            if set(_buses_of(e)) & Es and e['kind'] not in EMT_KINDS:
                raise EquivalentError(f'{e["name"]}: {e["kind"]} beyond the boundary is not in the EMT equivalent yet ({", ".join(EMT_KINDS)})')
        xs = net._sssc_x()
        br = []
        for name, i, j, y, bsh, ta, _ in raw['branches']:
            if not (i in iE or j in iE):
                continue
            e = el[str(name).split('#')[0]]
            if abs(np.angle(ta)) > 1e-12:
                raise EquivalentError(f'{e["name"]}: a phase shift beyond the boundary has no symmetric EMT equivalent')
            if xs.get(e['name']):
                raise EquivalentError(f'{e["name"]}: a series compensator beyond the boundary is not in the frequency scan yet')
            z = 1 / y
            if seq == 0:
                if e['kind'] == 'line' and e.get('R0') is not None and e.get('X0') is not None:
                    z = complex(e['R0'], e['X0']) * e['length'] / e['parallel'] / net._zb(e['a'])
                elif e['kind'] == 'reactor' and e.get('X0') is not None:
                    z = complex(e.get('R0') or 0.0, e['X0']) / net._zb(e['a'])
            b = bsh if charging else 0.0
            t = abs(ta)
            br.append((i, j, z.real, z.imag, b, t, float(line == 'distributed' and e['kind'] == 'line' and b > 0 and abs(t - 1) < 1e-12)))
        a = np.array(br, float).reshape(-1, 7)
        self.bi, self.bj = a[:, 0].astype(int), a[:, 1].astype(int)
        self.r, self.x, self.b, self.t, self.long = a[:, 2], a[:, 3], a[:, 4], a[:, 5], a[:, 6] > 0
        sh = []                                        # (bus index, 'rl': R + jhX | 'gb': G + j(hB if B > 0 else B/h), per unit)
        for e in net.elements:
            bb = e.get('bus')
            if bb not in Es:
                continue
            i = idx[bb]
            k = e['kind']
            if k == 'generator':
                q = {'Sn': e['Sr'], **GEN3_TYPICAL, **(machines or {}).get(e['name'], {})}
                _gen3(net, e, machines)                # its checks
                x2 = q['Xdpp'] if float(q.get('Td0pp') or 0) > 0 else q['Xdp']
                kk = q['Sn'] / net.S_base
                if seq == 1:
                    sh.append((i, 'rl', (q['Ra'] / kk, x2 / kk)))
                elif q.get('neut', 'gnd') != 'iso':
                    sh.append((i, 'rl', (q['Ra'] / kk, q['X0'] / kk)))
            elif k == 'feeder':
                Un = e.get('Un') or net.buses[bb]['Un']
                Sk = e.get('Sk') or (e['Ik'] * np.sqrt(3) * Un if e.get('Ik') else None)
                if not Sk:
                    raise EquivalentError(f'{e["name"]}: a feeder beyond the boundary needs S″k or I″k')
                rx = e.get('RX', 0.1)
                z1 = (rx + 1j) / np.hypot(rx, 1.0) * 1.1 * net.S_base / Sk
                if seq == 1:
                    sh.append((i, 'rl', (z1.real, z1.imag)))
                elif e.get('X0X') is not None:
                    x0 = e['X0X'] * z1.imag
                    sh.append((i, 'rl', ((e.get('R0X0') or 0.0) * x0, x0)))
            elif k in ('load', 'shunt'):
                y = complex(e['P'], -e['Q']) / net.S_base
                if k == 'load':
                    Vm = abs(_v(lf, bb))
                    zz, ii, pp = e['zip']
                    y = y * (zz + ii / Vm + pp / Vm ** 2)
                sh.append((i, 'gb', (y.real, y.imag)))
            elif k == 'reactor' and e.get('b') is None:
                X, R = (e['X0'], e.get('R0') or 0.0) if (seq == 0 and e.get('X0') is not None) else (e['X'], e['R'])
                zb = net._zb(bb)
                sh.append((i, 'rl', (R / zb, X / zb)))
        self.sh = sh

    def Y(self, h):
        """The admittance matrix (dense, per unit) of these elements at h times the fundamental."""
        n = self.n
        Y = np.zeros((n, n), complex)
        z = self.r + 1j * h * self.x
        ysh = 0.5j * h * self.b
        L = self.long
        if L.any():
            g = np.sqrt(z[L] * (1j * h * self.b[L]))   # γ·l of every line with charging
            z, ysh = z.copy(), ysh.copy()
            z[L] = z[L] * np.sinh(g) / g
            ysh[L] = ysh[L] * np.tanh(g / 2) / (g / 2)
        y = 1 / z
        t = self.t
        np.add.at(Y, (self.bi, self.bi), (y + ysh) / t ** 2)
        np.add.at(Y, (self.bi, self.bj), -y / t)
        np.add.at(Y, (self.bj, self.bi), -y / t)
        np.add.at(Y, (self.bj, self.bj), y + ysh)
        for i, k, p in self.sh:
            if k == 'rl':
                Y[i, i] += 1 / complex(p[0], h * p[1])
            else:
                Y[i, i] += complex(p[0], p[1] * h if p[1] > 0 else p[1] / h)
        return Y


def scan(net, boundary, internal=None, lf=None, machines=None, fmin=SCAN_FMIN, fmax=SCAN_FMAX, n=SCAN_N, line='pi', f=None, tol=1e-10):
    """5.0.7 (ROADMAP §96 B.3, THEORY §8ΩΙ): the impedance of the network beyond the boundary against the frequency, seen from
    the boundary buses with the sources short-circuited (the frequency scan of CIGRE TB 39 §5.1: «the frequency dependent
    impedance Z₁(f) in the positive and Z₀(f) in the zero sequence … by a pre-calculation taking into account all components of
    the partial networks to be reduced»). The external network as emt_ports has it (with the charging), every element at the
    frequency f (see _Ext); line 'pi' as Network.to_emt exports the lines (one π section each: the same network as the full
    one in EMT), 'distributed' with the long-line corrections. f: the frequencies in Hz (else n of them from fmin to fmax,
    logarithmically, and the fundamental). Returns {'f' (Hz), 'Z1', 'Z0' (per unit, len(f) × N × N), 'boundary', 'internal',
    'external', 'Zb' (Ω per port), 'f0', 'line', 'peaks' (per port: the frequencies of the local maxima of |Z₁|, Hz)}."""
    if getattr(net, 'dc_buses', None):
        raise EquivalentError('networks with DC buses and converters are not reduced yet')
    if f is None:
        if not (0 < fmin < fmax <= SCAN_MAX_F) or not (2 <= int(n) <= SCAN_MAX_N):
            raise EquivalentError(f'scan: 0 < fmin < fmax ≤ {SCAN_MAX_F:g} Hz and 2 to {SCAN_MAX_N} frequencies')
        fl = np.logspace(np.log10(fmin), np.log10(fmax), int(n))
        fl[0], fl[-1] = fmin, fmax
        f = np.unique(np.r_[fl, float(net.f)])
    f = np.asarray(f, float).ravel()
    if not len(f) or len(f) > SCAN_MAX_N + 1 or f.min() <= 0 or f.max() > SCAN_MAX_F:
        raise EquivalentError(f'scan: frequencies above 0 and up to {SCAN_MAX_F:g} Hz, {SCAN_MAX_N + 1} at most')
    I, B, E = split(net, boundary, internal)
    if lf is None:
        lf = net.load_flow(tol=tol)
    if not lf.get('converged', True):
        raise EquivalentError('the load flow of the full network did not converge')
    out = {}
    for seq in (1, 0):
        X = _Ext(net, lf, E, machines, seq, line=line)
        iB, iE = [X.idx[b] for b in B], [X.idx[b] for b in E]
        Zs = []
        for fk in f:
            Ym = _kron(X.Y(fk / net.f), iB, iE)
            if seq == 0 and np.abs(np.linalg.eigvals(Ym)).min() < 1e-6:
                Ym = Ym + 1e-6 * np.eye(len(B))       # as emt_ports: a boundary bus without a zero-sequence path beyond it
            Zs.append(np.linalg.inv(Ym))
        out[seq] = np.array(Zs)
    peaks = []
    for k in range(len(B)):
        m = np.abs(out[1][:, k, k])
        peaks.append([float(f[i]) for i in range(1, len(f) - 1) if m[i] > m[i - 1] and m[i] >= m[i + 1]])
    return {'f': f, 'Z1': out[1], 'Z0': out[0], 'boundary': B, 'internal': I, 'external': E, 'Zb': [float(net._zb(b)) for b in B],
            'f0': float(net.f), 'line': line, 'peaks': peaks}


# ---------------------------------------------------------------- 5.0.7: the Foster circuit of CIGRE TB 39, Fig. 15a, for one port
# Per unit, on the normalized frequency s/ω₀: X_L = ω₀L, B_C = ω₀C (so jX at the fundamental is s·X_L with s = j).
# A block: (L + R′) ∥ (C + R″) ∥ R_p, the blocks in series behind the source; the RL branch of each block is coupled between the
# phases (the inductance and the resistance of the positive and of the zero sequence, as the coupled R + L of Fig. 50 in EQV3),
# C, R″ the same in both sequences, R_p in both (G = 1/R_p, coupled as R′). With pure: no R_p (G = 0), the figure itself.
FOSTER_TOL, FOSTER_KMAX, FOSTER_W0, FOSTER_RATIO = 0.03, 6, 30.0, 100.0
FOSTER_COLS = ('L1', 'R1', 'L0', 'R0', 'C', 'R2', 'G1', 'G0')


def _yblock(sn, L, R1, C, R2, G):
    return 1 / (R1 + sn * L) + (1 / (R2 + 1 / (sn * C)) if C > 0 else 0.0) + G


def foster_z(sn, X):
    """(Z₁, Z₀) per unit of the blocks X (rows L1, R1, L0, R0, C, R2, G1, G0, per unit at f₀) at the normalized frequencies sn."""
    sn = np.asarray(sn, complex)
    Z1, Z0 = np.zeros(len(sn), complex), np.zeros(len(sn), complex)
    for L1, R1, L0, R0, C, R2, G1, G0 in np.asarray(X, float).reshape(-1, 8):
        Z1 += 1 / _yblock(sn, L1, R1, C, R2, G1)
        Z0 += 1 / _yblock(sn, L0, R0, C, R2, G0)
    return Z1, Z0


def _pr_blocks(sn, Z, W, a):
    """Blocks (L, R′, C, R″ = 0, G) of one sequence from the complex poles a (Im > 0) of a vector fit: the residues again by
    non-negative least squares, each pair as (b₁s + b₀)/(s² + 2σs + ω₀²) with b₀ = u, b₁ = (u + v)/(2σ), u, v ≥ 0: so every
    term is positive real (b₁ ≥ 0, 0 ≤ b₀ ≤ 2σ·b₁) and is exactly the block C = 1/b₁, G = (2σ − b₀/b₁)/b₁,
    L = 1/(ω₀²C − G·b₀/b₁), R′ = L·b₀/b₁."""
    from scipy.optimize import nnls
    cols, pr = [], []
    for p in a:
        if p.imag > 1e-12 * abs(p) and p.real < 0:
            sig, w02 = -p.real, abs(p) ** 2
            D = sn * sn + 2 * sig * sn + w02
            cols += [(sn / (2 * sig) + 1) / D, (sn / (2 * sig)) / D]
            pr.append(p)
    if not pr:
        return []
    A = np.array(cols).T * W[:, None]
    b = Z * W
    x = nnls(np.vstack([A.real, A.imag]), np.r_[b.real, b.imag], maxiter=50 * A.shape[1])[0]
    out = []
    for k, p in enumerate(pr):
        u, v = x[2 * k], x[2 * k + 1]
        sig, w02 = -p.real, abs(p) ** 2
        b1 = (u + v) / (2 * sig)
        if b1 <= 0:
            continue
        C = 1 / b1
        al = u / b1
        G = (2 * sig - al) / b1
        L = 1 / (w02 * C - G * al)
        out.append([L, al * L, C, 0.0, G])
    return out


def _refine(sn, Zt, W, P, floor, hi, pure, nfev):
    """Least squares on the logarithms of the elements of the blocks of one sequence (rows L, R′, C, R″, G), analytic Jacobian."""
    from scipy.optimize import least_squares
    P = np.maximum(np.asarray(P, float).reshape(-1, 5), floor)
    m = 4 if pure else 5
    lo = np.log(floor)
    th0 = np.clip(np.log(P[:, :m]).ravel(), lo + 1e-9, hi - 1e-9)

    def parts(th):
        Q_ = np.exp(th).reshape(-1, m)
        L, R1, C, R2 = Q_[:, 0], Q_[:, 1], Q_[:, 2], Q_[:, 3]
        G = Q_[:, 4] if m == 5 else np.zeros(len(Q_))
        s = sn[:, None]
        zl = R1 + s * L
        zc = R2 + 1 / (s * C)
        Zb = 1 / (1 / zl + 1 / zc + G)
        return Q_, L, R1, C, R2, G, s, zl, zc, Zb

    def res(th):
        Zb = parts(th)[-1]
        e = W * (Zb.sum(axis=1) - Zt)
        return np.r_[e.real, e.imag]

    def jac(th):
        Q_, L, R1, C, R2, G, s, zl, zc, Zb = parts(th)
        k2 = -Zb * Zb * W[:, None]
        cols = [k2 * (-s * L / zl ** 2), k2 * (-R1 / zl ** 2), k2 * ((1 / (s * C)) / zc ** 2), k2 * (-R2 / zc ** 2)]
        if m == 5:
            cols.append(k2 * G)
        J = np.stack(cols, axis=2).reshape(len(sn), -1)
        return np.vstack([J.real, J.imag])
    r = least_squares(res, th0, jac=jac, bounds=(lo, hi), method='trf', x_scale='jac', max_nfev=nfev, ftol=1e-12, xtol=1e-12)
    Q_ = np.exp(r.x).reshape(-1, m)
    return np.c_[Q_, np.zeros(len(Q_))] if m == 4 else Q_


def _fit_one(sn, Z, W, f, f0, kmax, tol, pure, floor, hi):
    """The blocks of one sequence: vector fitting with 2k complex poles, the positive-real residues, then the refinement; k from
    the number of peaks of |Z| up to kmax, the best kept (or the first within tol)."""
    from . import wideband as WB
    m = np.abs(Z)
    peaks = sum(1 for i in range(1, len(m) - 1) if m[i] > m[i - 1] and m[i] >= m[i + 1])
    xlo, xhi = max(f.min() / f0, 0.5), f.max() / f0
    best = None
    for k in range(max(2, min(peaks, kmax)), kmax + 1):
        bb = np.logspace(np.log10(xlo), np.log10(xhi), k)
        poles = np.array([v for x in bb for v in (complex(-x / 50, x), complex(-x / 50, -x))])
        a = WB.vfit_relaxed(sn, Z, poles, weight=W, d=True, iters=30)[0]
        P = _pr_blocks(sn, Z, W, a)
        if not P:
            continue
        P = _refine(sn, Z, W, P, floor, hi, pure, 400)
        Zf = sum(1 / _yblock(sn, *row) for row in P)
        e = np.abs(Zf - Z) / np.abs(Z)
        rms = float(np.sqrt(np.mean(e ** 2)))
        if best is None or rms < best[1] - 1e-4:
            best = (P, rms)
        if rms <= tol:
            break
    if best is None:
        raise EquivalentError('the Foster fit found no pair of complex poles in the scan')
    return best[0]


def foster(f, Z1, Z0, f0, kmax=FOSTER_KMAX, tol=FOSTER_TOL, pure=False, w0=FOSTER_W0, ratio=FOSTER_RATIO, nfev=600):
    """5.0.7 (THEORY §8ΩΙ): the blocks of Fig. 15a for one port from its scan (f in Hz, Z₁ and Z₀ per unit, f₀ Hz). Each
    sequence is fitted alone (vector fitting, the residues as positive-real terms, each term one block, least squares on
    the logarithms of the elements), then both together: a block of one sequence takes in the other an inductance 1/ratio
    of its own (the coupled RL branch needs L₁, L₀ > 0) and the joint least squares (L₀/L₁ kept within 1/ratio … ratio) fits
    Z₁ and Z₀ at once. The error is weighted by 1/|Z| (relative), w0 times at f₀. Every element ≥ 0: the circuit is passive.
    Returns {'X' (rows L1, R1, L0, R0, C, R2, G1, G0 per unit at f₀), 'Z1fit', 'Z0fit' (over f), 'err1', 'err0' (rms, max
    and at f₀ of |ΔZ|/|Z|), 'pure', 'k'}."""
    from scipy.optimize import least_squares
    f = np.asarray(f, float)
    Z1, Z0 = np.asarray(Z1, complex), np.asarray(Z0, complex)
    sn = 1j * f / f0
    i0 = int(np.argmin(np.abs(f - f0)))
    W1, W0 = 1 / np.abs(Z1), 1 / np.abs(Z0)
    W1[i0] *= w0
    W0[i0] *= w0
    scale = float(np.median(np.abs(Z1)))
    floor, hi = 1e-9 * scale, float(np.log(1e9 * scale))
    P1 = _fit_one(sn, Z1, W1, f, f0, kmax, tol, pure, floor, hi)
    P0 = _fit_one(sn, Z0, W0, f, f0, kmax, tol, pure, floor, hi)
    rows = [[L, R1, L / ratio, floor, C, R2, G, (G * ratio if not pure else 0.0)] for L, R1, C, R2, G in P1]
    rows += [[L / ratio, floor, L, R1, C, R2, (G * ratio if not pure else 0.0), G] for L, R1, C, R2, G in P0]
    X = np.maximum(np.array(rows, float), floor)
    nb = len(X)
    lo, lr = np.log(floor), np.log(ratio)
    # parameters per block: log L1, log(L0/L1), log R1, log R0, log C, log R2 [, log G1, log G0]
    m = 6 if pure else 8
    th0 = np.c_[np.log(X[:, 0]), np.log(X[:, 2] / X[:, 0]), np.log(X[:, [1, 3, 4, 5]])] if pure else \
        np.c_[np.log(X[:, 0]), np.log(X[:, 2] / X[:, 0]), np.log(X[:, [1, 3, 4, 5, 6, 7]])]
    lb = np.full((nb, m), lo)
    ub = np.full((nb, m), hi)
    lb[:, 1], ub[:, 1] = -lr, lr
    th0 = np.clip(th0, lb + 1e-9, ub - 1e-9).ravel()

    def parts(th):
        T = th.reshape(nb, m)
        L1 = np.exp(T[:, 0])
        L0 = L1 * np.exp(T[:, 1])
        R1, R0, C, R2 = (np.exp(T[:, j]) for j in (2, 3, 4, 5))
        G1, G0 = (np.exp(T[:, 6]), np.exp(T[:, 7])) if m == 8 else (np.zeros(nb), np.zeros(nb))
        s = sn[:, None]
        zc = R2 + 1 / (s * C)
        z1, z0 = R1 + s * L1, R0 + s * L0
        Zb1 = 1 / (1 / z1 + 1 / zc + G1)
        Zb0 = 1 / (1 / z0 + 1 / zc + G0)
        return L1, L0, R1, R0, C, R2, G1, G0, s, zc, z1, z0, Zb1, Zb0

    def res(th):
        Zb1, Zb0 = parts(th)[-2:]
        e1, e0 = W1 * (Zb1.sum(axis=1) - Z1), W0 * (Zb0.sum(axis=1) - Z0)
        return np.r_[e1.real, e1.imag, e0.real, e0.imag]

    def jac(th):
        L1, L0, R1, R0, C, R2, G1, G0, s, zc, z1, z0, Zb1, Zb0 = parts(th)
        a1, a0 = -Zb1 * Zb1 * W1[:, None], -Zb0 * Zb0 * W0[:, None]
        zero = np.zeros_like(a1)
        dl1, dl0 = -s * L1 / z1 ** 2, -s * L0 / z0 ** 2
        dc, dr2 = (1 / (s * C)) / zc ** 2, -R2 / zc ** 2
        c1 = [a1 * dl1, zero, a1 * (-R1 / z1 ** 2), zero, a1 * dc, a1 * dr2]
        c0 = [a0 * dl0, a0 * dl0, zero, a0 * (-R0 / z0 ** 2), a0 * dc, a0 * dr2]
        if m == 8:
            c1 += [a1 * G1, zero]
            c0 += [zero, a0 * G0]
        J1 = np.stack(c1, axis=2).reshape(len(sn), -1)
        J0 = np.stack(c0, axis=2).reshape(len(sn), -1)
        return np.vstack([J1.real, J1.imag, J0.real, J0.imag])
    r = least_squares(res, th0, jac=jac, bounds=(lb.ravel(), ub.ravel()), method='trf', x_scale='jac', max_nfev=nfev, ftol=1e-12, xtol=1e-12)
    L1, L0, R1, R0, C, R2, G1, G0 = parts(r.x)[:8]
    X = np.c_[L1, R1, L0, R0, C, R2, G1, G0]
    # what is negligible goes: R′, R″ below 10⁻⁶ of the scale, C and G below 10⁻⁶ of 1/scale (an open branch); a parallel R_p in
    # one sequence alone keeps 10⁻⁶ of 1/scale in the other (the coupled resistance needs both)
    X[:, [1, 3, 5]] = np.where(X[:, [1, 3, 5]] < 1e-6 * scale, 0.0, X[:, [1, 3, 5]])
    X[:, [4, 6, 7]] = np.where(X[:, [4, 6, 7]] < 1e-6 / scale, 0.0, X[:, [4, 6, 7]])
    one = (X[:, 6] > 0) != (X[:, 7] > 0)
    X[one, 6:8] = np.maximum(X[one, 6:8], 1e-6 / scale)
    Zf1, Zf0 = foster_z(sn, X)

    def err(Zf, Z):
        e = np.abs(Zf - Z) / np.abs(Z)
        return {'rms': float(np.sqrt(np.mean(e ** 2))), 'max': float(e.max()), 'f0': float(e[i0]), 'fmax': float(f[int(np.argmax(e))])}
    return {'X': X, 'Z1fit': Zf1, 'Z0fit': Zf0, 'err1': err(Zf1, Z1), 'err0': err(Zf0, Z0), 'pure': bool(pure), 'k': [len(P1), len(P0)],
            'f': f, 'f0': float(f0)}


# ---------------------------------------------------------------- 5.0.9: the FDNE of many ports
# The paper on multi-port frequency dependent network equivalents for the EMTP (1993): the admittance matrix seen from the N
# boundary buses, in the positive and in the zero sequence, as a π (the branch from bus i to earth Σ_j Y_ij, between i and j
# −Y_ij, its (2) and (3)), every branch a module of parallel branches (Fig. 1: one RC, one RL and RLC in series), negative
# branches allowed when R, L, C of each have one sign. Here every element of both matrices has the same poles (the common poles
# of the paper on the synthesis of one-port and multi-port equivalents, 1986, and of the paper with the computer code for
# admittance matrices, 2002), from a vector fit of all of them at once, and the terms of a pair of poles are two branches:
#     kind 2: s/D (L, R, C in series, the branch of Fig. 1),  kind 3: (s + 2σ)/D (L in series with C ∥ G),  D = s² + 2σs + ω²,
# so any (b₁s + b₀)/D of the fit is α·s/D + β·(s + 2σ)/D with α = b₁ − b₀/(2σ), β = b₀/(2σ), each a branch of one sign; a real
# pole is an RL branch (kind 1: 1/(s + a)) and the constant a resistor (kind 0). pure: the module of Fig. 1 only (kind 2 for each
# pair, one RL, one RC: kind 4: s/(s + a)), the poles refined by least squares with the coefficients solved inside.
# Every function of the basis has Re ≥ 0 on the imaginary axis, so the model is passive when the coefficient matrix of every term
# (in each sequence) is positive semidefinite: passive=True moves the negative eigenvalues of these matrices to zero (our simple
# form of the perturbation of the eigenvalues of the residue matrices of the paper of 2008); the check is eig(Re Y) on a band ten
# times wider than the scan on each side (the criterion of that paper).
# Normalized frequency sn = s/ω₀ and per unit admittances, as the Foster circuit.
FDNE_TOL, FDNE_MMAX, FDNE_W0 = 0.03, 12, 30.0
FDNE_KINDS = ('R', 'RL', 'RLC', 'L+C∥G', 'RC')


def fdne_basis(sn, terms):
    """The functions of the terms (rows kind, p, q) at the normalized frequencies sn: columns len(sn) × len(terms)."""
    sn = np.asarray(sn, complex)
    cols = []
    for k, p, q in terms:
        k = int(k)
        if k == 0:
            cols.append(np.ones(len(sn), complex))
        elif k == 1:
            cols.append(1 / (sn + p))
        elif k == 2:
            cols.append(sn / (sn * sn + 2 * p * sn + q))
        elif k == 3:
            cols.append((sn + 2 * p) / (sn * sn + 2 * p * sn + q))
        else:
            cols.append(sn / (sn + p))
    return np.array(cols).T


def _fd_coef(A, F, W):
    """Real coefficients of the basis A for every column of F, weighted least squares column by column."""
    X = np.zeros((A.shape[1], F.shape[1]))
    for c in range(F.shape[1]):
        Aw = A * W[:, c:c + 1]
        b = F[:, c] * W[:, c]
        X[:, c] = np.linalg.lstsq(np.vstack([Aw.real, Aw.imag]), np.r_[b.real, b.imag], rcond=None)[0]
    return X


def _fd_mats(x, n):
    """The symmetric n × n matrix of one row of upper-triangle coefficients."""
    iu = np.triu_indices(n)
    M = np.zeros((n, n))
    M[iu] = x
    M[(iu[1], iu[0])] = x
    return M


def fdne_y(sn, F):
    """(Y₁, Y₀) per unit (len(sn) × N × N) of the fit F (fdne) at the normalized frequencies sn."""
    A = fdne_basis(sn, F['terms'])
    n, m = F['N'], F['N'] * (F['N'] + 1) // 2
    out = []
    for q in (0, 1):
        cols = A @ F['X'][:, q * m:(q + 1) * m]
        Y = np.zeros((len(cols), n, n), complex)
        iu = np.triu_indices(n)
        Y[:, iu[0], iu[1]] = cols
        Y[:, iu[1], iu[0]] = cols
        out.append(Y)
    return out[0], out[1]


def _fd_reG(terms, X, n, q, sn):
    """Re Y of the sequence q (0: positive, 1: zero) at sn: len(sn) × n × n."""
    m = n * (n + 1) // 2
    A = fdne_basis(sn, terms).real
    cols = A @ X[:, q * m:(q + 1) * m]
    G = np.zeros((len(cols), n, n))
    iu = np.triu_indices(n)
    G[:, iu[0], iu[1]] = cols
    G[:, iu[1], iu[0]] = cols
    return G


def _fd_passive(terms, X, n, sn, F, W, fp, f0, iters=8):
    """The passivity of the fit by perturbing the eigenvalues of the coefficient matrix of every term (the idea of the paper of
    2008 on fast passivity enforcement, with the same free variables): in each sequence, the smallest change of the weighted
    responses at the frequencies of the fit (‖J·δ‖²) such that at the minimum of every band where eig(Re Y) < 0 (and at f → ∞)
    each negative eigenvalue becomes ≥ ε (10⁻⁶ of the largest), to the first order; again until no band is left. Returns
    (X, how many constraints were used)."""
    from scipy.optimize import minimize
    X = X.copy()
    m = n * (n + 1) // 2
    iu = np.triu_indices(n)
    A = fdne_basis(sn, terms)
    Ap = fdne_basis(1j * fp / f0, terms).real
    inf = np.array([1.0 if t[0] in (0, 4) else 0.0 for t in terms])         # Re of every function at f → ∞
    used = 0
    for q in (0, 1):
        for _ in range(iters):
            Bs = [_fd_mats(X[t, q * m:(q + 1) * m], n) for t in range(len(terms))]
            eig = [np.linalg.eigh(B) for B in Bs]
            Gp = np.einsum('ft,tij->fij', Ap, np.array(Bs))
            lam = np.linalg.eigvalsh(Gp)
            scale = max(np.abs(lam).max(), 1e-300)
            eps = 1e-6 * scale
            bad = lam.min(axis=1) < 0
            rows = []                                                   # (Re of the basis, the eigenvector of the violation)
            k = 0
            while k < len(fp):
                if bad[k]:
                    j = k
                    while j + 1 < len(fp) and bad[j + 1]:
                        j += 1
                    kk = k + int(np.argmin(lam[k:j + 1, 0]))
                    rows.append(Ap[kk])
                    k = j + 1
                else:
                    k += 1
            Ginf = np.einsum('t,tij->ij', inf, np.array(Bs))
            if np.linalg.eigvalsh(Ginf).min() < 0:
                rows.append(inf)
            if not rows:
                break
            nv = len(terms) * n
            # J: the weighted change of the responses (upper triangle of sequence q) per unit change of each eigenvalue
            J = np.zeros((len(sn), m, nv), complex)
            for t, (lt, V) in enumerate(eig):
                for i in range(n):
                    vv = np.outer(V[:, i], V[:, i])[iu]
                    J[:, :, t * n + i] = A[:, t:t + 1] * vv[None, :]
            J = J * W[:, q * m:(q + 1) * m, None]
            J = np.vstack([J.real.reshape(-1, nv), J.imag.reshape(-1, nv)])
            H = J.T @ J
            H += 1e-12 * np.trace(H) / nv * np.eye(nv)
            cons_A, cons_b = [], []
            for a_ in rows:
                G = np.einsum('t,tij->ij', a_, np.array(Bs))
                mu, U = np.linalg.eigh(G)
                for jj in range(n):
                    if mu[jj] < eps:
                        c = np.zeros(nv)
                        for t, (lt, V) in enumerate(eig):
                            c[t * n:(t + 1) * n] = a_[t] * (U[:, jj] @ V) ** 2
                        cons_A.append(c)
                        cons_b.append(eps - mu[jj])
            used += len(cons_A)
            CA, Cb = np.array(cons_A), np.array(cons_b)
            r = minimize(lambda d: d @ H @ d, np.zeros(nv), jac=lambda d: 2 * H @ d, method='SLSQP',
                         constraints=[{'type': 'ineq', 'fun': lambda d: CA @ d - Cb, 'jac': lambda d: CA}], options={'maxiter': 500, 'ftol': 1e-14})
            d = r.x
            for t, (lt, V) in enumerate(eig):
                B = V @ np.diag(lt + d[t * n:(t + 1) * n]) @ V.T
                X[t, q * m:(q + 1) * m] = B[iu]
    return X, used


def fdne(f, Y1, Y0, f0, tol=FDNE_TOL, mmax=FDNE_MMAX, w0=FDNE_W0, pure=False, passive=False, nfev=300):
    """5.0.9 (THEORY §8ΩΚ): the FDNE of N ports from the scan (f in Hz, Y₁ and Y₀ per unit, len(f) × N × N, f₀ Hz; see above).
    All the elements of the upper triangles of Y₁ and Y₀ are fitted with the same poles; the error of every element is weighted by
    ‖Z_:,i‖·‖Z_j,:‖/‖Z‖ (Z = Y⁻¹: for one port 1/|Y|, the relative error of Z), w0 times at f₀; the number of pairs of poles goes up
    from the peaks of the scan to mmax and stops when the driving-point impedances Z_kk are within tol rms in both sequences.
    Returns {'terms' (rows kind, p, q), 'X' (len(terms) × 2·N(N+1)/2: the coefficients of the upper triangle of Y₁ then of Y₀),
    'N', 'err1', 'err0' (of Z_kk over f: rms, max, at f₀, and the frequency of the max; and 'Y' the rms of ‖ΔY‖/‖Y‖), 'lam1',
    'lam0' (the smallest eigenvalue of Re Y over the wide band, over the largest), 'is_passive', 'passive' (enforced), 'moved'
    (how many eigenvalues were moved), 'pure', 'k' (pairs of poles), 'f', 'f0'}."""
    from scipy.optimize import least_squares
    from . import wideband as WB
    f = np.asarray(f, float)
    Y1, Y0 = np.asarray(Y1, complex), np.asarray(Y0, complex)
    n = Y1.shape[1]
    iu = np.triu_indices(n)
    m = len(iu[0])
    sn = 1j * f / f0
    F = np.hstack([Y1[:, iu[0], iu[1]], Y0[:, iu[0], iu[1]]])
    Zs = (np.linalg.inv(Y1), np.linalg.inv(Y0))
    W = np.zeros(F.shape)
    for q, Z in enumerate(Zs):
        nz = np.linalg.norm(Z, axis=(1, 2))
        for c, (i, j) in enumerate(zip(*iu)):
            W[:, q * m + c] = np.linalg.norm(Z[:, :, i], axis=1) * np.linalg.norm(Z[:, j, :], axis=1) / nz
    i0 = int(np.argmin(np.abs(f - f0)))
    W[i0] *= w0
    xlo, xhi = max(f.min() / f0, 0.05), f.max() / f0

    def errs(X, terms):
        Fd = {'terms': terms, 'X': X, 'N': n}
        out = []
        for Yf, Y, Z in zip(fdne_y(sn, Fd), (Y1, Y0), Zs):
            try:
                Zf = np.linalg.inv(Yf)
            except np.linalg.LinAlgError:
                return None
            d = np.abs(np.diagonal(Zf, axis1=1, axis2=2) - np.diagonal(Z, axis1=1, axis2=2)) / np.abs(np.diagonal(Z, axis1=1, axis2=2))
            dy = np.linalg.norm(Yf - Y, axis=(1, 2)) / np.linalg.norm(Y, axis=(1, 2))
            k = np.unravel_index(int(np.argmax(d)), d.shape)
            out.append({'rms': float(np.sqrt(np.mean(d ** 2, axis=0)).max()), 'max': float(d.max()), 'f0': float(d[i0].max()),
                        'fmax': float(f[k[0]]), 'Y': float(np.sqrt(np.mean(dy ** 2)))})
        return out

    m1 = np.abs(np.diagonal(Zs[0], axis1=1, axis2=2))
    peaks = max(sum(1 for i in range(1, len(f) - 1) if m1[i, k] > m1[i - 1, k] and m1[i, k] >= m1[i + 1, k]) for k in range(n))
    best = None
    for M in range(max(2, peaks), mmax + 1):
        bb = np.logspace(np.log10(xlo), np.log10(xhi), M)
        start = [v for x in bb for v in (complex(-x / 50, x), complex(-x / 50, -x))] + [complex(-xlo, 0), complex(-2 * xhi, 0)]
        a = WB.vfit_relaxed(sn, F, np.array(start), weight=W, d=True, iters=30)[0]
        pairs = sorted((float(-p.real), float(abs(p) ** 2)) for p in a if p.imag > 0)
        reals = sorted(float(-p.real) for p in a if p.imag == 0)
        if pure:
            a0 = reals[0] if reals else xlo
            ai = reals[-1] if len(reals) > 1 else 5 * xhi
            th0 = np.log(np.r_[np.array(pairs, float).ravel(), a0, ai]) if pairs else np.log([a0, ai])
            npair = len(pairs)

            def terms_of(th):
                e = np.exp(th)
                return [(2, e[2 * k], e[2 * k + 1]) for k in range(npair)] + [(1, e[-2], 0.0), (4, e[-1], 0.0)]

            def res(th):
                A = fdne_basis(sn, terms_of(th))
                R = (A @ _fd_coef(A, F, W) - F) * W
                return np.r_[R.real.ravel(), R.imag.ravel()]
            lb, ub = np.full(len(th0), np.log(1e-9)), np.full(len(th0), np.log((50 * xhi) ** 2))
            r = least_squares(res, np.clip(th0, lb + 1e-9, ub - 1e-9), bounds=(lb, ub), method='trf', x_scale='jac', max_nfev=nfev)
            terms = terms_of(r.x)
        else:
            terms = [(0, 0.0, 0.0)] + [(1, a_, 0.0) for a_ in reals] + [t for sg, w2 in pairs for t in ((2, sg, w2), (3, sg, w2))]
        A = fdne_basis(sn, terms)
        X = _fd_coef(A, F, W)
        e = errs(X, terms)
        if e is None:
            continue
        score = max(e[0]['rms'], e[1]['rms'])
        if best is None or score < best[2] - 1e-4:
            best = (terms, X, score, len(pairs))
        if score <= tol:
            break
    if best is None:
        raise EquivalentError('the FDNE fit failed')
    terms, X, _, npair = best
    # the check: eig(Re Y) over 2000 frequencies from fmin/10 to 10·fmax, and at the poles
    fp = np.logspace(np.log10(f.min() / 10), np.log10(f.max() * 10), 2000)
    fp = np.unique(np.r_[fp, [np.sqrt(t[2]) * f0 for t in terms if t[0] in (2, 3)]])
    moved = 0
    if passive:
        X, moved = _fd_passive(terms, X, n, sn, F, W, fp, f0)
    lams = []
    inf = np.array([1.0 if t[0] in (0, 4) else 0.0 for t in terms])
    for q, Yp in enumerate(fdne_y(1j * fp / f0, {'terms': terms, 'X': X, 'N': n})):
        Ginf = _fd_mats(inf @ X[:, q * m:(q + 1) * m], n)                  # and at f → ∞
        ev = np.r_[np.linalg.eigvalsh(Yp.real).ravel(), np.linalg.eigvalsh(Ginf)]
        lams.append(float(ev.min() / max(np.abs(ev).max(), 1e-300)))
    e = errs(X, terms)
    return {'terms': [tuple(float(v) for v in t) for t in terms], 'X': X, 'N': n, 'err1': e[0], 'err0': e[1], 'lam1': lams[0], 'lam0': lams[1],
            'is_passive': bool(min(lams) >= -1e-9), 'passive': bool(passive), 'moved': moved, 'pure': bool(pure), 'k': npair,
            'f': f, 'f0': float(f0)}


def emt_ports(net, boundary, internal=None, lf=None, machines=None, fig='50', tol=1e-10, fmin=SCAN_FMIN, fmax=SCAN_FMAX, n=SCAN_N,
              line='pi', pure=False, passive=False):
    """5.0.4: the equivalent of the network beyond the boundary for EMT (CIGRE TB 39, Fig. 15; see the module).
    fig: '50' (sources behind the Thevenin impedances of both sequences: exact at the fundamental), '15b' or '15c'; 5.0.7:
    '15a' (one boundary bus: the Foster circuit fitted to the scan from fmin to fmax Hz, n frequencies, lines as line; pure:
    the blocks of the figure without R_p; see foster).
    machines: the GEN3 data of the generators (as for Network.to_emt). lf: the load flow of the full network (load_flow when None).
    Returns {'internal', 'boundary', 'external', 'Un' (V per port), 'Z1', 'Z0' (pu, N × N: of the short-circuit impedance for
    15b and 15c), 'E' (pu, per port), 'I' (pu, the current from the equivalent into each boundary bus in the base case), 'Rs'
    (Ω per port or 0), 'C' (F per port), 'Sk' (VA per port: |V|²/|Z₁,kk|, the contribution of the external network), 'fig',
    'notes'} and for '15a' 'foster' (the blocks in H, Ω, F, the errors and the scan; see _foster_out)."""
    if fig not in FIGS + (FOSTER, FDNE):
        raise EquivalentError(f'fig: one of {", ".join(FIGS + (FOSTER, FDNE))}')
    if getattr(net, 'dc_buses', None):
        raise EquivalentError('networks with DC buses and converters are not reduced yet')
    I, B, E = split(net, boundary, internal)
    if lf is None:
        lf = net.load_flow(tol=tol)
    if not lf.get('converged', True):
        raise EquivalentError('the load flow of the full network did not converge')
    names, idx, Y1 = _ext_y(net, lf, E, machines, 1)
    iB, iE = [idx[b] for b in B], [idx[b] for b in E]
    V = np.array([_v(lf, b) for b in names], complex)
    VB = V[iB]
    JE = Y1[np.ix_(iE, iE)] @ V[iE] + Y1[np.ix_(iE, iB)] @ VB          # the sources behind the machines' admittances
    Ym = _kron(Y1, iB, iE)
    Im = -(Y1[np.ix_(iB, iE)] @ np.linalg.solve(Y1[np.ix_(iE, iE)], JE))
    IB = Im - Ym @ VB                                                  # into the boundary buses, as in the full solution
    nB = len(B)
    Un = [float(net.buses[b]['Un']) for b in B]
    w = 2 * np.pi * net.f
    notes = []
    Rs, C = np.zeros(nB), np.zeros(nB)
    charging = fig in ('50', FOSTER, FDNE)                           # 15a, fdne: the matrices at the fundamental as fig 50 (the scan at f₀)
    if not charging:
        _, _, Ysc = _ext_y(net, lf, E, machines, 1, charging=False)
        Y1eq = _kron(Ysc, iB, iE)
        # R_s: the surge impedance of the external lines at each boundary bus (lossless, √(x/b)), in parallel
        raw = {}
        net._lf_model(raw)
        Bs = {idx[b]: k for k, b in enumerate(B)}
        Es_i = set(iE)
        gs = np.zeros(nB)
        H = -np.linalg.solve(Ysc[np.ix_(iE, iE)], Ysc[np.ix_(iE, iB)])      # V_E = H·V_B without sources
        Wt = np.abs(H)
        Wt = Wt / np.maximum(Wt.sum(axis=1, keepdims=True), 1e-300)
        posE = {i: r for r, i in enumerate(iE)}
        cpu = np.zeros(nB)                                             # the charging referred to each port, pu of susceptance
        for name, i, j, y, bsh, ta, _ in raw['branches']:
            if not (i in Es_i or j in Es_i) or bsh <= 0:
                continue
            for a, other in ((i, j), (j, i)):
                if a in Bs:
                    cpu[Bs[a]] += bsh / 2
                    if other in Es_i and abs(abs(ta) - 1) < 1e-12:
                        gs[Bs[a]] += 1 / np.sqrt(abs((1 / y).imag) / bsh)
                else:
                    cpu += bsh / 2 * Wt[posE[a]]
        for k, b in enumerate(B):
            zb = net._zb(b)
            if gs[k] > 0:
                Rs[k] = zb / gs[k]
            else:
                notes.append(f'{b}: no external line with charging reaches it: no R_s there')
            C[k] = cpu[k] / (w * zb)
        if fig == '15b':
            # the branch R_s + 1/(jωC) at each bus, per unit
            ys = np.array([(1 / ((Rs[k] / net._zb(B[k])) + 1 / (1j * w * C[k] * net._zb(B[k])))) if (Rs[k] > 0 and C[k] > 0) else 0.0 for k in range(nB)], complex)
            Z1 = np.linalg.inv(Y1eq)
            Eb = VB + Z1 @ (IB + ys * VB)
        else:
            gp = np.array([(net._zb(B[k]) / Rs[k]) if Rs[k] > 0 else 0.0 for k in range(nB)])
            Z1 = np.linalg.inv(Y1eq)
            Eb = VB + np.linalg.solve(Y1eq + np.diag(gp), IB)
    else:
        Z1 = np.linalg.inv(Ym)
        Eb = VB + Z1 @ IB
    fo = None
    if fig == FOSTER:
        if nB != 1:
            raise EquivalentError(f'Fig. 15a is for one boundary bus ({nB} here): choose the area so that one bus separates it, or a figure of many ports (50, 15b, 15c)')
        S = scan(net, B, I, lf=lf, machines=machines, fmin=fmin, fmax=fmax, n=n, line=line)
        F = foster(S['f'], S['Z1'][:, 0, 0], S['Z0'][:, 0, 0], net.f, pure=pure)
        z1f = foster_z(np.array([1j]), F['X'])[0][0]
        Eb = VB + z1f * IB                                             # the base case exact with the circuit as fitted
        fo = _foster_out(F, S, net._zb(B[0]), w)
        if max(F['err1']['rms'], F['err0']['rms']) > 0.1:
            notes.append(f'the Foster circuit misses the scan by {100 * F["err1"]["rms"]:.0f} % (positive) and {100 * F["err0"]["rms"]:.0f} % (zero sequence) rms')
    fd = None
    if fig == FDNE:
        S = scan(net, B, I, lf=lf, machines=machines, fmin=fmin, fmax=fmax, n=n, line=line)
        F = fdne(S['f'], np.linalg.inv(S['Z1']), np.linalg.inv(S['Z0']), net.f, pure=pure, passive=passive)
        Y1f = fdne_y(np.array([1j]), F)[0][0]
        ysh = Y1f.sum(axis=1)                    # the branch of each port to its source: the row sum at f₀, positive sequence
        if np.abs(ysh).min() < 1e-9 * np.abs(Y1f).max():
            raise EquivalentError('FDNE: a boundary bus without a path to earth beyond it at the fundamental: no source can stand behind it')
        Eb = (IB + Y1f @ VB) / ysh               # the base case exact with the network as fitted
        fd = _fdne_out(F, S, [net._zb(b) for b in B])
        if not F['is_passive']:
            notes.append(f'the FDNE is not passive (eig(Re Y) down to {min(F["lam1"], F["lam0"]):.1e} of the largest): passive=True')
        if max(F['err1']['rms'], F['err0']['rms']) > 0.1:
            notes.append(f'the FDNE misses the scan by {100 * F["err1"]["rms"]:.0f} % (positive) and {100 * F["err0"]["rms"]:.0f} % (zero sequence) rms')
    _, _, Y0 = _ext_y(net, lf, E, machines, 0, charging=charging)
    Y0eq = _kron(Y0, iB, iE)
    if np.abs(np.linalg.eigvals(Y0eq)).min() < 1e-6:
        notes.append('a boundary bus without a zero-sequence path beyond it: 10⁻⁶ pu to earth there')
        Y0eq = Y0eq + 1e-6 * np.eye(nB)
    Z0 = np.linalg.inv(Y0eq)
    for nm, Z in (('Z1', Z1), ('Z0', Z0)):
        if nB > 1 and np.max(np.abs(Z - Z.T)) > 1e-9 * np.max(np.abs(Z)):
            raise EquivalentError(f'{nm} is not symmetric: phase shifters beyond the boundary')
        if np.min(np.linalg.eigvalsh((Z.imag + Z.imag.T) / 2)) <= 0:
            raise EquivalentError(f'the reactance {nm} at the boundary is not positive definite: no inductive EMT equivalent')
    Sk = [float(abs(VB[k]) ** 2 / abs(Z1[k, k]) * net.S_base) for k in range(nB)]
    out = {'internal': I, 'boundary': B, 'external': E, 'Un': Un, 'Z1': (Z1 + Z1.T) / 2, 'Z0': (Z0 + Z0.T) / 2, 'E': Eb, 'I': IB,
           'V': VB, 'Rs': Rs.tolist(), 'C': C.tolist(), 'Sk': Sk, 'fig': fig, 'notes': notes}
    if fo is not None:
        out['foster'] = fo
    if fd is not None:
        out['fdne'] = fd
    return out


def _fdne_out(F, S, zb):
    """The FDNE for EQV3 and the page: 'rows' (the text of the parameter FD: kind, sequence (1, 0), p, q and the upper triangle
    of the coefficients, per unit on s/ω₀; terms that are zero in a sequence left out), the errors and the check, and the
    driving-point impedances |Z_kk| of the scan and of the fit (Ω) per port."""
    n, m = F['N'], F['N'] * (F['N'] + 1) // 2
    rows = []
    for q, sq in ((0, 1), (1, 0)):
        for t, (k, p, qq) in enumerate(F['terms']):
            c = F['X'][t, q * m:(q + 1) * m]
            if np.any(c != 0):
                rows.append([k, sq, p, qq] + [float(v) for v in c])
    f = S['f']
    sn = 1j * f / F['f0']
    Y1f, Y0f = fdne_y(sn, F)
    Z1f, Z0f = np.linalg.inv(Y1f), np.linalg.inv(Y0f)
    r = lambda a: [float(v) for v in a]
    ports = []
    for k in range(n):
        ports.append({'Z1': r(np.abs(S['Z1'][:, k, k]) * zb[k]), 'Z1fit': r(np.abs(Z1f[:, k, k]) * zb[k]),
                      'Z0': r(np.abs(S['Z0'][:, k, k]) * zb[k]), 'Z0fit': r(np.abs(Z0f[:, k, k]) * zb[k])})
    return {'rows': '; '.join(', '.join(repr(float(v)) for v in row) for row in rows), 'n_rows': len(rows), 'k': F['k'],
            'terms': len(F['terms']), 'err1': F['err1'], 'err0': F['err0'], 'lam1': F['lam1'], 'lam0': F['lam0'],
            'is_passive': F['is_passive'], 'passive': F['passive'], 'moved': F['moved'], 'pure': F['pure'], 'line': S['line'],
            'f': r(f), 'ports': ports, 'zb': [float(z) for z in zb]}


def _foster_out(F, S, zb, w):
    """The blocks of Fig. 15a in H, Ω, F (rows L1, R1, L0, R0, C, R2, Rp1, Rp0; R_p and C 0: no such branch), the errors and the
    scan with the fit (magnitudes in Ω, angles in degrees) for the page."""
    X = F['X']
    blocks = []
    for L1, R1, L0, R0, C, R2, G1, G0 in X:
        blocks.append([L1 * zb / w, R1 * zb, L0 * zb / w, R0 * zb, C / (w * zb), R2 * zb, (zb / G1) if G1 > 0 else 0.0, (zb / G0) if G0 > 0 else 0.0])
    f = S['f']
    z1, z0 = S['Z1'][:, 0, 0], S['Z0'][:, 0, 0]
    r = lambda a: [float(v) for v in a]
    return {'blocks': blocks, 'err1': F['err1'], 'err0': F['err0'], 'k': F['k'], 'pure': F['pure'], 'line': S['line'], 'peaks': S['peaks'][0],
            'f': r(f), 'Z1': r(np.abs(z1) * zb), 'Z1fit': r(np.abs(F['Z1fit']) * zb), 'Z0': r(np.abs(z0) * zb), 'Z0fit': r(np.abs(F['Z0fit']) * zb),
            'a1': r(np.degrees(np.angle(z1))), 'a1fit': r(np.degrees(np.angle(F['Z1fit']))), 'zb': float(zb)}


def _mat(M):
    return '; '.join(', '.join(repr(float(v)) for v in r) for r in M)


def to_emt(net, boundary, internal=None, lf=None, machines=None, fig='50', name=None, t_end=0.5, hdiv=400, **foster_kw):
    """5.0.4: the study area as a project of the app for EMT (Network.to_emt of the kept buses), with the rest of the network
    as one EQV3 at the boundary buses (emt_ports). Returns the project dict; its meta['equivalent'] has the ports.
    5.0.7: fig '15a' with the keywords of emt_ports for the scan and the fit (fmin, fmax, n, line, pure)."""
    if lf is None:
        lf = net.load_flow()
    q = emt_ports(net, boundary, internal, lf=lf, machines=machines, fig=fig, **foster_kw)
    ret = _retained(net, q['external'])
    pr = ret.to_emt(lf=lf, machines=machines, name=name or ((net.name or 'network') + ' (περιοχή)'), t_end=t_end, hdiv=hdiv)
    B = q['boundary']
    xs = [c['x'] for c in pr['components']]
    ys = {c['id']: c['y'] for c in pr['components']}
    prm = {'names': '; '.join(B), 'f': net.f, 'Sb': net.S_base, 'Un': '; '.join(repr(u) for u in q['Un']),
           'E': '; '.join(repr(float(abs(e))) for e in q['E']), 'ang': '; '.join(repr(float(np.degrees(np.angle(e)))) for e in q['E']),
           'R1': _mat(q['Z1'].real), 'X1': _mat(q['Z1'].imag), 'R0': _mat(q['Z0'].real), 'X0': _mat(q['Z0'].imag), 'fig': fig,
           'Rs': '; '.join(repr(r) for r in q['Rs']), 'C': '; '.join(repr(c) for c in q['C']), 'conn': 'bus'}
    if fig == FOSTER:
        prm['F'] = _mat(q['foster']['blocks'])
    if fig == FDNE:
        prm['FD'] = q['fdne']['rows']
    x0 = (min(xs) if xs else 240) - 360
    y0 = min(ys.get('B' + b, 200) for b in B)
    pr['components'].append({'id': 'EQ1', 'type': 'EQV3', 'x': x0 // 10 * 10, 'y': y0 // 10 * 10, 'rot': 0, 'flip': False,
                             'label': 'υπόλοιπο δίκτυο', 'params': prm})
    for k, b in enumerate(B):
        pr['wires'].append({'id': f'w{len(pr["wires"]) + 1}', 'a': {'c': 'EQ1', 'p': f'abc{k + 1}'}, 'b': {'c': 'B' + b, 'p': 'j'}, 'pts': []})
    pr['meta']['equivalent'] = {'boundary': B, 'internal': q['internal'], 'external': len(q['external']), 'fig': fig,
                                'Sk': q['Sk'], 'Rs': q['Rs'], 'C': q['C'], 'notes': q['notes']}
    if fig == FOSTER:
        pr['meta']['equivalent']['foster'] = q['foster']
    if fig == FDNE:
        pr['meta']['equivalent']['fdne'] = {k: v for k, v in q['fdne'].items() if k != 'rows'}
    return pr
