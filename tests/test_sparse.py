"""Sparse LU of the browser solver (4.2, ROADMAP §32): the same results as the dense LU (every node voltage and branch
current after thousands of steps with switchings), the automatic choice (dense below 120 unknowns, so no tutorial
changes), and the measurement: one factorization of a 1000-unknown circuit several times faster than the dense one
(the CI catches a regression). The reference is the dense LU, which every other test verifies against theory."""
import json
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


class SparseLU(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        out = subprocess.run(['node', str(ROOT / 'tests/js/sparse_cases.js'), 'quick'], capture_output=True, text=True, timeout=900, check=True)
        cls.r = json.loads(out.stdout)

    def test_same_numbers_as_the_dense_lu(self):
        for name, v in self.r['same'].items():
            self.assertLess(v['rel'], 1e-9, name)
            self.assertEqual(v['factD'], v['factS'], name)           # the same factorizations (switch states)

    def test_automatic_choice(self):
        self.assertTrue(self.r['same']['ladder200_sw']['autoSparse'])
        self.assertTrue(self.r['same']['three60_sw']['autoSparse'])
        self.assertFalse(self.r['same']['ladder50']['autoSparse'])  # 102 unknowns: dense, as before

    def test_measurement(self):
        big = [b for b in self.r['bench'] if b['n'] >= 900 and 'dense' in b]
        self.assertTrue(big)
        for b in big:
            self.assertLess(b['sparse']['msFactor'] * 3, b['dense']['msFactor'], b)
            self.assertLess(b['sparse']['nnzLU'], 6 * b['n'], b)        # ladders and chains: almost no fill-in

    def test_refactorization(self):
        # 4.19 (§68): the factors again with the same pivots, without the search of the pattern: the same numbers bit for
        # bit, several times faster than a factorization from scratch (measured ~9 times at 1000 unknowns)
        # The same numbers from 200 unknowns; the time only from 1000 (a ratio of two paths on a large matrix: under some
        # tens of microseconds per call the state of the JIT and the clock decide, not the algorithm)
        rows = [b for b in self.r['bench'] if b['n'] >= 200]
        self.assertTrue(rows)
        for b in rows:
            self.assertTrue(b['sparse']['reSame'], b)
        big = [b for b in rows if b['n'] >= 1000]
        self.assertTrue(big)
        for b in big:
            self.assertLess(b['sparse']['msRefactor'] * 3, b['sparse']['msFactor'], b)


if __name__ == '__main__':
    unittest.main()
