'use strict';
// A small neural network for the block «Νευρωνικό δίκτυο (MLP)» (4.7, ROADMAP «Τι προτείνω» 4.7.2): forward pass from
// weights, and learning inside the simulation, one update per sample of the block's clock. The same arithmetic as
// engine/batch.py (class NNet there) so that the browser and SciPy solvers agree, and the same weight format as
// pcl.control (MLP_SRC, 3.16): {"sizes":[n_in, h1, …, 1], "W":[rows out × in per layer], "b":[per layer]},
// tanh in the hidden layers, linear output.
//  - init(sizes, seed, zeroOut): weights N(0, 1/n_in) from a 32-bit generator (mulberry32 + Box–Muller), the same numbers
//    in Python; zeroOut = last layer zero, so an untrained network starts at output 0 (for online learning).
//  - fwd(net, x): the activations of every layer (the last one is the output).
//  - learn(net, opt, acts, g, o): one step on the loss with dL/d(output) = g (for L = ½e², g = −e): back-propagation,
//    gradient clipped to ±o.clip, weight decay o.l2 (not on the biases), SGD or Adam (β₁ 0.9, β₂ 0.999, ε 1e-8).
//  - parse(text, sizes): weights from JSON (null if the text is empty or does not fit the sizes).
(function(root){
 function rng(seed){let a=(seed>>>0)||0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
 function gauss(r){const u1=1-r(),u2=r();return Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2);}
 function init(sizes,seed,zeroOut){const r=rng(seed),W=[],b=[];
  for(let i=0;i<sizes.length-1;i++){const last=i===sizes.length-2,sd=Math.sqrt(1/sizes[i]),L=[];
   for(let o=0;o<sizes[i+1];o++){const row=[];for(let j=0;j<sizes[i];j++){const z=gauss(r);row.push(zeroOut&&last?0:sd*z);}L.push(row);}
   W.push(L);b.push(new Array(sizes[i+1]).fill(0));}
  return {sizes:sizes.slice(),W,b};}
 function fwd(net,x){const acts=[Array.from(x)];let a=acts[0];const L=net.W.length;
  for(let i=0;i<L;i++){const W=net.W[i],bb=net.b[i],z=new Array(W.length);
   for(let o=0;o<W.length;o++){let s=bb[o];const row=W[o];for(let j=0;j<row.length;j++)s+=row[j]*a[j];z[o]=i<L-1?Math.tanh(s):s;}
   a=z;acts.push(a);}
  return acts;}
 // the number of parameters, in the order of the moment vectors of Adam: per layer the rows of W, then b
 function count(net){let n=0;for(let i=0;i<net.W.length;i++)n+=net.W[i].length*(net.W[i][0]?.length||0)+net.b[i].length;return n;}
 function learn(net,opt,acts,g,o){const L=net.W.length,clip=o.clip>0?o.clip:Infinity,l2=o.l2||0,adam=o.opt==='adam';
  // gradients, from the last layer back (the same order of sums as engine/batch.py)
  const gW=new Array(L),gb=new Array(L);let delta=[g];
  for(let i=L-1;i>=0;i--){const a=acts[i],W=net.W[i];gW[i]=delta.map(d=>a.map(v=>d*v));gb[i]=delta.slice();
   if(i>0){const da=new Array(a.length);for(let j=0;j<a.length;j++){let s=0;for(let q=0;q<delta.length;q++)s+=W[q][j]*delta[q];da[j]=s*(1-a[j]*a[j]);}delta=da;}}
  opt.k=(opt.k||0)+1;let p=0;const b1=.9,b2=.999,eps=1e-8,c1=1-Math.pow(b1,opt.k),c2=1-Math.pow(b2,opt.k);
  const step=(w,gr)=>{let gg=Math.max(-clip,Math.min(clip,gr));if(adam){const m=opt.m[p]=b1*opt.m[p]+(1-b1)*gg,v=opt.v[p]=b2*opt.v[p]+(1-b2)*gg*gg;p++;return w-o.lr*(m/c1)/(Math.sqrt(v/c2)+eps);}p++;return w-o.lr*gg;};
  for(let i=0;i<L;i++){const W=net.W[i];for(let q=0;q<W.length;q++){const row=W[q];for(let j=0;j<row.length;j++)row[j]=step(row[j],gW[i][q][j]+l2*row[j]);}
   const bb=net.b[i];for(let q=0;q<bb.length;q++)bb[q]=step(bb[q],gb[i][q]);}}
 function optState(net,kind){const n=count(net);return kind==='adam'?{k:0,m:new Array(n).fill(0),v:new Array(n).fill(0)}:{k:0};}
 // sizes from the inputs and the hidden layers ("8" or "16, 8"); at most 4 hidden layers of 64
 function sizesOf(nin,hidden){const h=String(hidden??'').split(/[,;\s]+/).map(Number).filter(v=>Number.isFinite(v)&&v>=1).slice(0,4).map(v=>Math.min(64,Math.round(v)));return [Math.max(1,nin),...h,1];}
 function parse(text,sizes){const s=String(text||'').trim();if(!s)return null;let o;try{o=JSON.parse(s);}catch(e){return {error:'τα βάρη δεν είναι έγκυρο JSON'};}
  const net=o&&o.net?o.net:o;if(!net||!Array.isArray(net.W)||!Array.isArray(net.b)||net.W.length!==net.b.length||!net.W.length)return {error:'τα βάρη θέλουν W και b (μορφή του pcl.control)'};
  const sz=[net.W[0][0]?.length||0,...net.W.map(L=>L.length)];
  for(let i=0;i<net.W.length;i++){if(net.b[i].length!==net.W[i].length||net.W[i].some(r=>!Array.isArray(r)||r.length!==sz[i]||r.some(v=>!Number.isFinite(+v))))return {error:'οι διαστάσεις των βαρών δεν ταιριάζουν μεταξύ τους'};}
  if(sz[sz.length-1]!==1)return {error:'το δίκτυο πρέπει να έχει μία έξοδο'};
  if(sizes&&sz[0]!==sizes[0])return {error:`το δίκτυο έχει ${sz[0]} εισόδους, το μπλοκ ${sizes[0]}`};
  return {net:{sizes:sz,W:net.W.map(L=>L.map(r=>r.map(Number))),b:net.b.map(r=>r.map(Number))}};}
 // the weights as the text of the block's parameter (rounded to 9 significant digits, enough for a float32-trained net)
 function text(net){const r=v=>+(+v).toPrecision(9);return JSON.stringify({sizes:net.sizes||[net.W[0][0].length,...net.W.map(L=>L.length)],W:net.W.map(L=>L.map(row=>row.map(r))),b:net.b.map(row=>row.map(r))});}
 const api={rng,gauss,init,fwd,learn,count,optState,sizesOf,parse,text};
 root.NNet=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
