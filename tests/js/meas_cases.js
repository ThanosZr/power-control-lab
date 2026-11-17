// 4.19.6 (ROADMAP §76): the blocks that measure a signal inside the simulation (AVG, RMS, MNMX) against closed forms, against the
// period statistics of the scope, after a saved state, and their export for the SciPy solver. Usage: node meas_cases.js -> JSON
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');global.Expr=require(W+'/expr.js');global.StepCheck=require(W+'/stepcheck.js');
global.LineModels=require(W+'/linemodels.js');
for(const f of ['netlib','subcircuit','bus','units','nn'])require(W+'/'+f+'.js');
global.MNA=require(W+'/mna.js');
const Wr=(id,a,b)=>({id,a:{c:a[0],p:a[1]},b:{c:b[0],p:b[1]},pts:[]});
// a project of signal blocks only: [id, type, params], and wires 'A:y' -> 'B:u'
function blocks(parts,wires,hDiv=200){return {version:4,sim:{hDiv,speed:100,stopT:0},components:parts.map(([id,type,params],i)=>({id,type,x:100*i,y:0,rot:0,params:params||{}})),
  wires:wires.map(([a,b],i)=>Wr('w'+i,a.split(':'),b.split(':')))};}
// a sine source with an offset on a resistor, a voltmeter, and measuring blocks on the voltmeter
function sine(meas,o={}){const p=blocks([['V1','VAC',{Vpk:325,f:50,phase:0,off:o.off??50}],['R1','R',{R:10}],['G1','GND',{}],['VM1','VM',{}],...meas],
  [['V1:p','R1:a'],['R1:b','V1:n'],['V1:n','G1:g'],['VM1:p','R1:a'],['VM1:n','R1:b'],...meas.map(([id])=>['VM1:y',id+':u'])],o.hDiv||400);return p;}
const at=(s,ts,keys)=>ts.map(t=>{s.run(t-s.t);return [t,...keys.map(k=>s.now(k))];});
const out={};
// 1. sine with an offset: mean and RMS, running and per period, the first window (held or growing), two periods, lowest and highest
{const meas=[['A1','AVG',{win:'run',f:50}],['Q1','RMS',{win:'run',f:50}],['A2','AVG',{win:'per',f:50}],['Q2','RMS',{win:'per',f:50}],['M1','MNMX',{f:50}],
  ['Q3','RMS',{win:'run',f:50,first:'grow'}],['Q4','RMS',{win:'run',f:50,np:2}],['A3','AVG',{win:'run',f:50,y0:7}]];
 const keys=['Y:A1','Y:Q1','Y:A2','Y:Q2','Y:M1','Y:M1:max','Y:M1:pp','Y:Q3','Y:Q4','Y:A3'],ts=[.005,.02,.0275,.04,.0613,.1,.3];
 for(const hDiv of [400,1600]){const s=new MNA.Sim(sine(meas,{hDiv}),{hDiv});out['sine'+hDiv]={keys,at:at(s,ts,keys),warn:s.net.warnings,
   ring:(b=>[b.st.r.t.length,b.st.r.i])(s.net.sig.blocks.find(x=>x.id==='Q1'))};}
 // the per-period blocks against the period statistics of the scope (float32 there), with the fixed and with the variable step
 for(const [name,step] of [['scope_fixed',null],['scope_var',{mode:'var'}]]){const s=new MNA.Sim(sine(meas),{hDiv:400,...(step?{step}:{})});const rows=[];
  for(const t of [.02,.04,.1]){s.run(t-s.t);const lp=s.lastPeriod('Y:VM1');rows.push({t,avg:[s.now('Y:A2'),lp.avg],rms:[s.now('Y:Q2'),lp.rms],min:[s.now('Y:M1'),lp.min],max:[s.now('Y:M1:max'),lp.max]});}out[name]=rows;}
 // the request of the SciPy solver for the same circuit
 const pr=sine(meas),r=MNA.exportForBatch(pr,keys);out.batch_sine={net:r.net,channels:r.channels,keys,at:out.sine400.at};
 // a saved state: the run continued from it gives the numbers of the run that did not stop
 const A=new MNA.Sim(sine(meas),{hDiv:400});A.run(.0333);const snap=JSON.stringify(A.snapshot());const a=at(A,[.05,.0777,.12],keys);
 const B=MNA.resume(sine(meas),JSON.parse(snap)),b=at(B,[.05,.0777,.12],keys);let d=0;a.forEach((row,i)=>row.forEach((v,j)=>{if(!(v===b[i][j]))d=Math.max(d,Math.abs(v-b[i][j])||Infinity);}));out.resume={diff:d,bytes:snap.length};}
// 2. signals made of straight segments, where the two integrals are exact: triangle and sawtooth 0…1 (mean 1/2, RMS 1/√3), a clock with
//    duty 0,3 (mean 0,3, RMS √0,3: a jump at every edge), the same through the clock of the block Ρολόι, and three periods per window
{const pr=blocks([['TRI','RAMP',{f:1000,shape:'tri',lo:0,hi:1}],['SAW','RAMP',{f:1000,shape:'saw',lo:0,hi:1}],['SQ','CLK',{f:1000,duty:.3}],['CK','CLK',{f:1000,duty:.5}],
   ['At','AVG',{win:'per',f:1000}],['Qt','RMS',{win:'per',f:1000}],['Mt','MNMX',{f:1000}],['As','AVG',{win:'run',f:1000}],['Qs','RMS',{win:'run',f:1000}],
   ['Aq','AVG',{win:'run',f:1000}],['Qq','RMS',{win:'run',f:1000}],['Aq2','AVG',{win:'per',f:1000}],['Qc','RMS',{win:'per',clock:'CK',f:50}],['Mc','MNMX',{clock:'CK',f:50}],['Q3','RMS',{win:'run',f:1000,np:3}]],
  [['TRI:y','At:u'],['TRI:y','Qt:u'],['TRI:y','Mt:u'],['SAW:y','As:u'],['SAW:y','Qs:u'],['SQ:y','Aq:u'],['SQ:y','Qq:u'],['SQ:y','Aq2:u'],['SAW:y','Qc:u'],['SQ:y','Mc:u'],['TRI:y','Q3:u']],200);
 const keys=['Y:At','Y:Qt','Y:Mt','Y:Mt:max','Y:Mt:pp','Y:As','Y:Qs','Y:Aq','Y:Qq','Y:Aq2','Y:Qc','Y:Mc','Y:Mc:max','Y:Q3'];
 for(const [name,step] of [['shapes',null],['shapes_var',{mode:'var'}]]){const s=new MNA.Sim(pr,{hDiv:200,...(step?{step}:{})});out[name]={keys,at:at(s,[.0005,.001,.00237,.004,.01,.0503],keys),warn:s.net.warnings};}
 const r=MNA.exportForBatch(pr,keys);out.batch_shapes={net:r.net,channels:r.channels,keys,at:out.shapes.at};}
// 3. a step of the input at 3,3 ms: the running mean rises along a straight line for one window; with the frequency as an input the
//    window follows it (1 kHz, then 2 kHz from 6 ms: the mean of a constant stays, and a second step at 8 ms rises in half the time)
{const pr=blocks([['U','CONST',{v:'0:0, 0.0033:1, 0.008:3'}],['F','CONST',{v:'0:1000, 0.006:2000'}],['A1','AVG',{win:'run',f:1000}],['A2','AVG',{win:'run',f:1000,fsrc:'in',fmin:500}],['Q1','RMS',{win:'run',f:1000}]],
  [['U:y','A1:u'],['U:y','A2:u'],['F:y','A2:f'],['U:y','Q1:u']],200);
 const s=new MNA.Sim(pr,{hDiv:200}),keys=['Y:A1','Y:A2','Y:Q1'];out.step={keys,at:at(s,[.003,.0035,.0038,.0043,.005,.0081,.00825,.0085,.0091],keys),warn:s.net.warnings,T:s.T};}
console.log(JSON.stringify(out));
