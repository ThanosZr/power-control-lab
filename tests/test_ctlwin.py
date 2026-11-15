"""4.17.4 (ROADMAP §64, §62, THEORY §8Α): the window «Ρύθμιση ελεγκτή» and the convergence method of the source of Thanos.

Checked here: G(s) of tune.js analyze (Faddeev–LeVerrier) against scipy.signal.ss2tf of the same averaged model, its poles
against the eigenvalues; the margins of the gains from the circuit as the design; the closed loop on the averaged model
reaches the reference; the convergence method alone (no PI) reaches the reference without overshoot, on the averaged
model and in the switching circuit, where a fixed D₀ alone does not; the same run in the SciPy solver; the pcl API
(Project.tune); and the feed-forward of the AI controller without drift («fel2»): its weights stay bounded where those of
«fel» keep growing, with a smaller tracking error."""
import json
import math
import subprocess
import unittest
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent


def cases(c, timeout=1500):
    out = subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'ctl_cases.js'), json.dumps(c)], capture_output=True,
                         text=True, check=True, timeout=timeout, cwd=ROOT).stdout
    return json.loads(out)


def pi(sensor, ref, **kw):
    return {'PWM1': {'mode': 'pi', 'gain': 'auto', 'sensor': sensor, 'qty': 'V', 'ref': ref, 'dmin': 0.05, 'dmax': 0.85, **kw}}


FAM = {
    'buck': {'id': 'buck_vloop', 'opts': {'ctrl': 'pi', 'steps': 'ref'}, 'patch': {'PWM1': {'gain': 'auto'}}},
    'boost': {'id': 'boost', 'opts': {}, 'patch': pi('C1', '24')},
    'cuk': {'id': 'cuk', 'opts': {'D': '0.4'}, 'patch': pi('C2', '-8')},
}


class Analyze(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.R = dict(zip(FAM, cases([{'kind': 'analyze', **c} for c in FAM.values()])))

    def test_transfer_function_and_poles(self):
        from scipy.signal import ss2tf
        for key, r in self.R.items():
            self.assertTrue(r['ok'], (key, r))
            A, b, c = np.array(r['A']), np.array(r['bd']).reshape(-1, 1), np.array(r['c']).reshape(1, -1)
            num, den = ss2tf(A, b, c, np.zeros((1, 1)))
            den_js, num_js = np.array(r['tf']['den']), np.array(r['tf']['num'])
            np.testing.assert_allclose(den_js / den_js[0], den / den[0], rtol=1e-9, atol=0, err_msg=key)
            n0 = num[0][-len(num_js):]
            scale = max(np.max(np.abs(n0)), 1e-300)
            self.assertLess(float(np.max(np.abs(num_js - n0))) / scale, 1e-9, key)
            ev = list(np.linalg.eigvals(A))
            pj = [complex(*z) for z in r['poles']]
            self.assertEqual(len(pj), len(ev), key)
            for z in pj:                                                    # each pole next to an eigenvalue (pairs in any order)
                k = int(np.argmin([abs(z - e) for e in ev]))
                self.assertLess(abs(z - ev[k]), 1e-7 * max(abs(e) for e in ev), (key, z, ev))
                ev.pop(k)
            G0 = num_js[-1] / den_js[-1]
            self.assertAlmostEqual(G0 / r['G0'], 1.0, places=9)          # G(0) of the polynomials = ∂y/∂D of the design
            self.assertTrue(r['same'], key)                               # MNA.tuneInfo (pcl, scenarios) gives the same

    def test_margins_of_the_design_and_closed_loop(self):
        for key, r in self.R.items():
            m, a = r['margins'], r['auto']
            self.assertTrue(m['ok'], (key, m))
            self.assertAlmostEqual(m['pm'], a['pm'], places=6)
            self.assertAlmostEqual(m['wc'] / (2 * math.pi), a['fc'], places=6)
            y, r1 = np.array(r['cl']['y']), r['cl']['r1']
            self.assertLess(abs(y[-1] / r1 - 1), 0.005, key)                # the averaged closed loop reaches the new reference
            self.assertEqual(r['M']['txt'], {'buck': 'D', 'boost': '1/(1 − D)', 'cuk': 'D/(1 − D)'}[key])


class Convergence(unittest.TestCase):
    def test_on_the_averaged_model(self):
        # the convergence method alone (K_p = K_i = 0): the reference reached without overshoot; D₀ alone: not reached
        # (N = 0: one period of the slowest ringing mode, the mean of the output over it; k = 4)
        R = cases([{'kind': 'analyze', **FAM['boost'], 'gains': {'Kp': 0, 'Ki': 0}, 'opt': {'ff': 'conv', 'kc': 4, 'convN': 0, 'step': 0.1, 'tEnd': 0.15}},
                   {'kind': 'analyze', **FAM['boost'], 'gains': {'Kp': 0, 'Ki': 0}, 'opt': {'ff': 'const', 'step': 0.1, 'tEnd': 0.15}},
                   {'kind': 'analyze', **FAM['buck'], 'gains': {'Kp': 0, 'Ki': 0}, 'opt': {'ff': 'conv', 'kc': 4, 'convN': 0, 'step': 0.2, 'tEnd': 0.15}}])
        for r in (R[0], R[2]):
            y, r1, ts = np.array(r['cl']['y']), r['cl']['r1'], r['cl']['tStep']
            t = np.array(r['cl']['t'])
            after = y[t > ts]
            self.assertLess(abs(after[-1] / r1 - 1), 0.01, r['key'])
            self.assertLess(float(np.max(np.abs(after))) / abs(r1) - 1, 0.01, r['key'])     # no overshoot
        y = np.array(R[1]['cl']['y'])
        self.assertGreater(abs(y[-1] / R[1]['cl']['r1'] - 1), 0.05)                           # a fixed D₀ stays at the old output

    def test_in_the_switching_circuit_and_scipy(self):
        from engine.batch import simulate
        p = {**FAM['boost']['patch']['PWM1'], 'gain': 'manual', 'Kp': 0, 'Ki': 0, 'ff': 'conv', 'kc': 4, 'convN': 0, 'ref': '0:24, 0.02:28'}
        R = cases([{'kind': 'run', 'id': 'boost', 'opts': {}, 'patch': {'PWM1': p}, 'T': 0.17, 'key': 'V:C1'},
                   {'kind': 'scipy', 'id': 'boost', 'opts': {}, 'patch': {'PWM1': p}, 'T': 0.003, 'hDiv': 80, 'keys': ['V:C1', 'I:L1']}])
        r = R[0]
        self.assertEqual((r['warn'], r['ctl']['ff'], r['ctl']['convKey']), ([], 'conv', 'boost'))
        out = np.array(r['out'])
        t, v = out[:, 0], out[:, 1]
        self.assertLess(abs(v[-1] / 28 - 1), 0.01)                    # the second reference reached
        self.assertLess(float(np.max(v[t > 0.02])) / 28 - 1, 0.02)     # without overshoot (2 %, the ripple of the mean)
        o = R[1]
        self.assertEqual(o['warn'], [])
        d = o['batch']
        self.assertEqual(d['net']['ctrls'][0]['convKey'], 'boost')
        rec = np.array(o['rec'])
        ts = rec[:, 0]
        q = simulate({'net': d['net'], 'channels': d['channels'], 't_end': float(ts[-1]), 'method': 'Radau', 'rtol': 1e-7,
                      'atol': 1e-9, 'max_points': 400000, '_local': True, 'wall': 900})
        self.assertEqual(q['status'], 'ok', q['message'])
        tt = np.array(q['t'])
        for j, k in enumerate(o['keys']):
            a = rec[:, j + 1]
            b = np.interp(ts, tt, np.array(q['ch'][k], float))
            self.assertLess(float(np.max(np.abs(a - b))) / float(np.max(np.abs(a))), 0.005, k)


class Pcl(unittest.TestCase):
    def test_project_tune(self):
        import pcl
        p = pcl.tutorial('buck_vloop', ctrl='pi', steps='ref').set('PWM1.gain', 'auto')
        d = p.tune('PWM1')
        self.assertEqual(d['key'], 'buck')
        self.assertEqual(len(d['tf']['den']), 3)                        # L–C: second order
        self.assertTrue(d['margins']['ok'])
        d2 = p.tune('PWM1', Kp=d['auto']['Kp'] * 4, Ki=d['auto']['Ki'] * 4)
        self.assertLess(d2['margins']['pm'], d['margins']['pm'])           # four times the gains: less phase margin


class FeedForwardWithoutDrift(unittest.TestCase):
    def test_fel2_bounded(self):
        # ai_block, 48 s of the repeating reference: the weights of «fel» keep growing (drift), those of «fel2» do not,
        # and its tracking error over the last cycles is smaller
        a, b = cases([{'kind': 'aic', 'scheme': 'fel', 'T': 48}, {'kind': 'aic', 'scheme': 'fel2', 'T': 48, 'ka': 10}], timeout=2400)
        for r in (a, b):
            self.assertEqual(r['warn'], [])
        wa, wb = [c['w'] for c in a['cyc']], [c['w'] for c in b['cyc']]
        n = len(wa)
        self.assertGreater(wa[-1] - wa[n // 2], 0.002)                     # fel: drift
        self.assertLess(wb[-1] - wb[n // 2], 0.0)                          # fel2: no growth
        ra = float(np.mean([c['rms'] for c in a['cyc'][-5:]]))
        rb = float(np.mean([c['rms'] for c in b['cyc'][-5:]]))
        self.assertLess(rb, ra)


if __name__ == '__main__':
    unittest.main()
