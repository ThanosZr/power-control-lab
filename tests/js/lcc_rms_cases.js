// 5.1.5 (ROADMAP §101 step 2, THEORY §8ΩΩ): the tutorial hvdc_lcc in EMT, for the RMS of its link (pcl.rms.LCC), headless.
// Usage: node lcc_rms_cases.js '[{opts, set, t1, t0, win, hDiv}, …]' -> JSON [result, …]
//  the means over consecutive windows of `win` s from t0 to t1 of the DC quantities of the two stations and their controls,
//  and of the three-phase powers of the two sources (P, Q given by each source: p = Σ v·i, q = Σ (v_b − v_c)·i_a/√3 …)
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');global.Expr=require(W+'/expr.js');global.StepCheck=require(W+'/stepcheck.js');
global.LineModels=require(W+'/linemodels.js');
for(const f of ['netlib','subcircuit','bus','units','nn'])require(W+'/'+f+'.js');
global.MNA=require(W+'/mna.js');require(W+'/tutorials.js');
const KEYS={vdr:'Y:CR/KV',vdi:'Y:CI/KV',ir:'Y:STR/IDC',ii:'Y:STI/IDC',vm:'V:CM',aor:'Y:CR/AO',aoi:'Y:CI/AO',gm:'Y:STI/GM',ord:'Y:CI/ORD',cc:'Y:CI/CC',cf:'Y:STI/CF'};
function run(o){const t=Tutorials.get('hvdc_lcc'),pr=t.build(o.opts||{});
 for(const [id,ps] of Object.entries(o.set||{}))Object.assign(pr.components.find(c=>c.id===id).params,ps);
 const s=new MNA.Sim(pr,{hDiv:o.hDiv||pr.sim.hDiv,method:'TR'}),win=o.win||0.005,t0=o.t0||0,t1=o.t1||1.5,out={t:[]},T0=Date.now();
 const names=Object.keys(KEYS);for(const k of [...names,'Psr','Qsr','Psi','Qsi'])out[k]=[];
 while(s.t<t0-1e-12)s.run(Math.min(s.h,t0-s.t));
 let next=t0+win;
 while(next<=t1+1e-12){const acc={},n={c:0};for(const k of [...names,'Psr','Qsr','Psi','Qsi'])acc[k]=0;
  while(s.t<next-1e-12){s.run(Math.min(s.h,next-s.t));n.c++;
   for(const k of names)acc[k]+=s.now(KEYS[k]);
   for(const [src,P,Q] of [['SR','Psr','Qsr'],['SI','Psi','Qsi']]){const va=s.now('V:'+src),vb=s.now('Vb:'+src),vc=s.now('Vc:'+src),ia=s.now('I:'+src),ib=s.now('Ib:'+src),ic=s.now('Ic:'+src);
    acc[P]+=va*ia+vb*ib+vc*ic;acc[Q]+=((vb-vc)*ia+(vc-va)*ib+(va-vb)*ic)/Math.sqrt(3);}}
  out.t.push(next);for(const k in acc)out[k].push(acc[k]/n.c);next+=win;}
 return {...out,ms:Date.now()-T0,h:s.h,warn:s.net.warnings};}
const cases=JSON.parse(process.argv[2]||'[]');const res=[];
for(const o of cases){try{res.push(run(o));}catch(e){res.push({error:String(e&&e.stack||e)});}}
process.stdout.write(JSON.stringify(res));
