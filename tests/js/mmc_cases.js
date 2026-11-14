// 4.14 (ROADMAP §42): the MMC (four models) and the control of its station, headless.
// Usage: node mmc_cases.js '[{kind, …}, …]' -> JSON [result, …]
//  {kind:'open', model, N, T, hDiv, keys:[…], at:[t…]}  one MMC between an AC source behind an inductance and a stiff DC
//                                                        source (±V_dc/2), driven by fixed sinusoidal m: samples of keys
//  {kind:'tut', id, opts, T, at:[t…], keys:[…]}          a tutorial as the app builds it: samples of keys at the times
//                                                        (set: {id: {param: value}} before the build, unwire: ['id:pin'])
//  {kind:'export', model, N}                             the SciPy export of 'open' (Model 1 from the detailed implementation)
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');global.Expr=require(W+'/expr.js');global.StepCheck=require(W+'/stepcheck.js');
global.LineModels=require(W+'/linemodels.js');
for(const f of ['netlib','subcircuit','bus','units','nn'])require(W+'/'+f+'.js');
global.MNA=require(W+'/mna.js');
const Wr=(id,a,b)=>({id,a:{c:a[0],p:a[1]},b:{c:b[0],p:b[1]},pts:[]});
const C=(id,type,params)=>({id,type,x:0,y:0,rot:0,params:params||{}});
// the test circuit: VAC3 (amplitude Vs, LL RMS) → L (per phase) → MMC; DC: two sources ±V_dc/2 to ground; m from expressions
function openProject(o){const Vdc=o.Vdc||640e3,N=o.N||20,Vll=o.Vll||333e3,Vpk=Vll*Math.SQRT2/Math.sqrt(3),m=o.m??0.85,d=o.d??-0.1;
 const model=o.model||'m2',mmc={impl:model==='m1'?'blocks':'fast',model:model==='m1'?'m2':model,N,C:o.C||10e-3*400/N,Vdc,Larm:o.Larm||0.05,Ron:o.Ron??1e-3,ccsc:o.ccsc||'on',sel:o.sel||'trigger',fs:o.fs??0,disc:o.disc||'smooth',vc0:o.vc0??1};
 const comps=[C('V1','VAC3',{Vpk,f:50,phase:0,seq:'abc',Rs:0,Ls:0,conn:'sep'}),C('G1','GND'),C('G2','GND'),C('G3','GND'),
  C('MM','MMC',mmc),C('VP','VDC',{V:Vdc/2,Rs:o.Rdc??1}),C('VN','VDC',{V:Vdc/2,Rs:o.Rdc??1}),C('BK','CONST',{v:o.blk||'0'})];
 const wires=[Wr('wn',['V1','n'],['G1','g']),Wr('wp',['VP','p'],['MM','p']),Wr('wm',['VP','n'],['G2','g']),Wr('wq',['VN','p'],['G3','g']),Wr('wr',['VN','n'],['MM','n']),Wr('wb',['BK','y'],['MM','blk'])];
 ['a','b','c'].forEach((x,k)=>{comps.push(C('L'+x,'L',{L:o.Lac||0.06,Rs:o.Rac??0.3}));wires.push(Wr('w1'+x,['V1',x],['L'+x,'a']),Wr('w2'+x,['L'+x,'b'],['MM',x]));
  const ph=[0,-2*Math.PI/3,2*Math.PI/3][k];comps.push(C('M'+x,'EXPR',{expr:`${m}*sin(2*pi*50*t + ${d} + ${ph})`,ins:'',pars:''}));wires.push(Wr('w3'+x,['M'+x,'y'],['MM','m'+x]));});
 return {version:4,components:comps,wires,solve:{tbase:0.02}};}
// one station in closed loop: VAC3 → L (transformer leakage, per phase) → MMC (+ MMCC) → stiff DC (±V_dc/2 behind R_dc)
function ctlProject(o){const pr=openProject(o),cs=pr.components.filter(c=>!/^M[abc]$/.test(c.id)&&c.id!=='BK'),ws=pr.wires.filter(w=>!/^w3[abc]$/.test(w.id)&&w.id!=='wb');
 cs.push(C('CT','MMCC',{S:1059e6,Vac:o.Vll||333e3,Vdc:o.Vdc||640e3,f0:50,X:o.X??0.075,R:o.R??0.002,th0:o.th0??-90,tdb:o.tdb??0.02,mode:o.mode||'p',Pref:o.Pref||'0:0, 0.05:0.5',Tp:0.1,qmode:'q',Qref:o.Qref||'0',Tq:0.1,prot:'off',Ti:o.Ti??0.01}));
 for(const q of ['va','vb','vc','ia','ib','ic','vdc','idc','vs'])ws.push(Wr('c'+q,['MM',q],['CT',q]));for(const q of ['ma','mb','mc','blk'])ws.push(Wr('d'+q,['CT',q],['MM',q]));
 return {...pr,components:cs,wires:ws};}
function ctl(o){const s=new MNA.Sim(ctlProject(o),{hDiv:o.hDiv||1000,method:'TR'}),keys=o.keys,out=[],t0=Date.now();for(const T of o.at){const acc=keys.map(()=>({s:0,n:0}));
  while(s.t<T-1e-12){s.run(Math.min(s.h,T-s.t));if(s.t>T-0.02)keys.forEach((k,j)=>{acc[j].s+=s.now(k);acc[j].n++;});}out.push({t:s.t,...Object.fromEntries(keys.map((k,j)=>[k,{mean:acc[j].s/acc[j].n,min:0,max:0}]))});}
 return {out,ms:Date.now()-t0,h:s.h,warn:s.net.warnings};}
function sample(s,T,at,keys){const out=[];let k=0;const t0=Date.now();const ts=(at||[]).slice().sort((a,b)=>a-b);
 while(s.t<T-1e-12){s.run(Math.min(s.h,T-s.t));while(k<ts.length&&s.t>=ts[k]-1e-12){out.push([s.t,...keys.map(q=>s.now(q))]);k++;}}
 return {out,ms:Date.now()-t0,h:s.h,warn:s.net.warnings,lu:s.lustat};}
// the 50 Hz fundamental (peak) and the mean of a key over the last n cycles before the end of the run
function fund(s,key,n){const tr=s.rawSeries?s.rawSeries(key):null;return tr;}
function open(o){const s=new MNA.Sim(openProject(o),{hDiv:o.hDiv||1000,method:o.method||'TR'});const keys=o.keys||['I:La','Y:MM/VDC','Y:MM/IDC'];
 const at=o.at||[o.T||0.1];const r=sample(s,o.T||0.1,at,keys);
 // means over the last cycle of every key, with fixed-step accumulation
 return {...r,keys};}
function stats(o){const s=new MNA.Sim(openProject(o),{hDiv:o.hDiv||1000,method:o.method||'TR'}),keys=o.keys,T=o.T||0.1,t1=T-(o.win||0.02);const acc=keys.map(()=>({s:0,s2:0,c:0,sn:0,cs:0,mx:-1e300,mn:1e300}));let n=0;const t0=Date.now();
 while(s.t<T-1e-12){s.run(Math.min(s.h,T-s.t));if(s.t>t1+1e-12){n++;const w=2*Math.PI*50*s.t;keys.forEach((q,k)=>{const v=s.now(q),a=acc[k];a.s+=v;a.s2+=v*v;a.sn+=v*Math.sin(w);a.cs+=v*Math.cos(w);a.mx=Math.max(a.mx,v);a.mn=Math.min(a.mn,v);});}}
 return {ms:Date.now()-t0,h:s.h,warn:s.net.warnings,lu:s.lustat,keys,res:acc.map(a=>({mean:a.s/n,rms:Math.sqrt(a.s2/n),pk1:2*Math.hypot(a.sn,a.cs)/n,ph1:Math.atan2(a.cs,a.sn),max:a.mx,min:a.mn}))};}
// a tutorial: at each t the mean, the minimum and maximum (over the window w before t) and the last value of every key
function tut(o){require(W+'/tutorials.js');const t=Tutorials.get(o.id),pr=t.build(o.opts||{}),sv=pr.sim||{},_s=Object.entries(o.set||{}).forEach(([id,ps])=>Object.assign(pr.components.find(c=>c.id===id).params,ps)),_u=(o.unwire||[]).forEach(q=>{const [c,n]=q.split(':');pr.wires=pr.wires.filter(w=>!(w.a.c===c&&w.a.p===n||w.b.c===c&&w.b.p===n));}),s=new MNA.Sim(pr,{hDiv:o.hDiv||sv.hDiv||10,method:sv.method||'TR'}),t0=Date.now(),keys=o.keys,win=o.win||0.02,out=[];
 for(const T of o.at){const acc=keys.map(()=>({s:0,n:0,mx:-1e300,mn:1e300}));while(s.t<T-1e-12){s.run(Math.min(s.h,T-s.t));if(s.t>T-win-1e-12)keys.forEach((k,j)=>{const v=s.now(k),a=acc[j];a.s+=v;a.n++;a.mx=Math.max(a.mx,v);a.mn=Math.min(a.mn,v);});}
  const r={t:s.t};keys.forEach((k,j)=>{const a=acc[j];r[k]={mean:a.s/Math.max(a.n,1),max:a.mx,min:a.mn,last:s.now(k)};});out.push(r);}
 return {out,ms:Date.now()-t0,h:s.h,warn:s.net.warnings,meta:pr.meta};}
// Model 1 (the detailed implementation) in the browser and its SciPy export
function scipy(o){const pr=openProject({...o,model:'m1'}),s=new MNA.Sim(pr,{hDiv:o.hDiv||1000,method:'TR'}),T=o.T||0.01,ch=o.keys||['Y:MM/IAa','Y:MM/IDC'],rec=[];
 while(s.t<T-1e-12){s.run(Math.min(s.h,T-s.t));rec.push([s.t,...ch.map(k=>s.now(k))]);}
 return {rec,ch,batch:MNA.exportForBatch(pr,ch),h:s.h,warn:s.net.warnings};}
function exportCase(o){const s=new MNA.Sim(NetLib.forceImpl(openProject(o),'blocks'),{hDiv:o.hDiv||1000});return {n:s.exportForBatch(o.T||0.002).els?.length};}
const cases=JSON.parse(process.argv[2]||'[]');const res=[];
for(const o of cases){try{res.push(o.kind==='open'?open(o):o.kind==='stats'?stats(o):o.kind==='tut'?tut(o):o.kind==='ctl'?ctl(o):o.kind==='scipy'?scipy(o):o.kind==='export'?exportCase(o):{error:'kind'});}catch(e){res.push({error:String(e&&e.stack||e)});}}
process.stdout.write(JSON.stringify(res));
