"""4.19.6 (ROADMAP §76, THEORY §8Ρ): the blocks that measure a signal inside the simulation and give the result as a signal: mean value
(AVG), RMS, lowest and highest value per period (MNMX), over a window of periods that runs with the time or closes once per period
(web/studio/mna.js evalBlocks, engine/batch.py eval_blocks). The numbers come from tests/js/meas_cases.js; every expected value here is a
closed form, the period statistics of the scope, or the other solver."""
import json
import math
import shutil
import subprocess
import unittest
from pathlib import Path

import numpy as np

from engine.batch import simulate

CASES = Path(__file__).resolve().parent / 'js' / 'meas_cases.js'


@unittest.skipIf(shutil.which('node') is None, 'Node.js not installed (the cases run web/studio/mna.js).')
class MeasuringBlocks(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        run = subprocess.run(['node', str(CASES)], capture_output=True, text=True, timeout=600)
        if run.returncode:
            raise RuntimeError(run.stderr)
        cls.o = json.loads(run.stdout)

    def table(self, name):
        """{t: {channel: value}} of one case."""
        c = self.o[name]
        return {row[0]: dict(zip((k.split(':', 1)[1] for k in c['keys']), row[1:])) for row in c['at']}

    def test_sine_with_offset(self):
        # v = 50 + 325·sin(2π·50·t). The mean is 50. Between the points of the solver the input is a straight line, so the mean square of
        # the sine part is (A²/2)·(2 + cos(2π/N))/3 with N points per period: the value the block must give, and 2,0e-5 below the RMS of
        # the sine itself at N = 400
        A, off = 325.0, 50.0
        exact = math.sqrt(off * off + A * A / 2)
        errs = {}
        for N in (400, 1600):
            c = self.o['sine%d' % N]
            self.assertEqual(c['warn'], [])
            t = self.table('sine%d' % N)
            line = math.sqrt(off * off + A * A / 2 * (2 + math.cos(2 * math.pi / N)) / 3)
            for tt in (.02, .0275, .04, .0613, .1, .3):
                r = t[tt]
                for k in ('A1', 'A2', 'A3'):
                    self.assertAlmostEqual(r[k], off, delta=1e-9, msg=(N, tt, k))
                for k in ('Q1', 'Q2', 'Q3'):
                    self.assertAlmostEqual(r[k] / line, 1, delta=1e-10, msg=(N, tt, k))
                self.assertAlmostEqual(r['M1'], off - A, delta=1e-9)
                self.assertAlmostEqual(r['M1:max'], off + A, delta=1e-9)
                self.assertAlmostEqual(r['M1:pp'], 2 * A, delta=1e-9)
                self.assertAlmostEqual(r['Q4'] / line if tt >= .04 else r['Q4'] + 1, 1, delta=1e-10, msg=(N, tt))   # two periods per window
            errs[N] = t[.02]['Q1'] / exact - 1
            # before the first window is full: the initial output, or the measure from the start up to now
            r = t[.005]
            self.assertEqual([r['A1'], r['Q1'], r['A2'], r['Q2'], r['Q4'], r['A3']], [0, 0, 0, 0, 0, 7])
            self.assertEqual([r['M1'], r['M1:max'], r['M1:pp']], [0, 0, 0])
            h, n = .02 / N, N // 4
            u = off + A * np.sin(2 * np.pi * 50 * h * np.arange(n + 1))
            grow = math.sqrt(float(np.sum(h * (u[:-1] ** 2 + u[:-1] * u[1:] + u[1:] ** 2) / 3)) / .005)
            self.assertAlmostEqual(r['Q3'] / grow, 1, delta=1e-10)
            # the ring of the running window keeps the points of one window, not of the whole run (15 periods)
            self.assertLess(c['ring'][0], 2.6 * N)
        self.assertAlmostEqual(errs[400], -1.963e-5, delta=2e-8)
        self.assertAlmostEqual(errs[400] / errs[1600], 16, delta=.01)             # second order in the step

    def test_straight_segments_are_exact(self):
        # triangle and sawtooth 0…1: mean 1/2, RMS 1/√3; a clock with duty 0,3: mean 0,3, RMS √0,3 (a jump at every edge). The value before
        # a reset of the sawtooth is read a millionth of a step before it, which is the 2,5e-9 below
        for name in ('shapes', 'shapes_var'):
            self.assertEqual(self.o[name]['warn'], [])
            t = self.table(name)
            for tt in (.001, .00237, .004, .01, .0503):
                r = t[tt]
                self.assertAlmostEqual(r['At'], .5, delta=1e-12, msg=(name, tt))
                self.assertAlmostEqual(r['Qt'], 1 / math.sqrt(3), delta=1e-9)
                self.assertEqual([r['Mt'], r['Mt:max'], r['Mt:pp']], [0, 1, 1])
                self.assertAlmostEqual(r['As'], .5, delta=1e-8)
                self.assertAlmostEqual(r['Qs'], 1 / math.sqrt(3), delta=1e-8)
                self.assertAlmostEqual(r['Aq'], .3, delta=1e-12)
                self.assertAlmostEqual(r['Qq'], math.sqrt(.3), delta=1e-12)
                self.assertAlmostEqual(r['Aq2'], .3, delta=1e-12)
                self.assertAlmostEqual(r['Qc'], 1 / math.sqrt(3), delta=1e-8)                 # the period from the block Ρολόι
                self.assertEqual([r['Mc'], r['Mc:max']], [0, 1])
                self.assertAlmostEqual(r['Q3'], 1 / math.sqrt(3) if tt >= .003 else 0, delta=1e-9)   # three periods per window
            self.assertTrue(all(v == 0 for v in t[.0005].values()))                           # nothing before the first period ends

    def test_running_window_on_a_step(self):
        # the input goes 0 → 1 at 3,3 ms and 1 → 3 at 8 ms. Window of 1 ms: the mean rises along a straight line for one window. With the
        # frequency as an input (1 kHz, 2 kHz from 6 ms) the second rise takes half the time
        t = self.table('step')
        self.assertEqual(self.o['step']['warn'], [])
        want = {.003: (0, 0, 0), .0035: (.2, .2, math.sqrt(.2)), .0038: (.5, .5, math.sqrt(.5)), .0043: (1, 1, 1), .005: (1, 1, 1),
                .0081: (1.2, 1.4, math.sqrt(1.8)), .00825: (1.5, 2, math.sqrt(3)), .0085: (2, 3, math.sqrt(5)), .0091: (3, 3, 3)}
        for tt, (a1, a2, q1) in want.items():
            self.assertAlmostEqual(t[tt]['A1'], a1, delta=1e-11, msg=tt)
            self.assertAlmostEqual(t[tt]['A2'], a2, delta=1e-11, msg=tt)
            self.assertAlmostEqual(t[tt]['Q1'], q1, delta=1e-11, msg=tt)

    def test_per_period_is_the_statistics_of_the_scope(self):
        # the same integrals as recordNow / closePeriod; the scope keeps its period statistics in single precision
        for name in ('scope_fixed', 'scope_var'):
            for r in self.o[name]:
                for k in ('avg', 'rms', 'min', 'max'):
                    blk, scope = r[k]
                    self.assertAlmostEqual(blk, scope, delta=4e-7 * max(1.0, abs(scope)), msg=(name, r['t'], k))

    def test_saved_state(self):
        # a run continued from a saved state gives the numbers of the run that did not stop, bit for bit (the ring is plain data)
        self.assertEqual(self.o['resume']['diff'], 0)

    def test_scipy_gives_the_same(self):
        # engine/batch.py does the same operations at the ends of its segments. A sine has other points per period there, so its RMS differs
        # in the fifth digit; signals of straight segments agree to the value read before a jump
        for name, tol in (('batch_sine', {'Q': 1e-4}), ('batch_shapes', {})):
            q = self.o[name]
            r = simulate({'net': q['net'], 'channels': q['channels'], 't_end': q['at'][-1][0], 'method': 'Radau'})
            self.assertEqual(r['status'], 'ok')
            t = np.array(r['t'])
            for row in q['at']:
                i = int(np.where(t <= row[0] + 1e-12)[0][-1])
                for k, v in zip(q['keys'], row[1:]):
                    d = tol.get(k.split(':')[1][0], 1e-6)
                    self.assertAlmostEqual(r['ch'][k][i], v, delta=d * max(1.0, abs(v)), msg=(name, row[0], k))


if __name__ == '__main__':
    unittest.main()
