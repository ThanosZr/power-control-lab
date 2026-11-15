// 4.17.2 (ROADMAP §63): the core of the graphs (web/studio/plotcore.js) headless, for test_plotcore.py.
// Usage: node plotcore_cases.js -> JSON {ticks, labels, eng, auto, range}
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');const PC=require(W+'/plotcore.js');
const R={};
// ticks of a time axis for many spans and widths: a label of 6.3 px per character (the monospace font of the axes) and
// a gap of 18 px: no two labels overlap, the step is 1–2–5·10ⁿ, and the labels have no more decimals than the step needs
const cw=s=>s.length*6.3;R.ticks=[];
for(const [t0,t1] of [[0,1e-3],[0.0123,0.0127],[0,60],[1.23456,1.23457],[0,7.5e-6],[3600,3700],[0.1,0.1000002]])for(const px of [180,420,900,1600]){
 const q=PC.ticks(t0,t1,px,(v,st)=>PC.fmtTime(v,st,t1),cw,18);const pxs=q.step/(t1-t0)*px,w=Math.max(...q.labels.map(cw));
 const m=q.step/Math.pow(10,Math.floor(Math.log10(q.step)+1e-9));
 R.ticks.push({t0,t1,px,n:q.vals.length,ok:q.vals.length<=1||pxs>=w+18-1e-9,step125:[1,2,5,10].some(k=>Math.abs(m-k)<1e-6),labels:q.labels,inside:q.vals.every(v=>v>=t0-q.step*1e-9&&v<=t1+q.step*1e-9)});}
// a y axis (labels 11 px tall, gap 18 px): at least 29 px between ticks
R.yticks=[[0,1,90],[-3.2,12.7,300],[0.849,0.851,120],[-1e-3,1e-3,60]].map(([a,b,px])=>{const q=PC.ticks(a,b,px,(v,st)=>PC.fmtEng(v,st,'V',Math.max(Math.abs(a),Math.abs(b))),()=>11,18);return {a,b,px,n:q.vals.length,pxs:q.step/(b-a)*px,labels:q.labels};});
// labels: decimals from the step, one prefix per axis
R.labels={t1:PC.fmtTime(0.0125,0.0005,0.013),t2:PC.fmtTime(2,1,60),t3:PC.fmtTime(1.5e-6,5e-7,7.5e-6),e1:PC.fmtEng(1250,250,'V',2000),e2:PC.fmtEng(0.0025,0.0005,'A',0.004),e3:PC.fmtEng(-12,2,'',20),e4:PC.fmtEng(0,0.2,'A',1),e5:PC.fmtEng(0.85,0.001,'',0.851)};
R.range=[PC.niceRange(0.12,0.87),PC.niceRange(-3.3,12.6),PC.niceRange(5,5)];
// the steady range: running, a trace that grows opens it at once; a trace that shrinks closes it only after 2 s; paused,
// the same view keeps it and another view fits at once; other channels fit at once
{const a=new PC.AutoRange({shrink:.5,hold:2000}),log=[];const run=(lo,hi,now,o={})=>{const r=a.update(lo,hi,{sig:'A',running:true,now,...o});log.push([now,...r]);return r;};
 run(0,1,0);run(0,1.3,100);run(0,1.2,200);run(0,0.4,300);run(0,0.4,1500);run(0,0.4,2400);run(0,0.45,2500);
 const p1=a.update(0,0.41,{sig:'A',running:false,view:'v1',now:2600}),p2=a.update(0,0.2,{sig:'A',running:false,view:'v1',now:2700}),p3=a.update(0,0.2,{sig:'A',running:false,view:'v2',now:2800}),
  p4=a.update(5,6,{sig:'B',running:true,now:2900});
 R.auto={log,p1,p2,p3,p4};}
process.stdout.write(JSON.stringify(R));
