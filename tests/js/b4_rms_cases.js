// 5.0.15 (ROADMAP §101 step 2, THEORY §8ΩΟ): the tutorial b4dcs2 in EMT for the RMS of the same DCS2 (pcl.dcgrid.b4_dcs2_network):
// the DC voltages of the five buses (kV) and the DC powers at the terminals of the stations (MW, into the DC grid) every 1 ms,
// from t = 0 to t_end. Usage: node b4_rms_cases.js [ev:ctl,...] [t_end] -> JSON
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');global.Expr=require(W+'/expr.js');global.StepCheck=require(W+'/stepcheck.js');
global.LineModels=require(W+'/linemodels.js');
for(const f of ['netlib','subcircuit','bus','units','nn'])require(W+'/'+f+'.js');
global.MNA=require(W+'/mna.js');require(W+'/tutorials.js');
const t=Tutorials.get('b4dcs2'),K=['B2','B3','B5','F1','E1'],PK=['B2','B3','F1','E1','CD'];
const runs=(process.argv[2]||'cd55:vdc,cd55:droop,wind:vdc,load:vdc').split(',').map(x=>x.split(':')),tend=+(process.argv[3]||2.5);
const out={runs:[]};
for(const [ev,ctl] of runs){const pr=t.build({ev,ctl}),s=new MNA.Sim(pr,{hDiv:pr.sim.hDiv,method:'TR'});
 const T=[],U=K.map(()=>[]),P=PK.map(()=>[]);
 while(s.t<tend-1e-9){s.run(1e-3);T.push(s.t);K.forEach((k,i)=>U[i].push(s.now('Y:VM'+k)/1e3));PK.forEach((k,i)=>P[i].push(s.now('Y:PW'+k)));}
 out.runs.push({ev,ctl,t:T,U:Object.fromEntries(K.map((k,i)=>[k,U[i]])),P:Object.fromEntries(PK.map((k,i)=>[k,P[i]])),warn:s.net.warnings});}
console.log(JSON.stringify(out));
