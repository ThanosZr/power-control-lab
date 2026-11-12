"""Line constants and the CP / FD line models (4.4, ROADMAP §26): pcl/lineconst.py against the EMTP Theory Book (Dommel
ch. 4) and Carson's integral, the numerical Laplace transform against closed forms, and the line in the browser solver
(web/studio/mna.js, part 'TLM') against the same model and the exact line in the frequency domain."""
import json
import math
import os
import subprocess
import tempfile
import unittest
from pathlib import Path

import numpy as np

from pcl import lineconst as lc

ROOT = Path(__file__).resolve().parent.parent
MILE = 1609.344


def node_ok():
    try:
        return subprocess.run(['node', '--version'], capture_output=True).returncode == 0
    except OSError:
        return False


class Constants(unittest.TestCase):
    def test_skin_effect_table_4_1(self):
        """Dommel Table 4.1: tubular conductor, R_dc = 0.0398 Ω/mile, q/r = 0.2258, μ_r = 1."""
        Rdc, r = 0.0398 / MILE, 0.01
        q = 0.2258 * r
        Ldc = lc.z_internal(0, r, q, Rdc, 1, False, s=1j).imag
        self.assertAlmostEqual(Ldc * 1000 / 1e-4, 0.454866, places=5)
        T = {2: (1.0002, 0.99992), 60: (1.1347, 0.93898), 400: (2.4554, 0.47004), 1000: (3.7213, 0.29924),
             10000: (11.2209, 0.09497), 100000: (34.9597, 0.03004), 1e6: (110.0357, 0.00950), 4e6: (219.8336, 0.00475)}
        for f, (rr, ll) in T.items():
            z = lc.z_internal(f, r, q, Rdc)
            self.assertAlmostEqual(z.real / Rdc, rr, delta=1.5e-4 * rr + 1e-4, msg=f)
            self.assertAlmostEqual(z.imag / (2 * math.pi * f) / Ldc, ll, delta=1e-5 + 1e-4 * ll, msg=f)

    def test_carson_series_against_integral(self):
        for h1, h2, x in ((15, 15, 0), (20, 20, 12.2), (30, 12, 40), (8, 25, 3)):
            D = math.hypot(x, h1 + h2)
            ph = math.asin(abs(x) / D)
            for a in (0.1, 1, 3, 5, 8, 12, 30):
                f = (a / (4 * math.pi * math.sqrt(5) * 1e-4 * D)) ** 2 * 100
                s, i = lc.carson_series(D, ph, f, 100), lc.carson_integral(h1, h2, x, f, 100)
                self.assertLess(abs(s - i) / abs(i), 3e-5 if 8 <= a <= 12 else 5e-6, msg=(h1, h2, x, a))

    def test_sequence_tables_4_3_4_4(self):
        """Dommel Tables 4.3 and 4.4: 500 kV line, phases 40 ft apart at 50 ft, 4-conductor bundles as the equivalent
        conductor (r_eq = 7.80524 in, GMR_eq = 7.41838 in, R = 0.1686/4 Ω/mile), skin effect ignored, ρ = 100 Ω·m."""
        inch, ft = 0.0254, 0.3048
        gmr, R, h = 7.41838 * inch, 0.1686 / 4 / MILE, 50 * ft
        xs = [-40 * ft, 0, 40 * ft]

        def Z(f):
            w = 2 * math.pi * f
            z = np.zeros((3, 3), complex)
            for i in range(3):
                for k in range(3):
                    if i == k:
                        z[i, i] = R + 1j * w * lc.MU0 / (2 * math.pi) * math.log(2 * h / gmr) + lc.carson_series(2 * h, 0, f, 100)
                    else:
                        dx = xs[i] - xs[k]
                        D = math.hypot(dx, 2 * h)
                        z[i, k] = 1j * w * lc.MU0 / (2 * math.pi) * math.log(D / abs(dx)) + lc.carson_series(D, math.asin(abs(dx) / D), f, 100)
            return z
        # the printed values, to the last digit: the result must round to them (half a unit of the last digit)
        T3 = {1e-6: ('0.04215', '1.417'), 10: ('0.04215', '1.416'), 100: ('0.04229', '1.416'), 1000: ('0.05003', '1.416'),
              1e4: ('0.3528', '1.413'), 1e5: ('6.229', '1.401')}
        T4 = {1e-6: ('0.04215', '13.94'), 10: ('0.08905', '6.170'), 100: ('0.4960', '5.084'), 1000: ('4.169', '4.052'),
              1e4: ('32.12', '3.164'), 1e5: ('184.0', '2.568')}
        for f in T3:
            z1, z0 = lc.sequence(Z(f))
            w = 2 * math.pi * f
            for got, ref in ((z1.real * MILE, T3[f][0]), (z1.imag / w * MILE * 1e3, T3[f][1]),
                             (z0.real * MILE, T4[f][0]), (z0.imag / w * MILE * 1e3, T4[f][1])):
                half = 0.5 * 10 ** -len(ref.split('.')[1])
                self.assertLessEqual(abs(got - float(ref)), half * 1.001 + 1e-12, msg=(f, got, ref))

    def test_bundle_and_ground_wire_reduction(self):
        """A bundle of two equal conductors equals one conductor of radius √(r·s) at power frequency (lossless
        earth, no internal inductance difference aside), and the elimination keeps the matrices symmetric."""
        d = lc.typical('400kV')
        Z, Y = lc.phase_matrices(d, 50)
        self.assertEqual(Z.shape, (3, 3))
        self.assertLess(np.abs(Z - Z.T).max(), 1e-12 * np.abs(Z).max())
        z1, z0 = lc.sequence(Z)
        c1, c0 = lc.sequence(Y.imag / (2 * math.pi * 50))
        # typical 400 kV values: X₁ ≈ 0.32 Ω/km, C₁ ≈ 11.6 nF/km, R₁ ≈ R_dc/2 at 50 Hz
        self.assertAlmostEqual(z1.imag * 1000, 0.316, delta=0.01)
        self.assertAlmostEqual(c1 * 1e12, 11.6, delta=0.3)
        self.assertAlmostEqual(z1.real * 1000, 0.0587 / 2, delta=0.003)
        self.assertGreater(z0.imag, 2.5 * z1.imag)

    @unittest.skipUnless(node_ok(), 'node')
    def test_typical_data_same_in_js(self):
        js = subprocess.run(['node', '-e', "const P=require('./web/studio/parts.js');console.log(JSON.stringify(P.TLM_TYPICAL))"],
                            cwd=ROOT, capture_output=True, text=True, check=True).stdout
        self.assertEqual(json.loads(js), json.loads(json.dumps(lc.TYPICAL)))


class Models(unittest.TestCase):
    def test_fit_tolerances(self):
        for key in ('150kV', '400kV'):
            m = lc.fd_model(lc.typical(key))
            for q in m['modes']:
                self.assertLessEqual(q['zc']['err'], 0.01, msg=key)
                self.assertLessEqual(q['a']['err'], 0.005, msg=key)
                self.assertTrue(all(p > 0 for p in q['zc']['p'] + q['a']['p']), msg='stable real poles')
                L = m['length'] * 1000
                self.assertGreaterEqual(q['tau'], L / lc.C0 * (1 - 1e-6))

    def test_cp_against_handbook(self):
        """CP at 50 Hz: the aerial modes move close to the speed of light, the ground mode is slower and lossier."""
        m = lc.cp_model(lc.typical('400kV'), 50)
        v = [q['v'] for q in m['modes']]
        self.assertLess(v[0], v[1])
        self.assertGreater(v[2], 0.97 * lc.C0)
        self.assertGreater(m['modes'][0]['R'], 5 * m['modes'][2]['R'])

    def test_tutorial_models_up_to_date(self):
        r = subprocess.run(['python', str(ROOT / 'tools' / 'line_models.py'), '--check'], capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)


class Laplace(unittest.TestCase):
    def test_rc_step(self):
        net = {'nodes': 1, 'el': [('V', 1, 0, 100.0, ('step', 1.0, 0.0)), ('C', 1, 0, 1e-6)]}
        t, V = lc.nlt_solve(net, 1e-3, n=2048)
        self.assertLess(np.abs(V[0] - (1 - np.exp(-t / 1e-4)))[t > 2e-5].max(), 1e-4)

    def test_lossless_line_doubling(self):
        """A single-conductor line over perfect earth without losses: the open end sees 2·E·Z/(Z + R_s) after τ."""
        d = {'rho': 100, 'earth': 'perfect', 'skin': False, 'G': 1e-12, 'length': 30,
             'wires': [{'ph': 1, 'x': 0, 'y': 15, 'r': 1.5, 'Rdc': 1e-9, 'tD': 0.5}]}
        Z0 = 60 * math.log(2 * 15 / 0.015)
        net = {'nodes': 2, 'el': [('V', 1, 0, Z0, ('ramp', 1.0, 2e-6)), ('LINE', [1], [2], d, 'exact'), ('R', 2, 0, 1e9)]}
        t, V = lc.nlt_solve(net, 0.5e-3, n=4096)
        tau = 30e3 / lc.C0
        i = (t > tau + 10e-6) & (t < 3 * tau - 10e-6)
        self.assertLess(np.abs(V[1][i] - 1.0).max(), 0.01)       # matched source: 2·E/2 = E


@unittest.skipUnless(node_ok(), 'node')
class Solver(unittest.TestCase):
    """The part 'TLM' in the browser solver, energizing phase a of the typical 400 kV line (100 km, Deri's earth
    so that the exact line can be evaluated at complex s) through 10 Ω, the other ends through 1 MΩ."""
    @classmethod
    def setUpClass(cls):
        cls.d = lc.typical('400kV')
        cls.d['earth'] = 'deri'
        cls.models = {'cp': lc.cp_model(cls.d, 50), 'fd': lc.fd_model(cls.d)}
        cls.tend = 3e-3

        def net(kind):
            return {'nodes': 6, 'el': [('V', 1, 0, 10.0, ('ramp', 1.0, 20e-6)), ('R', 2, 0, 10.0), ('R', 3, 0, 10.0),
                                       ('LINE', [1, 2, 3], [4, 5, 6], cls.d, kind), ('R', 4, 0, 1e6), ('R', 5, 0, 1e6),
                                       ('R', 6, 0, 1e6)]}
        cls.ref = {k: lc.nlt_solve(net(m), cls.tend, n=8192) for k, m in cls.models.items()}
        cls.exact = lc.nlt_solve(net('exact'), cls.tend, n=8192)

    def js(self, kind, h):
        q = {'data': self.d, 'model': self.models[kind], 'kind': kind, 'f': 50, 'h': h, 'tend': self.tend,
             'src': {'Vpk': 1.0, 'tr': 20e-6, 'Rs': 10.0}, 'R': 1e6}
        with tempfile.NamedTemporaryFile('w', suffix='.json', delete=False) as fh:
            json.dump(q, fh)
        try:
            out = subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'line_cases.js'), fh.name], capture_output=True,
                                 text=True, check=True).stdout
        finally:
            os.unlink(fh.name)
        o = json.loads(out)
        return np.array(o['t']), np.array(o['v'])

    def err(self, t, V, ref):
        tn, Vr = ref
        pk = np.abs(Vr).max()
        return max(np.abs(np.interp(t, tn, Vr[j]) - V[j]).max() / pk for j in range(6))

    def test_cp_same_model(self):
        t, V = self.js('cp', 0.3e-6)
        self.assertLess(self.err(t, V, self.ref["cp"]), 0.004)

    def test_fd_same_model_and_exact_line(self):
        t, V = self.js('fd', 0.3e-6)
        self.assertLess(self.err(t, V, self.ref["fd"]), 0.0025)
        self.assertLess(self.err(t, V, self.exact), 0.006)


if __name__ == '__main__':
    unittest.main()
