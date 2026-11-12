'use strict';
// The live simulation in a worker (4.6): while ▶ runs, the solver works in its own thread (live_worker.js) and the page
// only draws, so zoom, pan, drag and the panels never wait for it, and the solver has a whole core.
//  - start(sim, {speed, stopT}): the solver's state as a snapshot (Sim.snapshot, 3.16) and the scope's buffers moved to
//    shared memory; from then on the page's Sim is a mirror: every tick of the worker sets its time, values, buffer heads,
//    switch states, S&H samples, events, live changes and notes.
//  - stop(): synchronous. The worker writes its final state into shared memory and the page waits for it (a few ms of
//    spinning: the worker steps in slices of 4 ms), then restores it into its own Sim: the run goes on from exactly there.
//  - While the worker runs, the page's Sim forwards live changes (setControl, setBlock, setHold, markChange, addProgram, and
//    load without fresh when the channels stay the same) and stops the worker first for anything else that needs the real
//    state (run, load that changes the channels, reset, setStep, setMethod, restoreSnapshot); the page starts
//    it again at the next frame.
// Not in a worker: without cross-origin isolation (no SharedArrayBuffer) or with the setting off (4.8: Python blocks too
// run in the worker, which loads Python itself). Then the solver runs in the page as before, with its share of each frame.
// 4.8: the live changes of one turn of the page (e.g. a load with the states and its mark on the scope) go to the worker
// as one numbered batch, applied there in one task, so they happen at the same instant of the run and replay the same as
// a program. The worker acknowledges the last batch it applied (ctl[3], and in every tick); a stop re-applies on the
// page the batches the worker had not applied yet, so a change right before a pause is never lost.
(function(root){
 const PULL=['run','load','reset','setStep','setMethod','restoreSnapshot'],FWD=['setControl','setBlock','setHold','markChange','addProgram','setRecord'];
 // the step checks (stepCheck, before a run, 3.13) look at the structure, the parameters and the switch states: on the
 // page's mirror while the worker runs, and their result (dgPre) stays on the page when the state comes back
 const L={active:false,epoch:0,off:false,why:'',sim:null,w:null,ctl:null,data:null,startSnap:null,onend:null,onerror:null,lastTick:0,seq:0,q:[],out:[]};
 L.supported=()=>typeof SharedArrayBuffer!=='undefined'&&!!root.crossOriginIsolated&&typeof Worker!=='undefined'&&typeof Atomics!=='undefined';
 // can this solver run in the worker
 // 4.8: also with Python blocks: the worker loads Python itself (their state moves as text, Sim.snapshot)
 L.eligible=sim=>{if(L.off){L.why='ρύθμιση';return false;}if(!L.supported()){L.why='χωρίς SharedArrayBuffer';return false;}
  if(!sim||!sim.net)return false;L.why='';return true;};
 function worker(){if(L.w)return L.w;const w=L.w=new Worker('studio/live_worker.js');
  w.onmessage=e=>{const m=e.data;if(m.epoch!==L.epoch||!L.active)return;
   if(m.type==='tick'){apply(m);return;}
   if(m.type==='end'){L.ended=true;L.onend?.();return;}
   if(m.type==='status'){L.python=m.python;L.onstatus?.(m);return;}
   if(m.type==='error'){L.error=m.message;L.errorStart=!!m.start;L.errorPy=!!m.py;L.onerror?.(m.message,!!m.start);}};
  w.onerror=e=>{if(!L.active)return;L.error=String(e.message||'worker');L.errorStart=true;L.onerror?.(L.error,true);};
  return w;}
 const share=a=>{if(a.buffer instanceof SharedArrayBuffer)return a;const b=new a.constructor(new SharedArrayBuffer(a.byteLength));b.set(a);return b;};
 function shareRec(sim){const r=sim.ring,p=sim.per;r.t=share(r.t);r.d=share(r.d);r.g=share(r.g);for(const k of ['t','avg','min','max','rms','end'])p[k]=share(p[k]);
  return {ring:{t:r.t,d:r.d,g:r.g,nch:r.nch,cap:r.cap,head:r.head,n:r.n},per:{t:p.t,avg:p.avg,min:p.min,max:p.max,rms:p.rms,end:p.end,nch:p.nch,cap:p.cap,head:p.head,n:p.n}};}
 // a tick of the worker into the page's mirror
 function apply(m){const s=L.sim;if(!s)return;L.lastTick=performance.now();
  for(const k of ['t','steps','h','hv','hMin','hMax','hCap','nRej','T','periodsDone','started'])s[k]=m[k];
  if(s.vals&&s.vals.length===m.vals.length)s.vals.set(m.vals);s.ring.head=m.rh;s.ring.n=m.rn;s.per.head=m.ph;s.per.n=m.pn;
  const els=s.net.els;if(m.on.length===els.length)for(let i=0;i<els.length;i++){const e=els[i];if('on' in e)e.on=!!m.on[i];}
  m.sh.forEach(([h,n,t,v],i)=>{const q=s.net.shs[i];if(!q)return;q.h=h;q.n=n;for(let j=0;j<t.length;j++){q.log.t.push(t[j]);q.log.v.push(v[j]);}if(q.log.t.length>60000){q.log.t.splice(0,10000);q.log.v.splice(0,10000);}});
  if(m.ev&&s.ev){s.ev.n=m.ev.n;s.ev.kinds=m.ev.kinds;for(const x of m.ev.add)s.ev.list.push(x);if(s.ev.list.length>s.ev.max*2)s.ev.list.splice(0,s.ev.list.length-s.ev.max);}
  if(m.changes)s.changes=m.changes;
  if(m.dg){s.dg=new Map(m.dg);s.dgVer=m.dgVer;}
  if(m.ack)L.out=L.out.filter(b=>b.seq>m.ack);
  L.limited=m.limited;}
 // the calls of one turn of the page, as one batch at the end of it
 function send(name,args){L.q.push({name,args:JSON.parse(JSON.stringify(args))});if(L.q.length===1)queueMicrotask(flush);}
 function flush(){if(!L.q.length)return;const list=L.q;L.q=[];if(!L.active)return;const seq=++L.seq;L.out.push({seq,list});L.w.postMessage({type:'calls',epoch:L.epoch,seq,list});}
 // a live change of parameters (load without fresh, the channels the same): the page loads its mirror and the worker loads
 // its own state, so the run goes on while a slider moves; anything that changes the channels stops the worker first
 function sameKeys(sim,project){try{const net=MNA.buildNetlist(project);return Object.getPrototypeOf(sim).channelKeys.call({net}).join('|')===sim.keys.join('|');}catch(e){return false;}}
 function wrap(sim){for(const k of PULL)sim[k]=function(...a){
   if(k==='load'&&!a[1]&&L.active&&L.sim===sim&&sameKeys(sim,a[0])){const r=Object.getPrototypeOf(sim).load.apply(sim,a);send('load',[a[0],false]);return r;}
   L.stop();return Object.getPrototypeOf(sim)[k].apply(sim,a);};
  for(const k of FWD)sim[k]=function(...a){const r=Object.getPrototypeOf(sim)[k].apply(sim,a);if(L.active&&L.sim===sim)send(k,a);return r;};}
 function unwrap(sim){for(const k of [...PULL,...FWD])delete sim[k];}
 L.start=(sim,{speed,stopT}={})=>{if(L.active)return true;if(!L.eligible(sim))return false;
  let snap,rec;try{rec=shareRec(sim);snap=sim.snapshot();}catch(e){L.why=String(e.message||e);return false;}
  // 4.8: at t = 0 with Python blocks that never ran (stand-ins on the page): the worker starts from its own build, with Python
  if(!(sim.t>0)&&sim.pyLazy?.())snap.pyFresh=true;
  // a new control block for every start (a loop of an older start may still be finishing); the data buffer grows as needed
  L.ctl=new Int32Array(new SharedArrayBuffer(16));
  if(!L.data){let d;try{d=new SharedArrayBuffer(1<<20,{maxByteLength:1<<30});}catch(e){d=null;}L.data=d&&d.growable?d:new SharedArrayBuffer(64<<20);}
  L.epoch++;L.sim=sim;L.active=true;L.ended=false;L.q=[];L.out=[];L.errorPy=false;L.python=null;L.error=null;L.errorStart=false;L.limited=false;L.startSnap={snap,rh:rec.ring.head,rn:rec.ring.n,ph:rec.per.head,pn:rec.per.n};
  worker().postMessage({type:'start',epoch:L.epoch,project:sim.project,snap,rec,ctl:L.ctl,data:L.data,speed,stopT});wrap(sim);return true;};
 L.speed=(speed,stopT)=>{if(L.active)L.w.postMessage({type:'speed',epoch:L.epoch,speed,stopT});};
 L.call=(name,...args)=>{if(L.active)send(name,args);};
 // back to the page: the worker's final state into the page's Sim (synchronous)
 L.stop=()=>{if(!L.active)return true;const sim=L.sim,c=L.ctl;const pend=[...L.out,...(L.q.length?[{seq:Infinity,list:L.q}]:[])];L.q=[];L.out=[];L.active=false;unwrap(sim);
  let got=null;
  if(Atomics.compareExchange(c,1,0,4)!==0){Atomics.store(c,0,1);const t0=performance.now();let st;
   while((st=Atomics.load(c,1))!==2&&st!==3){if(performance.now()-t0>4000)break;}
   if(st===2){try{const n=Atomics.load(c,2);got=JSON.parse(new TextDecoder().decode(new Uint8Array(L.data,0,n).slice()));}catch(e){got=null;}}
   if(!got&&!L.errorStart){L.off=true;L.why='ο worker δεν απάντησε';}}
  else got=L.startSnap; // stopped before it started: the page's state is the start
  const use=got||L.startSnap,pre=sim.dgPre;
  try{sim.restoreSnapshot(use.snap);}catch(e){}
  if(pre)sim.dgPre=pre;
  sim.ring.head=use.rh;sim.ring.n=use.rn;sim.per.head=use.ph;sim.per.n=use.pn;
  // the batches the worker had not applied (sent right before the stop, or not sent yet): on the page, in order
  const done=got&&got!==L.startSnap?Atomics.load(c,3):0;
  for(const b of pend)if(b.seq>done)for(const x of b.list){try{const f=Object.getPrototypeOf(sim)[x.name];if(typeof f==='function')f.apply(sim,x.args);}catch(e){}}
  L.epoch++;L.sim=null;L.startSnap=null;return !!got;};
 // a solver that is no longer used (a new build): the worker stops without waiting for its state
 L.drop=()=>{if(!L.active)return;const sim=L.sim;L.q=[];L.out=[];L.active=false;unwrap(sim);Atomics.store(L.ctl,0,1);Atomics.compareExchange(L.ctl,1,0,4);L.epoch++;L.sim=null;L.startSnap=null;};
 root.Live=L;
})(window);
