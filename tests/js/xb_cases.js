// The cross-bonding tutorial of 4.13 (cable_xb) as the studio builds it: per case the RMS (load) or the peak (energize,
// step) of its scope channels over the last period or the whole run, the step, the warnings and the run time.
// Usage: node xb_cases.js '[{...options}, …]' -> JSON [{ov, rms|peak:{channel: value}, h, t, warn, ms}]; with
// trace: [channels] in a case, also {trace: {t: [...], channel: [...]}} every `every` steps (default 1)
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');global.LineModels=require(W+'/linemodels.js');
const MNA=require(W+'/mna.js');require(W+'/tutorials.js');const T=globalThis.Tutorials.get('cable_xb');
function build(ov){const o={};for(const op of T.options)o[op.k]=op.def;return T.build(Object.assign(o,ov));}
function run(ov){const t0=Date.now(),pr=build(ov),s=new MNA.Sim(pr,{hDiv:pr.sim.hDiv,method:pr.sim.method||'TR'}),m=pr.meta.xb;
 const ch=[...new Set([].concat(...pr.scope.panes).map(c=>c[0]).concat(ov.extra||[],ov.trace||[]))],stop=ov.stop||pr.sim.stopT,load=m.ev==='load';
 const acc={},first={},pk={};for(const c of ch){acc[c]=0;pk[c]=0;}let n=0;
 for(const c of ch)first[c]=s.now(c);
 const tr=ov.trace?{t:[],...Object.fromEntries(ov.trace.map(c=>[c,[]]))}:null;let k=0;
 while(s.t<stop-1e-12){s.run(Math.min(s.h,stop-s.t));const last=s.t>stop-0.02-1e-12;
  if(tr&&(k++%(ov.every||1)===0)){tr.t.push(s.t);for(const c of ov.trace)tr[c].push(s.now(c));}
  for(const c of ch){const y=s.now(c);if(!(Math.abs(y)<=pk[c]))pk[c]=Math.abs(y);if(load&&last)acc[c]+=y*y;}if(load&&last)n++;}
 const out={ov,h:s.h,t:s.t,warn:s.net.warnings,ms:Date.now()-t0,peak:pk,first,...(tr?{trace:tr}:{})};
 if(load)out.rms=Object.fromEntries(ch.map(c=>[c,Math.sqrt(acc[c]/Math.max(1,n))]));return out;}
const cases=JSON.parse(process.argv[2]||'[{}]');console.log(JSON.stringify(cases.map(run)));
