// The neural network block (4.7): web/studio/nn.js and the block NN in web/studio/mna.js. Prints JSON for tests/test_nn.py.
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');require(W+'/subcircuit.js');require(W+'/bus.js');require(W+'/units.js');
const MNA=require(W+'/mna.js');const N=require(W+'/nn.js');
const C=(id,type,params,ex={})=>({id,type,x:0,y:0,rot:0,flip:false,label:id,params,...ex});
function project(comps,conns){let n=0;return {version:3,components:comps,wires:conns.map(([a,b])=>{const [ac,ap]=a.split(':'),[bc,bp]=b.split(':');return {id:'w'+(n++),a:{c:ac,p:ap},b:{c:bc,p:bp},pts:[]};})};}
const out={};
// 1. the generator, the forward pass and one learning step, for Python to repeat
{const nets=[[2,3,1,5,false],[3,8,4,1,11,true],[1,1,2,false]].map(([...a])=>{const zero=a.pop(),seed=a.pop();return {sizes:a,seed,zero,net:N.init(a,seed,zero)};});
 const x=[0.3,-0.7,0.25];const r=N.rng(9);
 out.init=nets.map(q=>({sizes:q.sizes,seed:q.seed,zero:q.zero,net:q.net}));
 out.fwd=nets.map(q=>N.fwd(q.net,x.slice(0,q.sizes[0])));
 // learning steps with SGD and Adam from random weights (the same start in Python)
 out.learn=['sgd','adam'].map(opt=>{const net=N.init([2,4,1],3,false),st=N.optState(net,opt),xs=[];for(let k=0;k<20;k++){const x=[2*r()-1,2*r()-1],g=2*r()-1;xs.push([x,g]);N.learn(net,st,N.fwd(net,x),g,{lr:.05,clip:.5,l2:.01,opt});}return {opt,steps:xs,net};});
 out.text=N.parse(N.text(nets[1].net),[3]).net.W[1][2][3]===+nets[1].net.W[1][2][3].toPrecision(9);}
// 2. a network learning a target online: y = x² − 0.3 with x = sin(2π·5t), 1 kHz
const learnPr=(params={},extra=[],conns=[])=>project([C('CLK1','CLK',{f:1000}),C('X','EXPR',{expr:'sin(2*pi*5*t)',ins:''}),C('T','EXPR',{expr:'u1*u1-0.3',ins:'u1'}),
 C('NN1','NN',{ins:'x',hidden:'8',train:'tgt',lr:.01,clock:'CLK1',ymin:-5,ymax:5,seed:3,...params}),C('V1','VDC',{V:1}),C('R1','R',{R:1}),C('G1','GND',{}),...extra],
 [['X:y','T:u1'],['X:y','NN1:x'],['T:y','NN1:tgt'],['V1:p','R1:a'],['R1:b','G1:g'],['V1:n','G1:g'],...conns]);
const blk=(s,id='NN1')=>s.net.sig.blocks.find(b=>b.id===id);
{const s=new MNA.Sim(learnPr(),{hDiv:10});out.warnings=s.net.warnings;const L=[];for(let k=0;k<8;k++){s.run(.25);L.push(blk(s).st.L);}out.curve=L;out.updates=blk(s).st.opt.k;
 // the snapshot carries the weights and Adam's moments: a restored solver continues identically
 const s2=new MNA.Sim(learnPr(),{hDiv:10});s2.restoreSnapshot(s.snapshot());s.run(.1);s2.run(.1);out.snap=[s.now('Y:NN1'),s2.now('Y:NN1'),blk(s).st.opt.k,blk(s2).st.opt.k];
 // a live change that is not the weights (the learning rate) keeps what it learned; a new text of the weights replaces it
 const w0=JSON.stringify(blk(s).st.net);const pr=learnPr({lr:.002});s.load(pr,false);out.keep=JSON.stringify(blk(s).st.net)===w0&&blk(s).lr===.002;
 const wt=N.text(N.init([1,8,1],4,false));s.load(learnPr({lr:.002,w:wt}),false);out.replace=Math.abs(blk(s).st.net.W[0][0][0]-JSON.parse(wt).W[0][0][0])<1e-12&&blk(s).st.opt.k===0;}
// 3. freezing: the input fz from 1 s on, and the parameter learn = false
{const s=new MNA.Sim(learnPr({},[C('FZ','CONST',{v:'0:0, 1:1'})],[['FZ:y','NN1:fz']]),{hDiv:10});s.run(.999);const k1=blk(s).st.opt.k;s.run(1);out.freeze=[k1,blk(s).st.opt.k];
 const s2=new MNA.Sim(learnPr({learn:false}),{hDiv:10});s2.run(.5);out.nolearn=blk(s2).st.opt.k;}
// 4. weights that do not fit: a warning and random weights
{const s=new MNA.Sim(learnPr({w:'{"W":[[[1,2]]],"b":[[0]]}'}),{hDiv:10});out.misfit=s.net.warnings.filter(w=>w.includes('NN1'));
 const s2=new MNA.Sim(learnPr({w:'oops'}),{hDiv:10});out.badjson=s2.net.warnings.filter(w=>w.includes('NN1'));}
// 5. fixed weights: the output is the network's, scaled and limited
{const net={sizes:[1,1],W:[[[2]]],b:[[.5]]};const s=new MNA.Sim(learnPr({train:'off',w:N.text(net),ys:2,ymin:-1,ymax:3}),{hDiv:10});s.run(.0525);const x=Math.sin(2*Math.PI*5*.052);out.fixed=[s.now('Y:NN1'),Math.min(3,Math.max(-1,2*(2*x+.5)))];}
// 6. the tutorials (4.7): IAE per cycle of the reference for each controller
require(W+'/tutorials.js');const T=globalThis.Tutorials;
const build=(id,o={})=>{const t=T.get(id);const oo={};for(const op of t.options)oo[op.k]=o[op.k]??op.def;return t.build(oo);};
const cycles=pr=>{const s=new MNA.Sim(pr,{hDiv:pr.sim.hDiv});const per=[];let i0=0;for(let r=0;r<pr.meta.cycles;r++){s.run(pr.meta.P);const v=s.now('Y:IAE');per.push(v-i0);i0=v;}
 return {per,warnings:s.net.warnings,L:s.chIndex.has('Y:NN1:L')?s.now('Y:NN1:L'):null,k:s.net.sig.blocks.find(b=>b.id==='NN1')?.st.opt?.k??null};};
out.tut={};for(const [k,id,o] of [['pi','nn_compare',{ctrl:'pi'}],['pinn','nn_compare',{ctrl:'pinn'}],['inv','nn_compare',{ctrl:'inv'}],['inv_step','nn_compare',{ctrl:'inv',load:'step'}],['pi_step','nn_compare',{ctrl:'pi',load:'step'}],
 ['fast','nn_online',{}],['frozen','nn_online',{freeze:'f2'}],['ref','nn_online',{event:'ref'}]])out.tut[k]=cycles(build(id,o));
console.log(JSON.stringify(out));
