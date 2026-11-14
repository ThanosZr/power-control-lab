// 4.12: a line from geometry that starts from the sinusoidal steady state (solve.init 'ac'). Three AC sources behind Rs at
// the sending end, R loads at the receiving end. Usage: node tlm_ss_cases.js case.json -> {t, v: [[a2], [b2], [c2], [a1]], steps, warn}
// case = {data, model, kind 'cp'|'fd'|'pi', params, f (CP), f0, Vpk, Rs, RL, h, tend, init 'ac'|'zero', every}
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.Parts=require(W+'/parts.js');const MNA=require(W+'/mna.js');const P=global.Parts;
const q=JSON.parse(require('fs').readFileSync(process.argv[2],'utf8'));
function project(comps,conns){let n=0;return {components:comps.map(c=>({x:0,y:0,rot:0,...c})),wires:conns.map(([a,b])=>{const [ac,ap]=a.split(':'),[bc,bp]=b.split(':');return {id:'w'+(n++),a:{c:ac,p:ap},b:{c:bc,p:bp},pts:[]};}),
 solve:q.init==='ac'?{init:'ac'}:{}};}
const pl={model:q.kind,len:q.data.length,data:JSON.stringify(q.data),...(q.params||{})};if(q.kind!=='fd')pl.f=q.f||50;
if(q.model)pl.mdl=JSON.stringify({...q.model,src:P.tlmKey({...P.defaults('TLM'),...pl})});
const comps=[{id:'L1',type:'TLM',params:pl},{id:'G',type:'GND'}],conns=[];
['a','b','c'].forEach((ph,k)=>{comps.push({id:'V'+ph,type:'VAC',params:{Vpk:q.Vpk,f:q.f0,phase:-120*k,Rs:q.Rs}});conns.push(['V'+ph+':p','L1:'+ph+'1'],['V'+ph+':n','G:g']);
 comps.push({id:'R'+ph,type:'R',params:{R:q.RL}});conns.push(['L1:'+ph+'2','R'+ph+':a'],['R'+ph+':b','G:g']);});
const s=new MNA.Sim(project(comps,conns),{h:q.h});const T=[],V=[[],[],[],[]],every=q.every||1;
while(s.t<q.tend-1e-12){s.run(Math.min(s.h*every,q.tend-s.t));T.push(s.t);['a','b','c'].forEach((ph,k)=>V[k].push(s.now('V:R'+ph)));V[3].push(s.now('V:L1'));}
console.log(JSON.stringify({t:T,v:V,steps:s.steps,h:s.h,warn:s.net.warnings,ac:!!s.acPh}));
