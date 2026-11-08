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
 dc_cur:['dc_drive',{mode:'current'},['Y:AM1','D:PWM1','Y:M1']],
 code_py:['code_loop',{ctrl:'python',ff:'expr'},['Y:AM1','D:PWM1','Y:PI1','Y:EX1']]};
// browser results for the 3.0 cases: per-period peaks of the last periods, to compare solver against solver
const jsRun={dc_cur:['Y:AM1',.012],pcm_half:['Y:AM1',1e-3],pcm_sub:['Y:AM1',4e-4],blk_cmp_z1:['Y:AM1',4e-3],blk_pwm:['Y:AM1',4e-3]};   // pcm_sub: before chaos separates the two solvers
// browser values at given instants (3.1)
const jsAt={dcm:[.005,.02,.05,.2,.31,.5],pll:[.3],cont:[.003,.05]};
const out={};for(const [k,[id,o,keys]] of Object.entries(cases)){
 if(k==='code_py'){const pr=build('code_loop',{ctrl:'python',ff:'expr'});const r=MNA.exportForBatch(pr,keys);out[k]={net:r.net,channels:r.channels};
  const s=new MNA.Sim(build('code_loop',{ctrl:'pib',ff:'expr'}),{hDiv:1000});s.run(.003);const p=s.per,i=s.chIndex.get('Y:AM1'),pk=[];for(let q=8;q>=1;q--){const j=(p.head-q+p.cap)%p.cap;pk.push({max:p.max[j*p.nch+i],min:p.min[j*p.nch+i],t:p.t[j]});}
  out[k].js={T:s.T,pk,end:s.now('D:PWM1')};continue;}const pr=typeof id==='string'?build(id,o):id;const r=MNA.exportForBatch(pr,keys);out[k]={net:r.net,channels:r.channels};
 if(jsRun[k]){const [key,dur]=jsRun[k];const s=new MNA.Sim(pr,{hDiv:1000});s.run(dur);const p=s.per,i=s.chIndex.get(key),pk=[];for(let q=8;q>=1;q--){const j=(p.head-q+p.cap)%p.cap;pk.push({max:p.max[j*p.nch+i],min:p.min[j*p.nch+i],t:p.t[j]});}out[k].js={T:s.T,pk,end:s.now(key)};}}
for(const [k,ts] of Object.entries(jsAt)){const [id,o,keys]=cases[k];const s=new MNA.Sim(id,{hDiv:1000});out[k].at=ts.map(t=>{s.run(t-s.t);return [t,...keys.map(q=>s.now(q))];});}
console.log(JSON.stringify(out));
