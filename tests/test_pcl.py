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

    def test_module_level_api_and_job(self):
        # 3.14: pcl.use/set/run on one project (the app's panel uses the circuit on the screen), and job() as MATLAB sends it
        pcl.use('tutorial:buck?start=steady')
        pcl.set('L1.L', '100u')
        a = pcl.run(t_end='2m', channels=['I:L1'], measure={'dI': ('I:L1', 'pp', 10)})
        self.assertEqual(pcl.get('L1.L'), 1e-4)
        self.assertIn('L1', pcl.params())
        j = pcl.job({'project': 'tutorial:buck?start=steady', 'set': [{'key': 'L1.L', 'value': '100u'}],
                     'run': {'t_end': '2m', 'channels': ['I:L1'], 'measure': [{'name': 'dI', 'key': 'I:L1', 'stat': 'pp', 'arg': 10}], 'waveforms': False}})
        self.assertEqual(j['kind'], 'run')
        self.assertEqual(j['measure']['dI'], a.measured['dI'])
        sw = pcl.job({'tutorial': {'id': 'buck', 'options': {'start': 'steady'}},
                      'sweep': {'grid': [{'key': 'L1.L', 'values': [5e-5, 1e-4]}], 't_end': '2m', 'workers': 1,
                                'measure': {'name': 'dI', 'key': 'I:L1', 'stat': 'pp', 'arg': []}}})
        self.assertEqual(sw['kind'], 'sweep')
        self.assertEqual(sw['vars'], ['L1_L', 'dI'])
        self.assertEqual([r['L1.L'] for r in sw['rows']], [5e-5, 1e-4])
        with self.assertRaises(pcl.PclError):
            pcl.job({'project': str(ROOT / 'examples' / 'x.json'), 'run': {'t_end': 1e-3}}, allow_paths=False)

    def test_server_scenarios_local_only(self):
        import run as server
        req = {'project': 'tutorial:buck?start=steady', 'run': {'t_end': '1m', 'channels': ['V:C1'], 'measure': {'Vo': ['V:C1', 'avg', 10]}, 'waveforms': False}}
        from engine.analysis import InputError
        with self.assertRaises(InputError):
            server.ACTIONS['scenario_run'](dict(req))                               # not from 127.0.0.1
        r = server.ACTIONS['scenario_run']({**req, '_local': True})
        self.assertAlmostEqual(r['measure']['Vo'], 12, delta=0.1)
        json.dumps(r, allow_nan=False)                                              # strict JSON for browsers and MATLAB
        big = {'project': 'tutorial:buck', 'sweep': {'grid': {'R1.R': list(range(1, 30)), 'L1.L': list(range(1, 20))}, 'measure': {'v': ['V:C1', 'avg']}, 't_end': 1e-4}}
        with self.assertRaises(InputError):
            server.ACTIONS['scenario_sweep']({**big, '_local': True})               # 551 points > 400

    def test_chunked_runs_same_numbers(self):
        # the panel and the server run in chunks of whole periods (progress, time limit): the same numbers as one run
        js = ("const W='%s/web/studio';global.window=globalThis;global.Parts=require(W+'/parts.js');global.StepCheck=require(W+'/stepcheck.js');"
              "global.MNA=require(W+'/mna.js');require(W+'/tutorials.js');global.Metrics=require(W+'/metrics.js');const S=require(W+'/scenario.js');"
              "const out=[];for(const [id,te,st] of [['buck',1.03e-3],['marx',1e-4,'var']]){const pr=S.handle({action:'tutorial',id});if(st)pr.solve={step:st};"
              "const q={action:'run',project:pr,t_end:te};const a=S.handle(q),b=S.handle(q,{tick:()=>{}});const k=a.keys[0];"
              "out.push(a.t.length===b.t.length&&a.t.every((x,i)=>x===b.t[i]&&a.ch[k][i]===b.ch[k][i]));}console.log(JSON.stringify(out));") % ROOT.as_posix()
        r = subprocess.run(['node', '-e', js], capture_output=True, text=True, timeout=300)
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual(json.loads(r.stdout), [True, True])

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

    def test_event_log(self):
        # 3.19: Result.events from both solvers (the same switchings), a filter by kind, the CSV and the command line
        p = pcl.tutorial('buck')
        a = p.run('0.2m', channels=['I:L1'], events=True)
        b = p.run('0.2m', channels=['I:L1'], solver='scipy', scipy_method='LSODA', events=['switch'])
        self.assertEqual(a.meta['events']['kinds']['switch'], 40)
        sa = [e['t'] for e in a.events if e['kind'] == 'switch']
        sb = [e['t'] for e in b.events]
        self.assertEqual({e['kind'] for e in b.events}, {'switch'})
        self.assertEqual(len(sa), len(sb))
        for x, y in zip(sa, sb):
            self.assertAlmostEqual(x, y, delta=1e-12)
        self.assertEqual(p.run('0.1m', channels=['I:L1']).events, [])     # off by default
        out = self.tmp / 'ev.csv'
        a.events_csv(out, kinds=['duty'])
        rows = list(csv.reader(out.open(encoding='utf-8')))
        self.assertEqual(rows[0][:3], ['t [s]', 'kind', 'id'])
        self.assertEqual({r[1] for r in rows[1:]}, {'duty'})
        out2 = self.tmp / 'ev2.csv'
        run = subprocess.run([sys.executable, '-m', 'pcl', 'run', 'tutorial:buck', '--t-end', '0.1m', '--channels', 'I:L1', '--events', str(out2)],
                             capture_output=True, text=True, cwd=str(ROOT), timeout=300)
        self.assertEqual(run.returncode, 0, run.stderr)
        self.assertIn('switch', out2.read_text(encoding='utf-8'))

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

    def test_parquet_and_hdf5(self):
        # 3.15: Parquet written by pcl itself (no pyarrow needed to write); read back with pyarrow/pandas when they are installed
        r = self.buck.run(t_end=2e-4, channels=['V:C1', 'I:L1'])
        sw = self.buck.sweep({'R1.R': [5, 10]}, t_end=1e-3, measure={'Vo': ('V:C1', 'avg', 5)}, workers=1)
        for comp in ('gzip', None):
            pq = self.tmp / f'out_{comp}.parquet'
            r.to_parquet(pq, compression=comp)
            self.assertEqual(pq.read_bytes()[:4], b'PAR1')
            self.assertEqual(pq.read_bytes()[-4:], b'PAR1')
        try:
            import pandas as pd
            import pyarrow.parquet as papq
        except ImportError:
            self.skipTest('pandas/pyarrow δεν υπάρχουν: το Parquet γράφτηκε, δεν ελέγχθηκε η ανάγνωση')
        for comp in ('gzip', None):
            df = pd.read_parquet(self.tmp / f'out_{comp}.parquet')
            self.assertEqual(list(df.columns), ['t', 'V:C1', 'I:L1'])
            self.assertEqual(len(df), len(r.t))
            self.assertEqual(df['V:C1'].tolist(), [float(v) for v in r['V:C1']])      # bit for bit
        meta = json.loads(papq.read_schema(self.tmp / 'out_gzip.parquet').metadata[b'pcl'])
        self.assertEqual(meta['project'], 'buck')
        self.assertEqual(meta['units']['I:L1'], 'A')
        sw.save(self.tmp / 'sw.parquet')
        d = pd.read_parquet(self.tmp / 'sw.parquet')
        self.assertEqual(list(d.columns), ['R1.R', 'Vo'])
        self.assertEqual(d['Vo'].tolist(), sw.column('Vo'))
        # many columns (the list header of the footer in its long form), texts with nulls, NaN
        from pcl.formats import write_parquet
        cols = [(f'c{i}', [float(i), float('nan'), None]) for i in range(20)] + [('κείμενο', ['α', None, '0:1, 1m:2'])]
        write_parquet(self.tmp / 'many.parquet', cols, meta={'x': 1})
        d = pd.read_parquet(self.tmp / 'many.parquet')
        self.assertEqual(d.shape, (3, 21))
        self.assertTrue(pd.isna(d['c3'][1]) and pd.isna(d['c3'][2]))
        self.assertEqual(d['κείμενο'][2], '0:1, 1m:2')
        self.assertTrue(pd.isna(d['κείμενο'][1]))
        try:
            import h5py
        except ImportError:
            return
        r.to_hdf5(self.tmp / 'out.h5')
        with h5py.File(self.tmp / 'out.h5') as f:
            self.assertEqual(json.loads(f.attrs['columns']), ['t', 'V:C1', 'I:L1'])
            self.assertEqual(f['I:L1'][-1], r['I:L1'][-1])
            self.assertEqual(json.loads(f.attrs['meta'])['project'], 'buck')

    def test_bifurcation_is_a_sweep(self):
        # 3.15: the bifurcation diagram through pcl gives the app's numbers (the same MNA.sweepPoint), in order and in parallel:
        # peak current-mode, period doubling 1T → 2T → 4T → 8T → no period (as tests/js/tutorial_cases.js 'chaos')
        c = pcl.tutorial('pcm_chaos')
        kw = dict(channel='Y:AM1', stat='end', transient=300, record=64)
        b1 = c.bifurcation('IC.v', [1.5, 2, 2.5, 2.65, 3], workers=1, **kw)
        b2 = c.bifurcation('IC.v', [1.5, 2, 2.5, 2.65, 3], workers=2, **kw)
        self.assertEqual(b1.period, [1, 2, 4, 8, 0])
        self.assertEqual(b1.y, b2.y)
        self.assertEqual(b1.changes(), [(2.0, 2), (2.5, 4), (2.65, 8), (3.0, 0)])
        app = pcl.core._node({'action': 'bifurcation', 'project': c.data, 'comp': 'IC', 'param': 'v', 'key': 'Y:AM1', 'stat': 'end',
                              'transient': 300, 'record': 64, 'values': [2.5]})
        self.assertEqual(app['points'][0]['y'], b1.y[2])
        # start/stop/n gives the app's values a + (b − a)·k/(n − 1)
        b3 = c.bifurcation('IC.v', start=1.4, stop=3, n=3, transient=20, record=8, channel='Y:AM1', stat='end', workers=1)
        self.assertEqual(b3.values, [1.4, 2.2, 3.0])
        from scipy.io import loadmat
        b1.to_mat(self.tmp / 'bif.mat')
        m = loadmat(self.tmp / 'bif.mat')
        self.assertEqual(m['Y'].shape, (5, 64))
        self.assertEqual(m['Y'][3].tolist(), b1.y[3])
        self.assertEqual(m['period'][:, 0].tolist(), [1, 2, 4, 8, 0])
        j = pcl.job({'tutorial': 'pcm_chaos', 'bifurcation': {'param': 'IC.v', 'values': [2.5], 'channel': 'Y:AM1', 'stat': 'end', 'transient': 300, 'record': 64}})
        self.assertEqual(j['kind'], 'bifurcation')
        self.assertEqual(j['period'], [4])
        with self.assertRaises(pcl.PclError):
            c.bifurcation('IC', [1, 2], channel='Y:AM1')

    def test_bifurcation_command_line(self):
        out = self.tmp / 'bif.parquet'
        run = subprocess.run([sys.executable, '-m', 'pcl', 'bifurcation', 'tutorial:pcm_chaos', 'IC.v', '--values', '1.5,2.5', '--channel', 'Y:AM1',
                              '--stat', 'end', '--transient', '300', '--record', '64', '--out', str(out)], capture_output=True, text=True, cwd=str(ROOT), timeout=300)
        self.assertEqual(run.returncode, 0, run.stderr)
        self.assertIn('από 2.5: 4T', run.stdout)
        self.assertEqual(out.read_bytes()[:4], b'PAR1')


if __name__ == '__main__':
    unittest.main()
