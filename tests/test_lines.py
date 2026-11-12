"""Line constants and the CP / FD line models (4.4, ROADMAP §26): pcl/lineconst.py against the EMTP Theory Book (Dommel
ch. 4) and Carson's integral, the numerical Laplace transform against closed forms, and the line in the browser solver
(web/studio/mna.js, part 'TLM') against the same model and the exact line in the frequency domain. Cables (4.5, Dommel
ch. 5): the coaxial loops against a field computation of concentric shells, Pollaczek against Wedepohl, the earth
against the sea limit, the coaxial mode against its closed form, and a submarine cable in the solver."""
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


def _peec(conds, f, Rref):
    """Impedance matrix of concentric tubular conductors from a field computation independent of Dommel's formulas: each
    conductor split into thin shells with uniform current, the shells coupled by their partial inductances (current
    returning at the radius Rref) and the conductors as the shells in parallel."""
    sh, own = [], []
    for k, (ri, ro, rho, n, dmin) in enumerate(conds):
        # uniform shells and shells graded towards the surfaces (skin outside, proximity inside)
        if ri == 0:
            e = np.concatenate([[0], ro - np.geomspace(dmin, ro, n)])
        else:
            g = np.geomspace(dmin, (ro - ri) / 2, n // 2)
            e = np.concatenate([ri + g, ro - g])
        e = np.unique(np.round(np.clip(np.concatenate([e, np.linspace(ri, ro, n // 2)]), ri, ro), 12))
        for a, b in zip(e[:-1], e[1:]):
            sh.append((a, b, rho))
            own.append(k)
    w, n = 2 * math.pi * f, len(sh)
    Z = np.zeros((n, n), complex)
    k0 = lc.MU0 / (2 * math.pi)

    def own_l(ri, ro):          # internal inductance of a tube with uniform current, per μ₀/2π
        if ri == 0:
            return 0.25
        return ri ** 4 * math.log(ro / ri) / (ro * ro - ri * ri) ** 2 - (3 * ri * ri - ro * ro) / (4 * (ro * ro - ri * ri))
    for i, (a1, b1, rho) in enumerate(sh):
        Z[i, i] = rho / (math.pi * (b1 * b1 - a1 * a1)) + 1j * w * k0 * (math.log(Rref / b1) + own_l(a1, b1))
        for j in range(i + 1, n):
            a2, b2, _ = sh[j]
            ri, ro = (a2, b2) if a2 >= b1 else (a1, b1)      # the outer of the two shells
            L = math.log(Rref / ro) + 0.5 - (ri * ri * math.log(ro / ri) / (ro * ro - ri * ri) if ri > 0 else 0.0)
            Z[i, j] = Z[j, i] = 1j * w * k0 * L
    S = np.zeros((n, len(conds)))
    for i, k in enumerate(own):
        S[i, k] = 1
    return np.linalg.inv(S.T @ np.linalg.inv(Z) @ S)


class Cables(unittest.TestCase):
    CORE = {'t': 'c', 'rin': 0, 'rout': 0.0256, 'rho': 1.7e-8}

    def one(self, outer=1.0, medium='perfect', y=5.0, tand=0.0):
        return {'medium': medium, 'rho': 1 if medium == 'perfect' else 100, 'cables': [{'x': 0, 'y': y, 'ph': [1, 2], 'layers': [
            self.CORE, {'t': 'i', 'rout': 0.055, 'epsr': 2.3, 'tand': tand}, {'t': 'c', 'rin': 0.055, 'rout': 0.0575, 'rho': 2.8e-8},
            {'t': 'i', 'rout': outer, 'epsr': 1}]}]}

    def test_coaxial_loops_against_field_computation(self):
        """Core and sheath (Dommel eqs. 5.1–5.17, Bessel functions of the tubes) against 700 shells, 50 Hz … 100 kHz."""
        for f in (50, 1e3, 1e4, 1e5):
            d = math.sqrt(1.7e-8 / (math.pi * f * lc.MU0))
            Zp = _peec([(0, 0.0256, 1.7e-8, 400, d / 30), (0.055, 0.0575, 2.8e-8, 300, d / 40)], f, 1.0)
            Z, Y, cs = lc.cable_zy(self.one(), 2j * math.pi * f)
            self.assertLess((np.abs(Z - Zp) / np.abs(Zp)).max(), 1e-6, msg=f)

    def test_capacitance_and_coaxial_mode(self):
        """C = 2πε₀ε_r/ln(r₂/r₁) at 50 Hz exactly (ε_r and tanδ are given there), and the core–sheath mode at 1 MHz
        close to the lossless coaxial line: Z_c = 60/√ε_r·ln(r₂/r₁), v = c/√ε_r."""
        data = self.one(medium='sea', y=30, tand=4e-4)
        data['rho'] = 0.2
        w = 2 * math.pi * 50
        Z, Y = lc.phase_matrices({**data, 'cables': [{**data['cables'][0], 'ph': [1, 0]}]}, 50)
        C = 2 * math.pi * lc.EPS0 * 2.3 / math.log(0.055 / 0.0256)
        self.assertAlmostEqual(Y[0, 0].imag / w / C, 1.0, places=9)
        self.assertAlmostEqual(Y[0, 0].real / (w * C), 4e-4, places=9)
        Z, Y = lc.phase_matrices({**data, 'cables': [{**data['cables'][0], 'ph': [1, 0]}]}, 1e6)
        zc, v = abs(np.sqrt(Z[0, 0] / Y[0, 0])), 2 * math.pi * 1e6 / np.sqrt(Z[0, 0] * Y[0, 0]).imag
        self.assertAlmostEqual(zc / (60 / math.sqrt(2.3) * math.log(0.055 / 0.0256)), 1, delta=0.01)
        self.assertAlmostEqual(v / (lc.C0 / math.sqrt(2.3)), 1, delta=0.01)

    def test_permittivity_causal_and_nearly_constant_loss(self):
        for f in (1, 50, 1e3, 1e5, 1e7):
            e = lc.permittivity(2j * math.pi * f, 2.3, 4e-4)
            self.assertAlmostEqual(-e.imag / e.real / 4e-4, 1, delta=0.01 if f > 1 else 0.02, msg=f)
            self.assertAlmostEqual(e.real / 2.3, 1, delta=0.005, msg=f)
        # real for real s (a real impulse response), and exactly εr(1 − j·tanδ) at 50 Hz
        self.assertEqual(lc.permittivity(1e3, 2.3, 4e-4).imag, 0)
        e = lc.permittivity(2j * math.pi * 50, 2.3, 4e-4)
        self.assertAlmostEqual(abs(e - 2.3 * (1 - 4e-4j)), 0, places=12)

    def test_pollaczek_against_wedepohl(self):
        """Dommel: Wedepohl's formulas agree with Pollaczek's integral while |m·d| is small (here 50 Hz, ρ = 100 Ω·m)."""
        s = 2j * math.pi * 50
        for h, y, x in ((1.2, 1.2, 0.25), (1.0, 1.5, 0.5), (1.2, 1.2, 0.04)):
            self_ = x == 0.04
            a = lc.pollaczek(s, h, y, x, 100, d=x if self_ else None)
            b = lc.wedepohl(s, h, y, x if self_ else math.hypot(x, h - y), 100, self=self_)
            self.assertLess(abs(a / b - 1), 2e-5, msg=(h, y, x))

    def test_deep_burial_is_the_infinite_medium(self):
        """Far below the surface the earth acts as an infinite medium: Pollaczek → the sea-return formula (5.28)."""
        for f in (50, 1e3):
            s = 2j * math.pi * f
            a = lc.pollaczek(s, 2000, 2000, 0.06, 1, d=0.06)
            b = lc.sea_return(s, 0.06, 0.06, 0, 1)
            self.assertLess(abs(a / b - 1), 1e-4, msg=f)

    def test_fit_tolerances_typical_cables(self):
        for key in ('220kV-sea', '150kV-land'):
            m = lc.fd_model(lc.typical(key))
            self.assertEqual(m['M'], 3)
            for q in m['modes']:
                self.assertLessEqual(q['zc']['err'], 0.01, msg=key)
                self.assertLessEqual(q['a']['err'], 0.005, msg=key)
                self.assertTrue(all(p > 0 for p in q['zc']['p'] + q['a']['p']), msg=key)

    def test_bad_cable_data(self):
        d = lc.typical('220kV-sea')
        bad = json.loads(json.dumps(d))
        bad['cables'][0]['layers'][1]['rout'] = 0.02          # insulation inside the core
        with self.assertRaises(lc.LineError):
            lc.phase_matrices(bad, 50)
        mixed = {**d, 'wires': [{'ph': 1, 'x': 0, 'y': 10, 'r': 1, 'Rdc': 0.1}]}
        with self.assertRaises(lc.LineError):
            lc.phase_matrices(mixed, 50)


class _SolverCase:
    """The part 'TLM' in the browser solver, energizing phase a through the source resistance Rs (phases b, c through
    Rs as well), the other ends through 1 MΩ, against the numerical Laplace transform of the same model and of the
    exact line."""
    key, earth, Rs, tr, tend, h, n = None, None, 10.0, 20e-6, 3e-3, 0.3e-6, 8192

    @classmethod
    def setUpClass(cls):
        cls.d = lc.typical(cls.key)
        if cls.earth:
            cls.d['earth'] = cls.earth
        cls.models = {'cp': lc.cp_model(cls.d, 50), 'fd': lc.fd_model(cls.d)}

        def net(kind):
            return {'nodes': 6, 'el': [('V', 1, 0, cls.Rs, ('ramp', 1.0, cls.tr)), ('R', 2, 0, cls.Rs), ('R', 3, 0, cls.Rs),
                                       ('LINE', [1, 2, 3], [4, 5, 6], cls.d, kind), ('R', 4, 0, 1e6), ('R', 5, 0, 1e6),
                                       ('R', 6, 0, 1e6)]}
        cls.ref = {k: lc.nlt_solve(net(m), cls.tend, n=cls.n) for k, m in cls.models.items()}
        cls.exact = lc.nlt_solve(net('exact'), cls.tend, n=cls.n)

    def js(self, kind):
        q = {'data': self.d, 'model': self.models[kind], 'kind': kind, 'f': 50, 'h': self.h, 'tend': self.tend,
             'src': {'Vpk': 1.0, 'tr': self.tr, 'Rs': self.Rs}, 'R': 1e6}
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


@unittest.skipUnless(node_ok(), 'node')
class Solver(_SolverCase, unittest.TestCase):
    """The typical 400 kV line (100 km, Deri's earth so that the exact line can be evaluated at complex s), 10 Ω."""
    key, earth = '400kV', 'deri'

    def test_cp_same_model(self):
        t, V = self.js('cp')
        self.assertLess(self.err(t, V, self.ref["cp"]), 0.004)

    def test_fd_same_model_and_exact_line(self):
        t, V = self.js('fd')
        self.assertLess(self.err(t, V, self.ref["fd"]), 0.0025)
        self.assertLess(self.err(t, V, self.exact), 0.006)


@unittest.skipUnless(node_ok(), 'node')
class CableSolver(_SolverCase, unittest.TestCase):
    """The typical 220 kV submarine cable (30 km, sheaths earthed at both ends), 30 Ω (about Z_c). CP at 50 Hz misses
    the front by tens of µs (the internal inductance of the core at 50 Hz), FD follows the exact cable."""
    key, Rs, tend, h = '220kV-sea', 30.0, 1.5e-3, 0.2e-6

    def test_cp_same_model_but_not_the_cable(self):
        t, V = self.js('cp')
        self.assertLess(self.err(t, V, self.ref["cp"]), 0.0035)
        self.assertGreater(self.err(t, V, self.exact), 0.3)

    def test_fd_same_model_and_exact_cable(self):
        t, V = self.js('fd')
        self.assertLess(self.err(t, V, self.ref["fd"]), 0.0035)
        self.assertLess(self.err(t, V, self.exact), 0.0035)


@unittest.skipUnless(node_ok(), 'node')
class CableTutorial(unittest.TestCase):
    """The tutorial 'cable_fd' as the studio builds it (tests/js/cable_tutorial.js), with the models of linemodels.js."""
    def test_arrival_screening_and_energization(self):
        r = json.loads(subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'cable_tutorial.js')], capture_output=True, text=True,
                                      check=True).stdout)
        tau = 30e3 / (lc.C0 / math.sqrt(2.3))
        fd, cp = r['step_L2'], r['step_L1']
        self.assertGreater(fd['arrival'], tau * 0.99)
        self.assertLess(fd['arrival'], tau + 10e-6)
        self.assertGreater(cp['arrival'], fd['arrival'] + 10e-6)       # CP at 50 Hz: slower
        self.assertLess(fd['peakB'], 0.005 * fd['peak'])                # the sheaths screen the front
        self.assertGreater(cp['peakB'], 0.1 * cp['peak'])               # not at 50 Hz
        self.assertLess(fd['peak'], 2 * 1e3)
        Vpk = 220e3 * math.sqrt(2 / 3)
        self.assertLess(r['ac3_L2']['peak'], 2.0 * Vpk)
        self.assertGreater(r['ac3_L2']['peak'], 1.2 * Vpk)
        self.assertTrue(all(not q['warn'] for q in r.values()))


if __name__ == '__main__':
    unittest.main()
