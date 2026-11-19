"""4.21 (ROADMAP §87): phasor measurements (PMU) and current magnitudes in the state estimation (pcl/se.py), our own formulation:
the real and imaginary parts of a voltage and of the current into a branch on the common time reference, |I| at either end. The
references do not use its code: finite differences for the new derivatives, the load flow from which the measurements are made,
the linear relation of the phasors to the rectangular voltages (a set of PMU alone is a linear problem), brute force for the
reference angle, and the classical placement of four PMUs that observes all of IEEE 14 (buses 2, 6, 7, 9)."""
import unittest

import numpy as np

from pcl import network as N
from pcl import se
from pcl import study as S


def only(m, types):
    out = dict(m, measurements=[q for q in m['measurements'] if q['type'] in types], bad=[])
    return out


class Derivatives(unittest.TestCase):
    def test_the_new_rows_against_finite_differences(self):
        net = N.case_data('ieee14')
        case = net.case()
        V = net.power_flow('nr', tol=1e-12)['_V'] * (1 + 0.02 * np.cos(np.arange(case.n)))
        h, A = se.quantities(case, V, extra=True)
        n, nl = case.n, case.nl
        self.assertEqual(len(h), 5 * n + 10 * nl)
        self.assertEqual(A.shape, (5 * n + 10 * nl, 2 * n))
        h0, A0 = se.quantities(case, V)
        np.testing.assert_array_equal(h[:3 * n + 4 * nl], h0)                       # the quantities of 4.19.5 bit for bit
        self.assertEqual(abs(A[:3 * n + 4 * nl] - A0).max(), 0.0)
        x = np.r_[np.angle(V), np.abs(V)]
        d = 1e-6
        for j in range(2 * n):
            up, dn = x.copy(), x.copy()
            up[j] += d
            dn[j] -= d
            f = lambda y: se.quantities(case, y[n:] * np.exp(1j * y[:n]), deriv=False, extra=True)[0]      # noqa: E731
            fd = (f(up) - f(dn)) / (2 * d)
            np.testing.assert_allclose(A[3 * n + 4 * nl:, j].toarray().ravel(), fd[3 * n + 4 * nl:], atol=2e-7, err_msg=str(j))


class Estimates(unittest.TestCase):
    def test_exact_measurements_give_the_load_flow(self):
        for case in ('ieee9', 'ieee14', 'ieee118'):
            net = N.case_data(case)
            for kw in ({'plan': 'scada', 'pmu': ['2']}, {'plan': 'flows', 'pmu': 'all'}, {'plan': 'scada', 'currents': True}, {'plan': 'scada', 'currents': True, 'pmu': ['2', '3']}):
                r = se.run(net, noise=0.0, **kw)
                self.assertTrue(r['converged'], (case, kw))
                self.assertLess(r['error']['vector_max'], 1e-9, (case, kw))
                self.assertEqual(r['absolute'], 'pmu' in kw)
                self.assertEqual(r['n'], 2 * len(net.buses) - (0 if 'pmu' in kw else 1))
                self.assertEqual(r['start'], 'pmu' if 'pmu' in kw else 'staged' if kw.get('currents') else 'flat')

    def test_the_angle_reference_is_the_pmu(self):
        # with a voltage phasor the angles are those of the common time reference: the whole network turned by 10° is found turned
        net = N.case_data('ieee14')
        m = se.measure(net, plan='scada', noise=0.0, pmu=['4'])
        lf = m['truth']
        turn = np.exp(1j * np.radians(10.0))
        pairs = {}                                                  # every pair (re, im) of a phasor turned by the 10°
        for q in m['measurements']:
            if q['type'] in se.PHASOR:
                pairs.setdefault((q['type'][:-1], q.get('bus', q.get('branch'))), {})[q['type'][-1]] = q
        for p in pairs.values():
            z = complex(p['r']['value'], p['i']['value']) * turn
            p['r']['value'], p['i']['value'] = z.real, z.imag
        r = se.run(net, m['measurements'])
        self.assertTrue(r['converged'])
        for b, d in r['buses'].items():
            self.assertAlmostEqual(d['angle'], lf['buses'][b]['angle'] + 10.0, delta=1e-7, msg=b)
            self.assertAlmostEqual(d['V'], lf['buses'][b]['V'], delta=1e-9, msg=b)
        # without the phasor the reference is the slack again, at its own angle
        r0 = se.run(net, [q for q in m['measurements'] if q['type'] not in se.PHASOR])
        self.assertAlmostEqual(r0['buses']['1']['angle'], lf['buses']['1']['angle'], delta=1e-9)

    def test_four_pmus_observe_ieee14(self):
        # the classical placement (buses 2, 6, 7, 9): their voltages and the currents of the branches at them fix every bus
        net = N.case_data('ieee14')
        m = only(se.measure(net, plan='flows', noise=1.0, seed=3, pmu=['2', '6', '7', '9']), se.PHASOR)
        ob = se.observability(net, m, zero_injections=False)
        self.assertTrue(ob['observable'])
        r = se.run(net, m, zero_injections=False)
        self.assertTrue(r['converged'])
        self.assertLess(r['error']['V_max'], 0.01)
        # three of them do not
        m3 = only(se.measure(net, plan='flows', noise=0.0, pmu=['2', '6', '7']), se.PHASOR)
        self.assertFalse(se.observability(net, m3, zero_injections=False)['observable'])
        self.assertFalse(se.run(net, m3, zero_injections=False)['observable'])

    def test_a_pmu_alone_is_linear(self):
        # every bus with a PMU: the phasors are linear in the rectangular voltages, so the weighted least squares of the rectangular
        # problem, solved once, is the optimum the Gauss–Newton of the polar state ends on
        net = N.case_data('ieee9')
        m = only(se.measure(net, plan='flows', noise=1.0, seed=7, pmu='all'), se.PHASOR)
        case = net.case()
        n = case.n
        rows, z, sg = se._rows(case, m['measurements'])
        H = np.zeros((len(rows), 2 * n))                           # columns: Re V, Im V
        Yf, Yt = case.Yf.toarray(), case.Yt.toarray()
        for r_, q in enumerate(m['measurements']):
            t = q['type']
            if t in ('Vr', 'Vi'):
                i = case.idx[q['bus']]
                H[r_, i if t == 'Vr' else n + i] = 1.0
            else:
                Y = Yf if t[1] == 'f' else Yt
                kk = case.br_name.index(q['branch'])
                y = Y[kk]
                H[r_] = np.r_[y.real, -y.imag] if t[-1] == 'r' else np.r_[y.imag, y.real]
        W = np.diag(1 / sg ** 2)
        x = np.linalg.solve(H.T @ W @ H, H.T @ W @ z)
        Vlin = x[:n] + 1j * x[n:]
        r = se.run(net, m, zero_injections=False, tol=1e-12)
        np.testing.assert_allclose(r['_V'], Vlin, atol=1e-10)

    def test_bad_phasor_and_current(self):
        net = N.case_data('ieee14')
        for bad, t in (([{'type': 'Vi', 'bus': '6', 'error': 25.0}], 'Vi'), ([{'type': 'If', 'branch': 'br5', 'error': 25.0}], 'If')):
            m = se.measure(net, plan='scada', noise=1.0, seed=2, pmu=['2', '6', '7', '9'], currents=True, bad=bad)
            r = se.run(net, m)
            self.assertTrue(r['converged'])
            self.assertEqual(r['bad'][0]['type'], t)
            self.assertEqual(r['bad'][0]['index'], m['bad'][0])

    def test_refusals(self):
        net = N.case_data('ieee9')
        m = se.measure(net, plan='scada', noise=0.0, pmu=['4'])
        with self.assertRaises(se.SeError):                         # a current phasor without a voltage phasor
            se.run(net, [q for q in m['measurements'] if q['type'] not in ('Vr', 'Vi')])
        m = se.measure(net, plan='tree', noise=0.0, currents=True)
        with self.assertRaises(se.SeError):                         # |I| and nothing else that fixes the state: no start
            se.run(net, [q for q in m['measurements'] if q['type'] in ('If', 'V')])
        with self.assertRaises(se.SeError):
            se.measure(net, pmu=['99'])
        with self.assertRaises(se.SeError):
            se.run(net, start='nowhere')

    def test_study(self):
        out = S.run({'case': 'ieee14', 'study': 'se', 'options': {'plan': 'scada', 'pmu': ['2', '6', '7', '9'], 'currents': True, 'noise': 0.0}})
        sm = out['summary']
        self.assertTrue(sm['converged'])
        self.assertEqual(sm['counts']['Vr'], 4)
        self.assertLess(sm['error']['vector_max'], 1e-9)


if __name__ == '__main__':
    unittest.main()
