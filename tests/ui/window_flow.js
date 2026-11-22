// 5.0.2 (ROADMAP §94 point 6 and step α, decisions 357, 360): every window of the studio moves and grows, and the menu
// «Παράθυρα», in the browser.
//  1. the inside of a library part (the multi-objective controller of the vehicle): the frame, a move by its title, a
//     resize from a corner, «⤢ Όλο» that follows the window, the wheel that zooms about the pointer, a drag that moves
//     the diagram, its place and size again when it opens again
//  2. the panel «Σήματα»: a move writes its place into the circuit, a resize is kept per view, folded to its title and
//     open again at its size; the live parameters: resized, their content scrolls inside
//  3. the façade of the AI controller: a drag that goes on while the façade is written anew
//  4. the windows that live in the page from the start (settings, tutorials, the diagram of a study) get the frame when
//     shown, their place kept after a reload; the canvas of the diagram follows its window
//  5. a window of an add-on: leaves its column at the first move, ⤢ and back, its place kept when it opens again
//  6. the menu «Παράθυρα»: every panel of the register, a card closed while it runs and kept, a window from the menu,
//     «Επαναφορά»
//  7. every open window has the frame; in every tutorial no id twice, one copy of every panel, and no visible button
//     without a handler (the listeners from the DevTools protocol, on the button or an ancestor below <body>)
// Usage: python run.py --no-browser --port 8765  then  node tests/ui/window_flow.js http://127.0.0.1:8765/ [out]
const {chromium}=require('playwright');
(async()=>{const U=process.argv[2]||'http://127.0.0.1:8765/',OUT=process.argv[3]||'.';const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1500,height:1000}});const p=await ctx.newPage();
 const errs=[],fail=[],R={};p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
 const ok=(c,msg)=>{if(!c)fail.push(msg);};
 const rect=sel=>p.evaluate(s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return {l:r.left,t:r.top,w:r.width,h:r.height,r:r.right,b:r.bottom,framed:e.classList.contains('wfr'),handles:e.querySelectorAll(':scope > .wfr-h').length};},sel);
 const drag=async(x0,y0,dx,dy)=>{await p.mouse.move(x0,y0);await p.mouse.down();await p.mouse.move(x0+dx/2,y0+dy/2,{steps:4});await p.mouse.move(x0+dx,y0+dy,{steps:4});await p.mouse.up();await p.waitForTimeout(120);};
 // every open window of the page: has it the frame?
 const unframed=()=>p.evaluate(()=>{const vis=e=>!!e&&!e.hidden&&e.getClientRects().length>0;const out=[];
  for(const m of document.querySelectorAll('.modal'))if(vis(m)){const bx=m.querySelector(':scope > .modal-box');if(!bx?.classList.contains('wfr')||bx.querySelectorAll(':scope > .wfr-h').length!==8)out.push('modal#'+(m.id||m.className));}
  for(const e of document.querySelectorAll('.wpanel,.popup.inspector,#live-panel,.addon-dock'))if(vis(e)&&(!e.classList.contains('wfr')||e.querySelectorAll(':scope > .wfr-h').length!==8))out.push((e.id||e.className));
  return out;});
 const notFramed=new Set();const look=async()=>{for(const k of await unframed())notFramed.add(k);};
 await p.goto(U);await p.evaluate(()=>localStorage.clear());

 // 1. the inside of the multi-objective controller
 await p.goto(U+'?tutorial=ev_drive');await p.waitForTimeout(2500);
 const evc=await p.evaluate(()=>PCL.editor.doc.components.find(k=>k.type==='EVC')?.id);
 const at=await p.evaluate(id=>{const c=PCL.editor.comp(id),b=Parts.bbox(c),m=PCL.editor.svg.getScreenCTM(),pt=PCL.editor.svg.createSVGPoint();pt.x=(b[0]+b[2])/2;pt.y=(b[1]+b[3])/2;const q=pt.matrixTransform(m);return [q.x,q.y];},evc);
 await p.mouse.dblclick(at[0],at[1]);await p.waitForTimeout(700);
 R.in0=await rect('#lib-inside');R.in0.z=await p.evaluate(()=>Inside.zoom());R.in0.id=await p.evaluate(()=>Inside.openId());await look();
 ok(R.in0.framed&&R.in0.handles===8&&R.in0.id===evc,'the inside of the EVC opens with the frame '+JSON.stringify(R.in0));
 await p.click('#lib-inside [data-ifit]');const z1=await p.evaluate(()=>Inside.zoom());
 await drag(R.in0.r-4,R.in0.b-4,-260,-120);await p.waitForTimeout(250);R.in1=await rect('#lib-inside');R.in1.z=await p.evaluate(()=>Inside.zoom());
 ok(R.in1.w<R.in0.w-250&&R.in1.h<R.in0.h-110,'resized from its corner '+JSON.stringify([R.in0,R.in1]));
 ok(z1.fit&&R.in1.z.fit&&R.in1.z.z<z1.z-1e-3,'«⤢ Όλο» follows the window '+JSON.stringify([z1,R.in1.z]));
 await drag(R.in1.l+60,R.in1.t+12,120,70);R.in2=await rect('#lib-inside');
 ok(Math.abs(R.in2.l-R.in1.l-120)<3&&Math.abs(R.in2.t-R.in1.t-70)<3&&Math.abs(R.in2.w-R.in1.w)<2,'moved by its title '+JSON.stringify([R.in1,R.in2]));
 // the wheel about a point of the diagram: that point stays under the pointer
 R.wheel=await p.evaluate(()=>{const b=document.querySelector('#lib-inside .in-body'),r=b.getBoundingClientRect(),sv=b.querySelector('.in-svg'),cx=r.left+r.width*0.4,cy=r.top+r.height*0.5;
  const at=()=>{const o=sv.getBoundingClientRect(),z=Inside.zoom().z;return [(cx-o.left)/z,(cy-o.top)/z];};const a0=at(),z0=Inside.zoom().z;
  for(let i=0;i<3;i++)b.dispatchEvent(new WheelEvent('wheel',{deltaY:-200,clientX:cx,clientY:cy,bubbles:true,cancelable:true}));
  const a1=at(),z=Inside.zoom();return {z0,z:z.z,fit:z.fit,a0,a1,sl:b.scrollLeft,st:b.scrollTop,ed:PCL.editor.view.k};});
 // in pixels of the screen: the scroll of the body is whole pixels, so at a small zoom one pixel is several units of the diagram
 R.wheel.px=Math.hypot(R.wheel.a1[0]-R.wheel.a0[0],R.wheel.a1[1]-R.wheel.a0[1])*R.wheel.z;
 ok(R.wheel.z>R.wheel.z0*1.5&&!R.wheel.fit&&R.wheel.px<1.5,'the wheel zooms about the pointer '+JSON.stringify(R.wheel));
 {const r=await rect('#lib-inside .in-body');await drag(r.l+r.w/2,r.t+r.h/2,-80,-40);}
 R.pan=await p.evaluate(()=>{const b=document.querySelector('#lib-inside .in-body');return {sl:b.scrollLeft,st:b.scrollTop};});
 ok(R.pan.sl>R.wheel.sl+60,'a drag moves the diagram '+JSON.stringify([R.wheel,R.pan]));
 await p.click('#lib-inside [data-ifit]');R.fit=await p.evaluate(()=>Inside.zoom());ok(R.fit.fit,'⤢ Όλο again '+JSON.stringify(R.fit));
 await p.keyboard.press('Escape');await p.waitForTimeout(150);ok(await p.evaluate(()=>document.querySelector('#lib-inside').hidden),'Esc closes the inside');
 await p.mouse.dblclick(at[0],at[1]);await p.waitForTimeout(600);R.in3=await rect('#lib-inside');
 ok(Math.abs(R.in3.l-R.in2.l)<3&&Math.abs(R.in3.t-R.in2.t)<3&&Math.abs(R.in3.w-R.in2.w)<3&&Math.abs(R.in3.h-R.in2.h)<3,'opens again at its place and size '+JSON.stringify([R.in2,R.in3]));
 await p.evaluate(()=>Inside.close());

 // 2. the panel «Σήματα» and the live parameters
 if(await p.evaluate(()=>document.querySelector('#watch-panel').hidden))await p.click('#watch-btn');await p.waitForTimeout(200);
 R.wp0=await rect('#watch-panel');await look();
 await drag(R.wp0.l+30,R.wp0.t+10,-200,40);R.wp1=await rect('#watch-panel');
 R.wp1.saved=await p.evaluate(()=>{const w=PCL.editor.doc.watch;return w?.panel?{x:w.panel.x,y:w.panel.y}:null;});
 R.wp1.box=await p.evaluate(()=>{const r=document.querySelector('#watch-panel').offsetParent.getBoundingClientRect();return {l:r.left,t:r.top};});
 ok(R.wp0.framed&&R.wp0.handles===8&&Math.abs(R.wp1.l-R.wp0.l+200)<3&&R.wp1.saved&&Math.abs(R.wp1.saved.x-(R.wp1.l-R.wp1.box.l))<3,'«Σήματα»: moved, the place in the circuit '+JSON.stringify([R.wp0,R.wp1]));
 await drag(R.wp1.l+R.wp1.w/2,R.wp1.b-2,0,-90);await drag(R.wp1.r-2,R.wp1.t+R.wp1.h/3,110,0);R.wp2=await rect('#watch-panel');
 R.wp2.kept=await p.evaluate(()=>JSON.parse(localStorage.getItem('pcl-win-watch')||'null'));
 ok(R.wp2.w>R.wp1.w+100&&R.wp2.h<R.wp1.h-80&&R.wp2.kept&&Math.abs(R.wp2.kept.w-R.wp2.w)<2&&Math.abs(R.wp2.kept.h-R.wp2.h)<2,'«Σήματα»: resized, the size kept '+JSON.stringify([R.wp1,R.wp2]));
 await p.click('#watch-panel [data-wmin]');await p.waitForTimeout(150);R.wp3=await rect('#watch-panel');
 await p.click('#watch-panel [data-wmin]');await p.waitForTimeout(150);R.wp4=await rect('#watch-panel');
 ok(R.wp3.h<70&&Math.abs(R.wp4.h-R.wp2.h)<2,'«Σήματα»: folded to its title, open again at its size '+JSON.stringify([R.wp3.h,R.wp4.h,R.wp2.h]));
 await p.click('#watch-panel [data-wview="table"]');await p.waitForTimeout(200);R.wp5=await rect('#watch-panel');
 await p.click('#watch-panel [data-wview="tiles"]');await p.waitForTimeout(200);R.wp6=await rect('#watch-panel');
 ok(Math.abs(R.wp5.w-R.wp2.w)>20&&Math.abs(R.wp6.w-R.wp2.w)<2&&Math.abs(R.wp6.h-R.wp2.h)<2,'«Σήματα»: the table has a size of its own '+JSON.stringify([R.wp2.w,R.wp5.w,R.wp6.w]));
 // the live parameters
 if(await p.evaluate(()=>document.querySelector('#live-panel').hidden))await p.click('#lp-toggle');
 await p.evaluate(()=>document.querySelector('#scope-card').scrollIntoView({block:'start'}));await p.waitForTimeout(200);
 R.lp0=await rect('#live-panel');await drag(R.lp0.l+R.lp0.w/2,R.lp0.b-2,0,-Math.min(140,R.lp0.h-130));await drag(R.lp0.l+2,R.lp0.t+R.lp0.h/3,-90,0);R.lp1=await rect('#live-panel');
 R.lp1.sc=await p.evaluate(()=>{const b=document.querySelector('#live-panel .lp-body');return {sh:b.scrollHeight,ch:b.clientHeight,ov:getComputedStyle(document.querySelector('#live-panel')).overflow};});
 ok(R.lp0.framed&&R.lp0.handles===8&&R.lp1.w>R.lp0.w+80&&R.lp1.l<R.lp0.l-80,'the live parameters resized from a side '+JSON.stringify([R.lp0,R.lp1]));
 ok(R.lp1.sc.ov==='hidden'&&R.lp1.sc.ch>0,'the live parameters scroll inside, the handles stay '+JSON.stringify(R.lp1.sc));

 // 3. the façade of the AI controller: the drag goes on while it is written anew
 await p.goto(U+'?tutorial=ai_block');await p.waitForTimeout(1500);
 {const q=await p.evaluate(()=>{const E=PCL.editor,c=E.comp('C1'),m=E.svg.getScreenCTM(),pt=E.svg.createSVGPoint();pt.x=c.x;pt.y=c.y;const r=pt.matrixTransform(m);return {x:r.x,y:r.y};});await p.mouse.click(q.x,q.y);await p.waitForTimeout(300);}
 R.f0=await rect('#ai-facade');await look();
 await p.mouse.move(R.f0.l+40,R.f0.t+10);await p.mouse.down();await p.mouse.move(R.f0.l+80,R.f0.t-20,{steps:4});
 await p.evaluate(()=>{document.querySelector('#ai-facade .wp-head')._old=true;Watch.render(true);});const fresh=await p.evaluate(()=>!document.querySelector('#ai-facade .wp-head')._old);
 await p.mouse.move(R.f0.l+120,R.f0.t-50,{steps:4});await p.mouse.up();await p.waitForTimeout(120);R.f1=await rect('#ai-facade');
 ok(R.f0.framed&&R.f0.handles===8&&fresh&&Math.abs(R.f1.l-R.f0.l-80)<3&&Math.abs(R.f1.t-R.f0.t+60)<3,'the façade: the drag goes on over a new title '+JSON.stringify([R.f0,R.f1]));
 await drag(R.f1.l+2,R.f1.b-2,-90,-60);R.f2=await rect('#ai-facade');R.f2.kept=await p.evaluate(()=>JSON.parse(localStorage.getItem('pcl-win-aifac')||'null'));
 ok(R.f2.w>R.f1.w+80&&R.f2.h<R.f1.h-50&&R.f2.kept&&Math.abs(R.f2.kept.w-R.f2.w)<2,'the façade resized from its corner sw, its size kept '+JSON.stringify([R.f1,R.f2]));

 // 4. the windows that live in the page: settings, tutorials, the diagram of the network
 for(const [btn,sel,close] of [['#open-settings','#settings','#settings-close'],['#tutorials','#gallery','#gallery-close']]){
  await p.click(btn);await p.waitForTimeout(300);const r0=await rect(sel+' > .modal-box');await look();
  await drag(r0.l+r0.w/2,r0.t+14,-150,-30);const r1=await rect(sel+' > .modal-box');await p.click(close);
  R[sel]=[r0,r1];ok(r0.framed&&r0.handles===8&&Math.abs(r1.l-r0.l+150)<3&&Math.abs(r1.t-r0.t+30)<3,sel+': the frame, moved '+JSON.stringify([r0,r1]));}
 await p.reload();await p.waitForTimeout(1500);
 for(const [btn,sel,close] of [['#open-settings','#settings','#settings-close'],['#tutorials','#gallery','#gallery-close']]){
  await p.click(btn);await p.waitForTimeout(300);const r2=await rect(sel+' > .modal-box');await p.click(close);
  ok(Math.abs(r2.l-R[sel][1].l)<3&&Math.abs(r2.t-R[sel][1].t)<3,sel+': its place after a reload '+JSON.stringify([R[sel][1],r2]));}
 await p.goto(U+'?tutorial=opf_study');await p.waitForTimeout(5000);
 await p.evaluate(()=>[...document.querySelectorAll('#theory button')].find(b=>b.dataset.study==='view')?.click());
 await p.waitForSelector('#netview:not([hidden])',{timeout:60000}).catch(()=>{});await p.waitForTimeout(800);
 // 5.0.6 (§94 step γ): the diagram is a card of the page (a tab next to the circuit); in a window of its own it has the frame
 R.nvAt=await p.evaluate(()=>Dock.where('netview'));await p.evaluate(()=>Dock.place('netview','float'));await p.waitForTimeout(500);
 R.nv0=await rect('#netview');R.nv0.cw=await p.evaluate(()=>document.querySelector('#nv-canvas').clientWidth);await look();
 await drag(R.nv0.r-3,R.nv0.t+R.nv0.h/2,-200,0);await p.waitForTimeout(400);R.nv1=await rect('#netview');R.nv1.cw=await p.evaluate(()=>document.querySelector('#nv-canvas').clientWidth);
 ok(R.nvAt?.at==='main'&&R.nvAt.tabs===2&&R.nv0.framed&&R.nv0.handles===8&&R.nv1.w<R.nv0.w-190&&R.nv1.cw<R.nv0.cw-150,'the diagram of the network: a tab next to the circuit; in a window of its own the frame, and its canvas follows '+JSON.stringify([R.nvAt,R.nv0,R.nv1]));
 await p.screenshot({path:OUT+'/window_flow_netview.png'});
 await p.evaluate(()=>Dock.place('netview','main'));await p.click('#nv-close');

 // 5. a window of an add-on
 await p.evaluate(()=>Addons.open('impulse-params'));await p.waitForSelector('.addon-dock',{timeout:15000});await p.waitForTimeout(800);
 R.a0=await rect('.addon-dock');R.a0.pos=await p.evaluate(()=>getComputedStyle(document.querySelector('.addon-dock')).position);await look();
 await drag(R.a0.l+60,R.a0.t+10,-400,-300);R.a1=await rect('.addon-dock');R.a1.pos=await p.evaluate(()=>getComputedStyle(document.querySelector('.addon-dock')).position);
 ok(R.a0.framed&&R.a0.handles===8&&R.a1.pos==='fixed'&&Math.abs(R.a1.l-R.a0.l+400)<3&&Math.abs(R.a1.t-R.a0.t+300)<3,'the add-on leaves its column at the first move '+JSON.stringify([R.a0,R.a1]));
 await p.click('.addon-dock [data-dwide]');await p.waitForTimeout(150);R.a2=await rect('.addon-dock');
 await p.click('.addon-dock [data-dwide]');await p.waitForTimeout(150);R.a3=await rect('.addon-dock');
 ok(R.a2.w>1400&&R.a2.h>900&&Math.abs(R.a3.l-R.a1.l)<3&&Math.abs(R.a3.w-R.a1.w)<3,'⤢: the largest and back '+JSON.stringify([R.a2,R.a3]));
 await p.click('.addon-dock [data-dx]');await p.waitForTimeout(300);
 await p.evaluate(()=>Addons.open('impulse-params'));await p.waitForSelector('.addon-dock',{timeout:15000});await p.waitForTimeout(500);R.a4=await rect('.addon-dock');
 ok(Math.abs(R.a4.l-R.a3.l)<3&&Math.abs(R.a4.t-R.a3.t)<3,'the add-on opens again at its place '+JSON.stringify([R.a3,R.a4]));
 await p.click('.addon-dock [data-dx]');

 // 6. the menu «Παράθυρα» (panels.js): every panel of the register, a card closed while the circuit runs and kept after
 //    a reload, a window opened from the menu with its frame, a window that needs a part says which, «Επαναφορά»
 await p.goto(U+'?tutorial=buck');await p.waitForTimeout(1800);
 await p.click('#open-panels');await p.waitForTimeout(150);
 R.pm=await p.evaluate(()=>({n:Panels.list().length,rows:document.querySelectorAll('#panels-menu [data-panel]').length,check:Panels.check(),
  groups:[...new Set(Panels.list().map(x=>x.group))],ins:Panels.list().find(x=>x.id==='inside')?.why,fixed:document.querySelector('#panels-menu [data-panel="circuit"]').disabled}));
 ok(R.pm.n>=22&&R.pm.rows===R.pm.n&&!R.pm.check.dup.length&&!R.pm.check.twice.length&&!R.pm.check.missing.length&&R.pm.groups.join()==='card,pane,window'&&R.pm.ins&&R.pm.fixed,'the menu «Παράθυρα» '+JSON.stringify(R.pm));
 await p.click('#panels-menu [data-panel="scope"]');await p.waitForTimeout(100);
 R.pmRun=await p.evaluate(async()=>{const hid=document.querySelector('#scope-card').hidden,t0=PCL.S.sim.t;PCL.play();await new Promise(r=>setTimeout(r,1200));PCL.pause();return {hid,dt:PCL.S.sim.t-t0};});
 await p.click('#panels-menu [data-panel="scope"]');await p.waitForTimeout(250);
 R.pmRun.back=await p.evaluate(()=>({hid:document.querySelector('#scope-card').hidden,cw:document.querySelector('#scope-card canvas').clientWidth}));
 ok(R.pmRun.hid&&R.pmRun.dt>0&&!R.pmRun.back.hid&&R.pmRun.back.cw>300,'a card closed while it runs, and open again '+JSON.stringify(R.pmRun));
 await p.click('#panels-menu [data-panel="math"]');await p.click('#panels-menu [data-panel="settings"]');await p.waitForTimeout(300);
 R.pmWin=await rect('#settings > .modal-box');await look();await p.click('#settings-close');
 await p.reload();await p.waitForTimeout(1500);R.pmKept=await p.evaluate(()=>document.querySelector('#math-card').hidden);
 await p.click('#open-panels');await p.click('#panels-menu [data-panels-reset]');await p.waitForTimeout(150);
 R.pmReset=await p.evaluate(()=>({math:document.querySelector('#math-card').hidden,win:Object.keys(localStorage).filter(k=>k.startsWith('pcl-win-')).length}));await p.keyboard.press('Escape');
 ok(R.pmWin.framed&&R.pmKept&&!R.pmReset.math&&R.pmReset.win===0,'a window from the menu, a card kept closed, «Επαναφορά» '+JSON.stringify([R.pmWin,R.pmKept,R.pmReset]));

 // 7. every open window had the frame; no id twice, one copy of every panel, no visible button without a handler, in every tutorial
 ok(!notFramed.size,'every open window with the frame: '+[...notFramed].join(', '));
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
 const dups=()=>p.evaluate(()=>{const c=Panels.check();return [...c.dup,...c.twice.map(x=>'panel '+x)];});
 const ids=await p.evaluate(()=>Tutorials.list.map(t=>t.id));R.tut={n:ids.length,dup:[],dead:[]};
 for(const id of ids){await p.evaluate(i=>window.PCL.loadTutorial(i,{}),id).catch(e=>errs.push(id+': '+e.message));await p.waitForTimeout(700);
  const d=await dups();if(d.length)R.tut.dup.push(id+': '+d.join(' '));const x=await dead();if(x.length)R.tut.dead.push(id+': '+x.slice(0,6).join(' | '));}
 ok(R.tut.n>=87&&!R.tut.dup.length,'no id twice in a tutorial ('+R.tut.n+'): '+R.tut.dup.join('; '));
 ok(!R.tut.dead.length,'no visible button without a handler ('+R.tut.n+'): '+R.tut.dead.join('; '));

 ok(!errs.length,'χωρίς σφάλματα JavaScript '+errs.slice(0,4).join(' | '));
 console.log(JSON.stringify(R,null,0).slice(0,3000));
 if(fail.length){console.log('FAIL');for(const f of fail)console.log(f);process.exitCode=1;}else console.log('PASS');
 await b.close();})().catch(e=>{console.error(e);process.exit(1);});
