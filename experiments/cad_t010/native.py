"""Exact, bounded OCCT operations in an isolated process; display mesh is output only."""
import json
import math
import sys

from experiments.cad_t009.native import EPS, profile


def build(request):
    from build123d import Axis, Face, Plane, Solid, Wire
    from OCP.BRepCheck import BRepCheck_Analyzer
    from OCP.BRepGProp import BRepGProp
    from OCP.GProp import GProp_GProps
    from importlib.metadata import version

    def props(solid):
        if not isinstance(solid,Solid) or not BRepCheck_Analyzer(solid.wrapped).IsValid():
            raise ValueError('Expected one valid native solid')
        p=GProp_GProps(); BRepGProp.VolumeProperties_s(solid.wrapped,p,True,False,False)
        if not math.isfinite(p.Mass()) or p.Mass()<=EPS:
            raise ValueError('Empty or zero-volume solid')
        return p

    def primitive(step):
        polygon,circles,area=profile(step['model'])
        if area<=EPS:
            raise ValueError('Zero profile area')
        if step['op']=='revolve':
            # A strictly positive radial cross section avoids self-intersection at the axis.
            if (polygon and min(p[0] for p in polygon)<=EPS) or any(p[0]-r<=EPS for p,r in circles):
                raise ValueError('Revolve profile must lie strictly on positive X side of Y axis')
            if polygon:
                edges=list(zip(polygon,polygon[1:]+polygon[:1]))
                moment=sum((a[0]+b[0])*(a[0]*b[1]-a[1]*b[0]) for a,b in edges)/6
                moment-=sum(math.pi*r*r*p[0] for p,r in circles)
            else:
                p,r=circles[0]; moment=math.pi*r*r*p[0]
        circular=[Wire.make_circle(r,Plane(origin=(*p,0))) for p,r in circles]
        outer=Wire.make_polygon([(*p,0) for p in polygon],close=True) if polygon else circular.pop(0)
        face=Face(outer,circular)
        if not BRepCheck_Analyzer(face.wrapped).IsValid() or not math.isclose(face.area,area,rel_tol=1e-8,abs_tol=1e-6):
            raise ValueError('Invalid native profile face')
        if step['op']=='extrude':
            depth=step['depth_mm']; solid=Solid.extrude(face,(0,0,depth)); expected=area*depth
        else:
            angle=step['angle_deg']; solid=Solid.revolve(face,angle,Axis.Y); expected=math.radians(angle)*moment
        if not math.isclose(props(solid).Mass(),expected,rel_tol=1e-8,abs_tol=1e-6):
            raise ValueError('Native primitive volume mismatch')
        return solid

    if not 1<=len(request['steps'])<=8:
        raise ValueError('Native recipe step limit')
    solids={}
    for step in request['steps']:
        op,ident=step['op'],step['id']
        try:
            if op in ('extrude','revolve'):
                solid=primitive(step)
            else:
                left,right=solids[step['left']],solids[step['right']]
                a,b=props(left).Mass(),props(right).Mass()
                if op=='union':
                    result=left.fuse(right); lo,hi=max(a,b),a+b
                elif op=='subtract':
                    result=left.cut(right); lo,hi=max(0,a-b),a
                elif op=='intersect':
                    result=left.intersect(right); lo,hi=0,min(a,b)
                else:
                    raise ValueError('Unsupported native operation')
                # No silent selection of a single body from multi-solid or lower-dimensional results.
                if isinstance(result,list) and len(result)==1:
                    result=result[0]
                solid=result; v=props(solid).Mass(); tol=max(1e-6,1e-8*(a+b))
                if not lo-tol<=v<=hi+tol:
                    raise ValueError('Boolean volume violates set bounds')
            props(solid); solids[ident]=solid
        except Exception as exc:
            raise ValueError(f'{ident}: {exc}') from exc
    solid=solids[request['output']]; p=props(solid); c=p.CentreOfMass()
    v,t=solid.tessellate(.05,.1); vertices,triangles=[list(x) for x in v],[list(x) for x in t]
    if not vertices or not triangles or len(vertices)>100000 or len(triangles)>200000:
        raise ValueError('Mesh envelope')
    if not all(math.isfinite(x) for q in vertices for x in q) or any(len(set(i))!=3 or min(i)<0 or max(i)>=len(vertices) for i in triangles):
        raise ValueError('Invalid display mesh')
    return {'kind':'native-feature-mesh','version':1,'units':'mm','feature_id':request['output'],
            'kernel':version('cadquery-ocp')+'/'+version('build123d'),'brep_valid':True,
            'volume_mm3':p.Mass(),'center_mm':[c.X(),c.Y(),c.Z()], 'native_steps':len(solids),
            'vertices':vertices,'triangles':triangles}


if __name__=='__main__':
    data=sys.stdin.buffer.read(65537)
    try:
        if len(data)>65536:
            raise ValueError('Native request limit')
        result={'ok':True,'mesh':build(json.loads(data))}
    except Exception as exc:
        result={'ok':False,'error':str(exc)}
    payload=json.dumps(result,allow_nan=False,separators=(',',':')).encode()
    if len(payload)>512*1024:
        raise ValueError('Native result limit')
    sys.stdout.buffer.write(payload)
