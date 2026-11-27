"""T011-A bounded native geometry: explicit datum frames and feature references."""
import math
from OCP.BRepBuilderAPI import BRepBuilderAPI_MakePolygon, BRepBuilderAPI_MakeFace
from OCP.BRepCheck import BRepCheck_Analyzer
from OCP.BRepGProp import BRepGProp
from OCP.BRepOffsetAPI import BRepOffsetAPI_MakePipe, BRepOffsetAPI_ThruSections
from OCP.GProp import GProp_GProps
from OCP.TopAbs import TopAbs_SOLID
from OCP.gp import gp_Pnt

EPS = 1e-7


def vec(v, n=3):
    if not isinstance(v, (list, tuple)) or len(v) != n or any(
        type(x) not in (int, float) or not math.isfinite(x) or abs(x) > 1e6 for x in v
    ):
        raise ValueError('Invalid bounded vector')
    return tuple(float(x) for x in v)


def dot(a, b):
    return sum(x*y for x, y in zip(a, b))


def unit(a):
    length = math.sqrt(dot(a, a))
    if length <= EPS:
        raise ValueError('Degenerate direction')
    return tuple(x/length for x in a)


def cross(a, b):
    return (a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0])


def frame(origin, x, normal):
    o, u, w = vec(origin), unit(vec(x)), unit(vec(normal))
    if abs(dot(u, w)) > EPS:
        raise ValueError('Plane x and normal must be perpendicular')
    v = unit(cross(w, u))
    return o, unit(cross(v, w)), v, w


def world(f, p, direction=False):
    o, *axes = f
    return tuple((0 if direction else o[i])+sum(p[j]*axes[j][i] for j in range(3)) for i in range(3))


def wire(points, closed):
    b = BRepBuilderAPI_MakePolygon()
    for p in points:
        b.Add(gp_Pnt(*p))
    if closed:
        b.Close()
    if not b.IsDone():
        raise ValueError('Invalid wire')
    return b.Wire()


def properties(shape):
    if shape.IsNull() or shape.ShapeType() != TopAbs_SOLID or not BRepCheck_Analyzer(shape).IsValid():
        raise ValueError('Expected one valid BRep solid')
    p = GProp_GProps()
    BRepGProp.VolumeProperties_s(shape, p, True, False, False)
    if not math.isfinite(p.Mass()) or p.Mass() <= EPS:
        raise ValueError('Nonpositive solid volume')
    c = p.CentreOfMass()
    return {'volume_mm3': p.Mass(), 'center_mm': [c.X(), c.Y(), c.Z()]}


def build(features, output):
    """Earlier IDs only; explicit datum references, not persistent topology naming."""
    if not isinstance(features, list) or not 1 <= len(features) <= 16:
        raise ValueError('Feature count limit')
    cache = {}

    def ref(key, kind):
        if not isinstance(key, str) or key not in cache or cache[key][0] != kind:
            raise ValueError('Missing or incompatible earlier feature reference')
        return cache[key][1]

    for s in features:
        i, op = s['id'], s['op']
        if not isinstance(i, str) or not i or len(i) > 64 or i in cache:
            raise ValueError('Invalid or duplicate feature ID')
        if op == 'plane':
            o, x, n = vec(s['origin']), vec(s['x']), vec(s['normal'])
            if 'parent' in s:
                parent = ref(s['parent'], 'plane')
                o, x, n = world(parent, o), world(parent, x, True), world(parent, n, True)
            value = frame(o, x, n)
        elif op == 'profile':
            f = ref(s['plane'], 'plane')
            pts = [vec(p, 2) for p in s['points']]
            if not 3 <= len(pts) <= 64 or len(set(pts)) != len(pts):
                raise ValueError('Invalid polygon size or duplicate vertices')
            w = wire([world(f, (*p, 0)) for p in pts], True)
            maker = BRepBuilderAPI_MakeFace(w)
            if not maker.IsDone() or not BRepCheck_Analyzer(maker.Face()).IsValid():
                raise ValueError('Invalid profile face')
            value = (w, maker.Face(), f)
        elif op == 'path':
            pts = [vec(p) for p in s['points']]
            # First increment is deliberately limited to one straight segment.
            if len(pts) != 2 or math.dist(*pts) <= EPS:
                raise ValueError('Expected nondegenerate two-point path')
            value = pts
        elif op == 'sweep':
            _, face, f = ref(s['profile'], 'profile')
            a, b = ref(s['path'], 'path')
            d = unit(tuple(y-x for x, y in zip(a, b)))
            if math.dist(a, f[0]) > EPS or dot(d, f[3]) < 1-EPS:
                raise ValueError('Path must start at plane origin along its positive normal')
            maker = BRepOffsetAPI_MakePipe(wire([a, b], False), face)
            if not maker.IsDone():
                raise ValueError('Native sweep failed')
            value = maker.Shape()
            properties(value)
        elif op == 'loft':
            ids = s['profiles']
            if not isinstance(ids, list) or not 2 <= len(ids) <= 8 or len(set(ids)) != len(ids):
                raise ValueError('Expected distinct ordered section references')
            sections = [ref(k, 'profile') for k in ids]
            maker = BRepOffsetAPI_ThruSections(True, True, EPS)
            maker.CheckCompatibility(True)
            for w, _, _ in sections:
                maker.AddWire(w)
            maker.Build()
            if not maker.IsDone():
                raise ValueError('Native ruled loft failed')
            value = maker.Shape()
            properties(value)
        else:
            raise ValueError('Unsupported operation')
        cache[i] = ('solid' if op in ('sweep', 'loft') else op, value)
    return properties(ref(output, 'solid'))
