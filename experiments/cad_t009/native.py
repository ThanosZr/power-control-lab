"""Bounded XY-profile to exact OCCT solid. Run exclusively in a child process."""
import json
import math
import sys

EPS = 1e-6


def profile(model):
    """One simple line loop with optional circular holes, or one circle."""
    points = {p['id']: (p['x'], p['y']) for p in model['points']}
    circles = [(points[c['center']], c['radius']) for c in model['circles']]
    if len(circles) > 4:
        raise ValueError('At most four circles')
    lines = model['lines']
    if not lines:
        if len(circles) != 1:
            raise ValueError('Expected one circle or one closed line loop')
        return None, circles, math.pi * circles[0][1]**2
    adj = {}
    for line in lines:
        a, b = line['a'], line['b']
        adj.setdefault(a, []).append(b)
        adj.setdefault(b, []).append(a)
    if len(adj) < 3 or any(len(v) != 2 or len(set(v)) != 2 for v in adj.values()):
        raise ValueError('Profile must be one closed shared-endpoint loop')
    start = min(adj)
    ids, prev, cur = [start], start, min(adj[start])
    while cur != start:
        if cur in ids:
            raise ValueError('Repeated loop vertex')
        ids.append(cur)
        prev, cur = cur, next(v for v in adj[cur] if v != prev)
    if len(ids) != len(adj):
        raise ValueError('Disconnected loops are not supported')
    polygon = [points[i] for i in ids]
    edges = list(zip(polygon, polygon[1:] + polygon[:1]))
    if any(math.dist(a,b) <= EPS for a,b in edges):
        raise ValueError('Degenerate edge')
    area = sum(a[0]*b[1]-a[1]*b[0] for a,b in edges)/2
    if abs(area) <= EPS:
        raise ValueError('Zero profile area')

    def distance(p, a, b):
        dx, dy = b[0]-a[0], b[1]-a[1]
        t = max(0, min(1, ((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy)))
        return math.hypot(p[0]-a[0]-t*dx, p[1]-a[1]-t*dy)

    def cross(a, b, c):
        return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])

    for i, (a,b) in enumerate(edges):
        for j in range(i+1, len(edges)):
            if j == i+1 or (i == 0 and j == len(edges)-1):
                continue
            c,d = edges[j]
            if (cross(a,b,c)*cross(a,b,d) < 0 and cross(c,d,a)*cross(c,d,b) < 0
                    or min(distance(a,c,d), distance(b,c,d), distance(c,a,b), distance(d,a,b)) <= EPS):
                raise ValueError('Self-intersecting or touching perimeter')
    for i, (p,r) in enumerate(circles):
        x,y = p
        inside = sum((a[1]>y) != (b[1]>y) and x < (b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]
                     for a,b in edges) % 2
        if not inside or min(distance(p,a,b) for a,b in edges) <= r+EPS:
            raise ValueError('Hole not strictly inside perimeter')
        if any(math.dist(p,q) <= r+s+EPS for q,s in circles[:i]):
            raise ValueError('Overlapping or touching holes')
    if area < 0:
        polygon.reverse()
    return polygon, circles, abs(area)-sum(math.pi*r*r for _,r in circles)


def build(request):
    from build123d import Face, Plane, Solid, Wire
    from OCP.BRepCheck import BRepCheck_Analyzer
    from OCP.BRepGProp import BRepGProp
    from OCP.GProp import GProp_GProps
    from importlib.metadata import version

    polygon, circles, area = profile(request['model'])
    depth = request['depth_mm']
    if area <= EPS or not 0.1 <= depth <= 1000:
        raise ValueError('Outside extrusion envelope')
    circular = [Wire.make_circle(r, Plane(origin=(*p,0))) for p,r in circles]
    outer = Wire.make_polygon([(*p,0) for p in polygon], close=True) if polygon else circular.pop(0)
    face = Face(outer, circular)
    if not BRepCheck_Analyzer(face.wrapped).IsValid() or not math.isclose(face.area, area, rel_tol=1e-8, abs_tol=1e-6):
        raise ValueError('Invalid native profile face')
    solid = Solid.extrude(face, (0,0,depth))
    if len(solid.solids()) != 1 or not BRepCheck_Analyzer(solid.wrapped).IsValid():
        raise ValueError('Invalid extruded BRep')
    props = GProp_GProps()
    BRepGProp.VolumeProperties_s(solid.wrapped, props, True, False, False)
    if not math.isclose(props.Mass(), area*depth, rel_tol=1e-8, abs_tol=1e-6):
        raise ValueError('Native volume mismatch')
    c = props.CentreOfMass()
    v,t = solid.tessellate(0.05, 0.1)
    vertices, triangles = [list(p) for p in v], [list(i) for i in t]
    if not vertices or not triangles or len(vertices)>100000 or len(triangles)>200000:
        raise ValueError('Mesh envelope')
    if not all(math.isfinite(x) for p in vertices for x in p) or any(len(set(i))!=3 or min(i)<0 or max(i)>=len(vertices) for i in triangles):
        raise ValueError('Invalid display mesh')
    return {'kind':'native-extrusion-mesh', 'version':1, 'units':'mm', 'feature_id':request['id'],
            'kernel':version('cadquery-ocp')+'/'+version('build123d'), 'brep_valid':True,
            'area_mm2':area, 'volume_mm3':props.Mass(), 'center_mm':[c.X(),c.Y(),c.Z()],
            'vertices':vertices,'triangles':triangles}


if __name__ == '__main__':
    data = sys.stdin.buffer.read(65537)
    if len(data)>65536:
        raise ValueError('Native request limit')
    try:
        result = {'ok':True,'mesh':build(json.loads(data))}
    except Exception as exc:
        result = {'ok':False,'error':str(exc)}
    payload = json.dumps(result,allow_nan=False,separators=(',',':')).encode()
    if len(payload)>512*1024:
        raise ValueError('Native result limit')
    sys.stdout.buffer.write(payload)
