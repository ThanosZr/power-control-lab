// 4.20.1 (decision 221 (b)): VSC2 with DC pins started from a load flow. Two converters (VS1, VS2) on one 325 V grid, each with
// an L filter, its DC capacitor charged to v_dc,0 = 800 V and a floating DC source through 0.5 Ω, set so that the start is the
// steady state: V_s = v_dc,0 + R·P/v_dc,0 with P from the phasors (the trapezoidal reactance (2/h)·tan(ωh/2)·L). The modulation
// is open loop, m = (2E₀/v_dc,0)·cos(ω(t + h) + θ₀ − k·2π/3): one step ahead, because a signal reaches a source one step later.
// And a DC current source into R ∥ C next to an AC circuit, started from phasors (its sign in the DC part of the start).
// Usage: node vsc_start_cases.js -> JSON
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');global.Expr=require(W+'/expr.js');global.StepCheck=require(W+'/stepcheck.js');
global.LineModels=require(W+'/linemodels.js');
for(const f of ['netlib','subcircuit','bus','units','nn'])require(W+'/'+f+'.js');
global.MNA=require(W+'/mna.js');
const pin=s=>{const [c,p]=s.split(':');return {c,p:p||'j'};};
const C=(id,type,x,y,params={})=>({id,type,x,y,rot:0,flip:false,label:id,params});
const f=50,w0=2*Math.PI*f,Vg=325,Vd0=800,Lf=5e-3,Rf=0.05,R=0.5,hDiv=400,h=1/f/hDiv,we=2/h*Math.tan(w0*h/2);
const UNITS=[{id:'VS1',E0:345,th0:-80},{id:'VS2',E0:330,th0:-95}];
function phasor(E0,th0){const E=[E0*Math.cos(th0*Math.PI/180),E0*Math.sin(th0*Math.PI/180)],G=[0,-Vg],Z=[Rf,we*Lf];
 const d=[E[0]-G[0],E[1]-G[1]],zz=Z[0]*Z[0]+Z[1]*Z[1],I=[(d[0]*Z[0]+d[1]*Z[1])/zz,(d[1]*Z[0]-d[0]*Z[1])/zz];
 return {I,Ipk:Math.hypot(I[0],I[1]),P:1.5*(E[0]*I[0]+E[1]*I[1])};}
function build(init,lead){const comps=[C('VG','VAC3',0,0,{Vpk:Vg,f,phase:0}),C('G1','GND',0,60,{})],wr=[['VG:n','G1:g']];
 UNITS.forEach((u,j)=>{const {P}=phasor(u.E0,u.th0),Vs=Vd0+R*P/Vd0,y=300*j,q=k=>u.id+k;
  comps.push(C(u.id,'VSC2',200,y,{dc:'pins',filt:'l',Lf,Rf,mmax:1.155,init,E0:u.E0,th0:u.th0,Vdc0:Vd0}),C(q('CD'),'C',300,y,{C:2e-3,v0:Vd0}),C(q('RL'),'R',350,y,{R}),C(q('VD'),'VDC',400,y,{V:Vs}));
  for(let k=0;k<3;k++){comps.push(C(q('M'+k),'EXPR',100,y+40*k,{expr:`(2*E0/vd)*cos(w*(t + dl) + th - ${k}*2*pi/3)`,ins:'',pars:`E0 = ${u.E0}, vd = ${Vd0}, w = ${w0}, th = ${u.th0*Math.PI/180}, dl = ${lead?h:0}`}));wr.push([q('M'+k)+':y',u.id+':m'+'abc'[k]]);}
  wr.push(['VG:a',u.id+':a'],['VG:b',u.id+':b'],['VG:c',u.id+':c'],[u.id+':p',q('CD')+':p'],[u.id+':n',q('CD')+':n'],[u.id+':p',q('RL')+':a'],[q('RL')+':b',q('VD')+':p'],[q('VD')+':n',u.id+':n']);});
 return {version:4,components:comps,wires:wr.map((x,i)=>({id:'w'+i,a:pin(x[0]),b:pin(x[1]),pts:[]})),solve:{init:'ac'},sim:{hDiv,method:'TR',stopT:0.1}};}
function run(init,lead){const s=new MNA.Sim(build(init,lead),{hDiv,method:'TR'}),out={warn:s.net.warnings,units:{}};
 const K=u=>({vdc:'Y:'+u.id+'/VD',idc:'I:'+u.id+'RL',ia:'I:'+u.id+'/La'}),rec={};for(const u of UNITS)rec[u.id]={vdc:[],idc:[],ia:[]};
 for(let k=0;k<3*hDiv;k++){for(const u of UNITS){const c=K(u);for(const q of ['vdc','idc','ia'])rec[u.id][q].push(s.now(c[q]));}s.run(h);}
 for(const u of UNITS){const r=rec[u.id],ph=phasor(u.E0,u.th0);
  out.units[u.id]={P:ph.P,I0:ph.P/Vd0,Ipk:ph.Ipk,ia0:ph.I[0],vdc:{min:Math.min(...r.vdc),max:Math.max(...r.vdc)},idc0:r.idc[0],idc:{min:Math.min(...r.idc),max:Math.max(...r.idc)},
   ia_first:r.ia[0],ia_peak:[0,1,2].map(c=>Math.max(...r.ia.slice(c*hDiv,(c+1)*hDiv).map(Math.abs)))};}
 return out;}
function isrc(){const comps=[C('VA','VAC',0,0,{Vpk:100,f:50}),C('R1','R',100,0,{R:10}),C('L1','L',150,0,{L:0.01}),C('I1','IDC',300,0,{I:2}),C('R2','R',350,0,{R:5}),C('C2','C',400,0,{C:1e-3}),C('G','GND',0,100,{})];
 const wr=[['VA:p','R1:a'],['R1:b','L1:a'],['L1:b','G:g'],['VA:n','G:g'],['I1:n','G:g'],['I1:p','R2:a'],['R2:b','G:g'],['I1:p','C2:p'],['C2:n','G:g']];
 const pr={version:4,components:comps,wires:wr.map((x,i)=>({id:'w'+i,a:pin(x[0]),b:pin(x[1]),pts:[]})),solve:{init:'ac'},sim:{hDiv:200,method:'TR'}};
 const s=new MNA.Sim(pr,{hDiv:200,method:'TR'}),v=[];for(let k=0;k<400;k++){v.push(s.now('V:R2'));s.run(1/50/200);}
 return {v0:v[0],min:Math.min(...v),max:Math.max(...v)};}
console.log(JSON.stringify({Vd0,lf:run('lf',true),lf_nolead:run('lf',false),zero:run('zero',true),isrc:isrc()}));
