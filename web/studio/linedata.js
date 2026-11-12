'use strict';
// "Δεδομένα γραμμής" (4.4, ROADMAP §26): the dialog of the part 'TLM', in the spirit of the EMTP Line/Cable Data.
// Conductor tables (single wires, symmetrical bundles; phase 0 = ground wire, eliminated), soil, a drawing of the
// tower head, the model options, and the report that /api/line_model returns (pcl/lineconst.py): sequence and modal
// parameters at one frequency, T_i, and for FD the fit of Z_c and A for every mode. No DOM outside the dialog.
(function(root){
 const P=root.Parts;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const WCOL=[['ph','Φάση','',44],['x','x (m)','',62],['y','Ύψος στον πύργο (m)','',70],['ymid','Ύψος στο μέσο (m)','κενό: όπως στον πύργο',70],['r','Ακτίνα (cm)','',62],['Rdc','R_dc (Ω/km)','',70],['tD','T/D','0,5 = συμπαγής',52],['mur','μ_r','',44]];
 const BCOL=[['ph','Φάση','',44],['x','x (m)','',62],['y','Ύψος στον πύργο (m)','',70],['ymid','Ύψος στο μέσο (m)','',70],['n','Αγωγοί','',44],['R','Ακτίνα δέσμης (cm)','απόσταση κέντρου–αγωγού',64],['ang','Γωνία (°)','πρώτου αγωγού',52],
  ['r','Ακτίνα αγωγού (cm)','',62],['Rdc','R_dc (Ω/km)','',70],['tD','T/D','',52],['mur','μ_r','',44]];
 const EARTH=[['carson','Carson (σειρά, όπως το LINE CONSTANTS)'],['integral','Carson (ολοκλήρωμα, αριθμητικά)'],['deri','Μιγαδικό βάθος (Deri κ.ά.)'],['perfect','Τέλεια αγώγιμο έδαφος']];
 const PHC=['#7a8a86','#147966','#c47a1c','#2f5fa0','#b03a5b','#6b4fa0','#203a3f','#5b8a2f','#a0522d','#3a7ca5','#8a3a7c','#4a4a4a','#2a8a8a'];
 const num=v=>{const x=typeof v==='number'?v:P.parseEng(String(v??'').trim());return Number.isFinite(x)?x:null;};
 const fmt=(v,d=4)=>v==null||!Number.isFinite(+v)?'—':(Math.abs(v)>=1e5||(Math.abs(v)<1e-3&&v!==0))?(+v).toExponential(d-1):(+(+v).toPrecision(d)).toString();

 // the conductors that will be drawn (bundles expanded), heights at the tower
 function expand(d){const out=[];(d.wires||[]).forEach((w,i)=>out.push({x:+w.x,y:+w.y,r:(+w.r||1)/100,ph:+w.ph||0,lab:'W'+(i+1)}));
  (d.bundles||[]).forEach((b,i)=>{const n=Math.max(1,Math.round(+b.n||1)),R=(+b.R||0)/100,a0=(+b.ang||0)*Math.PI/180;
   for(let k=0;k<n;k++){const a=a0+2*Math.PI*k/n;out.push({x:+b.x+(n>1?R*Math.cos(a):0),y:+b.y+(n>1?R*Math.sin(a):0),r:(+b.r||1)/100,ph:+b.ph||0,lab:k?'':'B'+(i+1)});}});return out;}
 function drawing(d){const cs=expand(d).filter(c=>Number.isFinite(c.x)&&Number.isFinite(c.y));if(!cs.length)return '<p class="muted small">Χωρίς αγωγούς.</p>';
  const W=340,H=300,xs=cs.map(c=>c.x),ys=cs.map(c=>c.y),x0=Math.min(...xs,-1),x1=Math.max(...xs,1),y1=Math.max(...ys,1),span=Math.max(x1-x0,y1)*1.25,cx=(x0+x1)/2;
  const X=x=>W/2+(x-cx)/span*W*0.92,Y=y=>H-24-y/span*(H-40),g=Y(0);let s=`<svg class="ld-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Σχέδιο αγωγών">`;
  s+=`<rect x="0" y="${g}" width="${W}" height="${H-g}" class="ld-soil"/><line x1="0" x2="${W}" y1="${g}" y2="${g}" class="ld-gl"/>`;
  for(const c of cs){const rr=Math.max(3.5,c.r/span*W*6);s+=`<circle cx="${X(c.x).toFixed(1)}" cy="${Y(c.y).toFixed(1)}" r="${rr.toFixed(1)}" fill="${PHC[c.ph%PHC.length]}"><title>${esc(c.lab)} φάση ${c.ph} · x ${fmt(c.x)} m · ${fmt(c.y)} m</title></circle>`;
   if(c.lab)s+=`<text x="${(X(c.x)+rr+2).toFixed(1)}" y="${(Y(c.y)-rr-2).toFixed(1)}" class="ld-t">${esc(c.lab)}${c.ph?'':' (γ)'}</text>`;}
  const hy=Math.max(...ys);s+=`<text x="4" y="${(Y(hy)+4).toFixed(1)}" class="ld-t">${fmt(hy,3)} m</text><text x="4" y="${(g-4).toFixed(1)}" class="ld-t">0</text></svg>`;
  return s+'<div class="ld-leg small">'+[...new Set(cs.map(c=>c.ph))].sort((a,b)=>a-b).map(p=>`<span><i style="background:${PHC[p%PHC.length]}"></i>${p?'φάση '+p:'αγωγοί προστασίας (0)'}</span>`).join('')+'</div>';}
 function table(rows,cols,kind){
  return `<table class="ld-tab"><thead><tr><th>#</th>${cols.map(([k,l,h])=>`<th title="${esc(h)}">${esc(l)}</th>`).join('')}<th></th></tr></thead><tbody>`+
   rows.map((w,i)=>`<tr><td>${kind==='w'?'W':'B'}${i+1}</td>${cols.map(([k,,,wd])=>`<td><input data-t="${kind}" data-i="${i}" data-c="${k}" value="${esc(w[k]??'')}" style="width:${wd}px"></td>`).join('')}<td><button class="x" data-del="${kind}${i}" title="Διαγραφή">✕</button></td></tr>`).join('')+'</tbody></table>';}
 // a small log–log plot of exact (solid) and fitted (dashed) curves
 function plot(f,ys,title,ylab){const W=300,H=150,L=44,B=22,lx=f.map(Math.log10),x0=Math.min(...lx),x1=Math.max(...lx);
  const all=ys.flatMap(s=>s.y).filter(v=>v>0),ly=all.map(Math.log10),y0=Math.max(Math.min(...ly),Math.max(...ly)-12),y1=Math.max(...ly)+0.05;
  const X=v=>L+(Math.log10(v)-x0)/(x1-x0||1)*(W-L-6),Y=v=>(H-B)-(Math.log10(Math.max(v,10**y0))-y0)/(y1-y0||1)*(H-B-14);
  let s=`<svg class="ld-plot" viewBox="0 0 ${W} ${H}"><text x="${L}" y="10" class="ld-t">${esc(title)}${ylab?' ('+esc(ylab)+')':''}</text><text x="${W-6}" y="10" class="ld-t" text-anchor="end">f (Hz)</text>`;
  for(let e=Math.ceil(x0);e<=Math.floor(x1);e+=2)s+=`<line x1="${X(10**e)}" x2="${X(10**e)}" y1="12" y2="${H-B}" class="ld-grid"/><text x="${X(10**e)}" y="${H-8}" class="ld-t" text-anchor="middle">10^${e}</text>`;
  const ys2=(y1-y0)>6?Math.ceil((y1-y0)/6):1;for(let e=Math.ceil(y0);e<=Math.floor(y1);e+=ys2)s+=`<line x1="${L}" x2="${W-6}" y1="${Y(10**e)}" y2="${Y(10**e)}" class="ld-grid"/><text x="${L-3}" y="${Y(10**e)+3}" class="ld-t" text-anchor="end">10^${e}</text>`;
  for(const q of ys)s+=`<polyline fill="none" stroke="${q.c}" stroke-width="1.5" ${q.dash?'stroke-dasharray="4 3"':''} points="${f.map((v,i)=>X(v).toFixed(1)+','+Y(q.y[i]).toFixed(1)).join(' ')}"/>`;
  return s+'</svg>';}
 function reportHTML(r,mdl,curves){if(!r)return '';const R=r.report,M=R.M;let s='';
  if(R.seq){const q=R.seq;s+=`<h3>Ακολουθίες στα ${fmt(R.f)} Hz (με μετάθεση φάσεων)</h3><table class="ld-rep"><tr><th></th><th>R (Ω/km)</th><th>X (Ω/km)</th><th>C (nF/km)</th></tr>
   <tr><td>θετική</td><td>${fmt(q.R1)}</td><td>${fmt(q.X1)}</td><td>${fmt(q.C1*1e9)}</td></tr><tr><td>μηδενική</td><td>${fmt(q.R0)}</td><td>${fmt(q.X0)}</td><td>${fmt(q.C0*1e9)}</td></tr></table>`;}
  s+=`<h3>Ρυθμοί στα ${fmt(R.f)} Hz</h3><table class="ld-rep"><tr><th>ρυθμός</th><th>Z_c (Ω)</th><th>v (km/s)</th><th>R′ (Ω/km)</th><th>L′ (mH/km)</th><th>C′ (nF/km)</th>${mdl.type==='cp'?'<th>τ (μs)</th><th>R (Ω)</th>':'<th>τ (μs)</th><th>πόλοι Z_c / A</th><th>σφάλμα Z_c / A</th>'}</tr>`+
   R.modes.map((m,k)=>{const q=mdl.modes[k];return `<tr><td>${k+1}</td><td>${fmt(m.Zc)}</td><td>${fmt(m.v/1e3,5)}</td><td>${fmt(m.R)}</td><td>${fmt(m.L*1e3)}</td><td>${fmt(m.C*1e9)}</td>`+
    (mdl.type==='cp'?`<td>${fmt(q.tau*1e6,6)}</td><td>${fmt(q.R)}</td>`:`<td>${fmt(q.tau*1e6,6)}</td><td>${q.zc.p.length} / ${q.a.p.length}</td><td>${fmt(q.zc.err*100,2)} % / ${fmt(q.a.err*100,2)} %</td>`)+'</tr>';}).join('')+'</table>';
  s+=`<p class="small muted">T_i (στήλες = ρυθμοί, ${mdl.type==='fd'?'στα '+fmt(mdl.fti)+' Hz':'στα '+fmt(mdl.f)+' Hz'}): ${mdl.Ti.map(r=>'['+r.map(v=>fmt(Math.abs(v)<1e-9?0:v,4)).join(', ')+']').join(' ')} · σφάλμα σταθερού T_i ${fmt((mdl.qerr||0)*100,2)} %.</p>`;
  if(curves){s+=`<h3>Προσαρμογή FD (συνεχής: ακριβές, διακεκομμένη: ρητή συνάρτηση)</h3><p class="small muted">Το σφάλμα του A μετριέται σε απόλυτη τιμή (όπως το EMTP): όπου |A| &lt; 10⁻³ το κύμα έχει ήδη σβήσει και η απόκλιση της καμπύλης δεν μετρά.</p><div class="ld-plots">`+curves.modes.map((c,k)=>plot(curves.f,[{y:c.Zc,c:PHC[k+1]},{y:c.Zc_fit,c:'#222',dash:true}],`ρυθμός ${k+1}: |Z_c|`,'Ω')
   +plot(curves.f,[{y:c.A,c:PHC[k+1]},{y:c.A_fit,c:'#222',dash:true}],`ρυθμός ${k+1}: |A|`,'')).join('')+'</div>';}
  return s;}

 // opens the dialog for the part `id`; ctx = {editor, api(action, data) → Promise, changed()}
 function open(id,ctx){const c=ctx.editor.comp(id);if(!c)return;const p0={...P.defaults('TLM'),...c.params};
  let d;try{d=JSON.parse(p0.data);}catch(e){d={rho:100,earth:'carson',skin:true,wires:[],bundles:[]};}
  d.wires=d.wires||[];d.bundles=d.bundles||[];let last=null,status=null;
  const box=document.createElement('div');box.className='modal ld-modal';document.body.appendChild(box);
  const close=()=>{box.remove();document.removeEventListener('keydown',onKey);};const onKey=e=>{if(e.key==='Escape')close();};document.addEventListener('keydown',onKey);
  const pars=()=>({...P.defaults('TLM'),...ctx.editor.comp(id).params});
  // a change handler may run while the dialog is being replaced (blur → change): draw again after the event
  let pend=false;const later=()=>{if(pend)return;pend=true;setTimeout(()=>{pend=false;if(box.isConnected)render();},0);};
  const render=()=>{const p=pars(),fd=p.model==='fd';
   box.innerHTML=`<div class="modal-box ld-box"><div class="modal-head"><h2>Δεδομένα γραμμής · ${esc(c.label||c.id)}</h2><button class="x" data-close>✕</button></div><div class="modal-body">
    <div class="ld-grid">
     <div class="ld-left">
      <div class="ld-row"><label>Έτοιμη γραμμή <select data-preset><option value="">—</option>${Object.entries(P.TLM_TYPICAL).map(([k,v])=>`<option value="${k}">${esc(v.name)}</option>`).join('')}<option value="empty">Κενή</option></select></label>
       <label>Μήκος (km) <input data-p="len" value="${esc(p.len)}" style="width:70px"></label>
       <label>Μοντέλο <select data-p="model"><option value="cp" ${fd?'':'selected'}>CP (σταθερές παράμετροι)</option><option value="fd" ${fd?'selected':''}>FD (J. Marti)</option></select></label></div>
      <div class="ld-row">${fd?`<label>f_min (Hz) <input data-p="fmin" value="${esc(p.fmin)}" style="width:60px"></label><label>Δεκάδες <input data-p="dec" value="${esc(p.dec)}" style="width:40px"></label><label>Σημεία/δεκάδα <input data-p="ppd" value="${esc(p.ppd)}" style="width:40px"></label><label>f του T_i (Hz) <input data-p="fti" value="${esc(p.fti)}" style="width:60px"></label>`
       :`<label>Συχνότητα του CP (Hz) <input data-p="f" value="${esc(p.f)}" style="width:70px"></label>`}</div>
      <h3>Έδαφος</h3><div class="ld-row"><label>ρ (Ω·m) <input data-d="rho" value="${esc(d.rho??100)}" style="width:60px"></label>
       <label>Επιστροφή <select data-d="earth">${EARTH.map(([k,l])=>`<option value="${k}" ${(d.earth||'carson')===k?'selected':''}>${esc(l)}</option>`).join('')}</select></label>
       <label><input type="checkbox" data-d="skin" ${d.skin===false?'':'checked'}> Επιδερμικό φαινόμενο</label><label title="Διαγώνιος του G των φάσεων, προεπιλογή 0,2·10⁻⁹ S/km (EMTP)">G (S/km) <input data-d="G" value="${esc(d.G??'')}" placeholder="0.2e-9" style="width:64px"></label></div>
      <h3>Αγωγοί (απλοί) <small class="muted">φάση 0 = αγωγός προστασίας· ίδια φάση = παράλληλοι</small></h3>${table(d.wires,WCOL,'w')}<button data-add="w">+ Αγωγός</button>
      <h3>Δέσμες (συμμετρικές)</h3>${table(d.bundles,BCOL,'b')}<button data-add="b">+ Δέσμη</button>
     </div>
     <div class="ld-right">${drawing(d)}<p class="small muted">Το μέσο ύψος είναι (2·h_μέσο + h_πύργου)/3. Οι αγωγοί της ίδιας φάσης ενώνονται, οι αγωγοί προστασίας γειώνονται σε κάθε πύργο.</p></div>
    </div>
    <div class="ld-actions"><button class="primary-ghost" data-run>Υπολογισμός</button><span class="small${status?.bad?' bad':''}" data-msg>${status?esc(status.t):P.tlmModel(p).err?'⚠ '+esc(P.tlmModel(p).err):'✓ Το μοντέλο είναι ενημερωμένο.'}</span></div>
    <div data-rep>${last?reportHTML(last,last.mdl,last.curves):''}</div></div></div>`;
   box.querySelector('[data-close]').onclick=close;box.onclick=e=>{if(e.target===box)close();};
   const saveData=()=>{status=null;ctx.editor.setParams(id,{data:JSON.stringify(d)});ctx.changed();};
   box.querySelectorAll('[data-t]').forEach(el=>el.onchange=()=>{const arr=el.dataset.t==='w'?d.wires:d.bundles,k=el.dataset.c,v=el.value.trim();
    if(k==='ymid'&&v===''){delete arr[+el.dataset.i].ymid;}else{const x=num(v);if(x===null){el.classList.add('bad');return;}arr[+el.dataset.i][k]=k==='ph'||k==='n'?Math.round(x):x;}el.classList.remove('bad');saveData();later();});
   box.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{const t=b.dataset.del[0],i=+b.dataset.del.slice(1);(t==='w'?d.wires:d.bundles).splice(i,1);saveData();later();});
   box.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{if(b.dataset.add==='w'){const l=d.wires[d.wires.length-1];d.wires.push(l?{...l,x:+l.x+2}:{ph:1,x:0,y:15,r:1,Rdc:0.1,tD:0.5});}
    else{const l=d.bundles[d.bundles.length-1];d.bundles.push(l?{...l,x:+l.x+8,ph:(+l.ph||0)+1}:{ph:1,x:0,y:15,n:2,R:20,ang:0,r:1.5,Rdc:0.06,tD:0.33});}saveData();later();});
   box.querySelectorAll('[data-d]').forEach(el=>el.onchange=()=>{const k=el.dataset.d;if(k==='skin')d.skin=el.checked;else if(k==='earth')d.earth=el.value;else if(k==='G'){const x=num(el.value);if(el.value.trim()==='')delete d.G;else if(x!==null)d.G=x;}else{const x=num(el.value);if(x!==null)d[k]=x;}saveData();later();});
   box.querySelectorAll('[data-p]').forEach(el=>el.onchange=()=>{const k=el.dataset.p;let v=el.value;if(k!=='model'){const x=num(v);if(x===null){el.classList.add('bad');return;}v=x;}status=null;ctx.editor.setParams(id,{[k]:v});ctx.changed();later();});
   const pre=box.querySelector('[data-preset]');pre.onchange=()=>{if(!pre.value)return;d=pre.value==='empty'?{rho:100,earth:'carson',skin:true,wires:[],bundles:[]}:JSON.parse(JSON.stringify(P.TLM_TYPICAL[pre.value]));
    d.wires=d.wires||[];d.bundles=d.bundles||[];const L=d.length;ctx.editor.setParams(id,{data:JSON.stringify(d),...(L?{len:L}:{})});ctx.changed();later();};
   box.querySelector('[data-run]').onclick=async()=>{const msg=box.querySelector('[data-msg]');msg.textContent='Υπολογισμός…';msg.className='small';
    try{last=await compute(id,ctx);status={t:'✓ Υπολογίστηκε.'};render();}catch(e){status={t:'⚠ '+(e.message||e),bad:true};render();}};
  };
  render();}
 // asks the server for the model of the part `id` and keeps it in its parameters (with the key of what it was computed from)
 async function compute(id,ctx){const p={...P.defaults('TLM'),...ctx.editor.comp(id).params},src=P.tlmKey(p),d=JSON.parse(p.data);
  const r=await ctx.api('line_model',{data:d,model:p.model,len:num(p.len),f:num(p.f),fmin:num(p.fmin),dec:num(p.dec),ppd:num(p.ppd),fti:num(p.fti),src});
  ctx.editor.setParams(id,{mdl:JSON.stringify(r.mdl)});ctx.changed();return r;}
 // every line part whose model is missing or old: computed again (for a run, or after a change of the length)
 async function refresh(ctx,comps){const need=comps.filter(c=>c.type==='TLM'&&P.tlmModel({...P.defaults('TLM'),...c.params}).need&&(()=>{try{JSON.parse(c.params?.data??P.defaults('TLM').data);return true;}catch(e){return false;}})());
  for(const c of need)await compute(c.id,ctx);return need.length;}
 const api={open,compute,refresh,expand};root.LineData=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
