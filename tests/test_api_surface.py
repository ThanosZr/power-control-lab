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

    def test_the_surface_of_4_19_4(self):
        # the picture of a network, the network files and the RAW reader are experimental; what a study request can carry (a file, the
        # changes, the picture) and the label of a bus are stable additions
        for k in ('pcl.netview.view', 'pcl.netview.svg', 'pcl.netview.dxf', 'pcl.netfile.read', 'pcl.netfile.read_file', 'pcl.netfile.write', 'pcl.netfile.apply',
                  'pcl.netfile.describe', 'pcl.netfile.summary', 'pcl.psse.read', 'pcl.psse.write'):
            self.assertTrue(api_surface.experimental('pcl', k), k)
            self.assertIn(k, self.now['pcl'], k)
        for k in ('pcl.study.open_file', 'pcl.study.save_file', 'pcl.study.view', 'pcl.study.run', 'pcl.network.Network.bus'):
            self.assertFalse(api_surface.experimental('pcl', k), k)
            self.assertIn(k, self.now['pcl'], k)
        self.assertEqual(self.now['pcl']['pcl.network.Network.bus']['params'][-1], 'label')
        self.assertEqual(self.now['pcl']['pcl.netview.view']['params'], ['net', 'off'])
        import run
        for a in ('network_view', 'network_open', 'network_save'):
            self.assertIn(a, run.ACTIONS)
        # the optimal power flow with security: the module is experimental, the method of the network and the study are there
        for k in ('pcl.scopf.solve', 'pcl.scopf.screen'):
            self.assertTrue(api_surface.experimental('pcl', k), k)
            self.assertIn(k, self.now['pcl'], k)
        self.assertIn('pcl.network.Network.scopf', self.now['pcl'])
        self.assertEqual(self.now['pcl']['pcl.opf.solve']['params'][-2:], ['extra', 'acdc'])           # (4.21: the stations of the OPF AC/DC after it)
        from pcl import study
        self.assertIn('scopf', study.STUDIES)

    def test_the_surface_of_4_20_3(self):
        """4.20.3: the grid-forming control has the DC control (10) for every law (dcc, with the output idc), the current
        limitation through the power set-point (plim, ith, gp) and, for dVOC, the angle κ and the initial amplitude (kap, E0);
        no new point of the API."""
        g = self.now['project']['part:GFMC']
        for k in ('dcc', 'plim', 'ith', 'gp', 'kap', 'E0'):
            self.assertIn(k, g['params'])
        self.assertIn('idc', g['pins'])
        self.assertGreaterEqual(sum(len(v) for v in self.now.values()), 836)        # 836 then; 4.21 adds points

    def test_the_surface_of_4_20_2(self):
        """4.20.2: the grid-forming control has two more laws, dVOC and matching control, with the gains of the amplitude of the
        matching (kpm, kim, mu0), its DC losses (Gdc) and its output idc (the DC current reference); no new point of the API."""
        g = self.now['project']['part:GFMC']
        for k in ('kpm', 'kim', 'mu0', 'Gdc'):
            self.assertIn(k, g['params'])
        self.assertIn('idc', g['pins'])
        self.assertGreaterEqual(sum(len(v) for v in self.now.values()), 836)

    def test_the_surface_of_4_20_1(self):
        """4.20.1: the B4 data and its builder are experimental (in pcl.dcgrid); VSC2 has the DC voltage of its start (Vdc0)."""
        from pcl import network
        for f in ('cigre_b4', 'b4_line_data', 'b4_network'):
            self.assertIn('pcl.dcgrid.' + f, self.now['pcl'])
            self.assertTrue(api_surface.experimental('pcl', 'pcl.dcgrid.' + f))
        self.assertIn('Vdc0', self.now['project']['part:VSC2']['params'])
        # one more case among the ones that are not in CASES (it is the B4 of the book, not an IEEE network)
        self.assertEqual((network.MORE[:3], len(network.CASES)), (('harmonic14', 'mtdc5', 'b4'), 10))          # (4.21: case5_acdc after them)

    def test_the_surface_of_4_20(self):
        """4.20: the DC grids: the module pcl.dcgrid is experimental; the DC buses, lines and converters of a Network, its AC/DC
        load flow and the study 'acdc' are stable additions; every option of the routine is an option of the study."""
        from pcl import study
        self.assertTrue(api_surface.experimental('pcl', 'pcl.dcgrid.acdc_flow'))
        self.assertTrue(api_surface.experimental('pcl', 'pcl.dcgrid.DCGrid.flow'))
        for m in ('dc_bus', 'dc_line', 'vsc', 'dc_grid', 'acdc_flow'):
            self.assertIn('pcl.network.Network.' + m, self.now['pcl'])
            self.assertFalse(api_surface.experimental('pcl', 'pcl.network.Network.' + m))
        self.assertEqual(study.STUDIES[-1], 'acdc')
        # (4.21: the modes of the study: the OPF AC/DC and N−1 AC/DC have their own options)
        self.assertEqual(set(study.OPTIONS['acdc']) - {'set', 'out', 'mode', 'flow_limits', 'start', 'outages'}, set(self.now['pcl']['pcl.network.Network.acdc_flow']['params']))

    def test_the_surface_of_4_21(self):
        """4.21: the DC/DC converter and the dispatcher, the OPF AC/DC and N−1 AC/DC are stable additions of the Network (their
        routines in pcl.dcgrid experimental, as the module); the phasors and the measurements from EMT of the state estimation and
        the spectrum from EMT of the harmonic load flow are experimental, as their modules; two parts, the DC/DC converter and
        the phasor measurement unit; the plain load flow has q_limits='side'."""
        from pcl import network, study
        for m in ('dcdc', 'dc_dispatcher', 'acdc_opf', 'acdc_contingency'):
            self.assertFalse(api_surface.experimental('pcl', 'pcl.network.Network.' + m), m)
        for k in ('pcl.dcgrid.DCGrid.dcdc', 'pcl.dcgrid.DCGrid.dispatcher', 'pcl.dcgrid.q_range', 'pcl.dcgrid.acdc_opf', 'pcl.dcgrid.acdc_contingency',
                  'pcl.se.from_emt', 'pcl.se.tve', 'pcl.se.pmu_start', 'pcl.harmonic.spectrum_from'):
            self.assertTrue(api_surface.experimental('pcl', k), k)
            self.assertIn(k, self.now['pcl'], k)
        for t in ('DCDC', 'PMU3'):
            self.assertIn('part:' + t, self.now['project'])
        self.assertEqual(set(self.now['project']['part:PMU3']['params']), {'f', 'np', 'ref', 'conn'})
        self.assertIn('limits', self.now['pcl']['pcl.network.Network.acdc_flow']['params'])
        for k in ('pmu', 'currents', 'emt'):
            self.assertIn(k, self.now['pcl']['pcl.se.run']['params'])
            self.assertIn(k, study.OPTIONS['se'])
        self.assertIn('spectra', study.OPTIONS['harmonic'])
        self.assertEqual(network.MORE[-1], 'case5_acdc')
        self.assertGreaterEqual(sum(len(v) for v in self.now.values()), 851)        # 851 then; 4.22 adds points

    def test_the_surface_of_4_22(self):
        """4.22: the insulation co-ordination (pcl.insulation), the method of characteristics (pcl.surge) and the places on the
        earth (pcl.geo) are experimental, as new modules; the study 'insulation' and the formats of a request are stable
        additions; one part, the disconnector, and new parameters of the line, the gap and the tower."""
        from pcl import study
        for k in ('pcl.insulation.coordinate', 'pcl.insulation.protective_zone', 'pcl.surge.solve', 'pcl.surge.from_project', 'pcl.geo.to_geojson',
                  'pcl.geo.from_geojson', 'pcl.geo.project', 'pcl.geo.haversine'):
            self.assertTrue(api_surface.experimental('pcl', k), k)
            self.assertIn(k, self.now['pcl'], k)
        self.assertIn('insulation', study.STATION_STUDIES)
        self.assertEqual(set(self.now['project']['part:DS']['params']), {'op', 't0', 'Ts', 'Um', 'Rarc', 'ext', 'Iext', 'Roff'})
        for p in ('Dco', 'dco', 'erco', 'kv', 'v0'):
            self.assertIn(p, self.now['project']['part:TL']['params'])
        for p in ('model', 'Zt1', 'Zt2', 'gam', 'arms', 'h1', 'h2', 'h3', 'Kp', 'E0p', 'Kn', 'E0n'):
            self.assertIn(p, self.now['project']['part:TOWER']['params'])
        self.assertEqual(sum(len(v) for v in self.now.values()), 886)

    def test_the_surface_of_4_19_5(self):
        # one setting of the solver more in the file format: the end of a piece of run() on the event that lies within eps after it
        # ('off': the path of before 4.19.5, for comparison)
        self.assertEqual(self.now['project']['file.solve']['params'][-1], 'evSnap')
        # the continuation load flow: the module is experimental, the method of the network and the study are stable additions
        self.assertTrue(api_surface.experimental('pcl', 'pcl.cpf.run'))
        self.assertEqual(self.now['pcl']['pcl.cpf.run']['params'], ['net', 'direction', 'q_limits', 'step', 'dV', 'lower', 'stop', 'V_stop', 'max_points', 'tol'])
        self.assertIn('pcl.network.Network.cpf', self.now['pcl'])
        self.assertFalse(api_surface.experimental('pcl', 'pcl.network.Network.cpf'))
        from pcl import netview, study
        self.assertIn('cpf', study.STUDIES)
        self.assertEqual(set(study.OPTIONS['cpf']), set(self.now['pcl']['pcl.cpf.run']['params'][1:]))      # every option of the routine is an option of the study
        self.assertIn('collapse', netview.LAYERS)
        # the sweep with compensation: six points of pcl.powerflow, a method by its name and not a proposal of the engine
        from pcl import powerflow
        for k in ('Tree', 'Tree.solve', 'Tree.patterns', 'Case.link_tree', 'sweep_comp', 'breakpoint_matrix'):
            self.assertIn('pcl.powerflow.' + k, self.now['pcl'])
        self.assertIn('sweepc', powerflow.METHODS)
        # state estimation: the module is experimental, Network.estimate and the study 'se' are stable additions
        self.assertTrue(api_surface.experimental('pcl', 'pcl.se.run'))
        self.assertFalse(api_surface.experimental('pcl', 'pcl.network.Network.estimate'))
        self.assertEqual(self.now['pcl']['pcl.se.run']['params'][:2], ['net', 'measurements'])
        self.assertEqual(set(study.OPTIONS['se']), set(self.now['pcl']['pcl.se.run']['params'][1:]))        # every option of the routine is an option of the study
        self.assertEqual((study.STUDIES[-3], netview.DEFAULT['se']), ('se', 'residual'))          # (4.20: 'acdc' after them)
        self.assertIn('residual', netview.LAYERS)
        # the harmonic load flow: the module is experimental, Network.harmonics and the study are stable; a load may carry a spectrum
        # and a shunt may be a capacitor or a tuned filter (two parameters and three more on methods that were there)
        self.assertTrue(api_surface.experimental('pcl', 'pcl.harmonic.run'))
        self.assertFalse(api_surface.experimental('pcl', 'pcl.network.Network.harmonics'))
        self.assertEqual(set(study.OPTIONS['harmonic']), set(self.now['pcl']['pcl.harmonic.run']['params'][1:]))
        self.assertEqual(self.now['pcl']['pcl.network.Network.load']['params'][-2:], ['spectrum', 'delta'])
        self.assertEqual(self.now['pcl']['pcl.network.Network.shunt']['params'][-3:], ['R', 'X', 'B'])
        self.assertEqual((study.STUDIES[-2], netview.DEFAULT['harmonic']), ('harmonic', 'thd'))
        from pcl import network
        self.assertEqual((network.MORE[:2], len(network.CASES)), (('harmonic14', 'mtdc5'), 10))
        # the three-phase load flow of a feeder: the module is experimental, the study is a stable addition with its own list (its
        # network is a feeder and not a Network); every option of the routine is an option of the study
        from pcl import unbalanced
        self.assertTrue(api_surface.experimental('pcl', 'pcl.unbalanced.run'))
        self.assertEqual(self.now['pcl']['pcl.unbalanced.run']['params'], ['feeder', 'regulators', 'spread', 'tol', 'max_iter'])
        self.assertEqual(set(study.OPTIONS['unbalanced']), set(self.now['pcl']['pcl.unbalanced.run']['params'][1:]))
        for k in ('Feeder', 'Feeder.bus', 'Feeder.set_source', 'Feeder.config', 'Feeder.line', 'Feeder.switch', 'Feeder.transformer', 'Feeder.regulator', 'Feeder.load', 'Feeder.distributed',
                  'Feeder.capacitor', 'Feeder.to_dict', 'Feeder.from_dict', 'Feeder.run', 'case_data', 'case_solution', 'as_network', 'sequence'):
            self.assertIn('pcl.unbalanced.' + k, self.now['pcl'])
        self.assertEqual((study.FEEDER_STUDIES, netview.DEFAULT['unbalanced'], unbalanced.CASES), (('unbalanced',), 'unbalance', ('feeder13',)))
        self.assertIn('unbalance', netview.LAYERS)

    def test_the_surface_of_4_19_3(self):
        # the two settings of the solver are in the file format (stable); the large network is one more name of the test networks
        self.assertEqual(self.now['project']['file.solve']['params'][11:13], ['modeVec', 'initSolver'])
        from pcl import network
        self.assertIn('pegase1354', network.CASES)

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
