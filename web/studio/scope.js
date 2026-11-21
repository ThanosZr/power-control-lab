'use strict';
// Multi-pane oscilloscope over the simulator's recorded data.
//  * raw samples (min/max decimated per pixel column) while the window fits in
//    the ring buffer, per-period mean + min/max band beyond it
//  * roll / period-synchronised display, frozen view with wheel zoom + drag pan
//  * hover readout, two pinned cursors (click / Shift+click), window statistics
//  * 4.11 (decision 4.11-θ): what left the ring buffer is not lost from the screen: a min/max envelope of the whole run
//    (ENV_B buckets that double in width as the run grows, fed from the ring at every drawing), and with a recording the
//    samples themselves read back from the file (opt.archive, per pixel column first/min/max/last); zoom on x, y or both
//    (wheel over the y axis or with Shift, a rectangle with Ctrl or the ▭ tool), and a history of the views (↶)
//  * 4.17.2 (ROADMAP §63, THEORY §8τ): every pane has its own height (drag the gap under it, double click there: all back to
//    automatic, ⛶ in its corner: the pane fills the view), the panes scroll in their box (the canvas is the visible part,
//    sticky, a spacer gives the height of all), the time axis on a canvas of its own under the box; the automatic y of a
//    pane is steady while it runs (it opens at once when a trace leaves it, it closes only after the traces have used less
//    than half of it for 2 s, its limits on the steps of the grid); dense data (more samples than pixels, the envelope of
//    the run, the columns of a recording) as a min–max shade with the mean as a line, the same look before and after the
//    ring buffer; the envelope keeps the mean (sum and count per bucket) and has as many buckets as the memory allows
(function(root){
 const COLORS=['#147966','#c47a1c','#2f5fa0','#b03a5b','#6b4fa0','#3d8b3d','#1f8fa0','#8a5a2b'];
 const UNIT={V:'V',I:'A',P:'W',N:'V',VN:'V',V2:'V',I2:'A',Im:'A',PSIm:'V·s',Vb:'V',Vc:'V',Vab:'V',Ib:'A',Ic:'A',PSW:'W',D:'',G:'',GS:'',REF:'',MEAS:'',CAR:''};
 // ports of multiports and machine phases (3.5–3.6): V3…V8, I3…I8, fluxes PSI1…PSI8
 for(let k=1;k<=8;k++){if(k>2){UNIT['V'+k]='V';UNIT['I'+k]='A';}UNIT['PSI'+k]='V·s';}
 // on/off signals: a pane holding only these draws each one in its own lane
 const LOGIC=new Set(['G','GS']),LOGIC_BLK=new Set(['CMP','SR','CLK','LOGIC']);
 const isLogic=(key,sim)=>{const [pre,id]=key.split(':');if(LOGIC.has(pre))return true;if(pre!=='Y')return false;const c=(sim||root.PCL?.S?.sim)?.net.compInfo.get(id);return !!(c&&LOGIC_BLK.has(c.type));};
 // 4.17.2: steps, ranges, ticks and labels from the core of the graphs (plotcore.js)
 const PC=root.PlotCore;const niceStep=PC.niceStep,fmtT=PC.fmtTime;
 const eng=(v,u)=>root.Parts.eng(v,u,4);
 const ENV_B=4096,ENV_MAX=65536;
 // the geometry of the panes (CSS px): above the first, between two (the handle of the upper one), under the last (its
 // handle); the smallest height of a pane; the height of the time axis when it has no canvas of its own
 const TOP=6,GAP=12,BOT=10,MINH=90,AXH=24;
 // the automatic y of a running pane: the traces under this share of the range for this long close it
 const Y_SHRINK=0.5,Y_HOLD=2000;
 class Scope{
  constructor(canvas,opt={}){
   this.cv=canvas;this.ctx=canvas.getContext('2d');this.opt=opt;this.sim=null;
   // 4.17.2: the box that scrolls (the parent of the canvas), the spacer after the canvas, the canvas of the time axis
   this.sc=opt.scroller||canvas.parentElement;this.ax=opt.axis||null;this.axc=this.ax?this.ax.getContext('2d'):null;this.sy=0;this.yst=[];
   this.spacer=opt.spacer||null;if(!this.spacer&&this.sc&&canvas.parentElement===this.sc){this.spacer=document.createElement('div');this.spacer.className='scope-spacer';canvas.after(this.spacer);}
   this.cfg={panes:[{ch:[]}],window:{unit:'T',n:20},trigger:'roll',display:'auto',frozen:null,cursors:[],follow:true,zoomAxes:'x',box:false,dense:'band'};this.hist=[];
   this.hoverX=null;this.ro=new ResizeObserver(()=>this.resize());this.ro.observe(this.sc);
   this.sc.addEventListener('scroll',()=>{this.sy=this.sc.scrollTop;this.requestDraw();},{passive:true});
   const cy=e=>e.offsetY+this.sy;   // the y of the content (all the panes) under the pointer
   canvas.addEventListener('pointermove',e=>{const y=cy(e);this.hoverX=e.offsetX;this.hoverY=y;if(this.rs){this.resizePane(y);return;}
    if(this.boxSel){this.boxSel.x1=e.offsetX;this.boxSel.y1=y;this.requestDraw();return;}if(this.selDrag){this.selDrag.x1=e.offsetX;this.requestDraw();return;}if(this.drag)this.panTo(e);
    else{const g=this.gapAt(y)>=0,m=this.maxAt(e.offsetX,y)>=0||this.gearAt(e.offsetX,y)>=0;canvas.style.cursor=g?'row-resize':m?'pointer':this.cfg.selMode?'col-resize':'';}if(!this.running)this.requestDraw();});
   canvas.addEventListener('pointerleave',()=>{this.hoverX=null;if(!this.running)this.requestDraw();this.opt.onhover?.(null);});
   canvas.addEventListener('pointerdown',e=>{e.preventDefault();canvas.setPointerCapture(e.pointerId);const y=cy(e);
    const g=this.gapAt(y);if(g>=0&&!(e.ctrlKey||e.metaKey)){this.rs={i:g,y,h:(this.layout||[]).map(L=>L.y1-L.y0),moved:false};return;}
    if(this.maxAt(e.offsetX,y)>=0){this.mx={i:this.maxAt(e.offsetX,y)};return;}
    if(this.gearAt(e.offsetX,y)>=0){this.gr={i:this.gearAt(e.offsetX,y)};return;}
    if(e.ctrlKey||e.metaKey||this.cfg.box){this.boxSel={x0:e.offsetX,y0:y,x1:e.offsetX,y1:y};return;}
    if(e.shiftKey||this.cfg.selMode){this.selDrag={x0:e.offsetX,x1:e.offsetX};return;}this.drag={x:e.offsetX,view:this.viewRange(),moved:false};});
   canvas.addEventListener('pointerup',e=>{if(this.rs){const r=this.rs;this.rs=null;if(r.moved)this.opt.onchange?.();return;}
    if(this.mx){const i=this.mx.i;this.mx=null;if(this.maxAt(e.offsetX,cy(e))===i)this.toggleMax(i);return;}
    if(this.gr){const i=this.gr.i;this.gr=null;if(this.gearAt(e.offsetX,cy(e))===i)this.opt.onpanecfg?.(i,e.clientX,e.clientY);return;}
    if(this.selDrag){const d=this.selDrag;this.selDrag=null;this.selectAt(d.x0,e.offsetX);return;}
    if(this.boxSel){const b=this.boxSel;this.boxSel=null;this.boxZoom(b);return;}const d=this.drag;this.drag=null;if(d&&!d.moved)this.cursorAt(e);});
   // wheel: the time axis; over the y labels, with Shift or in the mode 'y' the pane under the pointer; 'xy' both.
   // 4.17.2: with Alt the box of the panes scrolls (as over its scroll bar)
   canvas.addEventListener('wheel',e=>{if(e.altKey)return;e.preventDefault();const f=Math.exp(e.deltaY*.0015),ax=this.cfg.zoomAxes||'x',y=cy(e);this.histPush(true);
    if(e.offsetX<this.padL||e.shiftKey||ax==='y')this.zoomY(y,f);else{this.zoomAt(e.offsetX,f);if(ax==='xy')this.zoomY(y,f);}},{passive:false});
   canvas.addEventListener('dblclick',e=>{if(this.gapAt(cy(e))>=0){this.autoHeights();return;}this.histPush();this.cfg.frozen=null;this.cfg.cursors=[];if(this.win0){this.cfg.window=this.win0;this.win0=null;}this.unzoomY();this.opt.onchange?.();this.requestDraw();});
  }
  // ------------------------------------------------------------ 4.17.2: the heights of the panes
  // the height of every pane: its own (dragged) or a share of what the box leaves, never under MINH
  heights(){const P=this.cfg.panes,n=P.length,Hv=(this.Hv||420)-(this.ax?0:AXH),fix=P.map(p=>p.h>0?Math.max(MINH,p.h):0),nf=fix.filter(h=>!h).length,
    avail=Hv-TOP-BOT-GAP*(n-1)-fix.reduce((a,b)=>a+b,0),each=nf?Math.max(MINH,Math.floor(avail/nf)):0;return fix.map(h=>h||each);}
  // the handle under pane i (the gap under it, the strip under the last one), or -1
  gapAt(y){const L=this.layout||[];for(let i=0;i<L.length;i++){const a=L[i].y1,b=i<L.length-1?L[i+1].y0:a+BOT;if(y>a+1&&y<b-1)return i;}return -1;}
  // the ⛶ of a pane (top right corner), or -1
  maxAt(x,y){const L=this.layout||[];for(let i=0;i<L.length;i++){const q=L[i];if(q.hidden)continue;const bx=this.W-this.padR-20;if(x>=bx&&x<=bx+16&&y>=q.y0+3&&y<=q.y0+19)return i;}return -1;}
  // 5.0.2: the ⚙ of a pane (top left of its plot, before the titles of its channels, never under a floating panel on the
  // right): the settings of its y scale (opt.onpanecfg), or -1
  gearAt(x,y){const L=this.layout||[];for(let i=0;i<L.length;i++){const q=L[i];if(q.hidden)continue;const bx=this.padL+3;if(x>=bx&&x<=bx+16&&y>=q.y0+3&&y<=q.y0+19)return i;}return -1;}
  resizePane(y){const r=this.rs,P=this.cfg.panes;if(!r||!P[r.i])return;if(!r.moved){if(Math.abs(y-r.y)<2)return;r.moved=true;P.forEach((p,k)=>{p.h=Math.round(r.h[k]||MINH);delete p.max;});}
   P[r.i].h=Math.max(MINH,Math.round(r.h[r.i]+y-r.y));this.resize();}
  autoHeights(){for(const p of this.cfg.panes){delete p.h;delete p.max;}this.resize();this.opt.onchange?.();}
  // ⛶: the pane fills the visible box (and comes into view); again: its height of before
  toggleMax(i){const p=this.cfg.panes[i];if(!p)return;if(p.max){if(p.max.h>0)p.h=p.max.h;else delete p.h;delete p.max;}
   else{for(const q of this.cfg.panes)if(q.max){if(q.max.h>0)q.h=q.max.h;else delete q.h;delete q.max;}p.max={h:p.h||0};p.h=Math.max(MINH,(this.Hv||420)-TOP-BOT);}
   this.resize();const L=this.layout?.[i];if(L&&this.sc)this.sc.scrollTop=Math.max(0,L.y0-TOP);this.opt.onchange?.();}
  attach(sim){this.sim=sim;this.requestDraw();}
  // one drawing on the next frame for a burst of pointer or wheel events (4.6); the running loop draws anyway.
  // 4.7: also attach, channels added or moved, cursors, navigation: a tutorial with five channels drew six times in a row
  requestDraw(){if(this._raf)return;this._raf=requestAnimationFrame(()=>{this._raf=0;this.draw();});}
  // the colours of the theme, read again at most once a second (getComputedStyle in every frame forced a style recalculation)
  colors(){const now=performance.now();if(!this._col||now-this._col.t>1000){const css=getComputedStyle(this.cv);this._col={t:now,ink:css.getPropertyValue('--scope-ink')||'#203a3f',grid:css.getPropertyValue('--scope-grid')||'#e3ebe7',bg:css.getPropertyValue('--scope-bg')||'#fbfdfc'};}return this._col;}
  // reference traces from another solver: {label, data:{key:{t,y}}}, drawn dashed over the channel
  setRefs(refs){this.refs=refs||null;this.requestDraw();}
  refRange(key,t0,t1,fn){const d=this.refs?.data?.[key];if(!d)return false;const t=d.t;let lo=0,hi=t.length;while(lo<hi){const m=(lo+hi)>>1;if(t[m]<t0)lo=m+1;else hi=m;}
   for(let i=Math.max(0,lo-1);i<t.length;i++){fn(t[i],d.y[i]);if(t[i]>t1)break;}return true;}
  // navigation buttons: start, left, right, live, focus, in, out, all, autoy
  // 4.11: the views before each zoom or move (↶ goes back); a burst of wheel events is one step
  histPush(burst){const now=performance.now();if(burst&&now-(this._hT||0)<500){this._hT=now;return;}this._hT=now;
   this.hist.push(JSON.stringify({frozen:this.cfg.frozen,window:this.cfg.window,follow:this.cfg.follow,ys:this.cfg.panes.map(p=>p.y||null)}));if(this.hist.length>60)this.hist.shift();}
  back(){const h=this.hist.pop();if(!h)return false;const o=JSON.parse(h);Object.assign(this.cfg,{frozen:o.frozen,window:o.window,follow:o.follow});o.ys.forEach((y,i)=>{if(this.cfg.panes[i]){if(y)this.cfg.panes[i].y=y;else delete this.cfg.panes[i].y;}});
   this.opt.onchange?.();this.requestDraw();return true;}
  // the pane under y: {pane, L}
  paneAt(y){const k=(this.layout||[]).findIndex(L=>y>=L.y0-4&&y<=L.y1+4);return k<0?null:{pane:this.cfg.panes[k],L:this.layout[k]};}
  zoomY(y,f){const q=this.paneAt(y);if(!q)return;const {L}=q,vm=L.lo+(L.y1-y)/(L.y1-L.y0)*(L.hi-L.lo),lo=vm-(vm-L.lo)*f,hi=vm+(L.hi-vm)*f;if(!(hi>lo))return;
   q.pane.y=this.zoomed(q.pane,lo,hi);this.opt.onchange?.();this.requestDraw();}
  // 5.0.2: a y range from a zoom remembers the scale of before (an unzoom gives it back); a range the user set or locked has no «zoom»
  zoomed(pane,lo,hi){const o=pane.y||null,prev=o&&o.zoom?o.prev:o;return {auto:false,min:lo,max:hi,zoom:true,prev:prev?JSON.parse(JSON.stringify(prev)):null};}
  unzoomY(){let n=0;this.cfg.panes.forEach((p,i)=>{if(p.y&&p.y.zoom){if(p.y.prev)p.y=p.y.prev;else delete p.y;this.yst[i]=null;n++;}});return n;}
  // the time and the y of before every zoom: live again (at the window of before a zoom of the live view), the zoomed y back
  unzoom(){this.histPush();this.cfg.frozen=null;if(this.win0){this.cfg.window=this.win0;this.win0=null;}this.unzoomY();this.opt.onchange?.();this.requestDraw();}
  // a rectangle: the time range and/or the value range of the pane where it started (zoomAxes)
  boxZoom(b){const ax=this.cfg.zoomAxes==='y'?'y':this.cfg.zoomAxes==='xy'||this.cfg.box?'xy':'x';const pw=this.plotW();if(Math.abs(b.x1-b.x0)<5&&Math.abs(b.y1-b.y0)<5)return;this.histPush();
   if(ax!=='y'&&Math.abs(b.x1-b.x0)>=5){const [a,c]=this.viewRange(),tx=x=>a+(Math.min(Math.max(x-this.padL,0),pw)/pw)*(c-a),t0=tx(Math.min(b.x0,b.x1)),t1=tx(Math.max(b.x0,b.x1));
    if(t1-t0>(this.sim?.h||1e-12)*2){this.cfg.frozen=[t0,t1];this.opt.onfreeze?.();}}
   if(ax!=='x'&&Math.abs(b.y1-b.y0)>=5){const q=this.paneAt(b.y0);if(q){const L=q.L,v=y=>L.lo+(L.y1-y)/(L.y1-L.y0)*(L.hi-L.lo),lo=v(Math.max(b.y0,b.y1)),hi=v(Math.min(b.y0,b.y1));if(hi>lo)q.pane.y=this.zoomed(q.pane,lo,hi);}}
   this.opt.onchange?.();this.requestDraw();}
  nav(kind){const s=this.sim;if(!s)return;if(kind==='back'){this.back();return;}if(kind==='heights'){this.autoHeights();return;}if(kind==='box'){this.cfg.box=!this.cfg.box;if(this.cfg.box)this.cfg.selMode=false;this.opt.onchange?.();return;}
   if(kind==='sel'){this.cfg.selMode=!this.cfg.selMode;if(this.cfg.selMode)this.cfg.box=false;this.opt.onchange?.();this.requestDraw();return;}
   if(kind==='unzoom'){this.unzoom();return;}if(kind==='selzoom'){const q=this.cfg.sel;if(q){this.histPush();this.cfg.frozen=[q[0],q[1]];this.opt.onfreeze?.();this.opt.onchange?.();this.requestDraw();}return;}
   if(kind==='clearsel'){this.cfg.sel=null;this.opt.onsel?.();this.requestDraw();return;}
   if(kind!=='follow')this.histPush();const T=s.T,end=Math.max(s.t,1e-12);const [a,b]=this.viewRange(),span=b-a,live=!this.cfg.frozen;
   const clamp=(x0,x1)=>{const w=x1-x0;if(x1>=end-1e-12*end){if(w>=end){this.cfg.frozen=[0,end];return;}this.cfg.frozen=null;this.cfg.window={unit:'s',n:w};return;}if(x0<0){x0=0;x1=w;}this.cfg.frozen=[x0,x1];};
   if(kind==='follow'){this.cfg.follow=this.cfg.follow===false;if(this.cfg.follow)this.cfg.frozen=null;}
   else if(kind==='live'){this.cfg.frozen=null;}
   else if(kind==='start')this.cfg.frozen=[0,Math.min(span,end)];
   else if(kind==='left')clamp(a-span/2,b-span/2);
   else if(kind==='right')clamp(a+span/2,b+span/2);
   else if(kind==='focus'){const w=3*T;if(live){this.cfg.window={unit:'T',n:3};}else this.cfg.frozen=[Math.max(0,b-w),b];}
   else if(kind==='in'||kind==='out'){const f=kind==='in'?.5:2,w=Math.max(span*f,4*s.h);if(live){const W=this.cfg.window;this.cfg.window=W.unit==='T'?{unit:'T',n:Math.max(+(W.n*f).toPrecision(6),4*s.h/T)}:{unit:'s',n:w};}else{const c=(a+b)/2;clamp(c-w/2,c+w/2);}}
   else if(kind==='all')this.cfg.frozen=[0,end];
   else if(kind==='autoy'){for(const p of this.cfg.panes)p.y={auto:true,...(p.y?.mode?{mode:p.y.mode}:{})};this.yst=[];}
   this.opt.onchange?.();this.requestDraw();}
  // 4.17.2: the canvas is the visible part of the box (sticky in it), the spacer after it the rest of the panes' height
  resize(){const sc=this.sc,dpr=window.devicePixelRatio||1;if(!sc)return;this.W=Math.max(200,sc.clientWidth||0);this.Hv=Math.max(160,sc.clientHeight||0);
   const hs=this.heights();this.Htot=TOP+hs.reduce((a,b)=>a+b,0)+GAP*Math.max(0,hs.length-1)+BOT+(this.ax?0:AXH);
   if(this.spacer)this.spacer.style.height=Math.max(0,this.Htot-this.Hv)+'px';
   const H=this.Hv;this.cv.width=Math.round(this.W*dpr);this.cv.height=Math.round(H*dpr);this.cv.style.width=this.W+'px';this.cv.style.height=H+'px';this.ctx.setTransform(dpr,0,0,dpr,0,0);
   if(this.ax){this.ax.width=Math.round(this.W*dpr);this.ax.height=Math.round(AXH*dpr);this.ax.style.width=this.W+'px';this.ax.style.height=AXH+'px';this.axc.setTransform(dpr,0,0,dpr,0,0);}
   this.draw();}
  // ------------------------------------------------------------ channels
  static unitOf(key,sim){const pre=key.split(':')[0],id=key.split(':')[1];if(pre==='REF'||pre==='MEAS'){const k=sim?.net.ctrls.find(c=>c.id===id);const h=sim?.shById?.get(k?.sensor);return (h?h.qty:k?.qty)==='V'?'V':'A';}
   if(pre==='H'){const q=sim?.shById?.get(id);return q?.sig?'':q?.qty==='V'?'V':'A';}
   if(pre==='Y'){const b=sim?.net.compInfo.get(id)?.blk,pin=key.split(':')[2],t=b?.type;if(t==='DCM')return pin==='te'?'N·m':'rad/s';if(t==='IM')return pin==='te'?'N·m':pin==='psi'?'V·s':!pin||pin==='w'?'rad/s':'rad';if(t==='SM')return pin==='te'?'N·m':pin==='th'?'rad':pin==='id'||pin==='iq'?'A':'rad/s';if(t==='SRM')return pin==='te'?'N·m':pin==='th'?'rad':/^i\d$/.test(pin||'')?'A':'rad/s';if(t==='GEN3')return pin==='d'?'°':'pu';if(t==='FEST')return pin==='psi'?'V·s':pin==='w1'?'rad/s':'rad';if(t==='PLL')return pin==='w'?'rad/s':pin==='amp'?'':'rad';if(t==='INT'&&b.wrap)return 'rad';
    return t==='VM'||t==='VP'?'V':t==='AM'||t==='IP'?'A':t==='MEAS'?(b.qty==='V'?'V':'A'):'';}return UNIT[pre]??'';}
  resolve(key){const s=this.sim;if(!s)return -1;if(key.startsWith('VN:')){const pin=key.slice(3),n=s.net.pinNet.get(pin);if(!n)return -1;if(n.ground)return -2;return s.chIndex.get('N:'+n.canon)??-1;}return s.chIndex.get(key)??-1;}
  channels(){return this.cfg.panes.flatMap((p,pi)=>p.ch.map(c=>({...c,pane:pi})));}
  addChannel(key,label,pane=null){if(this.channels().some(c=>c.key===key))return false;const used=new Set(this.channels().map(c=>c.color));const color=COLORS.find(c=>!used.has(c))||COLORS[this.channels().length%COLORS.length];
   const unit=Scope.unitOf(key,this.sim);let pi=pane;if(pi===null){pi=this.cfg.panes.findIndex(p=>p.ch.length&&Scope.unitOf(p.ch[0].key,this.sim)===unit);if(pi<0){if(this.cfg.panes.length===1&&!this.cfg.panes[0].ch.length)pi=0;else if(this.cfg.panes.length<12){this.cfg.panes.push({ch:[]});pi=this.cfg.panes.length-1;}else pi=this.cfg.panes.length-1;}}
   while(this.cfg.panes.length<=pi)this.cfg.panes.push({ch:[]});this.cfg.panes[pi].ch.push({key,label,color,on:true});this.opt.onchange?.();this.requestDraw();return true;}
  removeChannel(key){for(const p of this.cfg.panes)p.ch=p.ch.filter(c=>c.key!==key);this.cfg.panes=this.cfg.panes.filter((p,i)=>p.ch.length||i===0);this.opt.onchange?.();this.requestDraw();}
  moveChannel(key,pane){let ch=null;for(const p of this.cfg.panes){const i=p.ch.findIndex(c=>c.key===key);if(i>=0)ch=p.ch.splice(i,1)[0];}if(!ch)return;while(this.cfg.panes.length<=pane)this.cfg.panes.push({ch:[]});this.cfg.panes[pane].ch.push(ch);this.cfg.panes=this.cfg.panes.filter((p,i)=>p.ch.length||i===0);this.opt.onchange?.();this.requestDraw();}
  // ------------------------------------------------------------ data access
  windowSec(){const w=this.cfg.window,T=this.sim?.T||1e-3;return w.unit==='T'?w.n*T:w.n;}
  viewRange(){const s=this.sim;if(!s)return [0,1];if(this.cfg.frozen)return this.cfg.frozen;const W=this.windowSec();let t1=s.t;
   if(this.cfg.trigger==='sync'){const T=s.T;t1=Math.max(T,Math.floor(s.t/T+1e-9)*T);}if(t1<W)return [0,Math.max(W,1e-12)];return [t1-W,t1];}
  ringIndex(t){const r=this.sim.ring;const start=(r.head-r.n+r.cap)%r.cap;let lo=0,hi=r.n;while(lo<hi){const m=(lo+hi)>>1;if(r.t[(start+m)%r.cap]<t)lo=m+1;else hi=m;}return lo;}
  ringStart(){const r=this.sim.ring;return r.n?r.t[(r.head-r.n+r.cap)%r.cap]:Infinity;}
  // iterate raw samples of channel ci within [t0,t1] (one sample margin)
  eachRaw(ci,t0,t1,fn){const r=this.sim.ring;const start=(r.head-r.n+r.cap)%r.cap;let i=Math.max(0,this.ringIndex(t0)-1);
   for(;i<r.n;i++){const j=(start+i)%r.cap,t=r.t[j];fn(t,ci===-2?0:r.d[j*r.nch+ci]);if(t>t1)break;}}
  // how many raw samples lie in [t0, t1] (two binary searches)
  rawCount(t0,t1){if(!this.sim?.ring?.n)return 0;return this.ringIndex(t1)-this.ringIndex(t0);}
  eachPeriod(ci,t0,t1,fn){const p=this.sim.per;const start=(p.head-p.n+p.cap)%p.cap;for(let i=0;i<p.n;i++){const j=(start+i)%p.cap,t=p.t[j];if(t<t0)continue;if(t>t1+this.sim.T)break;const o=j*p.nch+ci;fn(t,ci===-2?0:p.avg[o],ci===-2?0:p.min[o],ci===-2?0:p.max[o]);}}
  valueAt(ci,t){if(ci===-2)return 0;const r=this.sim.ring;if(!r.n)return NaN;const start=(r.head-r.n+r.cap)%r.cap;let i=this.ringIndex(t);i=Math.min(Math.max(i,0),r.n-1);
   const j=(start+i)%r.cap;if(i>0){const jp=(start+i-1)%r.cap,t0=r.t[jp],t1=r.t[j];if(t1>t0&&t<=t1){const a=(t-t0)/(t1-t0);return r.d[jp*r.nch+ci]*(1-a)+r.d[j*r.nch+ci]*a;}}return r.d[j*r.nch+ci];}
  // statistics over the visible window (time weighted)
  stats(key,range){const s=this.sim;if(!s)return null;const ci=this.resolve(key);if(ci===-1)return null;const [t0,t1]=range||this.viewRange();
   let S=0,Q=0,D=0,mn=Infinity,mx=-Infinity,pt=null,pv=0,tmn=NaN,tmx=NaN;
   if(this.usePeriods(t0)){let n=0;this.eachPeriod(ci,t0,t1,(t,a,lo,hi)=>{S+=a;n++;mn=Math.min(mn,lo);mx=Math.max(mx,hi);});if(!n)return null;return {avg:S/n,rms:NaN,min:mn,max:mx,pp:mx-mn,src:'period'};}
   // 4.17.2: what the ring no longer holds from the envelope (its buckets inside the view: mean, min, max; no RMS)
   const rs=this.ringStart();let Se=0,De=0;const E=this.env;
   if(t0<rs&&E&&E.w>0&&ci>=0&&E.sim===s){const w=E.w,nch=E.nch;for(let b=Math.max(0,Math.ceil(t0/w-1e-9));b<E.B&&(b+1)*w<=Math.min(t1,rs)+1e-12*w;b++){if(!E.has[b]||!(E.nn[b]>0))continue;
     Se+=E.sm[b*nch+ci]/E.nn[b]*w;De+=w;mn=Math.min(mn,E.mn[b*nch+ci]);mx=Math.max(mx,E.mx[b*nch+ci]);}}
   this.eachRaw(ci,Math.max(t0,rs<Infinity?rs:t0),t1,(t,v)=>{const tc=Math.min(Math.max(t,t0),t1);if(pt!==null&&tc>pt){const h=tc-pt;S+=h*(pv+v)/2;Q+=h*(pv*pv+pv*v+v*v)/3;D+=h;}if(t>=t0&&t<=t1){if(v<mn){mn=v;tmn=t;}if(v>mx){mx=v;tmx=t;}}pt=tc;pv=v;});
   if(D+De<=0)return null;if(De>0)return {avg:(Se+S)/(De+D),rms:NaN,min:mn,max:mx,pp:mx-mn,src:'env'};return {avg:S/D,rms:Math.sqrt(Math.max(0,Q/D)),min:mn,max:mx,pp:mx-mn,tmin:tmn,tmax:tmx,src:'raw'};}
  // 5.0.2: the region [t0, t1] from two x of the plot (Shift+drag or the tool «⇹ Περιοχή»); a click clears it
  selectAt(xa,xb){const [a,b]=this.viewRange(),pw=this.plotW(),tx=x=>a+(Math.min(Math.max(x-this.padL,0),pw)/pw)*(b-a);
   if(Math.abs(xb-xa)<4){this.cfg.sel=null;}else{const t0=tx(Math.min(xa,xb)),t1=tx(Math.max(xa,xb));this.cfg.sel=t1>t0?[t0,t1]:null;}this.opt.onsel?.();this.requestDraw();}
  // the statistics of every shown channel over the region: min and max with their times, mean, peak to peak, RMS
  selStats(){const q=this.cfg.sel,s=this.sim;if(!q||!s)return [];const out=[];
   for(const ch of this.channels()){if(!ch.on)continue;const st=this.stats(ch.key,q);out.push({key:ch.key,label:ch.label||ch.key,color:ch.color,unit:Scope.unitOf(ch.key,s),...(st||{})});}return out;}
  // the per-period mean and band: only when chosen («μέση ανά περίοδο»); 4.17.2: 'auto' keeps one look (samples, then the
  // envelope with its mean) instead of changing to it by itself
  usePeriods(t0){return this.cfg.display==='avg';}
  // ------------------------------------------------------------ interaction
  panTo(e){const d=this.drag;if(!d)return;const dx=e.offsetX-d.x;if(Math.abs(dx)>3){if(!d.moved)this.histPush();d.moved=true;}if(!d.moved)return;const [a,b]=d.view,span=b-a,pw=this.plotW();const sh=-dx/pw*span;this.cfg.frozen=[a+sh,b+sh];this.opt.onfreeze?.();this.requestDraw();}
  zoomAt(x,f){if(this.cfg.follow!==false&&!this.cfg.frozen){const W=this.cfg.window,T=this.sim?.T||1;if(!this.win0)this.win0={...W};const n=Math.max(+(W.n*f).toPrecision(6),(this.sim?.h||1e-9)*4/(W.unit==='T'?T:1));this.cfg.window={unit:W.unit,n};this.opt.onchange?.();this.requestDraw();return;}
   const [a,b]=this.viewRange(),pw=this.plotW();const tm=a+(Math.min(Math.max(x-this.padL,0),pw)/pw)*(b-a);const na=tm-(tm-a)*f,nb=tm+(b-tm)*f;if(nb-na<(this.sim?.h||1e-9)*4)return;this.cfg.frozen=[na,nb];this.opt.onfreeze?.();this.requestDraw();}
  cursorAt(e){if(!this.sim)return;const [a,b]=this.viewRange();const t=a+(e.offsetX-this.padL)/this.plotW()*(b-a);if(t<a||t>b)return;
   if(e.shiftKey&&this.cfg.cursors.length)this.cfg.cursors[1]=t;else this.cfg.cursors=e.shiftKey?[t]:(this.cfg.cursors.length===1?[this.cfg.cursors[0],t]:[t]);this.opt.onchange?.();this.requestDraw();}
  plotW(){return this.W-this.padL-this.padR;}
  drawSamples(ch,t0,t1,X,Y){const L=this.sim?.samples?.(ch.key.slice(2));if(!L||!L.t.length)return;const t=L.t;let lo=0,hi=t.length;while(lo<hi){const m=(lo+hi)>>1;if(t[m]<t0)lo=m+1;else hi=m;}
   let n=0;for(let i=lo;i<t.length&&t[i]<=t1;i++)n++;if(!n||n>this.plotW()/2.5)return;const c=this.ctx;c.save();c.fillStyle=ch.color;c.strokeStyle='#fff';c.lineWidth=1.2;
   for(let i=lo;i<t.length&&t[i]<=t1;i++){const v=L.v[i];if(!Number.isFinite(v))continue;c.beginPath();c.arc(X(t[i]),Y(v),3.4,0,7);c.fill();c.stroke();}c.restore();}
  // ------------------------------------------------------------ 4.11: what left the ring buffer
  // the envelope of the whole run: B buckets of width w from t = 0 (min, max and, from 4.17.2, the sum and the count of the
  // samples, so the mean) of every channel, fed with the ring's new samples; when the run passes B·w the buckets merge in
  // pairs and w doubles. 4.17.2: B from the memory of the scope (a quarter of the ring, 4096 … 65 536)
  envReset(){const s=this.sim,nch=s.ring.nch,rb=s.ring.cap*(4*nch+9);let B=ENV_B;while(B<ENV_MAX&&2*B*(16*nch+9)<=Math.max(4*1048576,rb/4))B*=2;
   // 4.20.2: a bucket gets its starting values (min +∞, max −∞, sum and count 0) when its first sample comes, not all of
   // them here: the same numbers in every bucket that holds samples (has), and the others are never read; the fill of
   // 30–60 MB took 6–13 ms at every opening of a large tutorial
   this.env={sim:s,nch,cap:s.ring.cap,B,w:0,mn:new Float32Array(B*nch),mx:new Float32Array(B*nch),sm:new Float64Array(B*nch),nn:new Float64Array(B),has:new Uint8Array(B),lastT:-Infinity,lost:0};return this.env;}
  ingest(){const s=this.sim;if(!s?.ring?.n)return;const r=s.ring;let E=this.env;if(!E||E.sim!==s||E.nch!==r.nch||E.cap!==r.cap||s.t<E.lastT)E=this.envReset();
   const start=(r.head-r.n+r.cap)%r.cap,nch=r.nch,B=E.B;if(r.n===r.cap&&Number.isFinite(E.lastT)&&r.t[start]>E.lastT)E.lost++;
   let i=Number.isFinite(E.lastT)?Math.max(0,this.ringIndex(E.lastT)-1):0;while(i<r.n&&r.t[(start+i)%r.cap]<=E.lastT)i++;
   for(;i<r.n;i++){const j=(start+i)%r.cap,t=r.t[j];if(!(t>=0))continue;if(!(E.w>0))E.w=Math.max(s.h||1e-9,1e-12)*4;let k=Math.floor(t/E.w);
    // two buckets into one: with both holding samples as before; with one, its values (the empty one had +∞, −∞, 0)
    while(k>=B){const M=E.mn,X=E.mx,S=E.sm,N=E.nn,H=E.has;for(let b=0;b<B/2;b++){const o=b*nch,o1=2*b*nch,o2=(2*b+1)*nch,h1=H[2*b],h2=H[2*b+1];
      if(h1&&h2){for(let q=0;q<nch;q++){M[o+q]=Math.min(M[o1+q],M[o2+q]);X[o+q]=Math.max(X[o1+q],X[o2+q]);S[o+q]=S[o1+q]+S[o2+q];}N[b]=N[2*b]+N[2*b+1];}
      else if(h1||h2){const oi=h1?o1:o2;if(oi!==o){M.copyWithin(o,oi,oi+nch);X.copyWithin(o,oi,oi+nch);S.copyWithin(o,oi,oi+nch);}N[b]=N[h1?2*b:2*b+1];}
      H[b]=h1|h2;}
     H.fill(0,B/2);E.w*=2;k=Math.floor(t/E.w);}
    const o=k*nch,ro=j*nch;if(!E.has[k]){E.mn.fill(Infinity,o,o+nch);E.mx.fill(-Infinity,o,o+nch);E.sm.fill(0,o,o+nch);E.nn[k]=0;}
    for(let q=0;q<nch;q++){const v=r.d[ro+q];if(v<E.mn[o+q])E.mn[o+q]=v;if(v>E.mx[o+q])E.mx[o+q]=v;E.sm[o+q]+=v;}E.nn[k]++;E.has[k]=1;E.lastT=t;}}
  // columns {fi, mn, mx, la, sm, nn, has} of W2 pixels over [t0, t1] for channel ci (sm/nn: the mean of the column): from
  // the envelope (or a file), then the ring's own samples over the part it still holds (from rs; Infinity: none of them)
  colsOf(ci,t0,t1,W2,f,src,rsAt){const fi=new Float64Array(W2),mn=new Float64Array(W2).fill(Infinity),mx=new Float64Array(W2).fill(-Infinity),la=new Float64Array(W2),sm=new Float64Array(W2),nn=new Float64Array(W2),has=new Uint8Array(W2),k=W2/(t1-t0);
   const put=(c,a,lo,hi,b,av,n)=>{if(c<0||c>=W2)return;if(!has[c]){has[c]=1;fi[c]=a;}if(lo<mn[c])mn[c]=lo;if(hi>mx[c])mx[c]=hi;la[c]=b;if(Number.isFinite(av)&&n>0){sm[c]+=av*n;nn[c]+=n;}};const rs=rsAt??this.ringStart();
   if(src&&src.file){const d=src.file;if(d.raw){const v=d.v;for(let i=0;i<d.t.length;i++){const t=d.t[i];if(t>=rs||v[i]==null)continue;const y=f(v[i]);put(Math.floor((t-t0)*k),y,y,y,y,y,1);}}
    else for(let c=0;c<W2;c++){if(!d.has[c]||d.mn[c]==null||(d.tf[c]>=rs))continue;const a=f(d.mn[c]),z=f(d.mx[c]);put(c,f(d.fi[c]),Math.min(a,z),Math.max(a,z),f(d.la[c]),d.av&&d.av[c]!=null?f(d.av[c]):NaN,1);}}
   // the envelope where the file has nothing (before the recording started, or without one)
   if(this.env&&ci>=0){const E=this.env,w=E.w,nch=E.nch,fileHas=has.slice();if(w>0)for(let b=Math.max(0,Math.floor(t0/w));b<E.B&&b*w<=t1;b++){if(!E.has[b])continue;const tb=(b+.5)*w;if(tb>=rs)continue;const a=f(E.mn[b*nch+ci]),z=f(E.mx[b*nch+ci]),lo=Math.min(a,z),hi=Math.max(a,z),n=E.nn[b],av=n>0?f(E.sm[b*nch+ci]/n):NaN;
     const c0=Math.floor((b*w-t0)*k),c1=Math.floor(((b+1)*w-t0)*k);for(let c=Math.max(0,c0);c<=Math.min(W2-1,c1);c++)if(!fileHas[c])put(c,lo,lo,hi,hi,av,n);}}
   if(ci!==-1&&rs<Infinity)this.eachRaw(ci,Math.max(t0,rs),t1,(t,v)=>{v=f(v);put(Math.floor((t-t0)*k),v,v,v,v,v,1);});
   return {fi,mn,mx,la,sm,nn,has};}
  // the samples of the view from the recording (opt.archive(t0, t1, keys, n) → Promise), asked once per view
  archiveFor(t0,t1,W2,keys){if(!this.opt.archive||!keys.length)return undefined;const key=[t0.toPrecision(12),t1.toPrecision(12),W2,keys.join('|')].join('/');const A=this.arch;
   if(A&&A.key===key)return A.data;if(this._archKey!==key){this._archKey=key;clearTimeout(this._archT);
    this._archT=setTimeout(()=>{this.arch={key,data:undefined};Promise.resolve(this.opt.archive(t0,t1,keys,W2)).then(d=>{if(this.arch?.key===key){this.arch.data=d||null;this.requestDraw();}},()=>{if(this.arch?.key===key){this.arch.data=null;this.requestDraw();}});},150);}
   return undefined;}
  // ------------------------------------------------------------ 4.17.2: the automatic y of a pane
  // [lo, hi] for the data [dlo, dhi] of the view: 'frame' as before 4.17.2 (the data + 8 % in every drawing); otherwise
  // steady (PlotCore.AutoRange): on the steps of the grid, open at once when a trace leaves the range, closed to the data
  // only after they have used less than Y_SHRINK of it for Y_HOLD ms while it runs; paused, a new view (zoom, move) fits
  // at once and the same view keeps its range (no jump when it stops)
  yAuto(pi,pane,dlo,dhi,chans,vk,now){const Yc=pane.y||{},fin=Number.isFinite(dlo)&&Number.isFinite(dhi);
   // 5.0.2 (⚙ of the pane): symmetric about 0, and a margin in % of the span of the data, before the range is chosen
   if(Yc.sym&&fin){const m=Math.max(Math.abs(dlo),Math.abs(dhi));dlo=-m;dhi=m;}
   if(Yc.pad>0&&fin){const p=(dhi-dlo)*Yc.pad/100||Math.max(Math.abs(dhi)*Yc.pad/100,1e-9);dlo-=p;dhi+=p;}
   if(Yc.mode==='frame'){if(!(Number.isFinite(dlo)&&Number.isFinite(dhi))){dlo=-1;dhi=1;}if(pane.zero){dlo=Math.min(dlo,0);dhi=Math.max(dhi,0);}
    if(Yc.pad!==undefined)return dhi>dlo?[dlo,dhi]:[dlo-1e-6,dhi+1e-6];
    const pad=(dhi-dlo)*.08||Math.max(Math.abs(dhi)*.05,1e-6);return [dlo-pad,dhi+pad];}
   // 5.0.2: «μόνο μεγαλώνει»: the range of everything seen in this run; it never closes while the run goes on (new
   // channels, a new run or a reset start it again), so the scale cannot flicker
   if(Yc.mode==='grow'){const s=this.sim,sig=chans.map(c=>c.key).join('|')+(pane.zero?'|0':'')+(Yc.sym?'|s':''),t=s?.t??0;let g=this.yst[pi];
    if(!g||!g.grow||g.sig!==sig||g.sim!==s||t<g.t-1e-15){g=this.yst[pi]={grow:true,sig,sim:s,t,lo:NaN,hi:NaN};}g.t=t;
    if(fin){let a=dlo,b=dhi;if(pane.zero){a=Math.min(a,0);b=Math.max(b,0);}if(!Number.isFinite(g.lo)||a<g.lo||b>g.hi){const nr=PC.niceRange(Number.isFinite(g.lo)?Math.min(a,g.lo):a,Number.isFinite(g.hi)?Math.max(b,g.hi):b,5);g.lo=nr[0];g.hi=nr[1];}}
    return Number.isFinite(g.lo)?[g.lo,g.hi]:[-1,1];}
   let a=this.yst[pi];if(!(a instanceof PC.AutoRange))a=this.yst[pi]=new PC.AutoRange({shrink:Y_SHRINK,hold:Y_HOLD});
   return a.update(dlo,dhi,{sig:chans.map(c=>c.key).join('|')+(pane.zero?'|0':''),view:vk,running:!!this.running,now,zero:!!pane.zero});}
  // ------------------------------------------------------------ drawing
  draw(){
   const c=this.ctx,W=this.W||600,H=this.Hv||300;if(!c)return;this.padL=64;this.padR=14;
   if(this._raf){cancelAnimationFrame(this._raf);this._raf=0;}const {ink,grid,bg}=this.colors();
   if(this.sc)this.sy=this.sc.scrollTop||0;const sy=this.sy,ac=this.axc;
   c.clearRect(0,0,W,H);c.fillStyle=bg;c.fillRect(0,0,W,H);if(ac){ac.clearRect(0,0,W,AXH);ac.fillStyle=bg;ac.fillRect(0,0,W,AXH);}
   const s=this.sim;const panes=this.cfg.panes,hs=this.heights();
   if(!s){this.layout=[];return;}
   const [t0,t1]=this.viewRange(),span=t1-t0,pw=this.plotW();const X=t=>this.padL+(t-t0)/span*pw;
   this.ingest();
   const E=this.env,rs=this.ringStart(),W2c=Math.max(1,Math.ceil(pw));
   // 4.11: the view reaches before the ring: the file (a recording) or the envelope, before the per-period band
   const lost=t0<rs-1e-12&&this.sim.ring.n>0&&this.cfg.display!=='avg';
   // 4.17.2: a view of very many samples from the envelope alone, when its buckets are no wider than a pixel column
   const envOnly=!lost&&this.cfg.display==='auto'&&!!E&&E.sim===s&&E.w>0&&E.w<=span/W2c&&this.rawCount(t0,t1)>4e5;
   const vkeys=lost&&(this.cfg.frozen||!this.running)?[...new Set(panes.flatMap(p=>p.ch.filter(c=>c.on).map(c=>c.key)))]:[];
   const arch=lost&&vkeys.length?this.archiveFor(t0,t1,W2c,vkeys):undefined;this.archState=lost?(arch?'file':arch===undefined&&this.opt.archive&&vkeys.length?'wait':'env'):envOnly?'all':null;
   const periods=this.usePeriods(t0),band=this.cfg.dense!=='solid';
   const AXF='10.5px ui-monospace,Menlo,Consolas,monospace',A=ac||c;A.font=AXF;
   const xt=PC.ticks(t0,t1,pw,(v,st)=>fmtT(v,st,t1),q=>A.measureText(q).width,18);this.xt={...xt,x:xt.vals.map(t=>this.padL+(t-t0)/span*pw),w:xt.labels.map(q=>A.measureText(q).width)};const xs=xt.step||niceStep(span,4),vk=t0.toPrecision(9)+'|'+t1.toPrecision(9),now=performance.now();
   this.layout=[];let yc=TOP;
   c.save();c.translate(0,-sy);
   panes.forEach((pane,pi)=>{
    const ph=hs[pi],y0=yc,y1=y0+ph;yc=y1+GAP;const chans=pane.ch.filter(ch=>ch.on);
    // gate pulses only: one lane per signal (0 at the bottom of the lane, 1 at 80 % of it)
    const lanes=chans.length>=2&&chans.every(ch=>isLogic(ch.key,s)),nL=chans.length,tfs=chans.map((ch,k)=>lanes?(v=>v*.8+(nL-1-k)*1.2):(v=>v));
    // 4.17.2: a pane out of the visible part of the box is not computed (its last range stays)
    if(y1<sy-2||y0>sy+H+2){const st=this.yst[pi],lo=st&&Number.isFinite(st.lo)?st.lo:-1,hi=st&&Number.isFinite(st.hi)?st.hi:1;this.layout.push({y0,y1,lo,hi,Y:v=>y1-(v-lo)/(hi-lo)*(y1-y0),chans,tfs,hidden:true});return;}
    // y range
    let lo=Infinity,hi=-Infinity;const data=[];
    chans.forEach((ch,k)=>{const ci=this.resolve(ch.key),f=tfs[k];if(ci===-1){data.push(null);return;}
     if(periods){const pts=[];this.eachPeriod(ci,t0,t1,(t,a,mn,mx)=>{pts.push([t,f(a),f(mn),f(mx)]);lo=Math.min(lo,f(mn));hi=Math.max(hi,f(mx));});data.push({ch,pts,kind:'per',f});}
     else if(lost||envOnly){const q=this.colsOf(ci,t0,t1,W2c,f,arch&&arch.cols?.[ch.key]?{file:{...arch,...arch.cols[ch.key]}}:null,envOnly?Infinity:undefined);
      for(let i=0;i<W2c;i++)if(q.has[i]){if(q.mn[i]<lo)lo=q.mn[i];if(q.mx[i]>hi)hi=q.mx[i];}data.push({ch,cols:q,kind:'col',f});}
     // 4.7: many more samples than pixels: first, min, max and last per pixel column in one pass, without an array of
     // every sample (a running SRM drew 10⁵ samples per frame); 4.17.2: and the sum, for the mean of the column
     else if(this.rawCount(t0,t1)>pw*2){const W2=W2c,fi=new Float64Array(W2),mn=new Float64Array(W2).fill(Infinity),mx=new Float64Array(W2).fill(-Infinity),la=new Float64Array(W2),sm=new Float64Array(W2),nn=new Float64Array(W2),has=new Uint8Array(W2),k=W2/span;
      this.eachRaw(ci,t0,t1,(t,v)=>{v=f(v);let c=Math.floor((t-t0)*k);if(c<0)c=0;else if(c>=W2)c=W2-1;if(!has[c]){has[c]=1;fi[c]=v;}if(v<mn[c])mn[c]=v;if(v>mx[c])mx[c]=v;la[c]=v;sm[c]+=v;nn[c]++;if(t>=t0&&t<=t1){if(v<lo)lo=v;if(v>hi)hi=v;}});
      data.push({ch,cols:{fi,mn,mx,la,sm,nn,has},kind:'col',f});}
     else{const arr=[];this.eachRaw(ci,t0,t1,(t,v)=>{v=f(v);arr.push(t,v);if(t>=t0&&t<=t1){if(v<lo)lo=v;if(v>hi)hi=v;}});data.push({ch,arr,kind:'raw',f});}});
    chans.forEach((ch,k)=>this.refRange(ch.key,t0,t1,(t,v)=>{v=tfs[k](v);if(t>=t0&&t<=t1){if(v<lo)lo=v;if(v>hi)hi=v;}}));
    if(lanes){lo=-.25;hi=(nL-1)*1.2+1.4;}
    else if(pane.y&&pane.y.auto===false&&Number.isFinite(pane.y.min)&&Number.isFinite(pane.y.max)&&pane.y.max>pane.y.min){lo=pane.y.min;hi=pane.y.max;}
    else [lo,hi]=this.yAuto(pi,pane,lo,hi,chans,vk,now);
    const Y=v=>y1-(v-lo)/(hi-lo)*(y1-y0);this.layout.push({y0,y1,lo,hi,Y,chans,tfs});
    // grid
    c.strokeStyle=grid;c.lineWidth=1;c.fillStyle=ink;c.font='10.5px ui-monospace,Menlo,Consolas,monospace';c.textAlign='right';c.textBaseline='middle';
    const unit=chans.length?Scope.unitOf(chans[0].key,s):'',yref=Math.max(Math.abs(lo),Math.abs(hi)),yt=lanes?null:PC.ticks(lo,hi,ph,(v,st)=>PC.fmtEng(v,st,unit,yref),()=>11,18);
    if(lanes)chans.forEach((ch,k)=>{for(const v of [0,1]){const y=Y(tfs[k](v));c.beginPath();c.moveTo(this.padL,y);c.lineTo(W-this.padR,y);c.stroke();c.fillStyle=v?ch.color:ink;c.fillText(v?'1':'0',this.padL-6,y);}c.fillStyle=ink;});
    else yt.vals.forEach((v,k)=>{const y=Math.round(Y(v))+.5;c.beginPath();c.moveTo(this.padL,y);c.lineTo(W-this.padR,y);c.stroke();c.fillText(yt.labels[k],this.padL-6,y);});
    // 4.17.3: grid lines on whole pixels (a line of 1 px between two pixels is a grey line of 2)
    for(const t of xt.vals){const x=Math.round(X(t))+.5;c.beginPath();c.moveTo(x,y0);c.lineTo(x,y1);c.stroke();}
    if(lo<0&&hi>0&&!lanes){c.strokeStyle='#b8c7c1';c.beginPath();c.moveTo(this.padL,Y(0));c.lineTo(W-this.padR,Y(0));c.stroke();}
    c.strokeStyle='#c9d6d1';c.strokeRect(this.padL+.5,y0+.5,pw-1,ph-1);
    // traces
    c.save();c.beginPath();c.rect(this.padL,y0,pw,ph);c.clip();
    for(const d of data){if(!d)continue;const col=d.ch.color;
     if(d.kind==='per'){c.fillStyle=col+'33';c.beginPath();d.pts.forEach(([t,,mn],i)=>{i?c.lineTo(X(t),Y(mn)):c.moveTo(X(t),Y(mn));});for(let i=d.pts.length-1;i>=0;i--){const [t,,,mx]=d.pts[i];c.lineTo(X(t),Y(mx));}c.closePath();c.fill();
      c.strokeStyle=col;c.lineWidth=1.6;c.beginPath();d.pts.forEach(([t,a],i)=>{i?c.lineTo(X(t),Y(a)):c.moveTo(X(t),Y(a));});c.stroke();continue;}
     if(d.kind==='col'){const q=d.cols,n=q.has.length;
      // 4.17.2: the min–max of every column as a shade and its mean as the line (the same look for the ring, the
      // envelope and a recording); a column without a mean (an older server) draws its stroke as before
      if(band&&!lanes){c.fillStyle=col+'38';PC.bandPath(c,q,this.padL,Y);c.fill();c.strokeStyle=col;c.lineWidth=1.5;c.lineJoin='round';PC.meanPath(c,q,this.padL,Y);c.stroke();}
      // per column a vertical stroke from the side the trace comes from to the other (2 points, not 4: half the segments
      // to rasterise, which in a canvas without a GPU was most of a frame), bevel joins
      else{c.strokeStyle=col;c.lineWidth=1.5;c.lineJoin='bevel';c.beginPath();let started=false;
       for(let i=0;i<n;i++){if(!q.has[i])continue;const x=this.padL+i+.5,up=q.fi[i]<=q.la[i],a=up?q.mn[i]:q.mx[i],b=up?q.mx[i]:q.mn[i];
        if(!started){c.moveTo(x,Y(a));started=true;}else c.lineTo(x,Y(a));c.lineTo(x,Y(b));}
       c.stroke();}}
     else{const arr=d.arr,n=arr.length/2;c.strokeStyle=col;c.lineWidth=1.5;c.lineJoin='round';c.beginPath();
     if(n<=pw*2){for(let i=0;i<n;i++){const x=X(arr[2*i]),y=Y(arr[2*i+1]);i?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();}
     else{let col0=-1,mn=0,mx=0,first=0,last=0,started=false;
      const flush=()=>{if(col0<0)return;const x=this.padL+col0+.5;if(!started){c.moveTo(x,Y(first));started=true;}else c.lineTo(x,Y(first));c.lineTo(x,Y(mn));c.lineTo(x,Y(mx));c.lineTo(x,Y(last));};
      for(let i=0;i<n;i++){const cx=Math.floor(X(arr[2*i])-this.padL),v=arr[2*i+1];if(cx!==col0){flush();col0=cx;mn=mx=first=last=v;}else{if(v<mn)mn=v;if(v>mx)mx=v;last=v;}}flush();c.stroke();}}
     // reference trace (server solver), dashed in the same colour
     if(this.refs?.data?.[d.ch.key]){const pts=[];this.refRange(d.ch.key,t0,t1,(t,v)=>pts.push(t,d.f(v)));const m=pts.length/2;c.save();c.setLineDash([6,4]);c.lineWidth=1.4;c.strokeStyle='#18353a';c.globalAlpha=.75;c.beginPath();
      if(m<=pw*2){for(let i=0;i<m;i++){const x=X(pts[2*i]),y=Y(pts[2*i+1]);i?c.lineTo(x,y):c.moveTo(x,y);}}
      else{let col0=-1,mn=0,mx=0,first=0,last=0,st=false;const fl=()=>{if(col0<0)return;const x=this.padL+col0+.5;if(!st){c.moveTo(x,Y(first));st=true;}else c.lineTo(x,Y(first));c.lineTo(x,Y(mn));c.lineTo(x,Y(mx));c.lineTo(x,Y(last));};
       for(let i=0;i<m;i++){const cx=Math.floor(X(pts[2*i])-this.padL),v=pts[2*i+1];if(cx!==col0){fl();col0=cx;mn=mx=first=last=v;}else{if(v<mn)mn=v;if(v>mx)mx=v;last=v;}}fl();}
      c.stroke();c.restore();}
     // Sample & Hold: a dot at every sampling instant (t_k, value at t_k)
     if(d.ch.key.startsWith('H:'))this.drawSamples(d.ch,t0,t1,X,Y);
     // average line of the last complete period (dashed) when enabled
     if(this.cfg.avgLine){const st=this.stats(d.ch.key);if(st){c.setLineDash([5,4]);c.lineWidth=1;c.beginPath();c.moveTo(this.padL,Y(d.f(st.avg)));c.lineTo(W-this.padR,Y(d.f(st.avg)));c.stroke();c.setLineDash([]);}}
    }
    // changes made while running (live parameters)
    const chg=(s.changes||[]).filter(q=>q.t>=t0&&q.t<=t1);if(chg.length){c.strokeStyle='#6b4fa0';c.globalAlpha=.7;c.setLineDash([2,3]);for(const q of chg){const x=X(q.t);c.beginPath();c.moveTo(x,y0);c.lineTo(x,y1);c.stroke();}c.setLineDash([]);c.globalAlpha=1;
     if(pi===0){c.fillStyle='#6b4fa0';c.font='600 10px Inter,system-ui,sans-serif';c.textAlign='left';c.textBaseline='bottom';for(const q of chg.slice(-12))c.fillText('◆ '+q.label.split(': ').pop(),X(q.t)+3,y1-3);}}
    // cursors
    for(const [i,tc] of this.cfg.cursors.entries()){if(tc<t0||tc>t1)continue;const x=X(tc);c.strokeStyle=i?'#b03a5b':'#2f5fa0';c.setLineDash([4,3]);c.beginPath();c.moveTo(x,y0);c.lineTo(x,y1);c.stroke();c.setLineDash([]);}
    // 5.0.2: the region of the min–max tool (and while it is dragged)
    {const q=this.cfg.sel,d=this.selDrag,rg=d?[Math.min(d.x0,d.x1),Math.max(d.x0,d.x1)]:q?[X(q[0]),X(q[1])]:null;
     if(rg&&rg[1]>rg[0]){const xa=Math.max(this.padL,rg[0]),xb=Math.min(this.padL+pw,rg[1]);if(xb>xa){c.fillStyle='#c47a1c1c';c.fillRect(xa,y0,xb-xa,y1-y0);c.strokeStyle='#c47a1c';c.lineWidth=1;c.beginPath();
      if(rg[0]>=this.padL){c.moveTo(Math.round(rg[0])+.5,y0);c.lineTo(Math.round(rg[0])+.5,y1);}if(rg[1]<=this.padL+pw){c.moveTo(Math.round(rg[1])-.5,y0);c.lineTo(Math.round(rg[1])-.5,y1);}c.stroke();}}}
    c.restore();
    // pane title
    c.textAlign='left';c.textBaseline='top';c.font='600 10.5px Inter,system-ui,sans-serif';let lx=this.padL+24;
    for(const ch of chans){c.fillStyle=ch.color;const t=ch.label;c.fillText(t,lx,y0+5);lx+=c.measureText(t).width+14;}
    // 4.17.2: ⛶ (the pane fills the box; again: back) and the handle under the pane (drag: its height)
    {const bx=W-this.padR-20,by=y0+3;c.fillStyle='#ffffffcc';c.fillRect(bx,by,16,16);c.strokeStyle=pane.max?'#147966':'#7b8e88';c.lineWidth=1.3;c.beginPath();
     if(pane.max){c.moveTo(bx+4,by+6);c.lineTo(bx+6,by+6);c.lineTo(bx+6,by+4);c.moveTo(bx+12,by+4);c.lineTo(bx+12,by+6);c.lineTo(bx+14,by+6);c.moveTo(bx+4,by+12);c.lineTo(bx+6,by+12);c.lineTo(bx+6,by+14);c.moveTo(bx+12,by+14);c.lineTo(bx+12,by+12);c.lineTo(bx+14,by+12);}
     else{c.moveTo(bx+3,by+7);c.lineTo(bx+3,by+3);c.lineTo(bx+7,by+3);c.moveTo(bx+9,by+3);c.lineTo(bx+13,by+3);c.lineTo(bx+13,by+7);c.moveTo(bx+3,by+9);c.lineTo(bx+3,by+13);c.lineTo(bx+7,by+13);c.moveTo(bx+9,by+13);c.lineTo(bx+13,by+13);c.lineTo(bx+13,by+9);}
     c.stroke();
     // 5.0.2: ⚙, the settings of the y scale of the pane (green when it is not the default)
     {const gx=this.padL+3,gy0=y0+3,Yp=pane.y||{},on=(Yp.auto===false&&!Yp.zoom)||Yp.mode==='grow'||Yp.mode==='frame'||!!Yp.sym||Yp.pad!==undefined;c.save();c.fillStyle='#ffffffcc';c.fillRect(gx,gy0,16,16);
      c.fillStyle=on?'#147966':'#7b8e88';c.font='13px system-ui,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('⚙',gx+8,gy0+8.5);c.restore();}
     const gy=y1+(pi<panes.length-1?GAP:BOT)/2,gx=this.padL+pw/2;c.strokeStyle='#9fb3ad';c.lineWidth=1;c.beginPath();for(const dy of [-2,0,2]){c.moveTo(gx-12,gy+dy+.5);c.lineTo(gx+12,gy+dy+.5);}c.stroke();}
   });
   if(this.boxSel){const b=this.boxSel,ax=this.cfg.zoomAxes==='y'?'y':this.cfg.zoomAxes==='xy'||this.cfg.box?'xy':'x';c.fillStyle='#14796622';c.strokeStyle='#147966';
    const x0=ax==='y'?this.padL:Math.min(b.x0,b.x1),x1=ax==='y'?W-this.padR:Math.max(b.x0,b.x1),yy0=ax==='x'?sy+TOP:Math.min(b.y0,b.y1),yy1=ax==='x'?sy+H-BOT:Math.max(b.y0,b.y1);c.fillRect(x0,yy0,x1-x0,yy1-yy0);c.strokeRect(x0+.5,yy0+.5,x1-x0,yy1-yy0);}
   // hover readout
   if(this.hoverX!==null&&this.hoverX>this.padL&&this.hoverX<W-this.padR){const t=t0+(this.hoverX-this.padL)/pw*span;c.strokeStyle='#7b8e8899';c.beginPath();c.moveTo(this.hoverX+.5,sy);c.lineTo(this.hoverX+.5,sy+H);c.stroke();
    const rows=[];for(const L of this.layout){if(L.hidden)continue;L.chans.forEach((ch,k)=>{const ci=this.resolve(ch.key);if(ci===-1)return;const v=periods||(this.archState&&t<this.ringStart())?NaN:this.valueAt(ci,t);rows.push([ch,v]);if(Number.isFinite(v)){c.fillStyle=ch.color;c.beginPath();c.arc(this.hoverX,L.Y(L.tfs[k](v)),3,0,7);c.fill();}});}
    this.opt.onhover?.({t,rows});}
   c.restore();
   if(this.refs){c.textBaseline='top';c.font='600 10.5px Inter,system-ui,sans-serif';c.textAlign='right';const lbl='- - -  '+this.refs.label,w=c.measureText(lbl).width;c.fillStyle='#ffffffd9';c.fillRect(W-this.padR-w-34,TOP+3,w+8,15);c.fillStyle='#18353a';c.fillText(lbl,W-this.padR-30,TOP+5);}
   // time axis: on its canvas under the box (4.17.2), otherwise at the bottom of the visible part
   const ay=ac?6:H-AXH+6;if(!ac){c.fillStyle=bg;c.fillRect(0,H-AXH,W,AXH);}
   A.fillStyle=ink;A.textAlign='center';A.textBaseline='top';A.font=AXF;
   xt.vals.forEach((t,k)=>{const x=X(t),w=A.measureText(xt.labels[k]).width;A.fillText(xt.labels[k],Math.min(Math.max(x,w/2+2),W-w/2-2),ay);});
   const mean=band?'μέση (γραμμή) και min–max (σκιά)':'min–max';
   const note=periods?'μέση τιμή ανά περίοδο · σκιά: min–max':this.archState==='file'?`από το αρχείο καταγραφής · ${mean}`:this.archState==='wait'?'φόρτωση από το αρχείο…':this.archState==='env'?`πριν από t = ${fmtT(rs,xs,t1)}: ${mean} ανά ${eng(E?.w||0,'s')}`:this.archState==='all'?`${mean} ανά ${eng(E?.w||0,'s')}`:'';
   // 4.17.2: what the traces are, in a line of its own under the axis (opt.status), not over its labels
   if(this.opt.status){if(this.opt.status.textContent!==note)this.opt.status.textContent=note;}
   else{A.textAlign='right';A.fillStyle='#7b8e88';A.font='10.5px Inter,system-ui,sans-serif';A.fillText(note,W-this.padR,ay);}
  }
 }
 Scope.COLORS=COLORS;Scope.isLogic=isLogic;root.Scope=Scope;
})(window);
