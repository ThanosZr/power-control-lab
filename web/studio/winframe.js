'use strict';
// 4.17.2 (ROADMAP §63): one frame for the windows of the studio (the settings of a part or a wire, the modal windows such
// as «Δεδομένα γραμμής» and the viewer of a recording, the floating panels): resized from every side and every corner,
// moved by the title, a first shape that is not tall and narrow (the content goes in columns when the window is wide),
// and its size (and, for the modal windows, its place) kept per kind of window in localStorage (pcl-win-<key>). Double
// click on the title: the largest size, and again the size of before.
// 5.0.2 (ROADMAP §94 point 6, decision 360): every window of the studio has it. The move and the double click are
// listened to on the window itself (the title may be written anew while the window is open, as in the façade of the AI
// controller), and the pointer is captured by the window, so a drag survives a new title. The modal windows that live
// in the page from the start (the diagram of the network, the tutorials, the settings) get the frame the first time
// they are shown. A window in the flow of a container (the windows of the add-ons, in their column) leaves it at its
// first move or resize (o.float), fixed where it was on the screen. A window that is folded to its title (class «min»)
// keeps its kept size for when it opens again (the stylesheet gives it the height of its title). o.onmove: the place
// after a move or the largest size, for a window whose place is kept elsewhere (the panel «Σήματα»: in the circuit).
(function(root){
 const KEY='pcl-win-',DIRS=['n','s','e','w','ne','nw','se','sw'];
 const load=k=>{try{const o=JSON.parse(localStorage.getItem(KEY+k)||'null');return o&&typeof o==='object'?o:null;}catch(e){return null;}};
 const save=(k,o)=>{try{localStorage.setItem(KEY+k,JSON.stringify(o));}catch(e){}};
 // the box the window lives in: its offset parent (a panel inside the editor) or the viewport (a fixed window)
 function bounds(el){const p=el.offsetParent;if(p&&getComputedStyle(el).position!=='fixed'){const r=p.getBoundingClientRect();return {l:r.left,t:r.top,w:p.clientWidth,h:p.clientHeight};}
  return {l:0,t:0,w:innerWidth,h:innerHeight};}
 function rectOf(el){const r=el.getBoundingClientRect(),B=bounds(el);return {x:r.left-B.l,y:r.top-B.t,w:r.width,h:r.height,B};}
 function apply(el,q){el.style.left=Math.round(q.x)+'px';el.style.top=Math.round(q.y)+'px';el.style.width=Math.round(q.w)+'px';el.style.height=Math.round(q.h)+'px';
  el.style.right='auto';el.style.bottom='auto';el.style.maxHeight='none';el.style.maxWidth='none';}
 // 5.0.2: out of the flow of its container, fixed at its place on the screen (o.float)
 function lift(el,st){if(!st.o.float||st.lifted)return;const r=el.getBoundingClientRect();st.lifted=true;el.style.position='fixed';el.style.margin='0';el.classList.add('wfr-free');
  apply(el,{x:r.left,y:r.top,w:r.width,h:r.height});}
 // the handles (again after the content of the window was written anew)
 function handles(el,st){if(el.querySelector(':scope > .wfr-h'))return;for(const d of DIRS){const h=document.createElement('div');h.className='wfr-h wfr-'+d;h.dataset.wfr=d;h.setAttribute('aria-hidden','true');el.appendChild(h);
   h.addEventListener('pointerdown',e=>start(e,el,st,d));}}
 function start(e,el,st,d){if(e.button!==0)return;e.preventDefault();e.stopPropagation();const h=e.currentTarget;lift(el,st);try{h.setPointerCapture(e.pointerId);}catch(x){}
  const r0=rectOf(el),x0=e.clientX,y0=e.clientY,o=st.o,mw=o.minW||240,mh=o.minH||140,B=r0.B;let raf=0,q=null;el.classList.add('wfr-moving');
  h.onpointermove=ev=>{const dx=ev.clientX-x0,dy=ev.clientY-y0;let {x,y,w,h:hh}=r0;
   if(d.includes('e'))w=Math.min(B.w-x,Math.max(mw,r0.w+dx));
   if(d.includes('s'))hh=Math.min(B.h-y,Math.max(mh,r0.h+dy));
   if(d.includes('w')){const nx=Math.max(0,Math.min(r0.x+r0.w-mw,r0.x+dx));w=r0.w+(r0.x-nx);x=nx;}
   if(d.includes('n')){const ny=Math.max(0,Math.min(r0.y+r0.h-mh,r0.y+dy));hh=r0.h+(r0.y-ny);y=ny;}
   q={x,y,w,h:hh};if(!raf)raf=requestAnimationFrame(()=>{raf=0;if(q)apply(el,q);});};
  h.onpointerup=h.onpointercancel=()=>{h.onpointermove=h.onpointerup=h.onpointercancel=null;if(raf){cancelAnimationFrame(raf);raf=0;}el.classList.remove('wfr-moving');
   if(q){apply(el,q);delete st.max;remember(el,st);st.o.onresize?.(q);if(d.includes('w')||d.includes('n'))st.o.onmove?.(q);}};}
 function remember(el,st){if(!st.o.key)return;const r=rectOf(el),o={w:Math.round(r.w),h:Math.round(r.h)};if(st.o.place){o.x=Math.round(r.x);o.y=Math.round(r.y);}save(st.o.key,o);}
 // double click on the title: the largest size inside its box, and back
 function toggleMax(el,st){lift(el,st);const r=rectOf(el);if(st.max){apply(el,st.max);delete st.max;}else{st.max={x:r.x,y:r.y,w:r.w,h:r.h};apply(el,{x:8,y:8,w:r.B.w-16,h:r.B.h-16});}
  remember(el,st);st.o.onresize?.();st.o.onmove?.(rectOf(el));}
 // the title of this window (not of a window inside it)
 function headOf(el,st,t){const h=st.o.head&&t.closest?.(st.o.head);return h&&el.contains(h)&&h.closest('.wfr')===el?h:null;}
 const FIELD='input,button,select,textarea,a,label,.wfr-h';
 // moving by the title (o.move): the window captures the pointer, so a title written anew does not end the drag
 function moveStart(e,el,st){if(!st.o.move||e.button!==0||!headOf(el,st,e.target)||e.target.closest(FIELD))return;e.preventDefault();lift(el,st);
  try{el.setPointerCapture(e.pointerId);}catch(x){}
  const r0=rectOf(el),x0=e.clientX,y0=e.clientY,id=e.pointerId;let q=null,raf=0;el.classList.add('wfr-moving');
  const mv=ev=>{if(ev.pointerId!==id)return;const B=r0.B;q={x:Math.max(0,Math.min(B.w-r0.w,r0.x+ev.clientX-x0)),y:Math.max(0,Math.min(B.h-r0.h,r0.y+ev.clientY-y0)),w:r0.w,h:r0.h};
   if(!raf)raf=requestAnimationFrame(()=>{raf=0;if(q)apply(el,q);});};
  const up=ev=>{if(ev.pointerId!==id)return;el.removeEventListener('pointermove',mv);el.removeEventListener('pointerup',up);el.removeEventListener('pointercancel',up);el.classList.remove('wfr-moving');
   if(raf){cancelAnimationFrame(raf);raf=0;}if(q){apply(el,q);remember(el,st);st.o.onmove?.(q);}};
  el.addEventListener('pointermove',mv);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);}
 // 5.0.2: the whole window inside its box, so that every side can be taken (the box of a panel cuts what passes it):
 // after a window was placed by its code (the façade next to its block, a place kept in the circuit) or its box shrank
 function keepIn(el){if(!el.getClientRects().length)return;const r=rectOf(el),B=r.B;if(!(B.w>0&&B.h>0)||(r.x>=-1&&r.y>=-1&&r.x+r.w<=B.w+1&&r.y+r.h<=B.h+1))return;
  const w=Math.min(r.w,B.w),h=Math.min(r.h,B.h);apply(el,{x:Math.max(0,Math.min(r.x,B.w-w)),y:Math.max(0,Math.min(r.y,B.h-h)),w,h});}
 function bind(el,st){el.addEventListener('dblclick',e=>{if(el._wfr!==st||!headOf(el,st,e.target)||e.target.closest('input,button,select,textarea,a'))return;toggleMax(el,st);});
  el.addEventListener('pointerdown',e=>{if(el._wfr===st)moveStart(e,el,st);});}
 // 5.0.5 (ROADMAP §94 step β): the frame off again (a card that floated and docks again): the handles go, the listeners of
 // this frame do nothing any more, and a new frame() starts anew
 function unframe(el){const st=el._wfr;if(!st)return;delete el._wfr;el.classList.remove('wfr','wfr-free','wfr-moving');for(const h of el.querySelectorAll(':scope > .wfr-h'))h.remove();}
 // el: the window. o: {key, head (selector of its title), minW, minH, w, h (its first size), place (keep the place too),
 // absolute (a box centred by its overlay becomes placed, so that its four sides move on their own), move (moved by
 // the title here), float (5.0.2: leaves the flow of its container at the first move or resize), onresize, onmove}
 function frame(el,o={}){let st=el._wfr;const first=!st,k0=st?.o.key;if(first){st=el._wfr={o};el.classList.add('wfr');bind(el,st);}else st.o={...st.o,...o};
  handles(el,st);
  // 5.0.2: a window that is not shown yet (the live parameters hidden at the start) takes its kept size, and its place
  // stays the one of its style
  if(first&&!el.getClientRects().length){const s=o.key?load(o.key):null;if(s){el.style.width=Math.round(Math.min(innerWidth-16,s.w))+'px';el.style.height=Math.round(Math.min(innerHeight-16,s.h))+'px';el.style.maxWidth='none';el.style.maxHeight='none';}return st;}
  if(first){const s=o.key?load(o.key):null,r=rectOf(el);
   if(o.absolute){el.style.position='absolute';el.style.margin='0';}
   if(o.float&&s&&Number.isFinite(s.x)&&o.place){st.lifted=true;el.style.position='fixed';el.style.margin='0';el.classList.add('wfr-free');}
   const B=o.float&&st.lifted?{w:innerWidth,h:innerHeight}:r.B;
   const w=Math.min(B.w-16,Math.max(o.minW||240,s?.w||o.w||r.w)),h=Math.min(B.h-16,Math.max(o.minH||140,s?.h||o.h||r.h));
   if(o.float&&!st.lifted){if(s){el.style.width=Math.round(w)+'px';el.style.height=Math.round(h)+'px';el.style.maxWidth='none';el.style.maxHeight='none';}}
   else if(s||o.absolute||o.w||o.h){const x=s&&o.place&&Number.isFinite(s.x)?s.x:o.absolute?(B.w-w)/2:r.x,y=s&&o.place&&Number.isFinite(s.y)?s.y:o.absolute?Math.max(8,(B.h-h)/2):r.y;
    apply(el,{x:Math.max(0,Math.min(B.w-w,x)),y:Math.max(0,Math.min(B.h-Math.min(h,B.h),y)),w,h});}}
  else if(st.o.key){const s=load(st.o.key);if(s&&!st.max){el.style.width=Math.min(innerWidth-16,s.w)+'px';el.style.height=Math.min(innerHeight-16,s.h)+'px';el.style.maxHeight='none';el.style.maxWidth='none';}
   // 5.0.2: another kind of the same window (the panel «Σήματα» as tiles or as a table) with no size of its own: the size of its style
   else if(!s&&o.key&&o.key!==k0&&!st.max){el.style.width='';el.style.height='';el.style.maxHeight='';el.style.maxWidth='';}}
  if(!(o.float&&!st.lifted))keepIn(el);
  return st;}
 // the size kept for a kind of window (for the windows that are written anew and placed by their own code)
 const size=k=>load(k);
 // 5.0.2: the largest size and back, from a button of the window (the ⤢ of a window of an add-on)
 const max=el=>{if(el?._wfr)toggleMax(el,el._wfr);};
 // every modal window of the studio (class «modal» with a «modal-box») gets the frame when it appears: the key from its
 // second class (ld-modal → ld), else its id (5.0.2: gallery, settings), its place kept
 function frameModal(n){const box=n.querySelector(':scope > .modal-box');if(!box||box._wfr)return;
  const k=[...n.classList].find(c=>c!=='modal')||n.id||'modal';
  requestAnimationFrame(()=>{if(box._wfr||n.hidden||!box.getClientRects().length)return;frame(box,{key:k.replace(/-modal$/,''),head:'.modal-head',absolute:true,place:true,move:true,minW:420,minH:240,onresize:()=>box.dispatchEvent(new Event('wfr-resize'))});});}
 function watchModals(){if(!root.MutationObserver||!root.document)return;
  new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)if(n.nodeType===1&&n.classList?.contains('modal')&&!n.hidden)frameModal(n);}).observe(document.body,{childList:true});
  // 5.0.2: the modal windows that are in the page from the start, when they are shown
  new MutationObserver(ms=>{for(const m of ms){const n=m.target;if(n.nodeType===1&&n.classList.contains('modal')&&!n.hidden)frameModal(n);}}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['hidden']});
  for(const n of document.querySelectorAll('body > .modal'))if(!n.hidden)frameModal(n);}
 const api={frame,unframe,size,max,watchModals};root.WinFrame=api;if(typeof module!=='undefined')module.exports=api;
 if(root.document){if(document.body)watchModals();else document.addEventListener('DOMContentLoaded',watchModals);}
})(typeof window!=='undefined'?window:globalThis);
