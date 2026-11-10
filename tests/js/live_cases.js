// Live parameters (3.19, ROADMAP §4): a live change and the same change written as a program (project.program) give the
// same run bit for bit; a ramp; a duty change right after the turn-off edge does not switch twice in that period; a
// program entry for a part that is not there is a message, not a stop.
// Usage: node live_cases.js -> JSON
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');require(W+'/subcircuit.js');require(W+'/bus.js');require(W+'/units.js');const MNA=require(W+'/mna.js');
const clone=o=>JSON.parse(JSON.stringify(o));
function project(comps,conns){let n=0;return {version:3,components:comps.map(c=>({x:0,y:0,rot:0,...c})),wires:conns.map(([a,b])=>{const [ac,ap]=a.split(':'),[bc,bp]=b.split(':');return {id:'w'+(n++),a:{c:ac,p:ap},b:{c:bc,p:bp},pts:[]};})};}
const buck=project([{id:'V1',type:'VDC',params:{V:24}},{id:'S1',type:'SW',params:{pwm:'PWM1',body:false}},{id:'D1',type:'D'},{id:'L1',type:'L',params:{L:100e-6}},
  {id:'C1',type:'C',params:{C:100e-6}},{id:'R1',type:'R',params:{R:10}},{id:'G',type:'GND'},{id:'PWM1',type:'PWM',params:{fs:20e3,D:.5,carrier:'saw'}},
  {id:'K1',type:'CONST',params:{v:2}},{id:'GN',type:'GAIN',params:{K:3}},{id:'LP',type:'F2',params:{f0:500,zeta:.5}}],
  [['V1:p','S1:d'],['S1:s','D1:k'],['D1:a','G:g'],['S1:s','L1:a'],['L1:b','C1:p'],['C1:p','R1:a'],['R1:b','G:g'],['C1:n','G:g'],['V1:n','G:g'],['K1:y','GN:u'],['GN:y','LP:u']]);
const ring=(s,key)=>{const r=s.ring,i=s.chIndex.get(key),t=[],y=[];const st=(r.head-r.n+r.cap)%r.cap;for(let q=0;q<r.n;q++){const j=(st+q)%r.cap;t.push(r.t[j]);y.push(r.d[j*r.nch+i]);}return {t,y};};
const R={};
// a live session: run, change R (a reload with the states kept, as the app does) and the gain K (a block), run on
{const s=new MNA.Sim(clone(buck),{hDiv:200});s.run(.0031);const t1=s.t;let p=clone(s.project);p.components.find(c=>c.id==='R1').params.R=5;s.load(p,false);
 s.run(.0047-s.t);const t2=s.t;p=clone(s.project);p.components.find(c=>c.id==='GN').params.K=-1;s.load(p,false);s.run(.008-s.t);
 const pr=clone(buck);pr.program=[{t:t1,id:'R1',k:'R',v:5},{t:t2,id:'GN',k:'K',v:-1}];const q=new MNA.Sim(pr,{hDiv:200});q.run(.008);
 const keys=['I:L1','V:C1','Y:LP'],a=keys.map(k=>ring(s,k)),b=keys.map(k=>ring(q,k));
 R.replay={same:JSON.stringify(a)===JSON.stringify(b),steps:[s.steps,q.steps],end:[s.now('V:C1'),q.now('V:C1')],changes:q.changes.map(c=>[c.t,c.id,c.k,c.v]),t:[t1,t2]};}
// a ramp: R from 10 to 5 Ω at 1000 Ω/s, in at most 200 steps; halfway (2.5 ms after) R = 7.5 Ω
{const pr=clone(buck);pr.program=[{t:.002,id:'R1',k:'R',v:5,rate:1000}];const s=new MNA.Sim(pr,{hDiv:200});const Rnow=()=>+s.project.components.find(c=>c.id==='R1').params.R;
 s.run(.002+.0025+1e-9);const mid=Rnow();s.run(.003);R.ramp={mid,end:Rnow(),entries:s.prog.length,marks:s.changes.length};}
// a duty change right after the turn-off edge: the duty of the period is latched at its start, so no second turn-on
{const s=new MNA.Sim(clone(buck),{hDiv:400});const T=1/20e3;s.run(5*T+.5*T+T/100);s.setControl('PWM1',{D:.8});s.run(7*T-s.t);
 const g=ring(s,'GS:S1'),edges=w=>{let n=0,prev=null;for(let i=0;i<g.t.length;i++){if(g.t[i]<w[0]-1e-12||g.t[i]>w[1]+1e-12)continue;if(prev!==null&&g.y[i]!==prev)n++;prev=g.y[i];}return n;};
 const on=w=>{let a=0;for(let i=1;i<g.t.length;i++)if(g.t[i]>w[0]&&g.t[i]<=w[1]&&g.y[i-1]>=.5)a+=g.t[i]-g.t[i-1];return a/(w[1]-w[0]);};
 R.duty={edgesThis:edges([5*T+.5*T+T/50,6*T-T/1000]),dutyNext:on([6*T,7*T])};}
// a program entry for a part that is not there: a message in the console, the run goes on
{const pr=clone(buck);pr.program=[{t:.001,id:'NOPE',k:'R',v:1}];const s=new MNA.Sim(pr,{hDiv:200});s.run(.002);R.missing={t:s.t,msgs:[...s.dg.values()].filter(d=>d.grp==='live').map(d=>d.msg)};}
process.stdout.write(JSON.stringify(R));
