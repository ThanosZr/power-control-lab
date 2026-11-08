'use strict';
// Python for the code block (3.3), with Pyodide (CPython in WebAssembly). The solver calls step() synchronously
// at the sample instants, so Pyodide runs in the page. The server runs the same code natively (engine/batch.py).
// The block's code defines
//   def init(p):          -> dict with the initial state (optional)
//   def step(t, u, s, p): -> outputs as dict {name: value}, list, number, or (outputs, s)
// u: inputs by name, s: state (persists between calls), p: parameters of the block plus Ts (sample period).
(function(root){
 const VERSION='0.26.4';
 const WRAP=`
import math
def __pcl_make(__src, __ins, __outs, __p):
    g = {"math": math, "__name__": "pcl_block"}
    exec(compile(__src, "<μπλοκ>", "exec"), g)
    step = g.get("step")
    if not callable(step):
        raise ValueError("ο κώδικας πρέπει να ορίζει συνάρτηση step(t, u, s, p)")
    p = dict(__p)
    init = g.get("init")
    st = init(p) if callable(init) else {}
    if st is None:
        st = {}
    box = [st]
    names_in, names_out = list(__ins), list(__outs)
    def call(t, uvals):
        u = dict(zip(names_in, list(uvals)))
        r = step(t, u, box[0], p)
        if isinstance(r, tuple) and len(r) == 2 and isinstance(r[1], dict):
            r, box[0] = r
        if isinstance(r, dict):
            return [float(r.get(k, 0.0)) for k in names_out]
        if isinstance(r, (list, tuple)):
            return [float(x) for x in r][:len(names_out)] + [0.0] * max(0, len(names_out) - len(r))
        return [float(r)] + [0.0] * (len(names_out) - 1)
    return call
`;
 // the last line of a Python traceback, with the line of the user's code when there is one
 function pyMessage(e){const s=String(e?.message||e);const lines=s.trim().split('\n');const last=lines[lines.length-1];const ln=[...s.matchAll(/File "<μπλοκ>", line (\d+)/g)].pop();return (ln?`γραμμή ${ln[1]}: `:'')+last;}
 const PyRT={ready:false,py:null,loading:null,error:null,version:VERSION,
  // browser: local copy in vendor/pyodide/ if present, else the CDN; Node: the pyodide npm package
  load(base){if(this.loading)return this.loading;
   this.loading=(async()=>{let loader;
    if(typeof window==='undefined'||typeof document==='undefined'){loader=require('pyodide').loadPyodide;this.py=await loader();}
    else{const urls=[base||'vendor/pyodide/',`https://cdn.jsdelivr.net/npm/pyodide@${VERSION}/`];let last;
     for(const u of urls){try{await new Promise((ok,bad)=>{if(window.loadPyodide)return ok();const s=document.createElement('script');s.src=u+'pyodide.js';s.onload=ok;s.onerror=()=>bad(new Error('δεν βρέθηκε '+u));document.head.appendChild(s);});
       this.py=await window.loadPyodide({indexURL:u});this.source=u;break;}catch(e){last=e;}}
     if(!this.py)throw last||new Error('Το Pyodide δεν φορτώθηκε.');}
    this.py.runPython(WRAP);this.makeFn=this.py.globals.get('__pcl_make');this.ready=true;return this;})().catch(e=>{this.error=e;this.loading=null;throw e;});
   return this.loading;},
  make(src,o){if(!this.ready)throw new Error('Η Python δεν έχει φορτωθεί.');let call;
   try{call=this.makeFn(String(src||''),o.ins,o.outs,this.py.toPy({...o.pars,Ts:o.Ts}));}catch(e){throw new Error(`${o.label}: ${pyMessage(e)}`);}
   return {step:(t,u)=>{let r;try{r=call(t,u);}catch(e){throw new Error(`${o.label} (t = ${t.toPrecision(6)} s): ${pyMessage(e)}`);}const a=r.toJs();r.destroy();return a;},
    destroy:()=>{try{call.destroy();}catch(e){}}};}};
 root.PyRT=PyRT;if(typeof module!=='undefined')module.exports=PyRT;
})(typeof window!=='undefined'?window:globalThis);
