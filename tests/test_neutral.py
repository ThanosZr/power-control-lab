"""The option «Ουδέτερος» of the three-phase parts (4.24, decisions 208 and 345): tests/js/neut_cases.js.

Every three-phase part with a star point (VAC3, GRID3, XF3 per side, LOAD3, FILT3, GEN3) has solidly grounded, through
R_n + jX_n, isolated, or a terminal n. The default of each part is what it did before 4.24 (the same netlist); a terminal
n wired to a ground gives the currents of the solid ground; R_n + jX_n adds 3Z_n to the zero sequence (IEC 60909)."""
import json
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


class Neutral(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        out = subprocess.run(['node', str(ROOT / 'tests/js/neut_cases.js')], capture_output=True, text=True, timeout=900, check=True)
        cls.r = json.loads(out.stdout)

    def test_the_terminal_n_only_with_its_choice(self):
        p = self.r['pins']
        for t in ('VAC3', 'GRID3', 'LOAD3', 'FILT3', 'GEN3'):
            self.assertEqual({k: v for k, v in p[t].items() if v}, {'pin': ['n']}, t)
        self.assertEqual({k: v for k, v in p['XF3'].items() if v}, {'pin': ['n2']})
        self.assertEqual(p['XF3d'], [])                       # Dyn11: side 1 is a delta, no neutral
        self.assertEqual(p['LOAD3d'], [])

    def test_the_default_is_the_netlist_of_before(self):
        self.assertEqual(set(self.r['defaults'].values()), {True}, self.r['defaults'])

    def test_a_terminal_wired_to_ground_is_the_solid_ground(self):
        s = self.r['same']
        self.assertEqual(s['grid'][0], s['grid'][1])
        self.assertEqual(s['vac3'][0], s['vac3'][1])
        self.assertEqual(s['xf'][0], s['xf'][1])
        L = s['load']
        self.assertEqual(L['yn'], L['gnd'])
        self.assertEqual(L['yn'], L['pin'])
        self.assertEqual(L['y'], L['iso'])                    # «Μονωμένος» = Y without ground
        self.assertNotEqual(L['yn'], L['y'])
        F = s['filt']
        self.assertEqual(F['gnd'], F['pin'])
        self.assertNotEqual(F['gnd'], F['iso'])               # the zero sequence of the filter is blocked

    def test_the_network_equivalent_with_Zn_against_the_phase_domain(self):
        g = self.r['grid']
        for k in ('z', 'zr', 'rin'):
            self.assertLess(abs(g[k]['sim'] / g[k]['ref'] - 1), 5e-4, (k, g[k]))
        self.assertEqual(g['zr']['sim'], g['rin']['sim'])      # R_n outside Z₀ (a branch) = R_n inside Z₀ (4.23)
        self.assertLess(g['z']['ref'], 0.5 * g['zr']['ref'])   # jX_n limits the earth-fault current further
        self.assertLess(g['iso']['sim'], 0.1)
        sim, ref, ref0 = g['abc']
        self.assertAlmostEqual(ref, ref0, delta=1e-6 * ref0)   # Z_n does not change a three-phase fault
        self.assertLess(abs(sim / ref - 1), 5e-4)

    def test_behind_a_transformer_with_Zn(self):
        x = self.r['xf']
        for k in ('auto', 'z'):
            self.assertLess(abs(x[k]['sim'] / x[k]['ref'] - 1), 1e-3, (k, x[k]))
        self.assertLess(x['z']['sim'], 0.25 * x['auto']['sim'])
        self.assertLess(x['iso']['sim'], 0.1)

    def test_the_source_with_Zn_into_an_unbalanced_star(self):
        v = self.r['vac3']
        for a, b in zip(v['sim'], v['ref']):
            self.assertLess(abs(a / b - 1), 1e-4)
        self.assertLess(v['iso']['sum'], 1e-6 * v['iso']['scale'])   # isolated: no current returns

    def test_the_generator_has_Rn_and_Ln(self):
        self.assertIn(3, self.r['gen']['G'])
        self.assertEqual(len(self.r['gen']['L']), 1)
        self.assertAlmostEqual(self.r['gen']['L'][0], 4, places=9)


if __name__ == '__main__':
    unittest.main()
