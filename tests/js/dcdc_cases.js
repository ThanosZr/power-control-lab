// 4.21 (ROADMAP §87): the tutorial of the DC/DC converter (dcdc_ex303) headless, for every combination of its options: the EMT just
// before the event (0.99 s) and at its end (stopT): the power from a to b and the two voltages. The Python side (tests/test_dcdc.py)
// runs the DC load flow of pcl.dcgrid with the converter as one element and compares. Usage: node dcdc_cases.js -> JSON {card, runs}
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');global.Expr=require(W+'/expr.js');global.StepCheck=require(W+'/stepcheck.js');
global.LineModels=require(W+'/linemodels.js');
for(const f of ['netlib','subcircuit','bus','units','nn'])require(W+'/'+f+'.js');
global.MNA=require(W+'/mna.js');require(W+'/tutorials.js');
const t=Tutorials.get('dcdc_ex303'),o=k=>t.options.find(q=>q.k===k).options.map(q=>q[0]),runs=[],K=['Y:PW','Y:UA','Y:UB','Y:DD/IA','Y:DD/IBU'];
for(const ctl of o('ctl'))for(const ev of o('ev')){const pr=t.build({ctl,ev}),s=new MNA.Sim(pr,{hDiv:pr.sim.hDiv,method:pr.sim.method});
 const rows=[0.99,pr.sim.stopT].map(T=>{while(s.t<T-1e-12)s.run(s.h);return {t:s.t,v:K.map(k=>s.now(k))};});
 runs.push({ctl,ev,meta:pr.meta,rows,warn:s.net.warnings,keys:pr.scope.panes.flat().map(q=>q[0]).filter(k=>s.keys.includes(k)).length,panes:pr.scope.panes.flat().length});}
console.log(JSON.stringify({card:{group:t.group,title:t.title,tasks:t.tasks,options:t.options.map(q=>({k:q.k,def:q.def,values:q.options.map(z=>z[0])}))},runs}));
