"""4.19.5 (ROADMAP §74, THEORY §3): the result of a run does not depend on the pieces in which run() is called. A piece
ends on a step boundary; when that boundary fell a few rounding errors before an edge (the reset of a carrier, the edge of a
PWM, a sample), the edge was inside the eps of the scheduler and was never a step boundary again: a gate changed one step
late, a comparator changed at a wrong instant after the reset of a sawtooth. Now the end of a piece lands on the event that
lies within eps after it (solve.evSnap; 'off' is the path of before, kept for comparison). Checked here: the gate of a PWM
(buck), the sample at the reset of a sawtooth carrier (the third exercise, fixed and variable step), and the states of
tutorials with a sample-and-hold or a comparator. The run in one piece gives the same numbers as before, bit for bit (checked
outside the tests, on every tutorial)."""
import json
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


class PiecesOfARun(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        out = subprocess.run(['node', str(ROOT / 'tests/js/pieces_cases.js')], capture_output=True, text=True, timeout=1200, check=True)
        cls.r = json.loads(out.stdout)

    def test_the_gate_of_a_pwm_changes_at_the_same_instants(self):
        g = self.r['gate']
        self.assertEqual(g['changes'], 2 * g['periods'])
        for c in ('on_5', 'on_1'):
            self.assertTrue(g[c]['evSnap'])
            self.assertEqual(g[c]['n'], g['changes'], c)
            self.assertEqual(g[c]['late'], 0, c)             # every change at the instant of the run in one piece
            self.assertLess(g[c]['worst'], 1e-6, c)          # in steps
        for c in ('off_5', 'off_1'):                         # the path of before is really the path of before
            self.assertFalse(g[c]['evSnap'])
            self.assertGreater(g[c]['late'], 0, c)
            self.assertGreater(g[c]['worst'], 0.99, c)       # one whole step late

    def test_the_sample_at_the_reset_of_a_sawtooth(self):
        s = self.r['saw']
        for mode, names in (('fixed', ('T/200', 'T/100', 'T/60', 'T/30', 'T/10', 'T/3', '7T/3')), ('var', ('T/200', 'T/100', 'T/30'))):
            one = s[mode]['one']
            self.assertLess(one['range'], 0.01, mode)        # A, over the last 40 samples in steady state
            for n in names:
                p = s[mode]['on'][n]
                self.assertEqual(p['n'], one['n'], (mode, n))
                self.assertLess(p['dlast'], 1e-3, (mode, n))     # A: the same held sample as in one piece
                self.assertLess(p['range'], 0.01, (mode, n))
            self.assertGreater(s[mode]['off']['T/200']['range'], 0.1, mode)   # before: the sample wandered in pieces of T/200

    def test_the_states_of_other_tutorials(self):
        for name, row in self.r['state'].items():
            self.assertGreater(row['keys'], 0, name)
            self.assertNotEqual(row['on']['worst'], 'inf', name)
            self.assertLess(row['on']['worst'], 1e-4, name)      # of the largest RMS of the kind, over the last base period
        for name in ('sampling', 'blocks_loop', 'sub_legs'):
            self.assertGreater(self.r['state'][name]['off']['worst'], 1e-3, name)


if __name__ == '__main__':
    unittest.main()
