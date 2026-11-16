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
    f = ST.view({'case': 'ieee118', 'study': 'pf', 'format': 'dxf'})['text'].split('\n')
    add(A, 'σχέδιο DXF του ieee118: οντότητες LINE', '186 κλάδοι και μία γραμμή για καθέναν από τους 99 ζυγούς με φορτίο', 186 + 99,
        sum(1 for a, b in zip(f[0:-1:2], f[1:-1:2]) if a.strip() == '0' and b == 'LINE'), 0, '')


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
    ('tests/test_netview.py', 'το διάγραμμα του δικτύου μιας μελέτης και ο προβολέας του (4.19.4, ROADMAP §73, `pcl/netview.py`, `web/studio/netview.js`, `tests/js/netview_cases.js`)', 'διάταξη: κάθε δίκτυο δοκιμής παίρνει θέσεις, διάμεσος κλάδος μία μονάδα, κανένας ζυγός πάνω σε άλλον, ίδιο δίκτυο ίδια εικόνα· ακτινικός τροφοδότης ως δέντρο· στρώσεις απέναντι στο αποτέλεσμα της μελέτης τους· το N−1 μετρά ό,τι προσθέτει η διαταραχή· SVG ως έγκυρο XML· DXF με τις στρώσεις CAD του, διαβασμένο και από τη βιβλιοθήκη `ezdxf`· ο προβολέας στο Node: μοντέλο, προσαρμογή στο παράθυρο, εύρεση, λεπτομέρεια ανά μεγέθυνση, ένα καρέ σε καμβά που καταγράφει τις κλήσεις του, κλάδος εκτός λειτουργίας διακεκομμένος, και ο διαδραστικός προβολέας (σύρσιμο, ροδέλα γύρω από τον δείκτη, όρια μεγέθυνσης, εύρεση ζυγού, νέο μέγεθος καμβά, καταστροφή)'),
    ('tests/test_netfile.py', 'αρχεία δικτύου και αλλαγές ως δεδομένα (4.19.4, ROADMAP §73, `pcl/netfile.py`, `pcl/study.py`)', 'τα δέκα δίκτυα γραμμένα ως MATPOWER και διαβασμένα πίσω: ίδια ροή φορτίου σε κάθε bit, ίδιο κόστος OPF· το JSON· αναγνώριση της μορφής· αρχείο με ζυγό εκτός, κόστος που δεν είναι πολυώνυμο και γραμμή DC: διαβάζεται και το λέει· τι δεν είναι δίκτυο· κάθε αλλαγή με την πρότασή της, πάνω σε αντίγραφο· 14 αρνήσεις με το μήνυμά τους· μελέτη με `edits` = οι ίδιες αλλαγές στον κώδικα· το διάγραμμα κρατά τις θέσεις του· SVG, DXF, αναφορά και αρχείο του αλλαγμένου δικτύου· δίκτυο από αρχείο μέσα από τα αιτήματα και τις ενέργειες του server'),
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
    ('tests/test_ev_weights.py', 'τα βάρη του πολυκριτηριακού του οχήματος (4.18.1)', 'moevc2: w_s↑ ⇒ IAE↓, w_e↑ ⇒ Wh/km↓ και IAE↑, eco < ισορροπημένος < performance στα Wh/km και αντίστροφα στο IAE, keep ≤ 1· το moevc της 4.8 με keep 1,15 και w_s χωρίς επίδραση'),
    ('tests/test_look.py', 'τεχνική όψη του σχεδίου (4.17.3, ROADMAP §65)', 'διαδρομές μόνο οριζόντιες/κατακόρυφες (χωρίς εξομάλυνση) απέναντι σε γνωστές μορφές, σήμανση χωρίς αλλαγή των υπολοίπων, αντίσταση IEC και ANSI, όλα τα σύμβολα της βιβλιοθήκης· `scope_flow.js` στον browser'),
    ('tests/test_plotcore.py', 'πυρήνας των γραφημάτων (4.17.2, ROADMAP §63)', 'ticks χωρίς επικάλυψη για 28 συνδυασμούς διαστήματος και πλάτους, βήματα 1–2–5, ετικέτες με τα δεκαδικά του βήματος και ένα πρόθεμα ανά άξονα, όρια που κρατούν το 0, σταθερή αυτόματη κλίμακα (ανοίγει αμέσως με περιθώριο, κλείνει μετά από 2 s, σταθερή στην παύση)· και `tests/ui/scope_flow.js` στον browser'),
    ('tests/test_inputs.py', 'είσοδοι του κυκλώματος και παράμετροι από εκφράσεις (4.17.1, ROADMAP §59)', 'σταθερά και παράμετρος ως είσοδοι, «= …» στο δίκτυο και στην εξαγωγή του SciPy, αλυσίδα, το μπλοκ έκφρασης με τις εισόδους, προειδοποιήσεις (κυκλική εξάρτηση, άγνωστο, διπλό, λάθος όνομα), είσοδοι των tutorials (EV: J_eq = J_m + m·(r_w/n)², και με m = 150 kg· ΣΡ/ΣΡ), κέρδη του Ćuk με R από έκφραση, «Ανάπτυξη» με εκφράσεις, μονάδα «=» που μένει κείμενο, pcl inputs/set'),
    ('tests/test_tune.py', 'κέρδη PI/PID του PWM από το κύκλωμα (4.17, ROADMAP §59)', 'μέσο μοντέλο CCM των buck, boost, buck–boost, Ćuk, SEPIC απέναντι σε ανεξάρτητη μεταγραφή (10⁻⁷) και στο engine.models (10⁻⁶)· κλίση της μόνιμης κατάστασης (3 %) και απόκριση σε ημιτονικό D (0,1 %, 0,1°) από την προσομοίωση· κλειστός βρόχος με PI και PID στην αναφορά (1,5 %)· προειδοποίηση για κέρδη αντίθετου πρόσημου· λίστα ρόλων· ξαναϋπολογισμός· ίδιο τρέξιμο στον SciPy (0,5 %)'),
    ('tests/test_watch.py', 'πλακίδια σημάτων και ελέγχων πάνω στο σχέδιο (4.8)', 'διάταξη, βήματα, κορεσμός, καμπύλη (first/min/max/last ανά στήλη), ρυθμιστικό· ο διακόπτης «Μαθαίνει» ζωντανά = ίδιο πρόγραμμα bit προς bit'),
    ('tests/test_ev.py', 'ηλεκτρικό όχημα και πολυκριτηριακός ελεγκτής (4.8)', 'δύο λεπτά με επαναλαμβανόμενο κύκλο (στάση στο τέλος κάθε κύκλου, διπλάσια απόσταση, σταθερή μνήμη), ενέργεια απέναντι στο φορτίο της μπαταρίας (τάση ανάμεσα στις OCV), 50–80 km/kWh με την τριβή της μηχανής της 4.17, οι προεπιλογές των τρόπων του Control Workbench, εκφράσεις με σταθερές ίδιες bit προς bit'),
    ('tests/test_recording.py', 'καταγραφή σε αρχείο (4.8)', 'όνομα από τον server, μόνο αριθμοί, κανένα όνομα έξω από τον φάκελο, όριο μεγέθους· 4.11: ανάγνωση διαστήματος (γραμμές, ή πρώτη/min/max/τελευταία ανά στήλη) απέναντι σε numpy, ευρετήριο που μεγαλώνει, φάκελος του χρήστη, καθαρισμός των προσωρινών, γεγονότα δίπλα στο αρχείο· 4.12: λίστα με μεγέθη, γεγονότα που ξαναδιαβάζονται, συμπίεση σε .gz'),
    ('tests/test_pcl.py', 'σενάρια από κώδικα, πακέτο pcl (3.13)', 'κυμάτωση ΔI = V_o(1 − D)/(L·f_s) σε σάρωση, ίδια αριθμοί με τον λύτη της εφαρμογής, SciPy, CSV/JSON/.mat, γραμμή εντολών'),
    ('tests/test_matlab.py', 'MATLAB/Octave (3.14, PclPlant 4.8.1)', 'ελεγκτής στο Octave γύρω από κύκλωμα (PclPlant): ίδια νούμερα με την Python σε 10⁻¹², ζωντανή αλλαγή και επαναφορά, το πρότυπο παράθυρο· pcl_run, pcl_sweep, pcl_read στο Octave: ίδιοι αριθμοί με την Python, κυμάτωση ΔI = V_o(1 − D)/(L·f_s), CSV/JSON/.mat'),
    ('tests/ui/*.js', 'περιβάλλον (Playwright)', 'σχέδιο, scopes, πάνελ, εργαλείο σύρματος, ζωντανές παράμετροι, κονσόλα διαγνωστικών, πάνελ «Σενάρια» (κυμάτωση στο 3 % της θεωρίας, μπλοκ Python ίδιο με το μπλοκ PI)· 4.6: χρόνος ανά καρέ σε zoom, μετακίνηση, σύρσιμο και επιλογή σε μικρό κύκλωμα και σε 200 στοιχεία, με και χωρίς προσομοίωση (`perf_flow`), Ctrl+Z/Ctrl+Y με ελληνικό πληκτρολόγιο και από παντού, ένα βήμα αναίρεσης ανά ενέργεια, βιβλιοθήκη, ροδέλα χωρίς κύλιση της σελίδας, προσομοίωση στον Worker με τα ίδια αποτελέσματα με τη σελίδα (`ux_flow`)'),
]

LIMITS = [
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
    'Ροή φορτίου και OPF (4.19.1): η εμπρός–πίσω σάρωση δεν έχει ζυγούς PV ούτε βρόχους (το λέει και προτείνει Newton–Raphson)· κόστη μόνο πολυωνυμικά ως δεύτερου βαθμού· το εσωτερικό σημείο δεν έχει πλήρη σφαιρικοποίηση (σε έντονα μη κυρτό πρόβλημα μπορεί να μη συγκλίνει, και το λέει)· δεν υπάρχουν ολομορφική εμφύτευση και ροή συνεχούς παραμέτρου (continuation)· ο ανεξάρτητος έλεγχος του DC-OPF με τετραγωνικά κόστη είναι μόνο οι συνθήκες KKT· σε λίγους ζυγούς των αρχείων IEEE 118 και 300 η δημοσιευμένη τάση δεν συμφωνεί με τα δεδομένα του ίδιου του αρχείου (γι\' αυτό διάμεσος και 95 % των ζυγών). Οι πυρήνες `pcl.powerflow`, `pcl.opf`, `pcl.ipm` είναι πειραματικοί στον κατάλογο API.',
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
    out += ['', 'Μαζί 775 tests (Python και Node) και 19 σενάρια περιβάλλοντος (από την 4.6 η μέτρηση της απόκρισης του σχεδίου, `perf_flow.js`· από την 4.7 της απόκρισης παντού, `speed_flow.js`· από την 4.8 τα πλακίδια, `watch_flow.js`, και το όχημα με την καταγραφή σε αρχείο, `ev_flow.js`, που από την 4.8.1 ελέγχει και τη γεννήτρια με AVR, PSS και ρυθμιστή και το εσωτερικό ενός μπλοκ βιβλιοθήκης· από την 4.9 το `line_flow.js` ελέγχει και τα tutorials TRV και κεραυνού· από την 4.10 το `facts_flow.js` τα δύο tutorials του αρθρωτού SSSC με τις κάρτες θεωρίας· από την 4.13 το `line_flow.js` και το μοντέλο WB, το tutorial cross-bonding και την κάρτα του· από την 4.14 το `facts_flow.js` τη σύνδεση HVDC με MMC και την κάρτα της· από την 4.19 το `step_flow.js` την ενότητα «Γραμμικός λύτης» και από την 4.19.1 την ενότητα «Βήμα του λύτη»· από την 4.19.1 το `features_flow.js` την κάρτα μελέτης των `pf_study` και `opf_study` και την «Εξαγωγή αναφοράς»). Τρέχουν σε κάθε push στον CI του GitHub (`.github/workflows/ci.yml`).', '',
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
