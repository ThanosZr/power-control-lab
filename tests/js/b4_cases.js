// 4.20.1 (ROADMAP §83, decision 320): the tutorial b4dcs2 (DCS2 of the CIGRE B4 in EMT, MMC stations of Model 4): the means of
// the DC voltages of the five buses and of the DC powers of the stations over 50 ms before the event (0.90–0.95 s) and at the
// end (1.95–2.0 s), the study that its card runs (meta.study), and the messages. Usage: node b4_cases.js [ev:ctl,...] -> JSON
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');global.Expr=require(W+'/expr.js');global.StepCheck=require(W+'/stepcheck.js');
global.LineModels=require(W+'/linemodels.js');
for(const f of ['netlib','subcircuit','bus','units','nn'])require(W+'/'+f+'.js');
global.MNA=require(W+'/mna.js');require(W+'/tutorials.js');
const t=Tutorials.get('b4dcs2'),K=['B2','B3','B5','F1','E1'],PK=['B2','B3','F1','E1','CD'];
const runs=(process.argv[2]||'cd55:vdc,cd55:droop,wind:vdc,load:vdc').split(',').map(x=>x.split(':'));
const out={runs:[]};
for(const [ev,ctl] of runs){const pr=t.build({ev,ctl}),s=new MNA.Sim(pr,{hDiv:pr.sim.hDiv,method:'TR'}),win=[];
 for(const [a,b] of [[0.9,0.95],[1.95,2.0]]){s.run(a-s.t);const U=K.map(()=>0),P=PK.map(()=>0);let n=0;
  while(s.t<b-1e-9){s.run(1e-3);K.forEach((k,i)=>U[i]+=s.now('Y:VM'+k));PK.forEach((k,i)=>P[i]+=s.now('Y:PW'+k));n++;}
  win.push({U:Object.fromEntries(K.map((k,i)=>[k,U[i]/n])),P:Object.fromEntries(PK.map((k,i)=>[k,P[i]/n]))});}
 const par=id=>pr.components.find(c=>c.id===id).params;
 const start={U:Object.fromEntries(K.map(k=>[k,par('C'+(k==='B5'?'BB5':'B'+k)).v0])),I:pr.components.filter(c=>c.type==='L'&&/^L[A-Z]\d[A-Z]\d$/.test(c.id)).map(c=>{const end=q=>{const w=pr.wires.find(w=>(w.a.c===c.id&&w.a.p===q)||(w.b.c===c.id&&w.b.p===q)),o=w.a.c===c.id?w.b:w.a;return o.c.slice(1);};
  return {from:end('a'),to:end('b'),i0:c.params.i0};})};   // the current of a line element from its pin a to its pin b
 out.runs.push({ev,ctl,study:pr.meta.study,b4:pr.meta.b4,warn:s.net.warnings,win,start});}
console.log(JSON.stringify(out));
