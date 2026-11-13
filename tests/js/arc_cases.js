// The arc of a breaker pole (4.9, ARCX sections through ARC and CB3): a terminal fault on a source–L–(breaker ∥ C)
// circuit for several arc models, with the state at contact separation and the waveforms after it (for an independent
// stiff integration in tests/test_arc.py), a degraded arc that reignites, and a three-phase CB3 with arcs.
// Usage: node arc_cases.js -> JSON
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');for(const f of ['netlib','subcircuit','bus','units','expr','nn'])require(W+'/'+f+'.js');
const MNA=require(W+'/mna.js');require(W+'/tutorials.js');
const C=(id,type,params={})=>({id,type,x:0,y:0,rot:0,flip:false,label:id,params});
const w=(id,a,ap,b,bp)=>({id,a:{c:a,p:ap},b:{c:b,p:bp},pts:[]});
const U=145e3*Math.sqrt(2/3),I=20e3,Lv=U/(2*Math.PI*50*I*Math.SQRT2);
const circuit=(arc,extra,Cv=2e-9,tsep=0.0148,hDiv=200000)=>({version:3,
 components:[C('V1','VAC',{Vpk:U,f:50,phase:0}),C('L1','L',{L:Lv}),C('CB1','ARC',{arc,cmd:'0:1, '+tsep+':0',...extra}),C('C1','C',{C:Cv}),C('G1','GND'),C('G2','GND')],
 wires:[w('w1','V1','p','L1','a'),w('w2','L1','b','CB1','a'),w('w3','CB1','b','G1','g'),w('w4','V1','n','G2','g'),w('w5','L1','b','C1','p'),w('w6','C1','n','G1','g')],
 sim:{f:50,hDiv,method:'TR'},solve:{init:'ac'}});
function run(arc,extra={},o={}){const pr=circuit(arc,extra,o.C,o.tsep,o.hDiv);const s=new MNA.Sim(pr,{hDiv:pr.sim.hDiv,method:'TR'});
 const tsep=o.tsep??0.0148;s.run(tsep+s.h);
 const L=s.net.els.find(e=>e.k==='L'),Cc=s.net.els.find(e=>e.k==='C');
 const out={arc,U,L:Lv,C:pr.components.find(c=>c.id==='C1').params.C,t0:s.t,iL:L.i,vc:Cc.v,warn:s.net.warnings,
  sections:s.arcEls.map(e=>{const A=e.arc;return {x:A.x,lam:A.lam,tau0:A.tau0,alpha:A.alpha,P0:A.P0,P1:A.P1,beta:A.beta,gmin:A.gmin};}),rec:[]};
 const t1=s.t+(o.win??0.4e-3);while(s.t<t1-1e-12){s.run(Math.min(1e-7,t1-s.t));out.rec.push([s.t,s.now('Y:CB1/I'),s.now('Y:CB1/V')]);}
 return out;}
const out={};
out.imayr=run('imayr');
out.kema=run('kema',{},{hDiv:1000000});   // τ₃ = τ₁/k₁/k₂ = 70 ns: a step of 20 ns
out.habedank=run('habedank');
out.mayr=run('mayr',{P0:'30k',tau:'0.3u'});
// a weak arc (cooling power 0,5 kW): it reignites after the first current zero and burns on
out.weak=run('imayr',{P0:'500'},{win:2.5e-3});
// closed: the pole is R_on, the current the one of the circuit without it (phasor start)
{const pr=circuit('imayr',{},2e-9,1,20000);const s=new MNA.Sim(pr,{hDiv:20000,method:'TR'});s.run(0.01);
 out.closed={i:s.now('Y:CB1/I'),ipk:I*Math.SQRT2,t:s.t,w:2*Math.PI*50};}
// three phases: the net_fault tutorial with a CB3 whose poles have arcs (all three interrupt, the channels exist)
{const T=globalThis.Tutorials;const pr=T.get('net_fault').build({});const cb=pr.components.find(c=>c.type==='CB3');
 if(cb){Object.assign(cb.params,{model:'arc',arc:'imayr',vm:true,ctl:'time',cmd:'0:1, 0.1:0'});pr.sim={...pr.sim,hDiv:20000,method:'TR'};
  const s=new MNA.Sim(pr,{hDiv:20000,method:'TR'});const keys=s.keys.filter(k=>k.startsWith('Garc:'+cb.id+'/'));
  let tEnd=0.2;try{s.run(tEnd);}catch(e){out.three={err:String(e)};}
  if(!out.three)out.three={id:cb.id,keys,cmd:cb.params.cmd,i:['a','b','c'].map(x=>s.now('Y:'+cb.id+'/I'+x)),g:keys.map(k=>s.now(k)),warn:s.net.warnings};}
 else out.three={err:'no CB3 in net_fault'};}
console.log(JSON.stringify(out));
