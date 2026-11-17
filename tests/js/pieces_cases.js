// 4.19.5 (ROADMAP §74, THEORY §3): the result of a run must not depend on the pieces in which run() is called.
// Usage: node pieces_cases.js -> JSON
//  gate   buck: the instants at which the gate of the PWM changes in the recorded points, in pieces of 5 steps and of 1 step
//         against the run in one piece; how many changes are recorded at another instant (a gate that switched a step late)
//  saw    the third exercise with the sawtooth carrier (sample at its reset): the held sample at the end and its range over
//         the last 40 samples, in pieces of T/200 ... 7T/3 against one piece; fixed and variable step
//  state  tutorials with a sample-and-hold or a comparator: the mean and the RMS of every capacitor voltage and inductor
//         current over the last base period, pieces of 1 step against one piece, scaled by the largest RMS of the kind
// Each with the default (solve.evSnap on) and with the path of before 4.19.5 (evSnap 'off').
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');global.Expr=require(W+'/expr.js');global.StepCheck=require(W+'/stepcheck.js');
global.LineModels=require(W+'/linemodels.js');for(const f of ['netlib','subcircuit','bus','units','nn'])require(W+'/'+f+'.js');
global.MNA=require(W+'/mna.js');require(W+'/tutorials.js');
const T=globalThis.Tutorials,MODES=[['on',{}],['off',{evSnap:'off'}]];
function build(id,over){const t=T.get(id),o={};for(const q of t.options||[])o[q.k]=q.def;return t.build(Object.assign(o,over||{}));}
function mk(pr,extra){return new MNA.Sim(pr,{hDiv:pr.sim?.hDiv,method:pr.sim?.method||'TR',...extra});}
function pieces(s,D,c){const n=Math.round(D/c);for(let k=0;k<n;k++)s.run(c);if(s.t<D-s.h*1e-6)s.run(D-s.t);return s;}
const R={};
// ---------------------------------------------------------------- the gate of a PWM
{const pr=build('buck'),key='G:PWM1',K=75;
 const changes=s=>{const out=[];let prev=null;const rec=s.recordNow.bind(s);s.recordNow=function(){rec();const v=s.now(key);if(prev!==null&&v!==prev)out.push(s.t);prev=v;};return out;};
 const A=mk(pr,{}),ca=changes(A);A.run(K*A.T);R.gate={h:A.h,T:A.T,periods:K,changes:ca.length};
 for(const [m,extra] of MODES)for(const c of [5,1]){const B=mk(pr,extra),cb=changes(B);pieces(B,K*B.T,c*B.h);
  let late=0,first=null,worst=0;for(let k=0;k<Math.max(ca.length,cb.length);k++){const d=Math.abs((cb[k]??Infinity)-(ca[k]??Infinity))/A.h;if(d>worst)worst=d;if(d>.5){late++;if(first===null)first=Math.floor(ca[k]/A.T)+1;}}
  R.gate[m+'_'+c]={n:cb.length,late,first,worst:Number.isFinite(worst)?worst:'inf',evSnap:B.evSnap};}}
// ---------------------------------------------------------------- the sawtooth carrier, the sample at its reset
{const pr=build('current_ctl',{carrier:'saw'}),m=pr.meta,Tp=1/m.fs,D=m.t1-2*Tp;R.saw={T:Tp,D,hDiv:pr.sim.hDiv};
 const held=s=>{const v=s.samples('SHi').v.slice(-40);return {last:v[v.length-1],range:Math.max(...v)-Math.min(...v),n:s.samples('SHi').v.length};};
 for(const [sm,step] of [['fixed',{}],['var',{step:{mode:'var'}}]]){const one=mk(pr,step);one.run(D);const o=held(one);R.saw[sm]={one:o};
  for(const [md,extra] of MODES){const r={};for(const [name,div] of [['T/200',200],['T/100',100],['T/60',60],['T/30',30],['T/10',10],['T/3',3],['7T/3',3/7]]){
    if(sm==='var'&&!['T/200','T/100','T/30'].includes(name))continue;const h=held(pieces(mk(pr,{...step,...extra}),D,Tp/div));r[name]={dlast:Math.abs(h.last-o.last),range:h.range,n:h.n};}
   R.saw[sm][md]=r;}}}
// ---------------------------------------------------------------- the states of other tutorials
{const STATE=k=>/^V[0-9a-z]*:(.*\/)?C[^\/]*$/.test(k)||/^I[0-9a-z]*:(.*\/)?L[^\/]*$/.test(k);
 const per=s=>{const p=s.per,j=(p.head-1+p.cap)%p.cap;return {t:p.t[j],a:i=>p.avg[j*p.nch+i],r:i=>p.rms[j*p.nch+i]};};
 R.state={};
 for(const id of ['sampling','blocks_loop','sub_legs','pcm_chaos']){const pr=build(id),A=mk(pr,{}),D=Math.max(3,Math.round(12000*A.h/A.T))*A.T;A.run(D);
  const keys=A.channelKeys().filter(STATE),pa=per(A),sc={};for(const k of keys){const g=k.split(':')[0],v=pa.r(A.chIndex.get(k));if(Number.isFinite(v))sc[g]=Math.max(sc[g]||0,Math.abs(v));}
  const row={keys:keys.length,periods:Math.round(D/A.T)};
  for(const [md,extra] of MODES){const B=pieces(mk(pr,extra),D,A.h),pb=per(B);let w=Math.abs(pa.t-pb.t)<1e-6*A.T?0:Infinity,wk='';
   if(w===0)for(const k of keys){const i=A.chIndex.get(k),j=B.chIndex.get(k),s=sc[k.split(':')[0]];if(!(s>0))continue;
    for(const d of [Math.abs(pa.a(i)-pb.a(j))/s,Math.abs(pa.r(i)-pb.r(j))/s])if(d>w){w=d;wk=k;}}
   row[md]={worst:Number.isFinite(w)?w:'inf',key:wk};}
  R.state[id]=row;}}
process.stdout.write(JSON.stringify(R));
