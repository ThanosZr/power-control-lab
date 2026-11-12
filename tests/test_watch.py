"""The tiles of the control signals over the drawing (4.8, ROADMAP §47, web/studio/watch.js): the layout of a tutorial or
a file, the step buttons, saturation, the curve of a tile, the slider, and a yes/no parameter («Μαθαίνει» of a network)
changed live or by a program giving the same run. The tiles in the app: tests/ui/watch_flow.js."""
import json
import shutil
import subprocess
import unittest
from pathlib import Path

CASES = Path(__file__).resolve().parent / 'js' / 'watch_cases.js'


@unittest.skipIf(shutil.which('node') is None, 'Node.js not installed (the tiles run in web/studio/watch.js).')
class Watch(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        run = subprocess.run(['node', str(CASES)], capture_output=True, text=True, timeout=300)
        if run.returncode:
            raise RuntimeError(run.stderr)
        cls.R = json.loads(run.stdout)

    def test_layout(self):
        n = self.R['norm']
        self.assertTrue(n['show'])
        self.assertEqual(n['panel'], {'view': 'table', 'min': True, 'x': 12})
        t = n['tiles']
        self.assertEqual(len(t), 4)                       # an empty key and a control without '.' are dropped
        self.assertEqual(t[0], {'key': 'Y:M1', 'label': 'ω', 'at': [10, 20], 'id': 'w1'})
        self.assertEqual(t[1]['ctl'], {'c': 'KW', 'k': 'v'})
        self.assertEqual(t[1]['steps'], ['-20', '+20', '=100'])
        self.assertEqual((t[1]['al'], t[1]['rng']), ('r', [0, 200]))
        self.assertEqual(t[2], {'ctl': {'c': 'NN1', 'k': 'learn'}, 'id': 'w3'})
        self.assertEqual(t[3], {'id': 'w4', 'key': 'Y:E1'})   # a taken id is renewed; a bad place, range, span and side go
        self.assertEqual(self.R['normList']['tiles'], [{'key': 'I:L1', 'label': 'i_L', 'id': 'w1'}])
        self.assertIsNone(self.R['normNone'])
        self.assertFalse(self.R['normEmpty']['show'])

    def test_steps(self):
        s = self.R['steps']
        self.assertEqual(s[0], ['mul', 1.1, '+10 %', 55])
        self.assertEqual(s[1], ['mul', 0.9, '−10 %', 45])
        self.assertEqual(s[2], ['mul', 1.5, '×1,5', 75])
        self.assertEqual(s[3][:2], ['mul', 2])
        self.assertEqual(s[4], ['add', 5, '+5', 55])
        self.assertEqual(s[5], ['add', -0.5, '−0,5', 49.5])
        self.assertEqual(s[6], ['set', 100, '= 100', 100])
        self.assertEqual(s[7][1], 1000)
        self.assertIsNone(s[8])
        self.assertIsNone(s[9])

    def test_saturation(self):
        # at the upper / lower limit, inside, defaults of the block, one limit only, NaN, within 1e-6 of the span
        self.assertEqual(self.R['sat'], ['hi', 'lo', '', 'hi', 'hi', '', 'hi'])

    def test_curve(self):
        e = self.R['env']
        self.assertEqual(e['c'], [[0, 0, 2, 1], [3, -1, 3, -1], [5, 4, 5, 4], [4, 2, 4, 2]])   # first, min, max, last
        self.assertEqual((e['lo'], e['hi']), (-1, 5))
        pts = [tuple(map(float, p.split(','))) for p in e['pts'].split()]
        self.assertEqual(pts[0], (5.0, 7.9))              # x in the middle of the column; y = 10 − (v + 0.48)/6.96·10
        self.assertTrue(all(0 <= y <= 10 for _, y in pts))
        self.assertEqual(e['flat'], '5.0,5.0 15.0,5.0')   # a flat curve in the middle
        self.assertEqual(e['none'], '')

    def test_slider(self):
        lg, z, neg, rng = self.R['slider']
        self.assertEqual(lg['map'], {'log': True, 'lo': 15, 'hi': 1500})   # a decade each way of 150
        self.assertEqual(lg['x'], [0, 1000, 500])          # the geometric middle in the middle
        self.assertEqual(lg['back'], 150)
        self.assertEqual(z['map'], {'log': False, 'lo': -1, 'hi': 1})
        self.assertEqual(neg['map'], {'log': False, 'lo': -8, 'hi': 0})
        self.assertEqual(rng['map'], {'log': False, 'lo': 0, 'hi': 200})
        self.assertEqual(rng['back'], 60)

    def test_learning_switch_live_and_as_program(self):
        r = self.R['learn']
        self.assertNotIn('error', r)
        self.assertTrue(r['same'])                        # live (load with the states) = program entry, sample for sample
        self.assertFalse(r['learnEnd'])
        self.assertEqual(r['changes'], [['N', 'learn', False]])   # marked on the scope
        self.assertTrue(r['sameBefore'])                  # and it matters: before the switch as a network that keeps learning,
        self.assertGreater(r['diffAfter'], 1e-3)          # after it not
        self.assertGreater(r['Lmid'], 0)


if __name__ == '__main__':
    unittest.main()
