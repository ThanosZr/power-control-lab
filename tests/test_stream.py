"""Results in chunks and runs that continue from a saved state (3.16, ROADMAP §41.1): p.stream, run(save_state, resume),
sweeps written point by point and continued, the command line, and the solver's state through JSON for every tutorial."""
import csv
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
import pcl  # noqa: E402

HAS_NODE = shutil.which('node') is not None
HAS_PYODIDE = (ROOT / 'node_modules' / 'pyodide').is_dir()


@unittest.skipIf(not HAS_NODE, 'Node.js not installed (the browser solver runs in Node).')
class Stream(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = Path(tempfile.mkdtemp())
        cls.p = pcl.tutorial('buck')
        cls.T = cls.p.channels()['T']
        cls.full = cls.p.run(t_end=40 * cls.T, channels=['V:C1', 'I:L1'])

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(cls.tmp, ignore_errors=True)

    def test_chunks_are_one_run(self):
        st, out = self.tmp / 'a.state', self.tmp / 'a.csv'
        parts = list(self.p.stream(t_end=40 * self.T, chunk=7 * self.T, channels=['V:C1', 'I:L1'], state=st, to=out, measure={'Vo': ('V:C1', 'avg', 5)}))
        self.assertEqual(len(parts), 6)                                           # 7, 14, … 35, 40 periods
        self.assertEqual([round(c.meta['t1'] / self.T) for c in parts], [7, 14, 21, 28, 35, 40])
        t = [x for c in parts for x in c.t]
        self.assertEqual(t, self.full.t)                                          # the same points
        for k in ('V:C1', 'I:L1'):
            self.assertEqual([x for c in parts for x in c.ch[k]], self.full.ch[k])   # and the same numbers
        self.assertTrue(parts[-1].diag is not None and 'warnings' in parts[-1].meta)
        self.assertIn('Vo', parts[0].measured)
        rows = [r for r in csv.reader(ln for ln in out.read_text(encoding='utf-8').splitlines() if not ln.startswith('#'))]
        self.assertEqual(rows[0], ['t [s]', 'V:C1 [V]', 'I:L1 [A]'])
        self.assertEqual(len(rows) - 1, len(self.full.t))
        self.assertEqual(float(rows[-1][1]), self.full.ch['V:C1'][-1])
        s = pcl.core.read_state(st)
        self.assertAlmostEqual(s['t'], 40 * self.T, delta=1e-12)
        self.assertEqual(pcl.load(st).hash(), self.p.hash())                     # pcl.load reads the project of a state

    def test_resume_is_the_same_run(self):
        st = self.tmp / 'h.state'
        half = self.p.run(t_end=20 * self.T, channels=['V:C1', 'I:L1'], save_state=st)
        self.assertEqual(half.t, self.full.t[:len(half.t)])
        r = self.p.run(t_end=40 * self.T, resume=st)                                    # channels from the state
        self.assertEqual(r.keys, ['V:C1', 'I:L1'])
        self.assertEqual(r.t, self.full.t[len(half.t):])
        self.assertEqual(r.ch['I:L1'], self.full.ch['I:L1'][len(half.t):])
        with self.assertRaises(pcl.PclError):
            self.p.run(t_end=10 * self.T, resume=st)                                    # the end time is before the state
        with self.assertRaises(pcl.PclError):
            self.p.run(t_end=10 * self.T, solver='scipy', save_state=st)

    def test_resume_with_a_change_keeps_the_states(self):
        st = self.tmp / 'c.state'
        self.p.run(t_end=20 * self.T, channels=['I:L1'], save_state=st)
        q = self.p.copy().set('R1.R', 2.5)                                             # a parameter changed, as while running
        r = q.run(t_end=21 * self.T, resume=st)
        self.assertAlmostEqual(r['I:L1'][0], self.full.ch['I:L1'][len([x for x in self.full.t if x <= 20 * self.T * (1 + 1e-12)])], delta=0.05)
        self.assertNotEqual(r['I:L1'][-1], self.full.ch['I:L1'][len([x for x in self.full.t if x <= 21 * self.T * (1 + 1e-12)]) - 1])

    def test_set_in_a_stream(self):
        q = pcl.tutorial('blocks_loop')
        ks = [c['id'] for c in q.data['components'] if c['type'] == 'CONST']
        if not ks:
            self.skipTest('no constant block')
        a = list(q.stream(t_end=10 * q.channels()['T'], chunk='all', set={ks[0]: 0}))
        self.assertTrue(a)

    def test_sweep_to_file_and_resume(self):
        f = self.tmp / 'sw.csv'
        grid = {'L1.L': ['22u', '47u', '100u', '220u']}
        m = {'dI': ('I:L1', 'pp', 5)}
        full = self.p.sweep(grid, t_end='2m', measure=m, workers=2, to=f)
        self.assertEqual([round(r['dI'], 9) for r in pcl.core._SweepFile(f, ['L1.L'], ['dI'], 4, True).done.values()],
                         [round(r['dI'], 9) for r in full.rows])
        f.write_text('point,L1.L,dI,error\n1,4.7e-05,%r,\n3,0.00022,%r,\n' % (full.rows[1]['dI'], full.rows[3]['dI']), encoding='utf-8')
        calls = []
        again = self.p.sweep(grid, t_end='2m', measure=m, workers=1, to=f, resume=True, progress=lambda i, n: calls.append(i))
        self.assertEqual(calls, [3, 4])                                                 # only the two missing points ran
        self.assertEqual([r['dI'] for r in again.rows], [r['dI'] for r in full.rows])
        pq = self.tmp / 'sw.parquet'
        self.p.sweep(grid, t_end='2m', measure=m, workers=2, to=pq)
        self.assertTrue(pq.is_file() and not Path(str(pq) + '.part.csv').exists())

    def test_command_line(self):
        st, out = self.tmp / 'cli.state', self.tmp / 'cli.csv'
        cmd = [sys.executable, '-m', 'pcl', 'run', 'tutorial:buck', '--channels', 'V:C1']
        r = subprocess.run(cmd + ['--t-end', str(20 * self.T), '--chunk', str(10 * self.T), '--state', str(st), '--out', str(out)],
                           capture_output=True, text=True, cwd=str(ROOT))
        self.assertEqual(r.returncode, 0, r.stderr)
        r = subprocess.run(cmd[:5] + ['--t-end', str(40 * self.T), '--resume', str(st), '--out', str(self.tmp / 'more.json')],
                           capture_output=True, text=True, cwd=str(ROOT))
        self.assertEqual(r.returncode, 0, r.stderr)
        d = json.loads((self.tmp / 'more.json').read_text(encoding='utf-8'))
        n = len([x for x in self.full.t if x <= 20 * self.T * (1 + 1e-12)])
        self.assertEqual(d['ch']['V:C1'], self.full.ch['V:C1'][n:])

    def test_job_with_state(self):
        st = self.tmp / 'job.state'
        a = pcl.job({'tutorial': 'buck', 'run': {'t_end': 20 * self.T, 'channels': ['V:C1'], 'save_state': str(st)}})
        b = pcl.job({'tutorial': 'buck', 'run': {'t_end': 40 * self.T, 'resume': str(st)}})
        self.assertEqual(a['t'] + b['t'], self.full.t)
        with self.assertRaises(pcl.PclError):  # the server's scenario_run takes no paths (allow_paths=False)
            pcl.job({'tutorial': 'buck', 'run': {'t_end': 1e-3, 'save_state': str(st)}}, allow_paths=False)


@unittest.skipIf(not (HAS_NODE and HAS_PYODIDE), 'Node.js and the pyodide package (npm) are needed.')
class SolverState(unittest.TestCase):
    def test_every_tutorial_continues_with_the_same_numbers(self):
        r = subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'snapshot_cases.js')], capture_output=True, text=True, timeout=1200)
        self.assertEqual(r.returncode, 0, r.stderr[-2000:])
        out = json.loads(r.stdout)
        self.assertGreater(len(out), 35)
        bad = {k: v for k, v in out.items() if v['maxdiff'] != 0}
        self.assertEqual(bad, {}, 'continuation differs')
        # 4.13: the cross-bonded cable keeps ten wideband sections of six conductors (their models and the records of their
        # waves): up to 6 MB; the others under 2 MB
        big = {k: v['kb'] for k, v in out.items() if v['kb'] >= {'cable_xb': 6000}.get(k, 2000)}
        self.assertEqual(big, {})


if __name__ == '__main__':
    unittest.main()
