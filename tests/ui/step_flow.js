// Browser check of the solver step (3.13, ROADMAP §40): the diagnostics console, the step check, the variable step
// and the server's messages. 4.24: the subnetworks and multirate in the circuit panel, the run in its window, and the
// search of the library for the network equivalent. Usage: python run.py --no-browser --port 8765  then  node tests/ui/step_flow.js http://127.0.0.1:8765/ <out-dir>
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
 // 4.19 (§68): the linear solver in the circuit parameters: the proposal of the engine with its reason, the counters of
 // the running simulation, and a choice other than the proposal that the panel reports
 await p.evaluate(()=>PCL.loadTutorial('ieee9_emt'));await p.waitForTimeout(900);await p.click('#play');await p.waitForTimeout(1200);await p.click('#play');await p.waitForTimeout(200);
 const lin=await p.evaluate(()=>{PCL.editor.sel.c.clear();PCL.renderProps();const d=document.querySelector('details[data-sec="c-lin"]');if(d)d.open=true;const q=x=>document.querySelector(x)?.textContent||'';
  return {adv:q('#lin-advice'),stats:q('#lin-stats'),info:PCL.S.sim.solverInfo()};});
 ok(/Αραιός LU με μερική επαναπαραγοντοποίηση/.test(lin.adv)&&/μηχανές/.test(lin.adv),'γραμμικός λύτης: η πρόταση του engine με τον λόγο της');
 ok(lin.info.kind==='sparse'&&lin.info.asProposed&&lin.info.stats.re>100&&lin.info.stats.full<=3&&/επαναπαραγοντοποιήσεις/.test(lin.stats),'γραμμικός λύτης: αραιός με επαναπαραγοντοποίηση, '+lin.info.stats.re+' φορές, '+lin.info.stats.full+' από την αρχή');
 await p.selectOption('[data-solve="solver"]','dense');await p.waitForTimeout(700);
 const lin2=await p.evaluate(()=>{PCL.renderProps();const d=document.querySelector('details[data-sec="c-lin"]');if(d)d.open=true;return {kind:PCL.S.sim.solverInfo().kind,now:document.querySelector('#lin-now')?.textContent||'',solve:PCL.editor.doc.solve};});
 ok(lin2.kind==='dense'&&/διαφέρει από την πρόταση/.test(lin2.now)&&lin2.solve.solver==='dense','γραμμικός λύτης: η επιλογή «πυκνός» εφαρμόζεται και φαίνεται ότι διαφέρει από την πρόταση');
 await p.selectOption('[data-solve="solver"]','');await p.waitForTimeout(500);
 ok(await p.evaluate(()=>PCL.S.sim.solverInfo().kind==='sparse'&&!PCL.editor.doc.solve?.solver),'γραμμικός λύτης: «Αυτόματα» επιστρέφει στην πρόταση');
 // 4.19.1 (decision 243): the largest step from the circuit with its reason, the warning when the step passes it, and the
 // smallest step as a setting of the circuit (saved with it)
 await p.evaluate(()=>PCL.loadTutorial('schering'));await p.waitForTimeout(900);
 const sec=async()=>{await p.waitForFunction(()=>!!PCL.S.sim?.hLim,null,{timeout:10000});return p.evaluate(()=>{PCL.editor.sel.c.clear();PCL.renderProps();const d=document.querySelector('details[data-sec="c-step"]');if(d)d.open=true;
  const q=x=>document.querySelector(x)?.textContent||'';return {lim:q('#step-lim'),now:q('#step-now'),bad:!!document.querySelector('#step-now.bad'),info:PCL.S.sim.stepInfo(false)};});};
 const st=await sec();
 ok(/Πρόταση του engine: μέγιστο βήμα 64,2 μs/.test(st.lim)&&/C₄/.test(st.lim)&&!st.bad&&!st.info.over,'βήμα: το μέγιστο από το κύκλωμα με τον λόγο του ('+st.lim.slice(0,90)+')');
 await p.selectOption('#sim-step','50');await p.waitForFunction(()=>PCL.S.sim?.hLim&&PCL.S.sim.stepInfo(false).over,null,{timeout:10000});
 const st2=await sec(),w2=await p.$$eval('.dg-item.warn',x=>x.map(e=>e.textContent));
 ok(st2.bad&&/ξεπερνά το μέγιστο/.test(st2.now)&&w2.some(t=>/ξεπερνά το μέγιστο που δίνει το κύκλωμα/.test(t)),'βήμα: προειδοποίηση όταν το βήμα ξεπερνά το μέγιστο του κυκλώματος');
 await p.selectOption('#sim-step','400');await p.selectOption('#step-mode','var');await p.waitForTimeout(500);
 const st3=await sec();await p.fill('[data-solve="hmin"]','20n');await p.dispatchEvent('[data-solve="hmin"]','change');await p.waitForTimeout(500);
 const st4=await p.evaluate(()=>({hMin:PCL.S.sim.hMin,set:PCL.S.sim.stepInfo(false).hMinSet,doc:PCL.editor.doc.solve?.hmin}));
 ok(!st3.info.hMinSet&&/Αυτόματα/.test(st3.now)&&st4.set&&Math.abs(st4.hMin-2e-8)<1e-15&&Math.abs(st4.doc-2e-8)<1e-15,'βήμα: ελάχιστο βήμα 20 ns ως ρύθμιση του κυκλώματος (πριν: Αυτόματα)');
 await p.evaluate(()=>{PCL.editor.sel.c.clear();PCL.renderProps();});await p.fill('[data-solve="hmin"]','');await p.dispatchEvent('[data-solve="hmin"]','change');await p.waitForTimeout(400);
 ok(await p.evaluate(()=>!PCL.S.sim.stepInfo(false).hMinSet&&PCL.editor.doc.solve?.hmin===undefined),'βήμα: κενό = «Αυτόματα»');
 // 4.24 (THEORY §8Ι.7): subnetworks and multirate. The proposal of the engine (one solver), «Αυτόματα» for the rates, the
 // run in a worker of its own with its table and the difference from the run of the page at the same end
 await p.evaluate(()=>PCL.loadTutorial('multirate_lines'));await p.waitForTimeout(900);
 await p.click('#toend');await p.waitForFunction(()=>PCL.S.sim.t>=0.00199,null,{timeout:60000});await p.waitForTimeout(500);
 const spl=await p.evaluate(()=>{PCL.editor.sel.c.clear();PCL.renderProps();const d=document.querySelector('details[data-sec="c-split"]');if(d)d.open=true;return document.querySelector('#split-advice')?.textContent||'';});
 ok(/Πρόταση του engine: ένας λύτης/.test(spl)&&/3 υποδίκτυα/.test(spl),'υποδίκτυα: η πρόταση του engine ('+spl.slice(0,120)+')');
 await p.selectOption('[data-solve="rates"]','auto');await p.waitForTimeout(400);
 ok(await p.evaluate(()=>PCL.editor.doc.solve?.rates==='auto'),'πολλαπλοί ρυθμοί: «Αυτόματα» στο αρχείο');
 await p.evaluate(()=>{const d=document.querySelector('details[data-sec="c-split"]');if(d)d.open=true;});
 await p.click('[data-splitrun]');await p.waitForFunction(()=>/Έγινε|⚠/.test(document.querySelector('.split-box [data-swstat]')?.textContent||''),null,{timeout:120000});
 const sw=await p.evaluate(()=>({stat:document.querySelector('.split-box [data-swstat]').textContent,rows:[...document.querySelectorAll('.split-box .split-tab tbody tr')].map(r=>[...r.cells].map(c=>c.textContent)),
  notes:[...document.querySelectorAll('.split-box .split-plots p')].map(e=>e.textContent),cv:document.querySelectorAll('.split-box canvas').length}));
 ok(/Έγινε/.test(sw.stat)&&/3 υποδίκτυα/.test(sw.stat)&&/2 ομάδες/.test(sw.stat),'υποδίκτυα: το τρέξιμο σε worker ('+sw.stat+')');
 ok(sw.rows.length===2&&sw.rows[0][3]==='h'&&/^15·h$/.test(sw.rows[1][3])&&+sw.rows[1][5]<+sw.rows[0][5]/10,'πολλαπλοί ρυθμοί: η αργή ομάδα με 15·h και λιγότερα βήματα '+JSON.stringify(sw.rows));
 ok(sw.cv>=1&&sw.notes.some(t=>/μέγιστη διαφορά από τον έναν λύτη/.test(t)),'υποδίκτυα: τα κανάλια με τον έναν λύτη και η διαφορά τους '+sw.notes.join(' / ').slice(0,200));
 await (await p.$('.split-box')).screenshot({path:OUT+'/split_window.png'});
 await p.click('.split-box [data-swclose]');await p.selectOption('[data-solve="rates"]','');await p.waitForTimeout(300);
 // 4.24: the three-phase source with a short-circuit level is found by the search of the library with «πηγή»
 const lib=await p.evaluate(()=>{const s=document.querySelector('#pal-search'),get=q=>{s.value=q;s.dispatchEvent(new Event('input'));return [...document.querySelectorAll('#palette-list .pal-item[data-part]')].map(b=>b.dataset.part);};
  const r={a:get('πηγή βραχυκύκλωσης'),b:get('Sk')};s.value='';s.dispatchEvent(new Event('input'));return r;});
 ok(lib.a.includes('GRID3')&&lib.b.includes('GRID3'),'βιβλιοθήκη: το ισοδύναμο δικτύου με «πηγή βραχυκύκλωσης» και «Sk» '+JSON.stringify(lib));
 ok(errs.length===0,'χωρίς σφάλματα JavaScript '+errs.join(' | '));
 await b.close();})();
