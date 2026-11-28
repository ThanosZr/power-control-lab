"""Native schema-4 replay; exact geometry stays in the bounded child."""
import json
import sys

from experiments.cad_t011.worker import build as replay
from experiments.cad_t012.contract import EDGE_OPS, dependencies, validate
from experiments.cad_t012.edges import catalog, operate


def build(request):
    return replay(request, validator=validate, deps=dependencies, schema=4,
                  edge_ops=EDGE_OPS, edge_operation=operate, edge_catalog=catalog)


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
