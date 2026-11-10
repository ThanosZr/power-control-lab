'use strict';
// Subcircuits (3.17, ROADMAP §9): definitions kept in the project, instances placed like parts, and one flat circuit
// for the solvers. Pure functions on project JSON (no DOM): the editor, the browser solver, the SciPy export, the pcl
// runner and the workers all go through flatten(), so they see the same circuit.
//
// project.subcircuits = { <name>: { title, desc, version, components, wires,
//                                   params: [{k, label, unit, def, min, max, bind: [[<inner id>, <param>], …]}] } }
// instance = {id, type:'SUB', params: {def: <name>, <public param>: value, '<inner path>.<param>': value (one instance
//            only), '$ports': [...], '$title': ...}}   ($… = what the editor shows, copied from the definition by sync)
// Inside a definition the ports are parts: PORT (electrical), SIN (signal into the subcircuit), SOUT (signal out of
// it). The name of a port is the name of the instance's pin.
//
// Flat circuit: the parts of instance X1 become X1/<id> (nested: X1/X2/<id>), labels X1/<label>, ports become junctions
// (JUNC), so a wire to X1.p is a wire to X1/<port>. References inside a definition (switch → PWM, sensor, clock, the
// source of a signal input) look in the definition first and then outwards; from outside, a path such as X1/L1 reaches
// a part inside an instance. Goto / From names and wire names are local to the instance ("/name" = the name of the top
// level; for wires from 3.19). Ground
// is one node everywhere. A definition that contains itself (directly or through others) is an error; a missing
// definition leaves the instance out with a message.
(function(root){
 const P=root.Parts||(typeof require!=='undefined'?require('./parts.js'):null);
 const PORT_KIND={PORT:'el',SIN:'in',SOUT:'out'},PORT_PIN={PORT:'p',SIN:'y',SOUT:'u'};
 // outward direction of each port symbol in its own coordinates (the flag points away from the inner circuit)
 const PORT_OUT={PORT:[1,0],SIN:[-1,0],SOUT:[1,0]};
 const SIDES=['l','r','t','b'];
 const clone=o=>JSON.parse(JSON.stringify(o));
 const isPort=c=>!!PORT_KIND[c?.type];
 const okName=n=>typeof n==='string'&&/^[^\s:./$][^:./]*$/.test(n)&&n!=='def';
 class SubcircuitError extends Error{}

 function needs(project){return !!(project&&(project.components||[]).some(c=>c.type==='SUB'||isPort(c)));}

 // the ports of a definition, ordered along each side as drawn: [{id, name, kind, side}]
 function portsOf(def){
  const out=[],seen=new Set();
  for(const c of def?.components||[]){if(!isPort(c))continue;
   let name=String(c.params?.name??'').trim();if(!okName(name)||seen.has(name))name=c.id;seen.add(name);
   let side=String(c.params?.side||'auto');
   if(!SIDES.includes(side)){const [dx,dy]=P.xf({x:0,y:0,rot:c.rot||0,flip:!!c.flip},PORT_OUT[c.type]);
    side=Math.abs(dx)>=Math.abs(dy)?(dx<0?'l':'r'):(dy<0?'t':'b');}
   const w=Math.round(+c.params?.width||1);
   out.push({id:c.id,name,kind:PORT_KIND[c.type],side,x:c.x||0,y:c.y||0,...(w>1?{w}:{})});}
  const key=p=>p.side==='l'||p.side==='r'?p.y:p.x;
  out.sort((a,b)=>SIDES.indexOf(a.side)-SIDES.indexOf(b.side)||key(a)-key(b)||(a.id<b.id?-1:1));
  return out.map(({id,name,kind,side,w})=>({id,name,kind,side,...(w?{w}:{})}));}

 // symbol of an instance (parts.js draws it)
 const layout=ports=>P.subLayout(ports);

 // all the instances of a project (top level and inside definitions): [{doc, comp, where}] (where = null or a name)
 function instances(project,defName){const out=[];
  const scan=(doc,where)=>{for(const c of doc.components||[])if(c.type==='SUB'&&(!defName||c.params?.def===defName))out.push({doc,comp:c,where});};
  scan(project,null);for(const [n,d] of Object.entries(project.subcircuits||{}))scan(d,n);return out;}

 // the definitions used by a definition (directly), and a cycle if there is one
 function cycleOf(project){const defs=project.subcircuits||{},state=new Map();let found=null;
  const visit=(n,path)=>{if(found)return;const st=state.get(n);if(st===1){found=[...path.slice(path.indexOf(n)),n];return;}if(st===2)return;
   state.set(n,1);for(const c of defs[n]?.components||[])if(c.type==='SUB'&&defs[c.params?.def])visit(c.params.def,[...path,n]);state.set(n,2);};
  for(const n of Object.keys(defs))visit(n,[]);return found;}

 // the effective parameters of the parts of a definition for one instance: public parameters (bound to inner
 // parameters), then the values of this instance only ('L1.L', 'X2/L1.L' passes down to the nested instance X2)
 function innerParts(def,inst,warn,where){
  const parts=(def.components||[]).map(k=>({...k,params:{...(k.params||{})}})),byId=new Map(parts.map(k=>[k.id,k]));
  const set=(cid,k,v,what)=>{const t=byId.get(cid);if(!t){warn?.(`${where}: ${what} δείχνει σε «${cid}», που δεν υπάρχει στον ορισμό.`);return;}t.params[k]=v;};
  const ip=inst.params||{};
  for(const pp of def.params||[]){const v=ip[pp.k]!==undefined&&ip[pp.k]!==''?ip[pp.k]:pp.def;if(v===undefined||v===null||v==='')continue;
   for(const [cid,k] of pp.bind||[])set(cid,k,v,`η δημόσια παράμετρος ${pp.k}`);}
  for(const [key,v] of Object.entries(ip)){if(key.startsWith('$')||key==='def'||!key.includes('.'))continue;
   const dot=key.indexOf('.'),sl=key.indexOf('/');
   if(sl>0&&sl<dot)set(key.slice(0,sl),key.slice(sl+1),v,`η τιμή ${key}`);else set(key.slice(0,dot),key.slice(dot+1),v,`η τιμή ${key}`);}
  return parts;}

 const tagName=(name,pfx)=>{const n=String(name??'');return n.startsWith('/')?n.slice(1):pfx+n;};

 // the flat circuit: {project (no SUB, no ports, no definitions), warnings}
 function flatten(project){
  if(!needs(project))return {project,warnings:[]};
  const defs=project.subcircuits||{},warnings=[],warn=m=>{if(!warnings.includes(m)&&warnings.length<40)warnings.push(m);};
  const comps=[],wires=[],portEnd=new Map(),instSet=new Set(),noDef=new Set(),pending=[],instIn=[];
  const walk=(list,wlist,ctx)=>{
   const local=new Set(list.map(c=>c.id)),me={...ctx,local};
   const resolve=id=>{const s0=String(id),head=s0.split('/')[0];for(let s=me;s;s=s.parent)if(s.local.has(head))return s.pfx+s0;return s0;};
   // instances first, so the ports of this level are known
   for(const c of list){if(c.type!=='SUB')continue;const full=me.pfx+c.id,lbl=me.lbl+(c.label||c.id),name=c.params?.def,d=defs[name];instSet.add(full);
    if(!d){noDef.add(full);warn(`${lbl}: δεν υπάρχει ο ορισμός υποκυκλώματος «${name||'—'}», το υποκύκλωμα μένει εκτός.`);continue;}
    if(me.stack.includes(name))throw new SubcircuitError(`Αναδρομικό υποκύκλωμα: ${[...me.stack,name].join(' → ')}. Ένας ορισμός δεν μπορεί να περιέχει τον εαυτό του.`);
    for(const p of portsOf(d))portEnd.set(full+':'+p.name,{c:full+'/'+p.id,p:'j'});
    // a signal input of the instance that names its source (in_<port> = "source:pin"), like any block
    for(const [k,v] of Object.entries(c.params||{})){if(!k.startsWith('in_')||!v)continue;const sv=String(v),i=sv.lastIndexOf(':');if(i<0)continue;
     instIn.push({at:full+':'+k.slice(3),src:resolve(sv.slice(0,i)),pin:sv.slice(i+1),lbl});}
    walk(innerParts(d,c,warn,lbl),d.wires||[],{pfx:full+'/',lbl:lbl+'/',parent:me,stack:[...me.stack,name],inst:c});}
   for(const c of list){if(c.type==='SUB')continue;const id=me.pfx+c.id,label=me.lbl+(c.label||c.id);
    if(isPort(c)){if(!me.inst)warn(`${label}: θύρα υποκυκλώματος έξω από υποκύκλωμα (ενώνει μόνο τα σύρματά της).`);
     // a port with a width (3.18): the junction keeps it, so Bus.expand checks it like the pin of the symbol
     const pw=Math.round(+c.params?.width||1);comps.push({id,type:'JUNC',x:c.x||0,y:c.y||0,rot:0,flip:false,label,params:pw>1?{$w:pw}:{}});continue;}
    const q={...c,id,label,params:{...(c.params||{})}},d=P.PARTS[c.type];
    if(me.pfx){for(const pd of d?.params||[])if(pd.type==='ref'&&q.params[pd.k])q.params[pd.k]=resolve(q.params[pd.k]);
     if(c.type==='TAGO'||c.type==='TAGI')q.params.name=tagName(q.params.name,me.pfx);}
    else if(c.type==='TAGO'||c.type==='TAGI')q.params.name=tagName(q.params.name,'');
    for(const k of Object.keys(q.params)){if(!k.startsWith('in_')||!q.params[k])continue;const v=String(q.params[k]),i=v.lastIndexOf(':');if(i<0)continue;
     const src=resolve(v.slice(0,i)),pin=v.slice(i+1);q.params[k]=src+':'+pin;pending.push({q,k,src,pin});}
    comps.push(q);}
   const portIds=new Set(list.filter(isPort).map(c=>c.id));
   for(const w of wlist){const e=x=>({c:me.pfx+x.c,p:portIds.has(x.c)?'j':x.p});
    // wire names (3.18) are local to the instance; «/name» is the name of the top level, as for Goto / From (3.19)
    wires.push({...w,id:me.pfx+w.id,a:e(w.a),b:e(w.b),...(w.name?{name:tagName(w.name,me.pfx)}:{}),pts:me.pfx?[]:w.pts||[]});}};
  walk(project.components||[],project.wires||[],{pfx:'',lbl:'',parent:null,stack:[],inst:null});
  // the pins of instances → the junction of the port inside
  const keep=[];for(const w of wires){let ok=true;const end=x=>{if(!instSet.has(x.c))return x;const e=portEnd.get(x.c+':'+x.p);if(!e){ok=false;
    if(!noDef.has(x.c))warn(`Σύρμα σε ακροδέκτη «${x.p}» του ${x.c}, που δεν υπάρχει πια στον ορισμό (το σύρμα αγνοείται).`);return x;}return e;};
   const a=end(w.a),b=end(w.b);if(ok)keep.push({...w,a,b});}
  // a signal input that names an output of an instance: the same as a wire to the port inside
  let nw=0;for(const {q,k,src,pin} of pending){if(!instSet.has(src))continue;const e=portEnd.get(src+':'+pin);delete q.params[k];
   if(e)keep.push({id:'$in'+(++nw),a:{c:q.id,p:k.slice(3)},b:e,pts:[]});else warn(`${q.label}: η είσοδος ${k.slice(3)} δείχνει σε «${src}:${pin}», που δεν υπάρχει.`);}
  for(const {at,src,pin,lbl} of instIn){const a=portEnd.get(at),b=instSet.has(src)?portEnd.get(src+':'+pin):{c:src,p:pin};
   if(a&&b)keep.push({id:'$in'+(++nw),a,b,pts:[]});else if(!noDef.has(at.slice(0,at.lastIndexOf(':'))))warn(`${lbl}: η είσοδος ${at.slice(at.lastIndexOf(':')+1)} δείχνει σε «${src}:${pin}», που δεν υπάρχει.`);}
  const out={...project,components:comps,wires:keep};delete out.subcircuits;
  return {project:out,warnings};}

 // set a parameter by path: 'L1' (top level), 'X1' (public parameter of an instance) or 'X1/L1', 'X1/X2/L1' (inside
 // instances, for this instance only). Returns the component that holds the value.
 function setParam(project,path,key,value){const parts=String(path).split('/');let comps=project.components||[];
  const top=comps.find(c=>c.id===parts[0])||comps.find(c=>c.label===parts[0]);
  if(!top)throw new SubcircuitError(`Δεν υπάρχει στοιχείο «${parts[0]}».`);
  if(parts.length===1){top.params={...(top.params||{}),[key]:value};return top;}
  if(top.type!=='SUB')throw new SubcircuitError(`«${parts[0]}» δεν είναι υποκύκλωμα, άρα δεν έχει «${parts.slice(1).join('/')}».`);
  // check that the path exists (nested instances by their definitions)
  let def=project.subcircuits?.[top.params?.def];for(let i=1;i<parts.length;i++){if(!def)throw new SubcircuitError(`Δεν υπάρχει ο ορισμός του «${parts.slice(0,i).join('/')}».`);
   const c=(def.components||[]).find(k=>k.id===parts[i]);if(!c)throw new SubcircuitError(`Δεν υπάρχει «${parts.slice(0,i+1).join('/')}».`);
   if(i<parts.length-1){if(c.type!=='SUB')throw new SubcircuitError(`«${parts.slice(0,i+1).join('/')}» δεν είναι υποκύκλωμα.`);def=project.subcircuits?.[c.params?.def];}}
  top.params={...(top.params||{}),[parts.slice(1).join('/')+'.'+key]:value};return top;}

 // the value a part inside an instance gets (for showing it): path as in setParam
 function paramOf(project,path,key){const parts=String(path).split('/');let comps=project.components||[],c=comps.find(k=>k.id===parts[0]);
  for(let i=1;c&&i<parts.length;i++){const def=project.subcircuits?.[c.params?.def];if(!def)return undefined;comps=innerParts(def,c);c=comps.find(k=>k.id===parts[i]);}
  if(!c)return undefined;return c.params?.[key]??P.PARTS[c.type]?.params.find(d=>d.k===key)?.def;}

 // copy the ports and the title of each definition into its instances (what the editor draws), and follow a renamed
 // port: wires and signal sources that named the old pin get the new one (the port keeps its id)
 function sync(project){let changed=false;const defs=project.subcircuits||{};
  for(const {doc,comp:c} of instances(project)){const d=defs[c.params?.def];if(!d)continue;
   const ports=portsOf(d),old=Array.isArray(c.params.$ports)?c.params.$ports:[],title=String(d.title||c.params.def);
   const ren=new Map();for(const o of old){const n=ports.find(p=>p.id===o.id);if(n&&n.name!==o.name)ren.set(o.name,n.name);}
   if(ren.size){for(const w of doc.wires||[])for(const e of [w.a,w.b])if(e.c===c.id&&ren.has(e.p)){e.p=ren.get(e.p);changed=true;}
    for(const k of doc.components||[])for(const [pk,v] of Object.entries(k.params||{})){if(!pk.startsWith('in_')||typeof v!=='string')continue;const i=v.lastIndexOf(':');
     if(v.slice(0,i)===c.id&&ren.has(v.slice(i+1))){k.params[pk]=c.id+':'+ren.get(v.slice(i+1));changed=true;}}}
   if(JSON.stringify(old)!==JSON.stringify(ports)){c.params.$ports=ports;changed=true;}
   if(c.params.$title!==title){c.params.$title=title;changed=true;}}
  return changed;}

 // ----------------------------------------------------------------------------------------------- editing helpers
 const uniq=(taken,prefix)=>{let i=1;while(taken.has(prefix+i))i++;taken.add(prefix+i);return prefix+i;};
 const snap=v=>Math.round(v/10)*10;
 const pinKindOf=(c,p)=>c.type==='JUNC'?'j':P.pinKind(c,p);
 function newDefName(project,base='sub'){const t=new Set(Object.keys(project.subcircuits||{}));let i=1;while(t.has(base+i))i++;return base+i;}

 // a subcircuit from a selection (pure): the parts go into a new definition, the wires that cross the boundary become
 // ports (one per inner net), and an instance takes their place. References from outside into the moved parts become
 // paths (X1/L1); references from inside to the outside keep working (lookup outwards). Returns {project, id, name,
 // moved: Map(old id → new path)}.
 function create(project,ids,opt={}){
  const pr=clone(project),sel=new Set(ids.filter(id=>(pr.components||[]).some(c=>c.id===id)));
  if(!sel.size)throw new SubcircuitError('Διάλεξε πρώτα τα στοιχεία του υποκυκλώματος.');
  const inner=pr.components.filter(c=>sel.has(c.id)),outer=pr.components.filter(c=>!sel.has(c.id));
  const intW=[],cross=[],outW=[];for(const w of pr.wires||[]){const a=sel.has(w.a.c),b=sel.has(w.b.c);(a&&b?intW:a||b?cross:outW).push(w);}
  // inner nets by union-find over the inner wires
  const par=new Map(),find=k=>{while(par.get(k)!==k){par.set(k,par.get(par.get(k)));k=par.get(k);}return k;};
  for(const c of inner)for(const p of Object.keys(P.pinsOf(c))){const k=c.id+':'+p;par.set(k,k);}
  for(const w of intW){const a=w.a.c+':'+w.a.p,b=w.b.c+':'+w.b.p;if(par.has(a)&&par.has(b))par.set(find(a),find(b));}
  const byId=new Map(pr.components.map(c=>[c.id,c]));
  const groups=new Map();for(const w of cross){const [ie,oe]=sel.has(w.a.c)?[w.a,w.b]:[w.b,w.a];const k=ie.c+':'+ie.p;const r=par.has(k)?find(k):k;
   if(!groups.has(r))groups.set(r,{ie,list:[]});groups.get(r).list.push({w,ie,oe});}
  const name=opt.name&&!pr.subcircuits?.[opt.name]?opt.name:newDefName(pr);
  const BUS=root.Bus||(typeof require!=='undefined'?require('./bus.js'):null),bw=BUS?BUS.widths(pr):null;
  const taken=new Set(inner.map(c=>c.id).concat(intW.map(w=>w.id))),names=new Set(),defComps=clone(inner),defWires=clone(intW);
  const instPins=[];
  for(const [r,g] of groups){
   const kinds=new Set();for(const [k] of par)if(find(k)===r){const [cid,p]=[k.slice(0,k.lastIndexOf(':')),k.slice(k.lastIndexOf(':')+1)];kinds.add(pinKindOf(byId.get(cid),p));}
   if(!par.has(g.ie.c+':'+g.ie.p))kinds.add(pinKindOf(byId.get(g.ie.c),g.ie.p));
   let kind=kinds.has('el')?'el':kinds.has('out')?'out':kinds.has('in')?'in':null;
   if(!kind){const ok=pinKindOf(byId.get(g.list[0].oe.c),g.list[0].oe.p);kind=ok==='out'?'in':ok==='in'?'out':'el';}
   const type=kind==='el'?'PORT':kind==='in'?'SIN':'SOUT',pid=uniq(taken,P.PARTS[type].prefix);
   const base=kind==='el'?'e':kind==='in'?'u':'y';let pn;for(let i=1;;i++)if(!names.has(base+i)){pn=base+i;names.add(pn);break;}
   // place the port next to the inner pin, facing the outside
   const ip=P.pinPos(byId.get(g.ie.c),g.ie.p)||[0,0],op=P.pinPos(byId.get(g.list[0].oe.c),g.list[0].oe.p)||[ip[0]+1,ip[1]];
   const dx=op[0]-ip[0],dy=op[1]-ip[1],d=Math.abs(dx)>=Math.abs(dy)?[Math.sign(dx)||1,0]:[0,Math.sign(dy)||1];
   const ROT=type==='SIN'?{'1,0':2,'-1,0':0,'0,-1':1,'0,1':3}:{'1,0':0,'-1,0':2,'0,-1':3,'0,1':1};
   const pw=bw?bw.pin(g.ie.c+':'+g.ie.p):1;
   const port={id:pid,type,x:snap(ip[0]+d[0]*60),y:snap(ip[1]+d[1]*60),rot:ROT[d.join(',')],flip:false,label:pn,params:{name:pn,side:'auto',...(pw>1?{width:String(pw)}:{})}};
   defComps.push(port);defWires.push({id:uniq(taken,'w'),a:{c:g.ie.c,p:g.ie.p},b:{c:pid,p:PORT_PIN[type]},pts:[]});
   instPins.push({pn,list:g.list});}
  // the instance at the centre of the selection
  const bb=inner.reduce((a,c)=>[Math.min(a[0],c.x),Math.min(a[1],c.y),Math.max(a[2],c.x),Math.max(a[3],c.y)],[Infinity,Infinity,-Infinity,-Infinity]);
  const outIds=new Set(outer.map(c=>c.id).concat(outW.map(w=>w.id)));const iid=uniq(outIds,'X');
  pr.subcircuits={...(pr.subcircuits||{}),[name]:{title:opt.title||name,desc:'',version:'1',components:defComps,wires:defWires,params:[]}};
  const inst={id:iid,type:'SUB',x:snap((bb[0]+bb[2])/2),y:snap((bb[1]+bb[3])/2),rot:0,flip:false,label:iid,params:{def:name}};
  const newW=[];for(const {pn,list} of instPins)for(const {w,oe} of list){const k={...w,a:{c:iid,p:pn},b:{...oe},pts:[]};newW.push(k);}
  pr.components=[...outer,inst];pr.wires=[...outW,...newW];
  // references from outside into the moved parts: paths
  const moved=new Map(inner.map(c=>[c.id,iid+'/'+c.id]));
  const fix=v=>{const s=String(v),h=s.split('/')[0];return moved.has(h)?iid+'/'+s:s;};
  for(const c of outer){const d=P.PARTS[c.type];for(const pd of d?.params||[])if(pd.type==='ref'&&c.params?.[pd.k])c.params[pd.k]=fix(c.params[pd.k]);
   for(const [k,v] of Object.entries(c.params||{}))if(k.startsWith('in_')&&typeof v==='string'&&v.includes(':')){const i=v.lastIndexOf(':');c.params[k]=fix(v.slice(0,i))+':'+v.slice(i+1);}}
  sync(pr);
  return {project:pr,id:iid,name,moved};}

 // the instance back to an open circuit (pure): parts with new ids, ports become junctions, the values of the instance
 // go into the parameters. Returns {project, ids: Map(inner id → new id)}.
 function expand(project,instId){
  const pr=clone(project),inst=pr.components.find(c=>c.id===instId);
  if(!inst||inst.type!=='SUB')throw new SubcircuitError(`«${instId}» δεν είναι υποκύκλωμα.`);
  const def=pr.subcircuits?.[inst.params?.def];if(!def)throw new SubcircuitError(`Δεν υπάρχει ο ορισμός «${inst.params?.def}».`);
  const parts=innerParts(def,inst),taken=new Set(pr.components.map(c=>c.id).concat((pr.wires||[]).map(w=>w.id))),map=new Map();
  for(const c of parts)map.set(c.id,uniq(taken,isPort(c)?'J':P.PARTS[c.type]?.prefix||'X'));
  const bb=parts.reduce((a,c)=>[Math.min(a[0],c.x),Math.min(a[1],c.y),Math.max(a[2],c.x),Math.max(a[3],c.y)],[Infinity,Infinity,-Infinity,-Infinity]);
  const ox=snap(inst.x-(bb[0]+bb[2])/2),oy=snap(inst.y-(bb[1]+bb[3])/2);
  const loc=v=>{const s=String(v),h=s.split('/')[0];return map.has(h)?map.get(h)+s.slice(h.length):s;};
  const ports=new Map(portsOf(def).map(p=>[p.name,map.get(p.id)])),tagP=(inst.label||inst.id)+'_';
  const nc=parts.map(c=>{const id=map.get(c.id);if(isPort(c))return {id,type:'JUNC',x:c.x+ox,y:c.y+oy,rot:0,flip:false,label:id,params:{}}; // a bus port becomes a junction that follows its wires
   const q={...clone(c),id,label:id,x:c.x+ox,y:c.y+oy};delete q.live;delete q.liveBase;
   for(const pd of P.PARTS[c.type]?.params||[])if(pd.type==='ref'&&q.params[pd.k])q.params[pd.k]=loc(q.params[pd.k]);
   for(const [k,v] of Object.entries(q.params))if(k.startsWith('in_')&&typeof v==='string'&&v.includes(':')){const i=v.lastIndexOf(':');q.params[k]=loc(v.slice(0,i))+':'+v.slice(i+1);}
   if((c.type==='TAGO'||c.type==='TAGI')&&!String(q.params.name||'').startsWith('/'))q.params.name=tagP+(q.params.name||'');
   else if(c.type==='TAGO'||c.type==='TAGI')q.params.name=String(q.params.name).slice(1);
   return q;});
  const nw=(def.wires||[]).map(w=>({...clone(w),id:uniq(taken,'w'),a:{c:map.get(w.a.c),p:isPort(parts.find(k=>k.id===w.a.c))?'j':w.a.p},b:{c:map.get(w.b.c),p:isPort(parts.find(k=>k.id===w.b.c))?'j':w.b.p},
   pts:(w.pts||[]).map(p=>[p[0]+ox,p[1]+oy])}));
  for(const w of pr.wires||[])for(const e of [w.a,w.b])if(e.c===instId){const j=ports.get(e.p);if(j){e.c=j;e.p='j';}}
  pr.wires=(pr.wires||[]).filter(w=>w.a.c!==instId&&w.b.c!==instId).concat(nw);
  pr.components=pr.components.filter(c=>c.id!==instId).concat(nc);
  // references from outside: X1/L1 → the new id; X1:<port> (signal source) → the junction is not an output, so the
  // source becomes the part that drives the port inside
  const drv=new Map();for(const p of portsOf(def))if(p.kind==='out'){const w=(def.wires||[]).find(w=>w.a.c===p.id||w.b.c===p.id);if(!w)continue;
   const o=w.a.c===p.id?w.b:w.a;if(!isPort(parts.find(k=>k.id===o.c)))drv.set(p.name,map.get(o.c)+':'+o.p);}
  for(const c of pr.components){if(nc.includes(c))continue;const d=P.PARTS[c.type];
   for(const pd of d?.params||[])if(pd.type==='ref'&&typeof c.params?.[pd.k]==='string'&&c.params[pd.k].startsWith(instId+'/'))c.params[pd.k]=loc(c.params[pd.k].slice(instId.length+1));
   for(const [k,v] of Object.entries(c.params||{})){if(!k.startsWith('in_')||typeof v!=='string')continue;const i=v.lastIndexOf(':'),src=v.slice(0,i),pn=v.slice(i+1);
    if(src===instId&&drv.has(pn))c.params[k]=drv.get(pn);else if(src.startsWith(instId+'/'))c.params[k]=loc(src.slice(instId.length+1))+':'+pn;}}
  return {project:pr,ids:map};}

 // this instance gets its own copy of the definition (changes inside it no longer reach the others)
 function makeUnique(project,instId){const pr=clone(project),inst=pr.components.find(c=>c.id===instId)||
   Object.values(pr.subcircuits||{}).flatMap(d=>d.components||[]).find(c=>c.id===instId&&c.type==='SUB');
  const def=pr.subcircuits?.[inst?.params?.def];if(!def)throw new SubcircuitError(`Δεν υπάρχει ο ορισμός του «${instId}».`);
  const name=newDefName(pr,inst.params.def+'_');pr.subcircuits[name]={...clone(def),title:(def.title||inst.params.def)+' ('+instId+')'};inst.params.def=name;sync(pr);return {project:pr,name};}

 // the definitions a definition needs (itself and the nested ones), for export as a library file
 function closure(project,name){const out={},go=n=>{const d=project.subcircuits?.[n];if(!d||out[n])return;out[n]=clone(d);for(const c of d.components||[])if(c.type==='SUB')go(c.params?.def);};go(name);return out;}

 // 3.19 (question 3 of 3.17): what a definition takes from outside itself, so that an exported definition says what it
 // needs: [{id, k, ref, kind: 'ref' | 'in'}] for references (switch → PWM, sensor, clock) and signal sources (in_<pin>)
 // whose part is not in the definition. They keep working (looked up outwards, as before); refToPort makes a signal
 // source a port of the definition, wired inside, with the same source in every instance (in_<port> of the instance).
 function externalRefs(project,name){const d=project?.subcircuits?.[name];if(!d)return [];const local=new Set((d.components||[]).map(c=>c.id)),out=[];
  const head=v=>String(v).split('/')[0];
  for(const c of d.components||[]){const pd=P.PARTS[c.type]?.params||[];
   for(const q of pd)if(q.type==='ref'&&c.params?.[q.k]&&!local.has(head(c.params[q.k])))out.push({id:c.id,k:q.k,ref:String(c.params[q.k]),kind:'ref'});
   for(const [k,v] of Object.entries(c.params||{})){if(!k.startsWith('in_')||!v)continue;const sv=String(v),i=sv.lastIndexOf(':');if(i<0)continue;
    if(!local.has(head(sv.slice(0,i))))out.push({id:c.id,k,ref:sv,kind:'in'});}}
  return out;}
 function refToPort(project,name,id,k){const pr=clone(project),d=pr.subcircuits?.[name];if(!d)throw new SubcircuitError(`Δεν υπάρχει ο ορισμός «${name}».`);
  const c=(d.components||[]).find(x=>x.id===id),v=c?.params?.[k];if(!c||!k.startsWith('in_')||!v)throw new SubcircuitError(`${id}.${k}: δεν είναι είσοδος σήματος με πηγή.`);
  const pin=k.slice(3),names=new Set(portsOf(d).map(p=>p.name)),ids=new Set(d.components.map(x=>x.id));let pn=pin,i=1;while(names.has(pn))pn=pin+(++i);let pid='SI1',j=1;while(ids.has(pid))pid='SI'+(++j);
  const pos=P.pinPos(c,pin)||[c.x||0,c.y||0];
  d.components.push({id:pid,type:'SIN',x:pos[0]-60,y:pos[1],rot:0,flip:false,label:pn,params:{name:pn}});
  (d.wires=d.wires||[]).push({id:'w'+pid,a:{c:pid,p:'y'},b:{c:id,p:pin},pts:[]});delete c.params[k];
  const setIn=list=>{for(const x of list||[])if(x.type==='SUB'&&x.params?.def===name)x.params={...x.params,['in_'+pn]:String(v)};};
  setIn(pr.components);for(const dd of Object.values(pr.subcircuits||{}))setIn(dd.components);
  sync(pr);return {project:pr,port:pn};}
 const api={externalRefs,refToPort,PORT_KIND,PORT_PIN,okName,needs,portsOf,layout,instances,cycleOf,innerParts,flatten,setParam,paramOf,sync,create,expand,makeUnique,closure,newDefName,SubcircuitError};
 root.SubCircuit=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
