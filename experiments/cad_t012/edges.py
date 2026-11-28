"""Conservative BRep references, independent of OCCT enumeration and display mesh."""
from collections import defaultdict
from hashlib import sha256
import math

from experiments.cad_t009.history import encode
from experiments.cad_t011.contract import XY, world

MAX_EDGES = 128


def quant(v):
    """Canonical 10^-6 mm bins, not nearest-edge search."""
    return round(v * 1_000_000)


def xyz(v):
    return tuple(quant(x) for x in v)


def line(a, b):
    return ('line', *sorted((xyz(a), xyz(b))))


def circle(c, n, r):
    a = xyz(n)
    return ('circle', xyz(c), min(a, tuple(-x for x in a)), quant(r))


def signature(edge):
    from build123d import GeomType
    if edge.geom_type == GeomType.LINE and len(edge.vertices()) == 2:
        a, b = [tuple(v) for v in edge.vertices()]
        return line(a, b) if math.dist(a, b) > 1e-6 else None
    if edge.geom_type == GeomType.CIRCLE and edge.is_closed:
        if math.isclose(edge.length, 2 * math.pi * edge.radius, rel_tol=1e-8, abs_tol=1e-7):
            return circle(edge.arc_center, edge.normal(), edge.radius)
    return None


def extrusion_candidates(step, by_id, frames):
    """Map explicit sketch entity identities to expected native curves.

    Only direct extrusion has this semantic naming rule. Neither topology
    ordering nor proximity to a historical coordinate supplies identity.
    """
    if step['op'] != 'extrude':
        return {}
    sketch = by_id[step['profile']]
    frame = frames.get(sketch.get('plane'), XY)
    m = sketch['model']
    points = {p['id']: (p['x'], p['y']) for p in m['points']}
    depth = step['depth_mm']
    candidates = defaultdict(list)
    def pt(ident, z=0):
        return world(frame, (*points[ident], z))
    def add(sig, role, ident):
        candidates[sig].append(f"s:{sketch['id']}:{role}:{ident}")
    for ident in sorted({l[k] for l in m['lines'] for k in ('a', 'b')}):
        add(line(pt(ident), pt(ident, depth)), 'side', ident)
    for l in m['lines']:
        for z, role in ((0, 'base-line'), (depth, 'top-line')):
            add(line(pt(l['a'], z), pt(l['b'], z)), role, l['id'])
    for c in m['circles']:
        for z, role in ((0, 'base-circle'), (depth, 'top-circle')):
            add(circle(pt(c['center'], z), frame[3], c['radius']), role, c['id'])
    return candidates


def eligible(solid, step, by_id, frames):
    """Return (reference -> exact native edge, signature) for unique candidates.

    A seam with only one distinct incident face is never a candidate. Omit
    quantization collisions, topology ambiguities, unhandled curve types.
    """
    from OCP.TopAbs import TopAbs_EDGE, TopAbs_FACE
    from OCP.TopExp import TopExp
    from OCP.TopTools import TopTools_IndexedDataMapOfShapeListOfShape
    incidence = TopTools_IndexedDataMapOfShapeListOfShape()
    TopExp.MapShapesAndAncestors_s(solid.wrapped, TopAbs_EDGE, TopAbs_FACE, incidence)
    native = defaultdict(list)
    for edge in solid.edges():
        sig = signature(edge)
        if sig is not None:
            faces = []
            for face in incidence.FindFromKey(edge.wrapped):
                if not any(face.IsSame(other) for other in faces):
                    faces.append(face)
            # Include in collision detection even if not selectable.
            native[sig].append((edge, len(faces) == 2))
    semantic = extrusion_candidates(step, by_id, frames)
    result = {}
    for sig, matches in native.items():
        if len(matches) != 1 or not matches[0][1]:
            continue
        names = semantic.get(sig, ())
        if len(names) > 1:
            continue
        ref = names[0] if names else 'g:' + sha256(encode(sig).encode()).hexdigest()
        result[ref] = (matches[0][0], sig)
    if len(result) > MAX_EDGES:
        raise ValueError('Native edge catalogue exceeds 128 eligible edges')
    return result


def catalog(solid, step, by_id, frames):
    result = []
    for ref, (edge, sig) in sorted(eligible(solid, step, by_id, frames).items()):
        # The polyline is only a display aid; never used by the native builder.
        n = 1 if sig[0] == 'line' else 32
        points = [list(edge.position_at(i / n)) for i in range(n + 1)]
        if not all(math.isfinite(v) and abs(v) <= 1e6 for p in points for v in p):
            raise ValueError('Invalid edge display coordinates')
        result.append({'ref': ref, 'kind': sig[0], 'length_mm': edge.length,
                       'points': points})
    return result


def operate(step, source, by_id, frames, props):
    from build123d import Solid
    from OCP.BRepFilletAPI import BRepFilletAPI_MakeChamfer, BRepFilletAPI_MakeFillet
    from OCP.TopAbs import TopAbs_COMPOUND, TopAbs_SOLID
    from OCP.TopoDS import TopoDS, TopoDS_Iterator
    matches = eligible(source, by_id[step['body']], by_id, frames)
    if any(ref not in matches for ref in step['edges']):
        raise ValueError('Missing or ambiguous native edge reference; explicitly reselect on the source solid')
    edges = [matches[ref][0].wrapped for ref in sorted(step['edges'])]
    fillet = step['op'] == 'fillet'
    value = step['radius_mm' if fillet else 'distance_mm']
    maker = (BRepFilletAPI_MakeFillet if fillet else BRepFilletAPI_MakeChamfer)(source.wrapped)
    for edge in edges:
        maker.Add(value, edge)
    for edge in edges:
        contour = maker.Contour(edge)
        if contour <= 0:
            raise ValueError('Kernel did not accept selected edge')
        for i in range(1, maker.NbEdges(contour) + 1):
            if not any(maker.Edge(contour, i).IsSame(selected) for selected in edges):
                raise ValueError('Kernel contour extends beyond selected edges')
    maker.Build()
    if not maker.IsDone():
        raise ValueError(f"Native {step['op']} failed; check selected edges and size")
    shape = maker.Shape()
    # OCCT may wrap a single result in a compound. Unwrap only an exact
    # singleton (never silently drop additional solids or loose geometry).
    while not shape.IsNull() and shape.ShapeType() == TopAbs_COMPOUND:
        it = TopoDS_Iterator(shape)
        if not it.More():
            raise ValueError('Empty native result')
        only = it.Value()
        it.Next()
        if it.More():
            raise ValueError('Expected one native solid, not multiple shapes')
        shape = only
    if shape.IsNull() or shape.ShapeType() != TopAbs_SOLID:
        raise ValueError('Expected one native solid')
    solid = Solid(TopoDS.Solid_s(shape))
    before, after = props(source).Mass(), props(solid).Mass()
    if math.isclose(before, after, rel_tol=1e-10, abs_tol=1e-9):
        raise ValueError('Edge operation did not measurably change the solid')
    return solid
