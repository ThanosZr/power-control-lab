"""The arc of a breaker pole (4.9, THEORY §8μ): the browser solver (web/studio/mna.js, ARCX sections of ARC and CB3)
against an independent stiff integration (SciPy Radau, rtol 1e-10) of the same circuit, a source–L–(breaker ∥ C) on a
terminal fault of 145 kV / 20 kA, for single-section (improved Mayr, Mayr), two-section (Cassie + Mayr) and three-section
(the three modified Mayr) arcs: the current zero, the extinction peak before it, the TRV peak and its instant, the
post-arc current. Also: a weak arc reignites and burns on, a closed pole is its R_on, and a three-phase CB3 with arcs
interrupts on all three poles. 4.9.1: the same cases in the SciPy solver (engine/batch.py, x = ln g a state of the ODE),
from t = 0, against the same reference."""
import json
import math
import shutil
import subprocess
import unittest
from pathlib import Path

import numpy as np

CASES = Path(__file__).resolve().parent / 'js' / 'arc_cases.js'


def _F(a, x, u):
    g = math.exp(x)
    tau = a['tau0'] * math.exp(a['alpha'] * x)
    D = a['P0'] + a['P1'] * g * u * u
    q = math.exp((a['lam'] - 1) * x) * u * u / (D * math.exp(a['beta'] * x))
    return (q - 1) / tau


def reference(o):
    """The same circuit as stiff ODEs: L di/dt = U sin ωt − v_c, C dv_c/dt = i − v_c/Σ(1/g_k), d ln g_k/dt = F_k."""
    from scipy.integrate import solve_ivp
    U, L, C, w = o['U'], o['L'], o['C'], 2 * math.pi * 50
    S = o['sections']
    lo = [math.log(a['gmin']) for a in S]

    def rhs(t, y):
        vc = y[1]
        xs = [max(x, m) for x, m in zip(y[2:], lo)]
        gs = [math.exp(x) for x in xs]
        i = vc / sum(1 / g for g in gs)
        d = [(U * math.sin(w * t) - vc) / L, (y[0] - i) / C]
        for a, x, g, m in zip(S, xs, gs, lo):
            f = _F(a, x, i / g)
            d.append(0.0 if (x <= m and f < 0) else f)
        return d
    ts = np.array([r[0] for r in o['rec']])
    sol = solve_ivp(rhs, (o['t0'], ts[-1]), [o['iL'], o['vc']] + [a['x'] for a in S], method='Radau', rtol=1e-10,
                    atol=[1e-6, 1e-3] + [1e-9] * len(S), t_eval=ts, max_step=2e-8)
    gs = np.exp(np.maximum(sol.y[2:], np.array(lo)[:, None]))
    return ts, sol.y[1] / (1 / gs).sum(axis=0), sol.y[1]


def features(ts, i, v, t0):
    z = int(np.where(np.diff(np.sign(i)) != 0)[0][0])
    pre = slice(max(0, z - 300), z + 1)
    k = int(np.argmax(np.abs(v)))
    post = slice(z + 5, z + 300)
    return {'tz': ts[z] - t0, 'ext': float(np.max(np.abs(v[pre]))), 'peak': float(v[k]), 'tpeak': ts[k] - t0,
            'post': float(np.max(np.abs(i[post]))), 'iend': float(abs(i[-1]))}


@unittest.skipIf(shutil.which('node') is None, 'Node.js not installed (the solver runs in web/studio/mna.js).')
class Arc(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        run = subprocess.run(['node', str(CASES)], capture_output=True, text=True, timeout=900)
        if run.returncode:
            raise RuntimeError(run.stderr)
        cls.R = json.loads(run.stdout)
        cls.refs = {}

    def ref(self, name):
        # the reference integration of a case, once for the browser's test and the SciPy one
        if name not in self.refs:
            self.refs[name] = reference(self.R[name])
        return self.refs[name]

    def against_reference(self, name, tol_post=0.02):
        o = self.R[name]
        self.assertEqual(o['warn'], [])
        ts = np.array([r[0] for r in o['rec']])
        ib = np.array([r[1] for r in o['rec']])
        vb = np.array([r[2] for r in o['rec']])
        tr, ir, vr = self.ref(name)
        b, r = features(ts, ib, vb, o['t0']), features(tr, ir, vr, o['t0'])
        self.assertAlmostEqual(b['tz'], r['tz'], delta=2e-7, msg=name)                  # the current zero (step 0,1 µs)
        self.assertLess(abs(b['ext'] - r['ext']), 0.005 * r['ext'], name)              # extinction peak
        self.assertLess(abs(b['peak'] - r['peak']), 1e-4 * abs(r['peak']), name)       # TRV peak
        self.assertAlmostEqual(b['tpeak'], r['tpeak'], delta=2e-7, msg=name)
        # post-arc current; the solver's 1 nS shunt at every node (GMIN) leaks through the chain's inner nodes too
        leak = len(o['sections']) * 1e-9 * abs(r['peak'])
        self.assertLess(abs(b['post'] - r['post']), tol_post * r['post'] + 1e-5 + leak, name)
        self.assertLess(b['iend'], 1e-2, name)                                         # interrupted at the first zero
        return b

    def scipy_run(self, o, t_end, keys=('Y:CB1/I', 'Y:CB1/V')):
        from engine.batch import simulate
        d = o['batch']
        self.assertEqual(d['skipped'], [])
        r = simulate({'net': d['net'], 'channels': d['channels'], 't_end': t_end, 'method': 'Radau', 'rtol': 1e-8, 'atol': 1e-9,
                      'max_points': 200000, '_local': True, 'wall': 300})
        self.assertEqual(r['status'], 'ok', r['message'])
        return np.array(r['t']), [np.array(r['ch'][k], float) for k in keys]

    def scipy_against_reference(self, name, tol_post=0.1):
        # the SciPy run from t = 0 (the pole closed, then its contacts separate), resampled at the browser's points
        o = self.R[name]
        ts = np.array([r[0] for r in o['rec']])
        t, (i, v) = self.scipy_run(o, float(ts[-1]))
        s = features(ts, np.interp(ts, t, i), np.interp(ts, t, v), o['t0'])
        tr, ir, vr = self.ref(name)
        r = features(tr, ir, vr, o['t0'])
        self.assertAlmostEqual(s['tz'], r['tz'], delta=2e-7, msg=name)
        self.assertLess(abs(s['ext'] - r['ext']), 0.005 * r['ext'], name)
        self.assertLess(abs(s['peak'] - r['peak']), 1e-4 * abs(r['peak']), name)
        self.assertAlmostEqual(s['tpeak'], r['tpeak'], delta=2e-7, msg=name)
        leak = len(o['sections']) * 1e-9 * abs(r['peak'])
        self.assertLess(abs(s['post'] - r['post']), tol_post * r['post'] + 1e-5 + leak, name)
        self.assertLess(s['iend'], 1e-2, name)

    def test_scipy_single_sections(self):
        self.scipy_against_reference('imayr')
        self.scipy_against_reference('mayr')

    def test_scipy_sections_in_series(self):
        # the inner nodes of the chain have only G_min to ground: the arcs' g go into the matrix of each evaluation
        self.scipy_against_reference('habedank')
        self.scipy_against_reference('kema')

    def test_scipy_weak_arc_reignites(self):
        o = self.R['weak']
        ts = np.array([r[0] for r in o['rec']])
        ib = np.array([r[1] for r in o['rec']])
        t, (i, _v) = self.scipy_run(o, float(ts[-1]))
        i = np.interp(ts, t, i)
        self.assertGreater(abs(i[-1]), 1e3)
        self.assertLess(abs(i[-1] - ib[-1]), 1e-3 * abs(ib[-1]))

    def test_scipy_three_phases(self):
        t3 = self.R['three']
        keys = list(t3['batch']['channels'])
        t, ys = self.scipy_run(t3, 0.2, keys)
        for k, y in zip(keys, ys):
            if k.startswith('Garc:'):
                self.assertLess(y[-1], 1e-9, k)
                self.assertGreater(float(np.interp(0.09, t, y)), 1e3, k)      # closed before 0,1 s: 1/R_on
            else:
                self.assertLess(abs(y[-1]), 1e-2, k)
                self.assertGreater(float(np.max(np.abs(y))), 1e3, k)

    def test_improved_mayr(self):
        b = self.against_reference('imayr')
        self.assertGreater(b['ext'], 1e3)          # an extinction peak of kilovolts before the zero
        self.assertGreater(abs(b['peak']), 2.3e5)  # the TRV of an undamped LC: about twice the crest

    def test_mayr(self):
        self.against_reference('mayr')

    def test_cassie_mayr_in_series(self):
        self.assertEqual(len(self.R['habedank']['sections']), 2)
        self.against_reference('habedank')

    def test_three_modified_mayr(self):
        self.assertEqual([round(a['lam'], 1) for a in self.R['kema']['sections']], [1.4, 1.9, 2.0])
        self.against_reference('kema', tol_post=0.05)

    def test_weak_arc_reignites(self):
        o = self.R['weak']
        ts = np.array([r[0] for r in o['rec']])
        ib = np.array([r[1] for r in o['rec']])
        z = np.where(np.diff(np.sign(ib)) != 0)[0]
        self.assertGreaterEqual(len(z), 1)
        self.assertGreater(abs(ib[-1]), 1e3)       # the current flows on after the zero (thermal reignition)
        tr, ir, vr = reference(dict(o, rec=o['rec'][:6000]))
        self.assertGreater(float(np.max(np.abs(ir[int(z[0]) + 200:]))), 1e3)    # the reference reignites too

    def test_closed_pole_and_three_phases(self):
        c = self.R['closed']
        self.assertLess(abs(abs(c['i']) - c['ipk']), 1e-3 * c['ipk'])      # at t = 10 ms the current is at a crest
        t3 = self.R['three']
        self.assertNotIn('err', t3)
        self.assertEqual(t3['keys'], ['Garc:CB1/Aa1', 'Garc:CB1/Ab1', 'Garc:CB1/Ac1'])
        for i in t3['i']:
            self.assertLess(abs(i), 1e-2)
        for g in t3['g']:
            self.assertLess(g, 1e-9)


if __name__ == '__main__':
    unittest.main()
