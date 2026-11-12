// Batch-solver requests built exactly as the studio builds them (MNA.exportForBatch).
// Usage: node batch_requests.js -> JSON {name: request}
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');const MNA=require(W+'/mna.js');require(W+'/tutorials.js');
const T=globalThis.Tutorials;const build=(id,opts={})=>{const t=T.get(id);const o={};for(const op of t.options)o[op.k]=opts[op.k]??op.def;return t.build(o);};
function project(comps,conns){let n=0;return {components:comps.map(c=>({x:0,y:0,rot:0,...c})),wires:conns.map(([a,b])=>{const [ac,ap]=a.split(':'),[bc,bp]=b.split(':');return {id:'w'+(n++),a:{c:ac,p:ap},b:{c:bc,p:bp},pts:[]};})};}
// same buck DCM as sim_cases.js (exact steady-state start)
const buckDcm=project([{id:'V1',type:'VDC',params:{V:24}},{id:'S1',type:'SW',params:{pwm:'PWM1',body:false}},{id:'D1',type:'D'},{id:'L1',type:'L',params:{L:10e-6}},
  {id:'C1',type:'C',params:{C:100e-6,v0:18}},{id:'R1',type:'R',params:{R:50}},{id:'G',type:'GND'},{id:'PWM1',type:'PWM',params:{fs:100e3,D:.3,carrier:'saw'}}],
  [['V1:p','S1:d'],['S1:s','D1:k'],['D1:a','G:g'],['S1:s','L1:a'],['L1:b','C1:p'],['C1:p','R1:a'],['R1:b','G:g'],['C1:n','G:g'],['V1:n','G:g']]);
// 3.1: DC machine on 100 V with a load step; PLL + Clarke + Park; integrator, low-pass and PI with back-calculation
const dcm=project([{id:'V1',type:'VDC',params:{V:100}},{id:'M1',type:'DCM',params:{TL:'0:0, 0.3:20'}},{id:'G',type:'GND'}],[['V1:p','M1:a'],['M1:b','G:g'],['V1:n','G:g']]);
const pll=project([{id:'V3',type:'VAC3',params:{Vpk:100,f:50,phase:30}},{id:'G',type:'GND'},{id:'RA',type:'R',params:{R:10}},{id:'RB',type:'R',params:{R:10}},{id:'RC',type:'R',params:{R:10}},
  {id:'VA',type:'VM'},{id:'VB',type:'VM'},{id:'VC',type:'VM'},{id:'PL',type:'PLL',params:{f0:45,bw:20}},{id:'CL',type:'CLARKE'},{id:'PK',type:'PARK'}],
  [['V3:n','G:g'],['V3:a','RA:a'],['V3:b','RB:a'],['V3:c','RC:a'],['RA:b','G:g'],['RB:b','G:g'],['RC:b','G:g'],['VA:p','V3:a'],['VB:p','V3:b'],['VC:p','V3:c'],['VA:n','G:g'],['VB:n','G:g'],['VC:n','G:g'],
   ['VA:y','PL:a'],['VB:y','PL:b'],['VC:y','PL:c'],['VA:y','CL:a'],['VB:y','CL:b'],['VC:y','CL:c'],['CL:al','PK:al'],['CL:be','PK:be'],['PL:th','PK:th']]);
const cont=project([{id:'K1',type:'CONST',params:{v:2}},{id:'I1',type:'INT',params:{y0:1}},{id:'K3',type:'CONST',params:{v:'0:0, 0.001:1'}},{id:'F1',type:'LPF',params:{fc:100}},
  {id:'CK',type:'CLK',params:{f:1000}},{id:'K4',type:'CONST',params:{v:1}},{id:'P1',type:'PIB',params:{Kp:1,Ki:100,clock:'CK',aw:'track'}},{id:'S1',type:'SAT',params:{lo:-2,hi:2}},{id:'D1',type:'SUM',params:{signs:'+-'}}],
  [['K1:y','I1:u'],['K3:y','F1:u'],['K4:y','P1:u'],['P1:y','S1:u'],['S1:y','D1:a'],['P1:y','D1:b'],['D1:y','P1:tr']]);
// 4.7: the neural network block in a loop: an RC plant fed by a source from a signal, a PI and a network that learns the
// feedforward from the PI's output (feedback-error learning, Adam); and a second one learning a target with SGD
const nnFel=project([{id:'CK',type:'CLK',params:{f:1000}},{id:'R0',type:'CONST',params:{v:'0:0, 0.01:1, 0.04:0.4, 0.07:0.8'}},{id:'E1',type:'SUM',params:{signs:'+-'}},
  {id:'P1',type:'PIB',params:{Kp:.3,Ki:30,clock:'CK',ymin:-5,ymax:5}},{id:'N1',type:'NN',params:{ins:'r',xs:'1',hidden:'6',train:'err',lr:.003,clock:'CK',ymin:-3,ymax:3,seed:7}},
  {id:'U1',type:'SUM',params:{signs:'++'}},{id:'V1',type:'VDC',params:{ctl:'sig'}},{id:'R1',type:'R',params:{R:10}},{id:'C1',type:'C',params:{C:1e-3}},{id:'VM',type:'VM'},
  {id:'N2',type:'NN',params:{ins:'v',hidden:'4',train:'tgt',opt:'sgd',lr:.05,clock:'CK',ymin:-5,ymax:5,seed:2,init:'rand'}},{id:'K2',type:'GAIN',params:{K:-1.5}},{id:'G',type:'GND'}],
  [['R0:y','E1:a'],['VM:y','E1:b'],['E1:y','P1:u'],['R0:y','N1:r'],['P1:y','N1:e'],['P1:y','U1:a'],['N1:y','U1:b'],['U1:y','V1:u'],['V1:p','R1:a'],['R1:b','C1:p'],['C1:n','G:g'],['V1:n','G:g'],
   ['VM:p','C1:p'],['VM:n','G:g'],['VM:y','N2:v'],['VM:y','K2:u'],['K2:y','N2:tgt']]);
// 3.19: B1 blocks: second-order filters (LP, HP on a step; notch, BP on 50 Hz), rate limiter, rate transition (ZOH and delayed), edge detector
const b1=project([{id:'K1',type:'CONST',params:{v:'0:0, 0.001:1'}},{id:'FL',type:'F2',params:{kind:'lp',f0:200,zeta:.3}},{id:'FH',type:'F2',params:{kind:'hp',f0:200,zeta:.3}},
  {id:'K2',type:'CONST',params:{v:'0:0, 0.001:1, 0.006:-1'}},{id:'RL',type:'RLIM',params:{up:500,dn:200}},{id:'EX',type:'EXPR',params:{expr:'sin(2*pi*50*t)+0.3*sin(2*pi*400*t)',ins:''}},
  {id:'FN',type:'F2',params:{kind:'notch',f0:50,zeta:.2}},{id:'FB',type:'F2',params:{kind:'bp',f0:400,zeta:.1}},{id:'CK',type:'CLK',params:{f:1000}},{id:'ED',type:'EDGE',params:{edge:'rise',tw:1e-4}},
  {id:'R1',type:'RT',params:{clock:'CK',mode:'zoh'}},{id:'R2',type:'RT',params:{clock:'CK',mode:'delay'}}],
  [['K1:y','FL:u'],['K1:y','FH:u'],['K2:y','RL:u'],['EX:y','FN:u'],['EX:y','FB:u'],['CK:y','ED:u'],['FL:y','R1:u'],['FL:y','R2:u']]);
// 3.3.1: cell model (R₀, R₁‖C₁, Warburg as R–C bank, OCV from a signal) driven by a current source from an expression
const eisCell=project([{id:'I1',type:'IDC',params:{ctl:'sig'}},{id:'EX1',type:'EXPR',params:{expr:'1 + 0.5*sin(2*pi*200*t)',ins:'x'}},{id:'R0',type:'R',params:{R:.03}},{id:'R1',type:'R',params:{R:.02}},{id:'C1',type:'C',params:{C:.05}},
  {id:'W1',type:'CPE',params:{kind:'warburg',sigma:.05,fmin:1,fmax:1e4,N:16}},{id:'OCV',type:'VDC',params:{ctl:'sig'}},{id:'K37',type:'CONST',params:{v:3.7}},{id:'G',type:'GND'},{id:'VM1',type:'VM'},{id:'AM1',type:'AM'}],
  [['EX1:y','I1:u'],['I1:n','G:g'],['I1:p','AM1:a'],['AM1:b','R0:a'],['R0:b','R1:a'],['R0:b','C1:p'],['R1:b','C1:n'],['R1:b','W1:a'],['W1:b','OCV:p'],['OCV:n','G:g'],['K37:y','OCV:u'],['VM1:p','AM1:b'],['VM1:n','G:g']]);
// 3.4: induction machine, direct-on-line start with a load step
const imDol=project([{id:'V3',type:'VAC3',params:{Vpk:326.6,f:50}},{id:'G',type:'GND'},{id:'M1',type:'IM',params:{TL:'0:0, 0.4:10'}}],[['V3:n','G:g'],['V3:a','M1:a'],['V3:b','M1:b'],['V3:c','M1:c']]);
// 3.5: coupled inductors (3 windings), conductance matrix, synchronous machine (SynRM aligning, PM with a load step), lightning current
const mpKl=project([{id:'V1',type:'VDC',params:{V:10}},{id:'R1',type:'R',params:{R:1}},{id:'K1',type:'KL',params:{nw:'3',L1:'1m',L2:'4m',L3:'2m',k:.9,kpairs:'13:0.7',Rw:.1,i0:'0.5, 0, 0'}},{id:'R2',type:'R',params:{R:5}},{id:'R3',type:'R',params:{R:2}},{id:'G',type:'GND'}],
 [['V1:p','R1:a'],['R1:b','K1:a1'],['K1:b1','G:g'],['V1:n','G:g'],['K1:a2','R2:a'],['R2:b','G:g'],['K1:b2','G:g'],['K1:a3','R3:a'],['R3:b','G:g'],['K1:b3','G:g']]);
const mpKg=project([{id:'V1',type:'VDC',params:{V:10}},{id:'V2',type:'VDC',params:{V:4}},{id:'Y1',type:'KG',params:{kind:'R',mat:'10, 2; 2, 5'}},{id:'C1',type:'C',params:{C:100e-6}},{id:'G',type:'GND'}],[['V1:p','Y1:a1'],['V2:p','Y1:a2'],['Y1:b1','G:g'],['Y1:b2','C1:p'],['C1:n','G:g'],['V1:n','G:g'],['V2:n','G:g']]);
const smDc=par=>project([{id:'V1',type:'VDC',params:{V:30}},{id:'M1',type:'SM',params:par},{id:'G',type:'GND'}],[['V1:p','M1:a'],['M1:b','G:g'],['M1:c','G:g'],['V1:n','G:g']]);
const mpLg=project([{id:'I1',type:'ILG',params:{shape:'1/200',Ipk:100e3}},{id:'R1',type:'R',params:{R:10}},{id:'L1',type:'L',params:{L:3e-6}},{id:'G',type:'GND'}],[['I1:p','R1:a'],['R1:b','L1:a'],['L1:b','G:g'],['I1:n','G:g']]);
// 3.6: switched reluctance machine, phase 1 on 20 V, magnetization from the parameters and from the default table
const srmDc=par=>project([{id:'V1',type:'VDC',params:{V:20}},{id:'M1',type:'SRM',params:par},{id:'G',type:'GND'}],[['V1:p','M1:a1'],['M1:b1','G:g'],['V1:n','G:g'],['M1:a2','M1:b2'],['M1:a3','M1:b3'],['M1:a4','M1:b4']]);
// 3.7: a secondary without ground (island) with a reference node or a leakage, probes on it, an unconnected part and an open current source left out
const isl=solve=>({...project([{id:'V1',type:'VAC',params:{Vpk:10,f:50}},{id:'X1',type:'XFMR',params:{n:2}},{id:'IP1',type:'IP'},{id:'R2',type:'R',params:{R:5}},{id:'R3',type:'R',params:{R:15}},{id:'VP1',type:'VP'},
  {id:'R9',type:'R'},{id:'I9',type:'IDC',params:{I:1}},{id:'G',type:'GND'}],[['V1:n','G:g'],['V1:p','X1:p1'],['X1:p2','G:g'],['X1:s1','IP1:a'],['IP1:b','R2:a'],['R2:b','R3:a'],['R3:b','X1:s2'],['VP1:p','R2:b'],['I9:n','G:g']]),solve});
// 3.8: impulse voltage 1.2/50 behind 50 Ω into 1 nF ∥ 1 kΩ
// 3.10: spark gaps (ringing with restrike, trigger, I_ext), arrester on a ramp, lines and the high-voltage tutorials
const sgRlc=gp=>Object.assign(project([{id:'C1',type:'C',params:{C:1e-6,v0:1e4}},{id:'L1',type:'L',params:{L:10e-6}},{id:'R1',type:'R',params:{R:.4}},{id:'SG1',type:'SG',params:{Rarc:.1,...gp}},{id:'G',type:'GND'}],
  [['C1:p','SG1:a'],['SG1:b','L1:a'],['L1:b','R1:a'],['R1:b','G:g'],['C1:n','G:g']]),{solve:{tbase:1e-6}});   // time base: the browser step is T/1000
const sgRc=Object.assign(project([{id:'C1',type:'C',params:{C:1e-6,v0:1e4}},{id:'R1',type:'R',params:{R:10}},{id:'SG1',type:'SG',params:{Ub:5e3,Rarc:.1,ext:'iext',Iext:100}},{id:'G',type:'GND'}],
  [['C1:p','SG1:a'],['SG1:b','R1:a'],['R1:b','G:g'],['C1:n','G:g']]),{solve:{tbase:1e-6}});
const movRamp=project([{id:'V1',type:'VIMP',params:{shape:'ramp',Vpk:2e6,S:80e9}},{id:'R1',type:'R',params:{R:400}},{id:'M1',type:'MOV',params:{alpha:30}},{id:'C1',type:'C',params:{C:1e-9}},{id:'G',type:'GND'}],
  [['V1:p','R1:a'],['R1:b','M1:a'],['M1:a','C1:p'],['M1:b','G:g'],['C1:n','G:g'],['V1:n','G:g']]);
const vimp=project([{id:'V1',type:'VIMP',params:{Vpk:100e3,Rs:50}},{id:'C1',type:'C',params:{C:1e-9}},{id:'R1',type:'R',params:{R:1e3}},{id:'G',type:'GND'}],[['V1:p','C1:p'],['C1:p','R1:a'],['C1:n','G:g'],['R1:b','G:g'],['V1:n','G:g']]);
const cases={buck_dcm:[buckDcm,null,['V:C1','I:L1']],rectifier:['rectifier',{},['I:R1']],bridge3_scr:['bridge3',{dev:'30',load:'r'},['V:R1']],
 battery_pi:['battery',{ctrl:'pi'},['I:L1','D:PWM1']],deadtime:['battery',{sw:'real',ctrl:'pi'},['I:L1']],
 sampling_saw:['sampling',{case:'saw'},['I:L1','H:SH1','CAR:PWM1']],sampling_tri2:['sampling',{case:'tri2',start:'midon'},['I:L1','H:SH1']],
 sampling_pi:['sampling',{case:'saw',ctrl:'pi'},['I:L1','H:SH1','D:PWM1']],
 poly4:['polyphase',{N:'4',vst:'mid'},['I:L1','I:L3','I:VB']],
 sampling_double:['sampling',{case:'tri2',ctrl:'pi',upd:'double'},['I:L1','H:SH1','D:PWM1']],share_dcr:['polyphase',{ctrl:'open',mis:'dcr'},['I:L2']],
 pulses:['sampling',{case:'tri2',sw:'real'},['GS:S1','GS:S2','D:PWM1']],
 pcm_half:['peak_cm',{ramp:'half'},['Y:AM1','Y:SR1','GS:S1']],pcm_sub:['peak_cm',{D:'0.6',ramp:'none'},['Y:AM1','GS:S1']],
 blk_cmp_z1:['blocks_loop',{mod:'cmp',delay:'z1'},['Y:AM1','Y:UD1','GS:S1']],blk_pwm:['blocks_loop',{},['Y:AM1','D:PWM1','Y:PI1']],
 dcm:[dcm,null,['Y:M1','Y:M1:te','I:M1']],pll:[pll,null,['Y:PL:w','Y:PK','Y:PK:q']],cont:[cont,null,['Y:I1','Y:F1','Y:P1','Y:S1']],
 b1:[b1,null,['Y:FL','Y:FH','Y:RL','Y:FN','Y:FB','Y:ED','Y:ED:n','Y:R1','Y:R2']],
 nn_fel:[nnFel,null,['V:C1','Y:N1','Y:N1:L','Y:P1','Y:N2','Y:N2:L']],
 dc_cur:['dc_drive',{mode:'current'},['Y:AM1','D:PWM1','Y:M1']],
 code_py:['code_loop',{ctrl:'python',ff:'expr'},['Y:AM1','D:PWM1','Y:PI1','Y:EX1']],
 eis_cell:[eisCell,null,['Y:VM1','Y:AM1']],
 im_dol:[imDol,null,['Y:M1','Y:M1:te','I:M1']],
 mp_kl:[mpKl,null,['I:K1','I2:K1','V2:K1','I3:K1']],mp_kg:[mpKg,null,['I:Y1','I2:Y1','V2:Y1']],
 sm_align:[smDc({th0:60}),null,['Y:M1','Y:M1:te','Y:M1:th','I:M1','Y:M1:id']],sm_pm:[smDc({Ld:.03,Lq:.05,psim:.5,th0:100,w0:5,TL:'0:0, 0.05:2'}),null,['Y:M1','Y:M1:te','Y:M1:iq','I:M1']],
 mp_lg:[mpLg,null,['I:I1','V:I1','I:L1']],
 vimp:[vimp,null,['V:C1','I:V1']],
 sg_ring:[sgRlc({Ub:7e3}),null,['V:C1','I:SG1']],sg_trig:[sgRlc({Ub:2e4,trig:'5u'}),null,['V:C1','I:SG1']],sg_iext:[sgRc,null,['V:C1','I:SG1']],
 mov_ramp:[movRamp,null,['V:M1','I:M1']],tw_r3z:['twave',{term:'r3z',rs:'z'},['V:T1','V2:T1','I2:T1']],tw_li:['twave',{src:'li'},['V:T1','V2:T1','I:T1']],
 tw_book:['twave',{case:'book'},['V:T1','V2:T1','I2:T1']],arr_ideal:['arrester',{},['V:T1','V2:T1','I:M1']],arr_zno:['arrester',{mov:'zno',d:'400'},['V:T1','V2:T1','I:M1']],
 marx:['marx',{},['V:C2','I:SG1','I:SG4']],chop:['chop',{},['V:C2','I:SG2']],
 ll_step:['lossline',{},['V:T1','V2:T1','I:T1']],ll_li:['lossline',{src:'li',end:'semi'},['V2:T1','I:T1']],vt_ramp:['voltime',{},['V:SG1','I:SG1']],vt_li:['voltime',{src:'li',k:'2'},['V:SG1','I:SG1']],
 hv1533:['hv153',{ex:'1533'},['V:CF','V:CL']],hv1537:['hv153',{ex:'1537'},['V:C2','I:SG3']],
 div1515:['hvdiv',{ex:'1515'},['V:CL','I:RS']],
 isl_ref:[isl({island:'ref',unconn:'ignore'}),null,['Y:VP1','Y:IP1','V:R2']],isl_leak:[isl({island:'auto',rleak:1e6}),null,['Y:VP1','Y:IP1','V:R3']],
 sm_sat:[smDc({th0:60,sat:'d',Ldsat:.04,psikd:.5}),null,['Y:M1','Y:M1:te','Y:M1:id','I:M1']],
 srm_m:[srmDc({th0:30}),null,['Y:M1','Y:M1:te','Y:M1:th','I:M1','PSI1:M1','Y:M1:i1']],srm_t:[srmDc({th0:30,mag:'table'}),null,['Y:M1','Y:M1:te','I:M1','PSI1:M1']]};
// browser results for the 3.0 cases: per-period peaks of the last periods, to compare solver against solver
const jsRun={dc_cur:['Y:AM1',.012],pcm_half:['Y:AM1',1e-3],pcm_sub:['Y:AM1',4e-4],blk_cmp_z1:['Y:AM1',4e-3],blk_pwm:['Y:AM1',4e-3]};   // pcm_sub: before chaos separates the two solvers
// browser values at given instants (3.1)
const jsAt={nn_fel:[.0095,.0205,.0395,.0605,.0995],b1:[.00305,.0045,.0085,.0205],dcm:[.005,.02,.05,.2,.31,.5],pll:[.3],cont:[.003,.05],eis_cell:[.004,.011,.02],im_dol:[.05,.1,.3,.6],mp_kl:[5e-4,2e-3,5e-3],mp_kg:[1e-4,1e-3],sm_align:[.02,.1,.3],sm_pm:[.02,.1,.2],mp_lg:[4e-6,50e-6,200e-6],sm_sat:[.02,.1,.3],isl_ref:[.005,.012,.02],vimp:[1e-6,3e-6,2e-5,6e-5],sg_ring:[5e-6,15e-6,25e-6,40e-6],sg_trig:[4e-6,10e-6,20e-6],sg_iext:[10e-6,30e-6,60e-6],mov_ramp:[5e-6,10e-6,20e-6,40e-6],tw_r3z:[5e-6,15e-6,25e-6,35e-6,95e-6],tw_li:[3e-6,12e-6,25e-6,65e-6],tw_book:[1.5e-6,3e-6,5e-6,7e-6],arr_ideal:[8e-6,15e-6,30e-6],arr_zno:[8e-6,15e-6,30e-6],marx:[1e-6,2.2e-6,20e-6,80e-6],chop:[2e-6,3.3e-6,4e-6,8e-6],ll_step:[101e-6,130e-6,160e-6,262e-6,510e-6,790e-6],ll_li:[102e-6,110e-6,150e-6],vt_ramp:[.15e-6,.21e-6,.5e-6],vt_li:[.5e-6,1e-6,3e-6,10e-6],hv1533:[1e-6,2.4e-6,20e-6,60e-6],hv1537:[1e-6,2.2e-6,20e-6,80e-6],div1515:[.013,.051,.0975],isl_leak:[.005,.012,.02],srm_m:[.005,.02,.06],srm_t:[.005,.02,.06]};
const out={};for(const [k,[id,o,keys]] of Object.entries(cases)){
 if(k==='code_py'){const pr=build('code_loop',{ctrl:'python',ff:'expr'});const r=MNA.exportForBatch(pr,keys);out[k]={net:r.net,channels:r.channels};
  const s=new MNA.Sim(build('code_loop',{ctrl:'pib',ff:'expr'}),{hDiv:1000});s.run(.003);const p=s.per,i=s.chIndex.get('Y:AM1'),pk=[];for(let q=8;q>=1;q--){const j=(p.head-q+p.cap)%p.cap;pk.push({max:p.max[j*p.nch+i],min:p.min[j*p.nch+i],t:p.t[j]});}
  out[k].js={T:s.T,pk,end:s.now('D:PWM1')};continue;}const pr=typeof id==='string'?build(id,o):id;const r=MNA.exportForBatch(pr,keys);out[k]={net:r.net,channels:r.channels};
 if(jsRun[k]){const [key,dur]=jsRun[k];const s=new MNA.Sim(pr,{hDiv:1000});s.run(dur);const p=s.per,i=s.chIndex.get(key),pk=[];for(let q=8;q>=1;q--){const j=(p.head-q+p.cap)%p.cap;pk.push({max:p.max[j*p.nch+i],min:p.min[j*p.nch+i],t:p.t[j]});}out[k].js={T:s.T,pk,end:s.now(key)};}}
for(const [k,ts] of Object.entries(jsAt)){const [id,o,keys]=cases[k];const s=new MNA.Sim(typeof id==='string'?build(id,o):id,{hDiv:k==='im_dol'?4000:k==='mp_lg'?200:k.startsWith('sm_')?100:1000});out[k].at=ts.map(t=>{s.run(t-s.t);return [t,...keys.map(q=>s.now(q))];});}
// 3.19: the event log of the browser for the buck in DCM (switch, diode, duty), to compare with the server's
{const s=new MNA.Sim(cases.buck_dcm?(typeof cases.buck_dcm[0]==='string'?build(cases.buck_dcm[0],cases.buck_dcm[1]):cases.buck_dcm[0]):buckDcm,{hDiv:1000});s.run(2e-4);
 out.buck_dcm.ev=s.events().list.filter(e=>['switch','diode','duty'].includes(e.kind)).map(e=>[e.t,e.kind,e.id,e.v]);}
console.log(JSON.stringify(out));
