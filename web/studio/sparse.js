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
  const pinv=new Int32Array(n).fill(-1),x=new Float64Array(n),xi=new Int32Array(2*n),mark=new Int32Array(n);
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
   let ipiv=-1,a=-1;
   for(let p=top;p<n;p++){const i=xi[p];
    if(pinv[i]<0){const t=Math.abs(x[i]);if(t>a){a=t;ipiv=i;}}
    else{Ui[unz]=pinv[i];Ux[unz++]=x[i];}}
   if(ipiv<0||!(a>1e-300))throw new SparseError('singular');
   if(pinv[col]<0&&Math.abs(x[col])>=a*tol)ipiv=col;
   const piv=x[ipiv];Ui[unz]=k;Ux[unz++]=piv;pinv[ipiv]=k;Li[lnz]=ipiv;Lx[lnz++]=1;
   for(let p=top;p<n;p++){const i=xi[p];if(pinv[i]<0){Li[lnz]=i;Lx[lnz++]=x[i]/piv;}x[i]=0;}
  }
  Lp[n]=lnz;Up[n]=unz;
  for(let p=0;p<lnz;p++)Li[p]=pinv[Li[p]];
  return {n,Lp,Li:Li.slice(0,lnz),Lx:Lx.slice(0,lnz),Up,Ui:Ui.slice(0,unz),Ux:Ux.slice(0,unz),pinv,q:Int32Array.from(q),nnz:lnz+unz};
 }

 // b ← A⁻¹·b: y = P·b, L·z = y, U·w = z, x = Q·w
 function solve(F,b,w){
  const n=F.n,{Lp,Li,Lx,Up,Ui,Ux,pinv,q}=F;w=w||new Float64Array(n);
  for(let k=0;k<n;k++)w[pinv[k]]=b[k];
  for(let j=0;j<n;j++){const v=w[j];if(v===0)continue;for(let p=Lp[j]+1;p<Lp[j+1];p++)w[Li[p]]-=Lx[p]*v;}
  for(let j=n-1;j>=0;j--){const d=Up[j+1]-1;const v=w[j]/Ux[d];w[j]=v;if(v===0)continue;for(let p=Up[j];p<d;p++)w[Ui[p]]-=Ux[p]*v;}
  for(let k=0;k<n;k++)b[q[k]]=w[k];
  return b;
 }

 const api={pattern,order,lu,solve,SparseError};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.Sparse=api;
})(typeof window!=='undefined'?window:globalThis);
