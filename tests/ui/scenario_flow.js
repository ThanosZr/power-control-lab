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
 // 3.15: the page is cross-origin isolated (the server's headers), so the panel's sweeps go to the page's pool of solvers;
 // the bifurcation diagram as a sweep, Parquet and .mat downloads; the app's own diagram through the same pool, the same periods
 ok(await p.evaluate(()=>self.crossOriginIsolated),'η σελίδα είναι cross-origin isolated (SharedArrayBuffer)');
 await setCode("c = pcl.tutorial('pcm_chaos')\nb = c.bifurcation('IC.v', [1.5, 2, 2.5, 2.65, 3], channel='Y:AM1', stat='end', transient=300, record=64)\n"+
  "print('περίοδοι', b.period, 'workers', b.meta['workers'])\npcl.show(b, 'διακλάδωση')\nb.save('δ.parquet')\nb.save('δ.mat')\n"+
  "sw = pcl.tutorial('buck', start='steady').sweep({'R1.R': [5, 10, 20]}, t_end='2m', measure={'Vo': ('V:C1', 'avg', 5)})\nprint('σάρωση', sw.meta['workers'], len(sw.rows))\n");
 await p.click('#scen-run');await done();const o15=await p.$eval('#scen-out',e=>e.textContent);
 ok(/περίοδοι \[1, 2, 4, 8, 0\]/.test(o15),'διακλάδωση: 1T → 2T → 4T → 8T → χάος '+o15.slice(0,200));
 ok(/workers [1-9]/.test(o15)&&/σάρωση [1-9] 3/.test(o15),'διακλάδωση και σάρωση στο pool');
 ok(await p.$$eval('.scen-file a',x=>x.map(a=>a.getAttribute('download')).join(','))==='δ.parquet,δ.mat','λήψη .parquet και .mat');
 const pq=await p.evaluate(async()=>{const f=PCL.SCEN.files[0];const b=new Uint8Array(await f.blob.arrayBuffer());return String.fromCharCode(...b.slice(0,4))+String.fromCharCode(...b.slice(-4));});
 ok(pq==='PAR1PAR1','αρχείο Parquet');
 await p.evaluate(()=>PCL.loadTutorial('pcm_chaos'));await p.waitForTimeout(400);await p.evaluate(()=>{document.querySelector('#bf-block').open=true;});await p.waitForTimeout(400);
 const bf=await p.evaluate(async()=>{await PCL.runBifurcation();return {n:PCL.BF.pts.length,par:PCL.BF.par,per:PCL.BF.pts.map(x=>x.q.period).join('')};});
 ok(bf.n===65&&bf.par>=1&&/^1+2+4+8+0+$/.test(bf.per.replace(/(.)0+(?=.)/g,'$1')),'διάγραμμα της εφαρμογής μέσω pool: '+bf.per+' με '+bf.par+' workers');
 // 3.16: results in chunks and a run that continues from a saved state, in the panel; a sweep of a circuit with a Python
 // block goes to the pool too (each worker loads Python), with the same numbers as in order
 await setCode("p = pcl.tutorial('buck')\nT = p.channels()['T']\nn = 0\nfor c in p.stream(t_end=20 * T, chunk=5 * T, channels=['V:C1'], state='s.json'):\n    n += 1\n"+
  "r = p.run(t_end=30 * T, resume='s.json', channels=['V:C1'])\nf = p.run(t_end=30 * T, channels=['V:C1'])\nprint('κομμάτια', n, 'ίδια', r['V:C1'] == f['V:C1'][-len(r.t):])\n"+
  "q = pcl.tutorial('code_loop', ctrl='python')\nm = {'i': ('Y:AM1', 'avg', 5)}\nsw = q.sweep({'L1.L': ['100u', '150u', '220u']}, t_end='2m', measure=m)\nsq = q.sweep({'L1.L': ['100u', '150u', '220u']}, t_end='2m', measure=m, workers=1)\n"+
  "print('python στο pool', sw.meta['workers'], [x.get('error') for x in sw.rows], [x['i'] for x in sw.rows] == [x['i'] for x in sq.rows])\n");
 await p.click('#scen-run');await done();const o16=await p.$eval('#scen-out',e=>e.textContent);
 ok(/κομμάτια 4 ίδια True/.test(o16),'p.stream σε 4 κομμάτια, συνέχεια από την κατάσταση με ίδιους αριθμούς '+o16.slice(0,160));
 ok(/python στο pool [1-9] \[None, None, None\] True/.test(o16),'σάρωση κυκλώματος με μπλοκ Python στο pool, ίδια με τη σειριακή');
 ok(errs.length===0,'χωρίς σφάλματα JavaScript '+errs.join(' | '));
 await b.close();})();
