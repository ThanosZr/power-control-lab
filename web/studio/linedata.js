'use strict';
// "Δεδομένα γραμμής" (4.4, ROADMAP §26): the dialog of the part 'TLM', in the spirit of the EMTP Line/Cable Data.
// Overhead: conductor tables (single wires, symmetrical bundles; phase 0 = ground wire, eliminated), soil, a drawing of
// the tower head. Cables (4.5): per cable its position and its layers from the inside out (conductor / insulation), the
// phase of each conductor (0 = bonded and earthed at both ends), the medium (earth, sea, perfect), a drawing of the
// arrangement and of one cross-section. Then the model options and the report that /api/line_model returns
// (pcl/lineconst.py): sequence and modal parameters at one frequency, T_i, and for FD the fit of Z_c and A for every
// mode. No DOM outside the dialog.
// 4.11: tabs «Αγωγοί», «Μοντέλο», «Γραφήματα», «Πίνακες», «Εξαγωγή». Every parameter against frequency from /api/line_scan
// (pcl/linereport.py) in charts with logarithmic axes, a legend that hides curves, a cursor with the values, zoom by
// dragging; the matrices in three forms, the useful quantities, the Q-error tests, the field profiles; the exports
// (/api/line_export: report, CSV, JSON, .mat, the EMTP files, a Python script) and «Στην Python» (the link method `line`).
// The drawing is interactive: zoom with the wheel, pan, hover ↔ the row of the table, drag a conductor or a cable, a legend
// that hides groups, dimensions, materials, the side view of the span, settings that are remembered, SVG/PNG; overlays from
// the model: |E| and |B| maps (they scale with U and I), skin depths, the shape of each mode, the stress of the insulation.
// New data options: two-layer earth, μ_r of the earth, G per phase, segmented ground wires, transpositions, conductors by
// resistivity, GMR, unit reactance or Galloway–Wedepohl, cables in the air, semiconducting screens, the loss model of the
// insulation, lines from sequence data (constant or rebuilt) and Z′/Y′ tables from a MATLAB file.
(function(root){
 const P=root.Parts;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const ZI=[['tube','σωλήνας (Bessel)'],['gw','Galloway–Wedepohl'],['gmr','GMR (cm)'],['gmrr','GMR/r'],['xu','X μοναδιαίας απόστασης']];
 const ZIP={gw:['ns','εξωτερικά σύρματα'],gmr:['gmr','GMR (cm)'],gmrr:['gmrr','GMR/r'],xu:['xu','X (Ω/km) στο 1 m']};
 const WCOL=[['ph','Φάση','',40],['x','x (m)','',56],['y','Ύψος στον πύργο (m)','',58],['ymid','Ύψος στο μέσο (m)','κενό: όπως στον πύργο',58],['r','Ακτίνα (cm)','',54],['Rdc','R_dc (Ω/km)','κενό: από το ρ',62],
  ['rho','ρ (Ω·m)','αντί για R_dc (άφησε το R_dc κενό)',62],['tD','T/D','0,5 = συμπαγής',46],['mur','μ_r','',38],['alpha','α (1/K)','4.12: θερμικός συντελεστής της R στους 20 °C· κενό: 0,00403 (αλουμίνιο)',50]];
 const BCOL=[['ph','Φάση','',40],['x','x (m)','',56],['y','Ύψος στον πύργο (m)','',58],['ymid','Ύψος στο μέσο (m)','',58],['n','Αγωγοί','',38],['R','Ακτίνα δέσμης (cm)','απόσταση κέντρου–αγωγού',54],['ang','Γωνία (°)','πρώτου αγωγού',46],
  ['r','Ακτίνα αγωγού (cm)','',54],['Rdc','R_dc (Ω/km)','κενό: από το ρ',62],['rho','ρ (Ω·m)','αντί για R_dc',62],['tD','T/D','',46],['mur','μ_r','',38],['alpha','α (1/K)','κενό: 0,00403',50]];
 const MEDIUM=[['earth','Έδαφος (Pollaczek)'],['sea','Θάλασσα (άπειρο μέσο)'],['perfect','Τέλεια αγώγιμο μέσο']];
 // cable layers: conductor (radii in m in the data, mm in the table), insulation, semiconducting screen (merged into the insulation)
 const LCOL=[['rin','r_εσ (mm)','μόνο ο πρώτος αγωγός· οι άλλοι αρχίζουν εκεί που τελειώνει το προηγούμενο στρώμα',54],['rout','r_εξ (mm)','',54],
  ['rho','ρ (Ω·m)','αγωγός',62],['epsr','ε_r','μόνωση, στα 50 Hz',40],['tand','tanδ','μόνωση, στα 50 Hz',48],['mur','μ_r','',36]];
 // materials (4.11): a layer's `mat` fills its constants; the colour of the drawing comes from it
 const MATS={cu:{n:'Χαλκός',t:'c',rho:1.72e-8,col:'#c8742e'},al:{n:'Αλουμίνιο',t:'c',rho:2.83e-8,col:'#a9b3b8'},pb:{n:'Μόλυβδος',t:'c',rho:2.2e-7,col:'#6f7680'},
  steel:{n:'Χάλυβας (οπλισμός)',t:'c',rho:1.8e-7,mur:300,col:'#4d5358'},xlpe:{n:'XLPE',t:'i',epsr:2.3,tand:4e-4,col:'#f3efe2'},epr:{n:'EPR',t:'i',epsr:3,tand:2e-3,col:'#e9e0c8'},
  paper:{n:'Χαρτί–λάδι',t:'i',epsr:3.5,tand:3e-3,col:'#ead9a6'},pe:{n:'PE (μανδύας)',t:'i',epsr:2.3,tand:2e-4,col:'#2d3133'},pvc:{n:'PVC (μανδύας)',t:'i',epsr:4,tand:0.05,col:'#5a5f63'},
  semi:{n:'Ημιαγώγιμο',t:'s',epsr:2.3,col:'#3b3f42'}};
 const LAYT=[['c','αγωγός'],['i','μόνωση'],['s','ημιαγώγιμο']];
 const isCable=d=>Array.isArray(d.cables),isSeq=d=>!!d.seq,isFile=d=>!!d.zyfile,isOH=d=>!isCable(d)&&!isSeq(d)&&!isFile(d);
 const mm=v=>v==null||v===''?'':+(+v*1000).toPrecision(10);
 const phList=s=>String(s??'').split(/[\s,;]+/).filter(Boolean).map(v=>Math.round(+v)).filter(Number.isFinite);
 const EMPTY_OH=()=>({rho:100,earth:'carson',skin:true,wires:[],bundles:[]});
 const EMPTY_CAB=()=>({medium:'earth',rho:100,cables:[]});
 const EMPTY_SEQ=()=>({seq:{M:3,f:50,R0:0.32,L0:3.2,C0:0.0079,R1:0.03,L1:1.0,C1:0.0116,mode:'const'}});
 const NEW_CABLE=()=>JSON.parse(JSON.stringify(P.TLM_TYPICAL['150kV-land'].cables[0]));
 const EARTH=[['carson','Carson (σειρά, όπως το LINE CONSTANTS)'],['integral','Carson (ολοκλήρωμα, αριθμητικά)'],['deri','Μιγαδικό βάθος (Deri κ.ά.)'],['perfect','Τέλεια αγώγιμο έδαφος']];
 const PHC=['#7a8a86','#147966','#c47a1c','#2f5fa0','#b03a5b','#6b4fa0','#203a3f','#5b8a2f','#a0522d','#3a7ca5','#8a3a7c','#4a4a4a','#2a8a8a'];
 const SC=['#147966','#c47a1c','#2f5fa0','#b03a5b','#6b4fa0','#5b8a2f','#a0522d','#3a7ca5','#8a3a7c','#203a3f','#d1a000','#2a8a8a'];
 const num=v=>{const x=typeof v==='number'?v:P.parseEng(String(v??'').trim());return Number.isFinite(x)?x:null;};
 const fmt=(v,d=4)=>v==null||!Number.isFinite(+v)?'—':(Math.abs(v)>=1e5||(Math.abs(v)<1e-3&&v!==0))?(+v).toExponential(d-1):(+(+v).toPrecision(d)).toString();
 const SUP={'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
 const pow10=e=>'10'+String(e).split('').map(c=>SUP[c]||c).join('');
 const cfmt=(re,im,d=4)=>Math.abs(im)<=1e-12*Math.abs(re)?fmt(re,d):`${fmt(re,d)} ${im<0?'−':'+'} j${fmt(Math.abs(im),d)}`;
 const store={get(k,def){try{const v=localStorage.getItem('pcl-ld-'+k);return v==null?def:JSON.parse(v);}catch(e){return def;}},set(k,v){try{localStorage.setItem('pcl-ld-'+k,JSON.stringify(v));}catch(e){}}};

 // ---------------------------------------------------------------- the quantities of the scan (as pcl/linereport.py)
 const Q={phase:{t:'Φάσεις',q:{Z:['Z′ σειράς','Ω/km','mat'],Y:['Y′ εγκάρσια','S/km','mat'],Zc:['Z_c','Ω','mat'],Yc:['Y_c','S','mat'],H:['H = e^(−Γℓ)','','full']}},
  sym:{t:'Συμμετρικές συνιστώσες',q:{Z:['Z′ (0, 1, 2)','Ω/km','full'],Y:['Y′ (0, 1, 2)','S/km','full']}},
  modes:{t:'Ρυθμοί (σταθερός T_i)',q:{Zc:['Z_c','Ω'],alpha:['α','Np/km'],v:['v','km/s'],tau:['τ','μs'],A:['A = e^(−γℓ)',''],R:['R′','Ω/km'],L:['L′','mH/km'],G:['G′','μS/km'],C:['C′','nF/km'],beta:['β','rad/km']}},
  exact:{t:'Ρυθμοί (ακριβείς)',q:{Zc:['Z_c','Ω'],alpha:['α','Np/km'],v:['v','km/s'],tau:['τ','μs'],A:['A = e^(−γℓ)',''],R:['R′','Ω/km'],L:['L′','mH/km'],G:['G′','μS/km'],C:['C′','nF/km'],beta:['β','rad/km']}},
  ti:{t:'Σφάλμα του T_i',q:{qerr:['q-error',''],tierr:['απόκλιση στήλης (1 − |cos|)',''],ti:['T_i ακριβής (μέτρο στοιχείων)','']}},
  fit:{t:'Προσαρμογή FD',q:{Zc:['Z_c ακριβής και προσαρμογής','Ω'],A:['A ακριβής και προσαρμογής',''],err_zc:['σφάλμα Z_c (σχετικό)',''],err_a:['σφάλμα A (απόλυτο)','']}}};
 // one value of a JSON complex array or a real one, at the index path
 const at=(a,ix)=>{let v=a;for(const i of ix)v=v?.[i];return v;};
 function pick(o,ix){if(o&&o.re!==undefined)return [at(o.re,ix),at(o.im,ix)];return [at(o,ix),null];}
 // [{name, unit, re[], im[]|null}] over the frequencies
 function seriesOf(sc,dom,qty){const M=sc.M,nf=sc.f.length,[title,unit,kind]=Q[dom].q[qty],out=[];
  const col=(o,ix)=>{const re=new Array(nf),im=o&&o.re!==undefined?new Array(nf):null;for(let i=0;i<nf;i++){const [a,b]=pick(o,[i,...ix]);re[i]=a;if(im)im[i]=b;}return {re,im};};
  if(dom==='phase'||dom==='sym'){if(dom==='sym'&&!sc.S)return out;const A=dom==='sym'?sc.S[qty]:sc[qty],lab=k=>dom==='sym'?'012'[k%3]+(M>3?`(${Math.floor(k/3)+1})`:''):String(k+1);
   for(let i=0;i<M;i++)for(let j=0;j<M;j++){if(kind==='mat'&&j<i)continue;out.push({name:`${lab(i)},${lab(j)}`,unit,...col(A,[i,j]),el:[i,j]});}}
  else if(dom==='modes'||dom==='exact'){for(let k=0;k<M;k++)out.push({name:`ρυθμός ${k+1}`,unit,...col(sc[dom][qty],[k]),el:[k]});}
  else if(dom==='ti'){if(qty==='qerr')out.push({name:'q-error',unit,re:sc.qerr.slice(),im:null});
   else if(qty==='tierr')for(let k=0;k<M;k++)out.push({name:`ρυθμός ${k+1}`,unit,...col(sc.tierr,[k]),el:[k]});
   else for(let r=0;r<M;r++)for(let k=0;k<M;k++)out.push({name:`T(${r+1},${k+1})`,unit,...col(sc.Tex,[r,k]),el:[r,k]});}
  else if(dom==='fit'&&sc.fit){sc.fit.forEach((m,k)=>{if(qty==='Zc'||qty==='A'){const a=m[qty],b=m[qty+'_fit'];
    out.push({name:`ρυθμός ${k+1} ακριβές`,unit,re:a.re.slice(),im:a.im.slice(),el:[k]});out.push({name:`ρυθμός ${k+1} προσαρμογή`,unit,re:b.re.slice(),im:b.im.slice(),el:[k],dash:true,mate:out.length-1});}
   else out.push({name:`ρυθμός ${k+1}`,unit,re:m[qty].slice(),im:null,el:[k]});});}
  return out;}
 const FORMS=[['mag','|x|'],['ang','∠x (°)'],['re','Re'],['im','Im']];
 function valOf(s,form){if(!s.im)return s.re;const n=s.re.length,y=new Array(n);for(let i=0;i<n;i++){const a=s.re[i],b=s.im[i];y[i]=form==='ang'?Math.atan2(b,a)*180/Math.PI:form==='re'?a:form==='im'?b:Math.hypot(a,b);}return y;}

 // ---------------------------------------------------------------- an interactive chart (SVG, inline styles so that it exports)
 function niceStep(r){const e=Math.floor(Math.log10(r/5)),b=10**e,m=r/5/b;return (m<1.5?1:m<3.5?2:m<7.5?5:10)*b;}
 function chartSVG(st){const W=st.W||640,H=st.H||290,ML=62,MR=14,MT=20,MB=34,xs=st.x,on=st.series.filter(s=>!s.off);
  const xl=st.xlog!==false,tx=v=>xl?Math.log10(v):v;let x0=st.x0??Math.min(...xs),x1=st.x1??Math.max(...xs);if(x1<=x0)x1=x0+1;
  const ix=[];for(let i=0;i<xs.length;i++)if(xs[i]>=x0-1e-12*Math.abs(x0)&&xs[i]<=x1+1e-12*Math.abs(x1))ix.push(i);
  const all=on.flatMap(s=>ix.map(i=>s.y[i])).filter(Number.isFinite),pos=all.length&&all.every(v=>v>0);
  const ylog=st.ylog==='auto'?pos&&Math.max(...all)/Math.min(...all)>30:!!st.ylog&&pos;st.ylogUsed=ylog;
  let y0,y1;if(!all.length){y0=0;y1=1;}else if(ylog){y0=Math.log10(Math.min(...all));y1=Math.log10(Math.max(...all));if(y1-y0>14)y0=y1-14;if(y1-y0<0.3){y0-=0.15;y1+=0.15;}}
  else{y0=Math.min(...all);y1=Math.max(...all);if(st.refs)for(const r of st.refs){y1=Math.max(y1,r.y);}if(y1-y0<1e-12*Math.max(1,Math.abs(y1))){y0-=0.5*Math.abs(y0||1);y1+=0.5*Math.abs(y1||1);}const pad=(y1-y0)*0.05;y0-=pad;y1+=pad;if(st.zero!==false&&all.every(v=>v>=0)&&y0<0)y0=0;}
  if(st.yr&&st.yr.log===ylog&&st.yr[1]>st.yr[0]){y0=st.yr[0];y1=st.yr[1];}   // 4.12: a zoom on y (Shift+drag)
  const X=v=>ML+(tx(v)-tx(x0))/(tx(x1)-tx(x0))*(W-ML-MR),Y=v=>{const t=ylog?Math.log10(Math.max(v,10**(y0-1))):v;return H-MB-(t-y0)/(y1-y0)*(H-MB-MT);};
  st.map={X,Y,ML,MR,MT,MB,W,H,x0,x1,ix,ylog,xl,y0,y1,invY:py=>y0+(H-MB-py)/(H-MB-MT)*(y1-y0),inv:px=>{const t=tx(x0)+(px-ML)/(W-ML-MR)*(tx(x1)-tx(x0));return xl?10**t:t;}};
  const F='font-family="system-ui,sans-serif"';let s=`<svg xmlns="http://www.w3.org/2000/svg" class="ld-chart" viewBox="0 0 ${W} ${H}" ${F} font-size="10.5">`;
  s+=`<rect x="0" y="0" width="${W}" height="${H}" fill="#fff"/>`;
  if(st.title)s+=`<text x="${ML}" y="13" font-size="11.5" font-weight="600" fill="#203a3f">${esc(st.title)}</text>`;
  // x grid
  if(xl){for(let e=Math.floor(tx(x0));e<=Math.ceil(tx(x1));e++){for(let m=1;m<10;m++){const v=m*10**e;if(v<x0||v>x1)continue;const px=X(v).toFixed(1);
    s+=`<line x1="${px}" x2="${px}" y1="${MT}" y2="${H-MB}" stroke="${m===1?'#d7e2de':'#eef3f1'}"/>`;if(m===1)s+=`<text x="${px}" y="${H-MB+14}" text-anchor="middle" fill="#4a5c58">${pow10(e)}</text>`;}}}
  else{const stp=niceStep(x1-x0);for(let v=Math.ceil(x0/stp)*stp;v<=x1+1e-9*stp;v+=stp){const px=X(v).toFixed(1);s+=`<line x1="${px}" x2="${px}" y1="${MT}" y2="${H-MB}" stroke="#e6eeea"/><text x="${px}" y="${H-MB+14}" text-anchor="middle" fill="#4a5c58">${fmt(v,4)}</text>`;}}
  // y grid
  if(ylog){const sp=Math.max(1,Math.ceil((y1-y0)/7));for(let e=Math.ceil(y0);e<=Math.floor(y1);e+=sp){const py=Y(10**e).toFixed(1);s+=`<line x1="${ML}" x2="${W-MR}" y1="${py}" y2="${py}" stroke="#e1e9e6"/><text x="${ML-4}" y="${+py+3.5}" text-anchor="end" fill="#4a5c58">${pow10(e)}</text>`;}}
  else{const stp=niceStep(y1-y0);for(let v=Math.ceil(y0/stp)*stp;v<=y1+1e-9*stp;v+=stp){const py=Y(v).toFixed(1);s+=`<line x1="${ML}" x2="${W-MR}" y1="${py}" y2="${py}" stroke="#e6eeea"/><text x="${ML-4}" y="${+py+3.5}" text-anchor="end" fill="#4a5c58">${fmt(Math.abs(v)<stp*1e-9?0:v,4)}</text>`;}}
  s+=`<rect x="${ML}" y="${MT}" width="${W-ML-MR}" height="${H-MB-MT}" fill="none" stroke="#9fb2ad"/>`;
  s+=`<text x="${W-MR}" y="${H-6}" text-anchor="end" fill="#4a5c58">${esc(st.xlab||'f (Hz)')}</text><text x="12" y="${(MT+H-MB)/2}" fill="#4a5c58" transform="rotate(-90 12 ${(MT+H-MB)/2})" text-anchor="middle">${esc(st.ylab||'')}</text>`;
  if(st.refs)for(const r of st.refs){if(!ylog||r.y>0){const py=Y(r.y).toFixed(1);s+=`<line x1="${ML}" x2="${W-MR}" y1="${py}" y2="${py}" stroke="${r.c||'#b03a5b'}" stroke-dasharray="6 4"/><text x="${W-MR-4}" y="${+py-4}" text-anchor="end" fill="${r.c||'#b03a5b'}">${esc(r.t)}</text>`;}}
  s+=`<defs><clipPath id="${st.id}c"><rect x="${ML}" y="${MT}" width="${W-ML-MR}" height="${H-MB-MT}"/></clipPath></defs><g clip-path="url(#${st.id}c)">`;
  for(const q of on){let d='',pen=false;for(const i of ix){const v=q.y[i];if(!Number.isFinite(v)||(ylog&&v<=0)){pen=false;continue;}d+=(pen?'L':'M')+X(xs[i]).toFixed(1)+','+Y(v).toFixed(1);pen=true;}
   s+=`<path d="${d}" fill="none" stroke="${q.color}" stroke-width="${q.w||1.6}" ${q.dash?'stroke-dasharray="5 3"':''}/>`;}
  return s+`</g><g class="ld-cur" style="display:none"><line y1="${MT}" y2="${H-MB}" stroke="#203a3f" stroke-dasharray="2 2"/></g><rect class="ld-zoom" y="${MT}" height="${H-MB-MT}" fill="#14796622" style="display:none"/></svg>`;}
 // mounts a chart in el: st = {id, x, series:[{name, y, color, dash, off}], xlab, ylab, ylog ('auto'|true|false), xlog, title, refs}
 function mountChart(el,st,onCsv){const draw=()=>{el.innerHTML=`<div class="ld-ctool"><button data-ylog title="Λογαριθμικός ή γραμμικός άξονας y">${st.ylog==='auto'?'y: αυτόματα':st.ylog?'y: λογ.':'y: γραμμ.'}</button>`+
   `<button data-back title="Το προηγούμενο ζουμ (4.12)">↶</button><button data-reset title="Όλο το εύρος (και διπλό κλικ)">⤢ Όλο</button><button data-svg>SVG</button><button data-png>PNG</button><button data-csv>CSV</button><span class="small muted" data-read></span></div>`+
   `<div class="ld-cbox">${chartSVG(st)}<div class="ld-ctip" style="display:none"></div></div><div class="ld-cleg">`+st.series.map((q,k)=>`<span data-s="${k}" class="${q.off?'off':''}" title="Κλικ: κρύψε/δείξε· Shift+κλικ: μόνο αυτή"><i style="background:${q.color};${q.dash?'background:repeating-linear-gradient(90deg,'+q.color+' 0 4px,transparent 4px 6px)':''}"></i>${esc(q.name)}</span>`).join('')+'</div>';wire();};
  const wire=()=>{const svg=el.querySelector('svg'),m=st.map,tip=el.querySelector('.ld-ctip'),cur=svg.querySelector('.ld-cur'),zr=svg.querySelector('.ld-zoom');
   const px=e=>{const r=svg.getBoundingClientRect();return (e.clientX-r.left)/r.width*m.W;},py=e=>{const r=svg.getBoundingClientRect();return (e.clientY-r.top)/r.height*m.H;};let z0=null,zy0=null,zmode='x';
   // 4.12: the same zoom as the scope: drag on x, Shift+drag on y, Ctrl+drag a rectangle, ↶ the previous one
   const push=()=>{(st.hist=st.hist||[]).push([st.x0,st.x1,st.yr]);if(st.hist.length>40)st.hist.shift();};
   svg.onmousemove=e=>{const x=px(e),y=py(e);if(z0!=null){if(zmode!=='y'){zr.setAttribute('x',Math.min(z0,x));zr.setAttribute('width',Math.abs(x-z0));}if(zmode!=='x'){zr.setAttribute('y',Math.min(zy0,y));zr.setAttribute('height',Math.abs(y-zy0));}}
    if(x<m.ML||x>m.W-m.MR){cur.style.display='none';tip.style.display='none';return;}const f=m.inv(x);let bi=m.ix[0],bd=Infinity;for(const i of m.ix){const dd=m.xl?Math.abs(Math.log(st.x[i]/f)):Math.abs(st.x[i]-f);if(dd<bd){bd=dd;bi=i;}}
    const cx=m.X(st.x[bi]);cur.style.display='';cur.firstChild.setAttribute('x1',cx);cur.firstChild.setAttribute('x2',cx);
    const rows=st.series.map((q,k)=>q.off?'':`<div><i style="background:${q.color}"></i>${esc(q.name)}: <b>${fmt(q.y[bi],5)}</b></div>`).join('');
    tip.innerHTML=`<div><b>${esc(st.xlab?.split(' ')[0]||'f')} = ${fmt(st.x[bi],5)}</b></div>`+rows;tip.style.display='';const r=svg.getBoundingClientRect(),left=(cx/m.W)*r.width;
    tip.style.left=(left>r.width*0.6?left-tip.offsetWidth-10:left+10)+'px';tip.style.top='6px';el.querySelector('[data-read]').textContent='';};
   svg.onmouseleave=()=>{cur.style.display='none';tip.style.display='none';};
   svg.onmousedown=e=>{z0=px(e);zy0=py(e);zmode=e.ctrlKey||e.metaKey?'xy':e.shiftKey?'y':'x';zr.style.display='';
    zr.setAttribute('x',zmode==='y'?m.ML:z0);zr.setAttribute('width',zmode==='y'?m.W-m.ML-m.MR:0);zr.setAttribute('y',zmode==='x'?m.MT:zy0);zr.setAttribute('height',zmode==='x'?m.H-m.MT-m.MB:0);e.preventDefault();};
   svg.onmouseup=e=>{if(z0==null)return;const x=px(e),y=py(e),a=Math.min(z0,x),b=Math.max(z0,x),c=Math.min(zy0,y),d=Math.max(zy0,y),mode=zmode;z0=null;zr.style.display='none';
    zr.setAttribute('y',m.MT);zr.setAttribute('height',m.H-m.MT-m.MB);
    const okx=b-a>=6,oky=d-c>=6;if(!(mode==='x'?okx:mode==='y'?oky:okx&&oky))return;push();
    if(mode!=='y'){st.x0=m.inv(Math.max(a,m.ML));st.x1=m.inv(Math.min(b,m.W-m.MR));}
    if(mode!=='x'){const lo=m.invY(Math.min(d,m.H-m.MB)),hi=m.invY(Math.max(c,m.MT));st.yr=[lo,hi];st.yr.log=m.ylog;}draw();};
   svg.ondblclick=()=>{push();st.x0=st.x1=undefined;st.yr=null;draw();};
   el.querySelector('[data-reset]').onclick=()=>{push();st.x0=st.x1=undefined;st.yr=null;draw();};
   el.querySelector('[data-back]').onclick=()=>{const h=st.hist?.pop();if(!h)return;[st.x0,st.x1,st.yr]=h;draw();};
   el.querySelector('[data-ylog]').onclick=()=>{st.ylog=st.ylog==='auto'?!st.ylogUsed:st.ylog?false:'auto';draw();};
   el.querySelectorAll('[data-s]').forEach(sp=>sp.onclick=e=>{const k=+sp.dataset.s;if(e.shiftKey)st.series.forEach((q,j)=>q.off=j!==k&&q.mate!==k&&st.series[k].mate!==j);else{st.series[k].off=!st.series[k].off;}if(st.onToggle)st.onToggle(st.series);draw();});
   el.querySelector('[data-svg]').onclick=()=>download((st.file||'chart')+'.svg',svgText(svg),'image/svg+xml');
   el.querySelector('[data-png]').onclick=()=>svgPng(svg,(st.file||'chart')+'.png');
   el.querySelector('[data-csv]').onclick=()=>{const on=st.series.filter(q=>!q.off),rows=[[st.xlab||'f (Hz)',...on.map(q=>q.name+(st.ylab?' ['+st.ylab+']':''))].map(csvq).join(',')];
    for(let i=0;i<st.x.length;i++)rows.push([st.x[i],...on.map(q=>q.y[i])].map(v=>Number.isFinite(v)?(+v).toPrecision(10):'').join(','));download((st.file||'chart')+'.csv',rows.join('\n')+'\n','text/csv');};};
  draw();return {redraw:draw,st};}
 const csvq=h=>/[",\n]/.test(h)?'"'+h.replace(/"/g,'""')+'"':h;
 const svgText=svg=>{const c=svg.cloneNode(true);c.querySelectorAll('.ld-cur,.ld-zoom').forEach(n=>n.remove());c.setAttribute('xmlns','http://www.w3.org/2000/svg');return '<?xml version="1.0" encoding="UTF-8"?>\n'+c.outerHTML;};
 function svgPng(svg,name,scale=2){const vb=svg.viewBox.baseVal,img=new Image(),txt=svgText(svg);img.onload=()=>{const cv=document.createElement('canvas');cv.width=vb.width*scale;cv.height=vb.height*scale;
   const g=cv.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,cv.width,cv.height);g.drawImage(img,0,0,cv.width,cv.height);cv.toBlob(b=>b&&download(name,b,'image/png'));};
  img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(txt);}
 function download(name,data,mime){const blob=data instanceof Blob?data:new Blob([data],{type:mime||'application/octet-stream'});const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);}
 const b64blob=(b64,mime)=>{const s=atob(b64),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return new Blob([u],{type:mime});};

 // ---------------------------------------------------------------- the drawing
 // the conductors that will be drawn (bundles expanded, the same order as pcl.lineconst.conductors), heights at the tower
 const rhoOf=w=>{const r=(+w.r||1)/100,tD=+w.tD||0.5,q=r*(1-2*tD);return w.rho!=null&&w.rho!==''&&(w.Rdc==null||w.Rdc==='')?+w.rho:(+w.Rdc||0)/1000*Math.PI*(r*r-q*q);};
 function expand(d){const out=[];(d.wires||[]).forEach((w,i)=>out.push({x:+w.x,y:+w.y,r:(+w.r||1)/100,ph:+w.ph||0,lab:'W'+(i+1),src:'w'+i,ym:w.ymid==null||w.ymid===''?+w.y:+w.ymid,rc:rhoOf(w),mur:+w.mur||1}));
  (d.bundles||[]).forEach((b,i)=>{const n=Math.max(1,Math.round(+b.n||1)),R=(+b.R||0)/100,a0=(+b.ang||0)*Math.PI/180,sag=b.ymid==null||b.ymid===''?0:+b.y-+b.ymid;
   for(let k=0;k<n;k++){const a=a0+2*Math.PI*k/n,dy=n>1?R*Math.sin(a):0;out.push({x:+b.x+(n>1?R*Math.cos(a):0),y:+b.y+dy,r:(+b.r||1)/100,ph:+b.ph||0,lab:k?'':'B'+(i+1),src:'b'+i,sub:k,ym:+b.y+dy-sag,bc:[+b.x,+b.y,R],rc:rhoOf(b),mur:+b.mur||1});}});return out;}
 const VIEW_DEF={dims:true,labels:true,legend:true,grid:false,minsize:true,layers:true,side:true,ov:'none',U:400,I:1000,f:50,mode:1};
 const VIEW=Object.assign({},VIEW_DEF,store.get('view',{}));
 const saveView=()=>store.set('view',VIEW);
 // viridis-like colour scale
 const CMAP=[[68,1,84],[59,82,139],[33,145,140],[94,201,98],[253,231,37]];
 const cmap=t=>{t=Math.max(0,Math.min(1,t))*(CMAP.length-1);const i=Math.min(CMAP.length-2,Math.floor(t)),u=t-i,a=CMAP[i],b=CMAP[i+1];return [0,1,2].map(k=>Math.round(a[k]+(b[k]-a[k])*u));};
 // a field map as a data URL (canvas), cached by its data and scale
 const mapCache=new Map();
 function mapImage(F,which,scale){const key=which+'|'+F.gx.length+'|'+F.gy.length+'|'+F.Emap[0][3]+'|'+scale;if(mapCache.has(key))return mapCache.get(key);
  if(typeof document==='undefined')return null;const A=F[which==='E'?'Emap':'Bmap'],ny=A.length,nx=A[0].length,cv=document.createElement('canvas');cv.width=nx;cv.height=ny;const g=cv.getContext('2d'),img=g.createImageData(nx,ny);
  const vals=A.flat().filter(Number.isFinite).sort((a,b)=>a-b),top=(vals[Math.floor(vals.length*0.97)]||1)*scale;   // the singular points saturate
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const v=A[ny-1-j][i]*scale,t=Math.log10(1+9*v/top),c=cmap(t),o=4*(j*nx+i);img.data[o]=c[0];img.data[o+1]=c[1];img.data[o+2]=c[2];img.data[o+3]=Math.round(35+185*t);}
  g.putImageData(img,0,0);const out={url:cv.toDataURL(),max:top};if(mapCache.size>12)mapCache.clear();mapCache.set(key,out);return out;}
 // the overhead scene in pixels for the view {cx, cy, s (px/m)}; ov = {fields, Ti, f}
 function ohSVG(d,view,W,H,ov,hide,sel){const cs=expand(d).filter(c=>Number.isFinite(c.x)&&Number.isFinite(c.y));
  const X=x=>W/2+(x-view.cx)*view.s,Y=y=>H/2-(y-view.cy)*view.s,g=Y(0);
  let s=`<svg xmlns="http://www.w3.org/2000/svg" class="ld-svg ld-draw" viewBox="0 0 ${W} ${H}" font-family="system-ui,sans-serif" font-size="9.5"><rect width="${W}" height="${H}" fill="#f7fbfd"/>`;
  // earth: one or two layers
  const two=d.rho2!=null&&d.rho2!==''&&+d.dsoil>0;
  if(!hide.has('soil')){s+=`<rect x="0" y="${Math.max(0,g)}" width="${W}" height="${Math.max(0,H-g)}" fill="#e9e1cc"/>`;
   if(two&&VIEW.layers){const gb=Y(-(+d.dsoil));s+=`<rect x="0" y="${gb}" width="${W}" height="${Math.max(0,H-gb)}" fill="#d9cfb2"/><line x1="0" x2="${W}" y1="${gb}" y2="${gb}" stroke="#a8996f" stroke-dasharray="4 3"/>`+
    `<text x="6" y="${gb-3}" fill="#6d6040">ρ₁ = ${fmt(+d.rho)} Ω·m · d = ${fmt(+d.dsoil)} m</text><text x="6" y="${gb+11}" fill="#6d6040">ρ₂ = ${fmt(+d.rho2)} Ω·m</text>`;}
   else s+=`<text x="6" y="${g+12}" fill="#6d6040">ρ = ${fmt(+d.rho)} Ω·m${+d.mur_e>1?' · μ_r = '+fmt(+d.mur_e):''}</text>`;}
  s+=`<line x1="0" x2="${W}" y1="${g}" y2="${g}" stroke="#8a7b55" stroke-width="1.5"/>`;
  if(VIEW.grid){const st=niceStep(Math.max(W,H)/view.s/2);for(let v=Math.ceil((view.cx-W/2/view.s)/st)*st;v<view.cx+W/2/view.s;v+=st)s+=`<line x1="${X(v)}" x2="${X(v)}" y1="0" y2="${H}" stroke="#dde8e5" stroke-width="0.6"/>`;
   for(let v=Math.ceil((view.cy-H/2/view.s)/st)*st;v<view.cy+H/2/view.s;v+=st)s+=`<line x1="0" x2="${W}" y1="${Y(v)}" y2="${Y(v)}" stroke="#dde8e5" stroke-width="0.6"/>`;}
  // overlays under the conductors
  const F=ov.fields;let bar='';
  if((VIEW.ov==='E'||VIEW.ov==='B')&&F){const sc=VIEW.ov==='E'?VIEW.U/F.U:VIEW.I/F.I,im=mapImage(F,VIEW.ov,sc);if(im){const gx=F.gx,gy=F.gy,x0=X(gx[0]),x1=X(gx[gx.length-1]),y1=Y(gy[0]),y0=Y(gy[gy.length-1]);
    s+=`<image href="${im.url}" x="${x0}" y="${y0}" width="${x1-x0}" height="${y1-y0}" preserveAspectRatio="none"/>`;
    bar=`<g transform="translate(${W-150},8)"><rect width="140" height="40" rx="4" fill="#ffffffdd"/><text x="70" y="12" text-anchor="middle">|${VIEW.ov}| (λογαριθμική κλίμακα)</text>`+[0,1,2,3,4,5,6,7,8,9].map(k=>{const c=cmap(k/9);return `<rect x="${6+k*12.8}" y="17" width="12.8" height="8" fill="rgb(${c})"/>`;}).join('')+
     `<text x="6" y="36">0</text><text x="134" y="36" text-anchor="end">≥ ${fmt(im.max,3)} ${VIEW.ov==='E'?'kV/m':'μT'}</text></g>`+
     `<text x="6" y="14" fill="#203a3f">${VIEW.ov==='E'?'U = '+fmt(VIEW.U)+' kV':'I = '+fmt(VIEW.I)+' A'} · ύψη στον πύργο</text>`;}}
  if(VIEW.ov==='skin'){const f=+VIEW.f||50,de=503.29*Math.sqrt((+d.rho||100)/f),gy=Y(-de);
   s+=`<line x1="0" x2="${W}" y1="${gy}" y2="${gy}" stroke="#2f5fa0" stroke-dasharray="6 3"/><text x="${W-6}" y="${gy-3}" text-anchor="end" fill="#2f5fa0">βάθος διείσδυσης ${fmt(de,3)} m στα ${fmt(f)} Hz</text>`;}
  // dimensions: heights and horizontal spacings of the objects (wires and bundle centres)
  const objs=[...(d.wires||[]).map((w,i)=>({x:+w.x,y:+w.y,ph:+w.ph||0,src:'w'+i})),...(d.bundles||[]).map((b,i)=>({x:+b.x,y:+b.y,ph:+b.ph||0,src:'b'+i}))].filter(o=>Number.isFinite(o.x)&&Number.isFinite(o.y)&&!hide.has('ph'+o.ph));
  if(VIEW.dims&&objs.length){const xs=[...new Set(objs.map(o=>+o.x.toFixed(3)))].sort((a,b)=>a-b);
   for(const o of objs){s+=`<line x1="${X(o.x)}" x2="${X(o.x)}" y1="${g}" y2="${Y(o.y)}" stroke="#7a8a86" stroke-width="0.6" stroke-dasharray="2 3"/>`;}
   const yd=g+22;for(let k=1;k<xs.length;k++){const a=X(xs[k-1]),b=X(xs[k]);if(b-a<18)continue;s+=`<line x1="${a}" x2="${b}" y1="${yd}" y2="${yd}" stroke="#4a5c58" stroke-width="0.7" marker-start="url(#ldar)" marker-end="url(#ldar)"/><text x="${(a+b)/2}" y="${yd-3}" text-anchor="middle" fill="#4a5c58">${fmt(xs[k]-xs[k-1],3)} m</text>`;}
   const hs=[...new Set(objs.map(o=>+o.y.toFixed(3)))].sort((a,b)=>a-b),xr=X(Math.max(...objs.map(o=>o.x)))+26;
   for(const h of hs)s+=`<line x1="${xr-4}" x2="${xr+4}" y1="${Y(h)}" y2="${Y(h)}" stroke="#4a5c58"/><text x="${xr+6}" y="${Y(h)+3}" fill="#4a5c58">${fmt(h,4)} m</text>`;
   s+=`<line x1="${xr}" x2="${xr}" y1="${g}" y2="${Y(Math.max(...hs))}" stroke="#4a5c58" stroke-width="0.6"/>`;}
  s+=`<defs><marker id="ldar" viewBox="0 0 6 6" refX="3" refY="3" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0L6,3L0,6z" fill="#4a5c58"/></marker></defs>`;
  // bundle circles, conductors
  for(const b of (d.bundles||[]).map((b,i)=>({...b,i})))if(+b.n>1&&!hide.has('ph'+(+b.ph||0)))s+=`<circle cx="${X(+b.x)}" cy="${Y(+b.y)}" r="${Math.max(4,(+b.R||0)/100*view.s)}" fill="none" stroke="${PHC[(+b.ph||0)%PHC.length]}" stroke-width="0.6" stroke-dasharray="2 2"/>`;
  const Ti=ov.Ti,mk=VIEW.mode-1;
  cs.forEach((c,ci)=>{if(hide.has('ph'+c.ph))return;const rr=VIEW.minsize?Math.max(3.5,c.r*view.s):Math.max(0.6,c.r*view.s),col=PHC[c.ph%PHC.length],on=sel===c.src;
   s+=`<circle data-ci="${ci}" data-src="${c.src}" cx="${X(c.x).toFixed(1)}" cy="${Y(c.y).toFixed(1)}" r="${rr.toFixed(1)}" fill="${col}" stroke="${on?'#111':'#fff'}" stroke-width="${on?1.6:0.6}" style="cursor:grab"/>`;
   if(VIEW.ov==='skin'&&c.rc>0&&c.r*view.s>8){const de=Math.sqrt(c.rc/(Math.PI*(+VIEW.f||50)*4e-7*Math.PI*c.mur));if(de<c.r)s+=`<circle cx="${X(c.x).toFixed(1)}" cy="${Y(c.y).toFixed(1)}" r="${((c.r-de)*view.s).toFixed(1)}" fill="none" stroke="#fff" stroke-dasharray="2 2"><title>βάθος διείσδυσης ${fmt(de*1000,3)} mm</title></circle>`;}
   if(c.lab&&VIEW.labels)s+=`<text x="${(X(c.x)+rr+2).toFixed(1)}" y="${(Y(c.y)-rr-2).toFixed(1)}" fill="#203a3f">${esc(c.lab)}${c.ph?'':' (γ)'}</text>`;});
  // the shape of a mode: the column k of T_i on the conductors of each phase
  if(VIEW.ov==='mode'&&Ti&&Ti[0]&&mk<Ti[0].length){const mx=Math.max(...Ti.map(r=>Math.abs(r[mk])))||1;
   for(const o of objs){if(!(o.ph>0)||o.ph>Ti.length)continue;const v=Ti[o.ph-1][mk],L=v/mx*40,x=X(o.x),y=Y(o.y);
    s+=`<line x1="${x}" x2="${x}" y1="${y}" y2="${y-L}" stroke="${v>=0?'#147966':'#b03a5b'}" stroke-width="3" marker-end="url(#ldar)"/><text x="${x+5}" y="${y-L/2}" fill="${v>=0?'#147966':'#b03a5b'}" font-weight="600">${fmt(v,3)}</text>`;}
   s+=`<text x="6" y="14" fill="#203a3f" font-weight="600">Ρυθμός ${mk+1}: στήλη ${mk+1} του T_i (ρεύματα φάσεων)</text>`;}
  return s+bar+`<text x="${W-6}" y="${H-6}" text-anchor="end" fill="#4a5c58">1 m = ${fmt(view.s,3)} px</text></svg>`;}
 // the span from the side: tower height, midspan, the average height (2·h_μέσο + h_πύργου)/3
 function sideSVG(d){const objs=[...(d.wires||[]),...(d.bundles||[])].filter(o=>Number.isFinite(+o.y));if(!objs.length)return '';
  const W=360,H=120,hmax=Math.max(...objs.map(o=>+o.y))*1.1||1,Y=y=>H-14-y/hmax*(H-24);let s=`<svg xmlns="http://www.w3.org/2000/svg" class="ld-svg ld-side" viewBox="0 0 ${W} ${H}" font-family="system-ui,sans-serif" font-size="9"><rect width="${W}" height="${H}" fill="#f7fbfd"/><rect y="${Y(0)}" width="${W}" height="14" fill="#e9e1cc"/>`;
  s+=`<rect x="14" y="${Y(hmax/1.1)}" width="5" height="${Y(0)-Y(hmax/1.1)}" fill="#9fb2ad"/><rect x="${W-19}" y="${Y(hmax/1.1)}" width="5" height="${Y(0)-Y(hmax/1.1)}" fill="#9fb2ad"/>`;
  const seen=new Set();for(const o of objs){const yt=+o.y,ym=o.ymid==null||o.ymid===''?yt:+o.ymid,k=yt+'|'+ym+'|'+(+o.ph||0);if(seen.has(k))continue;seen.add(k);
   const a=19,b=W-19,c=PHC[(+o.ph||0)%PHC.length],mid=(a+b)/2,av=(2*ym+yt)/3;
   s+=`<path d="M${a},${Y(yt)} Q${mid},${2*Y(ym)-Y(yt)} ${b},${Y(yt)}" fill="none" stroke="${c}" stroke-width="1.3"/><line x1="${a}" x2="${b}" y1="${Y(av)}" y2="${Y(av)}" stroke="${c}" stroke-dasharray="3 3" stroke-width="0.6"/>`;}
  const o=objs.find(q=>q.ymid!=null&&q.ymid!=='')||objs[0],yt=+o.y,ym=o.ymid==null||o.ymid===''?yt:+o.ymid;
  s+=`<text x="24" y="${Y(yt)-3}" fill="#203a3f">${fmt(yt,4)} m στον πύργο</text><text x="${W/2}" y="${Y(ym)+11}" text-anchor="middle" fill="#203a3f">${fmt(ym,4)} m στο μέσο · βέλος ${fmt(yt-ym,3)} m</text>`+
   `<text x="${W-24}" y="${Y((2*ym+yt)/3)-3}" text-anchor="end" fill="#4a5c58">μέσο ύψος ${fmt((2*ym+yt)/3,4)} m</text></svg>`;return s;}
 // cables: the arrangement (below the surface, in the sea or in the air) and the cross-section of the selected cable
 const layerCol=(l,ph,ci)=>l.mat&&MATS[l.mat]?MATS[l.mat].col:(l.t||'c')==='c'?PHC[(+ph[ci]||0)%PHC.length]:(l.t==='s'?'#3b3f42':'#f4f1e8');
 function cabSVG(d,view,W,H,hide,sel){const cs=(d.cables||[]).map((c,i)=>({...c,i})).filter(c=>Number.isFinite(+c.x)&&Number.isFinite(+c.y));
  const sea=d.medium==='sea',X=x=>W/2+(x-view.cx)*view.s,Y=y=>H/2+(y-view.cy)*view.s;   // y = depth (negative: in the air)
  let s=`<svg xmlns="http://www.w3.org/2000/svg" class="ld-svg ld-draw" viewBox="0 0 ${W} ${H}" font-family="system-ui,sans-serif" font-size="9.5"><rect width="${W}" height="${H}" fill="#f7fbfd"/>`;
  const g=Y(0),fill=sea?'#dcebf3':d.medium==='perfect'?'#e4e7e6':'#e9e1cc';
  if(sea)s+=`<rect width="${W}" height="${H}" fill="${fill}"/><text x="6" y="12" fill="#3a6a80">θάλασσα (άπειρο μέσο), ρ = ${fmt(+d.rho)} Ω·m</text>`;
  else{s+=`<rect x="0" y="${Math.max(0,g)}" width="${W}" height="${Math.max(0,H-g)}" fill="${fill}"/><line x1="0" x2="${W}" y1="${g}" y2="${g}" stroke="#8a7b55" stroke-width="1.5"/>`;
   const two=d.rho2!=null&&d.rho2!==''&&+d.dsoil>0;if(two&&VIEW.layers){const gb=Y(+d.dsoil);s+=`<rect x="0" y="${gb}" width="${W}" height="${Math.max(0,H-gb)}" fill="#d9cfb2"/><line x1="0" x2="${W}" y1="${gb}" y2="${gb}" stroke="#a8996f" stroke-dasharray="4 3"/><text x="6" y="${gb+11}" fill="#6d6040">ρ₂ = ${fmt(+d.rho2)} Ω·m</text>`;}
   s+=`<text x="6" y="${g+12}" fill="#6d6040">${d.medium==='perfect'?'τέλεια αγώγιμο':'ρ'+(two?'₁':'')+' = '+fmt(+d.rho)+' Ω·m'}</text>`;
   if(VIEW.ov==='skin'){const f=+VIEW.f||50,de=503.29*Math.sqrt((+d.rho||100)/f);s+=`<line x1="0" x2="${W}" y1="${Y(de)}" y2="${Y(de)}" stroke="#2f5fa0" stroke-dasharray="6 3"/><text x="${W-6}" y="${Y(de)-3}" text-anchor="end" fill="#2f5fa0">βάθος διείσδυσης ${fmt(de,3)} m στα ${fmt(f)} Hz</text>`;}}
  for(const c of cs){const ph=[].concat(c.ph??[]),ls=c.layers||[],on=sel==='c'+c.i;let ci=-1;const cc=[];ls.forEach(l=>{if((l.t||'c')==='c')ci++;cc.push(ci);});
   if(ph.some(p=>hide.has('ph'+(+p||0)))&&ph.every(p=>hide.has('ph'+(+p||0))))continue;
   const Ro=Math.max(0,...ls.map(l=>+l.rout||0)),rr=VIEW.minsize?Math.max(6,Ro*view.s):Ro*view.s;
   for(let j=ls.length-1;j>=0;j--){const l=ls[j],r=(+l.rout||0)/Ro*rr;s+=`<circle data-cab="${c.i}" data-src="c${c.i}" cx="${X(+c.x).toFixed(1)}" cy="${Y(+c.y).toFixed(1)}" r="${Math.max(0.5,r).toFixed(1)}" fill="${layerCol(l,ph,Math.max(0,cc[j]))}" stroke="${on?'#111':'#55615e'}" stroke-width="${on&&j===ls.length-1?1.4:0.3}" style="cursor:grab"/>`;}
   if(VIEW.labels)s+=`<text x="${X(+c.x).toFixed(1)}" y="${(Y(+c.y)-rr-3).toFixed(1)}" text-anchor="middle" fill="#203a3f">K${c.i+1}</text>`;}
  if(VIEW.dims&&cs.length){const xs=[...new Set(cs.map(c=>+(+c.x).toFixed(4)))].sort((a,b)=>a-b),yb=Math.max(...cs.map(c=>Y(+c.y)))+24;
   for(let k=1;k<xs.length;k++){const a=X(xs[k-1]),b=X(xs[k]);if(b-a<16)continue;s+=`<line x1="${a}" x2="${b}" y1="${yb}" y2="${yb}" stroke="#4a5c58" stroke-width="0.7"/><text x="${(a+b)/2}" y="${yb-3}" text-anchor="middle" fill="#4a5c58">${fmt((xs[k]-xs[k-1])*1000,4)} mm</text>`;}
   if(!sea){const ys=[...new Set(cs.map(c=>+c.y))];for(const y of ys){const xr=X(Math.max(...cs.map(c=>+c.x)))+30;s+=`<line x1="${xr}" x2="${xr}" y1="${g}" y2="${Y(y)}" stroke="#4a5c58" stroke-width="0.6" stroke-dasharray="2 2"/><text x="${xr+4}" y="${(g+Y(y))/2}" fill="#4a5c58">${y<0?'ύψος '+fmt(-y,3):'βάθος '+fmt(y,3)} m</text>`;}}}
  return s+`<text x="${W-6}" y="${H-6}" text-anchor="end" fill="#4a5c58">1 m = ${fmt(view.s,3)} px</text></svg>`;}
 // the cross-section of one cable with a label on every layer; with U the field at the inner surface of each insulation
 function xsSVG(d,i){const c=(d.cables||[])[i];if(!c)return '';const ls=c.layers||[],Ro=Math.max(1e-6,...ls.map(l=>+l.rout||0)),S=200,C=S/2,ph=[].concat(c.ph??[]);
  let s=`<svg xmlns="http://www.w3.org/2000/svg" class="ld-svg ld-xs" viewBox="0 0 ${S+230} ${S}" font-family="system-ui,sans-serif" font-size="9.5"><rect width="${S+230}" height="${S}" fill="#fff"/>`;
  let ci=-1;const cc=ls.map(l=>{if((l.t||'c')==='c')ci++;return Math.max(0,ci);});
  for(let j=ls.length-1;j>=0;j--){const l=ls[j];s+=`<circle data-lay="${j}" cx="${C}" cy="${C}" r="${((+l.rout||0)/Ro*(C-6)).toFixed(1)}" fill="${layerCol(l,ph,cc[j])}" stroke="#55615e" stroke-width="0.5"/>`;}
  const U0=(+VIEW.U||0)*1e3/Math.sqrt(3);let n=0,prev=0;
  ls.forEach((l,j)=>{const t=l.t||'c',ro=+l.rout||0,ri=j===0?(+l.rin||0):prev;prev=ro;if(t==='c')n++;
   const ang=-Math.PI/4+j*0.18,r=(ro/Ro*(C-6)+ri/Ro*(C-6))/2,px=C+r*Math.cos(ang),py=C+r*Math.sin(ang),ty=14+j*15;
   const name=l.mat&&MATS[l.mat]?MATS[l.mat].n:t==='c'?'αγωγός':t==='s'?'ημιαγώγιμο':'μόνωση';
   let extra=t==='c'?` · φάση ${+ph[n-1]||0}`:'';if(t==='i'&&U0>0&&ri>0&&ro>ri&&n===1)extra+=` · E(r_εσ) = ${fmt(U0/(ri*Math.log(ro/ri))/1e6,3)} kV/mm`;
   s+=`<line x1="${px.toFixed(1)}" y1="${py.toFixed(1)}" x2="${S+4}" y2="${ty-3}" stroke="#9fb2ad" stroke-width="0.5"/><text x="${S+8}" y="${ty}" fill="#203a3f">${j+1}. ${esc(name)} ${fmt(ri*1000,4)}–${fmt(ro*1000,4)} mm${extra}</text>`;});
  return s+`<text x="${S+8}" y="${S-6}" fill="#4a5c58">K${i+1} · Ø ${fmt(2*Ro*1000,4)} mm${U0>0?' · U = '+fmt(+VIEW.U)+' kV':''}</text></svg>`;}
 function legendHTML(d,hide){const phs=isCable(d)?[...new Set((d.cables||[]).flatMap(c=>[].concat(c.ph??[])).map(v=>+v||0))]:[...new Set(expand(d).map(c=>c.ph))];
  return '<div class="ld-leg small">'+phs.sort((a,b)=>a-b).map(p=>`<span data-hide="ph${p}" class="${hide.has('ph'+p)?'off':''}" title="Κλικ: κρύψε/δείξε"><i style="background:${PHC[p%PHC.length]}"></i>${p?'φάση '+p:isCable(d)?'γειωμένος (0)':'αγωγοί προστασίας (0)'}</span>`).join('')+
   (isCable(d)&&d.medium==='sea'?'':`<span data-hide="soil" class="${hide.has('soil')?'off':''}"><i style="background:#e9e1cc;border-radius:2px"></i>έδαφος</span>`)+
   (isCable(d)?[...new Set((d.cables||[]).flatMap(c=>(c.layers||[]).map(l=>l.mat)).filter(m=>m&&MATS[m]))].map(m=>`<span><i style="background:${MATS[m].col};border-radius:2px"></i>${esc(MATS[m].n)}</span>`).join(''):'')+'</div>';}
 // the default view: everything in the frame
 function fitView(d,W,H){if(isCable(d)){const cs=(d.cables||[]).filter(c=>Number.isFinite(+c.x)),R=Math.max(0.01,...cs.flatMap(c=>(c.layers||[]).map(l=>+l.rout||0)));
   if(!cs.length)return {cx:0,cy:1,s:100};const xs=cs.map(c=>+c.x),ys=cs.map(c=>+c.y),x0=Math.min(...xs)-4*R,x1=Math.max(...xs)+4*R,y0=Math.min(0,...ys)-4*R,y1=Math.max(...ys)+4*R;
   const near=d.medium!=='sea'&&Math.min(...ys)<Math.max(x1-x0,y1-Math.min(...ys))*3,ya=near?Math.min(y0,-0.1*(y1-y0)):Math.min(...ys)-4*R;
   const s=Math.min(W/(x1-x0),H/(y1-ya))*0.85;return {cx:(x0+x1)/2,cy:(ya+y1)/2,s};}
  const cs=expand(d).filter(c=>Number.isFinite(c.x)&&Number.isFinite(c.y));if(!cs.length)return {cx:0,cy:10,s:8};
  const xs=cs.map(c=>c.x),ys=cs.map(c=>c.y),x0=Math.min(...xs,-1)-4,x1=Math.max(...xs,1)+4,y1=Math.max(...ys,1)*1.12,y0=-0.12*y1;
  const s=Math.min(W/(x1-x0),H/(y1-y0))*0.9;return {cx:(x0+x1)/2,cy:(y0+y1)/2,s};}

 // ---------------------------------------------------------------- the data tables
 function table(rows,cols,kind,selSrc){
  return `<table class="ld-tab"><thead><tr><th>#</th>${cols.map(([k,l,h])=>`<th title="${esc(h)}">${esc(l)}</th>`).join('')}<th title="Μοντέλο της εσωτερικής εμπέδησης">Εσωτερική Z</th><th></th><th></th></tr></thead><tbody>`+
   rows.map((w,i)=>{const z=w.zi||'tube',zp=ZIP[z];return `<tr data-row="${kind}${i}" class="${selSrc===kind+i?'hl':''}"><td>${kind==='w'?'W':'B'}${i+1}</td>${cols.map(([k,,,wd])=>`<td><input data-t="${kind}" data-i="${i}" data-c="${k}" value="${esc(w[k]??'')}" style="width:${wd}px"></td>`).join('')}`+
    `<td><select data-t="${kind}" data-i="${i}" data-c="zi">${ZI.map(([k,l])=>`<option value="${k}" ${z===k?'selected':''}>${esc(l)}</option>`).join('')}</select></td>`+
    `<td>${zp?`<input data-t="${kind}" data-i="${i}" data-c="${zp[0]}" value="${esc(w[zp[0]]??'')}" title="${esc(zp[1])}" placeholder="${esc(zp[1])}" style="width:58px">${z==='xu'?`<select data-t="${kind}" data-i="${i}" data-c="xmode" title="Σταθερή L (προεπιλογή) ή σταθερή X"><option value="L" ${(w.xmode||'L')==='L'?'selected':''}>L</option><option value="X" ${w.xmode==='X'?'selected':''}>X</option></select>`:''}`:''}</td>`+
    `<td><button class="x" data-del="${kind}${i}" title="Διαγραφή">✕</button></td></tr>`;}).join('')+'</tbody></table>';}
 function cableTables(d,selSrc){return (d.cables||[]).map((c,i)=>{const ls=c.layers||[];let firstC=true;
  return `<div class="ld-cab ${selSrc==='c'+i?'hl':''}" data-row="c${i}"><div class="ld-row"><b>K${i+1}</b><label>x (m) <input data-k="cab" data-i="${i}" data-c="x" value="${esc(c.x)}" style="width:56px"></label>
   <label title="${d.medium==='sea'?'στη θάλασσα: μόνο οι αποστάσεις μετρούν':'κάτω από την επιφάνεια· αρνητικό: πάνω από το έδαφος (στον αέρα)'}">Βάθος (m) <input data-k="cab" data-i="${i}" data-c="y" value="${esc(c.y)}" style="width:56px"></label>
   <label title="Η φάση κάθε αγωγού από μέσα προς τα έξω· 0 = θωράκιση/οπλισμός γειωμένος στα δύο άκρα. Ίδια φάση = παράλληλοι.">Φάσεις αγωγών <input data-k="cab" data-i="${i}" data-c="ph" value="${esc([].concat(c.ph??[]).join(', '))}" style="width:64px"></label>
   <button data-addl="${i}">+ Στρώμα</button><button data-xs="${i}" title="Τομή αυτού του καλωδίου">Τομή</button><button class="x" data-delc="${i}" title="Διαγραφή καλωδίου">✕</button></div>
   <table class="ld-tab"><thead><tr><th>#</th><th>Στρώμα</th><th>Υλικό</th>${LCOL.map(([k,l,h])=>`<th title="${esc(h)}">${esc(l)}</th>`).join('')}<th></th></tr></thead><tbody>`+
   ls.map((l,j)=>{const t=l.t||'c',isC=t==='c',show=k=>k==='rout'||(k==='mur'&&isC)||(isC?(k==='rho'||(k==='rin'&&firstC)):(k==='epsr'||(k==='tand'&&t==='i')));
    const row=`<tr><td>${j+1}</td><td><select data-k="lay" data-i="${i}" data-j="${j}" data-c="t">${LAYT.map(([k,lab])=>`<option value="${k}" ${t===k?'selected':''}>${lab}</option>`).join('')}</select></td>`+
    `<td><select data-k="lay" data-i="${i}" data-j="${j}" data-c="mat"><option value="">—</option>${Object.entries(MATS).filter(([,m])=>m.t===t).map(([k,m])=>`<option value="${k}" ${l.mat===k?'selected':''}>${esc(m.n)}</option>`).join('')}</select></td>`+
    LCOL.map(([k,,,wd])=>`<td>${show(k)?`<input data-k="lay" data-i="${i}" data-j="${j}" data-c="${k}" value="${esc(k==='rin'||k==='rout'?mm(l[k]):l[k]??'')}" style="width:${wd}px" ${k==='mur'?'placeholder="1"':k==='tand'?'placeholder="0"':''}>`:''}</td>`).join('')+
    `<td><button class="x" data-dell="${i},${j}" title="Διαγραφή στρώματος">✕</button></td></tr>`;if(isC)firstC=false;return row;}).join('')+'</tbody></table></div>';}).join('');}
 const SEQF=[['R0','R₀','Ω/km'],['L0','L₀','mH/km'],['C0','C₀','μF/km'],['G0','G₀','S/km'],['R1','R₁','Ω/km'],['L1','L₁','mH/km'],['C1','C₁','μF/km'],['G1','G₁','S/km']];
 function seqForm(d){const q=d.seq||{};return `<h3>Γραμμή από παραμέτρους ακολουθιών <small class="muted">LINE CONSTANTS: CONSTANT ή LBUILD</small></h3>
  <div class="ld-row"><label>Φάσεις <input data-q="M" value="${esc(q.M??3)}" style="width:40px"></label><label>f (Hz) <input data-q="f" value="${esc(q.f??50)}" style="width:56px"></label>
   <label>Τρόπος <select data-q="mode"><option value="const" ${(q.mode||'const')==='const'?'selected':''}>Σταθερές παράμετροι (ίδιες σε κάθε f)</option><option value="rebuild" ${q.mode==='rebuild'?'selected':''}>Ανακατασκευή γραμμής (εξάρτηση από τη f)</option></select></label>
   ${q.mode==='rebuild'?`<label title="Ύψος των φάσεων της ισοδύναμης γραμμής (προεπιλογή 20 m)">h (m) <input data-q="h" value="${esc(q.h??'')}" placeholder="20" style="width:50px"></label>`:''}</div>
  <table class="ld-tab"><tr>${SEQF.map(([k,l,u])=>`<th>${l} (${u})</th>`).join('')}</tr><tr>${SEQF.map(([k])=>`<td><input data-q="${k}" value="${esc(q[k]??'')}" style="width:62px" ${k[0]==='G'?'placeholder="0"':''}></td>`).join('')}</tr></table>
  <p class="small muted">Σταθερές: η γραμμή είναι ισορροπημένη με τα ίδια R, L, C σε κάθε συχνότητα (για τα CP και π). Ανακατασκευή: μια εναέρια γραμμή (πολύγωνο φάσεων και ισοδύναμος αγωγός προστασίας) που δίνει ακριβώς αυτές τις τιμές στη f· οι αγωγοί και το έδαφος δίνουν μετά την εξάρτηση από τη συχνότητα (για το FD).</p>`;}
 function fileForm(d){const z=d.zyfile||{};const M=z.Zr?.[0]?.length||0;return `<h3>Z′ και Y′ από αρχείο <small class="muted">Line/Cable Data §2.4: MATLAB με Z, Y (N×N×N_s), f, line_length</small></h3>
  <div class="ld-row"><label>Αρχείο .mat <input type="file" data-zyf accept=".mat"></label><label>Μονάδα μήκους <select data-zyu><option value="km" ${(z.unit||'km')==='km'?'selected':''}>km</option><option value="m" ${z.unit==='m'?'selected':''}>m</option><option value="mile" ${z.unit==='mile'?'selected':''}>mile</option></select></label></div>
  <p class="small">${M?`${M} φάσεις, ${z.f.length} συχνότητες από ${fmt(z.f[0])} ως ${fmt(z.f[z.f.length-1])} Hz${z.length?', μήκος στο αρχείο '+fmt(z.length):''}.`:'Δεν έχει φορτωθεί αρχείο.'}</p>
  <p class="small muted">Ενδιάμεσες συχνότητες με γραμμική παρεμβολή στο log f. Το FD θέλει τουλάχιστον 40 λογαριθμικά δείγματα, το CP ένα· ο T_i υπολογίζεται στη f που δίνεις.</p>`;}
 function optsForm(d){const two=d.rho2!=null&&d.rho2!=='';const tr=d.transp||null;
  return `<details class="ld-more" ${store.get('more',false)?'open':''}><summary>Περισσότερες επιλογές (έδαφος δύο στρωμάτων, μ_r, G ανά φάση, αγωγοί προστασίας, μεταθέσεις)</summary>
   <div class="ld-row"><label><input type="checkbox" data-o="two" ${two?'checked':''}> Έδαφος δύο στρωμάτων</label>${two?`<label>πάχος πάνω στρώματος d (m) <input data-d="dsoil" value="${esc(d.dsoil??'')}" style="width:56px"></label><label>ρ₂ (Ω·m) <input data-d="rho2" value="${esc(d.rho2??'')}" style="width:60px"></label>`:''}
    <label title="Σχετική μαγνητική διαπερατότητα του εδάφους (ολοκλήρωμα του Carson)">μ_r εδάφους <input data-d="mur_e" value="${esc(d.mur_e??'')}" placeholder="1" style="width:44px"></label></div>
   ${isOH(d)?`<div class="ld-row"><label title="Ένας αριθμός για όλες τις φάσεις, ή ένας ανά φάση χωρισμένος με κόμμα (S/km)">G ανά φάση (S/km) <input data-o="Gl" value="${esc(Array.isArray(d.G)?d.G.join(', '):'')}" placeholder="π.χ. 2e-9, 2e-9, 3e-9" style="width:150px"></label>
    <label title="Οι αγωγοί προστασίας μονωμένοι σε τμήματα: δεν μετρούν στο Z, μετρούν στο C (Dommel 4.1.2.5 b)"><input type="checkbox" data-o="iseg" ${d.iseg?'checked':''}> Αγωγοί προστασίας σε τμήματα</label>
    <label title="4.12: η θερμοκρασία των αγωγών· τα R_dc (ή ρ) των δεδομένων είναι στους 20 °C και γίνονται R₂₀·(1 + α·(T − 20)), με α του αγωγού (στήλη α, προεπιλογή 0,00403 1/K, αλουμίνιο IEC 60889)">θερμοκρασία αγωγών (°C) <input data-d="temp" value="${esc(d.temp??'')}" placeholder="20" style="width:44px"></label></div>
   <div class="ld-row"><label><input type="checkbox" data-o="tr" ${tr?'checked':''}> Μεταθέσεις</label>${tr?`<label title="Μήκη των τμημάτων (km ή σχετικά)">μήκη <input data-o="trlen" value="${esc((tr.len||[]).join(', '))}" style="width:110px"></label>
    <label title="Η σειρά των φάσεων σε κάθε τμήμα: 123; 231; 312">σειρά <input data-o="trord" value="${esc((tr.order||[]).map(o=>o.join('')).join('; '))}" style="width:110px"></label><label title="Μέσος όρος: οι πίνακες της γραμμής είναι ο μέσος όρος των τμημάτων ανά μήκος (τέλεια μετάθεση). Χωριστά τμήματα (4.12): ο λύτης βάζει κάθε τμήμα ως γραμμή χωρίς μετάθεση με τη σειρά των φάσεών του· οι πίνακες και τα γραφήματα εδώ δείχνουν τη γραμμή χωρίς μετάθεση.">στον λύτη <select data-o="trmode"><option value="avg" ${(tr.mode||'avg')==='avg'?'selected':''}>μέσος όρος</option><option value="sec" ${tr.mode==='sec'?'selected':''}>χωριστά τμήματα</option></select></label>`:''}</div>`:''}
   ${isCable(d)&&(d.cables||[]).length===3&&(d.cables||[]).every(c=>[].concat(c.ph??[]).length>=2)?`<div class="ld-row"><label title="4.13: ομογενές μοντέλο cross-bonding (Cable Constants §2.4, §10): οι πίνακες μέσος όρος στις τρεις θέσεις των μανδυών (δεύτερος αγωγός κάθε καλωδίου) κατά μήκος ενός μείζονος τμήματος· οι μανδύες μένουν ως έχουν, γίνονται ένας αγωγός (ίδια τάση), ή γειωμένοι">Cross-bonding (ομογενές) <select data-d="xbond">${[['none','χωρίς'],['avg','μέσος όρος, όλοι οι αγωγοί'],['bond','μανδύες ενωμένοι σε έναν αγωγό'],['gnd','μανδύες γειωμένοι']].map(([k,l])=>`<option value="${k}" ${(d.xbond||'none')===k?'selected':''}>${l}</option>`).join('')}</select></label></div>`:''}
   ${isCable(d)?`<div class="ld-row"><label title="Απώλειες της μόνωσης: αιτιατό μοντέλο ευρείας ζώνης (προεπιλογή), σταθερό G = ωC·tanδ, ή της παλιάς Cable Data G = 2π(f_G0 + f)·C·tanδ">Απώλειες μόνωσης <select data-d="loss"><option value="causal" ${(d.loss||'causal')==='causal'?'selected':''}>αιτιατό (ευρείας ζώνης)</option><option value="const" ${d.loss==='const'?'selected':''}>σταθερό tanδ</option><option value="fg0" ${d.loss==='fg0'?'selected':''}>Cable Data (f_G0 + f)</option></select></label>
    ${d.loss==='fg0'?`<label>f_G0 (Hz) <input data-d="fg0" value="${esc(d.fg0??'')}" placeholder="100" style="width:50px"></label>`:''}</div>`:''}
  </details>`;}

 // ---------------------------------------------------------------- the report of the model (CP / FD / π) at one frequency
 function plot(f,ys,title,ylab){const W=300,H=150,L=44,B=22,lx=f.map(Math.log10),x0=Math.min(...lx),x1=Math.max(...lx);
  const all=ys.flatMap(s=>s.y).filter(v=>v>0),ly=all.map(Math.log10),y0=Math.max(Math.min(...ly),Math.max(...ly)-12),y1=Math.max(...ly)+0.05;
  const X=v=>L+(Math.log10(v)-x0)/(x1-x0||1)*(W-L-6),Y=v=>(H-B)-(Math.log10(Math.max(v,10**y0))-y0)/(y1-y0||1)*(H-B-14);
  let s=`<svg class="ld-plot" viewBox="0 0 ${W} ${H}"><text x="${L}" y="10" class="ld-t">${esc(title)}${ylab?' ('+esc(ylab)+')':''}</text><text x="${W-6}" y="10" class="ld-t" text-anchor="end">f (Hz)</text>`;
  for(let e=Math.ceil(x0);e<=Math.floor(x1);e+=2)s+=`<line x1="${X(10**e)}" x2="${X(10**e)}" y1="12" y2="${H-B}" class="ld-gline"/><text x="${X(10**e)}" y="${H-8}" class="ld-t" text-anchor="middle">${pow10(e)}</text>`;
  const ys2=(y1-y0)>6?Math.ceil((y1-y0)/6):1;for(let e=Math.ceil(y0);e<=Math.floor(y1);e+=ys2)s+=`<line x1="${L}" x2="${W-6}" y1="${Y(10**e)}" y2="${Y(10**e)}" class="ld-gline"/><text x="${L-3}" y="${Y(10**e)+3}" class="ld-t" text-anchor="end">${pow10(e)}</text>`;
  for(const q of ys)s+=`<polyline fill="none" stroke="${q.c}" stroke-width="1.5" ${q.dash?'stroke-dasharray="4 3"':''} points="${f.map((v,i)=>X(v).toFixed(1)+','+Y(q.y[i]).toFixed(1)).join(' ')}"/>`;
  return s+'</svg>';}
 function reportHTML(r,mdl,curves){if(!r)return '';const R=r.report,M=R.M;let s='';
  if(R.rebuilt){const b=R.rebuilt;s+=`<p class="small">Ανακατασκευή από τις ακολουθίες στα ${fmt(b.f)} Hz (h = ${fmt(b.h)} m): υπόλοιπο ${fmt(b.residual,2)}.</p>`;}
  if(R.seq){const q=R.seq;s+=`<h3>Ακολουθίες στα ${fmt(R.f)} Hz (με μετάθεση φάσεων)</h3><table class="ld-rep"><tr><th></th><th>R (Ω/km)</th><th>X (Ω/km)</th><th>C (nF/km)</th></tr>
   <tr><td>θετική</td><td>${fmt(q.R1)}</td><td>${fmt(q.X1)}</td><td>${fmt(q.C1*1e9)}</td></tr><tr><td>μηδενική</td><td>${fmt(q.R0)}</td><td>${fmt(q.X0)}</td><td>${fmt(q.C0*1e9)}</td></tr></table>`;}
  if(mdl.type==='wb')return s+wbReport(mdl,curves);
  if(mdl.type==='pi'){s+=`<h3>Ονομαστικό π στα ${fmt(mdl.f)} Hz, ${mdl.N} ${mdl.N===1?'τμήμα':'τμήματα'}</h3><p class="small muted">Συζευγμένα R, L σε σειρά και C/2, G/2 σε κάθε άκρο κάθε τμήματος (Dommel 4.2.2.1). Χωρίς εξάρτηση από τη συχνότητα· για γραμμή ηλεκτρικά μικρή στη ζώνη που μετρά.</p>`;
   s+=`<table class="ld-rep"><tr><th>φάση</th><th>R (Ω)</th><th>L (mH)</th><th>C (nF)</th></tr>`+mdl.R.map((r,k)=>`<tr><td>${k+1}</td><td>${fmt(r[k])}</td><td>${fmt(mdl.L[k][k]*1e3)}</td><td>${fmt(mdl.C[k][k]*1e9)}</td></tr>`).join('')+'</table>';return s;}
  s+=`<h3>Ρυθμοί στα ${fmt(R.f)} Hz</h3><table class="ld-rep"><tr><th>ρυθμός</th><th>Z_c (Ω)</th><th>v (km/s)</th><th>R′ (Ω/km)</th><th>L′ (mH/km)</th><th>C′ (nF/km)</th>${mdl.type==='cp'?'<th>τ (μs)</th><th>R (Ω)</th>':'<th>τ (μs)</th><th>πόλοι Z_c / A</th><th>σφάλμα Z_c / A</th>'}</tr>`+
   R.modes.map((m,k)=>{const q=mdl.modes[k];return `<tr><td>${k+1}</td><td>${fmt(m.Zc)}</td><td>${fmt(m.v/1e3,5)}</td><td>${fmt(m.R)}</td><td>${fmt(m.L*1e3)}</td><td>${fmt(m.C*1e9)}</td>`+
    (mdl.type==='cp'?`<td>${fmt(q.tau*1e6,6)}</td><td>${fmt(q.R)}</td>`:`<td>${fmt(q.tau*1e6,6)}</td><td>${q.zc.p.length} / ${q.a.p.length}</td><td>${fmt(q.zc.err*100,2)} % / ${fmt(q.a.err*100,2)} %</td>`)+'</tr>';}).join('')+'</table>';
  const kind={lumped:'R/4 – R/2 – R/4',lossless:'χωρίς απώλειες',distortionless:'χωρίς παραμόρφωση',hf:'χωρίς απώλειες, υψηλές συχνότητες'}[mdl.cp||'lumped'];
  s+=`<p class="small muted">${mdl.type==='cp'?'CP '+kind+' · ':''}T_i (στήλες = ρυθμοί, ${mdl.type==='fd'?'στα '+fmt(mdl.fti)+' Hz':'στα '+fmt(mdl.f)+' Hz'}${mdl.ti&&mdl.ti!=='gm0'?', '+esc(TIK[mdl.ti]||mdl.ti):''}): ${mdl.Ti.map(r=>'['+r.map(v=>fmt(Math.abs(v)<1e-9?0:v,4)).join(', ')+']').join(' ')} · σφάλμα σταθερού T_i ${fmt((mdl.qerr||0)*100,2)} %.</p>`;
  if(curves){s+=`<h3>Προσαρμογή FD (συνεχής: ακριβές, διακεκομμένη: ρητή συνάρτηση)</h3><p class="small muted">Το σφάλμα του A μετριέται σε απόλυτη τιμή (όπως το EMTP): όπου |A| &lt; 10⁻³ το κύμα έχει ήδη σβήσει και η απόκλιση της καμπύλης δεν μετρά. Όλα τα μεγέθη με κέρσορα και μεγέθυνση: καρτέλα «Γραφήματα».</p><div class="ld-plots">`+curves.modes.map((c,k)=>plot(curves.f,[{y:c.Zc,c:PHC[k+1]},{y:c.Zc_fit,c:'#222',dash:true}],`ρυθμός ${k+1}: |Z_c|`,'Ω')
   +plot(curves.f,[{y:c.A,c:PHC[k+1]},{y:c.A_fit,c:'#222',dash:true}],`ρυθμός ${k+1}: |A|`,'')).join('')+'</div>';}
  return s;}
 // 4.13: the wideband model. Its options (as the WB fitter of the EMTP) and its report: the groups of H with their delays
 // and poles, the errors (H absolute, Y_c relative, the nodal admittance per band), the passivity, the curves
 const WBSEL=['wsrc','wgrp','wfdcm','wdc','wopt','wpas','wlfw'];
 const hashText=t=>{let h=2166136261;for(let i=0;i<t.length;i++){h^=t.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16);};
 const wsel=(k,v,opts)=>`<select data-p="${k}">${opts.map(([a,l])=>`<option value="${a}" ${String(v)===a?'selected':''}>${esc(l)}</option>`).join('')}</select>`;
 function wbOptsHTML(p){const emtp=p.wsrc==='emtp';
  return `<div class="ld-row"><label>Μοντέλο WB από ${wsel('wsrc',p.wsrc||'fit',[['fit','προσαρμογή εδώ'],['emtp','αρχείο του EMTP (_WB.mod)']])}</label>
   ${emtp?`<label>Αρχείο <input type="file" data-wbfile accept=".mod,.txt"></label><span class="small muted">${p.wbref?'φορτωμένο: '+esc(String(p.wbref).split('|')[0]):'κανένα αρχείο'} · ίδιες φάσεις με τα δεδομένα· το μήκος από εδώ.</span>`
   :`<label>f_min (Hz) <input data-p="fmin" value="${esc(p.fmin)}" style="width:60px"></label><label>Δεκάδες <input data-p="dec" value="${esc(p.dec)}" style="width:40px"></label><label>Σημεία/δεκάδα <input data-p="ppd" value="${esc(p.ppd)}" style="width:40px"></label>
   <label title="Μέγιστο σφάλμα του H (απόλυτο) και του Y_c (ως προς το μέτρο του)">ανοχή (%) <input data-p="wtol" value="${esc(p.wtol??0.2)}" style="width:44px"></label><label title="Μέγιστο πλήθος πόλων ανά συνάρτηση">πόλοι ≤ <input data-p="nmax" value="${esc(p.nmax??30)}" style="width:40px"></label>`}</div>
   ${emtp?'':`<div class="ld-row"><label title="Ρυθμοί με ίδια ή σχεδόν ίδια καθυστέρηση σε μία ομάδα (EMTP: Apply grouping)">ομαδοποίηση ${wsel('wgrp',p.wgrp||'1',[['1','ναι'],['0','όχι']])}</label>
    <label title="Cable model correction (FDCM): κάθε συνεισφορά ρυθμού προσαρμόζεται χωριστά όταν ο λόγος υπόλοιπο/πόλος ξεπερνά το 1000">FDCM ${wsel('wfdcm',p.wfdcm||'auto',[['auto','αυτόματα'],['always','πάντα'],['never','ποτέ']])}</label>
    <label title="DC correction: η ζώνη κάτω από 1 Hz προσαρμόζεται χωριστά ως διόρθωση (f_min ≤ 0,001 Hz)">διόρθωση DC ${wsel('wdc',p.wdc||'0',[['0','όχι'],['1','ναι']])}</label>
    <label title="Οι καθυστερήσεις με αναζήτηση γύρω από την εκτίμηση Bode σε όλες τις ομάδες (και χωρίς αυτό: όταν ο ρυθμός δεν σβήνει μέσα στη ζώνη)">καθυστερήσεις ${wsel('wopt',p.wopt||'0',[['0','Bode'],['1','βελτιστοποίηση']])}</label>
    <label title="Το σφάλμα του H ως προς |1 − H| του λιγότερο αποσβενόμενου ρυθμού (έως αυτόν τον συντελεστή): ένα κοντό τμήμα κρατά τη σύνθετη αντίσταση σειράς του στα 50 Hz">βάρος χαμηλών f ${wsel('wlfw',String(p.wlfw??100),[['100','100'],['300','300'],['30','30'],['0','χωρίς']])}</label></div>`}
   <div class="ld-row"><label title="Σάρωση των ιδιοτιμών του πραγματικού μέρους της αγωγιμότητας κόμβων· «επιβολή»: διαταραχή των υπολοίπων ώστε να γίνει παθητικό">Παθητικότητα ${wsel('wpas',p.wpas||'check',[['check','έλεγχος'],['enforce','έλεγχος και επιβολή'],['none','χωρίς έλεγχο']])}</label></div>`;}
 function wbReport(m,cv){const f=m.fit||{},ps=m.passive;let s=`<h3>Μοντέλο WB${f.source==='EMTP'?' από αρχείο του EMTP':''}: Y_c με ${m.npoles?.yc??m.yc.p.length} πόλους, H σε ${m.groups.length} ${m.groups.length===1?'ομάδα':'ομάδες'}</h3>
  <table class="ld-rep"><tr><th>ομάδα</th><th>ρυθμοί</th><th>τ (μs)</th><th>πόλοι</th></tr>${m.groups.map((g,k)=>`<tr><td>${k+1}${g.dc?' (DC)':''}</td><td>${(g.modes||[]).map(x=>x+1).join(', ')||'—'}</td><td>${fmt(g.tau*1e6,6)}</td><td>${g.p.length+g.p.filter(z=>z[1]>0).length}</td></tr>`).join('')}</table>
  <p class="small">Σφάλμα: H ${fmt(f.h_err,2)} (απόλυτο), Y_c ${fmt((f.yc_err||0)*100,2)} %${f.method==='fdcm'?' · FDCM':''}${f.lfw>1?' · βάρος χαμηλών συχνοτήτων '+fmt(f.lfw,3):''}${f.ratio!=null?' · λόγος υπόλοιπο/πόλος '+fmt(f.ratio,3):''}.</p>`;
  if(f.yn_bands)s+=`<p class="small">Αγωγιμότητα κόμβων έναντι της ακριβούς γραμμής: ${f.yn_bands.map(b=>`${b[0]?fmt(b[0])+' Hz':'0'} – ${b[1]==null?'∞':fmt(b[1])+' Hz'}: ${fmt(b[2]*100,2)} %`).join(' · ')}.</p>`;
  if(ps)s+=`<p class="small${ps.passive?'':' bad'}">Παθητικότητα: ${ps.passive?'✓ παθητικό':'✗ παραβιάσεις σε '+ps.bands.map(b=>fmt(b[0])+' – '+fmt(b[1])+' Hz').join(', ')+' (ελάχιστη ιδιοτιμή '+fmt(ps.worst,2)+')'}${f.enforced?' · επιβλήθηκε σε '+(ps.iters??'—')+' επαναλήψεις':''}${f.enforced===false?' · η επιβολή δεν κρατήθηκε (άλλαζε το μοντέλο πέρα από την ανοχή)':''}.</p>`;
  if(cv&&cv.f){const yc=cv.yc_err||[],h=cv.h_err||[],yn=cv.yn_err||[];s+=`<div class="ld-plots">${plot(cv.f,[{y:yc,c:PHC[1]},{y:h,c:PHC[2]},...(yn.length?[{y:yn,c:'#222',dash:true}]:[])],'σφάλμα: Y_c, H, Y κόμβων (διακεκομμένη)','')}`
   +(cv.Hm&&cv.Hm.length?plot(cv.f,cv.Hm.map((y,k)=>({y,c:PHC[(k%(PHC.length-1))+1]})),'|H| των ρυθμών',''):'')
   +(cv.pf&&cv.pf.length?plot(cv.pf,[{y:cv.plmin.map(v=>Math.max(Math.abs(v),1e-16)),c:'#c0392b'}],'|λ_min/λ_max| του Re Y',''):'')+'</div>';}
  return s;}
 function wbPane(p){return `${wbOptsHTML(p)}<div class="ld-actions"><button class="primary-ghost" data-run>Υπολογισμός</button><span class="small muted">Universal Line Model (Morched, Gustavsen, Tartibi) όπως ο WB fitter του EMTP: Y_c με κοινούς πόλους, H σε ομάδες ρυθμών με καθυστερήσεις Bode, υπόλοιπα στο πεδίο των φάσεων, FDCM, διόρθωση DC, έλεγχος και επιβολή παθητικότητας.</span></div>`;}
 const TIK={gm0:'G_m = 0 (EMTP)',minimag:'ελάχιστο φανταστικό',balanced:'ισορροπημένη (Clarke)',double:'διπλό κύκλωμα (μόνο ομοπολική σύζευξη)'};
 const CPK=[['lumped','R/4 – R/2 – R/4 (όπως το EMTP)'],['lossless','χωρίς απώλειες (R = 0)'],['distortionless','χωρίς παραμόρφωση'],['hf','χωρίς απώλειες, υψηλές συχνότητες (κεραυνοί)']];

 // ---------------------------------------------------------------- the tables of the scan
 function matHTML(A,cap,lab,unit,scale=1){if(!A)return '';const re=A.re||A,im=A.re?A.im:null,M=re.length,L=lab||re.map((_,k)=>String(k+1));
  return `<table class="ld-rep ld-mat"><caption>${esc(cap)}${unit?' ('+esc(unit)+')':''}</caption><tr><th></th>${L.map(x=>`<th>${esc(x)}</th>`).join('')}</tr>`+
   re.map((r,i)=>`<tr><th>${esc(L[i])}</th>${r.map((v,j)=>`<td>${im?cfmt(v*scale,im[i][j]*scale,4):fmt(v*scale,4)}</td>`).join('')}</tr>`).join('')+'</table>';}
 function tablesHTML(sc,form){if(!sc)return '<p class="muted">Πάτα «Σάρωση» στην καρτέλα «Γραφήματα» (ή εδώ) για τους πίνακες.</p>';const m=sc.matrices,u=sc.useful,M=sc.M;let s='';
  const symLab=k=>'012'[k%3]+(M>3?`(${Math.floor(k/3)+1})`:'');
  s+=`<h3>Πίνακες στα ${fmt(m.f)} Hz, ανά km</h3><div class="ld-mats">`;
  if(m.phys){const lab=m.phys.labels.map((p,k)=>(k+1)+(+p?'·φ'+p:'·γ'));s+=matHTML(m.phys.Z,'[Z] αγωγών',lab,'Ω/km')+matHTML(m.phys.C,'[C] αγωγών',lab,'nF/km',1e9);}
  s+=matHTML(m.phase.Z,'[Z_E] φάσεων',null,'Ω/km')+matHTML(m.phase.C,'[C_E] φάσεων',null,'nF/km',1e9)+matHTML(m.phase.G,'[G_E] φάσεων',null,'μS/km',1e6);
  if(m.sym){const lab=m.sym.Z.re.map((_,k)=>symLab(k));s+=matHTML(m.sym.Z,'[Z_S] συμμετρικών',lab,'Ω/km')+matHTML(m.sym.C,'[C_S] συμμετρικών',lab,'nF/km',1e9);}
  s+='</div>';
  if(u){const c=(z,d)=>z&&z.re!==undefined?cfmt(z.re,z.im,d):fmt(z,d),U=+VIEW.U||0,z2r=u.Zc1.re*u.Zc1.re-u.Zc1.im*u.Zc1.im,z2i=2*u.Zc1.re*u.Zc1.im,dn=z2r*z2r+z2i*z2i,
    y1r=(u.Z1.re*z2r+u.Z1.im*z2i)/dn,y1i=(u.Z1.im*z2r-u.Z1.re*z2i)/dn;u.SIL=U*U/Math.hypot(u.Zc1.re,u.Zc1.im);u.Ic=U*1e3/Math.sqrt(3)*Math.hypot(y1r,y1i);u.Qc=U*U*y1i;
   s+=`<h3>Χρήσιμα μεγέθη στα ${fmt(u.f)} Hz</h3><div class="ld-row"><label>U (kV, πολική) <input data-U value="${esc(VIEW.U)}" style="width:60px"></label></div><table class="ld-rep"><tr><th>μέγεθος</th><th>τιμή</th><th></th></tr>`+
    [['Z₁ (Ω/km)',c(u.Z1)],['Z₀ (Ω/km)',c(u.Z0)],['Z_c1 (Ω)',c(u.Zc1)],['Z_c0 (Ω)',c(u.Zc0)],['X₁/R₁',fmt(u.XR1)],['X₀/X₁',fmt(u.X0X1)],['R₀/X₁',fmt(u.R0X1)],['k₀ = (Z₀ − Z₁)/(3Z₁)',c(u.k0),'συντελεστής γείωσης της προστασίας απόστασης'],
     ['v₁ (km/s)',fmt(u.v1/1e3,6)],['μήκος κύματος (km)',fmt(u.wavelength,5)],['SIL (MW)',fmt(u.SIL),'U²/|Z_c1|'],['ρεύμα φόρτισης (A/km)',fmt(u.Ic)],['άεργος φόρτισης (Mvar/km)',fmt(u.Qc)],
     ['άνοδος τάσης ανοικτού άκρου',fmt(u.ferranti,6),'|1/cosh(γ₁ℓ)| (Ferranti)'],['ηλεκτρικό μήκος (°)',fmt(u.theta)]].map(([a,b,h])=>`<tr><td>${a}</td><td>${b}</td><td class="small muted">${esc(h||'')}</td></tr>`).join('')+'</table>';}
  if(sc.lossless){const L=sc.lossless;s+=`<h3>Ρυθμοί χωρίς απώλειες (MODAL = −1: R = 0)</h3><table class="ld-rep"><tr><th>ρυθμός</th><th>Z_c (Ω)</th><th>v (km/s)</th><th>L′ (mH/km)</th><th>C′ (nF/km)</th></tr>`+
   L.modes.map((q,k)=>`<tr><td>${k+1}</td><td>${fmt(q.Zc)}</td><td>${fmt(q.v/1e3,6)}</td><td>${fmt(q.L*1e6)}</td><td>${fmt(q.C*1e12)}</td></tr>`).join('')+'</table>';}
  if(sc.qtests?.length){s+=`<h3>Έλεγχος του T_i (Q-error, %)</h3><p class="small muted">Μόνιμη κατάσταση με τον σταθερό T_i απέναντι στην ακριβή γραμμή, πηγές 1∠0°, 1∠0°, 1∠120° ανά τριάδα στο άκρο αποστολής· ανοικτό ή βραχυκυκλωμένο άκρο λήψης· το μέγιστο σφάλμα ανάμεσα στα μεγέθη που είναι τουλάχιστον 5 % του μεγαλύτερου (line_constants §6.8).</p>
   <table class="ld-rep"><tr><th>f (Hz)</th><th>ανοικτό: V λήψης</th><th>ανοικτό: I αποστολής</th><th>βραχυκύκλωμα: I αποστολής</th><th>βραχυκύκλωμα: I λήψης</th></tr>`+
   sc.qtests.map(r=>`<tr><td>${fmt(r.f)}</td>${['open_v','open_i','short_i1','short_i2'].map(k=>`<td class="${r[k]>5?'bad':''}">${fmt(r[k],3)}</td>`).join('')}</tr>`).join('')+'</table>';}
  if(sc.telecom){const T=sc.telecom;if(T.err)s+=`<h3>Γραμμή τηλεπικοινωνιών</h3><p class="bad small">⚠ ${esc(T.err)}</p>`;else{const ab=z=>z?Math.hypot(z.re,z.im):NaN,Z=T.Z,n=Z.re.length,L=+sc.length||1;
   s+=`<h3>Γραμμή τηλεπικοινωνιών <small class="muted">(line_constants §5.2, Dommel 4.1.2.5 c)</small></h3><table class="ld-rep"><tr><th>από τη φάση</th>${[...Array(n)].map((_,k)=>`<th>${k+1}</th>`).join('')}</tr>
    <tr><td>Z_N,k (Ω/km)</td>${[...Array(n)].map((_,k)=>`<td>${cfmt(Z.re[k],Z.im[k])}</td>`).join('')}</tr></table>`+
    (T.sym?.length?`<table class="ld-rep"><tr><th>κύκλωμα</th><th>Z μηδενικής</th><th>Z θετικής</th><th>Z αρνητικής</th></tr>${T.sym.map((q,i)=>`<tr><td>${i+1}</td><td>${cfmt(q.zero.re,q.zero.im)}</td><td>${cfmt(q.pos.re,q.pos.im)}</td><td>${cfmt(q.neg.re,q.neg.im)}</td></tr>`).join('')}</table>`:'')+
    `<p>Επαγόμενη διαμήκης τάση (μαγνητική): <b>${fmt(ab(T.dV)/Math.SQRT2)} V/km</b> RMS, στα ${fmt(L)} km <b>${fmt(ab(T.dV)*L/Math.SQRT2)} V</b> · ηλεκτροστατική τάση της μονωμένης γραμμής: <b>${fmt(ab(T.VN)/Math.SQRT2/1e3)} kV</b> RMS
     <span class="small muted">(συμμετρικά ρεύματα ${fmt(VIEW.I)} A και τάσεις ${fmt(VIEW.U)} kV στις άλλες φάσεις· με τη μείωση από τους συνεχείς αγωγούς προστασίας)</span></p>`;}}
  if(sc.fields){s+=`<h3>Πεδία στο έδαφος (προφίλ στα ${fmt(sc.fields.height)} m)</h3><div class="ld-row"><label>U (kV) <input data-U value="${esc(VIEW.U)}" style="width:60px"></label><label>I (A) <input data-I value="${esc(VIEW.I)}" style="width:60px"></label>
   <span class="small muted">Τριφασικά συμμετρικά συστήματα σε κάθε κύκλωμα· E από τα φορτία Q = C·V με τα είδωλα (line_constants §5.1), B από τα ρεύματα με τα επαγόμενα στους αγωγούς προστασίας (κύριοι άξονες των ελλείψεων). Οι γραμμές αναφοράς είναι οι τιμές του ICNIRP 2010 για το κοινό στα 50 Hz.</span></div><div class="ld-fplots"><div data-fE></div><div data-fB></div></div>`;}
  return s;}

 // ---------------------------------------------------------------- the dialog
 const SENS=[['rho','ρ εδάφους (Ω·m)'],['dh','ύψος όλων των αγωγών ή καλωδίων +Δh (m)'],['sag','βέλος (m)'],['temp','θερμοκρασία αγωγών (°C)']];
 const SENS_DEF={rho:[10,1000],dh:[-5,5],sag:[0,20],temp:[0,100]};
 // 4.12: a series of a kept scan on the frequencies of the current one (linear in log f; outside its range: none)
 function onF(fx,f0,y){if(fx.length===f0.length&&fx.every((v,i)=>Math.abs(v-f0[i])<=1e-9*v))return y;const L0=f0.map(Math.log);
  return fx.map(v=>{const x=Math.log(v);if(x<L0[0]-1e-12||x>L0[L0.length-1]+1e-12)return NaN;let j=1;while(j<L0.length-1&&L0[j]<x)j++;const t=(x-L0[j-1])/((L0[j]-L0[j-1])||1);return y[j-1]+(y[j]-y[j-1])*t;});}
 const TABS=[['data','Αγωγοί'],['model','Μοντέλο'],['graphs','Γραφήματα'],['tables','Πίνακες'],['export','Εξαγωγή']];
 // opens the dialog for the part `id`; ctx = {editor, api(action, data) → Promise, changed()}
 function open(id,ctx){const c=ctx.editor.comp(id);if(!c)return;const p0={...P.defaults('TLM'),...c.params};
  let d;try{d=JSON.parse(p0.data);}catch(e){d={rho:100,earth:'carson',skin:true,wires:[],bundles:[]};}
  const norm=()=>{if(!isOH(d))return;d.wires=d.wires||[];d.bundles=d.bundles||[];};norm();let last=null,status=null,sc=null,scKey=null,scBusy=false,scErr=null;
  const G=Object.assign({tab:'data',dom:'modes',qty:'Zc',form:'mag',cmp:true},store.get('graph',{}));let tab=store.get('tab','data');if(!TABS.some(t=>t[0]===tab))tab='data';
  const hide=new Set(),undo=[];let sel=null,xsI=0,view=null,charts=[];
  // 4.12: a kept scan to compare with (dashed in the same charts), and the sensitivity of the sequence parameters
  let refSc=null,sens=null,sensBusy=false,sensErr=null;const SP=Object.assign({param:'rho',lo:10,hi:1000,n:21,f:50,qty:'RX'},store.get('sens',{}));
  const box=document.createElement('div');box.className='modal ld-modal';document.body.appendChild(box);
  const close=()=>{box.remove();document.removeEventListener('keydown',onKey);};const onKey=e=>{if(e.key==='Escape')close();else if((e.ctrlKey||e.metaKey)&&e.key==='z'&&tab==='data'&&undo.length&&!/INPUT|SELECT/.test(document.activeElement?.tagName||'')){e.preventDefault();doUndo();}};document.addEventListener('keydown',onKey);
  const pars=()=>({...P.defaults('TLM'),...ctx.editor.comp(id).params});
  const snap=()=>{undo.push(JSON.stringify(d));if(undo.length>60)undo.shift();};
  const doUndo=()=>{if(!undo.length)return;d=JSON.parse(undo.pop());norm();saveData();later();};
  // a change handler may run while the dialog is being replaced (blur → change): draw again after the event
  let pend=false;const later=()=>{if(pend)return;pend=true;setTimeout(()=>{pend=false;if(box.isConnected)render();},0);};
  const saveData=()=>{status=null;ctx.editor.setParams(id,{data:JSON.stringify(d)});ctx.changed();};
  const scanReq=()=>{const p=pars();const q={data:d,len:num(p.len),fmin:num(p.fmin),dec:num(p.dec),ppd:num(p.ppd),fti:num(p.fti),ti:p.ti||'gm0',tiauto:p.tiauto==='1'||p.tiauto===true,f:num(p.f)||50,
   field:{U:400,I:1000},...(VIEW.tel?{telecom:{U:+VIEW.U||400,I:+VIEW.I||1000}}:{})};let m=null;try{m=p.mdl?JSON.parse(p.mdl):null;}catch(e){}if(m&&m.type==='fd'&&m.src===P.tlmKey(p))q.mdl=m;return q;};
  const doScan=async()=>{if(scBusy)return;scBusy=true;scErr=null;render();const q=scanReq(),key=JSON.stringify(q);
   try{sc=await ctx.api('line_scan',q);scKey=key;}catch(e){scErr=e.message||String(e);}scBusy=false;if(box.isConnected)render();};
  const scanOld=()=>sc&&scKey!==JSON.stringify(scanReq());
  const render=()=>{const p=pars(),model=['fd','pi','wb'].includes(p.model)?p.model:'cp',cab=isCable(d),kind=cab?'cab':isSeq(d)?'seq':isFile(d)?'file':'oh';
   const tm=P.tlmModel(p);
   box.innerHTML=`<div class="modal-box ld-box"><div class="modal-head"><h2>Δεδομένα γραμμής · ${esc(c.label||c.id)}</h2><div class="ld-tabs">${TABS.map(([k,l])=>`<button data-tab="${k}" class="${tab===k?'on':''}">${l}</button>`).join('')}</div><button class="x" data-close>✕</button></div><div class="modal-body">
    <div class="ld-row ld-top"><label>Τύπος <select data-kind><option value="oh" ${kind==='oh'?'selected':''}>Εναέρια γραμμή</option><option value="cab" ${cab?'selected':''}>Καλώδια</option><option value="seq" ${kind==='seq'?'selected':''}>Από παραμέτρους ακολουθιών</option><option value="file" ${kind==='file'?'selected':''}>Z′, Y′ από αρχείο (.mat)</option></select></label>
     <label>Έτοιμη γραμμή <select data-preset><option value="">—</option>${Object.entries(P.TLM_TYPICAL).map(([k,v])=>`<option value="${k}">${esc(v.name)}</option>`).join('')}<option value="empty">Κενή</option></select></label>
     <label>Μήκος (km) <input data-p="len" value="${esc(p.len)}" style="width:70px"></label>
     <label>Μοντέλο <select data-p="model"><option value="cp" ${model==='cp'?'selected':''}>CP (σταθερές παράμετροι)</option><option value="fd" ${model==='fd'?'selected':''}>FD (J. Marti)</option><option value="pi" ${model==='pi'?'selected':''}>π ονομαστικό</option><option value="wb" ${model==='wb'?'selected':''}>WB (wideband, ULM)</option></select></label>
     <span class="small${status?.bad||(!status&&tm.err)?' bad':''}" data-msg>${status?esc(status.t):tm.err?'⚠ '+esc(tm.err):'✓ Το μοντέλο είναι ενημερωμένο.'}</span></div>
    <div data-pane>${pane(tab,p,model,kind)}</div></div></div>`;
   charts=[];wireCommon();wirePane(tab);};
  // ---- the panes
  const pane=(t,p,model,kind)=>{
   if(t==='data'){const right=kind==='oh'?`<div class="ld-draww" data-draw></div>${VIEW.legend?legendHTML(d,hide):''}${VIEW.side?sideSVG(d):''}
     <p class="small muted">Ροδέλα: μεγέθυνση· σύρσιμο στο κενό: μετακίνηση· σύρσιμο αγωγού: νέα θέση (Shift: μόνο σε έναν άξονα, Ctrl+Z: αναίρεση). Το μέσο ύψος είναι (2·h_μέσο + h_πύργου)/3. Οι αγωγοί της ίδιας φάσης ενώνονται, οι αγωγοί προστασίας γειώνονται σε κάθε πύργο.</p>`
     :kind==='cab'?`<div class="ld-draww" data-draw></div>${VIEW.legend?legendHTML(d,hide):''}${xsSVG(d,Math.min(xsI,(d.cables||[]).length-1))}<p class="small muted">Βρόχοι αγωγός–επόμενος αγωγός με συναρτήσεις Bessel (επιδερμικό φαινόμενο σε κάθε σωλήνα), επιστροφή από το έδαφος κατά Pollaczek (ή στρωματωμένο έδαφος), από τη θάλασσα ως άπειρο μέσο, ή από το έδαφος με είδωλα για καλώδια στον αέρα. Οι αγωγοί με φάση 0 γειώνονται στα δύο άκρα (χωρίς μετάθεση θωρακίσεων). Τα ημιαγώγιμα στρώματα ενώνονται με τη μόνωση με διόρθωση του ε_r (Line/Cable Data σ. 8).</p>`:'';
    const tools=kind==='oh'||kind==='cab'?`<div class="ld-row ld-dtools"><button data-fit title="Όλο στο πλαίσιο">⤢ Όλο</button><button data-undo ${undo.length?'':'disabled'} title="Αναίρεση (Ctrl+Z)">↶ Αναίρεση</button>
      <button data-view title="Ρυθμίσεις εμφάνισης">⚙ Εμφάνιση</button><button data-dsvg>SVG</button><button data-dpng>PNG</button></div>${viewPanel(kind)}`:'';
    const left=kind==='seq'?seqForm(d):kind==='file'?fileForm(d):kind==='cab'?`<h3>Μέσο</h3><div class="ld-row"><label>Επιστροφή <select data-d="medium">${MEDIUM.map(([k,l])=>`<option value="${k}" ${(d.medium||'earth')===k?'selected':''}>${esc(l)}</option>`).join('')}</select></label>
       <label>ρ (Ω·m) <input data-d="rho" value="${esc(d.rho??(d.medium==='sea'?0.2:100))}" style="width:60px"></label>
       <label title="Πρόσθετη αγωγιμότητα στη διαγώνιο· οι απώλειες της μόνωσης είναι ήδη στο tanδ">G (S/km) <input data-d="G" value="${esc(Array.isArray(d.G)?'':d.G??'')}" placeholder="0" style="width:64px"></label></div>${optsForm(d)}
      <h3>Καλώδια <small class="muted">στρώματα από μέσα προς τα έξω· ακτίνες σε mm</small></h3>${cableTables(d,sel)}<button data-addc>+ Καλώδιο</button>`
     :`<h3>Έδαφος</h3><div class="ld-row"><label>ρ (Ω·m) <input data-d="rho" value="${esc(d.rho??100)}" style="width:60px"></label>
       <label>Επιστροφή <select data-d="earth">${EARTH.map(([k,l])=>`<option value="${k}" ${(d.earth||'carson')===k?'selected':''}>${esc(l)}</option>`).join('')}</select></label>
       <label><input type="checkbox" data-d="skin" ${d.skin===false?'':'checked'}> Επιδερμικό φαινόμενο</label><label title="Διαγώνιος του G των φάσεων, προεπιλογή 0,2·10⁻⁹ S/km (EMTP)">G (S/km) <input data-d="G" value="${esc(Array.isArray(d.G)?'':d.G??'')}" placeholder="0.2e-9" style="width:64px"></label></div>${optsForm(d)}
      <h3>Αγωγοί (απλοί) <small class="muted">φάση 0 = αγωγός προστασίας· ίδια φάση = παράλληλοι</small></h3><div class="ld-scroll">${table(d.wires,WCOL,'w',sel)}</div><button data-add="w">+ Αγωγός</button>
      <h3>Δέσμες (συμμετρικές)</h3><div class="ld-scroll">${table(d.bundles,BCOL,'b',sel)}</div><button data-add="b">+ Δέσμη</button>`;
    return right?`<div class="ld-grid"><div class="ld-left">${left}</div><div class="ld-right">${tools}${right}</div></div>`:left;}
   if(t==='model'&&model==='wb'){let m=null;try{m=JSON.parse(p.mdl||'null');}catch(e){}
    return wbPane(p)+`<div data-rep>${last?reportHTML(last,last.mdl,last.curves):m&&m.type==='wb'&&m.src===P.tlmKey(p)?wbReport(m,null):''}</div>`;}
   if(t==='model'){const fd=model==='fd',pi=model==='pi';
    return `<div class="ld-row">${fd?`<label>f_min (Hz) <input data-p="fmin" value="${esc(p.fmin)}" style="width:60px"></label><label>Δεκάδες <input data-p="dec" value="${esc(p.dec)}" style="width:40px"></label><label>Σημεία/δεκάδα <input data-p="ppd" value="${esc(p.ppd)}" style="width:40px"></label>
      <label>f του T_i (Hz) <input data-p="fti" value="${esc(p.fti)}" style="width:60px" ${p.tiauto==='1'?'disabled':''}></label><label title="Η συχνότητα με το μικρότερο σφάλμα του σταθερού T_i στη ζώνη 500 Hz – 5 kHz (FMATRX αυτόματα)"><input type="checkbox" data-p="tiauto" ${p.tiauto==='1'?'checked':''}> αυτόματα</label>
      <label title="Μέγιστο πλήθος πόλων ανά συνάρτηση">πόλοι ≤ <input data-p="nmax" value="${esc(p.nmax??30)}" style="width:40px"></label>`
      :`<label>Συχνότητα του ${pi?'π':'CP'} (Hz) <input data-p="f" value="${esc(p.f)}" style="width:70px"></label>${pi?`<label title="Το π σε N ίδια τμήματα (τουλάχιστον 5–10 ανά μήκος κύματος της υψηλότερης συχνότητας που μετρά)">Τμήματα <input data-p="npi" value="${esc(p.npi??1)}" style="width:44px"></label>`
      :`<label>CP <select data-p="cp">${CPK.map(([k,l])=>`<option value="${k}" ${(p.cp||'lumped')===k?'selected':''}>${esc(l)}</option>`).join('')}</select></label>`}`}
     ${pi?'':`<label title="Πώς γίνεται πραγματικός ο T_i (Line/Cable Data σ. 12–15)">T_i <select data-p="ti">${Object.entries(TIK).map(([k,l])=>`<option value="${k}" ${(p.ti||'gm0')===k?'selected':''}>${esc(l)}</option>`).join('')}</select></label>`}</div>
    <div class="ld-actions"><button class="primary-ghost" data-run>Υπολογισμός</button><span class="small muted">${fd?'Προσαρμογή με ρητές συναρτήσεις πραγματικών πόλων (J. Marti, vector fitting), σταθερός πραγματικός T_i.':pi?'Το π λύνεται με τα συζευγμένα R, L, C του λύτη· για μόνιμη κατάσταση και γραμμές μικρές ως προς το μήκος κύματος.':'Κάθε ρυθμός μια γραμμή Bergeron· οι απώλειες R/4 – R/2 – R/4, ή χωρίς, ή ως εξασθένηση χωρίς παραμόρφωση.'}</span></div>
    <div data-rep>${last?reportHTML(last,last.mdl,last.curves):''}</div>`;}
   if(t==='graphs'){const doms=Object.entries(Q).filter(([k])=>k!=='fit'||sc?.fit).filter(([k])=>k!=='sym'||!sc||sc.S);if(!doms.some(([k])=>k===G.dom)||!Q[G.dom].q[G.qty]){G.dom='modes';G.qty='Zc';}
    return `<div class="ld-row">${scanBar()}</div>${sc?`<div class="ld-row"><label>Πεδίο <select data-g="dom">${doms.map(([k,v])=>`<option value="${k}" ${G.dom===k?'selected':''}>${esc(v.t)}</option>`).join('')}</select></label>
     <label>Μέγεθος <select data-g="qty">${Object.entries(Q[G.dom].q).map(([k,v])=>`<option value="${k}" ${G.qty===k?'selected':''}>${esc(v[0])}${v[1]?' ('+esc(v[1])+')':''}</option>`).join('')}</select></label>
     <label>Μορφή <select data-g="form">${FORMS.map(([k,l])=>`<option value="${k}" ${G.form===k?'selected':''}>${esc(l)}</option>`).join('')}</select></label>
     ${G.dom==='modes'||G.dom==='exact'?`<label title="Οι ακριβείς ρυθμοί (μιγαδικός T_i(f)) διακεκομμένοι πάνω στους ρυθμούς του σταθερού T_i"><input type="checkbox" data-g="cmp" ${G.cmp?'checked':''}> σύγκριση σταθερού / ακριβούς</label>`:''}
     <span class="small muted">T_i ${esc(TIK[sc.ti]||sc.ti)} στα ${fmt(sc.fti)} Hz · ${sc.f.length} συχνότητες · μήκος ${fmt(sc.length)} km</span></div>
     <div class="ld-row"><button data-refkeep title="4.12: κράτα αυτή τη σάρωση· άλλαξε τη διάταξη ή τις επιλογές, σάρωσε ξανά, και η κρατημένη φαίνεται διακεκομμένη στα ίδια γραφήματα">Κράτα ως αναφορά</button>
      ${refSc?`<label><input type="checkbox" data-g="ref" ${G.ref!==false?'checked':''}> σύγκριση με την αναφορά <small class="muted">(${esc(refSc.lab)})</small></label><button data-refdrop>Χωρίς αναφορά</button>`:''}</div>
     <div class="ld-chartw" data-chart></div><p class="small muted">${G.dom==='ti'?'Η απόκλιση μεγαλώνει πολύ σε υψηλές συχνότητες όπου οι ρυθμοί εκφυλίζονται (ίδια ταχύτητα): εκεί η επιλογή των στηλών είναι αυθαίρετη και το σφάλμα δεν μετρά· μετρά το q-error και οι δοκιμές Q-error (καρτέλα «Πίνακες»). ':''}Σύρσιμο: μεγέθυνση στη ζώνη· διπλό κλικ: όλο το εύρος· κλικ στο υπόμνημα: κρύψε/δείξε (Shift: μόνο αυτή).</p>`:''}
     <h3>Ευαισθησία των ακολουθιών <small class="muted">(4.12, τρεις φάσεις)</small></h3><div class="ld-row">
      <label>Παράμετρος <select data-sp="param">${SENS.map(([k,l])=>`<option value="${k}" ${SP.param===k?'selected':''}>${esc(l)}</option>`).join('')}</select></label>
      <label>από <input data-sp="lo" value="${esc(SP.lo)}" style="width:54px"></label><label>έως <input data-sp="hi" value="${esc(SP.hi)}" style="width:54px"></label>
      <label>σημεία <input data-sp="n" value="${esc(SP.n)}" style="width:36px"></label><label>f (Hz) <input data-sp="f" value="${esc(SP.f)}" style="width:44px"></label>
      <label>Μέγεθος <select data-sp="qty">${[['RX','R και X (Ω/km)'],['C','C (nF/km)'],['B','B (μS/km)']].map(([k,l])=>`<option value="${k}" ${SP.qty===k?'selected':''}>${l}</option>`).join('')}</select></label>
      <button data-sens ${sensBusy?'disabled':''}>${sensBusy?'Υπολογισμός…':'Σάρωση ευαισθησίας'}</button><span class="small ${sensErr?'bad':'muted'}">${sensErr?'⚠ '+esc(sensErr):'Οι παράμετροι ακολουθιών (θετική, μηδενική) καθώς αλλάζει μία παράμετρος, όπως τα σχήματα ευαισθησίας του Part I.'}</span></div>
     ${sens?'<div class="ld-chartw" data-schart></div>':''}`;}
   if(t==='tables')return `<div class="ld-row">${scanBar()}</div><div class="ld-row"><label title="4.12 (line_constants §5.2): η τελευταία φάση των δεδομένων είναι η γραμμή τηλεπικοινωνιών· οι άλλες φάσεις με συμμετρικά ρεύματα I και τάσεις U/√3"><input type="checkbox" data-tel ${VIEW.tel?'checked':''}> Η τελευταία φάση είναι γραμμή τηλεπικοινωνιών</label></div><div data-tables>${tablesHTML(sc)}</div>`;
   if(t==='export'){const tm=P.tlmModel(p),ok=!tm.err&&!tm.need;
    return `<div class="ld-row">${scanBar()}</div><h3>Αναφορά</h3><div class="ld-row ld-ex"><button data-ex="html">Αναφορά HTML</button><button data-ex="pdf">PDF (γραφήματα, matplotlib)</button><span class="small muted">Η αναφορά HTML τυπώνεται σε PDF από τον browser· έχει πίνακες, ακολουθίες, χρήσιμα μεγέθη, ρυθμούς, Q-error, μοντέλο και γραφήματα.</span></div>
     <h3>Δεδομένα</h3><div class="ld-row ld-ex"><button data-ex="csv">CSV (όλα τα μεγέθη)</button><label><select data-csvform><option value="magang">μέτρο και γωνία</option><option value="reim">Re και Im</option></select></label><label><select data-csvsep><option value=",">«,» και «.»</option><option value=";">«;» και «,» (Excel ελληνικά)</option></select></label>
      <button data-ex="json">JSON (η σάρωση)</button><button data-ex="mat">MATLAB .mat</button><span class="small muted">Το .mat έχει Z, Y, f, line_length όπως το θέλει το Line/Cable Data (§2.4.1), και όλα τα υπόλοιπα.</span></div>
     <h3>Αρχεία μοντέλου στη μορφή του EMTP</h3><div class="ld-row ld-ex"><button data-ex="exact_pi">Exact-PI (.mod)</button><button data-ex="nominal_pi">Nominal-PI (.mod)</button><button data-ex="fd_mod" ${ok&&model==='fd'?'':'disabled'}>FD (.mod)</button><button data-ex="cp_netlist" ${ok&&model==='cp'?'':'disabled'}>CP (netlist _TLM)</button><button data-ex="wb_mod" ${ok&&model==='wb'?'':'disabled'}>WB (_WB.mod)</button>
      <span class="small muted">Όπως τα περιγράφουν το Line/Cable Data (σ. 17–18), οι επιλογές του Line Model (σ. 2–6) και το CP m-phase (σ. 10)· ξαναδιαβάζονται από το pcl.linereport. Πόλοι και υπόλοιπα του FD σε rad/s· το _WB.mod στη διάταξη του WB fitter (ξαναδιαβάζεται εδώ με «Μοντέλο WB από: αρχείο του EMTP»).</span></div>
     <h3>Python</h3><div class="ld-row ld-ex"><button data-ex="script">Script Python</button><button data-topy>Στην Python (σύνδεση)</button><span class="small muted" data-pymsg>Το script ξαναϋπολογίζει τα πάντα με το pcl.lineconst και σχεδιάζει με τα πρότυπα του pcl.plotting.</span></div>
     <div class="ld-row"><label>Πρότυπο γραφημάτων <select data-preset2>${['ieee','thesis','slides','lab'].map(k=>`<option ${store.get('preset','ieee')===k?'selected':''}>${k}</option>`).join('')}</select></label></div>
     <pre class="ld-code" data-code>import pcl
app = pcl.link.connect()
d = app.line()                       # ό,τι έστειλε αυτό το παράθυρο («Στην Python»), ή app.line('${esc(id)}')
from pcl import lineconst as lc, linereport as lr
sc = lc.scan(d['data'], length=d['opts'].get('len', 100))
lr.plot(sc, [('modes', 'Zc'), ('modes', 'alpha')], preset='ieee', out='modes.pdf')</pre>`;}
   return '';};
  const scanBar=()=>`<button class="primary-ghost" data-scan ${scBusy?'disabled':''}>${scBusy?'Σάρωση…':sc?'Νέα σάρωση':'Σάρωση'}</button><span class="small ${scErr?'bad':'muted'}">${scErr?'⚠ '+esc(scErr):sc?(scanOld()?'⚠ Η σάρωση είναι παλιά (άλλαξαν δεδομένα ή επιλογές).':'✓ Η σάρωση αντιστοιχεί στα δεδομένα.'):'Όλα τα μεγέθη από f_min, δεκάδες και σημεία ανά δεκάδα του μοντέλου (καρτέλα «Μοντέλο»).'}</span>`;
  const viewPanel=kind=>`<div class="ld-viewp" data-viewp style="display:${store.get('viewp',false)?'':'none'}">
   ${[['dims','διαστάσεις'],['labels','ονόματα'],['legend','υπόμνημα'],['grid','πλέγμα'],['minsize','ελάχιστο μέγεθος'],['layers','στρώματα εδάφους'],...(kind==='oh'?[['side','πλάγια όψη']]:[])].map(([k,l])=>`<label><input type="checkbox" data-v="${k}" ${VIEW[k]?'checked':''}> ${l}</label>`).join('')}
   <label>Επικάλυψη <select data-v="ov">${[['none','—'],...(kind==='oh'?[['E','χάρτης |E|'],['B','χάρτης |B|'],['mode','μορφή ρυθμού']]:[]),['skin','βάθος διείσδυσης']].map(([k,l])=>`<option value="${k}" ${VIEW.ov===k?'selected':''}>${l}</option>`).join('')}</select></label>
   ${VIEW.ov==='E'||kind==='cab'?`<label>U (kV) <input data-v="U" value="${esc(VIEW.U)}" style="width:50px"></label>`:''}${VIEW.ov==='B'?`<label>I (A) <input data-v="I" value="${esc(VIEW.I)}" style="width:54px"></label>`:''}
   ${VIEW.ov==='skin'?`<label>f (Hz) <input data-v="f" value="${esc(VIEW.f)}" style="width:54px"></label>`:''}${VIEW.ov==='mode'?`<label>ρυθμός <input data-v="mode" value="${esc(VIEW.mode)}" style="width:36px"></label>`:''}
   ${(VIEW.ov==='E'||VIEW.ov==='B'||VIEW.ov==='mode')&&!sc?`<button data-scan>Σάρωση για την επικάλυψη</button>`:''}</div>`;
  // ---- the events
  const wireCommon=()=>{
   box.querySelector('[data-close]').onclick=close;box.onclick=e=>{if(e.target===box)close();};
   box.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;store.set('tab',tab);render();});
   box.querySelectorAll('[data-p]').forEach(el=>el.onchange=()=>{const k=el.dataset.p;let v=el.value;if(k==='tiauto')v=el.checked?'1':'0';else if(!['model','ti','cp',...WBSEL].includes(k)){const x=num(v);if(x===null){el.classList.add('bad');return;}v=x;}status=null;ctx.editor.setParams(id,{[k]:v});ctx.changed();later();});
   box.querySelector('[data-kind]').onchange=e=>{const want=e.target.value,now=isCable(d)?'cab':isSeq(d)?'seq':isFile(d)?'file':'oh';if(want===now)return;snap();
    d=want==='cab'?EMPTY_CAB():want==='seq'?EMPTY_SEQ():want==='file'?{zyfile:null}:EMPTY_OH();if(want==='cab')d.cables.push(NEW_CABLE());if(want==='file')d={zyfile:{f:[],Zr:[],Zi:[],Yr:[],Yi:[],unit:'km'}};norm();view=null;sel=null;saveData();later();};
   const pre=box.querySelector('[data-preset]');pre.onchange=()=>{if(!pre.value)return;snap();d=pre.value==='empty'?(isCable(d)?EMPTY_CAB():EMPTY_OH()):JSON.parse(JSON.stringify(P.TLM_TYPICAL[pre.value]));
    norm();view=null;sel=null;const L=d.length;ctx.editor.setParams(id,{data:JSON.stringify(d),...(L?{len:L}:{})});ctx.changed();later();};
   box.querySelectorAll('[data-scan]').forEach(b=>b.onclick=doScan);};
  const wirePane=t=>{if(t==='data')wireData();else if(t==='model')wireModel();else if(t==='graphs')wireGraphs();else if(t==='tables')wireTables();else if(t==='export')wireExport();};
  const wireModel=()=>{const wf=box.querySelector('[data-wbfile]');if(wf)wf.onchange=async()=>{const f=wf.files?.[0];if(!f)return;const t=await f.text();
    if(!/Number of\.? conductors/i.test(t)){status={t:'⚠ Δεν μοιάζει με αρχείο _WB.mod του EMTP.',bad:true};render();return;}
    ctx.editor.setParams(id,{wbtxt:t,wbref:`${f.name}|${t.length}|${hashText(t)}`,wsrc:'emtp'});ctx.changed();status={t:'Διαβάστηκε το '+f.name+'· πάτα «Υπολογισμός».'};render();};
   box.querySelector('[data-run]').onclick=async()=>{const msg=box.querySelector('[data-msg]');msg.textContent='Υπολογισμός…';msg.className='small';
    try{last=await compute(id,ctx);status={t:'✓ Υπολογίστηκε.'};render();}catch(e){status={t:'⚠ '+(e.message||e),bad:true};render();}};};
  // the drawing: zoom, pan, hover ↔ the table, drag
  const drawBox=()=>box.querySelector('[data-draw]');
  const drawNow=()=>{const el=drawBox();if(!el)return;const W=360,H=isCable(d)?240:300;if(!view)view=fitView(d,W,H);const ov={fields:sc?.fields,Ti:sc?.Ti||(()=>{try{return JSON.parse(pars().mdl).Ti;}catch(e){return null;}})()};
   el.innerHTML=(isCable(d)?cabSVG(d,view,W,H,hide,sel):ohSVG(d,view,W,H,ov,hide,sel))+'<div class="ld-dtip" style="display:none"></div>';wireDraw(el,W,H);};
  // the drag survives the redraws of the drawing (each move draws a new SVG)
  let drag=null;
  const wireDraw=(el,W,H)=>{const svg=el.querySelector('svg'),tip=el.querySelector('.ld-dtip'),cab=isCable(d);
   const pt=e=>{const r=svg.getBoundingClientRect();return [(e.clientX-r.left)/r.width*W,(e.clientY-r.top)/r.height*H];};
   const world=([px,py])=>cab?[view.cx+(px-W/2)/view.s,view.cy+(py-H/2)/view.s]:[view.cx+(px-W/2)/view.s,view.cy-(py-H/2)/view.s];
   svg.onwheel=e=>{e.preventDefault();const p=pt(e),w0=world(p),k=Math.exp(-e.deltaY*0.0015);view.s=Math.max(0.05,Math.min(1e6,view.s*k));const w1=world(p);view.cx+=w0[0]-w1[0];view.cy+=w0[1]-w1[1];drawNow();};
   svg.onmousedown=e=>{const tg=e.target.closest('[data-src]');const p=pt(e);e.preventDefault();
    if(tg){const src=tg.dataset.src;sel=src;snap();drag={src,p0:p,w0:world(p),moved:false,orig:src[0]==='c'?[+d.cables[+src.slice(1)].x,+d.cables[+src.slice(1)].y]:(()=>{const o=(src[0]==='w'?d.wires:d.bundles)[+src.slice(1)];return [+o.x,+o.y];})()};}
    else drag={pan:true,p0:p,c0:[view.cx,view.cy]};};
   svg.onmousemove=e=>{const p=pt(e);if(drag){if(drag.pan){view.cx=drag.c0[0]-(p[0]-drag.p0[0])/view.s;view.cy=drag.c0[1]+(cab?-1:1)*(p[1]-drag.p0[1])/view.s;drawNow();return;}
     const w=world(p);let dx=w[0]-drag.w0[0],dy=w[1]-drag.w0[1];if(e.shiftKey){if(Math.abs(dx)>Math.abs(dy))dy=0;else dx=0;}
     const step=cab?0.005:0.05,q=v=>Math.round(v/step)*step,nx=+q(drag.orig[0]+dx).toFixed(4),ny=+q(drag.orig[1]+dy).toFixed(4);
     if(Math.hypot(p[0]-drag.p0[0],p[1]-drag.p0[1])>2)drag.moved=true;if(!drag.moved)return;
     const o=drag.src[0]==='c'?d.cables[+drag.src.slice(1)]:(drag.src[0]==='w'?d.wires:d.bundles)[+drag.src.slice(1)];
     if(!cab&&drag.src[0]!=='c'){const dyv=ny-+o.y;o.x=nx;o.y=ny;if(o.ymid!=null&&o.ymid!=='')o.ymid=+(+o.ymid+dyv).toFixed(4);}else{o.x=nx;o.y=ny;}drawNow();return;}
    const tg=e.target.closest('[data-src]');box.querySelectorAll('[data-row].hl').forEach(r=>{if(r.dataset.row!==sel)r.classList.remove('hl');});
    if(tg){const src=tg.dataset.src;box.querySelector(`[data-row="${src}"]`)?.classList.add('hl');tip.style.display='';tip.innerHTML=tipHTML(tg);const r=svg.getBoundingClientRect();
     tip.style.left=Math.min(r.width-170,(p[0]/W)*r.width+12)+'px';tip.style.top=((p[1]/H)*r.height+12)+'px';}else tip.style.display='none';};
   svg.onmouseleave=()=>{tip.style.display='none';};
   const up=()=>{if(!drag)return;const was=drag;drag=null;if(was.src){if(was.moved){saveData();}else undo.pop();if(was.src[0]==='c')xsI=+was.src.slice(1);later();}};
   svg.onmouseup=up;svg.onmouseleave=()=>{tip.style.display='none';up();};};
  const tipHTML=tg=>{const src=tg.dataset.src;if(src[0]==='c'){const i=+src.slice(1),cb=d.cables[i],ls=cb.layers||[];return `<b>K${i+1}</b> · x ${fmt(+cb.x)} m · ${+cb.y<0?'ύψος '+fmt(-cb.y):'βάθος '+fmt(+cb.y)} m<br>φάσεις ${[].concat(cb.ph??[]).join(', ')} · ${ls.length} στρώματα · Ø ${fmt(2*Math.max(...ls.map(l=>+l.rout||0))*1000)} mm`;}
   const o=(src[0]==='w'?d.wires:d.bundles)[+src.slice(1)],cs=expand(d),ci=+tg.dataset.ci,cc=cs[ci];
   return `<b>${src[0]==='w'?'W':'B'}${+src.slice(1)+1}</b> · ${+o.ph?'φάση '+o.ph:'αγωγός προστασίας'}<br>x ${fmt(cc.x)} m · ύψος ${fmt(cc.y)} m (πύργος)${o.ymid!=null&&o.ymid!==''?', '+fmt(+o.ymid)+' m (μέσο)':''}<br>r ${fmt(+o.r)} cm${o.Rdc!=null&&o.Rdc!==''?' · R_dc '+fmt(+o.Rdc)+' Ω/km':o.rho?' · ρ '+fmt(+o.rho)+' Ω·m':''}${src[0]==='b'?' · '+o.n+' αγωγοί σε ακτίνα '+fmt(+o.R)+' cm':''}`;};
  const wireData=()=>{drawNow();const el=drawBox();
   const vb=box.querySelector('[data-view]');if(vb)vb.onclick=()=>{const v=box.querySelector('[data-viewp]'),on=v.style.display==='none';v.style.display=on?'':'none';store.set('viewp',on);};
   box.querySelector('[data-fit]')?.addEventListener('click',()=>{view=null;drawNow();});
   box.querySelector('[data-undo]')?.addEventListener('click',doUndo);
   box.querySelector('[data-dsvg]')?.addEventListener('click',()=>{const s=drawBox()?.querySelector('svg');if(s)download((c.label||c.id)+'_drawing.svg',svgText(s),'image/svg+xml');});
   box.querySelector('[data-dpng]')?.addEventListener('click',()=>{const s=drawBox()?.querySelector('svg');if(s)svgPng(s,(c.label||c.id)+'_drawing.png',3);});
   box.querySelectorAll('[data-v]').forEach(i=>i.onchange=()=>{const k=i.dataset.v;VIEW[k]=i.type==='checkbox'?i.checked:['ov'].includes(k)?i.value:(num(i.value)??VIEW[k]);saveView();
    if((k==='ov'&&['E','B','mode'].includes(VIEW.ov)&&!sc&&isOH(d)))doScan();else later();});
   box.querySelectorAll('[data-hide]').forEach(sp=>sp.onclick=()=>{const k=sp.dataset.hide;if(hide.has(k))hide.delete(k);else hide.add(k);later();});
   box.querySelectorAll('[data-row]').forEach(r=>{r.onmouseenter=()=>{const s=drawBox()?.querySelectorAll(`[data-src="${r.dataset.row}"]`);s?.forEach(n=>{n.setAttribute('stroke','#111');n.setAttribute('stroke-width','1.6');});};
    r.onmouseleave=()=>{if(sel!==r.dataset.row)drawNow();};});
   const det=box.querySelector('.ld-more');if(det)det.ontoggle=()=>store.set('more',det.open);
   box.querySelectorAll('[data-t]').forEach(el=>el.onchange=()=>{const arr=el.dataset.t==='w'?d.wires:d.bundles,o=arr[+el.dataset.i],k=el.dataset.c,v=el.value.trim();snap();
    if(k==='zi'){if(v==='tube')delete o.zi;else o.zi=v;}else if(k==='xmode'){o.xmode=v;}
    else if(v===''&&['ymid','Rdc','rho','mur','tD','ns','gmr','gmrr','xu'].includes(k)){delete o[k];}
    else{const x=num(v);if(x===null){el.classList.add('bad');undo.pop();return;}o[k]=k==='ph'||k==='n'||k==='ns'?Math.round(x):x;if(k==='rho'&&o.Rdc!=null&&o.Rdc!=='')delete o.Rdc;if(k==='Rdc')delete o.rho;}
    el.classList.remove('bad');saveData();later();});
   box.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{snap();const t=b.dataset.del[0],i=+b.dataset.del.slice(1);(t==='w'?d.wires:d.bundles).splice(i,1);sel=null;saveData();later();});
   box.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{snap();if(b.dataset.add==='w'){const l=d.wires[d.wires.length-1];d.wires.push(l?{...l,x:+l.x+2}:{ph:1,x:0,y:15,r:1,Rdc:0.1,tD:0.5});}
    else{const l=d.bundles[d.bundles.length-1];d.bundles.push(l?{...l,x:+l.x+8,ph:(+l.ph||0)+1}:{ph:1,x:0,y:15,n:2,R:20,ang:0,r:1.5,Rdc:0.06,tD:0.33});}saveData();later();});
   box.querySelectorAll('[data-d]').forEach(el=>el.onchange=()=>{const k=el.dataset.d,v=el.value.trim();snap();if(k==='skin')d.skin=el.checked;else if(k==='earth'||k==='loss')d[k]=el.value;else if(k==='xbond'){if(el.value==='none')delete d.xbond;else d.xbond=el.value;}
    else if(k==='medium'){const was=d.medium||'earth';d.medium=el.value;if(el.value==='sea'&&was!=='sea')d.rho=0.2;else if(was==='sea'&&el.value!=='sea')d.rho=100;}
    else if(['G','mur_e','fg0','rho2','dsoil','temp'].includes(k)&&v===''){delete d[k];}else{const x=num(v);if(x===null){el.classList.add('bad');undo.pop();return;}d[k]=x;}saveData();later();});
   box.querySelectorAll('[data-o]').forEach(el=>el.onchange=()=>{const k=el.dataset.o,v=el.value.trim();snap();
    if(k==='two'){if(el.checked){d.rho2=d.rho2??(+d.rho||100)*10;d.dsoil=d.dsoil??5;}else{delete d.rho2;delete d.dsoil;}}
    else if(k==='iseg'){if(el.checked)d.iseg=true;else delete d.iseg;}
    else if(k==='Gl'){if(!v)delete d.G;else{const l=v.split(/[\s,;]+/).filter(Boolean).map(num);if(l.some(x=>x===null)){el.classList.add('bad');undo.pop();return;}d.G=l.length===1?l[0]:l;}}
    else if(k==='tr'){if(el.checked){const M=P.tlmM({data:JSON.stringify(d)}),o=[...Array(M)].map((_,i)=>i+1);d.transp={len:[1,1,1],order:[o,o.map((_,i)=>o[(i+1)%M]),o.map((_,i)=>o[(i+2)%M])],mode:'avg'};}else delete d.transp;}
    else if(k==='trlen'){const l=v.split(/[\s,;]+/).filter(Boolean).map(num);if(!l.length||l.some(x=>!(x>0))){el.classList.add('bad');undo.pop();return;}d.transp.len=l;}
    else if(k==='trmode'){d.transp.mode=v==='sec'?'sec':'avg';}
    else if(k==='trord'){const l=v.split(';').map(s=>s.trim()).filter(Boolean).map(s=>s.split(/[\s,]*/).filter(Boolean).map(Number));if(!l.length||l.some(o=>o.some(x=>!(x>=1)))){el.classList.add('bad');undo.pop();return;}d.transp.order=l;}
    saveData();later();});
   box.querySelectorAll('[data-q]').forEach(el=>el.onchange=()=>{const k=el.dataset.q,v=el.value.trim();snap();const q=d.seq;if(k==='mode')q.mode=v;else if(v===''&&['G0','G1','h'].includes(k))delete q[k];
    else{const x=num(v);if(x===null){el.classList.add('bad');undo.pop();return;}q[k]=k==='M'?Math.round(x):x;}saveData();later();});
   const zf=box.querySelector('[data-zyf]');if(zf)zf.onchange=async()=>{const f=zf.files[0];if(!f)return;const msg=box.querySelector('[data-msg]');msg.textContent='Ανάγνωση του αρχείου…';
    try{const buf=new Uint8Array(await f.arrayBuffer());let bin='';for(let i=0;i<buf.length;i+=0x8000)bin+=String.fromCharCode(...buf.subarray(i,i+0x8000));
     const r=await ctx.api('line_load',{base64:btoa(bin),unit:box.querySelector('[data-zyu]').value});snap();d={zyfile:r.zyfile};if(r.zyfile.length)ctx.editor.setParams(id,{len:r.zyfile.length});saveData();later();}
    catch(e){status={t:'⚠ '+(e.message||e),bad:true};later();}};
   const zu=box.querySelector('[data-zyu]');if(zu)zu.onchange=()=>{if(d.zyfile){d.zyfile.unit=zu.value;saveData();later();}};
   // cables: position, phases, layers (radii typed in mm, kept in m), materials
   box.querySelectorAll('[data-k]').forEach(el=>el.onchange=()=>{const i=+el.dataset.i,k=el.dataset.c,cb=d.cables[i],v=el.value.trim();snap();
    if(el.dataset.k==='cab'){if(k==='ph'){const l=phList(v);if(!l.length){el.classList.add('bad');undo.pop();return;}cb.ph=l;}else{const x=num(v);if(x===null){el.classList.add('bad');undo.pop();return;}cb[k]=x;}}
    else{const l=cb.layers[+el.dataset.j];if(k==='t'){l.t=v;delete l.mat;if(v==='c'){delete l.epsr;delete l.tand;l.rho=l.rho??1.72e-8;}else{delete l.rho;delete l.rin;l.epsr=l.epsr??2.3;if(v==='s')delete l.tand;}}
     else if(k==='mat'){if(!v)delete l.mat;else{const m=MATS[v];l.mat=v;for(const q of ['rho','epsr','tand','mur'])if(m[q]!=null)l[q]=m[q];}}
     else if(v===''&&(k==='mur'||k==='tand'||k==='rin'))delete l[k];
     else{const x=num(v);if(x===null||x<0){el.classList.add('bad');undo.pop();return;}l[k]=k==='rin'||k==='rout'?x/1000:x;if(['rho','epsr','tand','mur'].includes(k))delete l.mat;}}
    el.classList.remove('bad');saveData();later();});
   box.querySelectorAll('[data-delc]').forEach(b=>b.onclick=()=>{snap();d.cables.splice(+b.dataset.delc,1);xsI=0;sel=null;saveData();later();});
   box.querySelectorAll('[data-xs]').forEach(b=>b.onclick=()=>{xsI=+b.dataset.xs;sel='c'+xsI;later();});
   box.querySelectorAll('[data-dell]').forEach(b=>b.onclick=()=>{snap();const [i,j]=b.dataset.dell.split(',').map(Number);d.cables[i].layers.splice(j,1);saveData();later();});
   box.querySelectorAll('[data-addl]').forEach(b=>b.onclick=()=>{snap();const ls=d.cables[+b.dataset.addl].layers,l=ls[ls.length-1],r=l?+l.rout:0;
    ls.push(!l||(l.t||'c')!=='c'?{t:'c',rout:r+0.002,rho:1.72e-8}:{t:'i',rout:r+0.004,epsr:2.3});saveData();later();});
   const addc=box.querySelector('[data-addc]');if(addc)addc.onclick=()=>{snap();const l=d.cables[d.cables.length-1],M=Math.max(0,...d.cables.flatMap(c=>[].concat(c.ph??[]).map(Number)));
    const c=l?JSON.parse(JSON.stringify(l)):NEW_CABLE();if(l){c.x=+l.x+2*Math.max(...l.layers.map(q=>+q.rout||0));c.ph=[].concat(l.ph).map((v,k)=>k===0?M+1:+v);}else c.x=0;d.cables.push(c);view=null;saveData();later();};};
  // the charts of the scan
  const wireGraphs=()=>{box.querySelectorAll('[data-g]').forEach(el=>el.onchange=()=>{const k=el.dataset.g;G[k]=el.type==='checkbox'?el.checked:el.value;if(k==='dom'){G.qty=Object.keys(Q[G.dom].q)[0];}store.set('graph',G);render();});
   const rk=box.querySelector('[data-refkeep]');if(rk)rk.onclick=()=>{if(!sc)return;const t=new Date();refSc={sc,lab:`${t.getHours()}:${String(t.getMinutes()).padStart(2,'0')}:${String(t.getSeconds()).padStart(2,'0')}`};G.ref=true;render();};
   const rd=box.querySelector('[data-refdrop]');if(rd)rd.onclick=()=>{refSc=null;render();};
   box.querySelectorAll('[data-sp]').forEach(el=>el.onchange=()=>{const k=el.dataset.sp;if(k==='param'||k==='qty'){SP[k]=el.value;if(k==='param'){[SP.lo,SP.hi]=SENS_DEF[el.value];}}else{const x=num(el.value);if(x===null){el.classList.add('bad');return;}SP[k]=k==='n'?Math.round(x):x;}store.set('sens',SP);if(k!=='qty')sens=null;render();});
   const sb=box.querySelector('[data-sens]');if(sb)sb.onclick=async()=>{if(sensBusy)return;sensBusy=true;sensErr=null;render();
    try{sens=await ctx.api('line_sens',{data:d,param:SP.param,lo:SP.lo,hi:SP.hi,n:SP.n,f:SP.f});}catch(e){sensErr=e.message||String(e);sens=null;}sensBusy=false;if(box.isConnected)render();};
   const se=box.querySelector('[data-schart]');if(se&&sens){const rows=sens.rows,x=rows.map(r=>r.v),lab=(SENS.find(q=>q[0]===sens.param)||[,''])[1];
    const S=SP.qty==='C'?[['C1','C₁','#147966'],['C0','C₀','#b5472c']]:SP.qty==='B'?[['B1','B₁','#147966'],['B0','B₀','#b5472c']]:[['R1','R₁','#147966'],['X1','X₁','#2f5fa0'],['R0','R₀','#b5472c'],['X0','X₀','#8a5a00']];
    charts.push(mountChart(se,{id:'ldsens',x,xlog:sens.param==='rho',xlab:lab,ylab:SP.qty==='C'?'C (nF/km)':SP.qty==='B'?'B (μS/km)':'Ω/km',ylog:false,title:`Ακολουθίες στα ${fmt(sens.f)} Hz συναρτήσει: ${lab}`,
     series:S.map(([k,n,col])=>({name:n,y:rows.map(r=>r[k]),color:col})),file:`${c.label||c.id}_sens_${sens.param}`}));}
   const el=box.querySelector('[data-chart]');if(!el||!sc)return;const [title,unit]=Q[G.dom].q[G.qty];let ss=seriesOf(sc,G.dom,G.qty);
   const offs=store.get('off:'+G.dom+G.qty,[]);
   let series=ss.map((s,k)=>({name:s.name,y:valOf(s,G.form),color:SC[(s.mate!=null?ss[s.mate].el?.[0]:s.el?.[0]??k)%SC.length],dash:s.dash,mate:s.mate,off:offs.includes(s.name)}));
   if(G.dom==='phase'||G.dom==='sym'||(G.dom==='ti'&&G.qty==='ti'))series.forEach((s,k)=>{s.color=SC[k%SC.length];});
   if((G.dom==='modes'||G.dom==='exact')&&G.cmp){const other=G.dom==='modes'?'exact':'modes';const s2=seriesOf(sc,other,G.qty);
    series=series.concat(s2.map((s,k)=>({name:s.name+(other==='exact'?' (ακριβής)':' (σταθερός T_i)'),y:valOf(s,G.form),color:SC[k%SC.length],dash:true,off:offs.includes(s.name+(other==='exact'?' (ακριβής)':' (σταθερός T_i)'))})));}
   if(refSc&&G.ref!==false&&refSc.sc.M===sc.M){try{const rs=seriesOf(refSc.sc,G.dom,G.qty);
    series=series.concat(rs.map((s,k)=>({name:s.name+' (αναφορά)',y:onF(sc.f,refSc.sc.f,valOf(s,G.form)),color:series[k]?.color||SC[k%SC.length],dash:true,off:offs.includes(s.name+' (αναφορά)')})));}catch(e){}}
   const anyC=ss.some(s=>s.im),ylab=(anyC?(G.form==='ang'?'∠':G.form==='re'?'Re ':G.form==='im'?'Im ':'|')+title+(G.form==='mag'?'|':''):title)+(G.form==='ang'&&anyC?' (°)':unit?' ('+unit+')':'');
   charts.push(mountChart(el,{id:'ldc'+id.replace(/\W/g,''),x:sc.f,series,ylab,ylog:G.form==='mag'||!anyC?'auto':false,title:`${Q[G.dom].t}: ${ylab}`,file:`${c.label||c.id}_${G.dom}_${G.qty}`,
    onToggle:s=>store.set('off:'+G.dom+G.qty,s.filter(q=>q.off).map(q=>q.name))}));};
  const wireTables=()=>{const tl=box.querySelector('[data-tel]');if(tl)tl.onchange=()=>{VIEW.tel=tl.checked;saveView();render();};
   box.querySelectorAll('[data-U]').forEach(i=>i.onchange=()=>{const x=num(i.value);if(x>0){VIEW.U=x;saveView();later();}});
   box.querySelectorAll('[data-I]').forEach(i=>i.onchange=()=>{const x=num(i.value);if(x>0){VIEW.I=x;saveView();later();}});
   const F=sc?.fields;if(F){const kE=VIEW.U/F.U,kB=VIEW.I/F.I,lim=F.limits||{};
    charts.push(mountChart(box.querySelector('[data-fE]'),{id:'ldfe',x:F.x,xlog:false,xlab:'x (m)',ylab:'E (kV/m)',ylog:false,title:`|E| στα ${fmt(F.height)} m για U = ${fmt(VIEW.U)} kV`,
     series:[{name:'E (κύριος άξονας)',y:F.E.map(v=>v*kE),color:'#147966'}],refs:lim.E?[{y:lim.E,t:'ICNIRP 2010: 5 kV/m'}]:null,file:'E_profile'}));
    charts.push(mountChart(box.querySelector('[data-fB]'),{id:'ldfb',x:F.x,xlog:false,xlab:'x (m)',ylab:'B (μT)',ylog:false,title:`|B| στα ${fmt(F.height)} m για I = ${fmt(VIEW.I)} A`,
     series:[{name:'B (κύριος άξονας)',y:F.B.map(v=>v*kB),color:'#2f5fa0'}],refs:lim.B?[{y:lim.B,t:'ICNIRP 2010: 200 μT'}]:null,file:'B_profile'}));}};
  const expReq=fmt_=>{const p=pars(),q={...scanReq(),fmt:fmt_,name:String(c.label||c.id),model:p.model,cp:p.cp,npi:num(p.npi),U:VIEW.U,preset:store.get('preset','ieee')};
   try{const m=JSON.parse(p.mdl||'null');if(m&&m.src===P.tlmKey(p))q.mdl=m;}catch(e){}return q;};
  const wireExport=()=>{const pr=box.querySelector('[data-preset2]');if(pr)pr.onchange=()=>store.set('preset',pr.value);
   box.querySelectorAll('[data-ex]').forEach(b=>b.onclick=async()=>{const f=b.dataset.ex,msg=box.querySelector('[data-msg]');
    if(f==='json'&&sc){download(`${c.label||c.id}_scan.json`,JSON.stringify(sc),'application/json');return;}
    const q=expReq(f);if(f==='csv'){q.form=box.querySelector('[data-csvform]').value;const sp=box.querySelector('[data-csvsep]').value;q.sep=sp;q.decimal=sp===';'?',':'.';}
    b.disabled=true;msg.textContent='Εξαγωγή…';msg.className='small';
    try{const r=await ctx.api('line_export',q);download(r.name,r.base64?b64blob(r.base64,r.mime):r.text,r.mime);msg.textContent='✓ '+r.name;}
    catch(e){msg.textContent='⚠ '+(e.message||e);msg.className='small bad';}b.disabled=false;});
   const tp=box.querySelector('[data-topy]');if(tp)tp.onclick=()=>{const p=pars();let mdl=null;try{mdl=JSON.parse(p.mdl||'null');}catch(e){}
    const opts={};for(const k of ['model','len','f','fmin','dec','ppd','fti','ti','tiauto','cp','npi','nmax'])if(p[k]!==undefined&&p[k]!=='')opts[k]=num(p[k])??p[k];
    if(root.Addons){root.Addons.lineOut={id,data:JSON.parse(JSON.stringify(d)),opts,mdl:mdl&&mdl.src===P.tlmKey(p)?mdl:null,t:new Date().toISOString()};
     box.querySelector('[data-pymsg]').textContent=`✓ Στάλθηκε: app.line() στην Python το επιστρέφει (η σύνδεση ανοίγει από «Πρόσθετα» ή με το πρώτο αίτημα).`;}
    else box.querySelector('[data-pymsg]').textContent='⚠ Η σύνδεση δεν είναι διαθέσιμη σε αυτή τη σελίδα.';};};
  render();
  return {box,render,api:{get sc(){return sc;},get d(){return d;},scan:doScan,setTab:t=>{tab=t;render();}}};}
 // asks the server for the model of the part `id` and keeps it in its parameters (with the key of what it was computed from)
 async function compute(id,ctx){const p={...P.defaults('TLM'),...ctx.editor.comp(id).params},src=P.tlmKey(p),d=JSON.parse(p.data);
  // 4.13: the wideband options as the WB fitter of the EMTP (tolerance in %), or the model file of the EMTP
  const wb=p.model==='wb'?{tol:num(p.wtol)??0.2,group:p.wgrp!=='0',fdcm:p.wfdcm||'auto',dc:p.wdc==='1',opt:p.wopt==='1',passive:p.wpas||'check',lfw:num(p.wlfw)??100}:{};
  if(p.model==='wb'&&p.wsrc==='emtp'){if(!p.wbtxt)throw new Error('Διάλεξε το αρχείο _WB.mod του EMTP (καρτέλα «Μοντέλο»).');Object.assign(wb,{wbmod:p.wbtxt,wbref:p.wbref||''});}
  const r=await ctx.api('line_model',{data:d,model:p.model,len:num(p.len),f:num(p.f),fmin:num(p.fmin),dec:num(p.dec),ppd:num(p.ppd),fti:num(p.fti),
   ti:p.ti||'gm0',tiauto:p.tiauto==='1',cp:p.cp||'lumped',npi:num(p.npi)||1,nmax:num(p.nmax)||30,...wb,src});
  ctx.editor.setParams(id,{mdl:JSON.stringify(r.mdl)});ctx.changed();return r;}
 // every line part whose model is missing or old: computed again (for a run, or after a change of the length)
 async function refresh(ctx,comps){const need=comps.filter(c=>c.type==='TLM'&&P.tlmModel({...P.defaults('TLM'),...c.params}).need&&(()=>{try{JSON.parse(c.params?.data??P.defaults('TLM').data);return true;}catch(e){return false;}})());
  for(const c of need)await compute(c.id,ctx);return need.length;}
 const api={open,compute,refresh,expand,seriesOf,valOf,chartSVG,fitView,ohSVG,cabSVG,xsSVG,sideSVG,MATS,Q};root.LineData=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
