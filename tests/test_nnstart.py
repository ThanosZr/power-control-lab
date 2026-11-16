"""4.19.2 (ROADMAP §68 point 5, THEORY §8Θ): a neural network as the starting point of a solver (pcl/nnstart.py), the warm
start of the interior-point method (pcl/ipm.py, pcl/opf.py) and the ONNX files (pcl/onnxio.py). What is checked everywhere:
the solver verifies. From a good proposal the optimal power flow needs fewer iterations and gives the same optimum; a bad,
foreign or misfit proposal is ignored or abandoned, and the answer is still that of the normal start."""
import contextlib
import io
import os
import sys
import tempfile
import unittest

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from pcl import network as N
from pcl import nnstart as NS
from pcl import onnxio as OX
from pcl import opf as OPF
from pcl import powerflow as PF
from pcl.__main__ import main as cli

try:
    import onnx
    import onnxruntime
except ImportError:                                    # the reference tools are installed in the CI only
    onnx = onnxruntime = None


def scenario(net, seed, spread=0.2):
    case = net.case()
    ib = NS.layout(net, case, 'opf')[0]
    rng = np.random.default_rng(seed)
    S = case.load[ib, 2]
    d = np.zeros(case.n, complex)
    d[ib] = -((rng.uniform(1 - spread, 1 + spread, len(ib)) - 1) * S.real + 1j * (rng.uniform(1 - spread, 1 + spread, len(ib)) - 1) * S.imag)
    return d * net.S_base


@contextlib.contextmanager
def pcl_home():
    with tempfile.TemporaryDirectory() as d:
        old = os.environ.get('PCL_HOME')
        os.environ['PCL_HOME'] = d
        try:
            yield d
        finally:
            if old is None:
                os.environ.pop('PCL_HOME', None)
            else:
                os.environ['PCL_HOME'] = old


class Onnx(unittest.TestCase):
    def net(self, dtype=np.float64):
        rng = np.random.default_rng(0)
        W = [rng.standard_normal((5, 8)), rng.standard_normal((8, 8)), rng.standard_normal((8, 3))]
        b = [rng.standard_normal(8), rng.standard_normal(8), rng.standard_normal(3)]
        st = (rng.standard_normal(5), 1 + rng.random(5), rng.standard_normal(3), 1 + rng.random(3))
        X = rng.standard_normal((7, 5))
        h = (X - st[0]) / st[1]
        ref = (np.tanh(np.tanh(h @ W[0] + b[0]) @ W[1] + b[1]) @ W[2] + b[2]) * st[3] + st[2]
        return OX.mlp(W, b, *st, meta={'note': 'κείμενο', 'k': 'v'}, dtype=dtype), X, ref

    def test_write_read_evaluate(self):
        m, X, ref = self.net()
        self.assertLess(np.abs(OX.run(m, X)['y'] - ref).max(), 1e-13)
        with tempfile.TemporaryDirectory() as d:
            p = OX.write(os.path.join(d, 'm.onnx'), m)
            r = OX.read(p)
        self.assertEqual((r['inputs'], r['outputs'], r['opset'], r['meta']), ([('x', ('batch', 5))], [('y', ('batch', 3))], 13, {'note': 'κείμενο', 'k': 'v'}))
        self.assertEqual([n['op'] for n in r['nodes']], ['Sub', 'Div', 'MatMul', 'Add', 'Tanh', 'MatMul', 'Add', 'Tanh', 'MatMul', 'Add', 'Mul', 'Add'])
        self.assertTrue(all(np.array_equal(r['init'][k], m['init'][k]) and r['init'][k].dtype == np.float64 for k in m['init']))
        self.assertTrue(np.array_equal(OX.run(r, X)['y'], OX.run(m, X)['y']))                  # the same graph: bit for bit
        self.assertEqual(OX.dumps(r | {'dtype': np.float64}), OX.dumps(m))                     # and the same bytes again

    def test_other_layers_and_what_is_refused(self):
        rng = np.random.default_rng(1)
        Wg, bg = rng.standard_normal((4, 5)).astype(np.float32), rng.standard_normal(4).astype(np.float32)
        g = {'inputs': [('in', ('n', 5))], 'outputs': [('out', ('n', 4))], 'dtype': np.float32, 'init': {'W': Wg, 'b': bg},
             'nodes': [{'op': 'Gemm', 'inputs': ['in', 'W', 'b'], 'outputs': ['g'], 'attrs': {'alpha': 0.5, 'beta': 2.0, 'transB': 1}},
                       {'op': 'Relu', 'inputs': ['g'], 'outputs': ['r']}, {'op': 'Sigmoid', 'inputs': ['r'], 'outputs': ['s']},
                       {'op': 'Neg', 'inputs': ['s'], 'outputs': ['out']}]}
        x = rng.standard_normal((3, 5)).astype(np.float32)
        ref = -1 / (1 + np.exp(-np.maximum(0.5 * (x @ Wg.T) + 2.0 * bg, 0)))
        r = OX.loads(OX.dumps(g))
        self.assertEqual(r['nodes'][0]['attrs'], {'alpha': 0.5, 'beta': 2.0, 'transB': 1})
        self.assertLess(np.abs(OX.run(r, x)['out'] - ref).max(), 1e-6)
        with self.assertRaisesRegex(OX.OnnxError, 'Conv'):
            OX.dumps({**g, 'nodes': [{'op': 'Conv', 'inputs': ['in'], 'outputs': ['out']}]})
        for junk in (b'', b'\x08\x07garbage', b'not an onnx file at all', OX.dumps(g)[:40]):
            with self.assertRaises(OX.OnnxError):
                OX.loads(junk)
        with self.assertRaisesRegex(OX.OnnxError, 'missing'):
            OX.run(r, {'other': x})

    @unittest.skipIf(onnx is None, 'onnx and onnxruntime are not installed here (the CI has them)')
    def test_against_the_reference_checker_and_runtime(self):
        from onnx import TensorProto, helper, numpy_helper
        for dt, tol in ((np.float64, 1e-12), (np.float32, 1e-5)):
            m, X, ref = self.net(dt)
            data = OX.dumps(m)
            mp = onnx.load_from_string(data)
            onnx.checker.check_model(mp, full_check=True)                                  # a standard file
            self.assertEqual((mp.ir_version, mp.opset_import[0].version), (OX.IR_VERSION, OX.OPSET))
            y = onnxruntime.InferenceSession(data, providers=['CPUExecutionProvider']).run(None, {'x': X.astype(dt)})[0]
            self.assertEqual(y.dtype, dt)
            self.assertLess(np.abs(y - ref).max(), tol)                                    # the same numbers from another implementation
            self.assertLess(np.abs(OX.run(m, X.astype(dt))['y'] - y).max(), tol)
        # a file written by the reference library (values as lists, weights listed as inputs, attributes): our reader
        rng = np.random.default_rng(2)
        Wg, bg = rng.standard_normal((4, 5)).astype(np.float32), rng.standard_normal(4).astype(np.float32)
        g = helper.make_graph([helper.make_node('Gemm', ['x', 'W', 'b'], ['g'], alpha=1.0, beta=1.0, transB=1), helper.make_node('Relu', ['g'], ['y'])], 't',
                              [helper.make_tensor_value_info('x', TensorProto.FLOAT, ['batch', 5]), helper.make_tensor_value_info('W', TensorProto.FLOAT, [4, 5])],
                              [helper.make_tensor_value_info('y', TensorProto.FLOAT, ['batch', 4])],
                              [helper.make_tensor('W', TensorProto.FLOAT, Wg.shape, Wg.flatten().tolist()), numpy_helper.from_array(bg, 'b')])
        mm = helper.make_model(g, opset_imports=[helper.make_opsetid('', 13)])
        r = OX.loads(mm.SerializeToString())
        x = rng.standard_normal((6, 5)).astype(np.float32)
        self.assertEqual(r['inputs'], [('x', ('batch', 5))])
        self.assertLess(np.abs(OX.run(r, x)['y'] - np.maximum(x @ Wg.T + bg, 0)).max(), 1e-6)


class WarmStart(unittest.TestCase):
    def test_from_a_point_near_the_optimum(self):
        for name, least in (('ieee14', 4), ('ieee118', 5)):
            net = N.case_data(name)
            cold = net.opf('ac')
            raw = cold['_raw']
            rng = np.random.default_rng(3)
            x = raw['x'] * (1 + 1e-3 * rng.standard_normal(len(raw['x'])))
            for st in ({'x': x}, {'x': x, 'lam': raw['lam']}):
                r = net.opf('ac', start=st)
                self.assertEqual((r['converged'], r['start']), (True, 'warm'), (name, r['start_path']))
                self.assertLessEqual(r['iterations'], cold['iterations'] - least, name)        # measured: about half
                self.assertLess(abs(r['cost'] - cold['cost']), 2e-6 * cold['cost'])            # the same optimum within the tolerance
                self.assertLess(max(abs(r['buses'][b]['V'] - cold['buses'][b]['V']) for b in r['buses']), 1e-4)
            self.assertEqual((cold['start'], cold['start_path']), ('mid', []))

    def test_the_solver_verifies(self):
        net = N.case_data('ieee14')
        cold = net.opf('ac')
        x = cold['_raw']['x']
        rng = np.random.default_rng(4)
        bad = x + rng.standard_normal(len(x))                                               # nowhere near: worse than the normal start
        r = net.opf('ac', start={'x': bad})
        self.assertEqual((r['start'], r['iterations'], r['cost']), ('mid', cold['iterations'], cold['cost']))
        self.assertIn('αγνοήθηκε', r['start_path'][0])
        for wrong in (x[:-1], np.full(len(x), np.nan)):
            r = net.opf('ac', start={'x': wrong})
            self.assertEqual((r['start'], r['cost']), ('mid', cold['cost']))
            self.assertIn('λάθος διαστάσεις', r['start_path'][0])
        r = net.opf('ac', start={'x': x, 'gamma': 1e-40})                                   # a start that the iteration cannot use:
        self.assertEqual((r['converged'], r['start']), (True, 'mid'))                       # again from the normal start
        self.assertIn('ξανά από την κανονική εκκίνηση', r['start_path'][0])
        self.assertGreater(r['iterations'], cold['iterations'])                             # and every iteration is counted
        self.assertLess(abs(r['cost'] - cold['cost']), 1e-9 * cold['cost'])
        with self.assertRaises(OPF.OpfError):
            net.opf('dc', start={'x': x})

    def test_a_change_of_the_loads(self):
        net = N.case_data('ieee14')
        case = net.case()
        d = np.zeros(case.n, complex)
        other = N.case_data('ieee14')
        for e in other.elements:
            if e['kind'] == 'load' and e['zip'][2] == 1:
                d[case.idx[e['bus']]] -= 0.1 * complex(e['P'], e['Q'])
                e['P'], e['Q'] = 1.1 * e['P'], 1.1 * e['Q']
        a, b = net.opf('ac', dS=d), other.opf('ac')                                        # the scenario, and the network built again
        self.assertTrue(a['converged'] and b['converged'])
        self.assertLess(abs(a['cost'] - b['cost']), 1e-9 * b['cost'])
        self.assertGreater(a['cost'], 1.05 * net.opf('ac')['cost'])
        self.assertLess(abs(net.opf('dc', dS=d)['cost'] - other.opf('dc')['cost']), 1e-9 * b['cost'])
        with self.assertRaises(OPF.OpfError):
            net.opf('ac', dS=d[:-1])


class Models(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.net = N.case_data('ieee9')
        cls.model = NS.train(cls.net, 'opf', samples=140, epochs=200, check=10, name='ieee9')
        cls.pf = NS.train(cls.net, 'pf', samples=300, epochs=150, name='ieee9')

    def test_training_on_our_own_solutions(self):
        m = self.model.meta
        self.assertEqual((m['format'], m['study'], m['buses'], m['inputs'], m['outputs'], m['samples']), ('pcl-start', 'opf', 9, 6, 24, 140))
        self.assertLess(m['error']['angle']['rms'], 5e-3)
        self.assertLess(m['error']['V']['rms'], 2e-3)
        g = m['gain']
        self.assertEqual((g['scenarios'], g['used']), (10, 10))                             # every proposal accepted by the solver
        self.assertLess(g['warm'], g['cold'] - 3)                                           # measured: 11 → 4
        self.assertIn('επαναλήψεις σε 10 σενάρια', '\n'.join(NS.summary(self.model)))
        X, Y, f = NS.dataset(self.net, 'opf', 5, seed=7)
        self.assertEqual((X.shape, Y.shape, f['solved']), ((5, 6), (5, 24), 5))
        ref = int(np.flatnonzero(self.net.case().typ == PF.REF)[0])
        yr = self.model.predict(X)[:, ref]
        self.assertLess(np.ptp(Y[:, ref]), 1e-12)                                           # the reference angle does not move:
        self.assertEqual(np.ptp(yr), 0.0)                                                   # the model gives one value for it, whatever
        self.assertLess(abs(yr[0] - Y[0, ref]), 1e-12)                                      # the inputs (its scale is zero)
        with self.assertRaises(NS.StartError):
            NS.fit(X, Y)                                                                    # too few scenarios

    def test_a_model_proposes_and_the_solver_verifies(self):
        net, cold_it, warm_it = self.net, [], []
        for seed in range(5):
            dS = scenario(net, 100 + seed)
            a, b = net.opf('ac', dS=dS), net.opf('ac', dS=dS, start=self.model)
            self.assertEqual((b['converged'], b['start']), (True, 'warm'), b['start_path'])
            self.assertLess(abs(a['cost'] - b['cost']), 2e-6 * a['cost'])
            cold_it.append(a['iterations'])
            warm_it.append(b['iterations'])
        self.assertLess(np.mean(warm_it), np.mean(cold_it) - 3)
        # not for this problem: another network, another study, a change where the model has no input
        other = N.case_data('ieee14')
        r = other.opf('ac', start=self.model)
        self.assertEqual(r['start'], 'mid')
        self.assertIn('αποτύπωμα', r['start_path'][0])
        self.assertIn('μελέτη', net.opf('ac', start=self.pf)['start_path'][0])
        case = net.case()
        d = np.zeros(case.n, complex)
        d[[i for i in range(case.n) if abs(case.load[i, 2]) == 0][0]] = 1e6
        self.assertIn('ζυγούς χωρίς φορτίο', net.opf('ac', dS=d, start=self.model)['start_path'][0])
        self.assertIn('μόνο για το πρόβλημα AC', net.opf('dc', start=self.model)['start_path'][0])

    def test_files_and_lookup(self):
        net = self.net
        with pcl_home() as home:
            self.assertEqual(NS.find(net, 'pf'), None)                                      # no model of the load flow comes with the application
            p = os.path.join(home, 'models', 'mine_pf.onnx')
            self.pf.save(p)
            back = NS.Model.load(p)
            X = NS.dataset(net, 'pf', 6, seed=3)[0]
            self.assertTrue(np.array_equal(back.predict(X), self.pf.predict(X)))
            self.assertEqual(back.meta, self.pf.meta)
            self.assertEqual(NS.find(net, 'pf').meta['fingerprint'], self.pf.meta['fingerprint'])        # found by fingerprint, whatever the name
            r0 = net.batch_flow(load_scale=np.linspace(0.85, 1.15, 200))
            r1 = net.batch_flow(load_scale=np.linspace(0.85, 1.15, 200), start='nn')
            self.assertEqual((r0['proposed'], r1['converged'].all()), (0, True))
            self.assertGreater(r1['proposed'], 100)
            self.assertLess(np.abs(r1['V'] - r0['V']).max(), 2e-8)                          # the same load flows
            self.assertLessEqual(r1['iterations'].mean(), r0['iterations'].mean())
            if onnx is not None:
                onnx.checker.check_model(onnx.load(p), full_check=True)
                y = onnxruntime.InferenceSession(p, providers=['CPUExecutionProvider']).run(None, {'x': X})[0]
                self.assertLess(np.abs(y - self.pf.predict(X)).max(), 1e-12)
        self.assertEqual(net.opf('ac', start='nn')['start'], 'warm')                        # the model that comes with the application
        big = N.case_data('ieee57')
        self.assertIn('δεν υπάρχει μοντέλο', big.opf('ac', start='nn')['start_path'][0])

    def test_a_network_trained_elsewhere(self):
        net, n_in, n_out = self.net, 6, 24
        base = net.opf('ac')['_raw']['x']
        g = {'inputs': [('features', ('batch', n_in))], 'outputs': [('point', ('batch', n_out))], 'dtype': np.float32,
             'init': {'W': np.zeros((n_out, n_in), np.float32), 'b': base.astype(np.float32)},
             'nodes': [{'op': 'Gemm', 'inputs': ['features', 'W', 'b'], 'outputs': ['point'], 'attrs': {'transB': 1}}]}
        with tempfile.TemporaryDirectory() as d:
            p = OX.write(os.path.join(d, 'foreign.onnx'), g)
            with self.assertRaisesRegex(NS.StartError, 'give the network'):
                NS.Model.load(p)
            m = NS.Model.load(p, net, 'opf')
            self.assertTrue(m.meta['foreign'])
            r = net.opf('ac', start=m)                                                      # it proposes the base optimum, in single precision
            self.assertEqual(r['start'], 'warm')
            self.assertLess(r['iterations'], net.opf('ac')['iterations'] - 3)
            with self.assertRaisesRegex(NS.StartError, 'outputs'):
                NS.Model.load(p, net, 'pf')
            with self.assertRaisesRegex(NS.StartError, 'inputs'):
                NS.Model.load(p, N.case_data('ieee14'), 'opf')

    def test_models_that_come_with_the_application(self):
        sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'tools'))
        import start_models as SM
        files = sorted(f for f in os.listdir(SM.FOLDER) if f.endswith('.onnx'))
        self.assertEqual(files, sorted(f'{c}_opf.onnx' for c, _ in SM.CASES))
        for name, _ in SM.CASES:
            net = N.case_data(name)
            m = NS.Model.load(os.path.join(SM.FOLDER, f'{name}_opf.onnx'))
            self.assertIsNone(m.applies(net, net.case(), 'opf'), name)                      # for the present data of the network
            cold, warm, used, k = SM.gain(net, m, k=4)
            self.assertEqual(used, k, name)
            self.assertLess(warm, cold - 2, name)                                           # measured: 11 → 4, 11 → 4, 12 → 8
            self.assertLess(os.path.getsize(os.path.join(SM.FOLDER, f'{name}_opf.onnx')), 150e3)

    def test_the_study_and_its_report(self):
        from pcl import study as S
        cold = S.run({'case': 'ieee14', 'study': 'opf', 'options': {}})['summary']
        q = S.run({'case': 'ieee14', 'study': 'opf', 'options': {'start': 'nn'}})['summary']
        self.assertEqual((cold['start'], cold['start_path'], q['start']), ('mid', [], 'warm'))
        self.assertLess(q['iterations'], cold['iterations'] - 3)
        self.assertLess(abs(q['cost'] - cold['cost']), 2e-6 * cold['cost'])
        self.assertIn('από την πρόταση', q['start_path'][0])
        none = S.run({'case': 'ieee57', 'study': 'opf', 'options': {'start': 'nn'}})['summary']           # no model: said, and solved as always
        self.assertEqual((none['start'], none['converged']), ('mid', True))
        self.assertIn('δεν υπάρχει μοντέλο', none['start_path'][0])
        with self.assertRaises(S.StudyError):
            S.run({'case': 'ieee14', 'study': 'opf', 'options': {'start': {'x': [0.0]}}})                # a point is not an option of a study
        notes = lambda r: [s['text'] for s in r.sections if s['kind'] == 'note']                         # noqa: E731
        self.assertTrue(any('Εκκίνηση του λύτη: από προτεινόμενο σημείο' in n for n in notes(N.case_data('ieee14').report('opf', start='nn'))))
        self.assertFalse(any('Εκκίνηση του λύτη' in n for n in notes(N.case_data('ieee14').report('opf'))))

    def test_command_line(self):
        with pcl_home() as home:
            buf = io.StringIO()
            with contextlib.redirect_stdout(buf):
                rc = cli(['nnstart', 'ieee9', '--study', 'pf', '--samples', '120', '--epochs', '60'])
            self.assertEqual(rc, 0)
            self.assertTrue(os.path.exists(os.path.join(home, 'models', 'ieee9_pf.onnx')))
            self.assertIn('μοντέλο εκκίνησης «pf»', buf.getvalue())
            with contextlib.redirect_stderr(io.StringIO()), contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(cli(['nnstart', 'no_such_case']), 2)


if __name__ == '__main__':
    unittest.main()
