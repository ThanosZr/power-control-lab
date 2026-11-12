// The tiles of the control signals over the drawing (4.8, ROADMAP §47, web/studio/watch.js): the layout of a tutorial
// (controls pinned next to their blocks, signals in the panel), values and curves that follow the worker while ▶ runs,
// the switch «Μαθαίνει», a step and a typed value, «→ πρόγραμμα t:τιμή» and the same run again, a tile dragged and
// Ctrl+Z, the key S, the table with saturation, ▣ in the parameters panel, a tile from the menu of a part, the layout in
// a saved file, hidden inside a subcircuit, the vector-control tutorial, and the cost per frame. Needs Node + Playwright.
// Usage: python run.py --no-browser --port 8765  then  node tests/ui/watch_flow.js http://127.0.0.1:8765/ <out-dir>
const {chromium}=require('playwright');const OUT=process.argv[3]||'.';
const assert=(c,m)=>{if(!c)throw new Error('ASSERT: '+m);};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1500,height:1000}});const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(String(e.stack||e)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
 const base=process.argv[2];await p.goto(base);await p.evaluate(()=>localStorage.clear());await p.goto(base+'?tutorial=nn_online');await p.waitForTimeout(1500);
 const R={};
 // 1. the layout of the tutorial
 R.layout=await p.evaluate(()=>({vis:Watch.vis,btn:document.querySelector('#watch-btn').getAttribute('aria-pressed'),pinned:[...document.querySelectorAll('.sigl .wt .wt-n')].map(e=>e.textContent),
  panel:[...document.querySelectorAll('#watch-panel .wp-body .wt .wt-n')].map(e=>e.textContent),panelShown:!document.querySelector('#watch-panel').hidden}));
 assert(R.layout.vis&&R.layout.btn==='true'&&R.layout.panelShown,'layer on');
 assert(R.layout.pinned.join('|')==='ω* (στόχος)|Μαθαίνει|Φορτίο (συντελεστής)','pinned controls '+R.layout.pinned);
 assert(R.layout.panel.length===5&&R.layout.panel[0]==='ω','signals in the panel '+R.layout.panel);
 // 2. ▶: the worker runs and the tiles follow (the value of ω changes, the curve has points)
 await p.click('#play');await p.waitForTimeout(900);
 const read=()=>p.evaluate(()=>({t:PCL.S.sim.t,live:!!window.Live?.active,w:document.querySelector('#watch-panel .wt-sig .wt-x').textContent,pts:document.querySelector('#watch-panel .wt-sig .wt-sp polyline').getAttribute('points').split(' ').length}));
 R.run1=await read();await p.waitForTimeout(700);R.run2=await read();
 assert(R.run1.live,'the simulation runs in the worker');assert(R.run2.t>R.run1.t&&R.run2.w!==R.run1.w,'the tile follows the run');assert(R.run2.pts>20,'a curve');
 await p.screenshot({path:OUT+'/watch_running.png'});
 // 3. the switch «Μαθαίνει» while it runs (forwarded to the worker), then a pause
 await p.click('.sigl .wt-bool input');await p.waitForTimeout(400);await p.click('#play');await p.waitForTimeout(200);
 R.learn=await p.evaluate(()=>({learn:PCL.editor.comp('NN1').params.learn,chg:(PCL.S.sim.changes||[]).map(c=>[c.id,c.k,c.v]),label:document.querySelector('.sigl .wt-bool .wt-sw span').textContent}));
 assert(R.learn.learn===false&&R.learn.chg.some(c=>c[0]==='NN1'&&c[1]==='learn'&&c[2]===false)&&R.learn.label==='όχι','learning switched off live '+JSON.stringify(R.learn));
 // 4. +20 on ω* (a program: from the value it gives now), and a typed load factor
 R.step=await p.evaluate(()=>{const now=PCL.S.sim.now('Y:KW');const t=[...document.querySelectorAll('.sigl .wt')].find(e=>e.querySelector('.wt-n').textContent.startsWith('ω*'));
  t.querySelector('[data-wstep="1"]').click();const v=PCL.editor.comp('KW').params.v;
  const tl=[...document.querySelectorAll('.sigl .wt')].find(e=>e.querySelector('.wt-n').textContent.startsWith('Φορτίο')),inp=tl.querySelector('.wt-in');inp.value='2,5';inp.dispatchEvent(new Event('change',{bubbles:true}));
  return {now,v,kl:PCL.editor.comp('KL').params.v,inp:t.querySelector('.wt-in').value,chg:(PCL.S.sim.changes||[]).map(c=>[c.id,c.k,c.v])};});
 assert(+R.step.v===+(R.step.now+20).toPrecision(8)&&R.step.inp===R.step.v,'step +20 from the program '+JSON.stringify(R.step));
 assert(R.step.kl==='2.5'&&R.step.chg.some(c=>c[0]==='KL'&&c[2]===2.5),'typed value '+JSON.stringify(R.step));
 // 5. → πρόγραμμα t:τιμή: the changes become programs; ⟲ and the same time again gives the same ω (the change was made
//    while the worker ran: its slices end off the grid of steps, so the same within 10⁻⁴, not bit for bit; tests/js/
//    watch_cases.js checks bit for bit)
 R.prog=await p.evaluate(()=>{const s=PCL.S.sim,t=s.t,w=s.now('Y:M1');document.querySelector('#watch-panel [data-wsched]').click();
  const prog=(PCL.editor.doc.program||[]).map(e=>[e.id,e.k,e.v]),kw=PCL.editor.comp('KW').params.v,learn=PCL.editor.comp('NN1').params.learn;
  PCL.reset();PCL.S.sim.run(t);return {t,w,w2:PCL.S.sim.now('Y:M1'),prog,kw,learn,learnAfter:PCL.S.sim.project.components.find(c=>c.id==='NN1').params.learn};});
 assert(R.prog.prog.some(e=>e[0]==='NN1'&&e[1]==='learn'&&e[2]===false)&&R.prog.learn===true&&R.prog.learnAfter===false,'learn → program '+JSON.stringify(R.prog));
 assert(/:/.test(R.prog.kw)&&Math.abs(R.prog.w2-R.prog.w)<=1e-4*Math.max(1,Math.abs(R.prog.w)),'the same run again '+JSON.stringify(R.prog));
 // 6. a tile on the drawing dragged by its title, and Ctrl+Z
 const hb=await p.locator('.sigl .wt-bool .wt-h').boundingBox();
 await p.mouse.move(hb.x+20,hb.y+5);await p.mouse.down();await p.mouse.move(hb.x+60,hb.y+30,{steps:6});await p.mouse.move(hb.x+90,hb.y+50,{steps:6});await p.mouse.up();
 R.drag=await p.evaluate(()=>PCL.editor.doc.watch.tiles.find(t=>t.ctl&&t.ctl.k==='learn').at);
 await p.keyboard.press('Control+z');await p.waitForTimeout(200);
 R.undo=await p.evaluate(()=>PCL.editor.doc.watch.tiles.find(t=>t.ctl&&t.ctl.k==='learn').at);
 assert(R.drag[0]>430&&R.drag[1]>390&&R.undo[0]===430&&R.undo[1]===390,'drag and undo '+JSON.stringify([R.drag,R.undo]));
 // 7. the key S hides and shows the layer
 await p.mouse.click(260,640);await p.keyboard.press('s');await p.waitForTimeout(150);
 R.keyS=await p.evaluate(()=>[Watch.vis,PCL.editor.L.sig.hidden,document.querySelector('#watch-panel').hidden]);await p.keyboard.press('s');await p.waitForTimeout(150);
 R.keyS.push(await p.evaluate(()=>Watch.vis));assert(R.keyS.join()==='false,true,true,true','key S '+R.keyS);
 // 8. saturation: ω* far too high, the output of the limiter at +220 V; its tile from the menu of the part, and the table
 R.sat=await p.evaluate(async()=>{PCL.liveParam('KW','v','1000',true);PCL.S.sim.run(.3);Watch.openAdd('SAT1');const sug=[...document.querySelectorAll('#watch-panel .wp-sug [data-sug]')];sug[0].click();
  const t=PCL.editor.doc.watch.tiles.at(-1);Watch.update(true);const el=document.querySelector(`[data-wt="${t.id}"]`);
  document.querySelector('#watch-panel [data-wview="table"]').click();Watch.update(true);const rows=[...document.querySelectorAll('#watch-panel .wtab tbody tr')];
  const row=rows.find(r=>r.dataset.wr===t.id);return {n:sug.length,key:t.key,at:t.at,pinned:!!el?.classList.contains('wt-pin'),flag:el?.querySelector('.wt-f').textContent,sat:el?.classList.contains('sat'),rows:rows.length,rowFlag:row?.lastElementChild.textContent,rowClass:row?.className,
   cols:[...document.querySelectorAll('#watch-panel .wtab th')].map(e=>e.textContent)};});
 assert(R.sat.key==='Y:SAT1'&&R.sat.pinned&&Array.isArray(R.sat.at),'a tile next to SAT1 '+JSON.stringify(R.sat));
 assert(R.sat.sat&&/άνω όριο/.test(R.sat.flag)&&/άνω όριο/.test(R.sat.rowFlag)&&R.sat.rowClass==='sat','saturation '+JSON.stringify(R.sat));
 assert(R.sat.rows===9&&R.sat.cols.join('|')==='Σήμα|Τιμή|Μονάδα|Δείγμα|Πηγή|Κατάσταση','the table '+JSON.stringify(R.sat));
 await p.screenshot({path:OUT+'/watch_table.png'});
 await p.evaluate(()=>document.querySelector('#watch-panel [data-wview="tiles"]').click());
 // 9. ▣ next to a parameter in the parameters panel
 R.props=await p.evaluate(()=>{Watch.addFor=null;PCL.editor.select(['PI1']);PCL.renderProps();const b=document.querySelector('#props-body [data-wtile-k="Kp"]');if(!b)return null;b.click();
  const t=PCL.editor.doc.watch.tiles.at(-1),on=document.querySelector('#props-body [data-wtile-k="Kp"]').classList.contains('on');return {ctl:t.ctl,at:t.at,on,slider:!!document.querySelector(`[data-wt="${t.id}"] .wt-r`)};});
 assert(R.props&&R.props.ctl.c==='PI1'&&R.props.ctl.k==='Kp'&&R.props.on&&R.props.slider&&R.props.at,'▣ in the parameters panel '+JSON.stringify(R.props));
 // 10. the layout is in the saved file: open it again
 const file=await p.evaluate(()=>JSON.stringify(PCL.project()));
 await p.goto(base+'?tutorial=buck');await p.waitForTimeout(800);R.buck=await p.evaluate(()=>Watch.vis);
 await p.setInputFiles('#file',{name:'nn.pcl.json',mimeType:'application/json',buffer:Buffer.from(file)});await p.waitForTimeout(800);
 R.file=await p.evaluate(()=>({n:PCL.editor.doc.watch.tiles.length,vis:Watch.vis,pinned:document.querySelectorAll('.sigl .wt').length}));
 assert(R.buck===false&&R.file.n===10&&R.file.vis&&R.file.pinned===5,'the layout in the file '+JSON.stringify(R.file));
 // 11. inside a subcircuit the layer is hidden (the tiles are in the coordinates of the circuit)
 await p.goto(base+'?tutorial=sub_legs');await p.waitForTimeout(800);
 R.sub=await p.evaluate(()=>{Watch.openAdd('X1');const s=[...document.querySelectorAll('#watch-panel .wp-sug [data-sug]')];const i=s.findIndex(b=>/ρεύμα/.test(b.textContent));s[Math.max(0,i)].click();
  const t=PCL.editor.doc.watch.tiles.at(-1),top=Watch.vis;PCL.editor.opt.onedit({kind:'comp',id:'X1',x:200,y:200});const inside=[Watch.vis,PCL.editor.L.sig.hidden,document.querySelector('#watch-panel').hidden];
  document.querySelector('#crumbs [data-lvl="0"]').click();return {key:t.key,top,inside,back:Watch.vis,n:PCL.editor.doc.watch.tiles.length};});
 assert(/X1\//.test(R.sub.key)&&R.sub.top&&R.sub.inside.join()==='false,true,true'&&R.sub.back&&R.sub.n===1,'subcircuit '+JSON.stringify(R.sub));
 // 12. the vector control of the induction machine: six tiles, values from the run
 await p.goto(base+'?tutorial=im_foc');await p.waitForTimeout(1200);
 R.foc=await p.evaluate(()=>{PCL.S.sim.run(.4);Watch.update(true);return [...document.querySelectorAll('.sigl .wt,#watch-panel .wp-body .wt')].map(e=>[e.querySelector('.wt-n').textContent,e.querySelector('.wt-x')?.textContent??e.querySelector('.wt-in')?.value]);});
 assert(R.foc.length===6&&R.foc.every(([,v])=>v&&v!=='—'&&!/NaN/.test(v)),'im_foc tiles '+JSON.stringify(R.foc));
 // 13. the cost: Watch.update with every tile and a moving time, and the frames while ▶ runs with the tiles on
 R.cost=await p.evaluate(()=>{const s=PCL.S.sim;let n=0,tt=0;for(let k=0;k<60;k++){s.run(2e-3);const t0=performance.now();Watch.update(false);tt+=performance.now()-t0;n++;}return {mean:tt/n};});
 await p.goto(base+'?tutorial=nn_online');await p.waitForTimeout(1200);await p.click('#play');await p.waitForTimeout(400);
 R.frames=await p.evaluate(()=>new Promise(res=>{const d=[];let last=performance.now();const t0=last;const f=now=>{d.push(now-last);last=now;if(now-t0<2500)requestAnimationFrame(f);else{d.sort((a,b)=>a-b);res({n:d.length,p50:d[Math.floor(d.length*.5)],p95:d[Math.floor(d.length*.95)],max:d[d.length-1]});}};requestAnimationFrame(f);}));
 await p.click('#play');
 assert(R.cost.mean<2,'Watch.update per frame '+R.cost.mean);
 assert(R.frames.p50<=34&&R.frames.p95<=67,'frames with the tiles '+JSON.stringify(R.frames));
 console.log(JSON.stringify(R,null,1));
 if(errs.length){console.log('page errors',errs);throw new Error('page errors');}
 console.log('PASS watch_flow');await b.close();})().catch(e=>{console.error(e);process.exit(1);});
