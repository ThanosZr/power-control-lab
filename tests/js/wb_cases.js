// 4.13: a line or cable of M conductors (part 'TLM', any model, the wideband one included) between a source and
// terminations, for tests/test_wb.py. Usage: node wb_cases.js case.json -> {t, v: [[V of node] for the 2M ends], steps, warn, batch}
// case = {data, model, kind, params, h, tend, every, src: {Vpk, tr, Rs} on conductor 1 of end 1, R: [2M resistances to
// ground, null = none] (ends 1 then ends 2), batch: true for the netlist of the SciPy solver}
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.Parts=require(W+'/parts.js');const MNA=require(W+'/mna.js');const P=global.Parts;
const q=JSON.parse(require('fs').readFileSync(process.argv[2],'utf8'));
function project(comps,conns){let n=0;return {components:comps.map(c=>({x:0,y:0,rot:0,...c})),wires:conns.map(([a,b])=>{const [ac,ap]=a.split(':'),[bc,bp]=b.split(':');return {id:'w'+(n++),a:{c:ac,p:ap},b:{c:bc,p:bp},pts:[]};}),
 solve:q.init==='ac'?{init:'ac'}:{}};}
const pl={model:q.kind,len:q.data.length,data:JSON.stringify(q.data),...(q.params||{})};if(q.kind!=='fd'&&q.kind!=='wb')pl.f=q.f||50;
pl.mdl=JSON.stringify({...q.model,src:P.tlmKey({...P.defaults('TLM'),...pl})});
const M=q.model.M,pins=[];for(let k=0;k<M;k++)pins.push(P.tlmPin(k,1));for(let k=0;k<M;k++)pins.push(P.tlmPin(k,2));
const comps=[{id:'L1',type:'TLM',params:pl},{id:'G',type:'GND'}],conns=[],keys=[];
const sk=0;comps.push({id:'V1',type:'VIMP',params:{shape:'ramp',Vpk:q.src.Vpk,S:q.src.Vpk/q.src.tr,Rs:q.src.Rs}});conns.push(['V1:p','L1:'+pins[sk]],['V1:n','G:g']);
pins.forEach((p,i)=>{const R=q.R[i];if(R==null)return;comps.push({id:'R'+i,type:'R',params:{R}});conns.push(['L1:'+p,'R'+i+':a'],['R'+i+':b','G:g']);});
// the voltage of every end: the termination's voltage, or the source's for the driven conductor
const vkey=i=>i===sk?'V:L1':q.R[i]!=null?'V:R'+i:null;
const s=new MNA.Sim(project(comps,conns),{h:q.h});const T=[],V=pins.map(()=>[]),every=q.every||5;
while(s.t<q.tend-1e-12){s.run(Math.min(q.h*every,q.tend-s.t));T.push(s.t);pins.forEach((p,i)=>{const k=vkey(i);V[i].push(k?s.now(k):NaN);});}
const batch=q.batch?MNA.exportForBatch(project(comps,conns),pins.map((p,i)=>vkey(i)).filter(Boolean)):null;
console.log(JSON.stringify({batch,t:T,v:V,steps:s.steps,warn:s.net.warnings}));
