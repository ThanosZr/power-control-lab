"""Verification report: the browser solver against independent references (closed-form results, standards,
textbook problems, the SciPy solver). Runs the solver cases in Node and writes docs/VERIFICATION.md.

    python tools/verify.py            # run and write the report
    python tools/verify.py --check    # run, fail (exit 1) if any value is outside its tolerance

Every expected value below is computed here, in Python, from the formula or the standard it cites, never taken from
the solver itself. The full test suite (python -m unittest discover -s tests) checks more; the table at the end maps
each test to its reference.
"""
import json
import math
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from engine import __version__  # noqa: E402

CASES = ROOT / 'tests' / 'js' / 'sim_cases.js'
STEP_CASES = ROOT / 'tests' / 'js' / 'step_cases.js'     # 3.13: variable step and step checks
OUT = ROOT / 'docs' / 'VERIFICATION.md'


def run_cases():
    r = subprocess.run(['node', str(CASES)], capture_output=True, text=True, timeout=900)
    if r.returncode:
        raise SystemExit(r.stderr)
    o = json.loads(r.stdout)
    r = subprocess.run(['node', str(STEP_CASES)], capture_output=True, text=True, timeout=900)
    if r.returncode:
        raise SystemExit(r.stderr)
    o['step'] = json.loads(r.stdout)
    return o


def checks(o):
    """Rows: (area, quantity, reference, expected, simulated, tolerance (absolute), unit)."""
    rows = []
    add = lambda *a: rows.append(a)
    # DC-DC converters, closed form
    add('DC-DC', 'buck CCM: V_o', 'V_o = D·V_in', 12.0, o['buck_ccm']['vo'], .01, 'V')
    add('DC-DC', 'buck CCM: Δi_L', 'Δi = (V_in − V_o)·D/(L·f_s)', (24 - 12) * .5 / (100e-6 * 100e3), o['buck_ccm']['il']['pp'], .002, 'A')
    K = 2 * 10e-6 / (50 / 100e3)
    add('DC-DC', 'buck DCM: V_o', 'V_o = 2V_in/(1 + √(1 + 4K/D²)), K = 2L/(RT)', 24 * 2 / (1 + math.sqrt(1 + 4 * K / .3 ** 2)), o['buck_dcm']['vo'], .02, 'V')
    K = 2 * 10e-6 / (100 / 50e3)
    add('DC-DC', 'boost DCM: V_o', 'V_o = V_in·(1 + √(1 + 4D²/K))/2', 12 * (1 + math.sqrt(1 + 4 * .3 ** 2 / K)) / 2, o['boost_dcm']['vo'], .05, 'V')
    add('DC-DC', 'flyback CCM: V_o', 'V_o = V_in·n·D/(1 − D)', 24 * .5 * .4 / .6, o['flyback']['vo'], .03, 'V')
    # rectifiers
    a = math.radians(60)
    add('Ανορθωτές', 'γέφυρα θυρίστορ, R, α = 60°', 'V_d = (V_m/π)·(1 + cos α)', 325 / math.pi * (1 + math.cos(a)), o['scr1']['vR'], .3, 'V')
    add('Ανορθωτές', 'γέφυρα θυρίστορ, R–L, α = 60°', 'V_d = (2V_m/π)·cos α', 2 * 325 / math.pi * math.cos(a), o['scr1']['vRL'], .3, 'V')
    vd = 3 * math.sqrt(3) / math.pi * 325
    add('Ανορθωτές', 'τριφασική γέφυρα 6 παλμών', 'V_d = 3√3·V_m/π', vd, o['bridge3']['vd'], .002 * vd, 'V')
    # control phenomena
    m2 = 24 * .6 / 50e-6
    add('Έλεγχος', 'peak current-mode, D = 0,6, ράμπα m₂/2: κορυφή', 'Î = i_c − m_a·D·T', 5 - .5 * m2 * .6 * 1e-5, o['pcm_0.6_0.5_500']['pk'][-1], 5e-4, 'A')
    add('Σήματα', 'τετραγωνικός ±5 A: THD', 'THD = √(π²/8 − 1)', 100 * math.sqrt(math.pi ** 2 / 8 - 1), o['harm']['thdAll'], .05, '%')
    add('Σήματα', 'τετραγωνικός ±5 A: θεμελιώδης', 'A₁ = 4·5/π', 20 / math.pi, o['harm']['A1'], 2e-3, 'A')
    # machines
    add('Μηχανές', 'μηχανή ΣΡ, μόνιμη ταχύτητα με φορτίο', 'ω = (V·ψ − R_a·τ_L)/(ψ² + R_a·b)', (100 - .5 * 20) / (1 + .5 * .002), o['dcm']['sched'][-1][1], .01, 'rad/s')
    # lightning current, IEC 62305-1
    lg = o['lightning']['10/350']
    add('Κεραυνικά', '10/350 μs, 200 kA: φορτίο', 'IEC 62305-1, Πίνακας 3: Q = 100 C', 100, lg['Q'], 3, 'C')
    add('Κεραυνικά', '10/350 μs, 200 kA: ειδική ενέργεια', 'IEC 62305-1: W/R = 10 MJ/Ω', 10e6, lg['W'], .5e6, 'J/Ω')
    add('Κεραυνικά', '10/350 μs: T1', 'T1 = 1,25·(t₉₀ − t₁₀)', 10e-6, lg['T1'], .2e-6, 's')
    f = o['lightning']['fit']
    add('Κεραυνικά', 'προσαρμογή 10/350: τ₁', 'IEC 62305-1, Παράρτημα Β: τ₁ = 19 μs', 19e-6, f['tau1'], .5e-6, 's')
    add('Κεραυνικά', 'προσαρμογή 10/350: η', 'IEC 62305-1: η = 0,93', .93, f['eta'], .002, '')
    # traveling waves (3.8): lattice written out: E = 1 V behind 200 Ω, Z = 400 Ω, R_L = 1200 Ω
    t = o['tl38']
    a0, gs, gl = 2 / 3, -1 / 3, .5
    add('Οδεύοντα κύματα', 'v_B στο 1,5τ (πρώτη άφιξη)', 'v⁺·(1 + Γ_L), v⁺ = E·Z/(R_s + Z)', a0 * (1 + gl), t['v'][1][1], 1e-6, 'V')
    add('Οδεύοντα κύματα', 'v_B στο 3,5τ', '+ v⁺·Γ_s·Γ_L·(1 + Γ_L)', a0 * (1 + gl) * (1 + gs * gl), t['v'][2][1], 1e-6, 'V')
    add('Οδεύοντα κύματα', 'v_A στο 3,5τ', 'v⁺·(1 + Γ_L·(1 + Γ_s))', a0 * (1 + gl * (1 + gs)), t['v'][2][0], 1e-6, 'V')
    add('Οδεύοντα κύματα', 'τελική τιμή', 'E·R_L/(R_s + R_L)', 1200 / 1400, t['v'][-1][1], 1e-6, 'V')
    li = t['imp']['1.2/50']
    add('Κρουστική τάση', '1,2/50: α', 'Voltage Impulse GUI 1.1 (test): α = 1,46591·10⁴ s⁻¹', 1.46591e4, li['alpha'], 5e-4 * 1.46591e4, 's⁻¹')
    add('Κρουστική τάση', '1,2/50: β', 'Voltage Impulse GUI 1.1: β = 2,46893·10⁶ s⁻¹', 2.46893e6, li['beta'], 5e-4 * 2.46893e6, 's⁻¹')
    add('Κρουστική τάση', '1,2/50 στην προσομοίωση: T1', 'IEC 60060-1: T1 = 1,67·(t₉₀ − t₃₀)', 1.2e-6, t['li']['T1'], 1e-9, 's')
    add('Κρουστική τάση', '1,2/50 στην προσομοίωση: T2', 'IEC 60060-1: T2 από την εικονική αρχή', 50e-6, t['li']['T2'], 1e-8, 's')
    # surge arrester (3.9): the nonlinear circuit 1 MV = 400·i + v solved here by bisection
    def bis(f):
        lo, hi = 0.0, 1e6
        for _ in range(200):
            v = (lo + hi) / 2
            lo, hi = (v, hi) if 1e6 - 400 * f(v) - v > 0 else (lo, v)
        return v
    mv = o['mov39']
    add('Αλεξικέραυνο', 'ZnO α = 30, 1 MV πίσω από 400 Ω: τάση', 'i = I_ref·(v/U_ref)^α, λύση με διχοτόμηση', bis(lambda v: 20e3 * (v / 692e3) ** 30), mv['a30']['v'], 1.0, 'V')
    pts = [(1e-3, 379e3), (1e3, 700e3), (10e3, 823e3)]
    def tbl(v):
        (i0, v0), (i1, v1) = (pts[0], pts[1]) if v < pts[1][1] else (pts[1], pts[2])
        return i0 * (v / v0) ** (math.log(i1 / i0) / math.log(v1 / v0))
    add('Αλεξικέραυνο', 'απαγωγός 420 kV (πίνακας): τάση', 'ευθείες σε λογαριθμικούς άξονες, διχοτόμηση', bis(tbl), mv['tbl']['v'], 1.0, 'V')
    # unconnected and floating parts (3.7)
    i = o['solve37']['isl']
    add('Επίλυση', 'δευτερεύον χωρίς γείωση: τάση στο R₂', 'n·V_m·R₂/(R₂ + R₃)', 5.0, i['auto']['vR2'], 1e-6, 'V')
    add('Επίλυση', '«αυτόματα»: τάση κόμβου ως προς τη γη', 'μέση τάση του τμήματος 0 V', -1.25, i['auto']['vp'], 1e-6, 'V')
    add('Επίλυση', 'ασύνδετο R και πηγή ρεύματος σε ανοιχτό', 'ίδιο ρεύμα πηνίου με το κύκλωμα χωρίς αυτά', 0.0, o['solve37']['r']['warn']['dI'], 1e-7, 'A')
    # spark gap (3.10): 1 μF at 10 kV rings through the gap with 10 μH and 0.5 Ω (series RLC from rest)
    g = o['sg310']
    R, L, C, V0 = .5, 10e-6, 1e-6, 1e4
    al = R / (2 * L)
    wd = math.sqrt(1 / (L * C) - al * al)
    k = math.exp(-al * math.pi / wd)
    add('Σπινθηριστής', 'σβέση στον πρώτο μηδενισμό του ρεύματος', 'σειριακό RLC: t = π/ω_d', math.pi / wd, g['ring']['tr'][1][0], 2e-9, 's')
    add('Σπινθηριστής', 'τάση πυκνωτή μετά τη σβέση', 'v = −V₀·e^(−απ/ω_d)', -V0 * k, g['ring']['end'], 2.0, 'V')
    add('Σπινθηριστής', 'επανέναυση (U_b = 7 kV): τελική τάση', '+V₀·e^(−2απ/ω_d)', V0 * k * k, g['restrike']['end'], 2.0, 'V')
    add('Σπινθηριστής', 'σβέση στο I_ext = 100 A (R–C): χρόνος', 't = τ·ln(I₀/I_ext), τ = (R + R_τόξου)·C', 10.1e-6 * math.log(1e4 / 10.1 / 100), g['iext']['tr'][1][0], 10e-9, 's')
    # Marx generator (3.10): the equivalent circuit of the book, eq. 3.21–3.32, and IEC 60060-1 on the analytic wave, computed here
    h = o['hv310']
    m = h['marx']['meta']
    a = 1 / (m['R1'] * m['C1']) + 1 / (m['R1'] * m['C2']) + 1 / (m['R2'] * m['C1'])
    b = 1 / (m['R1'] * m['R2'] * m['C1'] * m['C2'])
    q = math.sqrt(a * a / 4 - b)
    a1, a2 = a / 2 - q, a / 2 + q
    f = lambda t: (math.exp(-a1 * t) - math.exp(-a2 * t)) / (m['R1'] * m['C2'] * (a2 - a1))
    t1 = math.log(a2 / a1) / (a2 - a1)
    eta = f(t1)
    def cross(lv, lo, hi, up):
        for _ in range(200):
            x = (lo + hi) / 2
            lo, hi = (x, hi) if (f(x) < lv) == up else (lo, x)
        return (lo + hi) / 2
    t30, t90 = cross(.3 * eta, 0, t1, True), cross(.9 * eta, 0, t1, True)
    T1 = (t90 - t30) / .6
    T2 = cross(.5 * eta, t1, 1, False) - (t30 - .3 * T1)
    nV = m['n'] * m['V0']
    add('Γεννήτρια Marx', '4 βαθμίδες × 100 kV: κορυφή', '«Υψηλές Τάσεις» (3.28), (3.32): V_p = η·n·V₀', eta * nV, h['marx']['pk'], 1e-3 * eta * nV, 'V')
    add('Γεννήτρια Marx', 'T1', 'IEC 60060-1 στην αναλυτική κυματομορφή', T1, h['marx']['T1'], 4e-9, 's')
    add('Γεννήτρια Marx', 'T2', 'IEC 60060-1 στην αναλυτική κυματομορφή', T2, h['marx']['T2'], 1e-7, 's')
    # chopped impulse: after the chop the circuit is linear with three states (C₁ with R₂, R₁, C₂, the loop L_c with R = R_c + R_arc),
    # solved here with the matrix exponential from the generator wave at t_c
    import numpy as np
    from scipy.linalg import expm
    m = h['chop']['meta']
    a = 1 / (m['R1'] * m['C1']) + 1 / (m['R1'] * m['C2']) + 1 / (m['R2'] * m['C1'])
    b = 1 / (m['R1'] * m['R2'] * m['C1'] * m['C2'])
    q = math.sqrt(a * a / 4 - b)
    a1, a2 = a / 2 - q, a / 2 + q
    K = m['V'] / (m['R1'] * m['C2'] * (a2 - a1))
    tc = m['tc'] - m['tf']
    vc = K * (math.exp(-a1 * tc) - math.exp(-a2 * tc))
    V1 = vc + m['R1'] * m['C2'] * K * (a2 * math.exp(-a2 * tc) - a1 * math.exp(-a1 * tc))
    Rl, R1, R2, C1, C2, Lc = m['Rc'] + m['Rarc'], m['R1'], m['R2'], m['C1'], m['C2'], m['Lc']
    A = np.array([[-1 / (R2 * C1) - 1 / (R1 * C1), 1 / (R1 * C1), 0], [1 / (R1 * C2), -1 / (R1 * C2), -1 / C2], [0, 1 / Lc, -Rl / Lc]])
    E = expm(A * (1.5 * 2 * math.pi * math.sqrt(Lc * C2) / 3000))
    x = np.array([V1, vc, 0.0])
    vmin = vc
    for _ in range(3000):
        x = E @ x
        vmin = min(vmin, float(x[1]))
    add('Αποκομμένη κρουστική', 'ελάχιστη τάση μετά την αποκοπή (R_c = 20 Ω, L_c = 5 μH)', 'γραμμικό κύκλωμα C₁–R₂, R₁, C₂, L_c–R (εκθετικό πίνακα)', vmin, h['chop']['vmin'], 1.5e-3 * vc, 'V')
    # the same circuits in the second solver (engine/batch.py, SciPy solve_ivp), against the same closed forms
    from engine.batch import simulate
    at = lambda r, key, t: float(np.interp(t, np.array(r['t']), np.array(r['ch'][key], dtype=float)))
    rq = h['req']
    r = simulate({**rq['tl'], 't_end': 400e-6, 'method': 'Radau', 'rtol': 1e-9, 'atol': 1e-12})
    a0, gs, gl = 2 / 3, -1 / 3, .5
    add('Λύτης SciPy', 'γραμμή Bergeron: v_B στο 3,5τ', '+ v⁺·Γ_s·Γ_L·(1 + Γ_L)', a0 * (1 + gl) * (1 + gs * gl), at(r, 'V2:T1', 35e-6), 1e-6, 'V')
    add('Λύτης SciPy', 'γραμμή Bergeron: τελική τιμή', 'E·R_L/(R_s + R_L)', 1200 / 1400, at(r, 'V2:T1', 400e-6), 1e-6, 'V')
    R, L, C, V0 = .5, 10e-6, 1e-6, 1e4
    al = R / (2 * L)
    wd = math.sqrt(1 / (L * C) - al * al)
    r = simulate({**rq['sg'], 't_end': 30e-6, 'method': 'Radau', 'rtol': 1e-9, 'atol': 1e-9})
    add('Λύτης SciPy', 'σπινθηριστής: τάση πυκνωτή μετά τη σβέση', 'v = −V₀·e^(−απ/ω_d)', -V0 * math.exp(-al * math.pi / wd), at(r, 'V:C1', 30e-6), 1.0, 'V')
    r = simulate({**rq['mov'], 't_end': 1e-6, 'method': 'Radau', 'rtol': 1e-9, 'atol': 1e-9})
    add('Λύτης SciPy', 'αλεξικέραυνο ZnO α = 30, 1 MV πίσω από 400 Ω', 'i = I_ref·(v/U_ref)^α, λύση με διχοτόμηση', bis(lambda v: 20e3 * (v / 692e3) ** 30), at(r, 'V:M1', 1e-6), 1.0, 'V')
    # 3.11: the lossy line against the distributed line with R′ (Heaviside's step response with I₁, computed here), the gap on its
    # volt–time curve against the closed form for a ramp, the book's generators 15.3.x against the exact two-exponential wave
    from scipy import integrate, special
    def heav(aT, tT):
        g = lambda u: math.exp(aT * (math.sinh(u) - math.cosh(u))) * special.i1e(aT * math.sinh(u))
        return math.exp(-aT) + aT * integrate.quad(g, 0, math.acosh(tT), epsabs=1e-13, epsrel=1e-11, limit=200)[0] if tT >= 1 else 0.0
    tl = o['tl311']
    add('Γραμμή με απώλειες', 'ένα στοιχείο με R σε 4 τμήματα, v_L στα 25 μs', 'ρητή αλυσίδα γραμμών χωρίς απώλειες με R/16, R/8 (Dommel)', tl['c4'][4], tl['l4'][4], 1e-5, 'V')
    add('Γραμμή με απώλειες', 'τελική τιμή (R = 300 Ω, 4 τμήματα)', 'διαιρέτης DC: R_L/(R_s + R + R_L)', tl['dc'], tl['l4'][-1], 1e-5, 'V')
    t, v = tl['semi']['R100'][1][3]
    add('Γραμμή με απώλειες', 'βηματική σε ημιάπειρη γραμμή, R = Z/4, 4 τμήματα: v(ℓ, 2τ)', 'λύση Heaviside (I₁) για κατανεμημένη R′', heav(100 / 800, t / 10e-6), v, 1e-3, 'V')
    t, v = tl['semi']['R400'][2][3]
    add('Γραμμή με απώλειες', 'ίδια με R = Z, 16 τμήματα: v(ℓ, 2τ)', 'λύση Heaviside (I₁) για κατανεμημένη R′', heav(400 / 800, t / 10e-6), v, 3e-3, 'V')
    for r in o['vt311']['ramps']:
        if (r['k'], r['S']) in ((1, 3.7e11), (2, 5e12), (0, 1e11)):
            k, S, D = r['k'], r['S'], r['D']
            td = 80e3 / S + ((k + 1) * D / S ** k) ** (1 / (k + 1))
            add('Καμπύλη τάσης–χρόνου', f'ράμπα {S / 1e9:g} kV/μs, k = {k}: χρόνος διάσπασης', 't_d = U₀/S + ((k+1)·D/S^k)^(1/(k+1))', td, r['tOn'], 2e-9 * td, 's')
    hv = o['hv311']
    for key, ex in (('e1531', '15.3.1'), ('e1537', '15.3.7 (Marx 3 βαθμίδων)')):
        m = hv[key]['meta']
        a = 1 / (m['R1'] * m['C1']) + 1 / (m['R1'] * m['C2']) + 1 / (m['R2'] * (m['C2'] if m['pos'] == 'load' else m['C1']))
        b = 1 / (m['R1'] * m['R2'] * m['C1'] * m['C2'])
        q = math.sqrt(a * a / 4 - b)
        a1, a2 = a / 2 - q, a / 2 + q
        t1 = math.log(a2 / a1) / (a2 - a1)
        vp = m['U'] * (math.exp(-a1 * t1) - math.exp(-a2 * t1)) / (m['R1'] * m['C2'] * (a2 - a1))
        add('Ασκήσεις 15.3', f'{ex}: κορυφή (βιβλίο {fmt(m["book"]["Vp"], "V")})', '«Υψηλές Τάσεις» (3.28), (3.32), ακριβής λύση', vp, hv[key]['pk'], 2e-4 * vp, 'V')
    m = hv['e1533']['meta']
    a = 1 / (m['R1'] * m['C1']) + 1 / (m['R1'] * m['C2']) + 1 / (m['R2'] * m['C2'])
    b = 1 / (m['R1'] * m['R2'] * m['C1'] * m['C2'])
    q = math.sqrt(a * a / 4 - b)
    a1, a2 = a / 2 - q, a / 2 + q
    t1 = math.log(a2 / a1) / (a2 - a1)
    vl = m['U'] * (math.exp(-a1 * t1) - math.exp(-a2 * t1)) / (m['R1'] * m['C2'] * (a2 - a1)) * m['div'][0] / (m['div'][0] + m['div'][1])
    add('Ασκήσεις 15.3', '15.3.3: βραχίονας ΧΤ του καταμεριστή (βιβλίο 1069 V)', 'ακριβής λύση κυκλώματος α · C_H/(C_H + C_L)', vl, hv['e1533']['lv'], 1.0, 'V')
    r = simulate({**hv['req']['semi'], 't_end': 25e-6, 'method': 'Radau', 'rtol': 1e-9, 'atol': 1e-12})
    add('Λύτης SciPy', 'γραμμή με απώλειες, R = Z/4, 4 τμήματα: v(ℓ, 2τ)', 'λύση Heaviside (I₁) για κατανεμημένη R′', heav(100 / 800, 2), at(r, 'V2:T1', 20e-6), 1e-3, 'V')
    r = simulate({**hv['req']['vt'], 't_end': 1e-6, 'method': 'Radau', 'rtol': 1e-9, 'atol': 1e-9})
    T, y = r['t'], r['ch']['V:SG1']
    tb = next(T[i] for i in range(1, len(T)) if abs(y[i]) < .5 * abs(y[i - 1]))
    td = 80e3 / 3.7e11 + math.sqrt(2 * 5e-3 / 3.7e11)
    add('Λύτης SciPy', 'σπινθηριστής με καμπύλη τάσης–χρόνου, ράμπα 370 kV/μs, k = 1', 't_d = U₀/S + √(2D/S)', td, tb, 2e-9 * td, 's')
    # 3.12: the divider of 15.1.5 and the Schering bridge of 15.5.12 by phasors computed here; the book's breakdown statistics
    # (15.5.28, 15.5.29) by the templates against numpy/scipy
    w = 2 * math.pi * 50
    q = o['hv312']
    m = q['div']['meta']
    ZH, ZL = 1 / (1j * w * m['CH']), 1 / (1j * w * (m['CL'] + m['Ccab'] + m['Cs']) + 1 / m['Rs'])
    V = 834.39e3 / math.sqrt(2)
    add('Μετρήσεις ΥΤ', '15.1.5: τάση στον παλμογράφο (βιβλίο 585,71 V)', 'φασιθέτες: |Z_L/(Z_H + Z_L)|·U', V * abs(ZL / (ZH + ZL)), V * q['div']['r']['V:CL'], .2, 'V')
    for key, lab in (('fix', 'ισορροπημένη: ανιχνευτής / κόμβος A'), ('r4', 'R₄ +10 %: τάση ανιχνευτή (10 kV)')):
        m = q[key]['meta']
        Yx, Y2, Y3, Y4, YD = 1 / (m['Rx'] + 1 / (1j * w * m['Cx'])), 1j * w * m['C2'], 1 / m['R3'], 1 / m['R4'] + 1j * w * m['C4'], 1 / m['RD']
        VA, VB = np.linalg.solve(np.array([[Yx + Y3 + YD, -YD], [-YD, Y2 + Y4 + YD]]), np.array([Yx, Y2]))
        if key == 'fix':
            add('Μετρήσεις ΥΤ', f'15.5.12 Schering, {lab}', 'φασιθέτες, R₃ = C₂·R₄/C_x, R₄ = tan δ/(ω·C₄). Υπόλοιπο από το βήμα ≈ (ω·Δt)²/12 = 2·10⁻⁵', abs(VA - VB) / abs(VA), q[key]['r']['V:RD'] / q[key]['r']['V:R3'], 5e-5, '')
        else:
            add('Μετρήσεις ΥΤ', f'15.5.12 Schering, {lab}', 'φασιθέτες των δύο κόμβων με τον ανιχνευτή', 1e4 * abs(VA - VB), 1e4 * q[key]['r']['V:RD'], 1e-4, 'V')
    from engine.templates import template_solve
    from scipy import stats
    ld = lambda f: json.loads((ROOT / 'web' / 'studio' / 'exercises' / f).read_text(encoding='utf-8'))
    v = template_solve({'template': ld('hv_multilevel.template.json'), 'values': {}})['values']
    bb, aa = np.polyfit(np.arange(102, 110) * 1e3, stats.norm.ppf(np.array([1, 2, 4, 8, 10, 14, 16, 18]) / 20), 1)
    add('Στατιστική διάσπασης', '15.5.28: U₅₀ με δοκιμή πολλαπλών επιπέδων (βιβλίο 106 kV από το διάγραμμα)', 'προσαρμογή probit με numpy/scipy', -aa / bb, v['U_50'], 1e-3, 'V')
    v = template_solve({'template': ld('hv_successive.template.json'), 'values': {}})['values']
    x = np.repeat(np.arange(101, 110) * 1e3, [1, 2, 3, 4, 4, 3, 1, 1, 1])
    add('Στατιστική διάσπασης', '15.5.29: τυπική απόκλιση (βιβλίο 23,04 kV)', 'numpy std(ddof=1)', float(x.std(ddof=1)), v['s_d'], 1e-3, 'V')
    # 3.13: variable step with error control (ROADMAP §40), and the step check's time constants and frequencies
    st = o['step']
    R, L, C = .5, 10e-6, 1e-6
    a = R / (2 * L)
    wd = math.sqrt(1 / (L * C) - a * a)
    add('Βήμα του λύτη', 'μεταβλητό, RLC 5 περίοδοι: μέγιστο |v_C − ακριβής|, 535 βήματα αντί για 2000', 'v_C = V₀e^(−αt)(cos ω_d t + (α/ω_d)·sin ω_d t)', 0, st['rlc']['var']['err'], .02, 'V')
    C1, C2, R1, R2, V0 = 50e-9, 1e-9, 400, 2600, 1e5
    aa, bb = R1 * R2 * C1 * C2, R1 * C1 + R2 * C1 + R2 * C2
    s1, s2 = (-bb + math.sqrt(bb * bb - 4 * aa)) / (2 * aa), (-bb - math.sqrt(bb * bb - 4 * aa)) / (2 * aa)
    tp = math.log(s2 / s1) / (s1 - s2)
    vpk = V0 / (R1 * C2) * (math.exp(s1 * tp) - math.exp(s2 * tp)) / (s1 - s2)
    add('Βήμα του λύτη', f'μεταβλητό, γεννήτρια κρουστικών μίας βαθμίδας: κορυφή ({st["impulse"]["var"]["steps"]} βήματα αντί για 5000)', 'v₂ = V₀/(R₁C₂)·(e^{s₁t} − e^{s₂t})/(s₁ − s₂)', vpk, st['impulse']['var']['pk'], 1e-3 * vpk, 'V')
    add('Βήμα του λύτη', 'έλεγχος βήματος: συχνότητα της ιδιομορφής RLC', 'f = √(1/(LC) − α²)/2π', wd / (2 * math.pi), st['rlc']['mode_f'], 1e-6 * wd, 'Hz')
    tau = 1 * 1e6 / (1 + 1e6) * 1e-6
    rc = [d for d in st['check']['rc_coarse'] if d['tau']][0]['tau']
    add('Βήμα του λύτη', 'έλεγχος βήματος: σταθερά χρόνου RC', 'τ = (R₁ ∥ R₂)·C', tau, rc, 1e-6 * tau, 's')
    return rows


TESTS = [
    ('tests/test_studio_sim.py', 'λύτης του browser', 'κλειστοί τύποι DC-DC και ανορθωτών, ανεξάρτητες ΔΕ (μηχανές ΣΡ, επαγωγής, σύγχρονη, SRM, συζευγμένα πηνία), IEC 62305-1, IEC 60060-1, πλέγμα Bewley, δειγματοληψία, μπλοκ σημάτων'),
    ('tests/test_tutorials.py', 'tutorials όπως ανοίγουν στην εφαρμογή', 'θεωρία των καρτών, ισοδύναμα κυκλώματα, MTPA, ισοζύγιο ενέργειας SRM, μέθοδος των χαρακτηριστικών, ασκήσεις 15.3.1–15.3.7, 15.4.9 και 15.5.3 και γεννήτρια Marx (σχέσεις 3.21–3.44) του βιβλίου «Υψηλές Τάσεις», αποκομμένη κρουστική (IEC 60076-3), λύση Heaviside της γραμμής με απώλειες, κριτήριο ενέργειας διάσπασης'),
    ('tests/test_batch.py', 'λύτης SciPy (solve_ivp) στο ίδιο netlist', 'δεύτερος, ανεξάρτητος λύτης: ίδιες κυματομορφές σε 1e-4 … 1e-7, και για γραμμές (και με απώλειες), αλεξικέραυνα, σπινθηριστές (και με καμπύλη τάσης–χρόνου) και τα tutorials υψηλών τάσεων'),
    ('tests/test_templates.py, test_engine.py', 'συμβολική λύση και templates', 'λύσεις των ασκήσεων (PE2, Άσκηση 2) με SymPy'),
    ('tests/test_step.py', 'βήμα του λύτη (3.13)', 'μεταβλητό βήμα απέναντι σε κλειστούς τύπους (RLC, γεννήτρια κρουστικών) και σε λεπτό σταθερό βήμα (flyback, Marx), σταθερές χρόνου και συχνότητες του ελέγχου βήματος, ταλάντωση δύο βημάτων'),
    ('tests/test_pcl.py', 'σενάρια από κώδικα, πακέτο pcl (3.13)', 'κυμάτωση ΔI = V_o(1 − D)/(L·f_s) σε σάρωση, ίδια αριθμοί με τον λύτη της εφαρμογής, SciPy, CSV/JSON/.mat, γραμμή εντολών'),
    ('tests/ui/*.js', 'περιβάλλον (Playwright)', 'σχέδιο, scopes, πάνελ, εργαλείο σύρματος, ζωντανές παράμετροι, κονσόλα διαγνωστικών'),
]

LIMITS = [
    'Οι απώλειες της γραμμής είναι σταθερή R′ σε σειρά, συγκεντρωμένη σε N τμήματα (Dommel). Συγκλίνει στην κατανεμημένη γραμμή περίπου ως 1/N. Δεν υπάρχουν ακόμη αγωγιμότητα G′, επιδερμικό φαινόμενο, corona και γραμμές εξαρτώμενες από τη συχνότητα (ROADMAP §26).',
    'Η καμπύλη τάσης–χρόνου του σπινθηριστή είναι το κριτήριο ενέργειας διάσπασης με σταθερές U₀, k, D. Οι σταθερές των tutorials είναι ενδεικτικές, όχι μετρήσεις διακένου. Ο σπινθηριστής δεν έχει χωρητικότητα και η γεννήτρια Marx ανάβει χωρίς παρασιτικές χωρητικότητες.',
    'Δεν υπάρχει ακόμη κορεσμός πυρήνα μετασχηματιστή (ROADMAP §31).',
    'Οι μηχανές έχουν τυπικές τιμές όπου λείπουν δεδομένα. Ελέγχονται απέναντι σε ανεξάρτητες ΔΕ, όχι σε μετρήσεις.',
    'Ο λύτης είναι πυκνός και τρέχει σε ένα thread (ROADMAP §32).',
    'Μεταβλητό βήμα (3.13): ο έλεγχος σφάλματος είναι ανά βήμα (σχετικό τοπικό σφάλμα των καταστάσεων). Σε ταλάντωση με μικρή απόσβεση το συνολικό σφάλμα μεγαλώνει με τις περιόδους, και οι κορυφές μεγεθών που δεν είναι καταστάσεις (π.χ. ρεύμα πυκνωτή) δειγματοληπτούνται πιο αραιά. Σε μετατροπείς με πυκνό PWM το σταθερό βήμα είναι συνήθως ταχύτερο. Τα tutorials και οι τιμές αυτής της αναφοράς, εκτός από τις γραμμές «Βήμα του λύτη», είναι με σταθερό βήμα.',
]


def fmt(v, unit):
    if unit in ('', '%', 's⁻¹'):                     # no SI prefixes for these
        return (f'{v:.6g}'.replace('.', ',') + (' ' + unit if unit else '')).replace('e+0', '·10^').replace('e-0', '·10^-')
    if v == 0:
        return '0' + (' ' + unit if unit else '')
    a = abs(v)
    for k, p in ((1e9, 'G'), (1e6, 'M'), (1e3, 'k'), (1, ''), (1e-3, 'm'), (1e-6, 'μ'), (1e-9, 'n'), (1e-12, 'p')):
        if a >= k * .9999995:
            return f'{v / k:.5g} {p}{unit}'.replace('.', ',').strip()
    return f'{v:.4g} {unit}'.replace('.', ',')


def report(rows):
    ok = all(abs(s - e) <= tol for _, _, _, e, s, tol, _ in rows)
    out = [
        '# Αναφορά επαλήθευσης',
        '',
        'Οι εξισώσεις και οι παραδοχές των μοντέλων είναι στο [THEORY.md](THEORY.md).',
        '',
        f'Έκδοση {__version__}. Παράγεται με `python tools/verify.py`. Ο CI τρέχει `python tools/verify.py --check` και σταματά αν κάποια τιμή βγει εκτός ανοχής.',
        '',
        '**Πώς διαβάζεται:**',
        '- Η «Αναφορά» είναι ανεξάρτητη από τον λύτη: κλειστός τύπος, πρότυπο, πρόβλημα βιβλίου ή εργαλείο τρίτου.',
        '- Η «Αναμενόμενη» τιμή υπολογίζεται στο `tools/verify.py` από αυτήν, όχι από τον κώδικα του λύτη.',
        '- Η «Προσομοίωση» είναι ο λύτης του browser (`web/studio/mna.js`), τρεγμένος στο Node. Στην περιοχή «Λύτης SciPy» είναι ο δεύτερος λύτης (`engine/batch.py`, solve_ivp) στο ίδιο netlist.',
        '',
        f'**Αποτέλεσμα:** {sum(abs(s - e) <= tol for _, _, _, e, s, tol, _ in rows)} από {len(rows)} μέσα στην ανοχή.' + ('' if ok else ' **Υπάρχουν τιμές εκτός ανοχής.**'),
        '',
        '| Περιοχή | Μέγεθος | Αναφορά | Αναμενόμενη | Προσομοίωση | Διαφορά | Ανοχή | |',
        '|---|---|---|---:|---:|---:|---:|---|',
    ]
    for area, q, ref, e, s, tol, u in rows:
        d = s - e
        ds = '≈ 0' if abs(d) < 1e-4 * tol else fmt(d, u)
        out.append(f'| {area} | {q} | {ref} | {fmt(e, u)} | {fmt(s, u)} | {ds} | {fmt(tol, u)} | {"✓" if abs(d) <= tol else "✗"} |')
    out += ['', '## Τι καλύπτουν τα υπόλοιπα tests', '', '| Αρχείο | Τι ελέγχει | Αναφορές |', '|---|---|---|']
    out += [f'| `{a}` | {b} | {c} |' for a, b, c in TESTS]
    out += ['', 'Μαζί 180 tests (Python και Node) και 6 σενάρια περιβάλλοντος. Τρέχουν σε κάθε push στον CI του GitHub (`.github/workflows/ci.yml`).', '',
            '## Γνωστοί περιορισμοί', '']
    out += [f'- {x}' for x in LIMITS]
    out += ['', '## Λάθη που βρήκε ο έλεγχος σε υλικό αναφοράς', '',
            '- «Υψηλές Τάσεις», άσκηση 15.4.4 (Ferranti): η λύση βάζει το μήκος δύο φορές, cos(7,2°·1,2·120). Σωστό: 75 kV / cos 8,64° = 75,86 kV αντί για 102,89 kV.',
            '- «Υψηλές Τάσεις», άσκηση 15.4.9: στη λύση το B στο 2τ λογίζεται με α_B = −0,47 και το A στο 3τ με το ίδιο κύμα ανακλασμένο με −1. Λείπει και το κύμα που ξεκινά από το B όταν ανάβει το αλεξικέραυνο. Οι ακριβείς τιμές είναι στο tutorial «Οδεύοντα κύματα».',
            '']
    return '\n'.join(out), ok


def main():
    o = run_cases()
    rows = checks(o)
    text, ok = report(rows)
    bad = [r for r in rows if abs(r[4] - r[3]) > r[5]]
    for r in bad:
        print(f'εκτός ανοχής: {r[0]} · {r[1]}: αναμενόμενη {r[3]}, προσομοίωση {r[4]}, ανοχή {r[5]}', file=sys.stderr)
    if '--check' in sys.argv:
        print(f'{len(rows) - len(bad)}/{len(rows)} μέσα στην ανοχή')
        sys.exit(1 if bad else 0)
    OUT.write_text(text + '\n', encoding='utf-8')
    print(f'Γράφτηκε {OUT.relative_to(ROOT)}: {len(rows) - len(bad)}/{len(rows)} μέσα στην ανοχή')
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
