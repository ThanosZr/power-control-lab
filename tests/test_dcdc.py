"""4.21 (ROADMAP §87): the DC/DC converter as one element in EMT (web/studio/netlib.js dcdcDef: the averaged model of Jovcic 2019,
§30.3.3, Fig. 30.7, lossless) in its tutorial dcdc_ex303 (Example 30.3, printed p. 470–471): every combination of the options ends
on the DC load flow of pcl.dcgrid with the converter as one element (DCGrid.dcdc), before and after the event; the browser solver
against SciPy (engine/batch.py) on the same netlist; the card's numbers in its tasks. The data are the example's; the rest is ours."""
import json
import shutil
import subprocess
import unittest
from pathlib import Path

from pcl import dcgrid as D
from tests.test_gfm3 import scipy_dif

ROOT = Path(__file__).resolve().parents[1]
kV, MW = 1e3, 1e6


def steady(ctl, Eb):
    """The DC load flow of the example: 370 kV behind 1 Ω on side a, E_b behind 2 Ω on side b, the converter as one element."""
    g = D.DCGrid()
    for b, u in (('S2', 400), ('B2', 400), ('B1', 370), ('S1', 370)):
        g.bus(b, u * kV)
    g.line('S2', 'B2', R=2, poles=1)
    g.line('B1', 'S1', R=1, poles=1)
    g.converter('S2', 'V', V=Eb / (400 * kV), name='G2')
    g.converter('S1', 'V', V=1.0, name='G1')
    if ctl == 'V':
        g.dcdc('B1', 'B2', 'V', V=397 / 400, name='DD')
    elif ctl == 'P':
        g.dcdc('B1', 'B2', 'P', P=-595.5 * MW, name='DD')
    else:
        g.dcdc('B1', 'B2', 'droop', P=-595.5 * MW, V=397 / 400, R=2e5, name='DD')
    d = g.flow(tol=1e-13)['dcdc']['DD']
    return d['P'] / MW, d['Ua'] / kV, d['Ub'] / kV


@unittest.skipUnless(shutil.which('node'), 'node not installed')
class Tutorial(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        out = subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'dcdc_cases.js')], capture_output=True, text=True, timeout=1800, cwd=ROOT)
        if out.returncode:
            raise RuntimeError(out.stderr[-2000:])
        cls.js = json.loads(out.stdout)

    def test_every_option_ends_on_the_load_flow(self):
        # measured: 1.2e-4 MW and 2e-6 kV at the worst (the PI of 'V' after its 0.6 s)
        self.assertEqual(len(self.js['runs']), 6)
        for r in self.js['runs']:
            self.assertEqual(r['warn'], [], r['ctl'])
            self.assertEqual(r['keys'], r['panes'], r['ctl'])                       # every trace of the scope is a channel
            for row, Eb in zip(r['rows'], (400 * kV, 395 * kV if r['ev'] == 'drop' else 400 * kV)):
                P, ua, ub = steady(r['ctl'], Eb)
                v = row['v']
                self.assertAlmostEqual(v[0], P, delta=1e-3, msg=(r['ctl'], r['ev'], row['t']))
                self.assertAlmostEqual(v[1], ua, delta=1e-4, msg=(r['ctl'], r['ev'], row['t']))
                self.assertAlmostEqual(v[2], ub, delta=1e-4, msg=(r['ctl'], r['ev'], row['t']))
                self.assertAlmostEqual(v[0] * MW, v[1] * kV * v[3], delta=1e-3 * abs(v[0] * MW) + 1.0)      # P = v_a·i_a …
                self.assertAlmostEqual(v[0] * MW, v[2] * kV * v[4], delta=1e-3 * abs(v[0] * MW) + 1.0)      # … = v_b·i_b (lossless)

    def test_the_example(self):
        # Example 30.3: 1.5 kA and 595.5 MW towards the 370 kV grid; after the drop to 395 kV, 1 kA and 397 MW into grid 2
        r = next(q for q in self.js['runs'] if q['ctl'] == 'V' and q['ev'] == 'drop')
        before, after = r['rows']
        self.assertAlmostEqual(before['v'][4], -1500.0, delta=0.01)
        self.assertAlmostEqual(after['v'][4], 1000.0, delta=0.01)
        self.assertAlmostEqual(after['v'][0], 397.0, delta=1e-3)
        self.assertEqual(steady('droop', 395 * kV)[0].__round__(1), -97.1)
        self.assertEqual(round(steady('P', 395 * kV)[2], 2), 391.96)

    def test_card(self):
        card = self.js['card']
        self.assertEqual([q['k'] for q in card['options']], ['ctl', 'ev'])
        text = ' '.join(card['tasks'])
        for s in ('1,5 kA', '595,5 MW', '371,6 kV', '1 kA, 397 MW', '391,96 kV', '97,1 MW', '394,51 kV', 'g.dcdc('):
            self.assertIn(s, text)

    def test_scipy(self):
        # the same netlist in SciPy (BDF): the first 0.15 s of the start, where every loop moves. The difference is of first order
        # in the step (the blocks see the network one step late): measured 14.0 MW, 108 V, 27.4 A with h = 50 µs and 1.82 MW,
        # 14.5 V, 3.7 A with h = 5 µs; below 0.5 % of the size of each channel at 5 µs, and at least 5 times smaller than at 50 µs
        def dif(h):
            o = json.loads(subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'gfm_cases.js'),
                                           json.dumps([{'kind': 'scipyTut', 'id': 'dcdc_ex303', 'opts': {'ctl': 'V', 'ev': 'none'}, 'T': 0.15, 'hDiv': h,
                                                        'keys': ['Y:DD/PS', 'Y:DD/VB', 'Y:DD/IA']}])],
                                          capture_output=True, text=True, timeout=900, cwd=ROOT).stdout)
            self.assertNotIn('error', o[0], o[0].get('error'))
            self.assertEqual(o[0]['warn'], [])
            return scipy_dif(o, ('BDF', 1e-8, 1e-6))[0]
        coarse, fine = dif(400), dif(4000)
        for c, f, size in zip(coarse, fine, (600e6, 400e3, 1600.0)):
            self.assertLess(f, 5e-3 * size)
            self.assertLess(5 * f, c)

if __name__ == '__main__':
    unittest.main()
