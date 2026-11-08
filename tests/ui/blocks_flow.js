// Browser check of the 3.0 signal blocks: drawing signal wires, the signal/electrical rule, pins that
// follow parameters, algebraic loops, the two 3.0 tutorials, their theory cards and the questions.
// Usage: python run.py --no-browser --port 8765  then  node tests/ui/blocks_flow.js http://127.0.0.1:8765/
const {chromium}=require('playwright');
(async()=>{const U=process.argv[2]||'http://127.0.0.1:8765/';const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:1000}});
 const errs=[],fail=[];p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
 const ok=(c,msg)=>{if(!c)fail.push(msg);};
 await p.goto(U);await p.evaluate(()=>localStorage.clear());await p.goto(U);await p.waitForTimeout(1200);
 // palette group
 ok(await p.$$eval('.pal-group small',e=>e.some(x=>x.textContent.trim().toLowerCase()==='σήματα')),'palette group «Σήματα»');
 // empty circuit: constant → display, drawn with the mouse
 await p.evaluate(()=>window.PCL.loadTutorial('empty',{}));await p.waitForTimeout(600);
 await p.evaluate(()=>{const e=window.PCL.editor;e.addPart('CONST',200,200);e.addPart('DISP',360,200);e.addPart('R',360,320);e.addPart('SW',200,320,{gate:'sig'});e.fit();});await p.waitForTimeout(400);
 const pinXY=id=>p.evaluate(id=>{const r=document.querySelector(`[data-pin="${id}"]`)?.getBoundingClientRect();return r?[r.x+r.width/2,r.y+r.height/2]:null;},id);
 const drag=async(a,c)=>{const A=await pinXY(a),C=await pinXY(c);if(!A||!C)return false;await p.mouse.move(...A);await p.mouse.down();await p.mouse.move(A[0]+15,A[1]+10,{steps:4});await p.mouse.move(...C,{steps:10});await p.mouse.up();await p.waitForTimeout(250);return true;};
 ok(await drag('K1:y','DSP1:u'),'pins found');
 const wires=()=>p.evaluate(()=>window.PCL.editor.doc.wires.map(w=>w.a.c+':'+w.a.p+'-'+w.b.c+':'+w.b.p));
 ok((await wires()).includes('K1:y-DSP1:u'),'signal wire drawn: '+JSON.stringify(await wires()));
 ok(await p.evaluate(()=>!!document.querySelector('.wire.sig .wl[marker-end]')),'signal wire style with arrow');
 await p.evaluate(()=>{const S=window.PCL.S;S.sim.run(1e-3);window.PCL.pause();});
 ok(await p.evaluate(()=>window.PCL.S.sim.now('Y:DSP1'))===1,'display shows the constant');
 // a signal pin never joins an electrical node
 const n0=(await wires()).length;await drag('K1:y','R1:a');
 ok((await wires()).length===n0,'signal → electrical rejected');ok(/σήματος/.test(await p.$eval('#notice',e=>e.textContent)),'explanation shown');
 // the gate pin exists only while the switch is driven by a signal
 ok(await drag('K1:y','S1:g'),'gate pin present');ok((await wires()).includes('K1:y-S1:g'),'gate wire');
 await p.evaluate(()=>window.PCL.editor.setParams('S1',{gate:'pwm'}));await p.waitForTimeout(300);
 ok(!(await wires()).some(w=>w.includes('S1:g'))&&!(await pinXY('S1:g')),'gate pin and its wire removed');
 // connection without a wire: the source of an input chosen in the inspector
 await p.evaluate(()=>{const e=window.PCL.editor;e.addPart('GAIN',200,440,{K:3});e.fit();});await p.waitForTimeout(300);
 const gq=await p.evaluate(()=>{const r=document.querySelector('[data-c="GN1"] .hit').getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2];});
 await p.mouse.dblclick(...gq);await p.waitForTimeout(300);await p.selectOption('#inspector [data-src="u"]','K1:y');await p.waitForTimeout(300);
 ok(await p.evaluate(()=>window.PCL.editor.comp('GN1').params.in_u==='K1:y'),'source stored in the parameters');
 ok(/← K1\.y/.test(await p.evaluate(()=>[...document.querySelectorAll('.stag')].map(t=>t.textContent).join(' '))),'source tag next to the input');
 await p.evaluate(()=>{document.querySelector('#inspector').hidden=true;const S=window.PCL.S;S.sim.run(1e-4);window.PCL.pause();});
 ok(await p.evaluate(()=>window.PCL.S.sim.now('Y:GN1'))===3,'gain reads its source');
 // Goto / From tags with the same name
 await p.evaluate(()=>{const e=window.PCL.editor;e.addPart('TAGO',520,440,{name:'k'});e.addPart('TAGI',360,520,{name:'k'});e.addPart('DISP',520,520);e.fit();});await p.waitForTimeout(300);
 await drag('GN1:y','TG1:u');await drag('TF1:y','DSP2:u');await p.evaluate(()=>{const S=window.PCL.S;S.sim.run(1e-4);window.PCL.pause();});
 ok(await p.evaluate(()=>window.PCL.S.sim.now('Y:DSP2'))===3,'value through the tags: '+await p.evaluate(()=>window.PCL.S.sim.now('Y:DSP2')));
 await p.screenshot({path:'blocks_tags.png'});
 // algebraic loop: reported with the blocks on the loop
 await p.evaluate(()=>{const e=window.PCL.editor;e.addPart('GAIN',520,200);e.addPart('SUM',440,120);e.fit();});await p.waitForTimeout(300);
 await drag('GN2:y','SUM1:a');await drag('SUM1:y','GN2:u');await p.waitForTimeout(400);
 ok(/Αλγεβρικός βρόχος/.test(await p.evaluate(()=>window.PCL.S.error||'')),'algebraic loop error: '+await p.evaluate(()=>window.PCL.S.error));
 await p.screenshot({path:'blocks_editor.png'});
 // tutorial: current loop from blocks (PWM with input d) and with z⁻¹
 for(const [o,os] of [[{},/Υπερύψωση της κοιλάδας[^:]*: 12,\d %/],[{delay:'z1'},/Υπερύψωση της κοιλάδας[^:]*: 2\d,\d %/]]){
  await p.evaluate(o=>window.PCL.loadTutorial('blocks_loop',o),o);await p.waitForTimeout(800);
  await p.evaluate(()=>{const S=window.PCL.S;S.sim.run(S.stopT-S.sim.t);window.PCL.pause();window.PCL.renderTheory();});await p.waitForTimeout(600);
  const th=await p.$eval('#theory',e=>e.textContent);ok(/κοιλάδα i_L10 A10 A/.test(th),'valley at the reference '+JSON.stringify(o));ok(os.test(th),'overshoot '+JSON.stringify(o));
  ok(/Σειρά υπολογισμού των μπλοκ σε κάθε στιγμή: A_L → i_ref → e → PI/.test(th),'evaluation order');}
 await p.screenshot({path:'blocks_loop.png'});
 // live change of the reference (constant block)
 await p.evaluate(()=>window.PCL.loadTutorial('blocks_loop',{}));await p.waitForTimeout(800);
 await p.evaluate(()=>{const S=window.PCL.S;S.sim.run(.003);window.PCL.pause();});
 if(await p.evaluate(()=>document.querySelector('#live-panel').hidden))await p.click('#lp-toggle');
 await p.fill('[data-kv="K1"]','7');await p.click('[data-kapply="K1"]');await p.evaluate(()=>{const S=window.PCL.S;S.sim.run(.003);window.PCL.pause();});
 ok(Math.abs(await p.evaluate(()=>window.PCL.S.sim.lastPeriod('Y:AM1').min)-7)<0.01,'live reference 10 → 7 A');
 ok(await p.evaluate(()=>window.PCL.S.sim.changes.some(c=>c.k==='v')),'change recorded');
 // tutorial: peak current-mode, unstable and with the ramp
 await p.evaluate(()=>window.PCL.loadTutorial('peak_cm',{}));await p.waitForTimeout(800);
 await p.evaluate(()=>{const S=window.PCL.S;S.sim.run(S.sim.T*80);window.PCL.pause();window.PCL.renderTheory();});await p.waitForTimeout(600);
 let th=await p.$eval('#theory',e=>e.textContent);ok(/λ = \(m_a − m₂\)\/\(m₁ \+ m_a\) = -1,5/.test(th),'λ = −1.5');ok(/υποαρμονική/.test(th),'subharmonic verdict');
 await p.screenshot({path:'pcm_unstable.png'});
 await p.evaluate(()=>window.PCL.loadTutorial('peak_cm',{ramp:'half'}));await p.waitForTimeout(800);
 await p.evaluate(()=>{const S=window.PCL.S;S.sim.run(S.sim.T*80);window.PCL.pause();window.PCL.renderTheory();});await p.waitForTimeout(800);
 th=await p.$eval('#theory',e=>e.textContent);ok(/σταθερό: ίδιο duty σε κάθε περίοδο/.test(th),'stable with m₂/2');ok(/κορυφή Î \(τελευταία T\)4,136 A4,136 A/.test(th),'peak = i_c − m_a·D·T');
 // logic outputs share one scope pane, one lane each
 ok(await p.evaluate(()=>window.PCL.scope.cfg.panes[1].ch.every(c=>window.Scope.isLogic(c.key))),'logic lanes');
 await p.screenshot({path:'pcm_stable.png'});
 // the server reference solver runs the same blocks (comparator roots as ODE events)
 await p.click('#bt-block summary');await p.selectOption('#bt-method','LSODA');await p.click('#bt-run');
 await p.waitForFunction(()=>!document.querySelector('#bt-run').disabled,null,{timeout:120000});
 const dv=await p.evaluate(()=>{const B=window.PCL.S.batch,d=B?.data?.['Y:AM1'];if(!d)return null;let mx=-Infinity;const t1=d.t[d.t.length-1];for(let i=0;i<d.t.length;i++)if(d.t[i]>t1-1e-5)mx=Math.max(mx,d.y[i]);return Math.abs(mx-window.PCL.S.sim.lastPeriod('Y:AM1').max);});
 ok(dv!==null&&dv<1e-3,'server peak = browser peak '+dv);
 // prediction questions of the template
 await p.waitForTimeout(1500);ok((await p.$$eval('#math-tpl option',o=>o.map(x=>x.value)))[0]==='pcm_slope','pcm template first');
 console.log('ERR',errs);console.log(fail.length?'FAIL '+fail.join(' | '):'PASS');await b.close();process.exit(fail.length||errs.length?1:0);})();
