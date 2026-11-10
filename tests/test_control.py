"""Control loops composed from choices, classical and neural (3.15, ROADMAP §38): pcl.control on the DC drive plant.
3.16 (stage 2): the inverse ANN with emulator trained in phases, RL by policy search, the comparison with the PI."""
import json
import math
import shutil
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
import pcl  # noqa: E402
from pcl import control as C  # noqa: E402

HAS_NODE = shutil.which('node') is not None
La, Ra, J, Vdc = 10e-3, .5, .02, 220
AC = 2 * math.pi * 200
AS = AC / 10


def loops(kind, learn=True):
    return [{'name': 'ω', 'measure': 'M1:w', 'ref': '0:0, 0.02:100, 0.2:150', 'yscale': 150,
             'ctrl': {'type': kind, 'Kp': AS * J, 'Ki': AS * AS * J / 4, 'lo': -30, 'hi': 30, 'learn': learn, 'lr': 0.05}},
            {'name': 'i', 'measure': 'AM1:y', 'yscale': 30, 'ctrl': {'type': 'pi', 'Kp': AC * La, 'Ki': AC * Ra, 'lo': 0, 'hi': Vdc}, 'scale': 1 / Vdc}]


class Compose(unittest.TestCase):
    def test_structure_and_errors(self):
        p = {'components': [{'id': 'PWM1', 'type': 'PWM', 'params': {'D': .5}, 'x': 0, 'y': 0}, {'id': 'AM1', 'type': 'AM', 'params': {}, 'x': 0, 'y': 0},
                            {'id': 'M1', 'type': 'DCM', 'params': {}, 'x': 0, 'y': 0}], 'wires': []}
        q, d = C.compose(p, loops('pi_nn'), actuator='PWM1:d')
        ids = {c['id']: c for c in q['components']}
        self.assertEqual([x['block'] for x in d], ['AC1C', 'AC2C'])
        self.assertEqual(ids['PWM1']['params']['mode'], 'ext')
        self.assertEqual(ids['PWM1']['params']['in_d'], 'AC2G:y')             # the inner loop, scaled, drives the duty
        self.assertEqual(ids['AC2E']['params']['in_a'], 'AC1C:u')             # the outer output is the inner reference
        self.assertEqual(ids['AC1C']['type'], 'PY')
        self.assertEqual(ids['AC2C']['type'], 'PIB')
        self.assertIn('lr = 0.05', ids['AC1C']['params']['pars'])
        self.assertEqual(q['control']['composed']['actuator'], 'PWM1:d')
        q2, _ = C.compose(q, loops('pi')[:1], actuator='PWM1:d')               # a new composition replaces the old one
        self.assertEqual(sorted(c['id'] for c in q2['components'] if c['id'].startswith('AC')), ['AC1C', 'AC1E', 'AC1R'])
        self.assertEqual(p['components'][0]['params'], {'D': .5})              # the original is left as it was
        with self.assertRaises(ValueError):
            C.compose(p, loops('pi'), actuator='PWM9:d')
        with self.assertRaises(ValueError):
            C.compose(p, [{'name': 'x', 'measure': 'Q1:y'}], actuator='PWM1:d')
        with self.assertRaises(ValueError):
            C.compose(p, [{'name': 'x', 'measure': 'AM1:y', 'ctrl': {'type': 'magic'}}], actuator='PWM1:d')

    def test_metrics_closed_form(self):
        t = [k * 1e-3 for k in range(1001)]
        r = [1.0] * len(t)
        y = [1 - math.exp(-x / 0.1) for x in t]                                  # IAE = τ(1 − e^(−T/τ)), ISE = τ/2(1 − e^(−2T/τ))
        m = C.metrics(t, r, y)
        self.assertAlmostEqual(m['IAE'], 0.1 * (1 - math.exp(-10)), delta=1e-6)
        self.assertAlmostEqual(m['ISE'], 0.05 * (1 - math.exp(-20)), delta=1e-5)          # trapezoidal, h = 1 ms
        self.assertEqual(m['overshoot_pct'], 0.0)


@unittest.skipIf(not HAS_NODE, 'Node.js not installed (the browser solver runs in Node).')
class OnTheDrive(unittest.TestCase):
    """The DC drive of the tutorial in open loop is the plant; the loops are composed on it."""

    @classmethod
    def setUpClass(cls):
        cls.plant = pcl.tutorial('dc_drive', mode='open')
        cls.res = {}
        for name, kind, learn in (('pi', 'pi', True), ('frozen', 'pi_nn', False), ('learn', 'pi_nn', True)):
            q, _ = C.compose(cls.plant, loops(kind, learn), actuator='PWM1:d')
            ch = ['Y:M1', 'Y:AC1R'] + (['Y:AC1C:nn'] if name == 'learn' else [])      # the same channels: the same decimation
            r = q.run(t_end=0.4, channels=ch, max_points=20000)
            cls.res[name] = (r, C.metrics(r.t, r['Y:AC1R'], r['Y:M1']))

    def test_classical_cascade_tracks(self):
        r, m = self.res['pi']
        self.assertAlmostEqual(r['Y:M1'][-1], 150, delta=0.05)                   # after the load step of 10 N·m at 0.25 s
        self.assertLess(m['overshoot_pct'], 2)

    def test_untrained_network_is_the_pi(self):
        (a, ma), (b, mb) = self.res['pi'], self.res['frozen']                  # (decimated differently: another channel count)
        self.assertEqual(a['Y:M1'][-1], b['Y:M1'][-1])
        for k in ('IAE', 'ISE', 'overshoot_pct'):
            self.assertAlmostEqual(ma[k], mb[k], delta=1e-9 * max(1.0, abs(ma[k])))
        q, _ = C.compose(self.plant, loops('pi_nn', False), actuator='PWM1:d')
        self.assertEqual(max(abs(v) for v in q.run(t_end=0.05, channels=['Y:AC1C:nn'])['Y:AC1C:nn']), 0.0)
        self.assertEqual(a['Y:M1'], b['Y:M1'])

    def test_network_learns_the_load(self):
        r, m = self.res['learn']
        self.assertAlmostEqual(r['Y:M1'][-1], 150, delta=0.05)                   # stable, on the reference
        nn = r['Y:AC1C:nn'][-1]
        i_load = 10 / 1.0 + 0.002 * 150 / 1.0                                    # (T_L + b·ω)/ψ
        self.assertGreater(nn, 0.5 * i_load)                                     # most of the load current is learned
        self.assertLess(nn, 1.5 * i_load)
        self.assertLess(m['IAE'], 1.02 * self.res['pi'][1]['IAE'])


def loops2(kind='pi', ctrl=None):
    """The 3.16 cascade: the speed loop sampled every 1 ms, with the armature current as its state."""
    return [{'name': 'ω', 'measure': 'M1:w', 'ref': '0:0, 0.02:100, 0.2:150', 'yscale': 150, 'Ts': 1e-3, 'state': ['AM1:y'], 'state_scale': [30],
             'ctrl': {'type': kind, 'Kp': AS * J, 'Ki': AS * AS * J / 4, 'lo': -30, 'hi': 30, **(ctrl or {})}},
            {'name': 'i', 'measure': 'AM1:y', 'yscale': 30, 'ctrl': {'type': 'pi', 'Kp': AC * La, 'Ki': AC * Ra, 'lo': 0, 'hi': Vdc}, 'scale': 1 / Vdc}]


class Networks(unittest.TestCase):
    def test_gradients_against_differences(self):
        net = C.mlp_new([3, 5, 4, 1], seed=3)
        x = [0.3, -0.7, 0.2]
        acts = C.mlp_fwd(net, x)
        gW, gb, dx = C.mlp_back(net, acts, [1.0])
        h = 1e-6
        for j in range(3):                                      # ∂y/∂x
            xp = list(x)
            xp[j] += h
            self.assertAlmostEqual((C.mlp_fwd(net, xp)[-1][0] - acts[-1][0]) / h, dx[j], delta=1e-5)
        flat = C.mlp_flat(net)
        k = 0
        for li, (W, b) in enumerate(zip(net['W'], net['b'])):    # ∂y/∂w for every weight, in the order of mlp_flat
            for o in range(len(W)):
                for i2 in range(len(W[o])):
                    fp = list(flat)
                    fp[k] += h
                    y1 = C.mlp_fwd(C.mlp_set(C.mlp_new(net['sizes'], 0), fp), x)[-1][0]
                    self.assertAlmostEqual((y1 - acts[-1][0]) / h, gW[li][o][i2], delta=1e-5)
                    k += 1
            k += len(b)
        self.assertEqual(len(flat), 3 * 5 + 5 + 5 * 4 + 4 + 4 + 1)
        e0 = C.mlp_train(C.mlp_set(C.mlp_new(net['sizes'], 0), flat), x, [0.5], 0.0)
        n2 = C.mlp_set(C.mlp_new(net['sizes'], 0), flat)
        for _ in range(50):
            C.mlp_train(n2, x, [0.5], 0.05)
        self.assertLess(C.mlp_train(n2, x, [0.5], 0.0), 0.01 * e0)

    def test_compose_stage2_structure(self):
        p = {'components': [{'id': 'PWM1', 'type': 'PWM', 'params': {}, 'x': 0, 'y': 0}, {'id': 'AM1', 'type': 'AM', 'params': {}, 'x': 0, 'y': 0},
                            {'id': 'M1', 'type': 'DCM', 'params': {}, 'x': 0, 'y': 0}], 'wires': []}
        L = loops2('rl')
        L[0]['dither'] = '0:0, 0.1:1'
        q, d = C.compose(p, L, actuator='PWM1:d')
        ids = {c['id']: c for c in q['components']}
        self.assertEqual(ids['AC1K']['type'], 'CLK')
        self.assertAlmostEqual(ids['AC1K']['params']['f'], 1000.0)
        self.assertEqual(ids['AC1C']['params']['clock'], 'AC1K')                 # the speed loop on its own clock
        self.assertEqual(ids['AC2C']['params']['clock'], 'PWM1')                 # the current loop on the PWM's
        self.assertEqual(ids['AC1C']['params']['ins'], 'e, r, y, s1')
        self.assertEqual(ids['AC1C']['params']['in_s1'], 'AM1:y')
        self.assertEqual(ids['AC2E']['params']['in_a'], 'AC1U:y')                # the dither is added to the speed loop's output
        self.assertEqual(d[0]['u'], 'AC1U:y')
        self.assertIn('THETA = json.loads', ids['AC1C']['params']['code'])
        with self.assertRaises(ValueError):
            C.compose(p, loops2('inv_nn'), actuator='PWM1:d')                   # no networks before the training
        bad = loops2('rl')
        bad[0]['state'] = ['Q9:y']
        with self.assertRaises(ValueError):
            C.compose(p, bad, actuator='PWM1:d')


@unittest.skipIf(not HAS_NODE, 'Node.js not installed (the browser solver runs in Node).')
class Stage2OnTheDrive(unittest.TestCase):
    """ROADMAP §38 stage 2 on the DC drive: the speed loop's controller is the AI one, the current loop stays the PI."""

    @classmethod
    def setUpClass(cls):
        cls.plant = pcl.tutorial('dc_drive', mode='open')
        cls.sv = {'hdiv': 50}
        tr = C.InverseTrainer(cls.plant, loops2(), 'PWM1:d', loop='ω', t_excite=0.5, epochs_emu=20, epochs_ctrl=20, run=cls.sv)
        cls.info = tr.excite()
        cls.emu = tr.emulator()
        tr = C.InverseTrainer.from_dict(json.loads(json.dumps(tr.to_dict())))   # the phases may run in separate calls
        cls.ctrl = tr.controller()
        cls.tr = tr
        cls.rows, cls.waves = C.compare(cls.plant, loops2(), 'PWM1:d', [('PI', {}), ('frozen', {'ω': tr.ctrl_spec(False)}), ('online', {'ω': tr.ctrl_spec(True)}),
                                                                          ('rl0', {'ω': {'type': 'rl'}})], 0.4, run=cls.sv)
        cls.m = {r['name']: r for r in cls.rows}

    def test_phases(self):
        self.assertEqual(self.info['samples'], 500)                               # 0.5 s at T_s = 1 ms
        self.assertGreater(self.info['y'][1], 60)                                 # the random reference moved the speed
        self.assertLess(self.emu[-1], 0.5 * self.emu[0])                          # the emulator learned
        self.assertLess(self.ctrl[-1], self.ctrl[0])
        self.assertEqual([s['done'] for s in self.tr.status()], [True, True, True, False])
        pr, desc = self.tr.online()
        self.assertEqual(desc[0]['ctrl'], 'inv_nn')
        self.assertIn('NETS = json.loads', next(c for c in pr.data['components'] if c['id'] == 'AC1C')['params']['code'])

    def test_inverse_against_the_pi(self):
        m = self.m
        self.assertTrue(all('error' not in r for r in self.rows), self.rows)
        self.assertLess(m['online']['IAE'], 0.95 * m['PI']['IAE'])                # better tracking than the PI …
        self.assertLess(abs(m['online']['final_error']), 0.05)                    # … and the load learned online
        self.assertGreater(abs(m['frozen']['final_error']), 0.3)                  # frozen networks do not know the load

    def test_untrained_policy_is_the_pi(self):
        self.assertEqual(self.waves['rl0'][2], self.waves['PI'][2])
        self.assertEqual(self.m['rl0']['IAE'], self.m['PI']['IAE'])

    def test_policy_search(self):
        tr = C.RLTrainer(self.plant, loops2(), 'PWM1:d', loop=0, t_end=0.25, population=4, sigma=0.1, lr=0.05, run=self.sv, workers=2)
        h = tr.iterate(2)
        self.assertEqual(len(h), 2)
        b = tr.baseline
        self.assertAlmostEqual(b['J'], 1 + b['metrics'][0]['overshoot_pct'] / 100, delta=1e-12)
        self.assertLessEqual(tr.best['J'], b['J'])
        tr2 = C.RLTrainer.from_dict(json.loads(json.dumps(tr.to_dict())))
        tr2.iterate(1)
        self.assertEqual(len(tr2.hist), 3)
        pr, desc = tr2.project()
        self.assertEqual(desc[0]['ctrl'], 'rl')


if __name__ == '__main__':
    unittest.main()
