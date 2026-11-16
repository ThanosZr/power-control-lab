'use strict';
// 4.19.4 (ROADMAP §73, decisions 271, 272): a light viewer of the network of a study. The study tutorials draw the 9-bus
// network in EMT whatever network the study runs on; this shows the network that is studied, with what the study found.
//
// The data come from the engine (pcl.netview through the study, {view, layers}): the places of the buses, the branches, and
// per layer the colour of every bus and branch (indices into a small palette) and its value. The viewer only draws: one
// canvas, moved by dragging and zoomed by the wheel, that draws what is inside the window and as much detail as the zoom
// has room for (dots when the buses are a few pixels apart, rings, names and values as they separate). It is not the
// circuit editor and builds nothing per bus in the page, so a network of thousands of buses stays light.
//
//   NetView.model(data)                the arrays the drawing and the picking use (pure, also for tests)
//   NetView.fit(model, w, h)           the transform {s, cx, cy} that shows everything
//   NetView.pick(model, tr, w, h, x, y) the bus or the branch under a point of the canvas, or null
//   NetView.detail(tr, model)          what the zoom has room for: {dots, rings, trafo, names, values}
//   NetView.draw(ctx, model, tr, w, h, layer, opt)  one frame; returns what it drew {buses, branches, names}
//   NetView.create(canvas, data, opt)  the interactive viewer: setLayer, fit, zoom, setNames, info(cb), destroy;
//                                      opt: info(text, hit), pick(hit) on a click, layer, tr (the transform to open with)
(function(root){
 const GREY='#9e9e9e';
 function model(data){
  const v=data.view,nb=v.buses.length,ne=v.branches.length,ix=new Map(v.buses.map((b,i)=>[b.id,i]));
  const x=new Float64Array(nb),y=new Float64Array(nb);for(let i=0;i<nb;i++){x[i]=v.buses[i].x;y[i]=v.buses[i].y;}
  const a=new Int32Array(ne),b=new Int32Array(ne),x1=new Float64Array(ne),y1=new Float64Array(ne),x2=new Float64Array(ne),y2=new Float64Array(ne);
  for(let j=0;j<ne;j++){const e=v.branches[j],p=ix.get(e.a),q=ix.get(e.b);a[j]=p;b[j]=q;let ax=x[p],ay=y[p],bx=x[q],by=y[q];
   if(e.of>1){const dx=bx-ax,dy=by-ay,L=Math.hypot(dx,dy)||1,off=(e.k-(e.of+1)/2)*0.12*v.unit;ax-=dy/L*off;ay+=dx/L*off;bx-=dy/L*off;by+=dx/L*off;}   // parallel branches side by side
   x1[j]=ax;y1[j]=ay;x2[j]=bx;y2[j]=by;}
  // a grid of cells one unit wide, for picking and for the names (which bus is where, without a pass over all of them)
  const cell=v.unit,gx0=v.bounds[0],gy0=v.bounds[1],gw=Math.max(1,Math.ceil((v.bounds[2]-gx0)/cell)+1),gh=Math.max(1,Math.ceil((v.bounds[3]-gy0)/cell)+1),grid=new Map();
  for(let i=0;i<nb;i++){const k=Math.floor((y[i]-gy0)/cell)*gw+Math.floor((x[i]-gx0)/cell);let g=grid.get(k);if(!g)grid.set(k,g=[]);g.push(i);}
  return {v,nb,ne,x,y,a,b,x1,y1,x2,y2,ix,cell,gx0,gy0,gw,gh,grid,layers:new Map((data.layers||[]).map(L=>[L.layer,L]))};
 }
 // world → canvas: X = (x − cx)·s + w/2
 function fit(m,w,h,pad=24){const [x0,y0,x1,y1]=m.v.bounds,bw=Math.max(x1-x0,m.v.unit),bh=Math.max(y1-y0,m.v.unit);
  return {s:Math.min((w-2*pad)/bw,(h-2*pad)/bh),cx:(x0+x1)/2,cy:(y0+y1)/2};}
 const sx=(tr,w,x)=>(x-tr.cx)*tr.s+w/2,sy=(tr,h,y)=>(y-tr.cy)*tr.s+h/2;
 // what the zoom has room for; px = pixels per unit (a typical branch)
 function detail(tr,m){const px=tr.s*m.v.unit;return {px,dots:px<14,rings:px>=14,trafo:px>=22,names:px>=52,values:px>=95,r:Math.max(1.6,Math.min(7,px*0.085))};}
 function pick(m,tr,w,h,X,Y){
  const wx=(X-w/2)/tr.s+tr.cx,wy=(Y-h/2)/tr.s+tr.cy,rb=9/tr.s;let best=-1,bd=rb*rb;
  const c0=Math.floor((wx-rb-m.gx0)/m.cell),c1=Math.floor((wx+rb-m.gx0)/m.cell),r0=Math.floor((wy-rb-m.gy0)/m.cell),r1=Math.floor((wy+rb-m.gy0)/m.cell);
  if(c1-c0<40&&r1-r0<40){for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++){const g=m.grid.get(r*m.gw+c);if(!g||c<0||c>=m.gw)continue;for(const i of g){const d=(m.x[i]-wx)**2+(m.y[i]-wy)**2;if(d<bd){bd=d;best=i;}}}}
  else for(let i=0;i<m.nb;i++){const d=(m.x[i]-wx)**2+(m.y[i]-wy)**2;if(d<bd){bd=d;best=i;}}
  if(best>=0)return {kind:'bus',i:best,bus:m.v.buses[best]};
  const re=6/tr.s;let be=-1,de=re*re;
  for(let j=0;j<m.ne;j++){const ax=m.x1[j],ay=m.y1[j],dx=m.x2[j]-ax,dy=m.y2[j]-ay;
   if(wx<Math.min(ax,ax+dx)-re||wx>Math.max(ax,ax+dx)+re||wy<Math.min(ay,ay+dy)-re||wy>Math.max(ay,ay+dy)+re)continue;
   const L2=dx*dx+dy*dy,t=L2?Math.max(0,Math.min(1,((wx-ax)*dx+(wy-ay)*dy)/L2)):0,d=(ax+t*dx-wx)**2+(ay+t*dy-wy)**2;if(d<de){de=d;be=j;}}
  return be>=0?{kind:'branch',j:be,branch:m.v.branches[be]}:null;
 }
 const num=(x,u)=>{if(x===null||x===undefined||!Number.isFinite(x))return '';const a=Math.abs(x),s=a>=100?x.toFixed(0):a>=10?x.toFixed(1):a>=1?x.toFixed(2):x.toFixed(3);return s.replace('.',',')+(u?' '+u:'');};
 // the text of a bus or a branch for the info line
 function describe(m,hit,layer){if(!hit)return '';const L=m.layers.get(layer);
  if(hit.kind==='bus'){const b=hit.bus,val=L&&L.bus_v?L.bus_v[hit.i]:null;
   return `Ζυγός ${b.id}`+(b.label?` «${b.label}»`:'')+(b.Un?` · ${num(b.Un/1e3)} kV`:'')+(b.type==='slack'?' · ζυγός ταλάντωσης':b.type==='PV'?' · PV':'')+(b.gen&&b.type==='PQ'?' · παραγωγή':'')+(b.load?' · φορτίο':'')+(b.shunt?' · εγκάρσιο στοιχείο':'')
    +(val!==null&&val!==undefined?` · ${num(val,L.unit_bus)}`:'');}
  const e=hit.branch,val=L&&L.branch_v?L.branch_v[hit.j]:null;
  return `${e.trafo?'Μετασχηματιστής':'Κλάδος'} ${e.name}: ${e.a} – ${e.b}`+(e.of>1?` (${e.k} από ${e.of} παράλληλους)`:'')+(e.off?' · εκτός λειτουργίας':'')+(val!==null&&val!==undefined?` · ${num(val,L.unit_branch)}`:'');}
 function draw(ctx,m,tr,w,h,layer,opt={}){
  const L=m.layers.get(layer)||m.layers.get('base')||{palette:[GREY],bus_c:null,branch_c:null},pal=L.palette||[GREY],D=detail(tr,m),hot=layer!=='base';
  ctx.clearRect(0,0,w,h);ctx.fillStyle=opt.bg||'#ffffff';ctx.fillRect(0,0,w,h);
  const wl=(0-w/2)/tr.s+tr.cx,wr=(w-w/2)/tr.s+tr.cx,wt=(0-h/2)/tr.s+tr.cy,wb=(h-h/2)/tr.s+tr.cy,out={buses:0,branches:0,names:0,values:0};
  // branches: one path per colour, the grey ones first so that the coloured stay on top
  const byc=pal.map(()=>[]);
  const offs=[];
  for(let j=0;j<m.ne;j++){if(Math.max(m.x1[j],m.x2[j])<wl||Math.min(m.x1[j],m.x2[j])>wr||Math.max(m.y1[j],m.y2[j])<wt||Math.min(m.y1[j],m.y2[j])>wb)continue;out.branches++;
   if(m.v.branches[j].off)offs.push(j);else byc[L.branch_c?L.branch_c[j]:0].push(j);}
  const order=pal.map((c,i)=>i).sort((p,q)=>(pal[p]===GREY?0:1)-(pal[q]===GREY?0:1));
  ctx.lineCap='round';
  for(const ci of order){const js=byc[ci];if(!js.length)continue;const col=pal[ci],strong=hot&&col!==GREY;ctx.strokeStyle=col;ctx.lineWidth=Math.max(1,Math.min(3,D.px*0.03))*(strong?2:1);ctx.beginPath();
   for(const j of js){ctx.moveTo(sx(tr,w,m.x1[j]),sy(tr,h,m.y1[j]));ctx.lineTo(sx(tr,w,m.x2[j]),sy(tr,h,m.y2[j]));}ctx.stroke();
   if(D.trafo){ctx.fillStyle='#ffffff';for(const j of js){if(!m.v.branches[j].trafo)continue;const X=sx(tr,w,(m.x1[j]+m.x2[j])/2),Y=sy(tr,h,(m.y1[j]+m.y2[j])/2);ctx.beginPath();ctx.arc(X,Y,D.r*0.7,0,6.2832);ctx.fill();ctx.stroke();}}}
  // 4.19.4: a branch that a change took out of service stays at its place, dashed and without a value
  if(offs.length){out.off=offs.length;ctx.strokeStyle='#7a7a7a';ctx.lineWidth=Math.max(1,Math.min(2,D.px*0.02));ctx.setLineDash?.([5,5]);ctx.beginPath();
   for(const j of offs){ctx.moveTo(sx(tr,w,m.x1[j]),sy(tr,h,m.y1[j]));ctx.lineTo(sx(tr,w,m.x2[j]),sy(tr,h,m.y2[j]));}ctx.stroke();ctx.setLineDash?.([]);}
  // buses
  const vis=[];for(let i=0;i<m.nb;i++){if(m.x[i]<wl-m.cell||m.x[i]>wr+m.cell||m.y[i]<wt-m.cell||m.y[i]>wb+m.cell)continue;vis.push(i);}
  out.buses=vis.length;
  if(D.dots){const byb=pal.map(()=>[]);for(const i of vis)byb[L.bus_c?L.bus_c[i]:0].push(i);
   for(const ci of order){const is=byb[ci];if(!is.length)continue;ctx.fillStyle=pal[ci];const r=pal[ci]===GREY||!hot?D.r:D.r*1.5;for(const i of is)ctx.fillRect(sx(tr,w,m.x[i])-r,sy(tr,h,m.y[i])-r,2*r,2*r);}}
  else for(const i of vis){const b=m.v.buses[i],col=pal[L.bus_c?L.bus_c[i]:0],X=sx(tr,w,m.x[i]),Y=sy(tr,h,m.y[i]),r=D.r*(b.type==='slack'?1.5:1);
   ctx.beginPath();ctx.arc(X,Y,r,0,6.2832);
   if(b.gen){ctx.fillStyle='#ffffff';ctx.fill();ctx.strokeStyle=col;ctx.lineWidth=Math.max(1.5,r*0.45);ctx.stroke();}
   else{ctx.fillStyle=col;ctx.fill();ctx.strokeStyle='#5f6b6d';ctx.lineWidth=0.6;ctx.stroke();}
   if(b.load&&D.px>=60){ctx.strokeStyle='#5f6b6d';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(X,Y+r);ctx.lineTo(X,Y+r+5);ctx.moveTo(X-3,Y+r+2);ctx.lineTo(X,Y+r+6);ctx.lineTo(X+3,Y+r+2);ctx.stroke();}}
  // names and values, where there is room (or asked for and the buses in the window are few)
  const names=opt.names==='on'?vis.length<=900:opt.names==='off'?false:D.names;
  if(names){ctx.fillStyle='#22313a';ctx.font=`${Math.max(9,Math.min(13,D.px*0.16))}px sans-serif`;ctx.textBaseline='bottom';
   const vals=D.values&&L.bus_v;for(const i of vis){const X=sx(tr,w,m.x[i])+D.r+2,Y=sy(tr,h,m.y[i])-D.r;ctx.fillText(m.v.buses[i].id,X,Y);out.names++;
    if(vals&&L.bus_v[i]!==null&&L.bus_v[i]!==undefined){ctx.fillStyle='#5f6b6d';ctx.fillText(num(L.bus_v[i],L.unit_bus),X,Y+13);ctx.fillStyle='#22313a';out.values++;}}
   if(D.values&&L.branch_v){ctx.fillStyle='#5f6b6d';ctx.textBaseline='middle';for(const js of byc)for(const j of js){const x=L.branch_v[j];if(x===null||x===undefined)continue;
     ctx.fillText(num(x,L.unit_branch),sx(tr,w,(m.x1[j]+m.x2[j])/2)+4,sy(tr,h,(m.y1[j]+m.y2[j])/2));out.values++;}}}
  if(opt.hit){const q=opt.hit;ctx.strokeStyle='#111111';ctx.lineWidth=2;ctx.beginPath();
   if(q.kind==='bus')ctx.arc(sx(tr,w,m.x[q.i]),sy(tr,h,m.y[q.i]),D.r+4,0,6.2832);else{ctx.moveTo(sx(tr,w,m.x1[q.j]),sy(tr,h,m.y1[q.j]));ctx.lineTo(sx(tr,w,m.x2[q.j]),sy(tr,h,m.y2[q.j]));}ctx.stroke();}
  return out;
 }
 // the interactive viewer on a canvas element
 function create(canvas,data,opt={}){
  const m=model(data),st={layer:opt.layer&&m.layers.has(opt.layer)?opt.layer:(data.layer&&m.layers.has(data.layer)?data.layer:'base'),names:'auto',hit:null,tr:null,w:0,h:0,drawn:null,frames:0};
  const ctx=canvas.getContext('2d');let raf=0,info=opt.info||null,dead=false;
  const size=()=>{const r=canvas.getBoundingClientRect(),dpr=root.devicePixelRatio||1,w=Math.max(50,Math.round(r.width)),h=Math.max(50,Math.round(r.height));
   if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
   ctx.setTransform(dpr,0,0,dpr,0,0);const first=!st.tr,changed=st.w!==w||st.h!==h;st.w=w;st.h=h;
   // the first frame shows everything (or what the caller was showing); while nobody has moved or zoomed, a new size of the canvas shows everything again
   if(first){const given=opt.tr&&Number.isFinite(opt.tr.s)&&opt.tr.s>0;st.tr=given?{s:opt.tr.s,cx:opt.tr.cx,cy:opt.tr.cy}:fit(m,w,h);st.fitted=!given;}else if(changed&&st.fitted)st.tr=fit(m,w,h);};
  const paint=()=>{raf=0;if(dead)return;size();st.drawn=draw(ctx,m,st.tr,st.w,st.h,st.layer,{names:st.names,hit:st.hit});st.frames++;};
  const ask=()=>{if(!raf)raf=(root.requestAnimationFrame||(f=>setTimeout(f,16)))(paint);};
  const at=e=>{const r=canvas.getBoundingClientRect();return [e.clientX-r.left,e.clientY-r.top];};
  let drag=null;
  const down=e=>{const [X,Y]=at(e);drag={X,Y,cx:st.tr.cx,cy:st.tr.cy,moved:false};canvas.setPointerCapture?.(e.pointerId);};
  const move=e=>{const [X,Y]=at(e);
   if(drag){if(Math.abs(X-drag.X)+Math.abs(Y-drag.Y)>3){drag.moved=true;st.fitted=false;}st.tr={s:st.tr.s,cx:drag.cx-(X-drag.X)/st.tr.s,cy:drag.cy-(Y-drag.Y)/st.tr.s};ask();return;}
   const q=pick(m,st.tr,st.w,st.h,X,Y),same=(q&&st.hit&&q.kind===st.hit.kind&&q.i===st.hit.i&&q.j===st.hit.j)||(!q&&!st.hit);
   if(!same){st.hit=q;canvas.style.cursor=q?'pointer':'grab';if(info)info(describe(m,q,st.layer),q);ask();}};
  const up=e=>{if(drag&&!drag.moved&&opt.pick){const [X,Y]=at(e);opt.pick(pick(m,st.tr,st.w,st.h,X,Y));}drag=null;};
  const wheel=e=>{e.preventDefault();const [X,Y]=at(e);api.zoom(Math.exp(-e.deltaY*0.0015),X,Y);};
  const dbl=()=>api.fit();
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
  canvas.addEventListener('wheel',wheel,{passive:false});canvas.addEventListener('dblclick',dbl);canvas.style.cursor='grab';canvas.style.touchAction='none';
  let ro=null;if(root.ResizeObserver){ro=new ResizeObserver(()=>ask());ro.observe(canvas);}
  const api={model:m,state:st,
   layers:()=>[...m.layers.values()].map(L=>({layer:L.layer,title:L.title})),
   legend:()=>{const L=m.layers.get(st.layer);return L?{title:L.title,items:L.legend||[]}:{title:'',items:[]};},
   setLayer(l){if(m.layers.has(l)){st.layer=l;if(info)info(describe(m,st.hit,st.layer),st.hit);ask();}return st.layer;},
   setNames(v){st.names=['auto','on','off'].includes(v)?v:'auto';ask();},
   fit(){size();st.tr=fit(m,st.w,st.h);st.fitted=true;ask();},
   // zoom by a factor around a point of the canvas (the middle when none is given), within sensible limits
   zoom(f,X,Y){size();if(X===undefined){X=st.w/2;Y=st.h/2;}const f0=fit(m,st.w,st.h).s,s=Math.max(f0*0.5,Math.min(st.tr.s*f,40/m.v.unit*10)),wx=(X-st.w/2)/st.tr.s+st.tr.cx,wy=(Y-st.h/2)/st.tr.s+st.tr.cy;
    st.tr={s,cx:wx-(X-st.w/2)/s,cy:wy-(Y-st.h/2)/s};st.fitted=false;ask();},
   // show a bus in the middle, close enough to read its neighbours
   goto(id){let i=m.ix.get(String(id));if(i===undefined){const t=String(id).trim().toLowerCase(),k=t?m.v.buses.findIndex(b=>b.label&&b.label.toLowerCase()===t):-1;i=k<0?undefined:k;}if(i===undefined)return false;size();st.tr={s:Math.max(st.tr.s,70/m.v.unit),cx:m.x[i],cy:m.y[i]};st.fitted=false;st.hit={kind:'bus',i,bus:m.v.buses[i]};if(info)info(describe(m,st.hit,st.layer),st.hit);ask();return true;},
   info(cb){info=cb;},redraw:ask,paint,
   destroy(){dead=true;ro?.disconnect();canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);
    canvas.removeEventListener('wheel',wheel);canvas.removeEventListener('dblclick',dbl);}};
  ask();return api;
 }
 const api={model,fit,detail,pick,draw,describe,create,num};
 root.NetView=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
