"""4.10 (ROADMAP §50): the modular arm of H bridges (CHB) in two implementations, the nearest-level modulation with sorting
(NLC), the single-phase SOGI-PLL and the controller of a modular SSSC; their numbers against closed forms, against each
other and against the SciPy solver. 4.17: the central controller of the three phases (SSSC3), the converter-controlled
series capacitor (CCSC) and the IEEE 9 case in EMT with the m-SSSC."""
import json
import math
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def cases(c):
    out = subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'sssc_cases.js'), json.dumps(c)], capture_output=True,
                         text=True, check=True, timeout=900, cwd=ROOT).stdout
    return json.loads(out)


def line_current(V=122e3, d=4.0, R=8.0, L=0.12, X=0.0, f=50.0):
    """Amplitude of the current between V∠δ and V∠0 through R + j(ωL − X): the steady state with an ideal series reactance."""
    return 2 * V * math.sin(math.radians(d) / 2) / math.hypot(R, 2 * math.pi * f * L - X)



def ccsc_device(X, m, f=50.0):
    """The CCSC as a series impedance (4.17, the card's closed form): C_s (X_C) in parallel with the converter's branch
    Z_c = R_c + (jωL_c ∥ R_p) and a lossless arm of voltage (V_d − jX)·I, with V_d such that the arm takes no active
    power. Z = (Z_c + V_d − jX)/(1 + jZ_c/X_C); I_conv/I = 1 − jZ/X_C (0 at X = X_C). Returns Z, |I_C/I|, |I_conv/I|."""
    w = 2 * math.pi * f
    Zl = 1j * w * m['Lc'] * m['Rp'] / (m['Rp'] + 1j * w * m['Lc'])
    Zc = m['Rc'] + Zl
    a = 1 + 1j * Zc / m['Xc']
    k = 1 / (a * m['Xc'])
    A, B = 1 - 1j * k * Zc - k * X, -1j * k
    qa, qb, qc = B.real, A.real - X * B.imag, -X * A.imag   # P_arm ∝ qa·V_d² + qb·V_d + qc
    if abs(qa) < 1e-12:
        Vd = -qc / qb
    else:
        ds = math.sqrt(max(qb * qb - 4 * qa * qc, 0.0))
        Vd = min((-qb + ds) / (2 * qa), (-qb - ds) / (2 * qa), key=abs)
    Iv = A + B * Vd
    return (Vd - 1j * X + Zc) / a, abs(1 - Iv), abs(Iv)

class Arm(unittest.TestCase):
    def test_fast_equals_detailed(self):
        # one row of the solver with the N capacitors as states against N bridges of switches and capacitors
        for cell in ('fb', 'hb'):
            r = cases([{'kind': 'armpair', 'N': 4, 'cell': cell, 'T': 0.06,
                        'expr': '250*sin(2*pi*50*t - 0.3)' if cell == 'fb' else '200 + 150*sin(2*pi*50*t - 0.3)'}])[0]
            self.assertEqual(r['warn'], [])
            self.assertEqual(r['n'], r['nb'])
            self.assertEqual(r['dn'], 0, r)                         # the same level at every sample
            self.assertLess(r['di'], 1e-5 * r['imax'] + 1e-4, r)    # (the off switches: 1 GΩ)
            self.assertLess(r['dv'], 1e-2, r)

    def test_half_bridge_never_negative(self):
        r = cases([{'kind': 'arm', 'N': 4, 'cell': 'hb', 'T': 0.04, 'expr': '-300*sin(2*pi*50*t)'}])[0]
        self.assertTrue(all(q[3] >= 0 for q in r['out']), r['out'][:5])


class Modulator(unittest.TestCase):
    def test_levels_and_sorting(self):
        v = [100, 98, 103, 101]                    # mean 100.5: 210 V is 2.09 levels -> n = 2
        r = cases([{'kind': 'nlc', 'v': v, 'ref': 210, 'i': 5}, {'kind': 'nlc', 'v': v, 'ref': 210, 'i': -5},
                   {'kind': 'nlc', 'v': v, 'ref': -210, 'i': 5}, {'kind': 'nlc', 'v': v, 'ref': 260, 'i': 5},
                   {'kind': 'nlc', 'v': v, 'ref': -500, 'i': 5}, {'kind': 'nlc', 'v': v, 'ref': -210, 'i': 5, 'cell': 'hb'},
                   {'kind': 'nlc', 'v': v, 'ref': 210, 'i': 5, 'norm': 'nom', 'Vdc': 70}])
        self.assertEqual(r[0]['s'], [1, 1, 0, 0])   # charging: the two lowest (98, 100)
        self.assertEqual(r[1]['s'], [0, 0, 1, 1])   # discharging: the two highest (103, 101)
        self.assertEqual(r[2]['s'], [0, 0, -1, -1])  # negative level, the current discharges them: the highest
        self.assertEqual(r[3]['n'], 3)              # 260/100.5 = 2.59
        self.assertEqual(r[4]['n'], -4)             # limited to −N
        self.assertEqual(r[5]['n'], 0)              # half bridges: 0 … N
        self.assertEqual(r[6]['n'], 3)              # with the nominal 70 V: 210/70
        self.assertAlmostEqual(r[0]['vav'], 100.5)

    def test_reduced_switching(self):
        v = [100, 98, 103, 101]
        r = cases([{'kind': 'nlc', 'v': v, 'ref': 210, 'i': -5, 'sel': 'reduced', 'band': 10, 's': [1, 1, 0, 0], 'n': 2},
                   {'kind': 'nlc', 'v': v, 'ref': 210, 'i': -5, 'sel': 'reduced', 'band': 2, 's': [1, 1, 0, 0], 'n': 2},
                   {'kind': 'nlc', 'v': v, 'ref': 210, 'i': 5, 'sel': 'reduced', 'band': 10, 's': [1, 0, 0, 0], 'n': 1},
                   {'kind': 'nlc', 'v': v, 'ref': 100, 'i': 5, 'sel': 'reduced', 'band': 10, 's': [0, 0, 1, 1], 'n': 2}])
        self.assertEqual((r[0]['s'], r[0]['sw']), ([1, 1, 0, 0], 0))   # within the band: nothing changes
        self.assertEqual((r[1]['s'], r[1]['sw']), ([0, 0, 1, 1], 4))   # outside: sorted again
        self.assertEqual((r[2]['s'], r[2]['sw']), ([1, 1, 0, 0], 1))   # one more: the lowest of those outside
        self.assertEqual((r[3]['s'], r[3]['sw']), ([0, 0, 0, 1], 1))   # one less (charging): the highest goes out


class Sogi(unittest.TestCase):
    def test_lock_and_two_implementations(self):
        # (every state integrated as INT, first order: the amplitude is ~0.3 % high with h = 10 μs, ωh = 0.003)
        r = cases([{'kind': 'sogi', 'A': 1000, 'f': 50, 'ph': 0.7, 'hDiv': 2000}, {'kind': 'sogi', 'A': 300, 'f': 49.5, 'ph': -1.2, 'T': 0.5, 'hDiv': 2000},
                   {'kind': 'sogi', 'A': 1000, 'f': 50, 'ph': 0.7, 'dc': 100, 'hDiv': 2000}])
        for q, f, A in zip(r, (50, 49.5, 50), (1000, 300, 1000)):
            self.assertEqual(q['warn'], [])
            self.assertLess(q['d'], 1e-9, q)                 # the block and the integrators + expressions: the same numbers
            self.assertLess(abs(q['f'] - f), 0.02, q)
            self.assertLess(abs(q['amp'] / A - 1), 4e-3, q)
            self.assertLess(abs(q['err']), 5e-3, q)          # θ = ωt + φ − 90° (v = V̂·sin(θ + 90°), as the three-phase PLL)
        # a DC part of 10 % in the input: the classic SOGI (k₀ = 0) passes it to qv′ and the loop loses its lock
        q = cases([{'kind': 'sogi', 'A': 1000, 'f': 50, 'ph': 0.7, 'dc': 100, 'k0': 0, 'hDiv': 2000}])[0]
        self.assertGreater(abs(q['f'] - 50), 1, q)


class Loop(unittest.TestCase):
    """Two sources 122 kV∠4° and ∠0, a line 8 Ω + 120 mH (37.7 Ω), the m-SSSC with 10 cells of 1 kV (10 mF)."""

    def test_reactance_injection(self):
        r = cases([{'kind': 'loop', 'mode': 'x', 'X': '10'}, {'kind': 'loop', 'mode': 'x', 'X': '-8'}, {'kind': 'loop', 'mode': 'x', 'X': '20'},
                   {'kind': 'loop', 'mode': 'x', 'X': '-25', 'T': 0.8}])
        for q, X in zip(r, (10, -8, 20, -25)):
            self.assertEqual(q['warn'], [])
            self.assertLess(abs(q['X'] / X - 1), 0.03 if X > -20 else 0.05, q)
            self.assertLess(abs(q['Iamp'] / line_current(X=X) - 1), 0.015 if X > -20 else 0.04, q)   # (−25 Ω: a slow swing of ±7 %)
            self.assertTrue(900 < q['vmin'] and q['vmax'] < 1100, q)      # the Δθ loop keeps the capacitors charged
            self.assertEqual(q['cells'], 10)
        self.assertGreater(r[0]['Iamp'], 1.3 * line_current())           # 221 A without compensation

    def test_fixed_modulation_index(self):
        # m_a·N·V_C = 5 kV in quadrature: capacitive raises the current, inductive lowers it; the steady state of
        # |ΔV| = |(R + jωL)·I ± jV_q| (the current-dependent solution of the line with a constant series voltage)
        r = cases([{'kind': 'loop', 'mode': 'ma', 'ma': 0.5}, {'kind': 'loop', 'mode': 'ma', 'ma': 0.5, 'sense': 'ind'}])
        dV, R, XL, Vq = 2 * 122e3 * math.sin(math.radians(2)), 8.0, 2 * math.pi * 50 * 0.12, 5000.0
        for q, sg in zip(r, (1, -1)):
            a, b, c = R * R + XL * XL, -2 * sg * XL * Vq, Vq * Vq - dV * dV
            I = (-b + math.sqrt(b * b - 4 * a * c)) / (2 * a)
            self.assertLess(abs(q['Iamp'] / I - 1), 0.03, (q, I))      # (the staircase and the Δθ part)

    def test_current_control_and_reduced_switching(self):
        r = cases([{'kind': 'loop', 'mode': 'i', 'Iref': '280', 'T': 1.0},
                   {'kind': 'loop', 'mode': 'x', 'X': '10', 'sel': 'reduced', 'band': 30}, {'kind': 'loop', 'mode': 'x', 'X': '10'}])
        self.assertLess(abs(r[0]['Iamp'] / 280 - 1), 0.01, r[0])
        self.assertLess(r[1]['sw'], r[2]['sw'] / 5, (r[1]['sw'], r[2]['sw']))
        self.assertLess(abs(r[1]['X'] / 10 - 1), 0.03, r[1])
        self.assertLess(r[1]['vmax'] - r[1]['vmin'], 160, r[1])


class LoadFlow(unittest.TestCase):
    """pcl.network: the compensator as a series reactance in the load flow (IEEE 9 buses), its targets and the placement."""

    def test_reactance_equals_a_shorter_branch(self):
        from pcl import network as N
        a = N.ieee9()
        e = a.element('br5')
        Xc = 0.3 * e['x'] * a._zb(e['a'])                     # 30 % of the branch's reactance, capacitive
        a.sssc('br5', X=Xc, name='S1')
        r1 = a.load_flow()
        b = N.ieee9()
        b.element('br5')['x'] *= 0.7
        r2 = b.load_flow()
        self.assertLess(max(abs(r1['buses'][k]['V'] - r2['buses'][k]['V']) for k in r1['buses']), 1e-12)
        self.assertLess(max(abs(r1['buses'][k]['angle'] - r2['buses'][k]['angle']) for k in r1['buses']), 1e-9)
        s = r1['sssc']['S1']
        self.assertAlmostEqual(s['Vq'], Xc * s['I'], delta=1e-6 * abs(s['Vq']))
        self.assertAlmostEqual(s['Q'], -3 * Xc * s['I'] ** 2, delta=1e-6 * abs(s['Q']))
        # the flows of a branch add up to its losses, and the losses of the case to the sum over the branches
        self.assertAlmostEqual(sum(f['loss'] for f in r1['branches']), r1['losses'], delta=1e-6 * r1['losses'])

    def test_targets_and_round_trip(self):
        from pcl import network as N
        for ln, X in (('br5', 30.0), ('br2', -20.0), ('br9', 25.0)):
            a = N.ieee9()
            a.sssc(ln, X=X, name='S1')
            r = a.load_flow()
            f = next(b for b in r['branches'] if b['name'] == ln)
            for kw in ({'P': f['Pa']}, {'Vq': r['sssc']['S1']['Vq']}):
                b = N.ieee9()
                b.sssc(ln, name='S1', **kw)
                q = b.load_flow()
                self.assertTrue(q['converged'])
                self.assertAlmostEqual(q['sssc']['S1']['X'], X, delta=1e-6 * abs(X), msg=(ln, kw))
            c = N.from_dict(N.to_dict(a))                        # saved and read back with its compensator
            self.assertAlmostEqual(c.load_flow()['buses']['5']['V'], r['buses']['5']['V'], delta=1e-14)

    def test_placement(self):
        from pcl import network as N
        lines = ['br2', 'br3', 'br5', 'br6', 'br8', 'br9']
        r = N.sssc_placement(N.ieee9(), lines=lines, weights={'loading': 1, 'losses': 1, 'vdev': 0.5, 'size': 0.2})
        self.assertEqual(len(r['cases']), 5 * len(lines))
        self.assertEqual(r['best'], min(r['cases'], key=lambda c: c['score']))
        keys = N.SSSC_GOALS
        for c in r['pareto']:                                  # nobody on the front is dominated
            self.assertFalse(any(all(d[k] <= c[k] for k in keys) and any(d[k] < c[k] for k in keys) for d in r['cases']))
        for c in r['cases']:
            if not c['pareto']:
                self.assertTrue(any(all(d[k] <= c[k] for k in keys) and any(d[k] < c[k] for k in keys) for d in r['cases']))
        small = N.sssc_placement(N.ieee9(), lines=lines, Smax=1e5)
        self.assertTrue(all(c['size'] <= 1e5 for c in small['cases']))


class Central(unittest.TestCase):
    """4.17: the central controller of a three-phase m-SSSC (SSSC3): three lines between V∠δ and V∠0 (8 Ω + 120 mH), one
    arm per phase."""

    def test_reactance_and_energy(self):
        r = cases([{'kind': 'loop3', 'X': '10'}, {'kind': 'loop3', 'X': '-8'}, {'kind': 'loop3', 'X': '10', 'sync': 'phase'}])
        V = 122e3
        for o, X in zip(r, (10.0, -8.0, 10.0)):
            self.assertEqual(o['warn'], [])
            for p in 'abc':
                self.assertLess(abs(o['ip'][p] / line_current(V=V, X=X) - 1), 0.01, (X, p, o))
            self.assertLess(abs(o['X'] / X - 1), 0.01, o)
            for v in o['vav']:
                self.assertLess(abs(v / 1000 - 1), 0.005, o)

    def test_asymmetric_phase(self):
        # R + 10 Ω in phase a: the currents differ, the cells stay together; Σ D_k carries the losses only
        o = cases([{'kind': 'loop3', 'X': '10', 'T': 0.8, 'Ra': 10}])[0]
        self.assertLess(o['ip']['a'], 0.95 * o['ip']['b'], o)
        for v in o['vav']:
            self.assertLess(abs(v / 1000 - 1), 0.005, o)
        self.assertGreater(o['D'][0], 300, o)
        self.assertLess(o['D'][1] + o['D'][2], -300, o)

    def test_against_scipy(self):
        # the central controller and three detailed arms (N = 2) in the SciPy solver: currents, X, a cell voltage, D_a, u
        # halfway between the samples of the modulators (5 kHz)
        import numpy as np
        from engine.batch import simulate
        o = cases([{'kind': 'scipy3', 'N': 2, 'T': 0.025, 'ton': 0.006, 'X': '5', 'fs': 5000}])[0]
        self.assertEqual(o['warn'], [])
        d = o['batch']
        self.assertEqual(d['skipped'], [])
        rec = np.array(o['rec'])
        ts = rec[:, 0]
        r = simulate({'net': d['net'], 'channels': d['channels'], 't_end': float(ts[-1]), 'method': 'Radau', 'rtol': 1e-6,
                      'atol': 1e-9, 'max_points': 400000, '_local': True, 'wall': 900})
        self.assertEqual(r['status'], 'ok', r['message'])
        t = np.array(r['t'])
        tm = (np.arange(int(round(ts[-1] * 5000))) + 0.5) / 5000
        tol = {'Y:AMa': 0.1, 'Y:AMb': 0.1, 'Y:AMc': 0.1, 'Y:SC/XM': 2e-3, 'Y:SC/VKFa': 5e-3, 'Y:SC/Da': 0.01, 'Y:SC/U': 0.05}
        for j, k in enumerate(o['ch']):
            b = np.interp(tm, ts, rec[:, j + 1])
            s = np.interp(tm, t, np.array(r['ch'][k], float))
            self.assertLessEqual(float(np.max(np.abs(b - s))), tol[k], k)


class SciPy(unittest.TestCase):
    def test_arm_against_scipy(self):
        # the SciPy export takes the detailed arm (switches and capacitors); compared halfway between the samples of the
        # modulator, where both solvers hold the same states
        import numpy as np
        from engine.batch import simulate
        o = cases([{'kind': 'scipy', 'T': 0.01}])[0]
        self.assertEqual(o['warn'], [])
        d = o['batch']
        self.assertEqual(d['skipped'], [])
        self.assertFalse(any(e['k'] == 'CHB' for e in d['net']['els']))
        rec = np.array(o['rec'])
        ts = rec[:, 0]
        r = simulate({'net': d['net'], 'channels': d['channels'], 't_end': float(ts[-1]), 'method': 'Radau', 'rtol': 1e-7,
                      'atol': 1e-9, 'max_points': 400000, '_local': True, 'wall': 600})
        self.assertEqual(r['status'], 'ok', r['message'])
        t = np.array(r['t'])
        tm = (np.arange(int(round(ts[-1] * 5000))) + 0.5) / 5000
        tol = {'I:L1': 2e-3, 'Y:CH1/NLC:vav': 2e-3, 'Y:CH1/NLC': 0}
        for j, k in enumerate(o['ch']):
            b = np.interp(tm, ts, rec[:, j + 1])
            s = np.interp(tm, t, np.array(r['ch'][k], float))
            self.assertLessEqual(float(np.max(np.abs(b - s))), tol[k], k)



def tutorial_lf(X, m):
    """pcl.network's load flow of the three-phase tutorial: the grid's EMF (slack at bus 0) behind U_n²/S″k, π lines, the
    coupling inductance as a branch from bus 1 to bus 4 carrying the compensator, the load as a constant impedance."""
    from pcl import network as N
    w, Un = 2 * math.pi * m['f'], m['Un']
    n = N.Network(f=m['f'])
    for b in '01342':
        n.bus(b, Un)
    n.feeder('0', Sk=m['Sk'], V=1.0)
    R = Un * Un / m['Sk'] / math.sqrt(1 + m['XR'] ** 2)
    n.reactor('0', R * m['XR'], R=R, b='1', name='Zk')
    for nm, (a, b) in {'L13': ('1', '3'), 'L32': ('3', '2'), 'L42': ('4', '2')}.items():
        n.line(a, b, m['r'], w * m['l'], length=m['lines'][nm], B=w * m['c'], name=nm)
    n.branch_pu('1', '4', 0.0, w * m['Lk'] / (Un * Un / n.S_base), name='K14')
    n.sssc('K14', X=X, name='S1')
    n.load('2', m['P'], m['Q'], zip=(1, 0, 0))
    return n.load_flow()


class Tutorials(unittest.TestCase):
    """The two tutorials as the app builds them (headless)."""

    def test_single_phase_steps_and_detailed_arm(self):
        # X_ref 0 → +10 Ω (0,3 s) → −8 Ω (0,8 s): the current at the end of each part against the line with an ideal series
        # reactance. The detailed arm (40 switches, 10 capacitors) from the steady start keeps its charged capacitors
        # (4.10: a capacitor with v₀ is a stiff source in the DC part of the start) and gives the same current
        keys = ['I:L1', 'Y:SC1/XM', 'Y:CH1/NLC:vav']
        a, d = cases([{'kind': 'tut', 'id': 'sssc_1ph', 'opts': {}, 'at': [0.28, 0.78, 1.2], 'keys': keys},
                      {'kind': 'tut', 'id': 'sssc_1ph', 'opts': {'impl': 'blocks', 'X': 'cap'}, 'at': [0.12, 0.7], 'keys': keys}])
        V = 150e3 * math.sqrt(2 / 3)
        for q, X in zip(a['out'], (0.0, 10.0, -8.0)):
            self.assertLess(abs(q['I:L1']['amp'] / line_current(V=V, X=X) - 1), 0.01, (X, q))
            if X:
                self.assertLess(abs(q['Y:SC1/XM']['mean'] / X - 1), 0.02, (X, q))
            self.assertLess(abs(q['Y:CH1/NLC:vav']['mean'] / 1000 - 1), 0.03, (X, q))
        self.assertEqual(d['warn'], [])
        self.assertLess(abs(d['out'][0]['Y:CH1/NLC:vav']['mean'] - 1000), 0.5, d['out'][0])
        self.assertLess(abs(d['out'][1]['I:L1']['amp'] / line_current(V=V, X=10.0) - 1), 0.005, d['out'][1])

    def test_three_phase_against_load_flow(self):
        # 150 kV, four buses: the run (0 → +10 → −8 Ω) against the load flow of the same network with the compensator as a
        # series reactance; with one controller per phase (4.10) and with the central controller (4.17, the default)
        cells = ['Y:CHa/NLC:vav', 'Y:CHb/NLC:vav', 'Y:CHc/NLC:vav']
        per = ['Y:AMa', 'Y:AMb', 'Y:AMc', 'Y:SCa/XM', 'Y:SCb/XM', 'Y:SCc/XM', 'V:LD2/Ra'] + cells
        cen = ['Y:AMa', 'Y:AMb', 'Y:AMc', 'Y:SC3/XM', 'V:LD2/Ra'] + cells
        rp, rc = cases([{'kind': 'tut', 'id': 'sssc_3ph', 'opts': {'ctl': 'phase'}, 'at': [0.28, 0.78, 1.2], 'keys': per},
                        {'kind': 'tut', 'id': 'sssc_3ph', 'opts': {}, 'at': [0.28, 0.78, 1.2], 'keys': cen}])
        for r, xs, tc in ((rp, ['Y:SC' + p + '/XM' for p in 'abc'], 0.08), (rc, ['Y:SC3/XM'], 0.006)):
            self.assertEqual(r['warn'], [])
            m = r['meta']['sssc']
            for q, X in zip(r['out'], (0.0, 10.0, -8.0)):
                lf = tutorial_lf(X, m)
                self.assertTrue(lf['converged'])
                for p in 'abc':
                    self.assertLess(abs(q['Y:AM' + p]['amp'] / math.sqrt(2) / lf['sssc']['S1']['I'] - 1), 0.006, (X, p, q))
                for k in xs:
                    if X:
                        self.assertLess(abs(q[k]['mean'] / X - 1), 0.02, (X, k, q))
                V2 = lf['buses']['2']['V'] * m['Un'] / math.sqrt(3)
                self.assertLess(abs(q['V:LD2/Ra']['amp'] / math.sqrt(2) / V2 - 1), 0.003, (X, q))
                # the mean cell voltages: within ±8 % with one controller per phase (4.10), ±0.6 % with the central one
                for k in cells:
                    self.assertLess(abs(q[k]['mean'] / 1000 - 1), tc, (X, k, q))
        self.assertEqual(rc['meta']['sssc']['ctl'], 'central')

    def test_three_phase_asymmetry(self):
        # R = 10 Ω in phase a of the compensator's path: the currents differ; the central controller (positive sequence or
        # a SOGI per phase) keeps the mean cell voltages of the three phases together; on the positive sequence phase a
        # needs a large part D_a in phase with its current (its voltage is not in quadrature with its own current)
        keys = ['Y:AMa', 'Y:AMb', 'Y:SC3/XM', 'Y:CHa/NLC:vav', 'Y:CHb/NLC:vav', 'Y:CHc/NLC:vav', 'Y:SC3/Da', 'Y:SC3/Db', 'Y:SC3/Dc']
        rp, rs = cases([{'kind': 'tut', 'id': 'sssc_3ph', 'opts': {'unb': 'r'}, 'at': [0.78, 1.2], 'keys': keys},
                        {'kind': 'tut', 'id': 'sssc_3ph', 'opts': {'unb': 'r', 'ctl': 'cphase'}, 'at': [0.78, 1.2], 'keys': keys}])
        for r in (rp, rs):
            self.assertEqual(r['warn'], [])
            for q, X in zip(r['out'], (10.0, -8.0)):
                self.assertLess(q['Y:AMa']['amp'], 0.97 * q['Y:AMb']['amp'], q)
                self.assertLess(abs(q['Y:SC3/XM']['mean'] / X - 1), 0.02, (X, q))
                for p in 'abc':
                    self.assertLess(abs(q['Y:CH' + p + '/NLC:vav']['mean'] / 1000 - 1), 0.01, (X, p, q))
        q = rp['out'][0]
        self.assertGreater(q['Y:SC3/Da']['mean'], 200, q)        # positive sequence: phase a takes ~0.2 MW more
        self.assertLess(abs(rs['out'][0]['Y:SC3/Da']['mean']), 50, rs['out'][0])

    def test_ccsc(self):
        # the converter-controlled series capacitor (4.17): bypass → the capacitor alone (0.2 s) → the converter in
        # parallel (0.5 s) at X = X_C (the natural point), 22 Ω (boost, 0.8 s), 8 Ω (1.1 s); the line current against the
        # device as a series reactance, the capacitor's share (X/X_C)·I and the converter's I − I_C
        keys = ['I:L1', 'Y:AM3', 'Y:AM2', 'Y:SC1/XM', 'Y:CH1/NLC:vav']
        r = cases([{'kind': 'tut', 'id': 'ccsc_1ph', 'opts': {}, 'at': [0.19, 0.48, 0.78, 1.08, 1.4], 'keys': keys}])[0]
        self.assertEqual(r['warn'], [])
        m = r['meta']['ccsc']
        V = 150e3 * math.sqrt(2 / 3)
        for q, X, conv in zip(r['out'], (0.0, 15.0, 15.0, 22.0, 8.0), (False, False, True, True, True)):
            if conv:   # the device with its converter branch (the card's closed form)
                Z, ic, iv = ccsc_device(X, m)
                I = 2 * V * math.sin(math.radians(4) / 2) / abs(8.0 + 1j * 2 * math.pi * 50 * 0.12 + Z)
                Ic, Iv = ic * I, iv * I
            else:
                I = line_current(V=V, X=X)
                Ic, Iv = (I if X else 0.0), 0.0
            self.assertLess(abs(q['I:L1']['amp'] / I - 1), 0.015, (X, q))
            self.assertLess(abs(q['Y:AM3']['amp'] - Ic), 0.03 * I + 1, (X, q))
            if conv:
                self.assertLess(abs(q['Y:AM2']['amp'] - Iv), 0.03 * I + 6, (X, q))
                self.assertLess(abs(q['Y:SC1/XM']['mean'] / X - 1), 0.02, (X, q))
                self.assertLess(abs(q['Y:CH1/NLC:vav']['mean'] / m['Vdc'] - 1), 0.05, (X, q))
            else:
                self.assertLess(q['Y:AM2']['amp'], 1.0, (X, q))   # the converter's branch open


def ieee9_sssc_lf(X, Lk=5e-3, f=60.0):
    """pcl.network's load flow of the tutorial ieee9_sssc: ieee9() with its loads as constant impedances (at the voltages
    of the base load flow, as the EMT), the coupling inductance as a branch 7–7s carrying the compensator, the line 7–6
    (br5) from 7s."""
    from pcl import network as N
    V0 = {5: 1.012654, 7: 1.015883, 9: 0.995631}
    LD = {5: (90e6, 30e6), 7: (100e6, 35e6), 9: (125e6, 50e6)}
    net = N.ieee9()
    for b in (5, 7, 9):
        net.remove(f'load{b}')
        P, Q = LD[b]
        net.load(str(b), P / V0[b] ** 2, Q / V0[b] ** 2, zip=(1, 0, 0), name=f'Z{b}')
    net.bus('7s', 345e3)
    net.element('br5')['b'] = '7s'
    net.branch_pu('7', '7s', 0.0, 2 * math.pi * f * Lk / (345e3 ** 2 / 100e6), name='K7')
    net.sssc('K7', X=X, name='S')
    r = net.load_flow()
    k = next(b for b in r['branches'] if b['name'] == 'K7')
    return {'I': math.hypot(k['Pa'], k['Qa']) / (math.sqrt(3) * r['buses']['7']['V'] * 345e3), 'P': k['Pa'] / 1e6,
            'Q': k['Qa'] / 1e6, 'V5': r['buses']['5']['V'], 'V7': r['buses']['7']['V'], 'V9': r['buses']['9']['V'],
            'Vq': r['sssc']['S']['Vq'], 'converged': r['converged']}


class Ieee9(unittest.TestCase):
    """4.17: the IEEE 9 case in EMT with the three-phase m-SSSC on the line 7–6."""

    def test_placement_and_table(self):
        # the line of the tutorial is the choice of sssc_placement (equal weights); the table of the card is pcl.network's
        from pcl import network as N
        best = N.sssc_placement(N.ieee9())['best']
        self.assertEqual(best['line'], 'br5')
        self.assertAlmostEqual(best['X'], 0.15 * 0.1008 * 345e3 ** 2 / 100e6, places=6)
        r = cases([{'kind': 'tut', 'id': 'ieee9_sssc', 'opts': {}, 'at': [0.01], 'keys': ['Y:AMa'], 'f': 60}])[0]
        tab = r['meta']['ieee9sssc']['lf']
        for k, q in tab.items():
            lf = ieee9_sssc_lf(float(k))
            self.assertTrue(lf['converged'])
            for f, v in q.items():
                self.assertLess(abs(v - lf[f]), 1e-5 * max(1.0, abs(lf[f])), (k, f, v, lf[f]))

    def test_emt_against_load_flow(self):
        # X 0 → +60 Ω at 0.4 s: before the step and 2.1 s after it, the current of the line and the bus voltages against
        # the load flow with the same series reactance; the governors (the turbines at their ratings, 4.17) hold the case
        keys = ['Y:AMa', 'Y:AMb', 'Y:AMc', 'Y:SC3/XM', 'V:LD5/Ra', 'V:LD7/Ra', 'V:LD9/Ra', 'Y:CHa/NLC:vav', 'Y:G2:pe']
        r = cases([{'kind': 'tut', 'id': 'ieee9_sssc', 'opts': {}, 'at': [0.38, 2.5], 'keys': keys, 'f': 60}])[0]
        self.assertEqual(r['warn'], [])
        tab = r['meta']['ieee9sssc']['lf']
        Vb = 345e3 / math.sqrt(3)
        for q, X in zip(r['out'], ('0', '60')):
            for p in 'abc':
                self.assertLess(abs(q['Y:AM' + p]['amp'] / math.sqrt(2) / tab[X]['I'] - 1), 0.006, (X, p, q))
            for b in (5, 7, 9):
                self.assertLess(abs(q['V:LD%d/Ra' % b]['amp'] / math.sqrt(2) / Vb / tab[X]['V%d' % b] - 1), 0.002, (X, b, q))
            self.assertLess(abs(q['Y:CHa/NLC:vav']['mean'] / 1000 - 1), 0.005, q)
            self.assertLess(abs(q['Y:G2:pe']['mean'] / 1.63 - 1), 0.01, q)
        self.assertLess(abs(r['out'][1]['Y:SC3/XM']['mean'] / 60 - 1), 0.005, r['out'][1])

    def test_governors_in_equilibrium(self):
        # ieee9_emt with AVR, PSS and governors and no disturbance (the turbines at the ratings of Anderson & Fouad,
        # 4.17): P_e and δ stay; before, the valve of G2 (163 MW on P_r = 1) was at its limit and the case drifted
        r = cases([{'kind': 'tut', 'id': 'ieee9_emt', 'opts': {'ev': 'none', 'ctl': 'full'}, 'at': [0.1, 1.0],
                    'keys': ['Y:G1:pe', 'Y:G2:pe', 'Y:G3:pe', 'Y:G2:d'], 'f': 60}])[0]
        for q in r['out']:
            for g, P in (('G1', 0.71643), ('G2', 1.63), ('G3', 0.85001)):
                self.assertLess(abs(q['Y:%s:pe' % g]['mean'] - P), 2e-3, (g, q))
            self.assertLess(abs(q['Y:G2:d']['mean'] - 61.099), 0.05, q)


if __name__ == '__main__':
    unittest.main()
