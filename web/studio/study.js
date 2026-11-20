'use strict';
// 5.0 (ROADMAP §91, THEORY §8ΩΕ, decision 344): the study folder. A run of the simulation writes into a folder the user
// chose: the project as it ran, the channels, every recorded point of them (binary, read while it is written), the
// events, the log and a summary; on request also the netlist. This file is the part that knows the simulator: what the
// channels are (key, quantity, unit, part), the netlist as data and as text, the summary of the network, and the rows of
// a run. Where the bytes go is not its business: the page and its worker send them to the server (engine/studyfolder.py,
// /api/study), Node writes them to the run folder that Python made (pcl/runner.js). The idea of the folder is that of
// the EMTP and of PSCAD (a folder of the design with the netlist, the log and the waveforms); the files are ours.
// Without DOM: it runs on the page, in a Worker and in Node.
(function(root){
 const FORMAT=1;                       // the version of the files of a run (run.json, channels.json, data, netlist.json)
 const Pa=()=>root.Parts;
 // the unit of a channel: the same rules as Scope.unitOf (scope.js), here without the page (tests/test_study.py compares them)
 const UNIT={V:'V',I:'A',P:'W',N:'V',VN:'V',V2:'V',I2:'A',Im:'A',PSIm:'V·s',Vb:'V',Vc:'V',Vab:'V',Ib:'A',Ic:'A',PSW:'W',D:'',G:'',GS:'',REF:'',MEAS:'',CAR:''};
 for(let k=1;k<=8;k++){if(k>2){UNIT['V'+k]='V';UNIT['I'+k]='A';}UNIT['PSI'+k]='V·s';}
 function unitOf(key,sim){const pre=key.split(':')[0],id=key.split(':')[1];
  if(pre==='REF'||pre==='MEAS'){const k=sim?.net.ctrls.find(c=>c.id===id);const h=sim?.shById?.get(k?.sensor);return (h?h.qty:k?.qty)==='V'?'V':'A';}
  if(pre==='H'){const q=sim?.shById?.get(id);return q?.sig?'':q?.qty==='V'?'V':'A';}
  if(pre==='Y'){const b=sim?.net.compInfo.get(id)?.blk,pin=key.split(':')[2],t=b?.type;if(t==='DCM')return pin==='te'?'N·m':'rad/s';if(t==='IM')return pin==='te'?'N·m':pin==='psi'?'V·s':!pin||pin==='w'?'rad/s':'rad';if(t==='SM')return pin==='te'?'N·m':pin==='th'?'rad':pin==='id'||pin==='iq'?'A':'rad/s';if(t==='SRM')return pin==='te'?'N·m':pin==='th'?'rad':/^i\d$/.test(pin||'')?'A':'rad/s';if(t==='GEN3')return pin==='d'?'°':'pu';if(t==='FEST')return pin==='psi'?'V·s':pin==='w1'?'rad/s':'rad';if(t==='PLL')return pin==='w'?'rad/s':pin==='amp'?'':'rad';if(t==='INT'&&b.wrap)return 'rad';
   return t==='VM'||t==='VP'?'V':t==='AM'||t==='IP'?'A':t==='MEAS'?(b.qty==='V'?'V':'A'):'';}
  return UNIT[pre]??'';}
 // what a channel is, in words (the tree of the viewer groups by part and by this)
 const KIND={N:'τάση κόμβου',V:'τάση',I:'ρεύμα',P:'ισχύς',PSW:'απώλειες διακόπτη',D:'λόγος κατάτμησης',G:'παλμοί',GS:'κατάσταση διακόπτη',REF:'αναφορά',MEAS:'μέτρηση',CAR:'φέρον',
  Y:'σήμα',H:'δειγματοληψία',Vb:'τάση φάσης b',Vc:'τάση φάσης c',Ib:'ρεύμα φάσης b',Ic:'ρεύμα φάσης c',Vab:'πολική τάση',Im:'ρεύμα μαγνήτισης',PSIm:'ροή μαγνήτισης',Garc:'αγωγιμότητα τόξου'};
 function kindOf(key){const pre=key.split(':')[0];if(KIND[pre])return KIND[pre];const m=pre.match(/^([VI]|PSI)(\d)$/);if(m)return (m[1]==='V'?'τάση':m[1]==='I'?'ρεύμα':'πεπλεγμένη ροή')+' '+m[2];return pre;}
 // the channels of a run: [{i, key, name, unit, kind, comp, type, label}], i the column (1 = the first after the time)
 function channels(sim,keys){const info=sim.net.compInfo,out=[];
  keys.forEach((key,j)=>{const parts=key.split(':'),pre=parts[0];let comp=parts[1]||'',inf=info.get(comp);
   if(pre==='N'){const n=sim.net.pinNet.get(parts.slice(1).join(':'));comp='';inf=null;const nm=n?.name;out.push({i:j+1,key,name:nm?nm:'v('+parts.slice(1).join(':')+')',unit:'V',kind:KIND.N,comp:'',type:'',label:''});return;}
   const label=inf?.label||comp,type=inf?.type||'';const pin=parts[2];
   out.push({i:j+1,key,name:(pre.toLowerCase())+'('+label+(pin?'.'+pin:'')+')',unit:unitOf(key,sim),kind:kindOf(key),comp,type,label});});
  return out;}
 // the keys to write: 'all' every channel (decision 344), 'sim' what the simulation records (solve.rec), 'scope' the
 // keys given (the scope of the page); the order is that of sim.keys
 function keysFor(sim,mode,scope){if(mode==='sim')return sim.recKeys.slice();
  if(mode==='scope'){const want=new Set();for(let k of scope||[]){if(typeof k!=='string')continue;if(k.startsWith('VN:')){const n=sim.net.pinNet.get(k.slice(3));if(!n||n.ground)continue;k='N:'+n.canon;}if(sim.hasKey(k))want.add(k);}return sim.keys.filter(k=>want.has(k));}
  return sim.keys.slice();}
 // ---------------------------------------------------------------- the netlist, as data and as text
 // What the solver sees after the library, the subcircuits and the buses are expanded: the nodes with the pins they join,
 // every element of the matrix with its nodes and its values, the parts it came from with their parameters, the signal
 // blocks with their inputs and outputs, the controllers and the line models (by the hash of what they were fitted from).
 // The state of a run (histories, the values «now», the companion sources of the integration) is left out: the netlist
 // is the circuit at the start of the run (the initial values i, v, on of the elements stay, as the state at t = 0).
 const STATE=/now$|^(Ih|Ihm|iE|vm|q|H|gH|hist|prev|x0|st|sv|tOn|on0|acc|buf|ring|g|J|i1|v1|vPrev|iPrev|evOn)$/;
 function plain(v,depth){if(v===null||typeof v==='boolean'||typeof v==='string')return v;if(typeof v==='number')return Number.isFinite(v)?v:String(v);
  if(ArrayBuffer.isView(v))return v.length<=64?Array.from(v,x=>Number.isFinite(x)?x:String(x)):undefined;
  if(Array.isArray(v)){if(depth>2||v.length>256)return undefined;const a=v.map(x=>plain(x,depth+1));return a.some(x=>x===undefined)?undefined:a;}
  if(typeof v==='object'&&depth<=2&&!(v instanceof Map)&&!(v instanceof Set)){const o={};let n=0;for(const [k,x] of Object.entries(v)){if(typeof x==='function'||STATE.test(k))continue;const y=plain(x,depth+1);if(y!==undefined){o[k]=y;if(++n>64)return undefined;}}return o;}
  return undefined;}
 const mdlRef=new WeakMap();   // line element → {hash} (set by the writer when it knows the hashes of the models)
 function netlist(sim,refs){const net=sim.net,nodes=[],name=i=>i<0?'0':(nodes[i]?.name||'n'+i);
  for(const n of net.nets){if(n.index===undefined||n.index<0)continue;nodes[n.index]={i:n.index,name:n.name||n.canon,canon:n.canon,pins:n.keys.slice()};}
  const els=net.els.map((e,j)=>{const o={j,k:e.k};if(e.cid)o.part=e.cid;
   for(const [k,v] of Object.entries(e)){if(k==='k'||k==='cid'||typeof v==='function'||STATE.test(k))continue;const y=plain(v,0);if(y!==undefined)o[k]=y;}
   if(e.k==='TLM'||e.k==='TL'){delete o.modes;delete o.Gp;delete o.Ti;if(refs&&refs[e.cid])o.model=refs[e.cid];}
   return o;});
  const parts=[];for(const [id,c] of net.byId||[]){const inf=net.compInfo.get(id);const p={id,type:c.type,label:c.label||id};
   const prm=plain(c.params||{},0);if(prm){if(c.type==='TLM'){delete prm.mdl;delete prm.wbtxt;}p.params=prm;}if(inf?.pins?.length)p.pins=inf.pins.slice();parts.push(p);}
  const blocks=(net.sig?.blocks||[]).map(b=>{const o={id:b.id,type:b.type};for(const k of ['ins','outs','inList','outList','params','p','order'])if(b[k]!==undefined){const y=plain(b[k],0);if(y!==undefined)o[k]=y;}return o;});
  const ctrls=(net.ctrls||[]).map(c=>{const o={};for(const [k,v] of Object.entries(c)){if(typeof v==='function'||STATE.test(k))continue;const y=plain(v,1);if(y!==undefined)o[k]=y;}return o;});
  const si=sim.solverInfo();
  return {format:'pcl-netlist',version:FORMAT,unknowns:sim.n,nodes:nodes.filter(Boolean),elements:els,parts,blocks,controllers:ctrls,
   solver:{kind:si.kind,refac:si.refac,kernel:si.kernel,nnzA:si.nnzA,nnzLU:si.nnzLU,h:sim.h,step:sim.var?'var':'fixed',method:sim.method,T:sim.T},
   warnings:(net.warnings||[]).map(String)};}
 // the netlist as text: one line per node and per element, in the order of the solver
 function netlistText(nl,title){const L=[],num=v=>typeof v==='number'?String(+v.toPrecision(12)):Array.isArray(v)?'['+v.map(num).join(' ')+']':typeof v==='object'&&v?'{…}':String(v);
  L.push('* Power & Control Lab · netlist'+(title?' · '+title:''),`* ${nl.unknowns} άγνωστοι, ${nl.nodes.length} κόμβοι, ${nl.elements.length} στοιχεία, ${nl.blocks.length} μπλοκ σημάτων`,
   `* λύτης: ${nl.solver.kind}, ${nl.solver.method}, h = ${num(nl.solver.h)} s (${nl.solver.step==='var'?'μεταβλητό':'σταθερό'} βήμα)`,'','.NODES');
  for(const n of nl.nodes)L.push(`${String(n.i).padStart(5)}  ${n.name}  : ${n.pins.join(' ')}`);
  L.push('','.ELEMENTS');
  for(const e of nl.elements){const nd=['a','b'].filter(k=>typeof e[k]==='number').map(k=>e[k]<0?'0':String(e[k]));
   const rest=Object.entries(e).filter(([k])=>!['j','k','part','a','b'].includes(k)).map(([k,v])=>k+'='+num(v));
   L.push(`${String(e.j).padStart(5)}  ${e.k.padEnd(5)} ${(e.part||'').padEnd(14)} ${nd.join(' ').padEnd(9)} ${rest.join(' ')}`);}
  if(nl.blocks.length){L.push('','.BLOCKS');for(const b of nl.blocks)L.push(`       ${String(b.type).padEnd(8)} ${b.id}`);}
  L.push('','.PARTS');for(const p of nl.parts)L.push(`       ${String(p.type).padEnd(8)} ${p.id}${p.label&&p.label!==p.id?' «'+p.label+'»':''}`);
  if(nl.warnings.length){L.push('','.WARNINGS');for(const w of nl.warnings)L.push('* '+w);}
  L.push('','.END');return L.join('\n')+'\n';}
 // ---------------------------------------------------------------- the summary of a run (like the HTML page of the EMTP)
 function summary(sim){const net=sim.net,byType={},byKind={};for(const [,c] of net.byId||[])byType[c.type]=(byType[c.type]||0)+1;for(const e of net.els)byKind[e.k]=(byKind[e.k]||0)+1;
  const si=sim.solverInfo(),st=sim.stepInfo?sim.stepInfo(false):null;
  const v0=[];for(const n of net.nets){if(n.index===undefined||n.index<0)continue;const k='N:'+n.canon;if(sim.hasKey(k))v0.push([n.name||n.canon,sim.now(k)]);if(v0.length>=400)break;}
  return {parts:byType,elements:byKind,nodes:net.nets.filter(n=>n.index>=0).length,unknowns:sim.n,blocks:(net.sig?.blocks||[]).length,channels:sim.keys.length,
   solver:{kind:si.kind,refac:si.refac,kernel:si.kernel,nnzA:si.nnzA,nnzLU:si.nnzLU,proposal:si.proposal?.text||'',h:sim.h,step:sim.var?'var':'fixed',method:sim.method,T:sim.T,limit:st&&st.lim?{h:st.lim,why:st.why||''}:null},
   start:{t:sim.t,init:sim.project?.solve?.init||null,nodes:v0},warnings:(net.warnings||[]).map(String)};}
 // ---------------------------------------------------------------- the rows of a run
 // A recorder on the simulator: at every recorded point (Sim.recordNow, also the second point at the same instant of a
 // sample) the row [t, values of the keys] in float64 (or float32) goes into a buffer; take() empties it. dt > 0: at most a
 // row every dt (as the resolution of the record). The values are those of the solution of that step, every channel
 // (Sim.fullVals: the channels not recorded by the simulation are computed from the same solution).
 class Recorder{
  constructor(sim,keys,o={}){this.sim=sim;this.keys=keys;this.dt=+o.dt>0?+o.dt:0;this.f32=o.dtype==='float32';const ix=sim.allIndex||sim.chIndex;
   this.ix=Int32Array.from(keys,k=>ix.get(k));this.w=keys.length+1;this.cap=Math.max(16,Math.min(65536,Math.floor((o.chunk||4194304)/(8*this.w))));
   this.buf=this.alloc();this.n=0;this.out=[];this.rows=0;this.lastT=-Infinity;this.evN=0;this.on=true;
   this.prev=sim.tap||null;sim.tap=()=>{if(this.prev)this.prev();this.push();};}
  alloc(){return this.f32?new Float32Array(this.cap*this.w):new Float64Array(this.cap*this.w);}
  push(){if(!this.on)return;const s=this.sim,t=s.t;if(this.dt&&t>=this.lastT&&t-this.lastT<this.dt*(1-1e-9))return;this.lastT=t;
   const v=s.recKeys===s.keys?s.vals:s.fullVals(),ix=this.ix,w=this.w,b=this.buf,o=this.n*w;b[o]=t;for(let i=0;i<ix.length;i++)b[o+1+i]=v[ix[i]];
   if(++this.n===this.cap){this.out.push(this.buf);this.buf=this.alloc();this.n=0;}this.rows++;}
  // the rows since the last take, as one typed array (rows × (keys + 1))
  take(){const parts=this.out;this.out=[];if(this.n){parts.push(this.buf.subarray(0,this.n*this.w));this.buf=this.alloc();this.n=0;}
   if(!parts.length)return null;if(parts.length===1)return parts[0];const L=parts.reduce((a,p)=>a+p.length,0),A=this.f32?new Float32Array(L):new Float64Array(L);let o=0;for(const p of parts){A.set(p,o);o+=p.length;}return A;}
  // the events of the simulation since the last call
  events(){const E=this.sim.events();if(!E||E.n<=this.evN)return [];const k=Math.min(E.list.length,E.n-this.evN);this.evN=E.n;return E.list.slice(-k).map(e=>({t:e.t,kind:e.kind,src:e.src,v:typeof e.v==='number'?e.v:String(e.v??'')}));}
  stop(){this.on=false;if(this.sim.tap){this.sim.tap=this.prev;}}
 }
 // the line models of a project, for the folder (engine/studyfolder.py keeps them by the hash of their key): the parts
 // TLM at every level with a model that is still valid
 function lineModels(sim){const out=[],P=Pa();for(const [id,c] of sim.net.byId||[]){if(c.type!=='TLM')continue;const p={...P.defaults('TLM'),...c.params},m=P.tlmModel(p);if(m.err)continue;
  out.push({cid:id,label:c.label||id,model:m.type||p.model,src:P.tlmKey(p),data:p.data,len:p.len,f:p.f});}return out;}
 // the descriptor of the data file: what a reader needs (engine/studyfolder.py checks the same)
 function dataInfo(keys,o={}){const f32=o.dtype==='float32';return {file:f32?'data.f32':'data.f64',dtype:f32?'float32':'float64',order:'little',cols:keys.length+1,rowBytes:(keys.length+1)*(f32?4:8),dt:+o.dt>0?+o.dt:0};}
 const api={FORMAT,unitOf,kindOf,channels,keysFor,netlist,netlistText,summary,Recorder,lineModels,dataInfo};
 root.Study=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
