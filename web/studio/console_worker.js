'use strict';
// 5.0.8 (ROADMAP §98, decision 372): the command line of the page, Pyodide in a worker of its own, with the variables kept
// between the commands (pcl/console.py, the same class as the kernel of the server). It loads the worker of the panel
// «Σενάρια» for the same Python (boot, GLUE: the solver of the page answers p.run, the pool of the page the sweeps), and keeps
// an interpreter of its own, so a command and a scenario do not wait for each other.
//   in:  {type:'exec', id, code, block, ctx} · {type:'complete'|'whos'|'reset'|'history', id, …} · {type:'put', name, bytes}
//   out: {type:'cready', version, interrupt} · {type:'res', id, result} · {type:'file', name, bytes} · and those of the
//        panel's worker: out, err, tick, progress, batch, batch-fetch
importScripts('scenario_worker.js');
const CDN=`https://cdn.jsdelivr.net/pyodide/v${VERSION}/full/`,HOME='/home/pyodide/console';
let con=null,starting=null,ibuf=null,stamps=new Map(),lock=null;
async function start(){if(con)return con;if(starting)return starting;
 starting=(async()=>{await boot();
  const r=await fetch('../pcl/console.py');if(!r.ok)throw new Error('Δεν βρέθηκε το pcl/console.py: η γραμμή εντολών θέλει τον server της εφαρμογής (python run.py).');
  py.FS.writeFile('/pcl_pkg/pcl/console.py',await r.text());py.FS.mkdirTree(HOME);py.FS.chdir(HOME);
  // Ctrl+C: with a SharedArrayBuffer (the page of run.py is cross-origin isolated) Python stops at the next instruction
  if(self.crossOriginIsolated&&typeof SharedArrayBuffer!=='undefined'){ibuf=new Uint8Array(new SharedArrayBuffer(1));py.setInterruptBuffer(ibuf);}
  py.runPython(`import json as _json, pcl.console as _pc
_PAGES = []
_CON = _pc.Console(page=lambda op, d=None: _PAGES.append({'op': op, **(d or {})}))
def _handle(s):
    _PAGES.clear()
    r = _CON.handle(_json.loads(s))
    r['page'] = list(_PAGES)
    return _json.dumps(r, ensure_ascii=False)
`);
  con=py.globals.get('_handle');for(const p of listFiles(HOME))stamps.set(p,py.FS.stat(p).mtime.valueOf());
  post({type:'cready',version:py.version,interrupt:!!ibuf,buf:ibuf});return con;})();
 try{return await starting;}catch(e){starting=null;throw e;}}

// numpy (np) and scipy when a command names them: from the local copy of Pyodide, else from its CDN with the packages
// they need (the local copy of tools/get_pyodide.py has only the interpreter)
async function packages(code){const want=[];if(/\bnp\b|\bnumpy\b/.test(code)&&!('numpy' in py.loadedPackages))want.push('numpy');
 if(/\bscipy\b/.test(code)&&!('scipy' in py.loadedPackages))want.push('scipy');if(!want.length)return;
 try{await py.loadPackage(want,{messageCallback:()=>{},errorCallback:()=>{}});}catch(e){}
 const miss=want.filter(n=>!(n in py.loadedPackages));
 if(miss.length){try{lock=lock||await (await fetch(py._base+'pyodide-lock.json')).json();const all=new Set(),add=n=>{const p=lock.packages[n];if(!p||all.has(n)||n in py.loadedPackages)return;all.add(n);(p.depends||[]).forEach(add);};miss.forEach(add);
   await py.loadPackage([...all].map(n=>CDN+lock.packages[n].file_name),{messageCallback:()=>{},errorCallback:()=>{}});}
  catch(e){post({type:'err',text:`Δεν φορτώθηκε το ${miss.join(', ')} (${e.message||e}): θέλει σύνδεση στο internet, ή τον πυρήνα του server.\n`});return;}}
 if('numpy' in py.loadedPackages)py.runPython('import numpy as _np\n_CON.ns.setdefault("np", _np)');}

// the files a command wrote or changed in its folder become downloads (save, r.save, open(...).write)
function newFiles(){for(const p of listFiles(HOME)){const m=py.FS.stat(p).mtime.valueOf();if(stamps.get(p)===m)continue;stamps.set(p,m);const b=py.FS.readFile(p);post({type:'file',name:p.slice(HOME.length+1),bytes:b},[b.buffer]);}}

self.onmessage=async e=>{const m=e.data;
 if(m.type==='batch-answer')return;
 try{const h=await start();
  if(m.type==='boot')return;
  if(m.type==='put'){const n=String(m.name||'').split(/[\\/]/).pop();if(!n)return;py.FS.writeFile(HOME+'/'+n,new Uint8Array(m.bytes));stamps.set(HOME+'/'+n,py.FS.stat(HOME+'/'+n).mtime.valueOf());post({type:'res',id:m.id,result:{put:n}});return;}
  if(m.type==='exec')await packages(String(m.code||''));
  if(ibuf)ibuf[0]=0;
  const req={op:m.type,code:m.code,block:!!m.block,ctx:m.ctx,text:m.text};
  const out=h(JSON.stringify(req));
  if(m.type==='exec')newFiles();
  post({type:'res',id:m.id,result:JSON.parse(out)});}
 catch(x){const msg=String(x&&x.message||x),i=msg.lastIndexOf('\n',msg.length-2);post({type:'res',id:m.id,result:{more:false,error:(i>0?msg.slice(i+1):msg).trim()}});}};
