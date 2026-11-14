// 4.9.1 (ROADMAP §52): the two implementations of a library part give the same circuit, and a library part expanded into an
// ordinary subcircuit gives the same numbers. Usage: node impl_cases.js '[{kind, …}, …]' -> JSON [result, …]
//  {kind:'arr', I, T1, T2, Ll, method}      the arrester alone: peak voltage and the largest difference fast ↔ detailed
//  {kind:'lightning', ov}                   the tutorial lightning_gis: peaks and flashovers, detailed ↔ fast, and the run times
//  {kind:'expand', id, stop}                a tutorial with every library part expanded (SubCircuit.fromLib): largest difference
//  {kind:'draw'}                            the drawing of every library part (NetLib.layoutDef, Inside.drawEl): parts, overlaps
//  {kind:'fit', U10, d, n}                  the L₁ of the IEEE arrester adjusted to U₁₀, and the voltage it then gives
//  {kind:'export'}                          the SciPy export of fast parts: the detailed elements, no compact ones
//  {kind:'tower', I, ins, stop, hDiv}       a struck tower with an arrester (detailed) and its SciPy export (from the fast one)
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');global.Expr=require(W+'/expr.js');global.StepCheck=require(W+'/stepcheck.js');
global.LineModels=require(W+'/linemodels.js');
for(const f of ['netlib','subcircuit','bus','units','nn'])require(W+'/'+f+'.js');
global.MNA=require(W+'/mna.js');require(W+'/tutorials.js');const T=globalThis.Tutorials,NL=globalThis.NetLib,SC=globalThis.SubCircuit,P=globalThis.Parts;
const Inside=require(W+'/inside.js');
function build(id,ov){const t=T.get(id);const o={};for(const op of t.options||[])o[op.k]=op.def;return t.build(Object.assign(o,ov||{}));}
const Wr=(id,a,b)=>({id,a:{c:a[0],p:a[1]},b:{c:b[0],p:b[1]},pts:[]});
function arrProject(o,impl,extra){return {version:4,components:[{id:'I1',type:'ILG',x:0,y:0,rot:0,params:{shape:'custom',model:'heidler',T1:o.T1,T2:o.T2,n:10,Ipk:o.I,t0:0}},
  {id:'SA1',type:'SAI',x:100,y:0,rot:0,params:{U10:819e3,d:3.216,n:1,meas:true,Llead:o.Ll||0,impl,...(extra||{})}},
  {id:'G1',type:'GND',x:0,y:100,rot:0,params:{}},{id:'G2',type:'GND',x:100,y:100,rot:0,params:{}}],wires:[Wr('w1',['I1','p'],['SA1','a']),Wr('w2',['SA1','b'],['G2','g']),Wr('w3',['I1','n'],['G1','g'])]};}
function arr(o){const run=impl=>{const s=new MNA.Sim(arrProject(o,impl),{hDiv:600,method:o.method||'TR'}),stop=4*o.T2,tr=[];let v=0;
  while(s.t<stop-1e-12){s.run(Math.min(s.h,stop-s.t));const x=s.now('Y:SA1/V');tr.push(x);v=Math.max(v,Math.abs(x));}return {v,tr};};
 const a=run('blocks'),b=run('fast');let d=0;a.tr.forEach((x,k)=>{d=Math.max(d,Math.abs(x-b.tr[k]));});return {v:a.v,vf:b.v,d,n:a.tr.length,nf:b.tr.length};}
function lightning(ov){const run=impl=>{const pr=build('lightning_gis',{...ov,impl}),t0=Date.now(),s=new MNA.Sim(pr,{hDiv:pr.sim.hDiv,method:pr.sim.method||'TR'});
  const ch=['I:I1','Y:T2/Vtop','Y:T2/If'];for(const x of ['a','b','c']){ch.push('Y:VE'+x,'Y:VG'+x,'Y:VT'+x);for(const t of ['T1','T2','T3'])ch.push(`Y:${t}/U${x}`,`Y:${t}/I${x}`);}
  const peak={},flash={};for(const c of ch)peak[c]=0;
  while(s.t<pr.sim.stopT-1e-12){s.run(Math.min(s.h,pr.sim.stopT-s.t));for(const c of ch){const v=Math.abs(s.now(c));if(!(v<=peak[c]))peak[c]=v;
   const g=/^Y:(T\d)\/I([abc])$/.exec(c);if(g&&v>1&&flash[g[1]+g[2]]===undefined)flash[g[1]+g[2]]=s.t;}}
  return {peak,flash,ms:Date.now()-t0};};
 const a=run('blocks'),b=run('fast');let d=0,dk='';for(const k of Object.keys(a.peak)){const x=Math.abs(a.peak[k]-b.peak[k])/Math.max(a.peak[k],1);if(x>d){d=x;dk=k;}}
 return {ov,d,dk,flash:a.flash,flashFast:b.flash,ms:a.ms,msFast:b.ms,VG:a.peak['Y:VGa'],VGfast:b.peak['Y:VGa']};}
function expand(id,stop){const pr=build(id);const libs=pr.components.filter(c=>NL.isLib(c.type)).map(c=>c.id);let ex=pr;
 for(const c of libs)ex=SC.fromLib(ex,c).project;ex={...ex,sim:pr.sim,meta:pr.meta,solve:pr.solve};
 const run=(p,keys)=>{const s=new MNA.Sim(p,{hDiv:pr.sim?.hDiv||200,method:pr.sim?.method||'TR'}),ks=keys||s.keys.filter(k=>/^(V|I|Y):/.test(k)).slice(0,300),out=[];
  while(s.t<stop-1e-15){s.run(Math.min(s.h,stop-s.t));out.push(ks.map(k=>s.now(k)));}return {ks,out};};
 const a=run(pr),b=run(ex,a.ks);let d=0,dk='';a.out.forEach((r,i)=>r.forEach((v,j)=>{const x=Math.abs(v-b.out[i][j]);if(!(x<=d)){d=x;dk=a.ks[j];}}));
 const types=[...new Set(pr.components.filter(c=>NL.isLib(c.type)).map(c=>c.type))];
 return {id,types,libs:libs.length,steps:a.out.length,ch:a.ks.length,d,dk,subs:Object.keys(ex.subcircuits||{}).length,allSub:libs.every(c=>ex.components.find(k=>k.id===c).type==='SUB')};}
function draw(){Inside.init({pid:id=>id,eng:(v,u)=>P.eng(v,u||'',3),comp:()=>null,wires:()=>[]});const out={};
 for(const t of NL.TYPES)for(const impl of NL.IMPL_TYPES.includes(t)?['blocks','fast']:['blocks']){const c={id:'X1',type:t,x:0,y:0,rot:0,flip:false,params:{...P.defaults(t),impl}};
  const d=NL.defOf(c),lay=NL.layoutDef(d,NL.sidesOf(c)),pos=new Map();let ov=0;
  for(const k of lay.components){if(k.type==='GND'||k.type==='JUNC')continue;const key=k.x+','+k.y;if(pos.has(key))ov++;pos.set(key,1);}
  const bad=lay.components.filter(k=>!Number.isFinite(k.x)||!Number.isFinite(k.y)).length;let svg=null,err=null;try{svg=Inside.drawEl(c);}catch(e){err=e.message;}
  out[t+(impl==='fast'?':fast':'')]={n:lay.components.length,ov,bad,placed:!!d.placed,svg:svg?svg.svg.length:0,parts:svg?svg.n:0,err};}
 return out;}
function fit(o){const r=NL.saiFitL1({U10:o.U10,d:o.d,n:o.n});const pr=arrProject({I:10e3,T1:8e-6,T2:20e-6},'blocks',{U10:o.U10,d:o.d,n:o.n,L1fit:true});
 const s=new MNA.Sim(pr,{hDiv:600,method:'TR'});let v=0;while(s.t<60e-6){s.run(Math.min(s.h,60e-6-s.t));v=Math.max(v,Math.abs(s.now('Y:SA1/V')));}return {k:r.k,err:r.err,v};}
// a tower struck at its top (Heidler, negative), the ground wires and the phases into resistances, an arrester on phase a
function towerProject(o,impl){const C=(id,type,params={})=>({id,type,x:0,y:0,rot:0,flip:false,label:id,params});
 const comps=[C('I1','ILG',{shape:'custom',model:'heidler',T1:3e-6,T2:100e-6,n:10,Ipk:-(o.I||250e3),t0:0}),C('TW1','TOWER',{foot:o.foot||'ion',ins:o.ins||'ub',impl}),C('G0','GND'),
  C('SA1','SAI',{U10:819e3,d:3.216,n:1,meas:true,impl}),C('GS','GND')],wires=[Wr('w0',['I1','n'],['G0','g']),Wr('w1',['I1','p'],['TW1','d1']),Wr('ws1',['TW1','a2'],['SA1','a']),Wr('ws2',['SA1','b'],['GS','g'])];
 let k=1;const term=(pin,R)=>{const r='R'+k,g='G'+k;k++;comps.push(C(r,'R',{R}),C(g,'GND'));wires.push(Wr('wa'+k,['TW1',pin],[r,'a']),Wr('wb'+k,[r,'b'],[g,'g']));};
 for(const p of ['d2','e1','e2'])term(p,500);for(const p of ['a1','b1','c1','a2','b2','c2'])term(p,400);
 return {version:4,components:comps,wires};}
const TOWER_CH=['Y:TW1/Vtop','Y:TW1/If','Y:TW1/Ia','Y:TW1/Ib','Y:TW1/Ic','Y:SA1/V','Y:SA1/I'];
function tower(o){const pr=towerProject(o,'blocks'),s=new MNA.Sim(pr,{hDiv:o.hDiv||20,method:'TR'}),rec=[],stop=o.stop||8e-6;
 while(s.t<stop-1e-15){s.run(Math.min(s.h,stop-s.t));rec.push([s.t,...TOWER_CH.map(k=>s.now(k))]);}
 return {h:s.h,ch:TOWER_CH,rec,warn:s.net.warnings,batch:MNA.exportForBatch(towerProject(o,'fast'),TOWER_CH)};}
function exportCase(){const pr=towerProject({},'fast'),ex=MNA.exportForBatch(pr,['Y:TW1/Vtop']),els=ex.net.els,local=new MNA.Sim(pr,{hDiv:20});
 let gis=null,ntlm=0;try{const r=MNA.exportForBatch(build('lightning_gis',{impl:'fast'}),['Y:T2/Vtop']);ntlm=r.net.els.filter(e=>e.k==='TLM').length;}catch(e){gis=e.message;}   // 4.12: the lines go too
 return {nNL:els.filter(e=>e.k==='NL').length,compact:local.net.els.filter(e=>e.sai||e.foot).length,nNLlocal:local.net.els.filter(e=>e.k==='NL').length,gis,ntlm};}
const cases=JSON.parse(process.argv[2]||'[]');
console.log(JSON.stringify(cases.map(c=>c.kind==='arr'?arr(c):c.kind==='lightning'?lightning(c.ov||{}):c.kind==='expand'?expand(c.id,c.stop):c.kind==='draw'?draw():c.kind==='fit'?fit(c):c.kind==='export'?exportCase():c.kind==='tower'?tower(c):{err:'kind'})));
