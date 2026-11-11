'use strict';
// Network library (4.1, ROADMAP §31): network equivalent with S″k, X/R and Z₀, fault, circuit breaker, three-phase
// transformer with a vector group, three-phase load. Each part is a subcircuit made from its parameters (defOf) out of
// primitive parts (VAC3, KG, KL, SW, SCR, XFMR, R, L, C, AM). expand() turns them into SUB instances with generated
// definitions before SubCircuit.flatten, so the browser solver, the SciPy export, the buses, the units and the
// channels (e.g. F1/Ia) see ordinary parts. No solver code knows about the library.
//
// Pure functions on project JSON (no DOM), like subcircuit.js. Also: the sequence impedances of the equivalent
// (gridZ) and the fault currents of a fault at its terminals in the phase domain (faultCurrents), for the analysis.
(function(root){
 const P=root.Parts||(typeof require!=='undefined'?require('./parts.js'):null);
 const TYPES=['GRID3','FLT3','CB3','XF3','LOAD3'];
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
  return {E:cf*Un/Math.sqrt(3),Un,cf,w,f,R1,X1,R0,X0,iso:mode==='iso',warn};}

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
   B.wire(A[k],[m,'a']);B.wire([m,'b'],mid);B.wire(mid,[f,'a']);B.wire([f,'k'],Z[k]);B.wire(Z[k],[r,'a']);B.wire([r,'k'],mid);B.wire(gate,[f,'g']);B.wire(gate,[r,'g']);});
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
  return B.def();}

 // ---------------------------------------------------------------- three-phase load (constant impedance, R ∥ X per phase)
 function loadDef(c){const p=prm(c),B=builder('Τριφασικό φορτίο'),T=B.terms(p,PH,'abc'),cn=p.cn||'yn',k=cn==='d'?3:1;
  const Un=Math.max(num(p.Un,20e3),1e-9),Pw=num(p.P,0),Q=num(p.Q,0),w=2*Math.PI*Math.max(num(p.f,50),1e-9);
  const N=cn==='yn'?null:cn==='y'?B.node('N'):null;
  for(let j=0;j<3;j++){const a=T[j],b=cn==='d'?T[(j+1)%3]:cn==='y'?N:B.gnd();
   if(Pw>0){const r=B.comp('R'+PH[j],'R',{R:k*Un*Un/Pw});B.wire(a,[r,'a']);B.wire([r,'b'],b);}
   if(Q>0){const l=B.comp('L'+PH[j],'L',{L:k*Un*Un/Q/w,i0:0,Rs:0});B.wire(a,[l,'a']);B.wire([l,'b'],b);}
   else if(Q<0){const q=B.comp('C'+PH[j],'C',{C:1/(w*k*Un*Un/-Q),v0:0,esr:0});B.wire(a,[q,'p']);B.wire([q,'n'],b);}
   if(!(Pw>0)&&!Q){const r=B.comp('R'+PH[j],'R',{R:1e12});B.wire(a,[r,'a']);B.wire([r,'b'],b);}}
  return B.def();}

 const DEFS={GRID3:gridDef,FLT3:faultDef,CB3:breakerDef,XF3:xfDef,LOAD3:loadDef};
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
 function warnings(project){const out=[];const scan=list=>{for(const c of list||[])if(c.type==='GRID3'){const z=gridZ(c.params);if(z.warn)out.push(`${c.label||c.id}: ${z.warn}`);}};
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
 const api={TYPES,isLib,needs,expand,defOf,warnings,gridZ,xfData,faultCurrents,behindXF,GROUPS};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.NetLib=api;
})(typeof window!=='undefined'?window:globalThis);
