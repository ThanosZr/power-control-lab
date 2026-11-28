"""Bounded schema-5 native replay with the same BRep and mesh validation."""
import json
import sys

from experiments.cad_t011.worker import build as replay
from experiments.cad_t012.contract import EDGE_OPS
from experiments.cad_t012.edges import catalog as edge_catalog
from experiments.cad_t013.contract import OPS, dependencies, validate
from experiments.cad_t013.faces import catalog as face_catalog
from experiments.cad_t013.operations import operate


def build(request):
    return replay(request, validator=validate, deps=dependencies, schema=5,
                  edge_ops=EDGE_OPS | OPS, edge_operation=operate,
                  edge_catalog=edge_catalog, face_catalog=face_catalog)


if __name__ == '__main__':
    try:
        data = sys.stdin.buffer.read(65537)
        if len(data) > 65536:
            raise ValueError('Native request limit')
        payload = json.dumps({'ok': True, 'mesh': build(json.loads(data))},
                             allow_nan=False, separators=(',', ':')).encode()
        if len(payload) > 512 * 1024:
            raise ValueError('Native result limit')
    except Exception as exc:
        payload = json.dumps({'ok': False, 'error': str(exc)[:1000]}).encode()
    sys.stdout.buffer.write(payload)
