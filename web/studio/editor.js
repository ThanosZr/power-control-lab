'use strict';
// Schematic editor.
//  left-drag on empty canvas  -> rectangle selection (never pans, never selects text)
//  left-drag on a part        -> moves the selection; attached wires stay orthogonal
//  left-drag on a wire segment-> moves that segment perpendicular to itself
//  press on a pin             -> draws a wire (A* orthogonal route around symbols); released in empty space it keeps a free end (3.7)
//  W (wire tool)              -> click anywhere to start, click for corners, double click / Enter to stop at a free end (3.7)
//  a part dropped or moved onto a wire connects there; a two-pin part along a wire goes in series (3.7, Shift: no connection)
//  middle-drag / Space+drag   -> pan; wheel -> zoom (all remappable in settings)
(function(root){
 const P=root.Parts;const NS='http://www.w3.org/2000/svg';const G=10;
 const snap=v=>Math.round(v/G)*G;
 const same=(a,b)=>a[0]===b[0]&&a[1]===b[1];
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 // remove zero-length segments and collinear interior points
 function normalize(pts){
  let out=[];for(const p of pts){if(out.length&&same(out[out.length-1],p))continue;out.push([p[0],p[1]]);}
  if(out.length<=2)return out.length===1?[out[0],[...out[0]]]:out;
  let changed=true;while(changed&&out.length>2){changed=false;for(let i=1;i<out.length-1;i++){const a=out[i-1],b=out[i],c=out[i+1];if((a[0]===b[0]&&b[0]===c[0])||(a[1]===b[1]&&b[1]===c[1])){out.splice(i,1);changed=true;break;}}}
  return out;}
 const orth=pts=>pts.every((p,i)=>!i||p[0]===pts[i-1][0]||p[1]===pts[i-1][1]);
 class MinHeap{constructor(){this.a=[];}push(x){const a=this.a;a.push(x);let i=a.length-1;while(i>0){const p=(i-1)>>1;if(a[p][0]<=a[i][0])break;[a[p],a[i]]=[a[i],a[p]];i=p;}}
  pop(){const a=this.a,top=a[0],last=a.pop();if(a.length){a[0]=last;let i=0;for(;;){const l=2*i+1,r=l+1;let m=i;if(l<a.length&&a[l][0]<a[m][0])m=l;if(r<a.length&&a[r][0]<a[m][0])m=r;if(m===i)break;[a[m],a[i]]=[a[i],a[m]];i=m;}}return top;}get size(){return this.a.length;}}
 const DIRS=[[1,0],[0,1],[-1,0],[0,-1]];

 class Editor{
  constructor(holder,opt={}){
   this.holder=holder;this.opt=opt;this.doc={components:[],wires:[]};this.sel={c:new Set(),w:new Set()};
   this.undoStack=[];this.redoStack=[];this.view={cx:400,cy:250,k:1};this.mode=null;this.live=null;this.space=false;
   this.settings=Object.assign({leftDrag:'select',middleDrag:'pan',rightButton:'menu',wheel:'zoom',dblclick:'edit',marquee:'direction',grid:true,gridStyle:'dots',wireWidth:2.2,corner:'round',showLive:true,showArrows:true,autoRoute:false,freeEnds:true,autoConnect:true,snapPx:12},opt.settings||{});
   const svg=this.svg=document.createElementNS(NS,'svg');svg.setAttribute('class','schem');svg.setAttribute('tabindex','0');
   svg.setAttribute('aria-label','Κύκλωμα. Διπλό κλικ σε στοιχείο για ρυθμίσεις, δεξί κλικ για scope.');
   svg.innerHTML=`<defs><pattern id="gdots" width="${G}" height="${G}" patternUnits="userSpaceOnUse"><circle cx="0" cy="0" r=".75" class="gdot"/></pattern>
    <pattern id="glines" width="${G*5}" height="${G*5}" patternUnits="userSpaceOnUse"><path d="M${G*5},0 H0 V${G*5}" class="gline"/></pattern>
    <marker id="flowArr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="flowhead"/></marker>
    <marker id="sigArr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" markerUnits="userSpaceOnUse" orient="auto"><path d="M0,1 L10,5 L0,9 z" class="sighead"/></marker></defs>
    <g class="viewport"><rect class="gridbg" x="-50000" y="-50000" width="100000" height="100000"/><g class="wires"></g><g class="parts"></g><g class="dots"></g><g class="pins"></g><g class="livel"></g><g class="over"></g></g>`;
   holder.replaceChildren(svg);
   this.vp=svg.querySelector('.viewport');this.L={wires:svg.querySelector('.wires'),parts:svg.querySelector('.parts'),dots:svg.querySelector('.dots'),pins:svg.querySelector('.pins'),live:svg.querySelector('.livel'),over:svg.querySelector('.over')};
   svg.addEventListener('pointerdown',e=>this.down(e));svg.addEventListener('pointermove',e=>this.move(e));svg.addEventListener('pointerup',e=>this.up(e));
   svg.addEventListener('pointercancel',()=>this.cancelDrag());svg.addEventListener('contextmenu',e=>e.preventDefault());
   svg.addEventListener('dblclick',e=>this.dbl(e));svg.addEventListener('wheel',e=>this.wheel(e),{passive:false});
   svg.addEventListener('keydown',e=>this.key(e));svg.addEventListener('keyup',e=>{if(e.code==='Space'){this.space=false;svg.classList.remove('grab');}});
   svg.addEventListener('pointerleave',()=>{this.hover=null;this.L.over.querySelector('.ghost')?.remove();});
   holder.addEventListener('dragover',e=>{if(e.dataTransfer.types.includes('application/x-pcl-part')){e.preventDefault();}});
   holder.addEventListener('drop',e=>{const t=e.dataTransfer.getData('application/x-pcl-part');if(!t)return;e.preventDefault();const p=this.world(e);const c=this.addPart(t,snap(p[0]),snap(p[1]));if(c&&!e.shiftKey&&this.autoConnect([c.id]))this.changed('struct');});
   this.ro=new ResizeObserver(()=>{if(!this.userView)this.fit();else this.applyView();});this.ro.observe(holder);
  }
  // ---------------------------------------------------------- model
  comp(id){return this.doc.components.find(c=>c.id===id);}
  wire(id){return this.doc.wires.find(w=>w.id===id);}
  newId(prefix){let i=1;const ids=new Set(this.doc.components.map(c=>c.id).concat(this.doc.wires.map(w=>w.id)));while(ids.has(prefix+i))i++;return prefix+i;}
  pin(c,p){const comp=typeof c==='string'?this.comp(c):c;return P.pinPos(comp,p);}
  wirePts(w){const a=this.pin(w.a.c,w.a.p),b=this.pin(w.b.c,w.b.p);return [a,...(w.pts||[]),b];}
  setWirePts(w,full){const n=normalize(full);w.pts=n.slice(1,-1);}
  snapshot(){return JSON.stringify(this.doc);}
  remember(){this.undoStack.push(this.snapshot());if(this.undoStack.length>120)this.undoStack.shift();this.redoStack=[];}
  undo(){if(!this.undoStack.length)return;this.redoStack.push(this.snapshot());this.doc=JSON.parse(this.undoStack.pop());this.cleanSel();this.render();this.changed('struct');}
  redo(){if(!this.redoStack.length)return;this.undoStack.push(this.snapshot());this.doc=JSON.parse(this.redoStack.pop());this.cleanSel();this.render();this.changed('struct');}
  cleanSel(){for(const id of [...this.sel.c])if(!this.comp(id))this.sel.c.delete(id);for(const id of [...this.sel.w])if(!this.wire(id))this.sel.w.delete(id);}
  load(doc,{keepView=false}={}){this.doc={components:(doc.components||[]).map(c=>({rot:0,flip:false,params:{},...c,params:{...(c.params||{})}})),wires:(doc.wires||[]).map(w=>({...w,pts:(w.pts||[]).map(p=>[...p])}))};
   if(doc.solve)this.doc.solve={...doc.solve}; // options of the solution (3.7): unconnected parts, floating parts
   this.dropDangling();
   for(const w of this.doc.wires)if(!w.pts.length&&!w.fixed){const full=this.wirePts(w);if(!orth(full))this.route(w);}
   this.sel.c.clear();this.sel.w.clear();this.undoStack=[];this.redoStack=[];this.render();if(!keepView){this.userView=false;this.fit();}}
  export(){return JSON.parse(this.snapshot());}
  changed(kind){this.opt.onchange?.(kind);this.opt.onselect?.(this.selection());}
  selection(){return {c:[...this.sel.c],w:[...this.sel.w]};}
  select(cids=[],wids=[],add=false){if(!add){this.sel.c.clear();this.sel.w.clear();}cids.forEach(i=>this.sel.c.add(i));wids.forEach(i=>this.sel.w.add(i));this.renderSel();this.opt.onselect?.(this.selection());}
  addPart(type,x,y,params){
   const def=P.PARTS[type];if(!def)return null;this.remember();
   const id=this.newId(def.prefix);const c={id,type,x,y,rot:0,flip:false,label:id,params:{...P.defaults(type),...(params||{})}};
   if(type==='SW'&&!c.params.pwm){const pwm=this.doc.components.find(k=>k.type==='PWM');if(pwm)c.params.pwm=pwm.id;}
   if(type==='SH'){const pwm=this.doc.components.find(k=>k.type==='PWM'),l=this.doc.components.find(k=>k.type==='L');if(pwm&&!c.params.clock)c.params.clock=pwm.id;if(l&&!c.params.src)c.params.src=l.id;}
   this.doc.components.push(c);this.render();this.select([id]);this.changed('struct');return c;}
  setParams(id,patch,{label}={}){const c=this.comp(id);if(!c)return;this.remember();Object.assign(c.params,patch);if(label!==undefined)c.label=label;
   // a parameter can remove a signal pin (e.g. gate back to PWM): its wires go with it
   if(this.dropDangling()){this.tidyJunctions();this.render();this.changed('struct');return;}
   this.renderPart(c);this.renderLabels();this.renderPins();this.renderWires();this.changed('param');}
  dropDangling(){const ok=e=>{const c=this.comp(e.c);return !!(c&&P.pinsOf(c)[e.p]);};const n=this.doc.wires.length;this.doc.wires=this.doc.wires.filter(w=>ok(w.a)&&ok(w.b));return this.doc.wires.length!==n;}
  // kind of every pin's net: 'sig' when the net holds a signal pin (3.0), else 'el'
  netKinds(){const par=new Map(),find=k=>{while(par.get(k)!==k){par.set(k,par.get(par.get(k)));k=par.get(k);}return k;};const kind=new Map();
   for(const c of this.doc.components)for(const p of Object.keys(P.pinsOf(c))){const k=c.id+':'+p;par.set(k,k);kind.set(k,c.type==='JUNC'?'j':P.pinKind(c,p));}
   for(const w of this.doc.wires){const a=w.a.c+':'+w.a.p,b=w.b.c+':'+w.b.p;if(par.has(a)&&par.has(b))par.set(find(a),find(b));}
   const sig=new Set(),el=new Set();for(const [k,v] of kind){const r=find(k);if(v==='in'||v==='out')sig.add(r);else if(v==='el')el.add(r);}
   return {of:k=>par.has(k)?(sig.has(find(k))?'sig':el.has(find(k))?'el':'j'):null,kind};}
  // options of the solution (3.7), saved with the circuit
  setSolve(patch){this.remember();const s={...(this.doc.solve||{}),...patch};for(const k of Object.keys(s))if(s[k]===''||s[k]===undefined||s[k]===null)delete s[k];this.doc.solve=s;if(!Object.keys(s).length)delete this.doc.solve;this.changed('param');}
  // which parts the solver left out, which pins are open (3.7): drawn on the schematic
  setDiag(d){this.diag=d||null;this.renderDiag();}
  renderDiag(){const d=this.diag,sk=new Set((d?.skipped||[]).map(x=>x.id));for(const g of this.L.parts.querySelectorAll('.part'))g.classList.toggle('skipped',sk.has(g.dataset.c));
   const op=new Set(d?.open||[]);for(const el of this.L.pins.querySelectorAll('.pin'))el.classList.toggle('bad',op.has(el.dataset.pin));}
  kindsOk(a,b){const NK=this.netKinds(),ka=NK.of(a),kb=NK.of(b);return !((ka==='sig'&&kb==='el')||(ka==='el'&&kb==='sig'));}
  wiresAt(id,p){return this.doc.wires.filter(w=>(w.a.c===id&&(p===undefined||w.a.p===p))||(w.b.c===id&&(p===undefined||w.b.p===p)));}
  // a wire whose polyline passes through the grid point q (not at its ends)
  wireAt(q,ex=new Set()){for(const w of this.doc.wires){if(ex.has(w.id))continue;const pts=this.wirePts(w);if(pts.some(x=>!x)||same(pts[0],q)||same(pts[pts.length-1],q))continue;
    for(let i=1;i<pts.length;i++){const [ax,ay]=pts[i-1],[bx,by]=pts[i];if((ax===bx&&q[0]===ax&&q[1]>=Math.min(ay,by)&&q[1]<=Math.max(ay,by))||(ay===by&&q[1]===ay&&q[0]>=Math.min(ax,bx)&&q[0]<=Math.max(ax,bx)))return w;}}return null;}
  // the pin or wire point within snapPx screen pixels of p (pins first)
  nearTarget(p,exclude,exW=new Set()){const r=(this.settings.snapPx||12)/(this.view.k||1);let best=null;
   for(const c of this.doc.components)for(const pn of Object.keys(P.pinsOf(c))){const key=c.id+':'+pn;if(key===exclude)continue;const q=this.pin(c,pn);const d=Math.hypot(q[0]-p[0],q[1]-p[1]);if(d<=r&&(!best||d<best.d))best={d,pin:key,q};}
   if(best)return best;
   for(const w of this.doc.wires){if(exW.has(w.id))continue;const pts=this.wirePts(w);if(pts.some(x=>!x))continue;for(let i=1;i<pts.length;i++){const [ax,ay]=pts[i-1],[bx,by]=pts[i];let q;
     if(ay===by)q=[snap(Math.min(Math.max(p[0],Math.min(ax,bx)),Math.max(ax,bx))),ay];else if(ax===bx)q=[ax,snap(Math.min(Math.max(p[1],Math.min(ay,by)),Math.max(ay,by)))];else continue;
     const d=Math.hypot(q[0]-p[0],q[1]-p[1]);if(d<=r&&(!best||d<best.d))best={d,w:w.id,q};}}
   return best;}
  // a junction dropped on a pin, another junction or a wire merges into it (3.7)
  mergeJunction(jid,moving=new Set()){const j=this.comp(jid);if(!j||j.type!=='JUNC')return false;const at=[j.x,j.y],mine=this.wiresAt(jid);if(!mine.length)return false;let target=null;
   for(const c of this.doc.components){if(c.id===jid||moving.has(c.id))continue;for(const pn of Object.keys(P.pinsOf(c))){if(same(this.pin(c,pn),at)){target={c:c.id,p:pn};break;}}if(target)break;}
   if(target&&!this.kindsOk(jid+':j',target.c+':'+target.p))return false;
   if(!target){const w=this.wireAt(at,new Set(mine.map(w=>w.id)));if(w&&this.kindsOk(jid+':j',w.a.c+':'+w.a.p)){const k=this.splitWire(w.id,at,true);if(k)target={c:k,p:'j'};}}
   if(!target)return false;
   for(const w of mine){if(w.a.c===jid)w.a={c:target.c,p:target.p};if(w.b.c===jid)w.b={c:target.c,p:target.p};}
   this.doc.wires=this.doc.wires.filter(w=>!(w.a.c===w.b.c&&w.a.p===w.b.p));this.doc.components=this.doc.components.filter(c=>c.id!==jid);this.sel.c.delete(jid);this.tidyJunctions();return true;}
  // pins of placed or moved parts that land on a pin, a free end or a wire connect there; a two-pin part along a wire goes in series
  autoConnect(ids){if(!this.settings.autoConnect)return false;let changed=false;const set=new Set(ids);
   for(const id of ids){const c=this.comp(id);if(!c||c.type==='JUNC')continue;
    const free=Object.keys(P.pinsOf(c)).filter(pn=>!this.wiresAt(id,pn).length&&!(P.pinKind(c,pn)==='in'&&c.params?.['in_'+pn]));
    const el=Object.keys(P.elPins(c));
    if(el.length===2&&free.includes(el[0])&&free.includes(el[1])){const qa=this.pin(c,el[0]),qb=this.pin(c,el[1]),w=this.wireAt(qa);
     if(w&&w===this.wireAt(qb)&&!set.has(w.a.c)&&!set.has(w.b.c)&&this.kindsOk(id+':'+el[0],w.a.c+':'+w.a.p)&&this.insertSeries(w,c,el)){changed=true;continue;}}
    for(const pn of free){const q=this.pin(c,pn);let done=false;
     for(const k of this.doc.components){if(set.has(k.id))continue;for(const kp of Object.keys(P.pinsOf(k))){if(!same(this.pin(k,kp),q)||!this.kindsOk(id+':'+pn,k.id+':'+kp))continue;
       if(k.type==='JUNC'){for(const w of this.doc.wires){if(w.a.c===k.id)w.a={c:id,p:pn};if(w.b.c===k.id)w.b={c:id,p:pn};}this.doc.components=this.doc.components.filter(x=>x!==k);}
       else this.doc.wires.push({id:this.newId('w'),a:{c:id,p:pn},b:{c:k.id,p:kp},pts:[]});
       done=true;break;}if(done)break;}
     if(done){changed=true;continue;}
     const w=this.wireAt(q);if(w&&w.a.c!==id&&w.b.c!==id&&this.kindsOk(id+':'+pn,w.a.c+':'+w.a.p)){const j=this.splitWire(w.id,q,true);
      if(j){for(const x of this.doc.wires){if(x.a.c===j)x.a={c:id,p:pn};if(x.b.c===j)x.b={c:id,p:pn};}this.doc.components=this.doc.components.filter(x=>x.id!==j);changed=true;}}}}
   if(changed){this.doc.wires=this.doc.wires.filter(w=>!(w.a.c===w.b.c&&w.a.p===w.b.p));this.tidyJunctions();this.render();}
   return changed;}
  // cut wire w where the two pins of c lie on the same segment; the piece under the part goes
  insertSeries(w,c,[pa,pb]){const pts=this.wirePts(w),qa=this.pin(c,pa),qb=this.pin(c,pb);let total=0;for(let i=1;i<pts.length;i++)total+=Math.abs(pts[i][0]-pts[i-1][0])+Math.abs(pts[i][1]-pts[i-1][1]);
   const pos=q=>{let L=0;for(let i=1;i<pts.length;i++){const [ax,ay]=pts[i-1],[bx,by]=pts[i];if((ax===bx&&q[0]===ax&&q[1]>=Math.min(ay,by)&&q[1]<=Math.max(ay,by))||(ay===by&&q[1]===ay&&q[0]>=Math.min(ax,bx)&&q[0]<=Math.max(ax,bx)))return {i,s:L+Math.abs(q[0]-ax)+Math.abs(q[1]-ay)};L+=Math.abs(bx-ax)+Math.abs(by-ay);}return null;};
   let A=pos(qa),B=pos(qb),first=pa,second=pb,q1=qa,q2=qb;if(!A||!B||A.i!==B.i)return false;if(B.s<A.s){[A,B]=[B,A];[first,second]=[second,first];[q1,q2]=[q2,q1];}
   if(A.s<=0||B.s>=total)return false;
   const w1={...w,id:w.id,b:{c:c.id,p:first},pts:[]},w2={...w,id:this.newId('w'),a:{c:c.id,p:second},pts:[]};delete w2.name;
   this.setWirePts(w1,[...pts.slice(0,A.i),q1]);this.setWirePts(w2,[q2,...pts.slice(B.i)]);this.doc.wires=this.doc.wires.filter(x=>x!==w);this.doc.wires.push(w1,w2);return true;}
  setWireTool(on){this.wireTool=!!on;this.svg.classList.toggle('wiretool',this.wireTool);if(!on)this.cancelWire();this.opt.ontool?.(this.wireTool);}
  startFreeWire(q){this.remember();const j=this.newJunction([snap(q[0]),snap(q[1])]);this.render();this.wiring={from:{c:j,p:'j'},via:[],click:true,made:j};this.svg.classList.add('wiring');this.svg.focus({preventScroll:true});}
  newJunction(q){const j={id:this.newId('J'),type:'JUNC',x:q[0],y:q[1],rot:0,flip:false,label:'',params:{}};this.doc.components.push(j);return j.id;}
  // stop the wire being drawn at a free end: at the given point or at the last corner
  finishFree(at){const wi=this.wiring;if(!wi)return;const via=wi.via.slice();const end=at?[snap(at[0]),snap(at[1])]:via.pop();
   while(via.length&&end&&same(via[via.length-1],end))via.pop();const from=this.pin(wi.from.c,wi.from.p);
   if(!end||same(end,from)){this.cancelWire();if(wi.made){this.tidyJunctions();this.render();}return;}
   const t=this.nearTarget(end,wi.from.c+':'+wi.from.p,new Set(this.wiresAt(wi.from.c).map(w=>w.id)));if(t){wi.via=via;this.finishWire(t.q,t.pin?{pin:t.pin}:{w:t.w});return;}
   const j=this.newJunction(end);wi.via=via;this.finishWire(end,{pin:j+':j'});}
  setWireProps(id,patch){const w=this.wire(id);if(!w)return;this.remember();Object.assign(w,patch);if(patch.name!==undefined&&!patch.name)delete w.name;this.renderWires();this.changed('param');}
  deleteSel(){
   if(!this.sel.c.size&&!this.sel.w.size)return;this.remember();
   const dc=new Set(this.sel.c);this.doc.components=this.doc.components.filter(c=>!dc.has(c.id));
   this.doc.wires=this.doc.wires.filter(w=>!this.sel.w.has(w.id)&&!dc.has(w.a.c)&&!dc.has(w.b.c));
   this.tidyJunctions();this.sel.c.clear();this.sel.w.clear();this.render();this.changed('struct');}
  // junction with two wires -> merge; with none -> remove
  tidyJunctions(){
   for(const j of this.doc.components.filter(c=>c.type==='JUNC')){
    const ws=this.doc.wires.filter(w=>(w.a.c===j.id)||(w.b.c===j.id));
    if(!ws.length){this.doc.components=this.doc.components.filter(c=>c!==j);continue;}
    if(ws.length===2){const [w1,w2]=ws;const p1=this.wirePts(w1),p2=this.wirePts(w2);const a=w1.b.c===j.id?w1.a:w1.b,b=w2.a.c===j.id?w2.b:w2.a;
     const s1=w1.b.c===j.id?p1:p1.slice().reverse(),s2=w2.a.c===j.id?p2:p2.slice().reverse();
     const nw={...w1,id:w1.id,a,b,pts:[]};this.setWirePts(nw,[...s1,...s2.slice(1)]);
     this.doc.wires=this.doc.wires.filter(w=>w!==w1&&w!==w2);this.doc.wires.push(nw);this.doc.components=this.doc.components.filter(c=>c!==j);}
   }
  }
  rotateSel(dir=1){const cs=[...this.sel.c].map(id=>this.comp(id)).filter(c=>c&&c.type!=='JUNC');if(!cs.length)return;this.remember();
   const before=this.captureWires(cs);for(const c of cs)c.rot=((c.rot||0)+dir+4)%4;this.refitWires(cs,before);this.render();this.changed('geom');}
  mirrorSel(){const cs=[...this.sel.c].map(id=>this.comp(id)).filter(c=>c&&c.type!=='JUNC');if(!cs.length)return;this.remember();
   const before=this.captureWires(cs);for(const c of cs)c.flip=!c.flip;this.refitWires(cs,before);this.render();this.changed('geom');}
  captureWires(cs){const ids=new Set(cs.map(c=>c.id));return this.doc.wires.filter(w=>ids.has(w.a.c)||ids.has(w.b.c)).map(w=>({w,pts:this.wirePts(w)}));}
  refitWires(cs,before){for(const {w} of before)this.route(w);}
  copySel(){const ids=new Set(this.sel.c);if(!ids.size)return null;const comps=this.doc.components.filter(c=>ids.has(c.id));const wires=this.doc.wires.filter(w=>ids.has(w.a.c)&&ids.has(w.b.c));this.clip=JSON.parse(JSON.stringify({comps,wires}));return this.clip;}
  paste(dx=40,dy=40){if(!this.clip)return;this.remember();const map=new Map();const nc=[],nw=[];
   for(const c of this.clip.comps){const id=this.newId(P.PARTS[c.type].prefix);map.set(c.id,id);const k={...JSON.parse(JSON.stringify(c)),id,label:c.type==='JUNC'?id:id,x:c.x+dx,y:c.y+dy};this.doc.components.push(k);nc.push(id);}
   for(const w of this.clip.wires){const id=this.newId('w');const k={...JSON.parse(JSON.stringify(w)),id,a:{c:map.get(w.a.c),p:w.a.p},b:{c:map.get(w.b.c),p:w.b.p},pts:(w.pts||[]).map(p=>[p[0]+dx,p[1]+dy])};this.doc.wires.push(k);nw.push(id);}
   // controls inside the copy point to the copied PWM
   for(const id of nc){const c=this.comp(id);if(c.params?.pwm&&map.has(c.params.pwm))c.params.pwm=map.get(c.params.pwm);for(const k of ['sensor','clock','src','ffA','ffB'])if(c.params?.[k]&&map.has(c.params[k]))c.params[k]=map.get(c.params[k]);
    for(const k of Object.keys(c.params||{}))if(k.startsWith('in_')&&c.params[k]){const [sc,sp]=String(c.params[k]).split(':');if(map.has(sc))c.params[k]=map.get(sc)+':'+sp;}}
   this.render();this.select(nc,nw);this.changed('struct');}
  // ---------------------------------------------------------- routing
  obstacles(skip=new Set()){const out=[];for(const c of this.doc.components){if(c.type==='JUNC'||skip.has(c.id))continue;const b=P.bbox(c);out.push([b[0]-2,b[1]-2,b[2]+2,b[3]+2]);}return out;}
  // orthogonal A* from pin a (leaving along its outward direction) to point/pin b
  astar(a,da,b,db,skip){
   const obs=this.obstacles(skip),pad=160;
   const x0=Math.min(a[0],b[0])-pad,y0=Math.min(a[1],b[1])-pad,x1=Math.max(a[0],b[0])+pad,y1=Math.max(a[1],b[1])+pad;
   const W=Math.round((x1-x0)/G)+1,H=Math.round((y1-y0)/G)+1;if(W*H>90000)return null;
   const blocked=new Uint8Array(W*H);
   for(const [bx0,by0,bx1,by1] of obs){for(let gx=Math.ceil((bx0-x0)/G);gx<=Math.floor((bx1-x0)/G);gx++)for(let gy=Math.ceil((by0-y0)/G);gy<=Math.floor((by1-y0)/G);gy++)if(gx>=0&&gy>=0&&gx<W&&gy<H)blocked[gy*W+gx]=1;}
   const used=new Uint8Array(W*H);for(const w of this.doc.wires){if(skip.has('w:'+w.id))continue;const pts=this.wirePts(w);for(let i=1;i<pts.length;i++){const [ax,ay]=pts[i-1],[bx,by]=pts[i];const n=Math.max(Math.abs(bx-ax),Math.abs(by-ay))/G;for(let s=0;s<=n;s++){const gx=Math.round((ax+(bx-ax)*s/(n||1)-x0)/G),gy=Math.round((ay+(by-ay)*s/(n||1)-y0)/G);if(gx>=0&&gy>=0&&gx<W&&gy<H)used[gy*W+gx]=1;}}}
   const near=new Uint8Array(W*H);for(let i=0;i<W*H;i++)if(used[i]){const x=i%W,y=(i/W)|0;for(const [dx,dy] of DIRS){const nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<W&&ny<H)near[ny*W+nx]=1;}}
   const idx=(x,y)=>y*W+x;const sx=Math.round((a[0]-x0)/G),sy=Math.round((a[1]-y0)/G),tx=Math.round((b[0]-x0)/G),ty=Math.round((b[1]-y0)/G);
   blocked[idx(sx,sy)]=0;blocked[idx(tx,ty)]=0;
   const dirIndex=d=>DIRS.findIndex(q=>q[0]===d[0]&&q[1]===d[1]);
   const sd=dirIndex(da),tdIn=db&&(db[0]||db[1])?dirIndex([-db[0],-db[1]]):-1;
   const N=W*H*4,cost=new Float64Array(N).fill(Infinity),prev=new Int32Array(N).fill(-1);
   const h=(x,y)=>Math.abs(x-tx)+Math.abs(y-ty);const heap=new MinHeap();
   const starts=sd>=0?[sd]:[0,1,2,3];const startCell=idx(sx,sy);
   for(const d of starts){const s=idx(sx,sy)*4+d;cost[s]=0;heap.push([h(sx,sy),s]);}
   let found=-1;let iter=0;
   while(heap.size&&iter++<200000){const [f,s]=heap.pop();const cell=s>>2,d=s&3,x=cell%W,y=(cell/W)|0;
    if(f-h(x,y)>cost[s]+1e-9)continue;
    if(x===tx&&y===ty&&(tdIn<0||d===tdIn)){found=s;break;}
    for(let nd=0;nd<4;nd++){if(nd===((d+2)&3))continue;const nx=x+DIRS[nd][0],ny=y+DIRS[nd][1];if(nx<0||ny<0||nx>=W||ny>=H)continue;const nc=idx(nx,ny);if(blocked[nc])continue;
     const step=1+(nd!==d?(cell===startCell?8:3):0)+(used[nc]?4:near[nc]?2:0);const ns=nc*4+nd;const c2=cost[s]+step;if(c2<cost[ns]){cost[ns]=c2;prev[ns]=s;heap.push([c2+h(nx,ny),ns]);}}}
   if(found<0)return null;
   const cells=[];for(let s=found;s>=0;s=prev[s])cells.push(s>>2);cells.reverse();
   const pts=cells.map(c=>[x0+(c%W)*G,y0+((c/W)|0)*G]);return normalize([a,...pts,b]);
  }
  // simple orthogonal fallback (L or Z shape)
  simpleRoute(a,da,b){if(a[0]===b[0]||a[1]===b[1])return [a,b];
   if(da&&da[1]===0)return normalize([a,[snap((a[0]+b[0])/2),a[1]],[snap((a[0]+b[0])/2),b[1]],b]);
   return normalize([a,[a[0],snap((a[1]+b[1])/2)],[b[0],snap((a[1]+b[1])/2)],b]);}
  route(w){const ca=this.comp(w.a.c),cb=this.comp(w.b.c);if(!ca||!cb)return;const a=this.pin(ca,w.a.p),b=this.pin(cb,w.b.p);
   const da=P.pinDir(ca,w.a.p),db=P.pinDir(cb,w.b.p);
   const r=this.astar(a,da[0]||da[1]?da:null,b,db,new Set(['w:'+w.id]))||this.simpleRoute(a,da,b);this.setWirePts(w,r);}
  // keep an orthogonal polyline when its first point moves to q
  adjustEnd(pts,q,da){
   const out=pts.map(p=>[...p]);const old=out[0];out[0]=[...q];
   if(out.length===2){const b=out[1];if(q[0]===b[0]||q[1]===b[1])return out;
    const horiz=old[1]===b[1]&&old[0]!==b[0];return horiz?normalize([q,[snap((q[0]+b[0])/2),q[1]],[snap((q[0]+b[0])/2),b[1]],b]):normalize([q,[q[0],snap((q[1]+b[1])/2)],[b[0],snap((q[1]+b[1])/2)],b]);}
   const p1=out[1];if(old[1]===p1[1]&&old[0]!==p1[0])out[1]=[p1[0],q[1]];else out[1]=[q[0],p1[1]];
   return normalize(out);}
  // ---------------------------------------------------------- rendering
  applyView(){const r=this.holder.getBoundingClientRect();const w=Math.max(r.width,50),h=Math.max(r.height,50),k=this.view.k;
   this.svg.setAttribute('viewBox',`${this.view.cx-w/(2*k)} ${this.view.cy-h/(2*k)} ${w/k} ${h/k}`);this.px=1/k;
   this.svg.querySelector('.gridbg').setAttribute('fill',!this.settings.grid?'transparent':this.settings.gridStyle==='lines'?'url(#glines)':'url(#gdots)');
   this.svg.classList.toggle('zoomed-out',k<.7);}
  fit(margin=50){const b=this.extent();if(!b){this.view={cx:400,cy:250,k:1};this.applyView();return;}const r=this.holder.getBoundingClientRect();
   const k=Math.min(1.9,Math.max(.25,Math.min((r.width||800)/(b[2]-b[0]+2*margin),(r.height||450)/(b[3]-b[1]+2*margin))));this.view={cx:(b[0]+b[2])/2,cy:(b[1]+b[3])/2,k};this.applyView();}
  extent(){const xs=[],ys=[];for(const c of this.doc.components){const b=P.bbox(c);xs.push(b[0],b[2]+(c.type==='JUNC'||c.type==='GND'?0:85));ys.push(b[1]-30,b[3]+14);for(const p of Object.keys(P.pinsOf(c))){const q=this.pin(c,p);xs.push(q[0]);ys.push(q[1]);}}
   for(const w of this.doc.wires)for(const p of w.pts||[]){xs.push(p[0]);ys.push(p[1]);}if(!xs.length)return null;return [Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];}
  render(){this.renderWires();this.L.parts.innerHTML=this.doc.components.map(c=>this.partSVG(c)).join('');this.renderLabels();this.renderPins();this.renderSel();this.applyView();this.updateLive();this.renderDiag();}
  partSVG(c){const def=P.PARTS[c.type];if(c.type==='JUNC')return `<g class="part junc" data-c="${c.id}"><circle class="hit" r="7" cx="${c.x}" cy="${c.y}"/></g>`;
   const [bx,by,bw,bh]=P.boxOf(c);const tf=`translate(${c.x},${c.y}) rotate(${90*(c.rot||0)}) scale(${c.flip?-1:1},1)`;
   // the title text of a rotated or mirrored symbol stays upright and readable (3.5): inverse of rotate·scale about its centre
   let sym=def.draw({...P.defaults(c.type),...c.params});const r=c.rot||0,f=c.flip?-1:1;
   if(r||c.flip)sym=sym.replace(/<text class="(btxt|bsm)" x="([-\d.]+)" y="([-\d.]+)"/g,(m,k,x,y)=>`${m} transform="translate(${x} ${+y-4}) scale(${f} 1) rotate(${-90*r}) translate(${-x} ${4-y})"`);
   return `<g class="part t-${c.type}" data-c="${c.id}" transform="${tf}"><rect class="hit" x="${bx-4}" y="${by-4}" width="${bw+8}" height="${bh+8}" rx="5"/><g class="sym">${sym}</g></g>`;}
  renderPart(c){const el=this.L.parts.querySelector(`[data-c="${CSS.escape(c.id)}"]`);if(el)el.outerHTML=this.partSVG(c);this.renderSel();}
  valueText(c){const p={...P.defaults(c.type),...c.params},e=P.eng;
   switch(c.type){case 'R':return p.sched?'R(t)':e(+p.R,'Ω');case 'L':return e(+p.L,'H');case 'C':return e(+p.C,'F');case 'VDC':return p.ctl==='sig'?'V από σήμα':e(+p.V,'V')+(+p.Rs>0?' · '+e(+p.Rs,'Ω'):'');case 'VAC':return e(+p.Vpk,'V')+' · '+e(+p.f,'Hz');case 'VAC3':return '3φ '+e(+p.Vpk,'V')+' · '+e(+p.f,'Hz');case 'SCR':return p.fire==='alpha'?'α '+(+p.alpha).toLocaleString('el-GR')+'°'+(+p.shift?' +'+(+p.shift).toLocaleString('el-GR')+'°':''):p.fire==='pwm'?'g · '+(p.pwm||'—'):'';
    case 'IDC':return p.ctl==='sig'?'I από σήμα':e(+p.I,'A');case 'CPE':return p.kind==='cpe'?'Q '+e(+p.Q)+' · α '+(+p.alpha).toLocaleString('el-GR'):'σ '+e(+p.sigma,'Ω/√s');case 'CPL':return p.sched?'P(t)':e(+p.P,'W');case 'XFMR':return '1 : '+(+p.n).toLocaleString('el-GR',{maximumFractionDigits:4});case 'SW':return (p.model==='igbt'?'IGBT · ':'')+(p.gate==='sig'?'g από σήμα':p.gate==='pwm'?({a:'g',na:'ḡ',b:'g₂',nb:'ḡ₂'}[p.out]||'g')+' · '+(p.pwm||'—'):p.gate==='on'?'ON':'OFF');
    case 'SH':return (p.in==='sig'?'u':(p.qty==='V'?'v(':'i(')+(p.src||'—')+')')+' · '+({start:'αρχή T',mid:'μέσο T',both:'2 ανά T'}[p.trig]||'');
    case 'MEAS':case 'VM':case 'AM':case 'VP':case 'IP':case 'SR':case 'DISP':return '';
    case 'CONST':return String(p.v).includes(':')?String(p.v).slice(0,22):'';case 'GAIN':return 'K = '+e(+p.K);case 'SUM':return '';
    case 'SAT':return '['+e(+p.lo)+', '+e(+p.hi)+']';case 'CMP':return +p.hys>0?'h = '+e(+p.hys):'';case 'LOGIC':return ['nand','nor','xor'].includes(p.op)?p.op.toUpperCase():'';
    case 'PIB':return 'K_p '+e(+p.Kp)+' · K_i '+e(+p.Ki);case 'UD':return '';
    case 'IM':return 'p = '+p.pp+' · L_M '+e(+p.LM,'H');case 'SRM':return (p.mag==='table'?'ψ(θ, i) από πίνακα':'L_u '+e(+p.Lu,'H')+' · L_a '+e(+p.La,'H'))+(p.load==='sig'?' · τ_L σήμα':'');case 'SM':return 'L_d '+e(+p.Ld,'H')+(p.sat==='d'?' (κορεσμός)':'')+' · L_q '+e(+p.Lq,'H')+(+p.psim>0?' · ψ_m '+e(+p.psim,'V·s'):'');
    case 'KL':{const m=P.klMatrix(p);return m.err?'⚠ πίνακας L':m.L.length+'×'+m.L.length+(String(p.Lmat||'').trim()?' · πίνακας L':' · k '+(+p.k).toLocaleString('el-GR'));}
    case 'KG':{const m=P.parseMat(p.mat);return m?m.length+'×'+m.length+' '+(p.kind==='G'?'G':'R'):'⚠ πίνακας';}
    case 'ILG':return (p.shape==='custom'?e(+p.T1,'s')+'/'+e(+p.T2,'s'):p.shape+' μs')+' · '+e(+p.Ipk,'A');case 'MOD3':return {spwm:'SPWM',svpwm:'SVPWM',square:'six-step'}[p.mode]||'';case 'FEST':return 'R̂_R '+e(+p.RR,'Ω');
    case 'EXPR':return String(p.expr||'').slice(0,28);case 'PY':return (p.pars?String(p.pars).slice(0,26):'Python');
    case 'INT':return p.wrap==='2pi'?'mod 2π':(+p.lo>-1e8||+p.hi<1e8)?'['+e(+p.lo)+', '+e(+p.hi)+']':'';case 'LPF':return 'f_c = '+e(+p.fc,'Hz');
    case 'CLARKE':case 'ICLARKE':return p.inv==='pow'?'ισχύς':'πλάτος';case 'PARK':case 'IPARK':return '';case 'PLL':return e(+p.f0,'Hz')+' · BW '+e(+p.bw,'Hz');
    case 'DCM':return 'ψ '+(+p.psi).toLocaleString('el-GR')+' · J '+(+p.J).toLocaleString('el-GR')+(p.load==='sig'?' · τ_L σήμα':'');
    case 'CLK':return e(+p.f,'Hz')+' · '+(+p.duty).toLocaleString('el-GR');case 'RAMP':return e(+p.f,'Hz')+' · '+e(+p.lo)+'…'+e(+p.hi);
    case 'PWM':return e(+p.fs,'Hz')+(+p.phase&&p.mode!=='spwm'?' · φ '+(+p.phase).toLocaleString('el-GR',{maximumFractionDigits:2})+'°':'')+(+p.dt>0?' · t_d '+e(+p.dt,'s'):'')+' · '+(p.mode==='fixed'?'D = '+(+p.D).toLocaleString('el-GR'):p.mode==='pi'?'PI':p.mode==='spwm'?'SPWM m = '+p.m:p.mode==='ext'?'D από σήμα':'2 έξοδοι');default:return '';}}
  renderLabels(){
   this.L.live.innerHTML=this.doc.components.filter(c=>!['JUNC','GND','TAGO','TAGI'].includes(c.type)).map(c=>{const b=P.bbox(c);const pk=Object.keys(P.elPins(c));const q0=pk[0]&&this.pin(c,pk[0]),q1=pk[1]&&this.pin(c,pk[1]);const blk=!pk.length;const vert=!blk&&c.type!=='XFMR'&&c.type!=='VAC3'&&q0&&q1&&q0[0]===q1[0];
    // signal blocks (3.0) keep their label above, the PWM / S&H blocks at the side as before
    const lb=c.lbl||P.PARTS[c.type].lbl;const side=(vert||blk)&&!(blk&&P.BLOCKS.has(c.type))&&lb!=='below'&&lb!=='above';const below=lb==='below',left=side&&lb==='left';const x=left?b[0]-8:side?b[2]+8:(b[0]+b[2])/2,y=side?(b[1]+b[3])/2-(blk?10:2):below?b[3]+40:b[1]-7;const anchor=left?'end':side?'start':'middle';
    return `<g class="lbls" data-l="${c.id}"><text class="lbl" x="${x}" y="${side?y:y-24}" text-anchor="${anchor}">${esc(c.label||c.id)}</text><text class="val" x="${x}" y="${side?y+13:y-12}" text-anchor="${anchor}">${esc(this.valueText(c))}</text><text class="lv" x="${x}" y="${side?y+26:y}" text-anchor="${anchor}"></text></g>`;}).join('');
   this.liveRefs=new Map();for(const g of this.L.live.querySelectorAll('[data-l]'))this.liveRefs.set(g.dataset.l,g.querySelector('.lv'));
  }
  renderWires(){
   const W=this.settings.wireWidth;const count=new Map();for(const w of this.doc.wires)for(const e of [w.a,w.b]){const k=e.c+':'+e.p;count.set(k,(count.get(k)||0)+1);}
   let h='',dots='';const NK=this.netKinds();this.nk=NK;
   for(const w of this.doc.wires){const pts=this.wirePts(w);if(pts.some(p=>!p))continue;const sig=NK.of(w.a.c+':'+w.a.p)==='sig';
    // signal wires: thinner, own colour, arrow where they enter an input
    const ina=sig&&NK.kind.get(w.a.c+':'+w.a.p)==='in',inb=sig&&NK.kind.get(w.b.c+':'+w.b.p)==='in';const d=this.pathD(ina&&!inb?pts.slice().reverse():pts);
    h+=`<g class="wire${sig?' sig':''}${this.sel.w.has(w.id)?' sel':''}" data-w="${w.id}"><path class="wl" d="${d}"${(ina||inb)?' marker-end="url(#sigArr)"':''} style="${w.color?`stroke:${w.color};`:''}${w.width?`stroke-width:${w.width}px`:sig?`stroke-width:${Math.max(1.2,W*.62)}px`:`stroke-width:${W}px`}"/>`;
    for(let i=1;i<pts.length;i++)h+=`<path class="whit" data-w="${w.id}" data-seg="${i-1}" d="M${pts[i-1][0]},${pts[i-1][1]} L${pts[i][0]},${pts[i][1]}"/>`;
    if(w.name){const m=this.midLabel(pts);h+=`<text class="wname" x="${m[0]}" y="${m[1]-6}" text-anchor="middle">${esc(w.name)}</text>`;}
    h+='</g>';}
   for(const c of this.doc.components){if(c.type==='JUNC'){const n=count.get(c.id+':j')||0;if(n>=3)dots+=`<circle class="jdot${NK.of(c.id+':j')==='sig'?' sig':''}" cx="${c.x}" cy="${c.y}" r="${NK.of(c.id+':j')==='sig'?2.8:3.6}"/>`;else if(n===1)dots+=`<circle class="jfree" cx="${c.x}" cy="${c.y}" r="3.6"/>`;continue;}
    for(const p of Object.keys(P.pinsOf(c))){if((count.get(c.id+':'+p)||0)>=2){const q=this.pin(c,p),sg=NK.of(c.id+':'+p)==='sig';dots+=`<circle class="jdot${sg?' sig':''}" cx="${q[0]}" cy="${q[1]}" r="${sg?2.8:3.6}"/>`;}}}
   this.L.wires.innerHTML=h;this.L.dots.innerHTML=dots;this.pinCount=count;
  }
  pathD(pts){if(this.settings.corner!=='round'||pts.length<3)return 'M'+pts.map(p=>p.join(',')).join(' L');
   let d=`M${pts[0][0]},${pts[0][1]}`;for(let i=1;i<pts.length-1;i++){const [ax,ay]=pts[i-1],[bx,by]=pts[i],[cx,cy]=pts[i+1];const r=Math.min(5,Math.hypot(bx-ax,by-ay)/2,Math.hypot(cx-bx,cy-by)/2);
    const ux=Math.sign(bx-ax),uy=Math.sign(by-ay),vx=Math.sign(cx-bx),vy=Math.sign(cy-by);d+=` L${bx-ux*r},${by-uy*r} Q${bx},${by} ${bx+vx*r},${by+vy*r}`;}
   const l=pts[pts.length-1];return d+` L${l[0]},${l[1]}`;}
  midLabel(pts){let best=0,bi=1;for(let i=1;i<pts.length;i++){const l=Math.abs(pts[i][0]-pts[i-1][0])+Math.abs(pts[i][1]-pts[i-1][1]);if(l>best){best=l;bi=i;}}return [(pts[bi][0]+pts[bi-1][0])/2,(pts[bi][1]+pts[bi-1][1])/2];}
  renderPins(){let h='';const count=this.pinCount||new Map();
   for(const c of this.doc.components){for(const p of Object.keys(P.pinsOf(c))){const q=this.pin(c,p);const n=count.get(c.id+':'+p)||0;
    const k=c.type==='JUNC'?'j':P.pinKind(c,p),src=k==='in'?c.params?.['in_'+p]:null,linked=!!src;
    const sg=k==='in'||k==='out';
    h+=`<circle class="pin${n||linked?'':' open'}${c.type==='JUNC'?' jpin':''}${sg?' spin '+k:''}${linked?' linked':''}" data-pin="${c.id}:${p}" cx="${q[0]}" cy="${q[1]}" r="${c.type==='JUNC'?5:sg?3.4:4.2}"/>`;
    // an input that takes its signal from the parameters: a small tag "← block.output" outside the pin
    if(linked){const [sc,sp]=String(src).split(':'),s0=this.comp(sc),d=P.pinDir(c,p),ok=!!(s0&&P.pinsOf(s0)[sp]);const t=(ok?'← '+(s0.label||sc)+'.'+sp:'← ? '+src);
     const anchor=d[0]<0?'end':d[0]>0?'start':'middle',x=q[0]+d[0]*7,y=q[1]+(d[1]?d[1]*12:-5);
     h+=`<text class="stag${ok?'':' bad'}" x="${x}" y="${y}" text-anchor="${anchor}">${esc(t)}</text>`;}}}
   this.L.pins.innerHTML=h;}
  renderSel(){for(const g of this.L.parts.querySelectorAll('.part'))g.classList.toggle('sel',this.sel.c.has(g.dataset.c));for(const g of this.L.wires.querySelectorAll('.wire'))g.classList.toggle('sel',this.sel.w.has(g.dataset.w));}
  // live values from the simulator
  setLive(fn){this.live=fn;this.updateLive();}
  updateLive(){if(!this.live||!this.liveRefs)return;
   for(const c of this.doc.components){const v=this.live(c);const g=this.L.parts.querySelector(`[data-c="${CSS.escape(c.id)}"]`);if(!g)continue;
    g.classList.toggle('on',!!v?.on);g.classList.toggle('off',v?.on===false);
    const t=this.liveRefs.get(c.id);
    if(c.type==='DISP'){const d=g.querySelector('.sym .bsm');if(d)d.textContent=v?.text||'—';if(t)t.textContent='';continue;} // the display shows its value inside
    if(t)t.textContent=this.settings.showLive&&v?.text?v.text:'';}
   this.drawArrows();}
  drawArrows(){let h='';const types=['L','R','C','VDC','VAC','D','SW','CPL','IDC'];let big=0;const vals=new Map();if(this.settings.showArrows&&this.live)for(const c of this.doc.components)if(types.includes(c.type)){const v=this.live(c);vals.set(c.id,v);if(v&&Number.isFinite(v.i))big=Math.max(big,Math.abs(v.i));}
   if(this.settings.showArrows&&this.live)for(const c of this.doc.components){if(!types.includes(c.type))continue;const v=vals.get(c.id);if(!v||!Number.isFinite(v.i)||Math.abs(v.i)<Math.max(1e-9,2e-3*big))continue;
    const pins=Object.keys(P.pinsOf(c));let a=this.pin(c,pins[0]),b=this.pin(c,pins[1]);
    // current a->b for passives; sources report current out of p (flowing p->external): inside the source n->p
    let dir=Math.sign(v.i);if(['VDC','VAC','IDC'].includes(c.type))dir=-dir;if(dir<0)[a,b]=[b,a];
    const bb=P.bbox(c),horiz=Math.abs(a[1]-b[1])<1,off=horiz?[0,(bb[3]-c.y)+12]:[(c.x-bb[0])+12,0];
    const mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,ux=Math.sign(b[0]-a[0]),uy=Math.sign(b[1]-a[1]),L=12;
    h+=`<path class="flow" d="M${mx-ux*L-off[0]*(horiz?0:1)},${my-uy*L+off[1]*(horiz?1:0)} L${mx+ux*L-off[0]*(horiz?0:1)},${my+uy*L+off[1]*(horiz?1:0)}" marker-end="url(#flowArr)"/>`;}
   let g=this.L.over.querySelector('.arrows');if(!g){g=document.createElementNS(NS,'g');g.setAttribute('class','arrows');this.L.over.appendChild(g);}g.innerHTML=h;}
  // ---------------------------------------------------------- coordinates
  world(e){const pt=this.svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const m=this.svg.getScreenCTM();if(!m)return [0,0];const p=pt.matrixTransform(m.inverse());return [p.x,p.y];}
  // element under the pointer even while the svg holds pointer capture
  hitAt(e){const t=document.elementFromPoint(e.clientX,e.clientY);return this.hitOf({target:t&&this.svg.contains(t)?t:this.svg});}
  hitOf(e){const t=e.target;return {pin:t.closest?.('[data-pin]')?.dataset.pin,c:t.closest?.('[data-c]')?.dataset.c,w:t.closest?.('[data-w]')?.dataset.w,seg:t.dataset?.seg!==undefined?+t.dataset.seg:null};}
  // ---------------------------------------------------------- pointer
  down(e){
   this.svg.focus({preventScroll:true});e.preventDefault();const p=this.world(e),h=this.hitOf(e);
   this.press={x:e.clientX,y:e.clientY,p,h,button:e.button,shift:e.shiftKey||e.ctrlKey||e.metaKey,alt:e.altKey,moved:false,id:e.pointerId};
   const pan=(e.button===1&&this.settings.middleDrag==='pan')||(e.button===0&&(this.space||this.settings.leftDrag==='pan'&&!h.c&&!h.w&&!h.pin))||(e.button===2&&this.settings.rightButton==='pan');
   if(this.placing&&e.button===0){this.finishPlace(p,e.shiftKey);this.press=null;return;}
   if(this.wiring&&e.button===0){this.wireClick(p,h);this.press=null;return;}
   if(this.wiring&&e.button===2){this.cancelWire();this.press=null;return;}
   // wire tool (3.7): start on a pin, on a wire, or anywhere (a free end)
   if(this.wireTool&&e.button===0&&!pan){this.press=null;
    const t=h.pin?{pin:h.pin}:h.w&&!h.c?{w:h.w,q:p}:this.nearTarget(p);
    if(!t&&h.c)return;this.remember();
    if(t?.pin){this.startWire(t.pin,true);return;}
    const j=t?.w?this.splitWire(t.w,t.q,true):(()=>{const id=this.newJunction([snap(p[0]),snap(p[1])]);this.render();return id;})();
    if(j){this.wiring={from:{c:j,p:'j'},via:[],click:true,made:j};this.svg.classList.add('wiring');}return;}
   if(pan){this.userView=true;this.press.kind='pan';this.press.view={...this.view};this.svg.setPointerCapture(e.pointerId);this.svg.classList.add('panning');return;}
   if(e.button===2){this.press.kind='menu';return;}
   if(e.button!==0)return;
   if(h.pin){const [pc]=h.pin.split(':');const pcomp=this.comp(pc);
    if(pcomp?.type==='JUNC'){if(this.press.shift){this.press.h.c=pc;this.press.kind='toggle';return;}if(this.sel.c.has(pc)||e.altKey||this.wiresAt(pc).length===1){if(!this.sel.c.has(pc))this.select([pc],[]);this.press.h.c=pc;this.press.kind='move';this.svg.setPointerCapture(e.pointerId);return;}this.press.kind='wire';this.press.junc=pc;this.svg.setPointerCapture(e.pointerId);return;}
    this.press.kind='wire';this.svg.setPointerCapture(e.pointerId);return;}
   if(h.c){const id=h.c;if(this.press.shift){this.press.kind='toggle';return;}
    if(!this.sel.c.has(id)){this.select([id],[]);this.press.fresh=true;}this.press.kind='move';this.svg.setPointerCapture(e.pointerId);return;}
   if(h.w){if(e.altKey||e.ctrlKey&&!e.shiftKey){this.press.kind='wirefromwire';this.svg.setPointerCapture(e.pointerId);return;}
    if(this.press.shift){this.press.kind='toggle';return;}if(!this.sel.w.has(h.w))this.select([],[h.w]);this.press.kind='seg';this.svg.setPointerCapture(e.pointerId);return;}
   this.press.kind='marquee';this.svg.setPointerCapture(e.pointerId);
  }
  move(e){
   const p=this.world(e);this.hover=p;
   if(this.placing){this.ghost(p);return;}
   if(this.wiring&&!this.press){this.previewWire(p,this.hitAt(e));return;}
   const pr=this.press;if(!pr){this.hoverPin(e);return;}
   const dist=Math.hypot(e.clientX-pr.x,e.clientY-pr.y);if(!pr.moved&&dist<4)return;
   if(!pr.moved){pr.moved=true;this.beginDrag(pr);}
   if(pr.kind==='pan'){const k=this.view.k;this.view.cx=pr.view.cx-(e.clientX-pr.x)/k;this.view.cy=pr.view.cy-(e.clientY-pr.y)/k;this.applyView();return;}
   if(pr.kind==='marquee'){this.drawMarquee(pr.p,p);return;}
   if(pr.kind==='move'){this.dragMove(snap(p[0]-pr.p[0]),snap(p[1]-pr.p[1]));return;}
   if(pr.kind==='seg'&&pr.seg){this.dragSeg(p);return;}
   if(pr.kind==='wire'||pr.kind==='wirefromwire'){this.previewWire(p,this.hitAt(e));return;}
  }
  up(e){
   const pr=this.press;this.press=null;if(!pr)return;this.svg.classList.remove('panning');
   try{this.svg.releasePointerCapture(e.pointerId);}catch{}
   const h=this.hitAt(e),p=this.world(e);
   if(pr.kind==='pan'){if(!pr.moved&&pr.button===2)this.menu(e,h);return;}
   if(pr.kind==='menu'){this.menu(e,h);return;}
   if(pr.kind==='toggle'){if(h.c||pr.h.c){const id=pr.h.c;this.sel.c.has(id)?this.sel.c.delete(id):this.sel.c.add(id);}else if(pr.h.w){const id=pr.h.w;this.sel.w.has(id)?this.sel.w.delete(id):this.sel.w.add(id);}this.renderSel();this.opt.onselect?.(this.selection());return;}
   if(pr.kind==='marquee'){this.L.over.querySelector('.marquee')?.remove();if(!pr.moved){if(!pr.shift)this.select([],[]);return;}this.marqueeSelect(pr.p,p,pr.shift);return;}
   if(pr.kind==='move'){if(pr.moved){this.endDrag(true,!e.shiftKey);}else if(!pr.fresh&&(this.sel.c.size>1||this.sel.w.size)){this.select([pr.h.c],[]);}return;}
   if(pr.kind==='seg'){if(pr.moved)this.endDrag();return;}
   if(pr.kind==='wire'||pr.kind==='wirefromwire'){
    if(!pr.moved){if(pr.junc){this.select([pr.junc],[]);return;}if(pr.kind==='wire'){this.remember();this.startWire(pr.h.pin,true);}return;}
    this.finishWire(p,h);return;}
  }
  cancelDrag(){this.press=null;this.svg.classList.remove('panning');this.L.over.querySelector('.marquee')?.remove();}
  hoverPin(e){const pin=e.target.dataset?.pin;this.svg.classList.toggle('over-pin',!!pin);const id=e.target.closest?.('[data-c]')?.dataset.c||(pin&&pin.split(':')[0])||null;
   if(id!==this.hotPart){this.hotPart=id;for(const el of this.L.pins.querySelectorAll('.pin.hot'))el.classList.remove('hot');if(id)for(const el of this.L.pins.querySelectorAll(`[data-pin^="${CSS.escape(id)}:"]`))el.classList.add('hot');}}
  dbl(e){if(this.wiring){this.finishFree();return;}const h=this.hitAt(e);if(h.c&&this.comp(h.c)?.type!=='JUNC'){this.opt.onedit?.({kind:'comp',id:h.c,x:e.clientX,y:e.clientY,dbl:true});}else if(h.w)this.opt.onedit?.({kind:'wire',id:h.w,x:e.clientX,y:e.clientY,dbl:true});}
  menu(e,h){if(h.c&&!this.sel.c.has(h.c))this.select([h.c],[]);else if(!h.c&&h.w&&!this.sel.w.has(h.w))this.select([],[h.w]);
   this.opt.oncontext?.({kind:h.c?'comp':h.w?'wire':'empty',id:h.c||h.w,pin:h.pin,x:e.clientX,y:e.clientY,world:this.world(e)});}
  wheel(e){e.preventDefault();this.userView=true;const zoom=this.settings.wheel==='zoom'?!e.shiftKey:(e.ctrlKey||e.metaKey);
   if(zoom){const p=this.world(e),f=Math.exp(-e.deltaY*(e.deltaMode?0.05:0.0015));const k=Math.min(4,Math.max(.15,this.view.k*f));const r=k/this.view.k;
    this.view.cx=p[0]-(p[0]-this.view.cx)/r;this.view.cy=p[1]-(p[1]-this.view.cy)/r;this.view.k=k;}
   else{const k=this.view.k;this.view.cx+=(e.shiftKey?e.deltaY:e.deltaX)/k;this.view.cy+=(e.shiftKey?0:e.deltaY)/k;}
   this.applyView();}
  key(e){
   const k=e.key.toLowerCase(),ctrl=e.ctrlKey||e.metaKey;
   if(e.target!==this.svg)return;
   if(e.code==='Space'){this.space=true;this.svg.classList.add('grab');e.preventDefault();return;}
   if(k==='escape'){if(this.wiring){const m=this.wiring.made;this.cancelWire();if(m){this.tidyJunctions();this.render();}}else if(this.placing)this.cancelPlace();else if(this.wireTool)this.setWireTool(false);else this.select([],[]);return;}
   if(this.wiring&&k==='backspace'){e.preventDefault();this.wiring.via.pop();this.previewWire(this.hover||this.pin(this.wiring.from.c,this.wiring.from.p),null);return;}
   if(this.wiring&&k==='enter'){e.preventDefault();this.finishFree(this.hover);return;}
   if(!ctrl&&k==='w'){this.setWireTool(!this.wireTool);return;}
   if(k==='delete'||k==='backspace'){e.preventDefault();this.deleteSel();return;}
   if(ctrl&&k==='z'&&!e.shiftKey){e.preventDefault();this.undo();return;}
   if(ctrl&&(k==='y'||(k==='z'&&e.shiftKey))){e.preventDefault();this.redo();return;}
   if(ctrl&&k==='a'){e.preventDefault();this.select(this.doc.components.map(c=>c.id),this.doc.wires.map(w=>w.id));return;}
   if(ctrl&&k==='c'){this.copySel();return;}
   if(ctrl&&k==='v'){e.preventDefault();this.paste();return;}
   if(ctrl&&k==='d'){e.preventDefault();this.copySel();this.paste(20,20);return;}
   if(!ctrl&&k==='r'){if(this.placing){this.placing.rot=(this.placing.rot+1)%4;this.ghost(this.hover||[0,0]);}else this.rotateSel(e.shiftKey?-1:1);return;}
   if(!ctrl&&k==='m'){this.mirrorSel();return;}
   if(!ctrl&&k==='f'){this.fit();return;}
   const arrows={arrowleft:[-G,0],arrowright:[G,0],arrowup:[0,-G],arrowdown:[0,G]};
   if(arrows[k]&&this.sel.c.size){e.preventDefault();this.beginDrag({kind:'move'});this.dragMove(...arrows[k]);this.endDrag(false,false);}
  }
  // ---------------------------------------------------------- drag: parts
  beginDrag(pr){
   if(pr.kind==='move'){this.remember();const ids=this.sel.c;this.drag={start:new Map([...ids].map(id=>{const c=this.comp(id);return [id,[c.x,c.y]];})),
     wires:this.doc.wires.filter(w=>ids.has(w.a.c)||ids.has(w.b.c)).map(w=>({w,both:ids.has(w.a.c)&&ids.has(w.b.c),aMoves:ids.has(w.a.c),pts:this.wirePts(w)}))};}
   if(pr.kind==='seg'){const w=this.wire(pr.h.w);if(!w||pr.h.seg===null){pr.seg=null;return;}this.remember();pr.seg={w,k:pr.h.seg,pts:this.wirePts(w)};}
   if(pr.kind==='marquee')this.drawMarquee(pr.p,pr.p);
   if(pr.kind==='wire'||pr.kind==='wirefromwire'){this.remember();this.startWireFrom(pr);}
  }
  dragMove(dx,dy){
   const d=this.drag;if(!d)return;
   for(const [id,[x,y]] of d.start){const c=this.comp(id);c.x=x+dx;c.y=y+dy;}
   for(const o of d.wires){const w=o.w;if(o.both){w.pts=o.pts.slice(1,-1).map(p=>[p[0]+dx,p[1]+dy]);continue;}
    const full=o.aMoves?o.pts:o.pts.slice().reverse();const end=o.aMoves?w.a:w.b;const q=this.pin(end.c,end.p);
    let r=this.adjustEnd(full,q);if(!o.aMoves)r=r.reverse();this.setWirePts(w,r);}
   // move DOM directly for smoothness
   for(const id of d.start.keys()){const c=this.comp(id);const g=this.L.parts.querySelector(`[data-c="${CSS.escape(id)}"]`);if(g&&c.type!=='JUNC')g.setAttribute('transform',`translate(${c.x},${c.y}) rotate(${90*(c.rot||0)}) scale(${c.flip?-1:1},1)`);else if(g)g.querySelector('circle').setAttribute('cx',c.x),g.querySelector('circle').setAttribute('cy',c.y);}
   this.renderWires();this.renderPins();this.renderLabels();this.renderSel();this.updateLive();
  }
  endDrag(notify=true,auto=true){
   const d=this.drag;if(d&&this.settings.autoRoute)for(const o of d.wires)if(!o.both)this.route(o.w);
   let struct=false;
   if(d&&auto){const ids=[...d.start.keys()],mv=new Set(ids);for(const id of ids)if(this.comp(id)?.type==='JUNC'&&this.mergeJunction(id,mv))struct=true;
    if(this.autoConnect(ids.filter(id=>this.comp(id)&&this.comp(id).type!=='JUNC')))struct=true;}
   this.drag=null;this.render();this.changed(struct?'struct':'geom');void notify;}
  // ---------------------------------------------------------- drag: wire segment
  dragSeg(p){
   const s=this.press.seg;const base=s.pts.map(q=>[...q]);let k=s.k;const n=base.length;
   const horiz=base[k][1]===base[k+1][1];
   const stub=(from,to)=>{const len=Math.abs(to[0]-from[0])+Math.abs(to[1]-from[1]);if(len<30)return [...from];return [from[0]+Math.sign(to[0]-from[0])*G,from[1]+Math.sign(to[1]-from[1])*G];};
   let pts=base;
   if(k===0){const st=stub(base[0],base[1]);pts=[base[0],st,[...st],...base.slice(1)];k=2;if(same(st,base[0])){pts=[base[0],[...base[0]],...base.slice(1)];k=1;}}
   if(k===pts.length-2){const last=pts[pts.length-1],st=stub(last,pts[pts.length-2]);if(same(st,last))pts=[...pts.slice(0,-1),[...last],last];else pts=[...pts.slice(0,-1),[...st],st,last];}
   const d=horiz?snap(p[1]-this.press.p[1]):snap(p[0]-this.press.p[0]);
   if(horiz){pts[k]=[pts[k][0],pts[k][1]+d];pts[k+1]=[pts[k+1][0],pts[k+1][1]+d];}else{pts[k]=[pts[k][0]+d,pts[k][1]];pts[k+1]=[pts[k+1][0]+d,pts[k+1][1]];}
   void n;this.setWirePts(s.w,pts);this.renderWires();this.renderPins();this.renderSel();
  }
  // ---------------------------------------------------------- marquee
  drawMarquee(a,b){let r=this.L.over.querySelector('.marquee');if(!r){r=document.createElementNS(NS,'rect');r.setAttribute('class','marquee');this.L.over.appendChild(r);}
   const crossing=this.settings.marquee==='touch'||(this.settings.marquee==='direction'&&b[0]<a[0]);r.classList.toggle('crossing',crossing);
   r.setAttribute('x',Math.min(a[0],b[0]));r.setAttribute('y',Math.min(a[1],b[1]));r.setAttribute('width',Math.abs(b[0]-a[0]));r.setAttribute('height',Math.abs(b[1]-a[1]));}
  marqueeSelect(a,b,add){
   const x0=Math.min(a[0],b[0]),x1=Math.max(a[0],b[0]),y0=Math.min(a[1],b[1]),y1=Math.max(a[1],b[1]);
   const crossing=this.settings.marquee==='touch'||(this.settings.marquee==='direction'&&b[0]<a[0]);
   const inside=bb=>crossing?!(bb[2]<x0||bb[0]>x1||bb[3]<y0||bb[1]>y1):(bb[0]>=x0&&bb[2]<=x1&&bb[1]>=y0&&bb[3]<=y1);
   const cs=this.doc.components.filter(c=>inside(P.bbox(c))).map(c=>c.id);
   const ws=this.doc.wires.filter(w=>{const pts=this.wirePts(w);const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);const bb=[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];
    if(crossing)return pts.some((p,i)=>i&&!(Math.max(p[0],pts[i-1][0])<x0||Math.min(p[0],pts[i-1][0])>x1||Math.max(p[1],pts[i-1][1])<y0||Math.min(p[1],pts[i-1][1])>y1));return inside(bb);}).map(w=>w.id);
   this.select(cs,ws,add);}
  // ---------------------------------------------------------- placing
  beginPlace(type){this.cancelWire();this.placing={type,rot:0};this.svg.classList.add('placing');this.svg.focus({preventScroll:true});if(this.hover)this.ghost(this.hover);}
  ghost(p){let g=this.L.over.querySelector('.ghost');if(!g){g=document.createElementNS(NS,'g');g.setAttribute('class','ghost');this.L.over.appendChild(g);}
   const c={type:this.placing.type,x:snap(p[0]),y:snap(p[1]),rot:this.placing.rot,flip:false,params:P.defaults(this.placing.type)};g.innerHTML=this.partSVG({...c,id:'ghost'});}
  finishPlace(p,shift){const t=this.placing;const c=this.addPart(t.type,snap(p[0]),snap(p[1]));if(c&&t.rot){c.rot=t.rot;this.render();}if(c&&!shift&&this.autoConnect([c.id]))this.changed('struct');if(!this.keepPlacing)this.cancelPlace();}
  cancelPlace(){this.placing=null;this.svg.classList.remove('placing');this.L.over.querySelector('.ghost')?.remove();}
  // ---------------------------------------------------------- wiring
  startWire(pin,click){const [c,p]=pin.split(':');this.wiring={from:{c,p},via:[],click};this.svg.classList.add('wiring');}
  startWireFrom(pr){if(pr.kind==='wire')this.startWire(pr.h.pin,false);else{const j=this.splitWire(pr.h.w,pr.p,true);if(j){this.wiring={from:{c:j,p:'j'},via:[],click:false,made:j};this.svg.classList.add('wiring');}}}
  previewWire(p,h){if(!this.wiring)return;let g=this.L.over.querySelector('.wprev');if(!g){g=document.createElementNS(NS,'path');g.setAttribute('class','wprev');this.L.over.appendChild(g);}
   const from=this.pin(this.wiring.from.c,this.wiring.from.p);const fc=this.comp(this.wiring.from.c);const da=P.pinDir(fc,this.wiring.from.p);
   let end=[snap(p[0]),snap(p[1])],ring=null;const fk=this.wiring.from.c+':'+this.wiring.from.p,exW=new Set(this.wiresAt(this.wiring.from.c).map(w=>w.id));
   if(!h?.pin){const t=this.nearTarget(p,fk,exW);if(t?.pin)h={pin:t.pin};else if(t?.w){ring=t.q;end=t.q;}}
   if(h?.pin){const [c,pp]=h.pin.split(':');end=this.pin(c,pp);}
   {let r=this.L.over.querySelector('.snapring');if(ring){if(!r){r=document.createElementNS(NS,'circle');r.setAttribute('class','snapring');r.setAttribute('r','5');this.L.over.appendChild(r);}r.setAttribute('cx',ring[0]);r.setAttribute('cy',ring[1]);}else r?.remove();}
   const pts=[from,...this.wiring.via];const last=pts[pts.length-1];const seg=this.simpleRoute(last,pts.length===1?da:null,end);
   g.setAttribute('d','M'+[...pts,...seg.slice(1)].map(q=>q.join(',')).join(' L'));
   this.svg.querySelectorAll('.pin.target').forEach(x=>x.classList.remove('target'));if(h?.pin)this.svg.querySelector(`[data-pin="${CSS.escape(h.pin)}"]`)?.classList.add('target');}
  wireClick(p,h){ // click-to-connect mode
   if(!h.pin&&!(h.w&&!h.c)){const t=this.nearTarget(p,this.wiring.from.c+':'+this.wiring.from.p,new Set(this.wiresAt(this.wiring.from.c).map(w=>w.id)));if(t?.pin)h={pin:t.pin};else if(t?.w){h={w:t.w};p=t.q;}}
   if(h.pin&&h.pin!==this.wiring.from.c+':'+this.wiring.from.p){this.finishWire(p,h);return;}
   if(h.w&&!h.c){this.finishWire(p,h);return;}
   this.wiring.via.push(this.wiring.via.length?this.orthoNext(this.wiring.via[this.wiring.via.length-1],[snap(p[0]),snap(p[1])]):[snap(p[0]),snap(p[1])]);
  }
  orthoNext(a,b){return Math.abs(b[0]-a[0])>Math.abs(b[1]-a[1])?[b[0],a[1]]:[a[0],b[1]];}
  finishWire(p,h){
   const wi=this.wiring;if(!wi)return;let to=null;
   if(!h.pin&&!(h.w&&!h.c)){const t=this.nearTarget(p,wi.from.c+':'+wi.from.p,new Set(this.wiresAt(wi.from.c).map(w=>w.id)));if(t?.pin)h={pin:t.pin};else if(t?.w){h={w:t.w};p=t.q;}}
   if(h.pin){const [c,pp]=h.pin.split(':');if(!(c===wi.from.c&&pp===wi.from.p))to={c,p:pp};}
   else if(h.w&&!h.c){const j=this.splitWire(h.w,p,true);if(j)to={c:j,p:'j'};}
   // released in empty space (3.7): the wire keeps a free end there, to connect later
   if(!to&&this.settings.freeEnds&&!wi.click){const q=[snap(p[0]),snap(p[1])],a=this.pin(wi.from.c,wi.from.p);if(a&&Math.abs(q[0]-a[0])+Math.abs(q[1]-a[1])>=2*G)to={c:this.newJunction(q),p:'j'};}
   if(!to){this.cancelWire();if(wi.made){this.tidyJunctions();this.render();}return;}
   {const NK=this.netKinds(),ka=NK.of(wi.from.c+':'+wi.from.p),kb=NK.of(to.c+':'+to.p);
    if((ka==='sig'&&kb==='el')||(ka==='el'&&kb==='sig')){this.cancelWire();if(wi.made||to.c.startsWith('J')){this.tidyJunctions();this.render();}this.opt.onwarn?.('Ένα σύρμα σήματος δεν ενώνεται με ηλεκτρικό κόμβο. Για να μετρήσεις, βάλε βολτόμετρο, αμπερόμετρο ή «Μέτρηση στοιχείου».');return;}}
   if(this.doc.wires.some(w=>(w.a.c===wi.from.c&&w.a.p===wi.from.p&&w.b.c===to.c&&w.b.p===to.p)||(w.b.c===wi.from.c&&w.b.p===wi.from.p&&w.a.c===to.c&&w.a.p===to.p))){this.cancelWire();return;}
   const w={id:this.newId('w'),a:wi.from,b:to,pts:[]};
   if(wi.via.length){const a=this.pin(w.a.c,w.a.p),b=this.pin(w.b.c,w.b.p);const fc=this.comp(w.a.c);const first=this.simpleRoute(a,P.pinDir(fc,w.a.p),wi.via[0]);
    let pts=[...first];for(let i=1;i<wi.via.length;i++)pts.push(...this.simpleRoute(wi.via[i-1],null,wi.via[i]).slice(1));pts.push(...this.simpleRoute(wi.via[wi.via.length-1],null,b).slice(1));this.setWirePts(w,pts);}
   this.doc.wires.push(w);if(!wi.via.length)this.route(w);
   this.cancelWire();this.render();this.select([],[w.id]);this.changed('struct');}
  cancelWire(){this.wiring=null;this.svg.classList.remove('wiring');this.L.over.querySelector('.wprev')?.remove();this.L.over.querySelector('.snapring')?.remove();this.svg.querySelectorAll('.pin.target').forEach(x=>x.classList.remove('target'));}
  // split a wire at the grid point closest to p; returns the junction id
  splitWire(wid,p,noRemember){
   const w=this.wire(wid);if(!w)return null;const pts=this.wirePts(w);let best=null;
   for(let i=1;i<pts.length;i++){const [ax,ay]=pts[i-1],[bx,by]=pts[i];let q;if(ay===by){q=[snap(Math.min(Math.max(p[0],Math.min(ax,bx)),Math.max(ax,bx))),ay];}else{q=[ax,snap(Math.min(Math.max(p[1],Math.min(ay,by)),Math.max(ay,by)))];}
    const d=Math.hypot(q[0]-p[0],q[1]-p[1]);if(!best||d<best.d)best={d,i,q};}
   if(!best)return null;if(!noRemember)this.remember();
   const j={id:this.newId('J'),type:'JUNC',x:best.q[0],y:best.q[1],rot:0,flip:false,label:'',params:{}};this.doc.components.push(j);
   const w1={...w,id:w.id,b:{c:j.id,p:'j'},pts:[]},w2={...w,id:this.newId('w'),a:{c:j.id,p:'j'},b:w.b,pts:[]};delete w2.name;
   this.setWirePts(w1,[...pts.slice(0,best.i),best.q]);this.setWirePts(w2,[best.q,...pts.slice(best.i)]);
   this.doc.wires=this.doc.wires.filter(x=>x!==w);this.doc.wires.push(w1,w2);this.render();return j.id;}
  // nets for probes: pin keys connected to a wire
  wireNetPin(wid){const w=this.wire(wid);return w?w.a.c+':'+w.a.p:null;}
 }
 root.Editor=Editor;root.EditorUtil={normalize,orth};
})(window);
