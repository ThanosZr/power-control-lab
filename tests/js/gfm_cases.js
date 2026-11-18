// 4.18 (ROADMAP §58): the grid-forming converter (VSC2 + GFMC), headless.
// Usage: node gfm_cases.js '[{kind, …}, …]' -> JSON [result, …]
//  {kind:'grid', law, ct:{…}, Pref, Xf, Xg, Rg, fg, T, dt, keys}  one converter (filter L) against a stiff grid behind X_g:
//                                                        samples of keys every dt from t0 (default 0.3 s) to T
//  {kind:'island1', ct:{…}, P, P2, cmd, at, keys}         one converter (filter LC, cascade by default) feeding a load and,
//                                                        through a breaker, a second load: means over 20 ms before each t
//  {kind:'dcpins', at}                                   a converter with its DC terminals on a source: AC and DC powers
//  {kind:'tut', id, opts, set, at, keys, win}            a tutorial as the app builds it: mean, min, max over win before t
//  {kind:'scipy', T, keys, match}                        the 'grid' case (match: the 'match1' case) in the browser solver and its SciPy export
//  {kind:'cyc', id, opts, T, Tc, keys}                   4.18.1: a tutorial, the mean of each key over each period Tc
//  {kind:'scipyTut', id, opts, set, T, keys, hDiv}       4.18.1: a tutorial in the browser solver and its SciPy export
//  {kind:'match1', ct, Pref, Xg, fg, Hdc, T, dt, keys}   4.20.2: the 'grid' case with the DC side of matching control: VSC2
//                                                        with DC pins, its capacitor (H_dc = C·V_dc²/(2S)) and a DC current
//                                                        source driven by the output idc of GFMC through τ_dc = 50 ms and ±1,2
//                                                        pu (Tayyebi et al. 2020 (2)–(3)); samples every dt from t0 to T
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');global.Expr=require(W+'/expr.js');global.StepCheck=require(W+'/stepcheck.js');
global.LineModels=require(W+'/linemodels.js');
for(const f of ['netlib','subcircuit','bus','units','nn'])require(W+'/'+f+'.js');
global.MNA=require(W+'/mna.js');
const Wr=(id,a,b)=>({id,a:{c:a[0],p:a[1]},b:{c:b[0],p:b[1]},pts:[]});
const C=(id,type,params)=>({id,type,x:0,y:0,rot:0,params:params||{}});
const S=10e3,Vll=400,w0=2*Math.PI*50,Zb=Vll*Vll/S;
// the buses meas and m between the converter and its control (conn = 'bus' on both)
const link=(ws,ct,vs)=>{ws.push(Wr(ct+'meas',[vs,'meas'],[ct,'meas']),Wr(ct+'m',[ct,'m'],[vs,'m']));};
function gridProject(o){const Xf=o.Xf??0.1,Xg=o.Xg??0.1,cas=(o.ct||{}).inner==='cascade';
 const comps=[C('VS','VSC2',{dc:'ideal',Vdc:800,filt:cas?'lc':'l',Lf:Xf*Zb/w0,Rf:0.005*Zb,Cf:0.1/(w0*Zb),conn:'bus'}),
  C('CT','GFMC',{S,Vac:Vll,Vdc:800,law:o.law||'droop',inner:'direct',Pref:o.Pref||'0:0, 0.3:0.2',Xc:Xf,kv:0,th0:-90,tsoft:0,conn:'bus',...(o.ct||{})}),
  C('Z','ZSER3',{Rs:o.Rg??0.01*Zb,Ls:Xg*Zb/w0,Rp1:0,Lp:0,Rp2:0,conn:'bus'}),C('G','VAC3',{Vpk:Vll*Math.SQRT2/Math.sqrt(3),f:o.fg??50,phase:0,seq:'abc',Rs:0,Ls:0,conn:'bus'}),C('G0','GND')];
 const wires=[Wr('w1',['VS','abc'],['Z','abc1']),Wr('w2',['Z','abc2'],['G','abc']),Wr('w3',['G','n'],['G0','g'])];link(wires,'CT','VS');
 return {version:4,components:comps,wires,solve:{tbase:0.02}};}
function matchProject(o){const Xf=o.Xf??0.1,Xg=o.Xg??0.1,Vdc=800,Idb=S/Vdc,Cdc=2*(o.Hdc??0.05)*S/(Vdc*Vdc),P0=+(o.Pref??0.3);
 const comps=[C('VS','VSC2',{dc:'pins',filt:'l',Lf:Xf*Zb/w0,Rf:0.005*Zb,conn:'bus'}),
  C('CT','GFMC',{S,Vac:Vll,Vdc,law:'match',inner:'direct',Pref:String(P0),Xc:Xf,kv:0,th0:-90,tsoft:0,conn:'bus',...(o.ct||{})}),
  C('CD','C',{C:Cdc,v0:Vdc}),C('ID','IDC',{ctl:'sig'}),C('LP','LPF',{fc:1/(2*Math.PI*(o.tdc??0.05)),y0:String(P0)}),C('SA','SAT',{lo:-1.2,hi:1.2}),C('GA','GAIN',{K:Idb}),
  C('Z','ZSER3',{Rs:o.Rg??0.01*Zb,Ls:Xg*Zb/w0,Rp1:0,Lp:0,Rp2:0,conn:'bus'}),C('G','VAC3',{Vpk:Vll*Math.SQRT2/Math.sqrt(3),f:o.fg??50,phase:0,seq:'abc',Rs:0,Ls:0,conn:'bus'}),C('G0','GND')];
 const wires=[Wr('w1',['VS','abc'],['Z','abc1']),Wr('w2',['Z','abc2'],['G','abc']),Wr('w3',['G','n'],['G0','g']),Wr('w4',['VS','p'],['CD','p']),Wr('w5',['VS','n'],['CD','n']),
  Wr('w6',['ID','p'],['VS','p']),Wr('w7',['ID','n'],['VS','n']),Wr('w8',['CT','idc'],['LP','u']),Wr('w9',['LP','y'],['SA','u']),Wr('w10',['SA','y'],['GA','u']),Wr('w11',['GA','y'],['ID','u'])];link(wires,'CT','VS');
 return {version:4,components:comps,wires,solve:{tbase:0.02}};}
function match1(o){const s=new MNA.Sim(matchProject(o),{hDiv:o.hDiv||400,method:'TR'}),keys=o.keys||['Y:CT/PP'],t0=o.t0??0.3,dt=o.dt||5e-4,T=o.T||1.1,out=[];const c0=Date.now();
 while(s.t<t0-1e-12)s.run(Math.min(s.h,t0-s.t));for(let t=t0;t<=T+1e-9;t+=dt){while(s.t<t-1e-12)s.run(Math.min(s.h,t-s.t));out.push([s.t,...keys.map(k=>s.now(k))]);}
 return {out,keys,ms:Date.now()-c0,warn:s.net.warnings};}
function grid(o){const s=new MNA.Sim(gridProject(o),{hDiv:o.hDiv||400,method:'TR'}),keys=o.keys||['Y:CT/PP'],t0=o.t0??0.3,dt=o.dt||5e-4,T=o.T||1.1,out=[];const c0=Date.now();
 while(s.t<t0-1e-12)s.run(Math.min(s.h,t0-s.t));for(let t=t0;t<=T+1e-9;t+=dt){while(s.t<t-1e-12)s.run(Math.min(s.h,t-s.t));out.push([s.t,...keys.map(k=>s.now(k))]);}
 return {out,keys,ms:Date.now()-c0,warn:s.net.warnings};}
function island1(o){const cas=(o.ct||{}).inner!=='direct',Lf=0.06*Zb/w0,Cf=0.1/(w0*Zb);
 const comps=[C('VS','VSC2',{dc:'ideal',Vdc:800,filt:'lc',Lf,Rf:0.005*Zb,Cf,conn:'bus'}),C('CT','GFMC',{S,Vac:Vll,Vdc:800,law:'droop',inner:cas?'cascade':'direct',Xc:0.06,Bf:0.1,Imax:1.2,conn:'bus',...(o.ct||{})}),
  C('Z','ZSER3',{Rs:0.1,Ls:1.5e-3,Rp1:0,Lp:0,Rp2:0,conn:'bus'}),C('J','JUNC',{}),C('LD','LOAD3',{cn:'yn',Un:Vll,P:o.P??8000,Q:o.Q??0,conn:'bus'}),
  C('CB','CB3',{cmd:o.cmd||'0:0',model:'ideal',conn:'bus'}),C('L2','LOAD3',{cn:'yn',Un:Vll,P:o.P2??8000,Q:0,conn:'bus'})];
 const wires=[Wr('w1',['VS','abc'],['Z','abc1']),Wr('w2',['Z','abc2'],['J','j']),Wr('w3',['J','j'],['LD','abc']),Wr('w4',['J','j'],['CB','abc1']),Wr('w5',['CB','abc2'],['L2','abc'])];link(wires,'CT','VS');
 return means(new MNA.Sim({version:4,components:comps,wires,solve:{tbase:0.02}},{hDiv:o.hDiv||400,method:'TR'}),o.at,o.keys,o.win||0.02);}
function dcpins(o){const L=5e-3;
 const comps=[C('VS','VSC2',{dc:'pins',filt:'l',Lf:L,Rf:0.05,conn:'bus'}),C('VD','VDC',{V:800,Rs:0.01}),C('AD','AM',{}),C('G0','GND'),C('CT','GFMC',{S,Vac:Vll,Vdc:800,law:'droop',inner:'direct',Xc:w0*L/Zb,tsoft:0.02,conn:'bus'}),
  C('LD','LOAD3',{cn:'y',Un:Vll,P:6000,Q:2000,conn:'bus'})];
 const wires=[Wr('w1',['VD','p'],['AD','a']),Wr('w2',['AD','b'],['VS','p']),Wr('w3',['VD','n'],['VS','n']),Wr('w4',['VD','n'],['G0','g']),Wr('w5',['VS','abc'],['LD','abc'])];link(wires,'CT','VS');
 const s=new MNA.Sim({version:4,components:comps,wires,solve:{tbase:0.02}},{hDiv:400,method:'TR'});
 return means(s,o.at||[0.3],['Y:AD','Y:VS/VD','Y:CT/PP'],0.02,(s)=>s.now('Y:AD')*s.now('Y:VS/VD'));}
function means(s,at,keys,win,extra){const out=[],c0=Date.now();for(const T of at){const acc=keys.map(()=>({s:0,n:0,mx:-1e300,mn:1e300}));let ex=0,ne=0;
  while(s.t<T-1e-12){s.run(Math.min(s.h,T-s.t));if(s.t>T-win-1e-12){keys.forEach((k,j)=>{const v=s.now(k),a=acc[j];a.s+=v;a.n++;a.mx=Math.max(a.mx,v);a.mn=Math.min(a.mn,v);});if(extra){ex+=extra(s);ne++;}}}
  const r={t:s.t};keys.forEach((k,j)=>{const a=acc[j];r[k]={mean:a.s/Math.max(a.n,1),max:a.mx,min:a.mn,last:s.now(k)};});if(extra)r.extra=ex/Math.max(ne,1);out.push(r);}
 return {out,ms:Date.now()-c0,h:s.h,warn:s.net.warnings};}
function tut(o){require(W+'/tutorials.js');const t=Tutorials.get(o.id),opts={};for(const q of t.options||[])opts[q.k]=q.def;Object.assign(opts,o.opts||{});
 const pr=t.build(opts);for(const [id,ps] of Object.entries(o.set||{}))Object.assign(pr.components.find(c=>c.id===id).params,ps);const sv=pr.sim||{};
 const r=means(new MNA.Sim(pr,{hDiv:o.hDiv||sv.hDiv||400,method:sv.method||'TR'}),o.at,o.keys,o.win||0.02);return {...r,meta:pr.meta};}
function scipy(o){const pr=(o.match?matchProject:gridProject)({...o,Pref:o.Pref||'0:0, 0.005:0.2'}),s=new MNA.Sim(pr,{hDiv:o.hDiv||400,method:'TR'}),T=o.T||0.02,ch=o.keys||['Y:CT/PP','Y:CT/WW','I:VS/La'],rec=[];
 while(s.t<T-1e-12){s.run(Math.min(s.h,T-s.t));rec.push([s.t,...ch.map(k=>s.now(k))]);}
 return {rec,ch,batch:MNA.exportForBatch(pr,ch),h:s.h,warn:s.net.warnings};}
function cyc(o){require(W+'/tutorials.js');const t=Tutorials.get(o.id),opts={};for(const q of t.options||[])opts[q.k]=q.def;Object.assign(opts,o.opts||{});
 const pr=t.build(opts),sv=pr.sim||{},s=new MNA.Sim(pr,{hDiv:sv.hDiv||400,method:sv.method||'TR'}),Tc=o.Tc||0.02,keys=o.keys,out=[],c0=Date.now();let acc=keys.map(()=>0),n=0,tc=Tc;
 while(s.t<o.T-1e-12){s.run(s.h);keys.forEach((k,j)=>acc[j]+=s.now(k));n++;if(s.t>=tc-1e-12){out.push([tc,...acc.map(a=>a/n)]);acc=keys.map(()=>0);n=0;tc+=Tc;}}
 return {out,keys,ms:Date.now()-c0,warn:s.net.warnings,meta:pr.meta};}
function scipyTut(o){require(W+'/tutorials.js');const t=Tutorials.get(o.id),opts={};for(const q of t.options||[])opts[q.k]=q.def;Object.assign(opts,o.opts||{});
 const pr=t.build(opts);for(const [id,ps] of Object.entries(o.set||{}))Object.assign(pr.components.find(c=>c.id===id).params,ps);
 const s=new MNA.Sim(pr,{hDiv:o.hDiv||400,method:'TR'}),ch=o.keys,rec=[];while(s.t<o.T-1e-12){s.run(Math.min(s.h,o.T-s.t));rec.push([s.t,...ch.map(k=>s.now(k))]);}
 return {rec,ch,batch:MNA.exportForBatch(pr,ch),h:s.h,warn:s.net.warnings};}
const cases=JSON.parse(process.argv[2]||'[]');const res=[];
for(const o of cases){try{res.push(o.kind==='grid'?grid(o):o.kind==='island1'?island1(o):o.kind==='dcpins'?dcpins(o):o.kind==='tut'?tut(o):o.kind==='scipy'?scipy(o):o.kind==='cyc'?cyc(o):o.kind==='scipyTut'?scipyTut(o):o.kind==='match1'?match1(o):{error:'kind'});}catch(e){res.push({error:String(e&&e.stack||e)});}}
process.stdout.write(JSON.stringify(res));
