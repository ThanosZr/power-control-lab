"""4.14 (ROADMAP §42): the MMC in the four models of the MMC station of EMTP-RV and the control of its station.
4.15: the energy control of the arms (Models 1–3) and the anti-windup and DC overvoltage limiter of the station control:
the four models give the same responses (THEORY §8ψ).

The cases run headless in Node (tests/js/mmc_cases.js): one MMC between a stiff AC source behind an inductance and a stiff DC
source, driven by fixed sinusoidal m (open loop), and the tutorial hvdc_mmc (two stations, a ±320 kV wideband cable pair).
Model 1 (every cell from IGBTs and diodes) is the detailed implementation: Model 2 with the changes as discontinuities
(backward Euler after each, as the solver does for any switch) is the same circuit solved the same way; the SciPy export
takes Model 1. Model 2 with the trapezoidal rule restarted from consistent derivatives at each change converges to the same
waveforms with ten times the step (THEORY §8χ).
"""
import json
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
JS = ROOT / 'tests' / 'js' / 'mmc_cases.js'


def cases(cs, timeout=1800):
    r = subprocess.run(['node', str(JS), json.dumps(cs)], capture_output=True, text=True, timeout=timeout, cwd=str(ROOT))
    if r.returncode:
        raise RuntimeError(r.stderr[-3000:])
    out = json.loads(r.stdout)
    for o in out:
        if 'error' in o:
            raise RuntimeError(o['error'][:3000])
    return out


def res(o, key):
    return o['res'][o['keys'].index(key)]


IA, IDC = 'Y:MM/IAa', 'Y:MM/IDC'


class OpenLoop(unittest.TestCase):
    def test_model2_with_backward_euler_is_model1(self):
        # the same circuit (every cell, its capacitor, the arm reactors) and the same steps: Model 2 as one solver element
        # per arm, Model 1 from 4 IGBTs and diodes per cell; the nearest level sampled at 50 kHz in both
        a, b = cases([{'kind': 'stats', 'model': 'm2', 'disc': 'disc', 'fs': 50000, 'N': 6, 'T': 0.06, 'keys': [IA, IDC]},
                      {'kind': 'stats', 'model': 'm1', 'N': 6, 'T': 0.06, 'keys': [IA, IDC]}])
        self.assertEqual(a['warn'], [])
        self.assertEqual(b['warn'], [])
        self.assertLess(abs(res(a, IA)['pk1'] / res(b, IA)['pk1'] - 1), 0.01)
        self.assertLess(abs(res(a, IDC)['mean'] / res(b, IDC)['mean'] - 1), 0.03)

    def test_trapezoidal_restart_converges(self):
        # h = 20 μs with the consistent restart at each change against h = 2 μs: the same waveforms (a plain trapezoidal
        # step made each change act half a step late: 3 % in the current here)
        a, b = cases([{'kind': 'stats', 'model': 'm2', 'fs': 50000, 'N': 10, 'T': 0.1, 'keys': [IA, IDC]},
                      {'kind': 'stats', 'model': 'm2', 'fs': 50000, 'N': 10, 'T': 0.1, 'hDiv': 10000, 'keys': [IA, IDC]}])
        self.assertLess(abs(res(a, IA)['pk1'] / res(b, IA)['pk1'] - 1), 0.005)
        self.assertLess(abs(res(a, IDC)['mean'] / res(b, IDC)['mean'] - 1), 0.02)
        self.assertGreater(a['lu']['fact'], 50)   # every change of the inserted count is a new factorization

    def test_model3_follows_model2(self):
        # 400 cells: the switching function of the arm (one capacitor C/N) against every capacitor
        a, b = cases([{'kind': 'stats', 'model': 'm2', 'N': 400, 'T': 0.06, 'keys': [IA, IDC, 'Y:MM/VS']},
                      {'kind': 'stats', 'model': 'm3', 'N': 400, 'T': 0.06, 'keys': [IA, IDC, 'Y:MM/VS']}])
        self.assertLess(abs(res(a, IA)['pk1'] / res(b, IA)['pk1'] - 1), 0.01)
        self.assertLess(abs(res(a, IDC)['mean'] / res(b, IDC)['mean'] - 1), 0.01)
        self.assertLess(abs(res(a, 'Y:MM/VS')['mean'] / res(b, 'Y:MM/VS')['mean'] - 1), 0.002)

    def test_blocked_converter_does_not_conduct(self):
        # blocked with charged capacitors and the DC at 640 kV above the AC peak: the arm diodes stay off
        o = cases([{'kind': 'stats', 'model': 'm2', 'N': 20, 'T': 0.04, 'blk': '1', 'keys': [IA, IDC, 'Y:MM/AUa']}])[0]
        self.assertLess(res(o, IA)['rms'], 1.0)
        self.assertLess(abs(res(o, IDC)['mean']), 1.0)
        self.assertLess(res(o, 'Y:MM/AUa')['max'] - res(o, 'Y:MM/AUa')['min'], 1.0)


class SciPy(unittest.TestCase):
    def test_model1_against_scipy(self):
        import numpy as np
        from engine.batch import simulate
        o = cases([{'kind': 'scipy', 'N': 1, 'T': 0.002, 'hDiv': 10000}])[0]
        self.assertEqual(o['warn'], [])
        d = o['batch']
        self.assertEqual(d['skipped'], [])
        self.assertFalse(any(e['k'] == 'CHB' for e in d['net']['els']))
        rec = np.array(o['rec'])
        ts = rec[:, 0]
        r = simulate({'net': d['net'], 'channels': d['channels'], 't_end': float(ts[-1]), 'method': 'Radau', 'rtol': 1e-7,
                      'atol': 1e-9, 'max_points': 400000, '_local': True, 'wall': 900})
        self.assertEqual(r['status'], 'ok', r['message'])
        t = np.array(r['t'])
        for j, k in enumerate(o['ch']):
            b = rec[:, j + 1]
            s = np.interp(ts, t, np.array(r['ch'][k], float))
            self.assertLessEqual(float(np.max(np.abs(b - s))), 1e-3 * max(1.0, float(np.max(np.abs(b)))), k)


K = ['Y:CT1/PP', 'Y:CT2/PP', 'Y:CT1/Fvdc', 'Y:CT2/Fvdc', 'Y:CT1/QQ', 'Y:CT2/QQ']


def at(o, t, key):
    return next(q for q in o['out'] if abs(q['t'] - t) < 1e-6)[key]


class Tutorial(unittest.TestCase):
    def test_average_model_steps(self):
        o = cases([{'kind': 'tut', 'id': 'hvdc_mmc', 'opts': {'model': 'm4'}, 'at': [0.45, 0.9], 'keys': K}])[0]
        self.assertEqual(o['warn'], [])
        self.assertAlmostEqual(at(o, 0.45, 'Y:CT1/PP')['mean'], 1.0, delta=0.01)
        self.assertAlmostEqual(at(o, 0.45, 'Y:CT2/Fvdc')['mean'], 1.0, delta=0.005)
        self.assertAlmostEqual(at(o, 0.9, 'Y:CT1/PP')['mean'], 0.5, delta=0.005)
        self.assertAlmostEqual(at(o, 0.9, 'Y:CT2/Fvdc')['mean'], 1.0, delta=0.003)
        for t in (0.45, 0.9):
            loss = (at(o, t, 'Y:CT1/PP')['mean'] + at(o, t, 'Y:CT2/PP')['mean']) / at(o, t, 'Y:CT1/PP')['mean']
            self.assertTrue(0.002 < loss < 0.015, loss)
            for k in ('Y:CT1/QQ', 'Y:CT2/QQ'):
                self.assertLess(abs(at(o, t, k)['mean']), 0.02)

    def test_switching_function_model_steps(self):
        o = cases([{'kind': 'tut', 'id': 'hvdc_mmc', 'opts': {'model': 'm3', 'ectl': 'direct'}, 'at': [0.45, 0.9], 'keys': K}])[0]
        self.assertAlmostEqual(at(o, 0.45, 'Y:CT1/PP')['mean'], 1.0, delta=0.03)
        self.assertAlmostEqual(at(o, 0.9, 'Y:CT1/PP')['mean'], 0.5, delta=0.02)
        self.assertAlmostEqual(at(o, 0.9, 'Y:CT2/Fvdc')['mean'], 1.0, delta=0.01)

    def test_dc_fault_blocks_and_trips(self):
        # pole-to-pole at the terminals of station 2 at 0.5 s: both stations block within 2 ms on DC overcurrent, the
        # current then flows from the AC grids through the arm diodes (several pu), and the AC breakers open 40 ms later
        ks = ['Y:MMC1/IDC', 'Y:MMC2/IDC', 'Y:CT1/BLK', 'Y:CT2/BLK', 'Y:CT1/BRK', 'Y:MMC2/AUa']
        a, b = cases([{'kind': 'tut', 'id': 'hvdc_mmc', 'opts': {'model': 'm4', 'ev': 'dcf'}, 'win': 0.004, 'at': [0.5, 0.502, 0.52, 0.6], 'keys': ks},
                      {'kind': 'tut', 'id': 'hvdc_mmc', 'opts': {'model': 'm3', 'ev': 'dcf'}, 'win': 0.004, 'at': [0.5, 0.502, 0.52, 0.6], 'keys': ks}])
        Ib = 1059e6 / 640e3
        for o in (a, b):
            self.assertEqual(at(o, 0.5, 'Y:CT1/BLK')['max'], 0)
            for k in ('Y:CT1/BLK', 'Y:CT2/BLK'):
                self.assertEqual(at(o, 0.502, k)['last'], 1)
            self.assertTrue(3 < at(o, 0.52, 'Y:MMC1/IDC')['mean'] / Ib < 10)
            self.assertEqual(at(o, 0.6, 'Y:CT1/BRK')['last'], 0)
        # Model 3 blocked: the capacitors keep their charge (the bypass diodes carry the fault current)
        q = at(b, 0.52, 'Y:MMC2/AUa')
        self.assertLess(q['max'] - q['min'], 1e-3 * q['mean'])


ARMS = [f'Y:MMC{k}/A{a}{x}:vav' for k in (1, 2) for x in 'abc' for a in 'UL']
TS = [0.3, 0.45, 0.52, 0.55, 0.6, 0.9]


class Energy(unittest.TestCase):
    """4.15: with the energy control the arms insert their references exactly (the AC side of Model 4) and the energy of the
    six arms follows v_dc as the C_dc of Model 4: Models 2 and 3 against Model 4 in the step of P, the energy of the upper
    and lower arm and of the three legs balanced; the 4.14 slow mode was the windup of the V_dc integrator at the current
    limit; in the AC fault the limiter of the DC overvoltage of station 1 holds V_dc."""

    @classmethod
    def setUpClass(cls):
        cls.r = cases([{'kind': 'tut', 'id': 'hvdc_mmc', 'opts': {'model': m}, 'at': TS, 'keys': K + (ARMS if m != 'm4' else [])}
                       for m in ('m4', 'm3', 'm2')])

    def test_models_2_and_3_follow_the_average_model(self):
        a = self.r[0]
        for o in self.r[1:]:
            self.assertEqual(o['warn'], [])
            for t in TS:
                self.assertLess(abs(at(o, t, 'Y:CT2/Fvdc')['mean'] - at(a, t, 'Y:CT2/Fvdc')['mean']), 1e-3, t)
                for k in ('Y:CT1/PP', 'Y:CT2/PP', 'Y:CT1/QQ', 'Y:CT2/QQ'):
                    self.assertLess(abs(at(o, t, k)['mean'] - at(a, t, k)['mean']), 0.015, (k, t))

    def test_the_arms_are_balanced(self):
        # (Σv_C,u − Σv_C,l)/V_dc per phase: up to 10 % after the deblocking (a DC offset of the AC currents), then down to
        # below 1.2 %; between the legs below 0.5 %
        for o in self.r[1:]:
            for k in (1, 2):
                def imb(t):
                    s = {x: {a: at(o, t, f'Y:MMC{k}/A{a}{x}:vav')['mean'] * 400 / 640e3 for a in 'UL'} for x in 'abc'}
                    m = sum(s[x]['U'] + s[x]['L'] for x in 'abc') / 6
                    return max(abs(s[x]['U'] - s[x]['L']) for x in 'abc'), max(abs((s[x]['U'] + s[x]['L']) / 2 - m) for x in 'abc')
                v0, h0 = imb(0.3)
                v1, h1 = imb(0.9)
                self.assertLess(v1, 0.012)
                self.assertLess(v1, v0)
                self.assertLess(max(h0, h1), 0.005)

    def test_direct_modulation_without_windup(self):
        # 4.14: the integrator of the V_dc control ran on to 2·I_lim while the limit held i_d at 1.1 pu: V_dc 0.92–1.05 pu in
        # 0.25–0.5 s; held now, within ±2.5 % (the ripple of the capacitors still in the AC voltage)
        o = cases([{'kind': 'tut', 'id': 'hvdc_mmc', 'opts': {'model': 'm3', 'ectl': 'direct'}, 'win': 0.15, 'at': [0.5], 'keys': K}])[0]
        q = at(o, 0.5, 'Y:CT2/Fvdc')
        self.assertGreater(q['min'], 0.975)
        self.assertLess(q['max'], 1.025)

    def test_ac_fault_with_the_dc_overvoltage_limiter(self):
        # station 2 blocks on the voltage sag; station 1 cuts its current above 1.1 pu: V_dc ≈ 1.2 pu instead of 2–3 pu, and
        # after the clearing (at the current zeros) both stations recover
        for o in cases([{'kind': 'tut', 'id': 'hvdc_mmc', 'opts': {'model': m, 'ev': 'acf'}, 'win': 0.15, 'at': [0.65, 0.9], 'keys': K}
                        for m in ('m4', 'm3')]):
            q = at(o, 0.65, 'Y:CT2/Fvdc')     # 0.5–0.65 s: a first peak of 1.28–1.34 pu before the limiter acts, then held
            self.assertLess(q['max'], 1.4)
            self.assertLess(q['mean'], 1.21)
            self.assertAlmostEqual(q['last'], 1.2, delta=0.02)
            self.assertLess(abs(at(o, 0.65, 'Y:CT1/PP')['last']), 0.03)
            self.assertAlmostEqual(at(o, 0.9, 'Y:CT2/Fvdc')['last'], 1.0, delta=0.01)
            self.assertAlmostEqual(at(o, 0.9, 'Y:CT1/PP')['last'], 1.0, delta=0.03)


if __name__ == '__main__':
    unittest.main()
