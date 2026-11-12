"""The composition of speed control with neural networks for every machine of the app (4.7, pcl/designer.py, the logic
of the Python GUI pcl/gui.py): the machines read from parts.js, the circuit composed per kind of machine with real
wires, a run of each, the choice by weighted goals, the command line, and the window when there is a screen."""
import json
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
        cls.ms = {m['type']: m for m in D.machines()}

    def test_machines_from_the_app(self):
        kinds = {m['kind'] for m in self.ms.values()}
        self.assertTrue({'dc', 'induction', 'sync', 'srm', 'gen'} <= kinds)
        dcm = self.ms['DCM']
        self.assertEqual(dcm['outputs'], ['w', 'te'])
        self.assertIn('J', [q['k'] for q in dcm['params']])
        self.assertFalse(D.supported(self.ms['GEN3']))
        with self.assertRaises(PclError):
            D.rule_for(self.ms['GEN3'])

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


if __name__ == '__main__':
    unittest.main()
