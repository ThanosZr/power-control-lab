'use strict';
// The browser's solver for the pcl package (3.13, ROADMAP §30): the same web/studio/*.js as the app, in Node.
// Reads one JSON request from stdin and writes one JSON reply to stdout.
//   {action:'run', project, t_end, channels, hdiv, method, step, from, max_points, measure, waveforms, check}
//   {action:'export', project, channels}      the netlist for the SciPy solver (engine/batch.py)
//   {action:'tutorial', id, options}           the project a tutorial builds
//   {action:'tutorials'}                       the list of tutorials and their options
//   {action:'channels', project}               the channels the project has
const path=require('path');const W=path.resolve(__dirname,'../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');global.Expr=require(W+'/expr.js');global.StepCheck=require(W+'/stepcheck.js');
const MNA=require(W+'/mna.js');require(W+'/tutorials.js');const Metrics=require(W+'/metrics.js');
const T=globalThis.Tutorials;

let py=null;
async function loadPy(){if(py)return py;py=require(W+'/pyrt.js');await py.load();return py;}
async function makeSim(pr,opts){try{return new MNA.Sim(pr,opts);}catch(e){if(e.needPython){await loadPy();return new MNA.Sim(pr,opts);}throw e;}}

// default channels: the project's scope, else voltage and current of every element
function defaultKeys(s,pr){const sc=(pr.scope&&pr.scope.cfg)||null,keys=[];
 if(sc)for(const pane of sc.panes||[])for(const ch of pane.ch||pane.channels||[]){const k=typeof ch==='string'?ch:ch.key;if(k&&s.chIndex.has(k)&&!keys.includes(k))keys.push(k);}
 if(keys.length)return keys;return s.keys.filter(k=>/^[VI]:/.test(k));}

// a measurement over the last `periods` base periods (or at a time): trapezoidal in time, like the app's period statistics
function measure(t,y,spec,Tb){const n=t.length;if(!n)return NaN;const st=spec.stat||'avg';
 if(st==='end')return y[n-1];
 if(st==='at'){const x=+spec.at;if(x<=t[0])return y[0];if(x>=t[n-1])return y[n-1];let lo=0,hi=n-1;while(hi-lo>1){const m=(lo+hi)>>1;if(t[m]<=x)lo=m;else hi=m;}return t[hi]>t[lo]?y[lo]+(y[hi]-y[lo])*(x-t[lo])/(t[hi]-t[lo]):y[hi];}
 const P=Math.max(1,+spec.periods||1),tb=t[n-1],ta=Math.max(t[0],tb-P*Tb);
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

async function run(q){
 const pr=q.project;if(!pr||!Array.isArray(pr.components))throw new Error('Λείπει το project (components, wires).');
 const s0=pr.sim||{},opts={hDiv:+q.hdiv||+s0.hDiv||200,method:q.method||s0.method||'TR'};if(q.step)opts.step=q.step;
 const s=await makeSim(pr,opts);
 const keys=q.channels&&q.channels.length?q.channels:defaultKeys(s,pr);
 const idx=keys.map(k=>{const i=s.chIndex.get(k);if(i===undefined)throw new Error(`Άγνωστο κανάλι «${k}». Μερικά διαθέσιμα: ${s.keys.slice(0,24).join(', ')}${s.keys.length>24?' …':''}`);return i;});
 const from=+q.from||0,t=[],Y=keys.map(()=>[]);
 const push=()=>{if(s.t<from-1e-15)return;const v=s.vals;t.push(s.t);for(let j=0;j<idx.length;j++)Y[j].push(v[idx[j]]);};
 push(); // t = 0 (recorded by the constructor)
 const rec=s.recordNow.bind(s);s.recordNow=function(){rec();push();};
 if(q.check!==false)s.stepCheck(); // the step check (3.13): its messages come back with the results
 const tEnd=+q.t_end;if(!(tEnd>0))throw new Error('Η διάρκεια t_end πρέπει να είναι > 0.');
 const w0=Date.now();s.run(tEnd);
 const meas={};for(const m of q.measure||[]){const j=keys.indexOf(m.key);if(j<0)throw new Error(`Η μέτρηση «${m.name||m.key}» θέλει το κανάλι ${m.key} στα channels.`);meas[m.name||`${m.key}:${m.stat}`]=measure(t,Y[j],m,s.T);}
 const out={keys,meta:{T:s.T,h:s.h,hDiv:opts.hDiv,method:s.method,step:s.var?'var':'fixed',rtol:s.var?s.rtol:null,hMin:s.var?s.hMin:null,hMax:s.var?(s.hCap||s.hMax):null,
   steps:s.steps,rejected:s.nRej||0,t_end:s.t,points:t.length,wall_s:(Date.now()-w0)/1000,warnings:s.net.warnings},
  measure:meas,diag:s.diagnostics().map(d=>({sev:d.sev,grp:d.grp,id:d.id||null,t:d.t,n:d.n,msg:d.msg,fix:d.fix||''}))};
 if(q.waveforms!==false){const keep=decimate(t,Y,+q.max_points||200000);
  out.t=keep?keep.map(i=>t[i]):t;out.ch={};keys.forEach((k,j)=>{out.ch[k]=keep?keep.map(i=>Y[j][i]):Y[j];});out.meta.returned=out.t.length;}
 return out;}

async function main(){
 let txt='';for await(const c of process.stdin)txt+=c;const q=JSON.parse(txt||'{}');let out;
 if(q.action==='run')out=await run(q);
 else if(q.action==='export'){const r=MNA.exportForBatch(q.project,q.channels||[]);out=r;}
 else if(q.action==='channels'){const s=await makeSim(q.project,{hDiv:50});out={keys:s.keys,T:s.T};}
 else if(q.action==='tutorial'){const t=T.get(q.id);if(!t)throw new Error(`Άγνωστο tutorial «${q.id}». Υπάρχουν: ${T.list.map(x=>x.id).join(', ')}`);
  const o={};for(const op of t.options){const v=(q.options||{})[op.k];o[op.k]=v===undefined?op.def:v;}out=t.build(o);out.tutorial={id:q.id,options:o};}
 else if(q.action==='tutorials')out=T.list.map(t=>({id:t.id,title:t.title,group:t.group,options:t.options.map(o=>({k:o.k,label:o.label,def:o.def,choices:(o.options||[]).map(c=>Array.isArray(c)?c[0]:c)}))}));
 else throw new Error('Άγνωστη ενέργεια: '+q.action);
 process.stdout.write(JSON.stringify(out,(k,v)=>typeof v==='number'&&!Number.isFinite(v)?null:v));}
main().catch(e=>{process.stderr.write(String(e&&e.message||e));process.exit(1);});
