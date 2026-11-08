// 3.7: parameters panel (collapsible, sections), pinned live parameters, wire tool with free ends,
// parts and probes that clip onto wires, options for unconnected and floating parts.
// Usage: node wiring_flow.js http://127.0.0.1:8765/ <outdir>
const {chromium}=require('playwright');const OUT=process.argv[3]||'.';
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:1000}});const errs=[],fail=[];
 p.on('pageerror',e=>errs.push(String(e.stack||e)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
 const ok=(c,m)=>{if(!c)fail.push(m);console.log((c?'ok   ':'FAIL ')+m);};
 await p.goto(process.argv[2]);await p.evaluate(()=>localStorage.clear());await p.goto(process.argv[2]+'?tutorial=buck');await p.waitForTimeout(1200);
 const scr=async(x,y)=>p.evaluate(([x,y])=>{const s=PCL.editor.svg,pt=s.createSVGPoint();pt.x=x;pt.y=y;const q=pt.matrixTransform(s.getScreenCTM());return [q.x,q.y];},[x,y]);
 // 1) the panel is open and shows the circuit, then the selected part with its sections
 ok(await p.evaluate(()=>!document.querySelector('#props').classList.contains('collapsed')),'parameters panel open by default');
 ok(/Συνδέσεις/.test(await p.$eval('#props-body',e=>e.textContent)),'circuit view: connections section');
 const l1=await p.evaluate(()=>{const c=PCL.editor.comp('L1');return [c.x,c.y];});await p.mouse.click(...await scr(...l1));await p.waitForTimeout(200);
 ok(await p.evaluate(()=>!!document.querySelector('#props-body details[data-sec="p-main"] [data-k="L"]')),'L1 selected: main section with L');
 ok(await p.evaluate(()=>!!document.querySelector('#props-body details[data-sec="p-init"]')),'initial conditions in their own section');
 await p.fill('#props-body [data-k="L"]','150u');await p.press('#props-body [data-k="L"]','Enter');await p.waitForTimeout(200);
 ok(await p.evaluate(()=>Math.abs(PCL.editor.comp('L1').params.L-150e-6)<1e-12&&Math.abs(PCL.S.sim.net.compInfo.get('L1').main.L-150e-6)<1e-12),'L changed from the panel, in the solver too');
 await p.screenshot({path:OUT+'/w1_panel.png'});
 // 2) pin L to the live parameters: slider and exact value, applied while the simulation runs
 await p.click('#props-body [data-pin-k="L"]');await p.waitForTimeout(200);
 ok(await p.evaluate(()=>(PCL.editor.comp('L1').live||[]).includes('L')&&!!document.querySelector('#live-controls [data-pr="L1|L"]')),'📌 puts L in the live panel');
 await p.evaluate(()=>{PCL.S.sim.run(2e-4);});
 const t0=await p.evaluate(()=>PCL.S.sim.t);
 await p.evaluate(()=>{const r=document.querySelector('#live-controls [data-pr="L1|L"]');r.value='1000';r.dispatchEvent(new Event('input'));r.dispatchEvent(new Event('change'));});await p.waitForTimeout(200);
 const lv=await p.evaluate(()=>({L:PCL.editor.comp('L1').params.L,simL:PCL.S.sim.net.compInfo.get('L1').main.L,t:PCL.S.sim.t,ch:(PCL.S.sim.changes||[]).length}));
 ok(Math.abs(lv.L-1.5e-3)<1e-9&&Math.abs(lv.simL-1.5e-3)<1e-9,'slider at the top = 10·base: '+lv.L);ok(lv.t>=t0&&lv.ch>=1,'time kept, change marked on the scope');
 await p.fill('#live-controls [data-pv="L1|L"]','100u');await p.press('#live-controls [data-pv="L1|L"]','Enter');await p.waitForTimeout(150);
 ok(Math.abs(await p.evaluate(()=>PCL.editor.comp('L1').params.L)-100e-6)<1e-12,'exact value typed in the live panel');
 await p.evaluate(()=>PCL.editor.svg.focus());await p.keyboard.press('Control+z');await p.waitForTimeout(100);
 ok(Math.abs(await p.evaluate(()=>PCL.editor.comp('L1').params.L)-1.5e-3)<1e-9,'undo of a live change');
 await p.screenshot({path:OUT+'/w2_live.png'});
 // 3) the panel collapses to a strip (I) and comes back
 await p.evaluate(()=>{PCL.editor.select([],[]);PCL.editor.svg.focus();});await p.keyboard.press('i');await p.waitForTimeout(150);
 ok(await p.evaluate(()=>document.querySelector('#props').classList.contains('collapsed')&&document.querySelector('#props').getBoundingClientRect().width<40),'collapsed to a strip');
 await p.click('#props-tab');await p.waitForTimeout(150);ok(await p.evaluate(()=>!document.querySelector('#props').classList.contains('collapsed')),'opened again from the strip');
 // 4) wire tool on an empty circuit: a wire from a pin with a free end, then the end dragged onto a pin
 await p.evaluate(()=>{PCL.loadTutorial('empty');const e=PCL.editor;e.addPart('VDC',100,200);e.addPart('R',300,120);e.addPart('GND',100,300);e.fit();});await p.waitForTimeout(300);
 await p.click('#wire-tool');ok(await p.evaluate(()=>PCL.editor.wireTool),'wire tool on');
 const vp=await p.evaluate(()=>PCL.editor.pin('V1','p'));await p.mouse.click(...await scr(...vp));
 await p.mouse.move(...await scr(vp[0],vp[1]-60),{steps:4});await p.mouse.click(...await scr(vp[0],vp[1]-60));
 await p.mouse.move(...await scr(vp[0]+120,vp[1]-60),{steps:4});await p.mouse.dblclick(...await scr(vp[0]+120,vp[1]-60));await p.waitForTimeout(200);
 const fe=await p.evaluate(()=>{const e=PCL.editor;const j=e.doc.components.find(c=>c.type==='JUNC'&&e.wiresAt(c.id).length===1);return j?{id:j.id,x:j.x,y:j.y,w:e.wiresAt(j.id)[0]}:null;});
 ok(fe&&fe.x===vp[0]+120&&fe.y===vp[1]-60&&fe.w.a.c==='V1','free end where the double click was: '+JSON.stringify(fe&&[fe.x,fe.y]));
 await p.keyboard.press('Escape');ok(await p.evaluate(()=>!PCL.editor.wireTool),'Esc leaves the wire tool');
 const ra=await p.evaluate(()=>PCL.editor.pin('R1','a'));
 await p.mouse.move(...await scr(fe.x,fe.y));await p.mouse.down();await p.mouse.move(...await scr(fe.x+10,fe.y+10),{steps:3});await p.mouse.move(...await scr(...ra),{steps:8});await p.mouse.up();await p.waitForTimeout(200);
 const mg=await p.evaluate(id=>{const e=PCL.editor;return {gone:!e.comp(id),w:e.doc.wires.find(w=>(w.a.c==='V1'&&w.a.p==='p')||(w.b.c==='V1'&&w.b.p==='p'))};},fe.id);
 ok(mg.gone&&mg.w&&((mg.w.b.c==='R1'&&mg.w.b.p==='a')||(mg.w.a.c==='R1'&&mg.w.a.p==='a')),'free end dragged onto R1.a: connected');
 // a wire from R1.b to ground drawn by dragging, then a current probe dropped on it goes in series, a voltage probe clips on the first wire
 await p.evaluate(()=>{const e=PCL.editor;const rb=e.pin('R1','b'),g=e.pin('G1','g')||e.pin('G','g');void rb;void g;});
 const gid=await p.evaluate(()=>PCL.editor.doc.components.find(c=>c.type==='GND').id);
 await p.evaluate(gid=>{const e=PCL.editor;e.remember();e.doc.wires.push({id:e.newId('w'),a:{c:'R1',p:'b'},b:{c:gid,p:'g'},pts:[]},{id:e.newId('w'),a:{c:'V1',p:'n'},b:{c:gid,p:'g'},pts:[]});for(const w of e.doc.wires)e.route(w);e.render();e.changed('struct');},gid);
 const seg=await p.evaluate(()=>{const e=PCL.editor;const w=e.doc.wires.find(w=>w.a.c==='V1'&&w.a.p==='p'||w.b.c==='V1'&&w.b.p==='p');const pts=e.wirePts(w);for(let i=1;i<pts.length;i++){const [ax,ay]=pts[i-1],[bx,by]=pts[i];if(ay===by&&Math.abs(bx-ax)>=80)return {y:ay,x:Math.round((ax+bx)/20)*10};}return null;});
 ok(!!seg,'a horizontal segment to clip onto: '+JSON.stringify(seg));
 const nw0=await p.evaluate(()=>PCL.editor.doc.wires.length);
 await p.evaluate(()=>PCL.editor.beginPlace('IP'));await p.mouse.move(...await scr(seg.x,seg.y),{steps:3});await p.mouse.click(...await scr(seg.x,seg.y));await p.waitForTimeout(200);
 const ins=await p.evaluate(()=>{const e=PCL.editor;const ip=e.doc.components.find(c=>c.type==='IP');return ip?{id:ip.id,a:e.wiresAt(ip.id,'a').length,b:e.wiresAt(ip.id,'b').length,n:e.doc.wires.length}:null;});
 ok(ins&&ins.a===1&&ins.b===1&&ins.n===nw0+1,'current probe dropped on the wire: in series '+JSON.stringify(ins));
 const vseg=await p.evaluate(()=>{const e=PCL.editor;const w=e.doc.wires.find(w=>w.a.c==='R1'&&w.a.p==='b'||w.b.c==='R1'&&w.b.p==='b');const pts=e.wirePts(w);for(let i=1;i<pts.length;i++){const [ax,ay]=pts[i-1],[bx,by]=pts[i];if(Math.abs(bx-ax)+Math.abs(by-ay)>=40)return ay===by?[Math.round((ax+bx)/20)*10,ay]:[ax,Math.round((ay+by)/20)*10];}return null;});
 await p.evaluate(()=>PCL.editor.beginPlace('VP'));await p.mouse.move(...await scr(vseg[0],vseg[1]-20),{steps:3});await p.mouse.click(...await scr(vseg[0],vseg[1]-20));await p.waitForTimeout(200);
 const vpc=await p.evaluate(()=>{const e=PCL.editor;const v=e.doc.components.find(c=>c.type==='VP');return v?{id:v.id,w:e.wiresAt(v.id,'p').length}:null;});
 ok(vpc&&vpc.w===2,'voltage probe clipped onto the wire R1.b–ground (a T on its pin)');
 await p.screenshot({path:OUT+'/w3_wired.png'});
 // 5) the probes measure: I = V/R through the clamp, the probe on the ground side reads 0
 const ms=await p.evaluate(([ip,vp])=>{PCL.reset();PCL.S.sim.run(2e-3);return {i:PCL.S.sim.now('Y:'+ip),v:PCL.S.sim.now('Y:'+vp),warn:PCL.S.sim.net.warnings,skipped:PCL.S.sim.net.diag.skipped};},[ins.id,vpc.id]);
 ok(Math.abs(ms.i-12/10)<1e-6,'current probe reads V/R = 1.2 A: '+ms.i);ok(Math.abs(ms.v)<1e-6,'voltage probe on the ground wire reads 0: '+ms.v);
 ok(!ms.warn.length&&!ms.skipped.length,'no warnings: '+JSON.stringify(ms.warn));
 // 6) an unconnected part: left out with a warning, an error when asked, and back
 await p.evaluate(()=>{PCL.editor.addPart('R',600,400);PCL.editor.select([],[]);});await p.waitForTimeout(200);await p.waitForTimeout(150);
 const un=await p.evaluate(()=>({sk:PCL.S.sim.net.diag.skipped,warn:PCL.S.sim.net.warnings,panel:document.querySelector('#props-body').textContent}));
 ok(un.sk.length===1&&un.sk[0].why==='unconn'&&/Ασύνδετα στοιχεία, εκτός επίλυσης/.test(un.warn.join(' '))&&/χωρίς σύνδεση, εκτός επίλυσης/.test(un.panel),'unconnected R left out, warned, listed in the panel');
 ok(await p.evaluate(()=>document.querySelector('[data-c="R2"]').classList.contains('skipped')),'drawn grey on the schematic');
 await p.click('#props-body details[data-sec="c-solve"] summary');await p.selectOption('#props-body [data-solve="unconn"]','error');await p.waitForTimeout(200);
 ok(/ασύνδετα στοιχεία: R2/.test(await p.evaluate(()=>PCL.S.error||'')),'error mode stops with the list');
 await p.selectOption('#props-body [data-solve="unconn"]','ignore');await p.waitForTimeout(200);
 const ig=await p.evaluate(()=>({e:PCL.S.error,w:PCL.S.sim.net.warnings,solve:PCL.editor.doc.solve}));ok(!ig.e&&!ig.w.length&&ig.solve.unconn==='ignore','ignore mode: silent, saved with the circuit');
 await p.screenshot({path:OUT+'/w4_options.png'});
 console.log('ERR',JSON.stringify(errs.slice(0,5)));console.log(fail.length?'FAIL '+fail.join(' | '):'PASS');await b.close();process.exit(fail.length||errs.length?1:0);})().catch(e=>{console.error('FAILED',e);process.exit(1);});
