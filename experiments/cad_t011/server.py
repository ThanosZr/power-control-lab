"""Loopback-only CAD T011, one bounded mutation plus cooperative cancellation."""
import argparse
from http.server import ThreadingHTTPServer
import json
import re
from threading import Event, Lock

from experiments.cad_t007.server import Handler as Base, ROOT, STATIC as PREVIOUS
from experiments.cad_t009.history import MAX_DOCUMENT
from experiments.cad_t011.history import History

PREFIX='/experiments/cad_t011/'
STATIC={k:v for k,v in PREVIOUS.items() if '/cad_t006/' in k or k.endswith('/viewport.mjs')}
STATIC.update({PREFIX:('experiments/cad_t011/index.html','text/html; charset=utf-8'),
               PREFIX+'app.mjs':('experiments/cad_t011/app.mjs','text/javascript')})


class Server(ThreadingHTTPServer):
    static=STATIC
    def __init__(self,address,history=None):
        self.history=history if history is not None else History()
        self.guard=Lock(); self.active=None
        super().__init__(address,Handler)


class Handler(Base):
    def do_GET(self):
        if not self._local(): return self._json(403,{'error':'Loopback origin required'})
        if self.path=='/api/state': return self._json(200,self.server.history.snapshot())
        if self.path=='/api/activity':
            with self.server.guard:
                active=self.server.active
            return self._json(200,{'active':active[0] if active else None})
        if self.path not in self.server.static: return self._json(404,{'error':'Not found'})
        path,mime=self.server.static[self.path]; self._send(200,(ROOT/path).read_bytes(),mime)

    def do_POST(self):
        if not self._local(): return self._json(403,{'error':'Loopback origin required'})
        if self.path not in ('/api/command','/api/cancel'): return self._json(404,{'error':'Not found'})
        try:
            n=int(self.headers.get('Content-Length','0'))
            if self.headers.get_content_type()!='application/json' or not 0<n<=2*MAX_DOCUMENT:
                raise ValueError('Bounded JSON request required')
            data=json.loads(self.rfile.read(n)); token=data['request_id']
            if not isinstance(token,str) or not re.fullmatch(r'[A-Za-z0-9_-]{1,64}',token):
                raise ValueError('Invalid request ID')
            if self.path=='/api/cancel':
                if set(data)!={'request_id'}: raise ValueError('Unsupported cancel fields')
                with self.server.guard:
                    active=self.server.active
                    accepted=active is not None and active[0]==token
                    if accepted: active[1].set()
                return self._json(200,{'accepted':accepted})
            action=data['action']; rev=data['revision']; h=self.server.history
            common={'action','revision','request_id'}
            if ((action=='apply' and set(data)==common|{'document'}) or
                (action=='open' and set(data)==common|{'text'}) or
                (action in ('undo','redo') and set(data)==common)):
                with self.server.guard:
                    if self.server.active is not None: raise ValueError('Another mutation is active')
                    cancel=Event(); self.server.active=(token,cancel)
                try:
                    if action=='apply': result=h.apply(data['document'],rev,cancel)
                    elif action=='open': result=h.open_text(data['text'],rev,cancel)
                    else: result=getattr(h,action)(rev,cancel)
                finally:
                    with self.server.guard: self.server.active=None
            else: raise ValueError('Unsupported command')
        except (RuntimeError,ValueError,KeyError,TypeError,TimeoutError,RecursionError) as exc:
            return self._json(422,{'error':str(exc)})
        self._json(200,result)


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__); parser.add_argument('--port',type=int,default=8771)
    args=parser.parse_args()
    with Server(('127.0.0.1',args.port)) as server:
        print(f'http://127.0.0.1:{server.server_port}{PREFIX}',flush=True)
        try: server.serve_forever()
        except KeyboardInterrupt: pass
