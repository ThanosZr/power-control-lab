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
out.ms=Date.now()-t0;console.log(JSON.stringify(out,null,1));
