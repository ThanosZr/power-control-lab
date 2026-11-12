// The cable tutorial (4.5) as the studio builds it: per option, the arrival of the front at the open end of phase a
// (5 % of its peak), the peaks at a2 and b2, the step and the warnings. Usage: node cable_tutorial.js -> JSON
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');global.LineModels=require(W+'/linemodels.js');const MNA=require(W+'/mna.js');require(W+'/tutorials.js');
const T=globalThis.Tutorials.get('cable_fd'),out={};
for(const src of ['step','ac3']){const pr=T.build({cmp:'cp50',src});const s=new MNA.Sim(pr,{hDiv:pr.sim.hDiv,method:'TR'});const dur=src==='step'?1e-3:4e-3;
 const r={};for(const id of ['L1','L2'])r[id]={t:[],a:[],b:[]};
 while(s.t<dur-1e-12){s.run(Math.min(2e-6,dur-s.t));for(const id of ['L1','L2']){r[id].t.push(s.t);r[id].a.push(s.now('V4:'+id));r[id].b.push(s.now('V5:'+id));}}
 for(const id of ['L1','L2']){const q=r[id],pk=Math.max(...q.a.map(Math.abs));out[src+'_'+id]={arrival:q.t[q.a.findIndex(v=>Math.abs(v)>0.05*pk)],peak:pk,peakB:Math.max(...q.b.map(Math.abs)),h:s.h,warn:s.net.warnings};}}
console.log(JSON.stringify(out));
