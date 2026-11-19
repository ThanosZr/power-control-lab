"""The places of a network on the earth, in a small form (4.22, ROADMAP §69, pcl/geo.py, decision 337): the distances on
the sphere and Web Mercator against independent formulas; places and routes kept apart from the electrical data (a network
without them is the network of before, and a load flow does not read them); GeoJSON (RFC 7946) out and in again; the length
of a line from its route; the study on the map (the picture moves, the values do not); the SVG of the map; the viewer of the
page on the map headless (tests/js/geo_cases.js)."""
import copy
import json
import math
import os
import pathlib
import subprocess
import tempfile
import unittest

from pcl import geo as G
from pcl import netview as NV
from pcl import network as N
from pcl import study as S

ROOT = pathlib.Path(__file__).resolve().parent.parent


def ieee14_geo():
    net, rep = G.from_geojson(N.ieee14(), G.builtin('ieee14'))
    return net, rep


def line_net():
    """A small 150 kV network of lines in Ω/km (ours): a source, three buses, two loads."""
    n = N.Network(50.0, 100e6, 'geo test')
    for b in ('A', 'B', 'C', 'D'):
        n.bus(b, 150e3, 'slack' if b == 'A' else 'PQ')
    n.feeder('A', Sk=5e9, name='Q')
    n.line('A', 'B', 0.06, 0.4, length=20.0, B=2.8e-6, name='L1')
    n.line('B', 'C', 0.06, 0.4, length=15.0, B=2.8e-6, name='L2')
    n.line('A', 'D', 0.06, 0.4, length=25.0, B=2.8e-6, name='L3')
    n.load('C', 40e6, 10e6, name='LC')
    n.load('D', 30e6, 8e6, name='LD')
    G.attach(n, {'A': [22.0, 38.0], 'B': [22.2, 38.05], 'C': [22.35, 38.12], 'D': [21.85, 37.82]},
             {'L1': [[22.0, 38.0], [22.08, 38.09], [22.2, 38.05]]})
    return n


class Sphere(unittest.TestCase):
    def test_haversine_against_the_law_of_cosines(self):
        # an independent formula (the spherical law of cosines) on the same sphere
        def cosines(p, q):
            l1, f1, l2, f2 = map(math.radians, (p[0], p[1], q[0], q[1]))
            return G.R_EARTH * math.acos(min(1.0, math.sin(f1) * math.sin(f2) + math.cos(f1) * math.cos(f2) * math.cos(l2 - l1)))
        for p, q in (([23.7275, 37.9838], [22.9444, 40.6401]), ([0, 0], [90, 0]), ([-73.99, 40.73], [2.35, 48.86]), ([22.1, 37.95], [22.12, 37.66])):
            self.assertAlmostEqual(G.haversine(p, q), cosines(p, q), delta=1e-6 * max(1.0, cosines(p, q)))
        self.assertAlmostEqual(G.haversine([0, 0], [0, 1]), G.R_EARTH * math.pi / 180, places=9)    # a degree of a meridian
        self.assertAlmostEqual(G.haversine([0, 0], [180, 0]), G.R_EARTH * math.pi, places=6)       # half the equator

    def test_route_length_is_the_sum_of_its_legs(self):
        pts = [[22.0, 38.0], [22.1, 38.1], [22.3, 38.0], [22.3, 37.9]]
        self.assertAlmostEqual(G.route_length(pts), sum(G.haversine(pts[i - 1], pts[i]) for i in range(1, 4)), places=12)
        self.assertEqual(G.route_length(pts[:1]), 0)

    def test_web_mercator(self):
        for lat in (-60.0, -12.5, 0.0, 37.9, 45.0, 80.0):
            x, y = G.mercator(23.5, lat)
            self.assertAlmostEqual(x, G.R_WM * math.radians(23.5), places=6)
            self.assertAlmostEqual(y, G.R_WM * math.asinh(math.tan(math.radians(lat))), delta=1e-6)   # the same curve by another identity
        self.assertAlmostEqual(G.mercator(0, 45)[1], 5621521.486, delta=1e-3)                       # 45° N in EPSG:3857
        self.assertEqual(G.mercator(0, 89.9), G.mercator(0, G.LAT_WM))                                 # cut at 85,05°


class Places(unittest.TestCase):
    def test_kept_apart_from_the_electrical_data(self):
        net = N.ieee14()
        self.assertIsNone(G.of(net))
        self.assertNotIn('geo', N.to_dict(net))                                   # a network without places: written as before
        g, rep = ieee14_geo()
        self.assertEqual((rep['buses'], rep['routes'], rep['unknown'], rep['skipped'], rep['lengths']), (14, 3, [], [], []))
        d = N.to_dict(g)
        self.assertEqual(d['geo']['buses']['1'], G.builtin('ieee14')['features'][0]['geometry']['coordinates'])
        self.assertEqual(N.to_dict(N.from_dict(d)), d)                            # through JSON and back
        a = S.run({'case': 'ieee14', 'study': 'pf'})['result']
        b = S.run({'network': d, 'study': 'pf'})['result']
        self.assertEqual(json.dumps(a['buses'], sort_keys=True), json.dumps(b['buses'], sort_keys=True))   # the load flow does not read them
        self.assertEqual(G.coverage(g), {'buses': 14, 'of': 14, 'missing': [], 'routes': 3, 'series': 20})

    def test_checked(self):
        net = N.ieee14()
        for bad in ([200, 10], [10, 95], ['x', 1], [1], None):
            with self.assertRaises(G.GeoError):
                G.attach(net, {'1': bad})
        with self.assertRaises(G.GeoError):
            G.attach(net, {'99': [1, 2]})
        with self.assertRaises(G.GeoError):
            G.attach(net, routes={'br1': [[1, 2]]})
        with self.assertRaises(G.GeoError):
            G.from_geojson(net, {'type': 'Point', 'coordinates': [1, 2]})
        with self.assertRaises(G.GeoError):
            G.from_geojson(net, 'not json')
        with self.assertRaises(N.NetworkError):
            N.from_dict(dict(N.to_dict(net), geo={'buses': {'1': [500, 0]}}))

    def test_lengths(self):
        g, _ = ieee14_geo()
        L = {q['name']: q for q in G.lengths(g)}
        self.assertEqual(len(L), 20)
        P = g.geo['buses']
        self.assertAlmostEqual(L['br2']['straight_km'], G.haversine(P['1'], P['5']), places=12)
        self.assertIsNone(L['br2']['route_km'])
        self.assertGreater(L['br3']['route_km'], L['br3']['straight_km'])           # a route round a hill is longer than the chord
        self.assertIsNone(L['br1']['data_km'])                                       # a branch in per unit has no length


class GeoJSON(unittest.TestCase):
    def test_out_and_in_again(self):
        g, _ = ieee14_geo()
        gj = G.to_geojson(g)
        self.assertEqual(gj['type'], 'FeatureCollection')
        kinds = [f['geometry']['type'] for f in gj['features']]
        self.assertEqual((kinds.count('Point'), kinds.count('LineString')), (14, 20))
        self.assertTrue(all(len(f['geometry']['coordinates']) == 2 for f in gj['features'] if f['geometry']['type'] == 'Point'))
        lo, la = [p for f in gj['features'] if f['geometry']['type'] == 'Point' for p in [f['geometry']['coordinates']]][0]
        self.assertTrue(-180 <= lo <= 180 and -90 <= la <= 90)                       # [lon, lat] (RFC 7946 §3.1.1)
        allp = [p for f in gj['features'] for p in (f['geometry']['coordinates'] if f['geometry']['type'] == 'LineString' else [f['geometry']['coordinates']])]
        self.assertEqual(gj['bbox'], [min(p[0] for p in allp), min(p[1] for p in allp), max(p[0] for p in allp), max(p[1] for p in allp)])
        back, rep = G.from_geojson(N.ieee14(), json.dumps(gj))
        self.assertEqual(back.geo['buses'], g.geo['buses'])
        self.assertEqual((rep['buses'], rep['routes'], rep['unknown']), (14, 20, []))    # every branch comes back with a route (its chord at least)
        br3 = [f for f in gj['features'] if f['properties'].get('branch') == 'br3'][0]
        self.assertAlmostEqual(br3['properties']['route_km'], G.route_length(g.geo['routes']['br3']), places=9)

    def test_with_what_the_study_found(self):
        r = S.view({'case': 'ieee14', 'study': 'pf', 'format': 'geojson'})
        self.assertEqual((r['name'], r['mime']), ('network_ieee14_pf.geojson', 'application/geo+json'))
        gj = json.loads(r['text'])
        res = S.run({'case': 'ieee14', 'study': 'pf'})['result']
        b5 = [f for f in gj['features'] if f['properties'].get('bus') == '5'][0]['properties']
        self.assertAlmostEqual(b5['voltage'], res['buses']['5']['V'], places=9)
        self.assertEqual(b5['voltage_unit'], 'pu')
        br1 = [f for f in gj['features'] if f['properties'].get('branch') == 'br1'][0]['properties']
        self.assertAlmostEqual(br1['flow'], res['branches'][0]['Pa'] / 1e6, places=6)
        with self.assertRaises(S.StudyError):
            S.view({'case': 'ieee30', 'study': 'pf', 'format': 'geojson'})          # no places: said, not an empty file

    def test_names_and_labels(self):
        net = N.ieee14()
        net.buses['3']['label'] = 'ΒΟΡΡΑΣ'
        gj = {'type': 'FeatureCollection', 'features': [
            {'type': 'Feature', 'geometry': {'type': 'Point', 'coordinates': [22.4, 37.6]}, 'properties': {'name': 'ΒΟΡΡΑΣ'}},
            {'type': 'Feature', 'geometry': {'type': 'Point', 'coordinates': [22.5, 37.6]}, 'properties': {'id': 7}},
            {'type': 'Feature', 'geometry': {'type': 'Point', 'coordinates': [22.5, 37.6]}, 'properties': {'bus': 'Z9'}},
            {'type': 'Feature', 'geometry': {'type': 'Polygon', 'coordinates': [[[0, 0], [1, 0], [1, 1], [0, 0]]]}, 'properties': {}}]}
        g, rep = G.from_geojson(net, gj)
        self.assertEqual(g.geo['buses'], {'3': [22.4, 37.6], '7': [22.5, 37.6]})
        self.assertEqual((rep['unknown'], rep['skipped']), (['Z9'], ['#3 Polygon']))
        self.assertIsNone(G.of(net))                                                 # the network that was given is not changed


class LineLengths(unittest.TestCase):
    def test_a_line_takes_the_length_of_its_route(self):
        n = line_net()
        gj = G.to_geojson(n)
        n0 = N.from_dict(dict(N.to_dict(n), geo=None))
        same, rep0 = G.from_geojson(n0, gj)
        self.assertEqual(rep0['lengths'], [])
        g, rep = G.from_geojson(n0, gj, set_lengths=True)
        L = {q['name']: q for q in rep['lengths']}
        self.assertEqual(sorted(L), ['L1', 'L2', 'L3'])                              # each line has a route in the file (L2, L3: the chord)
        self.assertAlmostEqual(L['L1']['after'], G.route_length(n.geo['routes']['L1']), places=9)
        self.assertAlmostEqual(L['L3']['after'], G.haversine(n.geo['buses']['A'], n.geo['buses']['D']), places=9)
        self.assertEqual(L['L1']['before'], 20.0)
        el = {e['name']: e for e in g.elements}
        self.assertAlmostEqual(el['L1']['length'], L['L1']['after'], places=12)
        # the load flow sees the new lengths: the voltage of C falls with the longer L1
        a = S.run({'network': N.to_dict(same), 'study': 'pf'})['result']['buses']['C']['V']
        b = S.run({'network': N.to_dict(g), 'study': 'pf'})['result']['buses']['C']['V']
        self.assertNotAlmostEqual(a, b, places=6)
        self.assertGreater(L['L1']['after'], 20.0)
        self.assertLess(b, a)
        # through a request: geojson with geo_lengths
        r = S.run({'network': N.to_dict(n0), 'study': 'pf', 'geojson': gj, 'geo_lengths': True})
        self.assertEqual(len(r['network']['geo']['lengths']), 3)
        self.assertAlmostEqual(r['result']['buses']['C']['V'], b, places=12)


class Map(unittest.TestCase):
    def test_the_view_on_the_map(self):
        g, _ = ieee14_geo()
        v = NV.view(g)
        m = G.project(v, g)
        self.assertEqual(v, NV.view(g))                                              # the view of before is not changed
        self.assertEqual(m['geo']['projection'], 'EPSG:3857')
        pos = {b['id']: (b['x'], b['y']) for b in m['buses']}
        err = m['geo']['scale_err']
        self.assertLess(err, 0.01)
        for e in m['branches']:                                                      # every branch as long as on the earth, within the error of the scale
            d = math.hypot(pos[e['a']][0] - pos[e['b']][0], pos[e['a']][1] - pos[e['b']][1])
            s = G.haversine(g.geo['buses'][e['a']], g.geo['buses'][e['b']])
            self.assertLess(abs(d / s - 1), err + 2e-3, e['name'])
        y1, y6 = pos['1'][1], pos['6'][1]
        self.assertGreater(y1, y6)                                                   # north is up: y grows to the south
        self.assertEqual(sorted(m['geo']['routes']), ['0', '2', '8'])
        self.assertEqual(m['geo']['step'], 0.1)
        lon = [q for q in m['geo']['grid'] if q['k'] == 'lon']
        self.assertEqual(lon[0]['t'], '22,0° Α')
        self.assertTrue(all(abs(q['pts'][0][0] - q['pts'][1][0]) < 1e-9 for q in lon))   # meridians straight up in Mercator
        self.assertIsNone(G.project(NV.view(N.ieee14()), N.ieee14()))

    def test_the_study_on_the_map(self):
        a = S.run({'case': 'ieee14', 'study': 'pf', 'view': 'only'})
        b = S.run({'case': 'ieee14', 'study': 'pf', 'view': 'only', 'map': True})
        self.assertNotIn('geo', a['view'])
        self.assertEqual(a['view'], NV.view(N.ieee14()))                             # without the map: the picture of before
        self.assertEqual(a['layers'], b['layers'])                                   # the values do not move with the map
        self.assertEqual(a['geo'], {'buses': 14, 'of': 14, 'routes': 3, 'map': True})
        self.assertEqual(S.run({'case': 'ieee30', 'study': 'pf', 'view': 'only'})['geo']['map'], False)
        with self.assertRaises(S.StudyError) as c:
            S.run({'case': 'ieee30', 'study': 'pf', 'view': 'only', 'map': True})
        self.assertIn('0 από 30', str(c.exception))

    def test_svg_of_the_map(self):
        s = S.view({'case': 'ieee14', 'study': 'pf', 'format': 'svg', 'map': True, 'layer': 'voltage'})['text']
        self.assertEqual(s.count('<polyline'), 3)
        self.assertGreater(s.count('class="grat"'), 10)
        self.assertIn('10 km', s)
        self.assertIn('38,0° Β', s)
        plain = S.view({'case': 'ieee14', 'study': 'pf', 'format': 'svg', 'layer': 'voltage'})['text']
        self.assertNotIn('grat', plain)
        self.assertEqual(NV.scale_bar(80), 10)
        self.assertEqual(NV.scale_bar(12), 2)
        self.assertEqual(NV.scale_bar(0.3), 0.05)


class Viewer(unittest.TestCase):
    def test_the_viewer_on_the_map(self):
        d = S.run({'case': 'ieee14', 'study': 'pf', 'view': 'only', 'map': True})
        plain = S.run({'case': 'ieee14', 'study': 'pf', 'view': 'only'})
        with tempfile.TemporaryDirectory() as td:
            p = os.path.join(td, 'd.json')
            with open(p, 'w', encoding='utf-8') as f:
                json.dump({'map': d, 'plain': plain}, f)
            R = json.loads(subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'geo_cases.js'), p], capture_output=True, text=True, check=True, timeout=120).stdout)
        M, P = R['map'], R['plain']
        self.assertEqual(sorted(M['rt']), [0, 2, 8])
        self.assertGreater(M['grid'], 10)
        self.assertIn(M['scale']['km'], (5, 10, 20))
        self.assertTrue(any('°' in t for t in M['texts']))
        self.assertTrue(any(t.endswith(' km') for t in M['texts']))
        self.assertTrue(all(q['onRoute'] for q in M['picks']))                       # a branch is picked on its route
        self.assertFalse(R['map']['picks'][1]['onChord'])                            # and not on the chord of a route that goes round
        self.assertEqual((P['rt'], P['grid'], P['scale']), (None, None, None))       # the schematic as before
        self.assertEqual(M['mid'], [3, 0.5])
        self.assertEqual(M['scaleLen'], [10, 2, 0.05, 50])


if __name__ == '__main__':
    unittest.main()
