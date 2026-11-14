// The lightning tutorial of 4.9 (lightning_gis) runs headless: peaks of the voltages in the substation, the tower top and
// the insulator strings, the flashovers (current through a string) and the arrester currents.
// Usage: node lightning_cases.js '[{...options}, …]' -> JSON [{ov, peak:{channel: max |y|}, flash:{tower/phase: t}, t}]
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');global.Expr=require(W+'/expr.js');global.StepCheck=require(W+'/stepcheck.js');
global.LineModels=require(W+'/linemodels.js');
for(const f of ['netlib','subcircuit','bus','units','nn'])require(W+'/'+f+'.js');
global.MNA=require(W+'/mna.js');require(W+'/tutorials.js');const T=globalThis.Tutorials;
function build(ov){const t=T.get('lightning_gis');const o={};for(const op of t.options)o[op.k]=op.def;return t.build(Object.assign(o,ov));}
// the arrester alone (IEEE model): a current wave I T1/T2 into SA1, the peak voltage across it
function arr(o){const W=(id,a,b)=>({id,a:{c:a[0],p:a[1]},b:{c:b[0],p:b[1]},pts:[]});
 const pr={version:4,components:[{id:'I1',type:'ILG',x:0,y:0,rot:0,params:{shape:'custom',model:'heidler',T1:o.T1,T2:o.T2,n:10,Ipk:o.I,t0:0}},{id:'SA1',type:'SAI',x:100,y:0,rot:0,params:{U10:819e3,d:3.216,n:1,kL1:o.kL1||1,meas:true}},
  {id:'G1',type:'GND',x:0,y:100,rot:0,params:{}},{id:'G2',type:'GND',x:100,y:100,rot:0,params:{}}],wires:[W('w1',['I1','p'],['SA1','a']),W('w2',['SA1','b'],['G2','g']),W('w3',['I1','n'],['G1','g'])]};
 const s=new MNA.Sim(pr,{hDiv:600,method:'TR'}),stop=o.stop||4*o.T2;let v=0,i=0;
 while(s.t<stop-1e-12){s.run(Math.min(s.h,stop-s.t));v=Math.max(v,Math.abs(s.now('Y:SA1/V')));i=Math.max(i,Math.abs(s.now('Y:SA1/I')));}return {arr:o,v,i,h:s.h};}
function run(ov){if(ov.arr)return arr(ov.arr);const pr=build(ov),s=new MNA.Sim(pr,{hDiv:pr.sim.hDiv,method:pr.sim.method||'TR'}),m=pr.meta.lg;
 const ch=['I:I1','Y:T2/Vtop','Y:T2/If'];for(const x of ['a','b','c']){ch.push('Y:VE'+x,'Y:VG'+x,'Y:VT'+x);for(const t of ['T1','T2','T3'])ch.push(`Y:${t}/U${x}`,`Y:${t}/I${x}`);if(m.sa!=='none')ch.push(`Y:SE${x}/I`,`Y:SE${x}/V`);}
 const peak={},flash={},rng={};for(const c of ch){peak[c]=0;rng[c]=[Infinity,-Infinity];}   // 4.12: and the range of each channel
 while(s.t<pr.sim.stopT-1e-12){s.run(Math.min(s.h,pr.sim.stopT-s.t));for(const c of ch){const y=s.now(c),v=Math.abs(y);if(!(v<=peak[c]))peak[c]=v;if(y<rng[c][0])rng[c][0]=y;if(y>rng[c][1])rng[c][1]=y;
  const g=/^Y:(T\d)\/I([abc])$/.exec(c);if(g&&v>1&&flash[g[1]+g[2]]===undefined)flash[g[1]+g[2]]=s.t;}}
 return {ov,peak,flash,rng,t:s.t,h:s.h,warn:s.net.warnings};}
const cases=JSON.parse(process.argv[2]||'[{}]');console.log(JSON.stringify(cases.map(run)));
