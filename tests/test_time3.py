"""The solver in time, part 3 (4.23, THEORY §8Ι.5): tests/js/time3_cases.js and tools/kernels/build.js.

Three changes of the time to compute, none of the numbers: the record of the watched channels only (opts.watch,
solve.rec = 'watched'), the base of a partial refactorization from the memory of factors (solve.refBase), and the forward
and back substitution in WebAssembly (solve.kernel). Each is checked bit for bit against the way of 4.22."""
import json
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


class TimePart3(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        out = subprocess.run(['node', '--max-old-space-size=6000', str(ROOT / 'tests/js/time3_cases.js')],
                             capture_output=True, text=True, timeout=1200, check=True)
        cls.r = json.loads(out.stdout)

    def test_the_watched_record_has_the_same_bits(self):
        rows = self.r['watch']['rows']
        self.assertEqual(len(rows), 6)
        for w in rows:
            self.assertEqual((w['ringBad'], w['perBad'], w['nowBad']), (0, 0, 0), w['id'])
            self.assertEqual(w['nch'], w['rec'])            # only the watched channels in the buffers
            self.assertLess(w['rec'], w['keys'])
            self.assertTrue(w['samePerN'] and w['hasKey'], w['id'])
            self.assertGreater(w['ringN'], 1000)

    def test_a_channel_added_while_running(self):
        a = self.r['watch']['add']
        self.assertEqual(len(a['added']), 1)
        self.assertEqual(a['before'], a['nOld'])           # NaN before it was added
        self.assertGreater(a['after'], 500)
        self.assertEqual((a['afterBad'], a['keptBad']), (0, 0))

    def test_the_base_from_the_memory(self):
        rows = {b['id']: b for b in self.r['base']}
        for b in rows.values():
            self.assertTrue(b['same'], b['id'])             # the same bits whichever the base
            self.assertLessEqual(b['cols'][1], b['cols'][0], b['id'])
            self.assertLessEqual(b['full'][1], b['full'][0], b['id'])
        self.assertLess(rows['hvdc_lcc']['cols'][1], 0.5 * rows['hvdc_lcc']['cols'][0])
        self.assertLess(rows['b4dcs2']['cols'][1], 0.6 * rows['b4dcs2']['cols'][0])
        self.assertGreater(rows['hvdc_lcc']['base'], 100)

    def test_the_webassembly_kernel(self):
        k = self.r['kernel']
        self.assertTrue(k['avail'])
        self.assertEqual((k['systems'], k['bad']), (16, 0))
        for r in k['rows']:
            self.assertTrue(r['same'], r['id'])
            self.assertEqual(r['kernel'], ['js', 'wasm'])
        self.assertEqual(k['auto'], [138, 'js', 2361, 'js', 5373, 'wasm'])   # «Αυτόματα»: from 4000 unknowns (measured)

    def test_the_kernel_is_built_from_its_source(self):
        out = subprocess.run(['node', str(ROOT / 'tools/kernels/build.js'), '--check'], capture_output=True, text=True, timeout=120)
        self.assertEqual(out.returncode, 0, out.stdout + out.stderr)
        self.assertTrue(json.loads(out.stdout)['ok'])


if __name__ == '__main__':
    unittest.main()
