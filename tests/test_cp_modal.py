"""5.0.1 (decision 355, THEORY §8ΩΖ.10): the line without distortion (TL, loss 'dl') and the CP line from data per mode
(TLM, src 'modal', as the 'CP m-phase' of the EMTP), against closed forms, the steady state of their two-port, each other,
and the SciPy solver (tests/js/cp_cases.js)."""
import cmath
import json
import math
import subprocess
import unittest
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
CASES = ROOT / 'tests' / 'js' / 'cp_cases.js'


class CpLines(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        r = subprocess.run(['node', str(CASES)], capture_output=True, text=True, timeout=900)
        if r.returncode:
            raise RuntimeError(r.stderr[-2000:])
        cls.R = json.loads(r.stdout)

    def test_without_distortion(self):
        # matched source, open end: the wave arrives times e^(−R/2Z) and doubles (the open end through G_min = 1 nS)
        o = self.R['dl']
        for v in o['rec']:
            self.assertAlmostEqual(v, o['att'] * o['V'], delta=1e-6 * o['V'])

    def test_one_mode_is_the_single_phase_line(self):
        self.assertEqual(self.R['modal1']['lumped'], 0)
        self.assertEqual(self.R['modal1']['dl'], 0)

    def test_transposed_modes(self):
        # Clarke: equal phase voltages are the ground mode only, (V, −V, 0) the aerial modes only
        z, a = self.R['zero'], self.R['aerial']
        for row in z['rec']:
            for x in row:
                self.assertAlmostEqual(x, z['att'] * z['V'], delta=2e-6 * z['V'])
        for row in a['rec']:
            self.assertAlmostEqual(row[0], a['att'] * a['V'], delta=2e-6 * a['V'])
            self.assertAlmostEqual(row[1], -a['att'] * a['V'], delta=2e-6 * a['V'])
            self.assertLess(abs(row[2]), 1e-9 * a['V'])

    def test_clarke_matrix_and_user_ti(self):
        C = np.array(self.R['ti']['clarke'])
        self.assertLess(np.max(np.abs(C.T @ C - np.eye(3))), 1e-15)           # orthonormal
        self.assertLess(np.max(np.abs(C[:, 0] - 1 / math.sqrt(3))), 1e-16)    # the ground mode: all phases alike
        self.assertTrue(self.R['ti']['same'])

    def test_kinds_of_data(self):
        o = self.R['lc']
        for k in ('lc', 'zt'):
            for a, b in zip(o[k]['modes'], o['zv']['modes']):
                for q in ('Zc', 'tau', 'R'):
                    self.assertAlmostEqual(a[q], b[q], delta=1e-12 * b[q], msg=(k, q))
        self.assertEqual(len(o['zv']['modes']), 3)

    def test_steady_state(self):
        # the discrete model of a line without distortion is the two-port of γℓ = R/2Z + jωτ: from the steady state the far
        # voltage of the first period is a sinusoid of that amplitude (no transient)
        o = self.R['ss']
        w = 2 * math.pi * o['f']
        g = complex(o['Rp'] * o['len'] / (2 * o['Z']), w * o['len'] / o['v'])
        y11, y12 = 1 / (o['Z'] * cmath.tanh(g)), -1 / (o['Z'] * cmath.sinh(g))
        A = np.array([[1 + o['Rs'] * y11, o['Rs'] * y12], [y12, y11 + 1 / o['RL']]])
        V1, V2 = np.linalg.solve(A, np.array([o['Vp'], 0]))
        rec = np.array(o['rec'])
        t, v = rec[:, 0], rec[:, 1]
        M = np.column_stack([np.cos(w * t), np.sin(w * t)])
        c, *_ = np.linalg.lstsq(M, v, rcond=None)
        self.assertLess(abs(math.hypot(*c) / abs(V2) - 1), 1e-4)
        self.assertLess(np.max(np.abs(M @ c - v)), 1e-4 * abs(V2))

    def test_messages(self):
        e = self.R['errs']
        self.assertIn('2 γραμμές', e['rows'])
        self.assertIn('τρεις αριθμούς', e['three'])
        self.assertIn('δεν αντιστρέφεται', e['ti'])
        self.assertIn('Z_c', e['zc'])
        self.assertIsNone(e['ok'])

    def test_scipy(self):
        from engine.batch import simulate
        for c in self.R['batch']:
            d = c['batch']
            self.assertEqual(d['skipped'], [], c['name'])
            r = simulate({'net': d['net'], 'channels': d['channels'], 't_end': c['T'], 'method': 'Radau', 'rtol': 1e-8, 'atol': 1e-9,
                          'max_step': 1e-6, 'max_points': 400000, '_local': True, 'wall': 300})
            self.assertEqual(r['status'], 'ok', (c['name'], r.get('message')))
            rec, t = np.array(c['rec']), np.array(r['t'])
            for j, k in enumerate(c['keys']):
                js, py = rec[:, j + 1], np.interp(rec[:, 0], t, np.array(r['ch'][k], float))
                sc = np.max(np.abs(js))
                # the fronts are steps: away from them the two solvers agree
                ok = np.abs(js - py) / sc < 1e-6
                self.assertGreater(ok.mean(), 0.97, (c['name'], k, float(np.max(np.abs(js - py)) / sc)))


if __name__ == '__main__':
    unittest.main()
