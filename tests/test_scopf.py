"""The optimal power flow with security against the loss of any one branch (4.19.4, ROADMAP §75, pcl/scopf.py): the flows after
every outage are those of the engine's own DC load flow of the network without that branch, the multiplier of a security
constraint is what a MW of rating is worth, what no dispatch covers is reported and not a failure, and the study, the
picture and the report carry the result. The ratings of the larger networks are made here from their own flows: no data of
a third party beyond the test networks of the project."""
import unittest

import numpy as np

from pcl import netfile as F
from pcl import netview
from pcl import network as N
from pcl import opf as OPF
from pcl import scopf
from pcl import study as S


def after_outages(net, res, ratings=None, emergency=1.0):
    """{branch: (its highest loading after any screened outage, the outage)} at the dispatch of the result, from the DC load
    flow of the network with that branch taken out (pcl.netfile.apply): not from the distribution factors."""
    case = net.case()
    rate = {case.br_name[k]: case.rate[k] * net.S_base for k in range(case.nl) if np.isfinite(case.rate[k]) and case.rate[k] > 0}
    rate.update(ratings or {})
    gen = [{'op': 'gen', 'name': s['name'], 'P_MW': s['P'] / 1e6} for s in res['sources']]
    islands, worst = set(res['security']['islands']), {}
    for k in case.br_name:
        if k in islands:
            continue
        net2, _ = F.apply(net, gen + [{'op': 'outage', 'element': k}])
        for q in net2.dc_flow()['branches']:
            if q['name'] in rate and q['name'] != k:
                x = abs(q['P']) / (emergency * rate[q['name']])
                if x > worst.get(q['name'], (-1.0, None))[0]:
                    worst[q['name']] = (x, k)
    return worst


def own_ratings(net, factor, floor):
    """Ratings for a network that has none: a multiple of the flows of its DC optimal power flow, and not below a floor (VA)."""
    return {q['name']: max(factor * abs(q['Pa']), floor) for q in net.opf('dc')['branches']}


class Scopf(unittest.TestCase):
    def test_the_30_bus_case(self):
        net = N.case_data('case30')
        r = net.scopf()
        s = r['security']
        self.assertTrue(r['converged'])
        self.assertEqual(r['kind'], 'scopf')
        self.assertTrue(s['secure'])
        self.assertEqual((s['outages'], len(s['islands']), s['monitored'], s['rounds'], s['constraints']), (38, 3, 41, 1, 1))
        self.assertEqual(s['cost_base'], net.opf('dc')['cost'])                       # the first solve is the DC optimal power flow itself
        self.assertAlmostEqual(s['cost_security'], 0.1468, delta=5e-4)                # what the security costs, per hour
        self.assertAlmostEqual(r['cost'], s['cost_base'] + s['cost_security'], delta=1e-9)
        self.assertEqual([(q['branch'], q['outage']) for q in s['binding']], [('br35', 'br36')])
        self.assertEqual(s['insecure_before'], 1)
        self.assertEqual((s['worst_before']['outage'], s['worst_before']['branch']), ('br36', 'br35'))
        self.assertAlmostEqual(s['worst_before']['loading'], 1.2078, delta=1e-3)
        self.assertLessEqual(s['worst_after']['loading'], 1 + 1e-4)
        self.assertGreater(s['worst_after']['loading'], 1 - 1e-3)                     # the constraint is met with equality
        self.assertEqual(s['unsecured'], [])
        self.assertEqual(s['history'][0][:2], (0, 0))
        self.assertEqual(s['history'][-1][:2], (1, 1))

    def test_the_flows_after_an_outage_are_those_of_the_dc_load_flow(self):
        cases = [('case30', None, 1.0, True), ('case30', None, 0.8, False), ('ieee57', (2.0, 60e6), 1.0, True), ('ieee118', (1.2, 200e6), 1.0, True),
                 ('ieee118', (2.0, 60e6), 1.0, False)]
        for name, how, em, secure in cases:
            net = N.case_data(name)
            ratings = own_ratings(net, *how) if how else None
            r = scopf.solve(net, ratings=ratings, emergency=em, check=False)
            s = r['security']
            self.assertTrue(r['converged'], name)
            self.assertEqual(s['secure'], secure, (name, how, em))
            worst = after_outages(net, r, ratings, em)
            self.assertEqual(set(worst), set(s['post']), name)
            for b, (x, _) in worst.items():
                self.assertAlmostEqual(s['post'][b][0], x, delta=1e-7, msg=(name, b))    # the distribution factors against the load flow of the outage
            top = max(x for x, _ in worst.values())
            self.assertAlmostEqual(s['worst_after']['loading'], top, delta=1e-7, msg=name)
            if secure:
                self.assertLessEqual(top, 1 + 1e-4, name)
                self.assertGreater(s['cost_security'], 0, name)
                self.assertGreater(s['insecure_before'], 0, name)
            else:
                self.assertGreater(top, 1 + 1e-4, name)

    def test_the_multiplier_is_what_a_mw_of_rating_is_worth(self):
        net = N.case_data('case30')
        case = net.case()
        rate = case.rate[case.br_name.index('br35')] * net.S_base
        a = net.scopf(check=False, tol=1e-9)
        b = net.scopf(check=False, tol=1e-9, ratings={'br35': rate + 0.01e6})
        mu = a['security']['binding'][0]['mu']
        self.assertAlmostEqual((a['cost'] - b['cost']) / 0.01, mu, delta=0.005 * mu)     # per hour and MW: 0,0882

    def test_what_no_dispatch_covers_is_reported(self):
        net = N.case_data('case30')
        r = net.scopf(emergency=0.8, check=False)
        s = r['security']
        self.assertTrue(r['converged'])
        self.assertFalse(s['secure'])
        self.assertEqual(len(s['unsecured']), 6)
        self.assertIn('6 ζεύγη', r['message'])
        left = {(q['branch'], q['outage']) for q in s['unsecured']}
        self.assertFalse(left & {(q['branch'], q['outage']) for q in s['binding']})       # the price of a slack is not a price of security
        for q in s['unsecured']:
            self.assertGreater(q['overload'], 0)
            self.assertGreater(q['loading'], 1 + 1e-4)
            self.assertGreaterEqual(s['post'][q['branch']][0], q['loading'] - 1e-9)
        self.assertAlmostEqual(s['unsecured'][0]['overload'] / 1e6, 4.4, delta=1e-3)       # 16 MW of rating × 0,8 against 17,2 MW that must pass
        # the price of the slack is high enough: ten times higher leaves the same overloads
        r2 = net.scopf(emergency=0.8, check=False, penalty=10 * s['penalty'])
        for q, p in zip(s['unsecured'], r2['security']['unsecured']):
            self.assertAlmostEqual(q['overload'], p['overload'], delta=1e3)                # 0,001 MW
        self.assertAlmostEqual(r['cost'], r2['cost'], delta=1e-3)

    def test_a_network_that_is_secure_already(self):
        net = N.case_data('ieee9')
        r = net.scopf()
        s = r['security']
        self.assertEqual((s['rounds'], s['constraints'], s['insecure_before']), (0, 0, 0))
        self.assertEqual(s['cost_security'], 0.0)
        self.assertEqual(r['cost'], net.opf('dc')['cost'])
        self.assertTrue(s['secure'])
        self.assertEqual(len(s['islands']), 3)                                            # the three transformers of the generators
        self.assertTrue(any('χωρίζουν το δίκτυο' in n for n in r['notes']))

    def test_the_outages_asked_for(self):
        net = N.case_data('case30')
        r = net.scopf(outages=['br36'], check=False)
        self.assertEqual(r['security']['outages'], 1)
        self.assertAlmostEqual(r['security']['cost_security'], 0.1468, delta=5e-4)        # the one outage that matters
        r = net.scopf(outages=['br1'], check=False)
        self.assertEqual((r['security']['rounds'], r['security']['cost_security']), (0, 0.0))
        island = net.scopf(check=False)['security']['islands'][0]
        r = net.scopf(outages=[island, 'br36'], check=False)
        self.assertEqual((r['security']['outages'], r['security']['islands']), (1, [island]))
        with self.assertRaises(scopf.ScopfError):
            net.scopf(outages=[island])                                                   # nothing left to secure
        with self.assertRaises(scopf.ScopfError):
            net.scopf(outages=['no such branch'])

    def test_what_it_refuses(self):
        with self.assertRaises(scopf.ScopfError) as e:
            N.case_data('ieee14').scopf()                                                 # no branch has a rating
        self.assertIn('ονομαστική ισχύ', str(e.exception))
        with self.assertRaises(scopf.ScopfError):
            N.case_data('case30').scopf(emergency=0)

    def test_the_ac_load_flow_of_the_dispatch(self):
        r = N.case_data('case30').scopf()
        ac = r['security']['ac']
        self.assertTrue(ac['converged'])
        self.assertAlmostEqual(ac['losses'] / 1e6, 2.969, delta=5e-3)                     # the linear model has none
        self.assertEqual((ac['overloads'], ac['worst_branch']), (1, 'br10'))              # reactive power, which the linear model does not see
        self.assertAlmostEqual(ac['worst_loading'], 1.087, delta=2e-3)
        self.assertNotIn('ac', N.case_data('case30').scopf(check=False)['security'])

    def test_screen(self):
        net = N.case_data('case30')
        case = net.case()
        from pcl import powerflow as PF
        L = np.nan_to_num(PF.lodf(case), nan=0.0)
        Pf = np.array([q['Pa'] for q in net.opf('dc')['branches']]) / net.S_base
        mon, out = np.arange(case.nl), np.array([35, 9])
        w, b, load, post = scopf.screen(case, Pf, case.rate, L, mon, out)
        self.assertEqual(load.shape, (case.nl, 2))
        self.assertEqual(post[35, 0], 0.0)                                                # the branch that is out carries nothing
        self.assertEqual(post[9, 1], 0.0)
        self.assertAlmostEqual(post[34, 0], Pf[34] + L[34, 35] * Pf[35], delta=1e-15)
        self.assertEqual(case.br_name[b[0]], 'br35')
        self.assertAlmostEqual(w[0], 1.2078, delta=1e-3)


class Extra(unittest.TestCase):
    """pcl.opf.solve(…, extra=…): further linear constraints and unknowns of the DC problem."""
    def test_without_extra_nothing_changes(self):
        net = N.case_data('case30')
        a, b = OPF.solve(net, 'dc'), OPF.solve(net, 'dc', extra=None)
        self.assertEqual(a['cost'], b['cost'])
        self.assertEqual([s['P'] for s in a['sources']], [s['P'] for s in b['sources']])
        self.assertNotIn('mu_extra', a)

    def test_a_constraint_that_does_not_bind_and_one_that_does(self):
        from scipy import sparse as sp
        net = N.case_data('case30')
        base = OPF.solve(net, 'dc')
        case = net.case()
        ng = len(base['sources'])
        P0 = base['sources'][0]['P'] / net.S_base
        row = sp.csr_matrix(([1.0], ([0], [case.n])), shape=(1, case.n + ng))              # the output of the first source
        loose = OPF.solve(net, 'dc', extra={'A': row, 'l': np.array([-np.inf]), 'u': np.array([P0 + 1.0])})
        self.assertAlmostEqual(loose['cost'], base['cost'], delta=1e-5)
        self.assertAlmostEqual(loose['mu_extra'][0], 0.0, delta=1e-4)
        tight = OPF.solve(net, 'dc', extra={'A': row, 'l': np.array([-np.inf]), 'u': np.array([P0 - 0.05])})      # 5 MW less from it
        self.assertAlmostEqual(tight['sources'][0]['P'] / net.S_base, P0 - 0.05, delta=1e-5)        # inside the tolerance of the interior point
        self.assertGreater(tight['cost'], base['cost'])
        self.assertGreater(tight['mu_extra'][0], 0)

    def test_what_it_refuses(self):
        net = N.case_data('case30')
        with self.assertRaises(OPF.OpfError):
            OPF.solve(net, 'ac', extra={'A': None})
        from scipy import sparse as sp
        with self.assertRaises(OPF.OpfError):
            OPF.solve(net, 'dc', extra={'A': sp.csr_matrix((1, 3)), 'l': np.array([0.0]), 'u': np.array([1.0])})


class StudyAndPicture(unittest.TestCase):
    def test_the_study(self):
        r = S.run({'case': 'case30', 'study': 'scopf', 'view': True})
        q = r['summary']
        self.assertTrue(q['converged'])
        z = q['security']
        self.assertTrue(z['secure'])
        self.assertEqual((z['outages'], z['islands'], z['rounds'], z['constraints'], z['n_binding'], z['n_unsecured']), (38, 3, 1, 1, 1, 0))
        self.assertAlmostEqual(z['cost_security'], 0.1468, delta=5e-4)
        self.assertEqual(z['binding'][0]['branch'], 'br35')
        self.assertEqual(r['layer'], 'security')                                          # the picture opens on the layer of the security
        self.assertIn('security', [x['layer'] for x in r['layers']])
        lay = next(x for x in r['layers'] if x['layer'] == 'security')
        names = [e['name'] for e in r['view']['branches']]
        self.assertAlmostEqual(lay['branch_v'][names.index('br35')], 100.0, delta=0.02)   # at its limit after the loss of br36
        self.assertEqual(S.run({'case': 'case30', 'study': 'scopf', 'options': {'emergency': 0.8}})['summary']['security']['n_unsecured'], 6)
        with self.assertRaises(S.StudyError):
            S.run({'case': 'ieee14', 'study': 'scopf'})

    def test_the_study_on_a_changed_network(self):
        # a higher rating on the branch that binds: the security costs nothing any more
        r = S.run({'case': 'case30', 'study': 'scopf', 'edits': [{'op': 'rating', 'branch': 'br35', 'S_MVA': 30}]})
        z = r['summary']['security']
        self.assertTrue(z['secure'])
        self.assertNotIn('br35', [b['branch'] for b in z['binding']])
        self.assertLess(z['cost_security'], 0.1468)

    def test_the_layer(self):
        net = N.case_data('case30')
        v = netview.view(net)
        res = net.scopf(emergency=0.8, check=False)
        q = netview.values(v, res, 'security')
        self.assertEqual(q['note'], '')
        self.assertEqual(q['unit_branch'], '%')
        self.assertEqual(q['count'], {'binding': len({b['branch'] for b in res['security']['binding']}), 'unsecured': len({b['branch'] for b in res['security']['unsecured']})})
        for b in {b['branch'] for b in res['security']['unsecured']}:
            self.assertEqual(q['branch_color'][b], netview.BAD)
            self.assertGreater(q['branch'][b], 100.0)
        self.assertNotEqual(netview.values(v, net.opf('dc'), 'security')['note'], '')      # a result without security: the layer says so
        svg = netview.svg(v, res, 'security')
        self.assertIn('<svg', svg[:200])
        self.assertIn(netview.BAD, svg)                                                    # the branches that stay over their limit, in the picture too

    def test_the_report(self):
        net = N.case_data('case30')
        html = net.report('scopf').html()
        for text in ('Βέλτιστη ροή φορτίου με ασφάλεια N−1 (DC)', 'Ασφάλεια N−1', 'Περιορισμοί ασφάλειας που δεσμεύουν', 'br35', 'Έλεγχος με ροή φορτίου AC'):
            self.assertIn(text, html)
        rep = S.report({'case': 'case30', 'study': 'scopf', 'options': {'emergency': 0.8}})
        self.assertIn('Τι δεν καλύπτεται', rep['html'] if isinstance(rep, dict) and 'html' in rep else str(rep))


if __name__ == '__main__':
    unittest.main()
