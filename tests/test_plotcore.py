"""4.17.2 (ROADMAP §63, THEORY §8τ): the core of the graphs (web/studio/plotcore.js), shared by the scope and the viewer
of a recording first. Checked here: the ticks of an axis never overlap and use 1–2–5 steps, for many spans and widths;
the labels have the decimals of their step and one SI prefix per axis; the ranges are on grid steps and keep zero; the
steady automatic range opens at once, closes only after the hold, keeps its range in the same paused view and fits a new
view or new channels at once."""
import json
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def cases():
    out = subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'plotcore_cases.js')], capture_output=True, text=True,
                         check=True, timeout=300, cwd=ROOT).stdout
    return json.loads(out)


class Ticks(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.R = cases()

    def test_labels_never_overlap(self):
        for t in self.R['ticks']:
            self.assertTrue(t['ok'], t)                      # the widest label and 18 px fit between two ticks
            self.assertTrue(t['step125'], t)
            self.assertTrue(t['inside'], t)
            self.assertGreaterEqual(t['n'], 2, t)            # at least the two ends of a window of 180 px or more
            self.assertEqual(len(set(t['labels'])), len(t['labels']), t)   # no two equal labels (enough decimals)

    def test_more_room_more_ticks(self):
        by = {}
        for t in self.R['ticks']:
            by.setdefault((t['t0'], t['t1']), []).append((t['px'], t['n']))
        for k, v in by.items():
            ns = [n for _, n in sorted(v)]
            self.assertEqual(ns, sorted(ns), k)

    def test_y_ticks_and_labels(self):
        for q in self.R['yticks']:
            self.assertGreaterEqual(q['pxs'], 29 - 1e-9, q)
        self.assertEqual(self.R['yticks'][2]['labels'][:2], ['849,0 mV', '849,5 mV'])   # one prefix, the decimals of the step
        L = self.R['labels']
        self.assertEqual((L['t1'], L['t2'], L['t3']), ('12,5 ms', '2 s', '1,5 μs'))
        self.assertEqual((L['e1'], L['e2'], L['e3'], L['e4']), ('1,25 kV', '2,5 mA', '-12', '0,0 A'))
        self.assertEqual(L['e5'], '0,850')                  # no prefix for a quantity without a unit («850 m» reads as metres)

    def test_ranges_on_the_grid(self):
        r = self.R['range']
        self.assertEqual([round(x, 9) for x in r[0]], [0, 1])          # from 0.12…0.87: zero kept as the lower limit
        self.assertEqual([round(x, 9) for x in r[1]], [-4, 14])
        self.assertEqual([round(x, 9) for x in r[2]], [4.7, 5.3])       # a constant: a small range around it


class AutoRange(unittest.TestCase):
    def test_steady_range(self):
        A = cases()['auto']
        log = {row[0]: [round(x, 9) for x in row[1:]] for row in A['log']}
        self.assertEqual(log[0], [0, 1.2])
        self.assertEqual(log[100], [0, 1.8])         # the trace left the range: open at once, with room (¼ of its span)
        self.assertEqual(log[200], [0, 1.8])         # inside again: no change
        self.assertEqual(log[1500], [0, 1.8])        # under half of it for 1.2 s: not yet
        self.assertEqual(log[2400], [0, 0.5])        # for 2.1 s: closed to the data
        self.assertEqual(log[2500], [0, 0.5])
        self.assertEqual([round(x, 9) for x in A['p1']], [0, 0.5])    # paused: the range of the run, no jump
        self.assertEqual([round(x, 9) for x in A['p2']], [0, 0.5])    # the same view keeps it
        self.assertEqual([round(x, 9) for x in A['p3']], [0, 0.25])   # another view (a zoom, a move) fits at once
        self.assertEqual([round(x, 9) for x in A['p4']], [4.8, 6.2])  # other channels fit at once


if __name__ == '__main__':
    unittest.main()
