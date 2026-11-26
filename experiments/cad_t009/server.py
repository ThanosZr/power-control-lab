"""Loopback-only, serialized demonstration of the feature history API."""
import argparse
from http.server import HTTPServer
import json

from experiments.cad_t007.server import Handler as Base, ROOT, STATIC as PREVIOUS
from experiments.cad_t009.history import History, MAX_DOCUMENT

PREFIX='/experiments/cad_t009/'
STATIC={k:v for k,v in PREVIOUS.items() if '/cad_t006/' in k or k.endswith('/viewport.mjs')}
STATIC.update({PREFIX:('experiments/cad_t009/index.html','text/html; charset=utf-8'),
               PREFIX+'app.mjs':('experiments/cad_t009/app.mjs','text/javascript')})


class Handler(Base):
    def do_GET(self):
        if not self._local():
            return self._json(403,{'error':'Loopback origin required'})
        if self.path=='/api/state':
            return self._json(200,self.server.history.snapshot())
        if self.path not in STATIC:
            return self._json(404,{'error':'Not found'})
        path,mime=STATIC[self.path]
        self._send(200,(ROOT/path).read_bytes(),mime)

    def do_POST(self):
        if not self._local():
            return self._json(403,{'error':'Loopback origin required'})
        if self.path!='/api/command':
            return self._json(404,{'error':'Not found'})
        try:
            n=int(self.headers.get('Content-Length','0'))
            if self.headers.get_content_type()!='application/json' or not 0<n<=2*MAX_DOCUMENT:
                raise ValueError('Bounded JSON request required')
            data=json.loads(self.rfile.read(n)); action=data['action']; rev=data['revision']; h=self.server.history
            if action=='apply' and set(data)=={'action','revision','document'}:
                result=h.apply(data['document'],rev)
            elif action in ('undo','redo') and set(data)=={'action','revision'}:
                result=getattr(h,action)(rev)
            elif action=='open' and set(data)=={'action','revision','text'}:
                result=h.open_text(data['text'],rev)
            else:
                raise ValueError('Unsupported command')
        except (RuntimeError,ValueError,KeyError,TypeError,TimeoutError) as exc:
            return self._json(422,{'error':str(exc)})
        self._json(200,result)


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__); parser.add_argument('--port',type=int,default=8769)
    args=parser.parse_args(); history=History()
    with HTTPServer(('127.0.0.1',args.port),Handler) as server:
        server.history=history
        print(f'http://127.0.0.1:{server.server_port}{PREFIX}',flush=True)
        try: server.serve_forever()
        except KeyboardInterrupt: pass
