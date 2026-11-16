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
 console.log(JSON.stringify({rm:rm.split('\n').slice(0,4),bt:bt.split('\n').slice(0,4),imp},null,1));
 console.log('ERR',errs);console.log(fail.length?'FAIL '+fail.join(' | '):'PASS');await b.close();process.exit(fail.length||errs.length?1:0);})();
