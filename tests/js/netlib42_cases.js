// Network library, the additions of 4.2 (the open points of 4.1): EMF U_n/√3 with c only in Z₁, ZIP load,
// three-legged core, voltage across the breaker poles, live parameters. Usage: node netlib42_cases.js -> JSON
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');const NL=require(W+'/netlib.js');require(W+'/subcircuit.js');require(W+'/bus.js');require(W+'/units.js');const MNA=require(W+'/mna.js');
const P=global.Parts;
function project(comps,conns,step=2e-5){let n=0;return {version:3,components:comps.map(c=>({x:0,y:0,rot:0,...c})),
 wires:conns.map(([a,b])=>{const [ac,ap]=a.split(':'),[bc,bp]=b.split(':');return {id:'w'+(n++),a:{c:ac,p:ap},b:{c:bc,p:bp},pts:[]};}),solve:{step}};}
const three=(a,b,s1='',s2='')=>['a','b','c'].map(x=>[`${a}:${x}${s1}`,`${b}:${x}${s2}`]);
// fundamental phasors (RMS) of channels over one period of 50 Hz
function phasors(s,keys,f=50,N=1000){const T=1/f,h=T/N,w=2*Math.PI*f,acc=keys.map(()=>[0,0]);
 for(let i=0;i<N;i++){s.run(h);keys.forEach((k,j)=>{const v=s.now(k);acc[j][0]+=v*Math.cos(w*s.t);acc[j][1]-=v*Math.sin(w*s.t);});}
 return acc.map(([re,im])=>({re:re*2/N/Math.SQRT2,im:im*2/N/Math.SQRT2}));}
const out={};const t0=Date.now();

// EMF: c·U_n/√3 (4.1) or U_n/√3 with c only in Z₁
for(const emf of ['c','un']){const s=new MNA.Sim(project([{id:'G1',type:'GRID3',params:{Un:20e3,Sk:500e6,XR:10,emf}},{id:'F1',type:'FLT3',params:{kind:'abc',ton:0.02}}],three('G1','F1'),1e-5));
 s.run(0.3);out['emf_'+emf]=s.lastPeriod('Y:F1/Ia').rms;}

// ZIP: the power drawn on a weak grid (S″k = 60 MVA for 8 MW + 3 Mvar), from the phasors of the three phases
function zip(L,Sk=60e6){const comps=[{id:'G1',type:'GRID3',params:{Un:20e3,Sk,XR:3}},{id:'L1',type:'LOAD3',params:{Un:20e3,P:8e6,Q:3e6,...L}},{id:'G',type:'GND',params:{}}],w=[];
 for(const x of 'abc'){comps.push({id:'M'+x,type:'AM',params:{}},{id:'V'+x,type:'VM',params:{}});w.push(['G1:'+x,'M'+x+':a'],['M'+x+':b','L1:'+x],['L1:'+x,'V'+x+':p'],['V'+x+':n','G:g']);}
 const s=new MNA.Sim(project(comps,w));s.run(0.5);const ph=phasors(s,['Y:Ma','Y:Mb','Y:Mc','Y:Va','Y:Vb','Y:Vc']);
 let Pw=0,Q=0,V=0;for(let j=0;j<3;j++){const I=ph[j],U=ph[3+j];Pw+=U.re*I.re+U.im*I.im;Q+=U.im*I.re-U.re*I.im;V+=Math.hypot(U.re,U.im)/3;}
 return {P:Pw,Q,V:V/(20e3/Math.sqrt(3)),warn:s.net.warnings};}
out.zip={z:zip({model:'z'}),p:zip({model:'zip',kz:0,ki:0,kp:100}),i:zip({model:'zip',kz:0,ki:100,kp:0}),mix:zip({model:'zip',kz:40,ki:30,kp:30}),
 delta:zip({model:'zip',kz:0,ki:0,kp:100,cn:'d'})};

// three-legged core: YNyn0, side 2 open, side 1 fed by a zero- or a positive-sequence source at the rated phase voltage
function core(core,seq){const U1=20e3,Vpk=U1*Math.SQRT2/Math.sqrt(3),comps=[{id:'T1',type:'XF3',params:{grp:'YNyn0',Sn:10e6,U1,U2:10e3,uk:8,i0:0.5,core,i00:100}},{id:'G',type:'GND',params:{}}],w=[];
 'abc'.split('').forEach((x,k)=>{comps.push({id:'S'+x,type:'VAC',params:{Vpk,f:50,phase:seq==='zero'?0:-120*k}},{id:'M'+x,type:'AM',params:{}});w.push(['S'+x+':p','M'+x+':a'],['M'+x+':b','T1:'+x+'1'],['S'+x+':n','G:g']);});
 const s=new MNA.Sim(project(comps,w,2e-5));s.run(0.6);return phasors(s,['Y:Ma']).map(p=>Math.hypot(p.re,p.im))[0];}
out.core={zero3x1:core('3x1','zero'),zero3leg:core('3leg','zero'),pos3x1:core('3x1','pos'),pos3leg:core('3leg','pos'),zero5leg:core('5leg','zero')};

// voltage across the poles: the breaker interrupts an inductive load, the channel CB1/Va is v(a1) − v(a2)
{const comps=[{id:'G1',type:'GRID3',params:{Un:20e3,Sk:500e6,XR:10}},{id:'CB1',type:'CB3',params:{cmd:'0:1, 0.0413:0',vm:true}},{id:'L1',type:'LOAD3',params:{P:2e6,Q:8e6}},{id:'G',type:'GND',params:{}},
  {id:'V1',type:'VM',params:{}},{id:'V2',type:'VM',params:{}}];
 const w=[...three('G1','CB1','','1'),...three('CB1','L1','2',''),['CB1:a1','V1:p'],['V1:n','G:g'],['CB1:a2','V2:p'],['V2:n','G:g']];
 const s=new MNA.Sim(project(comps,w,1e-5));let d=0,vmax=0,closed=0;
 while(s.t<0.1-1e-12){s.run(1e-5);const v=s.now('Y:CB1/Va');d=Math.max(d,Math.abs(v-(s.now('Y:V1')-s.now('Y:V2'))));if(s.t<0.04)closed=Math.max(closed,Math.abs(v));else vmax=Math.max(vmax,Math.abs(v));}
 out.pole={diff:d,closed,open:vmax,channel:s.chIndex.has('Y:CB1/Vb')};}

// live parameters: the load steps from 10 to 5 MW in a running simulation (reload with the states carried over)
{const mk=Pw=>project([{id:'G1',type:'GRID3',params:{Un:20e3,Sk:500e6,XR:10}},{id:'L1',type:'LOAD3',params:{P:Pw,Q:2e6}},{id:'M',type:'AM',params:{}}],
  [['G1:a','M:a'],['M:b','L1:a'],['G1:b','L1:b'],['G1:c','L1:c']],2e-5);
 const s=new MNA.Sim(mk(10e6));s.run(0.2);const before=s.now('Y:M');s.load(mk(5e6),false);s.run(2e-5);const after=s.now('Y:M');
 const f=new MNA.Sim(mk(10e6));f.run(0.2);f.load(mk(5e6),true);f.run(2e-5);
 s.run(0.2);const rms=s.lastPeriod('Y:M').rms;
 out.live={before,after,fresh:f.now('Y:M'),rms,ref:5e6/(Math.sqrt(3)*20e3),structural:{P:P.structural('LOAD3','P'),cn:P.structural('LOAD3','cn'),Sk:P.structural('GRID3','Sk'),grp:P.structural('XF3','grp'),uk:P.structural('XF3','uk'),cmd:P.structural('CB3','cmd'),kind:P.structural('FLT3','kind')}};}
out.ms=Date.now()-t0;
process.stdout.write(JSON.stringify(out));
