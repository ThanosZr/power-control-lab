'use strict';
// Network library (4.1, ROADMAP §31): network equivalent with S″k, X/R and Z₀, fault, circuit breaker, three-phase
// transformer with a vector group, three-phase load; line as a π section from sequence data (4.3). Each part is a subcircuit made from its parameters (defOf) out of
// primitive parts (VAC3, KG, KL, SW, SCR, XFMR, R, L, C, AM). expand() turns them into SUB instances with generated
// definitions before SubCircuit.flatten, so the browser solver, the SciPy export, the buses, the units and the
// channels (e.g. F1/Ia) see ordinary parts. No solver code knows about the library.
//
// Pure functions on project JSON (no DOM), like subcircuit.js. Also: the sequence impedances of the equivalent
// (gridZ) and the fault currents of a fault at its terminals in the phase domain (faultCurrents), for the analysis.
(function(root){
 const P=root.Parts||(typeof require!=='undefined'?require('./parts.js'):null);
 const TYPES=['GRID3','FLT3','CB3','XF3','LOAD3','LINE3','AIC','EVC','AVR','PSS','GOV','ARC','TOWER','SAI'];
 const isLib=t=>TYPES.includes(t);
 const RMIN=1e-4;               // a bolted fault or a closed pole: 0,1 mΩ inside the circuit
 const num=(v,d)=>{const x=typeof v==='number'?v:P.parseEng(v);return Number.isFinite(x)?x:d;};
 const prm=c=>({...P.defaults(c.type),...(c.params||{})});
 const s=x=>String(+x);
 const isBus=p=>p.conn==='bus';
 const PH=['a','b','c'];

 // ---------------------------------------------------------------- building a definition
 function builder(title){
  const components=[],wires=[];let nw=0,ng=0,placed=false;const J=new Map();
  // 4.9.1: an optional place [x, y, quarter turns] for the drawing of the definition (inside.js, «Ανάπτυξη σε υποκύκλωμα»), and
  // optional corner points of a wire; without them NetLib.layoutDef places the parts. The circuit is the same either way.
  const comp=(id,type,params,at)=>{const c={id,type,x:0,y:0,rot:0,flip:false,label:id,params:params||{}};if(at){c.x=at[0];c.y=at[1];c.rot=at[2]||0;c.at=true;placed=true;}components.push(c);return id;};
  const wire=(a,b,pts)=>{wires.push({id:'w'+(++nw),a:{c:a[0],p:a[1]},b:{c:b[0],p:b[1]},pts:pts?pts.map(q=>[...q]):[]});};
  const node=(name,at)=>{if(!J.has(name))J.set(name,comp('_'+name,'JUNC',{},at));return [J.get(name),'j'];};
  const gnd=at=>[comp('_G'+(++ng),'GND',{},at),'g'];
  // the three terminals of one side: three ports, or one port of width 3 and a bus of conductors (3.18)
  const terms=(p,names,busName)=>{
   if(isBus(p)){const port=comp('$'+busName,'PORT',{name:busName,width:'3'}),eb=comp('_B'+busName,'EBUS',{n:3});wire([port,'p'],[eb,'bus']);
    return PH.map(x=>[eb,x]);}
   return names.map(n=>[comp('$'+n,'PORT',{name:n}),'p']);};
  return {comp,wire,node,gnd,terms,def:()=>placed?{title,components,wires,placed:true}:{title,components,wires}};}

 // ---------------------------------------------------------------- network equivalent
 // sequence impedances (Ω) and the EMF (RMS, phase) of a GRID3: Z₁ = c·U_n²/S″k, E = c·U_n/√3
 function gridZ(p0){const p={...P.defaults('GRID3'),...(p0||{})};
  const Un=Math.max(num(p.Un,20e3),1e-9),cf=Math.max(num(p.cf,1.1),1e-9),Sk=Math.max(num(p.Sk,500e6),1e-9),XR=Math.max(num(p.XR,10),0),f=Math.max(num(p.f,50),1e-9);
  const w=2*Math.PI*f,Z1=cf*Un*Un/Sk,R1=Z1/Math.sqrt(1+XR*XR),X1=R1*XR,XR0=Math.max(num(p.XR0,10),0),mode=p.z0||'ratio';
  let R0,X0,warn=null;const c0=1/Math.sqrt(1+XR0*XR0),s0=XR0*c0;
  if(mode==='iso'){R0=R1;X0=X1;}
  else if(mode==='sk1'){const K=3*cf*Un*Un/Math.max(num(p.Sk1,400e6),1e-9),Ar=2*R1,Ai=2*X1,b=Ar*c0+Ai*s0,d=b*b-(Ar*Ar+Ai*Ai-K*K);
   const r=d>=0?-b+Math.sqrt(d):NaN;if(!(r>0)){warn='Το S″k1 δεν ταιριάζει με το S″k και τα X/R (θα χρειαζόταν |Z₀| ≤ 0): μηδενική ακολουθία ίση με τη θετική.';R0=R1;X0=X1;}else{R0=r*c0;X0=r*s0;}}
  else{const Z0=Math.max(num(p.Z0Z1,1),1e-9)*Z1;R0=Z0*c0+3*Math.max(num(p.Rn,0),0);X0=Z0*s0;}
  // 4.2: EMF c·U_n/√3 (as in 4.1) or U_n/√3 with c only in Z₁
  return {E:(p.emf==='un'?1:cf)*Un/Math.sqrt(3),Un,cf,w,f,R1,X1,R0,X0,iso:mode==='iso',warn};}

 function gridDef(c){const p=prm(c),z=gridZ(p),B=builder('Ισοδύναμο δικτύου'),T=B.terms(p,PH,'abc');
  const Rs=(2*z.R1+z.R0)/3,Rm=(z.R0-z.R1)/3,Ls=(2*z.X1+z.X0)/(3*z.w),Lm=(z.X0-z.X1)/(3*z.w);
  const mat=(d,o)=>`${s(d)}, ${s(o)}, ${s(o)}; ${s(o)}, ${s(d)}, ${s(o)}; ${s(o)}, ${s(o)}, ${s(d)}`;
  const E=B.comp('E','VAC3',{Vpk:z.E*Math.SQRT2,f:z.f,phase:num(p.phase,0),seq:'abc',Rs:0,Ls:0,conn:'sep'});
  if(z.iso){const r=B.comp('Rn','R',{R:1e6});B.wire([E,'n'],[r,'a']);B.wire([r,'b'],B.gnd());}else B.wire([E,'n'],B.gnd());
  const hasR=z.R1>0&&z.R0>0,K=B.comp('Z','KL',{Lmat:mat(Ls,Lm),Rw:0,i0:'0'});let Rk=null;
  if(hasR)Rk=B.comp('R','KG',{kind:'R',mat:mat(Rs,Rm)});
  PH.forEach((x,k)=>{const q=k+1;if(Rk){B.wire([E,x],[Rk,'a'+q]);B.wire([Rk,'b'+q],[K,'a'+q]);}else B.wire([E,x],[K,'a'+q]);B.wire([K,'b'+q],T[k]);});
  return B.def();}

 // ---------------------------------------------------------------- fault
 const schedOf=(ton,toff)=>{const a=ton>0?`0:0, ${s(ton)}:1`:'0:1';return toff>Math.max(ton,0)?`${a}, ${s(toff)}:0`:a;};
 function faultDef(c){const p=prm(c),B=builder('Σφάλμα'),T=B.terms(p,PH,'abc'),kind=String(p.kind||'abc'),ph=PH.filter(x=>kind.includes(x)),g=kind.endsWith('g');
  const gate=p.ctl==='sig'?[B.comp('$f','SIN',{name:'f'}),'y']:[B.comp('cmd','CONST',{v:schedOf(num(p.ton,0.04),num(p.toff,0))}),'y'];
  const Rf=Math.max(num(p.Rf,0),RMIN),Rg=Math.max(num(p.Rg,0),RMIN),F=B.node('F');
  // every phase has its ammeter and its pole (channels F1/Ia … F1/Ic always exist); a phase outside the fault stays open
  const sw=(id,a,b,R,used)=>{const m=B.comp('I'+id,'AM',{}),q=B.comp('S'+id,'SW',{gate:used?'sig':'off',body:false,model:'mos',Ron:R,Roff:1e7});B.wire(a,[m,'a']);B.wire([m,'b'],[q,'d']);B.wire([q,'s'],b);if(used)B.wire(gate,[q,'g']);};
  PH.forEach((x,k)=>sw(x,T[k],F,Rf,ph.includes(x)));
  sw('g',F,B.gnd(),Rg,g);
  return B.def();}

 // ---------------------------------------------------------------- arc of a pole (4.9, THEORY §Arc)
 // the sections of a black-box arc model between two terminals, each an ARCX (dg/dt = (g^λ·u²/Π − g)/τ, τ = τ₀·g^α,
 // Π = (P₀ + P₁·g·u²)·g^β), in series through inner nodes; gate: the command (≥ 0,5 closed). Names A1, A2, A3 (channels
 // Garc:<id>/A1 …) stay the same for every model.
 function arcSections(p){const m=p.arc||'imayr',v=(k,d)=>num(p[k],d),Ron=Math.max(v('Ron',1e-4),1e-7),gmin=Math.max(v('gmin',1e-12),1e-30);
  const S=o=>({lam:2,tau0:0.27e-6,alpha:0,P0:15917,P1:0,beta:0,Ron,gmin,...o});
  if(m==='mayr')return [S({tau0:v('tau',0.27e-6),P0:v('P0',15917)})];
  if(m==='cassie')return [S({lam:1,tau0:v('tauc',1.2e-6),P0:v('Uc',1500)**2})];
  if(m==='schwarz')return [S({tau0:v('tau',0.27e-6),P0:v('P0',15917),alpha:v('alpha',0.25),beta:v('beta',0.6)})];
  if(m==='habedank')return [S({lam:1,tau0:v('tauc',1.2e-6),P0:v('Uc',1500)**2}),S({tau0:v('taum',0.3e-6),P0:v('Pm',30e3)})];
  if(m==='kema'){const t1=v('tau1',4e-6),k1=v('k1',5.7),k2=v('k2',10),k3=v('k3',100),P2=v('Pi2',30);
   return [S({lam:1.4,tau0:t1,P0:v('Pi1',4.4e6)}),S({lam:1.9,tau0:t1/k1,P0:P2}),S({lam:2,tau0:t1/k1/k2,P0:k3*P2})];}
  return [S({tau0:v('tau',0.27e-6),P0:v('P0',15917),P1:v('P1',0.9943)})];}
 function arcChain(B,p,a,b,gate,tag=''){const L=arcSections(p);let prev=a;
  L.forEach((q,k)=>{const id='A'+tag+(k+1),x=B.comp(id,'ARCX',q),nx=k===L.length-1?b:B.node('arc'+tag+(k+1));B.wire(prev,[x,'a']);B.wire([x,'b'],nx);B.wire(gate,[x,'g']);prev=nx;});}

 // single-phase circuit breaker with an arc (ARC): ammeter I, the arc sections, the voltage across (V)
 function arcBreakerDef(c){const p=prm(c),B=builder('Διακόπτης με τόξο'),A=B.terms(p,['a'],'a')[0],Z=B.terms(p,['b'],'b')[0];
  const gate=p.ctl==='sig'?[B.comp('$cmd','SIN',{name:'cmd'}),'y']:[B.comp('cmd','CONST',{v:String(p.cmd??'0:1, 0.005:0')}),'y'];
  const m=B.comp('I','AM',{}),mid=B.node('m');B.wire(A,[m,'a']);B.wire([m,'b'],mid);arcChain(B,p,mid,Z,gate);
  if(p.vm!==false&&p.vm!=='false'){const vv=B.comp('V','VM',{});B.wire(A,[vv,'p']);B.wire(Z,[vv,'n']);}
  return B.def();}

 // ---------------------------------------------------------------- circuit breaker: two antiparallel thyristors per pole
 function breakerDef(c){const p=prm(c),B=builder('Διακόπτης ισχύος'),A=B.terms(p,['a1','b1','c1'],'abc1'),Z=B.terms(p,['a2','b2','c2'],'abc2');
  const gate=p.ctl==='sig'?[B.comp('$cmd','SIN',{name:'cmd'}),'y']:[B.comp('cmd','CONST',{v:String(p.cmd??'0:1')}),'y'];
  const Ron=Math.max(num(p.Ron,1e-4),1e-7),Roff=Math.max(num(p.Roff,1e6),1);
  PH.forEach((x,k)=>{const m=B.comp('I'+x,'AM',{}),mid=B.node('m'+x);B.wire(A[k],[m,'a']);B.wire([m,'b'],mid);
   // 4.9: a pole with an arc (sections Aa1 … per phase) instead of the thyristor pair
   if(p.model==='arc')arcChain(B,p,mid,Z[k],gate,x);
   else{const q={fire:'sig',Ron,Roff,Vf:0},f=B.comp('Q'+x+'1','SCR',q),r=B.comp('Q'+x+'2','SCR',q);
   B.wire(mid,[f,'a']);B.wire([f,'k'],Z[k]);B.wire(Z[k],[r,'a']);B.wire([r,'k'],mid);B.wire(gate,[f,'g']);B.wire(gate,[r,'g']);}
   // 4.2: the voltage across the pole (side 1 − side 2), channel CB1/Va …, for the transient recovery voltage
   if(p.vm===true||p.vm==='true'){const v=B.comp('V'+x,'VM',{});B.wire(A[k],[v,'p']);B.wire(Z[k],[v,'n']);}});
  return B.def();}

 // ---------------------------------------------------------------- three-phase transformer from three single-phase units
 // [side 1, side 2, star point 1 grounded, star point 2 grounded]; D 'ab': winding k between line k and line k+1
 // (the voltage leads by 30°), D 'ac': between line k and line k−1 (lags by 30°)
 const GROUPS={Yy0:['Y','Y',0,0],YNyn0:['Y','Y',1,1],Yyn0:['Y','Y',0,1],YNy0:['Y','Y',1,0],Yd1:['Y','ab',0,0],Yd11:['Y','ac',0,0],YNd1:['Y','ab',1,0],YNd11:['Y','ac',1,0],
  Dy1:['ac','Y',0,0],Dy11:['ab','Y',0,0],Dyn1:['ac','Y',0,1],Dyn11:['ab','Y',0,1],Dd0:['ab','ab',0,0]};
 function xfData(p0){const p={...P.defaults('XF3'),...(p0||{})},G=GROUPS[p.grp]||GROUPS.Dyn11;
  const U1=Math.max(num(p.U1,150e3),1e-9),U2=Math.max(num(p.U2,20e3),1e-9),Sn=Math.max(num(p.Sn,40e6),1e-9),w=2*Math.PI*Math.max(num(p.f,50),1e-9);
  const Uw1=(G[0]==='Y'?U1/Math.sqrt(3):U1)*(1+num(p.tap,0)/100),Uw2=G[1]==='Y'?U2/Math.sqrt(3):U2,n=Uw2/Uw1,Su=Sn/3,Zb1=Uw1*Uw1/Su;
  const Zk=Math.max(num(p.uk,10),0)/100*Zb1,Rk=Math.max(num(p.Pk,0),0)/3*(Uw1/Su)**2,Xk=Math.sqrt(Math.max(Zk*Zk-Rk*Rk,0)),i0=Math.max(num(p.i0,0.5),0),P0=Math.max(num(p.P0,0),0);
  return {G,n,Uw1,Uw2,Zb1,Rk,Xk,w,Lm:(i0>0?Zb1/(i0/100):Zb1*1e6)/w,Rfe:P0>0?Uw1*Uw1/(P0/3):0};}
 function xfDef(c){const p=prm(c),d=xfData(p),B=builder('Μετασχηματιστής τριφασικός'),A=B.terms(p,['a1','b1','c1'],'abc1'),Z=B.terms(p,['a2','b2','c2'],'abc2');
  const star=(side,grounded)=>{const N=B.node('N'+side);if(grounded)B.wire(N,B.gnd());return N;};
  const ends=(cn,T,k,side,grounded)=>cn==='Y'?[T[k],star(side,grounded)]:[T[k],T[cn==='ab'?(k+1)%3:(k+2)%3]];
  for(let k=0;k<3;k++){const [p1,p2]=ends(d.G[0],A,k,1,d.G[2]),[s1,s2]=ends(d.G[1],Z,k,2,d.G[3]);
   const u=B.comp('T'+PH[k],'XFMR',{n:d.n,Lm:d.Lm,im0:0,Llk1:d.Xk/2/d.w,Llk2:d.Xk/2/d.w*d.n*d.n,R1:d.Rk/2,R2:d.Rk/2*d.n*d.n,pol:'same'});
   B.wire(p1,[u,'p1']);B.wire(p2,[u,'p2']);B.wire(s1,[u,'s1']);B.wire(s2,[u,'s2']);
   if(d.Rfe>0){const r=B.comp('Rfe'+PH[k],'R',{R:d.Rfe});B.wire(p1,[r,'a']);B.wire(p2,[r,'b']);}}
  // 4.2: three-legged core: the zero-sequence flux closes through air and tank, a linear zero-sequence magnetizing
  // inductance at side 1 (Dommel, ch. 6). Three 1:1 couplers across the side-1 windings drive a delta loop with
  // L = 3·L₀m: the positive and negative sequence sum to zero around the delta (no current), the zero sequence sees
  // L₀m per phase. Five-legged and shell type: as three single-phase units (the zero sequence as the positive).
  if(p.core==='3leg'){const L0=d.Zb1/Math.max(num(p.i00,100)/100,1e-6)/d.w,Lk=1e-6*L0,loop=[];
   for(let k=0;k<3;k++){const [p1,p2]=ends(d.G[0],A,k,1,d.G[2]);const u=B.comp('Z0'+PH[k],'XFMR',{n:1,Lm:L0*1e6,im0:0,Llk1:Lk,Llk2:Lk,R1:0,R2:0,pol:'same'});
    B.wire(p1,[u,'p1']);B.wire(p2,[u,'p2']);loop.push(u);}
   B.wire([loop[0],'s2'],[loop[1],'s1']);B.wire([loop[1],'s2'],[loop[2],'s1']);
   const l=B.comp('L0m','L',{L:3*L0,i0:0,Rs:0});B.wire([loop[2],'s2'],[l,'a']);B.wire([l,'b'],[loop[0],'s1']);
   const g=B.comp('Rz0','R',{R:1e6});B.wire([loop[0],'s1'],[g,'a']);B.wire([g,'b'],B.gnd());}
  return B.def();}

 // ---------------------------------------------------------------- three-phase load (constant impedance, R ∥ X per phase)
 function loadDef(c){const p=prm(c),B=builder('Τριφασικό φορτίο'),T=B.terms(p,PH,'abc'),cn=p.cn||'yn',k=cn==='d'?3:1;
  const zip=p.model==='zip',kz=zip?Math.max(num(p.kz,0),0)/100:1,ki=zip?Math.max(num(p.ki,0),0)/100:0,kp=zip?Math.max(num(p.kp,100),0)/100:0;
  const Un=Math.max(num(p.Un,20e3),1e-9),Pw=num(p.P,0)*kz,Q=num(p.Q,0)*kz,w=2*Math.PI*Math.max(num(p.f,50),1e-9);
  // 4.2: the current and power parts of a ZIP load: current sources from signals, i_d = (2/3)·P_t/|v|, i_q = −(2/3)·Q_t/|v|
  // in the frame of a PLL on the terminal voltages (|v| its amplitude), P_t = P·(i·V + p) with V = |v|/(√2·U_n/√3),
  // constant impedance below V_min. The PLL (20 Hz) makes the reference follow the voltage smoothly: an ideal current
  // source that followed the instantaneous voltage would see only the inductance of the network and be unstable.
  if(zip&&(ki>0||kp>0)){const P0=num(p.P,0),Q0=num(p.Q,0),Vp=Un*Math.SQRT2/Math.sqrt(3),vm=Math.max(num(p.Vmin,70),1)/100;
   const f=Math.max(num(p.f,50),1e-9),pll=B.comp('PLL','PLL',{f0:f,bw:20,th0:0});
   PH.forEach((x,j)=>{const v=B.comp('VM'+x,'VM',{});B.wire(T[j],[v,'p']);B.wire([v,'n'],B.gnd());B.wire([v,'y'],[pll,x]);});
   const V='(max(amp,1e-6*Vp)/Vp)',g=`(${V}>=vm ? ki*${V}+kp : (ki*vm+kp)*${V}*${V}/(vm*vm))`,pars=`P0 = ${s(P0)}, Q0 = ${s(Q0)}, ki = ${s(ki)}, kp = ${s(kp)}, vm = ${s(vm)}, Vp = ${s(Vp)}`;
   // a damping resistor in star (20 % of |S| at U_n): the sources never drive the network's inductance alone (the
   // trapezoidal rule would chatter); its power, from the same smoothed |v|, is taken off the P source
   const S0=Math.max(Math.hypot(P0,Q0),1),Rsh=Un*Un/(0.2*S0),Nst=cn==='yn'?null:B.node('Nsh');
   PH.forEach((x,j)=>{const r=B.comp('Rd'+x,'R',{R:Rsh});B.wire(T[j],[r,'a']);B.wire([r,'b'],Nst||B.gnd());});
   const pd=`(1.5*max(amp,0)*max(amp,0)/${s(Rsh)})`;
   const xd=B.comp('Xd','EXPR',{expr:`(2/3)*(${g}*P0-${pd})/max(amp,1e-6*Vp)`,ins:'amp',pars}),xq=B.comp('Xq','EXPR',{expr:`-(2/3)*${g}*Q0/max(amp,1e-6*Vp)`,ins:'amp',pars});
   const lp=B.comp('LPV','LPF',{fc:10});B.wire([pll,'amp'],[lp,'u']);B.wire([lp,'y'],[xd,'amp']);B.wire([lp,'y'],[xq,'amp']);   // |v| smoothed (10 Hz)
   const ip=B.comp('IPK','IPARK',{}),ic=B.comp('ICL','ICLARKE',{inv:'amp'});
   B.wire([xd,'y'],[ip,'d']);B.wire([xq,'y'],[ip,'q']);B.wire([pll,'th'],[ip,'th']);B.wire([ip,'al'],[ic,'al']);B.wire([ip,'be'],[ic,'be']);
   PH.forEach((x,j)=>{const I=B.comp('I'+x,'IDC',{ctl:'sig'});B.wire([ic,x],[I,'u']);B.wire([I,'p'],B.gnd());B.wire([I,'n'],T[j]);});
   if(!(kz>0))return B.def();}
  const N=cn==='yn'?null:cn==='y'?B.node('N'):null;
  for(let j=0;j<3;j++){const a=T[j],b=cn==='d'?T[(j+1)%3]:cn==='y'?N:B.gnd();
   if(Pw>0){const r=B.comp('R'+PH[j],'R',{R:k*Un*Un/Pw});B.wire(a,[r,'a']);B.wire([r,'b'],b);}
   if(Q>0){const l=B.comp('L'+PH[j],'L',{L:k*Un*Un/Q/w,i0:0,Rs:0});B.wire(a,[l,'a']);B.wire([l,'b'],b);}
   else if(Q<0){const q=B.comp('C'+PH[j],'C',{C:1/(w*k*Un*Un/-Q),v0:0,esr:0});B.wire(a,[q,'p']);B.wire([q,'n'],b);}
   if(!(Pw>0)&&!Q){const r=B.comp('R'+PH[j],'R',{R:1e12});B.wire(a,[r,'a']);B.wire([r,'b'],b);}}
  return B.def();}

 // ---------------------------------------------------------------- line as one π section (4.3)
 // sequence data → phase domain: series Z_s = (2Z₁ + Z₀)/3, Z_m = (Z₀ − Z₁)/3 (as the network equivalent), half of the
 // shunt at each end: C₀ from each phase to ground and (C₁ − C₀)/3 between phases (C = B/ω)
 function lineData(p0){const p={...P.defaults('LINE3'),...(p0||{})},f=Math.max(num(p.f,50),1e-9),w=2*Math.PI*f,Un=Math.max(num(p.Un,150e3),1e-9);
  const k=p.unit==='pu'?Un*Un/Math.max(num(p.Sb,100e6),1e-9):1,R1=Math.max(num(p.R1,0),0)*k,X1=Math.max(num(p.X1,0),1e-9)*k,B1=Math.max(num(p.B1,0),0)/k;
  const g=p.z0==='given',R0=g?Math.max(num(p.R0,0),0)*k:R1,X0=g?Math.max(num(p.X0,0),1e-9)*k:X1,B0=g?Math.max(num(p.B0,0),0)/k:B1;
  return {w,R1,X1,B1,R0,X0,B0,C0:B0/w,Cm:Math.max(B1-B0,0)/(3*w),warn:B0>B1*(1+1e-9)?'B₀ > B₁: η χωρητικότητα μεταξύ φάσεων μηδενίζεται.':null};}
 function lineDef(c){const p=prm(c),d=lineData(p),B=builder('Γραμμή'),A=B.terms(p,['a1','b1','c1'],'abc1'),Z=B.terms(p,['a2','b2','c2'],'abc2');
  const Rs=(2*d.R1+d.R0)/3,Rm=(d.R0-d.R1)/3,Ls=(2*d.X1+d.X0)/(3*d.w),Lm=(d.X0-d.X1)/(3*d.w);
  const mat=(dg,o)=>`${s(dg)}, ${s(o)}, ${s(o)}; ${s(o)}, ${s(dg)}, ${s(o)}; ${s(o)}, ${s(o)}, ${s(dg)}`;
  let mid;
  if(Math.abs(Lm)<=1e-12*Ls&&Math.abs(Rm)<=1e-12*(Rs||1)){mid=PH.map((x,k)=>{const l=B.comp('L'+x,'L',{L:Ls,i0:0,Rs:Rs});B.wire(A[k],[l,'a']);return [l,'b'];});}
  else{const K=B.comp('Z','KL',{Lmat:mat(Ls,Lm),Rw:0,i0:'0'});let Rk=null;if(Rs>0)Rk=B.comp('R','KG',{kind:'R',mat:mat(Rs,Rm)});
   mid=PH.map((x,k)=>{const q=k+1;if(Rk){B.wire(A[k],[Rk,'a'+q]);B.wire([Rk,'b'+q],[K,'a'+q]);}else B.wire(A[k],[K,'a'+q]);return [K,'b'+q];});}
  PH.forEach((x,k)=>B.wire(mid[k],Z[k]));
  if(d.C0>0||d.Cm>0)for(const [T,e] of [[A,'1'],[Z,'2']]){
   if(d.C0>0)PH.forEach((x,k)=>{const q=B.comp('C'+x+e,'C',{C:d.C0/2,v0:0,esr:0});B.wire(T[k],[q,'p']);B.wire([q,'n'],B.gnd());});
   if(d.Cm>0)PH.forEach((x,k)=>{const q=B.comp('C'+x+PH[(k+1)%3]+e,'C',{C:d.Cm/2,v0:0,esr:0});B.wire(T[k],[q,'p']);B.wire([q,'n'],T[(k+1)%3]);});}
  return B.def();}

 // ---------------------------------------------------------------- 4.8: the block «Ελεγκτής AI» (ROADMAP §46)
 // One loop: the reference r through a first-order filter (r_f and its exact derivative ṙ_f = (r − r_f)·2π·f_r), a
 // discrete PI on r_f − y, and a network that gives the feedforward from (r_f, ṙ_f), summed and limited. Schemes:
 //   pi   the PI alone (the network block is there with zero output, so a change of scheme keeps the PI's state),
 //   fel  the network learns online from the PI's output (feedback-error learning),
 //   inv  fixed weights (an inverse model: «Κράτα τα βάρη» or «Εκπαίδευση εκτός οθόνης» write them),
 //   emu  the inverse learned through an emulator, two copies of one network (the emulator learns ẏ = f(u, y) from the
 //        measurements, its copy at the controller's output gives ∂ẏ̂/∂u).
 // Modes: «με αναφορά» (the input r) or «ζωντανός στόχος» (the parameter target, changed live from the façade); the
 // switch between them is a live parameter of one expression, so the states stay. Outputs: u, the learning curve L,
 // IAE = ∫|r_f − y|dt, sat (1 when u sits on a limit), and the emulator's ẏ̂ (emu). Inner ids are fixed: channels such as
 // C1/NN1, C1/E, C1/SAT are the same in every scheme.
 function aicDef(c){const p=prm(c),B=builder(c.label||c.id),sc=['pi','fel','inv','emu'].includes(p.scheme)?p.scheme:'fel';
  const fs=Math.max(num(p.fs,1000),1e-6),fr=Math.max(num(p.fr,5),1e-6),rs=Math.abs(num(p.rs,1))||1,us=Math.abs(num(p.us,1))||1,lo=num(p.umin,-1),hi=num(p.umax,1);
  const learn=p.learn!==false&&p.learn!=='false',live=p.mode==='live';
  const r=B.comp('$r','SIN',{name:'r'}),y=B.comp('$y','SIN',{name:'y'});
  B.comp('CLK','CLK',{f:fs});
  B.comp('TGT','CONST',{v:s(num(p.target,0))});B.comp('SRC','EXPR',{expr:'m*u1+(1-m)*u2',ins:'u1, u2',pars:'m = '+(live?0:1)});B.wire([r,'y'],['SRC','u1']);B.wire(['TGT','y'],['SRC','u2']);
  B.comp('LP','LPF',{fc:fr,y0:0});B.wire(['SRC','y'],['LP','u']);
  B.comp('DR','SUM',{signs:'+-'});B.wire(['SRC','y'],['DR','a']);B.wire(['LP','y'],['DR','b']);B.comp('GD','GAIN',{K:2*Math.PI*fr});B.wire(['DR','y'],['GD','u']);
  B.comp('E','SUM',{signs:'+-'});B.wire(['LP','y'],['E','a']);B.wire([y,'y'],['E','b']);
  B.comp('PI','PIB',{Kp:num(p.Kp,1),Ki:num(p.Ki,10),clock:'CLK',trig:'start',y0:0,ymin:lo,ymax:hi});B.wire(['E','y'],['PI','u']);
  const nnp={ins:'r, dr',xs:`${rs}, ${Math.abs(num(p.dxs,0))||+(2*Math.PI*fr*rs).toPrecision(6)}`,hidden:String(p.hidden||'8'),ys:us,ymin:lo,ymax:hi,opt:p.opt==='adam'?'adam':'sgd',lr:num(p.lr,.005),clip:5,nl:400,
   init:'zero',seed:num(p.seed,1),clock:'CLK',trig:'start',y0:0,learn:sc==='pi'?false:learn,w:sc==='pi'?'':String(p.w||''),train:sc==='inv'?'off':'err'};
  B.comp('NN1','NN',nnp);B.wire(['LP','y'],['NN1','r']);B.wire(['GD','y'],['NN1','dr']);
  // the network's share: 0 in «pi» (a gain 0 after it, so the PI alone)
  B.comp('KN','GAIN',{K:sc==='pi'?0:1});B.wire(['NN1','y'],['KN','u']);
  B.comp('U','SUM',{signs:'++'});B.wire(['PI','y'],['U','a']);B.wire(['KN','y'],['U','b']);
  B.comp('SAT','SAT',{lo,hi});B.wire(['U','y'],['SAT','u']);
  B.comp('FLAG','EXPR',{expr:'abs(u1-u2) > 1e-9*(1+abs(u1)) ? 1 : 0',ins:'u1, u2'});B.wire(['U','y'],['FLAG','u1']);B.wire(['SAT','y'],['FLAG','u2']);
  B.comp('AE','EXPR',{expr:'abs(u1)',ins:'u1'});B.wire(['E','y'],['AE','u1']);B.comp('IAE','INT',{y0:0});B.wire(['AE','y'],['IAE','u']);
  if(sc==='emu'){const Ts=1/fs;B.comp('UDu','UD',{clock:'CLK',trig:'start',y0:0});B.wire(['SAT','y'],['UDu','u']);B.comp('UDy','UD',{clock:'CLK',trig:'start',y0:0});B.wire([y,'y'],['UDy','u']);
   B.comp('DY','SUM',{signs:'+-'});B.wire([y,'y'],['DY','a']);B.wire(['UDy','y'],['DY','b']);B.comp('GY','GAIN',{K:1/Ts});B.wire(['DY','y'],['GY','u']);
   const ds=Math.abs(num(p.ds,0))||+(2*Math.PI*fr*rs/4).toPrecision(3),em={ins:'u, w',xs:`${Math.max(Math.abs(lo),Math.abs(hi))||1}, ${rs}`,hidden:String(p.hidden||'8'),ys:ds,ymin:-100*ds,ymax:100*ds,clock:'CLK',trig:'start',y0:0,init:'zero',seed:num(p.seed,1)+1};
   B.comp('NNE','NN',{...em,train:'tgt',opt:'adam',lr:num(p.elr,2e-3),clip:5,nl:400,learn});B.wire(['UDu','y'],['NNE','u']);B.wire(['UDy','y'],['NNE','w']);B.wire(['GY','y'],['NNE','tgt']);
   B.comp('NNC','NN',{...em,train:'off',share:'NNE',jac:'u'});B.wire(['NN1','y'],['NNC','u']);B.wire(['LP','y'],['NNC','w']);
   B.comp('EA','SUM',{signs:'+-'});B.wire(['GD','y'],['EA','a']);B.wire(['NNC','y'],['EA','b']);
   B.comp('MC','MUL',{});B.wire(['EA','y'],['MC','a']);B.wire(['NNC','dy'],['MC','b']);B.comp('GK','GAIN',{K:num(p.K,.1)});B.wire(['MC','y'],['GK','u']);
   B.comp('UDe','UD',{clock:'CLK',trig:'start',y0:0});B.wire(['GK','y'],['UDe','u']);B.wire(['UDe','y'],['NN1','e']);}
  else if(sc!=='inv')B.wire(['PI','y'],['NN1','e']);
  const out=(name,src)=>{const o=B.comp('$'+name,'SOUT',{name});B.wire(src,[o,'u']);};
  if(sc==='inv')B.comp('L0','CONST',{v:'0'});
  out('u',['SAT','y']);out('L',sc==='inv'?['L0','y']:['NN1','L']);out('iae',['IAE','y']);out('sat',['FLAG','y']);if(sc==='emu')out('yd',['NNE','y']);
  return B.def();}
 // ---------------------------------------------------------------- 4.8: the multi-objective cascade of the EV workbench
 // (Control Workbench EV/DC v0.17, scheme «moevc», ROADMAP 4.8 (β)): a reference governor that asks the speed loop only
 // for what the torque, current, power and SOC limits allow; a speed loop that gives an acceleration; the vehicle
 // dynamics that turn it into a torque request τ = J·α + B·ω + τ_L (the coupling speed ↔ torque); an allocation with
 // the weights of speed, torque and energy (and low SOC, and the predicted power) and a slew limit; the current loop
 // with the back-EMF and R·i feedforward. Modes as in the workbench: eco, balanced, performance set the weights and
 // the limits; every value is a live parameter (expressions and gains), so the weights change while it runs.
 function evcDef(c){const p=prm(c),B=builder(c.label||c.id),mode=['eco','performance'].includes(p.mode)?p.mode:'balanced',simple=p.scheme==='moev';
  let ws=num(p.ws,1),wt=num(p.wt,.75),we=num(p.we,.55),pl=num(p.plim,8),il=num(p.ilim,200);
  // the presets of the workbench: moev sets energy, torque and the limits; moevc (built on moev) also the speed and energy weights
  if(mode==='eco'){we=Math.max(we,.85);wt=Math.min(wt,.55);pl*=.65;il*=.7;if(!simple){ws=Math.min(ws,.85);we=Math.max(we,.95);}}
  else if(mode==='performance'){we=Math.min(we,.25);wt=Math.max(wt,.95);pl*=1.35;il*=1.25;if(!simple){ws=Math.max(ws,1.1);we=Math.min(we,.2);}}
  const kt=Math.max(num(p.Kt,.2),1e-9),ke=num(p.Ke,.2),R=num(p.R,.22),J=Math.max(num(p.J,.17),1e-9),b=num(p.B,.012),H=num(p.H,.85),al=num(p.alim,150),tl=num(p.taulim,40),rg=num(p.regen,16),lo=num(p.umin,-96),hi=num(p.umax,96);
  const tn=-Math.min(rg,il*kt*.55),f=x=>String(+(+x).toPrecision(10));
  const io=n=>B.comp('$'+n,'SIN',{name:n}),r=io('r'),y=io('y'),ia=io('i'),soc=io('soc'),tld=io('tl');
  const E=(id,expr,ins,pars)=>B.comp(id,'EXPR',{expr,ins,pars:pars||''});
  B.comp('CLK','CLK',{f:num(p.fs,1000)});
  E('LS','min(max((0.45-s)/0.35, 0), 1)','s');B.wire([soc,'y'],['LS','s']);                       // low SOC: 0 … 1
  if(simple){
   // moev: speed PI → torque (weighted) + the load and friction feedforward; the supervisor derates with the SOC, keeps a
   // share of the torque (the weights) and clips to the torque, current and power limits
   E('SF','min(max(1 - 0.45*ls*min(max(we, 0), 1.5), 0.35), 1.05)','ls','we = '+f(we));B.wire(['LS','y'],['SF','ls']);
   E('TP','min(min(tl, il*kt, atl)*sf, abs(w) > 2 ? pl*1000/max(abs(w), 2) : 1e12)','sf, w',`tl = ${f(tl)}, il = ${f(il)}, kt = ${f(kt)}, atl = ${f(num(p.atl,40))}, pl = ${f(pl)}`);B.wire(['SF','y'],['TP','sf']);B.wire([y,'y'],['TP','w']);
   B.comp('EG','SUM',{signs:'+-'});B.wire([r,'y'],['EG','a']);B.wire([y,'y'],['EG','b']);
   B.comp('PIW','PIB',{Kp:num(p.kpw,.2),Ki:num(p.kiw,.6),clock:'CLK',trig:'start',y0:0,ymin:-1e6,ymax:1e6});B.wire(['EG','y'],['PIW','u']);
   E('TR','ws*pw + tq + b*w','pw, tq, w',`ws = ${f(ws)}, b = ${f(b)}`);B.wire(['PIW','y'],['TR','pw']);B.wire([tld,'y'],['TR','tq']);B.wire([y,'y'],['TR','w']);
   E('KP','min(max(0.55 + 0.45*wt - 0.2*we*ls, 0.3), 1.05)','ls',`wt = ${f(wt)}, we = ${f(we)}`);B.wire(['LS','y'],['KP','ls']);
   B.comp('TS','MUL',{});B.wire(['TR','y'],['TS','a']);B.wire(['KP','y'],['TS','b']);
   E('TQ','min(max(x, -tp), tp)','x, tp');B.wire(['TS','y'],['TQ','x']);B.wire(['TP','y'],['TQ','tp']);
   E('LIM','abs(a - b) > 1e-6 ? 1 : 0','a, b');B.wire(['TQ','y'],['LIM','a']);B.wire(['TR','y'],['LIM','b']);
   B.comp('GOV','GAIN',{K:1});B.wire([r,'y'],['GOV','u']);   // no reference governor: the target as it is
  }else{
  E('SF','min(max(1 - 0.5*ls*min(max(we, 0), 1.4), 0.3), 1.05)','ls','we = '+f(we));B.wire(['LS','y'],['SF','ls']);
  E('TP','max(0, min(min(tl, il*kt)*sf, abs(w) > 2 ? pl*1000/max(abs(w), 2) : 1e12))','sf, w',`tl = ${f(tl)}, il = ${f(il)}, kt = ${f(kt)}, pl = ${f(pl)}`);B.wire(['SF','y'],['TP','sf']);B.wire([y,'y'],['TP','w']);
  E('AP','min(max((tp - tq - b*w)/J, -al), al)','tp, tq, w',`b = ${f(b)}, J = ${f(J)}, al = ${f(al)}`);B.wire(['TP','y'],['AP','tp']);B.wire([tld,'y'],['AP','tq']);B.wire([y,'y'],['AP','w']);
  E('AN','min(max((tn - tq - b*w)/J, -al), al)','tq, w',`tn = ${f(tn)}, b = ${f(b)}, J = ${f(J)}, al = ${f(al)}`);B.wire([tld,'y'],['AN','tq']);B.wire([y,'y'],['AN','w']);
  // the reference governor: what the limits allow within the horizon H
  E('GOV','r - w >= 0 ? w + min(r - w, max(ap, 0)*H) : w - min(w - r, -min(an, 0)*H)','r, w, ap, an','H = '+f(H));B.wire([r,'y'],['GOV','r']);B.wire([y,'y'],['GOV','w']);B.wire(['AP','y'],['GOV','ap']);B.wire(['AN','y'],['GOV','an']);
  B.comp('EG','SUM',{signs:'+-'});B.wire(['GOV','y'],['EG','a']);B.wire([y,'y'],['EG','b']);
  B.comp('PIA','PIB',{Kp:num(p.kpa,2.2),Ki:num(p.kia,.45),clock:'CLK',trig:'start',y0:0,ymin:-1e6,ymax:1e6});B.wire(['EG','y'],['PIA','u']);
  // 4.8 (not in the workbench, aff = 0 removes it): the acceleration of the reference as a feedforward
  const aff=num(p.aff,1),fr=Math.max(num(p.fr,2),1e-3);
  B.comp('LR','LPF',{fc:fr,y0:0});B.wire([r,'y'],['LR','u']);B.comp('DRr','SUM',{signs:'+-'});B.wire([r,'y'],['DRr','a']);B.wire(['LR','y'],['DRr','b']);
  B.comp('GR','GAIN',{K:2*Math.PI*fr*aff});B.wire(['DRr','y'],['GR','u']);B.comp('AS','SUM',{signs:'++'});B.wire(['PIA','y'],['AS','a']);B.wire(['GR','y'],['AS','b']);
  E('AC','min(max(a, an), ap)','a, ap, an');B.wire(['AS','y'],['AC','a']);B.wire(['AP','y'],['AC','ap']);B.wire(['AN','y'],['AC','an']);
  // the coupling: speed objective → torque through the vehicle dynamics
  E('TR','ff*tq + b*w + J*a','tq, w, a',`ff = ${f(num(p.ffg,1))}, b = ${f(b)}, J = ${f(J)}`);B.wire([tld,'y'],['TR','tq']);B.wire([y,'y'],['TR','w']);B.wire(['AC','y'],['TR','a']);
  // the multi-objective allocation: speed and torque keep the request, energy (with low SOC) and the power reduce it
  E('KP','min(max(0.72 + 0.26*min(max(ws, 0), 1.5) + 0.24*min(max(wt, 0), 1.5) - 0.18*min(max(we, 0), 1.5)*ls - 0.08*min(max(abs(tr*w)/1000/pl - 0.85, 0), 1.5), 0.35), 1.15)','tr, w, ls',
   `ws = ${f(ws)}, wt = ${f(wt)}, we = ${f(we)}, pl = ${f(pl)}`);B.wire(['TR','y'],['KP','tr']);B.wire([y,'y'],['KP','w']);B.wire(['LS','y'],['KP','ls']);
  B.comp('TS','MUL',{});B.wire(['TR','y'],['TS','a']);B.wire(['KP','y'],['TS','b']);
  B.comp('SL','RLIM',{up:num(p.slew,420),dn:num(p.slew,420),y0:0});B.wire(['TS','y'],['SL','u']);
  E('TQ','min(max(x, tn), tp)','x, tp','tn = '+f(tn));B.wire(['SL','y'],['TQ','x']);B.wire(['TP','y'],['TQ','tp']);
  // as in the workbench: 1 when the torque given differs from the torque needed (the allocation keep ≠ 1, the slew rate or a limit)
  E('LIM','abs(a - b) > 1e-5*(1 + abs(b)) ? 1 : 0','a, b');B.wire(['TQ','y'],['LIM','a']);B.wire(['TR','y'],['LIM','b']);
  }
  // the current loop with the back-EMF and the R·i feedforward
  B.comp('IR','GAIN',{K:1/kt});B.wire(['TQ','y'],['IR','u']);
  B.comp('EI','SUM',{signs:'+-'});B.wire(['IR','y'],['EI','a']);B.wire([ia,'y'],['EI','b']);
  B.comp('PII','PIB',{Kp:num(p.kpi,.02),Ki:num(p.kii,0),clock:'CLK',trig:'start',y0:0,ymin:lo-hi,ymax:hi-lo});B.wire(['EI','y'],['PII','u']);
  E('FF','ke*w + R*ir','w, ir',`ke = ${f(ke)}, R = ${f(R)}`);B.wire([y,'y'],['FF','w']);B.wire(['IR','y'],['FF','ir']);
  B.comp('US','SUM',{signs:'++'});B.wire(['FF','y'],['US','a']);B.wire(['PII','y'],['US','b']);
  B.comp('SAT','SAT',{lo,hi});B.wire(['US','y'],['SAT','u']);
  E('PW','abs(tr*w)/1000','tr, w');B.wire(['TR','y'],['PW','tr']);B.wire([y,'y'],['PW','w']);
  const out=(name,src)=>{const o=B.comp('$'+name,'SOUT',{name});B.wire(src,[o,'u']);};
  out('u',['SAT','y']);out('tau',['TQ','y']);out('rg',['GOV','y']);out('lim',['LIM','y']);out('keep',['KP','y']);out('pw',['PW','y']);
  return B.def();}
 // ---------------------------------------------------------------- generator controls (4.8.1, Kundur ch. 8–9)
 // Built in deviation form around the steady state of the load flow: the generator gives its E_fd and T_m of that state
 // (outputs e0, m0, and v0 = |V| of the load flow), every lag starts at 0, so a run starts in equilibrium without
 // searching for V_ref or the load reference. The limits act on the total values. Lags with limits on their output are
 // integrators that stop at the limit (no windup): dx/dt = (K·u − x)/T, held when the total is at a limit and the rate
 // pushes outwards.
 const fT=(T)=>String(+(1/(2*Math.PI*T)).toPrecision(12)),f10=x=>String(+(+x).toPrecision(10));
 function ctlKit(B){const E=(id,expr,ins,pars)=>B.comp(id,'EXPR',{expr,ins,pars:pars||''});
  // 1/(1+sT) starting at 0 (a gain of 1 when T = 0)
  const lag=(id,src,T)=>{if(T>1e-6){B.comp(id,'LPF',{fc:fT(T),y0:0});}else B.comp(id,'GAIN',{K:1});B.wire(src,[id,'u']);return [id,'y'];};
  // (1+sTn)/(1+sTd) = Tn/Td + (1 − Tn/Td)/(1+sTd); a gain of 1 when Td = 0
  const leadlag=(id,src,Tn,Td)=>{if(!(Td>1e-6))return src;const l=lag(id+'L',src,Td);E(id,'a*u + b*l','u, l',`a = ${f10(Tn/Td)}, b = ${f10(1-Tn/Td)}`);B.wire(src,[id,'u']);B.wire(l,[id,'l']);return [id,'y'];};
  // K·sT/(1+sT) (washout) and K·s/(1+sT) (rate feedback): K·(u − lag(u))·(1 or 1/T)
  const wash=(id,src,T,K)=>{const l=lag(id+'L',src,T);E(id,'k*(u - l)','u, l','k = '+f10(K));B.wire(src,[id,'u']);B.wire(l,[id,'l']);return [id,'y'];};
  // K/(1+sT) whose total (base + x) stays within [lo, hi] without windup; T = 0: K·u clipped
  const nwLag=(id,src,base,K,T,lo,hi)=>{const L=n=>Number.isFinite(n)?f10(n):(n>0?'1e9':'-1e9');
   if(!(T>1e-6)){E(id,'min(max(b + k*u, lo), hi) - b','u, b',`k = ${f10(K)}, lo = ${L(lo)}, hi = ${L(hi)}`);B.wire(src,[id,'u']);B.wire(base,[id,'b']);return [id,'y'];}
   E(id+'R','(b + x >= hi && r > 0) || (b + x <= lo && r < 0) ? 0 : r','r, x, b',`lo = ${L(lo)}, hi = ${L(hi)}`);
   E(id+'D','(k*u - x)/tt','u, x',`k = ${f10(K)}, tt = ${f10(T)}`);B.wire(src,[id+'D','u']);B.comp(id+'I','INT',{y0:0});
   B.wire([id+'D','y'],[id+'R','r']);B.wire([id+'I','y'],[id+'D','x']);B.wire([id+'I','y'],[id+'R','x']);B.wire(base,[id+'R','b']);B.wire([id+'R','y'],[id+'I','u']);
   E(id,'min(max(b + x, lo), hi) - b','x, b',`lo = ${L(lo)}, hi = ${L(hi)}`);B.wire([id+'I','y'],[id,'x']);B.wire(base,[id,'b']);return [id,'y'];};
  return {E,lag,leadlag,wash,nwLag};}
 const sched=(v,d)=>{const t=String(v??'').trim();return t===''?String(d):t;};
 // excitation system: IEEE ST1A (static, potential source) or DC1A (DC exciter with saturation), Kundur §8.6, Fig. 8.40, 8.43
 function avrDef(c){const p=prm(c),B=builder(c.label||c.id),K=ctlKit(B),E=K.E,type=p.type==='dc1a'?'dc1a':'st1a';
  const io=n=>B.comp('$'+n,'SIN',{name:n}),vt=io('vt'),v0=io('v0'),e0=io('e0'),ifd=io('ifd'),vs=io('vs');
  const N=(k,d)=>num(p[k],d),vr=String(p.Vref??'').trim();
  // the base of the reference: |V| of the load flow (input v0) or a given value; dV(t) on top of it
  if(vr===''){B.comp('VB','GAIN',{K:1});B.wire([v0,'y'],['VB','u']);}else B.comp('VB','CONST',{v:f10(N('Vref',1))});
  B.comp('DV','CONST',{v:sched(p.dV,0)});
  E('DX','v - b','v, b');B.wire([vt,'y'],['DX','v']);B.wire(['VB','y'],['DX','b']);
  const vc=K.lag('TRF',['DX','y'],N('TR',0));                                  // voltage transducer (on vt − base)
  const kf=N('KF',type==='dc1a'?0.058:0),tf=N('TF',type==='dc1a'?0.62:1),rf=kf>0&&tf>1e-6;
  // the first summing point; v_s (the stabilizer) may stay unconnected
  B.comp('ERR','EXPR',{expr:rf?'dv - c + s - f':'dv - c + s',ins:rf?'dv, c, s, f':'dv, c, s',pars:'',opt:'s'});B.wire(['DV','y'],['ERR','dv']);B.wire(vc,['ERR','c']);B.wire([vs,'y'],['ERR','s']);
  const vimx=N('VIMAX',Infinity),vimn=N('VIMIN',-Infinity);
  E('VI','min(max(u, lo), hi)','u',`lo = ${Number.isFinite(vimn)?f10(vimn):'-1e9'}, hi = ${Number.isFinite(vimx)?f10(vimx):'1e9'}`);B.wire(['ERR','y'],['VI','u']);
  let x=K.leadlag('LL1',['VI','y'],N('TC',0),N('TB',0));x=K.leadlag('LL2',x,N('TC1',0),N('TB1',0));
  if(type==='st1a'){
   // V_A = e0 + ΔV_A within [V_AMIN, V_AMAX]; E_fd = V_A − K_LR·max(0, I_fd − I_LR) within [E_t·V_RMIN, E_t·V_RMAX − K_C·I_fd]
   const dva=K.nwLag('VA',x,[e0,'y'],N('KA',200),N('TA',0),N('VAMIN',-Infinity),N('VAMAX',Infinity));
   B.comp('EFD','EXPR',{expr:'min(max(e0 + a - klr*max(i - ilr, 0), et*vrmin), et*vrmax - kc*i)',ins:'a, e0, i, et',opt:'i',      // i_fd: optional
    pars:`klr = ${f10(N('KLR',0))}, ilr = ${f10(N('ILR',4.4))}, vrmin = ${f10(N('VRMIN',-6.4))}, vrmax = ${f10(N('VRMAX',7))}, kc = ${f10(N('KC',0))}`});
   B.wire(dva,['EFD','a']);B.wire([e0,'y'],['EFD','e0']);B.wire([ifd,'y'],['EFD','i']);B.wire([vt,'y'],['EFD','et']);}
  else{
   // DC1A: V_R (from 0, or from V_R0 when K_E is given) within [V_RMIN, V_RMAX], T_E·dE_fd/dt = V_R − (K_E + S_E(E_fd))·E_fd,
   // S_E = A_EX·exp(B_EX·E_fd); K_E empty: −S_E(E_fd0), so that V_R = 0 at the start (self-excited, Kundur Fig. 8.40)
   const aex=N('AEX',0.014),bex=N('BEX',1.55),ke=String(p.KE??'').trim()===''?null:N('KE',1);
   E('VR0',ke===null?'0':'(ke + a*exp(bb*e0))*e0','e0',ke===null?'':`ke = ${f10(ke)}, a = ${f10(aex)}, bb = ${f10(bex)}`);B.wire([e0,'y'],['VR0','e0']);
   const dvr=K.nwLag('VR',x,['VR0','y'],N('KA',187),N('TA',0.89),N('VRMIN',-1.7),N('VRMAX',1.7));
   B.comp('XE','INT',{y0:0});
   E('DE','(r0 + r - (' + (ke===null?'a*exp(bb*(e0 + x)) - a*exp(bb*e0)':'ke + a*exp(bb*(e0 + x))') + ')*(e0 + x))/te','r0, r, e0, x',`a = ${f10(aex)}, bb = ${f10(bex)}, te = ${f10(N('TE',1.15))}`+(ke===null?'':`, ke = ${f10(ke)}`));
   B.wire(['VR0','y'],['DE','r0']);B.wire(dvr,['DE','r']);B.wire([e0,'y'],['DE','e0']);B.wire(['XE','y'],['DE','x']);B.wire(['DE','y'],['XE','u']);
   E('EFD','e0 + x','e0, x');B.wire([e0,'y'],['EFD','e0']);B.wire(['XE','y'],['EFD','x']);}
  // rate feedback K_F·s/(1+s·T_F) of E_fd − e0 into the first summing point
  if(rf){E('EX','f - e0','f, e0');B.wire(['EFD','y'],['EX','f']);B.wire([e0,'y'],['EX','e0']);const vf=K.wash('VF',['EX','y'],tf,kf/tf);B.wire(vf,['ERR','f']);}
  const o=B.comp('$efd','SOUT',{name:'efd'});B.wire(['EFD','y'],[o,'u']);
  return B.def();}
 // power system stabilizer: K·sT_W/(1+sT_W)·(1+sT1)/(1+sT2)·(1+sT3)/(1+sT4) of Δω, limited (Kundur §8.5, §12.5)
 function pssDef(c){const p=prm(c),B=builder(c.label||c.id),K=ctlKit(B),E=K.E,N=(k,d)=>num(p[k],d);
  const w=B.comp('$w','SIN',{name:'w'});E('DW','w - 1','w');B.wire([w,'y'],['DW','w']);
  let x=K.wash('WO',['DW','y'],N('TW',1.4),N('KS',20));x=K.leadlag('L1',x,N('T1',0.154),N('T2',0.033));x=K.leadlag('L2',x,N('T3',0),N('T4',0));
  E('VS','min(max(u, lo), hi)','u',`lo = ${f10(N('VSMIN',-0.1))}, hi = ${f10(N('VSMAX',0.1))}`);B.wire(x,['VS','u']);
  const o=B.comp('$vs','SOUT',{name:'vs'});B.wire(['VS','y'],[o,'u']);
  return B.def();}
 // governor and turbine: steam (mechanical-hydraulic governor with speed relay and auxiliary governor, tandem-compound
 // single reheat turbine, Kundur Fig. 9.21, 9.31) or hydro (governor with permanent and transient droop, nonlinear
 // turbine and inelastic water column, Kundur Fig. 9.7, 9.10). Output torque T_m = P_m·P_r/ω.
 function govDef(c){const p=prm(c),B=builder(c.label||c.id),K=ctlKit(B),E=K.E,N=(k,d)=>num(p[k],d),hydro=p.type==='hydro';
  const w=B.comp('$w','SIN',{name:'w'}),m0=B.comp('$m0','SIN',{name:'m0'}),pr=Math.max(N('Pr',1),1e-6);
  B.comp('DP','CONST',{v:sched(p.dP,0)});                                       // change of the load reference (pu of P_r)
  if(!hydro){
   // initial valve position = turbine power: c0 = T_m0/P_r (ω = 1 at the start)
   E('C0','m/pr','m','pr = '+f10(pr));B.wire([m0,'y'],['C0','m']);
   const kg=N('R',0.05)>0?1/N('R',0.05):20;
   E('S','dp - kg*(w - 1) - kax*max(w - 1 - v1, 0)','dp, w',`kg = ${f10(kg)}, kax = ${f10(N('KAX',149))}, v1 = ${f10(N('V1',0.02))}`);B.wire(['DP','y'],['S','dp']);B.wire([w,'y'],['S','w']);
   const sr=K.lag('SR',['S','y'],N('TSR',0.7));                                    // speed relay (deviation)
   // CV servomotor: rate within [L_C2, L_C1], position within [0, 1] of the total c0 + x
   B.comp('XC','INT',{y0:0});
   E('RC','(c0 + x >= 1 && r > 0) || (c0 + x <= 0 && r < 0) ? 0 : r','r, x, c0');
   E('RCV','min(max((s - x)/tsm, l2), l1)','s, x',`tsm = ${f10(N('TSM',0.23))}, l1 = ${f10(N('LC1',1))}, l2 = ${f10(N('LC2',-3))}`);
   B.wire(sr,['RCV','s']);B.wire(['XC','y'],['RCV','x']);B.wire(['RCV','y'],['RC','r']);B.wire(['XC','y'],['RC','x']);B.wire(['C0','y'],['RC','c0']);B.wire(['RC','y'],['XC','u']);
   E('CV','min(max(c0 + x, 0), 1)','c0, x');B.wire(['C0','y'],['CV','c0']);B.wire(['XC','y'],['CV','x']);
   E('DCV','v - c0','v, c0');B.wire(['CV','y'],['DCV','v']);B.wire(['C0','y'],['DCV','c0']);
   const ch=K.lag('CH',['DCV','y'],N('TCH',0.3)),rh=K.lag('RH',ch,N('TRH',7)),co=K.lag('CO',rh,N('TCO',0.5));
   E('PM','c0 + fhp*a + fip*b + flp*c','c0, a, b, c',`fhp = ${f10(N('FHP',0.3))}, fip = ${f10(N('FIP',0.3))}, flp = ${f10(N('FLP',0.4))}`);
   B.wire(['C0','y'],['PM','c0']);B.wire(ch,['PM','a']);B.wire(rh,['PM','b']);B.wire(co,['PM','c']);
   E('G','v','v');B.wire(['CV','y'],['G','v']);}
  else{
   // gate of the load flow: P_m0 = T_m0/P_r, U0 = P_m0 + U_NL (H0 = 1), g0 = U0/A_t; A_t = 1/(g_FL − g_NL), U_NL = A_t·g_NL
   const gfl=N('gFL',0.96),gnl=N('gNL',0.16),At=1/Math.max(gfl-gnl,1e-6),unl=At*gnl,rp=Math.max(N('RP',0.04),1e-6);
   E('G0','(m/pr + unl)/at','m',`pr = ${f10(pr)}, unl = ${f10(unl)}, at = ${f10(At)}`);B.wire([m0,'y'],['G0','m']);
   // speed error, permanent and transient droop on the deviation of the gate x: RP·(ΔP_ref/A_t − x) − Δω − RT·sTR/(1+sTR)·x
   B.comp('XG','INT',{y0:0});
   const td=K.wash('TD',['XG','y'],N('TR',5),N('RT',0.4));
   E('ER','rp*dp/at - (w - 1) - rp*x - d','dp, w, x, d',`rp = ${f10(rp)}, at = ${f10(At)}`);B.wire(['DP','y'],['ER','dp']);B.wire([w,'y'],['ER','w']);B.wire(['XG','y'],['ER','x']);B.wire(td,['ER','d']);
   const pv=K.lag('PV',['ER','y'],N('TP',0.05));                                    // pilot valve and servomotor
   E('RG','min(max(ks*u, -rc), ro)','u',`ks = ${f10(N('KS',5))}, rc = ${f10(N('Rclose',0.16))}, ro = ${f10(N('Ropen',0.16))}`);B.wire(pv,['RG','u']);
   E('RL','(g0 + x >= 1 && r > 0) || (g0 + x <= 0 && r < 0) ? 0 : r','r, x, g0');B.wire(['RG','y'],['RL','r']);B.wire(['XG','y'],['RL','x']);B.wire(['G0','y'],['RL','g0']);B.wire(['RL','y'],['XG','u']);
   const gs=K.lag('GS',['XG','y'],N('TG',0.2));                                     // gate servomotor
   E('G','min(max(g0 + x, 0), 1)','g0, x');B.wire(['G0','y'],['G','g0']);B.wire(gs,['G','x']);
   // water column: dU/dt = (1 − (U/G)²)/T_W with G = A_t·g; P_m = (U − U_NL)·H, H = (U/G)²
   B.comp('XU','INT',{y0:0});
   E('DU','(1 - ((u0 + x)/max(at*g, 1e-3))^2)/tw','u0, x, g',`at = ${f10(At)}, tw = ${f10(Math.max(N('Tw',1),1e-6))}`);
   E('U0','g0*at','g0','at = '+f10(At));B.wire(['G0','y'],['U0','g0']);
   B.wire(['U0','y'],['DU','u0']);B.wire(['XU','y'],['DU','x']);B.wire(['G','y'],['DU','g']);B.wire(['DU','y'],['XU','u']);
   E('PM','(u0 + x - unl)*((u0 + x)/max(at*g, 1e-3))^2','u0, x, g',`at = ${f10(At)}, unl = ${f10(unl)}`);B.wire(['U0','y'],['PM','u0']);B.wire(['XU','y'],['PM','x']);B.wire(['G','y'],['PM','g']);}
  E('TM','pm*pr/max(w, 0.1)','pm, w','pr = '+f10(pr));B.wire(['PM','y'],['TM','pm']);B.wire([w,'y'],['TM','w']);
  const out=(n,src)=>{const o=B.comp('$'+n,'SOUT',{name:n});B.wire(src,[o,'u']);};
  out('tm',['TM','y']);out('pm',['PM','y']);out('g',['G','y']);
  return B.def();}
 // ---------------------------------------------------------------- 4.9: lightning (ROADMAP §51)
 // R(I) of a tower footing with soil ionization (CIGRE TB 63, IEEE 1243): R = R₀/√(1 + I/I_g), I_g = E₀·ρ/(2π·R₀²), as the
 // points (current: voltage) of a nonlinear resistance; between the points the solver interpolates in log–log (slope 1 at
 // low currents where R = R₀, ½ at high currents where u ∝ √I)
 function footTable(R0,rho,E0){const Ig=E0*rho/(2*Math.PI*R0*R0),out=[];
  for(let e=-2;e<=6.0001;e+=0.25){const I=Math.pow(10,e);out.push(`${s(I)}: ${s(I*R0/Math.sqrt(1+I/Ig))}`);}return {tbl:out.join(', '),Ig};}
 // a tower: the phases pass through (in ≡ out), the ground wires end at the top; the tower is a lossless line from the top
 // to the foot (ground as return), the footing R₀ or R(I), an insulator string (spark gap) from each phase to the top
 function towerDef(c){const p=prm(c),B=builder('Πύργος γραμμής'),meas=p.meas===true||p.meas==='true',fast=p.impl==='fast'&&p.foot!=='r';
  // drawing (4.9.1): the phases left to right at y = 0, 60, 120, the top of the tower a bus at y = −240 with the ground wires
  // (d, e) brought up to it, one column per phase with the string (and the voltmeter beside it), the tower's line and its
  // footing on the right under the phases
  const PY=[0,60,120,180,240],TOP=-240,XK=[260,400,540];
  const L=['a1','b1','c1','d1','e1'].map((n,k)=>[B.comp('$'+n,'PORT',{name:n},[0,PY[k],2]),'p']),R=['a2','b2','c2','d2','e2'].map((n,k)=>[B.comp('$'+n,'PORT',{name:n},[1000,PY[k],0]),'p']);
  const top=B.node('top',[680,TOP]),foot=B.node('foot',[820,320]);
  for(const k of [3,4]){B.wire(L[k],top,[[60,PY[k]],[60,TOP]]);B.wire(R[k],top,[[940,PY[k]],[940,TOP]]);}
  if(meas){const v=B.comp('Vtop','VP',{},[720,TOP-50,0]);B.wire(top,[v,'p'],[[720,TOP]]);}
  PH.forEach((x,k)=>{const X=XK[k],ph=B.node('p'+x,[X,PY[k]]);B.wire(L[k],ph);B.wire(R[k],ph);
   if(meas){const u=B.comp('U'+x,'VM',{},[X+60,-105,2]);B.wire(ph,[u,'p'],[[X+60,PY[k]]]);B.wire(top,[u,'n'],[[X+60,TOP]]);}
   if(p.ins==='none')return;
   const q=p.ins==='de'?{vt:'de',U0:s(num(p.U0,1.7e6)),kde:s(num(p.kde,1)),Dde:s(num(p.Dde,.5))}:{vt:'inst',Ub:s(num(p.Ub,2.24e6))};
   const g=B.comp('S'+x,'SG',{...q,Rarc:'0.1',ext:'never'},[X,-150,3]);
   if(meas){const a=B.comp('I'+x,'AM',{},[X,-60,3]);B.wire(ph,[a,'a']);B.wire([a,'b'],[g,'a']);}else B.wire(ph,[g,'a']);
   B.wire([g,'b'],top);});
  const t=B.comp('T','TL',{spec:'zl',Z:s(num(p.Zt,200)),len:s(num(p.h,27.15)),vel:s(num(p.vt,3e8))},[800,220,1]);
  B.wire(top,[t,'a1'],[[880,TOP],[880,160]]);B.wire([t,'a2'],foot);B.wire([t,'b1'],B.gnd([740,180]),[[740,160]]);B.wire([t,'b2'],B.gnd([740,300]),[[740,280]]);
  const R0=Math.max(num(p.R0,15),1e-3);let rf;
  // 4.9.1: fast = the footing R(I) solved from the history of the tower's line (RFX), its ammeter on the ground side so that
  // the foot node joins only the line and the footing; detailed = a nonlinear resistance in the circuit's Newton (as in 4.9)
  if(fast){rf=B.comp('RF','RFX',{R0:s(R0),tbl:footTable(R0,num(p.rho,100),num(p.E0,400e3)).tbl,line:'T'},[820,380,1]);B.wire(foot,[rf,'a']);
   if(meas){const a=B.comp('If','AM',{},[820,450,1]);B.wire([rf,'b'],[a,'a']);B.wire([a,'b'],B.gnd([820,500]));}else B.wire([rf,'b'],B.gnd([820,430]));return B.def();}
  const yr=meas?460:380;
  if(p.foot==='r')rf=B.comp('RF','R',{R:s(R0)},[820,yr-10,1]);else rf=B.comp('RF','MOV',{model:'table',tbl:footTable(R0,num(p.rho,100),num(p.E0,400e3)).tbl},[820,yr,0]);
  if(meas){const a=B.comp('If','AM',{},[820,370,1]);B.wire(foot,[a,'a']);B.wire([a,'b'],[rf,'a']);}else B.wire(foot,[rf,'a']);
  B.wire([rf,'b'],B.gnd([820,yr+40]));
  return B.def();}
 // the arrester of the IEEE WG 3.4.11 (1992) with the linear elements from the height d and the columns n (Durbak):
 // L₀ = 0,2·d/n μH, R₀ = 100·d/n Ω, L₁ = 15·d/n μH, R₁ = 65·d/n Ω, C = 100·n/d pF; A0 and A1 in per unit of U₁₀
 function saiTable(str,U10){const pts=[];for(const q of String(str||'').split(',')){const m=q.split(':');if(m.length!==2)continue;const I=num(m[0].trim(),NaN)*1e3,v=num(m[1].trim(),NaN)*U10;if(I>0&&v>0)pts.push(`${s(I)}: ${s(v)}`);}return pts.join(', ');}
 function saiParams(p){const d=Math.max(num(p.d,3.216),1e-3),n=Math.max(num(p.n,1),1e-3),q=d/n,fit=p.L1fit===true||p.L1fit==='true';
  return {L0:0.2e-6*q,R0:100*q,L1:15e-6*q*(fit?saiFitL1(p).k:Math.max(num(p.kL1,1),1e-6)),R1:65*q,C:100e-12/q};}
 // 4.9.1 (question 12 of 4.9): the step of the IEEE WG procedure that adjusts L₁ until a 10 kA 8/20 μs current gives the
 // residual voltage U₁₀ (the voltage rises with L₁): secant on ln k from k = 1 and 0,8, the arrester alone (fast form, no
 // leads), to 0,05 %. Kept per set of parameters (a netlist is built often). Needs the solver (MNA) loaded.
 const FIT=new Map();
 function saiV10(p,k){const M=root.MNA||(typeof require!=='undefined'?require('./mna.js'):null);if(!M)throw new Error('Η ρύθμιση του L₁ θέλει τον λύτη.');
  const W=(id,a,b)=>({id,a:{c:a[0],p:a[1]},b:{c:b[0],p:b[1]},pts:[]});
  const pr={version:4,components:[{id:'I1',type:'ILG',x:0,y:0,rot:0,params:{shape:'custom',model:'heidler',T1:8e-6,T2:20e-6,n:10,Ipk:10e3,t0:0}},
   {id:'SA',type:'SAI',x:100,y:0,rot:0,params:{U10:p.U10,d:p.d,n:p.n,A0:p.A0,A1:p.A1,kL1:k,L1fit:false,Llead:0,meas:true,impl:'fast'}},
   {id:'G1',type:'GND',x:0,y:100,rot:0,params:{}},{id:'G2',type:'GND',x:100,y:100,rot:0,params:{}}],wires:[W('w1',['I1','p'],['SA','a']),W('w2',['SA','b'],['G2','g']),W('w3',['I1','n'],['G1','g'])]};
  const sim=new M.Sim(pr,{hDiv:600,method:'TR'});let v=0;while(sim.t<60e-6){sim.run(Math.min(sim.h,60e-6-sim.t));v=Math.max(v,Math.abs(sim.now('Y:SA/V')));}return v;}
 function saiFitL1(p0){const p={...P.defaults('SAI'),...(p0||{})},U10=Math.max(num(p.U10,819e3),1),key=[U10,num(p.d,3.216),num(p.n,1),p.A0,p.A1].join('|');
  if(FIT.has(key))return FIT.get(key);
  let x0=0,f0=saiV10(p,1)/U10-1,x1=Math.log(0.8),f1=saiV10(p,0.8)/U10-1;
  for(let it=0;it<20&&Math.abs(f1)>5e-4;it++){const x2=f1!==f0?x1-f1*(x1-x0)/(f1-f0):x1-0.1;x0=x1;f0=f1;x1=Math.min(Math.max(x2,Math.log(1e-3)),Math.log(20));f1=saiV10(p,Math.exp(x1))/U10-1;}
  const r={k:Math.exp(x1),err:f1};FIT.set(key,r);return r;}
 function saiDef(c){const p=prm(c),B=builder('Αλεξικέραυνο (μοντέλο IEEE)'),meas=p.meas===true||p.meas==='true',U10=Math.max(num(p.U10,819e3),1),k=saiParams(p);
  // drawing (4.9.1): a on the left, the line of the arrester to the right, b a rail at the bottom (y = 220)
  const RB=220,A=[B.comp('$a','PORT',{name:'a'},[0,0,2]),'p'],Z=[B.comp('$b','PORT',{name:'b'},[700,RB,0]),'p'],top=B.node('t',[260,0]),n0=B.node('n0',[400,0]),n1=B.node('n1',[540,0]);
  let at=A;if(meas){const am=B.comp('I','AM',{},[90,0,0]);B.wire(A,[am,'a']);at=[am,'b'];const vm=B.comp('V','VM',{},[60,90,0]);B.wire(A,[vm,'p']);B.wire(Z,[vm,'n']);}
  const Ll=num(p.Llead,0);if(Ll>0){const l=B.comp('Ll','L',{L:s(Ll)},[190,0,0]);B.wire(at,[l,'a']);B.wire([l,'b'],top);}else B.wire(at,top);
  // 4.9.1: fast = the same model as one element of the solver (SAIX: the inner nodes eliminated in each iteration)
  if(p.impl==='fast'){const x=B.comp('X','SAIX',{L0:s(k.L0),R0:s(k.R0),L1:s(k.L1),R1:s(k.R1),C:s(k.C),tbl0:saiTable(p.A0,U10),tbl1:saiTable(p.A1,U10)},[260,110,0]);B.wire(top,[x,'a']);B.wire([x,'b'],Z);return B.def();}
  const par=(id,from,to,L,R,x)=>{const l=B.comp('L'+id,'L',{L:s(L)},[x,-40,0]),r=B.comp('R'+id,'R',{R:s(R)},[x,40,0]);B.wire(from,[l,'a']);B.wire([l,'b'],to);B.wire(from,[r,'a']);B.wire([r,'b'],to);};
  par('0',top,n0,k.L0,k.R0,330);par('1',n0,n1,k.L1,k.R1,470);
  const cc=B.comp('C','C',{C:s(k.C)},[400,150,0]);B.wire(n0,[cc,'p']);B.wire([cc,'n'],Z);
  const a0=B.comp('A0','MOV',{model:'table',tbl:saiTable(p.A0,U10)},[460,150,0]),a1=B.comp('A1','MOV',{model:'table',tbl:saiTable(p.A1,U10)},[540,150,0]);
  B.wire(n0,[a0,'a'],[[400,80],[460,80]]);B.wire([a0,'b'],Z);B.wire(n1,[a1,'a']);B.wire([a1,'b'],Z);
  return B.def();}
 const DEFS={GRID3:gridDef,FLT3:faultDef,CB3:breakerDef,ARC:arcBreakerDef,XF3:xfDef,LOAD3:loadDef,LINE3:lineDef,AIC:aicDef,EVC:evcDef,AVR:avrDef,PSS:pssDef,GOV:govDef,TOWER:towerDef,SAI:saiDef};
 function defOf(c){return DEFS[c.type](c);}

 // 4.9.1 (ROADMAP §52): the parts with two implementations, and a copy of a project with one implementation everywhere
 // (the SciPy export takes the detailed one: same model, made of elements that solver has)
 const IMPL_TYPES=['TOWER','SAI'];
 function forceImpl(project,impl){if(!project)return project;const has=list=>(list||[]).some(c=>IMPL_TYPES.includes(c.type)&&(c.params?.impl||'blocks')!==impl);
  if(!has(project.components)&&!Object.values(project.subcircuits||{}).some(d=>has(d.components)))return project;
  const fix=list=>(list||[]).map(c=>IMPL_TYPES.includes(c.type)?{...c,params:{...(c.params||{}),impl}}:c);
  const subs={};for(const [n,d] of Object.entries(project.subcircuits||{}))subs[n]={...d,components:fix(d.components)};
  return {...project,components:fix(project.components),subcircuits:subs};}
 // ---------------------------------------------------------------- project → project with SUB instances
 const hasLib=list=>(list||[]).some(c=>isLib(c.type));
 function needs(project){if(!project)return false;if(hasLib(project.components))return true;
  return Object.values(project.subcircuits||{}).some(d=>hasLib(d.components));}
 function expand(project){if(!needs(project))return project;
  const defs={...(project.subcircuits||{})},out={...project,subcircuits:defs};
  const conv=(list,scope)=>(list||[]).map(c=>{if(!isLib(c.type))return c;const name='$net/'+(scope?scope+'/':'')+c.id,ip={def:name};
   for(const [k,v] of Object.entries(c.params||{}))if(k.startsWith('in_'))ip[k]=v;   // signal inputs that name their source
   defs[name]=defOf(c);return {...c,type:'SUB',params:ip};});
  for(const [n,d] of Object.entries(project.subcircuits||{}))if(hasLib(d.components))defs[n]={...d,components:conv(d.components,n)};
  out.components=conv(project.components,'');
  return out;}
 // warnings of the parameters (e.g. an S″k1 that does not fit), for the netlist warnings
 function warnings(project){const out=[];const scan=list=>{for(const c of list||[]){if(c.type==='GRID3'){const z=gridZ(c.params);if(z.warn)out.push(`${c.label||c.id}: ${z.warn}`);}if(c.type==='LINE3'){const d=lineData(c.params);if(d.warn)out.push(`${c.label||c.id}: ${d.warn}`);}}};
  scan(project?.components);for(const d of Object.values(project?.subcircuits||{}))scan(d.components);return out;}

 // ---------------------------------------------------------------- analysis: a fault at the terminals of the equivalent
 // phase domain: I = Y_s·(E − V) at the terminals (Y_s = Z_abc⁻¹), fault branches R_f to a fault point, R_g to ground.
 // Returns the RMS of the symmetrical (AC) currents {a, b, c, g} in A. Same tiny R as in the circuit (RMIN).
 const cx=(re,im=0)=>({re,im}),cadd=(a,b)=>cx(a.re+b.re,a.im+b.im),csub=(a,b)=>cx(a.re-b.re,a.im-b.im),
  cmul=(a,b)=>cx(a.re*b.re-a.im*b.im,a.re*b.im+a.im*b.re),cdiv=(a,b)=>{const d=b.re*b.re+b.im*b.im;return cx((a.re*b.re+a.im*b.im)/d,(a.im*b.re-a.re*b.im)/d);},cabs=a=>Math.hypot(a.re,a.im);
 function csolve(A,b){const n=b.length,M=A.map((r,i)=>[...r,b[i]]);
  for(let k=0;k<n;k++){let piv=k;for(let i=k+1;i<n;i++)if(cabs(M[i][k])>cabs(M[piv][k]))piv=i;[M[k],M[piv]]=[M[piv],M[k]];
   for(let i=k+1;i<n;i++){const f=cdiv(M[i][k],M[k][k]);for(let j=k;j<=n;j++)M[i][j]=csub(M[i][j],cmul(f,M[k][j]));}}
  const x=Array(n);for(let i=n-1;i>=0;i--){let v=M[i][n];for(let j=i+1;j<n;j++)v=csub(v,cmul(M[i][j],x[j]));x[i]=cdiv(v,M[i][i]);}return x;}
 // grid: the parameters of a GRID3, or {seq:{R1, X1, R0, X0, E}} (e.g. a network behind a transformer)
 function faultCurrents(grid,fault){const z0=grid&&grid.seq?grid.seq:gridZ(grid),f={...P.defaults('FLT3'),...(fault||{})},kind=String(f.kind||'abc');
  // isolated neutral: the 1 MΩ of the circuit in the zero sequence (3R_n)
  const z=z0.iso?{...z0,R0:z0.R0+3e6}:z0;
  const Zs=cx((2*z.R1+z.R0)/3,(2*z.X1+z.X0)/3),Zm=cx((z.R0-z.R1)/3,(z.X0-z.X1)/3);
  const Zabc=[[Zs,Zm,Zm],[Zm,Zs,Zm],[Zm,Zm,Zs]];
  // Y_s = Z⁻¹ column by column
  const Ys=[[],[],[]];for(let j=0;j<3;j++){const e=[0,1,2].map(i=>cx(i===j?1:0));const col=csolve(Zabc,e);for(let i=0;i<3;i++)Ys[i][j]=col[i];}
  const a=2*Math.PI/3,E=[0,-a,a].map(t=>cx(z.E*Math.cos(t),z.E*Math.sin(t)));
  const Gf=1/Math.max(num(f.Rf,0),RMIN),Gg=kind.endsWith('g')?1/Math.max(num(f.Rg,0),RMIN):0,on=PH.map(x=>kind.includes(x));
  // unknowns V_a, V_b, V_c, V_F
  const A=Array.from({length:4},()=>Array.from({length:4},()=>cx(0))),b=Array.from({length:4},()=>cx(0));
  for(let i=0;i<3;i++){for(let j=0;j<3;j++)A[i][j]=Ys[i][j];let r=cx(0);for(let j=0;j<3;j++)r=cadd(r,cmul(Ys[i][j],E[j]));b[i]=r;
   if(on[i]){A[i][i]=cadd(A[i][i],cx(Gf));A[i][3]=csub(A[i][3],cx(Gf));A[3][i]=csub(A[3][i],cx(Gf));A[3][3]=cadd(A[3][3],cx(Gf));}}
  A[3][3]=cadd(A[3][3],cx(Gg+1e-12));
  const V=csolve(A,b),I=PH.map((x,i)=>on[i]?cmul(cx(Gf),csub(V[i],V[3])):cx(0));
  return {a:cabs(I[0]),b:cabs(I[1]),c:cabs(I[2]),g:cabs(cmul(cx(Gg),V[3])),seq:{R1:z.R1,X1:z.X1,R0:z.R0,X0:z.X0,E:z.E}};}

 // the equivalent seen from side 2 of a transformer with a grounded star on side 2 and a delta on side 1 (e.g. Dyn11):
 // Z₁ = Z₁,grid·(U₂/U₁)² + Z_T, Z₀ = Z_T (the delta blocks the zero sequence of the grid), E = c·U₂/√3 (ratio without tap)
 function behindXF(grid,xf){const g=gridZ(grid),d=xfData(xf),U1=num(xf.U1,150e3),U2=num(xf.U2,20e3),r=(U2/U1)**2;
  // the transformer's impedance per phase of an equivalent star at side 2 (Ω): u_k·U₂²/S_n
  const Sn=num(xf.Sn,40e6),Zk=num(xf.uk,10)/100*U2*U2/Sn,Rk=num(xf.Pk,0)*(U2/Sn)**2,Xk=Math.sqrt(Math.max(Zk*Zk-Rk*Rk,0));
  return {seq:{R1:g.R1*r+Rk,X1:g.X1*r+Xk,R0:Rk,X0:Xk,E:g.E*U2/U1},n:d.n};}
 // ---------------------------------------------------------------- 4.9.1 (ROADMAP §52): a drawing of a definition
 // Positions for the parts of a generated definition, for «⧉ Τι έχει μέσα» and for «Ανάπτυξη σε υποκύκλωμα» (the editor
 // routes the wires itself). Layers by distance from the ports on the left of the part's symbol (inputs, side 1), the ports
 // on the right in the last layer, the order in a layer by barycentres; each part turned (0–3 quarter turns) so that its pins
 // face what they join, a ground just under its pin. opts.sides: {port name: 'l' | 'r'}.
 function layoutDef(def,opts={}){const DX=opts.dx||160,DY=opts.dy||100,G=10,snap=v=>Math.round(v/G)*G;
  if(def.placed)return placedDef(def);
  const cs=def.components.map(c=>({...c,params:{...(c.params||{})},x:0,y:0,rot:0,flip:false})),by=new Map(cs.map(c=>[c.id,c]));
  const isG=c=>c&&c.type==='GND',isPort=c=>c&&['PORT','SIN','SOUT'].includes(c.type);
  const isJ=c=>c&&c.type==='JUNC',nb0=new Map(cs.map(c=>[c.id,new Set()])),gpin=new Map();   // direct neighbours; the pin a ground hangs on
  for(const w of def.wires){const A=by.get(w.a.c),B=by.get(w.b.c);if(!A||!B)continue;
   if(isG(A)&&!isG(B)){gpin.set(A.id,w.b);continue;}if(isG(B)&&!isG(A)){gpin.set(B.id,w.a);continue;}nb0.get(A.id).add(B.id);nb0.get(B.id).add(A.id);}
  // a junction is a node of the circuit, not a part: everything on it is a neighbour of everything else on it (junctions
  // joined to junctions are one node); the junctions are placed afterwards, at the middle of the pins they join
  const jgrp=new Map();for(const c of cs)if(isJ(c)&&!jgrp.has(c.id)){const g=[],st=[c.id];jgrp.set(c.id,g);while(st.length){const v=st.pop();g.push(v);for(const u of nb0.get(v))if(isJ(by.get(u))&&!jgrp.has(u)){jgrp.set(u,g);st.push(u);}}}
  const nb=new Map(cs.filter(c=>!isJ(c)).map(c=>[c.id,new Set()]));
  for(const c of cs){if(isJ(c)||isG(c))continue;for(const u of nb0.get(c.id)){if(!isJ(by.get(u))){nb.get(c.id).add(u);continue;}
   for(const j of jgrp.get(u))for(const k of nb0.get(j))if(k!==c.id&&!isJ(by.get(k))&&!isG(by.get(k)))nb.get(c.id).add(k);}}
  const side=c=>{if(c.type==='SIN')return 'l';if(c.type==='SOUT')return 'r';const s=(opts.sides||{})[c.params.name];return s||'l';};
  const main=cs.filter(c=>!isG(c)&&!isJ(c)),ports=main.filter(isPort),L=new Map();
  // breadth-first layers from the left ports (or from the first part)
  let q=ports.filter(c=>side(c)==='l').map(c=>c.id);if(!q.length)q=[main[0]?.id].filter(Boolean);for(const id of q)L.set(id,0);
  const bfs=()=>{while(q.length){const v=q.shift();for(const u of nb.get(v)){if(L.has(u))continue;if(isPort(by.get(u))&&side(by.get(u))==='r')continue;L.set(u,L.get(v)+1);q.push(u);}}};
  bfs();for(const c of main)if(!L.has(c.id)&&!(isPort(c)&&side(c)==='r')){L.set(c.id,0);q=[c.id];bfs();}
  const inner=main.filter(c=>!isPort(c)||side(c)==='l'),last=Math.max(0,...inner.map(c=>L.get(c.id)))+1;
  for(const c of main)if(isPort(c)&&side(c)==='r')L.set(c.id,last);
  const nl=Math.max(...main.map(c=>L.get(c.id)))+1,lay=Array.from({length:nl},()=>[]);for(const c of main)lay[L.get(c.id)].push(c.id);
  // ports keep the order of the part's pins; the rest by barycentres
  const pinOrder=new Map((opts.order||[]).map((n,i)=>[n,i]));
  for(const a of lay)a.sort((x,y)=>{const X=by.get(x),Y=by.get(y);if(isPort(X)&&isPort(Y))return (pinOrder.get(X.params.name)??0)-(pinOrder.get(Y.params.name)??0);return 0;});
  const pos=new Map();const setPos=()=>lay.forEach(a=>a.forEach((v,i)=>pos.set(v,i)));setPos();
  const bary=(v,dir)=>{const n=[...nb.get(v)].filter(u=>dir>0?L.get(u)<L.get(v):L.get(u)>L.get(v));return n.length?n.reduce((s,u)=>s+pos.get(u),0)/n.length:pos.get(v);};
  for(let it=0;it<4;it++){for(let l=1;l<nl;l++){if(lay[l].every(v=>isPort(by.get(v))))continue;lay[l].sort((a,b)=>bary(a,1)-bary(b,1));lay[l].forEach((v,i)=>pos.set(v,i));}
   for(let l=nl-2;l>=0;l--){if(lay[l].every(v=>isPort(by.get(v))))continue;lay[l].sort((a,b)=>bary(a,-1)-bary(b,-1));lay[l].forEach((v,i)=>pos.set(v,i));}}
  const mx=Math.max(...lay.map(a=>a.length));
  lay.forEach((a,l)=>{const off=(mx-a.length)*DY/2;a.forEach((v,i)=>{const c=by.get(v);c.x=snap(l*DX);c.y=snap(off+i*DY);});});
  // turn each part so that its pins face their neighbours (a pin with a ground: downwards)
  const ctr=id=>{const c=by.get(id);return [c.x,c.y];};
  const target=(c,pin)=>{const t=[];for(const w of def.wires){let o=null;if(w.a.c===c.id&&w.a.p===pin)o=w.b;else if(w.b.c===c.id&&w.b.p===pin)o=w.a;if(!o)continue;
   const k=by.get(o.c);if(!k)continue;if(isG(k))t.push([c.x,c.y+200]);else if(isJ(k)){for(const j of jgrp.get(k.id))for(const u of nb0.get(j)){const q=by.get(u);if(q&&q.id!==c.id&&!isJ(q)&&!isG(q))t.push(ctr(q.id));}}else t.push(ctr(k.id));}return t;};
  for(let pass=0;pass<2;pass++)for(const c of main){let best=null;
   for(const rot of [0,1,2,3]){c.rot=rot;let cost=0;for(const pn of Object.keys(P.pinsOf(c))){const pp=P.pinPos(c,pn);if(!pp)continue;for(const t of target(c,pn))cost+=Math.hypot(pp[0]-t[0],pp[1]-t[1]);}
    cost+=rot*1e-3;if(!best||cost<best[0])best=[cost,rot];}c.rot=best?best[1]:0;}
  // junctions: at the median of the pins they join (x and y apart), on the grid; nudged off a part's centre
  const centres=new Set(main.map(c=>c.x+','+c.y));
  for(const c of cs)if(isJ(c)){const P0=[];for(const w of def.wires){const o=w.a.c===c.id?w.b:w.b.c===c.id?w.a:null;if(!o)continue;const k=by.get(o.c);if(k&&!isJ(k)&&!isG(k)){const pp=P.pinPos(k,o.p);if(pp)P0.push(pp);}}
   if(!P0.length)continue;const med=a=>{const v=a.slice().sort((x,y)=>x-y);return v[(v.length-1)>>1];};let x=snap(med(P0.map(q=>q[0]))),y=snap(med(P0.map(q=>q[1])));
   while(centres.has(x+','+y))x+=G;centres.add(x+','+y);c.x=x;c.y=y;}
  // grounds under their pins
  const used=new Set();for(const g of cs.filter(isG)){const e=gpin.get(g.id),k=e&&by.get(e.c);let pp=k?P.pinPos(k,e.p):null;if(!pp)pp=[0,last*DY];
   let x=snap(pp[0]),y=snap(pp[1]+30);while(used.has(x+','+y))x+=20;used.add(x+','+y);g.x=x;g.y=y;g.rot=0;}
  return {...def,components:cs,wires:def.wires.map(w=>({...w,pts:[]}))};}
 // a definition drawn by its builder: the parts keep their places; a junction or ground without one goes to the middle of
 // the pins it joins (a ground: under its pin)
 function placedDef(def){const cs=def.components.map(c=>({...c,params:{...(c.params||{})}})),by=new Map(cs.map(c=>[c.id,c]));
  for(const c of cs){if(c.at)continue;const P0=[];for(const w of def.wires){const o=w.a.c===c.id?w.b:w.b.c===c.id?w.a:null;if(!o)continue;const k=by.get(o.c);if(k&&k.at){const pp=P.pinPos(k,o.p);if(pp)P0.push(pp);}}
   if(P0.length){const m=P0.reduce((a,q)=>[a[0]+q[0]/P0.length,a[1]+q[1]/P0.length],[0,0]);c.x=Math.round(m[0]/10)*10;c.y=Math.round(m[1]/10)*10+(c.type==='GND'?30:0);}}
  for(const c of cs)delete c.at;return {...def,components:cs,wires:def.wires.map(w=>({...w,pts:(w.pts||[]).map(q=>[...q])}))};}
 // the side of each port: from where the part has the pin on its own symbol (x < 0: left); the order: top to bottom
 function sidesOf(c){const out={},ord=[];const pins=P.pinsOf({...c,rot:0,flip:false});for(const [n,q] of Object.entries(pins)){out[n]=q[0]<0?'l':q[0]>0?'r':q[1]<0?'l':'r';ord.push([n,q[1],q[0]]);}
  ord.sort((a,b)=>a[1]-b[1]||a[2]-b[2]);return {sides:out,order:ord.map(o=>o[0])};}
 const api={TYPES,IMPL_TYPES,forceImpl,layoutDef,sidesOf,saiFitL1,isLib,needs,expand,defOf,warnings,gridZ,xfData,lineData,faultCurrents,behindXF,GROUPS,footTable,saiParams};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.NetLib=api;
})(typeof window!=='undefined'?window:globalThis);
