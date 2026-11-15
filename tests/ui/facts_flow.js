// Browser check of 4.10: the two m-SSSC tutorials in the app. The single-phase one with its theory card (the line
// current, the injected voltage, X and V_C against the closed form), the detailed arm from the tutorial's option, and
// the three-phase one on the 150 kV network (the phasor solution of the card against the run, the three phases).
// 4.14: the MMC-HVDC link with its card (Model 4) and the energy per MVA for N = 400 and 20.
// 4.16: the LCC benchmark with its card (formulas and PSCAD), the average model.
// 4.17: the three-phase m-SSSC with the central controller (the default; the capacitor voltages of the three phases
// within 1.5 %) and the per-phase one of 4.10 from the option; the CCSC in boost (the line, capacitor and converter
// currents against the closed form); the IEEE 9 case in EMT with the m-SSSC before its step (against the load flow).
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
 assert(await p.evaluate(()=>!!window.PCL.editor.comp('SC3')),'the central controller by default');
 t0=Date.now();await runTo(0.7);R.wall3=(Date.now()-t0)/1000;R.three=await rowsOf(p);
 assert(R.three.length===8,'eight rows in the three-phase card (one X of the positive sequence) '+JSON.stringify(R.three));
 for(const r of R.three)assert(Math.abs(diff(r[3]))<(/V̄_C/.test(r[0])?1.5:3),'three phases, central: '+JSON.stringify(r));
 const th=await p.$eval('#theory',e=>e.textContent);assert(/μέσω του SSSC/.test(th)&&/pcl\.network/.test(th)&&/Κεντρικός ελεγκτής/.test(th),'phasor solution, the load flow and the central law in the card');
 await p.screenshot({path:OUT+'/sssc_3ph.png'});
 // the per-phase controller of 4.10 from the option: no central block, the same card
 await p.selectOption('#tut-options [data-topt="ctl"]','phase');await p.waitForTimeout(1500);
 assert(await p.evaluate(()=>!window.PCL.S.error&&!window.PCL.editor.comp('SC3')&&!!window.PCL.editor.comp('SCa')),'per-phase controllers chosen');
 await runTo(0.5);R.threePh=await rowsOf(p);
 assert(R.threePh.length===10,'ten rows with the per-phase controllers (X of each phase) '+JSON.stringify(R.threePh));
 for(const r of R.threePh.filter(r=>/\|I\|/.test(r[0])))assert(Math.abs(diff(r[3]))<3,'three phases, per phase: '+JSON.stringify(r));
 // 4.17: the CCSC in boost (22 Ω > X_C = 15 Ω, from 0.8 s): the capacitor carries (X/X_C)·I, the converter the opposite rest
 await p.goto(base+'?tutorial=ccsc_1ph');await p.waitForTimeout(1500);
 assert(await p.evaluate(()=>!window.PCL.S.error),'ccsc_1ph builds: '+await p.evaluate(()=>window.PCL.S.error));
 t0=Date.now();await runTo(1.05);R.wallCcsc=(Date.now()-t0)/1000;R.ccsc=await rowsOf(p);
 assert(R.ccsc.length===5,'five rows in the CCSC card '+JSON.stringify(R.ccsc));
 for(const r of R.ccsc)assert(Math.abs(diff(r[3]))<(/μετατροπέα/.test(r[0])?8:/V̄_C/.test(r[0])?5:3),'ccsc: '+JSON.stringify(r));
 assert(/boost/.test(await p.$eval('#theory',e=>e.textContent)),'boost named in the card');
 await p.screenshot({path:OUT+'/ccsc_1ph.png'});
 // 4.17: the IEEE 9 case with the m-SSSC on the line 7–6, before the step of X (0.4 s): the line current, the bus
 // voltages and the capacitor voltages against the load flow without compensation
 await p.goto(base+'?tutorial=ieee9_sssc');await p.waitForTimeout(2500);
 assert(await p.evaluate(()=>!window.PCL.S.error),'ieee9_sssc builds: '+await p.evaluate(()=>window.PCL.S.error));
 t0=Date.now();await runTo(0.35);R.wallIeee9=(Date.now()-t0)/1000;R.ieee9=await rowsOf(p);
 assert(R.ieee9.length===10,'ten rows in the IEEE 9 card '+JSON.stringify(R.ieee9));
 for(const r of R.ieee9.filter(r=>!/^X /.test(r[0])))assert(Math.abs(diff(r[3]))<(/V̄_C/.test(r[0])?2:1),'ieee9: '+JSON.stringify(r));
 await p.screenshot({path:OUT+'/ieee9_sssc.png'});
 // 4.14: the MMC-HVDC link (Model 4, the default): the card at 0.45 s (I_dc = P/V_dc, Î with the measured voltage, V_dc),
 // and the same energy per MVA for every N (C ∝ N)
 await p.goto(base+'?tutorial=hvdc_mmc');await p.waitForTimeout(1500);
 assert(await p.evaluate(()=>!window.PCL.S.error),'hvdc_mmc builds: '+await p.evaluate(()=>window.PCL.S.error));
 assert(await p.evaluate(()=>window.PCL.editor.comp('MMC1').params.model==='m4'),'Model 4 by default');
 t0=Date.now();await runTo(0.45);R.wallHvdc=(Date.now()-t0)/1000;R.hvdc=await rowsOf(p);
 assert(R.hvdc.length===4,'four rows in the HVDC card '+JSON.stringify(R.hvdc));
 for(const r of R.hvdc.slice(0,3))assert(Math.abs(diff(r[3]))<2,'hvdc: '+JSON.stringify(r));
 const kj=async()=>+((await p.$eval('#theory',e=>e.textContent)).match(/ενέργεια ([\d,]+) kJ\/MVA/)||[])[1]?.replace(',','.');
 R.kj400=await kj();await p.selectOption('#tut-options [data-topt="N"]','20');await p.waitForTimeout(1500);R.kj20=await kj();
 assert(R.kj400>25&&R.kj400<35&&Math.abs(R.kj20/R.kj400-1)<1e-3,'the same energy for N = 400 and 20: '+R.kj400+' '+R.kj20);
 await p.screenshot({path:OUT+'/hvdc_mmc.png'});
 // 4.16: the CIGRE HVDC benchmark (LCC) to the steady state: the card's formulas against the run, and the run against
 // the PSCAD results of the benchmark (the second table); the average model builds and runs
 await p.goto(base+'?tutorial=hvdc_lcc');await p.waitForTimeout(1500);
 assert(await p.evaluate(()=>!window.PCL.S.error),'hvdc_lcc builds: '+await p.evaluate(()=>window.PCL.S.error));
 t0=Date.now();await runTo(1.5);R.wallLcc=(Date.now()-t0)/1000;
 R.lcc=await p.$$eval('#theory table.cmp',ts=>ts.map(t=>[...t.querySelectorAll('tbody tr')].map(r=>[...r.cells].map(c=>c.textContent))));
 assert(R.lcc.length===2&&R.lcc[0].length===3&&R.lcc[1].length===6,'two tables in the LCC card '+JSON.stringify(R.lcc));
 for(const r of R.lcc[0])assert(Math.abs(diff(r[3]))<1.5,'lcc formulas: '+JSON.stringify(r));
 for(const r of R.lcc[1])assert(Math.abs(diff(r[3]))<2,'lcc against PSCAD: '+JSON.stringify(r));
 assert(/LCC-HVDC/.test(await p.$eval('#theory',e=>e.textContent)),'LCC badge');
 await p.screenshot({path:OUT+'/hvdc_lcc.png'});
 await p.selectOption('#tut-options [data-topt="model"]','avg');await p.waitForTimeout(1500);
 assert(await p.evaluate(()=>!window.PCL.S.error&&window.PCL.editor.comp('STR').params.model==='avg'),'average model chosen');
 await runTo(0.3);assert(await p.evaluate(()=>Number.isFinite(window.PCL.S.sim.now('Y:CR/KV'))),'average model runs');
 assert(!errs.length,'page errors: '+errs.join(' | '));
 fs.writeFileSync(OUT+'/facts_flow.json',JSON.stringify(R,null,1));console.log(JSON.stringify({ok:true,wallDet:R.wallDet,wall3:R.wall3,wallCcsc:R.wallCcsc,wallIeee9:R.wallIeee9,wallHvdc:R.wallHvdc,wallLcc:R.wallLcc}));await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
