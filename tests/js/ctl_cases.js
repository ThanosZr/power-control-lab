// 4.17.4 (ROADMAP §64, §62): the window «Ρύθμιση ελεγκτή» headless (tune.js analyze, the convergence method in the PWM)
// and the feed-forward without drift of the AI controller («fel2»), for test_ctlwin.py.
// Usage: node ctl_cases.js '[{kind, …}, …]' -> JSON [result, …]
//  {kind:'analyze', id, opts, patch, gains, opt}  G(s), poles, zeros, D₀, margins, the gains from the circuit, the closed
//                                                    loop on the averaged model (every 4th sample), M(D)
//  {kind:'run', id, opts, patch, T, key}           the per-period mean of key over a run (every period) and the warnings
//  {kind:'scipy', id, opts, patch, T, hDiv, keys}  a short run and its SciPy export
//  {kind:'aic', scheme, T, ka}                       ai_block for T s: the norm of the weights and the RMS tracking error
//                                                    per cycle of the reference (1.6 s)
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');global.Expr=require(W+'/expr.js');global.MNA=require(W+'/mna.js');require(W+'/tutorials.js');
const T=global.Tutorials,TU=require(W+'/tune.js');
const build=o=>{const t=T.get(o.id),pr=t.build({...Object.fromEntries((t.options||[]).map(q=>[q.k,q.def])),...(o.opts||{})});
 for(const [id,ps] of Object.entries(o.patch||{})){const c=pr.components.find(q=>q.id===id);if(!c)throw new Error('no '+id);c.params={...c.params,...ps};}return pr;};
const perAvg=(s,key)=>{const p=s.per,i=s.chIndex.get(key);if(i===undefined)return NaN;const j=(p.head-1+p.cap)%p.cap;return p.avg[j*p.nch+i];};
function analyze(o){const pr=build(o),s=new MNA.Sim(pr,{hDiv:20}),k=s.net.ctrls[0];const r=TU.analyze(k.tuneArgs,o.gains||null,o.opt||{});if(!r.ok)return r;
 const info=MNA.tuneInfo(pr,'PWM1',o.gains||null,o.opt||{});
 const op=TU.prep(k.tuneArgs);
 return {ok:true,key:r.key,tf:r.tf,poles:r.poles,zeros:r.zeros,D0:r.D0,G0:r.G0,margins:r.margins,auto:r.auto,gains:r.gains,M:r.M,values:r.values,ref:r.ref,
  A:op.op.A,bd:op.bd,c:op.c,x0:op.x0,cl:{t:r.cl.t.filter((_,i)=>i%4===0),y:r.cl.y.filter((_,i)=>i%4===0),r0:r.cl.r0,r1:r.cl.r1,tStep:r.cl.tStep,d:r.cl.d.filter((_,i)=>i%4===0)},
  same:JSON.stringify(info.tf)===JSON.stringify(r.tf)&&info.margins.pm===r.margins.pm,warn:s.net.warnings,ctl:{ff:k.ff,convKey:k.convKey,convVin:k.convVin,kc:k.kc,convN:k.convN}};}
function run(o){const pr=build(o),s=new MNA.Sim(pr,{hDiv:o.hDiv||20}),out=[];while(s.t<o.T-1e-12){s.run(Math.min(s.T,o.T-s.t));out.push([s.t,perAvg(s,o.key),perAvg(s,'D:PWM1')]);}
 return {out,warn:s.net.warnings,ctl:{ff:s.net.ctrls[0].ff,convKey:s.net.ctrls[0].convKey}};}
function scipy(o){const pr=build(o),s=new MNA.Sim(pr,{hDiv:o.hDiv||20,method:'TR'}),Te=o.T||0.004,rec=[];
 while(s.t<Te-1e-12){s.run(Math.min(s.T,Te-s.t));rec.push([s.t,...o.keys.map(q=>s.now(q))]);}
 return {rec,keys:o.keys,batch:MNA.exportForBatch(pr,o.keys),warn:s.net.warnings};}
function aic(o){const t=T.get('ai_block');const pr=t.build({scheme:'fel',mode:'ref',load:'fan'});const c=pr.components.find(q=>q.type==='AIC');c.params={...c.params,scheme:o.scheme,...(o.ka?{ka:o.ka}:{})};
 const s=new MNA.Sim(pr,{hDiv:pr.sim.hDiv}),nn=s.net.sig.blocks.find(b=>b.type==='NN'&&/NN1$/.test(b.id));
 const norm=()=>{const st=nn.st.net;let q=0;for(const Wm of st.W)for(const r of Wm)for(const v of r)q+=v*v;for(const b of st.b||[])for(const v of b)q+=v*v;return Math.sqrt(q);};
 const per=1.6,cyc=[];for(let k=1;k*per<=o.T+1e-9;k++){let se=0,m=0;while(s.t<k*per-1e-9){s.run(Math.min(0.01,k*per-s.t));const e=s.now('Y:C1/E');se+=e*e;m++;}cyc.push({t:s.t,w:norm(),rms:Math.sqrt(se/m)});}
 return {cyc,warn:s.net.warnings};}
const F={analyze,run,scipy,aic};
const q=JSON.parse(process.argv[2]||'[]');process.stdout.write(JSON.stringify(q.map(o=>F[o.kind](o))));
