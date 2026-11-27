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
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from engine import __version__  # noqa: E402

CASES = ROOT / 'tests' / 'js' / 'sim_cases.js'
STEP_CASES = ROOT / 'tests' / 'js' / 'step_cases.js'     # 3.13: variable step and step checks
NET_CASES = ROOT / 'tests' / 'js' / 'netlib_cases.js'    # 4.1: network library
GEN_CASES = ROOT / 'tests' / 'js' / 'gen_cases.js'       # 4.3: generator, First Benchmark, IEEE 9 in EMT
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
    r = subprocess.run(['node', str(NET_CASES)], capture_output=True, text=True, timeout=900)
    if r.returncode:
        raise SystemExit(r.stderr)
    o['net'] = json.loads(r.stdout)
    r = subprocess.run(['node', str(GEN_CASES)], capture_output=True, text=True, timeout=900)
    if r.returncode:
        raise SystemExit(r.stderr)
    o['gen'] = json.loads(r.stdout)
    return o


def gen_rows(g, add):
    """4.3: the generator and its shaft against the IEEE First Benchmark Model (1977), the classical short-circuit
    curve, the load flow of IEEE 9 and Anderson & Fouad."""
    fb = 'IEEE First Benchmark Model (1977)'
    d = g['fbm_conv']['exact']['d']
    add('Γεννήτρια (4.3)', 'First Benchmark, τυπικά → κύκλωμα (ακριβής): 377·R_fd', fb + ', Πίνακας I (από τον Πίνακα II)', 0.53, 377 * d[0]['R'], 0.01 * 0.53, '')
    add('Γεννήτρια (4.3)', 'ίδιο: X_kd', fb + ', Πίνακας I', 0.0055, min(d, key=lambda w: abs(w['X'] - 0.0055))['X'], 0.01 * 0.0055, 'pu')
    pk = g['shaft']['peaks']
    for k, f0 in enumerate((15.71, 20.21, 25.55, 32.28)):
        add('Γεννήτρια (4.3)', f'άξονας έξι μαζών, ρυθμός {k + 1} (φάσμα, ανοιχτός στάτης)', fb + ', Σχ. 4', f0, pk[k] if k < len(pk) else float('nan'), 0.03, 'Hz')
    c1s = g['case1s']
    add('Γεννήτρια (4.3)', 'περίπτωση 1-S: αύξηση του ρυθμού 3', fb + ', αποτελέσματα 1-S (έξι μάζες)', 1.525, c1s['base']['25.55']['growth'], 0.02 * 1.525, '1/s')
    add('Γεννήτρια (4.3)', '1-S με επιπλέον R_a = 0,467 pu: αύξηση', fb + ' (σταθερή ταλάντωση)', 0.0, c1s['dR']['25.55']['growth'], 0.03, '1/s')
    add('Γεννήτρια (4.3)', '1-S με X_c μικρότερο κατά 0,047 pu: αύξηση', fb + ' (σταθερή ταλάντωση)', 0.0, c1s['dXc']['25.55']['growth'], 0.03, '1/s')
    add('Γεννήτρια (4.3)', '1-S με επιπλέον D = 75,9 pu στη γεννήτρια: αύξηση', fb + ' (σταθερή ταλάντωση)', 0.0, c1s['dD']['25.55']['growth'], 0.03, '1/s')
    c1t = g['case1t']
    add('Γεννήτρια (4.3)', 'περίπτωση 1-T: ροπή LPA–LPB, πρώτο μέγιστο', fb + ', Σχ. 5d (ανάγνωση)', 3.4, c1t['ts3a'][0], 0.25, 'pu')
    add('Γεννήτρια (4.3)', 'ίδιο: χρόνος του πρώτου μεγίστου μετά το σφάλμα', fb + ', Σχ. 5d (ανάγνωση)', 0.135, c1t['ts3a'][1], 0.015, 's')
    add('Γεννήτρια (4.3)', 'περίπτωση 1-T: ροπή GEN–EXC, μέγιστο 0,40–0,48 s', fb + ', Σχ. 5e (ανάγνωση)', 1.0, c1t['ts5'][0], 0.15, 'pu')
    sc = g['gen_sc']
    p = sc['gen']
    X, X1, X2, T10, T20 = p['Xd'], p['Xdp'], p['Xdpp'], p['Td0p'], p['Td0pp']
    P = X2 * T10 * T20 / X
    f = lambda T: X1 * (T * (T - P / T) - (T - T10) * (T - T20)) - X * T * (T - P / T)
    lo, hi = 0.5 * X1 / X * T10, 1.5 * X1 / X * T10
    for _ in range(200):
        m = (lo + hi) / 2
        lo, hi = (lo, m) if f(lo) * f(m) <= 0 else (m, hi)
    T1 = (lo + hi) / 2
    T2 = P / T1
    Ib = p['Sn'] / (math.sqrt(3) * p['Un'])
    for row in sc['res']:
        if row['tau'] in (0.1, 1):
            tau = row['tau']
            ref = ((1 / X2 - 1 / X1) * math.exp(-tau / T2) + (1 / X1 - 1 / X) * math.exp(-tau / T1) + 1 / X) * Ib
            add('Γεννήτρια (4.3)', f'τριφασικό βραχυκύκλωμα στα άκρα: I_ac στο τ = {tau:g} s (μέσος φάσεων)'.replace('.', ','), 'καμπύλη απόσβεσης (T″_d, T′_d ακριβείς)', ref, sum(row['ac']) / 3, 0.015 * ref, 'A')
    i9 = g['ieee9']
    import pcl.network as nw
    lf = nw.ieee9().load_flow()
    add('Γεννήτρια (4.3)', 'IEEE 9 σε EMT από τη ροή φορτίου: μέτρο της τάσης του ζυγού 9 μετά από 0,3 s', 'pcl.network (Newton–Raphson)', lf['buses']['9']['V'], i9['bus']['9'][0], 1e-5, 'pu')
    add('Γεννήτρια (4.3)', 'ίδιο: γωνία ζυγού 9', 'pcl.network (Newton–Raphson)', lf['buses']['9']['angle'], i9['bus']['9'][1], 1e-3, '°')
    add('Γεννήτρια (4.3)', 'IEEE 9: δ γεννήτριας 2 (άξονας q)', 'Anderson & Fouad, Πίνακας 9.1', 61.0975, i9['gen']['G2']['d'], 0.01, '°')
    add('Γεννήτρια (4.3)', 'IEEE 9: δ γεννήτριας 3', 'Anderson & Fouad, Πίνακας 9.1', 54.1431, i9['gen']['G3']['d'], 0.01, '°')
    add('Γεννήτρια (4.3)', 'IEEE 9, σφάλμα 5 κύκλων, κλασικό μοντέλο: πλάτος αιώρησης δ₂₁', 'Anderson & Fouad, Παράδειγμα 2.7 (85° από 17,5°)', 67.5,
        i9['swing']['max'] - i9['swing']['d0'], 6.75, '°')


def line_rows(add):
    """4.4: the line constants against the EMTP Theory Book (Dommel ch. 4) and Carson's integral, and the line in the
    browser solver against the numerical Laplace transform of the same model and of the exact line."""
    import cmath
    import tempfile
    import numpy as np
    from pcl import lineconst as lc
    D4, mile = 'Dommel, EMTP Theory Book', 1609.344
    Rdc, r = 0.0398 / mile, 0.01
    for f, ref in ((60, 1.1347), (10000, 11.2209), (1e6, 110.0357)):
        add('Γραμμές (4.4)', f'σωληνωτός αγωγός q/r = 0,2258: R_ac/R_dc στα {f:g} Hz', D4 + ', Πίνακας 4.1', ref,
            lc.z_internal(f, r, 0.2258 * r, Rdc).real / Rdc, 2e-4 * ref, '')
    Ldc = lc.z_internal(0, r, 0.2258 * r, Rdc, 1, False, s=1j).imag
    add('Γραμμές (4.4)', 'ίδιο: L_εσωτ,ac/L_εσωτ,dc στο 1 kHz', D4 + ', Πίνακας 4.1', 0.29924,
        lc.z_internal(1000, r, 0.2258 * r, Rdc).imag / (2 * math.pi * 1000) / Ldc, 1e-5, '')
    inch, ft = 0.0254, 0.3048
    gmr, R, h, xs = 7.41838 * inch, 0.1686 / 4 / mile, 50 * ft, [-40 * ft, 0, 40 * ft]

    def seq(f):
        w = 2 * math.pi * f
        z = np.zeros((3, 3), complex)
        for i in range(3):
            for k in range(3):
                if i == k:
                    z[i, i] = R + 1j * w * lc.MU0 / (2 * math.pi) * math.log(2 * h / gmr) + lc.carson_series(2 * h, 0, f, 100)
                else:
                    dx = xs[i] - xs[k]
                    Dk = math.hypot(dx, 2 * h)
                    z[i, k] = 1j * w * lc.MU0 / (2 * math.pi) * math.log(Dk / abs(dx)) + lc.carson_series(Dk, math.asin(abs(dx) / Dk), f, 100)
        z1, z0 = lc.sequence(z)
        return z1 * mile, z0 * mile, w
    for f, kind, ref, tol in ((1e4, 'R1', 0.3528, 5e-5), (1e5, 'R1', 6.229, 5e-4), (1e5, 'L1', 1.401, 5e-4), (100, 'R0', 0.4960, 5e-5),
                              (1e5, 'R0', 184.0, 0.05), (10, 'L0', 6.170, 5e-4), (1e5, 'L0', 2.568, 5e-4)):
        z1, z0, w = seq(f)
        z = z1 if kind[1] == '1' else z0
        k = 1.0 if kind[0] == 'R' else 1e-3             # the book gives L in mH/mile
        v = z.real if kind[0] == 'R' else z.imag / w
        add('Γραμμές (4.4)', f'γραμμή 500 kV, ρ = 100 Ω·m: {"R" if kind[0] == "R" else "L"}{"₁" if kind[1] == "1" else "₀"} στα {f:g} Hz',
            D4 + (', Πίνακας 4.3' if kind[1] == '1' else ', Πίνακας 4.4'), ref * k, v, tol * k, 'Ω/mile' if kind[0] == 'R' else 'H/mile')
    Dc = math.hypot(40, 42)
    a3 = lc.carson_series(Dc, math.asin(40 / Dc), (3 / (4 * math.pi * math.sqrt(5) * 1e-4 * Dc)) ** 2 * 100, 100)
    i3 = lc.carson_integral(30, 12, 40, (3 / (4 * math.pi * math.sqrt(5) * 1e-4 * Dc)) ** 2 * 100, 100)
    add('Γραμμές (4.4)', 'σειρά Carson, αμοιβαία, a = 3: |ΔZ_σειρά/ΔZ_ολοκλ. − 1|', 'ολοκλήρωμα του Carson (αριθμητικά)', 0.0, abs(a3 / i3 - 1), 1e-6, '')
    d = lc.typical('400kV')
    d['earth'] = 'deri'
    models = {'cp': lc.cp_model(d, 50), 'fd': lc.fd_model(d)}
    tend = 3e-3

    def net(kind):
        return {'nodes': 6, 'el': [('V', 1, 0, 10.0, ('ramp', 1.0, 20e-6)), ('R', 2, 0, 10.0), ('R', 3, 0, 10.0),
                                   ('LINE', [1, 2, 3], [4, 5, 6], d, kind), ('R', 4, 0, 1e6), ('R', 5, 0, 1e6), ('R', 6, 0, 1e6)]}
    ex = lc.nlt_solve(net('exact'), tend, n=8192)
    for kind in ('cp', 'fd'):
        q = {'data': d, 'model': models[kind], 'kind': kind, 'f': 50, 'h': 0.3e-6, 'tend': tend,
             'src': {'Vpk': 1.0, 'tr': 20e-6, 'Rs': 10.0}, 'R': 1e6}
        with tempfile.NamedTemporaryFile('w', suffix='.json', delete=False) as fh:
            json.dump(q, fh)
        try:
            o = json.loads(subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'line_cases.js'), fh.name], capture_output=True,
                                          text=True, check=True, timeout=600).stdout)
        finally:
            Path(fh.name).unlink()
        t, V = np.array(o['t']), np.array(o['v'])

        def err(ref):
            tn, Vr = ref
            return max(np.abs(np.interp(t, tn, Vr[j]) - V[j]).max() for j in range(6)) / np.abs(Vr).max()
        add('Γραμμές (4.4)', f'ζεύξη φάσης της γραμμής 400 kV (100 km, Δt = 0,3 μs), {kind.upper()}: μέγιστη απόκλιση από το ίδιο μοντέλο / μέγιστο',
            'αριθμητικός μετασχηματισμός Laplace (8192 συχνότητες)', 0.0, err(lc.nlt_solve(net(models[kind]), tend, n=8192)), 0.004 if kind == 'cp' else 0.0025, '')
        if kind == 'fd':
            add('Γραμμές (4.4)', 'ίδιο, FD: μέγιστη απόκλιση από την ακριβή γραμμή / μέγιστο', 'Z′(s), Y′(s) ακριβή, μιγαδικά ιδιοδιανύσματα σε κάθε s', 0.0, err(ex), 0.006, '')


def cable_rows(add):
    """4.5: the cable constants (Dommel ch. 5) against a field computation of thin concentric shells, Wedepohl's
    approximation, the infinite medium and the coaxial line, and the submarine cable in the browser solver against the
    numerical Laplace transform of the same model and of the exact cable."""
    import sys
    import tempfile
    import numpy as np
    sys.path.insert(0, str(ROOT / 'tests'))
    from test_lines import _peec
    from pcl import lineconst as lc
    D5, G = 'Dommel, EMTP Theory Book, κεφ. 5', 'Καλώδια (4.5)'
    one = {'medium': 'perfect', 'rho': 1, 'cables': [{'x': 0, 'y': 5, 'ph': [1, 2], 'layers': [
        {'t': 'c', 'rin': 0, 'rout': 0.0256, 'rho': 1.7e-8}, {'t': 'i', 'rout': 0.055, 'epsr': 2.3},
        {'t': 'c', 'rin': 0.055, 'rout': 0.0575, 'rho': 2.8e-8}, {'t': 'i', 'rout': 1.0, 'epsr': 1}]}]}
    for f in (50, 1e5):
        d = math.sqrt(1.7e-8 / (math.pi * f * lc.MU0))
        Zp = _peec([(0, 0.0256, 1.7e-8, 400, d / 30), (0.055, 0.0575, 2.8e-8, 300, d / 40)], f, 1.0)
        Z = lc.cable_zy(one, 2j * math.pi * f)[0]
        add(G, f'αγωγός και θωράκιση (Bessel, εξ. 5.1–5.17): max |ΔZ|/|Z| στα {f:g} Hz', 'υπολογισμός πεδίου σε 700 λεπτούς ομόκεντρους φλοιούς', 0.0,
            float((np.abs(Z - Zp) / np.abs(Zp)).max()), 1e-6, '')
    s = 2j * math.pi * 50
    a, b = lc.pollaczek(s, 1.2, 1.2, 0.25, 100), lc.wedepohl(s, 1.2, 1.2, 0.25, 100)
    add(G, 'επιστροφή από το έδαφος, αμοιβαία, 50 Hz, ρ = 100 Ω·m: |Pollaczek/Wedepohl − 1|', D5 + ', εξ. 5.22 και 5.25', 0.0, abs(a / b - 1), 2e-5, '')
    a, b = lc.pollaczek(s, 2000, 2000, 0.06, 1, d=0.06), lc.sea_return(s, 0.06, 0.06, 0, 1)
    add(G, 'καλώδιο σε βάθος 2 km: |Pollaczek/άπειρο μέσο − 1|', D5 + ', εξ. 5.28', 0.0, abs(a / b - 1), 1e-4, '')
    sea = {'medium': 'sea', 'rho': 0.2, 'cables': [{**one['cables'][0], 'ph': [1, 0]}]}
    sea['cables'][0]['layers'] = [dict(x) for x in one['cables'][0]['layers']]
    sea['cables'][0]['layers'][1]['tand'] = 4e-4
    Z, Y = lc.phase_matrices(sea, 1e6)
    zc = abs(np.sqrt(Z[0, 0] / Y[0, 0]))
    ref = 60 / math.sqrt(2.3) * math.log(0.055 / 0.0256)
    add(G, 'ρυθμός αγωγός–θωράκιση στο 1 MHz: Z_c', 'ομοαξονική γραμμή χωρίς απώλειες, 60/√ε_r·ln(r₂/r₁)', ref, zc, 0.01 * ref, 'Ω')
    m = lc.fd_model(lc.typical('220kV-sea'))
    add(G, 'υποβρύχιο 220 kV, FD: μέγιστο σφάλμα προσαρμογής του A (απόλυτο)', 'ανοχή του μοντέλου (όπως η εναέρια γραμμή)', 0.0,
        max(q['a']['err'] for q in m['modes']), 0.005, '')
    d = lc.typical('220kV-sea')
    models = {'cp': lc.cp_model(d, 50), 'fd': m}
    tend = 1.5e-3

    def net(kind):
        return {'nodes': 6, 'el': [('V', 1, 0, 30.0, ('ramp', 1.0, 20e-6)), ('R', 2, 0, 30.0), ('R', 3, 0, 30.0),
                                   ('LINE', [1, 2, 3], [4, 5, 6], d, kind), ('R', 4, 0, 1e6), ('R', 5, 0, 1e6), ('R', 6, 0, 1e6)]}
    ex = lc.nlt_solve(net('exact'), tend, n=8192)
    for kind in ('cp', 'fd'):
        q = {'data': d, 'model': models[kind], 'kind': kind, 'f': 50, 'h': 0.2e-6, 'tend': tend,
             'src': {'Vpk': 1.0, 'tr': 20e-6, 'Rs': 30.0}, 'R': 1e6}
        with tempfile.NamedTemporaryFile('w', suffix='.json', delete=False) as fh:
            json.dump(q, fh)
        try:
            o = json.loads(subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'line_cases.js'), fh.name], capture_output=True,
                                          text=True, check=True, timeout=600).stdout)
        finally:
            Path(fh.name).unlink()
        t, V = np.array(o['t']), np.array(o['v'])

        def err(ref):
            tn, Vr = ref
            return max(np.abs(np.interp(t, tn, Vr[j]) - V[j]).max() for j in range(6)) / np.abs(Vr).max()
        add(G, f'ζεύξη φάσης του υποβρύχιου 220 kV (30 km, Δt = 0,2 μs), {kind.upper()}: μέγιστη απόκλιση από το ίδιο μοντέλο / μέγιστο',
            'αριθμητικός μετασχηματισμός Laplace (8192 συχνότητες)', 0.0, err(lc.nlt_solve(net(models[kind]), tend, n=8192)), 0.0035, '')
        if kind == 'fd':
            add(G, 'ίδιο, FD: μέγιστη απόκλιση από το ακριβές καλώδιο / μέγιστο', 'Z′(s), Y′(s) ακριβή, μιγαδικά ιδιοδιανύσματα σε κάθε s', 0.0, err(ex), 0.0035, '')


def trv_rows(add):
    """4.9: the rated TRV of the browser (web/studio/trv.js) against the tables and Annex A of IEC 62271-100:2021, and the
    arc of a breaker pole (mna.js) against an independent stiff integration of the same circuit (SciPy Radau)."""
    js = ("const T=require(process.argv[1]);const a=T.rated(145e3,'T100'),b=T.rated(245e3,'T10'),s=T.slf(245e3,50e3,0.9);"
          "console.log(JSON.stringify({a,b,s}))")
    r = json.loads(subprocess.run(['node', '-e', js, str(ROOT / 'web' / 'studio' / 'trv.js')], capture_output=True, text=True,
                                  timeout=60, check=True).stdout)
    iec = 'IEC 62271-100:2021'
    a, b, s = r['a'], r['b'], r['s']
    add('TRV (4.9)', '145 kV, T100, k_pp 1,3: u_c', iec + ', Πίν. 20', 215, a['uc'] / 1e3, 0.01 * 215, 'kV')
    add('TRV (4.9)', '145 kV, T100: t₁', iec + ', Πίν. 20', 58, a['t1'] * 1e6, 0.01 * 58, 'μs')
    add('TRV (4.9)', '245 kV, T10: u_c', iec + ', Πίν. 20', 459, b['uc'] / 1e3, 0.01 * 459, 'kV')
    add('TRV (4.9)', '245 kV, 50 kA, L90: u_L* της πλευράς της γραμμής', iec + ', Παρ. A.4.2', 32, s['uL'] / 1e3, 0.01 * 32, 'kV')
    add('TRV (4.9)', '245 kV, 50 kA, L90: t_L', iec + ', Παρ. A.4.2', 3.56, s['tL'] * 1e6, 0.01 * 3.56, 'μs')
    sys.path.insert(0, str(ROOT / 'tests'))
    import numpy as np
    from test_arc import CASES as ARC, features, reference
    o = json.loads(subprocess.run(['node', str(ARC)], capture_output=True, text=True, timeout=900, check=True).stdout)['imayr']
    ts = np.array([q[0] for q in o['rec']])
    b = features(ts, np.array([q[1] for q in o['rec']]), np.array([q[2] for q in o['rec']]), o['t0'])
    tr, ir, vr = reference(o)
    f = features(tr, ir, vr, o['t0'])
    ref = 'ανεξάρτητη ολοκλήρωση (Radau, rtol 10⁻¹⁰) του ίδιου κυκλώματος'
    add('Τόξο (4.9)', 'βελτιωμένο Mayr, 145 kV/20 kA, C = 2 nF: κορυφή της TRV', ref, abs(f['peak']) / 1e3, abs(b['peak']) / 1e3,
        1e-4 * abs(f['peak']) / 1e3, 'kV')
    add('Τόξο (4.9)', 'ίδιο: κορυφή σβέσης πριν από το μηδέν', ref, f['ext'], b['ext'], 0.005 * f['ext'], 'V')
    add('Τόξο (4.9)', 'ίδιο: ρεύμα μετά το τόξο (μέγιστο σε 30 μs)', ref, f['post'] * 1e3, b['post'] * 1e3, 0.02 * f['post'] * 1e3, 'mA')


def net_rows(n, add):
    """4.1: network library against IEC 60909 by symmetrical components and the nameplate of a transformer."""
    import cmath
    Un, Sk, XR, Z0Z1, XR0, c = 20e3, 500e6, 10, 1.5, 5, 1.1
    z1 = c * Un ** 2 / Sk
    Z1 = z1 * complex(1, XR) / math.hypot(1, XR)
    Z0 = Z0Z1 * z1 * complex(1, XR0) / math.hypot(1, XR0)
    E = c * Un / math.sqrt(3)
    f = n['faults']
    I3, I2, I1, IE = abs(E / Z1), abs(math.sqrt(3) * E / (2 * Z1)), abs(3 * E / (2 * Z1 + Z0)), abs(3 * E / (Z1 + 2 * Z0))
    add('Δίκτυο', 'ισοδύναμο 20 kV, 500 MVA, X/R = 10: I″k3', 'IEC 60909: c·U_n/(√3·|Z₁|), Z₁ = c·U_n²/S″k', I3, f['abc']['sim']['a'], 1e-4 * I3, 'A')
    add('Δίκτυο', 'ίδιο: I″k2 (a–b)', 'IEC 60909: c·U_n/|2Z₁|', I2, f['ab']['sim']['a'], 1e-4 * I2, 'A')
    add('Δίκτυο', 'ίδιο, Z₀ = 1,5·Z₁, X₀/R₀ = 5: I″k1 (a–γη)', 'IEC 60909: √3·c·U_n/|2Z₁ + Z₀|', I1, f['ag']['sim']['a'], 1e-4 * I1, 'A')
    add('Δίκτυο', 'ίδιο: I″kE2E (b–c–γη, ρεύμα προς γη)', 'IEC 60909: √3·c·U_n/|Z₁ + 2Z₀|', IE, f['bcg']['sim']['g'], 1e-4 * IE, 'A')
    add('Δίκτυο', 'ισοδύναμο από S″k1 = 400 MVA: I″k1', 'S″k1/(√3·U_n)', 400e6 / (math.sqrt(3) * Un), n['sk1']['sim'], 1e-4 * 11547, 'A')
    phi, tau = cmath.phase(Z1), Z1.imag / (Z1.real * 2 * math.pi * 50)
    ip = max(abs(math.sqrt(2) * I3 * (math.sin(2 * math.pi * 50 * t - phi) + math.sin(phi) * math.exp(-t / tau))) for t in (k * 1e-7 for k in range(300001)))
    add('Δίκτυο', 'κρουστικό ρεύμα i_p, σφάλμα στο μηδέν της τάσης', '√2·I″k·(sin(ωt − φ) + sin φ·e^(−t/τ))', ip, n['peak']['ip'], 1e-3 * ip, 'A')
    add('Δίκτυο', 'Dyn11 40 MVA, 150/20 kV: ολίσθηση φάσης', 'ομάδα σύνδεσης: +30°', 30.0, n['xf']['Dyn11']['shift'], .05, '°')
    add('Δίκτυο', 'Yd1: ολίσθηση φάσης', 'ομάδα σύνδεσης: −30°', -30.0, n['xf']['Yd1']['shift'], .05, '°')
    I1sc = 40e6 / (math.sqrt(3) * 150e3 * .1)
    add('Δίκτυο', 'Dyn11, u_k = 10 %: ρεύμα 150 kV σε τριφασικό στα 20 kV', 'S_n/(√3·U₁·u_k)', I1sc, n['xfsc']['I1'], 1e-3 * I1sc, 'A')
    add('Δίκτυο', 'φορτίο Δ, 10 MW + 3 Mvar στην U_n: P', 'ορισμός (R ∥ X ανά φάση)', 10e6, n['load']['d+']['P'], 200, 'W')
    add('Δίκτυο', 'ίδιο: Q', 'ορισμός (R ∥ X ανά φάση)', 3e6, n['load']['d+']['Q'], 200, 'var')
    cb = n['cb']
    add('Δίκτυο', 'διακόπτης ισχύος: ρεύμα στο βήμα πριν σβήσει ο πρώτος πόλος', 'διακοπή στο μηδέν του ρεύματος', 0.0, min(abs(v) for v in cb['before'].values()), .005 * cb['pk'], 'A')


def pf_rows(add):
    """4.19.1: the load flow on sparse matrices and the optimal power flow of pcl.network against published values: the solved
    voltages of the IEEE case files, the feeder of Baran & Wu, and the AC optimal costs of the test cases."""
    import numpy as np
    from pcl import network as NW
    from pcl import powerflow as PF
    A = 'Ροή φορτίου και OPF (4.19.1)'
    net = NW.case_data('ieee14')
    sol, r = NW.case_solution('ieee14'), net.power_flow('nr', flat=True)
    for b in ('4', '9'):
        add(A, f'IEEE 14, αραιός Newton–Raphson από επίπεδη εκκίνηση: |V| στον ζυγό {b}', 'λύση του αρχείου IEEE (3 δεκαδικά)', sol[b][0], r['buses'][b]['V'], 1.5e-3, 'pu')
        add(A, f'ίδιο: γωνία στον ζυγό {b}', 'λύση του αρχείου IEEE (2 δεκαδικά)', sol[b][1], r['buses'][b]['angle'], 0.02, '°')
    for c in ('ieee118', 'ieee300'):
        net = NW.case_data(c)
        sol, r = NW.case_solution(c), net.power_flow('nr', flat=True, q_limits=True)
        add(A, f'IEEE {c[4:]} με όρια Q των γεννητριών: διάμεσος της απόκλισης |V| σε όλους τους ζυγούς', 'λύση του αρχείου IEEE (3–4 δεκαδικά)', 0.0,
            float(np.median([abs(r['buses'][b]['V'] - sol[b][0]) for b in net.buses])), 3e-4, 'pu')
    case = NW.case_data('ieee300').case()
    V0 = case.start(True)
    ref = PF.newton_dense(case, V0, tol=1e-11)[0]
    for m, f in (('fast-decoupled XB', lambda: PF.fast_decoupled(case, V0, scheme='xb', tol=1e-10)), ('Newton με εγχύσεις ρεύματος', lambda: PF.newton_ci(case, V0, tol=1e-10))):
        add(A, f'IEEE 300, {m}: μέγιστη διαφορά τάσης από τον πυκνό Newton–Raphson', 'ίδιο υπόλοιπο ισχύος → ίδια λύση', 0.0, float(abs(f()[0] - ref).max()), 2e-8, 'pu')
    r = NW.case_data('case33bw').power_flow('sweep')
    add(A, 'ακτινικό 33 ζυγών, εμπρός–πίσω σάρωση: απώλειες', 'Baran & Wu (1989): 202,7 kW', 202.7e3, r['losses'], 50.0, 'W')
    add(A, 'ίδιο: χαμηλότερη τάση (ζυγός 18)', 'Baran & Wu (1989): 0,9131 pu', 0.9131, r['buses']['18']['V'], 1e-4, 'pu')
    src = 'Coffrin, Gordon & Scott, arXiv:1411.0359, Πίνακας 1'
    for c, name, cost in (('ieee9', 'IEEE 9', 5296.69), ('ieee14', 'IEEE 14', 8081.53), ('ieee30', 'IEEE 30', 8906.14), ('ieee57', 'IEEE 57', 41737.79), ('ieee118', 'IEEE 118', 129660.69),
                          ('ieee300', 'IEEE 300', 719725.08), ('case30', '30 ζυγών με όρια γραμμών', 576.89)):
        q = NW.case_data(c).opf('ac')
        add(A, f'AC-OPF, {name}: κόστος ανά ώρα' + ('' if q['converged'] else ' (δεν συνέκλινε)'), src, cost, q['cost'], max(0.006, 1e-7 * cost), 'cost')
    q9 = NW.ieee9().opf('ac', tol=1e-10)
    lf = NW.ieee9()
    for e in lf.elements:
        if e['kind'] == 'generator':
            e['P'], e['V'] = next(x['P'] for x in q9['sources'] if x['name'] == e['name']), q9['buses'][e['bus']]['V']
    lf = lf.power_flow('nr', tol=1e-11)
    add(A, 'AC-OPF, IEEE 9: η κατανομή του βέλτιστου ως ροή φορτίου, |V| στον ζυγό 5', 'ροή φορτίου με τα P και |V| του βέλτιστου', lf['buses']['5']['V'], q9['buses']['5']['V'], 1e-6, 'pu')


def start_rows(add):
    """4.19.2: the learned starting point of the optimal power flow, the three solves of the batches and the ONNX files. The
    reference of every row is our own reference path: the solver verifies, so the proposal may change the iterations and
    nothing else."""
    import numpy as np
    from pcl import backend as BK
    from pcl import network as NW
    from pcl import nnstart as NS
    from pcl import onnxio as OX
    from pcl import powerflow as PF
    A = 'Αρχικό σημείο και backends (4.19.2)'
    for name, lab, its in (('ieee9', 'IEEE 9', 4), ('ieee14', 'IEEE 14', 4), ('case30', '30 ζυγών (Alsac & Stott)', 8)):
        net = NW.case_data(name)
        cold, warm = net.opf('ac'), net.opf('ac', start='nn')
        add(A, f'AC-OPF, {lab}, από το νευρωνικό αρχικό σημείο: κόστος ανά ώρα' + ('' if warm['start'] == 'warm' else ' (η πρόταση δεν χρησιμοποιήθηκε)'),
            f"το ίδιο πρόβλημα από την κανονική εκκίνηση ({cold['iterations']} επαναλήψεις)", cold['cost'], warm['cost'], max(0.006, 2e-6 * cold['cost']), 'cost')
        add(A, f'ίδιο: επαναλήψεις από την πρόταση', 'μέτρηση της 4.19.2 (THEORY §8Θ)', its, warm['iterations'], 2, '')
    case = NW.case_data('ieee300').case()
    V0 = PF.newton(case, case.start(True), tol=1e-11)[0]
    J = case.jac(case.typ)
    J.fill(V0, case.mismatch(V0)[1])
    lu = J.factor()
    R = np.random.default_rng(0).standard_normal((J.N, 64))
    ref = BK.cpu().solver(lu, 'lu')(R)
    for how, lab in (('inv', 'ρητός αντίστροφος'), ('levels', 'τριγωνικές λύσεις ανά επίπεδο')):
        add(A, f'IEEE 300, 64 δεξιά μέλη, {lab}: μέγιστη σχετική διαφορά από τη λύση με τους παράγοντες', 'η λύση αναφοράς (SuperLU)', 0.0,
            float(np.abs(BK.cpu().solver(lu, how)(R) - ref).max() / np.abs(ref).max()), 1e-9, '')
    dS = -(np.random.default_rng(1).uniform(0.8, 1.2, (200, case.n)) - 1) * case.load[:, 2][None, :]
    b0, b1 = PF.batch(case, dS, V0=V0), PF.batch(case, dS, V0=V0, how='levels')
    ok = b0['converged'] & b1['converged']
    add(A, 'IEEE 300, παρτίδα 200 σεναρίων με λύση ανά επίπεδο: μέγιστη διαφορά τάσης από την παρτίδα αναφοράς', 'η παρτίδα με τους παράγοντες (κάθε σενάριο με υπόλοιπο κάτω από 10⁻⁸ pu)',
        0.0, float(np.abs(b1['V'][ok] - b0['V'][ok]).max()), 2e-8, 'pu')
    net = NW.case_data('ieee14')
    m = NS.find(net, 'opf')
    X = NS.features(NS.layout(net, net.case(), 'opf')[0], np.zeros((1, net.case().n), complex))
    back = OX.loads(OX.dumps({**m.graph, 'dtype': np.float64}))
    add(A, 'μοντέλο του IEEE 14 σε ONNX: γράψιμο και ανάγνωση, μέγιστη διαφορά εξόδου', 'το ίδιο μοντέλο πριν γραφτεί', 0.0,
        float(np.abs(OX.run(back, X)[back['outputs'][0][0]] - m.predict(X)).max()), 1e-15, '')


def big_rows(add):
    """4.19.3: the solver on large networks, the eigenvectors of the step check and the 1354-bus case. The reference of the rows
    of the solver is the path of before (the complex code, the dense start), run on the same data."""
    import math
    import numpy as np
    from pcl import network as NW
    A = 'Λύτης στον χρόνο, μέρος 2 (4.19.3)'
    r = json.loads(subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'big_cases.js')], capture_output=True, text=True, timeout=900, check=True).stdout)
    v, g = r['vec'], r['grid']
    add(A, f"ιδιοδιάνυσμα πραγματικής ιδιοτιμής σε πραγματική αριθμητική: ιδιοτιμές με διαφορετικά bit (από {v['real']})", 'ο μιγαδικός κώδικας της 4.19.2', 0, v['realBad'], 0, '')
    add(A, f"ιδιοδιάνυσμα από τη μορφή Hessenberg: μέγιστη διαφορά του κανονικοποιημένου |z| ({v['hess']} ιδιοτιμές)", 'η παραγοντοποίηση ανά ιδιοτιμή', 0.0, v['hessWorst'], 1e-9, '')
    add(A, 'πλέγμα 4 × 4 (138 άγνωστοι): αραιή αρχικοποίηση με φασιθέτες, μέγιστη σχετική διαφορά μετά από 300 βήματα', 'η πυκνή αρχικοποίηση', 0.0, g['startDiff'], 1e-7, '')
    add(A, 'πλέγμα 4 × 4: κορυφή της τάσης στη μέση, δεύτερη περίοδος απέναντι στην πρώτη (εκκίνηση από τη μόνιμη κατάσταση)', 'η πρώτη περίοδος', g['vMid'], g['vMid2'], 1e-9, 'pu')
    add(A, 'πλέγμα 4 × 4: τάση του σφάλματος απέναντι σε R_f·i (0,5 Ω)', 'ο νόμος του Ohm στην αντίσταση του σφάλματος', 0.5 * g['iF'], g['vF'], 1e-6 * g['iF'], 'V')
    net = NW.case_data('pegase1354')
    sol, pf = NW.case_solution('pegase1354'), net.power_flow('nr')
    dv = np.array([abs(pf['buses'][b]['V'] - sol[b][0]) for b in net.buses])
    add(A, 'PEGASE 1354 ζυγών: διάμεση διαφορά |V| από τις τάσεις του αρχείου', 'οι τάσεις του αρχείου (MATPOWER case1354pegase)', 0.0, float(np.median(dv)), 1e-5, 'pu')
    d = NW.to_dict(net)
    for e in d['elements']:
        if e['kind'] == 'branch' and e.get('angle'):
            e['angle'] = -math.degrees(e['angle'])
    r2 = NW.from_dict(d).power_flow('nr')
    da = np.array([r2['buses'][b]['angle'] - sol[b][1] for b in net.buses])
    add(A, 'ίδιο, με τις έξι μετατοπίσεις φάσης ως ακτίνια με αντίθετο πρόσημο: μέγιστη διαφορά γωνίας από τις τάσεις του αρχείου (με μοίρες, όπως ορίζει η μορφή: 5,5°)',
        'οι τάσεις του αρχείου', 0.0, float(np.abs(da - np.median(da)).max()), 0.6, '°')


def view_rows(add):
    """4.19.4: the picture of the network of a study (pcl/netview.py, web/studio/netview.js). The reference of every row is the
    network or the result the picture is made from."""
    import os
    import tempfile
    import numpy as np
    from pcl import netview as NV, network as NW, study as ST
    A = 'Διάγραμμα του δικτύου (4.19.4)'
    v = NV.view(NW.case_data('case33bw'))
    pos = {b['id']: (b['x'], b['y']) for b in v['buses']}
    add(A, 'ακτινικός τροφοδότης 33 ζυγών: κάθε κλάδος πηγαίνει ένα επίπεδο πιο μακριά από τον ζυγό ταλάντωσης (μέγιστη απόκλιση του |Δx| από τη μονάδα)', 'το δέντρο του δικτύου', 0.0,
        max(abs(abs(pos[e['a']][0] - pos[e['b']][0]) - NV.UNIT) for e in v['branches']), 1e-6, '')
    for c in ('ieee118', 'ieee300'):
        v = NV.view(NW.case_data(c))
        pos = {b['id']: (b['x'], b['y']) for b in v['buses']}
        L = np.array([np.hypot(pos[e['a']][0] - pos[e['b']][0], pos[e['a']][1] - pos[e['b']][1]) for e in v['branches']])
        add(A, f'{c}: διάμεσο μήκος κλάδου στο σχέδιο, σε μονάδες του σχεδίου', 'η μονάδα του σχεδίου (ένας τυπικός κλάδος)', 1.0, float(np.median(L)) / NV.UNIT, 0.05, '')
    P = np.array([[b['x'], b['y']] for b in v['buses']])
    d = np.sqrt(((P[:, None, :] - P[None, :, :]) ** 2).sum(axis=2)) + 1e9 * np.eye(len(P))
    add(A, 'ieee300: ζεύγη ζυγών πιο κοντά από 0,2 μονάδες (ζυγοί ο ένας πάνω στον άλλο)', 'κανένα', 0, int((d < 0.2 * NV.UNIT).sum() // 2), 0, '')
    add(A, 'ieee300: η διάταξη δύο φορές από την αρχή (θέσεις που διαφέρουν)', 'ίδιο δίκτυο, ίδια εικόνα', 0,
        sum(a != b for a, b in zip(v['buses'], NV.view(NW.case_data('ieee300'))['buses'])), 0, '')
    r = ST.run({'case': 'ieee118', 'study': 'pf', 'view': True})
    Lv = next(q for q in r['layers'] if q['layer'] == 'voltage')
    add(A, 'στρώση «Τάσεις ζυγών» του ieee118: μέγιστη διαφορά της τιμής που πηγαίνει στη σελίδα (έξι σημαντικά ψηφία) από το |V| της ροής φορτίου', 'το αποτέλεσμα της ροής φορτίου', 0.0,
        max(abs(Lv['bus_v'][i] - r['result']['buses'][b['id']]['V']) for i, b in enumerate(r['view']['buses'])), 5.5e-6, 'pu')
    r30 = ST.run({'case': 'case30', 'study': 'n1'})['result']
    base = {k: x for k, x in r30['base']['overloads']}        # the branches over their rating before any outage, with their loading
    L30 = NV.values(NV.view(NW.case_data('case30')), r30, 'n1')
    more = sum(1 for o in r30['outages'] if o['converged'] and not o['island'] and any(x > base.get(k, 1.0) + (0.02 if k in base else 0.0) for k, x in (o.get('overloads') or [])))
    add(A, 'στρώση N−1 του case30: διαταραχές με υπερφόρτιση που τη φέρνει η διαταραχή (κλάδος που ήταν μέσα στο όριό του, ή ήδη πάνω και ανεβαίνει δύο μονάδες φόρτισης)', 'οι διαταραχές του N−1 μετρημένες από το αποτέλεσμα, με τη φόρτιση της βάσης', more, L30['count']['overload'], 0, '')
    data = {'big': ST.run({'case': 'ieee300', 'study': 'pf', 'view': 'only'})}
    fd, name = tempfile.mkstemp(suffix='.json')
    with os.fdopen(fd, 'w', encoding='utf-8') as f:
        json.dump(data, f)
    try:
        q = json.loads(subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'netview_cases.js'), name], capture_output=True, text=True, timeout=300, check=True).stdout)['big']
    finally:
        os.unlink(name)
    add(A, 'προβολέας της σελίδας, ieee300: ζυγοί που βρίσκει ένα κλικ πάνω στη θέση τους', 'όλοι οι ζυγοί', 300, q['pick']['busOk'], 0, '')
    add(A, 'προβολέας, ieee300: ζυγοί και κλάδοι που σχεδιάζονται όταν το δίκτυο είναι έξω από το παράθυρο', 'τίποτα', 0, q['away']['out']['buses'] + q['away']['out']['branches'], 0, '')
    add(A, 'προβολέας: το σημείο του δικτύου κάτω από τον δείκτη μετά από μεγέθυνση με τη ροδέλα (μετακίνηση σε pixel)', 'μένει κάτω από τον δείκτη', 0.0, abs(q['viewer']['wheel'][1]) + abs(q['viewer']['wheel'][2]), 1e-9, '')
    # 4.20.1: the DC grids in the same picture
    for c in ('b4', 'mtdc5'):
        v = NV.view(NW.case_data(c))
        pos = {**{b['id']: (b['x'], b['y']) for b in v['buses']}, **{b['id']: (b['x'], b['y']) for b in v['dc']['buses']}}
        E = [(e['a'], e['b']) for e in v['dc']['lines']] + [(q['ac'], q['dc']) for q in v['dc']['stations']]
        L = np.array([np.hypot(pos[x][0] - pos[y][0], pos[x][1] - pos[y][1]) for x, y in E])
        add(A, f'διάγραμμα του {c} (4.20.1): διάμεσο μήκος γραμμής DC ή σύνδεσης σταθμού, σε μονάδες του σχεδίου', 'η μονάδα του σχεδίου (ένας τυπικός κλάδος)', 1.0, float(np.median(L)) / NV.UNIT, 0.05, '')
    r = ST.run({'case': 'b4', 'study': 'acdc', 'view': True})
    Lf = next(q for q in r['layers'] if q['layer'] == 'flow')['dc']
    add(A, 'στρώση «Ροές» του b4: μέγιστη διαφορά της ισχύος μιας γραμμής DC στη σελίδα (έξι σημαντικά ψηφία) από το P_a της ροής φορτίου AC/DC', 'το αποτέλεσμα της ροής φορτίου', 0.0,
        max(abs(dict(zip([e['name'] for e in r['view']['dc']['lines']], Lf['line_v']))[e['name']] - e['Pa'] / 1e6) for e in r['result']['dc']['lines']), 0.5e-2, 'MW')
    f = ST.view({'case': 'ieee118', 'study': 'pf', 'format': 'dxf'})['text'].split('\n')
    add(A, 'σχέδιο DXF του ieee118: οντότητες LINE', '186 κλάδοι και μία γραμμή για καθέναν από τους 99 ζυγούς με φορτίο', 186 + 99,
        sum(1 for a, b in zip(f[0:-1:2], f[1:-1:2]) if a.strip() == '0' and b == 'LINE'), 0, '')


def cpf_rows(add):
    """4.19.5: the continuation load flow (pcl/cpf.py). Three references that do not use its code (tests/test_cpf.py): the closed
    form of two buses, the bisection of the convergence of the plain load flow of the scaled network, and a plain Newton load
    flow at every point before the nose."""
    import math
    import sys
    import numpy as np
    from pcl import cpf as CP, network as NW
    sys.path.insert(0, str(ROOT / 'tests'))
    import test_cpf as TC
    A = 'Συνεχιζόμενη ροή φορτίου (4.19.5)'
    E, r, x, P, Q = TC.CASES2[2]
    lm, vn = TC.closed(E, r, x, P, Q)
    res = CP.run(TC.two(E, r, x, P, Q), tol=1e-12)
    add(A, 'δύο ζυγοί (E = 1,05 pu, γραμμή 0,02 + j0,1 pu, φορτίο 80 + j30 MVA): λ στη μύτη', 'κλειστός τύπος: |Z_φορτίου| = |Z_γραμμής|', lm, res['nose']['lambda'], 1e-9, '')
    add(A, 'δύο ζυγοί: |V| στη μύτη', 'κλειστός τύπος: E/(2·cos((θ_Z − φ)/2))', vn, res['nose']['V'], 1e-9, 'pu')
    lam, V = np.array(res['lambda']), np.array(res['V']['2'])
    add(A, f'δύο ζυγοί: κάθε σημείο της καμπύλης, πάνω και κάτω μέρος ({res["points"]} σημεία): μέγιστο υπόλοιπο της διτετράγωνης εξίσωσης του |V|', 'μηδέν', 0.0,
        float(np.max(np.abs(TC.residual(E, r, x, P, Q, lam, V)))), 1e-10, 'pu⁴')
    E, r, x, P, Q = TC.CASES2[4]
    res = CP.run(TC.two(E, r, x, P, Q), tol=1e-12)
    p_, q_ = P / 100e6, Q / 100e6
    b, c = 2 * (r * p_ + x * q_) - E * E, (r * r + x * x) * (p_ * p_ + q_ * q_)
    add(A, 'δύο ζυγοί (φορτίο 150 + j40 MVA πίσω από 0,01 + j0,25 pu): η δεύτερη λύση στο σημερινό φορτίο, εκεί όπου τελειώνει το κάτω μέρος', 'κλειστός τύπος (η μικρή ρίζα)',
        math.sqrt((-b - math.sqrt(b * b - 4 * c)) / 2), res['V']['2'][-1], 1e-9, 'pu')
    for name, title in (('ieee14', 'IEEE 14'), ('ieee57', 'IEEE 57'), ('case33bw', 'ακτινικό 33 ζυγών'), ('pegase1354', 'PEGASE 1354')):
        net = NW.case_data(name)
        add(A, f'{title}: λ στη μύτη', 'διχοτόμηση της σύγκλισης της ροής φορτίου με φορτία και παραγωγή × (1 + λ)', TC.bisection(net), CP.run(net, lower=False)['nose']['lambda'], 3e-7, '')
    net = NW.case_data('ieee118')
    res = CP.run(net, tol=1e-10)
    n, worst = TC.upper(net, res)
    add(A, f'IEEE 118: κάθε σημείο πριν από τη μύτη ({n} από {res["nose"]["point"]} λύθηκαν), μέγιστη διαφορά |V| από τη ροή φορτίου του δικτύου με φορτία × (1 + λ)', 'pcl.powerflow, Newton–Raphson',
        0.0, worst, 1e-7, 'pu')
    net = NW.case_data('ieee14')
    res = CP.run(net, tol=1e-11, lower=False)
    add(A, 'IEEE 14: μικρότερη ιδιάζουσα τιμή του πίνακα της ροής φορτίου στη μύτη, ως προς τη μεγαλύτερη (στο σημερινό φορτίο: '
        + f'{TC.singular(net, res, 0):.3f}'.replace('.', ',') + ')', 'μηδέν: ο πίνακας είναι ιδιόμορφος', 0.0, TC.singular(net, res, res['nose']['point']), 1e-7, '')
    for name, title in (('ieee14', 'IEEE 14, μύτη'), ('ieee9', 'IEEE 9, γωνία στο όριο του ζυγού 2'), ('ieee118', 'IEEE 118, γωνία στο όριο του ζυγού 10')):
        net = NW.case_data(name)
        add(A, f'με όρια αέργου ({title}): λ στο όριο φόρτισης', 'διχοτόμηση της ροής φορτίου με όρια, χωρίς λύσεις με ζυγό σε όριο στη λάθος πλευρά της τάσης ρύθμισης',
            TC.bisection(net, True, side=True), CP.run(net, q_limits=True, lower=False)['nose']['lambda'], 3e-7, '')
    net = NW.case_data('ieee118')
    res = CP.run(net, q_limits=True, tol=1e-10)
    q = TC.along(net, res)
    moved = sum(e['point'] > 0 for e in res['events'])
    add(A, f'IEEE 118 με όρια αέργου ({moved} αλλαγές τύπου ζυγού): κάθε σημείο πριν από το όριο ({q["solved"]} από {q["points"]}), μέγιστη διαφορά |V| από Newton με τους τύπους ζυγών των συμβάντων',
        'pcl.powerflow.newton', 0.0, q['dV'], 2e-7, 'pu')
    add(A, 'IEEE 118 με όρια αέργου: η μεγαλύτερη υπέρβαση ορίου αέργου από ζυγό που κρατά την τάση του, σε κάθε σημείο πριν από το όριο', 'καμία', 0.0, max(q['q'], 0.0), 1e-7, 'pu')
    add(A, 'IEEE 118 με όρια αέργου: ζυγός σε όριο στη λάθος πλευρά της τάσης ρύθμισής του, σε κάθε σημείο και των δύο μερών της καμπύλης', 'κανένας', 0.0, q['side'], 1e-8, 'pu')
    net = NW.case_data('ieee9')
    add(A, 'IEEE 9 με όρια αέργου: η απλή ροή φορτίου με όρια «συγκλίνει» και πάνω από τη γωνία, με τη γεννήτρια στο άνω όριο και την τάση πάνω από τη ρύθμιση (λ της διχοτόμησης χωρίς έλεγχο πλευράς)',
        'πάνω από το όριο φόρτισης (1,5656) κατά 0,0167', 1.5823, TC.bisection(net, True), 1e-4, '')


def sweepc_rows(add):
    """4.19.5: the backward/forward sweep with compensation (pcl/powerflow.py: Tree, sweep_comp, breakpoint_matrix). The
    published reference is the sample system of Luo & Semlyen (1990); the others are the Newton–Raphson of the same network
    (tests/test_sweepc.py: the feeders with ties and sources of our own)."""
    import itertools
    import sys
    import numpy as np
    from pcl import powerflow as PF
    sys.path.insert(0, str(ROOT / 'tests'))
    import test_sweepc as TS
    A = 'Σάρωση με αντιστάθμιση (4.19.5)'
    Z = PF.breakpoint_matrix(TS.sample().case())['Z']
    Zp = TS.R9 + 1j * TS.X9
    add(A, 'δείγμα με δύο βρόχους και έναν ζυγό PV: εμπεδήσεις όπως φαίνονται από τα σημεία διακοπής (R και X, 3 × 3), μέγιστη διαφορά, με ένα πρόσημο ανά σημείο διακοπής',
        'Luo & Semlyen 1990, εξ. (9a) και (9b)', 0.0, min(float(np.abs(np.diag(d) @ Z @ np.diag(d) - Zp).max()) for d in itertools.product((1, -1), repeat=3)), 1e-12, 'pu')
    add(A, 'το ίδιο δείγμα: αντίδραση του πρώτου βρόχου (το άθροισμα των πέντε γραμμών του)', 'Luo & Semlyen 1990, εξ. (9a)', 1.4, float(Z[0, 0].imag), 1e-12, 'pu')
    add(A, 'το ίδιο δείγμα: αντίδραση της διαδρομής του ζυγού PV ως τον ζυγό ταλάντωσης', 'Luo & Semlyen 1990, εξ. (9a)', 0.7, float(Z[2, 2].imag), 1e-12, 'pu')
    from pcl import network as NW
    case = NW.case_data('ieee300').case()
    add(A, f'IEEE 300: η λύση του δέντρου σε δύο περάσματα για τυχαία ρεύματα ({len(case.link_tree().links)} κλάδοι εκτός δέντρου, λήψεις, μετατοπίσεις φάσης), μέγιστο υπόλοιπο ως προς τη μεγαλύτερη αγωγιμότητα',
        'μηδέν: οι εξισώσεις του δέντρου', 0.0, TS.tree_residual(case) / float(np.max(np.abs(case.Y.data))), 1e-12, '')
    for title, net in (('33 ζυγοί με 5 δικούς μας κλάδους σύνδεσης και 2 πηγές που κρατούν την τάση τους', TS.meshed('case33bw', TS.TIES33, [(18, 0.3e6, 1.0), (33, 0.4e6, 1.0)])),
                       ('69 ζυγοί με 2 δικούς μας κλάδους σύνδεσης και 1 πηγή που κρατά την τάση της', TS.meshed('case69', TS.TIES69, [(61, 1.0e6, 1.0)])),
                       ('IEEE 14 (7 βρόχοι, 4 ζυγοί PV)', NW.case_data('ieee14'))):
        c = net.case()
        ref = PF.newton(c, c.start(True), tol=1e-11)[0]
        V, it, ok, _ = PF.sweep_comp(c, c.start(True), tol=1e-10)
        add(A, f'{title}: μέγιστη διαφορά τάσης από τον Newton–Raphson ({it} επαναλήψεις)', 'pcl.powerflow.newton', 0.0, float(np.abs(V - ref).max()) if ok else float('nan'), 2e-9, 'pu')
    net = TS.meshed('case33bw', TS.TIES33, [(18, 0.3e6, 1.0), (33, 0.4e6, 1.0)], qlim=50e3)
    a, b = net.power_flow('sweepc', tol=1e-10, q_limits=True), net.power_flow('nr', tol=1e-11, q_limits=True)
    add(A, '33 ζυγοί με κλάδους σύνδεσης και πηγές με όριο αέργου 50 kvar (και οι δύο το φτάνουν): μέγιστη διαφορά |V| από τον Newton–Raphson με όρια', 'pcl.powerflow, Newton–Raphson με όρια αέργου',
        0.0, max(abs(a['buses'][k]['V'] - b['buses'][k]['V']) for k in net.buses) if a['types'] == b['types'] else float('nan'), 1e-9, 'pu')


def se_rows(add):
    """4.19.5: state estimation (pcl/se.py). Published: the three-bus example of Abur & Gómez Expósito (2004), Examples 2.2, 2.6
    and 5.1. The others: the load flow from which the measurements are made, and what the theory says about the tests."""
    import sys
    import numpy as np
    from pcl import se
    from pcl import network as NW
    sys.path.insert(0, str(ROOT / 'tests'))
    import test_se as TS
    A = 'Εκτίμηση κατάστασης (4.19.5)'
    B = 'Abur & Gómez Expósito 2004, '
    r = se.run(TS.three(), TS.book(), detect=False, tol=1e-10)
    for b in ('2', '3'):
        add(A, f'δείγμα τριών ζυγών, 8 μετρήσεις: |V| του ζυγού {b}', B + 'Παράδ. 2.6', TS.BOOK_STATE[b][0], r['buses'][b]['V'], 5e-5, 'pu')
        add(A, f'το ίδιο: γωνία του ζυγού {b}', B + 'Παράδ. 2.6', TS.BOOK_STATE[b][1], r['buses'][b]['angle'], 5e-5, '°')
    add(A, 'το ίδιο: η αντικειμενική συνάρτηση J στη λύση', B + 'Παράδ. 2.6 (τρίτη επανάληψη)', 8.6, r['J'], 0.05, '')
    add(A, 'το ίδιο: εκτίμηση της ροής P 1–2 (μέτρηση 0,888 pu)', B + 'Παράδ. 2.6', TS.BOOK_EST[0], r['measurements'][0]['estimate'], 1.5e-4, 'pu')
    H = np.array([[-1 / 0.03, 0.0], [0.0, -1 / 0.05], [1 / 0.03 + 1 / 0.08, -1 / 0.08]])
    Om = se.residual_covariance(H, [0.008, 0.008, 0.010])
    add(A, 'το ίδιο δίκτυο στο μοντέλο DC, τρεις μετρήσεις P: διακύμανση του υπολοίπου της πρώτης, Ω₁₁', B + 'Παράδ. 5.1', 0.3146e-4, float(Om[0, 0]), 4e-8, 'pu²')
    add(A, 'το ίδιο: στοιχείο S₃₃ του πίνακα ευαισθησίας των υπολοίπων', B + 'Παράδ. 5.1', 0.4068, float(Om[2, 2] / 0.010 ** 2), 4e-4, '')
    for name, title in (('ieee118', 'IEEE 118'), ('pegase1354', '1354 ζυγοί')):
        q = se.run(NW.case_data(name), plan='scada', noise=0.0, detect=False)
        add(A, f'{title}, {q["m"]} μετρήσεις χωρίς σφάλμα και {q["constraints"]} ισότητες: μέγιστη διαφορά τάσης της εκτίμησης από τη ροή φορτίου', 'pcl.powerflow, Newton–Raphson',
            0.0, q['error']['vector_max'] if q['converged'] else float('nan'), 1e-9, 'pu')
    net = NW.case_data('ieee14')
    J, big, tot = [], 0, 0
    for seed in range(200):
        q = se.run(net, plan='scada', seed=100 + seed, detect=False)
        J.append(q['J'])
        rn = np.array([m['rN'] for m in q['measurements']])
        big, tot = big + int((rn > 3).sum()), tot + len(rn)
    add(A, f'IEEE 14, 200 σύνολα τυχαίων σφαλμάτων: μέση τιμή του J (κατανομή χ² με {q["dof"]} βαθμούς ελευθερίας)', 'θεωρία: όσοι οι βαθμοί ελευθερίας', float(q['dof']),
        float(np.mean(J)), 3 * (2 * q['dof'] / 200) ** 0.5, '')
    add(A, f'το ίδιο: μέρος των κανονικοποιημένων υπολοίπων πάνω από 3 ({tot} υπόλοιπα)', 'θεωρία: τυπική κανονική κατανομή', 0.0027, big / tot, 0.002, '')
    m0 = se.measure(net, plan='scada', noise=0.0)
    hit = 0
    for i in range(len(m0['measurements'])):
        m = TS.copy(m0)
        m['measurements'][i]['value'] += 20 * m['measurements'][i]['sigma']
        hit += [b['index'] for b in se.run(net, m)['bad']] == [i]
    add(A, 'IEEE 14: ένα σφάλμα 20σ σε κάθε μέτρηση με τη σειρά, οι άλλες ακριβείς: πόσες φορές βγαίνει αυτή και μόνο αυτή', 'θεωρία: το μεγαλύτερο κανονικοποιημένο υπόλοιπο είναι της λανθασμένης',
        float(len(m0['measurements'])), float(hit), 0.0, 'μετρήσεις')
    q = se.run(net, plan='tree', seed=1, zero_injections=False)
    add(A, 'IEEE 14, ροές μόνο στους κλάδους ενός δέντρου (27 μετρήσεις, 27 άγνωστοι): κρίσιμες μετρήσεις', 'όλες: χωρίς καθεμιά η κατάσταση δεν ορίζεται', float(q['m']), float(len(q['critical'])), 0.0, 'μετρήσεις')


def unbalanced_rows(add):
    """4.19.5: the three-phase load flow of a feeder (pcl/unbalanced.py). Published: the results of the IEEE 13 node test feeder
    (voltages, currents, input, losses). The others: the equations of a coupled line solved directly, the exact line model, the
    positive-sequence load flow of pcl.network, 200 spot loads, closed forms of one phase and of a load between two phases."""
    import math
    import sys
    import numpy as np
    from pcl import unbalanced as U
    sys.path.insert(0, str(ROOT / 'tests'))
    import test_unbalanced as TU
    A = 'Ασύμμετρη ροή φορτίου (4.19.5)'
    P = 'IEEE 13 node test feeder, δημοσιευμένα αποτελέσματα'
    fd, pub = U.case_data('feeder13'), U.case_solution('feeder13')
    r = U.run(fd)
    B = r['buses']
    pairs = [(B[b]['phases'][p], q) for b, rows in pub['V'].items() for p, q in zip('abc', rows) if q]
    add(A, f'τροφοδότης 13 κόμβων: μέγιστη διαφορά |V| από το δημοσιευμένο προφίλ ({len(pairs)} τάσεις φάσης, 4 δεκαδικά)', P, 0.0, max(abs(x['V'] - q[0]) for x, q in pairs), 2e-4, 'pu')
    add(A, 'το ίδιο: μέγιστη διαφορά γωνίας (2 δεκαδικά της μοίρας)', P, 0.0, max(abs(x['angle'] - q[1]) for x, q in pairs), 0.02, '°')
    reg = next(s for s in r['sections'] if s['name'] == 'RG60')
    add(A, 'το ίδιο: ρεύμα της φάσης c στην πηγή', P, pub['source_A'][2][0], reg['I']['c'], 0.1, 'A')
    add(A, 'το ίδιο: ενεργός ισχύς εισόδου της φάσης b', P, 1e3 * pub['input_kW'][1], 1e3 * r['input']['kW']['b'], 40.0, 'W')
    add(A, 'το ίδιο: απώλειες του τροφοδότη', P, 1e3 * pub['losses_kW'], 1e3 * r['losses_kW'], 70.0, 'W')
    sec = {}
    for s in r['sections']:
        sec[s['parent']] = sec.get(s['parent'], 0.0) + s['loss']
    add(A, 'το ίδιο: μέγιστη διαφορά των απωλειών ανά τμήμα (12 τμήματα)', P, 0.0, 1e3 * max(abs(sec[k] - v) for k, v in pub['section_kW'].items()), 90.0, 'W')
    add(A, 'το ίδιο: «απώλειες» της φάσης b (αρνητικές: δίνει ισχύ στις άλλες δύο μέσω της σύζευξης)', P, 1e3 * pub['losses_phase_kW'][1], 1e3 * sum(s['loss_kW'].get('b', 0.0) for s in r['sections']), 70.0, 'W')
    add(A, 'το ίδιο: ισχύς του φορτίου σταθερής εμπέδησης σε τρίγωνο στον ζυγό 646', P, 1e3 * pub['load_kW']['646'], 1e3 * sum(q['kW'] for q in r['loads'] if q['bus'] == '646'), 30.0, 'W')
    add(A, 'το ίδιο: ισοζύγιο ενεργού ισχύος, είσοδος − φορτία − απώλειες', 'μηδέν', 0.0, 1e3 * (r['input']['kW_total'] - r['load_kW'] - r['losses_kW']), 1e-2, 'W')
    c = fd.configs
    Z, kW, kvar = c['601']['Z'], [800.0, 300.0, 600.0], [300.0, 250.0, 100.0]
    two = TU.two(Z=Z)
    two.load('L', 'Y', 'PQ', kW, kvar)
    q = U.run(two, tol=1e-13)
    Vs, Sl, Zl = 4160 / math.sqrt(3) * TU.A, (np.array(kW) + 1j * np.array(kvar)) * 1e3, Z * 4000 / 5280
    V = Vs.copy()
    for _ in range(200):
        V = Vs - Zl @ np.conj(Sl / V)
    add(A, 'μη αντιμετατεθειμένη γραμμή με άνισα φορτία σταθερής ισχύος: τάση στο άκρο απέναντι στις εξισώσεις της γραμμής λυμένες απευθείας', 'V = V_s − Z·I, I = (S/V)*', 0.0,
        max(abs(TU.phasor(q, 'L', p) - V[j]) for j, p in enumerate('abc')) / abs(Vs[0]), 1e-12, 'pu')
    cab = TU.two(Z=c['606']['Z'], B=c['606']['B'], length=20 * 5280.0)
    q = U.run(cab, tol=1e-13)
    Vr = np.linalg.solve(np.eye(3) + c['606']['Z'] * 20 @ (1j * c['606']['B'] * 1e-6 * 20) / 2, Vs)
    add(A, 'καλώδιο 20 μιλίων χωρίς φορτίο: τάση στο άκρο απέναντι στο ακριβές μοντέλο γραμμής', 'V_s = (1 + Z·Y/2)·V_r', 0.0, max(abs(TU.phasor(q, 'L', p) - Vr[j]) for j, p in enumerate('abc')) / abs(Vs[0]), 1e-12, 'pu')
    for loop in (False, True):
        bal, net = TU.balanced(loop)
        q, lf = U.run(bal, tol=1e-13), net.power_flow('nr', tol=1e-12)
        add(A, 'συμμετρικός τροφοδότης ' + ('με βρόχο' if loop else 'ακτινικός') + ' (φορτία κάθε μοντέλου σε αστέρα και τρίγωνο, μετασχηματιστής, πυκνωτές): |V| απέναντι στη ροή φορτίου θετικής ακολουθίας',
            'pcl.network, Newton–Raphson', 0.0, max(abs(q['buses'][b]['phases'][p]['V'] - x['V']) for b, x in lf['buses'].items() for p in 'abc'), 1e-12, 'pu')
    kW, kvar = (300.0, 200.0, 400.0), (130.0, 70.0, 170.0)
    ref = U.run(TU.spot_loads('I', 200, kW, kvar, Z), tol=1e-12)
    for how, tol in (('exact', 2e-5), ('middle', None)):
        sp = TU.two(Z=Z, length=10000.0)
        sp.distributed('S', 'L', 'Y', 'I', kW, kvar)
        q = U.run(sp, spread=how, tol=1e-12)
        if how == 'exact':
            add(A, 'κατανεμημένο φορτίο σταθερού ρεύματος ως 2/3 στο 1/4 και 1/3 στο άκρο: τάση στο άκρο απέναντι σε 200 σημειακά φορτία', '200 ίσα φορτία κατά μήκος του τμήματος', 0.0,
                max(abs(q['buses']['L']['phases'][p]['V'] - ref['buses']['E']['phases'][p]['V']) for p in 'abc'), 3e-6, 'pu')
            add(A, 'το ίδιο: απώλειες, σχετική διαφορά', '200 ίσα φορτία κατά μήκος του τμήματος', 0.0, q['losses_kW'] / ref['losses_kW'] - 1, tol, '')
        else:
            add(A, 'το ίδιο φορτίο ολόκληρο στο μέσο του τμήματος: απώλειες προς τις απώλειες των 200 φορτίων', '3/2 (ρεύμα I σε μήκος l/2 αντί για το l/3 του ομοιόμορφου φορτίου)', 1.5, q['losses_kW'] / ref['losses_kW'], 0.03, '')
    z, Pl, Ql, Vn = (1.3292 + 1.3475j) * 3000 / 5280, 150e3, 70e3, 4160 / math.sqrt(3)
    for model, what in (('PQ', 'σταθερή ισχύς: η πάνω ρίζα της διτετράγωνης των δύο ζυγών'), ('I', 'σταθερό ρεύμα: |V| = −Re(w) + √(V_s² − Im(w)²), w = z·I·e^(−jφ)'), ('Z', 'σταθερή εμπέδηση: διαιρέτης τάσης')):
        one = TU.two(Z=[[1.3292 + 1.3475j]], phases='c', length=3000.0)
        one.load('L', 'Y', model, [0, 0, Pl / 1e3], [0, 0, Ql / 1e3])
        v = abs(TU.phasor(U.run(one, tol=1e-13), 'L', 'c'))
        if model == 'Z':
            want = abs(Vn * (Vn ** 2 / complex(Pl, -Ql)) / (z + Vn ** 2 / complex(Pl, -Ql)))
        elif model == 'PQ':
            k = Vn ** 2 - 2 * (Pl * z.real + Ql * z.imag)
            want = math.sqrt((k + math.sqrt(k * k - 4 * abs(z) ** 2 * (Pl * Pl + Ql * Ql))) / 2)
        else:
            w = z * math.hypot(Pl, Ql) / Vn * np.exp(-1j * math.atan2(Ql, Pl))
            want = -w.real + math.sqrt(Vn ** 2 - w.imag ** 2)
        add(A, 'μονοφασικός κλάδος με ένα φορτίο, ' + what.split(':')[0] + ': |V| στο φορτίο', 'κλειστός τύπος, ' + what.split(': ', 1)[1], want / Vn, v / Vn, 1e-12, 'pu')
    Zc = c['601']['Z'] * 4000 / 5280
    dl = TU.two(Z=c['601']['Z'])
    dl.load('L', 'D', 'Z', [600, 0, 0], [250, 0, 0])
    q = U.run(dl, tol=1e-13)
    Il = (Vs[0] - Vs[1]) / (Zc[0, 0] + Zc[1, 1] - Zc[0, 1] - Zc[1, 0] + 4160.0 ** 2 / complex(600e3, -250e3))
    add(A, 'φορτίο σταθερής εμπέδησης ανάμεσα στις φάσεις a και b, στο άκρο γραμμής με σύζευξη: τάση που επάγεται στη φάση c, που δεν έχει ρεύμα', 'κλειστός τύπος του βρόχου a–b: V_c = V_s,c − (Z_ca − Z_cb)·I',
        abs(Vs[2] - (Zc[2, 0] - Zc[2, 1]) * Il) / abs(Vs[2]), q['buses']['L']['phases']['c']['V'], 1e-12, 'pu')
    e = fd.regulators[0]
    Ib = reg['I_b']['a'] * np.exp(1j * np.radians(reg['angle_b']['a']))
    add(A, 'ρυθμιστής του τροφοδότη 13 κόμβων με τις δημοσιευμένες λήψεις: τάση που βλέπει το ρελέ της φάσης a', '|V/N_PT − (R + jX)·I/CT_P| γραμμένο εδώ', abs(TU.phasor(r, 'RG60', 'a') / e['pt'] - complex(e['R'], e['X']) * Ib / e['ct']),
        r['relay']['RG60']['a'], 1e-8, 'V')
    add(A, 'το ίδιο: ρεύμα στην πλευρά της πηγής προς ρεύμα στη ρυθμιζόμενη πλευρά, φάση c (λήψη 11)', '1 + 0,00625 ανά λήψη', 1 + 0.00625 * 11, reg['I']['c'] / reg['I_b']['c'], 1e-8, '')


def meas_rows(add):
    """4.19.6: the blocks that measure a signal inside the simulation (AVG, RMS, MNMX; web/studio/mna.js evalBlocks). References
    that are not the blocks: closed forms of signals made of straight segments, the closed form of a sine, the period statistics of
    the scope, and the SciPy solver on the same circuit (tests/test_meas.py)."""
    import numpy as np
    from engine.batch import simulate
    o = json.loads(subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'meas_cases.js')], capture_output=True, text=True, timeout=900,
                                  check=True).stdout)
    tab = lambda name: {row[0]: dict(zip((k.split(':', 1)[1] for k in o[name]['keys']), row[1:])) for row in o[name]['at']}
    A = 'Μπλοκ μέτρησης σήματος (4.19.6)'
    C = 'κλειστός τύπος'
    sh, st, si = tab('shapes')[.01], tab('step'), tab('sine400')[.1]
    add(A, 'τρίγωνο 0…1 στο 1 kHz, ανά περίοδο: μέση τιμή', C + ' 1/2', .5, sh['At'], 1e-9, '')
    add(A, 'το ίδιο: RMS', C + ' 1/√3', 1 / math.sqrt(3), sh['Qt'], 1e-8, '')
    add(A, 'πριονωτό 0…1, κυλιόμενο παράθυρο μίας περιόδου: μέση τιμή (άλμα σε κάθε μηδενισμό)', C + ' 1/2', .5, sh['As'], 1e-7, '')
    add(A, 'το ίδιο: RMS', C + ' 1/√3', 1 / math.sqrt(3), sh['Qs'], 1e-7, '')
    add(A, 'ρολόι με ποσοστό 0,3 σε 1, κυλιόμενο: μέση τιμή', C + ' 0,3', .3, sh['Aq'], 1e-10, '')
    add(A, 'το ίδιο: RMS', C + ' √0,3', math.sqrt(.3), sh['Qq'], 1e-10, '')
    add(A, 'πριονωτό με την περίοδο από μπλοκ Ρολόι: RMS', C + ' 1/√3', 1 / math.sqrt(3), sh['Qc'], 1e-7, '')
    add(A, 'τρίγωνο, τρεις περίοδοι ανά παράθυρο: RMS', C + ' 1/√3', 1 / math.sqrt(3), sh['Q3'], 1e-8, '')
    add(A, 'βήμα εισόδου 0 → 1, κυλιόμενη μέση τιμή στο 20 % του παραθύρου', C + ' 0,2', .2, st[.0035]['A1'], 1e-10, '')
    add(A, 'το ίδιο στο 50 % του παραθύρου: RMS', C + ' √0,5', math.sqrt(.5), st[.0038]['Q1'], 1e-10, '')
    add(A, 'παράθυρο από είσοδο συχνότητας (2 kHz): βήμα 1 → 3 στο 20 % του παραθύρου', C + ' 1,4', 1.4, st[.0081]['A2'], 1e-10, '')
    exact = math.sqrt(50 ** 2 + 325 ** 2 / 2)
    line = math.sqrt(50 ** 2 + 325 ** 2 / 2 * (2 + math.cos(2 * math.pi / 400)) / 3)
    add(A, 'ημίτονο 50 + 325·sin(ωt) V, 400 σημεία ανά περίοδο: μέση τιμή', C, 50.0, si['A1'], 1e-9, 'V')
    add(A, 'το ίδιο: RMS απέναντι στην ευθεία ανάμεσα στα σημεία', C + ' (A²/2)(2 + cos(2π/N))/3', line, si['Q1'], 1e-7, 'V')
    add(A, 'το ίδιο: RMS απέναντι στο ημίτονο (το σφάλμα της ευθείας, −2,0·10⁻⁵)', C + ' √(50² + 325²/2)', exact, si['Q1'], .006, 'V')
    add(A, 'το ίδιο: ελάχιστο ανά περίοδο', C, -275.0, si['M1'], 1e-9, 'V')
    add(A, 'το ίδιο: μέγιστο ανά περίοδο', C, 375.0, si['M1:max'], 1e-9, 'V')
    worst = max(abs(r[k][0] - r[k][1]) / max(1.0, abs(r[k][1])) for n in ('scope_fixed', 'scope_var') for r in o[n] for k in ('avg', 'rms', 'min', 'max'))
    add(A, 'ανά περίοδο απέναντι στα στατιστικά περιόδου του scope (σταθερό και μεταβλητό βήμα): μέγιστη σχετική διαφορά',
        'στατιστικά του scope (απλή ακρίβεια)', 0.0, worst, 4e-7, '')
    q = o['batch_shapes']
    r = simulate({'net': q['net'], 'channels': q['channels'], 't_end': q['at'][-1][0], 'method': 'Radau'})
    t = np.array(r['t'])
    d = max(abs(r['ch'][k][int(np.where(t <= row[0] + 1e-12)[0][-1])] - v) for row in q['at'] for k, v in zip(q['keys'], row[1:]))
    add(A, 'λύτης SciPy στα ίδια σήματα (τρίγωνο, πριονωτό, ρολόι): μέγιστη διαφορά από τον λύτη της εφαρμογής', 'engine/batch.py', 0.0, d, 1e-6, '')
    add(A, 'συνέχεια από αποθηκευμένη κατάσταση: διαφορά από το τρέξιμο που δεν σταμάτησε', 'το ίδιο τρέξιμο', 0.0, o['resume']['diff'], 0.0, '')
    # Fourier and THD (THEORY §8Σ): signals of straight segments, where every integral is exact, and a voltage with two harmonics against the
    # closed form of the straight line between the points and against the harmonics of the scope
    A = 'Μπλοκ μέτρησης σήματος: Fourier και THD (4.19.6)'
    fo, d = tab('four')[.0103], .3
    a1, b1 = math.sin(2 * math.pi * d) / math.pi, (1 - math.cos(2 * math.pi * d)) / math.pi
    V1 = math.hypot(a1, b1) / math.sqrt(2)
    add(A, 'ρολόι με ποσοστό 0,3 σε 1 στο 1 kHz: πλάτος της θεμελιώδους', C + ' (2/π)·sin(0,3π)', 2 / math.pi * math.sin(.3 * math.pi), fo['Fq1'], 1e-10, '')
    add(A, 'το ίδιο: φάση ως προς sin(ω₁t)', C + ' 90° − 0,3·180°', 36.0, fo['Fq1:ph'], 1e-9, '°')
    add(A, 'το ίδιο: 3η αρμονική', C + ' (2/(3π))·|sin(0,9π)|', 2 / (3 * math.pi) * abs(math.sin(.9 * math.pi)), fo['Fq3'], 1e-10, '')
    add(A, 'το ίδιο: συνεχής συνιστώσα (ν = 0)', C + ' 0,3', .3, fo['Fq0'], 1e-10, '')
    add(A, 'το ίδιο, ανά περίοδο με το ρολόι ενός μπλοκ Ρολόι: 2η αρμονική', C + ' (1/π)·sin(0,6π)', math.sin(.6 * math.pi) / math.pi, fo['Fk2'], 1e-10, '')
    add(A, 'το ίδιο, με παράθυρο από είσοδο συχνότητας (2 kHz σε ρολόι 2 kHz): θεμελιώδης', C + ' (2/π)·sin(0,3π)', 2 / math.pi * math.sin(.3 * math.pi), fo['Fi1'], 1e-10, '')
    add(A, 'το ίδιο: THD με τη συνεχή συνιστώσα (IEEE Std 1459)', C + ' √(d − U₁²)/U₁', math.sqrt(d - V1 ** 2) / V1, fo['Hq'], 1e-9, '')
    add(A, 'το ίδιο: THD χωρίς τη συνεχή συνιστώσα, επί τοις εκατό', C + ' 100·√(d − d² − U₁²)/U₁', 100 * math.sqrt(d - d * d - V1 ** 2) / V1, fo['Ho'], 1e-7, '%')
    tri1, saw1 = 4 / math.pi ** 2, 1 / math.pi
    add(A, 'τρίγωνο 0…1: θεμελιώδης', C + ' 4/π²', tri1, fo['Ft1'], 1e-8, '')
    add(A, 'τρίγωνο: THD χωρίς τη συνεχή συνιστώσα', C + ' √(1/12 − 8/π⁴)/(4/(√2π²))', math.sqrt(1 / 12 - tri1 ** 2 / 2) / (tri1 / math.sqrt(2)), fo['Ht'], 1e-7, '')
    add(A, 'πριονωτό 0…1 (άλμα σε κάθε μηδενισμό): 4η αρμονική', C + ' 1/(4π)', 1 / (4 * math.pi), fo['Fs4'], 1e-8, '')
    add(A, 'πριονωτό, ανά περίοδο με ρολόι: THD χωρίς τη συνεχή συνιστώσα', C + ' √(1/12 − 1/(2π²))/(1/(√2π))', math.sqrt(1 / 12 - saw1 ** 2 / 2) / (saw1 / math.sqrt(2)), fo['Hk'], 1e-7, '')
    hm, N = tab('harm400')[.1], 400
    sc = lambda n: (math.sin(math.pi * n / N) / (math.pi * n / N)) ** 2
    V2 = 2500 + 325 ** 2 / 2 * (2 + math.cos(2 * math.pi / N)) / 3 + 30 ** 2 / 2 * (2 + math.cos(10 * math.pi / N)) / 3
    U1 = 325 * sc(1) / math.sqrt(2)
    add(A, 'τάση 50 + 325·sin(ω₁t + 30°) + 30·sin(5ω₁t − 60°) V, 400 σημεία: θεμελιώδης απέναντι στην ευθεία ανάμεσα στα σημεία', C + ' 325·sinc²(π/N)', 325 * sc(1), hm['A1'], 1e-7, 'V')
    add(A, 'το ίδιο: φάση της θεμελιώδους', 'η φάση της πηγής', 30.0, hm['A1:ph'], 1e-9, '°')
    add(A, 'το ίδιο: 5η αρμονική', C + ' 30·sinc²(5π/N)', 30 * sc(5), hm['A5'], 1e-8, 'V')
    add(A, 'το ίδιο: φάση της 5ης ως προς cos(5ω₁t), ανά περίοδο', 'η φάση της πηγής − 90°', -150.0, hm['C5:ph'], 1e-9, '°')
    add(A, 'το ίδιο: THD χωρίς τη συνεχή συνιστώσα', C + ' της ευθείας', math.sqrt(V2 - U1 * U1 - 2500) / U1, hm['T0'], 1e-8, '')
    add(A, 'το ίδιο: THD απέναντι στο 30/325 του ημιτόνου (το σφάλμα της ευθείας)', C + ' 30/325', 30 / 325, hm['T0'], 6e-4, '')
    add(A, 'το ίδιο: θεμελιώδης απέναντι στις αρμονικές του scope (Metrics.harmonics)', 'αρμονικές του scope', o['harm400']['scope']['A1'], hm['A1'], 1e-7, 'V')
    add(A, 'συνέχεια από αποθηκευμένη κατάσταση: διαφορά από το τρέξιμο που δεν σταμάτησε', 'το ίδιο τρέξιμο', 0.0, o['four_resume']['diff'], 0.0, '')
    # power and sequences (THEORY §8Τ): signals with known phasors, against closed forms over the straight lines between the points
    A = 'Μπλοκ μέτρησης σήματος: ισχύς και ακολουθίες (4.19.6)'
    pw, N = tab('power')[.1], o['power']['N']
    s2 = (math.sin(math.pi / N) / (math.pi / N)) ** 2
    ln1 = (2 + math.cos(2 * math.pi / N)) / 3
    c30, c50, s50 = math.cos(math.pi / 6), math.cos(math.radians(50)), math.sin(math.radians(50))
    add(A, 'μονοφασική: v = 325·sin(ω₁t), i = 20·sin(ω₁t − 30°) + 5·sin(3ω₁t + 10°) + 2: ενεργός ισχύς P', C + ' 3250·cos 30°·(2 + cos(2π/N))/3', 3250 * c30 * ln1, pw['W1'], 1e-6, 'W')
    add(A, 'το ίδιο: άεργος ισχύς της θεμελιώδους Q₁ (ρεύμα που καθυστερεί)', C + ' 3250·sin 30°·sinc⁴(π/N)', 3250 * .5 * s2 ** 2, pw['W1:q1'], 1e-6, 'var')
    add(A, 'το ίδιο: συντελεστής ισχύος της θεμελιώδους', C + ' cos 30°', c30, pw['W1:pf1'], 1e-9, '')
    add(A, 'το ίδιο, ανά περίοδο: ενεργός ισχύς P', C, 3250 * c30 * ln1, pw['W2'], 1e-6, 'W')
    R, L, w, G = 10.0, .03183, 2 * math.pi * 50, 1e-9
    h = o['rl']['h']
    Xd = 2 * L / h * math.tan(w * h / 2)
    Y = G + 1 / (R + 1 / (1 / (1j * Xd) + G))
    rl = dict(zip((k.split(':', 1)[1] for k in o['rl']['keys']), o['rl']['at'][-1][1:]))
    add(A, 'φορτίο R = 10 Ω, L = 31,83 mH σε 325 V, 50 Hz: P₁ (η αντίδραση του τραπεζοειδούς και το GMIN των κόμβων)', C + ' (V̂²/2)·Re Y·sinc⁴(π/N)',
        325 ** 2 / 2 * Y.real * s2 ** 2, rl['W:p1'], 1e-6, 'W')
    add(A, 'το ίδιο: Q₁', C + ' −(V̂²/2)·Im Y·sinc⁴(π/N)', -325 ** 2 / 2 * Y.imag * s2 ** 2, rl['W:q1'], 1e-6, 'var')
    rv = dict(zip((k.split(':', 1)[1] for k in o['rl_var']['keys']), o['rl_var']['at'][-1][1:]))
    add(A, 'το ίδιο με μεταβλητό βήμα, απέναντι στο φορτίο του συνεχούς χρόνου: P₁', C + ' (V̂²/2)·R/(R² + ω₁²L²)', 325 ** 2 / 2 * R / (R * R + (w * L) ** 2), rv['W:p1'], 3.0, 'W')
    add(A, 'αναλυτής ακολουθιών: θετική ακολουθία 325∠30° (με 20∠−45° αρνητική και 10∠60° μηδενική)', C + ' 325·sinc²(π/N)', 325 * s2, pw['S1'], 1e-7, '')
    add(A, 'το ίδιο: φάση της θετικής', C, 30.0, pw['S1:phpos'], 1e-6, '°')
    add(A, 'το ίδιο: αρνητική ακολουθία, ενεργός τιμή', C + ' 20·sinc²(π/N)/√2', 20 * s2 / math.sqrt(2), pw['S2:neg'], 1e-8, '')
    add(A, 'το ίδιο: μηδενική ακολουθία', C + ' 10·sinc²(π/N)', 10 * s2, pw['S1:zero'], 1e-8, '')
    add(A, 'το ίδιο: ασυμμετρία |X⁻|/|X⁺|', C + ' 20/325', 20 / 325, pw['S1:unb'], 1e-12, '')
    add(A, 'ισχύς θετικής ακολουθίας P⁺ (I⁺ = 30∠−20°)', C + ' 3·(325/√2)·(30/√2)·cos 50°·sinc⁴(π/N)', 1.5 * 325 * 30 * c50 * s2 ** 2, pw['PP'], 1e-5, 'W')
    add(A, 'το ίδιο: Q⁺', C + ' 3·(325/√2)·(30/√2)·sin 50°·sinc⁴(π/N)', 1.5 * 325 * 30 * s50 * s2 ** 2, pw['PP:q'], 1e-5, 'var')
    add(A, 'στιγμιαία p της θεωρίας p–q: μέση τιμή ανά περίοδο', C + ' (3/2)·(V⁺I⁺·cos 50° + V⁻I⁻·cos(−60°))', 1.5 * (325 * 30 * c50 + 80 * .5), pw['Ap'], 1e-5, 'W')
    add(A, 'το ίδιο: μέση τιμή του q', C + ' (3/2)·(V⁺I⁺·sin 50° − V⁻I⁻·sin(−60°))', 1.5 * (325 * 30 * s50 + 80 * math.sin(math.radians(60))), pw['Aq'], 1e-5, 'var')
    add(A, 'το ίδιο: μέση τιμή του p₀', C + ' 3·(V⁰I⁰/2)·cos 130°', 45 * math.cos(math.radians(130)), pw['A0'], 1e-7, 'W')
    add(A, 'το ίδιο: p + p₀ − (va·ia + vb·ib + vc·ic) στα σημεία του λύτη, μέγιστο', 'η στιγμιαία ισχύς των φάσεων', 0.0,
        max(abs(r['PQ'] + r['PQ:p0'] - (r['VA'] * r['IA'] + r['VB'] * r['IB'] + r['VC'] * r['IC'])) for r in tab('power').values()), 1e-8, 'W')
    add(A, 'συνέχεια από αποθηκευμένη κατάσταση: διαφορά από το τρέξιμο που δεν σταμάτησε', 'το ίδιο τρέξιμο', 0.0, o['power_resume']['diff'], 0.0, '')
    # the periodic average of impulses (THEORY §8Υ)
    A = 'Μπλοκ μέτρησης σήματος: περιοδικός μέσος παλμών (4.19.6)'
    pa = tab('pia')
    add(A, 'σκαλοπάτι +2 στα 1,3 ms, περίοδος 1 ms: η περίοδος που τελειώνει στα 2 ms', C + ' 2/1 ms', 2000.0, pa[.002]['P1'], 1e-9, 'W')
    add(A, 'το ίδιο: +0,5 ακριβώς στο όριο των 6 ms, μετρά στην περίοδο που τελειώνει εκεί', C + ' 0,5/1 ms', 500.0, pa[.0061]['P1'], 1e-9, 'W')
    add(A, 'το ίδιο, δύο περίοδοι ανά παράθυρο: (4, 6] ms με +3 και +0,5', C + ' 3,5/2 ms', 1750.0, pa[.0061]['P2'], 1e-9, 'W')
    add(A, 'το ίδιο, κυλιόμενο: το (3,5, 4,5] ms', C + ' 3/1 ms', 3000.0, pa[.0045]['R1'], 1e-9, 'W')
    add(A, 'ευθεία 3·t ανά περίοδο', C + ' 3', 3.0, pa[.0123]['PL'], 1e-9, '')
    sw = o['sw_loss']['rows']
    add(A, 'ενέργεια μεταγωγής ενός διακόπτη με E_on, E_off (μπαταρία, πραγματικοί διακόπτες), ανά περίοδο του PWM: μεγαλύτερη σχετική διαφορά από τις απώλειες μεταγωγής του scope',
        'PSW του scope', 0.0, max(abs(r['pa'] / r['psw'] - 1) for r in sw), 1e-12, '')
    add(A, 'συνέχεια από αποθηκευμένη κατάσταση: διαφορά από το τρέξιμο που δεν σταμάτησε', 'το ίδιο τρέξιμο', 0.0, o['pia_resume']['diff'], 0.0, '')
    # the tutorial pq_rect: a diode bridge with a capacitor (230 V through 2 mH, R = 100 Ω), after 15 periods
    A = 'Μπλοκ μέτρησης σήματος: tutorial ανορθωτή με πυκνωτή (4.19.6)'
    tu = {w: dict(zip((k.split(':', 1)[1] for k in o['tut_' + w]['keys']), o['tut_' + w]['at'][0][1:])) for w in ('per', 'run')}
    r, sc = tu['per'], o['tut_per']['scope']
    th = r['TH'] / 100
    add(A, 'συντελεστής ισχύος PF του μπλοκ απέναντι στο PF₁/√(1 + THD²) (τάση ημιτονική)', 'PF₁, THD των μπλοκ', r['PW:pf1'] / math.sqrt(1 + th * th), r['PW:pf'], 1e-4, '')
    add(A, 'THD του ρεύματος απέναντι στις αρμονικές του scope στην ίδια περίοδο: σχετική διαφορά', 'αρμονικές του scope (απλή ακρίβεια)', 0.0, abs(r['TH'] / sc['thdAll'] - 1), 1e-6, '')
    add(A, 'κυλιόμενο παράθυρο απέναντι στο ανά περίοδο σε περιοδική λειτουργία: μεγαλύτερη σχετική διαφορά', 'ανά περίοδο', 0.0,
        max(abs(tu['run'][k] - v) / max(1.0, abs(v)) for k, v in r.items()), 1e-6, '')


def harmonic_rows(add):
    """4.19.5: the harmonic load flow (pcl/harmonic.py). Published: the first test system of the Task Force on Harmonics Modeling
    and Simulation (1999), its load flow and its voltage distortion. The others: closed forms, a line in many sections, the Fourier
    series of the ideal bridge currents, a phase-shifting branch."""
    import math
    import sys
    import numpy as np
    from pcl import harmonic as H
    from pcl import network as NW
    sys.path.insert(0, str(ROOT / 'tests'))
    import test_harmonic as TH
    A = 'Αρμονική ροή φορτίου (4.19.5)'
    P = 'Task Force 1999, Πίν. 1.1'
    net = NW.case_data('harmonic14')
    lf, sol = net.power_flow('nr', tol=1e-10), NW.case_solution('harmonic14')
    add(A, 'σύστημα δοκιμής 14 ζυγών, ροή φορτίου: μέγιστη διαφορά |V| από τον δημοσιευμένο πίνακα (16 ζυγοί, 4 δεκαδικά)', P, 0.0, max(abs(lf['buses'][b]['V'] - v) for b, (v, a) in sol.items()), 6e-5, 'pu')
    add(A, 'το ίδιο: μέγιστη διαφορά γωνίας (2 δεκαδικά της μοίρας)', P, 0.0, max(abs(lf['buses'][b]['angle'] - a) for b, (v, a) in sol.items()), 0.011, '°')
    r = H.run(net, scan_bus=False)
    thd, pub = {b: q['THD'] for b, q in r['buses'].items()}, TH.PUB['thd']
    for b, what, tol in (('3', 'ζυγός 3 (τερματικό HVDC, 230 kV)', 0.01), ('8', 'ζυγός 8 (SVC, 13,8 kV)', 0.01), ('2', 'ζυγός 2 (230 kV)', 0.05)):
        add(A, f'το ίδιο, παραμόρφωση τάσης (THD): {what}', P + ' (η δημοσίευση λύνει με αρμονική επανάληψη)', pub[b], thd[b], tol, '%')
    rel = np.array([thd[b] / pub[b] - 1 for b in pub if b not in ('301', '302')])
    add(A, 'το ίδιο: THD στους 14 ζυγούς εκτός των δύο ζυγών των γεφυρών, RMS της σχετικής διαφοράς από τη δημοσίευση', P + ': «η έγχυση ρεύματος δίνει κοντινά αποτελέσματα»',
        0.0, float(np.sqrt(np.mean(rel ** 2))), 0.09, '')
    quiet = {'1': (1.0, 0.0)}
    both = H.run(net, [dict(s, spectrum=quiet) if s['load'] == 'tcr' else s for s in H.sources_of(net)], scan_bus=False)
    add(A, 'το ίδιο, μόνο οι δύο γέφυρες (αστέρα–αστέρα και αστέρα–τρίγωνο): 5η αρμονική της τάσης στον κοινό ζυγό 3', 'μηδέν: οι τάξεις 6k ± 1 με k περιττό αναιρούνται',
        0.0, both['buses']['3']['Vh'][5], 1e-12, 'pu')
    d = NW.to_dict(net)
    for e in d['elements']:
        if e['name'] in ('T3-302', 'T7-8'):
            e['angle'] = 30.0
        if e['name'] in ('hvdc2', 'tcr'):
            e['delta'] = False
    for b, q in d['buses'].items():
        q['V'], q['angle'] = r['buses'][b]['V'], r['buses'][b]['angle'] - (30.0 if b in ('302', '8') else 0.0)
    sh = H.run(NW.from_dict(d), scan_bus=False)
    add(A, 'το ίδιο με τους δύο μετασχηματιστές αστέρα–τριγώνου γραμμένους ως κλάδους με μετατόπιση 30°: μέγιστη διαφορά αρμονικής τάσης', 'ο κανόνας (−1)^k στην πηγή',
        0.0, max(abs(sh['buses'][b]['Vh'][h] - r['buses'][b]['Vh'][h]) for b in r['buses'] for h in r['harmonics']) if sh['converged'] else float('nan'), 1e-13, 'pu')
    Sk, x, B = 2000e6, 0.05, 0.3
    two = TH.two_bus(Sk, x, B)
    q = H.run(two, load_model='none', scan_to=20, scan_step=0.01)
    xs = 100e6 / Sk
    Z5 = 1 / (5j * B + 1 / (5j * (xs + x)))
    add(A, 'δύο ζυγοί, πηγή 2000 MVA, κλάδος 0,05 pu, πυκνωτής 0,3 pu, ιδανική εξαπαλμική γέφυρα: 5η αρμονική της τάσης', 'κλειστός τύπος: I₁/5 · |Z(5)|',
        q['sources'][0]['I1'] / 5 * abs(Z5), q['buses']['B']['Vh'][5], 1e-12, 'pu')
    add(A, 'το ίδιο: τάξη του παράλληλου συντονισμού στη σάρωση συχνότητας (βήμα 0,01)', 'κλειστός τύπος: 1/√(B·(x_s + x))', 1 / math.sqrt(B * (xs + x)), q['scan']['peaks'][0][0], 0.006, '')
    f = TH.two_bus(Sk, x, 0.3, R=0.002, X=1 / (25 * 0.3))
    qf = H.run(f, load_model='none', scan_bus=False)
    add(A, 'το ίδιο με φίλτρο συντονισμένο στην 5η (R = 0,002 pu) αντί για τον πυκνωτή: 5η αρμονική της τάσης', 'κλειστός τύπος: I₁/5 · |R ∥ j5(x_s + x)|',
        qf['sources'][0]['I1'] / 5 * abs(1 / (1 / 0.002 + 1 / (5j * (xs + x)))), qf['buses']['B']['Vh'][5], 1e-12, 'pu')
    R, X, Bc, n = 0.04697, 0.19794, 0.04380, 400

    def line(sections):
        nw = NW.Network(60, 100e6)
        for k in range(sections + 1):
            nw.bus(f'b{k}', 230e3)
        nw.feeder('b0', Sk=5000e6, RX=0.0, V=1.0, slack=True)
        for k in range(sections):
            nw.branch_pu(f'b{k}', f'b{k + 1}', R / sections, X / sections, Bc / sections, name=f'L{k}')
        nw.load(f'b{sections}', 30e6, 5e6, name='conv', spectrum='six_pulse')
        return nw

    one = H.run(line(1), load_model='none', scan_bus=False, harmonics=[25])
    many = H.run(line(n), load_model='none', line_model='pi', scan_bus=False, harmonics=[25])
    add(A, 'γραμμή 230 kV του συστήματος δοκιμής στην 25η τάξη (γl = 2,3): μοντέλο μακριάς γραμμής απέναντι στην ίδια γραμμή σε 400 τμήματα π, σχετική διαφορά', 'αλυσίδα 400 τμημάτων',
        0.0, abs(one['buses']['b1']['Vh'][25] / many['buses'][f'b{n}']['Vh'][25] - 1), 2e-4, '')
    for delta, what in ((False, 'πίσω από αστέρα–αστέρα'), (True, 'πίσω από αστέρα–τρίγωνο')):
        w, th = TH.wave(delta)
        a1, a5 = 2 * np.mean(w * np.cos(th)), 2 * np.mean(w * np.cos(5 * th))
        mag, ang = H.six_pulse()[5]
        add(A, f'φάσμα της ιδανικής εξαπαλμικής γέφυρας {what}: 5η αρμονική ως προς τη θεμελιώδη, με το πρόσημό της', 'σειρά Fourier της κυματομορφής του ρεύματος (αριθμητικά)',
            float(a5 / a1), mag * (1 if ang == 0 else -1) * (-1 if delta else 1), 2e-3, '')


def scopf_rows(add):
    """4.19.4: the optimal power flow with security against every single outage (pcl/scopf.py). The reference of the flows after
    an outage is the engine's own DC load flow of the network without that branch (tests/test_scopf.py: after_outages)."""
    import sys
    from pcl import network as NW, scopf as SC
    sys.path.insert(0, str(ROOT / 'tests'))
    import test_scopf as TS
    A = 'Βέλτιστη ροή φορτίου με ασφάλεια N−1 (4.19.4)'
    net = NW.case_data('case30')
    r = net.scopf(check=False, tol=1e-9)
    s = r['security']
    w = TS.after_outages(net, r)
    add(A, 'δίκτυο 30 ζυγών: φόρτιση κάθε κλάδου μετά από κάθε διαταραχή (38 διαταραχές), μέγιστη διαφορά από τη ροή φορτίου DC του δικτύου χωρίς τον κλάδο',
        'pcl DC, μία ροή φορτίου ανά διαταραχή', 0.0, max(abs(s['post'][b][0] - x) for b, (x, _) in w.items()), 1e-9, 'pu')
    add(A, 'δίκτυο 30 ζυγών: χειρότερη φόρτιση μετά από διαταραχή στην ασφαλή κατανομή', 'το όριο (1)', 1.0, max(x for x, _ in w.values()), 1e-4, 'pu')
    add(A, 'δίκτυο 30 ζυγών: κόστος της πρώτης λύσης (χωρίς ασφάλεια)', 'pcl.opf, DC', net.opf('dc', tol=1e-9)['cost'], s['cost_base'], 0.0, 'ανά ώρα')
    case = net.case()
    rate = case.rate[case.br_name.index('br35')] * net.S_base
    r2 = net.scopf(check=False, tol=1e-9, ratings={'br35': rate + 0.01e6})
    add(A, 'πολλαπλασιαστής του περιορισμού ασφάλειας (br35 όταν χάνεται ο br36)', 'διαφορά κόστους για 0,01 MW περισσότερη ονομαστική ισχύ', (r['cost'] - r2['cost']) / 0.01,
        s['binding'][0]['mu'], 5e-4, 'ανά MWh')
    t = net.scopf(check=False, emergency=0.8)
    wt = TS.after_outages(net, t, emergency=0.8)
    u = t['security']['unsecured'][0]
    xr = case.rate[case.br_name.index(u['branch'])] * net.S_base
    add(A, 'όριο 0,8 μετά από διαταραχή: η υπερφόρτιση που καμία κατανομή δεν αφαιρεί (το χειρότερο ζεύγος)', 'ροή φορτίου DC της διαταραχής', (wt[u['branch']][0] - 1) * 0.8 * xr / 1e6,
        u['overload'] / 1e6, 1e-3, 'MW')
    t10 = net.scopf(check=False, emergency=0.8, penalty=10 * t['security']['penalty'])
    add(A, 'η ίδια υπερφόρτιση με δεκαπλάσια τιμή στο περιθώριο (η τιμή είναι αρκετά ψηλή)', 'η λύση με την κανονική τιμή', u['overload'] / 1e6, t10['security']['unsecured'][0]['overload'] / 1e6,
        1e-3, 'MW')
    n118 = NW.case_data('ieee118')
    rt = TS.own_ratings(n118, 1.2, 200e6)
    q = SC.solve(n118, ratings=rt, check=False)
    w118 = TS.after_outages(n118, q, rt)
    add(A, f"IEEE 118 με ονομαστικές από τις δικές του ροές ({q['security']['rounds']} γύροι, {q['security']['constraints']} περιορισμοί): μέγιστη διαφορά φόρτισης μετά από διαταραχή",
        'pcl DC, μία ροή φορτίου ανά διαταραχή', 0.0, max(abs(q['security']['post'][b][0] - x) for b, (x, _) in w118.items()), 1e-7, 'pu')
    add(A, 'IEEE 118: χειρότερη φόρτιση μετά από διαταραχή στην ασφαλή κατανομή', 'το όριο (1)', 1.0, max(x for x, _ in w118.values()), 1e-4, 'pu')


def file_rows(add):
    """4.19.4: network files (MATPOWER, PSS/E RAW, our JSON) and changes of a network as data (pcl/netfile.py, pcl/psse.py). The
    reference of every row is the network before it was written, or the same quantity worked out here."""
    import sys
    import numpy as np
    from pcl import netfile as NF, network as NW, psse as PS, study as ST
    sys.path.insert(0, str(ROOT / 'tests'))
    import test_psse as TP
    A = 'Αρχεία δικτύου και αλλαγές (4.19.4)'

    def worst(fmt):
        w = 0.0
        for c in NW.CASES:
            net = NW.case_data(c)
            a, b = net.power_flow(), NF.read(NF.write(net, fmt), c + {'matpower': '.m', 'raw': '.raw', 'pcl': '.json'}[fmt]).power_flow()
            w = max(w, max(abs(a['buses'][k]['V'] - b['buses'][k]['V']) for k in a['buses']))
        return w
    add(A, f'τα {len(NW.CASES)} δίκτυα γραμμένα ως MATPOWER και διαβασμένα πίσω: μέγιστη διαφορά |V| της ροής φορτίου', 'το δίκτυο πριν γραφτεί', 0.0, worst('matpower'), 0.0, 'pu')
    add(A, f'τα {len(NW.CASES)} δίκτυα γραμμένα ως PSS/E RAW 33 και διαβασμένα πίσω: μέγιστη διαφορά |V| (άλλη σειρά στοιχείων, άρα άλλη στρογγύλευση)', 'το δίκτυο πριν γραφτεί',
        0.0, worst('raw'), 1e-11, 'pu')
    ref = PS.read(TP.raw(33)).power_flow(tol=1e-12)
    w = 0.0
    for ver in (30, 31, 32, 34, 35):
        r = PS.read(TP.raw(ver)).power_flow(tol=1e-12)
        w = max(w, max(abs(r['buses'][k]['V'] - ref['buses'][k]['V']) for k in ref['buses']))
    add(A, 'μικρό δίκτυο γραμμένο με το χέρι στη διάταξη των εκδόσεων 30, 31, 32, 34, 35 του RAW: μέγιστη διαφορά |V|', 'το ίδιο δίκτυο στη διάταξη της έκδοσης 33', 0.0, w, 1e-10, 'pu')
    e = PS.read(TP.raw(33, t23=dict(w1=(1.05, 0.0, 0.0), w2=(0.95, 0.0)))).element('T2-3-1')
    t1, t2, z = 1.05, 0.95, complex(0.002, 0.1)
    Y = np.array([[1 / (z * t1 * t1), -1 / (z * t1 * t2)], [-1 / (z * t1 * t2), 1 / (z * t2 * t2)]])
    zb, tau = complex(e['r'], e['x']), e['ratio']
    Yb = np.array([[1 / (zb * tau * tau), -1 / (zb * tau)], [-1 / (zb * tau), 1 / zb]])
    add(A, 'μετασχηματιστής RAW με λόγο και στα δύο τυλίγματα (1,05 και 0,95): μέγιστη διαφορά των τεσσάρων στοιχείων του πίνακα αγωγιμοτήτων', 'το μοντέλο της μορφής: ιδανικός t1 : 1, Z, ιδανικός 1 : t2',
        0.0, float(np.abs(Y - Yb).max()), 1e-12, 'pu')
    text = TP.raw(33).replace("'T137        ', 1,", "'T137        ', 3,")
    two = text.split("1, 3, 7,'1 '")
    two = two[0] + "1, 3, 0,'1 ', 1, 1, 1, 0.001, -0.01, 2,'T13         ', 1, 1, 1.0\n0.002, 0.12, 100.0\n1.0, 0.0, 0.0, 200.0, 200.0, 200.0, 0, 0, 1.1, 0.9, 1.1, 0.9, 33, 0, 0.0, 0.0, 0.0\n1.025, 0.0\n" + two[1].split('\n', 5)[5]
    a, b = NF.read(text, 'a.raw').power_flow(tol=1e-12), NF.read(two, 'b.raw').power_flow(tol=1e-12)
    add(A, 'μετασχηματιστής τριών τυλιγμάτων με το τρίτο εκτός: μέγιστη διαφορά |V| στους υπόλοιπους ζυγούς', 'μετασχηματιστής δύο τυλιγμάτων με Z₁₂', 0.0,
        max(abs(a['buses'][k]['V'] - b['buses'][k]['V']) for k in b['buses']), 1e-9, 'pu')
    edits = [{'op': 'load', 'bus': '8', 'P_MW': 45, 'Q_Mvar': 30}, {'op': 'outage', 'element': 'br10'}]
    r = ST.run({'case': 'case30', 'study': 'pf', 'edits': edits, 'view': True})
    net2 = NW.case_data('case30')
    for q in net2.elements:
        if q['kind'] == 'load' and q['bus'] == '8':
            q['P'], q['Q'] = 45e6, 30e6
    net2.remove('br10')
    add(A, 'case30 με φορτίο 45 MW στον ζυγό 8 και τον κλάδο br10 εκτός, ως λίστα αλλαγών στο αίτημα της μελέτης: απώλειες', 'οι ίδιες αλλαγές κατευθείαν στο αντικείμενο του δικτύου',
        net2.power_flow()['losses'] / 1e6, r['result']['losses'] / 1e6, 1e-9, 'MW')
    v0 = ST.run({'case': 'case30', 'study': 'pf', 'view': 'only'})['view']
    add(A, 'το διάγραμμα του αλλαγμένου δικτύου: ζυγοί που άλλαξαν θέση', 'οι θέσεις του δικτύου πριν από τις αλλαγές', 0,
        sum((p['x'], p['y']) != (q['x'], q['y']) for p, q in zip(v0['buses'], r['view']['buses'])), 0, '')
    add(A, 'το διάγραμμα του αλλαγμένου δικτύου: κλάδοι που λείπουν από την εικόνα', 'ο κλάδος εκτός λειτουργίας μένει, διακεκομμένος', 0,
        len(v0['branches']) - len(r['view']['branches']) + (1 - sum(bool(q.get('off')) for q in r['view']['branches'])), 0, '')


def dcgrid_rows(add):
    """4.20: multi-terminal DC grids (pcl/dcgrid.py): the DC load flow against the published five-terminal grid (Haileselassie &
    Uhlen 2012, Tables IV, VI), the converter station against Beerten, Cole & Belmans (2012, Table II), and the EMT of the tutorial
    mtdc5 against the AC/DC load flow of its card (tests/test_dcgrid.py)."""
    import cmath as cm
    from pcl import dcgrid as D
    from pcl import study as S
    sys.path.insert(0, str(ROOT / 'tests'))
    import test_dcgrid as TD
    A = 'Δίκτυα DC πολλών τερματικών (4.20)'
    base = TD.hu_table4().flow(tol=1e-12)
    for b, u in zip('1345', (399.550, 396.613, 396.928, 385.247)):
        add(A, f'πέντε τερματικά (Haileselassie & Uhlen 2012), ροή φορτίου DC: τάση του τερματικού {b}', 'Πίν. IV', u * 1e3, base['buses'][b]['U'], 0.5, 'V')
    add(A, 'πέντε τερματικά: ισχύς του τερματικού 2 (ζυγός ταλάντωσης DC)', 'Πίν. IV', 535.938e6, base['converters']['2']['P'], 500, 'W')
    r = TD.hu_droop(base, P3=-800e6).flow(tol=1e-12)
    for b, p in zip('1245', (614.820, 549.651, 561.746, -890.33)):
        add(A, f'ΔP*₃ = −50 MW με στατικότητα ρ = 0,04: ισχύς του τερματικού {b}', 'PSCAD της δημοσίευσης, Πίν. VI', p * 1e6, r['converters'][b]['P'], 0.02e6, 'W')
    gj = D.DCGrid()
    for b in '12345':
        gj.bus(b, 400e3, R=3e6)
    for (x, y), rr in {('1', '2'): 5, ('1', '4'): 2, ('1', '5'): 2, ('2', '3'): 2, ('2', '5'): 2, ('3', '4'): 5, ('3', '5'): 2, ('4', '5'): 1.8}.items():
        gj.line(x, y, R=rr, poles=1)
    gj.converter('1', 'V', name='1')
    for b, i in (('2', -650.0), ('3', -1200.0), ('4', 900.0)):
        gj.converter(b, 'I', I=i)
    add(A, 'Jovcic 2019, Παράδειγμα 26.1 (σταθερά ρεύματα): ρεύμα του σταθμού 1', 'Πίν. 26.1', 950.66, gj.flow(tol=1e-12)['converters']['1']['I'], 0.006, 'A')
    st = TD.Station().st('12', 0)
    f = D.station(1.025 * cm.exp(1j * math.radians(-8.93)), complex(66.84, 0) / 100, st, 100e6, 138e3)
    add(A, 'σταθμός μετατροπέα (Beerten, Cole & Belmans 2012), μετατροπέας 1: P_c', 'Πίν. II', 66.91e6, f['Sc'].real * 100e6, 0.011e6, 'W')
    add(A, 'σταθμός μετατροπέα, μετατροπέας 1: |U_c|', 'Πίν. II', 1.042, abs(f['Uc']), 6e-4, '')
    add(A, 'σταθμός μετατροπέα, μετατροπέας 1: P_dc', 'Πίν. II', -68.47e6, f['Pdc'], 0.025e6, 'W')
    out = subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'mtdc_cases.js')], capture_output=True, text=True, timeout=600, cwd=ROOT)
    js = json.loads(out.stdout)
    run = next(q for q in js['runs'] if q['step'] == 'm50' and q['rho'] == '0.04')
    lf = {d['bus']: d for d in S.run({'case': 'mtdc5', 'study': 'acdc', 'options': run['study']['options']})['summary']['dc']}
    for k in (1, 3, 5):
        add(A, f'tutorial mtdc5 (EMT), ΔP*₃ = −50 MW: τάση του τερματικού {k} στα 0,6 s', 'ροή φορτίου AC/DC της κάρτας', lf[str(k)]['U_kV'] * 1e3, run['rows'][-1]['U'][k - 1], 0.2, 'V')
    add(A, 'tutorial mtdc5 (EMT): ισχύς του τερματικού 5 στα 0,6 s', 'ροή φορτίου AC/DC της κάρτας', lf['5']['P_MW'] * 1e6, run['rows'][-1]['P'][4] * 1e6, 2e3, 'W')
    rb = json.loads(subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'robust_cases.js')], capture_output=True, text=True, timeout=900, cwd=ROOT).stdout)
    add(A, 'σταθμός MMC με στιβαρό έλεγχο ρεύματος στον τρόπο V_dc (hvdc_mmc, Model 4): V_dc του σταθμού 2 μετά το βήμα P', 'V_dc,ref', 1.0, rb['vdc']['win'][1][2]['mean'], 1e-4, '')
    d = rb['droop']['win'][1]
    add(A, 'σταθμός MMC με στιβαρό έλεγχο ρεύματος σε στατικότητα (k_d = 0,05): P του σταθμού 2 μετά το βήμα', 'P_ref + (V_ref − v_dc)/k_d', -1 + (1 - d[2]['mean']) / 0.05, d[1]['mean'], 5e-4, '')


def b4_rows(add):
    """4.20.1: the start of VSC2 with DC pins from a load flow (tests/js/vsc_start_cases.js), the 320 kV cable of Leterme et
    al. (2015) from its geometry, the CIGRE B4 of Jovcic (2019, §27.8) against the flows that the book prints (tests/test_b4.py)."""
    import cmath as cm
    from pcl import dcgrid as D
    from pcl import lineconst as lc
    sys.path.insert(0, str(ROOT / 'tests'))
    import test_b4 as TB
    A = 'Το B4 της CIGRE και η αρχή με ακροδέκτες DC (4.20.1)'
    js = json.loads(subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'vsc_start_cases.js')], capture_output=True, text=True, timeout=600, cwd=ROOT).stdout)
    for u, what in (('VS1', 'αντιστροφέας'), ('VS2', 'ανορθωτής')):
        q = js['lf']['units'][u]
        add(A, f'VSC2 με ακροδέκτες DC από ροή φορτίου ({what}): ρεύμα DC στο t = 0', 'P/v_dc,0 της λύσης με φασιθέτες', -q['I0'], q['idc0'], 1e-9 * abs(q['I0']), 'A')
        add(A, f'VSC2 με ακροδέκτες DC ({what}): η μεγαλύτερη v_dc σε τρεις περιόδους', 'v_dc,0', js['Vd0'], q['vdc']['max'], 0.1, 'V')
    add(A, 'πηγή ρεύματος 2 A σε 5 Ω ∥ 1 mF, αρχή από φασιθέτες: τάση στο t = 0', 'I·R', 10.0, js['isrc']['v0'], 1e-6, 'V')
    Z, Y = lc.phase_matrices(lc.TYPICAL['320kV-xlpe'], f=1e6)
    z, y = complex(Z[0, 0]), complex(Y[0, 0])
    add(A, 'καλώδιο 320 kV XLPE (Leterme κ.ά. 2015) από τη γεωμετρία: Z_c στο 1 MHz', 'Πίν. 2 και κείμενο', 33.73, abs(cm.sqrt(z / y)), 0.005, 'Ω')
    add(A, 'καλώδιο 320 kV XLPE: ταχύτητα στο 1 MHz', 'κείμενο της δημοσίευσης', 183.5, 2 * math.pi * 1e6 / cm.sqrt(z * y).imag / 1e6, 0.05, 'km/ms')
    for fig, a, b in (('27.6', 'Bm-C1', 'Bm-A1'), ('27.6', 'Bb-A1', 'Bb-B4'), ('27.6', 'Bm-B2', 'Bm-B3'), ('27.7', 'Bb-D1', 'Bb-C2')):
        d = TB.B4_FIG[fig]
        P = next(x[2] for x in d['P'] if x[:2] == (a, b))
        Un = D.B4_UN[D.B4_BUSES[a]]
        Ua, Ub, R = d['V'][a] * Un, d['V'][b] * Un, TB.b4_link(a, b)
        I = (Ua - Ub) / R
        Pa, Pb = Ua * I / 1e6, Ub * I / 1e6
        add(A, f'B4 (Jovcic 2019), Σχ. {fig}: ροή {a} → {b} από τις τυπωμένες τάσεις (Πίν. 7.3)', f'Σχ. {fig}', P, (Pa + Pb) / 2,
            (Ua * 1e-4 * Un / R) / 1e6 + 1.0 + abs(Pa - Pb) / 2, 'MW')
    from pcl import study as S
    tj = json.loads(subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'b4_cases.js'), 'cd55:vdc'], capture_output=True, text=True, timeout=900, cwd=ROOT).stdout)['runs'][0]
    q = S.run({'case': 'b4', 'study': 'acdc', 'options': tj['study']['options']})['summary']
    U = {x['bus']: x['U_kV'] * 1e3 for x in q['dc']}
    P = {x['name']: x['Pdc_MW'] for x in q['stations']}
    w = tj['win'][1]
    add(A, 'tutorial b4dcs2 (DCS2 σε EMT, MMC Model 4): τάση του Bm-E1 στα 2 s, μετά το 300 → 55 MW του Cd-E1', 'ροή φορτίου AC/DC του b4 (κάρτα)', U['Bm-E1'], w['U']['E1'], 70, 'V')
    add(A, 'tutorial b4dcs2: ισχύς DC του Cm-B3 (κρατά τη V_dc) στα 2 s', 'ροή φορτίου AC/DC του b4 (χωρίς απώλειες σταθμών)', P['Cm-B3'], w['P']['B3'], 1.0, 'MW')
    g = D.DCGrid()
    for b in ('B2', 'B3', 'B5', 'F1', 'E1'):
        g.bus('Bm-' + b, 400e3)
    for a, b, km, kind, n in D.B4_LINES:
        if a in g.buses and b in g.buses:
            g.line(a, b, R=D.b4_line_data(a, km, kind)[0], poles=2)
    g.converter('Bm-B3', 'V', V=w['U']['B3'] / 400e3)
    for k in ('B2', 'F1', 'E1'):
        g.converter('Bm-' + k, 'P', P=w['P'][k] * 1e6)
    g.converter('Bm-E1', 'P', P=w['P']['CD'] * 1e6)
    add(A, 'tutorial b4dcs2: τάση του Bm-F1 στα 2 s από τη ροή φορτίου DC με τις ισχείς DC του ίδιου του EMT', 'EMT', w['U']['F1'], g.flow(tol=1e-12)['buses']['Bm-F1']['U'], 20, 'V')
    r = D.cigre_b4().flow(tol=1e-12)
    bs = {b for b, x in D.B4_BUSES.items() if x == 'DCS3'}
    loss = sum(ln['loss'] for ln in r['lines'] if ln['a'] in bs)
    add(A, 'B4 με τις αναφορές του Πίν. 27.11: ισχύς του Cb-A1 (κρατά την τάση του DCS3)', 'αναφορές του DCS3 + απώλειες', 2000e6 + loss, r['converters']['Cb-A1']['P'], 1e3, 'W')


def gfm3_rows(add):
    """4.20.2: the grid-forming MMC station in Model 3 against Model 4, dVOC and matching control against the closed forms of
    their steady state (Tayyebi et al. 2020 (16)–(22)) on a stiff grid (tests/test_gfm3.py)."""
    sys.path.insert(0, str(ROOT / 'tests'))
    from test_gfm2 import cases, mean
    A = 'Grid-forming, μέρος 3 (4.20.2)'
    m4, m3 = cases([{'kind': 'tut', 'id': 'hvdc_gfm', 'opts': {'ac': 'island', 'law': 'droop', 'model': m}, 'at': [0.59], 'keys': ['Y:CT2/G/PP', 'Y:CT2/G/WW'], 'win': 0.04} for m in ('m4', 'm3')], timeout=3000)
    add(A, 'σταθμός MMC σε grid-forming (hvdc_gfm, νησίδα, στατικότητα): P στα 0,59 s με το Model 3', 'το Model 4', mean(m4, 0.59, 'Y:CT2/G/PP'), mean(m3, 0.59, 'Y:CT2/G/PP'), 1e-3, 'pu')
    add(A, 'το ίδιο με το Model 3: συχνότητα', 'ω = 1 − m_p·(P − P_ref)', 1 - 0.02 * (mean(m3, 0.59, 'Y:CT2/G/PP') - 0.55), mean(m3, 0.59, 'Y:CT2/G/WW'), 3e-4, 'pu')
    K = ['Y:CT/PP', 'Y:CT/QQ', 'Y:CT/WW', 'Y:CT/EE']
    q = cases([{'kind': 'grid', 'law': 'dvoc', 'Pref': '0.3', 'fg': 49.9, 'T': 1.0, 'dt': 0.2, 't0': 0.6, 'ct': {'Rv': 0.05}, 'keys': K}])[0]
    P, Q, w, E = q['out'][-1][1:]
    add(A, 'dVOC απέναντι σε άκαμπτο δίκτυο 49,9 Hz (η για 2 %, α για 5 %, R_v 0,05 pu): P', '(22a) στη μόνιμη: P = E²·(P*/V*² + (1 − ω)/η)', E * E * (0.3 + (1 - w) / 0.02), P, 1e-4, 'pu')
    add(A, 'dVOC, το ίδιο: Q', '(22b) στη μόνιμη: Q = E²·(Q* + α·(V*² − E²))/V*²', E * E * 10 * (1 - E * E), Q, 1e-4, 'pu')
    K = ['Y:CT/PP', 'Y:CT/WW', 'Y:VS/VD']
    q = cases([{'kind': 'match1', 'Pref': '0.3', 'fg': 49.9, 'T': 1.2, 'dt': 0.1, 't0': 0.4, 'tdc': 0.005, 'keys': K}])[0]
    P, w, vd = q['out'][-1][1:]
    add(A, 'matching control απέναντι σε άκαμπτο δίκτυο 49,9 Hz (πηγή DC 5 ms): συχνότητα', '(16): ω = k_θ·v_dc, k_θ = ω₀/V_dc*', vd / 800, w, 1e-5, 'pu')
    add(A, 'matching control, το ίδιο: P', '(10) με k_dc = 1/m_p: P = P* + (1 − ω)/m_p', 0.3 + (1 - w) / 0.02, P, 1e-3, 'pu')


def gfm4_rows(add):
    """4.20.3: dVOC for an angle κ of 60° against the closed form of its steady state on a stiff grid ((21) in polar form),
    and droop with the DC control (10) of every law against the balance of the DC side (tests/test_gfm4.py)."""
    import math
    sys.path.insert(0, str(ROOT / 'tests'))
    from test_gfm2 import cases
    A = 'Grid-forming, μέρος 4 (4.20.3)'
    K = ['Y:CT/PP', 'Y:CT/QQ', 'Y:CT/WW', 'Y:CT/EE']
    q = cases([{'kind': 'grid', 'law': 'dvoc', 'Pref': '0.3', 'fg': 49.9, 'T': 1.0, 'dt': 0.2, 't0': 0.6, 'ct': {'Rv': 0.05, 'kap': 60}, 'keys': K}])[0]
    P, Q, w, E = q['out'][-1][1:]
    sk, ck, eta, al = math.sin(math.radians(60)), math.cos(math.radians(60)), 0.02, 10.0
    dP = sk * (w - 1) / eta - ck * al * (1 - E * E)
    dQ = -ck * (w - 1) / eta - sk * al * (1 - E * E)
    add(A, 'dVOC με κ = 60° απέναντι σε άκαμπτο δίκτυο 49,9 Hz (η για 2 %, α για 5 %, R_v 0,05 pu): P', '(21) στη μόνιμη: P = E²·(P*/V*² − ΔP)', E * E * (0.3 - dP), P, 1e-4, 'pu')
    add(A, 'dVOC με κ = 60°, το ίδιο: Q', '(21) στη μόνιμη: Q = E²·(Q*/V*² − ΔQ)', E * E * (0.0 - dQ), Q, 1e-4, 'pu')
    K = ['Y:CT/PP', 'Y:CT/PSW', 'Y:CT/WW', 'Y:VS/VD']
    q = cases([{'kind': 'match1', 'Pref': '0.3', 'fg': 49.9, 'T': 1.2, 'dt': 0.1, 't0': 0.4, 'tdc': 0.005, 'ct': {'law': 'droop', 'dcc': 'on'}, 'keys': K}])[0]
    P, ps, w, vd = q['out'][-1][1:]
    v, psw = vd / 800, ps + P
    add(A, 'στατικότητα με τον έλεγχο DC (10) απέναντι σε άκαμπτο δίκτυο 49,9 Hz: P', 'P = P* + (1 − ω)/m_p', 0.3 + (1 - w) / 0.02, P, 2e-3, 'pu')
    add(A, 'στατικότητα με τον έλεγχο DC (10), το ίδιο: v_dc', 'ισοζύγιο DC: (1 − v)·(k_dc − P_sw/v) = P − P*', 1 - (P - 0.3) / (50 - psw / v), v, 1e-5, 'pu')



def gfm5_rows(add):
    """4.20.4: droop with the DC control (10) and the modulation (9) on the nominal V_dc against the balance of the DC side,
    and dVOC with κ = 60° in the MMC station against its law (21) (tests/test_gfm5.py)."""
    import math
    sys.path.insert(0, str(ROOT / 'tests'))
    from test_gfm2 import cases, mean
    A = 'Grid-forming, μέρος 5 (4.20.4)'
    K = ['Y:CT/PP', 'Y:CT/PSW', 'Y:CT/WW', 'Y:VS/VD']
    q = cases([{'kind': 'match1', 'Pref': '0.3', 'fg': 49.9, 'T': 1.2, 'dt': 0.1, 't0': 0.4, 'tdc': 0.005, 'ct': {'law': 'droop', 'dcc': 'on', 'mdc': 'nom'}, 'keys': K}])[0]
    P, ps, w, vd = q['out'][-1][1:]
    v, psw = vd / 800, ps + P
    add(A, 'στατικότητα με τον έλεγχο DC (10) και τη διαμόρφωση (9) απέναντι σε άκαμπτο δίκτυο 49,9 Hz: P', 'P = P* + (1 − ω)/m_p', 0.3 + (1 - w) / 0.02, P, 2e-3, 'pu')
    add(A, 'το ίδιο: v_dc', 'ισοζύγιο DC με P_sw = v_dc·v_c·i: (1 − v)·(k_dc − P_sw/v) = P − P*', 1 - (P - 0.3) / (50 - psw / v), v, 1e-5, 'pu')
    K = ['Y:CT2/G/PP', 'Y:CT2/G/QQ', 'Y:CT2/G/WW', 'Y:CT2/G/EE']
    q = cases([{'kind': 'tut', 'id': 'hvdc_gfm', 'opts': {'ac': 'island', 'law': 'dvoc'}, 'set': {'CT2': {'kap': 60}}, 'at': [0.55], 'keys': K, 'win': 0.1}], timeout=1800)[0]
    p, q_, w, e = (mean(q, 0.55, k) for k in K)
    sk, ck = math.sin(math.radians(60)), math.cos(math.radians(60))
    add(A, 'σταθμός MMC με dVOC, κ = 60°, νησίδα του hvdc_gfm: ω', '(21): ω = 1 + η·(sin κ·(P* − P/E²) + cos κ·Q/E²), η = m_p', 1 + 0.02 * (sk * (0.55 - p / (e * e)) + ck * q_ / (e * e)), w, 5e-4, 'pu')

def v421_rows(add):
    """4.21: the optimal power flow AC/DC against its paper, a station at its current limit, the synchrophasors of the PMU of
    the studio against the sinusoid of their samples and the spectrum of a six-pulse bridge from the EMT against the ideal one
    (tests/test_acdc_opf.py, tests/test_dcgrid.py, tests/test_emt_se.py, tests/test_emt_harmonic.py)."""
    import json
    import math
    import subprocess
    from pcl import network as N
    from pcl import harmonic as H
    from pcl import study as S
    A = 'Δίκτυα AC/DC, PMU και φάσμα από το EMT (4.21)'
    r = N.case_data('case5_acdc').acdc_opf(tol=1e-8)
    add(A, 'βέλτιστη ροή φορτίου AC/DC, case5_acdc: κόστος', 'Ergun κ.ά. 2019, Πίν. IV (BIM NLP): 194,139 ανά ώρα', 194.139, r['cost'], 6e-4, '')
    sm = S.run({'case': 'case5_acdc', 'study': 'acdc', 'options': {'limits': True, 'set': {'C1': {'Imax': 110}}}})['summary']
    c = [q for q in sm['stations'] if q['name'] == 'C1'][0]
    add(A, 'σταθμός C1 με I_max = 110 A: ρεύμα του μετατροπέα', 'στο όριο, με την P κρατημένη (Beerten κ.ά. 2012 §III-C)', 110.0, c['Ic_kA'] * 1e3, 1e-6, 'A')
    add(A, 'το ίδιο: P_s', 'P* = −60 MW', -60.0, c['Ps_MW'], 1e-6, 'MW')
    js = json.loads(subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'pmu_cases.js'), '0.1'], capture_output=True, text=True, timeout=900, cwd=ROOT).stdout)
    w, h = 2 * math.pi * js['f'], js['h']
    p = js['points'][5]
    import numpy as np
    t = np.array(p['wave']['t'])
    cf = np.linalg.lstsq(np.c_[np.sin(w * t), np.cos(w * t)], np.array(p['wave']['va']), rcond=None)[0]
    add(A, 'PMU του se_emt (ζυγός 7): |V⁺| απέναντι στο ημίτονο των δειγμάτων της (φάση a)', '(1 − (ωh)²/12)·|V| με 400 βήματα ανά περίοδο', (1 - (w * h) ** 2 / 12) * math.hypot(*cf) / math.sqrt(2), p['V'], 1e-3, 'V')
    js = json.loads(subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'harm_emt_cases.js')], capture_output=True, text=True, timeout=1800, cwd=ROOT).stdout)
    run = [q for q in js['runs'] if q['Ls'] == '0' and q['dev'] == 'diode'][0]
    sp = H.spectrum_from(run['four'])
    for k in (5, 7, 11, 13):
        add(A, f'γέφυρα 6 παλμών χωρίς L_s, από το EMT: τάξη {k}', 'ιδανική γέφυρα 1/h', 1 / k, sp[k][0], 1.5e-3, '')


def v422_rows(add):
    """4.22: the GIS substation and its very fast transients (the 765 kV GIS of IEC TR 60071-4 against the method of
    characteristics of pcl.surge and the closed forms), the leader progression model against an independent integration,
    the coaxial data of a line, the multistory tower against its paper, the insulation co-ordination against the worked
    example of IEC 60071-2 and Table 4 of IEC 60099-5, and the distances on the earth of pcl.geo (tests/test_gis.py,
    tests/test_insulation.py, tests/test_geo.py)."""
    import json
    import math
    import subprocess
    import numpy as np
    sys.path.insert(0, str(ROOT / 'tests'))
    from test_gis import lpm_reference
    from pcl import geo as G
    from pcl import insulation as I
    from pcl import surge
    A = 'Υποσταθμός GIS, VFTO και συντονισμός μόνωσης (4.22)'
    js = lambda w: json.loads(subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'gis_cases.js'), w], capture_output=True, text=True, timeout=1800, cwd=ROOT).stdout)
    tl = js('tl')
    add(A, 'ομοαξονική γραμμή D = 0,5 m, d = 0,15 m: Z', 'Z = 60·ln(D/d)/√ε_r', 60 * math.log(0.5 / 0.15), tl['coax']['Z'], 1e-9, 'Ω')
    ms = js('ms')['ms']
    add(A, 'πολυώροφος πύργος: R₁ (πάνω όροφος)', 'Ishii κ.ά. 1991, Πίν. I: 8,32 Ω', 8.32, ms['R'][0], 0.02, 'Ω')
    add(A, 'πολυώροφος πύργος: R₄ (κάτω όροφος)', 'Ishii κ.ά. 1991, Πίν. I: 33,47 Ω', 33.47, ms['R'][3], 0.07, 'Ω')
    add(A, 'πολυώροφος πύργος: L₄', 'Ishii κ.ά. 1991, Πίν. I: 14,01 μH', 14.01, ms['L'][3] * 1e6, 0.06, 'μH')
    lp = js('lpm')['lpm_1000000000000']
    ref = lpm_reference(1e12)
    add(A, 'LPM, διάκενο 1 m, ράμπα 1 MV/μs: χρόνος διάσπασης', 'ανεξάρτητη ολοκλήρωση (solve_ivp) των εξισώσεων των οχετών και του οχετού', ref * 1e6, lp['h1e-10'] * 1e6, 2e-3 * ref * 1e6, 'μs')
    tut = js('tut')
    c = tut['gis765']
    add(A, 'GIS 765 kV χαμηλής τάσης (TR 60071-4, περ. 4): U_C1, πρώτο σκαλί', '100 V στον προσαρμοσμένο ζυγό (200 V πίσω από 75 Ω, Z = 75 Ω)', 100.0, c['uc'][0], 0.5, 'V')
    add(A, 'το ίδιο, μετά την ανάκλαση στο J3', '100·(1 + Γ), Γ = −1/3', 200 / 3, c['uc'][1], 2.5, 'V')
    nw = surge.from_project(c['project'])
    r = surge.solve(nw, max(c['t']) + 2e-12, 2e-12, {'UK': nw['probes']['VUK']})
    T = c['t'][-1]
    add(A, f'το ίδιο: U_UK στα {T * 1e9:.0f} ns', 'μέθοδος των χαρακτηριστικών (pcl.surge)', float(np.interp(T, r['t'], r['UK'])), c['uk'][-1], 2.5, 'V')
    v = tut['vfto']
    nw = surge.from_project(v['project'], t_close=v['closes'])
    r = surge.solve(nw, 2e-6, 4e-12, {'VT29': nw['probes']['VT29']})
    add(A, 'VFTO στο GIS 800 kV, φορτίο −1 pu: κορυφή στο T29', 'μέθοδος των χαρακτηριστικών (pcl.surge)', float(np.max(np.abs(r['VT29']))) / 1e3, abs(v['peaks']['Y:VT29'][0]) / 1e3, 0.05 * float(np.max(np.abs(r['VT29']))) / 1e3, 'kV')
    co = I.coordinate(245, H=1000, tov={'k': 1.5, 'lr': 1.4, 'polluted': True}, slow={'Ue2': 1.9, 'Up2': 2.9, 'Ups': 410},
                      fast={'Upl': 500, 'A': 4500, 'n': 2, 'Lsp': 300, 'Ra': 1 / 400, 'r': 1e-5, 'L': {'external': 60, 'liquid': 30}}, insulations=('external', 'liquid'))
    ext = co['insulation']['external']
    add(A, 'IEC 60071-2 G.2 (245 kV, 1000 m): U_rw κρουστικής, εξωτερική φάση–γη', 'το παράδειγμα του προτύπου: 884 kV', 884, ext['required']['li']['pe'], 1.0, 'kV')
    add(A, 'το ίδιο: U_rw χειρισμών, φάση–φάση', 'το παράδειγμα του προτύπου: 383 kV', 383, ext['required']['sd']['pp'], 1.0, 'kV')
    add(A, 'το ίδιο: η στάθμη που διαλέγεται (LIWV)', 'το παράδειγμα του προτύπου: 950 kV', 950, ext['level']['li'], 0, 'kV')
    z = I.protective_zone(1425, 800, 11000, 2, 400, 0.0025, 0.5 / 100 / 1000)
    add(A, 'IEC 60099-5 Πίν. 4 (420 kV, N = 2, R_t = 0,5 %/100 km/έτος): ζώνη προστασίας', 'ο πίνακας του προτύπου: 72 m', 72, z, 0.5, 'm')
    p, q = [23.7275, 37.9838], [22.9444, 40.6401]
    l1, f1, l2, f2 = map(math.radians, (p[0], p[1], q[0], q[1]))
    cos_law = G.R_EARTH * math.acos(math.sin(f1) * math.sin(f2) + math.cos(f1) * math.cos(f2) * math.cos(l2 - l1))
    add(A, 'απόσταση δύο σημείων στη σφαίρα (pcl.geo.haversine)', 'νόμος των συνημιτόνων στην ίδια σφαίρα', cos_law, G.haversine(p, q), 1e-6, 'km')
    add(A, 'Web Mercator, πλάτος 45°: y', 'R·asinh(tan φ), EPSG:3857', G.R_WM * math.asinh(1.0), G.mercator(0, 45)[1], 1e-3, 'm')


def v423_rows(add):
    """4.23: the numerical core of RMS dynamics (ROADMAP §71): the three-machine, nine-bus study of the reference book (the
    start, the reduced networks, the modes of the classical model, the eigenvalues of the two-axis model), the trapezoidal
    rule against SciPy on the reduced network, Arnoldi against QR, and the first swing against our EMT (tests/test_rms.py)."""
    import json
    import subprocess
    import numpy as np
    from scipy.integrate import solve_ivp
    from pcl import network as N
    from pcl import rms
    A = 'Δυναμική RMS και ευστάθεια μικρών διαταραχών (4.23)'
    keys = ('Xd', 'Xdp', 'Xq', 'Xqp', 'Td0p', 'Tq0p', 'Ra', 'H', 'D', 'Sn')
    base = {g: {k: v for k, v in d.items() if k in keys} for g, d in N.IEEE9_MACHINES.items()}
    wr = 2 * math.pi * 60
    s = rms.System(N.ieee9(), machines={g: {'model': 'classical', **d} for g, d in base.items()}, f=60)
    s.init()
    E = s.internal_emf()
    add(A, 'IEEE 9 ζυγών, κλασικό μοντέλο: |E′₂| από τη ροή φορτίου', 'βιβλίο αναφοράς, Παράδειγμα 2.6: 1,0502', 1.0502, abs(E['G2']), 1e-4, 'pu')
    add(A, 'το ίδιο: γωνία της E′₂', 'Παράδειγμα 2.6: 19,7315°', 19.7315, math.degrees(np.angle(E['G2'])), 1e-3, '°')
    Yp = s.reduced_y(events=[{'kind': 'trip', 'branch': 'br8', 'shunts': 'keep'}])
    add(A, 'ανηγμένος Y μετά την εκκαθάριση (η σειριακή αγωγιμότητα της 5–7 έξω): Y₁₁', 'Πίν. 2.6: 1,181 − j2,229', abs(1.181 - 2.229j), abs(Yp[0, 0]), 1.5e-3, 'pu')
    Ev, Y, H = np.array([E[k] for k in ('G1', 'G2', 'G3')]), s.reduced_y(), (23.64, 6.40, 3.01)
    Ps = lambda i, j: abs(Ev[i]) * abs(Ev[j]) * Y[i, j].imag * math.cos(np.angle(Ev[i]) - np.angle(Ev[j]))
    P12, P13, P23 = Ps(0, 1), Ps(0, 2), Ps(1, 2)
    a11, a12 = wr / 2 * (P12 / H[0] + P13 / H[0] + P13 / H[2]), wr / 2 * (P23 / H[2] - P12 / H[0])
    a21, a22 = wr / 2 * (P13 / H[2] - P12 / H[1]), wr / 2 * (P12 / H[1] + P23 / H[1] + P23 / H[2])
    w = sorted(np.sqrt(-np.roots([1, a11 + a22, a11 * a22 - a12 * a21])).real)
    add(A, 'κλασικό μοντέλο, οι δύο ταλαντώσεις (χωρίς τα G_ij, όπως το βιβλίο)', 'Παράδειγμα 3.2: 13,416 rad/s', 13.416, w[1], 2e-3, 'rad/s')
    add(A, 'το ίδιο: η δεύτερη', 'Παράδειγμα 3.2: 8,807 rad/s', 8.807, w[0], 2e-3, 'rad/s')
    m = {'G1': {'model': 'classical', **base['G1'], 'D': 1.0}}
    for g in ('G2', 'G3'):
        m[g] = {'model': 'two_axis', **base[g], 'Xqp': base[g]['Xdp'], 'D': 1.0}
    s2 = rms.System(N.ieee9(), machines=m, f=60)
    s2.init()
    lam = s2.eigen('qr')['lambda'] / wr
    for re, im in ((-0.002664, 0.034648), (-0.000622, 0.022984)):
        l = min(lam, key=lambda q: abs(q.real - re) + abs(abs(q.imag) - im))
        add(A, f'μοντέλο δύο αξόνων (G2, G3), D = 1: Im λ, χρόνος ανά μονάδα', f'§9.12 του βιβλίου: {im}'.replace('.', ','), im, abs(l.imag), 3e-6, '')
        add(A, f'το ίδιο: Re λ', f'§9.12: {re}'.replace('.', ','), re, l.real, 3e-6, '')
    # the trapezoidal rule against SciPy (DOP853) on the network reduced to the internal nodes, h = 1 ms
    tc = 5 / 60
    fault = [{'t': 0.0, 'kind': 'fault', 'bus': '8'}, {'t': tc, 'kind': 'clear', 'bus': '8'}, {'t': tc, 'kind': 'trip', 'branch': 'br8'}]
    Em, d0, Hh = np.abs(Ev), np.angle(Ev), np.array(H)
    Yf, Yc = s.reduced_y(events=fault[:1]), s.reduced_y(events=fault[2:])
    Pm = np.array([np.real(Ev[i] * np.conj(Y[i] @ Ev)) for i in range(3)])
    f = lambda t, z, Yx: np.r_[wr * (z[3:] - 1), (Pm - np.real(Em * np.exp(1j * z[:3]) * np.conj(Yx @ (Em * np.exp(1j * z[:3]))))) / (2 * Hh)]
    a = solve_ivp(f, [0, tc], np.r_[d0, 1, 1, 1], args=(Yf,), method='DOP853', rtol=1e-12, atol=1e-12)
    b = solve_ivp(f, [tc, 2.0], a.y[:, -1], args=(Yc,), method='DOP853', rtol=1e-12, atol=1e-12, dense_output=True)
    r = s.simulate(2.0, events=fault, h=0.001)
    ix = [s.state(k, 'delta') for k in ('G1', 'G2', 'G3')]
    k = r['t'] > tc + 1e-9
    add(A, 'σφάλμα 5 κύκλων, τραπεζοειδής h = 1 ms: μέγιστη διαφορά των γωνιών σε 2 s', 'SciPy DOP853 στο ανηγμένο δίκτυο (10⁻¹²)', 0.0, float(np.max(np.abs(r['x'][k][:, ix].T - b.sol(r['t'][k])[:3]))), 4e-5, 'rad')
    q = rms.System(N.ieee(118))
    q.init()
    sig = 2j * math.pi * 1.2
    near = sorted(q.eigen('qr')['lambda'], key=lambda l: abs(l - sig))[:6]
    ar = q.eigen('arnoldi', sigma=sig, k=6)['lambda']
    add(A, 'IEEE 118, 54 μηχανές δύο αξόνων: Arnoldi με μετατόπιση γύρω από 1,2 Hz', 'QR σε όλο τον πίνακα A', 0.0, max(min(abs(l - n) for n in near) for l in ar), 1e-8, 'rad/s')
    js = json.loads(subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'rms_emt_cases.js'), '2.1'], capture_output=True, text=True, timeout=900, cwd=ROOT).stdout)
    te, De = np.array(js['t']), np.degrees(np.unwrap(np.radians(np.array(js['d'])), axis=0))
    ev = [{'t': 0.1, 'kind': 'fault', 'bus': '8'}, {'t': 0.183333, 'kind': 'clear', 'bus': '8'}, {'t': 0.183333, 'kind': 'trip', 'branch': 'br8'}]
    r = s.simulate(2.1, events=ev, h=0.0005)
    Dr = np.degrees(r['x'][:, ix])
    add(A, 'το ίδιο σφάλμα: η πρώτη ταλάντωση του δ₂₁', 'το EMT του ieee9_emt (στάτης και δίκτυο με τα μεταβατικά τους)', float(np.max((De[:, 1] - De[:, 0]) - (De[0, 1] - De[0, 0]))),
        float(np.max((Dr[:, 1] - Dr[:, 0]) - (Dr[0, 1] - Dr[0, 0]))), 3.0, '°')


def v424_rows(add):
    """4.24: the network split in subnetworks at its lines and multirate (THEORY §8Ι.7): the wave at the open end of a
    line split in two groups, and in multirate_lines without losses the fast area (1 μs) and a slow one (15 μs) against
    closed forms, up to the return of the first reflection (tests/js/split_ref.js, tests/test_split.py). And the option
    «Ουδέτερος» of the three-phase parts: a line-to-earth fault with Z_n against IEC 60909-0 (tests/js/neut_cases.js)."""
    import json
    import subprocess
    import numpy as np
    from scipy.linalg import expm
    A = 'Υποδίκτυα και πολλαπλοί ρυθμοί (4.24)'
    r = json.loads(subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'split_ref.js')], capture_output=True, text=True, timeout=900, cwd=ROOT).stdout)
    t, v = np.array(r['twave']['t']), np.array(r['twave']['v'])
    k = (t > 12e-6) & (t < 25e-6)
    add(A, 'γραμμή 3 km σε δύο υποδίκτυα, βηματική 100 kV: τάση στο ανοιχτό άκρο (τ < t < 3τ)', 'ανάκλαση με Γ = +1: 2U', 200e3, float(np.min(v[k])), 1.0, 'V')
    m = r['mr']
    C, L3, R3, Rl = 1e-6, 25e-6, 1.0, 200.0   # the fast area sees the two lines as Z_c/2 until the first reflection returns
    Af = np.array([[-1 / (Rl * C), -1 / C], [1 / L3, -R3 / L3]])
    tc, vc = np.array(m['vC']['t']), np.array(m['vC']['v'])
    ex = np.array([(expm(Af * x) @ np.array([1.0, 0.0]))[0] for x in tc])
    add(A, 'πολλαπλοί ρυθμοί, γρήγορη περιοχή (1 μs): τάση του πυκνωτή ως 0,95 ms, μέγιστη διαφορά', 'κλειστή μορφή: C ∥ (R₃ + L₃) ∥ Z_c/2', 0.0, float(np.max(np.abs(vc - ex))), 0.035, 'V')
    R, L, w = 1 + 200.0, 25e-3, 2 * math.pi * 60
    tl, il = np.array(m['iL1']['t']), np.array(m['iL1']['v'])
    Z, phi = math.hypot(R, w * L), math.atan2(w * L, R)
    ie = (np.sin(w * tl - phi) + math.sin(phi) * np.exp(-tl * R / L)) / Z
    add(A, 'πολλαπλοί ρυθμοί, αργή περιοχή 1 (15 μs): ρεύμα του L₁ ως 0,48 ms, μέγιστη διαφορά', 'κλειστή μορφή: πηγή, R₁ + L₁ και Z_c/2 σε σειρά', 0.0, float(np.max(np.abs(il - ie))), 5e-6, 'A')

    # the option «Ουδέτερος» (decisions 208, 345): a line-to-earth fault at a network equivalent with R_n + jX_n at its
    # star point, against the symmetrical components of IEC 60909-0: I″k1 = 3E/|2Z₁ + Z₀ + 3Z_n| (tests/js/neut_cases.js)
    q = json.loads(subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'neut_cases.js')], capture_output=True, text=True, timeout=900, cwd=ROOT).stdout)
    Un, Sk, XR, ZZ, XR0, cf = 20e3, 500e6, 10.0, 1.5, 5.0, 1.1
    Z1 = cf * Un * Un / Sk
    z1 = complex(Z1 / math.sqrt(1 + XR * XR), Z1 * XR / math.sqrt(1 + XR * XR))
    z0 = complex(ZZ * Z1 / math.sqrt(1 + XR0 * XR0), ZZ * Z1 * XR0 / math.sqrt(1 + XR0 * XR0))
    E = cf * Un / math.sqrt(3)
    Ik1 = 3 * E / abs(2 * z1 + z0 + 3 * complex(10, 20) + 3e-4)
    add(A, 'ουδέτερος μέσω R_n + jX_n = 10 + j20 Ω: ρεύμα μονοφασικού σφάλματος I″k1 (ενεργός τιμή)', 'I″k1 = 3E/|2Z₁ + Z₀ + 3Z_n| (IEC 60909-0)', Ik1, q['grid']['z']['sim'], 0.5, 'A')

def v50_rows(add):
    """5.0: the study folder (THEORY §8ΩΕ, decision 344): a run from Python written to the folder against its Result, a
    plot file of the EMTP and the output of PSCAD written here by their documented formats and read back, and the
    automatic record of decision 343.4 (the numbers of a channel that is not recorded, against every channel recorded)."""
    import json
    import struct
    import subprocess
    import tempfile
    import numpy as np
    from pathlib import Path
    from engine import studyfolder as sf
    import pcl
    A = 'Φάκελος μελέτης (5.0)'
    with tempfile.TemporaryDirectory() as d:
        os.environ['PCL_HOME'] = d
        r = pcl.tutorial('buck').run(t_end=2e-4, folder=str(Path(d) / 'μελέτη'))
        t, col, get = sf.source(r.meta['folder']['path']).arrays()
        add(A, 'buck από την Python, i_L1 στα 0,2 ms από τον φάκελο', 'το Result του ίδιου τρεξίματος', float(r['I:L1'][-1]), float(get(col['I:L1'])[-1]), 0.0, 'A')
        tt = np.linspace(0, 1e-3, 201)
        (Path(d) / 'casem.m').write_text("filn='case.mda';\nt=1;\nprecision='float64';\nn_scopes=3;\nNvn='BUS1';\nNvn=strvcat(Nvn,'BUS2');\nvn=2:1:3;\n", encoding='latin-1')
        with open(Path(d) / 'case.mda', 'wb') as f:
            for x in tt:
                f.write(struct.pack('<i', 24) + np.array([x, math.sin(2e4 * x), math.cos(2e4 * x)], '<f8').tobytes() + struct.pack('<i', 24))
        e = sf.source(str(Path(d) / 'casem.m'))
        _, ce, ge = e.arrays()
        add(A, 'αρχείο του EMTP (<όνομα>m.m και .mda): BUS2 στο 1 ms', 'η τιμή που γράφτηκε σε εγγραφές Fortran', math.cos(2e4 * 1e-3), float(ge(ce['vn:BUS2'])[-1]), 0.0, 'V')
        (Path(d) / 'pr.inf').write_text('\n'.join(f'PGB({k})  Output  Desc="c{k}"  Group="Main"  Max=1  Min=-1  Units="kV"' for k in range(1, 13)), encoding='latin-1')
        for n, ks in ((1, range(1, 11)), (2, range(11, 13))):
            (Path(d) / f'pr_{n:02d}.out').write_text(' Project\n' + '\n'.join(' '.join(repr(float(v)) for v in [x] + [k * x for k in ks]) for x in tt), encoding='latin-1')
        q = sf.source(str(Path(d) / 'pr.inf'))
        _, cq, gq = q.arrays()
        add(A, 'έξοδος του PSCAD (.inf και δύο .out): κανάλι 12 στο 1 ms', 'η τιμή που γράφτηκε (στήλη 2 του δεύτερου αρχείου)', 12e-3, float(gq(cq['PGB12:c12'])[-1]), 1e-15, 'kV')
        os.environ.pop('PCL_HOME', None)
    s = json.loads(subprocess.run(['node', '--max-old-space-size=6000', str(ROOT / 'tests' / 'js' / 'folder_cases.js')], capture_output=True, text=True, timeout=1800, cwd=ROOT).stdout)
    add(A, f'big_grid (1038 κανάλια), «Αυτόματα» (343.4): {s["ref"]["key"]} μετά από 40 βήματα, χωρίς καταγραφή', 'το ίδιο με όλα τα κανάλια καταγραμμένα', s['ref']['all'], s['ref']['auto'], 0.0, 'A')


def v501_rows(add):
    """5.0.1: the saturable core (THEORY §8ΩΖ, tests/js/sat_cases.js): the nonlinear inductor across an ideal source and
    behind R against closed forms, the open-circuit test in rms values to the curve and back, and a core that never reaches
    its knee against the linear L_m."""
    import json
    import subprocess
    import numpy as np
    from scipy.optimize import brentq
    A = 'Κορεσμός στους μετασχηματιστές (5.0.1)'
    o = json.loads(subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'sat_cases.js')], capture_output=True, text=True, timeout=1800, cwd=ROOT).stdout)
    q = o['ideal']
    r = [x for x in q['runs'] if x['psi0'] == 0.25 and x['h'] == 1e-5][0]
    add(A, 'μη γραμμικό πηνίο σε ιδανική πηγή, ψ₀ = 0,25 V·s, βήμα 10 μs: ροή στο T/2', 'ψ₀ + 2V/ω', 0.25 + 2 * q['V'] / q['w'], r['psi'], 1e-5, 'V·s')
    q = o['rl']
    V, R, w, I1, F1, L1 = q['V'], q['R'], 2 * math.pi * q['f'], q['I1'], q['F1'], q['Lair']

    def seg(L, t0, i0):
        Z, ph = math.hypot(R, w * L), math.atan2(w * L, R)
        c = i0 - V / Z * math.sin(w * t0 - ph)
        return (lambda t: V / Z * math.sin(w * t - ph) + c * math.exp(-R * (t - t0) / L),
                lambda t: V / Z * w * math.cos(w * t - ph) - c * R / L * math.exp(-R * (t - t0) / L))
    i0, _ = seg(F1 / I1, 0.0, 0.0)
    ts = np.linspace(0, 0.02, 20001)
    k = next(j for j, t in enumerate(ts) if i0(t) >= I1)
    t1 = brentq(lambda t: i0(t) - I1, ts[k - 1], ts[k], xtol=1e-15)
    i1, d1 = seg(L1, t1, I1)
    ts = np.linspace(t1, t1 + 0.01, 100001)
    k = int(np.argmax([i1(t) for t in ts]))
    tp = brentq(d1, ts[max(k - 1, 0)], ts[min(k + 1, len(ts) - 1)], xtol=1e-15)
    add(A, 'μη γραμμικό πηνίο (δύο κλίσεις) πίσω από R, ζεύξη στο v = 0: η πρώτη κορυφή του ρεύματος', 'κλειστή μορφή ανά τμήμα', i1(tp), q['peak'], 1e-3, 'A')
    q = o['rms']
    e = max(abs(b[0] - a[0]) / a[0] for a, b in zip(q['pts'], q['back']))
    add(A, 'δοκιμή κενού: καμπύλη πέντε σημείων → rms → καμπύλη, μέγιστη σχετική διαφορά των ρευμάτων', 'η αρχική καμπύλη', 0.0, e, 1e-9, '')
    e = max(x for _, x in o['linear'])
    add(A, 'μετασχηματιστής με γόνατο που δεν το φτάνει: μέγιστη διαφορά ως προς το μέγιστο κάθε καναλιού', 'γραμμική L_m', 0.0, e, 1e-12, '')
    # decision 355: the line without distortion and the CP line from data per mode (tests/js/cp_cases.js)
    c = json.loads(subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'cp_cases.js')], capture_output=True, text=True, timeout=900, cwd=ROOT).stdout)
    q = c['dl']
    add(A, 'γραμμή χωρίς παραμόρφωση (Z = 300 Ω, 30 km, R′ = 0,01 Ω/m), προσαρμοσμένη πηγή 1 kV, ανοιχτό άκρο: τάση στο (τ, 3τ)', 'att·V, att = e^(−R/2Z)', q['att'] * q['V'], q['rec'][0], 1e-3, 'V')
    q = c['zero']
    add(A, 'CP με δεδομένα ανά ρυθμό, τριφασική με συνεχή μετάθεση, χωρίς παραμόρφωση: ίσες τάσεις 1 kV μέσω Z_c0, τάση του άκρου μετά το τ₀', 'att₀·V (μόνο ο ρυθμός γης)', q['att'] * q['V'], q['rec'][0][0], 2e-3, 'V')


def v503_rows(add):
    """5.0.3: the equivalent of the rest of the network at the fundamental (pcl/equivalent.py, THEORY §8ΩΗ, tests/test_equivalent.py):
    the base case of the full network at the kept buses, the branch of the Kron reduction against an independent
    implementation (pandapower 3.5.6, grid_equivalents, on its case9), the Norton current against the full solution."""
    import numpy as np
    from pcl import network as N
    from pcl import equivalent as Q
    A = 'Ισοδύναμο του δικτύου στα 50 Hz (5.0.3)'
    for case, B, I, lab in ((14, ['6', '7', '9'], None, 'IEEE 14, ζυγοί συνόρου 6, 7, 9 (ο ζυγός ταλάντωσης έξω)'), (30, ['4', '6', '28'], ['1'], 'IEEE 30, ζυγοί συνόρου 4, 6, 28')):
        net = N.ieee(case)
        lf = net.power_flow(tol=1e-12)
        for kind, kl in (('ward', 'Ward'), ('xward', 'extended Ward')):
            eq = net.equivalent(B, I, kind=kind, lf=lf, tol=1e-12)
            r = eq['net'].power_flow(tol=1e-12)
            err = max(abs(Q._v(r, k) - Q._v(lf, k)) for k in eq['internal'] + eq['boundary'])
            add(A, f'{kl}, {lab}: μέγιστο |ΔV| στους κρατημένους ζυγούς στο βασικό σημείο', 'το πλήρες δίκτυο', 0.0, err, 1e-9, 'pu')
    net = N.ieee(9)
    eq = net.equivalent(['5', '9'], ['1'], kind='ward', tol=1e-12)
    z = 1 / (-eq['Y'][0, 1])
    add(A, 'Ward του IEEE 9 με ζυγούς συνόρου 5, 9: ο κλάδος ανάμεσά τους, r', 'pandapower 3.5.6 (grid_equivalents)', 0.076758735506354, z.real, 1e-12, '')
    add(A, 'το ίδιο: x', 'pandapower 3.5.6 (grid_equivalents)', 0.4658190326112427, z.imag, 1e-12, '')
    net = N.ieee(14)
    lf = net.power_flow(tol=1e-12)
    eq = net.equivalent(['4', '5'], ['1'], kind='norton', lf=lf, tol=1e-12)
    names, idx, Y = Q._ymat(net)
    V = np.array([Q._v(lf, b) for b in names])
    rn, ridx, Yr = Q._ymat(Q._retained(net, eq['external']))
    Vr = np.array([Q._v(lf, b) for b in rn])
    Iext = (Y @ V)[[idx[b] for b in eq['boundary']]] - (Yr @ Vr)[[ridx[b] for b in eq['boundary']]]
    VB = V[[idx[b] for b in eq['boundary']]]
    add(A, 'Norton του IEEE 14 στους ζυγούς 4, 5: |Y_eq·V_B − I_eq − I_B| (το ρεύμα προς το εξωτερικό δίκτυο)', 'η λύση του πλήρους δικτύου', 0.0, float(np.max(np.abs(eq['Y'] @ VB - eq['I'] - Iext))), 1e-10, 'pu')
    add(A, 'το ίδιο με τις μηχανές (γεννήτριες πίσω από x″d, φορτία ως αγωγιμότητες): |Y_m·V_B − I_m − I_B|', 'η λύση του πλήρους δικτύου', 0.0, float(np.max(np.abs(eq['Ym'] @ VB - eq['Im'] - Iext))), 1e-10, 'pu')
    # for the short circuit: the sequence networks of IEC 60909-0 reduced to the boundary
    sys.path.insert(0, str(ROOT / 'tests'))
    from test_network import tr60909_4, IK, IK1
    net = tr60909_4()
    worst = 0.0
    for mode in ('max', 'min'):
        red = net.equivalent(['2', '5'], ['3'], kind='sc', mode=mode)['net']
        for f in ('3ph', '2ph', '1ph', '2phE'):
            for b in '2345':
                a = net.short_circuit(b, fault=f, mode=mode)['Ik']
                worst = max(worst, abs(red.short_circuit(b, fault=f, mode=mode)['Ik'] - a) / a)
    add(A, 'για το βραχυκύκλωμα, δίκτυο δοκιμής του IEC TR 60909-4 με ζυγούς συνόρου 2, 5: μέγιστη σχετική διαφορά του I″k στους ζυγούς 2–5 (τέσσερα είδη σφάλματος, max και min)', 'το πλήρες δίκτυο (IEC 60909-0)', 0.0, worst, 1e-12, '')
    red = net.equivalent(['2', '5'], ['3'], kind='sc')['net']
    add(A, 'το ίδιο: I″k τριφασικό στον ζυγό 3 με το μειωμένο δίκτυο', 'IEC TR 60909-4, Πίνακας 22', IK[2] * 1e3, red.short_circuit('3')['Ik'], IK[2] * 1e3 * 2e-4, 'A')
    add(A, 'το ίδιο: I″k1 μονοφασικό ως προς τη γη στον ζυγό 3 με το μειωμένο δίκτυο', 'IEC TR 60909-4, Πίνακας 23', IK1[1] * 1e3, red.short_circuit('3', fault='1ph')['Ik'], IK1[1] * 1e3 * 2e-4, 'A')



def v504_rows(add):
    """5.0.4: the equivalent in EMT after CIGRE TB 39, Fig. 15 (pcl.equivalent.emt_ports, the part EQV3, THEORY §8ΩΘ,
    tests/test_equivalent.py): the current at the boundary against the full load flow, one port against GRID3, the start of the
    area in the load flow, a fault in the area against the whole network in EMT (the tutorial ieee9_eq)."""
    import json
    import subprocess
    import numpy as np
    import pcl
    from pcl import network as N
    from pcl import equivalent as Q
    A = 'Ισοδύναμο του δικτύου σε EMT (5.0.4)'
    worst = 0.0
    for case, B, I in ((9, ['5', '9'], ['1']), (14, ['6', '7', '9'], None), (30, ['9', '10', '12', '27'], None)):
        net = N.ieee(case)
        lf = net.load_flow()
        names, idx, Y = Q._ext_y(net, lf, Q.split(net, B, I)[2], None, 1)
        V = np.array([Q._v(lf, b) for b in names])
        for fig in Q.FIGS:
            q = Q.emt_ports(net, B, I, lf=lf, fig=fig)
            worst = max(worst, float(np.max(np.abs(q['I'] + Y[[idx[b] for b in B]] @ V))))
    add(A, 'IEEE 9, 14, 30, τρία κυκλώματα (Σχ. 15 στη θεμελιώδη, 15b, 15c): |I_B| του ισοδυνάμου απέναντι στο ρεύμα των εξωτερικών στοιχείων', 'η ροή φορτίου του πλήρους δικτύου', 0.0, worst, 1e-10, 'pu')
    net = N.ieee(9)
    q = Q.emt_ports(net, ['5', '9'], ['1'], fig='15b')
    e = next(x for x in net.elements if x['kind'] == 'branch' and x['a'] == '5' and x['b'] == '6')
    add(A, 'IEEE 9 (345 kV), σύνορο 5, 9: R_s στον ζυγό 5 (μία εξωτερική γραμμή, 5–6)', 'κυματική αντίσταση χωρίς απώλειες √(x/b)·Z_b', float(np.sqrt(e['x'] / e['bc']) * 345e3 ** 2 / 100e6), q['Rs'][0], 1e-9, 'Ω')
    Un, Sb, E, ang = 150e3, 100e6, 1.05, 20.0
    z1, z0 = complex(0.004, 0.05), complex(0.012, 0.16)
    zb = Un * Un / Sb

    def C(cid, typ, params):
        return {'id': cid, 'type': typ, 'x': 0, 'y': 0, 'rot': 0, 'flip': False, 'label': cid, 'params': params}
    src = {'EQV3': C('S', 'EQV3', {'Un': repr(Un), 'Sb': Sb, 'E': repr(E), 'ang': repr(ang), 'R1': repr(z1.real), 'X1': repr(z1.imag), 'R0': repr(z0.real), 'X0': repr(z0.imag), 'conn': 'bus'}),
           'GRID3': C('S', 'GRID3', {'Un': Un, 'phase': ang, 'cf': E, 'emf': 'c', 'Sk': E * Un * Un / (abs(z1) * zb), 'XR': z1.imag / z1.real, 'z0': 'ratio',
                                     'Z0Z1': abs(z0) / abs(z1), 'XR0': z0.imag / z0.real, 'conn': 'bus'})}
    out = {}
    for t, c in src.items():
        pr = {'version': 4, 'components': [c, C('J', 'JUNC', {}), C('F1', 'FLT3', {'kind': 'ag', 'ton': 0.012, 'conn': 'bus'})],
              'wires': [{'id': 'w1', 'a': {'c': 'S', 'p': 'abc1' if t == 'EQV3' else 'abc'}, 'b': {'c': 'J', 'p': 'j'}, 'pts': []},
                        {'id': 'w2', 'a': {'c': 'F1', 'p': 'abc'}, 'b': {'c': 'J', 'p': 'j'}, 'pts': []}]}
        out[t] = np.array(pcl.Project(pr).run(0.05, channels=['Y:F1/Ia'], hdiv=400)['Y:F1/Ia'])
    add(A, 'μία θύρα του EQV3: ρεύμα μονοφασικού σφάλματος, μέγιστη διαφορά ως μέρος της κορυφής', 'GRID3 με τα ίδια E, Z₁, Z₀', 0.0, float(np.max(np.abs(out['EQV3'] - out['GRID3'])) / np.max(np.abs(out['GRID3']))), 1e-12, '')
    lf = net.load_flow()
    r = pcl.Project(net.to_emt(lf, machines=N.IEEE9_MACHINES, boundary=['5', '9'], internal=['1'])).run(0.1, channels=['Y:G1:pe'])
    add(A, 'IEEE 9, η περιοχή {1, 4} με το ισοδύναμο στους ζυγούς 5, 9: P της γεννήτριας 1 στα 0,1 s', 'η ροή φορτίου', lf['buses']['1']['P'] / 100e6, r['Y:G1:pe'][-1], 1e-4, 'pu')
    W = ROOT / 'web' / 'studio'
    js = ("global.window=globalThis;global.Parts=require(%r);require(%r);require(%r);const t=Tutorials.get('ieee9_eq'),a=JSON.parse(process.argv[1]),o={};"
          "for(const q of t.options)o[q.k]=a[q.k]??q.def;process.stdout.write(JSON.stringify(t.build(o)));") % (str(W / 'parts.js'), str(W / 'netlib.js'), str(W / 'tutorials.js'))
    for kind, kl in (('abcg', 'τριφασικό'), ('ag', 'μονοφασικό')):
        pr = json.loads(subprocess.run(['node', '-e', js, json.dumps({'net': 'eq', 'fig': '50', 'fault': kind})], capture_output=True, text=True, check=True).stdout)
        ref = pr['meta']['eq']['ref'][kind]
        r = pcl.Project(pr).run(0.1, channels=['Y:F1/Ia'])
        t, y = np.array(r.t), np.array(r['Y:F1/Ia'])
        pk = float(np.abs(y[(t > 0.05) & (t <= 0.05 + 1 / 60)]).max())
        add(A, f'ieee9_eq, {kl} σφάλμα στον ζυγό 4, ισοδύναμο στη θεμελιώδη: πρώτη κορυφή του i_a', 'όλο το δίκτυο σε EMT (2 %)', ref['pk'], pk, 0.02 * ref['pk'], 'A')

def v506_rows(add):
    """5.0.6: the study area chosen in the diagram (pcl.equivalent.area, pcl.study.area, tests/test_equivalent.py): the boundary
    of the chosen buses against the split of a given boundary, the base case of the full network against the area with the
    equivalent, and the circuit in EMT the page asks for against Network.to_emt with the same boundary."""
    import json
    from pcl import network as N
    from pcl import equivalent as Q
    from pcl import study as S
    A = 'Η περιοχή της μελέτης από το διάγραμμα (5.0.6)'
    net = N.ieee(9)
    diff = sum(a != b for a, b in zip(Q.area(net, ['1', '4', '5', '9']), Q.split(net, ['5', '9'], ['1'])))
    n30 = N.ieee(30)
    I, B, E = Q.split(n30, ['4', '6', '28'], ['1'])
    diff += sum(a != b for a, b in zip(Q.area(n30, I + B), (I, B, E)))
    add(A, 'IEEE 9 (ζυγοί 1, 4, 5, 9) και IEEE 30 (η περιοχή του GUIDE §41): εσωτερικοί, σύνορο, εξωτερικοί που διαφέρουν', 'το split του συνόρου 5, 9 και 4, 6, 28', 0, diff, 0, '')
    c = S.area({'case': 'ieee9', 'buses': ['1', '4', '5', '9'], 'what': 'compare'})
    add(A, 'IEEE 9, περιοχή 1, 4, 5, 9 με extended Ward: η μεγαλύτερη διαφορά |V| στο βασικό σημείο', 'το πλήρες δίκτυο', 0.0, c['compare']['base']['dV'], 1e-9, 'pu')
    e = S.area({'case': 'ieee9', 'buses': ['1', '4', '5', '9'], 'what': 'emt', 'fig': '15b'})
    pr = S._clean(net.to_emt(machines=N.IEEE9_MACHINES, boundary=['5', '9'], internal=['1', '4'], fig='15b'))
    add(A, 'το κύκλωμα της περιοχής σε EMT (15b) που ζητά η σελίδα: στοιχεία που διαφέρουν', 'Network.to_emt με το ίδιο σύνορο', 0,
        sum(json.dumps(a, sort_keys=True) != json.dumps(b, sort_keys=True) for a, b in zip(e['project']['components'], pr['components'])) + abs(len(e['project']['components']) - len(pr['components'])), 0, '')


def v511_rows(add):
    """5.0.11: the common model, step 1 (pcl.model, web/studio/model.js, tests/test_model.py): the load flow of a drawing against
    the load flow of the network it was written from, and against the EMT start of the same drawing (mna.js acInit, with the
    reactances at the ω_e of the trapezoidal rule); IEC 60909-0 of a drawing against the phase-domain solution of netlib.js."""
    import json
    import math
    import subprocess
    import tempfile
    from pcl import network as N
    from pcl import model as M
    A = 'Το κοινό μοντέλο: ροή φορτίου και IEC 60909-0 από το σχέδιο (5.0.11)'
    js = str(Path(__file__).resolve().parents[1] / 'tests' / 'js' / 'model_cases.js')
    node = lambda *a: json.loads(subprocess.run(['node', js, *a], capture_output=True, text=True, timeout=600, check=True).stdout)   # noqa: E731
    net = N.ieee(9)
    lf = net.load_flow()
    pr = net.to_emt(lf=lf)
    m = M.of(pr)
    r = M.load_flow(m)
    add(A, 'IEEE 9 γραμμένο ως σχέδιο (to_emt): |V| των ζυγών από το σχέδιο, η μεγαλύτερη διαφορά', 'η ροή φορτίου του δικτύου', 0.0,
        max(abs(r['buses']['B' + b]['V'] - v['V']) for b, v in lf['buses'].items()), 1e-10, 'pu')
    with tempfile.TemporaryDirectory() as d:
        f = Path(d) / 'p.json'
        f.write_text(json.dumps(pr), encoding='utf-8')
        o = node('start', str(f))
    w = 2 * math.pi * o['f']
    re = M.load_flow(m, fe=(2 / o['h'] * math.tan(w * o['h'] / 2)) / (2 * math.pi))
    dv = 0.0
    for c in pr['components']:
        if c['type'] == 'LOAD3':
            v0, v1 = o['v'][c['id']]
            V = abs(complex(v0, -v1)) / math.sqrt(2) / (c['params']['Un'] / math.sqrt(3))
            b = next(b['id'] for b in m['buses'] if [c['id'], 'abc'] in b['at'])
            dv = max(dv, abs(re['buses'][b]['V'] - V))
    add(A, 'το ίδιο σχέδιο: |V| των φορτίων, η μεγαλύτερη διαφορά (με τις αντιδράσεις στο ω_e)', 'η αρχή του EMT (acInit)', 0.0, dv, 1e-6, 'pu')
    q = node('faults')
    for e in q['model']['elements']:
        if e['type'] == 'FLT3':
            e['params']['kind'] = 'ag'
    s = M.short_circuit(q['model'], '1ph')
    add(A, 'σφάλμα a–γη στο σχέδιο «Βραχυκύκλωμα σε δίκτυο»: I″k1', 'λύση στις φάσεις (netlib.js)', q['cur']['ag']['a'] / 1e3,
        next(iter(s['faults'].values()))['Ik'] / 1e3, 2e-4 * q['cur']['ag']['a'] / 1e3, 'kA')


def v512_rows(add):
    """5.0.12: the common model, step 2 (pcl.model, web/studio/model.js, tests/test_model.py): the equivalent of the tutorial
    «ieee9_eq» against the load flow of the network it stands for, an EQV3 with ports at two levels and a line from geometry
    against the EMT start of the same drawing, and a station inside a subcircuit against the same station drawn flat."""
    import cmath
    import json
    import math
    import subprocess
    import tempfile
    from pcl import model as M
    A = 'Το κοινό μοντέλο: υποκυκλώματα, γραμμές από γεωμετρία, ισοδύναμα (5.0.12)'
    js = str(Path(__file__).resolve().parents[1] / 'tests' / 'js' / 'model_cases.js')
    node = lambda *a: json.loads(subprocess.run(['node', js, *a], capture_output=True, text=True, timeout=600, check=True).stdout)   # noqa: E731

    def on(what, pr):
        with tempfile.TemporaryDirectory() as d:
            f = Path(d) / 'p.json'
            f.write_text(json.dumps(pr), encoding='utf-8')
            return node(what, str(f))

    def start(pr):
        """The largest difference of |V| and θ (pu, rad) of the loads, the load flow at ω_e against the EMT start."""
        o, m = on('start', pr), on('model', pr)
        w = 2 * math.pi * o['f']
        r = M.load_flow(m, fe=(2 / o['h'] * math.tan(w * o['h'] / 2)) / (2 * math.pi))
        worst = 0.0
        for e in m['elements']:
            if e['type'] == 'LOAD3' and None not in o['v'][e['id']]:
                ph = complex(o['v'][e['id']][0], -o['v'][e['id']][1])
                q = r['buses'][e['buses'][0]]
                worst = max(worst, abs(q['V'] - abs(ph) / math.sqrt(2) / (e['params']['Un'] / math.sqrt(3))),
                            abs((q['angle'] - math.degrees(cmath.phase(ph)) - 90 + 180) % 360 - 180) * math.pi / 180)
        return worst
    eq = M.load_flow(on('model', node('build', 'ieee9_eq', '{"fault": "none"}')))
    full = M.load_flow(on('model', node('build', 'ieee9_eq', '{"net": "full", "fault": "none"}')))
    add(A, 'IEEE 9 με το υπόλοιπο δίκτυο ως EQV3 στους ζυγούς 5 και 9 (Σχ. 50): |V| των ζυγών του σχεδίου, η μεγαλύτερη διαφορά',
        'η ροή φορτίου όλου του δικτύου', 0.0, max(abs(v['V'] - full['buses'][b]['V']) for b, v in eq['buses'].items()), 1e-8, 'pu')
    C = lambda i, t, p: {'id': i, 'type': t, 'x': 0, 'y': 0, 'rot': 0, 'flip': False, 'label': i, 'params': {**p, 'conn': 'bus'}}   # noqa: E731
    W = lambda k, a, b: {'id': f'w{k}', 'a': {'c': a[0], 'p': a[1]}, 'b': {'c': b[0], 'p': b[1]}, 'pts': []}                          # noqa: E731
    p = {'Un': '150e3; 20e3', 'Sb': 100e6, 'E': '1.05; 1.02', 'ang': '0; -3', 'R1': '0.004, 0.001; 0.001, 0.006', 'X1': '0.08, 0.03; 0.03, 0.12',
         'R0': '0.008, 0.002; 0.002, 0.01', 'X0': '0.2, 0.05; 0.05, 0.3'}
    pr = {'version': 4, 'solve': {'init': 'ac'}, 'sim': {'hDiv': 400},
          'components': [C('EQ', 'EQV3', p), C('A', 'JUNC', {}), C('B', 'JUNC', {}), C('LA', 'LOAD3', {'Un': 150e3, 'P': 60e6, 'Q': 20e6}),
                         C('LB', 'LOAD3', {'Un': 20e3, 'P': 15e6, 'Q': 5e6})],
          'wires': [W(1, ('EQ', 'abc1'), ('A', 'j')), W(2, ('EQ', 'abc2'), ('B', 'j')), W(3, ('LA', 'abc'), ('A', 'j')), W(4, ('LB', 'abc'), ('B', 'j'))]}
    add(A, 'EQV3 με θύρες στα 150 kV και στα 20 kV, συζευγμένες: |V| και θ των φορτίων (στο ω_e)', 'η αρχή του EMT (acInit)', 0.0, start(pr), 1e-6, 'pu, rad')
    tl = {'src': 'modal', 'nph': 3, 'mlen': 100, 'lu': 'km', 'mspec': 'zv', 'transp': '1', 'mdata': '0.25, 650, 2.2e5; 0.03, 280, 2.95e5'}
    pr = {'version': 4, 'solve': {'init': 'ac'}, 'sim': {'hDiv': 400},
          'components': [C('NET', 'GRID3', {'Un': 400e3, 'Sk': 10e9, 'XR': 12, 'phase': 5}), C('B1', 'JUNC', {}), C('LN', 'TLM', tl), C('B2', 'JUNC', {}),
                         C('LD', 'LOAD3', {'Un': 400e3, 'P': 400e6, 'Q': 100e6})],
          'wires': [W(1, ('NET', 'abc'), ('B1', 'j')), W(2, ('LN', 'abc1'), ('B1', 'j')), W(3, ('LN', 'abc2'), ('B2', 'j')), W(4, ('LD', 'abc'), ('B2', 'j'))]}
    add(A, 'TLM 100 km από δεδομένα ανά ρυθμό (CP, R/4 – R/2 – R/4): |V| και θ του φορτίου, το ακριβές π στη θεμελιώδη (h = T/400)',
        'η αρχή του EMT (acInit)', 0.0, start(pr), 3e-5, 'pu, rad')
    U1, U2 = 150e3, 20e3
    tr = C('TR', 'XF3', {'grp': 'Dyn11', 'Sn': 40e6, 'U1': U1, 'U2': U2, 'uk': 11, 'Pk': 150e3, 'i0': 1.0, 'P0': 30e3, 'tap': 2.5, 'xs1': 70})
    ld = C('LD1', 'LOAD3', {'Un': U2, 'P': 20e6, 'Q': 8e6})
    top = [C('NET', 'GRID3', {'Un': U1, 'Sk': 3e9, 'XR': 12, 'phase': 10}), C('B1', 'JUNC', {})]
    flat = {'version': 4, 'components': top + [tr, C('B2', 'JUNC', {}), ld],
            'wires': [W(1, ('NET', 'abc'), ('B1', 'j')), W(2, ('TR', 'abc1'), ('B1', 'j')), W(3, ('TR', 'abc2'), ('B2', 'j')), W(4, ('LD1', 'abc'), ('B2', 'j'))]}
    port = {'id': 'P1', 'type': 'PORT', 'x': 0, 'y': 0, 'rot': 0, 'flip': False, 'label': 'P1', 'params': {'name': 'hv', 'width': 3}}
    sub = {'version': 4, 'components': top + [{'id': 'X1', 'type': 'SUB', 'x': 0, 'y': 0, 'rot': 0, 'flip': False, 'label': 'X1', 'params': {'def': 'stn'}}],
           'wires': [W(1, ('NET', 'abc'), ('B1', 'j')), W(2, ('X1', 'hv'), ('B1', 'j'))],
           'subcircuits': {'stn': {'components': [port, tr, C('B2', 'JUNC', {}), ld],
                                   'wires': [W(1, ('P1', 'p'), ('TR', 'abc1')), W(2, ('TR', 'abc2'), ('B2', 'j')), W(3, ('LD1', 'abc'), ('B2', 'j'))]}}}
    a, b = M.load_flow(on('model', flat)), M.load_flow(on('model', sub))
    add(A, 'ένας υποσταθμός (XF3 και φορτίο) μέσα σε υποκύκλωμα: |V| του ζυγού X1/B2', 'το ίδιο σχέδιο χωρίς υποκύκλωμα (B2)', a['buses']['B2']['V'],
        b['buses']['X1/B2']['V'], 1e-12, 'pu')



def v514_rows(add):
    """5.0.14: the converters in RMS, step 2 of ROADMAP §101 (pcl.rms Converter, Statcom, SVC, tests/test_rms.py Converters): the basic
    model 1 of the SVC of the IEEE paper of 1994 against its static equation, the STATCOM of Fig. 11.68 of the book against its linear
    loop, and the grid-forming and grid-following units of «ieee9_gfm» against our EMT."""
    import json
    import subprocess
    import numpy as np
    from scipy.integrate import solve_ivp
    from scipy.optimize import brentq
    from pcl import model as M, network as N, rms
    A = 'Δυναμική RMS: οι μετατροπείς (5.0.14)'
    root = Path(__file__).resolve().parents[1]

    def comp(md, d=0.01):
        n = N.Network(f=50, S_base=100e6)
        n.bus('S', 220e3, kind='slack', V=1.0)
        n.bus('B', 220e3)
        n.feeder('S', Sk=None, V=1.0, slack=True, name='grid')
        n.branch_pu('S', 'B', 0.0, 0.1, name='x')
        n.generator('B', Sr=100e6, Ur=220e3, xd2=0.2, cosphi=0.9, P=0.0, V=1.0, name='C')
        s = rms.System(n, machines={'C': md}, f=50)
        s.init()
        r = s.simulate(0.5, events=[{'t': 0.1, 'kind': 'vref', 'gen': 'C', 'dV': d}], h=0.001)
        return r, s.quantities(r)['C']
    X = 0.1 + 1e-4
    r, c = comp({'model': 'svc'})
    add(A, 'SVC, βασικό μοντέλο 1 (K_R 25, T_R 50 ms) σε ζυγό πίσω από X = 0,1 pu, βήμα +0,01 pu στη V_ref: η τελική B',
        'η στατική εξίσωση K_R·(V_ref − V) = B με V = 1/(1 − X·B)', brentq(lambda B: 25 * (1.01 - 1 / (1 - X * B)) - B, 0, 0.5), float(c['B'][-1]), 1e-9, 'pu')
    r, c = comp({'model': 'statcom'})
    sol = solve_ivp(lambda t, z: [150 * (0.01 - (X + 0.03) * z[1]), (z[0] - z[1]) / 0.02], (0, 0.4), [0.0, 0.0], dense_output=True, rtol=1e-12, atol=1e-14)
    m = r['t'] > 0.1
    add(A, 'STATCOM του Σχ. 11.68 (K 150, ρ 3 %, T_C 20 ms) στον ίδιο ζυγό: το ρεύμα σε 0,4 s, h = 1 ms, η μεγαλύτερη διαφορά',
        'η γραμμική εξίσωση T_C·I″ + I′ + K·(X + ρ)·I = K·ΔV_ref (|V| = 1 + X·I ακριβώς)', 0.0,
        float(np.max(np.abs(c['Q'][m] / c['V'][m] - sol.sol(r['t'][m] - 0.1)[1]))), 1e-5, 'pu')
    node = lambda *a: json.loads(subprocess.run(['node', *a], capture_output=True, text=True, timeout=900, check=True).stdout)   # noqa: E731
    for unit, tol in (('droop', 3e-4), ('gfl', 3e-4)):
        js = node(str(root / 'tests' / 'js' / 'rms_gfm_cases.js'), unit, '4')
        te, Y, meta = np.array(js['t']), np.array([[np.nan if v is None else v for v in q] for q in js['y']]), js['meta']
        mach = {g: d for g, d in M.machines_of(M.of(node(str(root / 'tests' / 'js' / 'model_cases.js'), 'build', 'ieee9_gfm', json.dumps({'unit': unit}))))[0].items()
                if g in ('G1', 'G2')}
        if unit == 'droop':
            mach['G3'] = dict(model='gfm', law='droop', Sn=128e6, Xc=0.15, Rf=0.003, mp=5, nq=5, fp=5, Pref=meta['P3'], Qref=meta['Q3'], Vref=meta['E'])
        else:
            mach['G3'] = dict(model='gfl', Sn=128e6, X=0.15, acc=4, bw=5, Ilim=1.2, frq='droop', mf=5, Tf=0.05, Pref=meta['P3'], Vref=meta['V3'])
        q = N.ieee9().dynamic(t_end=4.0, h=0.005, record=0.005, machines=mach, f=60, events=[{'t': 1.0, 'kind': 'shunt', 'bus': '7', 'y': 0.5}], buses=[])
        w1 = np.interp(te, np.array(q['t']), q['machines']['G1']['omega'])
        add(A, f'«ieee9_gfm» με {"grid-forming (στατικότητα 5 %)" if unit == "droop" else "grid-following (απόκριση 5 %)"} στον ζυγό 3, +50 MW στο 1 s: '
            'η ταχύτητα της G1 από 0,5 ως 4 s σε RMS (h = 5 ms), η μεγαλύτερη διαφορά', 'το EMT του ίδιου tutorial', 0.0,
            float(np.max(np.abs(w1 - Y[:, 0])[te > 0.5])), tol, 'pu')


_B4_EMT = {}


def _b4_emt_cd55():
    """The EMT of b4dcs2 with Cd-E1 300 → 55 MW and Cm-B3 on V_dc (tests/js/b4_rms_cases.js), once for 5.0.15 and 5.0.16."""
    import json
    import subprocess
    if 'cd55' not in _B4_EMT:
        root = Path(__file__).resolve().parents[1]
        _B4_EMT['cd55'] = json.loads(subprocess.run(['node', str(root / 'tests' / 'js' / 'b4_rms_cases.js'), 'cd55:vdc', '2.5'], capture_output=True,
                                                    text=True, timeout=900, check=True).stdout)['runs'][0]
    return _B4_EMT['cd55']


def v517_rows(add):
    """5.0.17: the stations of the drawing with the terminal n off the ground (a symmetric monopole), step 2 of ROADMAP §101
    (web/studio/model.js pairGrid, pcl.model _tlm_dc; tests/test_rms_drawing.py PairsOfPoles, test_rms_hvdc.py SymmetricMonopole):
    the cable pair of hvdc_mmc as a line of two poles against its closed forms, the DC load flow between two poles against its
    closed form, and the drawing hvdc_mmc in RMS against its EMT."""
    import json
    import math
    import subprocess
    import numpy as np
    from pcl import model
    A = 'Δυναμική RMS: οι σταθμοί με τον ακροδέκτη n εκτός γης (5.0.17)'
    root = Path(__file__).resolve().parents[1]
    node = lambda *a: json.loads(subprocess.run(['node', *a], capture_output=True, text=True, timeout=900, check=True, cwd=root).stdout)
    m = model.of(node('tests/js/model_cases.js', 'build', 'hvdc_mmc', '{}'))
    R, L, C = model._tlm_dc(m['dc']['lines'][0]['tlm'])
    add(A, 'το ζεύγος καλωδίων ±320 kV, 70 km του `hvdc_mmc` ως γραμμή δύο πόλων, στο 1 mHz: η R ενός αγωγού',
        'ρ·ℓ/(πr²) του αγωγού', 1.9e-8 * 70e3 / (math.pi * 0.0265 ** 2), R, 1e-6, 'Ω')
    add(A, 'το ίδιο: η L ενός αγωγού (ο βρόχος δύο αγωγών 0,5 m μακριά, χωρίς ρεύματα στους μανδύες)',
        '(μ₀/π)·ln(D/(r·e^(−1/4)))·ℓ/2', 4e-7 * math.log(0.5 / (0.0265 * math.exp(-0.25))) * 70e3 / 2 * 1e3, L * 1e3, 0.01, 'mH')
    m2 = json.loads(json.dumps(m))
    next(e for e in m2['elements'] if e['id'] == 'MMC1')['ctl']['params']['Pref'] = '1'
    U1 = model.load_flow(m2)['dc']['dc1']['U']
    add(A, '`hvdc_mmc` με 1059 MW από τον σταθμό 1 και 640 kV στον σταθμό 2, ροή φορτίου AC/DC: η τάση ανάμεσα στους πόλους στον σταθμό 1',
        '(U₂ + √(U₂² + 8R·P))/2', (640e3 + math.sqrt(640e3 ** 2 + 8 * R * 1059e6)) / 2 / 1e3, U1 / 1e3, 1e-9, 'kV')
    js = {e['ev']: e for e in node('tests/js/hvdc_rms_cases.js', 'pstep,acf')['runs']}
    for ev in ('pstep', 'acf'):
        e = js[ev]
        mm = model.of(node('tests/js/model_cases.js', 'build', 'hvdc_mmc', json.dumps({'ev': ev})))
        for q in mm['elements']:                            # 5.1.1: as in 5.0.17, without the protection of the MMCC (THEORY §8ΩΦ)
            if q['type'] == 'MMC':
                q['ctl']['params']['prot'] = 'off'
        r = model.dynamic(mm, t_end=1.0, h=0.005, record=0.001, buses=[])
        te, T = np.array(e['t']), np.asarray(r['t'])
        dU = [np.interp(te, T, r['dc']['buses']['dc' + k]['U']) - np.array(e['U'][k]) for k in ('1', '2')]
        dP = [np.interp(te, T, r['dc']['stations']['MMC' + k]['Pt']) - np.array(e['U'][k]) * np.array(e['I'][k]) / 1e3 for k in ('1', '2')]
        if ev == 'pstep':
            a = te > 0.2
            add(A, '`hvdc_mmc` από το σχέδιο (βήμα P 1 → 0,5 pu στα 0,5 s), RMS με h = 5 ms: οι τάσεις ανάμεσα στους πόλους από 0,2 ως 1 s, η μεγαλύτερη διαφορά',
                'το EMT του ίδιου σχεδίου', 0.0, max(float(np.max(np.abs(d[a]))) for d in dU), 2.0, 'kV')
            add(A, 'το ίδιο: οι ισχείς DC των δύο σταθμών, η μεγαλύτερη διαφορά (στα πρώτα ms μετά το βήμα)', 'το EMT του ίδιου σχεδίου', 0.0,
                max(float(np.max(np.abs(d[a]))) for d in dP), 26.0, 'MW')
        else:
            a = te > 0.95
            add(A, '`hvdc_mmc` από το σχέδιο, τριφασικό σφάλμα στον σταθμό της V_dc (0,5–0,65 s), με τον περιοριστή υπέρτασης DC του MMCC (χωρίς την προστασία του, όπως στην 5.0.17): οι τάσεις ανάμεσα στους πόλους στο τέλος (0,95–1 s)',
                'το EMT του ίδιου σχεδίου', 0.0, max(abs(float(d[a].mean())) for d in dU), 0.15, 'kV')


def v518_rows(add):
    """5.0.18: the bus voltage control of the fourth exercise of PE2 (tutorial voltage_ctl; tests/test_voltage_ctl.py) and the
    grid-forming station of hvdc_gfm in RMS, step 2 of ROADMAP §101 (pcl.rms HVDC with stations of the model 'gfm', pcl.model
    _gfm_ctl, _solve; tests/test_rms_hvdc.py GridFormingStation): the voltage after a step against V_ref, the recovery of the slow
    controller against the estimate from its two poles, the voltage beyond the converter against its quadratic; the law of the
    station at the end against its closed form, the drawing hvdc_gfm in RMS against its EMT."""
    import json
    import math
    import subprocess
    import numpy as np
    from pcl import model, network as N
    root = Path(__file__).resolve().parents[1]
    node = lambda *a: json.loads(subprocess.run(['node', *a], capture_output=True, text=True, timeout=1200, check=True, cwd=root).stdout)
    A = 'Άσκηση 4: έλεγχος τάσης ζυγού (5.0.18)'
    o = node('tests/js/vctl_cases.js', 'lo_step,hi_limit,lo_slow')
    m = o['lo_step']['meta']
    add(A, '`voltage_ctl`, αποθήκευση 30 V, βήμα 15 → 35 kW: η μέση τιμή ανά περίοδο της τάσης του ζυγού στο τέλος (30 ms)',
        'V_ref', m['Vref'], o['lo_step']['v_end'], 0.012, 'V')
    m = o['lo_slow']['meta']
    G = 1 / m['Rs'] - m['Pd'] / m['Vref'] ** 2
    A2, d = G + m['Kpv'], math.sqrt((G + m['Kpv']) ** 2 - 4 * m['Cb'] * m['Kiv'])
    p1, p2 = (A2 - d) / (2 * m['Cb']), (A2 + d) / (2 * m['Cb'])
    dI = (m['prof'][1][1] - m['prof'][0][1]) / m['Vref']
    dev = lambda t: dI / m['Cb'] * (math.exp(-p1 * t) - math.exp(-p2 * t)) / (p2 - p1)
    t = math.log(p2 / p1) / (p2 - p1)
    while abs(dev(t)) > m['band']:
        t += 1e-6
    add(A, 'το ίδιο με ω_v = 75 rad/s: ο χρόνος ως το ±0,1 V', 'οι δύο πόλοι του C·s² + (G + K_p)·s + K_i', t,
        o['lo_slow']['steps'][0]['rec'], 0.05 * t, 's')
    m = o['hi_limit']['meta']
    P = m['prof'][-1][1]
    b, c = m['Vsrc'] + m['N'] * m['In'] * m['Rs'], P * m['Rs']
    add(A, '`voltage_ctl`, αποθήκευση 80 V, 55 kW, πέρα από τις δυνατότητες: η τάση όπου η πηγή δίνει ό,τι λείπει',
        'v·(V_src − v)/R_s = P − N·I_n·v', (b + math.sqrt(b * b - 4 * c)) / 2, o['hi_limit']['v_end'], 5e-3, 'V')
    A = 'Δυναμική RMS: ο σταθμός grid-forming (5.0.18)'
    net = N.Network(f=50.0, S_base=100e6)                  # the link of tests/test_rms_hvdc.py gfm_link
    net.bus('A', 400e3)
    net.feeder('A', Sk=100e9, RX=0.1, name='QA')
    net.bus('B', 400e3)
    net.load('B', P=300e6, Q=0.0, name='LD')
    net.dc_bus('D1', 640e3)
    net.dc_bus('D2', 640e3)
    net.dc_line('D1', 'D2', R=1.2, L=0.09, C=12.8e-6, poles=1, name='CAB')
    net.vsc('A', 'D1', control='V', V=1.0, Prated=1000e6, name='S1')
    net.vsc('B', 'D2', control='Vf', Vac=1.0, Prated=1000e6, name='S2')
    st = {'S2': {'model': 'gfm', 'law': 'psc', 'X': 0.15, 'R': 0.002}}
    r = net.dynamic(1.5, events=[{'t': 0.2, 'kind': 'load', 'bus': 'B', 'P': 100.0}], stations=st, h=0.005, record=0.005)
    q = r['dc']['stations']['S2']
    P0, P1 = q['P'][0] / 1000.0, q['P'][-1] / 1000.0
    add(A, 'ζυγός νησίδας από σταθμό PSC (k_p = 50), +100 MW στα 0,2 s: η συχνότητα στο τέλος (1,5 s, h = 5 ms)',
        'ω = 1 + k_p·(P_ref − P)/ω₀', 50 * (1 + 50.0 * (P0 - P1) / (2 * math.pi * 50)), q['f'][-1], 1e-6, 'Hz')
    runs = node('tests/js/hvdc_gfm_rms_cases.js', json.dumps([{'ac': 'island', 'law': 'droop'}, {'ac': 'weak', 'law': 'psc'}, {'ac': 'par', 'law': 'droop'}]), '1.2')['runs']
    name = {('island', 'droop'): 'νησίδα, στατικότητα', ('weak', 'psc'): 'ασθενές δίκτυο, PSC', ('par', 'droop'): 'με δεύτερη μονάδα, στατικότητα'}
    tol = {('island', 'droop'): 1e-3, ('weak', 'psc'): 1e-2, ('par', 'droop'): 1e-3}
    for e in runs:
        ac, law = e['opts']['ac'], e['opts']['law']
        r = model.dynamic(model.of(node('tests/js/model_cases.js', 'build', 'hvdc_gfm', json.dumps({'ac': ac, 'law': law}))), t_end=1.2, h=0.005, record=0.005, buses=[])
        te, tr = np.array(e['t']), np.asarray(r['t'])
        q = r['dc']['stations']['MMC2']
        emt = lambda key, t: float(np.mean(np.asarray(e[key])[(te > t - 0.01 + 1e-9) & (te <= t + 0.01 + 1e-9)]))
        post = [i for i, t in enumerate(tr) if 0.65 - 1e-9 <= t <= 1.19 + 1e-9]
        add(A, f'`hvdc_gfm` από το σχέδιο ({name[(ac, law)]}), RMS με h = 5 ms: η P του σταθμού 2 από 0,65 ως 1,19 s, η μεγαλύτερη διαφορά',
            'το EMT του ίδιου σχεδίου (μέσες τιμές 20 ms)', 0.0, max(abs(q['P'][i] * 1e6 / 1059e6 - emt('P', tr[i])) for i in post), tol[(ac, law)], 'pu')



def v5_1_1_rows(add):
    """5.1.1: the protection of the MMCC as events of the RMS, step 3 of ROADMAP §101 (pcl.rms HVDC with prot, System.simulate;
    tests/test_rms_protection.py, tests/test_rms_hvdc.py SymmetricMonopole): the instants of the block, the deblock and the opening
    of the AC breaker against the rules of the MMCC, a blocked grid-forming station against the closed form of its droop with
    P = 0, and the link of hvdc_mmc from its drawing in the AC fault against its EMT."""
    import json
    import math
    import subprocess
    import numpy as np
    from pcl import model, network as N
    root = Path(__file__).resolve().parents[1]
    node = lambda *a: json.loads(subprocess.run(['node', *a], capture_output=True, text=True, timeout=1200, check=True, cwd=root).stdout)
    A = 'Δυναμική RMS: η προστασία του MMCC ως συμβάν (5.1.1)'

    def link(control='P'):
        net = N.Network(f=50.0, S_base=100e6)
        net.bus('A', 400e3)
        net.feeder('A', Sk=100e9, RX=0.1, name='QA')
        net.bus('B', 400e3)
        if control == 'Vf':
            net.load('B', P=300e6, Q=0.0, name='LD')
        else:
            net.feeder('B', Sk=5e9, RX=0.1, name='QB')
        net.dc_bus('D1', 640e3)
        net.dc_bus('D2', 640e3)
        net.dc_line('D1', 'D2', R=1.2, L=0.09, C=12.8e-6, poles=1, name='CAB')
        net.vsc('A', 'D1', control='V', V=1.0, Prated=1000e6, name='S1')
        if control == 'Vf':
            net.vsc('B', 'D2', control='Vf', Vac=1.0, Prated=1000e6, name='S2')
        else:
            net.vsc('B', 'D2', control='P', P=500e6, Prated=1000e6, name='S2')
        return net

    def when(r, kind):
        return next(e['t'] for e in r['events'] if e.get('by') == 'prot' and e['kind'] == kind)
    ev = [{'t': 0.5, 'kind': 'fault', 'bus': 'B'}, {'t': 0.6, 'kind': 'clear', 'bus': 'B'}]
    r = link().dynamic(1.0, events=ev, stations={'S2': {'prot': 1}}, h=0.005, record=0.005)
    add(A, 'σταθμός P, σφάλμα στον ζυγό του 0,5–0,6 s: το μπλοκάρισμα (υπόταση)', 'η στιγμή του σφάλματος', 0.5, when(r, 'block'), 1e-9, 's')
    add(A, 'το ίδιο: η απεμπλοκή', 'η εκκαθάριση και t_uv = 20 ms', 0.62, when(r, 'deblock'), 1e-9, 's')
    add(A, 'το ίδιο: η P προς τον ζυγό AC στο τέλος (1 s)', 'η αναφορά του σταθμού', -500.0, float(r['dc']['stations']['S2']['P'][-1]), 1e-3, 'MW')
    r = link().dynamic(0.6, stations={'S2': {'prot': 1, 'Idcmax': 0.3}}, h=0.005, record=0.005)
    add(A, 'I_dc,max 0,3 pu με 0,5 pu: το άνοιγμα του διακόπτη AC (h = 5 ms)', 'το πρώτο βήμα μετά το t_prot = 0,3 s, και t_cb = 40 ms',
        0.345, when(r, 'gen'), 1e-9, 's')
    r = link('Vf').dynamic(0.5, events=[{'t': 0.2, 'kind': 'block', 'gen': 'S2'}], stations={'S2': {'model': 'gfm', 'law': 'droop', 'X': 0.15, 'R': 0.002}},
                           h=0.001, record=0.001)
    q = r['dc']['stations']['S2']
    P0 = float(q['P'][0]) / 1000.0
    add(A, 'σταθμός grid-forming (στατικότητα) μπλοκαρισμένος στα 0,2 s: η ω στα 0,5 s (h = 1 ms)', '1 + m_p·P₀·(1 − e^(−2π·f_p·τ))',
        1 + 0.02 * P0 * (1 - math.exp(-2 * math.pi * 5.0 * 0.3)), float(q['f'][-1]) / 50.0, 3e-5, 'pu')
    e = node('tests/js/hvdc_rms_cases.js', 'acf')['runs'][0]
    r = model.dynamic(model.of(node('tests/js/model_cases.js', 'build', 'hvdc_mmc', json.dumps({'ev': 'acf'}))), t_end=1.0, h=0.005, record=0.001, buses=[])
    te, T = np.array(e['t']), np.asarray(r['t'])
    b = np.array(e['B']['2'])
    ch = [te[i] for i in range(1, len(b)) if (b[i] > 0.5) != (b[i - 1] > 0.5) and te[i] > 0.2]
    add(A, '`hvdc_mmc` από το σχέδιο, σφάλμα AC στον σταθμό 2 (0,5–0,65 s): το μπλοκάρισμα του σταθμού 2', 'το EMT του ίδιου σχεδίου (ανά 1 ms)',
        ch[0], when(r, 'block'), 0.002, 's')
    add(A, 'το ίδιο: η απεμπλοκή (στο EMT το σφάλμα σβήνει στα μηδενικά του ρεύματος, άρα η τάση επανέρχεται αργότερα)', 'το EMT του ίδιου σχεδίου (ανά 1 ms)',
        ch[1], when(r, 'deblock'), 0.012, 's')
    dU = np.interp(te, T, r['dc']['buses']['dc2']['U']) - np.array(e['U']['2'])
    add(A, 'το ίδιο, RMS με h = 5 ms: η τάση ανάμεσα στους πόλους του σταθμού 2 από 0,7 ως 1 s, η μεγαλύτερη διαφορά', 'το EMT του ίδιου σχεδίου',
        0.0, float(np.max(np.abs(dU[te > 0.7]))), 10.0, 'kV')


def v5_1_2_rows(add):
    """5.1.2: the two-area system in EMT and in the card «Δυναμική RMS», step 1 of ROADMAP §101 (the tutorial two_area_emt,
    tests/js/two_area_cases.js, Network.dynamic(modes=True); tests/test_two_area_emt.py): its load flow against the case two_area, the
    machines of its drawing against pcl.rms.two_area_machines, and the RMS of the same drawing against its EMT in the fault, the pulse
    of load (the interarea mode) and the opening of a circuit."""
    import json
    import subprocess
    import numpy as np
    from scipy.optimize import least_squares
    from pcl import model, rms, study, network as N
    root = Path(__file__).resolve().parents[1]
    node = lambda *a: json.loads(subprocess.run(['node', *a], capture_output=True, text=True, timeout=1200, check=True, cwd=root).stdout)
    A = 'Δυναμική RMS: οι δύο περιοχές σε EMT και στην κάρτα (5.1.2)'
    drawing = lambda o: model.of(node('tests/js/model_cases.js', 'build', 'two_area_emt', json.dumps(o)))

    def emt(T, o):
        js = node('tests/js/two_area_cases.js', str(T), json.dumps(o))
        y = np.array([[np.nan if v is None else v for v in r] for r in js['y']])
        return np.array(js['t']), np.degrees(np.unwrap(np.radians(y[:, :4]), axis=0))

    def d13(o, T, **kw):
        te, D = emt(T, o)
        r = study.run({'drawing': drawing(o), 'study': 'rms', 'options': {'t_end': T, 'h': 0.005, 'record': 0.002, **kw}})['result']
        M = r['machines']
        return te, D[:, 0] - D[:, 2], np.interp(te, np.array(r['t']), np.array(M['G1']['delta']) - np.array(M['G3']['delta'])), r
    pf = N.case_data('two_area').power_flow()
    lf = node('tests/js/model_cases.js', 'build', 'two_area_emt', '{}')['meta']['lf']
    add(A, '`two_area_emt`: |V| των 11 ζυγών του tutorial, η μεγαλύτερη διαφορά', 'η ροή φορτίου του δικτύου `two_area`', 0.0,
        max(abs(v[0] - pf['buses'][b]['V']) for b, v in lf.items()), 1e-6, 'pu')
    m = drawing({'exc': 'pss', 'ev': 'none'})
    s1 = rms.System(model._rms_network(m)[0], machines=model.machines_of(m)[0], loads='Z', f=60)
    s1.init()
    ma = {g: {k: v for k, v in d.items() if k not in ('SG10', 'SG12')} for g, d in rms.two_area_machines('pss', limits=True).items()}
    s2 = rms.System(N.case_data('two_area'), machines=ma, loads='Z')
    s2.init()
    add(A, 'οι μονάδες του σχεδίου με PSS στο RMS: οι 56 ιδιοτιμές, η μεγαλύτερη διαφορά', '`two_area_machines(\'pss\', limits=True)` χωρίς τον κορεσμό, φορτία Z',
        0.0, float(np.max(np.abs(np.sort_complex(s1.eigen('qr')['lambda']) - np.sort_complex(s2.eigen('qr')['lambda'])))), 2e-5, '1/s')
    te, E, R, r = d13({'exc': 'pss', 'ev': 'fault'}, 10.0)
    add(A, 'σφάλμα στον ζυγό 8 (1–1,1 s) με PSS: η πρώτη κορυφή της δ₁ − δ₃ στο RMS (h = 5 ms)', 'το EMT του ίδιου σχεδίου (βήμα T/100)', float(E.max()), float(R.max()), 0.5, '°')
    add(A, 'το ίδιο: η δ₁ − δ₃ σε 10 s, η μεγαλύτερη διαφορά', 'το EMT του ίδιου σχεδίου', 0.0, float(np.max(np.abs(R - E))), 0.5, '°')
    te, E, R, r = d13({'exc': 'manual', 'ev': 'pulse'}, 20.0, modes=True)
    q = r['modes'][0]
    k = te >= 3.0
    t, x = te[k] - 3.0, E[k]
    p = least_squares(lambda p: p[0] + p[1] * np.exp(p[2] * t) * np.cos(p[3] * t + p[4]) - x, [x.mean(), np.ptp(x) / 2, 0.0, 2 * np.pi * q['f'], 0.0]).x
    add(A, 'παλμός φορτίου 10 MW στον ζυγό 9 με σταθερή E_fd: η συχνότητα της δ₁ − δ₃ στο EMT από 3 ως 20 s (ελάχιστα τετράγωνα)',
        'ο διαπεριοχικός τρόπος στην αρχή (`modes`)', q['f'], p[3] / (2 * np.pi), 3e-3, 'Hz')
    te, E, R, r = d13({'exc': 'pss', 'ev': 'trip'}, 10.0)
    add(A, 'άνοιγμα του κυκλώματος 2 της 7–8 στο 1 s με PSS: η δ₁ − δ₃ σε 10 s, η μεγαλύτερη διαφορά', 'το EMT του ίδιου σχεδίου', 0.0,
        float(np.max(np.abs(R - E))), 1.0, '°')


def v5_1_4_rows(add):
    """5.1.4: the wind turbines of IEC 61400-27-1:2020 in RMS, types 4A and 4B (pcl.rms.Wind; tests/test_rms_wind.py): the start at
    rest, a step of the active and of the reactive reference against the closed solution of their lags, the torsional mode of 4B
    against the drive train linearized by hand, the FRT injection against the formula of the Q control, the trip of the protection
    against its table."""
    import math
    import numpy as np
    from pcl import network as N, rms
    A = 'Δυναμική RMS: ανεμογεννήτριες του IEC 61400-27-1, τύποι 4A και 4B (5.1.4)'

    def behind(X=0.1, P=80e6):
        n = N.Network(f=50, S_base=100e6)
        n.bus('S', 33e3, kind='slack', V=1.0)
        n.bus('B', 33e3)
        n.feeder('S', Sk=None, V=1.0, slack=True, name='grid')
        n.branch_pu('S', 'B', 0.0, X, name='x')
        n.generator('B', Sr=100e6, Ur=33e3, xd2=0.2, cosphi=0.9, P=P, V=1.0, name='WT')
        return n

    def run(md, ev, T, h, X=0.1):
        s = rms.System(behind(X), machines={'WT': {'Sn': 100e6, **md}}, f=50)
        s.init()
        r = s.simulate(T, events=ev, h=h)
        return s, r, s.quantities(r)['WT']
    worst = 0.0
    for m in rms.WIND_MODELS:
        for q in range(5):
            s = rms.System(N.ieee9(), machines={'G3': {'Sn': 100e6, 'model': m, 'MqG': q}}, f=60)
            worst = max(worst, s.init()['f'])
    add(A, 'στη θέση της G3 του IEEE 9, οι 4A και 4B στους πέντε τρόπους M_qG: το μεγαλύτερο |f| στην αρχή', 'ακίνητο', 0.0, worst, 1e-12, 'pu/s')
    T = (0.05, 0.02, 0.01)
    s, r, q = run({'model': 'wt4a', 'MqG': 2, 'TpWTref': T[0], 'Tpordp': T[1], 'Tg': T[2]}, [{'t': 0.0, 'kind': 'pref', 'gen': 'WT', 'dP': 0.01}],
                  0.3, 0.001, X=1e-6)
    t = r['t']
    cf = 1.0 - sum(T[i] ** 2 / math.prod(T[i] - T[j] for j in range(3) if j != i) * np.exp(-t / T[i]) for i in range(3))
    add(A, '4A: βήμα 0,01 pu του p_WTref πίσω από άκαμπτη πηγή, το Δi_p σε 0,3 s (h = 1 ms), η μεγαλύτερη διαφορά',
        'κλειστή λύση των T_pWTref, T_pordp, T_g', 0.0, float(np.max(np.abs(q['ip'] - q['ip'][0] - 0.01 * cf))), 1e-6, 'pu')
    s, r, q = run({'model': 'wt4a', 'MqG': 2, 'Tqord': 0.05, 'Tg': 0.01}, [{'t': 0.0, 'kind': 'qref', 'gen': 'WT', 'dQ': 0.02}], 0.3, 0.001, X=1e-6)
    t = r['t']
    cf = 1 - (0.05 * np.exp(-t / 0.05) - 0.01 * np.exp(-t / 0.01)) / 0.04
    add(A, 'M_qG 2: βήμα 0,02 pu του x_WTref, το Δi_q σε 0,3 s (h = 1 ms), η μεγαλύτερη διαφορά', 'κλειστή λύση των T_qord, T_g', 0.0,
        float(np.max(np.abs(q['iq'] - q['iq'][0] - 0.02 * cf))), 2e-6, 'pu')
    s = rms.System(behind(1e-6), machines={'WT': {'Sn': 100e6, 'model': 'wt4b', 'MqG': 2}}, f=50)
    s.init()
    lam = np.array(s.eigen('qr')['lambda'])
    p = {k: float(v[0]) for k, v in [K for K in s.kinds if isinstance(K, rms.Wind)][0].p.items() if isinstance(v, np.ndarray) and v.shape == (1,)}
    p0, H1, H2, k, c = 0.8, p['HWTR'], p['Hgen'], p['kdrt'], p['cdrt']
    Mx = np.array([[(-p0 - c) / (2 * H1), c / (2 * H1), -1 / (2 * H1), 0, 0], [c / (2 * H2), (p0 - c) / (2 * H2), 1 / (2 * H2), 0, -1 / (2 * H2)],
                   [k, -k, 0, 0, 0], [0, p0 / p['Tpordp'], 0, -1 / p['Tpordp'], 0], [0, 0, 0, 1 / p['Tg'], -1 / p['Tg']]])
    mu = [m for m in np.linalg.eigvals(Mx) if m.imag > 1][0]
    nearest = lam[int(np.argmin(np.abs(lam - mu)))]
    add(A, '4B: ο στρεπτικός τρόπος, συχνότητα (ιδιοτιμή του συστήματος)', 'ο άξονας γραμμικοποιημένος με το χέρι (ω_WTR, ω_gen, στρέψη, εντολή, i_p)',
        abs(mu.imag) / (2 * math.pi), abs(nearest.imag) / (2 * math.pi), 1e-6, 'Hz')
    s, r, q = run({'model': 'wt4a', 'MqG': 1, 'MqFRT': 1}, [{'t': 0.2, 'kind': 'fault', 'bus': 'B', 'z': 0.1j}, {'t': 0.4, 'kind': 'clear', 'bus': 'B'}],
                  0.5, 0.005)
    i = int(np.argmin(np.abs(r['t'] - 0.3)))
    p = {k: float(v[0]) for k, v in [K for K in s.kinds if isinstance(K, rms.Wind)][0].p.items() if isinstance(v, np.ndarray) and v.shape == (1,)}
    du = q['uf'][i] - q['us'][i]
    want = min(max(p['Kqv'] * (du - p['udb1'] if du < p['udb1'] else du - p['udb2'] if du > p['udb2'] else 0.0) + q['ui'][i], p['iqmin']), p['iqh1'])
    add(A, 'βύθιση στα ~0,53 pu με M_qFRT 1: το i_qcmd στα 0,3 s', 'i_qbase + K_qv·Δu με τη νεκρή ζώνη, μέσα σε [i_qmin, i_qh1] (Σχ. 34)',
        float(want), float(q['iqcmd'][i]), 1e-12, 'pu')
    s, r, q = run({'model': 'wt4a', 'prot': 1}, [{'t': 0.2, 'kind': 'fault', 'bus': 'B', 'z': 0.1j}], 3.0, 0.005)
    trip = [e['t'] for e in r['events'] if e['kind'] == 'gen'][0]
    up = float(q['up'][int(np.argmin(np.abs(r['t'] - 1.0)))])
    add(A, 'προστασία υπότασης στη βύθιση που μένει: η στιγμή της απόζευξης', 't_σφάλματος + T_uunder(u_WTPfilt) του πίνακα (Σχ. 38)',
        0.2 + 0.15 + up / 0.85 * 2.85, trip, 0.005, 's')

def v5_1_5_rows(add):
    """5.1.5: the LCC link in the load flow AC/DC and in RMS (pcl.lcc, pcl.rms.LCC; tests/test_rms_lcc.py): the steady state against
    Example 10.2 of Power System Stability and Control and against the average model of our EMT of the first CIGRE HVDC benchmark,
    the DC circuit with the controls held against its closed solution, the firing PLLs against their poles, the step of the order
    against our EMT."""
    import json
    import math
    import subprocess
    import numpy as np
    import scipy.linalg as sla
    from pcl import lcc, rms, network as N
    A = 'Δυναμική RMS: η ζεύξη LCC (5.1.5)'
    D = 180 / math.pi
    net = N.Network(f=50)
    net.bus('A', 220e3)
    net.bus('B', 220e3)
    st = {'Sn': 0.1 * 110e3 ** 2 / (2 * math.pi), 'U1': 220e3, 'U2': 110e3, 'uk': 10.0, 'B': 4}
    net.lcc('A', 'B', Vdn=500e3, Idn=2000, R=20.0, sr=st, si=st, gref=18.167, amin=5.0, dI=0.15, dgc=0.0, vdcol=(0.4, 1.0, 0.9, 1.0), name='L')
    e = net.element('L')
    Ei = (500 + 48) / math.cos(18.167 / D) * 1e3 / (3 * math.sqrt(2) / math.pi * 2) / 220e3
    o = lcc.operating_point(e, 220e3, 220e3, 229.12 / 220, Ei)
    add(A, 'Παράδειγμα 10.2 (α), τρόπος 1: η γωνία επικάλυψης του αντιστροφέα', 'το βιβλίο', 20.232, o['mi'] * D, 0.001, '°')
    o = lcc.operating_point(e, 220e3, 220e3, 0.8 * 229.12 / 220, Ei)
    add(A, 'Παράδειγμα 10.2 (β), η τάση AC του ανορθωτή 20 % κάτω, τρόπος 2: V_d του αντιστροφέα', 'το βιβλίο', 418.39, o['Vdi'] / 1e3, 0.005, 'kV')
    add(A, 'Παράδειγμα 10.2 (β): το γ του αντιστροφέα', 'το βιβλίο', 37.23, o['g'] * D, 0.005, '°')
    js = str(Path(__file__).resolve().parent.parent / 'tests' / 'js' / 'lcc_rms_cases.js')

    def emt(c):
        r = subprocess.run(['node', js, json.dumps([c])], capture_output=True, text=True, timeout=1800)
        return json.loads(r.stdout)[0]
    m = emt({'opts': {'model': 'avg', 'ev': 'ss'}, 't0': 2.95, 't1': 3.0, 'win': 0.05})
    r = lcc.benchmark_network().acdc_flow()['lcc']['DC']
    add(A, 'το benchmark της CIGRE: α του ανορθωτή από τη ροή φορτίου AC/DC', 'το μέσο μοντέλο του EMT μας (`hvdc_lcc`) στα 3 s', m['aor'][-1], r['alpha_r'], 0.01, '°')
    add(A, 'το benchmark: V_d του ανορθωτή από τη ροή φορτίου AC/DC', 'το μέσο μοντέλο του EMT μας στα 3 s', m['vdr'][-1] * 500, r['Vdr'] / 1e3, 0.1, 'kV')
    # the DC circuit with the controls held, stiff AC: after a fault at the middle the circuit is linear
    net = N.Network(f=50, S_base=1e11)
    b = lcc.BENCHMARK
    for bus, d in (('R', b['rec']), ('I', b['inv'])):
        net.bus(bus, d['U'])
        net.feeder(bus, V=1.0, angle=0.0, name='S' + bus)
    net.lcc('R', 'I', Vdn=500e3, Idn=2000, R=5.0, C=26e-6, Ld=b['Ld'], sr=b['rec']['st'], si=b['inv']['st'], name='DC')
    s = rms.System(net, stations={'DC': {'KpR': 0.0, 'KpI': 0.0, 'KpG': 0.0, 'bw': 0.0, 'cda': 0.0}})   # (5.1.6: the trapezoidal rule alone)
    s.init()
    K = [k for k in s.kinds if isinstance(k, rms.LCC)][0]
    x0 = s.x0[K.x0:K.x0 + K.nx]
    res = s.simulate(0.3, events=[{'t': 0.1, 'kind': 'dcfault', 'gen': 'DC', 'R': 250.0}], h=0.00025)
    p, j = K.p, K.j
    E = np.abs(s.V0[K.bus])
    Vr = p['vd0'][0] * E[0] * math.cos(math.pi - x0[j['xr']])
    Vi = p['vd0'][1] * E[1] * math.cos(math.pi - x0[j['xg']])
    M = np.zeros((4, 4))
    M[:3, :3] = [[-(p['rc'][0] + p['rl'] / 2) / p['l1'], -1 / p['l1'], 0.0], [1 / p['c'], -(500e3 / 2000 / 250.0) / p['c'], -1 / p['c']],
                 [0.0, 1 / p['l2'], -(p['rc'][1] + p['rl'] / 2) / p['l2']]]
    M[:3, 3] = [Vr / p['l1'], 0.0, Vi / p['l2']]
    z0 = np.r_[x0[[j['ir'], j['vm'], j['ii']]], 1.0]
    X = res['x'][:, K.x0:K.x0 + K.nx][:, [j['ir'], j['vm'], j['ii']]]
    err = max(float(np.max(np.abs(X[k] - (sla.expm(M * (t - 0.1)) @ z0)[:3]))) for k, t in enumerate(res['t']) if t > 0.1 + 1e-9)
    add(A, 'οι έλεγχοι σταθεροί, άκαμπτο AC, σφάλμα 250 Ω στη μέση της γραμμής: το μεγαλύτερο σφάλμα των ρευμάτων και της V_m (h = 0,25 ms)',
        'κλειστή λύση του γραμμικού κυκλώματος DC (expm)', 0.0, err, 6e-4, 'pu')
    s = rms.System(net)
    s.init()
    lam = np.asarray(s.eigen(method='qr')['lambda'])
    wn = 2 * math.pi * 1.125
    want = complex(-0.7071 * wn, wn * math.sqrt(1 - 0.7071 ** 2))
    add(A, 'άκαμπτο AC: οι πόλοι των PLL της πυροδότησης, η απόσταση της πλησιέστερης ιδιοτιμής', '−ζω_n ± jω_n·√(1 − ζ²), 1,125 Hz, ζ 0,7071', 0.0,
        float(np.min(np.abs(lam - want))), 1e-3, '1/s')
    m = emt({'opts': {'model': 'avg', 'ev': 'step'}, 'set': {'CI': {'Iord': '0:1, 2.5:0.9'}}, 't0': 3.6, 't1': 4.0, 'win': 0.005})
    d = lcc.benchmark_network().dynamic(t_end=2.0, events=[{'t': 0.5, 'kind': 'iord', 'gen': 'DC', 'dI': -0.1}], h=0.001, record=0.001)
    add(A, 'βήμα της εντολής 1 → 0,9 pu: V_d του ανορθωτή στο τέλος (RMS h = 1 ms)', 'το μέσο μοντέλο του EMT μας', m['vdr'][-1] * 500,
        float(d['lcc']['DC']['Vdr'][-1]), 0.3, 'kV')


def v5_1_7_rows(add):
    """5.1.7: the LCC link as a part of the drawing (tests/test_rms_lcc_drawing.py): the load flow AC/DC of the drawing of hvdc_lcc
    against the same link from the API (the sources of the drawing), its RMS against the API (a step of the order) and against the
    EMT of the same drawing (a DC fault at 2,5 s)."""
    import json
    import subprocess
    import numpy as np
    from pcl import lcc, model
    A = 'Δυναμική RMS: η ζεύξη LCC ως στοιχείο του σχεδίου (5.1.7)'
    root = Path(__file__).resolve().parent.parent

    def drawing(opts, sets=None):
        pr = json.loads(subprocess.run(['node', str(root / 'tests' / 'js' / 'model_cases.js'), 'build', 'hvdc_lcc', json.dumps(opts)], capture_output=True,
                                       text=True, timeout=300, check=True).stdout)
        for cid, ps in (sets or {}).items():
            next(c for c in pr['components'] if c['id'] == cid)['params'].update(ps)
        return model.of(pr)

    def api(m):
        net = lcc.benchmark_network()
        r = model.load_flow(m)
        for e, b in (('SR', 'SR.abc'), ('SI', 'SI.abc')):
            net.element(e)['V'] = r['buses'][b]['V']
        return net
    m = drawing({'model': 'avg', 'ev': 'step'})
    o, q = model.load_flow(m)['lcc']['STR'], api(m).acdc_flow()['lcc']['DC']
    add(A, 'hvdc_lcc από το σχέδιο, ροή φορτίου AC/DC: V_d του ανορθωτή', 'η ίδια ζεύξη από το API (benchmark_network)', q['Vdr'] / 1e3, o['Vdr'] / 1e3, 1e-6, 'kV')
    add(A, 'hvdc_lcc από το σχέδιο, ροή φορτίου AC/DC: Q του αντιστροφέα', 'η ίδια ζεύξη από το API', q['Qi'] / 1e6, o['Qi'] / 1e6, 1e-6, 'Mvar')
    d = model.dynamic(m, t_end=1.5, h=0.001, record=0.001)
    a = api(m).dynamic(t_end=1.5, events=[{'t': 1.0, 'kind': 'iord', 'gen': 'DC', 'dI': -0.1}], h=0.001, record=0.001)
    add(A, 'RMS του σχεδίου, βήμα της εντολής 1 → 0,9 pu (το LCCC του σχεδίου): I_d στα 1,5 s', 'η ίδια ζεύξη από το API',
        float(a['lcc']['DC']['Id_r'][-1]), float(d['lcc']['STR']['Id_r'][-1]), 1e-9, 'kA')
    c = {'opts': {'model': 'avg', 'ev': 'dcf'}, 'set': {'KDC': {'v': '0:0, 2.5:1, 2.65:0'}}, 't0': 3.995, 't1': 4.0, 'win': 0.005}
    e = json.loads(subprocess.run(['node', str(root / 'tests' / 'js' / 'lcc_rms_cases.js'), json.dumps([c])], capture_output=True, text=True, timeout=1800).stdout)[0]
    d = model.dynamic(drawing({'model': 'avg', 'ev': 'dcf'}, {'KDC': {'v': '0:0, 2.5:1, 2.65:0'}}), t_end=4.0, h=0.001, record=0.001)
    T, V = np.round(np.asarray(d['t']), 9), np.asarray(d['lcc']['STR']['Vdr'])
    w = (T >= 3.995 - 1e-9) & (T <= 4.0 + 1e-9)
    _, last = np.unique(T[w][::-1], return_index=True)
    i = len(T[w]) - 1 - last
    add(A, 'RMS του σχεδίου, σφάλμα DC στον διακόπτη του σχεδίου (2,5–2,65 s): V_d του ανορθωτή στα 4 s (μέσος όρος 5 ms)',
        'το EMT του ίδιου σχεδίου (μέσο μοντέλο)', e['vdr'][-1] * 500, float(np.trapezoid(V[w][i], T[w][i]) / 0.005), 1.0, 'kV')


def v5_1_6_rows(add):
    """5.1.6: the LCC link, continued (tests/test_rms_lcc_516.py): the tap changers against Example 10.2 (c) of Power System
    Stability and Control, the losses of the stations against their closed form, the commutation failure of the inverter against
    the detailed model of our EMT, the half steps of backward Euler after a DC fault, the RMS tap changer against the load flow,
    a link with a VSC link against its two parts solved apart."""
    import json
    import math
    import subprocess
    import numpy as np
    from pcl import dcgrid, lcc, network as N
    A = 'Δυναμική RMS: η ζεύξη LCC, συνέχεια (5.1.6)'
    net = N.Network(f=50)
    net.bus('A', 220e3)
    net.bus('B', 220e3)
    st = {'Sn': 0.1 * 110e3 ** 2 / (2 * math.pi), 'U1': 220e3, 'U2': 110e3, 'uk': 10.0, 'B': 4}
    net.lcc('A', 'B', Vdn=500e3, Idn=2000, R=20.0, sr=dict(st, oltc={'ctl': 'alpha', 'band': (15, 20)}), si=dict(st, oltc={'ctl': 'vd', 'band': (1.0, 1.02)}),
            gref=18.167, amin=5.0, dI=0.15, dgc=0.0, vdcol=(0.4, 1.0, 0.9, 1.0), name='L')
    Ei = (500 + 48) / math.cos(math.radians(18.167)) * 1e3 / (3 * math.sqrt(2) / math.pi * 2) / 220e3
    o = lcc.operating_point_taps(net.element('L'), 220e3, 220e3, 229.12 / 220, 0.85 * Ei)
    add(A, 'Παράδειγμα 10.2 (γ), η τάση AC του αντιστροφέα 15 % κάτω, με τις λήψεις: η λήψη του αντιστροφέα', 'το βιβλίο (Πίν. E10.1)', 1.18, o['n']['i'], 1e-9, 'pu')
    add(A, 'Παράδειγμα 10.2 (γ): η λήψη του ανορθωτή', 'το βιβλίο', 0.99, o['n']['r'], 1e-9, 'pu')
    add(A, 'Παράδειγμα 10.2 (γ): V_d του αντιστροφέα', 'το βιβλίο (με στρογγυλεμένες σταθερές)', 501.55, o['Vdi'] / 1e3, 0.2, 'kV')
    add(A, 'Παράδειγμα 10.2 (γ): α του ανορθωτή', 'το βιβλίο', 15.8, math.degrees(o['ar']), 0.06, '°')
    net = lcc.benchmark_network(sr={'Req': 1.0, 'Vdrop': 2000.0}, si={'Req': 1.0, 'Vdrop': 2000.0})
    d = net.acdc_flow()['lcc']['DC']
    add(A, 'το benchmark με R_eq 1 Ω και V_drop 2 kV σε κάθε σταθμό: οι απώλειες των σταθμών', '2·(R_eq·I² + V_drop·I), (10.57)–(10.58)',
        2 * (1.0 * d['Id'] ** 2 + 2000.0 * d['Id']) / 1e6, d['losses_conv'] / 1e6, 1e-6, 'MW')
    js = str(Path(__file__).resolve().parent.parent / 'tests' / 'js' / 'lcc_rms_cases.js')
    c = {'opts': {'model': 'fast', 'ev': 'ac3'}, 'set': {'FAC': {'ton': 2.5, 'toff': 2.65}}, 't0': 2.4, 't1': 3.3, 'win': 0.001}
    e = json.loads(subprocess.run(['node', js, json.dumps([c])], capture_output=True, text=True, timeout=1800).stdout)[0]
    te, pe = np.asarray(e['t']) - 2.0, np.asarray(e['vdi']) * 500 * np.asarray(e['ii']) / 1e3
    m = (te >= 0.5) & (te <= 1.2)
    ev = [{'t': 0.5, 'kind': 'fault', 'bus': 'I', 'z': 0.1 / 529.0}, {'t': 0.65, 'kind': 'clear', 'bus': 'I'}]
    r = lcc.benchmark_network().dynamic(t_end=1.3, events=ev, h=0.001, record=0.001)
    tr, pr = np.asarray(r['t']), np.asarray(r['lcc']['DC']['Pdi'])
    k = (tr >= 0.5) & (tr <= 1.2)
    add(A, 'τριφασικό σφάλμα 0,1 Ω στον αντιστροφέα (150 ms), με την αποτυχία μετάβασης: η ενέργεια στον αντιστροφέα 0,5–1,2 s',
        'το λεπτομερές μοντέλο του EMT μας', float(np.trapezoid(pe[m], te[m])), float(np.trapezoid(pr[k], tr[k])), 30.0, 'MJ')
    ev = [{'t': 0.5, 'kind': 'dcfault', 'gen': 'DC', 'R': 0.1}, {'t': 0.65, 'kind': 'dcclear', 'gen': 'DC'}]
    v = {}
    for h in (0.001, 0.005):
        r = lcc.benchmark_network().dynamic(t_end=0.8, events=ev, h=h, record=0.005)
        v[h] = float(r['lcc']['DC']['Vdi'][int(np.argmin(np.abs(np.asarray(r['t']) - 0.75)))])
    add(A, 'σφάλμα DC 0,1 Ω (150 ms): V_d του αντιστροφέα 0,1 s μετά την εκκαθάριση, h = 5 ms με τα μισά βήματα backward Euler',
        'το ίδιο με h = 1 ms', v[0.001], v[0.005], 1.0, 'kV')
    net = lcc.benchmark_network()
    pf0 = net.acdc_flow()
    ee = net.element('DC')
    ee['i']['oltc'] = {'ctl': 'vd', 'band': (0.995, 1.005), 'step': 0.00625, 'nmin': 0.8, 'nmax': 1.2, 'T': 1.0}
    d = net.acdc_flow()['lcc']['DC']
    ee.pop('_n')
    r = net.dynamic(t_end=10.0, h=0.005, record=0.05, pf=pf0)
    add(A, 'η λήψη του αντιστροφέα στο RMS από τη ροή φορτίου χωρίς λήψεις: V_d στο τέλος', 'η ροή φορτίου AC/DC με τις λήψεις', d['Vdi'] / 1e3,
        float(r['lcc']['DC']['Vdi'][-1]), 0.05, 'kV')
    net = lcc.benchmark_network()
    net.dc_bus('D1', 320e3)
    net.dc_bus('D2', 320e3)
    net.dc_line('D1', 'D2', R=5.0, L=0.1, C=10e-6, poles=2, name='DL')
    net.vsc('R', 'D1', control='P', P=100e6, Rc=0.0005, Xc=0.05, name='VR')
    net.vsc('I', 'D2', control='V', V=1.0, Rc=0.0005, Xc=0.05, name='VI')
    V = np.asarray(net.acdc_flow()['_V'])
    a = dcgrid._vsc_flow(net, [x for x in net.elements if x['kind'] == 'vsc'], 'auto', 1e-10, None, False, 30, False, False, 0.0)
    add(A, 'η ζεύξη με μια ζεύξη VSC 100 MW: οι τάσεις της ροής φορτίου AC/DC', 'η ροή των VSC μόνη, με τις ισχύεις της ζεύξης LCC σταθερές', 0.0,
        float(np.max(np.abs(np.asarray(a['_V']) - V))), 1e-8, 'pu')


def v51_rows(add):
    """5.1: the two-area system and the excitation systems of IEEE Std 421.5 in RMS, step 1 of ROADMAP §101 (pcl.rms
    two_area_machines, AC1A, PSS1A, PSS2B, the saturation of the DC exciter; tests/test_rms_two_area.py): the load flow and the
    modes of Example 12.6 of Power System Stability and Control against the book, the period of the interarea mode in time
    against its eigenvalue, the small-signal exciter against (8.22)–(8.23), the rectifier regulation of Annex D at the start of
    the AC1A, the PSS2B against the product of its blocks."""
    import math
    import numpy as np
    from pcl import network as N, rms
    A = 'Δυναμική RMS: οι δύο περιοχές και οι διεγέρσεις του IEEE Std 421.5 (5.1)'
    net = N.case_data('two_area')
    pf = net.power_flow()
    add(A, '`two_area` (Παράδειγμα 12.6): το Q της G2 από τη ροή φορτίου', 'το βιβλίο, σ. 813', 235.0, pf['buses']['2']['Q'] / 1e6, 0.5, 'MVAr')

    def sysm(m):
        s = rms.System(N.case_data('two_area'), machines=m, loads=rms.TWO_AREA_LOADS)
        s.init()
        return s

    def inter(s):
        e = s.eigen('qr')
        osc = [q for q in e['modes'] if 0.3 < q['f'] < 0.8 and q['lambda'].imag > 0 and q['zeta'] < 0.5
               and (q['shape']['G1'] * np.conj(q['shape']['G3'])).real < 0]
        return osc[0]
    s = sysm(rms.two_area_machines('manual'))
    m = inter(s)
    add(A, 'σταθερή E_fd: η συχνότητα του διαπεριοχικού τρόπου (G1, G2 απέναντι στις G3, G4)', 'Πίν. E12.3', 0.545, m['f'], 0.005, 'Hz')
    r = s.simulate(26.0, events=[{'t': 0.0, 'kind': 'load', 'bus': '9', 'P': 10.0, 'Q': 0.0},
                                 {'t': 0.1, 'kind': 'load', 'bus': '9', 'P': -10.0, 'Q': 0.0}], h=0.01)
    t = r['t']
    d = r['x'][:, s.state('G1', 'delta')] - r['x'][:, s.state('G3', 'delta')]
    k = t >= 6.0
    z, tk = d[k] - np.mean(d[k]), t[k]
    up = [tk[i] - z[i] * (tk[i + 1] - tk[i]) / (z[i + 1] - z[i]) for i in range(len(z) - 1) if z[i] < 0 <= z[i + 1]]
    add(A, 'το ίδιο στον χρόνο: η συχνότητα της δ₁ − δ₃ από 6 ως 26 s μετά από παλμό φορτίου 10 MW, 0,1 s (h = 10 ms)',
        'η ιδιοτιμή', m['f'], (len(up) - 1) / (up[-1] - up[0]), 0.005 * m['f'], 'Hz')
    m = inter(sysm(rms.two_area_machines('tgr')))
    add(A, 'θυριστορικός διεγέρτης με μείωση του μεταβατικού κέρδους: το πραγματικό μέρος του διαπεριοχικού τρόπου', 'Πίν. E12.4 (iii)',
        0.123, m['lambda'].real, 0.01, '1/s')
    m = inter(sysm(rms.two_area_machines('pss')))
    add(A, 'θυριστορικός διεγέρτης με PSS: ο λόγος απόσβεσης του διαπεριοχικού τρόπου', 'Πίν. E12.4 (iv)', 0.13, m['zeta'], 0.015, '')
    mm = rms.two_area_machines('dc')
    for g in mm:
        mm[g]['avr']['KE'] = 0.05
    s = sysm(mm)
    K = next(q for q in s.kinds if isinstance(q, rms.Unit))
    q = K.p['avr']
    ie = K.states.index('avr_efd')
    X = s.x0[K.x0:K.x0 + K.nx * K.m].reshape(K.m, K.nx).astype(complex)
    X[:, ie] += 1e-30j
    V = s.y0[:s.n][K.bus] + 1j * s.y0[s.n:][K.bus]
    dfe = K.eval(X, V.real.astype(complex), V.imag.astype(complex), 0.0)[0][0, ie].imag / 1e-30
    T = q['TE'][0] / (q['SB'][0] * q['SA'][0] * math.exp(q['SB'][0] * q['e0'][0]) + 0.05)
    add(A, 'διεγέρτης DC με V_X = A_EX·e^(B_EX·E_FD), K_E = 0,05: η σταθερά χρόνου του διεγέρτη στο σημείο λειτουργίας (G1)',
        'T = T_E/(B_EX·S_E + K_E), (8.23)', T, -1 / dfe, 1e-12, 's')
    mm = rms.two_area_machines('manual')
    for g in mm:
        mm[g]['avr'] = {'type': 'ac1a'}
    s = sysm(mm)
    K = next(q for q in s.kinds if isinstance(q, rms.Unit))
    q = K.p['avr']
    ifd = K._machine(s.x0[K.x0:K.x0 + K.nx * K.m].reshape(K.m, K.nx), s.y0[:s.n][K.bus], s.y0[s.n:][K.bus])[7]
    ve = q['VE0']
    add(A, 'AC1A (Πίν. H.8): η αρχή, V_E·F_EX(K_C·I_FD/V_E) στην G1', 'E_FD της αρχής', q['e0'][0],
        float(ve[0] * rms._fex(q['KC'][0] * ifd[0] / ve[0])), 1e-12, 'pu')
    p = rms.PSS2B_DEFAULTS
    w = 2 * math.pi
    sj = 1j * w
    W = sj * p['TW1'] / (1 + sj * p['TW1'])
    ref = p['KS1'] * W * W * ((1 + sj * p['T8']) / (1 + sj * p['T9']) ** int(p['M'])) ** int(p['N']) * ((1 + sj * p['T1']) / (1 + sj * p['T2'])) * ((1 + sj * p['T3']) / (1 + sj * p['T4']))
    mm = rms.two_area_machines('manual')
    for g in mm:
        mm[g]['avr'] = {'type': 'st1a', 'KA': 200.0, 'TR': 0.01}
        mm[g]['pss'] = {'type': 'pss2b'}
    s = sysm(mm)
    K = next(q for q in s.kinds if isinstance(q, rms.Unit))
    keep = K.p['pss']
    K.p['pss'] = {a: (b[:1] if isinstance(b, np.ndarray) else b) for a, b in keep.items()}
    n = K.i_gov - K.i_pss
    Am, C = np.zeros((n, n)), np.zeros(n)
    for j in range(n):
        Z = np.zeros((1, n), complex)
        Z[0, j] += 1e-30j
        y, F = K._pss(Z, np.array([1.0 + 0j]), np.array(K.p['pss']['pe0'], complex))
        Am[:, j], C[j] = F[0].imag / 1e-30, y[0].imag / 1e-30
    y, F = K._pss(np.zeros((1, n), complex), np.array([1.0 + 1e-30j]), np.array(K.p['pss']['pe0'], complex))
    H = C @ np.linalg.solve(sj * np.eye(n) - Am, F[0].imag / 1e-30) + y[0].imag / 1e-30
    K.p['pss'] = keep
    add(A, 'PSS2B (Πίν. H.24): |H(j·2π·1 Hz)| από την ταχύτητα, γραμμικοποίηση με μιγαδικό βήμα', 'K_S1·W²·[(1 + sT8)/(1 + sT9)^M]^N·LL·LL',
        abs(ref), abs(H), 1e-9 * abs(ref), 'pu')

def v516_rows(add):
    """5.0.16: the converters and the HVDC stations of the drawing in RMS, step 2 of ROADMAP §101 (pcl.model converters_of,
    stations_of; tests/test_rms_drawing.py, test_rms.py, test_rms_hvdc.py): a current source of an expression through a lag
    against its closed form, the converter at its bus from the load flow of its EMF, and the drawings ieee9_gfm and b4dcs2
    against their EMT."""
    import json
    import subprocess
    import numpy as np
    from pcl import model, network as N
    A = 'Δυναμική RMS: οι μετατροπείς και οι σταθμοί του σχεδίου (5.0.16)'
    root = Path(__file__).resolve().parents[1]
    node = lambda *a: json.loads(subprocess.run(['node', *a], capture_output=True, text=True, timeout=900, check=True, cwd=root).stdout)
    ast = node('-e', 'const E=require("./web/studio/expr.js");console.log(JSON.stringify(E.parse("t < 0.1 ? 0 : 100",[])))')
    net = N.Network(f=50.0, S_base=100e6)
    net.bus('A', 400e3)
    net.feeder('A', Sk=100e9, RX=0.1, name='QA')
    net.dc_bus('D1', 400e3, C=10e-6)
    net.vsc('A', 'D1', control='V', V=1.0, Prated=100e6, name='S1')
    net.dc_source('D1', I=0.0, name='J1')
    q = net.dynamic(0.3, stations={'J1': {'expr': ast, 'tau': [0.02]}}, h=0.005, record=0.005, buses=[])
    t, i = np.asarray(q['t']), np.asarray(q['dc']['sources']['J1']['I']) * 1e3
    add(A, 'πηγή ρεύματος DC από την έκφραση «t < 0,1 ? 0 : 100» μέσα από LPF 20 ms, h = 5 ms (το βήμα σταματά στα 0,1 s): η μεγαλύτερη διαφορά',
        '100·(1 − e^(−(t − 0,1)/0,02)) A', 0.0, float(np.max(np.abs(i - np.where(t > 0.1, 100 * (1 - np.exp(-(t - 0.1) / 0.02)), 0.0)))), 1.0, 'A')
    m = model.of(node('tests/js/model_cases.js', 'build', 'ieee9_gfm', '{}'))
    lf = model.load_flow(m)
    r0 = model._rms_network(m)[0].load_flow()
    add(A, '`ieee9_gfm`: ο μετατροπέας στον ζυγό του για το RMS, στην τάση που δίνει εκεί η ΗΕΔ του στη ροή φορτίου του σχεδίου: |V₃|',
        'η ροή φορτίου του σχεδίου (`model.load_flow`)', lf['buses']['B3']['V'], r0['buses']['B3']['V'], 1e-9, 'pu')
    js = node('tests/js/rms_gfm_cases.js', 'droop', '4.0')
    te, Y = np.array(js['t']), np.array([[np.nan if v is None else v for v in row] for row in js['y']])
    r = model.dynamic(m, t_end=4.0, h=0.005, record=0.005, buses=[])
    a = te > 0.5
    add(A, '`ieee9_gfm` από το σχέδιο (VSC2 με GFMC σε στατικότητα, +50 MW από τον διακόπτη του στο 1 s), RMS με h = 5 ms: η ω της G1 από 0,5 ως 4 s, η μεγαλύτερη διαφορά',
        'το EMT του ίδιου σχεδίου', 0.0, float(np.max(np.abs(np.interp(te, r['t'], r['machines']['G1']['omega']) - Y[:, 0])[a])), 3e-4, 'pu')
    js = _b4_emt_cd55()
    q = model.dynamic(model.of(node('tests/js/model_cases.js', 'build', 'b4dcs2', '{"ev": "cd55", "ctl": "vdc"}')), t_end=2.5, h=0.005, record=0.005, buses=[])
    te, T = np.array(js['t']), np.asarray(q['t'])
    a = te > 0.5
    du = max(float(np.max(np.abs(np.interp(te, T, q['dc']['buses']['N' + k]['U']) - np.array(js['U'][k]))[a])) for k in ('B2', 'B3', 'B5', 'F1', 'E1'))
    dp = max(float(np.max(np.abs(np.interp(te, T, q['dc']['stations']['MMC' + k]['Pt']) - np.array(js['P'][k]))[a])) for k in ('B2', 'B3', 'F1', 'E1'))
    add(A, '`b4dcs2` από το σχέδιο (οι σταθμοί από τα MMC με τους MMCC τους, το δίκτυο DC από τους κόμβους του, ο Cd-E1 από την έκφρασή του 300 → 55 MW), RMS με h = 5 ms: οι τάσεις DC από 0,5 ως 2,5 s, η μεγαλύτερη διαφορά',
        'το EMT του ίδιου σχεδίου', 0.0, du, 8.5, 'kV')
    add(A, 'το ίδιο: οι ισχείς στους ακροδέκτες των τεσσάρων σταθμών, η μεγαλύτερη διαφορά (στα πρώτα ms μετά το συμβάν)', 'το EMT του ίδιου σχεδίου', 0.0, dp, 53.0, 'MW')


def v515_rows(add):
    """5.0.15: HVDC and DC grids in RMS, step 2 of ROADMAP §101 (pcl.rms HVDC, tests/test_rms_hvdc.py): the island of a station Vf in
    the AC/DC load flow, the V_dc loop of a station on its own capacitance against its closed form, the power loop of the
    grid-following converter 'pi', and the DCS2 of the B4 against the EMT of b4dcs2."""
    import math
    import numpy as np
    from pcl import dcgrid as D, network as N
    A = 'Δυναμική RMS: HVDC και δίκτυα DC (5.0.15)'
    r = D.b4_dcs2_network().acdc_flow(tol=1e-10)
    add(A, 'το DCS2 του B4 όπως το `b4dcs2`, ροή φορτίου AC/DC: ο Cm-E1 σχηματίζει την τάση της νησίδας του (Vf), η ισχύς που της δίνει',
        'το φορτίο σταθερής εμπέδησης της νησίδας', r['buses']['E1']['Pload'] / 1e6, r['converters']['Cm-E1']['Ps'] / 1e6, 1e-6, 'MW')
    net = N.Network(f=50.0, S_base=100e6)
    for b in ('A', 'B'):
        net.bus(b, 400e3)
        net.feeder(b, Sk=100e9, RX=0.1, name='Q' + b)
    net.dc_bus('D1', 400e3)
    net.dc_bus('D2', 400e3)
    net.vsc('A', 'D1', control='V', V=1.0, Prated=100e6, name='S1')
    net.vsc('B', 'D2', control='V', V=1.0, Prated=100e6, name='S2')
    net.dcdc('D2', 'D1', control='P', P=0.0, Prated=100e6, name='DD')
    st = {'S1': {'inner': 'lag', 'Ti': 3e-4, 'bw': 50.0}, 'S2': {'inner': 'lag', 'Ti': 3e-4}, 'DD': {'Tdc': 0.0}}
    q = net.dynamic(0.6, events=[{'t': 0.1, 'kind': 'pref', 'gen': 'DD', 'dP': 0.01}], stations=st, h=0.001, record=0.001)
    t, u = np.asarray(q['t']), np.asarray(q['dc']['buses']['D1']['V'])
    wn = 3 / (0.8 * 0.1)
    wd = wn * math.sqrt(1 - 0.64)
    tt = np.clip(t - 0.1, 0, None)
    add(A, 'ο βρόχος της V_dc ενός σταθμού (T_vdc 0,1 s, ζ = 0,8) με μόνη χωρητικότητα τη δική του (2H = 0,06 s), βήμα 0,01 pu: το μέγιστο του Δu',
        'Δu(t) = ΔP/(2H·ω_d)·e^(−ζω_n t)·sin(ω_d t)', float(np.max(0.01 / (0.06 * wd) * np.exp(-0.8 * wn * tt) * np.sin(wd * tt))), float(np.max(u - 1)), 1e-5, 'pu')
    n2 = N.Network(f=50.0, S_base=100e6)
    n2.bus('S', 400e3)
    n2.feeder('S', Sk=100e9, RX=0.1, name='Q')
    n2.bus('G', 400e3)
    n2.line('S', 'G', 0.0, 1.6, length=1.0)
    n2.generator('G', 100e6, 400e3, 0.2, 1.0, P=50e6, name='C')
    q = n2.dynamic(0.6, events=[{'t': 0.1, 'kind': 'pref', 'gen': 'C', 'dP': 0.1}], h=0.001, record=0.001,
                   machines={'C': {'model': 'gfl', 'cc': 'pi', 'Ti': 3e-4, 'Sn': 100e6, 'bw': 50.0}})
    t, P = np.asarray(q['t']), np.asarray(q['converters']['C']['P'])
    add(A, 'grid-following με τον έλεγχο PI του MMCC (T_p 0,1 s), βήμα +10 MW: η μεγαλύτερη διαφορά', 'P(t) = P₀ + ΔP·(1 − e^(−3t/T_p))', 0.0,
        float(np.max(np.abs(P - 50 - 10 * (1 - np.exp(-3 * np.clip(t - 0.1, 0, None) / 0.1))))), 0.05, 'MW')
    js = _b4_emt_cd55()
    wf = {'WF': {'model': 'gfl', 'cc': 'pi', 'Sn': 600e6, 'X': 0.15, 'R': 0.003, 'bw': 20.0}}
    q = D.b4_dcs2_network().dynamic(2.5, events=[{'t': 1.0, 'kind': 'pref', 'gen': 'Cd-E1', 'dP': -0.245}], machines=wf,
                                    stations=D.b4_dcs2_stations(), h=0.005, record=0.005)
    te, T = np.array(js['t']), np.asarray(q['t'])
    m = te > 0.5
    du = max(float(np.max(np.abs(np.interp(te, T, q['dc']['buses']['Bm-' + k]['U']) - np.array(js['U'][k]))[m])) for k in ('B2', 'B3', 'B5', 'F1', 'E1'))
    dp = max(float(np.max(np.abs(np.interp(te, T, q['dc']['stations']['Cm-' + k]['Pt']) - np.array(js['P'][k]))[m])) for k in ('B2', 'B3', 'F1', 'E1'))
    add(A, 'το DCS2 του B4 (`b4dcs2`), ο Cd-E1 300 → 55 MW στο 1 s, ο Cm-B3 στη V_dc: οι τάσεις των πέντε ζυγών DC από 0,5 ως 2,5 s σε RMS (h = 5 ms), η μεγαλύτερη διαφορά',
        'το EMT του ίδιου tutorial', 0.0, du, 8.5, 'kV')
    add(A, 'το ίδιο: οι ισχείς στους ακροδέκτες των τεσσάρων σταθμών, η μεγαλύτερη διαφορά (στα πρώτα ms μετά το συμβάν)', 'το EMT του ίδιου tutorial', 0.0, dp, 53.0, 'MW')


def v513_rows(add):
    """5.0.13: the RMS dynamics, step 1 of ROADMAP §101 (pcl.rms Unit, tests/test_rms.py Models, Drawing): the subtransient machine
    at its short circuit, the machine of a Unit against the two-axis core of 4.23, a start at rest with every control, the
    drawing of «ieee9_emt» with AVR and PSS against its EMT, and a limit reached inside a step on the IEEE 118."""
    import json
    import math
    import subprocess
    import numpy as np
    from pcl import model as M, network as N, rms, study as S
    A = 'Δυναμική RMS: τα μοντέλα (5.0.13)'
    root = Path(__file__).resolve().parents[1]
    d = {'Xd': 1.81, 'Xdp': 0.3, 'Xdpp': 0.23, 'Xq': 1.76, 'Xqp': 0.65, 'Xqpp': 0.25, 'Xl': 0.15, 'Td0p': 8.0, 'Td0pp': 0.03, 'Tq0p': 1.0,
         'Tq0pp': 0.07, 'Ra': 0.0, 'H': 3.5, 'D': 0.0, 'SG10': 0.0, 'SG12': 0.0}
    U = rms.Unit(['G'], [0], {k: np.array([v]) for k, v in d.items()}, model='subtransient')
    U.init(np.array([1.0 + 0j]), np.array([0j]), 2 * math.pi * 60)
    J = np.zeros((6, 6))
    for j in range(6):
        X = np.zeros((1, U.nx), complex)
        X[0, :6] = (0.3, 1.0, 1.0, 0.1, 0.9, -0.1)
        X[0, j] += 1e-30j
        J[:, j] = U.eval(X, np.zeros(1, complex), np.zeros(1, complex), 0.0)[0][0, :6].imag / 1e-30
    T = sorted(-1 / np.linalg.eigvals(J[np.ix_([2, 4], [2, 4])]).real)
    add(A, 'υπομεταβατικό μοντέλο σε βραχυκύκλωμα (V = 0): T′_d·T″_d', 'T′_d0·T″_d0·X″_d/X_d (η X″_d στο άπειρο της συχνότητας)',
        d['Td0p'] * d['Td0pp'] * d['Xdpp'] / d['Xd'], T[0] * T[1], 1e-14, 's²')
    FULL = {g: {k: v for k, v in q.items() if k in ('Sn',) + rms.SUB_KEYS} for g, q in N.IEEE9_MACHINES.items()}
    KEYS = ('Xd', 'Xdp', 'Xq', 'Xqp', 'Td0p', 'Tq0p', 'Ra', 'H', 'D', 'Sn')
    F = [{'t': 0.0, 'kind': 'fault', 'bus': '8'}, {'t': 5 / 60, 'kind': 'clear', 'bus': '8'}, {'t': 5 / 60, 'kind': 'trip', 'branch': 'br8'}]

    def delta(m):
        s = rms.System(N.ieee9(), machines=m, f=60)
        s.init()
        r = s.simulate(2.0, events=F, h=0.002)
        return np.degrees(r['x'][:, [s.state(g, 'delta') for g in ('G1', 'G2', 'G3')]])
    D0 = delta({g: {'model': 'two_axis', **{k: v for k, v in q.items() if k in KEYS}} for g, q in N.IEEE9_MACHINES.items()})
    D1 = delta({g: {'model': 'subtransient', **FULL[g]} for g in FULL})
    add(A, 'IEEE 9, σφάλμα 5 κύκλων: η μηχανή μιας μονάδας χωρίς αποσβεστήρες (T″ = 0), δ σε 2 s, η μεγαλύτερη διαφορά', 'ο πυρήνας της 4.23 (δύο άξονες)',
        0.0, float(np.max(np.abs(D1 - D0))), 1e-7, '°')
    PR = {'G1': 2.475, 'G2': 1.92, 'G3': 1.28}
    m = {'G1': {'model': 'two_axis', **FULL['G1'], 'avr': {'type': 'dc1a'}, 'gov': {'type': 'hydro', 'Pr': PR['G1']}},
         'G2': {'model': 'subtransient', **FULL['G2'], 'Xdpp': 0.09, 'Xqpp': 0.09, 'Td0pp': 0.03, 'Tq0pp': 0.05, 'SG10': 0.1, 'SG12': 0.4,
                'avr': {'type': 'st1a', 'TA': 0.02, 'KF': 0.05, 'TB': 1.0, 'TC': 0.5}, 'pss': True, 'gov': {'type': 'steam', 'Pr': PR['G2']}},
         'G3': {'model': 'two_axis', **FULL['G3'], 'avr': {'type': 'st1a'}, 'pss': True, 'gov': {'type': 'steam', 'Pr': PR['G3']}}}
    s = rms.System(N.ieee9(), machines=m, f=60)
    s.init()
    r = s.simulate(5.0, h=0.01)
    add(A, 'IEEE 9 με DC1A, ST1A, PSS, ρυθμιστές νερού και ατμού, κορεσμό: καμία διαταραχή, η μεγαλύτερη μεταβολή κατάστασης σε 5 s', 'ακίνητο', 0.0,
        float(np.max(np.abs(r['x'] - r['x'][0]))), 1e-12, '')
    node = lambda *a: json.loads(subprocess.run(['node', *a], capture_output=True, text=True, timeout=900, check=True).stdout)   # noqa: E731
    pr = node(str(root / 'tests' / 'js' / 'model_cases.js'), 'build', 'ieee9_emt', '{"ev": "full", "ctl": "avr_pss"}')
    res = S.run({'drawing': M.of(pr), 'study': 'rms', 'options': {'t_end': 2.0, 'h': 0.005, 'record': 0.002}})['result']
    js = node(str(root / 'tests' / 'js' / 'rms_emt_cases.js'), '2.0', 'full', 'avr_pss')
    te, De = np.array(js['t']), np.degrees(np.unwrap(np.radians(np.array(js['d'])), axis=0))
    R = np.interp(te, np.array(res['t']), np.array(res['machines']['G2']['delta']) - np.array(res['machines']['G1']['delta']))
    add(A, 'το σχέδιο του «ieee9_emt» με AVR ST1A και PSS, σφάλμα και διακόπτες του σχεδίου: η πρώτη ταλάντωση της δ₂ − δ₁ σε RMS (h = 5 ms)',
        'το EMT του ίδιου σχεδίου', float(np.max(De[:, 1] - De[:, 0])), float(R.max()), 1.5, '°')
    net = N.ieee(118)
    pf = net.power_flow()
    ty = rms.typical(net, pf=pf)
    s = rms.System(net, machines=ty, pf=pf)
    s.init()
    big = max(ty, key=lambda g: pf['buses'][net.element(g)['bus']]['P'])
    r = s.simulate(2.0, events=[{'t': 0.1, 'kind': 'gen', 'gen': big}], h=0.01, slow_after=8)
    add(A, f'IEEE 118 με τυπικά δεδομένα, απώλεια της {big}: βήματα των 10 ms χωρίς σύγκλιση σε 2 s (μια βαλβίδα φτάνει στο όριό της μέσα σε βήμα)',
        'τα όρια χωρίς windup αποφασισμένα στην αρχή του βήματος', 0.0, float(r['stats']['nonconv']), 0.0, '')



def v509_rows(add):
    """5.0.9: the FDNE of many ports (pcl.equivalent.fdne, EQV3 'fdne', tests/test_equivalent.py TestFDNE): the fit against the scan
    of two ports, its passivity, and the start of the area against the load flow."""
    import numpy as np
    import pcl
    from pcl import network as N
    from pcl import equivalent as Q
    A = 'Το FDNE πολλών θυρών (5.0.9)'
    net = N.ieee(9)
    lf = net.load_flow()
    S = Q.scan(net, ['5', '9'], ['1'], lf=lf, machines=N.IEEE9_MACHINES)
    F = Q.fdne(S['f'], np.linalg.inv(S['Z1']), np.linalg.inv(S['Z0']), net.f)
    add(A, 'IEEE 9, σύνορο 5, 9, 5 Hz – 2 kHz: απόκλιση |ΔZ_kk|/|Z_kk| θετικής ακολουθίας, rms', 'η σάρωση', 0.0, 100 * F['err1']['rms'], 3.0, '%')
    add(A, 'το ίδιο, μηδενική ακολουθία, rms', 'η σάρωση', 0.0, 100 * F['err0']['rms'], 3.0, '%')
    add(A, 'η μικρότερη ιδιοτιμή του Re Y προς τη μεγαλύτερη, 0,5 Hz – 20 kHz και f → ∞ (θετική ακολουθία)', '≥ 0 (παθητικό)', 0.0, min(0.0, F['lam1']), 1e-9, '')
    pr = net.to_emt(lf, machines=N.IEEE9_MACHINES, boundary=['5', '9'], internal=['1'], fig='fdne')
    r = pcl.Project(pr).run(0.1, channels=['Y:G1:pe'])
    add(A, 'η περιοχή {1, 4} με το FDNE: P της G1 στα 0,1 s', 'η ροή φορτίου', lf['buses']['1']['P'] / 100e6, float(r['Y:G1:pe'][-1]), 1e-4, 'pu')


def v507_rows(add):
    """5.0.7: the scan of the network beyond the boundary and the Foster circuit of Fig. 15a (pcl.equivalent.scan, foster,
    tests/test_equivalent.py TestFoster): the scan at the fundamental against the Thevenin of emt_ports, the scan of a long line
    against its formula, the fit against the scan, and a fault in the area against the full network in EMT."""
    import numpy as np
    import pcl
    from pcl import network as N
    from pcl import equivalent as Q
    A = 'Η σάρωση και το Foster του Σχ. 15a (5.0.7)'
    net = N.ieee(9)
    lf = net.load_flow()
    S = Q.scan(net, ['4'], ['1'], lf=lf, machines=N.IEEE9_MACHINES, f=[net.f])
    q = Q.emt_ports(net, ['4'], ['1'], lf=lf, machines=N.IEEE9_MACHINES)
    add(A, 'IEEE 9, σύνορο 4: Z₁ της σάρωσης στη θεμελιώδη, σχετική διαφορά', 'το Thevenin του emt_ports', 0.0, float(abs(S['Z1'][0, 0, 0] / q['Z1'][0, 0] - 1)), 1e-12, '')
    ln = N.Network(f=50.0)
    for b in ('I', 'A', 'X'):
        ln.bus(b, 220e3)
    ln.feeder('X', Sk=5e9, RX=0.1, slack=True)
    ln.line('I', 'A', 0.05, 0.4, length=50, B=2.8e-6)
    ln.line('A', 'X', 0.03, 0.32, length=300, B=3.6e-6)
    ln.load('I', 50e6, 10e6)
    zb = 220e3 ** 2 / 100e6
    zf = (0.1 + 1j) / np.hypot(0.1, 1) * 1.1 * 100e6 / 5e9 * zb
    Z = Q.scan(ln, ['A'], ['I'], f=[480.0], line='distributed')['Z1'][0, 0, 0] * zb
    zl, z, y = complex(zf.real, zf.imag * 9.6), complex(0.03, 0.32 * 9.6) * 300, 1j * 3.6e-6 * 9.6 * 300
    zc, gl = np.sqrt(z / y), np.sqrt(z * y)
    want = zc * (zl + zc * np.tanh(gl)) / (zc + zl * np.tanh(gl))
    add(A, 'γραμμή 300 km κλεισμένη σε τροφοδότηση, 480 Hz: εμπέδηση εισόδου, σχετική διαφορά', 'ο τύπος της μακριάς γραμμής', 0.0, float(abs(Z / want - 1)), 1e-10, '')
    qf = Q.emt_ports(net, ['4'], ['1'], lf=lf, machines=N.IEEE9_MACHINES, fig='15a')
    add(A, 'IEEE 9, σύνορο 4, 5 Hz – 2 kHz: απόκλιση |ΔZ₁|/|Z₁| των κλάδων Foster, rms', 'η σάρωση', 0.0, 100 * qf['foster']['err1']['rms'], 5.0, '%')
    full = net.to_emt(lf, machines=N.IEEE9_MACHINES)
    area = net.to_emt(lf, machines=N.IEEE9_MACHINES, boundary=['4'], internal=['1'], fig='15a')

    def peak(pr):
        import copy
        pr = copy.deepcopy(pr)
        pr['components'].append({'id': 'F1', 'type': 'FLT3', 'x': 0, 'y': 0, 'rot': 0, 'flip': False, 'label': 'F1',
                                 'params': {'kind': 'abcg', 'ton': 0.05, 'toff': 0.12, 'Rf': 0, 'Rg': 0, 'conn': 'bus'}})
        pr['wires'].append({'id': 'wf', 'a': {'c': 'F1', 'p': 'abc'}, 'b': {'c': 'B4', 'p': 'j'}, 'pts': []})
        r = pcl.Project(pr).run(0.1, channels=['Y:F1/Ia'])
        t, y = np.array(r.t), np.array(r['Y:F1/Ia'])
        return float(np.abs(y[(t > 0.05) & (t < 0.07)]).max())
    pf = peak(full)
    add(A, 'IEEE 9, τριφασικό σφάλμα στον ζυγό 4: πρώτη κορυφή του i_a με το Σχ. 15a', 'το πλήρες δίκτυο σε EMT', pf, peak(area), 0.025 * pf, 'A')


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
    # 3.17: subcircuits, N instances of one buck leg with phases k·360°/N (V_in 48 V, L 100 μH, f_s 50 kHz, R 2 Ω)
    for key, N, D in (('n3', 3, .5), ('n2', 2, .5), ('n4', 4, .3)):
        q = o['sub_legs'][key]
        m = math.floor(N * D + 1e-9)
        dS = 48 * (N * D - m) * (m + 1 - N * D) / (N * 100e-6 * 50e3)
        add('Υποκυκλώματα', f'{N} σκέλη (instances), D = {str(D).replace(".", ",")}: Δi του αθροίσματος', 'Δi_Σ = V_in(N·D − m)(m + 1 − N·D)/(N·L·f_s), m = ⌊N·D⌋',
            dS, q['sum'], 2e-3, 'A')
        if key == 'n3':
            add('Υποκυκλώματα', '3 σκέλη, D = 0,5: Δi σκέλους', 'Δi = V_in·D(1 − D)/(L·f_s)', 48 * .25 / (100e-6 * 50e3), q['leg'], 2e-3, 'A')
            add('Υποκυκλώματα', '3 σκέλη, D = 0,5: ρεύμα ανά σκέλος (το μεγαλύτερο)', 'I_o/N = D·V_in/(R·N)', 4.0, max(q['legs'], key=lambda x: abs(x - 4)), 5e-3, 'A')
    # 3.18: buses and vectors, the dq current loop on buses (E 325 V, R 0,5 Ω, L 5 mH, 50 Hz, f_c 200 Hz, i_d* 10 A, i_q* 5 A)
    q = o['bus_dq']['on']
    wc, w, R, L, E, i_d, i_q = 2 * math.pi * 200, 2 * math.pi * 50, .5, 5e-3, 325, 10, 5
    add('Δίαυλοι', 'βρόχος dq σε δίαυλο: σταθερά χρόνου του i_d', 'K_p = ω_c·L, K_i = ω_c·R: i_d/i_d* = ω_c/(s + ω_c), τ = 1/ω_c', 1 / wc, q['tau'], .01 / wc, 's')
    add('Δίαυλοι', 'βρόχος dq: i_d και i_q στη μόνιμη κατάσταση', 'ολοκληρωτής: i_dq = i*_dq (i_d)', i_d, q['id'], .01, 'A')
    add('Δίαυλοι', 'βρόχος dq: i_q στη μόνιμη κατάσταση', 'ολοκληρωτής: i_dq = i*_dq (i_q)', i_q, q['iq'], .01, 'A')
    add('Δίαυλοι', 'αποσύζευξη ωL: μεταβολή του i_d στο βήμα του i_q', 'ιδανική αποσύζευξη: Δi_d = 0', 0, q['dev'], .05, 'A')
    add('Δίαυλοι', 'πλάτος ρεύματος φάσης', 'Î = √(i_d² + i_q²) (Clarke με διατήρηση πλάτους)', math.hypot(i_d, i_q), q['ia'], .01, 'A')
    vd, vq = E + R * i_d - w * L * i_q, R * i_q + w * L * i_d
    add('Δίαυλοι', 'πλάτος τάσης του μετατροπέα', 'V̂ = |e + (R + jωL)·i| στο dq', math.hypot(vd, vq), q['va'], .2, 'V')
    # 3.19: B1 blocks (second-order filter, rate limiter, edge detector, rate transition), input held over the 1 μs step
    q = o['b1']
    z, f0 = .3, 1000.0
    add('Μπλοκ B1', 'βαθυπερατό 2ης τάξης, ζ = 0,3: υπερύψωση στο βήμα', 'M_p = exp(−πζ/√(1 − ζ²))', math.exp(-math.pi * z / math.sqrt(1 - z * z)), q['ov'], 1e-4, '')
    add('Μπλοκ B1', 'βαθυπερατό 2ης τάξης, f₀ = 1 kHz: χρόνος κορυφής', 't_p = π/(ω₀·√(1 − ζ²))', math.pi / (2 * math.pi * f0 * math.sqrt(1 - z * z)), q['tp'], 2e-6, 's')
    add('Μπλοκ B1', 'βαθυπερατό 2ης τάξης: κέρδος στο f₀', '|H(jω₀)| = 1/(2ζ)', 1 / (2 * z), q['lp'], 2e-3, '')
    add('Μπλοκ B1', 'ζωνοπερατό 2ης τάξης: κέρδος στο f₀', '|2ζω₀·jω₀/D(jω₀)| = 1', 1.0, q['bp'], 1e-3, '')
    add('Μπλοκ B1', 'notch στο f₀: ημίτονο 1 στο f₀ στη μόνιμη κατάσταση', '|H(jω₀)| = 0', 0.0, q['notch'], 1e-3, '')
    add('Μπλοκ B1', 'όριο ρυθμού 500 1/s: 1 ms μετά το βήμα', 'y = R·(t − t₀)', 500 * 1e-3, q['rl'], 1e-3, '')
    add('Μπλοκ B1', 'ανιχνευτής ακμής, ρολόι 1 kHz, 10,5 ms', 'n = ⌊f·t⌋ + 1 (η ακμή στο t = 0 μετρά)', math.floor(1000 * .0105) + 1, q['ed']['n'], 0, '')
    add('Μπλοκ B1', 'μετάβαση ρυθμού με καθυστέρηση, u = 1000·t, ρολόι 1 kHz, t = 10,5 ms', 'y = u(t_{k−1}) = 1000·(⌊f·t⌋ − 1)/f', 9.0, q['ed']['delay'], 1e-9, '')
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
    # 3.15: programmed jumps (backward Euler after them, the value before the jump at the end of the step) and the check per topology
    jp = st['jump']
    add('Βήμα του λύτη', 'άλμα πηγής από πρόγραμμα (0 → 10 V στο 1 ms), RC με τ = 10 ns, h = 5 μs: μέγιστο |v_C − ακριβής| μετά το άλμα', 'v_C = V(1 − e^{−(t − t_j)/τ})', 0, jp['tr']['after'], 1e-4, 'V')
    add('Βήμα του λύτη', 'άλμα αντίστασης από πρόγραμμα (1 MΩ → 1 Ω): μέγιστο |v_C − ακριβής| πριν και μετά', 'δύο φορτίσεις RC με συνέχεια της v_C', 0, max(jp['res']['before'], jp['res']['after']), 1e-4, 'V')
    # 3.15: the impulse tools in Python against the MATLAB tools' own results (their CSV rows, branch ref-materials)
    import sys as _s
    _s.path.insert(0, str(ROOT))
    from pcl import impulse as IMP
    h = IMP.fit_heidler(1e-6, 200e-6, -100000, 10, 'auto')
    add('Εργαλεία παραμέτρων', 'Heidler 1/200 (AutoH): τ₁', 'Lightning Impulse Manager 1.2.0, ls_params (MATLAB, δείγματα 1 ns)', 1.83192713504729e-6, h['tau1'], 1e-5 * 1.832e-6, 's')
    add('Εργαλεία παραμέτρων', 'Heidler 1/200 (AutoH): τ₂', 'Lightning Impulse Manager 1.2.0', 284.843991112265e-6, h['tau2'], 1e-5 * 284.8e-6, 's')
    add('Εργαλεία παραμέτρων', 'Heidler 1/200 (AutoH): η', 'Lightning Impulse Manager 1.2.0', 0.986296525678929, h['eta'], 1e-6, '')
    v = IMP.fit_profile('IEC2025_LI', 100e3)
    add('Εργαλεία παραμέτρων', 'LI 1,2/50 (IEC 60060-1): α', 'Voltage Impulse GUI 1.1, voltage_impulse_params (MATLAB)', 14659.1086811327, v['alpha'], 1e-6 * 14659, '1/s')
    add('Εργαλεία παραμέτρων', 'LI 1,2/50: β', 'Voltage Impulse GUI 1.1', 2468926.6530487, v['beta'], 1e-6 * 2.469e6, '1/s')
    add('Εργαλεία παραμέτρων', 'LI 1,2/50: K', 'Voltage Impulse GUI 1.1', 1.03725220061775, v['K'], 1e-8, '')
    si = IMP.fit_profile('IEC2010_SI_LEGACY', 30e3)
    add('Εργαλεία παραμέτρων', 'SI 250/2500 (Tp/T2): α', 'Voltage Impulse GUI 1.1', 316.955654538579, si['alpha'], 1e-6 * 317, '1/s')
    add('Εργαλεία παραμέτρων', 'SI 250/2500 (Tp/T2): β', 'Voltage Impulse GUI 1.1', 16004.3786899236, si['beta'], 1e-6 * 16004, '1/s')
    # 4.1.1: the rows of the tools as they write them (sampled measurements, closed-form peak), and the front line
    hr = IMP.heidler_row(1, 200, -100000, 10, 'AutoH', 0.93, 1.8319, 284.844)
    add('Εργαλεία παραμέτρων', 'γραμμή Heidler 1/200, −100 kA: τ₁ (στο δείγμα 1 ns)', 'Lightning Impulse Manager 1.2.0 (ls_params)', 1.83192713504729, hr['tau1_opt_us'], 1e-8 * 1.832, 'μs')
    add('Εργαλεία παραμέτρων', 'ίδια: T2 μετρημένο στο δείγμα', 'Lightning Impulse Manager 1.2.0 (ls_params)', 199.999999999599, hr['T2_opt_calc_us'], 1e-8 * 200, 'μs')
    vr = IMP.voltage_row(1.2, 50, 100, 'IEC_T1_T2', 'IEC2025_LI', tol_X=30, tol_Y=20)['row']
    add('Εργαλεία παραμέτρων', 'γραμμή LI 1,2/50: T1 στο δείγμα 1 ns', 'Voltage Impulse GUI 1.1 (voltage_impulse_params)', 1.20000001825348, vr['T1_sampled_us'], 1e-8 * 1.2, 'μs')
    vs = IMP.voltage_row(250, 2500, 30, 'TP_T2', 'IEC2010_SI_LEGACY', dt=1e-7, tend=0.005, tol_X=20, tol_Y=60)['row']
    add('Εργαλεία παραμέτρων', 'γραμμή SI 250/2500: Tp κατά το Παράρτημα F', 'Voltage Impulse GUI 1.1 (voltage_impulse_params)', 247.344160966999, vs['Tp_AnnexF_us'], 1e-8 * 247, 'μs')
    g = IMP.frontline_geometry(118e3, 5.1002e-6, 65.0497e-6, 10, 0.8746)
    add('Εργαλεία παραμέτρων', 'γεωμετρία μετώπου Heidler: T1_geom/(t90 − t10)', 'ευθεία από το 10 % και το 90 %: 1/0,8', 1.25, g['ratio'], 1e-12, '')
    net_rows(o['net'], add)
    # 4.2: IEC 60909-0:2016 on the test network of IEC TR 60909-4:2021 §9, and the load flow on IEEE 9/14
    from pcl import network as NW
    from tests.test_network import IK, IK1, IB, IP50, IP20, IKS, tr60909_4
    tn = tr60909_4()
    ref = 'IEC TR 60909-4:2021, Πίνακας 22'
    for i, b in enumerate('12345678'):
        add('IEC 60909 (4.2)', f'δίκτυο δοκιμής, ζυγός {b}: I″k', ref, IK[i], tn.short_circuit(b, '3ph')['Ik'] / 1e3, 2e-4 * IK[i], 'kA')
    for i, b in enumerate('16'):
        j = int(b) - 1
        r = tn.short_circuit(b, '3ph', f115=False)
        add('IEC 60909 (4.2)', f'ζυγός {b}: i_p, μέθοδος Β χωρίς 1,15', ref, IP50[j], r['ip_b0'] / 1e3, 2e-4 * IP50[j], 'kA')
        add('IEC 60909 (4.2)', f'ζυγός {b}: i_p, μέθοδος C (20 Hz, R_Gf)', ref, IP20[j], tn.short_circuit(b, '3ph', rgf=True)['ip_c'] / 1e3, 2e-4 * IP20[j], 'kA')
        add('IEC 60909 (4.2)', f'ζυγός {b}: I_k = I″kM0', ref, IKS[j], r['Ik_ss'] / 1e3, 2e-4 * IKS[j], 'kA')
    add('IEC 60909 (4.2)', 'ζυγός 2: I_b, Formula (77) (2016)', ref, IB[1], tn.short_circuit('2', '3ph')['Ib'] / 1e3, 2e-4 * IB[1], 'kA')
    add('IEC 60909 (4.2)', 'ζυγός 7: I_b, Formula (77) με jX″ (2001)', ref, IB[6], tn.short_circuit('7', '3ph', breaking='x')['Ib'] / 1e3, 2e-4 * IB[6], 'kA')
    for i, b in enumerate('25'):
        j = '2345'.index(b)
        add('IEC 60909 (4.2)', f'ζυγός {b}: I″k1 (γη)', 'IEC TR 60909-4:2021, Πίνακας 23', IK1[j], tn.short_circuit(b, '1ph')['Ik'] / 1e3, 2e-4 * IK1[j], 'kA')
    lf9 = NW.ieee9().load_flow(tol=1e-12)
    add('Ροή φορτίου (4.2)', 'IEEE 9 ζυγών: |V| στον ζυγό 9', 'PYPOWER (runpf) στα ίδια δεδομένα', 0.995631, lf9['buses']['9']['V'], 2e-6, 'pu')
    add('Ροή φορτίου (4.2)', 'IEEE 9 ζυγών: γωνία στον ζυγό 9', 'PYPOWER (runpf) στα ίδια δεδομένα', -3.988805, lf9['buses']['9']['angle'], 2e-5, '°')
    lf14 = NW.ieee14().load_flow()
    add('Ροή φορτίου (4.2)', 'IEEE 14 ζυγών: |V| στον ζυγό 14', 'λύση του αρχείου IEEE (3 δεκαδικά)', 1.036, lf14['buses']['14']['V'], 1.5e-3, 'pu')
    add('Ροή φορτίου (4.2)', 'IEEE 14 ζυγών: απώλειες', 'PYPOWER (runpf) στα ίδια δεδομένα', 13.393272, lf14['losses'] / 1e6, 1e-5, 'MW')
    pf_rows(add)
    start_rows(add)
    big_rows(add)
    view_rows(add)
    file_rows(add)
    scopf_rows(add)
    dcgrid_rows(add)
    b4_rows(add)
    gfm3_rows(add)
    gfm4_rows(add)
    gfm5_rows(add)
    v421_rows(add)
    v422_rows(add)
    v423_rows(add)
    v424_rows(add)
    v50_rows(add)
    v501_rows(add)
    v503_rows(add)
    v504_rows(add)
    v506_rows(add)
    v507_rows(add)
    v509_rows(add)
    v511_rows(add)
    v512_rows(add)
    v513_rows(add)
    v514_rows(add)
    v515_rows(add)
    v516_rows(add)
    v517_rows(add)
    v518_rows(add)
    v51_rows(add)
    v5_1_1_rows(add)
    v5_1_2_rows(add)
    v5_1_4_rows(add)
    v5_1_5_rows(add)
    v5_1_6_rows(add)
    v5_1_7_rows(add)
    cpf_rows(add)
    sweepc_rows(add)
    se_rows(add)
    harmonic_rows(add)
    unbalanced_rows(add)
    meas_rows(add)
    gen_rows(o['gen'], add)
    trv_rows(add)
    line_rows(add)
    cable_rows(add)
    tp = [d for d in st['topo']['run'] if d['key'] == 'topo:mode:r:CS']
    add('Βήμα του λύτη', 'έλεγχος ανά τοπολογία: στιγμή της πρώτης αγωγής του διακόπτη (ρολόι 1 kHz, φάση 180°)', 't = T/2', 5e-4, tp[0]['t'] if tp else float('nan'), 1e-9, 's')
    return rows


TESTS = [
    ('tests/test_studio_sim.py', 'λύτης του browser', 'κλειστοί τύποι DC-DC και ανορθωτών, ανεξάρτητες ΔΕ (μηχανές ΣΡ, επαγωγής, σύγχρονη, SRM, συζευγμένα πηνία), IEC 62305-1, IEC 60060-1, πλέγμα Bewley, δειγματοληψία, μπλοκ σημάτων'),
    ('tests/test_tutorials.py', 'tutorials όπως ανοίγουν στην εφαρμογή', 'θεωρία των καρτών, ισοδύναμα κυκλώματα, MTPA, ισοζύγιο ενέργειας SRM, μέθοδος των χαρακτηριστικών, ασκήσεις 15.3.1–15.3.7, 15.4.9 και 15.5.3 και γεννήτρια Marx (σχέσεις 3.21–3.44) του βιβλίου «Υψηλές Τάσεις», αποκομμένη κρουστική (IEC 60076-3), λύση Heaviside της γραμμής με απώλειες, κριτήριο ενέργειας διάσπασης'),
    ('tests/test_batch.py', 'λύτης SciPy (solve_ivp) στο ίδιο netlist', 'δεύτερος, ανεξάρτητος λύτης: ίδιες κυματομορφές σε 1e-4 … 1e-7, και για γραμμές (και με απώλειες), αλεξικέραυνα, σπινθηριστές (και με καμπύλη τάσης–χρόνου) και τα tutorials υψηλών τάσεων'),
    ('tests/test_templates.py, test_engine.py', 'συμβολική λύση και templates', 'λύσεις των ασκήσεων (PE2, Άσκηση 2) με SymPy'),
    ('tests/test_step.py', 'βήμα του λύτη (3.13, 3.15)· όρια του βήματος (4.19.1)', 'μεταβλητό βήμα απέναντι σε κλειστούς τύπους (RLC, γεννήτρια κρουστικών) και σε λεπτό σταθερό βήμα (flyback, Marx), σταθερές χρόνου και συχνότητες του ελέγχου βήματος, ταλάντωση δύο βημάτων· 4.19.1: το μέγιστο βήμα από το κύκλωμα με τον λόγο του (`StepCheck.limit`, `Sim.stepInfo()`), το ελάχιστο βήμα ως ρύθμιση (`solve.hmin`, ως ns), «Αυτόματα» ίδιο βήμα προς βήμα με την 4.19, προειδοποιήσεις `hlim`/`hminlim`'),
    ('tests/test_addons.py', 'πρόσθετα, σύνδεση, εργαλεία κρουστικών (3.15)', 'τα CSV των Lightning Impulse Manager 1.2.0 και Voltage Impulse GUI 1.1 (MATLAB), IEC 62305-1 10/350, ασφάλεια (Host, token, διαδρομές zip)'),
    ('tests/test_stream.py', 'αποτελέσματα σε κομμάτια και συνέχεια (3.16)', 'ίδιοι αριθμοί με ένα τρέξιμο χωρίς διακοπή: κομμάτια, συνέχεια από αποθηκευμένη κατάσταση, σε όλα τα tutorials (και με μεταβλητό βήμα και μπλοκ Python) διαφορά 0· σάρωση που συνεχίζει'),
    ('tests/test_subcircuit.py', 'υποκυκλώματα (3.17)', 'το ίδιο κύκλωμα ανοιχτό, ως instance και πάλι ανοιχτό (ίδια βήματα, 1e-9), PWM από μπλοκ ως υποκύκλωμα bit προς bit, δύο instances με άλλα f_s και κλίση = δύο σχεδιασμένοι διαμορφωτές, εμφωλευμένα, αναδρομή, ορισμός που λείπει, λύτης SciPy, pcl με διαδρομές'),
    ('tests/test_bus.py', 'δίαυλοι και διανύσματα (3.18)', 'το ίδιο κύκλωμα με χωριστά σύρματα: ίδια βήματα και ίδιοι αριθμοί bit προς bit, PI διανύσματος = δύο βαθμωτοί βρόχοι bit προς bit, θύρα υποκυκλώματος πλάτους 3 (1e-9), SciPy στο ίδιο βαθμωτό κύκλωμα (1e-6), i_dq στις αναφορές'),
    ('tests/test_units.py', 'μονάδες και τύποι θυρών (3.19, 4.0)', 'τύποι κατά μήκος abc → αβ → dq, ∫ω = θ, σφάλμα για αβ σε είσοδο dq, προειδοποιήσεις για μονάδες, «αυστηρός» και «χωρίς έλεγχο», κανένα μήνυμα σε κανένα tutorial· V·A = W, τ·ω = W, V/V = 1 (4.0)'),
    ('tests/test_impulse_tools.py', 'τα υπόλοιπα των εργαλείων κρουστικών (4.1.1)', 'κάθε πεδίο των CSV των Lightning Impulse Manager 1.2.0 και Voltage Impulse GUI 1.1 (10⁻⁸), ονόματα αρχείων, πίνακας επαλήθευσης, γεωμετρία μετώπου (1,25, O1 του IEC 62305-1, και με αρνητικό ρεύμα), σύγκριση με CSV τύπου EMTP (στήλες με τον αριθμό τους, μονάδα, ευθυγράμμιση, πολικότητα, κανονικοποίηση)'),
    ('tests/test_netlib.py', 'βιβλιοθήκη δικτύου (4.1)', 'IEC 60909 με συμμετρικές συνιστώσες σε κάθε είδος σφάλματος (I″k3, I″k2, I″k1, I″kE2E), S″k1, μονωμένος ουδέτερος, κρουστικό ρεύμα και κ, οι 13 ομάδες σύνδεσης (0°, ±30°), u_k, P και Q φορτίων Y/Δ, διακοπή στο μηδέν του ρεύματος, δίαυλος = χωριστά σύρματα, μέσα σε υποκύκλωμα bit προς bit, SciPy (2·10⁻⁴); 4.2: ΗΕΔ U_n/√3, φορτίο ZIP (P, Q σε 1 % / 2 %, και Δ), πυρήνας τριών σκελών (I₀ = I_r για i₀₀ = 100 %, θετική ακολουθία ίδια), τάση πόλων, ζωντανές παράμετροι με τις καταστάσεις'),
    ('tests/test_network.py', 'ροή φορτίου και IEC 60909-0 (4.2)', 'το δίκτυο δοκιμής του IEC TR 60909-4:2021 §9: διορθωμένες εμπεδήσεις (Πίνακας 21), I″k, i_p (Β και 20 Hz), I_k, I_b, I″k1, i_p1 με κ(1) και κ(012), X₀/X₁ (Πίνακες 22–23, 0,02 %)· ροή φορτίου IEEE 9 και 14 απέναντι στο PYPOWER και στη λύση του αρχείου IEEE· ταυτότητες των ασύμμετρων σφαλμάτων· ZIP· TRV 1 − cos'),
    ('tests/test_generator.py', 'σύγχρονη γεννήτρια, άξονας, εκκίνηση από ροή φορτίου (4.3)', 'IEEE First Benchmark Model: τα τυπικά δεδομένα δίνουν τον Πίνακα I, οι ρυθμοί του Σχ. 4 (0,03 Hz), η αυτοδιέγερση 1-S (1,525 1/s και οι τρεις κρίσιμες τιμές), οι ροπές του Σχ. 5 στο σφάλμα 1-T· καμπύλη απόσβεσης του τριφασικού βραχυκυκλώματος (1,5 %)· IEEE 9 σε EMT = ροή φορτίου (10⁻⁵ pu, 10⁻³°), δ του Anderson & Fouad (0,01°), αιώρηση του Παραδείγματος 2.7· SciPy (10⁻⁴ pu)'),
    ('tests/test_lines.py', 'γραμμές και καλώδια από γεωμετρία, CP και FD (4.4, 4.5)', 'Dommel Πίνακες 4.1, 4.3, 4.4 (επιδερμικό φαινόμενο, ακολουθίες γραμμής 500 kV ως 100 kHz), σειρά Carson απέναντι στο ολοκλήρωμά του, ανοχές της προσαρμογής, μετασχηματισμός Laplace απέναντι σε κλειστούς τύπους, ο λύτης του browser απέναντι στο ίδιο μοντέλο και στην ακριβή γραμμή· καλώδια (4.5): βρόχοι απέναντι σε υπολογισμό πεδίου (10⁻⁶), Pollaczek απέναντι σε Wedepohl, βαθύ καλώδιο = άπειρο μέσο, ομοαξονικός ρυθμός, χωρητικότητα, αιτιατό tanδ, υποβρύχιο καλώδιο στον λύτη απέναντι στο ακριβές, το tutorial των καλωδίων'),
    ('tests/test_line_solver.py', 'γραμμές από γεωμετρία στον λύτη (4.12)', 'εκκίνηση από μόνιμη κατάσταση CP (όλα τα είδη), FD, π απέναντι στη λύση φασιθετών με την admittance του μοντέλου (2·10⁻⁵, χωρίς ~0,9)· μεταθέσεις σε τρία τμήματα απέναντι στο NLT των ίδιων τμημάτων (3·10⁻³) και διαφορά από την τέλεια μετάθεση· CP και FD στον SciPy απέναντι στον browser (ενεργοποίηση 3·10⁻³ / 10⁻³, μόνιμη κατάσταση 2·10⁻⁵)· κεραυνός με την τάση λειτουργίας· θερμοκρασία, ευαισθησία, γραμμή τηλεπικοινωνιών'),
    ('tests/test_wb.py', 'γραμμές και καλώδια wideband (ULM) και cross-bonding (4.13)', 'vector fitting σε συνθετικές ρητές συναρτήσεις (πόλοι σε 10⁻⁶), στενή ζώνη με δείγματα ασφαλείας παθητική με επιβολή μέσα στη διπλάσια ανοχή (χωρίς αυτά −1,0, 4.17), καθυστερήσεις Bode (ρυθμοί αέρα ως 0,2 % από το ℓ/c), μοντέλα των tutorials: παθητικά, αγωγιμότητα κόμβων < 1,4 % στα 1–100 Hz· βάρος στις χαμηλές συχνότητες (ελάσσον τμήμα 11,8 % → 0,28 %), επιβολή παθητικότητας που την κρατά (28 % → 0,4 % στα 50 Hz), _WB.mod (10⁻⁹), cross-bonding (Z₁ = 0,0212 + j0,1906 Ω/km)· ο λύτης απέναντι στο NLT (γραμμή < 3·10⁻³, καλώδιο έξι αγωγών < 10⁻²), μόνιμη κατάσταση < 10⁻⁴, SciPy < 10⁻³· cable_xb απέναντι στη λύση φασιθετών (τάσεις μανδυών 0,3 %) και στο NLT των ίδιων ακριβών τμημάτων (0,3 %)'),
    ('tests/test_mmc.py', 'MMC σημείο προς σημείο: τα τέσσερα μοντέλα και ο έλεγχος του σταθμού (4.14), η ενέργεια των βραχιόνων (4.15)', 'Model 2 με BE απέναντι στο Model 1 (N = 6: κορυφή I_a 1 %, μέσο I_dc 3 %), ο τραπεζοειδής που ξαναπιάνει στα 20 μs απέναντι στα 2 μs (0,5 %), Model 3 απέναντι στο Model 2 (N = 400: 1 %, Σv_C 0,2 %), μπλοκαρισμένος μετατροπέας χωρίς αγωγή, Model 1 απέναντι στον SciPy (10⁻³ της κορυφής, μετρήθηκε 6·10⁻⁶)· tutorial hvdc_mmc: Model 4 (P 1 → 0,5 pu, V_dc 1 pu ± 0,3 %, απώλειες 0,2–1,5 %, Q ≈ 0), Model 3, σφάλμα DC (μπλοκάρισμα σε 2 ms, 3–10 pu, διακόπτης AC ανοιχτός στα 0,6 s)· 4.15: Model 2 και 3 με έλεγχο ενέργειας απέναντι στο Model 4 στο βήμα P (V_dc < 10⁻³, P < 0,015), εξισορρόπηση άνω–κάτω < 1,2 %, άμεση διαμόρφωση χωρίς windup (±2,5 %), σφάλμα AC με όριο υπέρτασης DC (V_dc ≈ 1,2 pu)'),
    ('tests/test_lcc.py', 'LCC: γέφυρα 6 παλμών, σταθμός 12 παλμών, μέσο μοντέλο, το πρώτο benchmark HVDC της CIGRE (4.16)', 'γέφυρα απέναντι στον Kundur (10.10)–(10.14): V_d 2·10⁻³ του V_d0, α 0,01°, γ 0,5°· γρήγορη = αναλυτική (10⁻⁵)· t_q κάτω και πάνω από το περιθώριο γ/ω· σταθμός απέναντι στην (10.30) (10⁻³), μέσο μοντέλο (V_d 4·10⁻³, P_AC = P_DC σε 10⁻⁴, Q 2 %)· αναλυτική γέφυρα απέναντι στον SciPy (ρεύμα 10⁻³ της κορυφής, μέση V_d 10⁻⁴)· tutorial hvdc_lcc απέναντι στο PSCAD (Faruque κ.ά. 2006, Πίν. I–II: V_d 1,5 %, α ανορθωτή 0,5°, α αντιστροφέα 1°, γ 0,3°), σφάλμα DC (VDCOL, επαναφορά), σφάλματα AC (αποτυχία μετάβασης, κορυφή I_d 2,2–2,8 pu· PSCAD 2,58), βήμα εντολής'),
    ('tests/test_linedata.py', 'δεδομένα γραμμής: επιλογές, έξοδοι και εξαγωγές (4.11)', 'διστρωματικό έδαφος απέναντι σε γραμμικό σύστημα ανά κυματαριθμό (10⁻¹⁰) και σε υπολογισμό πεδίου με πεπερασμένους όγκους (1 %), ίσα στρώματα = Carson/Pollaczek (10⁻¹⁶), αμοιβαιότητα· Galloway–Wedepohl, GMR, X ανά μονάδα· καλώδια στον αέρα και ημιαγώγιμα στρώματα· ανακατασκευή από ακολουθίες (ακριβής στη f)· πεδία E και B απέναντι στην κλίση του δυναμικού· Q-error, π, σάρωση απέναντι σε expm/sqrtm· κάθε αρχείο εξαγωγής (CSV, .mat, Exact-PI, Nominal-PI, FD, CP) ξαναδιαβάζεται στους ίδιους αριθμούς'),
    ('tests/test_powerflow.py', 'ροή φορτίου σε αραιούς πίνακες, DC, PTDF/LODF, παρτίδες και N−1 (4.19.1, ROADMAP §68, `pcl/powerflow.py`)', 'κάθε μέθοδος (αραιός και πυκνός Newton–Raphson, Newton με εγχύσεις ρεύματος, fast-decoupled XB/BX, εμπρός–πίσω σάρωση, Gauss–Seidel) στην ίδια λύση σε επτά δίκτυα (κάτω από 2·10⁻⁹ pu)· «Αυτόματα» σε μικρό δίκτυο = η `load_flow` bit προς bit· η επιλογή του engine από το δίκτυο και ο λόγος της· όρια Q· οι λύσεις των αρχείων IEEE 14–300 και οι τιμές των Baran & Wu (202,7 kW, 0,9131 pu)· κακή εκκίνηση με επιστροφή σε ασφαλέστερη μέθοδο· PTDF/LODF απέναντι σε πραγματική αφαίρεση κλάδου· γέφυρες του γράφου· παρτίδα σεναρίων (Broyden σε κοινούς παράγοντες) και N−1 σε AC (Woodbury) απέναντι στη λύση ενός προς ένα, και ο λόγος χρόνου τους σε μεγάλο δίκτυο'),
    ('tests/test_opf.py', 'βέλτιστη ροή φορτίου (4.19.1, ROADMAP §68, `pcl/ipm.py`, `pcl/opf.py`)', 'ο πυρήνας εσωτερικού σημείου σε προβλήματα με γνωστή απάντηση (τετραγωνικό πρόγραμμα, δίσκος, Rosenbrock, ισότητα, σταθερή μεταβλητή)· πρώτες και δεύτερες παράγωγοι των εξισώσεων ισχύος και των ροών απέναντι σε πεπερασμένες διαφορές· AC-OPF απέναντι στα δημοσιευμένα κόστη επτά δικτύων (Coffrin, Gordon & Scott, arXiv:1411.0359, Πίνακας 1, στα δύο δεκαδικά)· το βέλτιστο είναι ροή φορτίου και τηρεί τα όρια· οριακές τιμές = οριακό κόστος των πηγών εκτός ορίων· DC-OPF με γραμμικά κόστη απέναντι στο HiGHS του SciPy, με τετραγωνικά απέναντι στις συνθήκες KKT'),
    ('tests/test_report.py', 'αντικείμενο αναφοράς του engine και μελέτες δικτύου ως δεδομένα (4.19.1, ROADMAP §68, `pcl/report.py`, `pcl/study.py`)', 'ενότητες, αντικείμενο ↔ δεδομένα ↔ αρχεία (HTML, Markdown, JSON)· το HTML είναι ένα αρχείο χωρίς εξωτερικούς πόρους, με τα δεδομένα μέσα του (και με κείμενο που περιέχει «</script>» ή «<!--»), κάθε γράφημα έγκυρο SVG με ράβδους από το μηδέν και όρια με λέξη· οι αναφορές ροής φορτίου, N−1 και OPF απέναντι στα αποτελέσματα από τα οποία γράφονται (και στα δημοσιευμένα κόστη)· τα σφάλματα των μελετών με μήνυμα, και από τον server (400)· **το σημείο λειτουργίας `IEEE9_OPF` του `tutorials.js` απέναντι στο `ieee9().opf(\'ac\')`** (6 δεκαδικά)· τα tutorials `pf_study` και `opf_study` χωρίς browser: το EMT του σχεδίου κρατά τη ροή φορτίου (0,7164, 1,63, 0,85 pu) και τη βέλτιστη κατανομή (0,898, 1,3432, 0,9419 pu), και τα όργανα στη γραμμή 8–7 και στο φορτίο 5 δίνουν τις τάσεις και τα ρεύματα της μελέτης'),
    ('tests/test_backend.py', 'backends των παρτίδων μόνιμης κατάστασης και script του επιταχυντή (4.19.2, ROADMAP §68, `pcl/backend.py`, `pcl/accel.py`)', 'οι τρεις λύσεις πολλών δεξιών μελών (παράγοντες, ρητός αντίστροφος, ανά επίπεδο) συμφωνούν στη CPU, και οι παρτίδες με καθεμία δίνουν τις λύσεις αναφοράς· χωρίς κάρτα, ή με κάρτα που αποτυγχάνει, η μελέτη τρέχει στη CPU και λέει τον λόγο· ο κανόνας του «Αυτόματα» από τη μέτρηση του μηχανήματος· ο κλάδος GPU* με υποκατάστατο του CuPy από NumPy (μόνο η συναρμογή: δεν λέει τίποτα για πραγματική κάρτα)· το script τυπώνει και γράφει τη μέτρηση'),
    ('tests/test_nnstart.py', 'νευρωνικό αρχικό σημείο, εκκίνηση του εσωτερικού σημείου από γνωστό σημείο, αρχεία ONNX (4.19.2, ROADMAP §68, `pcl/nnstart.py`, `pcl/onnxio.py`, `pcl/ipm.py`, `pcl/opf.py`)', 'από σημείο κοντά στο βέλτιστο λιγότερες επαναλήψεις και το ίδιο βέλτιστο· πρόταση άσχετη, με λάθος διαστάσεις ή που δεν οδηγεί σε σύγκλιση αγνοείται ή εγκαταλείπεται και η λύση είναι της κανονικής εκκίνησης· αλλαγή φορτίων (dS) = το δίκτυο ξαναφτιαγμένο· εκπαίδευση από δικές μας λύσεις και κέρδος σε σενάρια που δεν είδε· μοντέλο για άλλο δίκτυο ή άλλη μελέτη δεν χρησιμοποιείται, με τον λόγο· γράψιμο και ανάγνωση ONNX, δίκτυο εκπαιδευμένο αλλού, και (στον CI) ο ελεγκτής αναφοράς και το ONNX Runtime με τους ίδιους αριθμούς· τα τρία μοντέλα που έρχονται με την εφαρμογή'),
    ('tests/test_big.py', 'ο λύτης στον χρόνο σε μεγάλα δίκτυα και τα ιδιοδιανύσματα του ελέγχου βήματος (4.19.3, ROADMAP §68, `web/studio/stepcheck.js`, `web/studio/mna.js`, `tests/js/big_cases.js`)', 'ιδιοδιάνυσμα πραγματικής ιδιοτιμής σε πραγματική αριθμητική: τα bit του μιγαδικού κώδικα (993 ιδιοτιμές τυχαίων πινάκων, και ιδιόμορφων)· οι ιδιοτιμές που κρατιούνται με τη μορφή Hessenberg: τα bit του `eig`· ιδιοδιάνυσμα από τη μορφή Hessenberg: ίδιο ως 10⁻⁹· η ρύθμιση δεν αλλάζει κανέναν αριθμό του λύτη· το πλέγμα 4 × 4 από τη μόνιμη κατάστασή του ως το σφάλμα· αραιή αρχικοποίηση απέναντι στην πυκνή (10⁻⁷)· οι μνήμες καταγραφής: ως 1000 κανάλια όπως πριν, πάνω από αυτά κατά μνήμη (8 × 8: κάτω από 200 MB)'),
    ('tests/test_netview.py', 'το διάγραμμα του δικτύου μιας μελέτης και ο προβολέας του (4.19.4, ROADMAP §73, `pcl/netview.py`, `web/studio/netview.js`, `tests/js/netview_cases.js`)', 'διάταξη: κάθε δίκτυο δοκιμής παίρνει θέσεις, διάμεσος κλάδος μία μονάδα, κανένας ζυγός πάνω σε άλλον, ίδιο δίκτυο ίδια εικόνα· ακτινικός τροφοδότης ως δέντρο· στρώσεις απέναντι στο αποτέλεσμα της μελέτης τους· το N−1 μετρά ό,τι προσθέτει η διαταραχή· SVG ως έγκυρο XML· DXF με τις στρώσεις CAD του, διαβασμένο και από τη βιβλιοθήκη `ezdxf`· ο προβολέας στο Node: μοντέλο, προσαρμογή στο παράθυρο, εύρεση, λεπτομέρεια ανά μεγέθυνση, ένα καρέ σε καμβά που καταγράφει τις κλήσεις του, κλάδος εκτός λειτουργίας διακεκομμένος, και ο διαδραστικός προβολέας (σύρσιμο, ροδέλα γύρω από τον δείκτη, όρια μεγέθυνσης, εύρεση ζυγού, νέο μέγεθος καμβά, καταστροφή)· 4.20.1: τα δίκτυα DC στο ίδιο διάγραμμα (θέσεις, στρώσεις τάσεων και ροών απέναντι στη ροή φορτίου AC/DC, SVG, DXF, εύρεση ζυγού DC, γραμμής DC και σταθμού στον προβολέα) και τα δίκτυα χωρίς μέρος DC όπως πριν· 5.0.6: η περιοχή της μελέτης στο διάγραμμα (σημείο σε πολύγωνο, παράθυρο και λάσο με τους ίδιους ζυγούς, Shift + κλικ, Ctrl + σύρσιμο, ο τρόπος «λάσο», Alt, το μεσαίο κουμπί, το σύνορο μόνο σε επιλεγμένους ζυγούς)'),
    ('tests/test_netfile.py', 'αρχεία δικτύου και αλλαγές ως δεδομένα (4.19.4, ROADMAP §73, `pcl/netfile.py`, `pcl/study.py`)', 'τα δέκα δίκτυα γραμμένα ως MATPOWER και διαβασμένα πίσω: ίδια ροή φορτίου σε κάθε bit, ίδιο κόστος OPF· το JSON· αναγνώριση της μορφής· αρχείο με ζυγό εκτός, κόστος που δεν είναι πολυώνυμο και γραμμή DC: διαβάζεται και το λέει· τι δεν είναι δίκτυο· κάθε αλλαγή με την πρότασή της, πάνω σε αντίγραφο· 14 αρνήσεις με το μήνυμά τους· μελέτη με `edits` = οι ίδιες αλλαγές στον κώδικα· το διάγραμμα κρατά τις θέσεις του· SVG, DXF, αναφορά και αρχείο του αλλαγμένου δικτύου· δίκτυο από αρχείο μέσα από τα αιτήματα και τις ενέργειες του server'),
    ('tests/test_scopf.py', 'βέλτιστη ροή φορτίου με ασφάλεια N−1 (4.19.4, ROADMAP §75, `pcl/scopf.py`)', 'οι ροές μετά από κάθε διαταραχή απέναντι στη ροή φορτίου DC του δικτύου χωρίς τον κλάδο (δίκτυο 30 ζυγών, IEEE 57 και IEEE 118 με ονομαστικές από τις δικές τους ροές)· ο πολλαπλασιαστής ως αξία ενός MW ονομαστικής ισχύος· ό,τι δεν καλύπτει καμία κατανομή αναφέρεται και δεν είναι αποτυχία· διαταραχές που χωρίζουν το δίκτυο· επιπλέον γραμμικοί περιορισμοί στο DC πρόβλημα (`extra`)· η μελέτη, η στρώση του διαγράμματος και η αναφορά'),
    ('tests/test_sweepc.py', 'εμπρός–πίσω σάρωση με αντιστάθμιση για βρόχους και ζυγούς PV (4.19.5, ROADMAP §78, `pcl/powerflow.py`)', 'η λύση του δέντρου σε δύο περάσματα είναι ακριβής (ακτινικά και βροχοειδή δίκτυα με λήψεις)· οι εμπεδήσεις των σημείων διακοπής του δείγματος των Luo & Semlyen (1990) είναι οι δημοσιευμένες· ακτινικοί τροφοδότες, τροφοδότες με δικούς μας κλάδους σύνδεσης και πηγές που κρατούν τάση, και τα μικρά δίκτυα μεταφοράς δίνουν τη λύση του Newton–Raphson· όρια αέργου μέσα από την κοινή ρουτίνα· δίκτυο με πολλούς βρόχους: δεν συγκλίνει, το λέει και επιστρέφει πεπερασμένες τιμές· το «Αυτόματα» δεν την προτείνει'),
    ('tests/test_se.py', 'εκτίμηση κατάστασης με ελάχιστα τετράγωνα και εντοπισμός λανθασμένων μετρήσεων (4.19.5, ROADMAP §79, `pcl/se.py`)', 'το δείγμα τριών ζυγών των Abur & Gómez Expósito (2004): κατάσταση, εκτιμήσεις, J και πίνακας κέρδους του βιβλίου, και η διακύμανση των υπολοίπων του παραδείγματος DC· οι παράγωγοι απέναντι σε πεπερασμένες διαφορές· ακριβείς μετρήσεις δίνουν τη ροή φορτίου (επτά δίκτυα, τέσσερα σχέδια μετρήσεων)· η εκτίμηση είναι ελάχιστο και οι ζυγοί μηδενικής έγχυσης δεν εγχέουν· Ω από λύσεις στους παράγοντες = πυκνός τύπος· στατιστική του J και των κανονικοποιημένων υπολοίπων σε 200 σύνολα σφαλμάτων· ένα χονδρικό σφάλμα σε κάθε μέτρηση με τη σειρά βρίσκεται· χωρίς περίσσεια δεν φαίνεται· κρίσιμες μετρήσεις και παρατηρησιμότητα απέναντι στην τάξη της πλήρους Ιακωβιανής· παρατηρήσιμες νησίδες'),
    ('tests/test_harmonic.py', 'αρμονική ροή φορτίου με έγχυση ρεύματος και σάρωση συχνότητας (4.19.5, ROADMAP §80, `pcl/harmonic.py`)', 'το πρώτο σύστημα δοκιμής της Task Force (1999): η ροή φορτίου του στα δεκαδικά του πίνακα, η παραμόρφωση τάσης στους ζυγούς HVDC και SVC όπως δημοσιεύτηκε, οι υπόλοιποι ζυγοί σε 8 % και 15 %, και οι δύο ζυγοί των γεφυρών που δεν αναπαράγονται γραμμένοι ως τέτοιοι· αναίρεση των τάξεων 5, 7, 17, 19 στο δωδεκαπαλμικό και επαλληλία· ο κανόνας αστέρα–τριγώνου απέναντι σε κλάδους με μετατόπιση φάσης· κλειστοί τύποι δύο ζυγών (αρμονική τάση, τάξη συντονισμού, συντονισμένο φίλτρο)· η μακριά γραμμή απέναντι σε 400 τμήματα· τα φάσματα απέναντι στη σειρά Fourier· τα μοντέλα φορτίου A, B, C· νόμος ρευμάτων του Kirchhoff σε κάθε τάξη· τάξεις μηδενικής ακολουθίας εκτός· μελέτη, στρώση, αναφορά'),
    ('tests/test_unbalanced.py', 'ασύμμετρη (τριφασική) ροή φορτίου τροφοδότη (4.19.5, ROADMAP §81, `pcl/unbalanced.py`)', 'ο τροφοδότης 13 κόμβων της IEEE απέναντι στα δημοσιευμένα αποτελέσματά του: 35 τάσεις φάσης, ρεύματα στην πηγή και σε τέσσερα τμήματα, ισχύς εισόδου, απώλειες ανά τμήμα και ανά φάση, ισχύς των φορτίων που ακολουθούν την τάση, πυκνωτές· μη αντιμετατεθειμένη γραμμή απέναντι στις εξισώσεις της· καλώδιο χωρίς φορτίο απέναντι στο ακριβές μοντέλο γραμμής· συμμετρικός τροφοδότης (ακτινικός και με βρόχο) απέναντι στη ροή φορτίου θετικής ακολουθίας· κατανεμημένο φορτίο απέναντι σε 200 σημειακά· κλειστοί τύποι μίας φάσης για τα τρία μοντέλα φορτίου και φορτίου ανάμεσα σε δύο φάσεις· ρυθμιστές: λόγος ανά λήψη, τάση του ρελέ, έλεγχος μία λήψη τη φορά, ζώνη στενότερη από μία λήψη· αρχείο και πίσω, αρνήσεις, μελέτη, στρώσεις, αναφορά'),
    ('tests/test_cpf.py', 'συνεχιζόμενη ροή φορτίου (4.19.5, ROADMAP §77, `pcl/cpf.py`)', 'δύο ζυγοί απέναντι στον κλειστό τύπο: η μύτη και κάθε σημείο του πάνω και του κάτω μέρους, η δεύτερη λύση στο σημερινό φορτίο, ο δείκτης που μηδενίζεται στη μύτη· το βήμα δεν μετακινεί τη μύτη· φορτία σταθερής σύνθετης αντίστασης: καμπύλη χωρίς όριο, με μήνυμα· κατεύθυνση της αύξησης (όλα, μόνο φορτία, ένας ζυγός, πρόσθετο άεργο φορτίο) και αρνήσεις· έξι δίκτυα απέναντι στη διχοτόμηση της σύγκλισης της ροής φορτίου· κάθε σημείο πριν από τη μύτη απέναντι στη ροή φορτίου του δικτύου με φορτία × (1 + λ)· ιδιόμορφος πίνακας στη μύτη· όρια αέργου: μύτη ή γωνία, διχοτόμηση με έλεγχο πλευράς, Newton με τους τύπους των συμβάντων σε κάθε σημείο, γεννήτριες που ξαναπαίρνουν τον έλεγχο της τάσης· PEGASE 1354· η μελέτη ως δεδομένα, η στρώση του διαγράμματος, η αναφορά'),
    ('tests/test_pieces.py', 'το αποτέλεσμα δεν εξαρτάται από τα κομμάτια του `run` (4.19.5, ROADMAP §74, `solve.evSnap`)', 'σε κομμάτια 5 και 1 βήματος η πύλη ενός PWM αλλάζει στις ίδιες στιγμές με το τρέξιμο σε ένα κομμάτι (buck, 150 αλλαγές)· το δείγμα στο reset πριονωτού φέροντος ίδιο σε κομμάτια T/200 ως 7T/3, με σταθερό και μεταβλητό βήμα (Άσκηση 3)· οι καταστάσεις τεσσάρων tutorials με S&H ή συγκριτή· ο δρόμος πριν από την 4.19.5 (`evSnap: off`) δίνει τις αποκλίσεις που μετρήθηκαν'),
    ('tests/test_psse.py', 'αρχεία PSS/E RAW (4.19.4, ROADMAP §73, `pcl/psse.py`)', 'τα δέκα δίκτυα γραμμένα ως RAW 33 και διαβασμένα πίσω: ίδιες τάσεις σε 10⁻¹¹ pu· οι εγγραφές (κόμματα, κενά, εισαγωγικά, σχόλιο, αστερίσκοι)· μικρό δίκτυο γραμμένο με το χέρι: τι διαβάζεται από κάθε ενότητα και τι λέει ότι δεν διάβασε· το ίδιο δίκτυο από τις διατάξεις των εκδόσεων 30–35, με και χωρίς τα σχόλια των ενοτήτων· κωδικοί CW (1, 2, 3), CZ (1, 2, 3), CM (1, 2) απέναντι στις ίδιες ποσότητες υπολογισμένες στο test· λόγος στο δεύτερο τύλιγμα απέναντι στον πίνακα αγωγιμοτήτων του μοντέλου της μορφής· τρία τυλίγματα: άστρο, και με το τρίτο εκτός ίσο με δύο τυλίγματα· οι καταστάσεις 0, 2, 3, 4· τι αρνείται'),
    ('tests/test_guide.py', 'ο κώδικας του οδηγού τρέχει όπως είναι γραμμένος (4.19.4, `docs/GUIDE.md` §15)', 'το παράδειγμα Python της ενότητας εκτελείται σε άδειο φάκελο: τυπώνει τους αριθμούς που γράφει ο οδηγός και αφήνει τα τέσσερα αρχεία που λέει· οι άλλοι τρόποι που ονομάζει ο οδηγός (κατευθείαν στο αντικείμενο, ως αίτημα)'),
    ('tests/test_sparse.py', 'αραιός λύτης (4.2)', 'ίδιοι αριθμοί με τον πυκνό LU (10⁻⁹, ίδιες παραγοντοποιήσεις), αυτόματη επιλογή, μέτρηση: παραγοντοποίηση 1000 αγνώστων ≥ 3 φορές γρηγορότερη (διάμεσος 7)· 4.19: μία επαναπαραγοντοποίηση ≥ 3 φορές γρηγορότερη από μία παραγοντοποίηση από την αρχή (μετρημένο ~9), ίδιοι παράγοντες bit προς bit'),
    ('tests/test_refac.py', 'επαναπαραγοντοποίηση του αραιού LU στον λύτη του χρόνου (4.19, §68)', 'ίδιοι αριθμοί bit προς bit με την παραγοντοποίηση από την αρχή: 912 τυχαίοι πίνακες (όλες οι στήλες, και μόνο όσες είναι στη διαδρομή παραγοντοποίησης όσων άλλαξαν), σκάλα με διακόπτες, tutorials με μηχανές, μη γραμμικά και καταστάσεις διακοπτών (λύση και κάθε κανάλι)· άρνηση ακριβώς όπου η lu() θα διάλεγε άλλους οδηγούς· απέναντι στον πυκνό LU 10⁻⁶· η πρόταση του engine (`solverInfo`) και οι ρυθμίσεις `solve.solver`, `solve.refac`'),
    ('tests/test_library.py', 'βιβλιοθήκη σε ταξινομήσεις (4.6)', 'κάθε στοιχείο σε κάθε ταξινόμηση (μία φορά, εκτός από «Κατά μάθημα»), νέο στοιχείο στα «Άλλα», αναζήτηση χωρίς τόνους, αγαπημένα και πρόσφατα, ελληνική αλφαβητική σειρά'),
    ('tests/test_live_program.py', 'ζωντανές παράμετροι και πρόγραμμα αλλαγών (3.19)', 'ζωντανή αλλαγή = ίδιο πρόγραμμα bit προς bit (ίδια βήματα, ίδια σημεία), ράμπα με ακριβή ενδιάμεση τιμή, D ανά περίοδο χωρίς διπλή μεταγωγή'),
    ('tests/test_api_surface.py', 'δημόσιο API (3.18, σταθερό από την 4.0)', 'ο κατάλογος διαβάζεται από τον κώδικα, είναι ενημερωμένος, μια αφαίρεση ή ένα χαμένο όρισμα σταματά τον έλεγχο· από την 4.0 καμία αφαίρεση μέσα στην 4.x, στην 5.0 μόνο ό,τι ήταν παρωχημένο'),
    ('tests/test_workbench.py', 'το κύκλωμα ως σύστημα υπό έλεγχο (plant) του Control Workbench (3.16)', 'το συμβόλαιο Plant: επαναφορά στην ίδια τροχιά bit προς bit, ανεξάρτητοι κλώνοι, εγγραφή στο registry· 4.9.1: LivePlant πάνω στην προσομοίωση της οθόνης (advance, reset, clone εκτός οθόνης)'),
    ('tests/test_control.py', 'σύνθεση ελέγχου, PI, PI + NN (3.15), αντίστροφο NN και RL (3.16)', 'κλίσεις των δικτύων απέναντι σε πεπερασμένες διαφορές· η πολιτική με θ = 0 και το PI + NN χωρίς μάθηση είναι ο PI bit προς bit· ο καταρράκτης ακολουθεί την αναφορά με φορτίο, χωρίς μάθηση το PI + NN είναι ο PI bit προς bit, το δίκτυο μαθαίνει το ρεύμα φορτίου (T_L + bω)/ψ, IAE/ISE σε κλειστή μορφή'),
    ('tests/test_plotting.py', 'γραφικές για δημοσίευση (3.15)', 'το label_mapping.csv του Lightning Impulse Manager όπως είναι, IEEE 8,8 cm = 249,45 pt, ίδιο αρχείο σε κάθε τρέξιμο, RMS ημιτόνου'),
    ('tests/test_nn.py', 'μπλοκ «Νευρωνικό δίκτυο (MLP)» (4.7), «Ελεγκτής AI» (4.8)', 'αρχικά βάρη, εμπρόσθια διάδοση και βήματα Adam/SGD ίδια με την Python· μάθηση online (το σφάλμα πέφτει στο < 40 %), snapshot, ζωντανή αλλαγή, πάγωμα, βάρη που δεν ταιριάζουν· tutorials: IAE ανά κύκλο PI ≈ 32, online 18,6 → 5,8, αντίστροφο μοντέλο ≈ 1,9· 4.8: παράγωγος της εξόδου απέναντι σε κεντρικές διαφορές, αντίστροφο με εξομοιωτή 24 → 6,0, ο «Ελεγκτής AI» ίδιος με το καλωδιωμένο κύκλωμα σε 10⁻⁶'),
    ('tests/test_designer.py', 'σύνθεση ελέγχου για κάθε μηχανή (4.7, pcl.designer, pcl.gui), γεννήτριες, οχήματα και RL (4.8.1)', 'κανόνας γεννήτριας (απώλεια συγχρονισμού = τελευταίος) και οχήματος, πολιτική RL που ξεκινά ως ο PI και χαμηλώνει το J· οι μηχανές από το parts.js, κύκλωμα ανά είδος (ΣΡ, επαγωγής, σύγχρονη, SRM) που τρέχει χωρίς προειδοποιήσεις, επιλογή με στόχους και βάρη (το αντίστροφο μοντέλο κερδίζει, J < 0,6·J_PI), γραμμή εντολών, παράθυρο· 4.9.1: RL για γεννήτρια (πολιτική δίπλα στο PSS) και όχημα (δίπλα στον PI), με μηδενικά βάρη ίδια με τη βάση'),
    ('tests/test_gen_ctl.py', 'έλεγχος γεννητριών: AVR, PSS, ρυθμιστής στροφών (4.8.1, Kundur κεφ. 8–9)', 'αρχή σε ισορροπία σε κάθε συνδυασμό (ΔP_e ~10⁻⁴), σφάλμα: σταθερή E_fd και AVR μόνο χάνουν τον συγχρονισμό, AVR + PSS κρατά· βήμα V_ref ST1A γρήγορο, DC1A αργό· βήμα φορτίου με ατμό (δύο χρόνοι) και νερό (πρώτα πέφτει)· IEEE 9 με AVR κρατά· 4.9.1: ST1A + PSS + ατμός και DC1A + νερό στον SciPy απέναντι στον browser (ταχύτητα 2·10⁻⁶, P_e 10⁻⁴, E_fd 0,5 %)'),
    ('tests/test_trv.py', 'ονομαστική TRV κατά IEC 62271-100 (4.9, pcl.trv και trv.js)', 'κανόνες της §7.105.5 απέναντι στους Πίνακες 9, 14, 16–30 (S1/S2, k_pp 1,3/1,5, εκτός φάσης, > 800 kV), το παράδειγμα 245 kV/50 kA του Παραρτήματος A (L90, L75, ITRV), περιβάλλουσα του Παραρτήματος D, έλεγχος κάτω από τη γραμμή αναφοράς· ίδιοι αριθμοί στο browser (10⁻¹²)· τα δύο tutorials TRV: σφάλμα ακροδεκτών κάτω από τη γραμμή T100 με έξι γραμμές, πάνω με δύο· κοντινή γραμμή: ο διακόπτης των μετρήσεων διακόπτει L90/L75, ο εξασθενημένος αποτυγχάνει μόνο στο L90'),
    ('tests/test_arc.py', 'τόξο του διακόπτη (4.9)', 'βελτιωμένο Mayr, Mayr, Cassie + Mayr, τρία τροποποιημένα Mayr απέναντι σε ανεξάρτητη ολοκλήρωση Radau: μηδέν, κορυφή σβέσης, κορυφή και στιγμή της TRV, ρεύμα μετά το τόξο· θερμική επανέναυση ασθενούς τόξου, κλειστός πόλος, τριφασικός CB3 με τόξο· 4.9.1: οι ίδιες περιπτώσεις και ο CB3 με τόξα στον SciPy από t = 0, απέναντι στην ίδια αναφορά (κορυφή TRV σε 3·10⁻⁵)'),
    ('tests/test_trstart.py', 'επανεκκίνηση του τραπεζοειδούς (4.9)', 'γεννήτρια με AVR στον TR και βήμα V_ref: η ταλάντωση Nyquist της |V| της παλιάς αρχής (`trStart: be`) εξαφανίζεται, |V| ίδια με BDF2 σε δέκα φορές μικρότερο βήμα (5·10⁻⁵)'),
    ('tests/test_lightning.py', 'κεραυνός σε γραμμή 400 kV δίπλα σε υποσταθμό GIS (4.9, tutorial lightning_gis)', 'αλεξικέραυνο IEEE (d = 3,216 m, U₁₀ = 819 kV): 3 kA 30/60 μs → 743 kV απέναντι στα 751 kV του βιβλίου παραμέτρων· γείωση R(I) απέναντι στον τύπο (< 1 %)· ανάστροφη υπερπήδηση με κακή γείωση, αστοχία θωράκισης, χωρίς αλεξικέραυνα πάνω από το LIWL, κλειστός διακόπτης'),
    ('tests/test_impl.py', 'γρήγορη και αναλυτική υλοποίηση, εσωτερικό και ανάπτυξη (4.9.1, ROADMAP §52)', 'αλεξικέραυνο IEEE: ίδιες τάσεις σε 10⁻¹³· lightning_gis σε τέσσερα σενάρια: κορυφές σε 10⁻⁶ και υπερπηδήσεις στο ίδιο βήμα· κάθε tutorial με τα στοιχεία βιβλιοθήκης ανεπτυγμένα: ίδια bit προς bit· σχέδιο κάθε τύπου χωρίς επικαλύψεις· L₁ στην U₁₀ (IEEE WG 3.4.11)· πύργος με πλήγμα και αλεξικέραυνο στον SciPy (10⁻³ με αλυσίδες U_b, 1 % τάσης–χρόνου)· ο SciPy αρνείται τις TLM'),
    ('tests/test_sssc.py', 'αρθρωτός SSSC: βραχίονας CHB, NLC, SOGI-PLL, έλεγχος, ροή φορτίου και θέση (4.10, ROADMAP §50)· κεντρικός ελεγκτής, CCSC, IEEE 9 σε EMT (4.17)', 'γρήγορος και αναλυτικός βραχίονας: 10⁻⁵ A (γέφυρες H, ημιγέφυρες)· στάθμες και ταξινόμηση της NLC, λιγότερες μεταγωγές με ζώνη· SOGI-PLL: κλείδωμα, οι δύο υλοποιήσεις bit προς bit, συνεχές 10 %· βρόχος με X = 10, −8, 20, −25 Ω απέναντι στη γραμμή με ιδανική σειριακή αντίδραση (1,5–4 %), σταθερό m_a (3 %), ρεύμα (1 %)· ροή φορτίου με SSSC = κλάδος με μικρότερη X (10⁻¹²), στόχοι V_q και P, μέτωπο Pareto· SciPy (2·10⁻³ A)· tutorials: μονοφασικό με βήματα της X (1 %), τριφασικό 150 kV απέναντι στο pcl.network (0,6 %)· 4.17: κεντρικός ελεγκτής των τριών φάσεων (X 1 %, τάσεις πυκνωτών ±0,5 % έναντι ±8 % με ελεγκτή ανά φάση, ασυμμετρία στη φάση a, SciPy), CCSC (ρεύματα γραμμής, πυκνωτή και μετατροπέα απέναντι στους κλειστούς τύπους, 1,5–3 %), IEEE 9 σε EMT με τον m-SSSC απέναντι στη ροή φορτίου του pcl.network (0,6 % στο ρεύμα, 0,2 % στις τάσεις), ο πίνακας της κάρτας και η θέση του sssc_placement, το IEEE 9 με ρυθμιστές στροφών σε ισορροπία'),
    ('tests/test_ctlwin.py', 'παράθυρο «Ρύθμιση ελεγκτή», μέθοδος σύγκλισης, πρόσθια τροφοδότηση χωρίς εκτροπή (4.17.4, ROADMAP §64, §62)', 'G(s) απέναντι στο scipy.signal.ss2tf και πόλοι απέναντι στις ιδιοτιμές του μέσου μοντέλου (buck, boost, Ćuk), περιθώρια = σχεδίαση, κλειστός βρόχος στη νέα αναφορά, μέθοδος σύγκλισης χωρίς PI χωρίς υπερύψωση (μέσο μοντέλο και διακοπτικό κύκλωμα· D₀ μόνο: όχι), ίδιο τρέξιμο στον SciPy (0,5 %), `Project.tune`, `fel2`: βάρη φραγμένα εκεί που του `fel` μεγαλώνουν, μικρότερο σφάλμα· `scope_flow.js` στον browser'),
    ('tests/test_lblplace.py', 'ετικέτες των στοιχείων σε πυκνό σχέδιο (4.17.5, ROADMAP §66)', 'σε κάθε tutorial καμία ετικέτα πάνω σε άλλη ή σε στοιχείο (πριν: δεκάδες και εκατοντάδες, ίδιο μέτρο), η πλευρά του αραιού σχεδίου ίδια, μια στήλη εισόδων με μία πλευρά, μακριά έκφραση κομμένη στο μπλοκ της, σύρμα και ακροδέκτες απωθούν, ίδια διάταξη για το ίδιο σχέδιο, αριθμοί για τα «= …»· στον browser με τις γραμματοσειρές: scope_flow μπλοκ 11'),
    ('tests/test_gfm.py', 'μετατροπείς grid-forming (4.18, ROADMAP §58): VSC δύο επιπέδων (μέσο μοντέλο) και έλεγχος στατικότητας, VSM, PSC', 'απέναντι σε άκαμπτο δίκτυο ο αργός πόλος της στατικότητας (s² + ω_f·s + ω_f·ω₀·m_p·K_s) και της VSM (2H·s² + D_p·s + ω₀·K_s): ω_d 4 %, ζ 0,03 (μετρήθηκαν 1,5 % και 0,7 %, 0,1 % και 0,003)· P = P_ref + (1 − f_g/f₀)/m_p· νησίδα: |i| = I_max σε υπερφόρτιση, ισχύς DC = P (1 %)· tutorial gfm_island: μία συχνότητα, 1 − ω = m_p·(P_φ − S₁·P_ref,1)/ΣS (2·10⁻⁴), P₁ − P₂ = P_ref,1, 2:1 με 10 και 5 kVA· gfm_sync (Zhong & Weiss 2011, Σχ. 5): P = θ̇·P_set, Q = Q_set, +20 W στα 49,95 Hz, Q = Q_set + D_q·(V_r − V_m)· gfm_weak (Zhang κ.ά. 2010): PSC σε SCR 1 στα 0,8 και 0,9 pu, σφάλμα με |i| ≤ 1,07·I_max και επαναφορά (SCR 1 και 5)· SciPy: η διαφορά πέφτει με το βήμα (πρώτη τάξη, καθυστέρηση των ελεγχόμενων πηγών)'),
    ('tests/test_gfm2.py', 'grid-forming στο δίκτυο (4.18.1, ROADMAP §58): στιβαρός έλεγχος ρεύματος, σταθμός MMC σε grid-forming, IEEE 9 με μετατροπέα', 'ο έλεγχος του σταθμού της 4.18 ταλαντώνεται στο SCR 1· ο στιβαρός (Harnefors κ.ά. 2021) στα 0,8 pu στο SCR 1, 2, 5 (3·10⁻³) και 0,9 pu στο SCR 1 με PLL 2 Hz· ο σταθμός σε grid-forming ίδιος με το GFMC (10⁻⁹), νησίδα 1 − ω = m_p·(P − P_ref) (3·10⁻⁴), VSM (10⁻³), δύο μονάδες σε ίδιο pu (3·10⁻³), ασθενές δίκτυο· IEEE 9 χωρίς μεταβατικό από τη ροή φορτίου, σειρά του RoCoF και της απόκλισης της συχνότητας (Tayyebi κ.ά. 2020)· SciPy με σύγκλιση στο βήμα'),
    ('tests/test_gfm3.py', 'grid-forming, μέρος 3 (4.20.2, ROADMAP §84, §58): ο σταθμός MMC σε grid-forming στα Model 1–3, dVOC και matching control', 'το hvdc_gfm με Model 4 το ίδιο κύκλωμα με πριν· στη νησίδα τα Model 3 και 2 δίνουν την P του Model 4 σε 10⁻³ pu και τη συχνότητα σε 10⁻⁴· dVOC απέναντι σε άκαμπτο δίκτυο στους κλειστούς τύπους της μόνιμης του (22) σε 10⁻⁴, χάνει το βήμα με η για 2 % χωρίς αντίσταση στη σύνδεση (Groß κ.ά. 2019) και το κρατά με η για 0,5 %· στο ieee9_gfm από τη ροή φορτίου (με R_v 0,05 pu· χωρίς αυτήν ταλαντώνεται), νησίδα με δύο μονάδες, σταθμός MMC· matching: ω = v_dc/V_dc σε 10⁻⁵ και P = P* + (1 − ω)/m_p σε 10⁻³ με πηγή DC 5 ms, ταλάντωση με τα 50 ms της πηγής του paper, ieee9_gfm με ω = v_dc/V_dc σε κάθε περίοδο· μετρικές συχνότητας στο ieee9_gfm (dVOC όσο η στατικότητα, καλύτερα από τον grid-following)· SciPy (πρώτης τάξης στο βήμα)'),
    ('tests/test_gfm4.py', 'grid-forming, μέρος 4 (4.20.3, ROADMAP §85, §58): πλευρά DC κάθε νόμου, όριο ρεύματος μέσω της αναφοράς ισχύος, γενική μορφή του dVOC', 'οι προεπιλογές δίνουν τους ορισμούς της 4.20.2· ieee9_gfm με πηγή DC ±0,8 pu και +90 MW (Tayyebi κ.ά. 2020 §IV-D): στατικότητα, VSM και dVOC χάνουν την τάση DC ή το βήμα ως τα 4 s, το matching κρατά P ≈ 0,79 pu στο όριο της πηγής σε βήμα με τις μηχανές (5·10⁻⁴)· ±1,2 pu και +150 MW (§IV-E): χωρίς τη (24) χάνονται η VSM και το matching, με i_th 0,9 και γ_p 2,3 κρατιούνται και η πηγή βγαίνει από το όριο, η στατικότητα μένει σε βήμα αλλά ταλαντώνεται στο όριο· dVOC με κ από τη σύζευξη στη νησίδα, κάθε μονάδα στον νόμο της (21) σε 2·10⁻⁴, και από E₀ = 0,01 pu η ίδια κατάσταση με την εκκίνηση από το V* σε 2·10⁻⁴ ήδη από τα 0,45 s· SciPy (πρώτης τάξης στο βήμα)'),
    ('tests/test_gfm5.py', 'grid-forming, μέρος 5 (4.20.4, ROADMAP §86, §58): φίλτρο στο μέτρο του ρεύματος της (24), διαμόρφωση (9) με την ονομαστική V_dc, κ και E₀ στον σταθμό MMC', 'οι προεπιλογές δίνουν τους ορισμούς της 4.20.3· ieee9_gfm με ±1,2 pu και +150 MW: χωρίς φίλτρο η στατικότητα και το dVOC ταλαντώνονται στο όριο (πάνω από 0,2 pu), με φίλτρο 20 Hz στο μέτρο του ρεύματος και οι τέσσερις νόμοι ήσυχοι (κάτω από 0,02 pu) και σε βήμα, η πηγή DC κάτω από το όριό της· ±0,8 pu και +90 MW με τη διαμόρφωση (9): η VSM σε βήμα (5·10⁻⁴) στο όριο της πηγής και του ρεύματος, η στατικότητα και το dVOC χάνονται· σταθμός MMC με dVOC στη νησίδα: κ = 60° στον νόμο (21) σε 5·10⁻⁴, από E₀ = 0,01 pu η ίδια κατάσταση σε 2·10⁻⁴ και κυμάτωση κάτω από το 1/5· SciPy (πρώτης τάξης στο βήμα)'),
    ('tests/test_dcdc.py', 'ο μετατροπέας DC/DC ως ένα στοιχείο (4.21, ROADMAP §87): μέσο μοντέλο του Jovcic §30.3.3 στο EMT', 'κάθε συνδυασμός του dcdc_ex303 (Παράδειγμα 30.3) καταλήγει στη ροή φορτίου DC με τον μετατροπέα ως ένα στοιχείο (10⁻⁴ MW, 10⁻⁶ kV)· χωρίς απώλειες P = v_a·i_a = v_b·i_b· SciPy (πρώτης τάξης στο βήμα)'),
    ('tests/test_qside.py', 'έλεγχος της πλευράς στα όρια αέργου της απλής ροής φορτίου (4.21, ROADMAP §87)', 'q_limits = «side»: ένας ζυγός PQ στο όριο ξαναγίνεται PV όταν η τάση του είναι από τη λάθος πλευρά της τιμής του (Pirnia κ.ά. 2013, συνθήκες συμπληρωματικότητας)· η μύτη της καμπύλης P–V όπως η συνεχιζόμενη ροή φορτίου· χωρίς την επιλογή ίδιοι αριθμοί bit προς bit'),
    ('tests/test_acdc_opf.py', 'βέλτιστη ροή φορτίου AC/DC και N−1 AC/DC (4.21, ROADMAP §87)', 'case5_acdc: κόστος 194,1388 απέναντι στο 194,139 του Πίν. IV (Ergun κ.ά. 2019)· το βέλτιστο ως ροή φορτίου AC/DC με τις δικές του τιμές (2·10⁻⁶ pu)· κάθε διαταραχή N−1 ίδια με τη ροή φορτίου χωρίς το στοιχείο, ο C2 χωρίς λύση με τον λόγο του'),
    ('tests/test_pmu.py', 'φασιθέτες (PMU) και μέτρα |I| στην εκτίμηση κατάστασης (4.21, ROADMAP §87)', 'οι νέες παράγωγοι απέναντι σε πεπερασμένες διαφορές· ακριβείς μετρήσεις δίνουν τη ροή φορτίου (10⁻⁹)· γωνίες στον χρόνο αναφοράς των PMU· τέσσερις PMU (2, 6, 7, 9) βλέπουν όλο το IEEE 14, τρεις όχι· μόνο PMU = το γραμμικό πρόβλημα των ορθογώνιων τάσεων· λανθασμένος φασιθέτης και |I| βρίσκονται'),
    ('tests/test_emt_se.py', 'εκτίμηση κατάστασης από μετρήσεις του EMT (4.21, ROADMAP §87): η μονάδα PMU3 στο se_emt', 'φασιθέτες όπως τους ορίζει το IEC/IEEE 60255-118-1 (ενεργός τιμή, συνημίτονο, κοινός χρόνος)· TVE της μονάδας (ωh)²/12 = 2,06·10⁻⁵ απέναντι στο ημίτονο των δειγμάτων· το EMT απέχει από τη ροή φορτίου < 4·10⁻⁶· κάθε σχέδιο μετρήσεων βρίσκει τη ροή φορτίου σε 2,5·10⁻⁵, κάθε λάθος βρίσκεται, ο μόνος φασιθέτης τάσης σχεδόν δεν φαίνεται'),
    ('tests/test_emt_harmonic.py', 'φάσμα από το EMT για την αρμονική ροή φορτίου (4.21, ROADMAP §87): γέφυρα 6 παλμών του harm_emt', 'η σύμβαση φάσης (μετατόπιση στον χρόνο, ημίτονο ή συνημίτονο)· χωρίς L_s η ιδανική γέφυρα (1/h με τα πρόσημά της), με L_s η κυματομορφή της μετάβασης με σταθερό ρεύμα DC (0,0014 της θεμελιώδους, 0,32°)· η μελέτη με το φάσμα του EMT όπως με το ιδανικό ως την 25η τάξη'),
    ('tests/test_gis.py', 'υποσταθμός GIS και πολύ γρήγορα μεταβατικά (4.22, ROADMAP §51, §53, §61): αποζεύκτης με επανεναύσεις, μοντέλο προόδου οχετού (LPM), αρχική τάση γραμμής, ομοαξονικά δεδομένα, πολυώροφος πύργος (`web/studio/mna.js`, `engine/batch.py`, `pcl/surge.py`, `tests/js/gis_cases.js`)', 'επανεναύσεις κλεισίματος απέναντι στον λύτη SciPy· παγιδευμένο φορτίο στο άνοιγμα· LPM απέναντι σε ανεξάρτητη ολοκλήρωση και στον SciPy· Πίν. I του Ishii· το GIS 765 kV του TR 60071-4 και οι κορυφές VFTO απέναντι στη μέθοδο των χαρακτηριστικών'),
    ('tests/test_insulation.py', 'συντονισμός μόνωσης (4.22, ROADMAP §51, `pcl/insulation.py`)', 'το παράδειγμα G.2 του IEC 60071-2 ολόκληρο (U_cw, K_a, U_rw, μετατροπές, στάθμη 395/950 kV)· οι ζώνες προστασίας του Πίν. 4 του IEC 60099-5· ο συντελεστής σφάλματος γης από τις συμμετρικές συνιστώσες'),
    ('tests/test_geo.py', 'θέσεις του δικτύου στη γη (4.22, ROADMAP §69, `pcl/geo.py`, `tests/js/geo_cases.js`)', 'haversine απέναντι στον νόμο των συνημιτόνων· Web Mercator απέναντι στο asinh(tan φ)· GeoJSON έξω και πάλι μέσα· μήκος γραμμής από τη διαδρομή της (και η ροή φορτίου το βλέπει)· ο χάρτης δεν αλλάζει τις τιμές των στρώσεων'),
    ('tests/test_time3.py', 'ο λύτης στον χρόνο, μέρος 3 (4.23, THEORY §8Ι.5): καταγραφή μόνο όσων παρακολουθούνται, βάση της επαναπαραγοντοποίησης από τη μνήμη, πυρήνας WebAssembly', 'σε έξι tutorials τα ίδια bit στην καταγραφή και στα στατιστικά κάθε καναλιού που καταγράφεται, η τιμή των άλλων ίδια όταν ζητηθεί, ένα κανάλι που προστίθεται στη μέση καταγράφεται από εκεί· με βάση από τη μνήμη τα ίδια bit και 41–58 % λιγότερες στήλες στα hvdc_lcc, b4dcs2, hvdc_gfm· ο πυρήνας WebAssembly με τα ίδια bit σε 16 συστήματα και σε τρία tutorials, «Αυτόματα» από 4000 αγνώστους (μετρημένο)'),
    ('tests/test_split.py', 'υποδίκτυα στις γραμμές σε Workers και πολλαπλοί ρυθμοί (4.24, THEORY §8Ι.7, `web/studio/split.js`)', 'σε 11 tutorials τα ίδια bit με έναν λύτη σε κάθε κανάλι, σε δύο ομάδες και σε μία ομάδα ανά υποδίκτυο (ως 44), και σε Workers· οι άγνωστοι των άλλων μερών NaN σε κάθε λύτη· μια μεταγωγή αλλάζει μόνο τα βήματα της ομάδας της, με διαφορά μικρότερη από το σφάλμα της ολοκλήρωσης· πολλαπλοί ρυθμοί στο multirate_lines (1 και 15 μs) με σφάλμα κάτω από το βήμα των 15 μs παντού, και η εξομάλυνση ίσου εμβαδού χειρότερη εδώ· η διέγερση του βιβλίου στη G2 του ieee9_emt· το ισοδύναμο δικτύου στην αναζήτηση με «πηγή»'),
    ('tests/test_neutral.py', 'η επιλογή «Ουδέτερος» των τριφασικών στοιχείων (4.24, αποφάσεις 208, 345)', 'ο ακροδέκτης n μόνο με «Ακροδέκτης n»· η προεπιλογή δίνει το netlist της 4.23· ακροδέκτης n στη γη = στερεά γείωση σε κάθε στοιχείο· μονοφασικό σφάλμα με R_n + jX_n στο ισοδύναμο δικτύου και πίσω από Dyn11 απέναντι στη λύση στο πεδίο των φάσεων με 3Z_n (κάτω από 0,1 %)· πηγή με Z_n σε άνισο αστέρα απέναντι στην κλειστή μορφή'),
    ('tests/test_study.py', 'ο φάκελος μελέτης και η αυτόματη καταγραφή (5.0, απόφαση 344 και 343.4, THEORY §8ΩΕ, `engine/studyfolder.py`, `web/studio/study.js`)', 'οι γραμμές ενός τρεξίματος είναι η καταγραφή της προσομοίωσης: στρογγυλεμένες σε float32 οι τιμές του scope bit προς bit, η τελευταία το now() κάθε καναλιού, και σε κομμάτια τα ίδια· οι μονάδες ίδιες με του scope σε κάθε κανάλι κάθε tutorial· το netlist χωρίς την κατάσταση του τρεξίματος· ένα τρέξιμο από την Python με τα ίδια bit με το Result, αριθμοί τρεξιμάτων που δεν ξαναδίνονται και ετικέτα που κρατά ένα τρέξιμο· οι αναγνώστες του EMTP, του PSCAD και των CSV σε αρχεία γραμμένα κατά τη μορφή τους· τα μοντέλα γραμμής με το κλειδί τους (ίδια bit από τον φάκελο)· ο server δέχεται μόνο ολόκληρες γραμμές σε τρέξιμο που τρέχει· η αυτόματη καταγραφή πάνω από 1000 κανάλια με τους ίδιους αριθμούς'),
    ('tests/test_sat.py', 'ο κορεσμός στους μετασχηματιστές (5.0.1, ROADMAP §92, THEORY §8ΩΖ, `tests/js/sat_cases.js`)', 'η καμπύλη και το αντίστροφό της, η δοκιμή κενού σε rms και πίσω, ίδιο netlist με την προεπιλογή, ένας πυρήνας κάτω από το γόνατο = η γραμμική L_m, ιδανική πηγή (δεύτερη τάξη) και η πρώτη κορυφή με R σε κλειστή μορφή, η παραμένουσα ροή που κρατιέται, οι 13 ομάδες, η αρχή από φασιθέτες, τα μηνύματα, οι κανόνες του χρόνου, το στιγμιότυπο, ο SciPy απέναντι στην εφαρμογή σε πέντε κυκλώματα'),
    ('tests/test_equivalent.py', 'το ισοδύναμο του δικτύου στα 50 Hz: Ward, extended Ward, Norton, για το βραχυκύκλωμα (5.0.3, ROADMAP §96 Β.2, THEORY §8ΩΗ)· σε EMT κατά το Σχ. 15 του CIGRE TB 39 (5.0.4, THEORY §8ΩΘ)', 'το βασικό σημείο του πλήρους δικτύου, ο κλάδος της μείωσης Kron του pandapower 3.5.6, το N−1 του IEEE 30, το ρεύμα του συνόρου στην πλήρη λύση, το I″k του πλήρους δικτύου και του IEC TR 60909-4· το GRID3 με τα ίδια δεδομένα, το σφάλμα σε όλο το δίκτυο σε EMT, ο SciPy· η περιοχή από τους επιλεγμένους ζυγούς (5.0.6): η ίδια διαίρεση με το σύνορο που βγαίνει, οι ζυγοί τύπου «internal» με τους γείτονές τους, ό,τι ζητά η σελίδα (`pcl.study.area`) ίδιο με τη βιβλιοθήκη· μια νησίδα δίνει «no convergence» σε κάθε επεξεργαστή (5.0.7)· η σάρωση και το Foster του Σχ. 15a (5.0.7, THEORY §8ΩΙ): η σάρωση απέναντι στο Thevenin και στους τύπους της γραμμής, το ταίριασμα με θετικά στοιχεία, το EQV3 του browser απέναντι στους κλάδους σε τέσσερις συχνότητες, η αρχή στη ροή φορτίου, το σφάλμα απέναντι στο πλήρες δίκτυο'),
    ('tests/test_cp_modal.py', 'γραμμές CP χωρίς παραμόρφωση και με δεδομένα ανά ρυθμό (5.0.1, απόφαση 355, THEORY §8ΩΖ.10, `tests/js/cp_cases.js`)', 'att·V στο ανοιχτό άκρο, ένας ρυθμός = η μονοφασική γραμμή (διαφορά 0), οι ρυθμοί γης και εναέριος της τριφασικής με τον T_i του Clarke, ο ίδιος T_i από τον χρήστη (ίδια bit), τα τρία είδη δεδομένων, η μόνιμη κατάσταση απέναντι στο δίθυρο, τα μηνύματα, ο SciPy'),
    ('tests/test_rms.py', 'ο αριθμητικός πυρήνας της δυναμικής RMS και της ευστάθειας μικρών διαταραχών (4.23, ROADMAP §71, `pcl/rms.py`)', 'IEEE 9 ζυγών όπως στο βιβλίο αναφοράς: E′ και φορτία (Παρ. 2.6), οι ανηγμένοι πίνακες πριν, κατά και μετά το σφάλμα (Πίν. 2.6), οι δύο ταλαντώσεις (Παρ. 3.2), οι ιδιοτιμές του μοντέλου δύο αξόνων με D = 0 και 1 (§9.12) στο έκτο δεκαδικό· ο τραπεζοειδής με τάξη 2 απέναντι στο SciPy· η εναλλασσόμενη λύση ίδια· μεταβλητό βήμα· κρίσιμος χρόνος εκκαθάρισης· Arnoldi = QR (και στο IEEE 118)· η πρώτη ταλάντωση απέναντι στο EMT· χωρίς διαταραχή τίποτα δεν κινείται· στοιχείο χωρίς μοντέλο RMS: άρνηση με το όνομά του'),
    ('tests/test_ev_weights.py', 'τα βάρη του πολυκριτηριακού του οχήματος (4.18.1)', 'moevc2: w_s↑ ⇒ IAE↓, w_e↑ ⇒ Wh/km↓ και IAE↑, eco < ισορροπημένος < performance στα Wh/km και αντίστροφα στο IAE, keep ≤ 1· το moevc της 4.8 με keep 1,15 και w_s χωρίς επίδραση'),
    ('tests/test_look.py', 'τεχνική όψη του σχεδίου (4.17.3, ROADMAP §65)', 'διαδρομές μόνο οριζόντιες/κατακόρυφες (χωρίς εξομάλυνση) απέναντι σε γνωστές μορφές, σήμανση χωρίς αλλαγή των υπολοίπων, αντίσταση IEC και ANSI, όλα τα σύμβολα της βιβλιοθήκης· `scope_flow.js` στον browser'),
    ('tests/test_dock.py', 'η διάταξη των καρτών της σελίδας χωρίς σελίδα (5.0.5, ROADMAP §94 βήμα β, `web/studio/dock.js`, `tests/js/dock_cases.js`)', 'μια κάρτα σε περιοχή, σε δικό της παράθυρο, ως καρτέλα (όχι μέσα σε παράθυρο), πίσω στη θέση της· μια ομάδα πολλών καρτών στη σελίδα στη θέση της πρώτης· μια διάταξη από την αποθήκευση κρατά μόνο γνωστές κάρτες σε γνωστές περιοχές, την καθεμία μία φορά· 4000 τυχαίες ενέργειες χωρίς να χαθεί ή να διπλασιαστεί κάρτα· 5.0.6: δύο κάρτες δίπλα δίπλα (μερίδιο 0,2–0,8, μια κάρτα που φεύγει, όχι σε παράθυρο) και η πρώτη θέση ενός εγγράφου ως καρτέλα δίπλα στο κύκλωμα'),
    ('tests/test_appwin.py', 'η εφαρμογή σε δικό της παράθυρο (5.0.5, ROADMAP §97 βήμα 1, `engine/appwin.py`)', 'ο browser βρίσκεται σε Windows, macOS και Linux (πρώτα το PCL_BROWSER), η εντολή έχει --app και --user-data-dir στον φάκελο της εφαρμογής, χωρίς browser, με πρόγραμμα που δεν ξεκινά ή με --browser ανοίγει καρτέλα όπως πριν· το manifest και τα εικονίδια'),
    ('tests/test_plotcore.py', 'πυρήνας των γραφημάτων (4.17.2, ROADMAP §63)', 'ticks χωρίς επικάλυψη για 28 συνδυασμούς διαστήματος και πλάτους, βήματα 1–2–5, ετικέτες με τα δεκαδικά του βήματος και ένα πρόθεμα ανά άξονα, όρια που κρατούν το 0, σταθερή αυτόματη κλίμακα (ανοίγει αμέσως με περιθώριο, κλείνει μετά από 2 s, σταθερή στην παύση)· και `tests/ui/scope_flow.js` στον browser'),
    ('tests/test_inputs.py', 'είσοδοι του κυκλώματος και παράμετροι από εκφράσεις (4.17.1, ROADMAP §59)', 'σταθερά και παράμετρος ως είσοδοι, «= …» στο δίκτυο και στην εξαγωγή του SciPy, αλυσίδα, το μπλοκ έκφρασης με τις εισόδους, προειδοποιήσεις (κυκλική εξάρτηση, άγνωστο, διπλό, λάθος όνομα), είσοδοι των tutorials (EV: J_eq = J_m + m·(r_w/n)², και με m = 150 kg· ΣΡ/ΣΡ), κέρδη του Ćuk με R από έκφραση, «Ανάπτυξη» με εκφράσεις, μονάδα «=» που μένει κείμενο, pcl inputs/set'),
    ('tests/test_tune.py', 'κέρδη PI/PID του PWM από το κύκλωμα (4.17, ROADMAP §59)', 'μέσο μοντέλο CCM των buck, boost, buck–boost, Ćuk, SEPIC απέναντι σε ανεξάρτητη μεταγραφή (10⁻⁷) και στο engine.models (10⁻⁶)· κλίση της μόνιμης κατάστασης (3 %) και απόκριση σε ημιτονικό D (0,1 %, 0,1°) από την προσομοίωση· κλειστός βρόχος με PI και PID στην αναφορά (1,5 %)· προειδοποίηση για κέρδη αντίθετου πρόσημου· λίστα ρόλων· ξαναϋπολογισμός· ίδιο τρέξιμο στον SciPy (0,5 %)'),
    ('tests/test_watch.py', 'πλακίδια σημάτων και ελέγχων πάνω στο σχέδιο (4.8)', 'διάταξη, βήματα, κορεσμός, καμπύλη (first/min/max/last ανά στήλη), ρυθμιστικό· ο διακόπτης «Μαθαίνει» ζωντανά = ίδιο πρόγραμμα bit προς bit'),
    ('tests/test_ev.py', 'ηλεκτρικό όχημα και πολυκριτηριακός ελεγκτής (4.8)', 'δύο λεπτά με επαναλαμβανόμενο κύκλο (στάση στο τέλος κάθε κύκλου, διπλάσια απόσταση, σταθερή μνήμη), ενέργεια απέναντι στο φορτίο της μπαταρίας (τάση ανάμεσα στις OCV), 50–80 km/kWh με την τριβή της μηχανής της 4.17, οι προεπιλογές των τρόπων του Control Workbench, εκφράσεις με σταθερές ίδιες bit προς bit'),
    ('tests/test_recording.py', 'καταγραφή σε αρχείο (4.8)', 'όνομα από τον server, μόνο αριθμοί, κανένα όνομα έξω από τον φάκελο, όριο μεγέθους· 4.11: ανάγνωση διαστήματος (γραμμές, ή πρώτη/min/max/τελευταία ανά στήλη) απέναντι σε numpy, ευρετήριο που μεγαλώνει, φάκελος του χρήστη, καθαρισμός των προσωρινών, γεγονότα δίπλα στο αρχείο· 4.12: λίστα με μεγέθη, γεγονότα που ξαναδιαβάζονται, συμπίεση σε .gz'),
    ('tests/test_pcl.py', 'σενάρια από κώδικα, πακέτο pcl (3.13)', 'κυμάτωση ΔI = V_o(1 − D)/(L·f_s) σε σάρωση, ίδια αριθμοί με τον λύτη της εφαρμογής, SciPy, CSV/JSON/.mat, γραμμή εντολών'),
    ('tests/test_matlab.py', 'MATLAB/Octave (3.14, PclPlant 4.8.1)', 'ελεγκτής στο Octave γύρω από κύκλωμα (PclPlant): ίδια νούμερα με την Python σε 10⁻¹², ζωντανή αλλαγή και επαναφορά, το πρότυπο παράθυρο· pcl_run, pcl_sweep, pcl_read στο Octave: ίδιοι αριθμοί με την Python, κυμάτωση ΔI = V_o(1 − D)/(L·f_s), CSV/JSON/.mat'),
    ('tests/test_b4.py', 'το B4 της CIGRE, η αρχή με ακροδέκτες DC, το καλώδιο 320 kV (4.20.1, ROADMAP §83, `pcl/dcgrid.py`)', 'VSC2 με ακροδέκτες DC από ροή φορτίου: ρεύμα DC = P/v_dc,0 των φασιθετών (10⁻⁹), μένει εκεί που ξεκινά (0,1 V σε 800 V, 10⁻³ στο ρεύμα AC)· πηγή ρεύματος και πυκνωτής στην αρχή (10⁻⁶)· το καλώδιο 320 kV στο 1 MHz: 33,73 Ω και 183,5 km/ms της δημοσίευσης, χωρίς τα ημιαγώγιμα στρώματα 36,27 Ω· οι 28 ροές DC των Σχ. 27.6–27.7 από τις τάσεις τους μέσα στη στρογγύλευση (η χειρότερη στο 0,81 της ανοχής)· η ροή φορτίου των αναφορών του Πίν. 27.11 και μια απώλεια σταθμού· το δίκτυο b4 = cigre_b4 (10⁻³ V)· το tutorial b4dcs2 σε τέσσερις περιπτώσεις: τάσεις DC της ροής φορτίου της κάρτας σε 0,07 kV, ισχείς σε 1–3 MW (οι απώλειες των σταθμών), με τις ισχείς του ίδιου του EMT η ροή φορτίου DC σε 0,02 kV, ποιος παίρνει το συμβάν'),
    ('tests/test_meas.py', 'μπλοκ μέτρησης σήματος (4.19.6)', 'μέση τιμή, RMS, ελάχιστο και μέγιστο απέναντι σε κλειστούς τύπους (τρίγωνο, πριονωτό, ρολόι, βήμα, ημίτονο με την ευθεία ανάμεσα στα σημεία), στα στατιστικά περιόδου του scope και στον λύτη SciPy· Fourier (πλάτος, φάση, συνιστώσες) και THD με και χωρίς τη συνεχή συνιστώσα απέναντι στις σειρές Fourier του ρολογιού, του τριγώνου και του πριονωτού, σε τάση με δύο αρμονικές απέναντι στην ευθεία ανάμεσα στα σημεία και στις αρμονικές του scope· ισχύς μονοφασική (P, P₁, Q₁, S, PF) σε σήματα με γνωστούς φασιθέτες και σε φορτίο R-L, ακολουθίες και ισχύς θετικής ακολουθίας σε τριφασικό σήμα με γνωστές ακολουθίες, οι στιγμιαίες p, q, p₀ απέναντι στην ισχύ των φάσεων και στις μέσες τιμές τους· περιοδικός μέσος παλμών σε σκαλοπάτι γνωστών αλμάτων και απέναντι στις απώλειες μεταγωγής του scope· πρώτο παράθυρο, περίοδος από ρολόι, παράθυρο από είσοδο συχνότητας, αποθηκευμένη κατάσταση'),
    ('tests/ui/*.js', 'περιβάλλον (Playwright)', 'σχέδιο, scopes, πάνελ, εργαλείο σύρματος, ζωντανές παράμετροι, κονσόλα διαγνωστικών, πάνελ «Σενάρια» (κυμάτωση στο 3 % της θεωρίας, μπλοκ Python ίδιο με το μπλοκ PI)· 4.6: χρόνος ανά καρέ σε zoom, μετακίνηση, σύρσιμο και επιλογή σε μικρό κύκλωμα και σε 200 στοιχεία, με και χωρίς προσομοίωση (`perf_flow`), Ctrl+Z/Ctrl+Y με ελληνικό πληκτρολόγιο και από παντού, ένα βήμα αναίρεσης ανά ενέργεια, βιβλιοθήκη, ροδέλα χωρίς κύλιση της σελίδας, προσομοίωση στον Worker με τα ίδια αποτελέσματα με τη σελίδα (`ux_flow`)'),
]

LIMITS = [
    'Η βέλτιστη ροή φορτίου με ασφάλεια N−1 (4.19.4) είναι προληπτική και γραμμική (DC) και για τη βασική κατάσταση και για κάθε διαταραχή: δεν βλέπει απώλειες, άεργο και τάσεις (η αναφορά δίνει τι λέει η ροή φορτίου AC της κατανομής· στο δίκτυο των 30 ζυγών ένας κλάδος βγαίνει στο 108,7 % σε AC). Οι γεννήτριες δεν αλλάζουν μετά τη διαταραχή (όχι διορθωτικές κινήσεις), δεν ελέγχεται απώλεια γεννήτριας, και οι διαταραχές που χωρίζουν το δίκτυο μένουν έξω από τον έλεγχο και αναφέρονται. Θέλει ονομαστική ισχύ σε κλάδους: από τα δέκα δίκτυα δοκιμής την έχουν τρία.',
    'Το διάγραμμα του δικτύου μιας μελέτης (4.19.4) δείχνει συνδέσεις, όχι γεωγραφία ούτε υποσταθμούς: οι θέσεις βγαίνουν από τον γράφο. Οι διασταυρώσεις κλάδων δεν ελαχιστοποιούνται ρητά. Η στρώση φόρτισης υπάρχει μόνο από τη βέλτιστη ροή φορτίου.',
    'Αρχεία PSS/E RAW (4.19.4): δεν διαβάζονται γραμμές DC, FACTS, GNE, επαγωγικές μηχανές και διακόπτες (ο αναγνώστης το λέει)· τα εγκάρσια στοιχεία με βαθμίδες μένουν στην αρχική τους τιμή· μια μηχανή που ρυθμίζει την τάση άλλου ζυγού διαβάζεται να κρατά τον δικό της στην τάση του αρχείου· οι μετασχηματιστές με ρύθμιση υπό φορτίο μένουν στη λήψη του αρχείου. Ο αναγνώστης ελέγχθηκε με ένα πραγματικό αρχείο της έκδοσης 32 (εκτός repo, κωδικοί CW 3, CZ 1, CM 1)· οι υπόλοιποι κωδικοί και οι διατάξεις των άλλων εκδόσεων μόνο με αρχεία γραμμένα από εμάς κατά την περιγραφή της μορφής.',
    'Οι αλλαγές ενός δικτύου από το διάγραμμα (4.19.4) είναι: φορτίο ζυγού, ισχύς και τάση γεννήτριας, όριο κλάδου, στοιχείο εκτός λειτουργίας. Ζυγοί και κλάδοι δεν προστίθενται από εκεί.',
    'Οι απώλειες της γραμμής είναι σταθερή R′ σε σειρά, συγκεντρωμένη σε N τμήματα (Dommel). Συγκλίνει στην κατανεμημένη γραμμή περίπου ως 1/N. Δεν υπάρχουν ακόμη αγωγιμότητα G′, επιδερμικό φαινόμενο, corona και γραμμές εξαρτώμενες από τη συχνότητα (ROADMAP §26).',
    'Η καμπύλη τάσης–χρόνου του σπινθηριστή είναι το κριτήριο ενέργειας διάσπασης με σταθερές U₀, k, D. Οι σταθερές των tutorials είναι ενδεικτικές, όχι μετρήσεις διακένου. Ο σπινθηριστής δεν έχει χωρητικότητα και η γεννήτρια Marx ανάβει χωρίς παρασιτικές χωρητικότητες.',
    'Δεν υπάρχει ακόμη κορεσμός πυρήνα μετασχηματιστή (ROADMAP §31). Ο πυρήνας τριών σκελών (4.2) είναι γραμμική μαγνήτιση μηδενικής ακολουθίας στην πλευρά 1, χωρίς κορεσμό. Ο διακόπτης ισχύος διακόπτει ιδανικά στο μηδέν του ρεύματος, χωρίς τόξο· η TRV μετριέται (pcl.network.trv) χωρίς τις περιβάλλουσες του IEC 62271-100.',
    'IEC 60909 (4.2): το I_b του δικτύου δοκιμής του TR 60909-4 βγαίνει με τη Formula (77) του 2016 στους ζυγούς 1, 2, 8, με τη μορφή του 2001 (jX″) στους 6, 7· στους 3–5 (κοντά στις μονάδες S, SO) καμία από τις δύο δεν πέφτει στο 0,02 % (0,06–1,3 %). Το i_p με 20 Hz του TR είναι με R_Gf. Ελάχιστα ρεύματα: c_min, χωρίς διορθώσεις και κινητήρες, R στη θερμοκρασία τέλους· χωρίς λ για το I_k κοντά σε γεννήτρια.',
    'Φορτίο ZIP στο EMT (4.2): πηγές ρεύματος στο πλαίσιο PLL (20 Hz) με |v| μέσω χαμηλοπερατού 10 Hz και αντίσταση απόσβεσης 20 % του |S|· ακολουθεί αλλαγές τάσης με αυτή τη δυναμική, όχι ακαριαία.',
    'Οι μηχανές έχουν τυπικές τιμές όπου λείπουν δεδομένα. Ελέγχονται απέναντι σε ανεξάρτητες ΔΕ, όχι σε μετρήσεις.',
    'Γεννήτρια (4.3): χωρίς κορεσμό και χωρίς αντίδραση Canay· έως ένας αποσβεστήρας στον άξονα d και δύο στον q. Ο άξονας προχωρά μετά από κάθε βήμα (leapfrog, δεύτερης τάξης) με την ηλεκτρική ροπή του βήματος, όχι στην ίδια επανάληψη με το δίκτυο. Η εκκίνηση από ροή φορτίου λύνει το κύκλωμα με φασιθέτες της θετικής ακολουθίας· οι γραμμές Bergeron, τα φορτία σταθερής ισχύος και τα αλεξικέραυνα μένουν έξω. Οι τιμές του Σχ. 5 του First Benchmark είναι ανάγνωση από το σχήμα (±0,1 pu).',
    'Γραμμές (4.4): σταθερός πραγματικός T_i (όπως το CP και το FD του EMTP)· σε γραμμή χωρίς μετάθεση φάσεων οι επαγόμενες τάσεις απέχουν από την ακριβή γραμμή έως λίγα %. Το CP κρατά τις παραμέτρους μιας συχνότητας. Η σειρά Carson αλλάζει σε ασυμπτωτική στο a = 10 (το LINE CONSTANTS στο a = 5). Χωρίς πολυστρωματικό έδαφος, κορώνα και μοντέλο στο πεδίο των φάσεων (ULM). Η γραμμή ξεκινά χωρίς φορτίο (και με εκκίνηση από ροή φορτίου). Ο λύτης SciPy δεν τρέχει γραμμές από γεωμετρία· η ανεξάρτητη αναφορά είναι ο μετασχηματισμός Laplace.',
    'Wideband (4.13): το H προσαρμόζεται με απόλυτο σφάλμα, με βάρος ως 100 όπου |1 − H| είναι μικρό· κάτω από 1 Hz ένα τμήμα 0,5 km μένει στο 5 % στην αγωγιμότητα κόμβων (για DC: η διόρθωση DC). Η επιβολή παθητικότητας είναι γραμμικοποιημένη· αν δεν κρατήσει την ανοχή, το μοντέλο μένει όπως προσαρμόστηκε. Δεν υπάρχουν ακόμη FDQ, καλώδια σε σωλήνα, κορώνα, πολυστρωματικό έδαφος.',
    'Καλώδια (4.5): μονοπολικά ομοαξονικά καλώδια (αγωγός, θωράκιση, οπλισμός, με όσα στρώματα χρειάζεται), όχι καλώδια σε κοινό σωλήνα (pipe-type) ούτε ημιαγώγιμα στρώματα ως χωριστά στρώματα· θωρακίσεις με φάση 0 γειωμένες στα δύο άκρα, χωρίς μετάθεση (cross-bonding). Σταθερός πραγματικός T_i: στο υποβρύχιο 220 kV το σφάλμα του σταθερού T_i είναι περίπου 5 % σε κάποιες συχνότητες (στις τάσεις των άκρων λιγότερο από 0,4 %), για τα καλώδια το σωστό μοντέλο είναι στο πεδίο των φάσεων (ULM, ROADMAP §26). Το tanδ δίνεται στα 50 Hz και ακολουθεί αιτιατό μοντέλο ευρείας ζώνης (σταθερό tanδ σε όλες τις συχνότητες δεν είναι αιτιατό και η προσαρμογή του A δεν πέφτει κάτω από 1 %). Εναέριοι αγωγοί και καλώδια στην ίδια γραμμή όχι ακόμη.',
    'Τόξο (4.9): μοντέλα μαύρου κουτιού (Mayr, Cassie και παραλλαγές) με ενδεικτικές παραμέτρους από τη βιβλιογραφία· για έναν πραγματικό διακόπτη χρειάζονται μετρήσεις γύρω από το μηδέν. Χωρίς διηλεκτρική επανέναυση. Στον SciPy (4.9.1) τρέχει, αλλά μια γραμμή με μικρό τ σε μεγάλο παράθυρο (σφάλμα κοντινής γραμμής) ξεπερνά το όριο σημείων.',
    'Ο λύτης SciPy έχει τις πολυφασικές γραμμές CP και FD (4.12) και WB (4.13), όχι ακόμη το π (βρόχοι πυκνωτών)· ένα κύκλωμα με πολλά τμήματα WB (cable_xb, περίπου 12 000 καταστάσεις) είναι πολύ αργό. Γραμμή με μικρό τ σε μεγάλο παράθυρο δίνει βήμα ≤ τ/50 και μπορεί να ξεπεράσει το όριο σημείων (trv_slf).',
    'Αρθρωτός SSSC (4.10, 4.17): ιδανικοί διακόπτες χωρίς νεκρό χρόνο, NLC χωρίς φέρον. Με έναν ελεγκτή ανά φάση (4.10) η επαγωγική έγχυση είναι ευσταθής ως −25 Ω με PLL 8 Hz (αργή ταλάντωση ±7 %, χωρίς αυτήν με τον κεντρικό ελεγκτή)· με 20 Hz ως ~−10 Ω. Ο βραχίονας θέλει αυτεπαγωγή σε σειρά όταν βρίσκεται ανάμεσα σε χωρητικούς κόμβους. Ο SciPy παίρνει τον αναλυτικό βραχίονα (όχι τον γρήγορο). 4.17: ο κεντρικός ελεγκτής (SSSC3) έχει μόνο υλοποίηση με μπλοκ· με συγχρονισμό στη θετική ακολουθία και ασύμμετρα ρεύματα η τάση κάθε φάσης δεν είναι ακριβώς κάθετη στο ρεύμα της (η εξισορρόπηση αναπληρώνει τη διαφορά)· χωρίς έγχυση αρνητικής ακολουθίας. CCSC: ο έλεγχος του m-SSSC με PLL στο ρεύμα της γραμμής, χωρίς έλεγχο της εκκίνησης του κλάδου (το μεταβατικό στο κλείσιμο του διακόπτη)· ο βρόχος της ενέργειας είναι αργός (V_C ±3 %) γιατί μεγαλύτερα κέρδη ταλαντεύονται.',
    'Είσοδοι και εκφράσεις (4.17.1): μόνο στο ανώτερο επίπεδο (όχι μέσα σε ορισμούς υποκυκλωμάτων), αριθμητικές τιμές, ονόματα λατινικά.',
    'Κέρδη από το κύκλωμα (4.17): μέσο μοντέλο CCM με ιδανικούς ημιαγωγούς (χωρίς R_on, V_f, ESR), πέντε οικογένειες με έναν διακόπτη και μία δίοδο, ένας βρόχος τάσης ή ρεύματος, γραμμικοποίηση στην πρώτη τιμή της αναφοράς· σε DCM μόνο προειδοποίηση.',
    'Ροή φορτίου και OPF (4.19.1): η εμπρός–πίσω σάρωση δεν έχει ζυγούς PV ούτε βρόχους (το λέει και προτείνει Newton–Raphson)· κόστη μόνο πολυωνυμικά ως δεύτερου βαθμού· το εσωτερικό σημείο δεν έχει πλήρη σφαιρικοποίηση (σε έντονα μη κυρτό πρόβλημα μπορεί να μη συγκλίνει, και το λέει)· δεν υπάρχει ολομορφική εμφύτευση· ο ανεξάρτητος έλεγχος του DC-OPF με τετραγωνικά κόστη είναι μόνο οι συνθήκες KKT· σε λίγους ζυγούς των αρχείων IEEE 118 και 300 η δημοσιευμένη τάση δεν συμφωνεί με τα δεδομένα του ίδιου του αρχείου (γι\' αυτό διάμεσος και 95 % των ζυγών). Οι πυρήνες `pcl.powerflow`, `pcl.opf`, `pcl.ipm` είναι πειραματικοί στον κατάλογο API.',
    'Backends και αρχικό σημείο (4.19.2): ο δρόμος GPU* (CuPy, CUDA, διπλή ακρίβεια) είναι **πειραματικός**: δεν υπάρχει GPU στον CI του έργου, άρα δεν καλύπτεται από τα tests· ελέγχεται μόνο με το `python -m pcl accel` σε μηχάνημα με κάρτα. Μετρήθηκε σε μία κάρτα (RTX 5060 Laptop, 16/11/2026: κέρδος ×3,9 ως ×14 με τον ρητό αντίστροφο, ίδιες τάσεις ως 10⁻¹¹ pu, THEORY §8Θ.1)· σε άλλη κάρτα ή οδηγό δεν έχει ελεγχθεί. Το «Αυτόματα» τον διαλέγει μόνο μετά από μέτρηση του ίδιου του μηχανήματος (`--save`). Το νευρωνικό αρχικό σημείο κερδίζει στον AC-OPF (περίπου τις μισές επαναλήψεις) και **δεν κερδίζει στις παρτίδες ροής φορτίου** (μετρήθηκε: ίδιες επαναλήψεις, λίγο περισσότερος χρόνος)· δεν υπάρχει για το N−1 (η διαταραχή αλλάζει την τοπολογία). Ένα μοντέλο ισχύει για ένα δίκτυο με τα δεδομένα του (αποτύπωμα) και έχει ως εισόδους μόνο τα φορτία σταθερής ισχύος· με την εφαρμογή έρχονται μοντέλα για τρία μικρά δίκτυα, τα άλλα εκπαιδεύονται στο μηχάνημα του χρήστη. Ο αναγνώστης ONNX δέχεται μόνο τους τελεστές ενός δικτύου πρόσθιας τροφοδότησης.',
    'Μεγάλα δίκτυα στον χρόνο (4.19.3): το πλέγμα `big_grid` μετρά τη γραμμική άλγεβρα και τη λογιστική ανά στοιχείο, όχι μηχανές ή μετατροπείς. Πάνω από 1000 κανάλια το scope κρατά λιγότερα σημεία ανά κανάλι. Η αραιή αρχικοποίηση με φασιθέτες (από 400 αγνώστους) διαφέρει από την πυκνή στη στρογγύλευση: ως 3·10⁻⁵ σχετικά σε ποσότητες που είναι διαφορά μεγάλων αριθμών. Τα ιδιοδιανύσματα «Γρήγορα» αλλάζουν τη σειρά των ονομάτων σε μηνύματα συμμετρικών τριφασικών κυκλωμάτων (28 από 191 στα tutorials)· δεν είναι προεπιλογή. Το δίκτυο `pegase1354` διαβάζεται όπως ορίζει η μορφή του MATPOWER (μετατόπιση φάσης σε μοίρες)· οι τάσεις του αρχείου του δεν είναι η λύση αυτών των δεδομένων γύρω από τους τρεις μετατοπιστές φάσης (ως 5,5°).',
    'Ο λύτης του χρόνου τρέχει σε ένα thread· είναι αραιός από 120 αγνώστους (από 40 όταν ο πίνακας αλλάζει σε κάθε βήμα) και πυκνός κάτω από αυτούς (ROADMAP §32, §68).',
    'Μεταβλητό βήμα (3.13): ο έλεγχος σφάλματος είναι ανά βήμα (σχετικό τοπικό σφάλμα των καταστάσεων). Σε ταλάντωση με μικρή απόσβεση το συνολικό σφάλμα μεγαλώνει με τις περιόδους, και οι κορυφές μεγεθών που δεν είναι καταστάσεις (π.χ. ρεύμα πυκνωτή) δειγματοληπτούνται πιο αραιά. Σε μετατροπείς με πυκνό PWM το σταθερό βήμα είναι συνήθως ταχύτερο. Τα tutorials και οι τιμές αυτής της αναφοράς, εκτός από τις γραμμές «Βήμα του λύτη», είναι με σταθερό βήμα.',
]


def fmt(v, unit):
    if unit == 'cost':                               # 4.19.1: a cost per hour to its two decimals, with its thousands apart
        return (f'{v:,.2f}' if abs(v) >= 0.005 or v == 0 else f'{v:.2g}').replace(',', '\u2009').replace('.', ',')
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
        '- Η «Προσομοίωση» είναι ο λύτης του browser (`web/studio/mna.js`), τρεγμένος στο Node. Στην περιοχή «Λύτης SciPy» είναι ο δεύτερος λύτης (`engine/batch.py`, solve_ivp) στο ίδιο netlist· στις περιοχές «IEC 60909», «Ροή φορτίου» και «Ροή φορτίου και OPF» είναι οι λύτες μόνιμης κατάστασης του engine (`pcl.network`).',
        '',
        f'**Αποτέλεσμα:** {sum(abs(s - e) <= tol for _, _, _, e, s, tol, _ in rows)} από {len(rows)} μέσα στην ανοχή.' + ('' if ok else ' **Υπάρχουν τιμές εκτός ανοχής.**'),
        '',
        '| Περιοχή | Μέγεθος | Αναφορά | Αναμενόμενη | Προσομοίωση | Διαφορά | Ανοχή | |',
        '|---|---|---|---:|---:|---:|---:|---|',
    ]
    for area, q, ref, e, s, tol, u in rows:
        d = s - e
        ds = '≈ 0' if abs(d) < 1e-4 * tol else fmt(d, u)
        q, ref = q.replace('|', '\\|'), ref.replace('|', '\\|')      # 4.3: a |V| in a label must not split the table
        out.append(f'| {area} | {q} | {ref} | {fmt(e, u)} | {fmt(s, u)} | {ds} | {fmt(tol, u)} | {"✓" if abs(d) <= tol else "✗"} |')
    out += ['', '## Τι καλύπτουν τα υπόλοιπα tests', '', '| Αρχείο | Τι ελέγχει | Αναφορές |', '|---|---|---|']
    out += [f'| `{a}` | {b} | {c} |' for a, b, c in TESTS]
    out += ['', 'Μαζί 1415 tests (Python και Node) και 23 σενάρια περιβάλλοντος (από την 4.6 η μέτρηση της απόκρισης του σχεδίου, `perf_flow.js`· από την 4.7 της απόκρισης παντού, `speed_flow.js`· από την 4.8 τα πλακίδια, `watch_flow.js`, και το όχημα με την καταγραφή σε αρχείο, `ev_flow.js`, που από την 4.8.1 ελέγχει και τη γεννήτρια με AVR, PSS και ρυθμιστή και το εσωτερικό ενός μπλοκ βιβλιοθήκης· από την 4.9 το `line_flow.js` ελέγχει και τα tutorials TRV και κεραυνού· από την 4.10 το `facts_flow.js` τα δύο tutorials του αρθρωτού SSSC με τις κάρτες θεωρίας· από την 4.13 το `line_flow.js` και το μοντέλο WB, το tutorial cross-bonding και την κάρτα του· από την 4.14 το `facts_flow.js` τη σύνδεση HVDC με MMC και την κάρτα της· από την 4.19 το `step_flow.js` την ενότητα «Γραμμικός λύτης» και από την 4.19.1 την ενότητα «Βήμα του λύτη»· από την 4.19.1 το `features_flow.js` την κάρτα μελέτης των `pf_study` και `opf_study` και την «Εξαγωγή αναφοράς»· από την 4.22 το `gis_flow.js` τα tutorials του υποσταθμού GIS, τους άξονες των γραφημάτων SVG, το σύρσιμο των ετικετών και τον χάρτη του δικτύου· από την 5.0 το `study_flow.js` το τρέξιμο της σελίδας στον φάκελο μελέτης, το εργαλείο προβολής με ανανέωση όσο γράφεται, τη διαφορά δύο τρεξιμάτων και ένα αρχείο του EMTP· από την 5.0.2 το `window_flow.js` το πλαίσιο κάθε παραθύρου, τη μεγέθυνση του «⧉ Μέσα στο …», το μενού «Παράθυρα», και σε κάθε tutorial κανένα id δύο φορές και κανένα ορατό κουμπί χωρίς χειριστή, και το `scope_flow.js` την περιοχή με min–max, το ⚙ και το «μόνο μεγαλώνει»· από την 5.0.5 το `dock_flow.js` το κούμπωμα των καρτών σε περιοχές, τις καρτέλες, το δικό τους παράθυρο, την πλήρη οθόνη, τη διάταξη μετά από ανανέωση και την «Επαναφορά», και τα scopes ενός στοιχείου στο υπομενού και στο παραθυράκι των ακροδεκτών, από την 5.0.6 το διάγραμμα του δικτύου ως καρτέλα δίπλα στο κύκλωμα, τις δύο κάρτες δίπλα δίπλα, το λάσο με το σύνορο από το engine, τον πίνακα «πλήρες απέναντι σε ισοδύναμο» και την περιοχή σε EMT, από την 5.0.7 το Σχ. 15a, που αρνείται δύο ζυγούς στο σύνορο και με έναν δείχνει τη σάρωση απέναντι στους κλάδους Foster, και από την 5.0.8 το `scenario_flow.js` τη γραμμή εντολών και στους δύο πυρήνες: μια μεταβλητή που μένει, το ιστορικό, το Tab, το Ctrl+C σε βρόχο, το plot, τον χώρο μεταβλητών και τις εντολές ως σενάριο, από την 5.0.9 το `dock_flow.js` το FDNE της περιοχής 1, 4, 5, 9 με σύνορο τους 5 και 9, με το «παθητικό» και ένα γράφημα σάρωση ↔ FDNE για κάθε ζυγό, και από την 5.0.10 τις διατάξεις με όνομα (η διάταξη που προτείνει μια μελέτη, η «Ανάλυση» από το μενού, μια διάταξη με όνομα μετά από ανανέωση) και τη δεύτερη οθόνη: τα scopes σε δικό τους παράθυρο του browser, με το ⚙, το διάστημα και το Ctrl+Z εκεί, τα καρέ από εκεί όταν η σελίδα είναι κρυμμένη, μετά από ανανέωση της σελίδας και όταν κλείνει το παράθυρο, και την ένδειξη της GPU* δίπλα στο «Engine», και από την 5.0.11 το `features_flow.js` τη ροή φορτίου του IEEE 9 και το IEC 60909-0 του «Βραχυκύκλωμα σε δίκτυο» από το σχέδιο, με τα αποτελέσματα πάνω στο σχέδιο και τη στρώση του βραχυκυκλώματος στο διάγραμμα, και από την 5.0.13 την κάρτα «Δυναμική RMS» στο σφάλμα του `ieee9_emt` με AVR και PSS: ευσταθές, τα συμβάντα του σχεδίου, πέντε διαγράμματα, και από την 5.0.16 στο `b4dcs2` χωρίς μηχανές: οι τέσσερις σταθμοί, το δίκτυο DC και ο Cd-E1 από την έκφρασή του, και από την 5.1.2 στο `two_area_emt` με PSS και σφάλμα: ευσταθές, πέντε διαγράμματα και ο πίνακας των ιδιοτιμών στην αρχή με τέσσερις τρόπους, πρώτος ο διασυνδετικός στα 0,604 Hz με τις G3 και G4 απέναντι στις G1 και G2, και από την 5.1.7 στο `hvdc_lcc` με το σφάλμα DC: η ζεύξη του σχεδίου, τα πέντε γραφήματά της και τα συμβάντα του διακόπτη, και η ροή φορτίου του ίδιου σχεδίου με το γ του αντιστροφέα πάνω στο σχέδιο). Τρέχουν σε κάθε push στον CI του GitHub (`.github/workflows/ci.yml`): από την 5.0.8 τα tests σε 6 μέρη μαζί, με μια τελευταία εργασία που ελέγχει ότι έτρεξαν όλα, μία φορά το καθένα (`tools/test_shards.py`), και τα σενάρια από τη λίστα του `tools/ui_flows.py`, και από την 5.1.3 η εφαρμογή ως εκτελέσιμο σε Windows και Linux, που ξεκινά και απαντά (`tools/build_exe.py --smoke`).', '',
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
