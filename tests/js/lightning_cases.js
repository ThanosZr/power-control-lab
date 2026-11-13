// The lightning tutorial of 4.9 (lightning_gis) runs headless: peaks of the voltages in the substation, the tower top and
// the insulator strings, the flashovers (current through a string) and the arrester currents.
// Usage: node lightning_cases.js '[{...options}, …]' -> JSON [{ov, peak:{channel: max |y|}, flash:{tower/phase: t}, t}]
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');global.Expr=require(W+'/expr.js');global.StepCheck=require(W+'/stepcheck.js');
global.LineModels=require(W+'/linemodels.js');
for(const f of ['netlib','subcircuit','bus','units','nn'])require(W+'/'+f+'.js');
global.MNA=require(W+'/mna.js');require(W+'/tutorials.js');const T=globalThis.Tutorials;
function build(ov){const t=T.get('lightning_gis');const o={};for(const op of t.options)o[op.k]=op.def;return t.build(Object.assign(o,ov));}
function run(ov){const pr=build(ov),s=new MNA.Sim(pr,{hDiv:pr.sim.hDiv,method:pr.sim.method||'TR'}),m=pr.meta.lg;
 const ch=['I:I1','Y:T2/Vtop','Y:T2/If'];for(const x of ['a','b','c']){ch.push('Y:VE'+x,'Y:VG'+x,'Y:VT'+x);for(const t of ['T1','T2','T3'])ch.push(`Y:${t}/U${x}`,`Y:${t}/I${x}`);if(m.sa!=='none')ch.push(`Y:SE${x}/I`,`Y:SE${x}/V`);}
 const peak={},flash={};for(const c of ch)peak[c]=0;
 while(s.t<pr.sim.stopT-1e-12){s.run(Math.min(s.h,pr.sim.stopT-s.t));for(const c of ch){const v=Math.abs(s.now(c));if(!(v<=peak[c]))peak[c]=v;
  const g=/^Y:(T\d)\/I([abc])$/.exec(c);if(g&&v>1&&flash[g[1]+g[2]]===undefined)flash[g[1]+g[2]]=s.t;}}
 return {ov,peak,flash,t:s.t,h:s.h};}
const cases=JSON.parse(process.argv[2]||'[{}]');console.log(JSON.stringify(cases.map(run)));
