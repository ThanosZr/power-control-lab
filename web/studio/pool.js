'use strict';
// Parallel sweeps in the browser (3.15, ROADMAP §30 and §21): a pool of solver workers (sim_worker.js), one request
// each at a time. The app's bifurcation diagram uses it, and the "Σενάρια" panel's sweeps through the page
// (scenario_worker.js blocks on a SharedArrayBuffer until the pool answers, when the page is cross-origin isolated).
// 3.16: circuits with Python blocks too: each worker loads Python the first time it needs it (sim_worker.js).
(function(root){
 // as many workers as cores, up to 8 (the page and the panel's worker wait meanwhile)
 const SIZE=()=>Math.max(1,Math.min(8,(root.navigator&&navigator.hardwareConcurrency)||2));
 class SimPool{
  constructor(n,url){this.n=Math.max(1,n||SIZE());this.url=url||'studio/sim_worker.js';this.ws=[];this.seq=0;this.stopped=false;}
  ensure(){while(this.ws.length<this.n){const w=new Worker(this.url);w.busy=null;w.onmessage=e=>this.reply(w,e.data);w.onerror=e=>this.fail(w,e.message||'σφάλμα στον worker');this.ws.push(w);}}
  reply(w,m){const job=w.busy;w.busy=null;if(!job)return;if(m.error){const e=new Error(m.error);e.needPython=m.needPython;job.rej(e);}else job.res(m.out);this.next();}
  fail(w,msg){const job=w.busy;w.busy=null;this.ws=this.ws.filter(x=>x!==w);try{w.terminate();}catch(e){}if(job)job.rej(new Error(msg));this.next();}
  next(){for(const w of this.ws){if(w.busy||!this.queue.length)continue;const job=this.queue.shift();w.busy=job;w.postMessage({id:++this.seq,q:job.q});}}
  // the answers in the order of the requests; onDone(i, out, done, n) as each one arrives. An error rejects the whole map,
  // or with settle each answer is {out} or {error} (a sweep keeps going past a bad point)
  map(qs,onDone,settle){this.stopped=false;this.queue=this.queue||[];this.ensure();let done=0;const n=qs.length;
   const ps=qs.map((q,i)=>new Promise((res,rej)=>this.queue.push({q,
    res:out=>{done++;const r=settle?{out}:out;if(onDone)onDone(i,r,done,n);res(r);},
    rej:e=>{if(!settle||this.stopped)return rej(e);done++;const r={error:String(e&&e.message||e)};if(onDone)onDone(i,r,done,n);res(r);}})));
   this.next();return Promise.all(ps);}
  // terminates the workers (a stopped sweep); the next map starts new ones
  stop(){this.stopped=true;const q=this.queue||[];this.queue=[];for(const j of q)j.rej(new Error('Διακόπηκε.'));
   for(const w of this.ws){if(w.busy)w.busy.rej(new Error('Διακόπηκε.'));try{w.terminate();}catch(e){}}this.ws=[];}
 }
 const hasPython=pr=>(pr.components||[]).some(c=>c.type==='PY');
 const api={SimPool,SIZE,hasPython};
 root.Pool=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
