// 4.20 (ROADMAP §82): the tutorial of the five-terminal DC grid (mtdc5) headless, for every combination of its options: the study it
// asks from the engine (meta.study), and the EMT at its end (stopT): the voltage and the power of every terminal. The Python side
// (tests/test_dcgrid.py) runs the same study and compares. Usage: node mtdc_cases.js -> JSON {card, runs}
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');global.Expr=require(W+'/expr.js');global.StepCheck=require(W+'/stepcheck.js');
global.LineModels=require(W+'/linemodels.js');
for(const f of ['netlib','subcircuit','bus','units','nn'])require(W+'/'+f+'.js');
global.MNA=require(W+'/mna.js');require(W+'/tutorials.js');
const t=Tutorials.get('mtdc5'),o=k=>t.options.find(q=>q.k===k).options.map(q=>q[0]),runs=[];
for(const step of o('step'))for(const rho of o('rho')){const pr=t.build({step,rho}),s=new MNA.Sim(pr,{hDiv:pr.sim.hDiv});
 const at=[0.099];if(pr.sim.stopT>0.3)at.push(0.3);at.push(pr.sim.stopT);const rows=at.map(T=>{s.run(T-s.t);return {t:s.t,U:[1,2,3,4,5].map(k=>s.now('Y:VM'+k)),P:[1,2,3,4,5].map(k=>s.now('Y:PW'+k))};});
 runs.push({step,rho,study:pr.meta.study,rows,warn:s.net.warnings,panes:pr.scope.panes.map(p=>p.map(q=>q[0])),keys:[...pr.scope.panes.flat().map(q=>q[0])].filter(k=>s.keys.includes(k)).length});}
console.log(JSON.stringify({card:{group:t.group,title:t.title,tasks:t.tasks,options:t.options.map(q=>({k:q.k,def:q.def,values:q.options.map(z=>z[0])}))},runs}));
