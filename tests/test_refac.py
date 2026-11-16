"""4.19 (ROADMAP §68, THEORY §8ΣΤ): the refactorization of the sparse LU in the solver of the time domain. The same
numbers as the factorization from scratch, bit for bit: on random matrices (every column, and only the columns on the
factorization path of what changed), on circuits with switchings and on tutorials with machines, nonlinear elements and
switch states (the solution and every channel); it refuses exactly where lu() would choose other pivots; against the dense
LU the difference is rounding. What the engine proposes for a circuit (solverInfo) and the settings solve.solver and
solve.refac. The times are in tests/test_sparse.py (one refactorization against one factorization)."""
import json
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


class Refactorization(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        out = subprocess.run(['node', str(ROOT / 'tests/js/refac_cases.js')], capture_output=True, text=True, timeout=1200, check=True)
        cls.r = json.loads(out.stdout)

    def test_random_matrices_bit_for_bit(self):
        r = self.r['rand']
        self.assertEqual(r['bad'], [])
        self.assertGreater(r['cases'], 800)
        self.assertGreater(r['refused'], 100)      # strong changes move the pivots: refused, never a wrong factor
        self.assertGreater(r['partial'], 500)
        self.assertLess(r['frac'], 0.9)            # the path of a few columns is not the whole matrix

    def test_circuit_with_switchings(self):
        c = self.r['circ']
        self.assertTrue(c['fullSame'] and c['partSame'])
        self.assertEqual(c['rf'], ['off', 'full', 'partial'])
        self.assertEqual(c['off']['fact'], c['part']['fact'])            # the same switch states, the same cache
        self.assertEqual(c['off']['re'], 0)
        self.assertEqual(c['off']['full'], c['off']['fact'])
        self.assertEqual(c['part']['full'], 1)                            # one factorization from scratch, then refactorizations
        self.assertGreater(c['part']['re'], 10)
        # (a switching comes with steps of another length or rule, which change the stamp of every L and C: here every
        # column is computed again; the partial refactorization pays where few columns change, see the tutorials below)
        self.assertLessEqual(c['part']['cols'], c['part']['re'] * c['n'])
        self.assertEqual(c['full']['cols'], c['full']['re'] * c['n'])

    def test_tutorials_bit_for_bit(self):
        for name, t in self.r['tut'].items():
            self.assertTrue(t['same'], name)                               # from scratch against the default: every channel
            self.assertEqual(t['kind'], 'sparse', name)
            self.assertEqual(t['refac'], 'partial', name)
            self.assertGreater(t['st']['re'], 0, name)
            self.assertLess(t['st']['full'], 0.2 * t['st']['fact'] + 2, name)
            self.assertEqual(t['stOff']['re'], 0, name)

    def test_against_the_dense_lu(self):
        for name in ('ieee9_emt', 'lightning_gis', 'gen_ctl', 'pmsm', 'srm'):
            self.assertLess(self.r['tut'][name]['relDense'], 1e-6, name)   # rounding (the MMC with sorting is sensitive: not here)

    def test_matrix_that_changes_every_step_goes_sparse(self):
        t = self.r['tut']
        for name in ('ieee9_emt', 'lightning_gis', 'gen_ctl'):          # 54–96 unknowns, a machine or a nonlinear element
            self.assertTrue(t[name]['everyStep'] and t[name]['asProposed'], name)
            self.assertLess(t[name]['n'], 120)
            self.assertLess(t[name]['st']['cols'], 0.5 * t[name]['st']['re'] * t[name]['n'], name)
        self.assertFalse(t['pmsm']['asProposed'])                         # 14 unknowns: the proposal is the dense LU

    def test_proposal_of_the_engine_and_settings(self):
        i = self.r['info']
        self.assertEqual((i['buck']['kind'], i['buck']['prop'], i['buck']['asProposed']), ('dense', 'dense', True))
        self.assertEqual((i['buckSparse']['kind'], i['buckSparse']['refac'], i['buckSparse']['asProposed']), ('sparse', 'full', False))
        self.assertEqual(i['buckSparse']['ask'], ['sparse', 'full'])
        self.assertEqual((i['ieee9']['kind'], i['ieee9']['refac'], i['ieee9']['prop']), ('sparse', 'partial', 'sparse'))
        self.assertIn('μηχανές', i['ieee9']['text'])
        self.assertEqual((i['ieee9Dense']['kind'], i['ieee9Dense']['asProposed']), ('dense', False))
        self.assertEqual((i['mmc']['kind'], i['mmc']['everyStep']), ('sparse', False))
        self.assertGreaterEqual(i['mmc']['blocks'], 2)                   # the cables separate the two stations
        self.assertEqual((i['cable']['kind'], i['cable']['prop']), ('dense', 'dense'))   # 70 unknowns, the factors are kept per switch state


if __name__ == '__main__':
    unittest.main()
