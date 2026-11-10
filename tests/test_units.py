"""Units and vector types of signal ports (3.19, ROADMAP §3, decision 19): web/studio/units.js on its own and through
buildNetlist (the browser solver, pcl and the server use the same netlist)."""
import json
import shutil
import subprocess
import unittest
from pathlib import Path

CASES = Path(__file__).resolve().parent / 'js' / 'units_cases.js'


@unittest.skipIf(shutil.which('node') is None, 'Node.js not installed (the check is web/studio/units.js).')
class Units(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        run = subprocess.run(['node', str(CASES)], capture_output=True, text=True, timeout=300)
        if run.returncode:
            raise RuntimeError(run.stderr)
        cls.R = json.loads(run.stdout)

    def test_types_along_a_chain(self):
        c = self.R['chain']
        self.assertEqual(c['mux'], 'V')                  # three voltmeters: a unit, no frame (a, b, c are only scalars)
        self.assertEqual(c['clarke'], 'V, αβ')
        self.assertEqual(c['park'], 'V, dq')
        self.assertEqual((c['d'], c['q']), ('V, dq d', 'V, dq q'))
        self.assertEqual((c['th'], c['w'], c['int']), ('rad', 'rad/s', 'rad'))   # ∫ω dt = θ
        self.assertEqual(c['gain'], 'V, dq d')           # «=»: the unit of the input
        self.assertEqual(c['sum'], 'V, dq')              # d and q: the frame stays, the component does not
        self.assertEqual((c['errors'], c['warnings']), ([], []))

    def test_frame_into_another_frame_stops_the_solver(self):
        f = self.R['frame']
        self.assertEqual(len(f['errors']), 1)
        self.assertIn('IP.dq', f['errors'][0])
        self.assertIn('αβ', f['errors'][0])
        self.assertEqual(f['build'], f['errors'][0])     # the same message from buildNetlist
        self.assertEqual(f['off'], [])                   # project.solve.units = 'off'
        self.assertTrue(f['offBuilds'])

    def test_components_units_and_strict(self):
        m = self.R['mixed']
        self.assertEqual(len(m['errors']), 1)            # α of Clarke into the q input of inverse Park
        w = ' '.join(m['warnings'])
        for s in ('PK.al', 'PK.be', 'VD.u: περιμένει V, έρχεται A', 'S1: άθροισμα', 'CP: σύγκριση'):
            self.assertIn(s, w)
        self.assertEqual(m['mux'], 'A, dq')              # a Mux declared dq
        self.assertEqual(m['d'], 'A, dq d')
        self.assertEqual(m['k2'], 'V, dq d')             # a gain with a unit of its own (ω·L·i → V)
        self.assertEqual(len(m['strict']), 4)            # 'strict': units are errors too; components stay warnings

    def test_no_tutorial_gets_a_message(self):
        t = self.R['tutorials']
        self.assertGreaterEqual(t['n'], 39)
        self.assertEqual(t['msgs'], [])

    def test_units_for_the_scopes(self):
        s = self.R['scope']
        self.assertEqual((s['int'], s['gn'], s['f'], s['te']), ('rad', 'A, dq q', 'A, dq q', 'N·m'))
        self.assertEqual(s['net'], 'A')                  # buildNetlist keeps the inferred types (net.units)


    def test_unit_algebra(self):
        # 4.0 (question 1 of 3.19): the product and the division multiply units; units are compared by their powers
        a = self.R['alg']
        self.assertEqual((a['va'], a['tw'], a['vv'], a['va2']), ('W', 'W', '1', 'Ω'))
        self.assertEqual((a['pu'], a['vhz'], a['unk'], a['fmt']), ('pu²', 'V/s', None, 'V/(A·s)'))
        self.assertEqual((a['wb'], a['w'], a['va3']), (True, True, False))
        c = a['circ']
        self.assertEqual((c['p'], c['d'], c['vr'], c['vo'], c['tw']), ('W', '1', 'V', '1', 'W'))
        self.assertEqual(c['s'], 'W')                    # τ·ω + v·i: the same unit, no warning
        self.assertEqual(c['errors'], [])
        self.assertEqual(len(c['warnings']), 1)          # only W into the V input of the controlled source
        self.assertIn('VS.u: περιμένει V, έρχεται W', c['warnings'][0])


if __name__ == '__main__':
    unittest.main()
