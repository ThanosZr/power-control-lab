"""T010 demo using the same bounded loopback command API and retained WebGL viewport."""
import argparse
from http.server import HTTPServer

from experiments.cad_t009.server import Handler, PREFIX
from experiments.cad_t010.history import History

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port',type=int,default=8770)
    args=parser.parse_args()
    with HTTPServer(('127.0.0.1',args.port),Handler) as server:
        server.history=History()
        print(f'http://127.0.0.1:{server.server_port}{PREFIX}',flush=True)
        try: server.serve_forever()
        except KeyboardInterrupt: pass
