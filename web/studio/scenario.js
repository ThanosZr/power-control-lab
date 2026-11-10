'use strict';
// Scripted scenarios (ROADMAP §30): the requests of the pcl package, answered by the browser's solver. No DOM:
// the same file serves pcl/runner.js (Node, 3.13) and the "Σενάρια" panel's worker (scenario_worker.js, 3.14).
//   {action:'run', project, t_end, channels, hdiv, method, step, from, max_points, measure, waveforms, check}
//   {action:'export', project, channels}      the netlist for the SciPy solver (engine/batch.py)
//   {action:'tutorial', id, options}           the project a tutorial builds
//   {action:'tutorials'}                       the list of tutorials and their options
//   {action:'channels', project}               the channels the project has
//   {action:'bifurcation', project, comp, param, values, key, stat, transient, record, hdiv, method}   (3.15)
//                                              per value the samples of the last `record` periods and their period, as the app's diagram
// Sessions (3.16, ROADMAP §41.1): a solver that stays open between requests, for results in chunks and runs that continue later
//   {action:'open', project, channels, hdiv, method, step, check, state, saved}  → {sid, keys, T, t}  (state: MNA snapshot of `saved`)
//   {action:'advance', sid, t_end, from, max_points, waveforms, measure, set}    → the points of (t, t_end]: {t, ch, t0, t1, measure, meta}
//   {action:'state', sid} → the snapshot (Sim.snapshot)       {action:'close', sid} → {diag, warnings, steps}
// handle(q) is synchronous. A circuit with a Python block throws an error with needPython until Python is loaded.
(function(root){
 const P=root.Parts||(typeof require!=='undefined'?require('./parts.js'):null);
 const MNA=root.MNA||(typeof require!=='undefined'?require('./mna.js'):null);
 const Metrics=root.Metrics||(typeof require!=='undefined'?require('./metrics.js'):null);
 const tut=()=>root.Tutorials||null;

 // default channels: the project's scope, else voltage and current of every element
 function defaultKeys(s,pr){const sc=(pr.scope&&pr.scope.cfg)||null,keys=[];
  if(sc)for(const pane of sc.panes||[])for(const ch of pane.ch||pane.channels||[]){const k=typeof ch==='string'?ch:ch.key;if(k&&s.chIndex.has(k)&&!keys.includes(k))keys.push(k);}
  if(keys.length)return keys;return s.keys.filter(k=>/^[VI]:/.test(k));}

 // a measurement over the last `periods` base periods (or at a time): trapezoidal in time, like the app's period statistics
 function measure(t,y,spec,Tb){const n=t.length;if(!n)return NaN;const st=spec.stat||'avg';
  if(st==='end')return y[n-1];
  if(st==='at'){const x=+spec.at;if(x<=t[0])return y[0];if(x>=t[n-1])return y[n-1];let lo=0,hi=n-1;while(hi-lo>1){const m=(lo+hi)>>1;if(t[m]<=x)lo=m;else hi=m;}return t[hi]>t[lo]?y[lo]+(y[hi]-y[lo])*(x-t[lo])/(t[hi]-t[lo]):y[hi];}
  const Pn=Math.max(1,+spec.periods||1),tb=t[n-1],ta=Math.max(t[0],tb-Pn*Tb);
  if(st==='thd'){const f1=+spec.f1||1/Tb,h=Metrics.harmonics({t,y,f1,periods:Math.max(1,Math.round((tb-ta)*f1)),H:+spec.H||50,tEnd:tb});return h.ok?h.thd:NaN;}
  let s=0,q=0,mn=Infinity,mx=-Infinity,d=0;
  for(let i=1;i<n;i++){if(t[i]<ta)continue;let t0=t[i-1],y0=y[i-1];if(t0<ta){y0=y0+(y[i]-y0)*(ta-t0)/(t[i]-t0||1);t0=ta;}const h=t[i]-t0,y1=y[i];
   if(h>0){s+=h*(y0+y1)/2;q+=h*(y0*y0+y0*y1+y1*y1)/3;d+=h;}mn=Math.min(mn,y0,y1);mx=Math.max(mx,y0,y1);}
  if(!(d>0))return y[n-1];
  return st==='avg'?s/d:st==='rms'?Math.sqrt(Math.max(0,q/d)):st==='min'?mn:st==='max'?mx:st==='pp'?mx-mn:NaN;}

 // keeps the first and last point and the extremes of every channel in each bucket (as engine/batch.py _decimate)
 function decimate(t,cols,limit){const n=t.length;if(n<=limit)return null;const B=Math.max(1,Math.floor(limit/(2+2*cols.length))),keep=new Set();
  for(let k=0;k<B;k++){const a=Math.floor(k*n/B),b=Math.floor((k+1)*n/B);if(b<=a)continue;keep.add(a);keep.add(b-1);
   for(const c of cols){let mi=a,ma=a;for(let i=a;i<b;i++){if(c[i]<c[mi])mi=i;if(c[i]>c[ma])ma=i;}keep.add(mi);keep.add(ma);}}
  return [...keep].sort((x,y)=>x-y);}

 function run(q,hooks={}){
  const pr=q.project;if(!pr||!Array.isArray(pr.components))throw new Error('Λείπει το project (components, wires).');
  const s0=pr.sim||{},opts={hDiv:+q.hdiv||+s0.hDiv||200,method:q.method||s0.method||'TR'};if(q.step)opts.step=q.step;
  const s=new MNA.Sim(pr,opts);
  const keys=q.channels&&q.channels.length?[...q.channels]:defaultKeys(s,pr);
  for(const m of q.measure||[])if(m.key&&!keys.includes(m.key))keys.push(m.key); // a measurement brings its channel
  const idx=keys.map(k=>{const i=s.chIndex.get(k);if(i===undefined)throw new Error(`Άγνωστο κανάλι «${k}». Μερικά διαθέσιμα: ${s.keys.slice(0,24).join(', ')}${s.keys.length>24?' …':''}`);return i;});
  const from=+q.from||0,t=[],Y=keys.map(()=>[]);
  const push=()=>{if(s.t<from-1e-15)return;const v=s.vals;t.push(s.t);for(let j=0;j<idx.length;j++)Y[j].push(v[idx[j]]);};
  push(); // t = 0 (recorded by the constructor)
  const rec=s.recordNow.bind(s);s.recordNow=function(){rec();push();};
  if(q.check!==false)s.stepCheck(); // the step check (3.13): its messages come back with the results
  const tEnd=+q.t_end;if(!(tEnd>0))throw new Error('Η διάρκεια t_end πρέπει να είναι > 0.');
  const w0=Date.now(),limit=+q.wall_s||0;
  // in chunks of whole base periods (already step boundaries, so the numbers do not change) when a caller reports progress or has a time limit
  if(hooks.tick||limit){const m=Math.max(1,Math.ceil(tEnd/50/s.T));
   while(s.t<tEnd*(1-1e-12)){const k=Math.round(s.t/s.T),te=Math.min(tEnd,(k+m)*s.T);s.run(te-s.t);if(hooks.tick)hooks.tick(s.t/tEnd);
    if(limit&&(Date.now()-w0)/1000>limit)throw new Error(`Σταμάτησε στο t = ${P.eng(s.t,'s',4)}: όριο ${limit} s.`);}}
  else s.run(tEnd);
  const meas={};for(const m of q.measure||[]){const j=keys.indexOf(m.key);if(j<0)throw new Error(`Η μέτρηση «${m.name||m.key}» θέλει το κανάλι ${m.key} στα channels.`);meas[m.name||`${m.key}:${m.stat}`]=measure(t,Y[j],m,s.T);}
  const out={keys,meta:{T:s.T,h:s.h,hDiv:opts.hDiv,method:s.method,step:s.var?'var':'fixed',rtol:s.var?s.rtol:null,hMin:s.var?s.hMin:null,hMax:s.var?(s.hCap||s.hMax):null,
    steps:s.steps,rejected:s.nRej||0,t_end:s.t,points:t.length,wall_s:(Date.now()-w0)/1000,warnings:s.net.warnings},
   measure:meas,diag:s.diagnostics().map(d=>({sev:d.sev,grp:d.grp,id:d.id||null,t:d.t,n:d.n,msg:d.msg,fix:d.fix||''}))};
  if(q.waveforms!==false){const keep=decimate(t,Y,+q.max_points||200000);
   out.t=keep?keep.map(i=>t[i]):t;out.ch={};keys.forEach((k,j)=>{out.ch[k]=keep?keep.map(i=>Y[j][i]):Y[j];});out.meta.returned=out.t.length;}
  return out;}

 // ------------------------------------------------------------------ sessions (3.16)
 // set: {'<id>': value} for a «Σταθερά / πρόγραμμα» block (the value from now on, as the app's live change), or
 // {'<id>.<param>': value} for any parameter (the circuit is loaded again with its states, as a change while running)
 const sessions=new Map();let sidNext=1;
 function open(q){const pr=q.project;if(!pr||!Array.isArray(pr.components))throw new Error('Λείπει το project (components, wires).');
  let s;const s0=pr.sim||{};
  if(q.state){s=MNA.resume(q.saved||pr,q.state,pr);}
  else{const opts={hDiv:+q.hdiv||+s0.hDiv||200,method:q.method||s0.method||'TR'};if(q.step)opts.step=q.step;s=new MNA.Sim(pr,opts);if(q.check!==false)s.stepCheck();}
  const keys=q.channels&&q.channels.length?[...q.channels]:defaultKeys(s,pr);
  for(const m of q.measure||[])if(m.key&&!keys.includes(m.key))keys.push(m.key);
  const S={sim:s,project:JSON.parse(JSON.stringify(pr)),keys,idx:null,t:[],Y:null,fresh:!q.state,from:0};
  const index=()=>{S.idx=keys.map(k=>{const i=s.chIndex.get(k);if(i===undefined)throw new Error(`Άγνωστο κανάλι «${k}». Μερικά διαθέσιμα: ${s.keys.slice(0,24).join(', ')}${s.keys.length>24?' …':''}`);return i;});};
  index();S.index=index;
  const rec=s.recordNow.bind(s);s.recordNow=function(){rec();S.push();};
  S.push=()=>{if(!S.Y||s.t<S.from-1e-15)return;const v=s.vals;S.t.push(s.t);for(let j=0;j<S.idx.length;j++)S.Y[j].push(v[S.idx[j]]);};
  if(sessions.size>=32)sessions.delete(sessions.keys().next().value);  // the oldest one, if a caller forgot to close
  const sid=String(sidNext++);sessions.set(sid,S);
  return {sid,keys,T:s.T,t:s.t,method:s.method,step:s.var?'var':'fixed',warnings:s.net.warnings};}
 function session(q){const S=sessions.get(String(q.sid));if(!S)throw new Error('Η συνεδρία του λύτη έκλεισε ή δεν υπάρχει ('+q.sid+').');return S;}
 function setLive(S,set){const s=S.sim;let reload=false;
  for(const [k,v] of Object.entries(set||{})){const [id,prm]=String(k).split('.');const c=S.project.components.find(x=>x.id===id);if(!c)throw new Error(`Δεν υπάρχει στοιχείο «${id}».`);
   if(!prm){if(c.type!=='CONST')throw new Error(`«${id}»: χωρίς παράμετρο αλλάζει μόνο μπλοκ «Σταθερά / πρόγραμμα» (γράψε ${id}.<παράμετρος>).`);
    const x=+v;c.params={...(c.params||{}),v:String(v)};s.setBlock(id,{sched:[[0,x]]});}
   else{c.params={...(c.params||{}),[prm]:v};reload=true;}}
  if(reload){s.load(JSON.parse(JSON.stringify(S.project)),false);S.index();}}
 function advance(q,hooks={}){const S=session(q),s=S.sim,te=+q.t_end;if(!(te>s.t*(1+1e-12)))throw new Error(`Το τέλος ${te} s πρέπει να είναι μετά το ${s.t} s.`);
  if(q.set)setLive(S,q.set);
  S.from=+q.from||0;S.t=[];S.Y=S.keys.map(()=>[]);const t0=s.t,w0=Date.now(),st0=s.steps;
  if(S.fresh){S.fresh=false;S.push();} // t = 0 (recorded by the constructor)
  if(hooks.tick){const m=Math.max(1,Math.ceil((te-t0)/50/s.T));
   while(s.t<te*(1-1e-12)){const k=Math.round(s.t/s.T),e=Math.min(te,(k+m)*s.T);s.run(e-s.t);hooks.tick((s.t-t0)/(te-t0));}}
  else s.run(te-s.t);
  const t=S.t,Y=S.Y;S.Y=null;
  const meas={};for(const m of q.measure||[]){const j=S.keys.indexOf(m.key);if(j<0)throw new Error(`Η μέτρηση «${m.name||m.key}» θέλει το κανάλι ${m.key}.`);meas[m.name||`${m.key}:${m.stat}`]=measure(t,Y[j],m,s.T);}
  const out={keys:S.keys,t0,t1:s.t,measure:meas,meta:{T:s.T,steps:s.steps-st0,points:t.length,wall_s:(Date.now()-w0)/1000}};
  if(q.waveforms!==false){const keep=decimate(t,Y,+q.max_points||200000);out.t=keep?keep.map(i=>t[i]):t;out.ch={};S.keys.forEach((k,j)=>{out.ch[k]=keep?keep.map(i=>Y[j][i]):Y[j];});out.meta.returned=out.t.length;}
  return out;}
 function closeSession(q){const S=session(q),s=S.sim;sessions.delete(String(q.sid));
  return {t:s.t,steps:s.steps,rejected:s.nRej||0,warnings:s.net.warnings,diag:s.diagnostics().map(d=>({sev:d.sev,grp:d.grp,id:d.id||null,t:d.t,n:d.n,msg:d.msg,fix:d.fix||''}))};}

 function tutorial(q){const T=tut();if(!T)throw new Error('Τα tutorials δεν έχουν φορτωθεί.');const t=T.get(q.id);if(!t)throw new Error(`Άγνωστο tutorial «${q.id}». Υπάρχουν: ${T.list.map(x=>x.id).join(', ')}`);
  const o={};for(const op of t.options){const v=(q.options||{})[op.k];o[op.k]=v===undefined?op.def:String(v);}const out=t.build(o);out.tutorial={id:q.id,options:o};return out;}
 function tutorials(){const T=tut();return T?T.list.map(t=>({id:t.id,title:t.title,group:t.group,options:t.options.map(o=>({k:o.k,label:o.label,def:o.def,choices:(o.options||[]).map(c=>Array.isArray(c)?c[0]:c)}))})):[];}

 function handle(q,hooks){
  if(q.action==='run')return run(q,hooks);
  if(q.action==='export')return MNA.exportForBatch(q.project,q.channels||[]);
  if(q.action==='channels'){const s=new MNA.Sim(q.project,{hDiv:50});return {keys:s.keys,T:s.T};}
  if(q.action==='tutorial')return tutorial(q);
  if(q.action==='tutorials')return tutorials();
  if(q.action==='bifurcation')return bifurcation(q,hooks);
  if(q.action==='open')return open(q);
  if(q.action==='advance')return advance(q,hooks);
  if(q.action==='state')return session(q).sim.snapshot();
  if(q.action==='close')return closeSession(q);
  throw new Error('Άγνωστη ενέργεια: '+q.action);}

 // the bifurcation diagram as a sweep (3.15): one value = MNA.sweepPoint (transient, then one sample per base period:
 // min, max, avg or end) and the period of the samples (Metrics.periodicity). The app's diagram, pcl and the pool call the same.
 function bifPoint(pr,o){const r=MNA.sweepPoint(pr,o),q=Metrics.periodicity(r.y);return {value:o.value,y:r.y,period:q.period,T:r.T,warnings:r.warnings};}
 function bifSpec(q){const pr=q.project;if(!pr||!Array.isArray(pr.components))throw new Error('Λείπει το project (components, wires).');
  let comp=q.comp,param=q.param;if(!param&&typeof comp==='string'&&comp.includes('.'))[comp,param]=comp.split('.');
  if(!comp||!param)throw new Error('Η διακλάδωση θέλει παράμετρο <id>.<παράμετρος>, π.χ. R1.R.');if(!q.key)throw new Error('Η διακλάδωση θέλει κανάλι (key), π.χ. I:L1.');
  const s0=pr.sim||{};return {comp,param,key:q.key,stat:q.stat||'min',transient:q.transient??200,record:q.record??50,hDiv:+q.hdiv||+s0.hDiv||100,method:q.method||s0.method||'TR'};}
 function bifurcation(q,hooks={}){const o=bifSpec(q),vals=(q.values||[]).map(Number),w0=Date.now(),pts=[];if(!vals.length)throw new Error('Η διακλάδωση δεν έχει τιμές.');
  for(let k=0;k<vals.length;k++){pts.push(bifPoint(q.project,{...o,value:+vals[k].toPrecision(10)}));if(hooks.tick)hooks.tick((k+1)/vals.length);}
  return {points:pts,meta:{...o,T:pts[0].T,n:pts.length,wall_s:(Date.now()-w0)/1000}};}
 // JSON without NaN/Infinity (null), as Python's json reads it
 const json=o=>JSON.stringify(o,(k,v)=>typeof v==='number'&&!Number.isFinite(v)?null:v);

 const api={handle,run,measure,decimate,defaultKeys,json,bifPoint,bifSpec,sessions};
 root.Scenario=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:typeof self!=='undefined'?self:globalThis);
