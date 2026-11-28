"""Schema-5 document session on the existing optimistic transaction engine."""
from experiments.cad_t009.history import History as Base
from experiments.cad_t010.history import fixed_polygon
from experiments.cad_t011.history import regenerate as replay
from experiments.cad_t013.contract import dependencies, validate


def sample():
    return {'schema':5,'units':'mm','features':[
        {'id':'profile','op':'sketch','model':fixed_polygon([(0,0),(30,0),(30,20),(0,20)])},
        {'id':'block','op':'extrude','profile':'profile','depth_mm':10},
        {'id':'datum','op':'plane','origin':[0,0,0],'x':[0,1,0],'normal':[1,0,0]},
        {'id':'linear','op':'linear_pattern','body':'block','step':[25,0,0],'count':3},
        {'id':'circular','op':'circular_pattern','body':'block','origin':[0,0,0],'axis':[0,0,1],'angle_deg':90,'count':4},
        {'id':'reflected','op':'mirror','body':'block','plane':'datum'},
        {'id':'hollow','op':'shell','body':'block','faces':['s:profile:top-face'],'thickness_mm':2}],
        'output':'hollow'}


def regenerate(doc, previous, cancel):
    return replay(doc, previous, cancel, validator=validate, deps=dependencies,
                  schema=5, worker='experiments.cad_t013.worker')


class History(Base):
    _validate = staticmethod(validate)
    _regenerate = staticmethod(regenerate)
    _sample = staticmethod(sample)
