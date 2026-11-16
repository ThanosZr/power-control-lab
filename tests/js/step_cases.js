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

// 6) programmed jumps (3.15): the step that ends on the jump sees the value before it, the jump gets the post-jump point at the same
//    instant and backward-Euler steps after it, so the trapezoidal rule no longer rings on a stiff RC (τ = 10 ns, h = 5 μs). The same
//    with the variable step (τ = 1 μs), a resistance program and a constant block driving the source, against the closed form.
//    A clock signal driving the source is not a program: the trapezoidal rule still rings there and the console says so (BDF2 damps it).
{const rc=(src,C=1e-8,extra=[],econ=[])=>project([src,{id:'R1',type:'R',params:{R:1}},{id:'C1',type:'C',params:{C}},{id:'R2',type:'R',params:{R:1e6}},{id:'G',type:'GND'},...extra],
  [['V1:p','R1:a'],['R1:b','C1:p'],['C1:p','R2:a'],['R2:b','G:g'],['C1:n','G:g'],['V1:n','G:g'],...econ],{tbase:1e-3});
 const par=(a,b)=>a*b/(a+b),tj=1e-3;
 // largest deviation from the closed form before and after the jump (after: from 2 steps on), and the points recorded at the jump
 const jump=(pr,opts,f0,f1)=>{const s=new MNA.Sim(pr,{hDiv:200,...opts});s.run(3e-3);const r=s.ring,i=s.chIndex.get('V:C1');let before=0,after=0,nAt=0;
   for(let j=0;j<r.n;j++){const t=r.t[j],v=r.d[j*r.nch+i];if(t<tj-1e-12)before=Math.max(before,Math.abs(v-f0(t)));else if(Math.abs(t-tj)<1e-12)nAt++;else if(t>tj+2*s.h)after=Math.max(after,Math.abs(v-f1(t)));}
   return {before,after,nAt,diag:s.diagnostics().filter(d=>!d.pre).map(d=>d.key),steps:s.steps};};
 const vsrc={id:'V1',type:'VDC',params:{V:0,sched:'0:0, 1m:10'}},V=10*1e6/(1e6+1),zero=()=>0;
 const charge=(V,tau,v0=0)=>t=>V+(v0-V)*Math.exp(-(t-tj)/tau);
 const pR=rc({id:'V1',type:'VDC',params:{V:10}});pR.components[1].params={R:1e6,sched:'0:1e6, 1m:1'};
 const tR0=par(1e6,1e6)*1e-8,v0=5*(1-Math.exp(-tj/tR0));
 out.jump={tr:jump(rc(vsrc),{},zero,charge(V,par(1,1e6)*1e-8)),
  var:jump(rc(vsrc,1e-6),{step:{mode:'var'}},zero,charge(V,par(1,1e6)*1e-6)),
  res:jump(pR,{},t=>5*(1-Math.exp(-t/tR0)),charge(V,par(1,1e6)*1e-8,v0)),
  blk:jump(rc({id:'V1',type:'VDC',params:{ctl:'sig'}},1e-8,[{id:'K1',type:'CONST',params:{v:'0:0, 1m:10'}}],[['K1:y','V1:u']]),{},zero,charge(V,par(1,1e6)*1e-8))};
 const clk=rc({id:'V1',type:'VDC',params:{ctl:'sig'}},1e-8,[{id:'CK',type:'CLK',params:{f:500,duty:.5}}],[['CK:y','V1:u']]);
 const s=new MNA.Sim(clk,{hDiv:200});s.run(3e-3);const s2=new MNA.Sim(clk,{hDiv:200,method:'BDF2'});s2.run(3e-3);
 const rt=x=>x.diagnostics().filter(d=>!d.pre).map(d=>({key:d.key,sev:d.sev,id:d.id,t:d.t}));out.runtime={tr:rt(s),bdf2:rt(s2)};}

// 6b) the step check of every topology met during the run (3.15): a switch connects a small RC (τ ≈ 10 ns) only while it conducts. The check
//     before the run (switch off) does not see it; the run reports it once, at the first switching, with the conducting elements, and the
//     variable step with the trapezoidal rule takes the 2τ cap of each topology (not the cap of the topology at the start)
{const mk=step=>project([{id:'V1',type:'VDC',params:{V:10}},{id:'R0',type:'R',params:{R:100}},{id:'C0',type:'C',params:{C:1e-6}},
   {id:'S1',type:'SW',params:{gate:'sig'}},{id:'RS',type:'R',params:{R:1}},{id:'CS',type:'C',params:{C:1e-8}},{id:'CK',type:'CLK',params:{f:1000,duty:.5,phase:180}},{id:'G',type:'GND'}],
  [['V1:p','R0:a'],['R0:b','C0:p'],['C0:n','G:g'],['V1:n','G:g'],['R0:b','S1:d'],['S1:s','RS:a'],['RS:b','CS:p'],['CS:n','G:g'],['CK:y','S1:g']],{tbase:1e-3,...(step||{})});
 const s=new MNA.Sim(mk(),{hDiv:200});s.stepCheck();const g0=s.gateSigPeek(0);s.run(3e-3);
 const v=new MNA.Sim(mk({step:'var'}),{hDiv:200});v.run(3e-3);const caps=[...v.topo.values()].map(r=>r.cap);
 out.topo={gate0:g0,pre:s.dgPre.map(d=>d.key),run:s.diagnostics().filter(d=>!d.pre).map(d=>({key:d.key,sev:d.sev,n:d.n,t:d.t,ids:d.ids,msg:d.msg})),ntopo:s.topo.size,
  var:{caps,steps:v.steps,vC0:v.now('V:C0'),fixed:s.now('V:C0')}};}

// 7) the variable step leaves the fixed one untouched: the same buck run twice gives the same numbers, and switching
//    the mode on a running simulation carries on from the same state
{const pr=build('buck',{start:'steady'});const a=new MNA.Sim(pr,{hDiv:200});a.run(1e-3);const v1=a.now('V:C1');a.setStepMode({mode:'var'});a.run(1e-3);
 const b=new MNA.Sim(pr,{hDiv:200});b.run(2e-3);out.mode_switch={fixed_then_var:a.now('V:C1'),fixed:b.now('V:C1'),at1ms:v1,var:a.var};}
// 8) 4.19.1 (decision 243): the smallest step as a setting (solve.hmin), the largest step from the circuit with its reason
//    (stepInfo, stepcheck.js limit) and the warnings when the step asked for passes it
{const rc=(C,solve)=>project([{id:'V1',type:'VAC',params:{Vpk:10,f:50}},{id:'R1',type:'R',params:{R:1000}},{id:'C1',type:'C',params:{C}},{id:'G',type:'GND'}],
  [['V1:p','R1:a'],['R1:b','C1:p'],['C1:n','G:g'],['V1:n','G:g']],solve||{});
 const lim=(pr,opts)=>{const s=new MNA.Sim(pr,opts||{hDiv:pr.sim?.hDiv||200,method:pr.sim?.method}),q=s.stepInfo(),L=q.limit;
  return {h:q.h,now:q.now,over:q.over,minOver:q.minOver,kind:L.kind,lim:L.h,hVar:L.hVar,kindVar:L.kindVar,alg:L.alg,why:L.why,T:q.T,hMin:q.hMin,hMinAuto:q.hMinAuto,hMinSet:q.hMinSet,
   warn:s.dgPre.filter(d=>d.sev==='warn').map(d=>d.key.split(':')[0]),fmax:Math.max(0,...s.dgPre.filter(d=>d.f).map(d=>d.f))};};
 const o={};
 // τ = 1 ms on a 50 Hz source: the ceiling is 2τ = 2 ms (the source alone: T/8 = 2,5 ms); T/50 is under it, T/5 over it
 o.tau_ok=lim(rc(1e-6),{hDiv:50});o.tau_over=lim(rc(1e-6),{hDiv:5});
 // τ = 1 µs: instantaneous at T/5 = 4 ms (the source decides, and the step passes it); at T/50 = 0,4 ms it counts again (2τ = 2 µs)
 o.alg=lim(rc(1e-9),{hDiv:5});o.back=lim(rc(1e-9),{hDiv:50});
 // a PWM (4 steps per switching period), a line (its travel time), a network with algebraic relations (no «oscillation» at 10²⁰ Hz)
 o.buck=lim(build('buck',{}),{hDiv:200});o.line=lim(build('cable_xb',{}));o.ieee9=lim(build('ieee9_emt',{}));
 // variable step: the largest step T/5 against the source (τ = 10 ms, so the 2τ cap of the trapezoidal rule is above it); T/50 is fine
 o.var_ok=lim(rc(1e-5,{step:'var'}),{hDiv:200});o.var_over=lim(rc(1e-5,{step:'var',hmax:5}),{hDiv:200});
 // the smallest step: «Αυτόματα» = max(h/1000, T·10⁻¹⁰); a value of the user; a value above the ceiling of the circuit
 o.hmin_auto=lim(rc(1e-6,{step:'var'}),{hDiv:200});o.hmin_user=lim(rc(1e-6,{step:'var',hmin:1e-9}),{hDiv:200});o.hmin_over=lim(rc(1e-6,{step:'var',hmax:5,hmin:3e-3}),{hDiv:200});
 o.hmin_opt=(()=>{const s=new MNA.Sim(rc(1e-6),{hDiv:200,step:{mode:'var',hmin:2e-8}});return {hMin:s.hMin,set:s.stepInfo(false).hMinSet};})();
 // the RLC discharge of 1) with the variable step at rtol 10⁻⁶: «Αυτόματα» and its value written out give the same run; a smallest
 // step equal to the first step holds the step there (the note becomes a warning after 50 times); 1 ns lets it through
 {const R=.5,L=10e-6,C=1e-6,a=R/(2*L),wd=Math.sqrt(1/(L*C)-a*a),vex=t=>10*Math.exp(-a*t)*(Math.cos(wd*t)+a/wd*Math.sin(wd*t));
  const mk=solve=>project([{id:'C1',type:'C',params:{C,v0:10}},{id:'L1',type:'L',params:{L}},{id:'R1',type:'R',params:{R}},{id:'G',type:'GND'}],[['C1:p','L1:a'],['L1:b','R1:a'],['R1:b','G:g'],['C1:n','G:g']],{tbase:1e-4,step:'var',rtol:1e-6,...solve});
  const go=solve=>{const s=new MNA.Sim(mk(solve),{hDiv:200});s.run(1e-4);const ms=s.diagnostics().filter(d=>d.key.startsWith('minstep'));
   return {steps:s.steps,rej:s.nRej||0,v:s.now('V:C1'),err:maxErr(s,'V:C1',vex),hMin:s.hMin,auto:s.hMinAuto,atMin:s.stepInfo(false).atMin,note:ms.map(d=>({sev:d.sev,n:d.n,fix:d.fix}))};};
  const A=go({}),B=go({hmin:A.auto}),Cc=go({hmin:5e-7}),D=go({hmin:1e-9});
  o.rlc={auto:A,same:A.steps===B.steps&&Object.is(A.v,B.v)&&A.rej===B.rej,coarse:Cc,fine:D};}
 // the step check off the page (scenario.js): the list alone as before, and with lim the largest step too
 {const SCN=require(W+'/scenario.js'),pr=rc(1e-6);const a=SCN.handle({action:'stepcheck',project:pr,opts:{hDiv:5}}),b=SCN.handle({action:'stepcheck',lim:true,project:pr,opts:{hDiv:5}});
  o.worker={list:Array.isArray(a),keys:a.map(d=>d.key.split(':')[0]),lim:b.lim?{h:b.lim.h,kind:b.lim.kind}:null,same:JSON.stringify(a)===JSON.stringify(b.list)};}
 out.limits=o;}
console.log(JSON.stringify(out));
