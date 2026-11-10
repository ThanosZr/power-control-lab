// Subcircuits (3.17, ROADMAP §9): the same results as the drawn circuit, instances without shared state, nesting,
// recursion, a missing definition, parameters by path, local tags, SciPy requests of the flat circuit.
// Usage: node subcircuit_cases.js -> JSON
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');const SUB=require(W+'/subcircuit.js');const MNA=require(W+'/mna.js');require(W+'/tutorials.js');
const T=globalThis.Tutorials;
const build=(id,opts={})=>{const t=T.get(id);const o={};for(const op of t.options)o[op.k]=opts[op.k]??op.def;return t.build(o);};
const clone=o=>JSON.parse(JSON.stringify(o));
function project(comps,conns,extra={}){let n=0;return {components:comps.map(c=>({x:0,y:0,rot:0,...c})),wires:conns.map(([a,b])=>{const [ac,ap]=a.split(':'),[bc,bp]=b.split(':');return {id:'w'+(n++),a:{c:ac,p:ap},b:{c:bc,p:bp},pts:[]};}),...extra};}
// a run: the last value and the mean of the last period of each channel, and the steps
function run(pr,keys,dur,o={}){const s=new MNA.Sim(clone(pr),{hDiv:o.hDiv||pr.sim?.hDiv||200,method:o.method||'TR'});s.run(dur);
 const out={steps:s.steps,warnings:s.net.warnings};for(const k of keys){if(!s.chIndex.has(k))throw new Error('no channel '+k);out[k]={now:s.now(k),avg:s.lastPeriod(k)?.avg};}return out;}
const err=f=>{try{f();return null;}catch(e){return e.message;}};
const R={};
// 1. the buck with a voltage loop: three different selections, as a subcircuit and expanded again
{const pr=build('buck_vloop'),keys=['V:C1','I:L1','D:PWM1'],dur=6e-3;R.buck={open:run(pr,keys,dur),sub:[],exp:[]};
 for(const sel of [['S1','D1','L1','J1'],['L1','C1','R1','J2','J3','J4','J5'],['S1','J1','D1','L1','J2','C1','R1','J3','J4','J5','PWM1']]){
  const r=SUB.create(pr,sel),m=k=>{const [a,id]=k.split(':');return r.moved.has(id)?a+':'+r.moved.get(id):k;};
  const a=run(r.project,keys.map(m),dur);R.buck.sub.push({ports:r.project.components.find(c=>c.id===r.id).params.$ports.length,steps:a.steps,warnings:a.warnings,v:keys.map(k=>a[m(k)].now)});
  const e=SUB.expand(r.project,r.id),b2=k=>{const [a2,id]=k.split(':');return e.ids.has(id)?a2+':'+e.ids.get(id):k;};
  const b=run(e.project,keys.map(b2),dur);R.buck.exp.push({sub:e.project.components.filter(c=>c.type==='SUB').length,steps:b.steps,v:keys.map(k=>b[b2(k)].now)});}
 R.buck.openV=keys.map(k=>R.buck.open[k].now);
 // saved and opened again (JSON), the PI's sensor now a path into the instance
 const r=SUB.create(pr,['L1','C1','R1','J2','J3','J4','J5']);R.buck.sensor=r.project.components.find(c=>c.id==='PWM1').params.sensor;
 R.buck.json=run(JSON.parse(JSON.stringify(r.project)),['V:X1/C1'],dur)['V:X1/C1'].now;}
// 2. PWM from blocks (carrier + comparator) → a subcircuit, the waveform unchanged (§9 test 1)
{const pr=build('blocks_loop',{mod:'cmp',delay:'z1'}),keys=['I:L1','Y:UD1','Y:CMP1','Y:RMP1'],dur=3e-3;const o=run(pr,keys,dur);
 const r=SUB.create(pr,['RMP1','CMP1']),m=k=>{const [a,id]=k.split(':');return r.moved.has(id)?a+':'+r.moved.get(id):k;},s=run(r.project,keys.map(m),dur);
 R.pwmBlocks={open:keys.map(k=>o[k].now),sub:keys.map(k=>s[m(k)].now),steps:[o.steps,s.steps],ports:r.project.components.find(c=>c.id===r.id).params.$ports.map(p=>p.kind)};}
// 3. two instances of one modulator with different f_s and slope (public parameters): no shared state (§9 test 2)
{const mod={title:'Διαμορφωτής',version:'1',params:[{k:'fs',label:'f_s',unit:'Hz',type:'num',def:20e3,bind:[['RMP','f']]},{k:'hi',label:'κορυφή',type:'num',def:1,bind:[['RMP','hi']]}],
  components:[{id:'RMP',type:'RAMP',x:0,y:0,params:{f:20e3,shape:'saw',lo:0,hi:1}},{id:'CMP',type:'CMP',x:60,y:0,params:{}},{id:'D',type:'SIN',x:-60,y:-10,params:{name:'d'}},{id:'G',type:'SOUT',x:120,y:0,params:{name:'g'}}],
  wires:[{id:'w1',a:{c:'D',p:'y'},b:{c:'CMP',p:'p'}},{id:'w2',a:{c:'RMP',p:'y'},b:{c:'CMP',p:'n'}},{id:'w3',a:{c:'CMP',p:'y'},b:{c:'G',p:'u'}}]};
 const sub=project([{id:'K',type:'CONST',params:{v:.4}},{id:'XA',type:'SUB',params:{def:'mod',fs:20e3,hi:1}},{id:'XB',type:'SUB',params:{def:'mod',fs:35e3,hi:2}},{id:'DA',type:'DISP'},{id:'DB',type:'DISP'}],
  [['K:y','XA:d'],['K:y','XB:d'],['XA:g','DA:u'],['XB:g','DB:u']],{subcircuits:{mod}});
 const open=project([{id:'K',type:'CONST',params:{v:.4}},{id:'RA',type:'RAMP',params:{f:20e3,shape:'saw',lo:0,hi:1}},{id:'CA',type:'CMP'},{id:'RB',type:'RAMP',params:{f:35e3,shape:'saw',lo:0,hi:2}},{id:'CB',type:'CMP'},{id:'DA',type:'DISP'},{id:'DB',type:'DISP'}],
  [['K:y','CA:p'],['RA:y','CA:n'],['K:y','CB:p'],['RB:y','CB:n'],['CA:y','DA:u'],['CB:y','DB:u']]);
 const sample=(pr,ka,kb)=>{const s=new MNA.Sim(clone(pr),{hDiv:400});const out=[];for(let i=0;i<300;i++){s.run(1e-6);out.push([s.now(ka),s.now(kb)]);}return {out,steps:s.steps};};
 const a=sample(sub,'Y:XA/CMP','Y:XB/CMP'),b=sample(open,'Y:CA','Y:CB');
 R.twoInst={same:JSON.stringify(a.out)===JSON.stringify(b.out),steps:[a.steps,b.steps],dutyA:a.out.filter(x=>x[0]>.5).length/300,dutyB:a.out.filter(x=>x[1]>.5).length/300,
  differ:a.out.some(x=>x[0]!==x[1])};
 // 4. nested: a definition that uses the modulator, two levels; parameters by path and values of one instance only
 const leg={title:'Σκέλος',version:'1',params:[{k:'fs',label:'f_s',type:'num',def:20e3,bind:[['M','fs']]}],
  components:[{id:'M',type:'SUB',x:0,y:0,params:{def:'mod'}},{id:'D',type:'SIN',x:-60,y:0,params:{name:'d'}},{id:'G',type:'SOUT',x:60,y:0,params:{name:'g'}}],
  wires:[{id:'w1',a:{c:'D',p:'y'},b:{c:'M',p:'d'}},{id:'w2',a:{c:'M',p:'g'},b:{c:'G',p:'u'}}]};
 const nest=project([{id:'K',type:'CONST',params:{v:.4}},{id:'L1',type:'SUB',params:{def:'leg',fs:35e3,'M.hi':2}},{id:'DB',type:'DISP'},{id:'DA',type:'DISP'},{id:'KA',type:'CONST',params:{v:.4}},
   {id:'XA',type:'SUB',params:{def:'mod'}}],[['K:y','L1:d'],['L1:g','DB:u'],['KA:y','XA:d'],['XA:g','DA:u']],{subcircuits:{mod,leg}});
 const c=sample(nest,'Y:XA/CMP','Y:L1/M/CMP');R.nested={same:JSON.stringify(c.out)===JSON.stringify(b.out),flatIds:SUB.flatten(nest).project.components.map(k=>k.id).filter(id=>id.startsWith('L1/')).sort()};
 // the same by path: L1/M.hi = 2 and L1.fs = 35 kHz, set as pcl does
 const viaPath=clone(nest);delete viaPath.components.find(k=>k.id==='L1').params['M.hi'];viaPath.components.find(k=>k.id==='L1').params.fs=20e3;
 MNA.setPath(viaPath,'L1/M','hi',2);MNA.setPath(viaPath,'L1','fs',35e3);R.nested.path=JSON.stringify(sample(viaPath,'Y:XA/CMP','Y:L1/M/CMP').out)===JSON.stringify(b.out);
 R.nested.paramOf=[SUB.paramOf(viaPath,'L1/M/RMP','hi'),SUB.paramOf(viaPath,'L1/M/RMP','f'),SUB.paramOf(viaPath,'XA/RMP','f')];
 R.nested.badPath=err(()=>MNA.setPath(clone(nest),'L1/Q','x',1));
 // 5. recursion: a definition that contains itself through another
 const rec=clone(nest);rec.subcircuits.mod.components.push({id:'Z',type:'SUB',params:{def:'leg'}});R.recursion=err(()=>new MNA.Sim(rec,{}));R.cycle=SUB.cycleOf(rec);
 // 6. a missing definition: the project opens, the instance is left out with a message
 const miss=clone(sub);delete miss.subcircuits.mod;miss.components.push({id:'R1',type:'R',params:{R:1}},{id:'V1',type:'VDC',params:{V:1}},{id:'G1',type:'GND'});
 miss.wires.push({id:'x1',a:{c:'V1',p:'p'},b:{c:'R1',p:'a'}},{id:'x2',a:{c:'R1',p:'b'},b:{c:'G1',p:'g'}},{id:'x3',a:{c:'V1',p:'n'},b:{c:'G1',p:'g'}});
 const sm=new MNA.Sim(miss,{});sm.run(1e-4);R.missing={warnings:sm.net.warnings,i:sm.now('I:R1')};
 // 7. a renamed port: the wires of the instances follow it (sync)
 const ren=clone(sub);SUB.sync(ren);ren.subcircuits.mod.components.find(k=>k.id==='G').params.name='gate';const changed=SUB.sync(ren);
 R.rename={changed,wires:ren.wires.filter(w=>w.a.c==='XA'||w.b.c==='XA').map(w=>w.a.c==='XA'?w.a.p:w.b.p).sort(),same:JSON.stringify(sample(ren,'Y:XA/CMP','Y:XB/CMP').out)===JSON.stringify(a.out)};
 // 8. a signal source named without a wire: in_ of a block to an instance output, and in_ of an instance input
 const wl=clone(sub);wl.wires=wl.wires.filter(w=>!(w.a.c==='XA'&&w.a.p==='g')&&!(w.b.c==='XA'&&w.b.p==='g')&&!(w.b.c==='XB'&&w.b.p==='d'));
 wl.components.find(k=>k.id==='DA').params={in_u:'XA:g'};wl.components.find(k=>k.id==='XB').params.in_d='K:y';
 R.wireless=JSON.stringify(sample(wl,'Y:DA','Y:XB/CMP').out)===JSON.stringify(b.out.map(x=>[x[0],x[1]]));
 // 9. Goto / From are local to the instance; "/name" reaches the top level
 const tg={title:'tags',params:[],components:[{id:'D',type:'SIN',params:{name:'u'}},{id:'TO',type:'TAGO',params:{name:'s'}},{id:'FR',type:'TAGI',params:{name:'s'}},{id:'G',type:'SOUT',params:{name:'y'}},{id:'TG',type:'TAGI',params:{name:'/top'}},{id:'G2',type:'SOUT',params:{name:'y2'}}],
  wires:[{id:'w1',a:{c:'D',p:'y'},b:{c:'TO',p:'u'}},{id:'w2',a:{c:'FR',p:'y'},b:{c:'G',p:'u'}},{id:'w3',a:{c:'TG',p:'y'},b:{c:'G2',p:'u'}}]};
 const tp=project([{id:'K1',type:'CONST',params:{v:1}},{id:'K2',type:'CONST',params:{v:2}},{id:'K3',type:'CONST',params:{v:7}},{id:'TT',type:'TAGO',params:{name:'top'}},{id:'X1',type:'SUB',params:{def:'tg'}},{id:'X2',type:'SUB',params:{def:'tg'}},
  {id:'D1',type:'DISP'},{id:'D2',type:'DISP'},{id:'D3',type:'DISP'},{id:'TS',type:'TAGO',params:{name:'s'}},{id:'K4',type:'CONST',params:{v:9}}],
  [['K1:y','X1:u'],['K2:y','X2:u'],['X1:y','D1:u'],['X2:y','D2:u'],['K3:y','TT:u'],['X1:y2','D3:u'],['K4:y','TS:u']],{subcircuits:{tg}});
 const st=new MNA.Sim(tp,{});st.run(1e-5);R.tags={y1:st.now('Y:D1'),y2:st.now('Y:D2'),top:st.now('Y:D3'),warnings:st.net.warnings};
 // 10. the SciPy solver gets the flat circuit: requests of the subcircuit and of the drawn circuit
 R.batch={sub:MNA.exportForBatch(sub,['Y:XA/CMP','Y:XB/CMP']),open:MNA.exportForBatch(open,['Y:CA','Y:CB'])};}
// a buck for the SciPy comparison: the power stage as an instance
{const pr=build('buck',{});const r=SUB.create(pr,['S1','D1','L1']);const keys=['V:C1','I:X1/L1'];
 R.batchBuck={req:MNA.exportForBatch(r.project,keys),open:MNA.exportForBatch(pr,['V:C1','I:L1']),browser:run(r.project,keys,2e-3)};}
// 3.19: «/name» on a wire inside a definition is the top level's name; references outwards listed, a signal source → a port
{const def={title:'load',components:[{id:'P1',type:'PORT',x:0,y:0,rot:0,params:{name:'g'}},{id:'R1',type:'R',x:0,y:0,rot:0,params:{R:4}},{id:'GN',type:'GAIN',x:0,y:0,rot:0,params:{K:2,in_u:'K1:y'}},{id:'DS',type:'DISP',x:0,y:0,rot:0,params:{}}],
   wires:[{id:'a',a:{c:'R1',p:'a'},b:{c:'R1',p:'a'},name:'/vbus',pts:[]},{id:'b',a:{c:'R1',p:'b'},b:{c:'P1',p:'p'},pts:[]},{id:'c',a:{c:'GN',p:'y'},b:{c:'DS',p:'u'},pts:[]}]};
 const pr={version:3,subcircuits:{load:def},components:[{id:'V1',type:'VDC',x:0,y:0,rot:0,params:{V:12}},{id:'G',type:'GND',x:0,y:0,rot:0,params:{}},{id:'K1',type:'CONST',x:0,y:0,rot:0,params:{v:3}},
   {id:'X1',type:'SUB',x:0,y:0,rot:0,params:{def:'load'}}],wires:[{id:'t1',a:{c:'V1',p:'p'},b:{c:'V1',p:'p'},name:'vbus',pts:[]},{id:'t2',a:{c:'V1',p:'n'},b:{c:'G',p:'g'},pts:[]},{id:'t3',a:{c:'X1',p:'g'},b:{c:'G',p:'g'},pts:[]}]};
 SUB.sync(pr);const s=new MNA.Sim(clone(pr),{hDiv:50});s.run(1e-3);const ext=SUB.externalRefs(pr,'load');const r=SUB.refToPort(pr,'load','GN','in_u');const s2=new MNA.Sim(clone(r.project),{hDiv:50});s2.run(1e-3);
 R.slashName={i:s.now('I:X1/R1'),gn:s.now('Y:X1/GN'),ext,port:r.port,inst:r.project.components.find(c=>c.id==='X1').params,gn2:s2.now('Y:X1/GN'),
  ext2:SUB.externalRefs(r.project,'load'),ports:SUB.portsOf(r.project.subcircuits.load).map(p=>[p.name,p.kind])};}
process.stdout.write(JSON.stringify(R));
