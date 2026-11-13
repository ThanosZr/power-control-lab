"""Lightning on a 400 kV line next to a GIS substation (4.9, ROADMAP §51): the IEEE arrester model (SAI) against the
example of the parameter-determination book, the footing R(I) of the tower (TOWER) against its formula, and the
scenarios of the tutorial lightning_gis (backflashover, shielding failure, arresters, open and closed breaker)."""
import json
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LIWL, KS = 1425e3, 1.15


def cases(c):
    out = subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'lightning_cases.js'), json.dumps(c)], capture_output=True,
                         text=True, check=True, timeout=900, cwd=ROOT).stdout
    return json.loads(out)


class Arrester(unittest.TestCase):
    def test_switching_surge(self):
        # initial parameters of the IEEE model for d = 3.216 m, U10 = 819 kV: the book gets 751.1 kV with a 3 kA 30/60 μs
        # double ramp; here a Heidler 30/60 μs of the same peak (the voltage follows the current, the shape matters little)
        r = cases([{'arr': {'I': 3000, 'T1': 30e-6, 'T2': 60e-6}}])[0]
        self.assertAlmostEqual(r['i'], 3000, delta=30)
        self.assertLess(abs(r['v'] / 751.1e3 - 1), 0.02, r['v'])

    def test_lightning_residual(self):
        # 10 kA 8/20 μs with the initial L1: a little above U10 (the IEEE procedure then lowers L1 to match U10)
        r = cases([{'arr': {'I': 10e3, 'T1': 8e-6, 'T2': 20e-6}}])[0]
        self.assertGreater(r['v'], 819e3)
        self.assertLess(r['v'], 1.05 * 819e3)


class Footing(unittest.TestCase):
    def test_table_against_formula(self):
        js = ("global.window=globalThis;const P=require('./web/studio/parts.js');global.Parts=P;const N=require('./web/studio/netlib.js');"
              "const f=N.footTable(15,100,400e3),c=P.movChar({model:'table',tbl:f.tbl});let e=0;"
              "for(let x=0;x<=5.5;x+=0.0731){const I=10**x,v=I*15/Math.sqrt(1+I/f.Ig);e=Math.max(e,Math.abs(c.inv(I)/v-1));}"
              "console.log(JSON.stringify({e,Ig:f.Ig}))")
        r = json.loads(subprocess.run(['node', '-e', js], capture_output=True, text=True, check=True, cwd=ROOT).stdout)
        self.assertAlmostEqual(r['Ig'], 400e3 * 100 / (2 * 3.141592653589793 * 225), delta=1)    # I_g = E0·ρ/(2π·R0²)
        self.assertLess(r['e'], 0.01)


class Tutorial(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.r = cases([{}, {'foot': 'r50', 'I': '100'}, {'strike': 'phase', 'I': '20'}, {'strike': 'phase', 'I': '20', 'sa': 'none'},
                       {'strike': 'phase', 'I': '20', 'cb': 'closed', 'sa': 'entry'}])

    def test_no_backflashover_with_ionized_footing(self):
        r = self.r[0]
        self.assertEqual(r['flash'], {})
        self.assertGreater(r['peak']['Y:T2/Vtop'], 1.5e6)
        self.assertLess(max(r['peak']['Y:VG' + x] for x in 'abc'), 100e3)

    def test_backflashover_with_poor_footing(self):
        r = self.r[1]
        self.assertIn('T2a', r['flash'])
        self.assertIn('T2c', r['flash'])
        self.assertLess(max(r['peak']['Y:VG' + x] for x in 'abc'), LIWL)

    def test_shielding_failure(self):
        r = self.r[2]
        self.assertEqual(list(r['flash']), ['T2a'])
        self.assertLess(r['peak']['Y:VEa'], 1.1e6)                       # the arrester at the entrance limits it
        self.assertGreater(r['peak']['Y:VGa'], r['peak']['Y:VEa'])       # the open end of the GIS doubles what passes

    def test_without_arresters_above_the_withstand(self):
        self.assertGreater(self.r[3]['peak']['Y:VGa'], LIWL)

    def test_closed_breaker_needs_the_second_arrester(self):
        self.assertGreater(self.r[4]['peak']['Y:VTa'], LIWL / KS)
        self.assertLess(self.r[2]['peak']['Y:VTa'], 10e3)                # open breaker: nothing reaches the transformer


if __name__ == '__main__':
    unittest.main()
