"""Isolated schema-2 feature history; downstream native recipes, never mesh booleans."""
import math
import re
import sys
from time import monotonic

from experiments.cad_t009 import history as base

SOLIDS = {'extrude', 'revolve', 'union', 'subtract', 'intersect'}
BOOLEANS = {'union', 'subtract', 'intersect'}


def fixed_polygon(points):
    vertices = [{'id': f'p{i}', 'x': x, 'y': y} for i, (x,y) in enumerate(points)]
    return {'schema':1, 'points':vertices, 'circles':[],
            'lines':[{'id':f'l{i}','a':f'p{i}','b':f'p{(i+1)%len(points)}'} for i in range(len(points))],
            'constraints':[{'id':f'f{i}','type':'fixed','point':v['id'],'x':v['x'],'y':v['y']} for i,v in enumerate(vertices)]}


def sample():
    return {'schema':2,'units':'mm','features':[
        {'id':'profile','op':'sketch','model':fixed_polygon([(10,0),(30,0),(30,20),(10,20)])},
        {'id':'body','op':'revolve','profile':'profile','angle_deg':360},
        {'id':'toolProfile','op':'sketch','model':fixed_polygon([(20,5),(35,5),(35,15),(20,15)])},
        {'id':'tool','op':'revolve','profile':'toolProfile','angle_deg':360},
        {'id':'result','op':'subtract','left':'body','right':'tool'}], 'output':'result'}


def validate(doc):
    if isinstance(doc,dict) and type(doc.get('schema')) is int and doc['schema']==1:
        base.validate(doc)
        return
    if (not isinstance(doc,dict) or set(doc)!={'schema','units','features','output'}
            or type(doc['schema']) is not int or doc['schema']!=2 or doc['units']!='mm'
            or not isinstance(doc['features'],list) or not 1<=len(doc['features'])<=8):
        raise base.FeatureError('document','Unsupported schema or feature count')
    if len(base.encode(doc).encode())>base.MAX_DOCUMENT:
        raise base.FeatureError('document','Document exceeds 64 KiB')
    seen={}
    for f in doc['features']:
        if not isinstance(f,dict) or not isinstance(f.get('id'),str) or not re.fullmatch(r'[A-Za-z][A-Za-z0-9_-]{0,63}',f['id']):
            raise base.FeatureError('document','Invalid feature ID')
        ident,op=f['id'],f.get('op')
        if ident in seen:
            raise base.FeatureError(ident,'Duplicate feature ID')
        if op=='sketch' and set(f)=={'id','op','model'} and isinstance(f['model'],dict):
            pass
        elif op in ('extrude','revolve'):
            param='depth_mm' if op=='extrude' else 'angle_deg'
            if set(f)!={'id','op','profile',param} or not isinstance(f['profile'],str) or seen.get(f['profile'])!='sketch':
                raise base.FeatureError(ident,'Expected earlier sketch dependency and exact parameter fields')
            v=f[param]; lo,hi=(.1,1000) if op=='extrude' else (1,360)
            if type(v) not in (int,float) or not math.isfinite(v) or not lo<=v<=hi:
                raise base.FeatureError(ident,f'{param} outside [{lo}, {hi}]')
        elif isinstance(op,str) and op in BOOLEANS:
            if set(f)!={'id','op','left','right'} or any(not isinstance(f[k],str) or seen.get(f[k]) not in SOLIDS for k in ('left','right')) or f['left']==f['right']:
                raise base.FeatureError(ident,'Expected two distinct earlier solid dependencies')
        else:
            raise base.FeatureError(ident,'Unsupported feature or fields')
        seen[ident]=op
    if not isinstance(doc['output'],str) or seen.get(doc['output']) not in SOLIDS:
        raise base.FeatureError('document','Output must reference a solid')


def regenerate(doc, previous, cancel):
    validate(doc)
    deadline=monotonic()+60
    cache,recipes,rebuilt,reused={}, {}, [], []
    for f in doc['features']:
        ident,op=f['id'],f['op']; base.check_cancel(cancel,deadline)
        if op=='sketch':
            request=f
        elif op in ('extrude','revolve'):
            recipe={ident:{**f,'model':cache[f['profile']][1]['model']}}
            recipes[ident]=recipe
            request={'output':ident,'steps':list(recipe.values())}
        else:
            # Merge shared ancestors once; each plan has deterministic topological order.
            recipe={**recipes[f['left']],**recipes[f['right']],ident:f}
            recipes[ident]=recipe
            request={'output':ident,'steps':list(recipe.values())}
        key=base.encode(request)
        if ident in previous and previous[ident][0]==key:
            cache[ident]=previous[ident]; reused.append(ident); continue
        try:
            if op=='sketch':
                result=base.invoke(['node',str(base.BRIDGE)],f['model'],cancel,deadline)
                if not result['ok']:
                    raise ValueError(result['diagnostics']['message'])
                if result['diagnostics']['dof']!=0:
                    raise ValueError('Profile requires a locally fully constrained sketch')
                value={'model':result['model'],'diagnostics':result['diagnostics']}
            else:
                if len(key.encode())>base.MAX_DOCUMENT:
                    raise ValueError('Resolved native recipe exceeds 64 KiB')
                result=base.invoke([sys.executable,'-m','experiments.cad_t010.native'],request,cancel,deadline)
                if not result['ok']:
                    raise ValueError(result['error'])
                value=result['mesh']
                if value['brep_valid'] is not True:
                    raise ValueError('Invalid BRep')
        except (RuntimeError,ValueError,TimeoutError) as exc:
            raise base.FeatureError(ident,str(exc)) from exc
        cache[ident]=(key,value); rebuilt.append(ident)
    base.check_cancel(cancel,deadline)
    return cache,{'rebuilt':rebuilt,'reused':reused}


class History(base.History):
    _validate=staticmethod(validate)
    _regenerate=staticmethod(regenerate)
    _sample=staticmethod(sample)
