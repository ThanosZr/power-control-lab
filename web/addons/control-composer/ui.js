'use strict';
// Σύνθεση ελέγχου (built-in add-on, 3.15–3.16, ROADMAP §38). The loops are chosen here and composed by pcl/control.py in the
// app's Python, so the same composition runs from a script, the command line or MATLAB. A plug-in visualization:
// the loop diagram, with the live values of the blocks (PCL.values) while the app simulates.
// 3.16: the inverse ANN with emulator (training in phases: excite → emulator → controller → online, InverseTrainer) and
// RL by policy search (RLTrainer), each phase a call to the app's Python with the trainer's state as JSON, so the steps
// and their progress show here; the episodes and the comparisons run on the app's pool of workers.
const $=s=>document.querySelector(s);
const TYPES=[['pi','PI'],['pi_nn','PI + νευρωνικό (μαθαίνει online)'],['inv_nn','αντίστροφο νευρωνικό με εξομοιωτή (φάσεις)'],['rl','ενισχυτική μάθηση (RL)'],['code','δικός μου κώδικας Python']];
const SHORT={pi:'PI',pi_nn:'PI + NN',inv_nn:'αντίστροφο NN',rl:'RL',code:'κώδικας'};
const AI=new Set(['pi_nn','inv_nn','rl','code']);
let proj=null,outs=[],ins=[],loops=[],timer=null,composed=null,stop=false,busy=false;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const msg=(t,bad)=>{$('#msg').textContent=t||'';$('#msg').className='small'+(bad?' err':'');};
const fmt=v=>Number.isFinite(v)?String(+v.toPrecision(4)).replace('.',','):'—';
const trained=c=>c&&(c.type==='inv_nn'?!!c.nets:c.type==='rl'?!!c.theta:true);

async function load(){proj=await PCL.project();const P=window.Parts;outs=[];ins=[];
 for(const c of proj.components){let sp={};try{sp=P.sigPins(c);}catch(e){}for(const [pin,d] of Object.entries(sp)){(d.dir==='out'?outs:ins).push({k:c.id+':'+pin,label:`${c.label||c.id}.${pin}`,type:c.type,id:c.id});}
  if(c.type==='PWM'&&!ins.some(x=>x.k===c.id+':d'))ins.push({k:c.id+':d',label:`${c.label||c.id}.d (duty)`,type:'PWM',id:c.id});}
 const own=x=>!x.id.startsWith('AC');outs=outs.filter(own);ins=ins.filter(own);
 $('#act').innerHTML=ins.map(x=>`<option value="${esc(x.k)}">${esc(x.label)}</option>`).join('')||'<option value="">— κανένα σήμα εισόδου —</option>';
 $('#sigs').innerHTML=outs.map(o=>`<option value="${esc(o.k)}">${esc(o.label)}</option>`).join('');
 const pref=ins.find(x=>x.type==='PWM');if(pref)$('#act').value=pref.k;
 const clocks=proj.components.filter(c=>c.type==='PWM'||c.type==='CLK');$('#clock').innerHTML=clocks.map(c=>`<option value="${esc(c.id)}">${esc(c.label||c.id)}</option>`).join('')+'<option value="">(συνεχής)</option>';
 const prev=proj.control?.composed;if(prev&&!loops.length){loops=prev.loops;$('#act').value=prev.actuator;$('#clock').value=prev.clock||'';composed=prev;}
 if(!loops.length)suggest();draw();diagram();}

// a first proposal: a machine with an ammeter → speed over current; otherwise one loop on the first measurement
function suggest(){const m=proj.components.find(c=>['DCM','IM','SM'].includes(c.type)),am=outs.find(x=>x.type==='AM'),w=m?outs.find(x=>x.id===m.id&&/:w$/.test(x.k)):null;
 const pwm=proj.components.find(c=>c.type==='PWM'),Vdc=+(proj.components.find(c=>c.type==='VDC')?.params?.V)||1;
 if(m&&am&&w){const La=+m.params.La||10e-3,Ra=+m.params.Ra||.5,J=+m.params.J||.02,ac=2*Math.PI*200,as=ac/10;
  loops=[{name:'ω',measure:w.k,ref:'0:0, 0.02:100, 0.2:150',yscale:150,Ts:1e-3,state:[am.k],state_scale:[30],ctrl:{type:'pi',Kp:+(as*J).toPrecision(4),Ki:+(as*as*J/4).toPrecision(4),lo:-30,hi:30,lr:.05,learn:true}},
   {name:'i',measure:am.k,yscale:30,ctrl:{type:'pi',Kp:+(ac*La).toPrecision(4),Ki:+(ac*Ra).toPrecision(4),lo:0,hi:Vdc},scale:+(1/Vdc).toPrecision(6)}];}
 else{const o=am||outs[0];loops=o?[{name:'y',measure:o.k,ref:'1',yscale:1,ctrl:{type:'pi',Kp:.1,Ki:10,lo:0,hi:.95}}]:[];}
 if(pwm)$('#clock').value=pwm.id;}

function draw(){$('#loops').innerHTML=loops.map((l,i)=>{const c=l.ctrl||{};const opt=(L,v)=>L.map(([k,t])=>`<option value="${esc(k)}" ${k===v?'selected':''}>${esc(t)}</option>`).join('');const ai=AI.has(c.type);
 return `<div class="loop" data-i="${i}"><div class="head"><b>${i+1}. ${i===0?'εξωτερικός':i===loops.length-1?'εσωτερικός':'ενδιάμεσος'}</b><button data-up>↑</button><button data-down>↓</button><button data-del>✕</button></div><div class="grid">
  <label>Όνομα <input data-f="name" value="${esc(l.name||'')}"></label>
  <label>Μέτρηση <select data-f="measure">${outs.map(o=>`<option value="${esc(o.k)}" ${o.k===l.measure?'selected':''}>${esc(o.label)}</option>`).join('')}</select></label>
  ${i===0?`<label>Αναφορά (τιμή ή t:τιμή) <input data-f="ref" value="${esc(l.ref??'')}"></label>`:''}
  <label>Ελεγκτής <select data-c="type">${opt(TYPES,c.type||'pi')}</select></label>
  <label><span>K<sub>p</sub></span> <input type="number" data-c="Kp" value="${c.Kp??1}"></label><label><span>K<sub>i</sub></span> <input type="number" data-c="Ki" value="${c.Ki??0}"></label>
  <label>έξοδος min <input type="number" data-c="lo" value="${c.lo??-1e9}"></label><label>έξοδος max <input type="number" data-c="hi" value="${c.hi??1e9}"></label>
  <label>κλίμακα προς τα μέσα <input type="number" data-f="scale" value="${l.scale??1}"></label><label>κλίμακα μέτρησης <input type="number" data-f="yscale" value="${l.yscale??1}"></label>
  ${ai?`<label>T<sub>s</sub> του βρόχου (s, κενό: ρολόι) <input type="number" step="any" data-f="Ts" value="${l.Ts??''}"></label>
  <label>κατάσταση (μετρήσεις, με κόμμα) <input list="sigs" data-f="state" value="${esc((l.state||[]).join(', '))}"></label>
  <label>κλίμακα κατάστασης <input data-f="state_scale" value="${esc((l.state_scale||[]).join(', '))}"></label>`:''}
  ${c.type==='pi_nn'?`<label>ρυθμός μάθησης <input type="number" step="0.01" data-c="lr" value="${c.lr??.02}"></label><label class="row"><input type="checkbox" data-c="learn" ${c.learn!==false?'checked':''}> μαθαίνει</label>`:''}
  ${c.type==='inv_nn'?`<label>α (στόχος ενός βήματος) <input type="number" step="0.05" data-c="alpha" value="${c.alpha??.5}"></label><label>μέγιστο βήμα (× D) <input type="number" step="0.1" data-c="max_step" value="${c.max_step??.8}"></label>
   <label>ρυθμός εξομοιωτή online <input type="number" step="0.005" data-c="lr_emu" value="${c.lr_emu??.01}"></label><label>ρυθμός ελεγκτή online <input type="number" step="0.005" data-c="lr_ctrl" value="${c.lr_ctrl??.02}"></label>
   <label class="row"><input type="checkbox" data-c="learn" ${c.learn!==false?'checked':''}> μαθαίνει online</label><span class="small ${c.nets?'pass':'muted'}">${c.nets?'εκπαιδευμένο':'θέλει εκπαίδευση ↓'}</span>`:''}
  ${c.type==='rl'?`<label>βάση <select data-c="base">${opt([['pi','PI + πολιτική'],['none','μόνο πολιτική']],c.base||'pi')}</select></label><span class="small ${c.theta?'pass':'muted'}">${c.theta?'εκπαιδευμένο':'θ = 0: ίδιο με τον PI ως την εκπαίδευση ↓'}</span>`:''}
 </div>${c.type==='code'?`<label>Κώδικας (init/step, είσοδοι e, r, y και s1, s2, … της κατάστασης, έξοδος u) <textarea data-c="code" rows="8" style="width:100%;font:12px monospace">${esc(c.code||'def init(p):\n    return {}\n\ndef step(t, u, s, p):\n    return {"u": p["Kp"] * u["e"]}\n')}</textarea></label>`:''}</div>`;}).join('')||'<p class="muted small">Κανένας βρόχος.</p>';
 document.querySelectorAll('#loops .loop').forEach(el=>{const i=+el.dataset.i,l=loops[i];
  el.querySelectorAll('[data-f]').forEach(x=>x.onchange=()=>{const f=x.dataset.f;
   if(f==='state')l.state=x.value.split(',').map(s=>s.trim()).filter(Boolean);
   else if(f==='state_scale')l.state_scale=x.value.split(',').map(s=>+s.trim()).filter(v=>v>0);
   else if(f==='Ts'){if(x.value==='')delete l.Ts;else l.Ts=+x.value;}
   else l[f]=x.type==='number'?+x.value:x.value;
   if(['state','Ts'].includes(f)&&l.ctrl){delete l.ctrl.nets;delete l.ctrl.theta;draw();}diagram();});
  el.querySelectorAll('[data-c]').forEach(x=>x.onchange=()=>{const f=x.dataset.c;l.ctrl=l.ctrl||{};l.ctrl[f]=x.type==='checkbox'?x.checked:x.type==='number'?+x.value:x.value;if(f==='type'){draw();train();}diagram();});
  el.querySelector('[data-del]').onclick=()=>{loops.splice(i,1);draw();diagram();train();};
  el.querySelector('[data-up]').onclick=()=>{if(i>0){[loops[i-1],loops[i]]=[loops[i],loops[i-1]];draw();diagram();train();}};
  el.querySelector('[data-down]').onclick=()=>{if(i<loops.length-1){[loops[i+1],loops[i]]=[loops[i],loops[i+1]];draw();diagram();train();}};});}

// the plug-in visualization: the cascade as a block diagram, the live values of the blocks on it
function diagram(vals){const n=loops.length;if(!n){$('#diagram').innerHTML='';return;}const W=640,rowH=64,H=n*rowH+20;let s=`<svg viewBox="0 0 ${W} ${H}"><defs><marker id="arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L8,4L0,8z" fill="currentColor" stroke="none"/></marker></defs>`;
 const v=k=>vals&&k in vals?fmt(vals[k]):'';
 loops.forEach((l,i)=>{const y=10+i*rowH,c=l.ctrl||{},t=c.type||'pi',ai=AI.has(t)&&t!=='code',b=`AC${i+1}`;
  const extra=t==='pi_nn'?` · nn = ${v('Y:'+b+'C:nn')}`:t==='inv_nn'?` · ŷ = ${v('Y:'+b+'C:yhat')}`:t==='rl'?` · π = ${v('Y:'+b+'C:pi')}`:'';
  s+=`<text x="4" y="${y+24}">${i===0?esc(l.name+'*'):'←'}</text><text class="val" x="4" y="${y+40}">${i===0?v('Y:'+b+'R'):''}</text>`;
  s+=`<g><circle cx="90" cy="${y+22}" r="10" fill="none" stroke="currentColor"/><text x="86" y="${y+26}">Σ</text></g><path d="M40,${y+22}H78"/>`;
  s+=`<g class="${ai?'ai':''}"><rect x="140" y="${y+4}" width="150" height="36" rx="4"/><text x="148" y="${y+20}">${esc(SHORT[t])} ${esc(l.name||'')}${l.Ts?` · ${fmt(l.Ts*1e3)} ms`:''}</text><text class="val" x="148" y="${y+35}">u = ${v('Y:'+b+'C')}${vals?extra:''}</text></g><path d="M100,${y+22}H138"/>`;
  s+=`<text x="300" y="${y+20}">${l.scale&&l.scale!==1?'×'+fmt(l.scale):''}</text><path d="M290,${y+22}H${i===n-1?470:330}${i<n-1?`V${y+rowH-4}H40V${y+rowH+22}`:''}"/>`;
  s+=`<text x="96" y="${y+52}">− ${esc(l.measure||'')} = ${v('Y:'+String(l.measure||'').split(':')[0])||''}${(l.state||[]).length&&ai?` · κατάσταση: ${esc(l.state.join(', '))}`:''}</text>`;});
 s+=`<rect x="472" y="${10+(n-1)*rowH+4}" width="160" height="36" rx="4"/><text x="480" y="${10+(n-1)*rowH+26}">${esc($('#act').value||'ενεργοποιητής')} → κύκλωμα</text></svg>`;$('#diagram').innerHTML=s;}
async function live(){if(!composed){return;}const keys=[];loops.forEach((l,i)=>{const b=`AC${i+1}`;keys.push('Y:'+b+'R','Y:'+b+'C','Y:'+b+'C:nn','Y:'+b+'C:yhat','Y:'+b+'C:pi','Y:'+String(l.measure||'').split(':')[0]);});
 try{const r=await PCL.values(keys);if(r.t!==null)diagram(r.values);}catch(e){}}

async function compose(variant){const L=JSON.parse(JSON.stringify(loops));if(variant)for(const l of L)if(l.ctrl&&variant[l.name])l.ctrl={...l.ctrl,...variant[l.name]};
 return PCL.python(`from pcl import control\nresult, desc = control.compose(project, loops, actuator, clock or None)\nresult = {'project': result, 'desc': desc}`,{project:proj,loops:L,actuator:$('#act').value,clock:$('#clock').value});}
$('#apply').onclick=async()=>{const un=loops.find(l=>l.ctrl?.type==='inv_nn'&&!l.ctrl.nets);if(un){msg(`Ο βρόχος «${un.name}» θέλει πρώτα εκπαίδευση (παρακάτω).`,true);return;}
 msg('σύνθεση…');try{const r=await compose();await PCL.load(r.project);composed=r.project.control.composed;proj=await PCL.project();
 msg(`Μπήκαν ${r.desc.length} βρόχοι: ${r.desc.map(d=>`${d.loop} (${d.ctrl}, μπλοκ ${d.block})`).join(', ')}. Τρέξε την προσομοίωση: οι τιμές φαίνονται στο διάγραμμα.`);
 if(!timer)timer=setInterval(live,400);}catch(e){msg(e.message,true);}};

// ---------------------------------------------------------------- training in phases (3.16)
const tr={};   // per loop name: {kind, state, steps:{id:{f, text}}, hist:[…]}
const INV_STEPS=[['excite','Διέγερση του κυκλώματος'],['emulator','Εξομοιωτής (ANN 2)'],['controller','Ελεγκτής (ANN 1)'],['online','Online στο κύκλωμα']];
const RL_STEPS=[['baseline','Επεισόδιο αναφοράς (PI)'],['search','Αναζήτηση πολιτικής (ES)'],['apply','Η καλύτερη πολιτική στον βρόχο']];
function train(){const L=loops.filter(l=>['inv_nn','rl'].includes(l.ctrl?.type));
 if(!L.length){$('#train').innerHTML='';return;}
 $('#train').innerHTML='<h4>Εκπαίδευση σε φάσεις</h4>'+L.map(l=>{const k=l.ctrl.type,t=tr[l.name]||{},S=k==='inv_nn'?INV_STEPS:RL_STEPS;
  const opts=k==='inv_nn'?`<label>διάρκεια διέγερσης (s) <input type="number" step="0.1" data-o="t_excite" value="${t.o?.t_excite??0.8}"></label><label>εποχές εξομοιωτή <input type="number" data-o="epochs_emu" value="${t.o?.epochs_emu??40}"></label>
   <label>εποχές ελεγκτή <input type="number" data-o="epochs_ctrl" value="${t.o?.epochs_ctrl??40}"></label><label>βήμα λύτη T/N <input type="number" data-o="hdiv" value="${t.o?.hdiv??50}"></label>`
   :`<label>επαναλήψεις <input type="number" data-o="iters" value="${t.o?.iters??8}"></label><label>πληθυσμός <input type="number" data-o="population" value="${t.o?.population??8}"></label>
   <label>σ <input type="number" step="0.01" data-o="sigma" value="${t.o?.sigma??0.1}"></label><label>ρυθμός <input type="number" step="0.01" data-o="lr" value="${t.o?.lr??0.05}"></label>
   <label>επεισόδιο (s) <input type="number" step="0.05" data-o="t_end" value="${t.o?.t_end??($('#tend').value||0.4)}"></label><label>βήμα λύτη T/N <input type="number" data-o="hdiv" value="${t.o?.hdiv??50}"></label>`;
  return `<div class="loop" data-train="${esc(l.name)}"><div class="head"><b>${esc(l.name)}: ${esc(SHORT[k])}</b><button data-go class="primary" ${busy?'disabled':''}>Εκπαίδευση</button><button data-stop>Διακοπή</button></div>
   <div class="grid">${opts}</div><ol class="steps">${S.map(([id,title])=>{const st=(t.steps||{})[id]||{};return `<li><span>${esc(title)}</span><span class="bar"><i style="width:${Math.round(100*(st.f||0))}%"></i></span><span class="small muted">${esc(st.text||'')}</span></li>`;}).join('')}</ol>
   <div class="curve">${curve(t.hist||[],k==='inv_nn'?'MSE (log)':'J = IAE/IAE_PI + υπερύψωση')}</div></div>`;}).join('');
 document.querySelectorAll('[data-train]').forEach(el=>{const name=el.dataset.train;
  el.querySelectorAll('[data-o]').forEach(x=>x.onchange=()=>{const t=tr[name]=tr[name]||{};t.o={...(t.o||{}),[x.dataset.o]:+x.value};});
  el.querySelector('[data-go]').onclick=()=>run(name,el);el.querySelector('[data-stop]').onclick=()=>{stop=true;msg('σταματά μετά το τρέχον βήμα…');};});}
function curve(h,label){if(!h.length)return '';const W=300,H=70,ys=h.map(p=>p.y),lg=label.includes('log'),f=v=>lg?Math.log10(Math.max(1e-12,v)):v;
 const a=Math.min(...ys.map(f)),b=Math.max(...ys.map(f)),sx=i=>8+(W-16)*i/Math.max(1,h.length-1),sy=v=>H-10-(H-20)*(b>a?(f(v)-a)/(b-a):.5);
 const groups=[...new Set(h.map(p=>p.g))];return `<svg viewBox="0 0 ${W} ${H}">${groups.map((g,gi)=>{const pts=h.map((p,i)=>[i,p]).filter(([,p])=>p.g===g);return `<polyline class="c${gi}" points="${pts.map(([i,p])=>`${sx(i)},${sy(p.y)}`).join(' ')}"/>`;}).join('')}<text x="8" y="10">${esc(label)}: ${fmt(ys[ys.length-1])}</text></svg>`;}
function opts(name){const el=document.querySelector(`[data-train="${CSS.escape(name)}"]`),o={};el.querySelectorAll('[data-o]').forEach(x=>{o[x.dataset.o]=+x.value;});return o;}
function setStep(name,id,f,text){const t=tr[name];t.steps=t.steps||{};t.steps[id]={f,text};train();}
async function run(name){if(busy)return;const li=loops.findIndex(l=>l.name===name),l=loops[li];if(li<0)return;const t=tr[name]={...(tr[name]||{}),o:opts(name),steps:{},hist:[]};
 busy=true;stop=false;msg(`εκπαίδευση «${name}»…`);train();const base={project:proj,loops:JSON.parse(JSON.stringify(loops)),actuator:$('#act').value,clock:$('#clock').value,li};
 try{if(l.ctrl.type==='inv_nn'){
   setStep(name,'excite',.05,'προσομοίωση με τον κλασικό βρόχο, τυχαία αναφορά και διέγερση…');
   let r=await PCL.python(`from pcl import control\ntr = control.InverseTrainer(project, loops, actuator, loop=li, clock=clock or None, t_excite=o['t_excite'], epochs_emu=int(o['epochs_emu']), epochs_ctrl=int(o['epochs_ctrl']), run={'hdiv': int(o['hdiv'])})\ninfo = tr.excite()\nresult = {'state': tr.to_dict(), 'info': info}`,{...base,o:t.o});
   let st=r.state;setStep(name,'excite',1,`${r.info.samples} δείγματα, T_s = ${fmt(r.info.Ts*1e3)} ms, y ${fmt(r.info.y[0])} … ${fmt(r.info.y[1])}, u ${fmt(r.info.u[0])} … ${fmt(r.info.u[1])}`);
   for(const [ph,tot] of [['emulator',t.o.epochs_emu],['controller',t.o.epochs_ctrl]]){let done=0;
    while(done<tot){if(stop)throw new Error('Διακόπηκε.');const n=Math.min(5,tot-done);
     r=await PCL.python(`from pcl import control\ntr = control.InverseTrainer.from_dict(state)\nh = tr.${ph}(n)\nresult = {'state': tr.to_dict(), 'h': h}`,{state:st,n});st=r.state;done=r.h.length;
     t.hist=t.hist.filter(p=>p.g!==ph).concat(r.h.map(y=>({g:ph,y})));setStep(name,ph,done/tot,`εποχή ${done}/${tot} · MSE ${fmt(r.h[r.h.length-1])}`);}}
   r=await PCL.python(`from pcl import control\ntr = control.InverseTrainer.from_dict(state)\nresult = tr.ctrl_spec(True)`,{state:st});
   l.ctrl={...l.ctrl,...r};t.state=null;setStep(name,'online',1,'τα βάρη μπήκαν στον βρόχο: «Εφαρμογή» και τρέξιμο, ή «Σύγκριση»');}
  else{const iters=Math.max(1,t.o.iters|0);let st=null,r;
   setStep(name,'baseline',.1,'επεισόδιο με θ = 0 (ο PI)…');
   for(let k=0;k<iters;k++){if(stop)throw new Error('Διακόπηκε.');
    r=await PCL.python(`from pcl import control\ntr = control.RLTrainer.from_dict(state) if state else control.RLTrainer(project, loops, actuator, loop=li, clock=clock or None, t_end=o['t_end'], population=int(o['population']), sigma=o['sigma'], lr=o['lr'], run={'hdiv': int(o['hdiv'])})\ntr.iterate(1)\nresult = {'state': tr.to_dict(), 'hist': tr.hist, 'baseline': tr.baseline, 'spec': tr.ctrl_spec()}`,{...base,o:t.o,state:st});
    st=r.state;const h=r.hist[r.hist.length-1];setStep(name,'baseline',1,`J_PI = ${fmt(r.baseline.J)}, IAE_PI = ${fmt(r.baseline.metrics[0].IAE)}`);
    t.hist=r.hist.flatMap(p=>[{g:'θ',y:p.J_theta},{g:'καλύτερο',y:p.J_best}]);setStep(name,'search',(k+1)/iters,`επανάληψη ${k+1}/${iters} · J(θ) = ${fmt(h.J_theta)} · καλύτερο ${fmt(h.J_best)} (${t.o.population+1} επεισόδια)`);}
   l.ctrl={...l.ctrl,...r.spec};setStep(name,'apply',1,'η καλύτερη πολιτική μπήκε στον βρόχο: «Εφαρμογή» ή «Σύγκριση»');}
  draw();msg(`Εκπαίδευση «${name}»: έτοιμη.`);}
 catch(e){msg(e.message,true);}finally{busy=false;train();}}

// the same scenario with the classical controller and with the AI ones, in parallel on the pool: IAE, ISE, overshoot, final error
function variants(){const V=[['κλασικός (PI)',Object.fromEntries(loops.filter(l=>AI.has(l.ctrl?.type)).map(l=>[l.name,{type:'pi'}]))]];
 for(const l of loops){const c=l.ctrl||{},n=l.name;
  if(c.type==='pi_nn')V.push([`PI + NN, χωρίς μάθηση (${n})`,{[n]:{type:'pi_nn',learn:false}}],[`PI + NN, μαθαίνει (${n})`,{[n]:{type:'pi_nn',learn:true}}]);
  if(c.type==='inv_nn'&&c.nets)V.push([`αντίστροφο NN, χωρίς online (${n})`,{[n]:{learn:false}}],[`αντίστροφο NN, online (${n})`,{[n]:{learn:true}}]);
  if(c.type==='rl'&&c.theta)V.push([`RL (${n})`,{[n]:{}}]);
  if(c.type==='code')V.push([`κώδικας (${n})`,{[n]:{}}]);}
 if(V.length===1&&loops[0])V.push(['PI + NN, μαθαίνει',{[loops[0].name]:{type:'pi_nn',learn:true}}]);
 return V;}
$('#compare').onclick=async()=>{const outer=loops[0],tend=+$('#tend').value||.4;if(!outer){msg('Κανένας βρόχος.',true);return;}
 const V=variants();msg('σύγκριση… ('+V.length+' προσομοιώσεις στο pool)');try{const ps=[];for(const [,v] of V)ps.push((await compose(v)).project);
  const ch=['Y:AC1R','Y:'+String(outer.measure).split(':')[0]];const runs=await PCL.batch(ps.map(p=>({project:p,t_end:tend,channels:ch,max_points:20000})));
  const rows=[];const series={};let tt=null;
  for(let k=0;k<V.length;k++){const o=runs[k];if(o.error){rows.push({ελεγκτής:V[k][0],IAE:'',ISE:'','υπερύψωση %':'','τελικό σφάλμα':o.error});continue;}const out=o.out;
   const m=await PCL.python('from pcl import control\nresult = control.metrics(t, r, y)',{t:out.t,r:out.ch[ch[0]],y:out.ch[ch[1]]});
   rows.push({ελεγκτής:V[k][0],IAE:+m.IAE.toPrecision(5),ISE:+m.ISE.toPrecision(5),'υπερύψωση %':+m.overshoot_pct.toPrecision(3),'τελικό σφάλμα':+m.final_error.toPrecision(3)});
   series[V[k][0]]=out.ch[ch[1]];tt=tt||out.t;}
  $('#out').innerHTML=`<table><thead><tr>${Object.keys(rows[0]).map(k=>`<th>${esc(k)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${Object.values(r).map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  await PCL.show({type:'table',title:'Σύγκριση ελεγκτών ('+outer.name+')',cols:Object.keys(rows[0]),rows:rows.map(r=>Object.values(r))});
  if(tt){const step=Math.max(1,Math.floor(tt.length/2000)),idx=tt.map((_,i)=>i).filter(i=>i%step===0);
   await PCL.show({type:'xy',title:outer.name+': κλασικός ↔ AI',x:idx.map(i=>tt[i]),xlabel:'t (s)',ylabel:outer.name,series:Object.fromEntries(Object.entries(series).map(([k,y])=>[k,idx.map(i=>y[i])]))});}
  msg('Η σύγκριση και στο πάνελ «Σενάρια» (πίνακας, γράφημα).');}catch(e){msg(e.message,true);}};
$('#add').onclick=()=>{const o=outs[0];loops.push({name:'βρόχος '+(loops.length+1),measure:o?o.k:'',yscale:1,ctrl:{type:'pi',Kp:1,Ki:0,lo:-1e9,hi:1e9}});draw();diagram();};
$('#suggest').onclick=()=>{suggest();draw();diagram();train();};
$('#act').onchange=()=>diagram();
PCL.on('project',()=>load().then(train));
load().then(train).catch(e=>msg(e.message,true));
