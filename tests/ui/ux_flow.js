// Usability of 4.6 (decisions 52–56): Ctrl+Z / Ctrl+Y with a Greek keyboard layout (e.key «ζ», «υ») and from anywhere but
// a text field; one undo step per completed action (a run of changes of the same parameter); the library in taxonomies
// (field, course, level, alphabetical, favourites and recent) with the search above them; the wheel over the bench
// (library, drawing, parameters, toolbar) never scrolls the page; the labels of the parts are HTML; the live simulation in
// its worker (the page's solver a mirror, the same numbers as a run in the page, a pause gives back the exact state).
// Needs Node + Playwright.
// Usage: python run.py --no-browser --port 8765  then  node tests/ui/ux_flow.js http://127.0.0.1:8765/ <out-dir>
const {chromium}=require('playwright');const OUT=process.argv[3]||'.';
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1500,height:900}});const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(String(e.stack||e)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
 const base=process.argv[2];await p.goto(base);await p.evaluate(()=>localStorage.clear());await p.goto(base+'?tutorial=buck');await p.waitForTimeout(1200);
 const R={};const fails=[];const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fails.push(m);};
 // a key as a Greek layout sends it: the letter of the layout in e.key, the position in e.code
 const greekKey=(target,code,key,opt={})=>p.evaluate(([sel,code,key,opt])=>{const t=sel==='body'?document.body:document.querySelector(sel);t.focus?.();
  t.dispatchEvent(new KeyboardEvent('keydown',{key,code,ctrlKey:true,bubbles:true,cancelable:true,...opt}));},[target,code,key,opt]);
 // 1. undo / redo with a Greek layout, with the focus on the drawing and on the page
 R.undo=await (async()=>{const n0=await p.evaluate(()=>PCL.editor.doc.components.length);
  await p.evaluate(()=>{const E=PCL.editor;E.addPart('R',600,400);});const n1=await p.evaluate(()=>PCL.editor.doc.components.length);
  await greekKey('svg.schem','KeyZ','ζ');const n2=await p.evaluate(()=>PCL.editor.doc.components.length);
  await greekKey('svg.schem','KeyY','υ');const n3=await p.evaluate(()=>PCL.editor.doc.components.length);
  await p.evaluate(()=>document.activeElement?.blur());await greekKey('body','KeyZ','ζ');const n4=await p.evaluate(()=>PCL.editor.doc.components.length);
  await greekKey('body','KeyZ','Ζ',{shiftKey:true});const n5=await p.evaluate(()=>PCL.editor.doc.components.length);
  return {n0,n1,n2,n3,n4,n5};})();
 ok(R.undo.n1===R.undo.n0+1&&R.undo.n2===R.undo.n0&&R.undo.n3===R.undo.n1,'Ctrl+Z / Ctrl+Y with e.key «ζ» / «υ» on the drawing '+JSON.stringify(R.undo));
 ok(R.undo.n4===R.undo.n0&&R.undo.n5===R.undo.n1,'Ctrl+Z / Ctrl+Shift+Z from the page (focus not on the drawing)');
 // a text field keeps its own undo: Ctrl+Z there does not touch the circuit
 R.textUndo=await p.evaluate(()=>{const E=PCL.editor,n=E.doc.components.length,i=document.querySelector('#pal-search');i.focus();
  i.dispatchEvent(new KeyboardEvent('keydown',{key:'z',code:'KeyZ',ctrlKey:true,bubbles:true,cancelable:true}));return E.doc.components.length===n;});
 ok(R.textUndo,'Ctrl+Z in a text field leaves the circuit alone');
 // 2. one undo step per action: 30 changes of the same parameter (a slider) within a moment are one step
 R.steps=await p.evaluate(()=>{const E=PCL.editor,n0=E.undoStack.length,c=E.doc.components.find(q=>q.type==='R');for(let k=0;k<30;k++)E.setParams(c.id,{R:5+k});
  const n1=E.undoStack.length;E.undo();return {n0,n1,R:+E.comp(c.id).params.R};});
 ok(R.steps.n1===R.steps.n0+1&&R.steps.R!==34,'a run of changes of one parameter is one undo step '+JSON.stringify(R.steps));
 // 3. the library: every visible part in every taxonomy, the search, favourites and recent parts, groups that close
 R.lib=await p.evaluate(()=>{const vis=Object.entries(Parts.PARTS).filter(([k,d])=>!d.hidden).map(([k])=>k),out={};
  for(const t of Library.TAX.filter(t=>t.id!=='mine')){document.querySelector('#pal-tax').value=t.id;document.querySelector('#pal-tax').dispatchEvent(new Event('change'));
   const shown=new Set([...document.querySelectorAll('#palette-list .pal-item[data-part]')].map(b=>b.dataset.part).filter(k=>!k.startsWith('SUB:')));out[t.id]={missing:vis.filter(k=>!shown.has(k)),groups:document.querySelectorAll('#palette-list details.pal-group').length};}
  document.querySelector('#pal-tax').value='field';document.querySelector('#pal-tax').dispatchEvent(new Event('change'));
  out.closed=[...document.querySelectorAll('#palette-list details.pal-group')].filter(d=>!d.open).length;
  const s=document.querySelector('#pal-search');s.value='πηνιο';s.dispatchEvent(new Event('input'));out.search=[...document.querySelectorAll('#palette-list .pal-item[data-part]')].map(b=>b.dataset.part);
  s.value='';s.dispatchEvent(new Event('input'));
  document.querySelector('#palette-list [data-fav="CPL"]').click();document.querySelector('#palette-list .pal-item[data-part="SCR"]').click();PCL.editor.escape(false);
  document.querySelector('#pal-tax').value='mine';document.querySelector('#pal-tax').dispatchEvent(new Event('change'));
  out.mine=[...document.querySelectorAll('#palette-list .pal-item[data-part]')].map(b=>b.dataset.part);
  out.saved=JSON.parse(localStorage.getItem('pcl-library')||'{}');return out;});
 ok(Object.values(R.lib).filter(v=>v&&v.missing).every(v=>!v.missing.length),'every part in every taxonomy '+JSON.stringify(Object.fromEntries(Object.entries(R.lib).filter(([k,v])=>v&&v.missing).map(([k,v])=>[k,v.missing.length]))));
 ok(R.lib.closed>=8,'by field most groups start closed ('+R.lib.closed+')');
 ok(JSON.stringify(R.lib.search)==='["L"]','search without accents finds the inductor '+JSON.stringify(R.lib.search));
 ok(R.lib.mine.includes('CPL')&&R.lib.mine.includes('SCR')&&R.lib.saved.tax==='mine'&&R.lib.saved.fav.includes('CPL'),'favourites and recent parts, remembered '+JSON.stringify(R.lib.mine));
 await p.screenshot({path:OUT+'/ux_library.png'});
 await p.evaluate(()=>{document.querySelector('#pal-tax').value='field';document.querySelector('#pal-tax').dispatchEvent(new Event('change'));});
 // 4. the wheel over the bench never scrolls the page: library, drawing, parameters, toolbar, live panel
 R.wheel=await (async()=>{await p.evaluate(()=>window.scrollTo(0,0));const boxes=await p.evaluate(()=>['.palette','#canvas','#props','.bench .toolbar'].map(s=>{const r=document.querySelector(s)?.getBoundingClientRect();return r?[s,r.x+r.width/2,r.y+Math.min(r.height-4,r.height/2)]:null;}).filter(Boolean));
  const out={};for(const [s,x,y] of boxes){await p.mouse.move(x,y);for(let i=0;i<8;i++)await p.mouse.wheel(0,400);await p.waitForTimeout(80);out[s]=await p.evaluate(()=>window.scrollY);}return out;})();
 ok(Object.values(R.wheel).every(v=>v===0),'the wheel over the bench does not scroll the page '+JSON.stringify(R.wheel));
 // 5. the labels are HTML in the drawing's coordinates, above the svg, and follow a zoom
 R.labels=await p.evaluate(async()=>{const E=PCL.editor,g=document.querySelector('.livel [data-l="L1"]');const r0=g.querySelector('.lbl').getBoundingClientRect();
  E.view.k*=1.5;E.applyView();await new Promise(r=>requestAnimationFrame(()=>r()));const r1=g.querySelector('.lbl').getBoundingClientRect();E.fit();
  return {html:g instanceof HTMLElement,inSvg:!!g.closest('svg'),grew:r1.height/r0.height};});
 ok(R.labels.html&&!R.labels.inSvg&&Math.abs(R.labels.grew-1.5)<.05,'labels as HTML that scale with the view '+JSON.stringify(R.labels));
 // 6. the live simulation in its worker: the page is a mirror while it runs, a pause gives back the state, and a run to the
 //    end of the range is the same in the worker and in the page
 R.live=await p.evaluate(async()=>{const S=PCL.S;if(!Live.supported())return {skip:true};const T=S.sim.T;S.stopT=0;PCL.reset();
  document.querySelector('#speed').value='max';document.querySelector('#speed').dispatchEvent(new Event('change'));
  PCL.play();await new Promise(r=>setTimeout(r,600));const act=Live.active,t1=S.sim.t;PCL.pause();const t2=S.sim.t,R0=S.sim.ring,j=(R0.head-1+R0.cap)%R0.cap;
  const same=R0.t[j]===S.sim.t;S.sim.run(T);const t3=S.sim.t;
  const runTo=async(off)=>{Live.off=off;S.stopT=150*T;PCL.reset();PCL.play();await new Promise(res=>{const f=()=>S.running?setTimeout(f,40):res();f();});
   return {t:S.sim.t,iL:S.sim.now('I:L1'),avg:S.sim.lastPeriod('I:L1').avg,ev:S.sim.events().n};};
  const w=await runTo(false),m=await runTo(true);Live.off=false;S.stopT=0;PCL.reset();
  return {act,t1,t2,same,t3:t3>t2,w,m};});
 if(!R.live.skip){ok(R.live.act&&R.live.t2>=R.live.t1&&R.live.same&&R.live.t3,'live run in the worker, the state back on pause '+JSON.stringify({act:R.live.act,same:R.live.same}));
  ok(R.live.w.t===R.live.m.t&&Math.abs(R.live.w.iL-R.live.m.iL)<1e-9*Math.max(1,Math.abs(R.live.m.iL))&&R.live.w.ev===R.live.m.ev,'worker and page: the same run to the end of the range '+JSON.stringify(R.live));}
 else console.log('skip: no SharedArrayBuffer');
 // 7. a live change while the worker runs reaches it (the duty of the PWM)
 R.liveChange=await p.evaluate(async()=>{const S=PCL.S;if(!Live.supported())return {skip:true};PCL.reset();PCL.play();await new Promise(r=>setTimeout(r,300));
  S.sim.setControl('PWM1',{D:.25});await new Promise(r=>setTimeout(r,400));const live=S.sim.now('D:PWM1');PCL.pause();return {live,after:S.sim.now('D:PWM1'),active:Live.active};});
 if(!R.liveChange.skip)ok(Math.abs(R.liveChange.live-.25)<1e-9&&Math.abs(R.liveChange.after-.25)<1e-9&&!R.liveChange.active,'a live change reaches the worker '+JSON.stringify(R.liveChange));
 // 8. a live change of a parameter (load without fresh) goes to the worker without stopping it: the same start (epoch),
 //    and the load resistance reaches the run
 R.liveLoad=await p.evaluate(async()=>{const S=PCL.S;if(!Live.supported())return {skip:true};PCL.reset();PCL.play();await new Promise(r=>setTimeout(r,300));
  const e0=Live.epoch,R0=S.sim.net.compInfo.get('R1')?.main?.R;PCL.editor.setParams('R1',{R:20});await new Promise(r=>setTimeout(r,300));const e1=Live.epoch,act=Live.active;
  PCL.pause();const c=S.sim.project.components.find(q=>q.id==='R1');return {same:e0===e1,act,R:+c.params.R,t:S.sim.t};});
 if(!R.liveLoad.skip)ok(R.liveLoad.same&&R.liveLoad.act&&R.liveLoad.R===20,'a parameter change while running reaches the worker without a restart '+JSON.stringify(R.liveLoad));
 console.log(JSON.stringify(R));console.log('ERR',errs);
 await b.close();if(errs.length)fails.push('page errors');
 if(fails.length){console.error('FAIL\n'+fails.join('\n'));process.exit(1);}console.log('PASS');
})().catch(e=>{console.error(e);process.exit(1);});
