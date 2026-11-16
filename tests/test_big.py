"""The solver on large networks and the eigenvectors of the step check (4.19.3, ROADMAP §68): tests/js/big_cases.js.

What stays the same bit for bit, what agrees up to rounding, and what a network of thousands of channels gets: the
eigenvector of a real eigenvalue in real arithmetic (the same bits as the complex code), the eigenvalues kept with the
Hessenberg form (the same bits as eig), the eigenvector from the Hessenberg form (the same up to rounding, a setting), the
phasor start with the sparse LU from 400 unknowns (dense below it, as before), the record buffers sized by memory above
1000 channels (as before below it), and the mesh of the tutorial big_grid from its steady start through a fault."""
import json
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


class BigNetworks(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        out = subprocess.run(['node', str(ROOT / 'tests/js/big_cases.js')], capture_output=True, text=True, timeout=900, check=True)
        cls.r = json.loads(out.stdout)

    def test_eigenvectors_of_the_step_check(self):
        v = self.r['vec']
        self.assertGreater(v['real'], 500)
        self.assertEqual(v['realBad'], 0)            # real arithmetic: the bits of the complex code
        self.assertEqual(v['eigBad'], 0)             # eigKeep: the bits of eig
        self.assertGreater(v['hess'], 200)
        self.assertEqual(v['hessNull'], 0)
        self.assertLess(v['hessWorst'], 1e-9)        # from the Hessenberg form: the same vector up to rounding

    def test_the_setting_changes_no_number(self):
        m = self.r['msgs']
        self.assertEqual(m['ways'], ['lu', 'hess'])
        self.assertTrue(m['sameNumbers'])
        self.assertTrue(m['equal'] and m['notesEqual'])   # a single-phase circuit: the same messages too
        self.assertGreaterEqual(m['n'], 1)

    def test_the_mesh(self):
        g = self.r['grid']
        self.assertEqual((g['n'], g['kind'], g['warnings']), (138, 'sparse', 0))
        self.assertEqual(g['auto'], 'dense')              # 138 unknowns: the start as before
        self.assertEqual(g['forced'], ['dense', 'sparse'])
        self.assertLess(g['startDiff'], 1e-7)             # the sparse start against the dense one, relative to each kind of quantity
        # a steady start: the same peak in the first two periods, close to 1 pu everywhere
        self.assertAlmostEqual(g['vMid'], g['vMid2'], delta=1e-9)
        self.assertTrue(0.95 < g['vMid'] < 1.02 and 0.95 < g['vCorner'] < 1.02, (g['vMid'], g['vCorner']))
        # the fault: kiloamperes through 0,5 Ω, from nothing before it
        self.assertLess(g['iPre'], 1.0)
        self.assertTrue(5e3 < g['iF'] < 2e4, g['iF'])
        self.assertAlmostEqual(g['vF'], 0.5 * g['iF'], delta=1e-6 * g['iF'])

    def test_buffers_and_start_by_size(self):
        g, s = self.r['grid'], self.r['small']
        self.assertEqual((s['cap'], s['perCap'], s['init'], s['memNote']), (20000, 20000, 'dense', ''))   # the circuits of before: unchanged
        self.assertGreater(g['keys'], 1000)
        self.assertGreaterEqual(g['cap'], 20000)
        self.assertEqual(g['memNote'], '')
        self.assertEqual((g['n8'], g['auto8']), (564, 'sparse'))
        self.assertGreater(g['keys8'], 4000)
        self.assertTrue(500 <= g['cap8'] < 20000 and 200 <= g['perCap8'] < 20000)
        self.assertLess(g['mb8'], 200)                    # 20000 points per channel would be 356 MB and five times 356 MB
        self.assertTrue(g['finite8'])


if __name__ == '__main__':
    unittest.main()
