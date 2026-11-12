'use strict';
// "Δεδομένα γραμμής" (4.4, ROADMAP §26): the dialog of the part 'TLM', in the spirit of the EMTP Line/Cable Data.
// Overhead: conductor tables (single wires, symmetrical bundles; phase 0 = ground wire, eliminated), soil, a drawing of
// the tower head. Cables (4.5): per cable its position and its layers from the inside out (conductor / insulation), the
// phase of each conductor (0 = bonded and earthed at both ends), the medium (earth, sea, perfect), a drawing of the
// arrangement and of one cross-section. Then the model options and the report that /api/line_model returns
// (pcl/lineconst.py): sequence and modal parameters at one frequency, T_i, and for FD the fit of Z_c and A for every
// mode. No DOM outside the dialog.
(function(root){
 const P=root.Parts;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const WCOL=[['ph','Φάση','',44],['x','x (m)','',62],['y','Ύψος στον πύργο (m)','',70],['ymid','Ύψος στο μέσο (m)','κενό: όπως στον πύργο',70],['r','Ακτίνα (cm)','',62],['Rdc','R_dc (Ω/km)','',70],['tD','T/D','0,5 = συμπαγής',52],['mur','μ_r','',44]];
 const BCOL=[['ph','Φάση','',44],['x','x (m)','',62],['y','Ύψος στον πύργο (m)','',70],['ymid','Ύψος στο μέσο (m)','',70],['n','Αγωγοί','',44],['R','Ακτίνα δέσμης (cm)','απόσταση κέντρου–αγωγού',64],['ang','Γωνία (°)','πρώτου αγωγού',52],
  ['r','Ακτίνα αγωγού (cm)','',62],['Rdc','R_dc (Ω/km)','',70],['tD','T/D','',52],['mur','μ_r','',44]];
 const MEDIUM=[['earth','Έδαφος (Pollaczek)'],['sea','Θάλασσα (άπειρο μέσο)'],['perfect','Τέλεια αγώγιμο μέσο']];
 // a cable layer: conductor (radii in m in the data, mm in the table) or insulation
 const LCOL=[['rin','r_εσ (mm)','μόνο ο πρώτος αγωγός· οι άλλοι αρχίζουν εκεί που τελειώνει το προηγούμενο στρώμα',58],['rout','r_εξ (mm)','',58],
  ['rho','ρ (Ω·m)','αγωγός',66],['epsr','ε_r','μόνωση, στα 50 Hz',44],['tand','tanδ','μόνωση, στα 50 Hz (αιτιατό μοντέλο ευρείας ζώνης)',52],['mur','μ_r','',40]];
 const isCable=d=>Array.isArray(d.cables);
 const mm=v=>v==null||v===''?'':+(+v*1000).toPrecision(10);
 const phList=s=>String(s??'').split(/[\s,;]+/).filter(Boolean).map(v=>Math.round(+v)).filter(Number.isFinite);
 const EMPTY_OH=()=>({rho:100,earth:'carson',skin:true,wires:[],bundles:[]});
 const EMPTY_CAB=()=>({medium:'earth',rho:100,cables:[]});
 const NEW_CABLE=()=>JSON.parse(JSON.stringify(P.TLM_TYPICAL['150kV-land'].cables[0]));
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
 // cables: the arrangement (depth below the surface, or in the sea) and the cross-section of one cable
 function cableDrawing(d){const cs=(d.cables||[]).filter(c=>Number.isFinite(+c.x)&&Number.isFinite(+c.y));if(!cs.length)return '<p class="muted small">Χωρίς καλώδια.</p>';
  const R=c=>Math.max(0,...(c.layers||[]).map(l=>+l.rout||0)),W=340,H=200,xs=cs.map(c=>+c.x),ys=cs.map(c=>+c.y),rmax=Math.max(...cs.map(R),0.01);
  const x0=Math.min(...xs)-3*rmax,x1=Math.max(...xs)+3*rmax,ymin=Math.min(...ys)-3*rmax,ymax=Math.max(...ys)+3*rmax,sea=d.medium==='sea';
  // the surface is drawn when it is close compared with the spacing, otherwise its depth is written
  const showTop=!sea&&ymin<Math.max(ymax-ymin,x1-x0)*3,yT=showTop?0:ymin,span=Math.max(x1-x0,ymax-yT)*1.1,cx=(x0+x1)/2;
  const X=x=>W/2+(x-cx)/span*W*0.94,sc=W*0.94/span,Y=showTop?y=>16+(y-yT)/span*(H-24):y=>H/2+(y-(ymin+ymax)/2)*sc;
  let s=`<svg class="ld-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Διάταξη καλωδίων"><rect x="0" y="${showTop?Y(0):0}" width="${W}" height="${H}" class="${sea?'ld-sea':d.medium==='perfect'?'ld-perf':'ld-soil'}"/>`;
  if(showTop)s+=`<line x1="0" x2="${W}" y1="${Y(0)}" y2="${Y(0)}" class="ld-gl"/><text x="4" y="${Y(0)-3}" class="ld-t">επιφάνεια</text>`;
  else s+=`<text x="4" y="11" class="ld-t">${sea?'θάλασσα (άπειρο μέσο)':'επιφάνεια '+fmt(ymin+3*rmax,3)+' m πάνω'}</text>`;
  cs.forEach((c,i)=>{const ph=[].concat(c.ph??[]),ls=c.layers||[];
   for(let j=ls.length-1;j>=0;j--){const l=ls[j],r=Math.max(0.6,(+l.rout||0)*sc);
    const fill=(l.t||'c')==='c'?PHC[(+ph[ls.slice(0,j+1).filter(q=>(q.t||'c')==='c').length-1]||0)%PHC.length]:'#f4f1e8';
    s+=`<circle cx="${X(+c.x).toFixed(1)}" cy="${Y(+c.y).toFixed(1)}" r="${r.toFixed(1)}" fill="${fill}" stroke="#55615e" stroke-width="0.3"/>`;}
   s+=`<text x="${X(+c.x).toFixed(1)}" y="${(Y(+c.y)-R(c)*sc-3).toFixed(1)}" class="ld-t" text-anchor="middle">K${i+1}</text>`;});
  s+=`<text x="${W-4}" y="${H-4}" class="ld-t" text-anchor="end">βάθος ${fmt(Math.min(...ys),3)}${Math.max(...ys)!==Math.min(...ys)?'–'+fmt(Math.max(...ys),3):''} m · απόσταση ${xs.length>1?fmt(Math.max(...xs)-Math.min(...xs),3)+' m':'—'}</text></svg>`;
  // the cross-section of the first cable
  const c=cs[0],ls=c.layers||[],Rc=R(c)||1,S=150,C=S/2,ph=[].concat(c.ph??[]);let n=0;
  s+=`<svg class="ld-svg ld-xs" viewBox="0 0 ${S+190} ${S}" role="img" aria-label="Τομή καλωδίου"><g>`;
  const rows=[];for(let j=ls.length-1;j>=0;j--){const l=ls[j],isC=(l.t||'c')==='c',ci=ls.slice(0,j+1).filter(q=>(q.t||'c')==='c').length-1;
   s+=`<circle cx="${C}" cy="${C}" r="${((+l.rout||0)/Rc*(C-4)).toFixed(1)}" fill="${isC?PHC[(+ph[ci]||0)%PHC.length]:'#f4f1e8'}" stroke="#55615e" stroke-width="0.5"/>`;}
  ls.forEach((l,j)=>{const isC=(l.t||'c')==='c';if(isC)n++;rows.push(`<text x="${S+8}" y="${14+j*13}" class="ld-t">${isC?'αγωγός '+n+' (φάση '+(+ph[n-1]||0)+')':'μόνωση'} έως ${fmt((+l.rout||0)*1000,4)} mm</text>`);});
  return s+'</g>'+rows.join('')+'</svg><div class="ld-leg small">'+[...new Set(cs.flatMap(c=>[].concat(c.ph??[])).map(v=>+v||0))].sort((a,b)=>a-b).map(p=>`<span><i style="background:${PHC[p%PHC.length]}"></i>${p?'φάση '+p:'γειωμένος (0)'}</span>`).join('')+'</div>';}
 function cableTables(d){return (d.cables||[]).map((c,i)=>{const ls=c.layers||[];let firstC=true;
  return `<div class="ld-cab"><div class="ld-row"><b>K${i+1}</b><label>x (m) <input data-k="cab" data-i="${i}" data-c="x" value="${esc(c.x)}" style="width:56px"></label>
   <label title="${d.medium==='sea'?'στη θάλασσα: μόνο οι αποστάσεις μετρούν':'κάτω από την επιφάνεια'}">Βάθος (m) <input data-k="cab" data-i="${i}" data-c="y" value="${esc(c.y)}" style="width:56px"></label>
   <label title="Η φάση κάθε αγωγού από μέσα προς τα έξω· 0 = θωράκιση/οπλισμός γειωμένος στα δύο άκρα. Ίδια φάση = παράλληλοι.">Φάσεις αγωγών <input data-k="cab" data-i="${i}" data-c="ph" value="${esc([].concat(c.ph??[]).join(', '))}" style="width:64px"></label>
   <button data-addl="${i}">+ Στρώμα</button><button class="x" data-delc="${i}" title="Διαγραφή καλωδίου">✕</button></div>
   <table class="ld-tab"><thead><tr><th>#</th><th>Στρώμα</th>${LCOL.map(([k,l,h])=>`<th title="${esc(h)}">${esc(l)}</th>`).join('')}<th></th></tr></thead><tbody>`+
   ls.map((l,j)=>{const isC=(l.t||'c')==='c',show=k=>k==='rout'||k==='mur'||(isC?(k==='rho'||(k==='rin'&&firstC)):(k==='epsr'||k==='tand'));const row=`<tr><td>${j+1}</td><td><select data-k="lay" data-i="${i}" data-j="${j}" data-c="t"><option value="c" ${isC?'selected':''}>αγωγός</option><option value="i" ${isC?'':'selected'}>μόνωση</option></select></td>`+
    LCOL.map(([k,,,wd])=>`<td>${show(k)?`<input data-k="lay" data-i="${i}" data-j="${j}" data-c="${k}" value="${esc(k==='rin'||k==='rout'?mm(l[k]):l[k]??'')}" style="width:${wd}px" ${k==='mur'?'placeholder="1"':k==='tand'?'placeholder="0"':''}>`:''}</td>`).join('')+
    `<td><button class="x" data-dell="${i},${j}" title="Διαγραφή στρώματος">✕</button></td></tr>`;if(isC)firstC=false;return row;}).join('')+'</tbody></table></div>';}).join('');}
 function table(rows,cols,kind){
  return `<table class="ld-tab"><thead><tr><th>#</th>${cols.map(([k,l,h])=>`<th title="${esc(h)}">${esc(l)}</th>`).join('')}<th></th></tr></thead><tbody>`+
   rows.map((w,i)=>`<tr><td>${kind==='w'?'W':'B'}${i+1}</td>${cols.map(([k,,,wd])=>`<td><input data-t="${kind}" data-i="${i}" data-c="${k}" value="${esc(w[k]??'')}" style="width:${wd}px"></td>`).join('')}<td><button class="x" data-del="${kind}${i}" title="Διαγραφή">✕</button></td></tr>`).join('')+'</tbody></table>';}
 // a small log–log plot of exact (solid) and fitted (dashed) curves
 function plot(f,ys,title,ylab){const W=300,H=150,L=44,B=22,lx=f.map(Math.log10),x0=Math.min(...lx),x1=Math.max(...lx);
  const all=ys.flatMap(s=>s.y).filter(v=>v>0),ly=all.map(Math.log10),y0=Math.max(Math.min(...ly),Math.max(...ly)-12),y1=Math.max(...ly)+0.05;
  const X=v=>L+(Math.log10(v)-x0)/(x1-x0||1)*(W-L-6),Y=v=>(H-B)-(Math.log10(Math.max(v,10**y0))-y0)/(y1-y0||1)*(H-B-14);
  let s=`<svg class="ld-plot" viewBox="0 0 ${W} ${H}"><text x="${L}" y="10" class="ld-t">${esc(title)}${ylab?' ('+esc(ylab)+')':''}</text><text x="${W-6}" y="10" class="ld-t" text-anchor="end">f (Hz)</text>`;
  for(let e=Math.ceil(x0);e<=Math.floor(x1);e+=2)s+=`<line x1="${X(10**e)}" x2="${X(10**e)}" y1="12" y2="${H-B}" class="ld-gline"/><text x="${X(10**e)}" y="${H-8}" class="ld-t" text-anchor="middle">10^${e}</text>`;
  const ys2=(y1-y0)>6?Math.ceil((y1-y0)/6):1;for(let e=Math.ceil(y0);e<=Math.floor(y1);e+=ys2)s+=`<line x1="${L}" x2="${W-6}" y1="${Y(10**e)}" y2="${Y(10**e)}" class="ld-gline"/><text x="${L-3}" y="${Y(10**e)+3}" class="ld-t" text-anchor="end">10^${e}</text>`;
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
  const norm=()=>{if(isCable(d))return;d.wires=d.wires||[];d.bundles=d.bundles||[];};norm();let last=null,status=null;
  const box=document.createElement('div');box.className='modal ld-modal';document.body.appendChild(box);
  const close=()=>{box.remove();document.removeEventListener('keydown',onKey);};const onKey=e=>{if(e.key==='Escape')close();};document.addEventListener('keydown',onKey);
  const pars=()=>({...P.defaults('TLM'),...ctx.editor.comp(id).params});
  // a change handler may run while the dialog is being replaced (blur → change): draw again after the event
  let pend=false;const later=()=>{if(pend)return;pend=true;setTimeout(()=>{pend=false;if(box.isConnected)render();},0);};
  const render=()=>{const p=pars(),fd=p.model==='fd',cab=isCable(d);
   box.innerHTML=`<div class="modal-box ld-box"><div class="modal-head"><h2>Δεδομένα γραμμής · ${esc(c.label||c.id)}</h2><button class="x" data-close>✕</button></div><div class="modal-body">
    <div class="ld-grid">
     <div class="ld-left">
      <div class="ld-row"><label>Τύπος <select data-kind><option value="oh" ${cab?'':'selected'}>Εναέρια γραμμή</option><option value="cab" ${cab?'selected':''}>Καλώδια</option></select></label><label>Έτοιμη γραμμή <select data-preset><option value="">—</option>${Object.entries(P.TLM_TYPICAL).map(([k,v])=>`<option value="${k}">${esc(v.name)}</option>`).join('')}<option value="empty">Κενή</option></select></label>
       <label>Μήκος (km) <input data-p="len" value="${esc(p.len)}" style="width:70px"></label>
       <label>Μοντέλο <select data-p="model"><option value="cp" ${fd?'':'selected'}>CP (σταθερές παράμετροι)</option><option value="fd" ${fd?'selected':''}>FD (J. Marti)</option></select></label></div>
      <div class="ld-row">${fd?`<label>f_min (Hz) <input data-p="fmin" value="${esc(p.fmin)}" style="width:60px"></label><label>Δεκάδες <input data-p="dec" value="${esc(p.dec)}" style="width:40px"></label><label>Σημεία/δεκάδα <input data-p="ppd" value="${esc(p.ppd)}" style="width:40px"></label><label>f του T_i (Hz) <input data-p="fti" value="${esc(p.fti)}" style="width:60px"></label>`
       :`<label>Συχνότητα του CP (Hz) <input data-p="f" value="${esc(p.f)}" style="width:70px"></label>`}</div>
      ${cab?`<h3>Μέσο</h3><div class="ld-row"><label>Επιστροφή <select data-d="medium">${MEDIUM.map(([k,l])=>`<option value="${k}" ${(d.medium||'earth')===k?'selected':''}>${esc(l)}</option>`).join('')}</select></label>
       <label>ρ (Ω·m) <input data-d="rho" value="${esc(d.rho??(d.medium==='sea'?0.2:100))}" style="width:60px"></label>
       <label title="Πρόσθετη αγωγιμότητα στη διαγώνιο· οι απώλειες της μόνωσης είναι ήδη στο tanδ">G (S/km) <input data-d="G" value="${esc(d.G??'')}" placeholder="0" style="width:64px"></label></div>
      <h3>Καλώδια <small class="muted">στρώματα από μέσα προς τα έξω· ακτίνες σε mm</small></h3>${cableTables(d)}<button data-addc>+ Καλώδιο</button>
     </div>
     <div class="ld-right">${cableDrawing(d)}<p class="small muted">Βρόχοι αγωγός–επόμενος αγωγός με συναρτήσεις Bessel (επιδερμικό φαινόμενο σε κάθε σωλήνα), επιστροφή από το έδαφος κατά Pollaczek ή από τη θάλασσα ως άπειρο μέσο. Οι αγωγοί με φάση 0 γειώνονται στα δύο άκρα (χωρίς μετάθεση θωρακίσεων). Τα ε_r και tanδ ισχύουν στα 50 Hz.</p></div>
    </div>`:`<h3>Έδαφος</h3><div class="ld-row"><label>ρ (Ω·m) <input data-d="rho" value="${esc(d.rho??100)}" style="width:60px"></label>
       <label>Επιστροφή <select data-d="earth">${EARTH.map(([k,l])=>`<option value="${k}" ${(d.earth||'carson')===k?'selected':''}>${esc(l)}</option>`).join('')}</select></label>
       <label><input type="checkbox" data-d="skin" ${d.skin===false?'':'checked'}> Επιδερμικό φαινόμενο</label><label title="Διαγώνιος του G των φάσεων, προεπιλογή 0,2·10⁻⁹ S/km (EMTP)">G (S/km) <input data-d="G" value="${esc(d.G??'')}" placeholder="0.2e-9" style="width:64px"></label></div>
      <h3>Αγωγοί (απλοί) <small class="muted">φάση 0 = αγωγός προστασίας· ίδια φάση = παράλληλοι</small></h3>${table(d.wires,WCOL,'w')}<button data-add="w">+ Αγωγός</button>
      <h3>Δέσμες (συμμετρικές)</h3>${table(d.bundles,BCOL,'b')}<button data-add="b">+ Δέσμη</button>
     </div>
     <div class="ld-right">${drawing(d)}<p class="small muted">Το μέσο ύψος είναι (2·h_μέσο + h_πύργου)/3. Οι αγωγοί της ίδιας φάσης ενώνονται, οι αγωγοί προστασίας γειώνονται σε κάθε πύργο.</p></div>
    </div>`}
    <div class="ld-actions"><button class="primary-ghost" data-run>Υπολογισμός</button><span class="small${status?.bad?' bad':''}" data-msg>${status?esc(status.t):P.tlmModel(p).err?'⚠ '+esc(P.tlmModel(p).err):'✓ Το μοντέλο είναι ενημερωμένο.'}</span></div>
    <div data-rep>${last?reportHTML(last,last.mdl,last.curves):''}</div></div></div>`;
   box.querySelector('[data-close]').onclick=close;box.onclick=e=>{if(e.target===box)close();};
   const saveData=()=>{status=null;ctx.editor.setParams(id,{data:JSON.stringify(d)});ctx.changed();};
   box.querySelectorAll('[data-t]').forEach(el=>el.onchange=()=>{const arr=el.dataset.t==='w'?d.wires:d.bundles,k=el.dataset.c,v=el.value.trim();
    if(k==='ymid'&&v===''){delete arr[+el.dataset.i].ymid;}else{const x=num(v);if(x===null){el.classList.add('bad');return;}arr[+el.dataset.i][k]=k==='ph'||k==='n'?Math.round(x):x;}el.classList.remove('bad');saveData();later();});
   box.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{const t=b.dataset.del[0],i=+b.dataset.del.slice(1);(t==='w'?d.wires:d.bundles).splice(i,1);saveData();later();});
   box.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{if(b.dataset.add==='w'){const l=d.wires[d.wires.length-1];d.wires.push(l?{...l,x:+l.x+2}:{ph:1,x:0,y:15,r:1,Rdc:0.1,tD:0.5});}
    else{const l=d.bundles[d.bundles.length-1];d.bundles.push(l?{...l,x:+l.x+8,ph:(+l.ph||0)+1}:{ph:1,x:0,y:15,n:2,R:20,ang:0,r:1.5,Rdc:0.06,tD:0.33});}saveData();later();});
   box.querySelectorAll('[data-d]').forEach(el=>el.onchange=()=>{const k=el.dataset.d;if(k==='skin')d.skin=el.checked;else if(k==='earth')d.earth=el.value;else if(k==='medium'){const was=d.medium||'earth';d.medium=el.value;if(el.value==='sea'&&was!=='sea')d.rho=0.2;else if(was==='sea'&&el.value!=='sea')d.rho=100;}else if(k==='G'){const x=num(el.value);if(el.value.trim()==='')delete d.G;else if(x!==null)d.G=x;}else{const x=num(el.value);if(x!==null)d[k]=x;}saveData();later();});
   box.querySelectorAll('[data-p]').forEach(el=>el.onchange=()=>{const k=el.dataset.p;let v=el.value;if(k!=='model'){const x=num(v);if(x===null){el.classList.add('bad');return;}v=x;}status=null;ctx.editor.setParams(id,{[k]:v});ctx.changed();later();});
   // cables: position, phases, layers (radii typed in mm, kept in m)
   box.querySelectorAll('[data-k]').forEach(el=>el.onchange=()=>{const i=+el.dataset.i,k=el.dataset.c,cb=d.cables[i],v=el.value.trim();
    if(el.dataset.k==='cab'){if(k==='ph'){const l=phList(v);if(!l.length){el.classList.add('bad');return;}cb.ph=l;}else{const x=num(v);if(x===null){el.classList.add('bad');return;}cb[k]=x;}}
    else{const l=cb.layers[+el.dataset.j];if(k==='t'){l.t=v;if(v==='c'){delete l.epsr;delete l.tand;l.rho=l.rho??1.72e-8;}else{delete l.rho;delete l.rin;l.epsr=l.epsr??2.3;}}
     else if(v===''&&(k==='mur'||k==='tand'||k==='rin'))delete l[k];
     else{const x=num(v);if(x===null||x<0){el.classList.add('bad');return;}l[k]=k==='rin'||k==='rout'?x/1000:x;}}
    el.classList.remove('bad');saveData();later();});
   box.querySelectorAll('[data-delc]').forEach(b=>b.onclick=()=>{d.cables.splice(+b.dataset.delc,1);saveData();later();});
   box.querySelectorAll('[data-dell]').forEach(b=>b.onclick=()=>{const [i,j]=b.dataset.dell.split(',').map(Number);d.cables[i].layers.splice(j,1);saveData();later();});
   box.querySelectorAll('[data-addl]').forEach(b=>b.onclick=()=>{const ls=d.cables[+b.dataset.addl].layers,l=ls[ls.length-1],r=l?+l.rout:0;
    ls.push(!l||(l.t||'c')==='i'?{t:'c',rout:r+0.002,rho:1.72e-8}:{t:'i',rout:r+0.004,epsr:2.3});saveData();later();});
   const addc=box.querySelector('[data-addc]');if(addc)addc.onclick=()=>{const l=d.cables[d.cables.length-1],M=Math.max(0,...d.cables.flatMap(c=>[].concat(c.ph??[]).map(Number)));
    const c=l?JSON.parse(JSON.stringify(l)):NEW_CABLE();if(l){c.x=+l.x+2*Math.max(...l.layers.map(q=>+q.rout||0));c.ph=[].concat(l.ph).map((v,k)=>k===0?M+1:+v);}else c.x=0;d.cables.push(c);saveData();later();};
   box.querySelector('[data-kind]').onchange=e=>{const want=e.target.value==='cab';if(want===isCable(d))return;d=want?EMPTY_CAB():EMPTY_OH();if(want)d.cables.push(NEW_CABLE());norm();saveData();later();};
   const pre=box.querySelector('[data-preset]');pre.onchange=()=>{if(!pre.value)return;d=pre.value==='empty'?(isCable(d)?EMPTY_CAB():EMPTY_OH()):JSON.parse(JSON.stringify(P.TLM_TYPICAL[pre.value]));
    norm();const L=d.length;ctx.editor.setParams(id,{data:JSON.stringify(d),...(L?{len:L}:{})});ctx.changed();later();};
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
