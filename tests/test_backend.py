"""4.19.2 (ROADMAP §68 point 5, THEORY §8Θ): the array backends of the steady-state batches (pcl/backend.py) and the script of
the accelerator (pcl/accel.py). The CPU is the reference. The GPU* path is experimental and there is no GPU here: what is
checked is (a) that the three solves of many right-hand sides agree on the CPU, (b) that a missing or failing GPU falls back
to the CPU with the reason, and (c) the glue of the GPU* branch with a stand-in for CuPy made of NumPy (conversions, arrays
«on the device», the choice by measurement). None of this says anything about a real card: that is `python -m pcl accel`."""
import contextlib
import io
import json
import os
import sys
import tempfile
import types
import unittest

import numpy as np
from scipy import sparse as sp

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from pcl import accel as AC
from pcl import backend as BK
from pcl import network as N
from pcl import powerflow as PF


def open_text(p):
    with open(p, encoding='utf-8') as f:
        return f.read()


def setup(name, B=120, seed=5):
    case = N.case_data(name).case()
    V0 = PF.newton(case, case.start(True), tol=1e-11)[0]
    rng = np.random.default_rng(seed)
    dS = -(rng.uniform(0.8, 1.2, (B, case.n)) - 1) * case.load[:, 2][None, :]
    return case, V0, dS


@contextlib.contextmanager
def fake_cupy(broken=False):
    """CuPy made of NumPy and SciPy, for the glue of the GPU* branch only."""
    cp = types.ModuleType('cupy')
    cp.__dict__['__getattr__'] = lambda name: getattr(np, name)
    cp.__version__ = 'stand-in'
    cp.asnumpy = np.asarray
    rt = types.SimpleNamespace(getDeviceCount=lambda: 1, runtimeGetVersion=lambda: 12080,
                               getDeviceProperties=lambda i: {'name': b'Stand-in GPU', 'major': 12, 'minor': 0})
    cp.cuda = types.SimpleNamespace(runtime=rt, Device=lambda i: types.SimpleNamespace(mem_info=(6 * 2 ** 30, 8 * 2 ** 30)))

    class SuperLU:
        def __init__(self, obj):
            self.obj = obj

        def solve(self, R):
            if broken:
                raise RuntimeError('the device said no')
            return self.obj.solve(np.ascontiguousarray(R))
    mods = {'cupy': cp}
    for nm in ('cupyx', 'cupyx.scipy', 'cupyx.scipy.sparse', 'cupyx.scipy.sparse.linalg'):
        mods[nm] = types.ModuleType(nm)
    mods['cupyx'].scipy, mods['cupyx.scipy'].sparse, mods['cupyx.scipy.sparse'].linalg = mods['cupyx.scipy'], mods['cupyx.scipy.sparse'], mods['cupyx.scipy.sparse.linalg']
    mods['cupyx.scipy.sparse'].csr_matrix = sp.csr_matrix
    mods['cupyx.scipy.sparse.linalg'].SuperLU = SuperLU
    old = {k: sys.modules.get(k) for k in mods}
    sys.modules.update(mods)
    BK.probe(fresh=True)
    try:
        yield
    finally:
        for k, v in old.items():
            if v is None:
                sys.modules.pop(k, None)
            else:
                sys.modules[k] = v
        BK.probe(fresh=True)


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


class Solves(unittest.TestCase):
    def test_three_solves_of_many_right_hand_sides(self):
        rng = np.random.default_rng(0)
        for name in ('ieee14', 'ieee118', 'ieee300'):
            case, V0, _ = setup(name, 1)
            J = case.jac(case.typ)
            J.fill(V0, case.mismatch(V0)[1])
            lu = J.factor()
            R = rng.standard_normal((J.N, 37))
            ref = BK.cpu().solver(lu, 'lu')(R)
            self.assertLess(np.abs(J.J @ ref - R).max(), 1e-9, name)                       # the reference solves the system
            for how in ('inv', 'levels'):
                f = BK.cpu().solver(lu, how)
                self.assertLess(np.abs(f(R) - ref).max(), 1e-9 * np.abs(ref).max(), (name, how))
                self.assertLess(np.abs(f(R[:, 0]) - ref[:, 0]).max(), 1e-9 * np.abs(ref).max(), (name, how))       # one right-hand side
            lv = BK.cpu().solver(lu, 'levels').levels
            self.assertTrue(1 < lv[0] < J.N and 1 < lv[1] < J.N, lv)                       # fewer levels than rows: rows solved together
        with self.assertRaises(BK.BackendError):
            BK.cpu().solver(lu, 'qr')

    def test_the_batches_with_every_solve(self):
        case, V0, dS = setup('ieee118')
        ref = PF.batch(case, dS, V0=V0)
        self.assertEqual((ref['backend'], ref['how']), ('cpu', 'lu'))
        n1 = PF.contingency_ac(case, V0)
        for how in ('inv', 'levels'):
            r = PF.batch(case, dS, V0=V0, how=how)
            self.assertTrue(r['converged'].all())
            self.assertLess(np.abs(r['V'] - ref['V']).max(), 2e-8, how)                    # each accepted on its own mismatch (1e-8 pu)
            c = PF.contingency_ac(case, V0, how=how)
            self.assertTrue((c['converged'] == n1['converged']).all())
            ok = n1['converged']
            self.assertLess(np.abs(c['V'][ok] - n1['V'][ok]).max(), 2e-8, how)


class Choice(unittest.TestCase):
    def test_without_a_gpu_everything_is_the_cpu_with_the_reason(self):
        with pcl_home():
            info = BK.probe(fresh=True)
            if info['reason'] is None:
                self.skipTest('this machine has a GPU: the fallback is not what runs here')
            self.assertFalse(BK.choose('cpu', 500, 1000).gpu)
            g = BK.choose('gpu', 500, 1000)
            self.assertEqual(g.name, 'cpu')
            self.assertIn(info['reason'], g.why)
            a = BK.choose('auto', 500, 1000)
            self.assertEqual(a.name, 'cpu')
            self.assertIn('python -m pcl accel --save', a.why)                             # not measured on this machine
            with self.assertRaises(BK.BackendError):
                BK.choose('fpga')
            case, V0, dS = setup('ieee14', 40)
            ref = PF.batch(case, dS, V0=V0)
            r = PF.batch(case, dS, V0=V0, backend='gpu')                                   # asked for, not there: the CPU result
            self.assertEqual(r['backend'], 'cpu')
            self.assertTrue(np.array_equal(r['V'], ref['V']))
            net = N.case_data('ieee14')
            c = net.contingency('ac', backend='gpu')
            self.assertEqual(c['backend'], 'cpu')
            self.assertIn('CPU', c['backend_why'])
            self.assertEqual(net.contingency('dc')['backend'], 'cpu')
            from pcl import study as S
            q = S.run({'case': 'ieee14', 'study': 'n1', 'options': {'backend': 'gpu'}})['summary']         # the study and its report say it
            self.assertEqual((q['backend'], q['how'], q['solved']), ('cpu', 'lu', 19))
            self.assertIn(info['reason'], q['backend_why'])
            notes = lambda r: [s['text'] for s in r.sections if s['kind'] == 'note']                        # noqa: E731
            self.assertTrue(any('Η παρτίδα έτρεξε στη CPU, γιατί' in n for n in notes(net.report('n1', backend='gpu'))))
            self.assertFalse(any('παρτίδα' in n for n in notes(net.report('n1'))))                          # «auto» without a card: nothing to say

    def test_rule_of_the_measurement(self):
        rows = [{'N': 181, 'B': 1000, 'cpu': 0.07, 'gpu': 0.20}, {'N': 530, 'B': 10000, 'cpu': 5.0, 'gpu': 2.0},
                {'N': 5000, 'B': 1000, 'cpu': 3.5, 'gpu': 1.0}, {'N': 5000, 'B': 10000, 'cpu': 35.0, 'gpu': 6.0}]
        self.assertEqual(BK.rule(rows), 5000 * 1000)                                       # from the smallest work after which it always wins
        self.assertIsNone(BK.rule(rows[:1]))                                               # slower: never
        self.assertIsNone(BK.rule([{'N': 100, 'B': 100, 'cpu': 1.0, 'gpu': 0.9}]))         # under the required gain
        self.assertIsNone(BK.rule([]))

    def test_stand_in_gpu_runs_the_same_algorithm(self):
        case, V0, dS = setup('ieee118')
        ref = PF.batch(case, dS, V0=V0)
        n1 = PF.contingency_ac(case, V0)
        with pcl_home() as home, fake_cupy():
            g = BK.gpu()
            self.assertEqual((g.name, g.label, g.info['device']), ('gpu', 'GPU*', 'Stand-in GPU'))
            self.assertEqual(g.how(181), 'inv')                                            # a small system: the explicit inverse
            self.assertEqual(g.how(BK.INV_MAX + 1), 'lu')
            self.assertGreaterEqual(g.chunk(181, 1000), 1000)
            r = PF.batch(case, dS, V0=V0, backend='gpu', how='lu')
            self.assertEqual((r['backend'], r['how']), ('gpu', 'lu'))
            self.assertTrue(np.array_equal(r['V'], ref['V']) and np.array_equal(r['iterations'], ref['iterations']))      # the same operations
            r = PF.batch(case, dS, V0=V0, backend='gpu')
            self.assertEqual((r['backend'], r['how']), ('gpu', 'inv'))
            self.assertLess(np.abs(r['V'] - ref['V']).max(), 2e-8)
            c = PF.contingency_ac(case, V0, backend='gpu', how='lu')
            self.assertEqual(c['backend'], 'gpu')
            self.assertTrue(np.array_equal(c['V'], n1['V'], equal_nan=True))
            # «auto»: the GPU* only with a measurement of this machine, and only from its threshold
            self.assertFalse(BK.choose('auto', 181, 10 ** 6).gpu)
            with open(os.path.join(home, BK.FILE), 'w', encoding='utf-8') as f:
                json.dump({'format': 'pcl-accel', 'work': 1e5, 'rows': [{'N': 181, 'B': 1000, 'how': 'levels'}]}, f)
            self.assertFalse(BK.choose('auto', 181, 100).gpu)
            self.assertIn('κερδίζει από', BK.choose('auto', 181, 100).why)
            a = BK.choose('auto', 181, 1000)
            self.assertTrue(a.gpu)
            self.assertEqual(a.how(200), 'levels')                                         # the solve that the measurement found best
            self.assertEqual(N.case_data('ieee118').batch_flow(load_scale=np.linspace(0.9, 1.1, 600))['backend'], 'gpu')
            # the script: every solve agrees with the CPU, and its rule is saved
            buf = io.StringIO()
            with contextlib.redirect_stdout(buf):
                d = AC.run(scenarios=(200,), quick=True, save=True)
            self.assertTrue(d['rows'][0]['ok'])
            self.assertEqual(sorted(d['rows'][0]['all']), ['inv', 'levels', 'lu'])
            self.assertTrue(all(v['ok'] for v in d['rows'][0]['all'].values()))
            self.assertIn('Stand-in GPU', buf.getvalue())
            self.assertEqual(json.loads(open_text(os.path.join(home, BK.FILE)))['format'], 'pcl-accel')
        self.assertNotIn('bk', BK._GPU)                                                    # the stand-in is gone

    def test_a_gpu_that_fails_is_not_an_error_of_the_study(self):
        case, V0, dS = setup('ieee14', 40)
        ref = PF.batch(case, dS, V0=V0)
        with pcl_home(), fake_cupy(broken=True):
            r = PF.batch(case, dS, V0=V0, backend='gpu', how='lu')
            self.assertEqual(r['backend'], 'cpu')
            self.assertIn('απέτυχε', r['why'])
            self.assertTrue(np.array_equal(r['V'], ref['V']))


class Script(unittest.TestCase):
    def test_accel_on_this_machine(self):
        with pcl_home() as home:
            buf = io.StringIO()
            with contextlib.redirect_stdout(buf):
                rc = AC.main(['--quick', '--scenarios', '150', '--save', '--json', os.path.join(home, 'm.json')])
            txt = buf.getvalue()
            self.assertEqual(rc, 0)
            self.assertIn('===== pcl accel', txt)
            self.assertIn('ieee118: 118 ζυγοί', txt)
            self.assertIn(BK.EXPERIMENTAL, txt)
            d = json.loads(open_text(os.path.join(home, 'm.json')))
            self.assertEqual((d['format'], d['rows'][0]['B'], d['rows'][0]['solved']), ('pcl-accel', 150, 150))
            if d['system']['gpu']['reason']:                                               # no card: nothing is saved for «auto»
                self.assertIn('GPU*: όχι', txt)
                self.assertFalse(os.path.exists(os.path.join(home, BK.FILE)))
            with contextlib.redirect_stderr(io.StringIO()):
                self.assertEqual(AC.main(['--scenarios', 'many']), 2)


if __name__ == '__main__':
    unittest.main()
