// 4.21 (ROADMAP §87): the tutorial of the spectrum from the EMT (harm_emt) headless, for every combination of its options: what the
// Fourier blocks give at the end of the run (the magnitude and the phase of every order of the current of phase a). The Python side
// (tests/test_emt_harmonic.py) makes the spectrum of the study and compares. Usage: node harm_emt_cases.js -> JSON {card, runs}
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');global.Expr=require(W+'/expr.js');global.StepCheck=require(W+'/stepcheck.js');
global.LineModels=require(W+'/linemodels.js');
for(const f of ['netlib','subcircuit','bus','units','nn'])require(W+'/'+f+'.js');
global.MNA=require(W+'/mna.js');require(W+'/tutorials.js');
const t=Tutorials.get('harm_emt'),o=k=>t.options.find(q=>q.k===k).options.map(q=>q[0]),runs=[];
for(const Ls of o('Ls'))for(const dev of o('dev')){const pr=t.build({Ls,dev}),s=new MNA.Sim(pr,{hDiv:pr.sim.hDiv,method:pr.sim.method});
 while(s.t<pr.sim.stopT-1e-12)s.run(s.h);const e=pr.meta.study.emt,four={};
 for(const [h,id] of Object.entries(e.orders))four[h]=[s.now('Y:'+id),s.now('Y:'+id+':ph')];
 runs.push({Ls,dev,t:s.t,meta:{Vpk:pr.meta.Vpk,f:pr.meta.f,Ls:pr.meta.Ls,alpha:pr.meta.alpha,Id:pr.meta.Id},Id:s.now('I:LD'),four,emt:e,warn:s.net.warnings,
  keys:pr.scope.panes.flat().map(q=>q[0]).filter(k=>s.keys.includes(k)).length,panes:pr.scope.panes.flat().length});}
console.log(JSON.stringify({card:{group:t.group,title:t.title,tasks:t.tasks,options:t.options.map(q=>({k:q.k,def:q.def,values:q.options.map(z=>z[0])}))},runs}));
