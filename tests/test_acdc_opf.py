"""4.21 (ROADMAP §87): the optimal power flow AC/DC (pcl.dcgrid.acdc_opf, the nonlinear bus-injection form of Ergun et al. 2019) and
N−1 AC/DC (pcl.dcgrid.acdc_contingency). The case case5_acdc of the reference implementation of the paper (pcl/data, BSD 3-Clause:
the licence is in the file) against Table IV («BIM NLP»: 194.139 $/h); the optimum as an AC/DC load flow with its own set-points;
every outage of N−1 AC/DC against the AC/DC load flow of the network without that element; the modes of the study acdc."""
import json
import unittest

from pcl import dcgrid as D
from pcl import network as N
from pcl import report as R
from pcl import study as S


class Opf(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.net = N.case_data('case5_acdc')
        cls.r = cls.net.acdc_opf(tol=1e-8)

    def test_table_iv(self):
        # measured 194.13881 in 20 iterations; the paper prints 194.139
        r = self.r
        self.assertTrue(r['converged'])
        self.assertAlmostEqual(r['cost'], 194.139, delta=6e-4)
        self.assertLessEqual(r['iterations'], 30)
        c = r['converters']
        self.assertAlmostEqual(sum(q['Pdc'] for q in c.values()), r['losses_dc'], delta=1e-3)               # the DC grid balances
        for q in c.values():
            self.assertAlmostEqual(q['Pdc'], -q['Pc'] - q['loss'], delta=1e-6)                              # each converter
            self.assertLessEqual(q['Uc'], 1.1 + 1e-6)
            self.assertGreaterEqual(q['Uc'], 0.9 - 1e-6)
        for d in r['dc']['buses'].values():
            self.assertLessEqual(d['V'], 1.1 + 1e-6)
        self.assertEqual(len(r['buses']), 5)                                                                 # the internal buses apart
        self.assertEqual(len(r['internal']), 6)

    def test_the_optimum_is_an_ac_dc_load_flow(self):
        # the stations at the set-points of the optimum (P on the AC side, Q, the slack's DC voltage) and the generators at their
        # dispatch: the sequential AC/DC load flow gives the same state
        r = self.r
        net = N.from_dict(N.to_dict(self.net))
        slack = max(r['converters'], key=lambda n: r['converters'][n]['Udc'])
        for n, c in r['converters'].items():
            e = net.element(n)
            if n == slack:
                e.update(control='V', V=c['Udc'] / 690e3, Q=c['Qs'])
            else:
                e.update(control='P', side='ac', P=c['Ps'], Q=c['Qs'])
        for q in r['sources']:
            e = net.element(q['name'])
            e['P'] = q['P']
            if not e.get('slack'):
                e['V'] = r['buses'][q['bus']]['V']
        net.buses['1']['V'] = r['buses']['1']['V']
        net.element('G1')['V'] = r['buses']['1']['V']
        f = net.acdc_flow(tol=1e-11, flat=True)
        self.assertTrue(f['converged'])
        for b, d in r['buses'].items():
            self.assertAlmostEqual(f['buses'][b]['V'], d['V'], delta=2e-6, msg=b)
        for b, d in r['dc']['buses'].items():
            self.assertAlmostEqual(f['dc']['buses'][b]['V'], d['V'], delta=2e-6, msg=b)

    def test_the_station_is_not_a_fixed_injection(self):
        # the plain AC OPF sees the stations as fixed injections (their load-flow set-points); the AC/DC OPF chooses them, and
        # costs less
        self.assertLess(self.r['cost'], self.net.opf('ac')['cost'])

    def test_study_and_report(self):
        out = S.run({'case': 'case5_acdc', 'study': 'acdc', 'options': {'mode': 'opf'}, 'view': True})
        self.assertEqual(out['summary']['mode'], 'opf')
        self.assertAlmostEqual(out['summary']['cost'], self.r['cost'], delta=1e-4)
        self.assertEqual(out['layer'], 'lmp')
        self.assertEqual(S.run({'case': 'case5_acdc', 'study': 'acdc', 'options': {}, 'view': 'only', 'layer': 'flow'})['layer'], 'flow')
        with self.assertRaises(S.StudyError):
            S.run({'case': 'case5_acdc', 'study': 'acdc', 'options': {'mode': 'x'}})
        rep = R.network_report(self.net, 'acdc', mode='opf')
        self.assertIn('Βέλτιστη ροή φορτίου AC/DC', json.dumps(rep.to_dict(), ensure_ascii=False))

    def test_refusals(self):
        with self.assertRaises(N.NetworkError):
            N.case_data('b4').acdc_opf()                           # its DC/DC converters are not in the OPF yet


class Contingency(unittest.TestCase):
    def test_every_outage_is_the_load_flow_without_it(self):
        for case in ('case5_acdc', 'mtdc5'):
            net = N.case_data(case)
            res = net.acdc_contingency()
            kinds = {e['name']: e['kind'] for e in net.elements}
            self.assertEqual([q['name'] for q in res['outages']], [e['name'] for e in net.elements if e['kind'] in ('line', 'branch', 'transformer', 'dc_line', 'vsc', 'dcdc')])
            for q in res['outages']:
                self.assertEqual(q['kind'], kinds[q['name']])
                n = N.from_dict(N.to_dict(net))
                n.remove(q['name'])
                try:
                    f = n.acdc_flow(limits=True)
                except N.NetworkError:
                    self.assertFalse(q['converged'], (case, q['name']))
                    continue
                self.assertEqual(bool(f['converged']), q['converged'], (case, q['name']))
                self.assertAlmostEqual(min(d['V'] for d in f['buses'].values()), q['Vmin'], delta=1e-9)
        # case5_acdc: the loss of the DC slack C2 leaves its DC grid without a voltage (a failure with its reason); the worst is a branch
        res = N.case_data('case5_acdc').acdc_contingency()
        self.assertEqual(res['failed'], ['C2'])
        self.assertIn('holds the voltage', [q for q in res['outages'] if q['name'] == 'C2'][0]['message'])
        sm = S.run({'case': 'case5_acdc', 'study': 'acdc', 'options': {'mode': 'n1'}})['summary']
        self.assertEqual((sm['mode'], sm['outages'], sm['failed']), ('n1', 13, ['C2']))


if __name__ == '__main__':
    unittest.main()
