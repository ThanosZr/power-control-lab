// Network library (4.1, ROADMAP §31): web/studio/netlib.js through the browser solver, and the same circuits as
// requests for the SciPy solver (MNA.exportForBatch). Usage: node netlib_cases.js -> JSON
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');const NL=require(W+'/netlib.js');const SUB=require(W+'/subcircuit.js');require(W+'/bus.js');require(W+'/units.js');const MNA=require(W+'/mna.js');require(W+'/tutorials.js');
function project(comps,conns,step=1e-5){let n=0;return {version:3,components:comps.map(c=>({x:0,y:0,rot:0,...c})),
 wires:conns.map(([a,b])=>{const [ac,ap]=a.split(':'),[bc,bp]=b.split(':');return {id:'w'+(n++),a:{c:ac,p:ap},b:{c:bc,p:bp},pts:[]};}),solve:{step}};}
const three=(a,b,s1='',s2='')=>['a','b','c'].map(x=>[`${a}:${x}${s1}`,`${b}:${x}${s2}`]);
// phasor (RMS, degrees) of a channel over one period of 50 Hz, stepping the solver
function phasors(s,keys,f=50,N=2000){const T=1/f,h=T/N,w=2*Math.PI*f,acc=keys.map(()=>[0,0]);
 for(let i=0;i<N;i++){s.run(h);keys.forEach((k,j)=>{const v=s.now(k);acc[j][0]+=v*Math.cos(w*s.t);acc[j][1]-=v*Math.sin(w*s.t);});}
 return acc.map(([re,im])=>({rms:Math.hypot(re,im)*2/N/Math.SQRT2,deg:Math.atan2(im,re)*180/Math.PI}));}
const out={};const t0=Date.now();
const GRID={Un:20e3,Sk:500e6,XR:10,z0:'ratio',Z0Z1:1.5,XR0:5};
out.grid=NL.gridZ(GRID);

// faults at the terminals of the equivalent: RMS of the steady fault currents vs the phase-domain solution
out.faults={};
for(const kind of ['abc','abcg','ag','bg','ab','bc','abg','bcg']){
 const s=new MNA.Sim(project([{id:'G1',type:'GRID3',params:GRID},{id:'F1',type:'FLT3',params:{kind,ton:0.02}}],three('G1','F1')));
 s.run(0.38);const r={};for(const x of ['a','b','c','g'])r[x]=s.lastPeriod('Y:F1/I'+x).rms;
 out.faults[kind]={sim:r,ref:NL.faultCurrents(GRID,{kind}),warn:s.net.warnings};}
// S″k1 given: the single-phase fault current is √3·c·U_n/|2Z₁ + Z₀| = S″k1/(√3·U_n)
{const g={...GRID,z0:'sk1',Sk1:400e6};const s=new MNA.Sim(project([{id:'G1',type:'GRID3',params:g},{id:'F1',type:'FLT3',params:{kind:'ag',ton:0.02}}],three('G1','F1')));
 s.run(0.38);out.sk1={sim:s.lastPeriod('Y:F1/Ia').rms,z:NL.gridZ(g)};}
// isolated neutral: no current in a single-phase fault (only through 1 MΩ)
{const g={...GRID,z0:'iso'};const s=new MNA.Sim(project([{id:'G1',type:'GRID3',params:g},{id:'F1',type:'FLT3',params:{kind:'ag',ton:0.02}}],three('G1','F1')));
 s.run(0.1);out.iso=s.lastPeriod('Y:F1/Ia').rms;}
// peak of the first loop of a three-phase fault at a voltage zero (full DC offset in phase a): IEC 60909 κ = 1,02 + 0,98·e^(−3R/X)
{const s=new MNA.Sim(project([{id:'G1',type:'GRID3',params:{...GRID,phase:0}},{id:'F1',type:'FLT3',params:{kind:'abc',ton:0.02}}],three('G1','F1'),2e-6));
 let ip=0;while(s.t<0.05-1e-12){s.run(2e-6);ip=Math.max(ip,Math.abs(s.now('Y:F1/Ia')));}out.peak={ip,Ik:NL.faultCurrents({...GRID},{kind:'abc'}).a};}

// transformers: vector group = phase shift of the LV phase voltage, no-load ratio, short-circuit voltage
out.xf={};
for(const grp of Object.keys(NL.GROUPS)){
 const p=project([{id:'G1',type:'GRID3',params:{Un:150e3,Sk:1e12,XR:10,cf:1}},{id:'T1',type:'XF3',params:{grp,Sn:40e6,U1:150e3,U2:20e3,uk:10,i0:0.5}},
  {id:'L1',type:'LOAD3',params:{Un:20e3,P:1,Q:0,cn:'yn'}},{id:'VA',type:'VP'},{id:'Va',type:'VP'}],[...three('G1','T1','','1'),...three('T1','L1','2',''),['VA:p','G1:a'],['Va:p','L1:a']]);
 const s=new MNA.Sim(p);s.run(0.2);const [A,a]=phasors(s,['Y:VA','Y:Va']);out.xf[grp]={U1:A.rms*Math.sqrt(3),U2:a.rms*Math.sqrt(3),shift:((a.deg-A.deg+540)%360)-180,warn:s.net.warnings};}
// short-circuit test of Dyn11: LV bolted three-phase fault, HV current = S_n/(√3·U_1·u_k) (P_k = 0,5 % of S_n, so that
// the DC component dies out: τ = X/(ωR) = 64 ms); fundamental phasors over the last period
{const s=new MNA.Sim(project([{id:'G1',type:'GRID3',params:{Un:150e3,Sk:1e12,XR:10,cf:1}},{id:'T1',type:'XF3',params:{grp:'Dyn11',Sn:40e6,U1:150e3,U2:20e3,uk:10,Pk:200e3}},
  {id:'F1',type:'FLT3',params:{kind:'abc',ton:0}},{id:'IA',type:'IP'}],[['G1:a','IA:a'],['IA:b','T1:a1'],['G1:b','T1:b1'],['G1:c','T1:c1'],...three('T1','F1','2','')]));
 s.run(0.98);const [A,a]=phasors(s,['Y:IA','Y:F1/Ia']);out.xfsc={I1:A.rms,Ilv:a.rms};}

// loads: P and Q at U_n from an ideal source (c = 1, very large S″k), Y grounded, Y and Δ: S = Σ V·I* of the fundamental
// phasors of each branch (an ideal source keeps a DC current in L and a fast ringing with C, which an RMS would count)
out.load={};
for(const cn of ['yn','y','d'])for(const Q of [3e6,-3e6]){
 const s=new MNA.Sim(project([{id:'G1',type:'GRID3',params:{Un:20e3,Sk:1e13,XR:10,cf:1}},{id:'L1',type:'LOAD3',params:{cn,Un:20e3,P:10e6,Q}}],three('G1','L1')));
 s.run(0.2);const el=Q>0?'L':'C',k=[];for(const x of ['a','b','c'])k.push('V:L1/R'+x,'I:L1/R'+x,'V:L1/'+el+x,'I:L1/'+el+x);
 const ph=phasors(s,k);let P=0,Qm=0;
 for(let j=0;j<k.length;j+=2){const v=ph[j],i=ph[j+1],d=(v.deg-i.deg)*Math.PI/180;P+=v.rms*i.rms*Math.cos(d);Qm+=v.rms*i.rms*Math.sin(d);}
 out.load[cn+(Q>0?'+':'-')]={P,Q:Qm};}

// circuit breaker: each pole opens at its own first current zero after the command (steady state at the command)
{const s=new MNA.Sim(project([{id:'G1',type:'GRID3',params:GRID},{id:'CB1',type:'CB3',params:{cmd:'0:1, 0.3013:0'}},{id:'L1',type:'LOAD3',params:{P:10e6,Q:5e6}}],
  [...three('G1','CB1','','1'),...three('CB1','L1','2','')]));
 const prev={},stop={},before={};let pk=0;
 while(s.t<0.34-1e-12){s.run(1e-5);for(const x of 'abc'){const i=s.now('Y:CB1/I'+x);if(s.t<0.3)pk=Math.max(pk,Math.abs(i));
  if(prev[x]!==undefined&&Math.abs(prev[x])>1&&Math.abs(i)<1&&stop[x]===undefined&&s.t>0.3013){stop[x]=s.t;before[x]=prev[x];}prev[x]=i;}}
 const leak={};for(const x of 'abc')leak[x]=Math.abs(s.now('Y:CB1/I'+x));
 out.cb={pk,stop,before,leak,events:s.events().list.filter(e=>e.t>0.3).map(e=>[e.t,e.kind,e.src||e.name,e.v])};}
// the same breaker with a bus of conductors and one signal command: identical numbers
{const sep=project([{id:'G1',type:'GRID3',params:GRID},{id:'CB1',type:'CB3',params:{cmd:'0:1, 0.05:0'}},{id:'L1',type:'LOAD3',params:{P:10e6,Q:5e6}}],[...three('G1','CB1','','1'),...three('CB1','L1','2','')]);
 const bus=project([{id:'G1',type:'GRID3',params:{...GRID,conn:'bus'}},{id:'K1',type:'CONST',params:{v:'0:1, 0.05:0'}},{id:'CB1',type:'CB3',params:{ctl:'sig',conn:'bus'}},{id:'L1',type:'LOAD3',params:{P:10e6,Q:5e6,conn:'bus'}}],
  [['G1:abc','CB1:abc1'],['CB1:abc2','L1:abc'],['K1:y','CB1:cmd']]);
 const run=p=>{const s=new MNA.Sim(p),y=[];while(s.t<0.08-1e-12){s.run(1e-4);y.push(s.now('Y:CB1/Ia'),s.now('Y:CB1/Ic'));}return {y,steps:s.steps};};
 const a=run(sep),b=run(bus);let d=0;a.y.forEach((v,i)=>d=Math.max(d,Math.abs(v-b.y[i])));out.busEq={maxDiff:d,steps:[a.steps,b.steps]};}
// a library part inside a user subcircuit: same numbers as at the top level
{const top=project([{id:'G1',type:'GRID3',params:GRID},{id:'F1',type:'FLT3',params:{kind:'ag',ton:0.01}}],three('G1','F1'));
 const def={title:'Δίκτυο',components:[{id:'G1',type:'GRID3',x:0,y:0,params:GRID},{id:'P1',type:'PORT',x:100,y:-20,params:{name:'a'}},{id:'P2',type:'PORT',x:100,y:0,params:{name:'b'}},{id:'P3',type:'PORT',x:100,y:20,params:{name:'c'}}],
  wires:[['G1:a','P1:p'],['G1:b','P2:p'],['G1:c','P3:p']].map(([a,b],i)=>{const [ac,ap]=a.split(':'),[bc,bp]=b.split(':');return {id:'d'+i,a:{c:ac,p:ap},b:{c:bc,p:bp},pts:[]};})};
 const nest=project([{id:'X1',type:'SUB',params:{def:'NET'}},{id:'F1',type:'FLT3',params:{kind:'ag',ton:0.01}}],three('X1','F1'));nest.subcircuits={NET:def};
 const run=p=>{const s=new MNA.Sim(p),y=[];while(s.t<0.05-1e-12){s.run(1e-4);y.push(s.now('Y:F1/Ia'));}return y;};
 const a=run(top),b=run(nest);let d=0;a.forEach((v,i)=>d=Math.max(d,Math.abs(v-b[i])));out.nested={maxDiff:d,inner:SUB.flatten(nest).project.components.some(c=>c.id==='X1/G1/E')};}
// expand() leaves a project without library parts untouched (the same object)
{const p=project([{id:'R1',type:'R'}],[]);out.untouched=NL.expand(p)===p;}

// requests for the SciPy solver: fault on the equivalent, breaker that opens at current zero
const keys=['Y:F1/Ia','Y:F1/Ib','Y:F1/Ig'];
out.req={
 fault:MNA.exportForBatch(project([{id:'G1',type:'GRID3',params:GRID},{id:'F1',type:'FLT3',params:{kind:'bcg',ton:0.0123,toff:0.0607}}],three('G1','F1')),['Y:F1/Ib','Y:F1/Ic','Y:F1/Ig']),
 breaker:MNA.exportForBatch(project([{id:'G1',type:'GRID3',params:GRID},{id:'CB1',type:'CB3',params:{cmd:'0:1, 0.0413:0'}},{id:'L1',type:'LOAD3',params:{P:10e6,Q:5e6}}],
  [...three('G1','CB1','','1'),...three('CB1','L1','2','')]),['Y:CB1/Ia','Y:CB1/Ib','Y:CB1/Ic']),
 xf:MNA.exportForBatch(project([{id:'G1',type:'GRID3',params:{Un:150e3,Sk:5e9}},{id:'T1',type:'XF3',params:{grp:'Dyn11',Pk:100e3,P0:20e3}},{id:'L1',type:'LOAD3',params:{Un:20e3,P:20e6,Q:5e6}},{id:'F1',type:'FLT3',params:{kind:'ag',ton:0.03}}],
  [...three('G1','T1','','1'),...three('T1','L1','2',''),...three('T1','F1','2','')]),['Y:F1/Ia','I:T1/Ta'])};
// the browser waveforms of the same requests, for the comparison
const wave=(p,keys,tEnd,h)=>{const s=new MNA.Sim(p),t=[],y=keys.map(()=>[]);while(s.t<tEnd-1e-12){s.run(h);t.push(s.t);keys.forEach((k,j)=>y[j].push(s.now(k)));}return {t,y};};
out.wave={
 fault:wave(project([{id:'G1',type:'GRID3',params:GRID},{id:'F1',type:'FLT3',params:{kind:'bcg',ton:0.0123,toff:0.0607}}],three('G1','F1')),['Y:F1/Ib','Y:F1/Ic','Y:F1/Ig'],0.08,1e-4),
 breaker:wave(project([{id:'G1',type:'GRID3',params:GRID},{id:'CB1',type:'CB3',params:{cmd:'0:1, 0.0413:0'}},{id:'L1',type:'LOAD3',params:{P:10e6,Q:5e6}}],
  [...three('G1','CB1','','1'),...three('CB1','L1','2','')]),['Y:CB1/Ia','Y:CB1/Ib','Y:CB1/Ic'],0.08,1e-4)};
out.ms=Date.now()-t0;
process.stdout.write(JSON.stringify(out));
