"""The circuit as the plant of the Control Workbench (3.16, ROADMAP §38, §19): the workbench's plant contract on a
circuit of the app, through pcl.workbench. The workbench itself is reference material (branch ref-materials), not in
the repository: its registry is stood in for here."""
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
import pcl  # noqa: E402
import pcl.workbench as wb  # noqa: E402

HAS_NODE = shutil.which('node') is not None


@unittest.skipIf(not HAS_NODE, 'Node.js not installed (the browser solver runs in Node).')
class CircuitPlant(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        p = pcl.tutorial('dc_drive', mode='open')
        p.set('M1.TL', '0')
        cls.Plant = wb.plant_class(p, input='PWM1:d', measure='M1:w', state=['AM1:y'], u_range=(0, 1), y_range=(0, 220),
                                   state_scale=[100], solver={'hdiv': 50}, name='Μηχανή ΣΡ (PCL)')

    def test_contract(self):
        pl = self.Plant()
        self.assertEqual(pl.name, 'Μηχανή ΣΡ (PCL)')
        self.assertEqual(pl.u_range(), (0.0, 1.0))
        self.assertEqual(list(pl.measured_scale()), [220.0, 100.0])
        ys = [pl.step(0.5, 2e-3) for _ in range(25)]
        self.assertGreater(ys[-1], 5)                                        # the motor speeds up at D = 0.5
        self.assertAlmostEqual(pl.t, 0.05, delta=1e-12)
        self.assertEqual(len(pl.measured()), 2)
        self.assertGreater(abs(pl.measured()[1]), 0.1)                       # the armature current
        pl.step(5, 2e-3)                                                     # u is clipped to its range
        self.assertEqual(pl.last_u, 1.0)
        pl.reset_state()
        self.assertEqual((pl.t, pl.output()), (0.0, 0.0))
        again = [pl.step(0.5, 2e-3) for _ in range(25)]
        self.assertEqual(again, ys)                                          # reset: the same trajectory, exactly
        c = pl.clone()
        self.assertEqual(c.step(0.5, 2e-3), ys[0])                           # a clone has its own circuit
        self.assertIn('current', pl.viz_state())
        pl.close()
        c.close()

    def test_register_in_a_workbench(self):
        d = Path(tempfile.mkdtemp())
        try:
            (d / 'core').mkdir()
            (d / 'core' / '__init__.py').write_text('', encoding='utf-8')
            (d / 'core' / 'registry.py').write_text('PLANTS = {}\n\ndef register_plant(cls):\n    PLANTS[cls.id] = cls\n    return cls\n', encoding='utf-8')
            sys.modules.pop('core', None)
            sys.modules.pop('core.registry', None)
            self.assertIs(wb.register(self.Plant, d), self.Plant)
            import core.registry as reg
            self.assertIs(reg.PLANTS['pcl_circuit'], self.Plant)
        finally:
            sys.modules.pop('core', None)
            sys.modules.pop('core.registry', None)
            sys.path.remove(str(d.resolve()))
            shutil.rmtree(d, ignore_errors=True)

    def test_input_checks(self):
        p = pcl.tutorial('dc_drive', mode='open')
        with self.assertRaises(pcl.PclError):
            wb.prepare(p, 'M1', 'M1:w')                                       # not a «Σταθερά» block
        with self.assertRaises(pcl.PclError):
            wb.prepare(p, 'PWM1:d', 'Q1:w')
        pr, uid = wb.prepare(p, 'PWM1:d', 'M1:w')
        pwm = next(c for c in pr['components'] if c['id'] == 'PWM1')
        self.assertEqual((uid, pwm['params']['in_d'], pwm['params']['mode']), ('WBU', 'WBU:y', 'ext'))


if __name__ == '__main__':
    unittest.main()
