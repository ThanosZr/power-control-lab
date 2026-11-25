// 5.0.17 (ROADMAP §101 step 2, THEORY §8ΩΡ): the tutorial hvdc_mmc in EMT for the RMS of the same drawing (pcl.model.dynamic):
// the voltages between the DC terminals of the two stations (kV, a voltmeter across p and n of each MMC, added here; it draws
// no current) and their DC currents (A, out of the terminal p), every 1 ms from t = 0 to t_end. 5.1.1: and the blocking of
// each station by the protection of its MMCC (B: the output blk, 1 blocked).
// Usage: node hvdc_rms_cases.js [ev,...] [t_end] -> JSON
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');global.Expr=require(W+'/expr.js');global.StepCheck=require(W+'/stepcheck.js');
global.LineModels=require(W+'/linemodels.js');
for(const f of ['netlib','subcircuit','bus','units','nn'])require(W+'/'+f+'.js');
global.MNA=require(W+'/mna.js');require(W+'/tutorials.js');
const t=Tutorials.get('hvdc_mmc'),evs=(process.argv[2]||'pstep,acf').split(','),tend=+(process.argv[3]||1);
const out={runs:[]};
for(const ev of evs){const o={};for(const op of t.options)o[op.k]=op.def;o.ev=ev;const pr=t.build(o);
 for(const k of [1,2]){pr.components.push({id:'VQ'+k,type:'VM',x:0,y:0,params:{}});pr.wires.push({a:{c:'MMC'+k,p:'p'},b:{c:'VQ'+k,p:'p'}},{a:{c:'MMC'+k,p:'n'},b:{c:'VQ'+k,p:'n'}});}
 const s=new MNA.Sim(pr,{hDiv:pr.sim.hDiv,method:'TR'}),T=[],U={1:[],2:[]},I={1:[],2:[]},Bk={1:[],2:[]};
 while(s.t<tend-1e-9){s.run(1e-3);T.push(s.t);for(const k of [1,2]){U[k].push(s.now('Y:VQ'+k)/1e3);I[k].push(s.now('Y:MMC'+k+'/IDC'));Bk[k].push(s.now('Y:CT'+k+'/BLK'));}}
 out.runs.push({ev,t:T,U,I,B:Bk,warn:s.net.warnings});}
console.log(JSON.stringify(out));
