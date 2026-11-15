'use strict';
// 4.17.2 (ROADMAP §63): one frame for the windows of the studio (the settings of a part or a wire, the modal windows such
// as «Δεδομένα γραμμής» and the viewer of a recording, the floating panels): resized from every side and every corner,
// moved by the title, a first shape that is not tall and narrow (the content goes in columns when the window is wide),
// and its size (and, for the modal windows, its place) kept per kind of window in localStorage (pcl-win-<key>). Double
// click on the title: the largest size, and again the size of before.
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
 // the handles (again after the content of the window was written anew)
 function handles(el,st){if(el.querySelector(':scope > .wfr-h'))return;for(const d of DIRS){const h=document.createElement('div');h.className='wfr-h wfr-'+d;h.dataset.wfr=d;h.setAttribute('aria-hidden','true');el.appendChild(h);
   h.addEventListener('pointerdown',e=>start(e,el,st,d));}}
 function start(e,el,st,d){if(e.button!==0)return;e.preventDefault();e.stopPropagation();const h=e.currentTarget;try{h.setPointerCapture(e.pointerId);}catch(x){}
  const r0=rectOf(el),x0=e.clientX,y0=e.clientY,o=st.o,mw=o.minW||240,mh=o.minH||140,B=r0.B;let raf=0,q=null;el.classList.add('wfr-moving');
  h.onpointermove=ev=>{const dx=ev.clientX-x0,dy=ev.clientY-y0;let {x,y,w,h:hh}=r0;
   if(d.includes('e'))w=Math.min(B.w-x,Math.max(mw,r0.w+dx));
   if(d.includes('s'))hh=Math.min(B.h-y,Math.max(mh,r0.h+dy));
   if(d.includes('w')){const nx=Math.max(0,Math.min(r0.x+r0.w-mw,r0.x+dx));w=r0.w+(r0.x-nx);x=nx;}
   if(d.includes('n')){const ny=Math.max(0,Math.min(r0.y+r0.h-mh,r0.y+dy));hh=r0.h+(r0.y-ny);y=ny;}
   q={x,y,w,h:hh};if(!raf)raf=requestAnimationFrame(()=>{raf=0;if(q)apply(el,q);});};
  h.onpointerup=h.onpointercancel=()=>{h.onpointermove=h.onpointerup=h.onpointercancel=null;if(raf){cancelAnimationFrame(raf);raf=0;}el.classList.remove('wfr-moving');
   if(q){apply(el,q);delete st.max;remember(el,st);st.o.onresize?.(q);}};}
 function remember(el,st){if(!st.o.key)return;const r=rectOf(el),o={w:Math.round(r.w),h:Math.round(r.h)};if(st.o.place){o.x=Math.round(r.x);o.y=Math.round(r.y);}save(st.o.key,o);}
 // double click on the title: the largest size inside its box, and back
 function toggleMax(el,st){const r=rectOf(el);if(st.max){apply(el,st.max);delete st.max;}else{st.max={x:r.x,y:r.y,w:r.w,h:r.h};apply(el,{x:8,y:8,w:r.B.w-16,h:r.B.h-16});}
  remember(el,st);st.o.onresize?.();}
 // moving by the title, for the windows that have no mover of their own (o.move)
 function mover(el,st,head){head.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('input,button,select,textarea,a,.wfr-h'))return;e.preventDefault();try{head.setPointerCapture(e.pointerId);}catch(x){}
   const r0=rectOf(el),x0=e.clientX,y0=e.clientY;let q=null,raf=0;
   head.onpointermove=ev=>{const B=r0.B;q={x:Math.max(0,Math.min(B.w-r0.w,r0.x+ev.clientX-x0)),y:Math.max(0,Math.min(B.h-40,r0.y+ev.clientY-y0)),w:r0.w,h:r0.h};if(!raf)raf=requestAnimationFrame(()=>{raf=0;if(q)apply(el,q);});};
   head.onpointerup=head.onpointercancel=()=>{head.onpointermove=head.onpointerup=head.onpointercancel=null;if(raf)cancelAnimationFrame(raf);if(q){apply(el,q);remember(el,st);}};});}
 // el: the window. o: {key, head (selector of its title), minW, minH, w, h (its first size), place (keep the place too),
 // absolute (a box centred by its overlay becomes placed, so that its four sides move on their own), move (moved by
 // the title here), onresize}
 function frame(el,o={}){let st=el._wfr;const first=!st;if(first){st=el._wfr={o};el.classList.add('wfr');}else st.o={...st.o,...o};
  handles(el,st);
  const head=o.head?el.querySelector(o.head):null;
  if(head&&head._wfr!==el){head._wfr=el;head.addEventListener('dblclick',e=>{if(e.target.closest('input,button,select,textarea,a'))return;toggleMax(el,st);});if(o.move)mover(el,st,head);}
  if(first){const s=o.key?load(o.key):null,r=rectOf(el);
   if(o.absolute){el.style.position='absolute';el.style.margin='0';}
   const w=Math.min(r.B.w-16,Math.max(o.minW||240,s?.w||o.w||r.w)),h=Math.min(r.B.h-16,Math.max(o.minH||140,s?.h||o.h||r.h));
   if(s||o.absolute||o.w||o.h){const x=s&&o.place&&Number.isFinite(s.x)?s.x:o.absolute?(r.B.w-w)/2:r.x,y=s&&o.place&&Number.isFinite(s.y)?s.y:o.absolute?Math.max(8,(r.B.h-h)/2):r.y;
    apply(el,{x:Math.max(0,Math.min(r.B.w-w,x)),y:Math.max(0,Math.min(r.B.h-Math.min(h,r.B.h),y)),w,h});}}
  else if(o.key){const s=load(o.key);if(s&&!st.max){el.style.width=Math.min(innerWidth-16,s.w)+'px';el.style.height=Math.min(innerHeight-16,s.h)+'px';el.style.maxHeight='none';}}
  return st;}
 // the size kept for a kind of window (for the windows that are written anew and placed by their own code)
 const size=k=>load(k);
 // every modal window of the studio (class «modal» with a «modal-box») gets the frame when it appears: the key from its
 // second class (ld-modal → ld), its place kept
 function watchModals(){if(!root.MutationObserver||!root.document)return;new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes){
   if(n.nodeType!==1||!n.classList?.contains('modal'))continue;const box=n.querySelector(':scope > .modal-box');if(!box||box._wfr)continue;
   const k=[...n.classList].find(c=>c!=='modal')||'modal';requestAnimationFrame(()=>frame(box,{key:k.replace(/-modal$/,''),head:'.modal-head',absolute:true,place:true,move:true,minW:420,minH:240,onresize:()=>box.dispatchEvent(new Event('wfr-resize'))}));}})
   .observe(document.body,{childList:true});}
 const api={frame,size,watchModals};root.WinFrame=api;if(typeof module!=='undefined')module.exports=api;
 if(root.document){if(document.body)watchModals();else document.addEventListener('DOMContentLoaded',watchModals);}
})(typeof window!=='undefined'?window:globalThis);
