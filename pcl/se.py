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
- 4.21 (our own formulation, ROADMAP §87): phasor measurements (PMU) as the real and imaginary parts of a bus voltage and of the
  current into a branch at either end, all on one common time reference; with a voltage phasor the angles are measured, so
  every angle is a state and no bus is the reference, and the estimate starts from the voltage phasors. Current magnitudes |I|
  at either end of a branch; without voltage phasors a set with |I| starts from the estimate without them, since at a flat
  start the current of a branch without charging is zero and its magnitude has no direction. The measurements from an EMT run
  (from_emt): the synchrophasors of positive sequence at points of the network (as IEC/IEEE 60255-118-1 defines them), in SI,
  made per unit; their total vector error (TVE, (9) of the standard).

Everything is in per unit on the base of the network. Only NumPy and SciPy."""
import math
import time

import numpy as np
import scipy.sparse as sp
import scipy.sparse.linalg as spla

from . import powerflow as PF

TYPES = ('V', 'P', 'Q', 'Pf', 'Qf', 'Pt', 'Qt', 'Vr', 'Vi', 'Ifr', 'Ifi', 'Itr', 'Iti', 'If', 'It')
BASIC = TYPES[:7]                                          # the types of 4.19.5: without them nothing of 4.21 is computed
PHASOR = ('Vr', 'Vi', 'Ifr', 'Ifi', 'Itr', 'Iti')         # 4.21: PMU, the real and imaginary parts on the common time reference
TXT = {'V': 'τάση ζυγού', 'P': 'έγχυση P', 'Q': 'έγχυση Q', 'Pf': 'ροή P (άκρο «από»)', 'Qf': 'ροή Q (άκρο «από»)',
       'Pt': 'ροή P (άκρο «προς»)', 'Qt': 'ροή Q (άκρο «προς»)', 'Vr': 'φασιθέτης τάσης (πραγματικό)', 'Vi': 'φασιθέτης τάσης (φανταστικό)',
       'Ifr': 'φασιθέτης ρεύματος, άκρο «από» (πραγματικό)', 'Ifi': 'φασιθέτης ρεύματος, άκρο «από» (φανταστικό)',
       'Itr': 'φασιθέτης ρεύματος, άκρο «προς» (πραγματικό)', 'Iti': 'φασιθέτης ρεύματος, άκρο «προς» (φανταστικό)',
       'If': '|I| κλάδου (άκρο «από»)', 'It': '|I| κλάδου (άκρο «προς»)'}
SIGMA = {'V': 0.004, 'flow': 0.008, 'inj': 0.010, 'pmu': 0.002, 'I': 0.008}   # pu: the first three those of the examples of the book;
                                                           # 4.21: each part of a phasor, and |I|, are our example values
PLANS = ('all', 'scada', 'flows', 'tree')
EMT_PLANS = ('scada', 'pmu', 'mixed', 'current')          # 4.21: what is made of the points of an EMT run (from_emt)
BAD = {'flow': ['Pf'], 'injection': ['P'], 'voltage': ['V'], 'two': ['Pf', 'P'], 'current': ['If'], 'phasor': ['Vi']}
PLAN_TXT = {'all': 'τάση και εγχύσεις σε κάθε ζυγό, ροές στα δύο άκρα κάθε κλάδου', 'scada': 'τάση στους ζυγούς με γεννήτρια, εγχύσεις σε κάθε ζυγό, ροές στο ένα άκρο κάθε κλάδου',
            'flows': 'τάση στον ζυγό ταλάντωσης και ροές στο ένα άκρο κάθε κλάδου', 'tree': 'τάση στον ζυγό ταλάντωσης και ροές μόνο στους κλάδους ενός δέντρου (καμία περίσσεια)',
            'emt-scada': 'από το EMT: |V| και ροές P, Q σε κάθε σημείο μέτρησης', 'emt-pmu': 'από το EMT: φασιθέτες τάσης και ρεύματος (PMU) σε κάθε σημείο μέτρησης',
            'emt-mixed': 'από το EMT: |V| και ροές P, Q, και ένας φασιθέτης τάσης', 'emt-current': 'από το EMT: |V|, ροές P και |I| σε κάθε σημείο, με τους φασιθέτες τάσης'}
CRITICAL = 1e-8                                            # Ω_ii below this part of σ²: the measurement is critical
SINGULAR = 1e-13                                           # smallest pivot against the largest of the scaled matrix: singular


class SeError(ValueError):
    pass


def _class(kind):
    return 'V' if kind == 'V' else 'inj' if kind in ('P', 'Q') else 'pmu' if kind in PHASOR else 'I' if kind in ('If', 'It') else 'flow'


def _at_bus(kind):
    return kind in ('V', 'P', 'Q', 'Vr', 'Vi')


def _chi2(p, k):
    """The value that a χ² variable with k degrees of freedom stays below with probability p."""
    from scipy.special import chdtri
    return float(chdtri(k, 1.0 - p)) if k > 0 else 0.0


# -------------------------------------------------------------------- the measured quantities and their derivatives
def quantities(case, V, deriv=True, extra=False):
    """Every quantity that can be measured, at the voltages V, in the order: |V| of every bus, P and Q injected at every
    bus (generation minus load, what the bus gives to the network), P and Q into every branch at its «from» end and at its
    «to» end. Returns (h, A): the values (3·n + 4·nl) and, with deriv, their derivatives as a sparse matrix whose columns
    are the angle of every bus and then the magnitude of every bus. With extra (4.21) also: the real and the imaginary part of
    every bus voltage, of the current into every branch at its «from» end and at its «to» end, and the magnitudes of those
    currents (5·n + 10·nl in all)."""
    n, nl = case.n, case.nl
    Vm = np.abs(V)
    I = case.Y @ V
    Sb = V * np.conj(I)
    If, It = case.Yf @ V, case.Yt @ V
    Sf, St = V[case.f] * np.conj(If), V[case.t] * np.conj(It)
    h = np.r_[Vm, Sb.real, Sb.imag, Sf.real, Sf.imag, St.real, St.imag]
    if extra:
        h = np.r_[h, V.real, V.imag, If.real, If.imag, It.real, It.imag, np.abs(If), np.abs(It)]
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
    if extra:
        jV, eV = sp.diags(1j * V), sp.diags(V / Vm)                             # ∂V/∂θ and ∂V/∂|V|
        rows += [sp.hstack([jV.real, eV.real]), sp.hstack([jV.imag, eV.imag])]
        dI = [(Yb @ jV, Yb @ eV) for Yb in (case.Yf, case.Yt)]
        for da, dm in dI:
            rows += [sp.hstack([da.real, dm.real]), sp.hstack([da.imag, dm.imag])]
        for (da, dm), Ib in zip(dI, (If, It)):                                    # ∂|I| = Re(conj(I)·∂I)/|I|
            u = sp.diags(np.conj(Ib) / np.maximum(np.abs(Ib), 1e-12))
            rows += [sp.hstack([(u @ da).real, (u @ dm).real])]
    return h, sp.vstack(rows, format='csr')


def _rows(case, meas):
    """The row of every measurement in the list of quantities, its value and its standard deviation."""
    n, nl = case.n, case.nl
    off = {'V': 0, 'P': n, 'Q': 2 * n, 'Pf': 3 * n, 'Qf': 3 * n + nl, 'Pt': 3 * n + 2 * nl, 'Qt': 3 * n + 3 * nl,
           'Vr': 3 * n + 4 * nl, 'Vi': 4 * n + 4 * nl, 'Ifr': 5 * n + 4 * nl, 'Ifi': 5 * n + 5 * nl, 'Itr': 5 * n + 6 * nl, 'Iti': 5 * n + 7 * nl,
           'If': 5 * n + 8 * nl, 'It': 5 * n + 9 * nl}
    bri = {b: i for i, b in enumerate(case.br_name)}
    row, z, s = [], [], []
    for i, m in enumerate(meas):
        kind = m.get('type')
        if kind not in TYPES:
            raise SeError(f'measurement {i}: type one of {", ".join(TYPES)}')
        if _at_bus(kind):
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
def measure(net, plan='scada', noise=1.0, seed=1, sigma=None, bad=None, zero_injections=True, pmu=None, currents=False):
    """A set of measurements from the load flow of the network (for studies and tests): the plan says where the meters are,
    noise scales the Gaussian errors (0: exact values, the standard deviations stay), seed makes them repeatable, and bad
    puts gross errors: a list of {'type', 'bus' or 'branch', 'error' (in standard deviations, default 20)}, or 'flow',
    'injection', 'voltage', 'two' for the usual cases. With zero_injections the buses without load and generation are
    not measured (the estimator knows that they inject nothing). 4.21: pmu, a list of buses (or 'all') with a phasor
    measurement unit: the voltage phasor of the bus and the current phasor of every branch at it, at the end on that bus;
    currents: the magnitude |I| at the «from» end of every branch whose flow is measured.
    Returns {'measurements': [...], 'truth': the load flow, 'plan', 'bad': the indices of the gross errors}."""
    if plan not in PLANS:
        raise SeError(f'plan: one of {", ".join(PLANS)}')
    sg = dict(SIGMA, **(sigma or {}))
    lf = net.power_flow('nr', tol=1e-10)
    if not lf['converged']:
        raise SeError('the load flow of the network does not converge: no measurements to take')
    case = net.case()
    V = lf['_V']
    pmus = list(case.names) if pmu == 'all' else list(pmu or [])
    for b in pmus:
        if b not in case.idx:
            raise SeError(f'pmu: no bus {b!r}')
    h, _ = quantities(case, V, deriv=False, extra=bool(pmus or currents))
    n, nl = case.n, case.nl
    zi = set(zero_injection(case).tolist()) if zero_injections else set()
    ref = np.flatnonzero(case.typ == PF.REF)
    meas = []

    def add(kind, where, row):
        key = 'bus' if _at_bus(kind) else 'branch'
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
        if currents:
            add('If', case.br_name[k], 5 * n + 8 * nl + k)
    for b in pmus:                                           # 4.21: the voltage phasor, and the current phasor of every branch at the bus
        i = case.idx[b]
        add('Vr', b, 3 * n + 4 * nl + i)
        add('Vi', b, 4 * n + 4 * nl + i)
        for k in np.flatnonzero((case.f == i) | (case.t == i)):
            o = 4 * nl if case.f[k] == i else 6 * nl
            add('Ifr' if case.f[k] == i else 'Itr', case.br_name[k], 5 * n + o + k)
            add('Ifi' if case.f[k] == i else 'Iti', case.br_name[k], 5 * n + o + nl + k)
    rng = np.random.default_rng(seed)
    e = rng.standard_normal(len(meas)) * float(noise)
    for m, ei in zip(meas, e):
        m['true'] = m['value']
        m['value'] = m['value'] + ei * m['sigma']
    return {'measurements': meas, 'truth': lf, 'plan': plan, 'bad': _plant(meas, bad, plan)}


def _plant(meas, bad, plan):
    """The gross errors of measure() and from_emt(): a list of {'type', 'bus' or 'branch', 'error' (σ, default 20)}, or one of
    BAD; returns the indices of the measurements that got one."""
    hit = []
    if bad:
        if isinstance(bad, str):
            val = lambda kind: [(abs(m['true']), i) for i, m in enumerate(meas) if m['type'] == kind]
            pick = BAD.get(bad)
            if pick is None:
                raise SeError(f"bad: {', '.join(repr(b) for b in BAD)} or a list of measurements")
            bad = []
            for kind in pick:
                c = val(kind)
                if not c:
                    raise SeError(f'Το σχέδιο μετρήσεων «{plan}» δεν έχει μέτρηση αυτού του είδους ({TXT[kind]}): διάλεξε άλλη λανθασμένη μέτρηση ή άλλο σχέδιο.')
                i = max(c)[1] if kind != 'V' else min(c)[1]                    # the largest flow, the largest injection, the lowest voltage
                bad.append(dict({k: meas[i][k] for k in ('type', 'bus', 'branch') if k in meas[i]}, error=20.0 if kind != 'P' else -20.0))
        for b in bad:
            key = 'bus' if _at_bus(b['type']) else 'branch'
            i = next((i for i, m in enumerate(meas) if m['type'] == b['type'] and m.get(key) == b.get(key)), None)
            if i is None:
                raise SeError(f'bad: no measurement {b["type"]} at {b.get(key)!r} in the plan {plan!r}')
            meas[i]['value'] += float(b.get('error', 20.0)) * meas[i]['sigma']
            meas[i]['gross'] = float(b.get('error', 20.0))
            hit.append(i)
    return hit


def tve(X, ref):
    """The total vector error of a phasor against the one it should be: |X − X_ref|/|X_ref| (a ratio; IEC/IEEE 60255-118-1 (9)
    on the real and imaginary parts)."""
    return float(abs(complex(X) - complex(ref)) / abs(complex(ref)))


def from_emt(net, points, plan='scada', sigma=None, bad=None, ref='cos'):
    """4.21: the measurements of the network from points of an EMT run of it (the PMU3 element of the studio, or anything that
    gives the same): points [{'branch', 'end' ('f' or 't': the current into the branch at that end, the voltage of its bus),
    'V' (V, the RMS phase voltage of positive sequence), 'thV' (°), 'I' (A, RMS of positive sequence), 'thI' (°), and, when
    the point gives them, 'P' (W), 'Q' (var) of positive sequence into the branch}]. The angles on the common time reference of
    the run: ref 'cos' as IEC/IEEE 60255-118-1 defines a synchrophasor (§4.2–4.3: the phase of cos(2πf₀t + φ), t = 0 at a UTC
    second, the RMS value), or 'sin' (the phase of sin(ω₁t + φ)). The sources of the studio are written on the sine, so a load
    flow angle θ is a synchrophasor θ − 90°: with 'cos' the 90° are added back (the state on the frame of the load flow). Per unit on the
    voltage of each bus and S_base. plan (EMT_PLANS): 'scada' |V| of every bus with a point, P and Q of every point; 'pmu' the
    voltage phasor of every bus with a point and the current phasor of every point; 'mixed' scada and the voltage phasor of the
    first point's bus; 'current' |V|, P and |I| of every point with the voltage phasors of its buses. bad as in measure().
    Returns as measure(), with the load flow of the network as the 'truth' (every 'true' its value there) and 'tve' {'V', 'I':
    the largest total vector error of a point against the load flow, 'V_at', 'I_at', 'points': [{branch, end, bus, V, I}]}."""
    if plan not in EMT_PLANS:
        raise SeError(f'plan: one of {", ".join(EMT_PLANS)}')
    if ref not in ('cos', 'sin'):
        raise SeError("ref: 'cos' (IEC/IEEE 60255-118-1) or 'sin'")
    turn = 90.0 if ref == 'cos' else 0.0
    if not points:
        raise SeError('no points of the EMT run')
    sg = dict(SIGMA, **(sigma or {}))
    lf = net.power_flow('nr', tol=1e-10)
    if not lf['converged']:
        raise SeError('the load flow of the network does not converge: no truth to compare with')
    case = net.case()
    V = lf['_V']
    h, _ = quantities(case, V, deriv=False, extra=True)
    n, nl = case.n, case.nl
    bri = {b: i for i, b in enumerate(case.br_name)}
    off = lambda kind: {'V': 0, 'Pf': 3 * n, 'Qf': 3 * n + nl, 'Pt': 3 * n + 2 * nl, 'Qt': 3 * n + 3 * nl, 'Vr': 3 * n + 4 * nl, 'Vi': 4 * n + 4 * nl,      # noqa: E731
                        'Ifr': 5 * n + 4 * nl, 'Ifi': 5 * n + 5 * nl, 'Itr': 5 * n + 6 * nl, 'Iti': 5 * n + 7 * nl, 'If': 5 * n + 8 * nl, 'It': 5 * n + 9 * nl}[kind]
    meas, seen, pts = [], set(), []
    Sb = float(net.S_base)

    def add(kind, where, value):
        at = case.idx[where] if _at_bus(kind) else bri[where]
        meas.append({'type': kind, 'bus' if _at_bus(kind) else 'branch': where, 'value': float(value), 'sigma': sg[_class(kind)], 'true': float(h[off(kind) + at])})

    for j, q in enumerate(points):
        if q.get('branch') not in bri:
            raise SeError(f'point {j}: no branch {q.get("branch")!r}')
        k, e = bri[q['branch']], q.get('end', 'f')
        if e not in ('f', 't'):
            raise SeError(f"point {j}: end 'f' or 't'")
        try:
            Vm, Im, a, b = float(q['V']), float(q['I']), math.radians(float(q['thV']) + turn), math.radians(float(q['thI']) + turn)
        except (KeyError, TypeError, ValueError) as err:
            raise SeError(f'point {j}: V, thV, I and thI as numbers') from err
        if not all(map(math.isfinite, (Vm, Im, a, b))) or Vm <= 0:
            raise SeError(f'point {j}: a voltage above zero (has the run reached the end of its first window?)')
        i = int(case.f[k] if e == 'f' else case.t[k])
        bus = case.names[i]
        Un = float(net.buses[bus]['Un'])
        Vp = Vm / (Un / math.sqrt(3)) * complex(math.cos(a), math.sin(a))
        Ip = Im / (Sb / (math.sqrt(3) * Un)) * complex(math.cos(b), math.sin(b))
        S = complex(float(q['P']), float(q['Q'])) / Sb if q.get('P') is not None and q.get('Q') is not None else Vp * Ip.conjugate()
        Il = complex(h[off('Ifr' if e == 'f' else 'Itr') + k], h[off('Ifi' if e == 'f' else 'Iti') + k])
        pts.append({'branch': q['branch'], 'end': e, 'bus': bus, 'V': tve(Vp, V[i]), 'I': tve(Ip, Il) if abs(Il) > 0 else None, '_V': Vp, '_I': Ip, '_S': S})
    for q in pts:
        b, k, e = q['bus'], q['branch'], q['end']
        if b not in seen:
            seen.add(b)
            if plan in ('scada', 'mixed', 'current'):
                add('V', b, abs(q['_V']))
            if plan in ('pmu', 'current') or (plan == 'mixed' and len(seen) == 1):
                add('Vr', b, q['_V'].real)
                add('Vi', b, q['_V'].imag)
        if plan in ('scada', 'mixed', 'current'):
            add('Pf' if e == 'f' else 'Pt', k, q['_S'].real)
        if plan in ('scada', 'mixed'):
            add('Qf' if e == 'f' else 'Qt', k, q['_S'].imag)
        if plan == 'current':
            add('If' if e == 'f' else 'It', k, abs(q['_I']))
        if plan == 'pmu':
            add('Ifr' if e == 'f' else 'Itr', k, q['_I'].real)
            add('Ifi' if e == 'f' else 'Iti', k, q['_I'].imag)
    hit = _plant(meas, bad, 'emt-' + plan)
    iv = [q for q in pts if q['I'] is not None]
    worst_v, worst_i = max(pts, key=lambda q: q['V']), (max(iv, key=lambda q: q['I']) if iv else None)
    return {'measurements': meas, 'truth': lf, 'plan': 'emt-' + plan, 'bad': hit,
            'tve': {'V': worst_v['V'], 'V_at': worst_v['bus'], 'I': None if worst_i is None else worst_i['I'], 'I_at': None if worst_i is None else worst_i['branch'],
                    'points': [{k: q[k] for k in ('branch', 'end', 'bus', 'V', 'I')} for q in pts]}}


# -------------------------------------------------------------------- the estimator
class _Problem:
    """One weighted least squares problem: the measurements in use, the equality constraints, the reference."""

    def __init__(self, case, row, z, s, crow, V0, extra=False, absolute=False):
        self.case, self.row, self.z, self.s, self.crow = case, row, z, s, crow
        n = case.n
        self.ref = int(np.flatnonzero(case.typ == PF.REF)[0])
        self.extra, self.absolute = extra, absolute
        self.na = n if absolute else n - 1                                            # 4.21: with a voltage phasor every angle is a state
        self.cols = np.r_[np.arange(n) if absolute else np.delete(np.arange(n), self.ref), n + np.arange(n)]   # the state: angles (but the reference), magnitudes
        self.ns, self.nc, self.m = self.na + n, len(crow), len(row)
        self.V0 = V0

    def system(self, V):
        h, A = quantities(self.case, V, extra=self.extra)
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
            da = dx[:n] if self.absolute else np.insert(dx[:n - 1], ref, 0.0)
            ang, Vm = ang + da, Vm + dx[self.na:]
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
        elif t in (part + 'f', part + 't') or t in ('Ifr', 'Ifi', 'Itr', 'Iti'):          # 4.21: a current phasor as a flow of both parts
            k = bri[m['branch']]
            rows.append(('flow', k, {int(case.f[k]): 1.0, int(case.t[k]): -1.0}))
        elif (t == 'V' and part == 'Q') or t in ('Vr', 'Vi'):                             # 4.21: a voltage phasor fixes the angle and the magnitude
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
    magnitudes from those of reactive power and the voltage measurements. 4.21: a voltage phasor fixes the angle of its bus
    (then no angle is the reference) and its magnitude, a current phasor counts as a flow in both parts, and a current
    magnitude |I| counts in neither (it does not say which way the power goes). When the angles are not fixed, the branches whose
    flow cannot be found are taken out with the injections next to them, again and again, and what is left are the observable
    islands. Returns {'observable', 'angles', 'magnitudes' (the two parts), 'islands': [[bus, ...], ...] (largest first),
    'branches': the names of the unobservable branches, 'dropped': the injections that give nothing}."""
    case = net.case() if hasattr(net, 'case') else net
    meas = measurements['measurements'] if isinstance(measurements, dict) else measurements
    _rows(case, meas)                                                        # the same checks as the estimator
    n = case.n
    zi = zero_injection(case) if zero_injections else np.zeros(0, int)
    ref = int(np.flatnonzero(case.typ == PF.REF)[0])
    keep = np.arange(n) if _absolute(meas) else np.delete(np.arange(n), ref)
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


def _absolute(meas):
    """4.21: whether the angles are measured (a voltage phasor on the common time reference); a current phasor needs one."""
    v = any(m['type'] in ('Vr', 'Vi') for m in meas)
    if not v and any(m['type'] in ('Ifr', 'Ifi', 'Itr', 'Iti') for m in meas):
        raise SeError('a current phasor needs a voltage phasor too: the angle of a phasor is on the common time reference, and only a voltage phasor gives it to the state')
    return v


def pmu_start(case, meas, ang_ref=0.0):
    """4.21: a start from the voltage phasors: every bus with one takes it (the mean of its real and imaginary parts, as
    measured); every other bus the voltage of the nearest bus with one (over the branches), or 1 pu at ang_ref without any."""
    n = case.n
    re, im = {}, {}
    for m in meas:
        if m['type'] in ('Vr', 'Vi'):
            (re if m['type'] == 'Vr' else im).setdefault(case.idx[m['bus']], []).append(float(m['value']))
    have = {i: complex(np.mean(re[i]), np.mean(im[i])) for i in re if i in im}
    V = np.full(n, np.exp(1j * ang_ref), complex)
    if not have:
        return V
    nb = [[] for _ in range(n)]
    for a, b in zip(case.f.tolist(), case.t.tolist()):
        nb[a].append(b)
        nb[b].append(a)
    seen, todo = dict(have), list(have)
    while todo:                                                              # breadth first from every bus with a phasor
        nxt = []
        for i in todo:
            for j in nb[i]:
                if j not in seen:
                    seen[j] = seen[i]
                    nxt.append(j)
        todo = nxt
    for i, v in seen.items():
        V[i] = v
    return V


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
        if _at_bus(m['type']):
            i = case.idx[m['bus']]
            seen[i] = True
            if m['type'] in ('P', 'Q'):
                seen[nb[i]] = True
        else:
            k = bri[m['branch']]
            seen[[case.f[k], case.t[k]]] = True
    return [case.names[i] for i in np.flatnonzero(~seen)]


def run(net, measurements=None, plan='scada', noise=1.0, seed=1, sigma=None, bad=None, zero_injections=True, detect=True,
        threshold=3.0, confidence=0.99, max_bad=10, tol=1e-8, max_iter=30, start='flat', pmu=None, currents=False, emt=None):
    """The state of the network from measurements. measurements: a list of {'type': 'V', 'P', 'Q' (at a 'bus'), 'Pf', 'Qf',
    'Pt', 'Qt' (of a 'branch', at its «from» or «to» end), 'value' (pu), 'sigma' (pu)}, or the output of measure(); without it a
    set is made from the load flow of the network (plan, noise, seed, sigma, bad, pmu, currents: see measure), or (4.21) from
    the points of an EMT run (emt: the arguments of from_emt). 4.21 types: 'Vr', 'Vi' (a voltage phasor at a 'bus'), 'Ifr',
    'Ifi', 'Itr', 'Iti' (a current phasor of a 'branch', into it at its «from» or «to» end), 'If', 'It' (|I| there).
    zero_injections: the buses without load and generation as equality constraints. detect: the χ² test at `confidence` and
    the largest normalized residual test with `threshold`, taking out up to max_bad measurements. start: 'flat' (1 pu, zero
    angles), 'given' (the voltages of the network data) or 'pmu' (4.21: from the voltage phasors, pmu_start); a flat start with
    voltage phasors becomes 'pmu' (their angles are on the time reference of the PMUs, which may be far from the angle of the
    slack), and with |I| measurements and no voltage phasor 'staged': the estimate without the |I| first.

    Returns {'converged', 'observable', 'iterations', 'rounds', 'buses' {bus: V, angle, P, Q (as a load flow gives them, from
    the estimate)}, 'branches', 'measurements' [{type, bus/branch, value, sigma, estimate, residual, rN, critical, used}],
    'J', 'dof', 'chi2', 'suspect', 'bad' [{index, type, at, value, rN, error (estimated), corrected}], 'critical' (indices),
    'm', 'n', 'constraints', 'redundancy', 'largest' (the largest normalized residual left), 'error' (against the load flow, when
    the measurements were made from it), 'first' (the estimate before any measurement was taken out), 'message', 'time'}."""
    t0 = time.perf_counter()
    truth, made, planted = None, None, []
    if measurements is None and emt is not None:
        if not isinstance(emt, dict) or set(emt) - {'points', 'plan', 'sigma', 'bad', 'ref'}:
            raise SeError("emt: {'points', 'plan', 'sigma', 'bad', 'ref'} (see from_emt)")
        measurements = from_emt(net, emt.get('points'), emt.get('plan', 'scada'), sigma=dict(sigma or {}, **(emt.get('sigma') or {})), bad=emt.get('bad', bad),
                                ref=emt.get('ref', 'cos'))
    if measurements is None:
        made = measure(net, plan=plan, noise=noise, seed=seed, sigma=sigma, bad=bad, zero_injections=zero_injections, pmu=pmu, currents=currents)
        measurements = made
    tv = None
    if isinstance(measurements, dict):
        truth, planted = measurements.get('truth'), list(measurements.get('bad') or [])
        plan = measurements.get('plan', plan)
        tv = measurements.get('tve')                                           # 4.21: of the phasors of an EMT run
        measurements = measurements['measurements']
    else:
        plan = None
    meas = [dict(m) for m in measurements]
    if not meas:
        raise SeError('no measurements')
    if not 0 < confidence < 1:
        raise SeError('confidence: between 0 and 1')
    if start not in ('flat', 'given', 'pmu'):
        raise SeError("start: 'flat', 'given' or 'pmu'")
    case = net.case()
    n, nl = case.n, case.nl
    row, z, s = _rows(case, meas)
    extra = any(m['type'] not in BASIC for m in meas)                         # 4.21: phasors or |I| (else the work of 4.19.5, as it was)
    absolute = _absolute(meas)
    if start == 'flat' and absolute:                                          # the angles of the PMUs may be anywhere: start from them
        start = 'pmu'
    elif start == 'flat' and any(m['type'] in ('If', 'It') for m in meas):
        start = 'staged'
    zi = zero_injection(case) if zero_injections else np.zeros(0, int)
    crow = np.r_[n + zi, 2 * n + zi].astype(int)
    ang_ref = case.ang0[np.flatnonzero(case.typ == PF.REF)[0]]
    if start == 'pmu':
        V0 = pmu_start(case, meas, ang_ref)
    elif start == 'staged':                                                   # the estimate without the |I| as the start
        rest = [m for m in meas if m['type'] not in ('If', 'It')]
        if not rest or not observability(case, rest, zero_injections)['observable']:
            raise SeError('|I| measurements without voltage phasors need the others to fix the state alone: the estimate starts from them (at a flat start the current of a branch has no direction)')
        pre = run(net, rest, zero_injections=zero_injections, detect=False, tol=tol, max_iter=max_iter)
        if not pre['converged']:
            raise SeError('the estimate without the |I| measurements, the start of the one with them, did not converge')
        V0, its0 = pre['_V'], pre['iterations']
    else:
        V0 = case.start(start == 'flat')
        if start == 'flat':
            V0 = np.full(n, np.exp(1j * ang_ref))                                                     # 1 pu at the angle of the reference
    ns = (2 * n) if absolute else (2 * n - 1)
    its0 = locals().get('its0', 0)
    out = {'converged': False, 'observable': True, 'iterations': 0, 'rounds': 0, 'm': len(meas), 'n': ns, 'constraints': len(crow),
           'redundancy': (len(meas) + len(crow)) / ns, 'plan': plan, 'bad': [], 'critical': [], 'message': '', 'S_base': net.S_base,
           'threshold': float(threshold), 'confidence': float(confidence), 'planted': planted, 'zero_buses': [case.names[i] for i in zi]}
    if extra:
        out.update(start=start, absolute=absolute)
    if tv is not None:
        out['tve'] = tv
    used = np.ones(len(meas), bool)
    first, sol, om, rN = None, None, None, None
    its = its0                                                               # 4.21: with the iterations of a staged start
    for rnd in range(max_bad + 1):
        P = _Problem(case, row[used], z[used], s[used], crow, V0, extra, absolute)
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
        h, _ = quantities(case, V, deriv=False, extra=extra)
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


__all__ = ['SeError', 'TYPES', 'PLANS', 'EMT_PLANS', 'SIGMA', 'quantities', 'zero_injection', 'measure', 'residual_covariance', 'observability', 'uncovered', 'run',
           'from_emt', 'tve', 'pmu_start']
