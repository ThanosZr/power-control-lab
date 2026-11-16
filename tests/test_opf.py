"""Optimal power flow (4.19.1, ROADMAP §68 point 4, pcl/ipm.py and pcl/opf.py): the interior-point kernel on problems with
known answers, the derivatives against finite differences, the AC optimum against the published costs of the test cases
and against the load flow, the DC optimum against an independent solver (HiGHS of SciPy)."""
import unittest

import numpy as np
from scipy import sparse as sp
from scipy.optimize import linprog

from pcl import network as N
from pcl import opf as O
from pcl import powerflow as PF
from pcl.ipm import IpmError, ipm

# AC optimal costs of the MATPOWER test cases (cost per hour): Coffrin, Gordon & Scott, «NESTA, the NICTA Energy System Test
# Case Archive», arXiv:1411.0359, Table 1 (case9, case14, case_ieee30, case57, case118, case300, case30)
PUBLISHED = {'ieee9': 5296.69, 'ieee14': 8081.53, 'ieee30': 8906.14, 'ieee57': 41737.79, 'ieee118': 129660.69, 'ieee300': 719725.08, 'case30': 576.89}


class Kernel(unittest.TestCase):
    def test_quadratic_programme(self):
        # min (x₁ − 1)² + (x₂ − 2,5)²  with  x₁ − 2x₂ ≥ −2, −x₁ − 2x₂ ≥ −6, −x₁ + 2x₂ ≥ −2, x ≥ 0  →  x = (1,4; 1,7)
        A = sp.csr_matrix([[1.0, -2.0], [-1.0, -2.0], [-1.0, 2.0]])
        r = ipm(lambda x: ((x[0] - 1) ** 2 + (x[1] - 2.5) ** 2, np.array([2 * (x[0] - 1), 2 * (x[1] - 2.5)])), [2.0, 0.0],
                hess=lambda x, lam, mu, cm: 2 * cm * sp.identity(2), A=A, l=[-2.0, -6.0, -2.0], xmin=[0.0, 0.0], tol=1e-9)
        self.assertTrue(r['converged'])
        np.testing.assert_allclose(r['x'], [1.4, 1.7], atol=1e-6)
        self.assertAlmostEqual(r['f'], 0.8, places=6)
        np.testing.assert_allclose(r['mu']['A_l'], [0.8, 0.0, 0.0], atol=1e-5)          # only the first constraint binds

    def test_nonlinear_constraints(self):
        # min x₁ + x₂ on the disc x₁² + x₂² ≤ 2 → (−1, −1), μ = 1/2 ; min x₁² + x₂² on the line x₁ + x₂ = 1 → (½, ½), λ = −1
        def gh(x):
            return None, None, np.array([x @ x - 2]), sp.csr_matrix(2 * x[None, :])
        r = ipm(lambda x: (x.sum(), np.ones(2)), [0.5, 0.3], gh, lambda x, lam, mu, cm: 2 * mu[0] * sp.identity(2), tol=1e-9)
        self.assertTrue(r['converged'])
        np.testing.assert_allclose(r['x'], [-1.0, -1.0], atol=1e-6)
        self.assertAlmostEqual(r['mu']['h'][0], 0.5, places=5)
        # (from this start the plain steps leave the disc and fail: «auto» then repeats with the line search, and says so)
        self.assertIn('step control', r['message'])
        self.assertFalse(ipm(lambda x: (x.sum(), np.ones(2)), [0.5, 0.3], gh, lambda x, lam, mu, cm: 2 * mu[0] * sp.identity(2), step_control=False)['converged'])

        # Rosenbrock's function inside the same disc: the minimum (1, 1) lies on the boundary
        def fr(x):
            return 100 * (x[1] - x[0] ** 2) ** 2 + (1 - x[0]) ** 2, np.array([-400 * x[0] * (x[1] - x[0] ** 2) - 2 * (1 - x[0]), 200 * (x[1] - x[0] ** 2)])
        r = ipm(fr, [-1.0, 1.5], gh, lambda x, lam, mu, cm: cm * sp.csr_matrix([[1200 * x[0] ** 2 - 400 * x[1] + 2, -400 * x[0]], [-400 * x[0], 200]]) +
                2 * mu[0] * sp.identity(2), tol=1e-9)
        self.assertTrue(r['converged'])
        np.testing.assert_allclose(r['x'], [1.0, 1.0], atol=1e-6)

        def g2(x):
            return np.array([x.sum() - 1]), sp.csr_matrix(np.ones((1, 2))), None, None
        r = ipm(lambda x: (x @ x, 2 * x), [3.0, -1.0], g2, lambda x, lam, mu, cm: 2 * cm * sp.identity(2), tol=1e-9)
        np.testing.assert_allclose(r['x'], [0.5, 0.5], atol=1e-7)
        self.assertAlmostEqual(r['lam']['g'][0], -1.0, places=6)
        # a fixed variable and an unbounded one; an impossible pair of limits
        r = ipm(lambda x: (x @ x, 2 * x), [3.0, -1.0], hess=lambda x, lam, mu, cm: 2 * cm * sp.identity(2), xmin=[1.0, -np.inf], xmax=[1.0, np.inf])
        np.testing.assert_allclose(r['x'], [1.0, 0.0], atol=1e-7)
        with self.assertRaises(IpmError):
            ipm(lambda x: (x @ x, 2 * x), [0.0, 0.0], xmin=[1.0, 0.0], xmax=[0.0, 1.0])


class Derivatives(unittest.TestCase):
    def test_against_finite_differences(self):
        case = N.case_data('ieee30').case()
        rng = np.random.default_rng(2)
        nb = case.n
        Va, Vm = rng.uniform(-0.3, 0.3, nb), rng.uniform(0.92, 1.08, nb)
        lam, h = rng.standard_normal(nb), 1e-6
        Vof = lambda a, m: m * np.exp(1j * a)                                              # noqa: E731
        S = lambda V: V * np.conj(case.Y @ V)                                              # noqa: E731
        V = Vof(Va, Vm)
        dSa, dSm = O.dSbus_dV(case.Y, V)
        Gaa, Gav, Gva, Gvv = O.d2Sbus_dV2(case.Y, V, lam)
        il = np.arange(case.nl)
        k = np.arange(case.nl)
        Cf = sp.csr_matrix((np.ones(case.nl), (k, case.f)), shape=(case.nl, nb))
        Sf, dFa, dFm = O.dSbr_dV(case.Yf, Cf, V)
        mu = rng.uniform(0.1, 1.0, case.nl)
        Haa, Hav, Hva, Hvv = O.d2ASbr_dV2(dFa, dFm, Sf, Cf, case.Yf, V, mu)
        self.assertLess(np.abs(Sf - PF.branch_flows(case, V)[0][il]).max(), 1e-12)

        def grad_bus(a, m):                # the gradient of lamᵀ·S with respect to (θ, |V|)
            da, dm = O.dSbus_dV(case.Y, Vof(a, m))
            return np.r_[da.T @ lam, dm.T @ lam]

        def grad_br(a, m):                 # the gradient of muᵀ·|S_f|²
            s, da, dm = O.dSbr_dV(case.Yf, Cf, Vof(a, m))
            return np.r_[2 * (da.real.T @ (mu * s.real) + da.imag.T @ (mu * s.imag)), 2 * (dm.real.T @ (mu * s.real) + dm.imag.T @ (mu * s.imag))]
        Hbus = sp.bmat([[Gaa, Gav], [Gva, Gvv]]).toarray()
        Hbr = sp.bmat([[Haa, Hav], [Hva, Hvv]]).toarray()
        for j in rng.choice(nb, 8, replace=False):
            e = np.zeros(nb)
            e[j] = h
            self.assertLess(np.abs((S(Vof(Va + e, Vm)) - S(Vof(Va - e, Vm))) / (2 * h) - dSa[:, [j]].toarray().ravel()).max(), 1e-7)
            self.assertLess(np.abs((S(Vof(Va, Vm + e)) - S(Vof(Va, Vm - e))) / (2 * h) - dSm[:, [j]].toarray().ravel()).max(), 1e-7)
            for col, (ea, em) in ((j, (e, 0 * e)), (nb + j, (0 * e, e))):
                fd = (grad_bus(Va + ea, Vm + em) - grad_bus(Va - ea, Vm - em)) / (2 * h)
                self.assertLess(np.abs(fd - Hbus[:, col]).max(), 1e-6 * (1 + np.abs(Hbus[:, col]).max()))
                fd = (grad_br(Va + ea, Vm + em) - grad_br(Va - ea, Vm - em)) / (2 * h)
                self.assertLess(np.abs(fd - Hbr[:, col]).max(), 1e-6 * (1 + np.abs(Hbr[:, col]).max()))
        self.assertLess(np.abs(Hbus - Hbus.T).max(), 1e-9)                    # the Hessian of a real function of real variables
        self.assertLess(np.abs(Hbr - Hbr.T).max(), 1e-9)


class AcOpf(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.r = {c: N.case_data(c).opf('ac') for c in PUBLISHED}

    def test_published_costs(self):
        for c, ref in PUBLISHED.items():
            r = self.r[c]
            self.assertTrue(r['converged'], c)
            self.assertLess(abs(r['cost'] - ref), max(0.006, 1e-7 * ref), (c, r['cost'], ref))       # the two decimals of the table
            self.assertLessEqual(r['iterations'], 25)

    def test_the_optimum_is_a_load_flow(self):
        # the dispatch and the voltages of the optimum, given to the load flow, come back as they are; limits hold
        for c in ('ieee14', 'ieee118', 'case30'):
            net, r = N.case_data(c), self.r[c]
            P = {s['name']: s['P'] for s in r['sources']}
            for e in net.elements:
                if e['kind'] == 'generator':
                    e['P'], e['V'] = P[e['name']], r['buses'][e['bus']]['V']
            for b, d in net.buses.items():
                d['V'], d['angle'] = r['buses'][b]['V'], r['buses'][b]['angle']
            lf = net.power_flow('nr', tol=1e-10)
            self.assertTrue(lf['converged'])
            self.assertLess(max(abs(lf['buses'][b]['V'] - r['buses'][b]['V']) for b in net.buses), 1e-5, c)
            self.assertLess(max(abs(lf['buses'][b]['angle'] - r['buses'][b]['angle']) for b in net.buses), 1e-3, c)
            self.assertAlmostEqual(lf['losses'] / r['losses'], 1.0, places=4)
            for b, d in net.buses.items():
                self.assertTrue(d['Vmin'] - 1e-6 <= r['buses'][b]['V'] <= d['Vmax'] + 1e-6, (c, b))
            el = {e['name']: e for e in N.case_data(c).elements}
            for s in r['sources']:
                e = el[s['name']]
                self.assertTrue(e['Pmin'] - 1 <= s['P'] <= e['Pmax'] + 1 and e['Qmin'] - 1 <= s['Q'] <= e['Qmax'] + 1, (c, s['name']))

    def test_prices_and_binding_constraints(self):
        # a source inside its P limits sells at its marginal cost; what binds sits on its limit
        for c in ('ieee9', 'ieee118', 'case30'):
            r = self.r[c]
            el = {e['name']: e for e in N.case_data(c).elements}
            bind = {(b['kind'], b['name']) for b in r['binding']}
            free = 0
            for s in r['sources']:
                e = el[s['name']]
                if ('Pmax', s['name']) in bind or ('Pmin', s['name']) in bind:
                    lim = e['Pmax'] if ('Pmax', s['name']) in bind else e['Pmin']
                    self.assertAlmostEqual(s['P'] / 1e6, lim / 1e6, delta=0.1)       # an interior point: at its limit within the tolerance
                    continue
                free += 1
                mc = 2 * e['cost'][0] * s['P'] / 1e6 + e['cost'][1]
                self.assertAlmostEqual(r['buses'][s['bus']]['lmp'], mc, delta=2e-3 * (1 + abs(mc)), msg=(c, s['name']))
            self.assertGreater(free, 0)
            for b in r['binding']:
                self.assertGreater(b['mu'], 0)
        # the 30-bus case of Alsac & Stott: line ratings bind, so the prices differ from bus to bus
        r = self.r['case30']
        flows = [b for b in r['binding'] if b['kind'] == 'flow']
        self.assertTrue(flows)
        by = {q['name']: q for q in r['branches']}
        for b in flows:
            self.assertAlmostEqual(by[b['name']]['loading'], 1.0, places=4)
        self.assertTrue(all(q['loading'] <= 1 + 1e-5 for q in r['branches'] if q['loading'] is not None))
        lmp = [d['lmp'] for d in r['buses'].values()]
        self.assertGreater(max(lmp) - min(lmp), 0.3)
        # without the ratings the optimum is cheaper, and no flow binds
        r2 = N.case_data('case30').opf('ac', flow_limits=False)
        self.assertLess(r2['cost'], r['cost'] - 0.5)
        self.assertFalse([b for b in r2['binding'] if b['kind'] == 'flow'])

    def test_start_and_advice(self):
        net = N.case_data('ieee57')
        a, b = self.r['ieee57'], net.opf('ac', start='pf', record=True)
        self.assertAlmostEqual(a['cost'], b['cost'], delta=1e-3)
        self.assertEqual((a['start'], b['start'], a['method']), ('mid', 'pf', 'ipm'))
        self.assertEqual(len(b['history']), b['iterations'] + 1)
        self.assertLess(b['history'][-1]['feas'], 1e-6)
        adv = net.advice('opf')
        self.assertEqual((adv['method'], adv['flow_limits']), ('ipm', 0))
        self.assertIn('εσωτερικό σημείο', adv['why'])
        self.assertIn('41 κλάδ', N.case_data('case30').advice('opf')['why'])

    def test_a_network_without_costs(self):
        net = N.case_data('ieee14')
        for e in net.elements:
            e.pop('cost', None)
        with self.assertRaises(O.OpfError):
            net.opf('ac')
        with self.assertRaises(O.OpfError):
            N.case_data('ieee14').opf('hvdc')


class DcOpf(unittest.TestCase):
    def lp(self, net, scale=1.0):
        """The DC optimal power flow with linear costs as a linear programme for HiGHS, built here from the DC model."""
        case = net.case()
        G = O.sources(net, case)
        nb, ng, base = case.n, G['n'], net.S_base / 1e6
        Bbus, Bf, Pbi, Pfi = PF.dc_model(case)
        Cg = sp.csr_matrix((np.ones(ng), (G['bus'], np.arange(ng))), shape=(nb, ng))
        Pd = case.zip(np.ones(nb)).real + case.ysh.real
        il = np.flatnonzero(np.isfinite(case.rate))
        rate = case.rate[il] * scale
        Aeq = sp.hstack([Bbus, -Cg]).tocsr()
        Aub = sp.vstack([sp.hstack([Bf[il], sp.csr_matrix((len(il), ng))]), sp.hstack([-Bf[il], sp.csr_matrix((len(il), ng))])]).tocsr()
        bub = np.r_[rate - Pfi[il], rate + Pfi[il]]
        ref = int(np.flatnonzero(case.typ == PF.REF)[0])
        bounds = [(0.0, 0.0) if i == ref else (None, None) for i in range(nb)] + list(zip(G['Pmin'], G['Pmax']))
        r = linprog(np.r_[np.zeros(nb), G['cost'][:, 1] * base], A_ub=Aub if len(il) else None, b_ub=bub if len(il) else None, A_eq=Aeq,
                    b_eq=-(Pd + Pbi), bounds=bounds, method='highs')
        return r.fun + G['cost'][:, 2].sum(), r.x[nb:] * net.S_base

    def test_linear_costs_against_highs(self):
        for c, scale in (('case30', 1.0), ('case30', 0.8), ('ieee118', 1.0), ('ieee9', 0.5)):
            net = N.case_data(c)
            for e in net.elements:
                if e['kind'] == 'generator':
                    e['cost'] = [0.0, e['cost'][1] + 0.37 * int(e['name'][1:]), e['cost'][2]]     # linear costs, all different (one optimum)
                elif e['kind'] == 'branch' and 'rating' in e:
                    e['rating'] *= scale
            ref, Pref = self.lp(net)
            r = net.opf('dc', tol=1e-9)
            self.assertTrue(r['converged'], (c, scale))
            self.assertAlmostEqual(r['cost'] / ref, 1.0, places=6, msg=(c, scale))
            np.testing.assert_allclose([s['P'] for s in r['sources']], Pref, atol=2e-5 * net.S_base)
            if c == 'case30':
                self.assertTrue([b for b in r['binding'] if b['kind'] == 'flow'], (c, scale))
                self.assertTrue(all(q['loading'] <= 1 + 1e-6 for q in r['branches'] if q['loading'] is not None))
        # ratings that the network cannot keep: no solution, and the result says so (HiGHS finds the programme infeasible too)
        net = N.case_data('case30')
        for e in net.elements:
            if e['kind'] == 'branch' and 'rating' in e:
                e['rating'] *= 0.5
        r = net.opf('dc')
        self.assertFalse(r['converged'])
        self.assertTrue(r['message'])

    def test_quadratic_costs(self):
        # no congestion: one price everywhere, and every source inside its limits sells at its marginal cost
        net = N.case_data('ieee57')
        r = net.opf('dc', tol=1e-9)
        lmp = np.array([d['lmp'] for d in r['buses'].values()])
        self.assertLess(np.ptp(lmp), 1e-5)
        el = {e['name']: e for e in net.elements}
        bind = {(b['kind'], b['name']) for b in r['binding']}
        for s in r['sources']:
            if ('Pmax', s['name']) in bind or ('Pmin', s['name']) in bind:
                continue
            e = el[s['name']]
            self.assertAlmostEqual(2 * e['cost'][0] * s['P'] / 1e6 + e['cost'][1], lmp[0], places=4)
        self.assertAlmostEqual(sum(s['P'] for s in r['sources']), sum(d['Pload'] for d in r['buses'].values()), delta=1.0)     # no losses in DC
        self.assertEqual((r['kind'], r['losses'], net.advice('dcopf')['kind']), ('dc', 0.0, 'dc'))
        # the DC optimum is below the AC one (no losses), within a few per cent
        ac = N.case_data('ieee57').opf('ac')
        self.assertTrue(0.95 * ac['cost'] < r['cost'] < ac['cost'])


if __name__ == '__main__':
    unittest.main()
