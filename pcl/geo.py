"""The places of a network on the earth, in a small form (4.22, ROADMAP §69; decision 337).

A network may carry where its buses are (longitude, latitude in degrees, WGS 84) and the route of a line (a list of points
from one end to the other). They are kept apart from the electrical data, in net.geo, so that a network without them is the
same network as before and a load flow never reads them:

    net.geo = {'buses': {bus: [lon, lat]}, 'routes': {element: [[lon, lat], …]}}

    attach(net, buses, routes)          set them (checked: numbers, −180…180, −90…90; a route of at least two points)
    of(net)                             what a network has, or None
    builtin(case)                       the places of a test network of ours (pcl/data/geo/<case>.geojson), or None
    coverage(net)                       how many buses and lines have places, and which do not
    haversine(p, q)                     the distance of two points on a sphere of the mean radius of the earth (km)
    route_length(points)                the length of a route (km), the sum of its legs
    lengths(net)                        per line: the length in the data, the straight distance of its ends, its route
    to_geojson(net, view, layers)       the network as GeoJSON (RFC 7946): a Point per bus, a LineString per branch, with
                                        what the layers of a study show as properties
    from_geojson(net, gj, set_lengths)  a copy of the network with the places of a GeoJSON file; with set_lengths the length
                                        of every line with a route becomes the length of its route
    project(view, net)                  a view of pcl.netview on the map: Web Mercator (EPSG:3857) about the middle of the
                                        network, in km, with a graticule and the error of the scale

The map has no tiles: the places, the graticule and a scale bar, so that it works without a network connection. Our test
network: IEEE 14 with places that we chose (pcl/data/geo/ieee14.geojson), not the geography of any real network.
"""
import copy
import json
import math
from pathlib import Path

R_EARTH = 6371.0088          # km, the mean radius of the earth (IUGG): the haversine distance
R_WM = 6378137.0             # m, the radius of Web Mercator (EPSG:3857, the semi-major axis of WGS 84)
LAT_WM = 85.05112878         # the latitude where Web Mercator is cut (a square map)
SERIES = ('line', 'branch', 'transformer', 'transformer3', 'reactor')
DATA = Path(__file__).resolve().parent / 'data' / 'geo'
STEPS = (0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.25, 0.5, 1.0, 2.0, 5.0, 10.0, 15.0, 30.0)


class GeoError(ValueError):
    """Places that are not read (the message is for the user, in Greek)."""


# ---------------------------------------------------------------- points and distances
def _point(p, what):
    try:
        lon, lat = float(p[0]), float(p[1])
    except (TypeError, ValueError, IndexError, KeyError) as e:
        raise GeoError(f'{what}: ένα σημείο είναι [μήκος, πλάτος] σε μοίρες') from e
    if not (math.isfinite(lon) and math.isfinite(lat)) or not -180.0 <= lon <= 180.0 or not -90.0 <= lat <= 90.0:
        raise GeoError(f'{what}: το μήκος από −180 ως 180° και το πλάτος από −90 ως 90°')
    return [lon, lat]


def haversine(p, q):
    """The distance (km) of two points [lon, lat] (degrees) on a sphere of radius R_EARTH."""
    l1, f1, l2, f2 = map(math.radians, (p[0], p[1], q[0], q[1]))
    a = math.sin((f2 - f1) / 2) ** 2 + math.cos(f1) * math.cos(f2) * math.sin((l2 - l1) / 2) ** 2
    return 2 * R_EARTH * math.asin(min(1.0, math.sqrt(a)))


def route_length(points):
    """The length (km) of a route: the sum of the distances of its consecutive points."""
    return sum(haversine(points[i - 1], points[i]) for i in range(1, len(points)))


def mercator(lon, lat):
    """Web Mercator (EPSG:3857): (x, y) in m, x to the east, y to the north."""
    f = math.radians(max(-LAT_WM, min(LAT_WM, lat)))
    return R_WM * math.radians(lon), R_WM * math.log(math.tan(math.pi / 4 + f / 2))


# ---------------------------------------------------------------- the places of a network
def of(net):
    g = net.__dict__.get('geo')
    return g if g and (g.get('buses') or g.get('routes')) else None


def attach(net, buses=None, routes=None):
    """Set the places of the buses ({bus: [lon, lat]}) and the routes of elements ({name: [[lon, lat], …]}) of a network,
    over what it had. A bus or an element that the network does not have is refused."""
    g = net.__dict__.get('geo') or {}
    gb, gr = dict(g.get('buses') or {}), dict(g.get('routes') or {})
    names = {e['name'] for e in net.elements}
    for b, p in (buses or {}).items():
        b = str(b)
        if b not in net.buses:
            raise GeoError(f'άγνωστος ζυγός {b}')
        gb[b] = _point(p, f'ζυγός {b}')
    for n, pts in (routes or {}).items():
        n = str(n)
        if n not in names:
            raise GeoError(f'άγνωστο στοιχείο {n}')
        if not isinstance(pts, (list, tuple)) or len(pts) < 2:
            raise GeoError(f'{n}: μια διαδρομή έχει δύο σημεία τουλάχιστον')
        gr[n] = [_point(p, n) for p in pts]
    net.geo = {'buses': gb, 'routes': gr}
    return net.geo


def builtin(case):
    """The GeoJSON of a test network of ours, or None."""
    p = DATA / f'{case}.geojson'
    if not case or not str(case).replace('_', '').isalnum() or not p.is_file():
        return None
    return json.loads(p.read_text(encoding='utf-8'))


def coverage(net):
    """{'buses': with places, 'of': all, 'missing': [the first 20 without], 'routes': lines with a route, 'series': all}."""
    g = of(net) or {}
    gb = g.get('buses') or {}
    miss = [b for b in net.buses if b not in gb and net.buses[b].get('type') != 'internal']
    ser = [e for e in net.elements if e['kind'] in SERIES]
    return {'buses': len(net.buses) - len(miss), 'of': len(net.buses) - sum(d.get('type') == 'internal' for d in net.buses.values()),
            'missing': miss[:20], 'routes': sum(e['name'] in (g.get('routes') or {}) for e in ser), 'series': len(ser)}


def _ends(e):
    if e['kind'] == 'transformer3':
        return e['hv'], e['lv']
    if e['kind'] == 'transformer':
        return e['hv'], e['lv']
    return e.get('a'), e.get('b')


def lengths(net):
    """Per line or branch with places at both ends: {'name', 'kind', 'a', 'b', 'data_km' (a line: its length; else None),
    'straight_km', 'route_km' (None without a route), 'ratio' (route or straight over the data)}."""
    g = of(net) or {}
    gb, gr, out = g.get('buses') or {}, g.get('routes') or {}, []
    for e in net.elements:
        if e['kind'] not in ('line', 'branch', 'reactor'):
            continue
        a, b = _ends(e)
        if a not in gb or b not in gb:
            continue
        s = haversine(gb[a], gb[b])
        r = route_length(gr[e['name']]) if e['name'] in gr else None
        d = float(e['length']) if e['kind'] == 'line' else None
        out.append({'name': e['name'], 'kind': e['kind'], 'a': a, 'b': b, 'data_km': d, 'straight_km': s, 'route_km': r,
                    'ratio': ((r if r is not None else s) / d) if d else None})
    return out


# ---------------------------------------------------------------- GeoJSON (RFC 7946)
def _route(gb, gr, name, a, b):
    """The points of a branch: its route, with the places of its buses at its ends when the route stops short of them."""
    if name in gr:
        pts = [list(p) for p in gr[name]]
        if a in gb and haversine(pts[0], gb[a]) > haversine(pts[-1], gb[a]):
            pts.reverse()                              # a route given from the other end
        if a in gb and pts[0] != gb[a]:
            pts.insert(0, list(gb[a]))
        if b in gb and pts[-1] != gb[b]:
            pts.append(list(gb[b]))
        return pts
    return [list(gb[a]), list(gb[b])] if a in gb and b in gb else None


def to_geojson(net, view=None, result=None, layers=('voltage', 'flow', 'loading')):
    """The network as a GeoJSON FeatureCollection (RFC 7946: [lon, lat] in WGS 84, the properties of every feature as plain
    numbers and text). A Point per bus with a place ('bus', 'label', 'Un_kV', 'type'), a LineString per line, branch,
    transformer or reactor with places at both ends ('branch', 'kind', 'a', 'b', 'length_km' of a line, 'route_km'). With
    the view and the result of a study (pcl.netview) the values of the layers too: '<layer>' and '<layer>_unit'."""
    from . import netview
    g = of(net)
    if g is None:
        raise GeoError('Το δίκτυο δεν έχει θέσεις ζυγών (συντεταγμένες).')
    gb, gr = g.get('buses') or {}, g.get('routes') or {}
    vals = []
    if view is not None:
        for L in layers or ():
            q = netview.values(view, result, L)
            if not q['note']:
                vals.append(q)
    feats = []
    for b, d in net.buses.items():
        if b not in gb:
            continue
        pr = {'bus': b, 'Un_kV': float(d.get('Un', 0.0)) / 1e3, 'type': d.get('type', 'PQ')}
        if d.get('label'):
            pr['label'] = d['label']
        for q in vals:
            x = q['bus'].get(b)
            if x is not None:
                pr[q['layer']], pr[q['layer'] + '_unit'] = float(x), q['unit_bus']
        feats.append({'type': 'Feature', 'id': 'bus:' + b, 'geometry': {'type': 'Point', 'coordinates': list(gb[b])}, 'properties': pr})
    for e in net.elements:
        if e['kind'] not in SERIES:
            continue
        a, b = _ends(e)
        pts = _route(gb, gr, e['name'], a, b)
        if pts is None:
            continue
        pr = {'branch': e['name'], 'kind': e['kind'], 'a': a, 'b': b, 'route_km': route_length(pts)}
        if e['kind'] == 'line':
            pr['length_km'] = float(e['length'])
        for q in vals:
            x = q['branch'].get(e['name'])
            if x is None:                                  # the view names the parts of a branch name#k
                ks = [v for k, v in q['branch'].items() if k.split('#')[0] == e['name'] and v is not None]
                x = max(ks, key=abs) if ks else None
            if x is not None:
                pr[q['layer']], pr[q['layer'] + '_unit'] = float(x), q['unit_branch']
        feats.append({'type': 'Feature', 'id': 'branch:' + e['name'], 'geometry': {'type': 'LineString', 'coordinates': pts}, 'properties': pr})
    xs = [p[0] for f in feats for p in (f['geometry']['coordinates'] if f['geometry']['type'] == 'LineString' else [f['geometry']['coordinates']])]
    ys = [p[1] for f in feats for p in (f['geometry']['coordinates'] if f['geometry']['type'] == 'LineString' else [f['geometry']['coordinates']])]
    out = {'type': 'FeatureCollection', 'name': net.name or 'network', 'features': feats}
    if xs:
        out['bbox'] = [min(xs), min(ys), max(xs), max(ys)]
    return out


def _features(gj):
    if isinstance(gj, str):
        try:
            gj = json.loads(gj)
        except ValueError as e:
            raise GeoError('Το αρχείο δεν είναι JSON.') from e
    if not isinstance(gj, dict):
        raise GeoError('Ένα αρχείο GeoJSON είναι ένα αντικείμενο JSON.')
    if gj.get('type') == 'FeatureCollection':
        fs = gj.get('features')
    elif gj.get('type') == 'Feature':
        fs = [gj]
    else:
        raise GeoError('Περιμένω GeoJSON (RFC 7946): FeatureCollection ή Feature.')
    if not isinstance(fs, list):
        raise GeoError('features: μια λίστα.')
    return fs


def from_geojson(net, gj, set_lengths=False):
    """A copy of the network with the places of a GeoJSON file, and what was done:

    a Point gives the place of the bus named by its property 'bus' (or 'id', 'name', or the label of a bus); a LineString the
    route of the element named by 'branch' (or 'name', 'id'). With set_lengths the length of every line ('line') that has a
    route becomes the length of the route (km): its impedance and its charging grow with it. A branch in per unit has no
    length: its route is kept and shown, its data stay as they are.

    → (net2, {'buses', 'routes', 'unknown': [names of features matched to nothing], 'skipped': [features of other
       geometries], 'lengths': [{'name', 'before', 'after'}]})."""
    from . import network as N
    fs = _features(gj)
    by_label = {}
    for b, d in net.buses.items():
        if d.get('label'):
            by_label.setdefault(str(d['label']), b)
    names = {e['name']: e for e in net.elements}
    buses, routes, unknown, skipped = {}, {}, [], []
    for i, f in enumerate(fs):
        geom, pr = (f or {}).get('geometry') or {}, (f or {}).get('properties') or {}
        t, c = geom.get('type'), geom.get('coordinates')
        if t == 'Point':
            key = next((str(pr[k]) for k in ('bus', 'id', 'name') if pr.get(k) is not None), None)
            b = key if key in net.buses else by_label.get(key) if key is not None else None
            if b is None:
                unknown.append(key if key is not None else f'#{i}')
                continue
            buses[b] = _point(c, f'ζυγός {b}')
        elif t == 'LineString':
            key = next((str(pr[k]) for k in ('branch', 'name', 'id') if pr.get(k) is not None), None)
            if key is None or key not in names:
                unknown.append(key if key is not None else f'#{i}')
                continue
            if not isinstance(c, list) or len(c) < 2:
                raise GeoError(f'{key}: μια διαδρομή έχει δύο σημεία τουλάχιστον')
            routes[key] = [_point(p, key) for p in c]
        else:
            skipped.append(f'#{i} {t}')
    net2 = N.from_dict(N.to_dict(net))
    attach(net2, buses, routes)
    done = []
    if set_lengths:
        for e in net2.elements:
            if e['kind'] == 'line' and e['name'] in routes:
                g = net2.geo
                a, b = _ends(e)
                L = route_length(_route(g['buses'], g['routes'], e['name'], a, b))
                if L > 0:
                    done.append({'name': e['name'], 'before': float(e['length']), 'after': L})
                    e['length'] = L
    return net2, {'buses': len(buses), 'routes': len(routes), 'unknown': unknown[:50], 'skipped': skipped[:50], 'lengths': done}


# ---------------------------------------------------------------- the map
def _step(span):
    for s in STEPS:
        if span / s <= 8:
            return s
    return STEPS[-1]


def _deg(v, pos, neg, step):
    dec = max(0, -int(math.floor(math.log10(step) + 1e-9)))
    t = f'{abs(v):.{dec}f}'.replace('.', ',')
    return f'{t}° {pos if v > 0 else neg if v < 0 else ""}'.strip()


def project(view, net):
    """The view of pcl.netview on the map: every bus at its place in Web Mercator about the middle of the network, in km of
    the middle (y down, as in the view), the routes as points of the same plane, a graticule and the error of the scale at
    the edges (Mercator is true only on the latitude of the middle). The DC buses need places too. → a new view, or None
    when a bus has no place."""
    g = of(net)
    if g is None:
        return None
    gb, gr = g.get('buses') or {}, g.get('routes') or {}
    ids = [b['id'] for b in view['buses']] + [b['id'] for b in (view.get('dc') or {}).get('buses', [])]
    if any(i not in gb for i in ids):
        return None
    lons, lats = [gb[i][0] for i in ids], [gb[i][1] for i in ids]
    lon0, lat0 = (min(lons) + max(lons)) / 2, (min(lats) + max(lats)) / 2
    used = {e['name'].split('#')[0] for e in view['branches']}
    lons += [p[0] for n, r in gr.items() if n in used for p in r]          # the graticule covers the routes too
    lats += [p[1] for n, r in gr.items() if n in used for p in r]
    X0, Y0 = mercator(lon0, lat0)
    k = math.cos(math.radians(lat0)) / 1000.0           # m of the map → km on the earth at the middle latitude

    def xy(p):
        X, Y = mercator(p[0], p[1])
        return round((X - X0) * k, 4), round(-(Y - Y0) * k, 4)

    v = copy.deepcopy(view)
    for b in v['buses']:
        b['x'], b['y'] = xy(gb[b['id']])
    if v.get('dc'):
        for b in v['dc']['buses']:
            b['x'], b['y'] = xy(gb[b['id']])
    pos = {b['id']: (b['x'], b['y']) for b in v['buses']}
    routes = {}
    for j, e in enumerate(v['branches']):
        n = e['name'].split('#')[0]
        if n in gr and e.get('of', 1) == 1:
            pts = _route(gb, gr, n, e['a'], e['b'])
            routes[str(j)] = [list(xy(p)) for p in pts]
    xs = [b['x'] for b in v['buses']] + [b['x'] for b in (v.get('dc') or {}).get('buses', [])] + [p[0] for r in routes.values() for p in r]
    ys = [b['y'] for b in v['buses']] + [b['y'] for b in (v.get('dc') or {}).get('buses', [])] + [p[1] for r in routes.values() for p in r]
    v['bounds'] = [min(xs), min(ys), max(xs), max(ys)]
    d = sorted(math.hypot(pos[e['a']][0] - pos[e['b']][0], pos[e['a']][1] - pos[e['b']][1]) for e in v['branches'] if e['a'] in pos and e['b'] in pos)
    d = [q for q in d if q > 0]
    v['unit'] = round(d[len(d) // 2], 4) if d else max(1.0, max(v['bounds'][2] - v['bounds'][0], v['bounds'][3] - v['bounds'][1]) / 4)
    # the graticule: meridians and parallels at a round step, a little past the network on every side
    sl, sf = _step(max(lons) - min(lons) or 0.01), _step(max(lats) - min(lats) or 0.01)
    st = max(sl, sf)
    la0, la1 = math.floor(min(lons) / st) * st, math.ceil(max(lons) / st) * st
    fa0, fa1 = math.floor(min(lats) / st) * st, math.ceil(max(lats) / st) * st
    grid = []
    n = int(round((la1 - la0) / st))
    for i in range(n + 1):
        lo = la0 + i * st
        grid.append({'k': 'lon', 'v': round(lo, 6), 't': _deg(lo, 'Α', 'Δ', st), 'pts': [list(xy((lo, fa0))), list(xy((lo, fa1)))]})
    n = int(round((fa1 - fa0) / st))
    for i in range(n + 1):
        fa = fa0 + i * st
        grid.append({'k': 'lat', 'v': round(fa, 6), 't': _deg(fa, 'Β', 'Ν', st), 'pts': [list(xy((la0, fa))), list(xy((la1, fa)))]})
    err = max(abs(math.cos(math.radians(lat0)) / math.cos(math.radians(f)) - 1.0) for f in (min(lats), max(lats)))
    v['geo'] = {'projection': 'EPSG:3857', 'km': 1.0, 'center': [lon0, lat0], 'step': st, 'grid': grid, 'routes': routes,
                'scale_err': round(err, 6), 'routes_n': len(routes)}
    return v
