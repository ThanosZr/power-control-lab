"""4.16 (ROADMAP §42, THEORY §8ω): the line-commutated converter and the first CIGRE HVDC benchmark.

The cases run headless in Node (tests/js/lcc_cases.js):
- one six-pulse bridge on a stiff source behind L_c, fired at a constant α, against Kundur ch. 10;
- one twelve-pulse station (two bridges, YNy0 and YNd1) against (10.30), and its average model against it;
- the analytical bridge (thyristors, PLL, comparators) against the SciPy solver;
- the tutorial hvdc_lcc against the PSCAD results of the benchmark (Faruque, Zhang, Dinavahi, IEEE TPWRD 21(1), 2006,
  Tables I–II) and its faults.
The fast implementation of the bridge (one compact element, LCCX) is the analytical one solved the same way.
"""
import json
import math
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
JS = ROOT / 'tests' / 'js' / 'lcc_cases.js'
D = math.pi / 180
W = 2 * math.pi * 50


def cases(cs, timeout=1800):
    r = subprocess.run(['node', str(JS), json.dumps(cs)], capture_output=True, text=True, timeout=timeout, cwd=str(ROOT))
    if r.returncode:
        raise RuntimeError(r.stderr[-3000:])
    out = json.loads(r.stdout)
    for o in out:
        if 'error' in o:
            raise RuntimeError(o['error'][:3000])
    return out


def kundur(alpha, Id, Ell=211e3, Xc=W * 0.0545, n=1):
    """V_d and γ of n bridges in series at α (degrees) and I_d: Kundur (10.11), (10.10), (10.29)–(10.30)."""
    Vd0 = n * 3 * math.sqrt(2) / math.pi * Ell
    Vd = Vd0 * math.cos(alpha * D) - n * 3 / math.pi * Xc * Id
    c = math.cos(alpha * D) - math.sqrt(2) * Xc * Id / Ell
    return Vd0, Vd, 180 - math.acos(max(-1.0, min(1.0, c))) / D


INV = {'alpha': 140, 'vsrc': 600e3, 'Rd': 400, 'T': 0.4}


class Bridge(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.r = cases([{'kind': 'bridge', 'impl': 'fast', 'alpha': 15}, {'kind': 'bridge', 'impl': 'blocks', 'alpha': 15},
                       {'kind': 'bridge', 'impl': 'fast', **INV}, {'kind': 'bridge', 'impl': 'blocks', **INV},
                       {'kind': 'bridge', 'impl': 'fast', 'tq': 0.5e-3, **INV}, {'kind': 'bridge', 'impl': 'blocks', 'tq': 0.5e-3, **INV},
                       {'kind': 'bridge', 'impl': 'fast', 'tq': 2e-3, **INV}])

    def test_rectifier_against_kundur(self):
        o = self.r[0]
        self.assertEqual(o['warn'], [])
        Vd0, Vd, g = kundur(15, o['Id'])
        self.assertLess(abs(o['Vd'] - Vd) / Vd0, 2e-3)
        self.assertLess(abs(o['am'] - 15), 0.01)      # the measured α: from the natural point to the turn-on
        self.assertLess(abs(o['gm'] - g), 0.5)
        self.assertEqual(o['cf'], 0)

    def test_inverter_against_kundur(self):
        o = self.r[2]
        Vd0, Vd, g = kundur(140, o['Id'])
        self.assertLess(Vd, 0)
        self.assertLess(abs(o['Vd'] - Vd) / Vd0, 2e-3)
        self.assertLess(abs(o['am'] - 140), 0.01)
        self.assertLess(abs(o['gm'] - g), 0.5)        # γ = π − α − μ, (10.13)
        self.assertEqual(o['cf'], 0)

    def test_fast_is_the_analytical_implementation(self):
        for a, b in ((self.r[0], self.r[1]), (self.r[2], self.r[3]), (self.r[4], self.r[5])):
            self.assertLess(abs(a['Id'] / b['Id'] - 1), 1e-5)
            self.assertLess(abs(a['Vd'] / b['Vd'] - 1), 1e-5)
            self.assertLess(abs(a['gm'] - b['gm']), 0.01)
            self.assertLess(abs(a['am'] - b['am']), 0.01)

    def test_turn_off_time(self):
        # t_q shorter than the margin γ/ω (29° = 1,6 ms here) changes nothing; longer: every valve fires again without a
        # pulse when its voltage turns forward, a commutation failure that does not clear at a fixed α
        base, short, long_ = self.r[2], self.r[4], self.r[6]
        self.assertLess(base['gm'] * D / W, 2e-3)
        self.assertGreater(base['gm'] * D / W, 0.5e-3)
        self.assertLess(abs(short['Id'] / base['Id'] - 1), 1e-6)
        self.assertEqual(short['cf'], 0)
        self.assertEqual(long_['cf'], 1)
        self.assertEqual(long_['gm'], 0)


U2, SN = 213.4557e3, 603.73e6


class Station(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        inv = {'alpha': 130, 'vsrc': 900e3, 'Rd': 239, 'T': 0.6}
        cls.r = cases([{'kind': 'station', 'model': 'det', 'alpha': 15}, {'kind': 'station', 'model': 'det', 'impl': 'blocks', 'alpha': 15},
                       {'kind': 'station', 'model': 'avg', 'alpha': 15},
                       {'kind': 'station', 'model': 'det', **inv}, {'kind': 'station', 'model': 'avg', **inv}])

    def test_twelve_pulses_against_kundur(self):
        o = self.r[0]
        self.assertEqual(o['warn'], [])
        Vd0, Vd, _ = kundur(15, o['Id'], Ell=U2, Xc=0.18 * U2 * U2 / SN, n=2)
        self.assertLess(abs(o['Vd'] - Vd) / Vd0, 1e-3)
        self.assertLess(abs(o['P'] / o['Pdc'] - 1), 5e-3)     # the losses of the valves and snubbers

    def test_analytical_implementation(self):
        a, b = self.r[0], self.r[1]
        self.assertLess(abs(a['Vd'] / b['Vd'] - 1), 1e-5)
        self.assertLess(abs(a['Q'] / b['Q'] - 1), 1e-4)

    def test_average_model(self):
        # V_d and I_d as the detailed station; P on the AC side = V_d·I_d (no losses); Q with the exact tan φ with overlap
        for det, avg in ((self.r[0], self.r[2]), (self.r[3], self.r[4])):
            self.assertEqual(avg['warn'], [])
            self.assertLess(abs(avg['Vd'] / det['Vd'] - 1), 4e-3)
            self.assertLess(abs(avg['Id'] / det['Id'] - 1), 2e-3)
            self.assertLess(abs(avg['P'] / avg['Pdc'] - 1), 1e-4)
            self.assertLess(abs(avg['Q'] / det['Q'] - 1), 0.02)
        self.assertLess(abs(self.r[4]['gm'] - self.r[3]['gm']), 0.5)
        self.assertLess(self.r[4]['P'], 0)
        self.assertGreater(self.r[4]['Q'], 0)                  # an inverter draws reactive power too


class SciPy(unittest.TestCase):
    def test_analytical_bridge_against_scipy(self):
        import numpy as np
        from engine.batch import simulate
        o = cases([{'kind': 'scipy', 'alpha': 15, 'Ld': 0.2, 'Rd': 100, 'T': 0.03, 'hDiv': 2000}])[0]
        self.assertEqual(o['warn'], [])
        d = o['batch']
        self.assertEqual(d['skipped'], [])
        rec = np.array(o['rec'])
        ts = rec[:, 0]
        r = simulate({'net': d['net'], 'channels': d['channels'], 't_end': float(ts[-1]), 'method': 'Radau', 'rtol': 1e-7,
                      'atol': 1e-9, 'max_points': 400000, '_local': True, 'wall': 900})
        self.assertEqual(r['status'], 'ok', r.get('message'))
        t = np.array(r['t'])
        s = {k: np.interp(ts, t, np.array(r['ch'][k], float)) for k in o['ch']}
        b = {k: rec[:, j + 1] for j, k in enumerate(o['ch'])}
        i = b['I:LD']
        self.assertLessEqual(float(np.max(np.abs(i - s['I:LD']))), 1e-3 * float(np.max(np.abs(i))))
        # V_d jumps at each firing: the mean over the last 2 ms and the measured α (the LCCM block in both solvers)
        self.assertLess(abs(float(np.mean(b['Y:MV'][-200:])) / float(np.mean(s['Y:MV'][-200:])) - 1), 1e-4)
        self.assertLess(abs(float(np.mean(b['Y:BR/M'][-200:])) - float(np.mean(s['Y:BR/M'][-200:]))), 0.01)

    def test_export_refuses_what_scipy_does_not_have(self):
        a, q, f = cases([{'kind': 'refuse', 'what': 'avg'}, {'kind': 'refuse', 'what': 'tq'}, {'kind': 'refuse', 'what': 'fast'}])
        self.assertFalse(a['ok'])
        self.assertIn('μέσο μοντέλο', a['msg'])
        self.assertFalse(q['ok'])
        self.assertIn('t_q', q['msg'])
        self.assertTrue(f['ok'])                 # the compact bridge goes as the analytical one: six thyristors
        self.assertFalse(f['lcc'])
        self.assertEqual(f['scr'], 6)


K = ['Y:CR/KV', 'Y:CI/KV', 'Y:CR/FI', 'Y:CI/FI', 'Y:CR/AO', 'Y:CI/AO', 'Y:STI/GM', 'Y:STI/CF', 'Y:CI/CC', 'Y:CI/ORD', 'Y:STI/IDC']


def tut(opts, at, win=0.02):
    return cases([{'kind': 'tut', 'opts': opts, 'at': at, 'win': win, 'keys': K}])[0]


def m(o, k, i=-1):
    return o['out'][i][k]['mean']


class Benchmark(unittest.TestCase):
    """The tutorial: 1000 MW at 500 kV, weak AC systems (SCR 2,5), the controls of the PSCAD example."""

    def test_steady_state_against_pscad(self):
        o = tut({'model': 'fast'}, [1.5])
        self.assertEqual(o['warn'], [])
        self.assertLess(abs(m(o, 'Y:CR/KV') / 0.99 - 1), 0.015)
        self.assertLess(abs(m(o, 'Y:CI/KV') / 0.972 - 1), 0.015)
        self.assertLess(abs(m(o, 'Y:CR/FI') - 1), 3e-3)
        self.assertLess(abs(m(o, 'Y:CR/AO') - 16.92), 0.5)
        self.assertLess(abs(m(o, 'Y:CI/AO') - 141.89), 1.0)
        self.assertLess(abs(m(o, 'Y:STI/GM') - 15.10), 0.3)
        self.assertEqual(m(o, 'Y:CI/CC'), 0)        # the inverter controls γ, the rectifier the current

    def test_analytical_and_average_models(self):
        f, b, a = (tut({'model': x}, [1.0]) for x in ('fast', 'blocks', 'avg'))
        self.assertLess(abs(m(b, 'Y:CR/AO') - m(f, 'Y:CR/AO')), 0.1)
        self.assertLess(abs(m(b, 'Y:CR/KV') - m(f, 'Y:CR/KV')), 1e-3)
        self.assertLess(abs(m(b, 'Y:STI/GM') - m(f, 'Y:STI/GM')), 0.1)
        # the average model: no harmonics, γ as the mean (the detailed one takes the least of the valves)
        self.assertLess(abs(m(a, 'Y:CR/FI') - 1), 5e-3)
        self.assertLess(abs(m(a, 'Y:CR/KV') - m(f, 'Y:CR/KV')), 0.02)
        self.assertLess(abs(m(a, 'Y:STI/GM') - m(f, 'Y:STI/GM')), 0.3)

    def test_dc_fault(self):
        o = tut({'model': 'fast', 'ev': 'dcf'}, [0.95, 1.3, 2.0], win=0.3)
        f = o['out'][1]
        self.assertLess(f['Y:CI/ORD']['min'], 0.56)        # the VDCOL to I₁ = 0,55 pu
        self.assertLess(f['Y:CR/KV']['mean'], 0.3)
        self.assertLess(abs(m(o, 'Y:CR/FI') - 1), 0.01)    # back to 1000 MW within 0,85 s of the clearing
        self.assertGreater(m(o, 'Y:CR/KV'), 0.97)
        self.assertEqual(o['out'][-1]['Y:STI/CF']['max'], 0)

    def test_ac_faults_at_the_inverter(self):
        a1, a3 = (tut({'model': 'fast', 'ev': e}, [0.95, 1.3, 2.0], win=0.3) for e in ('ac1', 'ac3'))
        for o in (a1, a3):
            f = o['out'][1]
            self.assertEqual(f['Y:STI/CF']['max'], 1)       # commutation failure
            self.assertLess(abs(m(o, 'Y:CR/FI') - 1), 0.015)
            self.assertLess(abs(m(o, 'Y:STI/GM') - 15), 1.5)
        pk = a1['out'][1]['Y:STI/IDC']['max'] / 2000
        self.assertGreater(pk, 2.2)                        # PSCAD 2,58 pu, the other programs of the paper 2,4 and 2,39
        self.assertLess(pk, 2.8)

    def test_current_order_step(self):
        o = tut({'model': 'fast', 'ev': 'step'}, [2.0])
        self.assertLess(abs(m(o, 'Y:CR/FI') - 0.9), 3e-3)
        self.assertGreater(m(o, 'Y:CR/AO'), m(tut({'model': 'fast'}, [1.0]), 'Y:CR/AO'))
        self.assertEqual(m(o, 'Y:CI/CC'), 0)
        self.assertLess(abs(m(o, 'Y:STI/GM') - 15), 0.3)


if __name__ == '__main__':
    unittest.main()
