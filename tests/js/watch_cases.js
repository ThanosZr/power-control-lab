// The tiles of the control signals over the drawing (4.8, ROADMAP §47, web/studio/watch.js): the layout as a tutorial or a
// file writes it, the step buttons, the saturation of a block output, the curve of a tile (columns of first/min/max/last),
// the slider, and a yes/no parameter changed live or by a program giving the same run (the switch «Μαθαίνει» of a network).
// Usage: node watch_cases.js -> JSON
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');require(W+'/subcircuit.js');require(W+'/bus.js');require(W+'/units.js');require(W+'/expr.js');require(W+'/nn.js');
const MNA=require(W+'/mna.js'),Watch=require(W+'/watch.js');
const clone=o=>JSON.parse(JSON.stringify(o));const R={};
// 1. the layout: arrays, a control as 'id.k', steps as a text, bad entries dropped, unique ids, show by default when tiles exist
R.norm=Watch.norm({tiles:[['Y:M1','ω',[10,20]],{ctl:'KW.v',label:'ω*',at:[0,0],al:'r',steps:'-20; +20; =100',rng:[0,200]},{ctl:'NN1.learn'},{key:'',label:'x'},{ctl:'bad'},
 {id:'w1',key:'Y:E1',at:[1,'x'],rng:[5,1],span:-1,al:'l'}],panel:{x:12,view:'table',min:1}});
R.normList=Watch.norm([['I:L1','i_L']]);R.normNone=Watch.norm(null);R.normEmpty=Watch.norm({tiles:[]});
// 2. the step buttons
R.steps=['+10 %','−10%','×1,5','*2','+5','−0.5','=100','=1k','abc','+'].map(s=>{const st=Watch.parseStep(s);return st?[st.op,+st.a.toPrecision(12),st.text,+Watch.applyStep(st,50).toPrecision(12)]:null;});
// 3. saturation of a block output (the limits of SAT, PIB, NN, …; a margin of 1e-6 of the span; an empty limit is none)
R.sat=[[{lo:-220,hi:220},220],[{lo:-220,hi:220},-220],[{lo:-220,hi:220},219.9],[{},1,{ymin:-1,ymax:1}],[{ymin:'',ymax:5},5],[{lo:0,hi:1},NaN],[{lo:-1,hi:1},1-1e-7]].map(([p,v,d])=>Watch.satOf(p,v,d));
// 4. the curve: 4 columns over [0, 1] from 9 samples, then the points in a box 40 × 10 (range padded by 8 %)
{const ts=[0,.1,.2,.3,.4,.6,.7,.8,1],vs=[0,2,1,3,-1,5,4,4,2];const env=Watch.envelope(f=>ts.forEach((t,i)=>f(t,vs[i])),0,1,4);
 R.env={c:env.c,lo:env.lo,hi:env.hi,pts:Watch.points(env,40,10),flat:Watch.points(Watch.envelope(f=>[0,.5,1].forEach(t=>f(t,3)),0,1,2),20,10),none:Watch.points(Watch.envelope(()=>{},0,1,3),20,10)};}
// 5. the slider: log a decade each way around a positive base, linear around 0 or a negative one, or a given range
{const m=[Watch.sliderMap(150),Watch.sliderMap(0),Watch.sliderMap(-4),Watch.sliderMap(150,[0,200])];
 R.slider=m.map(q=>({map:q,x:[Watch.toX(q,q.lo),Watch.toX(q,q.hi),Watch.toX(q,q.log?Math.sqrt(q.lo*q.hi):(q.lo+q.hi)/2)],back:+Watch.fromX(q,Watch.toX(q,q.log?150:q.lo+(q.hi-q.lo)*.3)).toPrecision(6)}));}
// 6. «Μαθαίνει» of a network switched off live (a load with the states, as the tile does) and the same as a program
//    entry: the same run, sample for sample
{const C=(id,type,params)=>({id,type,x:0,y:0,rot:0,params});
 const pr={version:3,components:[C('CLK1','CLK',{f:1000}),C('U','RAMP',{f:5}),C('T','EXPR',{expr:'0.7*u1+0.2*u1*u1',ins:'u1'}),
  C('N','NN',{ins:'u',xs:'1',hidden:'6',ys:1,ymin:-5,ymax:5,train:'tgt',opt:'sgd',lr:.05,clip:5,nl:50,init:'rand',seed:3,clock:'CLK1',trig:'start',y0:0,learn:true})],
  wires:[['U:y','T:u1'],['U:y','N:u'],['T:y','N:tgt']].map(([a,b],i)=>{const [ac,ap]=a.split(':'),[bc,bp]=b.split(':');return {id:'w'+i,a:{c:ac,p:ap},b:{c:bc,p:bp},pts:[]};})};
 const ring=(s,key)=>{const r=s.ring,i=s.chIndex.get(key),y=[];const st=(r.head-r.n+r.cap)%r.cap;for(let q=0;q<r.n;q++)y.push(r.d[((st+q)%r.cap)*r.nch+i]);return y;};
 try{const s=new MNA.Sim(clone(pr),{hDiv:20,T:1e-3});s.run(.3);const t1=s.t;const p=clone(s.project);p.components.find(c=>c.id==='N').params.learn=false;s.load(p,false);s.run(.6-s.t);
  const q0=clone(pr);q0.program=[{t:t1,id:'N',k:'learn',v:false}];const q=new MNA.Sim(q0,{hDiv:20,T:1e-3});q.run(.6);
  const a=ring(s,'Y:N'),b=ring(q,'Y:N'),La=ring(s,'Y:N:L');
  // the same circuit learning all the time: the same before the switch, different after it
  const o=new MNA.Sim(clone(pr),{hDiv:20,T:1e-3});o.run(.6);const c=ring(o,'Y:N'),tt=(()=>{const r=s.ring,st=(r.head-r.n+r.cap)%r.cap,t=[];for(let k=0;k<r.n;k++)t.push(r.t[(st+k)%r.cap]);return t;})();
  const k1=tt.findIndex(t=>t>t1+2e-3);
  R.learn={same:JSON.stringify(a)===JSON.stringify(b),n:a.length,t1,learnEnd:q.project.components.find(c=>c.id==='N').params.learn,
   // frozen: the loss stops changing between samples after the switch (the weights stay)
   sameBefore:JSON.stringify(c.slice(0,k1-40))===JSON.stringify(a.slice(0,k1-40)),diffAfter:Math.max(...a.slice(k1).map((v,i)=>Math.abs(v-c[k1+i]))),
   Lmid:La[Math.floor(La.length*.45)],changes:q.changes.map(c=>[c.id,c.k,c.v])};}
 catch(e){R.learn={error:String(e.stack||e)};}}
console.log(JSON.stringify(R));
