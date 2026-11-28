"""Bounded native recipe worker. Exact BReps in the child; display triangles out."""
import json
import math
import sys
from importlib.metadata import version

from experiments.cad_t009.native import profile
from experiments.cad_t011.contract import (EPS, XY, cross, dependencies, dot, plane_frame,
                                           path_geometry, sub, unit, validate, world)


def build(request, *, validator=validate, deps=dependencies, schema=3,
          edge_ops=frozenset(), edge_operation=None, edge_catalog=None, face_catalog=None):
    from build123d import Axis, Edge, Face, Plane, Solid, Wire
    from OCP.BRepCheck import BRepCheck_Analyzer
    from OCP.BRepGProp import BRepGProp
    from OCP.BRepOffsetAPI import BRepOffsetAPI_MakePipe, BRepOffsetAPI_ThruSections
    from OCP.GProp import GProp_GProps
    from OCP.TopAbs import TopAbs_SOLID
    from OCP.TopoDS import TopoDS

    validator(request)
    if request['schema']!=schema:
        raise ValueError(f'Native worker requires resolved schema {schema} recipe')
    by_id={f['id']:f for f in request['features']}
    needed=set(); pending=[request['output']]
    while pending:
        ident=pending.pop()
        if ident not in needed:
            needed.add(ident); pending.extend(deps(by_id[ident]))
    if needed!=set(by_id): raise ValueError('Native recipe contains unrelated features')
    frames, paths, sketches, solids = {}, {}, {}, {}

    def props(solid):
        if not isinstance(solid,Solid) or not BRepCheck_Analyzer(solid.wrapped).IsValid():
            raise ValueError('Expected one valid native solid')
        p=GProp_GProps(); BRepGProp.VolumeProperties_s(solid.wrapped,p,True,False,False)
        if not math.isfinite(p.Mass()) or p.Mass()<=EPS:
            raise ValueError('Empty or zero-volume solid')
        return p

    def as_solid(maker):
        if not maker.IsDone(): raise ValueError('Native operation failed')
        shape=maker.Shape()
        if shape.IsNull() or shape.ShapeType()!=TopAbs_SOLID:
            raise ValueError('Expected one native solid, not a shell or compound')
        return Solid(TopoDS.Solid_s(shape))

    def build_profile(step):
        model=step['model']; f=frames.get(step.get('plane'),XY)
        # The history supplies a solved T008 model. Recheck the geometry envelope
        # in the native process before touching OCCT, even for a direct CLI request.
        if (set(model)!={'schema','points','lines','circles','constraints'} or model['schema']!=1
                or any(not isinstance(model[k],list) or len(model[k])>128 for k in ('points','lines','circles','constraints'))
                or 2*len(model['points'])+len(model['circles'])>64):
            raise ValueError('Invalid solved sketch envelope')
        for p in model['points']:
            if any(type(p[k]) not in (int,float) or not math.isfinite(p[k]) or abs(p[k])>10000 for k in ('x','y')):
                raise ValueError('Invalid solved sketch point')
        for c in model['circles']:
            if type(c['radius']) not in (int,float) or not 1e-6<c['radius']<=10000:
                raise ValueError('Invalid solved sketch radius')
        polygon,circles,area=profile(model)
        if area<=EPS: raise ValueError('Zero profile area')
        circular=[Wire.make_circle(r,Plane(origin=world(f,(*p,0)),x_dir=f[1],z_dir=f[3])) for p,r in circles]
        outer=Wire.make_polygon([world(f,(*p,0)) for p in polygon],close=True) if polygon else circular.pop(0)
        face=Face(outer,circular)
        if not BRepCheck_Analyzer(face.wrapped).IsValid() or not math.isclose(face.area,area,rel_tol=1e-8,abs_tol=1e-6):
            raise ValueError('Invalid native profile face')
        return f,polygon,circles,area,outer,circular,face

    def check_volume(solid,expected):
        if not math.isclose(props(solid).Mass(),expected,rel_tol=1e-7,abs_tol=1e-5):
            raise ValueError('Native volume mismatch')

    profile_cache={}
    def section(key):
        if key not in profile_cache: profile_cache[key]=build_profile(sketches[key])
        return profile_cache[key]

    for step in request['features']:
        op,ident=step['op'],step['id']
        try:
            if op=='plane':
                frames[ident]=plane_frame(step,frames.get(step.get('parent'),XY)); continue
            if op=='path':
                paths[ident]=path_geometry(step,frames.get(step.get('plane'),XY)); continue
            if op=='sketch': sketches[ident]=step; continue
            if op in ('extrude','revolve','sweep'):
                f,polygon,circles,area,outer,holes,face=section(step['profile'])
                if op=='extrude':
                    depth=step['depth_mm']; solid=Solid.extrude(face,tuple(depth*x for x in f[3]))
                    expected=area*depth
                elif op=='revolve':
                    if (polygon and min(p[0] for p in polygon)<=EPS) or any(p[0]-r<=EPS for p,r in circles):
                        raise ValueError('Revolve profile must lie strictly on positive X side of local Y axis')
                    if polygon:
                        moment=sum((a[0]+b[0])*(a[0]*b[1]-a[1]*b[0]) for a,b in zip(polygon,polygon[1:]+polygon[:1]))/6
                        moment-=sum(math.pi*r*r*p[0] for p,r in circles)
                    else:
                        p,r=circles[0]; moment=math.pi*r*r*p[0]
                    angle=step['angle_deg']; solid=Solid.revolve(face,angle,Axis(f[0],f[2]))
                    expected=math.radians(angle)*moment
                else:
                    points,tangent,radius,length=paths[step['path']]
                    if math.dist(points[0],f[0])>EPS or dot(tangent,f[3])<1-EPS:
                        raise ValueError('Path must start at sketch origin along positive normal')
                    edge=Edge.make_line(*points) if radius is None else Edge.make_three_point_arc(*points)
                    expected=area*length
                    if radius is not None:
                        # Conservative non-singular sweep: every profile point is
                        # inside the curvature radius, including circular holes.
                        extent=max([math.hypot(*p) for p in (polygon or [])]+[math.hypot(*p)+r for p,r in circles])
                        if extent>=radius-EPS: raise ValueError('Profile exceeds arc curvature radius')
                        normal=unit(cross(sub(points[1],points[0]),sub(points[2],points[0])))
                        outward=cross(tangent,normal)
                        p=GProp_GProps(); BRepGProp.SurfaceProperties_s(face.wrapped,p)
                        c=p.CentreOfMass(); offset=dot(sub((c.X(),c.Y(),c.Z()),f[0]),outward)
                        expected=area*(radius+offset)*length/radius
                    solid=as_solid(BRepOffsetAPI_MakePipe(Wire(edge).wrapped,face.wrapped))
                check_volume(solid,expected)
            elif op=='loft':
                sections=[section(key) for key in step['profiles']]
                first=sections[0]; f0=first[0]; n=f0[3]
                topology=len(first[1]) if first[1] else 0
                maker=BRepOffsetAPI_ThruSections(True,step['ruled'],EPS)
                maker.CheckCompatibility(True)
                last=-math.inf
                for f,poly,circles,area,outer,holes,face in sections:
                    if holes or (len(poly) if poly else 0)!=topology:
                        raise ValueError('Loft sections require matching polygon edge counts or single circles; no holes')
                    if dot(n,f[3])<1-EPS or dot(f0[1],f[1])<1-EPS:
                        raise ValueError('Loft requires parallel, consistently oriented section frames')
                    height=dot(sub(f[0],f0[0]),n)
                    if height<=last+EPS: raise ValueError('Loft sections must be strictly ordered along the frame normal')
                    last=height; maker.AddWire(outer.wrapped)
                maker.Build(); solid=as_solid(maker)
            elif op in edge_ops:
                source=solids[step['body']]
                solid=edge_operation(step,source,by_id,frames,props)
            else:
                left,right=solids[step['left']],solids[step['right']]
                a,b=props(left).Mass(),props(right).Mass()
                if op=='union': solid=left.fuse(right); lo,hi=max(a,b),a+b
                elif op=='subtract': solid=left.cut(right); lo,hi=max(0,a-b),a
                elif op=='intersect': solid=left.intersect(right); lo,hi=0,min(a,b)
                else: raise ValueError('Unsupported native operation')
                if isinstance(solid,list) and len(solid)==1: solid=solid[0]
                v=props(solid).Mass(); tol=max(1e-6,1e-8*(a+b))
                if not lo-tol<=v<=hi+tol: raise ValueError('Boolean volume violates set bounds')
            props(solid); solids[ident]=solid
        except Exception as exc:
            raise ValueError(f'{ident}: {exc}') from exc

    solid=solids[request['output']]; p=props(solid); c=p.CentreOfMass()
    v,t=solid.tessellate(.05,.1); vertices,triangles=[list(x) for x in v],[list(x) for x in t]
    if not vertices or not triangles or len(vertices)>100000 or len(triangles)>200000:
        raise ValueError('Mesh envelope')
    if (not all(math.isfinite(x) and abs(x)<=1e6 for point in vertices for x in point)
            or any(len(set(i))!=3 or min(i)<0 or max(i)>=len(vertices) for i in triangles)):
        raise ValueError('Invalid display mesh')
    result={'kind':'native-feature-mesh','version':1,'units':'mm','feature_id':request['output'],
            'kernel':version('cadquery-ocp')+'/'+version('build123d'),'brep_valid':True,
            'volume_mm3':p.Mass(),'center_mm':[c.X(),c.Y(),c.Z()], 'native_steps':len(solids),
            'recipe_steps':len(request['features']),'vertices':vertices,'triangles':triangles}
    if edge_catalog is not None:
        result['edges']=edge_catalog(solid,by_id[request['output']],by_id,frames)
    if face_catalog is not None:
        result['faces']=face_catalog(solid,by_id[request['output']],by_id,frames)
    return result


if __name__=='__main__':
    data=sys.stdin.buffer.read(65537)
    try:
        if len(data)>65536: raise ValueError('Native request limit')
        result={'ok':True,'mesh':build(json.loads(data))}
        payload=json.dumps(result,allow_nan=False,separators=(',',':')).encode()
        if len(payload)>512*1024: raise ValueError('Native result limit')
    except Exception as exc:
        payload=json.dumps({'ok':False,'error':str(exc)[:1000]},allow_nan=False).encode()
    sys.stdout.buffer.write(payload)
