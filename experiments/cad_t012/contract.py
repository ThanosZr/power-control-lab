"""Schema 4: typed native edge operations on an earlier solid."""
import math
import re

from experiments.cad_t011 import contract as previous

EDGE_OPS = frozenset(('fillet', 'chamfer'))
SOLIDS = previous.SOLIDS | EDGE_OPS
REF = re.compile(r'(?:g:[0-9a-f]{64}|s:[A-Za-z][A-Za-z0-9_-]{0,63}:(?:side|base-line|top-line|base-circle|top-circle):[A-Za-z][A-Za-z0-9_-]{0,39})')


def dependencies(f):
    return [f['body']] if f['op'] in EDGE_OPS else previous.dependencies(f)


def edge_fields(f, fields, ref, solids):
    key = 'radius_mm' if f['op'] == 'fillet' else 'distance_mm'
    fields({'id', 'op', 'body', 'edges', key})
    ref(f['body'], solids)
    edges = f['edges']
    if (not isinstance(edges, list) or not 1 <= len(edges) <= 16
            or any(not isinstance(e, str) or not REF.fullmatch(e) for e in edges)
            or len(set(edges)) != len(edges)):
        raise ValueError('Expected 1–16 distinct native edge references')
    val = f[key]
    if type(val) not in (int, float) or not math.isfinite(val) or not .01 <= val <= 1000:
        raise ValueError(f'{key} outside [0.01, 1000]')


def validate(doc):
    if isinstance(doc, dict) and type(doc.get('schema')) is int and doc['schema'] == 3:
        return previous.validate(doc)
    return previous.validate(doc, schema=4, extra_solids=EDGE_OPS, extra_validate=edge_fields)
