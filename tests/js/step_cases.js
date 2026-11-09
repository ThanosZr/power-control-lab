// Step of the solver (3.13, ROADMAP §40): variable step against closed forms and the fixed step, the step checks
// (time constants, oscillations, switch parasitics) and the run-time messages. Usage: node step_cases.js -> JSON
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');global.StepCheck=require(W+'/stepcheck.js');const MNA=require(W+'/mna.js');require(W+'/tutorials.js');
const T=globalThis.Tutorials;
function project(comps,conns,solve){let n=0;return {components:comps.map(c=>({x:0,y:0,rot:0,...c})),wires:conns.map(([a,b])=>{const [ac,ap]=a.split(':'),[bc,bp]=b.split(':');return {id:'w'+(n++),a:{c:ac,p:ap},b:{c:bc,p:bp},pts:[]};}),solve};}
function build(id,opts={}){const t=T.get(id);const o={};for(const op of t.options)o[op.k]=opts[op.k]??op.def;return t.build(o);}
function last(s,key,n=1){const p=s.per,i=s.chIndex.get(key);let a=0,mx=-Infinity,mn=Infinity;for(let k=1;k<=n;k++){const j=(p.head-k+p.cap)%p.cap,o=j*p.nch+i;a+=p.avg[o];mx=Math.max(mx,p.max[o]);mn=Math.min(mn,p.min[o]);}return {avg:a/n,max:mx,min:mn};}
// the largest deviation of a recorded channel from f(t)
function maxErr(s,key,f){const r=s.ring,i=s.chIndex.get(key);let e=0;for(let j=0;j<r.n;j++)e=Math.max(e,Math.abs(r.d[j*r.nch+i]-f(r.t[j])));return e;}
function peak(s,key){const r=s.ring,i=s.chIndex.get(key);let m=-Infinity,tm=0;for(let j=0;j<r.n;j++){const v=r.d[j*r.nch+i];if(v>m){m=v;tm=r.t[j];}}return {v:m,t:tm};}
const out={};

// 1) series RLC discharge (C 1 µF at 10 V, L 10 µH, R 0.5 Ω): v_C = V₀e^(−αt)(cos ω_d t + α/ω_d sin ω_d t)
{const R=.5,L=10e-6,C=1e-6,a=R/(2*L),wd=Math.sqrt(1/(L*C)-a*a),vex=t=>10*Math.exp(-a*t)*(Math.cos(wd*t)+a/wd*Math.sin(wd*t));
 const mk=solve=>project([{id:'C1',type:'C',params:{C,v0:10}},{id:'L1',type:'L',params:{L}},{id:'R1',type:'R',params:{R}},{id:'G',type:'GND'}],[['C1:p','L1:a'],['L1:b','R1:a'],['R1:b','G:g'],['C1:n','G:g']],{tbase:1e-4,...solve});
 const res={};for(const [k,solve,hDiv] of [['fixed200',{},200],['fixed2000',{},2000],['var',{step:'var'},200],['var6',{step:'var',rtol:1e-6},200]]){const s=new MNA.Sim(mk(solve),{hDiv});s.run(1e-4);res[k]={err:maxErr(s,'V:C1',vex),steps:s.steps,rej:s.nRej||0};}
 const s=new MNA.Sim(mk({}),{hDiv:50});const d=s.stepCheck().find(x=>x.f);res.mode_f=d?d.f:null;res.f_theory=wd/(2*Math.PI);res.mode_ids=d?d.ids:null;out.rlc=res;}

// 2) impulse generator, one stage (IEC 60060-1 circuit): C₁ 50 nF charged to 100 kV, R₁ 400 Ω series, R₂ 2.6 kΩ and C₂ 1 nF;
//    v₂(t) from the two roots of the second-order circuit, against the fixed and the variable step
{const C1=50e-9,C2=1e-9,R1=400,R2=2600,V0=1e5;
 const a=R1*R2*C1*C2,b=R1*C1+R2*C1+R2*C2,c=1,disc=Math.sqrt(b*b-4*a*c),s1=(-b+disc)/(2*a),s2=(-b-disc)/(2*a); // a s² + b s + 1 = 0
 // v₂ = V₀/(R₁C₂)·(e^{s1 t} − e^{s2 t})/(s1 − s2)
 const v2=t=>V0/(R1*C2)*(Math.exp(s1*t)-Math.exp(s2*t))/(s1-s2);
 const mk=solve=>project([{id:'C1',type:'C',params:{C:C1,v0:V0}},{id:'R1',type:'R',params:{R:R1}},{id:'R2',type:'R',params:{R:R2}},{id:'C2',type:'C',params:{C:C2}},{id:'G',type:'GND'}],
  [['C1:p','R1:a'],['R1:b','C2:p'],['C2:p','R2:a'],['R2:b','G:g'],['C2:n','G:g'],['C1:n','G:g']],{tbase:1e-4,...solve});
 const res={vpk:v2(Math.log(s2/s1)/(s1-s2))};
 for(const [k,solve,hDiv] of [['fixed',{},5000],['var',{step:'var'},200]]){const s=new MNA.Sim(mk(solve),{hDiv});s.run(1e-4);res[k]={err:maxErr(s,'V:C2',v2),steps:s.steps,pk:peak(s,'V:C2').v};}
 out.impulse=res;}

// 3) flyback with the leakage clamp (energy into the clamp right after every turn-off): variable step against a fine fixed step
{const r={};for(const [k,solve,hDiv] of [['fixed400',{},400],['fixed2000',{},2000],['var',{step:'var'},400]]){const pr=build('flyback',{lk:'clamp'});pr.solve={...(pr.solve||{}),...solve};
  const s=new MNA.Sim(pr,{hDiv,method:'TR'});s.run(3e-3);r[k]={vc:last(s,'V:Cc',20).avg,vo:last(s,'V:C1',20).avg,prc:last(s,'P:Rc',20).avg,steps:s.steps};}
 out.flyback=r;}

// 4) Marx generator (spark gaps fire by overvoltage): the same peak and T1 with half the steps
{const r={};for(const [k,solve] of [['fixed',{}],['var',{step:'var'}]]){const pr=build('marx',{});pr.solve={...(pr.solve||{}),...solve};const s=new MNA.Sim(pr,{hDiv:pr.sim.hDiv,method:'TR'});s.run(pr.sim.stopT);
  r[k]={pk:peak(s,'N:C2:p').v,steps:s.steps};}
 out.marx=r;}

// 5) step checks: RC with τ = 1 µs at h = 5 µs (warning), the same RC at h = 0.2 µs (nothing), a buck (switch parasitics only)
{const mk=(C,solve)=>project([{id:'V1',type:'VDC',params:{V:10}},{id:'R1',type:'R',params:{R:1}},{id:'C1',type:'C',params:{C}},{id:'R2',type:'R',params:{R:1e6}},{id:'G',type:'GND'}],
  [['V1:p','R1:a'],['R1:b','C1:p'],['C1:p','R2:a'],['R2:b','G:g'],['C1:n','G:g'],['V1:n','G:g']],{tbase:1e-3,...solve});
 const a=new MNA.Sim(mk(1e-6),{hDiv:200}).stepCheck(),b=new MNA.Sim(mk(1e-6),{hDiv:5000}).stepCheck(),c=new MNA.Sim(mk(1e-9),{hDiv:200}).stepCheck();
 const pick=l=>l.map(d=>({sev:d.sev,key:d.key,tau:d.tau||null,ids:d.ids||null,id:d.id||null}));
 const buck=new MNA.Sim(build('buck',{}),{hDiv:200}).stepCheck();
 const sch=build('schering',{});const ss=new MNA.Sim(sch,{hDiv:sch.sim.hDiv}).stepCheck();
 out.check={rc_coarse:pick(a),rc_fine:pick(b),rc_alg:pick(c),buck:pick(buck),schering:pick(ss)};}

// 6) run-time messages: a programmed jump of the source with τ ≪ h (the trapezoidal rule rings), and none in a clean run
{const mk=sched=>project([{id:'V1',type:'VDC',params:{V:0,sched}},{id:'R1',type:'R',params:{R:1}},{id:'C1',type:'C',params:{C:1e-8}},{id:'R2',type:'R',params:{R:1e6}},{id:'G',type:'GND'}],
  [['V1:p','R1:a'],['R1:b','C1:p'],['C1:p','R2:a'],['R2:b','G:g'],['C1:n','G:g'],['V1:n','G:g']],{tbase:1e-3});
 const s=new MNA.Sim(mk('0:0, 1m:10'),{hDiv:200});s.run(3e-3);const s2=new MNA.Sim(mk('0:0, 1m:10'),{hDiv:200,method:'BDF2'});s2.run(3e-3);
 const rt=x=>x.diagnostics().filter(d=>!d.pre).map(d=>({key:d.key,sev:d.sev,id:d.id,t:d.t}));out.runtime={tr:rt(s),bdf2:rt(s2)};}

// 7) the variable step leaves the fixed one untouched: the same buck run twice gives the same numbers, and switching
//    the mode on a running simulation carries on from the same state
{const pr=build('buck',{start:'steady'});const a=new MNA.Sim(pr,{hDiv:200});a.run(1e-3);const v1=a.now('V:C1');a.setStepMode({mode:'var'});a.run(1e-3);
 const b=new MNA.Sim(pr,{hDiv:200});b.run(2e-3);out.mode_switch={fixed_then_var:a.now('V:C1'),fixed:b.now('V:C1'),at1ms:v1,var:a.var};}
console.log(JSON.stringify(out));
