"""Control loops composed from choices, classical and neural (3.15, ROADMAP §38): pcl.control on the DC drive plant."""
import math
import shutil
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
import pcl  # noqa: E402
from pcl import control as C  # noqa: E402

HAS_NODE = shutil.which('node') is not None
La, Ra, J, Vdc = 10e-3, .5, .02, 220
AC = 2 * math.pi * 200
AS = AC / 10


def loops(kind, learn=True):
    return [{'name': 'ω', 'measure': 'M1:w', 'ref': '0:0, 0.02:100, 0.2:150', 'yscale': 150,
             'ctrl': {'type': kind, 'Kp': AS * J, 'Ki': AS * AS * J / 4, 'lo': -30, 'hi': 30, 'learn': learn, 'lr': 0.05}},
            {'name': 'i', 'measure': 'AM1:y', 'yscale': 30, 'ctrl': {'type': 'pi', 'Kp': AC * La, 'Ki': AC * Ra, 'lo': 0, 'hi': Vdc}, 'scale': 1 / Vdc}]


class Compose(unittest.TestCase):
    def test_structure_and_errors(self):
        p = {'components': [{'id': 'PWM1', 'type': 'PWM', 'params': {'D': .5}, 'x': 0, 'y': 0}, {'id': 'AM1', 'type': 'AM', 'params': {}, 'x': 0, 'y': 0},
                            {'id': 'M1', 'type': 'DCM', 'params': {}, 'x': 0, 'y': 0}], 'wires': []}
        q, d = C.compose(p, loops('pi_nn'), actuator='PWM1:d')
        ids = {c['id']: c for c in q['components']}
        self.assertEqual([x['block'] for x in d], ['AC1C', 'AC2C'])
        self.assertEqual(ids['PWM1']['params']['mode'], 'ext')
        self.assertEqual(ids['PWM1']['params']['in_d'], 'AC2G:y')             # the inner loop, scaled, drives the duty
        self.assertEqual(ids['AC2E']['params']['in_a'], 'AC1C:u')             # the outer output is the inner reference
        self.assertEqual(ids['AC1C']['type'], 'PY')
        self.assertEqual(ids['AC2C']['type'], 'PIB')
        self.assertIn('lr = 0.05', ids['AC1C']['params']['pars'])
        self.assertEqual(q['control']['composed']['actuator'], 'PWM1:d')
        q2, _ = C.compose(q, loops('pi')[:1], actuator='PWM1:d')               # a new composition replaces the old one
        self.assertEqual(sorted(c['id'] for c in q2['components'] if c['id'].startswith('AC')), ['AC1C', 'AC1E', 'AC1R'])
        self.assertEqual(p['components'][0]['params'], {'D': .5})              # the original is left as it was
        with self.assertRaises(ValueError):
            C.compose(p, loops('pi'), actuator='PWM9:d')
        with self.assertRaises(ValueError):
            C.compose(p, [{'name': 'x', 'measure': 'Q1:y'}], actuator='PWM1:d')
        with self.assertRaises(ValueError):
            C.compose(p, [{'name': 'x', 'measure': 'AM1:y', 'ctrl': {'type': 'magic'}}], actuator='PWM1:d')

    def test_metrics_closed_form(self):
        t = [k * 1e-3 for k in range(1001)]
        r = [1.0] * len(t)
        y = [1 - math.exp(-x / 0.1) for x in t]                                  # IAE = τ(1 − e^(−T/τ)), ISE = τ/2(1 − e^(−2T/τ))
        m = C.metrics(t, r, y)
        self.assertAlmostEqual(m['IAE'], 0.1 * (1 - math.exp(-10)), delta=1e-6)
        self.assertAlmostEqual(m['ISE'], 0.05 * (1 - math.exp(-20)), delta=1e-5)          # trapezoidal, h = 1 ms
        self.assertEqual(m['overshoot_pct'], 0.0)


@unittest.skipIf(not HAS_NODE, 'Node.js not installed (the browser solver runs in Node).')
class OnTheDrive(unittest.TestCase):
    """The DC drive of the tutorial in open loop is the plant; the loops are composed on it."""

    @classmethod
    def setUpClass(cls):
        cls.plant = pcl.tutorial('dc_drive', mode='open')
        cls.res = {}
        for name, kind, learn in (('pi', 'pi', True), ('frozen', 'pi_nn', False), ('learn', 'pi_nn', True)):
            q, _ = C.compose(cls.plant, loops(kind, learn), actuator='PWM1:d')
            ch = ['Y:M1', 'Y:AC1R'] + (['Y:AC1C:nn'] if name == 'learn' else [])      # the same channels: the same decimation
            r = q.run(t_end=0.4, channels=ch, max_points=20000)
            cls.res[name] = (r, C.metrics(r.t, r['Y:AC1R'], r['Y:M1']))

    def test_classical_cascade_tracks(self):
        r, m = self.res['pi']
        self.assertAlmostEqual(r['Y:M1'][-1], 150, delta=0.05)                   # after the load step of 10 N·m at 0.25 s
        self.assertLess(m['overshoot_pct'], 2)

    def test_untrained_network_is_the_pi(self):
        (a, ma), (b, mb) = self.res['pi'], self.res['frozen']                  # (decimated differently: another channel count)
        self.assertEqual(a['Y:M1'][-1], b['Y:M1'][-1])
        for k in ('IAE', 'ISE', 'overshoot_pct'):
            self.assertAlmostEqual(ma[k], mb[k], delta=1e-9 * max(1.0, abs(ma[k])))
        q, _ = C.compose(self.plant, loops('pi_nn', False), actuator='PWM1:d')
        self.assertEqual(max(abs(v) for v in q.run(t_end=0.05, channels=['Y:AC1C:nn'])['Y:AC1C:nn']), 0.0)
        self.assertEqual(a['Y:M1'], b['Y:M1'])

    def test_network_learns_the_load(self):
        r, m = self.res['learn']
        self.assertAlmostEqual(r['Y:M1'][-1], 150, delta=0.05)                   # stable, on the reference
        nn = r['Y:AC1C:nn'][-1]
        i_load = 10 / 1.0 + 0.002 * 150 / 1.0                                    # (T_L + b·ω)/ψ
        self.assertGreater(nn, 0.5 * i_load)                                     # most of the load current is learned
        self.assertLess(nn, 1.5 * i_load)
        self.assertLess(m['IAE'], 1.02 * self.res['pi'][1]['IAE'])


if __name__ == '__main__':
    unittest.main()
