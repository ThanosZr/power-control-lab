"""5.0.1 (ROADMAP §92, THEORY §8ΩΖ): the saturable core of transformers and the nonlinear inductor LSAT.

The browser's solver against closed forms (an ideal source across the core, an R in series with a two-slope core), against
the SciPy solver (engine/batch.py, the core as an inductor whose inductance is that of its segment, the knees and the
zeros of v as events), and against itself (the default gives the netlist of before; the time rules; a snapshot)."""
import json
import math
import subprocess
import unittest
from pathlib import Path

import numpy as np
from scipy.optimize import brentq

ROOT = Path(__file__).resolve().parent.parent
CASES = ROOT / 'tests' / 'js' / 'sat_cases.js'


def curve(tab, Lend):
    I = [0.0] + [float(a) for a, _ in tab]
    F = [0.0] + [float(b) for _, b in tab]
    s = [(I[k + 1] - I[k]) / (F[k + 1] - F[k]) for k in range(len(I) - 1)] + [1.0 / Lend]

    def f(p):
        x, k = abs(p), 0
        while k < len(F) - 1 and x >= F[k + 1]:
            k += 1
        i = I[k] + (x - F[k]) * s[k]
        return -i if p < 0 else i
    return f


class TestSaturableCore(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        r = subprocess.run(['node', str(CASES)], capture_output=True, text=True, timeout=900)
        if r.returncode:
            raise RuntimeError(r.stderr[-2000:])
        cls.R = json.loads(r.stdout)

    def test_curve(self):
        o = self.R['curve']
        self.assertAlmostEqual(o['L0'], 100.0)
        self.assertEqual(o['Lend'], 0.2)
        f = curve([[0.01, 1], [0.1, 1.2]], 0.2)
        for psi, i, g, back in o['pts']:
            self.assertAlmostEqual(i, f(psi), delta=1e-12 * (1 + abs(i)), msg=psi)
            self.assertAlmostEqual(back, psi, delta=1e-12 * (1 + abs(psi)), msg=psi)
            self.assertGreater(g, 0)
        self.assertTrue(all(o['err']), o['err'])

    def test_rms_to_peak(self):
        # the conversion from the rms values of the open-circuit test gives back the curve the rms values came from, and
        # the mean squares of the result under a sinusoidal flux by a second quadrature are those of the test
        o = self.R['rms']
        for (i0, f0), (i1, f1) in zip(o['pts'], o['back']):
            self.assertEqual(f0, f1)
            self.assertAlmostEqual(i1, i0, delta=1e-9 * i0)
        for want, mid in o['check']:
            self.assertAlmostEqual(mid, want, delta=1e-8 * want)
        self.assertTrue(o['err'])

    def test_default_is_the_netlist_of_before(self):
        o = self.R['same']
        self.assertTrue(o['xf3'])           # linear core, branch in the middle, 50 %: the options set explicitly change nothing
        self.assertTrue(o['xfmr'])
        self.assertTrue(o['xf3split'])      # and the options themselves do change it
        self.assertTrue(o['xf3pos'])

    def test_unsaturated_core_is_the_linear_one(self):
        for k, d in self.R['linear']:
            self.assertLess(d, 1e-12, k)

    def test_ideal_source(self):
        # ψ(T/2) = ψ₀ + 2V/ω with the error of the trapezoidal rule (second order), i = f(ψ) − I_r(A)
        o = self.R['ideal']
        f = curve(o['tab'], o['Lair'])
        by = {}
        for q in o['runs']:
            exact = q['psi0'] + 2 * o['V'] / o['w']
            by.setdefault(q['psi0'], {})[q['h']] = q['psi'] - exact
            self.assertAlmostEqual(q['A'], 2 * o['V'] / o['w'], delta=2e-5 * q['A'])
            ir0 = f(q['psi0']) if q['psi0'] else 0.0
            Ar = 4 * max(o['tab'][0][1], abs(q['psi0']))
            want = f(q['psi']) - ir0 * max(0.0, 1 - q['A'] / Ar)
            self.assertAlmostEqual(q['i'], want, delta=1e-4 * abs(want), msg=q)
        for p0, e in by.items():
            self.assertLess(abs(e[1e-05]), 1e-5 * (abs(p0) + 1))
            self.assertTrue(3.5 < e[2e-05] / e[1e-05] < 4.5, (p0, e))

    def test_first_peak_against_the_closed_form(self):
        # R in series with a two-slope core, v = V·sin ωt, ψ₀ = 0: on segment k, L_k·di/dt + R·i = v, so
        # i = V/|Z_k|·sin(ωt − φ_k) + (i(t₀) − V/|Z_k|·sin(ωt₀ − φ_k))·e^(−R(t − t₀)/L_k); the knee where i = I₁, the peak
        # where di/dt = 0 (an independent derivation, as the analytical methods for the first peak of the inrush)
        o = self.R['rl']
        V, R, w, I1, F1, L1 = o['V'], o['R'], 2 * math.pi * o['f'], o['I1'], o['F1'], o['Lair']
        L0 = F1 / I1

        def seg(L, t0, i0):
            Z, ph = math.hypot(R, w * L), math.atan2(w * L, R)
            c = i0 - V / Z * math.sin(w * t0 - ph)
            return (lambda t: V / Z * math.sin(w * t - ph) + c * math.exp(-R * (t - t0) / L),
                    lambda t: V / Z * w * math.cos(w * t - ph) - c * R / L * math.exp(-R * (t - t0) / L))
        i0, _ = seg(L0, 0.0, 0.0)
        ts = np.linspace(0, 0.02, 20001)
        k = next(j for j, t in enumerate(ts) if i0(t) >= I1)
        t1 = brentq(lambda t: i0(t) - I1, ts[k - 1], ts[k], xtol=1e-15)
        i1, d1 = seg(L1, t1, I1)
        ts = np.linspace(t1, t1 + 0.01, 100001)
        k = int(np.argmax([i1(t) for t in ts]))
        tp = brentq(d1, ts[max(k - 1, 0)], ts[min(k + 1, len(ts) - 1)], xtol=1e-15)
        self.assertAlmostEqual(o['peak'], i1(tp), delta=2e-4 * i1(tp))
        self.assertAlmostEqual(o['tpeak'], tp, delta=2e-6)

    def test_residual_flux_is_held(self):
        o = self.R['hold']
        q = o['lsat']                       # behind an open switch (R_off = 1 MΩ): no current at ψ₀, the flux stays
        self.assertLess(abs(q['psi'][0] - q['psi0']), 1e-3 * q['psi0'])
        self.assertLess(abs(q['psi'][1] - q['psi0']), 1e-3 * q['psi0'])
        self.assertLess(q['i'], 1e-3)
        for grp in ('YNd1', 'Dyn11'):       # XF3 at t = 0: the residual fluxes, no current in the windings
            g = o[grp]
            for i in g['i0']:
                self.assertLess(abs(i), 1e-6, grp)
            for want, got in zip(o['psiR'], g['p0']):
                self.assertAlmostEqual(got, want * g['pb'], delta=1e-12 * g['pb'], msg=grp)

    def test_every_group(self):
        for grp, g in self.R['groups'].items():
            self.assertNotIn('err', g, grp)
            self.assertGreater(g['peak'], 2 * g['ipk'], grp)     # a residual flux of 0.8 pu energized at v_a = 0: an inrush
            self.assertEqual(g['Ir'], [0, 0, 0], grp)            # the hold is gone after the core was excited
            self.assertTrue(all(a > 1 for a in g['A']), grp)

    def test_steady_start(self):
        o = self.R['ss']
        self.assertLess(abs(o['max'] + o['min']), 1e-3 * o['max'])       # no DC in the flux of the first period
        self.assertTrue(1.0 < o['max'] / o['pb'] < 1.15, o)               # c = 1,1 of the network equivalent
        self.assertLess(o['imax'], 5)                                      # below the knee: the magnetizing current only

    def test_messages(self):
        o = self.R['errs']
        for k in ('xac', 'tab', 'rms'):
            self.assertEqual(o[k]['name'], 'NetlistError', k)
        self.assertIn('X_ac', o['xac']['msg'])
        self.assertIn('ψ–i', o['tab']['msg'])
        self.assertIn('απωλειών', o['rms']['msg'])
        self.assertIsNone(o['ok'])
        self.assertIsNone(o['okTab'])

    def test_time_rules(self):
        o = self.R['modes']
        for m in ('TR', 'BE', 'BDF2', 'var'):
            for a, b in zip(o[m], o['ref']):
                self.assertAlmostEqual(a, b, delta=5e-3 * b, msg=m)

    def test_snapshot(self):
        self.assertTrue(self.R['snap']['same'], self.R['snap'])

    def test_scipy(self):
        from engine.batch import simulate
        tol = {'lsat': 2e-3, 'xfmr_w1': 3e-3, 'xfmr_w2': 3e-3, 'xf3_mid': 3e-3, 'xf3_w2': 3e-3}
        for c in self.R['batch']:
            d = c['batch']
            self.assertEqual(d['skipped'], [], c['name'])
            r = simulate({'net': d['net'], 'channels': d['channels'], 't_end': c['T'], 'method': 'Radau', 'rtol': 1e-8, 'atol': 1e-9,
                          'max_step': 5e-6, 'max_points': 400000, '_local': True, 'wall': 300})
            self.assertEqual(r['status'], 'ok', (c['name'], r.get('message')))
            rec = np.array(c['rec'])
            t = np.array(r['t'])
            for j, k in enumerate(c['keys']):
                js, py = rec[:, j + 1], np.interp(rec[:, 0], t, np.array(r['ch'][k], float))
                if k.startswith('I2'):
                    continue                # the secondary of a single phase unit: a load of R = 200 Ω, τ = 1 µs
                sc = np.max(np.abs(js))
                self.assertLess(np.max(np.abs(js - py)) / sc, tol[c['name']], (c['name'], k))


if __name__ == '__main__':
    unittest.main()
