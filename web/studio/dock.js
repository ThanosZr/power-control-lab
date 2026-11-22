'use strict';
// 5.0.5 (ROADMAP §94 step β, decision 357): the cards of the page leave their place and dock elsewhere. A card floats in
// a window of its own (moved by its grip, resized from every side with the frame of winframe.js), docks on the left, on
// the right or at the bottom of the screen, goes as a tab next to another card (in the page or in a region), fills the
// screen and back, and goes back to its place in the page. The layout is kept in localStorage (pcl-dock) and comes back
// after a reload; «Επαναφορά» of the menu «Παράθυρα» brings every card to its place.
// Two parts: the model (pure, no DOM: the groups of cards and where each group is; tests/js/dock_cases.js) and the page
// (the regions, the tab strips, the drag with its drop zones). A group is a set of tabs: one card or more, one of them
// shown. A card in the page keeps a comment where it was (its anchor), so that it goes back to the same place; a group of
// many cards in the page goes to the place of its first card. A floating card is a group of its own. The cards are moved,
// never copied: one copy of every card, and their listeners, canvases and observers stay with them.
// 5.0.6 (§94 step γ): the documents of the central area. The diagram of the network is a card too; the first time it opens
// it goes as a tab next to the circuit, in the place of the circuit (Dock.firstAs), and after that it stays where the user
// puts it. Two cards of a group go side by side (Dock.side): the shown one on the left, the other on the right, with an
// edge between them that is dragged (a line while it moves, the new widths at the release, as for the regions).
(function(root){
 const KEY='pcl-dock',AT=['main','left','right','bottom','float'],SIDE=['left','right','bottom'];
 const NAME={main:'στη σελίδα',left:'αριστερά',right:'δεξιά',bottom:'κάτω',float:'σε παράθυρο'};
 const SIZE0={left:420,right:460,bottom:320};
 // ------------------------------------------------------------------ the model
 // L = {v:1, groups:[{id, at, cards:[ids], active, side?, r?}], size:{left, right, bottom}, float:{id: {x,y,w,h}}, max: id | null, n,
 //      docs:{id: 1}}: side = the card shown beside the active one (5.0.6), r = the share of the width of the active one,
 //      docs = the cards that have already been placed once as documents (Dock.firstAs)
 const M={},R0=0.5;
 M.fresh=ids=>({v:1,groups:ids.map((id,i)=>({id:'g'+i,at:'main',cards:[id],active:id})),size:{...SIZE0},float:{},max:null,n:ids.length,docs:{}});
 M.copy=L=>JSON.parse(JSON.stringify(L));
 M.groupOf=(L,id)=>L.groups.find(g=>g.cards.includes(id))||null;
 const gid=L=>{let n=L.n|0;const has=new Set(L.groups.map(g=>g.id));while(has.has('g'+n))n++;L.n=n+1;return 'g'+n;};
 // a layout that came from the storage or an older page: only known cards, each once, every known card somewhere
 M.normalize=(L,ids)=>{const known=new Set(ids),seen=new Set();
  if(!L||typeof L!=='object'||!Array.isArray(L.groups))return M.fresh(ids);
  const out={v:1,groups:[],size:{...SIZE0},float:{},max:null,n:Number.isFinite(L.n)?L.n|0:0,docs:{}};
  for(const k of SIDE)if(Number.isFinite(L.size?.[k]))out.size[k]=Math.max(160,Math.min(4000,L.size[k]));
  for(const g of L.groups){if(!g||!AT.includes(g.at)||!Array.isArray(g.cards))continue;
   const cards=[];for(const c of g.cards)if(known.has(c)&&!seen.has(c)){seen.add(c);cards.push(c);}if(!cards.length)continue;
   if(g.at==='float'&&cards.length>1){for(const c of cards)out.groups.push({id:'f'+c,at:'float',cards:[c],active:c});continue;}
   const q={id:typeof g.id==='string'&&g.id?g.id:'x'+out.groups.length,at:g.at,cards,active:cards.includes(g.active)?g.active:cards[0]};
   if(g.at!=='float'&&cards.includes(g.side)&&g.side!==q.active){q.side=g.side;q.r=Number.isFinite(g.r)?Math.max(0.2,Math.min(0.8,g.r)):R0;}
   out.groups.push(q);}
  const ids2=new Set();for(const g of out.groups){if(ids2.has(g.id))g.id='y'+ids2.size+'_'+g.id;ids2.add(g.id);}
  for(const c of ids)if(!seen.has(c))out.groups.push({id:gid(out),at:'main',cards:[c],active:c});
  for(const [c,r] of Object.entries(L.float||{}))if(known.has(c)&&r&&['x','y','w','h'].every(k=>Number.isFinite(r[k])))out.float[c]={x:r.x,y:r.y,w:r.w,h:r.h};
  out.max=known.has(L.max)?L.max:null;for(const c of Object.keys(L.docs||{}))if(known.has(c))out.docs[c]=1;return out;};
 // the card out of its group (an empty group goes)
 function take(L,id){const g=M.groupOf(L,id);if(!g)return;g.cards=g.cards.filter(c=>c!==id);if(!g.cards.length){L.groups=L.groups.filter(x=>x!==g);return;}
  if(g.side===id){delete g.side;delete g.r;}else if(g.active===id){if(g.side){g.active=g.side;delete g.side;delete g.r;}else g.active=g.cards[0];}}
 // the card alone in a new group at «at» (the page: its own place; a region: after the groups that are there)
 M.place=(L,id,at)=>{if(!AT.includes(at))throw new Error('Dock: no region '+at);const g=M.groupOf(L,id);
  if(g&&g.at===at&&g.cards.length===1&&at!=='float')return L;
  take(L,id);L.groups.push({id:at==='float'?'f'+id+'_'+gid(L):gid(L),at,cards:[id],active:id});if(L.max===id&&at==='float')L.max=null;return L;};
 // the card as a tab next to «target» (not into a floating window: that is one card)
 M.tab=(L,id,target)=>{if(id===target)return L;const t=M.groupOf(L,target);if(!t||t.at==='float')return L;
  if(t.cards.includes(id)){if(t.side!==id)t.active=id;return L;}take(L,id);const i=t.cards.indexOf(target);t.cards.splice(i+1,0,id);t.active=id;return L;};
 // the shown card of a group; the one beside it (side by side) is already shown and stays where it is
 M.activate=(L,id)=>{const g=M.groupOf(L,id);if(g&&g.side!==id)g.active=id;return L;};
 // 5.0.6: id on the left and other on the right, in one group (other comes as a tab next to id if it is elsewhere); other
 // null or id: one card at a time again. Not in a floating window, which is one card.
 M.side=(L,id,other)=>{let g=M.groupOf(L,id);if(!g)return L;if(!other||other===id){delete g.side;delete g.r;return L;}if(g.at==='float'||!M.groupOf(L,other))return L;
  if(!g.cards.includes(other)){const r=g.r;M.tab(L,other,id);g=M.groupOf(L,id);if(r)g.r=r;}g.active=id;g.side=other;if(!Number.isFinite(g.r))g.r=R0;return L;};
 M.ratio=(L,id,r)=>{const g=M.groupOf(L,id);if(g&&g.side&&Number.isFinite(r))g.r=Math.max(0.2,Math.min(0.8,r));return L;};
 // 5.0.6: the first time a card is placed as a document it goes as a tab next to target; after that it stays where it is
 M.firstAs=(L,id,target)=>{if(!L.docs)L.docs={};if(L.docs[id])return L;L.docs[id]=1;const w=M.where(L,id);if(w&&w.at==='main'&&w.tabs===1&&M.groupOf(L,target))M.tab(L,id,target);return L;};
 M.where=(L,id)=>{const g=M.groupOf(L,id);return g?{at:g.at,group:g.id,tabs:g.cards.length,index:g.cards.indexOf(id),active:g.active===id,side:g.side===id,two:!!g.side}:null;};
 // the groups of a region in their order; the page: by the place of their first card in the page (ids: the order of the page)
 M.groups=(L,at,ids)=>{const q=L.groups.filter(g=>g.at===at);if(at!=='main'||!ids)return q;const ix=c=>{const i=ids.indexOf(c);return i<0?1e9:i;};
  const first=g=>Math.min(...g.cards.map(ix));return q.slice().sort((a,b)=>first(a)-first(b));};
 M.home=(L,ids)=>M.fresh(ids);
 // ------------------------------------------------------------------ the page
 const doc=()=>root.document;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const D={defs:[],by:new Map(),L:null,reg:{},wrap:new Map(),menu:null,drag:null,busy:false,on:false,changed:[]};
 const ids=()=>D.defs.map(d=>d.id);
 const open=id=>{const d=D.by.get(id);return !!d&&!!d.el&&!d.el.hidden;};
 function load(){try{return JSON.parse(localStorage.getItem(KEY)||'null');}catch(e){return null;}}
 function save(){try{localStorage.setItem(KEY,JSON.stringify(D.L));}catch(e){}}
 // the top of the regions: under the bar of the page
 function top(){const t=doc().querySelector('header.top');return t?Math.round(t.getBoundingClientRect().height):0;}
 function region(at){let r=D.reg[at];if(r)return r;r=doc().createElement('aside');r.id='dock-'+at;r.className='dk-region dk-'+at;r.dataset.dkRegion=at;r.hidden=true;
  r.setAttribute('aria-label','Περιοχή '+NAME[at]);const s=doc().createElement('div');s.className='dk-split';s.dataset.dkSplit=at;s.title='Σύρε για αλλαγή μεγέθους της περιοχής';r.appendChild(s);
  s.addEventListener('pointerdown',e=>splitStart(e,at));doc().body.appendChild(r);D.reg[at]=r;return r;}
 // the wrapper of a group of many cards (or of any group in a region): its tab strip and its body
 function wrapper(g){let w=D.wrap.get(g.id);if(w)return w;w=doc().createElement('div');w.className='dk-group';w.dataset.dkGroup=g.id;
  w.innerHTML='<div class="dk-tabs" role="tablist"></div><div class="dk-body"><div class="dk-vsplit" data-dk-vsplit hidden title="Σύρε για το πλάτος των δύο καρτών"></div></div>';
  const tabs=w.firstChild;tabs.addEventListener('pointerdown',e=>{const t=e.target.closest('[data-dk-tab]');if(t)dragStart(e,t.dataset.dkTab,t);});
  tabs.addEventListener('click',e=>{const t=e.target.closest('[data-dk-tab]');if(t&&!D.dragged){activate(t.dataset.dkTab);}
   const x=e.target.closest('[data-dk-tabmenu]');if(x)openMenu(x.dataset.dkTabmenu,x);
   // 5.0.6: side by side and back
   const y=e.target.closest('[data-dk-two]');if(y){const q=D.L.groups.find(z=>z.id===w.dataset.dkGroup);if(!q)return;if(q.side)side(q.active,null);else{const o=q.cards.find(c=>c!==q.active&&open(c));if(o)side(q.active,o);}}});
  w.lastChild.firstChild.addEventListener('pointerdown',e=>vsplitStart(e,w));
  D.wrap.set(g.id,w);return w;}
 function tabsHtml(g,always){const vis=g.cards.filter(open);if(!always&&vis.length<2)return '';const two=!!g.side&&open(g.side);
  return vis.map(c=>{const d=D.by.get(c),on=c===g.active||(two&&c===g.side);return `<button class="dk-tab${on?' on':''}" role="tab" aria-selected="${on}" data-dk-tab="${esc(c)}" title="${esc(d.title)}: κλικ για να φανεί, σύρσιμο για κούμπωμα αλλού">${esc(d.title)}</button>`;}).join('')
   +`<span class="dk-tabsp"></span>`+(vis.length>1?`<button class="dk-tabbtn${two?' on':''}" data-dk-two aria-pressed="${two}" title="${two?'Μία κάρτα τη φορά':'Δίπλα δίπλα: η κάρτα που φαίνεται αριστερά και η επόμενη δεξιά'}">◫</button>`:'')
   +`<button class="dk-tabbtn" data-dk-tabmenu="${esc(g.active)}" aria-haspopup="menu" title="Κούμπωμα, καρτέλα, δίπλα δίπλα, όλη η οθόνη">▾</button>`;}
 // a floating card: out of the flow, at its rectangle, with the frame for its size
 function floatRect(id){const r=D.L.float[id],W=innerWidth,H=innerHeight,t=top();if(r)return clampRect(r);
  const w=Math.min(980,Math.max(360,W*0.6)),h=Math.min(720,Math.max(260,(H-t)*0.7));return clampRect({x:(W-w)/2,y:t+(H-t-h)/2,w,h});}
 function clampRect(r){const W=innerWidth,H=innerHeight,w=Math.max(320,Math.min(W-16,r.w)),h=Math.max(200,Math.min(H-16,r.h));
  return {x:Math.max(0,Math.min(W-w,r.x)),y:Math.max(0,Math.min(H-h,r.y)),w,h};}
 function setFloat(d,on){const el=d.el;if(on){const r=floatRect(d.id);if(el.parentNode!==doc().body)doc().body.appendChild(el);el.classList.add('dk-float');
   el.style.left=Math.round(r.x)+'px';el.style.top=Math.round(r.y)+'px';el.style.width=Math.round(r.w)+'px';el.style.height=Math.round(r.h)+'px';
   if(root.WinFrame&&!el._wfr)WinFrame.frame(el,{minW:320,minH:200,onresize:()=>keepFloat(d.id)});}
  else if(el.classList.contains('dk-float')){el.classList.remove('dk-float');root.WinFrame?.unframe?.(el);for(const k of ['left','top','width','height','right','bottom','maxWidth','maxHeight','position','margin'])el.style[k]='';}}
 function keepFloat(id){const d=D.by.get(id);if(!d||!d.el.classList.contains('dk-float'))return;const r=d.el.getBoundingClientRect();
  D.L.float[id]={x:Math.round(r.left),y:Math.round(r.top),w:Math.round(r.width),h:Math.round(r.height)};save();}
 // where every card goes now, from the model
 function render(){if(!D.on)return;D.busy=true;try{const L=D.L,order=ids();
  const used=new Set();
  // the page: a group of one card after its anchor; a group of many after the anchor of its first card
  for(const g of M.groups(L,'main',order)){const first=g.cards.slice().sort((a,b)=>order.indexOf(a)-order.indexOf(b))[0],anc=D.by.get(first).anchor;
   if(g.cards.length===1){const d=D.by.get(g.cards[0]);setFloat(d,false);if(anc.nextSibling!==d.el)anc.after(d.el);d.el.classList.remove('dk-off');continue;}
   const w=wrapper(g);used.add(g.id);if(anc.nextSibling!==w)anc.after(w);fill(w,g,false);}
  // the regions
  for(const at of SIDE){const r=region(at),q=M.groups(L,at);let any=false;
   q.forEach((g,i)=>{const w=wrapper(g);used.add(g.id);const ref=r.children[i+1]||null;if(ref!==w)r.insertBefore(w,ref);fill(w,g,true);const v=g.cards.some(open);if(v)any=true;w.hidden=!v;});
   r.hidden=!any;}
  // the floating cards
  for(const g of M.groups(L,'float')){const d=D.by.get(g.cards[0]);setFloat(d,true);d.el.classList.remove('dk-off');}
  // the wrappers that have no group any more
  for(const [k,w] of D.wrap)if(!used.has(k)){w.remove();D.wrap.delete(k);}
  // the screen around the regions
  const b=doc().body;sizes();
  // the largest size
  for(const d of D.defs){const m=L.max===d.id&&open(d.id);d.el.classList.toggle('dk-max',m);}
  b.classList.toggle('dk-maxed',!!L.max&&open(L.max));
  for(const d of D.defs)tools(d);
 }finally{D.busy=false;}
 for(const f of D.changed)try{f(D.L);}catch(e){}}
 // the room of the regions on the screen (alone while the edge of a region is dragged: no card moves then)
 function sizes(){const b=doc().body,L=D.L,show=at=>!!D.reg[at]&&!D.reg[at].hidden;b.style.setProperty('--dk-top',top()+'px');
  for(const [at,v] of [['left','--dk-l'],['right','--dk-r'],['bottom','--dk-b']]){const n=show(at)?Math.round(Math.min(at==='bottom'?innerHeight*0.8:innerWidth*0.7,L.size[at])):0;b.style.setProperty(v,n+'px');}
  b.classList.toggle('dk-side',show('left')||show('right'));b.classList.toggle('dk-has-b',show('bottom'));}
 // the cards of a group in its body, the one shown and the others hidden (a card closed from the menu has no tab)
 function fill(w,g,always){const body=w.lastChild;for(const c of g.cards){const d=D.by.get(c);setFloat(d,false);if(d.el.parentNode!==body)body.appendChild(d.el);}
  if(!open(g.active)){const v=g.cards.find(c=>open(c)&&c!==g.side)||(g.side&&open(g.side)?g.side:null);if(v){if(v===g.side){delete g.side;delete g.r;}g.active=v;}}
  // 5.0.6: two cards side by side: the shown one, the edge, the other (by the order of the flex row, not of the page)
  const two=!!g.side&&open(g.side)&&g.side!==g.active,sp=body.firstChild;
  for(const c of g.cards){const el=D.by.get(c).el,on=c===g.active||(two&&c===g.side);el.classList.toggle('dk-off',!on);
   el.style.order=two?(c===g.active?'0':c===g.side?'2':''):'';el.style.flex=two&&on?`${c===g.active?g.r:1-g.r} 1 0`:'';}
  sp.hidden=!two;sp.style.order='1';body.classList.toggle('dk-two',two);
  w.firstChild.innerHTML=tabsHtml(g,always);w.classList.toggle('dk-tabbed',!!w.firstChild.innerHTML);}
 // the buttons of a card: ⠿ (drag), ⇱ / ⇲ (a window of its own, or back to its place), ⛶ (the whole screen), ▾ (the menu)
 function tools(d){const w=M.where(D.L,d.id),fl=w?.at==='float',home=w?.at==='main'&&w.tabs===1;
  const b=d.tools.querySelector('[data-dk-float]');b.textContent=fl||!home?'⇲':'⇱';b.title=fl||!home?'Πίσω στη θέση της στη σελίδα':'Απόσπαση σε δικό της παράθυρο';
  d.tools.querySelector('[data-dk-max]').classList.toggle('on',D.L.max===d.id);d.el.dataset.dkAt=w?.at||'main';}
 // ------------------------------------------------------------------ the actions
 function change(f){f(D.L);D.L=M.normalize(D.L,ids());save();render();}
 const place=(id,at)=>{if(!D.by.has(id))return false;change(L=>{M.place(L,id,at);if(at==='float'&&!L.float[id])L.float[id]=floatRect(id);});return true;};
 const tab=(id,target)=>{if(!D.by.has(id)||!D.by.has(target))return false;change(L=>M.tab(L,id,target));return M.where(D.L,id)?.group===M.where(D.L,target)?.group;};
 const activate=id=>{if(!D.by.has(id))return false;change(L=>M.activate(L,id));return true;};
 // 5.0.6: side by side (other null: one at a time), and a card placed once as a document next to target
 const side=(id,other)=>{if(!D.by.has(id)||(other&&!D.by.has(other)))return false;change(L=>M.side(L,id,other));requestAnimationFrame(()=>root.dispatchEvent(new Event('resize')));return !other||M.where(D.L,id)?.two===true;};
 const firstAs=(id,target)=>{if(!D.by.has(id)||!D.by.has(target))return false;change(L=>M.firstAs(L,id,target));return true;};
 // the largest size and back (Esc: back)
 const max=(id,on)=>{if(!D.by.has(id))return false;change(L=>{if(on===undefined)on=L.max!==id;L.max=on?id:(L.max===id?null:L.max);});requestAnimationFrame(()=>root.dispatchEvent(new Event('resize')));return true;};
 // the card shown: its tab (and its window to the front)
 const reveal=id=>{const w=M.where(D.L,id);if(w&&!w.active)activate(id);const d=D.by.get(id);if(d?.el.classList.contains('dk-float'))doc().body.appendChild(d.el);return w;};
 const reset=()=>{if(!D.on)return;D.L=M.fresh(ids());for(const d of D.defs){d.el.classList.remove('dk-max');}save();render();};
 const where=id=>D.L?M.where(D.L,id):null;
 const label=id=>{const w=where(id);if(!w)return '';return w.at==='main'&&w.tabs===1?'':NAME[w.at]+(w.tabs>1?' · καρτέλα':'');};
 // ------------------------------------------------------------------ the menu of a card
 function menuHtml(id){const w=where(id),d=D.by.get(id),row=(k,t,dis,extra='')=>`<button class="dk-mi" data-dk-do="${k}" ${extra} ${dis?'disabled':''}>${t}</button>`;
  let s=`<div class="dk-mh"><b>${esc(d.title)}</b><small class="muted">${esc(label(id)||'στη θέση της')}</small></div>`;
  s+=row('main','⇲ Στη θέση της στη σελίδα',w.at==='main'&&w.tabs===1);
  s+=row('left','◧ Κούμπωμα αριστερά',w.at==='left'&&w.tabs===1)+row('right','◨ Κούμπωμα δεξιά',w.at==='right'&&w.tabs===1)+row('bottom','⬓ Κούμπωμα κάτω',w.at==='bottom'&&w.tabs===1);
  s+=row('float','⇱ Σε δικό της παράθυρο',w.at==='float');
  const others=D.defs.filter(o=>o.id!==id&&open(o.id)&&where(o.id)?.at!=='float'&&where(o.id)?.group!==w.group);
  if(others.length){s+='<div class="dk-msep">Ως καρτέλα δίπλα σε</div>';for(const o of others)s+=row('tab',esc(o.title),false,`data-dk-target="${esc(o.id)}"`);}
  // 5.0.6: side by side with another card (it comes into this group), or one at a time again
  if(w.at!=='float'){const g=M.groupOf(D.L,id),mates=D.defs.filter(o=>o.id!==id&&open(o.id)&&where(o.id)?.at!=='float');
   if(mates.length||g?.side){s+='<div class="dk-msep">Δίπλα δίπλα</div>';if(g?.side)s+=row('one','▭ Μία κάρτα τη φορά',false);
    for(const o of mates)if(!(g?.side===o.id&&g.active===id))s+=row('side','◫ '+esc(o.title)+' δεξιά',false,`data-dk-target="${esc(o.id)}"`);}}
  s+='<div class="dk-msep"></div>'+row('max',D.L.max===id?'⛶ Πίσω από την πλήρη οθόνη (Esc)':'⛶ Όλη η οθόνη',false);
  if(d.closable!==false)s+=row('close','✕ Κλείσιμο (ξανανοίγει από τα «🪟 Παράθυρα»)',false);
  return s;}
 function closeMenu(){if(D.menu)D.menu.hidden=true;}
 function openMenu(id,btn){const m=D.menu||(D.menu=(()=>{const m=doc().createElement('div');m.id='dock-menu';m.className='popup dk-menu';m.setAttribute('role','menu');m.hidden=true;doc().body.appendChild(m);
   m.addEventListener('click',e=>{const b=e.target.closest('[data-dk-do]');if(!b||b.disabled)return;const k=b.dataset.dkDo,id=m.dataset.dkFor;closeMenu();
    if(k==='tab')tab(id,b.dataset.dkTarget);else if(k==='side')side(id,b.dataset.dkTarget);else if(k==='one')side(id,null);else if(k==='max')max(id);else if(k==='close'){if(root.Panels)Panels.toggle(id,false);else D.by.get(id).el.hidden=true;}else place(id,k);});
   doc().addEventListener('pointerdown',e=>{if(!m.hidden&&!m.contains(e.target)&&!e.target.closest?.('[data-dk-menu],[data-dk-tabmenu]'))closeMenu();},true);
   doc().addEventListener('keydown',e=>{if(e.key==='Escape'&&!m.hidden)closeMenu();});return m;})());
  if(!m.hidden&&m.dataset.dkFor===id){closeMenu();return m;}
  m.dataset.dkFor=id;m.innerHTML=menuHtml(id);m.hidden=false;const r=btn?btn.getBoundingClientRect():{left:innerWidth/2,right:innerWidth/2,bottom:120};
  m.style.left=Math.max(8,Math.min(r.right-m.offsetWidth,innerWidth-m.offsetWidth-8))+'px';m.style.top=Math.round(Math.min(r.bottom+4,innerHeight-m.offsetHeight-8))+'px';return m;}
 // ------------------------------------------------------------------ the drag of a card, and where it lands
 // the zones while a card is dragged: the left, right and bottom edges, the box «στη σελίδα» in the middle, the title of
 // another card (as a tab), anywhere else a window of its own
 function zoneAt(x,y,id){const W=innerWidth,H=innerHeight,t=top(),bw=Math.max(90,Math.min(220,W*0.12)),bh=Math.max(80,Math.min(200,H*0.16));
  const zm=D.zones?.querySelector('.dkz-main')?.getBoundingClientRect();if(zm&&zm.width&&x>=zm.left-40&&x<=zm.right+40&&y>=zm.top-24&&y<=zm.bottom+24)return {at:'main'};
  // as a tab: over the head of another card that is not floating, or over the strip of a group
  const e=doc().elementFromPoint(x,y);
  const strip=e?.closest?.('.dk-tabs');if(strip){const g=D.L.groups.find(q=>D.wrap.get(q.id)?.firstChild===strip);if(g&&!g.cards.includes(id))return {tab:g.active};}
  for(const d of D.defs){if(d.id===id||!open(d.id)||d.el.classList.contains('dk-off')||where(d.id)?.at==='float')continue;if(d.head&&d.head.contains(e))return {tab:d.id};}
  if(y>t&&x<bw)return {at:'left'};if(y>t&&x>W-bw)return {at:'right'};if(y>H-bh)return {at:'bottom'};return {at:'float'};}
 function zones(){if(D.zones)return D.zones;const z=doc().createElement('div');z.id='dock-zones';z.className='dk-zones';z.hidden=true;
  z.innerHTML='<div class="dkz dkz-left">◧ αριστερά</div><div class="dkz dkz-right">◨ δεξιά</div><div class="dkz dkz-bottom">⬓ κάτω</div><div class="dkz dkz-main">⇲ στη σελίδα</div><div class="dkz-hi"></div><div class="dkz-ghost"></div>';
  doc().body.appendChild(z);D.zones=z;return z;}
 function hiRect(zn,id){const W=innerWidth,H=innerHeight,t=top(),L=D.L;
  if(zn.tab){const d=D.by.get(zn.tab),w=D.wrap.get(M.groupOf(L,zn.tab)?.id),s=w&&w.firstChild.innerHTML?w.firstChild:d.head,r=s.getBoundingClientRect();return {x:r.left,y:r.top,w:r.width,h:Math.max(28,Math.min(r.height,60)),txt:'ως καρτέλα δίπλα σε «'+d.title+'»'};}
  if(zn.at==='left')return {x:0,y:t,w:Math.min(W*0.7,L.size.left),h:H-t,txt:''};
  if(zn.at==='right'){const w=Math.min(W*0.7,L.size.right);return {x:W-w,y:t,w,h:H-t,txt:''};}
  if(zn.at==='bottom'){const h=Math.min(H*0.8,L.size.bottom);return {x:0,y:H-h,w:W,h,txt:''};}
  return null;}
 function dragStart(e,id,handle){if(e.button!==0||!D.by.has(id))return;const d=D.by.get(id),x0=e.clientX,y0=e.clientY,fl=d.el.classList.contains('dk-float');
  const r0=d.el.getBoundingClientRect();let live=false,zn=null;D.dragged=false;try{handle.setPointerCapture(e.pointerId);}catch(x){}
  const mv=ev=>{const dx=ev.clientX-x0,dy=ev.clientY-y0;if(!live){if(Math.hypot(dx,dy)<6)return;live=true;D.dragged=true;closeMenu();const z=zones();z.hidden=false;doc().body.classList.add('dk-dragging');
    z.querySelector('.dkz-ghost').textContent='⠿ '+d.title;d.el.classList.add('dk-dragged');}
   ev.preventDefault();zn=zoneAt(ev.clientX,ev.clientY,id);const z=D.zones,hi=z.querySelector('.dkz-hi'),gh=z.querySelector('.dkz-ghost');
   for(const k of ['left','right','bottom','main'])z.querySelector('.dkz-'+k).classList.toggle('on',zn.at===k);
   const q=hiRect(zn,id);hi.hidden=!q;if(q){Object.assign(hi.style,{left:q.x+'px',top:q.y+'px',width:q.w+'px',height:q.h+'px'});hi.textContent=q.txt;}
   if(fl&&zn.at==='float'){d.el.style.left=Math.round(Math.max(0,Math.min(innerWidth-40,r0.left+dx)))+'px';d.el.style.top=Math.round(Math.max(0,Math.min(innerHeight-30,r0.top+dy)))+'px';gh.hidden=true;}
   else{gh.hidden=false;gh.style.left=(ev.clientX+12)+'px';gh.style.top=(ev.clientY+10)+'px';}};
  const end=(ev,cancel)=>{handle.removeEventListener('pointermove',mv);handle.removeEventListener('pointerup',up);handle.removeEventListener('pointercancel',cc);doc().removeEventListener('keydown',esc_);
   if(D.zones)D.zones.hidden=true;doc().body.classList.remove('dk-dragging');d.el.classList.remove('dk-dragged');setTimeout(()=>{D.dragged=false;},0);
   if(!live)return;if(cancel||!zn){if(fl){d.el.style.left=r0.left+'px';d.el.style.top=r0.top+'px';}return;}
   if(zn.tab)tab(id,zn.tab);
   else if(zn.at==='float'){if(fl)keepFloat(id);else{D.L.float[id]=clampRect({x:ev.clientX-40,y:ev.clientY-14,w:Math.min(980,Math.max(360,r0.width)),h:Math.min(720,Math.max(260,Math.min(r0.height,innerHeight*0.7)))});place(id,'float');}}
   else place(id,zn.at);};
  const up=ev=>end(ev,false),cc=ev=>end(ev,true),esc_=ev=>{if(ev.key==='Escape')end(ev,true);};
  handle.addEventListener('pointermove',mv);handle.addEventListener('pointerup',up);handle.addEventListener('pointercancel',cc);doc().addEventListener('keydown',esc_);}
 // the size of a region, from its edge
 function splitStart(e,at){if(e.button!==0)return;e.preventDefault();const s=e.currentTarget;try{s.setPointerCapture(e.pointerId);}catch(x){}const x0=e.clientX,y0=e.clientY,v0=Math.min(at==='bottom'?innerHeight*0.8:innerWidth*0.7,D.L.size[at]);
  let raf=0,v=v0;doc().body.classList.add('dk-resizing');
  s.onpointermove=ev=>{v=at==='left'?v0+ev.clientX-x0:at==='right'?v0-(ev.clientX-x0):v0-(ev.clientY-y0);v=Math.max(220,Math.min(at==='bottom'?innerHeight*0.8:innerWidth*0.7,v));
   // only a line shows the new edge while it moves; the cards take the new size once, at the release (a circuit and its
   // graphs drawn anew in every frame of the drag cost 50–120 ms per frame in the IEEE 9)
   if(!raf)raf=requestAnimationFrame(()=>{raf=0;const d=Math.round(v-v0);s.style.transform=at==='left'?`translateX(${d}px)`:at==='right'?`translateX(${-d}px)`:`translateY(${-d}px)`;});};
  s.classList.add('on');
  s.onpointerup=s.onpointercancel=()=>{s.onpointermove=s.onpointerup=s.onpointercancel=null;if(raf){cancelAnimationFrame(raf);raf=0;}s.style.transform='';s.classList.remove('on');D.L.size[at]=Math.round(v);doc().body.classList.remove('dk-resizing');save();render();};}
 // 5.0.6: the edge between two cards side by side: a line while it moves, the new widths once, at the release
 function vsplitStart(e,w){if(e.button!==0)return;const g=D.L.groups.find(q=>q.id===w.dataset.dkGroup);if(!g||!g.side)return;e.preventDefault();e.stopPropagation();
  const s=e.currentTarget,body=w.lastChild,bw=body.getBoundingClientRect().width||1,x0=e.clientX,r0=g.r;try{s.setPointerCapture(e.pointerId);}catch(x){}
  let raf=0,r=r0;doc().body.classList.add('dk-resizing');s.classList.add('on');
  s.onpointermove=ev=>{r=Math.max(0.2,Math.min(0.8,r0+(ev.clientX-x0)/bw));if(!raf)raf=requestAnimationFrame(()=>{raf=0;s.style.transform=`translateX(${Math.round((r-r0)*bw)}px)`;});};
  s.onpointerup=s.onpointercancel=()=>{s.onpointermove=s.onpointerup=s.onpointercancel=null;if(raf){cancelAnimationFrame(raf);raf=0;}s.style.transform='';s.classList.remove('on');doc().body.classList.remove('dk-resizing');
   change(L=>M.ratio(L,g.active,r));};}
 // ------------------------------------------------------------------ the start
 // defs: [{id, title, sel (the card), head (where its buttons go, inside the card), closable}] in the order of the page
 function init(defs){const Dc=doc();if(!Dc||D.on)return api;
  for(const q of defs){const el=Dc.querySelector(q.sel);if(!el)continue;const head=q.head?el.querySelector(q.head)||el:el;
   const anchor=Dc.createComment('dock:'+q.id);el.before(anchor);el.dataset.dkCard=q.id;el.classList.add('dk-card');
   const t=Dc.createElement('span');t.className='dk-tools';
   t.innerHTML=`<button class="dk-grip" data-dk-grip title="Σύρε την κάρτα: αριστερά, δεξιά ή κάτω για κούμπωμα, στον τίτλο άλλης κάρτας για καρτέλα, στη μέση για τη θέση της, αλλού για δικό της παράθυρο (Esc: ακύρωση)">⠿</button><button data-dk-float>⇱</button><button data-dk-max title="Όλη η οθόνη και πίσω (Esc)">⛶</button><button data-dk-menu aria-haspopup="menu" title="Κούμπωμα σε περιοχή, καρτέλα δίπλα σε άλλη κάρτα, όλη η οθόνη">▾</button>`;
   head.appendChild(t);
   // the buttons inside a <summary> do not open or close its <details>
   t.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;e.preventDefault();e.stopPropagation();if(D.dragged)return;
    if(b.dataset.dkFloat!==undefined){const w=where(q.id);place(q.id,w.at==='main'&&w.tabs===1?'float':'main');}
    else if(b.dataset.dkMax!==undefined)max(q.id);else if(b.dataset.dkMenu!==undefined)openMenu(q.id,b);});
   t.querySelector('[data-dk-grip]').addEventListener('pointerdown',e=>{e.stopPropagation();dragStart(e,q.id,e.currentTarget);});
   const d={...q,el,head,anchor,tools:t};D.defs.push(d);D.by.set(q.id,d);
   // a card closed or opened from the menu «Παράθυρα»: its tab and its region follow
   new MutationObserver(()=>{if(!D.busy)render();}).observe(el,{attributes:true,attributeFilter:['hidden']});}
  // a card narrower than the page of 1100 px (in a region, in a window of its own): its columns one under the other, as
  // the stylesheet does for a narrow screen
  if(root.ResizeObserver){const ro=new ResizeObserver(es=>{for(const e of es){const w=e.contentRect.width;e.target.classList.toggle('dk-narrow',w>0&&w<860);}});for(const d of D.defs)ro.observe(d.el);}
  D.L=M.normalize(load(),ids());D.on=true;render();
  // a smaller screen: the floating cards inside it (their kept rectangle stays), the regions at most 70 % of it
  root.addEventListener('resize',()=>render());
  Dc.addEventListener('keydown',e=>{if(e.key!=='Escape'||!D.L.max)return;if([...Dc.querySelectorAll('.modal')].some(m=>!m.hidden&&m.offsetParent!==null))return;max(D.L.max,false);});
  return api;}
 const onChange=f=>{D.changed.push(f);};
 const state=()=>D.L?M.copy(D.L):null;
 const api={model:M,init,place,tab,activate,side,firstAs,max,reveal,reset,where,label,state,openMenu,closeMenu,onChange,NAME};
 root.Dock=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
