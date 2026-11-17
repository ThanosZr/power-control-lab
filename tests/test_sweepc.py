"""The backward/forward sweep with compensation for loops and PV buses (4.19.5, ROADMAP §78, pcl/powerflow.py: Tree,
sweep_comp, breakpoint_matrix). The tree is solved exactly, the breakpoint impedances of a published sample system are the
published ones, radial and weakly meshed networks with sources that hold their voltage give the solution of the
Newton–Raphson, and a network with too many loops is said not to converge. The meshed feeders are made here: the 33-bus
and 69-bus feeders of the project with ties and sources of our own (example values)."""
import itertools
import unittest

import numpy as np

from pcl import network as N
from pcl import powerflow as PF
from pcl import study as S


def sample():
    """The sample system of Luo & Semlyen (1990), Fig. 6: a slack bus, two loops and one PV bus; impedances in per unit."""
    net = N.Network(S_base=100e6, name='sample')
    for b in ('S', 'A', 'B', 'C', 'n1', 'n3'):
        net.bus(b, 110e3)
    net.feeder('S', Sk=1e12, V=1.0, slack=True)
    for a, b, r, x in (('S', 'A', 0.2, 0.4), ('A', 'n3', 0.15, 0.3), ('A', 'n1', 0.1, 0.2), ('S', 'B', 0.1, 0.2), ('B', 'C', 0.2, 0.4), ('C', 'n1', 0.1, 0.2), ('C', 'A', 0.15, 0.3)):
        net.branch_pu(a, b, r, x)
    net.generator('n3', 100e6, 110e3, 0.2, 0.9, P=0.0, V=1.0)
    return net


R9 = np.array([[0.7, -0.5, 0.2], [-0.5, 0.65, -0.2], [0.2, -0.2, 0.35]])          # eq. (9b) of the paper
X9 = np.array([[1.4, -1.0, 0.4], [-1.0, 1.3, -0.4], [0.4, -0.4, 0.7]])           # eq. (9a)

TIES33 = ((21, 8, 0.01, 0.01), (9, 15, 0.01, 0.01), (12, 22, 0.01, 0.01), (18, 33, 0.003, 0.003), (25, 29, 0.003, 0.003))      # our own ties (pu), example values
TIES69 = ((11, 43, 0.01, 0.01), (27, 65, 0.02, 0.02))


def meshed(name, ties, sources=(), qlim=None):
    """A feeder of the project with ties between its buses (r, x in pu) and sources that hold their voltage (bus, P in W, V in pu)."""
    net = N.case_data(name)
    for a, b, r, x in ties:
        net.branch_pu(str(a), str(b), r, x)
    for b, P, V in sources:
        net.generator(str(b), 5e6, net.buses[str(b)]['Un'], 0.2, 0.9, P=P, V=V, Qmin=None if qlim is None else -qlim, Qmax=qlim)
    return net


def tree_residual(case, seed=1):
    """The largest error of the exact tree solve for random currents: the equations of the tree network (the links taken out
    as series elements, their shunt parts left at their buses) at every bus but the root."""
    T = case.link_tree()
    rng = np.random.default_rng(seed)
    J = rng.normal(size=case.n) + 1j * rng.normal(size=case.n)
    V = T.solve(J, 1.0 + 0.0j)
    I = case.Y @ V                                               # the currents of the whole network …
    js = T.y * (V[T.f] / T.tap - V[T.t])                         # … without what the links carry in series
    np.subtract.at(I, T.f, js / np.conj(T.tap))
    np.add.at(I, T.t, js)
    keep = np.arange(case.n) != T.root
    return float(np.max(np.abs(I[keep] + J[keep])))


class Compensation(unittest.TestCase):
    def test_the_tree_is_solved_exactly(self):
        for name in ('case33bw', 'case69', 'ieee14', 'ieee118', 'ieee300'):          # radial, and meshed ones with taps, shifts and charging
            case = N.case_data(name).case()
            T = case.link_tree()
            self.assertLess(tree_residual(case), 1e-9 * max(1.0, float(np.max(np.abs(case.Y.data)))), name)
            self.assertEqual(len(T.links), case.nl - (case.n - 1), name)             # what a tree leaves out
            self.assertIs(case.link_tree(), T)                                       # found once
            self.assertEqual(sum(len(c) for c in T.lev), case.n - 1)
        # many columns at once give what one column gives
        case = N.case_data('ieee14').case()
        T = case.link_tree()
        J = np.arange(28, dtype=float).reshape(14, 2) * (0.1 + 0.05j)
        V = T.solve(J, 0.0)
        for j in range(2):
            self.assertEqual(np.abs(V[:, j] - T.solve(J[:, j], 0.0)).max(), 0.0)

    def test_the_breakpoint_impedances_of_the_published_sample(self):
        case = sample().case()
        q = PF.breakpoint_matrix(case)
        self.assertEqual((q['links'], q['pv'], q['Z'].shape), (['branch6', 'branch7'], ['n3'], (3, 3)))        # the loops through C–n1 and C–A, the PV bus
        Z = q['Z']
        self.assertLess(np.abs(Z - Z.T).max(), 1e-12)
        # the directions of the loops are a choice (the paper says so): one sign per breakpoint
        d = min(itertools.product((1, -1), repeat=3), key=lambda d: np.abs(np.diag(d) @ Z @ np.diag(d) - (R9 + 1j * X9)).max())
        self.assertLess(np.abs(np.diag(d) @ Z @ np.diag(d) - (R9 + 1j * X9)).max(), 1e-12)
        np.testing.assert_allclose(np.abs(Z.real), np.abs(R9), atol=1e-12)
        np.testing.assert_allclose(np.abs(Z.imag), np.abs(X9), atol=1e-12)
        # a radial network without PV buses has no breakpoints
        self.assertEqual(PF.breakpoint_matrix(N.case_data('case33bw').case())['Z'].shape, (0, 0))

    def test_weakly_meshed_feeders_give_the_solution_of_newton(self):
        nets = {'33, radial': (N.case_data('case33bw'), 0, 0), '69, radial': (N.case_data('case69'), 0, 0),
                '33 with 3 ties': (meshed('case33bw', TIES33[:3]), 3, 0), '33 with 5 ties': (meshed('case33bw', TIES33), 5, 0),
                '33 with 5 ties and 2 sources': (meshed('case33bw', TIES33, [(18, 0.3e6, 1.0), (33, 0.4e6, 1.0)]), 5, 2),
                '69 with 2 ties and 1 source': (meshed('case69', TIES69, [(61, 1.0e6, 1.0)]), 2, 1)}
        loaded = sample()                                                            # the published sample, with loads of our own
        loaded.load('n1', 20e6, 5e6)
        loaded.load('C', 10e6, 3e6)
        nets['the sample with loads'] = (loaded, 2, 1)
        for name, (net, links, pv) in nets.items():
            case = net.case()
            ref, _, ok, _ = PF.newton(case, case.start(True), tol=1e-11)
            self.assertTrue(ok, name)
            V, it, ok, info = PF.sweep_comp(case, case.start(True), tol=1e-10)
            self.assertTrue(ok, name)
            self.assertEqual((info['links'], info['pv']), (links, pv), name)
            self.assertLess(np.abs(V - ref).max(), 2e-9, name)
            self.assertLess(case.err(V), 1e-10, name)
            self.assertLess(np.abs(np.abs(V[case.typ == PF.PV]) - case.Vset[case.typ == PF.PV]).max(initial=0.0), 1e-10, name)      # the sources hold their voltage
            self.assertLessEqual(it, 20, name)
            if links:                                                                # the ties carry current: the loops matter
                T = case.link_tree()
                self.assertGreater(np.abs(T.y * (V[T.f] / T.tap - V[T.t])).max(), 1e-3, name)
        # started on the solution it stays there: the unknowns of the compensation start on what the starting voltages give
        for name in ('ieee14', 'ieee118', 'ieee300'):
            case = N.case_data(name).case()
            ref, _, ok, _ = PF.newton(case, case.start(False), tol=1e-11)
            V, it, ok, _ = PF.sweep_comp(case, ref, tol=1e-8)
            self.assertEqual((it, ok), (1, True), name)
            self.assertLess(np.abs(V - ref).max(), 1e-9, name)
        # small transmission networks too (more iterations: the tree is loaded and the loads are left out of the tangent)
        for name in ('ieee9', 'ieee14', 'ieee30', 'case30'):
            case = N.case_data(name).case()
            ref, _, ok, _ = PF.newton(case, case.start(True), tol=1e-11)
            V, it, ok, info = PF.sweep_comp(case, case.start(True), tol=1e-10)
            self.assertTrue(ok, name)
            self.assertLess(np.abs(V - ref).max(), 2e-9, name)
            self.assertLessEqual(it, 40, name)

    def test_through_the_network_and_with_reactive_limits(self):
        net = meshed('case33bw', TIES33, [(18, 0.3e6, 1.0), (33, 0.4e6, 1.0)])
        a, b = net.power_flow('sweepc', tol=1e-10), net.power_flow('nr', tol=1e-11)
        self.assertEqual((a['method'], a['converged'], a['path'], a['types']), ('sweepc', True, ['sweepc'], b['types']))
        self.assertLess(max(abs(a['buses'][k]['V'] - b['buses'][k]['V']) for k in net.buses), 1e-9)
        self.assertAlmostEqual(a['losses'], b['losses'], delta=1e-3)                 # W
        self.assertAlmostEqual(a['buses']['18']['V'], 1.0, places=9)
        # a source that cannot hold its voltage inside its reactive limits becomes a PQ bus, as with Newton
        net = meshed('case33bw', TIES33, [(18, 0.3e6, 1.0), (33, 0.4e6, 1.0)], qlim=50e3)
        a, b = net.power_flow('sweepc', tol=1e-10, q_limits=True), net.power_flow('nr', tol=1e-11, q_limits=True)
        self.assertEqual(a['types'], b['types'])
        self.assertEqual([a['types'][k] for k in ('18', '33')], ['PQ', 'PQ'])
        self.assertLess(max(abs(a['buses'][k]['V'] - b['buses'][k]['V']) for k in net.buses), 1e-9)
        self.assertEqual(a['path'], ['sweepc', 'sweepc'])                            # the same method after the change of type
        self.assertAlmostEqual(a['buses']['18']['Q'], 50e3, delta=1e-3)
        # as a study, with the name of the method
        q = S.run({'case': 'ieee14', 'study': 'pf', 'options': {'method': 'sweepc'}})
        self.assertEqual((q['summary']['method'], q['summary']['converged']), ('sweepc', True))
        self.assertAlmostEqual(q['result']['buses']['14']['V'], 1.0355, places=4)
        self.assertIn('αντιστάθμιση', PF.TXT['sweepc'])

    def test_many_loops_do_not_converge_and_it_says_so(self):
        for name in ('ieee118', 'ieee300'):
            case = N.case_data(name).case()
            V0 = case.start(True)
            V, it, ok, info = PF.sweep_comp(case, V0, tol=1e-8)
            self.assertFalse(ok, name)
            self.assertTrue(np.all(np.isfinite(V)), name)                            # what comes back is the best iterate, not an overflow
            self.assertLessEqual(case.err(V), case.err(V0), name)                    # and never worse than the start
            self.assertLess(it, 10, name)                                            # it stops when it runs away, not after 100 iterations
            r = N.case_data(name).power_flow('sweepc')
            self.assertEqual((r['converged'], r['method']), (False, 'sweepc'))
        # the engine never proposes it: on feeders with ties the sparse Newton is as fast (measured, ROADMAP §78)
        for net in (N.case_data(c) for c in N.CASES):
            self.assertNotEqual(net.advice()['method'], 'sweepc')
        for net in (meshed('case33bw', TIES33), meshed('case69', TIES69, [(61, 1.0e6, 1.0)])):
            adv = net.advice()
            self.assertNotEqual(adv['method'], 'sweepc')
            self.assertTrue(net.power_flow()['converged'])
        # and a network with thousands of loops is refused before a large dense tangent is built
        old = PF.COMP_MAX
        try:
            PF.COMP_MAX = 100
            with self.assertRaises(PF.PowerFlowError) as e:
                PF.sweep_comp(N.case_data('ieee118').case(), N.case_data('ieee118').case().start(True))
            self.assertIn('weakly meshed', str(e.exception))
        finally:
            PF.COMP_MAX = old


if __name__ == '__main__':
    unittest.main()
