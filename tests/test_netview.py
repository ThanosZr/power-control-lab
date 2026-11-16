"""The picture of the network of a study (4.19.4, ROADMAP §72, pcl/netview.py): the layout is ours, deterministic and without
coordinates in the data; the layers show what a study found; the same data draw the SVG of the report and a DXF drawing.
The viewer of the page (web/studio/netview.js) headless, on the data the engine gives it (tests/js/netview_cases.js)."""
import json
import os
import pathlib
import subprocess
import tempfile
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


ROOT = pathlib.Path(__file__).resolve().parents[1]


class Viewer(unittest.TestCase):
    """netview.js in Node: the model, the fit, the picking, the detail by zoom, a frame on a canvas that records its calls, and
    the interactive viewer on an element that keeps its listeners."""

    @classmethod
    def setUpClass(cls):
        cls.data = {'small': S.run({'case': 'ieee14', 'study': 'pf', 'view': 'only'}), 'big': S.run({'case': 'ieee300', 'study': 'n1dc', 'view': 'only'}),
                    'opf': S.run({'case': 'case30', 'study': 'opf', 'view': 'only'}), 'radial': S.run({'case': 'case33bw', 'study': 'pf', 'view': 'only'}),
                    'out': S.run({'case': 'case30', 'study': 'pf', 'view': 'only', 'edits': [{'op': 'outage', 'element': 'br10'}, {'op': 'outage', 'element': 'br5'}]})}
        fd, name = tempfile.mkstemp(suffix='.json')
        with os.fdopen(fd, 'w', encoding='utf-8') as f:
            json.dump(cls.data, f)
        try:
            out = subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'netview_cases.js'), name], capture_output=True, text=True, timeout=300, cwd=ROOT)
        finally:
            os.unlink(name)
        if out.returncode:
            raise RuntimeError(out.stderr[-2000:])
        cls.r = json.loads(out.stdout)

    def test_the_model_is_the_data_of_the_engine(self):
        self.assertTrue(self.r['pure'])                                                           # the viewer only reads
        for k, d in self.data.items():
            m = self.r[k]['model']
            self.assertEqual((m['nb'], m['ne'], m['ends']), (len(d['view']['buses']), len(d['view']['branches']), len(d['view']['branches'])), k)
            self.assertEqual(m['layers'], [q['layer'] for q in d['layers']], k)
            self.assertEqual(m['inCells'], m['nb'], k)                                            # every bus in one cell of the grid
        big = self.r['big']['model']
        self.assertEqual(big['parallel'], 4)                                                      # two pairs of parallel branches in the 300-bus network
        self.assertAlmostEqual(big['apart'], 0.12, places=9)                                      # drawn side by side, 0.12 of a unit apart

    def test_the_fit_shows_everything(self):
        for k in self.data:
            f = self.r[k]['fit']
            x0, y0, x1, y1 = f['box']
            self.assertGreaterEqual(min(x0, y0), 24 - 1e-9, k)
            self.assertLessEqual(x1, f['w'] - 24 + 1e-9, k)
            self.assertLessEqual(y1, f['h'] - 24 + 1e-9, k)
            self.assertTrue(abs(x0 - 24) < 1e-6 or abs(y0 - 24) < 1e-6, k)                         # one of the two directions is filled
            self.assertAlmostEqual((x0 + x1) / 2, f['w'] / 2, places=6, msg=k)
            self.assertAlmostEqual((y0 + y1) / 2, f['h'] / 2, places=6, msg=k)

    def test_a_point_picks_what_is_under_it(self):
        for k, d in self.data.items():
            p, nb, ne = self.r[k]['pick'], len(d['view']['buses']), len(d['view']['branches'])
            self.assertEqual(p['busOk'], nb, k)                                                   # every bus at its own place
            self.assertEqual(p['brOk'] + p['brBus'], ne, k)                                       # the middle of a branch: the branch, or a bus that is nearer
            self.assertIsNone(p['far'], k)
            self.assertEqual(p['farOut'], 'bus', k)                                               # far out the grid is not used: the plain pass finds the same
        self.assertEqual(self.r['small']['pick']['brOk'], 20)
        self.assertGreater(self.r['big']['pick']['brOk'], 250)

    def test_the_zoom_decides_the_detail(self):
        want = [[5, True, False, False, False, False], [20, False, True, False, False, False], [30, False, True, True, False, False],
                [60, False, True, True, True, False], [120, False, True, True, True, True]]            # pixels per unit: dots, rings, transformers, names, values
        for k in self.data:
            self.assertEqual(self.r[k]['detail'], want, k)

    def test_a_frame_draws_what_is_in_the_window(self):
        for k, d in self.data.items():
            r, nb, ne = self.r[k], len(d['view']['buses']), len(d['view']['branches'])
            self.assertEqual((r['all']['out']['buses'], r['all']['out']['branches']), (nb, ne), k)
            self.assertEqual(r['all']['bg'], 1, k)
            self.assertEqual(r['away']['out'], {'buses': 0, 'branches': 0, 'names': 0, 'values': 0}, k)
            self.assertEqual((r['away']['segs'], r['away']['arcs'], r['away']['texts']), (0, 0, 0), k)   # outside the window nothing is drawn
            self.assertLess(r['close']['out']['buses'], nb, k)
            self.assertEqual(r['close']['out']['names'], r['close']['out']['buses'], k)           # close enough: a name at every bus in the window
            self.assertEqual(r['closeOn']['texts'], 0, k)                                         # names off
            self.assertEqual(r['allNames']['out']['names'], nb, k)                                # names on, with the buses of the window few enough
            self.assertEqual(r['unknown'], r['base'], k)                                          # a layer the study did not feed: the plain picture
            self.assertEqual(r['hit'], 1, k)                                                      # the ring around the bus under the pointer
            self.assertTrue(set(r['all']['stroke']) | set(r['all']['fill']) <= set(r['layer']['palette']) | {'#ffffff', '#5f6b6d', '#7a7a7a'}, k)
            self.assertLess(max(r['layer']['busC'], r['layer']['branchC']), len(r['layer']['palette']), k)
        s = self.r['small']
        self.assertEqual((s['all']['arcs'], s['all']['segs']), (14 + 3, 20 + 3 * 11))             # 14 buses and 3 transformers; 20 branches and an arrow at each of the 11 loads
        self.assertEqual(s['all']['someTexts'][:2], ['1', '1,06 pu'])                             # the name and the voltage of the slack bus
        self.assertEqual((self.r['big']['all']['segs'], self.r['big']['all']['arcs']), (411, 300 + 128))   # 300 buses as rings, 128 transformers, no arrows yet
        self.assertEqual(self.r['big']['all']['texts'], 0)                                        # 300 buses in 900 pixels: no names until asked or zoomed
        self.assertEqual(self.r['opf']['all']['someTexts'][1], '3,66 ανά MWh')
        self.assertEqual(s['num'], ['1235 MW', '12,3', '1,23 pu', '0,012', '', ''])
        self.assertEqual(s['text'], {'bus': 'Ζυγός 1 · 1,00 kV · ζυγός ταλάντωσης · 1,06 pu', 'branch': 'Κλάδος br1: 1 – 2', 'none': ''})
        self.assertTrue(self.r['big']['text']['branch'].startswith('Μετασχηματιστής br1: 37 – 9001'))

    def test_a_branch_out_of_service_stays_in_the_picture(self):
        r = self.r['out']
        self.assertEqual(r['all']['out'], {'buses': 30, 'branches': 41, 'names': 30, 'values': 30, 'off': 2})
        self.assertEqual((r['all']['dashes'], r['all']['dashLeft']), (1, 0))                       # one dashed pass, and the dash is put back
        self.assertEqual(r['off']['text'], 'Κλάδος br5: 2 – 5 · εκτός λειτουργίας')
        self.assertTrue(r['off']['pick'])                                                         # it can be picked, to put it back
        self.assertEqual(r['all']['segs'], 41 + 3 * 20)                                           # every branch once, and the arrows of the 20 loads
        for k in ('small', 'big', 'opf', 'radial'):
            self.assertEqual((self.r[k]['all']['dashes'], self.r[k]['off']), (0, None), k)

    def test_the_interactive_viewer(self):
        for k, d in self.data.items():
            v = self.r[k]['viewer']
            self.assertEqual(v['listeners'], ['dblclick', 'pointercancel', 'pointerdown', 'pointermove', 'pointerup', 'wheel'], k)
            self.assertEqual((v['layer0'], v['frames0'], v['size']), (d['layer'], 1, [800, 500]), k)      # opens on the layer of the study, one frame
            self.assertEqual(v['layers'], [q['layer'] for q in d['layers']], k)
            self.assertTrue(v['hover'].startswith('Ζυγός ' + d['view']['buses'][1]['id']), k)
            self.assertEqual((v['cursor'], v['leave'], v['cursor2']), ('pointer', '', 'grab'), k)
            self.assertAlmostEqual(v['drag'][0], 60, places=9, msg=k)                             # the network follows the pointer
            self.assertAlmostEqual(v['drag'][1], 30, places=9, msg=k)
            self.assertEqual(v['drag'][2:], [True, 0], k)                                         # a drag is not a click
            self.assertEqual(v['click'], ['bus'], k)
            self.assertAlmostEqual(v['wheel'][0], 1.8221188003905089, places=12, msg=k)           # exp(0.6)
            self.assertLess(abs(v['wheel'][1]) + abs(v['wheel'][2]), 1e-9, k)                     # the point under the pointer stays there
            self.assertEqual(v['wheel'][3], 1, k)                                                 # and the page does not scroll
            self.assertAlmostEqual(v['limits'][0], 400, places=9, msg=k)                          # at most 400 pixels per unit
            self.assertAlmostEqual(v['limits'][1], 0.5, places=9, msg=k)                          # at least half of the fit
            self.assertEqual(v['goto'][:4], [True, 0, True, False], k)
            self.assertTrue(v['goto'][4].startswith('Ζυγός ' + d['view']['buses'][-1]['id']), k)
            self.assertEqual(v['setLayer'], ['base', 'base', 'Επίπεδα τάσης'], k)                 # a layer that does not exist changes nothing
            self.assertEqual(v['names'], ['on', 'auto'], k)
            self.assertTrue(v['dbl'], k)                                                          # double click: everything again
            self.assertEqual(v['dead'], [0, True], k)                                             # destroyed: no listeners, no frames
            self.assertEqual(v['again'], [2.5, 10, 20, 'base', False], k)                         # opened again where the last one was looking
            self.assertEqual(v['resize'], [True, True, False], k)                                 # a new size: everything again, unless the user has zoomed


if __name__ == '__main__':
    unittest.main()
