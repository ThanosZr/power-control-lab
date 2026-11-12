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
 const TYPES=['GRID3','FLT3','CB3','XF3','LOAD3','LINE3','AIC','EVC'];
 const isLib=t=>TYPES.includes(t);
 const RMIN=1e-4;               // a bolted fault or a closed pole: 0,1 mΩ inside the circuit
 const num=(v,d)=>{const x=typeof v==='number'?v:P.parseEng(v);return Number.isFinite(x)?x:d;};
 const prm=c=>({...P.defaults(c.type),...(c.params||{})});
 const s=x=>String(+x);
 const isBus=p=>p.conn==='bus';
 const PH=['a','b','c'];

 // ---------------------------------------------------------------- building a definition
 function builder(title){
  const components=[],wires=[];let nw=0,ng=0;const J=new Map();
  const comp=(id,type,params)=>{components.push({id,type,x:0,y:0,rot:0,flip:false,label:id,params:params||{}});return id;};
  const wire=(a,b)=>{wires.push({id:'w'+(++nw),a:{c:a[0],p:a[1]},b:{c:b[0],p:b[1]},pts:[]});};
  const node=name=>{if(!J.has(name))J.set(name,comp('_'+name,'JUNC',{}));return [J.get(name),'j'];};
  const gnd=()=>[comp('_G'+(++ng),'GND',{}),'g'];
  // the three terminals of one side: three ports, or one port of width 3 and a bus of conductors (3.18)
  const terms=(p,names,busName)=>{
   if(isBus(p)){const port=comp('$'+busName,'PORT',{name:busName,width:'3'}),eb=comp('_B'+busName,'EBUS',{n:3});wire([port,'p'],[eb,'bus']);
    return PH.map(x=>[eb,x]);}
   return names.map(n=>[comp('$'+n,'PORT',{name:n}),'p']);};
  return {comp,wire,node,gnd,terms,def:()=>({title,components,wires})};}

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

 // ---------------------------------------------------------------- circuit breaker: two antiparallel thyristors per pole
 function breakerDef(c){const p=prm(c),B=builder('Διακόπτης ισχύος'),A=B.terms(p,['a1','b1','c1'],'abc1'),Z=B.terms(p,['a2','b2','c2'],'abc2');
  const gate=p.ctl==='sig'?[B.comp('$cmd','SIN',{name:'cmd'}),'y']:[B.comp('cmd','CONST',{v:String(p.cmd??'0:1')}),'y'];
  const Ron=Math.max(num(p.Ron,1e-4),1e-7),Roff=Math.max(num(p.Roff,1e6),1);
  PH.forEach((x,k)=>{const m=B.comp('I'+x,'AM',{}),mid=B.node('m'+x),q={fire:'sig',Ron,Roff,Vf:0},f=B.comp('Q'+x+'1','SCR',q),r=B.comp('Q'+x+'2','SCR',q);
   B.wire(A[k],[m,'a']);B.wire([m,'b'],mid);B.wire(mid,[f,'a']);B.wire([f,'k'],Z[k]);B.wire(Z[k],[r,'a']);B.wire([r,'k'],mid);B.wire(gate,[f,'g']);B.wire(gate,[r,'g']);
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
 const DEFS={GRID3:gridDef,FLT3:faultDef,CB3:breakerDef,XF3:xfDef,LOAD3:loadDef,LINE3:lineDef,AIC:aicDef,EVC:evcDef};
 function defOf(c){return DEFS[c.type](c);}

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
 const api={TYPES,isLib,needs,expand,defOf,warnings,gridZ,xfData,lineData,faultCurrents,behindXF,GROUPS};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.NetLib=api;
})(typeof window!=='undefined'?window:globalThis);
