// 4.19 (ROADMAP §68): the kernels of tools/kernels/kernels.c in WebAssembly against the same loops in JavaScript: the
// time of each and that the numbers are the same bit for bit. Needs clang with the wasm32 target and wasm-ld.
// Usage: node tools/kernels/bench.js   (prints JSON; 16/11/2026, clang 18, Node 22: solve 1,6–1,9 times, wb 1,06–2,0 times)
const fs=require('fs'),os=require('os'),path=require('path'),{spawnSync}=require('child_process');
const W=path.resolve(__dirname,'../../web/studio');global.window=globalThis;const SP=require(W+'/sparse.js');
const out=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'pclk-')),'kernels.wasm');
const cc=spawnSync('clang',['--target=wasm32','-O3','-msimd128','-nostdlib','-ffp-contract=off','-Wl,--no-entry','-Wl,--export-memory','-Wl,--initial-memory=67108864','-o',out,path.join(__dirname,'kernels.c')],{encoding:'utf8'});
if(cc.error||cc.status!==0){console.log(JSON.stringify({error:'clang with the wasm32 target is needed: '+String(cc.error||cc.stderr).slice(0,200)}));process.exit(0);}
const ex=new WebAssembly.Instance(new WebAssembly.Module(fs.readFileSync(out)),{}).exports,mem=ex.memory.buffer;let top=1024;
const alloc=(T,n)=>{top=(top+7)&~7;const a=new T(mem,top,n);top+=n*T.BYTES_PER_ELEMENT;return a;},put=src=>{const a=alloc(src.constructor,src.length);a.set(src);return a;};
const now=()=>Number(process.hrtime.bigint())/1e3,res={};
// a matrix like a three-phase chain: n unknowns, couplings at distance 1, 3 and 7
function chain(n){const keys=[];for(let i=0;i<n;i++){keys.push(i*n+i);for(const d of [1,3,7])if(i+d<n){keys.push(i*n+i+d);keys.push((i+d)*n+i);}}const P=SP.pattern(n,keys),Ax=new Float64Array(P.nnz);
 for(let j=0;j<n;j++)for(let p=P.Ap[j];p<P.Ap[j+1];p++)Ax[p]=P.Ai[p]===j?10+((j*7)%5):-1+0.1*(((j+P.Ai[p])*13)%7);return {P,Ax};}
for(const n of [1000,5000,20000]){const {P,Ax}=chain(n),F=SP.lu(P,Ax,SP.order(P),0.1),b0=Float64Array.from({length:n},(_,i)=>Math.sin(i)),R=2e8/F.nnz|0,b=b0.slice(),w=new Float64Array(n);
 let t0=now();for(let r=0;r<R;r++){b.set(b0);SP.solve(F,b,w);}const js=(now()-t0)/R;
 top=1024;const a={Lp:put(F.Lp),Li:put(F.Li),Lx:put(F.Lx),Up:put(F.Up),Ui:put(F.Ui),Ux:put(F.Ux),pinv:put(F.pinv),q:put(F.q),b:alloc(Float64Array,n),w:alloc(Float64Array,n)};
 t0=now();for(let r=0;r<R;r++){a.b.set(b0);ex.solve(n,a.Lp.byteOffset,a.Li.byteOffset,a.Lx.byteOffset,a.Up.byteOffset,a.Ui.byteOffset,a.Ux.byteOffset,a.pinv.byteOffset,a.q.byteOffset,a.b.byteOffset,a.w.byteOffset);}
 const wa=(now()-t0)/R;res['solve'+n]={nnzLU:F.nnz,js_us:+js.toFixed(2),wasm_us:+wa.toFixed(2),ratio:+(js/wa).toFixed(2),same:b.every((v,i)=>Object.is(v,a.b[i]))};}
for(const [N,M] of [[20,3],[30,6],[40,12]]){const MM=M*M,rnd=n=>Float64Array.from({length:n},(_,i)=>Math.sin(1.7*i+0.3)),c=rnd(6*N),Wt=rnd(N),Rr=rnd(N*MM),Ri=rnd(N*MM),Xr=rnd(N*M),Xi=rnd(N*M),vp=rnd(M);
 const jsf=hy=>{for(let k=0;k<N;k++){const j=6*k,Er=c[j],Ei=c[j+1],a1r=c[j+4],a1i=c[j+5],w=Wt[k],kb=k*MM;let x=k*M;for(let q=0;q<M;q++,x++){const xr=Xr[x],xi=Xi[x],vq=vp[q],yr=Er*xr-Ei*xi+a1r*vq,yi=Er*xi+Ei*xr+a1i*vq;for(let r=0,ix=kb+q;r<M;r++,ix+=M)hy[r]+=w*(Rr[ix]*yr-Ri[ix]*yi);}}};
 const R=3e8/(N*MM*6)|0,hy=new Float64Array(M);let t0=now();for(let r=0;r<R;r++){hy.fill(0);jsf(hy);}const js=(now()-t0)/R;
 top=1024;const a={c:put(c),W:put(Wt),Rr:put(Rr),Ri:put(Ri),Xr:put(Xr),Xi:put(Xi),vp:put(vp),hy:alloc(Float64Array,M)};
 t0=now();for(let r=0;r<R;r++){a.hy.fill(0);ex.wb(N,M,a.c.byteOffset,a.W.byteOffset,a.Rr.byteOffset,a.Ri.byteOffset,a.Xr.byteOffset,a.Xi.byteOffset,a.vp.byteOffset,a.hy.byteOffset);}
 const wa=(now()-t0)/R;res['wb'+N+'x'+M]={js_us:+js.toFixed(3),wasm_us:+wa.toFixed(3),ratio:+(js/wa).toFixed(2),same:hy.every((v,i)=>Object.is(v,a.hy[i]))};}
console.log(JSON.stringify(res));
