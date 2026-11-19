"""The picture of the network of a study (4.19.4, ROADMAP §73, pcl/netview.py): the layout is ours, deterministic and without
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


class DCGrids(unittest.TestCase):
    """4.20.1: a network with DC grids has them in its picture: the DC buses in the same layout as the AC buses (joined by their
    lines and by every station to its AC bus), apart in the view and in the layers; a network without them is drawn as before."""

    @classmethod
    def setUpClass(cls):
        cls.nets = {c: N.case_data(c) for c in ('mtdc5', 'b4')}
        cls.runs = {c: S.run({'case': c, 'study': 'acdc', 'view': True}) for c in cls.nets}

    def test_the_dc_grid_is_in_the_picture(self):
        for c, net in self.nets.items():
            v = NV.view(net)
            dc = v['dc']
            el = lambda k: [e for e in net.elements if e['kind'] == k]     # noqa: E731
            self.assertEqual([b['id'] for b in dc['buses']], list(net.dc_buses), c)
            self.assertEqual([e['name'] for e in dc['lines']], [e['name'] for e in el('dc_line') + el('dcdc')], c)        # 4.21: a DC/DC as a DC link
            self.assertEqual([e['name'] for e in dc['lines'] if e.get('kind') == 'dcdc'], [e['name'] for e in el('dcdc')], c)
            self.assertEqual([(q['name'], q['ac'], q['dc']) for q in dc['stations']], [(e['name'], e['bus'], e['dc']) for e in el('vsc')], c)
            pos = {**{b['id']: (b['x'], b['y']) for b in v['buses']}, **{b['id']: (b['x'], b['y']) for b in dc['buses']}}
            P = np.array(list(pos.values()))
            self.assertTrue(np.isfinite(P).all(), c)
            d = np.sqrt(((P[:, None, :] - P[None, :, :]) ** 2).sum(axis=2)) + 1e9 * np.eye(len(P))
            self.assertGreater(d.min(), 0.2 * NV.UNIT, c)                                          # no two buses, AC or DC, on top of each other
            edges = [(e['a'], e['b']) for e in v['branches'] + dc['lines']] + [(q['ac'], q['dc']) for q in dc['stations']]
            L = [np.hypot(pos[a][0] - pos[b][0], pos[a][1] - pos[b][1]) for a, b in edges]
            self.assertAlmostEqual(float(np.median(L)), NV.UNIT, delta=0.05 * NV.UNIT, msg=c)       # a DC line and a station link are one unit long as a branch
            x0, y0, x1, y1 = v['bounds']
            self.assertEqual((x0, y0, x1, y1), (P[:, 0].min(), P[:, 1].min(), P[:, 0].max(), P[:, 1].max()), c)
            self.assertEqual(json.dumps(v), json.dumps(NV.view(N.case_data(c))), c)
        par = [e for e in NV.view(self.nets['b4'])['dc']['lines'] if e['of'] > 1]
        self.assertEqual(sorted(e['name'] for e in par), ['Bb-A1–Bb-B1#1', 'Bb-A1–Bb-B1#2', 'Bb-B4–Bb-B2#1', 'Bb-B4–Bb-B2#2'])

    def test_a_network_without_dc_parts_is_drawn_as_before(self):
        # the places of the AC graph alone, and nothing of DC in the view or in its layers (all the files of the picture
        # were compared bit for bit with the ones of before 4.20.1, for every network and study)
        for c in N.CASES:
            if c == 'pegase1354':
                continue
            net = N.case_data(c)
            case, names, f, t = NV._graph(net)
            self.assertIsNone(NV._with_dc(case, names, f, t, net), c)
            self.assertEqual(NV.layout(net), NV._layout(case, names, f, t), c)
            v = NV.view(net)
            self.assertNotIn('dc', v, c)
            self.assertFalse(any('dc' in L for L in NV.pack(v, S.run({'case': c, 'study': 'pf'})['result'])), c)

    def test_the_layers_of_an_ac_dc_load_flow(self):
        for c, q in self.runs.items():
            res, v = q['result'], q['view']
            dc = v['dc']
            self.assertEqual(q['layer'], 'voltage', c)
            self.assertIn('flow', [L['layer'] for L in q['layers']], c)                           # the DC lines feed the flows (b4 has no AC branches)
            L = NV.values(v, res, 'voltage')
            self.assertEqual(L['dc_bus'], {b: x['V'] for b, x in res['dc']['buses'].items()}, c)
            self.assertEqual(L['unit_dc_bus'], 'pu', c)
            F = NV.values(v, res, 'flow')
            self.assertEqual(F['dc_line'], {**{e['name']: e['Pa'] / 1e6 for e in res['dc']['lines']}, **{n: d['P'] / 1e6 for n, d in (res['dc'].get('dcdc') or {}).items()}}, c)
            self.assertEqual(F['dc_station'], {n: x['Pdc'] / 1e6 for n, x in res['converters'].items()}, c)
            B = NV.values(v, res, 'base')
            self.assertTrue(all(L['dc_line_color'][e['name']] == NV.GREY for e in dc['lines']), c)  # the voltages leave the DC lines grey
            for layer in ('voltage', 'flow', 'base', 'violations'):
                pk = [x for x in q['layers'] if x['layer'] == layer][0]
                self.assertEqual((len(pk['dc']['bus_c']), len(pk['dc']['line_c']), len(pk['dc']['station_c'])), (len(dc['buses']), len(dc['lines']), len(dc['stations'])), c)
                self.assertLess(max(pk['dc']['bus_c'] + pk['dc']['line_c'] + pk['dc']['station_c']), len(pk['palette']), c)
            pk = [x for x in q['layers'] if x['layer'] == 'flow'][0]
            self.assertEqual(pk['dc']['line_v'], [float(f"{e['Pa'] / 1e6:.6g}") for e in res['dc']['lines']]
                             + [float(f"{d['P'] / 1e6:.6g}") for d in (res['dc'].get('dcdc') or {}).values()], c)
            self.assertIsNone(pk['dc']['bus_v'], c)
        B = NV.values(self.runs['b4']['view'], self.runs['b4']['result'], 'base')
        self.assertEqual([t for _, t in B['legend']], ['400 kV', '±400 kV DC', '±200 kV DC', 'σταθμός μετατροπέα', 'μετατροπέας DC/DC'])
        self.assertEqual(len(set(B['dc_line_color'].values())), 2)                                # two DC voltages, two colours

    def test_svg_and_dxf_draw_the_dc_grid(self):
        q = self.runs['b4']
        v, res = q['view'], q['result']
        nd, nl, ns = len(v['dc']['buses']), len(v['dc']['lines']), len(v['dc']['stations'])
        root = ET.fromstring(NV.svg(v, res, 'flow'))
        it = list(root.iter())
        self.assertEqual(sum(1 for e in it if e.tag == 'rect' and e.get('class') == 'dc'), nd)
        self.assertEqual(sum(1 for e in it if e.tag == 'line' and e.get('class') == 'dc'), nl)
        self.assertEqual(sum(1 for e in it if e.tag == 'g' and e.get('class') == 'station'), ns)
        tips = [e.text for e in it if e.tag == 'title']
        self.assertIn('Bm-B3 · ±200 kV DC', tips)
        self.assertIn('Cm-B3: AC Cm-B3 – Bm-B3 · κρατά την τάση DC · -835,2 MW', tips)
        f = S.view({'case': 'b4', 'study': 'acdc', 'format': 'dxf'})
        d = f['text'].split('\n')
        pairs = list(zip(d[0:-1:2], d[1:-1:2]))
        ent = [b for a, b in pairs if a == '0']
        ndd = sum(e.get('kind') == 'dcdc' for e in v['dc']['lines'])
        self.assertEqual(ndd, 2)
        self.assertEqual(ent.count('LINE'), nl + 4 * nd + ns * 6 + ndd * 6)                       # DC lines, squares, each station: its link, a square and a diagonal; each DC/DC a square and two diagonals
        self.assertEqual(sum(1 for e in it if e.tag == 'g' and e.get('class') == 'dcdc'), ndd)
        self.assertIn('Μετατροπέας DC/DC Cd-E1: Bb-E1 → Bm-E1 · σταθερή ισχύς a → b · 300 MW', tips)
        layers = [b for (a, b), (c, _) in zip(pairs, pairs[1:] + [('', '')]) if a == '2' and c == '70' and b.isupper() and b not in ('LTYPE', 'LAYER')]
        self.assertTrue({'DC_BUSES', 'DC_BUS_NAMES', 'DC_LINES', 'STATIONS', 'V_PU', 'FLOW_MW'} <= set(layers))
        txt = [b for (a, b) in pairs if a == '1']
        self.assertEqual(sum(1 for t in txt if t.startswith('Bm-') or t.startswith('Bb-')), nd)
        try:
            import ezdxf
        except ImportError:
            self.skipTest('ezdxf is not installed: the drawing is read here only by the checks above')
        import io
        self.assertEqual(len(ezdxf.read(io.StringIO(f['text'])).audit().errors), 0)

    def test_the_viewer_draws_and_picks_the_dc_grid(self):
        data = {'dc': S.run({'case': 'b4', 'study': 'acdc', 'view': 'only'})}
        fd, name = tempfile.mkstemp(suffix='.json')
        with os.fdopen(fd, 'w', encoding='utf-8') as f:
            json.dump(data, f)
        try:
            out = subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'netview_cases.js'), name], capture_output=True, text=True, timeout=300, cwd=ROOT)
        finally:
            os.unlink(name)
        if out.returncode:
            raise RuntimeError(out.stderr[-2000:])
        r = json.loads(out.stdout)['dc']['dc']
        nd, nl, ns = r['nd'], r['nl'], r['ns']
        self.assertEqual((nd, nl, ns), (15, 17, 11))                                             # 4.21: 15 DC lines and the two DC/DC converters; 11 stations
        self.assertEqual((r['busOk'], r['stOk'], r['ends'], r['inside']), (nd, ns, ns, nd))      # every DC bus and station at its place; all inside when fitted
        self.assertEqual(r['lineOk'] + r['lineOther'], nl)                                        # the middle of a DC line: the line, or something nearer
        self.assertGreaterEqual(r['lineOk'], nl - 2)
        a = r['all']['out']
        self.assertEqual((a['dcbuses'], a['dclines'], a['stations']), (nd, nl, ns))
        self.assertEqual(r['all']['rects'], nd + ns + 2)                                          # the DC buses, the stations and (4.21) the two DC/DC converters as squares
        self.assertEqual((r['away']['out'].get('dcbuses'), r['away']['out'].get('dclines'), r['away']['out'].get('stations'), r['away']['rects']), (0, 0, 0, 0))
        self.assertGreater(r['close']['out']['values'], 0)                                        # close: the flows of the DC lines and stations
        self.assertEqual(r['closeOff']['texts'], 0)
        self.assertEqual((r['hit'], r['hitLine']), (1, 1))
        self.assertLessEqual(r['maxC'], len(r['palette']) - 1)
        self.assertTrue(set(r['all']['stroke']) | set(r['all']['fill']) <= set(r['palette']) | {'#ffffff', '#5f6b6d', '#7a7a7a'})
        self.assertTrue(set(r['base']['fill']) >= {'#6a3d9a', '#1f78b4'})                          # the two DC voltages of the B4 in their colours
        t = r['text']
        self.assertEqual((t['plain'], t['bus']), ('Ζυγός DC Bm-A1 · ±200 kV', 'Ζυγός DC Bm-A1 · ±200 kV'))     # the flows leave the DC buses without a value
        self.assertEqual(t['line'], 'Γραμμή DC Bm-C1–Bm-A1: Bm-C1 – Bm-A1 · 500 MW στο Bm-C1')
        self.assertEqual(t['station'], 'Σταθμός μετατροπέα Cm-A1: AC Cm-A1 (AC) – Bm-A1 (DC) · κρατά την τάση DC · -494 MW προς το DC')
