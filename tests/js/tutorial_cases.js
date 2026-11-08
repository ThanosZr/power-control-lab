// The new tutorials, built exactly as the studio builds them, against theory.
// Usage: node tutorial_cases.js -> JSON
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');const MNA=require(W+'/mna.js');require(W+'/tutorials.js');const M=require(W+'/metrics.js');
const T=globalThis.Tutorials;
function build(id,opts){const t=T.get(id);const o={};for(const op of t.options)o[op.k]=opts[op.k]??op.def;return t.build(o);}
function per(s,key){const p=s.per,i=s.chIndex.get(key);const t=[],y=[];const st=(p.head-p.n+p.cap)%p.cap;for(let k=0;k<p.n;k++){const j=(st+k)%p.cap;t.push(p.t[j]);y.push(p.avg[j*p.nch+i]);}return {t,y};}
function last(s,key,n=1){const p=s.per,i=s.chIndex.get(key);let a=0,q=0,mn=Infinity,mx=-Infinity;for(let k=1;k<=n;k++){const j=(p.head-k+p.cap)%p.cap,o=j*p.nch+i;a+=p.avg[o];q+=p.rms[o]**2;mn=Math.min(mn,p.min[o]);mx=Math.max(mx,p.max[o]);}return {avg:a/n,rms:Math.sqrt(q/n),min:mn,max:mx};}
function sim(pr,dur){const s=new MNA.Sim(pr,{hDiv:pr.sim.hDiv,method:pr.sim.method||'TR'});s.run(dur);return s;}
const out={};const t0=Date.now();
for(const ctrl of ['pi','pid']){const pr=build('buck_vloop',{ctrl});const s=sim(pr,pr.sim.stopT);const {t,y}=per(s,'V:C1');
 const ref=t=>t<.004?12:15;const a=M.responseMetrics({t,y,tStep:.004,tEnd:.010,ref}),b=M.responseMetrics({t,y,tStep:.010,tEnd:.018,ref});
 out['vloop_'+ctrl]={vo_end:last(s,'V:C1',20).avg,il_end:last(s,'I:L1',20).avg,os:a.overshoot,ts:a.ts,rise:a.rise,ess:a.ess,iae:a.IAE,load_dev:b.maxDev,load_ts:b.ts,load_disturbance:b.disturbance};}
for(const load of ['r','rl'])for(const alpha of ['0','60','90']){const pr=build('scr1',{load,alpha});const s=sim(pr,load==='rl'?.2:.06);out[`scr1_${load}_${alpha}`]={vd:last(s,'N:'+s.net.pinNet.get('JPR:j').canon,2).avg,id:last(s,'I:R1',2).avg};}
for(const dev of ['diode','30','60'])for(const load of ['r','rl']){const pr=build('bridge3',{dev,load});const s=sim(pr,.06);const vr=last(s,'V:R1',2),ia=last(s,'I:V1',2);out[`b3_${dev}_${load}`]={vR:vr.avg,vmin:vr.min,vmax:vr.max,id:last(s,'I:R1',2).avg,ia_rms:ia.rms};}
{const pr=build('flyback',{lk:'clamp'});const s=sim(pr,3e-3);out.fly_clamp={vo:last(s,'V:C1',20).avg,vsw_max:last(s,'V:S1',5).max,vc:last(s,'V:Cc',20).avg,prc:last(s,'P:Rc',20).avg,im_pk:last(s,'I:T1',5).max};}
{const pr=build('flyback',{lk:'ideal'});const s=sim(pr,3e-3);out.fly_ideal={vo:last(s,'V:C1',20).avg,vsw_max:last(s,'V:S1',5).max};}
for(const ctrl of ['fixed','pi']){const pr=build('battery',{sw:'real',ctrl});const s=sim(pr,ctrl==='pi'?.006:.002);out['bat_real_'+ctrl]={il:last(s,'I:L1',5).avg,psw1:last(s,'PSW:S1',5).avg,psw2:last(s,'PSW:S2',5).avg,p1:last(s,'P:S1',5).avg,p2:last(s,'P:S2',5).avg};}
// steady-state starts (CCM and DCM): the output must not drift away from where it starts
for(const [id,o] of [['buck',{load:'10',start:'steady'}],['buck',{load:'50',start:'steady'}],['boost',{load:'20',start:'steady'}],['boost',{load:'200',start:'steady'}]]){
 const pr=build(id,o);const v0=pr.components.find(c=>c.id==='C1').params.v0;const s=new MNA.Sim(pr,{hDiv:pr.sim.hDiv});s.run(5*s.T);const a=last(s,'V:C1',5).avg;s.run(195*s.T);
 out[`start_${id}_${o.load}`]={v0,first:a,after:last(s,'V:C1',5).avg};}
// exercise 2: sampling of the inductor current on the carrier (counts, positions, values, PI on the sample)
for(const kase of ['saw','tri1','tri2'])for(const start of ['midoff','midon','none']){const pr=build('sampling',{case:kase,start});const m=pr.meta;const s=new MNA.Sim(pr,{hDiv:pr.sim.hDiv});s.run(50*m.T);
 const L=s.samples('SH1'),il=last(s,'I:L1',5);out[`smp_${kase}_${start}`]={n50:L.t.filter(t=>t<50*m.T-1e-12).length,first:L.t[0],last:L.v[L.v.length-1],lastT:L.t[L.t.length-1],avg:il.avg,pp:il.max-il.min,I:m.I,dI:m.dI,T:m.T,phase:m.phaseDeg};}
for(const kase of ['saw','tri1']){const pr=build('sampling',{case:kase,ctrl:'pi'});const s=sim(pr,12e-3);const L=s.samples('SH1');out['smp_pi_'+kase]={sample:L.v[L.v.length-1],avg:last(s,'I:L1',5).avg,d:s.now('D:PWM1')};}
// exercise 2: polyphase, N legs on a common clock (branch and summed ripple, sharing, cancellation)
for(const [N,drive,vst,fs,L] of [[4,'shift','mid','20000','design'],[4,'common','mid','20000','design'],[4,'shift','cancel','20000','design'],[4,'shift','max','20000','design'],[5,'shift','mid','20000','design'],[4,'shift','mid','40000','keep'],[4,'shift','mid','40000','design']]){
 const pr=build('polyphase',{N:String(N),drive,vst,fs,L});const m=pr.meta;const s=new MNA.Sim(pr,{hDiv:pr.sim.hDiv});s.run(20*m.T);const legs=[...Array(N).keys()].map(k=>last(s,'I:L'+(k+1),5));const sm=last(s,'I:VB',5);
 out[`poly_${N}_${drive}_${vst}_${fs}_${L}`]={L:m.L,Lmin:m.Lmin,vst:m.vst,D:m.D,T:m.T,Ik:m.Ik,legAvg:legs.map(x=>x.avg),legPP:legs.map(x=>x.max-x.min),legPk:Math.max(...legs.map(x=>Math.max(Math.abs(x.max),Math.abs(x.min)))),sumAvg:sm.avg,sumPP:sm.max-sm.min,phases:m.phases};}
// 2.6: current sharing (winding resistance, per-phase PI) and the double update in the sampling exercise
for(const [ctrl,mis] of [['open','dcr'],['pi','dcr'],['open','L']]){const pr=build('polyphase',{ctrl,mis});const s=sim(pr,.02);out[`share_${ctrl}_${mis}`]={legs:[1,2,3,4].map(k=>last(s,'I:L'+k,5).avg),pp:[1,2].map(k=>{const q=last(s,'I:L'+k,1);return q.max-q.min;}),sum:last(s,'I:VB',5).avg};}
{const pr=build('polyphase',{ctrl:'pi'});const s=new MNA.Sim(pr,{hDiv:pr.sim.hDiv});s.run(.002);for(let k=1;k<=4;k++)s.setControl('PWM'+k,{phase:0});s.run(.006);out.share_pi_toggle=[1,2,3,4].map(k=>last(s,'I:L'+k,5).avg);}
for(const upd of ['single','double']){const pr=build('sampling',{case:'tri2',ctrl:'pi',upd});const s=new MNA.Sim(pr,{hDiv:pr.sim.hDiv});s.run(.0024);const a=s.samples('SH1').v.at(-1);s.run(.0096);
 const p=s.per,i=s.chIndex.get('D:PWM1'),j=(p.head-1+p.cap)%p.cap;out['smp_upd_'+upd]={at24:a,end:s.samples('SH1').v.at(-1),dmin:p.min[j*p.nch+i],dmax:p.max[j*p.nch+i]};}
// 3.0: current loop from blocks (built-in PI, PWM with input d, carrier + comparator, z⁻¹) and peak current-mode
for(const [ctrl,mod,delay] of [['builtin','pwm','none'],['blocks','pwm','none'],['blocks','cmp','none'],['blocks','pwm','z1'],['blocks','cmp','z1']]){const pr=build('blocks_loop',{ctrl,mod,delay});const s=sim(pr,.004);
 const key=ctrl==='builtin'?'I:L1':'Y:AM1',p=s.per,i=s.chIndex.get(key);const rows=[];for(let k=0;k<p.n;k++){const j=(p.head-p.n+k+p.cap)%p.cap;rows.push({t:p.t[j],mn:p.min[j*p.nch+i]});}
 const after=rows.filter(r=>r.t>.002+2e-5&&r.t<.0028);out[`bl_${ctrl}_${mod}_${delay}`]={valley:last(s,key,5).min,avg:last(s,key,5).avg,d:mod==='cmp'?last(s,'GS:S1',5).avg:last(s,'D:PWM1',5).avg,vpk:Math.max(...after.map(r=>r.mn)),warn:s.net.warnings,err:null};}
for(const [D,ramp] of [['0.4','none'],['0.6','none'],['0.6','half'],['0.7','full']]){const pr=build('peak_cm',{D,ramp});const s=sim(pr,2e-3);const pk=[],dd=[];const p=s.per,i=s.chIndex.get('Y:AM1'),g=s.chIndex.get('GS:S1');
 for(let k=6;k>=1;k--){const j=(p.head-k+p.cap)%p.cap;pk.push(p.max[j*p.nch+i]);dd.push(p.avg[j*p.nch+g]);}out[`pcm_${D}_${ramp}`]={pk,dd,meta:pr.meta,warn:s.net.warnings};}
// 3.1: DC machine drive (speed loop with active damping or IMC, current loop, open loop)
for(const [mode,design] of [['speed','active'],['speed','imc'],['current','active'],['open','active']]){const pr=build('dc_drive',{mode,design});const s=sim(pr,pr.sim.stopT);const T=1/pr.meta.fs;
 const w=per(s,'Y:M1'),i=per(s,'Y:AM1'),r=a=>{const p=s.per,k=s.chIndex.get('Y:M1');const v=[];for(let q=0;q<p.n;q++){const j=(p.head-p.n+q+p.cap)%p.cap;v.push({t:p.t[j],mn:p.min[j*p.nch+k],mx:p.max[j*p.nch+k]});}return v;};const wr=r();
 const rm=mode==='current'?M.responseMetrics({t:i.t,y:i.y,tStep:.005,tEnd:.03,ref:t=>t<.005?0:10}):null;
 out[`dc_${mode}_${design}`]={meta:pr.meta,warn:s.net.warnings,w_end:s.now('Y:M1'),i_end:last(s,'Y:AM1',5).avg,d_end:last(s,'D:PWM1',5).avg,
  w_max_pre:Math.max(...wr.filter(q=>q.t<.25).map(q=>q.mx)),w_min_post:Math.min(...wr.filter(q=>q.t>.25+T).map(q=>q.mn)),w_at:[.1,.2].map(t=>w.y[w.t.findIndex(x=>x>=t)]),
  i_max:Math.max(...i.y),i_at30:i.y[i.t.findIndex(x=>x>=.03-1e-9)],rise:rm?.rise,os:rm?.overshoot};}
// 3.2: subharmonics — valley mode, clock samples, period doubling of the boost with R–C load (sweep points as in the panel)
for(const [mode,D,ramp] of [['valley','0.4','none'],['valley','0.6','none'],['valley','0.4','half'],['peak','0.4','none'],['peak','0.6','none'],['peak','0.6','half']]){const pr=build('peak_cm',{mode,D,ramp});
 const r=MNA.sweepPoint(pr,{...pr.meta.sweep,value:pr.meta.Vo});const q=M.periodicity(r.y);out[`sub_${mode}_${D}_${ramp}`]={period:q.period,distinct:q.distinct,meta:pr.meta,warn:r.warnings};}
{const pr=build('pcm_chaos',{});out.chaos={};for(const ic of [1.5,2,2.5,2.65,3]){const r=MNA.sweepPoint(pr,{...pr.meta.sweep,value:ic});const q=M.periodicity(r.y);out.chaos[ic]={period:q.period,distinct:q.distinct,warn:r.warnings};}}
// 3.3.1: battery cell test with the converter, Z at the perturbation frequency (charge from V_S, discharge into R_L)
for(const src of ['vs','rl']){const pr=build('cell_eis',{src,f:'200'});const r=MNA.eisPoint(pr,{...pr.meta.eis,f:200});const z=M.impedance(r);const s=sim(pr,.1);
 out['eis_'+src]={re:z.re,im:z.im,I1:z.I,Idc:z.Idc,vci:last(s,'V:CI',20).avg,ocv:s.now('Y:EXO'),soc:s.now('Y:SOC'),warn:s.net.warnings,meta:pr.meta};}
// 3.4: induction machine, V/f with three modulations and field orientation (exact R̂_R, R̂_R = 0.5·R_R, field weakening)
for(const mod of ['svpwm','spwm']){const pr=build('im_vf',{mod});const s=sim(pr,pr.sim.stopT);out['imvf_'+mod]={w:s.now('Y:M1'),psi:s.now('Y:M1:psi'),te:last(s,'Y:M1:te',100).avg,warn:s.net.warnings};}
for(const [wref,rr] of [['100','1'],['100','0.5'],['230','1']]){const pr=build('im_foc',{wref,rr});const s=sim(pr,pr.sim.stopT);const avg=k=>last(s,k,100).avg;let d=s.now('Y:M1:thf')-s.now('Y:FE');d-=2*Math.PI*Math.round(d/(2*Math.PI));
 out[`imfoc_${wref}_${rr}`]={w:s.now('Y:M1'),psi:s.now('Y:M1:psi'),psiEst:s.now('Y:FE:psi'),id:avg('Y:PK'),iq:avg('Y:PK:q'),te:avg('Y:M1:te'),dth:d,warn:s.net.warnings,meta:pr.meta};}
// 3.5: SynRM, alignment from three initial angles and dq control with four current angles
for(const th0 of ['60','120','89']){const pr=build('synrm',{mode:'align',th0});const s=sim(pr,pr.sim.stopT);
 const p=s.per,i=s.chIndex.get('Y:M1'),w=[];for(let k=0;k<p.n;k++){const j=(p.head-p.n+k+p.cap)%p.cap;w.push(p.avg[j*p.nch+i]);}const cr=[];for(let k=1;k<w.length;k++)if(Math.sign(w[k])!==Math.sign(w[k-1])&&Math.abs(w[k]-w[k-1])>1e-6)cr.push(k*s.T);
 const hp=cr.slice(2,8).map((t,k,a)=>k?t-a[k-1]:null).filter(x=>x);
 out['syn_al_'+th0]={dl:s.now('Y:DL'),id:s.now('Y:M1:id'),iq:s.now('Y:M1:iq'),te:s.now('Y:M1:te'),w:s.now('Y:M1'),fosc:hp.length?1/(2*hp.reduce((x,y)=>x+y,0)/hp.length):null,warn:s.net.warnings,meta:pr.meta};}
for(const strat of ['mtpa','g60']){const pr=build('synrm',{mode:'foc',strat,sat:'d'});const s=sim(pr,pr.sim.stopT);const avg=k=>last(s,k,100).avg;
 out['synsat_'+strat]={w:s.now('Y:M1'),id:avg('Y:PK'),iq:avg('Y:PK:q'),te:avg('Y:M1:te'),warn:s.net.warnings};}
for(const strat of ['mtpa','g30','g60','idc']){const pr=build('synrm',{mode:'foc',strat});const s=sim(pr,pr.sim.stopT);const avg=k=>last(s,k,100).avg;
 out['syn_'+strat]={w:s.now('Y:M1'),id:avg('Y:PK'),iq:avg('Y:PK:q'),idm:avg('Y:M1:id'),iqm:avg('Y:M1:iq'),te:avg('Y:M1:te'),ud:avg('Y:EXUD'),uq:avg('Y:EXUQ'),warn:s.net.warnings,meta:pr.meta};}
for(const [mach,strat] of [['ipm','mtpa'],['ipm','id0'],['spm','mtpa']]){const pr=build('pmsm',{mach,strat});const s=sim(pr,pr.sim.stopT);const avg=k=>last(s,k,100).avg;
 out[`pm_${mach}_${strat}`]={w:s.now('Y:M1'),id:avg('Y:PK'),iq:avg('Y:PK:q'),te:avg('Y:M1:te'),warn:s.net.warnings,meta:pr.meta};}
for(const shape of ['10/350','1/200','0.25/100','custom']){const pr=build('lightning',{shape});const s=sim(pr,pr.sim.stopT);const r=s.ring,iI=s.chIndex.get('I:I1'),iV=s.chIndex.get('V:I1');
 let ip=0,vp=0,n=0;for(let q=0;q<r.n;q++){const j=(r.head-r.n+q+r.cap)%r.cap;ip=Math.max(ip,r.d[j*r.nch+iI]);vp=Math.max(vp,r.d[j*r.nch+iV]);n++;}
 const p=s.per;let Q=0;for(let k=0;k<p.n;k++){const j=(p.head-p.n+k+p.cap)%p.cap;Q+=p.avg[j*p.nch+iI]*s.T;}const w=s.net.compInfo.get('I1').wave;
 out['lg_'+shape]={ip,vp,Q,points:n,steps:s.steps,wave:w,meas:Parts.waveMeasure(w),warn:s.net.warnings,meta:pr.meta};}
// 3.8: traveling waves on a Bergeron line against the method of characteristics (Parts.bewley, independent of the solver)
for(const [nm,o] of [['open',{term:'open'}],['short',{term:'short'}],['match',{term:'match'}],['r3z_rs',{term:'r3z',rs:'z'}],['rz3',{term:'rz3'}],['open_li',{term:'open',src:'li'}],
  ['book3',{case:'book',arr:'3'}],['book2',{case:'book',arr:'2'}],['booknone',{case:'book',arr:'none'}],['book_li',{case:'book',arr:'3',src:'li'}]]){
 const pr=build('twave',o),m=pr.meta,s=sim(pr,m.dur),r=s.ring,iA=s.chIndex.get('V:T1'),iB=s.chIndex.get('V2:T1'),iI=s.chIndex.get('I2:T1');const g=R=>R===Infinity?1:(R-m.Z)/(R+m.Z);
 const gL=t=>g(m.ta!==null&&t>=m.ta?(m.RL===Infinity?1e-3:m.RL*1e-3/(m.RL+1e-3)):m.RL),w=o.src==='li'?s.net.compInfo.get('V1').wave:null;
 const bw=Parts.bewley({E:w?(t=>Parts.waveAt(w,t)):(()=>m.E),Rs:m.Rs,Z:m.Z,tau:m.tau,gL,tEnd:m.dur,M:400});
 const T=[],A=[],B=[],I=[];for(let q=0;q<r.n;q++){const j=(r.head-r.n+q+r.cap)%r.cap;T.push(r.t[j]);A.push(r.d[j*r.nch+iA]);B.push(r.d[j*r.nch+iB]);I.push(r.d[j*r.nch+iI]);}
 const at=(Y,tq)=>{let k=1;while(k<T.length&&T[k]<tq)k++;if(k>=T.length)return Y[T.length-1];const f=(tq-T[k-1])/((T[k]-T[k-1])||1);return Y[k-1]+(Y[k]-Y[k-1])*f;};
 // steps: at the middle of every interval between arrivals; impulses: everywhere
 const near=tq=>m.ta!==null&&[0,1,2,3,4,5].some(k=>Math.abs(tq-m.ta-k*m.tau)<.05*m.tau); // the arrester jump: not between two recorded samples
 const ts=[];if(w){for(let k=1;k<400;k++)if(!near(m.dur*k/400))ts.push(m.dur*k/400);}else for(let k=0;(k+.5)*m.tau<m.dur;k++)ts.push((k+.5)*m.tau);if(m.ta!==null&&!w)ts.push(m.ta+.25*m.tau);
 let eA=0,eB=0,eI=0;for(const tq of ts){eA=Math.max(eA,Math.abs(at(A,tq)-bw.vAt(tq)));eB=Math.max(eB,Math.abs(at(B,tq)-bw.vBt(tq)));eI=Math.max(eI,Math.abs(-at(I,tq)-bw.iBt(tq)));}
 out['tw_'+nm]={eA,eB,eI,E:m.E,Z:m.Z,tau:m.tau,h:s.h,n:ts.length,warn:s.net.warnings,vB:[1.5,3.5,5.5].map(k=>at(B,k*m.tau)),vA:[.5,2.5,4.5,6.5].map(k=>at(A,k*m.tau)),iB:[1.5,3.5,5.5].map(k=>-at(I,k*m.tau)),meta:m};}
// 3.9: surge arrester and its protective distance: the maxima over every recorded sample
for(const [nm,o] of [['ideal',{}],['d100',{d:'100'}],['d400',{d:'400'}],['s1000',{S:'1000'}],['zno',{mov:'zno'}],['table',{mov:'table'}],['none',{mov:'none'}]]){
 const pr=build('arrester',o),m=pr.meta,s=sim(pr,m.dur),r=s.ring,ia=s.chIndex.get('V2:T1'),ib=s.chIndex.get('V:T1'),ii=s.chIndex.get('I:M1');let vA=-Infinity,vB=-Infinity,iEnd=null;
 let si=0,st=0,tp=null,ip=null; // the line B–A rings with period 4τ: the arrester current averaged over the last 4τ
 for(let q=0;q<r.n;q++){const j=(r.head-r.n+q+r.cap)%r.cap,t=r.t[j];vA=Math.max(vA,r.d[j*r.nch+ia]);vB=Math.max(vB,r.d[j*r.nch+ib]);
  if(ii!==undefined){const i=r.d[j*r.nch+ii];if(tp!==null&&t>m.dur-4*m.tau){si+=(t-tp)*(i+ip)/2;st+=t-tp;}tp=t;ip=i;}}
 if(ii!==undefined)iEnd=si/st;
 out['ar_'+nm]={vA,vB,iEnd,points:r.n,steps:s.steps,warn:s.net.warnings,meta:m};}
// 3.6: SRM 8/6 with three conduction windows: steady state, the ψ–i loop of phase 1 over the last electrical period, mean torque
for(const ang of ['30-150','0-120','60-180']){const pr=build('srm',{ang,band:'1'});const s=sim(pr,pr.sim.stopT);const r=s.ring,ix=k=>s.chIndex.get(k),w=s.now('Y:M1'),Te=2*Math.PI/(6*w);
 let W=0,ta=0,prev=null;for(let q=0;q<r.n;q++){const j=(r.head-r.n+q+r.cap)%r.cap,t=r.t[j];if(t<s.t-Te)continue;const i=r.d[j*r.nch+ix('I:M1')],p=r.d[j*r.nch+ix('PSI1:M1')],te=r.d[j*r.nch+ix('Y:M1:te')];
  if(prev){W+=(i+prev.i)/2*(p-prev.p);ta+=(t-prev.t)*(te+prev.te)/2;}prev={t,i,p,te};}
 out['srm_'+ang]={w,W,te:ta/Te,iref:s.now('Y:PIS'),Te,warn:s.net.warnings,meta:pr.meta};}
// 3.3: PI in Python (Pyodide in Node, when the pyodide package is installed) against the PI block; feedforward from an expression
(async()=>{let PyRT=null;try{PyRT=require(W+'/pyrt.js');await PyRT.load();}catch(e){out.py_skipped=String(e.message||e).slice(0,120);}
 for(const [ctrl,ff] of [['pib','none'],['pib','expr'],...(PyRT?.ready?[['python','none'],['python','expr']]:[])]){const pr=build('code_loop',{ctrl,ff});const s=sim(pr,.004);const p=s.per,i=s.chIndex.get('Y:AM1'),d=s.chIndex.get('D:PWM1');
  const at=t=>{let j=-1;for(let k=0;k<p.n;k++){const q=(p.head-p.n+k+p.cap)%p.cap;if(p.t[q]>=t-1e-12){j=q;break;}}return j<0?null:{min:p.min[j*p.nch+i],d:p.end[j*p.nch+d]};};
  const b=s.net.sig.blocks.find(x=>x.id==='PI1');out[`code_${ctrl}_${ff}`]={valley:last(s,'Y:AM1',5).min,avg:last(s,'Y:AM1',5).avg,d:s.now('D:PWM1'),early:at(5e-4),step:at(2.4e-3),calls:b.type==='PY'?b.st.last+1:null,warn:s.net.warnings};}
 out.ms=Date.now()-t0;console.log(JSON.stringify(out,null,1));})();
