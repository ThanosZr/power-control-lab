"""Schema 3 definitions and pure, millimetre datum/path math (no native imports)."""
import math
import re

from experiments.cad_t009 import history as base
from experiments.cad_t010 import history as previous

EPS = 1e-7
XY = ((0., 0., 0.), (1., 0., 0.), (0., 1., 0.), (0., 0., 1.))
SOLIDS = previous.SOLIDS | {'sweep', 'loft'}
MAX_FEATURES = 16


def vec(v):
    if not isinstance(v, (list, tuple)) or len(v) != 3 or any(
        type(x) not in (int, float) or not math.isfinite(x) or abs(x) > 1e6 for x in v
    ):
        raise ValueError('Invalid bounded 3D vector')
    return tuple(float(x) for x in v)


def dot(a, b):
    return sum(x*y for x,y in zip(a,b))


def sub(a, b):
    return tuple(x-y for x,y in zip(a,b))


def cross(a, b):
    return (a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0])


def unit(a):
    length = math.sqrt(dot(a,a))
    if length <= EPS:
        raise ValueError('Degenerate direction')
    return tuple(x/length for x in a)


def world(f, p, direction=False):
    return vec(tuple((0 if direction else f[0][i])+sum(p[j]*f[j+1][i] for j in range(3)) for i in range(3)))


def plane_frame(f, parent=XY):
    o = world(parent, vec(f['origin']))
    u = unit(world(parent, vec(f['x']), True))
    n = unit(world(parent, vec(f['normal']), True))
    if abs(dot(u,n)) > EPS:
        raise ValueError('Plane X and normal must be perpendicular')
    v = unit(cross(n,u))
    return o, unit(cross(v,n)), v, n


def path_geometry(f, parent=XY):
    """A segment or one exact circular arc (<180 degrees). No polyline kinks/twist."""
    points = [world(parent,vec(p)) for p in f['points']]
    a,b = points[:2]
    if math.dist(a,b) <= EPS:
        raise ValueError('Degenerate path')
    if f['kind']=='line':
        return points, unit(sub(b,a)), None, math.dist(a,b)
    c = points[2]
    u,v = sub(b,a),sub(c,a)
    if min(math.dist(b,c),math.dist(a,c)) <= EPS:
        raise ValueError('Repeated arc point')
    n = cross(u,v); nn = dot(n,n)
    if nn <= EPS**2*dot(u,u)*dot(v,v):
        raise ValueError('Arc points must not be collinear')
    # Circumcentre relative to the start; the ordered triple fixes orientation.
    c1,c2 = cross(v,n),cross(n,u)
    offset = tuple((dot(u,u)*x+dot(v,v)*y)/(2*nn) for x,y in zip(c1,c2))
    radius = math.sqrt(dot(offset,offset))
    if not EPS < radius <= 1e6:
        raise ValueError('Arc radius outside envelope')
    axis = unit(n); r0 = unit(tuple(-x for x in offset)); r1 = unit(sub(v,offset))
    angle = math.atan2(dot(axis,cross(r0,r1)),dot(r0,r1))
    if angle < 0:
        angle += 2*math.pi
    if not EPS < angle <= math.pi+EPS:
        raise ValueError('Arc must span at most 180 degrees in point order')
    return points, unit(cross(axis,r0)), radius, radius*angle


def dependencies(f):
    op=f['op']
    if op=='plane': return [f['parent']] if 'parent' in f else []
    if op in ('sketch','path'): return [f['plane']] if 'plane' in f else []
    if op in ('extrude','revolve'): return [f['profile']]
    if op=='sweep': return [f['profile'],f['path']]
    if op=='loft': return f['profiles']
    return [f['left'],f['right']]


def validate(doc, *, schema=3, extra_solids=frozenset(), extra_validate=None):
    """Schema 1/2 keep their original closed contracts; schema 3 is opt-in."""
    if isinstance(doc,dict) and type(doc.get('schema')) is int and doc['schema'] in (1,2):
        return previous.validate(doc)
    if (not isinstance(doc,dict) or set(doc)!={'schema','units','features','output'}
            or type(doc['schema']) is not int or doc['schema']!=schema or doc['units']!='mm'
            or not isinstance(doc['features'],list) or not 1<=len(doc['features'])<=MAX_FEATURES):
        raise base.FeatureError('document','Unsupported schema or feature count')
    try:
        if len(base.encode(doc).encode())>base.MAX_DOCUMENT:
            raise ValueError('Document exceeds 64 KiB')
    except (TypeError,ValueError,RecursionError) as exc:
        raise base.FeatureError('document',str(exc)) from exc
    seen,frames={},{}
    for f in doc['features']:
        if not isinstance(f,dict) or not isinstance(f.get('id'),str) or not re.fullmatch(r'[A-Za-z][A-Za-z0-9_-]{0,63}',f['id']):
            raise base.FeatureError('document','Invalid feature ID')
        ident,op=f['id'],f.get('op')
        if ident in seen: raise base.FeatureError(ident,'Duplicate feature ID')
        def ref(key,kinds):
            if not isinstance(key,str) or seen.get(key) not in kinds:
                raise ValueError('Expected earlier '+ '/'.join(sorted(kinds))+' reference')
        def fields(required,optional=()):
            if not set(required)<=set(f) or not set(f)<=set(required)|set(optional):
                raise ValueError('Unsupported feature fields')
        try:
            if op=='plane':
                fields({'id','op','origin','x','normal'},{'parent'})
                if 'parent' in f: ref(f['parent'],{'plane'})
                frames[ident]=plane_frame(f,frames.get(f.get('parent'),XY))
            elif op in ('sketch','path'):
                fields({'id','op','model'} if op=='sketch' else {'id','op','kind','points'},{'plane'})
                if 'plane' in f: ref(f['plane'],{'plane'})
                if op=='sketch':
                    if not isinstance(f['model'],dict): raise ValueError('Expected sketch model')
                else:
                    if f['kind'] not in ('line','arc') or not isinstance(f['points'],list) or len(f['points'])!=(2 if f['kind']=='line' else 3):
                        raise ValueError('Path requires two line or three arc points')
                    path_geometry(f,frames.get(f.get('plane'),XY))
            elif op in ('extrude','revolve'):
                param='depth_mm' if op=='extrude' else 'angle_deg'
                fields({'id','op','profile',param}); ref(f['profile'],{'sketch'})
                val=f[param]; lo,hi=(.1,1000) if op=='extrude' else (1,360)
                if type(val) not in (int,float) or not math.isfinite(val) or not lo<=val<=hi:
                    raise ValueError(f'{param} outside [{lo}, {hi}]')
            elif op=='sweep':
                fields({'id','op','profile','path'}); ref(f['profile'],{'sketch'}); ref(f['path'],{'path'})
            elif op=='loft':
                fields({'id','op','profiles','ruled'})
                ids=f['profiles']
                if not isinstance(ids,list) or not 2<=len(ids)<=8 or type(f['ruled']) is not bool:
                    raise ValueError('Loft requires 2–8 ordered sections and a Boolean ruled flag')
                for k in ids: ref(k,{'sketch'})
                if len(set(ids))!=len(ids): raise ValueError('Distinct loft sections required')
            elif isinstance(op,str) and op in previous.BOOLEANS:
                fields({'id','op','left','right'}); ref(f['left'],SOLIDS|extra_solids); ref(f['right'],SOLIDS|extra_solids)
                if f['left']==f['right']: raise ValueError('Distinct solid references required')
            elif isinstance(op,str) and op in extra_solids:
                extra_validate(f,fields,ref,SOLIDS|extra_solids)
            else: raise ValueError('Unsupported operation')
        except (ValueError,TypeError,KeyError,OverflowError) as exc:
            raise base.FeatureError(ident,str(exc)) from exc
        seen[ident]=op
    if not isinstance(doc['output'],str) or seen.get(doc['output']) not in SOLIDS|extra_solids:
        raise base.FeatureError('document','Output must reference a solid')
