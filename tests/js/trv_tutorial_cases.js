// The two TRV tutorials of 4.9 run headless (the same post-processing as their cards in app.js): the terminal fault
// against the rated envelope, and the short-line fault with the arc for several arc models, breaker states and duties.
// Usage: node trv_tutorial_cases.js -> JSON [{id, ov, ...}]
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');global.Expr=require(W+'/expr.js');global.StepCheck=require(W+'/stepcheck.js');
for(const f of ['netlib','subcircuit','bus','units','nn'])require(W+'/'+f+'.js');
global.MNA=require(W+'/mna.js');require(W+'/tutorials.js');const TRV=require(W+'/trv.js');const T=globalThis.Tutorials;
function build(id,ov){const t=T.get(id);const o={};for(const op of t.options)o[op.k]=op.def;return t.build(Object.assign(o,ov));}
// the first current zero after t0 where the current stays below 1 A for 50 µs (as trvAfterZero in app.js)
function zero(I,t0){for(let j=1;j<I.t.length;j++){if(I.t[j]<=t0||I.y[j-1]*I.y[j]>0)continue;const a=I.y[j-1],b=I.y[j],tz=I.t[j-1]+(I.t[j]-I.t[j-1])*(a!==b?a/(a-b):0);
 let hold=true;for(let q=j+1;q<I.t.length&&I.t[q]<tz+50e-6;q++)if(Math.abs(I.y[q])>1){hold=false;break;}if(hold)return tz;}return null;}
function run(id,ov){const pr=build(id,ov),s=new MNA.Sim(pr,{hDiv:pr.sim.hDiv,method:pr.sim.method||'TR'});
 const ch=id==='trv_terminal'?['a','b','c'].flatMap(x=>['Y:CB1/I'+x,'Y:CB1/V'+x]):['Y:CB1/I','Y:CB1/V'],rec={};for(const c of ch)rec[c]={t:[],y:[]};
 s.run((id==='trv_terminal'?0.059:0.0146)-s.t);
 while(s.t<pr.sim.stopT-1e-12){s.run(Math.min(s.h,pr.sim.stopT-s.t));for(const c of ch){rec[c].t.push(s.t);rec[c].y.push(s.now(c));}}
 const out={id,ov,warn:s.net.warnings};
 if(id==='trv_terminal'){const m=pr.meta.trv,spec=TRV.rated(m.Ur,m.duty,m.kpp,'S1',50);let best=null;
  for(const x of ['a','b','c']){const tz=zero(rec['Y:CB1/I'+x],m.topen);if(tz!==null&&(!best||tz<best.tz))best={tz,x};}
  if(best){const V=rec['Y:CB1/V'+best.x],t=[],u=[];for(let q=0;q<V.t.length;q++)if(V.t[q]>=best.tz&&V.t[q]<=best.tz+0.6e-3){t.push(V.t[q]-best.tz);u.push(V.y[q]);}
   const c=TRV.compare(t,u,spec);Object.assign(out,{pole:best.x,tz:best.tz,kpp:spec.kpp,uc_rated:spec.uc,rrrv_rated:spec.rrrv,ok:c.ok,uc:c.uc,rrrv:c.rrrv,ratio:c.ratio});}}
 else{const m=pr.meta.slf,I=rec['Y:CB1/I'],V=rec['Y:CB1/V'],a=TRV.slf(m.Ur,m.Isc,m.ratio,m.f),tau=m.LL/m.Z;let tz=null;
  for(let j=1;j<I.t.length;j++)if(I.t[j]>m.tsep&&I.y[j-1]*I.y[j]<=0){const ia=I.y[j-1],ib=I.y[j];tz=I.t[j-1]+(I.t[j]-I.t[j-1])*ia/(ia-ib);break;}
  let post=0,pk=0;for(let q=0;q<I.t.length;q++){const dt=I.t[q]-tz;if(dt>5e-6&&dt<100e-6)post=Math.max(post,Math.abs(I.y[q]));if(dt>=0&&dt<=2.6*tau)pk=Math.max(pk,Math.abs(V.y[q]));}
  Object.assign(out,{state:m.state,tz,post,last:I.y[I.y.length-1],peak:pk,peak_theory:2*a.u0+a.rrrv_slf*Math.max(2*tau-a.supply.td,0),u0:a.u0});}
 return out;}
const cases=[['trv_terminal',{}],['trv_terminal',{n:'2'}],['trv_terminal',{pole:'arc'}],['trv_terminal',{kind:'abcg'}],
 ['trv_slf',{}],['trv_slf',{ratio:'0.75'}],['trv_slf',{state:'weak'}],['trv_slf',{state:'weak',ratio:'0.75'}],
 ['trv_slf',{arc:'kema',state:'weak'}],['trv_slf',{arc:'kema',state:'weak',ratio:'0.75'}],
 ['trv_slf',{arc:'habedank',state:'weak'}],['trv_slf',{arc:'habedank',state:'weak',ratio:'0.75'}],['trv_slf',{arc:'mayr'}]];
process.stdout.write(JSON.stringify(cases.map(c=>run(...c))));
