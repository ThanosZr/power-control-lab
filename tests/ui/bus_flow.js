// Buses and vectors in the studio (3.18, ROADMAP §3): the tutorial drawn with buses (thick wires with their width, bus
// pins, the dq loop on the theory), a vector block's channels and live values, a part switched to its bus pin, an
// electrical bus, wire names that join (and an older file that opens the same), a width that does not fit, Ctrl+G across
// a bus. Needs Node + Playwright.
// Usage: python run.py --no-browser --port 8765  then  node tests/ui/bus_flow.js http://127.0.0.1:8765/ <out-dir>
const {chromium}=require('playwright');const fs=require('fs');const OUT=process.argv[3]||'.';
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1500,height:1000}});const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(String(e.stack||e)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
 const base=process.argv[2];await p.goto(base);await p.evaluate(()=>localStorage.clear());await p.goto(base+'?tutorial=bus_dq');await p.waitForTimeout(1200);
 const R={};
 // 1. the tutorial: bus wires with their width, bus pins, the theory card valid
 R.draw=await p.evaluate(()=>({bus:document.querySelectorAll('.wire.bus').length,widths:[...new Set([...document.querySelectorAll('.bwidth')].map(t=>t.textContent))].sort(),
  pins:document.querySelectorAll('.pin.buspin').length,stale:/δεν είναι πια/.test(document.querySelector('#theory')?.innerText||'')}));
 // 2. run 40 ms: i_d and i_q on their references, a vector block shows its elements, its channels are in the list
 R.run=await p.evaluate(()=>{PCL.reset();PCL.S.sim.run(0.04);PCL.editor.updateLive();const s=PCL.S.sim;
  return {id:s.now('Y:PK'),iq:s.now('Y:PK:q'),vec:Object.keys(s.net.vec).length,live:document.querySelector('.livel [data-l="SV"] .lv')?.textContent||'',
   opt:[...document.querySelectorAll('#add-signal option')].map(o=>o.value).filter(v=>/^Y:KP\[\d\]$/.test(v))};});
 await p.evaluate(()=>PCL.addProbe('Y:SV[2]'));R.chan=await p.evaluate(()=>PCL.scope.channels().find(c=>c.key==='Y:SV[2]')?.label||'');
 await p.screenshot({path:OUT+'/bus_tutorial.png'});
 // 3. a live change of the vector reference (same number of elements): the loop follows without a rebuild
 R.liveRef=await p.evaluate(()=>{const s0=PCL.S.sim;PCL.S.sim.setBlock('IR[1]',{sched:[[0,6]]});s0.run(0.01);return {same:PCL.S.sim===s0,id:s0.now('Y:PK')};});
 // 4. the line inside: an electrical bus into three conductors, the port of width 3
 const xl=await p.evaluate(()=>{const c=PCL.editor.comp('XL');return [c.x,c.y];});
 const scr=async(x,y)=>p.evaluate(([x,y])=>{const s=PCL.editor.svg,pt=s.createSVGPoint();pt.x=x;pt.y=y;const q=pt.matrixTransform(s.getScreenCTM());return [q.x,q.y];},[x,y]);
 await p.mouse.dblclick(...await scr(xl[0],xl[1]));await p.waitForTimeout(400);
 R.inside={pfx:await p.evaluate(()=>PCL.S.pfx),bus:await p.evaluate(()=>[...document.querySelectorAll('.wire.bus')].map(g=>g.querySelector('.bwidth')?.textContent).sort().join(','))};
 await p.screenshot({path:OUT+'/bus_inside.png'});
 await p.click('#crumbs [data-lvl="0"]');await p.waitForTimeout(300);
 // 5. from scratch: a three-phase source switched to its bus pin (the wires at a, b, c go), an electrical bus and three
 //    resistors in star; then the same with named wires that join; then a width that does not fit
 await p.goto(base+'?tutorial=empty');await p.waitForTimeout(700);
 // (without the PWM of the empty circuit, so the base period is the 20 ms of the source)
 R.scratch=await p.evaluate(()=>{const E=PCL.editor;E.doc.components=E.doc.components.filter(c=>c.type!=='PWM');const V=E.addPart('VAC3',100,200);E.setParams(V.id,{Vpk:100,f:50});
  const R1=E.addPart('R',300,180),R2=E.addPart('R',300,200),R3=E.addPart('R',300,220),J=E.addPart('JUNC',400,200),B=E.addPart('EBUS',200,200),G=E.doc.components.find(c=>c.type==='GND');
  const w=(a,ap,b2,bp)=>{E.doc.wires.push({id:E.newId('w'),a:{c:a,p:ap},b:{c:b2,p:bp},pts:[]});};
  w(V.id,'a',R1.id,'a');w(V.id,'b',R2.id,'a');w(V.id,'c',R3.id,'a');for(const r of [R1,R2,R3])w(r.id,'b',J.id,'j');w(V.id,'n',G.id,'g');E.render();E.changed('struct');
  const before=E.doc.wires.length;E.setParams(V.id,{conn:'bus'});const after=E.doc.wires.length;
  w(V.id,'abc',B.id,'bus');w(B.id,'a',R1.id,'a');w(B.id,'b',R2.id,'a');w(B.id,'c',R3.id,'a');E.render();E.changed('struct');
  return {before,after,pins:Object.keys(window.Parts.pinsOf(E.comp(V.id))).join(','),R1:R1.id,V:V.id};});
 await p.waitForTimeout(300);
 R.scratch.run=await p.evaluate(id=>{PCL.reset();PCL.S.sim.run(0.04);const p=PCL.S.sim.lastPeriod('I:'+id);return {err:PCL.S.error,amp:p?(p.max-p.min)/2:null};},R.scratch.R1);
 R.scratch.bus=await p.evaluate(()=>document.querySelectorAll('.wire.bus').length);
 // wire names: the star point split in two, joined by naming two of its wires «N» (wire panel)
 R.named=await p.evaluate(()=>{const E=PCL.editor,ws=E.doc.wires.filter(w=>w.b.c.startsWith('J')&&w.a.c.startsWith('R'));const J2=E.addPart('JUNC',420,260);
  ws[2].b={c:J2.id,p:'j'};E.render();E.changed('struct');PCL.reset();PCL.S.sim.run(0.02);const apart=PCL.S.sim.net.warnings.length;return {apart,w1:ws[0].id,w3:ws[2].id};});
 for(const id of [R.named.w1,R.named.w3]){await p.evaluate(id=>{PCL.editor.select([],[id]);},id);await p.waitForTimeout(150);
  await p.fill('#props-body [data-wname]','N');await p.press('#props-body [data-wname]','Enter');await p.waitForTimeout(150);}
 R.named.link=await p.evaluate(()=>PCL.editor.doc.wires.filter(w=>w.name==='N').length);R.named.version=await p.evaluate(()=>PCL.editor.doc.version);
 R.named.mark=await p.evaluate(()=>document.querySelectorAll('.wname.link').length);
 R.named.run=await p.evaluate(id=>{PCL.reset();PCL.S.sim.run(0.04);const q=PCL.S.sim.lastPeriod('I:'+id);return {warn:PCL.S.sim.net.warnings.length,amp:q?(q.max-q.min)/2:null};},R.scratch.R1);
 // a bus into a scalar input: an error with the two pins, no hidden conversion
 R.mismatch=await p.evaluate(()=>{const E=PCL.editor,K=E.addPart('CONST',100,400),D=E.addPart('DISP',220,400);E.setParams(K.id,{v:'1; 2'});
  E.doc.wires.push({id:E.newId('w'),a:{c:K.id,p:'y'},b:{c:D.id,p:'u'},pts:[]});E.render();E.changed('struct');return {err:PCL.S.error||'',notice:document.querySelector('#notice')?.innerText||''};});
 // 6. Ctrl+G on the resistors and the bus part: the port that crosses the bus wire gets width 3 and a bus pin
 await p.evaluate(()=>{const E=PCL.editor;E.doc.components=E.doc.components.filter(c=>c.type!=='CONST'&&c.type!=='DISP');E.doc.wires=E.doc.wires.filter(w=>E.comp(w.a.c)&&E.comp(w.b.c));E.render();E.changed('struct');
  E.select(E.doc.components.filter(c=>['R','EBUS','JUNC'].includes(c.type)).map(c=>c.id),[]);E.svg.focus();});
 await p.keyboard.press('Control+g');await p.waitForTimeout(400);
 R.group=await p.evaluate(()=>{const E=PCL.editor,x=E.doc.components.find(c=>c.type==='SUB');return {ports:(x?.params.$ports||[]).map(q=>q.name+':'+(q.w||1)),buspin:document.querySelectorAll('.pin.buspin').length,err:PCL.S.error};});
 R.group.run=await p.evaluate(()=>{PCL.reset();PCL.S.sim.run(0.04);const k=[...PCL.S.sim.chIndex.keys()].find(k=>/^I:X\d+\/R/.test(k));const q=PCL.S.sim.lastPeriod(k);return {k,amp:q?(q.max-q.min)/2:null};});
 await p.screenshot({path:OUT+'/bus_scratch.png'});
 // 7. an older file (no version) where «v» labels two different nodes: it opens the same, the second becomes «v·2»
 const oldFile=OUT+'/bus_old.pcl.json';fs.writeFileSync(oldFile,JSON.stringify({components:[{id:'V1',type:'VDC',x:100,y:200,params:{V:10}},{id:'R1',type:'R',x:200,y:160,params:{R:10}},
  {id:'V2',type:'VDC',x:300,y:200,params:{V:4}},{id:'R2',type:'R',x:400,y:160,params:{R:2}},{id:'G1',type:'GND',x:250,y:300,params:{}}],
  wires:[{id:'w1',a:{c:'V1',p:'p'},b:{c:'R1',p:'a'},pts:[],name:'v'},{id:'w2',a:{c:'R1',p:'b'},b:{c:'G1',p:'g'},pts:[]},{id:'w3',a:{c:'V1',p:'n'},b:{c:'G1',p:'g'},pts:[]},
   {id:'w4',a:{c:'V2',p:'p'},b:{c:'R2',p:'a'},pts:[],name:'v'},{id:'w5',a:{c:'R2',p:'b'},b:{c:'G1',p:'g'},pts:[]},{id:'w6',a:{c:'V2',p:'n'},b:{c:'G1',p:'g'},pts:[]}]}));
 const [fc]=await Promise.all([p.waitForEvent('filechooser'),p.click('#open')]);await fc.setFiles(oldFile);await p.waitForTimeout(700);
 R.old=await p.evaluate(()=>{PCL.reset();PCL.S.sim.run(1e-4);return {version:PCL.editor.doc.version,names:PCL.editor.doc.wires.map(w=>w.name).filter(Boolean).sort(),
  notice:document.querySelector('#notice')?.innerText||'',i:[PCL.S.sim.now('I:R1'),PCL.S.sim.now('I:R2')],err:PCL.S.error};});
 console.log(JSON.stringify(R,null,1));console.log('ERR',JSON.stringify(errs.slice(0,5)));
 const near=(a,b,tol)=>Math.abs(a-b)<=tol;
 const ok=R.draw.bus>=8&&R.draw.widths.join()==='2,3'&&R.draw.pins>=6&&!R.draw.stale
  &&near(R.run.id,10,.02)&&near(R.run.iq,5,.02)&&R.run.vec===9&&/^y = \[/.test(R.run.live)&&R.run.opt.length===2&&/\[2\]/.test(R.chan)
  &&R.liveRef.same&&near(R.liveRef.id,6,.1)
  &&R.inside.pfx==='XL/'&&R.inside.bus.split(',').includes('3')
  &&R.scratch.before-R.scratch.after===3&&R.scratch.pins==='abc,n'&&!R.scratch.run.err&&near(R.scratch.run.amp,100/10,.01)&&R.scratch.bus>=1
  &&R.named.link===2&&R.named.mark===2&&R.named.version===3&&near(R.named.run.amp,10,.01)
  &&R.old.version===3&&R.old.names.join()==='v,v·2'&&/v·2/.test(R.old.notice)&&!R.old.err&&near(R.old.i[0],1,1e-9)&&near(R.old.i[1],2,1e-9)
  &&/πλάτος 2/.test(R.mismatch.err)&&/πλάτος 2/.test(R.mismatch.notice)
  &&R.group.ports.includes('e1:3')&&R.group.buspin>=2&&!R.group.err&&near(R.group.run.amp,10,.01)&&!errs.length;
 console.log(ok?'PASS':'FAIL');await b.close();process.exit(ok?0:1);})().catch(e=>{console.error('FAILED',e);process.exit(1);});
