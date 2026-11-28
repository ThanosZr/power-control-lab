"""Isolated loopback demo, same transaction and cancellation API as T011."""
import argparse

from experiments.cad_t011.server import Server as Base, STATIC
from experiments.cad_t012.history import History

PREFIX = '/experiments/cad_t012/'


class Server(Base):
    static = {k: v for k, v in STATIC.items() if '/cad_t011/' not in k}
    static.update({
        PREFIX: ('experiments/cad_t011/index.html', 'text/html; charset=utf-8'),
        PREFIX + 'app.mjs': ('experiments/cad_t011/app.mjs', 'text/javascript'),
    })

    def __init__(self, address, history=None):
        super().__init__(address, History() if history is None else history)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8772)
    args = parser.parse_args()
    with Server(('127.0.0.1', args.port)) as server:
        print(f'http://127.0.0.1:{server.server_port}{PREFIX}', flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
