'use strict';
// 5.0 (ROADMAP §91, THEORY §8ΩΕ): a run of the page into the study folder, in a worker of its own, from t = 0 to the end
// time: the project is built as the page builds it (the step, the method), every recorded point of the channels goes to
// the server (/api/study_data, binary rows) about twice a second, with the events and the messages (/api/study), so
// that the viewer (web/viewer/) can read the run while it is written. The page keeps its own simulation and scope.
//   in:  {project, sim: {hDiv, method, eventsMax}, stopT, study: {path, mode, dtype, dt, netlist, scope: [keys]}, title, tutorial}
//        {stop: true}                          stop at the next slice (the run ends as 'stopped')
//   out: {type: 'begin', run, path, channels, models} · {type: 'progress', t, rows, bytes, steps} · {type: 'end', status, run, stats}
//        · {type: 'error', message}
self.window=self;
importScripts('expr.js','parts.js','stepcheck.js','netlib.js','subcircuit.js','bus.js','units.js','pyrt.js','sparse.js','kernels.js','nn.js','tune.js','inputs.js','mna.js','linemodels.js','study.js');
let stop=false;
const api=async(op,body)=>{const r=await fetch('/api/study',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({op,...body})});const j=await r.json();if(j.error)throw new Error(j.error);return j;};
const send=async(study,run,A)=>{const r=await fetch('/api/study_data',{method:'POST',headers:{'Content-Type':'application/octet-stream','X-PCL-Study':encodeURIComponent(study),'X-PCL-Run':run},body:A});
 const j=await r.json();if(j.error)throw new Error(j.error);return j;};
self.onmessage=async e=>{const d=e.data;if(d.stop){stop=true;return;}stop=false;
 const S=d.study,t0w=performance.now();let run=null,sim=null;
 try{
  sim=new MNA.Sim(d.project,{hDiv:d.sim.hDiv,method:d.sim.method,eventsMax:d.sim.eventsMax,cap:16});
  if(sim.pyLazy&&sim.pyLazy())throw new Error('Τα μπλοκ Python δεν τρέχουν ακόμη στον φάκελο μελέτης από τη σελίδα· τρέξε από την Python (Project.run(folder=…)).');
  const build=performance.now()-t0w,keys=Study.keysFor(sim,S.mode||'all',S.scope),o={dtype:S.dtype,dt:S.dt};if(!keys.length)throw new Error('Κανένα κανάλι για καταγραφή.');
  const di={...Study.dataInfo(keys,o),mode:S.mode||'all'},si=sim.solverInfo();
  const b=await api('begin',{study:S.path,project:d.project,title:d.title||'',source:'page',tutorial:d.tutorial||null,data:di,
   solver:{h:sim.h,step:sim.var?'var':'fixed',method:sim.method,hDiv:d.sim.hDiv,T:sim.T,stopT:d.stopT,kind:si.kind,refac:si.refac,kernel:si.kernel,rec:sim.recKeys===sim.keys?'all':'watched'}});
  run=b.run;const refs={};for(const m of b.models||[])refs[m.cid]={hash:m.hash,dir:m.dir};
  const ch=Study.channels(sim,keys);await api('put',{study:S.path,run,name:'channels.json',obj:ch});
  await api('put',{study:S.path,run,name:'summary.json',obj:Study.summary(sim)});
  if(S.netlist){const nl=Study.netlist(sim,refs);await api('put',{study:S.path,run,name:'netlist.json',obj:nl});await api('put',{study:S.path,run,name:'netlist.txt',text:Study.netlistText(nl,d.title)});}
  const log=[{level:'info',msg:si.proposal?.text||''},...(sim.net.warnings||[]).map(w=>({level:'warn',msg:String(w)}))].filter(x=>x.msg);if(log.length)await api('log',{study:S.path,run,rows:log});
  self.postMessage({type:'begin',run,path:b.path,channels:ch.length,models:b.models});
  const R=new Study.Recorder(sim,keys,o);R.push();   // the point at the start
  let rows=0,bytes=0,last=performance.now();const tEnd=+d.stopT,tr=performance.now();
  while(sim.t<tEnd-sim.h*1e-7&&!stop){sim.runUntil(tEnd,Infinity,performance.now()+250);
   const A=R.take();if(A){const j=await send(S.path,run,A);rows=j.rows;bytes=j.bytes;}const ev=R.events();if(ev.length)await api('events',{study:S.path,run,rows:ev});
   if(performance.now()-last>400){last=performance.now();self.postMessage({type:'progress',t:sim.t,rows,bytes,steps:sim.steps});}}
  const A=R.take();if(A){const j=await send(S.path,run,A);rows=j.rows;bytes=j.bytes;}const ev=R.events();if(ev.length)await api('events',{study:S.path,run,rows:ev});R.stop();
  const dg=(sim.diagnostics?sim.diagnostics():[]).map(n=>({level:n.sev||'info',msg:String(n.msg||n.key||''),t:n.t,n:n.n}));if(dg.length)await api('log',{study:S.path,run,rows:dg});
  const st={t_end:sim.t,steps:sim.steps,rejected:sim.nRej||0,h:sim.h,build_ms:+build.toFixed(1),run_ms:+(performance.now()-tr).toFixed(1),rows,bytes,...(sim.lustat?{factorizations:sim.lustat.fact,refactorizations:sim.lustat.re}:{})};
  const end=await api('end',{study:S.path,run,status:stop?'stopped':'done',stats:st});self.postMessage({type:'end',status:end.status,run,stats:st});}
 catch(x){const msg=String(x&&x.message||x);try{if(run)await api('end',{study:S.path,run,status:'error',error:msg});}catch(_){}self.postMessage({type:'error',message:msg,run});}};
