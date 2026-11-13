// Saved state and continuation (3.16, ROADMAP §41.1): for every tutorial, a run is stopped after k1 base periods, its
// state goes through JSON (Sim.snapshot), a new solver continues from it (MNA.resume) to k2, and every recorded value
// is compared with the run that did not stop. Also the variable step and a circuit with a Python block (Pyodide).
// Usage: node snapshot_cases.js -> JSON {id: {points, maxdiff, kb}}
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');global.Expr=require(W+'/expr.js');global.StepCheck=require(W+'/stepcheck.js');
global.MNA=require(W+'/mna.js');require(W+'/tutorials.js');global.PyRT=require(W+'/pyrt.js');
const T=globalThis.Tutorials;
function build(id){const t=T.get(id);const o={};for(const op of t.options)o[op.k]=op.def;return t.build(o);}
function hook(s,out){const rec=s.recordNow.bind(s);s.recordNow=function(){rec();out.push([s.t,...s.vals]);};}
function one(pr,k1,k2){const opts={hDiv:(pr.sim&&pr.sim.hDiv)||200,method:(pr.sim&&pr.sim.method)||'TR'};
 const A=new MNA.Sim(pr,opts),ra=[];A.run(k1*A.T-A.t);const snap=JSON.stringify(A.snapshot());hook(A,ra);A.run(k2*A.T-A.t);
 const B=MNA.resume(pr,JSON.parse(snap)),rb=[];hook(B,rb);B.run(k2*B.T-B.t);
 let d=ra.length===rb.length?0:Infinity;for(let i=0;i<Math.min(ra.length,rb.length);i++)for(let j=0;j<ra[i].length;j++){const a=ra[i][j],b=rb[i][j];if(!(a===b||(a!==a&&b!==b)))d=Math.max(d,Math.abs(a-b)||Infinity);}
 return {points:ra.length,maxdiff:d===Infinity?'inf':d,kb:Math.round(snap.length/1024)};}
(async()=>{await PyRT.load();const out={};
 // 4.9: the TRV tutorials run at steps of 0,05–0,5 μs: a short window around their switching (fractions of the base period)
 const SHORT={trv_terminal:[3.04,3.07],trv_slf:[0.737,0.752]};
 for(const t of T.list){if(t.id==='empty')continue;const k=SHORT[t.id]||[4,9];out[t.id]=one(build(t.id),k[0],k[1]);}
 for(const id of ['buck','dc_drive','im_foc','twave','code_loop']){const pr=build(id);pr.solve={...(pr.solve||{}),step:'var'};out[id+':var']=one(pr,4,9);}
 process.stdout.write(JSON.stringify(out));})().catch(e=>{console.error(e);process.exit(1);});
