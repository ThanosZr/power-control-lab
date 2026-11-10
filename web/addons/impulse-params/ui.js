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
