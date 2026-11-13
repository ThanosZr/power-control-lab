// The electric vehicle (4.8, tutorial ev_drive) in the app and a long run: its tiles (the mode, the weights, the energy
// metrics), ▶ in the worker without an end, the mode changed live from its tile, «⭳ σε αρχείο» writing every point of the
// scope's signals to a file while it runs (no gaps, t increasing), the memory of a point per ms, the AI block whose
// reference repeats (it runs past the old 6.4 s), the generator with its AVR, PSS and governor and the inside of the AVR (4.8.1), and no errors. Needs Node + Playwright and the app's server.
// Usage: python run.py --no-browser --port 8765  then  node tests/ui/ev_flow.js http://127.0.0.1:8765/ <out-dir>
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');const OUT=process.argv[3]||'.';
const assert=(c,m)=>{if(!c)throw new Error('ASSERT: '+m);};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1500,height:1000}});const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(String(e.stack||e)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
 const base=process.argv[2];await p.goto(base);await p.evaluate(()=>localStorage.clear());await p.goto(base+'?tutorial=ev_drive');await p.waitForTimeout(1500);
 const R={};
 // 1. the tutorial: tiles of the mode and the weights by the controller, the metrics in the panel, no end, a point per ms
 R.open=await p.evaluate(()=>({pinned:[...document.querySelectorAll('.wtl .wt .wt-n')].map(e=>e.textContent),panel:[...document.querySelectorAll('#watch-panel .wp-body .wt .wt-n')].map(e=>e.textContent),
  stopT:PCL.S.stopT,res:document.querySelector('#rec-res').value,note:document.querySelector('#rec-note').textContent,recDt:PCL.S.sim.opts.recDt,
  ch:PCL.scope.channels().map(c=>c.key),warn:PCL.S.sim.net.warnings}));
 assert(R.open.pinned.join('|')==='Τρόπος','the mode by the controller '+R.open.pinned);
 assert(['Βάρος ταχύτητας','Βάρος ροπής','Βάρος ενέργειας','ταχύτητα (km/h)','SOC','km/kWh','Wh/km','N·m/kW'].every(n=>R.open.panel.includes(n)),'weights and metrics in the panel '+R.open.panel);
 assert(R.open.stopT===0&&+R.open.res===1e-3&&R.open.recDt===1e-3&&/μνήμη ≈/.test(R.open.note),'no end, a point per ms '+JSON.stringify(R.open));
 assert(R.open.ch.includes('Y:M1')&&R.open.ch.includes('Y:SOC')&&!R.open.warn.length,'scope '+JSON.stringify(R.open.ch));
 // 2. ▶ in the worker, then «⭳ σε αρχείο» while it runs
 await p.click('#play');await p.waitForTimeout(1500);
 R.run1=await p.evaluate(()=>({t:PCL.S.sim.t,live:!!window.Live?.active}));assert(R.run1.live&&R.run1.t>1,'runs in the worker '+JSON.stringify(R.run1));
 await p.click('#rec-file');await p.waitForFunction(()=>PCL.REC.on,null,{timeout:5000});
 R.rec0=await p.evaluate(()=>({name:PCL.REC.name,path:PCL.REC.path,t:PCL.S.sim.t,btn:document.querySelector('#rec-file').textContent}));
 // 3. the mode from its tile (eco) while it runs: a change of the library part, the states kept
 await p.waitForTimeout(1200);
 R.mode=await p.evaluate(()=>{const tile=[...document.querySelectorAll('.wtl .wt')].find(e=>e.querySelector('.wt-n').textContent==='Τρόπος'),sel=tile.querySelector('select');
  const w=PCL.S.sim.now('Y:M1');sel.value='eco';sel.dispatchEvent(new Event('change',{bubbles:true}));return {w,mode:PCL.editor.comp('MO1').params.mode,opts:[...sel.options].map(o=>o.value)};});
 await p.waitForTimeout(1500);
 R.mode2=await p.evaluate(()=>({t:PCL.S.sim.t,w:PCL.S.sim.now('Y:M1'),chg:(PCL.S.sim.changes||[]).map(c=>[c.id,c.k,c.v]),kwh:[...document.querySelectorAll('#watch-panel .wt')].find(e=>e.querySelector('.wt-n').textContent==='km/kWh').querySelector('.wt-x').textContent}));
 assert(R.mode.mode==='eco'&&R.mode.opts.join()==='balanced,eco,performance','mode tile '+JSON.stringify(R.mode));
 assert(R.mode2.chg.some(c=>c[0]==='MO1'&&c[1]==='mode'&&c[2]==='eco')&&Number.isFinite(R.mode2.w),'live change of the mode '+JSON.stringify(R.mode2));
 assert(/\d/.test(R.mode2.kwh),'km/kWh shown '+R.mode2.kwh);
 await p.waitForTimeout(1500);
 await p.click('#rec-file');await p.waitForFunction(()=>!PCL.REC.on,null,{timeout:10000});
 R.rec1=await p.evaluate(()=>({t:PCL.S.sim.t,lost:PCL.REC.lost,bytes:PCL.REC.bytes,btn:document.querySelector('#rec-file').textContent}));
 await p.click('#play');await p.waitForTimeout(300);
 R.list=await p.evaluate(async()=>(await (await fetch('/api/record',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({op:'list'})})).json()));
 assert(R.list.files.includes(R.rec0.name),'the file is listed '+JSON.stringify(R.list));
 // 4. the file: the header of the scope's channels, a row per ms from the start of the recording, t increasing, no gaps
 {const txt=fs.readFileSync(path.join(R.list.folder,R.rec0.name),'utf8').trim().split('\n');const head=txt[0].split(','),rows=txt.slice(1).map(l=>l.split(',').map(Number));
  const ts=rows.map(r=>r[0]),d=ts.slice(1).map((t,k)=>t-ts[k]);
  R.file={head,n:rows.length,t0:ts[0],t1:ts[ts.length-1],dmin:Math.min(...d),dmax:Math.max(...d),cols:new Set(rows.map(r=>r.length)).size,nan:rows.some(r=>r.some(v=>Number.isNaN(v)))};}
 assert(R.file.head[0]==='t (s)'&&R.file.head.length===R.open.ch.length+1,'header '+R.file.head);
 assert(R.file.cols===1&&!R.file.nan,'rows of numbers '+JSON.stringify(R.file));
 assert(R.file.dmin>0&&R.file.dmax<1.5e-3+1e-9&&R.rec1.lost===0,'a row per ms, no gaps '+JSON.stringify([R.file,R.rec1.lost]));
 assert(R.file.t0<=R.rec0.t+.01&&R.file.t1>R.rec0.t+3&&R.file.n>2500,'the whole recording '+JSON.stringify([R.file,R.rec0.t,R.rec1.t]));
 // 5. the memory: a fixed ring of points 1 ms apart
 R.mem=await p.evaluate(()=>{const r=PCL.S.sim.ring;return {cap:r.cap,n:r.n,span:r.n>1?r.t[(r.head-1+r.cap)%r.cap]-r.t[(r.head-r.n+r.cap)%r.cap]:0,note:document.querySelector('#rec-note').textContent};});
 assert(R.mem.span>2&&Math.abs(R.mem.span/(R.mem.n-1)-1e-3)<1e-6,'a point per ms in the memory '+JSON.stringify(R.mem));
 // 6. the theory card: the models and the metrics so far
 R.theory=await p.evaluate(()=>document.querySelector('#theory').textContent);
 assert(/J_eq = J_m/.test(R.theory)&&/moevc/.test(R.theory)&&/km\/kWh/.test(R.theory)&&/Οικονομικός|eco/.test(R.theory),'theory card '+R.theory.slice(0,300));
 await p.screenshot({path:OUT+'/ev_drive.png'});
 // 7. the AI block: the reference repeats every 1.6 s and the run goes on past the old end (6.4 s)
 await p.goto(base+'?tutorial=ai_block');await p.waitForTimeout(1200);
 R.ai=await p.evaluate(()=>{const s=PCL.S.sim;const r=[];s.run(8);for(const t of [8.25,8.65,9.05,9.45])r.push((s.run(t-s.t),s.now('Y:KW')));return {stopT:PCL.S.stopT,t:s.t,ref:r,kw:PCL.editor.comp('KW').type};});
 assert(R.ai.stopT===0&&R.ai.kw==='EXPR'&&R.ai.ref.join()==='100,150,50,120','repeating reference '+JSON.stringify(R.ai));
 // 8. the generator with its controls (4.8.1, gen_ctl): the tile of ΔV_ref, the theory card, the fault ridden through
 //    with the PSS; then a governor chosen from the options: its tile of ΔP_ref and a live step of the load reference
 await p.goto(base+'?tutorial=gen_ctl');await p.waitForTimeout(1500);
 R.gen=await p.evaluate(()=>{const s=PCL.S.sim,r={pinned:[...document.querySelectorAll('.wtl .wt .wt-n')].map(e=>e.textContent),warn:s.net.warnings,method:document.querySelector('#method').value,stopT:PCL.S.stopT};
  let slip=false;for(let k=1;k<=40;k++){s.run(0.1);if(Math.abs(s.now('Y:SG1')-1)>0.02)slip=true;}Object.assign(r,{t:s.t,slip,d:s.now('Y:SG1:d'),efd:s.now('Y:AV1/EFD'),vs:s.now('Y:PS1/VS')});return r;});
 await p.waitForTimeout(300);R.gen.theory=await p.evaluate(()=>document.querySelector('#theory').textContent);
 assert(R.gen.pinned.includes('ΔV_ref')&&!R.gen.warn.length&&R.gen.method==='TR'&&R.gen.stopT===10,'gen_ctl opened '+JSON.stringify(R.gen));
 assert(!R.gen.slip&&R.gen.d>40&&R.gen.d<100&&Number.isFinite(R.gen.efd),'the fault ridden through '+JSON.stringify(R.gen));
 assert(/ST1A/.test(R.gen.theory)&&/PSS/.test(R.gen.theory)&&/E_fd0/.test(R.gen.theory),'gen theory card '+R.gen.theory.slice(0,300));
 // the inside of the AVR with a double click: its blocks by the flow of the signals, their values while it runs
 const at=await p.evaluate(()=>{const c=PCL.editor.comp('AV1'),b=Parts.bbox(c),m=PCL.editor.svg.getScreenCTM(),pt=PCL.editor.svg.createSVGPoint();pt.x=(b[0]+b[2])/2;pt.y=(b[1]+b[3])/2;const q=pt.matrixTransform(m);return [q.x,q.y];});
 await p.mouse.dblclick(at[0],at[1]);await p.waitForTimeout(700);
 R.inside=await p.evaluate(()=>{const el=document.querySelector('#lib-inside');return {open:!!el&&!el.hidden,id:Inside.openId(),n:el?.querySelectorAll('.in-n').length,e:el?.querySelectorAll('.in-e').length,
  efd:el?.querySelector('[data-iv="EFD"]')?.textContent,vs:el?.querySelector('[data-iv="$vs"]')?.textContent,vt:el?.querySelector('[data-iv="$vt"]')?.textContent};});
 assert(R.inside.open&&R.inside.id==='AV1'&&R.inside.n>=12&&R.inside.e>=12&&[R.inside.efd,R.inside.vs,R.inside.vt].every(v=>/^= /.test(v)),'inside of the AVR '+JSON.stringify(R.inside));
 await p.screenshot({path:OUT+'/gen_inside.png'});
 await p.keyboard.press('Escape');await p.waitForTimeout(200);
 assert(await p.evaluate(()=>document.querySelector('#lib-inside').hidden),'Esc closes the inside');
 // the step +0.02 of ΔV_ref from its tile: the AVR takes the new reference (the library part re-expanded, the states kept)
 R.dv=await p.evaluate(async()=>{const tile=[...document.querySelectorAll('.wtl .wt')].find(e=>e.querySelector('.wt-n').textContent==='ΔV_ref');
  const v0=PCL.S.sim.now('Y:SG1:vt');tile.querySelector('[data-wstep="1"]').click();await new Promise(r=>setTimeout(r,300));const s=PCL.S.sim;s.run(3);
  return {v0,v1:s.now('Y:SG1:vt'),dV:PCL.editor.comp('AV1').params.dV,x:tile.querySelector('.wt-in').value,t:s.t};});
 assert(+R.dv.dV===0.02&&R.dv.v1-R.dv.v0>0.012,'ΔV_ref from its tile '+JSON.stringify(R.dv));
 await p.evaluate(()=>{const s=document.querySelector('#tut-options [data-topt="gov"]');s.value='steam';s.dispatchEvent(new Event('change'));});await p.waitForTimeout(1500);
 await p.evaluate(()=>{const s=document.querySelector('#tut-options [data-topt="ev"]');s.value='none';s.dispatchEvent(new Event('change'));});await p.waitForTimeout(1500);
 R.gov=await p.evaluate(()=>({pinned:[...document.querySelectorAll('.wtl .wt .wt-n')].map(e=>e.textContent),gv:PCL.editor.comp('GV1')?.params.type,cb:!!PCL.editor.comp('CB2'),warn:PCL.S.sim.net.warnings}));
 assert(R.gov.gv==='steam'&&!R.gov.cb&&R.gov.pinned.includes('ΔP_ref')&&!R.gov.warn.length,'the governor from the options '+JSON.stringify(R.gov));
 await p.screenshot({path:OUT+'/gen_ctl.png'});
 assert(!errs.length,'page errors: '+errs.join(' | '));
 fs.writeFileSync(OUT+'/ev_flow.json',JSON.stringify(R,null,1));console.log(JSON.stringify({ok:true,file:R.file,mem:R.mem,mode2:R.mode2.t}));await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
