// Responsiveness everywhere (4.7, ROADMAP «Τι προτείνω» 4.7.1, decision 60): what the user waits for outside the
// drawing. Loading the page, opening every tutorial, changing a tutorial option, opening the settings of a part with a
// double click, typing a value there, dragging that window by its title, selecting a part (the parameter panel), the
// library search, and a running simulation with the theory open. For each: the time until the next frame is painted
// (what the hand feels) and the long tasks of the main thread (Long Tasks API: anything over 50 ms is a freeze), with the
// scripts that caused them (Long Animation Frames API) so that a slow step points at its function. Needs Node + Playwright.
// Usage: python run.py --no-browser --port 8765  then  node tests/ui/speed_flow.js http://127.0.0.1:8765/ <out-dir> [--report] [--only=<id,…>]
// Pass/fail: the limits below (headless Chromium, two cores, no GPU: about twice a real machine). --report prints the
// numbers without failing.
const {chromium}=require('playwright');const OUT=process.argv[3]||'.';const REPORT=process.argv.includes('--report');
const ONLY=(process.argv.find(a=>a.startsWith('--only='))||'').slice(7).split(',').filter(Boolean);
// the limits: the frame after an action (ms), and the longest task while it and its deferred work run
const LIMIT={tutorialFrame:250,tutorialTask:250,optionFrame:250,inspectorFrame:60,inspectorTask:80,typeFrame:120,dragP95:34,
 selectFrame:80,searchFrame:60,runTask:120,runP95:67,loadFirst:2500};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1500,height:1000}});const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>{if(m.type()==='error'&&!/favicon|net::ERR|Failed to load resource/.test(m.text()))errs.push(m.text());});
 const base=process.argv[2]||'http://127.0.0.1:8765/';
 // long tasks and long animation frames, from the start of the page
 await p.addInitScript(()=>{window.__lt=[];window.__loaf=[];
  try{new PerformanceObserver(l=>{for(const e of l.getEntries())window.__lt.push({t:e.startTime,d:e.duration});}).observe({type:'longtask',buffered:true});}catch(e){}
  try{new PerformanceObserver(l=>{for(const e of l.getEntries())window.__loaf.push({t:e.startTime,d:e.duration,block:e.blockingDuration,
   scripts:(e.scripts||[]).map(s=>({d:s.duration,f:(s.sourceFunctionName||s.invoker||'?')+' '+String(s.sourceURL||'').split('/').pop()+':'+(s.sourceCharPosition??'')}))});}).observe({type:'long-animation-frame',buffered:true});}catch(e){}
  window.__frame=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r(performance.now()))));});
 const t0=Date.now();await p.goto(base);await p.waitForFunction(()=>window.PCL&&PCL.S&&PCL.S.sim,null,{timeout:60000});
 const R={};R.load={ready:Date.now()-t0,...await p.evaluate(()=>({nav:Math.round(performance.getEntriesByType('navigation')[0]?.domContentLoadedEventEnd||0)}))};
 await p.waitForTimeout(1500);
 // what ran long in [a, b] (page clock)
 const longIn=(a,b)=>p.evaluate(([a,b])=>{const lt=window.__lt.filter(e=>e.t>=a-1&&e.t<=b);const lf=window.__loaf.filter(e=>e.t>=a-1&&e.t<=b);
  const by={};for(const f of lf)for(const s of f.scripts)if(s.d>=10)by[s.f]=(by[s.f]||0)+s.d;
  return {n:lt.length,max:Math.round(Math.max(0,...lt.map(e=>e.d))),sum:Math.round(lt.reduce((s,e)=>s+e.d,0)),top:Object.entries(by).sort((x,y)=>y[1]-x[1]).slice(0,4).map(([f,d])=>f+' '+Math.round(d))};},[a,b]);
 R.load.long=await longIn(0,await p.evaluate(()=>performance.now()));
 // an action in the page: the time until the next painted frame, and the long tasks while it and its deferred work run
 async function act(fn,arg,settle=1200){const a=await p.evaluate(()=>performance.now());const r=await p.evaluate(async([src,arg])=>{const f=eval(src);const s=performance.now();f(arg);const sync=performance.now()-s;const fr=await window.__frame();return {sync:+sync.toFixed(1),frame:+(fr-s).toFixed(1)};},[fn.toString(),arg]);
  await p.waitForTimeout(settle);const b=await p.evaluate(()=>performance.now());return {...r,long:await longIn(a,b)};}
 // 0. the first load of Python (Pyodide) for the tutorials with Python blocks: the interpreter starts in the main thread
 // (≈ 1.5 s once per session, ROADMAP 4.7.1: Python in a worker). Reported, not judged; the tutorials below open with it warm
 R.pythonFirst=await act(()=>{window.PyRT&&PyRT.load();},null,6000);
 // 1. every tutorial
 const ids=await p.evaluate(()=>Tutorials.list.map(t=>t.id));R.tutorials={};
 for(const id of ids){if(ONLY.length&&!ONLY.includes(id))continue;R.tutorials[id]=await act(id=>PCL.loadTutorial(id),id,900);}
 // 2. a tutorial option (the buck: another load)
 await p.evaluate(()=>PCL.loadTutorial('buck'));await p.waitForTimeout(800);
 R.option=await act(()=>{const s=document.querySelector('#tut-options [data-topt]');if(!s)return;s.selectedIndex=(s.selectedIndex+1)%s.options.length;s.dispatchEvent(new Event('change'));},null,900);
 await p.evaluate(()=>PCL.loadTutorial('buck'));await p.waitForTimeout(800);
 // the screen point of a part
 const at=id=>p.evaluate(id=>{const E=PCL.editor,c=E.comp(id),m=E.svg.getScreenCTM(),pt=E.svg.createSVGPoint();pt.x=c.x;pt.y=c.y;const q=pt.matrixTransform(m);return {x:q.x,y:q.y};},id);
 // 3. the settings window with a double click, real input
 {const q=await at('L1');const a=await p.evaluate(()=>performance.now());await p.mouse.dblclick(q.x,q.y);
  const f=await p.evaluate(async()=>{const s=performance.now();await window.__frame();return {visible:!document.querySelector('#inspector').hidden,frame:+(performance.now()-s).toFixed(1)};});
  await p.waitForTimeout(400);R.inspector={...f,long:await longIn(a,await p.evaluate(()=>performance.now()))};
  // typing a value and Enter: the change reaches the solver and the panels
  const inp=await p.$('#inspector input[data-num]');if(inp){const a2=await p.evaluate(()=>performance.now());await inp.click({clickCount:3});await inp.type('470u');
   const s=await p.evaluate(()=>performance.now());await inp.press('Enter');const fr=await p.evaluate(async()=>{await window.__frame();return performance.now();});await p.waitForTimeout(600);
   R.inspectorType={frame:+(fr-s).toFixed(1),long:await longIn(a2,await p.evaluate(()=>performance.now()))};}
  // dragging the window by its title (4.7): frames while it moves, and it stays where it was left
  const h=await p.$('#inspector .ins-head');if(h){const bb=await h.boundingBox();const x0=bb.x+bb.width*.3,y0=bb.y+8;
   await p.evaluate(()=>{window.__fr=[];let go=true;window.__frStop=()=>{go=false;return window.__fr;};const f=t=>{window.__fr.push(t);if(go)requestAnimationFrame(f);};requestAnimationFrame(f);});
   await p.mouse.move(x0,y0);await p.mouse.down();for(let i=1;i<=40;i++)await p.mouse.move(x0-i*6,y0+i*4);await p.mouse.up();await p.waitForTimeout(60);
   const fr=await p.evaluate(()=>window.__frStop());const d=[];for(let i=1;i<fr.length;i++)d.push(fr[i]-fr[i-1]);d.sort((a,b)=>a-b);
   const bb2=await (await p.$('#inspector .ins-head')).boundingBox();
   R.inspectorDrag={moved:[Math.round(bb2.x-bb.x),Math.round(bb2.y-bb.y)],p95:+(d[Math.floor(.95*(d.length-1))]||0).toFixed(1),max:+(d[d.length-1]||0).toFixed(1)};}
  await p.keyboard.press('Escape');await p.evaluate(()=>{const x=document.querySelector('#inspector [data-close]');if(x)x.click();});}
 // 4. selecting a part: the parameter panel
 {const q=await at('C1');const a=await p.evaluate(()=>performance.now());await p.mouse.click(q.x,q.y);const f=await p.evaluate(async()=>{const s=performance.now();await window.__frame();return +(performance.now()-s).toFixed(1);});
  await p.waitForTimeout(300);R.select={frame:f,long:await longIn(a,await p.evaluate(()=>performance.now()))};}
 // 5. the library search, typed
 {const el=await p.$('#pal-search');if(el){const a=await p.evaluate(()=>performance.now());await el.click();await el.type('πυκν',{delay:30});
  const f=await p.evaluate(async()=>{const s=performance.now();await window.__frame();return +(performance.now()-s).toFixed(1);});await el.fill('');await p.waitForTimeout(200);
  R.search={frame:f,long:await longIn(a,await p.evaluate(()=>performance.now()))};}}
 // 6. a running simulation with the theory card open, on a few tutorials
 R.run={};for(const id of ['buck','im_foc','srm','ieee9_emt'].filter(id=>ids.includes(id))){await p.evaluate(id=>PCL.loadTutorial(id),id);await p.waitForTimeout(700);
  const a=await p.evaluate(()=>{window.__fr=[];let go=true;window.__frStop=()=>{go=false;return window.__fr;};const f=t=>{window.__fr.push(t);if(go)requestAnimationFrame(f);};requestAnimationFrame(f);PCL.play();return performance.now();});
  await p.waitForTimeout(3000);const fr=await p.evaluate(()=>{PCL.pause();return window.__frStop();});const d=[];for(let i=1;i<fr.length;i++)d.push(fr[i]-fr[i-1]);d.sort((x,y)=>x-y);
  R.run[id]={...await longIn(a,await p.evaluate(()=>performance.now())),p50:+(d[Math.floor(.5*(d.length-1))]||0).toFixed(1),p95:+(d[Math.floor(.95*(d.length-1))]||0).toFixed(1),worker:await p.evaluate(()=>!!window.Live&&!Live.off)};}
 await p.screenshot({path:OUT+'/speed.png'});
 // the report
 const bad=[];const tut=Object.entries(R.tutorials);
 const worst=tut.slice().sort((x,y)=>Math.max(y[1].frame,y[1].long.max)-Math.max(x[1].frame,x[1].long.max));
 console.log('load',JSON.stringify(R.load));
 console.log('tutorials (sync / frame / longest task / sum of long tasks, worst first):');
 for(const [id,v] of worst)console.log(' ',id.padEnd(16),String(v.sync).padStart(7),String(v.frame).padStart(7),String(v.long.max).padStart(5),String(v.long.sum).padStart(6),v.long.top.join(' | '));
 for(const k of ['pythonFirst','option','inspector','inspectorType','inspectorDrag','select','search'])console.log(k,JSON.stringify(R[k]));
 for(const [id,v] of Object.entries(R.run))console.log('run',id,JSON.stringify(v));
 for(const [id,v] of tut){if(v.frame>LIMIT.tutorialFrame)bad.push(`tutorial ${id}: first frame after ${v.frame} ms`);if(v.long.max>LIMIT.tutorialTask)bad.push(`tutorial ${id}: a task of ${v.long.max} ms`);}
 if(R.option&&R.option.frame>LIMIT.optionFrame)bad.push('tutorial option: first frame after '+R.option.frame+' ms');
 if(!R.inspector?.visible)bad.push('the settings window did not open with a double click');
 else{if(R.inspector.frame>LIMIT.inspectorFrame)bad.push('settings window: frame after '+R.inspector.frame+' ms');if(R.inspector.long.max>LIMIT.inspectorTask)bad.push('settings window: a task of '+R.inspector.long.max+' ms');}
 if(R.inspectorType&&R.inspectorType.frame>LIMIT.typeFrame)bad.push('a value typed in the settings window: frame after '+R.inspectorType.frame+' ms');
 if(!R.inspectorDrag)bad.push('the settings window has no title to drag');
 else{if(Math.abs(R.inspectorDrag.moved[0]+240)>4||Math.abs(R.inspectorDrag.moved[1]-160)>4)bad.push('the settings window did not follow the pointer: moved '+R.inspectorDrag.moved);if(R.inspectorDrag.p95>LIMIT.dragP95)bad.push('dragging the settings window: p95 '+R.inspectorDrag.p95+' ms');}
 if(R.select&&R.select.frame>LIMIT.selectFrame)bad.push('selecting a part: frame after '+R.select.frame+' ms');
 if(R.search&&R.search.frame>LIMIT.searchFrame)bad.push('library search: frame after '+R.search.frame+' ms');
 for(const [id,v] of Object.entries(R.run)){if(v.max>LIMIT.runTask)bad.push(`running ${id}: a task of ${v.max} ms (${v.top.join(' | ')})`);if(v.p95>LIMIT.runP95)bad.push(`running ${id}: frames p95 ${v.p95} ms`);}
 if(errs.length)bad.push('errors: '+errs.slice(0,3).join(' | '));
 require('fs').writeFileSync(OUT+'/speed.json',JSON.stringify(R,null,1));
 await b.close();
 if(bad.length&&!REPORT){console.error('FAIL\n'+bad.join('\n'));process.exit(1);}console.log(bad.length?'REPORT (would fail):\n'+bad.join('\n'):'PASS');
})().catch(e=>{console.error(e);process.exit(1);});
