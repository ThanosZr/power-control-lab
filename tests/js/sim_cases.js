// Numerical checks of web/studio/mna.js against closed-form results.
// Usage: node sim_cases.js  -> prints JSON {case: {...}}
const path=require('path');
const W=path.resolve(__dirname,'../../web/studio');
global.Parts=require(W+'/parts.js');const MNA=require(W+'/mna.js');const METHOD=process.env.PCL_METHOD||'TR';class Sim extends MNA.Sim{constructor(p,o={}){super(p,{...o,method:METHOD});}}
function project(comps,conns){let n=0;return {components:comps.map(c=>({x:0,y:0,rot:0,...c})),wires:conns.map(([a,b])=>{const [ac,ap]=a.split(':'),[bc,bp]=b.split(':');return {id:'w'+(n++),a:{c:ac,p:ap},b:{c:bc,p:bp},pts:[]};})};}
function periodStats(sim,key,periods=1){ // average over the last `periods` base periods
 const i=sim.chIndex.get(key),p=sim.per;let s=0,mn=Infinity,mx=-Infinity;
 for(let k=1;k<=periods;k++){const j=(p.head-k+p.cap)%p.cap,o=j*p.nch+i;s+=p.avg[o];mn=Math.min(mn,p.min[o]);mx=Math.max(mx,p.max[o]);}
 return {avg:s/periods,min:mn,max:mx,pp:mx-mn};}
const out={};const t0=Date.now();
// 1) buck CCM
{const pr=project([{id:'V1',type:'VDC',params:{V:24}},{id:'S1',type:'SW',params:{pwm:'PWM1',body:false}},{id:'D1',type:'D'},{id:'L1',type:'L',params:{L:100e-6,i0:1.2}},
  {id:'C1',type:'C',params:{C:100e-6,v0:12}},{id:'R1',type:'R',params:{R:10}},{id:'G',type:'GND'},{id:'PWM1',type:'PWM',params:{fs:100e3,D:.5}}],
  [['V1:p','S1:d'],['S1:s','D1:k'],['D1:a','G:g'],['S1:s','L1:a'],['L1:b','C1:p'],['C1:p','R1:a'],['R1:b','G:g'],['C1:n','G:g'],['V1:n','G:g']]);
 const s=new Sim(pr,{hDiv:200});s.run(400e-5);out.buck_ccm={vo:periodStats(s,'V:C1',10).avg,il:periodStats(s,'I:L1',10),steps:s.steps};}
// 2) buck DCM: Vo/Vin = 2/(1+sqrt(1+4K/D^2)), K=2L/(RT)
{const pr=project([{id:'V1',type:'VDC',params:{V:24}},{id:'S1',type:'SW',params:{pwm:'PWM1',body:false}},{id:'D1',type:'D'},{id:'L1',type:'L',params:{L:10e-6}},
  {id:'C1',type:'C',params:{C:100e-6,v0:18}},{id:'R1',type:'R',params:{R:50}},{id:'G',type:'GND'},{id:'PWM1',type:'PWM',params:{fs:100e3,D:.3,carrier:'saw'}}],
  [['V1:p','S1:d'],['S1:s','D1:k'],['D1:a','G:g'],['S1:s','L1:a'],['L1:b','C1:p'],['C1:p','R1:a'],['R1:b','G:g'],['C1:n','G:g'],['V1:n','G:g']]);
 const s=new Sim(pr,{hDiv:200});s.run(300e-5);const il=periodStats(s,'I:L1',1);out.buck_dcm={vo:periodStats(s,'V:C1',10).avg,ilmin:il.min,ilmax:il.max};}
// 3) boost DCM: Vo/Vin=(1+sqrt(1+4D^2/K))/2
{const pr=project([{id:'V1',type:'VDC',params:{V:12}},{id:'L1',type:'L',params:{L:10e-6}},{id:'S1',type:'SW',params:{pwm:'PWM1',body:false}},{id:'D1',type:'D'},
  {id:'C1',type:'C',params:{C:470e-6,v0:42.497}},{id:'R1',type:'R',params:{R:100}},{id:'G',type:'GND'},{id:'PWM1',type:'PWM',params:{fs:50e3,D:.3,carrier:'saw'}}],
  [['V1:p','L1:a'],['L1:b','S1:d'],['S1:s','G:g'],['L1:b','D1:a'],['D1:k','C1:p'],['C1:p','R1:a'],['R1:b','G:g'],['C1:n','G:g'],['V1:n','G:g']]);
 const s=new Sim(pr,{hDiv:200});s.run(200/50e3);out.boost_dcm={vo:periodStats(s,'V:C1',20).avg,ilmin:periodStats(s,'I:L1',1).min};}
// 4) flyback CCM: Vo = Vin n D/(1-D)
{const pr=project([{id:'V1',type:'VDC',params:{V:24}},{id:'T1',type:'XFMR',params:{n:.5,Lm:200e-6,im0:.8333,pol:'opp'}},{id:'S1',type:'SW',params:{pwm:'PWM1',body:false}},{id:'D1',type:'D'},
  {id:'C1',type:'C',params:{C:220e-6,v0:8}},{id:'R1',type:'R',params:{R:8}},{id:'G',type:'GND'},{id:'PWM1',type:'PWM',params:{fs:100e3,D:.4,carrier:'saw'}}],
  [['V1:p','T1:p1'],['T1:p2','S1:d'],['S1:s','G:g'],['T1:s1','D1:a'],['D1:k','C1:p'],['C1:p','R1:a'],['R1:b','G:g'],['C1:n','G:g'],['T1:s2','G:g'],['V1:n','G:g']]);
 const s=new Sim(pr,{hDiv:200});s.run(15e-3);out.flyback={vo:periodStats(s,'V:C1',20).avg,im:periodStats(s,'Im:T1',20).avg,is:periodStats(s,'I2:T1',20).avg};}
// 5) bridge rectifier charging a battery E=200 V, R=2 Ω from 230 V rms
{const pr=project([{id:'V1',type:'VAC',params:{Vpk:230*Math.SQRT2,f:50}},{id:'D1',type:'D'},{id:'D2',type:'D'},{id:'D3',type:'D'},{id:'D4',type:'D'},{id:'R1',type:'R',params:{R:2}},{id:'E1',type:'VDC',params:{V:200}},{id:'G',type:'GND'}],
  [['V1:p','D1:a'],['V1:p','D3:k'],['V1:n','D2:a'],['V1:n','D4:k'],['D1:k','R1:a'],['D2:k','R1:a'],['R1:b','E1:p'],['E1:n','D3:a'],['E1:n','D4:a'],['E1:n','G:g']]);
 const s=new Sim(pr,{hDiv:4000});s.run(0.04);const ib=periodStats(s,'I:R1',1);out.rectifier={iavg:ib.avg,ipk:ib.max};}
// 6) bidirectional, storage above the bus: D=0.5, i_L(0)=-800 A (PE2 test B)
function bidir(control,i0){return project([{id:'VB',type:'VDC',params:{V:50}},{id:'L1',type:'L',params:{L:5.6e-6,i0}},{id:'S1',type:'SW',params:{pwm:'PWM1',out:'na',Ron:1e-6}},{id:'S2',type:'SW',params:{pwm:'PWM1',out:'a',Ron:1e-6}},
  {id:'VS',type:'VDC',params:{V:100}},{id:'G',type:'GND'},{id:'PWM1',type:'PWM',params:{fs:20e3,...control}}],
  [['VB:p','L1:a'],['L1:b','S1:s'],['L1:b','S2:d'],['S2:s','G:g'],['S1:d','VS:p'],['VS:n','G:g'],['VB:n','G:g']]);}
{const s=new Sim(bidir({D:.5},-800),{hDiv:500});s.run(40/20e3);const il=periodStats(s,'I:L1',1);out.bidir_open={iavg:il.avg,ripple:il.pp,pbus:-periodStats(s,'P:VB',1).avg};}
{const s=new Sim(bidir({mode:'pi',sensor:'L1',qty:'I',ref:'0:-800, 0.005:800',Kp:3.4417e-4,Ki:0.45965,ff:'ratio',ffA:'VB',ffB:'VS'},0),{hDiv:500});
 s.run(0.005);const a=periodStats(s,'I:L1',1).avg;s.run(0.005);const b=periodStats(s,'I:L1',1).avg;out.bidir_pi={at5ms:a,at10ms:b};}
// 7) bidirectional full system: unidirectional source + R_src, C_bus + ESR, CPL 60 kW, PI at -800 A
{const pr=project([{id:'VSRC',type:'VDC',params:{V:50,Rs:1e-3,uni:true}},{id:'CB',type:'C',params:{C:.1,v0:49.596,esr:2e-4}},{id:'LD',type:'CPL',params:{P:60e3,sched:'0:60000, 0.005:30000'}},
  {id:'L1',type:'L',params:{L:5.6e-6,i0:-800}},{id:'S1',type:'SW',params:{pwm:'PWM1',out:'na',Ron:1e-6}},{id:'S2',type:'SW',params:{pwm:'PWM1',out:'a',Ron:1e-6}},{id:'VS',type:'VDC',params:{V:100}},{id:'G',type:'GND'},
  {id:'PWM1',type:'PWM',params:{fs:20e3,mode:'pi',sensor:'L1',qty:'I',ref:'-800',Kp:3.4417e-4,Ki:0.45965,ff:'ratio',ffA:'CB',ffB:'VS'}}],
  [['VSRC:p','CB:p'],['CB:p','LD:p'],['CB:p','L1:a'],['L1:b','S1:s'],['L1:b','S2:d'],['S2:s','G:g'],['S1:d','VS:p'],['VS:n','G:g'],['VSRC:n','G:g'],['CB:n','G:g'],['LD:n','G:g']]);
 const s=new Sim(pr,{hDiv:500});s.run(99/20e3);const b=periodStats(s,'V:CB',1).avg,isb=periodStats(s,'I:VSRC',1).avg;s.run(40/20e3);
 out.bidir_system={vbus_before:b,isrc_before:isb,vbus_after:periodStats(s,'V:CB',1).avg,isrc_after:periodStats(s,'I:VSRC',1).avg};}
// 8) synchronous buck with dead time: body diode carries i_L > 0 in both dead times -> Vo = Vin(D - t_d f_s)
function syncBuck(sw,pwm){return project([{id:'V1',type:'VDC',params:{V:24}},{id:'S1',type:'SW',params:{pwm:'PWM1',out:'a',...sw}},{id:'S2',type:'SW',params:{pwm:'PWM1',out:'na',...sw}},{id:'L1',type:'L',params:{L:100e-6,i0:1.1}},
  {id:'C1',type:'C',params:{C:100e-6,v0:10.8}},{id:'R1',type:'R',params:{R:10}},{id:'G',type:'GND'},{id:'PWM1',type:'PWM',params:{fs:100e3,D:.5,...pwm}}],
  [['V1:p','S1:d'],['S1:s','S2:d'],['S2:s','G:g'],['S1:s','L1:a'],['L1:b','C1:p'],['C1:p','R1:a'],['R1:b','G:g'],['C1:n','G:g'],['V1:n','G:g']]);}
{const s=new Sim(syncBuck({Ron:1e-6},{dt:500e-9}),{hDiv:400});s.run(500e-5);out.deadtime={vo:periodStats(s,'V:C1',20).avg,both_off:(()=>{let n=0;for(let i=0;i<200;i++){const t=s.t+i*1e-5/200;const k=s.net.ctrls[0];if(!s.gateOf(k,'a',t)&&!s.gateOf(k,'na',t))n++;}return n/200;})()};}
// 9) IGBT buck (V_ce0 = 1 V) and switching losses E_on/E_off
{const pr=project([{id:'V1',type:'VDC',params:{V:24}},{id:'S1',type:'SW',params:{pwm:'PWM1',model:'igbt',Vce0:1,Ron:1e-6,body:false,Eon:100e-6,Eoff:150e-6,Vref:24,Iref:1}},{id:'D1',type:'D',params:{Ron:1e-6}},{id:'L1',type:'L',params:{L:100e-6,i0:1.15}},
  {id:'C1',type:'C',params:{C:100e-6,v0:11.5}},{id:'R1',type:'R',params:{R:10}},{id:'G',type:'GND'},{id:'PWM1',type:'PWM',params:{fs:100e3,D:.5}}],
  [['V1:p','S1:d'],['S1:s','D1:k'],['D1:a','G:g'],['S1:s','L1:a'],['L1:b','C1:p'],['C1:p','R1:a'],['R1:b','G:g'],['C1:n','G:g'],['V1:n','G:g']]);
 const s=new Sim(pr,{hDiv:400});s.run(500e-5);const il=periodStats(s,'I:L1',1);out.igbt={vo:periodStats(s,'V:C1',20).avg,vce_on:periodStats(s,'V:S1',1).min,psw:s.lastPeriod('PSW:S1').avg,ilmin:il.min,ilmax:il.max,pcond:periodStats(s,'P:S1',20).avg};}
// 10) transformer with leakage into R: |V_R| = n·V̂·R/|R + jω(L_lk1 n² + L_lk2)| (n = 1)
{const pr=project([{id:'V1',type:'VAC',params:{Vpk:100,f:1000}},{id:'T1',type:'XFMR',params:{n:1,Lm:1,Llk1:1e-3,Llk2:1e-3}},{id:'R1',type:'R',params:{R:10}},{id:'G',type:'GND'}],
  [['V1:p','T1:p1'],['V1:n','T1:p2'],['T1:s1','R1:a'],['T1:s2','R1:b'],['V1:n','G:g'],['T1:s2','G:g']]);
 const s=new Sim(pr,{hDiv:2000});s.run(0.02);const r=periodStats(s,'V:R1',2);out.leakage={vpk:(r.max-r.min)/2};}
// 11) single-phase thyristor bridge, α = 60°: R load and R-L load (continuous)
function scrBridge(alpha,load){const sc=(id,shift)=>({id,type:'SCR',params:{refsrc:'V1',alpha,shift,pw:20}});
 const comps=[{id:'V1',type:'VAC',params:{Vpk:325,f:50}},sc('T1',0),sc('T2',0),sc('T3',180),sc('T4',180),{id:'R1',type:'R',params:{R:10}},{id:'G',type:'GND'}];
 const w=[['V1:p','T1:a'],['T1:k','R1:a'],['T3:k','R1:a'],['V1:n','T3:a'],['T2:k','V1:n'],['T4:k','V1:p'],['T2:a','G:g'],['T4:a','G:g']];
 if(load==='rl'){comps.push({id:'L1',type:'L',params:{L:.5,i0:2*325/Math.PI*Math.cos(alpha*Math.PI/180)/10}});w.push(['R1:b','L1:a'],['L1:b','G:g']);}else w.push(['R1:b','G:g']);
 return project(comps,w);}
{const s=new Sim(scrBridge(60,'r'),{hDiv:2000});s.run(0.06);const a=periodStats(s,'V:R1',2).avg;
 const s2=new Sim(scrBridge(60,'rl'),{hDiv:2000});s2.run(0.2);out.scr1={vR:a,vRL:periodStats(s2,'V:R1',2).avg+periodStats(s2,'V:L1',2).avg,id:periodStats(s2,'I:L1',2).avg};}
// 12) three-phase bridge, diodes and thyristors (α = 30°), R load
function bridge3(alpha){const top=[['a',30],['b',150],['c',270]],bot=[['a',210],['b',330],['c',90]];const comps=[{id:'V1',type:'VAC3',params:{Vpk:325,f:50}},{id:'R1',type:'R',params:{R:20}},{id:'G',type:'GND'}];const w=[['V1:n','G:g']];
 top.forEach(([ph,sh],i)=>{const id='T'+(2*i+1);comps.push(alpha===null?{id,type:'D'}:{id,type:'SCR',params:{refsrc:'V1',alpha,shift:sh,pw:120}});w.push(['V1:'+ph,id+':a'],[id+':k','R1:a']);});
 bot.forEach(([ph,sh],i)=>{const id='B'+(2*i+1);comps.push(alpha===null?{id,type:'D'}:{id,type:'SCR',params:{refsrc:'V1',alpha,shift:sh,pw:120}});w.push(['R1:b',id+':a'],[id+':k','V1:'+ph]);});
 return project(comps,w);}
{const s=new Sim(bridge3(null),{hDiv:3000});s.run(0.06);const st=periodStats(s,'V:R1',2);const s2=new Sim(bridge3(30),{hDiv:3000});s2.run(0.06);
 out.bridge3={vd:st.avg,vmin:st.min,vmax:st.max,vscr:periodStats(s2,'V:R1',2).avg,ia_rms:Math.sqrt((()=>{const p=s.per,i=s.chIndex.get('I:V1');const j=(p.head-1+p.cap)%p.cap;return p.rms[j*p.nch+i]**2;})())};}
// 13) Sample & Hold on the carrier: instants, left value, vertical hold, NaN before the first trigger, PI reading the hold
function shCirc(pwm,sh){const p=bidir({D:.5,...pwm},-800);p.components.push({id:'SH1',type:'SH',x:0,y:0,rot:0,params:{src:'L1',clock:'PWM1',...sh}});return p;}
{const T=50e-6,s=new Sim(shCirc({carrier:'triangle',phase:36},{trig:'mid',init:'nan'}),{hDiv:500});const h0=s.now('H:SH1');s.run(20*T);const L=s.samples('SH1');
 // ring buffer around the 5th sample: two points at t_k (old hold, new hold); the sample equals i_L there
 const r=s.ring,nch=r.nch,iH=s.chIndex.get('H:SH1'),iL=s.chIndex.get('I:L1'),iC=s.chIndex.get('CAR:PWM1'),st=(r.head-r.n+r.cap)%r.cap,tk=L.t[0];const at=[];
 for(let k=0;k<r.n;k++){const j=(st+k)%r.cap;if(Math.abs(r.t[j]-tk)<1e-12)at.push({h:r.d[j*nch+iH],i:r.d[j*nch+iL],c:r.d[j*nch+iC]});}
 out.sh_mid={h0:Number.isNaN(h0)?'nan':h0,first:L.t[0],n:L.t.length,dt:L.t[5]-L.t[4],at,v0:L.v[0]};}
{const T=50e-6,pr=shCirc({mode:'pi',carrier:'saw',sensor:'SH1',qty:'I',ref:'-800',Kp:3e-4,Ki:0.4,ff:'ratio',ffA:'VB',ffB:'VS'},{trig:'start'});const s=new Sim(pr,{hDiv:500});s.run(10*T);
 const k=s.net.ctrls[0];out.sh_pi={meas:k.meas,hold:s.shById.get('SH1').h,lastSample:s.samples('SH1').v.at(-1),car:s.now('CAR:PWM1')};}
// 14) double duty update: a D change before the carrier minimum moves the turn-off edge of the same period
for(const upd of ['single','double']){const T=50e-6,s=new Sim(bidir({D:.5,carrier:'triangle',upd,dsched:`0:0.5, ${10.25*T}:0.6`},-800),{hDiv:500});const E=[];let g=s.now('G:PWM1');
 while(s.t<12*T-1e-12){s.run(T/500);const g2=s.now('G:PWM1');if(g2!==g){E.push([s.t/T,g2]);g=g2;}}out['upd_'+upd]=E.filter(e=>e[0]>9.9);}
// 15) gate pulse of each switch (after dead time): never both ON, ON time D·T − t_d and (1 − D)·T − t_d
{const T=50e-6,s=new Sim(bidir({D:.3,carrier:'saw',dt:1e-6},-800),{hDiv:500});s.run(10*T);const r=s.ring,nch=r.nch,st=(r.head-r.n+r.cap)%r.cap,i1=s.chIndex.get('GS:S1'),i2=s.chIndex.get('GS:S2');
 let both=0,on1=0,on2=0,pt=null,p1=0,p2=0;const vert=[];for(let k=0;k<r.n;k++){const j=(st+k)%r.cap,t=r.t[j],g1=r.d[j*nch+i1],g2=r.d[j*nch+i2];if(g1&&g2)both++;
  if(pt!==null&&pt>=9*T-1e-12&&t<=10*T+1e-12){const h=t-pt;on1+=h*p1;on2+=h*p2;}if(pt!==null&&t===pt&&g2!==p2)vert.push(t/T);pt=t;p1=g1;p2=g2;}
 out.pulses={both,on1:on1/T,on2:on2/T,vert:vert.slice(-4),keys:['GS:S1','GS:S2'].every(k=>s.chIndex.has(k))};}
// 16) signal blocks (3.0): a PI built from blocks gives exactly the duty of the built-in PI
{const base=[{id:'V1',type:'VDC',params:{V:48}},{id:'S1',type:'SW',params:{pwm:'PWM1',body:false}},{id:'D1',type:'D'},{id:'L1',type:'L',params:{L:100e-6}},
  {id:'C1',type:'C',params:{C:100e-6,v0:24}},{id:'R1',type:'R',params:{R:2.4}},{id:'G',type:'GND'}];
 const wires=[['V1:p','S1:d'],['S1:s','D1:k'],['D1:a','G:g'],['S1:s','L1:a'],['L1:b','C1:p'],['C1:p','R1:a'],['R1:b','G:g'],['C1:n','G:g'],['V1:n','G:g']],ref='0:5, 0.002:10';
 const bi=project([...base,{id:'PWM1',type:'PWM',params:{fs:50e3,mode:'pi',sensor:'L1',qty:'I',ref,Kp:.02,Ki:200,ff:'none',dmin:0,dmax:.95,carrier:'saw'}}],wires);
 const bl=project([...base,{id:'PWM1',type:'PWM',params:{fs:50e3,mode:'ext',carrier:'saw'}},{id:'K1',type:'CONST',params:{v:ref}},{id:'M1',type:'MEAS',params:{src:'L1'}},
  {id:'SUM1',type:'SUM',params:{signs:'+-'}},{id:'PI1',type:'PIB',params:{Kp:.02,Ki:200,clock:'PWM1',ymin:0,ymax:.95}}],[...wires,['K1:y','SUM1:a'],['M1:y','SUM1:b'],['SUM1:y','PI1:u'],['PI1:y','PWM1:d']]);
 const a=new Sim(bi,{hDiv:200}),b=new Sim(bl,{hDiv:200});let md=0;for(let k=0;k<200;k++){a.run(20e-6);b.run(20e-6);md=Math.max(md,Math.abs(a.now('D:PWM1')-b.now('D:PWM1')));}
 out.blk_pi={maxdiff:md,il:[a.now('I:L1'),b.now('I:L1')],warn:b.net.warnings,order:b.net.sig.order.map(x=>x.id)};}
// 17) algebraic loop is reported; a z⁻¹ in the loop breaks it; signal ↔ electrical wire is ignored with a warning
{const loop=(ud)=>project([{id:'K1',type:'CONST',params:{v:'1'}},{id:'SUM1',type:'SUM',params:{signs:'++'}},{id:'G1',type:'GAIN',params:{K:.5}},{id:'PWM1',type:'PWM',params:{fs:1e4}},
  ...(ud?[{id:'Z1',type:'UD',params:{clock:'PWM1'}}]:[])],[['K1:y','SUM1:a'],['SUM1:y','G1:u'],...(ud?[['G1:y','Z1:u'],['Z1:y','SUM1:b']]:[['G1:y','SUM1:b']])]);
 let err=null;try{new Sim(loop(false));}catch(e){err=e.message;}
 const s=new Sim(loop(true));s.run(20e-4);
 const mix=new Sim(project([{id:'V1',type:'VDC',params:{V:5}},{id:'R1',type:'R'},{id:'G',type:'GND'},{id:'K1',type:'CONST'},{id:'D1',type:'DISP'}],[['V1:p','R1:a'],['R1:b','G:g'],['V1:n','G:g'],['K1:y','R1:a'],['D1:u','G:g']]));
 out.blk_loop={err,y:s.now('Y:SUM1'),warnMix:mix.net.warnings,vR:mix.now('V:R1')};}
// 18) peak current-mode from generic blocks: comparator root inside the step
function pcm(D,ramp,hDiv=500){const Vo=24*D,hi=ramp*Vo/50e-6*1e-5;return new Sim(project([{id:'V1',type:'VDC',params:{V:24}},{id:'S1',type:'SW',params:{gate:'sig',body:false}},{id:'D1',type:'D'},{id:'L1',type:'L',params:{L:50e-6}},
  {id:'VO',type:'VDC',params:{V:Vo}},{id:'G',type:'GND'},{id:'CLK1',type:'CLK',params:{f:1e5}},{id:'SR1',type:'SR'},{id:'AM1',type:'AM'},{id:'IC',type:'CONST',params:{v:'5'}},
  {id:'RMP',type:'RAMP',params:{f:1e5,hi}},{id:'SUM1',type:'SUM',params:{signs:'++'}},{id:'CMP1',type:'CMP'}],
  [['V1:p','S1:d'],['S1:s','D1:k'],['D1:a','G:g'],['S1:s','AM1:a'],['AM1:b','L1:a'],['L1:b','VO:p'],['VO:n','G:g'],['V1:n','G:g'],
   ['CLK1:y','SR1:s'],['RMP:y','SUM1:a'],['AM1:y','SUM1:b'],['SUM1:y','CMP1:p'],['IC:y','CMP1:n'],['CMP1:y','SR1:r'],['SR1:q','S1:g']]),{hDiv});}
for(const [D,r,h] of [[.4,0,500],[.6,0,500],[.6,0,2000],[.6,.5,500],[.6,1,500]]){const s=pcm(D,r,h);s.run(3e-3);const p=s.per,i=s.chIndex.get('I:L1'),g=s.chIndex.get('GS:S1');const pk=[],dd=[];
 for(let k=8;k>=1;k--){const j=(p.head-k+p.cap)%p.cap;pk.push(p.max[j*p.nch+i]);dd.push(p.avg[j*p.nch+g]);}out[`pcm_${D}_${r}_${h}`]={pk,dd,T:s.T,steps:s.steps};}
// 19) Sample & Hold with a signal input, clock block as the sampling clock, live change of a constant
{const s=new Sim(project([{id:'R1',type:'RAMP',params:{f:1e3,lo:0,hi:10}},{id:'CK',type:'CLK',params:{f:4e3}},{id:'SH1',type:'SH',params:{in:'sig',clock:'CK',trig:'start'}},{id:'K1',type:'CONST',params:{v:'2'}},{id:'M1',type:'MUL'}],
  [['R1:y','SH1:u'],['SH1:y','M1:a'],['K1:y','M1:b']]));s.run(1.5e-3);const L=s.samples('SH1');const y0=s.now('Y:M1');s.setBlock('K1',{sched:[[0,3]]});
 out.blk_sh={n:L.t.length,t:L.t.slice(0,7),v:L.v.slice(0,7),y0,y1:s.now('Y:M1'),T:s.T};}
// 20) connections without a wire: the source chosen in the parameters, or Goto/From tags, give the wired result
{const mk=(how)=>{const comps=[{id:'V1',type:'VDC',params:{V:48}},{id:'S1',type:'SW',params:{pwm:'PWM1',body:false}},{id:'D1',type:'D'},{id:'L1',type:'L',params:{L:100e-6}},
  {id:'C1',type:'C',params:{C:100e-6,v0:24}},{id:'R1',type:'R',params:{R:2.4}},{id:'G',type:'GND'},{id:'PWM1',type:'PWM',params:{fs:50e3,mode:'ext',carrier:'saw'}},
  {id:'K1',type:'CONST',params:{v:'0:5, 0.002:10'}},{id:'M1',type:'MEAS',params:{src:'L1'}},{id:'SUM1',type:'SUM',params:{signs:'+-'}},{id:'PI1',type:'PIB',params:{Kp:.02,Ki:200,clock:'PWM1',ymin:0,ymax:.95}}];
  const w=[['V1:p','S1:d'],['S1:s','D1:k'],['D1:a','G:g'],['S1:s','L1:a'],['L1:b','C1:p'],['C1:p','R1:a'],['R1:b','G:g'],['C1:n','G:g'],['V1:n','G:g'],['K1:y','SUM1:a'],['SUM1:y','PI1:u']];
  if(how==='wire')w.push(['M1:y','SUM1:b'],['PI1:y','PWM1:d']);
  else if(how==='param'){comps.find(c=>c.id==='SUM1').params.in_b='M1:y';comps.find(c=>c.id==='PWM1').params.in_d='PI1:y';}
  else{comps.push({id:'TG1',type:'TAGO',params:{name:'d'}},{id:'TF1',type:'TAGI',params:{name:'d'}},{id:'TG2',type:'TAGO',params:{name:'iL'}},{id:'TF2',type:'TAGI',params:{name:'iL'}});w.push(['PI1:y','TG1:u'],['TF1:y','PWM1:d'],['M1:y','TG2:u'],['TF2:y','SUM1:b']);}
  return project(comps,w);};
 const r={};for(const how of ['wire','param','tag']){const s=new Sim(mk(how),{hDiv:200});s.run(4e-3);r[how]={d:s.now('D:PWM1'),il:s.now('I:L1'),warn:s.net.warnings,keys:s.keys.filter(k=>k.includes('TG')||k.includes('TF')).length};}
 const bad=new Sim(project([{id:'K1',type:'CONST'},{id:'TF1',type:'TAGI',params:{name:'x'}},{id:'TG1',type:'TAGO',params:{name:'y'}},{id:'TG2',type:'TAGO',params:{name:'y'}},{id:'G1',type:'GAIN',params:{in_u:'K9:y'}},{id:'D1',type:'DISP'}],
  [['K1:y','TG1:u'],['K1:y','TG2:u'],['TF1:y','D1:u']]));
 out.nowire={...r,warnBad:bad.net.warnings};}
// 21) DC machine (3.1) on 100 V with a load step: the gyrator + mechanical circuit against the two ODEs (RK4, small step);
//     the same machine with the load torque from a signal block
{const ode=(tEnd,TL)=>{const Ra=.5,La=10e-3,psi=1,J=.02,b=.002,V=100,h=1e-6;let i=0,w=0,t=0;const f=(t,i,w)=>[(V-Ra*i-psi*w)/La,(psi*i-b*w-(t>=TL[0]?TL[1]:0))/J];
  while(t<tEnd-1e-12){const k1=f(t,i,w),k2=f(t+h/2,i+h/2*k1[0],w+h/2*k1[1]),k3=f(t+h/2,i+h/2*k2[0],w+h/2*k2[1]),k4=f(t+h,i+h*k3[0],w+h*k3[1]);i+=h/6*(k1[0]+2*k2[0]+2*k3[0]+k4[0]);w+=h/6*(k1[1]+2*k2[1]+2*k3[1]+k4[1]);t+=h;}return [w,i];};
 const mk=sig=>project([{id:'V1',type:'VDC',params:{V:100}},{id:'M1',type:'DCM',params:sig?{load:'sig'}:{TL:'0:0, 0.3:20'}},{id:'G',type:'GND'},...(sig?[{id:'K1',type:'CONST',params:{v:'0:0, 0.3:20'}}]:[])],
  [['V1:p','M1:a'],['M1:b','G:g'],['V1:n','G:g'],...(sig?[['K1:y','M1:tl']]:[])]);
 const r={pts:[]};for(const sig of [false,true]){const s=new Sim(mk(sig),{h:10e-6});const row=[];for(const t of [.005,.02,.05,.2,.31,.5]){s.run(t-s.t);row.push([t,s.now('Y:M1'),s.now('I:M1'),s.now('Y:M1:te')]);}r[sig?'sig':'sched']=row;r['warn_'+sig]=s.net.warnings;}
 for(const t of [.005,.02,.05,.2,.31,.5])r.pts.push([t,...ode(t,[.3,20])]);out.dcm=r;}
// 22) three-phase PLL (3.1): locks to 50 Hz from 45 Hz; Park with its angle gives d = V̂, q = 0
{const ab=project([{id:'V3',type:'VAC3',params:{Vpk:100,f:50,phase:30}},{id:'G',type:'GND'},{id:'RA',type:'R',params:{R:10}},{id:'RB',type:'R',params:{R:10}},{id:'RC',type:'R',params:{R:10}},
  {id:'VA',type:'VM'},{id:'VB',type:'VM'},{id:'VC',type:'VM'},{id:'PL',type:'PLL',params:{f0:45,bw:20}},{id:'CL',type:'CLARKE'},{id:'PK',type:'PARK'},{id:'IP',type:'IPARK'},{id:'IC',type:'ICLARKE'}],
  [['V3:n','G:g'],['V3:a','RA:a'],['V3:b','RB:a'],['V3:c','RC:a'],['RA:b','G:g'],['RB:b','G:g'],['RC:b','G:g'],['VA:p','V3:a'],['VB:p','V3:b'],['VC:p','V3:c'],['VA:n','G:g'],['VB:n','G:g'],['VC:n','G:g'],
   ['VA:y','PL:a'],['VB:y','PL:b'],['VC:y','PL:c'],['VA:y','CL:a'],['VB:y','CL:b'],['VC:y','CL:c'],['CL:al','PK:al'],['CL:be','PK:be'],['PL:th','PK:th'],
   ['PK:d','IP:d'],['PK:q','IP:q'],['PL:th','IP:th'],['IP:al','IC:al'],['IP:be','IC:be']]);
 const s=new Sim(ab,{h:20e-6});s.run(.4);const th=(2*Math.PI*50*s.t+Math.PI/6)%(2*Math.PI);let dth=s.now('Y:PL')-th;dth-=2*Math.PI*Math.round(dth/(2*Math.PI));
 out.pll={w:s.now('Y:PL:w'),d:s.now('Y:PK'),q:s.now('Y:PK:q'),amp:s.now('Y:PL:amp'),dth,back:['','b','c'].map((k,j)=>s.now('Y:IC'+(k?':'+k:''))-s.now('Y:V'+'ABC'[j])),warn:s.net.warnings};}
// 23) continuous blocks (integrator, low-pass) and the back-calculation input of the PI block
{const pr=project([{id:'K1',type:'CONST',params:{v:2}},{id:'I1',type:'INT',params:{y0:1}},{id:'K2',type:'CONST',params:{v:100}},{id:'I2',type:'INT',params:{wrap:'2pi'}},
  {id:'K3',type:'CONST',params:{v:'0:0, 0.001:1'}},{id:'F1',type:'LPF',params:{fc:100}},{id:'CK',type:'CLK',params:{f:1000}},{id:'K4',type:'CONST',params:{v:1}},
  {id:'P1',type:'PIB',params:{Kp:1,Ki:100,clock:'CK',aw:'track'}},{id:'S1',type:'SAT',params:{lo:-2,hi:2}},{id:'D1',type:'SUM',params:{signs:'+-'}},{id:'P2',type:'PIB',params:{Kp:1,Ki:100,clock:'CK',ymin:-1e9,ymax:1e9}}],
  [['K1:y','I1:u'],['K2:y','I2:u'],['K3:y','F1:u'],['K4:y','P1:u'],['P1:y','S1:u'],['S1:y','D1:a'],['P1:y','D1:b'],['D1:y','P1:tr'],['K4:y','P2:u']]);
 const s=new Sim(pr,{h:10e-6});s.run(.003);const a={i1:s.now('Y:I1'),i2:s.now('Y:I2'),f1:s.now('Y:F1'),t:s.t};s.run(.2-s.t);
 out.cont={...a,pi_track:s.now('Y:P1'),sat:s.now('Y:S1'),pi_clamp:s.now('Y:P2'),warn:s.net.warnings,order:s.net.sig.order.map(b=>b.id)};}
// 24) harmonics (3.1): half-bridge with split ±50 V supply switched at 50 Hz on R = 10 Ω → square-wave current ±5 A
{const M=require(W+'/metrics.js');const pr=project([{id:'VP',type:'VDC',params:{V:50}},{id:'VN',type:'VDC',params:{V:50}},{id:'S1',type:'SW',params:{pwm:'PWM1',out:'a',body:false}},{id:'S2',type:'SW',params:{pwm:'PWM1',out:'na',body:false}},
  {id:'R1',type:'R',params:{R:10}},{id:'G',type:'GND'},{id:'PWM1',type:'PWM',params:{fs:50,D:.5,carrier:'saw'}}],
  [['VP:n','G:g'],['VN:p','G:g'],['VP:p','S1:d'],['S1:s','S2:d'],['S2:s','VN:n'],['S1:s','R1:a'],['R1:b','G:g']]);
 const s=new Sim(pr,{hDiv:2000});s.run(.06);const r=s.ring,i=s.chIndex.get('I:R1'),t=[],y=[];const st=(r.head-r.n+r.cap)%r.cap;for(let q=0;q<r.n;q++){const j=(st+q)%r.cap;t.push(r.t[j]);y.push(r.d[j*r.nch+i]);}
 const h=M.harmonics({t,y,f1:50,periods:2,H:98});out.harm={A1:h.A1,A3:h.A[3],A2:h.A[2],dc:h.dc,rms:h.rms,thd:h.thd,thdAll:h.thdAll,H:h.H};}
// 25) expression block (3.3): parser and evaluation, also inside a circuit; errors become warnings
{const E=require(W+'/expr.js');const v=[3,4];const cases=['a*b + 1','hypot(a, b)','a^2 + b**2','-a^2','2^3^2','a > b ? a : b','clamp(a*b, 0, 10)','mod(-7, 3)','(a < b) + (a == 3) + !(b != 4)','atan2(b, a)','min(a, b, 1)','round(2.5) + floor(-0.5) + sign(-a)','10 % 4','exp(log(a)) + sqrt(b)','pi*e*0 + t'];
 const r={};for(const c of cases)r[c]=E.compile(E.parse(c,['a','b']))(v,0.5);const errs=[];for(const c of ['a +','foo(a)','a b','sin(a, b)','x + 1','(a']){try{E.parse(c,['a','b']);errs.push(null);}catch(e){errs.push(e.message);}}
 const pr=project([{id:'V1',type:'VDC',params:{V:10}},{id:'R1',type:'R',params:{R:5}},{id:'G',type:'GND'},{id:'VM1',type:'VM'},{id:'AM1',type:'AM'},{id:'EX1',type:'EXPR',params:{expr:'v*i*k',ins:'v, i',pars:'k = 2'}},{id:'EX2',type:'EXPR',params:{expr:'v +',ins:'v'}}],
  [['V1:p','AM1:a'],['AM1:b','R1:a'],['R1:b','G:g'],['V1:n','G:g'],['VM1:p','V1:p'],['VM1:n','G:g'],['VM1:y','EX1:v'],['AM1:y','EX1:i'],['VM1:y','EX2:v']]);
 const s=new Sim(pr,{h:1e-6});s.run(1e-5);out.expr={vals:r,errs,p:s.now('Y:EX1'),bad:s.now('Y:EX2'),warn:s.net.warnings};}
out.ms=Date.now()-t0;
console.log(JSON.stringify(out,null,1));
