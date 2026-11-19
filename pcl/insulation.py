"""Insulation co-ordination (4.22, ROADMAP §51): the procedure of IEC 60071-1 and IEC 60071-2 as a tool, with the
selection of metal-oxide surge arresters of IEC 60099-5.

Our own wording of the steps (THEORY §8ΩΓ):

1. representative overvoltages U_rp: temporary from the earth fault factor k (exact from the symmetrical components)
   and from a load rejection; slow-front from the 2 % values U_e2 and U_p2 by their truncation values, limited by the
   arresters (U_ps, 2·U_ps); fast-front from the simplified statistical approach (the length L_a of line with the
   acceptable failure rate) or from simulated peaks; very-fast-front from simulated peaks;
2. co-ordination withstand voltages U_cw = K_c·U_rp: K_c = 1 for TOV, the deterministic K_cd of the arrester
   protection level for slow-front, the statistical risk if asked;
3. required withstand voltages U_rw = U_cw·K_s·K_a: K_s = 1,15 internal, 1,05 external, K_a = e^(m·H/8150) for
   external insulation with m by the shape;
4. conversion with the test conversion factors to the voltage shapes of the range (I: SDWV and LIWV, II: SIWV and
   LIWV);
5. the standard insulation level of IEC 60071-1 that covers every required value, and the margins.

Only the numbers of the standards that the procedure needs are here (tables of standard levels, test conversion
factors, factor A of the lines, the curves of K_cd and m as we read them), with references; no text of the
standards. Pure Python, no numpy: it runs in the app's Pyodide too.
"""
import cmath
import math

SQ2, SQ3 = math.sqrt(2.0), math.sqrt(3.0)

# ---------------------------------------------------------------- IEC 60071-1:2019, standard insulation levels
# range I (Table 2): U_m (kV RMS) → [(SDWV kV RMS, LIWV kV peak), ...]; the levels in brackets of the table are
# marked with a third field True (they may need extra phase-to-phase tests)
RANGE_I = {
    3.6: [(10, 20), (10, 40)], 7.2: [(20, 40), (20, 60)], 12: [(28, 60), (28, 75), (28, 95)],
    17.5: [(38, 75), (38, 95)], 24: [(50, 95), (50, 125), (50, 145)], 36: [(70, 145), (70, 170)],
    52: [(95, 250)], 72.5: [(140, 325)], 100: [(150, 380, True), (185, 450)],
    123: [(185, 450, True), (230, 550)], 145: [(185, 450, True), (230, 550), (275, 650)],
    170: [(230, 550, True), (275, 650), (325, 750)],
    245: [(275, 650, True), (325, 750, True), (360, 850), (395, 950), (460, 1050)],
}
# range II (Table 3): U_m → [(SIWV longitudinal, SIWV phase-to-earth, phase-to-phase / phase-to-earth, [LIWV, ...])]
RANGE_II = {
    300: [(750, 750, 1.50, [850, 950]), (750, 850, 1.50, [950, 1050])],
    362: [(850, 850, 1.50, [950, 1050]), (850, 950, 1.50, [1050, 1175])],
    420: [(850, 850, 1.60, [1050, 1175]), (950, 950, 1.50, [1175, 1300]), (950, 1050, 1.50, [1300, 1425])],
    550: [(950, 950, 1.70, [1175, 1300]), (950, 1050, 1.60, [1300, 1425]), (1050, 1175, 1.50, [1425, 1550])],
    800: [(1175, 1300, 1.70, [1675, 1800]), (1175, 1425, 1.70, [1800, 1950]), (1300, 1550, 1.60, [1950, 2100])],
    1100: [(None, 1425, None, [1950, 2100]), (1425, 1550, 1.70, [2100, 2250]), (1550, 1675, 1.65, [2250, 2400]),
           (1675, 1800, 1.6, [2400, 2550])],
}
# the 550 and 800 kV rows of the table give two longitudinal values for the highest level (950 / 1050 and
# 1175 / 1300); we keep the higher one

# ---------------------------------------------------------------- IEC 60071-2:2023 numbers
KS = {'internal': 1.15, 'external': 1.05}          # 7.3.5, safety factors
# Table 1 (range I): factors on the required SIWV → (SDWV, LIWV); for air clearances and clean insulators (dry) they
# depend on U_rw (kV): 0,6 + U/8500 and 1,05 + U/6000 phase-to-earth, 0,6 + U/12700 and 1,05 + U/9000 phase-to-phase
TCF_I = {
    'external': None,
    'external_wet': (0.6, 1.3),
    'gis': (0.7, 1.25), 'liquid': (0.5, 1.10), 'solid': (0.5, 1.00),
}
# Table 2 (range II): factor on the required SDWV → SIWV (the √2 from RMS to peak included)
TCF_II = {'external': 1.4, 'external_wet': 1.7, 'gis': 1.6, 'liquid': 2.3, 'solid': 2.0}
# Annex E, Table E.2 (and IEC 60099-5:2018 Table 3): factor A (kV) of the lines entering a station
A_LINES = {'dist_earthed': 900, 'dist_wood': 2700, 'single': 4500, 'bundle2': 7000, 'bundle4': 11000, 'bundle6': 17000}
INTERNAL = ('gis', 'liquid', 'solid')


def _interp(pts, x):
    if x <= pts[0][0]:
        return pts[0][1]
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        if x <= x1:
            return y0 + (y1 - y0) * (x - x0) / (x1 - x0)
    return pts[-1][1]


# ---------------------------------------------------------------- step 1: representative overvoltages
def earth_fault_factor(R0, X0, R1, X1, R2=None, X2=None):
    """Earth fault factor at the fault location: the highest phase-to-earth voltage of a healthy phase over the
    voltage before the fault, for a single (SLG) and a double (DLG) phase-to-earth fault, from the sequence
    impedances (our derivation with symmetrical components, the source voltage E = 1):
    SLG on a: V_b = a² − (Z₀ − Z₂)·... in general V = a²·E − I₀·(Z₀ + a²Z₁ + a·Z₂) with I₀ = E/(Z₀ + Z₁ + Z₂);
    DLG on b, c: V_a = 3·E·Z₂Z₀/(Z₁Z₂ + Z₁Z₀ + Z₂Z₀). k is the larger of the two (IEC 60071-2, Annex A, takes the
    most onerous fault)."""
    Z0, Z1 = complex(R0, X0), complex(R1, X1)
    Z2 = complex(R1 if R2 is None else R2, X1 if X2 is None else X2)
    a = cmath.exp(2j * math.pi / 3)
    I0 = 1 / (Z0 + Z1 + Z2)
    Vb = a * a - I0 * (Z0 + a * a * Z1 + a * Z2)
    Vc = a - I0 * (Z0 + a * Z1 + a * a * Z2)
    k1 = max(abs(Vb), abs(Vc))
    den = Z1 * Z2 + Z1 * Z0 + Z2 * Z0
    k2 = abs(3 * Z2 * Z0 / den) if abs(den) > 0 else math.inf
    return {'k': max(k1, k2), 'slg': k1, 'dlg': k2}


def truncation(U2, phase='pe'):
    """Truncation value (pu of √2·U_s/√3) of the slow-front overvoltages from the 2 % value, phase-peak method
    (IEC 60071-2:2023 Annex C): 1,25·U_e2 − 0,25 phase-to-earth, 1,25·U_p2 − 0,43 phase-to-phase."""
    return 1.25 * U2 - (0.25 if phase == 'pe' else 0.43)


def kcd(ratio, phase='pe'):
    """Deterministic co-ordination factor of the arrester protection level (IEC 60071-2 Figure 7, as we read the
    straight lines): phase-to-earth 1,10 up to U_ps/U_e2 = 0,7 and 1,00 from 1,2; phase-to-phase (on 2·U_ps over
    U_p2) 1,10 up to 0,5 and 1,00 from 0,9."""
    lo, hi = (0.7, 1.2) if phase == 'pe' else (0.5, 0.9)
    return 1.10 if ratio <= lo else 1.00 if ratio >= hi else 1.10 - 0.10 * (ratio - lo) / (hi - lo)


# IEC 60071-2 Figure 10, exponent m of the switching impulse as a function of U_cw (kV): our reading of the curves
# (phase-to-earth, longitudinal, phase-to-phase, rod-plane gap); m = 1 below the start of each curve
M_SI = {
    'pe': [(300, 1.0), (450, 0.94), (600, 0.875), (800, 0.785), (1000, 0.70), (1200, 0.625), (1400, 0.555),
           (1600, 0.485), (1800, 0.425), (2050, 0.34)],
    'long': [(750, 1.0), (1000, 0.90), (1200, 0.82), (1400, 0.75), (1600, 0.67), (1800, 0.60), (2000, 0.53),
             (2290, 0.44)],
    'pp': [(1180, 1.0), (1400, 0.92), (1600, 0.85), (1800, 0.78), (2000, 0.71), (2200, 0.65), (2460, 0.56)],
    'rod': [(1, 0.96), (100, 0.86), (200, 0.78), (400, 0.70), (600, 0.60), (800, 0.51), (1000, 0.41),
            (1200, 0.34), (1400, 0.27), (1600, 0.21), (1800, 0.16), (1990, 0.12)],
}


def m_si(Ucw, kind='pe'):
    return _interp(M_SI[kind], Ucw)


def ka(H, m=1.0):
    """Atmospheric correction for the altitude H (m): K_a = e^(m·H/8150) (IEC 60071-2, 7.2.2)."""
    return math.exp(m * H / 8150.0)


def lightning_ucw(Upl, A, n, L, Lsp, Ra, r):
    """Simplified statistical approach of IEC 60071-2 Annex E (E.18, E.19), kV and m: the length of line with an
    outage rate equal to the acceptable failure rate L_a = R_a/r (r per m and year), and
    U_cw = U_pl + (A/n)·L/(L_sp + L_a) with L the separation between the arrester and the equipment."""
    La = Ra / r if r > 0 else 0.0
    return Upl + (A / n) * L / (Lsp + La), La


def protective_zone(Urw, Upl, A, N, Lsp, Ra, r, fs=1.0, Ks=1.15):
    """Protective zone of an arrester (IEC 60099-5:2018 formula (16), from (14)): the largest separation L_p for the
    rated LIWV U_rw: L_p = (U_rw/K_s − U_pl)·N·(L_sp + L_a)/(A·f_s), L_a = R_a/r."""
    La = Ra / r if r > 0 else 0.0
    return max(0.0, (Urw / Ks - Upl) * N * (Lsp + La) / (A * fs))


# ---------------------------------------------------------------- statistical method
def _phi(x):
    return 0.5 * math.erfc(-x / SQ2)


def weibull_p(U, U50, Z):
    """Disruptive discharge probability of self-restoring insulation (modified Weibull of IEC 60071-2, truncated at
    U₅₀ − 4Z): P = 1 − 0,5^((1 + x/4)^5), x = (U − U₅₀)/Z."""
    x = (U - U50) / Z
    return 0.0 if x <= -4 else 1.0 - 0.5 ** ((1 + x / 4) ** 5)


def risk(Ue2, sig_e, U50, Z, Ut=None, n=4000):
    """Risk of failure for one overvoltage: ∫ f(U)·P(U) dU with Gaussian overvoltages (2 % value U_e2, deviation σ_e,
    truncated at U_t) and the modified Weibull insulation; trapezoidal rule (our numerics)."""
    mu = Ue2 - 2.054 * sig_e
    hi = Ut if Ut is not None else mu + 6 * sig_e
    lo = max(mu - 6 * sig_e, U50 - 4 * Z)
    if hi <= lo:
        return 0.0
    tot, d = 0.0, (hi - lo) / n
    for k in range(n + 1):
        U = lo + k * d
        f = math.exp(-0.5 * ((U - mu) / sig_e) ** 2) / (sig_e * math.sqrt(2 * math.pi))
        tot += (0.5 if k in (0, n) else 1.0) * f * weibull_p(U, U50, Z)
    return tot * d


def statistical_ucw(Ue2, sig_e, R, Ut=None, cv=0.06):
    """The co-ordination withstand voltage (the 10 % withstand U₁₀ = U₅₀ − 1,3·Z) with the risk R, by bisection on
    U₅₀ (Z = cv·U₅₀: 6 % for switching impulses)."""
    lo, hi = 0.3 * Ue2, 5 * Ue2
    for _ in range(80):
        U50 = (lo + hi) / 2
        if risk(Ue2, sig_e, U50, cv * U50, Ut) > R:
            lo = U50
        else:
            hi = U50
    U50 = (lo + hi) / 2
    return U50 - 1.3 * cv * U50


# ---------------------------------------------------------------- steps 3 to 5
def required(Ucw, insulation, H=0.0, m=1.0):
    """U_rw = U_cw·K_s·K_a (K_a only for external insulation)."""
    ext = insulation not in INTERNAL
    return Ucw * KS['external' if ext else 'internal'] * (ka(H, m) if ext else 1.0)


def convert_range_I(Urw_si, insulation, phase='pe'):
    """Required SIWV → (SDWV, LIWV) with Table 1 of IEC 60071-2; for external insulation the larger of the dry and
    wet factors (as the worked example of Annex G.2)."""
    if insulation in INTERNAL:
        a, b = TCF_I[insulation]
        return Urw_si * a, Urw_si * b
    if phase == 'pe':
        sd, li = 0.6 + Urw_si / 8500, 1.05 + Urw_si / 6000
        sd, li = max(sd, TCF_I['external_wet'][0]), max(li, TCF_I['external_wet'][1])
    else:
        sd, li = 0.6 + Urw_si / 12700, 1.05 + Urw_si / 9000
    return Urw_si * sd, Urw_si * li


def convert_range_II(Urw_sd, insulation):
    """Required SDWV (RMS) → SIWV (peak) with Table 2 of IEC 60071-2 (external: the larger of dry and wet)."""
    if insulation in INTERNAL:
        return Urw_sd * TCF_II[insulation]
    return Urw_sd * max(TCF_II['external'], TCF_II['external_wet'])


def _um_key(table, Um):
    ks = sorted(table)
    for k in ks:
        if Um <= k * (1 + 1e-9):
            return k
    raise ValueError(f'U_m = {Um} kV πάνω από τους πίνακες του IEC 60071-1.')


def select_level(Um, need):
    """The lowest standard insulation level of IEC 60071-1 (Table 2 for U_m ≤ 245 kV, Table 3 above) that covers the
    required values need = {'sd': SDWV kV RMS, 'li': LIWV, 'si': SIWV phase-to-earth, 'sipp': SIWV phase-to-phase,
    'silong': SIWV longitudinal}. Returns the level, or the highest one with covered = False."""
    if Um <= 245:
        k = _um_key(RANGE_I, Um)
        levels = [{'Um': k, 'sd': r[0], 'li': r[1], 'bracket': len(r) > 2} for r in RANGE_I[k]]
    else:
        k = _um_key(RANGE_II, Um)
        levels = []
        for lo_, pe, ratio, lis in RANGE_II[k]:
            for li in lis:
                levels.append({'Um': k, 'silong': lo_, 'si': pe, 'sipp': None if ratio is None else round(pe * ratio),
                               'li': li})
    for lv in levels:
        if all((lv.get(q) or 0) >= v - 1e-9 for q, v in need.items() if v is not None and q in lv and lv.get(q) is not None):
            return {**lv, 'covered': True}
    return {**levels[-1], 'covered': False}


# ---------------------------------------------------------------- surge arresters (IEC 60099-5)
def arrester(Us, tov=(), T10=1.0, m=0.02, Uc_Ur=0.8, factor=1.05):
    """Continuous operating voltage U_c ≥ 1,05·U_s/√3 (IEC 60099-5:2018 6.3.2.2) and the rated voltage: at least
    U_c/(U_c/U_r) and, for each TOV (U kV RMS, t s), U/T(t) with the TOV capability T(t) = T₁₀·(10/t)^m (our power law
    through the 10 s value of the manufacturer, who gives the real curve)."""
    Uc = factor * Us / SQ3
    Ur = Uc / Uc_Ur
    rows = []
    for U, t in tov:
        T = T10 * (10.0 / t) ** m
        rows.append({'U': U, 't': t, 'T': T, 'Ur': U / T})
        Ur = max(Ur, U / T)
    return {'Uc': Uc, 'Ur': Ur, 'tov': rows}


# ---------------------------------------------------------------- the whole procedure
def coordinate(Us, H=0.0, tov=None, slow=None, fast=None, vffo=None, Um=None, insulations=('external', 'gis')):
    """The procedure of IEC 60071-2 (steps 1 to 5) for one station, in kV.

    tov:  {'k': earth fault factor, 'lr': load rejection pu (phase-to-earth and phase-to-phase)}
    slow: {'Ue2', 'Up2' (pu of √2·U_s/√3), 'Ups' (kV, None = no arrester)}
    fast: {'Upl', 'A', 'n', 'Lsp', 'Ra', 'r', 'L': {insulation: separation m}} (simplified statistical) or
          {'peak': {insulation: kV}} (from a simulation)
    vffo: {'peak': kV, 'K': ratio of the VFFO withstand to the LIWV (our default 1,0)} for GIS
    Returns the rows of each step and the standard level per insulation, with the margins."""
    Um = Um or Us
    pu = SQ2 * Us / SQ3
    rep, cw = {}, {}
    out = {'Us': Us, 'Um': Um, 'H': H, 'pu': pu, 'steps': []}
    # step 1 and 2
    if tov:
        k, lr = tov.get('k', 1.0), tov.get('lr', 1.0)
        pe = max(k, lr) * Us / SQ3
        pp = max(lr, 1.0) * Us
        rep['tov'] = {'pe': pe, 'pp': pp}
        cw['tov'] = {'pe': pe, 'pp': pp}
    if slow:
        et, pt = truncation(slow['Ue2'], 'pe') * pu, truncation(slow['Up2'], 'pp') * pu
        ups = slow.get('Ups')
        if ups:
            rpe, rpp = min(et, ups), min(pt, 2 * ups)
            kpe, kpp = kcd(ups / (slow['Ue2'] * pu), 'pe'), kcd(2 * ups / (slow['Up2'] * pu), 'pp')
            cpe = kpe * ups if et > ups else et
            cpp = kpp * 2 * ups if pt > 2 * ups else pt
        else:
            rpe, rpp, kpe, kpp, cpe, cpp = et, pt, 1.0, 1.0, et, pt
        rep['slow'] = {'pe': rpe, 'pp': rpp, 'Uet': et, 'Upt': pt, 'Kcd_pe': kpe, 'Kcd_pp': kpp}
        cw['slow'] = {'pe': cpe, 'pp': cpp}
    if fast:
        if 'peak' in fast:
            cw['fast'] = {q: {'pe': v, 'pp': v} for q, v in fast['peak'].items()}
        else:
            cw['fast'] = {}
            for q, L in fast['L'].items():
                u, La = lightning_ucw(fast['Upl'], fast['A'], fast['n'], L, fast['Lsp'], fast['Ra'], fast['r'])
                cw['fast'][q] = {'pe': u, 'pp': u, 'La': La}
    out['representative'], out['coordination'] = rep, cw
    # step 3 to 5 per insulation
    res = {}
    for ins in insulations:
        ext = ins not in INTERNAL
        rw = {}
        if 'tov' in cw:
            rw['sd'] = {ph: required(cw['tov'][ph], ins, H, 1.0 if not ext else 0.5 if tov.get('polluted') else 1.0)
                        for ph in ('pe', 'pp')}
        if 'slow' in cw:
            rw['si'] = {ph: required(cw['slow'][ph], ins, H, m_si(cw['slow'][ph], ph) if ext else 1.0) for ph in ('pe', 'pp')}
        if 'fast' in cw:
            f = cw['fast'].get(ins) or cw['fast'].get('external' if ext else 'internal') or next(iter(cw['fast'].values()))
            rw['li'] = {ph: required(f[ph], ins, H, 1.0) for ph in ('pe', 'pp')}
        if vffo and ins == 'gis':
            K = vffo.get('K', 1.0)
            rw['vf'] = {'pe': required(vffo['peak'], ins, H, 1.0) / K}
        conv = {}
        if Um <= 245 and 'si' in rw:
            conv['sd'], conv['li'] = {}, {}
            for ph in ('pe', 'pp'):
                conv['sd'][ph], conv['li'][ph] = convert_range_I(rw['si'][ph], ins, ph)
        if Um > 245 and 'sd' in rw:
            conv['si'] = {ph: convert_range_II(rw['sd'][ph], ins) for ph in ('pe', 'pp')}
        need = {}
        if Um <= 245:
            need['sd'] = max([rw['sd']['pe'], conv.get('sd', {}).get('pe', 0)] if 'sd' in rw else [conv.get('sd', {}).get('pe', 0)])
            need['li'] = max([rw.get('li', {}).get('pe', 0), conv.get('li', {}).get('pe', 0), rw.get('vf', {}).get('pe', 0)])
        else:
            need['si'] = max(rw.get('si', {}).get('pe', 0), conv.get('si', {}).get('pe', 0))
            need['li'] = max(rw.get('li', {}).get('pe', 0), rw.get('vf', {}).get('pe', 0))
        lv = select_level(Um, need)
        margin = {q: (lv[q] / v - 1) if v else None for q, v in need.items() if lv.get(q)}
        res[ins] = {'required': rw, 'converted': conv, 'need': need, 'level': lv, 'margin': margin}
    out['insulation'] = res
    return out
