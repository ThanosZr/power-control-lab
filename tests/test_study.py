"""The study folder (5.0, ROADMAP §91, THEORY §8ΩΕ, decision 344) and the automatic record of decision 343.4.

engine/studyfolder.py makes the folders, keeps the identity of a run, stores and finds the line models by the hash of their
key, and reads back a run, a plot file of the EMTP, the output of PSCAD and a CSV; web/studio/study.js gives the channels,
the rows, the netlist and the summary (tests/js/folder_cases.js); pcl Project.run(folder=…) and the page (/api/study,
/api/study_data) write it. The rows of a run are those of the record of the simulation: rounded to float32 they are the
values of the scope, bit for bit."""
import json
import os
import struct
import subprocess
import tempfile
import unittest
from http.server import ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from unittest import mock
from urllib.error import HTTPError
from urllib.request import Request, urlopen

import numpy as np

from engine import studyfolder as sf

ROOT = Path(__file__).resolve().parent.parent


class Cases(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        out = subprocess.run(['node', '--max-old-space-size=6000', str(ROOT / 'tests/js/folder_cases.js')],
                             capture_output=True, text=True, timeout=1800, check=True)
        cls.r = json.loads(out.stdout)

    def test_the_rows_are_the_record_of_the_simulation(self):
        self.assertEqual(len(self.r['rows']), 5)
        for x in self.r['rows']:
            self.assertEqual(x['rows'], x['ring'], x['id'])                       # one row per recorded point
            self.assertEqual((x['tdiff'], x['vdiff'], x['last'], x['chunks']), (0, 0, 0, 0), x['id'])
        big = [x for x in self.r['rows'] if x['id'] == 'big_grid'][0]
        self.assertTrue(big['auto'])                                              # 1038 channels: the scope records 4 …
        self.assertEqual((big['keys'], big['rec']), (1038, 4))                    # … and the folder every one of them

    def test_the_units_are_those_of_the_scope(self):
        self.assertNotIn('error', self.r['units'])
        self.assertGreater(self.r['units']['n'], 13000)
        self.assertEqual(self.r['units']['diff'], [])

    def test_the_netlist(self):
        for x in self.r['netlist']:
            self.assertEqual((x['nodes'], x['elements'], x['parts'], x['blocks'], x['unknowns']),
                             (x['nets'], x['els'], x['byId'], x['sigBlocks'], x['n']), x['id'])
            self.assertEqual(x['state'], 0, x['id'])                              # the circuit, not a moment of the run
            self.assertTrue(x['end'] and x['roundtrip'], x['id'])
        self.assertEqual([x['model'] for x in self.r['netlist'] if x['id'] == 'line_fd'], [1])   # the line by its model hash

    def test_the_automatic_record_343_4(self):
        a = {(x['id'], x['mod']): x for x in self.r['auto']}
        self.assertEqual((a[('big_grid', None)]['mode'], a[('big_grid', None)]['auto'], a[('big_grid', None)]['rec']), ('auto', True, 4))
        self.assertEqual((a[('big_grid', 3)]['mode'], a[('big_grid', 3)]['rec']), ('all', 1038))      # a file before the 5.0
        self.assertEqual(a[('big_grid', 'all')]['rec'], 1038)
        self.assertEqual(a[('big_grid', 'watched')]['rec'], 4)
        self.assertEqual((a[('buck', None)]['auto'], a[('buck', None)]['rec']), (False, 27))          # up to 1000: every channel
        self.assertTrue(a[('b4dcs2', None)]['auto'])
        for k, x in a.items():
            if k[0] == 'big_grid':
                self.assertTrue(x['same'], k)                                     # the same numbers in every mode

    def test_the_order_of_the_page(self):
        g = self.r['page']                                                        # the scope adds its channels after the build
        self.assertEqual((g['r0'], g['rec'], g['opts']), (0, 4, False))
        self.assertLessEqual(g['bytes'], g['mem'])                                 # within the memory of the scope
        self.assertEqual(g['cap'], 200000)                                       # grows once, up to REC_WATCH
        self.assertTrue(g['last'])
        self.assertEqual((g['all'], g['back']), (1038, 4))                         # «Όλα τα κανάλια» and back take effect

    def test_a_line_model_read_back_gives_the_same_bits(self):
        for x in self.r['lines']:
            self.assertEqual((x['models'], x['found']), (2, 2), x['id'])
            self.assertTrue(x['src'] and x['same'], x['id'])


class Folder(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.env = mock.patch.dict(os.environ, {'PCL_HOME': self.tmp.name})
        self.env.start()
        self.d = Path(self.tmp.name) / 'μελέτη'

    def tearDown(self):
        self.env.stop()
        self.tmp.cleanup()

    def test_a_run_from_python(self):
        import pcl
        p = pcl.tutorial('buck')
        r = p.run(t_end=2e-4, folder={'path': str(self.d), 'netlist': True})
        f = r.meta['folder']
        run = Path(f['path'])
        names = sorted(x.name for x in run.iterdir())
        for n in ('channels.json', 'data.f64', 'events.jsonl', 'log.jsonl', 'netlist.json', 'netlist.txt', 'project.json', 'run.json',
                  'summary.html', 'summary.json'):
            self.assertIn(n, names)
        j = json.loads((run / 'run.json').read_text(encoding='utf-8'))
        self.assertEqual((j['format'], j['status'], j['source'], j['data']['dtype']), ('pcl-run', 'done', 'python', 'float64'))
        s = sf.source(str(self.d))                                                # a study folder: its last run
        info = s.info()
        self.assertEqual(info['rows'], len(r.t))
        self.assertEqual(len(info['channels']), 27)                               # every channel of the buck
        t, col, get = s.arrays()
        self.assertTrue(np.array_equal(t, np.asarray(r.t)))
        for k in r.keys:
            self.assertTrue(np.array_equal(np.asarray(get(col[k])), np.asarray(r[k])), k)   # the same bits as the Result
        self.assertEqual(j['project']['hash'], sf.project_hash(p.data))
        # a second run: runs/0002, and the study keeps a given number of runs (the oldest untagged go)
        p.run(t_end=1e-4, folder=str(self.d))
        self.assertEqual([x['n'] for x in sf.list_runs(self.d)], [1, 2])
        sf.tag_run(str(self.d), sf.list_runs(self.d)[0]['run'], 'βάση')
        sf.save_settings(keep=2)
        p.run(t_end=1e-4, folder=str(self.d))
        self.assertEqual([x['n'] for x in sf.list_runs(self.d)], [1, 3])          # 2 went, 1 has a tag

    def test_reading_back(self):
        import pcl
        r = pcl.tutorial('buck').run(t_end=2e-4, folder=str(self.d))
        s = sf.source(r.meta['folder']['path'])
        a = sf.read_range(s, 0, 2e-4, ['I:L1', 'V:C1'], 50)
        self.assertFalse(a['raw'])
        self.assertEqual(len(a['cols']['I:L1']['mx']), 50)
        self.assertAlmostEqual(max(a['cols']['I:L1']['mx']), float(np.max(r['I:L1'])), places=12)
        b = sf.read_range(s, 1e-4, 1.01e-4, ['I:L1'], 1000)
        self.assertTrue(b['raw'])
        d = sf.read_diff(s, 'I:L1', s, 'I:L1', 0, 2e-4, 100)
        self.assertEqual(d['stats']['max'], 0.0)

    def test_the_files_of_the_emtp_and_of_pscad_and_csv(self):
        self.d.mkdir()
        # the plot file of the EMTP: <name>m.m and the .mda (float64 rows in Fortran records)
        t = np.linspace(0, 1e-3, 11)
        A = np.column_stack([t, np.sin(t * 1e4), 2 * t, -t])
        (self.d / 'casem.m').write_text("filn='case.mda';\nt=1;\nprecision='float64';\nt_max=0.1E-02;\nn_scopes=4;\nn_time_scopes=1;\nNtime='time';\ntime=1:1:1;\n"
                                        "n_vn_scopes=2;\nNvn='BUS1';\nNvn=strvcat(Nvn,'BUS2');\nvn=2:1:3;\nn_ib_scopes=1;\nNib='R1';\nib=4:1:4;\n", encoding='latin-1')
        with open(self.d / 'case.mda', 'wb') as f:
            for row in A:
                f.write(struct.pack('<i', 32) + row.astype('<f8').tobytes() + struct.pack('<i', 32))
        e = sf.source(str(self.d / 'casem.m'))
        i = e.info()
        self.assertEqual([c['key'] for c in i['channels']], ['vn:BUS1', 'vn:BUS2', 'ib:R1'])
        self.assertEqual([c['unit'] for c in i['channels']], ['V', 'V', 'A'])
        tt, col, get = e.arrays()
        self.assertTrue(np.array_equal(get(col['vn:BUS2']), A[:, 2]) and np.array_equal(tt, t))
        # PSCAD: the .inf and two .out files (10 channels + time each)
        inf = '\n'.join(f'PGB({k})  Output  Desc="ch{k}"  Group="Main"  Max=1.0  Min=-1.0  Units="kV"' for k in range(1, 14))
        (self.d / 'pr.inf').write_text(inf, encoding='latin-1')
        Y = np.column_stack([t] + [t * k for k in range(1, 14)])
        for n, cols in ((1, range(1, 11)), (2, range(11, 14))):
            (self.d / f'pr_{n:02d}.out').write_text(' Project description\n' + '\n'.join(' '.join(f'{v:.10e}' for v in [row[0], *row[list(cols)]]) for row in Y),
                                                    encoding='latin-1')
        q = sf.source(str(self.d / 'pr.inf'))
        self.assertEqual(len(q.info()['channels']), 13)
        tt, col, get = q.arrays()
        self.assertTrue(np.allclose(get(col['PGB12:ch12']), 12 * t, rtol=1e-10, atol=0))     # channel 12: file 2, column 2
        # CSV with a header (the recordings of the scope, Result.to_csv)
        (self.d / 'x.csv').write_text('# meta\nt (s),i_L (A),v_o (V)\n0,1,2\n1e-3,3,4\n', encoding='utf-8')
        c = sf.source(str(self.d / 'x.csv'))
        self.assertEqual([(x['key'], x['unit']) for x in c.info()['channels']], [('i_L (A)', 'A'), ('v_o (V)', 'V')])

    def test_line_models_by_the_hash_of_their_key(self):
        import pcl
        from pcl import lineconst
        st = sf.open_study(str(self.d), 'γραμμή', True)
        c = [c for c in pcl.tutorial('line_fd').data['components'] if c['type'] == 'TLM'][0]
        req = {'data': json.loads(c['params']['data']), 'model': 'cp', 'len': 100.0, 'f': 50.0, 'src': 'κλειδί-1'}
        r = lineconst.api(dict(req))
        kept = sf.store_line_model(Path(st['path']), {'cid': 'L1', 'label': 'L1', 'src': 'κλειδί-1', 'data': json.dumps(req['data']), 'len': 100.0, 'f': 50.0}, r)
        self.assertTrue(kept['new'])
        q = Path(st['path']) / kept['dir']
        self.assertEqual(sorted(x.name for x in q.iterdir()), ['L1_CP.net', 'input.json', 'model.json', 'report.txt', 'result.json'])
        hit = sf.lookup_line_model(st['path'], 'κλειδί-1')
        self.assertTrue(hit['cached'])
        self.assertEqual(hit['mdl'], json.loads(json.dumps(r['mdl'])))              # the numbers of the fit, exactly
        self.assertIsNone(sf.lookup_line_model(st['path'], 'κλειδί-2'))
        again = sf.store_line_model(Path(st['path']), {'cid': 'L1', 'label': 'L1', 'src': 'κλειδί-1'}, r)
        self.assertFalse(again['new'])
        # the models of a project go into the folder with a run (once per key)
        b = sf.begin_run(st['path'], pcl.tutorial('line_fd').data, 'line_fd', 'test', None, {'dtype': 'float64', 'cols': 3})
        self.assertEqual(len(b['models']), 2)
        self.assertTrue(all((Path(st['path']) / m['dir'] / 'model.json').is_file() for m in b['models']))

    def test_the_summary_page_escapes(self):
        st = sf.open_study(str(self.d), '<script>alert(1)</script>', True)
        b = sf.begin_run(st['path'], {'components': [], 'wires': []}, '<b>τίτλος</b>', 'test', None, {'dtype': 'float32', 'cols': 2})
        sf.put(st['path'], b['run'], 'summary.json', {'parts': {'<i>R</i>': 1}, 'warnings': ['<img src=x>']})
        sf.end_run(st['path'], b['run'], 'done')
        h = (Path(b['path']) / 'summary.html').read_text(encoding='utf-8')
        self.assertNotIn('<b>τίτλος', h)
        self.assertNotIn('<img src=x>', h)
        self.assertIn('&lt;img src=x&gt;', h)


class Server(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        from run import Handler
        cls.tmp = tempfile.TemporaryDirectory()
        cls.env = mock.patch.dict(os.environ, {'PCL_HOME': cls.tmp.name})
        cls.env.start()
        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        Thread(target=cls.server.serve_forever, daemon=True).start()
        cls.url = f'http://127.0.0.1:{cls.server.server_port}'

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.env.stop()
        cls.tmp.cleanup()

    def post(self, action, data, raw=None, headers=None):
        req = Request(f'{self.url}/api/{action}', data=raw if raw is not None else json.dumps(data).encode(),
                      headers=headers or {'Content-Type': 'application/json'})
        with urlopen(req) as r:
            return json.load(r)

    def test_a_run_of_the_page(self):
        path = str(Path(self.tmp.name) / 'σελίδα')
        st = self.post('study', {'op': 'open', 'path': path, 'create': True})
        b = self.post('study', {'op': 'begin', 'study': st['path'], 'project': {'components': [], 'wires': []}, 'title': 't',
                                'data': {'dtype': 'float64', 'cols': 3, 'dt': 0, 'mode': 'all'}})
        self.post('study', {'op': 'put', 'study': st['path'], 'run': b['run'], 'name': 'channels.json',
                            'obj': [{'i': 1, 'key': 'a', 'name': 'a', 'unit': 'V'}, {'i': 2, 'key': 'b', 'name': 'b', 'unit': 'A'}]})
        rows = np.array([[0, 1, 2], [1e-3, 3, 4]], dtype='<f8')
        h = {'Content-Type': 'application/octet-stream', 'X-PCL-Study': __import__('urllib.parse').parse.quote(st['path']), 'X-PCL-Run': b['run']}
        self.assertEqual(self.post('study_data', None, rows.tobytes(), h)['rows'], 2)
        with self.assertRaises(HTTPError):                                        # half a row
            self.post('study_data', None, rows.tobytes()[:20], h)
        info = self.post('study', {'op': 'info', 'source': b['path']})
        self.assertEqual((info['status'], info['rows'], info['t1']), ('running', 2, 1e-3))   # read while it is written
        self.post('study', {'op': 'end', 'study': st['path'], 'run': b['run'], 'status': 'done'})
        with self.assertRaises(HTTPError):                                        # an ended run takes no more rows
            self.post('study_data', None, rows.tobytes(), h)
        r = self.post('study', {'op': 'range', 'source': b['path'], 't0': 0, 't1': 1e-3, 'keys': ['b'], 'n': 100})
        self.assertEqual(r['cols']['b']['v'], [2.0, 4.0])
        self.assertEqual(len(self.post('study', {'op': 'runs', 'study': st['path']})['runs']), 1)

    def test_the_line_model_is_read_from_the_folder(self):
        import pcl
        path = str(Path(self.tmp.name) / 'γραμμές')
        st = self.post('study', {'op': 'open', 'path': path, 'create': True})
        c = [c for c in pcl.tutorial('line_fd').data['components'] if c['type'] == 'TLM'][0]
        req = {'data': json.loads(c['params']['data']), 'model': 'cp', 'len': 100, 'f': 50, 'src': 'κλειδί-σελίδας', 'study': st['path'], 'cid': 'L1', 'label': 'L1'}
        a = self.post('line_model', req)
        self.assertTrue(a['kept']['new'])
        b = self.post('line_model', req)
        self.assertTrue(b.get('cached'))
        self.assertEqual(a['mdl'], b['mdl'])
