// Browser check of the "Σενάρια" panel (3.14, ROADMAP §30): Python in a worker with the pcl package, tables, charts,
// files, errors with the line, stop, code that came with a file, a circuit with a Python block.
// Usage: python run.py --no-browser --port 8765  then  node tests/ui/scenario_flow.js http://127.0.0.1:8765/ <out-dir>
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');const os=require('os');const OUT=process.argv[3]||'.';
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1500,height:1200}});const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(String(e.stack||e)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
 const ok=(c,msg)=>{if(!c){console.error('FAIL: '+msg);process.exitCode=1;}else console.log('ok: '+msg);};
 const done=()=>p.waitForFunction(()=>!document.querySelector('#scen-run').disabled,null,{timeout:240000});
 const setCode=async c=>{await p.fill('#scen-code',c);};
 await p.goto(process.argv[2]);await p.waitForSelector('#scen');await p.evaluate(()=>{localStorage.clear();});await p.reload();await p.waitForSelector('#scen');
 await p.click('#scen summary');
 // 1) the default example: a sweep of L in the buck with the theory
 await p.click('#scen-run');await done();
 ok(/✓/.test(await p.$eval('#scen-state',e=>e.textContent)),'σάρωση του buck: τελείωσε');
 ok(await p.$$eval('.scen-tbl tbody tr',x=>x.length)===6,'πίνακας με 6 σημεία');
 ok(await p.$$eval('.scen-plot',x=>x.length)===3,'γραφήματα: Vo, dI, προσομοίωση/θεωρία');
 const csv=await p.evaluate(async()=>{const a=document.querySelector('.scen-file a'),f=window.PCL.SCEN.files[0];return a&&f?{name:a.getAttribute('download'),text:await f.blob.text()}:null;});
 ok(csv&&csv.name==='κυμάτωση.csv'&&csv.text.split('\n').some(l=>l.startsWith('L1.L,Vo,dI')),'αρχείο CSV για λήψη');
 const th=await p.evaluate(()=>{const rows=[...document.querySelectorAll('.scen-tbl tbody tr')].map(r=>[...r.cells].map(c=>+c.textContent.replace(',','.')));return rows.map(([L,vo,di])=>Math.abs(di-vo*.5/(L*1e5))/(vo*.5/(L*1e5)));});
 ok(th.every(e=>e<.03),'κυμάτωση στο 3 % της θεωρίας: '+th.map(e=>(100*e).toFixed(2)+'%').join(' '));
 await (await p.$('#scen-card')).screenshot({path:OUT+'/scenario_panel.png'});
 // 2) the current circuit and the step example
 await p.selectOption('#scen-ex','step');await p.click('#scen-run');await done();
 ok(await p.$$eval('.scen-tbl tbody tr',x=>x.length)===2,'σταθερό και μεταβλητό βήμα: δύο γραμμές');
 // 3) an error carries the line of the script
 await setCode("x = 1\npcl.set('Q9.R', 1)\n");await p.click('#scen-run');await done();
 const err=await p.$eval('#scen-out',e=>e.textContent);ok(/γραμμή 2/.test(err)&&/Δεν υπάρχει στοιχείο/.test(err),'σφάλμα με τη γραμμή: '+err.trim().slice(0,90));
 // 4) stop an endless script
 await setCode('while True:\n    pass\n');await p.click('#scen-run');await p.waitForTimeout(1500);await p.click('#scen-stop');
 ok(/Διακόπηκε/.test(await p.$eval('#scen-out',e=>e.textContent))&&!(await p.$eval('#scen-run',e=>e.disabled)),'διακοπή');
 // 5) a circuit with a Python block runs in the same worker
 await setCode("m = {'i': ('Y:AM1', 'avg', 20)}\na = pcl.tutorial('code_loop', ctrl='python').run(t_end='4m', measure=m)\nb = pcl.tutorial('code_loop', ctrl='pib').run(t_end='4m', measure=m)\nprint('διαφορά', abs(a.measured['i'] - b.measured['i']), a.measured['i'])\n");
 await p.click('#scen-run');await done();const out=await p.$eval('#scen-out',e=>e.textContent),dm=/διαφορά (\S+) (\S+)/.exec(out);
 ok(dm&&+dm[1]<1e-6&&+dm[2]>1,'μπλοκ Python μέσα σε σενάριο, ίδιο με το μπλοκ PI: '+out.trim().slice(0,70));
 // 6) code that came with a file asks before it runs
 const f=path.join(os.tmpdir(),'pcl_scen_'+Date.now()+'.json');
 const pr=await p.evaluate(()=>JSON.parse(localStorage.getItem('pcl2-state')));pr.scenario="print('από αρχείο')\n";fs.writeFileSync(f,JSON.stringify(pr));
 await p.setInputFiles('#file',f);await p.waitForTimeout(800);
 ok(await p.$eval('#scen-code',e=>e.value)===pr.scenario,'ο κώδικας του αρχείου στον επεξεργαστή');
 let asked=0;p.once('dialog',d=>{asked++;d.dismiss();});await p.click('#scen-run');await p.waitForTimeout(500);
 ok(asked===1&&!/από αρχείο/.test(await p.$eval('#scen-out',e=>e.textContent)),'ερώτηση πριν από κώδικα αρχείου (άκυρο: δεν τρέχει)');
 p.once('dialog',d=>{asked++;d.accept();});await p.click('#scen-run');await done();
 ok(asked===2&&/από αρχείο/.test(await p.$eval('#scen-out',e=>e.textContent)),'μετά την επιβεβαίωση τρέχει');
 fs.unlinkSync(f);
 ok(errs.length===0,'χωρίς σφάλματα JavaScript '+errs.join(' | '));
 await b.close();})();
