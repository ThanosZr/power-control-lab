// 4.12 (ROADMAP §45, decision 4.11-θ «επαναφόρτωση από το CSV»): a viewer of a recording on disk, of this run or of an
// earlier one. It reads only what it draws: the server's index of the file and, per pixel column, the first, minimum,
// maximum and last value (engine/recording.py read_range), so a file of gigabytes opens at once. Zoom on the time axis with
// a drag or the wheel (Shift: the y axis), back, all; channels on and off; the events of the recording as ticks;
// the visible range as CSV.
(function(root){'use strict';
 const api=(body)=>fetch('/api/record',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(r=>r.json()).then(j=>{if(j&&j.error)throw new Error(j.error);return j;});
 const COL=['#147966','#b5472c','#2f5fa0','#8a5a00','#6b3fa0','#1d7a99','#a03060','#4f6b2a'];
 const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const fmt=v=>!Number.isFinite(v)?'—':Math.abs(v)>=1e4||(Math.abs(v)<1e-2&&v!==0)?v.toExponential(3):(+v.toPrecision(4)).toString();
 function niceStep(r){const e=Math.floor(Math.log10(r/5)),b=10**e,m=r/5/b;return (m<1.5?1:m<3.5?2:m<7.5?5:10)*b;}
 // the list of recordings (the temporary folder and the chosen one) with «Open» and «Compress»
 async function list(el,onOpen){el.innerHTML='<small class="muted">Ανάγνωση…</small>';
  try{const r=await api({op:'list'}),items=[...(r.items||[]).map(x=>({...x,where:'προσωρινά'})),...(r.dir_items||[]).map(x=>({...x,where:r.dir}))].sort((a,b)=>b.mtime-a.mtime).slice(0,30);
   if(!items.length){el.innerHTML='<small class="muted">Δεν υπάρχουν καταγραφές.</small>';return;}
   el.innerHTML=`<table class="ev-table rv-list"><tr><th>καταγραφή</th><th>μέγεθος</th><th>ώρα</th><th></th></tr>${items.map(x=>`<tr><td title="${esc(x.where)}">${esc(x.name)}${x.events?' <small class="muted">+ γεγονότα</small>':''}</td><td>${fmt(x.bytes/1048576)} MB</td><td>${esc(new Date(x.mtime*1000).toLocaleString())}</td>
    <td><button data-rvopen="${esc(x.name)}">Άνοιγμα</button><button data-rvgz="${esc(x.name)}" title="Συμπίεση σε .gz δίπλα της· η CSV σβήνεται και δεν ανοίγει πια εδώ">.gz</button></td></tr>`).join('')}</table>`;
   el.querySelectorAll('[data-rvopen]').forEach(b=>b.onclick=()=>(onOpen||open)(b.dataset.rvopen));
   el.querySelectorAll('[data-rvgz]').forEach(b=>b.onclick=async()=>{b.disabled=true;try{const g=await api({op:'gzip',name:b.dataset.rvgz});b.closest('td').innerHTML=`<small class="muted">${esc(g.gz)}: ${fmt(g.bytes/1048576)} MB (από ${fmt(g.from/1048576)})</small>`;}catch(e){b.closest('td').innerHTML='<small class="bad">'+esc(e.message)+'</small>';}});}
  catch(e){el.innerHTML='<small class="bad">'+esc(e.message)+'</small>';}}
 async function open(name){const box=document.createElement('div');box.className='modal rv-modal';document.body.appendChild(box);
  const close=()=>{box.remove();document.removeEventListener('keydown',onKey);};const onKey=e=>{if(e.key==='Escape')close();};document.addEventListener('keydown',onKey);
  box.onclick=e=>{if(e.target===box)close();};
  box.innerHTML=`<div class="modal-box"><div class="modal-head"><h2>Καταγραφή · ${esc(name)}</h2><div><button data-rvback title="Το προηγούμενο ζουμ">↶</button><button data-rvall>Όλο</button><button data-rvcsv title="Το ορατό διάστημα σε CSV (ως 20 000 γραμμές)">⤓ CSV</button><button data-rvclose>✕</button></div></div>
   <div class="modal-body"><div class="rv-chans" data-rvch></div><canvas class="rv-cv" width="960" height="380"></canvas><div class="small muted" data-rvinfo></div></div></div>`;
  box.querySelector('[data-rvclose]').onclick=close;
  const cv=box.querySelector('canvas'),g=cv.getContext('2d'),info=box.querySelector('[data-rvinfo]');let I;
  try{I=await api({op:'info',name});}catch(e){info.innerHTML='<span class="bad">'+esc(e.message)+'</span>';return {close};}
  const cols=I.cols.slice(1),on=cols.map((_,k)=>k<6),hist=[];let x0=I.t0,x1=I.t1,yr=null,data=null,ev=[],seq=0;
  if(!(x1>x0)){info.textContent='Η καταγραφή είναι άδεια.';return {close};}
  try{ev=(await api({op:'events_read',name,n:5000})).rows||[];}catch(e){ev=[];}
  const chans=box.querySelector('[data-rvch]');
  const drawCh=()=>{chans.innerHTML=cols.map((c,k)=>`<label><input type="checkbox" data-k="${k}" ${on[k]?'checked':''}><i style="background:${COL[k%COL.length]}"></i>${esc(c)}</label>`).join('');
   chans.querySelectorAll('[data-k]').forEach(b=>b.onchange=()=>{on[+b.dataset.k]=b.checked;load();});};drawCh();
  const W=cv.width,H=cv.height,ML=64,MR=12,MT=12,MB=28;
  const X=t=>ML+(t-x0)/(x1-x0)*(W-ML-MR);
  function paint(){g.clearRect(0,0,W,H);g.font='11px sans-serif';g.fillStyle='#4a5a5e';g.strokeStyle='#e3e9ea';g.lineWidth=1;
   if(!data){g.fillText('Ανάγνωση…',ML+10,MT+20);return;}
   const ks=cols.map((c,k)=>k).filter(k=>on[k]&&data.cols[cols[k]]);let lo=Infinity,hi=-Infinity;
   for(const k of ks){const q=data.cols[cols[k]];const a=q.v||q.mn,b=q.v||q.mx;for(let i=0;i<a.length;i++){if(Number.isFinite(a[i]))lo=Math.min(lo,a[i]);if(Number.isFinite(b[i]))hi=Math.max(hi,b[i]);}}
   if(yr){[lo,hi]=yr;}if(!(hi>lo)){lo-=1;hi+=1;}const pad=yr?0:(hi-lo)*0.05;lo-=pad;hi+=pad;const Y=v=>MT+(hi-v)/(hi-lo)*(H-MT-MB);
   const sy=niceStep(hi-lo);for(let v=Math.ceil(lo/sy)*sy;v<=hi;v+=sy){const y=Y(v);g.beginPath();g.moveTo(ML,y);g.lineTo(W-MR,y);g.stroke();g.fillText(fmt(v),4,y+4);}
   const sx=niceStep(x1-x0);for(let v=Math.ceil(x0/sx)*sx;v<=x1;v+=sx){const x=X(v);g.beginPath();g.moveTo(x,MT);g.lineTo(x,H-MB);g.stroke();g.fillText(fmt(v)+' s',x-16,H-10);}
   g.strokeStyle='#c9862f';for(const e of ev){const t=+e[0];if(t>=x0&&t<=x1){const x=X(t);g.beginPath();g.moveTo(x,H-MB);g.lineTo(x,H-MB-6);g.stroke();}}
   for(const k of ks){const q=data.cols[cols[k]];g.strokeStyle=COL[k%COL.length];g.fillStyle=COL[k%COL.length]+'33';
    if(data.raw){g.beginPath();let pen=false;for(let i=0;i<data.t.length;i++){const v=q.v[i];if(!Number.isFinite(v)){pen=false;continue;}const x=X(data.t[i]),y=Y(v);pen?g.lineTo(x,y):g.moveTo(x,y);pen=true;}g.stroke();continue;}
    // per pixel column: the band min–max and the line through first and last
    const n=q.mn.length,dx=(W-ML-MR)/n;for(let i=0;i<n;i++){if(!Number.isFinite(q.mn[i]))continue;const x=ML+i*dx,y1=Y(q.mx[i]),y2=Y(q.mn[i]);g.fillRect(x,y1,Math.max(1,dx),Math.max(1,y2-y1));}
    g.beginPath();let pen=false;for(let i=0;i<n;i++){if(!Number.isFinite(q.fi[i])){pen=false;continue;}const x=ML+(i+0.5)*dx;pen?g.lineTo(x,Y(q.fi[i])):g.moveTo(x,Y(q.fi[i]));g.lineTo(x,Y(q.la[i]));pen=true;}g.stroke();}
   info.textContent=`${fmt(x0)} … ${fmt(x1)} s · ${data.rows} γραμμές στο διάστημα${data.raw?'':' (ανά στήλη pixel: πρώτη, min, max, τελευταία)'} · σύνολο ${I.rows} γραμμές, ${fmt(I.bytes/1048576)} MB${ev.length?' · '+ev.length+' γεγονότα (σημάδια κάτω)':''} · σύρσιμο: ζουμ χρόνου, Shift+σύρσιμο: ζουμ y, ροδέλα: ζουμ γύρω από τον δείκτη`;}
  async function load(){const my=++seq;data=null;paint();const ks=cols.filter((c,k)=>on[k]);if(!ks.length){data={cols:{},rows:0,raw:true,t:[]};paint();return;}
   try{const r=await api({op:'range',name,t0:x0,t1:x1,keys:ks,n:W-ML-MR});if(my!==seq)return;data=r;paint();}catch(e){info.innerHTML='<span class="bad">'+esc(e.message)+'</span>';}}
  let drag=null;const px=e=>{const b=cv.getBoundingClientRect();return [(e.clientX-b.left)*W/b.width,(e.clientY-b.top)*H/b.height];};
  cv.onmousedown=e=>{drag={p:px(e),y:e.shiftKey};};
  window.addEventListener('mouseup',function up(e){if(!box.isConnected){window.removeEventListener('mouseup',up);return;}if(!drag)return;const a=drag.p,b=px(e),d=drag;drag=null;
   if(!d.y&&Math.abs(b[0]-a[0])>4){hist.push([x0,x1,yr]);const t=u=>x0+(Math.min(Math.max(u,ML),W-MR)-ML)/(W-ML-MR)*(x1-x0);const ta=t(Math.min(a[0],b[0])),tb=t(Math.max(a[0],b[0]));x0=ta;x1=tb;load();}
   else if(d.y&&Math.abs(b[1]-a[1])>4&&data){hist.push([x0,x1,yr]);const ys=[a[1],b[1]].sort((p,q)=>p-q);const cur=yr||curRange();const v=y=>cur[1]-(y-MT)/(H-MT-MB)*(cur[1]-cur[0]);yr=[v(ys[1]),v(ys[0])];paint();}});
  const curRange=()=>{let lo=Infinity,hi=-Infinity;for(const [k,c] of cols.entries()){if(!on[k]||!data.cols[c])continue;const q=data.cols[c],a=q.v||q.mn,b=q.v||q.mx;for(let i=0;i<a.length;i++){if(Number.isFinite(a[i]))lo=Math.min(lo,a[i]);if(Number.isFinite(b[i]))hi=Math.max(hi,b[i]);}}const p=(hi-lo)*0.05;return [lo-p,hi+p];};
  cv.onwheel=e=>{e.preventDefault();const f=e.deltaY>0?1.25:0.8,[x]=px(e),tm=x0+(x-ML)/(W-ML-MR)*(x1-x0);hist.push([x0,x1,yr]);x0=Math.max(I.t0,tm-(tm-x0)*f);x1=Math.min(I.t1,tm+(x1-tm)*f);if(!(x1>x0)){[x0,x1]=hist.pop();}load();};
  cv.ondblclick=()=>{hist.push([x0,x1,yr]);x0=I.t0;x1=I.t1;yr=null;load();};
  box.querySelector('[data-rvall]').onclick=cv.ondblclick;
  box.querySelector('[data-rvback]').onclick=()=>{if(!hist.length)return;[x0,x1,yr]=hist.pop();load();};
  box.querySelector('[data-rvcsv]').onclick=async()=>{const ks=cols.filter((c,k)=>on[k]);try{const r=await api({op:'range',name,t0:x0,t1:x1,keys:ks,n:10000});
   const lines=[['t (s)',...ks].join(',')];if(r.raw)for(let i=0;i<r.t.length;i++)lines.push([r.t[i],...ks.map(c=>r.cols[c].v[i]??'')].join(','));
   else{lines[0]=['t (s)',...ks.flatMap(c=>[c+' min',c+' max'])].join(',');const n=r.cols[ks[0]].mn.length;for(let i=0;i<n;i++)lines.push([x0+(i+0.5)*(x1-x0)/n,...ks.flatMap(c=>[r.cols[c].mn[i]??'',r.cols[c].mx[i]??''])].join(','));}
   const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/csv'}));a.download=name.replace(/\.csv$/,'')+'_range.csv';document.body.appendChild(a);a.click();a.remove();}catch(e){info.innerHTML='<span class="bad">'+esc(e.message)+'</span>';}};
  load();return {close,box,state:()=>({x0,x1,yr,rows:data?.rows,raw:data?.raw,on:on.slice()})};}
 const api_={open,list};if(typeof module!=='undefined')module.exports=api_;root.RecView=api_;
})(typeof window!=='undefined'?window:globalThis);
