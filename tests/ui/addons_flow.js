// Browser check of the add-ons and the link (3.15, ROADMAP §35, §36): the built-in impulse add-on opened from the parameters
// panel of a Heidler source computes τ₁, τ₂, η in the app's Python and writes them to the source; a Python program on this
// computer reads and changes the circuit on the screen, runs it and sends a table and a message to the app.
// Usage: python run.py --no-browser --port 8765  then  node tests/ui/addons_flow.js http://127.0.0.1:8765/ <out-dir>
const {chromium}=require('playwright');const {spawn}=require('child_process');const path=require('path');const OUT=process.argv[3]||'.';
const ROOT=path.resolve(__dirname,'../..');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:1100}});const errs=[];
 p.on('pageerror',e=>errs.push(String(e.stack||e)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
 const ok=(c,msg)=>{if(!c){console.error('FAIL: '+msg);process.exitCode=1;}else console.log('ok: '+msg);};
 await p.goto(process.argv[2]);await p.waitForSelector('#addons-card');await p.evaluate(()=>localStorage.clear());await p.reload();await p.waitForSelector('#addons-card');
 await p.waitForFunction(()=>window.Addons&&Addons.list.length>0,null,{timeout:15000});
 ok(await p.evaluate(()=>Addons.list.some(a=>a.id==='impulse-params'&&a.builtin)),'ενσωματωμένο πρόσθετο «Κρουστικές πηγές»');
 // 1) from the parameters panel of the Heidler source
 await p.evaluate(()=>PCL.loadTutorial('lightning'));await p.waitForTimeout(400);
 await p.evaluate(()=>{PCL.editor.select(['I1'],[]);});await p.waitForTimeout(300);
 const hasTool=await p.evaluate(()=>!!document.querySelector('[data-tool="impulse-params"]'));
 if(!hasTool)await p.evaluate(()=>{const el=document.querySelector('#props');if(el.classList.contains('collapsed'))document.querySelector('#props-btn').click();});
 await p.waitForTimeout(300);
 const btn=await p.$('[data-tool="impulse-params"]');
 ok(!!btn,'κουμπί «Παράμετροι από κώδικα» στο πάνελ της πηγής');
 if(btn)await btn.click();else await p.evaluate(()=>Addons.open('impulse-params',{target:'I1'}));
 const fr=await (await p.waitForSelector('iframe.addon-frame')).contentFrame();
 await fr.waitForFunction(()=>document.querySelector('#target').value==='I1',null,{timeout:15000});
 ok(true,'το πρόσθετο ανοίγει με στόχο την I1');
 await fr.fill('#i-T1','1');await fr.fill('#i-T2','200');await fr.fill('#i-Im','-100000');
 await fr.click('#i-fit');await fr.waitForFunction(()=>/τ₁/.test(document.querySelector('#out').textContent)||/err/.test(document.querySelector('#msg').className),null,{timeout:180000});
 const out=await fr.$eval('#out',e=>e.textContent);ok(/1,83193/.test(out),'Heidler 1/200 μέσα από την Python της εφαρμογής: τ₁ = 1,83193 μs '+out.slice(0,80));
 await fr.click('#apply');await p.waitForTimeout(600);
 const c=await p.evaluate(()=>{const c=PCL.editor.comp('I1'),w=PCL.S.sim.net.compInfo.get('I1').wave;return {shape:c.params.shape,from:Object.keys(c.from||{}),T1:w.T1,T2:w.T2};});
 ok(c.shape==='direct'&&c.from.includes('tau1'),'οι παράμετροι γράφτηκαν στην πηγή με σημάδι «από εργαλείο»');
 ok(Math.abs(c.T1-1e-6)<1e-11&&Math.abs(c.T2-200e-6)<1e-9,`η προσομοίωση βλέπει T1 = ${c.T1}, T2 = ${c.T2}`);
 await fr.click('[data-tab="v"]');await fr.selectOption('#v-prof','IEC2025_LI');await fr.click('#v-fit');
 await fr.waitForFunction(()=>/PASS|FAIL/.test(document.querySelector('#out').textContent),null,{timeout:120000});
 ok(/PASS/.test(await fr.$eval('#out',e=>e.textContent)),'κρουστική 1,2/50: PASS με τα όρια του IEC 60060-1');
 await p.screenshot({path:path.join(OUT,'addons_impulse.png')});
 // 2) the link: a Python program on this computer
 await p.evaluate(()=>PCL.loadTutorial('buck'));await p.waitForTimeout(400);
 // the link closed: the first call knocks, the app asks, Αποδοχή opens the link and the call goes on (on demand)
 await p.evaluate(()=>{document.querySelector('#addons-block').open=true;});ok(!(await p.isChecked('#link-on')),'η σύνδεση είναι κλειστή εξ ορισμού');
 const py=["import pcl","app = pcl.link.connect()","print('tut', app.info()['tutorial'])","app.set('R1.R', 20)",
  "r = app.run(t_end=2e-3, measure={'Vo': ('V:C1', 'avg', 10)})","print('Vo', round(r.measured['Vo'], 3))",
  "print('py', app.python('result = x * 2', x=21))","app.show({'από': 'Python', 'Vo': r.measured['Vo']}, 'σύνδεση')","app.notify('μήνυμα από την Python')"].join('\n');
 const ch=spawn('python3',['-c',py],{cwd:ROOT});let txt='';ch.stdout.on('data',d=>txt+=d);ch.stderr.on('data',d=>txt+=d);const closed=new Promise(r=>ch.on('close',r));
 await p.waitForSelector('.knock-toast',{timeout:30000});ok(/Python/.test(await p.$eval('.knock-toast',e=>e.textContent)),'αίτημα σύνδεσης με το όνομα του προγράμματος');
 await p.click('.knock-toast [data-k="1"]');const code=await closed;
 ok(await p.isChecked('#link-on'),'με «Αποδοχή» η σύνδεση άνοιξε');
 ok(code===0&&/tut buck/.test(txt)&&/py 42/.test(txt),'Python → εφαρμογή: info, python '+txt.trim().replace(/\n/g,' | '));
 const vo=+((txt.match(/Vo ([\d.]+)/)||[])[1]);ok(vo>11.5&&vo<12.5,'Python → εφαρμογή: run με τον λύτη της εφαρμογής, Vo = '+vo);
 ok(await p.evaluate(()=>+PCL.editor.comp('R1').params.R)===20,'η αλλαγή R1.R = 20 φαίνεται στο κύκλωμα');
 ok(await p.$$eval('.scen-tbl',x=>x.length)>=1,'ο πίνακας της Python στο πάνελ');
 ok(await p.evaluate(()=>(PCL.S.addonDiag||[]).some(d=>/από την Python/.test(d.msg))),'το μήνυμα στην κονσόλα διαγνωστικών');
 // 3) publication figure from the scope, with the IEEE preset (the same JSON as pcl.plotting and pcl_style.m)
 await p.evaluate(()=>{PCL.S.sim.run(1e-3);});
 await p.evaluate(()=>Addons.open('publication-plot'));
 const fp=await (await p.waitForSelector('iframe.addon-frame[title="Γραφική για δημοσίευση"]')).contentFrame();
 await fp.waitForFunction(()=>document.querySelectorAll('[data-k]').length>0&&document.querySelector('#preset').value==='ieee',null,{timeout:15000});
 await fp.click('#draw');await fp.waitForSelector('#fig svg');
 const svg=await fp.$eval('#fig svg',e=>({w:e.getAttribute('width'),h:e.getAttribute('height'),paths:e.querySelectorAll('path').length}));
 ok(svg.w==='8.8cm'&&svg.h==='6cm'&&svg.paths>=1,`IEEE: ${svg.w} × ${svg.h}, ${svg.paths} καμπύλες`);
 ok(await fp.$$eval('#tbl tbody tr',x=>x.length)>=1,'πίνακας ακροτάτων');
 await p.screenshot({path:path.join(OUT,'addons_publication.png')});
 // 4) control composed from choices (§38): the DC drive in open loop as the plant, speed over current, the speed loop PI + NN
 await p.evaluate(()=>PCL.loadTutorial('dc_drive',{mode:'open'}));await p.waitForTimeout(500);
 await p.evaluate(()=>Addons.open('control-composer'));
 const fc=await (await p.waitForSelector('iframe.addon-frame[title="Σύνθεση ελέγχου (κλασικός και AI)"]')).contentFrame();
 await fc.waitForFunction(()=>document.querySelectorAll('.loop').length===2,null,{timeout:15000});
 ok(await fc.$$eval('.loop [data-f="measure"]',x=>x.map(e=>e.value).join(','))==='M1:w,AM1:y','πρόταση από το κύκλωμα: ταχύτητα πάνω από ρεύμα');
 await fc.selectOption('.loop[data-i="0"] [data-c="type"]','pi_nn');await fc.click('#apply');
 await fc.waitForFunction(()=>/Μπήκαν|err/.test(document.querySelector('#msg').textContent+document.querySelector('#msg').className),null,{timeout:120000});
 const cs=await p.evaluate(async()=>{await PyRT.load();const s=PCL.S.sim;s.run(0.06);return {pwm:PCL.editor.comp('PWM1').params.in_d,w:s.now('Y:M1'),ids:PCL.editor.doc.components.filter(c=>c.id.startsWith('AC')).length};});
 ok(cs.pwm==='AC2G:y'&&cs.ids===6&&cs.w>50,`σύνθεση: 6 μπλοκ, το PWM από τον βρόχο ρεύματος, ω = ${cs.w.toFixed(1)} rad/s στα 60 ms`);
 await p.waitForTimeout(900);ok(/u = \d/.test(await fc.$eval('#diagram',e=>e.textContent)),'διάγραμμα βρόχου με ζωντανές τιμές');
 await fc.fill('#tend','0.1');await fc.click('#compare');
 await fc.waitForFunction(()=>document.querySelectorAll('#out tbody tr').length>=3||/err/.test(document.querySelector('#msg').className),null,{timeout:300000});
 const rows=await fc.$$eval('#out tbody tr',x=>x.map(r=>[...r.cells].map(c=>c.textContent)));
 ok(rows.length===3&&rows[0][1]===rows[1][1],'σύγκριση: ο PI και το PI + NN χωρίς μάθηση δίνουν το ίδιο IAE ('+rows.map(r=>r[1]).join(' / ')+')');
 await p.screenshot({path:path.join(OUT,'addons_control.png')});
 ok(errs.length===0,'χωρίς σφάλματα JavaScript '+errs.join(' | '));
 await b.close();})().catch(e=>{console.error(e);process.exit(1);});
