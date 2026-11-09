'use strict';
// The "Σενάρια" panel (3.14, ROADMAP §30): Python scripts that drive the simulation, in a worker so the page does not freeze.
// Pyodide runs the pcl package itself (pcl/core.py, served by run.py at /pcl/), and its requests are answered here
// by web/studio/scenario.js with the app's solver. Messages:
//   in:  {type:'run', code, project, name}
//   out: {type:'ready'|'out'|'err'|'show'|'progress'|'file'|'done'|'error', ...}
self.window=self; // tutorials.js registers on window
importScripts('expr.js','parts.js','stepcheck.js','pyrt.js','mna.js','metrics.js','tutorials.js','scenario.js');
const VERSION='0.26.4';
let py=null,booting=null,project=null,lastTick=0;
const post=(m,tr)=>self.postMessage(m,tr||[]);

const GLUE=`
import json, os, sys, traceback
import pcl, pcl.core as _c
import pcl_host as _h

def _backend(q):
    try:
        return json.loads(_h.call(json.dumps(q)))
    except Exception as e:       # an error of the solver (JavaScript) comes back as the package's error, with its own text
        msg = str(e)
        raise _c.PclError(msg.split('Error: ', 1)[-1] if type(e).__name__ == 'JsException' else msg) from None
_c._backend = _backend
_c._progress_hook = lambda i, n: _h.progress(i, n)

def _show_hook(obj, title=None):
    if isinstance(obj, _c.Plot):
        d = {'type': 'xy', **obj}
    elif isinstance(obj, _c.SweepResult):
        d = {'type': 'sweep', 'params': obj.params, 'names': obj.names, 'rows': obj.rows}
    elif isinstance(obj, _c.Result):
        d = {'type': 'run', 'keys': obj.keys, 'units': [_c._unit(k) for k in obj.keys], 't': obj.t, 'ch': obj.ch, 'measure': obj.measured, 'meta': obj.meta}
    elif isinstance(obj, dict):
        d = {'type': 'table', 'cols': ['', ''], 'rows': [[str(k), v] for k, v in obj.items()]}
    elif isinstance(obj, (list, tuple)) and obj and all(isinstance(r, dict) for r in obj):
        cols = list(dict.fromkeys(k for r in obj for k in r))
        d = {'type': 'table', 'cols': cols, 'rows': [[r.get(c) for c in cols] for r in obj]}
    else:
        d = {'type': 'text', 'text': str(obj)}
    d['title'] = title
    _h.show(json.dumps(_c._clean(d), default=str))
    return obj
_c._show_hook = _show_hook

def _run_user(src, data, name):
    _c._default = _c.Project(json.loads(data), name=name or 'κύκλωμα')
    ns = {'__name__': '__main__', 'pcl': pcl, 'p': _c._default}
    try:
        exec(compile(src, '<σενάριο>', 'exec'), ns)
        return ''
    except BaseException as e:
        tb = traceback.extract_tb(e.__traceback__)
        lines = [f.lineno for f in tb if f.filename == '<σενάριο>']
        where = f'γραμμή {lines[-1]}: ' if lines else ''
        what = str(e) if isinstance(e, _c.PclError) else ''.join(traceback.format_exception_only(type(e), e)).strip()
        return where + what
`;

async function boot(){
 if(py)return py;if(booting)return booting;
 booting=(async()=>{const bases=['../vendor/pyodide/',`https://cdn.jsdelivr.net/npm/pyodide@${VERSION}/`];let last,py;
  for(const b of bases){try{if(!self.loadPyodide)importScripts(b+'pyodide.js');py=await self.loadPyodide({indexURL:b});py._base=b;break;}catch(e){last=e;}}
  if(!py)throw new Error('Δεν φορτώθηκε η Python (Pyodide): '+(last&&last.message||last)+'. Χρειάζεται το τοπικό αντίγραφο (python tools/get_pyodide.py) ή σύνδεση στο internet.');
  PyRT.attach(py,py._base); // the Python blocks of the circuits use the same interpreter
  py.FS.mkdirTree('/pcl_pkg/pcl');
  for(const f of ['__init__.py','core.py']){const r=await fetch('../pcl/'+f);if(!r.ok)throw new Error('Δεν βρέθηκε το pcl/'+f+': τα σενάρια θέλουν τον server της εφαρμογής (python run.py).');py.FS.writeFile('/pcl_pkg/pcl/'+f,await r.text());}
  py.runPython("import sys; sys.path.insert(0, '/pcl_pkg')");
  py.registerJsModule('pcl_host',{
   call:s=>{lastTick=0;return Scenario.json(Scenario.handle(JSON.parse(s),{tick:f=>{const n=Date.now();if(n-lastTick>200){lastTick=n;post({type:'tick',f});}}}));},
   progress:(i,n)=>post({type:'progress',i,n}),
   show:s=>post({type:'show',data:JSON.parse(s)})});
  py.setStdout({batched:s=>post({type:'out',text:s})});py.setStderr({batched:s=>post({type:'err',text:s})});
  py.runPython(GLUE);post({type:'ready',version:py.version});return py;})();
 try{py=await booting;return py;}catch(e){booting=null;throw e;}}

// the files the script wrote in its folder become downloads
function listFiles(dir){const out=[];for(const n of py.FS.readdir(dir)){if(n==='.'||n==='..')continue;const p=dir+'/'+n,st=py.FS.stat(p);if(py.FS.isDir(st.mode))out.push(...listFiles(p));else out.push(p);}return out;}

self.onmessage=async e=>{const m=e.data;if(m.type!=='run')return;
 try{await boot();
  const dir='/home/pyodide/scen'+Date.now();py.FS.mkdirTree(dir);py.FS.chdir(dir);
  const run=py.globals.get('_run_user'),t0=Date.now();
  let err;try{err=run(String(m.code||''),JSON.stringify(m.project),m.name||'');}finally{run.destroy();}
  for(const p of listFiles(dir)){const b=py.FS.readFile(p);post({type:'file',name:p.slice(dir.length+1),bytes:b},[b.buffer]);}
  if(err)post({type:'error',text:err});
  post({type:'done',ok:!err,wall:(Date.now()-t0)/1000});}
 catch(x){post({type:'error',text:String(x&&x.message||x)});post({type:'done',ok:false});}};
