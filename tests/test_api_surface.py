"""The public API written down (3.18, a base for 4.0): tools/api_surface.py reads it from the code, the committed copy is
up to date, and a removal or a lost parameter stops it."""
import json
import shutil
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'tools'))
import api_surface  # noqa: E402


@unittest.skipIf(shutil.which('node') is None, 'Node.js not installed (the parts catalog is read in Node).')
class ApiSurface(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.now = api_surface.current()

    def test_committed_copy_is_up_to_date(self):
        self.assertEqual(api_surface.main(['--check']), 0)

    def test_every_surface_is_read(self):
        n = {g: len(v) for g, v in self.now.items()}
        self.assertEqual(set(n), set(api_surface.GROUPS))
        self.assertTrue(all(v > 0 for v in n.values()), n)
        self.assertIn('t_end', self.now['pcl']['pcl.Project.run']['params'])
        self.assertIn('python -m pcl run', self.now['cli'])
        self.assertIn('/api/batch_sim', self.now['server'])
        self.assertEqual(self.now['link']['M.set']['perm'], 'project.write')
        self.assertIn('PclApp.setParam', self.now['matlab'])
        self.assertIn('action:run', self.now['scenario'])
        # the project file: a part's parameters and every pin it can have (3.18: the bus pin of the three-phase source)
        self.assertIn('conn', self.now['project']['part:VAC3']['params'])
        self.assertEqual(set(self.now['project']['part:VAC3']['pins']), {'a', 'b', 'c', 'n', 'abc'})
        self.assertIn('name', self.now['project']['file.wire']['params'])
        self.assertIn('version', self.now['project']['file']['params'])

    def test_a_removal_or_a_lost_parameter_breaks(self):
        old = json.loads(json.dumps(api_surface.merged({'groups': {}, 'removed': []}, self.now, '3.18')))
        old['groups']['pcl']['pcl.Project.run']['params'].append('gone')
        old['groups']['server']['/api/old'] = {'params': [], 'since': '3.0'}
        added, broken = api_surface.compare(old, self.now)
        self.assertEqual(sorted(b[1] for b in broken), ['/api/old', 'pcl.Project.run'])
        self.assertEqual(added, [])
        # adding a parameter or an entry never breaks
        new = {g: {k: dict(e) for k, e in v.items()} for g, v in self.now.items()}
        new['pcl']['pcl.Project.run'] = {'params': self.now['pcl']['pcl.Project.run']['params'] + ['extra']}
        new['server']['/api/new'] = {'params': []}
        added, broken = api_surface.compare(api_surface.merged({'groups': {}, 'removed': []}, self.now, '3.18'), new)
        self.assertEqual(broken, [])
        self.assertEqual(added, [('server', '/api/new')])


    def test_experimental_surface(self):
        # 3.19 (question 1 of 3.18): AI control and the workbench are listed but stay out of the rule of 4.x
        self.assertTrue(api_surface.experimental('pcl', 'pcl.control.InverseTrainer'))
        self.assertTrue(api_surface.experimental('pcl', 'pcl.workbench.prepare'))
        self.assertFalse(api_surface.experimental('pcl', 'pcl.Project.run'))
        snap = api_surface.merged({'groups': {}, 'removed': []}, self.now, '3.19')
        self.assertIn('pcl.control.', snap['experimental']['pcl'])
        self.assertIn('πειρ.', api_surface.report(snap))
        # the 3.19 additions: events from a run, the B1 blocks, units on a constant and a gain, the frame of a Mux
        self.assertIn('events', self.now['pcl']['pcl.Project.run']['params'])
        for t in ('F2', 'RLIM', 'RT', 'EDGE'):
            self.assertIn('part:' + t, self.now['project'])
        self.assertIn('unit', self.now['project']['part:CONST']['params'])
        self.assertIn('frame', self.now['project']['part:MUX']['params'])

    def test_the_surface_of_4_19_2(self):
        # the choices of a study are stable additions to the methods of the network (backend, start, a change of the loads); the
        # backends with their GPU path, the script of the accelerator, the start models and the ONNX files are experimental
        self.assertEqual(self.now['pcl']['pcl.network.Network.batch_flow']['params'][-3:], ['backend', 'how', 'start'])
        self.assertEqual(self.now['pcl']['pcl.network.Network.contingency']['params'][-2:], ['backend', 'how'])
        for k in ('pcl.network.Network.batch_flow', 'pcl.network.Network.contingency', 'pcl.network.Network.opf'):
            self.assertFalse(api_surface.experimental('pcl', k), k)
        for k in ('pcl.backend.choose', 'pcl.backend.Backend.solver', 'pcl.accel.run', 'pcl.nnstart.train', 'pcl.nnstart.Model.load', 'pcl.onnxio.write',
                  'pcl.onnxio.read', 'pcl.onnxio.run'):
            self.assertIn(k, self.now['pcl'])
            self.assertTrue(api_surface.experimental('pcl', k), k)
        self.assertIn('warm', self.now['pcl']['pcl.ipm.ipm']['params'])
        self.assertIn('dS', self.now['pcl']['pcl.opf.solve']['params'])
        for k in ('python -m pcl accel', 'python -m pcl nnstart'):
            self.assertIn(k, self.now['cli'])
            self.assertTrue(api_surface.experimental('cli', k), k)

    def test_the_surface_of_4_19_1(self):
        # the studies are stable from the start: the methods of the network, the report object, the studies as data, the two actions
        # of the server, the smallest step in the file; the kernels of the steady-state solvers are listed as experimental
        for k in ('pcl.network.Network.power_flow', 'pcl.network.Network.opf', 'pcl.network.Network.contingency', 'pcl.network.Network.report',
                  'pcl.report.Report', 'pcl.report.Report.chart', 'pcl.report.Report.from_dict', 'pcl.report.Report.load', 'pcl.report.network_report',
                  'pcl.study.run', 'pcl.study.report'):
            self.assertIn(k, self.now['pcl'])
            self.assertFalse(api_surface.experimental('pcl', k), k)
        for k in ('pcl.powerflow.newton', 'pcl.powerflow.batch', 'pcl.opf.solve', 'pcl.ipm.ipm'):
            self.assertIn(k, self.now['pcl'])
            self.assertTrue(api_surface.experimental('pcl', k), k)
        self.assertEqual(self.now['pcl']['pcl.report.Report.chart']['params'][:3], ['kind', 'x', 'series'])
        self.assertIn('/api/network_study', self.now['server'])
        self.assertIn('/api/network_report', self.now['server'])
        self.assertIn('hmin', self.now['project']['file.solve']['params'])

    def test_the_rule_is_active_from_4_0(self):
        # 4.0: STABLE_FROM is active. A removal within 4.x does not pass, not even with --allow-removal; in 5.0 only what
        # was deprecated in 4.x may go; experimental points change freely; up to 4.0 a reason was enough
        snap = lambda v, deps=None: {**json.loads(json.dumps(api_surface.merged({'groups': {}, 'removed': []}, self.now, v))), 'deprecated': deps or {}}
        gone = [('pcl', 'pcl.Project.run', 'λείπει')]
        exp = [('pcl', 'pcl.control.InverseTrainer', 'λείπει')]
        V = api_surface.verdict
        self.assertIsNotNone(V(snap('3.19'), gone, '4.0'))                       # no reason
        self.assertIsNone(V(snap('3.19'), gone, '4.0', 'λόγος'))                 # provisional until 4.0
        self.assertIn('4.x', V(snap('4.0'), gone, '4.1', 'λόγος'))              # within 4.x: never
        self.assertIn('DEPRECATED', V(snap('4.0'), gone, '4.1', 'λόγος'))
        self.assertIsNotNone(V(snap('4.3'), gone, '5.0', 'λόγος'))               # 5.0: not deprecated, stays
        dep = {'pcl': {'pcl.Project.run': {'since': '4.2', 'instead': 'pcl.Project.go'}}}
        self.assertIsNone(V(snap('4.3', dep), gone, '5.0', 'λόγος'))             # 5.0: deprecated in 4.x, goes
        self.assertIsNotNone(V(snap('4.3', dep), gone, '5.0'))                   # still with a reason
        self.assertIsNone(V(snap('4.0'), exp, '4.1'))                            # experimental: no rule
        self.assertIsNotNone(V(snap('4.0'), exp + gone, '4.1', 'λόγος'))        # mixed: the stable one counts
        self.assertIsNone(V(snap('4.0'), [], '4.1'))
        # the report says stable, lists the deprecated points and marks them in the tables
        r = api_surface.report(snap('4.0'))
        self.assertIn('**σταθερό** από την 4.0', r)
        self.assertIn('Κανένα στην 4.0', r)
        self.assertIn('**προσωρινό**', api_surface.report(snap('3.19')))
        r = api_surface.report(snap('4.2', dep))
        self.assertIn('| pcl | `pcl.Project.run` | 4.2 | pcl.Project.go |', r)
        self.assertIn('· παρωχ. 4.2', r)
        # a deprecated point must still be in the code
        old = api_surface.DEPRECATED
        try:
            api_surface.DEPRECATED = {'pcl': {'pcl.nothing': ('4.1', '—'), 'pcl.Project.run': ('4.1', '—')}}
            self.assertEqual(api_surface.stale_deprecations(self.now), [('pcl', 'pcl.nothing')])
        finally:
            api_surface.DEPRECATED = old
        self.assertEqual(api_surface.STABLE_FROM, '4.0')

if __name__ == '__main__':
    unittest.main()
