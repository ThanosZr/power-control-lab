// 4.16 (ROADMAP §42): the line-commutated converter (LCC), headless. THEORY §8ω.
// Usage: node lcc_cases.js '[{kind, …}, …]' -> JSON [result, …]
//  {kind:'bridge', impl, alpha, Ell, Lc, Ld, Rd, vsrc, T, hDiv, win}  one six-pulse bridge behind L_c on a stiff source (E_LL),
//        fired at a constant α, on R + L (or on a DC source V behind R, as an inverter): means over the last window
//  {kind:'station', model, impl, alpha, Vac, vsrc, Rd, Ld, T}          one twelve-pulse station on a stiff 345 kV source: P, Q at
//        the source (three-phase instantaneous powers), P_DC, I_d, V_d, γ, cf
//  {kind:'tut', id, opts, at:[t…], keys:[…], win, set}                 a tutorial as the app builds it: mean, min, max over the
//        window before each t
//  {kind:'scipy', alpha, T, hDiv, keys}                                the analytical bridge in the browser and its SciPy export
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');global.Expr=require(W+'/expr.js');global.StepCheck=require(W+'/stepcheck.js');
global.LineModels=require(W+'/linemodels.js');
for(const f of ['netlib','subcircuit','bus','units','nn'])require(W+'/'+f+'.js');
global.MNA=require(W+'/mna.js');
const Wr=(id,a,b)=>({id,a:{c:a[0],p:a[1]},b:{c:b[0],p:b[1]},pts:[]});
const C=(id,type,params)=>({id,type,x:0,y:0,rot:0,params:params||{}});
// the bridge: VAC3 (E_LL, LL RMS) → L_c per phase → LCC6, synchronised to the source (VP), DC: L_d + R_d (or a source)
function bridgeProject(o){const Ell=o.Ell||211e3,Vpk=Ell*Math.SQRT2/Math.sqrt(3),Lc=o.Lc||0.0545,impl=o.impl||'fast';
 const comps=[C('V1','VAC3',{Vpk,f:50,phase:0,seq:'abc',Rs:0,Ls:0,conn:'sep'}),C('G1','GND'),
  C('BR','LCC6',{impl,sync:'sig',shift:0,ini:'v',Rsn:o.Rsn??5000,Csn:o.Csn??0.05e-6,tq:o.tq||0}),C('AO','CONST',{v:String(o.alpha??15)}),C('BK','CONST',{v:o.blk||'0'}),
  C('LD','L',{L:o.Ld||1,Rs:0}),C('MV','VM',{})];
 const wires=[Wr('wn',['V1','n'],['G1','g']),Wr('w4',['AO','y'],['BR','ao']),Wr('w5',['BK','y'],['BR','blk']),Wr('w6',['BR','p'],['LD','a']),Wr('m1',['BR','p'],['MV','p']),Wr('m2',['BR','n'],['MV','n'])];
 if(o.vsrc){comps.push(C('VD','VDC',{V:o.vsrc,Rs:o.Rd||1}));wires.push(Wr('w7',['LD','b'],['VD','n']),Wr('w8',['VD','p'],['BR','n']));}
 else{comps.push(C('RD','R',{R:o.Rd||100}));wires.push(Wr('w7',['LD','b'],['RD','a']),Wr('w8',['RD','b'],['BR','n']));}
 ['a','b','c'].forEach((x,k)=>{comps.push(C('L'+x,'L',{L:Lc,Rs:0}),C('P'+x,'VP',{}));
  wires.push(Wr('w1'+x,['V1',x],['L'+x,'a']),Wr('w2'+x,['L'+x,'b'],['BR',x]),Wr('wp'+x,['V1',x],['P'+x,'p']),Wr('wq'+x,['P'+x,'y'],['BR','v'+x]));});
 return {version:4,components:comps,wires,solve:{tbase:0.02}};}
function means(s,T,win,keys,f){const acc=keys.map(()=>({s:0,mn:1e300,mx:-1e300})),x={n:0};const t0=Date.now();
 while(s.t<T-1e-12){s.run(Math.min(s.h,T-s.t));if(s.t>T-win+1e-12){x.n++;keys.forEach((k,j)=>{const v=s.now(k),a=acc[j];a.s+=v;a.mn=Math.min(a.mn,v);a.mx=Math.max(a.mx,v);});if(f)f(s);}}
 return {ms:Date.now()-t0,n:x.n,res:Object.fromEntries(keys.map((k,j)=>[k,{mean:acc[j].s/x.n,min:acc[j].mn,max:acc[j].mx}]))};}
function bridge(o){const s=new MNA.Sim(bridgeProject(o),{hDiv:o.hDiv||400,method:'TR'}),m=o.impl==='blocks'?'/M':'/X';
 const keys=['I:LD','Y:MV','Y:BR'+m,'Y:BR'+m+':gm','Y:BR'+m+':gl','Y:BR'+m+':cf'];const r=means(s,o.T||0.3,o.win||0.02,keys);
 return {...r,warn:s.net.warnings,Id:r.res['I:LD'].mean,Vd:r.res['Y:MV'].mean,am:r.res['Y:BR'+m].mean,gm:r.res['Y:BR'+m+':gm'].mean,gl:r.res['Y:BR'+m+':gl'].mean,cf:r.res['Y:BR'+m+':cf'].max};}
// the station: VAC3 (stiff, 345 kV) → LCCS → L_d + R_d (or a DC source behind R_d)
function stationProject(o){const U1=345e3,Vpk=(o.Vac||U1)*Math.SQRT2/Math.sqrt(3);
 const comps=[C('V1','VAC3',{Vpk,f:50,phase:0,seq:'abc',Rs:0,Ls:0,conn:'sep'}),C('G1','GND'),C('G2','GND'),
  C('ST','LCCS',{model:o.model||'det',impl:o.impl||'fast',tq:o.tq||0}),C('AO','CONST',{v:String(o.alpha??15)}),C('BK','CONST',{v:o.blk||'0'}),C('LD','L',{L:o.Ld||1,Rs:0})];
 const wires=[Wr('wn',['V1','n'],['G1','g']),Wr('w4',['AO','y'],['ST','ao']),Wr('w5',['BK','y'],['ST','blk']),Wr('w6',['ST','p'],['LD','a'])];
 if(o.vsrc){comps.push(C('VD','VDC',{V:o.vsrc,Rs:o.Rd||1}),C('G3','GND'));wires.push(Wr('w7',['LD','b'],['VD','n']),Wr('w8',['VD','p'],['ST','n']),Wr('w10',['VD','p'],['G3','g']));}
 else{comps.push(C('RD','R',{R:o.Rd||250}));wires.push(Wr('w7',['LD','b'],['RD','a']),Wr('w8',['RD','b'],['ST','n']),Wr('w9',['ST','n'],['G2','g']));}
 ['a','b','c'].forEach(x=>wires.push(Wr('w1'+x,['V1',x],['ST',x])));
 return {version:4,components:comps,wires,solve:{tbase:0.02}};}
function station(o){const s=new MNA.Sim(stationProject(o),{hDiv:o.hDiv||400,method:'TR'});let P=0,Q=0;
 const keys=['Y:ST/IDC','Y:ST/VDC','Y:ST/GM','Y:ST/CF'];
 const r=means(s,o.T||0.4,o.win||0.02,keys,q=>{const va=q.now('V:V1'),vb=q.now('Vb:V1'),vc=q.now('Vc:V1'),ia=q.now('I:V1'),ib=q.now('Ib:V1'),ic=q.now('Ic:V1');
  P+=va*ia+vb*ib+vc*ic;Q+=((vb-vc)*ia+(vc-va)*ib+(va-vb)*ic)/Math.sqrt(3);});
 const g=k=>r.res[k].mean;return {...r,warn:s.net.warnings,P:P/r.n,Q:Q/r.n,Id:g('Y:ST/IDC'),Vd:g('Y:ST/VDC'),Pdc:g('Y:ST/IDC')*g('Y:ST/VDC'),gm:g('Y:ST/GM'),cf:r.res['Y:ST/CF'].max};}
function tut(o){require(W+'/tutorials.js');const t=Tutorials.get(o.id||'hvdc_lcc'),pr=t.build(o.opts||{});
 for(const [id,ps] of Object.entries(o.set||{}))Object.assign(pr.components.find(c=>c.id===id).params,ps);
 const s=new MNA.Sim(pr,{hDiv:o.hDiv||pr.sim.hDiv,method:'TR'}),keys=o.keys,win=o.win||0.02,out=[],t0=Date.now();
 for(const T of o.at){const acc=keys.map(()=>({s:0,n:0,mx:-1e300,mn:1e300}));while(s.t<T-1e-12){s.run(Math.min(s.h,T-s.t));if(s.t>T-win-1e-12)keys.forEach((k,j)=>{const v=s.now(k),a=acc[j];a.s+=v;a.n++;a.mx=Math.max(a.mx,v);a.mn=Math.min(a.mn,v);});}
  const q={t:s.t};keys.forEach((k,j)=>{const a=acc[j];q[k]={mean:a.s/Math.max(a.n,1),max:a.mx,min:a.mn};});out.push(q);}
 return {out,ms:Date.now()-t0,h:s.h,warn:s.net.warnings,meta:pr.meta};}
// the analytical bridge (thyristors, PLL, comparators) on R + L in the browser and its SciPy export (from t = 0: the PLL
// starts on the voltage, the DC current from zero)
function scipy(o){const pr=bridgeProject({...o,impl:'blocks'}),s=new MNA.Sim(pr,{hDiv:o.hDiv||2000,method:'TR'}),T=o.T||0.04,ch=o.keys||['I:LD','Y:MV','Y:BR/M'],rec=[];
 while(s.t<T-1e-12){s.run(Math.min(s.h,T-s.t));rec.push([s.t,...ch.map(k=>s.now(k))]);}
 return {rec,ch,batch:MNA.exportForBatch(pr,ch),h:s.h,warn:s.net.warnings};}
// the export refuses what SciPy does not have: the compact bridge (sent as the analytical one), t_q, the average station
function refuse(o){const pr=o.what==='avg'?stationProject({model:'avg'}):bridgeProject({impl:'fast',tq:o.what==='tq'?20e-6:0});
 try{const d=MNA.exportForBatch(pr,['Y:MV']);return {ok:true,lcc:d.net.els.some(e=>e.gate==='lcc'),scr:d.net.els.filter(e=>e.gk==='scr').length};}catch(e){return {ok:false,msg:String(e.message||e)};}}
const cases=JSON.parse(process.argv[2]||'[]');const res=[];
for(const o of cases){try{res.push(o.kind==='bridge'?bridge(o):o.kind==='station'?station(o):o.kind==='tut'?tut(o):o.kind==='scipy'?scipy(o):o.kind==='refuse'?refuse(o):{error:'kind'});}catch(e){res.push({error:String(e&&e.stack||e)});}}
process.stdout.write(JSON.stringify(res));
