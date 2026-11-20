'use strict';
// 4.24 (THEORY §8Ι.7, GUIDE §34): the window «Τρέξιμο σε υποδίκτυα». The network runs split in subnetworks to the end time, in
// a worker of its own (split_worker.js in the mode of the coordinator: the parts in that worker, or each group in a Worker of
// its own), with the settings of «Ρυθμίσεις επίλυσης → Υποδίκτυα και πολλαπλοί ρυθμοί». The window shows the channels of the
// scope, the steps, step and time of every group, and the largest difference from the run of the page (one simulator) where
// the page has run to the same time.
(function(root){
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const eng=(v,u,d)=>root.Parts?Parts.eng(v,u,d||3):String(v);
 // ctx: {project, title, panes: [[[key, label], …], …], stopT, hDiv, single(key) → {t, v} | null}
 function open(ctx){
  const box=document.createElement('div');box.className='modal split-modal';document.body.appendChild(box);let w=null;
  const close=()=>{if(w)w.terminate();box.remove();document.removeEventListener('keydown',onKey);};const onKey=e=>{if(e.key==='Escape')close();};document.addEventListener('keydown',onKey);
  box.onclick=e=>{if(e.target===box)close();};
  const so=ctx.project.solve||{},mode=so.split==='workers'||(so.split!=='serial'&&ctx.auto)?'workers':'serial';
  box.innerHTML=`<div class="modal-box split-box"><div class="modal-head"><h2>Τρέξιμο σε υποδίκτυα · ${esc(ctx.title||'')}</h2><div><button class="x" data-swclose>✕</button></div></div>
   <div class="modal-body split-body"><p class="small" data-swstat>Τρέχει ως ${eng(ctx.stopT,'s')} ${mode==='workers'?'σε Workers':'στο ίδιο νήμα (ένας worker)'}${so.rates==='auto'?', με πολλαπλούς ρυθμούς':''}…</p>
   <div data-swinfo></div><div data-swplots class="split-plots"></div></div></div>`;
  box.querySelector('[data-swclose]').onclick=close;
  const keys=ctx.panes.flatMap(p=>p.map(c=>c[0]));
  const opt={mode,sim:{hDiv:ctx.hDiv,method:ctx.method||'TR'},tEnd:ctx.stopT,groups:so.groups||(mode==='workers'?Math.max(2,Math.min(8,(root.navigator&&navigator.hardwareConcurrency)||2)):undefined),rates:so.rates||null,rateMax:so.rateMax,smooth:so.smooth};
  try{w=new Worker('studio/split_worker.js');}catch(e){box.querySelector('[data-swstat]').textContent='Δεν ξεκινά worker: '+e.message;return box;}
  const t0=performance.now();
  w.onmessage=e=>{const r=e.data;w.terminate();w=null;
   if(r.error){box.querySelector('[data-swstat]').innerHTML=`<span class="bad">⚠ ${esc(r.error)}</span>`;return;}
   const S=r.stats,P=r.plan,ms=performance.now()-t0;
   box.querySelector('[data-swstat]').innerHTML=`Έγινε σε ${(ms/1000).toFixed(2).replace('.',',')} s: ${P.parts} υποδίκτυα, ${P.allCuts} γραμμές ανάμεσά τους, ${P.groups.length} ${P.groups.length===1?'ομάδα':'ομάδες'} (${P.cuts} γραμμές κόβονται ανάμεσα σε ομάδες).`;
   const rows=P.groups.map((g,i)=>`<tr><td>${i+1}</td><td>${g.parts}</td><td>${g.n}</td><td>${g.m>1?g.m+'·h':'h'}</td><td>${eng(S.h[i],'s')}</td><td>${S.steps[i]}</td>${S.run?`<td>${S.build[i]} / ${S.run[i]}</td><td>${S.waits?S.waits[i]+' ('+S.waitMs[i]+' ms)':''}</td>`:''}</tr>`).join('');
   box.querySelector('[data-swinfo]').innerHTML=`<table class="split-tab"><thead><tr><th>Ομάδα</th><th>Υποδίκτυα</th><th>Άγνωστοι</th><th>Ρυθμός</th><th>Βήμα</th><th>Βήματα</th>${S.run?'<th>Κατασκευή / τρέξιμο (ms)</th><th>Αναμονές</th>':''}</tr></thead><tbody>${rows}</tbody></table>`;
   const by=new Map(r.series.map(q=>[q.k,q]));const plots=box.querySelector('[data-swplots]');
   for(const pane of ctx.panes){const sec=document.createElement('section');const cv=document.createElement('canvas');cv.className='split-cv';sec.appendChild(cv);const note=document.createElement('p');note.className='muted small';sec.appendChild(note);plots.appendChild(sec);
    const series=[],notes=[];const col=['#1f6f8b','#c0392b','#2e8b57','#8e44ad'];
    pane.forEach(([k,lab],i)=>{const q=by.get(k);if(!q)return;series.push({x:q.t,y:q.v,color:col[i%4],width:1.6,label:lab});
     const one=ctx.single?ctx.single(k):null;
     if(one&&one.t.length&&one.t[one.t.length-1]>=ctx.stopT*(1-1e-6)){series.push({x:one.t,y:one.v,color:col[i%4],dash:[5,4],width:1,label:lab+' (ένας λύτης)'});
      let sc=0,d=0;for(const v of one.v)sc=Math.max(sc,Math.abs(v));
      for(let j=0;j<q.t.length;j++){const x=q.t[j];let lo=0,hi=one.t.length-1;if(x<one.t[0]||x>one.t[hi])continue;while(hi-lo>1){const m=(lo+hi)>>1;if(one.t[m]<=x)lo=m;else hi=m;}const y=one.v[lo]+(one.v[hi]-one.v[lo])*(x-one.t[lo])/((one.t[hi]-one.t[lo])||1);d=Math.max(d,Math.abs(q.v[j]-y));}
      notes.push(`${lab}: μέγιστη διαφορά από τον έναν λύτη ${sc>0?(100*d/sc).toPrecision(2).replace('.',','):'0'} % του μεγίστου`);}});
    note.textContent=notes.length?notes.join(' · '):'Τρέξε πρώτα και τη σελίδα ως το ίδιο τέλος για σύγκριση με τον έναν λύτη (διακεκομμένη).';
    if(series.length&&root.PlotCore)PlotCore.lineChart(cv,{title:pane.map(c=>c[1]).join(', '),xUnit:'s',series});}};
  w.onerror=e=>{box.querySelector('[data-swstat]').innerHTML=`<span class="bad">⚠ ${esc(e.message||'σφάλμα στον worker')}</span>`;};
  w.postMessage({coord:true,project:JSON.parse(JSON.stringify(ctx.project)),opt,keys});
  return box;}
 const api={open};root.SplitWin=api;if(typeof module!=='undefined')module.exports=api;
})(typeof self!=='undefined'?self:globalThis);
