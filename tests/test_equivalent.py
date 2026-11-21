"""5.0.3 (ROADMAP §96 B.2, THEORY §8ΩΗ): the rest of the network as an equivalent at the fundamental (pcl/equivalent.py).
Ward and extended Ward give the base case of the full network at every kept bus; the branch of the Kron reduction is the one
of an independent implementation (pandapower 3.5.6, grid_equivalents, on its case9 with the boundary buses 5 and 9: the
same network as our IEEE 9); the extended Ward answers outages better than the Ward when the external generators hold
their voltages (the case its paper was written for); the Norton of the boundary gives the current that flows into the
external network in the full solution; the equivalent for the short circuit gives the same I″k of IEC 60909-0 at every
kept bus, for every kind of fault, and the values of IEC TR 60909-4 with the reduced network."""
import unittest

import numpy as np

from pcl import network as N
from pcl import equivalent as Q
from tests.test_network import tr60909_4, IK, IK1


def base_error(net, eq, lf):
    r = eq['net'].power_flow(tol=1e-12)
    keep = eq['internal'] + eq['boundary']
    return r['converged'], max(abs(Q._v(r, k) - Q._v(lf, k)) for k in keep)


class TestEquivalent(unittest.TestCase):

    def test_split(self):
        net = N.ieee(14)
        I, B, E = Q.split(net, ['4', '5'])               # the side with the slack (bus 1) is external
        self.assertEqual(sorted(E, key=int), ['1', '2', '3'])
        self.assertEqual(B, ['4', '5'])
        self.assertEqual(len(I), 9)
        I, B, E = Q.split(net, ['4', '5'], internal=['1'])
        self.assertEqual(sorted(I, key=int), ['1', '2', '3'])
        self.assertEqual(len(E), 9)
        with self.assertRaises(Q.EquivalentError):
            Q.split(net, ['99'])
        with self.assertRaises(Q.EquivalentError):
            Q.split(net, ['4'], internal=['1'])          # bus 5 joins the two sides: no boundary between them

    def test_base_case_exact(self):
        for case, B, I in ((14, ['4', '5'], ['1']), (14, ['6', '7', '9'], None), (30, ['9', '10', '12', '27'], None), (30, ['4', '6', '28'], ['1'])):
            net = N.ieee(case)
            lf = net.power_flow(tol=1e-12)
            for kind in ('ward', 'xward'):
                eq = net.equivalent(B, I, kind=kind, lf=lf, tol=1e-12)
                ok, err = base_error(net, eq, lf)
                self.assertTrue(ok, (case, B, kind))
                self.assertLess(err, 1e-10, (case, B, kind, err))
                if eq['slack']:
                    self.assertIn(eq['slack'], B)
                    self.assertTrue(any(e['kind'] == 'feeder' and e['bus'] == eq['slack'] for e in eq['net'].elements))

    def test_kron_branch_as_pandapower(self):
        # pandapower 3.5.6, grid_equivalents.get_equivalent(case9, 'ward', boundary_buses=[4, 8], internal_buses=[0]):
        # the impedance between the boundary buses, rft_pu, xft_pu
        net = N.ieee(9)
        eq = net.equivalent(['5', '9'], ['1'], kind='ward', tol=1e-12)
        self.assertEqual(sorted(eq['external'], key=int), ['2', '3', '6', '7', '8'])
        z = 1 / (-eq['Y'][0, 1])
        self.assertAlmostEqual(z.real, 0.076758735506354, delta=1e-12)
        self.assertAlmostEqual(z.imag, 0.4658190326112427, delta=1e-12)
        self.assertLess(eq['asym'], 1e-12)

    def test_extended_ward_answers_outages(self):
        # IEEE 30: the slack inside, the generators 11 and 13 beyond the boundary (the 33 kV side): every outage of a branch
        # of the study area. Measured (5.0.3): Ward 0.0327 pu at most, extended Ward 0.0049
        net = N.ieee(30)
        lf = net.power_flow(tol=1e-12)
        res = {}
        for kind in ('ward', 'xward'):
            eq = net.equivalent(['4', '6', '28'], ['1'], kind=kind, lf=lf, tol=1e-12)
            c = Q.compare(net, eq, tol=1e-10)
            ok = [o for o in c['outages'] if 'dV' in o]
            self.assertEqual(len(ok), len(c['outages']))
            self.assertLess(c['base']['dV'], 1e-10)
            res[kind] = (max(o['dV'] for o in ok), max(o['dA'] for o in ok))
        self.assertEqual(len(eq['fictitious']), 3)
        self.assertAlmostEqual(res['ward'][0], 0.0327, delta=5e-4)
        self.assertLess(res['xward'][0], 0.006)
        self.assertLess(res['xward'][0], res['ward'][0] / 5)
        self.assertLess(res['xward'][1], res['ward'][1] / 5)

    def test_norton_current(self):
        # the current that flows from the boundary buses into the external network in the full solution = Y_eq·V_B − I_eq
        for case, B, I in ((14, ['4', '5'], ['1']), (30, ['9', '10', '12', '27'], None)):
            net = N.ieee(case)
            lf = net.power_flow(tol=1e-12)
            eq = net.equivalent(B, I, kind='norton', lf=lf, tol=1e-12)
            self.assertIsNone(eq['net'])
            names, idx, Y = Q._ymat(net)
            V = np.array([Q._v(lf, b) for b in names])
            ret = Q._retained(net, eq['external'])
            rn, ridx, Yr = Q._ymat(ret)
            Vr = np.array([Q._v(lf, b) for b in rn])
            Iext = (Y @ V)[[idx[b] for b in B]] - (Yr @ Vr)[[ridx[b] for b in B]]
            VB = V[[idx[b] for b in B]]
            self.assertLess(np.max(np.abs(eq['Y'] @ VB - eq['I'] - Iext)), 1e-10)
            # with the machines (generators behind x″d, loads as admittances): the same current at the base case
            self.assertLess(np.max(np.abs(eq['Ym'] @ VB - eq['Im'] - Iext)), 1e-10)
            # the Thevenin: open circuit voltages and the short-circuit power of each port
            self.assertLess(np.max(np.abs(eq['Z'] @ eq['Im'] - eq['E'])), 1e-12)
            self.assertTrue(all(v and v > 0 for v in eq['Sk'].values()))
            with self.assertRaises(Q.EquivalentError):
                Q.compare(net, eq)

    def test_short_circuit_equivalent(self):
        # the sequence networks of IEC 60909-0 reduced to the boundary: the same I″k at every kept bus, four kinds of fault,
        # in the test network of IEC TR 60909-4 (zero sequence with earthing, a three-winding transformer, motors beyond)
        net = tr60909_4()
        for B, I in ((['2', '5'], ['3']), (['5'], ['3']), (['2'], ['3']), (['5'], ['6'])):
            for mode in ('max', 'min'):
                eq = net.equivalent(B, I, kind='sc', mode=mode)
                red = eq['net']
                self.assertEqual(sorted(b for b in red.buses if not b.startswith('~')), sorted(eq['internal'] + eq['boundary']))
                kept = [b for b in red.buses if not b.startswith('~') and red.buses[b]['type'] != 'internal']
                for f in ('3ph', '2ph', '1ph', '2phE'):
                    for b in kept:
                        a = net.short_circuit(b, fault=f, mode=mode)['Ik']
                        self.assertLess(abs(red.short_circuit(b, fault=f, mode=mode)['Ik'] - a) / a, 1e-12, (B, mode, f, b))
        # and the published values with the reduced network (Tables 22 and 23, ±0,02 %)
        red = net.equivalent(['2', '5'], ['3'], kind='sc')['net']
        for k, b in enumerate('2345'):
            self.assertLess(abs(red.short_circuit(b)['Ik'] / 1e3 - IK[k + 1]) / IK[k + 1], 2e-4, b)
            self.assertLess(abs(red.short_circuit(b, fault='1ph')['Ik'] / 1e3 - IK1[k]) / IK1[k], 2e-4, b)
        # IEEE 30: the same three-phase I″k
        net = N.ieee(30)
        red = net.equivalent(['4', '6', '28'], ['1'], kind='sc')['net']
        for b in [b for b in red.buses if not b.startswith('~')]:
            a = net.short_circuit(b)['Ik']
            self.assertLess(abs(red.short_circuit(b)['Ik'] - a) / a, 1e-12, b)


if __name__ == '__main__':
    unittest.main()
