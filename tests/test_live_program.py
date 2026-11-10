"""Live parameters (3.19, ROADMAP §4): a live change and the same change as a program (project.program) give the same
run bit for bit, ramps, the duty latched per period, and the program through pcl (the browser solver in Node)."""
import json
import shutil
import subprocess
import unittest
from pathlib import Path

CASES = Path(__file__).resolve().parent / 'js' / 'live_cases.js'


@unittest.skipIf(shutil.which('node') is None, 'Node.js not installed (the program runs in web/studio/mna.js).')
class LiveProgram(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        run = subprocess.run(['node', str(CASES)], capture_output=True, text=True, timeout=300)
        if run.returncode:
            raise RuntimeError(run.stderr)
        cls.R = json.loads(run.stdout)

    def test_live_change_and_program_are_the_same_run(self):
        r = self.R['replay']
        self.assertTrue(r['same'])                       # every recorded point of i_L, v_C and a filter output
        self.assertEqual(r['steps'][0], r['steps'][1])
        self.assertEqual(r['end'][0], r['end'][1])
        self.assertEqual([c[1:] for c in r['changes']], [['R1', 'R', 5], ['GN', 'K', -1]])
        self.assertEqual([c[0] for c in r['changes']], r['t'])   # marked on the scope at the same instants

    def test_ramp(self):
        r = self.R['ramp']
        self.assertEqual(r['mid'], 7.5)                  # 10 → 5 Ω at 1000 Ω/s, 2.5 ms after the start
        self.assertEqual(r['end'], 5)
        self.assertEqual(r['entries'], 201)              # the entry and its 200 steps (T/50 would need more)
        self.assertEqual(r['marks'], 1)                  # one mark on the scope for the whole ramp

    def test_duty_change_after_the_edge_does_not_switch_twice(self):
        d = self.R['duty']
        self.assertEqual(d['edgesThis'], 0)
        self.assertAlmostEqual(d['dutyNext'], .8, delta=1e-9)

    def test_missing_part_is_a_message(self):
        m = self.R['missing']
        self.assertAlmostEqual(m['t'], .002, delta=1e-12)
        self.assertEqual(len(m['msgs']), 1)
        self.assertIn('NOPE', m['msgs'][0])


if __name__ == '__main__':
    unittest.main()
