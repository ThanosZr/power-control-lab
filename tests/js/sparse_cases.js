// Sparse LU of the browser solver (4.2, ROADMAP §32): the same circuits with the dense and the sparse LU, and the
// time per step and per factorization (RLC ladder and a three-phase network of π sections, with and without
// switches). Usage: node sparse_cases.js [quick] -> JSON
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');require(W+'/units.js');require(W+'/bus.js');require(W+'/netlib.js');require(W+'/subcircuit.js');
const SP=require(W+'/sparse.js');const MNA=require(W+'/mna.js');
const quick=process.argv[2]==='quick';
function project(comps,conns,step){let n=0;return {version:3,components:comps.map(c=>({x:0,y:0,rot:0,...c})),
 wires:conns.map(([a,b])=>{const [ac,ap]=a.split(':'),[bc,bp]=b.split(':');return {id:'w'+(n++),a:{c:ac,p:ap},b:{c:bc,p:bp},pts:[]};}),solve:{step}};}
// RLC ladder: source → N × (R, L in series, C to ground); with switches every 10th section a switch in series
// (one command toggling it), so the factorization changes at the switchings
function ladder(N,sw){const c=[{id:'V1',type:'VAC',params:{Vpk:100,f:50}},{id:'G',type:'GND',params:{}}],w=[['V1:n','G:g']];let prev='V1:p';
 if(sw)c.push({id:'K',type:'CONST',params:{v:'0:1, 0.004:0, 0.008:1, 0.012:0, 0.016:1'}});
 for(let k=1;k<=N;k++){c.push({id:'R'+k,type:'R',params:{R:0.1}},{id:'L'+k,type:'L',params:{L:1e-4}},{id:'C'+k,type:'C',params:{C:1e-6}});
  w.push([prev,'R'+k+':a'],['R'+k+':b','L'+k+':a'],['C'+k+':n','G:g']);let end='L'+k+':b';
  if(sw&&k%10===0){c.push({id:'S'+k,type:'SW',params:{gate:'sig',body:false,Ron:1e-3,Roff:1e6}});w.push([end,'S'+k+':d'],['K:y','S'+k+':g']);end='S'+k+':s';}
  w.push([end,'C'+k+':p']);prev='C'+k+':p';}
 c.push({id:'RL',type:'R',params:{R:10}});w.push([prev,'RL:a'],['RL:b','G:g']);
 return project(c,w,2e-6);}
// three-phase: a grid equivalent, then a chain of N buses with π sections (R, L per phase, C to ground) and loads
function three(N,sw){const c=[{id:'G1',type:'GRID3',params:{Un:20e3,Sk:500e6,XR:10}},{id:'G',type:'GND',params:{}}],w=[];let prev=['G1:a','G1:b','G1:c'];
 if(sw)c.push({id:'K',type:'CONST',params:{v:'0:1, 0.005:0, 0.01:1'}});
 for(let k=1;k<=N;k++){const nxt=[];for(const x of 'abc'){const R='R'+x+k,L='L'+x+k,C='C'+x+k;c.push({id:R,type:'R',params:{R:0.05}},{id:L,type:'L',params:{L:3e-4}},{id:C,type:'C',params:{C:2e-8}});
   w.push([prev['abc'.indexOf(x)],R+':a'],[R+':b',L+':a'],[C+':n','G:g']);let end=L+':b';
   if(sw&&k%10===0){const S='S'+x+k;c.push({id:S,type:'SW',params:{gate:'sig',body:false,Ron:1e-3,Roff:1e6}});w.push([end,S+':d'],['K:y',S+':g']);end=S+':s';}
   w.push([end,C+':p']);nxt.push(C+':p');
   if(k%5===0){const Z='Z'+x+k;c.push({id:Z,type:'R',params:{R:400}});w.push([C+':p',Z+':a'],[Z+':b','G:g']);}}
  prev=nxt;}
 return project(c,w,2e-6);}
function run(pr,solver,steps){const s=new MNA.Sim(JSON.parse(JSON.stringify(pr)),{h:2e-6,solver});const t0=process.hrtime.bigint();s.run(2e-6*steps);const ms=Number(process.hrtime.bigint()-t0)/1e6;
 // one factorization alone (no cache): the median of 7 after one for the JIT, so a busy machine does not decide
 let F=s.factor(2e-6,'TR');const ts=[];for(let k=0;k<7;k++){const t1=process.hrtime.bigint();F=s.factor(2e-6,'TR');ts.push(Number(process.hrtime.bigint()-t1)/1e6);}
 ts.sort((a,b)=>a-b);const fms=ts[3];
 return {n:s.n,sparse:s.sparse,msStep:ms/steps,msFactor:fms,nnzLU:F.sp?F.sp.nnz:s.n*s.n,stats:s.lustat,x:Array.from(s.x)};}
const out={same:{},bench:[]};
// same numbers: every node voltage and branch current after the run, relative to the largest
for(const [name,pr] of [['ladder200_sw',ladder(200,true)],['three60_sw',three(60,true)],['ladder50',ladder(50,false)]]){
 const a=run(pr,'dense',6000),b=run(pr,'sparse',6000);let m=0,sc=0;for(let i=0;i<a.x.length;i++){m=Math.max(m,Math.abs(a.x[i]-b.x[i]));sc=Math.max(sc,Math.abs(a.x[i]));}
 out.same[name]={n:a.n,rel:m/sc,factD:a.stats.fact,factS:b.stats.fact,autoSparse:new MNA.Sim(JSON.parse(JSON.stringify(pr)),{h:2e-6}).sparse};}
// time per step and per factorization (dense only up to 1000 unknowns: n² memory, n³ time)
const sizes=quick?[10,50,200,1000]:[10,50,200,1000,5000];
for(const kind of ['ladder','three'])for(const sw of (quick?[true]:[false,true]))for(const N of sizes){
 const NN=kind==='three'?Math.max(1,Math.round(N/6)):Math.max(1,Math.round(N/2));const pr=kind==='three'?three(NN,sw):ladder(NN,sw);
 const steps=N>=1000?400:2000;const S=run(pr,'sparse',steps);const row={kind,sw,n:S.n,steps,sparse:{msStep:S.msStep,msFactor:S.msFactor,nnzLU:S.nnzLU,fact:S.stats.fact}};
 if(S.n<=1100){const D=run(pr,'dense',Math.min(steps,S.n>500?200:steps));row.dense={msStep:D.msStep,msFactor:D.msFactor};}
 out.bench.push(row);}
console.log(JSON.stringify(out));
