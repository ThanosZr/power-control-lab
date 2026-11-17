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
// 4. Fourier and THD (THEORY §8Σ). Signals of straight segments, where every integral is exact: a clock with duty 0,3 (harmonics
//    (2/(πν))·sin(νπd)), a triangle (4/(π²ν²), odd ν), a sawtooth (1/(πν)); running and per period, a clock as the period, a frequency
//    input (2 kHz on a 2 kHz clock, the parameter 1 kHz), three periods per window, the first window growing or held at y0
{const pr=blocks([['SQ','CLK',{f:1000,duty:.3}],['TRI','RAMP',{f:1000,shape:'tri',lo:0,hi:1}],['SAW','RAMP',{f:1000,shape:'saw',lo:0,hi:1}],['CK','CLK',{f:1000,duty:.5}],
   ['F2K','CONST',{v:2000}],['SQ2','CLK',{f:2000,duty:.3}],
   ...[0,1,2,3,5].map(n=>['Fq'+n,'FOUR',{nu:n,f:1000}]),['Fc3','FOUR',{nu:3,f:1000,ref:'cos'}],['Fp1','FOUR',{nu:1,f:1000,win:'per'}],['Fk2','FOUR',{nu:2,win:'per',clock:'CK'}],
   ['Ft1','FOUR',{nu:1,f:1000,ref:'cos'}],['Ft3','FOUR',{nu:3,f:1000,ref:'cos'}],['Ft2','FOUR',{nu:2,f:1000}],['Fs1','FOUR',{nu:1,f:1000}],['Fs4','FOUR',{nu:4,f:1000}],
   ['Fi1','FOUR',{nu:1,f:1000,fsrc:'in',fmin:500}],['F3w','FOUR',{nu:2,f:1000,np:3}],['Fg','FOUR',{nu:1,f:1000,first:'grow'}],['Fy','FOUR',{nu:1,f:1000,y0:2}],
   ['Hq','THD',{f:1000}],['Ho','THD',{f:1000,dc:'out',scale:'%'}],['Hp','THD',{f:1000,dc:'out',win:'per'}],['Ht','THD',{f:1000,dc:'out'}],['Hk','THD',{win:'per',clock:'CK',dc:'out'}]],
  [...[0,1,2,3,5].map(n=>['SQ:y','Fq'+n+':u']),['SQ:y','Fc3:u'],['SQ:y','Fp1:u'],['SQ:y','Fk2:u'],['TRI:y','Ft1:u'],['TRI:y','Ft3:u'],['TRI:y','Ft2:u'],['SAW:y','Fs1:u'],['SAW:y','Fs4:u'],
   ['SQ2:y','Fi1:u'],['F2K:y','Fi1:f'],['SQ:y','F3w:u'],['CK:y','Fg:u'],['SQ:y','Fy:u'],['SQ:y','Hq:u'],['SQ:y','Ho:u'],['SQ:y','Hp:u'],['TRI:y','Ht:u'],['SAW:y','Hk:u']],200);
 const ids=[...[0,1,2,3,5].map(n=>'Fq'+n),'Fc3','Fp1','Fk2','Ft1','Ft3','Ft2','Fs1','Fs4','Fi1','F3w','Fg','Fy'],keys=[];
 for(const id of ids)keys.push('Y:'+id,'Y:'+id+':ph','Y:'+id+':rms','Y:'+id+':a','Y:'+id+':b');
 for(const id of ['Hq','Ho','Hp','Ht','Hk'])keys.push('Y:'+id,'Y:'+id+':h1','Y:'+id+':hh','Y:'+id+':rms');
 for(const [name,step] of [['four',null],['four_var',{mode:'var'}]]){const s=new MNA.Sim(pr,{hDiv:200,...(step?{step}:{})});out[name]={keys,at:at(s,[.0005,.001,.00237,.004,.0103],keys),warn:s.net.warnings,
   ring:(b=>[b.st.r.t.length,b.st.r.G.length])(s.net.sig.blocks.find(x=>x.id==='Fq1'))};}
 const r=MNA.exportForBatch(pr,keys);out.batch_four={net:r.net,channels:r.channels,keys,at:out.four.at};
 // a saved state: the run continued from it gives the numbers of the run that did not stop
 const A=new MNA.Sim(pr,{hDiv:200});A.run(.00333);const snap=JSON.stringify(A.snapshot());const a=at(A,[.005,.0077,.012],keys);
 const B=MNA.resume(pr,JSON.parse(snap)),b=at(B,[.005,.0077,.012],keys);let d=0;a.forEach((row,i)=>row.forEach((v,j)=>{if(!(v===b[i][j]))d=Math.max(d,Math.abs(v-b[i][j])||Infinity);}));out.four_resume={diff:d,bytes:snap.length};}
// 5. a voltage of the circuit with two harmonics: 50 + 325·sin(ωt + 30°) + 30·sin(5ωt − 60°), against the closed form of the straight line
//    between the points of the solver, and against the harmonics of the scope (Metrics.harmonics: another implementation, on the ring)
{const H=o=>{const p=blocks([['V1','VAC',{Vpk:325,f:50,phase:30,off:50}],['V5','VAC',{Vpk:30,f:250,phase:-60,off:0}],['R1','R',{R:10}],['G1','GND',{}],['VM1','VM',{}],
   ['A1','FOUR',{nu:1,f:50}],['A5','FOUR',{nu:5,f:50}],['A0','FOUR',{nu:0,f:50}],['C5','FOUR',{nu:5,f:50,ref:'cos',win:'per'}],['T1','THD',{f:50}],['T0','THD',{f:50,dc:'out'}],['TP','THD',{f:50,win:'per'}]],
   [['V1:p','R1:a'],['V1:n','V5:p'],['V5:n','G1:g'],['R1:b','G1:g'],['VM1:p','R1:a'],['VM1:n','R1:b'],...['A1','A5','A0','C5','T1','T0','TP'].map(id=>['VM1:y',id+':u'])],o.hDiv);return p;};
 const keys=['Y:A1','Y:A1:ph','Y:A5','Y:A5:ph','Y:A0','Y:C5','Y:C5:ph','Y:T1','Y:T1:h1','Y:T1:hh','Y:T1:rms','Y:T0','Y:TP'];
 for(const N of [400,1600]){const s=new MNA.Sim(H({hDiv:N}),{hDiv:N});const rows=at(s,[.04,.0613,.1],keys);
  const ring=(()=>{const r=s.ring,i=s.chIndex.get('Y:VM1'),t=[],y=[];for(let q=0;q<r.n;q++){const j=(r.head-r.n+q+r.cap)%r.cap;t.push(r.t[j]);y.push(r.d[j*r.nch+i]);}return {t,y};})();
  const M=require(W+'/metrics.js').harmonics({...ring,f1:50,periods:1,H:5,tEnd:s.t});
  out['harm'+N]={keys,at:rows,warn:s.net.warnings,scope:{A1:M.A[1],A5:M.A[5],ph1:M.ph[1],ph5:M.ph[5],dc:M.dc,ta:M.window[0]}};}
 const r=MNA.exportForBatch(H({hDiv:400}),keys);out.batch_harm={net:r.net,channels:r.channels,keys,at:out.harm400.at};}
// 6. an interharmonic: 125 Hz on 50 Hz, with two periods per window (ν = 2,5), and the fundamental over the same window
{const N=400,p=blocks([['V1','VAC',{Vpk:325,f:50}],['V2','VAC',{Vpk:20,f:125,phase:10}],['R1','R',{R:10}],['G1','GND',{}],['VM1','VM',{}],['F','FOUR',{nu:2.5,np:2,f:50}],['F1','FOUR',{nu:1,np:2,f:50}]],
  [['V1:p','R1:a'],['V1:n','V2:p'],['V2:n','G1:g'],['R1:b','G1:g'],['VM1:p','R1:a'],['VM1:n','R1:b'],['VM1:y','F:u'],['VM1:y','F1:u']],N);
 const s=new MNA.Sim(p,{hDiv:N}),keys=['Y:F','Y:F:ph','Y:F1','Y:F1:ph'];out.inter={keys,at:at(s,[.05,.1],keys),warn:s.net.warnings,N};}
// 7. power and sequences (THEORY §8Τ). Signals with known phasors from expressions of t (a clock of 50 Hz sets the step, T/N):
//    v = 325∠30° positive + 20∠−45° negative + 10∠60° zero sequence, i = 30∠−20° + 4∠15° + 3∠−70° (phases from sin, peak values);
//    single phase v = 325·sin(ω₁t), i = 20·sin(ω₁t − 30°) + 5·sin(3ω₁t + 10°) + 2
{const N=400,w='2*pi*50*t',d=x=>x*Math.PI/180,sq=(A,ph,k)=>`${A}*sin(${w} + ${d(ph)} + ${k}*2*pi/3)`;
 const ph3=(P,Ng,Z)=>[0,1,2].map(k=>`${sq(P[0],P[1],-k)} + ${sq(Ng[0],Ng[1],k)} + ${sq(Z[0],Z[1],0)}`);
 const vs=ph3([325,30],[20,-45],[10,60]),is=ph3([30,-20],[4,15],[3,-70]),E=(id,expr)=>[id,'EXPR',{expr,ins:'',pars:''}];
 const p=blocks([['CK','CLK',{f:50,duty:.5}],E('VA',vs[0]),E('VB',vs[1]),E('VC',vs[2]),E('IA',is[0]),E('IB',is[1]),E('IC',is[2]),
   E('V1',`325*sin(${w})`),E('I1',`20*sin(${w} - ${d(30)}) + 5*sin(3*${w} + ${d(10)}) + 2`),
   ['W1','PQ1',{f:50}],['W2','PQ1',{f:50,win:'per'}],['S1','SEQ',{f:50}],['S2','SEQ',{f:50,amp:'rms',win:'per'}],['SI','SEQ',{f:50}],['PP','PPOS',{f:50}],['PQ','PQ3',{}],['PO','PQ3',{qsign:'orig'}],
   ['Ap','AVG',{f:50}],['Aq','AVG',{f:50}],['A0','AVG',{f:50}]],
  [['V1:y','W1:v'],['I1:y','W1:i'],['V1:y','W2:v'],['I1:y','W2:i'],['VA:y','S1:a'],['VB:y','S1:b'],['VC:y','S1:c'],['VA:y','S2:a'],['VB:y','S2:b'],['VC:y','S2:c'],['IA:y','SI:a'],['IB:y','SI:b'],['IC:y','SI:c'],
   ...['PP','PQ','PO'].flatMap(id=>[['VA:y',id+':va'],['VB:y',id+':vb'],['VC:y',id+':vc'],['IA:y',id+':ia'],['IB:y',id+':ib'],['IC:y',id+':ic']]),['PQ:p','Ap:u'],['PQ:q','Aq:u'],['PQ:p0','A0:u']],N);
 const keys=[];for(const id of ['W1','W2'])keys.push('Y:'+id,...['q1','s','pf','p1','pf1'].map(o=>'Y:'+id+':'+o));
 for(const id of ['S1','S2','SI'])keys.push('Y:'+id,...['phpos','neg','phneg','zero','phzero','unb'].map(o=>'Y:'+id+':'+o));
 keys.push('Y:PP','Y:PP:q','Y:PP:v','Y:PP:i','Y:PQ','Y:PQ:q','Y:PQ:p0','Y:PO:q','Y:Ap','Y:Aq','Y:A0','Y:VA','Y:VB','Y:VC','Y:IA','Y:IB','Y:IC');
 const s=new MNA.Sim(p,{hDiv:N});out.power={keys,at:at(s,[.01,.02,.0313,.06,.1],keys),warn:s.net.warnings,N,T:s.T};
 const r=MNA.exportForBatch(p,keys);out.batch_power={net:r.net,channels:r.channels,keys,at:out.power.at};
 const A=new MNA.Sim(p,{hDiv:N});A.run(.0333);const snap=JSON.stringify(A.snapshot());const a=at(A,[.05,.0777],keys);
 const B=MNA.resume(p,JSON.parse(snap)),b=at(B,[.05,.0777],keys);let dd=0;a.forEach((row,i)=>row.forEach((v,j)=>{if(!(v===b[i][j]))dd=Math.max(dd,Math.abs(v-b[i][j])||Infinity);}));out.power_resume={diff:dd};}
// 8. a known load: 325 V, 50 Hz on R = 10 Ω in series with L = 31,83 mH, voltage and current to the single-phase power block; and the
//    same with the variable step
{const rl=N=>blocks([['V1','VAC',{Vpk:325,f:50}],['AM1','AM',{}],['R1','R',{R:10}],['L1','L',{L:.03183}],['G1','GND',{}],['VM1','VM',{}],['W','PQ1',{f:50}]],
   [['V1:p','AM1:a'],['AM1:b','R1:a'],['R1:b','L1:a'],['L1:b','G1:g'],['V1:n','G1:g'],['VM1:p','AM1:b'],['VM1:n','G1:g'],['VM1:y','W:v'],['AM1:y','W:i']],N);
 const keys=['Y:W','Y:W:q1','Y:W:s','Y:W:pf','Y:W:p1','Y:W:pf1'];
 for(const [name,step] of [['rl',null],['rl_var',{mode:'var'}]]){const s=new MNA.Sim(rl(400),{hDiv:400,...(step?{step}:{})});out[name]={keys,at:at(s,[.2,.3],keys),warn:s.net.warnings,h:s.h};}}
// 9. the periodic average of impulses (THEORY §8Υ). A staircase that rises by 2 at 1,3 ms, 3 at 4,2 ms, 0,5 at 6 ms (on a boundary of
//    the 1 ms periods) and 0,5 at 8,1 ms; a straight line 3·t; and the switching energy of a switch with E_on, E_off in a converter
//    against the switching losses of the scope (PSW, per period)
{const p=blocks([['U','CONST',{v:'0:0, 0.0013:2, 0.0042:5, 0.006:5.5, 0.0081:6'}],['L','EXPR',{expr:'3*t',ins:'',pars:''}],
   ['P1','PIA',{f:1000}],['R1','PIA',{f:1000,win:'run'}],['P2','PIA',{f:1000,np:2}],['G1','PIA',{f:1000,win:'run',first:'grow'}],['PL','PIA',{f:1000}],['RL','PIA',{f:1000,win:'run'}]],
  [['U:y','P1:u'],['U:y','R1:u'],['U:y','P2:u'],['U:y','G1:u'],['L:y','PL:u'],['L:y','RL:u']],200);
 const keys=['Y:P1','Y:R1','Y:P2','Y:G1','Y:PL','Y:RL'],ts=[.0005,.0019,.002,.0025,.003,.0045,.005,.0061,.007,.0085,.009,.0095,.0123];
 for(const [name,step] of [['pia',null],['pia_var',{mode:'var'}]]){const s=new MNA.Sim(p,{hDiv:200,...(step?{step}:{})});out[name]={keys,at:at(s,ts,keys),warn:s.net.warnings};}
 const r=MNA.exportForBatch(p,keys);out.batch_pia={net:r.net,channels:r.channels,keys,at:out.pia.at};
 const A=new MNA.Sim(p,{hDiv:200});A.run(.0047);const snap=JSON.stringify(A.snapshot());const a=at(A,[.0061,.0085,.0123],keys);
 const B=MNA.resume(p,JSON.parse(snap)),b=at(B,[.0061,.0085,.0123],keys);let dd=0;a.forEach((row,i)=>row.forEach((v,j)=>{if(!(v===b[i][j]))dd=Math.max(dd,Math.abs(v-b[i][j])||Infinity);}));out.pia_resume={diff:dd};}
{require(W+'/tutorials.js');const T=globalThis.Tutorials,t=T.get('battery'),o={};for(const op of t.options)o[op.k]=op.def;o.sw='real';o.ctrl='fixed';const pr=t.build(o);
 pr.components.push({id:'ME',type:'MEAS',x:0,y:-300,rot:0,params:{src:'S1',qty:'E'}},{id:'PA',type:'PIA',x:100,y:-300,rot:0,params:{win:'per',clock:'PWM1'}},
  {id:'PR',type:'PIA',x:200,y:-300,rot:0,params:{win:'run',f:20000}},{id:'MB',type:'MEAS',x:300,y:-300,rot:0,params:{src:'L1',qty:'E'}});
 pr.wires.push(Wr('wme1',['ME','y'],['PA','u']),Wr('wme2',['ME','y'],['PR','u']));
 const s=new MNA.Sim(pr,{hDiv:pr.sim.hDiv,method:pr.sim.method||'TR'}),rows=[];const T0=s.T;
 for(const k of [20,40,41,60]){s.run(k*T0+.3*T0-s.t);rows.push({t:s.t,pa:s.now('Y:PA'),pr:s.now('Y:PR'),psw:s.now('PSW:S1'),E:s.now('Y:ME'),n:s.net.compInfo.get('S1').loss.n,mb:s.now('Y:MB')});}
 let err=null;try{MNA.exportForBatch(pr,['Y:PA']);}catch(e){err=String(e.message||e);}
 out.sw_loss={rows,T:T0,warn:s.net.warnings,batch_error:err};}
// 10. the tutorial pq_rect (a diode bridge with a capacitor): the blocks against the harmonics of the scope on the same current, the
//     running window against the per-period one in periodic operation, and the card's identity PF = PF₁/√(1 + THD²)
{require(W+'/tutorials.js');const T=globalThis.Tutorials,M=require(W+'/metrics.js'),keys=['Y:PW','Y:PW:q1','Y:PW:s','Y:PW:pf','Y:PW:p1','Y:PW:pf1','Y:TH','Y:TH:h1','Y:TH:rms','Y:F3','Y:F3:ph','Y:AV'];
 for(const win of ['per','run']){const pr=T.get('pq_rect').build({Ls:'0.002',R:'100',win}),s=new MNA.Sim(pr,{hDiv:pr.sim.hDiv,method:'TR'});s.run(.3);
  const r=s.ring,i=s.chIndex.get('Y:AM1'),tt=[],yy=[];for(let q=0;q<r.n;q++){const j=(r.head-r.n+q+r.cap)%r.cap;tt.push(r.t[j]);yy.push(r.d[j*r.nch+i]);}
  const H=M.harmonics({t:tt,y:yy,f1:50,periods:1,H:50,tEnd:s.t});
  out['tut_'+win]={keys,at:[[s.t,...keys.map(k=>s.now(k))]],warn:s.net.warnings,scope:{thdAll:H.thdAll,A1:H.A1,A3:H.A[3],rms:H.rms,dc:H.dc},vd:s.lastPeriod('Y:VM2').avg};}}
console.log(JSON.stringify(out));
