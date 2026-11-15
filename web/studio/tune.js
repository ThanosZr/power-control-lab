'use strict';
// 4.17: the PI/PID gains of a PWM block from the circuit (THEORY §8Α, ROADMAP §59).
//
// A DC-DC converter of a known family (buck, boost, buck–boost, Ćuk, SEPIC) is matched against the circuit: a list of
// roles (V_in, S, D, L1, C1, L2, C2, R), filled by the match and open to the user's choice. Its averaged state-space
// model in CCM (Middlebrook & Ćuk 1976; Erickson & Maksimović ch. 7) is built from the values of those elements:
// ẋ = [d·A₁ + (1 − d)·A₂]·x + d·b₁ + (1 − d)·b₂, the operating point from the reference of the measured quantity, and
// the plant G(s) = ∂y/∂d = c·(sI − A)⁻¹·[(A₁ − A₂)·x₀ + b₁ − b₂], y the measured quantity (a capacitor or load voltage,
// an inductor or load current) with the orientation of the sensor. The law of the PWM block is discrete, sampled once
// (or twice) per period: d = D₀ + K_p·e + K_i·T_s·Σe + K_d·(filtered Δe/T_s). The loop L = C(z)·G(jω)·ZOH(jω) is
// evaluated on a grid up to the Nyquist frequency of the samples; the gains are those of the largest integral gain K_i
// (as MIGO, Åström & Hägglund 2006) that keeps the phase margin (default 50°), a gain margin of 6 dB, a peak
// sensitivity below 2, one crossover, and f_c ≤ f_s/10; or, with a target f_c, the best phase margin there. PI: C(s) = K_i·(1 + s/ω_z)/s, ω_z searched around the plant's resonance; PID: a double zero
// (K_p = 2K_i/ω_z, K_d = K_i/ω_z², T_f = T_s/2), as the buck_vloop tutorial. The signs follow ∂y/∂d: an inverting
// converter (buck–boost, Ćuk) gets negative gains. Used by mna.js when the netlist is built, so any change of the
// circuit recomputes them, and by app.js for the card.
// 4.17.4 (ROADMAP §64): analyze() for the window «Ρύθμιση ελεγκτή» (ctlwin.js): G(s) as a ratio of polynomials
// (Faddeev–LeVerrier), its poles and zeros (Durand–Kerner), the static ratio M(D), the loop and its margins for any gains,
// the closed loop on the averaged (large-signal) model with the controller of the PWM; convStart/convStep: the convergence
// method of the source of Thanos (§3.7) for the output of each converter, shared with mna.js and engine/batch.py
(function(root){
 const P=root.Parts||(typeof require!=='undefined'?require('./parts.js'):null);
 const num=(v,d)=>{const x=typeof v==='number'?v:P&&P.parseEng?P.parseEng(v):parseFloat(v);return Number.isFinite(x)?x:d;};
 // the families: roles with their part type and the node labels of their two pins (g: the source's minus terminal).
 // ord: the orientation is part of the topology (diode, source); otherwise either way, and the sign of the sensor follows
 const TOPO={
  buck:{name:'buck',n:2,st:['i_L1','v_o'],roles:{Vin:['VDC','p','n','in','g',1],S:['SW','d','s','in','sw'],D:['D','a','k','g','sw',1],L1:['L','a','b','sw','out'],C1:['C','p','n','out','g'],R:['R','a','b','out','g']},
   y:{L1:0,C1:1,R:1},
   m:(q)=>{const {Vg,L1,r1,C1,R}=q;const A=[[-r1/L1,-1/L1],[1/C1,-1/(R*C1)]];return {A1:A,b1:[Vg/L1,0],A2:A,b2:[0,0]};}},
  boost:{name:'boost',n:2,st:['i_L1','v_o'],roles:{Vin:['VDC','p','n','in','g',1],L1:['L','a','b','in','sw'],S:['SW','d','s','sw','g'],D:['D','a','k','sw','out',1],C1:['C','p','n','out','g'],R:['R','a','b','out','g']},
   y:{L1:0,C1:1,R:1},
   m:(q)=>{const {Vg,L1,r1,C1,R}=q;return {A1:[[-r1/L1,0],[0,-1/(R*C1)]],b1:[Vg/L1,0],A2:[[-r1/L1,-1/L1],[1/C1,-1/(R*C1)]],b2:[Vg/L1,0]};}},
  buck_boost:{name:'buck–boost',n:2,st:['i_L1','v_o'],roles:{Vin:['VDC','p','n','in','g',1],S:['SW','d','s','in','sw'],L1:['L','a','b','sw','g'],D:['D','a','k','out','sw',1],C1:['C','p','n','out','g'],R:['R','a','b','out','g']},
   y:{L1:0,C1:1,R:1},
   m:(q)=>{const {Vg,L1,r1,C1,R}=q;return {A1:[[-r1/L1,0],[0,-1/(R*C1)]],b1:[Vg/L1,0],A2:[[-r1/L1,1/L1],[-1/C1,-1/(R*C1)]],b2:[0,0]};}},
  cuk:{name:'Ćuk',n:4,st:['i_L1','v_C1','i_L2','v_o'],roles:{Vin:['VDC','p','n','in','g',1],L1:['L','a','b','in','a'],S:['SW','d','s','a','g'],C1:['C','p','n','a','b'],D:['D','a','k','b','g',1],L2:['L','a','b','b','out'],C2:['C','p','n','out','g'],R:['R','a','b','out','g']},
   y:{L1:0,C1:1,L2:2,C2:3,R:3},
   m:(q)=>{const {Vg,L1,r1,C1,L2,r2,C2,R}=q;
    return {A1:[[-r1/L1,0,0,0],[0,0,1/C1,0],[0,-1/L2,-r2/L2,-1/L2],[0,0,1/C2,-1/(R*C2)]],b1:[Vg/L1,0,0,0],
     A2:[[-r1/L1,-1/L1,0,0],[1/C1,0,0,0],[0,0,-r2/L2,-1/L2],[0,0,1/C2,-1/(R*C2)]],b2:[Vg/L1,0,0,0]};}},
  sepic:{name:'SEPIC',n:4,st:['i_L1','v_C1','i_L2','v_o'],roles:{Vin:['VDC','p','n','in','g',1],L1:['L','a','b','in','a'],S:['SW','d','s','a','g'],C1:['C','p','n','a','b'],L2:['L','a','b','b','g'],D:['D','a','k','b','out',1],C2:['C','p','n','out','g'],R:['R','a','b','out','g']},
   y:{L1:0,C1:1,L2:2,C2:3,R:3},
   m:(q)=>{const {Vg,L1,r1,C1,L2,r2,C2,R}=q;
    return {A1:[[-r1/L1,0,0,0],[0,0,1/C1,0],[0,-1/L2,-r2/L2,0],[0,0,0,-1/(R*C2)]],b1:[Vg/L1,0,0,0],
     A2:[[-r1/L1,-1/L1,0,-1/L1],[1/C1,0,0,0],[0,0,-r2/L2,1/L2],[1/C2,0,-1/C2,-1/(R*C2)]],b2:[Vg/L1,0,0,0]};}}};
 const ORDER=['cuk','sepic','buck','boost','buck_boost'];
 const ROLE_KEY={Vin:'rVin',L1:'rL1',C1:'rC1',L2:'rL2',C2:'rC2',R:'rR'};
 // ---------------------------------------------------------------- matching the roles against the circuit
 // comps: [{id, type}], nodeOf(id, pin) → a key of the node (or null), forced: {role: id} from the user's list.
 // Labels map injectively to nodes. Returns {roles: {role: id}, sign: {role: ±1}} or null.
 function match(key,comps,nodeOf,forced={}){const T=TOPO[key];if(!T)return null;const R=Object.keys(T.roles);
  const lab=new Map(),nl=new Map(),used=new Set(),roles={},sign={};
  const put=(L,n,undo)=>{if(n==null)return false;if(lab.has(L))return lab.get(L)===n;if(nl.has(n))return false;lab.set(L,n);nl.set(n,L);undo.push(L);return true;};
  const go=i=>{if(i===R.length)return true;const r=R[i],[ty,p1,p2,l1,l2,ord]=T.roles[r];
   const cands=forced[r]?comps.filter(c=>c.id===forced[r]&&c.type===ty):comps.filter(c=>c.type===ty);
   for(const c of cands){if(used.has(c.id))continue;
    for(const flip of ord?[false]:[false,true]){const undo=[];const a=nodeOf(c.id,flip?p2:p1),b=nodeOf(c.id,flip?p1:p2);
     if(put(l1,a,undo)&&put(l2,b,undo)){used.add(c.id);roles[r]=c.id;sign[r]=flip?-1:1;if(go(i+1))return true;used.delete(c.id);delete roles[r];delete sign[r];}
     for(const L of undo){nl.delete(lab.get(L));lab.delete(L);}}}
   return false;};
  return go(0)?{roles,sign}:null;}
 // the family of the circuit: the one that matches (the user's choice, or the first of ORDER)
 function recognise(topo,comps,nodeOf,forced){const keys=topo&&topo!=='auto'?[topo]:ORDER;
  for(const k of keys){const m=match(k,comps,nodeOf,forced);if(m)return {key:k,...m,forcedOk:true};}
  // the user's list does not fit the template: the match without it, then the user's elements in their roles
  for(const k of keys){const m=match(k,comps,nodeOf,{});if(m){for(const [r,id] of Object.entries(forced))if(id&&m.roles[r]!==undefined&&comps.some(c=>c.id===id)){m.roles[r]=id;m.sign[r]=1;}return {key:k,...m,forcedOk:false};}}
  return null;}
 // ---------------------------------------------------------------- small linear algebra (n ≤ 4)
 function solveR(A,b){const n=b.length,M=A.map((r,i)=>[...r,b[i]]);
  for(let c=0;c<n;c++){let p=c;for(let r=c+1;r<n;r++)if(Math.abs(M[r][c])>Math.abs(M[p][c]))p=r;if(Math.abs(M[p][c])<1e-300)return null;[M[c],M[p]]=[M[p],M[c]];
   for(let r=c+1;r<n;r++){const f=M[r][c]/M[c][c];for(let k=c;k<=n;k++)M[r][k]-=f*M[c][k];}}
  const x=new Array(n).fill(0);for(let r=n-1;r>=0;r--){let s=M[r][n];for(let k=r+1;k<n;k++)s-=M[r][k]*x[k];x[r]=s/M[r][r];}return x;}
 // (jω·I − A)·x = b with complex x: real and imaginary parts as a real system of size 2n
 function solveJ(A,b,w){const n=b.length,M=[],r=[];for(let i=0;i<n;i++){const row=new Array(2*n).fill(0);for(let k=0;k<n;k++){row[k]=-A[i][k];row[n+k]=0;}row[n+i]=-w;M.push(row);r.push(b[i]);}
  for(let i=0;i<n;i++){const row=new Array(2*n).fill(0);for(let k=0;k<n;k++){row[n+k]=-A[i][k];}row[i]=w;M.push(row);r.push(0);}
  const x=solveR(M,r);return x?[x.slice(0,n),x.slice(n)]:null;}
 const mix=(X,Y,d)=>X.map((r,i)=>Array.isArray(r)?r.map((v,k)=>d*v+(1-d)*Y[i][k]):d*r+(1-d)*Y[i]);
 // ---------------------------------------------------------------- the model of a recognised converter
 function model(key,q){const T=TOPO[key],M=T.m(q);
  const op=D=>{const A=mix(M.A1,M.A2,D),b=mix(M.b1,M.b2,D),x=solveR(A,b.map(v=>-v));return {A,b,x};};
  return {T,M,op};}
 // the measured quantity as c·x (role, qty, sign of the sensor): null when the model has no such output
 function output(T,role,qty,sign,q){if(!role||T.y[role]===undefined)return null;const c=new Array(T.n).fill(0),k=T.y[role],ty=T.roles[role][0];
  if(qty==='V'&&(ty==='C'||ty==='R'))c[k]=sign;else if(qty==='I'&&ty==='L')c[k]=sign;else if(qty==='I'&&ty==='R')c[k]=sign/q.R;else return null;return c;}
 const dot=(c,x)=>c.reduce((s,v,i)=>s+v*x[i],0);
 // the loop at the grid frequencies: C(z)·G·ZOH with gains {Kp, Ki, Kd, Tf} on a plant already of positive DC gain
 function loopAt(g,Gw,W,Tc){const out=new Array(W.length);
  for(let k=0;k<W.length;k++){const w=W[k],th=w*Tc,zr=Math.cos(th),zi=Math.sin(th);
   // K_i·T_s·z/(z − 1)
   const dr=zr-1,di=zi,dd=dr*dr+di*di,ir=g.Ki*Tc*(zr*dr+zi*di)/dd,ii=g.Ki*Tc*(zi*dr-zr*di)/dd;
   let cr=g.Kp+ir,ci=ii;
   if(g.Kd){const a=g.Tf/(g.Tf+Tc),u=Tc/(g.Tf+Tc);// K_d·(1 − z⁻¹)/T_s · u/(1 − a·z⁻¹)
    const nr=1-zr,ni=zi,er=1-a*zr,ei=a*zi,ed=er*er+ei*ei,qr=(nr*er+ni*ei)/ed,qi=(ni*er-nr*ei)/ed,f=g.Kd*u/Tc;cr+=f*qr;ci+=f*qi;}
   const [Gr,Gi]=Gw[k];out[k]=[cr*Gr-ci*Gi,cr*Gi+ci*Gr];}
  return out;}
 // margins of a loop on the grid: crossover, phase margin, gain margin (×), peak sensitivity; ok against the spec
 function margins(Lw,W,spec){const n=W.length,mag=Lw.map(z=>Math.hypot(z[0],z[1]));let ph=[],prev=null,acc=0;
  for(const z of Lw){let a=Math.atan2(z[1],z[0]);if(prev!==null){while(a-prev>Math.PI)a-=2*Math.PI;while(a-prev<-Math.PI)a+=2*Math.PI;}prev=a;ph.push(a);}
  // the integrator starts at −90°: bring the low end to (−π, 0]
  const sh=Math.round((ph[0]+Math.PI/2)/(2*Math.PI))*2*Math.PI;ph=ph.map(a=>a-sh);
  if(!(mag[0]>1))return {ok:false,why:'low'};let k=1;while(k<n&&mag[k]>=1)k++;if(k>=n)return {ok:false,why:'nocross'};
  const f=Math.log(mag[k-1])/(Math.log(mag[k-1])-Math.log(mag[k])),wc=Math.exp(Math.log(W[k-1])+f*(Math.log(W[k])-Math.log(W[k-1]))),pc=ph[k-1]+f*(ph[k]-ph[k-1]);
  const pm=180+pc*180/Math.PI;let gm=Infinity,re=false,ms=0;
  for(let j=0;j<n;j++){const s=Math.hypot(1+Lw[j][0],Lw[j][1]);ms=Math.max(ms,1/s);if(j>=k){if(mag[j]>=1)re=true;if(ph[j]<=-Math.PI)gm=Math.min(gm,1/mag[j]);}}
  const ok=!re&&pm>=spec.pm&&gm>=spec.gm&&ms<=spec.ms&&wc<=spec.wcMax;return {ok,wc,pm,gm,ms,re};}
 // ---------------------------------------------------------------- the design
 // o: {p: the PWM's parameters (with defaults), comps: [{id, type, params}], nodeOf, strict: an exact circuit only (the
 // check of hand-set gains)}. Returns {ok, …} with the gains, or {ok: false, error}.
 // 4.17.4: the common part of design() and analyze(): the converter, its averaged model at the operating point, G(jω)
 function prep(o){const p=o.p,warn=[];const comps=o.comps.map(c=>({id:c.id,type:c.type,params:c.params||{}}));
  const forced={};for(const [r,k] of Object.entries(ROLE_KEY))if(p[k])forced[r]=p[k];
  const rec=recognise(p.topo||'auto',comps,o.nodeOf,forced);
  if(!rec)return {ok:false,error:'δεν αναγνωρίζεται buck, boost, buck–boost, Ćuk ή SEPIC στο κύκλωμα'};
  const T=TOPO[rec.key],roles=rec.roles,byId=new Map(comps.map(c=>[c.id,c])),val=(r,k,d)=>{const c=byId.get(roles[r]);if(!c)return d;const def=P&&P.defaults?P.defaults(c.type):{};return num(c.params[k]??def[k],d);};
  if(o.strict){const cnt=t=>comps.filter(c=>c.type===t).length,need=t=>Object.values(T.roles).filter(r=>r[0]===t).length;
   if(['SW','D','L','C'].some(t=>cnt(t)!==need(t)))return {ok:false,error:'not exact'};}
  else{const extra=comps.filter(c=>['L','C','SW','D'].includes(c.type)&&!Object.values(roles).includes(c.id)).map(c=>c.id);if(extra.length)warn.push(`το μέσο μοντέλο αγνοεί ${extra.slice(0,4).join(', ')}${extra.length>4?' κ.ά.':''}`);}
  if(!rec.forcedOk)warn.push(`τα στοιχεία της λίστας δεν συνδέονται όπως στο ${T.name}· μπαίνουν στους ρόλους τους, αλλά τα κέρδη μπορεί να μην ισχύουν`);
  const q={Vg:val('Vin','V',12)*(rec.sign.Vin||1),L1:Math.max(val('L1','L',1e-4),1e-12),r1:val('L1','Rs',0),C1:Math.max(val('C1','C',1e-4),1e-15),L2:Math.max(val('L2','L',1e-4),1e-12),r2:val('L2','Rs',0),C2:Math.max(val('C2','C',1e-4),1e-15),R:Math.max(val('R','R',10),1e-9)};
  // the sensor: one of the roles, with its orientation
  const sRole=Object.keys(roles).reverse().find(r=>roles[r]===p.sensor),qty=p.qty||'I';   // the output roles first
  const c=output(T,sRole,qty,sRole?rec.sign[sRole]:1,q);
  if(!c)return {ok:false,error:`το μετρούμενο στοιχείο ${p.sensor||'—'} (${qty==='V'?'τάση':'ρεύμα'}) δεν είναι έξοδος του μέσου μοντέλου του ${T.name}: διάλεξε την τάση πυκνωτή ή φορτίου, ή ρεύμα πηνίου`,key:rec.key,roles};
  const md=model(rec.key,q),fs=Math.max(num(p.fs,20e3),1e-3),Tp=1/fs,dbl=p.upd==='double'&&p.carrier!=='saw',Tc=dbl?Tp/2:Tp;
  const dmin=Math.max(num(p.dmin,.01),1e-4),dmax=Math.min(num(p.dmax,.99),1-1e-4),ref=P&&P.parseSched?((P.parseSched(String(p.ref??'0'))||[[0,0]])[0][1]):num(p.ref,0);
  // operating point: y(D) = ref on a scan of D, then bisection
  const yOf=D=>{const r=md.op(D);return r.x?dot(c,r.x):NaN;};let D0=null,best=null;const NS=400;let ya=yOf(dmin),Da=dmin;
  for(let i=1;i<=NS;i++){const Db=dmin+(dmax-dmin)*i/NS,yb=yOf(Db);if(Number.isFinite(ya)&&Number.isFinite(yb)&&(ya-ref)*(yb-ref)<=0){let lo=Da,hi=Db,flo=ya-ref;for(let it=0;it<60;it++){const m=(lo+hi)/2,fm=yOf(m)-ref;if(flo*fm<=0)hi=m;else{lo=m;flo=fm;}}D0=(lo+hi)/2;break;}
   const e=Math.abs(yb-ref);if(Number.isFinite(e)&&(!best||e<best.e))best={e,D:Db};ya=yb;Da=Db;}
  if(D0===null){D0=best?best.D:(dmin+dmax)/2;warn.push(`η αναφορά ${ref} δεν επιτυγχάνεται με D από ${dmin} ως ${dmax} (${T.name}${Math.sign(ref)!==Math.sign(yOf((dmin+dmax)/2))?': αντίθετο πρόσημο από την έξοδο':''})· μοντέλο στο D = ${D0.toFixed(3)}`);}
  const op=md.op(D0),x0=op.x;
  // CCM: the mean of each inductor current against half its ripple in the on-interval
  const s1=md.M.A1.map((r,i)=>dot(r,x0)+md.M.b1[i]);
  T.st.forEach((nm,i)=>{if(nm[0]!=='i')return;const L=i===0?q.L1:q.L2,di=Math.abs(s1[i])*D0*Tp;if(Math.abs(x0[i])<di/2)warn.push(`${nm}: ⟨i⟩ = ${x0[i].toPrecision(3)} A < Δi/2 = ${(di/2).toPrecision(3)} A, λειτουργία DCM· το μέσο μοντέλο CCM δεν ισχύει`);void L;});
  const bd=md.M.A1.map((r,i)=>dot(r,x0)-dot(md.M.A2[i],x0)+md.M.b1[i]-md.M.b2[i]);
  const Gat=w=>{const r=solveJ(op.A,bd,w);return r?[dot(c,r[0]),dot(c,r[1])]:[NaN,NaN];};
  const G0=dot(c,solveR(op.A,bd.map(v=>-v))||[NaN]);
  if(!Number.isFinite(G0)||Math.abs(G0)<1e-12)return {ok:false,error:'∂(μέτρηση)/∂D = 0 στο σημείο λειτουργίας',key:rec.key,roles};
  const sg=Math.sign(G0);
  if(o.signOnly)return {ok:true,key:rec.key,name:T.name,roles,sign:rec.sign,G0,sg,D0,warn,values:q,ref,c,md,sRole,qty,op,bd,x0,Tc,Tp,fs,dmin,dmax,T,rec,p,signOnly:true};
  // the grid: up to the Nyquist frequency of the samples; the plant with its sign removed, times the zero-order hold
  const wN=Math.PI/Tc,NW=480,wLo=wN*1e-7,W=[];for(let i=0;i<NW;i++)W.push(wLo*Math.pow(0.98*wN/wLo,i/(NW-1)));
  const Graw=W.map(Gat),Gw=W.map((w,i)=>{const g=Graw[i],th=w*Tc,zr=Math.sin(th)/th,zi=-(1-Math.cos(th))/th;return [sg*(g[0]*zr-g[1]*zi),sg*(g[0]*zi+g[1]*zr)];});
  return {ok:true,p,warn,comps,rec,T,roles,q,sRole,qty,c,md,fs,Tp,dbl,Tc,dmin,dmax,ref,D0,op,x0,bd,Gat,G0,sg,wN,NW,wLo,W,Graw,Gw};}
 function design(o){const P=prep(o);if(!P.ok||P.signOnly)return P;const {p,warn,rec,T,roles,q,sRole,qty,D0,x0,G0,sg,Tc,fs,wLo,W,NW,wN,Graw,Gw,Gat,ref}=P;
  const mags=Graw.map(g=>Math.hypot(g[0],g[1]));let kr=0;for(let i=1;i<NW;i++)if(mags[i]>mags[kr])kr=i;
  let wr=mags[kr]>1.05*Math.abs(G0)?W[kr]:null;if(!wr){let i=0;while(i<NW&&mags[i]>Math.abs(G0)/Math.SQRT2)i++;wr=i<NW?W[i]:wN/10;}
  const pm=Math.min(Math.max(num(p.pm,50),10),85),fcT=Math.max(num(p.fc,0),0),spec={pm,gm:2,ms:2,wcMax:2*Math.PI*fs/10};
  const ctl=p.ctl==='pid'?'pid':'pi',Tf=ctl==='pid'?Tc/2:0;
  const shapes=ctl==='pi'?[0.02,0.05,0.1,0.2,0.3,0.5,0.7,1,1.5,2,4,10,Infinity].map(r=>r*wr):[0.4,0.55,0.7,0.85,1,1.2].map(r=>r*wr);
  const gains=(wz,Ki)=>ctl==='pi'?{Kp:Number.isFinite(wz)?Ki/wz:0,Ki,Kd:0,Tf:0}:{Kp:2*Ki/wz,Ki,Kd:Ki/(wz*wz),Tf};
  const evalK=(wz,Ki)=>margins(loopAt(gains(wz,Ki),Gw,W,Tc),W,spec);
  // the margins of given gains (the hand-set ones, for the card), with the sign of the plant taken out
  if(o.gains){const g0=o.gains,gg={Kp:sg*num(g0.Kp,0),Ki:sg*num(g0.Ki,0),Kd:sg*num(g0.Kd,0),Tf:num(g0.Tf,0)};return {ok:true,key:rec.key,name:T.name,roles,sign:rec.sign,G0,sg,D0,fr:wr/(2*Math.PI),warn,...margins(loopAt(gg,Gw,W,Tc),W,spec)};}
  const KiLo=wLo*20/Math.abs(G0),KiHi=spec.wcMax*1e4/Math.abs(G0);let pick=null;
  // the gains on a log grid of K_i for each shape (the feasible set need not be one interval: a PID's zeros lift the loop
  // around the resonance, so a middle range crosses twice), then bisection next to the largest feasible one
  const NK=72,KG=[];for(let i=0;i<NK;i++)KG.push(KiLo*Math.pow(KiHi/KiLo,i/(NK-1)));
  const loose={pm:-1e9,gm:0,ms:1e9,wcMax:Infinity};
  for(const wz of shapes){const R=KG.map(Ki=>evalK(wz,Ki));
   if(fcT>0){const wt=2*Math.PI*fcT,wcs=KG.map(Ki=>margins(loopAt(gains(wz,Ki),Gw,W,Tc),W,loose).wc??0);
    const i=wcs.findIndex(w=>w>=wt);if(i>0){let a=KG[i-1],b=KG[i];for(let it=0;it<50;it++){const m=Math.sqrt(a*b),r=margins(loopAt(gains(wz,m),Gw,W,Tc),W,loose);if(r.why==='low'||(r.wc!==undefined&&r.wc<wt))a=m;else b=m;}
     const Ki=Math.sqrt(a*b),r=evalK(wz,Ki);if(r.ok&&(!pick||!pick.target||r.pm>pick.r.pm))pick={wz,Ki,r,target:true};}}
   if(pick&&pick.target)continue;
   let k=-1;for(let i=NK-1;i>=0;i--)if(R[i].ok){k=i;break;}if(k<0)continue;
   let lo=KG[k],hi=k+1<NK?KG[k+1]:KG[k];for(let it=0;it<40&&hi>lo;it++){const m=Math.sqrt(lo*hi);if(evalK(wz,m).ok)lo=m;else hi=m;}
   const r=evalK(wz,lo);if(r.ok&&(!pick||(!pick.target&&lo>pick.Ki)))pick={wz,Ki:lo,r,target:false};}
  if(!pick)return {ok:false,error:'δεν βρέθηκαν κέρδη με τα περιθώρια (φάσης '+pm+'°, κέρδους 6 dB)',key:rec.key,roles};
  if(fcT>0&&!pick.target)warn.push(`f_c = ${fcT} Hz δεν επιτυγχάνεται με τα περιθώρια· η μεγαλύτερη δυνατή`);
  const g=gains(pick.wz,pick.Ki),r=pick.r,sgn=v=>v===0?0:sg*v;
  return {ok:true,key:rec.key,name:T.name,roles,sign:rec.sign,forcedOk:rec.forcedOk,sensorRole:sRole,qty,ctl,ref,D0,x0,states:T.st,G0,fr:wr/(2*Math.PI),
   fz:Number.isFinite(pick.wz)?pick.wz/(2*Math.PI):null,fc:r.wc/(2*Math.PI),pm:r.pm,gm:r.gm,ms:r.ms,Kp:sgn(g.Kp),Ki:sgn(g.Ki),Kd:sgn(g.Kd),Tf:g.Tf,sg,Tc,
   values:q,warn,bode:f=>Gat(2*Math.PI*f)};}
 // ---------------------------------------------------------------- 4.17.4: the window «Ρύθμιση ελεγκτή» (ROADMAP §64)
 // the static conversion ratio |M(D)| of each converter and its inverse (CCM, no losses), for the convergence method
 const MD={buck:{M:D=>D,inv:m=>m,txt:'D'},boost:{M:D=>1/(1-D),inv:m=>1-1/m,txt:'1/(1 − D)'},buck_boost:{M:D=>D/(1-D),inv:m=>m/(1+m),txt:'D/(1 − D)'},
  cuk:{M:D=>D/(1-D),inv:m=>m/(1+m),txt:'D/(1 − D)'},sepic:{M:D=>D/(1-D),inv:m=>m/(1+m),txt:'D/(1 − D)'}};
 // the convergence method (the source of Thanos, §3.7, for the output of each converter): D′ from the static ratio corrected
 // by the measured output, D_corr = M⁻¹(M(D)·|r|/|y|), mixed with the D of now by s = min(1, k·|r − y|/|r|):
 // D_new = (1 − s)·D + s·D_corr; the first assignment is the static one, M⁻¹(|r|/|V_in|)
 function convStep(key,D,r,y,k,dmin,dmax){const m=MD[key];if(!m)return D;const ar=Math.abs(r),ay=Math.abs(y);if(!(ar>0))return D;
  const s=Math.min(1,Math.max(0,(+k||1)*Math.abs(ar-ay)/ar));let Dc=ay>1e-9*ar?m.inv(m.M(Math.min(Math.max(D,dmin),dmax))*ar/ay):dmax;
  if(!Number.isFinite(Dc))Dc=D;Dc=Math.min(dmax,Math.max(dmin,Dc));return Math.min(dmax,Math.max(dmin,(1-s)*D+s*Dc));}
 // the interval of the method in samples when N = 0 (automatic): one period of the slowest oscillating mode of the averaged
 // model (the mean of the output over it is close to where it settles), or four time constants of the slowest real one
 function convAuto(A,Tc){const p=roots(charpoly(A).a);let T=0;for(const [re,im] of p){if(Math.abs(im)>1e-9)T=Math.max(T,2*Math.PI/Math.abs(im));else if(re<0)T=Math.max(T,Math.min(4/Math.abs(re),1e3*Tc));}
  return Math.max(1,Math.ceil(T/Tc-1e-9));}
 function convStart(key,r,vin,dmin,dmax){const m=MD[key];if(!m||!(Math.abs(vin)>0))return (dmin+dmax)/2;const D=m.inv(Math.abs(r)/Math.abs(vin));return Number.isFinite(D)?Math.min(dmax,Math.max(dmin,D)):(dmin+dmax)/2;}
 // the characteristic polynomial and the adjugate (Faddeev–LeVerrier): det(sI − A) = Σ a_k s^(n−k), adj = Σ B_k s^(n−1−k)
 function charpoly(A){const n=A.length,I=A.map((r,i)=>r.map((_,j)=>i===j?1:0)),mul=(X,Y)=>X.map(r=>Y[0].map((_,j)=>r.reduce((s,v,k)=>s+v*Y[k][j],0)));
  const a=[1],B=[I];let M=I;for(let k=1;k<=n;k++){const AM=mul(A,M),ak=-AM.reduce((s,r,i)=>s+r[i],0)/k;a.push(ak);if(k<n){M=AM.map((r,i)=>r.map((v,j)=>v+(i===j?ak:0)));B.push(M);}}return {a,B};}
 // G(s) = c·adj(sI − A)·b/det(sI − A): numerator and denominator in descending powers of s
 function tfOf(A,b,c){const {a,B}=charpoly(A);const num=B.map(Bk=>c.reduce((s,ci,i)=>s+ci*Bk[i].reduce((q,v,j)=>q+v*b[j],0),0));return {num,den:a};}
 // the roots of a polynomial (descending powers; Durand–Kerner), as [re, im]
 // (rho: the size of the roots of the denominator; a leading coefficient whose term is negligible at |s| = rho next to
 // the others is a numerical zero, dropped; a monic polynomial keeps its degree)
 function roots(p,rho){let q=p.slice();const w=(a,k,n)=>Math.abs(a)*Math.pow(rho||1,n-k);
  while(q.length>1){const n=q.length-1,big=Math.max(...q.map((a,k)=>w(a,k,n)));if(q[0]===0||(rho&&w(q[0],0,n)<1e-11*big))q.shift();else break;}const n=q.length-1;if(n<1)return [];
  const c=q.map(v=>v/q[0]),R=[];for(let k=0;k<n;k++){const r0=Math.pow(Math.abs(c[n])||1,1/n)||1,th=2*Math.PI*k/n+.4;R.push([r0*Math.cos(th),r0*Math.sin(th)]);}
  const ev=z=>{let re=1,im=0;for(let k=1;k<=n;k++){const nr=re*z[0]-im*z[1]+c[k],ni=re*z[1]+im*z[0];re=nr;im=ni;}return [re,im];};
  for(let it=0;it<500;it++){let mv=0;for(let i=0;i<n;i++){let dr=1,di=0;for(let j=0;j<n;j++){if(j===i)continue;const xr=R[i][0]-R[j][0],xi=R[i][1]-R[j][1];const t=dr*xr-di*xi;di=dr*xi+di*xr;dr=t;}
    const [fr,fi]=ev(R[i]),dd=dr*dr+di*di||1e-300,qr=(fr*dr+fi*di)/dd,qi=(fi*dr-fr*di)/dd;R[i]=[R[i][0]-qr,R[i][1]-qi];mv=Math.max(mv,Math.hypot(qr,qi)/(1+Math.hypot(...R[i])));}if(mv<1e-13)break;}
  return R.map(([re,im])=>[re,Math.abs(im)<1e-9*(1+Math.abs(re))?0:im]);}
 // the closed loop on the averaged (large-signal) model: x′ = A(d)·x + b(d), the controller of the PWM (the same lines as
 // mna.js sampleControllers) sampled every Tc with a hold; a step of the reference by `step` (relative) at `tStep`
 function closedLoop(P,g,o={}){const {md,c,x0,Tc,dmin,dmax,ref,rec,q}=P,M=md.M,n=x0.length,mix=(X,Y,d)=>X.map((r,i)=>Array.isArray(r)?r.map((v,k)=>d*v+(1-d)*Y[i][k]):d*r+(1-d)*Y[i]);
  const f=(x,d)=>{const A=mix(M.A1,M.A2,d),b=mix(M.b1,M.b2,d);return A.map((r,i)=>dot(r,x)+b[i]);};
  const H=o.tEnd||400*Tc,tStep=o.tStep??H*.1,step=o.step??.1,sub=o.sub||16,h=Tc/sub,N=Math.ceil(H/Tc),r1=ref*(1+step),ff=o.ff||'const',kc=o.kc??1,nc=Math.max(1,Math.round(+o.convN>0?o.convN:convAuto(md.op(P.D0).A,Tc)));let cs=0,cn=0;
  let x=x0.slice(),xi=0,ePrev=null,dF=0,dc=ff==='conv'?convStart(rec.key,ref,q.Vg,dmin,dmax):P.D0,d=P.D0;const T=[],Y=[],Rr=[],Dd=[];
  // the integrator starts where it holds the operating point (no start-up transient of the controller itself)
  const ff0=ff==='const'?P.D0:ff==='conv'?dc:0;xi=P.D0-ff0;
  for(let k=0;k<N;k++){const t=k*Tc,r=t>=tStep?r1:ref,y=dot(c,x),e=r-y;
   if(ff==='conv'){cs+=y;cn++;if(k%nc===0&&k>0){dc=convStep(rec.key,dc,r,cs/cn,kc,dmin,dmax);cs=0;cn=0;}}
   const ffv=ff==='const'?P.D0:ff==='conv'?dc:0;let der=0;if(g.Kd){const raw=ePrev===null?0:(e-ePrev)/Tc;dF=g.Tf>0?(g.Tf*dF+Tc*raw)/(g.Tf+Tc):raw;der=g.Kd*dF;}ePrev=e;
   xi+=g.Ki*Tc*e;d=ffv+g.Kp*e+xi+der;if(d>dmax||d<dmin){xi-=g.Ki*Tc*e;d=Math.min(dmax,Math.max(dmin,ffv+g.Kp*e+xi+der));}
   T.push(t);Y.push(y);Rr.push(r);Dd.push(d);
   for(let j=0;j<sub;j++){const k1=f(x,d),x2=x.map((v,i)=>v+h/2*k1[i]),k2=f(x2,d),x3=x.map((v,i)=>v+h/2*k2[i]),k3=f(x3,d),x4=x.map((v,i)=>v+h*k3[i]),k4=f(x4,d);x=x.map((v,i)=>v+h/6*(k1[i]+2*k2[i]+2*k3[i]+k4[i]));}}
  return {t:T,y:Y,r:Rr,d:Dd,tStep,r0:ref,r1};}
 // what the window shows: the converter, its operating point, G(s) (numerator, denominator, poles, zeros), M(D), the loop
 // with the gains given (or those from the circuit), its margins and Bode, and the closed loop in time
 function analyze(o,gIn,opt={}){const P=prep(o);if(!P.ok)return P;if(P.signOnly)return {ok:false,error:'signOnly'};
  const {rec,T,roles,q,c,md,op,bd,sg,G0,W,Gw,Graw,Tc,fs,D0,x0,ref,dmin,dmax,warn}=P;
  const tf=tfOf(op.A,bd,c),poles=roots(tf.den),rho=Math.max(1e-12,...poles.map(z=>Math.hypot(z[0],z[1]))),zeros=roots(tf.num,rho);
  let g=gIn;const auto=design(o);if(!g)g=auto.ok?{Kp:auto.Kp,Ki:auto.Ki,Kd:auto.Kd,Tf:auto.Tf}:{Kp:0,Ki:0,Kd:0,Tf:0};
  const gg={Kp:sg*num(g.Kp,0),Ki:sg*num(g.Ki,0),Kd:sg*num(g.Kd,0),Tf:num(g.Tf,0)},spec={pm:num(o.p.pm,50),gm:2,ms:2,wcMax:2*Math.PI*fs/10};
  const Lw=loopAt(gg,Gw,W,Tc),mg=margins(Lw,W,spec);
  const pts=[];for(let i=0;i<=60;i++){const D=dmin+(dmax-dmin)*i/60;pts.push([D,MD[rec.key].M(D)]);}
  // the time of the closed loop: about eight periods of the crossover (at least 400 samples, at most 40 000), the samples
  // given back at most 2000
  const tEnd=opt.tEnd||(mg.wc?Math.min(40000*Tc,Math.max(400*Tc,8*2*Math.PI/mg.wc)):400*Tc);
  const cl0=closedLoop(P,{Kp:num(g.Kp,0),Ki:num(g.Ki,0),Kd:num(g.Kd,0),Tf:num(g.Tf,0)},{ff:opt.ff||o.p.ff||'const',kc:num(opt.kc??o.p.kc,1),convN:num(opt.convN??o.p.convN,0),step:opt.step,tEnd});
  const dec=Math.max(1,Math.ceil(cl0.t.length/2000)),pick=a=>a.filter((_,i)=>i%dec===0||i===a.length-1),cl={...cl0,t:pick(cl0.t),y:pick(cl0.y),r:pick(cl0.r),d:pick(cl0.d)};
  return {ok:true,key:rec.key,name:T.name,roles,values:q,ref,D0,x0,states:T.st,G0,sg,fs,Tc,tf,poles,zeros,M:{txt:MD[rec.key].txt,pts,D0},gains:g,auto:auto.ok?{Kp:auto.Kp,Ki:auto.Ki,Kd:auto.Kd,Tf:auto.Tf,fc:auto.fc,pm:auto.pm}:null,
   margins:mg,f:W.map(w=>w/(2*Math.PI)),G:Graw,L:Lw,cl,warn};}
 const api={TOPO,ORDER,ROLE_KEY,match,recognise,design,prep,analyze,tfOf,roots,charpoly,convStep,convStart,convAuto,MD,closedLoop};
 root.Tune=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
