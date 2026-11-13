"""The composition of speed control with neural networks for every machine of the app (4.7, pcl/designer.py, the logic
of the Python GUI pcl/gui.py): the machines read from parts.js, the circuit composed per kind of machine with real
wires, a run of each, the choice by weighted goals, the command line, and the window when there is a screen."""
import json
import math
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from pcl import designer as D
from pcl.core import PclError

ROOT = Path(__file__).resolve().parent.parent


@unittest.skipIf(shutil.which('node') is None, 'Node.js not installed (the runs use the app solver in Node)')
class Designer(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        ms = D.machines()
        cls.ms = {m['type']: m for m in ms if m['kind'] != 'ev'}
        cls.ev = [m for m in ms if m['kind'] == 'ev']

    def test_machines_from_the_app(self):
        kinds = {m['kind'] for m in self.ms.values()}
        self.assertTrue({'dc', 'induction', 'sync', 'srm', 'gen'} <= kinds)
        dcm = self.ms['DCM']
        self.assertEqual(dcm['outputs'], ['w', 'te'])
        self.assertIn('J', [q['k'] for q in dcm['params']])
        self.assertTrue(D.supported(self.ms['GEN3']))             # 4.8.1: generators have a rule
        self.assertEqual([m['type'] for m in self.ev], ['DCM'])   # and every DC machine is also an electric vehicle
        with self.assertRaises(PclError):
            D.rule_for({'kind': 'other', 'name': 'x', 'type': 'X'})

    def test_generator_rule(self):
        # 4.8.1: AVR, PSS and governor around the generator; the fault on line 2; the AVR alone loses synchronism, the
        # DC1A base keeps it, so the AVR alone comes last (J = ∞)
        g = self.ms['GEN3']
        self.assertEqual([k for k, _ in D.goals(g)], ['swing', 'damp', 'vrec', 'freq', 'effort'])
        p = D.compose(g, 'avr_pss')
        ids = {c['id']: c['type'] for c in p.data['components']}
        self.assertEqual((ids['AV1'], ids['PS1']), ('AVR', 'PSS'))
        self.assertEqual(p.data['meta']['designer']['kind'], 'gen')
        out = D.design(g, {'swing': 1, 'damp': 1}, controller='avr', workers=2)
        labels = [r['label'] for r in out['results']]
        self.assertEqual(len(labels), 2)
        self.assertTrue(out['baseline']['metrics']['slip'] is False)
        self.assertAlmostEqual(out['baseline']['J'], 2.0)
        self.assertEqual(out['results'][-1]['controller'], 'avr')
        self.assertTrue(out['results'][-1]['metrics']['slip'])
        self.assertEqual(out['results'][-1]['J'], float('inf'))

    def test_vehicle_rule(self):
        # 4.8.1: a DC machine as the drive of an electric vehicle with the multi-objective controller (EVC)
        m = self.ev[0]
        self.assertEqual([k for k, _ in D.goals(m)], ['track', 'energy', 'irms', 'peak', 'rollback'])
        p = D.compose(m, 'moevc')
        self.assertEqual({c['id']: c['type'] for c in p.data['components']}['MO1'], 'EVC')
        res = p.run(t_end=10, channels=D.EV_KEYS, max_points=20000)
        mt = D.metrics_ev(res)
        self.assertLess(mt['track'], 5)
        self.assertTrue(10 < mt['energy'] < 200)
        self.assertGreater(mt['irms'], 1)
        self.assertIn('ηλεκτρικό όχημα', D.describe(m) + m['name'])

    def test_composed_circuits_run(self):
        for typ in ('DCM', 'IM', 'SM', 'SRM'):
            m = self.ms[typ]
            for ctrl in ('pi', 'pinn'):
                p = D.compose(m, ctrl, cycles=1)
                d = p.data
                ids = {c['id'] for c in d['components']}
                meta = d['meta']['designer']
                if ctrl == 'pinn':
                    self.assertIn('NN1', ids, msg=typ)
                    ends = {(w['a']['c'], w['a']['p'], w['b']['c'], w['b']['p']) for w in d['wires']}
                    self.assertTrue(any(e[:2] == (meta['pi'], 'y') and e[2:] == ('NN1', 'e') for e in ends), msg=typ)   # learning from the PI
                res = p.run(t_end=.04, channels=['Y:M1', 'Y:' + meta['pi']] + (['Y:NN1'] if ctrl != 'pi' else []))
                self.assertEqual(res.meta.get('warnings'), [], msg=f'{typ} {ctrl}')
                self.assertGreater(len(res.t), 10)

    def test_another_machine_of_the_same_kind(self):
        # a machine added later with a descriptor of a known kind: its type and parameters take the base machine's place
        p = D.compose(self.ms['DCM'], 'pi', params={'J': .04, 'Ra': .8}, cycles=1)
        m1 = next(c for c in p.data['components'] if c['id'] == 'M1')
        self.assertEqual((m1['params']['J'], m1['params']['Ra']), (.04, .8))

    def test_design_chooses_by_goals(self):
        out = D.design(self.ms['DCM'], {'iae': 1.0, 'load': .5}, controller='auto', cycles=2, workers=3)
        best, base = out['best'], out['baseline']
        self.assertLess(best['J'], 0.6 * base['J'])
        self.assertEqual(best['controller'], 'inv')                     # the inverse model wins on tracking
        self.assertLess(out['inverse_error'], 2.0)                      # V, RMS on the training data
        self.assertEqual(len(out['results']), 7)
        pi = [r for r in out['results'] if r['controller'] == 'pi']
        self.assertLess(min(r['metrics']['iae'] for r in pi if r['kb'] > 1), base['metrics']['iae'])   # a wider band tracks better

    def test_reinforcement_learning(self):
        # 4.8.1: the policy network (ω_r, α_r, e) beside the PI, found by policy search on the user's goals: it starts as
        # the PI (zero output), and a few iterations of evolution strategies lower J below the PI's
        from pcl.control import nn_init
        for typ in ('DCM', 'IM'):
            p = D.compose(self.ms[typ], 'rl', cycles=1, inv_net=nn_init([3, 8, 1], 1, True))
            meta = p.data['meta']['designer']
            nn = next(c for c in p.data['components'] if c['id'] == 'NN1')
            ends = {(w['a']['c'], w['a']['p'], w['b']['c'], w['b']['p']) for w in p.data['wires']}
            err = D.RULES[self.ms[typ]['kind']]['err']
            self.assertEqual((nn['params']['ins'], nn['params']['train']), ('wr, ar, ew', 'off'), msg=typ)
            self.assertTrue(any({e[:2], e[2:]} == {(err, 'y'), ('NN1', 'ew')} for e in ends), msg=typ)
            res = p.run(t_end=.04, channels=['Y:M1', 'Y:' + meta['pi'], 'Y:NN1'])
            self.assertEqual(res.meta.get('warnings'), [], msg=typ)
            self.assertEqual(max(abs(v) for v in res['Y:NN1']), 0.0, msg=typ)      # zero output: the PI alone
        out = D.design_rl(self.ms['DCM'], {'iae': 1.0, 'load': 1.0}, cycles=2, workers=3, iters=3, population=4)
        best, base = out['best'], out['baseline']
        self.assertEqual(best['controller'], 'rl')
        self.assertEqual(len(out['rl']), 3)
        self.assertEqual(out['rl'][-1]['episodes'], 12)
        self.assertLess(best['J'], 0.9 * base['J'])                    # 12 episodes: J 2 → 1.66 (24 episodes: 1.06)
        self.assertEqual([r['controller'] for r in out['results']], ['rl', 'pi'])
        self.assertIn('12 επεισόδια', best['label'])
        self.assertEqual(json.loads(next(c for c in best['project'].data['components'] if c['id'] == 'NN1')['params']['w'])['sizes'], [3, 8, 1])

    def test_command_line(self):
        with tempfile.TemporaryDirectory() as d:
            out = Path(d) / 'dc.pcl.json'
            r = subprocess.run([sys.executable, '-m', 'pcl', 'design', '--machine', 'DCM', '--controller', 'pi', '--cycles', '1', '--goal', 'iae=1',
                                '--out', str(out)], capture_output=True, text=True, cwd=str(ROOT), timeout=600)
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertIn('PI, εύρος ζώνης ×1.4', r.stdout)
            self.assertEqual(json.loads(out.read_text(encoding='utf-8'))['meta']['designer']['machine'], 'DCM')

    @unittest.skipIf(not os.environ.get('DISPLAY'), 'no screen for the window (tests run the logic above)')
    def test_window(self):
        try:
            from pcl import gui
        except ImportError:
            self.skipTest('no tkinter')
        w = gui.DesignerGUI(app=None, offline=True)
        try:
            for _ in range(10):
                w.update()
            self.assertIn('DCM', [m['type'] for m in w.machines])
            w.compose()
            self.assertIn('Συντέθηκε', w.status.get())
        finally:
            w.destroy()



@unittest.skipIf(shutil.which('node') is None, 'Node.js not installed.')
class RLKinds(unittest.TestCase):
    """4.9.1 (4.8.2 e): RL also for generators (AVR + PSS + a policy beside the stabilizer) and vehicles (PI + a policy)."""

    @classmethod
    def setUpClass(cls):
        cls.ms = {m['type'] + ':' + m['kind']: m for m in D.machines()}

    def test_rl_is_offered(self):
        self.assertIn('rl', [k for k, _ in D.controllers(self.ms['GEN3:gen'])])
        self.assertIn('rl', [k for k, _ in D.controllers(self.ms['DCM:ev'])])

    def test_generator_policy_starts_as_avr_pss(self):
        # zero weights: the AVR + PSS (the policy's clock only moves the points of the steps of TR); other weights: another machine
        import numpy as np
        from pcl.control import nn_init
        ch = ['Y:SG1:d', 'Y:SG1:vt', 'Y:AV1/EFD']
        a = D.compose_gen(self.ms['GEN3:gen'], 'avr_pss').run(t_end=1.1, channels=ch, max_points=4000)
        b = D.compose_gen_rl(self.ms['GEN3:gen'], None).run(t_end=1.1, channels=ch + ['Y:NN1'], max_points=4000)
        net = nn_init([3, 8, 1], 3, False)
        c = D.compose_gen_rl(self.ms['GEN3:gen'], net).run(t_end=1.1, channels=ch, max_points=4000)
        pre, aft = np.linspace(0.05, 0.99, 100), np.linspace(1.0, 1.1, 50)
        at = lambda r, k, tq: np.interp(tq, r.t, r[k])
        self.assertEqual(max(abs(x) for x in b['Y:NN1']), 0.0)
        self.assertLess(np.max(np.abs(at(a, 'Y:SG1:d', pre) - at(b, 'Y:SG1:d', pre))), 0.05)       # before the fault
        self.assertLess(np.max(np.abs(at(a, 'Y:SG1:vt', pre) - at(b, 'Y:SG1:vt', pre))), 2e-3)   # the start itself within 1e-2 in E_fd (4.8.1)
        self.assertLess(np.max(np.abs(at(a, 'Y:SG1:d', aft) - at(b, 'Y:SG1:d', aft))), 0.2)        # through the fault
        self.assertGreater(np.max(np.abs(at(b, 'Y:AV1/EFD', pre) - at(c, 'Y:AV1/EFD', pre))), 1e-3)
        p = D.compose(self.ms['GEN3:gen'], 'rl', inv_net=net)
        self.assertEqual(p.data['meta']['designer']['controller'], 'rl')
        self.assertEqual(D._comp(p.data, 'NN1')['params']['ins'], 'dw, dp, dv')

    def test_vehicle_policy_search(self):
        # one iteration of two episodes: the base (PI) J = Σw, the policy's J finite and not worse than the start
        out = D.design_rl_kind(self.ms['DCM:ev'], {'track': 1.0, 'energy': 1.0}, workers=3, iters=1, population=2)
        labels = [r['controller'] for r in out['results']]
        self.assertEqual(sorted(labels), ['pi', 'rl'])
        self.assertAlmostEqual(out['baseline']['J'], 2.0, places=9)
        rl = next(r for r in out['results'] if r['controller'] == 'rl')
        self.assertTrue(math.isfinite(rl['J']))
        self.assertLess(rl['J'], 2.05)
        self.assertEqual(out['rl'][-1]['episodes'], 2)
        self.assertEqual(D._comp(rl['project'].data, 'C1')['params']['scheme'], 'inv')


if __name__ == '__main__':
    unittest.main()
