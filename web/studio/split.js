'use strict';
// 4.24 (THEORY §8Ι.7, ROADMAP §90): a network split in subnetworks at its lines, and multirate. No DOM.
//
// A line with a travel time τ ≥ h (the solver never takes a longer step, Sim.tlMaxStep) gives no term of the matrix between
// its two ends: each end sees the other only through the history at t − τ (Bergeron's method, EMTP Theory Book §1). The
// network is then block diagonal: its subnetworks are the connected parts of what is left without the lines, joined also
// by anything that reads or drives the same signals (blocks, controllers, sample-holds, machines). Each part, or a group of
// parts, runs in its own simulator: every one is the whole network built and started together (the same netlist, the same
// steady start), then kept to its group (Sim.restrict). A line between two groups is cut: each side records only its own
// end, publishes it after every step and reads the other end from what that side published (a link). With the same steps
// the numbers are those of one simulator, bit for bit; each group reacts only to its own events (a switching cuts and
// changes the integration rule only of its own group, as the subsystems of the EMTDC and the racks of a real-time
// simulator), and then the results differ by the error of the integration.
//
// Multirate: a group may take a step m·h (m an integer). The reader of a slower side interpolates its waves linearly
// between the steps of that side (the incident wave, Semlyen and de León 1993, §2.2.1); the reader of a faster side sees
// its waves smoothed over its own step, the area equal to that of a straight segment (§2.2.2, Eq. (10)).
//
// Split.plan(sim, opt)       the subnetworks and the cuts of a built simulator, the groups for opt.groups and opt.rates
// Split.serial(project, opt) all the groups in this thread, one step of the group furthest behind at a time (also the way
//                            to check the bits); returns the merged result
// Split.workers(project,opt) one Worker per group (Node worker_threads or browser Workers), links in shared memory;
//                            a Promise of the merged result
// Split.attach(sim, plan, g, links, opt)   (used by both, and by split_worker.js) keeps sim to group g
(function(root){
 const MNA=root.MNA||(typeof require==='function'?require('./mna.js'):null);
 const P=MNA.Sim.prototype,now=()=>typeof performance!=='undefined'?performance.now():Date.now();

 // ---------------------------------------------------------------- the unknowns of an element (nodes, branch rows)
 const NODE_F=['a','b','bx','m','row','s1','s2','p1','p2'];
 const isLine=e=>e.k==='TL'||e.k==='TLM';
 const endsOf=e=>e.k==='TL'?[[e.a1,e.b1].filter(i=>i>=0),[e.a2,e.b2].filter(i=>i>=0)]:[e.n1.filter(i=>i>=0),e.n2.filter(i=>i>=0)];
 function unk(e){const u=[];if(isLine(e)){for(const s of endsOf(e))u.push(...s);return u;}
  for(const f of NODE_F){const v=e[f];if(typeof v==='number'&&v>=0)u.push(v);}
  if(Array.isArray(e.ports))for(const pr of e.ports)for(const i of pr)if(typeof i==='number'&&i>=0)u.push(i);
  return u;}
 // the columns of the record of a line that belong to one end (the others are its inner junctions or the other end)
 function colsOf(e,end){
  if(e.k==='TL'){const N=e.N;return end?[N,3*N]:[0,N+1];}
  const M=e.M,c=[];if(e.wb){for(let r=0;r<M;r++)c.push(end*M+r);return c;}
  for(let k=0;k<M;k++){if(e.fd)c.push(2*k+end);else c.push(4*k+end,4*k+2+end);}
  return c;}
 function UF(n){const p=new Int32Array(n);for(let i=0;i<n;i++)p[i]=i;
  const f=i=>{while(p[i]!==i){p[i]=p[p[i]];i=p[i];}return i;};
  return {f,u(a,b){a=f(a);b=f(b);if(a!==b){if(a<b)p[b]=a;else p[a]=b;}}};}

 // ---------------------------------------------------------------- the subnetworks
 // Union–find over the unknowns, the signal nets, the blocks, the controllers and the sample-holds. A line joins each of
 // its ends with itself only. Anything a block, controller, sample-hold or machine refers to (an element, a part by its
 // id or a channel of it, a node, a signal net, another block) joins it: what is not found here is caught by the tests,
 // because a part never reads the unknowns of another part (they are NaN there).
 function partition(sim){
  const net=sim.net,n=sim.n,els=net.els,G=net.sig,nb=G.blocks.length,K=net.ctrls,Q=net.shs,ns=G.n||0;
  const S0=n,B0=S0+ns,K0=B0+nb,Q0=K0+K.length,N=Q0+Q.length,uf=UF(N);
  const elSet=new Set(els),mach=new Map(),objIx=new Map(),idIx=new Map();
  for(const c of net.compInfo.values())for(const f of ['gen','sm','im','srm'])if(c[f])mach.set(c[f],c);
  G.blocks.forEach((b,i)=>{objIx.set(b,B0+i);idIx.set(b.id,B0+i);});K.forEach((k,j)=>{objIx.set(k,K0+j);idIx.set(k.id,K0+j);});Q.forEach((q,j)=>{objIx.set(q,Q0+j);if(q.id)idIx.set(q.id,Q0+j);});
  const join=(a,list)=>{for(const i of list)uf.u(a,i);};
  // a part referred to: every unknown of its elements (of a line, its first end: the quantities of a line part are those of its first end)
  const compU=c=>{const u=[];for(const e of c.els)u.push(...(isLine(e)?endsOf(e)[0]:unk(e)));return u;};
  const refId=(a,v)=>{const c=net.compInfo.get(v);if(c){join(a,compU(c));return;}if(idIx.has(v)){uf.u(a,idIx.get(v));return;}
   const i=v.indexOf(':');if(i>0){const id=v.slice(i+1),c2=net.compInfo.get(id)||net.compInfo.get(id.split(':')[0]);if(c2)join(a,compU(c2));}};
  const scan=(a,obj,deep)=>{for(const key of Object.keys(obj)){const v=obj[key];if(v===null||v===undefined)continue;
   if(typeof v==='number'){if(v>=0&&Number.isInteger(v)){if(/In$/.test(key)||key==='tl'){if(v<ns)uf.u(a,S0+v);}else if((key==='np'||key==='nn'||key==='m')&&v<n)uf.u(a,v);}}
   else if(typeof v==='string')refId(a,v);
   else if(typeof v==='object'){
    if(elSet.has(v))join(a,isLine(v)?endsOf(v)[0]:unk(v));else if(mach.has(v))join(a,compU(mach.get(v)));else if(objIx.has(v))uf.u(a,objIx.get(v));
    else if(Array.isArray(v)){for(const x of v){if(x&&typeof x==='object'){if(elSet.has(x))join(a,unk(x));else if(objIx.has(x))uf.u(a,objIx.get(x));}else if(key==='sIn'&&typeof x==='number'&&x>=0&&x<ns)uf.u(a,S0+x);}}
    else if(deep&&(key==='ins'||key==='outs')){for(const x of Object.values(v))if(typeof x==='number'&&x>=0&&x<ns)uf.u(a,S0+x);}
    else if(deep&&key==='fire')scan(a,v,false);}}};
  for(const e of els){
   if(isLine(e)){for(const s of endsOf(e))if(s.length)join(s[0],s);continue;}
   const u=unk(e);if(!u.length)continue;const a=u[0];join(a,u);
   if(e.gIn>=0)uf.u(a,S0+e.gIn);if(e.sigIn>=0)uf.u(a,S0+e.sigIn);if(Array.isArray(e.sIn))for(const x of e.sIn)if(x>=0)uf.u(a,S0+x);
   if(e.gate==='pwm'){const j=K.findIndex(k=>k.id===e.pwm);if(j>=0)uf.u(a,K0+j);}
   if(typeof e.lccB==='number'&&e.lccB>=0)uf.u(a,B0+e.lccB);
   if(e.fire)scan(a,e.fire,false);
   if(e.foot&&e.foot.tl){const t=e.foot.tl;join(a,[t.a2,t.b2].filter(i=>i>=0));}
   for(const f of ['gen','sm','im','srm'])if(e[f]&&mach.has(e[f]))join(a,compU(mach.get(e[f])));}
  for(const c of net.compInfo.values()){const u=[];for(const e of c.els)if(!isLine(e))u.push(...unk(e));if(!u.length)continue;
   if(u.length>1)join(u[0],u);for(const f of ['gen','sm','im','srm'])if(c[f])scan(u[0],c[f],false);
   if(c.blk&&objIx.has(c.blk))uf.u(u[0],objIx.get(c.blk));}
  G.blocks.forEach((b,i)=>scan(B0+i,b,true));K.forEach((k,j)=>scan(K0+j,k,true));Q.forEach((q,j)=>scan(Q0+j,q,true));
  // the parts: one per root that holds unknowns, numbered in the order of their first unknown
  const pid=new Map(),parts=[];
  for(let i=0;i<n;i++){const r=uf.f(i);if(!pid.has(r)){pid.set(r,parts.length);parts.push({id:parts.length,unknowns:[],els:[],blocks:[],ctrls:[],shs:[],cuts:[],nEl:0});}parts[pid.get(r)].unknowns.push(i);}
  if(!parts.length)parts.push({id:0,unknowns:[],els:[],blocks:[],ctrls:[],shs:[],cuts:[],nEl:0});
  const pOf=i=>pid.get(uf.f(i));
  // (the plan holds indices: every simulator of the same project has the same netlist, its own objects)
  const cuts=[],elPart=new Map();
  els.forEach((e,ei)=>{
   if(isLine(e)){const [A,B]=endsOf(e),pa=A.length?pOf(A[0]):null,pb=B.length?pOf(B[0]):null;
    if(pa!==null&&pb!==null&&pa!==pb){const c={i:cuts.length,ei,p:[pa,pb],ts:e.k==='TL'?e.ts:e.tauMin,m:[colsOf(e,0).length,colsOf(e,1).length]};cuts.push(c);parts[pa].cuts.push(c);parts[pb].cuts.push(c);return;}
    const p=pa!==null?pa:pb;if(p===null)return;elPart.set(e,p);parts[p].els.push(ei);return;}
   const u=unk(e);if(!u.length)return;const p=pOf(u[0]);elPart.set(e,p);parts[p].els.push(ei);});
  // what holds no unknown (a signal chain alone) goes with the first part
  const sigPart=ix=>{const r=uf.f(ix);return pid.has(r)?pid.get(r):0;};
  G.blocks.forEach((b,i)=>parts[sigPart(B0+i)].blocks.push(i));K.forEach((k,j)=>parts[sigPart(K0+j)].ctrls.push(j));Q.forEach((q,j)=>parts[sigPart(Q0+j)].shs.push(j));
  // the part of every part of the circuit (for its channels); a line between two parts: its channels where they are not NaN
  const compPart=new Map();
  for(const c of net.compInfo.values()){let p=null;for(const e of c.els){if(elPart.has(e)){p=elPart.get(e);break;}}
   if(p===null&&c.els.length&&c.els.every(isLine)&&cuts.some(q=>els[q.ei]===c.els[0]))p=-1;
   if(p===null){const o=c.blk||c.ctrl||c.sh;if(o&&objIx.has(o))p=sigPart(objIx.get(o));}
   compPart.set(c.id,p===null?0:p);}
  for(const q of parts){q.n=q.unknowns.length;q.nEl=q.els.length;
   q.fast=q.els.some(i=>{const e=els[i];return e.k==='S'||e.k==='D'||e.k==='NL'||e.k==='CPL'||e.k==='CHB'||e.k==='F'||e.arc||e.sai||e.foot;})||q.blocks.length>0||q.ctrls.length>0||q.shs.length>0;}
  return {n,nEls:els.length,parts,cuts,allCuts:cuts,compPart};
 }

 // ---------------------------------------------------------------- groups and rates
 // rates: null (all with the step h), 'auto' (a part without switches, nonlinear elements, machines or signals takes
 // m = ⌊τ_min/h⌋ of its cut lines, at most 16 and at most T/(40h): our proposal) or {part id: m}.
 // Groups: the parts in breadth-first order over the cut lines from part 0, per rate, cut in contiguous runs of about
 // equal unknowns (a group is one simulator: the lines between parts of the same group are not cut).
 function plan(sim,opt={}){
  const P0=partition(sim),parts=P0.parts,np=parts.length,h=sim.h;
  const rate=new Int32Array(np).fill(1),why=[];
  const mMax=Math.max(1,Math.round(+opt.rateMax||16)),E=sim.net.els;
  if(opt.rates==='auto'){for(const q of parts){if(q.fast||!q.cuts.length)continue;const ts=Math.min(...q.cuts.map(c=>c.ts));
    // the fastest resonance of the part, 2π√(LC) over its inductances and capacitances: at least 20 steps in it
    const Ls=[],Cs=[];for(const i of q.els){const e=E[i];if(e.k==='L')Ls.push(e.L);else if(e.k==='C')Cs.push(e.C);}
    let Tl=Infinity;for(const L of Ls)for(const C of Cs)Tl=Math.min(Tl,2*Math.PI*Math.sqrt(L*C));
    const m=Math.max(1,Math.min(mMax,Math.floor(ts/h*(1+1e-9)),Math.floor(sim.T/(40*h)),Number.isFinite(Tl)?Math.floor(Tl/(20*h)):Infinity));rate[q.id]=m;}}
  else if(opt.rates&&typeof opt.rates==='object')for(const [k,v] of Object.entries(opt.rates)){const i=+k;if(i>=0&&i<np)rate[i]=Math.max(1,Math.round(+v||1));}
  // a step never longer than τ of a cut line on either side
  for(const c of P0.cuts)for(const p of c.p)if(rate[p]*h>c.ts*(1+1e-9)){rate[p]=Math.max(1,Math.floor(c.ts/h*(1+1e-9)));why.push(`υποδίκτυο ${p}: m ≤ τ/h της γραμμής`);}
  // breadth-first order over the cut lines
  const adj=parts.map(()=>[]);for(const c of P0.cuts){adj[c.p[0]].push(c.p[1]);adj[c.p[1]].push(c.p[0]);}
  const seen=new Uint8Array(np),ord=[];for(let s=0;s<np;s++){if(seen[s])continue;const qq=[s];seen[s]=1;while(qq.length){const v=qq.shift();ord.push(v);for(const w of adj[v])if(!seen[w]){seen[w]=1;qq.push(w);}}}
  const rates=[...new Set(ord.map(p=>rate[p]))];
  const want=Math.max(1,Math.min(np,Math.round(+opt.groups||1))),total=parts.reduce((s,q)=>s+q.n,0),groups=[];
  for(const m of rates){const list=ord.filter(p=>rate[p]===m),sz=list.reduce((s,p)=>s+parts[p].n,0);
   const k=Math.max(1,Math.min(list.length,Math.round(want*sz/total)||1));let cur=[],acc=0,done=0;
   for(const p of list){cur.push(p);acc+=parts[p].n;if(acc>=(sz-done)/(k-groups.filter(g=>g.m===m).length)&&groups.filter(g=>g.m===m).length<k-1){groups.push({m,parts:cur,n:acc});done+=acc;cur=[];acc=0;}}
   if(cur.length)groups.push({m,parts:cur,n:acc});}
  const gOf=new Int32Array(np);groups.forEach((g,i)=>{g.i=i;for(const p of g.parts)gOf[p]=i;});
  const cuts=P0.cuts.filter(c=>gOf[c.p[0]]!==gOf[c.p[1]]);
  return {...P0,rate,groups,gOf,cuts,why,h};
 }

 // ---------------------------------------------------------------- a link: one end of a cut line, from its side to the other
 // A ring of rows (t, the columns of that end) in an ArrayBuffer or a SharedArrayBuffer; c[0] rows written, c[1] rows
 // read, c[2] 1 when the writer has finished.
 // the rows of a ring: the steps of the line's delay four times over, and 64 more (a side is never further ahead than that)
 const ringRows=(ts,h)=>Math.min(65536,64+4*Math.ceil(ts/h));
 function newLink(m,shared,R){R=R||1024;const bytes=16+8*R*(1+m);const buf=shared?new SharedArrayBuffer(bytes):new ArrayBuffer(bytes);new Int32Array(buf,0,4)[3]=R;return buf;}
 class Link{
  constructor(buf,m){this.buf=buf;this.m=m;this.c=new Int32Array(buf,0,4);this.R=this.c[3];this.f=new Float64Array(buf,16);this.shared=typeof SharedArrayBuffer!=='undefined'&&buf instanceof SharedArrayBuffer;this.last=-Infinity;}
  write(t,vals){const c=this.c,m=this.m,R=this.R;let w=Atomics.load(c,0);
   if(w-Atomics.load(c,1)>=R){if(!this.shared)throw new Error('split: η σύνδεση γέμισε');const t0=Date.now();
    while(w-Atomics.load(c,1)>=R){Atomics.wait(c,1,Atomics.load(c,1),50);if(Date.now()-t0>120000)throw new Error('split: η άλλη πλευρά δεν διαβάζει (120 s)');}}
   const o=(w%R)*(1+m),f=this.f;f[o]=t;for(let k=0;k<m;k++)f[o+1+k]=vals[k];this.last=t;Atomics.store(c,0,w+1);if(this.shared)Atomics.notify(c,0);}
  done(){Atomics.store(this.c,2,1);if(this.shared)Atomics.notify(this.c,0);}
  // the rows written and not read yet, in order
  drain(out){const c=this.c,m=this.m,f=this.f,R=this.R;const w=Atomics.load(c,0);let r=Atomics.load(c,1);if(r===w)return;
   for(;r<w;r++){const o=(r%R)*(1+m),row=new Float64Array(1+m);for(let k=0;k<=m;k++)row[k]=f[o+k];out.push(row);}
   Atomics.store(c,1,r);if(this.shared)Atomics.notify(c,1);}
  waitMore(){const c=this.c;Atomics.wait(c,0,Atomics.load(c,0),50);}
  finished(){return Atomics.load(this.c,2)===1;}
 }

 // ---------------------------------------------------------------- keep a simulator to one group
 function attach(sim,pl,g,links,opt={}){
  if(sim.var)throw new Error('Τα υποδίκτυα θέλουν σταθερό βήμα.');
  const grp=pl.groups[g],mine=new Set(grp.parts),net=sim.net,nN=net.nNodes,E=net.els,B=net.sig.blocks;
  if(E.length!==pl.nEls||sim.n!==pl.n)throw new Error('split: άλλο netlist από αυτό του σχεδίου');
  const els=new Set(),blocks=new Set(),ctrls=new Set(),shs=new Set(),comps=new Set(),own=new Uint8Array(sim.n);
  for(const p of grp.parts){const q=pl.parts[p];for(const i of q.els)els.add(E[i]);for(const i of q.blocks)blocks.add(B[i]);for(const i of q.ctrls)ctrls.add(net.ctrls[i]);for(const i of q.shs)shs.add(net.shs[i]);for(const i of q.unknowns)own[i]=1;}
  // lines between two parts of this group are whole here; cut lines with one end here
  const myCuts=[];for(const c of pl.allCuts){const e=E[c.ei];if(els.has(e))continue;const a=mine.has(c.p[0]),b=mine.has(c.p[1]);if(a&&b)els.add(e);else if(a||b){els.add(e);myCuts.push({c,e,o:a?0:1});}}
  for(const c of net.compInfo.values()){const p=pl.compPart.get(c.id);if(p===-1){if(c.els.some(e=>els.has(e)))comps.add(c.id);}else if(mine.has(p))comps.add(c.id);}
  const pad=[],foreign=[];for(let i=0;i<sim.n;i++)if(!own[i]){foreign.push(i);if(i>=nN)pad.push(i);}
  const keys=[];for(const nt of net.nets)if(nt.index>=0&&own[nt.index])keys.push('N:'+nt.canon);
  for(const c of net.compInfo.values())if(comps.has(c.id)&&!['GND','JUNC','TAGO','TAGI'].includes(c.type))keys.push(...sim.compKeys(c));
  // the order of the netlist is kept by restrict
  sim.restrict({els,blocks,ctrls,shs,comps,pad,keys});
  const F=Int32Array.from(foreign);sim.splitForeign=F;sim.splitGroup=g;
  // the right-hand side of the other parts is zero (a dense solve would carry their NaN into this part), their solution NaN
  sim.rhs=function(h,mode){P.rhs.call(this,h,mode);const b=this.b;for(let k=0;k<F.length;k++)b[F[k]]=0;};
  sim.solveOnce=function(h,mode){const s=P.solveOnce.call(this,h,mode);for(let k=0;k<F.length;k++)s[F[k]]=NaN;return s;};
  sim.topoCheck=function(){this.topoSig='';};
  if(grp.m>1)sim.setStep(sim.opts.hDiv,pl.h*grp.m);
  // the cut lines: the record of the other end from its link
  const smooth=opt.smooth==='area'||opt.smooth==='avg';
  for(const {c,e,o} of myCuts){const f=1-o,cin=colsOf(e,f),cout=colsOf(e,o),H=e.H,gf=pl.gOf[c.p[f]];
   const hist=e.k==='TL'?P.tlHist:P.tlmHist,init=hist.call(sim,e,-1e30);
   const far={t:[],c:cin.map(()=>[]),s:H.s,init:cin.map(k=>init[k])};for(let j=H.s;j<H.t.length;j++){far.t.push(H.t[j]);cin.forEach((k,q)=>far.c[q].push(H.c[k][j]));}far.s=0;
   const mW=pl.groups[gf].m,mR=grp.m;
   e.cut={o,cin,cout,far,pend:[],inp:new Link(links[2*c.i+f],cin.length),out:new Link(links[2*c.i+o],cout.length),row:new Float64Array(cout.length),
    sm:smooth&&mW<mR?{avg:opt.smooth==='avg',last:Float64Array.from([far.t[far.t.length-1],...far.c.map(a=>a[a.length-1])])}:null,keep:e.k==='TL'?1.5*e.ts:2.5*e.tauMax+4*(sim.hUser||0)};}
  sim.splitCuts=myCuts.map(q=>q.e);
  sim.tlHist=function(e,tq){const out=P.tlHist.call(this,e,tq);if(e.cut)farHist(this,e,tq,out);return out;};
  sim.tlmHist=function(e,tq){const out=P.tlmHist.call(this,e,tq);if(e.cut)farHist(this,e,tq,out);return out;};
  sim.tlRecord=function(e,t){P.tlRecord.call(this,e,t);if(e.cut)publish(e);};
  sim.tlmRecord=function(e,t,h){P.tlmRecord.call(this,e,t,h);if(e.cut)publish(e);};
  sim.splitBlock=!!opt.block;
  return sim;
 }
 function publish(e){const C=e.cut,H=e.H,j=H.t.length-1,row=C.row;C.cout.forEach((k,q)=>{row[q]=H.c[k][j];});C.out.write(H.t[j],row);}
 // the rows of the other end: those written at times up to this simulator's time t₀ (the record of the other end as one
 // simulator would hold it), and, when none of them reaches the time tq asked (the other side takes other steps), the next
 // ones until one does, so that tq lies between two rows. Ready when the other side has written a row at tq or later.
 function ready(sim,e,tq){const C=e.cut;C.inp.drain(C.pend);const ft=C.far.t;
  const last=C.pend.length?C.pend[C.pend.length-1][0]:(ft.length?ft[ft.length-1]:-Infinity);return last>=tq||C.inp.finished();}
 function fill(sim,e,tq){const C=e.cut,t0=sim.t,F=C.far;
  if(C.sm){smoothFill(sim,e);return;}
  while(C.pend.length&&C.pend[0][0]<=t0)addRow(F,C.pend.shift(),C.keep,t0);
  while(C.pend.length&&(!F.t.length||F.t[F.t.length-1]<tq))addRow(F,C.pend.shift(),C.keep,t0);}
 function addRow(F,row,keep,t0){F.t.push(row[0]);for(let q=0;q<F.c.length;q++)F.c[q].push(row[1+q]);
  while(F.s+2<F.t.length&&F.t[F.s+1]<t0-keep)F.s++;if(F.s>4096){F.t.splice(0,F.s);for(const c of F.c)c.splice(0,F.s);F.s=0;}}
 // Eq. (10): over each step (t₁, t₂] of the reader, s(t₂) = 2·A/(t₂ − t₁) − s(t₁), A the area of the writer's rows
 function smoothFill(sim,e){const C=e.cut,F=C.far,t2=sim.t,S=C.sm,m=F.c.length;
  const t1=F.t[F.t.length-1];if(!(t2>t1))return;
  // the rows up to t₂ (and one after, to interpolate at t₂)
  const rows=[S.last];while(C.pend.length&&C.pend[0][0]<=t2)rows.push(C.pend.shift());if(rows[rows.length-1][0]<t2&&C.pend.length)rows.push(C.pend[0]);
  const at=(t,q)=>{for(let i=1;i<rows.length;i++){const a=rows[i-1],b=rows[i];if(t<=b[0]){const w=(t-a[0])/((b[0]-a[0])||1);return a[1+q]+(b[1+q]-a[1+q])*w;}}return rows[rows.length-1][1+q];};
  const s=new Float64Array(1+m);s[0]=t2;
  for(let q=0;q<m;q++){let A=0,ta=t1,ya=at(t1,q);
   for(let i=1;i<rows.length;i++){const tb=Math.min(rows[i][0],t2);if(tb<=ta)continue;const yb=at(tb,q);A+=(tb-ta)*(ya+yb)/2;ta=tb;ya=yb;}
   if(ta<t2){const yb=at(t2,q);A+=(t2-ta)*(ya+yb)/2;}
   s[1+q]=S.avg?A/(t2-t1):2*A/(t2-t1)-F.c[q][F.c[q].length-1];}
  S.last=rows.filter(r=>r[0]<=t2).pop()||S.last;addRow(F,s,C.keep,t2);}
 function farHist(sim,e,tq,out){const C=e.cut;
  if(!ready(sim,e,tq)){if(!sim.splitBlock)throw new Error('split: λείπει η ιστορία της άλλης πλευράς (σειρά βημάτων)');const t0=Date.now(),w0=now();sim.splitWait=(sim.splitWait||0)+1;
   // a short spin first (the other side is usually a step away, on another core), then wait on the link
   for(let k=0;k<200000&&!ready(sim,e,tq);k++){}
   while(!ready(sim,e,tq)){C.inp.waitMore();if(Date.now()-t0>120000)throw new Error('split: η άλλη πλευρά δεν προχωρά (120 s)');}
   sim.splitWaitMs=(sim.splitWaitMs||0)+(now()-w0);}
  fill(sim,e,tq);
  // the interpolation of tlHist / tlmHist, on the record of the other end
  const F=C.far,T=F.t,n=T.length,cin=C.cin;
  if(!n||tq<Math.min(0,T[0])-1e-18){for(let q=0;q<cin.length;q++)out[cin[q]]=F.init[q];return;}
  const j=n-1;if(tq>=T[j]){for(let q=0;q<cin.length;q++)out[cin[q]]=F.c[q][j];return;}
  let lo=F.s,hi=j;if(tq<=T[lo]){for(let q=0;q<cin.length;q++)out[cin[q]]=F.c[q][lo];return;}
  while(hi-lo>1){const m=(lo+hi)>>1;if(T[m]<=tq)lo=m;else hi=m;}const f=(tq-T[lo])/((T[hi]-T[lo])||1);
  for(let q=0;q<cin.length;q++){const c=F.c[q];out[cin[q]]=c[lo]+(c[hi]-c[lo])*f;}}

 // the settings of the project (solve.split, solve.rates, solve.rateMax, solve.smooth, solve.groups) where opt leaves them out
 function withSolve(project,opt){const so=project?.solve||{};return {groups:so.groups,rates:so.rates||null,rateMax:so.rateMax,smooth:so.smooth,...opt};}

 // ---------------------------------------------------------------- the result of the groups
 // per channel its group, the times and the values of the record of that group; a channel of a cut line from the side
 // where it is not NaN
 function gather(sims){const ch=new Map();
  sims.forEach((s,g)=>{const R=s.ring;for(let i=0;i<s.recKeys.length;i++){const k=s.recKeys[i];const t=new Float64Array(R.n),v=new Float32Array(R.n);
   for(let q=0;q<R.n;q++){const a=(R.head-R.n+q+R.cap)%R.cap;t[q]=R.t[a];v[q]=R.d[a*R.nch+i];}
   const bad=v.some(Number.isNaN);if(ch.has(k)&&(bad||!ch.get(k).bad))continue;ch.set(k,{g,t,v,bad});}});
  return ch;}
 function stats(sims,t0){return {groups:sims.length,steps:sims.map(s=>s.steps),h:sims.map(s=>s.h),n:sims.map(s=>s.n),ms:Date.now()-t0,lu:sims.map(s=>({...s.lustat}))};}

 // ---------------------------------------------------------------- in this thread
 // opt: {sim: options of the simulator, tEnd, groups, rates, smooth}. The group furthest behind takes one step (its
 // history from the others is then there: they are not behind it and a line is at least one step long).
 function serial(project,opt={}){
  opt=withSolve(project,opt);const t0=Date.now(),so=opt.sim||{},base=new MNA.Sim(project,so),pl=plan(base,opt),G=pl.groups.length;
  const links=[];
  for(const c of pl.cuts){const R=ringRows(c.ts,pl.h);links[2*c.i]=newLink(c.m[0],false,R);links[2*c.i+1]=newLink(c.m[1],false,R);}
  const sims=[];for(let g=0;g<G;g++){const s=g===0?base:new MNA.Sim(project,so);attach(s,pl,g,links,opt);sims.push(s);}
  const tEnd=+opt.tEnd||0.02,eps=pl.h*1e-7;
  for(;;){let g=-1;for(let i=0;i<G;i++){const s=sims[i];if(s.t>=tEnd-s.h*1e-7)continue;if(g<0||s.t<sims[g].t)g=i;}if(g<0)break;
   sims[g].runUntil(tEnd,1,Infinity,false);}
  for(const s of sims){s.computeVals();for(const e of s.splitCuts||[])e.cut.out.done();}
  return {plan:pl,sims,channels:gather(sims),stats:stats(sims,t0),eps};
 }

 // ---------------------------------------------------------------- in Workers
 // opt as serial, and workerURL (browser) or workerFile (Node). Each worker builds the network, keeps its group and runs to
 // tEnd, waiting on a link when the other side is behind; the result comes back as the records of its channels.
 function workers(project,opt={}){
  opt=withSolve(project,opt);const t0=Date.now(),so=opt.sim||{},base=new MNA.Sim(project,so),pl=plan(base,opt),G=pl.groups.length;
  const links=[];for(const c of pl.cuts){const R=ringRows(c.ts,pl.h);links[2*c.i]=newLink(c.m[0],true,R);links[2*c.i+1]=newLink(c.m[1],true,R);}
  const isNode=!opt.workerURL&&typeof process!=='undefined'&&!!process.versions?.node;
  const spawn=g=>new Promise((res,rej)=>{const msg={project,opt:{sim:so,tEnd:opt.tEnd,groups:opt.groups,rates:opt.rates,rateMax:opt.rateMax,smooth:opt.smooth},g,links};
   if(isNode){const {Worker}=require('worker_threads'),w=new Worker(opt.workerFile||require('path').join(__dirname,'split_worker.js'),{workerData:msg});
    w.on('message',m=>{if(m.error)rej(new Error(m.error));else res(m);w.terminate();});w.on('error',rej);}
   else{const w=new Worker(opt.workerURL||'split_worker.js');w.onmessage=e=>{const m=e.data;w.terminate();if(m.error)rej(new Error(m.error));else res(m);};w.onerror=e=>{w.terminate();rej(new Error(e.message||'worker'));};w.postMessage(msg);}});
  return Promise.all(Array.from({length:G},(_,g)=>spawn(g))).then(rs=>{const ch=new Map();
   for(const r of rs)r.keys.forEach((k,i)=>{const t=r.t,v=r.v[i],bad=v.some(Number.isNaN);if(ch.has(k)&&(bad||!ch.get(k).bad))return;ch.set(k,{g:r.g,t,v,bad});});
   return {plan:pl,channels:ch,stats:{groups:G,steps:rs.map(r=>r.steps),h:rs.map(r=>r.h),ms:Date.now()-t0,run:rs.map(r=>r.ms),build:rs.map(r=>r.build),lu:rs.map(r=>r.lu),waits:rs.map(r=>r.waits),waitMs:rs.map(r=>r.waitMs)}};});
 }
 // one group in a worker (split_worker.js)
 function runGroup(project,opt,g,links){opt=withSolve(project,opt);const t0=Date.now(),sim=new MNA.Sim(project,opt.sim||{}),pl=plan(sim,opt),tb=Date.now()-t0;
  attach(sim,pl,g,links,{...opt,block:true});const t1=Date.now();
  try{sim.runUntil(+opt.tEnd||0.02);}finally{for(const e of sim.splitCuts||[])e.cut.out.done();}
  const R=sim.ring,t=new Float64Array(R.n),v=sim.recKeys.map(()=>new Float32Array(R.n));
  for(let q=0;q<R.n;q++){const a=(R.head-R.n+q+R.cap)%R.cap;t[q]=R.t[a];for(let i=0;i<v.length;i++)v[i][q]=R.d[a*R.nch+i];}
  return {g,keys:sim.recKeys,t,v,steps:sim.steps,h:sim.h,build:tb,ms:Date.now()-t1,lu:{...sim.lustat},waits:sim.splitWait||0,waitMs:Math.round(sim.splitWaitMs||0)};}

 // what goes back to the page: the channels asked (or all), the steps and times of the groups, the subnetworks
 function summary(r,keys){const ks=keys&&keys.length?keys.filter(k=>r.channels.has(k)):[...r.channels.keys()];
  const pl=r.plan;return {keys:ks,series:ks.map(k=>{const c=r.channels.get(k);return {k,g:c.g,t:Array.from(c.t),v:Array.from(c.v),bad:c.bad};}),stats:r.stats,
   plan:{parts:pl.parts.length,cuts:pl.cuts.length,allCuts:pl.allCuts.length,groups:pl.groups.map(g=>({m:g.m,parts:g.parts.length,n:g.n})),h:pl.h}};}

 // ---------------------------------------------------------------- what the engine proposes («Αυτόματα»), with its reason
 // From the measurement (THEORY §8Ι.7, two cores): the groups in Workers ran the steps at most 1,2 times faster on the big_grid with
 // distributed lines up to 24 × 24, and every Worker builds the whole network, so with the build nothing was gained. «Αυτόματα» is
 // therefore one simulator; the analysis (the subnetworks and the largest of them) is shown with it, and the user may choose Workers.
 function proposal(sim){const P0=partition(sim),np=P0.parts.length,big=Math.max(0,...P0.parts.map(q=>q.n)),n=sim.n;
  if(np<2)return {use:false,parts:np,why:'ένα υποδίκτυο: καμία γραμμή δεν χωρίζει το δίκτυο (ή τη διασχίζει έλεγχος)'};
  if(sim.var)return {use:false,parts:np,why:`${np} υποδίκτυα, αλλά μεταβλητό βήμα: τα υποδίκτυα θέλουν σταθερό`};
  return {use:false,parts:np,big,why:`${np} υποδίκτυα, το μεγαλύτερο ${big} από ${n} αγνώστους, ${P0.cuts.length} γραμμές ανάμεσά τους. Ένας λύτης: σε δύο πυρήνες οι Workers έτρεξαν τα βήματα ως 1,2 φορές ταχύτερα (big_grid 24 × 24 με κατανεμημένες γραμμές) και κάθε Worker χτίζει όλο το δίκτυο`};}
 const Split={partition,plan,attach,serial,workers,runGroup,summary,proposal,colsOf,Link,newLink,ringRows};
 if(typeof module!=='undefined'&&module.exports)module.exports=Split;
 root.Split=Split;
})(typeof self!=='undefined'?self:globalThis);
