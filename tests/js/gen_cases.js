// Synchronous generator (4.3, ROADMAP §31.6, §25): web/studio/parts.js (genModel and the conversion of the standard data)
// and the browser solver (GEN3, the steady start of acInit), on the IEEE First Benchmark Model, the generator short
// circuit and the IEEE 9-bus system in EMT. Usage: node gen_cases.js [case] -> JSON. The reference values are in
// tests/test_generator.py, from the sources they name, never from this solver.
const path=require('path');
const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');require(W+'/netlib.js');require(W+'/subcircuit.js');require(W+'/bus.js');require(W+'/units.js');require(W+'/sparse.js');
const MNA=require(W+'/mna.js');require(W+'/tutorials.js');
const P=Parts,only=process.argv[2]||null,out={};
const want=k=>!only||only===k;
const tut=(id,opts={})=>{const t=Tutorials.get(id),o={};for(const q of t.options)o[q.k]=opts[q.k]??q.def;return t.build(o);};

// 1. standard data of the First Benchmark (Table II) → rotor circuit (to compare with Table I), both conversions
if(want('fbm_conv')){const p={...P.defaults('GEN3'),f:60,Xd:1.79,Xdp:0.169,Xdpp:0.135,Xl:0.13,Xq:1.71,Xqp:0.228,Xqpp:0.2,Td0p:4.3,Td0pp:0.032,Tq0p:0.85,Tq0pp:0.05,Ra:0};
 const ex=P.genModel(p),cl=P.genModel({...p,conv:'class'});
 out.fbm_conv={exact:{Xad:ex.Xad,Xaq:ex.Xaq,d:ex.dw,q:ex.qw,note:ex.note},classical:{d:cl.dw,q:cl.qw},Tsc:P.genTsc(1.79,0.169,0.135,4.3,0.032)};}

// 2. the free shaft of the First Benchmark: open-circuit generator (no electrical torque), a torque pulse on the turbine
// masses; the spectrum of the torque of each shaft section, the peaks by parabolic interpolation
if(want('shaft')){const pr=tut('fbm',{case:'1S'});const g=pr.components.find(c=>c.id==='SG1');
 g.params={...g.params,mech:'sched',Tm:'0:0, 0.01:0.2, 0.02:0',Dm:'0; 0; 0; 0; 0; 0'};
 pr.components=pr.components.filter(c=>c.id==='SG1'||c.type==='GND');pr.wires=[];let n=0; // the stator open: 1 GΩ to ground
 for(const k of ['a','b','c']){pr.components.push({id:'R'+k,type:'R',x:0,y:0,rot:0,params:{R:1e9}});pr.wires.push({id:'w'+(n++),a:{c:'SG1',p:k},b:{c:'R'+k,p:'a'},pts:[]},{id:'w'+(n++),a:{c:'R'+k,p:'b'},b:{c:'GND',p:'g'},pts:[]});}
 const s=new MNA.Sim(pr,{hDiv:333}),dt=0.0005,N=8192,x=[[],[],[],[],[]];
 for(let i=0;i<N;i++){s.run(dt);for(let k=0;k<5;k++)x[k].push(s.now('Y:SG1:ts'+(k+1)));}
 const peaks=[];const fs=1/dt,df=fs/N;
 const spec=k=>{const X=x[k],m=X.reduce((a,b)=>a+b,0)/N,A=[];for(let j=0;j<=Math.round(60/df);j++){let re=0,im=0;for(let i=0;i<N;i++){const w=0.5-0.5*Math.cos(2*Math.PI*i/(N-1)),a=2*Math.PI*j*i/N;re+=w*(X[i]-m)*Math.cos(a);im-=w*(X[i]-m)*Math.sin(a);}A.push(Math.hypot(re,im));}return A;};
 const sp=[0,1,2,3,4].map(spec),tot=sp[0].map((_,j)=>sp.reduce((a,A)=>a+A[j]/Math.max(...A),0));
 for(let j=2;j<tot.length-1;j++)if(tot[j]>tot[j-1]&&tot[j]>=tot[j+1]&&tot[j]>0.05*Math.max(...tot)){const a=tot[j-1],b=tot[j],c=tot[j+1],d=(a-c)/(2*(a-2*b+c));peaks.push((j+d)*df);}
 out.shaft={peaks,steps:s.steps};}

// 3. case 1-S (self-excitation, mode 3): the growth of each mode from the envelope of the shaft torques (complex
// demodulation over a Hann window of 0.25 s, a line through log|z| from 0.8 s), and the three critical changes of the paper
function growth(pr,T=4){const s=new MNA.Sim(pr,{hDiv:pr.sim.hDiv}),dt=0.0005,t=[],x=[[],[],[],[],[]];
 while(s.t<T-1e-9){s.run(dt);t.push(s.t);for(let k=0;k<5;k++)x[k].push(s.now('Y:SG1:ts'+(k+1)));}
 const res={};for(const fm of [15.71,20.21,25.55,32.28]){let best=null;for(let k=0;k<5;k++){const X=x[k],win=Math.round(0.25/dt),env=[];
   for(let i=0;i+win<X.length;i+=Math.round(0.05/dt)){let re=0,im=0;for(let j=i;j<i+win;j++){const w=0.5-0.5*Math.cos(2*Math.PI*(j-i)/win);re+=w*X[j]*Math.cos(2*Math.PI*fm*t[j]);im+=w*X[j]*Math.sin(2*Math.PI*fm*t[j]);}env.push([t[i+(win>>1)],Math.hypot(re,im)*4/win]);}
   const q=env.filter(p=>p[0]>=0.8),n=q.length,mx=q.reduce((a,p)=>a+p[0],0)/n,my=q.reduce((a,p)=>a+Math.log(p[1]),0)/n,sl=q.reduce((a,p)=>a+(p[0]-mx)*(Math.log(p[1])-my),0)/q.reduce((a,p)=>a+(p[0]-mx)**2,0);
   if(!best||Math.exp(my)>best.amp)best={amp:Math.exp(my),growth:sl,section:k+1};}res[fm]=best;}
 return res;}
if(want('case1s')){const base=tut('fbm',{case:'1S'}),mod=f=>{const pr=JSON.parse(JSON.stringify(base));f(pr);return pr;},g=pr=>pr.components.find(c=>c.id==='SG1').params;
 const Zb=500e3**2/892.4e6,w=2*Math.PI*60;
 out.case1s={base:growth(base),
  dR:growth(mod(pr=>{g(pr).Ra=0.467;})),
  dD:growth(mod(pr=>{g(pr).Dm='0; 0; 0; 0; '+(0.77504+75.9)+'; 0';})),
  dXc:growth(mod(pr=>{for(const c of pr.components)if(/^C[abc]$/.test(c.id))c.params.C=1/(w*(0.287-0.047)*Zb);
   const E=c=>c.id==='E1';const cp=pr.components.find(E);cp.params.phase=30;}))};}

// 4. case 1-T (fault at B): extremes of the shaft torques after the fault, as read from Fig. 5 of the paper
if(want('case1t')){const pr=tut('fbm',{case:'1T'}),tf=pr.meta.tf,s=new MNA.Sim(pr,{hDiv:pr.sim.hDiv}),r={t:[],ts3:[],ts5:[],te:[]};
 const pre={pe:s.now('Y:SG1:pe'),qe:s.now('Y:SG1:qe'),vt:s.now('Y:SG1:vt')};s.run(tf);const atf={pe:s.now('Y:SG1:pe'),qe:s.now('Y:SG1:qe'),vt:s.now('Y:SG1:vt'),w:s.now('Y:SG1')};
 while(s.t<tf+0.5){s.run(0.0002);r.t.push(s.t-tf);r.ts3.push(s.now('Y:SG1:ts3'));r.ts5.push(s.now('Y:SG1:ts5'));r.te.push(s.now('Y:SG1:te'));}
 const ext=(a,lo,hi,sg)=>{let m=-Infinity,tm=0;a.forEach((v,i)=>{const t=r.t[i];if(t>=lo&&t<=hi&&sg*v>m){m=sg*v;tm=t;}});return [sg*m,tm];};
 out.case1t={pre,atf,ts3a:ext(r.ts3,0,0.25,1),ts3b:ext(r.ts3,0.25,0.4,1),ts3min:ext(r.ts3,0.3,0.4,-1),ts5:ext(r.ts5,0.4,0.48,1),te:ext(r.te,0.05,0.15,1)};}

// 5. short circuit at the terminals: the symmetrical (AC) RMS of each phase over one period, at times τ after the fault
if(want('gen_sc')){const pr=tut('gen_sc',{ra:'0.003',t0:'zero'}),m=pr.meta,s=new MNA.Sim(pr,{hDiv:pr.sim.hDiv}),f=50,res=[];
 for(const tau of [0.1,0.5,1,2]){s.run(m.t0+tau+1/(2*f)-s.t);res.push({tau,ac:['a','b','c'].map(k=>{const q=s.lastPeriod('Y:F1/I'+k);return Math.sqrt(Math.max(0,q.rms*q.rms-q.avg*q.avg));})});}
 out.gen_sc={gen:{...P.defaults('GEN3'),...m.gen},res};}

// 6. steady start (acInit): a generator on an RL load stays where it started
if(want('steady')){const Un=13.8e3,Sn=100e6,Zb=Un*Un/Sn,w=2*Math.PI*50,comps=[{id:'SG1',type:'GEN3',x:0,y:0,rot:0,params:{V0:1,ang0:20}},{id:'GND',type:'GND',x:0,y:0,rot:0,params:{}}],wires=[];let n=0;
 for(const k of ['a','b','c']){comps.push({id:'R'+k,type:'R',x:0,y:0,rot:0,params:{R:Zb/0.8}},{id:'L'+k,type:'L',x:0,y:0,rot:0,params:{L:Zb/0.3/w}});
  for(const [a,b] of [['SG1:'+k,'R'+k+':a'],['R'+k+':b','GND:g'],['SG1:'+k,'L'+k+':a'],['L'+k+':b','GND:g']])wires.push({id:'w'+(n++),a:{c:a.split(':')[0],p:a.split(':')[1]},b:{c:b.split(':')[0],p:b.split(':')[1]},pts:[]});}
 const s=new MNA.Sim({version:4,components:comps,wires},{h:50e-6}),v0={pe:s.now('Y:SG1:pe'),qe:s.now('Y:SG1:qe'),d:s.now('Y:SG1:d')};s.run(1);
 out.steady={start:v0,end:{pe:s.now('Y:SG1:pe'),qe:s.now('Y:SG1:qe'),d:s.now('Y:SG1:d'),w:s.now('Y:SG1')},lf:s.lfInit};}

// 7. IEEE 9 in EMT: the tutorial without and with the fault (classical model of the machines)
if(want('ieee9')){const pr=tut('ieee9_emt',{ev:'none'}),s=new MNA.Sim(pr,{hDiv:pr.sim.hDiv}),f=60;s.run(0.3);
 const map={1:'V:G1',2:'V:G2',3:'V:G3',4:'V:L94/Ca2',5:'V:LD5/Ra',6:'V:L76/Ca2',7:'V:LD7/Ra',8:'V:L87/Ca1',9:'V:LD9/Ra'};const acc={};for(const b in map)acc[b]=[0,0];const N=400;
 for(let i=0;i<N;i++){s.run(1/f/N);for(const b in map){const v=s.now(map[b]);acc[b][0]+=v*Math.sin(2*Math.PI*f*s.t);acc[b][1]+=v*Math.cos(2*Math.PI*f*s.t);}}
 const Vb=345e3*Math.SQRT2/Math.sqrt(3),bus={};for(const b in map){const re=2*acc[b][0]/N,im=2*acc[b][1]/N;bus[b]=[Math.hypot(re,im)/Vb,Math.atan2(im,re)*180/Math.PI];}
 const gen={};for(const g of ['G1','G2','G3'])gen[g]={pe:s.now('Y:'+g+':pe'),qe:s.now('Y:'+g+':qe'),d:s.now('Y:'+g+':d'),w:s.now('Y:'+g)};
 const pf=tut('ieee9_emt',{ev:'fault'}),sf=new MNA.Sim(pf,{hDiv:pf.sim.hDiv}),wr=x=>((x+540)%360)-180,d21=()=>wr(sf.now('Y:G2:d')-sf.now('Y:G1:d'));const d0=d21();let mx=-1e9,tm=0;
 while(sf.t<1.2){sf.run(0.005);const d=d21();if(d>mx){mx=d;tm=sf.t;}}
 out.ieee9={bus,gen,lfTut:pr.meta.lf,warnings:s.net.warnings,swing:{d0,max:mx,t:tm-0.1}};}

process.stdout.write(JSON.stringify(out));
