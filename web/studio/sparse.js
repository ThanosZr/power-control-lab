'use strict';
// Sparse LU for the browser solver (4.2, ROADMAP §32). Pure functions, no DOM.
//
// * pattern(n, keys): the compressed-column pattern of the stamps (key = row·n + col), fixed for a netlist,
//   with the slot of every key; the values are accumulated into Ax by the solver's assemble().
// * order(P): a minimum-degree column ordering on the pattern of A + Aᵀ (less fill-in), computed once.
// * lu(P, Ax, q, tol): left-looking LU with partial pivoting (Gilbert–Peierls: a sparse triangular solve per
//   column, with the reach found by depth-first search), the diagonal kept when |a_jj| ≥ tol·max of the column
//   (threshold pivoting, as KLU does): P·A·Q = L·U.
// * solve(F, b): b ← A⁻¹·b with the factors (in place).
// 4.19 (ROADMAP §68): when the matrix changes and its pattern does not (a machine, a nonlinear element, a switch):
// * refactor(F, P, Ax, tol, flags): the factors with the pattern and the pivots of F, without the depth-first search (as
//   the refactorization of KLU); the operations in the order lu() made them, so the numbers are those of lu(), bit for
//   bit; it stops (−1) where lu() would choose another pivot. With flags only some columns (partial refactorization).
// * diffCols(P, F, Ax, Aold, chg): the columns of the matrix that changed; affected(F, chg): those and every column on
//   their factorization path (Chan & Brandwajn 1986, method PR1); clone(F): factors with their own values, to keep.
//
// The classic references are in docs/THEORY.md (sparse elimination and ordering; the EMTP's own sparsity methods).
(function(root){
 class SparseError extends Error{}

 // ---------------------------------------------------------------- pattern
 function pattern(n,keys){
  const ks=[...new Set(keys)].sort((x,y)=>{const cx=x%n,cy=y%n;return cx-cy||x-y;});
  const Ap=new Int32Array(n+1),Ai=new Int32Array(ks.length),map=new Map();
  ks.forEach((k,s)=>{const c=k%n,r=(k-c)/n;Ap[c+1]++;Ai[s]=r;map.set(k,s);});
  for(let j=0;j<n;j++)Ap[j+1]+=Ap[j];
  return {n,Ap,Ai,map,nnz:ks.length};
 }

 // ---------------------------------------------------------------- minimum-degree ordering on A + Aᵀ
 // Exact elimination graph with sets; ties go to the lower index, so the order is deterministic. Enough for the
 // circuits of the app (degrees of a few); an approximate degree (AMD) is the step after the measurement.
 function order(P){
  const n=P.n,adj=Array.from({length:n},()=>new Set());
  for(let j=0;j<n;j++)for(let p=P.Ap[j];p<P.Ap[j+1];p++){const i=P.Ai[p];if(i!==j){adj[i].add(j);adj[j].add(i);}}
  // buckets by degree
  const deg=new Int32Array(n),done=new Uint8Array(n),q=new Int32Array(n);
  let maxd=0;for(let i=0;i<n;i++){deg[i]=adj[i].size;if(deg[i]>maxd)maxd=deg[i];}
  let buckets=Array.from({length:maxd+2},()=>new Set());for(let i=0;i<n;i++)buckets[deg[i]].add(i);
  const move=(i,d)=>{buckets[deg[i]].delete(i);deg[i]=d;while(d>=buckets.length)buckets.push(new Set());buckets[d].add(i);};
  let dmin=0;
  for(let k=0;k<n;k++){
   while(dmin<buckets.length&&!buckets[dmin].size)dmin++;
   let v=-1;for(const x of buckets[dmin])if(v<0||x<v)v=x;
   buckets[dmin].delete(v);done[v]=1;q[k]=v;
   const nb=[...adj[v]];
   for(const a of nb){adj[a].delete(v);for(const b of nb)if(a!==b)adj[a].add(b);}
   for(const a of nb){move(a,adj[a].size);if(deg[a]<dmin)dmin=deg[a];}
   adj[v]=null;
  }
  return q;
 }

 // ---------------------------------------------------------------- LU
 function grow(a,need){if(need<=a.length)return a;const b=new a.constructor(Math.max(need,2*a.length));b.set(a);return b;}

 // depth-first search from node j in the graph of L (columns through pinv); xi[top…n−1] gets the reach in
 // topological order. mark/stamp avoid clearing between columns.
 function dfs(j,Lp,Li,top,xi,pstack,pinv,mark,stamp,n){
  let head=0;xi[0]=j;
  while(head>=0){
   j=xi[head];const jn=pinv[j];
   if(mark[j]!==stamp){mark[j]=stamp;pstack[head]=jn<0?0:Lp[jn];}
   let done=true;const p2=jn<0?0:Lp[jn+1];
   for(let p=pstack[head];p<p2;p++){const i=Li[p];if(mark[i]===stamp)continue;pstack[head]=p+1;xi[++head]=i;done=false;break;}
   if(done){head--;xi[--top]=j;}
  }
  return top;
 }

 function lu(P,Ax,q,tol=0.1){
  const n=P.n,Ap=P.Ap,Ai=P.Ai;
  let Lp=new Int32Array(n+1),Up=new Int32Array(n+1),cap=Math.max(4*P.nnz+n,16);
  let Li=new Int32Array(cap),Lx=new Float64Array(cap),Ui=new Int32Array(cap),Ux=new Float64Array(cap);
  const pinv=new Int32Array(n).fill(-1),x=new Float64Array(n),xi=new Int32Array(2*n),mark=new Int32Array(n),ppos=new Int32Array(n);
  let lnz=0,unz=0;
  for(let k=0;k<n;k++){
   Lp[k]=lnz;Up[k]=unz;
   if(lnz+n>Li.length){Li=grow(Li,lnz+n);Lx=grow(Lx,lnz+n);}
   if(unz+n>Ui.length){Ui=grow(Ui,unz+n);Ux=grow(Ux,unz+n);}
   const col=q[k];
   // x = L \ A(:,col) on the reach of the column's pattern
   let top=n;const stamp=k+1;
   for(let p=Ap[col];p<Ap[col+1];p++){const i=Ai[p];if(mark[i]!==stamp)top=dfs(i,Lp,Li,top,xi,xi.subarray(n),pinv,mark,stamp,n);}
   for(let p=top;p<n;p++)x[xi[p]]=0;
   for(let p=Ap[col];p<Ap[col+1];p++)x[Ai[p]]+=Ax[p];
   for(let px=top;px<n;px++){const j=xi[px],J=pinv[j];if(J<0)continue;
    const xj=x[j];                                         // the diagonal of L is 1 (first entry of the column)
    for(let p=Lp[J]+1;p<Lp[J+1];p++)x[Li[p]]-=Lx[p]*xj;}            // J < k: column J is complete
   // pivot: the largest among the rows not yet pivotal; the diagonal when it is within tol of it
   // (4.19: ppos = how many candidates come before the pivot in this order, for refactor() to choose as here)
   let ipiv=-1,a=-1,nc=0,apos=0,cpos=0;
   for(let p=top;p<n;p++){const i=xi[p];
    if(pinv[i]<0){const t=Math.abs(x[i]);if(t>a){a=t;ipiv=i;apos=nc;}if(i===col)cpos=nc;nc++;}
    else{Ui[unz]=pinv[i];Ux[unz++]=x[i];}}
   if(ipiv<0||!(a>1e-300))throw new SparseError('singular');
   if(pinv[col]<0&&Math.abs(x[col])>=a*tol){ipiv=col;apos=cpos;}
   ppos[k]=apos;
   const piv=x[ipiv];Ui[unz]=k;Ux[unz++]=piv;pinv[ipiv]=k;Li[lnz]=ipiv;Lx[lnz++]=1;
   for(let p=top;p<n;p++){const i=xi[p];if(pinv[i]<0){Li[lnz]=i;Lx[lnz++]=x[i]/piv;}x[i]=0;}
  }
  Lp[n]=lnz;Up[n]=unz;
  for(let p=0;p<lnz;p++)Li[p]=pinv[Li[p]];
  return {n,Lp,Li:Li.slice(0,lnz),Lx:Lx.slice(0,lnz),Up,Ui:Ui.slice(0,unz),Ux:Ux.slice(0,unz),pinv,q:Int32Array.from(q),nnz:lnz+unz,ppos};
 }

 // ---------------------------------------------------------------- refactorization (4.19)
 // The factors of a matrix with the pattern P and the values Ax, with the pattern and the pivots of F (overwritten). Column
 // k: x = A(:, q[k]) in the rows of the pivots, then the columns of L of its U part in the order lu() took them (the stored
 // order of U is that topological order), then the same choice of pivot: the first largest among the candidates in the
 // order of lu() (ppos), or the diagonal within tol of it. Every operation is the one lu() makes, in its order: the same
 // numbers bit for bit. flags (Uint8Array by pivot position): only these columns; the others must be unchanged (their
 // column of A and every column of L they use). Returns the number of columns computed, or −1 when lu() would choose
 // another pivot (or finds the matrix singular): F is then partly overwritten and the caller factors from scratch.
 function refactor(F,P,Ax,tol=0.1,flags=null){
  const n=F.n,Ap=P.Ap,Ai=P.Ai,Lp=F.Lp,Li=F.Li,Lx=F.Lx,Up=F.Up,Ui=F.Ui,Ux=F.Ux,pinv=F.pinv,q=F.q,ppos=F.ppos,x=F.w||(F.w=new Float64Array(n));let cnt=0;
  for(let k=0;k<n;k++){if(flags&&!flags[k])continue;cnt++;
   const col=q[k],l0=Lp[k],l1=Lp[k+1],u0=Up[k],u1=Up[k+1]-1;
   for(let p=Ap[col],e=Ap[col+1];p<e;p++)x[pinv[Ai[p]]]+=Ax[p];
   for(let p=u0;p<u1;p++){const J=Ui[p],xj=x[J];Ux[p]=xj;for(let s=Lp[J]+1,e=Lp[J+1];s<e;s++)x[Li[s]]-=Lx[s]*xj;}
   let a=-1,arg=-1;const m=l0+1+ppos[k];
   for(let p=l0+1;p<m;p++){const r=Li[p],t=Math.abs(x[r]);if(t>a){a=t;arg=r;}}
   {const t=Math.abs(x[k]);if(t>a){a=t;arg=k;}}
   for(let p=m;p<l1;p++){const r=Li[p],t=Math.abs(x[r]);if(t>a){a=t;arg=r;}}
   const dr=pinv[col];if(dr>=k&&Math.abs(x[dr])>=a*tol)arg=dr;
   if(arg!==k||!(a>1e-300)){for(let p=l0;p<l1;p++)x[Li[p]]=0;for(let p=u0;p<u1;p++)x[Ui[p]]=0;return -1;}
   const piv=x[k];Ux[u1]=piv;x[k]=0;
   for(let p=l0+1;p<l1;p++){const r=Li[p];Lx[p]=x[r]/piv;x[r]=0;}
   for(let p=u0;p<u1;p++)x[Ui[p]]=0;
  }
  return cnt;
 }
 // the columns (by pivot position) where the values Ax differ from Aold, flagged in chg (cleared first) and copied into
 // Aold; returns the first of them, or −1 when nothing changed
 function diffCols(P,F,Ax,Aold,chg){
  const n=P.n,Ap=P.Ap,q=F.q;let first=-1;
  for(let k=0;k<n;k++){const j=q[k],e=Ap[j+1];let p=Ap[j];while(p<e&&Ax[p]===Aold[p])p++;
   if(p<e){chg[k]=1;if(first<0)first=k;for(;p<e;p++)Aold[p]=Ax[p];}else chg[k]=0;}
  return first;
 }
 // the factorization path: every column whose U part has a flagged column is flagged too (ascending, so the flags of the
 // columns it uses are final); from: the first flagged column. Returns how many columns are flagged
 function affected(F,chg,from=0){
  const n=F.n,Up=F.Up,Ui=F.Ui;let c=0;
  for(let k=Math.max(0,from);k<n;k++){if(!chg[k]){for(let p=Up[k],e=Up[k+1]-1;p<e;p++)if(chg[Ui[p]]){chg[k]=1;break;}}if(chg[k])c++;}
  return c;
 }
 // factors with their own values (the structure is shared: refactor() changes values only)
 function clone(F){return {n:F.n,Lp:F.Lp,Li:F.Li,Lx:F.Lx.slice(),Up:F.Up,Ui:F.Ui,Ux:F.Ux.slice(),pinv:F.pinv,q:F.q,nnz:F.nnz,ppos:F.ppos};}

 // b ← A⁻¹·b: y = P·b, L·z = y, U·w = z, x = Q·w
 function solve(F,b,w){
  const n=F.n,{Lp,Li,Lx,Up,Ui,Ux,pinv,q}=F;w=w||new Float64Array(n);
  for(let k=0;k<n;k++)w[pinv[k]]=b[k];
  for(let j=0;j<n;j++){const v=w[j];if(v===0)continue;for(let p=Lp[j]+1;p<Lp[j+1];p++)w[Li[p]]-=Lx[p]*v;}
  for(let j=n-1;j>=0;j--){const d=Up[j+1]-1;const v=w[j]/Ux[d];w[j]=v;if(v===0)continue;for(let p=Up[j];p<d;p++)w[Ui[p]]-=Ux[p]*v;}
  for(let k=0;k<n;k++)b[q[k]]=w[k];
  return b;
 }

 const api={pattern,order,lu,solve,refactor,diffCols,affected,clone,SparseError};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.Sparse=api;
})(typeof window!=='undefined'?window:globalThis);
