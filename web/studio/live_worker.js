'use strict';
// The live simulation in its own thread (4.6): while ▶ runs, this worker steps the solver and the page only draws. The
// state comes from the page as a snapshot (Sim.snapshot, 3.16) and goes back the same way; the buffers of the scope (ring,
// per) are shared memory (SharedArrayBuffer), written here and read by the page without copies. Protocol (web/studio/live.js):
//  in   {type:'start', epoch, project, snap, rec:{ring, per}, ctl, data, speed, stopT}
//       {type:'call', epoch, name, args}       a live change (setControl, setBlock, setHold, markChange, addProgram, dgClear)
//       {type:'speed', epoch, speed, stopT}
//  out  {type:'tick', epoch, …}                 about every 15 ms: what the page shows (time, values, heads of the buffers, …)
//       {type:'end', epoch}                     the run reached the end of its range (the final state is already written)
//       {type:'error', epoch, message}
//  ctl (Int32Array on a SharedArrayBuffer): [0] = 1 when the page asks to stop, [1] = 0 waiting, 1 running, 2 final state
//  written, 3 failed, 4 aborted before the start; [2] = bytes of the final state in data (JSON of {snap, rh, rn, ph, pn}).
//  The page waits for [1] = 2 by spinning (a few ms: the solver works in slices of 4 ms and looks at [0] after each).
self.window=self;
importScripts('expr.js','parts.js','stepcheck.js','netlib.js','subcircuit.js','bus.js','units.js','pyrt.js','sparse.js','mna.js','linemodels.js');
let sim=null,R=null;
const enc=new TextEncoder(),mc=new MessageChannel();mc.port1.onmessage=e=>loop(e.data);
// R: the current run {id, epoch, ctl, data, speed, stopT, …}; a loop of an older run finds another R and ends
const later=(r,fast)=>{if(fast)mc.port2.postMessage(r.id);else setTimeout(()=>loop(r.id),4);};
// the final state into the shared buffer, for the page that waits for it
function final(r){const o={snap:sim.snapshot(),rh:sim.ring.head,rn:sim.ring.n,ph:sim.per.head,pn:sim.per.n};const b=enc.encode(JSON.stringify(o)),d=r.data;
 if(d.byteLength<b.length){if(d.growable&&d.maxByteLength>=b.length)d.grow(b.length);else{Atomics.store(r.ctl,1,3);return false;}}
 new Uint8Array(d,0,b.length).set(b);Atomics.store(r.ctl,2,b.length);Atomics.store(r.ctl,1,2);return true;}
function finish(r){r.running=false;try{final(r);}catch(e){Atomics.store(r.ctl,1,3);}}
// what the page draws: time and step, the values of all channels, the heads of the shared buffers, switch states (live
// values on the schematic), the new samples of the S&H blocks, events and live changes since the last tick, the notes
function tick(r){const s=sim,sent=r.sent;r.lastTick=performance.now();const els=s.net.els,on=new Uint8Array(els.length);for(let i=0;i<els.length;i++)on[i]=els[i].on?1:0;
 const m={type:'tick',epoch:r.epoch,t:s.t,steps:s.steps,h:s.h,hv:s.hv,hMin:s.hMin,hMax:s.hMax,hCap:s.hCap,nRej:s.nRej,T:s.T,periodsDone:s.periodsDone,started:s.started,
  vals:s.vals.slice(),rh:s.ring.head,rn:s.ring.n,ph:s.per.head,pn:s.per.n,on,limited:r.lim};
 m.sh=s.net.shs.map((q,i)=>{const k=q.n-(sent.sh[i]||0);sent.sh[i]=q.n;const L=q.log.t.length,c=Math.min(k,L);return [q.h,q.n,c>0?q.log.t.slice(L-c):[],c>0?q.log.v.slice(L-c):[]];});
 const E=s.ev;if(E){const k=E.n-sent.ev;sent.ev=E.n;const c=Math.min(k,E.list.length);m.ev={n:E.n,kinds:E.kinds,add:c>0?E.list.slice(E.list.length-c):[]};}
 const C=s.changes||[];if(C.length!==sent.chN||(C.length&&C[C.length-1]!==sent.chLast)){sent.chN=C.length;sent.chLast=C[C.length-1];m.changes=C;}
 if(s.dgVer!==sent.dgVer||r.lastTick-sent.dgT>250){sent.dgVer=s.dgVer;sent.dgT=r.lastTick;m.dg=s.dg?[...s.dg]:[];m.dgVer=s.dgVer;}
 self.postMessage(m);r.lim=false;}
function loop(id){const r=R;if(!r||r.id!==id||!r.running)return;
 if(Atomics.load(r.ctl,0)===1){finish(r);return;}
 const now=performance.now(),dt=Math.min(.1,(now-r.last)/1000);r.last=now;
 let want=r.speed==='max'?1e9:dt*r.speed*sim.T;if(r.stopT>0)want=Math.min(want,r.stopT-sim.t);
 const t0=sim.t;let busy=false;
 if(want>0){try{sim.run(want,Infinity,now+4);}catch(e){tick(r);finish(r);self.postMessage({type:'error',epoch:r.epoch,message:String(e&&e.message||e)});return;}
  if(r.speed!=='max'&&sim.t-t0<want*.98)r.lim=true;busy=performance.now()-now>1;}
 if(performance.now()-r.lastTick>=15)tick(r);
 if(r.stopT>0&&sim.t>=r.stopT-1e-12){tick(r);finish(r);self.postMessage({type:'end',epoch:r.epoch});return;}
 // a slow circuit keeps the thread busy (slices of 4 ms, messages in between); a fast one waits 4 ms between slices
 later(r,busy||r.speed==='max');}
let runs=0;
function start(m){if(R)R.running=false;const r={id:++runs,epoch:m.epoch,ctl:m.ctl,data:m.data,speed:m.speed,stopT:m.stopT||0,running:false,last:0,lastTick:0,lim:false};R=r;
 // always a new solver of the project, then the state (as MNA.resume): a solver used before keeps fields that a snapshot
 // of a fresh one does not have, and the run would differ
 sim=null;sim=new MNA.Sim(m.project,{...m.snap.opts});sim.method=m.snap.method||sim.method;sim.restoreSnapshot(m.snap);
 const A=m.rec.ring,Q=m.rec.per;if(sim.keys.length!==A.nch||sim.per.nch!==Q.nch)throw new Error('Άλλα κανάλια στον worker ('+sim.keys.length+' αντί για '+A.nch+').');
 sim.ring={t:A.t,d:A.d,g:A.g,nch:A.nch,cap:A.cap,head:A.head,n:A.n};sim.per={t:Q.t,avg:Q.avg,min:Q.min,max:Q.max,rms:Q.rms,end:Q.end,nch:Q.nch,cap:Q.cap,head:Q.head,n:Q.n};
 r.sent={sh:sim.net.shs.map(q=>q.n),ev:sim.ev?sim.ev.n:0,chN:(sim.changes||[]).length,chLast:(sim.changes||[]).slice(-1)[0],dgVer:sim.dgVer,dgT:0};
 // the page may have stopped before the start (pause right after ▶): then nothing runs and nothing is written
 if(Atomics.compareExchange(r.ctl,1,0,1)!==0)return;
 r.running=true;r.last=performance.now();later(r,true);}
self.onmessage=e=>{const m=e.data;
 if(m.type==='start'){try{start(m);}catch(x){if(R)R.running=false;Atomics.compareExchange(m.ctl,1,0,3);self.postMessage({type:'error',epoch:m.epoch,message:String(x&&x.message||x),start:true});}return;}
 const r=R;if(!r||m.epoch!==r.epoch||!sim)return;
 if(m.type==='speed'){r.speed=m.speed;r.stopT=m.stopT||0;return;}
 if(m.type==='call'){try{if(m.name==='dgClear'){sim.dg=new Map();sim.dgVer=(sim.dgVer||0)+1;}else if(typeof sim[m.name]==='function')sim[m.name](...(m.args||[]));}catch(x){self.postMessage({type:'error',epoch:r.epoch,message:String(x&&x.message||x)});}}};
