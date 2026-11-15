// 4.17 (ROADMAP §59, THEORY §8Α): the PI/PID gains of a PWM from the circuit (web/studio/tune.js) as the netlist builder
// computes them, headless. Usage: node tune_cases.js '[{kind, …}, …]' -> JSON [result, …]
//  {kind:'design', id, opts, patch, f:[Hz…]}        a tutorial with the PWM patched: the design (converter, roles, D₀, G(0),
//                                                     gains, margins), G(j2πf) at the given frequencies, the warnings
//  {kind:'steady', id, opts, patch, T}              the mean of V:C*/I:L* over the last 2 ms of an open-loop run (and the D)
//  {kind:'fresp', id, opts, D, a, f, cycles, out}   open loop with d = D + a·sin(2πft) from an expression block: the
//                                                     fundamental at f of the per-period means of `out` over `cycles`
//                                                     cycles after a settling time, and of the duty
//  {kind:'run', id, opts, patch, at:[t…], keys}     the per-period mean of every key at each t (and the warnings, the gains)
//  {kind:'scipy', id, opts, patch, T, keys}         a short run and its SciPy export (MNA.exportForBatch)
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');global.Expr=require(W+'/expr.js');global.MNA=require(W+'/mna.js');require(W+'/tutorials.js');
const T=global.Tutorials;
// a tutorial with the defaults of its options (as in the app), then the patches
const build=o=>{const t=T.get(o.id),pr=t.build({...Object.fromEntries((t.options||[]).map(q=>[q.k,q.def])),...(o.opts||{})});for(const [id,ps] of Object.entries(o.patch||{})){const c=pr.components.find(q=>q.id===id);if(!c)throw new Error('no '+id);c.params={...c.params,...ps};}return pr;};
const perAvg=(s,key)=>{const p=s.per,i=s.chIndex.get(key);if(i===undefined)return NaN;const j=(p.head-1+p.cap)%p.cap;return p.avg[j*p.nch+i];};
const ctlOf=s=>{const k=s.net.ctrls[0];return {Kp:k.Kp,Ki:k.Ki,Kd:k.Kd,Tf:k.Tf,D0:k.D0,ff:k.ff};};
function design(o){const pr=build(o),s=new MNA.Sim(pr,{hDiv:20}),k=s.net.ctrls[0],d=k.design;
 const out={warn:s.net.warnings,ctl:ctlOf(s)};if(!d)return out;
 out.design={key:d.key,name:d.name,roles:d.roles,sign:d.sign,forcedOk:d.forcedOk,sensorRole:d.sensorRole,D0:d.D0,x0:d.x0,G0:d.G0,fr:d.fr,fz:d.fz,fc:d.fc,pm:d.pm,gm:Number.isFinite(d.gm)?d.gm:null,ms:d.ms,
  Kp:d.Kp,Ki:d.Ki,Kd:d.Kd,Tf:d.Tf,Tc:d.Tc,values:d.values,warn:d.warn,bode:(o.f||[]).map(f=>d.bode(f))};return out;}
function steady(o){const pr=build(o),s=new MNA.Sim(pr,{hDiv:o.hDiv||50}),Te=o.T||0.03,keys=o.keys||['V:C1','V:C2','I:L1','I:L2'],acc={},n0={};let n=0;
 while(s.t<Te-1e-12){s.run(Math.min(s.T,Te-s.t));if(s.t>Te-0.002){n++;for(const q of keys){const v=perAvg(s,q);if(Number.isFinite(v))acc[q]=(acc[q]||0)+v;}}}
 for(const q of keys)if(acc[q]!==undefined)n0[q]=acc[q]/n;return {mean:n0,warn:s.net.warnings};}
function fresp(o){const pr=build({id:o.id,opts:o.opts,patch:{PWM1:{mode:'ext'}}});
 pr.components.push({id:'EXD',type:'EXPR',x:230,y:-20,params:{expr:`${o.D} + ${o.a}*sin(2*pi*${o.f}*t)`,ins:'',pars:''}});pr.wires.push({a:{c:'EXD',p:'y'},b:{c:'PWM1',p:'d'}});
 const s=new MNA.Sim(pr,{hDiv:o.hDiv||40}),Tset=o.settle||0.02,Tf=1/o.f,cyc=o.cycles||4,keys=[o.out,'D:PWM1'];let a=[0,0],b=[0,0],n=0;
 while(s.t<Tset-1e-12)s.run(Math.min(s.T,Tset-s.t));
 const t0=s.t;while(s.t<t0+cyc*Tf-1e-12){s.run(s.T);const tm=s.t-s.T/2,w=2*Math.PI*o.f;keys.forEach((q,i)=>{const v=perAvg(s,q);a[i]+=v*Math.cos(w*tm);b[i]+=v*Math.sin(w*tm);});n++;}
 const ph=i=>[2*b[i]/n,2*a[i]/n];   // y ≈ A·sin(ωt + φ): [A cos φ, A sin φ]
 return {y:ph(0),d:ph(1),warn:s.net.warnings,T:s.T};}
function run(o){const pr=build(o),s=new MNA.Sim(pr,{hDiv:o.hDiv||20}),out=[];
 for(const t of o.at){s.run(t-s.t);out.push({t:s.t,...Object.fromEntries(o.keys.map(q=>[q,perAvg(s,q)])),D:perAvg(s,'D:PWM1')});}
 return {out,warn:s.net.warnings,ctl:ctlOf(s)};}
function scipy(o){const pr=build(o),s=new MNA.Sim(pr,{hDiv:o.hDiv||20,method:'TR'}),Te=o.T||0.004,rec=[];
 while(s.t<Te-1e-12){s.run(Math.min(s.T,Te-s.t));rec.push([s.t,...o.keys.map(q=>s.now(q))]);}
 return {rec,keys:o.keys,batch:MNA.exportForBatch(pr,o.keys),h:s.h,warn:s.net.warnings,ctl:ctlOf(s)};}
const F={design,steady,fresp,run,scipy};
const q=JSON.parse(process.argv[2]||'[]');process.stdout.write(JSON.stringify(q.map(o=>F[o.kind](o))));
