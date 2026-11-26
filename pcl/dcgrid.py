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
        self.dcdcs = []            # 4.21: {'name', 'a', 'b', 'control', 'P' (W a → b), 'V' (pu of b), 'k' (W/V), 'Prated'}
        self.dispatchers = []      # 4.21: {'name', 'members', 'V' (pu), 'w' (shares, sum 1)}

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

    def dcdc(self, a, b, control='P', P=0.0, V=1.0, droop=None, Prated=None, R=None, name=None):
        """4.21: a DC/DC converter from the DC bus a to the DC bus b, as the averaged model of Jovcic (2019, §30.3.3, Fig. 30.7):
        the power balance U_a·I_a = U_b·I_b, without losses. The buses may have different U_n (two DC grids), or be of one grid
        (a power flow controller in series with a line, §30.1). control 'P': P (W) from a to b; 'V': it holds the voltage of b at
        V (pu of b's U_n) and the power is what that takes (§30.3.2, the outer loop on V_dc2); 'droop': P = P_0 − R·(U_b − U_0),
        P_0 = P, U_0 = V·U_n of b, R (W/V) or droop ρ (pu) with P_rated (W) (§30.3.2: 'respond to DC voltage variation, using
        droop feedback'). P_rated (W) only for the report."""
        name = str(name or f'D{len(self.dcdcs) + 1}')
        a, b = self._bus(a, name), self._bus(b, name)
        if a == b:
            raise DCGridError(f'{name}: a DC/DC converter needs two buses')
        if control not in ('P', 'V', 'droop'):
            raise DCGridError(f'{name}: control one of P, V, droop')
        k = 0.0
        if control == 'droop':
            if R is not None:
                k = float(R)
            elif droop is not None and Prated is not None:
                k = float(Prated) / (float(droop) * self.buses[b]['Un'])
            else:
                raise DCGridError(f'{name}: a droop needs R, or droop and Prated')
            if k <= 0:
                raise DCGridError(f'{name}: the droop gain > 0')
        self.dcdcs.append({'name': name, 'a': a, 'b': b, 'control': control, 'P': float(P), 'V': float(V), 'k': k,
                           'Prated': None if Prated is None else float(Prated)})
        return name

    def dispatcher(self, members, V=1.0, weights=None, buses=None, name=None):
        """4.21: the DC grid dispatcher of Jovcic (2019, §27.6.2, Fig. 27.5), in steady state: the power references of its members
        (converters 'P' or 'droop') are P_i = P_des,i + w_i·x, and x (W) is what makes the average of their DC voltages Σ U_i/(n·U_n,i)
        equal to V (pu): the secondary control that keeps the average DC voltage of the grid at the reference (the integral of
        the PI of Fig. 27.5 in steady state). weights: the shares w_i (the droop gains d_i of the figure, normalised to a sum of 1;
        by default equal: the book does not give the d_i). P_des,i is the member's own P. buses: the DC buses whose voltages are
        averaged (Vdc_av = Σ V_dci/n of Fig. 27.5), by default the buses of the members (one per member)."""
        name = str(name or f'dispatcher{len(self.dispatchers) + 1}')
        members = [str(m) for m in members]
        if not members:
            raise DCGridError(f'{name}: no members')
        w = [1.0] * len(members) if weights is None else [float(x) for x in weights]
        if len(w) != len(members) or any(x < 0 for x in w) or sum(w) <= 0:
            raise DCGridError(f'{name}: one weight ≥ 0 per member, not all 0')
        bs = None if buses is None else [self._bus(b, name) for b in buses]
        if bs is not None and not bs:
            raise DCGridError(f'{name}: no buses to average')
        self.dispatchers.append({'name': name, 'members': members, 'V': float(V), 'w': [x / sum(w) for x in w], 'buses': bs})
        return name

    def remove(self, name):
        """Takes a converter, a DC/DC converter or a line out (an outage); the droops of the others decide the new state. A
        converter taken out leaves its dispatcher (the others share x); a dispatcher with no member left is taken out too."""
        n = len(self.converters) + len(self.lines) + len(self.dcdcs)
        self.converters = [c for c in self.converters if c['name'] != name]
        self.lines = [ln for ln in self.lines if ln['name'] != name]
        self.dcdcs = [d for d in self.dcdcs if d['name'] != name]
        if len(self.converters) + len(self.lines) + len(self.dcdcs) == n:
            raise DCGridError(f'no converter, DC/DC converter or line {name}')
        for d in self.dispatchers:
            if name in d['members']:
                keep = [(m, x) for m, x in zip(d['members'], d['w']) if m != name]
                tot = sum(x for _, x in keep)
                d['members'] = [m for m, _ in keep]
                d['w'] = [x / tot for _, x in keep] if tot > 0 else [1.0 / len(keep)] * len(keep) if keep else []
        self.dispatchers = [d for d in self.dispatchers if d['members']]

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
        # 4.21: the DC/DC converters (after the converters, so that a grid without them adds the same numbers in the same order)
        # and the dispatchers. 'P' adds to P0; 'droop' injects −p(U_b) at a and +p(U_b) at b; 'V' holds U_b, and its power p is an
        # unknown with the balance of b as its equation; a dispatcher adds w_i·x at the bus of each member, x an unknown with the
        # average of the members' voltages as its equation.
        cname = {c['name']: c for c in self.converters}
        dd_droop, dd_hold = [], []
        for d in self.dcdcs:
            a, b = idx[d['a']], idx[d['b']]
            if d['control'] == 'P':
                P0[a] -= d['P']
                P0[b] += d['P']
            elif d['control'] == 'droop':
                dd_droop.append((a, b, d['P'] + d['k'] * d['V'] * Un[b], d['k']))
            else:
                if fixed[b]:
                    raise DCGridError(f'{d["name"]}: holds bus {d["b"]}, which another converter holds')
                fixed[b] = True
                U[b] = d['V'] * Un[b]
                dd_hold.append((a, b, d))
        disp = []
        for dp in self.dispatchers:
            ms = []
            for m, wm in zip(dp['members'], dp['w']):
                c = cname.get(m)
                if c is None or c['control'] not in ('P', 'droop'):
                    raise DCGridError(f'{dp["name"]}: {m} is not a converter with control P or droop')
                ms.append((idx[c['bus']], wm))
            av = [idx[b] for b in dp['buses']] if dp.get('buses') else [i for i, _ in ms]
            disp.append((dp, ms, av))
        if start is None:                      # the free buses start at the voltage of a converter that holds or droops them
            for c in self.converters:
                if c['control'] not in ('P', 'I') and not fixed[idx[c['bus']]]:
                    U[idx[c['bus']]] = c['V'] * Un[idx[c['bus']]]
        parts = self._parts(G)
        part_of = {i: k for k, comp in enumerate(parts) for i in comp}
        ref = set(part_of[b] for _, b, _, _ in dd_droop)
        for dp, ms, _ in disp:
            ps = set(part_of[i] for i, _ in ms)
            if len(ps) > 1:
                raise DCGridError(f'{dp["name"]}: its members are in more than one DC grid')
            ref |= ps
        for k, comp in enumerate(parts):
            if k not in ref and not any(fixed[i] or Kp[i] > 0 or Kg[i] > 0 for i in comp):
                raise DCGridError('a part of the DC grid has no converter that holds the voltage (V, droop or idroop): '
                                  + ', '.join(names[i] for i in comp))
        free = np.nonzero(~fixed)[0]
        extra = bool(dd_droop or dd_hold or disp)
        ph = np.zeros(len(dd_hold))            # the powers of the DC/DC converters that hold a voltage (W, a → b)
        xd = np.zeros(len(disp))               # the dispatchers' x (W)

        def spec(U):
            s = P0 + Pd - Kp * U + U * (I0 - Kg * U)
            if extra:
                s = s.copy()
                for a, b, c0, k in dd_droop:
                    p = c0 - k * U[b]
                    s[a] -= p
                    s[b] += p
                for (a, b, _), p in zip(dd_hold, ph):
                    s[a] -= p
                    s[b] += p
                for (_, ms, _), x in zip(disp, xd):
                    for i, wm in ms:
                        s[i] += wm * x
            return s

        rows = np.concatenate([free, np.array([b for _, b, _ in dd_hold], int)]) if extra else free
        nf = len(free)
        it, ok, mis = 0, False, math.inf
        for it in range(max_iter + 1):
            Pg = U * (G @ U)
            F = (spec(U) - Pg)[rows]
            if disp:
                F = np.concatenate([F, [(dp['V'] - sum(U[i] / Un[i] for i in av) / len(av)) * self.P_base for dp, _, av in disp]])
            mis = float(np.max(np.abs(F))) / self.P_base if len(F) else 0.0
            if mis < tol:
                ok = True
                break
            if it == max_iter:
                break
            # ∂(U_i·Σ G_ij U_j)/∂U_j = U_i·G_ij, and on the diagonal + Σ_j G_ij U_j; ∂spec_i/∂U_i = −R − 2gU + I_0
            J = U[:, None] * G + np.diag(G @ U)
            J += np.diag(Kp + 2 * Kg * U - I0)
            if not extra:
                dU = np.linalg.solve(J[np.ix_(free, free)], F)
                U[free] += dU
                continue
            for a, b, _, k in dd_droop:        # −∂spec/∂U_b with p = c0 − k·U_b: a takes −p (−k), b gets +p (+k)
                J[a, b] -= k
                J[b, b] += k
            nh, nd = len(dd_hold), len(disp)
            M = np.zeros((len(rows) + nd, nf + nh + nd))
            M[:len(rows), :nf] = J[np.ix_(rows, free)]
            pos = {int(r): q for q, r in enumerate(rows)}
            for j, (a, b, _) in enumerate(dd_hold):
                if a in pos:
                    M[pos[a], nf + j] += 1.0
                M[pos[b], nf + j] -= 1.0
            fpos = {int(i): q for q, i in enumerate(free)}
            for j, (dp, ms, av) in enumerate(disp):
                for i, wm in ms:
                    if i in pos:
                        M[pos[i], nf + nh + j] -= wm
                for i in av:
                    if i in fpos:
                        M[len(rows) + j, fpos[i]] += self.P_base / (len(av) * Un[i])
            dx = np.linalg.solve(M, F)
            U[free] += dx[:nf]
            ph += dx[nf:nf + nh]
            xd += dx[nf + nh:]
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
        add = {}                               # 4.21: the dispatchers' w·x for their members
        dd = {}                                # 4.21: the power of every DC/DC converter (W, a → b)
        if extra:
            for a, b, c0, k in dd_droop:
                left[a] += c0 - k * U[b]
                left[b] -= c0 - k * U[b]
            for (a, b, d), p in zip(dd_hold, ph):
                left[a] += p
                left[b] -= p
                dd[d['name']] = float(p)
            for (dp, ms, _), x in zip(disp, xd):
                for m, (i, wm) in zip(dp['members'], ms):
                    add[m] = add.get(m, 0.0) + wm * x
                    if cname[m]['control'] == 'P':
                        left[i] -= wm * x
        for c in self.converters:
            i = idx[c['bus']]
            u = U[i]
            if c['control'] == 'P':
                p = c['P'] + add.get(c['name'], 0.0)
            elif c['control'] == 'droop':
                p = c['P'] + add.get(c['name'], 0.0) - c['k'] * (u - c['V'] * Un[i])
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
        if self.dcdcs:                         # 4.21: the DC/DC converters, lossless (Jovcic 2019, §30.3.3)
            res['dcdc'] = {}
            for d in self.dcdcs:
                a, b = idx[d['a']], idx[d['b']]
                if d['control'] == 'P':
                    p = d['P']
                elif d['control'] == 'droop':
                    p = d['P'] - d['k'] * (U[b] - d['V'] * Un[b])
                else:
                    p = dd[d['name']]
                res['dcdc'][d['name']] = {'a': d['a'], 'b': d['b'], 'control': d['control'], 'P': float(p), 'Ua': float(U[a]), 'Ub': float(U[b]),
                                          'Ia': float(p / U[a]) if U[a] else 0.0, 'Ib': float(p / U[b]) if U[b] else 0.0,
                                          'loading': abs(p) / d['Prated'] if d.get('Prated') else None}
        if self.dispatchers:                   # 4.21: x and the average voltage of every dispatcher
            res['dispatchers'] = {}
            for (dp, ms, av), x in zip(disp, xd):
                res['dispatchers'][dp['name']] = {'x': float(x), 'V': float(sum(U[i] / Un[i] for i in av) / len(av)), 'Vref': dp['V'],
                                                  'members': {m: res['converters'][m]['P'] for m in dp['members']}}
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
        if e['kind'] == 'vsc' and e['control'] == 'Vf':     # 5.0.15: the station of an island gives what its island takes
            g.converter(e['dc'], 'P', P=e.get('_Pdc', 0.0), name=e['name'])
        elif e['kind'] == 'vsc':               # (4.21: _Pt, the share of P that the limits of the station leave)
            g.converter(e['dc'], e['control'], P=e['P'] if e.get('_Pt') is None else e['P'] * e['_Pt'], V=e['V'], droop=e.get('droop'), Prated=e.get('Prated'),
                        R=e.get('R'), I=e.get('I', 0.0), name=e['name'])
    for e in net.elements:                     # 5.0.16: the current sources of a drawing (a converter of constant current)
        if e['kind'] == 'dc_source':
            g.converter(e['bus'], 'I', I=e['I'], name=e['name'])
    for e in net.elements:                     # 4.21: the DC/DC converters and the dispatchers
        if e['kind'] == 'dcdc':
            g.dcdc(e['a'], e['b'], e['control'], P=e['P'], V=e['V'], droop=e.get('droop'), Prated=e.get('Prated'), R=e.get('R'), name=e['name'])
    for e in net.elements:
        if e['kind'] == 'dc_dispatcher':
            members = [m for m in e['members'] if any(c['name'] == m for c in g.converters)]
            if members:                        # (a member taken out of the network leaves the dispatcher)
                w = e.get('weights')
                w = None if w is None else [x for m, x in zip(e['members'], w) if m in members]
                g.dispatcher(members, V=e['V'], weights=w, buses=e.get('buses'), name=e['name'])
    return g


STATION_KEYS = ('Rtr', 'Xtr', 'Bf', 'Rc', 'Xc', 'crec', 'cinv')


def _st(e):
    """The station of a vsc element as station() takes it."""
    st = {q: e.get(q, 0.0) for q in STATION_KEYS}
    st.update(a=e.get('a_loss', 0.0), b=e.get('b_loss', 0.0))
    return st


LIMIT_KEYS = ('Imax', 'Ucmax', 'Ucmin', 'Qmin', 'Qmax')


def q_range(Us, Ps, st, S_base, U_base, Imax=None, Ucmax=None, Ucmin=None, Qmin=None, Qmax=None):
    """4.21: the reactive power Q_s (pu) that a station may give its AC bus at the active power P_s (pu) and the AC voltage Us,
    within its limits (Beerten, Cole & Belmans 2012, §II-B, Fig. 3): the current of the converter |I_c| ≤ I_max (A) and its
    voltage U_c,min ≤ |U_c| ≤ U_c,max (pu). The station is linear (Z_tr, B_f, Z_c), so I_c and U_c are affine in S_s and |I_c|²,
    |U_c|² quadratics in Q_s, found exactly from three points. Of the lower voltage limit only the upper crossing counts, as in
    the paper. Qmin, Qmax (pu): a box on Q_s as well (the reactive limits of the data of a station). Returns (Q_lo, Q_hi), or
    None when no Q_s is inside at this P_s."""
    lo, hi = -math.inf if Qmin is None else Qmin, math.inf if Qmax is None else Qmax

    def quad(fun):
        f0, f1, fm = fun(0.0), fun(1.0), fun(-1.0)
        return (f1 + fm) / 2 - f0, (f1 - fm) / 2, f0

    def roots(a, b, c):
        if abs(a) < 1e-300:
            return None if b == 0 else (-c / b, -c / b)
        d = b * b - 4 * a * c
        if d < 0:
            return None
        r = math.sqrt(d)
        return tuple(sorted(((-b - r) / (2 * a), (-b + r) / (2 * a))))
    f = lambda q: station(Us, complex(Ps, q), st, S_base, U_base)         # noqa: E731
    if Imax:
        a, b, c = quad(lambda q: f(q)['Ic'] ** 2)
        r = roots(a, b, c - Imax ** 2)
        if r is None:
            return None
        lo, hi = max(lo, r[0]), min(hi, r[1])
    if Ucmax:
        a, b, c = quad(lambda q: abs(f(q)['Uc']) ** 2)
        r = roots(a, b, c - Ucmax ** 2)
        if r is None:
            return None
        lo, hi = max(lo, r[0]), min(hi, r[1])
    if Ucmin:
        a, b, c = quad(lambda q: abs(f(q)['Uc']) ** 2)
        r = roots(a, b, c - Ucmin ** 2)
        if r is not None:
            lo = max(lo, r[1])
    return (lo, hi) if lo <= hi else None


def _hold_limits(net, vs, V, idx, moved, S_base):
    """4.21: one check of the limits of every station that has some (Beerten, Cole & Belmans 2012, §III-C), with the priority
    to the active power: Q_s is held inside its range at P_s (a station that holds its AC voltage gives up the voltage at the
    limit, and holds it again when its voltage is on the right side, as a generator); where no Q_s is inside, a station of
    given power reduces it (the share _Pt), and a slack or a droop is reported. Returns the largest change of Q_s or P_s (pu)
    and the states {name: {'Qmin', 'Qmax' (pu, None outside), 'held': 'Q' | 'P' | 'V' (the AC voltage given up) | None, 'over': bool}}."""
    change, state = 0.0, {}
    for e in vs:
        if not any(e.get(k) is not None for k in LIMIT_KEYS) or e['control'] == 'Vf':   # (5.0.15: the slack of an island: not held)
            continue
        Us, st, Ub = V[idx[e['bus']]], _st(e), net.buses[e['bus']]['Un']
        pu = lambda k: None if e.get(k) is None else e[k] / S_base          # noqa: E731
        args = (st, S_base, Ub, e.get('Imax'), e.get('Ucmax'), e.get('Ucmin'), pu('Qmin'), pu('Qmax'))
        rng = q_range(Us, e['_Ps'], *args)
        held, over = None, False
        if rng is None and e['control'] == 'P' and e['name'] not in moved:
            lo, hi = 0.0, 1.0                  # the largest share of P_s with a Q_s inside
            for _ in range(60):
                mid = 0.5 * (lo + hi)
                lo, hi = (mid, hi) if q_range(Us, e['_Ps'] * mid, *args) is not None else (lo, mid)
            t = lo
            e['_Pt'] = (e.get('_Pt') or 1.0) * t
            change = max(change, abs(e['_Ps'] * (1 - t)))
            e['_Ps'] = e['_Ps'] * t
            rng, held = q_range(Us, e['_Ps'], *args), 'P'
        if rng is None:
            state[e['name']] = {'Qmin': None, 'Qmax': None, 'held': held, 'over': True}
            continue
        qlo, qhi = rng
        if e.get('Vac') is not None:
            if e.get('_Qfix') is None:
                if e['_Qs'] > qhi or e['_Qs'] < qlo:
                    e['_Qfix'], e['_Qside'] = (qhi, 'hi') if e['_Qs'] > qhi else (qlo, 'lo')
            elif (e['_Qside'] == 'hi' and abs(Us) > e['Vac']) or (e['_Qside'] == 'lo' and abs(Us) < e['Vac']):
                e.pop('_Qfix')                 # on the wrong side of its set voltage: it holds the voltage again
                change = max(change, 1.0)      # (one more AC/DC iteration)
            else:
                e['_Qfix'] = qhi if e['_Qside'] == 'hi' else qlo
            if e.get('_Qfix') is not None:
                change = max(change, abs(e['_Qfix'] - e['_Qs']))
                e['_Qs'], held = e['_Qfix'], held or 'V'
        else:
            q = min(max((e.get('Q') or 0.0) / S_base, qlo), qhi)
            change = max(change, abs(q - e['_Qs']))
            if q != (e.get('Q') or 0.0) / S_base:
                held = held or 'Q'
            e['_Qs'] = q
        if e.get('_Pt') is not None and e['_Pt'] < 1:
            held = 'P'                         # (its P was reduced in an earlier iteration)
        state[e['name']] = {'Qmin': qlo, 'Qmax': qhi, 'held': held, 'over': over}
    return change, state


def acdc_flow(net, method='auto', tol=1e-8, max_iter=None, flat=False, outer=30, q_limits=False, limits=False):
    """The sequential AC/DC load flow of a Network (Beerten, Cole & Belmans 2012, Fig. 5). Every converter (vsc) gives its AC
    bus P_s and Q_s (or holds |U_s|, a PV bus); P_s of a converter with control 'P' follows from its P (into the DC grid,
    side 'dc') through the station, or is its P_ac (side 'ac'); P_s of the slack and the droops from the DC load flow.
    Returns the result of Network.power_flow for the AC part, with 'dc' (the DC load flow), 'converters' (per converter:
    P_s, Q_s, U_s, angle, P_c, Q_c, U_c, I_c, loss, P_dc, U_dc), 'outer' (the AC/DC iterations), 'converged' (both parts).
    4.21 — limits: hold the limits of the stations that have them (vsc Imax, Ucmax, Ucmin; _hold_limits, q_range); the result
    then has per converter 'Qmin', 'Qmax' (var at its P_s), 'held', 'over', and 'limits' (the stations that a limit holds).
    5.1.5 — LCC links (Network.lcc) without VSC stations: Newton on the voltages of their HT buses (_lcc_flow, THEORY §8ΩΩ.2);
    then 'dc' is None, 'converters' empty, and 'lcc' has per link its operating point (pcl.lcc._result).
    5.1.6 — LCC links with VSC stations too (the flow of the stations inside the Newton of the links, THEORY §8ΩΩΑ.6), and the
    tap changers of the stations of the links ('tap_rounds'; per link 'n_r', 'n_i', and 'losses_conv' of its stations)."""
    t0 = time.perf_counter()
    vs = [e for e in net.elements if e['kind'] == 'vsc']
    lc = [e for e in net.elements if e['kind'] == 'lcc']           # 5.1.5: the LCC links (pcl.lcc)
    if not vs and not lc:
        raise DCGridError('the network has no converters (vsc)')
    if lc:                                     # 5.1.6: with VSC stations too (their flow inside that of the links)
        return _lcc_flow(net, lc, vs, method, tol, max_iter, flat, outer, q_limits, limits, t0)
    return _vsc_flow(net, vs, method, tol, max_iter, flat, outer, q_limits, limits, t0)


def _vsc_flow(net, vs, method, tol, max_iter, flat, outer, q_limits, limits, t0):
    """The sequential AC/DC load flow of the VSC stations (acdc_flow; 5.1.6: a function of its own, for the links LCC)."""
    # 4.21: a converter that a dispatcher moves gives its AC bus what the DC grid decides, like the slack and the droops
    moved = {m for e in net.elements if e['kind'] == 'dc_dispatcher' for m in e['members']}
    S_base = net.S_base
    for e in vs:
        if flat or not limits:                 # 4.21: what an earlier run with limits left (none in a run before 4.21)
            for k in ('_Qfix', '_Qside', '_Pt'):
                e.pop(k, None)
        if e.get('_Ps') is None or flat:
            e['_Ps'] = (e['P'] if e.get('side') == 'ac' else -e['P']) / S_base if e['control'] == 'P' else 0.0
            e['_Qs'] = (e.get('Q') or 0.0) / S_base
    hist, ok, res, dres, lstate = [], False, None, None, {}
    for k in range(outer):
        used = {e['name']: e['_Ps'] for e in vs}
        res = net.power_flow(method=method, tol=tol, max_iter=max_iter, flat=flat and k == 0, q_limits=q_limits)
        if not res['converged']:
            break
        V, idx = res['_V'], res['_idx']
        for e in vs:                    # a converter that holds its AC voltage gives what its PV bus gives (it is alone there)
            if e.get('Vac') is not None and e.get('_Qfix') is None:
                e['_Qs'] = res['buses'][e['bus']]['Q'] / S_base
        for e in vs:                    # 5.0.15: a station that forms its island's voltage gives what its slack bus gives
            if e['control'] == 'Vf':
                d = res['buses'][e['bus']]
                e['_Ps'], e['_Qs'] = d['P'] / S_base, d['Q'] / S_base
                e['_Pdc'] = station(V[idx[e['bus']]], complex(e['_Ps'], e['_Qs']), _st(e), S_base, net.buses[e['bus']]['Un'])['Pdc']
        g = grid_of(net)
        gc = {c['name']: c for c in g.converters}
        for e in vs:                    # the converters with a given power: their P_dc (side 'ac') or their P_s (side 'dc')
            if e['control'] != 'P' or e['name'] in moved:
                continue
            Us, st, Ub = V[idx[e['bus']]], _st(e), net.buses[e['bus']]['Un']
            if e.get('side') == 'ac':
                gc[e['name']]['P'] = station(Us, complex(e['_Ps'], e['_Qs']), st, S_base, Ub)['Pdc']
            else:
                e['_Ps'] = station_inverse(Us, e['_Qs'], e['P'] if e.get('_Pt') is None else e['P'] * e['_Pt'], st, S_base, Ub, e['_Ps'])[0]
        dres = g.flow(tol=tol)
        if not dres['converged']:
            break
        for e in vs:                    # the slack and the droops: the AC power that gives the P_dc the DC grid asks of them
            if (e['control'] != 'P' or e['name'] in moved) and e['control'] != 'Vf':
                Us, st = V[idx[e['bus']]], _st(e)
                e['_Ps'] = station_inverse(Us, e['_Qs'], dres['converters'][e['name']]['P'], st, S_base, net.buses[e['bus']]['Un'], e['_Ps'])[0]
        change = max(abs(e['_Ps'] - used[e['name']]) for e in vs)
        if limits:                      # 4.21: the limits of the stations, after both parts
            dl, lstate = _hold_limits(net, vs, V, idx, moved, S_base)
            change = max(change, dl)
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
            if limits and e['name'] in lstate:
                q = lstate[e['name']]
                conv[e['name']].update(Qmin=None if q['Qmin'] is None else float(q['Qmin'] * S_base), Qmax=None if q['Qmax'] is None else float(q['Qmax'] * S_base),
                                       held=q['held'], over=q['over'], **{k: e[k] for k in LIMIT_KEYS[:3] if e.get(k)})
    out = dict(res or {})
    if limits:
        out['limits'] = [n for n, q in lstate.items() if q['held'] or q['over']]
    out.update(dc=dres, converters=conv, outer=len(hist), outer_change=hist, converged=bool(ok and dres and dres['converged']),
               time=time.perf_counter() - t0)
    out['losses_dc'] = dres['losses'] if dres else None
    out['losses_conv'] = sum(c['loss'] for c in conv.values())
    return out


def _lcc_result(net, lc, res):
    """5.1.5: the operating points of the LCC links at the AC voltages of the last AC flow."""
    from . import lcc as lccmod
    if res is None or '_V' not in res:
        return {}
    V, idx, out = res['_V'], res['_idx'], {}
    for e in lc:
        o = lccmod.operating_point(e, net.buses[e['rec']]['Un'], net.buses[e['inv']]['Un'], abs(V[idx[e['rec']]]), abs(V[idx[e['inv']]]))
        out[e['name']] = lccmod._result(e, o)
    return out


def _lcc_flow(net, lc, vs, method, tol, max_iter, flat, outer, q_limits, limits, t0):
    """5.1.5: the load flow of a network with LCC links (pcl.lcc). The AC flow takes the powers of the links as fixed
    injections, and the links follow the HT voltages of the AC flow («Power System Stability and Control», Fig. 10.52 and the
    procedure of §10.9.1). The plain alternation of the two diverges on weak AC systems (the benchmark, SCR 2,5: |V| of the
    rectifier 1,05 → 0,88 → 1,18 → 0,77 pu): the reactive power of a converter on current control rises steeply with its
    voltage. So the unknowns are the HT voltages E of the links, and Newton on Φ(E) − E = 0, Φ(E) the voltages of the AC
    flow with the injections of the links at E, its Jacobian by differences (two AC flows per link) at every iteration, the
    step at most 0,1 pu. 5.1.6: with VSC stations, Φ(E) is their sequential flow (_vsc_flow, with the powers of the links);
    and the tap changers of the stations (pcl.lcc.tap_step): in each round the inverters' move one step if they must, Newton
    again, then the rectifiers', Newton again, until none moves. Returns the result of power_flow (or of _vsc_flow) at the
    last E with 'lcc' (per link its operating point), 'outer' (the Newton iterations), 'outer_change' (max |Φ(E) − E|, pu),
    'tap_rounds', 'converged'; without VSC stations 'dc' None and 'converters' {}."""
    from . import lcc as lccmod
    if flat:
        for e in lc:
            for q in ('_Sr', '_Si', '_n'):
                e.pop(q, None)
    U = [(net.buses[e['rec']]['Un'], net.buses[e['inv']]['Un']) for e in lc]

    def flow(first=False):
        if vs:
            r = _vsc_flow(net, vs, method, tol, max_iter, flat and first, outer, q_limits, limits, time.perf_counter())
            if not r['converged']:
                raise DCGridError('the load flow AC/DC of the VSC stations does not converge with the powers of the LCC links')
        else:
            r = net.power_flow(method=method, tol=tol, max_iter=max_iter, flat=flat and first, q_limits=q_limits)
            if not r['converged']:
                raise DCGridError('the AC load flow does not converge with the powers of the LCC links')
        V, idx = r['_V'], r['_idx']
        return np.array([abs(V[idx[e[b]]]) for e in lc for b in ('rec', 'inv')]), r

    def phi(E):
        for j, e in enumerate(lc):
            try:
                o = lccmod.operating_point(e, U[j][0], U[j][1], E[2 * j], E[2 * j + 1])
            except lccmod.LCCError as x:
                raise DCGridError(str(x)) from None
            e['_Sr'], e['_Si'] = complex(o['Pr'], o['Qr']) / net.S_base, complex(o['Pi'], o['Qi']) / net.S_base
        return flow()

    def newton(E, hist):
        n, res = len(E), None
        for _ in range(outer):
            P, res = phi(E)
            F = P - E
            hist.append(float(np.max(np.abs(F))))
            if hist[-1] < tol:
                return E, res, True
            J = np.empty((n, n))
            for k in range(n):
                dE = np.zeros(n)
                dE[k] = 1e-6
                J[:, k] = (phi(E + dE)[0] - P) / 1e-6
            J -= np.eye(n)
            try:
                d = np.linalg.solve(J, -F)
            except np.linalg.LinAlgError:
                break
            d *= min(1.0, 0.1 / max(float(np.max(np.abs(d))), 1e-300))
            E = E + d
        return E, res, False

    E, res = flow(first=True)                       # with the estimates (or the powers of an earlier run)
    hist = []
    E, res, ok = newton(E, hist)
    rounds = 0
    if ok and any(e[s].get('oltc') for e in lc for s in ('r', 'i')):      # 5.1.6: the tap changers
        while rounds < 200:
            moved = False
            for side in ('i', 'r'):
                V, idx = res['_V'], res['_idx']
                m = False
                for j, e in enumerate(lc):
                    o = lccmod.operating_point(e, U[j][0], U[j][1], abs(V[idx[e['rec']]]), abs(V[idx[e['inv']]]))
                    m = lccmod.tap_step(e, o, side) or m
                if m:
                    moved = True
                    E, res, ok = newton(E, hist)
                    if not ok:
                        break
            if not moved or not ok:
                break
            rounds += 1
    if ok:
        phi(E)                                       # (the powers of the links at the last E, for the AC solvers after)
    out = dict(res or {})
    if not vs:
        out.update(dc=None, converters={}, losses_dc=None, losses_conv=0.0)
    out.update(outer=len(hist), outer_change=hist, converged=bool(ok and (not vs or (res or {}).get('converged'))),
               time=time.perf_counter() - t0, tap_rounds=rounds, lcc=_lcc_result(net, lc, res) if ok else {})
    return out


# ---------------------------------------------------------------------- 4.21: the optimal power flow AC/DC and N−1 AC/DC
def _station_parts(net, e):
    """The names of the internal buses and branches that acdc_opf gives a station (its filter bus f and converter bus c)."""
    return {'f': f"{e['name']}/f", 'c': f"{e['name']}/c", 'tr': f"{e['name']}/tr", 're': f"{e['name']}/re", 'flt': f"{e['name']}/filter", 'conv': f"{e['name']}/conv"}


def acdc_opf(net, flow_limits=True, tol=1e-6, max_iter=150, start='auto', dc_limits=(0.9, 1.1)):
    """4.21: the optimal power flow of a network with DC grids and converter stations (Ergun et al. 2019, the nonlinear
    bus-injection form; pcl.opf.solve with acdc). Each station's transformer, filter and phase reactor become AC branches and a
    shunt of the AC problem, with its filter bus f and its converter bus c as AC buses; the converter is a source at c (no cost,
    P within ±P_rated, Q within Q_min…Q_max, |V_c| within U_c,min…U_c,max), with the current I (≤ I_max) and the losses
    a + b·I + c·I² (c_inv where c_rec differs, as the reference implementation of the paper) towards the DC grid, whose voltages
    are unknowns within dc_limits (pu) and whose lines carry at most their rating (A). The stations' controls of the load flow
    (P, V, droop) do not bind the optimum: it chooses every converter's power. Returns the result of the AC problem for the
    buses and branches of the network, with 'converters' (per station: P_s, Q_s into its AC bus, P_c, Q_c, U_c, I_c (A), loss,
    P_dc, U_dc), 'dc' ('buses': V, U, P and the price 'lmp' of the DC bus; 'lines'; 'losses'), 'internal' (the f and c buses)."""
    from . import network as N
    from . import opf
    if any(e['kind'] in ('dcdc', 'dc_dispatcher') for e in net.elements):
        raise DCGridError('acdc_opf: the optimal power flow has no DC/DC converters and no dispatchers yet')
    vs = [e for e in net.elements if e['kind'] == 'vsc']
    if not vs:
        raise DCGridError('acdc_opf: the network has no converters (vsc)')
    if any(e['control'] == 'Vf' for e in vs):
        raise DCGridError('acdc_opf: the optimal power flow has no stations that form the voltage of an island (Vf) yet')
    S = net.S_base
    aug = N.from_dict(N.to_dict(net))
    for e in vs:
        aug.remove(e['name'])
    parts = {}
    for e in vs:
        nm, bus, Un = _station_parts(net, e), e['bus'], net.buses[e['bus']]['Un']
        at, lo, hi = bus, e.get('Ucmin'), e.get('Ucmax')
        if e.get('Rtr') or e.get('Xtr'):
            aug.bus(nm['f'], Un, Vmin=0.5, Vmax=1.5)
            aug.branch_pu(at, nm['f'], e.get('Rtr', 0.0), e.get('Xtr', 0.0), name=nm['tr'])
            at = nm['f']
        if e.get('Bf'):
            aug.shunt(at, Q=-e['Bf'] * S, name=nm['flt'])
        if e.get('Rc') or e.get('Xc'):
            aug.bus(nm['c'], Un, Vmin=lo if lo is not None else 0.5, Vmax=hi if hi is not None else 1.5)
            aug.branch_pu(at, nm['c'], e.get('Rc', 0.0), e.get('Xc', 0.0), name=nm['re'])
            at = nm['c']
        Pr = e.get('Prated')
        aug.generator(at, Sr=Pr or S, Ur=Un, xd2=0.2, cosphi=0.85, P=0.0, Pmin=-Pr if Pr else None, Pmax=Pr, Qmin=e.get('Qmin'), Qmax=e.get('Qmax'),
                      cost=(0.0, 0.0, 0.0), name=nm['conv'])
        parts[e['name']] = (nm, at)
    case = aug.case()
    G = opf.sources(aug, case)
    g = grid_of(net)
    dnames, Gs = g.conductance()
    dix = {b: i for i, b in enumerate(dnames)}
    Und = np.array([g.buses[b]['Un'] for b in dnames])
    Gp = Gs * Und[:, None] * Und[None, :] / S
    st = []
    for e in vs:
        nm, at = parts[e['name']]
        Ib = S / (SQ3 * net.buses[e['bus']]['Un'])
        cl = e.get('cinv', 0.0) if e.get('crec', 0.0) != e.get('cinv', 0.0) else e.get('crec', 0.0)
        st.append({'g': G['name'].index(nm['conv']), 'c': case.idx[at], 'd': dix[e['dc']], 'a': e.get('a_loss', 0.0) / S, 'b': e.get('b_loss', 0.0) * Ib / S,
                   'c2': cl * Ib * Ib / S, 'Imax': e['Imax'] / Ib if e.get('Imax') else 10.0, 'Ib': Ib})
    lines = [{'a': dix[ln['a']], 'b': dix[ln['b']], 'k': g.buses[ln['a']]['Un'] / (ln['poles'] * ln['R']), 'Irat': float(ln['rating'])}
             for ln in g.lines if ln.get('rating')]
    db = getattr(net, 'dc_buses', {})
    spec = {'nd': len(dnames), 'G': Gp, 'stations': st, 'lines': lines,
            'Umin': [db.get(b, {}).get('Vmin', dc_limits[0]) for b in dnames], 'Umax': [db.get(b, {}).get('Vmax', dc_limits[1]) for b in dnames]}
    r = opf.solve(aug, 'ac', flow_limits=flow_limits, start=start, tol=tol, max_iter=max_iter, acdc=spec)
    x = r['acdc']
    u, I = x['u'], x['I']
    U = u * Und
    internal = {n for nm, _ in parts.values() for n in (nm['f'], nm['c'])}
    ibr = {n for nm, _ in parts.values() for n in (nm['tr'], nm['re'])}
    out = {k: v for k, v in r.items() if k not in ('buses', 'branches', 'sources', 'acdc', '_raw')}
    out['kind'] = 'acdc'
    out['buses'] = {b: d for b, d in r['buses'].items() if b not in internal}
    out['internal'] = {b: d for b, d in r['buses'].items() if b in internal}
    out['branches'] = [q for q in r['branches'] if q['name'] not in ibr]
    srcs = {nm['conv'] for nm, _ in parts.values()}
    out['sources'] = [q for q in r['sources'] if q['name'] not in srcs]
    byname = {q['name']: q for q in r['branches']}
    bys = {q['name']: q for q in r['sources']}
    conv = {}
    for j, (e, q) in enumerate(zip(vs, st)):
        nm, at = parts[e['name']]
        cs = bys[nm['conv']]
        first = byname.get(nm['tr']) or byname.get(nm['re'])
        Ps, Qs = (-first['Pa'], -first['Qa']) if first else (cs['P'], cs['Q'])
        Ic = I[j]
        loss = (q['a'] + q['b'] * Ic + q['c2'] * Ic * Ic) * S
        Pdc = -cs['P'] - loss
        conv[e['name']] = {'bus': e['bus'], 'dc': e['dc'], 'Ps': float(Ps), 'Qs': float(Qs), 'Pc': float(cs['P']), 'Qc': float(cs['Q']),
                           'Uc': float(r['buses'][at]['V']), 'Ic': float(Ic * q['Ib']), 'loss': float(loss), 'Pdc': float(Pdc), 'Udc': float(U[q['d']])}
    Pd = U * (Gs @ U)
    dres = {'buses': {b: {'V': float(u[i]), 'U': float(U[i]), 'P': float(Pd[i]), 'lmp': float(x['lam_dc'][i])} for i, b in enumerate(dnames)}, 'lines': []}
    loss_dc = 0.0
    for ln in g.lines:
        ua, ub = U[dix[ln['a']]], U[dix[ln['b']]]
        Il = (ua - ub) / (ln['poles'] * ln['R'])
        dres['lines'].append({'name': ln['name'], 'a': ln['a'], 'b': ln['b'], 'I': float(Il), 'Pa': float(ua * Il), 'Pb': float(-ub * Il), 'loss': float((ua - ub) * Il),
                              'rating': ln['rating'], 'loading': abs(Il) / ln['rating'] if ln['rating'] else None})
        loss_dc += (ua - ub) * Il
    for b, d in g.buses.items():
        if d.get('R'):
            loss_dc += U[dix[b]] ** 2 / d['R']
    dres['losses'] = float(loss_dc)
    out.update(converters=conv, dc=dres, losses_dc=float(loss_dc), losses_conv=float(sum(c['loss'] for c in conv.values())))
    return out


def acdc_contingency(net, outages=None, limits=True, tol=1e-8, method='auto'):
    """4.21: N−1 of a network with DC grids: the sequential AC/DC load flow (acdc_flow, with the limits of the stations by
    default) after the outage of every AC branch, DC line, converter station and DC/DC converter (or of those named), one at a
    time: the stations are not fixed injections as in the N−1 of the AC network (Network.contingency), and their controls
    (slack, droops, dispatchers) take what the outage moves. An outage that leaves a DC grid without a converter that holds
    its voltage is reported as such. Returns {'base': the summary before any outage, 'outages': [{'name', 'kind', 'converged',
    'message', 'loading' (the largest of the AC branches with a rating and of the DC lines with one), 'where', 'Vmin', 'Vmax' (AC,
    pu), 'Vdc_min', 'Vdc_max' (pu), 'limits' (the stations that a limit holds), 'overloads': [(name, loading)]}], 'worst', 'failed', 'time',
    'flow' (the AC/DC load flow before any outage, as acdc_flow gives it)}."""
    from . import network as N
    t0 = time.perf_counter()
    kinds = ('line', 'branch', 'transformer', 'dc_line', 'vsc', 'dcdc')
    names = [e['name'] for e in net.elements if e['kind'] in kinds] if outages is None else [str(n) for n in outages]
    data = N.to_dict(net)
    c = net.case()
    rate = {c.br_name[k]: c.rate[k] * net.S_base for k in range(c.nl) if np.isfinite(c.rate[k]) and c.rate[k] > 0}

    full = {}

    def one(n, name=None):
        q = {'name': name, 'kind': None if name is None else net.element(name)['kind'], 'converged': False, 'message': '', 'loading': None, 'where': None,
             'Vmin': None, 'Vmax': None, 'Vdc_min': None, 'Vdc_max': None, 'limits': [], 'overloads': []}
        try:
            r = n.acdc_flow(method=method, tol=tol, limits=limits)
        except (DCGridError, N.NetworkError, ValueError) as ex:
            q['message'] = str(ex)
            return q
        if name is None:
            full['r'] = r
        q['converged'] = bool(r['converged'])
        if not q['converged']:
            q['message'] = 'η ροή φορτίου AC/DC δεν συνέκλινε'
            return q
        ld = [(b['name'], float(b['S'] / rate[b['name']])) for b in r['branches'] if b['name'] in rate]
        ld += [(ln['name'], float(ln['loading'])) for ln in r['dc']['lines'] if ln.get('loading') is not None]
        if ld:
            q['where'], q['loading'] = max(ld, key=lambda z: z[1])
            q['overloads'] = sorted([z for z in ld if z[1] > 1.0], key=lambda z: -z[1])
        V = [d['V'] for d in r['buses'].values()]
        Vd = [d['V'] for d in r['dc']['buses'].values()]
        q.update(Vmin=min(V), Vmax=max(V), Vdc_min=min(Vd) if Vd else None, Vdc_max=max(Vd) if Vd else None, limits=list(r.get('limits') or []))
        return q
    base = one(N.from_dict(data))
    out = []
    for name in names:
        n = N.from_dict(data)
        n.remove(name)
        if net.element(name)['kind'] == 'vsc':           # a converter out also leaves its dispatcher
            for e in n.elements:
                if e['kind'] == 'dc_dispatcher' and name in e['members']:
                    w = e.get('weights')
                    keep = [k for k, m in enumerate(e['members']) if m != name]
                    e['members'] = [e['members'][k] for k in keep]
                    if w is not None:
                        e['weights'] = [w[k] for k in keep]
            n.elements = [e for e in n.elements if e['kind'] != 'dc_dispatcher' or e['members']]
        out.append(one(n, name))
    ok = [q for q in out if q['converged'] and q['loading'] is not None]
    worst = max(ok, key=lambda q: q['loading'])['name'] if ok else None
    return {'base': base, 'outages': out, 'worst': worst, 'failed': [q['name'] for q in out if not q['converged']], 'time': time.perf_counter() - t0,
            'flow': full.get('r')}


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
    1 pu); every other converter holds its power reference; the DC/DC converters (dcdc, 4.21) move their power, without losses. out: names
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
    for name, a, b, S, P in B4_DCDC:           # 4.21: one element (dcdc), lossless: the same numbers as the two converters 'P' of 4.20.1
        if name not in out:
            g.dcdc(a, b, 'P', P=P * 1e6, Prated=S * 1e6, name=name)
    return g


def b4_network():
    """The CIGRE B4 of cigre_b4() as a pcl.network.Network (the case 'b4' of pcl/data, for the study 'acdc' and the diagram): every
    converter on an AC bus of its own with a feeder of 10 GVA as its slack (the book gives only the lengths and flows of the AC
    systems), the stations without losses (side 'dc'), P_rated = the rating of Table 27.11; each DC/DC converter one element
    (dcdc, 4.21; in 4.20.1 two converters 'P' on AC buses of their own, −P and +P)."""
    from . import network as N
    net = N.Network(f=50.0, S_base=100e6, name='CIGRE B4 DC grid test system (Jovcic 2019, §27.8, Fig. 27.6, Tables 7.3 and 27.11)')
    held = {'Cm-A1', 'Cm-B3', 'Cb-A1'}
    for b, grid in B4_BUSES.items():
        net.dc_bus(b, B4_UN[grid])
    for a, b, km, kind, n in B4_LINES:
        R, L, C, _ = b4_line_data(a, km, kind)
        for k in range(n):                     # (5.0.15: with L and C for the RMS dynamics; the load flow sees R only)
            net.dc_line(a, b, R=R, L=L, C=C, poles=2, name=f'{a}–{b}' + (f'#{k + 1}' if n > 1 else ''))

    def ac(name):
        bus = 'AC ' + name
        net.bus(bus, 400e3)
        net.feeder(bus, Sk=10e9, RX=0.1, name='Q ' + name)
        return bus
    for name, bus, S, P in B4_STATIONS:
        P = (-900 if name == 'Cm-B3' else 0) if P is None else P          # the reference of a station that holds the voltage
        net.vsc(ac(name), bus, control='V' if name in held else 'P', P=P * 1e6, V=1.0, Prated=S * 1e6, name=name)
    for name, a, b, S, P in B4_DCDC:           # 4.21: one element (dcdc) with no AC side, not two converters on AC buses of their own
        net.dcdc(a, b, control='P', P=P * 1e6, Prated=S * 1e6, name=name)
    return net



# ---------------------------------------------------------------------- 5.0.15: the DCS2 of the tutorial b4dcs2 for the RMS
B4_DCS2_SN = {'Cm-B3': 1200e6, 'Cm-B2': 800e6, 'Cm-E1': 200e6, 'Cm-F1': 800e6}


def b4_dcs2_network(ctl='vdc', kd=0.05):
    """5.0.15 (THEORY §8ΩΟ): the DCS2 of the tutorial b4dcs2 as a pcl.network.Network, for its RMS dynamics (Network.dynamic)
    against its EMT. The DC grid of the B4 (Jovcic 2019, §27.8, Tables 7.3 and 27.11): the five buses ±200 kV, the four links with
    R, L and C of Table 7.3 (G left out, as the EMT). The stations as the tutorial: Cm-B3 (1200 MVA) holds V_dc (ctl 'vdc') or
    droops (ctl 'droop', k_d), Cm-B2 (800 MVA) gives 150 MW or droops, both through a transformer 400/208 kV (u_k 18 %) from a
    network of 400 kV, S″k 10 GVA, R/X 0.1; Cm-E1 (200 MVA) and Cm-F1 (800 MVA) form the voltage of their islands (Vf) through
    a transformer 208/145 kV: a load of 100 MW (constant impedance) at E1, a wind farm of 500 MW (the generator 'WF', for a
    grid-following converter of pcl.rms) at F1. The DC/DC converter Cd-E1 brings 300 MW from the DC bus Bb-E1 of DCS3, which
    the station 'Cb-E1x' holds at 1 pu from a stiff network (our stand-in: the EMT has only the DC side of Cd-E1)."""
    from . import network as N
    if ctl not in ('vdc', 'droop'):
        raise DCGridError("b4_dcs2_network: ctl 'vdc' or 'droop'")
    net = N.Network(f=50.0, S_base=100e6, name='DCS2 of the CIGRE B4 as the tutorial b4dcs2 (5.0.15)')
    for b in ('Bm-B2', 'Bm-B3', 'Bm-B5', 'Bm-F1', 'Bm-E1'):
        net.dc_bus(b, 400e3)
    net.dc_bus('Bb-E1', 800e3)
    for a, b, km, kind, n in B4_LINES:
        if B4_BUSES[a] == 'DCS2':
            R, L, C, _ = b4_line_data(a, km, kind)
            net.dc_line(a, b, R=R, L=L, C=C, poles=2, name=f'{a}–{b}')
    for k, U in (('B3', 400e3), ('B2', 400e3)):
        net.bus(k, U)
        net.feeder(k, Sk=10e9, RX=0.1, name='Q ' + k)
        net.bus(k + 'v', 208e3)
        net.transformer(k, k + 'v', B4_DCS2_SN['Cm-' + k], 400e3, 208e3, 18.0, group='YNd1', name='T ' + k)
    for k in ('E1', 'F1'):
        net.bus(k, 145e3)
        net.bus(k + 'v', 208e3)
        net.transformer(k + 'v', k, B4_DCS2_SN['Cm-' + k], 208e3, 145e3, 18.0, group='YNd1', name='T ' + k)
    net.load('E1', 100e6, 0.0, zip=(1.0, 0.0, 0.0), name='load E1')
    net.generator('F1', 600e6, 145e3, 0.2, 1.0, P=500e6, name='WF')
    if ctl == 'vdc':
        net.vsc('B3v', 'Bm-B3', control='V', V=1.0, P=-900e6, Prated=1200e6, name='Cm-B3')
        net.vsc('B2v', 'Bm-B2', control='P', P=150e6, Prated=800e6, name='Cm-B2')
    else:
        net.vsc('B3v', 'Bm-B3', control='droop', P=-900e6, V=1.0, droop=kd, Prated=1200e6, name='Cm-B3')
        net.vsc('B2v', 'Bm-B2', control='droop', P=150e6, V=1.0, droop=kd, Prated=800e6, name='Cm-B2')
    net.vsc('E1v', 'Bm-E1', control='Vf', Vac=1.0, Prated=200e6, name='Cm-E1')
    net.vsc('F1v', 'Bm-F1', control='Vf', Vac=1.0, Prated=800e6, name='Cm-F1')
    net.bus('X', 400e3)
    net.feeder('X', Sk=100e9, RX=0.1, name='Q X')
    net.vsc('X', 'Bb-E1', control='V', V=1.0, Prated=2400e6, name='Cb-E1x')
    net.dcdc('Bb-E1', 'Bm-E1', control='P', P=300e6, Prated=1000e6, name='Cd-E1')
    return net


def b4_dcs2_stations(dcside='model4'):
    """5.0.15: the dynamic data of the stations of b4_dcs2_network() as the tutorial b4dcs2 (pcl.rms.STATION_DEFAULTS): the
    per-unit values of its MMCC (X 0.075 the arm, T_p, T_q, T_vdc 0.1 s, H 0.03 s, T_vf 0.05 s), W 30 kJ/MVA, R of the arms
    (N·R_on/2 = 0.2 Ω on the AC side of each station), the lag of Cd-E1 5 ms (its low-pass in the EMT); values of an example.
    dcside 'bus': the capacitance of each station on its DC bus (CIGRE TB 604, §2.6.1); 'model4': the DC side of the MMC of
    Model 4 of the EMT, the capacitance behind 2L_arm/3, with the active damping 2R_d/3 (R_d 20 Ω) above 10 Hz (without its
    2N·R_on/3, a loss of the MMC that the load flow has not)."""
    if dcside not in ('bus', 'model4'):
        raise DCGridError("b4_dcs2_stations: dcside 'bus' or 'model4'")
    Zb = {k: 208e3 ** 2 / S for k, S in B4_DCS2_SN.items()}
    st = {k: {'Sn': S, 'X': 0.075, 'R': 0.2 / Zb[k], 'Tp': 0.1, 'Tq': 0.1, 'Tvdc': 0.1, 'H': 0.03, 'W': 30.0} for k, S in B4_DCS2_SN.items()}
    for k in ('Cm-E1', 'Cm-F1'):
        st[k]['Tvf'] = 0.05
    if dcside == 'model4':
        for k in B4_DCS2_SN:
            La = 0.15 * Zb[k] / (2 * math.pi * 50.0)
            st[k].update(Ldc=2 * La / 3, Rd=2 * 20.0 / 3, fd=10.0)
    st['Cd-E1'] = {'Tdc': 0.005}
    return st
