// 4.18.1: the weights of the multi-objective controller of the vehicle (EVC, scheme moevc2): each case a run of the urban
// cycle with the tutorial ev_drive, the IAE of the speed against the cycle, Wh/km, the mean and the largest keep.
// Usage: node ev_weights_cases.js '[{opts, set, soc, T}, …]' -> JSON [result, …]
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');global.Expr=require(W+'/expr.js');global.StepCheck=require(W+'/stepcheck.js');
global.LineModels=require(W+'/linemodels.js');for(const f of ['netlib','subcircuit','bus','units','nn'])require(W+'/'+f+'.js');
const MNA=require(W+'/mna.js');require(W+'/tutorials.js');
function run(o){const t=Tutorials.get('ev_drive'),opts={};for(const q of t.options)opts[q.k]=q.def;Object.assign(opts,o.opts||{});
 const pr=t.build(opts),mo=pr.components.find(c=>c.id==='MO1');if(mo)Object.assign(mo.params,o.set||{});
 if(o.soc!=null)for(const c of pr.components)if(c.type==='INT'&&Math.abs(+c.params.y0-pr.meta.soc0)<1e-9)c.params.y0=o.soc;
 const s=new MNA.Sim(pr,{hDiv:pr.sim.hDiv,method:'TR'}),T=o.T||60;let iae=0,ks=0,kmax=0,n=0;
 while(s.t<T-1e-12){const t0=s.t;s.run(s.h);const dt=s.t-t0;iae+=Math.abs(s.now('Y:REF')-s.now('Y:M1'))*dt;if(mo){const k=s.now('Y:MO1/KP');ks+=k;kmax=Math.max(kmax,k);}n++;}
 return {scheme:mo?mo.params.scheme:null,iae,whk:s.now('Y:WHK'),keep:ks/Math.max(n,1),keepMax:kmax,warn:s.net.warnings};}
const cs=JSON.parse(process.argv[2]||'[]'),res=[];for(const o of cs){try{res.push(run(o));}catch(e){res.push({error:String(e&&e.stack||e)});}}
process.stdout.write(JSON.stringify(res));
