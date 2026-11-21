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


def emt_ports(net, boundary, internal=None, lf=None, machines=None, fig='50', tol=1e-10):
    """5.0.4: the equivalent of the network beyond the boundary for EMT (CIGRE TB 39, Fig. 15; see the module).
    fig: '50' (sources behind the Thevenin impedances of both sequences: exact at the fundamental), '15b' or '15c'.
    machines: the GEN3 data of the generators (as for Network.to_emt). lf: the load flow of the full network (load_flow when None).
    Returns {'internal', 'boundary', 'external', 'Un' (V per port), 'Z1', 'Z0' (pu, N × N: of the short-circuit impedance for
    15b and 15c), 'E' (pu, per port), 'I' (pu, the current from the equivalent into each boundary bus in the base case), 'Rs'
    (Ω per port or 0), 'C' (F per port), 'Sk' (VA per port: |V|²/|Z₁,kk|, the contribution of the external network), 'fig',
    'notes'}."""
    if fig not in FIGS:
        raise EquivalentError(f'fig: one of {", ".join(FIGS)}')
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
    charging = fig == '50'
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
    return {'internal': I, 'boundary': B, 'external': E, 'Un': Un, 'Z1': (Z1 + Z1.T) / 2, 'Z0': (Z0 + Z0.T) / 2, 'E': Eb, 'I': IB,
            'V': VB, 'Rs': Rs.tolist(), 'C': C.tolist(), 'Sk': Sk, 'fig': fig, 'notes': notes}


def _mat(M):
    return '; '.join(', '.join(repr(float(v)) for v in r) for r in M)


def to_emt(net, boundary, internal=None, lf=None, machines=None, fig='50', name=None, t_end=0.5, hdiv=400):
    """5.0.4: the study area as a project of the app for EMT (Network.to_emt of the kept buses), with the rest of the network
    as one EQV3 at the boundary buses (emt_ports). Returns the project dict; its meta['equivalent'] has the ports."""
    if lf is None:
        lf = net.load_flow()
    q = emt_ports(net, boundary, internal, lf=lf, machines=machines, fig=fig)
    ret = _retained(net, q['external'])
    pr = ret.to_emt(lf=lf, machines=machines, name=name or ((net.name or 'network') + ' (περιοχή)'), t_end=t_end, hdiv=hdiv)
    B = q['boundary']
    xs = [c['x'] for c in pr['components']]
    ys = {c['id']: c['y'] for c in pr['components']}
    prm = {'names': '; '.join(B), 'f': net.f, 'Sb': net.S_base, 'Un': '; '.join(repr(u) for u in q['Un']),
           'E': '; '.join(repr(float(abs(e))) for e in q['E']), 'ang': '; '.join(repr(float(np.degrees(np.angle(e)))) for e in q['E']),
           'R1': _mat(q['Z1'].real), 'X1': _mat(q['Z1'].imag), 'R0': _mat(q['Z0'].real), 'X0': _mat(q['Z0'].imag), 'fig': fig,
           'Rs': '; '.join(repr(r) for r in q['Rs']), 'C': '; '.join(repr(c) for c in q['C']), 'conn': 'bus'}
    x0 = (min(xs) if xs else 240) - 360
    y0 = min(ys.get('B' + b, 200) for b in B)
    pr['components'].append({'id': 'EQ1', 'type': 'EQV3', 'x': x0 // 10 * 10, 'y': y0 // 10 * 10, 'rot': 0, 'flip': False,
                             'label': 'υπόλοιπο δίκτυο', 'params': prm})
    for k, b in enumerate(B):
        pr['wires'].append({'id': f'w{len(pr["wires"]) + 1}', 'a': {'c': 'EQ1', 'p': f'abc{k + 1}'}, 'b': {'c': 'B' + b, 'p': 'j'}, 'pts': []})
    pr['meta']['equivalent'] = {'boundary': B, 'internal': q['internal'], 'external': len(q['external']), 'fig': fig,
                                'Sk': q['Sk'], 'Rs': q['Rs'], 'C': q['C'], 'notes': q['notes']}
    return pr
