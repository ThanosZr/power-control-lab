// The electric vehicle (4.8, ROADMAP §46, tutorial ev_drive) and the multi-objective controller (library part EVC, the
// cascades «moev» and «moevc» of the Control Workbench EV/DC): every option builds without warnings, a run of two minutes
// with the repeating driving cycle (stops at the end of each cycle, the distance doubles, the memory stays fixed), the
// coupled scheme follows better than the plain cascade, the energy metrics agree with the SOC, the presets of the modes,
// the expressions with fixed names folded once (the same numbers), and a period of N clock periods.
// Usage: node ev_cases.js -> JSON
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');for(const f of ['netlib','subcircuit','bus','units','expr','nn'])require(W+'/'+f+'.js');
const MNA=require(W+'/mna.js'),Ex=require(W+'/expr.js');require(W+'/tutorials.js');const T=globalThis.Tutorials,NL=globalThis.NetLib;
const out={};
// 1. every option builds, without warnings; the run has no end and keeps a point per ms
{const t=T.get('ev_drive');out.build=[];for(const ctrl of ['moevc','moev','ai','pi'])for(const cycle of ['urban','grade','sport']){const pr=t.build({ctrl,cycle,mode:'balanced'});
 const s=new MNA.Sim(pr,{hDiv:pr.sim.hDiv});s.run(.05);out.build.push({ctrl,cycle,warn:s.net.warnings,stopT:pr.sim.stopT,rec:pr.sim.rec,ok:Number.isFinite(s.now('Y:M1'))});}}
// 2. two minutes of the urban cycle with the coupled scheme, one with the plain cascade
const run=(o,dur)=>{const pr=T.get('ev_drive').build({mode:'balanced',cycle:'urban',...o});const s=new MNA.Sim(pr,{hDiv:pr.sim.hDiv,recDt:pr.sim.rec.dt});
 let se=0,n=0,mn=0;const at={};for(let k=1;k<=dur*10;k++){const tt=k/10;s.run(tt-s.t);const w=s.now('Y:M1'),r=s.now('Y:REF');se+=(r-w)**2;n++;mn=Math.min(mn,w);
  if([59.5,60,119.5,120].some(q=>Math.abs(q-tt)<1e-9))at[tt]={x:s.now('Y:X'),kph:s.now('Y:KPH'),soc:s.now('Y:SOC'),en:s.now('Y:EN'),kwh:s.now('Y:KWH'),whk:s.now('Y:WHK'),nmk:s.now('Y:NMK'),irms:s.now('Y:IRMS'),dsoc:s.now('Y:DSOC'),keep:s.now('Y:MO1/KP')};}
 const r=s.ring,t0=r.t[(r.head-r.n+r.cap)%r.cap],t1=r.t[(r.head-1+r.cap)%r.cap];
 return {rms:Math.sqrt(se/n),minW:mn,at,soc0:pr.meta.soc0,Q:18,ring:{n:r.n,cap:r.cap,span:t1-t0,dt:(t1-t0)/(r.n-1)},warn:s.net.warnings};};
out.moevc=run({ctrl:'moevc'},120);out.moev=run({ctrl:'moev'},60);
// 3. the presets of the modes (as in the workbench): the limits and the weights of each scheme
{const pars=(scheme,mode)=>{const d=NL.defOf({id:'MO',type:'EVC',params:{scheme,mode}});const g=id=>Ex.params(d.components.find(c=>c.id===id).params.pars);
  return {tp:g('TP'),kp:g('KP'),sf:g('SF'),ids:d.components.map(c=>c.id).sort()};};
 out.modes={};for(const sc of ['moevc','moev'])for(const m of ['eco','balanced','performance'])out.modes[sc+':'+m]=pars(sc,m);}
// 4. fixed names folded into an expression once: the same numbers as evaluated each time
{const rnd=(()=>{let a=7;return ()=>(a=(a*16807)%2147483647)/2147483647;})();
 const srcs=['a*x + b*sin(2*pi*x/c) - max(a, x, b)','x > a ? clamp(x*b, -c, c) : -x^a','lut(mod(t, c), 0, 0, a, 1, b, 0.5, c, 0)*(1 + 0.025*sin(t))','(a - sqrt(max(a*a - 4*b*x, 0)))/(2*b)','min(a, b*x, c) + hypot(x, a, b)/3 + atan2(x, b)','!(a > b) && x < c || x == a','a < b ? (c > 1 ? 2 : 3) : 4'];
 out.fold=srcs.map(src=>{const names=['x','a','b','c'],tree=Ex.parse(src,names),cv={1:1.7,2:.45,3:3.2},f0=Ex.compile(tree),f1=Ex.compile(tree,cv);let same=true;
  for(let k=0;k<200;k++){const x=6*rnd()-3,t=10*rnd(),v0=f0([x,1.7,.45,3.2],t),v1=f1([x],t);if(!(Object.is(v0,v1)||v0===v1))same=false;}const vars=n=>Array.isArray(n)?(n[0]==='var'&&n[1]>0?1:0)+n.slice(1).reduce((q,c)=>q+vars(c),0):0;return {src,same,left:vars(Ex.fold(tree,cv)),before:vars(tree)};});
 out.foldConst=Ex.fold(Ex.parse('a*2 + b',['a','b']),{0:3,1:1});out.foldIf=Ex.fold(Ex.parse('a > 1 ? x : 2*x',['x','a']),{1:5});}
// 5. a period of N clock periods (the aggregation of the scope's statistics, for long runs)
{const pr={version:3,components:[{id:'CLK1',type:'CLK',x:0,y:0,rot:0,params:{f:1000}},{id:'U',type:'RAMP',x:0,y:0,rot:0,params:{f:5}},{id:'I1',type:'INT',x:0,y:0,rot:0,params:{}}],
  wires:[{id:'w0',a:{c:'U',p:'y'},b:{c:'I1',p:'u'},pts:[]}]};
 const a=new MNA.Sim(JSON.parse(JSON.stringify(pr)),{hDiv:10}),b=new MNA.Sim(JSON.parse(JSON.stringify(pr)),{hDiv:10,perN:4});a.run(.1);b.run(.1);
 const ts=s=>{const p=s.per,o=[];for(let k=0;k<p.n;k++)o.push(p.t[(p.head-p.n+k+p.cap)%p.cap]);return o;};
 out.perN={a:a.per.n,b:b.per.n,tb:ts(b).slice(0,4),inc:ts(b).every((t,k,arr)=>!k||t>arr[k-1]),T:a.T,avgB:b.lastPeriod('Y:I1')?.avg,endB:b.now('Y:I1')};}
console.log(JSON.stringify(out));
