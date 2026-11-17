"""The continuation load flow (4.19.5, ROADMAP §77, pcl/cpf.py). Three references that do not use its code: the closed form of
two buses (the nose and every point of both parts of the curve), the bisection of the convergence of the plain load flow of
the network with its loads scaled, and a plain Newton load flow at every point of the upper part with the bus types that
the curve reports there. No data of a third party beyond the test networks of the project."""
import json
import math
import unittest

import numpy as np

from pcl import cpf
from pcl import netview
from pcl import network as N
from pcl import powerflow as PF
from pcl import study as S


def two(E, r, x, P, Q, zipf=(0.0, 0.0, 1.0)):
    """A source behind an impedance and a load: the network with a closed form."""
    net = N.Network(S_base=100e6, name='two buses')
    net.bus('1', 110e3)
    net.bus('2', 110e3)
    net.feeder('1', Sk=1e12, V=E, slack=True)
    net.branch_pu('1', '2', r, x)
    net.load('2', P, Q, zip=zipf)
    return net


def closed(E, r, x, P, Q, S_base=100e6):
    """(λ at the nose, |V| there) for a load of constant power factor: the load impedance equals the line impedance in
    magnitude, S_max = E²/(2·|Z|·(1 + cos(θ_Z − φ))), |V| = E/(2·cos((θ_Z − φ)/2))."""
    Z, th, ph = math.hypot(r, x), math.atan2(x, r), math.atan2(Q, P)
    return E * E / (2 * Z * (1 + math.cos(th - ph))) * math.cos(ph) / (P / S_base) - 1, E / (2 * math.cos((th - ph) / 2))


def residual(E, r, x, P, Q, lam, V, S_base=100e6):
    """|V|⁴ + (2·(R·P + X·Q) − E²)·|V|² + |Z|²·(P² + Q²): zero at every solution of the two buses, upper or lower."""
    p, q = P / S_base * (1 + lam), Q / S_base * (1 + lam)
    return V ** 4 + (2 * (r * p + x * q) - E * E) * V ** 2 + (r * r + x * x) * (p * p + q * q)


def scaled(case, load0, Sg0, lam):
    """The arrays of a case with every load and every generator but the slack at (1 + λ) of its value."""
    nref = case.typ != PF.REF
    case.load = load0 * (1 + lam)
    case.Sg = Sg0.copy()
    case.Sg[nref] = Sg0[nref].real * (1 + lam) + 1j * Sg0[nref].imag


def bisection(net, q_limits=False, side=False, eps=1e-7):
    """The largest λ at which the plain load flow of the scaled network converges, every solve started from the last one that
    did. side: a solution with a bus at its upper limit above its set voltage (or at its lower limit below it) does not count."""
    c = net.case()
    load0, Sg0 = c.load.copy(), c.Sg.copy()

    def solve(lam, V0):
        scaled(c, load0, Sg0, lam)
        r = PF.solve(c, 'nr', tol=1e-8, q_limits=q_limits, V0=V0)
        ok = bool(r['converged'])
        if ok and side and q_limits:
            Vm = np.abs(r['V'])
            for i in np.flatnonzero((r['typ'] == PF.PQ) & (c.typ == PF.PV)):
                up = r['Sg'][i].imag >= c.qmax[i] - 1e-12
                ok = ok and not ((up and Vm[i] > c.Vset[i] + 1e-7) or (not up and Vm[i] < c.Vset[i] - 1e-7))
        return ok, r['V']
    ok, V = solve(0.0, None)
    lo, Vlo, hi = 0.0, V, 0.25
    while True:
        ok, V = solve(hi, Vlo)
        if not ok:
            break
        lo, Vlo, hi = hi, V, 2 * hi
    while hi - lo > eps:
        mid = 0.5 * (lo + hi)
        ok, V = solve(mid, Vlo)
        lo, Vlo, hi = (mid, V, hi) if ok else (lo, Vlo, mid)
    return lo


def types_along(case, res):
    """For every point of a curve the bus types and the reactive power of the sources of the buses at a limit, from its events."""
    typ, qg = case.typ.copy(), case.Sg.imag.copy()
    ev = sorted(res['events'], key=lambda e: e['point'])
    for p in range(res['points']):
        for e in ev:
            if e['point'] == p:
                i = case.idx[e['bus']]
                typ[i], qg[i] = (PF.PQ, case.qmax[i] if e['limit'] == 'max' else case.qmin[i]) if e['to'] == 'PQ' else (PF.PV, case.Sg.imag[i])
        yield p, typ.copy(), qg.copy()


def along(net, res):
    """A curve with reactive limits against a plain Newton load flow at every point before its nose, with the bus types of its
    events: {'solved': points the Newton solved, 'points': points before the nose, 'dV': the largest difference of a voltage (pu),
    'q': how far over a limit the worst bus that holds its voltage is (pu; negative: inside), 'side': how far on the wrong side
    of its set voltage the worst bus at a limit is, over every point of both parts (pu; 0: none)}."""
    c = net.case()
    load0 = c.load.copy()
    VV = np.array([res['V'][b] for b in c.names]).T
    nref = c.typ != PF.REF
    V0, at, ev = c.start(), np.zeros(c.n, int), {}
    out = {'solved': 0, 'points': res['nose']['point'], 'dV': 0.0, 'q': -1.0, 'side': 0.0}
    for e in res['events']:
        ev.setdefault(e['point'], []).append(e)
    try:
        for p, typ, qg in types_along(c, res):
            for e in ev.get(p, []):
                at[c.idx[e['bus']]] = (1 if e['limit'] == 'max' else -1) if e['to'] == 'PQ' else 0
            out['side'] = max(out['side'], float(np.max((VV[p] - c.Vset) * at, initial=0.0)))
            if p >= res['nose']['point']:                         # (the plain Newton does not hold the lower part)
                continue
            c.load = load0 * (1 + res['lambda'][p])
            Sg = c.Sg.real.copy()
            Sg[nref] *= 1 + res['lambda'][p]
            V0 = np.where(typ == PF.PQ, V0, c.Vset * np.exp(1j * np.angle(V0)))
            V, _, ok, _ = PF.newton(c, V0, tol=1e-11, typ=typ, Sg=Sg + 1j * qg, max_iter=30)
            if not ok:
                continue
            V0 = V
            out['solved'] += 1
            out['dV'] = max(out['dV'], float(np.max(np.abs(np.abs(V) - VV[p]))))
            Q = (V * np.conj(c.Y @ V)).imag + c.zip(np.abs(V)).imag
            pv = np.flatnonzero(typ == PF.PV)
            out['q'] = max(out['q'], float(np.max(np.maximum(Q[pv] - c.qmax[pv], c.qmin[pv] - Q[pv]), initial=-1.0)))
    finally:
        c.load = load0
    return out


def upper(net, res):
    """A curve without limits: (points before the nose that the plain load flow of the scaled network solves, the largest
    difference of a voltage from the curve at those points, pu)."""
    c = net.case()
    load0, Sg0 = c.load.copy(), c.Sg.copy()
    VV = np.array([res['V'][b] for b in c.names]).T
    V0, worst, n = None, 0.0, 0
    for p in range(res['nose']['point']):
        scaled(c, load0, Sg0, res['lambda'][p])
        s = PF.solve(c, 'nr', tol=1e-11, V0=V0)
        if s['converged']:
            n, V0 = n + 1, s['V']
            worst = max(worst, float(np.max(np.abs(np.abs(V0) - VV[p]))))
    return n, worst


def singular(net, res, p):
    """The smallest singular value of the Jacobian of the load flow, over the largest, at the load as it is (p = 0) or at the nose."""
    c = net.case()
    b = res['buses']
    V = np.array([b[k]['V'] * np.exp(1j * math.radians(b[k]['angle'])) for k in c.names]) if p else PF.solve(c, 'nr', tol=1e-11)['V']
    J = c.jac()
    J.fill(V, c.Y @ V, load=c.load * (1 + res['lambda'][p]))
    s = np.linalg.svd(J.J.toarray(), compute_uv=False)
    return float(s[-1] / s[0])


CASES2 = ((1.0, 0.0, 0.1, 100e6, 0.0), (1.0, 0.0, 0.1, 100e6, 50e6), (1.05, 0.02, 0.1, 80e6, 30e6), (1.0, 0.05, 0.08, 60e6, -20e6), (1.02, 0.01, 0.25, 150e6, 40e6))


class TwoBuses(unittest.TestCase):
    def test_the_nose_is_the_closed_form(self):
        for E, r, x, P, Q in CASES2:
            lm, vn = closed(E, r, x, P, Q)
            res = cpf.run(two(E, r, x, P, Q), tol=1e-12)
            ns = res['nose']
            self.assertTrue(res['converged'])
            self.assertEqual((ns['kind'], ns['refined'], ns['bus'], res['q_limits']), ('fold', True, '2', False))
            self.assertAlmostEqual(ns['lambda'], lm, delta=1e-10 * max(1.0, lm))
            self.assertAlmostEqual(ns['V'], vn, delta=1e-9)
            self.assertAlmostEqual(ns['margin_MW'], lm * P / 1e6, delta=1e-7)
            self.assertAlmostEqual(ns['load_MW'], (1 + lm) * P / 1e6, delta=1e-7)
            self.assertEqual(res['lambda'][ns['point']], max(res['lambda']))                         # the nose is a point of the curve, the highest one

    def test_every_point_of_both_parts_is_a_solution(self):
        for E, r, x, P, Q in CASES2:
            res = cpf.run(two(E, r, x, P, Q), tol=1e-12)
            lam, V = np.array(res['lambda']), np.array(res['V']['2'])
            j = res['nose']['point']
            self.assertLess(np.max(np.abs(residual(E, r, x, P, Q, lam, V))), 1e-11)
            self.assertTrue(np.all(np.diff(lam[:j + 1]) > 0) and np.all(np.diff(lam[j:]) < 0))       # up to the nose, then back
            self.assertTrue(np.all(np.diff(V) < 0))                                                  # the voltage falls all the way
            self.assertGreater(len(lam) - j, 5)                                                      # the lower part is there
            # the index of the weakest bus: positive before the nose, zero on it, negative after it
            ix = res['index']
            self.assertTrue(all(v > 0 for v in ix[:j]) and ix[j] == 0.0 and all(v < 0 for v in ix[j + 1:]))
            self.assertEqual((res['index_unit'], set(res['index_bus'])), ('MW/pu', {'2'}))
        # a load that the line carries only just: the lower part comes back to the load as it is, onto its second solution
        E, r, x, P, Q = CASES2[-1]
        res = cpf.run(two(E, r, x, P, Q), tol=1e-12)
        p, q = P / 100e6, Q / 100e6
        b, c = 2 * (r * p + x * q) - E * E, (r * r + x * x) * (p * p + q * q)
        low = math.sqrt((-b - math.sqrt(b * b - 4 * c)) / 2)
        self.assertEqual(res['lambda'][-1], 0.0)
        self.assertAlmostEqual(res['V']['2'][-1], low, delta=1e-10)
        self.assertAlmostEqual(res['V']['2'][0], math.sqrt((-b + math.sqrt(b * b - 4 * c)) / 2), delta=1e-10)

    def test_the_step_does_not_move_the_nose(self):
        E, r, x, P, Q = CASES2[2]
        lm, vn = closed(E, r, x, P, Q)
        n = []
        for kw in ({}, {'step': 0.3, 'dV': 0.05}, {'step': 0.02, 'dV': 0.005}, {'lower': False}):
            res = cpf.run(two(E, r, x, P, Q), **kw)
            self.assertAlmostEqual(res['nose']['lambda'], lm, delta=1e-8)                            # with the default tolerance of the load flow
            self.assertAlmostEqual(res['nose']['V'], vn, delta=1e-8)
            n.append(res['points'])
            if kw.get('lower') is False:
                self.assertEqual(res['nose']['point'], res['points'] - 1)                            # the curve ends on the nose
        self.assertTrue(n[1] < n[0] < n[2])                                                          # longer steps, fewer points
        # no step moves λ, a voltage or an angle by more than its limit
        res = cpf.run(two(E, r, x, P, Q), step=0.25, dV=0.01)
        self.assertLessEqual(np.max(np.abs(np.diff(res['lambda']))), 0.25 + 1e-12)
        self.assertLessEqual(np.max(np.abs(np.diff(res['V']['2']))), 0.01 + 1e-12)

    def test_loads_that_fall_with_the_voltage(self):
        # constant impedance: the voltage is E/|1 + Z·Y·(1 + λ)| and there is no loading limit; the curve says so and stops
        res = cpf.run(two(1.0, 0.01, 0.1, 100e6, 30e6, (1.0, 0.0, 0.0)))
        self.assertFalse(res['converged'])
        self.assertIn('χωρίς να βρεθεί όριο φόρτισης', res['message'])
        lam, V = np.array(res['lambda']), np.array(res['V']['2'])
        self.assertLess(np.max(np.abs(V - 1 / np.abs(1 + (0.01 + 0.1j) * (1 - 0.3j) * (1 + lam)))), 1e-9)
        self.assertEqual(res['nose']['kind'], None)
        # a part of constant power brings the nose back, later than with constant power alone
        a = cpf.run(two(1.0, 0.01, 0.1, 100e6, 30e6))['nose']['lambda']
        b = cpf.run(two(1.0, 0.01, 0.1, 100e6, 30e6, (0.5, 0.0, 0.5)))
        self.assertTrue(b['converged'])
        self.assertGreater(b['nose']['lambda'], a + 0.5)

    def test_the_direction_of_the_growth(self):
        net = N.case_data('ieee14')
        a, b = cpf.run(net, lower=False), cpf.run(net, direction='all', lower=False)
        self.assertEqual(a['nose']['lambda'], b['nose']['lambda'])
        self.assertEqual({k: round(v, 6) for k, v in a['growth'].items()}, {'load_MW': 259.0, 'load_Mvar': 73.5, 'gen_MW': 40.0})
        c = cpf.run(net, direction='load', lower=False)                                              # the slack covers everything
        self.assertEqual(c['growth']['gen_MW'], 0.0)
        self.assertLess(c['nose']['lambda'], a['nose']['lambda'] - 0.01)
        d = cpf.run(net, direction={'load': {'14': 1.0}}, lower=False)                               # one bus only
        self.assertAlmostEqual(d['growth']['load_MW'], 14.9, places=9)
        self.assertEqual(d['nose']['bus'], '14')
        self.assertAlmostEqual(d['nose']['margin_MW'], d['nose']['lambda'] * 14.9, places=9)
        e = cpf.run(net, direction={'add': {'14': [0.0, 10.0]}}, lower=False)                        # reactive load that is not there now
        self.assertEqual((e['index_unit'], e['growth']['load_MW']), ('Mvar/pu', 0.0))
        self.assertAlmostEqual(e['nose']['margin_Mvar'], 10.0 * e['nose']['lambda'], places=9)
        self.assertEqual(e['nose']['margin_MW'], 0.0)
        for bad, part in (({'load': {'99': 1}}, 'δεν υπάρχει ζυγός 99'), ({'foo': 1}, "'all', 'load'"), ({'gen': {'2': 1}}, 'δεν αυξάνει κανένα φορτίο'), ('up', "'all', 'load'"),
                          ({'add': {'14': 5}}, 'add = {ζυγός'), ({'load': {'14': 'x'}}, 'συντελεστές')):
            with self.assertRaises(cpf.CpfError) as err:
                cpf.run(net, direction=bad)
            self.assertIn(part, str(err.exception))
        with self.assertRaises(cpf.CpfError):
            cpf.run(net, step=0)


class Networks(unittest.TestCase):
    def test_the_nose_against_the_bisection_of_the_load_flow(self):
        # the load flow «converges» up to tol/|dF/dλ| past the nose, so the bisection sits a little above the curve: 7e-8 at most here
        for name in ('ieee9', 'ieee14', 'ieee30', 'ieee57', 'case33bw', 'case69'):
            net = N.case_data(name)
            res = cpf.run(net, lower=False)
            self.assertEqual((res['converged'], res['nose']['kind'], res['events']), (True, 'fold', []), name)
            self.assertAlmostEqual(res['nose']['lambda'], bisection(net), delta=3e-7, msg=name)

    def test_every_point_before_the_nose_is_the_load_flow_of_the_scaled_network(self):
        for name in ('ieee14', 'ieee57', 'ieee118'):
            net = N.case_data(name)
            res = cpf.run(net, tol=1e-10)
            n, worst = upper(net, res)
            self.assertEqual(n, res['nose']['point'], name)
            self.assertLess(worst, 1e-9, name)                                                       # measured: 2e-11

    def test_the_jacobian_of_the_load_flow_is_singular_at_the_nose(self):
        for name in ('ieee14', 'ieee30'):
            net = N.case_data(name)
            res = cpf.run(net, tol=1e-11, lower=False)
            self.assertGreater(singular(net, res, 0), 1e-3, name)                                    # regular at the load as it is
            self.assertLess(singular(net, res, res['nose']['point']), 1e-7, name)                    # singular at the nose

    def test_reactive_limits_on_the_way(self):
        for name, kind, last in (('ieee14', 'fold', None), ('ieee9', 'limit', '2'), ('ieee118', 'limit', '10')):
            net = N.case_data(name)
            res = cpf.run(net, q_limits=True, tol=1e-10)
            ns = res['nose']
            self.assertEqual((res['converged'], res['q_limits'], ns['kind']), (True, True, kind), name)
            self.assertLess(ns['lambda'], cpf.run(net, lower=False)['nose']['lambda'] - 0.05, name)  # the limits bring the nose earlier
            self.assertAlmostEqual(ns['lambda'], bisection(net, True, side=True), delta=3e-7, msg=name)
            at_nose = [e for e in res['events'] if e['point'] == ns['point']]
            self.assertEqual([e['bus'] for e in at_nose], [last] if last else [], name)
            # every point before the nose is the Newton load flow with the bus types of the events; there every bus that holds its
            # voltage is inside its limits; and at every point of both parts no bus at a limit is on the wrong side of its set voltage
            q = along(net, res)
            self.assertEqual(q['solved'], q['points'], name)
            self.assertLess(q['dV'], 1e-9, name)                                                     # measured: 6e-12
            self.assertLessEqual(q['q'], 1e-7, name)
            self.assertLessEqual(q['side'], 1e-8, name)
        # IEEE 9: the corner. The plain load flow with limits «converges» well past it, with the generator at its upper limit and
        # the voltage above the set value: that is why the bisection needs the check of the side
        net = N.case_data('ieee9')
        res = cpf.run(net, q_limits=True)
        self.assertAlmostEqual(res['nose']['lambda'], 1.565583, places=5)
        self.assertGreater(bisection(net, True), res['nose']['lambda'] + 0.01)
        self.assertIn('άμεση αστάθεια', res['events'][0]['what'])
        self.assertEqual((res['events'][0]['bus'], res['events'][0]['limit'], res['events'][0]['to'], res['buses']['2']['type'], res['buses']['2']['limit']), ('2', 'max', 'PQ', 'PQ', 'max'))
        self.assertAlmostEqual(res['buses']['2']['V'], 1.025, places=9)                              # on the corner the bus is still at its set voltage
        # IEEE 118: five generators start at their lower limit and take up voltage control again as the load grows
        res = cpf.run(N.case_data('ieee118'), q_limits=True)
        jn = res['nose']['point']
        start = {e['bus'] for e in res['events'] if e['point'] == 0 and e['limit'] == 'min'}
        back = [e['bus'] for e in res['events'] if 0 < e['point'] <= jn and e['to'] == 'PV']
        self.assertEqual((len(start), set(back), len(back)), (5, start, 5))
        self.assertAlmostEqual(res['nose']['lambda'], 1.080933, places=5)
        # a feeder whose only source is the slack bus: the option changes nothing; and a network without limits in its data says so
        net = N.case_data('case33bw')
        a, b = cpf.run(net, lower=False), cpf.run(net, q_limits=True, lower=False)
        self.assertEqual((b['events'], a['nose']['lambda']), ([], b['nose']['lambda']))
        self.assertFalse(cpf.run(two(1.0, 0.0, 0.1, 100e6, 0.0), q_limits=True, lower=False)['q_limits'])

    def test_the_largest_network(self):
        net = N.case_data('pegase1354')
        res = cpf.run(net, lower=False)
        self.assertTrue(res['converged'])
        self.assertAlmostEqual(res['nose']['lambda'], 0.528227, places=5)
        self.assertLess(res['steps']['factorizations'], 120)
        self.assertEqual(len(res['V']), 1354)


class Study(unittest.TestCase):
    def test_the_study_as_data(self):
        q = S.run({'case': 'ieee14', 'study': 'cpf', 'options': {'q_limits': True, 'nonsense': 1, 'step': ''}, 'view': True})
        json.dumps(q, allow_nan=False)
        s, r = q['summary'], q['result']
        self.assertEqual((q['study'], q['layer'], [x['layer'] for x in q['layers']]), ('cpf', 'collapse', ['base', 'voltage', 'angle', 'collapse']))
        self.assertEqual((s['converged'], s['kind'], s['bus'], s['weak'], s['events'], s['at_start'], s['last']), (True, 'fold', '14', ['14', '13', '10', '12', '9'], 4, 0, None))
        self.assertEqual([(e['bus'], e['limit'], e['to']) for e in s['first']], [('2', 'max', 'PQ'), ('3', 'max', 'PQ'), ('6', 'max', 'PQ'), ('8', 'max', 'PQ')])
        self.assertAlmostEqual(s['lambda'], 0.777995, places=5)
        self.assertAlmostEqual(s['margin_MW'], 201.50, places=2)
        self.assertAlmostEqual(s['nose_MW'] - s['load_MW'], s['margin_MW'], places=9)
        c = s['curve']
        self.assertEqual((c['bus'], c['lambda'][c['nose']], c['V'][c['nose']]), ('14', s['lambda'], s['V']))
        self.assertEqual(c['lambda'][c['nose']], max(c['lambda']))
        self.assertEqual(sorted(r['V']), sorted(r['buses']))
        self.assertEqual({len(v) for v in r['V'].values()}, {r['points']})
        # the summary of a large curve keeps the nose among its 240 points
        big = S.summary('cpf', cpf.run(two(1.0, 0.0, 0.1, 100e6, 0.0), step=0.01, dV=0.002))
        self.assertLessEqual(len(big['curve']['V']), 242)
        self.assertEqual(big['curve']['lambda'][big['curve']['nose']], max(big['curve']['lambda']))
        # the options of the study, and its refusals as errors of the study
        self.assertEqual(S.run({'case': 'ieee14', 'study': 'cpf', 'options': {'direction': 'load', 'lower': False}})['summary']['growth']['gen_MW'], 0.0)
        with self.assertRaises(S.StudyError) as e:
            S.run({'case': 'ieee14', 'study': 'cpf', 'options': {'direction': {'load': {'99': 1}}}})
        self.assertIn('δεν υπάρχει ζυγός 99', str(e.exception))
        self.assertEqual(N.case_data('ieee14').cpf(lower=False)['nose']['lambda'], cpf.run(N.case_data('ieee14'), lower=False)['nose']['lambda'])

    def test_the_layer_of_the_picture(self):
        net = N.case_data('ieee14')
        res = S._clean(net.cpf(q_limits=True))
        v = netview.view(net)
        L = netview.values(v, res, 'collapse')
        self.assertEqual((L['note'], L['unit_bus'], L['weak'], L['count']), ('', 'pu', '14', {'at_limit': 4}))
        self.assertEqual(L['bus'], {b: d['drop'] for b, d in res['buses'].items()})
        self.assertEqual(max(L['bus'], key=L['bus'].get), '14')
        self.assertEqual(L['bus']['1'], 0.0)                                                         # the slack bus holds its voltage
        self.assertIn('λ = 0,7780, 201,5 MW', L['note_base'])
        self.assertNotEqual(L['bus_color']['14'], L['bus_color']['1'])
        self.assertEqual(netview.values(v, res, 'voltage')['title'], 'Τάσεις ζυγών στο όριο φόρτισης')
        self.assertIn('συνεχιζόμενη ροή φορτίου', netview.values(v, res, 'violations')['note'].lower())
        self.assertTrue(netview.values(v, S._clean(net.power_flow()), 'collapse')['note'])           # a load flow cannot feed the layer
        self.assertEqual(netview.DEFAULT['cpf'], 'collapse')
        svg = netview.svg(v, res, 'collapse')
        self.assertIn('Ο πιο αδύναμος ζυγός: 14', svg)
        self.assertEqual(S.view({'case': 'ieee14', 'study': 'cpf', 'format': 'svg'})['name'], 'network_ieee14_cpf_collapse.svg')

    def test_the_report(self):
        q = S.report({'case': 'ieee118', 'study': 'cpf', 'options': {'q_limits': True}})
        self.assertEqual(q['name'], 'report_ieee118_cpf.html')
        json.dumps(q, allow_nan=False)
        sec = q['report']['sections']
        self.assertEqual(q['report']['title'], 'Συνεχιζόμενη ροή φορτίου: καμπύλη P–V και περιθώριο φόρτισης')
        charts = [s for s in sec if s['kind'] == 'chart']
        self.assertEqual([(c['chart'], len(c['series'])) for c in charts], [('line', 4), ('line', 1)])
        res = cpf.run(N.case_data('ieee118'), q_limits=True)
        self.assertEqual(charts[0]['x'], res['load_MW'])                                             # the curve against the load of the network, both parts
        self.assertEqual([c['name'] for c in charts[0]['series']], ['ζυγός ' + w['bus'] for w in res['weak'][:4]])
        self.assertEqual(len(charts[1]['x']), res['nose']['point'] + 1)                              # the index up to the nose
        facts = dict(next(s for s in sec if s['kind'] == 'facts')['pairs'])
        self.assertEqual((facts['Το όριο φόρτισης βρέθηκε'], facts['Πιο αδύναμος ζυγός'], facts['Όρια αέργου των γεννητριών']), (True, '10', True))
        self.assertAlmostEqual(facts['Περιθώριο φόρτισης (MW)'], res['nose']['margin_MW'], places=2)
        notes = [s['text'] for s in sec if s['kind'] == 'note']
        self.assertTrue(any('δεν είναι μύτη' in n and 'ζυγός 10' in n for n in notes))
        self.assertTrue(any('ήδη στο σημερινό φορτίο' in n for n in notes))
        tabs = {s['title']: s for s in sec if s['kind'] == 'table'}
        moved = [e for e in res['events'] if e['point'] > 0]
        self.assertEqual(len(tabs['Αλλαγές τύπου ζυγού']['rows']), len(moved))
        self.assertEqual([s['layer']['layer'] for s in sec if s['kind'] == 'network'], ['collapse', 'voltage'])
        self.assertIn('Καμπύλη P–V', q['html'])
        # without limits on a network that has them the report says what that leaves out
        q = S.report({'case': 'ieee14', 'study': 'cpf'})
        self.assertTrue(any('δεν εφαρμόστηκαν' in s['text'] for s in q['report']['sections'] if s['kind'] == 'note'))
        self.assertEqual(N.case_data('ieee9').report('cpf', q_limits=True).to_dict()['sections'][2]['pairs'][1][1], 'αλλαγή τύπου ζυγού σε όριο αέργου (άμεση αστάθεια)')


if __name__ == '__main__':
    unittest.main()
