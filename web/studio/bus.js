'use strict';
// Buses and vectors (3.18, ROADMAP §3): one wire that carries several signals (abc, αβ, dq) or several conductors (a
// three-phase connection). Pure functions on project JSON (no DOM), like subcircuit.js:
//  - widths(project): the width of every pin and wire, inferred from what is connected (the editor draws it),
//  - expand(project): the same circuit with scalar wires only. mna.js buildNetlist calls it right after
//    SubCircuit.flatten, so the browser solver, SciPy, pcl, MATLAB and the workers never see a bus.
//
// Where a width comes from:
//  - Mux: the output carries its inputs in order (an input that is a bus gives all its elements); Demux splits a bus
//    into n equal parts; the bus selector picks elements by index (1, 2, …); the electrical bus (EBUS) joins n
//    conductors into one bus pin. These four are only wiring: expand() takes them out.
//  - parts and blocks with a bus pin (conn = 'bus': three-phase source, machines, Clarke/Park, PLL, modulator): the bus
//    pin stands for separate pins of the same part ('abc' = a, b, c). expand() gives the part back with conn = 'sep'.
//  - ports of a subcircuit with a width > 1 (flatten keeps it on the junction as $w), a constant with values separated
//    by ';' ("10; 0").
//  - element-wise blocks (gain, sum, product, division, saturation, comparator, logic, integrator, low-pass, z⁻¹, PI):
//    with a bus at an input the block becomes one copy per element (<id>[1], <id>[2], …). A scalar input goes to every
//    copy, and a parameter written with ';' gives one value per copy ("1; -1").
// Everything else has width 1; a junction, a tag (Goto / From) and a port of width 1 take the width of what they join.
// Two widths on one net are an error with the pins that disagree.
//
// Named wires (w.link, 3.18): every wire with the same name joins one net, like Goto / From and for electrical nodes
// too. buildNetlist joins them on scalar nets; here they join bus nets element by element.
(function(root){
 const P=root.Parts||(typeof require!=='undefined'?require('./parts.js'):null);
 class BusError extends Error{}
 const WIRING=new Set(['MUX','DEMUX','BSEL','EBUS']);
 const ELEMENTWISE=new Set(['GAIN','SUM','MUL','DIV','SAT','CMP','LOGIC','INT','LPF','UD','PIB','CONST']);
 const FREE=new Set(['JUNC','TAGO','TAGI']);
 const COND='abcdef';
 const PORT_PIN={PORT:'p',SIN:'y',SOUT:'u'};
 const qOf=c=>({...P.defaults(c.type),...(c.params||{})});
 const nOf=(c,lo,hi,def)=>{const n=Math.round(+qOf(c).n);return Number.isFinite(n)?Math.max(lo,Math.min(hi,n)):def;};
 const lab=c=>c?.label||c?.id||'?';
 // the bus pins of a part and the separate pins each one stands for: {abc: ['a', 'b', 'c']}
 function members(c){const d=P.PARTS[c?.type];return d&&typeof d.bus==='function'?d.bus(qOf(c))||{}:{};}
 const splitVec=v=>typeof v==='string'&&v.includes(';')?v.split(';').map(s=>s.trim()):null;
 function constWidth(c){const s=splitVec(String(qOf(c).v??''));return s?s.length:1;}
 function selIdx(c){return String(qOf(c).idx??'').split(/[,;\s]+/).filter(Boolean).map(s=>Math.round(+s)).filter(k=>k>=1);}
 const portWidth=c=>{const w=Math.round(+c.params?.width||1);return w>1?Math.min(w,64):1;};

 // does the project have anything wider than one signal (otherwise expand() leaves it as it is)
 function needs(project){
  for(const c of project?.components||[]){const t=c.type;
   if(WIRING.has(t))return true;
   if(t==='CONST'&&constWidth(c)>1)return true;
   if(t==='JUNC'&&+c.params?.$w>1)return true;
   if(PORT_PIN[t]&&portWidth(c)>1)return true;
   if(t==='SUB'&&(c.params?.$ports||[]).some(p=>+p.w>1))return true;
   if(Object.keys(members(c)).length)return true;}
  return false;}

 // pins joined at pin level: wires, signal sources by name (in_<pin>), Goto / From, named wires
 function graph(project){
  const comps=(project.components||[]).filter(c=>P.PARTS[c.type]),byId=new Map(comps.map(c=>[c.id,c]));
  const par=new Map(),find=k=>{let r=k;while(par.get(r)!==r)r=par.get(r);while(par.get(k)!==r){const n=par.get(k);par.set(k,r);k=n;}return r;};
  const union=(a,b)=>{const ra=find(a),rb=find(b);if(ra!==rb)par.set(ra,rb);};
  for(const c of comps)for(const p of Object.keys(P.pinsOf(c)))par.set(c.id+':'+p,c.id+':'+p);
  const cidOf=k=>k.slice(0,k.lastIndexOf(':')),pinOf=k=>k.slice(k.lastIndexOf(':')+1);
  const kind=k=>{const c=byId.get(cidOf(k));return !c?null:c.type==='JUNC'?'j':P.pinKind(c,pinOf(k));};
  const links=[];
  for(const w of project.wires||[]){const a=w.a.c+':'+w.a.p,b=w.b.c+':'+w.b.p;if(par.has(a)&&par.has(b)){union(a,b);links.push({a,b});}}
  for(const c of comps)for(const [k,v] of Object.entries(c.params||{})){if(!k.startsWith('in_')||!v)continue;const a=c.id+':'+k.slice(3),b=String(v);
   if(par.has(a)&&par.has(b)&&kind(a)==='in'&&kind(b)==='out'){union(a,b);links.push({a,b});}}
  const nm=c=>String(c.params?.name||'').trim(),go=new Map();for(const c of comps)if(c.type==='TAGO'&&!go.has(nm(c)))go.set(nm(c),c);
  for(const c of comps)if(c.type==='TAGI'){const g=go.get(nm(c));if(g){union(g.id+':u',c.id+':y');links.push({a:g.id+':u',b:c.id+':y'});}}
  const named=new Map();for(const w of project.wires||[]){if(!w.link||!w.name)continue;const a=w.a.c+':'+w.a.p;if(!par.has(a))continue;const n=String(w.name);
   if(named.has(n)){union(named.get(n),a);links.push({a:named.get(n),b:a});}else named.set(n,a);}
  return {comps,byId,par,find,links,cidOf,pinOf};}

 // the width of every net: fixed widths first, then what follows from Mux, Demux and the element-wise blocks; a net that
 // nothing decides (only junctions, tags or free pins) is one signal
 function solve(G){
  const {comps,byId,par,find}=G,W=new Map(),from=new Map(),errors=[],bad=new Set(),copies=new Map();
  const wOf=k=>par.has(k)?W.get(find(k))||0:0;
  // a pin for the messages: a port of a subcircuit (a junction after flatten) by its path, X1/abc
  const pinLab=k=>{const c=byId.get(G.cidOf(k));return c?.type==='JUNC'?lab(c):lab(c)+'.'+G.pinOf(k);};
  const isEl=k=>{const c=byId.get(G.cidOf(k));return !!c&&c.type!=='JUNC'&&P.pinKind(c,G.pinOf(k))==='el';};
  const set=(k,w,src)=>{if(!par.has(k))return false;const r=find(k),o=W.get(r)||0;if(!o){W.set(r,w);from.set(r,src);return true;}
   if(o!==w&&!bad.has(r)){bad.add(r);const el=isEl(src)||isEl(from.get(r));
    errors.push(`Ο ίδιος κόμβος έχει πλάτος ${o} (${pinLab(from.get(r))}) και ${w} (${pinLab(src)}). ${el?'Βάλε δίαυλο αγωγών ανάμεσα (χωρίζει τον δίαυλο σε αγωγούς)':'Βάλε Demux, επιλογή από δίαυλο ή Mux ανάμεσα'}, ή άλλαξε το πλάτος της θύρας.`);}
   return false;};
  const sig=(c,dir)=>Object.entries(P.sigPins(c)).filter(([,v])=>v.dir===dir).map(([k])=>c.id+':'+k);
  for(const c of comps){const t=c.type,id=c.id,k=p=>id+':'+p;
   if(t==='JUNC'){if(+c.params?.$w>1)set(k('j'),+c.params.$w,k('j'));continue;}
   if(t==='SUB'){for(const p of c.params?.$ports||[])if(+p.w>1)set(k(p.name),+p.w,k(p.name));continue;}
   if(PORT_PIN[t]){if(portWidth(c)>1)set(k(PORT_PIN[t]),portWidth(c),k(PORT_PIN[t]));continue;}
   if(FREE.has(t)||t==='MUX'||t==='DEMUX')continue;
   if(t==='BSEL'){set(k('y'),Math.max(1,selIdx(c).length),k('y'));continue;}
   if(t==='EBUS'){const n=nOf(c,2,6,3);for(let i=0;i<n;i++)set(k(COND[i]),1,k(COND[i]));set(k('bus'),n,k('bus'));continue;}
   if(t==='CONST'){const n=constWidth(c);copies.set(id,n);set(k('y'),n,k('y'));continue;}
   if(ELEMENTWISE.has(t))continue;
   const m=members(c);for(const p of Object.keys(P.pinsOf(c)))set(k(p),m[p]?m[p].length:1,k(p));}
  const dyn=comps.filter(c=>c.type==='MUX'||c.type==='DEMUX'||(ELEMENTWISE.has(c.type)&&c.type!=='CONST'));
  const sum=a=>a.reduce((s,x)=>s+x,0);
  for(let guard=0;guard<100000;guard++){let ch=false;
   for(const c of dyn){const t=c.type,id=c.id;
    if(t==='MUX'){const n=nOf(c,2,8,3),ws=Array.from({length:n},(_,i)=>wOf(id+':u'+(i+1)));if(ws.every(x=>x>0))ch=set(id+':y',sum(ws),id+':y')||ch;continue;}
    if(t==='DEMUX'){const n=nOf(c,2,8,3),ys=Array.from({length:n},(_,i)=>id+':y'+(i+1)),wi=wOf(id+':u');
     if(wi>0){if(wi%n){if(!bad.has(id)){bad.add(id);errors.push(`Demux ${lab(c)}: δίαυλος πλάτους ${wi} δεν χωρίζεται σε ${n} ίσα μέρη.`);}}else for(const y of ys)ch=set(y,wi/n,id+':u')||ch;}
     else{const ws=ys.map(wOf);if(ws.every(x=>x>0))ch=set(id+':u',sum(ws),ys[0])||ch;}
     continue;}
    const ws=sig(c,'in').map(wOf),big=Math.max(1,...ws);
    if(big>1||ws.every(x=>x>0)){copies.set(id,big);for(const o of sig(c,'out'))ch=set(o,big,sig(c,'in')[ws.indexOf(big)]||o)||ch;}}
   if(ch)continue;
   let free=null;for(const k of par.keys()){const r=find(k);if(!W.get(r)&&(free===null||r<free))free=r;}
   if(free===null)break;W.set(free,1);from.set(free,free);}
  for(const c of dyn){if(!ELEMENTWISE.has(c.type))continue;const n=copies.get(c.id)||1;
   for(const k of sig(c,'in')){const x=wOf(k)||1;if(x!==1&&x!==n&&!bad.has(k)){bad.add(k);errors.push(`${lab(c)}: η είσοδος ${G.pinOf(k)} έχει πλάτος ${x}, ενώ το μπλοκ δουλεύει σε ${n} στοιχεία (κάθε είσοδος έχει πλάτος 1 ή ${n}).`);}}}
  for(const c of comps)if(c.type==='BSEL'){const wi=wOf(c.id+':u')||1,ix=selIdx(c),mx=Math.max(0,...ix);
   if(!ix.length)errors.push(`Επιλογή από δίαυλο ${lab(c)}: γράψε ποια στοιχεία, π.χ. «1, 2».`);else if(mx>wi)errors.push(`Επιλογή από δίαυλο ${lab(c)}: ζητά το στοιχείο ${mx}, αλλά ο δίαυλος έχει ${wi}.`);}
  return {width:k=>wOf(k)||1,copies:id=>copies.get(id)||1,errors};}

 // widths for the editor (never throws): pin → width, wire → width, and the messages
 function widths(project){
  if(!needs(project))return {pin:()=>1,wire:()=>1,errors:[],any:false};
  const G=graph(project),S=solve(G);
  return {pin:k=>S.width(k),wire:w=>S.width(w.a.c+':'+w.a.p),errors:S.errors,any:true,copies:S.copies};}

 // the parameters of copy r of an element-wise block: a value with ';' gives one value per element
 function perElement(c,n){const out=Array.from({length:n},()=>({}));
  for(const [k,v] of Object.entries(c.params||{})){const s=splitVec(v);
   if(!s){for(const o of out)o[k]=v;continue;}
   if(s.length!==n&&s.length!==1)throw new BusError(`${lab(c)}: η παράμετρος ${k} έχει ${s.length} τιμές για ${n} στοιχεία (γράψε μία ή ${n}, χωρισμένες με «;»).`);
   out.forEach((o,i)=>o[k]=s.length===1?s[0]:s[i]);}
  return out;}

 // the same circuit without buses: {project, warnings, vec: {<block id>: copies}}
 function expand(project){
  if(!needs(project))return {project,warnings:[],vec:{}};
  const G=graph(project),S=solve(G);
  if(S.errors.length)throw new BusError(S.errors.slice(0,4).join(' '));
  const w=S.width,bpar=new Map(),bfind=k=>{let r=k;while(bpar.get(r)!==r)r=bpar.get(r);while(bpar.get(k)!==r){const n=bpar.get(k);bpar.set(k,r);k=n;}return r;};
  const add=k=>{if(!bpar.has(k))bpar.set(k,k);},bunion=(a,b)=>{add(a);add(b);const ra=bfind(a),rb=bfind(b);if(ra!==rb)bpar.set(ra,rb);};
  const bit=(k,i)=>w(k)>1?k+'#'+i:k;
  for(const k of G.par.keys()){const n=w(k);if(n===1)add(k);else for(let i=1;i<=n;i++)add(k+'#'+i);}
  for(const L of G.links)for(let i=1;i<=w(L.a);i++)bunion(bit(L.a,i),bit(L.b,i));
  const out=[],real=new Set(),vec={};
  for(const c of G.comps){const t=c.type,id=c.id,k=p=>id+':'+p;
   if(t==='MUX'){let j=0;for(let i=1;i<=nOf(c,2,8,3);i++){const u=k('u'+i);for(let e=1;e<=w(u);e++)bunion(bit(k('y'),++j),bit(u,e));}continue;}
   if(t==='DEMUX'){let j=0;for(let i=1;i<=nOf(c,2,8,3);i++){const y=k('y'+i);for(let e=1;e<=w(y);e++)bunion(bit(k('u'),++j),bit(y,e));}continue;}
   if(t==='BSEL'){selIdx(c).forEach((ix,j)=>bunion(bit(k('y'),j+1),bit(k('u'),ix)));continue;}
   if(t==='EBUS'){for(let i=0;i<nOf(c,2,6,3);i++)bunion(bit(k('bus'),i+1),k(COND[i]));continue;}
   if((t==='JUNC'&&w(k('j'))>1)||(t==='TAGO'&&w(k('u'))>1)||(t==='TAGI'&&w(k('y'))>1))continue;
   if(ELEMENTWISE.has(t)&&S.copies(id)>1){const n=S.copies(id),vals=perElement(c,n);vec[id]=n;
    for(let r=1;r<=n;r++){const rid=id+'['+r+']',q={...c,id:rid,label:lab(c)+'['+r+']',params:vals[r-1]};delete q.live;delete q.liveBase;out.push(q);
     for(const p of Object.keys(P.pinsOf(q))){const rk=rid+':'+p;real.add(rk);bunion(rk,bit(k(p),w(k(p))>1?r:1));}}
    continue;}
   const m=members(c);
   if(Object.keys(m).length){const q={...c,params:{...(c.params||{}),conn:'sep'}};out.push(q);
    for(const [bp,ms] of Object.entries(m))ms.forEach((mp,i)=>bunion(bit(k(bp),i+1),k(mp)));
    for(const p of Object.keys(P.pinsOf(q)))real.add(k(p));continue;}
   out.push(c);for(const p of Object.keys(P.pinsOf(c)))if(w(k(p))===1)real.add(k(p));}
  // a signal source by name stays only between two scalar pins that are still there; the others become wires
  for(let i=0;i<out.length;i++){const c=out[i];let q=null;
   for(const [pk,v] of Object.entries(c.params||{})){if(!pk.startsWith('in_')||!v)continue;if(real.has(c.id+':'+pk.slice(3))&&real.has(String(v)))continue;
    q=q||{...c,params:{...c.params}};delete q.params[pk];}
   if(q)out[i]=q;}
  const groups=new Map();for(const k of bpar.keys()){const r=bfind(k);if(!groups.has(r))groups.set(r,[]);groups.get(r).push(k);}
  const wires=(project.wires||[]).filter(x=>real.has(x.a.c+':'+x.a.p)&&real.has(x.b.c+':'+x.b.p));
  const list=[...groups.values()].map(g=>g.sort()).sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0);let nj=0;
  for(const keys of list){if(keys.every(x=>real.has(x)))continue;const rk=keys.filter(x=>real.has(x));if(rk.length<2)continue;
   const jid='~J'+(++nj);out.push({id:jid,type:'JUNC',x:0,y:0,rot:0,flip:false,label:jid,params:{}});
   rk.forEach((x,i)=>{const at=x.lastIndexOf(':');wires.push({id:jid+'w'+(i+1),a:{c:jid,p:'j'},b:{c:x.slice(0,at),p:x.slice(at+1)},pts:[]});});}
  return {project:{...project,components:out,wires},warnings:[],vec};}

 const api={WIRING,ELEMENTWISE,COND,needs,members,widths,expand,constWidth,selIdx,BusError};
 root.Bus=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
