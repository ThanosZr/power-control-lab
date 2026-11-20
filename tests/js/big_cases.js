// 4.19.3 (ROADMAP §68): the solver on large networks and the eigenvectors of the step check. Usage: node big_cases.js -> JSON
//  vec:   the real-arithmetic eigenvector against the complex code (bit for bit), the eigenvalues kept with the Hessenberg form
//         against eig() (bit for bit), and the eigenvector from the Hessenberg form against the factorization (up to rounding)
//  msgs:  the messages of the step check of a circuit with switches, with the two ways (modeVec)
//  grid:  the mesh of the tutorial big_grid: size, the sparse phasor start against the dense one, the record buffers, the fault
//  same:  a circuit below the size limits runs with the same numbers whichever way the lists of 4.19.3 are built (two builds)
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');global.Expr=require(W+'/expr.js');const SC=global.StepCheck=require(W+'/stepcheck.js');
global.LineModels=require(W+'/linemodels.js');
for(const f of ['netlib','subcircuit','bus','units','nn'])require(W+'/'+f+'.js');
const MNA=global.MNA=require(W+'/mna.js');require(W+'/tutorials.js');
const out={};
// ---- eigenvectors
{let seed=7;const rnd=()=>{seed=(seed*1103515245+12345)&0x7fffffff;return seed/0x7fffffff;};
 let real=0,realBad=0,eigBad=0,hess=0,hessWorst=0,hessNull=0;
 for(let trial=0;trial<120;trial++){const n=3+Math.floor(rnd()*50),M=new Float64Array(n*n);
  const dens=trial%4===0?1:0.05+rnd()*0.3;for(let i=0;i<n*n;i++)M[i]=rnd()<dens?(rnd()-0.5)*Math.pow(10,Math.floor(rnd()*8)-4):0;
  if(trial%5===0)for(let i=0;i<n;i++)M[i*n+i]=0;if(trial%7===0)for(let i=0;i<n;i++)M[1*n+i]=M[i];
  const e=SC.eig(M,n),k=SC.eigKeep(M,n);for(let i=0;i<n;i++)if(!Object.is(e.re[i],k.re[i])||!Object.is(e.im[i],k.im[i]))eigBad++;
  for(let q=0;q<n;q++){if(e.im[q]<0)continue;
   if(e.im[q]===0){real++;const a=SC.eigvecAbs(M,n,e.re[q],0),b=SC.eigvecAbs(M,n,e.re[q],0,true);for(let i=0;i<n;i++)if(!Object.is(a[i],b[i])&&!(a[i]===0&&b[i]===0)){realBad++;break;}}
   // (the comparison of the two ways only on well-conditioned matrices: a full matrix with a shifted diagonal)
   if(trial%4===0&&trial%5!==0&&trial%7!==0){const a=SC.eigvecAbs(M,n,e.re[q],e.im[q]),b=SC.eigvecHess(k.keep,e.re[q],e.im[q]);if(!b){hessNull++;continue;}
    let ma=0;for(let i=0;i<n;i++)ma=Math.max(ma,a[i]);let d=0;for(let i=0;i<n;i++)d=Math.max(d,Math.abs(a[i]/ma-b[i]));hess++;hessWorst=Math.max(hessWorst,d);}}}
 out.vec={real,realBad,eigBad,hess,hessWorst,hessNull};}
const build=(id,o)=>{const t=Tutorials.get(id),opts={...Object.fromEntries((t.options||[]).map(q=>[q.k,q.def])),...(o||{})};return t.build(opts);};
const sim=(pr,o)=>{const sv=pr.sim||{};return new MNA.Sim(pr,{hDiv:sv.hDiv||10,method:sv.method||'TR',...(o||{})});};
// ---- the messages of the step check with the two ways (a single-phase circuit: no two states carry a mode equally)
{const txt=s=>s.stepCheck().map(m=>[m.sev,m.key,m.id||'',m.msg].join('|'));
 const a=sim(build('buck')),b=sim(build('buck'),{modeVec:'hess'});const ma=txt(a),mb=txt(b);
 for(let i=0;i<400;i++){a.run(a.h);b.run(b.h);}
 const na=a.dg?[...a.dg.values()].map(m=>m.msg):[],nb=b.dg?[...b.dg.values()].map(m=>m.msg):[];
 let same=true;for(const k of a.keys)if(!Object.is(a.now(k),b.now(k)))same=false;
 out.msgs={n:ma.length,equal:JSON.stringify(ma)===JSON.stringify(mb),notes:na.length,notesEqual:JSON.stringify(na)===JSON.stringify(nb),sameNumbers:same,ways:[a.modeVec,b.modeVec]};}
// ---- the mesh
{const pr=Tutorials.bigGrid(4,'fault'),a=sim(pr),d=sim(pr,{initSolver:'dense'}),s=sim(pr,{initSolver:'sparse'});
 const q=a.solverInfo();
 for(let i=0;i<300;i++){d.run(d.h);s.run(s.h);}
 const sc={},G={};for(let k=0;k<d.keys.length;k++){const g=d.keys[k].split(':')[0];G[g]=Math.max(G[g]||0,Math.abs(d.vals[k]));}
 let worst=0;for(let k=0;k<d.keys.length;k++){const g=d.keys[k].split(':')[0],e=Math.abs(d.vals[k]-s.vals[k])/Math.max(Math.abs(d.vals[k]),1e-6*G[g],1e-12);if(e>worst)worst=e;}
 // the fault (40 ms) and its clearing (140 ms)
 const kI='Y:F1/Ia',kV=pr.scope.panes[0][0][0];let iPre=0,iF=0,vPre=0,vF=0;
 // the first period from the phasor start: the peak of the phase voltage in pu of 150 kV·√2/√3, at the middle and at the far corner; and the same in the second period (a steady start)
 const kC=pr.scope.panes[0][1][0],Vb=150e3*Math.SQRT2/Math.sqrt(3);let p1=0,p2=0,c1=0;while(a.t<0.02){a.run(a.h);p1=Math.max(p1,Math.abs(a.now(kV)));c1=Math.max(c1,Math.abs(a.now(kC)));}while(a.t<0.039){a.run(a.h);p2=Math.max(p2,Math.abs(a.now(kV)));}
 while(a.t<0.039)a.run(a.h);for(let i=0;i<20;i++){a.run(a.h);iPre=Math.max(iPre,Math.abs(a.now(kI)));vPre=Math.max(vPre,Math.abs(a.now(kV)));}
 while(a.t<0.06)a.run(a.h);for(let i=0;i<400;i++){a.run(a.h);iF=Math.max(iF,Math.abs(a.now(kI)));vF=Math.max(vF,Math.abs(a.now(kV)));}
 // 5.0 (343.4): the buffers sized by memory are those of a record of every channel (solve.rec = 'all'); with the default of
 // a file of version 4 the grid records only the channels of its scope and keeps the 20000 points and more
 const g8=Tutorials.bigGrid(8,'none');g8.solve={...(g8.solve||{}),rec:'all'};const big=sim(g8);for(let i=0;i<20;i++)big.run(big.h);
 const bigA=sim(Tutorials.bigGrid(8,'none'));for(let i=0;i<20;i++)bigA.run(bigA.h);
 out.grid={n:q.n,kind:q.kind,keys:a.keys.length,auto:a.initSolver,forced:[d.initSolver,s.initSolver],startDiff:worst,cap:a.ring.cap,perCap:a.per.cap,memNote:a.memNote||'',
  iPre,iF,vPre,vF,vMid:p1/Vb,vMid2:p2/Vb,vCorner:c1/Vb,warnings:(a.net.warnings||[]).length,
  n8:big.n,keys8:big.keys.length,auto8:big.initSolver,cap8:big.ring.cap,perCap8:big.per.cap,mb8:Math.round((big.ring.d.byteLength+5*big.per.avg.byteLength)/1048576),finite8:big.keys.every(k=>Number.isFinite(big.now(k))),recAuto8:!!bigA.recAuto,rec8:bigA.recKeys.length,capA8:bigA.ring.cap,sameA8:big.keys.every(k=>Object.is(big.now(k),bigA.now(k)))};}
// ---- up to the limits nothing changed: buffers and start of a circuit of the existing tutorials
{const s=sim(build('ieee9_emt'));out.small={keys:s.keys.length,cap:s.ring.cap,perCap:s.per.cap,init:s.initSolver,memNote:s.memNote||''};}
console.log(JSON.stringify(out));
