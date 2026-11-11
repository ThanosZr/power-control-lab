"""Synchronous generator, shaft and EMT start from a load flow (4.3, ROADMAP §31.6–§31.7, §25).

The browser solver through tests/js/gen_cases.js, the SciPy solver through pcl. The reference values come from the sources
they name, never from the solver:
- IEEE SSR Task Force, "First benchmark model for computer simulation of subsynchronous resonance", IEEE Trans. PAS, 1977:
  Table I (rotor circuit), Table II (standard data), Table III (shaft), Fig. 4 (torsional modes), the results of case 1-S
  (six-mass model) and Fig. 5 (case 1-T, read from the figure);
- the classical decrement curve of a three-phase short circuit (Kundur, ch. 5; IEEE Std 115);
- the load flow of pcl.network (Newton–Raphson, checked against PYPOWER in 4.2) and Anderson & Fouad, Power System
  Control and Stability, Table 9.1 (load angles) and Example 2.7 (swing of the 9-bus system)."""
import json
import math
import shutil
import subprocess
import unittest
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
CASES = ROOT / 'tests' / 'js' / 'gen_cases.js'
_cache = {}


def case(name):
    if name not in _cache:
        out = subprocess.run(['node', str(CASES), name], capture_output=True, text=True, timeout=600, cwd=ROOT)
        if out.returncode:
            raise RuntimeError(out.stderr)
        _cache.update(json.loads(out.stdout))
    return _cache[name]


@unittest.skipUnless(shutil.which('node'), 'node not installed')
class FirstBenchmark(unittest.TestCase):
    def test_conversion_reproduces_table_I(self):
        """Table II → the rotor circuit by the exact definitions (the paper's appendix) gives Table I (printed to 2–3 digits;
        the resistances as 377·R)."""
        r = case('fbm_conv')['exact']
        self.assertIsNone(r['note'])
        self.assertAlmostEqual(r['Xad'], 1.66, 9)
        self.assertAlmostEqual(r['Xaq'], 1.58, 9)
        d, q = r['d'], r['q']
        table = {'d': [(0.062, 0.53), (0.0055, 1.54)], 'q': [(0.326, 5.3), (0.095, 3.1)]}
        for axis, got in (('d', d), ('q', q)):
            for X, R377 in table[axis]:
                w = min(got, key=lambda g: abs(g['X'] - X))
                self.assertLess(abs(w['X'] - X), max(0.015 * X, 0.0001), (axis, w, X))
                self.assertLess(abs(377 * w['R'] / R377 - 1), 0.01, (axis, w, R377))
        # the field is the slow winding of the d axis
        self.assertAlmostEqual(d[0]['X'], 0.062, 2)

    def test_short_circuit_time_constants(self):
        """T′_d, T″_d from X″_d = X_d·T′_d·T″_d/(T′_d0·T″_d0) and eq. (13) of the appendix; the usual approximations
        T′_d ≈ X′_d/X_d·T′_d0 = 0.406 s and T″_d ≈ X″_d/X′_d·T″_d0 = 0.0256 s within 2 %."""
        T1, T2 = case('fbm_conv')['Tsc']
        self.assertAlmostEqual(T1 * T2, 0.135 / 1.79 * 4.3 * 0.032, 12)
        self.assertLess(abs(T1 / (0.169 / 1.79 * 4.3) - 1), 0.02)
        self.assertLess(abs(T2 / (0.135 / 0.169 * 0.032) - 1), 0.02)

    def test_torsional_modes(self):
        """Free shaft (open-circuit generator), spectrum of the shaft torques: the modes of Fig. 4 within 0.03 Hz; the same
        as the eigenvalues of Table III (ω² = ω_b·K/(2H), K in pu torque per rad)."""
        H = np.array([0.092897, 0.155589, 0.858670, 0.884215, 0.868495, 0.0342165])
        K = [19.303, 34.929, 52.038, 70.858, 2.822]
        M = np.zeros((6, 6))
        for i, k in enumerate(K):
            M[i, i] += k
            M[i + 1, i + 1] += k
            M[i, i + 1] -= k
            M[i + 1, i] -= k
        ev = np.sort(np.sqrt(np.abs(np.linalg.eigvals(377 * M / (2 * H[:, None]))))) / (2 * math.pi)
        paper = [15.71, 20.21, 25.55, 32.28]
        np.testing.assert_allclose(ev[1:5], paper, atol=0.01)
        peaks = case('shaft')['peaks']
        self.assertEqual(len(peaks), 4)
        np.testing.assert_allclose(peaks, paper, atol=0.03)

    def test_case_1S_self_excitation(self):
        """Case 1-S: mode 3 grows at 1.525 1/s (six-mass model); sustained (zero growth) with 75.9 pu more damping on the
        generator mass, with 0.467 pu armature resistance, or with X_c 0.047 pu smaller."""
        r = case('case1s')
        g = r['base']['25.55']
        self.assertLess(abs(g['growth'] - 1.525) / 1.525, 0.02, g)
        for k in ('dR', 'dD', 'dXc'):
            self.assertLess(abs(r[k]['25.55']['growth']), 0.03, (k, r[k]['25.55']))

    def test_case_1T_fault(self):
        """Case 1-T: steady before the fault (P = 0.9, Q = 0.436 pu); the shaft torques of Fig. 5 (read from the figure,
        ±0.25 pu and ±0.015 s): LPA–LPB 3.4 pu at 0.135 s and 3.3 pu at 0.32 s, GEN–EXC 1.0 pu at 0.44 s; the electrical
        torque 2.8 pu at 0.11 s (opposite sign in the figure)."""
        r = case('case1t')
        Q = 0.9 * math.tan(math.acos(0.9))
        for k in ('pre', 'atf'):
            self.assertAlmostEqual(r[k]['pe'], 0.9, 4)
            self.assertAlmostEqual(r[k]['qe'], Q, 3)
        for key, (v, t) in {'ts3a': (3.4, 0.135), 'ts3b': (3.3, 0.32), 'ts5': (1.0, 0.44)}.items():
            self.assertLess(abs(r[key][0] - v), 0.25, (key, r[key]))
            self.assertLess(abs(r[key][1] - t), 0.015, (key, r[key]))
        self.assertLess(abs(r['te'][0] - 2.8), 0.35, r['te'])
        self.assertLess(abs(r['te'][1] - 0.11), 0.01, r['te'])


@unittest.skipUnless(shutil.which('node'), 'node not installed')
class Generator(unittest.TestCase):
    def test_short_circuit_decrement(self):
        """Three-phase short circuit at no load: the symmetrical RMS (mean of the phases) follows
        E·[(1/X″ − 1/X′)·e^(−τ/T″) + (1/X′ − 1/X)·e^(−τ/T′) + 1/X]·I_b within 1.5 % (the 2nd harmonic of X″_q ≠ X″_d and
        R_a are outside the formula)."""
        r = case('gen_sc')
        p = r['gen']
        X, X1, X2, T10, T20 = p['Xd'], p['Xdp'], p['Xdpp'], p['Td0p'], p['Td0pp']
        # the exact short-circuit time constants (same definitions as in the first test, solved here independently)
        P = X2 * T10 * T20 / X
        f = lambda T: X1 * (T * (T - P / T) - (T - T10) * (T - T20)) - X * T * (T - P / T)
        lo, hi = 0.5 * X1 / X * T10, 1.5 * X1 / X * T10
        for _ in range(200):
            m = (lo + hi) / 2
            if f(lo) * f(m) <= 0:
                hi = m
            else:
                lo = m
        T1 = (lo + hi) / 2
        T2 = P / T1
        Ib = p['Sn'] / (math.sqrt(3) * p['Un'])
        for row in r['res']:
            tau = row['tau']
            ref = ((1 / X2 - 1 / X1) * math.exp(-tau / T2) + (1 / X1 - 1 / X) * math.exp(-tau / T1) + 1 / X) * Ib
            self.assertLess(abs(sum(row['ac']) / 3 / ref - 1), 0.015, (tau, row, ref))

    def test_steady_start(self):
        """A generator on an RL load starts from |V| = 1∠20°: P = 0.8, Q = 0.3 pu and the load angle do not move in 1 s."""
        r = case('steady')
        self.assertAlmostEqual(r['lf'][0]['P'], 0.8, 6)
        self.assertAlmostEqual(r['lf'][0]['Q'], 0.3, 4)
        for k in ('pe', 'qe', 'd'):
            self.assertAlmostEqual(r['end'][k], r['start'][k], 6)
        self.assertAlmostEqual(r['end']['w'], 1.0, 9)


@unittest.skipUnless(shutil.which('node'), 'node not installed')
class IEEE9(unittest.TestCase):
    def test_emt_holds_the_load_flow(self):
        """IEEE 9 (pcl.network.ieee9) in EMT from its load flow: after 0.3 s every bus voltage (fundamental phasor of
        phase a) equals the load flow within 10⁻⁵ pu and 10⁻³°, and so do P, Q of the generators."""
        import pcl.network as nw
        lf = nw.ieee9().load_flow()
        r = case('ieee9')
        self.assertEqual(r['warnings'], [])
        for b, (V, ang) in r['bus'].items():
            self.assertLess(abs(V - lf['buses'][b]['V']), 1e-5, b)
            self.assertLess(abs(ang - lf['buses'][b]['angle']), 1e-3, b)
        for g, b in (('G1', '1'), ('G2', '2'), ('G3', '3')):
            self.assertLess(abs(r['gen'][g]['pe'] - lf['buses'][b]['P'] / 100e6), 1e-4, g)
            self.assertLess(abs(r['gen'][g]['qe'] - lf['buses'][b]['Q'] / 100e6), 1e-4, g)
        # the tutorial carries the same load flow
        for b, (V, ang) in r['lfTut'].items():
            self.assertAlmostEqual(V, lf['buses'][b]['V'], 6)
            self.assertAlmostEqual(ang, lf['buses'][b]['angle'], 5)

    def test_load_angles_of_anderson_fouad(self):
        """δ (angle of the q axis, against bus 1) of generators 2 and 3: 61.0975° and 54.1431° in Table 9.1 (generator 1
        there is classical, its angle is that of E′)."""
        r = case('ieee9')['gen']
        self.assertLess(abs(r['G2']['d'] - 61.0975), 0.01)
        self.assertLess(abs(r['G3']['d'] - 54.1431), 0.01)

    def test_swing_of_example_2_7(self):
        """The fault of Example 2.7 (bus 7 of the book, 8 here; five cycles; the line opened at its current zeros), with
        the machines as the classical model: δ₂₁ swings by 67.5° (85° from 17.5°) and peaks 0.43 s after the fault in the
        book; within 10 % and 0.05 s (EMT with breakers against a phasor model)."""
        s = case('ieee9')['swing']
        self.assertLess(abs((s['max'] - s['d0']) / 67.5 - 1), 0.10, s)
        self.assertLess(abs(s['t'] - 0.43), 0.05, s)

    def test_to_emt_export(self):
        """Network.to_emt: the same network as a project (LINE3, LOAD3 at the load-flow voltage, GEN3 with |V|∠θ), run by
        pcl in the browser solver: the generators keep the load-flow P and Q."""
        import pcl
        import pcl.network as nw
        net = nw.ieee9()
        lf = net.load_flow()
        pr = pcl.Project(net.to_emt(lf, machines=nw.IEEE9_MACHINES))
        res = pr.run(0.2, channels=['Y:G1:pe', 'Y:G2:pe', 'Y:G3:qe', 'Y:G2'])
        self.assertLess(abs(res['Y:G1:pe'][-1] - lf['buses']['1']['P'] / 100e6), 1e-4)
        self.assertLess(abs(res['Y:G2:pe'][-1] - 1.63), 1e-4)
        self.assertLess(abs(res['Y:G3:qe'][-1] - lf['buses']['3']['Q'] / 100e6), 1e-4)
        self.assertAlmostEqual(res['Y:G2'][-1], 1.0, 7)


@unittest.skipUnless(shutil.which('node'), 'node not installed')
class Parity(unittest.TestCase):
    def test_browser_and_scipy(self):
        """The same generator (three masses, a step of T_m at 50 ms) in both solvers: the speed within 5·10⁻⁶ pu, torque
        and P within 10⁻⁴ pu, the shaft torque within 2·10⁻⁴ pu, the phase current within 2·10⁻³ of its amplitude."""
        import pcl
        Un, Sn, f = 13.8e3, 100e6, 50
        Zb, w = Un * Un / Sn, 2 * math.pi * f

        def C(cid, typ, params):
            return {'id': cid, 'type': typ, 'x': 0, 'y': 0, 'rot': 0, 'flip': False, 'label': cid, 'params': params}
        comps = [C('G1', 'GEN3', {'V0': 1, 'ang0': 20, 'mech': 'sched', 'Tm': '0:0.8, 0.05:0.9', 'shaft': 'multi', 'Hm': '0.3; 2.5; 0.05',
                                  'Km': '30; 3', 'Dm': '0;0;0', 'Dmu': '0;0', 'Tfr': '100; 0; 0', 'gm': 2}), C('GND', 'GND', {})]
        wires = []
        for k in 'abc':
            comps += [C('R' + k, 'R', {'R': Zb / 0.8}), C('L' + k, 'L', {'L': Zb / 0.3 / w})]
            for a, b in ((('G1', k), ('R' + k, 'a')), (('R' + k, 'b'), ('GND', 'g')), (('G1', k), ('L' + k, 'a')), (('L' + k, 'b'), ('GND', 'g'))):
                wires.append({'id': f'w{len(wires)}', 'a': {'c': a[0], 'p': a[1]}, 'b': {'c': b[0], 'p': b[1]}, 'pts': []})
        pr = pcl.Project({'version': 4, 'components': comps, 'wires': wires})
        ch = ['Y:G1', 'Y:G1:te', 'Y:G1:pe', 'Y:G1:ts1', 'I:G1']
        rb = pr.run(0.2, channels=ch, hdiv=2000)
        rs = pr.run(0.2, channels=ch, solver='scipy', rtol=1e-8)
        tol = {'Y:G1': 5e-6, 'Y:G1:te': 1e-4, 'Y:G1:pe': 1e-4, 'Y:G1:ts1': 2e-4}     # pu
        for k in ch:
            yb, ys = np.array(rb[k]), np.interp(rb.t, rs.t, rs[k])
            if k in tol:
                self.assertLess(np.max(np.abs(yb - ys)), tol[k], k)
            else:                               # the phase current: within 2·10⁻³ of its amplitude
                self.assertLess(np.max(np.abs(yb - ys)) / np.max(np.abs(yb)), 2e-3, k)


if __name__ == '__main__':
    unittest.main()
