'use strict';
// Κρουστικές πηγές: παράμετροι από κώδικα (built-in add-on, 3.15). The computation is pcl/impulse.py in the app's Python.
const $=s=>document.querySelector(s);
const TYPE={i:'ILG',v:'VIMP'};
let tab='i',last=null,comps={};
const fmt=(x,d=6)=>typeof x==='number'?(Math.abs(x)>=1e5||Math.abs(x)<1e-3&&x!==0?x.toExponential(d-1):String(+x.toPrecision(d))).replace('.',','):String(x);
const us=x=>fmt(x*1e6)+' μs';
function msg(t,bad){$('#msg').textContent=t||'';$('#msg').className='small'+(bad?' err':'');}

async function loadTargets(){comps=await PCL.params();const sel=$('#target'),want=TYPE[tab==='csv'?(last?.type==='v'?'v':'i'):tab],keep=PCL.target||sel.value;
 const list=Object.entries(comps).filter(([,c])=>c.type==='ILG'||c.type==='VIMP');
 sel.innerHTML=list.length?list.map(([id,c])=>`<option value="${id}" data-type="${c.type}">${c.label} (${c.type==='ILG'?'ρεύμα':'τάση'})</option>`).join(''):'<option value="">— δεν υπάρχει πηγή Heidler ή κρουστικής τάσης στο κύκλωμα —</option>';
 if(list.some(([id])=>id===keep))sel.value=keep;else{const f=list.find(([,c])=>c.type===want);if(f)sel.value=f[0];}
 const c=comps[sel.value];if(c&&tab!=='csv'){const t=c.type==='ILG'?'i':'v';if(t!==tab)show(t);}
 const p=c?.params||{};$('#cur').textContent=c?`τωρινή μορφή: ${p.shape||'—'}${c.from?' · από εργαλείο: '+Object.keys(c.from).join(', '):''}`:'';
 updateApply();}
function show(t){tab=t;for(const b of document.querySelectorAll('.tabs button'))b.classList.toggle('on',b.dataset.tab===t);for(const k of ['i','v','csv'])$('#tab-'+k).hidden=k!==t;updateApply();}
function updateApply(){const c=comps[$('#target').value];$('#apply').disabled=!(last&&c&&c.type===TYPE[last.type]);$('#dl').disabled=!last;}

async function py(code,inputs){msg('υπολογισμός…');try{const r=await PCL.python(code,inputs);msg('');return r;}catch(e){msg(e.message,true);throw e;}}
function table(rows){return `<table><tbody>${rows.map(([k,v])=>`<tr><th>${k}</th><td>${v}</td></tr>`).join('')}</tbody></table>`;}
function checkTable(ch){if(!ch)return '';return `<p>${ch.display}: <span class="${ch.pass?'pass':'fail'}">${ch.pass?'PASS':'FAIL'}</span></p><table><thead><tr><th>κριτήριο</th><th>στόχος</th><th>τιμή</th><th>σφάλμα</th><th>όριο</th><th></th></tr></thead><tbody>${
 ch.criteria.map(c=>`<tr><td>${c.name}</td><td>${c.name==='peak'?fmt(c.target)+' V':us(c.target)}</td><td>${c.name==='peak'?fmt(c.value)+' V':us(c.value)}</td><td>${fmt(c.err_pct,3)} %</td><td>±${c.tol_pct} %</td><td class="${c.pass?'pass':'fail'}">${c.pass?'✓':'✗'}</td></tr>`).join('')}</tbody></table>`;}

$('#i-fit').onclick=async()=>{const r=await py(`from pcl import impulse
result = impulse.fit_heidler(T1 * 1e-6, T2 * 1e-6, Im, n, H, Hv)`,{T1:+$('#i-T1').value,T2:+$('#i-T2').value,Im:+$('#i-Im').value,n:+$('#i-n').value,H:$('#i-H').value,Hv:+$('#i-Hv').value});
 last={type:'i',r,params:r.params};
 $('#out').innerHTML=table([['τ₁',us(r.tau1)],['τ₂',us(r.tau2)],['η ('+r.H_mode+')',fmt(r.eta,9)],['T1 / T2 (μέτρηση)',`${us(r.T1)} / ${us(r.T2)}`],['σφάλματα T1, T2',`${fmt(r.T1_err_pct,3)} %, ${fmt(r.T2_err_pct,3)} %`],['κορυφή',`${fmt(r.peak)} A (${fmt(r.peak_err_pct,3)} %)`]]);updateApply();};

function syncProfile(){const p=$('#v-prof').value,P={IEC2025_LI:['IEC_T1_T2',1.2,50],IEC2025_SI:['IEC_T1_T2',170,2500],IEC2010_SI_LEGACY:['TP_T2',250,2500]}[p];
 for(const k of ['#v-meth','#v-X','#v-Y'])$(k).disabled=!!P;if(P){$('#v-meth').value=P[0];$('#v-X').value=P[1];$('#v-Y').value=P[2];}}
$('#v-prof').onchange=syncProfile;syncProfile();
$('#v-fit').onclick=async()=>{const r=await py(`from pcl import impulse
result = impulse.fit_voltage(X * 1e-6, Y * 1e-6, Vp, method, profile)`,{X:+$('#v-X').value,Y:+$('#v-Y').value,Vp:+$('#v-Vp').value,method:$('#v-meth').value,profile:$('#v-prof').value});
 last={type:'v',r,params:r.params};
 $('#out').innerHTML=table([['α',fmt(r.alpha,12)+' 1/s'],['β',fmt(r.beta,12)+' 1/s'],['K',fmt(r.K,12)],['T1 / T2 (IEC)',`${us(r.T1)} / ${us(r.T2)}`],['Tp, t10–90, t50',`${us(r.Tp)}, ${us(r.t10_90)}, ${us(r.t50)}`]])+checkTable(r.check);updateApply();};
$('#v-check').onclick=async()=>{const id=$('#target').value,c=comps[id];if(!c||c.type!=='VIMP'){msg('Διάλεξε πηγή κρουστικής τάσης.',true);return;}const p=c.params;
 if(p.shape!=='direct'){msg('Ο έλεγχος θέλει μορφή «Παράμετροι α, β, K». Οι τυπικές μορφές του στοιχείου είναι ήδη προσαρμοσμένες στο προφίλ τους.',true);return;}
 const r=await py(`from pcl import impulse
result = impulse.check_voltage(a, b, K, Vp, profile, X * 1e-6, Y * 1e-6, method)`,{a:+p.alpha,b:+p.beta,K:+p.K,Vp:+(p.Vpk??100e3),profile:$('#v-prof').value,X:+$('#v-X').value,Y:+$('#v-Y').value,method:$('#v-meth').value});
 $('#out').innerHTML=checkTable(r);};

$('#csv').onchange=async e=>{const f=e.target.files[0];if(!f)return;const text=await f.text();const kind=/tau1_opt_us/.test(text)?'i':/alpha_s_inv/.test(text)?'v':null;
 if(!kind){msg('Δεν αναγνωρίστηκε: ούτε ls_params ούτε voltage_impulse_params.',true);return;}
 const rows=await py(`from pcl import impulse
result = impulse.${kind==='i'?'read_heidler_csv':'read_voltage_csv'}(text)`,{text});
 const r=rows[0];last={type:kind,r,params:r.params};const P=r.params;
 $('#out').innerHTML=`<p>${f.name}: <b>${r.name}</b>${rows.length>1?` (πρώτη από ${rows.length} γραμμές)`:''}</p>`+table(Object.entries(P).map(([k,v])=>[k,fmt(v,12)]));
 const want=TYPE[kind];if(comps[$('#target').value]?.type!==want){const f2=Object.entries(comps).find(([,c])=>c.type===want);if(f2)$('#target').value=f2[0];}updateApply();};

$('#apply').onclick=async()=>{const id=$('#target').value;if(!last||!id)return;const values={};for(const [k,v] of Object.entries(last.params))values[id+'.'+k]=v;
 try{await PCL.setMany(values,{tool:'impulse-params',at:new Date().toISOString()});msg(`Γράφτηκαν στο ${comps[id].label}: ${Object.keys(last.params).join(', ')}.`);await loadTargets();}catch(e){msg(e.message,true);}};
$('#dl').onclick=()=>{if(!last)return;const P=last.params,r=last.r,keys=Object.keys(P),extra=['T1','T2','Tp','eta','alpha','beta','K'].filter(k=>typeof r[k]==='number'&&!keys.includes(k));
 PCL.download(`${last.type==='i'?'heidler':'voltage_impulse'}_params.csv`,[[...keys,...extra].join(','),[...keys.map(k=>P[k]),...extra.map(k=>r[k])].join(',')].join('\n')+'\n','text/csv');};
for(const b of document.querySelectorAll('.tabs button'))b.onclick=()=>show(b.dataset.tab);
$('#target').onchange=()=>{PCL.target=$('#target').value;loadTargets();};
PCL.on('target',()=>loadTargets());PCL.on('project',()=>loadTargets());
loadTargets().catch(e=>msg(e.message,true));

// ---------------------------------------------------------------- 4.1.1: the rest of the two tools
// full result rows (guess and optimum on samples, the tool's CSV schema and file name), details plot, front-line
// geometry, validation table of a voltage impulse, comparison with an EMTP CSV
let row=null,rowKind=null,emtp=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// a small SVG plot: curves [{x, y, cls, label}] (x in μs), points [{x, y, label, cls}], lines [{x1,y1,x2,y2,cls}]
function plot(curves,pts=[],lines=[],ylab='',xr=null){const W=640,H=300,L=56,R=10,T=10,B=34;
 const xs=curves.flatMap(c=>c.x),ys=curves.flatMap(c=>c.y).concat(pts.map(p=>p.y));
 let x0=xr?xr[0]:Math.min(...xs),x1=xr?xr[1]:Math.max(...xs),y0=Math.min(0,...ys),y1=Math.max(0,...ys);if(x1<=x0)x1=x0+1;if(y1<=y0)y1=y0+1;const pad=(y1-y0)*.05;y0-=pad;y1+=pad;
 const X=x=>L+(x-x0)/(x1-x0)*(W-L-R),Y=y=>T+(y1-y)/(y1-y0)*(H-T-B);
 const path=c=>{let d='',on=false;c.x.forEach((x,k)=>{if(x<x0||x>x1){on=false;return;}d+=(on?'L':'M')+X(x).toFixed(1)+','+Y(c.y[k]).toFixed(1);on=true;});return `<path class="${c.cls||'c0'}" d="${d}"/>`;};
 const ticks=(a,b,n)=>{const s=Math.pow(10,Math.floor(Math.log10((b-a)/n))),m=[1,2,5,10].find(q=>(b-a)/(q*s)<=n)*s,o=[];for(let v=Math.ceil(a/m)*m;v<=b+1e-12*m;v+=m)o.push(+v.toPrecision(10));return o;};
 const gx=ticks(x0,x1,8).map(v=>`<line class="g" x1="${X(v)}" x2="${X(v)}" y1="${T}" y2="${H-B}"/><text x="${X(v)}" y="${H-B+14}" text-anchor="middle">${fmt(v,4)}</text>`).join('');
 const gy=ticks(y0,y1,6).map(v=>`<line class="g" x1="${L}" x2="${W-R}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${L-4}" y="${Y(v)+4}" text-anchor="end">${fmt(v,4)}</text>`).join('');
 const ln=lines.map(l=>`<line class="${l.cls||'ref'}" x1="${X(l.x1)}" y1="${Y(l.y1)}" x2="${X(l.x2)}" y2="${Y(l.y2)}"/>`).join('');
 const pp=pts.filter(p=>p.x>=x0&&p.x<=x1).map(p=>`<circle class="${p.cls||'pt'}" cx="${X(p.x)}" cy="${Y(p.y)}" r="4"><title>${esc(p.label)}</title></circle><text class="pl" x="${X(p.x)+6}" y="${Y(p.y)-6}">${esc(p.label)}</text>`).join('');
 const leg=curves.map((c,k)=>`<tspan class="${c.cls||'c0'}t" x="${L+8}" dy="${k?14:0}">— ${esc(c.label||'')}</tspan>`).join('');
 $('#plot').innerHTML=`<svg class="plot" viewBox="0 0 ${W} ${H}" width="100%">${gx}${gy}${ln}${curves.map(path).join('')}${pp}<text x="${(L+W-R)/2}" y="${H-4}" text-anchor="middle">t (μs)</text><text x="12" y="${T+8}">${esc(ylab)}</text><text x="${L+8}" y="${T+14}">${leg}</text></svg>`;}
function rowTable(r,keys){return table(keys.filter(k=>k in r).map(k=>[k,typeof r[k]==='number'?fmt(r[k],10):esc(r[k])]));}
function setRow(r,kind){row=r;rowKind=kind;$('#dl-row').disabled=!r;$('#emtp-ref').textContent=r?`αναφορά: ${r.name}`:'';
 $('#emtp-unit').innerHTML='<option value="auto">Αυτόματα</option>'+(kind==='i'?['A','kA','mA','MA']:['kV','V','MV','mV']).map(u=>`<option>${u}</option>`).join('');if(emtp)runEmtp();}

$('#i-row').onclick=async()=>{const q={T1:+$('#i-T1').value,T2:+$('#i-T2').value,Im:+$('#i-Im').value,n:+$('#i-n').value,H:$('#i-H').value==='auto'?'AutoH':'FixedH',Hv:+$('#i-Hv').value,g1:+$('#i-g1').value,g2:+$('#i-g2').value,dt:+$('#i-dt').value||1e-9};
 const r=await py(`from pcl import impulse
row = impulse.heidler_row(T1, T2, Im, n, H, Hv, g1, g2, dt)
t = [k * 2e-8 for k in range(int(max(500e-6, 1.5 * T2 * 1e-6) / 2e-8) + 1)]
i = impulse.lightning_current(Im, row['H_used'], row['tau1_opt_us'], row['tau2_opt_us'], n, t)
c = impulse.waveform_characteristics(t, i)
result = {'row': row, 't': t[::10], 'i': i[::10], 'c': c}`,q);
 const R=r.row,c=r.c;setRow(R,'i');last={type:'i',r:{...R,T1:R.T1_opt_calc_us*1e-6,T2:R.T2_opt_calc_us*1e-6},params:{shape:'direct',model:'heidler',tau1:R.tau1_opt_us*1e-6,tau2:R.tau2_opt_us*1e-6,eta:R.H_used,n:R.n,Ipk:R.Im_A}};
 const pk=c.Ipeak/1e3,s=Math.sign(pk);
 plot([{x:r.t.map(t=>t*1e6),y:r.i.map(v=>v/1e3),label:'i(t)'}],[{x:c.t10*1e6,y:.1*pk,label:'10 %'},{x:c.t90*1e6,y:.9*pk,label:'90 %'},{x:c.t_virtual_origin*1e6,y:0,label:'O1'},{x:c.t_peak*1e6,y:pk,label:'κορυφή'},{x:c.t50*1e6,y:.5*pk,label:'50 %'}],[],'i (kA)');
 $('#out').innerHTML=`<p><b>${esc(R.name)}</b> · ${R.H_mode} · H = ${fmt(R.H_used,9)}</p><table><thead><tr><th></th><th>αρχική</th><th>τελική</th></tr></thead><tbody>${[['τ₁ (μs)','tau1_guess_us','tau1_opt_us'],['κορυφή (A)','peak_guess_A','peak_opt_A'],['T1 (μs)','T1_guess_calc_us','T1_opt_calc_us'],['T2 (μs)','T2_guess_calc_us','T2_opt_calc_us'],['σφάλμα T1 (%)','T1_guess_err_pct','T1_opt_err_pct'],['σφάλμα T2 (%)','T2_guess_err_pct','T2_opt_err_pct'],['σφάλμα κορυφής (%)','Peak_guess_err_pct','Peak_opt_err_pct']].map(([n,a,b])=>`<tr><th>${n}</th><td>${fmt(R[a],9)}</td><td>${fmt(R[b],9)}</td></tr>`).join('').replace('<tr><th>τ₁ (μs)</th>',`<tr><th>τ₂ (μs)</th><td>${fmt(R.tau2_guess_us,9)}</td><td>${fmt(R.tau2_opt_us,9)}</td></tr><tr><th>τ₁ (μs)</th>`)}</tbody></table>`;updateApply();};

$('#i-geo').onclick=async()=>{let q;if(row&&rowKind==='i')q={I0:row.Im_A,tau1:row.tau1_opt_us*1e-6,tau2:row.tau2_opt_us*1e-6,n:row.n,eta:row.H_used};
 else{const r=await py(`from pcl import impulse
result = impulse.fit_heidler(T1 * 1e-6, T2 * 1e-6, Im, n, H, Hv)`,{T1:+$('#i-T1').value,T2:+$('#i-T2').value,Im:+$('#i-Im').value,n:+$('#i-n').value,H:$('#i-H').value,Hv:+$('#i-Hv').value});q={I0:r.Im??+$('#i-Im').value,tau1:r.tau1,tau2:r.tau2,n:r.n,eta:r.eta};}
 const g=await py(`from pcl import impulse
g = impulse.frontline_geometry(I0, tau1, tau2, n, eta, dt, tend)
t = [k * 2e-9 for k in range(int(min(tend, 4 * g['t_top']) / 2e-9) + 1)]
result = {'g': g, 't': t[::5], 'i': [I0 / eta * (x / tau1) ** n / (1 + (x / tau1) ** n) * impulse.math.exp(-x / tau2) for x in t[::5]]}`,{...q,dt:+$('#i-dt').value||1e-9,tend:500e-6});
 const G=g.g,k=1e3,u=1e6;
 plot([{x:g.t.map(t=>t*u),y:g.i.map(v=>v/k),label:'κυματομορφή'}],[{x:G.t10*u,y:G.I10/k,label:'10 %'},{x:G.t90*u,y:G.I90/k,label:'90 %'},{x:G.t_O1*u,y:0,label:'O1'},{x:G.t_top*u,y:G.Imax/k,label:'τομή κορυφής'},{x:G.t_peak*u,y:G.Imax/k,label:'κορυφή'}],
  [{x1:G.t_O1*u,y1:0,x2:G.t_top*u,y2:G.Imax/k,cls:'front'},{x1:0,y1:G.I10/k,x2:g.t[g.t.length-1]*u,y2:G.I10/k},{x1:0,y1:G.I90/k,x2:g.t[g.t.length-1]*u,y2:G.I90/k},{x1:0,y1:G.Imax/k,x2:g.t[g.t.length-1]*u,y2:G.Imax/k}],'i (kA)');
 $('#out').innerHTML=`<p>Ευθεία μετώπου (heidler_frontline_geometry_analysis): λόγος T1_geom/(t90 − t10) = <b>${fmt(G.ratio,12)}</b></p>`+table([['t10',us(G.t10)],['t90',us(G.t90)],['t90 − t10',us(G.dt_10_90)],['O1',us(G.t_O1)],['t_top',us(G.t_top)],['T1_geom',us(G.T1_geom)],['I_max',fmt(G.Imax/1e3,9)+' kA'],['κορυφή στα',us(G.t_peak)]]);};

$('#v-row').onclick=async()=>{const tx=$('#v-tX').value.trim(),ty=$('#v-tY').value.trim();
 const r=await py(`from pcl import impulse
o = impulse.voltage_row(X, Y, Vp / 1e3, method, profile, pol, dt, tend, 3, tX, tY)
R = o['row']
t = [k * R['tend_effective_s'] / 3000 for k in range(3001)]
v = [pol * Vp / 1e3 * R['K'] * impulse.dexp(x, R['alpha_s_inv'], R['beta_s_inv']) for x in t]
result = {'row': R, 'val': o['validation'], 'ex': o['exact'], 't': t, 'v': v}`,{X:+$('#v-X').value,Y:+$('#v-Y').value,Vp:+$('#v-Vp').value,method:$('#v-meth').value,profile:$('#v-prof').value,pol:+$('#v-pol').value,dt:+$('#v-dt').value||1e-9,tend:+$('#v-tend').value||1e-4,tX:tx?+tx:null,tY:ty?+ty:null});
 const R=r.row,e=r.ex,u=1e6,V=R.Vp_target_kV*(+$('#v-pol').value);setRow(R,'v');
 last={type:'v',r:{...R,T1:e.T1,T2:e.T2,Tp:e.t_peak,alpha:R.alpha_s_inv,beta:R.beta_s_inv,K:R.K},params:{shape:'direct',alpha:R.alpha_s_inv,beta:R.beta_s_inv,K:R.K,Vpk:V*1e3}};
 plot([{x:r.t.map(t=>t*u),y:r.v,label:'v(t)'}],[{x:e.t30*u,y:.3*V,label:'30 %'},{x:e.t90*u,y:.9*V,label:'90 %'},{x:e.virtual_origin*u,y:0,label:'O1'},{x:e.t_peak*u,y:V,label:'κορυφή'},{x:e.t50_tail*u,y:.5*V,label:'50 %'}],
  [{x1:e.virtual_origin*u,y1:0,x2:(e.virtual_origin+e.T1)*u,y2:V,cls:'front'}],'v (kV)',[0,Math.min(r.t[r.t.length-1]*u,Math.max(4*e.t50_tail*u,3*e.t_peak*u))]);
 $('#out').innerHTML=`<p><b>${esc(R.name)}</b> · ${esc(R.standard_name)} · συνολικά: <span class="${R.overall_pass?'pass':'fail'}">${R.overall_pass?'PASS':'FAIL'}</span></p><table><thead><tr><th>Μέγεθος</th><th>Τιμή</th><th>Στόχος</th><th>Απόκλιση (%)</th><th>Ανοχή</th><th>Κατάσταση</th><th>Απαιτείται</th><th>Βάση</th></tr></thead><tbody>${
  r.val.map(q=>`<tr><td>${esc(q.Metric)}</td><td>${fmt(q.Actual,8)}</td><td>${Number.isFinite(q.Target)?fmt(q.Target,8):'—'}</td><td>${Number.isFinite(q.Deviation_pct)?fmt(q.Deviation_pct,4):'—'}</td><td>${esc(q.Tolerance)}</td><td class="${q.Status==='PASS'?'pass':'fail'}">${q.Status}</td><td>${q.Required?'ναι':''}</td><td class="small">${esc(q.Basis)}</td></tr>`).join('')}</tbody></table>`+
  '<details><summary>Όλη η γραμμή</summary>'+rowTable(R,Object.keys(R))+'</details>';updateApply();};

$('#dl-row').onclick=async()=>{if(!row)return;const text=await py(`from pcl import impulse
result = impulse.rows_csv([row], kind)`,{row,kind:rowKind});PCL.download(row.name+'.csv',text,'text/csv');};

// a saved row of either tool becomes the reference too
const csvInput=$('#csv'),csvPrev=csvInput.onchange;
csvInput.onchange=async e=>{await csvPrev(e);const f=e.target.files[0];if(!f)return;const text=await f.text();const kind=/tau1_opt_us/.test(text)?'i':/alpha_s_inv/.test(text)?'v':null;if(!kind)return;
 const rows=await py(`from pcl import impulse
result = impulse.read_rows(text)`,{text});setRow(rows[0],kind);};

// ---------------------------------------------------------------- comparison with EMTP
$('#emtp-file').onchange=async e=>{const f=e.target.files[0];if(!f)return;const text=await f.text();
 try{const s=await py(`from pcl import impulse
result = impulse.read_signal_csv(text)`,{text});emtp={...s,file:f.name,text};$('#emtp-shift').value='';
  $('#emtp-col').innerHTML='<option value="">— διάλεξε στήλη —</option>'+s.columns.map(c=>`<option value="${c.index}">Στήλη ${c.index} | ${esc(c.name)} | ${c.valid} έγκυρα δείγματα</option>`).join('');
  msg(`${f.name}: ${s.columns.length} στήλες σημάτων. Διάλεξε τη στήλη για σύγκριση.`);}catch(err){msg('Το CSV δεν φορτώθηκε: '+err.message+' (μένει το προηγούμενο).',true);}};
async function runEmtp(){const col=+$('#emtp-col').value;if(!emtp||!col)return;if(!row){msg('Χρειάζεται αναφορά: «Γραμμή…» ή CSV εργαλείου.',true);return;}
 const sh=$('#emtp-shift').value.trim();
 const r=await py(`from pcl import impulse
f = impulse.compare_current if kind == 'i' else impulse.compare_voltage
m = f(row, time, sig, unit, shift, norm)
tR, yR = impulse.heidler_reference(row, 2e-8) if kind == 'i' else impulse.voltage_reference(row)[:2]
tE, yE = impulse._clean(time, sig)
mult = (impulse.CURRENT_UNITS if kind == 'i' else impulse.VOLTAGE_UNITS)[m['unit']]
step = max(1, len(tR) // 3000)
stepE = max(1, len(tE) // 3000)
result = {'m': m, 'tR': tR[::step], 'yR': yR[::step], 'tE': [x + m['shift'] for x in tE[::stepE]], 'yE': [y * mult * m['factor'] for y in yE[::stepE]]}`,
  {row,kind:rowKind,time:emtp.time,sig:emtp.data[col],unit:$('#emtp-unit').value,shift:sh===''?null:+sh,norm:$('#emtp-norm').checked});
 const m=r.m,ci=rowKind==='i',k=ci?1e3:1,u=1e6;if(sh==='')$('#emtp-shift').value=String(+m.shift.toPrecision(12));
 const front=$('#emtp-view').value==='front';let xr=null;if(front){const kp=r.yR.reduce((b,v,j)=>Math.abs(v)>Math.abs(r.yR[b])?j:b,0);xr=[0,r.tR[kp]*u*2];}
 plot([{x:r.tR.map(t=>t*u),y:r.yR.map(v=>v/k),label:'εργαλείο (GUI)'},{x:r.tE.map(t=>t*u),y:r.yE.map(v=>v/k),label:'EMTP: '+(emtp.columns.find(c=>c.index===col)?.name||''),cls:'c1'}],[],[],ci?'i (kA)':'v (kV)',xr);
 $('#out').innerHTML=table([[ci?'κορυφή GUI (με πρόσημο)':'κορυφή GUI',fmt(m.gui_peak,9)+(ci?' A':' kV')],['κορυφή EMTP πριν την κανονικοποίηση',fmt(m.emtp_peak,9)+(ci?' A':' kV')],['σφάλμα κορυφής',fmt(m.peak_err_pct,6)+' %'+(m.polarity?' · πολικότητα: '+m.polarity:'')],
  ['μετατόπιση χρόνου',fmt(m.shift,12)+' s'],['μονάδα του CSV',m.unit+($('#emtp-unit').value==='auto'?' (αυτόματα)':'')],['συντελεστής κανονικοποίησης',fmt(m.factor,12)],['RMSE',fmt(m.rmse,9)+(ci?' A':' kV')],['κανονικοποιημένο RMSE',fmt(m.nrmse_pct,6)+' % της κορυφής'],['συσχέτιση',fmt(m.corr,9)],['κοινά δείγματα',String(m.n)],['στήλη',`${col} | ${esc(emtp.columns.find(c=>c.index===col)?.name)}`],['αρχείο',esc(emtp.file)]]);}
for(const id of ['#emtp-col','#emtp-unit','#emtp-norm','#emtp-view','#emtp-shift'])$(id).onchange=()=>runEmtp().catch(()=>{});
$('#emtp-align').onclick=()=>{$('#emtp-shift').value='';runEmtp().catch(()=>{});};
$('#emtp-reset').onclick=()=>{$('#emtp-shift').value='0';runEmtp().catch(()=>{});};
{const prevShow=show;show=function(t){prevShow(t);$('#tab-emtp').hidden=t!=='emtp';if(t==='emtp')for(const k of ['i','v','csv'])$('#tab-'+k).hidden=true;};}
for(const b of document.querySelectorAll('.tabs button'))b.onclick=()=>show(b.dataset.tab);
