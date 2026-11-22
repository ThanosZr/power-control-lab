// 5.0.5 (ROADMAP §94 step β, decision 357): the cards of the page dock, float, go as tabs and fill the screen, in the browser;
// and the scopes of a part in a submenu and a window with its pins (Thanos 21/11, 21:10).
//  1. at the start every card is in its place and the page is the page of before (the same order, no region)
//  2. a drag by ⠿ to the left edge docks the scope there: the page leaves room for it, the scope and its graphs follow the
//     width of the region, and the simulation goes on running while cards move
//  3. a drag onto the title of another card makes a tab: one of the two shown, a click on a tab shows the other; a drag
//     onto the strip of a group in a region joins it
//  4. the menu ▾ docks a card at the bottom; ⇱ makes a window of its own: the frame (8 handles), moved by ⠿ and resized
//     from a corner, its rectangle kept; ⛶ fills the screen and Esc brings it back; the edge of a region changes its size
//  5. a card closed from «🪟 Παράθυρα» leaves its region and comes back to it; the menu says where every card is
//  6. after a reload the layout is the same; a drag to the middle brings a card back to its place; «Επαναφορά» brings
//     every card back, in the order of before
//  7. no id twice, one copy of every panel, and no visible button without a handler, with the cards docked
//  8. the scopes of a part: one row «⌁ Scopes» in the right click; its submenu has a row per pin with what it measures
//     (a click puts the signal in the scope or takes it out) and the window: the box of the part with every pin on its
//     side, for every pin what it measures with its value now, a click on or off, all the voltages in a new pane, none;
//     a three-phase pin with the node of each phase
//  9. 5.0.6 (§94 step γ, §95 point 2, §96 B.1): the diagram of a study opens as a tab next to the circuit, in its place; ◫
//     puts the two side by side and their edge is dragged; a lasso chooses the study area and the engine marks its boundary;
//     the full network against the equivalent in N−1; the area in EMT in the place of the circuit, and «↶ Πίσω»
// 10. 5.0.7 (§96 B.3): Fig. 15a refused before the engine for two boundary buses; for one (the area 1, 4 of the IEEE 9) the
//     area in EMT with the Foster circuit, and the scan against its blocks in the box of the area
// 11. 5.0.9 (§96 B.3): the FDNE for the two boundary buses 5 and 9 (the area 1, 4, 5, 9), passive: the area in EMT with the
//     EQV3 'fdne', and the scan against the FDNE at each port in the box of the area
// Usage: python run.py --no-browser --port 8765  then  node tests/ui/dock_flow.js http://127.0.0.1:8765/ [out]
const {chromium}=require('playwright');
let R={},fail=[];
(async()=>{const U=process.argv[2]||'http://127.0.0.1:8765/',OUT=process.argv[3]||'.';const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1500,height:1000}});const p=await ctx.newPage();
 const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
 const ok=(c,msg)=>{if(!c)fail.push(msg);};
 const rect=sel=>p.evaluate(s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return {l:r.left,t:r.top,w:r.width,h:r.height,r:r.right,b:r.bottom,vis:r.width>0&&r.height>0};},sel);
 const mid=async sel=>{const r=await rect(sel);return [r.l+r.w/2,r.t+r.h/2];};
 const drag=async(x0,y0,x1,y1)=>{await p.mouse.move(x0,y0);await p.mouse.down();await p.mouse.move(x0+(x1-x0)*0.3,y0+(y1-y0)*0.3,{steps:5});await p.mouse.move(x1,y1,{steps:8});await p.waitForTimeout(60);await p.mouse.up();await p.waitForTimeout(250);};
 const where=id=>p.evaluate(i=>Dock.where(i),id);
 const order=()=>p.evaluate(()=>[...document.querySelectorAll('main > .card:not([hidden]), main > .dk-group')].map(e=>e.dataset.dkCard||('['+[...e.querySelectorAll('.dk-card')].map(c=>c.dataset.dkCard).join(',')+']')));
 const parentRegion=sel=>p.evaluate(s=>document.querySelector(s)?.closest('.dk-region')?.dataset.dkRegion||(document.querySelector(s)?.classList.contains('dk-float')?'float':document.querySelector(s)?.closest('main')?'main':'?'),sel);
 const scopeW=()=>p.evaluate(()=>{const c=document.querySelector('#scope-card canvas'),k=document.querySelector('#scope-card');const a=c.getBoundingClientRect(),q=k.getBoundingClientRect();return {canvas:Math.round(a.width),card:Math.round(q.width),r:Math.round(a.right),cr:Math.round(q.right)};});
 await p.goto(U);await p.evaluate(()=>localStorage.clear());
 await p.goto(U+'?tutorial=buck');await p.waitForTimeout(2500);

 // 1. the page of before
 R.o0=await order();R.reg0=await p.evaluate(()=>[...document.querySelectorAll('.dk-region')].filter(r=>!r.hidden).length);
 R.tools=await p.evaluate(()=>[...document.querySelectorAll('.dk-card')].map(c=>c.dataset.dkCard+':'+c.querySelectorAll('.dk-tools button').length));
 ok(JSON.stringify(R.o0)===JSON.stringify(['circuit','scope','scen','cmd','addons','math','theory'])&&R.reg0===0,'the page of before (5.0.8: with the command line) '+JSON.stringify([R.o0,R.reg0]));
 ok(R.tools.length===8&&R.tools.every(x=>x.endsWith(':4')),'⠿ ⇱ ⛶ ▾ on every card (5.0.8: and on the command line), and on the diagram of the network (5.0.6, hidden until a study opens it) '+R.tools.join(' '));

 // 2. the scope to the left edge, by its grip, while it runs
 await p.evaluate(()=>PCL.play());await p.waitForTimeout(600);const t0=await p.evaluate(()=>PCL.S.sim?.t||0);
 let [gx,gy]=await mid('#scope-card .dk-grip');await drag(gx,gy,40,560);
 R.s1={at:await where('scope'),reg:await parentRegion('#scope-card'),left:await rect('#dock-left'),main:await p.evaluate(()=>parseFloat(getComputedStyle(document.querySelector('main')).marginLeft)),w:await scopeW()};
 await p.waitForTimeout(900);R.s1.run=await p.evaluate(()=>({t:PCL.S.sim?.t||0,running:PCL.S.running}));
 ok(R.s1.at?.at==='left'&&R.s1.reg==='left'&&R.s1.left?.vis,'the scope docked on the left by a drag '+JSON.stringify(R.s1));
 ok(Math.abs(R.s1.main-R.s1.left.w)<=2,'the page leaves room for the region '+JSON.stringify([R.s1.main,R.s1.left?.w]));
 ok(R.s1.w.canvas>100&&R.s1.w.r<=R.s1.w.cr+1&&R.s1.w.card<=R.s1.left.w,'the graphs follow the width of the region '+JSON.stringify(R.s1.w));
 ok(R.s1.run.running&&R.s1.run.t>t0,'the simulation goes on running '+JSON.stringify([t0,R.s1.run]));
 await p.screenshot({path:OUT+'/dock_left.png'});

 // 3. a tab: the math onto the title of the theory, in the page; a click on a tab
 await p.evaluate(()=>{const r=document.querySelector('#math-card').getBoundingClientRect();scrollBy(0,r.top-120);});await p.waitForTimeout(150);
 [gx,gy]=await mid('#math-card .dk-grip');const th=await rect('#tut-card .tut-head');await drag(gx,gy,th.l+th.w*0.45,th.t+12);
 R.t1={math:await where('math'),theory:await where('theory'),order:await order(),tabs:await p.evaluate(()=>[...document.querySelectorAll('main > .dk-group .dk-tab')].map(t=>t.textContent+(t.classList.contains('on')?'*':'')))};
 ok(R.t1.math?.group===R.t1.theory?.group&&R.t1.math.active&&R.t1.tabs.length===2,'a tab by a drag onto the title of another card '+JSON.stringify(R.t1));
 await p.click('main > .dk-group .dk-tab:not(.on)');await p.waitForTimeout(150);
 R.t2=await p.evaluate(()=>({math:getComputedStyle(document.querySelector('#math-card')).display,theory:getComputedStyle(document.querySelector('#tut-card')).display}));
 ok(R.t2.math==='none'&&R.t2.theory!=='none','a click on a tab shows the other card '+JSON.stringify(R.t2));
 // the theory (shown) to the strip of the scope's group on the left: they join
 [gx,gy]=await mid('#tut-card .dk-grip');const st=await rect('#dock-left .dk-tabs');await drag(gx,gy,st.l+st.w*0.7,st.t+st.h/2);
 R.t3={theory:await where('theory'),scope:await where('scope'),math:await where('math')};
 ok(R.t3.theory?.at==='left'&&R.t3.theory.group===R.t3.scope?.group&&R.t3.math?.at==='main'&&R.t3.math.tabs===1,'a drag onto the strip of a group in a region joins it '+JSON.stringify(R.t3));

 // 4. the menu: the scenarios at the bottom; ⇱: the add-ons in a window of their own
 await p.click('#scen-card .dk-tools [data-dk-menu]');await p.waitForTimeout(100);R.m0=await p.evaluate(()=>!document.querySelector('#dock-menu').hidden&&document.querySelector('#scen').open===false);
 await p.click('#dock-menu [data-dk-do="bottom"]');await p.waitForTimeout(200);
 R.m1={at:await where('scen'),reg:await parentRegion('#scen-card'),bottom:await rect('#dock-bottom'),pad:await p.evaluate(()=>parseFloat(getComputedStyle(document.querySelector('main')).paddingBottom))};
 ok(R.m0&&R.m1.at?.at==='bottom'&&R.m1.reg==='bottom'&&R.m1.bottom.vis&&R.m1.pad>=R.m1.bottom.h,'the menu ▾ docks at the bottom (and its button does not open the <details>) '+JSON.stringify([R.m0,R.m1]));
 await p.click('#addons-card .dk-tools [data-dk-float]');await p.waitForTimeout(300);
 R.f0={at:await where('addons'),r:await rect('#addons-card'),framed:await p.evaluate(()=>{const e=document.querySelector('#addons-card');return e.classList.contains('wfr')&&e.querySelectorAll(':scope > .wfr-h').length===8&&getComputedStyle(e).position==='fixed';})};
 ok(R.f0.at?.at==='float'&&R.f0.framed,'⇱: a window of its own with the frame '+JSON.stringify(R.f0));
 [gx,gy]=await mid('#addons-card .dk-grip');await drag(gx,gy,gx-260,gy+90);
 R.f1=await rect('#addons-card');
 const se=await rect('#addons-card > .wfr-se');await drag(se.l+se.w/2,se.t+se.h/2,se.l+se.w/2+120,se.t+se.h/2+40);
 R.f2={r:await rect('#addons-card'),kept:await p.evaluate(()=>Dock.state().float.addons)};
 ok(Math.abs(R.f1.l-(R.f0.r.l-260))<=3&&Math.abs(R.f1.t-(R.f0.r.t+90))<=3,'moved by ⠿ '+JSON.stringify([R.f0.r,R.f1]));
 ok(Math.abs(R.f2.r.w-(R.f1.w+120))<=3&&Math.abs(R.f2.r.h-(R.f1.h+40))<=3&&Math.abs(R.f2.kept.w-R.f2.r.w)<=2&&Math.abs(R.f2.kept.x-R.f2.r.l)<=2,'resized from a corner, its rectangle kept '+JSON.stringify(R.f2));
 // ⛶ fills the screen, Esc back
 await p.click('#bench-card .dk-tools [data-dk-max]');await p.waitForTimeout(250);R.x1=await rect('#bench-card');
 await p.keyboard.press('Escape');await p.waitForTimeout(250);R.x2={r:await rect('#bench-card'),max:await p.evaluate(()=>Dock.state().max)};
 ok(R.x1.w>=1490&&R.x1.b>=995&&R.x1.t<=80,'⛶ fills the screen '+JSON.stringify(R.x1));
 ok(R.x2.max===null&&R.x2.r.w<1400,'Esc brings it back '+JSON.stringify(R.x2));
 // the edge of the left region
 // (above the window of the add-ons, which starts lower)
 await p.evaluate(()=>Dock.activate('scope'));await p.waitForTimeout(150);
 const sp=await rect('#dock-left > .dk-split');const w0=(await rect('#dock-left')).w;await drag(sp.l+sp.w/2,sp.t+100,sp.l+sp.w/2+140,sp.t+100);
 R.e1={w0,w1:(await rect('#dock-left')).w,kept:await p.evaluate(()=>Dock.state().size.left),scope:await scopeW()};
 ok(Math.abs(R.e1.w1-(w0+140))<=3&&Math.abs(R.e1.kept-R.e1.w1)<=2&&R.e1.scope.card<=R.e1.w1&&R.e1.scope.card>w0-20,'the edge of a region changes its size, and the scope follows '+JSON.stringify(R.e1));
 await p.screenshot({path:OUT+'/dock_regions.png'});

 // 5. a card closed from the menu «Παράθυρα» leaves its region and comes back to it; where every card is
 await p.click('#open-panels');await p.waitForTimeout(100);
 R.pm=await p.evaluate(()=>[...document.querySelectorAll('#panels-menu .pm-row')].filter(r=>r.querySelector('.pm-place')).map(r=>r.querySelector('span').textContent+' → '+r.querySelector('.pm-place').textContent));
 await p.click('#panels-menu input[data-panel="scen"]');await p.waitForTimeout(150);R.c1={bottom:await p.evaluate(()=>document.querySelector('#dock-bottom').hidden),pad:await p.evaluate(()=>parseFloat(getComputedStyle(document.querySelector('main')).paddingBottom))};
 await p.click('#panels-menu input[data-panel="scen"]');await p.waitForTimeout(150);R.c2={bottom:await p.evaluate(()=>document.querySelector('#dock-bottom').hidden),reg:await parentRegion('#scen-card')};
 await p.keyboard.press('Escape');
 ok(R.pm.length>=4&&R.pm.some(x=>x.includes('αριστερά'))&&R.pm.some(x=>x.includes('κάτω'))&&R.pm.some(x=>x.includes('σε παράθυρο')),'the menu says where the cards are '+JSON.stringify(R.pm));
 ok(R.c1.bottom===true&&R.c1.pad<40&&R.c2.bottom===false&&R.c2.reg==='bottom','closed: its region goes; opened: back in its region '+JSON.stringify([R.c1,R.c2]));

 // 6. after a reload the same layout; the middle brings a card back; «Επαναφορά»
 const before=await p.evaluate(()=>JSON.stringify(Dock.state().groups.map(g=>[g.at,g.cards])));
 await p.reload();await p.waitForTimeout(2500);
 R.r1={same:before===await p.evaluate(()=>JSON.stringify(Dock.state().groups.map(g=>[g.at,g.cards]))),scope:await parentRegion('#scope-card'),addons:await parentRegion('#addons-card'),scen:await parentRegion('#scen-card'),fr:await rect('#addons-card')};
 ok(R.r1.same&&R.r1.scope==='left'&&R.r1.addons==='float'&&R.r1.scen==='bottom'&&Math.abs(R.r1.fr.w-R.f2.r.w)<=3,'the same layout after a reload '+JSON.stringify(R.r1));
 // the add-ons back by ⇲ (their window would cover the ⠿ of the scope), the scope shown in its group, then to the middle
 await p.click('#addons-card .dk-tools [data-dk-float]');await p.waitForTimeout(200);R.h0={at:await where('addons'),reg:await parentRegion('#addons-card'),framed:await p.evaluate(()=>document.querySelectorAll('#addons-card > .wfr-h').length)};
 ok(R.h0.at?.at==='main'&&R.h0.reg==='main'&&R.h0.framed===0,'⇲: back to its place, without the frame '+JSON.stringify(R.h0));
 await p.evaluate(()=>Dock.activate('scope'));await p.waitForTimeout(150);[gx,gy]=await mid('#scope-card .dk-grip');
 R.hit=await p.evaluate(([x,y])=>!!document.elementFromPoint(x,y)?.closest('.dk-grip'),[gx,gy]);
 await p.mouse.move(gx,gy);await p.mouse.down();await p.mouse.move(gx+60,gy+30,{steps:4});const zm=await rect('#dock-zones .dkz-main');await p.mouse.move(zm.l+zm.w/2,zm.t+zm.h/2,{steps:8});await p.waitForTimeout(60);
 R.z=await p.evaluate(()=>({shown:!document.querySelector('#dock-zones').hidden,on:document.querySelector('#dock-zones .dkz-main').classList.contains('on')}));await p.mouse.up();await p.waitForTimeout(250);
 R.h1={at:await where('scope'),reg:await parentRegion('#scope-card'),order:await order()};
 ok(R.z.shown&&R.z.on&&R.h1.at?.at==='main'&&R.h1.reg==='main'&&R.h1.order.indexOf('scope')===R.h1.order.indexOf('circuit')+1,'the middle brings a card back to its place '+JSON.stringify([R.z,R.h1]));
 // 7. with cards docked: no id twice, one copy of every panel, no visible button without a handler
 const cdp=await ctx.newCDPSession(p);await cdp.send('DOM.enable');
 const TYPES=new Set(['click','pointerdown','pointerup','mousedown','mouseup','dblclick']);
 const dead=async()=>{await p.evaluate(()=>{window.__vis=[...document.querySelectorAll('button')].filter(b=>b.getClientRects().length>0);});
  const {result:{objectId:docId}}=await cdp.send('Runtime.evaluate',{expression:'document'});
  const {listeners}=await cdp.send('DOMDebugger.getEventListeners',{objectId:docId,depth:-1,pierce:false});
  const withL=new Set(listeners.filter(l=>TYPES.has(l.type)&&l.backendNodeId).map(l=>l.backendNodeId));
  const {result:{objectId:vArr}}=await cdp.send('Runtime.evaluate',{expression:'window.__vis'});
  const {result:props}=await cdp.send('Runtime.getProperties',{objectId:vArr,ownProperties:true});
  const vis=new Set();for(const q of props){if(!/^\d+$/.test(q.name)||!q.value?.objectId)continue;vis.add((await cdp.send('DOM.describeNode',{objectId:q.value.objectId})).node.backendNodeId);}
  const {root}=await cdp.send('DOM.getDocument',{depth:-1});const out=[];
  const walk=(n,anc)=>{const a=n.attributes||[],attr=k=>{const i=a.indexOf(k);return i>=0?a[i+1]:null;};
   if(n.nodeName==='BUTTON'&&vis.has(n.backendNodeId)&&!withL.has(n.backendNodeId)&&!anc.some(x=>withL.has(x)))out.push((attr('id')?'#'+attr('id'):'')+(attr('class')?'.'+attr('class').split(' ')[0]:'')+':'+(attr('title')||'').slice(0,30));
   const below=['BODY','HTML','#document'].includes(n.nodeName)?[]:[...anc,n.backendNodeId];for(const c of n.children||[])walk(c,below);};
  walk(root,[]);await p.evaluate(()=>{delete window.__vis;});return out;};
 await p.evaluate(()=>{Dock.place('math','right');Dock.tab('scen','math');Dock.place('addons','float');});await p.waitForTimeout(200);
 R.chk=await p.evaluate(()=>Panels.check());R.dead=await dead();
 ok(!R.chk.dup.length&&!R.chk.twice.length&&!R.chk.missing.length,'no id twice, one copy of every panel '+JSON.stringify(R.chk));
 ok(!R.dead.length,'no visible button without a handler: '+R.dead.join('; '));
 // «Επαναφορά» of the menu: every card back, in the order of before, no region
 await p.click('#open-panels');await p.click('#panels-menu [data-panels-reset]');await p.waitForTimeout(250);await p.keyboard.press('Escape');
 R.reset={order:await order(),reg:await p.evaluate(()=>[...document.querySelectorAll('.dk-region')].filter(r=>!r.hidden).length),side:await p.evaluate(()=>document.body.classList.contains('dk-side')),
  float:await p.evaluate(()=>document.querySelectorAll('.card.dk-float,.dk-card > .wfr-h').length),main:await p.evaluate(()=>getComputedStyle(document.querySelector('main')).marginLeft)};
 ok(JSON.stringify(R.reset.order)===JSON.stringify(R.o0)&&R.reset.reg===0&&!R.reset.side&&R.reset.float===0,'«Επαναφορά»: every card back, in the order of before '+JSON.stringify(R.reset));
 await p.screenshot({path:OUT+'/dock_reset.png'});

 // 8. the scopes of a part: one row «⌁ Scopes» in the right click, its submenu by pin, the window with the pins
 await p.goto(U+'?tutorial=cable_xb');await p.waitForTimeout(3000);await p.evaluate(()=>PCL.play());await p.waitForTimeout(800);
 const xs=await p.evaluate(()=>{const c=PCL.editor.doc.components.find(k=>k.type==='TLM');const bb=Parts.bbox(c),m=PCL.editor.svg.getScreenCTM(),pt=PCL.editor.svg.createSVGPoint();pt.x=(bb[0]+bb[2])/2;pt.y=(bb[1]+bb[3])/2;const q=pt.matrixTransform(m);return {id:c.id,x:q.x,y:q.y,pins:Object.keys(Parts.elPins(c)).length};});
 await p.mouse.click(xs.x,xs.y,{button:'right'});await p.waitForTimeout(200);
 R.p1=await p.evaluate(()=>({rows:[...document.querySelectorAll('#ctx button')].filter(b=>/Scope/.test(b.textContent)).length,sub:!!document.querySelector('#ctx button.has-sub')}));
 await p.hover('#ctx button.has-sub');await p.waitForTimeout(200);
 R.p2=await p.evaluate(()=>({shown:!document.querySelector('#ctx-sub').hidden,pinRows:document.querySelectorAll('#ctx-sub .ps-row').length,opts:document.querySelectorAll('#ctx-sub [data-psk]').length,win:!!document.querySelector('#ctx-sub [data-pswin]')}));
 ok(R.p1.rows===1&&R.p1.sub&&R.p2.shown&&R.p2.pinRows===xs.pins&&R.p2.opts===2*xs.pins&&R.p2.win,'the right click has one row «⌁ Scopes», its submenu one row per pin and the window '+JSON.stringify([xs,R.p1,R.p2]));
 // (the tutorial has some of them in the scope already: a click turns each the other way)
 const k1=await p.evaluate(()=>document.querySelector('#ctx-sub .ps-row .ps-opt:last-child').dataset.psk),has=k=>p.evaluate(k=>PCL.scope.channels().some(c=>c.key===k),k);const on0=await has(k1);
 await p.click('#ctx-sub .ps-row .ps-opt:last-child');await p.waitForTimeout(150);R.p3={key:k1,on0,a:await has(k1),cls:await p.evaluate(()=>document.querySelector('#ctx-sub .ps-row .ps-opt:last-child').classList.contains('on')),menu:await p.evaluate(()=>!document.querySelector('#ctx').hidden)};
 await p.click('#ctx-sub .ps-row .ps-opt:last-child');await p.waitForTimeout(150);R.p3.b=await has(k1);
 ok(R.p3.a===!on0&&R.p3.cls===R.p3.a&&R.p3.b===on0&&R.p3.menu,'an option of the submenu puts its signal in the scope and takes it out, the menu stays '+JSON.stringify(R.p3));
 await p.click('#ctx-sub [data-pswin]');await p.waitForTimeout(700);
 R.w1=await p.evaluate(()=>{const w=document.querySelector('#pin-scope');const sides=['left','right','top','bottom'].map(s=>w.querySelectorAll('.pw-s-'+s+' .pw-pin').length);const vals=[...w.querySelectorAll('.pw-chip .pw-val')].map(e=>e.textContent);
  return {shown:!w.hidden,framed:w.classList.contains('wfr')&&w.querySelectorAll(':scope > .wfr-h').length===8,ctx:document.querySelector('#ctx').hidden,sides,chips:w.querySelectorAll('.pw-chip').length,live:vals.filter(v=>v!=='—').length,n:vals.length,clipped:w.querySelector('.pw-draw').scrollWidth>w.querySelector('.pw-draw').clientWidth+1};});
 ok(R.w1.shown&&R.w1.framed&&R.w1.ctx&&R.w1.sides[0]===xs.pins/2&&R.w1.sides[1]===xs.pins/2&&R.w1.chips===2*xs.pins&&R.w1.live===R.w1.n&&!R.w1.clipped,'the window: every pin on its side, what it measures with its value, the frame '+JSON.stringify(R.w1));
 const onN=()=>p.evaluate(()=>document.querySelectorAll('#pin-scope .pw-chip.on').length),on1=await onN(),was=await p.evaluate(()=>document.querySelector('#pin-scope .pw-s-left .pw-pin:first-child .pw-chip').classList.contains('on'));
 await p.click('#pin-scope .pw-s-left .pw-pin:first-child .pw-chip');await p.waitForTimeout(150);
 R.w2={on1,was,on:await onN(),ch:await p.evaluate(()=>PCL.scope.channels().length)};
 await p.selectOption('#pin-scope [data-pwto]','new');const np0=await p.evaluate(()=>PCL.scope.cfg.panes.length),offV=await p.evaluate(()=>[...document.querySelectorAll('#pin-scope .pw-chip:not(.on) b')].filter(b=>/^V/.test(b.textContent)).length);
 await p.click('#pin-scope [data-pwall="v"]');await p.waitForTimeout(300);
 R.w3=await p.evaluate(n0=>{const P=PCL.scope.cfg.panes;return {panes:P.length,n0,newPane:P[P.length-1].ch.length,on:document.querySelectorAll('#pin-scope .pw-chip.on').length,offV:[...document.querySelectorAll('#pin-scope .pw-chip:not(.on) b')].filter(b=>/^V/.test(b.textContent)).length};},np0);R.w3.offV0=offV;
 await p.click('#pin-scope [data-pwnone]');await p.waitForTimeout(300);R.w4=await p.evaluate(id=>({left:PCL.scope.channels().filter(c=>c.key.includes(':'+id)).length,on:document.querySelectorAll('#pin-scope .pw-chip.on').length}),xs.id);
 ok(R.w2.on===R.w2.on1+(R.w2.was?-1:1)&&R.w3.panes===R.w3.n0+1&&R.w3.newPane===offV&&offV>0&&R.w3.offV===0&&R.w4.left===0&&R.w4.on===0,'a chip, «+ Όλες οι τάσεις» in a new pane, «− Κανένα» '+JSON.stringify([R.w2,R.w3,R.w4]));
 await p.screenshot({path:OUT+'/dock_pins.png'});
 R.chk2=await p.evaluate(()=>Panels.check());R.dead2=await dead();
 ok(!R.chk2.dup.length&&!R.chk2.twice.length&&!R.dead2.length,'the window of the pins: no id twice, no button without a handler '+JSON.stringify([R.chk2,R.dead2]));
 await p.click('#pin-scope [data-pwclose]');
 // a three-phase pin («abc» of a generator): the node of each phase
 await p.goto(U+'?tutorial=ieee9_emt');await p.waitForTimeout(3000);await p.evaluate(()=>PCL.play());await p.waitForTimeout(800);
 await p.evaluate(()=>PCL.openPinScope('G2'));await p.waitForTimeout(800);
 R.g=await p.evaluate(()=>[...document.querySelectorAll('#pin-scope .pw-pin')].filter(e=>e.querySelector('.pw-name').textContent==='abc').map(e=>[...e.querySelectorAll('.pw-chip')].map(c=>c.querySelector('b').textContent+'='+c.querySelector('.pw-val').textContent))[0]);
 ok(R.g&&R.g.length===3&&R.g.every(x=>/^V⏚[abc]=/.test(x)&&!x.endsWith('—')),'a three-phase pin: the node of each phase '+JSON.stringify(R.g));
 await p.click('#pin-scope [data-pwclose]');
 // 9. the diagram of the network as a document of the central area (5.0.6)
 await p.evaluate(()=>{try{localStorage.removeItem('pcl-dock');}catch(e){}});
 await p.goto(U+'?tutorial=pf_study');await p.waitForTimeout(2500);
 await p.click('#theory [data-study="view"]');await p.waitForFunction(()=>!document.querySelector('#netview').hidden&&PCL.NV.v&&PCL.NV.v.state.frames>0,null,{timeout:60000});await p.waitForTimeout(400);
 R.d1=await p.evaluate(()=>({nv:Dock.where('netview'),c:Dock.where('circuit'),top:Math.round(document.querySelector('#netview').getBoundingClientRect().top),tabs:[...document.querySelectorAll('.dk-group .dk-tab')].map(t=>t.textContent),bench:document.querySelector('#bench-card').classList.contains('dk-off')}));
 ok(R.d1.nv.at==='main'&&R.d1.nv.group===R.d1.c.group&&R.d1.nv.active&&R.d1.bench&&R.d1.tabs.join()==='Κύκλωμα,Διάγραμμα του δικτύου'&&R.d1.top>=0&&R.d1.top<200,'the diagram opens as a tab next to the circuit, in its place '+JSON.stringify(R.d1));
 await p.click('.dk-group .dk-tab:first-child');await p.waitForTimeout(200);R.d2=await p.evaluate(()=>({c:Dock.where('circuit').active,nvOff:document.querySelector('#netview').classList.contains('dk-off')}));
 await p.click('.dk-group [data-dk-two]');await p.waitForTimeout(500);
 R.d3=await p.evaluate(()=>{const a=document.querySelector('#bench-card').getBoundingClientRect(),n=document.querySelector('#netview').getBoundingClientRect();return {two:Dock.where('circuit').two,aw:Math.round(a.width),nw:Math.round(n.width),lr:a.right<=n.left+1,cv:document.querySelector('#nv-canvas').clientWidth};});
 ok(R.d2.c&&R.d2.nvOff&&R.d3.two&&R.d3.lr&&Math.abs(R.d3.aw-R.d3.nw)<12&&R.d3.cv>200,'the circuit one click away; ◫ side by side, the shown card on the left '+JSON.stringify([R.d2,R.d3]));
 const vs=await rect('.dk-group .dk-vsplit');await drag(vs.l+vs.w/2,vs.t+200,vs.l+vs.w/2+150,vs.t+200);await p.waitForTimeout(400);
 R.d4=await p.evaluate(()=>({r:Dock.state().groups.find(g=>g.cards.includes('circuit')).r,aw:Math.round(document.querySelector('#bench-card').getBoundingClientRect().width),nw:Math.round(document.querySelector('#netview').getBoundingClientRect().width)}));
 ok(R.d4.r>0.55&&R.d4.aw>R.d4.nw+150,'the edge between the two cards '+JSON.stringify(R.d4));
 await p.click('.dk-group [data-dk-two]');await p.click('.dk-group .dk-tab:nth-child(2)');await p.waitForTimeout(400);
 // the lasso around the buses 1, 9, 5 of the IEEE 9 (4 lies inside), in the mode «◌ Λάσο»
 await p.click('[data-nv-mode="lasso"]');
 const hull=await p.evaluate(()=>{const v=PCL.NV.v,m=v.model,r=document.querySelector('#nv-canvas').getBoundingClientRect(),t=v.state.tr;const P=['1','9','5'].map(id=>{const i=m.ix.get(id);return [r.left+(m.x[i]-t.cx)*t.s+v.state.w/2,r.top+(m.y[i]-t.cy)*t.s+v.state.h/2];});
  const cx=P.reduce((a,q)=>a+q[0],0)/3,cy=P.reduce((a,q)=>a+q[1],0)/3;return P.map(([x,y])=>[Math.max(r.left+3,Math.min(r.right-3,cx+(x-cx)*1.3)),Math.max(r.top+3,Math.min(r.bottom-3,cy+(y-cy)*1.3))]);});
 await p.mouse.move(hull[0][0],hull[0][1]);await p.mouse.down();for(const q of hull.concat([hull[0]]))await p.mouse.move(q[0],q[1],{steps:8});await p.mouse.up();
 await p.waitForFunction(()=>PCL.NV.area.res&&!PCL.NV.area.busy,null,{timeout:30000});await p.waitForTimeout(200);
 R.d5=await p.evaluate(()=>({ids:PCL.NV.area.ids,res:PCL.NV.area.res,bnd:PCL.NV.v.state.bnd.size,drawn:PCL.NV.v.state.drawn,info:document.querySelector('#nv-area-info').textContent,edit:document.querySelector('#nv-edit').hidden}));
 ok(R.d5.ids.join()==='1,4,5,9'&&R.d5.res.boundary?.join()==='5,9'&&R.d5.res.internal?.join()==='1,4'&&R.d5.bnd===2&&R.d5.drawn.chosen===4&&R.d5.drawn.boundary===2&&/σύνορο 5, 9/.test(R.d5.info)&&R.d5.edit,'a lasso chooses the study area, the engine marks its boundary '+JSON.stringify(R.d5));
 await p.click('#nv-cmp-run');await p.waitForSelector('#nv-cmp table',{timeout:60000});
 R.d6=await p.evaluate(()=>({rows:[...document.querySelectorAll('#nv-cmp tbody tr')].map(r=>[...r.cells].map(c=>c.textContent).join('|')),worst:document.querySelector('#nv-cmp tr.worst td')?.textContent}));
 ok(R.d6.rows.length===4&&/^βασικό σημείο\|< 10⁻⁹/.test(R.d6.rows[0])&&/^br1\|χωρίς σύγκλιση/.test(R.d6.rows[1])&&R.d6.worst==='br9','the full network against the equivalent in N−1 '+JSON.stringify(R.d6));
 await p.screenshot({path:OUT+'/dock_area.png'});
 await p.selectOption('#nv-fig','15b');await p.click('#nv-emt');await p.waitForFunction(()=>PCL.NV.area.back&&!PCL.NV.area.busy,null,{timeout:60000});await p.waitForTimeout(1200);
 R.d7=await p.evaluate(()=>({tut:PCL.S.tut.id,eq:PCL.project().components.filter(c=>c.type==='EQV3').map(c=>c.params.names+' '+c.params.fig),c:Dock.where('circuit').active,back:!!document.querySelector('#nv-back')}));
 ok(R.d7.tut==='empty'&&R.d7.eq.join()==='5; 9 15b'&&R.d7.c&&R.d7.back,'the area in EMT, in the place of the circuit '+JSON.stringify(R.d7));
 await p.click('.dk-group .dk-tab:nth-child(2)');await p.click('#nv-back');await p.waitForTimeout(1200);
 R.d8=await p.evaluate(()=>({tut:PCL.S.tut.id,study:!!PCL.S.tutMeta?.study,eq:PCL.project().components.some(c=>c.type==='EQV3'),back:!!document.querySelector('#nv-back')}));
 ok(R.d8.tut==='pf_study'&&R.d8.study&&!R.d8.eq&&!R.d8.back,'«↶ Πίσω»: the tutorial and its circuit again '+JSON.stringify(R.d8));
 // 10. Fig. 15a (5.0.7)
 await p.click('.dk-group .dk-tab:nth-child(2)');await p.waitForTimeout(300);await p.selectOption('#nv-fig','15a');await p.waitForTimeout(100);
 R.f1=await p.evaluate(()=>({fmax:!document.querySelector('#nv-fmax-l').hidden,emt:document.querySelector('#nv-emt').disabled,info:document.querySelector('#nv-area-info').textContent}));
 ok(R.f1.fmax&&R.f1.emt&&/Σχ\. 15a θέλει έναν ζυγό στο σύνορο \(εδώ 2\)/.test(R.f1.info),'Fig. 15a with two boundary buses: refused before the engine '+JSON.stringify(R.f1));
 await p.evaluate(()=>PCL.NV.v.setSelection(['1','4']));
 await p.waitForFunction(()=>PCL.NV.area.res&&!PCL.NV.area.busy&&PCL.NV.area.res.boundary?.join()==='4',null,{timeout:30000});
 await p.click('#nv-emt');await p.waitForFunction(()=>PCL.NV.area.back&&!PCL.NV.area.busy,null,{timeout:120000});await p.waitForTimeout(1200);
 R.f2=await p.evaluate(()=>{const q=PCL.project().components.find(c=>c.type==='EQV3');return {fig:q?.params.fig,names:q?.params.names,rows:String(q?.params.F||'').split(';').length,
  svg:document.querySelectorAll('#nv-cmp svg.fz-plot polyline').length,tr:document.querySelectorAll('#nv-cmp tbody tr').length,txt:document.querySelector('#nv-cmp .small')?.textContent.slice(0,160)};});
 ok(R.f2.fig==='15a'&&R.f2.names==='4'&&R.f2.rows===R.f2.tr&&R.f2.rows>=4&&R.f2.svg===4&&/Σχ\. 15a στον ζυγό 4/.test(R.f2.txt||''),'Fig. 15a: the area in EMT, the scan against the blocks '+JSON.stringify(R.f2));
 await p.click('.dk-group .dk-tab:nth-child(2)');await p.waitForTimeout(300);await p.screenshot({path:OUT+'/dock_foster.png'});
 await p.click('#nv-back');await p.waitForTimeout(1000);
 // 11. the FDNE (5.0.9)
 await p.click('.dk-group .dk-tab:nth-child(2)');await p.waitForTimeout(300);await p.evaluate(()=>PCL.NV.v.setSelection(['1','4','5','9']));
 await p.waitForFunction(()=>PCL.NV.area.res&&!PCL.NV.area.busy&&PCL.NV.area.res.boundary?.join()==='5,9',null,{timeout:30000});
 await p.selectOption('#nv-fig','fdne');await p.waitForTimeout(100);await p.check('#nv-passive');
 R.n1=await p.evaluate(()=>({fmax:!document.querySelector('#nv-fmax-l').hidden,pas:!document.querySelector('#nv-passive-l').hidden,emt:document.querySelector('#nv-emt').disabled}));
 ok(R.n1.fmax&&R.n1.pas&&!R.n1.emt,'FDNE with two boundary buses: the top of the scan and «παθητικό» beside it '+JSON.stringify(R.n1));
 await p.click('#nv-emt');await p.waitForFunction(()=>PCL.NV.area.back&&!PCL.NV.area.busy,null,{timeout:120000});await p.waitForTimeout(1200);
 R.n2=await p.evaluate(()=>{const q=PCL.project().components.find(c=>c.type==='EQV3');return {fig:q?.params.fig,names:q?.params.names,rows:String(q?.params.FD||'').split(';').length,
  svg:document.querySelectorAll('#nv-cmp svg.fz-plot polyline').length,txt:document.querySelector('#nv-cmp .small')?.textContent.slice(0,600)};});
 ok(R.n2.fig==='fdne'&&R.n2.names==='5; 9'&&R.n2.rows>=10&&R.n2.svg===8&&/FDNE στους ζυγούς 5, 9/.test(R.n2.txt||'')&&/παθητικό/.test(R.n2.txt||''),'FDNE: the area in EMT, the scan against the FDNE at each port '+JSON.stringify(R.n2));
 await p.click('.dk-group .dk-tab:nth-child(2)');await p.waitForTimeout(300);await p.screenshot({path:OUT+'/dock_fdne.png'});
 await p.click('#nv-back');await p.waitForTimeout(1000);
 R.chk3=await p.evaluate(()=>Panels.check());R.dead3=await dead();
 ok(!R.chk3.dup.length&&!R.chk3.twice.length&&!R.dead3.length,'the diagram as a card: no id twice, no button without a handler '+JSON.stringify([R.chk3,R.dead3]));
 ok(!errs.length,'χωρίς σφάλματα JavaScript '+errs.slice(0,4).join(' | '));
 console.log(JSON.stringify(R,null,0).slice(0,3500));
 if(fail.length){console.log('FAIL');for(const f of fail)console.log(f);process.exitCode=1;}else console.log('PASS');
 await b.close();})().catch(e=>{console.error(e);console.log(JSON.stringify(R).slice(0,3500));if(fail.length)console.log(fail.join('\n'));process.exit(1);});
