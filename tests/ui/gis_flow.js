// 4.22 (ROADMAP §51, §53, §61, §63 part 2, §66, §69): in the browser.
//  1. the tutorials of the GIS substation: each one loads, runs to its end without an error and writes its card
//     (the 765 kV GIS at low voltage, VFTO, the restrikes of a disconnector, the insulation co-ordination)
//  2. the SVG charts on the core of the charts (PlotCore.svgFrame): ticks on both axes, no two labels of an axis on each
//     other (the voltage–time curve, the harmonics)
//  3. a label dragged by hand: it stays where it was put (c.lblAt), a leader to its part when far, one undo step, back to
//     its automatic place from the menu of the part
//  4. the network of a study on the map: the IEEE 14 with our places, the graticule and the scale bar, a GeoJSON out
// Usage: python run.py --no-browser --port 8775  then  node tests/ui/gis_flow.js http://127.0.0.1:8775/ [out]
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const U=process.argv[2]||'http://127.0.0.1:8775/',OUT=process.argv[3]||'.';const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1500,height:1000},acceptDownloads:true});const p=await ctx.newPage();
 const errs=[],fail=[],R={};p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>{if(m.type()==='error'&&!/favicon/.test(m.text()))errs.push(m.text());});
 const ok=(c,msg)=>{if(!c)fail.push(msg);};
 await p.goto(U);await p.evaluate(()=>localStorage.clear());await p.goto(U);await p.waitForTimeout(800);
 // labels of one SVG chart: none on another (boxes of the text on the screen)
 const overlaps=sel=>p.evaluate(sel=>{const out=[];for(const svg of document.querySelectorAll(sel)){const t=[...svg.querySelectorAll('text.tick')].map(e=>e.getBoundingClientRect()).filter(r=>r.width>0);
   let n=0;for(let i=0;i<t.length;i++)for(let j=i+1;j<t.length;j++){const a=t[i],c=t[j];if(Math.min(a.right,c.right)-Math.max(a.left,c.left)>0.5&&Math.min(a.bottom,c.bottom)-Math.max(a.top,c.top)>0.5)n++;}out.push({ticks:t.length,over:n});}return out;},sel);
 // 1. the tutorials of 4.22
 for(const [id,o,stop] of [['gis765_lv',{},null],['gis_vfto',{},null],['ds_restrike',{ts:'60m'},0.03],['insco_study',{},null]]){
  await p.evaluate(([id,o])=>window.PCL.loadTutorial(id,o),[id,o]);await p.waitForTimeout(700);
  const r=await p.evaluate(stop=>{const S=window.PCL.S;const T=stop||S.sim.stopT||S.tutMeta?.stopT||1e-6;S.sim.run(Math.min(T,S.sim.stopT||T));window.PCL.pause();window.PCL.renderTheory();return {t:S.sim.t,err:S.error};},stop);
  await p.waitForTimeout(500);const th=await p.$eval('#theory',e=>e.textContent);
  R[id]={...r,card:th.length};ok(!r.err&&th.length>200,id+': runs and writes its card '+JSON.stringify(r)+' '+th.slice(0,80));
  await p.screenshot({path:path.join(OUT,'gis_'+id+'.png')});}
 // 2. the voltage–time curve and the harmonics on the core of the charts
 await p.evaluate(()=>window.PCL.loadTutorial('voltime',{}));await p.waitForTimeout(700);
 await p.evaluate(()=>{const S=window.PCL.S;S.sim.run(S.sim.stopT||2e-5);window.PCL.pause();window.PCL.renderTheory();});await p.waitForTimeout(600);
 R.vt=await overlaps('svg[aria-label="Καμπύλη τάσης–χρόνου"]');ok(R.vt.length>=1&&R.vt.every(q=>q.ticks>=6&&q.over===0),'voltage–time: ticks without overlap '+JSON.stringify(R.vt));
 await p.evaluate(()=>window.PCL.loadTutorial('inverter',{}));await p.waitForTimeout(800);
 await p.evaluate(()=>{const S=window.PCL.S;S.sim.run(.06);window.PCL.pause();});
 await p.click('#ff-block summary');await p.waitForTimeout(300);await p.selectOption('#ff-sig','I:L1');await p.waitForTimeout(600);
 R.ff=await overlaps('.ffchart');ok(R.ff.length===1&&R.ff[0].ticks>=5&&R.ff[0].over===0,'harmonics: ticks without overlap '+JSON.stringify(R.ff));
 // 3. a label dragged by hand
 await p.evaluate(()=>window.PCL.loadTutorial('buck',{}));await p.waitForTimeout(900);await p.evaluate(()=>window.PCL.pause());
 await p.evaluate(()=>{document.querySelector('#canvas').scrollIntoView({block:'center'});window.PCL.editor.fit();});await p.waitForTimeout(400);
 const L0=await p.evaluate(()=>{const E=window.PCL.editor,cv=document.querySelector('#canvas').getBoundingClientRect();
  // a label of an inductor or a resistor well inside the drawing, with room for the drag
  const it=E.lbl.items.find(q=>{if(!['L','R'].includes(E.comp(q.id)?.type))return false;const r=document.querySelector(`.lbls[data-l="${q.id}"] .lbl`)?.getBoundingClientRect();return r&&r.left>cv.left+20&&r.right<cv.right-160&&r.top>cv.top+20&&r.bottom<cv.bottom-120;});
  const el=document.querySelector(`.lbls[data-l="${it.id}"] .lbl`).getBoundingClientRect();
  return {id:it.id,x:el.left+el.width/2,y:el.top+el.height/2,ax:it.ax,ay:it.ay,undo:E.undoStack.length};});
 await p.mouse.move(L0.x,L0.y);await p.mouse.down();await p.mouse.move(L0.x+60,L0.y+40,{steps:5});await p.mouse.move(L0.x+120,L0.y+90,{steps:5});await p.mouse.up();await p.waitForTimeout(300);
 R.drag=await p.evaluate(id=>{const E=window.PCL.editor,c=E.comp(id),it=E.lbl.items.find(q=>q.id===id),el=document.querySelector(`.lbls[data-l="${id}"] .lbl`).getBoundingClientRect();
  return {lblAt:c.lblAt||null,pinned:!!it.pinned,lead:!!document.querySelector(`.leads line[data-ld="${id}"]`),x:el.left+el.width/2,y:el.top+el.height/2,undo:E.undoStack.length,sel:[...E.sel.c]};},L0.id);
 ok(Array.isArray(R.drag.lblAt)&&R.drag.pinned,'the label keeps its place '+JSON.stringify(R.drag));
 ok(Math.abs(R.drag.x-(L0.x+120))<4&&Math.abs(R.drag.y-(L0.y+90))<4,'where it was dropped '+JSON.stringify([L0.x,L0.y,R.drag.x,R.drag.y]));
 ok(R.drag.lead,'a leader to the part');ok(R.drag.undo===L0.undo+1,'one undo step');
 await p.screenshot({path:path.join(OUT,'gis_label_drag.png')});
 await p.evaluate(()=>window.PCL.editor.svg.focus());
 await p.keyboard.press('Control+z');await p.waitForTimeout(300);
 R.undo=await p.evaluate(id=>!!window.PCL.editor.comp(id).lblAt,L0.id);ok(!R.undo,'undo: the automatic place again');
 await p.keyboard.press('Control+y');await p.waitForTimeout(300);
 R.redo=await p.evaluate(id=>!!window.PCL.editor.comp(id).lblAt,L0.id);ok(R.redo,'redo: kept by hand again');
 // the click on a label without a move selects its part
 const L1=await p.evaluate(id=>{const el=document.querySelector(`.lbls[data-l="${id}"] .lbl`).getBoundingClientRect();return {x:el.left+el.width/2,y:el.top+el.height/2};},L0.id);
 await p.mouse.click(L1.x,L1.y);await p.waitForTimeout(200);R.clickSel=await p.evaluate(()=>[...window.PCL.editor.sel.c]);ok(R.clickSel.length===1&&R.clickSel[0]===L0.id,'a click on the label selects its part '+JSON.stringify(R.clickSel));
 await p.mouse.click(L1.x,L1.y,{button:'right'});await p.waitForTimeout(200);
 const item=await p.$('#ctx button:has-text("Αυτόματη θέση ετικέτας")');ok(!!item,'the menu offers the automatic place');if(item){await item.click();await p.waitForTimeout(300);}
 R.reset=await p.evaluate(id=>({at:window.PCL.editor.comp(id).lblAt??null,lead:document.querySelectorAll('.leads line').length}),L0.id);ok(R.reset.at===null&&R.reset.lead===0,'back to the automatic place '+JSON.stringify(R.reset));
 // 4. the network of a study on the map
 await p.evaluate(()=>window.PCL.loadTutorial('pf_study',{net:'ieee14',study:'pf'}));await p.waitForTimeout(900);
 await p.click('#theory [data-study="view"]');await p.waitForSelector('#netview:not([hidden])',{timeout:60000});await p.waitForTimeout(600);
 R.nv0=await p.evaluate(()=>({map:!document.querySelector('#nv-maplab').hidden,geojson:!document.querySelector('#nv-geojson').hidden,geo:!!window.PCL.NV.v.model.v.geo}));
 ok(R.nv0.map&&R.nv0.geojson&&!R.nv0.geo,'the map is offered for IEEE 14 '+JSON.stringify(R.nv0));
 await p.check('#nv-map');await p.waitForFunction(()=>window.PCL.NV.v&&window.PCL.NV.v.model.v.geo,null,{timeout:60000});await p.waitForTimeout(600);
 R.nv1=await p.evaluate(()=>{const v=window.PCL.NV.v;return {grid:v.state.drawn?.grid,scale:v.state.drawn?.scale,routes:v.model.rt?v.model.rt.size:0,title:document.querySelector('#nv-title').textContent,layer:v.state.layer};});
 ok(R.nv1.grid>5&&R.nv1.scale&&R.nv1.routes===3&&/χάρτης/.test(R.nv1.title),'the map: graticule, scale bar, routes '+JSON.stringify(R.nv1));
 await p.screenshot({path:path.join(OUT,'gis_map.png')});
 const [dl]=await Promise.all([p.waitForEvent('download',{timeout:30000}),p.click('#nv-geojson')]);const fp=await dl.path();
 const gj=JSON.parse(fs.readFileSync(fp,'utf8'));R.gj={name:dl.suggestedFilename(),n:gj.features.length,v:gj.features.find(f=>f.properties.bus==='5')?.properties.voltage};
 ok(R.gj.n===34&&R.gj.v>0.9&&R.gj.v<1.1,'GeoJSON with the results '+JSON.stringify(R.gj));
 // a GeoJSON of the user: bus 14 elsewhere, the map follows
 gj.features=gj.features.filter(f=>f.geometry.type==='Point');gj.features.find(f=>f.properties.bus==='14').geometry.coordinates=[22.9,38.3];const tmp=path.join(OUT,'gis_user.geojson');fs.writeFileSync(tmp,JSON.stringify(gj));
 const x14=await p.evaluate(()=>window.PCL.NV.v.model.x[window.PCL.NV.v.model.ix.get('14')]);
 await p.setInputFiles('#nv-geofile',tmp);await p.waitForFunction(x=>window.PCL.NV.v&&window.PCL.NV.v.model.v.geo&&window.PCL.NV.v.model.x[window.PCL.NV.v.model.ix.get('14')]!==x,x14,{timeout:60000});await p.waitForTimeout(400);
 R.nv2=await p.evaluate(()=>({x14:window.PCL.NV.v.model.x[window.PCL.NV.v.model.ix.get('14')],info:document.querySelector('#nv-info').textContent,routes:window.PCL.NV.v.model.rt?window.PCL.NV.v.model.rt.size:0}));
 ok(R.nv2.x14>x14&&/θέσεις 14 ζυγών/.test(R.nv2.info),'the places of a GeoJSON '+JSON.stringify(R.nv2));fs.unlinkSync(tmp);
 await p.uncheck('#nv-map');await p.waitForFunction(()=>window.PCL.NV.v&&!window.PCL.NV.v.model.v.geo,null,{timeout:60000});
 R.nv3=await p.evaluate(()=>({grid:window.PCL.NV.v.state.drawn?.grid??null}));ok(R.nv3.grid===null,'back to the schematic');
 ok(!errs.length,'no page errors: '+errs.slice(0,3).join(' | '));
 console.log(JSON.stringify({ok:!fail.length,fail,R},null,1));await b.close();process.exit(fail.length?1:0);})();
