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
 function design(o){const p=o.p,warn=[];const comps=o.comps.map(c=>({id:c.id,type:c.type,params:c.params||{}}));
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
  if(o.signOnly)return {ok:true,key:rec.key,name:T.name,roles,sign:rec.sign,G0,sg,D0,warn};
  // the grid: up to the Nyquist frequency of the samples; the plant with its sign removed, times the zero-order hold
  const wN=Math.PI/Tc,NW=480,wLo=wN*1e-7,W=[];for(let i=0;i<NW;i++)W.push(wLo*Math.pow(0.98*wN/wLo,i/(NW-1)));
  const Graw=W.map(Gat),Gw=W.map((w,i)=>{const g=Graw[i],th=w*Tc,zr=Math.sin(th)/th,zi=-(1-Math.cos(th))/th;return [sg*(g[0]*zr-g[1]*zi),sg*(g[0]*zi+g[1]*zr)];});
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
 const api={TOPO,ORDER,ROLE_KEY,match,recognise,design};
 root.Tune=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
