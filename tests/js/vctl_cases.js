// 5.0.18: the bus voltage control of the fourth exercise (tutorial voltage_ctl), built exactly as the studio builds it, run with
// the switching model. Usage: node vctl_cases.js -> JSON (per case: the means per period of the bus voltage around each step of
// the load, the branch currents, the reference of a branch, the timer of the overload, the powers at the end).
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');const MNA=require(W+'/mna.js');require(W+'/tutorials.js');
const T=globalThis.Tutorials;
function build(id,opts){const t=T.get(id);const o={};for(const op of t.options)o[op.k]=opts[op.k]??op.def;return t.build(o);}
function per(s,key){const p=s.per,i=s.chIndex.get(key);const t=[],avg=[],mn=[],mx=[];const st=(p.head-p.n+p.cap)%p.cap;
 for(let k=0;k<p.n;k++){const j=(st+k)%p.cap,o=j*p.nch+i;t.push(p.t[j]);avg.push(p.avg[o]);mn.push(p.min[o]);mx.push(p.max[o]);}return {t,avg,mn,mx};}
const last=(q,n=5)=>q.avg.slice(-n).reduce((a,b)=>a+b,0)/n;
const out={};
const ONLY=process.argv[2]?process.argv[2].split(','):null;
const CASES=[['lo_step',{vst:'lo',test:'step'}],['hi_step',{vst:'hi',test:'step'}],['lo_limit',{vst:'lo',test:'limit'}],['hi_limit',{vst:'hi',test:'limit'}],
 ['lo_profile',{vst:'lo',test:'profile'}],['hi_profile',{vst:'hi',test:'profile'}],['lo_raw',{vst:'lo',vs:'raw'}],['lo_both',{vst:'lo',vs:'both'}],
 ['lo_int',{vst:'lo',gain:'int'}],['lo_slow',{vst:'lo',gain:'slow'}]];
for(const [name,o] of CASES.filter(c=>!ONLY||ONLY.includes(c[0]))){const pr=build('voltage_ctl',o),m=pr.meta;const s=new MNA.Sim(pr,{hDiv:pr.sim.hDiv,method:pr.sim.method||'TR'});s.run(m.stopT);
 const v=per(s,'Y:MV'),r=per(s,'Y:EXl'),tm=per(s,'Y:PIt');
 // around each step of the load: the extreme of the instantaneous voltage, its instant after the step, and the last period whose
 // mean is outside V_ref ± band before the next step (the recovery)
 const steps=m.prof.slice(1).map(([t0,p],k)=>{const t1=k+2<m.prof.length?m.prof[k+2][0]:m.stopT,up=p>m.prof[k][1];let ex=up?Infinity:-Infinity,te=NaN,lastOut=-1,n=0;
  for(let i=0;i<v.t.length;i++)if(v.t[i]>t0&&v.t[i]<=t1+1e-12){n++;const y=up?v.mn[i]:v.mx[i];if(up?y<ex:y>ex){ex=y;te=v.t[i]-t0;}if(Math.abs(v.avg[i]-m.Vref)>m.band)lastOut=v.t[i];}
  return {t0,p,ext:ex,te,rec:lastOut<0?0:lastOut-t0,n};});
 const legs=[1,2,3,4].map(k=>last(per(s,'Y:AV'+k)));
 // the limit test: the reference of a branch per period before and after the timer reaches T_ol (the first period above I_n)
 const rt=(a,b)=>{const y=r.avg.filter((_,i)=>r.t[i]>a&&r.t[i]<=b);return y.length?{min:Math.min(...y),max:Math.max(...y)}:null;};
 const cross=tm.t.find((t,i)=>tm.avg[i]>=m.Tol);
 out[name]={warn:s.net.warnings,n:v.t.length,meta:{side:m.side,test:m.test,Vsrc:m.Vsrc,Rs:m.Rs,Cb:m.Cb,Vref:m.Vref,Vst:m.Vst,N:m.N,In:m.In,Iol:m.Iol,Tol:m.Tol,Pd:m.Pd,band:m.band,
   prof:m.prof,stopT:m.stopT,fs:m.fs,Ps:m.Ps,G:m.G,Kpv:m.Kpv,Kiv:m.Kiv,wv:m.wv,kp:m.kp,ki:m.ki,a:m.a,b:m.b,L:m.L,rows:m.rows},
  steps,v_end:last(v),legs,ref_end:s.now('Y:EXl'),tm_end:s.now('Y:PIt'),p_src:s.now('Y:AVps'),p_load:s.now('Y:AVpl'),p_conv:s.now('Y:AVpc'),
  ...(m.test==='limit'?{ref_ol:rt(cross-m.Tol/2,cross-5e-4),ref_after:rt(cross+1e-3,m.stopT),tol_cross:cross,over:r.t.find((t,i)=>Math.abs(r.avg[i])>m.In)}:{})};}
console.log(JSON.stringify(out));
