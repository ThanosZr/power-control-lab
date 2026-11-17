"""Load flow on sparse matrices (4.19.1, ROADMAP §68 point 3, pcl/powerflow.py): every method ends on the same solution,
the fast paths give the numbers of the reference path, the choice of the engine follows the network, and the test
networks reproduce the published voltages of their files."""
import json
import math
import time
import unittest

import numpy as np

from pcl import network as N
from pcl import powerflow as PF


def best(f, k=3):
    t, r = 1e9, None
    for _ in range(k):
        t0 = time.perf_counter()
        r = f()
        t = min(t, time.perf_counter() - t0)
    return t, r


def feeder(F, d):
    """A radial network: F feeders of d buses each from one slack bus."""
    net = N.Network(50, 10e6)
    net.bus('0', 20e3, 'slack')
    net.feeder('0', Sk=500e6, name='grid', slack=True)
    for f in range(F):
        prev = '0'
        for k in range(d):
            b = f'{f}_{k}'
            net.bus(b, 20e3)
            net.line(prev, b, 0.3, 0.35, 0.4, name='L' + b)
            net.load(b, 30e3, 9e3, name='D' + b)
            prev = b
    return net


class Model(unittest.TestCase):
    def test_case_arrays(self):
        # the sparse Y is the dense one of load_flow, and it is the sum of the branches (π model) and the bus shunts
        for c in ('ieee14', 'ieee118', 'ieee300', 'case33bw'):
            net = N.case_data(c)
            case = net.case()
            Yd = net._lf_model()[2]
            self.assertLess(np.abs(case.Y.toarray() - Yd).max(), 1e-12, c)
            k = np.arange(case.nl)
            Cf = PF._csr(case.nl, case.n, k, case.f, np.ones(case.nl))
            Ct = PF._csr(case.nl, case.n, k, case.t, np.ones(case.nl))
            Y2 = Cf.T @ case.Yf + Ct.T @ case.Yt + PF.sp.diags(case.ysh)
            self.assertLess(abs(Y2 - case.Y).max(), 1e-10, c)
            self.assertEqual(case.nl, sum(e['kind'] == 'branch' for e in net.elements))

    def test_test_networks(self):
        sizes = {'ieee9': 9, 'ieee14': 14, 'ieee30': 30, 'ieee57': 57, 'ieee118': 118, 'ieee300': 300, 'case30': 30, 'case33bw': 33, 'case69': 69,
                 'pegase1354': 1354}
        self.assertEqual(set(N.CASES), set(sizes))
        for c, n in sizes.items():
            self.assertEqual(len(N.case_data(c).buses), n)
        self.assertEqual(len(N.ieee(118).buses), 118)
        with self.assertRaises(N.NetworkError):
            N.case_data('ieee7')
        self.assertIsNone(N.case_solution('ieee9'))


class Methods(unittest.TestCase):
    def test_same_solution_from_every_method(self):
        run = {'nr': PF.newton, 'nr_ci': PF.newton_ci, 'fdxb': lambda *a, **k: PF.fast_decoupled(*a, scheme='xb', **k),
               'fdbx': lambda *a, **k: PF.fast_decoupled(*a, scheme='bx', **k), 'sweep': PF.sweep, 'sweepc': PF.sweep_comp, 'gs': PF.gauss_seidel}
        for c in ('ieee14', 'ieee57', 'ieee118', 'ieee300', 'case30', 'case33bw', 'case69'):
            case = N.case_data(c).case()
            V0 = case.start(True)
            ref, it, ok, _ = PF.newton_dense(case, V0, tol=1e-11)
            self.assertTrue(ok, c)
            for m, f in run.items():
                if m == 'gs' and case.n > 30:
                    continue
                if m == 'sweep' and not case.graph()['radial']:
                    with self.assertRaises(PF.PowerFlowError):
                        f(case, V0, tol=1e-10)
                    continue
                V, it, ok, _ = f(case, V0, tol=1e-10)
                if m == 'sweepc' and c in ('ieee118', 'ieee300'):                    # 4.19.5: too many loops for the compensation; it says so (tests/test_sweepc.py)
                    self.assertFalse(ok, c)
                    continue
                if m == 'sweepc' and c == 'ieee57' and not ok:                       # at the edge of what the compensation follows: the solution when it converges
                    continue
                self.assertTrue(ok, (c, m))
                self.assertLess(np.abs(V - ref).max(), 2e-9, (c, m))
            self.assertLess(case.err(ref), 1e-10)

    def test_auto_on_a_small_network_is_load_flow_bit_for_bit(self):
        for c in ('ieee9', 'ieee14', 'ieee30', 'case30'):
            for ql in (False, True):
                net = N.case_data(c)
                a, b = net.load_flow(q_limits=ql), net.power_flow(tol=1e-10, q_limits=ql)
                self.assertEqual(b['method'], 'nr_dense')
                for k in ('buses', 'branches', 'losses', 'iterations', 'types', 'converged'):
                    self.assertEqual(a[k], b[k], (c, ql, k))

    def test_the_choice_of_the_engine(self):
        adv = N.case_data('ieee14').advice()
        self.assertEqual(adv['method'], 'nr_dense')
        self.assertIn('14 ζυγοί', adv['why'])
        adv = N.case_data('ieee118').advice()
        self.assertEqual((adv['method'], adv['facts']['loops'], adv['facts']['pv'], adv['facts']['radial']), ('nr', 62, 53, False))
        self.assertIn('62 βρόχοι', adv['why'])
        # a deep radial feeder: the sweep costs per level, Newton is faster (measured); a wide one: the sweep
        adv = N.case_data('case69').advice()
        self.assertEqual((adv['method'], adv['facts']['radial'], adv['facts']['depth']), ('nr', True, 26))
        self.assertIn('βαθύ', adv['why'])
        wide = feeder(40, 4)
        adv = wide.advice()
        self.assertEqual((adv['method'], adv['facts']['depth']), ('sweep', 4))
        r = wide.power_flow()
        self.assertEqual((r['method'], r['converged'], r['path']), ('sweep', True, ['sweep']))
        ref = wide.power_flow('nr', tol=1e-11)
        self.assertLess(max(abs(r['buses'][b]['V'] - ref['buses'][b]['V']) for b in wide.buses), 1e-8)
        self.assertEqual(N.case_data('ieee118').advice('n1')['method'], 'lodf+batch')
        self.assertEqual(N.case_data('ieee118').advice('batch', 500)['method'], 'batch')
        with self.assertRaises(PF.PowerFlowError):
            PF.solve(N.case_data('ieee14').case(), 'newton')

    def test_reactive_limits(self):
        for c in ('ieee118', 'ieee300'):
            net = N.case_data(c)
            a, b = net.load_flow(q_limits=True, tol=1e-11), net.power_flow('nr', q_limits=True, tol=1e-10)
            self.assertEqual(a['types'], b['types'], c)
            self.assertGreater(sum(a['types'][x] == 'PQ' and net.buses[x]['type'] == 'PV' for x in net.buses), 3)
            self.assertLess(max(abs(a['buses'][x]['V'] - b['buses'][x]['V']) for x in net.buses), 1e-8)
            self.assertLess(max(abs(a['buses'][x]['Q'] - b['buses'][x]['Q']) for x in net.buses), 1e-2)      # var

    def test_published_voltages(self):
        # the bus voltages of the case files (IEEE Common Data Format): 14 buses within the digits of the file; in the larger
        # files a few buses of the published solution do not agree with their own data, so: the median and 95 % of the buses
        net = N.case_data('ieee14')
        sol, r = N.case_solution('ieee14'), net.power_flow('nr', flat=True)
        self.assertLess(max(abs(r['buses'][b]['V'] - sol[b][0]) for b in net.buses), 1.4e-3)
        self.assertLess(max(abs(r['buses'][b]['angle'] - sol[b][1]) for b in net.buses), 0.02)
        self.assertAlmostEqual(r['losses'] / 1e6, 13.393, places=3)
        for c in ('ieee30', 'ieee57', 'ieee118', 'ieee300'):
            net = N.case_data(c)
            sol, r = N.case_solution(c), net.power_flow('nr', flat=True, q_limits=True)
            self.assertTrue(r['converged'])
            dv = np.array([abs(r['buses'][b]['V'] - sol[b][0]) for b in net.buses])
            da = np.array([abs(r['buses'][b]['angle'] - sol[b][1]) for b in net.buses])
            self.assertLess(np.median(dv), 3e-4, c)
            self.assertGreater(np.mean(dv < 2e-3), 0.95, c)
            self.assertLess(np.median(da), 0.3, c)
        # 4.19.3: the 1354-bus case of PEGASE. Its file follows the MATPOWER format (phase shifts in degrees) and so do we; the
        # bus voltages of the file agree with that almost everywhere (median 3·10⁻⁶ pu, 0,04°), but near its three phase
        # shifters they differ by up to 5,5°: they fit the six shifts read as radians with the opposite sign (then 0,44°)
        net = N.case_data('pegase1354')
        sol, r = N.case_solution('pegase1354'), net.power_flow('nr')
        self.assertTrue(r['converged'])
        self.assertLessEqual(r['iterations'], 6)
        dv = np.array([abs(r['buses'][b]['V'] - sol[b][0]) for b in net.buses])
        da = np.array([r['buses'][b]['angle'] - sol[b][1] for b in net.buses])
        da = np.abs(da - np.median(da))
        self.assertLess(np.median(dv), 1e-5)
        self.assertGreater(np.mean(dv < 1e-3), 0.97)
        self.assertLess(np.median(da), 0.1)
        self.assertTrue(4.0 < da.max() < 7.0, da.max())
        self.assertAlmostEqual(r['losses'] / 1e6, 1663.5, delta=0.5)
        d = N.to_dict(net)
        for e in d['elements']:
            if e['kind'] == 'branch' and e.get('angle'):
                e['angle'] = -math.degrees(e['angle'])
        r2 = N.from_dict(d).power_flow('nr')
        da2 = np.array([r2['buses'][b]['angle'] - sol[b][1] for b in net.buses])
        self.assertLess(np.abs(da2 - np.median(da2)).max(), 0.6)
        self.assertIn('Creative Commons Attribution 4.0', json.loads((N.DATA / 'pegase1354.json').read_text(encoding='utf-8'))['source'])
        # the feeder of Baran & Wu: losses 202,7 kW and the lowest voltage 0,9131 pu at bus 18 (the values of the paper)
        r = N.case_data('case33bw').power_flow('sweep')
        self.assertAlmostEqual(r['losses'] / 1e3, 202.68, delta=0.05)
        b = min(r['buses'], key=lambda x: r['buses'][x]['V'])
        self.assertEqual(b, '18')
        self.assertAlmostEqual(r['buses'][b]['V'], 0.9131, delta=1e-4)

    def test_a_bad_start_falls_back(self):
        case = N.case_data('ieee118').case()
        rng = np.random.default_rng(3)
        bad = 0.4 * np.exp(1j * rng.uniform(-2, 2, case.n))
        r = PF.solve(case, 'auto', V0=bad)
        self.assertTrue(r['converged'])
        self.assertEqual(len(r['path']), 2)
        self.assertIn('επίπεδη εκκίνηση', r['path'][1])
        ref = PF.newton(case, case.start(True), tol=1e-10)[0]
        self.assertLess(np.abs(r['V'] - ref).max(), 1e-7)
        r = PF.solve(case, 'nr', V0=bad, max_iter=8)                 # a named method does not fall back: it reports
        self.assertFalse(r['converged'])

    def test_sparse_is_faster_on_a_large_network(self):
        # a ratio of two paths on the largest test network (measured ×25: 3 ms against 79 ms)
        case = N.case_data('ieee300').case()
        V0 = case.start(True)
        ts, a = best(lambda: PF.newton(case, V0, tol=1e-10))
        td, b = best(lambda: PF.newton_dense(case, V0, tol=1e-10), 2)
        self.assertLess(np.abs(a[0] - b[0]).max(), 1e-9)
        self.assertLess(4 * ts, td, (ts, td))


class Linear(unittest.TestCase):
    def test_dc_flow_ptdf_lodf(self):
        for c in ('ieee14', 'ieee118'):
            net = N.case_data(c)
            case = net.case()
            th, Pf = PF.dc_flow(case)
            P = (case.Sg - case.zip(np.ones(case.n))).real - case.ysh.real
            H = PF.ptdf(case)
            self.assertLess(np.abs(H @ P - (Pf - PF.dc_model(case)[3])).max(), 1e-10)
            # the DC flow against the AC angles: a linear approximation (a few degrees on these cases)
            ac = net.power_flow('nr')
            self.assertLess(max(abs(np.degrees(th[i]) - ac['buses'][b]['angle']) for i, b in enumerate(case.names)), 6.0)
            # LODF: the flows after an outage, against the DC flow of the network without the branch
            Lm = PF.lodf(case, H)
            br = PF.bridges(case)
            for k in np.flatnonzero(~br)[[0, 5, 11]]:
                c2 = net.case()
                c2.y = c2.y.copy()
                c2.y[k] *= 1e-12
                Pf2 = PF.dc_flow(c2)[1]
                pred = Pf + Lm[:, k] * Pf[k]
                self.assertLess(np.abs(np.delete(pred - Pf2, k)).max(), 1e-8, (c, k))
            self.assertTrue(np.isnan(Lm[:, np.flatnonzero(br)]).all())
            d = net.dc_flow()
            self.assertEqual(len(d['branches']), case.nl)
            self.assertAlmostEqual(d['branches'][0]['P'], Pf[0] * net.S_base, places=3)
            self.assertEqual(net.ptdf()['H'].shape, (case.nl, case.n))
            self.assertEqual(net.lodf()['L'].shape, (case.nl, case.nl))

    def test_bridges(self):
        case = N.case_data('case33bw').case()
        self.assertTrue(PF.bridges(case).all())                       # a tree: every branch
        case = N.case_data('ieee14').case()
        br = PF.bridges(case)
        self.assertEqual([case.br_name[k] for k in np.flatnonzero(br)], ['br14'])        # 7–8: the bus of the synchronous condenser
        self.assertEqual(int(PF.bridges(N.case_data('ieee118').case()).sum()), 9)


class Batch(unittest.TestCase):
    def test_batch_gives_the_numbers_of_the_reference_path(self):
        rng = np.random.default_rng(7)
        for c, B in (('ieee14', 300), ('ieee118', 300)):
            case = N.case_data(c).case()
            V0 = PF.newton(case, case.start(True), tol=1e-11)[0]
            dS = -(rng.uniform(0.8, 1.2, (B, case.n)) - 1) * case.load[:, 2][None, :]
            r = PF.batch(case, dS, V0=V0, tol=1e-8)
            self.assertTrue(r['converged'].all(), c)
            self.assertEqual((r['chord'], r['newton'], r['fact']), (B, 0, 1))            # one factorization for all the scenarios
            self.assertLessEqual(r['iterations'].max(), 8)
            for b in rng.choice(B, 25, replace=False):
                Vb, _, ok, _ = PF.newton(case, V0.copy(), tol=1e-11, Sg=case.Sg + dS[b])
                self.assertTrue(ok)
                self.assertLess(np.abs(Vb - r['V'][b]).max(), 2e-8, (c, b))
                self.assertLess(case.err(r['V'][b], Sg=case.Sg + dS[b]), 1e-8)           # each scenario on its own mismatch

    def test_a_scenario_without_solution_is_reported(self):
        case = N.case_data('ieee118').case()
        V0 = PF.newton(case, case.start(True), tol=1e-11)[0]
        dS = np.zeros((3, case.n), complex)
        dS[1] = -6 * case.load[:, 2]                                   # seven times the load: no solution
        r = PF.batch(case, dS, V0=V0)
        self.assertEqual(r['converged'].tolist(), [True, False, True])
        self.assertEqual(r['newton'], 1)                               # the reference path tried it too
        self.assertFalse(PF.newton(case, V0.copy(), Sg=case.Sg + dS[1], max_iter=40, damp=True)[2])

    def test_batch_flow_of_a_network(self):
        net = N.case_data('ieee57')
        k = np.array([0.8, 1.0, 1.15])
        r = net.batch_flow(load_scale=k, gen_scale=k)
        self.assertTrue(r['converged'].all())
        self.assertEqual(r['V'].shape, (3, 57))
        self.assertEqual(r['advice']['method'], 'batch')
        for j, kk in enumerate(k):
            n2 = N.case_data('ieee57')
            for e in n2.elements:
                if e['kind'] == 'load':
                    e['P'], e['Q'] = e['P'] * kk, e['Q'] * kk
                elif e['kind'] == 'generator':
                    e['P'] = e['P'] * kk
            ref = n2.power_flow('nr', tol=1e-10)
            self.assertLess(max(abs(ref['buses'][b]['V'] - r['V'][j, i]) for i, b in enumerate(r['buses'])), 1e-7)
            self.assertLess(max(abs(ref['buses'][b]['angle'] - r['angle'][j, i]) for i, b in enumerate(r['buses'])), 1e-5)
        with self.assertRaises(N.NetworkError):
            net.batch_flow()

    def test_n_minus_1_in_ac(self):
        net = N.case_data('ieee118')
        case = net.case()
        V0 = PF.newton(case, case.start(True), tol=1e-11)[0]
        r = PF.contingency_ac(case, V0, tol=1e-8)
        br = PF.bridges(case)
        self.assertEqual(r['island'].tolist(), br.tolist())
        self.assertTrue(r['converged'][~br].all())
        self.assertEqual((r['chord'], r['newton']), (int((~br).sum()), 0))               # every outage on the factors of the base case
        self.assertTrue(np.isnan(r['V'][br]).all())
        rng = np.random.default_rng(5)
        for k in rng.choice(np.flatnonzero(~br), 20, replace=False):
            c2 = PF.without(case, int(k))
            Vb, _, ok, _ = PF.newton(c2, V0.copy(), tol=1e-11, damp=True, max_iter=30)
            self.assertTrue(ok)
            self.assertLess(np.abs(Vb - r['V'][k]).max(), 2e-8, k)
        # the same through the network, with the DC screening next to it
        a, d = net.contingency('ac'), net.contingency('dc')
        self.assertEqual(len(a['outages']), case.nl)
        self.assertEqual((len(a['islands']), a['failed'], len(d['islands'])), (9, [], 9))
        self.assertEqual(a['worst'], d['worst'])
        o = next(x for x in a['outages'] if x['name'] == a['worst'])
        self.assertTrue(o['converged'] and o['Smax'] > max(a['base']['S'].values()) and 0.9 < o['Vmin'] < 1.0)
        self.assertEqual(a['advice']['method'], 'lodf+batch')
        one = net.contingency('ac', branches=[a['worst']], ratings={o['branch']: 0.5 * o['Smax']})
        self.assertAlmostEqual(one['outages'][0]['loading'], 2.0, places=6)
        self.assertEqual(one['outages'][0]['overloads'][0][0], o['branch'])

    def test_the_batches_are_faster_than_one_by_one(self):
        # ratios of two paths on problems of some size (measured: ×12 for the batch, ×17 for N−1 on 118 buses)
        rng = np.random.default_rng(1)
        case = N.case_data('ieee118').case()
        V0 = PF.newton(case, case.start(True), tol=1e-11)[0]
        B = 400
        dS = -(rng.uniform(0.8, 1.2, (B, case.n)) - 1) * case.load[:, 2][None, :]
        tb, r = best(lambda: PF.batch(case, dS, V0=V0), 2)
        t1, _ = best(lambda: [PF.newton(case, V0.copy(), tol=1e-8, Sg=case.Sg + dS[b]) for b in range(40)], 2)
        self.assertLess(3 * tb / B, t1 / 40, (tb / B, t1 / 40))
        tc, r = best(lambda: PF.contingency_ac(case, V0), 2)
        ks = np.flatnonzero(~r['island'])[:30]
        t2, _ = best(lambda: [PF.newton(PF.without(case, int(k)), V0.copy(), tol=1e-8, damp=True) for k in ks], 2)
        self.assertLess(3 * tc / (~r['island']).sum(), t2 / len(ks), (tc, t2))


if __name__ == '__main__':
    unittest.main()
