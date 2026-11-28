"""Exact OCCT transformations, connected body patterns and inward shell."""
import math

from experiments.cad_t011.contract import dot, sub, unit
from experiments.cad_t012.edges import operate as edge_operation
from experiments.cad_t012.contract import EDGE_OPS
from experiments.cad_t013.faces import eligible


def singleton(shape):
    from build123d import Solid
    from OCP.TopAbs import TopAbs_COMPOUND, TopAbs_SOLID
    from OCP.TopoDS import TopoDS, TopoDS_Iterator
    while not shape.IsNull() and shape.ShapeType() == TopAbs_COMPOUND:
        it = TopoDS_Iterator(shape)
        if not it.More(): raise ValueError('Empty native result')
        shape = it.Value(); it.Next()
        if it.More(): raise ValueError('Expected one connected native solid')
    if shape.IsNull() or shape.ShapeType() != TopAbs_SOLID:
        raise ValueError('Expected one connected native solid')
    return Solid(TopoDS.Solid_s(shape))


def transform(source, trsf, props):
    from OCP.BRepBuilderAPI import BRepBuilderAPI_Transform
    maker = BRepBuilderAPI_Transform(source.wrapped, trsf, True)
    if not maker.IsDone(): raise ValueError('Native transformation failed')
    solid = singleton(maker.Shape())
    if not math.isclose(props(solid).Mass(), props(source).Mass(), rel_tol=1e-8, abs_tol=1e-6):
        raise ValueError('Rigid transformation volume mismatch')
    return solid


def check_complexity(solid):
    if len(solid.faces()) > 256 or len(solid.edges()) > 512:
        raise ValueError('Native pattern/shell topology budget exceeded')


def operate(step, source, by_id, frames, props):
    from OCP.BRepAlgoAPI import BRepAlgoAPI_Fuse
    from OCP.BRepOffsetAPI import BRepOffsetAPI_MakeThickSolid
    from OCP.GeomAbs import GeomAbs_Intersection
    from OCP.TopTools import TopTools_ListOfShape
    from OCP.gp import gp_Ax1, gp_Ax2, gp_Dir, gp_Pnt, gp_Trsf, gp_Vec

    op = step['op']
    if op in EDGE_OPS:
        return edge_operation(step, source, by_id, frames, props)
    check_complexity(source)
    before = props(source).Mass()
    if op == 'mirror':
        origin, x, _, n = frames[step['plane']]
        trsf = gp_Trsf(); trsf.SetMirror(gp_Ax2(gp_Pnt(*origin), gp_Dir(*n), gp_Dir(*x)))
        result = transform(source, trsf, props)
        a, b = props(source).CentreOfMass(), props(result).CentreOfMass()
        c = (a.X(), a.Y(), a.Z()); offset = dot(sub(c,origin),n)
        expected = tuple(v-2*offset*d for v,d in zip(c,n))
        if math.dist(expected,(b.X(),b.Y(),b.Z())) > 1e-5:
            raise ValueError('Native mirror centroid mismatch')
        return result
    if op == 'shell':
        matches = eligible(source, by_id[step['body']], by_id, frames)
        if any(ref not in matches for ref in step['faces']):
            raise ValueError('Missing or ambiguous native face reference; explicitly reselect on source solid')
        removed = TopTools_ListOfShape()
        for ref in sorted(step['faces']): removed.Append(matches[ref].wrapped)
        maker = BRepOffsetAPI_MakeThickSolid()
        maker.MakeThickSolidByJoin(source.wrapped, removed, -step['thickness_mm'], 1e-7,
                                   Join=GeomAbs_Intersection)
        if not maker.IsDone(): raise ValueError('Native inward shell failed; check faces and thickness')
        solid = singleton(maker.Shape()); after = props(solid).Mass()
        if not 0 < after < before-max(1e-6,before*1e-10):
            raise ValueError('Inward shell must remove positive material volume')
        # Inward offset must not protrude beyond the source envelope.
        outer, inner = source.bounding_box(), solid.bounding_box()
        if any(a < b-1e-5 for a,b in zip(inner.min,outer.min)) or any(a > b+1e-5 for a,b in zip(inner.max,outer.max)):
            raise ValueError('Inward shell exceeds source envelope')
        check_complexity(solid)
        return solid
    if op not in ('linear_pattern','circular_pattern'):
        raise ValueError('Unsupported T013 operation')
    solid = source; volume = before
    for i in range(1, step['count']):
        trsf = gp_Trsf()
        if op == 'linear_pattern':
            trsf.SetTranslation(gp_Vec(*(i*x for x in step['step'])))
        else:
            axis = gp_Ax1(gp_Pnt(*step['origin']), gp_Dir(*unit(step['axis'])))
            trsf.SetRotation(axis, math.radians(i*step['angle_deg']))
        copy = transform(source, trsf, props)
        maker = BRepAlgoAPI_Fuse(solid.wrapped, copy.wrapped)
        if not maker.IsDone(): raise ValueError('Native pattern fuse failed')
        # Disconnected and redundant copies are explicit failures, not compounds.
        maker.SimplifyResult(True, True)
        solid = singleton(maker.Shape())
        after = props(solid).Mass(); tol = max(1e-6,1e-8*(volume+before))
        if not volume+tol < after <= volume+before+tol:
            raise ValueError('Pattern copy is redundant or violates union volume bounds')
        check_complexity(solid); volume = after
    return solid
