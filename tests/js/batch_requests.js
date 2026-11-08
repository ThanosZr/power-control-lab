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
const cases={buck_dcm:[buckDcm,null,['V:C1','I:L1']],rectifier:['rectifier',{},['I:R1']],bridge3_scr:['bridge3',{dev:'30',load:'r'},['V:R1']],
 battery_pi:['battery',{ctrl:'pi'},['I:L1','D:PWM1']],deadtime:['battery',{sw:'real',ctrl:'pi'},['I:L1']],
 sampling_saw:['sampling',{case:'saw'},['I:L1','H:SH1','CAR:PWM1']],sampling_tri2:['sampling',{case:'tri2',start:'midon'},['I:L1','H:SH1']],
 sampling_pi:['sampling',{case:'saw',ctrl:'pi'},['I:L1','H:SH1','D:PWM1']],
 poly4:['polyphase',{N:'4',vst:'mid'},['I:L1','I:L3','I:VB']],
 sampling_double:['sampling',{case:'tri2',ctrl:'pi',upd:'double'},['I:L1','H:SH1','D:PWM1']],share_dcr:['polyphase',{ctrl:'open',mis:'dcr'},['I:L2']],
 pulses:['sampling',{case:'tri2',sw:'real'},['GS:S1','GS:S2','D:PWM1']],
 pcm_half:['peak_cm',{ramp:'half'},['Y:AM1','Y:SR1','GS:S1']],pcm_sub:['peak_cm',{D:'0.6',ramp:'none'},['Y:AM1','GS:S1']],
 blk_cmp_z1:['blocks_loop',{mod:'cmp',delay:'z1'},['Y:AM1','Y:UD1','GS:S1']],blk_pwm:['blocks_loop',{},['Y:AM1','D:PWM1','Y:PI1']]};
// browser results for the 3.0 cases: per-period peaks of the last periods, to compare solver against solver
const jsRun={pcm_half:['Y:AM1',1e-3],pcm_sub:['Y:AM1',4e-4],blk_cmp_z1:['Y:AM1',4e-3],blk_pwm:['Y:AM1',4e-3]};   // pcm_sub: before chaos separates the two solvers
const out={};for(const [k,[id,o,keys]] of Object.entries(cases)){const pr=typeof id==='string'?build(id,o):id;const r=MNA.exportForBatch(pr,keys);out[k]={net:r.net,channels:r.channels};
 if(jsRun[k]){const [key,dur]=jsRun[k];const s=new MNA.Sim(pr,{hDiv:1000});s.run(dur);const p=s.per,i=s.chIndex.get(key),pk=[];for(let q=8;q>=1;q--){const j=(p.head-q+p.cap)%p.cap;pk.push({max:p.max[j*p.nch+i],min:p.min[j*p.nch+i],t:p.t[j]});}out[k].js={T:s.T,pk,end:s.now(key)};}}
console.log(JSON.stringify(out));
