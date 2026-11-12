// Browser check of 4.4: the line from geometry (part 'TLM'), its tutorial and theory card, the "Δεδομένα γραμμής" dialog
// with a new model from the server after a change, and the search in the signal list.
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
 ok((await p.$$('.ld-modal .ld-svg circle')).length===8,'drawing: 2 ground wires and 3 bundles of 2');
 const rho=await p.$('.ld-modal [data-d="rho"]');await rho.fill('1000');await rho.dispatchEvent('change');await p.waitForTimeout(300);
 ok(/παλιό/.test(await p.$eval('.ld-modal [data-msg]',e=>e.innerText)),'a change makes the model old');
 await p.click('.ld-modal [data-run]');await p.waitForFunction(()=>/Υπολογίστηκε|⚠/.test(document.querySelector('.ld-modal [data-msg]')?.innerText||''),null,{timeout:60000});
 const rep=await p.$eval('.ld-modal',e=>e.textContent);ok(/Υπολογίστηκε/.test(rep),'computed: '+rep.slice(0,200));
 ok(/Ακολουθίες/.test(rep)&&/Προσαρμογή FD/.test(rep),'report with sequences and the fit');
 ok((await p.$$('.ld-modal .ld-plot')).length===6,'six fit plots');
 const key=await p.evaluate(()=>{const c=window.PCL.editor.comp('L2');return JSON.parse(c.params.mdl).src===Parts.tlmKey({...Parts.defaults('TLM'),...c.params});});ok(key,'the model carries the key of the new data');
 await p.click('.ld-modal [data-close]');
 // the CP line gets its new model automatically when the run starts again
 await p.evaluate(()=>{const e=window.PCL.editor,c=e.comp('L1'),d=JSON.parse(c.params.data);d.rho=1000;e.setParams('L1',{data:JSON.stringify(d)});});
 await p.evaluate(()=>window.PCL.reset());await p.waitForFunction(()=>!window.PCL.S.error&&!window.PCL.S.lineBusy,null,{timeout:60000});await p.waitForTimeout(500);
 ok(await p.evaluate(()=>!window.PCL.S.error),'rebuilt with the new CP model');
 ok(!errs.length,'no JavaScript errors: '+errs.join(' | '));
 await b.close();if(fail.length){console.log('FAIL',fail.join('\n'));process.exit(1);}console.log('PASS line_flow');})().catch(e=>{console.error(e);process.exit(1);});
