'use strict';
// Real-time switched-circuit simulator (Modified Nodal Analysis).
//
// * Companion models: trapezoidal integration, backward Euler for the first
//   step after any topology change (removes trapezoidal ringing and is exact
//   for piecewise-constant inductor voltages).
// * Ideal-ish switches and diodes as R_on/R_off. A diode that changes state
//   inside a step is located by linear interpolation and the step is cut there,
//   so DCM boundaries are exact up to the interpolation of a linear ramp.
// * Steps never cross PWM edges, controller sampling instants or schedule
//   changes (event-aligned fixed step).
// * Everything is recorded (node voltages, element V/I/P, control signals) in a
//   ring buffer plus per-period statistics, so a probe added later still shows
//   recent history.
(function(root){
 const P=root.Parts||(typeof require!=='undefined'?require('./parts.js'):null);
 const Ex=root.Expr||(typeof require!=='undefined'?require('./expr.js'):null);
 const SC=root.StepCheck||(typeof require!=='undefined'?require('./stepcheck.js'):null);
 const SUBC=root.SubCircuit||(typeof require!=='undefined'?require('./subcircuit.js'):null);
 const NLIB=()=>root.NetLib||(typeof require!=='undefined'?require('./netlib.js'):null);
 const BUS=root.Bus||(typeof require!=='undefined'?require('./bus.js'):null);
 const SPM=root.Sparse||(typeof require!=='undefined'?require('./sparse.js'):null);
 const NNET=root.NNet||(typeof require!=='undefined'?require('./nn.js'):null);
 // 4.2 (§32): the sparse LU above this many unknowns ('auto'); below it the dense LU, as before
 const SPARSE_MIN=120;
 const UNITS=root.Units||(typeof require!=='undefined'?require('./units.js'):null);
 const GMIN=1e-9;
 // 4.7: the neural network block (nn.js). Its weights live in the state (st.net, and the moments of Adam in st.opt), so they
 // travel with snapshots and the live worker; a live change keeps what it learned unless the weights' definition changed
 // (st.wsig: the text of the weights, the layers, the seed, the start)
 function nnBuild(b,p,warnings){const st=b.st;b.clock=p.clock;b.trig=['start','mid','both'].includes(p.trig)?p.trig:'start';b.y0=num(p.y0,0);st.last=null;
  b.inNames=Ex.names(p.ins,6,false);const xs=String(p.xs??'1').split(/[,;\s]+/).filter(Boolean).map(v=>num(v,1));b.xs=b.inNames.map((k,i)=>{const v=xs.length>1?xs[i]:xs[0];return Number.isFinite(v)&&v!==0?v:1;});
  b.ys=num(p.ys,1)||1;b.ymin=num(p.ymin,-1);b.ymax=num(p.ymax,1);if(b.ymax<b.ymin)[b.ymin,b.ymax]=[b.ymax,b.ymin];
  // 4.8: the output dy = ∂y/∂(input jac), in the units of the signals (the emulator of the inverse control)
  b.jac=p.jac?b.inNames.indexOf(String(p.jac).trim()):-1;b.share=String(p.share??'').trim();if(p.jac&&b.jac<0)warnings.push(`${b.label}: η είσοδος «${p.jac}» για την παράγωγο δεν υπάρχει.`);
  b.train=p.train==='err'||p.train==='tgt'?p.train:'off';b.learn=p.learn!==false&&p.learn!=='false';b.opt=p.opt==='sgd'?'sgd':'adam';b.lr=Math.max(0,num(p.lr,1e-3));b.clip=Math.max(0,num(p.clip,5));b.l2=Math.max(0,num(p.l2,0));b.nl=Math.max(1,num(p.nl,200));
  const sizes=NNET.sizesOf(b.inNames.length,p.hidden??'8'),w=NNET.parse(p.w,sizes);if(w&&w.error)warnings.push(`${b.label}: ${w.error}· χρησιμοποιούνται τυχαία βάρη.`);
  const net=w&&w.net?w.net:NNET.init(sizes,num(p.seed,1)|0,p.init!=='rand');b.wsig=[String(p.w||'').length,String(p.w||'').slice(0,64),String(p.hidden),num(p.seed,1),p.init,b.inNames.length,b.opt].join('|');
  Object.assign(st,{net,opt:NNET.optState(net,b.opt),wsig:b.wsig,y:b.y0,L:0,m2:0,n:0,yraw:0,sat:false,dy:0});}
 // one sample: forward pass on the scaled inputs, output scaled and limited; learning when it is on and fz < 0.5
 // (error signal: e/ys; target: (tgt − y)/ys; not while the output sits on a limit with an error signal, as the PI's anti-windup)
 // 4.8: a copy (share) computes with the weights of its source block as they are at this sample and does not learn
 function nnStep(b,st,x,eIn,fz,src){const net=src?src.st.net:st.net,acts=NNET.fwd(net,x.map((v,i)=>v/b.xs[i])),o=acts[acts.length-1][0],y=b.ys*o,yl=Math.min(b.ymax,Math.max(b.ymin,y));
  if(b.jac>=0){const d=b.ys*NNET.jac(net,acts,b.jac)/b.xs[b.jac];st.dy=Number.isFinite(d)?d:0;}  // before this sample's learning step
  if(b.train!=='off'&&!src){const e=b.train==='err'?eIn/b.ys:(eIn-y)/b.ys;st.n++;st.m2+=(e*e-st.m2)/Math.min(st.n,b.nl);st.L=Math.abs(b.ys)*Math.sqrt(Math.max(0,st.m2));
   if(b.learn&&!(fz>=.5)&&b.lr>0&&Number.isFinite(e)&&!(b.train==='err'&&st.sat))NNET.learn(st.net,st.opt,acts,-e,{lr:b.lr,clip:b.clip,l2:b.l2,opt:b.opt});}
  st.sat=yl!==y;st.y=Number.isFinite(yl)?yl:0;st.yraw=y;}
 // 4.7: records in shared memory in a cross-origin isolated page (allocRecord)
 const shared=typeof window!=='undefined'&&typeof SharedArrayBuffer!=='undefined'&&!!root.crossOriginIsolated;
 // program t:value at t; left = the value just before t (the end of a step that lands on a jump, 3.15)
 const schedAt=(s,t,dflt,left)=>{if(!s)return dflt;let v=s[0][1];const tl=left?t-1e-15-4e-16*Math.abs(t):0;if(left?s[0][0]>=tl:t<s[0][0])return dflt;for(const [ts,val] of s){if(left?ts<tl:ts<=t+1e-15)v=val;else break;}return v;};
 const num=(v,d)=>{const x=typeof v==='number'?v:P.parseEng(v);return Number.isFinite(x)?x:d;};
 // "1, 2, 3" → N numbers (one value = the same for all)
 const numList=(s,N,d=0)=>{const a=String(s??'').split(/[,;\s]+/).filter(Boolean).map(v=>num(v,d));return Array.from({length:N},(_,k)=>a.length===1?a[0]:a[k]??d);};
 // synchronous machine (3.5): two ports a→c and b→c (no star point), with currents i_a, i_b. Port fluxes ψ_p = Kv·ψ_αβ,
 // Kv = [[3/2, √3/2], [0, √3]]; i_α = i_a, i_β = (i_a + 2·i_b)/√3. With Γ_αβ(θ) = R(θ)·diag(1/L_d, 1/L_q)·R(θ)ᵀ and the magnet
 // flux ψ₀ = ψ_m·(cos θ, sin θ): i_p = Γ_p·(ψ_p − Kv·ψ₀), Γ_p = Ki⁻¹·Γ_αβ·Kv⁻¹ (symmetric, = ⅔·Ki⁻¹·Γ_αβ·Ki⁻ᵀ)
 const SQ3=Math.sqrt(3);
 // the whole state of a run as JSON (3.16, ROADMAP §41.1): a walk over the solver's objects that keeps the data and
 // leaves out the functions; restoring walks a new solver of the same project (same structure) and writes the data back,
 // so the run continues with the same numbers. Objects met twice are kept once ($ref); typed arrays as base64 of their
 // bytes (exact); NaN, ±Infinity and −0 by name; an object with getState/setState (a Python block) keeps its own state.
 // Left out: the project (rebuilt), the LU cache and the sparse pattern (rebuilt the same) and the scope's buffers (ring, per).
 const SNAP_SKIP=new Set(['project','cache','ring','per','sp','spq','spw','rec']);   // 4.2: the sparse pattern is rebuilt the same
 const SNAP_TA={Float64Array,Float32Array,Int32Array,Uint32Array,Int16Array,Uint16Array,Int8Array,Uint8Array,Uint8ClampedArray};
 function b64of(ta){const u=new Uint8Array(ta.buffer,ta.byteOffset,ta.byteLength);if(typeof Buffer!=='undefined')return Buffer.from(u).toString('base64');
  let s='';for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s);}
 function fromB64(s,T){let u;if(typeof Buffer!=='undefined'){const b=Buffer.from(s,'base64');u=new Uint8Array(b.length);u.set(b);}
  else{const bin=atob(s);u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);}
  return new T(u.buffer,0,u.length/T.BYTES_PER_ELEMENT);}
 function snapEncode(root0){const ids=new Map();let next=0;
  const num=v=>Number.isFinite(v)?(Object.is(v,-0)?{$n:'-0'}:v):{$n:String(v)};
  function enc(v,top){if(v===undefined)return {$u:1};if(v===null||typeof v==='boolean'||typeof v==='string')return v;if(typeof v==='number')return num(v);
   if(typeof v!=='object')return undefined; // functions, symbols
   if(ids.has(v))return {$ref:ids.get(v)};const id=next++;ids.set(v,id);
   if(ArrayBuffer.isView(v)){if(!SNAP_TA[v.constructor.name])throw new NetlistError('Η κατάσταση έχει πίνακα '+v.constructor.name+' που δεν αποθηκεύεται.');return {$id:id,$ta:v.constructor.name,d:b64of(v)};}
   if(typeof v.getState==='function'&&typeof v.setState==='function')return {$id:id,$state:v.getState()};
   if(Array.isArray(v)){const a=new Array(v.length);for(let i=0;i<v.length;i++){const e=enc(v[i]);a[i]=e===undefined?{$f:1}:e;}return {$id:id,$a:a};}
   if(v instanceof Map){const m=[];for(const [k,x] of v){const ek=enc(k),ex=enc(x);if(ek!==undefined&&ex!==undefined)m.push([ek,ex]);}return {$id:id,$map:m};}
   if(v instanceof Set){const m=[];for(const x of v){const e=enc(x);if(e!==undefined)m.push(e);}return {$id:id,$set:m};}
   const o={};for(const k of Object.keys(v)){if(top&&SNAP_SKIP.has(k))continue;const e=enc(v[k]);if(e!==undefined)o[k]=e;}return {$id:id,$o:o};}
  return enc(root0,true);}
 function snapRestore(root0,snap){const refs=new Map();
  function dec(s,live,top){if(s===null||typeof s!=='object')return s;
   if('$u' in s)return undefined;if('$n' in s)return s.$n==='-0'?-0:Number(s.$n);if('$f' in s)return live;
   if('$ref' in s){if(!refs.has(s.$ref))throw new NetlistError('Χαλασμένη κατάσταση (αναφορά '+s.$ref+').');return refs.get(s.$ref);}
   if('$ta' in s){const T=SNAP_TA[s.$ta];if(!T)throw new NetlistError('Χαλασμένη κατάσταση ('+s.$ta+').');const src=fromB64(s.d,T);const out=live instanceof T&&live.length===src.length?live:new T(src.length);out.set(src);refs.set(s.$id,out);return out;}
   if('$state' in s){if(!live||typeof live.setState!=='function')throw new NetlistError('Η κατάσταση έχει μπλοκ κώδικα που δεν υπάρχει πια στο κύκλωμα.');live.setState(s.$state);refs.set(s.$id,live);return live;}
   if('$a' in s){const out=Array.isArray(live)?live:[];refs.set(s.$id,out);const prev=out.slice();out.length=s.$a.length;for(let i=0;i<s.$a.length;i++)out[i]=dec(s.$a[i],prev[i]);return out;}
   if('$map' in s){const out=live instanceof Map?live:new Map();refs.set(s.$id,out);const old=new Map(out);out.clear();for(const [ek,ex] of s.$map){const k=dec(ek,undefined);out.set(k,dec(ex,old.get(k)));}return out;}
   if('$set' in s){const out=live instanceof Set?live:new Set();refs.set(s.$id,out);out.clear();for(const e of s.$set)out.add(dec(e,undefined));return out;}
   const out=live&&typeof live==='object'&&!Array.isArray(live)&&!ArrayBuffer.isView(live)&&!(live instanceof Map)&&!(live instanceof Set)?live:{};refs.set(s.$id,out);
   for(const k of Object.keys(s.$o)){if(top&&SNAP_SKIP.has(k))continue;out[k]=dec(s.$o[k],out[k]);}return out;}
  dec(snap,root0,true);}
 function smPort(m,th){const c=Math.cos(th),s=Math.sin(th),gd=1/m.Ld,gq=1/m.Lq,g00=c*c*gd+s*s*gq,g01=c*s*(gd-gq),g11=s*s*gd+c*c*gq;
  const a10=-g00/2+SQ3/2*g01,a11=-g01/2+SQ3/2*g11,pa=m.psim*c,pb=m.psim*s;
  return {G:[g00*2/3,-g00/3+g01/SQ3,a10*2/3,-a10/3+a11/SQ3],p0:[1.5*pa+SQ3/2*pb,SQ3*pb]};}
 // α, β flux and current, torque and d, q currents of a machine from its port fluxes and currents
 function smOut(m,psi,i,th){const pa=(2*psi[0]-psi[1])/3,pb=psi[1]/SQ3,ia=i[0],ib=(i[0]+2*i[1])/SQ3,c=Math.cos(th),s=Math.sin(th);
  return {te:1.5*m.p*(pa*ib-pb*ia),id:c*ia+s*ib,iq:-s*ia+c*ib,pa,pb};}

 // generator state (4.3): masses' angles and speeds as arrays, the rest numbers
 const genCopy=st=>({...st,ph:st.ph.slice(),w:st.w.slice(),wo:st.wo.slice(),ts:st.ts.slice()});
 // complex dense solve (4.3): A as re/im arrays n×n, b as re/im; partial pivoting; returns [xr, xi] or null when singular
 function csolve(n,Ar,Ai,br,bi){
  for(let k=0;k<n;k++){let p=k,mx=Ar[k*n+k]**2+Ai[k*n+k]**2;for(let i=k+1;i<n;i++){const v=Ar[i*n+k]**2+Ai[i*n+k]**2;if(v>mx){mx=v;p=i;}}
   if(!(mx>0))return null;
   if(p!==k){for(let j=0;j<n;j++){let t=Ar[k*n+j];Ar[k*n+j]=Ar[p*n+j];Ar[p*n+j]=t;t=Ai[k*n+j];Ai[k*n+j]=Ai[p*n+j];Ai[p*n+j]=t;}let t=br[k];br[k]=br[p];br[p]=t;t=bi[k];bi[k]=bi[p];bi[p]=t;}
   const dr=Ar[k*n+k],di=Ai[k*n+k],dd=dr*dr+di*di;
   for(let i=k+1;i<n;i++){const ar=Ar[i*n+k],ai=Ai[i*n+k];if(!ar&&!ai)continue;const fr=(ar*dr+ai*di)/dd,fi=(ai*dr-ar*di)/dd;
    for(let j=k;j<n;j++){const xr=Ar[k*n+j],xi=Ai[k*n+j];if(!xr&&!xi)continue;Ar[i*n+j]-=fr*xr-fi*xi;Ai[i*n+j]-=fr*xi+fi*xr;}
    br[i]-=fr*br[k]-fi*bi[k];bi[i]-=fr*bi[k]+fi*br[k];}}
  const xr=new Float64Array(n),xi=new Float64Array(n);
  for(let i=n-1;i>=0;i--){let sr=br[i],si=bi[i];for(let j=i+1;j<n;j++){const ar=Ar[i*n+j],ai=Ai[i*n+j];sr-=ar*xr[j]-ai*xi[j];si-=ar*xi[j]+ai*xr[j];}
   const dr=Ar[i*n+i],di=Ai[i*n+i],dd=dr*dr+di*di;xr[i]=(sr*dr+si*di)/dd;xi[i]=(si*dr-sr*di)/dd;}
  return [xr,xi];}
 // 4.3 (§31.7): steady start from a load flow. When a generator starts from the voltage at its terminals (init 'lf') or the
 // circuit asks for it (solve.init 'ac'), the circuit is solved with phasors at the frequency of the generators (else of the first
 // AC source), each generator replaced by ideal sources |V|∠θ (sine reference, as the sources of the app) at its terminals; the
 // inductors, capacitors and coupled inductors start from these phasors at t = 0, each generator from its steady state
 // (Parts.genSteady) with its shaft twisted by the torques it carries (EMTP does the same, Dommel ch. 8). Switches as they are at
 // t = 0; lines (TL), constant-power loads and arresters are left out (they start as before). Returns a short report.
 function acInit(sim){const net=sim.net,gens=(sim.gens||[]).filter(m=>m.init==='lf'),want=gens.length>0||(sim.project?.solve?.init==='ac');
  if(!want)return null;
  let f0=gens.length?gens[0].g.f:NaN;if(!(f0>0)){const v=net.els.find(e=>e.k==='V'&&e.src?.kind==='ac');f0=v?v.src.f:50;}
  // with the trapezoidal rule at a fixed step the discrete steady state is the phasor one with ω_e = (2/h)·tan(ωh/2) in every
  // v = dψ/dt (inductors, capacitors, flux elements, the machine): the start is then exact for the step, not only for h → 0
  const w0=2*Math.PI*f0,w=sim.method==='TR'&&!sim.var&&sim.h>0?2/sim.h*Math.tan(w0*sim.h/2):w0,n0=net.size,n=n0+3*gens.length,Ar=new Float64Array(n*n),Ai=new Float64Array(n*n),br=new Float64Array(n),bi=new Float64Array(n);
  sim.values(0);sim.gateSig(0);
  // 4.10: a capacitor with an initial voltage (a cell or DC-link capacitor) keeps it as the DC part of its start: a stiff
  // source v₀ in the DC solution below (the others stay open there, as before)
  const vC0=new Map();for(const e of net.els)if(e.k==='C'&&e.v)vC0.set(e,e.v);
  const ad=(r,q,re,im)=>{if(r<0||q<0)return;Ar[r*n+q]+=re;Ai[r*n+q]+=im;};
  const y=(a,b,re,im)=>{ad(a,a,re,im);ad(b,b,re,im);ad(a,b,-re,-im);ad(b,a,-re,-im);};
  for(let i=0;i<net.nNodes;i++)ad(i,i,GMIN,0);
  const left=new Set();
  for(const e of net.els){
   switch(e.k){
    case 'G':y(e.a,e.b,1/e.Rnow,0);break;
    case 'L':y(e.a,e.b,0,-1/(w*e.L));break;
    case 'C':y(e.a,e.b,0,w*e.C);break;
    case 'S':y(e.a,e.b,e.on?1/e.Ron:1/e.Roff,0);break;
    case 'D':y(e.a,e.b,e.gk&&e.gon?1/e.Ron:1/e.Roff,0);break;
    case 'MG':for(let k=0;k<e.N;k++)for(let j=0;j<e.N;j++){const g=e.Gm[k*e.N+j],[ak,bk]=e.ports[k],[aj,bj]=e.ports[j];ad(ak,aj,g,0);ad(bk,bj,g,0);ad(ak,bj,-g,0);ad(bk,aj,-g,0);}break;
    case 'F':if(e.gen||e.sm||e.srm)break;for(let k=0;k<e.N;k++)for(let j=0;j<e.N;j++){const g=-e.Gam[k*e.N+j]/w,[ak,bk]=e.ports[k],[aj,bj]=e.ports[j];ad(ak,aj,0,g);ad(bk,bj,0,g);ad(ak,bj,0,-g);ad(bk,aj,0,-g);}break;
    case 'V':{const r=e.row;ad(e.a,r,1,0);ad(r,e.a,1,0);ad(e.b,r,-1,0);ad(r,e.b,-1,0);
     const s=e.src;if(!e.gen&&!(e.sigIn>=0)&&s&&s.kind==='ac'&&Math.abs(s.f-f0)<=1e-6*f0){br[r]=s.Vpk*Math.cos(s.ph-Math.PI/2);bi[r]=s.Vpk*Math.sin(s.ph-Math.PI/2);}break;}
    case 'X':{const r=e.row,N=e.n;ad(e.s1,r,1,0);ad(r,e.s1,1,0);ad(e.s2,r,-1,0);ad(r,e.s2,-1,0);ad(e.p1,r,-N,0);ad(r,e.p1,-N,0);ad(e.p2,r,N,0);ad(r,e.p2,N,0);break;}
    // 4.10: an arm at t = 0 as its cells' insertion states give it: with every cell bypassed (s = 0) the arm resistance only
    case 'CHB':{const r=e.row;ad(e.a,r,1,0);ad(r,e.a,1,0);ad(e.b,r,-1,0);ad(r,e.b,-1,0);ad(r,r,-e.Rarm,0);if(e.s.some(q=>q))left.add('CHB');break;}
    case 'GY':{const r=e.row,Y=e.psi;ad(e.a,r,1,0);ad(r,e.a,1,0);ad(e.b,r,-1,0);ad(r,e.b,-1,0);ad(r,e.m,-Y,0);ad(e.m,r,-Y,0);break;}
    case 'NL':if(e.arc&&e.arc.closed){y(e.a,e.b,1/e.arc.Ron,0);break;}left.add(e.k);break;
    case 'TL':{// 4.9: a distributed line at ω₀ as its exact two-port (lossless; R adds only a small start transient)
     const th=w0*e.tau,y11=-1/(e.Z*Math.tan(th)),y12=1/(e.Z*Math.sin(th)),P=[[e.a1,e.b1],[e.a2,e.b2]];
     for(let k=0;k<2;k++)for(let j=0;j<2;j++){const g=k===j?y11:y12,[ak,bk]=P[k],[aj,bj]=P[j];ad(ak,aj,0,g);ad(bk,bj,0,g);ad(ak,bj,0,-g);ad(bk,aj,0,-g);}break;}
    case 'TLM':case 'CPL':left.add(e.k);break;
   }
  }
  gens.forEach((m,q)=>{const Vp=m.V0*m.g.Un*Math.SQRT2/Math.sqrt(3);
   for(let k=0;k<3;k++){const r=n0+3*q+k,a=m.ang0-Math.PI/2-k*2*Math.PI/3;ad(m.term[k],r,1,0);ad(r,m.term[k],1,0);ad(m.nN,r,-1,0);ad(r,m.nN,-1,0);br[r]=Vp*Math.cos(a);bi[r]=Vp*Math.sin(a);}});
  const sol=csolve(n,Ar,Ai,br,bi);if(!sol){net.warnings.push('Αρχικοποίηση από ροή φορτίου: το κύκλωμα δεν λύνεται με φασιθέτες· ξεκινά από μηδέν.');return null;}
  const [xr,xi]=sol,Vr=i=>i<0?0:xr[i],Vi=i=>i<0?0:xi[i];
  // 4.8.1: BDF2 also needs the step before t = 0 (i, v, ψ at −h, from the same phasors) and starts with h/h_last = 1, so
  // that the first step is not a backward-Euler one (which leaves a start transient of the order of h)
  const bdf=sim.method==='BDF2'&&!sim.var&&sim.h>0,cb=Math.cos(w0*sim.h),sb=Math.sin(w0*sim.h);
  for(const e of net.els){
   if(e.k==='L'){const dr=Vr(e.a)-Vr(e.b),di=Vi(e.a)-Vi(e.b);e.i=di/(w*e.L);e.i1=bdf?(di*cb-dr*sb)/(w*e.L):e.i;}
   else if(e.k==='C'){const dr=Vr(e.a)-Vr(e.b),di=Vi(e.a)-Vi(e.b);e.v=dr;e.v1=bdf?dr*cb+di*sb:dr;e.i=-w*e.C*di;}
   else if(e.k==='F'&&!e.gen&&!e.sm&&!e.srm){const N=e.N;for(let k=0;k<N;k++){const [a,b]=e.ports[k];e.psi[k]=(Vi(a)-Vi(b))/w;}e.psi1.set(e.psi);
    if(bdf)for(let k=0;k<N;k++){const [a,b]=e.ports[k];e.psi1[k]=((Vi(a)-Vi(b))*cb-(Vr(a)-Vr(b))*sb)/w;}
    for(let k=0;k<N;k++){let s=0;for(let j=0;j<N;j++)s+=e.Gam[k*N+j]*e.psi[j];e.i[k]=s;}}
   else if(e.k==='TL')tlSteady(e,w0,sim.h,[Vr(e.a1)-Vr(e.b1),Vi(e.a1)-Vi(e.b1)],[Vr(e.a2)-Vr(e.b2),Vi(e.a2)-Vi(e.b2)]);}
  // each generator: positive sequence of the terminal phasors, the voltage behind R_a, the steady state, the twisted shaft
  const A=[Math.cos(2*Math.PI/3),Math.sin(2*Math.PI/3)],cm=(a,b)=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]];
  const rep=[];
  gens.forEach((m,q)=>{const g=m.g,ph=[],cur=[];for(let k=0;k<3;k++){ph.push([Vr(m.term[k])-Vr(m.nN),Vi(m.term[k])-Vi(m.nN)]);cur.push([xr[n0+3*q+k],xi[n0+3*q+k]]);}
   const seq=z=>{const a1=cm(A,z[1]),a2=cm(cm(A,A),z[2]);return [(z[0][0]+a1[0]+a2[0])/3,(z[0][1]+a1[1]+a2[1])/3];};
   const V1=seq(ph),I1=seq(cur),Vp=[V1[0]-g.Ra*g.Zb*I1[0],V1[1]-g.Ra*g.Zb*I1[1]],ss=P.genSteady(g,Vp,I1,w);
   const F=m.F;F.psi.set(ss.psi);F.psi1.set(ss.psi);
   if(bdf){   // the stator fluxes one step back (a rotation by ω·h of their space vector); the rotor's are constant
    const al=(2*ss.psi[0]-ss.psi[1]-ss.psi[2])/3,be=(ss.psi[1]-ss.psi[2])/Math.sqrt(3),z0=(ss.psi[0]+ss.psi[1]+ss.psi[2])/3;
    const a1=al*cb+be*sb,b1=-al*sb+be*cb;F.psi1[0]=z0+a1;F.psi1[1]=z0-a1/2+Math.sqrt(3)/2*b1;F.psi1[2]=z0-a1/2-Math.sqrt(3)/2*b1;}P.genGamma(g,ss.th,F.Gnow);for(let k=0;k<g.N;k++){let s=0;for(let j=0;j<g.N;j++)s+=F.Gnow[k*g.N+j]*F.psi[j];F.i[k]=s;}
   const sh=g.sh,Tm=-ss.Te,ext=sh.fr.map(x=>x*Tm);ext[sh.gm]+=ss.Te;const phi=new Array(sh.N).fill(0);let S=0;
   for(let i=0;i<sh.N-1;i++){S+=ext[i];phi[i+1]=phi[i]-S/sh.K[i];}
   const off=ss.th-phi[sh.gm],st=m.st;for(let i=0;i<sh.N;i++){st.ph[i]=phi[i]+off;st.w[i]=1;st.wo[i]=1;}for(let i=0;i<sh.N-1;i++)st.ts[i]=sh.K[i]*(st.ph[i]-st.ph[i+1]);
   m.Efd0=ss.Efd;m.Tm0=Tm;rep.push({id:F.cid,Efd:ss.Efd,Tm,P:-(V1[0]*I1[0]+V1[1]*I1[1])*1.5/g.Sn,Q:-(V1[1]*I1[0]-V1[0]*I1[1])*1.5/g.Sn,delta:ss.th});
   if(!(ss.Efd>0))net.warnings.push(`${F.cid}: η μόνιμη κατάσταση θέλει E_fd ≤ 0 (υποδιέγερση πέρα από το όριο)· έλεγξε τάση και ισχύ.`);});
  // the DC part (field circuits, DC sources): inductors and flux ports as near-shorts (10⁻⁹ of their reactance, so that
  // loops of inductors and ideal transformers stay solvable), capacitors open; the start vector of the circuit is DC + the
  // real part of the phasors (the voltage of an inductive node is not defined by the vanishing-step start of initialSolve)
  const Dr=new Float64Array(n0*n0),Di=new Float64Array(n0*n0),dr=new Float64Array(n0),di=new Float64Array(n0);
  const dad=(r,q,v)=>{if(r>=0&&q>=0)Dr[r*n0+q]+=v;},dy=(a,b,g)=>{dad(a,a,g);dad(b,b,g);dad(a,b,-g);dad(b,a,-g);},gs=x=>1/(1e-9*w0*x);
  const sh=[];for(const e of net.els){if(e.k==='L')sh.push([e,-1,e.a,e.b,gs(e.L)]);else if(e.k==='F'&&!e.sm&&!e.srm){const G=e.gen?e.Gnow:e.Gam;for(let k=0;k<e.N;k++)sh.push([e,k,e.ports[k][0],e.ports[k][1],gs(1/G[k*e.N+k])]);}}
  for(let i=0;i<net.nNodes;i++)dad(i,i,GMIN);
  for(const e of net.els){switch(e.k){
   case 'G':dy(e.a,e.b,1/e.Rnow);break;case 'S':dy(e.a,e.b,e.on?1/e.Ron:1/e.Roff);break;case 'D':dy(e.a,e.b,e.gk&&e.gon?1/e.Ron:1/e.Roff);break;
   case 'MG':for(let k=0;k<e.N;k++)for(let j=0;j<e.N;j++){const g=e.Gm[k*e.N+j],[ak,bk]=e.ports[k],[aj,bj]=e.ports[j];dad(ak,aj,g);dad(bk,bj,g);dad(ak,bj,-g);dad(bk,aj,-g);}break;
   case 'V':{const r=e.row;dad(e.a,r,1);dad(r,e.a,1);dad(e.b,r,-1);dad(r,e.b,-1);const q=e.src;
    dr[r]=e.gen?sim.genEfd(e.gen,0)*e.gen.g.vfK:e.sigIn>=0?0:q&&q.kind==='dc'?e.Vnow:q&&q.kind==='ac'?(q.off||0):0;break;}
   case 'I':if(!(e.sigIn>=0)&&!e.wave){if(e.a>=0)dr[e.a]-=e.Inow;if(e.b>=0)dr[e.b]+=e.Inow;}break;
   case 'X':{const r=e.row,N=e.n;dad(e.s1,r,1);dad(r,e.s1,1);dad(e.s2,r,-1);dad(r,e.s2,-1);dad(e.p1,r,-N);dad(r,e.p1,-N);dad(e.p2,r,N);dad(r,e.p2,N);break;}
   case 'GY':{const r=e.row,Y=e.psi;dad(e.a,r,1);dad(r,e.a,1);dad(e.b,r,-1);dad(r,e.b,-1);dad(r,e.m,-Y);dad(e.m,r,-Y);break;}
   case 'CHB':{const r=e.row;dad(e.a,r,1);dad(r,e.a,1);dad(e.b,r,-1);dad(r,e.b,-1);dad(r,r,-e.Rarm);break;}}}
  for(const [,,a,b,g] of sh)dy(a,b,g);
  for(const [e,v] of vC0){const g=1e9*w0*e.C;dy(e.a,e.b,g);if(e.a>=0)dr[e.a]+=g*v;if(e.b>=0)dr[e.b]-=g*v;}
  const dsol=csolve(n0,Dr,Di,dr,di),x0=new Float64Array(n0),Xd=dsol?dsol[0]:new Float64Array(n0);
  if(!dsol)net.warnings.push('Αρχικοποίηση από ροή φορτίου: το μέρος DC δεν λύνεται· οι πηγές DC ξεκινούν από μηδέν.');
  for(let i=0;i<n0;i++)x0[i]=xr[i]+Xd[i];
  for(const [e,k,a,b,g] of sh){if(e.gen)continue;const I=g*((a<0?0:Xd[a])-(b<0?0:Xd[b]));if(k<0){e.i+=I;e.i1=bdf?e.i1+I:e.i;}else e.i[k]+=I;}   // the DC part: the same in the step before
  for(const e of net.els)if(e.k==='F'&&!e.gen&&!e.sm&&!e.srm&&e.Lm){const N=e.N;for(let k=0;k<N;k++){let s=0;for(let j=0;j<N;j++)s+=e.Lm[k*N+j]*e.i[j];if(bdf)e.psi1[k]+=s-e.psi[k];e.psi[k]=s;}if(!bdf)e.psi1.set(e.psi);}
  // a generator's stator ports: the voltage behind R_a (the phasor solution had the machine replaced by sources)
  gens.forEach((m,q)=>{for(let k=0;k<3;k++){const pn=m.F.ports[k][0];if(pn!==m.term[k])x0[pn]=xr[m.term[k]]-m.g.Ra*m.g.Zb*xr[n0+3*q+k];}});
  for(const e of vC0.keys()){const d=(e.a<0?0:Xd[e.a])-(e.b<0?0:Xd[e.b]);e.v+=d;e.v1+=d;}
  for(const e of net.els)if(e.k==='CHB')e.i=x0[e.row];
  if(left.has('CHB'))net.warnings.push('Αρχικοποίηση από ροή φορτίου: οι αρθρωτοί βραχίονες μπαίνουν στη λύση με φασιθέτες σε παράκαμψη (R_arm), όχι με τις υπομονάδες που έχουν μέσα στο t = 0.');
  if(left.has('TLM'))net.warnings.push('Αρχικοποίηση από ροή φορτίου: οι γραμμές από γεωμετρία (CP/FD) ξεκινούν χωρίς φορτίο.');
  if(left.has('TL'))net.warnings.push('Αρχικοποίηση από ροή φορτίου: οι γραμμές με κατανεμημένες παραμέτρους (Bergeron) ξεκινούν χωρίς φορτίο.');
  if(left.has('CPL')||left.has('NL'))net.warnings.push('Αρχικοποίηση από ροή φορτίου: τα φορτία σταθερής ισχύος και τα αλεξικέραυνα μένουν έξω από τη λύση με φασιθέτες.');
  if(bdf)sim.hLast=sim.h;
  sim.lfInit=rep;sim.acPh={w,w0,xr:xr.slice(0,n0),xi:xi.slice(0,n0),xd:Xd.slice(0,n0)};return x0;}
 class NetlistError extends Error{}

 // ---------------------------------------------------------------- netlist
 // spark gap with a volt–time curve (3.11): disruptive effect D = ∫ (|v| − U₀)^k dt over the time |v| > U₀ (k = 0: time lag, k = 1: equal area).
 // ∫₀^θ max(0, |v(s)| − U₀)^k ds for v linear from v0 (s = 0) to v1 (s = 1), in closed form piece by piece
 function dePiece(x0,x1,s0,s1,up,U0,k){const w=Math.min(s1,up)-s0;if(w<=0)return 0;const b=(x1-x0)/((s1-s0)||1),a=x0-U0;
  if(b===0)return a>0?Math.pow(a,k)*w:0;let lo=0,hi=w;const r=-a/b;if(b>0)lo=Math.max(0,r);else hi=Math.min(w,r);if(hi<=lo)return 0;
  const F=u=>Math.pow(Math.max(0,a+b*u),k+1);return (F(hi)-F(lo))/((k+1)*b);}
 function deInt(v0,v1,th,U0,k){if(v0*v1<0){const sc=v0/(v0-v1);return dePiece(Math.abs(v0),0,0,sc,th,U0,k)+dePiece(0,Math.abs(v1),sc,1,th,U0,k);}return dePiece(Math.abs(v0),Math.abs(v1),0,1,th,U0,k);}
 // the fraction θ of the step where the accumulated effect reaches D (bisection; the integral grows with θ)
 function deFrac(v0,v1,need,U0,k){let lo=0,hi=1;for(let i=0;i<50;i++){const m=(lo+hi)/2;if(deInt(v0,v1,m,U0,k)<need)lo=m;else hi=m;}return hi;}
 // line element (3.8; losses and sections 3.11): N sections of τ/N, each with R/N lumped as R/4 at its ends and R/2 inside (Dommel),
 // which gives Z_e = Z + R/(4N) and h = (Z − R/(4N))/(Z + R/(4N)); lossless when R = 0 (h = 1)
 // 4.9: the history of a distributed line in a sinusoidal steady state (phasors of the end voltages, ω₀): junction
 // voltages and section currents from the lossless line equations, sampled every h from −(τ/N + 3h) to 0, so that a
 // start from a load flow (solve.init 'ac') carries the line energized (e.g. the line side of a short-line fault)
 function tlSteady(e,w0,h,V1,V2){const N=e.N,Z=e.Z,th=w0*e.tau,mul=(a,b)=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]];
  const y11=[0,-1/(Z*Math.tan(th))],y12=[0,1/(Z*Math.sin(th))],I1a=mul(y11,V1),I1b=mul(y12,V2),I1=[I1a[0]+I1b[0],I1a[1]+I1b[1]];
  const at=x=>{const c=Math.cos(th*x),sn=Math.sin(th*x);return {v:[V1[0]*c+Z*I1[1]*sn,V1[1]*c-Z*I1[0]*sn],i:[I1[0]*c+V1[1]/Z*sn,I1[1]*c-V1[0]/Z*sn]};};
  const J=Array.from({length:N+1},(_,k)=>at(k/N)),H=e.H,C=H.c,n=Math.max(4,Math.ceil(e.ts/h)+3);H.t.length=0;for(const c of C)c.length=0;
  const re=(z,t)=>z[0]*Math.cos(w0*t)-z[1]*Math.sin(w0*t);
  for(let q=n;q>=0;q--){const t=-q*h;H.t.push(t);for(let k=0;k<=N;k++)C[k].push(re(J[k].v,t));
   for(let j=0;j<N;j++){C[N+1+j].push(re(J[j].i,t));C[2*N+1+j].push(-re(J[j+1].i,t));}}
  H.s=0;H.cut=0;e.iE[0]=C[N+1][n];e.iE[1]=C[3*N][n];}
 function tlElement(o,g){const N=g.N||1,R=g.R||0,r=R/(4*N),Ze=g.Z+r;
  return {k:'TL',...o,Z:g.Z,tau:g.tau,N,Rl:R,ts:g.tau/N,Ze,hh:(g.Z-r)/Ze,Ih:[0,0],IhS:new Float64Array(2*N),q:new Float64Array(3*N+1),iE:new Float64Array(2),
   H:{t:[],c:Array.from({length:3*N+1},()=>[]),s:0,cut:0}};}
 // line from geometry (4.4, ROADMAP §26): M modes, each a line in its own frame, phases ↔ modes by a constant real T_i
 // (v_mode = T_iᵀ·v, i = T_i·i_mode). CP: per mode Z_e = Z_c + R/4 and the history of Dommel (as 'TL' with one section).
 // FD (J. Marti): per mode Z_c(s) = d + Σ k/(s + p) and A(s) = e^(−sτ)·Σ c/(s + q), recursive convolutions that are exact
 // for inputs linear over the step; at each end i = (v − h_z − b)/Z_eq with b = A ⊛ f of the other end, f = v + Z_c ⊛ i.
 function tlmElement(o,n1,n2,g){const M=g.M,Ti=new Float64Array(M*M);for(let r=0;r<M;r++)for(let k=0;k<M;k++)Ti[r*M+k]=g.Ti[r][k];
  // 4.11: CP without distortion (cpline §1.2.3, Dommel §4.2.2.4): lossless with every arriving wave times e^(−R/2Z_c)
  const modes=g.modes.map(q=>{if(g.type!=='fd'){const Zc=+q.Zc,R=Math.max(0,+q.R||0);if(q.dl)return {cp:true,Zc,R,tau:+q.tau,Ze:Zc,hh:1,att:Math.exp(-R/(2*Zc))};
    const r=R/4,Ze=Zc+r;return {cp:true,Zc,R,tau:+q.tau,Ze,hh:(Zc-r)/Ze,att:1};}
   const z=q.zc,a=q.a,F=v=>Float64Array.from(v.map(Number));
   return {fd:true,tau:+q.tau,d:+z.d,kr:F(z.r),kp:F(z.p),ar:F(a.r),ap:F(a.p),z1:new Float64Array(z.r.length),z2:new Float64Array(z.r.length),
    y1:new Float64Array(a.r.length),y2:new Float64Array(a.r.length),i1:0,i2:0,u:new Float64Array(4),Zeq:+z.d,hz1:0,hz2:0,b1:0,b2:0};});
  const nc=g.type==='fd'?2:4;
  // 4.11: trapped charge: the line at rest with the dc voltages V₀ on its conductors (v_mode = T_iᵀ·V₀, no current) before t = 0;
  // the FD propagation states at their dc values c/q·f (Z_c ⊛ i = 0)
  let vm0=null;if(o.vtrap&&o.vtrap.some(v=>v)){vm0=new Float64Array(M);for(let k=0;k<M;k++){let s=0;for(let r=0;r<M;r++)s+=Ti[r*M+k]*(o.vtrap[r]||0);vm0[k]=s;}
   modes.forEach((m,k)=>{if(m.fd)for(let i=0;i<m.ap.length;i++){m.y1[i]=m.y2[i]=m.ar[i]/m.ap[i]*vm0[k];}});}
  delete o.vtrap;
  return {k:'TLM',...o,M,n1,n2,vm0,p1:n1.map(a=>[a,-1]),p2:n2.map(a=>[a,-1]),Ti,fd:g.type==='fd',modes,tauMin:Math.min(...modes.map(m=>m.tau)),tauMax:Math.max(...modes.map(m=>m.tau)),
   Gp:new Float64Array(M*M),gH:NaN,Ihm:new Float64Array(2*M),Ih:new Float64Array(2*M),iE:new Float64Array(2*M),vm:new Float64Array(2*M),q:new Float64Array(nc*M),
   H:{t:[],c:Array.from({length:nc*M},()=>[]),s:0,cut:0}};}
 // 4.11: the nominal π of a line from geometry in N equal sections (Dommel §4.2.2.1): per section the coupled series R (a
 // conductance matrix R⁻¹, or resistors when R is diagonal) and L (a flux element), and at each end of it the halves of the
 // shunt C and G as capacitors and resistors to ground and between the phases (row sums and −C_ik). A 0 V source at every
 // end gives the currents into the line (the ports of the part); it starts from the steady state like any RLC network.
 function piLine(c,n1,n2,g,{add,internal,row}){const M=g.M,N=Math.max(1,Math.min(200,Math.round(+g.N||1))),sc=(A,k)=>A.map(r=>r.map(v=>+v*k));
  const R=sc(g.R,1/N),L=sc(g.L,1/N),C=sc(g.C,1/(2*N)),G=sc(g.G,1/(2*N)),Gam=P.matInv(L),diagR=R.every((r,i)=>r.every((v,j)=>i===j||Math.abs(v)<=1e-12*Math.abs(R[i][i])));
  if(!Gam)throw new NetlistError(`${c.label||c.id}: ο πίνακας L του π δεν αντιστρέφεται.`);const GR=diagR?null:P.matInv(R);
  const vs=[],ends=(ns,tag)=>ns.map((a,k)=>{const b=internal();vs.push(add({k:'V',a,b,row:row(),src:{kind:'dc',V:0},key:c.id+'#'+tag+k}));return b;});
  const e1=ends(n1,'i1_'),e2=ends(n2,'i2_');
  const shunt=(ns,tag)=>{for(let i=0;i<M;i++){let cs=0,gs=0;for(let j=0;j<M;j++){cs+=C[i][j];gs+=G[i][j];if(j>i){if(C[i][j]<0)add({k:'C',a:ns[i],b:ns[j],C:-C[i][j],v:0,i:0,key:c.id+tag+i+'_'+j});if(G[i][j]<0)add({k:'G',a:ns[i],b:ns[j],R:-1/G[i][j]});}}
    if(cs>0)add({k:'C',a:ns[i],b:-1,C:cs,v:0,i:0,key:c.id+tag+i});if(gs>0)add({k:'G',a:ns[i],b:-1,R:1/gs});}};
  let left=e1;for(let s=0;s<N;s++){const right=s===N-1?e2:n1.map(()=>internal()),mid=n1.map(()=>internal());shunt(left,'#cl'+s+'_');
   if(diagR)for(let k=0;k<M;k++)add({k:'G',a:left[k],b:mid[k],R:Math.max(R[k][k],1e-9)});else add({k:'MG',ports:left.map((a,k)=>[a,mid[k]]),N:M,Gm:GR.flat()});
   add({k:'F',ports:mid.map((a,k)=>[a,right[k]]),N:M,Lm:L.flat(),Gam:Gam.flat(),Gnow:Gam.flat(),psi:new Float64Array(M),psi1:new Float64Array(M),i:new Float64Array(M),key:c.id+'#L'+s});
   shunt(right,'#cr'+s+'_');left=right;}
  return {k:'PIL',vs,M};}
 // (E = e^(−ph), a₀ = ∫₀ʰ e^(−ps) ds, a₁/h = ∫₀ʰ s·e^(−ps) ds / h) of one real pole p over a step h, without cancellation for small ph
 function rcCoef(p,h){const x=p*h;if(x<1e-4){const x2=x*x;return [Math.exp(-x),h*(1-x/2+x2/6-x*x2/24),h*(0.5-x/3+x2/8-x*x2/30)];}
  const E=Math.exp(-x),em=-Math.expm1(-x);return [E,em/p,(em-x*E)/(p*x)];}
 // 4.9 (ROADMAP §31, THEORY §Arc): one section of a black-box arc, dg/dt = (g^λ·u²/Π − g)/τ with τ = τ₀·g^α and
 // Π = (P₀ + P₁·g·u²)·g^β (Mayr: λ = 2, Π = P₀· Cassie: λ = 1, Π = U_c²· improved Mayr: P₁· Schwarz: α, β· a section of the
 // three-Mayr model: λ = 1,4, 1,9, 2). The state is x = ln g: dx/dt = F = (q − 1)/τ, q = g^(λ−1)·u²/Π.
 function arcF(A,x,u){const g=Math.exp(x),u2=u*u,tau=A.tau0*(A.alpha?Math.exp(A.alpha*x):1),pb=A.beta?Math.exp(A.beta*x):1,D=A.P0+A.P1*g*u2,
  gl=Math.exp((A.lam-1)*x),q=gl*u2/(D*pb),F=(q-1)/tau;
  const dqx=q*((A.lam-1)-A.beta-(D>0?A.P1*g*u2/D:0)),dqu=D>0?gl*2*u*A.P0/(pb*D*D):0;
  return {F,dx:dqx/tau-A.alpha*(q-1)/tau,du:dqu/tau};}
 // x at the end of the step for the trial voltage v: x₁ = x₀ + h·(θ·F(x₁, v) + (1 − θ)·F(x₀, u₀)), θ = ½ (trapezoidal) or 1,
 // by Newton on x₁ (from the last iterate of the same step); dx₁/dv for the linearization of i = e^x₁·v
 function arcStep(A,v){if(!(A.h>0))return {x:A.x,d:0};const h=A.h,th=A.th,lo=A.xmin,hi=A.xmax;
  let x=A.xg!=null?A.xg:Math.min(hi,Math.max(lo,A.x+h*A.F0)),f=null,dR=1,clamped=false;
  for(let it=0;it<80;it++){f=arcF(A,x,v);const R=x-A.x-h*(th*f.F+(1-th)*A.F0);dR=1-h*th*f.dx;
   let st=dR>0.05?-R/dR:-R/Math.max(Math.abs(dR),1);if(st>2)st=2;else if(st<-2)st=-2;
   const xn=Math.min(hi,Math.max(lo,x+st));clamped=xn===lo||xn===hi;const dx=Math.abs(xn-x);x=xn;if(dx<1e-13*(1+Math.abs(x)))break;}
  A.xg=x;f=arcF(A,x,v);dR=1-h*th*f.dx;
  return {x,d:clamped||!(dR>0.05)?0:h*th*f.du/dR};}
 function arcCur(e,v){const A=e.arc;if(A.closed)return {i:v/A.Ron,g:1/A.Ron};const r=arcStep(A,v),g=Math.exp(r.x),gd=g+v*g*r.d;
  return {i:g*v,g:Number.isFinite(gd)&&gd>0?gd:g};}
 // 4.9.1 (ROADMAP §52): the fast implementations of the arrester and the tower footing.
 // G·x + J + f(x) = 0 with f odd and increasing (a table of the nonlinear resistance): Newton with the voltage limited on the
 // steep part, as the circuit's own Newton does (the voltage that gives the linearized current on the true curve)
 function nlLimit(ch,q,x,xn){if(Math.abs(xn)>Math.abs(x)&&q.g>0){const il=q.i+q.g*(xn-x);if(Math.sign(il)===Math.sign(xn)){const xi=ch.inv(il);if(Math.abs(xi)<Math.abs(xn))return xi;}}return xn;}
 function nlSolve(G,J,ch,x){for(let it=0;it<200;it++){const q=ch.cur(x),f=G*x+J+q.i,d=G+q.g;const xn=nlLimit(ch,q,x,x-f/d);
   if(Math.abs(xn-x)<=1e-13*(1+Math.abs(xn)))return xn;x=xn;}return x;}
 // the IEEE arrester as one two-terminal element (SAIX): a → L₀ ∥ R₀ → n0 → L₁ ∥ R₁ → n1, C and A0 from n0, A1 from n1 to b.
 // Over a step the inductors and the capacitor are companions (the same rules as the L and C of the circuit: TR, BE, BDF2),
 // so for a terminal voltage v the inner voltages u0, u1 solve two KCL equations (with the G_min every node of the circuit has,
 // so that both implementations give the same numbers); Newton on (u0, u1) with the limit above.
 // i = G₀·(v − u0) + J₀ and di/dv = G₀·(1 + G₀·J₂₂/det) from the same Jacobian.
 function saiSetup(S,h,mode,B){S.h=h;const tr=mode==='TR',bd=mode==='BDF2'&&B;
  const Lc=(L,i,i1,vL)=>bd?[h/(L*B.a0),-(B.a1*i+B.a2*i1)/B.a0]:tr?[h/(2*L),i+h/(2*L)*vL]:[h/L,i];
  [S.g0,S.J0]=Lc(S.L0,S.iL0,S.iL0b,S.v-S.u0);[S.g1,S.J1]=Lc(S.L1,S.iL1,S.iL1b,S.u0-S.u1);
  if(bd){S.gC=S.C*B.a0/h;S.JC=S.C*(B.a1*S.vc+B.a2*S.vc1)/h;}else if(tr){S.gC=2*S.C/h;S.JC=-(S.gC*S.vc+S.ic);}else{S.gC=S.C/h;S.JC=-S.gC*S.vc;}
  S.G0=S.g0+1/S.R0;S.G1=S.g1+1/S.R1;S.ug=null;}
 function saiCur(S,v){if(!(S.h>0)){const a=S.ch0.cur(v),b=S.ch1.cur(v);return {i:S.i,g:a.g+b.g+1e-12};}
  const G0=S.G0,G1=S.G1,gC=S.gC;let u0=S.ug?S.ug[0]:S.u0,u1=S.ug?S.ug[1]:S.u1,a,b;
  for(let it=0;it<200;it++){a=S.ch0.cur(u0);b=S.ch1.cur(u1);
   const i1=G1*(u0-u1)+S.J1,F1=G0*(v-u0)+S.J0-i1-(gC+GMIN)*u0-S.JC-a.i,F2=i1-b.i-GMIN*u1,J11=-G0-G1-gC-GMIN-a.g,J22=-G1-GMIN-b.g,det=J11*J22-G1*G1;
   const n0=nlLimit(S.ch0,a,u0,u0-(F1*J22-G1*F2)/det),n1=nlLimit(S.ch1,b,u1,u1-(J11*F2-G1*F1)/det);
   const done=Math.abs(n0-u0)<=1e-13*(1+Math.abs(n0))&&Math.abs(n1-u1)<=1e-13*(1+Math.abs(n1));u0=n0;u1=n1;if(done)break;}
  a=S.ch0.cur(u0);b=S.ch1.cur(u1);const J22=-G1-GMIN-b.g,det=(-G0-G1-gC-GMIN-a.g)*J22-G1*G1,g=G0*(1+G0*J22/det);
  S.ug=[u0,u1];return {i:G0*(v-u0)+S.J0,g:g>0?g:1e-12};}
 function saiCommit(S,v){const q=saiCur(S,v),u0=S.ug[0],u1=S.ug[1];
  S.iL0b=S.iL0;S.iL0=S.g0*(v-u0)+S.J0;S.iL1b=S.iL1;S.iL1=S.g1*(u0-u1)+S.J1;S.ic=S.gC*u0+S.JC;S.vc1=S.vc;S.vc=u0;S.v=v;S.u0=u0;S.u1=u1;S.i=q.i;S.h=0;S.ug=null;}
 const SAI_ST=['iL0','iL0b','iL1','iL1b','vc','vc1','ic','v','u0','u1','i'];
 // a fast footing (RFX) gets its tower line; its foot node must join only the end 2 of that line (a2, with b2 at ground) and
 // the footing, and its other end must be at ground (directly or through an ammeter): then the foot voltage of a step depends
 // only on the line's history, and the footing is solved there, before the circuit (values)
 // 4.10 (§50): the cascaded arm for a step h. Cell k, inserted with s_k ∈ {−1, 0, +1} (0, +1 for half bridges), has
 // C·dv_k/dt = s_k·i − v_k/R_p; with the rule of the step v_k(n+1) = A_k + β·s_k·i(n+1), so the arm is one row
 // v_ab = Σ s_k·v_k(n+1) + R_arm·i = E + R_eq·i (THEORY §8ξ). TR: A_k = α·v_k + β·s_k·i(n), α = (1 − x)/(1 + x),
 // β = h/(2C(1 + x)), x = h/(2R_pC); BE: A_k = v_k/(1 + 2x), β = h/(C(1 + 2x)); BDF2: A_k = −(a₁v_k + a₂v_k′)/(a₀ + 2x), β = h/(C(a₀ + 2x)).
 function chbCoef(e,h,mode,B){const x=e.Rp>0?h/(2*e.Rp*e.C):0,N=e.N,s=e.s,v=e.vc;let beta,al=1,d=1,ss=0,E=0;
  if(mode==='TR'){al=(1-x)/(1+x);beta=h/(2*e.C*(1+x));for(let k=0;k<N;k++){const q=s[k];if(q){ss+=q*q;E+=q*al*v[k];}}E+=beta*ss*e.i;}
  else if(mode==='BDF2'){d=B.a0+2*x;beta=h/(e.C*d);for(let k=0;k<N;k++){const q=s[k];if(q){ss+=q*q;E+=q*(-B.a1*v[k]-B.a2*e.vc1[k])/d;}}}
  else{d=1+2*x;beta=h/(e.C*d);for(let k=0;k<N;k++){const q=s[k];if(q){ss+=q*q;E+=q*v[k]/d;}}}
  e.al=al;e.d=d;e.beta=beta;e.Req=e.Rarm+beta*ss;e.E=E;}
 function chbCommit(e,i,mode,B){const N=e.N,s=e.s,v=e.vc,v1=e.vc1,be=e.beta;
  for(let k=0;k<N;k++){const q=s[k],o=v[k];let w;
   if(mode==='TR')w=e.al*o+be*q*(e.i+i);else if(mode==='BDF2')w=(-B.a1*o-B.a2*v1[k])/e.d+be*q*i;else w=o/e.d+be*q*i;
   v1[k]=o;v[k]=w;}
  e.i=i;}
 // the insertion states from the signal pins: rounded to −1, 0, +1 (half bridges: 0, +1); the string goes into the gate
 // signature (a change starts the step like a switching) and into the key of the cached factorization
 function chbStates(e,sv,set){let key='';for(let j=0;j<e.N;j++){const n=e.sIn[j],u=n>=0&&sv?sv[n]:0;let q=u>.5?1:u<-.5?-1:0;if(e.hb&&q<0)q=0;if(set)e.s[j]=q;key+=q<0?'-':q?'+':'0';}if(set)e.sKey=key;return key;}
 // nearest-level modulation and the choice of the cells (§50): n = round(v_ref/V_C) within ±N (0…N for half bridges); the
 // |n| cells inserted with the sign of n are those with the lowest voltages when the current charges them (sign(n)·i > 0),
 // the highest ones otherwise. With 'reduced' the cells stay as they are while n and its sign stay and the spread of the
 // voltages is within ΔV; a change of n inserts or bypasses only the cells it needs (THEORY §8ξ). Same lines in engine/batch.py.
 function nlcStep(b,st,ref,i,v){const N=b.N;let sum=0;for(let k=0;k<N;k++)sum+=v[k];const vav=sum/N,Vn=b.avg&&vav>1e-9*b.Vdc?vav:b.Vdc;
  let n=Math.round(ref/Vn);if(!Number.isFinite(n))n=0;n=Math.max(b.hb?0:-N,Math.min(N,n));const m=Math.abs(n),sg=Math.sign(n),charge=sg*i>=0,old=st.s.slice();
  const order=[...Array(N).keys()].sort((a,c)=>v[a]-v[c]||a-c),pickLow=list=>list,pickHigh=list=>list.slice().reverse();
  const full=()=>{const L=charge?pickLow(order):pickHigh(order);const s=new Array(N).fill(0);for(let k=0;k<m;k++)s[L[k]]=sg;return s;};
  let s;
  if(!b.red||!m||sg!==Math.sign(st.n)||!st.n)s=full();
  else{const ins=order.filter(k=>old[k]===sg),out=order.filter(k=>old[k]!==sg),spread=v[order[N-1]]-v[order[0]];
   if(m===ins.length)s=spread<=b.band?old:full();
   else{s=old.map(q=>q===sg?sg:0);
    if(m>ins.length){const L=charge?pickLow(out):pickHigh(out);for(let k=0;k<m-ins.length;k++)s[L[k]]=sg;}
    else{const L=charge?pickHigh(ins):pickLow(ins);for(let k=0;k<ins.length-m;k++)s[L[k]]=0;}}}
  let ch=0;for(let k=0;k<N;k++)if(s[k]!==old[k])ch++;st.s=s;st.n=n;st.vav=vav;st.sw+=ch;}
 // the single-phase PLL with a second-order generalized integrator (Ciobotaru, Teodorescu, Blaabjerg, PESC 2006):
 // dv′/dt = ω′·(k·(v − v₀ − v′) − qv′), dqv′/dt = ω′·v′, dθ/dt = ω′, ω′ = ω₀ + K_p·ε + K_i·∫ε, ε = v_q/|v|, and (4.10, our
 // addition) the DC part dv₀/dt = ω′·k₀·(v − v₀ − v′), so that a DC input stays out of qv′ (k₀ = 0: the classic SOGI), and ω′
 // held within 0.5…1.5·ω₀ (the integral of ε stops at the limits). Every state as the
 // integrator INT: the value at t from the derivative held since the previous evaluation, so the fast block and its
 // detailed version (INT and EXPR, netlib.js spllDef) give the same numbers. α = v′, β = qv′ as the Clarke components of a
 // three-phase set: θ as in the three-phase PLL (v = V̂·sin(θ + 90°), v_d = V̂). Same lines in engine/batch.py.
 function footLink(net,list){if(!list.length)return;const pins=e=>e.k==='TL'?[e.a1,e.b1,e.a2,e.b2]:e.k==='TLM'?[...e.n1,...e.n2]:e.ports?e.ports.flat():e.k==='X'?[e.p1,e.p2,e.s1,e.s2]:[e.a,e.b];
  const cnt=new Map();for(const e of net.els)for(const n of pins(e))if(n>=0)cnt.set(n,(cnt.get(n)||0)+1);
  for(const e of list){const F=e.foot,ci=net.compInfo.get(F.line),tl=ci&&ci.main,lb=net.compInfo.get(e.cid)?.label||e.cid;
   if(!tl||tl.k!=='TL')throw new NetlistError(`${lb}: η γρήγορη γείωση θέλει τη γραμμή του πύργου («${F.line}»).`);
   const gndB=e.b<0||(cnt.get(e.b)===2&&net.els.some(x=>x.k==='V'&&x.src?.kind==='dc'&&!(x.src.V)&&!(x.sigIn>=0)&&((x.a===e.b&&x.b<0)||(x.b===e.b&&x.a<0))));
   if(e.a<0||tl.a2!==e.a||tl.b2>=0||cnt.get(e.a)!==2||!gndB)throw new NetlistError(`${lb}: η γρήγορη γείωση θέλει τον κόμβο της βάσης μόνο με τη γραμμή του πύργου και τη γείωση (αλλιώς: υλοποίηση «αναλυτική»).`);
   F.tl=tl;}}
 // quasi-steady conductance at contact separation for the current i (q = 1 with u = i/g), by bisection on x
 function arcStart(A,i){const ai=Math.abs(i);if(!(ai>1e-9))return A.xmax;let lo=A.xmin,hi=A.xmax;
  const r=x=>(A.lam-3)*x+2*Math.log(ai)-Math.log(A.P0+A.P1*ai*ai*Math.exp(-x))-A.beta*x;
  if(r(hi)>=0)return hi;if(r(lo)<=0)return lo;for(let k=0;k<200;k++){const m=(lo+hi)/2;if(r(m)>0)lo=m;else hi=m;}return (lo+hi)/2;}

 function buildNetlist(project){
  // subcircuits (3.17, §9): the solver sees one flat circuit (instance parts as X1/<id>, ports as junctions)
  let subWarn=[];if(SUBC&&SUBC.needs(project)){try{const f=SUBC.flatten(project);project=f.project;subWarn=f.warnings;}catch(e){throw e instanceof SUBC.SubcircuitError?new NetlistError(e.message):e;}}
  // units and vector types of the signal ports (3.19, §3): a frame into another frame stops here, units are warnings
  let units=null;if(UNITS){try{units=UNITS.check(project);subWarn.push(...units.warnings);}catch(e){throw e instanceof UNITS.UnitError?new NetlistError(e.message):e;}}
  // buses and vectors (3.18, §3): the solver sees scalar wires only (element-wise blocks on a bus as <id>[k])
  let vec={};if(BUS&&BUS.needs(project)){try{const b=BUS.expand(project);project=b.project;subWarn.push(...b.warnings);vec=b.vec;}catch(e){throw e instanceof BUS.BusError?new NetlistError(e.message):e;}}
  const comps=(project.components||[]).filter(c=>P.PARTS[c.type]&&c.type!=='SUB'&&c.type!=='NOTE');   // 4.9: a note is only on the drawing
  const byId=new Map(comps.map(c=>[c.id,c]));
  const parent=new Map(),find=k=>{let r=k;while(parent.get(r)!==r)r=parent.get(r);let x=k;while(parent.get(x)!==r){const n=parent.get(x);parent.set(x,r);x=n;}return r;};
  const union=(a,b)=>{const ra=find(a),rb=find(b);if(ra!==rb)parent.set(ra,rb);};
  // pin kinds: 'el' electrical, 'in'/'out' signal (3.0), 'j' junction (takes the kind of what it joins)
  const kindOf=new Map();
  for(const c of comps)for(const p of Object.keys(P.pinsOf(c))){const k=c.id+':'+p;parent.set(k,k);kindOf.set(k,c.type==='JUNC'?'j':P.pinKind(c,p));}
  for(const w of project.wires||[]){const a=w.a.c+':'+w.a.p,b=w.b.c+':'+w.b.p;if(parent.has(a)&&parent.has(b))union(a,b);}
  // wire names (3.18, project version ≥ 3): wires with the same name are one net, electrical with electrical, signal with
  // signal (Bus.namesJoin). In an older file a name is only a label.
  if((+project.version||0)>=3){const rk=new Map();for(const k of parent.keys()){const r=find(k),v=kindOf.get(k),o=rk.get(r);if(v==='in'||v==='out')rk.set(r,'sig');else if(v==='el'&&o!=='sig')rk.set(r,'el');else if(!o)rk.set(r,'j');}
   const named=new Map();for(const w of project.wires||[]){if(!w.name)continue;const a=w.a.c+':'+w.a.p;if(!parent.has(a))continue;const n=String(w.name)+'|'+(rk.get(find(a))||'j');if(named.has(n))union(named.get(n),a);else named.set(n,a);}}
  const warnings=[...subWarn];
  // connections without a wire (3.0): an input that names its source in the parameters (in_<pin> = "block:output"),
  // and Goto / From tags with the same name. Both join nets exactly like a wire.
  {const bad=[];for(const c of comps)for(const [k,v] of Object.entries(c.params||{})){if(!k.startsWith('in_')||!v)continue;const a=c.id+':'+k.slice(3),b=String(v);
    if(kindOf.get(a)==='in'&&kindOf.get(b)==='out')union(a,b);else if(kindOf.get(a)==='in')bad.push((c.label||c.id)+'.'+k.slice(3)+' ← '+b);}
   if(bad.length)warnings.push('Πηγή σήματος που δεν υπάρχει (η είσοδος μένει ασύνδετη): '+bad.slice(0,4).join(', ')+'.');
   const nm=c=>String(c.params?.name||'').trim(),go=new Map();
   for(const c of comps)if(c.type==='TAGO'){const n=nm(c);if(!go.has(n))go.set(n,[]);go.get(n).push(c);}
   const dup=[...go].filter(([,l])=>l.length>1).map(([n])=>n);if(dup.length)warnings.push('Δύο ετικέτες «προς» με το ίδιο όνομα: '+dup.join(', ')+'.');
   const lost=[];for(const c of comps)if(c.type==='TAGI'){const g=go.get(nm(c));if(g)union(g[0].id+':u',c.id+':y');else lost.push(nm(c)||c.id);}
   if(lost.length)warnings.push('Ετικέτα «από» χωρίς ετικέτα «προς»: '+[...new Set(lost)].join(', ')+'.');}
  const grounds=comps.filter(c=>c.type==='GND');
  for(let i=1;i<grounds.length;i++)union(grounds[0].id+':g',grounds[i].id+':g');
  let groundRoot=grounds.length?find(grounds[0].id+':g'):null;
  if(!groundRoot){const s=comps.find(c=>['VDC','VAC','IDC','VAC3'].includes(c.type));
   if(s){groundRoot=find(s.id+':n');warnings.push('Δεν υπάρχει γείωση: ως 0 V λαμβάνεται ο αρνητικός ακροδέκτης της '+(s.label||s.id)+'.');}}
  // group pins into nets; canonical key = smallest pin key (stable). Signal pins form their own
  // nets and never join an electrical node.
  const groups=new Map();for(const k of parent.keys()){const r=find(k);if(!groups.has(r))groups.set(r,[]);groups.get(r).push(k);}
  const nets=[],sgroups=[],mixed=[];let gnd=null;
  for(const [r,all] of groups){all.sort();const sk=all.filter(k=>kindOf.get(k)==='in'||kindOf.get(k)==='out');let keys=all;
   if(sk.length){const ek=all.filter(k=>kindOf.get(k)==='el');sgroups.push(all.filter(k=>kindOf.get(k)!=='el'));if(!ek.length)continue;mixed.push(sk[0]+' ↔ '+ek[0]);keys=ek;}
   const net={root:r,keys,canon:keys[0],index:-1,name:null};if(r===groundRoot){gnd=net;net.ground=true;}else nets.push(net);}
  if(mixed.length)warnings.push('Σύρμα σήματος σε ηλεκτρικό κόμβο (η σύνδεση αγνοείται): '+mixed.slice(0,4).join(', ')+'.');
  sgroups.sort((a,b)=>a[0]<b[0]?-1:1);const sigNets=sgroups.map((keys,index)=>({keys,canon:keys[0],index})),sigPin=new Map();for(const n of sigNets)for(const k of n.keys)sigPin.set(k,n.index);
  const sn=(cid,pin)=>{const v=sigPin.get(cid+':'+pin);return v===undefined?-1:v;};
  // 3.7: what is left unconnected, with the options of the project (doc.solve): parts with no connection and current sources
  // in an open circuit leave the solution, wires that join no part make no node. Modes: 'ignore' (silent), 'warn', 'error'.
  const SO=project.solve||{},unconn=['ignore','warn','error'].includes(SO.unconn)?SO.unconn:'warn',island=['auto','ref','error'].includes(SO.island)?SO.island:'auto',rleak=Math.max(0,num(SO.rleak,0));
  const isJ=k=>kindOf.get(k)==='j',cidOf=k=>k.slice(0,k.lastIndexOf(':')),elp=c=>Object.keys(P.elPins(c));
  const netOf=new Map();for(const n of nets)for(const k of n.keys)netOf.set(k,n);if(gnd)for(const k of gnd.keys)netOf.set(k,gnd);
  const skip=new Map();
  for(const c of comps){if(c.type==='JUNC'||c.type==='GND')continue;const ps=elp(c);if(!ps.length)continue;
   if(ps.every(pn=>{const n=netOf.get(c.id+':'+pn);return !n||(!n.ground&&n.keys.every(k=>isJ(k)||cidOf(k)===c.id));}))skip.set(c.id,'unconn');}
  {// dead branches: a two-pin part on a node that nothing else conducts (meters draw no current), repeated inwards
   const METER=new Set(['VM','VP']),cond=c=>!skip.has(c.id)&&!METER.has(c.type)&&c.type!=='JUNC'&&c.type!=='GND',deg=new Map(),dead=new Set();
   for(const c of comps)if(cond(c))for(const pn of elp(c)){const n=netOf.get(c.id+':'+pn);if(n&&!n.ground)deg.set(n,(deg.get(n)||0)+1);}
   for(let again=true;again;){again=false;for(const c of comps){if(!cond(c)||dead.has(c.id))continue;const ps=elp(c);if(ps.length!==2)continue;const ns=ps.map(pn=>netOf.get(c.id+':'+pn));
    if(ns.some(n=>n&&!n.ground&&deg.get(n)===1)){dead.add(c.id);for(const n of ns)if(n&&!n.ground)deg.set(n,deg.get(n)-1);again=true;}}}
   for(const id of dead){const c=byId.get(id),q={...P.defaults(c.type),...(c.params||{})};if(c.type==='IDC'||c.type==='ILG'||(c.type==='L'&&num(q.i0,0)!==0))skip.set(id,'openI');}}
  const libJ=new Set(comps.filter(c=>c.libPort).map(c=>c.id));   // 4.10: the ports of library parts (an unused output is not a forgotten wire)
  const freeNets=[];for(let i=nets.length-1;i>=0;i--){const n=nets[i];if(!n.keys.some(k=>!isJ(k)&&!skip.has(cidOf(k)))){if(n.keys.every(isJ)&&!n.keys.every(k=>libJ.has(cidOf(k))))freeNets.push(n.keys.map(cidOf));nets.splice(i,1);}}
  const wcount=new Map();for(const w of project.wires||[])for(const e of [w.a,w.b])wcount.set(e.c,(wcount.get(e.c)||0)+1);
  const freeEnds=comps.filter(c=>c.type==='JUNC'&&!c.libPort&&wcount.get(c.id)===1).map(c=>c.id);
  nets.sort((a,b)=>a.canon<b.canon?-1:1);nets.forEach((n,i)=>n.index=i);
  const pinNet=new Map();for(const n of nets)for(const k of n.keys)pinNet.set(k,n);if(gnd)for(const k of gnd.keys)pinNet.set(k,gnd);
  // wire names label their net
  for(const w of project.wires||[])if(w.name){const n=pinNet.get(w.a.c+':'+w.a.p);if(n&&!n.name)n.name=w.name;}
  // pins that touch nothing else
  const open=[];for(const c of comps){if(c.type==='JUNC'||c.type==='TL'||c.type==='TLM'||skip.has(c.id)||!Object.keys(P.elPins(c)).length)continue;for(const p of Object.keys(P.elPins(c))){const n=pinNet.get(c.id+':'+p);if(n&&n.keys.filter(k=>!isJ(k)).length===1&&c.type!=='GND')open.push(c.id+':'+p);}}
  const lbl=id=>byId.get(id)?.label||id,unc=[...skip].filter(([,r])=>r==='unconn').map(([id])=>lbl(id)),oi=[...skip].filter(([,r])=>r==='openI').map(([id])=>lbl(id)),cut=(l,n=6)=>l.slice(0,n).join(', ')+(l.length>n?` και ${l.length-n} ακόμη`:'');
  if(unconn==='error'&&(unc.length||oi.length||open.length))throw new NetlistError([unc.length?'ασύνδετα στοιχεία: '+cut(unc):'',oi.length?'πηγή ρεύματος σε ανοιχτό κύκλωμα: '+cut(oi):'',open.length?'ανοιχτοί ακροδέκτες: '+cut(open):''].filter(Boolean).join('· ')+'. Σύνδεσέ τα ή άλλαξε την επιλογή «Ασύνδετα» στο πάνελ παραμέτρων.');
  if(unconn==='warn'){if(unc.length)warnings.push('Ασύνδετα στοιχεία, εκτός επίλυσης: '+cut(unc)+'.');if(oi.length)warnings.push('Πηγή ρεύματος σε ανοιχτό κύκλωμα, εκτός επίλυσης: '+cut(oi)+'.');
   if(open.length)warnings.push('Ανοιχτοί ακροδέκτες: '+cut(open)+'.');}
  let nNodes=nets.length;
  const node=(cid,pin)=>{const n=pinNet.get(cid+':'+pin);return n&&!n.ground?n.index:-1;};
  const internal=()=>nNodes++;
  const els=[],ctrls=[],shs=[],blocks=[],compInfo=new Map();
  // a signal block: inputs/outputs -> signal net index (−1 = not connected)
  const mkBlock=(c,p,T,extra={})=>{const ins={},outs={};for(const [k,v] of Object.entries(P.sigPins(c)))(v.dir==='in'?ins:outs)[k]=sn(c.id,k);
   const b={i:blocks.length,id:c.id,type:T,label:c.label||c.id,ins,outs,outList:Object.keys(outs),st:{},ft:!['UD','INT','LPF'].includes(T),...extra};blocks.push(b);return b;};
  let nRows=0,hasPi=false;const row=()=>nRows++;
  for(const c of comps){
   if(skip.has(c.id))continue;
   const p={...P.defaults(c.type),...(c.params||{})},T=c.type;
   const info={id:c.id,type:T,label:c.label||c.id,pins:[],els:[]};compInfo.set(c.id,info);
   const add=e=>{e.cid=c.id;els.push(e);info.els.push(e);return e;};
   const series=(a,b,R)=>{if(!(R>0))return a;const m=internal();add({k:'G',a,b:m,R,role:'Rs'});return m;};
   if(T==='R'){const a=node(c.id,'a'),b=node(c.id,'b');info.pins=[a,b];info.main=add({k:'G',a,b,R:Math.max(num(p.R,10),1e-9),sched:P.parseSched(p.sched)});}
   else if(T==='L'){const a=node(c.id,'a'),b=node(c.id,'b');info.pins=[a,b];const m=num(p.Rs,0)>0?internal():b;info.main=add({k:'L',a,b:m,L:Math.max(num(p.L,1e-4),1e-12),i:num(p.i0,0),key:c.id});if(m!==b)add({k:'G',a:m,b,R:num(p.Rs,0)});}
   else if(T==='C'){const a=node(c.id,'p'),b=node(c.id,'n');info.pins=[a,b];const m=num(p.esr,0)>0?internal():b;info.main=add({k:'C',a,b:m,C:Math.max(num(p.C,1e-6),1e-15),v:num(p.v0,0),i:0,key:c.id});if(m!==b)add({k:'G',a:m,b,R:num(p.esr,0)});}
   else if(T==='VDC'||T==='VAC'){
    const a=node(c.id,'p'),b=node(c.id,'n');info.pins=[a,b];
    let top=a;if(T==='VDC'&&p.uni){const m=internal();info.uni=add({k:'D',a:m,b:top,Ron:1e-6,Roff:1e7,Vf:0,on:false,key:c.id+'#u'});top=m;}
    if(T==='VAC'&&num(p.Ls,0)>0){const m=internal();add({k:'L',a:m,b:top,L:num(p.Ls,0),i:0,key:c.id+'#Ls'});top=m;}
    const s=series(top,top,0);let srcTop=top;if(num(p.Rs,0)>0){const m=internal();add({k:'G',a:m,b:top,R:num(p.Rs,0)});srcTop=m;}
    const v=T==='VDC'?{kind:'dc',V:num(p.V,12),sched:P.parseSched(p.sched)}:{kind:'ac',Vpk:num(p.Vpk,325),f:num(p.f,50),ph:num(p.phase,0)*Math.PI/180,off:num(p.off,0)};
    info.main=add({k:'V',a:srcTop,b,row:row(),src:v,sigIn:T==='VDC'&&p.ctl==='sig'?sn(c.id,'u'):undefined});}
   else if(T==='VIMP'){const a=node(c.id,'p'),b=node(c.id,'n');info.pins=[a,b];const w=P.impulseWave(p);
    if(!(w.eta>1e-6&&w.tau1>0&&w.tau2>0))throw new NetlistError(`${c.label||c.id}: δεν βρέθηκαν τ₁, τ₂ για T1 = ${P.eng(w.T1,'s')}, T2 = ${P.eng(w.T2,'s')}.`);
    if(w.fitOk===false)warnings.push(`${c.label||c.id}: η προσαρμογή στα T1/T2 δεν συνέκλινε πλήρως.`);
    let top=a;if(num(p.Rs,0)>0){const m=internal();add({k:'G',a:m,b:top,R:num(p.Rs,0)});top=m;}
    info.wave=w;info.main=add({k:'V',a:top,b,row:row(),src:{kind:'wave',w}});}
   else if(T==='TL'){const g=P.tlParams(p);if(g.err)throw new NetlistError(`${c.label||c.id}: ${g.err}`);
    const a1=node(c.id,'a1'),b1=node(c.id,'b1'),a2=node(c.id,'a2'),b2=node(c.id,'b2');info.pins=[a1,b1];info.ports=[[a1,b1],[a2,b2]];info.line=g;
    info.main=add(tlElement({a:a1,b:b1,a1,b1,a2,b2,key:c.id},g));}
   else if(T==='TLM'){const g=P.tlmModel(p);if(g.err)throw new NetlistError(`${c.label||c.id}: ${g.err}`);const M=g.M;
    if(M!==P.tlmM(p))throw new NetlistError(`${c.label||c.id}: το μοντέλο έχει ${M} φάσεις, τα δεδομένα ${P.tlmM(p)}. Υπολόγισε ξανά.`);
    const n1=[],n2=[];for(let k=0;k<M;k++){n1.push(node(c.id,P.tlmPin(k,1)));n2.push(node(c.id,P.tlmPin(k,2)));}
    if(g.type==='pi'){info.pins=[n1[0],-1];info.ports=[...n1.map(a=>[a,-1]),...n2.map(a=>[a,-1])];info.pi=g;info.main=piLine(c,n1,n2,g,{add,internal,row});hasPi=true;}
    else{info.pins=[n1[0],-1];info.ports=[...n1.map(a=>[a,-1]),...n2.map(a=>[a,-1])];info.tlm=g;
     const vt=String(p.vtrap??'').trim(),vtrap=vt?vt.split(/[\s,;]+/).filter(Boolean).map(v=>P.parseEng(v)):null;
     if(vtrap&&(vtrap.length!==M||vtrap.some(v=>!Number.isFinite(v))))throw new NetlistError(`${c.label||c.id}: το παγιδευμένο φορτίο θέλει ${M} τάσεις (μία ανά φάση).`);
     info.main=add(tlmElement({a:n1[0],b:-1,key:c.id,vtrap},n1,n2,g));}}
   else if(T==='SG'){const a=node(c.id,'a'),b=node(c.id,'b');info.pins=[a,b];const Ub=p.vt==='de'?1:num(p.Ub,0),tr=String(p.trig??'').trim()===''?Infinity:P.parseEng(p.trig);
    if(!(Ub>0))throw new NetlistError(`${c.label||c.id}: η τάση διάσπασης πρέπει να είναι θετική.`);if(Number.isNaN(tr))throw new NetlistError(`${c.label||c.id}: μη έγκυρος χρόνος έναυσης.`);
    const ext=['zero','iext','never'].includes(p.ext)?p.ext:'zero';let de=null;
    if(p.vt==='de'){de={U0:num(p.U0,0),k:num(p.kde,1),D:num(p.Dde,0)};if(!(de.U0>0))throw new NetlistError(`${c.label||c.id}: η τάση έναρξης U₀ πρέπει να είναι θετική.`);
     if(!(de.k>=0&&de.k<=10))throw new NetlistError(`${c.label||c.id}: ο εκθέτης k πρέπει να είναι από 0 ως 10.`);if(!(de.D>0))throw new NetlistError(`${c.label||c.id}: η σταθερά D πρέπει να είναι θετική.`);}
    info.main=add({k:'D',a,b,Ron:Math.max(num(p.Rarc,.1),1e-7),Roff:Math.max(num(p.Roff,1e10),1),Vf:0,on:false,key:c.id,Dacc:0,gap:{Ub:de?de.U0:Ub,trig:tr,ext,Iext:ext==='iext'?Math.max(0,num(p.Iext,1)):0,de}});}
   else if(T==='ARCX'){const a=node(c.id,'a'),b=node(c.id,'b');info.pins=[a,b];const Ron=Math.max(num(p.Ron,1e-4),1e-7),gmin=Math.max(num(p.gmin,1e-12),1e-30);
    const A={lam:num(p.lam,2),tau0:Math.max(num(p.tau0,0.27e-6),1e-15),alpha:num(p.alpha,0),P0:Math.max(num(p.P0,15917),1e-30),P1:Math.min(Math.max(num(p.P1,0),0),0.999999),beta:num(p.beta,0),
     Ron,gmin,xmin:Math.log(gmin),xmax:Math.log(1/Ron),closed:true,x:Math.log(1/Ron),u:0,h:0,th:1,F0:0,xg:null,tsep:null};
    const e={k:'NL',a,b,v0:0,g:0,J:0,arc:A,gk:'arc',gate:'sig',gIn:sn(c.id,'g'),gon:true};e.ch={cur:v=>arcCur(e,v)};info.gIn=e.gIn;info.main=add(e);info.arc=e;}
   else if(T==='MOV'){const a=node(c.id,'a'),b=node(c.id,'b'),ch=P.movChar(p);if(ch.err)throw new NetlistError(`${c.label||c.id}: ${ch.err}`);info.pins=[a,b];info.main=add({k:'NL',a,b,ch,pts:ch.pts,v0:0,g:0,J:0});}
   else if(T==='SAIX'){const a=node(c.id,'a'),b=node(c.id,'b'),ch0=P.movChar({model:'table',tbl:p.tbl0}),ch1=P.movChar({model:'table',tbl:p.tbl1});
    if(ch0.err||ch1.err)throw new NetlistError(`${c.label||c.id}: ${ch0.err||ch1.err}`);info.pins=[a,b];const pos=(k,d)=>Math.max(num(p[k],d),1e-30);
    const S={L0:pos('L0',1e-6),R0:pos('R0',100),L1:pos('L1',1e-5),R1:pos('R1',100),C:pos('C',1e-10),ch0,ch1,h:0,ug:null};for(const k of SAI_ST)S[k]=0;
    const e={k:'NL',a,b,v0:0,g:0,J:0,sai:S};e.ch={cur:v=>saiCur(S,v)};info.main=add(e);}
   else if(T==='RFX'){const a=node(c.id,'a'),b=node(c.id,'b'),ch=P.movChar({model:'table',tbl:p.tbl});if(ch.err)throw new NetlistError(`${c.label||c.id}: ${ch.err}`);info.pins=[a,b];
    const R0=Math.max(num(p.R0,15),1e-6);info.main=add({k:'G',a,b,R:R0,Rnow:R0,foot:{ch,line:String(p.line||''),tl:null,v:0}});}
   // 4.10 (§50): a cascaded arm with N cell capacitors as states; between a and b one row: v_ab − R_eq·i = E (chbCoef)
   else if(T==='CHBX'){const a=node(c.id,'a'),b=node(c.id,'b');info.pins=[a,b];const N=Math.max(1,Math.min(64,Math.round(num(p.N,10)))),hb=p.cell==='hb',C=Math.max(num(p.C,10e-3),1e-12),V0=num(p.Vdc,1000);
    const e={k:'CHB',a,b,row:row(),N,hb,C,Rp:Math.max(num(p.Rp,0),0),Rarm:N*(hb?1:2)*Math.max(num(p.Ron,1e-3),0),vc:new Float64Array(N).fill(V0),vc1:new Float64Array(N).fill(V0),s:new Int8Array(N),sIn:Array.from({length:N},(_,k)=>sn(c.id,'s'+(k+1))),i:0,Req:0,E:0,key:c.id+'#chb'};
    info.main=add(e);info.chb=e;info.blk=mkBlock(c,p,'CHBX',{chb:e,ft:false});}
   else if(T==='IDC'){const a=node(c.id,'p'),b=node(c.id,'n');info.pins=[a,b];info.main=add({k:'I',a,b,I:num(p.I,1),sched:P.parseSched(p.sched),sigIn:p.ctl==='sig'?sn(c.id,'u'):undefined});}
   else if(T==='ILG'){const a=node(c.id,'p'),b=node(c.id,'n');info.pins=[a,b];const w=P.lightningWave(p);
    if(!(w.eta>1e-6&&w.tau1>0&&w.tau2>0))throw new NetlistError(`${c.label||c.id}: δεν βρέθηκαν τ₁, τ₂ για T1 = ${P.eng(w.T1,'s')}, T2 = ${P.eng(w.T2,'s')} (το διπλοεκθετικό θέλει T2/T1 πάνω από περίπου 3).`);
    if(w.fitOk===false)warnings.push(`${c.label||c.id}: η προσαρμογή στα T1/T2 δεν συνέκλινε πλήρως.`);
    info.wave=w;info.main=add({k:'I',a,b,I:0,wave:w});}
   else if(T==='KL'||T==='KG'){ // multiports (3.5): coupled inductors (flux element 'F') or a conductance matrix ('MG'), port k from a_k to b_k
    const N=P.nPorts(p),ports=[];for(let k=1;k<=N;k++)ports.push([node(c.id,'a'+k),node(c.id,'b'+k)]);info.pins=ports[0];info.ports=ports;
    if(T==='KL'){const r=P.klMatrix(p);if(r.err)throw new NetlistError(`${c.label||c.id}: ${r.err}`);const L=r.L,Gam=P.matInv(L),i0=numList(p.i0,N,0),Rw=num(p.Rw,0);
     const pr=ports.map(([a,b])=>{if(!(Rw>0))return [a,b];const m=internal();add({k:'G',a,b:m,R:Rw});return [m,b];});
     const psi=Float64Array.from(L.map(row=>row.reduce((s,v,j)=>s+v*i0[j],0)));
     info.main=add({k:'F',ports:pr,N,Lm:L.flat(),Gam:Gam.flat(),Gnow:Gam.flat(),psi,psi1:psi.slice(),i:Float64Array.from(i0),key:c.id});}
    else{const r=P.kgMatrix(p);if(r.err)throw new NetlistError(`${c.label||c.id}: ${r.err}`);info.main=add({k:'MG',ports,N,Gm:r.G.flat()});}}
   else if(T==='CPE'){const a=node(c.id,'a'),bb=node(c.id,'b');info.pins=[a,bb];const n0=internal();info.main=add({k:'V',a,b:n0,row:row(),src:{kind:'dc',V:0}}); // 0 V: the current a → b
    const bk=P.cpeBank({...P.defaults('CPE'),...p});bk.br.forEach((q,k)=>{const n=internal();add({k:'G',a:n0,b:n,R:q.R});add({k:'C',a:n,b:bb,C:q.C,v:0,i:0,key:c.id+'#'+k});});
    add({k:'G',a:n0,b:bb,R:1/bk.G0});add({k:'C',a:n0,b:bb,C:bk.Cinf,v:0,i:0,key:c.id+'#inf'});}
   else if(T==='SW'){const a=node(c.id,'d'),b=node(c.id,'s');info.pins=[a,b];const Ron=Math.max(num(p.Ron,1e-3),1e-7),Roff=Math.max(num(p.Roff,1e6),1),g={gate:p.gate||'pwm',pwm:p.pwm,out:p.out||'a'};
    // IGBT: a gated diode (forward only, V_ce0 + R_on); MOSFET: a resistive switch
    if(p.model==='igbt')info.main=add({k:'D',a,b,Ron,Roff,Vf:Math.max(0,num(p.Vce0,0)),on:false,key:c.id+'#q',gk:'igbt',gon:false,...g});
    else info.main=add({k:'S',a,b,Ron,Roff,on:false,...g});
    if(p.body){const Rd=num(p.Rd,0)>0?Math.max(num(p.Rd,0),1e-7):Ron;info.body=add({k:'D',a:b,b:a,Ron:Rd,Roff,Vf:Math.max(0,num(p.Vfd,0)),on:false,key:c.id+'#b'});}
    const Eon=Math.max(0,num(p.Eon,0)),Eoff=Math.max(0,num(p.Eoff,0));if(Eon>0||Eoff>0)info.loss={Eon,Eoff,Vref:Math.max(num(p.Vref,600),1e-9),Iref:Math.max(num(p.Iref,100),1e-12),E:0,P:0,Etot:0,n:0};
    if(p.gate==='sig'){info.main.gIn=sn(c.id,'g');info.gIn=info.main.gIn;}
    if(p.gate==='pwm'&&!(p.pwm&&byId.get(p.pwm)?.type==='PWM'))warnings.push(`${c.label||c.id}: διάλεξε μπλοκ PWM στις ρυθμίσεις (αλλιώς μένει OFF).`);}
   else if(T==='D'){const a=node(c.id,'a'),b=node(c.id,'k');info.pins=[a,b];info.main=add({k:'D',a,b,Ron:Math.max(num(p.Ron,1e-3),1e-7),Roff:Math.max(num(p.Roff,1e6),1),Vf:num(p.Vf,0),on:false,key:c.id});}
   else if(T==='SCR'){const a=node(c.id,'a'),b=node(c.id,'k');info.pins=[a,b];const fire=p.fire||'alpha';
    const e={k:'D',a,b,Ron:Math.max(num(p.Ron,1e-3),1e-7),Roff:Math.max(num(p.Roff,1e6),1),Vf:num(p.Vf,0),on:false,key:c.id,gk:'scr',gon:false};
    if(fire==='pwm'){e.gate='pwm';e.pwm=p.pwm;e.out=p.out||'a';if(!(p.pwm&&byId.get(p.pwm)?.type==='PWM'))warnings.push(`${c.label||c.id}: διάλεξε μπλοκ PWM για την έναυση.`);}
    else if(fire==='on')e.gate='on';
    else if(fire==='sig'){e.gate='sig';e.gIn=sn(c.id,'g');info.gIn=e.gIn;}
    else{e.gate='alpha';e.fire={refsrc:p.refsrc,alpha:num(p.alpha,30),shift:num(p.shift,0),pw:Math.min(359,Math.max(num(p.pw,20),.1)),f:Math.max(num(p.fref,50),1e-6),ph0:0};}
    info.main=add(e);}
   else if(T==='XFMR'){const p1=node(c.id,'p1'),p2=node(c.id,'p2');let s1=node(c.id,'s1'),s2=node(c.id,'s2');const opp=p.pol==='opp';if(opp)[s1,s2]=[s2,s1];
    info.pins=[p1,p2];info.pins2=opp?[s2,s1]:[s1,s2];info.opp=opp;
    // winding resistance and leakage in series with the dotted terminals; L_m sits behind the primary leakage
    const im0=num(p.im0,0);let P1=p1,S1=s1;
    if(num(p.R1,0)>0){const m=internal();add({k:'G',a:P1,b:m,R:num(p.R1,0)});P1=m;}
    if(num(p.Llk1,0)>0){const m=internal();info.lk1=add({k:'L',a:P1,b:m,L:num(p.Llk1,0),i:im0,key:c.id+'#lk1'});P1=m;}
    if(num(p.R2,0)>0){const m=internal();add({k:'G',a:S1,b:m,R:num(p.R2,0)});S1=m;}
    if(num(p.Llk2,0)>0){const m=internal();info.lk2=add({k:'L',a:S1,b:m,L:num(p.Llk2,0),i:0,key:c.id+'#lk2'});S1=m;}
    info.main=add({k:'X',p1:P1,p2,s1:S1,s2,n:num(p.n,1)||1,row:row()});info.mag=add({k:'L',a:P1,b:p2,L:Math.max(num(p.Lm,1e-3),1e-12),i:im0,key:c.id+'#m'});}
   else if(T==='VAC3'){const nN=node(c.id,'n'),ph0=num(p.phase,0)*Math.PI/180,seq=p.seq==='acb'?-1:1;info.phases=[];info.n=nN;
    ['a','b','c'].forEach((q,k)=>{const pin=node(c.id,q);let top=pin;
     if(num(p.Ls,0)>0){const m=internal();add({k:'L',a:m,b:top,L:num(p.Ls,0),i:0,key:c.id+'#Ls'+q});top=m;}
     if(num(p.Rs,0)>0){const m=internal();add({k:'G',a:m,b:top,R:num(p.Rs,0)});top=m;}
     const e=add({k:'V',a:top,b:nN,row:row(),src:{kind:'ac',Vpk:num(p.Vpk,325),f:num(p.f,50),ph:ph0-seq*k*2*Math.PI/3,off:0}});info.phases.push({pin,e});});
    info.pins=[info.phases[0].pin,nN];info.main=info.phases[0].e;}
   else if(T==='CPL'){const a=node(c.id,'p'),b=node(c.id,'n');info.pins=[a,b];info.main=add({k:'CPL',a,b,P:num(p.P,1000),Vmin:Math.max(num(p.Vmin,5),1e-3),sched:P.parseSched(p.sched),v0:null});}
   else if(T==='PWM'){const fs=Math.max(num(p.fs,20e3),1e-3);ctrls.push({id:c.id,label:c.label||c.id,fs,T:1/fs,mode:p.mode||'fixed',D:num(p.D,.5),dsched:P.parseSched(p.dsched),carrier:p.carrier||'triangle',phase:num(p.phase,0)/360,
     sensor:p.sensor,qty:p.qty||'I',ref:P.parseSched(p.ref)||[[0,0]],Kp:num(p.Kp,0),Ki:num(p.Ki,0),ff:p.ff||'none',ffA:p.ffA,ffB:p.ffB,D0:num(p.D0,.5),dmin:num(p.dmin,.01),dmax:num(p.dmax,.99),
     Kd:num(p.Kd,0),Tf:num(p.Tf,0),dt:Math.max(0,num(p.dt,0)),dIn:p.mode==='ext'?sn(c.id,'d'):-1,tkPrev:null,dPrev:null,dPrevOff:null,upd:p.upd==='double'?'double':'single',h:null,dOn:num(p.D,.5),dOff:num(p.D,.5),m:num(p.m,.8),fref:num(p.fref,50),refphase:num(p.refphase,0)*Math.PI/180,d:num(p.D,.5),xi:0,k:null,tk:0,meas:0,refNow:0,ePrev:null,dF:0});info.ctrl=ctrls[ctrls.length-1];}
   else if(T==='IM'){ // induction machine, inverse-Γ, stator frame: each phase R_s + R_R, L_σ and the source e = −(R_R/L_M − jω_r)ψ_R (Y, floating star);
    // ψ_R, ω and θ are states of the machine, advanced after each committed step from the stator currents
    const N=internal(),ph=[];for(const k of ['a','b','c']){const t=node(c.id,k),n1=internal(),n2=internal();add({k:'G',a:t,b:n1,R:num(p.Rs,3)+num(p.RR,2),role:'R'});
     const L=add({k:'L',a:n1,b:n2,L:Math.max(num(p.Lsig,.025),1e-9),i:0,key:c.id+'#L'+k});const V=add({k:'V',a:n2,b:N,row:row(),src:{kind:'dc',V:0}});ph.push({L,V});}
    info.pins=[node(c.id,'a'),node(c.id,'b')];info.main=ph[0].L;const sched=P.parseSched(p.TL)||[[0,0]];
    info.im={ph,RR:num(p.RR,2),LM:Math.max(num(p.LM,.3),1e-9),p:Math.max(1,Math.round(num(p.pp,2))),J:Math.max(num(p.J,.02),1e-9),b:Math.max(num(p.bm,0),0),sched:p.load==='sig'?null:sched,
     st:{pa:0,pb:0,w:num(p.w0,0),th:0,te:0,ia:0,ib:0}};
    info.blk=mkBlock(c,p,'IM',{im:info.im,ft:false});info.im.tl=info.blk.ins.tl??-1;}
   else if(T==='SM'){ // synchronous machine (3.5): R_s per phase, then the flux element of the two ports a→c, b→c whose Γ(θ) and ψ₀(θ)
    // follow the rotor (new factorization each step); ω and θ advance after each committed step from the torque
    const n1=['a','b','c'].map(k=>series(node(c.id,k),-1,num(p.Rs,2)));
    const m={p:Math.max(1,Math.round(num(p.pp,2))),Ld:Math.max(num(p.Ld,.15),1e-9),Lq:Math.max(num(p.Lq,.03),1e-9),psim:num(p.psim,0),
     sat:p.sat==='d'?{Ld:Math.max(num(p.Ld,.15),1e-9),Ldsat:Math.min(Math.max(num(p.Ldsat,.04),1e-9),Math.max(num(p.Ld,.15),1e-9)),psik:Math.max(num(p.psikd,.5),1e-9)}:null,J:Math.max(num(p.J,.02),1e-9),b:Math.max(num(p.bm,0),0),
     sched:p.load==='sig'?null:(P.parseSched(p.TL)||[[0,0]]),st:{w:num(p.w0,0),the:num(p.th0,0)*Math.PI/180,te:0,id:0,iq:0}};
    const q=smPort(m,m.st.the),psi=Float64Array.from(q.p0);
    info.main=add({k:'F',ports:[[n1[0],n1[2]],[n1[1],n1[2]]],N:2,sm:m,Gnow:q.G,p0:q.p0,psi,psi1:psi.slice(),i:new Float64Array(2),key:c.id});
    m.F=info.main;info.pins=[node(c.id,'a'),node(c.id,'b')];info.sm=m;
    info.blk=mkBlock(c,p,'SM',{sm:m,ft:false});m.tl=info.blk.ins.tl??-1;}
   else if(T==='GEN3'){ // 4.3 (§31.6, §25): synchronous generator. Stator a, b, c (to the neutral) and the rotor windings are one flux element
    // whose Γ(θ) follows the rotor (power-invariant Park, rotor referred to the stator, Parts.genModel); the field is fed through R_fd by a
    // source E_fd·(R_fd/X_ad)·U_n, each damper is closed on its resistance; the masses of the shaft advance after each committed step (genStep)
    const g=P.genModel(p);if(g.err)throw new NetlistError(`${c.label||c.id}: ${g.err}`);if(g.note)warnings.push(`${c.label||c.id}: ${g.note}`);
    const term=['a','b','c'].map(k=>node(c.id,k)),nN=p.neut==='pin'?node(c.id,'n'):p.neut==='iso'?internal():-1;
    const ports=term.map(t=>[series(t,-1,g.Ra*g.Zb),nN]),xf=internal(),mf=internal(),NM=g.sh.N;
    const m={g,term,nN,init:p.init==='zero'?'zero':'lf',V0:num(p.V0,1),ang0:num(p.ang0,0)*Math.PI/180,exc:['sched','sig'].includes(p.exc)?p.exc:'init',mech:['sched','sig'].includes(p.mech)?p.mech:'init',
     efdS:P.parseSched(p.Efd)||[[0,1]],tmS:P.parseSched(p.Tm)||[[0,0]],Efd0:num(p.V0,1),Tm0:0,V0:p.init==='zero'?1:num(p.V0,1),
     st:{ph:new Array(NM).fill(0),w:new Array(NM).fill(1),wo:new Array(NM).fill(1),ts:new Array(NM-1).fill(0),tem:0,pe:0,qe:0,vt:0,ifd:0,id:0,iq:0}};
    m.fV=add({k:'V',a:xf,b:-1,row:row(),src:{kind:'dc',V:0},gen:m});add({k:'G',a:xf,b:mf,R:g.Rr[0],role:'Rf'});ports.push([mf,-1]);
    for(let r=1;r<g.Rr.length;r++){const md=internal();add({k:'G',a:md,b:-1,R:g.Rr[r],role:'Rk'});ports.push([md,-1]);}
    const N=g.N,th0=m.ang0-Math.PI; // from rest: the rotor where the open-circuit voltage would be at θ
    m.st.ph.fill(th0);
    info.main=add({k:'F',ports,N,gen:m,Gnow:P.genGamma(g,th0,new Float64Array(N*N)),p0:null,psi:new Float64Array(N),psi1:new Float64Array(N),i:new Float64Array(N),key:c.id});
    m.F=info.main;info.pins=[term[0],nN];info.gen=m;
    info.blk=mkBlock(c,p,'GEN3',{gen:m,ft:false});m.efdIn=info.blk.ins.efd??-1;m.tmIn=info.blk.ins.tm??-1;}
   else if(T==='SRM'){ // switched reluctance machine (3.6): R per phase, then a flux element with one port per phase; its Γ and ψ₀ are the
    // linearization of i(θ, ψ) at the flux of the previous step (values), and ω, θ advance after each committed step (srmStep)
    const g=P.srmMag(p);if(g.err)throw new NetlistError(`${c.label||c.id}: ${g.err}`);const N=g.N,ports=[],pr=[];
    for(let k=1;k<=N;k++){const a=node(c.id,'a'+k),b=node(c.id,'b'+k);ports.push([a,b]);pr.push([series(a,-1,num(p.Rs,.5)),b]);}
    const m={g,N,Nr:g.Nr,J:Math.max(num(p.J,.01),1e-9),b:Math.max(num(p.bm,0),0),sched:p.load==='sig'?null:(P.parseSched(p.TL)||[[0,0]]),st:{w:num(p.w0,0),the:num(p.th0,30)*Math.PI/180,te:0}};
    info.main=add({k:'F',ports:pr,N,srm:m,Gnow:new Float64Array(N*N),p0:new Float64Array(N),psi:new Float64Array(N),psi1:new Float64Array(N),i:new Float64Array(N),key:c.id});
    m.F=info.main;info.pins=ports[0];info.ports=ports;info.srm=m;info.blk=mkBlock(c,p,'SRM',{srm:m,ft:false});m.tl=info.blk.ins.tl??-1;}
   else if(T==='DCM'){ // armature R_a + L_a + gyrator (E = ψ·ω, τ_e = ψ·i_a); mechanics as a circuit: node ω, C = J, G = b, current source τ_L
    const a=node(c.id,'a'),bb=node(c.id,'b');info.pins=[a,bb];const psi=num(p.psi,1),J=Math.max(num(p.J,.02),1e-9),bm=Math.max(num(p.bm,0),0);
    const n1=num(p.Ra,0)>0?internal():a;if(n1!==a)add({k:'G',a,b:n1,R:num(p.Ra,.5),role:'Ra'});
    const n2=internal();info.La=add({k:'L',a:n1,b:n2,L:Math.max(num(p.La,1e-2),1e-9),i:num(p.ia0,0),key:c.id+'#La'});
    const m=internal();info.main=add({k:'GY',a:n2,b:bb,m,psi,row:row()});info.mech=add({k:'C',a:m,b:-1,C:J,v:num(p.w0,0),i:0,key:c.id+'#J'});
    if(bm>0)add({k:'G',a:m,b:-1,R:1/bm,role:'b'});
    const sched=P.parseSched(p.TL);if(p.load!=='sig'&&p.TL&&!sched)warnings.push(`${c.label||c.id}: μη έγκυρη ροπή φορτίου «${p.TL}».`);
    info.tl=add({k:'I',a:-1,b:m,I:sched?sched[0][1]:0,sched:p.load==='sig'?null:sched,sigIn:p.load==='sig'?sn(c.id,'tl'):undefined});
    info.blk=mkBlock(c,p,'DCM',{m,psi,gy:info.main,ft:false});}
   else if(T==='SH'){const sig=p.in==='sig',sh={id:c.id,label:c.label||c.id,src:sig?null:p.src,sig,qty:p.qty==='V'?'V':'I',clock:p.clock,trig:['start','mid','both'].includes(p.trig)?p.trig:'start',h0:p.init==='nan'?NaN:num(p.h0,0),h:NaN,last:null,n:0,log:{t:[],v:[]}};sh.h=sh.h0;shs.push(sh);info.sh=sh;
    info.blk=mkBlock(c,p,'SH',{sh,sig,ft:sig});
    if(!(p.clock&&['PWM','CLK'].includes(byId.get(p.clock)?.type)))warnings.push(`${c.label||c.id}: διάλεξε μπλοκ PWM ή Ρολόι ως φέρον (αλλιώς δεν παίρνει δείγματα).`);
    if(!sig&&!(p.src&&byId.get(p.src)))warnings.push(`${c.label||c.id}: διάλεξε το στοιχείο που μετρά.`);}
   else if(P.BLOCKS.has(T)){const b=mkBlock(c,p,T==='VP'?'VM':T==='IP'?'AM':T);info.blk=b;const st=b.st; // the probes (3.7) are a voltmeter to ground and an ammeter
    if(T==='VM'||T==='VP'){b.np=node(c.id,'p');b.nn=T==='VP'?-1:node(c.id,'n');info.pins=[b.np,b.nn];}
    else if(T==='AM'||T==='IP'){const a=node(c.id,'a'),bb=node(c.id,'b');info.pins=[a,bb];b.el=info.main=add({k:'V',a,b:bb,row:row(),src:{kind:'dc',V:0}});}
    else if(T==='MEAS'){b.src=p.src;b.qty=p.qty==='V'?'V':'I';if(!(p.src&&byId.get(p.src)))warnings.push(`${b.label}: διάλεξε το στοιχείο που μετρά.`);}
    else if(T==='CONST'){b.sched=P.parseSched(p.v);if(!b.sched){warnings.push(`${b.label}: μη έγκυρη τιμή «${p.v}», χρησιμοποιείται 0.`);b.sched=[[0,0]];}}
    else if(T==='GAIN')b.K=num(p.K,1);
    else if(T==='SUM'){const g=String(p.signs||'+-');b.sg=[0,1,2].map(i=>g[i]==='-'?-1:1);}
    else if(T==='DIV'){b.eps=Math.max(0,num(p.eps,1e-9));st.y=0;}
    else if(T==='SAT'){b.lo=num(p.lo,0);b.hi=num(p.hi,1);}
    else if(T==='CMP'){b.hys=Math.max(0,num(p.hys,0));st.s=0;st.f0=0;}
    else if(T==='LOGIC')b.op=p.op||'or';
    else if(T==='MOD3'){b.mode=['spwm','svpwm','square'].includes(p.mode)?p.mode:'svpwm';}
    else if(T==='FEST'){b.RR=num(p.RR,2);b.LM=Math.max(num(p.LM,.3),1e-9);st.pa=num(p.psi0,0);st.pb=0;st.t=0;st.u=[0,0,0];}
    else if(T==='EXPR'){const ins=Ex.names(p.ins),pars=Ex.params(p.pars);b.inNames=ins;b.parVals=Object.values(pars);b.expr=String(p.expr??'');b.optIns=Ex.names(p.opt,6,false); // 4.8.1: inputs that may stay unconnected (0) without a warning (library parts)
     try{b.ast=Ex.parse(b.expr,[...ins,...Object.keys(pars)]);}catch(e){warnings.push(`${b.label}: ${e.message} Η έξοδος είναι 0.`);b.ast=['num',0];}
     const cv={};b.parVals.forEach((c,k)=>{cv[ins.length+k]=c;});b.fn=Ex.compile(b.ast,cv);b.xv=new Array(ins.length).fill(0);}
    else if(T==='PY'){b.clock=p.clock;b.trig=['start','mid','both'].includes(p.trig)?p.trig:'start';b.y0=num(p.y0,0);st.last=null;st.ys=null;b.inNames=Ex.names(p.ins,6,false);
     b.outNames=Ex.names(p.outs,6,false).filter(k=>!b.inNames.includes(k));b.pars=Ex.params(p.pars);b.code=String(p.code??'');if(!b.outNames.length)warnings.push(`${b.label}: δεν έχει εξόδους.`);}
    else if(T==='NN'){nnBuild(b,p,warnings);if(!(p.clock&&['PWM','CLK'].includes(byId.get(p.clock)?.type)))warnings.push(`${b.label}: διάλεξε μπλοκ PWM ή Ρολόι (αλλιώς η έξοδος μένει ${b.y0}).`);}
    else if(T==='PIB'||T==='UD'){b.clock=p.clock;b.trig=['start','mid','both'].includes(p.trig)?p.trig:'start';b.y0=num(p.y0,0);st.last=null;st.y=b.y0;
     if(T==='PIB'){b.Kp=num(p.Kp,0);b.Ki=num(p.Ki,0);b.track=p.aw==='track';b.ymin=b.track?-Infinity:num(p.ymin,0);b.ymax=b.track?Infinity:num(p.ymax,1);st.xi=0;}else st.mem=b.y0;
     if(!(p.clock&&['PWM','CLK'].includes(byId.get(p.clock)?.type)))warnings.push(`${b.label}: διάλεξε μπλοκ PWM ή Ρολόι (αλλιώς η έξοδος μένει ${b.y0}).`);}
    else if(T==='SR'){st.q=p.q0==='1'?1:0;st.sp=0;}
    else if(T==='INT'){b.y0=num(p.y0,0);b.lo=num(p.lo,-1e9);b.hi=num(p.hi,1e9);b.wrap=p.wrap==='2pi';st.s=b.y0;st.u=0;st.t=0;}
    else if(T==='LPF'){b.tau=1/(2*Math.PI*Math.max(num(p.fc,1e3),1e-9));st.s=num(p.y0,0);st.u=0;st.t=0;}
    // 3.19: second-order filter (states: low-pass output and its derivative/ω₀), rate limiter, rate transition, edge detector
    else if(T==='F2'){b.kind=['lp','hp','bp','notch'].includes(p.kind)?p.kind:'lp';b.w0=2*Math.PI*Math.max(num(p.f0,1e3),1e-9);b.z=Math.max(num(p.zeta,.7071),1e-9);
     const u0=num(p.u0,0);st.s=[u0,0];st.u=u0;st.t=0;b.ft=b.kind==='hp'||b.kind==='notch';}
    else if(T==='RLIM'){b.up=Math.max(num(p.up,1e3),0);b.dn=Math.max(num(p.dn,1e3),0);st.s=num(p.y0,0);st.u=st.s;st.t=0;b.ft=false;}
    else if(T==='RT'){b.clock=p.clock;b.trig=['start','mid','both'].includes(p.trig)?p.trig:'start';b.y0=num(p.y0,0);b.mode=p.mode==='delay'?'delay':'zoh';st.last=null;st.y=b.y0;st.mem=b.y0;b.ft=b.mode==='zoh';
     if(!(p.clock&&['PWM','CLK'].includes(byId.get(p.clock)?.type)))warnings.push(`${b.label}: διάλεξε μπλοκ PWM ή Ρολόι (αλλιώς η έξοδος μένει ${b.y0}).`);}
    else if(T==='EDGE'){b.edge=['rise','fall','both'].includes(p.edge)?p.edge:'rise';b.tw=Math.max(0,num(p.tw,0));st.p=0;st.n=0;st.tOn=null;}
    else if(T==='CLARKE'||T==='ICLARKE')b.pw=p.inv==='pow';
    else if(T==='PLL'){const wn=2*Math.PI*Math.max(num(p.bw,20),1e-6);b.Kp=2*.7071*wn;b.Ki=wn*wn;b.w0=2*Math.PI*num(p.f0,50);st.th=num(p.th0,0)*Math.PI/180;st.w=b.w0;st.xi=0;st.t=0;}
    // 4.10: nearest-level modulation with sorting (a discrete block on a clock), and the single-phase SOGI-PLL
    else if(T==='NLC'){b.N=Math.max(1,Math.min(64,Math.round(num(p.N,10))));b.hb=p.cell==='hb';b.Vdc=Math.max(num(p.Vdc,1000),1e-9);b.avg=p.norm!=='nom';b.red=p.sel==='reduced';b.band=Math.max(num(p.band,20),0);
     b.clock=p.clock;b.trig=['start','mid','both'].includes(p.trig)?p.trig:'start';st.last=null;st.s=new Array(b.N).fill(0);st.n=0;st.sw=0;st.vav=b.Vdc;b.inV=Array.from({length:b.N},(_,k)=>'v'+(k+1));
     if(!(p.clock&&['PWM','CLK'].includes(byId.get(p.clock)?.type)))warnings.push(`${b.label}: διάλεξε μπλοκ PWM ή Ρολόι (αλλιώς οι υπομονάδες μένουν σε παράκαμψη).`);}
    else if(T==='SPLX'){const wn=2*Math.PI*Math.max(num(p.bw,20),1e-6);b.Kp=2*.7071*wn;b.Ki=wn*wn;b.w0=2*Math.PI*num(p.f0,50);b.k=Math.max(num(p.k,Math.SQRT2),1e-6);b.k0=Math.max(num(p.k0,0.1),0);b.ft=false;st.th=num(p.th0,0)*Math.PI/180;st.w=b.w0;st.xi=0;st.t=0;st.x0=0;st.x1=0;st.x2=0;st.d0=0;st.d1=0;st.d2=0;st.dxi=0;}
    else if(T==='CLK'||T==='RAMP'){b.f=Math.max(num(p.f,1e5),1e-6);b.ph=num(p.phase,0)/360;if(T==='CLK')b.duty=Math.min(1,Math.max(0,num(p.duty,.5)));else{b.shape=p.shape==='tri'?'tri':'saw';b.lo=num(p.lo,0);b.hi=num(p.hi,1);}}
   }
  }
  for(const e of els)if(e.fire){const r=compInfo.get(e.fire.refsrc);const src=r?.type==='VAC'?r.main.src:r?.type==='VAC3'?r.phases[0].e.src:null;
   if(src){e.fire.f=Math.max(src.f,1e-6);e.fire.ph0=src.ph+(src.Vpk<0?Math.PI:0);}else if(e.fire.refsrc)warnings.push(`${compInfo.get(e.cid)?.label||e.cid}: η πηγή αναφοράς δεν βρέθηκε· χρησιμοποιείται ${e.fire.f} Hz από t = 0.`);}
  // 3.7: parts with no conductive path to ground (e.g. a secondary without ground). 'auto': every node keeps G_min (or the
  // chosen leakage) to ground, so the part settles around a mean of 0 V; 'ref': one of its nodes at 0 V (1 Ω); 'error': stop.
  // Capacitors count as a path (their charge fixes the potential); ideal current sources do not.
  const islands=[];
  {const N=nNodes,par=Int32Array.from({length:N+1},(_,i)=>i),f=x=>{while(par[x]!==x){par[x]=par[par[x]];x=par[x];}return x;},u=(a,b)=>{const ra=f(a<0?N:a),rb=f(b<0?N:b);if(ra!==rb)par[ra]=rb;};
   for(const e of els){if(e.k==='I')continue;if(e.k==='X'){u(e.p1,e.p2);u(e.s1,e.s2);continue;}if(e.k==='TL'){u(e.a1,e.a2);u(e.b1,e.b2);continue;}if(e.k==='TLM'){for(let k=0;k<e.M;k++){u(e.n1[k],e.n2[k]);u(e.n1[k],-1);}continue;}if(e.ports){for(const [a,b] of e.ports)u(a,b);continue;}if(e.a!==undefined&&e.b!==undefined)u(e.a,e.b);}
   const g=f(N),grp=new Map();for(let i=0;i<N;i++){const r=f(i);if(r===g)continue;if(!grp.has(r))grp.set(r,[]);grp.get(r).push(i);}
   for(const nodes of grp.values())islands.push({nodes,pins:nodes.filter(i=>i<nets.length).map(i=>nets[i].canon),ref:island});
   if(islands.length&&island==='error')throw new NetlistError('Τμήμα του κυκλώματος χωρίς αγώγιμη σύνδεση με τη γείωση: '+islands.map(q=>cut(q.pins,3)||'εσωτερικοί κόμβοι').join(' · ')+'. Βάλε γείωση ή άλλαξε την επιλογή «Αιωρούμενα τμήματα».');
   for(const q of islands){if(island==='ref'){const r=q.nodes.find(i=>i<nets.length)??q.nodes[0];q.refPin=r<nets.length?nets[r].canon:null;els.push({k:'G',a:r,b:-1,R:1,cid:'#island',role:'ref'});}
    else if(rleak>0)for(const i of q.nodes)els.push({k:'G',a:i,b:-1,R:rleak,cid:'#island',role:'leak'});}}
  const tbase=num(SO.tbase,0)>0?num(SO.tbase,0):0; // time base when no source sets one (3.10), e.g. a Marx generator with charged capacitors
  // step (3.13): fixed T/N, or variable with error control (relative tolerance, largest step T/hmax)
  const step={mode:SO.step==='var'?'var':'fixed',rtol:Math.min(1e-2,Math.max(1e-7,num(SO.rtol,1e-5))),hmax:Math.max(1,num(SO.hmax,50)),trStart:SO.trStart==='be'?'be':'state'};
  const diag={unconn,island,rleak,skipped:[...skip].map(([id,why])=>({id,why})),open,freeEnds,freeNets,islands};
  const rowBase=nNodes;for(const e of els)if(e.row!==undefined)e.row+=rowBase;
  const sig=compileSignals(blocks,sigNets,ctrls,els,compInfo,warnings);
  return {nets,gnd,pinNet,nNodes,size:nNodes+nRows,els,ctrls,shs,compInfo,warnings,node,byId,sig,sigPin,diag,tbase,step,vec,units,hasPi};
 }

 // ---------------------------------------------------------------- signal graph (3.0)
 // Drivers of each signal net, inputs without a source, and the evaluation order: a block comes
 // after the blocks it reads directly (z⁻¹ has no direct feedthrough, so it breaks loops). A cycle of
 // direct-feedthrough blocks is an algebraic loop and is reported, never solved with a hidden delay.
 function compileSignals(blocks,sigNets,ctrls,els,compInfo,warnings){
  const drv=new Map(),dup=[];
  for(const b of blocks)for(const n of Object.values(b.outs))if(n>=0){if(drv.has(n))dup.push(drv.get(n).label+' / '+b.label);else drv.set(n,b);}
  if(dup.length)warnings.push('Δύο έξοδοι στο ίδιο σύρμα σήματος: '+dup.slice(0,4).join(', ')+'.');
  const loose=[];const chk=(n,name)=>{if(n<0||!drv.has(n))loose.push(name);};
  for(const b of blocks)for(const [k,n] of Object.entries(b.ins))if(!(b.type==='NN'&&k==='fz')&&!b.optIns?.includes(k))chk(n,b.label+'.'+k);
  // 4.8: a network that uses the weights of another (share): the same id in the same level of the circuit, the same sizes
  for(const b of blocks)if(b.type==='NN'){b.src=null;if(!b.share)continue;const pre=b.id.includes('/')?b.id.slice(0,b.id.lastIndexOf('/')+1):'';
   const s=blocks.find(q=>q!==b&&q.type==='NN'&&(q.id===pre+b.share||q.id===b.share));
   if(!s){warnings.push(`${b.label}: δεν υπάρχει μπλοκ NN «${b.share}» για τα βάρη· χρησιμοποιεί τα δικά του.`);continue;}
   if(JSON.stringify(s.st.net.sizes)!==JSON.stringify(b.st.net.sizes)){warnings.push(`${b.label}: το ${s.label} έχει άλλο μέγεθος (${s.st.net.sizes.join('-')} αντί για ${b.st.net.sizes.join('-')})· χρησιμοποιεί τα δικά του βάρη.`);continue;}
   b.src=s;} // the freeze input of a network is optional
  for(const k of ctrls)if(k.mode==='ext')chk(k.dIn,k.label+'.d');
  for(const e of els)if(e.gate==='sig'){const c=compInfo.get(e.cid);chk(e.gIn,(c?.label||e.cid)+'.g');}
  if(loose.length)warnings.push('Είσοδοι σήματος χωρίς πηγή (διαβάζονται ως 0): '+loose.slice(0,6).join(', ')+(loose.length>6?' …':'')+'.');
  const deps=blocks.map(b=>b.ft?[...new Set(Object.entries(b.ins).filter(([k,n])=>k!=='tr'&&n>=0&&drv.has(n)).map(([,n])=>drv.get(n)))]:[]);
  const indeg=blocks.map((b,i)=>deps[i].length),users=blocks.map(()=>[]);deps.forEach((d,i)=>d.forEach(p=>users[p.i].push(blocks[i])));
  const ready=blocks.filter((b,i)=>!indeg[i]),order=[];
  while(ready.length){ready.sort((a,b)=>a.id.localeCompare(b.id,undefined,{numeric:true}));const b=ready.shift();order.push(b);for(const u of users[b.i])if(--indeg[u.i]===0)ready.push(u);}
  if(order.length<blocks.length){const left=new Set(blocks.filter(b=>!order.includes(b)));
   // walk back along dependencies inside the remaining set until a block repeats
   let b=[...left][0];const path=[];while(!path.includes(b)){path.push(b);b=deps[b.i].find(p=>left.has(p));}
   const cyc=path.slice(path.indexOf(b)).reverse();
   throw new NetlistError('Αλγεβρικός βρόχος στα μπλοκ σημάτων: '+cyc.concat(cyc[0]).map(q=>q.label).join(' → ')+'. Βάλε μια «Καθυστέρηση z⁻¹» (ή S&H) μέσα στον βρόχο.');}
  return {nets:sigNets,n:sigNets.length,blocks,order,zc:blocks.filter(b=>b.type==='CMP'),drv};
 }
 // comparator crossing function: > 0 means "switch to 1" when the output is 0, < 0 "switch to 0" when it is 1.
 // A tiny built-in band (≈1e-9 relative) keeps the two thresholds apart when the hysteresis is zero.
 // 3.19: Φ = e^{A·dt} of the second-order filter, A = ω₀·[[0, 1], [−1, −2ζ]] (states: low-pass output, its derivative/ω₀).
 // e^{A·dt} = e^{σ·dt}·(C·I + S·(A − σI)), σ = −ζω₀, Δ = ω₀²(ζ² − 1): cosh/sinh, cos/sin or the series near Δ·dt² = 0.
 // The same lines are in engine/batch.py f2_phi.
 function f2Phi(w0,z,dt){const s=-z*w0,D=w0*w0*(z*z-1),x=D*dt*dt;let eC,eS;
  if(Math.abs(x)<1e-4){const e=Math.exp(s*dt);eC=e*(1+x/2+x*x/24+x*x*x/720);eS=e*dt*(1+x/6+x*x/120+x*x*x/5040);}
  else if(D>0){const r=Math.sqrt(D),ep=Math.exp((s+r)*dt),em=Math.exp((s-r)*dt);eC=(ep+em)/2;eS=(ep-em)/(2*r);}
  else{const r=Math.sqrt(-D),e=Math.exp(s*dt);eC=e*Math.cos(r*dt);eS=e*Math.sin(r*dt)/r;}
  const a=z*w0*eS,c=w0*eS;return [eC+a,c,-c,eC-a];}
 function cmpF(b,s,pv,nv){const g=pv-nv,tol=1e-9*(Math.abs(pv)+Math.abs(nv))+1e-12,h=Math.max(b.hys,4*tol)/2;return s?g+h-tol:g-h+tol;}

 // ---------------------------------------------------------------- dense LU
 // multiport conductance: port current i_k (a_k → b_k inside the element) = Σ_j c·G_kj·(v(a_j) − v(b_j))
 function stampM(ad0,ports,N,G,c){const ad=(r,q,v)=>{if(r>=0&&q>=0)ad0(r,q,v);};
  for(let k=0;k<N;k++)for(let j=0;j<N;j++){const g=c*G[k*N+j];if(!g)continue;const [ak,bk]=ports[k],[aj,bj]=ports[j];ad(ak,aj,g);ad(ak,bj,-g);ad(bk,aj,-g);ad(bk,bj,g);}}
 function luFactor(A,n,piv){
  for(let k=0;k<n;k++){let p=k,max=Math.abs(A[k*n+k]);for(let i=k+1;i<n;i++){const v=Math.abs(A[i*n+k]);if(v>max){max=v;p=i;}}
   if(max<1e-300)throw new NetlistError('Ιδιόμορφο σύστημα: βρόχος ιδανικών πηγών τάσης ή κόμβος χωρίς διαδρομή. Πρόσθεσε μικρή αντίσταση ή γείωση.');
   piv[k]=p;if(p!==k)for(let j=0;j<n;j++){const t=A[k*n+j];A[k*n+j]=A[p*n+j];A[p*n+j]=t;}
   const d=A[k*n+k];for(let i=k+1;i<n;i++){const f=A[i*n+k]/d;if(f===0)continue;A[i*n+k]=f;for(let j=k+1;j<n;j++)A[i*n+j]-=f*A[k*n+j];}}
 }
 function luSolve(A,n,piv,b){
  for(let k=0;k<n;k++){const p=piv[k];if(p!==k){const t=b[k];b[k]=b[p];b[p]=t;}}
  for(let i=1;i<n;i++){let s=b[i];for(let j=0;j<i;j++)s-=A[i*n+j]*b[j];b[i]=s;}
  for(let i=n-1;i>=0;i--){let s=b[i];for(let j=i+1;j<n;j++)s-=A[i*n+j]*b[j];b[i]=s/A[i*n+i];}
 }

 // ---------------------------------------------------------------- simulator
 class Sim{
  constructor(project,opts={}){this.opts={h:opts.h||null,hDiv:opts.hDiv||500,cap:opts.cap||0,mem:+opts.mem>0?+opts.mem:0,step:opts.step||null,solver:opts.solver||null,recDt:+opts.recDt>0?+opts.recDt:0,perN:Math.max(1,Math.round(+opts.perN||1))};this.method=opts.method||'TR';this.t=0;this.load(project,true);}
  // base period: first PWM, else first clock / ramp block, else first AC source, else 1 ms
  basePeriod(){if(this.net.ctrls.length)return this.net.ctrls[0].T;const ck=this.net.sig.blocks.find(b=>b.type==='CLK'||b.type==='RAMP');if(ck)return 1/ck.f;for(const c of this.net.compInfo.values())if(c.type==='VAC'||c.type==='VAC3')return 1/Math.max(1e-6,c.main.src.f);
   for(const c of this.net.compInfo.values())if(c.gen)return 1/c.gen.g.f; // 4.3: a network of generators runs on their period
   const lg=[...this.net.compInfo.values()].filter(c=>c.wave||c.line||c.tlm);if(lg.length)return Math.min(...lg.map(c=>c.wave?c.wave.T1:c.line?c.line.tau:Math.min(...c.tlm.modes.map(q=>+q.tau))));return this.net.tbase||1e-3;}
  // the step never exceeds the shortest line delay (the history at t − τ must be known)
  tlMaxStep(){let m=Infinity;for(const e of this.net.els){if(e.k==='TL')m=Math.min(m,e.ts);else if(e.k==='TLM')m=Math.min(m,e.tauMin);}return m;}
  setStep(hDiv,h){this.opts.hDiv=hDiv||this.opts.hDiv;this.opts.h=h||null;this.hUser=this.opts.h||this.T/this.opts.hDiv;this.h=Math.min(this.hUser,this.tlMaxStep());this.hv=null;this.varSetup();this.lteH=null;this.capDirty=true;}
  // ------------------------------------------------------------ variable step (3.13, ROADMAP §40)
  // the reactive states (L currents, C voltages, fluxes of the multiports): the local error, the two-step ringing check and the mode analysis use them
  stIndex(){const S=[];for(const e of this.net.els){if(e.k==='L')S.push({e,k:'L'});else if(e.k==='C')S.push({e,k:'C'});else if(e.k==='F')for(let j=0;j<e.N;j++)S.push({e,k:'F',j});}
   // the end currents of the lines take part in the local error too (their history is a state of the line), not in the mode analysis
   // and so do the states of the machines kept outside the circuit (rotor flux of the induction machine, speeds)
   const A=[...S];for(const e of this.net.els){if(e.k==='TL'){A.push({e,k:'T',j:0});A.push({e,k:'T',j:1});}else if(e.k==='TLM')for(let j=0;j<2*e.M;j++)A.push({e,k:'T',j});}
   for(const e of this.net.els)if(e.sai)A.push({e,k:'XI',s:'iL0'},{e,k:'XI',s:'iL1'},{e,k:'XV',s:'vc'});
   for(const e of this.net.els)if(e.k==='CHB')for(let j=0;j<e.N;j++)A.push({e,k:'B',j}); // 4.10: the cell capacitors of an arm
   for(const c of this.net.compInfo.values()){const e={cid:c.id};if(c.im){A.push({e,m:c.im,k:'M',f:'pa'},{e,m:c.im,k:'M',f:'pb'},{e,m:c.im,k:'W'});}else if(c.sm||c.srm)A.push({e,m:c.sm||c.srm,k:'W'});else if(c.gen)for(let j=0;j<c.gen.g.sh.N;j++)A.push({e,m:c.gen,k:'Wg',j});}
   this.stEls=S;this.stAll=A;const n=A.length;this.stKind=Uint8Array.from(A,q=>q.k==='C'||q.k==='XV'||q.k==='B'?0:q.k==='F'||q.k==='M'?2:q.k==='W'||q.k==='Wg'?3:1);
   if(!this.lteSc||this.lteSc.length!==n){this.lteSc=new Float64Array(n);this.ringD=new Float64Array(n);this.ringN=new Uint16Array(n);this.lteH=null;this.rx=null;}
   // reference magnitudes per kind, the floor of the tolerance (a state that starts from 0 is not held to 10⁻⁴ of nothing):
   // V from the sources and the initial capacitor voltages, I from the current sources, the initial currents and V/R (median R), ψ = V·T
   let Vr=0,Ir=0;const Rs=[];for(const e of this.net.els){if(e.k==='V'&&e.src){const q=e.src;Vr=Math.max(Vr,Math.abs(q.V||0),Math.abs(q.Vpk||0)+Math.abs(q.off||0));}
    else if(e.k==='C')Vr=Math.max(Vr,Math.abs(e.v));else if(e.k==='L')Ir=Math.max(Ir,Math.abs(e.i));else if(e.k==='I')Ir=Math.max(Ir,Math.abs(e.I||0));else if(e.k==='G'&&e.R>0&&!e.role)Rs.push(e.R);}
   for(const c of this.net.compInfo.values())if(c.wave)try{const w=c.wave,t1=w.T1||0;Vr=Math.max(Vr,Math.abs(P.waveAt(w,t1)),Math.abs(P.waveAt(w,3*t1)));}catch(e){}
   Rs.sort((a,b)=>a-b);const Rm=Rs.length?Rs[Rs.length>>1]:1;Vr=Vr||1;Ir=Math.max(Ir,Vr/Rm);this.stRef=[Vr,Ir,Vr*(this.T||1e-3),10];this.capDirty=true;}
  stVec(){const S=this.stAll,x=new Float64Array(S.length);for(let i=0;i<S.length;i++){const q=S[i],e=q.e;x[i]=q.k==='L'?e.i:q.k==='C'?e.v:q.k==='B'?e.vc[q.j]:q.k==='XI'||q.k==='XV'?e.sai[q.s]:q.k==='T'?e.iE[q.j]:q.k==='M'?q.m.st[q.f]:q.k==='W'?q.m.st.w:q.k==='Wg'?q.m.st.w[q.j]:e.psi[q.j];}return x;}
  stepCfg(){return {...this.net.step,...(this.opts.step||{})};}
  varSetup(){const c=this.stepCfg();this.var=c.mode==='var';this.rtol=c.rtol;const tl=this.tlMaxStep();
   this.hMax=Math.min(Math.max(this.T/c.hmax,this.h),tl);this.hMin=Math.min(this.hMax,Math.max(this.h*1e-3,this.T*1e-10));
   if(!(this.hv>0))this.hv=this.h;this.hv=Math.min(this.hMax,Math.max(this.hMin,this.hv));}
  setStepMode(patch){this.opts.step={...(this.opts.step||{}),...patch};this.hv=null;this.capDirty=true;this.varSetup();if(this.var)this.hv=this.hGrid(Math.max(this.hMin,this.h/64));this.lteH=null;}
  // variable steps on the grid h·2^(k/4), so the factorizations are reused
  hGrid(h){const k=Math.floor(4*Math.log2(h/this.h)+1e-9);return Math.min(this.hMax,this.hCap||Infinity,Math.max(this.hMin,this.h*Math.pow(2,k/4)));}
  // with the trapezoidal rule no step is longer than 2τ of a real mode of the circuit (not of the switch models), or the mode rings (μ < 0)
  // instead of decaying; found once per load at the largest step (stepcheck.js), up to 120 states
  // from 3.15 once per topology (the conducting switches and diodes): topoInfo keeps the modes and the cap of each one
  modeCap(){this.capDirty=false;this.hCap=null;this.topo=new Map();this.topoSig=null;if(!SC||!this.var||this.method!=='TR'||!this.stEls.length||this.stEls.length>120)return;
   const r=this.topoInfo();if(r?.cap){this.hCap=r.cap;this.hv=Math.min(this.hv,this.hCap);}}
  // ------------------------------------------------------------ topologies (3.15)
  // the conducting switches and diodes as a string; the modes of each topology once (up to 48 topologies, 120 states)
  swEls(){return this.swl||(this.swl=this.net.els.filter(e=>e.k==='S'||e.k==='D'));}
  topoKey(){let k='';for(const e of this.swEls())k+=e.on?'1':'0';return k;}
  topoInfo(){const key=this.topoKey();let r=this.topo.get(key);if(r)return r;if(this.topo.size>=48)return null;
   r={key,md:null,cap:null,noted:false};this.topo.set(key,r);
   const h=this.var?this.hMax:this.h;
   try{r.md=SC.modes(this,h);}catch(e){r.err=e.message;return r;}
   if(r.md&&this.var&&this.method==='TR'){let c=Infinity;for(const q of r.md.list){if(q.parasitic||!(q.abs>0)||Math.abs(q.im)>.1*Math.abs(q.re))continue;const tau=1/q.abs;if(tau>=this.hMin/2)c=Math.min(c,2*tau);}
    if(Number.isFinite(c))r.cap=Math.max(this.hMin,c);}
   return r;}
  // after a switching: the step check of the new topology (its messages once, those not in the check before the run),
  // and with the variable step and the trapezoidal rule the 2τ cap of that topology
  topoCheck(){if(!SC||!this.stEls||!this.stEls.length||this.stEls.length>120||!this.swEls().length){this.topoSig='';return;}
   const key=this.topoKey();if(key===this.topoSig)return;const first=this.topoSig===null;this.topoSig=key;
   if(this.topo.size>=48&&!this.topo.has(key)){this.note('topo:many',{sev:'info',grp:'step',id:null,msg:'Πάνω από 48 τοπολογίες (συνδυασμοί διακοπτών και διόδων που άγουν): ο έλεγχος του βήματος σταματά στις πρώτες 48.',fix:'Οι έλεγχοι κατά την προσομοίωση (ταλάντωση δύο βημάτων, μεταβλητό βήμα) ισχύουν κανονικά.'});return;}
   const r=this.topoInfo();if(!r)return;
   if(this.var&&this.method==='TR'){this.hCap=r.cap||null;if(r.cap)this.hv=Math.min(this.hv,r.cap);}
   if(r.noted||!r.md)return;r.noted=true;
   // the switching instant: the start of the step for a gate, its end for a diode, a comparator or a gap
   const tsw=first?this.t:this.endFlip?this.t:this.t-(this.hLast||0);
   const on=this.swEls().filter(e=>e.on).map(e=>this.net.compInfo.get(e.cid)?.label||e.cid).filter((x,i,a)=>x&&a.indexOf(x)===i);
   const onTxt=on.length?on.slice(0,5).join(', ')+(on.length>5?' …':''):'κανένας διακόπτης ή δίοδος';
   const where=`${first?'Στην αρχή':'Μετά από μεταγωγή'} (t = ${P.eng(tsw,'s',4)}, άγουν: ${onTxt})`;
   let msgs=[];try{msgs=SC.check(this,{modesOnly:true,md:r.md,cap:r.cap});}catch(e){}
   for(const m of msgs){const {key:k0,...rest}=m;this.note('topo:'+k0,{...rest,base:k0,topo:key,t:tsw,msg:`${where}: ${rest.msg}`});}
   // the 2τ cap of the trapezoidal rule in this topology, when it is far below the largest step
   if(this.var&&this.method==='TR'&&r.cap&&r.cap<this.hMax/100)
    this.note('topo:cap:'+key,{sev:'info',grp:'step',id:null,t:tsw,msg:`Όσο άγουν ${onTxt}, το μεταβλητό βήμα με τον τραπεζοειδή περιορίζεται στο 2τ = ${P.eng(r.cap,'s',3)} (μέγιστο ${P.eng(this.hMax,'s',3)}).`,
     fix:'Αν η γρήγορη σταθερά χρόνου δεν σε ενδιαφέρει, Gear/BDF2 δεν έχει αυτό το όριο και την αποσβένει· αλλιώς σταθερό βήμα με Backward Euler μετά από κάθε μεταγωγή.'});}
  lteReset(){this.lteH={t:[this.t],x:[this.stVec()]};}
  ltePush(){if(!this.lteH)return this.lteReset();const H=this.lteH;H.t.push(this.t);H.x.push(this.stVec());if(H.t.length>3){H.t.shift();H.x.shift();}}
  // local truncation error of the step just taken, from divided differences over the last points:
  // TR h³|x‴|/12, BDF2 (2/9)h³|x‴|, BE h²|x″|/2, against rtol·(|x|max + 10⁻³·(the largest state of the same kind + its reference)).
  // Error per step: in a lightly damped oscillation the global error grows with the number of periods.
  lteErr(h,mode){const H=this.lteH;if(!H)return null;const m=H.t.length;if(m<2||(mode!=='BE'&&m<3))return null;
   const x3=this.stVec(),t3=this.t,n=x3.length,sc=this.lteSc,K=this.stKind,kmax=[0,0,0,0];
   for(let i=0;i<n;i++){const a=Math.abs(x3[i]);if(a>sc[i])sc[i]=a;if(sc[i]>kmax[K[i]])kmax[K[i]]=sc[i];}
   let err=0,arg=-1;const rt=this.rtol,ref=this.stRef,t2=H.t[m-1],t1=H.t[m-2],t0=m>=3?H.t[m-3]:0,X2=H.x[m-1],X1=H.x[m-2],X0=m>=3?H.x[m-3]:null;
   for(let i=0;i<n;i++){const d23=(x3[i]-X2[i])/(t3-t2),d12=(X2[i]-X1[i])/(t2-t1),dd123=(d23-d12)/(t3-t1);let lte;
    if(mode==='BE')lte=h*h*Math.abs(dd123);
    else{const d01=(X1[i]-X0[i])/(t1-t0),dd012=(d12-d01)/(t2-t0),ddd=(dd123-dd012)/(t3-t0);lte=(mode==='BDF2'?4/3:.5)*h*h*h*Math.abs(ddd);}
    const r=lte/(rt*(sc[i]+1e-3*(kmax[K[i]]+ref[K[i]]))+1e-300);if(r>err){err=r;arg=i;}}
   return {err,arg,q:mode==='BE'?2:3};}
  // after a step of the variable-step solver: accept (and pick the next step), or restore and retry smaller (returns true)
  varCheck(h,snap,be,evEnd){
   if(this.lastSmooth&&!this.lastDisc){const r=this.lteErr(h,this.lastMode);
    if(r){
     if(r.err>1&&h>this.hMin*(1+1e-9)&&this.nRejRow<40){this.restoreState(snap);this.beLeft=be;this.nRej++;this.nRejRow++;
      this.hv=this.hGrid(Math.max(this.hMin,h*Math.max(.2,.9*Math.pow(r.err,-1/r.q))));return true;}
     if(r.err>1){const q=this.stAll[r.arg],id=q?.e.cid||null,lb=id?(this.net.compInfo.get(id)?.label||id):'';
      this.note('minstep:'+id,{sev:'info',up:50,grp:'step',id,msg:`Το μεταβλητό βήμα έφτασε στο ελάχιστο (${P.eng(this.hMin,'s',3)}) χωρίς να πιάσει την ανοχή ${this.rtol}${lb?' ('+lb+')':''}.`,
       fix:'Μικρότερο βήμα T/N (το ελάχιστο είναι T/N·10⁻³) ή χαλαρότερη ανοχή. Συχνά σημαίνει ασυνέχεια που δεν είναι συμβάν, π.χ. σήμα που αλλάζει απότομα.'});}
     const p=h*Math.min(4,.9*Math.pow(Math.max(r.err,1e-12),-1/r.q));
     this.hv=this.hGrid(p<this.hv?p:h>=.5*this.hv?Math.min(p,2*this.hv):this.hv);}}
   this.nRejRow=0;
   // a switching or an event: the history restarts there (the solution is smooth only piecewise); after a switching the next step starts smaller
   if(this.lastDisc||evEnd){this.lteReset();}else this.ltePush();
   return false;}
  // ------------------------------------------------------------ diagnostics (3.13)
  note(key,rec){const d=this.dg||(this.dg=new Map());const o=d.get(key);if(o){o.n++;o.tLast=this.t;if(o.up&&o.n>=o.up&&o.sev==='info'){o.sev='warn';this.dgVer++;}return o;}
   const r={key,src:'browser',t:this.t,n:1,...rec};d.set(key,r);this.dgVer=(this.dgVer||0)+1;return r;}
  // checks before the run: modes against the step, sources, lines (stepcheck.js); kept until the next check
  stepCheck(){this.dgPre=SC?SC.check(this).map(r=>({src:'browser',pre:true,t:null,n:1,...r})):[];this.dgVer=(this.dgVer||0)+1;return this.dgPre;}
  diagnostics(){const pre=this.dgPre||[],keys=new Set(pre.map(r=>r.key));
   return [...pre,...(this.dg?[...this.dg.values()].filter(r=>!(r.base&&keys.has(r.base))):[])];}
  // trapezoidal two-step ringing: the change of a state alternates in sign, step after step, around a slower trend
  ringCheck(){const x=this.stVec(),n=x.length,X=this.rx;this.rx=x;if(!n||!X||X.length!==n)return;
   const D=this.ringD,N=this.ringN,sc=this.lteSc,ns=this.stEls.length;
   for(let i=0;i<ns;i++){const a=Math.abs(x[i]);if(a>sc[i])sc[i]=a;const d=x[i]-X[i],dp=D[i];D[i]=d;
    if(dp*d<0&&Math.abs(d+dp)<.5*(Math.abs(d)+Math.abs(dp))&&Math.abs(d-dp)>2e-3*sc[i]){if(++N[i]===8){const id=this.stEls[i].e.cid,lb=this.net.compInfo.get(id)?.label||id;
      this.note('ring:'+id,{sev:'warn',grp:'step',id,msg:`Ταλάντωση δύο βημάτων του τραπεζοειδούς στο ${lb} (t = ${P.eng(this.t,'s',4)}): η τιμή πηγαίνει πάνω-κάτω σε κάθε βήμα.`,
       fix:'Το βήμα είναι πολύ μεγαλύτερο από μια σταθερά χρόνου του κυκλώματος. Μικρότερο βήμα, μεταβλητό βήμα, ή Gear/BDF2 που την αποσβένει.'});}}
    else N[i]=0;}}
  // backward-Euler map of the reactive states over h with the sources off, at the present switch states
  // (step checks): column k = the states after one step from state k = 1 and all others 0
  stateMap(h){const S=this.stEls;if(!S||!S.length)return null;const ns=S.length,n=this.n;
   const keep=this.net.els.filter(e=>e.k==='F').map(e=>[e,e.cc]);try{return this.stateMap0(h,S,ns,n);}finally{for(const [e,c] of keep)e.cc=c;}}
  stateMap0(h,S,ns,n){
   this.values(this.t);if(this.hasCPL||this.hasNL){this.cplLinearize();this.nlLinearize();}
   const F0=this.factor(h,'BE');const A=F0.A,piv=F0.piv;
   const M=new Float64Array(ns*ns),b=new Float64Array(n),J=(a,c,j)=>{if(a>=0)b[a]-=j;if(c>=0)b[c]+=j;};
   for(let k=0;k<ns;k++){b.fill(0);const sk=S[k],e=sk.e;
    if(sk.k==='L')J(e.a,e.b,1);else if(sk.k==='C')J(e.a,e.b,-e.C/h);else{const N=e.N,G=e.Gnow;for(let q=0;q<N;q++)J(e.ports[q][0],e.ports[q][1],G[q*N+sk.j]);}
    if(F0.sp)SPM.solve(F0.sp,b,this.spw);else luSolve(A,n,piv,b);const V=i=>i<0?0:b[i];
    for(let i=0;i<ns;i++){const q=S[i],f=q.e;let y;
     if(q.k==='L')y=h/f.L*(V(f.a)-V(f.b))+(i===k?1:0);else if(q.k==='C')y=V(f.a)-V(f.b);else{const pp=f.ports[q.j];y=(i===k?1:0)+h*(V(pp[0])-V(pp[1]));}
     M[i*ns+k]=y;}}
   return {m:M,n:ns};}
  load(project,fresh){
   const old=this.net;const net=buildNetlist(project);
   if(old&&!fresh){ // carry states by key
    const st=new Map();for(const e of old.els)if(e.key)st.set(e.k+e.key,e);
    for(const e of net.els)if(e.key&&st.has(e.k+e.key)){const o=st.get(e.k+e.key);if(e.k==='L')e.i=o.i;if(e.k==='C'){e.v=o.v;e.i=o.i;}if(e.k==='D'){e.on=o.on;if(e.gap){e.trigDone=o.trigDone;e.Dacc=o.Dacc||0;}}if(e.k==='CHB'&&o.N===e.N){e.vc.set(o.vc);e.vc1.set(o.vc1);e.i=o.i;e.s.set(o.s);e.sKey=o.sKey;}
     if(e.k==='F'&&o.N===e.N&&!e.sm===!o.sm&&!e.srm===!o.srm&&!e.gen===!o.gen){e.i.set(o.i);if(e.sm||e.srm||e.gen){e.psi.set(o.psi);e.psi1.set(o.psi1);}else{for(let k=0;k<e.N;k++){let s=0;for(let j=0;j<e.N;j++)s+=e.Lm[k*e.N+j]*e.i[j];e.psi[k]=s;}e.psi1.set(e.psi);}}}
    const oc=new Map(old.ctrls.map(c=>[c.id,c]));for(const c of net.ctrls){const o=oc.get(c.id);if(o&&o.mode===c.mode&&o.T===c.T){c.xi=o.xi;c.d=o.d;c.k=o.k;c.tk=o.tk;c.tkPrev=o.tkPrev;c.dPrev=o.dPrev;c.dPrevOff=o.dPrevOff;c.dOn=o.dOn;c.dOff=o.dOff;c.h=c.upd===o.upd?o.h:null;c.meas=o.meas;c.refNow=o.refNow;c.ePrev=o.ePrev;c.dF=o.dF;}}
    for(const e of net.els)if(e.k==='CPL'){const o=old.els.find(x=>x.k==='CPL'&&x.cid===e.cid);if(o)e.v0=o.v0;}
    for(const e of net.els)if(e.k==='TL'){const o=old.els.find(x=>x.k==='TL'&&x.key===e.key);if(o&&o.N===e.N&&o.H.c.length===e.H.c.length){e.H=o.H;e.iE.set(o.iE);}} // the waves on a line keep travelling (same number of sections)
    const os=new Map(old.shs.map(q=>[q.id,q]));for(const q of net.shs){const o=os.get(q.id);if(o){q.h=o.h;q.last=q.trig===o.trig&&q.clock===o.clock?o.last:null;q.n=o.n;q.log=o.log;}}
    for(const [id,c] of net.compInfo)if(c.im){const o=old.compInfo.get(id);if(o?.im)c.im.st={...o.im.st};} // the machine keeps its flux and speed
    for(const [id,c] of net.compInfo)if(c.sm){const o=old.compInfo.get(id);if(o?.sm)c.sm.st={...o.sm.st};}
    for(const [id,c] of net.compInfo)if(c.srm){const o=old.compInfo.get(id);if(o?.srm&&o.srm.N===c.srm.N)c.srm.st={...o.srm.st};}
    for(const [id,c] of net.compInfo)if(c.gen){const o=old.compInfo.get(id)?.gen;if(o&&o.g.sh.N===c.gen.g.sh.N){c.gen.st=genCopy(o.st);c.gen.Efd0=o.Efd0;c.gen.Tm0=o.Tm0;}} // the generator keeps its shaft and its steady values
    const ob=new Map(old.sig.blocks.map(b=>[b.id,b]));for(const b of net.sig.blocks){const o=ob.get(b.id);if(o&&o.type===b.type&&b.type!=='SH'){const nw=b.type==='NN'&&o.st.wsig!==b.wsig?{net:b.st.net,opt:b.st.opt,wsig:b.wsig,n:0,m2:0,L:0}:null;b.st={...b.st,...o.st,...(nw||{})};if(b.clock!==o.clock||b.trig!==o.trig)b.st.last=null;}}
   }
   this.net=net;this.jsc=null;this.swl=null;this.topo=new Map();this.topoSig=null;this.jumpNow=false;this.leftAt=null;const nb=net.sig.blocks.length;this.sv=new Float64Array(net.sig.n);this.svT=new Float64Array(net.sig.n);this.yb=new Float64Array(nb);this.ybT=new Float64Array(nb);
   this.yo=net.sig.blocks.map(b=>new Float64Array(b.outList.length));this.yoT=net.sig.blocks.map(b=>new Float64Array(b.outList.length));this.ctrlById=new Map(net.ctrls.map(k=>[k.id,k]));this.clkById=new Map(net.sig.blocks.filter(b=>b.type==='CLK').map(b=>[b.id,b]));this.shById=new Map(net.shs.map(q=>[q.id,q]));this.n=net.size;{const sv=this.opts.solver||project?.sim?.solver||'auto';this.sparse=!!SPM&&(sv==='sparse'||(sv!=='dense'&&this.n>=SPARSE_MIN));}this.sp=null;this.spq=null;this.rec=null;this.A=this.sparse?null:new Float64Array(this.n*this.n);this.lustat={fact:0,hit:0,miss:0};this.piv=new Int32Array(this.n);this.b=new Float64Array(this.n);this.cache=new Map();
   if(!this.x||this.x.length!==this.n||fresh)this.x=new Float64Array(this.n);
   this.pyBlocks(old&&!fresh?old:null);
   this.ims=[...net.compInfo.values()].filter(c=>c.im).map(c=>c.im);for(const m of this.ims)this.imSources(m);
   this.sms=[...net.compInfo.values()].filter(c=>c.sm).map(c=>c.sm);for(const m of this.sms)this.smOutputs(m);
   this.srms=[...net.compInfo.values()].filter(c=>c.srm).map(c=>c.srm);for(const m of this.srms)this.srmOutputs(m);
   this.gens=[...net.compInfo.values()].filter(c=>c.gen).map(c=>c.gen);this.hasTV=this.sms.length+this.srms.length+this.gens.length>0;
   this.hasCPL=net.els.some(e=>e.k==='CPL');this.hasNL=net.els.some(e=>e.k==='NL');this.arcEls=net.els.filter(e=>e.arc);this.saiEls=net.els.filter(e=>e.sai);this.chbEls=net.els.filter(e=>e.k==='CHB');for(const e of this.chbEls)if(e.sKey===undefined)e.sKey='0'.repeat(e.N);this.footEls=net.els.filter(e=>e.foot);footLink(net,this.footEls);
   if(old&&!fresh)for(const e of net.els)if(e.k==='NL'){const o=old.els.find(x=>x.k==='NL'&&x.cid===e.cid);if(o){e.v0=o.v0;if(o.sai&&e.sai)for(const k of SAI_ST)e.sai[k]=o.sai[k];}}this.lossList=[...net.compInfo.values()].filter(c=>c.loss);
   if(old&&!fresh)for(const c of this.lossList){const o=old.compInfo.get(c.id)?.loss;if(o){c.loss.P=o.P;c.loss.Etot=o.Etot;c.loss.n=o.n;}}this.T=this.basePeriod();this.hUser=this.opts.h||this.T/this.opts.hDiv;this.h=Math.min(this.hUser,this.tlMaxStep());
   if(fresh){this.hv=null;this.dg=new Map();this.dgPre=[];this.nRej=0;this.nRejRow=0;this.nTiny=0;}this.stIndex();this.varSetup();this.lteH=null;this.rx=null;
   if(fresh&&this.var)this.hv=this.hGrid(Math.max(this.hMin,this.h/64)); // the first steps (backward Euler, no history yet) start small and grow ×2 per step
   const keys=this.channelKeys();const same=!fresh&&this.keys&&keys.join('|')===this.keys.join('|');
   this.keys=keys;this.chIndex=new Map(keys.map((k,i)=>[k,i]));
   if(!same)this.allocRecord();
   this.project=project;
   if(fresh){this.progInit(project.program);this.evInit();}
   if(fresh){this.t=0;this.beLeft=2;this.prevSig='';this.periodsDone=0;this.started=false;this.steps=0;this.changes=[];for(const c of net.ctrls){c.k=null;c.xi=0;}
    // carrier phase and duty first (the initial switch states depend on them), then the
    // (4.3: the steady start of a load flow, acInit, which needs no backward-Euler steps)
    // consistent solution, the samples due at t = 0 and the controllers measuring it
    // signal blocks first too: a PWM with its duty on a signal pin needs it before the first solution
    this.evalBlocks('init',true);this.sampleControllers(true);const x0=acInit(this);this.initialSolve(x0);if(x0){this.beLeft=0;this.prevSig=this.gateSigPeek(this.h/2);}for(const m of this.gens)this.genOutputs(m);this.sampleHolds();this.evalBlocks('sample',true);this.sampleControllers(true);this.recordNow();}
   else{this.beLeft=2;for(const m of this.gens)this.genOutputs(m);this.evalBlocks('commit');this.sampleControllers(false);this.computeVals();}
   return net.warnings;
  }
  reset(project){this.load(project||this.project,true);}
  // induction machine: ψ_R by the trapezoidal rule with ω held over the step (ψ enters linearly), then the mechanics;
  // the sources e = −(R_R/L_M − jω_r)ψ_R are set for the next step (one step behind: h ≪ L_M/R_R and h·ω_r ≪ 1)
  imStep(m,h){const s=m.st,ia=m.ph[0].L.i,ib=m.ph[1].L.i,ic=m.ph[2].L.i,al=(2*ia-ib-ic)/3,be=(ib-ic)/Math.sqrt(3);
   const wr=m.p*s.w,g=m.RR/m.LM,k=h/2,a11=1+k*g,a12=k*wr,r1=(1-k*g)*s.pa-k*wr*s.pb+k*m.RR*(s.ia+al),r2=(1-k*g)*s.pb+k*wr*s.pa+k*m.RR*(s.ib+be),det=a11*a11+a12*a12;
   s.pa=(a11*r1-a12*r2)/det;s.pb=(a11*r2+a12*r1)/det;s.ia=al;s.ib=be;
   s.te=1.5*m.p*(s.pa*be-s.pb*al);const tl=m.tl>=0?(this.sv?this.sv[m.tl]:0):schedAt(m.sched,this.t+h,m.sched[0][1]);
   s.w+=h*(s.te-tl-m.b*s.w)/m.J;s.th+=h*s.w;this.imSources(m);}
  // synchronous machine: θ advanced with the ω used to predict Γ(θ) over the step, then torque and ω (leapfrog: the stored ω is half a step
  // ahead of θ, so the output ω_o = ω − (h/2)·dω/dt is the speed at the end of the step)
  smStep(m,h){const s=m.st;s.the+=h*m.p*s.w;this.smOutputs(m);const tl=m.tl>=0?(this.sv?this.sv[m.tl]:0):schedAt(m.sched,this.t+h,m.sched[0][1]),a=(s.te-tl-m.b*s.w)/m.J;s.w+=h*a;s.wo=s.w-h/2*a;}
  // switched reluctance machine: as the synchronous machine, with the torque summed over the phases from the co-energy
  srmStep(m,h){const s=m.st;s.the+=h*m.Nr*s.w;this.srmOutputs(m);const tl=m.tl>=0?(this.sv?this.sv[m.tl]:0):schedAt(m.sched,this.t+h,m.sched[0][1]),a=(s.te-tl-m.b*s.w)/m.J;s.w+=h*a;s.wo=s.w-h/2*a;}
  srmOutputs(m){let te=0;for(let k=0;k<m.N;k++)te+=P.srmTorque(m.g,m.st.the-2*Math.PI*k/m.N,m.F.i[k]);m.st.te=te;}
  smOutputs(m){const o=smOut(m,m.F.psi,m.F.i,m.st.the);m.st.te=o.te;m.st.id=o.id;m.st.iq=o.iq;}
  // generator (4.3): the angles advance with the speeds of the half step (leapfrog, as the synchronous machine), then the torques at the
  // end of the step (electrical on the generator mass, T_m by the shares, springs, damping) give the speeds of the next half step.
  // Per unit: 2H·dω/dt = ΣT, dφ/dt = ω_b·ω (φ in electrical rad); the output ω is at the end of the step
  genStep(m,h){const g=m.g,sh=g.sh,s=m.st,N=sh.N;for(let i=0;i<N;i++)s.ph[i]+=h*g.wb*s.w[i];
   this.genOutputs(m);const Tm=this.genTm(m,this.t+h);
   for(let i=0;i<N;i++){let T=Tm*sh.fr[i]-sh.D[i]*(s.w[i]-1);if(i===sh.gm)T+=s.tem;
    if(i>0)T+=sh.K[i-1]*(s.ph[i-1]-s.ph[i])+sh.Dmu[i-1]*(s.w[i-1]-s.w[i]);if(i<N-1)T-=sh.K[i]*(s.ph[i]-s.ph[i+1])+sh.Dmu[i]*(s.w[i]-s.w[i+1]);
    const a=T/(2*sh.H[i]);s.w[i]+=h*a;s.wo[i]=s.w[i]-h/2*a;}
   for(let i=0;i<N-1;i++)s.ts[i]=sh.K[i]*(s.ph[i]-s.ph[i+1]);}
  // torque (pu, motor sense: on the rotor in the direction of rotation), P and Q delivered, |V| (pu), field current (pu on the air-gap line)
  genOutputs(m){const g=m.g,s=m.st,F=m.F,th=s.ph[g.sh.gm],pdq=P.genDQ(F.psi,th),idq=P.genDQ(F.i,th);
   s.tem=(pdq[0]*idq[1]-pdq[1]*idq[0])*g.wb/g.Sn;s.id=idq[0];s.iq=idq[1];s.ifd=F.i[3]*g.ifK;
   const vn=this.V(m.nN),v=m.term.map(t=>this.V(t)-vn),i=F.i;
   s.pe=-(v[0]*i[0]+v[1]*i[1]+v[2]*i[2])/g.Sn;s.qe=-((v[1]-v[2])*i[0]+(v[2]-v[0])*i[1]+(v[0]-v[1])*i[2])/(Math.sqrt(3)*g.Sn);
   s.vt=Math.hypot(Math.sqrt(2/3)*(v[0]-(v[1]+v[2])/2),(v[1]-v[2])/Math.SQRT2)/g.Un;}
  genTm(m,t){return m.mech==='sig'?(m.tmIn>=0&&this.sv?this.sv[m.tmIn]:0):m.mech==='sched'?schedAt(m.tmS,t,m.tmS[0][1]):m.Tm0;}
  genEfd(m,t){return m.exc==='sig'?(m.efdIn>=0&&this.sv?this.sv[m.efdIn]:0):m.exc==='sched'?schedAt(m.efdS,t,m.efdS[0][1]):m.Efd0;}
  imSources(m){const s=m.st,wr=m.p*s.w,g=m.RR/m.LM,ea=-g*s.pa-wr*s.pb,eb=-g*s.pb+wr*s.pa,Q=Math.sqrt(3)/2;m.ph[0].V.imE=ea;m.ph[1].V.imE=-ea/2+Q*eb;m.ph[2].V.imE=-ea/2-Q*eb;}
  pyBlocks(old){const bs=this.net.sig.blocks.filter(b=>b.type==='PY');const prev=new Map((old?.sig.blocks||[]).filter(b=>b.type==='PY'&&b.rt).map(b=>[b.id,b]));
   if(bs.length){const R=root.PyRT,lazy=!!(R&&!R.ready&&R.lazy);if(!R||(!R.ready&&!lazy)){const e=new NetlistError('Το κύκλωμα έχει μπλοκ Python: φορτώνεται η Python (Pyodide)…');e.needPython=true;throw e;}
    for(const b of bs){const g=this.shGrid(b),Ts=g?g.d:0;if(!g)this.net.warnings.push(`${b.label}: χωρίς ρολόι δεν καλείται ποτέ (διάλεξε PWM ή μπλοκ Ρολόι).`);
     b.sig=JSON.stringify([b.code,b.inNames,b.outNames,b.pars,Ts]);const o=prev.get(b.id),opt={ins:b.inNames,outs:b.outNames,pars:b.pars,Ts,label:b.label};
     // 4.8: without Python on the page a stand-in (PyRT.stub); a stand-in becomes the real block when Python is there
     if(o&&o.sig===b.sig&&!(o.rt?.lazy&&R.ready)){b.rt=o.rt;prev.delete(b.id);}
     else{try{b.rt=lazy?R.stub(opt):R.make(b.code,opt);if(o&&o.sig===b.sig&&o.rt?.lazy){b.rt.setState(o.rt.state);prev.delete(b.id);}}catch(e){const ne=new NetlistError(e.message);ne.py=true;throw ne;}if(o&&o.sig!==b.sig){b.st.ys=null;b.st.last=null;}}}}
   for(const o of prev.values())o.rt?.destroy?.();}
  // 4.8: Python blocks with stand-ins (the page without the interpreter), and the real blocks in their place once it is
  // loaded, with the state they carry (from a run in the worker)
  pyLazy(){return this.net.sig.blocks.some(b=>b.type==='PY'&&b.rt&&b.rt.lazy);}
  // (at t = 0 the circuit is built again: the stand-ins gave zeros for the first sample)
  pyUpgrade(){const R=root.PyRT;if(!R||!R.ready)return false;if(!(this.t>0)){if(this.pyLazy())this.load(this.project,true);return true;}for(const b of this.net.sig.blocks){if(b.type!=='PY'||!b.rt?.lazy)continue;const st=b.rt.state,o=b.rt.o;
    try{b.rt=R.make(b.code,o);b.rt.setState(st);}catch(e){const ne=new NetlistError(e.message);ne.py=true;throw ne;}}return true;}
  setMethod(m){this.method=['TR','BE','BDF2'].includes(m)?m:'TR';this.cache.clear();this.beLeft=Math.max(this.beLeft,1);this.capDirty=true;}
  setControl(id,patch){const k=this.net.ctrls.find(c=>c.id===id);if(!k)return false;Object.assign(k,patch);return true;}
  // a block on a bus (3.18) is one block per element, <id>[k]: a live change reaches every element
  setBlock(id,patch){const n=this.net.vec?.[id],bs=n?this.net.sig.blocks.filter(q=>q.id.startsWith(id+'[')):this.net.sig.blocks.filter(q=>q.id===id);if(!bs.length)return false;
   for(const b of bs)Object.assign(b,patch);if('sched' in patch)this.jsc=null;this.evalBlocks('commit');this.computeVals();return true;}
  setHold(id,patch){const q=this.shById.get(id);if(!q)return false;if(patch.trig&&patch.trig!==q.trig)q.last=null;Object.assign(q,patch);return true;}
  // a change made by the user while running: drawn on the scope and kept so it can be replayed
  markChange(rec){(this.changes||(this.changes=[])).push({t:this.t,...rec});if(this.changes.length>5000)this.changes.shift();
   this.logEv(rec.prog?'program':'live',rec.id+'.'+rec.k,rec.v,{id:rec.id,from:rec.from,...(rec.rate?{rate:rec.rate}:{})});}
  // 3.19: program of parameter changes (project.program = [{t, id, k, v, rate?}], §4). At t the part's parameter changes as a
  // live change does (load with the states kept), so a live session written as a program runs again bit for bit. With a
  // rate (units/s) the change is a ramp in steps of T/50 at most (200 steps at most), from the value at t.
  progInit(list){this.prog=(Array.isArray(list)?list:[]).filter(e=>e&&Number.isFinite(+e.t)&&e.id&&e.k).map(e=>({t:+e.t,id:String(e.id),k:String(e.k),v:e.v,...(+e.rate>0?{rate:+e.rate}:{})})).sort((a,b)=>a.t-b.t);this.progI=0;}
  addProgram(e){if(!this.prog)this.progInit([]);const q={t:Number.isFinite(+e.t)?Math.max(+e.t,this.t):this.t,id:String(e.id),k:String(e.k),v:e.v,...(+e.rate>0?{rate:+e.rate}:{}),...(e.live?{live:true}:{})};
   let i=this.prog.length;while(i>this.progI&&this.prog[i-1].t>q.t)i--;this.prog.splice(i,0,q);return q;}
  progNext(){return this.prog&&this.progI<this.prog.length?this.prog[this.progI].t:Infinity;}
  progDue(eps){let n=0;while(this.prog&&this.progI<this.prog.length&&this.prog[this.progI].t<=this.t+eps){this.progApply(this.prog[this.progI++]);n++;}return n;}
  progApply(e){const pr=JSON.parse(JSON.stringify(this.project)),c=(pr.components||[]).find(x=>x.id===e.id);
   if(!c){this.note('prog:'+e.id,{sev:'warn',grp:'live',id:e.id,msg:`Πρόγραμμα αλλαγών: δεν υπάρχει το στοιχείο ${e.id} (t = ${P.eng(e.t,'s',4)}).`,fix:'Διόρθωσε ή σβήσε τη γραμμή του προγράμματος στις ρυθμίσεις του κυκλώματος.'});return;}
   const pd=P.defaults(c.type)||{},from=(c.params||{})[e.k]??pd[e.k];
   if(e.rate>0&&!e.part){const v0=typeof from==='number'?from:P.parseEng(String(from)),v1=+e.v;
    if(Number.isFinite(v0)&&Number.isFinite(v1)&&v1!==v0){const dur=Math.abs(v1-v0)/e.rate,n=Math.max(1,Math.min(200,Math.ceil(dur/(this.T/50)-1e-9)));
     const pts=Array.from({length:n},(_,j)=>({t:e.t+dur*(j+1)/n,id:e.id,k:e.k,v:j+1===n?v1:v0+(v1-v0)*(j+1)/n,part:true}));
     const rest=this.prog.slice(this.progI).concat(pts).sort((a,b)=>a.t-b.t);this.prog.length=this.progI;this.prog.push(...rest);
     this.markChange({id:e.id,k:e.k,v:v1,label:`${c.label||e.id}: ${e.k} → ${P.eng(v1,'',4)} με ${P.eng(e.rate,'/s',3)}`,from,rate:e.rate,prog:true,live:!!e.live});return;}}
   c.params={...(c.params||{}),[e.k]:e.v};this.load(pr,false);
   // the name of the parameter as in its form; yes/no and choices as words (4.8)
   if(!e.part){const d=P.PARTS[c.type]?.params?.find?.(q=>q.k===e.k),vt=typeof e.v==='number'?P.eng(e.v,'',4):typeof e.v==='boolean'?(e.v?'ναι':'όχι'):String((d?.options||[]).find(o=>String(o[0])===String(e.v))?.[1]??e.v);
    this.markChange({id:e.id,k:e.k,v:e.v,label:`${c.label||e.id}: ${d?.label||e.k} → ${vt}`,from,prog:true});}}
  // 3.19: the event log (§3): switchings, comparator and latch changes, edges, discrete samples (blocks, Sample & Hold,
  // duty updates of the PWM), programmed jumps and live changes, each with time, kind, source, value and the side of the
  // instant ('t+': the value after it). A ring of the last `max` events with counts per kind; opts.events = false: off.
  evInit(){this.ev={on:this.opts.events!==false,max:Math.max(100,Math.round(+this.opts.eventsMax)||20000),list:[],n:0,kinds:{}};}
  logEv(kind,src,v,x){const E=this.ev;if(!E||!E.on)return;E.n++;E.kinds[kind]=(E.kinds[kind]||0)+1;E.list.push({t:this.t,kind,src,v,side:'t+',...x});
   if(E.list.length>E.max*1.25)E.list.splice(0,E.list.length-E.max);}
  events(){const E=this.ev;if(!E)return {list:[],n:0,kinds:{},max:0};return {list:E.list.length>E.max?E.list.slice(-E.max):E.list,n:E.n,kinds:E.kinds,max:E.max};}
  // a switch's state is set by its gate at the start of a step, a diode's at the end (for the next one): each at its instant
  evSwitches(t0){for(const e of this.swEls()){const on=e.on?1:0;if(e.evOn!==undefined&&e.evOn!==on){const c=this.net.compInfo.get(e.cid);this.logEv(e.k==='D'?(e.gk||e.fire?'scr':e.gap?'gap':'diode'):'switch',(c?.label||e.cid)+(e.role&&e.role!=='main'?'/'+e.role:''),on,{id:e.cid,...(e.k==='S'&&t0!==undefined?{t:t0}:{})});}e.evOn=on;}}
  // ------------------------------------------------------------ channels
  channelKeys(){
   const k=[];for(const n of this.net.nets)k.push('N:'+n.canon);
   for(const c of this.net.compInfo.values()){
    if(['GND','JUNC','TAGO','TAGI'].includes(c.type))continue;
    if(c.type==='PWM'){k.push('D:'+c.id,'G:'+c.id,'REF:'+c.id,'MEAS:'+c.id,'CAR:'+c.id);continue;}
    if(c.type==='SH'){k.push('H:'+c.id);continue;}
    if(P.BLOCKS.has(c.type)){k.push('Y:'+c.id,...c.blk.outList.slice(1).map(q=>'Y:'+c.id+':'+q));continue;}
    k.push('V:'+c.id,'I:'+c.id,'P:'+c.id);
    if(c.type==='XFMR')k.push('V2:'+c.id,'I2:'+c.id,'Im:'+c.id);
    if(c.ports)for(let q=2;q<=c.ports.length;q++)k.push('V'+q+':'+c.id,'I'+q+':'+c.id);
    if(c.srm)for(let q=1;q<=c.srm.N;q++)k.push('PSI'+q+':'+c.id);
    if(c.type==='VAC3')k.push('Vb:'+c.id,'Vc:'+c.id,'Ib:'+c.id,'Ic:'+c.id,'Vab:'+c.id);
    if(c.loss)k.push('PSW:'+c.id);
    if(c.type==='SW'||c.type==='SCR')k.push('GS:'+c.id);
    if(c.type==='ARCX')k.push('Garc:'+c.id);
    if(c.blk)k.push('Y:'+c.id,...c.blk.outList.slice(1).map(q=>'Y:'+c.id+':'+q)); // signal outputs of an electrical part (machine)
   }
   return k;
  }
  allocRecord(){
   // 4.11: the memory of the scope in MB (opts.mem, the user's setting); the default keeps the 24 MB of before
   const nch=this.keys.length,mem=+this.opts.mem>0?+this.opts.mem:0;let cap=this.opts.cap||(mem?Math.max(20000,Math.floor(mem*1048576/(4*nch+9))):Math.max(20000,Math.min(200000,Math.floor(24e6/(4*nch+8)))));this.memNote=null;
   if(!this.opts.cap&&mem){const lim=Math.floor(2**31/Math.max(1,nch));if(cap>lim){cap=lim;this.memNote='η μνήμη περιορίστηκε στο όριο ενός buffer';}}
   // 4.7: in a cross-origin isolated page the buffers are shared memory from the start, so that the live worker (live.js)
   // uses them as they are: copying them at ▶ cost one frame of 80 ms in a circuit of 300 channels (≈ 140 MB)
   const A=(C,n)=>shared?new C(new SharedArrayBuffer(n*C.BYTES_PER_ELEMENT)):new C(n);
   try{this.ring={t:A(Float64Array,cap),d:A(Float32Array,cap*nch),g:A(Uint8Array,cap),nch,cap,head:0,n:0};}
   catch(e){cap=Math.max(20000,Math.min(200000,Math.floor(24e6/(4*nch+8))));this.memNote=`δεν δόθηκαν ${Math.round(mem)} MB από τον browser: ${Math.round(cap*(4*nch+9)/1048576)} MB`;
    this.ring={t:A(Float64Array,cap),d:A(Float32Array,cap*nch),g:A(Uint8Array,cap),nch,cap,head:0,n:0};}
   const pc=20000;this.per={t:A(Float64Array,pc),avg:A(Float32Array,pc*nch),min:A(Float32Array,pc*nch),max:A(Float32Array,pc*nch),rms:A(Float32Array,pc*nch),end:A(Float32Array,pc*nch),nch,cap:pc,head:0,n:0};
   this.acc={t0:this.t,dur:0,s:new Float64Array(nch),q:new Float64Array(nch),mn:new Float64Array(nch).fill(Infinity),mx:new Float64Array(nch).fill(-Infinity)};
   this.vals=new Float64Array(nch);this.prevVals=null;
  }
  V(i){return i<0?0:this.x[i];}
  elCurrent(e){const v=this.V(e.a)-this.V(e.b);
   switch(e.k){case 'G':return v/e.Rnow;case 'L':return e.i;case 'C':return e.i;case 'V':return -this.x[e.row];case 'I':return e.Inow;
    case 'S':return v*(e.on?1/e.Ron:1/e.Roff);case 'GY':return this.x[e.row];case 'D':return e.on?(v-e.Vf)/e.Ron:v/e.Roff;case 'CPL':return e.g*v+e.J;case 'F':return e.i[0];case 'MG':return this.portI(e,0);case 'TL':return e.iE[0];case 'TLM':return e.iE[0];case 'PIL':return -this.x[e.vs[0].row];case 'NL':return e.ch.cur(v).i;case 'CHB':return this.x[e.row];}return 0;}
  // current of port k of a multiport
  portI(e,k){if(e.k==='F')return e.i[k];if(e.k==='PIL')return -this.x[e.vs[k].row];if(e.k==='TL'||e.k==='TLM')return e.iE[k];let s=0;for(let j=0;j<e.N;j++)s+=e.Gm[k*e.N+j]*(this.V(e.ports[j][0])-this.V(e.ports[j][1]));return s;}
  // values of all channels at the current solution
  computeVals(){
   const out=this.vals;let j=0;const x=this.x;if(this.net.sig.blocks.length){if(this.blkFresh)this.blkCopy();else this.evalBlocks('trial');}
   for(const n of this.net.nets)out[j++]=x[n.index];
   for(const c of this.net.compInfo.values()){
    if(c.type==='GND'||c.type==='JUNC'||c.type==='TAGO'||c.type==='TAGI')continue;
    if(c.type==='PWM'){const k=c.ctrl;out[j++]=k.d;out[j++]=this.gateOf(k,'a',this.t)?1:0;out[j++]=k.refNow;out[j++]=k.meas;out[j++]=this.carrier(k,this.t);continue;}
    if(c.type==='SH'){out[j++]=c.sh.h;continue;}
    if(P.BLOCKS.has(c.type)){out[j++]=this.ybT[c.blk.i];const yo=this.yoT[c.blk.i];for(let q=1;q<yo.length;q++)out[j++]=yo[q];continue;}
    if(c.type==='VAC3'){const vn=this.V(c.n),ph=c.phases.map(q=>({v:this.V(q.pin)-vn,i:-this.x[q.e.row]}));
     out[j++]=ph[0].v;out[j++]=ph[0].i;out[j++]=ph[0].v*ph[0].i+ph[1].v*ph[1].i+ph[2].v*ph[2].i;out[j++]=ph[1].v;out[j++]=ph[2].v;out[j++]=ph[1].i;out[j++]=ph[2].i;out[j++]=ph[0].v-ph[1].v;continue;}
    const v=this.V(c.pins[0])-this.V(c.pins[1]);let i;
    if(c.type==='XFMR'){const is=this.x[c.main.row];i=-c.main.n*is+c.mag.i;}
    else if(c.type==='SW')i=this.elCurrent(c.main)-(c.body?this.elCurrent(c.body):0);
    else if(c.type==='GEN3')i=-c.main.i[0]; // a generator: the current it delivers (phase a)
    else i=this.elCurrent(c.main);
    const src=c.type==='VDC'||c.type==='VAC'||c.type==='IDC';
    out[j++]=v;out[j++]=i;out[j++]=src?v*i:v*i;
    if(c.type==='XFMR'){const v2=this.V(c.pins2[0])-this.V(c.pins2[1]);const is=this.x[c.main.row]*(c.opp?-1:1);out[j++]=v2;out[j++]=is;out[j++]=c.mag.i;}
    if(c.ports)for(let q=1;q<c.ports.length;q++){out[j++]=this.V(c.ports[q][0])-this.V(c.ports[q][1]);out[j++]=this.portI(c.main,q);}
    if(c.srm)for(let q=0;q<c.srm.N;q++)out[j++]=c.main.psi[q];
    if(c.loss)out[j++]=c.loss.P;
    if(c.type==='SW'||c.type==='SCR'){const e=c.main;out[j++]=(e.k==='S'?e.on:e.gon)?1:0;} // the gate pulse this switch receives (after dead time)
    if(c.type==='ARCX'){const A=c.arc.arc;out[j++]=A.closed?1/A.Ron:Math.exp(A.x);}
    if(c.blk){out[j++]=this.ybT[c.blk.i];const yo=this.yoT[c.blk.i];for(let q=1;q<yo.length;q++)out[j++]=yo[q];}
   }
   return out;
  }
  // 4.8: the resolution of the record for long runs: a point in the buffer at most every opts.recDt seconds (0 = every
  // step), and one statistic per opts.perN periods. The buffers stay the same size, so they cover recDt/h and perN times
  // more time; the values, the statistics and everything the solver computes are those of every step.
  setRecord(o={}){const dt=+o.dt>0?+o.dt:0,n=Math.max(1,Math.round(+o.n||1));this.opts.recDt=dt;this.opts.perN=n;}
  recordNow(){
   const r=this.ring,v=this.computeVals(),nch=r.nch,dt=this.opts.recDt||0;
   const lr=this._recT??-Infinity;if(!dt||this.t<lr||!(this.t-lr<dt*(1-1e-9))){this._recT=this.t;const j=r.head;r.t[j]=this.t;const off=j*nch;for(let i=0;i<nch;i++)r.d[off+i]=v[i];
    r.head=(j+1)%r.cap;r.n=Math.min(r.n+1,r.cap);}
   // period statistics (trapezoidal in time)
   const a=this.acc;if(this.prevVals){const h=this.t-this.prevT;if(h>0){for(let i=0;i<nch;i++){const y0=this.prevVals[i],y1=v[i];a.s[i]+=h*(y0+y1)/2;a.q[i]+=h*(y0*y0+y0*y1+y1*y1)/3;}a.dur+=h;}}
   for(let i=0;i<nch;i++){const y=v[i];if(y<a.mn[i])a.mn[i]=y;if(y>a.mx[i])a.mx[i]=y;}
   if(!this.prevVals)this.prevVals=new Float64Array(nch);this.prevVals.set(v);this.prevT=this.t;
  }
  closePeriod(){
   const a=this.acc,p=this.per,nch=p.nch;if(a.dur<=0)return;
   if((this.opts.perN||1)>1&&(this._perK=(this._perK||0)+1)<this.opts.perN)return;this._perK=0; // 4.8: perN periods in one
   const j=p.head,off=j*nch;p.t[j]=this.t;
   for(let i=0;i<nch;i++){p.avg[off+i]=a.s[i]/a.dur;p.rms[off+i]=Math.sqrt(Math.max(0,a.q[i]/a.dur));p.min[off+i]=a.mn[i];p.max[off+i]=a.mx[i];p.end[off+i]=this.prevVals?this.prevVals[i]:NaN;} // end: the value at the period boundary (e.g. the current at the clock)
   p.head=(j+1)%p.cap;p.n=Math.min(p.n+1,p.cap);
   for(const c of this.lossList){c.loss.P=c.loss.E/a.dur;c.loss.E=0;}
   a.dur=0;a.s.fill(0);a.q.fill(0);a.mn.fill(Infinity);a.mx.fill(-Infinity);
   if(this.prevVals)for(let i=0;i<nch;i++){const y=this.prevVals[i];a.mn[i]=y;a.mx[i]=y;}
   this.periodsDone=(this.periodsDone||0)+1;
  }
  lastPeriod(key){const i=this.chIndex.get(key),p=this.per;if(i===undefined||!p.n)return null;const j=(p.head-1+p.cap)%p.cap,o=j*p.nch+i;return {t:p.t[j],avg:p.avg[o],rms:p.rms[o],min:p.min[o],max:p.max[o]};}
  now(key){const i=this.chIndex.get(key);if(i===undefined)return NaN;return this.vals[i];}
  // ------------------------------------------------------------ control
  // gate of one PWM output; with dead time an output turns on k.dt after its raw signal does
  // dOn sets the turn-on edge of the period, dOff the turn-off edge (they differ only with a
  // second duty update at the carrier minimum)
  gateOf(k,out,t){
   if(!(k.dt>0))return this.rawGate(k,out,t,k.tk,k.dOn,k.dOff);
   if(!this.rawGate(k,out,t,k.tk,k.dOn,k.dOff))return false;
   const td=t-k.dt;if(k.mode==='spwm'||td>=k.tk-1e-15*k.T)return this.rawGate(k,out,td,k.tk,k.dOn,k.dOff);
   return this.rawGate(k,out,td,k.tkPrev??k.tk-k.T,k.dPrev??k.dOn,k.dPrevOff??k.dPrev??k.dOff);
  }
  rawGate(k,out,t,tk,dd,dd2=dd){
   const T=k.T;
   if(k.mode==='spwm'){const ph=((t/T-k.phase)%1+1)%1;const car=ph<.5?1-4*ph:-3+4*ph;const ref=k.m*Math.sin(2*Math.PI*k.fref*t+k.refphase);
    const a=ref>car,b=-ref>car;return out==='a'?a:out==='na'?!a:out==='b'?b:!b;}
   const tau=t-tk,d=Math.min(1,Math.max(0,dd)),d2=Math.min(1,Math.max(0,dd2));let a,b;
   if(k.mode==='pp'){const h=T/2;a=tau>=-1e-15&&tau<d*h*(1-1e-12);b=tau>=h*(1-1e-12)&&tau<h+d*h*(1-1e-12);}
   else{const [e0,e1]=k.carrier==='saw'?[0,d*T]:[(1-d)*T/2,(1+d2)*T/2];a=tau>=e0*(1-1e-12)-1e-18&&tau<e1*(1-1e-12);b=a;}
   return out==='a'?a:out==='na'?!a:out==='b'?b:!b;
  }
  // carrier value c(t): sawtooth τ/T (reset at the period start), symmetric triangle |1 − 2τ/T|
  // (maximum at the period start, minimum in the middle); SPWM: the −1…1 triangle it compares against
  carrier(k,t){const T=k.T;if(k.mode==='spwm'){const ph=((t/T-k.phase)%1+1)%1;return ph<.5?1-4*ph:-3+4*ph;}
   const u=Math.min(1,Math.max(0,(t-k.tk)/T));if(k.mode==='pp')return (2*u)%1;return k.carrier==='saw'?u:Math.abs(1-2*u);}
  // Sample & Hold triggers sit on the carrier of the clock PWM: b + n·Δ
  shGrid(q){const k=this.ctrlById.get(q.clock);let T,b0;if(k){T=k.T;b0=k.phase*T;}else{const c=this.clkById.get(q.clock);if(!c)return null;T=1/c.f;b0=c.ph*T;}return {b:b0+(q.trig==='mid'?T/2:0),d:q.trig==='both'?T/2:T};}
  shNext(q){const g=this.shGrid(q);if(!g)return Infinity;const n=Math.floor((this.t-g.b)/g.d+1e-7)+1;return g.b+n*g.d;}
  // take the samples due at the current instant (left value: the state before any switching at t)
  sampleHolds(){let any=false;for(const q of this.net.shs){if(q.sig)continue;const g=this.shGrid(q);if(!g)continue;const u=(this.t-g.b)/g.d,n=Math.round(u);
    if(Math.abs(u-n)>1e-7||q.last===n)continue;q.last=n;
    let v=q.qty==='V'?this.compV(q.src):this.compI(q.src);if(!Number.isFinite(v))v=NaN;q.h=v;q.n++;q.log.t.push(this.t);q.log.v.push(v);this.logEv('sample',q.label||q.id,v,{id:q.id,u:q.qty==='V'?'V':'A',clk:q.clock,n});
    if(q.log.t.length>60000){q.log.t.splice(0,10000);q.log.v.splice(0,10000);}any=true;}
   return any;}
  samples(id){return this.shById.get(id)?.log||null;}
  ctrlEdges(k){const T=k.T,d=Math.min(1,Math.max(0,k.dOn)),d2=Math.min(1,Math.max(0,k.dOff));let E;
   if(k.mode==='pp'){const h=T/2;E=[k.tk+d*h,k.tk+h,k.tk+h+d*h,k.tk+T];}
   else{const [e0,e1]=k.carrier==='saw'?[0,d*T]:[(1-d)*T/2,(1+d2)*T/2];E=[k.tk+e0,k.tk+e1,k.tk+T];}
   if(k.dt>0)E=E.concat([k.tk],E).map((e,i)=>i>=E.length?e+k.dt:e);
   return E;}
  // thyristor firing: pulse while frac(f·t + φ/2π − (α+shift)/360) < width/360
  scrU(e,t){const F=e.fire;return F.f*t+F.ph0/(2*Math.PI)-(F.alpha+F.shift)/360;}
  scrGate(e,t){const u=this.scrU(e,t);return u-Math.floor(u)<e.fire.pw/360;}
  scrEdges(e){const F=e.fire,u=this.scrU(e,this.t),fl=Math.floor(u+1e-9),back=uu=>(uu-F.ph0/(2*Math.PI)+(F.alpha+F.shift)/360)/F.f;return [back(fl+F.pw/360),back(fl+1),back(fl+1+F.pw/360)];}
  setFiring(alpha){let n=0;for(const e of this.net.els)if(e.fire){e.fire.alpha=alpha;n++;}return n;}
  compV(cid){const c=this.net.compInfo.get(cid);if(!c||!c.pins)return NaN;return this.V(c.pins[0])-this.V(c.pins[1]);}
  compI(cid){const c=this.net.compInfo.get(cid);if(!c||!c.main)return NaN;if(c.type==='XFMR')return -c.main.n*this.x[c.main.row]+c.mag.i;if(c.type==='SW')return this.elCurrent(c.main)-(c.body?this.elCurrent(c.body):0);return this.elCurrent(c.main);}
  // a second duty update at the carrier minimum (symmetric triangle only) changes the turn-off edge
  dbl(k){return k.upd==='double'&&k.mode!=='spwm'&&k.mode!=='pp'&&k.carrier!=='saw';}
  sampleControllers(force){let changed=false;
   for(const k of this.net.ctrls){
    const T=k.T,idx=Math.floor((this.t+1e-12*T)/T-k.phase),dbl=this.dbl(k),half=dbl?Math.floor((this.t+1e-12*T)/(T/2)-2*k.phase):null;
    if(!force&&k.k===idx&&(!dbl||k.h===half))continue;changed=true;
    const period=force||k.k!==idx,first=k.k===null,Ts=dbl?T/2:T;
    if(period){if(!first){k.tkPrev=k.tk;k.dPrev=k.dOn;k.dPrevOff=k.dOff;}k.k=idx;k.tk=(idx+k.phase)*T;}
    k.h=half;
    if(k.mode==='fixed'||k.mode==='pp')k.d=schedAt(k.dsched,this.t,k.D);
    else if(k.mode==='ext'){const v=k.dIn>=0?this.sv[k.dIn]:0;k.d=Number.isFinite(v)?v:0;}
    else if(k.mode==='pi'){const T=Ts;
     k.refNow=schedAt(k.ref,this.t,k.ref[0][1]);const sh=this.shById.get(k.sensor);k.meas=sh?sh.h:k.qty==='V'?this.compV(k.sensor):this.compI(k.sensor);if(!Number.isFinite(k.meas))k.meas=0;
     let ff=0;if(k.ff==='ratio'){const a=this.compV(k.ffA),b=this.compV(k.ffB);ff=Math.abs(b)>1e-9?1-a/b:0;}else if(k.ff==='const')ff=k.D0;
     const e=k.refNow-k.meas;if(force&&!this.started){k.xi=0;k.ePrev=null;k.dF=0;}
     let der=0;if(k.Kd){const raw=k.ePrev===null?0:(e-k.ePrev)/T;k.dF=k.Tf>0?(k.Tf*k.dF+T*raw)/(k.Tf+T):raw;der=k.Kd*k.dF;}k.ePrev=e;
     k.xi+=k.Ki*T*e;let d=ff+k.Kp*e+k.xi+der;
     if(d>k.dmax||d<k.dmin){k.xi-=k.Ki*T*e;d=Math.min(k.dmax,Math.max(k.dmin,ff+k.Kp*e+k.xi+der));}
     k.d=d;}
    if(period){k.dOn=k.d;k.dOff=k.d;}else k.dOff=k.d;
    if(!force)this.logEv('duty',k.id,k.d,{id:k.id,n:idx,...(period?{}:{half:true})});
    if(first||k.tkPrev===null){k.tkPrev=k.tk-T;k.dPrev=k.dOn;k.dPrevOff=k.dOff;}
   }
   return changed;
  }
  // ------------------------------------------------------------ signal blocks (3.0)
  // One pass in dependency order. mode: 'trial' (scratch arrays, no state change), 'commit' (continuous
  // blocks; comparator, latch and divider states are updated), 'sample' (also the discrete blocks due at
  // this instant: PI, z⁻¹, Sample & Hold with a signal input), 'init' (before the first consistent solution,
  // nothing is logged). left: time sources take their value just before t (used when looking for a
  // comparator crossing that ends exactly at a ramp reset). Returns true if a discrete block updated.
  evalBlocks(mode,force=false,left=false){
   const G=this.net.sig;this.blkFresh=false;if(!G.blocks.length)return false;const trial=mode==='trial',disc=mode==='sample'||mode==='init';
   const sv=trial?this.svT:this.sv,yb=trial?this.ybT:this.yb;sv.fill(0);const t=left?this.t-1e-6*this.h:this.t;const rd=n=>n>=0&&n!==undefined?sv[n]:0;let sampled=false;const pend=[];
   const cont=[],Q3=Math.sqrt(3);
   for(const b of G.order){const st=b.st,I=b.ins;let y=0,ys=null;
    switch(b.type){
     case 'VM':y=this.V(b.np)-this.V(b.nn);break;
     case 'AM':y=this.x[b.el.row];break;                       // current a → b through the meter
     case 'MEAS':y=b.qty==='V'?this.compV(b.src):this.compI(b.src);if(!Number.isFinite(y))y=0;break;
     case 'CONST':y=schedAt(b.sched,t,b.sched[0][1]);break;
     case 'GAIN':y=b.K*rd(I.u);break;
     case 'SUM':y=b.sg[0]*rd(I.a)+b.sg[1]*rd(I.b)+(I.c!==undefined?b.sg[2]*rd(I.c):0);break;
     case 'MUL':y=rd(I.a)*rd(I.b);break;
     case 'DIV':{const d=rd(I.b);y=Math.abs(d)>b.eps?rd(I.a)/d:st.y;if(!trial)st.y=y;break;}
     case 'SAT':y=Math.min(b.hi,Math.max(b.lo,rd(I.u)));break;
     case 'CMP':{const pv=rd(I.p),nv=rd(I.n),f=cmpF(b,st.s,pv,nv);const s2=st.s?(f<0?0:1):(f>0?1:0);
      if(trial)b.f1=f;else{if(s2!==st.s&&!disc)this.logEv('cmp',b.label,s2,{id:b.id});st.s=s2;st.f0=cmpF(b,s2,pv,nv);}y=s2;break;}
     case 'LOGIC':{const a=rd(I.a)>=.5,c=rd(I.b)>=.5;y={and:a&&c,or:a||c,xor:a!==c,not:!a,nand:!(a&&c),nor:!(a||c)}[b.op]?1:0;break;}
     case 'PIB':{if(disc&&this.blkDue(b,force)){const Ts=this.shGrid(b).d,e=rd(I.u);if(force&&!this.started)st.xi=0;
       st.xi+=b.Ki*Ts*e;let q=b.y0+b.Kp*e+st.xi;if(q>b.ymax||q<b.ymin){st.xi-=b.Ki*Ts*e;q=Math.min(b.ymax,Math.max(b.ymin,b.y0+b.Kp*e+st.xi));}st.y=q;sampled=true;if(b.track){st.kt=b.Kp>0?Math.min(1,b.Ki*Ts/b.Kp):1;pend.push(b);}}
      y=st.y;break;}
     case 'UD':if(disc&&this.blkDue(b,force)){st.y=force?b.y0:st.mem;pend.push(b);sampled=true;}y=st.y;break;
     case 'MOD3':{const v=[rd(I.va),rd(I.vb),rd(I.vc)],dc=Math.max(Math.abs(rd(I.vdc)),1e-9);let o=0;if(b.mode==='svpwm')o=-(Math.max(...v)+Math.min(...v))/2;
      const d=v.map(x=>b.mode==='square'?(x>0?1:0):Math.min(1,Math.max(0,.5+(x+o)/dc)));ys={da:d[0],db:d[1],dc:d[2]};break;}
     // current model of the rotor flux in stator coordinates (continuous; inputs held since the previous evaluation, as INT and PLL)
     case 'FEST':{const dt=Math.max(0,this.t-st.t),[ia0,ib0,w0]=st.u,g=b.RR/b.LM,k=dt/2,a11=1+k*g,a12=k*w0,r1=(1-k*g)*st.pa-k*w0*st.pb+dt*b.RR*ia0,r2=(1-k*g)*st.pb+k*w0*st.pa+dt*b.RR*ib0,det=a11*a11+a12*a12;
      const pa=(a11*r1-a12*r2)/det,pb=(a11*r2+a12*r1)/det,ps=Math.hypot(pa,pb),th=Math.atan2(pb,pa),P2=2*Math.PI,ial=rd(I.al),ibe=rd(I.be),iq=-ial*Math.sin(th)+ibe*Math.cos(th);
      if(!trial)cont.push([b,[pa,pb]]);ys={th:th-P2*Math.floor(th/P2),psi:ps,w1:rd(I.wr)+(ps>1e-6?b.RR*iq/ps:0)};break;}
     case 'EXPR':{const v=b.xv,nm=b.inNames;for(let q=0;q<nm.length;q++)v[q]=rd(I[nm[q]]);y=b.fn(v,t);if(!Number.isFinite(y))y=0;break;}
     // Python: called once per sample instant (not in the 'init' pass, whose inputs come before the first solution)
     case 'PY':{if(mode==='sample'&&b.rt&&this.blkDue(b,force)){st.ys=b.rt.step(this.t,b.inNames.map(k=>rd(I[k])));sampled=true;}
      ys={};b.outNames.forEach((k,i)=>{const v=st.ys?st.ys[i]:b.y0;ys[k]=Number.isFinite(v)?v:0;});break;}
     case 'NN':{if(mode==='sample'&&this.blkDue(b,force)){nnStep(b,st,b.inNames.map(k=>rd(I[k])),b.train==='err'?rd(I.e):b.train==='tgt'?rd(I.tgt):0,b.train==='off'?0:rd(I.fz),b.src);sampled=true;}
      ys={y:st.y,L:st.L,dy:st.dy||0};break;}
     case 'SR':{const S=rd(I.s)>=.5,Rr=rd(I.r)>=.5;let q=st.q;if(S&&!st.sp)q=1;if(Rr)q=0;if(!trial){if(q!==st.q)this.logEv('latch',b.label,q,{id:b.id});st.q=q;st.sp=S;}ys={q,nq:1-q};break;}
     // continuous states: input held since the previous evaluation (the solver steps are short), state written after the pass
     case 'INT':{const dt=Math.max(0,this.t-st.t);let v=Math.min(b.hi,Math.max(b.lo,st.s+dt*st.u));if(b.wrap)v-=2*Math.PI*Math.floor(v/(2*Math.PI));y=v;if(!trial)cont.push([b,v]);break;}
     case 'LPF':{const dt=Math.max(0,this.t-st.t),v=st.u+(st.s-st.u)*Math.exp(-dt/b.tau);y=v;if(!trial)cont.push([b,v]);break;}
     // 3.19: exact solution with the input held since the previous evaluation, as LPF (Φ = e^{A·dt}, f2Phi)
     case 'F2':{const dt=Math.max(0,this.t-st.t),F=f2Phi(b.w0,b.z,dt),d1=st.s[0]-st.u,d2=st.s[1],q1=st.u+F[0]*d1+F[1]*d2,q2=F[2]*d1+F[3]*d2,u=rd(I.u);
      y=b.kind==='lp'?q1:b.kind==='bp'?2*b.z*q2:b.kind==='hp'?u-q1-2*b.z*q2:u-2*b.z*q2;if(!trial)cont.push([b,[q1,q2]]);break;}
     case 'RLIM':{const dt=Math.max(0,this.t-st.t),v=st.s+Math.min(b.up*dt,Math.max(-b.dn*dt,st.u-st.s));y=v;if(!trial)cont.push([b,v]);break;}
     case 'RT':if(disc&&this.blkDue(b,force)){if(b.mode==='delay'){st.y=force?b.y0:st.mem;pend.push(b);}else st.y=rd(I.u);sampled=true;}y=st.y;break;
     case 'EDGE':{const l=rd(I.u)>=.5,e=l!==!!st.p&&(b.edge==='both'||(b.edge==='rise')===l);let n=st.n,tOn=st.tOn;
      if(e&&!trial){n++;tOn=this.t;st.n=n;st.tOn=tOn;st.p=l?1:0;this.logEv('edge',b.label,n,{id:b.id});}else if(!trial)st.p=l?1:0;
      const on=e||(tOn!==null&&(b.tw>0?this.t<tOn+b.tw-1e-7*this.h:this.t===tOn));ys={y:on?1:0,n:e&&trial?n+1:n};break;}
     case 'CLARKE':{const a=rd(I.a),bb=rd(I.b),c=rd(I.c),k=b.pw?Math.sqrt(1.5):1;ys={al:k*(2*a-bb-c)/3,be:k*(bb-c)/Q3};break;}
     case 'ICLARKE':{const k=b.pw?Math.sqrt(2/3):1,al=k*rd(I.al),be=k*rd(I.be);ys={a:al,b:-al/2+Q3/2*be,c:-al/2-Q3/2*be};break;}
     case 'PARK':{const al=rd(I.al),be=rd(I.be),th=rd(I.th),c=Math.cos(th),sn=Math.sin(th);ys={d:al*c+be*sn,q:-al*sn+be*c};break;}
     case 'IPARK':{const d=rd(I.d),q=rd(I.q),th=rd(I.th),c=Math.cos(th),sn=Math.sin(th);ys={al:d*c-q*sn,be:d*sn+q*c};break;}
     case 'PLL':{ // synchronous-frame PLL: q-component of the voltage, normalised by the amplitude, drives a PI to ω; θ = ∫ω
      const dt=Math.max(0,this.t-st.t),P2=2*Math.PI;let th=st.th+dt*st.w;th-=P2*Math.floor(th/P2);
      const a=rd(I.a),bb=rd(I.b),c=rd(I.c),al=(2*a-bb-c)/3,be=(bb-c)/Q3,cs=Math.cos(th),sn=Math.sin(th),vd=al*cs+be*sn,vq=-al*sn+be*cs,amp=Math.hypot(al,be);
      const e=amp>1e-9?vq/amp:0,xi=st.xi+b.Ki*dt*e,w=b.w0+b.Kp*e+xi;if(!trial){st.th=th;st.xi=xi;st.w=w;st.t=this.t;}ys={th,w,amp:vd};break;}
     // 4.10: the single-phase SOGI-PLL (states integrated with the input held since the previous evaluation, as PLL and INT)
     case 'SPLX':{const dt=Math.max(0,this.t-st.t),P2=2*Math.PI,cl=v=>Math.min(1e9,Math.max(-1e9,v)),al=cl(st.x1+dt*st.d1),be=cl(st.x2+dt*st.d2),xi=cl(st.xi+dt*st.dxi),x0=b.k0>0?cl(st.x0+dt*st.d0):0;
      let th=cl(st.th+dt*st.w);th-=P2*Math.floor(th/P2);
      const cs=Math.cos(th),sn=Math.sin(th),vq=-al*sn+be*cs,amp=Math.hypot(al,be),e=amp>1e-9?vq/amp:0,lo=b.w0*0.5,hi=b.w0*1.5,w=Math.min(Math.max(b.w0+b.Kp*e+xi,lo),hi),u=rd(I.v);
      if(!trial){st.x1=al;st.x2=be;st.th=th;st.xi=xi;st.w=w;st.x0=x0;st.d1=w*(b.k*(u-x0-al)-be);st.d2=w*al;st.dxi=(w>=hi&&e>0)||(w<=lo&&e<0)?0:b.Ki*e;if(b.k0>0)st.d0=w*b.k0*(u-x0-al);st.t=this.t;}ys={th,w,amp:al*cs+be*sn,al,be};break;}
     // 4.10: the cell voltages and the current of an arm, for its modulator (states: no feedthrough from the insertion pins)
     case 'CHBX':{const e=b.chb;ys={i:e.i,v:this.V(e.a)-this.V(e.b)};for(let k=0;k<e.N;k++)ys['v'+(k+1)]=e.vc[k];break;}
     case 'NLC':{if(disc&&this.blkDue(b,force)){nlcStep(b,st,rd(I.ref),rd(I.i),b.inV.map(k=>rd(I[k])));sampled=true;}
      ys={n:st.n,vav:st.vav,sw:st.sw};for(let k=0;k<b.N;k++)ys['s'+(k+1)]=st.s[k];break;}
     case 'DCM':ys={w:this.V(b.m),te:b.psi*this.x[b.gy.row]};break;
     case 'SRM':{const s=b.srm.st,P2=2*Math.PI;ys={w:s.wo??s.w,te:s.te,th:s.the-P2*Math.floor(s.the/P2)};for(let k=0;k<b.srm.N;k++)ys['i'+(k+1)]=b.srm.F.i[k];break;}
     case 'GEN3':{const m=b.gen,s=m.st,g=m.g,q=g.sh.gm,P2=2*Math.PI;let d=s.ph[q]+Math.PI-g.wb*this.t;d-=P2*Math.floor((d+Math.PI)/P2); // load angle against the sine reference of the sources
      ys={w:s.wo[q],te:-s.tem,pe:s.pe,qe:s.qe,vt:s.vt,ifd:s.ifd,d:d*180/Math.PI,e0:m.Efd0,v0:m.V0??1,m0:m.Tm0};for(let k=0;k<s.ts.length;k++)ys['ts'+(k+1)]=s.ts[k];break;}
     case 'SM':{const s=b.sm.st,P2=2*Math.PI;ys={w:s.wo??s.w,te:s.te,th:s.the-P2*Math.floor(s.the/P2),id:s.id,iq:s.iq};break;}
     case 'IM':{const s=b.im.st,P2=2*Math.PI,f=Math.atan2(s.pb,s.pa),r=b.im.p*s.th;ys={w:s.w,te:s.te,psi:Math.hypot(s.pa,s.pb),thf:f-P2*Math.floor(f/P2),thr:r-P2*Math.floor(r/P2)};break;}
     case 'CLK':{const u=b.f*t-b.ph,fr=u-Math.floor(u+1e-11);y=fr<b.duty-1e-11?1:0;break;}
     case 'RAMP':{const u=b.f*t-b.ph,fr=Math.max(0,u-Math.floor(u+1e-11));y=b.lo+(b.hi-b.lo)*(b.shape==='tri'?Math.abs(1-2*fr):fr);break;}
     case 'DISP':y=rd(I.u);break;
     case 'SH':{const q=b.sh;if(b.sig&&disc){const g=this.shGrid(q);if(g){const u=(this.t-g.b)/g.d,n=Math.round(u);
       if(Math.abs(u-n)<=1e-7&&(force||q.last!==n)){const v=rd(I.u);q.h=v;sampled=true;if(mode==='sample'){if(q.last!==n){q.n++;q.log.t.push(this.t);q.log.v.push(v);this.logEv('sample',q.label||q.id,v,{id:q.id,clk:q.clock,n});}else{q.log.v[q.log.v.length-1]=v;}q.last=n;}}}}
      y=q.h;break;}
    }
    // outputs: the first one is the block's main value (channel Y:id), the others are Y:id:pin
    const ol=b.outList,yo=(trial?this.yoT:this.yo)[b.i];if(ol.length){if(!ys)ys={[ol[0]]:y};y=ys[ol[0]]??0;}
    yb[b.i]=y;for(let k=0;k<ol.length;k++){const v=ys[ol[k]]??0;yo[k]=v;const n=b.outs[ol[k]];if(n>=0)sv[n]=v;}
   }
   if(sampled&&!trial&&this.ev?.on&&mode==='sample')for(const b of G.blocks)if((b.type==='PIB'||b.type==='UD'||b.type==='RT'||b.type==='PY'||b.type==='NN')&&b.st.last!==null&&b.st.evN!==b.st.last){b.st.evN=b.st.last;this.logEv('sample',b.label,b.type==='PY'?(b.st.ys?b.st.ys[0]:b.y0):b.st.y,{id:b.id,clk:b.clock,n:b.st.last});}
   for(const b of pend){if(b.type==='PIB')b.st.xi+=b.st.kt*rd(b.ins.tr);else b.st.mem=rd(b.ins.u);} // back-calculation: dx_i/dt = K_i·(e + tr/K_p), tracking time T_t = K_p/K_i
   for(const [b,v] of cont){if(b.type==='FEST'){b.st.pa=v[0];b.st.pb=v[1];b.st.u=[rd(b.ins.al),rd(b.ins.be),rd(b.ins.wr)];}else{b.st.s=v;b.st.u=rd(b.ins.u);}b.st.t=this.t;}
   return sampled;
  }
  // 4.8.1: right after a pass at this instant (the run loop, nothing changed since) the values for the channels are those
  // of the pass: a trial pass would give the same numbers (the states it reads are the ones just written), so they are
  // copied instead of computed a third time per step
  blkCopy(){this.blkFresh=false;this.svT.set(this.sv);this.ybT.set(this.yb);const a=this.yo,b=this.yoT;for(let i=0;i<a.length;i++){const p=a[i],q=b[i];for(let k=0;k<p.length;k++)q[k]=p[k];}}
  // 4.8.1: is a discrete block (PI, z⁻¹, rate transition, Python, NN, S&H with a signal input) due now? Without one the
  // 'sample' pass would only repeat the 'commit' pass (continuous states with dt = 0, the same comparators and latches)
  blkAnyDue(){const G=this.net.sig;const D=G.disc||(G.disc=G.blocks.filter(b=>['PIB','UD','RT','PY','NN','NLC'].includes(b.type)||(b.type==='SH'&&b.sig===true)));
   for(const b of D){const sh=b.type==='SH',q=sh?b.sh:b,g=this.shGrid(q);if(!g)continue;const u=(this.t-g.b)/g.d,n=Math.round(u);if(Math.abs(u-n)<=1e-7&&(sh?q.last:b.st.last)!==n)return true;}return false;}
  // a discrete block (PI, z⁻¹) is due when t sits on the grid of its clock carrier, once per grid point
  blkDue(b,force){const g=this.shGrid(b);if(!g)return false;const u=(this.t-g.b)/g.d,n=Math.round(u);if(Math.abs(u-n)>1e-7)return false;if(!force&&b.st.last===n)return false;b.st.last=n;return true;}
  // comparator roots inside a step: fraction of the step where the first output change happens (or null)
  zcFrac(){this.evalBlocks('trial',false,true);let th=null;
   for(const b of this.net.sig.zc){const s=b.st.s,f0=b.st.f0,f1=b.f1;if(!(s?f1<0:f1>0))continue;const d=f0-f1;const q=Math.min(1,Math.max(0,d!==0?f0/d:0));if(th===null||q<th)th=q;}
   return th;}
  saveState(){const el=[];for(const e of this.net.els){if(e.k==='NL')el.push([e,e.v0,e.arc?{...e.arc}:e.sai?{...e.sai}:null]);else if(e.k==='TL')el.push([e,e.H.t.length,e.iE.slice(),e.H.s,e.H.cut]);else if(e.k==='TLM')el.push([e,e.H.t.length,e.iE.slice(),e.H.s,e.H.cut,e.modes.map(m=>m.fd?[m.z1.slice(),m.z2.slice(),m.y1.slice(),m.y2.slice(),m.i1,m.i2]:null)]);else if(e.k==='L')el.push([e,e.i,e.i1]);else if(e.k==='C')el.push([e,e.v,e.v1,e.i]);else if(e.k==='D')el.push([e,e.vPrev,e.iPrev,e.trigDone,e.Dacc]);else if(e.k==='CPL')el.push([e,e.v0,e.g,e.J]);else if(e.k==='F')el.push([e,e.psi.slice(),e.psi1.slice(),e.i.slice()]);else if(e.k==='CHB')el.push([e,e.vc.slice(),e.vc1.slice(),e.i,e.s.slice(),e.sKey]);}
   return {t:this.t,steps:this.steps,hLast:this.hLast,x:this.x,bdf:this.bdf,el,ms:[...(this.ims||[]),...(this.sms||[]),...(this.srms||[])].map(m=>[m,{...m.st}]),gs:(this.gens||[]).map(m=>[m,genCopy(m.st),m.Efd0,m.Tm0])};}
  restoreState(S){this.t=S.t;this.steps=S.steps;this.hLast=S.hLast;this.x=S.x;this.bdf=S.bdf;
   for(const r of S.el){const e=r[0];if(e.k==='NL'){e.v0=r[1];if(r[2])Object.assign(e.arc||e.sai,r[2]);}else if(e.k==='TL'){const H=e.H,d=H.cut-r[4],n=r[1]-d;H.s=Math.max(0,r[3]-d);H.t.length=n;for(const c of H.c)c.length=n;e.iE.set(r[2]);}else if(e.k==='TLM'){const H=e.H,d=H.cut-r[4],n=r[1]-d;H.s=Math.max(0,r[3]-d);H.t.length=n;for(const c of H.c)c.length=n;e.iE.set(r[2]);
    r[5].forEach((q,k)=>{if(!q)return;const m=e.modes[k];m.z1.set(q[0]);m.z2.set(q[1]);m.y1.set(q[2]);m.y2.set(q[3]);m.i1=q[4];m.i2=q[5];});}else if(e.k==='L'){e.i=r[1];e.i1=r[2];}else if(e.k==='C'){e.v=r[1];e.v1=r[2];e.i=r[3];}else if(e.k==='D'){e.vPrev=r[1];e.iPrev=r[2];e.trigDone=r[3];e.Dacc=r[4];}else if(e.k==='F'){e.psi.set(r[1]);e.psi1.set(r[2]);e.i.set(r[3]);}else if(e.k==='CHB'){e.vc.set(r[1]);e.vc1.set(r[2]);e.i=r[3];e.s.set(r[4]);e.sKey=r[5];}else{e.v0=r[1];e.g=r[2];e.J=r[3];}}
   for(const [m,st] of S.ms||[]){m.st={...st};if(m.ph)this.imSources(m);}
   for(const [m,st,e,t] of S.gs||[]){m.st=genCopy(st);m.Efd0=e;m.Tm0=t;}}
  // the whole state for a later continuation (3.16): {format, version, t, opts, method, state}. JSON-able, so it goes to a file
  snapshot(){return {format:'pcl-state',version:1,t:this.t,opts:{...this.opts},method:this.method,state:snapEncode(this)};}
  restoreSnapshot(S){if(!S||S.format!=='pcl-state'||!S.state)throw new NetlistError('Δεν είναι αποθηκευμένη κατάσταση του Power & Control Lab.');snapRestore(this,S.state);this.cache.clear();return this;}
  // the gate signature at t without changing the switches (the variable step looks ahead: a switching starts the next step small)
  gateSigPeek(t){let s='';for(const e of this.net.els){if(e.k!=='S'&&!e.gk)continue;let on=false;
    if(e.gate==='on')on=true;else if(e.gate==='sig')on=(e.gIn>=0?this.sv[e.gIn]:0)>=.5;else if(e.gate==='pwm'){const k=this.ctrlById.get(e.pwm);on=k?this.gateOf(k,e.out,t):false;}else if(e.gate==='alpha')on=this.scrGate(e,t);
    s+=on?'1':'0';}for(const e of this.chbEls||[])s+=chbStates(e,this.sv,false);return s;}
  gateSig(t){let s='';for(const e of this.net.els){if(e.k!=='S'&&!e.gk)continue;let on=false;
    if(e.gate==='on')on=true;else if(e.gate==='sig')on=(e.gIn>=0?this.sv[e.gIn]:0)>=.5;else if(e.gate==='pwm'){const k=this.net.ctrls.find(c=>c.id===e.pwm);on=k?this.gateOf(k,e.out,t):false;}else if(e.gate==='alpha')on=this.scrGate(e,t);
    if(e.k==='S')e.on=on;else{e.gon=on;if(e.gk==='igbt'&&!on)e.on=false;}s+=on?'1':'0';}for(const e of this.chbEls||[])s+=chbStates(e,this.sv,true);return s;}
  // ------------------------------------------------------------ assembly
  // programs t:value of sources, resistances, constant-power loads and constant blocks: the times, and whether a value jumps at t (3.15)
  jumpScheds(){if(this.jsc)return this.jsc;const L=[];
   for(const e of this.net.els){if(!e.sched&&!(e.k==='V'&&e.src?.sched))continue;
    const lb=this.net.compInfo.get(e.cid)?.label||e.cid;
    if(e.k==='G')L.push([e.sched,e.R,lb]);else if(e.k==='CPL')L.push([e.sched,e.P,lb]);else if(e.k==='I'&&!e.wave&&!(e.sigIn>=0))L.push([e.sched,e.I,lb]);
    else if(e.k==='V'&&e.imE===undefined&&!(e.sigIn>=0)&&e.src.kind==='dc')L.push([e.src.sched,e.src.V,lb]);}
   for(const b of this.net.sig.blocks)if(b.type==='CONST'&&b.sched)L.push([b.sched,b.sched[0][1],b.label]);
   return this.jsc=L;}
  jumpAt(t){for(const [s,d] of this.jumpScheds()){const a=schedAt(s,t,d,true),b=schedAt(s,t,d);if(a!==b&&!(Number.isNaN(a)&&Number.isNaN(b)))return true;}return false;}
  values(t){ // time-dependent element values at time t
   this.tChk=t; // the time of the trial solution (spark-gap triggers in check)
   // a step that ends on a programmed jump sees the value before it (3.15): the jump belongs to the next step
   const L=this.leftAt!=null&&Math.abs(t-this.leftAt)<=this.h*1e-7;
   for(const e of this.net.els){
    if(e.k==='G')e.Rnow=Math.max(schedAt(e.sched,t,e.R,L),1e-9);
    else if(e.k==='I')e.Inow=e.wave?P.waveAt(e.wave,t):e.sigIn>=0?(this.sv?this.sv[e.sigIn]:0):schedAt(e.sched,t,e.I,L);
    else if(e.k==='F'&&e.sm){const m=e.sm,th=m.st.the+(t-this.t)*m.p*m.st.w;let q;
     if(m.sat){ // saturated d axis: linearize i_d(ψ_d) at the flux of the previous step, i_d ≈ (ψ_d − ψ₀)/L_inc, at the predicted angle
      const pa=(2*e.psi[0]-e.psi[1])/3,pb=e.psi[1]/SQ3,pd=Math.cos(th)*pa+Math.sin(th)*pb,id=P.satDinv(m.sat,pd-m.psim),Li=P.satD(m.sat,id).L;
      q=smPort({Ld:Li,Lq:m.Lq,psim:pd-id*Li},th);}else q=smPort(m,th);
     e.Gnow=q.G;e.p0=q.p0;}
    else if(e.k==='F'&&e.gen){const m=e.gen,s=m.st,q=m.g.sh.gm;P.genGamma(m.g,s.ph[q]+(t-this.t)*m.g.wb*s.w[q],e.Gnow);}
    else if(e.k==='F'&&e.srm){const m=e.srm,th=m.st.the+(t-this.t)*m.Nr*m.st.w;for(let k=0;k<m.N;k++){const q=P.srmCur(m.g,th-2*Math.PI*k/m.N,e.psi[k]);e.Gnow[k*m.N+k]=q.g;e.p0[k]=e.psi[k]-q.i/q.g;}}
    else if(e.k==='V'&&e.imE!==undefined)e.Vnow=e.imE;
    else if(e.k==='V'&&e.gen)e.Vnow=this.genEfd(e.gen,t)*e.gen.g.vfK;
    else if(e.k==='V'){const s=e.src;e.Vnow=e.sigIn>=0?(this.sv?this.sv[e.sigIn]:0):s.kind==='dc'?schedAt(s.sched,t,s.V,L):s.kind==='wave'?P.waveAt(s.w,t):s.off+s.Vpk*Math.sin(2*Math.PI*s.f*t+s.ph);}
    else if(e.k==='TL')this.tlSources(e,t);
    else if(e.k==='TLM')this.tlmSources(e,t);
    else if(e.k==='CPL')e.Pnow=schedAt(e.sched,t,e.P,L);
   }
   // fast tower footings (4.9.1): KCL at the foot, (1/Z_e + G_min)·v + I_h + f(v) = 0, from the line's history alone; the footing
   // is then the resistance v/f(v) for this step (the circuit gives the same foot voltage, without Newton)
   if(this.footEls)for(const e of this.footEls){const F=e.foot,tl=F.tl;if(!tl)continue;const v=nlSolve(1/tl.Ze+GMIN,tl.Ih[1],F.ch,F.v),q=F.ch.cur(v);F.v=v;e.Rnow=Math.abs(q.i)>1e-300&&Math.abs(v)>1e-300?v/q.i:e.R;}
  }
  assemble(h,mode){
   const n=this.n;let ad;
   // 4.2: every stamp goes through ad(row, col, value): the dense matrix, or the slots of the sparse pattern
   // (a position outside the pattern is collected and the pattern grows, see spAssemble)
   if(this.rec)ad=(r,q,v)=>{this.rec.push(r*n+q);};
   else if(this.sp){const S=this.sp,M=S.map,X=S.Ax;X.fill(0);ad=(r,q,v)=>{const k=M.get(r*n+q);if(k===undefined)S.miss.push(r*n+q);else X[k]+=v;};}
   else{const A=this.A;A.fill(0);ad=(r,q,v)=>{A[r*n+q]+=v;};}
   const g=(a,b,G)=>{if(a>=0)ad(a,a,G);if(b>=0)ad(b,b,G);if(a>=0&&b>=0){ad(a,b,-G);ad(b,a,-G);}};
   for(let i=0;i<this.net.nNodes;i++)ad(i,i,GMIN);
   const tr=mode==='TR';
   for(const e of this.net.els){
    switch(e.k){
     case 'G':g(e.a,e.b,1/e.Rnow);break;
     case 'L':e.g=mode==='BDF2'?h/(e.L*this.bdf.a0):tr?h/(2*e.L):h/e.L;g(e.a,e.b,e.g);break;
     case 'C':e.g=mode==='BDF2'?e.C*this.bdf.a0/h:tr?2*e.C/h:e.C/h;g(e.a,e.b,e.g);break;
     case 'S':g(e.a,e.b,e.on?1/e.Ron:1/e.Roff);break;
     case 'D':g(e.a,e.b,e.on?1/e.Ron:1/e.Roff);break;
     case 'CPL':g(e.a,e.b,e.g);break;
     case 'F':{const c=mode==='BDF2'?h/this.bdf.a0:tr?h/2:h,N=e.N,G=e.Gnow;e.cc=c;stampM(ad,e.ports,N,G,c);break;} // flux multiport: i = c·Γ·v + J
     case 'MG':stampM(ad,e.ports,e.N,e.Gm,1);break;
     case 'TL':g(e.a1,e.b1,1/e.Ze);g(e.a2,e.b2,1/e.Ze);break;
     case 'TLM':{const G=this.tlmG(e,h);stampM(ad,e.p1,e.M,G,1);stampM(ad,e.p2,e.M,G,1);break;}
     case 'NL':g(e.a,e.b,e.g);break;
     case 'CHB':{chbCoef(e,h,mode,this.bdf);const r=e.row;if(e.a>=0){ad(e.a,r,1);ad(r,e.a,1);}if(e.b>=0){ad(e.b,r,-1);ad(r,e.b,-1);}ad(r,r,-e.Req);break;}
     case 'V':{const r=e.row;if(e.a>=0){ad(e.a,r,1);ad(r,e.a,1);}if(e.b>=0){ad(e.b,r,-1);ad(r,e.b,-1);}break;}
     case 'GY':{const r=e.row,Y=e.psi;if(e.a>=0){ad(e.a,r,1);ad(r,e.a,1);}if(e.b>=0){ad(e.b,r,-1);ad(r,e.b,-1);}if(e.m>=0){ad(r,e.m,-Y);ad(e.m,r,-Y);}break;} // gyrator: v_ab = ψ·ω, τ = ψ·i into node ω
     case 'X':{const r=e.row,N=e.n;if(e.s1>=0){ad(e.s1,r,1);ad(r,e.s1,1);}if(e.s2>=0){ad(e.s2,r,-1);ad(r,e.s2,-1);}
      if(e.p1>=0){ad(e.p1,r,-N);ad(r,e.p1,-N);}if(e.p2>=0){ad(e.p2,r,N);ad(r,e.p2,N);}break;}
    }
   }
  }
  rhs(h,mode){
   const b=this.b;b.fill(0);const tr=mode==='TR';
   const J=(a,c,j)=>{if(a>=0)b[a]-=j;if(c>=0)b[c]+=j;};
   for(const e of this.net.els){
    switch(e.k){
     case 'L':{if(mode==='BDF2'){const B=this.bdf;e.g=h/(e.L*B.a0);e.J=-(B.a1*e.i+B.a2*e.i1)/B.a0;}else{const v=this.V(e.a)-this.V(e.b);e.g=tr?h/(2*e.L):h/e.L;e.J=tr?e.i+e.g*v:e.i;}J(e.a,e.b,e.J);break;}
     case 'C':{if(mode==='BDF2'){const B=this.bdf;e.g=e.C*B.a0/h;e.J=e.C*(B.a1*e.v+B.a2*e.v1)/h;}else{const v=e.v;e.g=tr?2*e.C/h:e.C/h;e.J=tr?-(e.g*v+e.i):-e.g*v;}J(e.a,e.b,e.J);break;}
     case 'D':if(e.on)J(e.a,e.b,-e.Vf/e.Ron);break;
     case 'CPL':J(e.a,e.b,e.J);break;
     case 'F':{const N=e.N,G=e.Gnow,B=this.bdf,c=mode==='BDF2'?h/B.a0:tr?h/2:h,base=e.base||(e.base=new Float64Array(N)),Jv=e.Jv||(e.Jv=new Float64Array(N));e.cc=c;
      for(let k=0;k<N;k++){const [a,bb]=e.ports[k];base[k]=mode==='BDF2'?-(B.a1*e.psi[k]+B.a2*e.psi1[k])/B.a0:tr?e.psi[k]+c*(this.V(a)-this.V(bb)):e.psi[k];}
      for(let k=0;k<N;k++){let s=0;for(let j=0;j<N;j++)s+=G[k*N+j]*(base[j]-(e.p0?e.p0[j]:0));Jv[k]=s;J(e.ports[k][0],e.ports[k][1],s);}break;}
     case 'I':J(e.a,e.b,-e.Inow);break;
     case 'TL':J(e.a1,e.b1,e.Ih[0]);J(e.a2,e.b2,e.Ih[1]);break;
     case 'TLM':for(let k=0;k<e.M;k++){J(e.n1[k],-1,e.Ih[k]);J(e.n2[k],-1,e.Ih[e.M+k]);}break;
     case 'NL':J(e.a,e.b,e.J);break;
     case 'V':b[e.row]=e.Vnow;break;
     case 'CHB':chbCoef(e,h,mode,this.bdf);b[e.row]=e.E;break;
    }
   }
  }
  cplLinearize(){for(const e of this.net.els)if(e.k==='CPL'){let v=e.v0??(this.V(e.a)-this.V(e.b));const P=e.Pnow;
   if(Math.abs(v)<e.Vmin){e.g=P/(e.Vmin*e.Vmin);e.J=0;}else{e.g=-P/(v*v);e.J=2*P/v;}}}
  // 4.2 (§32): one factorization of the present matrix, dense (luFactor) or sparse (sparse.js: fixed pattern from the
  // stamps, minimum-degree ordering once, LU with threshold pivoting); {A, piv} or {sp}
  factor(h,mode){
   if(!this.sparse){this.assemble(h,mode);luFactor(this.A,this.n,this.piv);return {A:this.A.slice(),piv:this.piv.slice()};}
   this.spAssemble(h,mode);
   try{return {sp:SPM.lu(this.sp,this.sp.Ax,this.spq,0.1)};}
   catch(e){if(e instanceof SPM.SparseError)throw new NetlistError('Ιδιόμορφο σύστημα: βρόχος ιδανικών πηγών τάσης ή κόμβος χωρίς διαδρομή. Πρόσθεσε μικρή αντίσταση ή γείωση.');throw e;}
  }
  spAssemble(h,mode){
   const n=this.n;
   if(!this.sp){this.rec=[];try{this.assemble(h,mode);}finally{}const keys=this.rec;this.rec=null;for(let i=0;i<n;i++)keys.push(i*n+i);
    this.sp={...SPM.pattern(n,keys),miss:[]};this.sp.Ax=new Float64Array(this.sp.nnz);this.spq=SPM.order(this.sp);this.spw=new Float64Array(n);}
   this.assemble(h,mode);
   if(this.sp.miss.length){const keys=[...this.sp.map.keys(),...this.sp.miss];this.sp={...SPM.pattern(n,keys),miss:[]};this.sp.Ax=new Float64Array(this.sp.nnz);this.spq=SPM.order(this.sp);this.cache.clear();this.assemble(h,mode);}
  }
  solveOnce(h,mode){
   let key=null;
   // (a fast tower footing changes its resistance every step: no cached factorization then, 4.9.1)
   if(!this.hasCPL&&!this.hasTV&&!this.hasNL&&!(this.footEls&&this.footEls.length)){key=mode+(h/this.h).toPrecision(17)+(mode==='BDF2'?'w'+this.bdf.w.toPrecision(8):'');for(const e of this.net.els)if(e.k==='S'||e.k==='D')key+=e.on?'1':'0';
    for(const e of this.net.els)if(e.k==='G'&&e.sched)key+='|'+e.Rnow;
    for(const e of this.chbEls)key+='|'+e.sKey;}
   let f=key&&this.cache.get(key);
   const st=this.lustat;if(f)st.hit++;
   if(!f){st.fact++;if(key)st.miss++;f=this.factor(h,mode);if(key){if(this.cache.size>256)this.cache.clear();this.cache.set(key,f);}}
   this.rhs(h,mode);const sol=this.b.slice();if(f.sp)SPM.solve(f.sp,sol,this.spw);else luSolve(f.A,this.n,f.piv,sol);return sol;
  }
  solve(h,mode){
   if(!this.hasCPL&&!this.hasNL)return this.solveOnce(h,mode);
   for(const e of this.net.els)if(e.k==='CPL')e.v0=this.V(e.a)-this.V(e.b);
   // the arc state: trapezoidal with the trapezoidal rule while the step is not longer than the section's time constant,
   // backward Euler otherwise (a section faster than the step would ring with θ = ½)
   if(this.arcEls.length)for(const e of this.arcEls){const A=e.arc;A.h=h;A.th=mode==='TR'&&h<=A.tau0*(A.alpha?Math.exp(A.alpha*A.x):1)?0.5:1;A.xg=null;A.F0=A.closed?0:arcF(A,A.x,A.u).F;}
   if(this.saiEls.length)for(const e of this.saiEls)saiSetup(e.sai,h,mode,this.bdf);
   const n=this.hasNL?80:12;let sol,bad=null;for(let it=0;it<n;it++){this.cplLinearize();this.nlLinearize();sol=this.solveOnce(h,mode);
    let conv=true;bad=null;const V=i=>i<0?0:sol[i];
    for(const e of this.net.els){if(e.k==='CPL'){const v=V(e.a)-V(e.b);if(Math.abs(v-e.v0)>1e-9*(1+Math.abs(v))){conv=false;bad=e;}e.v0=v;}
     // arrester: Newton with the voltage limited on the steep part (the voltage that gives the linearized current on the true curve)
     else if(e.k==='NL'){let v=V(e.a)-V(e.b);if(!e.arc&&!e.sai&&Math.abs(v)>Math.abs(e.v0)){const it2=e.g*v+e.J,vi=e.ch.inv(it2);if(Math.sign(it2)===Math.sign(v)&&Math.abs(vi)<Math.abs(v))v=vi;}
      if(Math.abs(v-e.v0)>1e-9*(1+Math.abs(v))){conv=false;bad=e;}e.v0=v;}}
    if(conv){bad=null;break;}}
   if(bad&&this.note){const id=bad.cid,lb=this.net.compInfo.get(id)?.label||id; // 3.13: shown in the diagnostics console
    this.note('newton:'+id,{sev:'warn',grp:'nl',id,msg:`Η επανάληψη Newton στο ${lb} δεν συνέκλινε σε ${n} επαναλήψεις (t = ${P.eng(this.t,'s',4)}).`,fix:bad.k==='NL'?'Μικρότερο βήμα στο μέτωπο, ή πίνακας V–I με λιγότερο απότομη κλίση.':'Η σταθερή ισχύς κοντά στο V_min αλλάζει απότομα: μικρότερο βήμα ή μεγαλύτερο V_min.'});}
   return sol;
  }
  nlLinearize(){for(const e of this.net.els)if(e.k==='NL'){const q=e.ch.cur(e.v0);e.g=q.g+1e-12;e.J=q.i-e.g*e.v0;}}
  // diode consistency of a trial solution; returns [{e, frac}] (frac: where the transition occurred inside the step)
  // init: at t = 0 a thyristor may already be latched (it carries the initial inductor current)
  check(sol,init){
   const bad=[];const V=i=>i<0?0:sol[i];
   for(const e of this.net.els)if(e.k==='D'){const v=V(e.a)-V(e.b);
    // spark gap (3.10): closes at |v| = U_b or at its trigger time; opens when the current crosses zero (or I_ext) after flowing
    if(e.gap){const g=e.gap;
     if(e.on){if(g.ext==='never')continue;const i0=e.iPrev||0,sg=Math.sign(i0);if(!sg)continue;const lim=g.ext==='iext'&&Math.abs(i0)>=g.Iext?g.Iext:0,i=v/e.Ron;
      if(sg*i<lim-1e-9*(1+Math.abs(i0)))bad.push({e,frac:(sg*i0-lim)/(sg*i0-sg*i)});}
     else if(!e.trigDone&&this.t>=g.trig-1e-9*this.h)bad.push({e,frac:0}); // trigger: from the start of the step that begins at t_trig
     // right after a current-zero extinction the inductor currents are held: the residual current through R_off is not a breakdown
     else if(e.tOff!==this.tChk){if(g.de){const q=g.de,dt=this.tChk-this.t,need=q.D-(e.Dacc||0),v0=e.vPrev??0;if(dt>0&&dt*deInt(v0,v,1,q.U0,q.k)>=need*(1-1e-9))bad.push({e,frac:need>0?deFrac(v0,v,need/dt,q.U0,q.k):0});}
      else{const x=Math.abs(v),x0=Math.abs(e.vPrev??0);if(x>g.Ub*(1+1e-9))bad.push({e,frac:x0<g.Ub?(g.Ub-x0)/(x-x0):0});}}
     continue;}
    if(e.on){const i=(v-e.Vf)/e.Ron;if(i<-1e-9*(1+Math.abs(e.iPrev||0))){const i0=e.iPrev??0;bad.push({e,frac:i0>0?i0/(i0-i):0});}}
    else if(v>e.Vf+1e-7&&(!e.gk||e.gon||(init&&e.gk==='scr'))){const v0=e.vPrev??(e.Vf-1);bad.push({e,frac:v0<e.Vf?(e.Vf-v0)/(v-v0):0});}}
   return bad;
  }
  commit(sol,h,mode){
   const old=this.x;this.x=sol;
   for(const e of this.net.els){
    if(e.k==='L'){const v=this.V(e.a)-this.V(e.b);e.i1=e.i;e.i=e.g*v+e.J;}
    else if(e.k==='C'){const v=this.V(e.a)-this.V(e.b);e.v1=e.v;e.i=e.g*v+e.J;e.v=v;}
    else if(e.k==='D'){const v=this.V(e.a)-this.V(e.b),q=e.gap?.de;if(q)e.Dacc=e.on||Math.abs(v)<=q.U0?0:(e.Dacc||0)+h*deInt(e.vPrev??0,v,1,q.U0,q.k); // the effect builds only above U₀
     e.vPrev=v;e.iPrev=e.on?(v-e.Vf)/e.Ron:v/e.Roff;if(e.gap&&e.on&&this.t+h>=e.gap.trig)e.trigDone=true;}
    else if(e.k==='CPL'){const v=this.V(e.a)-this.V(e.b);e.v0=v;if(Math.abs(v)<e.Vmin){e.g=e.Pnow/(e.Vmin*e.Vmin);e.J=0;}else{e.g=e.Pnow/(v*v);e.J=0;}}
    else if(e.k==='F'){const N=e.N,G=e.Gnow;e.psi1.set(e.psi);for(let k=0;k<N;k++){const [a,bb]=e.ports[k];e.psi[k]=e.base[k]+e.cc*(this.V(a)-this.V(bb));}
     for(let k=0;k<N;k++){let s=0;for(let j=0;j<N;j++)s+=G[k*N+j]*(e.psi[j]-(e.p0?e.p0[j]:0));e.i[k]=s;}}
    else if(e.k==='TL')this.tlRecord(e,this.t+h);
    else if(e.k==='TLM')this.tlmRecord(e,this.t+h,h);
    else if(e.k==='CHB')chbCommit(e,sol[e.row],mode,this.bdf);
   }
   if(this.arcEls.length)for(const e of this.arcEls){const A=e.arc,v=this.V(e.a)-this.V(e.b);if(!A.closed){A.h=h;A.x=arcStep(A,v).x;}A.u=v;A.h=0;A.xg=null;e.v0=v;}
   if(this.saiEls.length)for(const e of this.saiEls){const v=this.V(e.a)-this.V(e.b);saiCommit(e.sai,v);e.v0=v;}
   if(this.ims)for(const m of this.ims)this.imStep(m,h);
   if(this.sms)for(const m of this.sms)this.smStep(m,h);
   if(this.srms)for(const m of this.srms)this.srmStep(m,h);
   if(this.gens)for(const m of this.gens)this.genStep(m,h);
   this.t+=h;this.steps++;this.hLast=h;this.cMode=mode;
  }
  // consistent initial solution at t=0: inductors act as current sources (i0),
  // capacitors as voltage sources (v0): backward Euler with a vanishing step
  initialSolve(x0){
   this.values(0);this.gateSig(0);const hs=this.h*1e-6;let sol=null;
   const ic=x0?this.net.els.filter(e=>e.k==='C').map(e=>[e,e.i]):null;for(const e of this.net.els)if(e.k==='C')e.i=0;
   // a steady start (x0) keeps the switch states of the phasor solution: a gated thyristor conducts, a diode does not
   if(x0)for(const e of this.net.els){if(e.k==='D'&&!e.gap)e.on=!!(e.gk&&e.gon);}
   for(let it=0;it<40;it++){sol=this.solve(hs,'BE');if(x0)break;const bad=this.check(sol,true);if(!bad.length)break;for(const b of bad)b.e.on=!b.e.on;}
   this.x=sol;if(x0){for(let i=0;i<x0.length&&i<sol.length;i++)sol[i]=x0[i];for(const [e,i] of ic)e.i=i;} // 4.3: the steady start of a load flow (acInit), capacitor currents included
   for(const e of this.net.els){const v=this.V(e.a)-this.V(e.b);if(e.k==='D'){e.vPrev=v;e.iPrev=e.on?(v-e.Vf)/e.Ron:v/e.Roff;}if(e.k==='CPL')e.v0=v;if(e.k==='TL'&&!e.H.t.length)this.tlRecord(e,0);if(e.k==='TLM'&&!e.H.t.length)this.tlmRecord(e,0,0);}
   this.computeVals();
  }
  // line (3.8, losses 3.11): history sources of every section at time t from the record at t − τ/N (Dommel, lumped R/4, R/2, R/4).
  // Column j ≤ N: voltage of junction j (0 = start, N = end); N+1+j: current into section j at its start; 2N+1+j: at its end.
  tlSources(e,t){const N=e.N,q=this.tlHist(e,t-e.ts),Ze=e.Ze,h=e.hh,cp=(1+h)/2,cm=(1-h)/2,S=e.IhS;
   for(let j=0;j<N;j++){const AL=q[j]/Ze+h*q[N+1+j],AR=q[j+1]/Ze+h*q[2*N+1+j];S[2*j]=-cp*AR-cm*AL;S[2*j+1]=-cp*AL-cm*AR;}
   e.Ih[0]=S[0];e.Ih[1]=S[2*N-1];}
  // after a step: the end voltages come from the solution, the inner junctions from their own KCL (only two sections meet there)
  tlRecord(e,t){const H=e.H,N=e.N,Ze=e.Ze,S=e.IhS,C=H.c,v1=this.V(e.a1)-this.V(e.b1),v2=this.V(e.a2)-this.V(e.b2);
   H.t.push(t);C[0].push(v1);C[N].push(v2);for(let k=1;k<N;k++)C[k].push(-Ze*(S[2*k-1]+S[2*k])/2);
   for(let j=0;j<N;j++){C[N+1+j].push(C[j][C[j].length-1]/Ze+S[2*j]);C[2*N+1+j].push(C[j+1][C[j+1].length-1]/Ze+S[2*j+1]);}
   e.iE[0]=C[N+1][C[N+1].length-1];e.iE[1]=C[3*N][C[3*N].length-1];
   while(H.s+2<H.t.length&&H.t[H.s+1]<t-1.5*e.ts)H.s++;if(H.s>4096){H.t.splice(0,H.s);for(const c of C)c.splice(0,H.s);H.cut+=H.s;H.s=0;}}
  // all columns at time tq by linear interpolation; zero before t = 0 (the line starts de-energized)
  tlHist(e,tq){const H=e.H,n=H.t.length,C=H.c,out=e.q;if(!n||tq<Math.min(0,H.t[0])-1e-18){out.fill(0);return out;}let j=n-1;
   if(tq>=H.t[j]){for(let k=0;k<C.length;k++)out[k]=C[k][j];return out;}let lo=H.s,hi=j;if(tq<=H.t[lo]){for(let k=0;k<C.length;k++)out[k]=C[k][lo];return out;}
   while(hi-lo>1){const m=(lo+hi)>>1;if(H.t[m]<=tq)lo=m;else hi=m;}const f=(tq-H.t[lo])/((H.t[hi]-H.t[lo])||1);
   for(let k=0;k<C.length;k++){const c=C[k];out[k]=c[lo]+(c[hi]-c[lo])*f;}return out;}
  // ------------------------------------------------------------ line from geometry (4.4)
  // the phase conductance at each end for the step h: T_i·diag(1/Z_e or 1/Z_eq(h))·T_iᵀ (the same at both ends)
  tlmG(e,h){if(e.gH===h)return e.Gp;const M=e.M,Ti=e.Ti,G=e.Gp,gk=new Float64Array(M);
   for(let k=0;k<M;k++){const m=e.modes[k];if(m.cp)gk[k]=1/m.Ze;else{let Z=m.d;for(let i=0;i<m.kp.length;i++){const c=rcCoef(m.kp[i],h);Z+=m.kr[i]*(c[1]-c[2]);}m.Zeq=Z;gk[k]=1/Z;}}
   for(let r=0;r<M;r++)for(let q=0;q<M;q++){let s=0;for(let k=0;k<M;k++)s+=Ti[r*M+k]*gk[k]*Ti[q*M+k];G[r*M+q]=s;}e.gH=h;return G;}
  // history sources at t (the end of the step that starts at this.t): per mode, then to the phases with T_i
  tlmSources(e,t){const M=e.M,h=Math.max(0,t-this.t),Ihm=e.Ihm;if(e.fd)this.tlmG(e,h);
   for(let k=0;k<M;k++){const m=e.modes[k];
    if(m.cp){const q=this.tlmHist(e,t-m.tau),v1=q[4*k],v2=q[4*k+1],i1=q[4*k+2],i2=q[4*k+3],Ze=m.Ze,hh=m.hh,cp=(1+hh)/2,cm=(1-hh)/2;
     const AL=(v1/Ze+hh*i1)*m.att,AR=(v2/Ze+hh*i2)*m.att;Ihm[k]=-cp*AR-cm*AL;Ihm[M+k]=-cp*AL-cm*AR;continue;}
    // inputs of the propagation convolutions: f of the other end at t − τ and t − h − τ
    let q=this.tlmHist(e,t-m.tau);const u1=q[2*k+1],u2=q[2*k];q=this.tlmHist(e,t-h-m.tau);const u1p=q[2*k+1],u2p=q[2*k];
    m.u[0]=u1;m.u[1]=u1p;m.u[2]=u2;m.u[3]=u2p;let b1=0,b2=0;
    for(let i=0;i<m.ap.length;i++){const [E,a0,a1]=rcCoef(m.ap[i],h),c=m.ar[i];b1+=E*m.y1[i]+c*(a0*u1+a1*(u1p-u1));b2+=E*m.y2[i]+c*(a0*u2+a1*(u2p-u2));}
    let hz1=0,hz2=0;for(let i=0;i<m.kp.length;i++){const [E,,a1]=rcCoef(m.kp[i],h),c=m.kr[i];hz1+=c*(E*m.z1[i]+a1*m.i1);hz2+=c*(E*m.z2[i]+a1*m.i2);}
    m.b1=b1;m.b2=b2;m.hz1=hz1;m.hz2=hz2;Ihm[k]=-(hz1+b1)/m.Zeq;Ihm[M+k]=-(hz2+b2)/m.Zeq;}
   const Ti=e.Ti,Ih=e.Ih;for(let r=0;r<M;r++){let s1=0,s2=0;for(let k=0;k<M;k++){s1+=Ti[r*M+k]*Ihm[k];s2+=Ti[r*M+k]*Ihm[M+k];}Ih[r]=s1;Ih[M+r]=s2;}}
  // after a step: modal voltages and currents at both ends, the states of the convolutions, the record for t + τ
  tlmRecord(e,t,h){const M=e.M,Ti=e.Ti,vm=e.vm,H=e.H,C=H.c;
   for(let k=0;k<M;k++){let s1=0,s2=0;for(let r=0;r<M;r++){s1+=Ti[r*M+k]*this.V(e.n1[r]);s2+=Ti[r*M+k]*this.V(e.n2[r]);}vm[k]=s1;vm[M+k]=s2;}
   const im=new Float64Array(2*M);H.t.push(t);
   for(let k=0;k<M;k++){const m=e.modes[k];
    if(m.cp){const i1=vm[k]/m.Ze+e.Ihm[k],i2=vm[M+k]/m.Ze+e.Ihm[M+k];im[k]=i1;im[M+k]=i2;C[4*k].push(vm[k]);C[4*k+1].push(vm[M+k]);C[4*k+2].push(i1);C[4*k+3].push(i2);continue;}
    const Zeq=h>0?m.Zeq:m.d,i1=(vm[k]-m.hz1-m.b1)/Zeq,i2=(vm[M+k]-m.hz2-m.b2)/Zeq;let s1=m.d*i1,s2=m.d*i2;
    for(let i=0;i<m.kp.length;i++){const [E,a0,a1]=rcCoef(m.kp[i],h);m.z1[i]=E*m.z1[i]+a0*i1+a1*(m.i1-i1);m.z2[i]=E*m.z2[i]+a0*i2+a1*(m.i2-i2);s1+=m.kr[i]*m.z1[i];s2+=m.kr[i]*m.z2[i];}
    const u=m.u;for(let i=0;i<m.ap.length;i++){const [E,a0,a1]=rcCoef(m.ap[i],h),c=m.ar[i];m.y1[i]=E*m.y1[i]+c*(a0*u[0]+a1*(u[1]-u[0]));m.y2[i]=E*m.y2[i]+c*(a0*u[2]+a1*(u[3]-u[2]));}
    m.i1=i1;m.i2=i2;im[k]=i1;im[M+k]=i2;C[2*k].push(vm[k]+s1);C[2*k+1].push(vm[M+k]+s2);}
   for(let r=0;r<M;r++){let s1=0,s2=0;for(let k=0;k<M;k++){s1+=Ti[r*M+k]*im[k];s2+=Ti[r*M+k]*im[M+k];}e.iE[r]=s1;e.iE[M+r]=s2;}
   const keep=t-2.5*e.tauMax-4*(this.hUser||0);while(H.s+2<H.t.length&&H.t[H.s+1]<keep)H.s++;
   if(H.s>4096){H.t.splice(0,H.s);for(const c of C)c.splice(0,H.s);H.cut+=H.s;H.s=0;}}
  // all columns at time tq (linear interpolation), zero before t = 0 (the line starts without charge)
  tlmHist(e,tq){const H=e.H,n=H.t.length,C=H.c,out=e.q;if(tq<0||!n){out.fill(0);if(e.vm0){const M=e.M;for(let k=0;k<M;k++){if(e.fd){out[2*k]=out[2*k+1]=e.vm0[k];}else{out[4*k]=out[4*k+1]=e.vm0[k];}}}return out;}const j=n-1;
   if(tq>=H.t[j]){for(let k=0;k<C.length;k++)out[k]=C[k][j];return out;}let lo=H.s,hi=j;if(tq<=H.t[lo]){for(let k=0;k<C.length;k++)out[k]=C[k][lo];return out;}
   while(hi-lo>1){const m=(lo+hi)>>1;if(H.t[m]<=tq)lo=m;else hi=m;}const f=(tq-H.t[lo])/((H.t[hi]-H.t[lo])||1);
   for(let k=0;k<C.length;k++){const c=C[k];out[k]=c[lo]+(c[hi]-c[lo])*f;}return out;}
  // one step of at most h; returns the time actually advanced. Switching energy
  // E_on·|v_before|·|i_after|/(V_ref·I_ref) and E_off·|v_after|·|i_before|/(V_ref·I_ref)
  // is booked when a gate changes.
  step(h){
   if(!this.lossList.length)return this.stepCore(h);
   const gs=e=>e.k==='S'?e.on:e.gon,pre=this.lossList.map(c=>({c,g:gs(c.main),v:this.V(c.main.a)-this.V(c.main.b),i:this.elCurrent(c.main)}));
   const r=this.stepCore(h);
   for(const q of pre){const e=q.c.main,L=q.c.loss,g=gs(e);if(g===q.g)continue;const v=this.V(e.a)-this.V(e.b),i=this.elCurrent(e);
    const E=g?L.Eon*Math.abs(q.v)*Math.abs(i):L.Eoff*Math.abs(v)*Math.abs(q.i);const dE=E/(L.Vref*L.Iref);L.E+=dE;L.Etot+=dE;L.n++;}
   return r;
  }
  stepCore(h){
   const t0=this.t,mid=t0+h/2;let edged=false;
   const sig=this.gateSig(mid),gateChange=sig!==this.prevSig;if(gateChange&&this.arcEls.length)this.arcGate(t0);
   // a programmed jump at t0 (3.15) is a discontinuity like a gate change: the post-jump point at the same instant,
   // then backward Euler (the trapezoidal rule would ring around the jump in a stiff circuit)
   const jump=this.jumpNow,disc=gateChange||jump;this.jumpNow=false;if(disc)this.beLeft=2;
   // for the variable step and the ringing check (3.13): smooth step, method, switching at its start or end
   this.lastSmooth=false;this.lastMode=null;this.lastFlip=this.lastDisc=disc;this.endFlip=false;
   // record the post-switching point at the same instant, so edges are vertical and averages exact
   if(disc&&this.steps>0){this.edgePoint(t0);edged=true;}
   const smooth=!disc&&this.beLeft<=0;let mode=this.beLeft>0?'BE':this.method;this.prevSig=sig;
   if(mode==='BDF2'){const w=this.hLast?h/this.hLast:0;if(!(w>.2&&w<5))mode='BE';else this.bdf={w,a0:(1+2*w)/(1+w),a1:-(1+w),a2:w*w/(1+w)};}
   // 4.9: the trapezoidal rule after backward-Euler steps starts from consistent derivatives (THEORY §TR restart)
   if(mode==='TR'&&this.cMode==='BE'&&this.net.step.trStart!=='be')this.trRestart(t0);
   this.values(t0+h);
   let sol=this.solve(h,mode),bad=this.check(sol);
   if(!bad.length){
    if(!this.net.sig.zc.length){this.commit(sol,h,mode);this.beLeft--;this.lastSmooth=!disc;this.lastMode=mode;return h;}
    // a comparator changes inside the step: cut the step at the crossing (secant on the comparator
    // input, exact for the piecewise-linear currents of switched converters), like a diode transition
    const snap=this.saveState();this.commit(sol,h,mode);const th=this.zcFrac();
    if(th===null){this.beLeft--;this.lastSmooth=!disc;this.lastMode=mode;return h;}
    const hh=Math.max(th*h*(1+1e-7)+1e-9*this.h,Math.min(h,this.h*1e-4));
    if(hh>=h*(1-1e-9)){this.beLeft--;this.lastSmooth=!disc;this.lastMode=mode;return h;}
    this.restoreState(snap);let m=mode;
    if(m==='BDF2'){const w=hh/this.hLast;if(w>.2)this.bdf={w,a0:(1+2*w)/(1+w),a1:-(1+w),a2:w*w/(1+w)};else m='BE';}
    this.values(t0+hh);const s2=this.solve(hh,m);
    this.lastDisc=this.lastFlip=this.endFlip=true; // the comparator changes at the end of the step
    if(!this.check(s2).length){this.commit(s2,hh,m);this.beLeft--;return hh;}
    this.restoreState(snap);this.values(t0+h);sol=this.solve(h,mode);this.commit(sol,h,mode);this.beLeft--;return h;}
   // locate the transition inside the step: current zero-crossings always
   // (diode currents are continuous), voltage crossings only in a smooth regime
   const cands=bad.filter(b=>b.e.on||smooth);
   if(cands.length){
    const frac=Math.min(...cands.map(b=>b.frac));
    // a gap on its volt–time curve may close right at the end of the step (frac up to 1): it is cut there, not at the start of the step
    if(frac>1e-4&&frac<(cands.every(b=>b.e.gap?.de&&!b.e.on)?1+1e-12:.999)&&frac*h>this.h*1e-4){
     const hh=h*frac;if(mode==='BDF2'){const w=hh/this.hLast;if(w>.2)this.bdf={w,a0:(1+2*w)/(1+w),a1:-(1+w),a2:w*w/(1+w)};else mode='BE';}this.values(t0+hh);const s2=this.solve(hh,mode);const V=i=>i<0?0:s2[i];
     const flip=cands.filter(b=>b.frac<=frac*(1+1e-6)+1e-9);
     const ok=flip.every(b=>{const e=b.e,v=V(e.a)-V(e.b);
       if(e.gap){const g=e.gap;if(e.on){const i0=e.iPrev||0,sg=Math.sign(i0),lim=g.ext==='iext'&&Math.abs(i0)>=g.Iext?g.Iext:0;return Math.abs(sg*v/e.Ron-lim)<=.02*Math.abs(sg*i0-lim)+1e-9;}
        if(g.de){const q=g.de,need=q.D-(e.Dacc||0);return Math.abs(hh*deInt(e.vPrev??0,v,1,q.U0,q.k)-need)<=.02*need+1e-12*q.D;}
        return Math.abs(Math.abs(v)-g.Ub)<=.02*Math.abs(g.Ub-Math.abs(e.vPrev??0))+1e-9*g.Ub;}
       if(e.on){const i=(v-e.Vf)/e.Ron,i0=Math.abs(e.iPrev||0);return Math.abs(i)<=.02*i0+1e-9;}
       const v0=Math.abs((e.vPrev??0)-e.Vf);return Math.abs(v-e.Vf)<=.02*v0+1e-6;})&&this.check(s2).every(b=>flip.some(f=>f.e===b.e));
     if(ok){this.lastDisc=this.lastFlip=this.endFlip=true;this.commit(s2,hh,mode);this.recordNow();for(const b of flip){b.e.on=!b.e.on;if(b.e.gap){if(b.e.on)b.e.tOn=this.t;else b.e.tOff=this.t;}}this.beLeft=2;this.edgeSolve(this.t);return hh;}
     this.values(t0+h);
    }
   }
   // transition at the start of the step: iterate the states with backward Euler
   if(!edged){this.edgePoint(t0);this.values(t0+h);sol=this.solve(h,'BE');bad=this.check(sol);}
   for(let it=0;it<30&&bad.length;it++){for(const b of bad){b.e.on=!b.e.on;if(b.e.gap&&b.e.on)b.e.tOn=t0;}sol=this.solve(h,'BE');bad=this.check(sol);}
   this.lastDisc=this.lastFlip=this.endFlip=true;this.commit(sol,h,'BE');this.beLeft=2;return h;
  }
  // algebraic solution right after a switching instant: inductor currents and
  // capacitor voltages held, switch/diode states made consistent
  edgeSolve(t){const hs=this.h*1e-4;this.values(t);let sol=null;
   for(let it=0;it<30;it++){sol=this.solve(hs,'BE');const bad=this.check(sol);if(!bad.length)break;for(const b of bad){b.e.on=!b.e.on;if(b.e.gap){if(b.e.on)b.e.tOn=t;else b.e.tOff=t;}}}
   this.x=sol;}
  edgePoint(t){this.edgeSolve(t);this.evalBlocks('commit');this.recordNow();}
  // 4.9: a pole with an arc closes (R_on) or its contacts separate: the arc starts at the quasi-steady conductance of the
  // present current (q = 1), so the current goes on and the arc voltage is the one of a burning arc
  arcGate(t){for(const e of this.arcEls){const A=e.arc;if(e.gon&&!A.closed){A.closed=true;A.x=A.xmax;}
   else if(!e.gon&&A.closed){const v=this.V(e.a)-this.V(e.b),i=v/A.Ron;A.closed=false;A.x=arcStart(A,i);A.u=i/Math.exp(A.x);A.tsep=t;e.v0=A.u;}}}
  // 4.9 (4.8.2 γ): restart of the trapezoidal rule after backward-Euler steps. The trapezoidal history uses the
  // derivative of every state at t (the voltage of an inductor or flux port, the current of a capacitor); after BE steps
  // the stored values are backward differences, off by O(h), and the error excites the undamped (−1)ⁿ mode of the rule
  // (a Nyquist ripple that never decays in a lossless network, e.g. a generator on a line). The derivatives come
  // instead from the network at t with every state held (a vanishing BE step, as at a switching instant); the states
  // themselves do not change. Switch states stay as they are.
  trRestart(t){const hs=this.h*1e-3;this.values(t+hs);const sol=this.solve(hs,'BE'),V=i=>i<0?0:sol[i];
   for(const e of this.net.els)if(e.k==='C')e.i=(V(e.a)-V(e.b)-e.v)*e.C/hs;
   for(const e of this.saiEls||[]){const S=e.sai,v=V(e.a)-V(e.b);saiCur(S,v);S.ic=(S.ug[0]-S.vc)*S.C/hs;S.v=v;S.u0=S.ug[0];S.u1=S.ug[1];S.h=0;S.ug=null;}
   this.x=sol;this.cMode='TR';}
  nextEvent(tMax){
   let t=tMax;const eps=this.h*1e-6;
   for(const k of this.net.ctrls){if(k.mode==='spwm'){continue;}for(const e of this.ctrlEdges(k))if(e>this.t+eps&&e<t)t=e;
    const tv=k.tk+k.T/2;if(k.mode!=='pp'&&k.carrier!=='saw'&&tv>this.t+eps&&tv<t)t=tv; // carrier minimum
    const tn=(Math.floor((this.t+eps)/k.T-k.phase)+1+k.phase)*k.T;if(tn>this.t+eps&&tn<t)t=tn;} // next period start (after a live phase change)
   for(const q of this.net.shs){const ts=this.shNext(q);if(ts>this.t+eps&&ts<t)t=ts;}
   const sch=(s)=>{if(s)for(const [ts] of s)if(ts>this.t+eps&&ts<t)t=ts;};
   for(const e of this.net.els){if(e.sched)sch(e.sched);if(e.k==='V'&&e.src.sched)sch(e.src.sched);}
   for(const k of this.net.ctrls){sch(k.dsched);if(k.mode==='pi')sch(k.ref);}
   for(const e of this.net.els)if(e.fire)for(const te of this.scrEdges(e))if(te>this.t+eps&&te<t)t=te;
   for(const e of this.net.els)if(e.gap&&!e.trigDone&&e.gap.trig>this.t+eps&&e.gap.trig<t)t=e.gap.trig; // spark-gap trigger
   // signal blocks: clock edges, ramp resets / extremes, programs, discrete updates
   for(const b of this.net.sig.blocks){
    if(b.type==='CLK'||b.type==='RAMP'){const u=b.f*this.t-b.ph,nx=(k,o=0)=>(k+o+b.ph)/b.f,c=[nx(Math.floor(u+1e-9)+1)];
     if(b.type==='CLK'&&b.duty>0&&b.duty<1)c.push(nx(Math.floor(u-b.duty+1e-9)+1,b.duty));if(b.type==='RAMP'&&b.shape==='tri')c.push(nx(Math.floor(u-.5+1e-9)+1,.5));
     for(const te of c)if(te>this.t+eps&&te<t)t=te;}
    else if(b.type==='CONST')sch(b.sched);
    else if(b.type==='PIB'||b.type==='UD'||b.type==='PY'||b.type==='RT'||b.type==='NN'||b.type==='NLC'){const ts=this.shNext(b);if(ts>this.t+eps&&ts<t)t=ts;}
    else if(b.type==='EDGE'&&b.tw>0&&b.st.tOn!==null){const te=b.st.tOn+b.tw;if(te>this.t+eps&&te<t)t=te;} // end of the edge pulse (3.19)
   }
   {const tp=this.progNext();if(tp>this.t+eps&&tp<t)t=tp;} // program of parameter changes (3.19)
   // base-period boundary for statistics
   const Tb=this.T,kb=Math.floor((this.t+eps)/Tb)+1,tb=kb*Tb,tO=t;if(tb>this.t+eps&&tb<t)t=tb;
   this.evStat=t<tO; // only the statistics boundary: not a discontinuity for the variable step
   // a programmed jump of a source, a resistance or a constant block at t: the step ends on its left value (3.15)
   this.evJump=false;if(!this.evStat)out:for(const [sc] of this.jumpScheds())for(const [ts] of sc)if(Math.abs(ts-t)<=eps){this.evJump=true;break out;}
   return t;
  }
  spwmCut(h){ // shorten h to the first SPWM crossing in (t, t+h]
   const sp=this.net.ctrls.filter(k=>k.mode==='spwm');if(!sp.length)return h;
   const outs=sp.some(k=>k.dt>0)?['a','na','b','nb']:['a','b'];
   const sig=t=>outs.map(o=>sp.map(k=>this.gateOf(k,o,t)?'1':'0').join('')).join('');
   const s0=sig(this.t+h*1e-9);if(sig(this.t+h)===s0)return h;
   let lo=0,hi=h;for(let i=0;i<40;i++){const m=(lo+hi)/2;if(sig(this.t+m)===s0)lo=m;else hi=m;}
   return Math.max(hi,this.h*1e-6);
  }
  run(duration,maxSteps=Infinity,deadline=Infinity){
   const tEnd=this.t+duration;let steps=0;const eps=this.h*1e-7,hasDl=deadline!==Infinity;if(this.var&&this.capDirty)this.modeCap();
   while(this.t<tEnd-eps&&steps<maxSteps){
    if(this.progNext()<=this.t+eps){this.progDue(eps);continue;}
    const tn=this.nextEvent(tEnd),stat=this.evStat;let hs=this.var?this.hv:this.h;
    // variable step: right after a switching (a gate that changes now, or a diode/comparator/gap at the end of the last step) the next steps are
    // backward Euler, first order and without an error estimate on the first one: they start at 1/8 and grow ×2 per step
    if(this.var&&(this.endFlipPrev||this.jumpNow||this.gateSigPeek(this.t+Math.min(hs,tn-this.t)/2)!==this.prevSig)){hs=this.hGrid(Math.max(this.hMin,this.hv/8));this.hv=hs;}
    let h=Math.min(hs,tn-this.t);if(tn-this.t-h<this.h*1e-3)h=tn-this.t;
    h=this.spwmCut(h);
    let snap=null,be=0,jn=this.jumpNow;if(this.var){snap=this.saveState();be=this.beLeft;}const t0=this.t;
    this.leftAt=this.evJump?tn:null;
    const hst=this.step(h);
    // variable step (3.13): a step whose local error is above the tolerance is taken again, smaller
    if(this.var){if(this.varCheck(hst,snap,be,!stat&&Math.abs(this.t-tn)<eps)){this.jumpNow=jn;continue;}this.endFlipPrev=this.endFlip;}
    steps++;
    if(hst<this.h*1e-6&&++this.nTiny===2000)this.note('tiny',{sev:'warn',grp:'step',id:null,msg:`Πολλά βήματα κάτω από 10⁻⁶·Δt (συμβάντα πολύ κοντά το ένα στο άλλο, από t = ${P.eng(this.t,'s',4)}).`,fix:'Συνήθως διακόπτης ή συγκριτής που αλλάζει κατάσταση συνεχώς (chattering): έλεγξε την υστέρηση ή τον νεκρό χρόνο.'});
    if(this.method==='TR'&&this.lastSmooth&&!this.lastDisc&&this.stEls.length<=4000)this.ringCheck();else if(this.lastDisc)this.rx=null;
    // land exactly on event times; a programmed jump there makes the next step start like a switching (3.15)
    if(Math.abs(this.t-tn)<eps){this.t=tn;if(this.evJump&&this.jumpAt(tn)){this.jumpNow=true;if(this.ev?.on)for(const [sc,d,id] of this.jumpScheds()){const a=schedAt(sc,tn,d,true),b=schedAt(sc,tn,d);if(a!==b)this.logEv('jump',id,b,{from:a});}}}
    this.leftAt=null;
    if(this.lastDisc||this.topoSig===null)this.topoCheck();
    this.started=true;
    this.evalBlocks('commit');this.blkFresh=true;
    if(this.ev?.on)this.evSwitches(t0);
    const Tb=this.T,onB=Math.abs(this.t/Tb-Math.round(this.t/Tb))<1e-9;
    this.recordNow();
    if(onB&&this.t>0)this.closePeriod();
    // order at one instant: samples (t_sample), then the controller update (t_update); a second
    // point at the same t makes the held value, the carrier reset and the duty step vertical
    const sm=this.sampleHolds();let sb=false;if(sm||this.blkAnyDue()){sb=this.evalBlocks('sample');this.blkFresh=true;}
    const cu=this.sampleControllers(false);if(cu)this.blkFresh=false;if(sm||sb||cu)this.recordNow();this.blkFresh=false;
    // the time limit of the frame after every step (4.6; it was every 256 steps, ~10 ms late on a large circuit)
    if(hasDl&&performance.now()>deadline)break;
   }
   this.computeVals();
   return steps;
  }
 }

 // ---------------------------------------------------------------- batch export
 // The same netlist (fresh initial conditions) plus a "recipe" per requested
 // channel, for the reference run on the server (engine/batch.py).
 function exportForBatch(project,keys){
  // 4.9.1: the parts with a fast implementation go to the server as their detailed one (the same model, ROADMAP §52)
  {const NL=NLIB();if(NL&&NL.forceImpl)project=NL.forceImpl(project,'blocks');}
  // 4.3: a generator that starts from a load flow needs the steady start of the browser (acInit): the states of that netlist
  const lf=(project?.solve?.init==='ac')||JSON.stringify(project?.components||[]).includes('"GEN3"');
  const net=lf?new Sim(project).net:buildNetlist(project),idx=new Map(net.els.map((e,i)=>[e,i]));
  // 4.9.1: the server has no multi-conductor line yet: refused, rather than left out of the circuit
  if(net.els.some(e=>e.k==='TLM')||net.hasPi)throw new NetlistError('Ο λύτης SciPy δεν έχει ακόμη τις πολυφασικές γραμμές (TLM, σταθερές ή FD): τρέχει μόνο ο λύτης της εφαρμογής. Οι μονοφασικές γραμμές (TL), οι πύργοι, τα αλεξικέραυνα και το τόξο τρέχουν και στον SciPy.');
  if(net.els.some(e=>e.sai||e.foot||e.k==='CHB'))throw new NetlistError('Εσωτερικό σφάλμα: συμπαγές στοιχείο (SAIX, RFX, CHBX) στην εξαγωγή για τον SciPy.');
  const F=['k','a','b','R','sched','L','i','C','v','Ron','Roff','Vf','gk','gate','pwm','out','fire','row','src','I','P','Vmin','p1','p2','s1','s2','n','cid','gIn','m','psi','sigIn','wave','ports','N','Gam','Gm','gap','a1','b1','a2','b2','Z','tau','Rl','pts'];
  // synchronous machines (3.5): parameters and initial states; the server integrates ψ_α, ψ_β, ω, θ
  const smList=[...net.compInfo.values()].filter(c=>c.sm).map(c=>c.sm),smx=new Map(smList.map((m,i)=>[m,i]));
  const srmList=[...net.compInfo.values()].filter(c=>c.srm).map(c=>c.srm),srmx=new Map(srmList.map((m,i)=>[m,i]));
  const genList=[...net.compInfo.values()].filter(c=>c.gen).map(c=>c.gen),genx=new Map(genList.map((m,i)=>[m,i]));
  const els=net.els.map(e=>{const o={};for(const k of F)if(e[k]!==undefined&&e[k]!==null)o[k]=e[k];if(e.k==='F'){o.i=Array.from(e.i);o.psi=Array.from(e.psi);if(e.sm){o.sm=smx.get(e.sm);delete o.Gam;}if(e.srm){o.srm=srmx.get(e.srm);delete o.Gam;}if(e.gen){o.gen=genx.get(e.gen);delete o.Gam;}}
   // 4.9.1: an arc section (ARCX): its model and its state; the server integrates x = ln g (engine/batch.py)
   if(e.arc){const A=e.arc;o.arc={lam:A.lam,tau0:A.tau0,alpha:A.alpha,P0:A.P0,P1:A.P1,beta:A.beta,Ron:A.Ron,xmin:A.xmin,xmax:A.xmax,closed:A.closed,x:A.x};}return o;});
  const gens=genList.map(m=>{const g=m.g;return {F:idx.get(m.F),fV:idx.get(m.fV),N:g.N,nd:g.nd,nq:g.nq,Gd:g.Gd,Gq:g.Gq,g0:g.g0,wb:g.wb,f:g.f,Sn:g.Sn,Un:g.Un,vfK:g.vfK,ifK:g.ifK,
   sh:{N:g.sh.N,H:g.sh.H,K:g.sh.K,D:g.sh.D,Dmu:g.sh.Dmu,fr:g.sh.fr,gm:g.sh.gm},exc:m.exc,mech:m.mech,efdS:m.efdS,tmS:m.tmS,efdIn:m.efdIn,tmIn:m.tmIn,Efd0:m.Efd0,Tm0:m.Tm0,V0:m.V0??1,
   term:m.term,nN:m.nN,st:{ph:m.st.ph.slice(),w:m.st.w.slice()}};});
  const srms=srmList.map(m=>({F:idx.get(m.F),N:m.N,Nr:m.Nr,I:m.g.I,C:m.g.C,M:m.g.M,J:m.J,b:m.b,sched:m.sched,tl:m.tl,st:{w:m.st.w,the:m.st.the}}));
  const sms=smList.map(m=>({F:idx.get(m.F),p:m.p,Ld:m.Ld,Lq:m.Lq,psim:m.psim,sat:m.sat,J:m.J,b:m.b,sched:m.sched,tl:m.tl,st:{w:m.st.w,the:m.st.the}}));
  const ci=id=>net.compInfo.get(id),cix=new Map(net.ctrls.map((k,i)=>[k.id,i]));
  const vd=(a,b)=>({v:[[a,1],[b,-1]].filter(q=>q[0]>=0)});
  const V=c=>c&&c.pins?vd(c.pins[0],c.pins[1]):null;
  const I=c=>{if(!c||!c.main)return null;if(c.type==='GEN3')return {i:[[idx.get(c.main),-1]]};if(c.type==='XFMR')return {i:[[idx.get(c.main),-c.main.n],[idx.get(c.mag),1]]};if(c.type==='SW')return {i:[[idx.get(c.main),1],...(c.body?[[idx.get(c.body),-1]]:[])]};return {i:[[idx.get(c.main),1]]};};
  const portRec=(c,pre)=>{const m=pre.match(/^([VI])(\d)$/);if(!m||!c.ports)return null;const q=+m[2]-1;if(q<1||q>=c.ports.length)return null;return m[1]==='V'?vd(c.ports[q][0],c.ports[q][1]):{i:[[idx.get(c.main),1,q]]};};
  const rec=key=>{const [pre,id,pin]=key.split(':');
   if(pre==='VN'){const n=net.pinNet.get(id+':'+pin);return n?{v:n.ground?[]:[[n.index,1]]}:null;}
   if(pre==='N'){const n=net.nets.find(x=>x.canon===key.slice(2));return n?{v:[[n.index,1]]}:null;}
   if(['D','G','REF','MEAS','CAR'].includes(pre)){const k=cix.get(id);if(k===undefined)return null;return pre==='G'?{gate:[k,'a']}:pre==='CAR'?{car:k}:{ctrl:[k,{D:'d',REF:'refNow',MEAS:'meas'}[pre]]};}
   if(pre==='H'){const q=shx.get(id);return q===undefined?null:{sh:q};}
   if(pre==='Y'){const c=ci(id);if(!c||!c.blk)return null;const k=pin?c.blk.outList.indexOf(pin):0;return k<0?null:k?{blk:bix.get(c.blk),out:k}:{blk:bix.get(c.blk)};}
   if(pre==='GS'){const c=ci(id);return c&&c.main&&(c.type==='SW'||c.type==='SCR')?{sw:idx.get(c.main)}:null;}
   if(pre==='Garc'){const c=ci(id);return c&&c.arc?{garc:idx.get(c.arc)}:null;}
   const c=ci(id);if(!c)return null;
   if(c.type==='VAC3'){const ph=c.phases,pv=q=>vd(q.pin,c.n),pi=q=>({i:[[idx.get(q.e),1]]});
    return {V:pv(ph[0]),I:pi(ph[0]),P:{sum:ph.map(q=>({prod:[pv(q),pi(q)]}))},Vb:pv(ph[1]),Vc:pv(ph[2]),Ib:pi(ph[1]),Ic:pi(ph[2]),Vab:vd(ph[0].pin,ph[1].pin)}[pre]||null;}
   if(pre==='V')return V(c);if(pre==='I')return I(c);if(pre==='P'){const a=V(c),b=I(c);return a&&b?{prod:[a,b]}:null;}
   if(c.type==='XFMR'){if(pre==='V2')return vd(c.pins2[0],c.pins2[1]);if(pre==='I2')return {i:[[idx.get(c.main),c.opp?-1:1]]};if(pre==='Im')return {i:[[idx.get(c.mag),1]]};}
   if(c.srm&&/^PSI\d$/.test(pre)){const q=+pre.slice(3)-1;return q<c.srm.N?{srm:[srmx.get(c.srm),q]}:null;}
   if(c.ports)return portRec(c,pre);
   return null;};
  const shx=new Map(net.shs.map((q,i)=>[q.id,i]));
  const clkOf=id=>{const b=net.sig.blocks.find(x=>x.type==='CLK'&&x.id===id);return b?{f:b.f,ph:b.ph}:null;};
  const shs=net.shs.map(q=>({id:q.id,sig:!!q.sig,rec:q.sig?null:q.qty==='V'?V(ci(q.src)):I(ci(q.src)),clock:cix.get(q.clock)??null,clk:clkOf(q.clock),trig:q.trig,h0:Number.isFinite(q.h0)?q.h0:null}));
  // signal blocks in evaluation order, with their initial state and recipes for the measured quantities
  // induction machines: their elements, parameters and initial states (the server integrates ψ_R, ω, θ as ODE states)
  const imList=[...net.compInfo.values()].filter(c=>c.im).map(c=>c.im),imx=new Map(imList.map((m,i)=>[m,i]));
  const ims=imList.map(m=>({ph:m.ph.map(q=>({L:idx.get(q.L),V:idx.get(q.V)})),RR:m.RR,LM:m.LM,p:m.p,J:m.J,b:m.b,sched:m.sched,tl:m.tl,st:{...m.st}}));
  const bix=new Map(net.sig.order.map((b,i)=>[b,i]));
  const blocks=net.sig.order.map(b=>{const o={id:b.id,type:b.type,ins:b.ins,outs:b.outs,st:JSON.parse(JSON.stringify(b.st))};
   for(const f of ['K','sg','eps','lo','hi','hys','op','Kp','Ki','y0','ymin','ymax','f','ph','duty','shape','sched','trig','outList','wrap','tau','pw','w0','track','ast','parVals','inNames','outNames','pars','code','mode','RR','LM','kind','z','up','dn','edge','tw','xs','ys','train','learn','opt','lr','clip','l2','nl','jac','share','k','k0','N','hb','Vdc','avg','red','band','inV'])if(b[f]!==undefined)o[f]=Number.isFinite(b[f])||typeof b[f]!=='number'?b[f]:(b[f]>0?1e300:-1e300);
   if(b.type==='DCM')o.recs={w:{v:[[b.m,1]]},te:{i:[[idx.get(b.gy),b.psi]]}};
   if(b.type==='IM')o.im=imx.get(b.im);
   if(b.type==='SM')o.sm=smx.get(b.sm);
   if(b.type==='GEN3')o.gen=genx.get(b.gen);
   if(b.type==='SRM')o.srm=srmx.get(b.srm);
   if(b.type==='PIB'||b.type==='UD'||b.type==='PY'||b.type==='RT'||b.type==='NN'||b.type==='NLC'){o.clock=cix.get(b.clock)??null;o.clk=clkOf(b.clock);}
   if(b.type==='VM')o.rec=vd(b.np,b.nn);else if(b.type==='AM')o.rec={i:[[idx.get(b.el),-1]]};else if(b.type==='MEAS'){const c=ci(b.src);o.rec=(b.qty==='V'?V(c):I(c))||null;}
   if(b.type==='SH'){o.sh=shx.get(b.id);o.sig=!!b.sig;}return o;});
  const ctrls=net.ctrls.map(k=>{const o={};for(const f of ['id','fs','T','mode','D','dsched','carrier','phase','dt','qty','ref','Kp','Ki','Kd','Tf','ff','D0','dmin','dmax','m','fref','refphase','upd','dIn'])o[f]=k[f];
   const s=ci(k.sensor);o.sensorRec=k.mode==='pi'?(shx.has(k.sensor)?{sh:shx.get(k.sensor)}:k.qty==='V'?V(s):I(s)):null;o.ffARec=V(ci(k.ffA));o.ffBRec=V(ci(k.ffB));return o;});
  const channels={},skipped=[];for(const key of keys){const r=rec(key);if(r)channels[key]=r;else skipped.push(key);}
  // 3.19: the program of parameter changes runs in the browser solver only (it rebuilds the netlist at each entry)
  const notes=Array.isArray(project.program)&&project.program.length?[`Το πρόγραμμα αλλαγών παραμέτρων (${project.program.length}) δεν περνά στον SciPy: τρέχει μόνο στον λύτη του browser και στο pcl. Για τον SciPy γράψε τις αλλαγές ως πρόγραμμα t:τιμή στις παραμέτρους που το δέχονται (D, αναφορά, σταθερά, πηγές, R).`]:[];
  return {net:{nNodes:net.nNodes,size:net.size,els,ctrls,shs,sig:{n:net.sig.n,blocks},ims,sms,srms,gens,tbase:net.tbase},channels,skipped,notes};
 }
 // one point of a parameter sweep (bifurcation diagram): set comp.param = value, run `transient` base periods and
 // return the per-period statistic (min, max, avg, end = value at the period boundary) of channel `key` over the next `record` periods
 function sweepPoint(project,o){const pr=JSON.parse(JSON.stringify(project));setPath(pr,o.comp,o.param,o.value);
  const s=new Sim(pr,{hDiv:o.hDiv||100,method:o.method}),rec=Math.max(1,o.record|0||50);s.run((o.transient??200)*s.T);s.run(rec*s.T);
  const p=s.per,i=s.chIndex.get(o.key);if(i===undefined)throw new NetlistError(`Δεν υπάρχει το κανάλι ${o.key}.`);const st=o.stat==='max'?p.max:o.stat==='avg'?p.avg:o.stat==='end'?p.end:p.min,y=[];
  for(let k=Math.min(rec,p.n);k>=1;k--){const j=(p.head-k+p.cap)%p.cap;y.push(st[j*p.nch+i]);}return {value:o.value,y,T:s.T,warnings:s.net.warnings};}
 // a parameter of a part, also inside a subcircuit instance (X1/L1, 3.17); a string stays a string
 function setPath(pr,id,k,v){if(!String(id).includes('/')){const c=pr.components.find(x=>x.id===id);if(!c)throw new NetlistError(`Δεν υπάρχει στοιχείο ${id}.`);
   c.params={...(c.params||{}),[k]:typeof c.params?.[k]==='string'?String(v):v};return;}
  try{const cur=SUBC.paramOf(pr,id,k);SUBC.setParam(pr,id,k,typeof cur==='string'?String(v):v);}catch(e){throw new NetlistError(e.message);}}
 // one frequency of an impedance sweep (EIS): set comp.param = f, run `settle` + `periods` periods of f, and return the
 // per-period means of the voltage and current channels over the last `periods` periods of f. The same averaging
 // filter acts on both, so their ratio at f is exact (for f below half the base frequency) and the ripple drops out.
 function eisPoint(project,o){const pr=JSON.parse(JSON.stringify(project));setPath(pr,o.comp,o.param,o.f);
  const s=new Sim(pr,{hDiv:o.hDiv||50,method:o.method}),Tf=1/o.f,P=Math.max(1,o.periods|0||2);s.run(Math.max((o.settle??3)*Tf,o.minSettle||0));s.run(P*Tf);
  if(P*Tf>s.per.cap*s.T)throw new NetlistError(`Η συχνότητα ${o.f} Hz θέλει ιστορικό ${P} περιόδων, πάνω από ${s.per.cap} περιόδους βάσης: διάλεξε μεγαλύτερη συχνότητα ή λιγότερες περιόδους.`);
  const p=s.per,iv=s.chIndex.get(o.vKey),ii=s.chIndex.get(o.iKey);if(iv===undefined||ii===undefined)throw new NetlistError('Δεν υπάρχουν τα κανάλια τάσης/ρεύματος.');
  const n=Math.min(p.n,Math.ceil(P*Tf/s.T)+2),t=[],v=[],i=[];for(let k=n;k>=1;k--){const j=(p.head-k+p.cap)%p.cap;t.push(p.t[j]-s.T/2);v.push(p.avg[j*p.nch+iv]);i.push(p.avg[j*p.nch+ii]);}
  return {f:o.f,t,v,i,T:s.T,tEnd:s.t-s.T/2,periods:P,warnings:s.net.warnings};}
 // continue from a saved state (3.16, §41.1): a new solver of the saved project at the saved state. With another project
 // (a parameter changed), the states pass over by key as with a change while running (load without fresh).
 function resume(saved,state,project){const s=new Sim(saved,{...state.opts});s.method=state.method||s.method;s.restoreSnapshot(state);
  if(project&&JSON.stringify(project)!==JSON.stringify(saved))s.load(project,false);return s;}
 const api={Sim,buildNetlist,NetlistError,exportForBatch,sweepPoint,eisPoint,resume,setPath};
 root.MNA=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
