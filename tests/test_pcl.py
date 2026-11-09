"""Scripted scenarios (3.13, ROADMAP §30): the pcl package and its command line."""
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


class Values(unittest.TestCase):
    def test_parse_value(self):
        self.assertEqual(pcl.parse_value('47u'), 47e-6)
        self.assertEqual(pcl.parse_value('5m'), 5e-3)
        self.assertEqual(pcl.parse_value('4.7k'), 4700.0)
        self.assertEqual(pcl.parse_value('1e-3'), 1e-3)
        self.assertEqual(pcl.parse_value('2.5e3k'), 2.5e6)
        self.assertEqual(pcl.parse_value(12), 12)
        self.assertEqual(pcl.parse_value('0:0, 1m:10'), '0:0, 1m:10')      # a program t:value stays text

    def test_set_and_errors(self):
        p = pcl.Project({'components': [{'id': 'R1', 'type': 'R', 'params': {'R': 10}}], 'wires': []})
        p.set('R1.R', '4.7k')
        self.assertEqual(p.get('R1.R'), 4700.0)
        p.set('solve.step', 'var')
        self.assertEqual(p.data['solve']['step'], 'var')
        with self.assertRaises(pcl.PclError):
            p.set('X9.R', 1)
        with self.assertRaises(pcl.PclError):
            p.set('R1', 1)


@unittest.skipIf(not HAS_NODE, 'Node.js not installed (the browser solver runs in Node).')
class Scenarios(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = Path(tempfile.mkdtemp(prefix='pcl-'))
        cls.buck = pcl.tutorial('buck', start='steady')

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(cls.tmp, ignore_errors=True)

    def test_ripple_follows_theory_in_a_sweep(self):
        # ΔI = V_o(1 − D)/(L·f_s) at every point of a sweep of L (ROADMAP §30 test)
        sw = self.buck.sweep({'L1.L': ['50u', '100u', '200u']}, t_end='8m', workers=3,
                             measure={'Vo': ('V:C1', 'avg', 10), 'dI': ('I:L1', 'pp', 10)})
        self.assertEqual(len(sw.rows), 3)
        D, fs = 0.5, 100e3
        for r in sw.rows:
            self.assertNotIn('error', r)
            dI = r['Vo'] * (1 - D) / (r['L1.L'] * fs)
            self.assertAlmostEqual(r['dI'], dI, delta=0.03 * dI, msg=r)

    def test_same_numbers_as_the_app(self):
        # the browser solver from Python is web/studio/mna.js itself: the same as a direct run in Node
        r = self.buck.run(t_end=1e-3, channels=['V:C1', 'I:L1'], max_points=10 ** 7)
        js = ("const W='%s/web/studio';global.Parts=require(W+'/parts.js');const MNA=require(W+'/mna.js');"
              "const pr=JSON.parse(require('fs').readFileSync(0,'utf8'));const s=new MNA.Sim(pr,{hDiv:200,method:'TR'});"
              "const t=[s.t],v=[s.vals[s.chIndex.get('V:C1')]];const rec=s.recordNow.bind(s);"
              "s.recordNow=function(){rec();t.push(s.t);v.push(s.vals[s.chIndex.get('V:C1')]);};s.run(1e-3);"
              "console.log(JSON.stringify({t,v}));") % ROOT.as_posix()
        out = subprocess.run(['node', '-e', js], input=json.dumps(self.buck.data), capture_output=True, text=True, timeout=120)
        self.assertEqual(out.returncode, 0, out.stderr)
        d = json.loads(out.stdout)
        self.assertEqual(len(d['t']), len(r.t))
        self.assertEqual(d['v'], r['V:C1'])
        self.assertEqual(d['t'], r.t)

    def test_scipy_solver(self):
        b = self.buck.run(t_end=2e-3, channels=['V:C1', 'I:L1'], measure={'Vo': ('V:C1', 'avg', 10), 'IL': ('I:L1', 'avg', 10)})
        s = self.buck.run(t_end=2e-3, channels=['V:C1', 'I:L1'], solver='scipy', measure={'Vo': ('V:C1', 'avg', 10), 'IL': ('I:L1', 'avg', 10)})
        self.assertIn('scipy', s.meta['solver'])
        self.assertAlmostEqual(s.measured['Vo'], b.measured['Vo'], delta=2e-3 * b.measured['Vo'])
        self.assertAlmostEqual(s.measured['IL'], b.measured['IL'], delta=5e-3 * b.measured['IL'])
        # the Python measurement on the returned waveform agrees with the runner's
        self.assertAlmostEqual(b.measure('V:C1', 'avg', 10), b.measured['Vo'], delta=1e-6 * b.measured['Vo'])

    def test_variable_step_and_messages(self):
        q = self.buck.copy().set('solve.step', 'var')
        r = q.run(t_end=1e-3, channels=['V:C1'])
        self.assertEqual(r.meta['step'], 'var')
        self.assertLess(r.meta['steps'], 20000)                          # T/200 fixed: 20 000 steps in 1 ms
        self.assertIsInstance(r.diag, list)
        sch = pcl.tutorial('schering').run(t_end=1e-3, channels=['V:V1'])     # the step check comes back with the results
        self.assertTrue(any(d['grp'] == 'step' and 'C₄' in d['msg'] for d in sch.diag), sch.diag)

    def test_server_messages(self):
        # the SciPy solver answers in the console's format: an explicit method on a stiff circuit is a warning
        from engine.batch import simulate
        from pcl.core import _node
        rc = {'components': [{'id': 'V1', 'type': 'VDC', 'params': {'V': 10}, 'x': 0, 'y': 0}, {'id': 'R1', 'type': 'R', 'params': {'R': 1}, 'x': 0, 'y': 0},
                             {'id': 'C1', 'type': 'C', 'params': {'C': 1e-9}, 'x': 0, 'y': 0}, {'id': 'G', 'type': 'GND', 'x': 0, 'y': 0}],
              'wires': [{'id': 'w0', 'a': {'c': 'V1', 'p': 'p'}, 'b': {'c': 'R1', 'p': 'a'}}, {'id': 'w1', 'a': {'c': 'R1', 'p': 'b'}, 'b': {'c': 'C1', 'p': 'p'}},
                        {'id': 'w2', 'a': {'c': 'C1', 'p': 'n'}, 'b': {'c': 'G', 'p': 'g'}}, {'id': 'w3', 'a': {'c': 'V1', 'p': 'n'}, 'b': {'c': 'G', 'p': 'g'}}],
              'solve': {'tbase': 1e-3}}
        exp = _node({'action': 'export', 'project': rc, 'channels': ['V:C1']})
        r = simulate({'net': exp['net'], 'channels': exp['channels'], 't_end': 1e-5, 'method': 'RK45', 'max_step': 1e-6})
        d = [x for x in r['diag'] if x['key'] == 'srv:explicit']
        self.assertEqual(len(d), 1)
        self.assertEqual(d[0]['sev'], 'warn')
        self.assertEqual(d[0]['id'], 'C1')
        r = simulate({'net': exp['net'], 'channels': exp['channels'], 't_end': 1e-5, 'method': 'Radau', 'max_step': 1e-6})
        self.assertFalse([x for x in r['diag'] if x['sev'] != 'info'])

    def test_exports(self):
        r = self.buck.run(t_end=2e-4, channels=['V:C1', 'I:L1'])
        p = self.tmp / 'out.csv'
        r.to_csv(p)
        lines = p.read_text(encoding='utf-8').splitlines()
        self.assertTrue(lines[0].startswith('# pcl:'))
        head = next(row for row in csv.reader(x for x in lines if not x.startswith('#')))
        self.assertEqual(head, ['t [s]', 'V:C1 [V]', 'I:L1 [A]'])
        self.assertTrue(any(x.startswith('# hash:') for x in lines))
        g = self.tmp / 'out_gr.csv'
        r.to_csv(g, sep=';', decimal=',', meta=False)
        row = g.read_text(encoding='utf-8').splitlines()[2].split(';')
        self.assertEqual(len(row), 3)
        self.assertIn(',', row[1])
        j = self.tmp / 'out.json'
        r.to_json(j)
        d = json.loads(j.read_text(encoding='utf-8'))
        self.assertEqual(d['keys'], ['V:C1', 'I:L1'])
        self.assertEqual(d['units']['I:L1'], 'A')
        from scipy.io import loadmat
        m = self.tmp / 'out.mat'
        r.to_mat(m)
        x = loadmat(m)
        self.assertEqual(x['V_C1'].shape, (len(r.t), 1))
        self.assertEqual([str(v[0]) for v in x['names'][:, 0]], ['V:C1', 'I:L1'])
        self.assertAlmostEqual(float(x['V_C1'][-1, 0]), r['V:C1'][-1], places=9)
        self.assertEqual(json.loads(str(x['meta'][0]))['project'], 'buck')

    def test_command_line(self):
        out = self.tmp / 'cli.csv'
        run = subprocess.run([sys.executable, '-m', 'pcl', 'run', 'tutorial:buck?start=steady', '--set', 'L1.L=200u', '--t-end', '2m',
                              '--channels', 'V:C1,I:L1', '--measure', 'I:L1:pp:10', '--out', str(out)],
                             capture_output=True, text=True, cwd=str(ROOT), timeout=300)
        self.assertEqual(run.returncode, 0, run.stderr)
        self.assertIn('I:L1:pp:10 =', run.stdout)
        self.assertIn('"L1.L": 0.0002', out.read_text(encoding='utf-8'))      # the change is in the metadata
        sw = self.tmp / 'sw.csv'
        run = subprocess.run([sys.executable, '-m', 'pcl', 'sweep', 'tutorial:buck?start=steady', '--grid', 'R1.R=5:20:4', '--t-end', '2m',
                              '--measure', 'V:C1:avg:10', '--out', str(sw), '--workers', '2'], capture_output=True, text=True, cwd=str(ROOT), timeout=300)
        self.assertEqual(run.returncode, 0, run.stderr)
        rows = [r for r in csv.reader(x for x in sw.read_text(encoding='utf-8').splitlines() if not x.startswith('#'))]
        self.assertEqual(rows[0], ['R1.R', 'V:C1:avg:10'])
        self.assertEqual([float(r[0]) for r in rows[1:]], [5.0, 10.0, 15.0, 20.0])
        bad = subprocess.run([sys.executable, '-m', 'pcl', 'run', 'tutorial:buck', '--set', 'Q1.R=1', '--t-end', '1m'],
                             capture_output=True, text=True, cwd=str(ROOT), timeout=120)
        self.assertEqual(bad.returncode, 2)
        self.assertIn('Δεν υπάρχει στοιχείο', bad.stderr)


if __name__ == '__main__':
    unittest.main()
