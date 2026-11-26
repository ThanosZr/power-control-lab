"""The tests in parallel (5.0.8, decision 379, tools/test_shards.py and tools/ui_flows.py): the share of the test files
over the shards (each file once, fixed, a new file does not move the others), the check of the reports of the shards
(a missing shard, a file twice or nowhere, a test that did not run, a failure, a different outcome from the serial
run), the reading of the -v output of unittest, and the lists of the CI against the tools."""
import json
import re
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'tools'))
import test_shards as ts     # noqa: E402
import ui_flows as uf        # noqa: E402

CI = (ROOT / '.github' / 'workflows' / 'ci.yml').read_text(encoding='utf-8')


def rep(i, n, files, run=None, outcomes=None, **k):
    outs = outcomes if outcomes is not None else {f'{f}.C.test_a': 'ok' for f in files}
    r = {'format': ts.FORMAT, 'version': 1, 'shard': i, 'of': n, 'files': files, 'loaded': len(outs),
         'loader_errors': 0, 'run': len(outs) if run is None else run, 'failures': [], 'errors': [], 'skipped': 0,
         'expected_failures': 0, 'unexpected_successes': [], 'outcomes': outs, 'seconds': 1.0, 'file_seconds': {}}
    r.update(k)
    return r


class Share(unittest.TestCase):
    times = {'a': 50.0, 'b': 40.0, 'c': 30.0, 'd': 20.0, 'e': 10.0, 'f': 10.0}

    def test_each_file_once_and_in_name_order(self):
        files = sorted(self.times) + ['g', 'h']
        for n in (1, 2, 3, 6, 9):
            shards, est = ts.share(files, self.times, n)
            self.assertEqual(len(shards), n)
            flat = [f for s in shards for f in s]
            self.assertEqual(sorted(flat), files)
            self.assertEqual(len(flat), len(set(flat)))
            self.assertTrue(all(s == sorted(s) for s in shards))
            self.assertEqual(len(est), n)

    def test_largest_first_to_the_least_loaded(self):
        shards, est = ts.share(sorted(self.times), self.times, 2)
        self.assertEqual(shards, [['a', 'd', 'e'], ['b', 'c', 'f']])     # 50+20+10, 40+30+10 (e: the tie to shard 1)
        self.assertEqual(est, [80.0, 80.0])
        self.assertEqual(ts.share(['x'], {}, 3)[0], [['x'], [], []])

    def test_a_new_file_or_a_removed_file_does_not_move_the_others(self):
        base = ts.share(sorted(self.times), self.times, 3)[0]
        where = {f: k for k, s in enumerate(base) for f in s}
        more = ts.share(sorted(self.times) + ['zz', 'aa_new'], self.times, 3)[0]
        less = ts.share([f for f in sorted(self.times) if f != 'b'], self.times, 3)[0]
        for sh in (more, less):
            got = {f: k for k, s in enumerate(sh) for f in s}
            self.assertTrue(all(got[f] == where[f] for f in got if f in where))
        self.assertNotIn('b', [f for s in less for f in s])
        self.assertEqual(ts.share(sorted(self.times), self.times, 3), ts.share(sorted(self.times), dict(self.times), 3))

    def test_the_table_of_the_repo(self):
        times = ts.load_times()
        self.assertGreater(len(times), 50)
        self.assertTrue(all(v >= 0 for v in times.values()))
        shards, est = ts.share(ts.test_files(), times, ts.SHARDS)
        self.assertEqual(sorted(f for s in shards for f in s), ts.test_files())
        self.assertIn('test_parallel', ts.test_files())
        self.assertLess(max(est) - min(est), 0.25 * max(est))      # the shards within a quarter of each other
        self.assertEqual(ts.test_files(), sorted(p.stem for p in (ROOT / 'tests').glob('test*.py')))


class Check(unittest.TestCase):
    def good(self):
        return [rep(1, 2, ['test_a', 'test_c']), rep(2, 2, ['test_b'])]

    def probs(self, reps, **k):
        k.setdefault('files', ['test_a', 'test_b', 'test_c'])
        import io
        return ts.check(reps, count=False, out=io.StringIO(), **k)

    def test_a_good_set(self):
        self.assertEqual(self.probs(self.good()), [])

    def test_every_kind_of_problem(self):
        r = self.good()
        self.assertTrue(any('expected 1..2' in p for p in self.probs(r[:1])))
        self.assertTrue(any('test_b in no shard' in p for p in self.probs(r[:1])))
        twice = [rep(1, 2, ['test_a', 'test_c']), rep(2, 2, ['test_b', 'test_a'])]
        self.assertTrue(any('test_a in shards 1 and 2' in p for p in self.probs(twice)))
        self.assertTrue(any('not a test file' in p for p in self.probs(self.good(), files=['test_a', 'test_b'])))
        short = [rep(1, 2, ['test_a', 'test_c'], run=1), rep(2, 2, ['test_b'])]
        self.assertTrue(any('1 ran of 2 loaded' in p for p in self.probs(short)))
        failed = [rep(1, 2, ['test_a', 'test_c'], failures=['test_a.C.test_a']), rep(2, 2, ['test_b'], errors=['x'])]
        self.assertEqual(len(self.probs(failed)), 2)
        mixed = [rep(1, 3, ['test_a', 'test_c']), rep(2, 2, ['test_b'])]
        self.assertTrue(any('different shares' in p for p in self.probs(mixed)))
        self.assertEqual(self.probs([{'format': 'other'}]), ['no report of a shard'])

    def test_against_the_serial_run(self):
        serial = ('test_a (test_a.C.test_a) ... ok\n'
                  'test_a (test_b.C.test_a)\nThe first line of a docstring ... ok\n'
                  'test_a (test_c.C.test_a) ... ok\n\n'
                  '----------------------------------------------------------------------\nRan 3 tests in 1.0s\n\nOK\n')
        self.assertEqual(self.probs(self.good(), serial=serial), [])
        skip = serial.replace('test_a (test_c.C.test_a) ... ok', "test_a (test_c.C.test_a) ... skipped 'no Octave'")
        self.assertEqual(self.probs(self.good(), serial=skip), ['test_c.C.test_a: serial skip, shards ok'])
        fewer = serial.replace('test_a (test_c.C.test_a) ... ok\n', '').replace('Ran 3', 'Ran 2')
        p = self.probs(self.good(), serial=fewer)
        self.assertIn('serial: Ran 2, shards: 3', p)
        self.assertIn('shards only: test_c.C.test_a', p)


class Verbose(unittest.TestCase):
    def test_outcomes_of_the_verbose_output(self):
        text = ("test_x (test_m.A.test_x) ... ok\n"
                "test_y (test_m.A.test_y)\nIts docstring ... FAIL\n"
                "test_z (test_m.A.test_z) ... a line that the test prints\nok\n"
                "test_s (test_m.B.test_s) ... skipped 'pandas'\n"
                "test_e (test_m.B.test_e) ... ERROR\n"
                "test_f (test_m.B.test_f) ... expected failure\n"
                "test_u (test_m.B.test_u) ... unexpected success\n")
        self.assertEqual(ts.parse_verbose(text), {
            'test_m.A.test_x': 'ok', 'test_m.A.test_y': 'fail', 'test_m.A.test_z': 'ok', 'test_m.B.test_s': 'skip',
            'test_m.B.test_e': 'error', 'test_m.B.test_f': 'xfail', 'test_m.B.test_u': 'xpass'})

    def test_times_from_a_log_with_timestamps(self):
        log = ('2026-11-22T06:54:12.000000Z ##[group]Run python -m unittest discover -s tests -v\n'
               '2026-11-22T06:54:14.000000Z test_x (test_m.A.test_x) ... ok\n'
               '2026-11-22T06:54:20.000000Z test_y (test_n.A.test_y) ... ok\n'
               '2026-11-22T06:54:21.500000Z test_z (test_n.A.test_z) ... ok\n'
               '2026-11-22T06:54:22.000000Z Ran 3 tests in 10.0s\n')
        self.assertEqual(ts.times_from_log(log), {'test_m': 2.0, 'test_n': 7.5})


class Lists(unittest.TestCase):
    def test_the_ci_runs_the_shards_of_the_tool(self):
        m = re.search(r'shard: \[([\d, ]+)\]', CI)
        self.assertEqual([int(x) for x in m.group(1).split(',')], list(range(1, ts.SHARDS + 1)))
        self.assertIn('tools/test_shards.py run ${{ matrix.shard }}/${{ strategy.job-total }}', CI)
        self.assertIn(f'tools/test_shards.py check reports/shard-*.json --n {ts.SHARDS}', CI)
        self.assertIn(f'list --n {ts.SHARDS}', CI)
        for job in ('verify', 'octave', 'ui', 'tests', 'exe'):    # right after the quick checks, not after all the tests
            self.assertRegex(CI, rf'\n  {job}:\n(?:    .*\n)*?    needs: checks\n')
        self.assertIn('needs: [all-tests, verify, ui, octave, exe]', CI)        # 5.1.3: and the executables

    def test_every_scenario_is_in_the_list(self):
        self.assertEqual(sorted(uf.FLOWS), sorted(p.stem for p in (ROOT / 'tests' / 'ui').glob('*.js')))
        self.assertEqual(len(uf.FLOWS), len(set(uf.FLOWS)))
        self.assertTrue(set(uf.TIMED) <= set(uf.FLOWS))
        self.assertIn('tools/ui_flows.py --url http://127.0.0.1:8765/ --out ui-out', CI)

    def test_lanes(self):
        lanes, timed = uf.lanes_of(uf.FLOWS, 2)
        self.assertEqual(timed, [f for f in uf.FLOWS if f in uf.TIMED])
        self.assertEqual(sorted(lanes[0] + lanes[1] + timed), sorted(uf.FLOWS))
        self.assertFalse(set(lanes[0] + lanes[1]) & set(uf.TIMED))
        self.assertEqual(uf.lanes_of(uf.FLOWS, 1), ([uf.FLOWS], []))   # the CI: one lane, in the order of the list


if __name__ == '__main__':
    unittest.main()
