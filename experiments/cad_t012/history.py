"""Schema-4 transactional edit, using the existing cancellable DAG replay."""
from experiments.cad_t009.history import History as Base
from experiments.cad_t010.history import fixed_polygon
from experiments.cad_t011.history import regenerate as replay
from experiments.cad_t012.contract import dependencies, validate


def sample():
    return {'schema': 4, 'units': 'mm', 'features': [
        {'id': 'profile', 'op': 'sketch',
         'model': fixed_polygon([(0, 0), (30, 0), (30, 20), (0, 20)])},
        {'id': 'block', 'op': 'extrude', 'profile': 'profile', 'depth_mm': 10},
        {'id': 'rounded', 'op': 'fillet', 'body': 'block',
         'edges': ['s:profile:side:p0'], 'radius_mm': 2},
        {'id': 'beveled', 'op': 'chamfer', 'body': 'block',
         'edges': ['s:profile:side:p0', 's:profile:side:p2'], 'distance_mm': 2}],
        'output': 'rounded'}


def regenerate(doc, previous, cancel):
    return replay(doc, previous, cancel, validator=validate, deps=dependencies,
                  schema=4, worker='experiments.cad_t012.worker')


class History(Base):
    _validate = staticmethod(validate)
    _regenerate = staticmethod(regenerate)
    _sample = staticmethod(sample)
