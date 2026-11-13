"""Transient recovery voltage of high-voltage circuit-breakers (4.9, ROADMAP §31): the rated TRV of
IEC 62271-100:2021 and the check of a prospective TRV against it.

* ``rated(Ur, duty, kpp, cls, f)``: the specified TRV of a test-duty (T100, T60, T30, T10, OP, SLF supply side) as a
  reference line of two or four parameters and a delay line, from the rules of 7.105.5 (u_c = k_pp·k_af·√(2/3)·U_r,
  u_1 = 0,75·k_pp·√(2/3)·U_r, the rates of rise, t_2 = 4·t_1 …). Below 100 kV the standard gives t_3 of T100 per
  rated voltage (Tables 16 and 18); that time is the only input taken from the tables, every other value follows
  from the rules. For k_pp = 1,3 the rate of rise is the one of k_pp = 1,5 (Tables 17 and 19), and T10 is always at
  k_pp = 1,5 below 100 kV and at k_pp·k_af = 1,5·1,53 from 100 kV to 800 kV, as in the tables.
* ``itrv(Ur, Isc, f)``: the initial TRV of Table 9 (t_i per rated voltage, u_i = √2·ω·Z_i·t_i·I_sc with Z_i = 260 Ω,
  325 Ω at 800 kV).
* ``slf(Ur, Isc, ratio, f)``: the short-line fault of Annex A: line side u_L* = k·u_0, t_L = k·L_L/Z (Table 29 for
  Z, k, s, t_dL), source side from the SLF supply circuit (Table 30) with u_1,test, u_m and t_m, and the sum u_T at
  t_T = t_dL + t_L + Δt (A.24, or A.25 with ITRV).
* ``pole_factors(kpp)``: the multipliers of RRRV and u_c for the second and third clearing poles (Table 14).
* ``envelope_of(t, u)``: the envelope of a prospective TRV curve by the method of Annex D (first segment through the
  origin, horizontal at the highest peak, third segment between them; four or two parameters).
* ``compare(t, u, spec)``: whether a prospective TRV (a curve from the simulation, t from current zero) stays under
  the reference line of a rating, and the smallest margin.

Everything in SI (V, s, V/s); the tables of the standard are in kV and µs. Pure Python (no NumPy): it also runs in
the browser's Python. References: IEC 62271-100:2021 §5.101–5.102, §7.105.5, §7.109, Annexes A and D; IEEE C37.011-2011
for the application to a system (the system TRV under the rated envelope). THEORY.md §TRV.
"""
import math

SQ23 = math.sqrt(2.0 / 3.0)

# rated voltages below 100 kV (kV) and t_3 of test-duty T100 at k_pp = 1,5 (µs): class S1 (Table 16), S2 (Table 18)
_UR_LOW = (3.6, 4.76, 7.2, 8.25, 12, 15, 15.5, 17.5, 24, 25.8, 27, 36, 38, 40.5, 48.3, 52, 72.5)
_T3_S1 = (40.7, 43.7, 49.8, 52.4, 61.2, 67.9, 68.9, 73.2, 86.0, 89.4, 91.6, 107, 110, 114, 126, 132, 164)
_T3_S2 = (11.4, 13.9, 18.5, 20.4, 26.5, 31.0, 31.7, 34.5, 43.0, 45.2, 46.7, 57.1, 59.3, 62.0, 70.2, 73.9, 93.3)
# rated voltages of 100 kV and above (kV) and the ITRV time coordinate t_i (µs, Table 9)
_UR_HIGH = (100, 123, 145, 170, 245, 300, 362, 420, 550, 800, 1100, 1200)
_TI = (0.4, 0.4, 0.4, 0.5, 0.6, 0.7, 0.8, 0.8, 1.0, 1.1, 1.5, 1.5)

# amplitude factors below 100 kV (7.105.5 a)) and t_3 of the other test-duties as a fraction of t_3 of T100
_KAF_LOW = {'S1': {'T100': 1.4, 'T60': 1.5, 'T30': 1.6, 'T10': 1.7, 'OP': 1.25},
            'S2': {'T100': 1.54, 'T60': 1.65, 'T30': 1.74, 'T10': 1.8, 'OP': 1.25}}
_T3_FRAC = {'S1': {'T100': 1.0, 'T60': 0.44, 'T30': 0.22, 'T10': 0.22, 'OP': 2.0},
            'S2': {'T100': 1.0, 'T60': 0.67, 'T30': 0.40, 'T10': 0.40, 'OP': 2.0}}
# multipliers of RRRV and u_c for the second and third clearing poles (Table 14)
_POLES = {1.2: ((0.95, 0.95), (0.83, 0.83)), 1.3: ((0.95, 0.97), (0.70, 0.77)), 1.5: ((0.70, 0.58), (0.70, 0.58)),
          2.0: ((0.95, 0.97), (0.70, 0.77)), 2.5: ((0.70, 0.58), (0.70, 0.58))}

DUTIES = ('T100', 'T60', 'T30', 'T10', 'OP', 'SLF')


class TRVError(ValueError):
    pass


def _kv(Ur):
    Ur = float(Ur)
    if not Ur > 0:
        raise TRVError('rated voltage U_r > 0 (V)')
    return Ur / 1e3


def _low_t3(urk, cls):
    """t_3 of T100 at k_pp = 1,5 below 100 kV (µs): the table value at a standard rating, otherwise log-log
    interpolation between the neighbours (``standard`` False)."""
    tab = _T3_S1 if cls == 'S1' else _T3_S2
    for u, t in zip(_UR_LOW, tab):
        if abs(u - urk) < 1e-9:
            return t, True
    if urk < _UR_LOW[0] or urk > _UR_LOW[-1]:
        k = 0 if urk < _UR_LOW[0] else len(_UR_LOW) - 2
    else:
        k = max(i for i in range(len(_UR_LOW) - 1) if _UR_LOW[i] <= urk)
    u0, u1, t0, t1 = _UR_LOW[k], _UR_LOW[k + 1], tab[k], tab[k + 1]
    a = math.log(t1 / t0) / math.log(u1 / u0)
    return t0 * (urk / u0) ** a, False


def default_kpp(Ur, earthed=True, duty='T100'):
    """The rated first-pole-to-clear factor (5.102): 1,2 above 800 kV, 1,3 up to 800 kV in effectively earthed neutral
    systems, 1,5 up to 170 kV in non-effectively earthed ones; out of phase 2,0 or 2,5."""
    urk = _kv(Ur)
    if duty == 'OP':
        return 2.5 if (not earthed and urk <= 170) else 2.0
    if duty == 'SLF':
        return 1.0
    if urk > 800:
        return 1.2
    return 1.3 if (earthed or urk > 170) else 1.5


def rated(Ur, duty='T100', kpp=None, cls='S1', f=50, earthed=True):
    """The specified TRV of IEC 62271-100:2021 for rated voltage U_r (V) and a test-duty: 'T100', 'T60', 'T30', 'T10',
    'OP' (out of phase) or 'SLF' (the supply circuit of a short-line fault, k_pp = 1). Returns a dict in SI units:
    params ('2p' or '4p'), uc, and t3 (2p) or u1, t1, t2 (4p), the delay line td, ud (= u′), tdp (= t′) (with td_max
    where the standard gives an upper value), rrrv (u_1/t_1 or u_c/t_3), kpp, kaf, and ``standard`` False when U_r is
    not a rating of the tables below 100 kV (t_3 then interpolated). cls: 'S1' or 'S2' below 100 kV."""
    urk = _kv(Ur)
    duty = str(duty).upper()
    if duty not in DUTIES:
        raise TRVError(f'test-duty one of {DUTIES}')
    cls = str(cls).upper()
    if cls not in ('S1', 'S2'):
        raise TRVError("class 'S1' or 'S2'")
    if kpp is None:
        kpp = default_kpp(Ur, earthed, duty)
    kpp = float(kpp)
    out = {'Ur': float(Ur), 'duty': duty, 'kpp': kpp, 'cls': cls if urk < 100 else None, 'f': float(f), 'standard': True}
    E = SQ23 * urk                                  # crest of the phase-to-earth voltage (kV)
    if urk < 100:
        if duty == 'SLF':                           # Table 30: S2 values of T100, t_3 divided by k_pp (1,5), td = 0,05·t_3
            t3_15, std = _low_t3(urk, 'S2')
            uc = 1.0 * 1.54 * E
            rate = 1.5 * 1.54 * E / t3_15
            t3 = t3_15 / 1.5
            out.update(params='2p', kaf=1.54, uc=uc, t3=t3, td=0.05 * t3, standard=std)
        elif duty == 'OP':                          # Tables 22–25: t_3 = 2·t_3(T100) at k_pp 2,5, the same RRRV at 2,0
            t3_15, std = _low_t3(urk, cls)
            kaf = 1.25
            rate = 2.5 * kaf * E / (2 * t3_15)
            uc = kpp * kaf * E
            t3 = uc / rate
            out.update(params='2p', kaf=kaf, uc=uc, t3=t3, td=0.15 * t3, standard=std)
        else:
            t3_15, std = _low_t3(urk, cls)
            if duty == 'T10':                       # T10 at k_pp = 1,5 also for a breaker rated 1,3 (Tables 17, 19)
                kpp = 1.5
                out['kpp'] = 1.5
            kaf = _KAF_LOW[cls][duty]
            t3_100 = t3_15 * kpp / 1.5              # the RRRV of T100 is the same for k_pp 1,3 and 1,5
            uc = kpp * kaf * E
            t3 = _T3_FRAC[cls][duty] * t3_100
            td = 0.15 * t3
            if duty == 'T100' and cls == 'S2':      # 0,05·t_3, up to 0,15·t_3 when short-line fault tests are made
                out['td_max'] = 0.15 * t3 * 1e-6
                td = 0.05 * t3
            out.update(params='2p', kaf=kaf, uc=uc, t3=t3, td=td, standard=std)
        out['ud'] = out['uc'] / 3
        out['tdp'] = out['td'] + out['t3'] / 3
        out['rrrv'] = out['uc'] / out['t3']
    else:
        top = urk > 800
        u1 = 0.75 * kpp * E
        if duty in ('T100', 'SLF'):
            kaf = 1.5 if top else 1.4
            rate = 2.0
            t1 = u1 / rate
            uc = kpp * kaf * E
            t2 = (3 if top else 4) * t1
            out.update(params='4p', kaf=kaf, u1=u1, t1=t1, uc=uc, t2=t2, td=2.0, ud=u1 / 2, rrrv=rate)
            out['td_max'] = 0.28 * t1 * 1e-6
        elif duty == 'T60':
            kaf = 1.5
            rate = 3.0
            t1 = u1 / rate
            uc = kpp * kaf * E
            t2 = (4.5 if top else 6) * t1
            out.update(params='4p', kaf=kaf, u1=u1, t1=t1, uc=uc, t2=t2, td=2.0, ud=u1 / 2, rrrv=rate)
            out['td_max'] = 0.3 * t1 * 1e-6
        elif duty in ('T30', 'T10'):
            if duty == 'T30':
                kaf, rate = 1.54, 5.0
                uc = kpp * kaf * E
            else:
                rate = 7.0
                if top:
                    kaf = 1.76
                    uc = kpp * kaf * E
                else:                               # 1,5·1,53 (= 0,9·1,7·1,5), written k_af 1,76 for k_pp 1,3
                    uc = 1.5 * 1.53 * E
                    kaf = uc / (kpp * E)
            t3 = uc / rate
            out.update(params='2p', kaf=kaf, uc=uc, t3=t3, td=0.15 * t3, ud=uc / 3, rrrv=rate)
        else:                                       # OP: t_1 twice that of T100, u_c with k_af 1,25
            kaf = 1.25
            uc = kpp * kaf * E
            k100 = default_kpp(Ur, earthed, 'T100')
            t1_100 = 0.75 * k100 * E / 2.0
            if top:
                rate = 1.54
                t3 = uc / rate
                out.update(params='2p', kaf=kaf, uc=uc, t3=t3, td=0.05 * t3, ud=uc / 3, rrrv=rate)
            else:
                t1 = 2 * t1_100
                t2_100 = 4 * t1_100
                out.update(params='4p', kaf=kaf, u1=u1, t1=t1, uc=uc, t2=t2_100, td=2.0, ud=u1 / 2, rrrv=u1 / t1)
                out['t2_max'] = 2 * t2_100 * 1e-6
                out['td_max'] = 0.1 * t1 * 1e-6
        if duty == 'SLF':
            out['kpp'] = kpp
        if out['params'] == '4p':
            out['tdp'] = out['td'] + out['ud'] / out['rrrv']
        else:
            out['tdp'] = out['td'] + out['t3'] / 3
    # to SI: kV → V, µs → s, kV/µs → V/s
    for k in ('uc', 'u1', 'ud'):
        if k in out:
            out[k] *= 1e3
    for k in ('t1', 't2', 't3', 'td', 'tdp'):
        if k in out:
            out[k] *= 1e-6
    out['rrrv'] *= 1e9
    out['f'] = float(f)
    return out


def reference_line(spec, t_end=None):
    """The reference line of a rating as points (t, u) from the origin: [(0, 0), (t3, uc), (t_end, uc)] or
    [(0, 0), (t1, u1), (t2, uc), (t_end, uc)]."""
    if spec['params'] == '4p':
        pts = [(0.0, 0.0), (spec['t1'], spec['u1']), (spec['t2'], spec['uc'])]
    else:
        pts = [(0.0, 0.0), (spec['t3'], spec['uc'])]
    pts.append((t_end if t_end and t_end > pts[-1][0] else 2 * pts[-1][0], spec['uc']))
    return pts


def delay_line(spec):
    """The delay line: from (td, 0), parallel to the first segment of the reference line, to (t′, u′)."""
    return [(spec['td'], 0.0), (spec['tdp'], spec['ud'])]


def line_value(pts, t):
    """The value of a polyline [(t, u), …] at t (constant after the last point, 0 before the first)."""
    if t <= pts[0][0]:
        return pts[0][1] if t == pts[0][0] else 0.0
    for (ta, ua), (tb, ub) in zip(pts, pts[1:]):
        if t <= tb:
            return ua + (ub - ua) * (t - ta) / (tb - ta) if tb > ta else ub
    return pts[-1][1]


def itrv(Ur, Isc, f=50):
    """The initial TRV of Table 9 for U_r ≥ 100 kV: t_i per rated voltage, f_i = √2·ω·Z_i·t_i (Z_i = 260 Ω, 325 Ω at
    800 kV), u_i = f_i·I_sc. I_sc in A (RMS). None below 100 kV (ITRV not required)."""
    urk = _kv(Ur)
    if urk < 100:
        return None
    k = min(range(len(_UR_HIGH)), key=lambda i: abs(_UR_HIGH[i] - urk))
    ti = _TI[k] * 1e-6
    Zi = 325.0 if _UR_HIGH[k] == 800 else 260.0
    fi = math.sqrt(2) * 2 * math.pi * f * Zi * ti        # V per A
    return {'ti': ti, 'Zi': Zi, 'fi': fi, 'ui': fi * float(Isc), 'standard': abs(_UR_HIGH[k] - urk) < 1e-9}


def line_data(Ur, f=50):
    """The line characteristics of Table 29 for a short-line fault: surge impedance Z (Ω), peak factor k, the RRRV
    factor s = √2·ω·Z (V/s per A) and the line side time delay t_dL (s)."""
    urk = _kv(Ur)
    Z = 330.0 if urk > 800 else 450.0
    tdl = 0.1e-6 if urk <= 48.3 else (0.2e-6 if urk <= 170 else 0.5e-6)
    return {'Z': Z, 'k': 1.6, 's': math.sqrt(2) * 2 * math.pi * f * Z, 'tdL': tdl}


def slf(Ur, Isc, ratio=0.9, f=50, itrv_req=False, Z=None, k=None, tdL=None, td=None):
    """The TRV of a short-line fault from the rated characteristics (Annex A), single phase, k_pp = 1.

    U_r in V, I_sc in A (RMS), ratio = I_L/I_sc (0,9 for L90, 0,75 for L75, 0,6 for L60). Returns a dict (SI): IL,
    LS, LL, didt, u0 (A.13), uL (= u_L*, A.14), tL (A.16), rate_line (s·I_L), ux, u1_test (A.18), um (A.19), tm (A.23),
    rrrv_slf (A.22), us (u_s*, A.24 or A.25), uT and tT (the TRV across the breaker at the first line-side peak),
    the line length L = c·t_L/2 (c = 300 m/µs), and the supply circuit (``supply``, from ``rated(…, 'SLF')``)."""
    U = float(Ur)
    Isc = float(Isc)
    w = 2 * math.pi * f
    ld = line_data(U, f)
    Z = float(Z) if Z else ld['Z']
    k = float(k) if k else ld['k']
    tdL = float(tdL) if tdL is not None else ld['tdL']
    s = math.sqrt(2) * w * Z
    IL = ratio * Isc
    UG = U / math.sqrt(3)
    LS = UG / (w * Isc)
    XL = UG * (1 - ratio) / IL
    LL = XL / w
    didt = math.sqrt(2) * w * IL
    Um = math.sqrt(2) * UG
    u0 = Um * (1 - ratio)
    ux = w * LS * IL * math.sqrt(2)
    uL = k * u0
    tL = uL / (s * IL)
    sup = rated(U, 'SLF', f=f)
    kaf = sup['kaf']
    um = u0 + kaf * ux
    rrrv_slf = sup['rrrv'] * ratio
    out = {'IL': IL, 'LS': LS, 'LL': LL, 'didt': didt, 'Um': Um, 'u0': u0, 'ux': ux, 'uL': uL, 'tL': tL,
           'rate_line': s * IL, 'Z': Z, 'k': k, 'tdL': tdL, 'um': um, 'rrrv_slf': rrrv_slf, 'L': 300e6 * tL / 2,
           'supply': sup}
    if sup['params'] == '4p':
        out['u1_test'] = sup['u1'] * (1 + (1 - ratio) / 3)
        out['tm'] = sup['t1'] * kaf / (kaf - 0.75)
    td_s = sup['td'] if td is None else float(td)
    dt = tdL if tdL >= 0.1e-6 else 0.1e-6
    tT = tdL + tL + dt
    us = rrrv_slf * max(tT - td_s, 0.0)
    if itrv_req:
        it = itrv(U, IL, f)                     # A.26: u_i = f_i·I_L
        if it:
            ui0 = it['ui'] / 1.4                    # A.27 with k_i = 1,4
            us += ui0
            out['itrv'] = dict(it, ui0=ui0, LB=ui0 / didt)
    out.update(us=us, uT=uL + us, tT=tT)
    return out


def pole_factors(kpp):
    """Multipliers of (RRRV, u_c) for the second and the third clearing pole (Table 14), by the first-pole-to-clear
    factor (1,2, 1,3, 1,5 terminal faults; 2,0, 2,5 out of phase)."""
    k = min(_POLES, key=lambda q: abs(q - float(kpp)))
    (r2, u2), (r3, u3) = _POLES[k]
    return {'second': {'rrrv': r2, 'uc': u2}, 'third': {'rrrv': r3, 'uc': u3}, 'kpp': k}


# ---------------------------------------------------------------- envelope of a prospective TRV (Annex D)
def _prep(t, u, t0, nmax=4000):
    ts = [float(x) - t0 for x in t]
    us = [float(x) for x in u]
    if len(ts) != len(us) or len(ts) < 3:
        raise TRVError('envelope_of: t and u of the same length (≥ 3)')
    big = max(range(len(us)), key=lambda i: abs(us[i]))
    sg = 1.0 if us[big] >= 0 else -1.0
    pairs = [(a, sg * b) for a, b in zip(ts, us) if a >= 0]
    if len(pairs) > nmax:                       # thinned for speed, the highest peak kept
        ip = max(range(len(pairs)), key=lambda i: pairs[i][1])
        st = -(-len(pairs) // nmax)
        keep = set(range(0, len(pairs), st)) | {ip, len(pairs) - 1}
        pairs = [pairs[i] for i in sorted(keep)]
    return [p[0] for p in pairs], [p[1] for p in pairs], sg


def envelope_of(t, u, t0=0.0):
    """The envelope of a prospective TRV curve by the method of Annex D. t from current zero (or t0 subtracted),
    the sign of the largest excursion taken as positive. Returns {'params': '4p', u1, t1, uc, t2} or {'params': '2p', uc,
    t3}, with rrrv (slope of the first segment), 'case' (D.2 c) 1, 2, 3i or 3ii) and the points of contact."""
    import bisect
    ts, us, _ = _prep(t, u, t0)
    n = len(ts)
    ip = max(range(n), key=lambda i: us[i])                 # highest peak
    uc = us[ip]
    if uc <= 0:
        raise TRVError('envelope_of: no recovery voltage')
    cand = [i for i in range(1, ip + 1) if ts[i] > 0 and us[i] >= 0.05 * uc] or [i for i in range(1, ip + 1) if ts[i] > 0]   # above 5 % of u_c: not the noise of the zero
    i1 = max(cand, key=lambda i: us[i] / ts[i])             # first segment: through O, tangential, not cutting
    m1 = us[i1] / ts[i1]
    two = {'params': '2p', 'uc': uc, 't3': uc / m1, 'rrrv': m1, 'contact1': (ts[i1], us[i1]), 'peak': (ts[ip], uc)}
    if ip - i1 < 3:
        return dict(two, case='3ii')
    # upper concave hull of the curve between the two points of contact
    hull = []
    for i in range(i1, ip + 1):
        while len(hull) >= 2:
            a, b = hull[-2], hull[-1]
            if (ts[b] - ts[a]) * (us[i] - us[a]) - (us[b] - us[a]) * (ts[i] - ts[a]) >= 0:
                hull.pop()
            else:
                break
        hull.append(i)
    gaps = [(a, b) for a, b in zip(hull, hull[1:]) if b - a > 1 and not (a == i1 and b == ip)]
    # cumulative integral of the curve (trapezoids) for the areas between curve and envelope
    P = [0.0] * n
    for i in range(1, n):
        P[i] = P[i - 1] + 0.5 * (us[i] + us[i - 1]) * (ts[i] - ts[i - 1])

    def curve_int(x):
        k = min(max(bisect.bisect_right(ts, x) - 1, 0), n - 2)
        d = x - ts[k]
        uk = us[k] + (us[k + 1] - us[k]) * d / (ts[k + 1] - ts[k]) if ts[k + 1] > ts[k] else us[k]
        return P[k] + 0.5 * (us[k] + uk) * d

    def corners(slope, ta, ua):
        # third segment through (ta, ua): B with the first segment, A with the horizontal
        if slope <= 0 or abs(m1 - slope) < 1e-30:
            return None
        tB = (ua - slope * ta) / (m1 - slope)
        tA = ta + (uc - ua) / slope
        if not (0 < tB < tA):
            return None
        return {'params': '4p', 'u1': m1 * tB, 't1': tB, 'uc': uc, 't2': tA, 'rrrv': m1}

    def equal_area():
        # the tangent at one hull vertex with equal areas between curve and envelope on either side of the contact
        best = None
        for q in range(1, len(hull) - 1):
            j, jl, jr = hull[q], hull[q - 1], hull[q + 1]
            sl = 0.5 * ((us[j] - us[jl]) / (ts[j] - ts[jl]) + (us[jr] - us[j]) / (ts[jr] - ts[j]))
            c = corners(sl, ts[j], us[j])
            if not c:
                continue
            tB, tA, tj = c['t1'], c['t2'], ts[j]
            env_int = lambda x0, x1: 0.5 * (c['u1'] + sl * (x0 - tB) + c['u1'] + sl * (x1 - tB)) * (x1 - x0)
            a1 = env_int(tB, tj) - (curve_int(tj) - curve_int(tB))
            a2 = env_int(tj, min(tA, ts[-1])) - (curve_int(min(tA, ts[-1])) - curve_int(tj))
            d = abs(a1 - a2)
            if best is None or d < best[0]:
                best = (d, dict(c, contact=(tj, us[j])))
        return best[1] if best else None

    if len(gaps) == 1:
        a, b = gaps[0]
        c = corners((us[b] - us[a]) / (ts[b] - ts[a]), ts[a], us[a])
        if c:
            return dict(c, case='1', contact1=(ts[i1], us[i1]), contacts=((ts[a], us[a]), (ts[b], us[b])))
    if len(gaps) > 1:
        c = equal_area()
        if c:
            return dict(c, case='2', contact1=(ts[i1], us[i1]))
    # no segment touches at two points: far apart (exponential-like) → equal areas, close (one frequency) → 2p
    if ts[i1] < 0.5 * ts[ip]:
        c = equal_area()
        if c:
            return dict(c, case='3i', contact1=(ts[i1], us[i1]))
    return dict(two, case='3ii')


def compare(t, u, spec, t0=0.0):
    """A prospective TRV curve (e.g. from the simulation; t from current zero, or t0 subtracted) against a rating
    (``rated``): ``ok`` when the curve stays at or under the reference line at every instant (the system TRV within
    the breaker's capability, IEEE C37.011 §4); the smallest margin (V, and relative to u_c) and where it occurs, counted
    where the reference line is above 5 % of u_c (near the origin both are zero); ``ratio``, the largest u/u_ref there;
    the first instant above the line by more than 1 % of u_c; and the envelope of the curve (``envelope_of``) with the ratios of its peak and
    rate of rise to the rated ones."""
    ts, us, _ = _prep(t, u, t0, nmax=10 ** 9)
    ref = reference_line(spec, max(ts))
    worst, at, first, ratio = None, None, None, 0.0
    for a, b in zip(ts, us):
        r = line_value(ref, a)
        if b > r + 0.01 * spec['uc'] and first is None:      # 1 % of u_c: the sampling of the current zero
            first = a
        if r < 0.05 * spec['uc']:
            continue
        m = r - b
        ratio = max(ratio, b / r)
        if worst is None or m < worst:
            worst, at = m, a
    env = envelope_of(t, u, t0)
    return {'ok': first is None, 'margin': worst, 'margin_rel': worst / spec['uc'] if worst is not None else None, 't_margin': at,
            'ratio': ratio, 't_first': first, 'envelope': env, 'uc_ratio': env['uc'] / spec['uc'], 'rrrv_ratio': env['rrrv'] / spec['rrrv']}
