'use strict';
// Σύνθεση ελέγχου (built-in add-on, 3.15, ROADMAP §38). The loops are chosen here and composed by pcl/control.py in the
// app's Python, so the same composition runs from a script, the command line or MATLAB. A plug-in visualization:
// the loop diagram, with the live values of the blocks (PCL.values) while the app simulates.
const $=s=>document.querySelector(s);
const TYPES=[['pi','PI'],['pi_nn','PI + νευρωνικό (μαθαίνει online)'],['code','δικός μου κώδικας Python']];
let proj=null,outs=[],ins=[],loops=[],timer=null,composed=null;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const msg=(t,bad)=>{$('#msg').textContent=t||'';$('#msg').className='small'+(bad?' err':'');};
const fmt=v=>Number.isFinite(v)?String(+v.toPrecision(4)).replace('.',','):'—';

async function load(){proj=await PCL.project();const P=window.Parts;outs=[];ins=[];
 for(const c of proj.components){let sp={};try{sp=P.sigPins(c);}catch(e){}for(const [pin,d] of Object.entries(sp)){(d.dir==='out'?outs:ins).push({k:c.id+':'+pin,label:`${c.label||c.id}.${pin}`,type:c.type,id:c.id});}
  if(c.type==='PWM'&&!ins.some(x=>x.k===c.id+':d'))ins.push({k:c.id+':d',label:`${c.label||c.id}.d (duty)`,type:'PWM',id:c.id});}
 const own=x=>!x.id.startsWith('AC');outs=outs.filter(own);ins=ins.filter(own);
 $('#act').innerHTML=ins.map(x=>`<option value="${esc(x.k)}">${esc(x.label)}</option>`).join('')||'<option value="">— κανένα σήμα εισόδου —</option>';
 const pref=ins.find(x=>x.type==='PWM');if(pref)$('#act').value=pref.k;
 const clocks=proj.components.filter(c=>c.type==='PWM'||c.type==='CLK');$('#clock').innerHTML=clocks.map(c=>`<option value="${esc(c.id)}">${esc(c.label||c.id)}</option>`).join('')+'<option value="">(συνεχής)</option>';
 const prev=proj.control?.composed;if(prev&&!loops.length){loops=prev.loops;$('#act').value=prev.actuator;$('#clock').value=prev.clock||'';composed=prev;}
 if(!loops.length)suggest();draw();diagram();}

// a first proposal: a machine with an ammeter → speed over current; otherwise one loop on the first measurement
function suggest(){const m=proj.components.find(c=>['DCM','IM','SM'].includes(c.type)),am=outs.find(x=>x.type==='AM'),w=m?outs.find(x=>x.id===m.id&&/:w$/.test(x.k)):null;
 const pwm=proj.components.find(c=>c.type==='PWM'),Vdc=+(proj.components.find(c=>c.type==='VDC')?.params?.V)||1;
 if(m&&am&&w){const La=+m.params.La||10e-3,Ra=+m.params.Ra||.5,J=+m.params.J||.02,ac=2*Math.PI*200,as=ac/10;
  loops=[{name:'ω',measure:w.k,ref:'0:0, 0.02:100, 0.2:150',yscale:150,ctrl:{type:'pi',Kp:+(as*J).toPrecision(4),Ki:+(as*as*J/4).toPrecision(4),lo:-30,hi:30,lr:.05,learn:true}},
   {name:'i',measure:am.k,yscale:30,ctrl:{type:'pi',Kp:+(ac*La).toPrecision(4),Ki:+(ac*Ra).toPrecision(4),lo:0,hi:Vdc},scale:+(1/Vdc).toPrecision(6)}];}
 else{const o=am||outs[0];loops=o?[{name:'y',measure:o.k,ref:'1',yscale:1,ctrl:{type:'pi',Kp:.1,Ki:10,lo:0,hi:.95}}]:[];}
 if(pwm)$('#clock').value=pwm.id;}

function draw(){$('#loops').innerHTML=loops.map((l,i)=>{const c=l.ctrl||{};const opt=(L,v)=>L.map(([k,t])=>`<option value="${esc(k)}" ${k===v?'selected':''}>${esc(t)}</option>`).join('');
 return `<div class="loop" data-i="${i}"><div class="head"><b>${i+1}. ${i===0?'εξωτερικός':i===loops.length-1?'εσωτερικός':'ενδιάμεσος'}</b><button data-up>↑</button><button data-down>↓</button><button data-del>✕</button></div><div class="grid">
  <label>Όνομα <input data-f="name" value="${esc(l.name||'')}"></label>
  <label>Μέτρηση <select data-f="measure">${outs.map(o=>`<option value="${esc(o.k)}" ${o.k===l.measure?'selected':''}>${esc(o.label)}</option>`).join('')}</select></label>
  ${i===0?`<label>Αναφορά (τιμή ή t:τιμή) <input data-f="ref" value="${esc(l.ref??'')}"></label>`:''}
  <label>Ελεγκτής <select data-c="type">${opt(TYPES,c.type||'pi')}</select></label>
  <label><span>K<sub>p</sub></span> <input type="number" data-c="Kp" value="${c.Kp??1}"></label><label><span>K<sub>i</sub></span> <input type="number" data-c="Ki" value="${c.Ki??0}"></label>
  <label>έξοδος min <input type="number" data-c="lo" value="${c.lo??-1e9}"></label><label>έξοδος max <input type="number" data-c="hi" value="${c.hi??1e9}"></label>
  <label>κλίμακα προς τα μέσα <input type="number" data-f="scale" value="${l.scale??1}"></label><label>κλίμακα μέτρησης <input type="number" data-f="yscale" value="${l.yscale??1}"></label>
  ${c.type==='pi_nn'?`<label>ρυθμός μάθησης <input type="number" step="0.01" data-c="lr" value="${c.lr??.02}"></label><label class="row"><input type="checkbox" data-c="learn" ${c.learn!==false?'checked':''}> μαθαίνει</label>`:''}
 </div>${c.type==='code'?`<label>Κώδικας (init/step, είσοδοι e, r, y, έξοδος u) <textarea data-c="code" rows="8" style="width:100%;font:12px monospace">${esc(c.code||'def init(p):\n    return {}\n\ndef step(t, u, s, p):\n    return {"u": p["Kp"] * u["e"]}\n')}</textarea></label>`:''}</div>`;}).join('')||'<p class="muted small">Κανένας βρόχος.</p>';
 document.querySelectorAll('.loop').forEach(el=>{const i=+el.dataset.i,l=loops[i];
  el.querySelectorAll('[data-f]').forEach(x=>x.onchange=()=>{const f=x.dataset.f;l[f]=x.type==='number'?+x.value:x.value;diagram();});
  el.querySelectorAll('[data-c]').forEach(x=>x.onchange=()=>{const f=x.dataset.c;l.ctrl=l.ctrl||{};l.ctrl[f]=x.type==='checkbox'?x.checked:x.type==='number'?+x.value:x.value;if(f==='type')draw();diagram();});
  el.querySelector('[data-del]').onclick=()=>{loops.splice(i,1);draw();diagram();};
  el.querySelector('[data-up]').onclick=()=>{if(i>0){[loops[i-1],loops[i]]=[loops[i],loops[i-1]];draw();diagram();}};
  el.querySelector('[data-down]').onclick=()=>{if(i<loops.length-1){[loops[i+1],loops[i]]=[loops[i],loops[i+1]];draw();diagram();}};});}

// the plug-in visualization: the cascade as a block diagram, the live values of the blocks on it
function diagram(vals){const n=loops.length;if(!n){$('#diagram').innerHTML='';return;}const W=640,rowH=64,H=n*rowH+20;let s=`<svg viewBox="0 0 ${W} ${H}"><defs><marker id="arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L8,4L0,8z" fill="currentColor" stroke="none"/></marker></defs>`;
 const v=k=>vals&&k in vals?fmt(vals[k]):'';
 loops.forEach((l,i)=>{const y=10+i*rowH,c=l.ctrl||{},ai=c.type==='pi_nn',b=`AC${i+1}`;
  s+=`<text x="4" y="${y+24}">${i===0?esc(l.name+'*'):'←'}</text><text class="val" x="4" y="${y+40}">${i===0?v('Y:'+b+'R'):''}</text>`;
  s+=`<g><circle cx="90" cy="${y+22}" r="10" fill="none" stroke="currentColor"/><text x="86" y="${y+26}">Σ</text></g><path d="M40,${y+22}H78"/>`;
  s+=`<g class="${ai?'ai':''}"><rect x="140" y="${y+4}" width="150" height="36" rx="4"/><text x="148" y="${y+20}">${esc({pi:'PI',pi_nn:'PI + NN',code:'κώδικας'}[c.type||'pi'])} ${esc(l.name||'')}</text><text class="val" x="148" y="${y+35}">u = ${v('Y:'+b+'C')}${ai&&vals?` · nn = ${v('Y:'+b+'C:nn')}`:''}</text></g><path d="M100,${y+22}H138"/>`;
  s+=`<text x="300" y="${y+20}">${l.scale&&l.scale!==1?'×'+fmt(l.scale):''}</text><path d="M290,${y+22}H${i===n-1?470:330}${i<n-1?`V${y+rowH-4}H40V${y+rowH+22}`:''}"/>`;
  s+=`<text x="96" y="${y+52}">− ${esc(l.measure||'')} = ${v('Y:'+String(l.measure||'').split(':')[0])||''}</text>`;});
 s+=`<rect x="472" y="${10+(n-1)*rowH+4}" width="160" height="36" rx="4"/><text x="480" y="${10+(n-1)*rowH+26}">${esc($('#act').value||'ενεργοποιητής')} → κύκλωμα</text></svg>`;$('#diagram').innerHTML=s;}
async function live(){if(!composed){return;}const keys=[];loops.forEach((l,i)=>{const b=`AC${i+1}`;keys.push('Y:'+b+'R','Y:'+b+'C','Y:'+b+'C:nn','Y:'+String(l.measure||'').split(':')[0]);});
 try{const r=await PCL.values(keys);if(r.t!==null)diagram(r.values);}catch(e){}}

async function compose(variant){const L=JSON.parse(JSON.stringify(loops));if(variant)for(const l of L)if(l.ctrl&&variant[l.name])l.ctrl={...l.ctrl,...variant[l.name]};
 return PCL.python(`from pcl import control\nresult, desc = control.compose(project, loops, actuator, clock or None)\nresult = {'project': result, 'desc': desc}`,{project:proj,loops:L,actuator:$('#act').value,clock:$('#clock').value});}
$('#apply').onclick=async()=>{msg('σύνθεση…');try{const r=await compose();await PCL.load(r.project);composed=r.project.control.composed;proj=await PCL.project();
 msg(`Μπήκαν ${r.desc.length} βρόχοι: ${r.desc.map(d=>`${d.loop} (${d.ctrl}, μπλοκ ${d.block})`).join(', ')}. Τρέξε την προσομοίωση: οι τιμές φαίνονται στο διάγραμμα.`);
 if(!timer)timer=setInterval(live,400);}catch(e){msg(e.message,true);}};
// the same scenario with the classical controller and with the AI one, in parallel on the pool: IAE, ISE, overshoot, final error
$('#compare').onclick=async()=>{const ai=loops.find(l=>l.ctrl?.type==='pi_nn')||loops[0];if(!ai){msg('Κανένας βρόχος.',true);return;}const outer=loops[0],tend=+$('#tend').value||.4;
 const V=[['κλασικός (PI)',{[ai.name]:{type:'pi'}}],['PI + NN, χωρίς μάθηση',{[ai.name]:{type:'pi_nn',learn:false}}],['PI + NN, μαθαίνει',{[ai.name]:{type:'pi_nn',learn:true}}]];
 msg('σύγκριση… ('+V.length+' προσομοιώσεις)');try{const ps=[];for(const [,v] of V)ps.push((await compose(v)).project);
  const ch=['Y:AC1R','Y:'+String(outer.measure).split(':')[0]];const runs=await PCL.batch(ps.map(p=>({project:p,t_end:tend,channels:ch,max_points:20000})));
  const rows=[];const series={};let tt=null;
  for(let k=0;k<V.length;k++){const o=runs[k];if(o.error){rows.push({ελεγκτής:V[k][0],σφάλμα:o.error});continue;}const out=o.out;
   const m=await PCL.python('from pcl import control\nresult = control.metrics(t, r, y)',{t:out.t,r:out.ch[ch[0]],y:out.ch[ch[1]]});
   rows.push({ελεγκτής:V[k][0],IAE:+m.IAE.toPrecision(5),ISE:+m.ISE.toPrecision(5),'υπερύψωση %':+m.overshoot_pct.toPrecision(3),'τελικό σφάλμα':+m.final_error.toPrecision(3)});
   series[V[k][0]]=out.ch[ch[1]];tt=tt||out.t;}
  $('#out').innerHTML=`<table><thead><tr>${Object.keys(rows[0]).map(k=>`<th>${esc(k)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${Object.values(r).map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  await PCL.show({type:'table',title:'Σύγκριση ελεγκτών ('+outer.name+')',cols:Object.keys(rows[0]),rows:rows.map(r=>Object.values(r))});
  if(tt){const step=Math.max(1,Math.floor(tt.length/2000)),idx=tt.map((_,i)=>i).filter(i=>i%step===0);
   await PCL.show({type:'xy',title:outer.name+': κλασικός ↔ AI',x:idx.map(i=>tt[i]),xlabel:'t (s)',ylabel:outer.name,series:Object.fromEntries(Object.entries(series).map(([k,y])=>[k,idx.map(i=>y[i])]))});}
  msg('Η σύγκριση και στο πάνελ «Σενάρια» (πίνακας, γράφημα).');}catch(e){msg(e.message,true);}};
$('#add').onclick=()=>{const o=outs[0];loops.push({name:'βρόχος '+(loops.length+1),measure:o?o.k:'',yscale:1,ctrl:{type:'pi',Kp:1,Ki:0,lo:-1e9,hi:1e9}});draw();diagram();};
$('#suggest').onclick=()=>{suggest();draw();diagram();};
$('#act').onchange=()=>diagram();
PCL.on('project',()=>load());
load().catch(e=>msg(e.message,true));
