// 4.19 (ROADMAP §68, THEORY §8ΣΤ): the refactorization of the sparse LU and the solver that uses it, headless.
// Usage: node refac_cases.js -> JSON
//  rand   random sparse matrices: refactor() (every column, and only the columns on the factorization path of what
//         changed) against lu() from scratch: the same factors and solutions bit for bit, or a refusal exactly where
//         lu() chooses other pivots
//  circ   a ladder with switches in its last sections on the sparse solver: from scratch ('off'), every column ('full'),
//         partial: the same solution bit for bit, and how many columns a refactorization computes (the ordering of a
//         chain eliminates from one end: the path of a column is every column after it, so switches near the other
//         end would refactor everything)
//  tut    tutorials (machines, nonlinear elements, switch states): from scratch against the default, bit for bit on the
//         solution and on every channel; against the dense LU (rounding); the counts of the solver
//  info   what the engine proposes for a circuit and why (solverInfo), and the settings solve.solver / solve.refac
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');global.Expr=require(W+'/expr.js');global.StepCheck=require(W+'/stepcheck.js');global.LineModels=require(W+'/linemodels.js');
for(const f of ['netlib','subcircuit','bus','units','nn'])require(W+'/'+f+'.js');require(W+'/tutorials.js');
const SP=require(W+'/sparse.js');global.MNA=require(W+'/mna.js');
const same=(a,b)=>a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
const rel=(a,b)=>{let m=0,sc=0;for(let i=0;i<a.length;i++){m=Math.max(m,Math.abs(a[i]-b[i]));sc=Math.max(sc,Math.abs(a[i]));}return m/(sc||1);};
const R={};
// ---------------------------------------------------------------- random matrices
{let seed=4190;const rnd=()=>{seed=(seed*1103515245+12345)&0x7fffffff;return seed/0x7fffffff;};
 const mk=(n,dens)=>{const keys=[];for(let i=0;i<n;i++){keys.push(i*n+i);for(let j=0;j<n;j++)if(i!==j&&rnd()<dens){keys.push(i*n+j);if(rnd()<0.8)keys.push(j*n+i);}}return SP.pattern(n,keys);};
 const vals=(P,dd,zd)=>{const n=P.n,Ax=new Float64Array(P.nnz);for(let j=0;j<n;j++)for(let p=P.Ap[j];p<P.Ap[j+1];p++){const i=P.Ai[p];Ax[p]=i===j?(zd&&rnd()<zd?0:dd*(1+rnd())):(rnd()-0.5)*2;}return Ax;};
 const o={cases:0,refused:0,bad:[],partial:0,cols:0,all:0};
 for(let trial=0;trial<160;trial++){const n=5+Math.floor(rnd()*60),P=mk(n,0.02+rnd()*0.15),A0=vals(P,trial%3===0?0.3:5,trial%5===0?0.2:0),q=SP.order(P);
  let F;try{F=SP.lu(P,A0,q,0.1);}catch(e){continue;}
  for(let v=0;v<6;v++){const A1=A0.slice(),mode=v%3;
   if(mode===0)for(let p=0;p<A1.length;p++)A1[p]*=1+0.01*(rnd()-0.5);                                   // every value a little
   else if(mode===1){for(let c=0;c<1+Math.floor(rnd()*3);c++){const j=Math.floor(rnd()*n);for(let p=P.Ap[j];p<P.Ap[j+1];p++)A1[p]*=1+0.5*(rnd()-0.5);}}   // a few columns
   else for(let p=0;p<A1.length;p++)if(rnd()<0.3)A1[p]=(rnd()-0.5)*8;                                    // strong changes: the pivots may move
   let Fl=null;try{Fl=SP.lu(P,A1,q,0.1);}catch(e){}
   const G=SP.clone(F),r=SP.refactor(G,P,A1,0.1);o.cases++;
   if(r<0){o.refused++;if(Fl&&same(Fl.pinv,F.pinv))o.bad.push(['refused with the same pivots',trial,v]);}
   else if(!Fl||!same(Fl.pinv,G.pinv)||!same(Fl.Lx,G.Lx)||!same(Fl.Ux,G.Ux)||!same(Fl.Li,G.Li)||!same(Fl.Ui,G.Ui))o.bad.push(['factors differ',trial,v]);
   const H=SP.clone(F),Aold=A0.slice(),chg=new Uint8Array(n),first=SP.diffCols(P,H,A1,Aold,chg);
   if(first>=0){const c=SP.affected(H,chg,first),r2=SP.refactor(H,P,A1,0.1,chg);
    if((r2<0)!==(r<0))o.bad.push(['partial and full disagree',trial,v]);
    else if(r2>=0){o.partial++;o.cols+=r2;o.all+=n;if(r2!==c||!same(H.Lx,G.Lx)||!same(H.Ux,G.Ux))o.bad.push(['partial differs',trial,v]);
     const b=Float64Array.from({length:n},()=>rnd()),b1=b.slice(),b2=b.slice();SP.solve(Fl,b1);SP.solve(H,b2);if(!same(b1,b2))o.bad.push(['solution differs',trial,v]);}
    if(!same(Aold,A1))o.bad.push(['the kept matrix was not updated',trial,v]);}}}
 o.bad=o.bad.slice(0,5);o.frac=o.cols/o.all;R.rand=o;}
// ---------------------------------------------------------------- circuits with switchings
function project(comps,conns,step){let n=0;return {version:3,components:comps.map(c=>({x:0,y:0,rot:0,...c})),
 wires:conns.map(([a,b])=>{const [ac,ap]=a.split(':'),[bc,bp]=b.split(':');return {id:'w'+(n++),a:{c:ac,p:ap},b:{c:bc,p:bp},pts:[]};}),solve:{step}};}
function ladder(N){const c=[{id:'V1',type:'VAC',params:{Vpk:100,f:50}},{id:'G',type:'GND',params:{}},{id:'K',type:'CONST',params:{v:'0:1, 0.0004:0, 0.0008:1, 0.0012:0, 0.0016:1'}},{id:'K2',type:'CONST',params:{v:'0:1, 0.0006:0, 0.0014:1'}}],w=[['V1:n','G:g']];let prev='V1:p';
 for(let k=1;k<=N;k++){c.push({id:'R'+k,type:'R',params:{R:0.1}},{id:'L'+k,type:'L',params:{L:1e-4}},{id:'C'+k,type:'C',params:{C:1e-6}});
  w.push([prev,'R'+k+':a'],['R'+k+':b','L'+k+':a'],['C'+k+':n','G:g']);let end='L'+k+':b';
  if(k>N-4){c.push({id:'S'+k,type:'SW',params:{gate:'sig',body:false,Ron:1e-3,Roff:1e6}});w.push([end,'S'+k+':d'],[(k%2?'K':'K2')+':y','S'+k+':g']);end='S'+k+':s';}   // switches in the last sections
  w.push([end,'C'+k+':p']);prev='C'+k+':p';}
 c.push({id:'RL',type:'R',params:{R:10}});w.push([prev,'RL:a'],['RL:b','G:g']);return project(c,w,2e-6);}
{const pr=ladder(120),run=refac=>{const s=new MNA.Sim(JSON.parse(JSON.stringify(pr)),{h:2e-6,solver:'sparse',refac});s.run(2e-6*1000);return {x:Array.from(s.x),st:s.lustat,n:s.n,rf:s.refac};};
 const a=run('off'),b=run('full'),c=run('partial');
 R.circ={n:a.n,fullSame:same(a.x,b.x),partSame:same(a.x,c.x),off:a.st,full:b.st,part:c.st,rf:[a.rf,b.rf,c.rf]};}
// ---------------------------------------------------------------- tutorials
function tut(id,N,opts,over){const t=globalThis.Tutorials.get(id),o={};for(const q of t.options||[])o[q.k]=q.def;Object.assign(o,over||{});const pr=t.build(o);
 const s=new MNA.Sim(pr,{hDiv:pr.sim?.hDiv,method:pr.sim?.method||'TR',...opts});const t0=process.hrtime.bigint();for(let k=0;k<N;k++)s.run(s.h);
 return {x:Array.from(s.x),v:Array.from(s.computeVals()),info:s.solverInfo(),us:Number(process.hrtime.bigint()-t0)/1e3/N};}
R.tut={};
for(const [id,N,over] of [['ieee9_emt',500],['xf_inrush',600],['lightning_gis',300],['gen_ctl',500],['hvdc_mmc',400],['pmsm',1500,null,'sparse'],['srm',1500,null,'sparse']]){
 const sv=id==='pmsm'||id==='srm'?'sparse':undefined;
 const off=tut(id,N,{refac:'off',...(sv?{solver:sv}:{})},over),def=tut(id,N,sv?{solver:sv}:{},over),dn=tut(id,N,{solver:'dense'},over);
 R.tut[id]={n:def.info.n,kind:def.info.kind,refac:def.info.refac,everyStep:def.info.everyStep,asProposed:def.info.asProposed,same:same(off.x,def.x)&&same(off.v,def.v),relDense:rel(dn.x,def.x),
  st:def.info.stats,stOff:off.info.stats,us:{off:+off.us.toFixed(1),def:+def.us.toFixed(1),dense:+dn.us.toFixed(1)}};}
// ---------------------------------------------------------------- the proposal of the engine and the settings
{const mkSim=(id,opts,solve)=>{const t=globalThis.Tutorials.get(id),o={};for(const q of t.options||[])o[q.k]=q.def;const pr=t.build(o);if(solve)pr.solve={...(pr.solve||{}),...solve};const s=new MNA.Sim(pr,{hDiv:pr.sim?.hDiv,...opts});s.run(s.h*20);return s.solverInfo();};
 const pick=q=>({n:q.n,kind:q.kind,refac:q.refac,ask:q.ask,everyStep:q.everyStep,why:q.why,blocks:q.blocks,prop:q.proposal.solver,text:q.proposal.text,asProposed:q.asProposed,fact:q.stats.fact});
 R.info={buck:pick(mkSim('buck')),buckSparse:pick(mkSim('buck',{},{solver:'sparse',refac:'full'})),ieee9:pick(mkSim('ieee9_emt')),ieee9Dense:pick(mkSim('ieee9_emt',{},{solver:'dense'})),mmc:pick(mkSim('hvdc_mmc')),cable:pick(mkSim('cable_xb'))};}
process.stdout.write(JSON.stringify(R));
