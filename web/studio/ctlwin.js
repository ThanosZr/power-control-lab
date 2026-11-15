'use strict';
// 4.17.4 (ROADMAP §64, THEORY §8Α): the window «Ρύθμιση ελεγκτή» of a PWM in closed loop. From the circuit (tune.js
// analyze): the converter and its roles, the operating point, G(s) = v/d with its poles and zeros, the static ratio M(D);
// the PI/PID entered or adjusted (fields and sliders, or «from the circuit» with a phase margin or a crossover), the
// feed-forward (none, D₀, the convergence method of the source of Thanos with k and N), and live: Bode of the loop with
// its margins, the closed loop on the averaged model, M(D) with D₀. «Εφαρμογή» writes the gains into the PWM; «Python»
// shows the same from code (pcl: Project.tune). On the core of the graphs (plotcore.js lineChart) and in the frame of the
// windows (winframe.js: resized from every side).
(function(root){
 const PC=()=>root.PlotCore,T=()=>root.Tune;
 const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 // a polynomial in s, descending powers, with engineering coefficients
 function poly(p,eng){const n=p.length-1,t=[];p.forEach((a,i)=>{if(!a||Math.abs(a)<1e-300)return;const k=n-i,mag=eng(Math.abs(a),'',4).trim();
   t.push((a<0?'− ':t.length?'+ ':'')+(k===0?mag:(Math.abs(Math.abs(a)-1)<1e-12?'':mag+'·')+'s'+(k>1?'^'+k:'')));});return t.join(' ')||'0';}
 // a root as text: real, or a pair with its natural frequency and damping
 function rootTxt(z,eng){const [re,im]=z;if(!im)return `${eng(re,'',4)}`+(re?` (f = ${eng(Math.abs(re)/(2*Math.PI),'Hz',3)})`:'');
  const wn=Math.hypot(re,im),zt=-re/wn;return `${eng(re,'',4)} ${im>0?'+':'−'} j${eng(Math.abs(im),'',4)} (f_n = ${eng(wn/(2*Math.PI),'Hz',3)}, ζ = ${zt.toFixed(3)})`;}
 function open(ctx,id){
  const c=ctx.comp(id);if(!c)return null;
  const box=document.createElement('div');box.className='modal ctl-modal';document.body.appendChild(box);
  const close=()=>{box.remove();document.removeEventListener('keydown',onKey);};const onKey=e=>{if(e.key==='Escape')close();};document.addEventListener('keydown',onKey);
  box.onclick=e=>{if(e.target===box)close();};
  const p0=ctx.params(id),st={ctl:p0.ctl==='pid'?'pid':'pi',Kp:+p0.Kp||0,Ki:+p0.Ki||0,Kd:+p0.Kd||0,Tf:+p0.Tf||0,ff:['none','const','conv'].includes(p0.ff)?p0.ff:'const',kc:+p0.kc||1,convN:+p0.convN||0,step:10,pm:+p0.pm||50,fc:+p0.fc||0};
  box.innerHTML=`<div class="modal-box ctl-box"><div class="modal-head"><h2>Ρύθμιση ελεγκτή · ${esc(c.label||c.id)}</h2><div><button data-cwpy title="Τα ίδια από κώδικα (pcl)">Python</button><button class="x" data-cwclose>✕</button></div></div>
   <div class="modal-body ctl-body"><div class="ctl-left">
    <section data-cwinfo></section>
    <section><h3>Ελεγκτής</h3><div class="ctl-row"><label>Τύπος<select data-cw="ctl"><option value="pi">PI</option><option value="pid">PID</option></select></label>
      <label title="Περιθώριο φάσης για «από το κύκλωμα»">PM°<input data-cw="pm" value="${st.pm}" size="4"></label><label title="Συχνότητα διέλευσης για «από το κύκλωμα» (0: η μεγαλύτερη με τα περιθώρια)">f_c<input data-cw="fc" value="${st.fc}" size="6"></label>
      <button data-cwauto title="Κέρδη με τα περιθώρια (φάσης, κέρδους ≥ 6 dB, M_s ≤ 2), όπως το «από το κύκλωμα» του PWM">Από το κύκλωμα</button></div>
     ${['Kp','Ki','Kd','Tf'].map(k=>`<div class="ctl-gain" data-row="${k}"><label>${{Kp:'K_p',Ki:'K_i',Kd:'K_d',Tf:'T_f'}[k]}<input data-cw="${k}" value="${st[k]}"></label><input type="range" min="-2" max="2" step="0.01" value="0" data-sl="${k}" title="×10^(−2 … +2) γύρω από την τιμή"></div>`).join('')}
    </section>
    <section><h3>Πρόσθια τροφοδότηση</h3><div class="ctl-row"><select data-cw="ff"><option value="none">καμία</option><option value="const">σταθερή D₀ (από το κύκλωμα)</option><option value="conv">μέθοδος σύγκλισης (πηγή του Θάνου)</option></select>
      <label class="cv" title="Συντελεστής του παράγοντα προσαρμογής: s = min(1, k·|r − y|/|r|)">k<input data-cw="kc" value="${st.kc}" size="4"></label><label class="cv" title="Κάθε πόσες περιόδους μεταγωγής, με τη μέση τιμή της εξόδου σε αυτές (0: αυτόματα, μία περίοδος του πιο αργού ρυθμού)">N<input data-cw="convN" value="${st.convN}" size="4"></label></div>
     <p class="muted small cv">D′ = (1 − s)·D + s·M⁻¹(M(D)·|r|/|ȳ|), s = min(1, k·|r − ȳ|/|r|), ȳ η μέση τιμή της εξόδου στις N περιόδους: η διόρθωση σβήνει όσο πλησιάζει τον στόχο. k = 1 όπως στην πηγή.</p></section>
    <section><h3>Αποτελέσματα</h3><div data-cwres class="ctl-res"></div><div class="ctl-row"><label>Βήμα αναφοράς<input data-cw="step" value="${st.step}" size="4"> %</label></div></section>
    <div class="ctl-row ctl-act"><button class="primary" data-cwapply>Εφαρμογή στο PWM</button><button data-cwclose>Κλείσιμο</button></div>
    <pre class="ctl-py" data-cwcode hidden></pre>
   </div><div class="ctl-right">
    <canvas class="ctl-cv" data-cv="mag"></canvas><canvas class="ctl-cv" data-cv="ph"></canvas><canvas class="ctl-cv" data-cv="step"></canvas><canvas class="ctl-cv small" data-cv="M"></canvas>
   </div></div></div>`;
  const $=s=>box.querySelector(s),$$=s=>[...box.querySelectorAll(s)];
  $$('[data-cwclose]').forEach(b=>b.onclick=close);
  $('[data-cw="ctl"]').value=st.ctl;$('[data-cw="ff"]').value=st.ff;
  const base={};let R=null,tm=0;
  const num=v=>{const x=ctx.parse(v);return Number.isFinite(x)?x:NaN;};
  function read(){for(const k of ['Kp','Ki','Kd','Tf','kc','convN','step','pm','fc']){const v=num($(`[data-cw="${k}"]`).value);if(Number.isFinite(v))st[k]=v;}st.ctl=$('[data-cw="ctl"]').value;st.ff=$('[data-cw="ff"]').value;}
  function vis(){for(const k of ['Kd','Tf'])$(`[data-row="${k}"]`).hidden=st.ctl!=='pid';$$('.cv').forEach(e=>e.hidden=st.ff!=='conv');}
  function compute(){read();vis();const a=ctx.args(id,{...p0,ctl:st.ctl,pm:st.pm,fc:st.fc,ff:st.ff});if(!a){$('[data-cwinfo]').innerHTML='<p class="bad">Ο PWM δεν είναι σε κλειστό βρόχο (PI/PID) ή δεν υπάρχει λύτης.</p>';return;}
   R=T().analyze(a,{Kp:st.Kp,Ki:st.Ki,Kd:st.ctl==='pid'?st.Kd:0,Tf:st.ctl==='pid'?st.Tf:0},{ff:st.ff,kc:st.kc,convN:st.convN,step:st.step/100});render();}
  function render(){const e=ctx.eng;if(!R||!R.ok){$('[data-cwinfo]').innerHTML=`<p class="bad">${esc(R?.error||'—')}</p>`;return;}
   const v=R.values,roles=Object.entries(R.roles).map(([r,i])=>`${r} = ${esc(i)}`).join(', ');
   $('[data-cwinfo]').innerHTML=`<h3>Μετατροπέας</h3><p><b>${esc(R.name)}</b> · ${roles}</p>
    <p class="small">V_in = ${e(Math.abs(v.Vg),'V',4)} · αναφορά ${e(R.ref,'',4)} · D₀ = ${R.D0.toFixed(4)} · |M(D)| = ${esc(R.M.txt)} · f_s = ${e(R.fs,'Hz',3)}</p>
    <h3>G(s) = μέτρηση/d</h3><p class="mono small">(${esc(poly(R.tf.num,e))}) / (${esc(poly(R.tf.den,e))})</p>
    <p class="small">G(0) = ${e(R.G0,'',4)} · πόλοι: ${R.poles.map(z=>esc(rootTxt(z,e))).join('; ')||'—'} · μηδενικά: ${R.zeros.map(z=>esc(rootTxt(z,e))).join('; ')||'—'}</p>`;
   const m=R.margins;$('[data-cwres]').innerHTML=m.ok!==undefined&&m.wc?`<span>f_c = <b>${e(m.wc/(2*Math.PI),'Hz',3)}</b></span><span>PM = <b>${m.pm.toFixed(1)}°</b></span><span>GM = <b>${Number.isFinite(m.gm)?(20*Math.log10(m.gm)).toFixed(1)+' dB':'∞'}</b></span><span>M_s = <b>${m.ms.toFixed(2)}</b></span><span class="${m.ok?'good':'bad'}">${m.ok?'μέσα στα περιθώρια':'εκτός περιθωρίων: '+[m.pm<st.pm?`PM < ${st.pm}°`:'',m.gm<2?'GM < 6 dB':'',m.ms>2?'M_s > 2':'',m.re?'δεύτερη διέλευση':'',m.wc>2*Math.PI*R.fs/10?'f_c > f_s/10':''].filter(Boolean).join(', ')}</span>`
    :`<span class="bad">${m.why==='low'?'το κέρδος του βρόχου στις χαμηλές συχνότητες είναι κάτω από 1 (λείπει ολοκλήρωση;)':'ο βρόχος δεν διασχίζει το 1'}</span>`;
   const L=R.L,mag=L.map(z=>20*Math.log10(Math.hypot(z[0],z[1]))),ph=[];let prev=null;for(const z of L){let a=Math.atan2(z[1],z[0]);if(prev!==null){while(a-prev>Math.PI)a-=2*Math.PI;while(a-prev<-Math.PI)a+=2*Math.PI;}prev=a;ph.push(a*180/Math.PI);}
   const sh=Math.round((ph[0]+90)/360)*360,phs=ph.map(a=>a-sh),G=R.G.map(z=>20*Math.log10(Math.hypot(z[0],z[1]))),f=R.f,fc=m.wc?m.wc/(2*Math.PI):null,fN=R.fs/2;
   PC().lineChart($('[data-cv="mag"]'),{title:'Bode του βρόχου L = C·G·ZOH (διακεκομμένη: G)',xlog:true,xUnit:'Hz',yUnit:'dB',yPlain:true,series:[{x:f,y:G,color:'#7b8e88',dash:[5,4],width:1.2},{x:f,y:mag,color:'#2b5ea7'}],hl:[{y:0,color:'#7b8e88'}],marks:fc?[{x:fc,label:'f_c',color:'#b03a5b'}]:[]});
   PC().lineChart($('[data-cv="ph"]'),{title:'Φάση του βρόχου',xlog:true,xUnit:'Hz',yUnit:'°',yPlain:true,series:[{x:f,y:phs,color:'#2b5ea7'}],hl:[{y:-180,color:'#b03a5b',label:'−180°'}],marks:fc?[{x:fc,label:`PM ${m.pm?.toFixed(0)}°`,color:'#b03a5b'}]:[]});
   const cl=R.cl;PC().lineChart($('[data-cv="step"]'),{title:`Κλειστός βρόχος στο μέσο μοντέλο: βήμα της αναφοράς ${st.step} %`,xfmt:(v,s,t1)=>PC().fmtTime(v,s,t1),series:[{x:cl.t,y:cl.r,color:'#7b8e88',dash:[5,4],width:1.2},{x:cl.t,y:cl.y,color:'#2b5ea7'}]});
   PC().lineChart($('[data-cv="M"]'),{title:`|M(D)| = ${R.M.txt}`,xPlain:true,yPlain:true,series:[{x:R.M.pts.map(q=>q[0]),y:R.M.pts.map(q=>q[1]),color:'#14191b'}],pts:[{x:R.D0,y:R.M.pts.length?(()=>{const T0=T().MD[R.key];return T0.M(R.D0);})():0,color:'#b03a5b',label:'D₀'}],y:[0,Math.min(10,Math.max(...R.M.pts.map(q=>q[1])))]});
   const code=ctx.code(id,st);$('[data-cwcode]').textContent=code;}
  const soon=()=>{clearTimeout(tm);tm=setTimeout(compute,120);};
  $$('[data-cw]').forEach(el=>{el.oninput=soon;el.onchange=compute;});
  $$('[data-sl]').forEach(sl=>{sl.onpointerdown=()=>{base[sl.dataset.sl]=num($(`[data-cw="${sl.dataset.sl}"]`).value)||0;};
   sl.oninput=()=>{const k=sl.dataset.sl,b=base[k]??(num($(`[data-cw="${k}"]`).value)||0),v=b*Math.pow(10,+sl.value);$(`[data-cw="${k}"]`).value=+v.toPrecision(4);soon();};
   sl.onchange=()=>{sl.value=0;delete base[sl.dataset.sl];};});
  $('[data-cwauto]').onclick=()=>{read();const a=ctx.args(id,{...p0,ctl:st.ctl,pm:st.pm,fc:st.fc});const d=a?T().design(a):null;if(!d||!d.ok){ctx.notice((d&&d.error)||'Δεν βρέθηκαν κέρδη.');return;}
   for(const k of ['Kp','Ki','Kd','Tf'])$(`[data-cw="${k}"]`).value=+(+d[k]||0).toPrecision(5);compute();};
  $('[data-cwapply]').onclick=()=>{read();ctx.apply(id,{gain:'manual',ctl:st.ctl,Kp:st.Kp,Ki:st.Ki,Kd:st.ctl==='pid'?st.Kd:0,Tf:st.ctl==='pid'?st.Tf:0,ff:st.ff,kc:st.kc,convN:st.convN,pm:st.pm,fc:st.fc});close();};
  $('[data-cwpy]').onclick=()=>{const pre=$('[data-cwcode]');pre.hidden=!pre.hidden;};
  box.addEventListener('wfr-resize',()=>render());new ResizeObserver(()=>{clearTimeout(box._rt);box._rt=setTimeout(render,80);}).observe($('.ctl-right'));
  compute();
  return {close,box,state:()=>({st:{...st},R})};}
 const api={open,poly,rootTxt};root.CtlWin=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
