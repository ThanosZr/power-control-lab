// 5.0 (ROADMAP §91 and §45 step 1, THEORY §8ΩΕ, decision 344): the viewer, a page of its own beside the studio. It opens a
// study folder (its runs), a run, the plot file of the EMTP (<name>m.m with the .mda), the output of PSCAD (<name>.inf
// with its .out files) or a CSV, through the server (engine/studyfolder.py, /api/study), and reads only what it draws: per
// pixel column the first, minimum, maximum, mean and last value, or the samples themselves when they are few. The
// signals of every source in a tree by part, with a search; several panes on one time axis; signals of different
// sources over each other; the difference A − B of two signals at the full resolution of the files. «↻ Ανανέωση»
// reads the files again, and «ακολούθηση» does it every second while a run is written: not the live scope of the
// studio, the files of the run as they grow.
(function(root){'use strict';
 const $=s=>document.querySelector(s);
 const api=(op,b)=>fetch('/api/study',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({op,...b})}).then(r=>r.json()).then(j=>{if(j&&j.error)throw new Error(j.error);return j;});
 const COL=['#147966','#b5472c','#2f5fa0','#8a5a00','#6b3fa0','#1d7a99','#a03060','#4f6b2a','#c05a00','#3b6e8f'];
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
 const fmt=v=>!Number.isFinite(v)?'—':Math.abs(v)>=1e4||(Math.abs(v)<1e-2&&v!==0)?v.toExponential(4):(+v.toPrecision(5)).toString();
 const PC=()=>root.PlotCore;
 const V={sources:[],act:-1,panes:[],ap:0,x0:0,x1:1,hist:[],sel:[],timer:0,seq:0,nextCol:0};
 const status=(h,bad)=>{const s=$('#vw-status');s.innerHTML=h;s.classList.toggle('bad',!!bad);};
 // ---------------------------------------------------------------- sources
 async function openSource(path){path=String(path||'').trim();if(!path)return;
  try{const info=await api('info',{source:path});let src=V.sources.find(s=>s.info.path===info.path);
   if(!src){src={path:info.path,info,runs:null,study:null};V.sources.push(src);}else src.info=info;
   // a study folder: its runs (the source is its last run, the others one click away)
   try{const r=await api('runs',{study:path});src.study=r.path;src.runs=r.runs;}catch(e){if(info.kind==='run'){try{const st=info.path.replace(/[\\/]runs[\\/][^\\/]+$/,'');const r=await api('runs',{study:st});src.study=r.path;src.runs=r.runs;}catch(_){}}}
   V.act=V.sources.indexOf(src);if(V.sources.length===1||!(V.x1>V.x0)||V.panes.every(p=>!p.traces.length))allRange();
   renderSources();renderTree();if(!pane().traces.length)info.channels.slice(0,3).forEach(c=>addTrace(src,c,false));loadAll();
   status(`${esc(kindName(info.kind))} · ${esc(info.path)} · ${info.channels.length} σήματα, ${info.rows} γραμμές${info.status?' · '+esc(stName(info.status)):''}`);}
  catch(e){status('⚠ '+esc(e.message),true);}}
 const kindName=k=>({run:'τρέξιμο φακέλου μελέτης',emtp:'αρχείο του EMTP',pscad:'έξοδος του PSCAD',csv:'CSV'}[k]||k);
 const stName=s=>({running:'γράφεται',done:'τελείωσε',stopped:'σταμάτησε',error:'σφάλμα'}[s]||s);
 function renderSources(){const box=$('#vw-sources');
  box.innerHTML=V.sources.map((s,i)=>{const I=s.info;return `<div class="vw-s ${i===V.act?'act':''}" data-si="${i}"><div class="h"><b title="${esc(I.path)}">${esc(I.kind==='run'?`τρέξιμο ${I.n} · ${I.title||''}`:I.title||I.path)}</b><small class="st-${esc(I.status)}">${esc(stName(I.status))}</small><button data-sx="${i}" title="Κλείσιμο">✕</button></div>
   <small>${esc(kindName(I.kind))} · ${I.channels.length} σήματα · ${I.rows} γραμμές${Number.isFinite(I.t1)?' · ως '+esc(PC().fmtTime(I.t1,I.t1/1000||1e-9,I.t1)):''}</small>
   ${s.runs&&s.runs.length>1?`<div class="vw-runs">${s.runs.slice(-8).reverse().map(r=>`<div data-run="${esc(s.study+'/'+r.run)}" title="${esc(r.started||'')}"><span>${esc(r.n)}</span><span>${esc(r.title||'')}</span><span class="st-${esc(r.status)}">${esc(stName(r.status))}</span><small>${r.channels} × ${r.rows}</small></div>`).join('')}</div>`:''}</div>`;}).join('');
  box.querySelectorAll('[data-si]').forEach(d=>d.onclick=e=>{if(e.target.closest('[data-sx],[data-run]'))return;V.act=+d.dataset.si;renderSources();renderTree();});
  box.querySelectorAll('[data-sx]').forEach(b=>b.onclick=()=>{const s=V.sources[+b.dataset.sx];V.sources.splice(+b.dataset.sx,1);for(const p of V.panes)p.traces=p.traces.filter(t=>t.src!==s&&t.a?.src!==s&&t.b?.src!==s);V.act=Math.min(V.act,V.sources.length-1);renderSources();renderTree();loadAll();});
  box.querySelectorAll('[data-run]').forEach(d=>d.onclick=()=>openSource(d.dataset.run));}
 // ---------------------------------------------------------------- the tree of signals of the active source
 function renderTree(){const box=$('#vw-tree'),src=V.sources[V.act];if(!src){box.innerHTML='';return;}
  const q=norm($('#vw-search').value).split(/\s+/).filter(Boolean),on=new Set(pane().traces.filter(t=>t.src===src).map(t=>t.key));
  const groups=new Map();for(const c of src.info.channels){const hay=norm([c.name,c.key,c.label,c.kind,c.type,c.unit].join(' '));if(q.length&&!q.every(w=>hay.includes(w)))continue;
   const g=c.comp?`${c.label||c.comp}${c.type?' · '+c.type:''}`:(c.kind||'—');if(!groups.has(g))groups.set(g,[]);groups.get(g).push(c);}
  const open=q.length||groups.size<=6;
  box.innerHTML=[...groups].map(([g,cs])=>`<details ${open?'open':''}><summary>${esc(g)} <small>(${cs.length})</small></summary>${cs.map(c=>{const t=pane().traces.find(t=>t.src===src&&t.key===c.key);const sel=V.sel.some(s=>s.src===src&&s.key===c.key);
   return `<div class="vw-ch ${on.has(c.key)?'on':''} ${sel?'sel':''}" data-k="${esc(c.key)}" title="${esc(c.key)} · Ctrl+κλικ: επιλογή για A − B"><i style="background:${t?t.color:'transparent'};border:1px solid ${t?t.color:'#ccc'}"></i><span>${esc(c.name)}</span><span class="u">${esc(c.kind||'')}${c.unit?' ['+esc(c.unit)+']':''}</span></div>`;}).join('')}</details>`).join('')||'<small>Κανένα σήμα δεν ταιριάζει.</small>';
  box.querySelectorAll('[data-k]').forEach(d=>d.onclick=e=>{const c=src.info.channels.find(c=>c.key===d.dataset.k);if(!c)return;
   if(e.ctrlKey||e.metaKey){const i=V.sel.findIndex(s=>s.src===src&&s.key===c.key);if(i>=0)V.sel.splice(i,1);else{V.sel.push({src,key:c.key,c});if(V.sel.length>2)V.sel.shift();}renderTree();return;}
   const p=pane(),i=p.traces.findIndex(t=>t.src===src&&t.key===c.key);if(i>=0)p.traces.splice(i,1);else addTrace(src,c,false);renderTree();load(p);});}
 function addTrace(src,c,redraw=true){const p=pane();p.traces.push({src,key:c.key,label:(V.sources.length>1?srcTag(src)+' ':'')+c.name,unit:c.unit,color:COL[V.nextCol++%COL.length]});if(redraw)load(p);}
 const srcTag=s=>s.info.kind==='run'?`#${s.info.n}`:`[${s.info.title}]`;
 // ---------------------------------------------------------------- panes
 function pane(){if(!V.panes.length)addPane();return V.panes[Math.min(V.ap,V.panes.length-1)];}
 function addPane(){const el=document.createElement('div');el.className='vw-pane';el.innerHTML='<div class="ph"></div><canvas></canvas>';$('#vw-plots').appendChild(el);
  const p={el,cv:el.querySelector('canvas'),traces:[],data:new Map(),yr:null,W:0,H:0,seq:0};V.panes.push(p);V.ap=V.panes.length-1;
  el.addEventListener('mousedown',()=>{V.ap=V.panes.indexOf(p);V.panes.forEach(q=>q.el.classList.toggle('act',q===p));renderTree();},true);
  V.panes.forEach(q=>q.el.classList.toggle('act',q===p));bindPane(p);return p;}
 const ML=70,MR=14,MT=10,MB=26;
 function fit(p){const dpr=root.devicePixelRatio||1,w=Math.max(320,p.cv.clientWidth||900),h=Math.max(150,p.cv.clientHeight||260);if(w===p.W&&h===p.H&&p.cv.width)return false;
  p.W=w;p.H=h;p.cv.width=Math.round(w*dpr);p.cv.height=Math.round(h*dpr);p.cv.getContext('2d').setTransform(dpr,0,0,dpr,0,0);return true;}
 const X=(p,t)=>ML+(t-V.x0)/(V.x1-V.x0)*(p.W-ML-MR);
 async function load(p){const my=++p.seq;fit(p);header(p);const n=Math.max(50,Math.round(p.W-ML-MR)),bySrc=new Map();
  for(const t of p.traces){if(t.a)continue;if(!bySrc.has(t.src))bySrc.set(t.src,[]);bySrc.get(t.src).push(t.key);}
  const jobs=[...bySrc].map(([s,keys])=>api('range',{source:s.path,t0:V.x0,t1:V.x1,keys,n}).then(r=>{for(const k of keys)p.data.set(s.path+'|'+k,{r,k});}));
  for(const t of p.traces)if(t.a)jobs.push(api('diff',{a:{source:t.a.src.path,key:t.a.key},b:{source:t.b.src.path,key:t.b.key},t0:V.x0,t1:V.x1,n}).then(r=>{p.data.set(t.id,{r,k:'d'});t.stats=r.stats;}));
  try{await Promise.all(jobs);}catch(e){status('⚠ '+esc(e.message),true);}if(p.seq!==my)return;paint(p);header(p);}
 const loadAll=()=>V.panes.forEach(load);
 function header(p){const h=p.el.querySelector('.ph');
  h.innerHTML=p.traces.map((t,i)=>`<span class="tr" data-i="${i}" title="κλικ: αφαίρεση"><i style="background:${t.color}"></i>${esc(t.label)}${t.unit?' ['+esc(t.unit)+']':''}${t.stats&&t.stats.max!=null?` <small>(μέγιστη |A − B| = ${fmt(t.stats.max)}, ${t.stats.ref>0?(100*t.stats.max/t.stats.ref).toPrecision(3).replace('.',','):'—'} % του μεγίστου του A)</small>`:''}</span>`).join('')+
   (V.panes.length>1?'<button class="x" title="Κλείσιμο παραθύρου">✕</button>':'');
  h.querySelectorAll('[data-i]').forEach(s=>s.onclick=()=>{p.traces.splice(+s.dataset.i,1);renderTree();load(p);});
  const x=h.querySelector('.x');if(x)x.onclick=()=>{p.el.remove();V.panes.splice(V.panes.indexOf(p),1);V.ap=0;renderTree();};}
 function seriesOf(p,t){const d=p.data.get(t.a?t.id:t.src.path+'|'+t.key);return d?{r:d.r,q:d.r.cols[d.k]}:null;}
 function paint(p){fit(p);const g=p.cv.getContext('2d'),W=p.W,H=p.H;g.clearRect(0,0,W,H);g.font='11px ui-monospace,Menlo,Consolas,monospace';g.fillStyle='#4a5a5e';g.strokeStyle='#e3e9ea';g.lineWidth=1;
  let lo=Infinity,hi=-Infinity;const S=p.traces.map(t=>({t,s:seriesOf(p,t)})).filter(x=>x.s&&x.s.q);
  for(const {s} of S){const q=s.q,a=q.v||q.mn,b=q.v||q.mx;for(let i=0;i<a.length;i++){if(Number.isFinite(a[i]))lo=Math.min(lo,a[i]);if(Number.isFinite(b[i]))hi=Math.max(hi,b[i]);}}
  if(p.yr)[lo,hi]=p.yr;else{if(!Number.isFinite(lo)){lo=-1;hi=1;}[lo,hi]=PC().niceRange(lo,hi);}if(!(hi>lo)){lo-=1;hi+=1;}p.lo=lo;p.hi=hi;const Y=v=>MT+(hi-v)/(hi-lo)*(H-MT-MB);
  const units=[...new Set(p.traces.map(t=>t.unit).filter(Boolean))],yref=Math.max(Math.abs(lo),Math.abs(hi));
  const yt=PC().ticks(lo,hi,H-MT-MB,(v,st)=>PC().fmtEng(v,st,units.length===1?units[0]:'',yref),()=>11,18);
  g.textAlign='right';g.textBaseline='middle';yt.vals.forEach((v,i)=>{const y=Y(v);g.beginPath();g.moveTo(ML,y);g.lineTo(W-MR,y);g.stroke();g.fillText(yt.labels[i],ML-6,y);});
  const xt=PC().ticks(V.x0,V.x1,W-ML-MR,(v,st)=>PC().fmtTime(v,st,V.x1),q=>g.measureText(q).width,18);
  g.textAlign='center';g.textBaseline='top';xt.vals.forEach((v,i)=>{const x=X(p,v);g.beginPath();g.moveTo(x,MT);g.lineTo(x,H-MB);g.stroke();const w=g.measureText(xt.labels[i]).width;g.fillText(xt.labels[i],Math.min(Math.max(x,w/2+2),W-w/2-2),H-MB+6);});
  g.save();g.beginPath();g.rect(ML,MT,W-ML-MR,H-MT-MB);g.clip();
  for(const {t,s} of S){const q=s.q,r=s.r,col=t.color;g.strokeStyle=col;g.fillStyle=col+'38';g.lineWidth=1.4;g.lineJoin='round';
   if(r.raw){g.beginPath();let pen=false;for(let i=0;i<r.t.length;i++){const v=q.v[i];if(!Number.isFinite(v)){pen=false;continue;}const x=X(p,r.t[i]),y=Y(v);pen?g.lineTo(x,y):g.moveTo(x,y);pen=true;}g.stroke();continue;}
   const n=q.mn.length,dx=(W-ML-MR)/n,has=new Uint8Array(n),mn=new Float64Array(n),mx=new Float64Array(n),fi=new Float64Array(n),la=new Float64Array(n),sm=new Float64Array(n),nn=new Float64Array(n);
   for(let i=0;i<n;i++){if(!Number.isFinite(q.mn[i])||!Number.isFinite(q.mx[i]))continue;has[i]=1;mn[i]=q.mn[i];mx[i]=q.mx[i];fi[i]=q.fi[i];la[i]=q.la[i];if(q.av&&Number.isFinite(q.av[i])){sm[i]=q.av[i];nn[i]=1;}}
   g.save();g.translate(ML,0);g.scale(dx,1);const C={has,mn,mx,fi,la,sm,nn};PC().bandPath(g,C,0,Y);g.fill();PC().meanPath(g,C,0,Y);g.restore();g.stroke();}
  if(p.hx!=null){g.strokeStyle='#8a979a';g.setLineDash([3,3]);g.beginPath();g.moveTo(p.hx,MT);g.lineTo(p.hx,H-MB);g.stroke();g.setLineDash([]);}
  g.restore();}
 // the value of a trace at the time t (the nearest sample, or the mean of its pixel column)
 function valueAt(p,t,tm){const s=seriesOf(p,t);if(!s||!s.q)return NaN;const r=s.r,q=s.q;
  if(r.raw){if(!r.t.length)return NaN;let lo=0,hi=r.t.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(r.t[m]<=tm)lo=m;else hi=m;}return Math.abs(r.t[hi]-tm)<Math.abs(r.t[lo]-tm)?q.v[hi]:q.v[lo];}
  const n=q.mn.length,i=Math.floor((tm-V.x0)/(V.x1-V.x0)*n);return i>=0&&i<n?(q.av?q.av[i]:q.la[i]):NaN;}
 // ---------------------------------------------------------------- zoom and pan (one time axis for all the panes)
 function bindPane(p){let drag=null;const px=e=>{const b=p.cv.getBoundingClientRect();return [e.clientX-b.left,e.clientY-b.top];};
  p.cv.onmousedown=e=>{drag={a:px(e),y:e.shiftKey};};
  p.cv.onmousemove=e=>{const [x]=px(e);p.hx=x>=ML&&x<=p.W-MR?x:null;const tm=V.x0+(x-ML)/(p.W-ML-MR)*(V.x1-V.x0);paint(p);
   if(p.hx!=null)status(`t = ${esc(PC().fmtTime(tm,(V.x1-V.x0)/1000,V.x1))} · `+p.traces.map(t=>`${esc(t.label)} = ${fmt(valueAt(p,t,tm))}${t.unit?' '+esc(t.unit):''}`).join(' · '));};
  p.cv.onmouseleave=()=>{p.hx=null;paint(p);};
  window.addEventListener('mouseup',e=>{if(!drag)return;const a=drag.a,b=px(e),d=drag;drag=null;
   if(!d.y&&Math.abs(b[0]-a[0])>4){push();const t=u=>V.x0+(Math.min(Math.max(u,ML),p.W-MR)-ML)/(p.W-ML-MR)*(V.x1-V.x0);const ta=t(Math.min(a[0],b[0])),tb=t(Math.max(a[0],b[0]));V.x0=ta;V.x1=tb;loadAll();}
   else if(d.y&&Math.abs(b[1]-a[1])>4){push();const ys=[a[1],b[1]].sort((u,v)=>u-v),v=y=>p.hi-(y-MT)/(p.H-MT-MB)*(p.hi-p.lo);p.yr=[v(ys[1]),v(ys[0])];paint(p);}});
  p.cv.onwheel=e=>{e.preventDefault();const f=e.deltaY>0?1.25:0.8,[x]=px(e),tm=V.x0+(x-ML)/(p.W-ML-MR)*(V.x1-V.x0),[A,B]=span();push();V.x0=Math.max(A,tm-(tm-V.x0)*f);V.x1=Math.min(B,tm+(V.x1-tm)*f);if(!(V.x1>V.x0))[V.x0,V.x1]=[A,B];loadAll();};
  p.cv.ondblclick=()=>{push();allRange();for(const q of V.panes)q.yr=null;loadAll();};
  let rt=0;new ResizeObserver(()=>{clearTimeout(rt);rt=setTimeout(()=>{if(fit(p))load(p);},120);}).observe(p.cv);}
 const push=()=>{V.hist.push([V.x0,V.x1,V.panes.map(p=>p.yr)]);if(V.hist.length>100)V.hist.shift();};
 function span(){let A=Infinity,B=-Infinity;for(const s of V.sources){if(Number.isFinite(s.info.t0))A=Math.min(A,s.info.t0);if(Number.isFinite(s.info.t1))B=Math.max(B,s.info.t1);}return Number.isFinite(A)&&B>A?[A,B]:[0,1];}
 function allRange(){[V.x0,V.x1]=span();}
 // ---------------------------------------------------------------- refresh while a run is written
 async function refresh(){const atEnd=V.sources.length&&Math.abs(V.x1-span()[1])<=1e-9*Math.max(1,Math.abs(V.x1));
  for(const s of V.sources){try{s.info=await api('info',{source:s.path});if(s.study)s.runs=(await api('runs',{study:s.study})).runs;}catch(e){status('⚠ '+esc(e.message),true);}}
  if(atEnd||!(V.x1>V.x0)){const [A,B]=span();const w=V.x1-V.x0;V.x1=B;if(V.x0<=A||!(w>0))V.x0=A;}
  renderSources();loadAll();const run=V.sources.filter(s=>s.info.status==='running');
  status(run.length?`↻ ${run.map(s=>`τρέξιμο ${s.info.n}: ${s.info.rows} γραμμές, ως ${PC().fmtTime(s.info.t1||0,(s.info.t1||1e-9)/1000,s.info.t1||1e-9)}`).join(' · ')}`:'↻ ενημερώθηκε');}
 function follow(on){clearInterval(V.timer);V.timer=0;if(on)V.timer=setInterval(()=>{if(V.sources.some(s=>s.info.status==='running')||$('#vw-follow').checked)refresh();},1000);}
 // ---------------------------------------------------------------- A − B and CSV
 function diff(){if(V.sel.length!==2){status('Διάλεξε δύο σήματα με Ctrl+κλικ στο δέντρο (από την ίδια ή από διαφορετικές πηγές).',true);return;}
  const [a,b]=V.sel,p=pane();p.traces.push({id:'d'+(++V.seq),a,b,label:`${srcTag(a.src)} ${a.c.name} − ${srcTag(b.src)} ${b.c.name}`,unit:a.c.unit,color:COL[V.nextCol++%COL.length]});V.sel=[];renderTree();load(p);}
 async function csv(){const p=pane(),tr=p.traces.filter(t=>!t.a);if(!tr.length)return;const lines=[];const bySrc=new Map();for(const t of tr){if(!bySrc.has(t.src))bySrc.set(t.src,[]);bySrc.get(t.src).push(t);}
  for(const [s,ts] of bySrc){const r=await api('range',{source:s.path,t0:V.x0,t1:V.x1,keys:ts.map(t=>t.key),n:10000});lines.push(`# ${s.info.path}`);
   if(r.raw){lines.push(['t (s)',...ts.map(t=>t.label)].join(','));for(let i=0;i<r.t.length;i++)lines.push([r.t[i],...ts.map(t=>r.cols[t.key].v[i]??'')].join(','));}
   else{lines.push(['t (s)',...ts.flatMap(t=>[t.label+' min',t.label+' max'])].join(','));const n=r.cols[ts[0].key].mn.length;for(let i=0;i<n;i++)lines.push([V.x0+(i+0.5)*(V.x1-V.x0)/n,...ts.flatMap(t=>[r.cols[t.key].mn[i]??'',r.cols[t.key].mx[i]??''])].join(','));}}
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([lines.join('\n')+'\n'],{type:'text/csv'}));a.download='viewer_range.csv';document.body.appendChild(a);a.click();a.remove();}
 // ---------------------------------------------------------------- start
 function start(){$('#vw-open').onclick=()=>openSource($('#vw-path').value);$('#vw-path').onkeydown=e=>{if(e.key==='Enter')openSource(e.target.value);};
  $('#vw-search').oninput=renderTree;$('#vw-refresh').onclick=refresh;$('#vw-follow').onchange=e=>follow(e.target.checked);
  $('#vw-back').onclick=()=>{const h=V.hist.pop();if(!h)return;[V.x0,V.x1]=h;V.panes.forEach((p,i)=>p.yr=h[2][i]??null);loadAll();};
  $('#vw-all').onclick=()=>{push();allRange();V.panes.forEach(p=>p.yr=null);loadAll();};$('#vw-pane').onclick=()=>{addPane();renderTree();};
  $('#vw-diff').onclick=diff;$('#vw-csv').onclick=csv;addPane();
  api('settings',{}).then(s=>{$('#vw-recent').innerHTML=(s.recent||[]).map(x=>`<option value="${esc(x)}">`).join('');}).catch(()=>{});
  const q=new URLSearchParams(location.search),src=q.get('source');if(src){$('#vw-path').value=src;openSource(src);}if(q.get('follow')==='1'){$('#vw-follow').checked=true;follow(true);}}
 root.Viewer={V,openSource,refresh,diff,pane,addTrace:(i,key)=>{const s=V.sources[i];const c=s&&s.info.channels.find(c=>c.key===key);if(c){addTrace(s,c);renderTree();}},valueAt};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})(window);
