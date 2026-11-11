'use strict';
// One solver of the pool (3.15, ROADMAP §30 and §21): the app's solver in a worker, without a page.
// Answers the requests of web/studio/scenario.js (run, bifurcation, …) one at a time:
//   in:  {id, q}       out: {id, out} or {id, error}
// 3.16: a circuit with a Python block (PI + NN, inverse ANN, RL, own code) loads Python (Pyodide) in this worker the first
// time it needs it, so the AI comparisons run in the pool and not in the page.
self.window=self; // tutorials.js registers on window
importScripts('expr.js','parts.js','stepcheck.js','netlib.js','subcircuit.js','bus.js','units.js','pyrt.js','sparse.js','mna.js','metrics.js','tutorials.js','scenario.js');
const VERSION='0.26.4';let booting=null;
function python(){if(PyRT.ready)return Promise.resolve();if(booting)return booting;
 booting=(async()=>{const bases=['../vendor/pyodide/',`https://cdn.jsdelivr.net/npm/pyodide@${VERSION}/`];let last;
  for(const b of bases){try{if(!self.loadPyodide)importScripts(b+'pyodide.js');const py=await self.loadPyodide({indexURL:b});PyRT.attach(py,b);return;}catch(e){last=e;}}
  throw new Error('Δεν φορτώθηκε η Python (Pyodide) στον worker: '+(last&&last.message||last)+'. Χρειάζεται το τοπικό αντίγραφο (python tools/get_pyodide.py) ή σύνδεση στο internet.');})();
 booting.catch(()=>{booting=null;});return booting;}
self.onmessage=async e=>{const {id,q}=e.data;
 try{let out;try{out=Scenario.handle(q);}catch(x){if(!x.needPython)throw x;await python();out=Scenario.handle(q);}self.postMessage({id,out});}
 catch(x){self.postMessage({id,error:String(x&&x.message||x)});}};
