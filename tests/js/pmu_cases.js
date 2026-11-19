// 4.21 (ROADMAP §87): the tutorial of the state estimation from the EMT (se_emt) headless: the IEEE 9 network in EMT from its load
// flow with a phasor measurement unit (PMU3) at the «from» end of every branch. At the end of the run: what every unit gives (the
// phasors of positive sequence, P and Q) and the samples of its last period (the voltages and currents of the three phases), for the
// total vector error against a sinusoid fitted to them. The Python side (tests/test_emt_se.py) makes the measurements and estimates.
// The phases of the units on cos(2πf₀t) (IEC/IEEE 60255-118-1), and, for the check, on sin (thV_sin, thI_sin: the analyzers inside).
// Usage: node pmu_cases.js [T] -> JSON {card, t, f, points: [{id, branch, end, V, thV, I, thI, P, Q, wave: {t, va, vb, vc, ia, ib, ic}}], warn}
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');global.Expr=require(W+'/expr.js');global.StepCheck=require(W+'/stepcheck.js');
global.LineModels=require(W+'/linemodels.js');
for(const f of ['netlib','subcircuit','bus','units','nn'])require(W+'/'+f+'.js');
global.MNA=require(W+'/mna.js');require(W+'/tutorials.js');
const t=Tutorials.get('se_emt'),pr=t.build({plan:'pmu',bad:'none'}),s=new MNA.Sim(pr,{hDiv:pr.sim.hDiv,method:pr.sim.method});
const T=+(process.argv[2]||0.25),f=pr.meta.study.emt.f,pts=pr.meta.study.emt.points,wave={};
const K=q=>['Va','Vb','Vc','Aa','Ab','Ac'].map(x=>'Y:'+q.id+'/'+x);
for(const q of pts)wave[q.id]={t:[],v:K(q).map(()=>[])};
while(s.t<T-1e-12){s.run(s.h);if(s.t>T-1/f-2*s.h)for(const q of pts){const w=wave[q.id];w.t.push(s.t);K(q).forEach((k,j)=>w.v[j].push(s.now(k)));}}
const g=k=>s.now(k);
console.log(JSON.stringify({card:{group:t.group,title:t.title,tasks:t.tasks,options:t.options.map(q=>({k:q.k,def:q.def,values:q.options.map(z=>z[0])}))},t:s.t,h:s.h,f,
 warn:s.net.warnings,keys:pr.scope.panes.flat().map(q=>q[0]).filter(k=>s.keys.includes(k)).length,panes:pr.scope.panes.flat().length,meta:pr.meta.study,
 points:pts.map(q=>({id:q.id,branch:q.branch,end:q.end,V:g('Y:'+q.id+'/SV'),thV:g('Y:'+q.id+'/TV'),I:g('Y:'+q.id+'/SI'),thI:g('Y:'+q.id+'/TI'),P:g('Y:'+q.id+'/PP'),Q:g('Y:'+q.id+'/QQ'),thV_sin:g('Y:'+q.id+'/SV:phpos'),thI_sin:g('Y:'+q.id+'/SI:phpos'),
  wave:{t:wave[q.id].t,va:wave[q.id].v[0],vb:wave[q.id].v[1],vc:wave[q.id].v[2],ia:wave[q.id].v[3],ib:wave[q.id].v[4],ic:wave[q.id].v[5]}}))}));
