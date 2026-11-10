// Subcircuits in the studio (3.17, ROADMAP §9): from a selection, open, public parameter, leave, undo, save and
// reopen, a second instance from the palette, no recursion, expand back. Needs Node + Playwright.
// Usage: python run.py --no-browser --port 8765  then  node tests/ui/subcircuit_flow.js http://127.0.0.1:8765/ <out-dir>
const {chromium}=require('playwright');const fs=require('fs');const OUT=process.argv[3]||'.';
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1500,height:1000},acceptDownloads:true});const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(String(e.stack||e)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
 const base=process.argv[2];await p.goto(base);await p.evaluate(()=>localStorage.clear());await p.goto(base+'?tutorial=buck_vloop');await p.waitForTimeout(900);
 const free=async()=>p.evaluate(()=>{const r=PCL.editor.svg.getBoundingClientRect();return [r.left+r.width*.82,r.top+r.height*.8];});
 const scr=async(x,y)=>p.evaluate(([x,y])=>{const s=PCL.editor.svg,pt=s.createSVGPoint();pt.x=x;pt.y=y;const q=pt.matrixTransform(s.getScreenCTM());return [q.x,q.y];},[x,y]);
 // the same run every time: from t = 0 for 6 ms, on the whole project the app simulates
 const vo=()=>p.evaluate(()=>{PCL.reset();PCL.S.sim.run(0.006);const s=PCL.S.sim;return {v:s.now('V:C1'),il:s.now(s.chIndex.has('I:L1')?'I:L1':'I:X1/L1'),steps:s.steps};});
 const R={};R.v0=await vo();
 if(!(await p.evaluate(()=>PCL.scope.channels().some(c=>c.key==='I:L1'))))await p.evaluate(()=>PCL.addProbe('I:L1'));
 // 1. subcircuit from the selection (switch, diode, inductor and their junction), Ctrl+G
 await p.evaluate(()=>{PCL.editor.select(['S1','D1','L1','J1'],[]);PCL.editor.svg.focus();});await p.keyboard.press('Control+g');await p.waitForTimeout(300);
 R.made=await p.evaluate(()=>{const d=PCL.editor.doc,x=d.components.find(c=>c.type==='SUB');return {inst:x?.id,def:x?.params.def,ports:x?.params.$ports?.map(q=>q.name+':'+q.kind),
  defs:Object.keys(d.subcircuits||{}),left:['S1','D1','L1','J1'].filter(id=>d.components.some(c=>c.id===id)),chan:PCL.scope.channels().map(c=>c.key)};});
 R.v1=await vo();
 await p.screenshot({path:OUT+'/sub_made.png'});
 // 2. open it (double click), live values of this instance, promote L of L1 to a public parameter
 const x1=await p.evaluate(()=>{const c=PCL.editor.comp('X1');return [c.x,c.y];});
 await p.mouse.dblclick(...await scr(x1[0],x1[1]));await p.waitForTimeout(400);
 R.inside={crumbs:await p.locator('#crumbs').isVisible(),pfx:await p.evaluate(()=>PCL.S.pfx),comps:await p.evaluate(()=>PCL.editor.doc.components.map(c=>c.id).sort())};
 R.liveL=await p.evaluate(()=>{PCL.S.sim.run(1e-4);return document.querySelector('.livel [data-l="L1"] .lv')?.textContent||'';});
 await p.evaluate(()=>PCL.editor.select(['L1'],[]));await p.waitForTimeout(150);
 await p.click('#props-body [data-pub-k="L"]');await p.waitForTimeout(150);
 R.pub=await p.evaluate(()=>JSON.parse(JSON.stringify(PCL.S.top.subcircuits[PCL.S.nav[0].name].params)));
 await p.screenshot({path:OUT+'/sub_inside.png'});
 // 3. leave by the bar above the schematic; the instance shows the public parameter, change it for this instance
 await p.click('#crumbs [data-lvl="0"]');await p.waitForTimeout(300);
 R.top={crumbs:await p.locator('#crumbs').isVisible(),nav:await p.evaluate(()=>PCL.S.nav.length)};
 await p.evaluate(()=>PCL.editor.select(['X1'],[]));await p.waitForTimeout(150);
 R.field=await p.locator('#props-body [data-k="L"]').count();
 await p.fill('#props-body [data-k="L"]','200u');await p.press('#props-body [data-k="L"]','Enter');await p.waitForTimeout(200);
 R.Lsim=await p.evaluate(()=>PCL.S.sim.net.compInfo.get('X1/L1')?.main?.L);
 // 4. undo: the value, then the whole visit inside (the public parameter) in one step
 await p.evaluate(()=>PCL.editor.svg.focus());await p.keyboard.press('Control+z');await p.waitForTimeout(150);
 R.undo1=await p.evaluate(()=>PCL.editor.comp('X1').params.L);await p.keyboard.press('Control+z');await p.waitForTimeout(150);
 R.undo2=await p.evaluate(()=>(PCL.editor.doc.subcircuits[PCL.editor.comp('X1').params.def].params||[]).length);
 await p.keyboard.press('Control+y');await p.waitForTimeout(150);R.redo=await p.evaluate(()=>(PCL.editor.doc.subcircuits[PCL.editor.comp('X1').params.def].params||[]).length);
 // 5. save and reopen
 const [dl]=await Promise.all([p.waitForEvent('download'),p.click('#save')]);const file=OUT+'/sub_saved.pcl.json';await dl.saveAs(file);const saved=JSON.parse(fs.readFileSync(file,'utf8'));
 await p.goto(base+'?tutorial=buck');await p.waitForTimeout(500);
 const [fc]=await Promise.all([p.waitForEvent('filechooser'),p.click('#open')]);await fc.setFiles(file);await p.waitForTimeout(600);
 R.reopen={defs:Object.keys(saved.subcircuits||{}).length,inst:await p.evaluate(()=>!!PCL.editor.comp('X1')),wires:await p.evaluate(()=>PCL.editor.doc.wires.filter(w=>w.a.c==='X1'||w.b.c==='X1').length)};
 R.v2=await vo();
 // 6. a second instance from the palette, and no instance of a definition inside itself
 const def=await p.evaluate(()=>PCL.editor.comp('X1').params.def);
 await p.click(`.pal-item[data-part="SUB:${def}"]`);await p.mouse.click(...await free());await p.waitForTimeout(200);
 R.second=await p.evaluate(()=>{const c=PCL.editor.doc.components.filter(k=>k.type==='SUB');return c.map(k=>k.id+':'+Object.keys(window.Parts.pinsOf(k)).length);});
 await p.mouse.dblclick(...await scr(x1[0],x1[1]));await p.waitForTimeout(300);const n0=await p.evaluate(()=>PCL.editor.doc.components.length);
 await p.click(`.pal-item[data-part="SUB:${def}"]`);await p.mouse.click(...await free());await p.waitForTimeout(200);
 R.selfRefused=await p.evaluate(n0=>PCL.editor.doc.components.length===n0&&/δεν μπαίνει/.test(document.querySelector('#notice').textContent),n0);
 await p.keyboard.press('Escape');await p.click('#crumbs [data-lvl="0"]');await p.waitForTimeout(200);
 // 7. expand back to an open circuit (Ctrl+Shift+G): the same results as the drawn circuit
 await p.evaluate(()=>{PCL.editor.deleteSel&&PCL.editor.select([PCL.editor.doc.components.filter(k=>k.type==='SUB').pop().id],[]);PCL.editor.deleteSel();PCL.editor.select(['X1'],[]);PCL.editor.svg.focus();});
 await p.keyboard.press('Control+Shift+G');await p.waitForTimeout(300);
 R.expanded=await p.evaluate(()=>({sub:PCL.editor.doc.components.filter(c=>c.type==='SUB').length,L:PCL.editor.doc.components.filter(c=>c.type==='L').map(c=>c.id)}));
 R.v3=await p.evaluate(()=>{PCL.reset();PCL.S.sim.run(0.006);const s=PCL.S.sim,L=PCL.editor.doc.components.find(c=>c.type==='L').id;return {v:s.now('V:C1'),il:s.now('I:'+L),steps:s.steps};});
 await p.screenshot({path:OUT+'/sub_expanded.png'});
 // 8. the tutorial: N instances of one leg, the theory card against the simulation, the phase of one instance only
 await p.goto(base+'?tutorial=sub_legs');await p.waitForTimeout(900);
 R.tut=await p.evaluate(()=>{PCL.S.sim.run(4e-3);PCL.renderTheory();const t=document.querySelector('#theory').textContent;
  return {legs:PCL.editor.doc.components.filter(c=>c.type==='SUB').length,pins:Object.keys(window.Parts.pinsOf(PCL.editor.comp('X2'))),theory:/Δi_Σ/.test(t)&&/Προσομοίωση/.test(t),
   sum:PCL.S.sim.lastPeriod('Y:AM1').max-PCL.S.sim.lastPeriod('Y:AM1').min};});
 await p.evaluate(()=>PCL.editor.select(['X2'],[]));await p.waitForTimeout(150);R.tut.phaseField=await p.locator('#props-body [data-k="phase"]').inputValue();
 await p.screenshot({path:OUT+'/sub_tutorial.png'});
 console.log(JSON.stringify(R,null,1));console.log('ERR',JSON.stringify(errs.slice(0,5)));
 const near=(a,b,tol=1e-9)=>Math.abs(a-b)<=tol*Math.max(1,Math.abs(b));
 const ok=R.made.inst==='X1'&&R.made.ports.length===3&&!R.made.left.length&&R.made.chan.includes('I:X1/L1')&&!R.made.chan.includes('I:L1')
  &&near(R.v1.v,R.v0.v)&&near(R.v1.il,R.v0.il)&&R.v1.steps===R.v0.steps
  &&R.inside.crumbs&&R.inside.pfx==='X1/'&&R.inside.comps.includes('L1')&&R.inside.comps.includes('P1')&&/A/.test(R.liveL)
  &&R.pub.length===1&&R.pub[0].k==='L'&&R.top.nav===0&&!R.top.crumbs&&R.field===1&&near(R.Lsim,200e-6,1e-12)
  &&R.undo1!=='200u'&&R.undo1!==2e-4&&R.undo2===0&&R.redo===1
  &&R.reopen.defs===1&&R.reopen.inst&&R.reopen.wires===3&&near(R.v2.v,R.v0.v)
  &&R.second.length===2&&R.second.every(x=>x.endsWith(':3'))&&R.selfRefused
  &&R.expanded.sub===0&&R.expanded.L.length===1&&near(R.v3.v,R.v0.v)
  &&R.tut.legs===3&&R.tut.pins.join()==='in,out'&&R.tut.theory&&Math.abs(R.tut.sum-.8)<.01&&R.tut.phaseField==='120'&&!errs.length;
 console.log(ok?'PASS':'FAIL');await b.close();process.exit(ok?0:1);})().catch(e=>{console.error('FAILED',e);process.exit(1);});
