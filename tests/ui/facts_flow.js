// Browser check of 4.10: the two m-SSSC tutorials in the app. The single-phase one with its theory card (the line
// current, the injected voltage, X and V_C against the closed form), the detailed arm from the tutorial's option, and
// the three-phase one on the 150 kV network (the phasor solution of the card against the run, the three phases).
// No errors on the page. Needs Node + Playwright and the app's server.
// Usage: python run.py --no-browser --port 8765  then  node tests/ui/facts_flow.js http://127.0.0.1:8765/ <out-dir>
const {chromium}=require('playwright');const fs=require('fs');const OUT=process.argv[3]||'.';
const assert=(c,m)=>{if(!c)throw new Error('ASSERT: '+m);};
// the rows of the comparison table of the card: name → [theory, simulation, difference %]
const rowsOf=p=>p.$$eval('#theory table.cmp tbody tr',tr=>tr.map(r=>[...r.cells].map(c=>c.textContent)));
const diff=s=>parseFloat(String(s).replace(',','.').replace('−','-'));
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1500,height:1000}});const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(String(e.stack||e)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
 const base=process.argv[2];const R={};await p.goto(base);await p.evaluate(()=>localStorage.clear());
 const runTo=async T=>{await p.evaluate(T=>{const S=window.PCL.S;window.PCL.pause();S.sim.run(T-S.sim.t);window.PCL.renderTheory();},T);await p.waitForTimeout(600);};
 // single phase, +10 Ω: the card against I = 2V·sin(δ/2)/|R + j(X_L − X)|
 await p.goto(base+'?tutorial=sssc_1ph');await p.waitForTimeout(1500);
 assert(await p.evaluate(()=>!window.PCL.S.error),'sssc_1ph builds: '+await p.evaluate(()=>window.PCL.S.error));
 await p.evaluate(()=>{const s=document.querySelector('#tut-options [data-topt="X"]');s.value='cap';s.dispatchEvent(new Event('change'));});await p.waitForTimeout(1500);
 await runTo(0.7);R.one=await rowsOf(p);
 assert(R.one.length===4,'four rows in the single-phase card '+JSON.stringify(R.one));
 for(const r of R.one)assert(Math.abs(diff(r[3]))<3,'single phase: '+JSON.stringify(r));
 assert(/Αλλαγές κατάστασης υπομονάδων/.test(await p.$eval('#theory',e=>e.textContent)),'switching count in the card');
 // the detailed arm from the option (40 switches, 10 capacitors): the same current
 await p.selectOption('#tut-options [data-topt="impl"]','blocks');await p.waitForTimeout(1500);
 assert(await p.evaluate(()=>window.PCL.editor.comp('CH1').params.impl==='blocks'),'detailed arm chosen');
 let t0=Date.now();await runTo(0.7);R.wallDet=(Date.now()-t0)/1000;R.det=await rowsOf(p);
 for(const r of R.det)assert(Math.abs(diff(r[3]))<3,'detailed arm: '+JSON.stringify(r));
 // three phases, +10 Ω on the 150 kV network: the phasors of the card against the run
 await p.goto(base+'?tutorial=sssc_3ph');await p.waitForTimeout(1500);
 assert(await p.evaluate(()=>!window.PCL.S.error),'sssc_3ph builds: '+await p.evaluate(()=>window.PCL.S.error));
 await p.evaluate(()=>{const s=document.querySelector('#tut-options [data-topt="X"]');s.value='cap';s.dispatchEvent(new Event('change'));});await p.waitForTimeout(1500);
 t0=Date.now();await runTo(0.7);R.wall3=(Date.now()-t0)/1000;R.three=await rowsOf(p);
 assert(R.three.length===10,'ten rows in the three-phase card '+JSON.stringify(R.three));
 for(const r of R.three)assert(Math.abs(diff(r[3]))<(/V̄_C/.test(r[0])?8:3),'three phases: '+JSON.stringify(r));
 const th=await p.$eval('#theory',e=>e.textContent);assert(/μέσω του SSSC/.test(th)&&/pcl\.network/.test(th),'phasor solution and the load flow in the card');
 await p.screenshot({path:OUT+'/sssc_3ph.png'});
 assert(!errs.length,'page errors: '+errs.join(' | '));
 fs.writeFileSync(OUT+'/facts_flow.json',JSON.stringify(R,null,1));console.log(JSON.stringify({ok:true,wallDet:R.wallDet,wall3:R.wall3}));await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
