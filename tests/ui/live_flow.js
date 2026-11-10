// Live parameters, event log, units and B1 blocks in the studio (3.19, ROADMAP §3–§5): a pinned parameter with a ramp,
// live changes written as a program that replays the same run, the event log card (kinds, filter, rows), the types of
// the ports in the parameter panel, the 📌 offered only for live parameters, the units setting, a B1 block placed and
// run. Needs Node + Playwright.
// Usage: python run.py --no-browser --port 8765  then  node tests/ui/live_flow.js http://127.0.0.1:8765/ <out-dir>
const {chromium}=require('playwright');const OUT=process.argv[3]||'.';
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1500,height:1000}});const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(String(e.stack||e)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
 const base=process.argv[2];await p.goto(base);await p.evaluate(()=>localStorage.clear());await p.goto(base+'?tutorial=buck');await p.waitForTimeout(1000);
 const R={};
 // 1. the event log: run 1 ms, open the card, the kinds and the rows; the filter by source
 R.ev=await p.evaluate(()=>{PCL.reset();PCL.S.sim.run(1e-3);const d=document.querySelector('#ev-block');d.open=true;PCL.renderEvents();
  const rows=document.querySelectorAll('#ev-out .ev-table tr').length-1,kinds=[...document.querySelectorAll('#ev-kind option')].map(o=>o.value).filter(Boolean);
  document.querySelector('#ev-src').value='S1';PCL.renderEvents();const only=[...document.querySelectorAll('#ev-out .ev-table td:nth-child(3)')].every(t=>/S1/.test(t.textContent));
  return {rows,kinds,only,n:PCL.S.sim.events().n};});
 await p.screenshot({path:OUT+'/live_events.png'});
 // 2. pin the load R1.R, give it a ramp of 5000 Ω/s and set 5 Ω: the solver ramps it (program entries), the panel shows it
 R.ramp=await p.evaluate(()=>{const E=PCL.editor;PCL.togglePin('R1','R');const c=E.comp('R1');c.liveRate={R:5000};PCL.refreshControls();
  const inp=document.querySelector('#live-controls [data-pv="R1|R"]');inp.value='5';inp.dispatchEvent(new Event('change'));
  const s=PCL.S.sim,n0=s.prog.length;s.run(2e-4);const mid=+s.project.components.find(q=>q.id==='R1').params.R;s.run(2e-3);
  return {n0,mid,end:+s.project.components.find(q=>q.id==='R1').params.R,rate:document.querySelector('#live-controls [data-prate="R1|R"]')?.value,marks:s.changes.length};});
 // 3. live changes → a program, then ⟲ replays the same run: the same i_L at the same time
 R.replay=await p.evaluate(()=>{const E=PCL.editor;PCL.reset();const s=PCL.S.sim;s.run(1e-3);
  const c=E.comp('R1');delete c.liveRate;c.params.R=8;PCL.S.sim.load(E.export(),false);s.markChange({id:'R1',k:'R',v:8,label:'R1: R → 8',from:'5'});
  s.run(1e-3);const live=s.now('I:L1'),t=s.t;PCL.changesToSchedule();const prog=(E.doc.program||[]).map(e=>[e.id,e.k,e.v]);
  PCL.reset();PCL.S.sim.run(t);return {live,again:PCL.S.sim.now('I:L1'),prog,base:E.comp('R1').params.R};});
 // 4. the parameter panel: types of the ports of a voltmeter; no 📌 on a structural parameter (inputs of a Mux)
 await p.goto(base+'?tutorial=bus_dq');await p.waitForTimeout(1000);
 R.panel=await p.evaluate(()=>{const E=PCL.editor;const pk=E.doc.components.find(c=>c.type==='PARK');E.select([pk.id],[]);PCL.renderProps();
  const txt=document.querySelector('#props')?.innerText||document.body.innerText;const mx=E.addPart('MUX',100,100);E.select([mx.id],[]);PCL.renderProps();
  const pins=[...document.querySelectorAll('[data-pin-k]')].map(b=>b.dataset.pinK);return {types:/Μονάδες και τύποι θυρών/.test(txt),dq:/dq/.test(txt),muxPins:pins};});
 await p.screenshot({path:OUT+'/live_types.png'});
 // 5. a B1 block from scratch: a 2nd-order low-pass on a step, its value on the drawing
 await p.goto(base+'?tutorial=empty');await p.waitForTimeout(700);
 R.b1=await p.evaluate(()=>{const E=PCL.editor;E.doc.components=E.doc.components.filter(c=>c.type!=='PWM');const K=E.addPart('CONST',100,100),F=E.addPart('F2',200,100);
  E.setParams(K.id,{v:'0:0, 0.0002:1'});E.setParams(F.id,{f0:5000,zeta:.3});E.doc.wires.push({id:E.newId('w'),a:{c:K.id,p:'y'},b:{c:F.id,p:'u'},pts:[]});E.render();E.changed('struct');
  PCL.reset();PCL.S.sim.run(2e-3);return {y:PCL.S.sim.now('Y:'+F.id),label:document.querySelector(`[data-id="${F.id}"] .val`)?.textContent||'',error:PCL.S.error};});
 R.errs=errs;console.log(JSON.stringify(R));
 const ok=R.ev.rows>0&&R.ev.kinds.includes('switch')&&R.ev.kinds.includes('duty')&&R.ev.only&&R.ramp.n0>=1&&R.ramp.mid>5&&R.ramp.mid<10&&R.ramp.end===5&&R.ramp.rate==='5k'&&
  Math.abs(R.replay.live-R.replay.again)<1e-12&&R.replay.prog.length===1&&R.panel.types&&R.panel.dq&&!R.panel.muxPins.includes('n')&&Math.abs(R.b1.y-1)<1e-3&&!R.b1.error&&!errs.length;
 console.log(ok?'PASS':'FAIL');await b.close();process.exit(ok?0:1);})();
