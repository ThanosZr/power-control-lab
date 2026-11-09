'use strict';
// Step checks and diagnostics (3.13, ROADMAP §40). No DOM: runs in Node too.
//
// * The natural modes of the circuit at the present switch states, against the step:
//   λ from the eigenvalues μ of the backward-Euler map of the reactive states with
//   the sources off, μ = 1/(1 − hλ). A mode that moves when R_on/R_off of the
//   switches change is a switch parasitic (information only).
// * The time scales of the sources (sine, PWM, impulse fronts) and of the lines.
// * Each message: severity, group, element, time, what happened and what to do.
(function(root){
 const P=root.Parts||(typeof require!=='undefined'?require('./parts.js'):null);
 // ---------------------------------------------------------------- eigenvalues
 // real n×n matrix (array of rows): balance, reduce to Hessenberg, shifted QR (EISPACK balanc/elmhes/hqr)
 function balance(a,n){const R=2,R2=4;let done=false;
  while(!done){done=true;for(let i=0;i<n;i++){let r=0,c=0;for(let j=0;j<n;j++)if(j!==i){c+=Math.abs(a[j][i]);r+=Math.abs(a[i][j]);}
   if(c&&r){let g=r/R,f=1;const s=c+r;while(c<g){f*=R;c*=R2;}g=r*R;while(c>g){f/=R;c/=R2;}
    if((c+r)/f<.95*s){done=false;g=1/f;for(let j=0;j<n;j++)a[i][j]*=g;for(let j=0;j<n;j++)a[j][i]*=f;}}}}}
 function hessenberg(a,n){
  for(let m=1;m<n-1;m++){let x=0,i=m;for(let j=m;j<n;j++)if(Math.abs(a[j][m-1])>Math.abs(x)){x=a[j][m-1];i=j;}
   if(i!==m){for(let j=m-1;j<n;j++){const t=a[i][j];a[i][j]=a[m][j];a[m][j]=t;}for(let j=0;j<n;j++){const t=a[j][i];a[j][i]=a[j][m];a[j][m]=t;}}
   if(x)for(let i2=m+1;i2<n;i2++){let y=a[i2][m-1];if(y!==0){y/=x;a[i2][m-1]=y;for(let j=m;j<n;j++)a[i2][j]-=y*a[m][j];for(let j=0;j<n;j++)a[j][m]+=y*a[j][i2];}}}}
 function hqr(a,n){
  const wr=new Float64Array(n),wi=new Float64Array(n);let anorm=0;
  for(let i=0;i<n;i++)for(let j=Math.max(i-1,0);j<n;j++)anorm+=Math.abs(a[i][j]);
  let nn=n-1,t=0,l,p=0,q=0,r=0,s,w,x,y,z=0;
  while(nn>=0){let its=0;
   do{
    for(l=nn;l>=1;l--){s=Math.abs(a[l-1][l-1])+Math.abs(a[l][l]);if(s===0)s=anorm;if(Math.abs(a[l][l-1])+s===s){a[l][l-1]=0;break;}}
    x=a[nn][nn];
    if(l===nn){wr[nn]=x+t;wi[nn]=0;nn--;}
    else{y=a[nn-1][nn-1];w=a[nn][nn-1]*a[nn-1][nn];
     if(l===nn-1){p=.5*(y-x);q=p*p+w;z=Math.sqrt(Math.abs(q));x+=t;
      if(q>=0){z=p+(p>=0?Math.abs(z):-Math.abs(z));wr[nn-1]=wr[nn]=x+z;if(z)wr[nn]=x-w/z;wi[nn-1]=wi[nn]=0;}
      else{wr[nn-1]=wr[nn]=x+p;wi[nn]=z;wi[nn-1]=-z;}
      nn-=2;}
     else{
      if(its===60)throw new Error('eig: no convergence');
      if(its===10||its===20){t+=x;for(let i=0;i<=nn;i++)a[i][i]-=x;s=Math.abs(a[nn][nn-1])+Math.abs(a[nn-1][nn-2]);y=x=.75*s;w=-.4375*s*s;}
      its++;let m;
      for(m=nn-2;m>=l;m--){z=a[m][m];r=x-z;s=y-z;p=(r*s-w)/a[m+1][m]+a[m][m+1];q=a[m+1][m+1]-z-r-s;r=a[m+2][m+1];
       s=Math.abs(p)+Math.abs(q)+Math.abs(r);p/=s;q/=s;r/=s;if(m===l)break;
       const u=Math.abs(a[m][m-1])*(Math.abs(q)+Math.abs(r)),v=Math.abs(p)*(Math.abs(a[m-1][m-1])+Math.abs(z)+Math.abs(a[m+1][m+1]));if(u+v===v)break;}
      for(let i=m+2;i<=nn;i++){a[i][i-2]=0;if(i!==m+2)a[i][i-3]=0;}
      for(let k=m;k<=nn-1;k++){
       if(k!==m){p=a[k][k-1];q=a[k+1][k-1];r=0;if(k!==nn-1)r=a[k+2][k-1];x=Math.abs(p)+Math.abs(q)+Math.abs(r);if(x!==0){p/=x;q/=x;r/=x;}}
       s=Math.sqrt(p*p+q*q+r*r);if(p<0)s=-s;
       if(s!==0){
        if(k===m){if(l!==m)a[k][k-1]=-a[k][k-1];}else a[k][k-1]=-s*x;
        p+=s;x=p/s;y=q/s;z=r/s;q/=p;r/=p;
        for(let j=k;j<=nn;j++){p=a[k][j]+q*a[k+1][j];if(k!==nn-1){p+=r*a[k+2][j];a[k+2][j]-=p*z;}a[k+1][j]-=p*y;a[k][j]-=p*x;}
        const mm=nn<k+3?nn:k+3;
        for(let i=l;i<=mm;i++){p=x*a[i][k]+y*a[i][k+1];if(k!==nn-1){p+=z*a[i][k+2];a[i][k+2]-=p*r;}a[i][k+1]-=p*q;a[i][k]-=p;}}}}}
   }while(l<nn-1);}
  return {re:wr,im:wi};}
 // eigenvalues of M (row-major Float64Array n×n); M is not changed
 function eig(M,n){if(!n)return {re:new Float64Array(0),im:new Float64Array(0)};const a=[];for(let i=0;i<n;i++)a.push(Float64Array.from(M.subarray(i*n,i*n+n)));
  if(n===1)return {re:Float64Array.of(a[0][0]),im:Float64Array.of(0)};balance(a,n);hessenberg(a,n);return hqr(a,n);}
 // eigenvector for an eigenvalue μ = (mr, mi) by inverse iteration in complex arithmetic: |z_k| per state
 function eigvecAbs(M,n,mr,mi){
  const sc=Math.max(1e-300,Math.hypot(mr,mi)),er=mr+1e-7*sc,ei=mi+1e-7*sc*(mi?1:0); // a shift just off μ, so the system is solvable
  const Ar=new Float64Array(n*n),Ai=new Float64Array(n*n);for(let i=0;i<n*n;i++)Ar[i]=M[i];for(let i=0;i<n;i++){Ar[i*n+i]-=er;Ai[i*n+i]-=ei;}
  const piv=new Int32Array(n); // LU with partial pivoting (complex)
  for(let k=0;k<n;k++){let p=k,mx=-1;for(let i=k;i<n;i++){const v=Math.hypot(Ar[i*n+k],Ai[i*n+k]);if(v>mx){mx=v;p=i;}}piv[k]=p;
   if(p!==k)for(let j=0;j<n;j++){let t=Ar[k*n+j];Ar[k*n+j]=Ar[p*n+j];Ar[p*n+j]=t;t=Ai[k*n+j];Ai[k*n+j]=Ai[p*n+j];Ai[p*n+j]=t;}
   let dr=Ar[k*n+k],di=Ai[k*n+k];if(dr===0&&di===0){dr=1e-300;Ar[k*n+k]=dr;}const dd=dr*dr+di*di;
   for(let i=k+1;i<n;i++){const xr=Ar[i*n+k],xi=Ai[i*n+k];if(!xr&&!xi)continue;const fr=(xr*dr+xi*di)/dd,fi=(xi*dr-xr*di)/dd;Ar[i*n+k]=fr;Ai[i*n+k]=fi;
    for(let j=k+1;j<n;j++){const ur=Ar[k*n+j],ui=Ai[k*n+j];Ar[i*n+j]-=fr*ur-fi*ui;Ai[i*n+j]-=fr*ui+fi*ur;}}}
  let zr=new Float64Array(n).fill(1),zi=new Float64Array(n);
  for(let it=0;it<3;it++){
   for(let k=0;k<n;k++){const p=piv[k];if(p!==k){let t=zr[k];zr[k]=zr[p];zr[p]=t;t=zi[k];zi[k]=zi[p];zi[p]=t;}}
   for(let i=0;i<n;i++){let sr=zr[i],si=zi[i];for(let j=0;j<i;j++){const lr=Ar[i*n+j],li=Ai[i*n+j];sr-=lr*zr[j]-li*zi[j];si-=lr*zi[j]+li*zr[j];}zr[i]=sr;zi[i]=si;}
   for(let i=n-1;i>=0;i--){let sr=zr[i],si=zi[i];for(let j=i+1;j<n;j++){const ur=Ar[i*n+j],ui=Ai[i*n+j];sr-=ur*zr[j]-ui*zi[j];si-=ur*zi[j]+ui*zr[j];}
    const dr=Ar[i*n+i],di=Ai[i*n+i],dd=dr*dr+di*di;zr[i]=(sr*dr+si*di)/dd;zi[i]=(si*dr-sr*di)/dd;}
   let nm=0;for(let i=0;i<n;i++)nm=Math.max(nm,Math.hypot(zr[i],zi[i]));if(!(nm>0)||!Number.isFinite(nm))break;for(let i=0;i<n;i++){zr[i]/=nm;zi[i]/=nm;}}
  const out=new Float64Array(n);for(let i=0;i<n;i++)out[i]=Math.hypot(zr[i],zi[i]);return out;}

 // ---------------------------------------------------------------- formatting
 const eng=(v,u,d=3)=>P&&P.eng?P.eng(v,u,d):v.toPrecision(d)+' '+u;
 const DIVS=[50,100,200,500,1000,2000,5000],fx=(x,d=1)=>x.toFixed(d).replace('.',',');
 // the smallest T/N of the step menu that gives a step ≤ h
 function divFor(T,h){for(const d of DIVS)if(T/d<=h*(1+1e-9))return d;return null;}

 // ---------------------------------------------------------------- the step check
 // modes: λ = (1 − 1/μ)/h from the BE map of the states, with the switch resistances as they are,
 // and again with R_on ×10 and R_off ÷10 (modes that move are set by the switch models)
 function modes(sim,h){
  const M=sim.stateMap(h);if(!M)return null;const n=M.n;
  const lam=(e)=>{const out=[];for(let i=0;i<n;i++){const mr=e.re[i],mi=e.im[i],d=mr*mr+mi*mi;if(!(d>0))continue;
    // 1/μ = conj(μ)/|μ|²
    out.push({re:(1-mr/d)/h,im:(mi/d)/h,mr,mi});}return out;};
  const e0=eig(M.m,n),L0=lam(e0);
  const sw=sim.net.els.filter(e=>e.k==='S'||e.k==='D');let L1=null;
  if(sw.length){const keep=sw.map(e=>[e.Ron,e.Roff]);for(const e of sw){e.Ron*=10;e.Roff/=10;}
   try{const M1=sim.stateMap(h);L1=lam(eig(M1.m,n));}finally{sw.forEach((e,i)=>{e.Ron=keep[i][0];e.Roff=keep[i][1];});}}
  for(const q of L0){q.abs=Math.hypot(q.re,q.im);
   if(L1){let best=Infinity;for(const r of L1){const a=Math.hypot(r.re,r.im);const d=Math.abs(Math.log((a+1e-300)/(q.abs+1e-300)))+Math.abs(Math.atan2(Math.abs(r.im),-r.re)-Math.atan2(Math.abs(q.im),-q.re));if(d<best)best=d;}
    q.parasitic=best>Math.log(1.5);}}
  return {list:L0,M,n};}

 // which elements carry a mode: energy-weighted eigenvector of the BE map
 function owners(sim,M,q){const v=eigvecAbs(M.m,M.n,q.mr,q.mi),S=sim.stEls,w=new Float64Array(v.length);
  for(let i=0;i<v.length;i++){const s=S[i],e=s.e;w[i]=v[i]*Math.sqrt(s.k==='C'?e.C:s.k==='L'?e.L:1/Math.max(1e-30,Math.abs(e.Gnow?e.Gnow[s.j*e.N+s.j]:1)));}
  let mx=0;for(const x of w)mx=Math.max(mx,x);const ids=[];
  const ord=[...w.keys()].sort((a,b)=>w[b]-w[a]);for(const i of ord){if(w[i]<.3*mx||ids.length>=3)break;const id=S[i].e.cid;if(id&&!ids.includes(id))ids.push(id);}
  return ids;}

 function check(sim){
  const out=[],lab=id=>{const c=sim.net.compInfo.get(id);return c?c.label:id;};
  if(sim.var&&sim.capDirty)sim.modeCap();
  const varStep=!!sim.var,hRef=varStep?Math.min(sim.hMax,sim.hCap||Infinity):sim.h,T=sim.T;
  const stepTxt=varStep?`μέγιστο βήμα ${eng(hRef,'s')}${sim.hCap&&sim.hCap<sim.hMax?' (2τ της ταχύτερης σταθεράς χρόνου, για τον τραπεζοειδή)':''}`:`βήμα ${eng(hRef,'s')} (T/${Math.round(T/sim.h)})`;
  // lines: the step never exceeds τ/N of the shortest line section
  const tl=sim.tlMaxStep();
  if(Number.isFinite(tl)&&tl<sim.hUser*(1-1e-9)){const e=sim.net.els.filter(x=>x.k==='TL').sort((a,b)=>a.ts-b.ts)[0];
   out.push({sev:'info',grp:'step',id:e?.cid||null,key:'tl',msg:`Το βήμα περιορίζεται από τη γραμμή ${lab(e?.cid)} στο τ/N = ${eng(tl,'s')}.`,fix:'Λιγότερα τμήματα N στη γραμμή μεγαλώνουν το βήμα· περισσότερα δίνουν καλύτερη ανάλυση των απωλειών.'});}
  // sources
  for(const c of sim.net.compInfo.values()){
   const src=c.main?.src;
   if((c.type==='VAC'||c.type==='VAC3')&&src?.f>0){const n=1/(src.f*hRef);
    if(n<20)out.push({sev:n<8?'warn':'info',grp:'step',id:c.id,key:'f:'+c.id,msg:`Η πηγή ${c.label} (${eng(src.f,'Hz')}) έχει μόνο ${fx(n)} βήματα ανά περίοδο με ${stepTxt}.`,fix:`Βήμα ≤ ${eng(1/(40*src.f),'s')} (40 βήματα ανά περίοδο).`});}
   if(c.wave&&c.wave.T1>0){const n=c.wave.T1/hRef;
    if(n<20)out.push({sev:n<5?'warn':'info',grp:'step',id:c.id,key:'w:'+c.id,msg:`Το μέτωπο της ${c.label} (T1 = ${eng(c.wave.T1,'s')}) έχει μόνο ${fx(n)} βήματα με ${stepTxt}.`,fix:`Βήμα ≤ ${eng(c.wave.T1/20,'s')}, ή μεταβλητό βήμα.`});}}
  for(const k of sim.net.ctrls){const n=k.T/hRef;if(n<20)out.push({sev:n<4?'warn':'info',grp:'step',id:k.id,key:'pwm:'+k.id,msg:`Το PWM ${lab(k.id)} (${eng(1/k.T,'Hz')}) έχει μόνο ${fx(n)} βήματα ανά περίοδο μεταγωγής.`,fix:'Οι ακμές βρίσκονται ακριβώς (συμβάντα)· η κυμάτωση μέσα στην περίοδο θέλει μικρότερο βήμα.'});}
  // natural modes
  if(!sim.stEls||!sim.stEls.length)return out;
  if(sim.stEls.length>200){out.push({sev:'info',grp:'step',id:null,key:'big',msg:`${sim.stEls.length} καταστάσεις: η ανάλυση των σταθερών χρόνου παραλείπεται (όριο 200).`,fix:'Οι έλεγχοι κατά την προσομοίωση (ταλάντωση δύο βημάτων, μεταβλητό βήμα) ισχύουν κανονικά.'});return out;}
  let md;try{md=modes(sim,hRef);}catch(e){out.push({sev:'info',grp:'step',id:null,key:'eig',msg:'Η ανάλυση των σταθερών χρόνου δεν ολοκληρώθηκε: '+e.message,fix:''});return out;}
  if(!md)return out;
  const fast=md.list.filter(q=>q.abs*hRef>.25&&Number.isFinite(q.abs)).sort((a,b)=>b.abs-a.abs);
  const seen=new Set(),alg=[];let par=0,parMin=Infinity;
  for(const q of fast){
   if(q.parasitic){par++;parMin=Math.min(parMin,1/q.abs);continue;}
   if(q.im<0)continue; // one of each conjugate pair
   const osc=Math.abs(q.im)>.1*Math.abs(q.re)&&Math.abs(q.im)>0,ids=owners(sim,md.M,q),key=(osc?'o:':'r:')+[...ids].sort().join(',');if(seen.has(key))continue;seen.add(key);
   const who=ids.length?ids.map(lab).join(', '):'',id=ids[0]||null;
   if(osc){const f=Math.abs(q.im)/(2*Math.PI),n=1/(f*hRef),zeta=-q.re/q.abs;
    if(n>=20)continue;
    const need=1/(20*f),d=divFor(T,need);
    out.push({sev:n<10&&(!varStep||1/(f*sim.hMin)<10)?'warn':'info',grp:'step',id,ids,key:'mode:'+key,f,
     msg:`Ταλάντωση ${eng(f,'Hz')} (ζ = ${fx(zeta,2)}${who?', '+who:''}): μόνο ${fx(n)} βήματα ανά περίοδο με ${stepTxt}.`,
     fix:varStep?`Το μεταβλητό βήμα θα μικρύνει όσο η ταλάντωση είναι ενεργή· για ακρίβεια σε όλη τη διάρκεια, μέγιστο βήμα ≤ ${eng(need,'s')}.`:
      `Βήμα ≤ ${eng(need,'s')}${d?` (T/${d})`:''}, ή μεταβλητό βήμα. Αν δεν σε ενδιαφέρει η ταλάντωση, Gear/BDF2 την αποσβένει.`});}
   else{const tau=1/q.abs,ratio=hRef/tau,need=tau/5,d=divFor(T,need);
    if(ratio>1000){alg.push({tau,ids});continue;} // practically instantaneous for this step: the response through it is algebraic
    out.push({sev:ratio>2&&(!varStep||sim.hMin/tau>2)?'warn':'info',grp:'step',id,ids,key:'mode:'+key,tau,
     msg:ratio>2?`Το ${stepTxt} είναι ${ratio>=10?Math.round(ratio):fx(ratio)} φορές μεγαλύτερο από τη σταθερά χρόνου ${eng(tau,'s')}${who?' ('+who+')':''}. Ο τραπεζοειδής ταλαντώνεται εκεί (±) αντί να αποσβένει, και η γρήγορη απόκριση δεν φαίνεται.`:
      `Σταθερά χρόνου ${eng(tau,'s')}${who?' ('+who+')':''}: μόνο ${fx(tau/hRef)} βήματα ανά σταθερά με ${stepTxt}. Η ακρίβεια εκεί είναι περιορισμένη.`,
     fix:varStep?`Το μεταβλητό βήμα μικραίνει εκεί αυτόματα (ως ${eng(sim.hMin,'s')}).`:
      `Βήμα ≤ ${eng(need,'s')}${d?` (T/${d})`:' (κάτω από T/5000: μεταβλητό βήμα)'}, ή μεταβλητό βήμα. Αν μετράνε μόνο οι αργές μεταβολές, Gear/BDF2 αποσβένει τη γρήγορη.`});}}
  for(let i=0;i<out.length;i++){const a=out[i];if(!a.key?.startsWith('mode:'))continue;
   for(let j=out.length-1;j>i;j--){const b=out[j];if(!b.key?.startsWith('mode:')||b.sev!==a.sev)continue;
    const same=a.tau&&b.tau?Math.abs(a.tau/b.tau-1)<.02:a.f&&b.f?Math.abs(a.f/b.f-1)<.02:false;if(!same)continue;
    const ids=[...new Set([...(a.ids||[]),...(b.ids||[])])];a.ids=ids;a.msg=a.msg.replace(/\(([^()]*(?:\([^()]*\))?[^()]*)\)/,'('+ids.map(lab).join(', ')+')');out.splice(j,1);}}
  if(alg.length){const ids=[...new Set(alg.flatMap(a=>a.ids))].slice(0,4),slow=Math.max(...alg.map(a=>a.tau));
   out.push({sev:'info',grp:'step',id:ids[0]||null,key:'alg',msg:`${alg.length===1?'Μία σταθερά χρόνου':alg.length+' σταθερές χρόνου'} κάτω από ${eng(slow,'s')} (${ids.map(lab).join(', ')}), πάνω από 1000 φορές μικρότερη από το βήμα: πρακτικά στιγμιαία.`,
    fix:'Η λύση μέσα από αυτήν είναι αλγεβρική και σωστή στις αργές μεταβολές. Αν εμφανιστεί ταλάντωση δύο βημάτων (μήνυμα παρακάτω), Gear/BDF2 ή μια μικρή R σε σειρά.'});}
  if(par)out.push({sev:'info',grp:'step',id:null,key:'par',msg:`${par} ${par===1?'γρήγορη σταθερά χρόνου':'γρήγορες σταθερές χρόνου'} (ως ${eng(parMin,'s')}) από τα R_on/R_off των διακοπτών και των διόδων.`,
   fix:'Δεν αλλάζουν τις μέσες τιμές· οι αιχμές ρεύματος στις μεταγωγές θέλουν R σε σειρά (π.χ. ESR) ή μικρότερο βήμα. Τα δύο βήματα Backward Euler μετά από κάθε μεταγωγή τις αποσβένουν.'});
  return out;}

 const api={eig,eigvecAbs,check,modes,divFor};
 root.StepCheck=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
