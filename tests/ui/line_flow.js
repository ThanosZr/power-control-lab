// Browser check of 4.4: the line from geometry (part 'TLM'), its tutorial and theory card, the "Δεδομένα γραμμής" dialog
// with a new model from the server after a change, and the search in the signal list. 4.5: the cable tutorial and the
// dialog in its cable mode (layers, cross-section, a new FD model after a change of tanδ, back to an overhead line).
// Usage: python run.py --no-browser --port 8775  then  node tests/ui/line_flow.js http://127.0.0.1:8775/
const {chromium}=require('playwright');
(async()=>{const U=process.argv[2]||'http://127.0.0.1:8775/';const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1500,height:1100}});const p=await ctx.newPage();
 const errs=[],fail=[];p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
 const ok=(c,msg)=>{if(!c)fail.push(msg);};
 await p.goto(U);await p.evaluate(()=>localStorage.clear());
 await p.goto(U+'?tutorial=line_fd');await p.waitForTimeout(1500);
 ok(await p.evaluate(()=>!window.PCL.S.error),'tutorial builds without the server: '+await p.evaluate(()=>window.PCL.S.error));
 await p.click('#toend');await p.waitForFunction(()=>window.PCL.S.sim.t>=0.0039,null,{timeout:90000});await p.waitForTimeout(800);
 const th=await p.$eval('#theory',e=>e.innerText);ok(/ρυθμός/.test(th)&&/άφιξη/.test(th),'theory card with modes and arrival');
 const va=await p.evaluate(()=>[window.PCL.S.sim.now('V4:L1'),window.PCL.S.sim.now('V4:L2')]);ok(va.every(Number.isFinite)&&Math.abs(va[1])>100,'open-end voltages '+va);
 // the signal search
 await p.fill('#sig-search','τάση a2');await p.waitForTimeout(200);
 const n=await p.$$eval('#add-signal option',o=>o.filter(x=>x.value).length);ok(n===2,'search finds the two a2 voltages: '+n);
 await p.fill('#sig-search','ρευμα c1');await p.waitForTimeout(200);
 const n2=await p.$$eval('#add-signal option',o=>o.filter(x=>x.value).length);ok(n2===2,'search without accents: '+n2);
 await p.press('#sig-search','Enter');await p.waitForTimeout(300);
 ok(await p.evaluate(()=>window.PCL.scope.channels().some(c=>c.key==='I3:L1')),'Enter adds the first match');
 // the inspector and the dialog: a change of the earth resistivity asks for a new model, computed by the server
 await p.evaluate(()=>window.PCL.openInspector('L2',400,200));await p.waitForTimeout(300);
 ok(/Μοντέλο FD ενημερωμένο/.test(await p.$eval('#inspector',e=>e.innerText)),'inspector shows an up-to-date FD model');
 await p.click('#inspector [data-linedata]');await p.waitForSelector('.ld-modal');
 await p.click('.ld-modal [data-tab="data"]');
 ok((await p.$$('.ld-modal [data-ci]')).length===8,'drawing: 2 ground wires and 3 bundles of 2');
 const rho=await p.$('.ld-modal [data-d="rho"]');await rho.fill('1000');await rho.dispatchEvent('change');await p.waitForTimeout(300);
 ok(/παλιό/.test(await p.$eval('.ld-modal [data-msg]',e=>e.innerText)),'a change makes the model old');
 await p.click('.ld-modal [data-tab="model"]');await p.click('.ld-modal [data-run]');await p.waitForFunction(()=>/Υπολογίστηκε|⚠/.test(document.querySelector('.ld-modal [data-msg]')?.innerText||''),null,{timeout:60000});
 const rep=await p.$eval('.ld-modal',e=>e.textContent);ok(/Υπολογίστηκε/.test(rep),'computed: '+rep.slice(0,200));
 ok(/Ακολουθίες/.test(rep)&&/Προσαρμογή FD/.test(rep),'report with sequences and the fit');
 ok((await p.$$('.ld-modal .ld-plot')).length===6,'six fit plots');
 const key=await p.evaluate(()=>{const c=window.PCL.editor.comp('L2');return JSON.parse(c.params.mdl).src===Parts.tlmKey({...Parts.defaults('TLM'),...c.params});});ok(key,'the model carries the key of the new data');
 // 4.11: every parameter against frequency, the tables, the exports, the interactive drawing
 await p.click('.ld-modal [data-tab="graphs"]');await p.click('.ld-modal [data-scan]');await p.waitForSelector('.ld-modal .ld-chart',{timeout:60000});
 const nser=await p.$$eval('.ld-modal .ld-cleg span',e=>e.length);ok(nser===6,'Z_c of the three modes, constant and exact T_i: '+nser);
 ok((await p.$$('.ld-modal .ld-chart path[d^="M"]')).length===6,'six curves drawn');
 { const svg=await p.$('.ld-modal .ld-chart'),bb=await svg.boundingBox();await p.mouse.move(bb.x+bb.width*0.5,bb.y+bb.height*0.5);await p.waitForTimeout(100);
  ok(/ρυθμός 1:/.test(await p.$eval('.ld-modal .ld-ctip',e=>e.innerText)),'the cursor shows the values');
  await p.mouse.move(bb.x+bb.width*0.3,bb.y+bb.height*0.5);await p.mouse.down();await p.mouse.move(bb.x+bb.width*0.6,bb.y+bb.height*0.5,{steps:4});await p.mouse.up();await p.waitForTimeout(100);
  const lab=await p.$$eval('.ld-modal .ld-chart text',t=>t.map(x=>x.textContent).filter(x=>/^10/.test(x)).length);ok(lab<=5,'zoomed to a band of frequencies: '+lab+' decade labels');
  await p.click('.ld-modal .ld-cleg span[data-s="0"]');ok((await p.$$('.ld-modal .ld-chart path[d^="M"]')).length===5,'the legend hides a curve'); }
 await p.selectOption('.ld-modal [data-g="dom"]','phase');await p.waitForTimeout(150);ok((await p.$$('.ld-modal .ld-cleg span')).length===6,'Z′ of the phases: the six elements of a symmetric 3 × 3');
 // 4.12: a kept scan in the same charts, and the sensitivity of the sequence parameters
 await p.click('.ld-modal [data-refkeep]');await p.waitForTimeout(150);ok((await p.$$('.ld-modal [data-chart] .ld-cleg span')).length===12,'the kept scan, dashed beside the current one');
 await p.click('.ld-modal [data-g="ref"]');await p.waitForTimeout(150);ok((await p.$$('.ld-modal [data-chart] .ld-cleg span')).length===6,'the comparison off');
 await p.selectOption('.ld-modal [data-sp="param"]','temp');await p.waitForTimeout(100);await p.fill('.ld-modal [data-sp="n"]','5');await p.press('.ld-modal [data-sp="n"]','Tab');await p.waitForTimeout(100);
 await p.click('.ld-modal [data-sens]');await p.waitForSelector('.ld-modal [data-schart] .ld-chart',{timeout:60000});
 ok((await p.$$('.ld-modal [data-schart] .ld-cleg span')).length===4,'sensitivity: R₁, X₁, R₀, X₀ against the temperature');
 await p.click('.ld-modal [data-tab="tables"]');await p.waitForTimeout(200);const tb=await p.$eval('.ld-modal',e=>e.textContent);
 ok((await p.$$('.ld-modal [data-tel]')).length===1,'the option of a communication line');
 ok(/\[Z_E\] φάσεων/.test(tb)&&/\[C_S\] συμμετρικών/.test(tb)&&/SIL/.test(tb)&&/Q-error/.test(tb),'tables: matrices, useful quantities, Q-error');
 ok((await p.$$('.ld-modal [data-fE] .ld-chart')).length===1,'the field profile under the line');
 await p.click('.ld-modal [data-tab="export"]');
 for(const [f,re] of [['script',/\.py$/],['csv',/\.csv$/],['exact_pi',/_Exact_PI\.mod$/],['fd_mod',/_FD\.mod$/]]){const [dl]=await Promise.all([p.waitForEvent('download',{timeout:60000}),p.click(`.ld-modal [data-ex="${f}"]`)]);ok(re.test(dl.suggestedFilename()),'export '+f+': '+dl.suggestedFilename());}
 await p.click('.ld-modal [data-topy]');ok(await p.evaluate(()=>window.Addons?.lineOut?.id==='L2'&&!!window.Addons.lineOut.data.bundles),'«Στην Python» leaves the line for app.line()');
 await p.click('.ld-modal [data-tab="data"]');
 { const c=await p.$('.ld-modal [data-src="w0"]'),bb=await c.boundingBox(),x0=await p.evaluate(()=>JSON.parse(window.PCL.editor.comp('L2').params.data).wires[0].x);
  await p.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2);await p.mouse.down();await p.mouse.move(bb.x+bb.width/2+40,bb.y+bb.height/2,{steps:5});await p.mouse.up();await p.waitForTimeout(200);
  const x1=await p.evaluate(()=>JSON.parse(window.PCL.editor.comp('L2').params.data).wires[0].x);ok(x1>x0+1,'dragging a ground wire moves it: '+x0+' → '+x1);
  await p.click('.ld-modal [data-undo]');await p.waitForTimeout(200);ok(await p.evaluate(()=>JSON.parse(window.PCL.editor.comp('L2').params.data).wires[0].x)===x0,'undo puts it back'); }
 if(!(await p.isVisible('.ld-modal [data-v="ov"]')))await p.click('.ld-modal [data-view]');
 await p.selectOption('.ld-modal [data-v="ov"]','E');await p.waitForTimeout(300);ok((await p.$$('.ld-modal [data-draw] image')).length===1,'the |E| map over the drawing');
 await p.selectOption('.ld-modal [data-v="ov"]','none');await p.waitForTimeout(200);
 await p.click('.ld-modal [data-close]');
 // the CP line gets its new model automatically when the run starts again
 await p.evaluate(()=>{const e=window.PCL.editor,c=e.comp('L1'),d=JSON.parse(c.params.data);d.rho=1000;e.setParams('L1',{data:JSON.stringify(d)});});
 await p.evaluate(()=>window.PCL.reset());await p.waitForFunction(()=>!window.PCL.S.error&&!window.PCL.S.lineBusy,null,{timeout:60000});await p.waitForTimeout(500);
 ok(await p.evaluate(()=>!window.PCL.S.error),'rebuilt with the new CP model');
 // 4.5: cables
 await p.goto(U+'?tutorial=cable_fd');await p.waitForTimeout(1500);
 ok(await p.evaluate(()=>!window.PCL.S.error),'cable tutorial builds without the server: '+await p.evaluate(()=>window.PCL.S.error));
 await p.click('#toend');await p.waitForFunction(()=>window.PCL.S.sim.t>=0.00195,null,{timeout:90000});await p.waitForTimeout(800);
 const thc=await p.$eval('#theory',e=>e.innerText);ok(/Cable Data/.test(thc)&&/άφιξη/.test(thc)&&!/\(γης\)/.test(thc),'cable theory card');
 await p.evaluate(()=>window.PCL.openInspector('L2',400,200));await p.waitForTimeout(300);
 await p.click('#inspector [data-linedata]');await p.waitForSelector('.ld-modal');
 await p.click('.ld-modal [data-tab="data"]');
 ok((await p.$$('.ld-modal .ld-cab')).length===3,'three cables in the table');
 ok(await p.$eval('.ld-modal [data-kind]',e=>e.value)==='cab','type: cables');
 ok((await p.$$('.ld-modal .ld-xs circle')).length===4,'cross-section with four layers');
 ok(await p.$eval('.ld-modal [data-d="medium"]',e=>e.value)==='sea','medium: sea');
 const td=await p.$('.ld-modal [data-k="lay"][data-i="0"][data-j="1"][data-c="tand"]');await td.fill('1e-3');await td.dispatchEvent('change');await p.waitForTimeout(300);
 ok(await p.evaluate(()=>JSON.parse(window.PCL.editor.comp('L2').params.data).cables[0].layers[1].tand===1e-3),'tanδ kept in the data');
 const r1=await p.$('.ld-modal [data-k="lay"][data-i="0"][data-j="0"][data-c="rout"]');ok(await r1.inputValue()==='25.6','radius shown in mm');
 ok(/παλιό/.test(await p.$eval('.ld-modal [data-msg]',e=>e.innerText)),'a change makes the cable model old');
 await p.click('.ld-modal [data-tab="model"]');await p.click('.ld-modal [data-run]');await p.waitForFunction(()=>/Υπολογίστηκε|⚠/.test(document.querySelector('.ld-modal [data-msg]')?.innerText||''),null,{timeout:120000});
 const repc=await p.$eval('.ld-modal',e=>e.textContent);ok(/Υπολογίστηκε/.test(repc),'cable computed: '+repc.slice(0,200));
 ok((await p.$$('.ld-modal .ld-plot')).length===6,'six fit plots for the cable');
 await p.click('.ld-modal [data-tab="data"]');await p.click('.ld-modal [data-addc]');await p.waitForTimeout(300);
 ok(await p.evaluate(()=>{const d=JSON.parse(window.PCL.editor.comp('L2').params.data);return d.cables.length===4&&d.cables[3].ph[0]===4&&d.cables[3].ph[1]===0;}),'a new cable takes the next phase');
 ok(await p.evaluate(()=>Parts.tlmM(window.PCL.editor.comp('L2').params))===4,'four phases');
 await p.selectOption('.ld-modal [data-kind]','oh');await p.waitForTimeout(300);
 ok((await p.$$('.ld-modal [data-add="w"]')).length===1&&!(await p.$$('.ld-modal .ld-cab')).length,'back to an overhead line');
 // 4.11: a line from sequence data, and the nominal π as the model of the part
 await p.selectOption('.ld-modal [data-kind]','seq');await p.waitForTimeout(200);ok((await p.$$('.ld-modal [data-q="R0"]')).length===1,'sequence data form');
 await p.selectOption('.ld-modal [data-p="model"]','pi');await p.waitForTimeout(200);await p.click('.ld-modal [data-tab="model"]');
 await p.click('.ld-modal [data-run]');await p.waitForFunction(()=>/Υπολογίστηκε|⚠/.test(document.querySelector('.ld-modal [data-msg]')?.innerText||''),null,{timeout:60000});
 ok(/Ονομαστικό π/.test(await p.$eval('.ld-modal',e=>e.textContent)),'π model computed: '+(await p.$eval('.ld-modal [data-msg]',e=>e.innerText)));
 await p.click('.ld-modal [data-close]');
 // 4.9: the two TRV tutorials, run to the end, with their cards (the rated envelope; the arc of the short-line fault)
 await p.goto(U+'?tutorial=trv_terminal');await p.waitForTimeout(1500);
 ok(await p.evaluate(()=>!window.PCL.S.error),'TRV tutorial builds: '+await p.evaluate(()=>window.PCL.S.error));
 await p.click('#toend');await p.waitForFunction(()=>window.PCL.S.sim.t>=0.0639,null,{timeout:120000});await p.waitForTimeout(800);
 const tht=await p.$eval('#theory',e=>e.innerText);ok(/κάτω από τη γραμμή αναφοράς/.test(tht)&&/Πρώτος πόλος: b/.test(tht),'terminal-fault card: '+tht.slice(0,160));
 ok((await p.$$('#theory svg.trvplot path')).length>=3,'TRV plot with the reference and delay lines');
 await p.goto(U+'?tutorial=trv_slf');await p.waitForTimeout(1500);
 ok(await p.evaluate(()=>!window.PCL.S.error),'SLF tutorial builds: '+await p.evaluate(()=>window.PCL.S.error));
 await p.click('#toend');await p.waitForFunction(()=>window.PCL.S.sim.t>=0.01559,null,{timeout:120000});await p.waitForTimeout(800);
 const ths=await p.$eval('#theory',e=>e.innerText);ok(/Διακοπή στο πρώτο μηδέν/.test(ths)&&/R_s/.test(ths),'short-line-fault card: '+ths.slice(0,160));
 ok(await p.evaluate(()=>Number.isFinite(window.PCL.S.sim.now('Garc:CB1/A1'))),'arc conductance channel');
 // 4.9: the lightning tutorial with notes on the drawing (NOTE) and its card
 await p.goto(U+'?tutorial=lightning_gis');await p.waitForTimeout(2500);
 ok(await p.evaluate(()=>!window.PCL.S.error),'lightning tutorial builds: '+await p.evaluate(()=>window.PCL.S.error));
 ok((await p.$$('.lbls.note .ntext')).length>=8,'notes on the drawing');
 await p.click('#toend');await p.waitForFunction(()=>window.PCL.S.sim.t>=49e-6,null,{timeout:180000});await p.waitForTimeout(800);
 const thl=await p.$eval('#theory',e=>e.innerText);ok(/Καμία διάσπαση μονωτήρων/.test(thl)&&/LIWL/.test(thl),'lightning card: '+thl.slice(0,160));
 // 4.9.1 (ROADMAP §52): the inside of an electrical library part (its elements and their currents now), the fast
 // implementation (the same peak of the tower top), and a part expanded into an ordinary subcircuit that opens in the editor
 ok(await p.evaluate(()=>Inside.open('T2')),'the inside of the tower opens');await p.waitForTimeout(400);
 ok((await p.$$('#lib-inside .in-el .part')).length>=20,'tower inside: its elements with symbols');
 ok(/i = /.test(await p.$eval('#lib-inside',e=>e.textContent)),'tower inside: the currents of the elements');
 ok(/13 στοιχεία/.test(await p.$eval('#lib-inside .wp-head',e=>e.textContent)),'tower inside: 13 elements');
 await p.keyboard.press('Escape');await p.evaluate(()=>Inside.close());
 await p.selectOption('#tut-options [data-topt="impl"]','fast');await p.waitForTimeout(2000);
 ok(await p.evaluate(()=>window.PCL.editor.comp('T2').params.impl==='fast'&&window.PCL.editor.comp('SEa').params.impl==='fast'),'fast implementation chosen');
 await p.click('#toend');await p.waitForFunction(()=>window.PCL.S.sim.t>=49e-6,null,{timeout:180000});await p.waitForTimeout(800);
 const thf=await p.$eval('#theory',e=>e.innerText);ok(/Καμία διάσπαση μονωτήρων/.test(thf),'fast: the same card: '+thf.slice(0,120));
 ok(await p.evaluate(()=>{Inside.open('SEa');return /γρήγορη υλοποίηση/.test(document.querySelector('#lib-inside .wp-head').textContent);}),'fast arrester: one element of the solver');
 await p.evaluate(()=>Inside.close());
 await p.evaluate(()=>window.PCL.libToSub('T2'));await p.waitForTimeout(500);
 ok(await p.evaluate(()=>{const c=window.PCL.editor.comp('T2');return c.type==='SUB'&&/^tower_/.test(c.params.def);}),'the tower expanded into a subcircuit');
 ok(await p.evaluate(()=>!window.PCL.S.error),'the expanded circuit builds: '+await p.evaluate(()=>window.PCL.S.error));
 await p.evaluate(()=>{const c=window.PCL.editor.comp('T2');window.PCL.enterSub(c.params.def,'T2');});await p.waitForTimeout(600);
 ok(await p.evaluate(()=>window.PCL.editor.doc.components.filter(c=>c.type==='SG').length===3&&!!window.PCL.editor.comp('RF')),'inside the subcircuit: the strings and the footing, editable');
 await p.evaluate(()=>window.PCL.leaveSub(0));await p.waitForTimeout(400);
 ok(!errs.length,'no JavaScript errors: '+errs.join(' | '));
 await b.close();if(fail.length){console.log('FAIL',fail.join('\n'));process.exit(1);}console.log('PASS line_flow');})().catch(e=>{console.error(e);process.exit(1);});
