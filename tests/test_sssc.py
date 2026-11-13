"""4.10 (ROADMAP §50): the modular arm of H bridges (CHB) in two implementations, the nearest-level modulation with sorting
(NLC), the single-phase SOGI-PLL and the controller of a modular SSSC; their numbers against closed forms, against each
other and against the SciPy solver."""
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


if __name__ == '__main__':
    unittest.main()
