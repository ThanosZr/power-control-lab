"""The electric vehicle (4.8, ROADMAP §46, tutorial «Ηλεκτρικό όχημα: πολυκριτηριακός έλεγχος») and the multi-objective
controller (library part EVC: the cascades «moev» and «moevc» of the Control Workbench EV/DC) in the browser's solver:
the options build, two minutes of the repeating cycle, the coupled scheme against the plain cascade, the energy metrics
against the SOC, the presets of the modes, the expressions with fixed names folded once, and a period of N clock periods.
The same controller on the server: tests/test_batch.py (test_ev_controller_parity)."""
import json
import shutil
import subprocess
import unittest
from pathlib import Path

CASES = Path(__file__).resolve().parent / 'js' / 'ev_cases.js'


@unittest.skipIf(shutil.which('node') is None, 'Node.js not installed (the solver runs in web/studio/mna.js).')
class ElectricVehicle(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        run = subprocess.run(['node', str(CASES)], capture_output=True, text=True, timeout=900)
        if run.returncode:
            raise RuntimeError(run.stderr)
        cls.R = json.loads(run.stdout)

    def test_every_option_builds(self):
        b = self.R['build']
        self.assertEqual(len(b), 12)
        for c in b:
            self.assertEqual(c['warn'], [], c)
            self.assertTrue(c['ok'], c)
            self.assertEqual(c['stopT'], 0)                 # no end of the run
            self.assertEqual(c['rec'], {'dt': 1e-3})        # a point per ms in the memory

    def test_minutes_with_a_repeating_cycle(self):
        r = self.R['moevc']
        self.assertEqual(r['warn'], [])
        a, b = r['at']['60'], r['at']['120']
        self.assertLess(abs(a['kph']), 0.5)                 # each cycle ends with a stop
        self.assertLess(abs(b['kph']), 0.5)
        self.assertAlmostEqual(b['x'] / a['x'], 2, delta=0.02)    # the same cycle again: twice the distance
        self.assertGreater(a['x'], 300)
        self.assertGreater(b['dsoc'], a['dsoc'] * 1.9)      # the battery keeps discharging
        g = r['ring']                                       # the memory: a fixed ring of points 1 ms apart,
        self.assertEqual(g['n'], g['cap'])                  # full after two minutes, the last ~100 s
        self.assertAlmostEqual(g['dt'], 1e-3, delta=1e-9)
        self.assertGreater(g['span'], 60)

    def test_energy_metrics(self):
        for k in ('moevc', 'moev'):
            a = self.R[k]['at']['60']
            self.assertTrue(20 < a['kwh'] < 35, (k, a))
            self.assertAlmostEqual(a['kwh'] * a['whk'], 1000, delta=1e-6 * 1000)    # km/kWh and Wh/km of the same E and x
            # the energy drawn and the charge (SOC): their ratio is a battery voltage between the OCV at 0 and at 100 %
            q = (self.R[k]['soc0'] - a['soc']) * self.R[k]['Q'] * 3600
            self.assertTrue(45 < a['en'] / q < 58.8, (k, a['en'] / q))
            self.assertAlmostEqual(a['dsoc'], 100 * (self.R[k]['soc0'] - a['soc']), places=9)
            self.assertTrue(3 < a['nmk'] < 8 and 10 < a['irms'] < 40, a)

    def test_coupled_scheme_follows_better(self):
        # the reference governor and the vehicle dynamics in «moevc»: the speed follows the cycle within ~1 rad/s RMS and
        # barely rolls back at the stops; the plain cascade «moev» lags and rolls back on the grade (as in the workbench)
        c, m = self.R['moevc'], self.R['moev']
        self.assertLess(c['rms'], 2)
        self.assertGreater(m['rms'], 2 * c['rms'])
        self.assertGreater(c['minW'], -8)
        self.assertLess(m['minW'], c['minW'])
        self.assertEqual(c['at']['60']['keep'], 1.15)        # balanced: the allocation keeps the most of the torque
        self.assertAlmostEqual(m['at']['60']['keep'], 0.8875)    # moev: 0.55 + 0.45·0.75

    def test_presets_of_the_modes(self):
        M = self.R['modes']
        self.assertEqual(M['moevc:balanced']['tp'], {'tl': 40, 'il': 200, 'kt': 0.2, 'pl': 8})
        self.assertEqual(M['moevc:eco']['tp']['pl'], 5.2)
        self.assertEqual(M['moevc:eco']['tp']['il'], 140)
        self.assertEqual(M['moevc:performance']['tp']['pl'], 10.8)
        self.assertEqual(M['moevc:performance']['tp']['il'], 250)
        self.assertEqual(M['moevc:eco']['kp'], {'ws': 0.85, 'wt': 0.55, 'we': 0.95, 'pl': 5.2})
        self.assertEqual(M['moevc:performance']['kp'], {'ws': 1.1, 'wt': 0.95, 'we': 0.2, 'pl': 10.8})
        self.assertEqual(M['moev:eco']['kp'], {'wt': 0.55, 'we': 0.85})     # moev: no speed weight in the allocation
        self.assertEqual(M['moev:performance']['kp'], {'wt': 0.95, 'we': 0.25})
        self.assertIn('GOV', M['moevc:balanced']['ids'])
        self.assertIn('PIA', M['moevc:balanced']['ids'])
        self.assertNotIn('PIA', M['moev:balanced']['ids'])
        self.assertIn('PIW', M['moev:balanced']['ids'])

    def test_fixed_names_folded(self):
        for f in self.R['fold']:
            self.assertTrue(f['same'], f)                   # bit for bit the same as evaluating the names each time
            self.assertEqual(f['left'], 0, f)               # no fixed name left in the tree
            self.assertGreater(f['before'], 0, f)
        self.assertEqual(self.R['foldConst'], ['num', 7])
        self.assertEqual(self.R['foldIf'], ['var', 0])      # a fixed condition chooses its branch

    def test_period_of_n_clock_periods(self):
        p = self.R['perN']
        self.assertEqual(p['a'], 100)
        self.assertEqual(p['b'], 25)
        self.assertEqual(p['tb'], [0.004, 0.008, 0.012, 0.016])
        self.assertTrue(p['inc'])


if __name__ == '__main__':
    unittest.main()
