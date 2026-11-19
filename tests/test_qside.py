"""4.21 (ROADMAP §87, open question 4 of 4.19.5): the side check of the reactive limits in the plain load flow (pcl.powerflow.solve,
q_limits='side'). The complementarity conditions of Pirnia, Cañizares & Bhattacharya (2013, (10)–(12), (22)): a generator bus at
Q_max may only be below its set voltage, at Q_min only above. Without the check the load flow «converges» past the loading limit
(IEEE 9 up to λ = 1.5823, IEEE 118 up to 1.1447: the solutions that Lin et al. 2023 call non-physical); with it the largest λ at
which it converges is the end of the P–V curve of pcl.cpf with the same limits. Where no bus ends on the wrong side the result is
that of q_limits=True bit for bit. The networks of the project only; the rest is ours."""
import unittest

import numpy as np

from pcl import cpf
from pcl import network as N
from pcl import powerflow as PF
from pcl import study as S
from tests.test_cpf import scaled


def largest(net, q, eps=1e-7):
    """The largest λ (every load and generator but the slack at 1 + λ) at which the load flow converges, by bisection, every
    solve started from the last one that did; and the 'side' of the first solve that did not."""
    c = net.case()
    load0, Sg0 = c.load.copy(), c.Sg.copy()

    def solve(lam, V0):
        scaled(c, load0, Sg0, lam)
        r = PF.solve(c, 'nr', tol=1e-8, q_limits=q, V0=V0)
        return bool(r['converged']), r['V'], r
    ok, V, _ = solve(0.0, None)
    lo, Vlo, hi = 0.0, V, 0.25
    while True:
        ok, V, _ = solve(hi, Vlo)
        if not ok:
            break
        lo, Vlo, hi = hi, V, 2 * hi
    while hi - lo > eps:
        mid = 0.5 * (lo + hi)
        ok, V, _ = solve(mid, Vlo)
        if ok:
            lo, Vlo = mid, V
        else:
            hi = mid
    return lo, solve(hi, Vlo)[2]


class Side(unittest.TestCase):
    def test_the_largest_loading_is_the_end_of_the_pv_curve(self):
        # measured: IEEE 9 1.56558 (without the check 1.58232), IEEE 118 1.08093 (1.14466); the bus that goes back to PV and
        # comes back to PQ is the generator of the corner of the curve (pcl.cpf, the last event)
        for name, bus in (('ieee9', '2'), ('ieee118', '10')):
            net = N.case_data(name)
            nose = cpf.run(net, q_limits=True, tol=1e-10)['nose']['lambda']
            lam, last = largest(net, 'side')
            self.assertAlmostEqual(lam, nose, delta=3e-7, msg=name)
            self.assertGreater(largest(net, True)[0], nose + 0.015, name)        # the plain switching goes past it
            c = net.case()
            self.assertTrue(last['side']['cycle'], name)                         # just past it: PQ on the wrong side, PV past the limit
            self.assertEqual([c.names[i] for i in last['side']['back']], [bus], name)

    def test_the_same_as_before_where_no_bus_is_on_the_wrong_side(self):
        for name in N.CASES:
            if name == 'pegase1354':
                continue
            net = N.case_data(name)
            a, b = net.power_flow(q_limits=True), net.power_flow(q_limits='side')
            self.assertEqual(b['q_side'], {'back': [], 'cycle': False, 'wrong': []}, name)
            self.assertEqual([(d['V'], d['angle']) for d in a['buses'].values()], [(d['V'], d['angle']) for d in b['buses'].values()], name)
            self.assertNotIn('q_side', a, name)

    def test_a_bus_goes_back_to_its_voltage(self):
        # IEEE 9 at λ = 1.55 from a start with the generator of bus 2 at its upper limit (as a switching on the way leaves it):
        # with the check it holds its voltage again and the result is the load flow of the network, without it it stays at the
        # limit above its set voltage
        net = N.case_data('ieee9')
        c = net.case()
        scaled(c, c.load.copy(), c.Sg.copy(), 1.55)
        i = c.names.index('2')
        typ = c.typ.copy()
        typ[i] = PF.PQ
        Sg = c.Sg.copy()
        c.Sg = Sg
        c.Sg[i] = c.Sg[i].real + 1j * c.qmax[i]
        r = PF.solve(c, 'nr', tol=1e-10, q_limits='side', typ=typ)
        self.assertTrue(r['converged'])
        self.assertEqual(r['side']['back'], [i])
        self.assertEqual(int(r['typ'][i]), PF.PV)
        self.assertAlmostEqual(abs(r['V'][i]), c.Vset[i], delta=1e-12)
        r0 = PF.solve(c, 'nr', tol=1e-10, q_limits=True, typ=typ)
        self.assertEqual(int(r0['typ'][i]), PF.PQ)
        self.assertGreater(abs(r0['V'][i]), c.Vset[i] + 1e-3)

    def test_the_study_and_the_dense_path(self):
        out = S.run({'case': 'ieee9', 'study': 'pf', 'options': {'q_limits': 'side'}})['summary']
        self.assertEqual(out['q_side'], {'back': [], 'cycle': False, 'wrong': []})
        with self.assertRaises(N.NetworkError):
            N.case_data('ieee9').load_flow(q_limits='side')


if __name__ == '__main__':
    unittest.main()
