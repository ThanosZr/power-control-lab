// Line from geometry (4.4): runs the part 'TLM' of web/studio/mna.js for a case that tests/test_lines.py writes, and prints
// the voltages at the line ends. Usage: node line_cases.js case.json  -> {t, v: [[...] per node], steps}
// case = {data, model (the model of pcl/lineconst.py), kind 'cp'|'fd', f, h, tend, src: {Vpk, tr, Rs}, R: termination}
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.Parts=require(W+'/parts.js');const MNA=require(W+'/mna.js');const P=global.Parts;
const q=JSON.parse(require('fs').readFileSync(process.argv[2],'utf8'));
function project(comps,conns){let n=0;return {components:comps.map(c=>({x:0,y:0,rot:0,...c})),wires:conns.map(([a,b])=>{const [ac,ap]=a.split(':'),[bc,bp]=b.split(':');return {id:'w'+(n++),a:{c:ac,p:ap},b:{c:bc,p:bp},pts:[]};})};}
const pl={model:q.kind,len:q.data.length,data:JSON.stringify(q.data),...(q.params||{})};if(q.kind!=='fd')pl.f=q.f;   // 4.11: params (cp, npi)
pl.mdl=JSON.stringify({...q.model,src:P.tlmKey({...P.defaults('TLM'),...pl})});
const comps=[{id:'V1',type:'VIMP',params:{shape:'ramp',Vpk:q.src.Vpk,S:q.src.Vpk/q.src.tr,Rs:q.src.Rs}},{id:'L1',type:'TLM',params:pl},{id:'G',type:'GND'}];
const conns=[['V1:p','L1:a1'],['V1:n','G:g']],R=['Rb','Rc','Ra2','Rb2','Rc2'];
['b1','c1','a2','b2','c2'].forEach((p,i)=>{comps.push({id:R[i],type:'R',params:{R:i<2?q.src.Rs:q.R}});conns.push(['L1:'+p,R[i]+':a'],[R[i]+':b','G:g']);});
const s=new MNA.Sim(project(comps,conns),{h:q.h});const T=[],V=[[],[],[],[],[],[]];
while(s.t<q.tend-1e-12){s.run(Math.min(q.h*5,q.tend-s.t));T.push(s.t);V[0].push(s.now('V:L1'));R.forEach((r,i)=>V[i+1].push(s.now('V:'+r)));}
console.log(JSON.stringify({t:T,v:V,steps:s.steps,warn:s.net.warnings}));
