// 4.10 (ROADMAP §50): the modular arm (CHB), the nearest-level modulation (NLC), the single-phase SOGI-PLL and the m-SSSC
// controller, headless. Usage: node sssc_cases.js '[{kind, …}, …]' -> JSON [result, …]
//  {kind:'arm', N, cell, sel, impl, T, hDiv}        an arm driven by a sine reference in series with a source and R–L: samples
//                                                     of the current, the mean voltage, the level; run time
//  {kind:'armpair', …}                              the same with the fast and the detailed arm: largest differences
//  {kind:'nlc', N, cell, ref, i, v, sel, band, s, n} one step of the modulator (NLC), its states and level
//  {kind:'sogi', impl, A, f, ph, T, k}              the SOGI-PLL on A·sin(2πft + φ): θ, f, amplitude at the end; fast ↔ detailed
//  {kind:'loop', mode, X, …}                        two sources, a line R–L and the m-SSSC (CHB + controller): the current, X,
//                                                     Δθ, the cell voltages at the end
//  {kind:'scipy', …}                                a short run of 'arm' and its SciPy export (from the detailed arm)
//  {kind:'tut', id, opts, at:[t…], keys:[…]}       a tutorial (sssc_1ph, sssc_3ph) as the app builds it: at each t the 50 Hz
//                                                     fundamental (peak, last 4 cycles) and the 4-cycle mean of every key
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');global.Expr=require(W+'/expr.js');global.StepCheck=require(W+'/stepcheck.js');
global.LineModels=require(W+'/linemodels.js');
for(const f of ['netlib','subcircuit','bus','units','nn'])require(W+'/'+f+'.js');
global.MNA=require(W+'/mna.js');
const Wr=(id,a,b)=>({id,a:{c:a[0],p:a[1]},b:{c:b[0],p:b[1]},pts:[]});
const C=(id,type,params)=>({id,type,x:0,y:0,rot:0,params:params||{}});
// an arm in series with a 50 Hz source, R and L; its reference a sine of the same frequency (lagging the source)
function armProject(o){const N=o.N||4;return {version:4,components:[C('V1','VAC',{Vpk:o.Vs||300,f:50}),C('L1','L',{L:o.L||10e-3}),C('R1','R',{R:o.R||1}),
  C('CH1','CHB',{N,cell:o.cell||'fb',C:o.C||2e-3,Vdc:o.Vdc||100,fs:o.fs||5000,sel:o.sel||'sort',band:o.band||5,Rp:o.Rp||0,impl:o.impl||'fast'}),
  C('EX1','EXPR',{expr:o.expr||'250*sin(2*pi*50*t - 0.3)',ins:'',pars:''}),C('G1','GND'),C('G2','GND')],
 wires:[Wr('w1',['V1','p'],['L1','a']),Wr('w2',['L1','b'],['R1','a']),Wr('w3',['R1','b'],['CH1','a']),Wr('w4',['CH1','b'],['G1','g']),Wr('w5',['V1','n'],['G2','g']),Wr('w6',['EX1','y'],['CH1','ref'])]};}
function arm(o){const s=new MNA.Sim(armProject(o),{hDiv:o.hDiv||20,method:o.method||'TR'}),T=o.T||0.1,dt=o.dt||1e-3,out=[],t0=Date.now();let next=0;
 while(s.t<T-1e-12){s.run(Math.min(s.h,T-s.t));if(s.t>=next-1e-9){next+=dt;out.push([s.t,s.now('I:L1'),s.now('Y:CH1/NLC:vav'),s.now('Y:CH1/NLC')]);}}
 return {out,ms:Date.now()-t0,h:s.h,warn:s.net.warnings,sw:s.now('Y:CH1/NLC:sw'),keys:s.keys.filter(k=>k.startsWith('Y:CH1/')).length};}
function armpair(o){const a=arm({...o,impl:'fast'}),b=arm({...o,impl:'blocks'});let di=0,dv=0,dn=0;
 a.out.forEach((r,k)=>{const q=b.out[k];di=Math.max(di,Math.abs(r[1]-q[1]));dv=Math.max(dv,Math.abs(r[2]-q[2]));dn=Math.max(dn,Math.abs(r[3]-q[3]));});
 return {di,dv,dn,imax:Math.max(...a.out.map(r=>Math.abs(r[1]))),ms:a.ms,msBlocks:b.ms,warn:[...a.warn,...b.warn],n:a.out.length,nb:b.out.length};}
// one step of the modulator through the solver's own function (a one-block circuit is enough: CONST inputs, a clock)
function nlc(o){const N=o.v.length,comps=[C('CK','CLK',{f:1000}),C('NL','NLC',{N,cell:o.cell||'fb',Vdc:o.Vdc||100,norm:o.norm||'avg',sel:o.sel||'sort',band:o.band??5,clock:'CK'}),
  C('R','CONST',{v:String(o.ref)}),C('I','CONST',{v:String(o.i)})],wires=[Wr('r',['R','y'],['NL','ref']),Wr('i',['I','y'],['NL','i'])];
 o.v.forEach((x,k)=>{comps.push(C('V'+(k+1),'CONST',{v:String(x)}));wires.push(Wr('v'+k,['V'+(k+1),'y'],['NL','v'+(k+1)]));});
 const s=new MNA.Sim({version:4,components:comps,wires},{hDiv:10});const b=s.net.sig.blocks.find(q=>q.type==='NLC');
 if(o.s){b.st.s=o.s.slice();b.st.n=o.n;b.st.sw=0;b.st.last=null;s.t=1e-3;s.evalBlocks('sample',false);} // from a given selection
 return {s:Array.from(b.st.s),n:b.st.n,sw:b.st.sw,vav:b.st.vav};}
function sogi(o){const run=impl=>{const comps=[C('EX','EXPR',{expr:`${o.A||1}*sin(2*pi*${o.f||50}*t + ${o.ph||0}) + ${o.dc||0}`,ins:'',pars:''}),C('PL','SPLL',{f0:50,bw:o.bw||20,k:o.k||Math.SQRT2,k0:o.k0??0.1,impl})];
  const s=new MNA.Sim({version:4,components:comps,wires:[Wr('w',['EX','y'],['PL','v'])],solve:{tbase:0.02}},{hDiv:o.hDiv||1000});const T=o.T||0.3,ks=impl==='fast'?['Y:PL/X','Y:PL/X:w','Y:PL/X:amp']:['Y:PL/TH','Y:PL/W','Y:PL/VD'],tr=[];
  while(s.t<T-1e-12){s.run(Math.min(s.h,T-s.t));tr.push(ks.map(k=>s.now(k)));}const e=tr[tr.length-1];
  const x=2*Math.PI*(o.f||50)*s.t+(o.ph||0),err=Math.atan2(Math.sin(e[0]-(x-Math.PI/2)),Math.cos(e[0]-(x-Math.PI/2)));return {tr,th:e[0],f:e[1]/(2*Math.PI),amp:e[2],err,h:s.h,warn:s.net.warnings};};
 const a=run('fast'),b=run('blocks');let d=0;a.tr.forEach((r,k)=>r.forEach((v,j)=>{d=Math.max(d,Math.abs(v-b.tr[k][j]));}));
 return {f:a.f,amp:a.amp,err:a.err,d,h:a.h,warn:[...a.warn,...b.warn]};}
// the m-SSSC in series with a line between two sources (single phase): V1 = V̂∠δ, V2 = V̂∠0, R + jωL
function loopProject(o){const N=o.N||10,Vdc=o.Vdc||1000;return {version:4,components:[C('V1','VAC',{Vpk:o.V||122e3,f:50,phase:o.d??4}),C('L1','L',{L:o.L||0.12}),C('R1','R',{R:o.R||8}),C('AM1','AM'),
  C('CH1','CHB',{N,C:o.C||10e-3,Vdc,fs:o.fs||10000,sel:o.sel||'sort',band:o.band||20,impl:o.impl||'fast'}),C('V2','VAC',{Vpk:o.V||122e3,f:50,phase:0}),
  C('SC1','SSSC',{mode:o.mode||'x',X:o.X||'10',Iref:o.Iref||'250',ma:o.ma??0.8,sense:o.sense||'cap',N,Vdc,ton:o.ton??0.15,...(o.sc||{})}),C('G1','GND'),C('G2','GND')],
 wires:[Wr('w1',['V1','p'],['R1','a']),Wr('w2',['R1','b'],['L1','a']),Wr('w3',['L1','b'],['AM1','a']),Wr('w4',['AM1','b'],['CH1','a']),Wr('w5',['CH1','b'],['V2','p']),
  Wr('w6',['V1','n'],['G1','g']),Wr('w7',['V2','n'],['G2','g']),Wr('s1',['AM1','y'],['SC1','i']),Wr('s2',['CH1','v'],['SC1','v']),Wr('s3',['CH1','vav'],['SC1','vav']),Wr('s4',['SC1','vref'],['CH1','ref'])]};}
// (the current, X and Î as means over the last 40 ms: a slow swing of a few % remains with a large inductive X)
function loop(o){const s=new MNA.Sim(loopProject(o),{hDiv:o.hDiv||10,method:'TR'}),T=o.T||0.6,t0=Date.now(),kv=s.keys.filter(k=>/^Y:CH1\/(X:v|V)\d+$/.test(k));let ipk=0,vmin=Infinity,vmax=-Infinity,n=0,X=0,Ia=0;
 while(s.t<T-1e-12){s.run(Math.min(s.h,T-s.t));if(s.t>T-0.02){ipk=Math.max(ipk,Math.abs(s.now('Y:AM1')));for(const k of kv){const v=s.now(k);vmin=Math.min(vmin,v);vmax=Math.max(vmax,v);}}
  if(s.t>T-0.04){n++;X+=s.now('Y:SC1/XM');Ia+=s.now('Y:SC1/PLI/X:amp');}}
 return {ipk,vmin,vmax,X:X/n,dth:s.now('Y:SC1/DTH'),vav:s.now('Y:SC1/VAF'),Iamp:Ia/n,sw:s.now('Y:CH1/NLC:sw'),cells:kv.length,ms:Date.now()-t0,h:s.h,warn:s.net.warnings};}
function scipy(o){const pr=armProject({...o,impl:'fast'}),s=new MNA.Sim(pr,{hDiv:o.hDiv||100,method:'TR'}),T=o.T||0.02,ch=['I:L1','Y:CH1/NLC:vav','Y:CH1/NLC'],rec=[];
 while(s.t<T-1e-12){s.run(Math.min(s.h,T-s.t));rec.push([s.t,...ch.map(k=>s.now(k))]);}
 const bs=new MNA.Sim(NetLib.forceImpl(pr,'blocks'),{hDiv:o.hDiv||100}),keys=bs.keys.filter(k=>ch.includes(k));
 return {rec,ch,batch:MNA.exportForBatch(pr,keys),h:s.h,warn:s.net.warnings};}
// the fundamental (peak) and the mean of each key over the last nc cycles of f, from the samples of every step
function tut(o){require(W+'/tutorials.js');const t=Tutorials.get(o.id),pr=t.build(o.opts||{}),sv=pr.sim||{},s=new MNA.Sim(pr,{hDiv:sv.hDiv||10,method:sv.method||'TR'}),f=50,nc=4,w=2*Math.PI*f,t0=Date.now();
 const keys=o.keys,buf=[],out=[];for(const T of o.at){while(s.t<T-1e-12){s.run(Math.min(s.h,T-s.t));buf.push([s.t,...keys.map(k=>s.now(k))]);if(buf.length&&buf[0][0]<s.t-nc/f-1e-3)buf.shift();}
  const r={t:s.t};const w0=buf.filter(q=>q[0]>=s.t-nc/f-1e-12),Tw=w0[w0.length-1][0]-w0[0][0];
  keys.forEach((k,j)=>{let a=0,b=0,m=0;for(let i=1;i<w0.length;i++){const dt=w0[i][0]-w0[i-1][0],y0=w0[i-1][j+1],y1=w0[i][j+1];a+=dt*(y0*Math.cos(w*w0[i-1][0])+y1*Math.cos(w*w0[i][0]))/2;b+=dt*(y0*Math.sin(w*w0[i-1][0])+y1*Math.sin(w*w0[i][0]))/2;m+=dt*(y0+y1)/2;}
   r[k]={amp:2*Math.hypot(a,b)/Tw,mean:m/Tw};});out.push(r);}
 return {out,ms:Date.now()-t0,h:s.h,warn:s.net.warnings,meta:pr.meta};}
const F={arm,armpair,nlc,sogi,loop,scipy,tut};
const cases=JSON.parse(process.argv[2]||'[]');console.log(JSON.stringify(cases.map(c=>F[c.kind](c))));
