// Browser check of the solver step (3.13, ROADMAP §40): the diagnostics console, the step check, the variable step
// and the server's messages. Usage: python run.py --no-browser --port 8765  then  node tests/ui/step_flow.js http://127.0.0.1:8765/ <out-dir>
const {chromium}=require('playwright');const OUT=process.argv[3]||'.';
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1500,height:1100}});const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(String(e.stack||e)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
 const ok=(c,msg)=>{if(!c){console.error('FAIL: '+msg);process.exitCode=1;}else console.log('ok: '+msg);};
 await p.goto(process.argv[2]);await p.waitForSelector('#tutorials');
 await p.click('#tutorials');await p.click('[data-tut="schering"]');await p.waitForTimeout(900);
 // the console: counters always visible, the step check fills it after the build
 await p.waitForFunction(()=>/ℹ\s*[1-9]/.test(document.querySelector('#diag-counts').textContent),null,{timeout:10000});
 await p.click('#diag summary');await p.waitForSelector('.dg-item');
 const items=await p.$$eval('.dg-item',x=>x.map(e=>e.textContent));
 ok(items.some(t=>/32,1 μs/.test(t)&&/C₄/.test(t)&&/C_x/.test(t)),'σταθερά χρόνου 32,1 μs με C₄ και C_x');
 ok(items.some(t=>/πρακτικά στιγμιαία/.test(t)),'πολύ γρήγορη σταθερά χρόνου ως πληροφορία');
 // filters: only warnings → nothing; then back
 await p.uncheck('[data-dsev="info"]');ok(await p.$$eval('.dg-item',x=>x.length)===0,'φίλτρο: χωρίς πληροφορίες');await p.check('[data-dsev="info"]');
 await p.fill('#diag-q','C₂');ok(await p.$$eval('.dg-item',x=>x.length)===1,'φίλτρο κειμένου');await p.fill('#diag-q','');
 // click on the element: selected and highlighted in the drawing
 await p.click('.dg-item [data-dfocus="C4"]');await p.waitForTimeout(200);
 ok(await p.$eval('#canvas .part[data-c="C4"]',e=>e.classList.contains('diag-hi')),'φωτισμός του στοιχείου');
 ok(await p.evaluate(()=>document.querySelector('#selinfo').textContent.length>0),'επιλογή του στοιχείου');
 // coarser step: a warning appears with the suggested T/N
 await p.selectOption('#sim-step','50');await p.waitForFunction(()=>/⚠\s*[1-9]/.test(document.querySelector('#diag-counts').textContent),null,{timeout:10000});
 const warn=await p.$$eval('.dg-item.warn',x=>x.map(e=>e.textContent));ok(warn.some(t=>/φορές μεγαλύτερο από τη σταθερά χρόνου/.test(t)&&/T\/\d+/.test(t)),'προειδοποίηση με πρόταση βήματος');
 await p.selectOption('#sim-step','400');
 // variable step: from the toolbar, saved with the circuit (the circuit panel shows the section)
 await p.selectOption('#step-mode','var');await p.waitForTimeout(400);
 await p.click('#play');await p.waitForTimeout(1200);await p.click('#play');
 const note=await p.$eval('#step-note',e=>e.textContent);ok(/μεταβλητό/.test(note)&&/απορρίψεις/.test(note),'σημείωση βήματος: '+note);
 await p.click('#canvas',{position:{x:30,y:30}});await p.waitForTimeout(300);
 ok(await p.evaluate(()=>[...document.querySelectorAll('#props-body .psec, #props-body details, #props-body summary')].some(e=>/Βήμα του λύτη/.test(e.textContent))),'ενότητα «Βήμα του λύτη» στο πάνελ του κυκλώματος');
 ok(await p.evaluate(()=>document.querySelector('[data-solve="step"]')?.value==='var'),'το μεταβλητό βήμα στις ρυθμίσεις του κυκλώματος');
 // the server: the same messages, from SciPy
 await p.click('#bt-block summary');await p.selectOption('#bt-method','Radau');await p.click('#bt-run');
 await p.waitForFunction(()=>!document.querySelector('#bt-run').disabled,null,{timeout:120000});
 await p.selectOption('#diag-src','server');await p.waitForTimeout(200);
 const srv=await p.$$eval('.dg-item',x=>x.map(e=>e.textContent));ok(srv.length>0&&srv.every(t=>/server \(SciPy\)/.test(t)),'μηνύματα του server: '+srv.length);
 await p.selectOption('#diag-src','');
 await (await p.$('#scope-card')).screenshot({path:OUT+'/step_console.png'});
 ok(errs.length===0,'χωρίς σφάλματα JavaScript '+errs.join(' | '));
 await b.close();})();
