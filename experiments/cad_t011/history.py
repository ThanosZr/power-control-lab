"""Schema-3 feature history on the T009 transaction engine, with native DAG recipes."""
import math
from hashlib import sha256
import sys
from time import monotonic

from experiments.cad_t009 import history as base
from experiments.cad_t011.contract import (XY, dependencies, path_geometry,
                                           plane_frame, validate)


def fixed_circle(radius=2, center=(0,0)):
    x,y=center
    return {'schema':1,'points':[{'id':'p','x':x,'y':y}], 'lines':[],
            'circles':[{'id':'c','center':'p','radius':radius}],
            'constraints':[{'id':'fixed','type':'fixed','point':'p','x':x,'y':y},
                           {'id':'radius','type':'radius','circle':'c','value':radius}]}


def arc_points(radius):
    q=math.sqrt(.5)
    return [[0,0,0],[radius*(1-q),0,radius*q],[radius,0,radius]]


def sample():
    return {'schema':3,'units':'mm','features':[
        {'id':'datum','op':'plane','origin':[0,0,0],'x':[1,0,0],'normal':[0,0,1]},
        {'id':'section','op':'sketch','plane':'datum','model':fixed_circle()},
        {'id':'spine','op':'path','kind':'arc','plane':'datum','points':arc_points(20)},
        {'id':'swept','op':'sweep','profile':'section','path':'spine'},
        {'id':'endPlane','op':'plane','parent':'datum','origin':[0,0,10],'x':[1,0,0],'normal':[0,0,1]},
        {'id':'endSection','op':'sketch','plane':'endPlane','model':fixed_circle(4)},
        {'id':'lofted','op':'loft','profiles':['section','endSection'],'ruled':True}], 'output':'swept'}


def regenerate(doc, previous, cancel, *, validator=validate, deps=dependencies,
               schema=3, worker='experiments.cad_t011.worker'):
    validator(doc)
    deadline=monotonic()+60
    cache,recipes,frames,rebuilt,reused={},{},{},[],[]
    for f in doc['features']:
        ident,op=f['id'],f['op']; base.check_cancel(cancel,deadline)
        # Dict insertion order preserves dependency-first order and eliminates
        # duplicate ancestors when several edges meet at a downstream feature.
        recipe={}
        for dep in deps(f): recipe.update(recipes[dep])
        recipe[ident]=f
        request={'schema':schema,'units':'mm','features':list(recipe.values()),'output':ident}
        key=base.encode(request)
        try:
            if len(key.encode())>base.MAX_DOCUMENT: raise ValueError('Resolved native recipe exceeds 64 KiB')
            if ident in previous and previous[ident][0]==key:
                value=previous[ident][1]; reused.append(ident)
            else:
                if op=='plane':
                    value={'frame':plane_frame(f,frames.get(f.get('parent'),XY))}
                elif op=='path':
                    p,t,r,length=path_geometry(f,frames.get(f.get('plane'),XY))
                    value={'points':p,'start_tangent':t,'radius_mm':r,'length_mm':length}
                elif op=='sketch':
                    result=base.invoke(['node',str(base.BRIDGE)],f['model'],cancel,deadline)
                    if not result['ok']: raise ValueError(result['diagnostics']['message'])
                    if result['diagnostics']['dof']!=0: raise ValueError('Profile requires a locally fully constrained sketch')
                    value={'model':result['model'],'diagnostics':result['diagnostics'],
                           'frame':frames.get(f.get('plane'),XY)}
                else:
                    result=base.invoke([sys.executable,'-m',worker],request,cancel,deadline)
                    if not result['ok']: raise ValueError(result['error'])
                    value=result['mesh']
                    if value['brep_valid'] is not True: raise ValueError('Invalid BRep')
                    # A revision-independent identity for the retained renderer,
                    # including on refresh after another client commits.
                    value['geometry_key']=sha256(key.encode()).hexdigest()
                rebuilt.append(ident)
            if op=='plane': frames[ident]=value['frame']
            if op=='sketch': recipe[ident]={**f,'model':value['model']}
            recipes[ident]=recipe; cache[ident]=(key,value)
        except (RuntimeError,ValueError,TimeoutError,KeyError,TypeError) as exc:
            raise base.FeatureError(ident,str(exc)) from exc
    base.check_cancel(cancel,deadline)
    return cache,{'rebuilt':rebuilt,'reused':reused}


class History(base.History):
    _validate=staticmethod(validate)
    _regenerate=staticmethod(regenerate)
    _sample=staticmethod(sample)
