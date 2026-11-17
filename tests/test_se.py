"""State estimation (4.19.5, ROADMAP §79, pcl/se.py). The references do not use its code: the worked three-bus example of Abur
& Gómez Expósito (2004), the load flow from which the measurements are made, finite differences for the derivatives and for
the optimum, the statistics that the theory predicts over many sets of random errors, and brute force (the rank of the full
Jacobian, the removal of a measurement) for observability and critical measurements."""
import unittest

import numpy as np

from pcl import network as N
from pcl import powerflow as PF
from pcl import se
from pcl import study as S


def three():
    """The three-bus system of the book (Example 2.2): impedances in per unit, no charging."""
    net = N.Network(S_base=100e6, name='three')
    for b in ('1', '2', '3'):
        net.bus(b, 110e3)
    net.feeder('1', Sk=1e12, V=1.0, slack=True)
    for a, b, r, x in (('1', '2', 0.01, 0.03), ('1', '3', 0.02, 0.05), ('2', '3', 0.03, 0.08)):
        net.branch_pu(a, b, r, x, name=f'L{a}{b}')
    net.load('2', 50e6, 30e6)                                    # (that these two buses have a load is all the estimator takes from it)
    net.load('3', 150e6, 80e6)
    return net


BOOK = [('Pf', 'L12', 0.888, 0.008), ('Pf', 'L13', 1.173, 0.008), ('P', '2', -0.501, 0.010), ('Qf', 'L12', 0.568, 0.008), ('Qf', 'L13', 0.663, 0.008),
        ('Q', '2', -0.286, 0.010), ('V', '1', 1.006, 0.004), ('V', '2', 0.968, 0.004)]                     # Example 2.2: type, place, value, σ (pu)
BOOK_STATE = {'1': (0.9996, 0.0), '2': (0.9742, -1.2475), '3': (0.9439, -2.7457)}                          # Example 2.6: |V| (pu), angle (°)
BOOK_EST = [0.8930, 1.1711, -0.4959, 0.5588, 0.6677, -0.2977, 0.9996, 0.9742]                              # the estimated measurements
BOOK_G = np.array([[3.2086, -0.4472, -0.0698, -0.0314, 0.0038], [-0.4472, np.nan, -0.0451, 0.0045, 0.0000], [-0.0698, -0.0451, 3.2011, -2.8862, -0.2160],
                   [-0.0314, 0.0045, -2.8862, 3.3105, -0.4760], [0.0038, 0.0000, -0.2160, -0.4760, 0.6684]]) * 1e7   # the gain matrix at the third iteration (θ2, θ3, V1, V2, V3)


def book():
    return [dict(type=k, value=v, sigma=s, **({'bus': w} if k in ('V', 'P', 'Q') else {'branch': w})) for k, w, v, s in BOOK]


def copy(m):
    return {'measurements': [dict(q) for q in m['measurements']], 'truth': m['truth'], 'plan': m['plan'], 'bad': list(m.get('bad') or [])}


def ac_rank(net, meas, zero=True):
    """Brute force: the rank of the Jacobian of the full model at a generic state (dense), with the zero injections as rows."""
    case = net.case()
    rng = np.random.default_rng(5)
    V = (1 + 0.05 * rng.standard_normal(case.n)) * np.exp(1j * 0.1 * rng.standard_normal(case.n))
    _, A = se.quantities(case, V)
    row, _, _ = se._rows(case, meas)
    zi = se.zero_injection(case) if zero else np.zeros(0, int)
    ref = int(np.flatnonzero(case.typ == PF.REF)[0])
    cols = np.r_[np.delete(np.arange(case.n), ref), case.n + np.arange(case.n)]
    H = A[np.r_[row, case.n + zi, 2 * case.n + zi].astype(int)][:, cols].toarray()
    return int(np.linalg.matrix_rank(H, tol=1e-8 * np.abs(H).max())), len(cols)


class Estimator(unittest.TestCase):
    def test_the_published_three_bus_example(self):
        net = three()
        r = se.run(net, book(), detect=False, tol=1e-10)
        self.assertTrue(r['converged'])
        self.assertEqual((r['m'], r['n'], r['constraints'], r['dof']), (8, 5, 0, 3))
        for b, (v, a) in BOOK_STATE.items():                                # the book prints four decimals
            self.assertAlmostEqual(r['buses'][b]['V'], v, delta=5e-5)
            self.assertAlmostEqual(r['buses'][b]['angle'], a, delta=5e-5)
        for m, est in zip(r['measurements'], BOOK_EST):                     # its estimated values come from an iteration stopped at 1e-4
            self.assertAlmostEqual(m['estimate'], est, delta=1.5e-4)
        self.assertAlmostEqual(r['J'], 8.6, delta=0.05)                     # the objective function at its third iteration
        # the gain matrix of the book, from the derivatives at the estimate
        case = net.case()
        _, A = se.quantities(case, r['_V'])
        row, _, s = se._rows(case, book())
        H = A[row][:, [1, 2, 3, 4, 5]].toarray()
        G = H.T @ np.diag(1 / s ** 2) @ H
        ok = ~np.isnan(BOOK_G)                                              # (one entry of the printed matrix does not read)
        self.assertLess(np.abs(G[ok] - BOOK_G[ok]).max(), 2e-4 * 1e7)
        # from the estimate of the book as a start it stays there; a start far away ends on the same estimate
        again = se.run(net, book(), detect=False, tol=1e-12, start='given')
        self.assertLess(max(abs(again['buses'][b]['V'] - r['buses'][b]['V']) for b in '123'), 1e-9)

    def test_the_residual_covariance_of_the_published_dc_example(self):
        # Example 5.1: the three active measurements of the same system on the DC model (P12, P13, P2 against θ2, θ3)
        H = np.array([[-1 / 0.03, 0.0], [0.0, -1 / 0.05], [1 / 0.03 + 1 / 0.08, -1 / 0.08]])
        sig = np.array([0.008, 0.008, 0.010])
        Om = se.residual_covariance(H, sig)
        book_Om = np.array([[0.3146, -0.1431, 0.3577], [-0.1431, 0.0651, -0.1627], [0.3577, -0.1627, 0.4068]]) * 1e-4
        book_S = np.array([[0.4916, -0.2236, 0.3577], [-0.2236, 0.1017, -0.1627], [0.5589, -0.2542, 0.4068]])
        self.assertLess(np.abs(Om - book_Om).max(), 4e-8)                    # (the book rounds 45,83 to 45,8 in its Jacobian)
        self.assertLess(np.abs(Om / sig ** 2 - book_S).max(), 4e-4)          # the sensitivity matrix S = Ω·R⁻¹
        G = H.T @ np.diag(1 / sig ** 2) @ H
        self.assertLess(np.abs(G - np.array([[3.837, -0.5729], [-0.5729, 0.7812]]) * 1e7).max(), 5e3)
        self.assertLess(np.abs(Om - Om.T).max(), 1e-18)
        self.assertEqual(np.linalg.matrix_rank(Om, tol=1e-12), 1)            # three measurements, two states: one degree of freedom

    def test_the_derivatives_against_finite_differences(self):
        for name in ('ieee14', 'ieee300'):                                   # the second has taps and phase shifters
            case = N.case_data(name).case()
            rng = np.random.default_rng(2)
            V = (1 + 0.04 * rng.standard_normal(case.n)) * np.exp(1j * 0.2 * rng.standard_normal(case.n))
            h, A = se.quantities(case, V)
            self.assertEqual((len(h), A.shape), (3 * case.n + 4 * case.nl, (3 * case.n + 4 * case.nl, 2 * case.n)))
            worst = 0.0
            for j in rng.choice(2 * case.n, 12, replace=False):
                d = 1e-6
                e = np.zeros(2 * case.n)
                e[j] = d
                up = (np.abs(V) + e[case.n:]) * np.exp(1j * (np.angle(V) + e[:case.n]))
                dn = (np.abs(V) - e[case.n:]) * np.exp(1j * (np.angle(V) - e[:case.n]))
                fd = (se.quantities(case, up, deriv=False)[0] - se.quantities(case, dn, deriv=False)[0]) / (2 * d)
                worst = max(worst, np.abs(fd - A[:, j].toarray().ravel()).max() / max(1.0, np.abs(fd).max()))
            self.assertLess(worst, 1e-7, name)
            # the quantities are those of the load flow: injections, and flows of both ends that differ by the losses
            lf = N.case_data(name).power_flow('nr', tol=1e-10)
            h, _ = se.quantities(case, lf['_V'], deriv=False)
            n, nl = case.n, case.nl
            want = case.Sg - case.zip(np.abs(lf['_V']))                       # what the load flow asked for: P but at the slack, Q at the PQ buses
            self.assertLess(np.abs(h[n:2 * n] - want.real)[case.typ != PF.REF].max(), 1e-8, name)
            self.assertLess(np.abs(h[2 * n:3 * n] - want.imag)[case.typ == PF.PQ].max(), 1e-8, name)
            self.assertAlmostEqual(float(np.sum(h[3 * n:3 * n + nl] + h[3 * n + 2 * nl:3 * n + 3 * nl])) + float(np.sum((np.abs(lf['_V']) ** 2 * case.ysh).real)),
                                   lf['losses'] / case.S_base, delta=1e-7)

    def test_exact_measurements_give_the_load_flow(self):
        for name in ('ieee9', 'ieee14', 'ieee57', 'ieee118', 'case33bw', 'case69', 'ieee300'):
            net = N.case_data(name)
            for plan in se.PLANS:
                r = se.run(net, plan=plan, noise=0.0)
                self.assertTrue(r['converged'] and r['observable'], (name, plan))
                self.assertLess(r['error']['vector_max'], 1e-9, (name, plan))
                self.assertLess(r['J'], 1e-12, (name, plan))
                self.assertEqual(r['bad'], [], (name, plan))
                self.assertLessEqual(r['iterations'], 7, (name, plan))
                self.assertAlmostEqual(r['losses'], r_true(net), delta=1e-3 * net.S_base / 1e6, msg=(name, plan))
        # without redundancy every measurement is critical and the estimate is still exact
        r = se.run(N.case_data('case33bw'), plan='tree', noise=0.0)
        self.assertEqual((r['m'], r['n'], r['dof'], len(r['critical'])), (65, 65, 0, 65))

    def test_the_estimate_is_the_minimum(self):
        net = N.case_data('ieee14')
        m = se.measure(net, plan='scada', seed=4)
        r = se.run(net, copy(m), detect=False, zero_injections=False, tol=1e-11)
        case = net.case()
        row, z, s = se._rows(case, m['measurements'])
        J = lambda V: float(np.sum(((z - se.quantities(case, V, deriv=False)[0][row]) / s) ** 2))      # noqa: E731
        V = r['_V']
        self.assertAlmostEqual(J(V), r['J'], delta=1e-9 * r['J'])
        # the gradient by finite differences is zero against the size of its terms, and every direction goes up
        rng = np.random.default_rng(1)
        ang, Vm = np.angle(V), np.abs(V)
        for _ in range(40):
            da, dv = rng.standard_normal(case.n), rng.standard_normal(case.n)
            da[case.idx['1']] = 0.0                                          # the reference stays
            step = lambda t: (Vm + t * dv) * np.exp(1j * (ang + t * da))     # noqa: E731
            t = 1e-4
            slope = (J(step(t)) - J(step(-t))) / (2 * t)
            curve = (J(step(t)) - 2 * J(V) + J(step(-t))) / t ** 2
            self.assertLess(abs(slope), 1e-5 * curve)
            self.assertGreater(curve, 0.0)
        # with the equality constraints: the buses without load and generation inject nothing, exactly; without them they do
        c = se.run(net, copy(m), detect=False, tol=1e-11)
        self.assertEqual(c['zero_buses'], ['7'])
        self.assertLess(abs(c['buses']['7']['P'] - c['buses']['7']['Pload']) + abs(c['buses']['7']['Q'] - c['buses']['7']['Qload']), 1e-6)          # W
        self.assertGreater(abs(r['buses']['7']['P'] - r['buses']['7']['Pload']), 1e3)
        self.assertEqual((c['dof'], r['dof']), (46, 44))
        self.assertGreaterEqual(c['J'], r['J'] - 1e-9)                       # a constraint cannot lower the minimum

    def test_the_covariance_of_the_residuals(self):
        # the fast path (one solve per measurement on the factors) against the dense formula
        net = N.case_data('ieee14')
        m = se.measure(net, plan='scada', seed=2)
        r = se.run(net, copy(m), detect=False, zero_injections=False, tol=1e-11)
        case = net.case()
        row, z, s = se._rows(case, m['measurements'])
        _, A = se.quantities(case, r['_V'])
        H = A[row][:, np.r_[1:case.n, case.n:2 * case.n]].toarray()
        Om = se.residual_covariance(H, s)
        res = z - se.quantities(case, r['_V'], deriv=False)[0][row]
        rN = np.abs(res) / np.sqrt(np.diag(Om))
        self.assertLess(np.abs(rN - np.array([q['rN'] for q in r['measurements']])).max(), 1e-7)
        self.assertAlmostEqual(float(np.trace(Om @ np.diag(1 / s ** 2))), r['dof'], delta=1e-8)       # the trace of the sensitivity matrix is m − n
        self.assertEqual(r['critical'], [])

    def test_the_statistics_of_the_tests(self):
        net = N.case_data('ieee14')
        J, over, big, tot, err = [], 0, 0, 0, []
        for seed in range(200):
            r = se.run(net, plan='scada', seed=100 + seed, detect=False)
            J.append(r['J'])
            over += r['suspect']
            rn = np.array([m['rN'] for m in r['measurements']])
            big += int((rn > 3).sum())
            tot += len(rn)
            err.append(r['error']['V_max'])
        dof = r['dof']
        self.assertEqual(dof, 46)
        self.assertLess(abs(np.mean(J) - dof), 3 * np.sqrt(2 * dof / 200))   # J is χ² with m + constraints − n degrees of freedom
        self.assertLess(abs(np.var(J) / (2 * dof) - 1), 0.35)
        self.assertLess(over / 200, 0.04)                                    # 1 % above the 99 % threshold
        self.assertLess(abs(big / tot - 0.0027), 0.002)                      # the normalized residuals are standard normal
        self.assertLess(np.mean(err), 0.004)                                 # the estimate is better than a voltage meter (σ = 0,004 pu)

    def test_one_gross_error_is_found(self):
        net = N.case_data('ieee14')
        m0 = se.measure(net, plan='scada', noise=0.0)
        self.assertEqual(se.run(net, copy(m0), detect=False)['critical'], [])
        for i in range(len(m0['measurements'])):                             # every measurement in turn, the others exact
            m = copy(m0)
            m['measurements'][i]['value'] += 20 * m['measurements'][i]['sigma']
            r = se.run(net, m)
            self.assertEqual([b['index'] for b in r['bad']], [i])            # the largest normalized residual is the wrong measurement
            self.assertAlmostEqual(r['bad'][0]['error'] / r['bad'][0]['sigma'], 20.0, delta=0.6)       # (the model is not linear: within 3 %)
            self.assertTrue(r['first']['suspect'])
            self.assertLess(r['error']['vector_max'], 1e-8)                  # and the estimate without it is the load flow again
            self.assertAlmostEqual(r['measurements'][i]['residual'], 20 * m['measurements'][i]['sigma'], delta=1e-7)
            self.assertFalse(r['measurements'][i]['used'])
        # with random errors too: the usual cases of the study, on several networks
        for name in ('ieee9', 'ieee14', 'ieee57', 'ieee118', 'case69'):
            for bad in ('flow', 'injection', 'voltage', 'two'):
                if (name, bad) == ('case69', 'voltage'):                     # (its own case below)
                    continue
                r = se.run(N.case_data(name), plan='scada', seed=1, bad=bad)
                found = [b['index'] for b in r['bad']]
                self.assertTrue(set(r['planted']) <= set(found), (name, bad))
                self.assertTrue(r['first']['suspect'], (name, bad))
                self.assertLess(r['largest'], 3.0 + 1e-12)
        r = se.run(N.case_data('ieee14'), plan='scada', seed=1, bad='voltage')
        self.assertGreater(r['error']['first_V_max'], 5 * r['error']['V_max'])       # what the wrong voltage did to the estimate before it was taken out
        r = se.run(N.case_data('ieee14'), plan='scada', seed=1, bad='voltage', detect=False)
        self.assertEqual((r['bad'], r['rounds'], r['suspect']), ([], 1, True))
        # a feeder with one voltage meter: nothing else measures the level of the voltages well, so its error is not seen (its
        # normalized residual stays below the threshold) and moves every voltage of the estimate
        r = se.run(N.case_data('case69'), plan='scada', seed=1, bad='voltage')
        i = r['planted'][0]
        self.assertEqual((r['counts']['V'], r['bad']), (1, []))
        self.assertLess(r['measurements'][i]['rN'], 3.0)
        self.assertAlmostEqual(r['error']['V_max'], 20 * 0.004, delta=0.015)

    def test_without_redundancy_an_error_is_not_seen(self):
        net = N.case_data('ieee14')
        a = se.run(net, plan='tree', seed=1, zero_injections=False)
        b = se.run(net, plan='tree', seed=1, zero_injections=False, bad='flow')
        self.assertEqual((a['m'], a['n'], a['dof'], len(a['critical'])), (27, 27, 0, 27))
        self.assertLess(max(a['J'], b['J']), 1e-12)                          # every residual is zero, with the gross error too
        self.assertEqual(b['bad'], [])
        self.assertGreater(b['error']['vector_max'], 3 * a['error']['vector_max'])       # the error went into the estimate
        # brute force: a measurement is critical exactly when the state cannot be found without it
        for plan, zero in (('tree', False), ('tree', True), ('flows', True)):
            m = se.measure(net, plan=plan, noise=0.0, zero_injections=zero)
            crit = set(se.run(net, copy(m), detect=False, zero_injections=zero)['critical'])
            for i in range(len(m['measurements'])):
                rest = [q for j, q in enumerate(m['measurements']) if j != i]
                rank, n = ac_rank(net, rest, zero)
                self.assertEqual(rank < n, i in crit, (plan, zero, i))
                if m['measurements'][i]['type'] == 'V':                      # the only voltage meter: the full model still finds the level of the
                    self.assertFalse(se.observability(net, rest, zero)['magnitudes'])      # voltages from the powers (weakly); the decoupled test asks for a meter
            # the decoupled test of observability looks at P and Q apart, so it is compared for a meter of both (P and Q of one place)
            places = sorted({q['branch'] for q in m['measurements'] if 'branch' in q})
            for br in places:
                rest = [q for q in m['measurements'] if q.get('branch') != br]
                rank, n = ac_rank(net, rest, zero)
                self.assertEqual(se.observability(net, rest, zero)['observable'], rank == n, (plan, zero, br))
        self.assertEqual(len(se.run(net, plan='tree', noise=0.0)['critical']), 16)     # the zero injection of bus 7 gives back some redundancy
        # two measurements that check only each other: the error is seen and cannot be placed (their normalized residuals are equal)
        m = se.measure(net, plan='tree', noise=0.0, zero_injections=False)
        br = m['measurements'][1]['branch']
        m['measurements'].append(dict(m['measurements'][1], type='Pt', value=float(se.quantities(net.case(), m['truth']['_V'], deriv=False)[0][3 * 14 + 2 * 20 + net.case().br_name.index(br)])))
        m['measurements'][1]['value'] += 20 * m['measurements'][1]['sigma']
        r = se.run(net, m, detect=False, zero_injections=False)
        pair = [q['rN'] for q in r['measurements'] if q.get('branch') == br and q['type'] in ('Pf', 'Pt')]
        self.assertEqual(len(pair), 2)
        self.assertAlmostEqual(pair[0], pair[1], delta=1e-6 * pair[0])
        self.assertGreater(pair[0], 10.0)
        self.assertTrue(r['suspect'])

    def test_observability_and_islands(self):
        net = N.case_data('ieee14')
        case = net.case()
        m = se.measure(net, plan='flows', noise=0.0)
        self.assertTrue(se.observability(net, m)['observable'])
        # without the flows of the three branches from the 132 kV part to the rest (the transformers 4–7, 4–9, 5–6) and without the
        # zero injection of bus 7, the two parts are observable each and the three branches are not
        cut = [case.br_name[k] for k in range(case.nl) if {case.names[case.f[k]], case.names[case.t[k]]} in ({'4', '7'}, {'4', '9'}, {'5', '6'})]
        self.assertEqual(len(cut), 3)
        rest = [q for q in m['measurements'] if q.get('branch') not in cut]
        ob = se.observability(net, rest, zero_injections=False)
        self.assertEqual((ob['observable'], ob['angles'], sorted(ob['branches'])), (False, False, sorted(cut)))
        self.assertEqual([sorted(q, key=int) for q in ob['islands']], [['6', '7', '8', '9', '10', '11', '12', '13', '14'], ['1', '2', '3', '4', '5']])
        r = se.run(net, rest, zero_injections=False)
        self.assertEqual((r['observable'], r['converged'], len(r['islands'])), (False, False, 2))
        self.assertIn('2 observable islands', r['message'])
        # with the zero injection of bus 7 the flow of 4–7 follows from those of 7–8 and 7–9: one tie between the two parts is enough
        ob = se.observability(net, rest, zero_injections=True)
        self.assertEqual((ob['observable'], ob['islands'], ac_rank(net, rest, True)), (True, [list(case.names)], (27, 27)))
        self.assertEqual(ac_rank(net, rest, False)[0], 26)
        # an injection at the boundary gives nothing and is dropped; a bus that nothing touches is an island of its own
        few = [q for q in m['measurements'] if q.get('branch') not in [case.br_name[k] for k in range(case.nl) if '8' in (case.names[case.f[k]], case.names[case.t[k]])]]
        ob = se.observability(net, few, zero_injections=False)
        self.assertIn(['8'], ob['islands'])
        self.assertEqual(se.uncovered(case, few), ['8'])
        # the verdict against the rank of the full Jacobian, for random parts of a full set (P and Q measured together)
        full = se.measure(net, plan='all', noise=0.0)['measurements']
        rng = np.random.default_rng(3)
        pairs = {}
        for q in full:
            pairs.setdefault((q['type'].replace('Q', 'P'), q.get('bus', q.get('branch'))), []).append(q)
        keys = sorted(pairs)
        seen = set()
        for _ in range(60):
            pick = [keys[i] for i in np.flatnonzero(rng.random(len(keys)) < rng.uniform(0.15, 0.6))]
            sub = [q for k in pick for q in pairs[k] if q['type'] != 'V'] + [q for q in full if q['type'] == 'V' and q['bus'] == '1']      # one voltage meter, always
            rank, n = ac_rank(net, sub)
            ob = se.observability(net, sub)
            self.assertEqual(ob['observable'], rank == n, pick)
            seen.add(ob['observable'])
        self.assertEqual(seen, {True, False})
        # reactive measurements alone do not fix the angles; active ones alone do not fix the magnitudes
        self.assertEqual([se.observability(net, [q for q in full if q['type'] in kinds])[k] for kinds, k in ((('Q', 'Qf', 'Qt', 'V'), 'angles'), (('P', 'Pf', 'Pt'), 'magnitudes'))], [False, False])

    def test_through_the_network_and_the_study(self):
        net = N.case_data('ieee14')
        r = net.estimate(plan='scada', bad='flow')
        self.assertEqual((r['converged'], [b['at'] for b in r['bad']], r['planted'], r['plan']), (True, ['br1'], [r['bad'][0]['index']], 'scada'))
        self.assertEqual(set(r['buses']['1']) >= {'V', 'angle', 'P', 'Q', 'V_true', 'angle_true', 'dV'}, True)
        q = S.run({'case': 'ieee14', 'study': 'se', 'options': {'plan': 'scada', 'bad': 'flow'}, 'view': True})
        s = q['summary']
        self.assertEqual((s['converged'], s['m'], s['n'], s['constraints'], s['n_bad'], s['found'], s['planted'], s['dof_first'], s['critical']), (True, 71, 27, 2, 1, 1, 1, 46, 0))
        self.assertEqual(q['layer'], 'residual')
        L = next(x for x in q['layers'] if x['layer'] == 'residual')
        self.assertAlmostEqual(max(v for v in L['branch_v'] if v is not None), s['bad'][0]['rN'], delta=1e-4)
        self.assertIsNone(L['bus_v'][list(net.buses).index('7')])            # the bus of zero injection has no meter
        self.assertIn('χωρίς μέτρηση', L['legend'][-1][1])
        self.assertIn('μετρήσεις', s['why'])
        # measurements of one's own: a list is enough; the report says what it found
        mine = [{k: v for k, v in m.items() if k in ('type', 'bus', 'branch', 'value', 'sigma')} for m in se.measure(net, seed=7)['measurements']]
        r = net.estimate(mine)
        self.assertTrue(r['converged'])
        self.assertNotIn('error', r)                                         # no load flow to compare with
        self.assertIsNone(r['plan'])
        html = net.report('se', bad='two').html()
        for part in ('Εκτίμηση κατάστασης', 'Μετρήσεις που βγήκαν', 'Κανονικοποιημένα υπόλοιπα', 'Η εκτίμηση απέναντι στη ροή φορτίου', 'βρέθηκαν τα 2'):
            self.assertIn(part, html)
        flows = [m for m in se.measure(net, plan='flows', seed=7)['measurements'] if m.get('branch') not in ('br8', 'br9', 'br10')]      # the three transformers
        self.assertIn('Παρατηρήσιμες νησίδες', net.report('se', measurements=flows, zero_injections=False).html())
        # what is refused, with the reason
        for kw, part in (({'plan': 'everything'}, 'plan'), ({'plan': 'flows', 'bad': 'injection'}, 'δεν έχει μέτρηση'), ({'confidence': 1.5}, 'confidence'), ({'start': 'warm'}, 'start')):
            with self.assertRaises(se.SeError) as e:
                net.estimate(**kw)
            self.assertIn(part, str(e.exception))
        for bad, part in (([{'type': 'I', 'bus': '1', 'value': 1.0}], 'type'), ([{'type': 'V', 'bus': '99', 'value': 1.0}], 'no bus'), ([{'type': 'Pf', 'branch': 'x', 'value': 1.0}], 'no branch'),
                          ([{'type': 'V', 'bus': '1', 'value': 1.0, 'sigma': 0.0}], 'standard deviation'), ([], 'no measurements')):
            with self.assertRaises(se.SeError) as e:
                net.estimate(bad)
            self.assertIn(part, str(e.exception))
        with self.assertRaises(S.StudyError):
            S.run({'case': 'ieee14', 'study': 'se', 'options': {'plan': 'flows', 'bad': 'two'}})
        few = net.estimate([{'type': 'V', 'bus': '1', 'value': 1.06}], zero_injections=False)
        self.assertEqual((few['observable'], few['converged']), (False, False))
        self.assertIn('1 measurements', few['message'])


def r_true(net):
    return net.power_flow('nr', tol=1e-10)['losses']


if __name__ == '__main__':
    unittest.main()
