#!/usr/bin/env python3
"""Local-only HTTP application. No account, cloud, CDN, GPU or MATLAB required."""
import argparse
import json
import mimetypes
mimetypes.add_type('application/wasm','.wasm')   # Pyodide (Python block) compiles its WebAssembly while it downloads
import os
from pathlib import Path
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import BoundedSemaphore, Timer
import traceback
from urllib.parse import urlsplit, parse_qs
import webbrowser

from engine import __version__
from engine.analysis import steady, inverse, InputError
from engine.models import public_catalog
from engine.dynamics import linearize, switching
from engine.design import envelope, size_components
from engine.workbench import sweep,capacitance
from engine.problem import solve_problem
from engine.circuit import validated,recognize
from engine.curves import operating_curves
from engine.derivation import derive
from engine.proof import model_proof
from engine.boundary import solve_boundary
from engine.bidir import solve as bidir_solve
from engine.studio_math import studio_math
from engine.batch import batch_sim
from engine.templates import template_solve
from pcl.core import job as pcl_job, PclError, _pairs
from engine import addons as ADDONS

ROOT=Path(__file__).resolve().parent/'web'
PCL=Path(__file__).resolve().parent/'pcl'       # the pcl package, also for the app's "Σενάρια" panel (3.14)
SLOTS=BoundedSemaphore(2)
LINK=ADDONS.Link()      # 3.15: outside programs (Python, MATLAB) → the circuit open in the page
ACTIONS={'analyze':steady,'inverse':inverse,'linearize':linearize,
         'switching':switching,'envelope':envelope,'design':size_components,
         'sweep':sweep,'capacitance':capacitance,'problem':solve_problem,'curves':operating_curves,
         'derivation':derive,'model_proof':model_proof,'boundary':solve_boundary}
ACTIONS={key:validated(fn) for key,fn in ACTIONS.items()}
ACTIONS['validate_circuit']=recognize
# PE2 bidirectional converter (the /bidirectional/ app calls it as 'solve')
ACTIONS['solve']=bidir_solve
ACTIONS['bidir']=bidir_solve
# studio: analytic bundle from the drawn circuit
ACTIONS['studio_math']=studio_math
# studio: reference run with SciPy solve_ivp on the browser's netlist
ACTIONS['batch_sim']=batch_sim
# solution templates as data (pcl-template-1)
ACTIONS['template_solve']=template_solve
# 4.4: overhead line constants and the CP / FD line models (pcl/lineconst.py) for the part 'TLM'
def line_model(data):
    from pcl import lineconst
    try:
        return lineconst.api(data)
    except lineconst.LineError as e:
        raise InputError(str(e)) from e
ACTIONS['line_model']=line_model


# scripted scenarios (3.14, ROADMAP §30): the pcl package's job() for MATLAB/Octave (webwrite) and other tools,
# only on the server the user runs for himself, with a time limit per run and at most 400 points per sweep
def scenario(kind):
    def act(data):
        if not data.pop('_local',None):
            raise InputError('Τα σενάρια τρέχουν μόνο στον server που ξεκινάς εσύ (python run.py, διεύθυνση 127.0.0.1).')
        if kind=='sweep':
            o=data.get('sweep')
            if not isinstance(o,dict):
                raise InputError('Λείπει το sweep: {grid, measure, t_end}.')
            n=len(o['points']) if isinstance(o.get('points'),list) else 1
            for _,v in _pairs(o.get('grid'),'key','values'):
                n*=len(v) if isinstance(v,list) else 1
            if n>400:
                raise InputError(f'Πάνω από 400 σημεία ({n}): μίκρυνε τη σάρωση ή τρέξε την από τη γραμμή εντολών.')
            o['timeout']=min(float(o.get('timeout') or 120),120)
            o['workers']=min(int(o.get('workers') or 2),2)
        else:
            o=data.setdefault('run',{})
            if not isinstance(o,dict):
                raise InputError('Το run πρέπει να είναι αντικείμενο.')
            o['timeout']=min(float(o.get('timeout') or 120),120)
        try:
            return pcl_job(data,allow_paths=False)
        except PclError as e:
            raise InputError(str(e)) from e
    return act
ACTIONS['scenario_run']=scenario('run')
ACTIONS['scenario_sweep']=scenario('sweep')


class Handler(BaseHTTPRequestHandler):
    # 3.15: add-ons and the link only for this computer: a local client and a Host header of this computer (no DNS rebinding)
    def local(self):
        host=(self.headers.get('Host') or '').rsplit(':',1)[0].strip('[]').lower()
        return self.client_address[0] in ('127.0.0.1','::1') and host in ('127.0.0.1','localhost','::1')

    def alive(self):
        # the page that waits for a call is still connected (a closed connection reads as end of stream)
        import select,socket       # select + MSG_PEEK: the same on Windows (no MSG_DONTWAIT there)
        try:
            if not select.select([self.connection],[],[],0)[0]:
                return True
            return self.connection.recv(1,socket.MSG_PEEK)!=b''
        except (OSError,ValueError):
            return False

    def body(self,limit):
        size=int(self.headers.get('Content-Length','0'))
        if not 0<size<=limit:
            raise InputError('Μη έγκυρο μέγεθος αιτήματος.')
        data=json.loads(self.rfile.read(size))
        if not isinstance(data,dict):
            raise InputError('Απαιτείται αντικείμενο JSON.')
        return data

    def addon_get(self,path,query):
        if not self.local():
            self.send(403,{'error':'Μόνο από αυτόν τον υπολογιστή.'}); return
        if path=='/api/addons':
            self.send(200,{'addons':ADDONS.listing(),'user_dir':str(ADDONS.USER)}); return
        if path=='/api/presets':           # 3.15: the figure presets (pcl/presets/*.json), for the publication add-on
            out={}
            for f in sorted((PCL/'presets').glob('*.json')):
                out[f.stem]=json.loads(f.read_text(encoding='utf-8'))
            self.send(200,{'presets':out}); return
        if path=='/api/link/token':
            self.send(200,{'token':LINK.token,'connected':LINK.connected()}); return
        if path=='/api/link/knock':        # 3.15: a program asks while the link is closed (the page shows Αποδοχή / Απόρριψη)
            k=LINK.knock_next(25.0,self.alive)
            if k is None:
                self.send_response(204);self.send_header('Content-Length','0');self.send_header('Cache-Control','no-store');self.end_headers()
            else:
                self.send(200,k)
            return
        if path=='/api/link/next':
            if not LINK.ok(query.get('token',[''])[0]):
                self.send(403,{'error':'Λάθος token.'}); return
            c=LINK.next(25.0,self.alive)
            if c is None:
                self.send_response(204);self.send_header('Content-Length','0');self.send_header('Cache-Control','no-store');self.end_headers()
            else:
                self.send(200,c)
            return
        self.send(404,{'error':'Δεν βρέθηκε.'})

    def addon_post(self,action):
        if not self.local():
            self.send(403,{'error':'Μόνο από αυτόν τον υπολογιστή.'}); return
        try:
            data=self.body(30<<20)
            if action=='addon_install':
                self.send(200,ADDONS.install(data)); return
            if action=='addon_remove':
                self.send(200,ADDONS.remove(data)); return
            if action=='addon_activate':
                self.send(200,ADDONS.activate(data)); return
            if action=='link/deny':
                LINK.deny(data.get('id') or 0); self.send(200,{'ok':True}); return
            if not LINK.ok(data.get('token')):
                self.send(403,{'error':'Λάθος token (δες το ~/.pcl/link.json).'}); return
            if action=='link/reply':
                LINK.reply(data.get('id'),{k:data[k] for k in ('result','error') if k in data}); self.send(200,{'ok':True}); return
            if action=='link/call':
                t=float(data.get('timeout') or 120)
                a=LINK.call(data.get('method'),data.get('args') or {},t,client=data.get('client') or self.headers.get('User-Agent',''),knock_wait=min(60.0,t))
                self.send(400 if 'error' in a else 200,a); return
            self.send(404,{'error':'Άγνωστη ενέργεια.'})
        except TimeoutError as e:
            self.send(504,{'error':str(e)})
        except (ADDONS.AddonError,InputError,ValueError,TypeError) as e:
            self.send(400,{'error':str(e) or 'Μη έγκυρα δεδομένα.'})

    def send(self,status,body,kind='application/json; charset=utf-8'):
        if not isinstance(body,bytes):
            body=json.dumps(body,ensure_ascii=False,allow_nan=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type',kind)
        self.send_header('Content-Length',str(len(body)))
        self.send_header('Cache-Control','no-store')
        self.send_header('X-Content-Type-Options','nosniff')
        # cross-origin isolation (3.15): the panel's worker waits on a SharedArrayBuffer for the parallel sweeps of the page's pool.
        # credentialless, so the CDN copy of Pyodide still loads; a browser without it runs the sweeps in order
        self.send_header('Cross-Origin-Opener-Policy','same-origin')
        self.send_header('Cross-Origin-Embedder-Policy','credentialless')
        self.send_header('Content-Security-Policy',"default-src 'self'; script-src 'self' 'wasm-unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://cdn.jsdelivr.net; object-src 'none'; base-uri 'none'")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        u=urlsplit(self.path);path=u.path
        if path in ('/api/addons','/api/presets') or path.startswith('/api/link/'):
            self.addon_get(path,parse_qs(u.query)); return
        if path=='/api/health':
            self.send(200,{'ok':True,'version':__version__,'engine':'Python + SymPy + SciPy · browser MNA'})
        elif path=='/api/catalog':
            self.send(200,{'models':public_catalog()})
        elif path.startswith('/pcl/'):          # the pcl package's modules for the "Σενάρια" panel and the add-ons (3.14, 3.15)
            name=path[5:]
            if not (name.endswith('.py') and name.replace('_','').replace('.py','').isalpha() and name!='__main__.py') or not (PCL/name).is_file():
                self.send(404,{'error':'Δεν βρέθηκε.'}); return
            self.send(200,(PCL/name).read_bytes(),'text/x-python; charset=utf-8')
        else:
            relative=path.lstrip('/')
            if relative=='' or relative.endswith('/'):
                relative+='index.html'
            elif (ROOT/relative).is_dir():
                self.send_response(301);self.send_header('Location',path+'/');self.send_header('Content-Length','0');self.end_headers();return
            file=(ROOT/relative).resolve()
            if relative.startswith('addons/') and not file.is_file() and self.local():      # 3.15: the user's add-ons (~/.pcl/addons)
                file=ADDONS.user_file(relative[7:]) or file
                if file.is_file() and file.is_relative_to(ADDONS.USER.resolve()):
                    kind=mimetypes.guess_type(file)[0] or 'application/octet-stream'
                    self.send(200,file.read_bytes(),kind+'; charset=utf-8' if kind.startswith(('text/','application/javascript')) else kind); return
            if not file.is_relative_to(ROOT) or not file.is_file():
                self.send(404,{'error':'Δεν βρέθηκε.'})
                return
            kind=mimetypes.guess_type(file)[0] or 'application/octet-stream'
            self.send(200,file.read_bytes(),kind+'; charset=utf-8' if kind.startswith(('text/','application/javascript')) else kind)

    def do_POST(self):
        action=urlsplit(self.path).path.removeprefix('/api/')
        if action in ('addon_install','addon_remove','addon_activate','link/call','link/reply','link/deny'):
            if self.headers.get_content_type()!='application/json':
                self.send(415,{'error':'Απαιτείται application/json.'}); return
            self.addon_post(action); return
        if action=='record':               # 4.8: recording a long run to a file, only for this computer
            if not self.local():
                self.send(403,{'error':'Μόνο από αυτόν τον υπολογιστή.'}); return
            if self.headers.get_content_type()!='application/json':
                self.send(415,{'error':'Απαιτείται application/json.'}); return
            try:
                from engine import recording
                self.send(200,recording.handle(self.body(recording.MAX_CHUNK+65536)))
            except (InputError,ValueError,TypeError) as e:
                self.send(400,{'error':str(e) or 'Μη έγκυρα δεδομένα.'})
            return
        if action not in ACTIONS:
            self.send(404,{'error':'Άγνωστη ανάλυση.'}); return
        if self.headers.get_content_type()!='application/json':
            self.send(415,{'error':'Απαιτείται application/json.'}); return
        try:
            size=int(self.headers.get('Content-Length','0'))
            if not 0<size<=400000:
                raise InputError('Μη έγκυρο μέγεθος αιτήματος.')
            data=json.loads(self.rfile.read(size))
            if not isinstance(data,dict):
                raise InputError('Απαιτείται αντικείμενο JSON.')
            data.pop('_local',None)
            if action in ('batch_sim','scenario_run','scenario_sweep') and self.client_address[0] in ('127.0.0.1','::1'):
                data['_local']=True        # Python blocks of the request may run here (the user's own machine)
            # at most two analyses at a time; the others wait their turn (a slow machine queues, it does not fail)
            if not SLOTS.acquire(timeout=60):
                self.send(429,{'error':'Εκτελούνται ήδη δύο αναλύσεις για πάνω από ένα λεπτό. Δοκίμασε ξανά σε λίγο.'}); return
            try:
                result=ACTIONS[action](data)
            finally:
                SLOTS.release()
            self.send(200,result)
        except (InputError,ValueError,TypeError,OverflowError,ZeroDivisionError) as e:
            self.send(400,{'error':str(e) or 'Μη έγκυρα δεδομένα.'})
        except Exception:
            traceback.print_exc()
            self.send(500,{'error':'Εσωτερικό σφάλμα. Δείτε το terminal και κρατήστε το αρχείο έργου για αναπαραγωγή.'})


def main():
    parser=argparse.ArgumentParser(description='Power & Control Lab')
    parser.add_argument('--port',type=int,default=int(os.environ.get('PORT',8765)))
    parser.add_argument('--host',default='127.0.0.1')
    parser.add_argument('--no-browser',action='store_true')
    args=parser.parse_args()
    try:
        server=ThreadingHTTPServer((args.host,args.port),Handler)
    except OSError as exc:
        raise SystemExit(f'Cannot start server: {exc}. Try --port 8766.')
    url=f'http://127.0.0.1:{server.server_port}'
    print(f'Power & Control Lab {__version__} · {url}',flush=True)
    print('Stop: Ctrl+C. Keep this terminal open.',flush=True)
    LINK.write_file(url)            # 3.15: for pcl.link (Python) and pcl_link (MATLAB) on this computer
    if not args.no_browser:
        Timer(.8,lambda:webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__=='__main__':
    main()
