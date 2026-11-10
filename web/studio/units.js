'use strict';
// Units and vector types of signal ports (3.19, ROADMAP §3, decision 19). Pure functions on project JSON (no DOM), like
// bus.js. mna.js buildNetlist calls check() on the flat circuit (after SubCircuit.flatten, before Bus.expand, so a bus
// still carries its type), and the app reads the units of the outputs for the scopes and the parameter panel.
//
// What a signal carries: {u: unit, f: frame, c: component}, each one null when nothing declares it.
//  - unit: 'V', 'A', 'rad', 'rad/s', 'N·m', 'V·s', '1' (dimensionless, e.g. a duty ratio) or what the user writes on a
//    constant or a gain;
//  - frame of a vector: 'abc', 'ab' (αβ) or 'dq'; a scalar of a frame also has its component ('a', 'al', 'd', …).
// Where a type comes from: meters and machines declare it, Clarke/Park and the PLL change the frame and keep the unit,
// element-wise blocks that do not change dimensions (saturation, filters, z⁻¹, rate limiter, …) pass it on, the
// integrator multiplies the unit by s (rad/s → rad), a sum keeps what its inputs agree on, a gain has the unit of its
// parameter «Μονάδα εξόδου» ('=' = the unit of the input), the Mux has the frame of its parameter or of its inputs.
// Everything else (product, division, PI, code blocks, logic) has no unit: an unknown matches anything.
//
// The checks (project.solve.units: 'warn' default, 'strict', 'off'):
//  - a frame into an input of another frame (dq into Clarke, αβ into the d, q inputs of inverse Park): an error, the
//    solver does not run (with 'off' nothing is checked);
//  - another component of the same frame (β into the α input): a warning;
//  - another unit (A into the V input of a controlled source, V + A in a sum, V against A in a comparator): a warning,
//    an error with 'strict'.
// How it grows (4.x, additions only): new units and frames are new strings, new parts declare theirs in OUT/EXPECT;
// a part with nothing declared stays «unknown», so an older file never gets a new error from a part it already had.
(function(root){
 const P=root.Parts||(typeof require!=='undefined'?require('./parts.js'):null);
 const B=root.Bus||(typeof require!=='undefined'?require('./bus.js'):null);
 const FR={abc:['a','b','c'],ab:['al','be'],dq:['d','q']};
 const FRN={abc:'abc',ab:'αβ',dq:'dq'},CN={a:'a',b:'b',c:'c',al:'α',be:'β',d:'d',q:'q'};
 const PASSIVE=new Set(['JUNC','TAGO','TAGI','PORT','SIN','SOUT','DISP']);
 const T=(u=null,f=null,c=null)=>({u:u||null,f:f||null,c:c||null});
 const NONE=T();
 const qOf=c=>({...P.defaults(c.type),...(c.params||{})});
 const isBus=p=>p.conn==='bus';
 const txt=t=>!t?'χωρίς τύπο':[t.u,t.c?FRN[t.f]+' '+CN[t.c]:t.f?FRN[t.f]:null].filter(Boolean).join(', ')||'χωρίς τύπο';
 // what all known values agree on (null when none or when two disagree)
 const agree=xs=>{let v=null;for(const x of xs){if(!x)continue;if(v===null)v=x;else if(v!==x)return null;}return v;};
 const intU=u=>!u?null:u==='rad/s'?'rad':u==='1'?'s':u.endsWith('/s')?u.slice(0,-2):u+'·s';
 const unitParam=v=>{const s=String(v??'').trim();return s||null;};
 // the type of output `pin` of part c, given the type at each of its inputs (inp(pin) → type)
 function outType(c,pin,inp){const t=c.type,p=qOf(c);
  const pass=k=>inp(k),comb=ks=>{const ts=ks.map(inp);return T(agree(ts.map(x=>x.u)),agree(ts.map(x=>x.f)),agree(ts.map(x=>x.c)));};
  const sepU=ks=>agree(ks.map(k=>inp(k).u));
  switch(t){
   case 'VM':case 'VP':return T('V');case 'AM':case 'IP':return T('A');case 'MEAS':return T(p.qty==='V'?'V':'A');
   case 'SH':return p.in==='sig'?pass('u'):T(p.qty==='V'?'V':'A');
   case 'CONST':return T(unitParam(p.unit));
   case 'GAIN':{const i=inp('u'),s=unitParam(p.unit);return T(s==='='?i.u:s,i.f,i.c);}
   case 'SUM':return comb(String(p.signs||'+-').length>=3?['a','b','c']:['a','b']);
   case 'SAT':case 'LPF':case 'F2':case 'RLIM':case 'UD':case 'RT':return pass('u');
   case 'INT':{const i=inp('u');return T(p.wrap==='2pi'?'rad':intU(i.u),i.f,i.c);}
   case 'PIB':{const i=inp('u');return T(null,i.f,i.c);}
   case 'CLARKE':{const u=isBus(p)?inp('abc').u:sepU(['a','b','c']);return T(u,'ab',isBus(p)?null:pin);}
   case 'ICLARKE':{const u=isBus(p)?inp('ab').u:sepU(['al','be']);return T(u,'abc',isBus(p)?null:pin);}
   case 'PARK':{const u=isBus(p)?inp('ab').u:sepU(['al','be']);return T(u,'dq',isBus(p)?null:pin);}
   case 'IPARK':{const u=isBus(p)?inp('dq').u:sepU(['d','q']);return T(u,'ab',isBus(p)?null:pin);}
   case 'PLL':return pin==='th'?T('rad'):pin==='w'?T('rad/s'):T(isBus(p)?inp('abc').u:sepU(['a','b','c']));
   case 'FEST':return pin==='th'?T('rad'):pin==='psi'?T('V·s'):T('rad/s');
   case 'MOD3':return isBus(p)?T('1','abc'):T('1','abc',{da:'a',db:'b',dc:'c'}[pin]);
   case 'DCM':case 'IM':case 'SM':case 'SRM':
    return pin==='te'?T('N·m'):pin==='w'?T('rad/s'):['th','thf','thr'].includes(pin)?T('rad'):pin==='psi'?T('V·s'):pin==='id'||pin==='iq'?T('A','dq',pin.slice(1)):/^i\d$/.test(pin)?T('A'):NONE;
   case 'MUX':{const n=Math.max(2,Math.min(8,Math.round(+p.n)||3)),ins=Array.from({length:n},(_,i)=>inp('u'+(i+1))),u=agree(ins.map(x=>x.u));
    const fr=p.frame||'auto';if(FR[fr])return T(u,fr);if(fr==='none')return T(u);
    for(const [f,cs] of Object.entries(FR))if(cs.length===n&&ins.every((x,i)=>x.f===f&&x.c===cs[i]))return T(u,f);
    const fv=agree(ins.map(x=>x.c?null:x.f));return T(u,ins.every(x=>x.f&&!x.c)?fv:null);}
   case 'DEMUX':{const n=Math.max(2,Math.min(8,Math.round(+p.n)||3)),i=inp('u'),k=+String(pin).slice(1)-1;
    return i.f&&!i.c&&FR[i.f].length===n?T(i.u,i.f,FR[i.f][k]):T(i.u);}
   case 'BSEL':{const i=inp('u'),ix=B?B.selIdx(c):[];return i.f&&!i.c&&ix.length===1&&FR[i.f][ix[0]-1]?T(i.u,i.f,FR[i.f][ix[0]-1]):T(i.u);}
   default:return NONE;}}
 // what input `pin` of part c expects (null = anything)
 function expect(c,pin){const t=c.type,p=qOf(c),fc=(f,u=null)=>isBus(p)?T(u,f):T(u,f,pin);
  switch(t){
   case 'CLARKE':return fc('abc');case 'ICLARKE':return fc('ab');
   case 'PARK':return pin==='th'?T('rad'):fc('ab');
   case 'IPARK':return pin==='th'?T('rad'):fc('dq');
   case 'PLL':return isBus(p)?T(null,'abc'):T(null,'abc',pin);
   case 'MOD3':return pin==='vdc'?T('V'):isBus(p)?T('V','abc'):T('V','abc',{va:'a',vb:'b',vc:'c'}[pin]);
   case 'FEST':return pin==='wr'?T('rad/s'):T('A','ab',pin);
   case 'VDC':return pin==='u'?T('V'):null;case 'IDC':return pin==='u'?T('A'):null;case 'PWM':return pin==='d'?T('1'):null;
   case 'DCM':case 'IM':case 'SM':case 'SRM':return pin==='tl'?T('N·m'):null;
   case 'MUX':{const fr=p.frame||'auto',n=Math.max(2,Math.min(8,Math.round(+p.n)||3)),k=+String(pin).slice(1)-1;return FR[fr]&&FR[fr].length===n?T(null,fr,FR[fr][k]):null;}
   default:return null;}}

 // types of every signal net and the messages: {type(pinKey), out(id, pin), errors, warnings, mode}
 function infer(project,opts={}){
  const mode=['warn','strict','off'].includes(opts.mode??project?.solve?.units)?(opts.mode??project.solve.units):'warn';
  const empty={type:()=>NONE,out:()=>null,errors:[],warnings:[],mode};
  if(!P||!B||!project?.components?.length)return empty;
  const G=B.graph(project),{comps,byId,par,find}=G;
  const kind=k=>{const c=byId.get(G.cidOf(k));return !c||c.type==='JUNC'?null:P.pinKind(c,G.pinOf(k));};
  const lab=k=>{const c=byId.get(G.cidOf(k));return (c?.label||c?.id||'?')+(c?.type==='JUNC'?'':'.'+G.pinOf(k));};
  // drivers: output pins of parts that make a signal (not junctions, tags or ports)
  const drv=new Map();for(const c of comps){if(PASSIVE.has(c.type))continue;for(const [pn,v] of Object.entries(P.sigPins(c)))if(v.dir==='out'){const k=c.id+':'+pn;if(par.has(k)){const r=find(k);if(!drv.has(r))drv.set(r,k);}}}
  const ty=new Map(),netT=k=>par.has(k)?ty.get(find(k))||NONE:NONE;
  const same=(a,b)=>a.u===b.u&&a.f===b.f&&a.c===b.c;
  for(let pass=0;pass<64;pass++){let ch=false;
   for(const [r,k] of drv){const c=byId.get(G.cidOf(k));let t;try{t=outType(c,G.pinOf(k),pn=>netT(c.id+':'+pn));}catch(e){t=NONE;}
    if(!same(t,ty.get(r)||NONE)){ty.set(r,t);ch=true;}}
   if(!ch)break;}
  const errors=[],warnings=[];
  if(mode!=='off'){
   const seen=new Set(),uWarn=m=>(mode==='strict'?errors:warnings).push(m);
   for(const c of comps){if(PASSIVE.has(c.type))continue;
    for(const [pn,v] of Object.entries(P.sigPins(c))){if(v.dir!=='in')continue;const k=c.id+':'+pn;if(!par.has(k))continue;const r=find(k),d=drv.get(r);if(!d)continue;
     const e=expect(c,pn),g=netT(k);if(!e||seen.has(k))continue;seen.add(k);
     if(e.f&&g.f&&e.f!==g.f)errors.push(`${lab(k)}: είσοδος ${FRN[e.f]}, αλλά έρχεται ${FRN[g.f]} από ${lab(d)}. Βάλε τον μετασχηματισμό που λείπει (Clarke, Park ή τους αντίστροφους) ή διόρθωσε τη σύνδεση.`);
     else if(e.c&&g.c&&e.f===g.f&&e.c!==g.c)warnings.push(`${lab(k)}: περιμένει τη συνιστώσα ${CN[e.c]}, έρχεται η ${CN[g.c]} από ${lab(d)}.`);
     if(e.u&&g.u&&e.u!==g.u)uWarn(`${lab(k)}: περιμένει ${e.u}, έρχεται ${g.u} από ${lab(d)}.`);}
    // inputs that are added or compared must agree
    if(c.type==='SUM'||c.type==='CMP'){const ks=c.type==='CMP'?['p','n']:String(qOf(c).signs||'+-').length>=3?['a','b','c']:['a','b'];
     const us=ks.map(x=>[x,netT(c.id+':'+x).u]).filter(x=>x[1]);if(us.length>1&&us.some(x=>x[1]!==us[0][1]))
      uWarn(`${c.label||c.id}: ${c.type==='SUM'?'άθροισμα':'σύγκριση'} με διαφορετικές μονάδες (${us.map(([x,u])=>x+': '+u).join(', ')}).`);}}}
  const out=(id,pin)=>{const c=byId.get(id);if(!c)return null;const os=Object.entries(P.sigPins(c)).filter(([,v])=>v.dir==='out').map(([k])=>k);const pn=pin||os[0];if(!pn)return null;return netT(id+':'+pn);};
  return {type:netT,out,errors,warnings,mode,txt};}

 // for buildNetlist: throws the errors (one message), returns the warnings
 class UnitError extends Error{}
 function check(project){const r=infer(project);if(r.errors.length)throw new UnitError(r.errors.slice(0,4).join(' ')+(r.errors.length>4?` (και ${r.errors.length-4} ακόμη)`:''));return r;}

 const api={FR,FRN,CN,T,outType,expect,infer,check,txt,UnitError};
 root.Units=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
