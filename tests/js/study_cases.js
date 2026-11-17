// 4.19.1 (ROADMAP §68 point 6): the two study tutorials (pf_study, opf_study) headless. For each: its options, the study that its
// project asks from the engine (meta.study) with the defaults and with every network of its list, the operating point from which its
// EMT starts (meta.lf), and a run of 0.3 s: the mean and the fundamental (peak, last 4 cycles of 60 Hz) of the generator powers and
// of the instruments on the drawing. Usage: node study_cases.js -> JSON {pf, opf, opfEmt, cpf}
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');global.Expr=require(W+'/expr.js');global.StepCheck=require(W+'/stepcheck.js');
global.LineModels=require(W+'/linemodels.js');
for(const f of ['netlib','subcircuit','bus','units','nn'])require(W+'/'+f+'.js');
global.MNA=require(W+'/mna.js');require(W+'/tutorials.js');
const KEYS=['Y:G1:pe','Y:G2:pe','Y:G3:pe','Y:G1:qe','Y:G2:qe','Y:G3:qe','Y:M87A','Y:M87V','Y:M5A','Y:M5V'];
const defaults=t=>Object.fromEntries(t.options.map(o=>[o.k,o.def]));
function run(id,over,T){const t=Tutorials.get(id),opts={...defaults(t),...over},pr=t.build(opts),sv=pr.sim||{},s=new MNA.Sim(pr,{hDiv:sv.hDiv||10,method:sv.method||'TR'}),f=60,nc=4,w=2*Math.PI*f,buf=[];
 while(s.t<T-1e-12){s.run(s.h);buf.push([s.t,...KEYS.map(k=>s.now(k))]);if(buf[0][0]<s.t-nc/f-1e-3)buf.shift();}
 const w0=buf.filter(q=>q[0]>=s.t-nc/f-1e-12),Tw=w0[w0.length-1][0]-w0[0][0],out={};
 KEYS.forEach((k,j)=>{let a=0,b=0,m=0;for(let i=1;i<w0.length;i++){const dt=w0[i][0]-w0[i-1][0],y0=w0[i-1][j+1],y1=w0[i][j+1];
   a+=dt*(y0*Math.cos(w*w0[i-1][0])+y1*Math.cos(w*w0[i][0]))/2;b+=dt*(y0*Math.sin(w*w0[i-1][0])+y1*Math.sin(w*w0[i][0]))/2;m+=dt*(y0+y1)/2;}
  out[k]={amp:2*Math.hypot(a,b)/Tw,mean:m/Tw};});
 return {out,t:s.t,warn:s.net.warnings,meta:pr.meta,opts,panes:pr.scope.panes.map(p=>p.map(q=>q[0])),keys:KEYS.filter(k=>s.keys.includes(k))};}
function card(id){const t=Tutorials.get(id);
 return {group:t.group,options:t.options.map(o=>({k:o.k,def:o.def,values:o.options.map(q=>q[0])})),
  studies:t.options.find(o=>o.k==='net').options.map(q=>t.build({...defaults(t),net:q[0]}).meta.study)};}
// 4.19.5: the tutorial of the continuation load flow (cpf_study): its options, the request of every network of its list and of every
// option, and the text of its tasks (the numbers in it are checked against the engine)
const cpf=(()=>{const t=Tutorials.get('cpf_study'),d=defaults(t);return {...card('cpf_study'),tasks:t.tasks,title:t.title,
  variants:[['yes','all'],['no','all'],['yes','load'],['no','load']].map(([qlim,grow])=>t.build({...d,qlim,grow}).meta.study),drawing:t.build(d).components.length===Tutorials.get('pf_study').build(defaults(Tutorials.get('pf_study'))).components.length};})();
console.log(JSON.stringify({pf:{...card('pf_study'),...run('pf_study',{},0.3)},opf:{...card('opf_study'),...run('opf_study',{},0.05)},opfEmt:run('opf_study',{emt:'opf'},0.3),cpf}));
