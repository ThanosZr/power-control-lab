// Units and vector types of signal ports (3.19, ROADMAP §3): what each output carries, the errors (a frame into another
// frame) and warnings (another unit or component), the 'strict' and 'off' settings, every tutorial without a message,
// and the same check in buildNetlist (the browser solver, pcl and the server all go through it).
// Usage: node units_cases.js -> JSON
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');const SUB=require(W+'/subcircuit.js');require(W+'/bus.js');const U=require(W+'/units.js');const MNA=require(W+'/mna.js');require(W+'/tutorials.js');
const T=globalThis.Tutorials;
const C=(id,type,params={})=>({id,type,x:0,y:0,rot:0,flip:false,label:id,params});
const pin=s=>{const [c,p]=s.split(':');return {c,p:p||'j'};};
const pr=(comps,conns,solve={})=>({version:3,components:comps,wires:conns.map((w,i)=>({id:'w'+(i+1),a:pin(w[0]),b:pin(w[1]),pts:[]})),solve});
const R={};
// a three-phase source measured, Clarke and Park on buses, a PLL for θ: the types along the chain
const V3=()=>[C('V3','VAC3',{Vpk:100,f:50}),C('G','GND'),C('RA','R',{R:10}),C('RB','R',{R:10}),C('RC','R',{R:10}),C('VA','VM'),C('VB','VM'),C('VC','VM'),C('AM','AM')];
const V3w=[['V3:n','G:g'],['V3:a','RA:a'],['V3:b','RB:a'],['V3:c','RC:a'],['RA:b','AM:a'],['AM:b','G:g'],['RB:b','G:g'],['RC:b','G:g'],['VA:p','V3:a'],['VB:p','V3:b'],['VC:p','V3:c'],['VA:n','G:g'],['VB:n','G:g'],['VC:n','G:g']];
{const p=pr([...V3(),C('MX','MUX',{n:3}),C('CL','CLARKE',{conn:'bus'}),C('PK','PARK',{conn:'bus'}),C('PL','PLL',{conn:'sep'}),C('DX','DEMUX',{n:2}),C('I1','INT'),C('K1','GAIN',{K:2,unit:'='}),C('S1','SUM',{signs:'+-'})],
  [...V3w,['VA:y','MX:u1'],['VB:y','MX:u2'],['VC:y','MX:u3'],['MX:y','CL:abc'],['CL:ab','PK:ab'],['VA:y','PL:a'],['VB:y','PL:b'],['VC:y','PL:c'],['PL:th','PK:th'],['PK:dq','DX:u'],['PL:w','I1:u'],['DX:y1','K1:u'],['K1:y','S1:a'],['DX:y2','S1:b']]);
 const r=U.infer(p),o=(id,pn)=>U.txt(r.out(id,pn));
 R.chain={mux:o('MX'),clarke:o('CL'),park:o('PK'),d:o('DX','y1'),q:o('DX','y2'),th:o('PL','th'),w:o('PL','w'),int:o('I1'),gain:o('K1'),sum:o('S1'),errors:r.errors,warnings:r.warnings};}
// errors: an αβ bus into the dq input of inverse Park (same width, another frame); with 'off' nothing is checked
const wrong=(solve)=>pr([...V3(),C('MX','MUX',{n:3}),C('CL','CLARKE',{conn:'bus'}),C('IP','IPARK',{conn:'bus'}),C('K0','CONST',{v:0,unit:'rad'}),C('DS','GAIN',{K:1})],
  [...V3w,['VA:y','MX:u1'],['VB:y','MX:u2'],['VC:y','MX:u3'],['MX:y','CL:abc'],['CL:ab','IP:dq'],['K0:y','IP:th'],['IP:ab','DS:u']],solve);
{const r=U.infer(wrong({}));R.frame={errors:r.errors,warnings:r.warnings};
 let msg=null;try{MNA.buildNetlist(wrong({}));}catch(e){msg=e.message;}R.frame.build=msg;
 R.frame.off=U.infer(wrong({units:'off'})).errors;let ok=true;try{MNA.buildNetlist(wrong({units:'off'}));}catch(e){ok=false;}R.frame.offBuilds=ok;}
// a scalar of the wrong frame, the wrong component, the wrong unit; a sum and a comparator of different units; a Mux declared dq
{const mk=solve=>pr([...V3(),C('CL','CLARKE'),C('PK','PARK'),C('IP','IPARK'),C('KT','CONST',{v:0,unit:'rad'}),C('VD','VDC',{ctl:'sig'}),C('R1','R',{R:1}),C('S1','SUM',{signs:'++'}),C('CP','CMP'),
   C('KD','CONST',{v:1,unit:'A'}),C('KQ','CONST',{v:0,unit:'A'}),C('MX','MUX',{n:2,frame:'dq'}),C('DX','DEMUX',{n:2}),C('K2','GAIN',{K:3,unit:'V'})],
  [...V3w,['VA:y','CL:a'],['VB:y','CL:b'],['VC:y','CL:c'],['CL:al','PK:be'],['CL:be','PK:al'],['KT:y','PK:th'],['PK:d','IP:d'],['CL:al','IP:q'],['KT:y','IP:th'],
   ['AM:y','VD:u'],['VD:p','R1:a'],['R1:b','G:g'],['VD:n','G:g'],['VA:y','S1:a'],['AM:y','S1:b'],['VA:y','CP:p'],['AM:y','CP:n'],['KQ:y','MX:u1'],['KD:y','MX:u2'],['MX:y','DX:u'],['DX:y1','K2:u']],solve);
 const r=U.infer(mk({}));R.mixed={errors:r.errors,warnings:r.warnings,mux:U.txt(r.out('MX')),d:U.txt(r.out('DX','y1')),k2:U.txt(r.out('K2'))};
 R.mixed.strict=U.infer(mk({units:'strict'})).errors;}
// every tutorial: no error and no warning from the check (the defaults of each)
{let n=0;const msgs=[];for(const t of T.list){const o={};for(const op of t.options)o[op.k]=op.def;const p=t.build(o);n++;const f=SUB.needs(p)?SUB.flatten(p).project:p;const r=U.infer(f);
  if(r.errors.length||r.warnings.length)msgs.push([t.id,r.errors,r.warnings]);}
 R.tutorials={n,msgs};}
// the units the scopes show: a gain of a current with «=», an integrator of a speed, a machine's dq currents
{const p=pr([C('V1','VDC',{V:30}),C('M1','SM'),C('G','GND'),C('I1','INT'),C('GN','GAIN',{K:-1,unit:'='}),C('F','F2',{f0:100})],[['V1:p','M1:a'],['M1:b','G:g'],['M1:c','G:g'],['V1:n','G:g'],['M1:w','I1:u'],['M1:iq','GN:u'],['GN:y','F:u']]);
 const r=U.infer(p);R.scope={int:U.txt(r.out('I1')),gn:U.txt(r.out('GN')),f:U.txt(r.out('F')),te:U.txt(r.out('M1','te'))};
 const net=MNA.buildNetlist(p);R.scope.net=!!net.units&&net.units.out('F').u;}
// 4.0 (question 1 of 3.19): product and division multiply units; units compare by their powers; a gain «·Ω» or «/V»
{R.alg={va:U.mulU('V','A'),tw:U.mulU('N·m','rad/s'),vv:U.mulU('V','V',-1),va2:U.mulU('V','A',-1),pu:U.mulU('pu','pu'),vhz:U.mulU('V','Hz'),
  unk:U.mulU(null,'V'),wb:U.eqU('Wb','V·s'),w:U.eqU('V·A','W'),va3:U.eqU('V','A'),fmt:U.fmtU(U.dims('V/(A·s)'))};
 // P = v·i into nothing, D = v_ref/V_dc into the PWM (no warning), τ·ω, a gain «·Ω» of a current, W into the V input of a source (a warning)
 const p=pr([C('V1','VDC',{V:30}),C('R1','R',{R:5}),C('G','GND'),C('VM','VM'),C('AM','AM'),C('KR','CONST',{v:15,unit:'V'}),
   C('P','MUL'),C('D','DIV'),C('PW','PWM',{fs:20e3}),C('KO','CONST',{v:2,unit:'Ω'}),C('VR','GAIN',{K:5,unit:'·Ω'}),C('VO','GAIN',{K:0.1,unit:'/V'}),
   C('VS','VDC',{ctl:'sig'}),C('R2','R',{R:1}),C('M1','DCM'),C('TW','MUL'),C('S1','SUM',{signs:'+-'})],
  [['V1:p','AM:a'],['AM:b','R1:a'],['R1:b','G:g'],['V1:n','G:g'],['VM:p','V1:p'],['VM:n','G:g'],['VM:y','P:a'],['AM:y','P:b'],
   ['KR:y','D:a'],['VM:y','D:b'],['D:y','PW:d'],['AM:y','VR:u'],['VM:y','VO:u'],['P:y','VS:u'],['VS:p','R2:a'],['R2:b','G:g'],['VS:n','G:g'],
   ['V1:p','M1:a'],['M1:b','G:g'],['M1:te','TW:a'],['M1:w','TW:b'],['TW:y','S1:a'],['P:y','S1:b']]);
 const r=U.infer(p),o=id=>U.txt(r.out(id));
 R.alg.circ={p:o('P'),d:o('D'),vr:o('VR'),vo:o('VO'),tw:o('TW'),s:o('S1'),errors:r.errors,warnings:r.warnings};}
process.stdout.write(JSON.stringify(R));
