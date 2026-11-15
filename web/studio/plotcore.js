'use strict';
// 4.17.2 (ROADMAP §63, THEORY §8τ): the core shared by the graphs of the studio, so that they behave the same: the scope
// and the viewer of a recording first, the other graphs of the application on it next (§63, «Σειρά»).
//  * niceStep, niceRange: steps 1–2–5·10ⁿ and limits on them
//  * ticks: the values of an axis with labels that never overlap: the step grows (1 → 2 → 5 → 10) until the widest label
//    and a gap fit between two ticks; each label with the decimals its step needs, no more
//  * fmtTime, fmtEng: a time with its unit (ns … s), a value with an SI prefix chosen once for the axis
//  * AutoRange: the steady automatic range of a running graph: it opens at once when the data leave it, it closes to
//    the data only after they have used less than `shrink` of it for `hold` ms, with its limits on the grid steps
//  * bandPath / meanPath: dense data (more samples than pixels) as a min–max shade with the mean as its line
//  * lineChart (4.17.4): a line chart on a canvas at its CSS size (Bode with a log axis, a step response, a curve)
//  * Readout: a table of values in a box of its own (its height, its scroll bars), built again only when its rows or
//    columns change, otherwise only its numbers, at most every `ms` while something runs
// No DOM in the numerical parts: tests/js/plotcore_cases.js runs them in Node.
(function(root){
 const fmtNum=(v,d)=>root.Parts?.fmtNum?root.Parts.fmtNum(v,{minimumFractionDigits:d,maximumFractionDigits:d,useGrouping:false}):v.toFixed(d).replace('.',',');
 function niceStep(span,n){const raw=span/Math.max(1,n),p=Math.pow(10,Math.floor(Math.log10(raw))),m=raw/p;return (m<1.5?1:m<3.5?2:m<7.5?5:10)*p;}
 // the next step of the 1–2–5 sequence
 function nextStep(st){const e=Math.floor(Math.log10(st)+1e-9),p=Math.pow(10,e),m=Math.round(st/p);return (m<2?2:m<5?5:10)*p;}
 // [lo, hi] around the data with a small margin (which does not cross zero: a quantity that starts at 0 keeps 0 as its
 // lower limit), on multiples of a step of about n intervals
 function niceRange(a,b,n=5,pad=.04){let sp=b-a;if(!(sp>0)){const m=Math.max(Math.abs(a)*.05,1e-6);a-=m;b+=m;sp=b-a;}
  let lo=a-sp*pad,hi=b+sp*pad;if(a>=0&&lo<0)lo=0;if(b<=0&&hi>0)hi=0;const st=niceStep(hi-lo,n);
  return [Math.floor(lo/st+1e-9)*st,Math.ceil(hi/st-1e-9)*st];}
 // decimals that a step needs at a scale k (the value shown is v/k): the fewest that show every multiple of it exactly
 const decs=(st,k=1)=>{const x=Math.abs(st/k);if(!(x>0))return 0;let d=Math.max(0,Math.ceil(-Math.log10(x)-1e-9));while(d<12&&Math.abs(Math.round(x*10**d)-x*10**d)>1e-6*x*10**d)d++;return d;};
 // a time: unit from the largest of |t| and the step, decimals from the step
 function fmtTime(t,step,tmax){const m=Math.max(Math.abs(tmax??t),step);const [k,u]=m<1e-6?[1e9,'ns']:m<1e-3?[1e6,'μs']:m<1?[1e3,'ms']:[1,'s'];
  return fmtNum(t*k,decs(step*k))+' '+u;}
 const PRE={'-12':'p','-9':'n','-6':'μ','-3':'m','0':'','3':'k','6':'M','9':'G','12':'T'};
 // a value of an axis: one SI prefix for the whole axis (from ref, its largest |value|), decimals from the step
 // (a quantity without a unit between 0.001 and 10⁴ gets no prefix: «850 m» would read as metres)
 function fmtEng(v,step,unit,ref){const r=Math.max(Math.abs(ref||0),Math.abs(step),1e-300);let e=Math.floor(Math.log10(r)/3+1e-9)*3;e=Math.max(-12,Math.min(12,e));if(!unit&&r>=1e-3&&r<1e4)e=0;
  const k=Math.pow(10,e),x=Math.abs(v)<step*1e-6?0:v;return fmtNum(x/k,decs(step,k))+(unit||PRE[e]?' '+PRE[e]+(unit||''):'');}
 // ticks of [lo, hi] over px pixels: {step, vals, labels}. label(v, step) → text, size(text) → its extent along the axis
 // (the width for a horizontal axis, the height for a vertical one), gap: the free space between two labels
 function ticks(lo,hi,px,label,size,gap=14,start){const out={step:0,vals:[],labels:[]};if(!(hi>lo)||!(px>0))return out;
  let st=start>0?start:niceStep(hi-lo,Math.max(1,px/40));
  for(let it=0;it<40;it++){const vals=[];for(let v=Math.ceil(lo/st-1e-9)*st;v<=hi+st*1e-9&&vals.length<500;v+=st)vals.push(Math.abs(v)<st*1e-9?0:v);
   const labels=vals.map(v=>label(v,st)),w=labels.reduce((a,s)=>Math.max(a,size(s)),0),pxs=st/(hi-lo)*px;
   if(pxs>=w+gap||vals.length<=1){out.step=st;out.vals=vals;out.labels=labels;return out;}st=nextStep(st);}
  return out;}
 class AutoRange{
  constructor(o={}){this.shrink=o.shrink??.5;this.hold=o.hold??2000;this.room=o.room??.25;this.reset();}
  reset(){this.lo=NaN;this.hi=NaN;this.low=0;this.view=null;this.sig=null;this.ok=false;}
  // the range for the data [dlo, dhi] (NaN: none yet). sig: what is shown (channels…): a change fits at once. view: the
  // shown window when it is not running (a zoom or a move fits at once; the same view keeps its range)
  update(dlo,dhi,{sig='',view=null,running=false,now=0,zero=false,n=5}={}){let ok=Number.isFinite(dlo)&&Number.isFinite(dhi);if(!ok){dlo=-1;dhi=1;}
   if(zero){dlo=Math.min(dlo,0);dhi=Math.max(dhi,0);}const want=niceRange(dlo,dhi,n);
   const fit=()=>{this.lo=want[0];this.hi=want[1];this.low=0;this.ok=ok;return [this.lo,this.hi];};
   if(this.sig!==sig||!Number.isFinite(this.lo)){this.sig=sig;this.view=running?null:view;return fit();}
   if(ok&&!this.ok){this.view=running?null:view;return fit();}
   if(!running){if(this.view===null)this.view=view;else if(this.view!==view){this.view=view;return fit();}}else this.view=null;
   if(!ok)return [this.lo,this.hi];
   // opened with room (a quarter of the data's span on the side that left), so that a growing trace opens it a few
   // times and not at every step of the grid
   if(dlo<this.lo||dhi>this.hi){const sp=Math.max(dhi-dlo,(want[1]-want[0])*.5),g=niceRange(dlo<this.lo?dlo-sp*this.room:dlo,dhi>this.hi?dhi+sp*this.room:dhi,n);
    this.lo=Math.min(this.lo,g[0]);this.hi=Math.max(this.hi,g[1]);this.low=0;}
   else if(running&&(dhi-dlo)<this.shrink*(this.hi-this.lo)){if(!this.low)this.low=now||1e-9;else if(now-this.low>=this.hold)return fit();}
   else this.low=0;
   return [this.lo,this.hi];}
 }
 // the min–max shade of columns {mn, mx, has} (column i spans x0+i … x0+i+1) as one path on ctx; runs of columns with
 // data are separate polygons
 function bandPath(c,q,x0,Y){const n=q.has.length;c.beginPath();for(let i=0;i<n;){if(!q.has[i]){i++;continue;}let j=i;while(j<n&&q.has[j])j++;
   c.moveTo(x0+i,Y(q.mx[i]));for(let k=i;k<j;k++){c.lineTo(x0+k,Y(q.mx[k]));c.lineTo(x0+k+1,Y(q.mx[k]));}
   for(let k=j-1;k>=i;k--){c.lineTo(x0+k+1,Y(q.mn[k]));c.lineTo(x0+k,Y(q.mn[k]));}c.closePath();i=j;}}
 // the mean line of columns {sm, nn, has} (or the stroke first → last when a column has no mean)
 function meanPath(c,q,x0,Y){const n=q.has.length;c.beginPath();let st=false;
  for(let k=0;k<n;k++){if(!q.has[k])continue;const x=x0+k+.5;if(q.nn&&q.nn[k]>0){const y=Y(q.sm[k]/q.nn[k]);st?c.lineTo(x,y):c.moveTo(x,y);st=true;}
   else{const up=q.fi[k]<=q.la[k],a=Y(up?q.mn[k]:q.mx[k]),b=Y(up?q.mx[k]:q.mn[k]);st?c.lineTo(x,a):c.moveTo(x,a);c.lineTo(x,b);st=true;}}}
 const esc=s=>String(s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
 class Readout{
  constructor(el){this.el=el;this.sig='';this.t=-Infinity;this.n=0;}
  // cols: [{k, label}] (after the first column, the name); rows: [{key, label, color, cells: [text]}]; note: a line under
  // the table. Returns true when it wrote. force: now; otherwise at most every ms milliseconds
  set(cols,rows,note,{force=false,ms=500,now}={}){const t=now??(typeof performance!=='undefined'?performance.now():Date.now());if(!force&&t-this.t<ms)return false;this.t=t;
   const el=this.el;if(!el)return false;const sig=cols.map(c=>c.k).join('|')+'#'+rows.map(r=>r.key).join('|');
   if(sig!==this.sig||!el.querySelector('table')){this.sig=sig;
    el.innerHTML=`<table class="ro"><colgroup><col class="ro-name">${cols.map(()=>'<col>').join('')}</colgroup><thead><tr><th></th>${cols.map(()=>'<th></th>').join('')}</tr></thead><tbody>${rows.map(r=>`<tr data-ro="${esc(r.key)}"><td><i class="dot"></i><span></span></td>${cols.map(()=>'<td></td>').join('')}</tr>`).join('')}</tbody></table><p class="muted small ro-note"></p>`;}
   const put=(node,txt)=>{if(node&&node.textContent!==txt){node.textContent=txt;this.n++;}};
   const th=el.querySelectorAll('thead th');put(th[0],cols.name||'Σήμα');cols.forEach((c,i)=>put(th[i+1],c.label));
   const trs=el.querySelectorAll('tbody tr');rows.forEach((r,i)=>{const tds=trs[i]?.children;if(!tds)return;const dot=tds[0].firstChild;if(dot&&dot.style.background!==r.color)dot.style.background=r.color;
    put(tds[0].lastChild,r.label);r.cells.forEach((x,j)=>put(tds[j+1],x));});
   put(el.querySelector('.ro-note'),note||'');return true;}
 }
 // 4.17.4: a value without a prefix (dB, degrees, a ratio), the decimals of its step
 function fmtPlain(v,step,unit){const x=Math.abs(v)<step*1e-6?0:v;return fmtNum(x,decs(step))+(unit?' '+unit:'');}
 // a line chart on a canvas at its CSS size, on the same ticks and labels as the scope (Bode, a step response, a curve):
 // o = {series: [{x, y, color, width, dash}], xlog, x: [x0, x1], y: [y0, y1], xUnit, yUnit, xPlain, yPlain, title,
 //      marks: [{x, color, label}] (vertical), hl: [{y, color, label}] (horizontal), pts: [{x, y, color, label}]}
 // → {X, Y, x0, x1, y0, y1} for what the caller draws on top
 function lineChart(cv,o){const dpr=root.devicePixelRatio||1,W=Math.max(160,Math.round(cv.clientWidth||cv.width||320)),H=Math.max(100,Math.round(cv.clientHeight||cv.height||180));
  if(cv.width!==Math.round(W*dpr)||cv.height!==Math.round(H*dpr)){cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);}
  const g=cv.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,W,H);
  const css=root.getComputedStyle?getComputedStyle(cv):null,ink=(css&&css.getPropertyValue('--scope-ink').trim())||'#2b3436',grid=(css&&css.getPropertyValue('--scope-grid').trim())||'#e8ecea',bg=(css&&css.getPropertyValue('--scope-bg').trim())||'#fff';
  g.fillStyle=bg;g.fillRect(0,0,W,H);
  const ML=o.ml??60,MR=12,MT=o.title?20:8,MB=26,pw=W-ML-MR,ph=H-MT-MB;
  let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity;
  for(const s of o.series||[])for(let i=0;i<s.x.length;i++){const x=s.x[i],y=s.y[i];if(!Number.isFinite(x)||!Number.isFinite(y)||(o.xlog&&!(x>0)))continue;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
  if(o.x){[x0,x1]=o.x;}if(!(x1>x0)){x0=o.xlog?1:0;x1=o.xlog?10:1;}
  if(o.y){[y0,y1]=o.y;}else{if(!Number.isFinite(y0)){y0=-1;y1=1;}[y0,y1]=niceRange(y0,y1);}
  const fx=o.xlog?(x=>Math.log10(x)):(x=>x),X=x=>ML+(fx(x)-fx(x0))/(fx(x1)-fx(x0))*pw,Y=y=>MT+(y1-y)/(y1-y0)*ph,px=v=>Math.round(v)+.5;
  g.font='10.5px ui-monospace,Menlo,Consolas,monospace';g.lineWidth=1;
  // the y axis
  const yref=Math.max(Math.abs(y0),Math.abs(y1)),yt=ticks(y0,y1,ph,(v,st)=>o.yPlain?fmtPlain(v,st,o.yUnit):fmtEng(v,st,o.yUnit,yref),()=>11,16);
  g.textAlign='right';g.textBaseline='middle';
  yt.vals.forEach((v,i)=>{const y=px(Y(v));g.strokeStyle=grid;g.beginPath();g.moveTo(ML,y);g.lineTo(W-MR,y);g.stroke();g.fillStyle=ink;g.fillText(yt.labels[i],ML-6,y);});
  // the x axis: decades (and 2…9 lighter) on a log axis, otherwise the ticks of the core
  g.textAlign='center';g.textBaseline='top';
  if(o.xlog){const k0=Math.ceil(Math.log10(x0)-1e-9),k1=Math.floor(Math.log10(x1)+1e-9);
   for(let k=Math.floor(Math.log10(x0));k<=k1;k++)for(let m=2;m<=9;m++){const v=m*Math.pow(10,k);if(v<x0||v>x1)continue;const x=px(X(v));g.strokeStyle=grid;g.globalAlpha=.55;g.beginPath();g.moveTo(x,MT);g.lineTo(x,MT+ph);g.stroke();g.globalAlpha=1;}
   let last=-Infinity;for(let k=k0;k<=k1;k++){const v=Math.pow(10,k),x=px(X(v));g.strokeStyle=grid;g.beginPath();g.moveTo(x,MT);g.lineTo(x,MT+ph);g.stroke();
    const lb=o.xPlain?fmtPlain(v,v,o.xUnit):fmtEng(v,v,o.xUnit,v),w=g.measureText(lb).width;if(x-w/2>last+8){g.fillStyle=ink;g.fillText(lb,Math.min(Math.max(x,ML+w/2),W-MR-w/2),MT+ph+6);last=x+w/2;}}}
  else{const xref=Math.max(Math.abs(x0),Math.abs(x1)),xt=ticks(x0,x1,pw,(v,st)=>o.xfmt?o.xfmt(v,st,x1):o.xPlain?fmtPlain(v,st,o.xUnit):fmtEng(v,st,o.xUnit,xref),q=>g.measureText(q).width,18);
   xt.vals.forEach((v,i)=>{const x=px(X(v)),w=g.measureText(xt.labels[i]).width;g.strokeStyle=grid;g.beginPath();g.moveTo(x,MT);g.lineTo(x,MT+ph);g.stroke();g.fillStyle=ink;g.fillText(xt.labels[i],Math.min(Math.max(x,ML+w/2),W-MR-w/2),MT+ph+6);});}
  g.strokeStyle='#c9d1ce';g.strokeRect(ML+.5,MT+.5,pw-1,ph-1);
  if(o.title){g.textAlign='left';g.textBaseline='top';g.fillStyle=ink;g.font='600 11px Inter,system-ui,sans-serif';g.fillText(o.title,ML,3);g.font='10.5px ui-monospace,Menlo,Consolas,monospace';}
  g.save();g.beginPath();g.rect(ML,MT,pw,ph);g.clip();
  for(const h of o.hl||[]){g.strokeStyle=h.color||ink;g.setLineDash([5,4]);g.beginPath();g.moveTo(ML,px(Y(h.y)));g.lineTo(W-MR,px(Y(h.y)));g.stroke();g.setLineDash([]);}
  for(const m of o.marks||[]){if(!(m.x>=x0&&m.x<=x1))continue;g.strokeStyle=m.color||ink;g.setLineDash([4,3]);g.beginPath();g.moveTo(px(X(m.x)),MT);g.lineTo(px(X(m.x)),MT+ph);g.stroke();g.setLineDash([]);}
  for(const s of o.series||[]){g.strokeStyle=s.color||ink;g.lineWidth=s.width||1.5;g.lineJoin='round';g.setLineDash(s.dash||[]);g.beginPath();let pen=false;
   for(let i=0;i<s.x.length;i++){const x=s.x[i],y=s.y[i];if(!Number.isFinite(x)||!Number.isFinite(y)||(o.xlog&&!(x>0))){pen=false;continue;}const a=X(x),b=Y(y);pen?g.lineTo(a,b):g.moveTo(a,b);pen=true;}g.stroke();g.setLineDash([]);}
  for(const q of o.pts||[]){g.fillStyle=q.color||ink;g.beginPath();g.arc(X(q.x),Y(q.y),3.2,0,7);g.fill();}
  g.restore();g.lineWidth=1;
  g.textBaseline='top';g.font='600 10px Inter,system-ui,sans-serif';
  for(const m of o.marks||[])if(m.label&&m.x>=x0&&m.x<=x1){g.fillStyle=m.color||ink;g.textAlign='left';g.fillText(m.label,Math.min(X(m.x)+4,W-MR-g.measureText(m.label).width-2),MT+3);}
  for(const h of o.hl||[])if(h.label){g.fillStyle=h.color||ink;g.textAlign='right';g.fillText(h.label,W-MR-4,Y(h.y)+3);}
  for(const q of o.pts||[])if(q.label){g.fillStyle=q.color||ink;g.textAlign='left';g.fillText(q.label,X(q.x)+5,Y(q.y)-13);}
  return {X,Y,x0,x1,y0,y1,ML,MT,pw,ph};}
 const api={niceStep,nextStep,niceRange,ticks,fmtTime,fmtEng,fmtPlain,AutoRange,bandPath,meanPath,Readout,lineChart};
 root.PlotCore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
