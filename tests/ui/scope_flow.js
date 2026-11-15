// 4.17.2 (ROADMAP §63, THEORY §8τ): the redesign of the graphs from the scope, in the browser.
//  1. a steady y while it runs (the buck: a few openings at the start, then the same range)
//  2. the page does not move while it runs (what is under the scope keeps its place), the values in their box (fixed
//     height, scroll bars with many channels, numbers at most ~2 times a second)
//  3. the labels of the time axis never overlap
//  4. the height of a pane by its handle (the box scrolls), double click: all equal again; ⛶: the pane fills the box
//  5. what left the memory keeps its mean: the envelope against the per-period means, over the same time
//  6. the memory «αυτόματα» by default; the graphs in the whole window and back (Esc)
//  7. the settings window: columns when wide, resized from a side and a corner, its size kept
//  8. the viewer of a recording: its canvas follows its window
// 10. 4.17.4 (ROADMAP §64): the window «Ρύθμιση ελεγκτή»: from the settings of the PWM, G(s) and its poles, four charts,
//     the margins follow a gain, «Εφαρμογή» writes the gains (by hand) into the PWM
//  9. 4.17.3 (ROADMAP §65): the technical look by default: thin crisp lines, IEC resistor, the phases in colour, the
//     selected part in colour, widths from the settings; the classic look and the ANSI symbols from the settings
// Usage: python run.py --no-browser --port 8775  then  node tests/ui/scope_flow.js http://127.0.0.1:8775/ [out]
const {chromium}=require('playwright');
(async()=>{const U=process.argv[2]||'http://127.0.0.1:8775/',OUT=process.argv[3]||'.';const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1500,height:1000}});const p=await ctx.newPage();
 const errs=[],fail=[],R={};p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
 const ok=(c,msg)=>{if(!c)fail.push(msg);};
 await p.goto(U);await p.evaluate(()=>localStorage.clear());
 // 1–3. the buck running: y, the page, the values, the axis
 await p.goto(U+'?tutorial=buck');await p.waitForTimeout(1500);
 await p.click('#rec-opts');await p.waitForSelector('#rec-mem');
 R.mem=await p.evaluate(()=>({sel:document.querySelector('#rec-mem')?.value??null,txt:document.querySelector('#rec-mem option:checked')?.textContent,cap:PCL.S.sim.ring.cap,nch:PCL.S.sim.ring.nch,dm:navigator.deviceMemory||4}));
 await p.click('#rec-opts');
 await p.evaluate(()=>{document.querySelector('#lp-hide')?.click();document.querySelector('#scope-card').scrollIntoView({block:'start'});});await p.waitForTimeout(200);
 await p.click('#play');
 R.run=await p.evaluate(async()=>{const sc=PCL.scope,ys=[],tops=[],mh=[],box=document.querySelector('#measure');let writes=0;const ob=new MutationObserver(()=>{writes++;});   // one call per write of the table (a burst of cells)
  ob.observe(box,{subtree:true,characterData:true,childList:true});const below=document.querySelector('#diag');
  for(let i=0;i<40;i++){await new Promise(z=>setTimeout(z,100));ys.push(JSON.stringify((sc.layout||[]).map(q=>[q.lo,q.hi])));tops.push(Math.round(below.getBoundingClientRect().top+scrollY));mh.push(box.offsetHeight);}
  ob.disconnect();const X=sc.xt;let over=0;for(let k=1;k<X.x.length;k++)if(X.x[k]-X.w[k]/2<X.x[k-1]+X.w[k-1]/2+4)over++;
  return {distinct:new Set(ys).size,last15:new Set(ys.slice(-15)).size,tops:[...new Set(tops)],mh:[...new Set(mh)],writes,ticks:X.labels.length,over,step:X.step};});
 ok(R.run.distinct<=12,'few changes of y in the start (before 4.17.2: one in every frame) '+JSON.stringify(R.run));
 ok(R.run.tops.length===1&&R.run.mh.length===1,'the page does not move '+JSON.stringify(R.run));
 ok(R.run.writes<=12,'the values change at most ~2 times a second '+R.run.writes);
 ok(R.run.ticks>=3&&R.run.over===0,'the time labels do not overlap '+JSON.stringify(R.run));
 await p.click('#play');
 // in the steady state: the same y in every frame
 await p.evaluate(()=>{PCL.S.sim.run(0.02);});await p.click('#play');
 await p.waitForTimeout(2500);   // a range of the start-up closes once, after its 2 s
 R.steady=await p.evaluate(async()=>{const sc=PCL.scope,ys=[];for(let i=0;i<30;i++){await new Promise(z=>setTimeout(z,100));ys.push(JSON.stringify((sc.layout||[]).map(q=>[q.lo,q.hi])));}return {distinct:new Set(ys).size,t:PCL.S.sim.t};});
 await p.click('#play');ok(R.steady.distinct===1,'steady y in the steady state '+JSON.stringify(R.steady));
 // the values box: many channels → its own scroll bars, the same height
 R.box=await p.evaluate(async()=>{const box=document.querySelector('#measure'),h0=box.offsetHeight;const ks=PCL.S.sim.keys.filter(k=>/^(V|I):/.test(k)).slice(0,12);
  for(const k of ks)PCL.scope.addChannel(k,k);PCL.draw(true);await new Promise(z=>setTimeout(z,300));const cs=getComputedStyle(box);
  return {h0,h1:box.offsetHeight,sh:box.scrollHeight,ov:cs.overflowY,rows:box.querySelectorAll('tbody tr').length,panes:PCL.scope.cfg.panes.length};});
 ok(R.box.rows>=8&&R.box.sh>R.box.h1&&R.box.ov==='auto'&&R.box.h1<=200,'values in a box with scroll bars '+JSON.stringify(R.box));
 // 4. the height of a pane by its handle; the box scrolls; double click: equal again; ⛶
 await p.evaluate(()=>document.querySelector('#scope-scroll').scrollIntoView({block:'center'}));await p.waitForTimeout(200);
 R.h=await p.evaluate(()=>{const sc=PCL.scope;sc.draw();const L=sc.layout[0];return {y1:L.y1,h0:L.y1-L.y0,n:sc.layout.length,H:sc.Hv,tot:sc.Htot};});
 {const bb=await (await p.$('#scope-canvas')).boundingBox(),x=bb.x+bb.width/2,y=bb.y+R.h.y1+6;await p.mouse.move(x,y);await p.mouse.down();await p.mouse.move(x,y+80,{steps:6});await p.mouse.move(x,y+160,{steps:6});await p.mouse.up();}
 await p.waitForTimeout(200);
 R.h2=await p.evaluate(async()=>{const sc=PCL.scope,el=document.querySelector('#scope-scroll');const a={h:sc.layout[0].y1-sc.layout[0].y0,cfg:sc.cfg.panes[0].h,tot:sc.Htot,H:sc.Hv,sh:el.scrollHeight,ch:el.clientHeight};
  el.scrollTop=el.scrollHeight;await new Promise(z=>setTimeout(z,150));sc.draw();const last=sc.layout[sc.layout.length-1];a.sy=sc.sy;a.lastVisible=last.y1<=sc.sy+sc.Hv+1&&!last.hidden;a.firstHidden=!!sc.layout[0].hidden;return a;});
 ok(R.h2.cfg>=R.h.h0+140&&R.h2.sh>R.h2.ch&&R.h2.sy>0&&R.h2.lastVisible,'a taller pane, the box scrolls '+JSON.stringify([R.h,R.h2]));
 R.h3=await p.evaluate(async()=>{const sc=PCL.scope,el=document.querySelector('#scope-scroll');el.scrollTop=0;await new Promise(z=>setTimeout(z,100));sc.draw();
  const L=sc.layout[0],r=el.getBoundingClientRect();return {y:L.y1+6,x:r.width/2};});
 {const bb=await (await p.$('#scope-canvas')).boundingBox();await p.mouse.dblclick(bb.x+R.h3.x,bb.y+R.h3.y);}
 await p.waitForTimeout(150);
 R.h4=await p.evaluate(()=>({hs:PCL.scope.cfg.panes.map(q=>q.h??null)}));ok(R.h4.hs.every(h=>h===null),'double click: automatic heights '+JSON.stringify(R.h4));
 R.max=await p.evaluate(()=>{const sc=PCL.scope;while(sc.cfg.panes.length>2)sc.moveChannel(sc.cfg.panes[2].ch[0].key,0);sc.resize();const L=sc.layout[1];return {x:sc.W-sc.padR-12,y:L.y0+11,H:sc.Hv};});
 {const bb=await (await p.$('#scope-canvas')).boundingBox();await p.mouse.click(bb.x+R.max.x,bb.y+R.max.y);}
 await p.waitForTimeout(150);
 R.max2=await p.evaluate(()=>{const sc=PCL.scope,L=sc.layout[1];return {max:!!sc.cfg.panes[1].max,h:L.y1-L.y0,H:sc.Hv};});
 ok(R.max2.max&&R.max2.h>=R.max2.H-20,'⛶: the pane fills the box '+JSON.stringify(R.max2));
 await p.evaluate(()=>{PCL.scope.toggleMax(1);});
 // 5. the envelope keeps the mean: a small memory, a run past it, the means of what left it against the per-period means
 await p.evaluate(()=>{localStorage.setItem('pcl-scope-mem','24');});await p.goto(U+'?tutorial=buck');await p.waitForTimeout(1500);
 await p.evaluate(()=>{document.querySelector('#lp-hide')?.click();document.querySelector('#scope-card').scrollIntoView({block:'start'});});
 R.env=await p.evaluate(async()=>{const S=PCL.S,sc=PCL.scope,s=S.sim;while(s.t<0.03){s.run(0.0005);sc.ingest();}sc.draw();const E=sc.env,ci=s.chIndex.get('I:L1'),rs=sc.ringStart();
  let Se=0,De=0;for(let b=0;b<E.B&&(b+1)*E.w<=rs;b++){if(!(E.nn[b]>0)||(b*E.w)<0.01)continue;Se+=E.sm[b*E.nch+ci]/E.nn[b]*E.w;De+=E.w;}
  const t0=0.01,t1=t0+De,p=s.per;let Sp=0,n=0;for(let i=0;i<p.n;i++){const j=(p.head-p.n+i+p.cap)%p.cap,t=p.t[j];if(t>t0&&t<=t1+1e-12){Sp+=p.avg[j*p.nch+ci];n++;}}
  sc.cfg.frozen=[0,s.t];sc.draw();await new Promise(z=>setTimeout(z,600));sc.draw();const st=sc.stats('I:L1');
  return {rs,De,env:Se/De,per:Sp/n,n,B:E.B,w:E.w,state:sc.archState,src:st?.src,avg:st?.avg,status:document.querySelector('#scope-status').textContent};});
 ok(R.env.rs>0.01&&R.env.De>0.005&&Math.abs(R.env.env-R.env.per)<0.01*Math.abs(R.env.per),'the envelope keeps the mean '+JSON.stringify(R.env));
 ok(R.env.state==='env'&&R.env.src==='env'&&Number.isFinite(R.env.avg)&&/μέση \(γραμμή\)/.test(R.env.status),'the view before the memory: mean and min–max '+JSON.stringify(R.env));
 // 6. the memory by default; the whole window
 ok(R.mem.sel==='0'&&/αυτόματα/.test(R.mem.txt)&&R.mem.cap===Math.floor((R.mem.dm>=8?128:R.mem.dm>=4?64:32)*1048576/(4*R.mem.nch+9)),'memory «αυτόματα» '+JSON.stringify(R.mem));
 await p.click('#scope-full');await p.waitForTimeout(300);
 R.full=await p.evaluate(()=>({on:document.querySelector('#scope-card').classList.contains('scope-full'),H:PCL.scope.Hv}));
 await p.keyboard.press('Escape');await p.waitForTimeout(200);
 R.full.off=await p.evaluate(()=>!document.querySelector('#scope-card').classList.contains('scope-full'));
 ok(R.full.on&&R.full.H>600&&R.full.off,'the graphs in the whole window '+JSON.stringify(R.full));
 // 7. the settings window: columns, resized from a side and a corner, its size kept
 await p.evaluate(()=>PCL.openInspector?.('L1',300,300)||document.querySelector('[data-id="L1"]')?.dispatchEvent(new MouseEvent('dblclick',{bubbles:true})));
 await p.waitForSelector('#inspector:not([hidden])',{timeout:5000}).catch(()=>{});
 R.ins=await p.evaluate(()=>{const el=document.querySelector('#inspector'),r=el.getBoundingClientRect(),cols=getComputedStyle(el.querySelector('.ins-body')).gridTemplateColumns.split(' ').length;
  return {w:r.width,h:r.height,cols,handles:el.querySelectorAll(':scope > .wfr-h').length,x:r.right,y:r.bottom,l:r.left,t:r.top};});
 ok(R.ins.handles===8&&R.ins.w>=500&&R.ins.cols>=2,'settings window wide, in columns, with 8 handles '+JSON.stringify(R.ins));
 await p.mouse.move(R.ins.x-4,R.ins.y-4);await p.mouse.down();await p.mouse.move(R.ins.x+60,R.ins.y+40,{steps:5});await p.mouse.up();
 await p.mouse.move(R.ins.l+2,(R.ins.t+R.ins.y)/2);await p.mouse.down();await p.mouse.move(R.ins.l-50,(R.ins.t+R.ins.y)/2,{steps:5});await p.mouse.up();
 R.ins2=await p.evaluate(()=>{const r=document.querySelector('#inspector').getBoundingClientRect();return {w:r.width,h:r.height,l:r.left,kept:JSON.parse(localStorage.getItem('pcl-win-ins')||'null')};});
 ok(R.ins2.w>=R.ins.w+100&&R.ins2.h>=R.ins.h+30&&R.ins2.l<R.ins.l-40&&R.ins2.kept&&Math.abs(R.ins2.kept.w-R.ins2.w)<2,'settings window resized and kept '+JSON.stringify([R.ins,R.ins2]));
 await p.evaluate(()=>PCL.closeInspector?.());
 // 8. the viewer of a recording: the canvas follows its window (a short recording of this run)
 R.rv=await p.evaluate(async()=>{const r=await fetch('/api/record',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({op:'start',title:'scope_flow',header:'t (s),V:a'})}).then(x=>x.json());
  let rows='';for(let i=0;i<5000;i++){const t=i*1e-4;rows+=`${t},${Math.sin(2*Math.PI*50*t)}\n`;}await fetch('/api/record',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({op:'append',name:r.name,rows})});
  const v=await RecView.open(r.name);await new Promise(z=>setTimeout(z,700));const cv=v.box.querySelector('canvas'),w0=cv.clientWidth,mb=v.box.querySelector('.modal-box');
  mb.style.width=(mb.offsetWidth+200)+'px';await new Promise(z=>setTimeout(z,600));const w1=cv.clientWidth,st=v.state();v.close();return {w0,w1,raw:st.raw,rows:st.rows,framed:mb.classList.contains('wfr')};});
 ok(R.rv.w1>=R.rv.w0+150&&R.rv.framed,'the viewer follows its window '+JSON.stringify(R.rv));
 // 9. the look
 await p.goto(U+'?tutorial=buck_vloop');await p.waitForTimeout(1500);
 R.look=await p.evaluate(()=>{const q=s=>document.querySelector(s),cs=e=>getComputedStyle(e);const rp=q('.part[data-c="R1"] .sym path:last-child'),w=q('.wire .wl');PCL.editor.select(['C1'],[]);
  const cp=q('.part[data-c="C1"] .sym path');return {body:document.body.className,rd:rp?.getAttribute('d'),rcls:rp?.getAttribute('class'),rsw:cs(rp).strokeWidth,wsw:cs(w).strokeWidth,wsr:cs(w).shapeRendering,wcap:cs(w).strokeLinecap,sel:cs(cp).stroke,
   src:cs(q('.part[data-c="V1"] .sym circle')).fill};});
 ok(R.look.body.includes('look-tech')&&/H15 V6 H-15 Z/.test(R.look.rd)&&/hv/.test(R.look.rcls||'')&&R.look.rsw==='1.5px'&&R.look.wsw==='1px'&&R.look.wsr==='crispedges'&&R.look.wcap==='square','technical look by default '+JSON.stringify(R.look));
 ok(R.look.sel==='rgb(47, 127, 208)'&&R.look.src!=='rgb(255, 255, 255)','the selected part in colour, a source tinted '+JSON.stringify(R.look));
 await p.goto(U+'?tutorial=bridge3');await p.waitForTimeout(1500);
 R.look.ph=await p.evaluate(()=>[...document.querySelectorAll('.part .sym .ph-a')].length);
 await p.click('#open-settings');await p.waitForSelector('#settings [data-set="techComp"]');await p.selectOption('#settings [data-set="techComp"]','2.5');await p.waitForTimeout(200);
 R.look.w2=await p.evaluate(()=>getComputedStyle(document.querySelector('.part .sym path')).strokeWidth);
 await p.selectOption('#settings [data-set="look"]','classic');await p.waitForTimeout(300);await p.selectOption('#settings [data-set="sym"]','ansi');await p.waitForTimeout(300);
 await p.click('#settings-close');await p.goto(U+'?tutorial=buck_vloop');await p.waitForTimeout(1500);
 R.look.classic=await p.evaluate(()=>{const w=document.querySelector('.wire .wl'),rp=document.querySelector('.part[data-c="R1"] .sym path');return {body:document.body.className,wsw:getComputedStyle(w).strokeWidth,cap:getComputedStyle(w).strokeLinecap,rd:rp.getAttribute('d')};});
 ok(R.look.ph>=1&&R.look.w2==='2.5px','phases in colour, the width of the parts from the settings '+JSON.stringify(R.look));
 ok(R.look.classic.body.includes('look-classic')&&R.look.classic.wsw==='2.2px'&&R.look.classic.cap==='round'&&/l2.5,-7/.test(R.look.classic.rd),'the classic look and ANSI symbols from the settings, kept '+JSON.stringify(R.look.classic));
 await p.evaluate(()=>localStorage.clear());
 // 10. the controller window
 await p.goto(U+'?tutorial=buck_vloop');await p.waitForTimeout(1500);
 R.btn=await p.evaluate(()=>{PCL.openInspector('PWM1',300,300);return !!document.querySelector('#inspector [data-ctlwin]');});
 R.ctl=await p.evaluate(async()=>{PCL.closeInspector();const w=PCL.openCtlWin('PWM1');await new Promise(z=>setTimeout(z,900));const st=w.state(),b=w.box;
  const cvs=[...b.querySelectorAll('canvas')].map(c=>c.width>0&&c.height>0),txt=b.textContent;
  const kp=b.querySelector('[data-cw="Kp"]'),k0=+kp.value;kp.value=String(+(k0*3).toPrecision(4));kp.dispatchEvent(new Event('change'));await new Promise(z=>setTimeout(z,400));
  const st2=w.state();b.querySelector('[data-cwapply]').click();await new Promise(z=>setTimeout(z,300));const c=PCL.editor.comp('PWM1');
  return {ok:st.R?.ok,key:st.R?.key,pm:st.R?.margins?.pm,pm2:st2.R?.margins?.pm,wc:st.R?.margins?.wc,wc2:st2.R?.margins?.wc,cvs,hasG:/G\(s\)/.test(txt),poles:/πόλοι/.test(txt),gain:c.params.gain,Kp:+c.params.Kp,k0,
   framed:b.querySelector('.modal-box').classList.contains('wfr'),gone:!document.querySelector('.ctl-modal')};});
 ok(R.btn&&R.ctl.ok&&R.ctl.key==='buck'&&R.ctl.cvs.length===4&&R.ctl.cvs.every(Boolean)&&R.ctl.hasG&&R.ctl.poles&&R.ctl.framed,'the controller window '+JSON.stringify(R.ctl));
 // |Kp + Ki/jω| grows with Kp at every ω, so the crossover moves up (the PM may go either way)
 ok(R.ctl.wc2>R.ctl.wc*1.05&&Math.abs(R.ctl.pm2-R.ctl.pm)>1&&R.ctl.gain==='manual'&&Math.abs(R.ctl.Kp-3*R.ctl.k0)<1e-6*Math.abs(R.ctl.k0)+1e-12&&R.ctl.gone,'margins follow the gain, applied to the PWM '+JSON.stringify(R.ctl));
 await p.screenshot({path:OUT+'/scope_flow.png'});
 ok(!errs.length,'χωρίς σφάλματα JavaScript '+errs.join(' | '));
 console.log(JSON.stringify(R,null,1).slice(0,3000));
 if(fail.length){console.log('FAIL');for(const f of fail)console.log(f);process.exitCode=1;}else console.log('PASS');
 await b.close();})();
