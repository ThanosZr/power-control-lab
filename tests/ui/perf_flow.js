// Responsiveness of the drawing (4.6, ROADMAP «Τι προτείνω»): time per frame while the user zooms with the wheel, pans,
// drags parts and draws a selection rectangle, on a small circuit (the buck tutorial) and on a large one (about 200 parts
// and 200 wires), with and without a running simulation. Real input through the browser (Playwright mouse and wheel), the
// frames counted with requestAnimationFrame in the page. Also: the wheel over labels, live values and the live panel must
// not scroll the page. Needs Node + Playwright.
// Usage: python run.py --no-browser --port 8765  then  node tests/ui/perf_flow.js http://127.0.0.1:8765/ <out-dir> [--report]
// Pass/fail: the 95th percentile of the frame interval and the longest frame, against the limits below (headless Chromium
// draws in software, so the limits are looser than the 16 ms the application aims at on a real machine; --report prints
// the numbers without failing).
const {chromium}=require('playwright');const OUT=process.argv[3]||'.';const REPORT=process.argv.includes('--report');
const LIMIT={p95:34,max:80};
// a large circuit: rows of R–L–C ladders with sources, every row grounded, about 200 parts and 200 wires
function bigDoc(rows=10,cols=6){const components=[],wires=[];let w=0;const W=()=>'w'+(++w);
 for(let r=0;r<rows;r++){const y=r*120;const src='V'+(r+1);components.push({id:src,type:'VDC',x:0,y:y+40,rot:0,flip:false,label:src,params:{V:10+r}});
  const g='G'+(r+1);components.push({id:g,type:'GND',x:0,y:y+100,rot:0,flip:false,label:g,params:{}});wires.push({id:W(),a:{c:src,p:'n'},b:{c:g,p:'g'},pts:[]});
  let prev={c:src,p:'p'};
  for(let k=0;k<cols;k++){const x=80+k*150;const R='R'+(r*cols+k+1),L='L'+(r*cols+k+1),C='C'+(r*cols+k+1);
   components.push({id:R,type:'R',x:x,y:y,rot:1,flip:false,label:R,params:{R:1+k}});
   components.push({id:L,type:'L',x:x+70,y:y,rot:1,flip:false,label:L,params:{L:1e-3}});
   components.push({id:C,type:'C',x:x+110,y:y+50,rot:0,flip:false,label:C,params:{C:1e-6}});
   wires.push({id:W(),a:prev,b:{c:R,p:'a'},pts:[]});wires.push({id:W(),a:{c:R,p:'b'},b:{c:L,p:'a'},pts:[]});
   wires.push({id:W(),a:{c:L,p:'b'},b:{c:C,p:'p'},pts:[]});wires.push({id:W(),a:{c:C,p:'n'},b:{c:g,p:'g'},pts:[]});prev={c:L,p:'b'};}}
 return {version:3,components,wires};}
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1500,height:1000}});const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(String(e.stack||e)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
 const base=process.argv[2];await p.goto(base);await p.evaluate(()=>localStorage.clear());
 const frames={start:()=>p.evaluate(()=>{window.__fr=[];const f=t=>{window.__fr.push(t);if(window.__frOn)requestAnimationFrame(f);};window.__frOn=true;requestAnimationFrame(f);}),
  stop:()=>p.evaluate(()=>{window.__frOn=false;const t=window.__fr;const d=[];for(let i=1;i<t.length;i++)d.push(t[i]-t[i-1]);d.sort((a,b)=>a-b);
   const q=x=>d.length?d[Math.min(d.length-1,Math.floor(x*d.length))]:0;return {n:d.length,p50:+q(.5).toFixed(1),p95:+q(.95).toFixed(1),max:+(d[d.length-1]||0).toFixed(1)};})};
 const box=async()=>p.evaluate(()=>{const r=document.querySelector('#canvas').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};});
 // the screen point of a part's centre
 const at=id=>p.evaluate(id=>{const E=PCL.editor,c=E.comp(id),m=E.svg.getScreenCTM(),pt=E.svg.createSVGPoint();pt.x=c.x;pt.y=c.y;const q=pt.matrixTransform(m);return {x:q.x,y:q.y};},id);
 const R={};
 async function gestures(tag,{part,empty}){const r=await box();const cx=r.x+r.w*.5,cy=r.y+r.h*.5,out={};
  await p.mouse.move(cx,cy);
  // zoom: 40 wheel notches in, 40 out, as fast as a trackpad sends them (one every 8 ms)
  await frames.start();for(let i=0;i<80;i++){await p.mouse.wheel(0,i<40?-60:60);await p.waitForTimeout(8);}await p.waitForTimeout(60);out.zoom=await frames.stop();
  // pan with the middle button
  await frames.start();await p.mouse.move(cx,cy);await p.mouse.down({button:'middle'});for(let i=0;i<60;i++){await p.mouse.move(cx+i*4,cy+i*2);}await p.mouse.up({button:'middle'});await p.waitForTimeout(60);out.pan=await frames.stop();
  await p.evaluate(()=>PCL.editor.fit());await p.waitForTimeout(50);
  // drag a part (and with it every wire that touches it)
  const q=await at(part);await frames.start();await p.mouse.move(q.x,q.y);await p.mouse.down();for(let i=0;i<60;i++){await p.mouse.move(q.x+i*3,q.y+(i%20)*2);}await p.mouse.up();await p.waitForTimeout(60);out.drag=await frames.stop();
  await p.keyboard.press('Control+KeyZ');
  // a selection rectangle from an empty point over most of the circuit
  const e0={x:r.x+empty[0]*r.w,y:r.y+empty[1]*r.h};await frames.start();await p.mouse.move(e0.x,e0.y);await p.mouse.down();for(let i=0;i<60;i++){await p.mouse.move(e0.x+i*12,e0.y+i*8);}await p.mouse.up();await p.waitForTimeout(60);out.select=await frames.stop();
  out.selected=await p.evaluate(()=>PCL.editor.sel.c.size);
  R[tag]=out;}
 async function withSim(tag,opt){await p.evaluate(()=>{PCL.reset();PCL.play();});await p.waitForTimeout(300);await gestures(tag,opt);await p.evaluate(()=>PCL.pause());}
 // small: the buck tutorial
 await p.goto(base+'?tutorial=buck');await p.waitForTimeout(1200);
 await gestures('small',{part:'L1',empty:[.04,.04]});await withSim('small+sim',{part:'L1',empty:[.04,.04]});
 // large: the generated circuit
 await p.evaluate(d=>{PCL.editor.load(d);PCL.reset();},bigDoc());await p.waitForTimeout(800);
 R.big={parts:await p.evaluate(()=>PCL.editor.doc.components.length),wires:await p.evaluate(()=>PCL.editor.doc.wires.length)};
 await gestures('large',{part:'R27',empty:[.02,.02]});await withSim('large+sim',{part:'R27',empty:[.02,.02]});
 // the wheel over the work area never scrolls the page: over a label, over the live panel, over the canvas edge
 R.scroll=await (async()=>{await p.evaluate(()=>window.scrollTo(0,0));const r=await box();const y0=await p.evaluate(()=>window.scrollY);const pts=[[r.x+8,r.y+8],[r.x+r.w-60,r.y+40],[r.x+r.w*.5,r.y+r.h-6]];
  for(const [x,y] of pts){await p.mouse.move(x,y);for(let i=0;i<6;i++)await p.mouse.wheel(0,200);}await p.waitForTimeout(150);return {moved:(await p.evaluate(()=>window.scrollY))-y0};})();
 await p.screenshot({path:OUT+'/perf_large.png'});
 console.log(JSON.stringify(R,null,1));
 const bad=[];for(const [k,v] of Object.entries(R)){if(!v||typeof v!=='object'||!v.zoom)continue;for(const g of ['zoom','pan','drag','select']){const f=v[g];if(f.p95>LIMIT.p95||f.max>LIMIT.max)bad.push(`${k} ${g}: p95 ${f.p95} ms, max ${f.max} ms`);}}
 if(R.scroll.moved!==0)bad.push('the page scrolled by '+R.scroll.moved+' px under the wheel');
 if(!(R['large'].selected>50))bad.push('selection rectangle selected '+R['large'].selected+' parts');
 if(errs.length)bad.push('errors: '+errs.slice(0,3).join(' | '));
 await b.close();
 if(bad.length&&!REPORT){console.error('FAIL\n'+bad.join('\n'));process.exit(1);}console.log(bad.length?'REPORT (would fail):\n'+bad.join('\n'):'PASS');
})().catch(e=>{console.error(e);process.exit(1);});
