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



class _ScreenStandIn:
    """pcl.link.App as far as the LivePlant uses it, with the app's simulation stood in for by a solver session in Node
    (the same web/studio code): load, project, channels, info, advance, reset."""

    def __init__(self, project):
        self.p = pcl.Project(project.data if isinstance(project, pcl.Project) else project)
        self.calls = []
        self._open()

    def _open(self):
        from pcl.core import _Session
        self.s = _Session()
        self.keys = self.s({'action': 'channels', 'project': self.p.data})['keys']
        o = self.s({'action': 'open', 'project': self.p.data, 'channels': self.keys[:1], 'check': False, 'hdiv': 50})
        self.sid, self.t = o['sid'], float(o['t'])
        self.watch = self.keys[:1]

    def project(self):
        return pcl.Project(self.p.data)

    def load(self, data):
        self.calls.append('load')
        self.p = pcl.Project(data)
        self.s.close()
        self._open()

    def channels(self):
        return {'keys': list(self.keys)}

    def info(self):
        return {'t': self.t}

    def advance(self, dt, set=None, keys=None, draw=False):   # noqa: A002
        self.calls.append('advance')
        if list(keys or []) != self.watch:
            self.s({'action': 'close', 'sid': self.sid})
            o = self.s({'action': 'open', 'project': self.p.data, 'channels': list(keys), 'check': False, 'hdiv': 50})
            self.sid, self.t, self.watch = o['sid'], float(o['t']), list(keys)
        q = {'action': 'advance', 'sid': self.sid, 't_end': self.t + dt, 'max_points': 4}
        if set:
            q['set'] = {k[:-2] if k.endswith('.v') else k: v for k, v in set.items()}
        out = self.s(q)
        self.t = float(out['t1'])
        return {'t': self.t, 'values': {k: out['ch'][k][-1] for k in keys}}

    def reset(self):
        self.calls.append('reset')
        self.s({'action': 'close', 'sid': self.sid})
        o = self.s({'action': 'open', 'project': self.p.data, 'channels': self.watch, 'check': False, 'hdiv': 50})
        self.sid, self.t = o['sid'], float(o['t'])
        return {'t': self.t}


@unittest.skipIf(not HAS_NODE, 'Node.js not installed (the browser solver runs in Node).')
class LivePlant(unittest.TestCase):
    """4.9.1 (4.8.2 a): the workbench's controller on the circuit of the screen (pcl.link advance/reset); here the screen
    is stood in for, the app's side of advance is checked in tests/ui/addons_flow.js."""

    @classmethod
    def setUpClass(cls):
        p = pcl.tutorial('dc_drive', mode='open')
        p.set('M1.TL', '0')
        cls.p = p
        cls.args = dict(input='PWM1:d', measure='M1:w', state=['AM1:y'], u_range=(0, 1), y_range=(0, 220), state_scale=[100], solver={'hdiv': 50})

    def test_same_steps_as_off_screen(self):
        app = _ScreenStandIn(self.p)
        Live = wb.live_plant_class(app, **self.args)
        Off = wb.plant_class(self.p, **self.args)
        a, b = Live(), Off()
        ya = [a.step(0.5, 2e-3) for _ in range(20)]
        yb = [b.step(0.5, 2e-3) for _ in range(20)]
        self.assertEqual(app.calls[0], 'load')                   # PWM1:d is a signal input: the screen gets the block WBU
        for x, y in zip(ya, yb):
            self.assertAlmostEqual(x, y, delta=1e-9 * max(1, abs(y)))
        self.assertAlmostEqual(a.t, 0.04, delta=1e-12)
        self.assertGreater(ya[-1], 5)
        a.reset_state()
        self.assertEqual(a.t, 0.0)
        self.assertIn('reset', app.calls)
        c = a.clone()                                              # the copy for the offline steps is off the screen
        self.assertNotIsInstance(c, wb.LivePlant)
        n = len(app.calls)
        c.step(0.5, 2e-3)
        self.assertEqual(len(app.calls), n)
        b.close()
        c.close()
        app.s.close()

    def test_live_target_keep_learning(self):
        # run_live: a scheme with offline steps (they run on the copy) and an online one (on the screen), the set-point
        # held from a list as the live slider, keep learning on and off
        app = _ScreenStandIn(self.p)
        Live = wb.live_plant_class(app, **self.args)

        class PI:                                                  # the workbench's scheme contract, the parts run_live uses
            def __init__(self, plant, dt):
                self.plant, self.dt, self.log, self._done_steps, self.setpoint = plant, dt, {'r': [], 'y': [], 'u': []}, set(), None
                self.adapt_emu = self.adapt_ctrl = True
                self.offline_on = []
                self.i = 0.0

            def steps(self):
                S = type('S', (), {})
                a, b = S(), S()
                a.id, b.id = 'excite', 'online'
                return [a, b]

            def run_step(self, sid):
                self.offline_on.append(type(self.plant).__name__)
                self.plant.step(0.3, self.dt)

            def set_setpoint(self, v):
                self.setpoint = v

            def micro_step(self):
                y = self.plant.output()
                e = self.setpoint - y
                self.i += e * self.dt
                u = min(1, max(0, 0.004 * e + 0.3 * self.i))
                self.plant.step(u, self.dt)
                for k, v in (('r', self.setpoint), ('y', self.plant.output()), ('u', u)):
                    self.log[k].append(v)
                return True
        sc = PI(Live(), 2e-3)
        log = wb.run_live(sc.plant, sc, [(40, 60.0), (40, 120.0)], 2e-3, learn=False)
        self.assertEqual(sc.offline_on, ['PclCircuitPlant'])      # the offline step on the copy
        self.assertEqual(len(log['y']), 80)
        self.assertEqual(log['r'][0], 60.0)
        self.assertEqual(log['r'][-1], 120.0)
        self.assertFalse(sc.adapt_emu)
        self.assertGreater(log['y'][-1], log['y'][39])             # it follows the new target
        self.assertGreaterEqual(app.calls.count('advance'), 80)
        app.s.close()


if __name__ == '__main__':
    unittest.main()
