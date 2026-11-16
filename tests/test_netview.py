"""The picture of the network of a study (4.19.4, ROADMAP §72, pcl/netview.py): the layout is ours, deterministic and without
coordinates in the data; the layers show what a study found; the same data draw the SVG of the report and a DXF drawing."""
import json
import unittest
import xml.etree.ElementTree as ET

import numpy as np

from pcl import netview as NV
from pcl import network as N
from pcl import study as S


class Layout(unittest.TestCase):
    def test_every_network_gets_places(self):
        for c in N.CASES:
            if c == 'pegase1354':
                continue
            net = N.case_data(c)
            v = NV.view(net)
            P = np.array([[b['x'], b['y']] for b in v['buses']])
            self.assertEqual(len(P), len(net.buses), c)
            self.assertTrue(np.isfinite(P).all(), c)
            pos = {b['id']: (b['x'], b['y']) for b in v['buses']}
            L = np.array([np.hypot(pos[e['a']][0] - pos[e['b']][0], pos[e['a']][1] - pos[e['b']][1]) for e in v['branches']])
            self.assertAlmostEqual(float(np.median(L)), NV.UNIT, delta=0.05 * NV.UNIT, msg=c)       # a typical branch is one unit long
            d = np.sqrt(((P[:, None, :] - P[None, :, :]) ** 2).sum(axis=2)) + 1e9 * np.eye(len(P))
            self.assertGreater(d.min(), 0.2 * NV.UNIT, c)                                          # no two buses on top of each other
            self.assertEqual(json.dumps(v), json.dumps(NV.view(N.case_data(c))), c)               # the same network, the same picture

    def test_a_radial_feeder_is_a_tree_from_its_slack_bus(self):
        net = N.case_data('case33bw')
        v = NV.view(net)
        pos = {b['id']: (b['x'], b['y']) for b in v['buses']}
        slack = [b['id'] for b in v['buses'] if b['type'] == 'slack'][0]
        self.assertEqual(pos[slack][0], min(x for x, _ in pos.values()))
        # every branch goes one level to the right
        self.assertTrue(all(abs(abs(pos[e['a']][0] - pos[e['b']][0]) - NV.UNIT) < 1e-6 for e in v['branches']))

    def test_what_the_view_holds(self):
        v = NV.view(N.case_data('ieee14'))
        self.assertEqual((len(v['buses']), len(v['branches'])), (14, 20))
        self.assertEqual(sum(e['trafo'] for e in v['branches']), 3)
        self.assertEqual(sum(b['type'] == 'slack' for b in v['buses']), 1)
        self.assertEqual(set(v['buses'][0]), {'id', 'x', 'y', 'Un', 'type', 'gen', 'load', 'shunt'})
        v300 = NV.view(N.case_data('ieee300'))
        self.assertTrue(any(e['of'] > 1 for e in v300['branches']))                                # parallel branches are told apart


class Layers(unittest.TestCase):
    def test_a_load_flow_feeds_voltages_and_flows(self):
        net = N.case_data('ieee14')
        r, v = S.run({'case': 'ieee14', 'study': 'pf'})['result'], NV.view(net)
        L = NV.values(v, r, 'voltage')
        self.assertEqual(len(L['bus']), 14)
        self.assertAlmostEqual(L['bus']['1'], r['buses']['1']['V'])
        self.assertEqual(L['unit_bus'], 'pu')
        self.assertTrue(all(c.startswith('#') and len(c) == 7 for c in L['bus_color'].values()))
        F = NV.values(v, r, 'flow')
        self.assertEqual(len(F['branch']), 20)
        self.assertAlmostEqual(F['branch']['br1'], r['branches'][0]['Pa'] / 1e6)
        for layer, word in (('lmp', 'βέλτιστη ροή'), ('n1', 'N−1'), ('loading', 'ονομαστική')):
            self.assertIn(word, NV.values(v, r, layer)['note'])                                    # what a result cannot feed says so
        with self.assertRaises(NV.ViewError):
            NV.values(v, r, 'colours')

    def test_the_outages_by_what_they_add(self):
        r = S.run({'case': 'ieee118', 'study': 'n1'})
        L = NV.values(NV.view(N.case_data('ieee118')), r['result'], 'n1')
        self.assertEqual(L['count']['island'], r['summary']['islands'])
        self.assertEqual(sum(L['count'].values()), r['summary']['outages'])
        self.assertEqual(L['count']['overload'], 0)
        # a network with a branch over its rating before any outage: only what an outage adds is counted
        r30 = S.run({'case': 'case30', 'study': 'n1'})['result']
        self.assertEqual(len(r30['base']['overloads']), 1)
        L30 = NV.values(NV.view(N.case_data('case30')), r30, 'n1')
        self.assertLess(L30['count']['overload'], sum(bool(o.get('overloads')) for o in r30['outages']))
        self.assertIn('πριν από κάθε διαταραχή', L30['note_base'])

    def test_the_study_carries_the_picture(self):
        r = S.run({'case': 'case30', 'study': 'opf', 'view': True})
        self.assertEqual(r['layer'], 'lmp')
        self.assertEqual([q['layer'] for q in r['layers']], ['base', 'voltage', 'angle', 'loading', 'flow', 'violations', 'lmp'])
        q = r['layers'][-1]
        self.assertEqual((len(q['bus_c']), len(q['branch_c']), len(q['bus_v'])), (30, 41, 30))
        self.assertTrue(all(0 <= i < len(q['palette']) for i in q['bus_c'] + q['branch_c']))
        self.assertIn('result', r)
        only = S.run({'case': 'ieee14', 'study': 'n1', 'view': 'only'})
        self.assertNotIn('result', only)
        self.assertEqual((only['layer'], [q['layer'] for q in only['layers']]), ('n1', ['base', 'n1']))
        self.assertNotIn('view', S.run({'case': 'ieee14', 'study': 'pf'}))                         # without the option, as before


class Files(unittest.TestCase):
    def test_svg(self):
        r, v = S.run({'case': 'case30', 'study': 'opf'})['result'], NV.view(N.case_data('case30'))
        s = NV.svg(v, r, 'loading')
        self.assertNotIn('http', s)                                                               # inside a page: no namespace address
        root = ET.fromstring(s)
        self.assertEqual(sum(1 for e in root.iter() if e.tag == 'line'), 41)
        self.assertIn('πάνω από 100 %', s)                                                        # the legend is in the picture
        f = S.view({'case': 'case30', 'study': 'opf', 'format': 'svg', 'layer': 'loading'})
        self.assertEqual((f['name'], f['mime']), ('network_case30_opf_loading.svg', 'image/svg+xml'))
        self.assertEqual(ET.fromstring(f['text'].encode('utf-8')).tag, '{http://www.w3.org/2000/svg}svg')

    def test_dxf(self):
        f = S.view({'case': 'ieee118', 'study': 'pf', 'format': 'dxf'})
        self.assertEqual(f['name'], 'network_ieee118_pf.dxf')
        d = f['text'].split('\n')
        self.assertEqual(len(d) % 2, 1)                                                           # pairs of code and value, and the last line break
        self.assertEqual(d[-3:-1], ['0', 'EOF'])
        self.assertTrue(all(ord(ch) < 128 for ch in f['text']))
        pairs = list(zip(d[0:-1:2], d[1:-1:2]))
        ent = [b for a, b in pairs if a == '0']
        self.assertEqual((ent.count('LINE'), ent.count('SECTION')), (186 + 99, 3))                # 186 branches and a tick for each of the 99 load buses
        layers = [b for (a, b), (c, _) in zip(pairs, pairs[1:] + [('', '')]) if a == '2' and c == '70' and b.isupper() and b not in ('LTYPE', 'LAYER')]
        self.assertEqual(set(layers) - {'CONTINUOUS'}, {'BUSES', 'BUS_NAMES', 'BRANCHES', 'TRANSFORMERS', 'GENERATORS', 'LOADS', 'V_PU', 'ANGLE_DEG', 'FLOW_MW'})
        try:
            import ezdxf
        except ImportError:
            self.skipTest('ezdxf is not installed: the drawing is read here only by the checks above')
        import io
        doc = ezdxf.read(io.StringIO(f['text']))
        self.assertEqual(len(doc.audit().errors), 0)
        self.assertEqual(len(doc.modelspace().query('LINE')), 186 + 99)

    def test_what_is_refused(self):
        with self.assertRaises(S.StudyError):
            S.view({'case': 'ieee14', 'study': 'pf', 'format': 'dwg'})
        with self.assertRaises(S.StudyError):
            S.view({'case': 'ieee7', 'study': 'pf'})


if __name__ == '__main__':
    unittest.main()
