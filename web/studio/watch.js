'use strict';
// Signals of the control over the drawing (4.8, ROADMAP §47): one layer that shows and hides (button ▣ Σήματα, key S).
//  - Tiles. A signal tile shows the value, the unit and a small curve of the window of the scope. A control tile has a
//    slider and a number for a numeric parameter (or a constant, or the reference of a PI), a switch for a yes/no
//    parameter (e.g. «Μαθαίνει» of a network), a list for a choice, and step buttons such as −10 % / +10 %.
//  - A tile is pinned next to its part on the drawing, or sits in a floating panel over the work area. On the drawing it
//    is HTML in the layer .wtl inside .schem-xf, in the units of the drawing like the labels: zoom and pan move it with
//    the drawing at no cost (ARCHITECTURE §3, «Απόκριση του σχεδίου»).
//  - The watch table: every tile as a row with value, unit, sample time, source, NaN and saturation.
//  - The layout belongs to the project (doc.watch) and a tutorial can bring its own (project extra 'watch').
// Values come from the page's Sim, which mirrors the ticks of the worker (live.js apply); a change goes through the same
// path as the live parameters (app.js liveParam: setBlock / setControl, or a load with the states, which live.js forwards
// to the worker). So each change applies at the boundary of a step, is marked on the scope and becomes a t:value program
// with «→ πρόγραμμα t:τιμή». Updates: from app.js draw once every few frames; only the text that changed, and the curve
// only when the time moved. No DOM is built in the loop.
(function(root){
 const P=root.Parts;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const num=x=>x===''||x===null||x===undefined?NaN:+x;
 const W={ctx:null,refs:new Map(),vis:false,panel:null,addFor:null,sugs:[],raf:0,pend:null};

 // ------------------------------------------------------------ the layout (pure: tests/js/watch_cases.js)
 // doc.watch = {show, panel:{x, y, view, min}, tiles:[{id, key | ctl:{c, k}, label, at:[x, y], al, steps:[…], rng:[lo, hi], span}]}:
// at = the top-left corner on the drawing (al:'r': the top-right corner, for a tile left of its part; the tile keeps a
// readable size on the screen and grows from that corner).
 // A tutorial may write a tile as ['Y:M1', 'ω', [x, y]] (a signal) or {ctl:'KW.v', label:'ω*', at:[x, y], steps:'−10 %; +10 %'};
 // a list alone is the tiles. Tiles without a key or a control are dropped; ids are made unique (w1, w2, …).
 function norm(w){if(!w)return null;const src=Array.isArray(w)?{tiles:w}:w,tiles=[],ids=new Set();let n=0;
  for(const t0 of Array.isArray(src.tiles)?src.tiles:[]){if(!t0)continue;const t=Array.isArray(t0)?{key:t0[0],label:t0[1],at:t0[2]}:{...t0};
   if(typeof t.ctl==='string'){const i=t.ctl.lastIndexOf('.');t.ctl=i>0?{c:t.ctl.slice(0,i),k:t.ctl.slice(i+1)}:null;}
   if(t.ctl&&!(t.ctl.c&&t.ctl.k))t.ctl=null;if(!t.ctl)delete t.ctl;
   if(!(typeof t.key==='string'&&t.key)){delete t.key;if(!t.ctl)continue;}
   if(t.label===undefined||t.label===null||t.label==='')delete t.label;else t.label=String(t.label);
   if(typeof t.steps==='string')t.steps=t.steps.split(';').map(x=>x.trim()).filter(Boolean);
   if(t.steps!==undefined&&!(Array.isArray(t.steps)&&t.steps.length))delete t.steps;
   if(!(Array.isArray(t.at)&&t.at.length===2&&t.at.every(Number.isFinite)))delete t.at;else t.at=[+t.at[0],+t.at[1]];
   if(!(Array.isArray(t.rng)&&t.rng.length===2&&t.rng.every(Number.isFinite)&&t.rng[1]>t.rng[0]))delete t.rng;
   if(!(+t.span>0))delete t.span;if(t.al!=='r')delete t.al;
   if(!t.id||ids.has(String(t.id))){do{n++;}while(ids.has('w'+n));t.id='w'+n;}t.id=String(t.id);ids.add(t.id);tiles.push(t);}
  const pn=src.panel||{},panel={view:pn.view==='table'?'table':'tiles'};if(pn.min)panel.min=true;if(Number.isFinite(pn.x))panel.x=pn.x;if(Number.isFinite(pn.y))panel.y=pn.y;
  return {show:src.show!==undefined?!!src.show:tiles.length>0,panel,tiles};}
 // a step button: '+10 %' / '−10 %' (relative), '×1.5' or '*1.5' (a factor), '+5' / '−5' (absolute), '=0' (a value)
 function parseStep(s){const t=String(s??'').replace(/\s+/g,'').replace(/[−–]/g,'-').replace(/,/g,'.'),N=x=>P.parseEng(x);let m;
  if((m=/^([+-])(\d*\.?\d+(?:e[+-]?\d+)?)%$/i.exec(t)))return {op:'mul',a:1+(m[1]==='-'?-1:1)*(+m[2])/100,text:(m[1]==='-'?'−':'+')+m[2].replace('.',',')+' %'};
  if((m=/^[×xX*](.+)$/.exec(t))&&Number.isFinite(N(m[1])))return {op:'mul',a:N(m[1]),text:'×'+m[1].replace('.',',')};
  if((m=/^=(.+)$/.exec(t))&&Number.isFinite(N(m[1])))return {op:'set',a:N(m[1]),text:'= '+m[1].replace('.',',')};
  if((m=/^([+-])(.+)$/.exec(t))&&Number.isFinite(N(m[2])))return {op:'add',a:(m[1]==='-'?-1:1)*N(m[2]),text:(m[1]==='-'?'−':'+')+m[2].replace('.',',')};
  return null;}
 const applyStep=(st,v)=>st.op==='mul'?v*st.a:st.op==='add'?v+st.a:st.a;
 // the limit a block output sits on: 'hi', 'lo' or '' (a margin of 10⁻⁶ of the span). The pairs of limits of the blocks.
 const LIM=[['lo','hi'],['ymin','ymax'],['umin','umax'],['min','max']];
 function satOf(prm,v,defs){if(!Number.isFinite(v))return '';prm=prm||{};defs=defs||{};
  for(const [a,b] of LIM){if(!(a in prm||b in prm||a in defs||b in defs))continue;let lo=num(prm[a]??defs[a]),hi=num(prm[b]??defs[b]);
   // an empty limit is no limit on that side
   if(!Number.isFinite(lo))lo=-Infinity;if(!Number.isFinite(hi))hi=Infinity;if(!(hi>lo)||(lo===-Infinity&&hi===Infinity))continue;
   const e=1e-6*(Number.isFinite(hi-lo)?hi-lo:Math.max(1,Math.abs(Number.isFinite(hi)?hi:lo)));if(v>=hi-e)return 'hi';if(v<=lo+e)return 'lo';}
  return '';}
 // the curve of a tile: n columns of [first, min, max, last] over [t0, t1], like the scope, from an iterator of samples
 function envelope(each,t0,t1,n){const c=new Array(n).fill(null);let lo=Infinity,hi=-Infinity;const k=n/Math.max(t1-t0,1e-300);
  each((t,v)=>{if(t<t0||t>t1||!Number.isFinite(v))return;let i=Math.floor((t-t0)*k);if(i>=n)i=n-1;else if(i<0)i=0;const q=c[i];
   if(!q)c[i]=[v,v,v,v];else{if(v<q[1])q[1]=v;if(v>q[2])q[2]=v;q[3]=v;}if(v<lo)lo=v;if(v>hi)hi=v;});
  return {c,lo,hi};}
 // the points of a polyline in a box w × h (the range padded by 8 %, a flat curve in the middle)
 function points(env,w,h){const {c,lo,hi}=env;if(!(hi>=lo))return '';const span=hi-lo,pad=span>0?span*.08:Math.max(Math.abs(hi)*.05,1e-12),a=lo-pad,b=hi+pad,n=c.length,out=[];
  const Y=v=>(h-(v-a)/(b-a)*h).toFixed(1);
  for(let i=0;i<n;i++){const q=c[i];if(!q)continue;const x=((i+.5)*w/n).toFixed(1);out.push(x+','+Y(q[0]));if(q[1]<q[0])out.push(x+','+Y(q[1]));if(q[2]>q[1]||q[2]>q[0])out.push(x+','+Y(q[2]));if(q[3]!==q[2])out.push(x+','+Y(q[3]));}
  return out.join(' ');}
 // a slider over a value: logarithmic a decade each way around a positive base, else linear around it (like 📌), or a
 // given range; 1000 positions
 const SL=1000;
 function sliderMap(base,rng){if(rng)return {log:false,lo:rng[0],hi:rng[1]};const b=Number.isFinite(base)?base:0;
  return b>0?{log:true,lo:b/10,hi:b*10}:{log:false,lo:b-Math.max(1,Math.abs(b)),hi:b+Math.max(1,Math.abs(b))};}
 const toX=(m,v)=>Math.round(Math.min(SL,Math.max(0,m.log?SL*Math.log(Math.max(v,m.lo*1e-6)/m.lo)/Math.log(m.hi/m.lo):SL*(v-m.lo)/(m.hi-m.lo))));
 const fromX=(m,x)=>m.log?m.lo*Math.pow(m.hi/m.lo,x/SL):m.lo+(m.hi-m.lo)*x/SL;
 Object.assign(W,{norm,parseStep,applyStep,satOf,envelope,points,sliderMap,toX,fromX});
 if(typeof module!=='undefined'&&module.exports){module.exports=W;return;}

 // ------------------------------------------------------------ in the app
 const C=()=>W.ctx;
 // the layout of the circuit (the top level, also while a subcircuit is open), normalized in place; null if none
 const NORM=new WeakSet();
 function layout(create){const d=C().topDoc();if(!d)return null;if(!d.watch&&!create)return null;if(!d.watch||!NORM.has(d.watch)){d.watch=norm(d.watch||{tiles:[],show:true});NORM.add(d.watch);}return d.watch;}
 // a new tile with an id of its own
 function newTile(w,t){let n=w.tiles.length;const ids=new Set(w.tiles.map(o=>o.id));do{n++;}while(ids.has('w'+n));t.id='w'+n;w.tiles.push(t);return t;}
 // what a tile is: a signal, or a control of a parameter of a part of the circuit
 function info(t){const x=C(),c0=t.ctl?x.editor.comp(t.ctl.c):null;
  if(t.ctl){const c=c0,d=c&&x.partDef(c)?.params.find(q=>q.k===t.ctl.k);if(!c||!d)return {kind:'gone',name:t.label||t.ctl.k,src:t.ctl.c};
   const src=c.label||c.id,sched=(c.type==='CONST'&&d.k==='v')||(c.type==='PWM'&&d.k==='ref'),raw=c.params[d.k]??d.def;
   if(d.type==='bool')return {kind:'bool',c,d,name:t.label||d.label,src,v:!!raw};
   if(d.type==='select')return {kind:'sel',c,d,name:t.label||d.label,src,v:String(raw)};
   if(d.type==='num'||sched){const v=sched?P.parseEng(String(raw)):x.numOf(raw),pts=sched&&!Number.isFinite(v)?P.parseSched(String(raw)):null;
    const base=Number.isFinite(v)?v:pts&&pts.length?Math.max(...pts.map(q=>Math.abs(+q[1]||0))):0;
    return {kind:'num',c,d,name:t.label||d.label,src,unit:d.unit||(sched&&c.type==='CONST'?x.unit('Y:'+c.id):''),v,base,raw:String(raw),sched,
     out:c.type==='CONST'?'Y:'+c.id:c.type==='PWM'&&d.k==='D'?'D:'+c.id:null};}
   return {kind:'gone',name:t.label||d.label,src};}
  const id=t.key.split(':')[1]||'',c=x.compAt(id);return {kind:'sig',c,name:t.label||x.chanLabel(t.key),src:c?.label||id,unit:x.unit(t.key)};}
 // the sample time of a signal: the clock of a sampled block, the carrier of a PWM, else continuous
 function sampleText(t){const x=C();if(t.ctl)return 'παράμετρος';const [pre,id]=t.key.split(':'),c=x.compAt(id);if(!c)return '';
  if(c.type==='PWM'&&['D','G','CAR','REF','MEAS'].includes(pre))return 'T_s = '+x.eng(1/(num(c.params.fs)||P.defaults('PWM').fs),'s',3);
  if(pre==='H')return 'δείγματα S&H';
  const clk=c.params?.clock,k=clk&&x.compAt(clk);if(k&&k.type==='CLK')return 'T_s = '+x.eng(1/(num(k.params.f)||P.defaults('CLK').f),'s',3);
  return 'συνεχές';}
 // the default place of a tile on the drawing: right of its part, below the tiles already there
 function placeOf(t,w){const x=C(),ed=x.editor,id=t.ctl?t.ctl.c:String(t.key.split(':')[1]||'').split('/')[0].replace(/\[\d+\]$/,''),c=ed.comp(id);
  if(!c)return [Math.round(ed.view.cx/10)*10,Math.round(ed.view.cy/10)*10];const b=P.bbox(c),x0=Math.round((b[2]+24)/10)*10;
  let y=Math.round((b[1]-8)/10)*10;for(const o of w.tiles)if(o!==t&&o.at&&Math.abs(o.at[0]-x0)<80&&o.at[1]>=y-60&&o.at[1]<y+400)y=Math.max(y,o.at[1]+(o.ctl?96:70));
  return [x0,y];}

 // ------------------------------------------------------------ drawing the tiles
 const sparkSVG='<svg class="wt-sp" viewBox="0 0 140 28" preserveAspectRatio="none" aria-hidden="true"><polyline points=""/></svg>';
 function tileHTML(t,pinned,bare){const x=C(),q=info(t);
  const head=`<div class="wt-h" title="${pinned?'Σύρε για μετακίνηση':''}"><b class="wt-n">${esc(q.name)}</b><small class="wt-s">${esc(bare?'':q.src)}</small>${bare?'':`<button class="wt-b" data-wact="dock" title="${pinned?'Στο πάνελ σημάτων':'Στο σχέδιο, δίπλα στο στοιχείο του'}">${pinned?'⇲':'⇱'}</button><button class="wt-b" data-wact="rm" title="Αφαίρεση">✕</button>`}</div>`;
  const style=pinned?` style="left:${t.at[0]-(t.al==='r'?150:0)}px;top:${t.at[1]}px"`:'';let body='';
  if(q.kind==='sig')body=`<div class="wt-v"><span class="wt-x">—</span><em>${esc(q.unit)}</em><i class="wt-f"></i></div>${sparkSVG}`;
  else if(q.kind==='num'){const steps=(t.steps||['-10%','+10%']).map(parseStep).filter(Boolean),m=sliderMap(t.base??q.base,t.rng||(q.c.type==='PWM'&&q.d.k==='D'?[0,1]:null));
   body=`<div class="wt-v"><input class="wt-in" value="${esc(q.sched&&!Number.isFinite(+q.raw)&&q.raw.includes(':')?q.raw:P.eng(q.v,'',6).replace(/\s/g,''))}" inputmode="decimal" aria-label="${esc(q.name)}"><em>${esc(q.unit)}</em><i class="wt-f"></i></div>
    <input type="range" class="wt-r" min="0" max="${SL}" step="1" value="${Number.isFinite(q.v)?toX(m,q.v):SL/2}" aria-label="${esc(q.name)}">${steps.length?`<div class="wt-st">${steps.map((s,i)=>`<button data-wstep="${i}">${esc(s.text)}</button>`).join('')}</div>`:''}${q.out?sparkSVG:''}`;}
  else if(q.kind==='bool')body=`<label class="wt-sw"><input type="checkbox" ${q.v?'checked':''} aria-label="${esc(q.name)}"><span>${q.v?'ναι':'όχι'}</span></label>`;
  else if(q.kind==='sel')body=`<select class="wt-choice" aria-label="${esc(q.name)}">${(q.d.options||[]).map(([k,n])=>`<option value="${esc(k)}" ${String(k)===q.v?'selected':''}>${esc(n)}</option>`).join('')}</select>`;
  else body='<div class="wt-v"><span class="wt-x muted">δεν υπάρχει</span></div>';
  return `<div class="wt wt-${q.kind}${pinned?' wt-pin'+(t.al==='r'?' al-r':''):''}" data-wt="${esc(t.id)}"${style}>${head}${body}</div>`;}
 function bindRefs(box,w,into){for(const el of box.querySelectorAll('[data-wt]')){const t=w.tiles.find(o=>o.id===el.dataset.wt);if(!t)continue;const q=info(t);
  const r={t,el,q,key:t.key||q.out||null,x:el.querySelector('.wt-x'),f:el.querySelector('.wt-f'),pl:el.querySelector('.wt-sp polyline'),inp:el.querySelector('.wt-in'),rng:el.querySelector('.wt-r'),
   cb:el.querySelector('.wt-sw input'),sel:el.querySelector('.wt-choice'),last:{},lastT:NaN};
  if(q.kind==='num')r.map=sliderMap(t.base??q.base,t.rng||(q.c.type==='PWM'&&q.d.k==='D'?[0,1]:null));(into||W.refs).set(t.id,r);}}
 function tableHTML(w){return `<table class="wtab"><thead><tr><th>Σήμα</th><th>Τιμή</th><th>Μονάδα</th><th>Δείγμα</th><th>Πηγή</th><th>Κατάσταση</th></tr></thead><tbody>${w.tiles.map(t=>{const q=info(t);
   return `<tr data-wr="${esc(t.id)}"><td>${esc(q.name)}</td><td class="num" data-wv>—</td><td>${esc(q.unit||'')}</td><td>${esc(sampleText(t))}</td><td>${esc(q.src)}${q.c?` · ${esc(P.PARTS[q.c.type]?.name||q.c.type)}`:''}</td><td data-wf></td></tr>`;}).join('')}</tbody></table>`;}

 // ------------------------------------------------------------ the panel
 function panelEl(){if(W.panel)return W.panel;const host=C().editor.holder,p=document.createElement('div');p.className='wpanel';p.id='watch-panel';p.hidden=true;
  p.innerHTML=`<div class="wp-head"><b title="Σήματα ελέγχου: σύρε για μετακίνηση">⠿ Σήματα</b><span class="wp-tabs" role="tablist"><button data-wview="tiles" role="tab" title="Τα πλακίδια που δεν είναι πάνω στο σχέδιο">Πλακίδια</button><button data-wview="table" role="tab" title="Όλα ως πίνακας παρακολούθησης: τιμή, μονάδα, δείγμα, πηγή, NaN και κορεσμός">Πίνακας</button></span><button class="x" data-wmin title="Σύμπτυξη / ανάπτυξη του πάνελ">▾</button><button class="x" data-wclose title="Κρύψε τα σήματα (S)">✕</button></div>
   <div class="wp-add"><input type="search" class="wp-q" placeholder="+ Σήμα ή χειρισμός (π.χ. «ω», «Kp», «μαθαίνει»)" autocomplete="off" aria-label="Αναζήτηση σήματος ή παραμέτρου"><div class="wp-sug own-scroll" hidden></div></div>
   <div class="wp-body own-scroll"></div><div class="wp-foot"><small class="wp-chg"></small><button data-wsched hidden title="Οι αλλαγές γίνονται πρόγραμμα t:τιμή: με ⟲ ξαναπαίζεται η ίδια προσομοίωση">→ πρόγραμμα t:τιμή</button></div>`;
  host.appendChild(p);W.panel=p;
  const head=p.querySelector('.wp-head');head.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;e.preventDefault();head.setPointerCapture(e.pointerId);
   const box=host.getBoundingClientRect(),r=p.getBoundingClientRect(),dx=e.clientX-r.left,dy=e.clientY-r.top;
   const mv=ev=>{p.style.left=Math.min(Math.max(0,ev.clientX-box.left-dx),Math.max(0,box.width-r.width))+'px';p.style.top=Math.min(Math.max(0,ev.clientY-box.top-dy),Math.max(0,box.height-40))+'px';};
   const up=()=>{head.removeEventListener('pointermove',mv);head.removeEventListener('pointerup',up);const w=layout(false);if(w){w.panel.x=parseFloat(p.style.left);w.panel.y=parseFloat(p.style.top);C().saveSoon();}};
   head.addEventListener('pointermove',mv);head.addEventListener('pointerup',up);});
  p.querySelector('[data-wclose]').onclick=()=>W.show(false);
  p.querySelector('[data-wmin]').onclick=()=>{const w=layout(true);w.panel.min=!w.panel.min;C().saveSoon();W.render(true);};
  for(const b of p.querySelectorAll('[data-wview]'))b.onclick=()=>{const w=layout(true);w.panel.view=b.dataset.wview;C().saveSoon();W.render(true);};
  const q=p.querySelector('.wp-q');q.oninput=()=>suggest();q.onfocus=()=>suggest();
  q.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();if(W.sugs.length)addSug(0);}else if(e.key==='Escape'){q.value='';W.addFor=null;suggest(true);}};
  p.querySelector('[data-wsched]').onclick=()=>{C().toSchedule();};
  bindEvents(p);return p;}
 // suggestions: the signals of the circuit (the list of the scope) and the parameters that can change while it runs
 function controls(){const x=C(),out=[];if(!x.atTop())return out;
  for(const c of x.editor.doc.components){const def=x.partDef(c);if(!def||['JUNC','GND','TAGO','TAGI','PORT','SIN','SOUT','SUB'].includes(c.type))continue;const p={...P.defaults(c.type),...c.params};
   for(const d of def.params||[]){if(d.show&&!d.show(p))continue;const sched=(c.type==='CONST'&&d.k==='v')||(c.type==='PWM'&&d.k==='ref');
    if(!(sched||((d.type==='num'||d.type==='bool'||d.type==='select')&&!P.structural(c.type,d.k))))continue;
    out.push({ctl:{c:c.id,k:d.k},text:`${d.label} · ${c.label||c.id}`,group:'Χειρισμοί'});}}
  return out;}
 function suggest(force){const p=W.panel;if(!p)return;const box=p.querySelector('.wp-sug'),q=p.querySelector('.wp-q');const raw=q.value.trim(),fold=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[_·*′']/g,'').toLowerCase();
  const words=fold(raw).split(/\s+/).filter(Boolean),x=C(),w=layout(false),have=new Set((w?.tiles||[]).map(t=>t.key||t.ctl.c+'.'+t.ctl.k));
  if(!words.length&&!W.addFor){box.hidden=true;W.sugs=[];if(force)box.innerHTML='';return;}
  const forId=W.addFor,mine=s=>!forId||s.id===forId||String(s.id).startsWith(forId+'/');const all=[];
  for(const g of x.signals())for(const it of g.items){const id=it.value.split(':')[1]||'';if(mine({id}))all.push({key:it.value,text:it.text,group:g.label});}
  for(const k of controls())if(mine({id:k.ctl.c}))all.push(k);
  W.sugs=all.filter(s=>words.every(wd=>fold(s.text+' '+s.group).includes(wd))).slice(0,40);
  box.innerHTML=(forId?`<div class="wp-for"><span>Για το <b>${esc(x.editor.comp(forId)?.label||forId)}</b>: κλικ = πλακίδιο δίπλα του</span><button data-wfor-x title="Όλο το κύκλωμα">✕</button></div>`:'')+
   (W.sugs.map((s,i)=>{const k=s.key||s.ctl.c+'.'+s.ctl.k;return `<button data-sug="${i}" ${have.has(k)?'class="on"':''}><span>${s.ctl?'🎚 ':'⌁ '}${esc(s.text)}</span><small>${esc(s.group)}</small></button>`;}).join('')||'<small class="muted">Τίποτα δεν ταιριάζει.</small>');
  box.hidden=false;box.querySelectorAll('[data-sug]').forEach(b=>b.onclick=()=>addSug(+b.dataset.sug));box.querySelector('[data-wfor-x]')?.addEventListener('click',()=>{W.addFor=null;suggest(true);});}
 function addSug(i){const s=W.sugs[i];if(!s)return;const x=C(),w0=layout(false);const have=w0?.tiles.find(t=>s.key?t.key===s.key:t.ctl&&t.ctl.c===s.ctl.c&&t.ctl.k===s.ctl.k);
  if(have){x.editor.remember();w0.tiles=w0.tiles.filter(t=>t!==have);}
  else{x.editor.remember();const w=layout(true),t=newTile(w,s.key?{key:s.key}:{ctl:{...s.ctl}});if(W.addFor)t.at=placeOf(t,w);w.show=true;}
  x.save();W.render(true);const q=W.panel.querySelector('.wp-q');if(!W.addFor){q.value='';suggest(true);}else suggest();q.focus({preventScroll:true});}

 // ------------------------------------------------------------ events (delegated: one listener per box)
 function tileOf(el){const d=el.closest?.('[data-wt]');return d&&(W.refs.get(d.dataset.wt)||F.refs.get(d.dataset.wt));}
 function bindEvents(box){
  box.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const r=tileOf(b);if(!r)return;
   if(b.dataset.wact==='rm'){C().editor.remember();const w=layout(false);w.tiles=w.tiles.filter(t=>t.id!==r.t.id);C().save();W.render(true);return;}
   if(b.dataset.wact==='dock'){C().editor.remember();const w=layout(false),t=w.tiles.find(o=>o.id===r.t.id);if(!t)return;if(t.at)delete t.at;else t.at=placeOf(t,w);C().save();W.render(true);return;}
   if(b.dataset.wstep!==undefined&&r.q.kind==='num'){const st=parseStep((r.t.steps||['-10%','+10%'])[+b.dataset.wstep]);const v=cur(r);if(st&&Number.isFinite(v))setNum(r,applyStep(st,v),true);}});
  box.addEventListener('input',e=>{const r=tileOf(e.target);if(!r)return;if(e.target===r.rng){const v=fromX(r.map,+r.rng.value);setNum(r,+v.toPrecision(6),false,true);}});
  box.addEventListener('change',e=>{const r=tileOf(e.target);if(!r)return;const x=C();
   if(e.target===r.rng){setNum(r,+fromX(r.map,+r.rng.value).toPrecision(6),true,true);return;}
   if(e.target===r.inp){const raw=r.inp.value.trim();if(r.q.sched&&raw.includes(':')){if(!P.parseSched(raw)){r.inp.classList.add('bad');return;}r.inp.classList.remove('bad');x.setParam(r.q.c.id,r.q.d.k,raw,true);W.sync();return;}
    const v=P.parseEng(raw);if(!Number.isFinite(v)){r.inp.classList.add('bad');return;}r.inp.classList.remove('bad');setNum(r,v,true);return;}
   if(e.target===r.cb){x.setParam(r.q.c.id,r.q.d.k,r.cb.checked,true);W.sync();return;}
   if(e.target===r.sel){x.setParam(r.q.c.id,r.q.d.k,r.sel.value,true);W.sync();}});
  box.addEventListener('keydown',e=>{const r=tileOf(e.target);if(r&&e.target===r.inp&&e.key==='Enter'){e.preventDefault();r.inp.dispatchEvent(new Event('change',{bubbles:true}));}});
  box.addEventListener('pointerdown',e=>{const h=e.target.closest?.('.wt-h');if(!h||e.target.closest('button'))return;const r=tileOf(h);if(!r||!r.t.at)return;dragTile(e,r);});}
 // the current numeric value of a control tile
 function cur(r){const c=C().editor.comp(r.q.c.id);if(!c)return NaN;const raw=c.params[r.q.d.k]??r.q.d.def;const v=r.q.sched?P.parseEng(String(raw)):C().numOf(raw);
  // a program (t:value): the step starts from the value it gives now
  if(!Number.isFinite(v)&&r.q.out){const s=C().S.sim;if(s)return valueOf(s,r.q.out);}return v;}
 // a new value from a tile: while a slider moves, one change per frame (as 📌); the end of a gesture commits
 function setNum(r,v,commit,fromSlider){if(!Number.isFinite(v))return;if(r.q.c.type==='PWM'&&r.q.d.k==='D')v=Math.min(1,Math.max(0,v));
  const go=(rr,vv,cm)=>{C().setParam(rr.q.c.id,rr.q.d.k,rr.q.sched?String(+vv.toPrecision(8)):vv,cm);showNum(rr,vv,fromSlider);};
  if(commit){cancelAnimationFrame(W.raf);W.raf=0;W.pend=null;go(r,v,true);W.sync(r);return;}
  W.pend=[r,v];if(!W.raf)W.raf=requestAnimationFrame(()=>{W.raf=0;const q=W.pend;W.pend=null;if(q)go(q[0],q[1],false);});}
 function showNum(r,v,fromSlider){if(r.inp&&document.activeElement!==r.inp){const s=P.eng(v,'',6).replace(/\s/g,'');if(r.inp.value!==s)r.inp.value=s;}if(r.rng&&!fromSlider)r.rng.value=toX(r.map,v);}
 // the other tiles of the same parameter (and this one after a commit) follow the value in the circuit
 W.sync=skip=>{for(const r of [...W.refs.values(),...F.refs.values()]){if(r===skip||!r.t.ctl)continue;const c=C().editor.comp(r.t.ctl.c);if(!c)continue;const raw=c.params[r.t.ctl.k]??r.q.d?.def;
  if(r.q.kind==='num'){if(r.q.sched&&String(raw).includes(':')){if(document.activeElement!==r.inp)r.inp.value=String(raw);}else showNum(r,r.q.sched?P.parseEng(String(raw)):C().numOf(raw));}
  else if(r.q.kind==='bool'){r.cb.checked=!!raw;const s=r.cb.nextElementSibling;if(s)s.textContent=raw?'ναι':'όχι';}
  else if(r.q.kind==='sel'&&r.sel.value!==String(raw))r.sel.value=String(raw);}};
 // a tile on the drawing moves by its title, in the units of the drawing; one step of undo
 function dragTile(e,r){e.preventDefault();const el=r.el,h=e.target.closest('.wt-h');h.setPointerCapture(e.pointerId);const k=C().editor.view.k,x0=e.clientX,y0=e.clientY,a0=[...r.t.at];let moved=false,pos=a0;
  el.classList.add('drag');
  const mv=ev=>{const dx=(ev.clientX-x0)/k,dy=(ev.clientY-y0)/k;if(!moved&&Math.hypot(dx*k,dy*k)<3)return;moved=true;pos=[Math.round((a0[0]+dx)/10)*10,Math.round((a0[1]+dy)/10)*10];el.style.left=(pos[0]-(r.t.al==='r'?150:0))+'px';el.style.top=pos[1]+'px';};
  const up=()=>{h.removeEventListener('pointermove',mv);h.removeEventListener('pointerup',up);h.removeEventListener('pointercancel',up);el.classList.remove('drag');
   if(moved&&(pos[0]!==a0[0]||pos[1]!==a0[1])){C().editor.remember();const w=layout(false),t=w&&w.tiles.find(o=>o.id===r.t.id);if(t){t.at=pos;r.t=t;}C().saveSoon();}};
  h.addEventListener('pointermove',mv);h.addEventListener('pointerup',up);h.addEventListener('pointercancel',up);}

 // ------------------------------------------------------------ render and update
 // the tiles again (after a load, a change of the circuit, undo, entering or leaving a subcircuit); while a field of a
 // tile has the focus only the values follow, so typing is not interrupted
 W.render=force=>{const x=C(),ed=x?.editor;if(!ed?.L?.sig)return;const layer=ed.L.sig,p=panelEl(),w=layout(false);
  const top=x.atTop()&&x.S.pfx!==null,vis=!!(top&&w&&w.show);W.vis=vis;
  // the façade of an AI controller follows the circuit (not while one of its fields is being typed in)
  if(F.id){if(!top)W.facade(null);else if(!(F.el&&F.el.contains(document.activeElement)))renderFacade();}
  const btn=document.getElementById('watch-btn');if(btn){btn.classList.toggle('on',vis);btn.setAttribute('aria-pressed',String(vis));}
  const focus=document.activeElement&&(layer.contains(document.activeElement)||p.contains(document.activeElement))&&!document.activeElement.classList.contains('wp-q');
  if(focus&&!force){W.sync();return;}
  if(!layer._wb){layer._wb=true;bindEvents(layer);}
  layer.hidden=!vis;p.hidden=!vis;W.refs.clear();if(!vis){layer.innerHTML='';return;}
  const pinned=w.tiles.filter(t=>t.at),free=w.tiles.filter(t=>!t.at),view=w.panel.view;
  layer.innerHTML=pinned.map(t=>tileHTML(t,true)).join('');
  const body=p.querySelector('.wp-body');
  body.innerHTML=view==='table'?(w.tiles.length?tableHTML(w):''):free.map(t=>tileHTML(t,false)).join('');
  if(view==='tiles'&&!free.length)body.innerHTML=`<small class="muted wp-empty">${w.tiles.length?'Όλα τα πλακίδια είναι πάνω στο σχέδιο (⇲ τα φέρνει εδώ).':'Πρόσθεσε σήματα και χειρισμούς από την αναζήτηση, από το δεξί κλικ σε στοιχείο («▣ Πλακίδια…») ή με ▣ δίπλα σε μια παράμετρο.'}</small>`;
  for(const b of p.querySelectorAll('[data-wview]')){const on=b.dataset.wview===view;b.classList.toggle('on',on);b.setAttribute('aria-selected',String(on));}
  p.classList.toggle('min',!!w.panel.min);p.querySelector('[data-wmin]').textContent=w.panel.min?'▸':'▾';
  bindRefs(layer,w);if(view==='tiles')bindRefs(body,w);
  W.rows=view==='table'?[...body.querySelectorAll('[data-wr]')].map(tr=>({tr,t:w.tiles.find(o=>o.id===tr.dataset.wr),v:tr.querySelector('[data-wv]'),f:tr.querySelector('[data-wf]'),last:{}})):[];
  // the place of the panel: where it was left, inside the work area
  const host=ed.holder.getBoundingClientRect();if(Number.isFinite(w.panel.x)){p.style.left=Math.min(Math.max(0,w.panel.x),Math.max(0,host.width-120))+'px';p.style.right='auto';}else{p.style.left='';p.style.right='12px';}
  if(Number.isFinite(w.panel.y))p.style.top=Math.min(Math.max(0,w.panel.y),Math.max(0,host.height-60))+'px';else p.style.top='12px';
  W.update(true);};
 const setT=(el,s)=>{if(el&&el.textContent!==s)el.textContent=s;};
 function flag(r,v){const q=r.q,c=q.c;if(!r.key)return '';if(!Number.isFinite(v))return 'nan';const [pre]=r.key.split(':');
  if(c&&(pre==='Y'||pre==='D')){if(pre==='D')return v>=1-1e-9?'hi':v<=1e-9?'lo':'';const pin=r.key.split(':')[2];if(!pin||pin==='y')return satOf(c.params,v,P.defaults(c.type));}return '';}
 const FLAG={nan:['⚠ NaN','bad'],hi:['⤒ στο άνω όριο','sat'],lo:['⤓ στο κάτω όριο','sat']};
 function valueOf(s,key){const ci=C().scope.resolve(key);return ci===-2?0:ci>=0?s.vals[ci]:NaN;}
 // values and curves; all = also the curves of a sim that did not move (after a load or a step)
 W.update=all=>{const x=C(),s=x?.S.sim;if(F.id&&s&&!x.S.error)facadeUpdate(s,all);if(!W.vis)return;if(!s||x.S.error)return;const sc=x.scope;
  for(const r of W.refs.values()){if(!r.key)continue;const v=valueOf(s,r.key);
   if(r.q.kind==='sig'){const tx=x.eng(v,'',5);if(r.last.v!==tx){r.last.v=tx;setT(r.x,tx);}}
   const f=flag(r,v);if(r.last.f!==f){r.last.f=f;setT(r.f,f?FLAG[f][0]:'');r.el.classList.toggle('bad',f==='nan');r.el.classList.toggle('sat',f==='hi'||f==='lo');}
   if(r.pl&&(all||s.t!==r.lastT)){r.lastT=s.t;spark(r,s,sc);}}
  for(const row of W.rows||[]){const t=row.t;if(!t)continue;let tx,f='';
   if(t.ctl){const c=x.editor.comp(t.ctl.c),d=c&&x.partDef(c)?.params.find(q=>q.k===t.ctl.k);const raw=c?(c.params[t.ctl.k]??d?.def):undefined;
    tx=d?.type==='bool'?(raw?'ναι':'όχι'):d?.type==='select'?String((d.options||[]).find(o=>String(o[0])===String(raw))?.[1]??raw):String(raw).includes(':')?'πρόγραμμα':x.eng(P.parseEng(String(raw)),'',5);}
   else{const v=valueOf(s,t.key);tx=x.eng(v,'',5);f=flag({key:t.key,q:{c:x.compAt(t.key.split(':')[1]||'')}},v);}
   if(row.last.v!==tx){row.last.v=tx;setT(row.v,tx);}if(row.last.f!==f){row.last.f=f;setT(row.f,f?FLAG[f][0]:'—');row.tr.className=f?FLAG[f][1]:'';}}
  const chg=(s.changes||[]).filter(c=>!c.prog||c.live).length,p=W.panel;if(p){const b=p.querySelector('[data-wsched]');if(b.hidden!==!chg)b.hidden=!chg;setT(p.querySelector('.wp-chg'),chg?`${chg} ${chg===1?'αλλαγή':'αλλαγές'} σε αυτό το τρέξιμο`:'');}};
 // the curve of a tile over the window of the scope (or its own span): raw samples, or the statistics per period when
 // the window reaches before the raw buffer or holds too many samples
 function spark(r,s,sc){const ci=sc.resolve(r.key);if(ci===-1){r.pl.setAttribute('points','');return;}const t1=s.t,Wd=r.t.span||sc.windowSec(),t0=Math.max(0,t1-Wd);
  if(!(t1>t0)){r.pl.setAttribute('points','');return;}
  // at most about 1500 samples per curve (56 columns): the statistics per period when the window holds enough periods,
  // else every k-th sample
  const rg=s.ring,i0=rg.n?sc.ringIndex(t0):0,i1=rg.n?sc.ringIndex(t1):0,cnt=i1-i0;
  const per=s.per&&s.per.n>1&&((t0<sc.ringStart()-1e-12&&Wd>3*s.T)||(cnt>1500&&Wd>=40*s.T));
  const raw=f=>{const st=(rg.head-rg.n+rg.cap)%rg.cap,k=Math.max(1,Math.ceil(cnt/1500)),a=Math.max(0,i0-1),b=Math.min(rg.n-1,i1);
   for(let i=a;i<=b;i+=k){const j=(st+i)%rg.cap;f(rg.t[j],ci===-2?0:rg.d[j*rg.nch+ci]);}};
  // the periods in the window by a binary search, every k-th of them (each with its min and max)
  const perIt=f=>{const q=s.per,st=(q.head-q.n+q.cap)%q.cap,at=i=>q.t[(st+i)%q.cap];let lo=0,hi=q.n;while(lo<hi){const m=(lo+hi)>>1;if(at(m)<t0)lo=m+1;else hi=m;}
   let e=lo;{let a=lo,b2=q.n;while(a<b2){const m=(a+b2)>>1;if(at(m)<=t1)a=m+1;else b2=m;}e=a;}const k=Math.max(1,Math.ceil((e-lo)/1500));
   for(let i=lo;i<e;i+=k){const j=(st+i)%q.cap,o=j*q.nch+ci;f(q.t[j],ci===-2?0:q.min[o]);f(q.t[j],ci===-2?0:q.max[o]);}};
  const env=envelope(per?perIt:raw,t0,t1,56);
  const pts=points(env,140,28);if(r.last.p!==pts){r.last.p=pts;r.pl.setAttribute('points',pts);}}

 // ------------------------------------------------------------ 4.8: the façade of the block «Ελεγκτής AI» (ROADMAP §46)
 // A floating panel next to the block (one click on it): scheme, mode (offline training in the background, run with the
 // reference, live target with a slider), «Μαθαίνει», live values and two curves (error, learning), and buttons: reset
 // the weights, keep the learned ones, compare with the PI alone. Its controls are tiles (the same code as §47); the runs
 // in the background go to a pool of workers; every change of a parameter is the same as in the settings window.
 const F={id:null,el:null,refs:new Map(),busy:'',out:''};
 const FT=id=>({tiles:[{id:'f_t',ctl:{c:id,k:'target'},label:'Στόχος',rng:[0,2*(+(C().editor.comp(id)?.params.rs)||150)],steps:['-10%','+10%']},{id:'f_l',ctl:{c:id,k:'learn'},label:'Συνέχισε να μαθαίνεις'},
  {id:'f_e',key:'Y:'+id+'/E',label:'Σφάλμα e = r_f − y'},{id:'f_L',key:'Y:'+id+'/NN1:L',label:'Καμπύλη μάθησης L'}]});
 function facadeEl(){if(F.el)return F.el;const host=C().editor.holder,el=document.createElement('div');el.className='wpanel wfac';el.id='ai-facade';el.hidden=true;host.appendChild(el);F.el=el;bindEvents(el);
  el.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!F.id)return;const x=C(),id=F.id,c=x.editor.comp(id);if(!c)return;
   if(b.dataset.fclose!==undefined){W.facade(null);return;}
   if(b.dataset.fmode==='train'){trainOffline(id);return;}
   if(b.dataset.fmode){x.setParam(id,'mode',b.dataset.fmode,true);renderFacade();return;}
   if(b.dataset.freset!==undefined){x.setParams(id,{w:'',seed:(+c.params.seed||1)+1});F.out='Νέα βάρη από την αρχή (μηδενική έξοδος).';renderFacade();return;}
   if(b.dataset.fkeep!==undefined){const blk=x.simBlock(id+'/NN1');if(!blk||!root.NNet){F.out='Δεν υπάρχει δίκτυο που να έχει μάθει.';renderFacade();return;}x.setParams(id,{w:root.NNet.text(blk.st.net)});F.out='Τα βάρη που έμαθε γράφτηκαν στο μπλοκ: από εδώ ξεκινά την επόμενη φορά.';renderFacade();return;}
   if(b.dataset.fcmp!==undefined){compare(id);}});
  el.addEventListener('change',e=>{if(e.target.dataset.fscheme!==undefined&&F.id){C().setParams(F.id,{scheme:e.target.value});}});
  const head=()=>el.querySelector('.wp-head');el.addEventListener('pointerdown',e=>{const h=e.target.closest('.wp-head');if(!h||e.target.closest('button'))return;e.preventDefault();h.setPointerCapture(e.pointerId);
   const box=host.getBoundingClientRect(),r=el.getBoundingClientRect(),dx=e.clientX-r.left,dy=e.clientY-r.top;
   const mv=ev=>{el.style.left=Math.min(Math.max(0,ev.clientX-box.left-dx),Math.max(0,box.width-r.width))+'px';el.style.top=Math.min(Math.max(0,ev.clientY-box.top-dy),Math.max(0,box.height-40))+'px';};
   const up=()=>{h.removeEventListener('pointermove',mv);h.removeEventListener('pointerup',up);};h.addEventListener('pointermove',mv);h.addEventListener('pointerup',up);});void head;
  return el;}
 // open (id of an AIC part) or close (null); placed right of the block on the screen
 W.facade=id=>{const x=C(),el=facadeEl();if(!id||!x.editor.comp(id)||x.editor.comp(id).type!=='AIC'||!x.atTop()){F.id=null;el.hidden=true;F.refs.clear();return;}
  const again=F.id===id;F.id=id;if(!again){F.out='';const c=x.editor.comp(id),b=P.bbox(c),m=x.editor.svg.getScreenCTM(),pt=x.editor.svg.createSVGPoint(),hr=x.editor.holder.getBoundingClientRect();
   pt.x=b[2];pt.y=b[1];const q=m?pt.matrixTransform(m):{x:hr.left+20,y:hr.top+20};el.hidden=false;el.style.right='auto';
   el.style.left=Math.max(0,Math.min(q.x-hr.left+16,hr.width-250))+'px';el.style.top=Math.max(0,Math.min(q.y-hr.top,hr.height-120))+'px';}
  renderFacade();};
 W.facadeId=()=>F.id;
 function renderFacade(){const x=C(),el=F.el;if(!el||!F.id)return;const c=x.editor.comp(F.id);if(!c||c.type!=='AIC'){W.facade(null);return;}const p={...P.defaults('AIC'),...c.params},w=FT(F.id),live=p.mode==='live';
  const opts=P.PARTS.AIC.params.find(d=>d.k==='scheme').options;
  el.innerHTML=`<div class="wp-head"><b>⠿ Ελεγκτής AI</b><small class="wf-id">${esc(c.label||c.id)}</small><button class="x" data-fclose title="Κλείσιμο">✕</button></div>
   <div class="wf-body own-scroll"><label class="wf-row">Σχήμα <select data-fscheme aria-label="Σχήμα">${opts.map(([k,n])=>`<option value="${esc(k)}" ${k===p.scheme?'selected':''}>${esc(n)}</option>`).join('')}</select></label>
    <div class="wf-modes" role="group" aria-label="Τρόπος"><button data-fmode="train" ${F.busy?'disabled':''} title="Το ίδιο κύκλωμα τρέχει στο παρασκήνιο με μάθηση· τα βάρη που μαθαίνει γράφονται στο μπλοκ">${F.busy==='train'?'Εκπαιδεύεται…':'Εκπαίδευση εκτός οθόνης'}</button><button data-fmode="ref" class="${live?'':'on'}">Με αναφορά</button><button data-fmode="live" class="${live?'on':''}">Ζωντανός στόχος</button></div>
    ${live?tileHTML(w.tiles[0],false,true):''}${p.scheme==='pi'?'':tileHTML(w.tiles[1],false,true)}
    <div class="wf-vals"><span>r_f <b data-fv="LP">—</b></span><span>y <b data-fv="y">—</b></span><span>e <b data-fv="E">—</b></span><span>u <b data-fv="SAT">—</b></span><span>L <b data-fv="L">—</b></span><span>IAE <b data-fv="IAE">—</b></span><span class="wf-sat" data-fv="FLAG"></span></div>
    ${tileHTML(w.tiles[2],false,true)}${p.scheme==='pi'||p.scheme==='inv'?'':tileHTML(w.tiles[3],false,true)}
    <div class="wf-btns"><button data-freset title="Βάρη από την αρχή (το δίκτυο ξεκινά με έξοδο 0)">Επαναφορά βαρών</button><button data-fkeep title="Τα βάρη που έμαθε το δίκτυο ως τώρα γράφονται στο μπλοκ">Κράτα τα βάρη</button><button data-fcmp ${F.busy?'disabled':''}>${F.busy==='cmp'?'Τρέχει…':'Σύγκριση με PI'}</button></div>
    <div class="wf-out small">${F.out}</div></div>`;
  F.refs.clear();bindRefs(el,w,F.refs);facadeUpdate(x.S.sim,true);}
 function facadeUpdate(s,all){const x=C(),el=F.el;if(!el||el.hidden||!s)return;const id=F.id,v=k=>valueOf(s,'Y:'+id+'/'+k),f=(k,val,u)=>{const e=el.querySelector(`[data-fv="${k}"]`);if(e)setT(e,x.eng(val,u||'',4));};
  const rf=v('LP'),e=v('E');f('LP',rf);f('y',rf-e);f('E',e);f('SAT',v('SAT'));f('L',v('NN1:L'));f('IAE',v('IAE'));
  {const q=el.querySelector('[data-fv="FLAG"]');if(q)setT(q,v('FLAG')>=.5?'⤒⤓ η εντολή είναι στο όριο':'');}
  for(const r of F.refs.values()){if(!r.key)continue;const val=valueOf(s,r.key);if(r.q.kind==='sig'){const tx=x.eng(val,'',5);if(r.last.v!==tx){r.last.v=tx;setT(r.x,tx);}}if(r.pl&&(all||s.t!==r.lastT)){r.lastT=s.t;spark(r,s,x.scope);}}}
 // offline training: the same circuit in the background with learning (the scheme «online» if it was the PI alone or
 // fixed weights), for three times its duration; the weights it learned are written to the block
 async function trainOffline(id){const x=C();if(F.busy||!root.Pool)return;F.busy='train';F.out='Το κύκλωμα τρέχει στο παρασκήνιο με μάθηση…';renderFacade();
  try{const pr=JSON.parse(JSON.stringify(x.fullDoc())),c=pr.components.find(q=>q.id===id),sc=c.params.scheme==='pi'||c.params.scheme==='inv'||!c.params.scheme?'fel':c.params.scheme;
   c.params={...c.params,scheme:sc,learn:true,mode:'ref'};const tEnd=Math.max(3*(x.stopT()||0),3)||10;
   const pool=F.pool||(F.pool=new root.Pool.SimPool(2));const [out]=await pool.map([{action:'run',project:pr,t_end:tEnd,hdiv:x.hdiv(),channels:['Y:'+id+'/IAE'],measure:[{key:'Y:'+id+'/IAE',stat:'end'}],waveforms:false,check:false,nets:[id+'/NN1']}]);
   const wt=out.nets?.[id+'/NN1'];if(!wt)throw new Error('δεν βρέθηκαν βάρη');x.setParams(id,{w:wt,scheme:sc});
   F.out=`Εκπαιδεύτηκε σε ${x.eng(tEnd,'s',3)} προσομοίωσης (${sc==='emu'?'μέσω εξομοιωτή':'online'}). Τα βάρη γράφτηκαν στο μπλοκ· ▶ ξεκινά εκπαιδευμένο.`;}
  catch(err){F.out='Η εκπαίδευση απέτυχε: '+esc(err.message);}finally{F.busy='';renderFacade();}}
 // the same circuit with this scheme and with the PI alone, in the background: the IAE of each
 async function compare(id){const x=C();if(F.busy||!root.Pool)return;F.busy='cmp';renderFacade();
  try{const base=x.fullDoc(),tEnd=x.stopT()||6.4,mk=sc=>{const pr=JSON.parse(JSON.stringify(base)),c=pr.components.find(q=>q.id===id);c.params={...c.params,...(sc?{scheme:sc}:{})};return {action:'run',project:pr,t_end:tEnd,hdiv:x.hdiv(),channels:['Y:'+id+'/IAE'],measure:[{key:'Y:'+id+'/IAE',stat:'end'}],waveforms:false,check:false};};
   const pool=F.pool||(F.pool=new root.Pool.SimPool(2));const [a,b]=await pool.map([mk(null),mk('pi')]);const ia=a.measure['Y:'+id+'/IAE:end'],ib=b.measure['Y:'+id+'/IAE:end'];
   F.out=`<table class="cmp"><tr><th></th><th>IAE (ως ${x.eng(tEnd,'s',3)})</th></tr><tr><td>Αυτό το σχήμα</td><td>${x.fmt(ia,4)}</td></tr><tr><td>Μόνο PI</td><td>${x.fmt(ib,4)}</td></tr></table><small>${ib>0?`${x.fmt(100*(1-ia/ib),3)} % λιγότερο σφάλμα από τον PI.`:''}</small>`;}
  catch(err){F.out='Η σύγκριση απέτυχε: '+esc(err.message);}finally{F.busy='';renderFacade();}}

 // ------------------------------------------------------------ from the app
 W.init=ctx=>{W.ctx=ctx;};
 // the layer on or off (button ▣ Σήματα, key S); on with no tiles opens the panel with the search
 W.show=on=>{const x=C();if(on===undefined)on=!W.vis;const w=layout(on);if(!w)return;w.show=!!on;x.saveSoon();W.render(true);if(on&&!w.tiles.length)W.panel?.querySelector('.wp-q')?.focus({preventScroll:true});};
 // from the context menu of a part: the panel opens with the signals and controls of that part; a click pins a tile next to it
 W.openAdd=id=>{const w=layout(true);w.show=true;W.addFor=id;W.render(true);const q=W.panel.querySelector('.wp-q');q.value='';suggest();q.focus({preventScroll:true});};
 // ▣ next to a parameter in the parameters panel: a control tile next to the part, or off again
 W.has=(id,k)=>!!layout(false)?.tiles.some(t=>t.ctl&&t.ctl.c===id&&t.ctl.k===k);
 W.toggleCtl=(id,k)=>{const x=C();x.editor.remember();const w=layout(true),i=w.tiles.findIndex(t=>t.ctl&&t.ctl.c===id&&t.ctl.k===k);
  if(i>=0)w.tiles.splice(i,1);else{const t=newTile(w,{ctl:{c:id,k}});t.at=placeOf(t,w);w.show=true;}
  x.save();W.render(true);};
 root.Watch=W;
})(typeof window!=='undefined'?window:globalThis);
