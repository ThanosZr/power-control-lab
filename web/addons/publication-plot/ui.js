'use strict';
// Γραφική για δημοσίευση (built-in add-on, 3.15, ROADMAP §36): the scope's channels as a figure with the presets of
// pcl/presets/*.json (the same files as pcl.plotting and pcl_style.m). SVG with its real size (cm) and font sizes (pt),
// one axes per unit, colour-blind palette of the preset, a table of extremes.
const $=s=>document.querySelector(s);
const QTY={V:'τάση',A:'ρεύμα',W:'ισχύς','rad/s':'ταχύτητα','N·m':'ροπή'};
let P={},data=null,svgText='',ext=[];
const msg=(t,bad)=>{$('#msg').textContent=t||'';$('#msg').className='small'+(bad?' err':'');};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const unitOf=k=>({V:'V',I:'A',P:'W',N:'V',W:'rad/s',T:'N·m',E:'J'}[k.split(':')[0]]||'');
function ticks(a,b,n){const sp=b-a||Math.abs(a)||1,s0=sp/n,m=10**Math.floor(Math.log10(s0)),st=[1,2,2.5,5,10].map(x=>x*m).find(x=>x>=s0*.999);const o=[];for(let v=Math.ceil(a/st)*st;v<=b+st*1e-9;v+=st)o.push(+v.toPrecision(12));return o;}
function tScale(span){for(const [m,p] of [[1e-9,'n'],[1e-6,'μ'],[1e-3,'m'],[1,'']])if(span<1000*m)return [1/m,`t (${p}s)`];return [1,'t (s)'];}
const num=v=>String(+v.toPrecision(4)).replace('.',',');

async function init(){try{P=await PCL.presets();}catch(e){msg(e.message,true);return;}
 $('#preset').innerHTML=Object.entries(P).map(([k,p])=>`<option value="${k}">${esc(p.title||k)}</option>`).join('');$('#preset').value='ieee';
 try{const ch=await PCL.scope();$('#chans').innerHTML=ch.keys.length?ch.keys.map(k=>`<label class="row"><input type="checkbox" data-k="${esc(k)}" checked> ${esc(k)}</label>`).join(''):'<span class="muted">Το scope δεν έχει κανάλια: πρόσθεσε σήματα και τρέξε την προσομοίωση.</span>';}catch(e){msg(e.message,true);}}

function render(){const p=P[$('#preset').value],keys=[...document.querySelectorAll('[data-k]:checked')].map(x=>x.dataset.k);
 if(!data||!keys.length){msg('Διάλεξε κανάλια.',true);return;}
 const t=data.t,a=$('#t0').value===''?t[0]:+$('#t0').value,b=$('#t1').value===''?t[t.length-1]:+$('#t1').value,idx=[];for(let i=0;i<t.length;i++)if(t[i]>=a&&t[i]<=b)idx.push(i);
 if(idx.length<2){msg('Λίγα σημεία στο διάστημα.',true);return;}
 const [tm,tl]=tScale(t[idx[idx.length-1]]-t[idx[0]]);
 const groups=[];for(const k of keys){const u=unitOf(k);let g=groups.find(x=>x.u===u);if(!g)groups.push(g={u,keys:[]});g.keys.push(k);}
 // in points: 1 cm = 72/2.54 pt
 const PT=72/2.54,W=p.width_cm*PT,H=p.height_cm*PT,fs=p.size,font=[p.font,...(p.font_fallback||[])].map(f=>/\s/.test(f)?`'${f}'`:f).join(', ');
 const L=fs.label*3.6,R=6,T=(($('#title').value?fs.title*1.6:0))+4,B=fs.label*2.6,gap=fs.tick*1.4,gh=(H-T-B-gap*(groups.length-1))/groups.length;
 let s=`<svg xmlns="http://www.w3.org/2000/svg" width="${p.width_cm}cm" height="${p.height_cm}cm" viewBox="0 0 ${W.toFixed(2)} ${H.toFixed(2)}" font-family="${esc(font)}" font-size="${fs.base}">`;
 s+=`<rect width="100%" height="100%" fill="#fff"/>`;if($('#title').value)s+=`<text x="${W/2}" y="${fs.title*1.2}" text-anchor="middle" font-size="${fs.title}">${esc($('#title').value)}</text>`;
 ext=[];let ci=0;
 groups.forEach((g,gi)=>{const y0=T+gi*(gh+gap),x0=L,x1=W-R,y1=y0+gh;let lo=Infinity,hi=-Infinity;
  for(const k of g.keys)for(const i of idx){const v=data.ch[k][i];if(Number.isFinite(v)){lo=Math.min(lo,v);hi=Math.max(hi,v);}}
  if(hi===lo){lo-=Math.abs(lo)*.05||1;hi+=Math.abs(hi)*.05||1;}const pad=(hi-lo)*.06;lo-=pad;hi+=pad;
  const X=v=>x0+(v*tm-a*tm)/((b-a)*tm)*(x1-x0),Y=v=>y1-(v-lo)/(hi-lo)*(y1-y0);
  if(p.grid)for(const v of ticks(lo,hi,4))s+=`<line x1="${x0}" x2="${x1}" y1="${Y(v).toFixed(2)}" y2="${Y(v).toFixed(2)}" stroke="#000" stroke-opacity="${p.grid_alpha}" stroke-width="0.3"/>`;
  if(p.grid)for(const v of ticks(a*tm,b*tm,5))s+=`<line y1="${y0}" y2="${y1}" x1="${X(v/tm).toFixed(2)}" x2="${X(v/tm).toFixed(2)}" stroke="#000" stroke-opacity="${p.grid_alpha}" stroke-width="0.3"/>`;
  for(const v of ticks(lo,hi,4))s+=`<text x="${x0-3}" y="${(Y(v)+fs.tick*.35).toFixed(2)}" text-anchor="end" font-size="${fs.tick}">${num(v)}</text>`;
  if(gi===groups.length-1){for(const v of ticks(a*tm,b*tm,5))s+=`<text x="${X(v/tm).toFixed(2)}" y="${(y1+fs.tick*1.3).toFixed(2)}" text-anchor="middle" font-size="${fs.tick}">${num(v)}</text>`;
   s+=`<text x="${(x0+x1)/2}" y="${(H-fs.label*.4).toFixed(2)}" text-anchor="middle" font-size="${fs.label}">${tl}</text>`;}
  s+=`<text transform="translate(${(fs.label*1.1).toFixed(2)},${((y0+y1)/2).toFixed(2)}) rotate(-90)" text-anchor="middle" font-size="${fs.label}">${esc(QTY[g.u]?`${QTY[g.u]} (${g.u})`:g.u||'σήμα')}</text>`;
  g.keys.forEach((k,j)=>{const c=p.colors[ci%p.colors.length],dash=p.linestyles?.[Math.floor(ci/p.colors.length)%p.linestyles.length]==='--'?' stroke-dasharray="4 2"':'';ci++;
   const step=Math.max(1,Math.floor(idx.length/3000));let d='';for(let n=0;n<idx.length;n+=step){const i=idx[n],v=data.ch[k][i];if(Number.isFinite(v))d+=(d?'L':'M')+X(t[i]).toFixed(2)+','+Y(v).toFixed(2);}
   s+=`<path d="${d}" fill="none" stroke="${c}" stroke-width="${p.linewidth}"${dash}/>`;
   if(g.keys.length>1)s+=`<line x1="${x1-60}" x2="${x1-48}" y1="${y0+8+j*fs.legend*1.3}" y2="${y0+8+j*fs.legend*1.3}" stroke="${c}" stroke-width="${p.linewidth}"/><text x="${x1-45}" y="${y0+8+j*fs.legend*1.3+fs.legend*.35}" font-size="${fs.legend}">${esc(k)}</text>`;
   // extremes over the interval: trapezoidal mean and RMS, as pcl.plotting.extremes
   let mx=-Infinity,mn=Infinity,ar=0,sq=0,du=0,tp=0,pk=0;for(let n=0;n<idx.length;n++){const i=idx[n],v=data.ch[k][i];if(v>mx)mx=v;if(v<mn)mn=v;if(Math.abs(v)>Math.abs(pk)){pk=v;tp=t[i];}
    if(n){const i0=idx[n-1],v0=data.ch[k][i0],h=t[i]-t[i0];ar+=h*(v0+v)/2;sq+=h*(v0*v0+v0*v+v*v)/3;du+=h;}}
   ext.push({signal:k,unit:g.u,max:mx,min:mn,mean:ar/du,rms:Math.sqrt(sq/du),t_peak:tp,peak:pk});});
  if(p.box!==false)s+=`<rect x="${x0}" y="${y0}" width="${x1-x0}" height="${gh}" fill="none" stroke="#000" stroke-width="0.6"/>`;
  else s+=`<path d="M${x0},${y0}V${y1}H${x1}" fill="none" stroke="#000" stroke-width="0.6"/>`;});
 svgText=s+'</svg>';$('#fig').innerHTML=svgText;const im=$('#fig svg');im.style.width='100%';im.style.height='auto';im.style.border='1px solid var(--line)';
 $('#tbl').innerHTML=`<table><thead><tr><th>σήμα</th><th>max</th><th>min</th><th>μέση</th><th>RMS</th><th>t κορυφής</th></tr></thead><tbody>${ext.map(r=>`<tr><td>${esc(r.signal)}</td><td>${num(r.max)}</td><td>${num(r.min)}</td><td>${num(r.mean)}</td><td>${num(r.rms)}</td><td>${num(r.t_peak)}</td></tr>`).join('')}</tbody></table>`;
 for(const b of ['#svg','#png','#csv'])$(b).disabled=false;msg(`${p.width_cm} × ${p.height_cm} cm, ${p.font} ${fs.base} pt.`);}

$('#draw').onclick=async()=>{try{data=await PCL.scope();render();}catch(e){msg(e.message,true);}};
for(const id of ['#preset','#t0','#t1','#title'])$(id).onchange=()=>{if(data)render();};
$('#chans').onchange=()=>{if(data)render();};
$('#svg').onclick=()=>PCL.download(`figure_${$('#preset').value}.svg`,svgText,'image/svg+xml');
$('#csv').onclick=()=>PCL.download('extremes.csv',['signal,unit,max,min,mean,rms,t_peak',...ext.map(r=>[r.signal,r.unit,r.max,r.min,r.mean,r.rms,r.t_peak].join(','))].join('\n')+'\n','text/csv');
$('#png').onclick=()=>{const p=P[$('#preset').value],w=Math.round(p.width_cm/2.54*p.dpi),h=Math.round(p.height_cm/2.54*p.dpi),img=new Image();
 img.onload=()=>{const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);const u=c.toDataURL('image/png');PCL.download(`figure_${$('#preset').value}.png`,{base64:u.split(',')[1]},'image/png');};
 img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svgText);};
init();
