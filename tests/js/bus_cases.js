// Buses and vectors (3.18, ROADMAP §3): the same circuit drawn with separate wires and with buses, element-wise blocks on
// a vector, subcircuit ports with a width, Ctrl+G across a bus, named wires that join, the messages for widths that do not
// fit, the widths the editor draws, and the SciPy requests of the expanded circuit.
// Usage: node bus_cases.js -> JSON
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');const SUB=require(W+'/subcircuit.js');const BUS=require(W+'/bus.js');const MNA=require(W+'/mna.js');require(W+'/tutorials.js');
const T=globalThis.Tutorials;
const build=(id,opts={})=>{const t=T.get(id);const o={};for(const op of t.options)o[op.k]=opts[op.k]??op.def;return t.build(o);};
const clone=o=>JSON.parse(JSON.stringify(o));
const C=(id,type,params={},o={})=>({id,type,x:0,y:0,rot:0,flip:false,label:o.label||id,params});
const pin=s=>{const [c,p]=s.split(':');return {c,p:p||'j'};};
const wires=l=>l.map((w,i)=>({id:'w'+(i+1),a:pin(w[0]),b:pin(w[1]),pts:[],...(w[2]||{})}));
const project=(comps,conns,extra={})=>({version:2,components:comps,wires:wires(conns),...extra});
const err=f=>{try{f();return null;}catch(e){return e.message;}};
// samples of some channels every dt, and the steps
function trace(pr,keys,dur,dt,o={}){const s=new MNA.Sim(clone(pr),{hDiv:o.hDiv||pr.sim?.hDiv||500,method:'TR'});const out=keys.map(()=>[]);
 while(s.t<dur-1e-12){s.run(dt);keys.forEach((k,i)=>{if(!s.chIndex.has(k))throw new Error('no channel '+k);out[i].push(s.now(k));});}
 return {v:out,steps:s.steps,warnings:s.net.warnings,vec:s.net.vec};}
const R={};

// 1. a three-phase source, R–L load, ammeters, Clarke and a gain: separate wires against buses (EBUS, bus pins, Mux,
//    Clarke on buses, the gain on the αβ bus becomes two gains)
const RL=[C('AMa','AM'),C('AMb','AM'),C('AMc','AM'),C('Ra','R',{R:5}),C('Rb','R',{R:5}),C('Rc','R',{R:5}),C('La','L',{L:10e-3}),C('Lb','L',{L:10e-3}),C('Lc','L',{L:10e-3}),C('JN','JUNC'),C('G1','GND')];
const RLw=[['AMa:b','Ra:a'],['AMb:b','Rb:a'],['AMc:b','Rc:a'],['Ra:b','La:a'],['Rb:b','Lb:a'],['Rc:b','Lc:a'],['La:b','JN'],['Lb:b','JN'],['Lc:b','JN'],['V1:n','G1:g']];
const sep=project([C('V1','VAC3',{Vpk:100,f:50}),...RL,C('CL','CLARKE'),C('GA','GAIN',{K:2}),C('GB','GAIN',{K:2})],
 [...RLw,['V1:a','AMa:a'],['V1:b','AMb:a'],['V1:c','AMc:a'],['AMa:y','CL:a'],['AMb:y','CL:b'],['AMc:y','CL:c'],['CL:al','GA:u'],['CL:be','GB:u']]);
const bus=project([C('V1','VAC3',{Vpk:100,f:50,conn:'bus'}),C('B1','EBUS'),...RL,C('MX','MUX'),C('CL','CLARKE',{conn:'bus'}),C('GN','GAIN',{K:2})],
 [...RLw,['V1:abc','B1:bus'],['B1:a','AMa:a'],['B1:b','AMb:a'],['B1:c','AMc:a'],['AMa:y','MX:u1'],['AMb:y','MX:u2'],['AMc:y','MX:u3'],['MX:y','CL:abc'],['CL:ab','GN:u']]);
{const k=['I:La','I:Lb','I:Lc','Y:CL','Y:CL:be','V:V1','Vb:V1'];
 const a=trace(sep,[...k,'Y:GA','Y:GB'],.03,1e-4),b=trace(bus,[...k,'Y:GN[1]','Y:GN[2]'],.03,1e-4);
 R.threePhase={same:JSON.stringify(a.v)===JSON.stringify(b.v),steps:[a.steps,b.steps],vec:b.vec,warnings:[...a.warnings,...b.warnings],
  ia:Math.max(...a.v[0].slice(-200).map(Math.abs))};
 R.batch={sep:MNA.exportForBatch(sep,['I:La','Y:GA','Y:GB']),bus:MNA.exportForBatch(bus,['I:La','Y:GN[1]','Y:GN[2]'])};
 // the load as a subcircuit with one three-phase port (EBUS inside), and the same with Ctrl+G across the bus wire
 const rl={title:'RL 3φ',version:'1',params:[],components:[C('P1','PORT',{name:'abc',width:'3'}),C('B2','EBUS'),...RL.filter(c=>c.type!=='AM'&&c.type!=='GND')],
  wires:wires([['P1:p','B2:bus'],['B2:a','Ra:a'],['B2:b','Rb:a'],['B2:c','Rc:a'],['Ra:b','La:a'],['Rb:b','Lb:a'],['Rc:b','Lc:a'],['La:b','JN'],['Lb:b','JN'],['Lc:b','JN']])};
 const viaSub=project([C('V1','VAC3',{Vpk:100,f:50,conn:'bus'}),C('G1','GND'),C('X1','SUB',{def:'rl'})],[['V1:n','G1:g'],['V1:abc','X1:abc']],{subcircuits:{rl}});SUB.sync(viaSub);
 const plain=project([C('V1','VAC3',{Vpk:100,f:50}),C('G1','GND'),...RL.filter(c=>c.type!=='AM'&&c.type!=='GND')],
  [['V1:n','G1:g'],['V1:a','Ra:a'],['V1:b','Rb:a'],['V1:c','Rc:a'],['Ra:b','La:a'],['Rb:b','Lb:a'],['Rc:b','Lc:a'],['La:b','JN'],['Lb:b','JN'],['Lc:b','JN']]);
 const ref=trace(plain,['I:La','I:Lc'],.03,1e-4),s1=trace(viaSub,['I:X1/La','I:X1/Lc'],.03,1e-4);
 // Ctrl+G on the load parts of the bus drawing: the port gets the width of the bus
 const g=SUB.create(bus,['B1','AMa','AMb','AMc','Ra','Rb','Rc','La','Lb','Lc','JN']),def=g.project.subcircuits[g.name];
 const s2=trace(g.project,['I:'+g.id+'/La','I:'+g.id+'/Lc'],.03,1e-4);
 R.sub={ports:viaSub.components[2].params.$ports,same:JSON.stringify(ref.v)===JSON.stringify(s1.v),maxDiff:Math.max(...ref.v[0].map((x,i)=>Math.abs(x-s1.v[0][i]))),
  create:{ports:def.components.filter(c=>SUB.PORT_KIND[c.type]).map(c=>({type:c.type,width:c.params.width||'1'})),maxDiff:Math.max(...ref.v[0].map((x,i)=>Math.abs(x-s2.v[0][i])))}};}

// 2. a vector PI on a dq bus (one sum, gain, integrator, sum) against two scalar loops drawn separately: a first-order plant
//    y' = (u − y)/τ per axis, built from blocks
{const plantSep=ax=>[C('E'+ax,'SUM',{signs:'+-'}),C('KP'+ax,'GAIN',{K:3}),C('KI'+ax,'GAIN',{K:200}),C('I'+ax,'INT'),C('S'+ax,'SUM',{signs:'++'}),
  C('P'+ax,'SUM',{signs:'+-'}),C('PG'+ax,'GAIN',{K:1/2e-3}),C('PY'+ax,'INT')];
 const wSep=(ax,ref)=>[[ref,'E'+ax+':a'],['PY'+ax+':y','E'+ax+':b'],['E'+ax+':y','KP'+ax+':u'],['E'+ax+':y','KI'+ax+':u'],['KI'+ax+':y','I'+ax+':u'],['KP'+ax+':y','S'+ax+':a'],['I'+ax+':y','S'+ax+':b'],
  ['S'+ax+':y','P'+ax+':a'],['PY'+ax+':y','P'+ax+':b'],['P'+ax+':y','PG'+ax+':u'],['PG'+ax+':y','PY'+ax+':u']];
 const two=project([C('RD','CONST',{v:'0:0, 0.002:10'}),C('RQ','CONST',{v:'0:0, 0.004:-5'}),...plantSep('d'),...plantSep('q')],[...wSep('d','RD:y'),...wSep('q','RQ:y')],{sim:{hDiv:500}});
 const vec=project([C('RF','CONST',{v:'0:0, 0.002:10; 0:0, 0.004:-5'}),C('E','SUM',{signs:'+-'}),C('KP','GAIN',{K:3}),C('KI','GAIN',{K:200}),C('I','INT'),C('S','SUM',{signs:'++'}),
  C('P','SUM',{signs:'+-'}),C('PG','GAIN',{K:1/2e-3}),C('PY','INT'),C('DX','DEMUX',{n:2}),C('DD','DISP'),C('DQ','DISP')],
  [['RF:y','E:a'],['PY:y','E:b'],['E:y','KP:u'],['E:y','KI:u'],['KI:y','I:u'],['KP:y','S:a'],['I:y','S:b'],['S:y','P:a'],['PY:y','P:b'],['P:y','PG:u'],['PG:y','PY:u'],['PY:y','DX:u'],['DX:y1','DD:u'],['DX:y2','DQ:u']],{sim:{hDiv:500}});
 // no PWM or source: the base period is 1 ms (tbase)
 const a=trace(two,['Y:PYd','Y:PYq'],.008,1e-5,{hDiv:500}),b=trace(vec,['Y:PY[1]','Y:PY[2]'],.008,1e-5,{hDiv:500});
 R.vecPI={same:JSON.stringify(a.v)===JSON.stringify(b.v),steps:[a.steps,b.steps],vec:b.vec,end:[a.v[0].at(-1),a.v[1].at(-1)],display:trace(vec,['Y:DD','Y:DQ'],.008,1e-3).v.map(x=>x.at(-1))};
 // a live change of a block on a bus reaches every element (Sim.setBlock by the id of the drawing)
 const s=new MNA.Sim(clone(vec),{hDiv:500});s.run(1e-3);R.vecPI.setBlock=s.setBlock('KP',{K:5});R.vecPI.liveK=s.net.sig.blocks.filter(q=>q.id.startsWith('KP[')).map(q=>q.K);}

// 3. Demux, the bus selector, a vector constant, a parameter per element, named wires, Goto/From with a bus
{const p=project([C('K1','CONST',{v:'1; 2; 3'}),C('GN','GAIN',{K:'10; 20; 30'}),C('DX','DEMUX',{n:3}),C('BS','BSEL',{idx:'3, 1'}),C('DS','DEMUX',{n:2}),C('S1','SUM',{signs:'+-'}),
  C('D1','DISP'),C('D2','DISP'),C('TO','TAGO',{name:'v'}),C('TI','TAGI',{name:'v'}),C('M2','MUX',{n:2}),C('D6','DEMUX',{n:4}),C('D3','DISP'),C('D4','DISP'),C('K0','CONST',{v:'7'}),C('G1','GND')],
  [['K1:y','GN:u'],['GN:y','DX:u'],['DX:y3','D1:u'],['GN:y','BS:u'],['BS:y','DS:u'],['DS:y1','S1:a'],['DS:y2','S1:b'],['S1:y','D2:u'],
   ['GN:y','TO:u'],['TI:y','M2:u1'],['K0:y','M2:u2'],['M2:y','D6:u'],['D6:y4','D3:u'],['D6:y2','D4:u']]);
 const s=new MNA.Sim(p,{});s.run(1e-4);
 R.wiring={y:['Y:K1[2]','Y:GN[1]','Y:GN[3]','Y:D1','Y:S1','Y:D3','Y:D4'].map(k=>s.now(k)),vec:s.net.vec,needs:BUS.needs(p),w:BUS.widths(p),warnings:s.net.warnings};
 R.wiring.w={gn:R.wiring.w.wire(p.wires[1]),bs:R.wiring.w.wire(p.wires[4]),m2:R.wiring.w.wire(p.wires[11]),d6:R.wiring.w.wire(p.wires[12]),errors:R.wiring.w.errors};
 // wire names (version 3): two stubs called «top» are one node (electrical); in an older file (no version) the same names
 // are labels and stay apart
 const nl=version=>project([C('V1','VDC',{V:10}),C('G1','GND'),C('R1','R',{R:10}),C('J1','JUNC'),C('J2','JUNC'),C('VM','VM')],
  [['V1:n','G1:g'],['V1:p','J1',{name:'top'}],['J2','R1:a',{name:'top'}],['R1:b','G1:g'],['VM:p','R1:a'],['VM:n','G1:g']],version?{version}:{});
 const r1=new MNA.Sim(nl(3),{});r1.run(1e-4);const r0=new MNA.Sim(nl(0),{solve:{unconn:'ignore'}});r0.run(1e-4);
 // and on a signal: a constant into a display through two stubs called «s»; the same name on an electrical wire stays apart
 const ns=project([C('K','CONST',{v:'4'}),C('J1','JUNC'),C('J2','JUNC'),C('D','DISP'),C('V2','VDC',{V:3}),C('R2','R',{R:1}),C('G2','GND')],
  [['K:y','J1',{name:'s'}],['J2','D:u',{name:'s'}],['V2:p','R2:a',{name:'s'}],['R2:b','G2:g'],['V2:n','G2:g']],{version:3});
 const r2=new MNA.Sim(ns,{});r2.run(1e-4);
 // an older file where «v» labels two different nodes: migrateNames gives the second «v·2», the circuit and the numbers stay
 const old=project([C('V1','VDC',{V:10}),C('R1','R',{R:10}),C('V2','VDC',{V:4}),C('R2','R',{R:2}),C('G1','GND')],
  [['V1:p','R1:a',{name:'v'}],['R1:b','G1:g'],['V1:n','G1:g'],['V2:p','R2:a',{name:'v'}],['R2:b','G1:g'],['V2:n','G1:g']]);
 const mig=BUS.migrateNames(old),ro=new MNA.Sim(old,{}),rm=new MNA.Sim(mig.project,{});ro.run(1e-4);rm.run(1e-4);
 R.named={vm:r1.now('Y:VM'),i:r1.now('I:R1'),apart:r0.now('I:R1'),signal:r2.now('Y:D'),elec:r2.now('I:R2'),warnings:r2.net.warnings,
  migrate:{renamed:mig.renamed,version:mig.project.version,names:mig.project.wires.map(w=>w.name).filter(Boolean),old:[ro.now('I:R1'),ro.now('I:R2')],now:[rm.now('I:R1'),rm.now('I:R2')],
   joined:err(()=>new MNA.Sim({...old,version:3},{}).run(1e-4)),again:BUS.migrateNames(mig.project).renamed.length}};}

// 4. widths that do not fit: messages, never a hidden conversion
{const e=(comps,conns)=>err(()=>new MNA.Sim(project(comps,conns),{}));
 R.errors={
  scalarIn:e([C('K1','CONST',{v:'1; 2; 3'}),C('D1','MOD3')],[['K1:y','D1:vdc']]), // 3.19: the display takes a vector now, the modulator's V_dc does not
  demux:e([C('K1','CONST',{v:'1; 2; 3'}),C('DX','DEMUX',{n:2})],[['K1:y','DX:u']]),
  elementwise:e([C('K1','CONST',{v:'1; 2'}),C('K2','CONST',{v:'1; 2; 3'}),C('S','SUM')],[['K1:y','S:a'],['K2:y','S:b']]),
  select:e([C('K1','CONST',{v:'1; 2'}),C('BS','BSEL',{idx:'1, 3'}),C('D','DEMUX',{n:2})],[['K1:y','BS:u'],['BS:y','D:u']]),
  perElement:e([C('K1','CONST',{v:'1; 2; 3'}),C('G','GAIN',{K:'1; 2'}),C('D','DEMUX',{n:3})],[['K1:y','G:u'],['G:y','D:u']]),
  electrical:e([C('V1','VAC3',{conn:'bus'}),C('R1','R'),C('G1','GND')],[['V1:abc','R1:a'],['R1:b','G1:g'],['V1:n','G1:g']]),
  port:err(()=>new MNA.Sim(project([C('K1','CONST',{v:'1; 2; 3'}),C('X1','SUB',{def:'d'})],[['K1:y','X1:u']],{subcircuits:{d:{title:'d',version:'1',params:[],
   components:[C('u','SIN',{name:'u',width:'2'}),C('DX','DEMUX',{n:2}),C('A','DISP'),C('B','DISP')],wires:wires([['u:y','DX:u'],['DX:y1','A:u'],['DX:y2','B:u']])}}}),{}))};
 // the editor never throws: it gets the messages with the widths
 const w=BUS.widths(project([C('K1','CONST',{v:'1; 2; 3'}),C('D1','MOD3')],[['K1:y','D1:vdc']]));R.errors.editor=w.errors;}

// 5. the tutorial: the widths the editor draws (top level, after sync), equal to the scalar circuit the solver gets, old
//    tutorials untouched (no bus: expand leaves the project as it is), SciPy request
{const pr=build('bus_dq');SUB.sync(pr);const w=BUS.widths(pr),byEnds=(a,b)=>pr.wires.find(x=>x.a.c+':'+x.a.p===a&&x.b.c+':'+x.b.p===b);
 R.tutorial={widths:{inv:w.wire(byEnds('XI:abc','XL:a')),i:w.wire(byEnds('XL:i','CL:abc')),ab:w.wire(byEnds('CL:ab','PK:ab')),dq:w.wire(byEnds('PK:dq','TO1:u')),th:w.wire(byEnds('TH:y','TO2:u')),
   ref:w.wire(byEnds('IR:y','SE:a'))},errors:w.errors,
  untouched:T.list.filter(t=>!['bus_dq','net_fault','empty'].includes(t.id)).map(t=>({id:t.id,needs:BUS.needs(SUB.needs(build(t.id))?SUB.flatten(build(t.id)).project:build(t.id))})).filter(x=>x.needs).map(x=>x.id)};
 const s=new MNA.Sim(clone(pr),{hDiv:pr.sim.hDiv});s.run(.04);R.tutorial.browser={id:s.now('Y:PK'),iq:s.now('Y:PK:q'),steps:s.steps};
 R.tutorial.req=MNA.exportForBatch(pr,['Y:PK','Y:PK:q','I:XL/La']);
 // the expanded circuit has no bus parts, no bus pins, no wide junctions
 const flat=BUS.expand(SUB.flatten(clone(pr)).project).project;
 R.tutorial.flat={wiring:flat.components.filter(c=>BUS.WIRING.has(c.type)).length,busPins:flat.components.filter(c=>Object.keys(BUS.members(c)).length).length,
  copies:flat.components.filter(c=>/\[\d+\]$/.test(c.id)).length,junctions:flat.components.filter(c=>c.id.startsWith('~J')).length};}

// 3.19: the B1 blocks on a vector: two elements with their own parameters (';'), the same numbers as two scalar circuits
{const mk=(v,z,up)=>({components:[C('K','CONST',{v}),C('F','F2',{kind:'lp',f0:500,zeta:z}),C('RL','RLIM',{up,dn:up}),C('E','EDGE',{edge:'both'})],
   wires:wires([['K:y','F:u'],['K:y','RL:u'],['F:y','E:u']]),solve:{tbase:1e-3},version:3});
 const vec=mk('0:0, 0.001:1; 0:0, 0.002:2','0.3; 0.6','500; 2000');const DX=C('DX','DEMUX',{n:2}),DR=C('DR','DEMUX',{n:2}),DE=C('DE','DEMUX',{n:2});
 vec.components.push(DX,DR,DE,C('A1','DISP'),C('A2','DISP'),C('B1','DISP'),C('B2','DISP'),C('N1','DISP'),C('N2','DISP'));
 vec.wires=vec.wires.concat(wires([['F:y','DX:u'],['DX:y1','A1:u'],['DX:y2','A2:u'],['RL:y','DR:u'],['DR:y1','B1:u'],['DR:y2','B2:u'],['E:n','DE:u'],['DE:y1','N1:u'],['DE:y2','N2:u']]).map((w,i)=>({...w,id:'v'+i})));
 const run=(p,keys)=>{const s=new MNA.Sim(p,{h:1e-6});s.run(.006);return keys.map(k=>s.now(k));};
 const v=run(vec,['Y:A1','Y:A2','Y:B1','Y:B2','Y:N1','Y:N2']),a=run(mk('0:0, 0.001:1','0.3','500'),['Y:F','Y:RL','Y:E:n']),b=run(mk('0:0, 0.002:2','0.6','2000'),['Y:F','Y:RL','Y:E:n']);
 R.vecB1={vec:v,sep:[a[0],b[0],a[1],b[1],a[2],b[2]]};}
// 3.19 (question 3 of 3.18): the display takes a vector (one copy per element, the app shows [a; b; c])
{const p={version:3,components:[C('K','CONST',{v:'1; 2; 3'}),C('D','DISP')],wires:wires([['K:y','D:u']])};const s=new MNA.Sim(p,{hDiv:50});s.run(1e-3);
 R.vecDisp={vec:s.net.vec.D,v:[1,2,3].map(k=>s.now('Y:D['+k+']'))};}
process.stdout.write(JSON.stringify(R));
