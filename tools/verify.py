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
    gen_rows(o['gen'], add)
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
    ('tests/test_step.py', 'βήμα του λύτη (3.13, 3.15)', 'μεταβλητό βήμα απέναντι σε κλειστούς τύπους (RLC, γεννήτρια κρουστικών) και σε λεπτό σταθερό βήμα (flyback, Marx), σταθερές χρόνου και συχνότητες του ελέγχου βήματος, ταλάντωση δύο βημάτων'),
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
    ('tests/test_sparse.py', 'αραιός λύτης (4.2)', 'ίδιοι αριθμοί με τον πυκνό LU (10⁻⁹, ίδιες παραγοντοποιήσεις), αυτόματη επιλογή, μέτρηση: παραγοντοποίηση 1000 αγνώστων ≥ 3 φορές γρηγορότερη (διάμεσος 7)'),
    ('tests/test_library.py', 'βιβλιοθήκη σε ταξινομήσεις (4.6)', 'κάθε στοιχείο σε κάθε ταξινόμηση (μία φορά, εκτός από «Κατά μάθημα»), νέο στοιχείο στα «Άλλα», αναζήτηση χωρίς τόνους, αγαπημένα και πρόσφατα, ελληνική αλφαβητική σειρά'),
    ('tests/test_live_program.py', 'ζωντανές παράμετροι και πρόγραμμα αλλαγών (3.19)', 'ζωντανή αλλαγή = ίδιο πρόγραμμα bit προς bit (ίδια βήματα, ίδια σημεία), ράμπα με ακριβή ενδιάμεση τιμή, D ανά περίοδο χωρίς διπλή μεταγωγή'),
    ('tests/test_api_surface.py', 'δημόσιο API (3.18, σταθερό από την 4.0)', 'ο κατάλογος διαβάζεται από τον κώδικα, είναι ενημερωμένος, μια αφαίρεση ή ένα χαμένο όρισμα σταματά τον έλεγχο· από την 4.0 καμία αφαίρεση μέσα στην 4.x, στην 5.0 μόνο ό,τι ήταν παρωχημένο'),
    ('tests/test_workbench.py', 'το κύκλωμα ως σύστημα υπό έλεγχο (plant) του Control Workbench (3.16)', 'το συμβόλαιο Plant: επαναφορά στην ίδια τροχιά bit προς bit, ανεξάρτητοι κλώνοι, εγγραφή στο registry'),
    ('tests/test_control.py', 'σύνθεση ελέγχου, PI, PI + NN (3.15), αντίστροφο NN και RL (3.16)', 'κλίσεις των δικτύων απέναντι σε πεπερασμένες διαφορές· η πολιτική με θ = 0 και το PI + NN χωρίς μάθηση είναι ο PI bit προς bit· ο καταρράκτης ακολουθεί την αναφορά με φορτίο, χωρίς μάθηση το PI + NN είναι ο PI bit προς bit, το δίκτυο μαθαίνει το ρεύμα φορτίου (T_L + bω)/ψ, IAE/ISE σε κλειστή μορφή'),
    ('tests/test_plotting.py', 'γραφικές για δημοσίευση (3.15)', 'το label_mapping.csv του Lightning Impulse Manager όπως είναι, IEEE 8,8 cm = 249,45 pt, ίδιο αρχείο σε κάθε τρέξιμο, RMS ημιτόνου'),
    ('tests/test_pcl.py', 'σενάρια από κώδικα, πακέτο pcl (3.13)', 'κυμάτωση ΔI = V_o(1 − D)/(L·f_s) σε σάρωση, ίδια αριθμοί με τον λύτη της εφαρμογής, SciPy, CSV/JSON/.mat, γραμμή εντολών'),
    ('tests/test_matlab.py', 'MATLAB/Octave (3.14)', 'pcl_run, pcl_sweep, pcl_read στο Octave: ίδιοι αριθμοί με την Python, κυμάτωση ΔI = V_o(1 − D)/(L·f_s), CSV/JSON/.mat'),
    ('tests/ui/*.js', 'περιβάλλον (Playwright)', 'σχέδιο, scopes, πάνελ, εργαλείο σύρματος, ζωντανές παράμετροι, κονσόλα διαγνωστικών, πάνελ «Σενάρια» (κυμάτωση στο 3 % της θεωρίας, μπλοκ Python ίδιο με το μπλοκ PI)· 4.6: χρόνος ανά καρέ σε zoom, μετακίνηση, σύρσιμο και επιλογή σε μικρό κύκλωμα και σε 200 στοιχεία, με και χωρίς προσομοίωση (`perf_flow`), Ctrl+Z/Ctrl+Y με ελληνικό πληκτρολόγιο και από παντού, ένα βήμα αναίρεσης ανά ενέργεια, βιβλιοθήκη, ροδέλα χωρίς κύλιση της σελίδας, προσομοίωση στον Worker με τα ίδια αποτελέσματα με τη σελίδα (`ux_flow`)'),
]

LIMITS = [
    'Οι απώλειες της γραμμής είναι σταθερή R′ σε σειρά, συγκεντρωμένη σε N τμήματα (Dommel). Συγκλίνει στην κατανεμημένη γραμμή περίπου ως 1/N. Δεν υπάρχουν ακόμη αγωγιμότητα G′, επιδερμικό φαινόμενο, corona και γραμμές εξαρτώμενες από τη συχνότητα (ROADMAP §26).',
    'Η καμπύλη τάσης–χρόνου του σπινθηριστή είναι το κριτήριο ενέργειας διάσπασης με σταθερές U₀, k, D. Οι σταθερές των tutorials είναι ενδεικτικές, όχι μετρήσεις διακένου. Ο σπινθηριστής δεν έχει χωρητικότητα και η γεννήτρια Marx ανάβει χωρίς παρασιτικές χωρητικότητες.',
    'Δεν υπάρχει ακόμη κορεσμός πυρήνα μετασχηματιστή (ROADMAP §31). Ο πυρήνας τριών σκελών (4.2) είναι γραμμική μαγνήτιση μηδενικής ακολουθίας στην πλευρά 1, χωρίς κορεσμό. Ο διακόπτης ισχύος διακόπτει ιδανικά στο μηδέν του ρεύματος, χωρίς τόξο· η TRV μετριέται (pcl.network.trv) χωρίς τις περιβάλλουσες του IEC 62271-100.',
    'IEC 60909 (4.2): το I_b του δικτύου δοκιμής του TR 60909-4 βγαίνει με τη Formula (77) του 2016 στους ζυγούς 1, 2, 8, με τη μορφή του 2001 (jX″) στους 6, 7· στους 3–5 (κοντά στις μονάδες S, SO) καμία από τις δύο δεν πέφτει στο 0,02 % (0,06–1,3 %). Το i_p με 20 Hz του TR είναι με R_Gf. Ελάχιστα ρεύματα: c_min, χωρίς διορθώσεις και κινητήρες, R στη θερμοκρασία τέλους· χωρίς λ για το I_k κοντά σε γεννήτρια.',
    'Φορτίο ZIP στο EMT (4.2): πηγές ρεύματος στο πλαίσιο PLL (20 Hz) με |v| μέσω χαμηλοπερατού 10 Hz και αντίσταση απόσβεσης 20 % του |S|· ακολουθεί αλλαγές τάσης με αυτή τη δυναμική, όχι ακαριαία.',
    'Οι μηχανές έχουν τυπικές τιμές όπου λείπουν δεδομένα. Ελέγχονται απέναντι σε ανεξάρτητες ΔΕ, όχι σε μετρήσεις.',
    'Γεννήτρια (4.3): χωρίς κορεσμό και χωρίς αντίδραση Canay· έως ένας αποσβεστήρας στον άξονα d και δύο στον q. Ο άξονας προχωρά μετά από κάθε βήμα (leapfrog, δεύτερης τάξης) με την ηλεκτρική ροπή του βήματος, όχι στην ίδια επανάληψη με το δίκτυο. Η εκκίνηση από ροή φορτίου λύνει το κύκλωμα με φασιθέτες της θετικής ακολουθίας· οι γραμμές Bergeron, τα φορτία σταθερής ισχύος και τα αλεξικέραυνα μένουν έξω. Οι τιμές του Σχ. 5 του First Benchmark είναι ανάγνωση από το σχήμα (±0,1 pu).',
    'Γραμμές (4.4): σταθερός πραγματικός T_i (όπως το CP και το FD του EMTP)· σε γραμμή χωρίς μετάθεση φάσεων οι επαγόμενες τάσεις απέχουν από την ακριβή γραμμή έως λίγα %. Το CP κρατά τις παραμέτρους μιας συχνότητας. Η σειρά Carson αλλάζει σε ασυμπτωτική στο a = 10 (το LINE CONSTANTS στο a = 5). Χωρίς πολυστρωματικό έδαφος, κορώνα και μοντέλο στο πεδίο των φάσεων (ULM). Η γραμμή ξεκινά χωρίς φορτίο (και με εκκίνηση από ροή φορτίου). Ο λύτης SciPy δεν τρέχει γραμμές από γεωμετρία· η ανεξάρτητη αναφορά είναι ο μετασχηματισμός Laplace.',
    'Καλώδια (4.5): μονοπολικά ομοαξονικά καλώδια (αγωγός, θωράκιση, οπλισμός, με όσα στρώματα χρειάζεται), όχι καλώδια σε κοινό σωλήνα (pipe-type) ούτε ημιαγώγιμα στρώματα ως χωριστά στρώματα· θωρακίσεις με φάση 0 γειωμένες στα δύο άκρα, χωρίς μετάθεση (cross-bonding). Σταθερός πραγματικός T_i: στο υποβρύχιο 220 kV το σφάλμα του σταθερού T_i είναι περίπου 5 % σε κάποιες συχνότητες (στις τάσεις των άκρων λιγότερο από 0,4 %), για τα καλώδια το σωστό μοντέλο είναι στο πεδίο των φάσεων (ULM, ROADMAP §26). Το tanδ δίνεται στα 50 Hz και ακολουθεί αιτιατό μοντέλο ευρείας ζώνης (σταθερό tanδ σε όλες τις συχνότητες δεν είναι αιτιατό και η προσαρμογή του A δεν πέφτει κάτω από 1 %). Εναέριοι αγωγοί και καλώδια στην ίδια γραμμή όχι ακόμη.',
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
        q, ref = q.replace('|', '\\|'), ref.replace('|', '\\|')      # 4.3: a |V| in a label must not split the table
        out.append(f'| {area} | {q} | {ref} | {fmt(e, u)} | {fmt(s, u)} | {ds} | {fmt(tol, u)} | {"✓" if abs(d) <= tol else "✗"} |')
    out += ['', '## Τι καλύπτουν τα υπόλοιπα tests', '', '| Αρχείο | Τι ελέγχει | Αναφορές |', '|---|---|---|']
    out += [f'| `{a}` | {b} | {c} |' for a, b, c in TESTS]
    out += ['', 'Μαζί 344 tests (Python και Node) και 14 σενάρια περιβάλλοντος (από την 4.6 και η μέτρηση της απόκρισης του σχεδίου, `perf_flow.js`). Τρέχουν σε κάθε push στον CI του GitHub (`.github/workflows/ci.yml`).', '',
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
