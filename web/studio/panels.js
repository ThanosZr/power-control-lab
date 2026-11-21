'use strict';
// 5.0.2 (ROADMAP §94 step α, decision 357): the register of the panels of the studio and the menu «Παράθυρα».
// Every panel has an id, a title, a group (a card of the page, a panel of the work area, a window), the selector of its
// one element in the page, and how it opens and closes; a window that needs something first (a part selected, a study)
// says what. The cards of the page close and open again from the menu, kept in localStorage (pcl-panels); «Επαναφορά»
// opens every card and forgets the sizes and places of the windows (pcl-win-*, winframe.js). Panels.check(): no id twice
// and one copy of every panel (5.0.1 found a card twice in the page, with buttons that did nothing).
// The register has no DOM of its own: the page gives the panels (app.js), and the menu is written into a popup.
(function(root){
 const KEY='pcl-panels',GROUPS=[['card','Κάρτες της σελίδας'],['pane','Πλαίσια του χώρου εργασίας'],['window','Παράθυρα']];
 const P={list:[],by:new Map(),menu:null,sources:[]};
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const doc=()=>root.document;
 // d: {id, title, group ('card' | 'pane' | 'window'), sel (its one element), open(), close(), isOpen(), can() → '' or why
 // not, closable (false: always on the page), lazy (its element is written the first time it opens), hint}
 function register(d){if(!d||!d.id||P.by.has(d.id))throw new Error('Panels: no id, or the panel twice: '+(d&&d.id));const q={group:'window',closable:true,...d};P.list.push(q);P.by.set(q.id,q);return q;}
 // entries that change (one per add-on): a function that gives them, asked each time the menu or a toggle needs them
 const source=f=>{P.sources.push(f);};
 const all=()=>{const out=[...P.list];for(const f of P.sources){try{for(const d of f()||[])out.push({group:'window',closable:true,...d});}catch(e){}}return out;};
 const find=id=>P.by.get(id)||all().find(d=>d.id===id);
 const el=d=>d.sel&&doc()?doc().querySelector(d.sel):null;
 const shown=e=>!!e&&!e.hidden&&e.getClientRects().length>0;
 function hidden(){try{const o=JSON.parse(localStorage.getItem(KEY)||'{}');return new Set(Array.isArray(o.hidden)?o.hidden:[]);}catch(e){return new Set();}}
 function keep(h){try{localStorage.setItem(KEY,JSON.stringify({hidden:[...h]}));}catch(e){}}
 function state(d){const e=el(d);let open;try{open=d.isOpen?!!d.isOpen():shown(e);}catch(x){open=false;}let why='';try{why=d.can?d.can()||'':'';}catch(x){why=String(x.message||x);}
  return {id:d.id,title:d.title,group:d.group,open,why,closable:d.closable!==false,hint:d.hint||''};}
 const list=()=>all().map(state);
 // a card: its section hidden or shown, and kept
 function setCard(d,on){const e=el(d);if(!e||d.closable===false)return false;e.hidden=!on;const h=hidden();if(on)h.delete(d.id);else h.add(d.id);keep(h);try{d.onshow?.(on);}catch(x){}return true;}
 // the cards closed in an earlier visit
 function restore(){const h=hidden();for(const d of P.list)if(d.group==='card'&&d.closable!==false){const e=el(d);if(e)e.hidden=h.has(d.id);}}
 // open (on = true), close (false) or the other way (undefined); false when it cannot (and why, in state)
 function toggle(id,on){const d=find(id);if(!d)return false;const s=state(d);if(on===undefined)on=!s.open;if(on===s.open)return true;
  if(d.group==='card')return setCard(d,on);
  if(on){if(s.why)return false;d.open?.();}else{if(d.closable===false)return false;d.close?.();}return true;}
 // every card on the page again, the windows at their first size and place
 function reset(){keep(new Set());for(const d of P.list)if(d.group==='card'){const e=el(d);if(e&&e.hidden){e.hidden=false;try{d.onshow?.(true);}catch(x){}}}
  try{const ks=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith('pcl-win-'))ks.push(k);}ks.forEach(k=>localStorage.removeItem(k));}catch(e){}
  for(const d of P.list)try{d.reset?.();}catch(x){}}
 // no id twice in the document, every panel once (or not yet, if it is written when it opens)
 function check(D){D=D||doc();const ids=new Map();for(const e of D.querySelectorAll('[id]'))ids.set(e.id,(ids.get(e.id)||0)+1);
  const dup=[...ids].filter(([,n])=>n>1).map(([k,n])=>k+'×'+n),twice=[],missing=[];
  for(const d of P.list){if(!d.sel)continue;const n=D.querySelectorAll(d.sel).length;if(n>1)twice.push(d.id+'×'+n);else if(!n&&!d.lazy)missing.push(d.id);}
  return {dup,twice,missing,n:P.list.length};}
 // ------------------------------------------------------------------ the menu
 function html(){const L=list();let s='';
  for(const [g,t] of GROUPS){const q=L.filter(x=>x.group===g);if(!q.length)continue;s+=`<div class="pm-sec"><b>${esc(t)}</b>`;
   for(const x of q){const dis=!x.open&&!!x.why,fixed=x.open&&!x.closable;
    s+=`<label class="pm-row${dis?' off':''}" title="${esc(dis?x.why:x.hint)}"><input type="checkbox" data-panel="${esc(x.id)}" ${x.open?'checked':''} ${dis||fixed?'disabled':''}><span>${esc(x.title)}</span>${dis?`<small>${esc(x.why)}</small>`:''}</label>`;}
   s+='</div>';}
  return s+`<div class="pm-foot"><button data-panels-reset title="Όλες οι κάρτες στη σελίδα, και τα παράθυρα στο αρχικό τους μέγεθος και στη θέση τους">↺ Επαναφορά</button><small class="muted">${L.length} πλαίσια</small></div>`;}
 function closeMenu(){const m=P.menu;if(m)m.hidden=true;const b=doc().getElementById('open-panels');b?.setAttribute('aria-expanded','false');}
 // the popup under its button (one element, written anew each time it opens)
 function openMenu(btn){const D=doc();let m=P.menu;
  if(!m){m=P.menu=D.createElement('div');m.id='panels-menu';m.className='popup panels-menu';m.setAttribute('role','menu');m.hidden=true;D.body.appendChild(m);
   m.addEventListener('change',e=>{const id=e.target.dataset?.panel;if(!id)return;toggle(id,e.target.checked);m.innerHTML=html();});
   m.addEventListener('click',e=>{if(e.target.closest('[data-panels-reset]')){reset();m.innerHTML=html();}});
   D.addEventListener('pointerdown',e=>{if(!m.hidden&&!m.contains(e.target)&&!e.target.closest?.('#open-panels'))closeMenu();},true);
   D.addEventListener('keydown',e=>{if(e.key==='Escape'&&!m.hidden)closeMenu();});}
  if(!m.hidden){closeMenu();return m;}
  m.innerHTML=html();m.hidden=false;const r=btn?btn.getBoundingClientRect():{left:innerWidth-340,bottom:48};
  m.style.left=Math.max(8,Math.min(r.left,innerWidth-m.offsetWidth-8))+'px';m.style.top=Math.round(r.bottom+4)+'px';btn?.setAttribute('aria-expanded','true');return m;}
 const api={register,source,list,toggle,reset,restore,check,openMenu,closeMenu,get:find,html};
 root.Panels=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
