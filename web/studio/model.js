'use strict';
// 5.0.11 (ROADMAP §70 point 1, the first step of the common model): the drawing as a network of buses and elements, each with
// the identity it has in the drawing (its id), for the studies of the network (pcl.model: the load flow as the EMT starts it,
// IEC 60909-0). No DOM: the page, pcl/runner.js (Node) and the tests. What it does not take in, it says, with the reason.
// 5.0.12 (the second step): the parts inside the subcircuits of the user (ids X1/<id>, as SubCircuit.flatten names them), the
// line from geometry (TLM, three phases) and the equivalent of a network (EQV3, N ports) are parts of the model too.
//   Model.of(project) → {version, f, buses, elements, skipped, touching, warnings}
//     buses:    [{id, label, Un, at: [[component id, terminal], …], juncs: [ids]}]   (the id: a junction of the drawing on the bus)
//     elements: [{id, type, label, params, buses: [bus id per terminal], closed?}]   (params: the defaults with the drawing's own)
//     skipped:  [{id, type, label, why}]   why: 'sub' (a subcircuit, when subcircuit.js is not there), 'later' (a part of the
//               network that is not in the model yet), 'other' (a part that is not three-phase, on a bus), 'phases' (crossed or
//               joined phases), 'nobus' (no voltage level), 'mph' (a line from geometry with other than three phases)
// The connections are the solver's: the buses of the drawing become scalar wires (Bus.expand), and the wires, the names of
// the wires and the grounds join the pins as in mna.js buildNetlist. A closed breaker (its state at t = 0) joins two buses.
(function(root){
 const P=root.Parts||(typeof require!=='undefined'?require('./parts.js'):null);
 const BUS=root.Bus||(typeof require!=='undefined'?require('./bus.js'):null);
 const INP=root.Inputs||(typeof require!=='undefined'?require('./inputs.js'):null);
 const SC=root.SubCircuit||(typeof require!=='undefined'?require('./subcircuit.js'):null);
 // 2 (5.0.12): the parts TLM and EQV3, and the ids of the parts inside subcircuits (X1/<id>)
 const VERSION=2;
 // the parts of the model and their three-phase terminals (terminal → its phase pins when the part is not on a bus)
 const T1={abc:['a','b','c']},T2={abc1:['a1','b1','c1'],abc2:['a2','b2','c2']};
 const TERMS={GEN3:T1,GRID3:T1,VAC3:T1,LOAD3:T1,FLT3:T1,LINE3:T2,XF3:T2,CB3:T2,ZSER3:T2,TLM:T2,EQV3:null};
 // the terminals of a part: a line from geometry only with three phases, an equivalent with its N ports (abc1 … abcN)
 const eqT=new Map();
 function termsOf(c){const t=c&&c.type;if(!(t in TERMS))return null;
  if(t==='TLM')return P.tlmM(c.params||{})===3?T2:null;
  if(t==='EQV3'){const N=P.eqN({...P.defaults('EQV3'),...(c.params||{})});if(!eqT.has(N)){const o={};for(let k=1;k<=N;k++)o['abc'+k]=['a'+k,'b'+k,'c'+k];eqT.set(N,o);}return eqT.get(N);}
  return TERMS[t];}
 // parts of the network that the model does not take in yet (ROADMAP §70: the next steps)
 const LATER=new Set(['FILT3','MMC','VSC2','LCC6','LCCS','SSSC','SSSC3','CHB','TOWER','SAI','DS','ARC','MOV','SG','TL','DCDC']);
 // what a part of the model does not need in it (a big text the studies do not read)
 const HEAVY={TLM:['mdl','wbtxt']};
 // what draws no current or joins its pins as a wire: meters (the PMU in each phase), junctions, grounds, notes
 const QUIET=new Set(['JUNC','GND','NOTE','VM','VP','MEAS','DISP','SR']),SHORT=new Set(['AM','IP']),SHORT3={PMU3:[['a1','a2'],['b1','b2'],['c1','c2']]};
 // the voltage level of a bus: from its sources and transformers first, then lines, then loads
 const RANK={GRID3:0,GEN3:0,XF3:1,EQV3:1,LINE3:2,LOAD3:3,VAC3:4};
 class ModelError extends Error{}
 function uf(){const par=new Map(),find=k=>{if(!par.has(k))par.set(k,k);let r=k;while(par.get(r)!==r)r=par.get(r);while(par.get(k)!==r){const n=par.get(k);par.set(k,r);k=n;}return r;};
  return {par,find,union:(a,b)=>{const ra=find(a),rb=find(b);if(ra!==rb)par.set(ra,rb);}};}
 // the parameters as numbers where the part has a number (a value with a unit prefix, «20k», becomes 20000)
 function params(c){const d=P.PARTS[c.type],o={...P.defaults(c.type),...(c.params||{})};
  for(const q of d.params||[])if(q.type==='num'&&typeof o[q.k]==='string'){const v=P.parseEng(o[q.k]);if(Number.isFinite(v))o[q.k]=v;}
  for(const k of HEAVY[c.type]||[])delete o[k];
  return o;}
 // the U_n of a terminal of a part (V), for the voltage level of its bus
 function levelOf(c,t,p){if(c.type==='XF3')return t==='abc1'?p.U1:p.U2;if(c.type==='VAC3')return (+p.Vpk)*Math.sqrt(3/2);
  if(c.type==='EQV3'){const a=String(p.Un??'').split(';').map(x=>P.parseEng(x.trim()));return a[(+t.slice(3)||1)-1];}return p.Un;}
 // the state of a breaker at t = 0: its program of commands (the value before the first time is the first value), or a signal
 function closedAt0(p){if(p.ctl==='sig')return {closed:true,sig:true};const q=P.parseSched(String(p.cmd??'0:1'));if(!q)return {closed:true};
  let v=q[0][1];for(const [t,x] of q)if(t<=0)v=x;return {closed:v>=0.5};}
 function of(project){
  const warnings=[],skipped=[];let pr=project||{};
  if(INP&&INP.needs(pr)){const r=INP.resolve(pr);pr=r.project;warnings.push(...r.warnings);}
  // 5.0.12: the subcircuits of the user are opened (the parts of the network library stay parts), with the ids X1/<id>
  if(SC&&(pr.components||[]).some(c=>c.type==='SUB')){try{const r=SC.flatten(pr,{lib:false});pr=r.project;warnings.push(...r.warnings);}catch(e){throw new ModelError(e.message);}}
  const all=(pr.components||[]).filter(c=>P.PARTS[c.type]),lab=c=>String(c.label||c.id);
  for(const c of all)if(c.type==='SUB')skipped.push({id:c.id,type:c.type,label:lab(c),why:'sub'});
  const keep=all.filter(c=>c.type!=='SUB'),ids=new Set(keep.map(c=>c.id)),byId=new Map(keep.map(c=>[c.id,c]));
  const wires=(pr.wires||[]).filter(w=>ids.has(w.a?.c)&&ids.has(w.b?.c));
  const v3=(+pr.version||0)>=3;
  // the junctions of the drawing as it is, before its buses become scalar wires: they give the buses their names
  const U0=uf(),pin0=new Set();for(const c of keep)for(const p of Object.keys(P.elPins(c))){pin0.add(c.id+':'+p);U0.find(c.id+':'+p);}
  const join=(U,set,list)=>{const named=new Map();for(const w of list){const a=w.a.c+':'+w.a.p,b=w.b.c+':'+w.b.p;if(!set.has(a)||!set.has(b))continue;U.union(a,b);
   if(v3&&w.name){const n=String(w.name);if(named.has(n))U.union(named.get(n),a);else named.set(n,a);}}};
  join(U0,pin0,wires);
  const juncs=new Map();for(const c of keep)if(c.type==='JUNC'){const r=U0.find(c.id+':j');if(!juncs.has(r))juncs.set(r,[]);juncs.get(r).push(c);}
  // the solver's connections: scalar wires, the names of the wires, the grounds, the series meters
  let flat={...pr,components:keep,wires};
  if(BUS&&BUS.needs(flat)){try{flat=BUS.expand(flat).project;}catch(e){throw new ModelError(e.message);}}
  const U=uf(),pins=new Set();for(const c of flat.components)for(const p of Object.keys(P.elPins(c))){pins.add(c.id+':'+p);U.find(c.id+':'+p);}
  join(U,pins,flat.wires||[]);
  const gnds=flat.components.filter(c=>c.type==='GND');for(const g of gnds.slice(1))U.union(gnds[0].id+':g',g.id+':g');
  const groundRoot=gnds.length?U.find(gnds[0].id+':g'):null;
  for(const c of flat.components){if(SHORT.has(c.type)){const ps=Object.keys(P.elPins(c));if(ps.length===2)U.union(c.id+':'+ps[0],c.id+':'+ps[1]);}
   else if(SHORT3[c.type])for(const [a,b] of SHORT3[c.type])if(pins.has(c.id+':'+a)&&pins.has(c.id+':'+b))U.union(c.id+':'+a,c.id+':'+b);}
  // the terminals of the parts of the model: three nodes each
  const flatById=new Map(flat.components.map(c=>[c.id,c])),terms=[],phaseOf=new Map(),bad=new Set();
  for(const c0 of keep){const T=termsOf(c0);if(!T)continue;const c=flatById.get(c0.id)||c0,onBus=P.elPins(c0)[Object.keys(T)[0]]!==undefined;
   for(const [t,ph] of Object.entries(T)){const nodes=ph.map(p=>U.find(c.id+':'+p)),key=nodes.join('|');
    const why=nodes[0]===nodes[1]||nodes[1]===nodes[2]||nodes[0]===nodes[2]?'joined':nodes.some(n=>n===groundRoot)?'ground':null;
    if(why){bad.add(c0.id);warnings.push(`${lab(c0)}: ${why==='joined'?'δύο φάσεις του ακροδέκτη '+t+' στον ίδιο κόμβο':'μια φάση του ακροδέκτη '+t+' στη γη'}· εκτός μοντέλου.`);}
    terms.push({c:c0,t,nodes,key,orig:onBus?c0.id+':'+t:c0.id+':'+ph[0]});
    nodes.forEach((n,i)=>{const o=phaseOf.get(n);if(o===undefined)phaseOf.set(n,[i,c0.id]);else if(o[0]!==i){bad.add(c0.id);bad.add(o[1]);}});}}
  for(const id of bad){const c=byId.get(id);if(!skipped.some(s=>s.id===id))skipped.push({id,type:c.type,label:lab(c),why:'phases'});}
  if([...bad].some(id=>!warnings.some(w=>w.startsWith(lab(byId.get(id))+':'))))warnings.push('Φάσεις χιαστί ανάμεσα σε στοιχεία (η a ενός στη b ή στη c του άλλου): τα στοιχεία αυτά μένουν εκτός μοντέλου.');
  const good=terms.filter(x=>!bad.has(x.c.id));
  // buses: the terminals on the same three nodes, and the two sides of a closed breaker
  const B=uf();for(const x of good)B.find(x.key);
  const brk=new Map();for(const c of keep)if(c.type==='CB3'&&!bad.has(c.id)){const s=closedAt0(params(c));brk.set(c.id,s);
   if(s.sig)warnings.push(`${lab(c)}: ο διακόπτης παίρνει την εντολή από σήμα· στο μοντέλο είναι κλειστός.`);
   if(s.closed){const [a,b]=good.filter(x=>x.c.id===c.id);if(a&&b)B.union(a.key,b.key);}}
  const groups=new Map();for(const x of good){const r=B.find(x.key);if(!groups.has(r))groups.set(r,[]);groups.get(r).push(x);}
  const buses=[],busOf=new Map(),used=new Set();
  for(const list of groups.values()){
   const js=[];for(const x of list){for(const j of juncs.get(U0.find(x.orig))||[])if(!js.includes(j))js.push(j);}
   js.sort((a,b)=>(a.label?0:1)-(b.label?0:1)||(a.id<b.id?-1:a.id>b.id?1:0));
   let id=js.length?js[0].id:list.map(x=>x.c.id+'.'+x.t).sort()[0];if(used.has(id))id=id+'~'+buses.length;used.add(id);
   // the voltage level, with a warning when the parts on the bus do not agree (more than 1 %)
   const lv=[];for(const x of list){const p=params(x.c),r=RANK[x.c.type];if(r===undefined)continue;
    const U=levelOf(x.c,x.t,p);if(+U>0)lv.push([r,+U,x.c]);}
   lv.sort((a,b)=>a[0]-b[0]);const Un=lv.length?lv[0][1]:null;
   const off=lv.filter(q=>Math.abs(q[1]-Un)>0.01*Un).map(q=>lab(q[2]));
   const label=js.length?String(js[0].label||js[0].id):id;
   if(off.length)warnings.push(`Ζυγός ${label}: U_n ${P.eng(Un,'V')}, αλλιώς στα ${[...new Set(off)].join(', ')}.`);
   const b={id,label,Un,at:list.map(x=>[x.c.id,x.t]),juncs:js.map(j=>j.id)};buses.push(b);for(const x of list)busOf.set(x.c.id+':'+x.t,b);}
  buses.sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
  // a series impedance, an open breaker and a line from geometry (no U_n of its own) do not change the voltage level: a bus
  // without one takes it from the other side
  for(let again=true;again;){again=false;for(const c of keep){if((c.type!=='ZSER3'&&c.type!=='CB3'&&c.type!=='TLM')||bad.has(c.id)||!termsOf(c))continue;
   const a=busOf.get(c.id+':abc1'),b=busOf.get(c.id+':abc2');if(!a||!b)continue;
   if(!(a.Un>0)&&b.Un>0){a.Un=b.Un;again=true;}else if(!(b.Un>0)&&a.Un>0){b.Un=a.Un;again=true;}}}
  for(const b of buses)if(!(b.Un>0)){warnings.push(`Ζυγός ${b.label}: χωρίς στάθμη τάσης (κανένα στοιχείο του δεν έχει U_n).`);}
  // the elements, with the buses of their terminals
  const elements=[];
  for(const c of keep){const T=termsOf(c);if(!T||bad.has(c.id))continue;const bs=Object.keys(T).map(t=>busOf.get(c.id+':'+t));
   if(bs.some(b=>!b||!(b.Un>0))){skipped.push({id:c.id,type:c.type,label:lab(c),why:'nobus'});continue;}
   const e={id:c.id,type:c.type,label:lab(c),params:params(c),buses:bs.map(b=>b.id)};if(c.type==='CB3')e.closed=brk.get(c.id).closed;elements.push(e);}
  // the other parts: those not in the model yet, and those that are not three-phase, when they touch a bus
  const busNode=new Set();for(const x of good)for(const n of x.nodes)busNode.add(n);
  const touching=[];
  for(const c of keep){if(termsOf(c)||QUIET.has(c.type)||SHORT.has(c.type)||SHORT3[c.type])continue;const ps=Object.keys(P.elPins(c));if(!ps.length)continue;
   const fc=flatById.get(c.id),fps=fc?Object.keys(P.elPins(fc)):[],on=fps.some(p=>busNode.has(U.find(c.id+':'+p)));
   if(c.type==='TLM')skipped.push({id:c.id,type:c.type,label:lab(c),why:'mph'});
   else if(LATER.has(c.type))skipped.push({id:c.id,type:c.type,label:lab(c),why:'later'});
   else if(on)skipped.push({id:c.id,type:c.type,label:lab(c),why:'other'});
   if(on)touching.push(c.id);}
  const f=elements.map(e=>+e.params.f).find(x=>x>0)||50;
  return {version:VERSION,f,name:String(pr.name||''),buses,elements,skipped,touching,warnings};}
 // what the page says about a model, in one line
 function summary(m){const n=t=>m.elements.filter(e=>e.type===t).length;const parts=[['GEN3','γεννήτριες'],['GRID3','ισοδύναμα δικτύου'],['EQV3','ισοδύναμα πολλών θυρών'],['VAC3','πηγές'],['LINE3','γραμμές'],['TLM','γραμμές από γεωμετρία'],['XF3','μετασχηματιστές'],['LOAD3','φορτία'],['CB3','διακόπτες'],['ZSER3','εμπεδήσεις σειράς'],['FLT3','σφάλματα']]
  .map(([t,w])=>[n(t),w]).filter(([k])=>k>0).map(([k,w])=>k+' '+w);return `${m.buses.length} ζυγοί${parts.length?': '+parts.join(', '):''}`;}
 const WHY={sub:'μέσα σε υποκύκλωμα: δεν μπαίνει ακόμη',later:'στοιχείο του δικτύου που δεν μπαίνει ακόμη στο μοντέλο',other:'δεν είναι τριφασικό στοιχείο του μοντέλου, ακουμπά όμως έναν ζυγό',phases:'φάσεις χιαστί ή ενωμένες',nobus:'ζυγός χωρίς στάθμη τάσης',mph:'γραμμή από γεωμετρία με άλλο πλήθος φάσεων από τρεις: δεν μπαίνει ακόμη'};
 const api={VERSION,TERMS,LATER,termsOf,of,summary,WHY,ModelError};
 root.Model=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
