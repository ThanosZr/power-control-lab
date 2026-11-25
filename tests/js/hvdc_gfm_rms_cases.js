// 5.0.18 (ROADMAP §101 step 2, THEORY §8ΩΤ): the tutorial hvdc_gfm in EMT for the RMS of the same drawing (pcl.model.dynamic):
// every 1 ms from t = 0 to t_end, of the grid-forming station 2 its P (pu of its S, to the AC side), its frequency ω (pu), |v| and
// |i| (pu) and the flag of its current limit, as its GFMC gives them; the voltages between the DC terminals of the two stations (kV,
// a voltmeter across p and n of each MMC, added here; it draws no current); and with a second unit (ac = par) its P (pu of its 500
// MVA) and ω. Usage: node hvdc_gfm_rms_cases.js '<[{options of the tutorial}, …]>' [t_end] -> JSON
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');global.Expr=require(W+'/expr.js');global.StepCheck=require(W+'/stepcheck.js');
global.LineModels=require(W+'/linemodels.js');
for(const f of ['netlib','subcircuit','bus','units','nn'])require(W+'/'+f+'.js');
global.MNA=require(W+'/mna.js');require(W+'/tutorials.js');
const t=Tutorials.get('hvdc_gfm'),cases=JSON.parse(process.argv[2]||'[{}]'),tend=+(process.argv[3]||1.2);
const out={runs:[]};
for(const c of cases){const o={};for(const op of t.options)o[op.k]=op.def;Object.assign(o,c);const pr=t.build(o),par=o.ac==='par';
 for(const k of [1,2]){pr.components.push({id:'VQ'+k,type:'VM',x:0,y:0,params:{}});pr.wires.push({a:{c:'MMC'+k,p:'p'},b:{c:'VQ'+k,p:'p'}},{a:{c:'MMC'+k,p:'n'},b:{c:'VQ'+k,p:'n'}});}
 const s=new MNA.Sim(pr,{hDiv:pr.sim.hDiv,method:'TR'}),K={P:'Y:CT2/G/PP',w:'Y:CT2/G/WW',v:'Y:CT2/G/VG',i:'Y:CT2/G/IG',lim:'Y:CT2/G/LR',...(par?{PB:'Y:CTB/PP',wB:'Y:CTB/WW'}:{})};
 const r={opts:o,t:[],U1:[],U2:[]};for(const k in K)r[k]=[];
 while(s.t<tend-1e-9){s.run(1e-3);r.t.push(s.t);for(const k of [1,2])r['U'+k].push(s.now('Y:VQ'+k)/1e3);for(const k in K)r[k].push(s.now(K[k]));}
 r.warn=s.net.warnings;out.runs.push(r);}
console.log(JSON.stringify(out));
