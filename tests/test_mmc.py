"""4.14 (ROADMAP §42): the MMC in the four models of the MMC station of EMTP-RV and the control of its station.

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
        o = cases([{'kind': 'tut', 'id': 'hvdc_mmc', 'opts': {'model': 'm3'}, 'at': [0.45, 0.9], 'keys': K}])[0]
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


if __name__ == '__main__':
    unittest.main()
