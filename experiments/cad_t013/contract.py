"""Schema 5: bounded native single-solid pattern, mirror and inward shell."""
import math
import re

from experiments.cad_t009.history import FeatureError
from experiments.cad_t011 import contract as common
from experiments.cad_t012 import contract as previous

PATTERNS = frozenset(('linear_pattern', 'circular_pattern'))
OPS = PATTERNS | {'mirror', 'shell'}
SOLIDS = previous.SOLIDS | OPS
FACE_REF = re.compile(r'(?:f:[0-9a-f]{64}|s:[A-Za-z][A-Za-z0-9_-]{0,63}:(?:base-face|top-face))')


def dependencies(f):
    if f['op'] == 'mirror':
        return [f['body'], f['plane']]
    if f['op'] in OPS:
        return [f['body']]
    return previous.dependencies(f)


def bounded_number(value, lo, hi):
    if type(value) not in (int, float) or not math.isfinite(value) or not lo <= value <= hi:
        raise ValueError(f'Expected finite number in [{lo}, {hi}]')


def fields_for(f, fields, ref, solids):
    op = f['op']
    if op in previous.EDGE_OPS:
        return previous.edge_fields(f, fields, ref, solids)
    required = {'id', 'op', 'body'}
    if op in PATTERNS:
        fields(required | {'count'} | ({'step'} if op == 'linear_pattern' else {'origin', 'axis', 'angle_deg'}))
        count = f['count']
        if type(count) is not int or not 2 <= count <= 8:
            raise ValueError('Pattern count must be an integer in [2, 8]')
        if op == 'linear_pattern':
            length = math.hypot(*common.vec(f['step']))
            bounded_number(length, .01, 1000)
        else:
            common.vec(f['origin']); common.unit(common.vec(f['axis']))
            bounded_number(f['angle_deg'], 1, 359)
            if (count-1)*f['angle_deg'] >= 360:
                raise ValueError('Circular pattern angles must be distinct within one turn')
    elif op == 'mirror':
        fields(required | {'plane'}); ref(f['plane'], {'plane'})
    else:
        fields(required | {'faces', 'thickness_mm'})
        faces = f['faces']
        if (not isinstance(faces, list) or not 1 <= len(faces) <= 4
                or any(not isinstance(x, str) or not FACE_REF.fullmatch(x) for x in faces)
                or len(set(faces)) != len(faces)):
            raise ValueError('Expected 1–4 distinct native planar face references')
        bounded_number(f['thickness_mm'], .01, 1000)
    ref(f['body'], solids)


def validate(doc):
    if isinstance(doc, dict) and type(doc.get('schema')) is int and doc['schema'] in (1,2,3,4):
        return previous.validate(doc)
    common.validate(doc, schema=5, extra_solids=previous.EDGE_OPS | OPS, extra_validate=fields_for)
    # Bound total copy operations in a full document separately from feature count.
    if sum(f['count']-1 for f in doc['features'] if f['op'] in PATTERNS) > 24:
        raise FeatureError('document', 'Pattern copy budget exceeds 24')
