// 4.19.4 (ROADMAP §73): the viewer of the network of a study (web/studio/netview.js) headless. The data are what the engine gives
// the page (pcl.study.run with view), written by the test into a file: {name: data}. For each: the arrays of the model, the
// transform that shows everything, what a point of the canvas picks, what the zoom has room for, and a frame drawn on a canvas
// that only records its calls; then the interactive viewer on an element that only keeps its listeners.
// Usage: node netview_cases.js data.json -> JSON {name: {...}}
const fs=require('fs'),path=require('path');
const NV=require(path.resolve(__dirname,'../../web/studio/netview.js'));
// a 2D context that records what is drawn: counts per call, the colours used, the texts
function fake(){const c={n:{},stroke:new Set(),fill:new Set(),texts:[],segs:0,arcs:0,rects:0,inside:0,W:0,H:0};
 const cnt=k=>(...a)=>{c.n[k]=(c.n[k]||0)+1;return a;};
 const ctx={clearRect:cnt('clearRect'),beginPath:cnt('beginPath'),setTransform:cnt('setTransform'),
  fillRect(x,y,w,h){if(w>=c.W-1e-9&&h>=c.H-1e-9){c.n.bg=(c.n.bg||0)+1;return;}c.rects++;c.fill.add(ctx.fillStyle);},
  moveTo(x,y){c.last=[x,y];},lineTo(x,y){c.segs++;if(Number.isFinite(x)&&Number.isFinite(y))c.inside++;},
  arc(x,y,r){c.arcs++;},stroke(){c.n.stroke=(c.n.stroke||0)+1;c.stroke.add(ctx.strokeStyle);},fill(){c.n.fill=(c.n.fill||0)+1;c.fill.add(ctx.fillStyle);},
  fillText(t,x,y){c.texts.push(String(t));},setLineDash(a){if(a.length)c.dashes=(c.dashes||0)+1;c.dash=a.length;},fillStyle:'',strokeStyle:'',lineWidth:1,lineCap:'',font:'',textBaseline:''};
 return {ctx,c};}
function frame(m,tr,w,h,layer,opt){const {ctx,c}=fake();c.W=w;c.H=h;const out=NV.draw(ctx,m,tr,w,h,layer,opt);
 return {out,segs:c.segs,arcs:c.arcs,rects:c.rects,texts:c.texts.length,someTexts:c.texts.slice(0,4),stroke:[...c.stroke],fill:[...c.fill],bg:c.n.bg||0,dashes:c.dashes||0,dashLeft:c.dash||0};}
function one(data){const m=NV.model(data),w=900,h=600,tr=NV.fit(m,w,h),sx=x=>(x-tr.cx)*tr.s+w/2,sy=y=>(y-tr.cy)*tr.s+h/2,r={};
 r.model={nb:m.nb,ne:m.ne,layers:[...m.layers.keys()],cells:m.grid.size,inCells:[...m.grid.values()].reduce((s,g)=>s+g.length,0),
  ends:(()=>{let ok=0;for(let j=0;j<m.ne;j++){const e=m.v.branches[j];if(m.v.buses[m.a[j]].id===e.a&&m.v.buses[m.b[j]].id===e.b)ok++;}return ok;})(),
  // parallel branches are drawn side by side: the same ends, different segments
  parallel:m.v.branches.filter(e=>e.of>1).length,
  apart:(()=>{let worst=Infinity,n=0;for(let j=0;j<m.ne;j++){const e=m.v.branches[j];if(!(e.of>1))continue;n++;
    for(let k=j+1;k<m.ne;k++){const g=m.v.branches[k];if(g.of>1&&((g.a===e.a&&g.b===e.b)||(g.a===e.b&&g.b===e.a)))worst=Math.min(worst,Math.hypot(m.x1[j]-m.x1[k],m.y1[j]-m.y1[k])/m.v.unit);}}return n?worst:null;})()};
 // everything inside the canvas, and the picture fills one of the two directions
 let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;for(let i=0;i<m.nb;i++){x0=Math.min(x0,sx(m.x[i]));x1=Math.max(x1,sx(m.x[i]));y0=Math.min(y0,sy(m.y[i]));y1=Math.max(y1,sy(m.y[i]));}
 r.fit={s:tr.s,box:[x0,y0,x1,y1],w,h,px:NV.detail(tr,m).px};
 // picking: every bus at its own place; every branch at its middle unless a bus is nearer; nothing far outside
 let busOk=0,brOk=0,brBus=0;for(let i=0;i<m.nb;i++){const q=NV.pick(m,tr,w,h,sx(m.x[i]),sy(m.y[i]));if(q&&q.kind==='bus'&&q.i===i)busOk++;}
 for(let j=0;j<m.ne;j++){const q=NV.pick(m,tr,w,h,sx((m.x1[j]+m.x2[j])/2),sy((m.y1[j]+m.y2[j])/2));if(q&&q.kind==='branch'&&q.j===j)brOk++;else if(q&&q.kind==='bus')brBus++;}
 r.pick={busOk,brOk,brBus,far:NV.pick(m,tr,w,h,-500,-500)};
 // the same picks without the grid (zoomed far out the window of the search covers more than 40 cells: the plain pass)
 const tiny={s:tr.s/200,cx:tr.cx,cy:tr.cy},pt=NV.pick(m,tiny,w,h,w/2,h/2);r.pick.farOut=pt?pt.kind:null;
 // detail by zoom: pixels per unit 5, 20, 30, 60, 120
 r.detail=[5,20,30,60,120].map(px=>{const d=NV.detail({s:px/m.v.unit,cx:0,cy:0},m);return [px,d.dots,d.rings,d.trafo,d.names,d.values];});
 // frames: everything (as fitted), close to the first bus, and far away from the network
 const layer=data.layer||'base',L=m.layers.get(layer);
 r.layer={layer,palette:L.palette,busC:L.bus_c?Math.max(...L.bus_c):null,branchC:L.branch_c?Math.max(...L.branch_c):null,legend:(L.legend||[]).length};
 r.all=frame(m,tr,w,h,layer,{});
 const close={s:130/m.v.unit,cx:m.x[0],cy:m.y[0]};r.close=frame(m,close,w,h,layer,{});
 r.closeOn=frame(m,close,w,h,layer,{names:'off'});r.allNames=frame(m,tr,w,h,layer,{names:'on'});
 r.away=frame(m,{s:tr.s,cx:tr.cx+1e6,cy:tr.cy},w,h,layer,{});
 r.base=frame(m,tr,w,h,'base',{});r.unknown=frame(m,tr,w,h,'no-such-layer',{});
 r.hit=frame(m,tr,w,h,layer,{hit:{kind:'bus',i:0}}).arcs-r.all.arcs;
 r.text={bus:NV.describe(m,{kind:'bus',i:0,bus:m.v.buses[0]},layer),branch:m.ne?NV.describe(m,{kind:'branch',j:0,branch:m.v.branches[0]},layer):'',none:NV.describe(m,null,layer)};
 const jo=m.v.branches.findIndex(e=>e.off);r.off=jo<0?null:{j:jo,text:NV.describe(m,{kind:'branch',j:jo,branch:m.v.branches[jo]},layer),pick:(q=>q&&q.kind==='branch'&&q.j===jo)(NV.pick(m,tr,w,h,sx((m.x1[jo]+m.x2[jo])/2),sy((m.y1[jo]+m.y2[jo])/2)))};
 // 4.20.1: the DC grid: every DC bus, station and DC line picked at its place, the segments of the stations from their buses,
 // what a frame draws of it (all of it, and nothing far away), its texts, the values close to a DC bus, the ring of a pick
 if(m.dc){const D=m.dc,dl=m.layers.has('flow')?'flow':layer,ins=(X,Y)=>X>=0&&X<=w&&Y>=0&&Y<=h;let busOk=0,stOk=0,lineOk=0,lineOther=0,ends=0,inside=0;
  for(let i=0;i<D.nd;i++){const q=NV.pick(m,tr,w,h,sx(D.x[i]),sy(D.y[i]));if(q&&q.kind==='dcbus'&&q.i===i)busOk++;if(ins(sx(D.x[i]),sy(D.y[i])))inside++;}
  for(let j=0;j<D.ns;j++){const q=NV.pick(m,tr,w,h,sx((D.s1[j]+D.s2[j])/2),sy((D.t1[j]+D.t2[j])/2));if(q&&q.kind==='station'&&q.j===j)stOk++;
   const st=D.v.stations[j],a=m.ix.get(st.ac),b=D.dix.get(st.dc);if(D.s1[j]===m.x[a]&&D.t1[j]===m.y[a]&&D.s2[j]===D.x[b]&&D.t2[j]===D.y[b])ends++;}
  for(let j=0;j<D.nl;j++){const q=NV.pick(m,tr,w,h,sx((D.x1[j]+D.x2[j])/2),sy((D.y1[j]+D.y2[j])/2));if(q&&q.kind==='dcline'&&q.j===j)lineOk++;else if(q)lineOther++;}
  const near={s:130/m.v.unit,cx:D.x[0],cy:D.y[0]},Lf=m.layers.get(dl);
  r.dc={nd:D.nd,nl:D.nl,ns:D.ns,busOk,stOk,lineOk,lineOther,ends,inside,layer:dl,
   all:frame(m,tr,w,h,dl,{}),away:frame(m,{s:tr.s,cx:tr.cx+1e6,cy:tr.cy},w,h,dl,{}),close:frame(m,near,w,h,dl,{}),closeOff:frame(m,near,w,h,dl,{names:'off'}),base:frame(m,tr,w,h,'base',{}),
   hit:frame(m,tr,w,h,dl,{hit:{kind:'dcbus',i:0}}).arcs-frame(m,tr,w,h,dl,{}).arcs,hitLine:frame(m,tr,w,h,dl,{hit:{kind:'dcline',j:0}}).segs-frame(m,tr,w,h,dl,{}).segs,
   text:{bus:NV.describe(m,{kind:'dcbus',i:0,bus:D.v.buses[0]},dl),line:NV.describe(m,{kind:'dcline',j:0,line:D.v.lines[0]},dl),station:NV.describe(m,{kind:'station',j:0,station:D.v.stations[0]},dl),
    plain:NV.describe(m,{kind:'dcbus',i:0,bus:D.v.buses[0]},'base')},
   palette:Lf.palette,maxC:Math.max(...Lf.dc.bus_c,...Lf.dc.line_c,...Lf.dc.station_c)};}
 r.num=[NV.num(1234.5,'MW'),NV.num(12.345),NV.num(1.2345,'pu'),NV.num(0.01234),NV.num(null),NV.num(NaN)];
 // the interactive viewer: an element that keeps its listeners, frames asked through a timer we drive
 const ls={},{ctx,c}=fake();c.W=800;c.H=500;let pending=[];globalThis.requestAnimationFrame=f=>{pending.push(f);return pending.length;};
 const flush=()=>{const p=pending;pending=[];p.forEach(f=>f());};
 const canvas={width:0,height:0,style:{},getContext:()=>ctx,getBoundingClientRect:()=>({left:0,top:0,width:800,height:500}),
  addEventListener:(k,f)=>{ls[k]=f;},removeEventListener:(k,f)=>{if(ls[k]===f)delete ls[k];},setPointerCapture(){}};
 const infos=[],picks=[],v=NV.create(canvas,data,{info:t=>infos.push(t),pick:q=>picks.push(q&&q.kind)});flush();
 const T=()=>v.state.tr,X=i=>(m.x[i]-T().cx)*T().s+400,Y=i=>(m.y[i]-T().cy)*T().s+250;
 const iv={listeners:Object.keys(ls).sort(),layer0:v.state.layer,frames0:v.state.frames,size:[canvas.width,canvas.height],layers:v.layers().map(q=>q.layer),legend:v.legend().items.length};
 ls.pointermove({clientX:X(1),clientY:Y(1)});flush();iv.hover=infos[infos.length-1];iv.cursor=canvas.style.cursor;
 ls.pointermove({clientX:-300,clientY:-300});flush();iv.leave=infos[infos.length-1];iv.cursor2=canvas.style.cursor;
 const s0=T().s,c0=[T().cx,T().cy];ls.pointerdown({clientX:100,clientY:100,pointerId:1});ls.pointermove({clientX:160,clientY:130});ls.pointerup({clientX:160,clientY:130});flush();
 iv.drag=[(c0[0]-T().cx)*T().s,(c0[1]-T().cy)*T().s,T().s===s0,picks.length];
 ls.pointerdown({clientX:X(2),clientY:Y(2),pointerId:1});ls.pointerup({clientX:X(2),clientY:Y(2)});iv.click=picks.slice();
 // the wheel zooms around the pointer: the point of the network under it stays under it
 const px=300,py=200,wx=(px-400)/T().s+T().cx,wy=(py-250)/T().s+T().cy;let prevented=0;ls.wheel({clientX:px,clientY:py,deltaY:-400,preventDefault(){prevented++;}});flush();
 iv.wheel=[T().s/s0,(wx-T().cx)*T().s+400-px,(wy-T().cy)*T().s+250-py,prevented];
 for(let k=0;k<60;k++)v.zoom(3);const smax=T().s*m.v.unit;for(let k=0;k<60;k++)v.zoom(1/3);const smin=T().s;v.fit();iv.limits=[smax,smin/T().s];
 iv.goto=[v.goto(m.v.buses[m.nb-1].id),Math.abs(T().cx-m.x[m.nb-1])+Math.abs(T().cy-m.y[m.nb-1]),T().s*m.v.unit>=70-1e-9,v.goto('no such bus'),infos[infos.length-1]];
 iv.setLayer=[v.setLayer('base'),v.setLayer('nothing'),v.legend().title];v.setNames('on');const n1=v.state.names;v.setNames('whatever');iv.names=[n1,v.state.names];
 ls.dblclick();flush();iv.dbl=Math.abs(T().s-NV.fit(m,800,500).s)<1e-12;const f1=v.state.frames;v.destroy();v.redraw();flush();iv.dead=[Object.keys(ls).length,v.state.frames===f1];
 const v2=NV.create(canvas,data,{tr:{s:2.5,cx:10,cy:20},layer:'base'});flush();iv.again=[v2.state.tr.s,v2.state.tr.cx,v2.state.tr.cy,v2.state.layer,v2.state.fitted];v2.destroy();
 // a canvas that changes size: everything again while nobody has moved or zoomed, the same view after that
 let H=500;const cv3={...canvas,getBoundingClientRect:()=>({left:0,top:0,width:800,height:H})},v3=NV.create(cv3,data,{});flush();H=300;v3.redraw();flush();const refit=Math.abs(v3.state.tr.s-NV.fit(m,800,300).s)<1e-12;
 v3.zoom(2);flush();const sz=v3.state.tr.s;H=500;v3.redraw();flush();iv.resize=[refit,v3.state.tr.s===sz,v3.state.fitted];v3.destroy();
 r.viewer=iv;return r;}
const data=JSON.parse(fs.readFileSync(process.argv[2],'utf8')),out={};for(const k of Object.keys(data))out[k]=one(data[k]);
// the data are only read: two models of the same data are equal, and the data are not changed by drawing
const k0=Object.keys(data)[0],before=JSON.stringify(data[k0]);one(data[k0]);out.pure=JSON.stringify(data[k0])===before;
console.log(JSON.stringify(out));
