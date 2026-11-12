"""The neural network block (4.7): web/studio/nn.js and the block NN of the browser solver, against the same arithmetic in
Python (pcl.control.nn_init for the start, engine.batch for the forward pass and the learning), and its behaviour in a
simulation: online learning, snapshot, live changes, freezing, weights that do not fit, fixed weights."""
import json
import math
import shutil
import subprocess
import unittest
from pathlib import Path

from engine.batch import _nn_fwd, _nn_learn
from pcl.control import nn_init, nn_text, nn_block

JS = Path(__file__).resolve().parent / 'js' / 'nn_cases.js'


@unittest.skipIf(shutil.which('node') is None, 'Node.js not installed')
class NeuralNetworkBlock(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        run = subprocess.run(['node', str(JS)], capture_output=True, text=True, timeout=300)
        if run.returncode:
            raise RuntimeError(run.stderr)
        cls.r = json.loads(run.stdout)

    def test_same_start_and_forward_pass_as_python(self):
        for q, a in zip(self.r['init'], self.r['fwd']):
            net = nn_init(q['sizes'], q['seed'], q['zero'])
            for La, Lb in zip(net['W'], q['net']['W']):                    # the same generator (log and cos may differ in the last bit)
                for ra, rb in zip(La, Lb):
                    for u, v in zip(ra, rb):
                        self.assertAlmostEqual(u, v, delta=4e-16 * max(1, abs(v)))
            acts = _nn_fwd(q['net'], [0.3, -0.7, 0.25][:q['sizes'][0]])
            for la, lb in zip(acts, a):
                for u, v in zip(la, lb):
                    self.assertAlmostEqual(u, v, delta=1e-15 * max(1, abs(v)))

    def test_same_learning_steps_as_python(self):
        for case in self.r['learn']:
            net = nn_init([2, 4, 1], 3, False)
            n = sum(len(L) * len(L[0]) for L in net['W']) + sum(len(b) for b in net['b'])
            opt = {'k': 0, 'm': [0.0] * n, 'v': [0.0] * n} if case['opt'] == 'adam' else {'k': 0}
            for x, g in case['steps']:
                _nn_learn(net, opt, _nn_fwd(net, x), g, .05, .5, .01, case['opt'])
            for La, Lb in zip(net['W'], case['net']['W']):
                for ra, rb in zip(La, Lb):
                    for u, v in zip(ra, rb):
                        self.assertAlmostEqual(u, v, delta=1e-12, msg=case['opt'])

    def test_learns_online_and_keeps_state(self):
        r = self.r
        self.assertEqual(r['warnings'], [])                                 # fz is optional
        self.assertLess(r['curve'][-1], 0.4 * r['curve'][0])                # the error falls as it learns
        self.assertEqual(r['updates'], 2001)                                # one update per sample: 1 kHz, t = 0 … 2 s
        self.assertEqual(r['snap'][0], r['snap'][1])                        # snapshot: weights and Adam moments
        self.assertEqual(r['snap'][2], r['snap'][3])
        self.assertTrue(r['keep'])                                          # a live change keeps what it learned
        self.assertTrue(r['replace'])                                       # new weights replace it

    def test_freeze(self):
        k1, k2 = self.r['freeze']
        self.assertAlmostEqual(k1, 999, delta=1)
        self.assertEqual(k1, k2)                                            # fz ≥ 0.5 from 1 s: no more updates
        self.assertEqual(self.r['nolearn'], 0)

    def test_weights_that_do_not_fit_and_fixed_weights(self):
        self.assertEqual(len(self.r['misfit']), 1)
        self.assertIn('2 εισόδους', self.r['misfit'][0])
        self.assertIn('JSON', self.r['badjson'][0])
        y, ref = self.r['fixed']
        self.assertAlmostEqual(y, ref, delta=1e-12)
        self.assertTrue(self.r['text'])

    def test_tutorials(self):
        T = self.r['tut']
        for k, v in T.items():
            self.assertEqual(v['warnings'], [], msg=k)
        pi = T['pi']['per']
        self.assertAlmostEqual(pi[3], pi[1], delta=0.01 * pi[1])                       # the PI alone: the same every cycle
        on = T['pinn']['per']
        self.assertTrue(all(b < a for a, b in zip(on, on[1:])), msg=on)                 # online: better every cycle
        self.assertLess(on[-1], 0.3 * pi[-1])
        inv = T['inv']['per']
        self.assertLess(max(inv), 0.1 * pi[0])                                          # the inverse model from the start
        self.assertGreater(T['inv_step']['per'][-1], 2 * inv[-1])                       # a load it was not trained for
        self.assertLess(T['inv_step']['per'][-1], 0.3 * T['pi_step']['per'][-1])       # … and the PI covers the difference
        self.assertLess(T['fast']['per'][0], 0.5 * pi[0])                               # learns within the first cycle
        self.assertGreater(T['frozen']['L'], 3 * T['fast']['L'])                         # frozen at 2 s: the PI does it all
        self.assertAlmostEqual(T['frozen']['k'], 2001, delta=1)                          # no update after the freeze
        self.assertLess(T['ref']['per'][-1], 0.5 * pi[-1])                              # a new pattern in the same range

    def test_block_parameters_from_python(self):
        net = nn_init([2, 6, 1], 4, False)
        p = nn_block('r, y', net, hidden=(6,), xs=(10, 10), ys=0.5, train='err', clock='CLK1', lr=1e-3)
        self.assertEqual(p['ins'], 'r, y')
        self.assertEqual(p['xs'], '10, 10')
        self.assertEqual(json.loads(p['w'])['sizes'], [2, 6, 1])
        self.assertEqual(json.loads(nn_text(net))['W'][0][0][0], float(f"{net['W'][0][0][0]:.9g}"))
        with self.assertRaises(ValueError):
            nn_block('r', net)
        self.assertTrue(math.isfinite(p['ys']))


if __name__ == '__main__':
    unittest.main()
