// 4.22: the disconnector with restrikes (DS), the leader progression model (SG and TOWER), the initial voltage of a line
// (TL v0), the GIS tutorials. Usage: node gis_cases.js [only] -> JSON
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');require(W+'/expr.js');global.NetLib=require(W+'/netlib.js');const MNA=require(W+'/mna.js');require(W+'/tutorials.js');
const T=globalThis.Tutorials,only=process.argv[2]||'';
const C=(id,type,params)=>({id,type,x:0,y:0,rot:0,params});let wn=0;
const proj=(comps,conns,sim={})=>({version:3,components:comps,wires:conns.map(([a,b])=>{const [ac,ap]=a.split(':'),[bc,bp]=b.split(':');return {id:'w'+(++wn),a:{c:ac,p:ap},b:{c:bc,p:bp},pts:[]};}),sim:{hDiv:100,stopT:0,...sim},scope:{panes:[]},meta:{}});
const build=(id,opts={})=>{const t=T.get(id);const o={};for(const op of t.options)o[op.k]=opts[op.k]??op.def;return t.build(o);};
const gaps=s=>s.events().list.filter(e=>e.kind==='gap').map(e=>[e.t,e.v,e.src]);
const peak=(s,k)=>{const R=s.ring,n=R.n,st=(R.head-n+R.cap)%R.cap,i=s.chIndex.get(k);let m=0,tm=0;for(let q=0;q<n;q++){const j=(st+q)%R.cap,v=R.d[j*R.nch+i];if(Math.abs(v)>Math.abs(m)){m=v;tm=R.t[j];}}return [m,tm];};
const out={};const want=k=>!only||only.split(',').includes(k);
// the disconnector: 50 Hz source behind 1 mH and 200 Ω onto a bus of 1 nF (closing with −1 pu on the bus, opening)
const Vp=343e3;
const ds=(op,Ts)=>proj([C('V1','VAC',{Vpk:Vp,f:50,phase:0}),C('L1','L',{L:1e-3}),C('R1','R',{R:200}),C('DS1','DS',{op,t0:'1m',Ts:String(Ts),Um:3.5*Vp,Rarc:1,ext:'iext',Iext:1}),C('C1','C',{C:'1n',v0:op==='close'?-Vp:0}),C('G','GND',{})],
 [['V1:p','L1:a'],['L1:b','R1:a'],['R1:b','DS1:a'],['DS1:b','C1:p'],['C1:n','G:g'],['V1:n','G:g']]);
if(want('ds'))for(const [op,Ts,T1] of [['close',.012,.016],['open',.012,.03]]){const pr=ds(op,Ts);const s=new MNA.Sim(pr,{h:2e-8});s.run(T1);
 out['ds_'+op]={gaps:gaps(s),vC:s.now('V:C1'),req:MNA.exportForBatch(pr,['V:C1','I:DS1']),T1};}
// the initial voltage of a line: −1 kV, a source of 2 kV behind 50 Ω closes at 1 μs through a gap; the far end open (1 pF)
if(want('tl')){const pr=proj([C('V1','VDC',{V:2000}),C('R1','R',{R:50}),C('SG1','SG',{Ub:1e9,trig:'1u',Rarc:1e-3,ext:'never'}),C('TL1','TL',{spec:'zt',Z:50,tau:'2u',v0:-1000}),C('G','GND',{}),C('C0','C',{C:'1p',v0:0})],
 [['V1:p','R1:a'],['R1:b','SG1:a'],['SG1:b','TL1:a1'],['TL1:b1','G:g'],['TL1:b2','G:g'],['V1:n','G:g'],['TL1:a2','C0:p'],['C0:n','G:g']]);
 const s=new MNA.Sim(pr,{h:1e-8});const v=[];for(const t of [2.5e-6,5.5e-6,9.5e-6]){s.run(t-s.t);v.push(s.now('V:C0'));}out.tl={v,req:MNA.exportForBatch(pr,['V:C0'])};
 // coaxial data: Z = 60·ln(D/d)/√ε_r, τ = len·√ε_r/(k·c)
 out.coax=Parts.tlParams({spec:'coax',Dco:.5,dco:.15,erco:1,kv:.96,len:10});out.coax_cable=Parts.tlParams({spec:'coax',Dco:.06,dco:.02,erco:2.3,kv:1,len:100});}
// LPM: a ramp of 1 MV/μs onto a gap of 1 m through 10 Ω (both polarities), browser at two steps
if(want('lpm'))for(const S of [1e12,-1e12,4e11]){const pr=proj([C('V1','VIMP',{shape:'ramp',S:Math.abs(S),Vpk:S>0?3e6:-3e6}),C('R1','R',{R:10}),C('SG1','SG',{vt:'lpm',gl:1,E50:560e3,Kp:1.2e-6,E0p:520e3,Kn:1.3e-6,E0n:600e3,Rarc:.1,ext:'never'}),C('G','GND',{})],
  [['V1:p','R1:a'],['R1:b','SG1:a'],['SG1:b','G:g'],['V1:n','G:g']]);const r={};for(const h of [1e-9,1e-10]){const s=new MNA.Sim(pr,{h});s.run(8e-6);r['h'+h]=gaps(s)[0]?.[0]??null;}
 out['lpm_'+S]={...r,req:MNA.exportForBatch(pr,['V:SG1'])};}
// the multistory tower: the values of its R ∥ L from the definition (Ishii et al. 1991, Table I: H = 62,88 m as we read it)
if(want('ms')){const d=NetLib.defOf({id:'TW',type:'TOWER',params:{...Parts.defaults('TOWER'),model:'ms',h:62.88,Zt1:220,Zt2:150,gam:.8,h1:5.33,h2:13.05,h3:13.05,vt:3e8,foot:'r',R0:10,ins:'none',meas:false}});
 out.ms={R:['R1','R2','R3','R4'].map(id=>+d.components.find(c=>c.id===id).params.R),L:['L1','L2','L3','L4'].map(id=>+d.components.find(c=>c.id===id).params.L),
  types:[...new Set(d.components.map(c=>c.type))].sort()};}
// the tutorials: the lattice comparison (the projects and the samples), the lightning tutorial with the new options
if(want('tut')){const tt=[10e-9,16.6e-9,50e-9,70e-9,100e-9,130e-9,190e-9,250e-9,300e-9,400e-9,490e-9];
 {const pr=build('gis765_lv');const s=new MNA.Sim(pr,{hDiv:pr.sim.hDiv});const uc=[],uk=[];for(const t of tt){s.run(t-s.t);uc.push(s.now('Y:VUC'));uk.push(s.now('Y:VUK'));}
  out.gis765={project:pr,t:tt,uc,uk,h:s.h,arrive:null};}
 {const pr=build('gis_vfto');const s=new MNA.Sim(pr,{hDiv:pr.sim.hDiv});s.run(pr.sim.stopT);const closes={};for(const [t,v,src] of gaps(s))if(v===1&&!(src in closes))closes[src]=t;
  out.vfto={project:pr,closes,h:s.h,peaks:Object.fromEntries(['Y:VUK','Y:VT18','Y:VT29','Y:VJ7'].map(k=>[k,peak(s,k)])),Vs:pr.meta.gis.Vs};}
 for(const [k,o] of [['lg_ub',{foot:'r50'}],['lg_de',{foot:'r50',ins:'de'}],['lg_lpm',{foot:'r50',ins:'lpm'}],['lg_ms',{tm:'ms'}]]){const pr=build('lightning_gis',o);const s=new MNA.Sim(pr,{hDiv:pr.sim.hDiv,method:pr.sim.method});s.run(pr.sim.stopT);
  out[k]={gaps:gaps(s).filter(g=>g[1]===1).map(g=>g[0]),Ua:peak(s,'Y:T2/Ua'),top:peak(s,'Y:T2/Vtop')};}
 for(const op of ['close','open']){const pr=build('ds_restrike',{op});const s=new MNA.Sim(pr,{hDiv:pr.sim.hDiv});s.run(pr.sim.stopT);out['dsr_'+op]={n:gaps(s).filter(g=>g[1]===1).length,end:s.now('Y:VLB'),Vp:pr.meta.gis.Vp};}
 {const pr=build('insco_study');const s=new MNA.Sim(pr,{hDiv:pr.sim.hDiv});s.run(pr.sim.stopT);out.insco={VT:peak(s,'Y:VT'),VE:peak(s,'Y:VE')};}}
process.stdout.write(JSON.stringify(out));
