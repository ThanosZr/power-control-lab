// Browser check of: response metrics, server reference solver overlay, data
// templates in the math panel, new tutorials and "open in studio" from /converter/.
// 4.17: the Ćuk in closed loop with the gains from the circuit (the card, the live panel, the list of roles of the PWM).
// 4.17.1: the inputs of the circuit in the parameters panel (list, change of a value, a parameter «= …», the toggle ⇥).
// Usage: python run.py --no-browser --port 8775  then  node tests/ui/features_flow.js http://127.0.0.1:8775/
const {chromium}=require('playwright');
(async()=>{const U=process.argv[2]||'http://127.0.0.1:8775/';const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1500,height:1100},acceptDownloads:true});const p=await ctx.newPage();
 const errs=[],fail=[];p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
 const ok=(c,msg)=>{if(!c)fail.push(msg);};
 await p.goto(U);await p.evaluate(()=>localStorage.clear());
 // voltage loop: run to the end, metrics panel, server comparison
 await p.goto(U+'?tutorial=buck_vloop');await p.waitForTimeout(1200);await p.click('#toend');
 await p.waitForFunction(()=>window.PCL.S.sim.t>=0.0179,null,{timeout:90000});await p.waitForTimeout(500);
 await p.click('#rm-block summary');await p.waitForTimeout(300);const rm=await p.$eval('#rm-out',e=>e.innerText);
 ok(/Υπερύψωση/.test(rm)&&/IAE/.test(rm),'metrics panel');
 await p.click('#bt-block summary');await p.selectOption('#bt-method','LSODA');await p.click('#bt-run');
 await p.waitForFunction(()=>!document.querySelector('#bt-run').disabled,null,{timeout:120000});
 const bt=await p.$eval('#bt-out',e=>e.innerText);ok(/Σύγκριση με LSODA/.test(bt),'batch table');
 const refs=await p.evaluate(()=>Object.keys(window.PCL.scope.refs?.data||{}).length);ok(refs>=3,'overlay traces');
 const dv=await p.evaluate(()=>{const B=window.PCL.S.batch;const t=B.data['V:C1'].t,y=B.data['V:C1'].y;return Math.abs(y[y.length-1]-window.PCL.S.sim.now('V:C1'));});ok(dv<0.05,'batch vs browser end value '+dv);
 const th=await p.$eval('#theory',e=>e.innerText);ok(/υπερύψωση/.test(th),'theory metrics');
 // theory card warns when the circuit no longer matches the tutorial, and restores it
 await p.evaluate(()=>window.PCL.loadTutorial('buck',{}));await p.waitForTimeout(1500);
 ok(!(await p.$('#theory .th-warn')),'no warning on the tutorial circuit');
 await p.evaluate(()=>{const e=window.PCL.editor;const w=e.doc.wires.find(w=>w.a.c==='D1'||w.b.c==='D1');e.select([],[w.id]);e.deleteSel();});await p.waitForTimeout(2500);
 const warn=await p.$eval('#theory',e=>e.querySelector('.th-warn')?.innerText||'');ok(/δεν είναι πια αυτό του tutorial/.test(warn),'stale theory warning');
 await p.click('#theory [data-th-restore]');await p.waitForTimeout(1500);ok(!(await p.$('#theory .th-warn')),'restore removes the warning');
 // data template for the battery
 await p.evaluate(()=>window.PCL.loadTutorial('battery',{}));await p.waitForTimeout(2500);
 const opts=await p.$$eval('#math-tpl option',o=>o.map(x=>x.value));ok(opts.includes('pe2_battery_data')&&opts.includes('pe2_battery'),'template choices '+opts);
 await p.selectOption('#math-tpl','pe2_battery_data');await p.waitForTimeout(1500);
 const kv=await p.$eval('#math .kv',e=>e.innerText);ok(/223,2 A/.test(kv),'template ripple');
 await p.fill('[data-tin="L"]','10u');await p.dispatchEvent('[data-tin="L"]','change');await p.waitForTimeout(1500);
 ok(/125 A/.test(await p.$eval('#math .kv',e=>e.innerText)),'template input edit');
 // new tutorials run and compare with theory
 for(const [id,o] of [['scr1',{alpha:'30'}],['bridge3',{dev:'60',load:'rl'}],['flyback',{lk:'clamp'}]]){await p.evaluate(([id,o])=>window.PCL.loadTutorial(id,o),[id,o]);await p.waitForTimeout(400);
  await p.evaluate(()=>{const S=window.PCL.S;S.sim.run(S.sim.T*(S.sim.T>1e-3?4:300));window.PCL.pause();});await p.waitForTimeout(600);
  const t=await p.$eval('#theory',e=>e.innerText);ok(/Προσομοίωση/.test(t)&&!/Προσομοίωση\s*\n?\s*—/.test(t.split('Διαφορά')[1]?.slice(0,30)||''),'theory '+id);}
 // exercise 2: sampling on the carrier, theory card, live parameters panel, changes → program
 await p.evaluate(()=>window.PCL.loadTutorial('sampling',{case:'tri2'}));await p.waitForTimeout(1500);
 await p.evaluate(()=>{const S=window.PCL.S;S.sim.run(S.sim.T*50);window.PCL.pause();});await p.waitForTimeout(800);
 const smp=await p.$eval('#theory',e=>e.textContent);ok(/Δείγματα έως t101101/.test(smp),'sampling counts in theory');ok(/Τελευταία δείγματα/.test(smp),'sample table');
 ok(await p.evaluate(()=>!document.querySelector('#live-panel').hidden&&!!document.querySelector('#live-controls [data-trig="SH1"]')),'live panel with S&H');
 await p.evaluate(()=>{const r=document.querySelector('[data-d="PWM1"]');r.value=0.51;r.dispatchEvent(new Event('input'));r.dispatchEvent(new Event('change'));});
 await p.evaluate(()=>{const S=window.PCL.S;S.sim.run(S.sim.T*4);window.PCL.pause();});
 ok(await p.evaluate(()=>window.PCL.S.sim.changes.length===1&&!!document.querySelector('#lp-sched')),'change recorded');
 await p.click('#lp-sched');await p.waitForTimeout(500);ok(/0:0\.5, 0\.0025:0\.51/.test(await p.evaluate(()=>window.PCL.editor.comp('PWM1').params.dsched)),'changes → D(t) program');
 await p.click('#lp-toggle');ok(await p.evaluate(()=>document.querySelector('#live-panel').hidden),'panel hides');await p.click('#lp-toggle');
 const mt=await p.$$eval('#math-tpl option',o=>o.map(x=>x.value));ok(mt[0]==='pe2_sampling','sampling template first '+mt);
 // exercise 2: polyphase design, theory card and the group live control
 await p.evaluate(()=>window.PCL.loadTutorial('polyphase',{N:'4',vst:'mid'}));await p.waitForTimeout(1500);
 await p.evaluate(()=>{const S=window.PCL.S;S.sim.run(S.sim.T*20);window.PCL.pause();window.PCL.renderTheory?.();});await p.waitForTimeout(1200);
 const pt=await p.$eval('#theory',e=>e.textContent);ok(/Δi_Σ p-p12 A12 A/.test(pt),'polyphase summed ripple');ok(/ακυρώσεις \(N·D ακέραιος\) στα 66,67 V, 100 V/.test(pt),'cancellation points');
 await p.click('[data-ilv="common"]');await p.evaluate(()=>{const S=window.PCL.S;S.sim.run(S.sim.T*10);window.PCL.pause();});
 ok(await p.evaluate(()=>{const q=window.PCL.S.sim.lastPeriod('I:VB');return Math.abs(q.max-q.min-180)<0.5&&[1,2,3,4].every(k=>window.PCL.editor.comp('PWM'+k).params.phase===0);}),'live in-phase toggle');
 ok((await p.$$eval('#math-tpl option',o=>o.map(x=>x.value)))[0]==='pe2_polyphase','polyphase template first');
 // gate pulses: a lane per leg in the default scope, and the "all pulses" button rebuilds it
 const lanes=()=>p.evaluate(()=>window.PCL.scope.cfg.panes.filter(q=>q.ch.length&&q.ch.every(c=>c.key.startsWith('GS:'))).map(q=>q.ch.map(c=>c.key).join(',')));
 ok((await lanes()).join()==='GS:S21,GS:S22,GS:S23,GS:S24','pulse lanes by default');
 await p.evaluate(()=>{for(const k of [1,2,3,4])window.PCL.scope.removeChannel('GS:S2'+k);});ok(!(await lanes()).length,'lanes removed');
 await p.click('[data-ilv="shift"]');await p.click('[data-pulse-all]');await p.evaluate(()=>{const S=window.PCL.S;S.sim.run(S.sim.T*3);window.PCL.pause();window.PCL.scope.cfg.window={unit:'T',n:2};window.PCL.scope.draw();});
 ok((await lanes()).join()==='GS:S21,GS:S22,GS:S23,GS:S24','pulse button → lanes');await p.waitForTimeout(300);await (await p.$('#scope-card')).screenshot({path:'pulse_lanes.png'});
 // CSV reference: export the scope, import it back, and compare (differences ~0)
 await p.click('#cr-block summary');const [dl]=await Promise.all([p.waitForEvent('download'),p.click('#csv')]);await p.setInputFiles('#cr-file',await dl.path());await p.waitForTimeout(400);
 await p.click('#cr-apply');await p.waitForTimeout(600);const cr=await p.$eval('#cr-out',e=>e.textContent);ok(/Σύγκριση με CSV/.test(cr)&&/i_Σ \(ζυγός\)/.test(cr),'CSV reference table');
 ok(await p.evaluate(()=>Object.keys(window.PCL.scope.refs?.data||{}).length>=4),'CSV overlay');
 // prediction questions in the math panel (sampling exercise, sawtooth)
 await p.evaluate(()=>window.PCL.loadTutorial('sampling',{case:'saw'}));await p.waitForTimeout(2000);
 await p.evaluate(()=>{const S=window.PCL.S;S.sim.run(S.sim.T*51);window.PCL.pause();});
 await p.waitForSelector('#math .qcard[data-q="value"]',{timeout:15000});
 await p.fill('#math .qcard[data-q="value"] [data-qin]','-800');await p.click('#math .qcard[data-q="value"] [data-qcheck]');
 ok(/μέση τιμή/.test(await p.$eval('#math .qcard[data-q="value"] .qfb',e=>e.textContent)),'typical mistake feedback');
 await p.fill('#math .qcard[data-q="value"] [data-qin]','-911.6');await p.click('#math .qcard[data-q="value"] [data-qcheck]');
 const qv=await p.$eval('#math .qcard[data-q="value"] .qfb',e=>e.textContent);ok(/✓ Σωστό/.test(qv)&&/Στην προσομοίωση/.test(qv),'correct answer + simulation '+qv.slice(0,80));
 ok(/Σωστές 1 από 6/.test(await p.$eval('#math .qprog',e=>e.textContent)),'progress');
 await p.click('#math .qcard[data-q="count"] [data-qshow]');ok(/Στην προσομοίωση: 50/.test(await p.$eval('#math .qcard[data-q="count"] .qfb',e=>e.textContent)),'solution with simulated count');
 await p.click('#math .qcard[data-q="where"] input[value="1"]');await p.click('#math .qcard[data-q="where"] [data-qcheck]');ok(/✗/.test(await p.$eval('#math .qcard[data-q="where"] .qfb',e=>e.textContent)),'choice feedback');
 await p.click('#math [data-qreset]');ok(/Σωστές 0 από 6/.test(await p.$eval('#math .qprog',e=>e.textContent)),'progress reset');
 // open a /converter/ circuit in the studio
 await p.goto(U+'converter/');await p.waitForTimeout(800);await p.click('.topo-switch button[data-key="boost"]');
 await p.waitForFunction(()=>!state.dirty&&state.result?.config?.topology==='boost',null,{timeout:20000});
 const [q]=await Promise.all([ctx.waitForEvent('page'),p.click('#to-studio')]);await q.waitForLoadState();await q.waitForTimeout(1500);
 const imp=await q.evaluate(()=>({tut:window.PCL.S.tut.id,n:window.PCL.editor.doc.components.length,err:window.PCL.S.error}));ok(imp.tut==='boost'&&imp.n>=8&&!imp.err,'import '+JSON.stringify(imp));
 ok(!(await q.$('#theory .th-warn')),'imported circuit is its own reference');
 // 4.17: the Ćuk with «PI με κέρδη από το κύκλωμα»: negative gains, the card with the design and V_o at the reference,
 // the list of roles in the parameters of the PWM, a change of C2 that recomputes the gains
 await p.goto(U+'?tutorial=cuk');await p.waitForTimeout(1200);
 await p.selectOption('#tut-options [data-topt="ctrl"]','pi');await p.waitForTimeout(1500);
 const g0=await p.evaluate(()=>{const k=window.PCL.S.sim.net.ctrls[0];return {Ki:k.Ki,Kp:k.Kp,des:!!k.design,err:window.PCL.S.error,w:window.PCL.S.sim.net.warnings};});
 ok(g0.des&&g0.Ki<0&&!g0.err&&!g0.w.length,'cuk PI from the circuit '+JSON.stringify(g0));
 await p.evaluate(()=>{const S=window.PCL.S;window.PCL.pause();S.sim.run(0.03-S.sim.t);window.PCL.renderTheory();});await p.waitForTimeout(600);
 const cth=await p.$eval('#theory',e=>e.textContent),crow=await p.$$eval('#theory table.cmp tbody tr',tr=>tr.map(r=>[...r.cells].map(c=>c.textContent)));
 ok(/Κέρδη από το κύκλωμα/.test(cth)&&/G\(0\)/.test(cth)&&/περιθώριο φάσης/.test(cth),'cuk card with the design');
 const vo=crow.find(r=>r[0]==='V_o');ok(vo&&Math.abs(parseFloat(vo[3].replace(',','.').replace('−','-')))<1.5,'cuk V_o at the reference '+JSON.stringify(vo));
 ok(/Από το κύκλωμα \(Ćuk/.test(await p.$eval('#live-panel, #lp-body, body',e=>e.textContent)),'live panel: gains from the circuit');
 await p.evaluate(()=>{const e=window.PCL.editor;e.select(['PWM1'],[]);});await p.waitForTimeout(400);
 const pp=await p.evaluate(()=>document.querySelector('#props-body')?.textContent||'');
 ok(!pp||(/Ρόλος L1/.test(pp)&&/Ρόλος C2/.test(pp)),'roles in the parameters of the PWM');
 const Ki1=g0.Ki,Ki2=await (async()=>{await p.evaluate(()=>window.PCL.editor.setParams('C2',{C:470e-6}));await p.waitForTimeout(1000);return p.evaluate(()=>window.PCL.S.sim.net.ctrls[0].Ki);})();
 ok(Number.isFinite(Ki2)&&Math.abs(Ki2/Ki1-1)>0.01,'gains recomputed after a change of C2 '+Ki1+' '+Ki2);
 // 4.17.1: the buck: its inputs in the parameters of the circuit; a new value of V_in from there; R = 2·V_in as a
 // parameter «= …» (its value next to the field, the solver's R); the toggle ⇥ of an input in the part's panel
 await p.goto(U+'?tutorial=buck');await p.waitForTimeout(1200);
 await p.evaluate(()=>{const el=document.querySelector('#props');if(el.classList.contains('collapsed'))document.querySelector('#props-btn').click();window.PCL.editor.select([],[]);});await p.waitForTimeout(500);
 const ip=await p.evaluate(()=>({txt:document.querySelector('#props-body')?.textContent||'',names:[...document.querySelectorAll('#props-body [data-inname]')].map(e=>e.value)}));
 ok(/Είσοδοι του κυκλώματος/.test(ip.txt)&&JSON.stringify(ip.names)===JSON.stringify(['Vin','L1','C1','R','fs','D']),'inputs of the buck '+JSON.stringify(ip.names));
 await p.evaluate(()=>{const el=document.querySelector('#props-body [data-inval="V1|V"]');el.value='48';el.dispatchEvent(new Event('change'));});await p.waitForTimeout(800);
 const vin=await p.evaluate(()=>window.PCL.editor.comp('V1').params.V);ok(vin===48,'V_in from the inputs panel '+vin);
 await p.evaluate(()=>window.PCL.editor.setParams('R1',{R:'=2*Vin'}));await p.waitForTimeout(1000);
 const rd=await p.evaluate(()=>{const d=window.PCL.S.sim.net.inputs?.derived?.find(q=>q.id==='R1');const el=window.PCL.S.sim.net.els.find(e=>e.k==='G'&&Math.abs(e.R-96)<1e-9);return {v:d?.value,el:!!el};});
 ok(rd.v===96&&rd.el,'R = 2·V_in in the solver '+JSON.stringify(rd));
 await p.evaluate(()=>window.PCL.editor.select(['R1'],[]));await p.waitForTimeout(500);
 const rp=await p.evaluate(()=>({txt:document.querySelector('#props-body')?.textContent||'',on:!!document.querySelector('#props-body [data-inp-k="R"].on')}));
 ok(/= 96/.test(rp.txt)&&rp.on,'the value of R = 2·V_in and the toggle in the panel of R1 '+JSON.stringify({on:rp.on}));
 await p.evaluate(()=>document.querySelector('#props-body [data-inp-k="R"]').click());await p.waitForTimeout(500);
 ok(await p.evaluate(()=>!(window.PCL.editor.comp('R1').inp||[]).includes('R')),'the toggle removes the input');
 // 4.19.1 (ROADMAP §68 point 6): a study of a network on the engine from its tutorial (load flow, N−1, optimal power flow), what the engine
 // proposed and why, and the report as one HTML file («Εξαγωγή αναφοράς»)
 await p.evaluate(()=>window.PCL.loadTutorial('pf_study'));await p.waitForTimeout(900);
 ok(await p.evaluate(()=>!!document.querySelector('#theory [data-study="run"]')&&!!document.querySelector('#theory [data-study="report"]')&&!!window.PCL.editor.comp('M87A')&&!!window.PCL.editor.comp('M5V')),
  'study: the card with its two buttons, and instruments at two points of the drawing');
 await p.click('#theory [data-study="run"]');await p.waitForSelector('#study-result',{timeout:30000});
 const st1=await p.evaluate(()=>({adv:document.querySelector('#study-advice').textContent,sum:window.PCL.STUDY.r.summary}));
 ok(/πυκνός Newton–Raphson/.test(st1.adv)&&st1.sum.converged&&st1.sum.method==='nr_dense'&&Math.abs(st1.sum.losses_MW-4.641)<0.01,'study: load flow of IEEE 9 on the engine, with the proposal and its reason '+JSON.stringify(st1.sum).slice(0,160));
 await p.evaluate(()=>window.PCL.loadTutorial('pf_study',{net:'ieee118',study:'n1',method:'auto'}));await p.waitForTimeout(900);
 await p.click('#theory [data-study="run"]');await p.waitForFunction(()=>!window.PCL.STUDY.busy&&window.PCL.STUDY.r?.study==='n1',null,{timeout:60000});
 const st2=await p.evaluate(()=>window.PCL.STUDY.r.summary);
 ok(st2.outages===186&&st2.islands===9&&st2.failed===0&&st2.solved===177&&st2.chord===177&&st2.newton===0&&/LODF/.test(st2.why),'study: N−1 in AC on IEEE 118, every outage on the factors of the base case '+JSON.stringify(st2).slice(0,200));
 // 4.19.2 (ROADMAP §68 point 5): the choices of a study. A neural starting point for the optimal power flow (the solver verifies: the
 // same cost in fewer iterations), and the batch of N−1 on GPU* (experimental: without a card it runs on the CPU and says why)
 await p.evaluate(()=>window.PCL.loadTutorial('opf_study',{net:'ieee14',kind:'opf',limits:'yes',start:'nn',emt:'lf'}));await p.waitForTimeout(900);
 await p.click('#theory [data-study="run"]');await p.waitForFunction(()=>!window.PCL.STUDY.busy&&window.PCL.STUDY.r?.study==='opf'&&window.PCL.STUDY.r.summary.start,null,{timeout:60000});
 const st4=await p.evaluate(()=>({s:window.PCL.STUDY.r.summary,txt:document.querySelector('#study-start')?.textContent||''}));
 ok(st4.s.start==='warm'&&st4.s.iterations<=6&&Math.abs(st4.s.cost-8081.53)<0.01&&/από την πρόταση του νευρωνικού/.test(st4.txt),'study: the optimal power flow of IEEE 14 from the neural start, '+st4.s.iterations+' iterations, the same cost '+st4.s.cost);
 await p.evaluate(()=>window.PCL.loadTutorial('pf_study',{net:'ieee14',study:'n1',method:'auto',backend:'gpu'}));await p.waitForTimeout(900);
 await p.click('#theory [data-study="run"]');await p.waitForFunction(()=>!window.PCL.STUDY.busy&&window.PCL.STUDY.r?.study==='n1'&&window.PCL.STUDY.r.summary.outages===20,null,{timeout:60000});
 const st5=await p.evaluate(()=>({s:window.PCL.STUDY.r.summary,b:document.querySelector('#study-backend')?.textContent||'',g:document.querySelector('#study-gpu')?.textContent||''}));
 ok(st5.s.solved===19&&(st5.s.backend==='gpu'||/CPU, γιατί/.test(st5.b))&&/πειραματικό/.test(st5.g)&&/python -m pcl accel/.test(st5.g),
  'study: N−1 with «GPU*» '+(st5.s.backend==='gpu'?'on the device':'on the CPU, with the reason')+', and the footnote of the experimental path');
 await p.evaluate(()=>window.PCL.loadTutorial('opf_study',{net:'case30',kind:'opf',limits:'yes',emt:'opf'}));await p.waitForTimeout(900);
 const [dlr]=await Promise.all([p.waitForEvent("download",{timeout:60000}),p.click("#theory [data-study=\"report\"]")]);
 const rep=require("fs").readFileSync(await dlr.path(),"utf8"),st3=await p.evaluate(()=>window.PCL.STUDY.r.summary);
 ok(dlr.suggestedFilename()==="report_case30_opf.html"&&/<svg/.test(rep)&&/id="pcl-report"/.test(rep)&&/Βέλτιστη ροή φορτίου \(AC\)/.test(rep)&&/Περιορισμοί που δεσμεύουν/.test(rep)&&!/<script src|https?:\/\//.test(rep),
  'study: «Εξαγωγή αναφοράς» gives one self-contained HTML file ('+rep.length+' bytes)');
 ok(Math.abs(st3.cost-576.89)<0.01&&st3.flow_limits===41&&st3.binding>=3&&await p.evaluate(()=>/report_case30_opf\.html/.test(document.querySelector('#study-file')?.textContent||'')),'study: optimal power flow of the 30-bus case, cost '+st3.cost);
 // the EMT of the drawing from the optimal dispatch of IEEE 9: the generators give the powers of the OPF (89,80 / 134,32 / 94,19 MW)
 await p.click('#play');await p.waitForTimeout(1500);await p.click('#play');
 const pg=await p.evaluate(()=>['G1','G2','G3'].map(g=>window.PCL.S.sim.now('Y:'+g+':pe')));
 ok(Math.abs(pg[0]-0.898)<2e-3&&Math.abs(pg[1]-1.3432)<2e-3&&Math.abs(pg[2]-0.9419)<2e-3,'study: the EMT starts from the optimal dispatch '+pg.map(x=>x.toFixed(4)).join(' '));
 // 4.19.4 (ROADMAP §73): «Διάγραμμα του δικτύου» shows the network that is studied, with layers from the result of the study
 await p.evaluate(()=>window.PCL.loadTutorial('pf_study',{net:'ieee300',study:'pf',method:'auto'}));await p.waitForTimeout(900);
 const tv0=Date.now();await p.click('#theory [data-study="view"]');await p.waitForFunction(()=>!document.querySelector('#netview').hidden&&window.PCL.NV.v&&window.PCL.NV.v.state.frames>0,null,{timeout:60000});const tv=Date.now()-tv0;
 const ink=()=>p.evaluate(()=>{const c=document.querySelector('#nv-canvas'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=0;i<d.length;i+=4)if(d[i]<235||d[i+1]<235||d[i+2]<235)n++;return n/(d.length/4);});
 const nv1=await p.evaluate(()=>{const v=window.PCL.NV.v;return {title:document.querySelector('#nv-title').textContent,layers:[...document.querySelectorAll('#nv-layer option')].map(o=>o.value),layer:v.state.layer,sel:document.querySelector('#nv-layer').value,
   drawn:v.state.drawn,legend:document.querySelectorAll('#nv-legend i').length,summary:!!document.querySelector('#study-result'),r:window.PCL.STUDY.r?.study};}),ink1=await ink();
 ok(/ieee300/.test(nv1.title)&&/300 ζυγοί, 411 κλάδοι/.test(nv1.title)&&nv1.layer==='voltage'&&nv1.sel==='voltage'&&nv1.layers.join()==='base,voltage,angle,flow,violations'&&nv1.drawn.buses===300&&nv1.drawn.branches===411&&nv1.legend===7&&nv1.summary&&nv1.r==='pf',
  'network view: the button runs the study and opens the 300-bus network on its voltages ('+tv+' ms, '+JSON.stringify(nv1.drawn)+')');
 ok(ink1>0.01&&ink1<0.6,'network view: the canvas has a picture ('+(100*ink1).toFixed(1)+' % of its pixels)');
 await p.selectOption('#nv-layer','flow');await p.waitForTimeout(150);
 const nv2=await p.evaluate(()=>({layer:window.PCL.NV.v.state.layer,legend:document.querySelector('#nv-legend').textContent}));
 ok(nv2.layer==='flow'&&/MW/.test(nv2.legend),'network view: the layer of the flows, with its legend ('+nv2.legend.slice(0,60)+')');
 await p.fill('#nv-find','9533');await p.press('#nv-find','Enter');await p.waitForTimeout(200);
 const nv3=await p.evaluate(()=>{const v=window.PCL.NV.v;return {hit:v.state.hit?.bus?.id,px:v.state.tr.s*v.model.v.unit,info:document.querySelector('#nv-info').textContent,names:v.state.drawn.names,buses:v.state.drawn.buses,bad:document.querySelector('#nv-find').classList.contains('bad')};});
 ok(nv3.hit==='9533'&&nv3.px>=70-1e-9&&/^Ζυγός 9533/.test(nv3.info)&&nv3.names>0&&nv3.names===nv3.buses&&nv3.buses<300&&!nv3.bad,'network view: a bus by its name, close enough for the names of its neighbours ('+nv3.buses+' buses in the window): '+nv3.info);
 await p.fill('#nv-find','no such bus');await p.press('#nv-find','Enter');
 ok(await p.evaluate(()=>document.querySelector('#nv-find').classList.contains('bad')),'network view: a name that is not a bus is marked');
 const cb=await p.evaluate(()=>{const r=document.querySelector('#nv-canvas').getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2,r.width,r.height];});
 await p.mouse.move(cb[0]+cb[2]*0.45,cb[1]+cb[3]*0.45);await p.mouse.move(cb[0],cb[1]);await p.waitForTimeout(150);
 const s0=await p.evaluate(()=>window.PCL.NV.v.state.tr.s);await p.mouse.wheel(0,-300);await p.waitForTimeout(150);
 const nv4=await p.evaluate(()=>({s:window.PCL.NV.v.state.tr.s,info:document.querySelector('#nv-info').textContent,cur:document.querySelector('#nv-canvas').style.cursor}));
 ok(/^Ζυγός 9533/.test(nv4.info)&&nv4.cur==='pointer'&&nv4.s>s0*1.5,'network view: the pointer over a bus gives its values, the wheel zooms in ('+(nv4.s/s0).toFixed(2)+' times)');
 await p.mouse.down();await p.mouse.move(cb[0]+80,cb[1]+40,{steps:4});await p.mouse.up();await p.waitForTimeout(150);
 const nv5=await p.evaluate(()=>{const v=window.PCL.NV.v,i=v.model.ix.get('9533');return [(v.model.x[i]-v.state.tr.cx)*v.state.tr.s,(v.model.y[i]-v.state.tr.cy)*v.state.tr.s];});
 ok(Math.abs(nv5[0]-80)<2&&Math.abs(nv5[1]-40)<2,'network view: dragging moves the network with the pointer ('+nv5.map(x=>x.toFixed(1)).join(', ')+' px)');
 await p.click('#nv-fit');await p.selectOption('#nv-names','on');await p.waitForTimeout(150);
 ok(await p.evaluate(()=>{const d=window.PCL.NV.v.state.drawn;return d.buses===300&&d.names===300;}),'network view: «Όλο το δίκτυο» and the names of all 300 buses when asked');
 const [dsv]=await Promise.all([p.waitForEvent('download',{timeout:60000}),p.click('#nv-svg')]),svgT=require('fs').readFileSync(await dsv.path(),'utf8');
 ok(dsv.suggestedFilename()==='network_ieee300_pf_flow.svg'&&/^<\?xml/.test(svgT)&&(svgT.match(/<line /g)||[]).length>=411&&/MW/.test(svgT),'network view: the layer on the screen as an SVG file ('+svgT.length+' bytes)');
 const [ddx]=await Promise.all([p.waitForEvent('download',{timeout:60000}),p.click('#nv-dxf')]),dxfT=require('fs').readFileSync(await ddx.path(),'utf8');
 ok(ddx.suggestedFilename()==='network_ieee300_pf.dxf'&&/^0\nSECTION/.test(dxfT)&&/\n0\nEOF\n$/.test(dxfT)&&/\nBUSES\n/.test(dxfT)&&/\nFLOW_MW\n/.test(dxfT),'network view: the drawing as a DXF file with its CAD layers ('+dxfT.length+' bytes)');
 await p.click('#nv-close');
 ok(await p.evaluate(()=>document.querySelector('#netview').hidden&&window.PCL.NV.v===null),'network view: the window closes and the viewer is released');
 // 4.19.4 (ROADMAP §73, decision 273): a network from a file instead of the list of the tutorial, and changes of it from the picture.
 // The file is written by the engine from one of its own networks (the 30-bus case with ratings), as a MATPOWER case
 await p.evaluate(()=>window.PCL.loadTutorial('pf_study',{net:'ieee14',study:'pf',method:'auto'}));await p.waitForTimeout(900);
 const mtxt=await p.evaluate(async()=>{const r=await fetch('/api/network_save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({case:'case30',format:'matpower'})});return (await r.json()).text;});
 await p.setInputFiles('#study-open',{name:'my grid 30.m',mimeType:'text/plain',buffer:Buffer.from(mtxt)});
 await p.waitForSelector('#study-filenet',{timeout:30000});
 const nf1=await p.evaluate(()=>({t:document.querySelector('#study-filenet').textContent,badge:document.querySelector('#theory .tm').textContent,s:window.PCL.STUDY.file.summary}));
 ok(/my grid 30\.m/.test(nf1.t)&&/30 ζυγοί, 41 κλάδοι, 6 γεννήτριες/.test(nf1.t)&&/όρια σε 41 κλάδους/.test(nf1.t)&&/my grid 30 \(από αρχείο\)/.test(nf1.badge)&&nf1.s.warnings.length===0,'network file: a MATPOWER case opens in the study card ('+nf1.t.trim().slice(0,90)+')');
 await p.click('#theory [data-study="run"]');await p.waitForFunction(()=>!window.PCL.STUDY.busy&&window.PCL.STUDY.r?.study==='pf',null,{timeout:60000});
 const nf2=await p.evaluate(()=>window.PCL.STUDY.r);
 ok(nf2.summary.converged&&nf2.network.buses===30&&nf2.network.name==='my grid 30'&&Math.abs(nf2.summary.losses_MW-2.4438)<1e-3,'network file: the load flow runs on the network of the file (losses '+nf2.summary.losses_MW.toFixed(4)+' MW)');
 await p.setInputFiles('#study-open',{name:'broken.m',mimeType:'text/plain',buffer:Buffer.from('this is not a network')});await p.waitForSelector('#study-error',{timeout:30000});
 for(let i=errs.length-1;i>=0;i--)if(/status of 400/.test(errs[i]))errs.splice(i,1);   // the refusal asked for just above is a 400 of the server, which the browser also writes on its console
 ok(/mpc\.bus/.test(await p.textContent('#study-error'))&&await p.evaluate(()=>window.PCL.STUDY.file.fileName==='my grid 30.m'),'network file: a file that is not a network is refused with the reason, and the open network stays');
 await p.click('#theory [data-study="view"]');await p.waitForFunction(()=>!document.querySelector('#netview').hidden&&window.PCL.NV.v&&window.PCL.NV.v.state.frames>0,null,{timeout:60000});
 const nvAt=(kind,name)=>p.evaluate(([kind,name])=>{const v=window.PCL.NV.v,m=v.model,r=document.querySelector('#nv-canvas').getBoundingClientRect(),t=v.state.tr;
   if(kind==='bus'){const i=m.ix.get(name);return [r.left+(m.x[i]-t.cx)*t.s+v.state.w/2,r.top+(m.y[i]-t.cy)*t.s+v.state.h/2];}
   const j=m.v.branches.findIndex(e=>e.name===name);return [r.left+((m.x1[j]+m.x2[j])/2-t.cx)*t.s+v.state.w/2,r.top+((m.y1[j]+m.y2[j])/2-t.cy)*t.s+v.state.h/2];},[kind,name]);
 const nvDone=n=>p.waitForFunction(n=>!window.PCL.STUDY.busy&&window.PCL.STUDY.view&&window.PCL.STUDY.view.done.length===n&&window.PCL.NV.v&&window.PCL.NV.v.state.frames>0,n,{timeout:60000});
 let xy=await nvAt('bus','8');await p.mouse.click(xy[0],xy[1]);await p.waitForSelector('#nv-edit [data-nv="P"]');
 const ed1=[await p.inputValue('#nv-edit [data-nv="P"]'),await p.inputValue('#nv-edit [data-nv="Q"]')],v8a=await p.evaluate(()=>{const d=window.PCL.STUDY.view,L=d.layers.find(q=>q.layer==='voltage');return L.bus_v[d.view.buses.findIndex(b=>b.id==='8')];});
 await p.fill('#nv-edit [data-nv="P"]','45');await p.click('#nv-apply');await nvDone(1);
 const ed2=await p.evaluate(()=>({chips:document.querySelector('#nv-edits').textContent,P:document.querySelector('#nv-edit [data-nv="P"]')?.value,edits:JSON.stringify(window.PCL.STUDY.edits)}));
 ok(ed1.join()==='30,30'&&/Αλλαγές στο δίκτυο \(1\)/.test(ed2.chips)&&/30 MW και 30 Mvar → 45 MW και 30 Mvar/.test(ed2.chips)&&ed2.P==='45'&&ed2.edits==='[{"op":"load","bus":"8","P_MW":45,"Q_Mvar":30}]','network changes: the load of a bus from its panel, and the study runs again ('+ed2.chips.trim().slice(0,80)+')');
 const tr0=await p.evaluate(()=>{const v=window.PCL.NV.v;v.zoom(1.7,200,150);return JSON.stringify(v.state.tr);});
 xy=await nvAt('branch','br10');await p.mouse.click(xy[0],xy[1]);await p.waitForSelector('#nv-edit [data-nv="off"]');
 const ed3=await p.inputValue('#nv-edit [data-nv="rating"]');await p.check('#nv-edit [data-nv="off"]');await p.click('#nv-apply');await nvDone(2);
 const ed4=await p.evaluate(()=>{const d=window.PCL.STUDY.view,L=d.layers.find(q=>q.layer==='voltage'),v=window.PCL.NV.v;return {v8:L.bus_v[d.view.buses.findIndex(b=>b.id==='8')],drawn:v.state.drawn,nbr:d.view.branches.length,tr:JSON.stringify(v.state.tr),off:d.view.branches.filter(e=>e.off).map(e=>e.name).join(),
   checked:document.querySelector('#nv-edit [data-nv="off"]')?.checked,losses:window.PCL.STUDY.r.summary.losses_MW};});
 ok(ed3==='32'&&ed4.off==='br10'&&ed4.drawn.off===1&&ed4.nbr===41&&ed4.checked===true&&ed4.v8<v8a-0.05,'network changes: a branch out of service stays in the picture, dashed; the voltage of bus 8 falls from '+v8a+' to '+ed4.v8+' pu ('+ed3+', '+ed4.off+', '+JSON.stringify(ed4.drawn)+', '+ed4.checked+')');
 ok(ed4.tr===tr0,'network changes: the picture stays where it was (the same zoom and place after the study runs again)');
 await p.fill('#nv-edit [data-nv="rating"]','abc').catch(()=>{});xy=await nvAt('bus','1');await p.mouse.click(xy[0],xy[1]);await p.waitForSelector('#nv-edit .nv-gen');
 const ed5=await p.evaluate(()=>({t:document.querySelector('#nv-edit').textContent,gP:!!document.querySelector('#nv-edit [data-nv="gP"]'),gV:document.querySelector('#nv-edit [data-nv="gV"]')?.value}));
 ok(/ζυγός ταλάντωσης/.test(ed5.t)&&!ed5.gP&&ed5.gV==='1','network changes: the slack bus offers its voltage, not its active power');
 await p.click('[data-nv-drop="1"]');await nvDone(1);
 const ed6=await p.evaluate(()=>({off:window.PCL.STUDY.view.view.branches.filter(e=>e.off).length,n:window.PCL.STUDY.edits.length,dash:window.PCL.NV.v.state.drawn.off||0}));
 ok(ed6.off===0&&ed6.n===1&&ed6.dash===0,'network changes: one change is undone by its own ✕, the branch is back');
 const [dnet]=await Promise.all([p.waitForEvent('download',{timeout:60000}),(async()=>{await p.selectOption('#nv-savefmt','matpower');await p.click('#nv-save');})()]),netT=require('fs').readFileSync(await dnet.path(),'utf8');
 ok(dnet.suggestedFilename()==='my_grid_30.m'&&/mpc\.bus = \[/.test(netT)&&/\n\t8\t1\t45\.0\t30\.0\t/.test(netT),'network changes: «Δίκτυο» saves the changed network as a file (bus 8 with 45 MW)');
 await p.click('#nv-close');
 const [drep2]=await Promise.all([p.waitForEvent('download',{timeout:60000}),p.click('#theory [data-study="report"]')]),rep2=require('fs').readFileSync(await drep2.path(),'utf8');
 ok(drep2.suggestedFilename()==='report_my_grid_30_pf.html'&&/Αλλαγές στο δίκτυο πριν από τη μελέτη \(1\)/.test(rep2)&&/45 MW και 30 Mvar/.test(rep2),'network changes: the report of the study says what was changed');
 ok(/1<\/b> αλλαγή από το διάγραμμα/.test(await p.innerHTML('#study-edits')),'network changes: the card says that the network is studied with a change');
 await p.click('#theory [data-study="noedits"]');await p.click('#theory [data-study="close"]');await p.waitForTimeout(200);
 ok(await p.evaluate(()=>window.PCL.STUDY.file===null&&window.PCL.STUDY.edits.length===0&&!document.querySelector('#study-filenet')&&/ieee14/.test(document.querySelector('#theory .tm').textContent)),'network file: «✕» goes back to the network of the tutorial, without changes');
 await p.evaluate(()=>window.PCL.loadTutorial('pf_study',{net:'ieee118',study:'n1',method:'auto'}));await p.waitForTimeout(900);
 await p.click('#theory [data-study="view"]');await p.waitForFunction(()=>!document.querySelector('#netview').hidden&&window.PCL.NV.v&&window.PCL.NV.v.state.frames>0,null,{timeout:60000});
 const nv6=await p.evaluate(()=>({layer:window.PCL.NV.v.state.layer,layers:window.PCL.NV.v.layers().map(q=>q.layer).join(),title:document.querySelector('#nv-title').textContent,legend:document.querySelector('#nv-legend').textContent}));
 ok(nv6.layer==='n1'&&nv6.layers==='base,n1'&&/N−1 σε AC/.test(nv6.title)&&/118 ζυγοί, 186 κλάδοι/.test(nv6.title),'network view: the outages of N−1 on the 118-bus network ('+nv6.legend.slice(0,70)+')');
 await p.click('#nv-close');
 // 4.19.3 (ROADMAP §68, decision 264): a large network in the time domain. The 8 × 8 mesh (573 unknowns, over 4000 channels): the
 // sparse solver and the sparse phasor start, the record buffers sized by memory, a steady start, the two new settings in the
 // panel; and the 1354-bus case in the list of the studies
 await p.evaluate(()=>window.PCL.loadTutorial('big_grid',{k:'8',ev:'none'}));await p.waitForTimeout(1500);
 const bg0=await p.evaluate(()=>{const s=window.PCL.S.sim,q=s.solverInfo();return {n:q.n,kind:q.kind,keys:s.keys.length,init:s.initSolver,cap:s.ring.cap,per:s.per.cap,err:window.PCL.S.error||null,note:s.memNote||''};});
 ok(!bg0.err&&bg0.n===564&&bg0.kind==='sparse'&&bg0.init==='sparse'&&bg0.keys>4000&&bg0.cap<20000&&bg0.cap>=500&&/κανάλια/.test(bg0.note),
  'big network: the 8 × 8 mesh, '+bg0.n+' unknowns, sparse solver and sparse start, '+bg0.keys+' channels with '+bg0.cap+' points each');
 await p.click('#play');await p.waitForFunction(()=>window.PCL.S.sim.t>0.045,null,{timeout:120000});await p.click('#play');
 const bg1=await p.evaluate(()=>{const s=window.PCL.S.sim,k=s.keys.filter(q=>/^V:H\d+_\d+\/Ca1$/.test(q)),Vb=150e3*Math.SQRT2/Math.sqrt(3);let mn=Infinity,mx=0;
  for(const q of k){const m=s.lastPeriod(q);if(!m)continue;const pk=Math.max(Math.abs(m.min),Math.abs(m.max))/Vb;mn=Math.min(mn,pk);mx=Math.max(mx,pk);}return {mn,mx,t:s.t,st:s.solverInfo().stats};});
 ok(bg1.mn>0.95&&bg1.mx<1.02&&bg1.st.full>=1,'big network: after '+(bg1.t*1e3).toFixed(0)+' ms every bus between '+bg1.mn.toFixed(3)+' and '+bg1.mx.toFixed(3)+' pu');
 await p.click('#canvas',{position:{x:6,y:6}});await p.waitForTimeout(400);
 const bg2=await p.evaluate(()=>{const q=k=>!!document.querySelector('[data-solve="'+k+'"]');return {mv:q('modeVec'),is:q('initSolver')};});
 ok(bg2.mv&&bg2.is,'big network: the settings «Ιδιοδιανύσματα του ελέγχου βήματος» and «Αρχικοποίηση με φασιθέτες» are in the panel');
 const bg3=await p.evaluate(()=>{const t=window.Tutorials.get('pf_study'),u=window.Tutorials.get('opf_study'),has=x=>x.options.find(o=>o.k==='net').options.some(o=>o[0]==='pegase1354');return has(t)&&has(u);});
 ok(bg3,'big network: the 1354-bus case is in the lists of the load flow and of the optimal power flow');
 // 4.19.4 (ROADMAP §75): the optimal power flow with security against every single outage, from the card to the picture
 await p.evaluate(()=>{document.querySelector('#netview').hidden=true;window.PCL.loadTutorial('opf_study',{net:'case30',kind:'scopf'});});await p.waitForTimeout(700);
 await p.click('#theory [data-study="run"]');await p.waitForSelector('#study-sec',{timeout:60000});
 const sc1=await p.evaluate(()=>{const z=window.PCL.STUDY.r.summary.security;return {txt:document.querySelector('#study-sec').parentElement.innerText,z};});
 ok(sc1.z.secure&&sc1.z.outages===38&&sc1.z.rounds===1&&sc1.z.constraints===1&&Math.abs(sc1.z.cost_security-0.1468)<5e-4&&/ασφαλής κατανομή/.test(sc1.txt)&&/br35 όταν χάνεται ο br36/.test(sc1.txt),
  'secure dispatch: the 30-bus case, one constraint (br35 at the loss of br36), '+sc1.z.cost_security.toFixed(4)+' per hour more');
 ok(/Έλεγχος με ροή φορτίου AC/.test(sc1.txt)&&sc1.z.ac.overloads===1,'secure dispatch: the card says what the AC load flow of the dispatch finds ('+sc1.z.ac.worst_branch+' at '+(100*sc1.z.ac.worst_loading).toFixed(1)+' %)');
 await p.click('#theory [data-study="view"]');await p.waitForFunction(()=>!document.querySelector('#netview').hidden&&window.PCL.NV.v&&window.PCL.NV.v.state.layer==='security'&&window.PCL.NV.v.state.frames>0,null,{timeout:60000});
 const sc2=await p.evaluate(()=>({layer:document.querySelector('#nv-layer').value,legend:document.querySelector('#nv-legend').textContent,title:document.querySelector('#nv-title').textContent}));
 ok(sc2.layer==='security'&&/%/.test(sc2.legend),'secure dispatch: the picture opens on the layer of the security ('+sc2.legend.slice(0,50)+')');
 await p.evaluate(()=>{document.querySelector('#netview').hidden=true;window.PCL.loadTutorial('opf_study',{net:'ieee14',kind:'scopf'});});await p.waitForTimeout(700);
 await p.click('#theory [data-study="run"]');await p.waitForSelector('#study-error',{timeout:60000});
 ok(/ονομαστική ισχύ/.test(await p.evaluate(()=>document.querySelector('#study-error').textContent)),'secure dispatch: a network without ratings is refused with the reason');
 for(let i=errs.length-1;i>=0;i--)if(/status of 400/.test(errs[i]))errs.splice(i,1);   // the refusal asked for just above
 // 4.19.5 (ROADMAP §77): the continuation load flow, from the card to the picture
 await p.evaluate(()=>{document.querySelector('#netview').hidden=true;window.PCL.loadTutorial('cpf_study',{});});await p.waitForTimeout(700);
 await p.click('#theory [data-study="run"]');await p.waitForSelector('#study-cpf',{timeout:60000});
 const cp1=await p.evaluate(()=>{const z=window.PCL.STUDY.r.summary;return {txt:document.querySelector('#study-result').innerText,z,pv:!!document.querySelector('#study-pv path.map'),dot:document.querySelectorAll('#study-pv circle').length};});
 ok(cp1.z.converged&&cp1.z.kind==='fold'&&Math.abs(cp1.z.lambda-0.777995)<1e-5&&Math.abs(cp1.z.margin_MW-201.5)<0.01&&cp1.z.bus==='14'&&/λ = 0,778/.test(cp1.txt)&&/μύτη/.test(cp1.txt)&&/ζυγός 2 στο λ = 0,0769/.test(cp1.txt),
  'continuation load flow: IEEE 14 with reactive limits, the nose at λ = '+cp1.z.lambda.toFixed(4)+', '+cp1.z.margin_MW.toFixed(1)+' MW of margin, weakest bus '+cp1.z.bus);
 ok(cp1.pv&&cp1.dot===1,'continuation load flow: the card draws the P–V curve of the weakest bus with the nose marked');
 await p.click('#theory [data-study="view"]');await p.waitForFunction(()=>!document.querySelector('#netview').hidden&&window.PCL.NV.v&&window.PCL.NV.v.state.layer==='collapse'&&window.PCL.NV.v.state.frames>0,null,{timeout:60000});
 const cp2=await p.evaluate(()=>({layers:[...document.querySelectorAll('#nv-layer option')].map(o=>o.value),legend:document.querySelector('#nv-legend').textContent}));
 ok(cp2.layers.join()==='base,voltage,angle,collapse'&&/pu/.test(cp2.legend)&&/Ευστάθεια τάσης/.test(cp2.legend),'continuation load flow: the picture opens on the layer of the voltage stability ('+cp2.legend.slice(0,60)+')');
 await p.evaluate(()=>{document.querySelector('#netview').hidden=true;window.PCL.loadTutorial('cpf_study',{net:'ieee9',qlim:'yes',grow:'all'});});await p.waitForTimeout(700);
 await p.click('#theory [data-study="run"]');await p.waitForFunction(()=>window.PCL.STUDY.r&&window.PCL.STUDY.r.summary&&window.PCL.STUDY.r.summary.kind==='limit',null,{timeout:60000});
 const cp3=await p.evaluate(()=>({txt:document.querySelector('#study-result').innerText,z:window.PCL.STUDY.r.summary}));
 ok(Math.abs(cp3.z.lambda-1.565583)<1e-5&&cp3.z.last==='2'&&/γωνία, όχι μύτη/.test(cp3.txt)&&/άμεση αστάθεια/.test(cp3.txt),'continuation load flow: IEEE 9 with reactive limits ends on a corner at the limit of bus 2 (λ = '+cp3.z.lambda.toFixed(4)+')');
 // 4.19.5 (ROADMAP §78): the sweep with compensation in the list of methods; where it does not converge the card says so
 await p.evaluate(()=>window.PCL.loadTutorial('pf_study',{net:'ieee14',study:'pf',method:'sweepc'}));await p.waitForTimeout(900);
 await p.click('#theory [data-study="run"]');await p.waitForFunction(()=>!window.PCL.STUDY.busy&&window.PCL.STUDY.r?.summary?.method==='sweepc',null,{timeout:60000});
 const sw1=await p.evaluate(()=>({txt:document.querySelector('#study-result').innerText,z:window.PCL.STUDY.r.summary}));
 ok(sw1.z.converged&&sw1.z.iterations===18&&Math.abs(sw1.z.losses_MW-13.393)<0.01&&/Σύγκλιση σε 18 επαναλήψεις με εμπρός–πίσω σάρωση με αντιστάθμιση/.test(sw1.txt),'sweep with compensation: IEEE 14 in '+sw1.z.iterations+' iterations, losses '+sw1.z.losses_MW.toFixed(3)+' MW');
 await p.evaluate(()=>window.PCL.loadTutorial('pf_study',{net:'ieee118',study:'pf',method:'sweepc'}));await p.waitForTimeout(900);
 await p.click('#theory [data-study="run"]');await p.waitForFunction(()=>!window.PCL.STUDY.busy&&window.PCL.STUDY.r?.summary?.method==='sweepc'&&window.PCL.STUDY.r.summary.converged===false,null,{timeout:60000});
 const sw2=await p.evaluate(()=>document.querySelector('#study-result').innerText);
 ok(/Δεν συνέκλινε/.test(sw2)&&/σάρωση με αντιστάθμιση/.test(sw2),'sweep with compensation: IEEE 118 does not converge and the card says so');
 // 4.19.4 (ROADMAP §74): the third exercise from plain blocks
 await p.evaluate(()=>window.PCL.loadTutorial('current_ctl',{}));await p.waitForTimeout(700);await p.click('#toend');
 await p.waitForFunction(()=>window.PCL.S.sim&&window.PCL.S.sim.t>=0.01599,null,{timeout:120000});await p.waitForTimeout(600);
 const cc=await p.evaluate(()=>{const s=window.PCL.S.sim;return {hold:s.now('H:SHi'),mean:s.lastPeriod('I:L1').avg,warn:s.net.warnings.length,card:document.querySelector('#theory').innerText};});
 ok(cc.warn===0&&Math.abs(cc.hold-cc.mean)<0.02&&Math.abs(cc.mean-25)<0.5&&/Κλειστός βρόχος/.test(cc.card)&&/Αποκατάσταση/.test(cc.card),
  'exercise 3 from blocks: the sample is the mean with the triangle ('+cc.hold.toFixed(3)+' and '+cc.mean.toFixed(3)+' A), the card measures the response');
 console.log(JSON.stringify({rm:rm.split('\n').slice(0,4),bt:bt.split('\n').slice(0,4),imp},null,1));
 console.log('ERR',errs);console.log(fail.length?'FAIL '+fail.join(' | '):'PASS');await b.close();process.exit(fail.length||errs.length?1:0);})();
