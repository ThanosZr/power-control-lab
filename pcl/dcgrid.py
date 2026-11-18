"""Multi-terminal DC grids in steady state (4.20, ROADMAP §82, THEORY §8Φ).

    g = DCGrid()
    g.bus('1', 400e3); g.bus('2', 400e3)
    g.line('1', '2', r=0.01, length=80)                     # Ω/km per conductor; the loop of two conductors by default
    g.converter('1', 'V', V=1.0)                            # the DC slack: holds its voltage
    g.converter('2', 'droop', P=-500e6, V=0.99, droop=0.04, Prated=900e6)
    res = g.flow()                                          # the load flow of the DC grid (Newton–Raphson on the voltages)

The DC load flow (Haileselassie & Uhlen 2012, §II–III; Beerten & Belmans 2013, §II): every bus voltage U_i (V, pole to pole
for a bipole or a symmetric monopole) and the power into the grid at bus i, P_i = U_i·Σ_j G_ij·U_j, with G the conductance
matrix of the lines (the loop resistance: two conductors in series for a line with poles = 2, one with ground return for
poles = 1). A converter fixes, at its bus:
    'P'      the power into the DC grid (W; negative: taken out, an inverter);
    'V'      the voltage (pu of the bus's U_n): the DC slack, its power follows from the grid;
    'droop'  the power–voltage droop P = P_0 − R·(U − U_0), with R (W/V) given, or R = P_rated/(ρ·U_n) from the droop ρ (pu);
    'idroop' the current–voltage droop I = I_0 − g·(U − U_0) (Beerten & Belmans 2013, (6)), g (S) or from ρ as I_rated/(ρ·U_n);
    'I'      a constant current into the grid (A; Jovcic 2019, §26.3: the grid is then linear).
A bus may have a resistance R to ground (the leakage of (26.2) in Jovcic 2019).
At least one converter of every connected part holds the voltage ('V', 'droop' or 'idroop'), or the part has no solution.

The converter station on its AC side (Beerten, Cole & Belmans 2012, §II, Fig. 2): the AC bus s, the transformer Z_tr, the
filter bus f with the susceptance B_f, the phase reactor Z_c, the converter c; the losses P_loss = a + b·I_c + c·I_c² (W,
I_c in A at the converter), c_rec while it rectifies (takes power from the AC grid), c_inv while it inverts. The power into the
DC grid is P_dc = −P_c − P_loss, with P_c the power that the converter gives to its AC side. station() is that model forward
(from the AC bus to the DC side) and station_inverse() backward (the AC power that gives a P_dc).

The sequential AC/DC load flow (Beerten, Cole & Belmans 2012, §III, Fig. 5–6): acdc_flow(net) for a pcl.network.Network with
dc_bus, dc_line and vsc elements: the AC load flow with every converter as a fixed injection (or a PV bus when it holds the AC
voltage), then the DC load flow, then the AC power of the converters that the DC grid decides (the slack and the droops), until
nothing changes. The AC solvers see only fixed injections, so every AC method of pcl.powerflow solves the AC part.
"""
import cmath
import math
import time

import numpy as np

SQ3 = math.sqrt(3.0)
CONTROLS = ('P', 'V', 'droop', 'idroop', 'I')


class DCGridError(ValueError):
    pass


class DCGrid:
    """The DC part of a network: buses, lines and converters (SI units, powers into the DC grid)."""

    def __init__(self, P_base=100e6, name=''):
        self.P_base, self.name = float(P_base), name
        self.buses = {}            # name -> {'Un': V, 'V': pu (start), 'R': Ω to ground or None}
        self.lines = []            # {'name', 'a', 'b', 'R' (Ω per conductor), 'poles', 'rating' (A) or None}
        self.converters = []       # {'name', 'bus', 'control', 'P', 'V', 'R' (W/V), 'g' (S), 'I'}

    def bus(self, name, Un, V=1.0, R=None):
        """A DC bus: U_n (V), V (pu) the start, R (Ω) a resistance to ground (leakage), or None."""
        name = str(name)
        if Un <= 0 or (R is not None and R <= 0):
            raise DCGridError(f'DC bus {name}: U_n > 0, R > 0')
        self.buses[name] = {'Un': float(Un), 'V': float(V), 'R': None if R is None else float(R)}
        return name

    def _bus(self, b, who):
        b = str(b)
        if b not in self.buses:
            raise DCGridError(f'{who}: unknown DC bus {b}')
        return b

    def line(self, a, b, R=None, r=None, length=1.0, poles=2, name=None, rating=None):
        """A DC line or cable: R (Ω, one conductor, whole length) or r (Ω/km) × length (km); poles = 2 the loop of two
        conductors (bipole, symmetric monopole: the voltages pole to pole), 1 one conductor with ground or metallic return
        of no resistance; rating (A) the current limit, only reported."""
        name = str(name or f'L{len(self.lines) + 1}')
        a, b = self._bus(a, name), self._bus(b, name)
        if (R is None) == (r is None):
            raise DCGridError(f'{name}: give R or r')
        Rt = float(R) if R is not None else float(r) * float(length)
        if Rt <= 0:
            raise DCGridError(f'{name}: R > 0')
        if poles not in (1, 2):
            raise DCGridError(f'{name}: poles 1 or 2')
        if abs(self.buses[a]['Un'] - self.buses[b]['Un']) > 1e-9 * self.buses[a]['Un']:
            raise DCGridError(f'{name}: the buses have different U_n (a DC/DC converter is not a line)')
        self.lines.append({'name': name, 'a': a, 'b': b, 'R': Rt, 'poles': int(poles), 'rating': rating})
        return name

    def converter(self, bus, control='P', P=0.0, V=1.0, droop=None, Prated=None, R=None, I=0.0, name=None):
        """control 'P' (P in W into the grid), 'V' (V in pu), 'droop' (P_0 = P, U_0 = V·U_n; R in W/V, or droop ρ in pu with
        P_rated in W), 'idroop' (I_0 = P/U_0; g = R in S, or from ρ: g = (P_rated/U_n)/(ρ·U_n)), 'I' (I in A into the grid)."""
        name = str(name or f'C{len(self.converters) + 1}')
        bus = self._bus(bus, name)
        if control not in CONTROLS:
            raise DCGridError(f'{name}: control one of {", ".join(CONTROLS)}')
        Un = self.buses[bus]['Un']
        k = 0.0
        if control in ('droop', 'idroop'):
            if R is not None:
                k = float(R)
            elif droop is not None and Prated is not None:
                k = float(Prated) / (float(droop) * Un) / (Un if control == 'idroop' else 1.0)
            else:
                raise DCGridError(f'{name}: a droop needs R, or droop and Prated')
            if k <= 0:
                raise DCGridError(f'{name}: the droop gain > 0')
        self.converters.append({'name': name, 'bus': bus, 'control': control, 'P': float(P), 'V': float(V), 'k': k, 'I': float(I)})
        return name

    def remove(self, name):
        """Takes a converter or a line out (an outage); the droops of the others decide the new state."""
        n = len(self.converters) + len(self.lines)
        self.converters = [c for c in self.converters if c['name'] != name]
        self.lines = [ln for ln in self.lines if ln['name'] != name]
        if len(self.converters) + len(self.lines) == n:
            raise DCGridError(f'no converter or line {name}')

    # ------------------------------------------------------------------ the load flow
    def conductance(self):
        """(names, G in S): the nodal conductance matrix for the voltages of the buses (pole to pole on lines with two poles)."""
        names = list(self.buses)
        idx = {b: i for i, b in enumerate(names)}
        G = np.zeros((len(names), len(names)))
        for ln in self.lines:
            g = 1.0 / (ln['poles'] * ln['R'])
            i, j = idx[ln['a']], idx[ln['b']]
            G[i, i] += g
            G[j, j] += g
            G[i, j] -= g
            G[j, i] -= g
        for b, d in self.buses.items():
            if d.get('R'):
                G[idx[b], idx[b]] += 1.0 / d['R']
        return names, G

    def _parts(self, G):
        n = len(G)
        seen, parts = [-1] * n, []
        for s in range(n):
            if seen[s] >= 0:
                continue
            stack, comp = [s], []
            seen[s] = len(parts)
            while stack:
                i = stack.pop()
                comp.append(i)
                for j in np.nonzero(G[i])[0]:
                    if seen[j] < 0:
                        seen[j] = len(parts)
                        stack.append(j)
            parts.append(sorted(comp))
        return parts

    def flow(self, tol=1e-9, max_iter=30, start=None):
        """The DC load flow by Newton–Raphson on the voltages of the buses that no converter holds. tol: the largest power
        mismatch, in pu of P_base. start: {bus: V in pu} to start from (else the buses' V, and the voltage of the
        converters). Returns {'converged', 'iterations', 'buses': {bus: {'V' (pu), 'U' (V), 'P' (W into the grid), 'I' (A)}},
        'lines': [{'name', 'a', 'b', 'I' (A, a → b), 'Pa', 'Pb' (W into the line at each end), 'loss' (W), 'rating', 'loading'}],
        'converters': {name: {'bus', 'control', 'P' (W into the grid), 'U' (V), 'I' (A)}}, 'losses' (W), 'mismatch' (pu)}."""
        t0 = time.perf_counter()
        names, G = self.conductance()
        n = len(names)
        if not n:
            raise DCGridError('the DC grid has no buses')
        idx = {b: i for i, b in enumerate(names)}
        Un = np.array([self.buses[b]['Un'] for b in names])
        U = np.array([(start or {}).get(b, self.buses[b]['V']) for b in names], float) * Un
        fixed = np.zeros(n, bool)
        P0 = np.zeros(n)                       # constant power at the bus
        Kp = np.zeros(n)                       # P–V droop: P = P_0 + R·U_0 − R·U  → the part R·U_0 in Pd, R in Kp
        Pd = np.zeros(n)
        I0 = np.zeros(n)                       # I–V droop: P = U·(I_0 + g·U_0 − g·U)
        Kg = np.zeros(n)
        for c in self.converters:
            i = idx[c['bus']]
            if c['control'] == 'P':
                P0[i] += c['P']
            elif c['control'] == 'V':
                if fixed[i] and abs(U[i] - c['V'] * Un[i]) > 1e-12 * Un[i]:
                    raise DCGridError(f'{c["name"]}: two converters hold bus {c["bus"]} at different voltages')
                fixed[i] = True
                U[i] = c['V'] * Un[i]
            elif c['control'] == 'I':
                I0[i] += c['I']
            elif c['control'] == 'droop':
                Kp[i] += c['k']
                Pd[i] += c['P'] + c['k'] * c['V'] * Un[i]
            else:
                U0 = c['V'] * Un[i]
                Kg[i] += c['k']
                I0[i] += c['P'] / U0 + c['k'] * U0
        if start is None:                      # the free buses start at the voltage of a converter that holds or droops them
            for c in self.converters:
                if c['control'] not in ('P', 'I') and not fixed[idx[c['bus']]]:
                    U[idx[c['bus']]] = c['V'] * Un[idx[c['bus']]]
        for comp in self._parts(G):
            if not any(fixed[i] or Kp[i] > 0 or Kg[i] > 0 for i in comp):
                raise DCGridError('a part of the DC grid has no converter that holds the voltage (V, droop or idroop): '
                                  + ', '.join(names[i] for i in comp))
        free = np.nonzero(~fixed)[0]

        def spec(U):
            return P0 + Pd - Kp * U + U * (I0 - Kg * U)

        it, ok, mis = 0, False, math.inf
        for it in range(max_iter + 1):
            Pg = U * (G @ U)
            F = (spec(U) - Pg)[free]
            mis = float(np.max(np.abs(F))) / self.P_base if len(F) else 0.0
            if mis < tol:
                ok = True
                break
            if it == max_iter:
                break
            # ∂(U_i·Σ G_ij U_j)/∂U_j = U_i·G_ij, and on the diagonal + Σ_j G_ij U_j; ∂spec_i/∂U_i = −R − 2gU + I_0
            J = U[:, None] * G + np.diag(G @ U)
            J += np.diag(Kp + 2 * Kg * U - I0)
            dU = np.linalg.solve(J[np.ix_(free, free)], F)
            U[free] += dU
        Ig = G @ U
        Pg = U * Ig
        res = {'converged': ok, 'iterations': it, 'mismatch': mis, 'buses': {}, 'lines': [], 'converters': {}}
        for b in names:
            i = idx[b]
            res['buses'][b] = {'V': float(U[i] / Un[i]), 'U': float(U[i]), 'P': float(Pg[i]), 'I': float(Ig[i])}
        loss = 0.0
        for ln in self.lines:
            ua, ub = U[idx[ln['a']]], U[idx[ln['b']]]
            I = (ua - ub) / (ln['poles'] * ln['R'])
            q = {'name': ln['name'], 'a': ln['a'], 'b': ln['b'], 'I': float(I), 'Pa': float(ua * I), 'Pb': float(-ub * I),
                 'loss': float((ua - ub) * I), 'rating': ln['rating'], 'loading': (abs(I) / ln['rating']) if ln['rating'] else None}
            loss += q['loss']
            res['lines'].append(q)
        for b, d in self.buses.items():           # the leakage to ground
            if d.get('R'):
                loss += U[idx[b]] ** 2 / d['R']
        res['losses'] = loss
        # the power of each converter: a 'P' gives its P; what is left at the bus goes to the converters that hold or droop it
        left = Pg - P0
        for c in self.converters:
            i = idx[c['bus']]
            u = U[i]
            if c['control'] == 'P':
                p = c['P']
            elif c['control'] == 'droop':
                p = c['P'] - c['k'] * (u - c['V'] * Un[i])
            elif c['control'] == 'idroop':
                u0 = c['V'] * Un[i]
                p = u * (c['P'] / u0 - c['k'] * (u - u0))
            elif c['control'] == 'I':
                p = u * c['I']
            else:
                p = None
            res['converters'][c['name']] = {'bus': c['bus'], 'control': c['control'], 'P': p, 'U': float(u), 'I': None}
        for b in names:                        # the slack converters share what is left at their bus equally
            i = idx[b]
            cs = [c for c in self.converters if c['bus'] == b and c['control'] == 'V']
            rest = left[i] - sum(res['converters'][c['name']]['P'] for c in self.converters if c['bus'] == b and c['control'] in ('droop', 'idroop', 'I'))
            for c in cs:
                res['converters'][c['name']]['P'] = float(rest / len(cs))
        for q in res['converters'].values():
            q['P'] = float(q['P'])
            q['I'] = q['P'] / q['U'] if q['U'] else 0.0
        res['jacobian'] = (U[:, None] * G + np.diag(G @ U))     # ∂P/∂U at the solution (W/V), for sensitivities
        res['_names'] = names
        res['time'] = time.perf_counter() - t0
        return res


def sensitivity(grid, res=None):
    """The steady-state changes of the bus voltages and powers for a change of the power references, from the linearised DC
    load flow with the droops (Haileselassie & Uhlen 2012, (25)–(28)): {'names', 'dU' (V per W of each reference: the
    matrix (J + diag R)⁻¹ on the free buses), 'B' (the share of a power change ΔP* that every converter takes: ΔP = B·ΔP*)}."""
    res = res or grid.flow()
    names = res['_names']
    idx = {b: i for i, b in enumerate(names)}
    J = np.array(res['jacobian'])
    K = np.zeros(len(names))
    fixed = np.zeros(len(names), bool)
    for c in grid.converters:
        i = idx[c['bus']]
        if c['control'] == 'droop':
            K[i] += c['k']
        elif c['control'] == 'V':
            fixed[i] = True
    free = np.nonzero(~fixed)[0]
    M = J[np.ix_(free, free)] + np.diag(K[free])
    dU = np.zeros((len(names), len(names)))
    dU[np.ix_(free, free)] = np.linalg.inv(M)
    B = np.eye(len(names)) - np.diag(K) @ dU                # ΔP_i = ΔP*_i − R_i·ΔU_i
    return {'names': names, 'dU': dU, 'B': B}


# ---------------------------------------------------------------------- the converter station (AC side)
def station(Us, Ss, st, S_base, U_base):
    """The station forward: Us (complex, pu) at the AC bus, Ss (complex, pu) the power that the station gives to the AC bus.
    st: {'Rtr', 'Xtr', 'Bf', 'Rc', 'Xc' (pu on S_base and the bus's base), 'a' (W), 'b' (V), 'crec', 'cinv' (Ω)}.
    Returns {'Uf', 'Uc', 'Sc' (pu, the power of the converter towards its AC side), 'Ic' (A), 'loss' (W), 'Pdc' (W into the
    DC grid), 'rectifier' (bool)}."""
    I = (Ss / Us).conjugate()                                         # from the station into the AC bus
    Uf = Us + I * complex(st.get('Rtr', 0.0), st.get('Xtr', 0.0))
    Ic = I + 1j * st.get('Bf', 0.0) * Uf                              # the filter takes j·B_f·U_f
    Uc = Uf + Ic * complex(st.get('Rc', 0.0), st.get('Xc', 0.0))
    Sc = Uc * Ic.conjugate()
    ia = abs(Ic) * S_base / (SQ3 * U_base)
    rect = Sc.real < 0
    c = st.get('crec', 0.0) if rect else st.get('cinv', 0.0)
    loss = st.get('a', 0.0) + st.get('b', 0.0) * ia + c * ia * ia
    return {'Uf': Uf, 'Uc': Uc, 'Sc': Sc, 'Ic': ia, 'loss': loss, 'Pdc': -Sc.real * S_base - loss, 'rectifier': bool(rect)}


def station_inverse(Us, Qs, Pdc, st, S_base, U_base, Ps0=None, tol=1e-10, max_iter=50):
    """The active power P_s (pu) that the station gives to the AC bus for a power Pdc (W) into the DC grid, at the AC voltage
    Us and the reactive power Qs (pu) given: a secant iteration on P_s (Beerten, Cole & Belmans 2012, Fig. 6, with the AC
    voltage held). Returns (P_s, the forward result)."""
    f = lambda p: station(Us, complex(p, Qs), st, S_base, U_base)['Pdc'] - Pdc      # noqa: E731
    x0 = -Pdc / S_base if Ps0 is None else Ps0
    f0 = f(x0)
    x1 = x0 + f0 / S_base if f0 else x0
    for _ in range(max_iter):
        if abs(f0) <= tol * S_base:
            break
        f1 = f(x1)
        if abs(f1) <= tol * S_base or x1 == x0:
            x0, f0 = x1, f1
            break
        x0, f0, x1 = x1, f1, x1 - f1 * (x1 - x0) / (f1 - f0)
    return x0, station(Us, complex(x0, Qs), st, S_base, U_base)


# ---------------------------------------------------------------------- the sequential AC/DC load flow
def grid_of(net):
    """The DCGrid of the DC buses, lines and converters of a pcl.network.Network (the converters with the power of their
    last AC/DC iteration when they have one)."""
    g = DCGrid(net.S_base, net.name)
    for b, d in getattr(net, 'dc_buses', {}).items():
        g.bus(b, d['Un'], d.get('V', 1.0), d.get('R'))
    for e in net.elements:
        if e['kind'] == 'dc_line':
            g.line(e['a'], e['b'], R=e['R'], poles=e['poles'], name=e['name'], rating=e.get('rating'))
    for e in net.elements:
        if e['kind'] == 'vsc':
            g.converter(e['dc'], e['control'], P=e['P'], V=e['V'], droop=e.get('droop'), Prated=e.get('Prated'),
                        R=e.get('R'), I=e.get('I', 0.0), name=e['name'])
    return g


STATION_KEYS = ('Rtr', 'Xtr', 'Bf', 'Rc', 'Xc', 'crec', 'cinv')


def _st(e):
    """The station of a vsc element as station() takes it."""
    st = {q: e.get(q, 0.0) for q in STATION_KEYS}
    st.update(a=e.get('a_loss', 0.0), b=e.get('b_loss', 0.0))
    return st


def acdc_flow(net, method='auto', tol=1e-8, max_iter=None, flat=False, outer=30, q_limits=False):
    """The sequential AC/DC load flow of a Network (Beerten, Cole & Belmans 2012, Fig. 5). Every converter (vsc) gives its AC
    bus P_s and Q_s (or holds |U_s|, a PV bus); P_s of a converter with control 'P' follows from its P (into the DC grid,
    side 'dc') through the station, or is its P_ac (side 'ac'); P_s of the slack and the droops from the DC load flow.
    Returns the result of Network.power_flow for the AC part, with 'dc' (the DC load flow), 'converters' (per converter:
    P_s, Q_s, U_s, angle, P_c, Q_c, U_c, I_c, loss, P_dc, U_dc), 'outer' (the AC/DC iterations), 'converged' (both parts)."""
    t0 = time.perf_counter()
    vs = [e for e in net.elements if e['kind'] == 'vsc']
    if not vs:
        raise DCGridError('the network has no converters (vsc)')
    S_base = net.S_base
    for e in vs:
        if e.get('_Ps') is None or flat:
            e['_Ps'] = (e['P'] if e.get('side') == 'ac' else -e['P']) / S_base if e['control'] == 'P' else 0.0
            e['_Qs'] = (e.get('Q') or 0.0) / S_base
    hist, ok, res, dres = [], False, None, None
    for k in range(outer):
        used = {e['name']: e['_Ps'] for e in vs}
        res = net.power_flow(method=method, tol=tol, max_iter=max_iter, flat=flat and k == 0, q_limits=q_limits)
        if not res['converged']:
            break
        V, idx = res['_V'], res['_idx']
        for e in vs:                    # a converter that holds its AC voltage gives what its PV bus gives (it is alone there)
            if e.get('Vac') is not None:
                e['_Qs'] = res['buses'][e['bus']]['Q'] / S_base
        g = grid_of(net)
        gc = {c['name']: c for c in g.converters}
        for e in vs:                    # the converters with a given power: their P_dc (side 'ac') or their P_s (side 'dc')
            if e['control'] != 'P':
                continue
            Us, st, Ub = V[idx[e['bus']]], _st(e), net.buses[e['bus']]['Un']
            if e.get('side') == 'ac':
                gc[e['name']]['P'] = station(Us, complex(e['_Ps'], e['_Qs']), st, S_base, Ub)['Pdc']
            else:
                e['_Ps'] = station_inverse(Us, e['_Qs'], e['P'], st, S_base, Ub, e['_Ps'])[0]
        dres = g.flow(tol=tol)
        if not dres['converged']:
            break
        for e in vs:                    # the slack and the droops: the AC power that gives the P_dc the DC grid asks of them
            if e['control'] != 'P':
                Us, st = V[idx[e['bus']]], _st(e)
                e['_Ps'] = station_inverse(Us, e['_Qs'], dres['converters'][e['name']]['P'], st, S_base, net.buses[e['bus']]['Un'], e['_Ps'])[0]
        change = max(abs(e['_Ps'] - used[e['name']]) for e in vs)
        hist.append(change * S_base)
        if change < tol:                # the AC flow ran with the powers that the DC side gives back: both parts agree
            ok = True
            break
    conv = {}
    if res is not None:
        V, idx = res['_V'], res['_idx']
        for e in vs:
            Us = V[idx[e['bus']]]
            st = _st(e)
            f = station(Us, complex(e['_Ps'], e['_Qs']), st, S_base, net.buses[e['bus']]['Un'])
            d = dres['converters'][e['name']] if dres else {'U': None}
            conv[e['name']] = {'bus': e['bus'], 'dc': e['dc'], 'control': e['control'], 'Ps': float(e['_Ps'] * S_base), 'Qs': float(e['_Qs'] * S_base),
                               'Us': float(abs(Us)), 'angle': math.degrees(cmath.phase(Us)), 'Pc': float(f['Sc'].real * S_base), 'Qc': float(f['Sc'].imag * S_base),
                               'Uc': float(abs(f['Uc'])), 'angle_c': math.degrees(cmath.phase(f['Uc'])), 'Ic': float(f['Ic']), 'loss': float(f['loss']),
                               'Pdc': float(f['Pdc']), 'Udc': d['U'], 'rectifier': f['rectifier']}
    out = dict(res or {})
    out.update(dc=dres, converters=conv, outer=len(hist), outer_change=hist, converged=bool(ok and dres and dres['converged']),
               time=time.perf_counter() - t0)
    out['losses_dc'] = dres['losses'] if dres else None
    out['losses_conv'] = sum(c['loss'] for c in conv.values())
    return out


# ---------------------------------------------------------------------- the CIGRE B4 DC grid test system (4.20.1)
# As the book of Jovcic (2019, §27.8) gives it: the topology, the lengths and the cable or overhead line of every DC link from
# Fig. 27.6 (A1–B1 and B4–B2 are double lines), the per-km data of Table 7.3 (§7.7.1: DC OHL ±400 kV 0.0114, ±200 kV 0.0133,
# DC cable ±400 and ±200 kV 0.0095 Ω/km; L and C too, for EMT), the ratings and the power references of Table 27.11. Three DC
# grids: DCS1 (±200 kV, A1–C1), DCS2 (±200 kV, five terminals), DCS3 (±400 kV bipole, eight buses); two DC/DC converters (Cd-E1
# from Bb-E1 into DCS2, Cd-B1 in series with the cable E1–B1). Voltages pole to pole. The book does not give the gains of the
# three-level control nor the dispatcher's; here every converter holds its power reference and one converter per grid holds
# its DC voltage (Cm-A1 by Table 27.11; in DCS2 and DCS3 the station that the figure shows taking the rest, Cm-B3 and Cb-A1).
B4_UN = {'DCS1': 400e3, 'DCS2': 400e3, 'DCS3': 800e3}
B4_BUSES = {'Bm-A1': 'DCS1', 'Bm-C1': 'DCS1',
            'Bm-B2': 'DCS2', 'Bm-B3': 'DCS2', 'Bm-B5': 'DCS2', 'Bm-E1': 'DCS2', 'Bm-F1': 'DCS2',
            'Bb-A1': 'DCS3', 'Bb-C2': 'DCS3', 'Bb-D1': 'DCS3', 'Bb-E1': 'DCS3', 'Bb-B1s': 'DCS3', 'Bb-B1': 'DCS3', 'Bb-B4': 'DCS3',
            'Bb-B2': 'DCS3'}
B4_DATA = {   # Table 7.3: (R Ω/km, L mH/km, C μF/km, G μS/km) per conductor
    ('ohl', 800e3): (0.0114, 0.9356, 0.0123, 0.0), ('ohl', 400e3): (0.0133, 0.8273, 0.0139, 0.0),
    ('cable', 800e3): (0.0095, 2.1120, 0.1906, 0.048), ('cable', 400e3): (0.0095, 2.1110, 0.2104, 0.062)}
B4_LINES = [   # (from, to, km, kind, circuits) of Fig. 27.6
    ('Bm-C1', 'Bm-A1', 200, 'cable', 1),
    ('Bm-B2', 'Bm-B3', 200, 'cable', 1), ('Bm-B5', 'Bm-B3', 100, 'ohl', 1), ('Bm-F1', 'Bm-B5', 100, 'cable', 1),
    ('Bm-E1', 'Bm-F1', 200, 'cable', 1),
    ('Bb-C2', 'Bb-A1', 200, 'cable', 1), ('Bb-D1', 'Bb-C2', 300, 'cable', 1), ('Bb-D1', 'Bb-E1', 200, 'cable', 1),
    ('Bb-E1', 'Bb-B1s', 200, 'cable', 1), ('Bb-A1', 'Bb-B1', 400, 'ohl', 2), ('Bb-A1', 'Bb-B4', 500, 'ohl', 1),
    ('Bb-B1', 'Bb-B4', 200, 'ohl', 1), ('Bb-B4', 'Bb-B2', 300, 'ohl', 2)]
B4_STATIONS = [   # (name, DC bus, rating MVA, power reference MW into the DC grid, or None: holds the voltage) of Table 27.11
    ('Cm-A1', 'Bm-A1', 800, None), ('Cm-C1', 'Bm-C1', 800, 500), ('Cm-B2', 'Bm-B2', 800, 150), ('Cm-B3', 'Bm-B3', 1200, -900),
    ('Cm-E1', 'Bm-E1', 200, -100), ('Cm-F1', 'Bm-F1', 800, 500), ('Cb-A1', 'Bb-A1', 2400, 2000), ('Cb-B1', 'Bb-B1', 2400, -1500),
    ('Cb-B2', 'Bb-B2', 2400, -1700), ('Cb-C2', 'Bb-C2', 800, 500), ('Cb-D1', 'Bb-D1', 1600, 1000)]
B4_DCDC = [('Cd-E1', 'Bb-E1', 'Bm-E1', 1000, 300), ('Cd-B1', 'Bb-B1s', 'Bb-B1', 2000, 600)]   # (name, from, to, MVA, MW)


def b4_line_data(a, km, kind):
    """R (Ω), L (H), C (F), G (S) of one conductor of a B4 link of km km and kind 'cable' or 'ohl' at the bus a (Table 7.3)."""
    r, l, c, g = B4_DATA[(kind, B4_UN[B4_BUSES[a]])]
    return r * km, l * km * 1e-3, c * km * 1e-6, g * km * 1e-6


def cigre_b4(hold=None, out=()):
    """The CIGRE B4 DC grid test system as a DCGrid (Jovcic 2019, §27.8, Fig. 27.6, Tables 7.3 and 27.11). hold: {grid: (station,
    V in pu)} the converter that holds the voltage of DCS2 and DCS3 (default Cm-B3 and Cb-A1 at 1 pu; Cm-A1 holds DCS1 at
    1 pu); every other converter holds its power reference; the DC/DC converters move their power, without losses. out: names
    of converters (AC/DC or DC/DC) or lines (a–b, with '#2' for the second of a double line) taken out."""
    hold = {'DCS1': ('Cm-A1', 1.0), 'DCS2': ('Cm-B3', 1.0), 'DCS3': ('Cb-A1', 1.0), **(hold or {})}
    g = DCGrid(P_base=100e6, name='CIGRE B4')
    for b, grid in B4_BUSES.items():
        g.bus(b, B4_UN[grid])
    for a, b, km, kind, n in B4_LINES:
        for k in range(n):
            name = f'{a}–{b}' + (f'#{k + 1}' if n > 1 else '')
            if name not in out:
                g.line(a, b, R=b4_line_data(a, km, kind)[0], poles=2, name=name)
    held = {st: v for st, v in hold.values()}
    for name, bus, S, P in B4_STATIONS:
        if name in out:
            continue
        if name in held:
            g.converter(bus, 'V', V=held[name], name=name)
        else:
            g.converter(bus, 'P', P=(P or 0.0) * 1e6, name=name)
    for name, a, b, S, P in B4_DCDC:
        if name not in out:
            g.converter(a, 'P', P=-P * 1e6, name=name + '/' + a)
            g.converter(b, 'P', P=P * 1e6, name=name + '/' + b)
    return g


def b4_network():
    """The CIGRE B4 of cigre_b4() as a pcl.network.Network (the case 'b4' of pcl/data, for the study 'acdc' and the diagram): every
    converter on an AC bus of its own with a feeder of 10 GVA as its slack (the book gives only the lengths and flows of the AC
    systems), the stations without losses (side 'dc'), P_rated = the rating of Table 27.11; each DC/DC converter as two
    converters 'P' on AC buses of their own (−P and +P)."""
    from . import network as N
    net = N.Network(f=50.0, S_base=100e6, name='CIGRE B4 DC grid test system (Jovcic 2019, §27.8, Fig. 27.6, Tables 7.3 and 27.11)')
    held = {'Cm-A1', 'Cm-B3', 'Cb-A1'}
    for b, grid in B4_BUSES.items():
        net.dc_bus(b, B4_UN[grid])
    for a, b, km, kind, n in B4_LINES:
        for k in range(n):
            net.dc_line(a, b, R=b4_line_data(a, km, kind)[0], poles=2, name=f'{a}–{b}' + (f'#{k + 1}' if n > 1 else ''))

    def ac(name):
        bus = 'AC ' + name
        net.bus(bus, 400e3)
        net.feeder(bus, Sk=10e9, RX=0.1, name='Q ' + name)
        return bus
    for name, bus, S, P in B4_STATIONS:
        P = (-900 if name == 'Cm-B3' else 0) if P is None else P          # the reference of a station that holds the voltage
        net.vsc(ac(name), bus, control='V' if name in held else 'P', P=P * 1e6, V=1.0, Prated=S * 1e6, name=name)
    for name, a, b, S, P in B4_DCDC:
        net.vsc(ac(name + '/' + a), a, control='P', P=-P * 1e6, Prated=S * 1e6, name=name + '/' + a)
        net.vsc(ac(name + '/' + b), b, control='P', P=P * 1e6, Prated=S * 1e6, name=name + '/' + b)
    return net

