'use strict';
// 5.0.10 (ROADMAP §94 step ε, decision 385): the window of the second screen (web/screen.html). The page of the studio opens
// it for one card (screen.html?card=scope) and moves the card into it (dock.js): the card, its listeners and its state stay
// those of the page. This window only says hello to the page that opened it, every 250 ms, with its own window: the page
// takes it (Dock.screenHello gives 'ok'), is not ready yet ('wait'), or no longer has this card on the second screen
// ('close': the window closes). After a reload of the page the new page is another Dock: the card of the old one leaves
// this window and the hello starts again, so that the new page puts its own card here. A page that closed closes this
// window too. Opened alone (no page behind it), the window says where it opens from.
(function(){
 const card=new URLSearchParams(location.search).get('card')||'';
 const $=id=>document.getElementById(id);
 const say=t=>{const w=$('screen-wait'),m=$('screen-msg');if(m)m.textContent=t;if(w)w.hidden=false;};
 let cur=null,done=false,alone=0;
 function clear(){const r=$('screen-root');if(r)r.replaceChildren();}
 function tick(){let o=null;try{o=window.opener;}catch(e){o=null;}
  if(!o){if(++alone>2)say('Αυτό το παράθυρο ανοίγει από τη σελίδα του εργαστηρίου: ▾ μιας κάρτας → «▭ Σε δεύτερη οθόνη».');return;}
  if(o.closed){clear();say('Η σελίδα του εργαστηρίου έκλεισε.');setTimeout(()=>window.close(),400);return;}
  let d=null;try{d=o.Dock||null;}catch(e){d=null;}          // a page of another site: no access
  if(d!==cur){cur=d;if(done){clear();say('Η σελίδα του εργαστηρίου ξαναφορτώνει…');}done=false;}
  if(!d||done)return;let r='wait';try{r=d.screenHello(card,window);}catch(e){r='wait';}
  if(r==='ok')done=true;else if(r==='close'){clear();window.close();}}
 setInterval(tick,250);tick();
})();
