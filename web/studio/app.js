'use strict';
(function(){
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const P=window.Parts,SubC=window.SubCircuit,eng=(v,u,d=4)=>P.eng(v,u,d);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const FMT8={maximumFractionDigits:8},fmt=(v,d=4)=>Number.isFinite(v)?Parts.fmtNum(Number(v.toPrecision(d)),FMT8):'—';
const S={tut:{id:'buck',options:{}},sim:null,running:false,frame:0,speed:100,stopT:0,error:null,last:0,limited:false,
 nav:[],top:null,pfx:''}; // subcircuits (3.17): the levels open in the editor, the top document while inside, the path of the open instance
let editor,scope;

// ------------------------------------------------------------------ settings
const SETTINGS_KEY='pcl2-settings';
function loadSettings(){try{return JSON.parse(localStorage.getItem(SETTINGS_KEY))||{};}catch{return {};}}
function saveSettings(){try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(editor.settings));}catch{}}

// ------------------------------------------------------------------ notices
function notice(text,kind='info'){const n=$('#notice');if(!text){n.hidden=true;return;}n.hidden=false;n.className='notice '+kind;n.innerHTML=text;}
function warnings(list){const w=$('#netwarn');w.innerHTML=(list||[]).map(t=>`<span>⚠ ${esc(t)}</span>`).join('');w.hidden=!(list&&list.length);}

// ------------------------------------------------------------------ simulation
function project(){return {...fullDoc(),tutRef:S.tutRef||null,sim:{hDiv:+$('#sim-step').value,speed:S.speed,stopT:S.stopT,method:$('#method').value,...(+$('#rec-res')?.value>0?{rec:{dt:+$('#rec-res').value}}:{})},scope:{cfg:scope.cfg},tutorial:S.tut,...(S.scenCode?{scenario:S.scenCode}:{})};}
function buildSim(fresh){
 const doc=fullDoc();
 try{
  if(!S.sim||fresh){window.Live?.drop();S.sim=new MNA.Sim(doc,{hDiv:+$('#sim-step').value,method:$('#method').value,mem:memSetting(),eventsMax:evMaxSetting()});applyRec();}
  else S.sim.load(doc,false);
  S.error=null;warnings(S.sim.net.warnings);scope.attach(S.sim);notice('');editor.setDiag(viewDiag(S.sim.net.diag));
 }catch(e){S.error=e.message;pause();
  if(e.needPython){notice(esc(e.message),'info'); // code blocks (3.3): load Pyodide once, then build again
   PyRT.load().then(()=>{buildSim(true);draw(true);if(!S.error)notice(`Η Python (Pyodide ${esc(PyRT.py?.version||'')}) είναι έτοιμη (${PyRT.source?.startsWith('http')?'από το CDN':'τοπικό αντίγραφο'}).`,'info');setTimeout(()=>notice(''),3000);})
    .catch(err=>notice('Δεν φορτώθηκε η Python (Pyodide): '+esc(err.message)+'. Χρειάζεται σύνδεση στο internet ή τοπικό αντίγραφο: <code>python tools/get_pyodide.py</code>.','error'));}
  // 4.4: a line from geometry without a model (or with an old one): the server computes it, then the circuit is built again
  else if(window.LineData&&/Δεδομένα γραμμής/.test(e.message)&&!S.lineBusy&&editor.doc.components.some(k=>k.type==='TLM')){S.lineBusy=true;notice('Υπολογισμός του μοντέλου της γραμμής (σταθερές γραμμής και '+(/FD/.test(e.message)?'προσαρμογή':'ρυθμοί')+') στον server…','info');
   LineData.refresh(lineCtx(),editor.doc.components).then(n=>{S.lineBusy=false;buildSim(true);draw(true);if(!S.error&&n)notice(`Υπολογίστηκε το μοντέλο ${n===1?'μιας γραμμής':n+' γραμμών'}.`,'info');setTimeout(()=>notice(''),3000);})
    .catch(err=>{S.lineBusy=false;notice('Η γραμμή χρειάζεται μοντέλο από τον server (python run.py): '+esc(err.message),'error');});}
  else notice('Η προσομοίωση σταμάτησε: '+esc(e.message),'error');editor.setDiag(null);}
 refreshControls();renderChannels();updateClock();renderProps();syncStepMode();scheduleStepCheck();
}
function lineCtx(){return {editor,api,changed:()=>{},study:()=>SFOLD.path||null};}
function play(keep){if(!keep)S.stepTo=0;if(!S.sim||S.error)return;if(REC.set.auto&&!REC.on&&S.sim.t===0&&scope.channels().length)recToggle();if(S.stopT>0&&S.sim.t>=S.stopT-1e-12){notice('Έφτασε στο τέλος του εύρους. Πάτα ⟲ ή αύξησε τη διάρκεια.','info');return;}S.running=true;S.last=performance.now();$('#play').classList.add('running');$('#play').innerHTML='❚❚ Παύση';scope.running=true;requestAnimationFrame(loop);}
function pause(){if(window.Live?.active)Live.stop();S.stepTo=0;S.running=false;if(REC.on)recFlush();scope.running=false;$('#play')?.classList.remove('running');if($('#play'))$('#play').innerHTML='▶ Προσομοίωση';draw(true);}
function reset(){pause();buildSim(true);scope.cfg.frozen=null;draw(true);}
// 4.9.1 (4.8.2 a): one step of an external controller on the circuit of the screen (pcl.link 'advance', the Control Workbench
// with pcl.workbench.live_plant_class): the new values (a «Σταθερά» block directly, other parameters as live changes that keep the
// states), the simulation dt further, the scope drawn at most every 40 ms, and the measurements. The circuit stays paused in between.
function linkAdvance(a){if(!S.sim||S.error)throw new Error('Δεν υπάρχει προσομοίωση στην οθόνη (ή έχει σφάλμα).');if(S.running)pause();
 if(S.sim.pyLazy?.())throw new Error('Κύκλωμα με μπλοκ Python: το βήμα από έξω θέλει την Python στη σελίδα (άνοιξε πρώτα μια φορά την προσομοίωση).');
 for(const [k,v] of Object.entries(a.set||{})){const i=k.lastIndexOf('.'),id=i>0?k.slice(0,i):k,p=i>0?k.slice(i+1):'v',c=editor.comp(id);if(!c)throw new Error(`Δεν υπάρχει το στοιχείο «${id}».`);
  if(c.type==='CONST'&&p==='v'){const t=String(v),sch=P.parseSched(t);if(!sch)throw new Error(`Τιμή «${t}» για το ${id}.`);c.params.v=t;S.sim.setBlock(id,{sched:sch});}
  else if(!liveParam(id,p,v,false)){editor.setParams(id,{[p]:typeof v==='object'?JSON.stringify(v):v});}}
 const dt=+a.dt;if(!(dt>0&&dt<1e3))throw new Error('Το dt πρέπει να είναι θετικό (s).');S.sim.run(dt);
 const now=performance.now();if(!S.advT||now-S.advT>40||a.draw){S.advT=now;draw(true);}
 const v={};for(const k of a.keys||[])if(S.sim.hasKey(k))v[k]=S.sim.now(k);return {t:S.sim.t,values:v};}
function linkReset(){reset();return {t:S.sim?S.sim.t:null};}
function stepT(n=1){if(!S.sim||S.error)return;pause();
 // 4.8: Python blocks without Python on the page: the periods in the worker of the live simulation, else Python here first
 if(S.sim.pyLazy?.()){if(window.Live&&S.noLive!==S.sim&&Live.eligible(S.sim)){S.stepTo=S.sim.t+n*S.sim.T;play(true);return;}pyPage().then(ok=>{if(ok)stepT(n);});return;}
 S.sim.run(n*S.sim.T);draw(true);}
// 4.8: long runs. The resolution of the record (a point every dt, a statistic every ~50·dt): the circular buffers then
// cover dt/h times more time. And the record to a file (engine/recording.py): the scope's channels, every new point,
// sent about once a second while it runs; the memory keeps the last part of the run, the file all of it.
function applyRec(){const dt=+$('#rec-res')?.value||0;if(!S.sim)return;const n=dt>0?Math.max(1,Math.round(50*dt/S.sim.T)):1;S.sim.setRecord({dt,n});renderRec();}
const REC={on:false,name:'',path:'',keys:[],cols:[],sim:null,lastT:-Infinity,evN:0,busy:false,pend:'',lost:0,bytes:0,tLast:0,set:{dest:'temp',dir:null,auto:false},disk:null};
// 4.11 (decision 4.11-θ): the memory of the scope with its estimates, where the recording goes, and reading it back
const MEM_KEY='pcl-scope-mem',MEM_OPTS=[0,24,64,128,256,512,1024,2048];
// 4.17.2 (ROADMAP §63): «αυτόματα» (the default) by the memory of the computer (navigator.deviceMemory, GB): 8 or more →
// 128 MB, 4 → 64 MB, less → 32 MB (24 MB before 4.17.2)
function memAuto(){const g=navigator.deviceMemory||4;return g>=8?128:g>=4?64:32;}
function memChoice(){try{const v=localStorage.getItem(MEM_KEY),n=+v;return v!==null&&MEM_OPTS.includes(n)?n:0;}catch(e){return 0;}}
function memSetting(){const v=memChoice();return v>0?v:memAuto();}
const fmtDur=x=>!(x>0)?'—':x>=7200?(x/3600).toFixed(x>=36000?0:1).replace('.',',')+' h':x>=120?(x/60).toFixed(x>=1200?0:1).replace('.',',')+' min':eng(x,'s',2);
function memEstimate(){const s=S.sim;if(!s?.ring)return null;const r=s.ring,nch=r.nch,h=s.var?(s.hv||s.h):s.h,dt=s.opts.recDt||0,bytes=r.cap*(9+4*nch)+(s.per?.cap||0)*nch*20,
  cover=r.cap*Math.max(dt,h),dev=(navigator.deviceMemory||0)*1024,mb=bytes/1048576,warn=[];
 if(s.memNote)warn.push(s.memNote);if(dev&&mb>dev*0.25)warn.push(`πάνω από το 25 % της μνήμης του υπολογιστή (${eng(dev*1048576,'B',2)})`);if(mb>1536)warn.push('κοντά στο όριο ενός buffer του browser (≈ 2 GB)');
 const rowB=14+9*Math.max(1,REC.keys.length||scope.channels().length),rate=rowB/Math.max(dt,h);
 return {mb,cover,nch,warn,rate};}
function recArchive(t0,t1,keys,n){if(!REC.name||REC.sim!==S.sim)return null;const cols=keys.map(k=>REC.cols[REC.keys.indexOf(k)]).filter(Boolean);if(!cols.length)return null;
 return (REC.on?recFlush():Promise.resolve()).then(()=>fetch('/api/record',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({op:'range',name:REC.name,t0,t1,keys:cols,n})}))
  .then(r=>r.json()).then(j=>{if(j.error)throw new Error(j.error);const out={...j,cols:{}};keys.forEach(k=>{const c=REC.cols[REC.keys.indexOf(k)];if(c&&j.cols[c])out.cols[k]=j.cols[c];});return out;});}
async function recSettings(upd){try{const r=await (await fetch('/api/record',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({op:'settings',...(upd||{})})})).json();if(r.error)throw new Error(r.error);
  REC.set={dest:r.dest,dir:r.dir,auto:r.auto};REC.disk=r.disk;REC.temp=r.temp;REC.err=null;}catch(e){REC.err=e.message;}renderRecPanel();renderRec();}
function renderRecPanel(){const P=$('#rec-panel');if(!P||P.hidden)return;const e=memEstimate(),d=REC.disk;
 P.innerHTML=`<div class="rp-row"><label title="Περισσότερη μνήμη = περισσότερος χρόνος με όλα τα δείγματα· η αλλαγή ξεκινά την προσομοίωση από την αρχή">Μνήμη του scope <select id="rec-mem">${MEM_OPTS.map(v=>`<option value="${v}" ${v===memChoice()?'selected':''}>${v===0?`αυτόματα (${memAuto()} MB)`:v<1024?v+' MB':v/1024+' GB'}</option>`).join('')}</select></label><small class="muted">${e?`≈ ${fmtDur(e.cover)} με όλα τα δείγματα (${e.nch} κανάλια)· πριν από αυτά η περιβάλλουσα min–max ή, με καταγραφή, τα δείγματα από το αρχείο`:''}</small></div>
  <div class="rp-row"><b>Καταγραφή σε αρχείο:</b><label><input type="radio" name="rp-dest" value="temp" ${REC.set.dest!=='dir'?'checked':''}> προσωρινά</label><small class="muted">${esc(REC.temp||'~/.pcl/recordings')} · σβήνονται οι παλαιότερες πάνω από 2 GB ή μία εβδομάδα</small></div>
  <div class="rp-row"><label><input type="radio" name="rp-dest" value="dir" ${REC.set.dest==='dir'?'checked':''}> σε φάκελο</label><input id="rp-dir" placeholder="πλήρης διαδρομή, π.χ. D:\\Μετρήσεις" value="${esc(REC.set.dir||'')}"><label><input type="checkbox" id="rp-create"> δημιουργία</label><button id="rp-save">Να το θυμάσαι</button></div>
  <div class="rp-row"><label><input type="checkbox" id="rp-auto" ${REC.set.auto?'checked':''}> πάντα καταγραφή (ξεκινά μόνη της σε κάθε ▶ από την αρχή)</label></div>
  <div class="rp-row"><b>Καταγραφές:</b><button id="rp-view" ${REC.name?'':'disabled'} title="Η καταγραφή αυτής της προσομοίωσης σε παράθυρο προβολής (διαβάζει μόνο ό,τι σχεδιάζει)">Προβολή της τρέχουσας</button><button id="rp-list" title="Οι καταγραφές του προσωρινού φακέλου και του φακέλου σου: άνοιγμα ή συμπίεση (4.12)">Παλαιότερες…</button></div><div id="rp-items"></div>
  <div class="rp-row small">${d&&!d.error?`ελεύθερα ${eng(d.free,'B',3)} στο ${esc(d.folder)}`:d?.error?'<span class="bad">'+esc(d.error)+'</span>':''}${e?` · ≈ ${eng(e.rate,'B',3)} ανά δευτερόλεπτο προσομοίωσης${d&&!d.error&&e.rate>0?` (χωρούν ≈ ${fmtDur(d.free/e.rate)} προσομοίωσης)`:''}`:''}${REC.err?' · <span class="bad">'+esc(REC.err)+'</span>':''}</div>`;
 P.insertAdjacentHTML('beforeend','<div id="study-box" class="rp-study"></div>');renderStudy();   // 5.0: the study folder
 P.querySelectorAll('[name="rp-dest"]').forEach(r=>r.onchange=()=>{if(r.value==='dir'&&!$('#rp-dir').value.trim()){REC.set.dest='dir';renderRecPanel();return;}recSettings({dest:r.value,...(r.value==='dir'?{dir:$('#rp-dir').value.trim(),create:$('#rp-create').checked}:{})});});
 $('#rp-save').onclick=()=>recSettings({dir:$('#rp-dir').value.trim(),dest:'dir',create:$('#rp-create').checked});
 $('#rp-auto').onchange=e=>recSettings({auto:e.target.checked});
 $('#rp-view').onclick=async()=>{if(!REC.name)return;if(REC.on)await recFlush();window.RecView?.open(REC.name);};
 $('#rp-list').onclick=()=>window.RecView?.list($('#rp-items'));
 const m=$('#rec-mem');m.onchange=()=>{try{localStorage.setItem(MEM_KEY,m.value);}catch(x){}if(REC.on)recToggle();buildSim(true);draw(true);renderRec();renderRecPanel();notice(`Μνήμη scope ${m.options[m.selectedIndex].text}: η προσομοίωση ξεκινά από την αρχή.`,'info');setTimeout(()=>notice(''),3500);};}
function renderRec(){const b=$('#rec-file'),n=$('#rec-note'),s=S.sim;if(b){b.classList.toggle('on',REC.on);b.textContent=REC.on?`■ καταγράφει${REC.bytes?' · '+eng(REC.bytes,'B',3):''}`:'⭳ σε αρχείο';}
 if(n&&s){const e=memEstimate();if(!e)return;setText(n,`μνήμη ≈ ${fmtDur(e.cover)} (${eng(e.mb*1048576,'B',2)}, ${e.nch} κανάλια)${e.warn.length?' · ⚠ '+e.warn.join('· '):''}${REC.lost?' · '+REC.lost+' κενά στο αρχείο (αραιότερη καταγραφή)':''}`);n.classList.toggle('bad',e.warn.length>0);}}
async function recToggle(){if(REC.on){await recFlush();REC.on=false;renderRec();notice('Η καταγραφή γράφτηκε στο '+esc(REC.path)+'.','info');return;}
 const ch=scope.channels();if(!ch.length||!S.sim){notice('Πρόσθεσε πρώτα σήματα στο scope: αυτά γράφονται στο αρχείο.','info');return;}
  // the header: the labels of the channels, made unique (the scope reads the columns back by these names)
  const seen=new Map();REC.pendCols=ch.map(c=>{let l=String(c.label||c.key).replace(/[,\n"]/g,' ').trim()||c.key;const k=(seen.get(l)||0)+1;seen.set(l,k);return k>1?l+' #'+k:l;});
  try{const r=await (await fetch('/api/record',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({op:'start',title:tutorial()?.id||'run',header:['t (s)',...REC.pendCols].join(','),
   dest:REC.set.dest,...(REC.set.dest==='dir'?{dir:REC.set.dir}:{})})})).json();
  if(r.error)throw new Error(r.error);Object.assign(REC,{on:true,name:r.name,path:r.path,keys:ch.map(c=>c.key),cols:REC.pendCols,sim:S.sim,evN:S.sim.events?.().n||0,lastT:S.sim.t-1e-12*Math.max(1,S.sim.t),pend:'',lost:0,bytes:0,tLast:performance.now()});
  if(r.free!=null)REC.disk={folder:r.folder,free:r.free};if(r.removed?.length)notice(`Σβήστηκαν ${r.removed.length} παλιές προσωρινές καταγραφές (όριο χώρου ή ηλικίας).`,'info');
  notice('Καταγραφή στο '+esc(r.path)+': όσο τρέχει, κάθε νέο σημείο των σημάτων του scope γράφεται στο αρχείο.','info');setTimeout(()=>notice(''),5000);}
 catch(e){notice('Καταγραφή σε αρχείο: '+esc(e.message)+' (χρειάζεται ο server της εφαρμογής, python run.py).','error');}renderRec();}
// the new points of the record since the last write (a gap is counted when the circular buffer passed over them)
function recCollect(){const s=S.sim;if(!REC.on||!s)return '';const r=s.ring;if(!r.n)return '';const st=(r.head-r.n+r.cap)%r.cap;
 if(r.t[st]>REC.lastT+1e-15*Math.max(1,Math.abs(REC.lastT))&&Number.isFinite(REC.lastT)&&REC.lastT>0)REC.lost++;
 let i=Math.max(0,scope.ringIndex(REC.lastT)-1);while(i<r.n&&!(r.t[(st+i)%r.cap]>REC.lastT))i++;const cis=REC.keys.map(k=>scope.resolve(k)),out=[];
 for(;i<r.n;i++){const j=(st+i)%r.cap,t=r.t[j];out.push(+t.toPrecision(12)+','+cis.map(ci=>ci===-2?'0':ci<0?'NaN':String(+r.d[j*r.nch+ci].toPrecision(7))).join(','));REC.lastT=t;}
 return out.length?out.join('\n')+'\n':'';}
async function recFlush(){if(!REC.on)return;REC.pend+=recCollect();if(REC.busy)return REC.wait;if(!REC.pend)return;const body=REC.pend;REC.pend='';REC.busy=true;let done;REC.wait=new Promise(z=>done=z);
 // 4.11: the events of the run beside the file (<name>.events.csv)
 const ev=S.sim?.events?.(),newEv=ev&&ev.n>REC.evN?ev.list.slice(-Math.min(ev.list.length,ev.n-REC.evN)):[];if(ev)REC.evN=ev.n;
 if(newEv.length)fetch('/api/record',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({op:'events',name:REC.name,rows:newEv.map(e=>[e.t,e.kind,e.src,typeof e.v==='number'?e.v:String(e.v??'')])})}).catch(()=>{});
 try{const r=await (await fetch('/api/record',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({op:'append',name:REC.name,rows:body})})).json();
  if(r.error)throw new Error(r.error);REC.bytes=r.bytes;if(r.full){REC.on=false;notice('Η καταγραφή έφτασε τα 4 GB και σταμάτησε.','info');}}
 catch(e){REC.on=false;notice('Καταγραφή σε αρχείο: '+esc(e.message),'error');}finally{REC.busy=false;done();renderRec();}}
// 5.0 (ROADMAP §91, THEORY §8ΩΕ, decision 344): the study folder. «▶ στον φάκελο» runs the circuit from t = 0 to the end
// time in a worker of its own (study_worker.js) and writes into the folder every channel (or those chosen) at every
// recorded point, the project, the events, the log, the summary and, when asked, the netlist (engine/studyfolder.py).
// The viewer (viewer/) opens the run and reads it again while it is written; the page keeps its own simulation and scope.
const SFOLD={path:'',set:null,w:null,run:null,runPath:'',status:'',t:0,rows:0,bytes:0,err:null};
async function studySettings(upd){try{const r=await (await fetch('/api/study',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({op:'settings',...(upd||{})})})).json();if(r.error)throw new Error(r.error);
  SFOLD.set=r;SFOLD.path=r.dir||'';SFOLD.err=null;}catch(e){SFOLD.err=e.message;}renderStudy();}
function studyEstimate(){const s=S.sim;if(!s||!SFOLD.set)return null;const mode=SFOLD.set.mode,n=mode==='sim'?s.recKeys.length:mode==='scope'?scope.channels().length:s.keys.length,
  h=s.var?(s.hv||s.h):s.h,dt=SFOLD.set.dt||0,tEnd=S.stopT>0?S.stopT:0,rows=tEnd?Math.ceil(tEnd/Math.max(h,dt))+1:0,bw=SFOLD.set.dtype==='float32'?4:8;return {n,rows,bytes:rows*(n+1)*bw};}
function renderStudy(){const box=$('#study-box');if(!box)return;const st=SFOLD.set,e=studyEstimate();
 if(!st){box.innerHTML='<small class="muted">Ο φάκελος μελέτης χρειάζεται τον server της εφαρμογής (python run.py).</small>'+(SFOLD.err?' <small class="bad">'+esc(SFOLD.err)+'</small>':'');return;}
 const o=(v,l,c)=>`<option value="${v}" ${c?'selected':''}>${l}</option>`;
 box.innerHTML=`<div class="rp-row"><b>Φάκελος μελέτης:</b><input id="st-dir" placeholder="πλήρης διαδρομή, π.χ. D:\\Μελέτες\\γραμμή" value="${esc(SFOLD.path)}" list="st-recent"><datalist id="st-recent">${(st.recent||[]).map(x=>`<option value="${esc(x)}">`).join('')}</datalist><label><input type="checkbox" id="st-create"> δημιουργία</label><button id="st-save">Ορισμός</button>${SFOLD.path?'<button id="st-clear" title="Χωρίς φάκελο μελέτης">✕</button>':''}</div>
  <div class="rp-row"><label>Κανάλια <select id="st-mode">${o('all','όλα',st.mode==='all')}${o('sim','όσα καταγράφει η προσομοίωση',st.mode==='sim')}${o('scope','μόνο του scope',st.mode==='scope')}</select></label>
   <label>Κάθε <select id="st-dt">${[0,1e-6,1e-5,1e-4,1e-3].map(v=>o(v,v?eng(v,'s'):'βήμα',+st.dt===v)).join('')}</select></label>
   <label>Ακρίβεια <select id="st-dtype">${o('float64','float64 (όπως ο λύτης)',st.dtype!=='float32')}${o('float32','float32 (μισό μέγεθος)',st.dtype==='float32')}</select></label>
   <label title="Το netlist όπως το βλέπει ο λύτης (κόμβοι, στοιχεία, μπλοκ, μοντέλα γραμμής), σε JSON και σε κείμενο"><input type="checkbox" id="st-net" ${st.netlist?'checked':''}> netlist</label>
   <label title="Τα παλαιότερα τρεξίματα χωρίς ετικέτα σβήνονται όταν ξεκινά νέο">κρατά <input id="st-keep" type="number" min="1" max="1000" value="${st.keep}" style="width:4.5em"> τρεξίματα</label></div>
  <div class="rp-row small">${e?`≈ ${e.n} κανάλια × ${e.rows||'—'} γραμμές${e.bytes?' = '+eng(e.bytes,'B',3):''}${S.stopT>0?'':' · <span class="bad">δώσε διάρκεια</span>'}`:''}${SFOLD.path?'':' · <span class="muted">χωρίς φάκελο: ~/.pcl/studies/&lt;τίτλος&gt;</span>'}
   ${SFOLD.run?` · τρέξιμο ${esc(SFOLD.run)}: ${esc(SFOLD.status)} t = ${eng(SFOLD.t,'s',4)}, ${SFOLD.rows} γραμμές${SFOLD.bytes?', '+eng(SFOLD.bytes,'B',3):''} <button id="st-view">Εργαλείο προβολής</button>`:''}${SFOLD.err?' · <span class="bad">'+esc(SFOLD.err)+'</span>':''}</div>`;
 const g=id=>box.querySelector(id),upd=k=>v=>studySettings({[k]:v});
 g('#st-save').onclick=()=>{const v=g('#st-dir').value.trim();studySettings({dir:v||null,create:g('#st-create').checked});};
 if(g('#st-clear'))g('#st-clear').onclick=()=>studySettings({dir:null});
 g('#st-mode').onchange=e=>upd('mode')(e.target.value);g('#st-dt').onchange=e=>upd('dt')(+e.target.value);g('#st-dtype').onchange=e=>upd('dtype')(e.target.value);
 g('#st-net').onchange=e=>upd('netlist')(e.target.checked);g('#st-keep').onchange=e=>{const v=Math.round(+e.target.value);if(v>=1)upd('keep')(v);};
 if(g('#st-view'))g('#st-view').onclick=()=>studyView();renderStudyBtn();}
function renderStudyBtn(){const b=$('#study-run');if(!b)return;b.classList.toggle('on',!!SFOLD.w);b.textContent=SFOLD.w?`■ φάκελος · ${eng(SFOLD.t,'s',3)}`:'▶ στον φάκελο';}
function studyView(){const p=SFOLD.runPath||SFOLD.path;if(p)window.open('viewer/?source='+encodeURIComponent(p)+(SFOLD.w?'&follow=1':''),'_blank');}
async function studyRun(){if(SFOLD.w){SFOLD.w.postMessage({stop:true});return;}
 if(!S.sim||S.error){notice('Το κύκλωμα δεν χτίζεται ακόμη.','error');return;}if(!(S.stopT>0)){notice('Δώσε «Διάρκεια»: το τρέξιμο στον φάκελο πάει από t = 0 ως εκεί.','info');return;}
 if(!SFOLD.set)await studySettings();if(!SFOLD.set)return;
 let path=SFOLD.path;try{const o=await (await fetch('/api/study',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({op:'open',path:path||null,title:tutorial()?.id||'study',create:!path})})).json();if(o.error)throw new Error(o.error);path=o.path;}
 catch(e){SFOLD.err=e.message;renderStudy();notice('Φάκελος μελέτης: '+esc(e.message),'error');return;}
 let w;try{w=new Worker('studio/study_worker.js');}catch(e){notice('Δεν ξεκινά worker: '+esc(e.message),'error');return;}
 Object.assign(SFOLD,{w,run:null,runPath:'',status:'ξεκινά',t:0,rows:0,bytes:0,err:null});renderStudy();
 w.onmessage=e=>{const m=e.data;if(m.type==='begin'){SFOLD.run=m.run;SFOLD.runPath=m.path;SFOLD.status='τρέχει';notice(`Τρέξιμο στον φάκελο: ${esc(m.path)} (${m.channels} κανάλια${m.models?.length?', '+m.models.length+' μοντέλα γραμμής':''}).`,'info');setTimeout(()=>notice(''),5000);}
  else if(m.type==='progress'){Object.assign(SFOLD,{t:m.t,rows:m.rows,bytes:m.bytes});}
  else if(m.type==='end'){Object.assign(SFOLD,{status:m.status==='stopped'?'σταμάτησε':'τελείωσε',t:m.stats.t_end,rows:m.stats.rows,bytes:m.stats.bytes});w.terminate();SFOLD.w=null;notice(`Το τρέξιμο ${esc(m.run)} ${m.status==='stopped'?'σταμάτησε':'τελείωσε'}: ${m.stats.rows} γραμμές σε ${(m.stats.run_ms/1000).toFixed(2).replace('.',',')} s.`,'info');}
  else if(m.type==='error'){SFOLD.status='σφάλμα';SFOLD.err=m.message;w.terminate();SFOLD.w=null;notice('Τρέξιμο στον φάκελο: '+esc(m.message),'error');}
  renderStudy();renderStudyBtn();};
 w.onerror=e=>{SFOLD.err=e.message||'σφάλμα στον worker';SFOLD.w=null;renderStudy();};
 const doc=fullDoc(),t=tutorial();
 w.postMessage({project:JSON.parse(JSON.stringify(doc)),sim:{hDiv:+$('#sim-step').value,method:$('#method').value,eventsMax:evMaxSetting()},stopT:S.stopT,title:t?.title||'',tutorial:S.tut?{id:S.tut.id,options:S.tut.options}:null,
  study:{path,mode:SFOLD.set.mode,dtype:SFOLD.set.dtype,dt:SFOLD.set.dt,netlist:SFOLD.set.netlist,scope:scope.channels().map(c=>c.key)}});}
// 4.8: Python on the page, only when the page itself must run a circuit with Python blocks (no worker): loaded once, and the
// stand-ins of the blocks become the real ones with the state they carry
async function pyPage(){if(!window.PyRT)return false;const was=PyRT.ready;if(!was)notice('Φορτώνεται η Python στη σελίδα (μία φορά)…','info');
 try{await PyRT.load();}catch(err){notice('Δεν φορτώθηκε η Python (Pyodide): '+esc(err.message)+'. Χρειάζεται σύνδεση στο internet ή τοπικό αντίγραφο: <code>python tools/get_pyodide.py</code>.','error');return false;}
 try{S.sim?.pyUpgrade();}catch(e){S.error=e.message;notice('Η προσομοίωση σταμάτησε: '+esc(e.message),'error');return false;}
 if(!was)notice('');return true;}
function runToEnd(){if(!S.sim||!(S.stopT>0))return;pause();
 if(S.sim.pyLazy?.()){if(window.Live&&S.noLive!==S.sim&&Live.eligible(S.sim)){S.stepTo=S.stopT;play(true);return;}pyPage().then(ok=>{if(ok)runToEnd();});return;}
 const t0=performance.now();notice('Υπολογισμός έως '+eng(S.stopT,'s')+'…','info');
 const chunk=()=>{const left=S.stopT-S.sim.t;if(left<=1e-12){notice('');draw(true);return;}try{S.sim.run(left,Infinity,performance.now()+40);}catch(e){notice(esc(e.message),'error');return;}draw(false);updateClock();
  if(performance.now()-t0>120000){notice('Σταμάτησε μετά από 2 λεπτά. Μεγάλωσε το βήμα ή μείωσε τη διάρκεια.','error');return;}setTimeout(chunk,0);};chunk();}
function loop(now){
 if(!S.running)return;
 // 4.6: the solver in its own thread (live.js) when it can; the page only draws
 if(window.Live&&S.noLive!==S.sim&&(Live.active||Live.eligible(S.sim))&&(Live.active||Live.start(S.sim,{speed:S.stepTo?'max':S.speed,stopT:S.stepTo||S.stopT})||(S.noLive=S.sim,false))){
  // an error of Python code at the start (4.8: the blocks run in the worker): shown as an error of the circuit
  if(Live.error&&Live.errorStart&&Live.errorPy){const msg=Live.error;Live.error=null;Live.stop();S.error=msg;pause();notice('Η προσομοίωση σταμάτησε: '+esc(msg),'error');return;}
  // the worker could not start (e.g. another set of channels): the solver goes on in the page
  if(Live.error&&Live.errorStart){Live.error=null;Live.stop();S.noLive=S.sim;requestAnimationFrame(loop);return;}
  if(Live.error){const msg=Live.error;Live.error=null;S.error=msg;pause();notice('Σφάλμα λύτη: '+esc(msg),'error');return;}
  S.limited=!!Live.limited;S.frame++;draw(false,editor.busy()||!!scope.drag);
  if(Live.ended){const st=S.stepTo;pause();if(!st)notice('Τέλος εύρους προσομοίωσης ('+eng(S.stopT,'s')+'). ▶ συνεχίζει αν αυξήσεις τη διάρκεια.','info');return;}
  requestAnimationFrame(loop);return;}
 if(S.sim.pyLazy?.()){const st=S.stepTo;pause();pyPage().then(ok=>{if(ok){S.stepTo=st;play(!!st);}});return;}
 const dt=Math.min(.1,(now-S.last)/1000);S.last=now;
 let want=S.speed==='max'?1e9:dt*S.speed*S.sim.T;const end=S.stepTo||S.stopT;if(end>0)want=Math.min(want,end-S.sim.t);
 // the solver's share of the frame (4.6): about 12 ms when nobody touches the page (the simulation as fast as before),
 // and what is left of 6 ms after the input and the drawing while the user zooms, pans, drags, draws a selection, or
 // moves the pointer, types or turns the wheel anywhere on the page (250 ms after the last input), so that the page
 // follows the hand at 60 frames per second
 const busy=editor.busy()||!!scope.drag,used=performance.now()-now,input=busy||now-(S.lastInput||0)<250;
 const budget=input?Math.max(1.5,6-used-(S.drawMs||0)):Math.max(4,12.5-used);
 const before=S.sim.t;try{S.sim.run(want,Infinity,performance.now()+budget);}catch(e){S.error=e.message;notice('Σφάλμα λύτη: '+esc(e.message),'error');pause();return;}
 S.limited=S.speed!=='max'&&S.sim.t-before<want*.98;
 S.frame++;const t1=performance.now();draw(false,busy);S.drawMs=.8*(S.drawMs||0)+.2*(performance.now()-t1);
 if(S.stepTo>0&&S.sim.t>=S.stepTo-1e-12){pause();return;}
 if(S.stopT>0&&S.sim.t>=S.stopT-1e-12){pause();notice('Τέλος εύρους προσομοίωσης ('+eng(S.stopT,'s')+'). ▶ συνεχίζει αν αυξήσεις τη διάρκεια.','info');return;}
 requestAnimationFrame(loop);
}
function draw(all,busy){scope.draw();navRange();if(all||S.frame%(busy?12:4)===0){S.iScaleNext=0;editor.updateLive();S.iScale=Math.max(S.iScaleNext||0,1e-9);updateClock();window.Watch?.update(all);if(REC.on&&performance.now()-REC.tLast>1000){REC.tLast=performance.now();recFlush();}}if(all||S.frame%(busy?24:8)===0){renderMeasure(all);updateHover();renderMetricsPanel();updateLivePanel();if(S.sim&&S.sim.dgVer!==S.diagSeen)renderDiag();}if(all){if(!S.running&&!S.switching){renderFFT();renderEvents();renderPoincare();if($('#eis-block')?.open&&!EIS.run)renderEISForm();}if(S.batch)renderBatch();if(S.csvRef)renderCsv();if(S.theory&&!S.running&&!S.switching)renderTheoryLive();}}  // no theory refresh while the editor still holds the previous circuit
// text of an element only when it changes (in the loop of the simulation an unchanged text still costs a layout)
function setText(el,t){if(el&&el.textContent!==t)el.textContent=t;}
function navRange(){const el=$('#nav-range');if(!el||!S.sim)return;const [a,b]=scope.viewRange();setText(el,`${eng(a,'s',4)} … ${eng(b,'s',4)} · ${fmt((b-a)/S.sim.T,3)} T${scope.cfg.frozen?' · σταθερή προβολή':' · ζωντανά'}`);}
function updateClock(){const s=S.sim;if(!s)return;setText($('#clock'),'t = '+eng(s.t,'s',5));setText($('#periods'),`${Math.floor(s.t/s.T+1e-9)} T · βήματα ${Parts.fmtNum(s.steps)}`);
 {const cpu=$('#cpu');if(cpu&&cpu.hidden!==!S.limited)cpu.hidden=!S.limited;}setText($('#speed-note'),S.speed==='max'?'όσο αντέχει ο υπολογιστής':`${eng(S.speed*s.T,'s',3)} ανά δευτερόλεπτο`);setText($('#step-note'),s.var?`Δt = ${eng(s.hv,'s',3)} μεταβλητό (${eng(s.hMin,'s',2)} … ${eng(s.hCap||s.hMax,'s',2)}) · απορρίψεις ${s.nRej}`:'Δt = '+eng(s.h,'s',3)+' · T = '+eng(s.T,'s',3));}

// live values on the schematic
function liveOf(c0){const s=S.sim;if(!s||S.error||S.pfx===null)return null;
 if(c0.type==='AVR'||c0.type==='PSS'||c0.type==='GOV'){const id=(S.pfx||'')+c0.id,v=k=>s.now('Y:'+id+k);return {text:c0.type==='AVR'?'E_fd '+eng(v('/EFD'),'',4):c0.type==='PSS'?'v_s '+eng(v('/VS'),'',3):'P_m '+eng(v('/PM'),'',4)+' · '+(c0.params?.type==='hydro'?'g ':'CV ')+eng(v('/G'),'',3)};}
 if(c0.type==='CHB'){const id=(S.pfx||'')+c0.id;return {text:'n '+fmt(s.now('Y:'+id+'/NLC'),3)+' · V_C '+eng(s.now('Y:'+id+'/NLC:vav'),'V',4)};}
 if(c0.type==='SSSC'){const id=(S.pfx||'')+c0.id;return {text:'X '+eng(s.now('Y:'+id+'/XM'),'Ω',3)+' · Δθ '+fmt(s.now('Y:'+id+'/DTH')*180/Math.PI,3)+'°'};}
 if(c0.type==='SSSC3'){const id=(S.pfx||'')+c0.id;return {text:'X '+eng(s.now('Y:'+id+'/XM'),'Ω',3)+' · u '+eng(s.now('Y:'+id+'/U'),'V/s',3)};}
 // 4.14: the MMC and its control: what they do now
 if(c0.type==='MMCC'){const id=(S.pfx||'')+c0.id;return {text:'P '+fmt(s.now('Y:'+id+'/PP'),3)+' · Q '+fmt(s.now('Y:'+id+'/QQ'),3)+' pu'+(s.now('Y:'+id+'/BLK')>0.5?' · μπλοκαρισμένος':'')};}
 // 4.18: the grid-forming control and the average VSC
 if(c0.type==='GFMC'){const id=(S.pfx||'')+c0.id;return {text:'P '+fmt(s.now('Y:'+id+'/PP'),3)+' · Q '+fmt(s.now('Y:'+id+'/QQ'),3)+' pu · f '+fmt(50*s.now('Y:'+id+'/WW'),4)+' Hz'+(s.now('Y:'+id+'/LR')>0.5?' · όριο ρεύματος':'')};}
 if(c0.type==='VSC2'){const id=(S.pfx||'')+c0.id;return {text:'î_a '+eng(Math.abs(s.now('Y:'+id+'/Ia')),'A',3)+' · v_dc '+eng(s.now('Y:'+id+'/VD'),'V',3)};}
 if(c0.type==='MMC'){const id=(S.pfx||'')+c0.id;return {text:'V_dc '+eng(s.now('Y:'+id+'/VDC'),'V',4)+' · I_dc '+eng(s.now('Y:'+id+'/IDC'),'A',3)};}
 // 4.16: the LCC station, its bridge and its control
 if(c0.type==='LCCS'){const id=(S.pfx||'')+c0.id;return {text:'V_d '+eng(s.now('Y:'+id+'/VDC'),'V',4)+' · I_d '+eng(s.now('Y:'+id+'/IDC'),'A',3)+' · γ '+fmt(s.now('Y:'+id+'/GM'),3)+'°'+(s.now('Y:'+id+'/CF')>0.5?' · αποτυχία μετάβασης':'')};}
 if(c0.type==='LCC6'){const id=(S.pfx||'')+c0.id,m=c0.params?.impl==='blocks'?'/M':'/X';return {text:'α '+fmt(s.now('Y:'+id+m),3)+'° · γ '+fmt(s.now('Y:'+id+m+':gm'),3)+'°'+(s.now('Y:'+id+m+':cf')>0.5?' · αποτυχία μετάβασης':'')};}
 if(c0.type==='LCCC'){const id=(S.pfx||'')+c0.id,inv=c0.params?.mode==='inv';return {text:'α '+fmt(s.now('Y:'+id+'/AO'),4)+'° · I_d '+fmt(s.now('Y:'+id+'/FI'),3)+' pu'+(inv?(s.now('Y:'+id+'/CC')>0.5?' · έλεγχος ρεύματος':' · έλεγχος γ'):'')+(s.now('Y:'+id+'/BLK')>0.5?' · μπλοκαρισμένος':'')};}
 if(c0.type==='SPLL'){const id=(S.pfx||'')+c0.id,f=c0.params?.impl==='blocks';return {text:'f '+eng(s.now('Y:'+id+(f?'/W':'/X:w'))/(2*Math.PI),'Hz',4)+' · Â '+eng(s.now('Y:'+id+(f?'/VD':'/X:amp')),'',3)};}
 if(c0.type==='EVC'){const id=(S.pfx||'')+c0.id;return {text:'u '+eng(s.now('Y:'+id+'/SAT'),'V',3)+' · τ* '+eng(s.now('Y:'+id+'/TQ'),'N·m',3)+' · keep '+eng(s.now('Y:'+id+'/KP'),'',3)};}
 if(c0.type==='AIC'){const id=(S.pfx||'')+c0.id,L=s.now('Y:'+id+'/NN1:L');return {text:'u '+eng(s.now('Y:'+id+'/SAT'),'',3)+' · e '+eng(s.now('Y:'+id+'/E'),'',3)+(Number.isFinite(L)?' · L '+eng(L,'',3):'')};}
 if(['GND','JUNC','TAGO','TAGI','SUB','PORT','SIN','SOUT'].includes(c0.type)||window.NetLib&&NetLib.isLib(c0.type))return null;
 const c=S.pfx?{...c0,id:S.pfx+c0.id}:c0;
 const avg=S.running&&(S.speed==='max'||S.speed>=200);const val=k=>{if(avg){const p=s.lastPeriod(k);return p?p.avg:s.now(k);}return s.now(k);};
 if(c.type==='PWM'){const d=s.now('D:'+c.id);return {text:'D = '+fmt(d,4)};}
 // a block on a bus (3.18): the values of its elements, [a, b, …]
 {const n=vecN(c.id);if(n>1&&P.BLOCKS.has(c.type))return {text:'y = ['+Array.from({length:n},(_,k)=>eng(val('Y:'+c.id+'['+(k+1)+']'),blkUnit(c),3)).join(', ')+']'};}
 if(c.type==='SH'){const q=s.shById.get(c.id);return {text:q?'h = '+eng(q.h,q.sig?'':q.qty==='V'?'V':'A',4):''};}
 if(c.type==='PY'){const os=outsOf(c);return {text:os.map((o,k)=>o+' = '+eng(s.now('Y:'+c.id+(k?':'+o:'')),'',4)).join(' · ')};}
 if(c.type==='IM')return {i:s.now('I:'+c.id),text:'ω '+eng(val('Y:'+c.id),'rad/s',4)+' · τ '+eng(val('Y:'+c.id+':te'),'N·m',3)+' · |ψ| '+eng(s.now('Y:'+c.id+':psi'),'V·s',3)};
 if(c.type==='SRM'){const n=s.net.compInfo.get(c.id)?.srm?.N||0;return {i:s.now('I:'+c.id),text:'ω '+eng(val('Y:'+c.id),'rad/s',4)+' · τ '+eng(val('Y:'+c.id+':te'),'N·m',3)+' · '+Array.from({length:n},(_,k)=>'i'+'₁₂₃₄'[k]+' '+eng(val((k?'I'+(k+1):'I')+':'+c.id),'A',3)).join(' · ')};}
 if(c.type==='GEN3')return {i:s.now('I:'+c.id),text:'ω '+fmt(val('Y:'+c.id),5)+' pu · P '+fmt(val('Y:'+c.id+':pe'),4)+' · Q '+fmt(val('Y:'+c.id+':qe'),4)+' pu · δ '+fmt(val('Y:'+c.id+':d'),4)+'°'};
 if(c.type==='SM')return {i:s.now('I:'+c.id),text:'ω '+eng(val('Y:'+c.id),'rad/s',4)+' · τ '+eng(val('Y:'+c.id+':te'),'N·m',3)+' · i_d '+eng(val('Y:'+c.id+':id'),'A',3)+' · i_q '+eng(val('Y:'+c.id+':iq'),'A',3)};
 if(c.type==='TL')return {i:s.now('I:'+c.id),text:'v₁ '+eng(val('V:'+c.id),'V',3)+' · v₂ '+eng(val('V2:'+c.id),'V',3)};
 if(c.type==='KL'||c.type==='KG'){const n=s.net.compInfo.get(c.id)?.ports?.length||0;return {i:s.now('I:'+c.id),text:Array.from({length:n},(_,k)=>(avg?'⌀ ':'')+'i'+'₁₂₃₄₅₆₇₈'[k]+' '+eng(val((k?'I'+(k+1):'I')+':'+c.id),'A',3)).join(' · ')};}
 if(c.type==='DCM')return {i:s.now('I:'+c.id),text:'ω '+eng(val('Y:'+c.id),'rad/s',4)+' · '+(avg?'⌀ ':'')+eng(val('I:'+c.id),'A',3)};
 if(OUT_SYM[c.type]&&c.type!=='SR'){const os=outsOf(c),br=OUT_BRIEF[c.type];return {text:os.map((o,k)=>[o,k]).filter(([o])=>!br||br.includes(o)).map(([o,k])=>OUT_SYM[c.type][o]+' '+eng(s.now('Y:'+c.id+(k?':'+o:'')),blkUnit(c,o),3)).join(' · ')};}
 if(P.BLOCKS.has(c.type)&&s.net?.vec?.[c.id]>1&&!LOGIC_BLK.has(c.type)){const n=s.net.vec[c.id],u=blkUnit(c);return {text:'['+Array.from({length:n},(_,k)=>eng(s.now('Y:'+c.id+'['+(k+1)+']'),u,+(c.params?.dig)||3)).join('; ')+']'};} // 3.19: a vector (question 3 of 3.18)
 if(P.BLOCKS.has(c.type)){const y=s.now('Y:'+c.id);if(LOGIC_BLK.has(c.type))return {on:y>=.5,text:(c.type==='SR'?'Q = ':'y = ')+(y>=.5?'1':'0')};
  const u=blkUnit(c);return {text:(c.type==='DISP'?'':c.type==='VM'||c.type==='VP'?'v = ':c.type==='AM'||c.type==='IP'?'i = ':'y = ')+eng(y,u,+(c.params?.dig)||4)};}
 const i=val('I:'+c.id),v=val('V:'+c.id);let on;
 if(c.type==='SW'){const e=s.net.compInfo.get(c.id)?.main;on=!!e?.on;}if(c.type==='D'||c.type==='SCR'){const e=s.net.compInfo.get(c.id)?.main;on=!!e?.on;}
 const pre=avg?'⌀ ':'';let text='';const scale=S.iScale||1;const z=x=>Math.abs(x)<2e-4*scale?0:x;
 if(c.type==='C')text=pre+eng(v,'V',4);else if(c.type==='CPL')text=pre+eng(val('P:'+c.id),'W',3);else if(c.type==='XFMR')text=pre+'i_m '+eng(val('Im:'+c.id),'A',3);else text=pre+eng(z(i),'A',4);
 if(['L','VDC','VAC','VAC3','SW','D','SCR','R'].includes(c.type)&&Number.isFinite(i))S.iScaleNext=Math.max(S.iScaleNext||0,Math.abs(i));
 return {on,i:avg?i:s.now('I:'+c.id),text};}

// signal blocks (3.0): output unit, and which outputs are 0/1
const LOGIC_BLK=new Set(['CMP','SR','CLK','LOGIC','EDGE']);
function blkUnit(c,pin){if(!c)return '';const t=c.type;if(t==='VM'||t==='VP')return 'V';if(t==='AM'||t==='IP')return 'A';if(t==='MEAS')return c.params?.qty==='V'?'V':c.params?.qty==='E'?'J':'A';
 if(t==='DCM')return pin==='te'?'N·m':'rad/s';if(t==='IM')return pin==='te'?'N·m':pin==='psi'?'V·s':pin==='w'||!pin?'rad/s':'rad';if(t==='SM')return pin==='te'?'N·m':pin==='th'?'rad':pin==='id'||pin==='iq'?'A':'rad/s';if(t==='SRM')return pin==='te'?'N·m':pin==='th'?'rad':/^i\d$/.test(pin||'')?'A':'rad/s';if(t==='GEN3')return pin==='d'?'°':'pu';if(t==='FEST')return pin==='psi'?'V·s':pin==='w1'?'rad/s':'rad';if(t==='PLL')return pin==='amp'?'':pin==='w'?'rad/s':'rad';if(t==='INT'&&c.params?.wrap==='2pi')return 'rad';
 const u=S.sim?.net?.units?.out(c.id,pin)?.u;return u&&u!=='1'?u:'';} // 3.19: what the units check inferred (a constant or gain with a unit, filters, sums …)
// symbols of the outputs of multi-output blocks (first output = channel Y:id, the others Y:id:pin)
const GEN_TS={ts1:'T₁₂',ts2:'T₂₃',ts3:'T₃₄',ts4:'T₄₅',ts5:'T₅₆',ts6:'T₆₇'};
const OUT_SYM={NN:{y:'y',L:'L',dy:'∂y'},GEN3:{w:'ω',te:'T_e',pe:'P',qe:'Q',vt:'|V|',ifd:'i_fd',d:'δ',e0:'E_fd0',v0:'|V|₀',m0:'T_m0',...GEN_TS},IM:{w:'ω',te:'τ_e',psi:'|ψ_R|',thf:'θ_f',thr:'θ_r'},SM:{w:'ω',te:'τ_e',th:'θ',id:'i_d',iq:'i_q'},SRM:{w:'ω',te:'τ_e',th:'θ_e',i1:'i₁',i2:'i₂',i3:'i₃',i4:'i₄'},FEST:{th:'θ̂',psi:'|ψ̂|',w1:'ω̂₁'},MOD3:{da:'d_a',db:'d_b',dc:'d_c'},DCM:{w:'ω',te:'τ_e'},PLL:{th:'θ',w:'ω',amp:'V̂_d'},CLARKE:{al:'α',be:'β'},IPARK:{al:'α',be:'β'},PARK:{d:'d',q:'q'},ICLARKE:{a:'a',b:'b',c:'c'},SR:{q:'Q',nq:'Q̄'},EDGE:{y:'y',n:'n'},
 MNMX:{min:'min',max:'max',pp:'p-p'},FOUR:{mag:'|U_ν|',ph:'φ_ν',rms:'U_ν',a:'a_ν',b:'b_ν'},THD:{thd:'THD',h1:'U₁',hh:'U_H',rms:'U'},
 PQ1:{p:'P',q1:'Q₁',s:'S',pf:'PF',p1:'P₁',pf1:'PF₁'},PQ3:{p:'p',q:'q',p0:'p₀'},PPOS:{p:'P⁺',q:'Q⁺',v:'V⁺',i:'I⁺'},
 SEQ:{pos:'|X⁺|',phpos:'∠X⁺',neg:'|X⁻|',phneg:'∠X⁻',zero:'|X⁰|',phzero:'∠X⁰',unb:'X⁻/X⁺'}};
// 4.19.6: the outputs written on the drawing, for blocks with many (the scope and the tooltip have them all)
const OUT_BRIEF={FOUR:['mag','ph'],PQ1:['p','q1','pf'],SEQ:['pos','neg','unb']};
const OUT_TXT={NN:{y:'έξοδος y του δικτύου',L:'σφάλμα μάθησης L (RMS, καμπύλη μάθησης)',dy:'παράγωγος dy = ∂y/∂(είσοδος) (εξομοιωτής)'},GEN3:{w:'ταχύτητα ω (pu, μάζα της γεννήτριας)',te:'ηλεκτρική ροπή T_e (pu)',pe:'ενεργός ισχύς P (pu)',qe:'άεργος ισχύς Q (pu)',vt:'τάση ακροδεκτών |V| (pu)',ifd:'ρεύμα διέγερσης i_fd (pu)',d:'γωνία φορτίου δ (°)',ts1:'ροπή τμήματος άξονα 1–2 (pu)',ts2:'ροπή τμήματος 2–3 (pu)',ts3:'ροπή τμήματος 3–4 (pu)',ts4:'ροπή τμήματος 4–5 (pu)',ts5:'ροπή τμήματος 5–6 (pu)',ts6:'ροπή τμήματος 6–7 (pu)',e0:'E_fd της ροής φορτίου (για τον AVR)',v0:'|V| της ροής φορτίου (για τον AVR)',m0:'T_m της ροής φορτίου (για τον ρυθμιστή στροφών)'},IM:{w:'ταχύτητα ω',te:'ροπή τ_e',psi:'ροή δρομέα |ψ_R|',thf:'γωνία ροής θ_f',thr:'γωνία δρομέα θ_r'},SM:{w:'ταχύτητα ω',te:'ροπή τ_e',th:'ηλεκτρική γωνία δρομέα θ',id:'ρεύμα i_d',iq:'ρεύμα i_q'},SRM:{w:'ταχύτητα ω',te:'ροπή τ_e',th:'γωνία θ_e της φάσης 1',i1:'ρεύμα φάσης 1 (αισθητήρας)',i2:'ρεύμα φάσης 2 (αισθητήρας)',i3:'ρεύμα φάσης 3 (αισθητήρας)',i4:'ρεύμα φάσης 4 (αισθητήρας)'},FEST:{th:'γωνία θ̂',psi:'ροή |ψ̂|',w1:'συχνότητα ω̂₁'},MOD3:{da:'d_a',db:'d_b',dc:'d_c'},DCM:{w:'ταχύτητα ω',te:'ροπή τ_e'},PLL:{th:'γωνία θ',w:'συχνότητα ω',amp:'πλάτος (v_d)'},CLARKE:{al:'συνιστώσα α',be:'συνιστώσα β'},IPARK:{al:'συνιστώσα α',be:'συνιστώσα β'},PARK:{d:'συνιστώσα d',q:'συνιστώσα q'},ICLARKE:{a:'φάση a',b:'φάση b',c:'φάση c'},SR:{q:'έξοδος Q',nq:'έξοδος Q̄'},EDGE:{y:'παλμός y στην ακμή',n:'πλήθος ακμών n'},
 MNMX:{min:'ελάχιστο της περιόδου',max:'μέγιστο της περιόδου',pp:'κορυφή προς κορυφή'},
 FOUR:{mag:'πλάτος |U_ν| της αρμονικής (κορυφή)',ph:'φάση φ_ν (°, ως προς sin ή cos από το t = 0)',rms:'ενεργός τιμή U_ν της αρμονικής',a:'συντελεστής a_ν του cos(νω₁t)',b:'συντελεστής b_ν του sin(νω₁t)'},
 THD:{thd:'ολική αρμονική παραμόρφωση U_H/U₁',h1:'ενεργός τιμή U₁ της θεμελιώδους',hh:'ενεργός τιμή U_H της παραμόρφωσης',rms:'ενεργός τιμή U όλου του σήματος'},
 PQ1:{p:'ενεργός ισχύς P = (1/T)∫v·i dt',q1:'άεργος ισχύς Q₁ της θεμελιώδους',s:'φαινόμενη ισχύς S = V·I',pf:'συντελεστής ισχύος P/S',p1:'ενεργός ισχύς P₁ της θεμελιώδους',pf1:'συντελεστής ισχύος της θεμελιώδους P₁/S₁'},
 PQ3:{p:'στιγμιαία πραγματική ισχύς p',q:'στιγμιαία φανταστική ισχύς q',p0:'στιγμιαία ισχύς μηδενικής ακολουθίας p₀'},
 PPOS:{p:'ενεργός ισχύς θετικής ακολουθίας P⁺',q:'άεργος ισχύς θετικής ακολουθίας Q⁺',v:'τάση θετικής ακολουθίας V⁺ (ενεργός τιμή)',i:'ρεύμα θετικής ακολουθίας I⁺ (ενεργός τιμή)'},
 SEQ:{pos:'μέτρο θετικής ακολουθίας',phpos:'φάση θετικής ακολουθίας (°)',neg:'μέτρο αρνητικής ακολουθίας',phneg:'φάση αρνητικής ακολουθίας (°)',zero:'μέτρο μηδενικής ακολουθίας',phzero:'φάση μηδενικής ακολουθίας (°)',unb:'ασυμμετρία |X⁻|/|X⁺|'}};
function outsOf(c){const q=c?.params?.conn==='bus'?{...c,params:{...c.params,conn:'sep'}}:c;return Object.entries(P.sigPins(q)).filter(([,d])=>d.dir==='out').map(([k])=>k);}
// a block on a bus (3.18) runs as one block per element, <id>[k]: how many (after the last build), and the id without [k]
const vecN=id=>S.sim?.net?.vec?.[id]||0,vecBase=id=>{const m=/^(.*)\[(\d+)\]$/.exec(String(id));return m?{id:m[1],k:+m[2]}:null;};
// ------------------------------------------------------------------ channels
function chanLabel(key){const [pre,id0,pin]=key.split(':'),vb=vecBase(id0);if(vb&&!compAt(id0)){const b=chanLabel([pre,vb.id,pin].filter(x=>x!==undefined).join(':'));return b+'['+vb.k+']';}
 const id=id0,c=compAt(id);const name=c?.label||id;
 if(pre==='VN'){const w=(id.includes('/')?[]:topDoc().wires||[]).find(w=>w.name&&((w.a.c===id&&w.a.p===pin)||(w.b.c===id&&w.b.p===pin)));return w?w.name:'v('+(c?.type==='JUNC'?'κόμβος '+id:name+'.'+pin)+')';}
 if(pre==='Y'&&c?.type==='PY')return (pin||outsOf(c)[0]||'y')+'('+name+')';
 if(pre==='Y'&&c&&OUT_SYM[c.type]){const o=pin||outsOf(c)[0];return (OUT_SYM[c.type][o]||o)+'('+name+')';}
 if(/^PSI\d$/.test(pre))return 'ψ'+'₀₁₂₃₄₅₆₇₈₉'[+pre[3]]+'('+name+')';
 const pm=pre.match(/^([IV])([1-9])$/);if(pm)return (pm[1]==='I'?'i':'v')+'₀₁₂₃₄₅₆₇₈₉'[+pm[2]]+'('+name+')';if((pre==='I'||pre==='V')&&(c?.type==='KL'||c?.type==='KG'||c?.type==='SRM'||c?.type==='TL'))return (pre==='I'?'i₁':'v₁')+'('+name+')';
 const c3=c?.type==='VAC3';return ({I:c3?'i_a':'i',V:c3?'v_an':'v',P:'p',I2:'i₂',V2:'v₂',Im:'i_m',PSIm:'ψ_m',Ib:'i_b',Ic:'i_c',Vb:'v_bn',Vc:'v_cn',Vab:'v_ab',PSW:'p_sw',D:'D',G:'g',GS:'g',REF:'ref',MEAS:'μέτρ.',CAR:'c',H:'hold',Y:c?.type==='VM'?'v':c?.type==='AM'?'i':c?.type==='SR'?'Q':'y'}[pre]||pre)+'('+name+')';}
// 4.18.1 (ζήτημα του Θάνου): where a trace comes from: the automatic name of the signal (element, pin, quantity) and its key,
// under the free name that a tutorial or the user gave it
function chanSrc(key){let a='';try{a=chanLabel(key);}catch(e){}return `πηγή: ${a&&a!==key?a+' · ':''}${key}`;}
function addProbe(key,label){if(!S.sim)return;const np=scope.nextPane,to=np!=null&&scope.cfg.panes[np]&&!scope.cfg.panes[np].ch.length?np:null;scope.nextPane=null;const ok=scope.addChannel(key,label||chanLabel(key),to);renderChannels();if(!ok)flash('#chan-list');else{flash('#scope-card');}draw(true);}
function flash(sel){const e=$(sel);if(!e)return;e.classList.remove('flash');void e.offsetWidth;e.classList.add('flash');}
// 4.8: the signals of an AI controller are those of its inner blocks (channels <id>/SAT, <id>/E, …)
const EVC_SIGS=[['/SAT','εντολή τάσης u'],['/GOV','ω* μετά τον ρυθμιστή αναφοράς'],['/TR','ροπή που χρειάζεται'],['/TQ','ροπή που ζητείται τ*'],['/KP','κράτηση ροπής (keep)'],['/LIM','όριο ενεργό (1)'],['/TP','μέγιστη ροπή (όρια, SOC)'],['/AC','επιτάχυνση που ζητείται'],['/IR','ρεύμα που ζητείται'],['/PW','ισχύς άξονα (kW)'],['/LS','χαμηλό SOC (0 … 1)']];
// 4.8.1: the controls of a generator (inner blocks of the library parts AVR, PSS, GOV)
// 4.10 (§50): the signals of the modular arm, the SOGI-PLL and the m-SSSC controller (names inside their definitions, netlib.js)
const MOD_SIGS={CHB:p=>{const f=p.impl!=='blocks',N=Math.max(1,Math.min(64,Math.round(+p.N)||1));return [['/NLC','στάθμη n (υπομονάδες μέσα, με πρόσημο)'],['/NLC:vav','μέση τάση πυκνωτών'],['/NLC:sw','μεταγωγές υπομονάδων (σύνολο)'],
  [f?'/X':'/VAB','τάση βραχίονα v_ab'],[f?'/X:i':'/I','ρεύμα βραχίονα (a → b)'],...Array.from({length:N},(_,k)=>[f?'/X:v'+(k+1):'/V'+(k+1),'τάση πυκνωτή '+(k+1)]),...Array.from({length:N},(_,k)=>['/NLC:s'+(k+1),'κατάσταση υπομονάδας '+(k+1)+' (−1, 0, +1)'])];},
 SPLL:p=>p.impl==='blocks'?[['/TH','γωνία θ'],['/W','κυκλική συχνότητα ω'],['/VD','πλάτος (v_d)'],['/AL','v′ (α)'],['/BE','qv′ (β)']]:[['/X','γωνία θ'],['/X:w','κυκλική συχνότητα ω'],['/X:amp','πλάτος (v_d)'],['/X:al','v′ (α)'],['/X:be','qv′ (β)']],
 // 4.14 (§42): the MMC (the arms of Model 2/3: <arm> the sum of the capacitor voltages (first output, no suffix), :vav mean, :n inserted cells, :i, :v)
 MMC:p=>{const m=p.impl==='blocks'?'m1':p.model||'m2',L=[['/VDC','τάση DC (p − n)'],['/IDC','ρεύμα DC (έξοδος του p)']];
  for(const x of ['a','b','c'])L.push(['/IA'+x,'ρεύμα AC προς τον μετατροπέα, φάση '+x],['/VA'+x,'τάση AC, φάση '+x]);
  if(m==='m2'||m==='m3')for(const x of ['a','b','c'])for(const [u,n] of [['U','άνω'],['L','κάτω']])L.push(['/A'+u+x,`άθροισμα τάσεων πυκνωτών, ${n} βραχίονας ${x}`],['/A'+u+x+':i',`ρεύμα, ${n} βραχίονας ${x}`],['/A'+u+x+':n',`υπομονάδες μέσα, ${n} βραχίονας ${x}`],['/A'+u+x+':vav',`μέση τάση πυκνωτή, ${n} βραχίονας ${x}`]);
  if(m==='m1')for(const x of ['a','b','c'])for(const [u,n] of [['U','άνω'],['L','κάτω']])L.push(['/'+u+x+'I',`ρεύμα, ${n} βραχίονας ${x}`],['/'+u+x+'N',`υπομονάδες μέσα, ${n} βραχίονας ${x}`],['/'+u+x+'N:vav',`μέση τάση πυκνωτή, ${n} βραχίονας ${x}`]);
  if(m==='m4')L.push(['/VCD','τάση του C_dc'],['/IDS','ρεύμα που παίρνει η πλευρά DC']);
  if(m!=='m4'&&p.ccsc!=='off')L.push(['/ZD','κυκλοφορούν ρεύμα, d (2ω₀)'],['/ZQ','κυκλοφορούν ρεύμα, q (2ω₀)'],['/UCa','τάση του CCSC, φάση a']);
  return L;},
 // 4.16 (§42): the LCC bridge, the twelve-pulse station and its control (names inside their definitions, netlib.js)
 LCC6:p=>{const f=p.impl!=='blocks',m=f?'/X':'/M',L=[[m,'α της τελευταίας πυροδότησης (°, από το φυσικό σημείο)'],[m+':gm','γ, το μικρότερο των 6 τελευταίων σβέσεων (°)'],[m+':gl','γ της τελευταίας σβέσης (°)'],[m+':cf','αποτυχία μετάβασης (1 για μία περίοδο)'],
   [f?'/X:th':'/PLL','γωνία του ταλαντωτή θ']];if(!f)L.push(['/PLL:w','κυκλική συχνότητα του ταλαντωτή ω'],...[1,2,3,4,5,6].map(k=>['/G'+k,'παλμός της βαλβίδας '+k]),...[1,2,3,4,5,6].map(k=>['/I'+k,'ρεύμα της βαλβίδας '+k]));return L;},
 LCCS:p=>{const L=[['/VDC','τάση DC (p − n)'],['/IDC','ρεύμα DC (έξοδος του p)'],['/GM','γ (°)'],['/CF','αποτυχία μετάβασης'],...['a','b','c'].map(x=>['/V'+x,'τάση του ζυγού, φάση '+x])];
  if(p.model==='avg')L.push(['/AA','α ως προς την τάση του ζυγού (°)'],['/FA','πλάτος της τάσης του ζυγού'],['/DL','γωνία της τάσης ως προς τον ταλαντωτή δ (rad)'],['/VD0','V_d0'],['/MU','επικάλυψη μ (rad)'],['/IRa','ρεύμα θεμελιώδους προς τον σταθμό, φάση a']);
  else{const b=p.impl==='blocks'?'M':'X';L.push(['/BY/'+b,'α, γέφυρα Y (°)'],['/BD/'+b,'α, γέφυρα Δ (°)'],['/BY/'+b+':gm','γ, γέφυρα Y (°)'],['/BD/'+b+':gm','γ, γέφυρα Δ (°)']);}
  return L;},
 LCCC:p=>{const inv=p.mode==='inv',own=inv||p.iext!=='sig',L=[['/AO','εντολή α (°)'],['/FI','I_d (pu, μετά το φίλτρο του μετρητή)'],['/KV','V_d (pu)'],['/BLK','μπλοκάρισμα (1)']];
  if(own)L.push(['/ORD','εντολή ρεύματος μετά τον VDCOL (pu)'],['/FV','V_d + k·I_d φιλτραρισμένη (είσοδος του VDCOL)'],['/VDL','όριο του VDCOL (pu)']);
  if(inv)L.push(['/CC','σε έλεγχο ρεύματος (1)'],['/EC','σφάλμα ρεύματος με το περιθώριο'],['/PC','β του PI ρεύματος (rad)'],['/EG','σφάλμα του γ (rad)'],['/PG','β του PI του γ (rad)']);
  else{L.push(['/ER','σφάλμα ρεύματος (pu)'],['/PR','β του PI ρεύματος (rad)']);if(p.fr==='on')L.push(['/QF','εξαναγκασμένη καθυστέρηση (1)'],['/FD','χρόνος με V_d < V_fr']);}
  return L;},
 MMCC:p=>[['/PP','P προς τον μετατροπέα (pu)'],['/QQ','Q προς τον μετατροπέα (pu)'],['/VD','v_d (pu)'],['/VQ','v_q (pu)'],['/ID','i_d (pu)'],['/IQ','i_q (pu)'],['/IDL','i_d,ref μετά το όριο (pu)'],['/IQL','i_q,ref μετά το όριο (pu)'],['/Fvdc','V_dc (pu, φιλτραρισμένη)'],['/Fidc','I_dc (pu, φιλτραρισμένο)'],['/VG','|v| (pu)'],['/TH','γωνία θ'],['/MA','m_a'],['/BLK','μπλοκάρισμα (1)'],['/BRK','εντολή διακόπτη AC (1 κλειστός)'],['/PL','προστασία υπερέντασης DC (1)']],
 // 4.18 (§58): the grid-forming control and the average VSC
 GFMC:p=>{const L=[['/PP','P από τον μετατροπέα (pu)'],['/QQ','Q από τον μετατροπέα (pu)'],['/WW','συχνότητα ω (pu)'],['/EE','πλάτος E του νόμου (pu)'],['/VG','|v| (pu)'],['/IG','|i| (pu)'],['/VD','v_d (pu)'],['/VQ','v_q (pu)'],['/ID','i_d (pu)'],['/IQ','i_q (pu)'],
   ['/VCD','v_conv,d (pu)'],['/VCQ','v_conv,q (pu)'],['/LR','όριο ρεύματος (1)'],['/TH','γωνία θ'],['/PLL','γωνία του PLL'],['/MA','m_a']];
  if(p.law==='droop')L.push(['/PF','P φιλτραρισμένη (pu)'],['/QF','Q φιλτραρισμένη (pu)']);if(p.law==='vsm')L.push(['/WS','ω του δρομέα (pu)'],['/YS','ροή διέγερσης ψ = M_f·i_f (pu)']);
  if(p.law==='psc')L.push(['/FD','σφάλμα: εφεδρικό PLL (1)'],['/DOF','μετατόπιση από το PLL (rad)'],['/XE','ΔV₀ της ρύθμισης τάσης (pu)']);
  // 4.20.2–4.20.3: the oscillator of dVOC, the DC control (matching, or dcc), the set-point after the limitation (24)
  if(p.law==='dvoc')L.push(['/EV','πλάτος E του ταλαντωτή (pu)']);if(p.law==='match')L.push(['/XM','ολοκληρωτής του πλάτους μ (pu)']);
  if(p.law==='match'||p.dcc==='on')L.push(['/IDC','αναφορά ρεύματος της πηγής DC i*_dc (pu του S/V_dc)'],['/PSW','v_dc·i_x − P: απώλειες στην αναφορά DC (pu)']);if(p.plim==='on')L.push(['/PRL','P_ref μετά το όριο ρεύματος (24) (pu)']);if(p.plim==='on'&&parseFloat(p.fpl)>0)L.push(['/IGF','|i| μετά το φίλτρο της (24) (pu)']);
  if(p.inner==='cascade')L.push(['/OD','o_d ρεύμα εξόδου (pu)'],['/OQ','o_q (pu)'],['/ISD','i_d,ref μετά το όριο (pu)'],['/ISQ','i_q,ref μετά το όριο (pu)']);else L.push(['/IRD','i_d,ref (pu)'],['/IRQ','i_q,ref (pu)']);
  return L;},
 PMU3:p=>[['/SV','|V⁺| (RMS φάσης)'],['/TV','∠V⁺ (° ως προς '+(p.ref==='sin'?'sin':'cos')+')'],['/SI','|I⁺| (RMS)'],['/TI','∠I⁺ (° ως προς '+(p.ref==='sin'?'sin':'cos')+')'],['/PP','P⁺ (W)'],['/QQ','Q⁺ (var)']],   // 4.21
 DCDC:()=>[['/PS','ισχύς από το a στο b (W)'],['/IA','ρεύμα i_a της πλευράς a'],['/IBU','ρεύμα i_b προς την πλευρά b'],['/VA','τάση v_a'],['/VB','τάση v_b'],['/IR','αναφορά i_ref']],   // 4.21
 VSC2:p=>[['/Ia','i_a του μετατροπέα'],['/Ib','i_b'],['/Ic','i_c'],['/Oa','o_a στους ακροδέκτες'],['/Pa','v_a στους ακροδέκτες'],['/VD','v_dc'],['/Ma','m_a (μετά τον κορεσμό)']],
 SSSC:p=>[['/VR','αναφορά τάσης v_ref'],['/VQ','εντολή V_q (θετική: χωρητική)'],['/XM','μετρημένη αντίδραση X'],['/DTH','διόρθωση γωνίας Δθ (rad)'],['/VAF','μέση τάση πυκνωτών (φιλτραρισμένη)'],['/PLI/X','γωνία του ρεύματος θ_i − 90°'],['/PLI/X:amp','πλάτος του ρεύματος Î']],
 // 4.17 (§50): the central controller of the three-phase m-SSSC
 SSSC3:p=>{const pos=p.sync!=='phase',L=[['/VQ','εντολή V_q (θετική: χωρητική)'],['/XM','μετρημένη αντίδραση X (θετική ακολουθία)'],['/U','u: εντολή της συνολικής ενέργειας (V/s)'],['/VAF','μέση τάση πυκνωτών των τριών φάσεων (φιλτραρισμένη)']];
  if(pos)L.push(['/PLI','γωνία του ρεύματος θ (θετική ακολουθία)'],['/PLI:amp','πλάτος του ρεύματος Î (θετική ακολουθία)'],['/VQF','V_q της θετικής ακολουθίας (μετρημένη)']);
  for(const x of ['a','b','c']){L.push(['/VR'+x,'αναφορά τάσης, φάση '+x],['/D'+x,'μέρος σε φάση με το ρεύμα D, φάση '+x],['/VKF'+x,'μέση τάση πυκνωτών, φάση '+x],['/BL'+x,'εξισορρόπηση b, φάση '+x]);if(!pos)L.push(['/PL'+x+'/X','γωνία του ρεύματος, φάση '+x],['/PL'+x+'/X:amp','πλάτος του ρεύματος, φάση '+x]);}
  return L;}};
const GEN_CTL_SIGS={AVR:[['/EFD','τάση διέγερσης E_fd'],['/ERR','σφάλμα τάσης (ΔV_ref − ΔV_c + v_s)'],['/TRF','απόκλιση της μετρημένης τάσης ΔV_c'],['/VB','αναφορά V_ref (βάση)']],
 PSS:[['/VS','έξοδος v_s'],['/DW','απόκλιση ταχύτητας Δω'],['/WO','μετά το washout']],
 GOV:[['/TM','μηχανική ροπή T_m'],['/PM','μηχανική ισχύς P_m'],['/G','βαλβίδα ή θυρόφραγμα'],['/S','εντολή του ρυθμιστή (ατμός)'],['/ER','σφάλμα του ρυθμιστή (νερό)']]};
const AIC_SIGS=[['/SAT','εντολή u'],['/E','σφάλμα e = r_f − y'],['/LP','αναφορά r_f (μετά το φίλτρο)'],['/GD','παράγωγος της αναφοράς ṙ_f'],['/PI','έξοδος του PI'],['/NN1','έξοδος του δικτύου'],['/NN1:L','καμπύλη μάθησης L'],['/IAE','IAE = ∫|e|dt'],['/FLAG','κορεσμός (1 = στο όριο)']];
function signalsFor(c,full){const t=c.type,nv=vecN(full||(S.pfx?pid(c.id):c.id));
 if(MOD_SIGS[t])return MOD_SIGS[t]({...Parts.defaults(t),...(c.params||{})}).map(([f,n])=>['Y:',n,f]);
 if(t==='EVC')return EVC_SIGS.map(([f,n])=>['Y:',n,f]);if(GEN_CTL_SIGS[t])return GEN_CTL_SIGS[t].filter(([f])=>t!=='GOV'||(f!=='/S'||c.params?.type!=='hydro')&&(f!=='/ER'||c.params?.type==='hydro')).map(([f,n])=>['Y:',n,f]);if(t==='AIC'){const L=AIC_SIGS.filter(([f])=>f!=='/NN1:L'||(c.params?.scheme||'fel')!=='inv').map(([f,n])=>['Y:',n,f]);return (c.params?.scheme==='emu')?[...L,['Y:','εξομοιωτής: ẏ̂','/NNE'],['Y:','σφάλμα του εξομοιωτή L','/NNE:L'],['Y:','ευαισθησία ∂ẏ̂/∂u','/NNC:dy']]:L;}if(t==='GND'||t==='JUNC'||t==='TAGO'||t==='TAGI'||t==='SUB'||SubC.PORT_KIND[t]||window.NetLib&&NetLib.isLib(t))return [];
 if(t==='PY')return outsOf(c).map((o,k)=>['Y:','έξοδος '+o,k?':'+o:'']);
 if(OUT_TXT[t]){const os=outsOf(c),m=os.map((o,k)=>[k?'Y:':'Y:',OUT_TXT[t][o]||o,k?':'+o:'']);return t==='DCM'?[...m,['I:','ρεύμα τυμπάνου i_a'],['V:','τάση τυμπάνου v_a'],['P:','ηλεκτρική ισχύς']]:t==='GEN3'?[...m,['I:','ρεύμα φάσης a (προς το δίκτυο)'],['V:','τάση φάσης a ως προς τον ουδέτερο']]:t==='IM'||t==='SM'?[...m,['I:','ρεύμα φάσης a'],['V:','πολική τάση v_ab']]:t==='SRM'?[...m,...Array.from({length:P.srmGeo({...P.defaults(t),...c.params})[0]},(_,k)=>[[(k?'I'+(k+1):'I')+':',`ρεύμα φάσης ${k+1}`],[(k?'V'+(k+1):'V')+':',`τάση φάσης ${k+1}`],['PSI'+(k+1)+':',`ροή φάσης ${k+1} ψ`]]).flat()]:m;}
 if(P.BLOCKS.has(t)&&nv>1)return Array.from({length:nv},(_,k)=>['Y:',`έξοδος y, στοιχείο ${k+1} του διαύλου`,`[${k+1}]`]);
 if(P.BLOCKS.has(t))return [['Y:',t==='DISP'?'τιμή εισόδου':t==='VM'?'τάση (μέτρηση)':t==='VP'?'τάση ως προς τη γη':t==='AM'?'ρεύμα a → b (μέτρηση)':t==='IP'?'ρεύμα a → b (τσιμπίδα)':t==='SR'?'έξοδος Q':'έξοδος y']];if(t==='PWM'){const k=c.params?.mode==='pi';return [['D:','λόγος κατάτμησης D'],['G:','παλμός πύλης g'],['CAR:','φέρον c(t)'],...(k?[['REF:','αναφορά'],['MEAS:','μετρούμενο']]:[])];}
 if(t==='SH')return [['H:','κρατημένη τιμή (δείγματα)']];
 if(t==='MOV')return [['I:','ρεύμα αλεξικέραυνου'],['V:','τάση αλεξικέραυνου'],['P:','ισχύς']];
 if(t==='SG')return [['I:','ρεύμα σπινθηριστή'],['V:','τάση στο διάκενο'],['P:','ισχύς στο τόξο']];
 if(t==='DS')return [['I:','ρεύμα του σπινθήρα'],['V:','τάση ανάμεσα στις επαφές'],['P:','ισχύς στον σπινθήρα']];
 if(t==='TL')return [['V:','τάση στην αρχή (a1 − b1)'],['V2:','τάση στο τέλος (a2 − b2)'],['I:','ρεύμα που μπαίνει στην αρχή'],['I2:','ρεύμα που μπαίνει στο τέλος']];
 if(t==='TLM'){const M=P.tlmM({...P.defaults(t),...c.params}),out=[];for(let j=0;j<2*M;j++){const pin=P.tlmPin(j%M,j<M?1:2),pre=j?String(j+1):'';out.push([`V${pre}:`,`τάση ${pin} (προς γη)`],[`I${pre}:`,`ρεύμα που μπαίνει στο ${pin}`]);}return out;}
 if(t==='KL'||t==='KG'){const n=P.nPorts({...P.defaults(t),...c.params}),w=t==='KL'?'τυλίγματος':'θύρας';return Array.from({length:n},(_,k)=>[[(k?'I'+(k+1):'I')+':',`ρεύμα ${w} ${k+1} (a → b)`],[(k?'V'+(k+1):'V')+':',`τάση ${w} ${k+1}`]]).flat();}
 const base=[['I:','ρεύμα'],['V:','τάση'],['P:',['VDC','VAC','IDC'].includes(t)?'ισχύς που δίνει':'ισχύς']];if(t==='SW'||t==='SCR')base.splice(1,0,['GS:','παλμός πύλης (1 = ON)']);if(t==='SW'&&(+c.params?.Eon>0||+c.params?.Eoff>0))base.push(['PSW:','απώλειες μεταγωγής (μέση ανά T)']);
 if(t==='VAC3')return [['I:','ρεύμα φάσης a'],['Ib:','ρεύμα φάσης b'],['Ic:','ρεύμα φάσης c'],['V:','τάση v_an'],['Vb:','τάση v_bn'],['Vc:','τάση v_cn'],['Vab:','πολική τάση v_ab'],['P:','ισχύς που δίνει (3φ)']];if(t==='XFMR')return [['I:','ρεύμα πρωτεύοντος'],['V:','τάση πρωτεύοντος'],['I2:','ρεύμα δευτερεύοντος'],['V2:','τάση δευτερεύοντος'],['Im:','ρεύμα μαγνήτισης'],...(c.params?.sat==='sat'?[['PSIm:','ροή μαγνήτισης (στο πρωτεύον)']]:[]),['P:','ισχύς']];if(t==='LSAT')return [...base,['PSIm:','πεπλεγμένη ροή ψ']];return base;}
// 4.4: the signal list with a search (accents and case ignored, every word must match the group or the signal)
const fold=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
let SIGS=[];
function fillSignals(){const sel=$('#add-signal'),q=fold($('#sig-search')?.value||'').split(/\s+/).filter(Boolean),opts=[],groups=new Map();let n=0;
 for(const g of SIGS){const hit=g.items.filter(it=>q.every(w=>fold(g.label+' '+it.text).includes(w)));if(hit.length){groups.set(g,hit);n+=hit.length;}}
 opts.push(`<option value="">${q.length?(n?`+ Σήμα στο scope… (${n} βρέθηκαν)`:'Κανένα σήμα δεν ταιριάζει'):'+ Σήμα στο scope…'}</option>`);
 for(const [g,hit] of groups)opts.push(`<optgroup label="${esc(g.label)}">`+hit.map(it=>`<option value="${esc(it.value)}">${esc(it.text)}</option>`).join('')+'</optgroup>');
 sel.innerHTML=opts.join('');return n;}
// 4.7: the signal menu (hundreds of options in a large circuit) and the channel list are written again only when they changed
let sigKey='',chanKey='';
function renderChannels(){
 SIGS=[];
 for(const {c,id,label} of allComps()){const sg=signalsFor(c,id);if(!sg.length)continue;SIGS.push({label:`${label} · ${P.PARTS[c.type].name}`,items:sg.map(([p,n,f])=>({value:`${p}${id}${f||''}`,text:`${n} ${label}`}))});}
 const nodes=(topDoc().wires||[]).filter(w=>w.name).map(w=>({value:`VN:${w.a.c}:${w.a.p}`,text:`τάση κόμβου ${w.name}`}));if(nodes.length)SIGS.push({label:'Κόμβοι με όνομα',items:nodes});
 {const k=JSON.stringify(SIGS)+'|'+($('#sig-search')?.value||'');if(k!==sigKey){sigKey=k;fillSignals();}}
 const panes=scope.cfg.panes;
 {const k=JSON.stringify(panes);if(k===chanKey&&$('#chan-list').childElementCount)return;chanKey=k;}
 $('#chan-list').innerHTML=panes.map((p,pi)=>`<div class="pane-row"><div class="pane-head"><b>Παράθυρο ${pi+1}</b><label class="mini"><input type="checkbox" data-pauto="${pi}" ${p.y?.auto===false?'':'checked'}> auto</label>${p.y?.auto===false?'':`<select class="ymode" data-pymode="${pi}" title="Αυτόματη κλίμακα: σταθερή (ανοίγει αμέσως, κλείνει μετά από 2 s) ή σε κάθε καρέ (όπως πριν από την 4.17.2)"><option value="">σταθερή</option><option value="frame" ${p.y?.mode==='frame'?'selected':''}>ανά καρέ</option><option value="grow" ${p.y?.mode==='grow'?'selected':''}>μόνο μεγαλώνει</option></select>`}<button class="mini pcfg" data-pcfg="${pi}" title="Η κλίμακα y του παραθύρου: αυτόματη, μόνο μεγαλώνει, κλειδωμένη, από–έως, συμμετρική, περιθώριο (το ίδιο με το ⚙ στη γωνία του)">⚙</button>${p.y?.auto===false?`<input class="ymin" data-pmin="${pi}" value="${p.y.min??''}" placeholder="min"><input class="ymax" data-pmax="${pi}" value="${p.y.max??''}" placeholder="max">`:''}<label class="mini"><input type="checkbox" data-pzero="${pi}" ${p.zero?'checked':''}> 0</label></div>
  ${p.ch.map(ch=>{const src=chanSrc(ch.key);return `<div class="chan" data-key="${esc(ch.key)}" title="${esc(src)}"><label class="sw"><input type="checkbox" data-on="${esc(ch.key)}" ${ch.on?'checked':''}><i style="background:${ch.color}"></i></label><input class="clabel" data-label="${esc(ch.key)}" value="${esc(ch.label)}" title="Όνομα στο γράφημα (αλλάζει ελεύθερα)· ${esc(src)}"><select data-pane="${esc(ch.key)}">${Array.from({length:Math.min(12,panes.length+1)},(_,i)=>i).map(i=>`<option value="${i}" ${i===pi?'selected':''}>Π${i+1}</option>`).join('')}</select><button class="x" data-rm="${esc(ch.key)}" title="Αφαίρεση">✕</button></div><div class="csrc" data-src="${esc(ch.key)}">${esc(src)}</div>`;}).join('')||(pi===scope.nextPane?'<div class="muted small">Κενό παράθυρο: το επόμενο σήμα από τη λίστα (ή «⌁ I/V επιλεγμένων») πάει εδώ.</div>':'<div class="muted small">Κανένα σήμα. Δεξί κλικ σε στοιχείο → Scope, ή επίλεξε από τη λίστα.</div>')}</div>`).join('');
 $$('#chan-list [data-rm]').forEach(b=>b.onclick=()=>{scope.removeChannel(b.dataset.rm);renderChannels();draw(true);});
 $$('#chan-list [data-on]').forEach(b=>b.onchange=()=>{const ch=scope.channels().find(c=>c.key===b.dataset.on);for(const p of scope.cfg.panes)for(const c of p.ch)if(c.key===b.dataset.on)c.on=b.checked;void ch;draw(true);});
 $$('#chan-list [data-pane]').forEach(b=>b.onchange=()=>{scope.moveChannel(b.dataset.pane,+b.value);renderChannels();draw(true);});
 $$('#chan-list [data-label]').forEach(b=>b.onchange=()=>{for(const p of scope.cfg.panes)for(const c of p.ch)if(c.key===b.dataset.label)c.label=b.value;draw(true);});
 $$('#chan-list [data-pauto]').forEach(b=>b.onchange=()=>{const p=scope.cfg.panes[+b.dataset.pauto];if(b.checked)p.y={auto:true};else{const L=scope.layout?.[+b.dataset.pauto];p.y={auto:false,min:L?+L.lo.toPrecision(3):-1,max:L?+L.hi.toPrecision(3):1};}renderChannels();draw(true);});
 $$('#chan-list [data-pymode]').forEach(b=>b.onchange=()=>{const pi=+b.dataset.pymode,p=scope.cfg.panes[pi];p.y={...(p.y?.auto!==false?p.y:{}),auto:true};if(b.value)p.y.mode=b.value;else delete p.y.mode;scope.yst[pi]=null;draw(true);});
 $$('#chan-list [data-pcfg]').forEach(b=>b.onclick=e=>{const r=b.getBoundingClientRect();openPaneCfg(+b.dataset.pcfg,r.right+270,r.bottom);});
 $$('#chan-list [data-pzero]').forEach(b=>b.onchange=()=>{scope.cfg.panes[+b.dataset.pzero].zero=b.checked;draw(true);});
 $$('#chan-list [data-pmin],#chan-list [data-pmax]').forEach(b=>b.onchange=()=>{const pi=+(b.dataset.pmin??b.dataset.pmax);const p=scope.cfg.panes[pi];const v=P.parseEng(b.value);if(Number.isFinite(v)){if(b.dataset.pmin!==undefined)p.y.min=v;else p.y.max=v;}draw(true);});
}
// 4.7: a burst of scope changes (five channels of a tutorial, a drag of the cursors) gives one table on the next frame.
// 4.17.2 (ROADMAP §63): the values in a box of their own (its height, its scroll bars, PlotCore.Readout): the table is
// built again only when its rows or columns change, otherwise only its numbers, at most twice a second while it runs
// 5.0.2: the region of the min–max tool (Shift+drag on the graphs, or «⇹ Περιοχή»): per channel min and max with their
// times, mean, peak to peak and RMS over the region, with its Δt and 1/Δt; written again only when a value changes
function renderSel(){const box=$('#sel-out');if(!box)return;const q=scope.cfg.sel;if(!q||!S.sim){if(!box.hidden){box.hidden=true;box.innerHTML='';box._h='';}return;}
 const rows=scope.selStats(),dt=q[1]-q[0],at=t=>Number.isFinite(t)?` <small>@ ${eng(t,'s',5)}</small>`:'',v=(x,u)=>Number.isFinite(x)?eng(x,u,5):'—';
 const html=`<div class="sel-head"><b>⇹ Περιοχή</b><span>${eng(q[0],'s',5)} – ${eng(q[1],'s',5)} · Δt = ${eng(dt,'s',4)} · 1/Δt = ${eng(1/dt,'Hz',4)}</span><span class="sel-btns"><button data-selzoom title="Ο χρόνος των γραφημάτων στην περιοχή">⤢ Μεγέθυνση</button><button data-selcsv title="Ο πίνακας σε CSV">CSV ↓</button><button class="x" data-selclear title="Χωρίς περιοχή (και κλικ στα γραφήματα με το εργαλείο)">✕</button></span></div>
  <table class="sel-tab"><thead><tr><th>Σήμα</th><th>min</th><th>max</th><th>Μέση</th><th>κ-κ</th><th>RMS</th></tr></thead><tbody>${rows.map(r=>{const u=MeasureUnit(r.key);return `<tr><td><i style="background:${esc(r.color)}"></i>${esc(r.label)}</td><td>${v(r.min,u)}${at(r.tmin)}</td><td>${v(r.max,u)}${at(r.tmax)}</td><td>${v(r.avg,u)}</td><td>${v(r.pp,u)}</td><td>${v(r.rms,u)}</td></tr>`;}).join('')}</tbody></table>`;
 box.hidden=false;if(box._h!==html){box._h=html;box.innerHTML=html;}}
function selCSV(){const q=scope.cfg.sel;if(!q)return;const rows=scope.selStats(),f=x=>Number.isFinite(x)?String(+x.toPrecision(10)):'';
 download('περιοχή.csv','\ufeffσήμα,μονάδα,t0 (s),t1 (s),min,t_min (s),max,t_max (s),μέση,κ-κ,rms\n'+rows.map(r=>[`"${String(r.label).replace(/"/g,'""')}"`,MeasureUnit(r.key),f(q[0]),f(q[1]),f(r.min),f(r.tmin),f(r.max),f(r.tmax),f(r.avg),f(r.pp),f(r.rms)].join(',')).join('\n')+'\n','text/csv;charset=utf-8');}
// 5.0.2 (⚙ of a pane): its y scale: automatic (steady, only grows, every frame), locked at the range shown, or from–to;
// symmetric about 0, with 0, a margin; «Σε όλα τα παράθυρα». The defaults are those of before.
function paneMode(p){const Y=p.y||{};return Y.auto===false?(Y.zoom?'zoom':Y.lock?'lock':'fixed'):Y.mode==='frame'?'frame':Y.mode==='grow'?'grow':'auto';}
function paneCfgHTML(i){const p=scope.cfg.panes[i],Y=p.y||{},L=scope.layout?.[i],mode=paneMode(p),man=Y.auto===false;
 const r=(v,t,h)=>`<label class="pc-r" title="${esc(h)}"><input type="radio" name="pc-mode" value="${v}" ${mode===v?'checked':''}> ${t}</label>`,num=x=>Number.isFinite(+x)?String(+(+x).toPrecision(6)):'';
 return `<div class="pc-head"><b>⚙ Παράθυρο ${i+1}: κλίμακα y</b><button class="x" data-pcclose title="Κλείσιμο (Esc)">✕</button></div>
  ${r('auto','Αυτόματη, σταθερή','Ανοίγει αμέσως όταν τα δεδομένα βγαίνουν από το εύρος, και κλείνει μετά από 2 s (η προεπιλογή)')}
  ${r('grow','Αυτόματη, μόνο μεγαλώνει','Το εύρος όλων όσων φάνηκαν σε αυτό το τρέξιμο: δεν κλείνει ποτέ όσο τρέχει, άρα δεν τρεμοπαίζει (ξαναρχίζει με ⟲ ή με άλλα σήματα)')}
  ${r('frame','Αυτόματη, σε κάθε καρέ','Ακολουθεί τα δεδομένα σε κάθε καρέ, όπως πριν από την 4.17.2')}
  ${r('lock','Κλειδωμένη στο τωρινό εύρος',L?`Μένει ${eng(L.lo,'',4)} … ${eng(L.hi,'',4)}`:'Το εύρος που φαίνεται τώρα')}
  ${r('fixed','Από – έως','Οι τιμές που γράφεις')}
  ${mode==='zoom'?'<p class="small muted pc-note">Από μεγέθυνση: «⟲ Χωρίς μεγέθυνση» ή διπλό κλικ στα γραφήματα την επαναφέρει.</p>':''}
  <div class="pc-row"><label>από <input data-pcmin value="${man?num(Y.min):L?num(L.lo):''}" ${mode==='fixed'?'':'disabled'}></label><label>έως <input data-pcmax value="${man?num(Y.max):L?num(L.hi):''}" ${mode==='fixed'?'':'disabled'}></label></div>
  <div class="pc-row"><label><input type="checkbox" data-pcsym ${Y.sym?'checked':''} ${man?'disabled':''}> συμμετρική γύρω από το 0</label><label><input type="checkbox" data-pczero ${p.zero?'checked':''}> με το 0</label></div>
  <div class="pc-row"><label>Περιθώριο <select data-pcpad ${man?'disabled':''}>${[['','αυτόματο'],['0','0 %'],['5','5 %'],['10','10 %'],['20','20 %']].map(([v,t])=>`<option value="${v}" ${String(Y.pad??'')===v?'selected':''}>${t}</option>`).join('')}</select></label></div>
  <div class="pc-foot"><button data-pcall title="Οι ίδιες ρυθμίσεις σε όλα τα παράθυρα του scope (μια κλειδωμένη κλίμακα: το εύρος του καθενός)">Σε όλα τα παράθυρα</button><button data-pcreset title="Αυτόματη, σταθερή, χωρίς συμμετρία και περιθώριο">↺ Προεπιλογή</button></div>`;}
function paneCfgApply(i,el){const p=scope.cfg.panes[i],m=$('#pane-cfg');if(!p||!m)return;const Y=p.y||{},L=scope.layout?.[i];
 if(el.dataset.pcclose!==undefined){m.hidden=true;return;}
 const keep=o=>{if(Y.auto!==false){if(Y.sym)o.sym=true;if(Y.pad!==undefined)o.pad=Y.pad;}return o;},rd=k=>P.parseEng(m.querySelector(k).value);
 if(el.name==='pc-mode'){const v=el.value;if(v==='auto')p.y=keep({auto:true});else if(v==='grow')p.y=keep({auto:true,mode:'grow'});else if(v==='frame')p.y=keep({auto:true,mode:'frame'});
  else if(v==='lock'){if(!L)return;p.y={auto:false,min:L.lo,max:L.hi,lock:true};}
  else if(v==='fixed'){const a=rd('[data-pcmin]'),b=rd('[data-pcmax]');p.y=Number.isFinite(a)&&Number.isFinite(b)&&b>a?{auto:false,min:a,max:b}:{auto:false,min:L?L.lo:-1,max:L?L.hi:1};}}
 else if(el.dataset.pcmin!==undefined||el.dataset.pcmax!==undefined){const a=rd('[data-pcmin]'),b=rd('[data-pcmax]');if(!(Number.isFinite(a)&&Number.isFinite(b)&&b>a)){el.classList.add('bad');return;}p.y={auto:false,min:a,max:b};}
 else if(el.dataset.pcsym!==undefined){if(Y.auto===false)return;p.y={auto:true,...Y};if(el.checked)p.y.sym=true;else delete p.y.sym;}
 else if(el.dataset.pczero!==undefined)p.zero=el.checked;
 else if(el.dataset.pcpad!==undefined){if(Y.auto===false)return;p.y={auto:true,...Y};if(el.value==='')delete p.y.pad;else p.y.pad=+el.value;}
 else if(el.dataset.pcreset!==undefined)delete p.y;
 else if(el.dataset.pcall!==undefined){scope.cfg.panes.forEach((q,j)=>{if(j===i)return;const Lj=scope.layout?.[j];if(!p.y)delete q.y;else{q.y=JSON.parse(JSON.stringify(p.y));if(q.y.lock&&Lj){q.y.min=Lj.lo;q.y.max=Lj.hi;}}q.zero=p.zero;scope.yst[j]=null;});}
 else return;
 scope.yst[i]=null;renderChannels();draw(true);m.innerHTML=paneCfgHTML(i);}
function openPaneCfg(i,x,y){if(!scope.cfg.panes[i])return;let m=$('#pane-cfg');
 if(!m){m=document.createElement('div');m.id='pane-cfg';m.className='popup pane-cfg';m.setAttribute('role','dialog');m.hidden=true;document.body.appendChild(m);
  m.addEventListener('change',e=>paneCfgApply(+m.dataset.pane,e.target));m.addEventListener('click',e=>{const b=e.target.closest('button');if(b)paneCfgApply(+m.dataset.pane,b);});
  document.addEventListener('pointerdown',e=>{if(!m.hidden&&!m.contains(e.target)&&!e.target.closest?.('[data-pcfg]'))m.hidden=true;},true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!m.hidden)m.hidden=true;});}
 m.dataset.pane=i;m.innerHTML=paneCfgHTML(i);placePopup(m,x-260,y);}
let measureRaf=0,MEAS=null;function requestMeasure(){if(measureRaf)return;measureRaf=requestAnimationFrame(()=>{measureRaf=0;renderMeasure(true);});}
function renderMeasure(force){if(measureRaf){cancelAnimationFrame(measureRaf);measureRaf=0;}
 if(!S.sim)return;renderSel();const cur=scope.cfg.cursors;if(!MEAS)MEAS=new PlotCore.Readout($('#measure'));
 const cols=[{k:'avg',label:'Μέση'},{k:'rms',label:'RMS'},{k:'min',label:'min'},{k:'max',label:'max'},{k:'pp',label:'p-p'},{k:'lp',label:'⌀ τελ. T'}];
 if(cur.length)cols.push({k:'A',label:`A @ ${eng(cur[0],'s')}`},{k:'B',label:cur.length>1?'B @ '+eng(cur[1],'s'):'B'},{k:'BA',label:'B − A'+(cur.length>1?' · Δt '+eng(cur[1]-cur[0],'s'):'')});
 const rows=[];
 for(const ch of scope.channels()){if(!ch.on)continue;const st=scope.stats(ch.key);const u=MeasureUnit(ch.key);const lp=S.sim.lastPeriod(ch.key.startsWith('VN:')?(()=>{const n=S.sim.net.pinNet.get(ch.key.slice(3));return n&&!n.ground?'N:'+n.canon:'';})():ch.key);
  const cells=[st?eng(st.avg,u):'—',st&&Number.isFinite(st.rms)?eng(st.rms,u):'—',st?eng(st.min,u):'—',st?eng(st.max,u):'—',st?eng(st.pp,u):'—',lp?eng(lp.avg,u):'—'];
  if(cur.length){const ci=scope.resolve(ch.key);const a=ci===-1?NaN:scope.valueAt(ci,cur[0]),b=cur[1]!==undefined&&ci!==-1?scope.valueAt(ci,cur[1]):NaN;cells.push(eng(a,u),cur.length>1?eng(b,u):'',cur.length>1?eng(b-a,u):'');}
  rows.push({key:ch.key,label:ch.label,color:ch.color,cells});}
 const [t0,t1]=scope.viewRange();
 MEAS.set(cols,rows,`Στατιστικά στο ορατό παράθυρο ${eng(t0,'s')} … ${eng(t1,'s')}${scope.cfg.frozen?' (σταθερή προβολή · διπλό κλικ για ζωντανή)':''}. Κλικ στο scope: cursor A, Shift+κλικ: cursor B.`,{force:force||!S.running,ms:500});
}
function MeasureUnit(key){return MeasureUnitCache[key.split(':')[0]]??Scope.unitOf(key,S.sim);}const MeasureUnitCache={};

// ------------------------------------------------------------------ response metrics
function simKey(key){if(!key.startsWith('VN:'))return key;const n=S.sim?.net.pinNet.get(key.slice(3));return n&&!n.ground?'N:'+n.canon:null;}
function perSeries(key){const s=S.sim;const k=simKey(key);const i=k===null?undefined:s?.chIndex.get(k);if(i===undefined)return null;const p=s.per,t=[],y=[];const st=(p.head-p.n+p.cap)%p.cap;for(let q=0;q<p.n;q++){const j=(st+q)%p.cap;t.push(p.t[j]);y.push(p.avg[j*p.nch+i]);}return {t,y};}
function refFor(key){ // reference of the loop that measures this signal, as a function of t
 const sched=(s,t,d)=>{if(!s)return d;let v=s[0][1];if(t<s[0][0])return d;for(const [ts,val] of s){if(ts<=t+1e-15)v=val;else break;}return v;};
 for(const c of editor.doc.components){if(c.type!=='PWM')continue;const p={...P.defaults('PWM'),...c.params};if(p.mode!=='pi')continue;
  if(key==='MEAS:'+c.id||key===(p.qty==='V'?'V:':'I:')+p.sensor){const s=P.parseSched(p.ref);if(s)return {fn:t=>sched(s,t,s[0][1]),label:`αναφορά του ${c.label||c.id}`};}}
 return null;}
function metricsFor(key,ev,opts={}){const d=perSeries(key);if(!d||d.t.length<4)return {ok:false,why:'Δεν υπάρχουν ακόμη αρκετές περίοδοι.'};
 const evs=Metrics.scheduleEvents(editor.doc,P.parseSched);const i=evs.findIndex(e=>Math.abs(e.t-ev.t)<1e-12);const next=evs.find((e,j)=>j>i&&e.t>ev.t+1e-12);
 const tEnd=Math.min(next?next.t:Infinity,S.sim.t);const rf=opts.ref==='final'?null:opts.ref==='value'?opts.value:(refFor(key)?.fn||null);
 return Metrics.responseMetrics({t:d.t,y:d.y,tStep:ev.t,tEnd,ref:rf,band:opts.band??.02});}
function metricsRows(m,u){if(!m.ok)return `<p class="muted small">${esc(m.why)}</p>`;const pct=v=>Number.isFinite(v)?fmt(v,3)+' %':'—';
 const rows=m.disturbance?[['Μέγιστη απόκλιση',eng(m.maxDev,u)],['τη στιγμή (μετά το βήμα)',eng(m.tDev,'s')],['Επαναφορά στη ζώνη ±'+eng(m.tol,u),m.settled?eng(m.ts,'s'):'δεν επανήλθε']]
  :[['Υπερύψωση',pct(m.overshoot)],['Χρόνος ανόδου 10–90 %',eng(m.rise,'s')],['Χρόνος κορυφής',eng(m.tPeak,'s')],['Αποκατάσταση στη ζώνη ±'+eng(m.tol,u),m.settled?eng(m.ts,'s'):'δεν σταθεροποιήθηκε']];
 return `<table class="kv"><tbody><tr><td>Αρχική → τελική</td><td>${eng(m.y0,u)} → ${eng(m.yf,u)}</td></tr>${rows.map(([a,b])=>`<tr><td>${a}</td><td>${b}</td></tr>`).join('')}
  ${Number.isFinite(m.ess)?`<tr><td>Σφάλμα μόνιμης κατάστασης</td><td>${eng(m.ess,u)}</td></tr>`:''}<tr><td>IAE = ∫|e|dt</td><td>${eng(m.IAE,u+'·s')}</td></tr><tr><td>ISE = ∫e²dt</td><td>${eng(m.ISE,u?u+'²·s':'s')}</td></tr><tr><td>ITAE = ∫t|e|dt</td><td>${eng(m.ITAE,u+'·s²')}</td></tr></tbody></table>`;}
function eventMetricsHTML(key){if(!S.sim)return '';const evs=Metrics.scheduleEvents(editor.doc,P.parseSched).filter(e=>e.t<S.sim.t);if(!evs.length)return '<p class="muted small">Τρέξε την προσομοίωση πέρα από τα βήματα (⏩) για να βγουν οι δείκτες.</p>';
 const u=MeasureUnit(key);return evs.map(e=>{const m=metricsFor(key,e);return `<div class="evm"><b>${esc(e.what)} @ ${eng(e.t,'s')}</b>${m.ok?(m.disturbance?` · μέγ. απόκλιση ${eng(m.maxDev,u)}, επαναφορά ${m.settled?eng(m.ts,'s'):'—'}`:` · υπερύψωση ${fmt(m.overshoot,3)} %, t_r ${eng(m.rise,'s')}, t_s(±2 %) ${m.settled?eng(m.ts,'s'):'—'}`)+` · IAE ${eng(m.IAE,u+'·s')}`:' · '+esc(m.why)}</div>`;}).join('');}
function renderMetricsPanel(){const box=$('#rm-out');if(!box||!S.sim||!$('#rm-block').open)return;
 const sig=$('#rm-sig'),evSel=$('#rm-ev');const chans=scope.channels();const keep=sig.value;
 sig.innerHTML=chans.map(c=>`<option value="${esc(c.key)}">${esc(c.label)}</option>`).join('')||'<option value="">— πρόσθεσε σήμα στο scope —</option>';if(chans.some(c=>c.key===keep))sig.value=keep;
 const evs=Metrics.scheduleEvents(editor.doc,P.parseSched),kev=evSel.value;evSel.innerHTML=evs.map((e,i)=>`<option value="${i}">${esc(e.what)} @ ${eng(e.t,'s')}</option>`).join('')+'<option value="manual">χειροκίνητα…</option>';
 if([...evSel.options].some(o=>o.value===kev))evSel.value=kev;$('#rm-t-l').hidden=evSel.value!=='manual';$('#rm-val-l').hidden=$('#rm-ref').value!=='value';
 const key=sig.value;if(!key){box.innerHTML='';return;}
 const ev=evSel.value==='manual'?{t:(P.parseEng($('#rm-t').value)||0)*1e-3}:evs[+evSel.value];if(!ev){box.innerHTML='<p class="muted small">Δεν υπάρχει πρόγραμμα R(t), V(t), P(t), D(t) ή αναφοράς: διάλεξε «χειροκίνητα» και δώσε τη στιγμή του βήματος.</p>';return;}
 const refMode=$('#rm-ref').value,rf=refFor(key);const m=metricsFor(key,ev,{ref:refMode==='auto'&&!rf?'final':refMode,value:P.parseEng($('#rm-val').value),band:+$('#rm-band').value});
 box.innerHTML=`<p class="muted small">${refMode==='auto'?(rf?esc(rf.label):'σφάλμα ως προς την τελική τιμή'):refMode==='final'?'σφάλμα ως προς την τελική τιμή':'σφάλμα ως προς σταθερή τιμή'} · από μέσες τιμές ανά περίοδο (χωρίς την κυμάτωση)</p>`+metricsRows(m,MeasureUnit(key));}

// ------------------------------------------------------------------ harmonics (Fourier series over whole periods of f₁) and THD
function rawSeries(key){const s=S.sim;const k=simKey(key);const i=k===null?undefined:s?.chIndex.get(k);if(i===undefined)return null;const r=s.ring,t=[],y=[];const st=(r.head-r.n+r.cap)%r.cap;
 for(let q=0;q<r.n;q++){const j=(st+q)%r.cap;t.push(r.t[j]);y.push(r.d[j*r.nch+i]);}return {t,y};}
// fundamental: the AC source, the SPWM reference or the PLL, else the switching frequency
function autoF1(){for(const c of editor.doc.components){const p={...P.defaults(c.type),...c.params};if(c.type==='VAC3'||c.type==='VAC')return [+p.f,`πηγή ${c.label||c.id}`];if(c.type==='PWM'&&p.mode==='spwm')return [+p.fref,`αναφορά SPWM ${c.label||c.id}`];if(c.type==='PLL')return [+p.f0,`PLL ${c.label||c.id}`];}
 return S.sim?[1/S.sim.T,'συχνότητα βάσης (μεταγωγή)']:[50,'προεπιλογή'];}
// 3.19: the event log (Sim.events, §3): the last events of the chosen kind and source, CSV of all that the solver keeps
const EV_KIND={switch:'μεταγωγή διακόπτη',diode:'δίοδος',scr:'θυρίστορ',gap:'σπινθηριστής',cmp:'συγκριτής',latch:'latch',edge:'ακμή',sample:'δείγμα',duty:'ενημέρωση D',jump:'άλμα προγράμματος',live:'ζωντανή αλλαγή',program:'πρόγραμμα αλλαγών'};
function evRows(){const E=S.sim?.events?S.sim.events():{list:[],n:0,kinds:{}},k=$('#ev-kind')?.value||'',q=($('#ev-src')?.value||'').trim().toLowerCase();
 return {E,rows:E.list.filter(e=>(!k||e.kind===k)&&(!q||String(e.src).toLowerCase().includes(q)||String(e.id||'').toLowerCase().includes(q)))};}
function renderEvents(){const box=$('#ev-out');if(!box||!S.sim||!$('#ev-block').open)return;const {E,rows}=evRows(),sel=$('#ev-kind');
 const have=Object.keys(E.kinds);if(sel&&sel.options.length-1!==have.length){const v=sel.value;sel.innerHTML='<option value="">Όλα</option>'+have.map(k=>`<option value="${k}">${esc(EV_KIND[k]||k)} (${E.kinds[k]})</option>`).join('');sel.value=have.includes(v)?v:'';}
 const fv=e=>typeof e.v==='number'?eng(e.v,e.u||'',5):esc(String(e.v));
 box.innerHTML=`<small class="muted">${E.n} συμβάντα${E.n>E.list.length?`, κρατιούνται τα τελευταία ${E.list.length}`:''}${rows.length!==E.list.length?` · ${rows.length} με το φίλτρο`:''}.</small>`+
  (rows.length?`<table class="ev-table"><tr><th>t</th><th>είδος</th><th>πηγή</th><th>τιμή</th></tr>${rows.slice(-80).reverse().map(e=>`<tr><td>${eng(e.t,'s',6)}</td><td>${esc(EV_KIND[e.kind]||e.kind)}</td><td>${e.id?`<button data-focus="${esc(String(e.id).split('[')[0])}">${esc(e.src)}</button>`:esc(e.src)}</td><td>${fv(e)}${e.from!==undefined?` <span class="muted">(από ${esc(String(typeof e.from==='number'?eng(e.from,'',4):e.from))})</span>`:''}</td></tr>`).join('')}</table>`:'<p class="muted small">Κανένα ακόμη. Τρέξε την προσομοίωση.</p>');
 box.querySelectorAll('[data-focus]').forEach(b=>b.onclick=()=>focusComp(b.dataset.focus));}
// 4.12: how many events the solver keeps (the setting of the log, remembered), and the log as JSON
const EVMAX_KEY='pcl.evmax',EVMAX_OPTS=[2000,20000,200000];
function evMaxSetting(){try{const v=+localStorage.getItem(EVMAX_KEY);return EVMAX_OPTS.includes(v)?v:20000;}catch(e){return 20000;}}
function eventsJson(){const {E,rows}=evRows();if(!rows.length)return;download('events.json',JSON.stringify({n:E.n,kept:E.list.length,max:E.max,kinds:E.kinds,events:rows},null,1),'application/json');}
function eventsCsv(){const {rows}=evRows();if(!rows.length)return;const q=v=>v===undefined||v===null?'':/[",\n]/.test(String(v))?'"'+String(v).replace(/"/g,'""')+'"':String(v);
 download('events.csv',['t [s],kind,id,source,value,side,unit,clock,n,from',...rows.map(e=>[e.t,e.kind,e.id,e.src,e.v,e.side,e.u,e.clk,e.n,e.from].map(q).join(','))].join('\n'),'text/csv');}
function renderFFT(){const box=$('#ff-out');if(!box||!S.sim||!$('#ff-block').open)return;
 const sig=$('#ff-sig');const chans=scope.channels();const keep=sig.value;
 sig.innerHTML=chans.map(c=>`<option value="${esc(c.key)}">${esc(c.label)}</option>`).join('')||'<option value="">— πρόσθεσε σήμα στο scope —</option>';if(chans.some(c=>c.key===keep))sig.value=keep;
 const key=sig.value;if(!key){box.innerHTML='';return;}
 const fv=P.parseEng($('#ff-f1').value),[fa,fsrc]=autoF1(),f1=Number.isFinite(fv)&&fv>0?fv:fa,d=rawSeries(key);if(!d){box.innerHTML='';return;}
 const r=Metrics.harmonics({t:d.t,y:d.y,f1,periods:+$('#ff-p').value,H:+$('#ff-h').value*+$('#ff-p').value});
 if(!r.ok){box.innerHTML=`<p class="muted small">${esc(r.why)}</p>`;return;}
 const u=MeasureUnit(key),A1=r.A1,rel=h=>A1>0?100*r.A[h]/A1:NaN;
 const top=[...Array(r.H+1).keys()].slice(2).sort((a,b)=>r.A[b]-r.A[a]).slice(0,8).filter(h=>r.A[h]>1e-9*Math.max(A1,1e-30)).sort((a,b)=>a-b);
 // bar chart: harmonics in % of the fundamental, scaled to the largest one (the fundamental bar is clipped)
 const W=260,Hh=110,pl=34,pb=18,n=r.H,bw=(W-pl-6)/n,mx=Math.max(1e-9,...[...Array(n+1).keys()].slice(2).map(rel).filter(Number.isFinite)),ns=niceTop(mx);
 const bars=[...Array(n).keys()].map(k=>{const h=k+1,v=h===1?ns:Math.min(rel(h),ns),y=Hh-pb-(Hh-pb-6)*v/ns;return `<rect class="${h===1?'f1':'hb'}" x="${pl+k*bw+bw*.15}" y="${y}" width="${Math.max(bw*.7,.6)}" height="${Hh-pb-y}"><title>h = ${h} · ${eng(h*f1,'Hz')} · ${fmt(rel(h),3)} %</title></rect>`;}).join('');
 // 4.22 (§63 part 2): the frame and the ticks of the core (PlotCore.svgFrame), the same margins as the bars
 const ticks=PlotCore.svgFrame({W,H:Hh,ml:pl,mr:6,mt:6,mb:pb,x:[.5,n+.5],y:[0,ns],xPlain:true,yPlain:true,yUnit:'%',xfmt:(v,st)=>Number.isInteger(v)?String(v):'',cw:5}).svg;
 box.innerHTML=`<p class="muted small">f₁ = ${eng(f1,'Hz')} (${Number.isFinite(fv)&&fv>0?'χειροκίνητα':esc(fsrc)}) · ${r.periods} ${r.periods>1?'περίοδοι':'περίοδος'}, ${eng(r.window[0],'s')} … ${eng(r.window[1],'s')} · ${r.n} σημεία</p>
  <svg class="ffchart" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Αρμονικές σε % της θεμελιώδους">${ticks}${bars}</svg>
  <table class="kv"><tbody><tr><td>DC</td><td>${eng(r.dc,u)}</td></tr><tr><td>Θεμελιώδης: πλάτος / RMS</td><td>${eng(A1,u)} / ${eng(r.rms1,u)}</td></tr><tr><td>Φάση θεμελιώδους (cos, από την αρχή του παραθύρου)</td><td>${fmt(-r.ph[1],4)}°</td></tr><tr><td>RMS (όλο το σήμα)</td><td>${eng(r.rms,u)}</td></tr>
  <tr><td>THD (h = 2 … ${r.H})</td><td><b>${fmt(r.thd,4)} %</b></td></tr><tr><td>THD (όλο το φάσμα, από την RMS)</td><td>${fmt(r.thdAll,4)} %</td></tr></tbody></table>
  ${top.length?`<table class="kv ff-top"><tbody><tr><td>h</td><td>f</td><td>πλάτος</td><td>% A₁</td><td>φάση</td></tr>${top.map(h=>`<tr><td>${h}</td><td>${eng(h*f1,'Hz')}</td><td>${eng(r.A[h],u)}</td><td>${fmt(rel(h),3)}</td><td>${fmt(-r.ph[h],3)}°</td></tr>`).join('')}</tbody></table>`:''}
  <p class="muted small">Σειρά Fourier πάνω σε ακέραιες περιόδους της f₁, με ακριβή ολοκλήρωση ανάμεσα στα σημεία του λύτη (όχι επαναδειγματοληψία). THD = √(Σ A_h²)/A₁ για h ≥ 2. Η δεύτερη τιμή περιέχει και ό,τι δεν είναι αρμονική της f₁ (π.χ. υποαρμονικές, συνιστώσες μεταγωγής πάνω από το h).</p>`;}
// ------------------------------------------------------------------ impedance spectroscopy (3.3.1): Z(f) = V₁/I₁ at each frequency of the perturbation
const EIS={run:false,pts:[]};
// model impedance of the cell of the tutorial: R₀ + R₁‖C₁ + Warburg (exact, and with the R–C bank the solver uses)
function cellZ(f,bank){const w=2*Math.PI*f,R0=+paramsOf('R0')?.R,R1=+paramsOf('R1')?.R,C1=+paramsOf('C1')?.C,W=paramsOf('W1');if(![R0,R1,C1].every(Number.isFinite))return null;
 const d=1+(w*R1*C1)**2,zw=W?(bank?P.cpeZbank:P.cpeZ)({...P.defaults('CPE'),...W},w):[0,0];return [R0+R1/d+zw[0],-w*R1*R1*C1/d+zw[1]];}
function renderEISForm(){const vs=$('#eis-v'),is=$('#eis-i'),par=$('#eis-par');if(!vs)return;const chans=scope.channels(),m=S.tutMeta?.eis;
 const opt=(sel,list,pref)=>{const keep=sel.value;sel.innerHTML=list.map(([k,n])=>`<option value="${esc(k)}">${esc(n)}</option>`).join('');if(list.some(x=>x[0]===keep))sel.value=keep;else if(pref&&list.some(x=>x[0]===pref))sel.value=pref;};
 const all=[...new Set([...chans.map(c=>c.key),...(S.sim?S.sim.keys.filter(k=>k.startsWith('Y:')):[])])].map(k=>[k,chans.find(c=>c.key===k)?.label||chanLabel(k)]);
 opt(vs,all,m?.vKey);opt(is,all,m?.iKey);const ps=bfParams().map(([k,n])=>[k,n]);const pk=par.value;opt(par,ps,m?m.comp+'.'+m.param:'');
 if(m&&!$('#eis-from').value){$('#eis-from').value=m.from;$('#eis-to').value=m.to;$('#eis-ppd').value=m.ppd;$('#eis-settle').value=m.settle;$('#eis-per').value=m.periods;}}
async function runEIS(){if(EIS.run||!S.sim||S.error)return;const [comp,param]=String($('#eis-par').value).split('.'),vKey=$('#eis-v').value,iKey=$('#eis-i').value,out=$('#eis-out');
 const a=P.parseEng($('#eis-from').value),b=P.parseEng($('#eis-to').value),ppd=Math.max(1,Math.min(20,+$('#eis-ppd').value|0)),settle=Math.max(0,+$('#eis-settle').value||3),per=Math.max(1,+$('#eis-per').value|0||2);
 if(!comp||!vKey||!iKey||!(a>0)||!(b>a)){out.innerHTML='<p class="muted small">Διάλεξε τάση, ρεύμα, την παράμετρο της συχνότητας και εύρος.</p>';return;}
 const n=Math.max(2,Math.round(Math.log10(b/a)*ppd)+1),fs=[...Array(n).keys()].map(k=>a*Math.pow(b/a,k/(n-1))).reverse(),base=project();
 EIS.run=true;EIS.pts=[];EIS.meta={vKey,iKey,cell:S.tut?.id==='cell_eis'};$('#eis-run').disabled=true;$('#eis-stop').disabled=false;const t0=performance.now();
 try{for(const f of fs){if(!EIS.run)break;const r=MNA.eisPoint(base,{comp,param,f:+f.toPrecision(6),vKey:simKey(vKey),iKey:simKey(iKey),settle,periods:per,minSettle:S.tutMeta?.eis?.minSettle||0,hDiv:+$('#sim-step').value||50,method:$('#method').value});
   const z=Metrics.impedance(r);if(z.ok)EIS.pts.push(z);drawEIS(`${EIS.pts.length}/${n} · ${fmt((performance.now()-t0)/1e3,3)} s`);await new Promise(res=>setTimeout(res,0));}}
 catch(e){out.insertAdjacentHTML('beforeend',`<p class="warn-text small">${esc(e.message)}</p>`);}finally{EIS.run=false;$('#eis-run').disabled=false;$('#eis-stop').disabled=true;drawEIS(`${EIS.pts.length} συχνότητες · ${fmt((performance.now()-t0)/1e3,3)} s`);}}
function drawEIS(status){const out=$('#eis-out');if(!out||!EIS.pts.length)return;const pts=[...EIS.pts].sort((p,q)=>p.f-q.f),W=260,H=190,Pp=svgPlot(W,H,[34,6,6,22]),mo=EIS.meta.cell;
 const th=mo?pts.map(p=>({f:p.f,z:cellZ(p.f,false)})).filter(q=>q.z):[];const fine=mo?[...Array(60).keys()].map(k=>{const f=pts[0].f*Math.pow(pts[pts.length-1].f/pts[0].f,k/59);return cellZ(f,false);}).filter(Boolean):[];
 // Nyquist: −Im(Z) up, same scale on both axes
 const re=[...pts.map(p=>p.re),...fine.map(z=>z[0])],im=[...pts.map(p=>-p.im),...fine.map(z=>-z[1])];let x0=Math.min(...re),x1=Math.max(...re),y0=Math.min(0,...im),y1=Math.max(...im);const span=Math.max(x1-x0,y1-y0)*1.1||1;x0-=span*.05;x1=x0+span;y1=y0+span*(H-28)/(W-40);
 const ny=`<svg class="bfchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Διάγραμμα Nyquist">${PlotCore.svgFrame({W,H,x:[x0,x1],y:[y0,y1],xUnit:'Ω',yUnit:'Ω'}).svg}${fine.length?`<path class="map" d="M${fine.map(z=>`${Pp.X(z[0],x0,x1).toFixed(1)},${Pp.Y(-z[1],y0,y1).toFixed(1)}`).join(' L')}"/>`:''}
  ${pts.map(p=>`<circle cx="${Pp.X(p.re,x0,x1).toFixed(1)}" cy="${Pp.Y(-p.im,y0,y1).toFixed(1)}" r="2.2"><title>${eng(p.f,'Hz')}: ${eng(p.re,'Ω')} − j${eng(-p.im,'Ω')}</title></circle>`).join('')}
  <text x="${(W+34)/2}" y="${H-1}" text-anchor="middle">Re Z</text><text x="6" y="${H/2}" transform="rotate(-90 6 ${H/2})" text-anchor="middle">−Im Z</text></svg>`;
 // Bode: |Z| and phase against log f
 const lf=pts.map(p=>Math.log10(p.f)),la=Math.min(...lf),lb=Math.max(...lf)+1e-9,mags=pts.map(p=>p.mag),ma=Math.min(...mags),mb=Math.max(...mags),phs=pts.map(p=>p.phase),pa=Math.min(...phs,0),pb=Math.max(...phs,0);
 const bo=`<svg class="bfchart" viewBox="0 0 ${W} 120" role="img" aria-label="Διάγραμμα Bode">${PlotCore.svgFrame({W,H:120,ml:34,mr:6,mt:10,mb:22,x:[pts[0].f,pts[pts.length-1].f*(1+1e-9)],xlog:true,xUnit:'Hz',y:[ma,mb>ma?mb:ma+1],yUnit:'Ω'}).svg}
  <path class="map" d="M${pts.map((p,k)=>`${(34+(W-40)*(lf[k]-la)/(lb-la)).toFixed(1)},${(98-88*(p.mag-ma)/((mb-ma)||1)).toFixed(1)}`).join(' L')}"/>
  <path class="cob" d="M${pts.map((p,k)=>`${(34+(W-40)*(lf[k]-la)/(lb-la)).toFixed(1)},${(98-88*(p.phase-pa)/((pb-pa)||1)).toFixed(1)}`).join(' L')}"/>
  <text x="${(W+34)/2}" y="8" text-anchor="middle">|Z| κόκκινο, φάση πράσινο (${fmt(pa,3)}° … ${fmt(pb,3)}°)</text></svg>`;
 const rows=pts.map(p=>{const z=th.find(q=>q.f===p.f)?.z;const e=z?100*Math.hypot(p.re-z[0],p.im-z[1])/Math.hypot(z[0],z[1]):NaN;return `<tr><td>${eng(p.f,'Hz',3)}</td><td>${eng(p.mag,'Ω',4)}</td><td>${fmt(p.phase,3)}°</td>${mo?`<td>${z?eng(Math.hypot(...z),'Ω',4):''}</td><td>${Number.isFinite(e)?fmt(e,2)+' %':''}</td>`:''}</tr>`;}).join('');
 out.innerHTML=ny+bo+`<p class="muted small">${esc(status)} · Z = V₁/I₁ στη θεμελιώδη, από μέσες τιμές ανά περίοδο μεταγωγής, με αφαίρεση γραμμικής ολίσθησης${mo?' · καμπύλη: θεωρητικό Z του μοντέλου της κυψέλης':''}</p>
  <table class="kv ff-top"><tbody><tr><td>f</td><td>|Z|</td><td>φάση</td>${mo?'<td>|Z| θεωρία</td><td>διαφορά</td>':''}</tr>${rows}</tbody></table>`;}

// ------------------------------------------------------------------ Poincaré map and bifurcation diagram (3.2)
// one sample per period of a channel: the value at the period boundary (e.g. the current at the clock) or min/max/mean
function perSamples(key,stat,n=400){const s=S.sim;const k=simKey(key);const i=k===null?undefined:s?.chIndex.get(k);if(i===undefined)return [];const p=s.per,a=p[stat]||p.end,out=[];
 for(let q=Math.min(n,p.n);q>=1;q--){const j=(p.head-q+p.cap)%p.cap;out.push(a[j*p.nch+i]);}return out;}
function periodText(q){return Number.isNaN(q.period)?'λίγες περίοδοι':q.period===0?'χωρίς περίοδο ≤ 16T (χαοτική ή ακόμη μεταβατική)':q.period+'T'+(q.period>1?' (υποαρμονική)':'');}
const svgPlot=(W,H,pad)=>{const [l,r,t,b]=pad;return {X:(v,lo,hi)=>l+(W-l-r)*(v-lo)/(hi-lo||1),Y:(v,lo,hi)=>H-b-(H-t-b)*(v-lo)/(hi-lo||1)};};
// ideal return map of the current-mode buck with a battery: two straight branches (reset inside the period, or none)
function pcmMapFn(m){if(!paramsOf('V1')||!paramsOf('VO')||!paramsOf('L1'))return null;const vl=m.mode==='valley',ic=+(editor.comp('IC')?.params.v??m.ic),Vin=+paramsOf('V1').V,Vo=+paramsOf('VO').V,L=+paramsOf('L1').L,R=paramsOf('RMP1'),T=m.T;
 const m1=(Vin-Vo)/L,m2=Vo/L,ma=R?(+R.hi-+R.lo)/T:0;
 const z=v=>Math.max(0,v); // the diode stops the current at zero
 return vl?x=>{const t=(x-ic)/(m2+ma);return t>=T?z(x-m2*T):t<=0?x+m1*T:ic+ma*t+m1*(T-t);}   // valley: OFF from the clock until i_L = i_c + ramp
  :x=>{const t=(ic-x)/(m1+ma);return t>=T?x+m1*T:t<=0?z(x-m2*T):z(ic-ma*t-m2*(T-t));};}    // peak: ON from the clock until i_L + ramp = i_c
function renderPoincare(){const box=$('#bf-map');if(!box||!S.sim||!$('#bf-block').open)return;if(!BF.run)renderBifurcationForm();
 const sig=$('#bf-sig'),chans=scope.channels(),keep=sig.value;sig.innerHTML=chans.map(c=>`<option value="${esc(c.key)}">${esc(c.label)}</option>`).join('')||'<option value="">— πρόσθεσε σήμα στο scope —</option>';
 if(chans.some(c=>c.key===keep))sig.value=keep;else if(S.tutMeta?.poincare&&chans.some(c=>c.key===S.tutMeta.poincare.key))sig.value=S.tutMeta.poincare.key;
 const key=sig.value;if(!key){box.innerHTML='';return;}const x=perSamples(key,$('#bf-stat').value,300);if(x.length<8){box.innerHTML='<p class="muted small">Τρέξε την προσομοίωση μερικές περιόδους.</p>';return;}
 const q=Metrics.periodicity(x.slice(-100)),u=MeasureUnit(key),W=260,H=200,P=svgPlot(W,H,[34,6,6,22]);let lo=Math.min(...x),hi=Math.max(...x);const pd=(hi-lo)*.08||Math.abs(hi)*.02||1;lo-=pd;hi+=pd;
 const fn=S.tutMeta?.map==='pcm'&&S.tut?.id==='peak_cm'&&key==='Y:AM1'&&$('#bf-stat').value==='end'?pcmMapFn(S.tutMeta):null;
 const pts=x.slice(1).map((v,k)=>`<circle cx="${P.X(x[k],lo,hi).toFixed(1)}" cy="${P.Y(v,lo,hi).toFixed(1)}" r="1.6"/>`).join('');
 const cob=x.slice(-17);let cw=`M${P.X(cob[0],lo,hi).toFixed(1)},${P.Y(cob[0],lo,hi).toFixed(1)}`;for(let k=1;k<cob.length;k++)cw+=` V${P.Y(cob[k],lo,hi).toFixed(1)} H${P.X(cob[k],lo,hi).toFixed(1)}`;
 let curve='';if(fn){const n=120;curve='M'+[...Array(n+1).keys()].map(k=>{const v=lo+(hi-lo)*k/n;return `${P.X(v,lo,hi).toFixed(1)},${P.Y(fn(v),lo,hi).toFixed(1)}`;}).join(' L');}
 const tk='';const FR=PlotCore.svgFrame({W,H,x:[lo,hi],y:[lo,hi],xUnit:u,yUnit:u}).svg; // 4.22 (§63 part 2): the ticks of the core
 box.innerHTML=`<svg class="bfchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Χάρτης Poincaré">${FR}
  <line class="diag" x1="${P.X(lo,lo,hi)}" y1="${P.Y(lo,lo,hi)}" x2="${P.X(hi,lo,hi)}" y2="${P.Y(hi,lo,hi)}"/>${curve?`<path class="map" d="${curve}"/>`:''}<path class="cob" d="${cw}"/>${pts}${tk}
  <text x="${(W+34)/2}" y="${H-1}" text-anchor="middle">x[n]</text><text x="8" y="${H/2}" transform="rotate(-90 8 ${H/2})" text-anchor="middle">x[n+1]</text></svg>
  <p class="small">Περίοδος: <b>${esc(periodText(q))}</b>${q.period>0?` · τιμές ${q.distinct.map(v=>eng(v,u,4)).join(', ')}`:''}</p>
  <p class="muted small">Κάθε σημείο: το δείγμα μιας περιόδου (οριζόντια) και της επόμενης (κάθετα). Σταθερό σημείο πάνω στη διαγώνιο = λειτουργία 1T. Η σκάλα (cobweb) δείχνει τις τελευταίες 16 περιόδους.${fn?' Η καμπύλη είναι ο ιδανικός χάρτης: η κλίση του στο σταθερό σημείο είναι το λ.':''}</p>`;}
const BF={run:false,pts:[]};
function bfParams(){const out=[];for(const c of editor.doc.components){const d=P.PARTS[c.type];if(!d?.params)continue;const p={...P.defaults(c.type),...c.params};
  for(const sp of d.params){if(sp.show&&!sp.show(p))continue;const v=+p[sp.k];if((sp.type==='num'||(c.type==='CONST'&&sp.k==='v'))&&Number.isFinite(v))out.push([c.id+'.'+sp.k,`${c.label||c.id}: ${sp.label}${sp.unit?' ('+sp.unit+')':''}`,v]);}}return out;}
function renderBifurcationForm(){const sel=$('#bf-par');if(!sel)return;const ps=bfParams(),keep=sel.value,sw=S.tutMeta?.sweep;
 sel.innerHTML=ps.map(([k,n])=>`<option value="${esc(k)}">${esc(n)}</option>`).join('');const pref=sw?sw.comp+'.'+sw.param:'';
 if(ps.some(p=>p[0]===keep))sel.value=keep;else if(ps.some(p=>p[0]===pref)){sel.value=pref;$('#bf-from').value=sw.from;$('#bf-to').value=sw.to;$('#bf-n').value=sw.n;$('#bf-tr').value=sw.transient;$('#bf-rec').value=sw.record;if(sw.stat)$('#bf-stat').value=sw.stat;}
 else if(ps.length&&!$('#bf-from').value){const v=ps[0][2];$('#bf-from').value=+(v*.5).toPrecision(4);$('#bf-to').value=+(v*1.5).toPrecision(4);}}
// 3.15: one value = Scenario.bifPoint, the same as pcl's bifurcation (ROADMAP §30); in parallel on the pool of solver workers,
// or in order when the circuit has a Python block or workers are not available
async function runBifurcation(){if(BF.run||!S.sim||S.error)return;const [comp,param]=String($('#bf-par').value).split('.');const key=$('#bf-sig').value,stat=$('#bf-stat').value;
 const a=P.parseEng($('#bf-from').value),b=P.parseEng($('#bf-to').value),n=Math.max(2,Math.min(400,+$('#bf-n').value|0)),tr=Math.max(0,+$('#bf-tr').value|0),rec=Math.max(4,Math.min(400,+$('#bf-rec').value|0));
 const out=$('#bf-out');if(!comp||!key||!Number.isFinite(a)||!Number.isFinite(b)){out.innerHTML='<p class="muted small">Διάλεξε σήμα, παράμετρο και εύρος.</p>';return;}
 const base=project();BF.run=true;BF.pts=[];BF.meta={comp,param,key,stat,a,b,label:$('#bf-par').selectedOptions[0]?.textContent||param,u:MeasureUnit(key)};$('#bf-run').disabled=true;$('#bf-stop').disabled=false;const t0=performance.now();
 const spec={comp,param,key,stat,transient:tr,record:rec,hDiv:+$('#sim-step').value||100,method:$('#method').value};
 const vals=Array.from({length:n},(_,k)=>a+(b-a)*k/(n-1)),add=(v,r)=>BF.pts.push({v,y:r.y,q:Metrics.periodicity(r.y)});
 const par=window.Pool&&window.Worker&&n>2;let lastDraw=0;BF.par=par?(BF.pool||(BF.pool=new Pool.SimPool())).n:1;
 try{
  if(par){const got=new Array(n);
   await BF.pool.map(vals.map(v=>({action:'bifurcation',project:base,...spec,hdiv:spec.hDiv,values:[v]})),(i,o)=>{got[i]=o.points[0];
     BF.pts=[];got.forEach((r,k)=>{if(r)add(vals[k],r);});const now=performance.now();if(now-lastDraw>150){lastDraw=now;drawBifurcation(`${BF.pts.length}/${n} · ${fmt((now-t0)/1e3,3)} s · ${BF.par} workers`);}});}
  else for(let k=0;k<n&&BF.run;k++){const v=vals[k];add(v,Scenario.bifPoint(base,{...spec,value:+v.toPrecision(10)}));if(k%2===1||k===n-1){drawBifurcation(`${k+1}/${n} · ${fmt((performance.now()-t0)/1e3,3)} s`);await new Promise(res=>setTimeout(res,0));}}}
 catch(e){if(BF.run)out.innerHTML=`<p class="warn-text small">${esc(e.message)}</p>`;}
 finally{BF.run=false;$('#bf-run').disabled=false;$('#bf-stop').disabled=true;drawBifurcation(`${BF.pts.length} σημεία · ${fmt((performance.now()-t0)/1e3,3)} s${BF.par>1?` · ${BF.par} workers`:''}`);}}
function stopBifurcation(){BF.run=false;if(BF.pool)BF.pool.stop();}
function drawBifurcation(status){const out=$('#bf-out'),m=BF.meta;if(!out||!m||!BF.pts.length)return;const W=260,H=200,P=svgPlot(W,H,[34,6,6,22]);
 const ys=BF.pts.flatMap(p=>p.y);let lo=Math.min(...ys),hi=Math.max(...ys);const pd=(hi-lo)*.05||1;lo-=pd;hi+=pd;
 const dots=BF.pts.map(p=>p.y.map(y=>`<circle cx="${P.X(p.v,m.a,m.b).toFixed(1)}" cy="${P.Y(y,lo,hi).toFixed(1)}" r="1"/>`).join('')).join('');
 // first value of each new period (1T → 2T → 4T …) along the sweep
 const ch=[];for(let k=1;k<BF.pts.length;k++){const p0=BF.pts[k-1].q.period,p1=BF.pts[k].q.period;if(p1!==p0&&p1!==0||p1===0&&p0>0)ch.push([BF.pts[k].v,p1]);}
 const tk=PlotCore.svgFrame({W,H,x:[m.a,m.b],y:[lo,hi],xPlain:true,yPlain:true}).svg; // 4.22 (§63 part 2): the ticks of the core
 out.innerHTML=`<svg class="bfchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Διάγραμμα διακλάδωσης">${tk}${dots}<text x="${(W+34)/2}" y="${H-1}" text-anchor="middle">${esc(m.label)}</text></svg>
  <p class="muted small">${esc(status)} · ${BF.pts[0].y.length} δείγματα ανά τιμή μετά από μεταβατικό</p>
  ${ch.length?`<table class="kv"><tbody>${ch.map(([v,p])=>`<tr><td>από ${fmt(v,4)}</td><td>${p===0?'χωρίς περίοδο (χάος ή αργό μεταβατικό)':p+'T'}</td></tr>`).join('')}</tbody></table>`:''}`;}

function niceTop(v){const e=Math.pow(10,Math.floor(Math.log10(v))),m=v/e;return (m<=1?1:m<=2?2:m<=5?5:10)*e;}

// ------------------------------------------------------------------ server reference solver (SciPy)
function btStatus(text,kind=''){const el=$('#bt-status');el.innerHTML=text;el.className='bt-status '+kind;}
function parseStep(v){v=String(v||'').trim();if(!v)return 0;const m=v.match(/^T\s*\/\s*([\d.]+)$/i);if(m&&S.sim)return S.sim.T/+m[1];const x=P.parseEng(v);return Number.isFinite(x)&&x>0?x:NaN;}
async function runBatch(){
 if(!S.sim||S.error){btStatus('Το κύκλωμα δεν προσομοιώνεται.','err');return;}
 const keys=scope.channels().map(c=>c.key);if(!keys.length){btStatus('Πρόσθεσε πρώτα σήματα στο scope: αυτά θα υπολογίσει ο server.','err');return;}
 const tv=P.parseEng($('#bt-tend').value),tEnd=Number.isFinite(tv)&&tv>0?tv*1e-3:(S.sim.t>0?S.sim.t:S.stopT);
 if(!(tEnd>0)){btStatus('Δώσε διάρκεια ή τρέξε πρώτα την προσομοίωση: η σύγκριση γίνεται στο ίδιο διάστημα.','err');return;}
 const hmax=parseStep($('#bt-hmax').value);if(Number.isNaN(hmax)){btStatus('Μέγιστο βήμα: τιμή σε s (π.χ. 1u) ή «T/100».','err');return;}
 let req;try{req=MNA.exportForBatch(fullDoc(),keys);}catch(e){btStatus(esc(e.message),'err');return;}
 const method=$('#bt-method').value,rtol=P.parseEng($('#bt-rtol').value),atol=P.parseEng($('#bt-atol').value);
 $('#bt-run').disabled=true;btStatus(`Ο ${esc(method)} τρέχει στον server έως ${eng(tEnd,'s')}…`);const w0=performance.now();
 try{const r=await api('batch_sim',{net:req.net,channels:req.channels,t_end:tEnd,method,rtol:Number.isFinite(rtol)?rtol:1e-6,atol:Number.isFinite(atol)?atol:1e-9,max_step:hmax||0,max_points:30000});
  const data={};for(const k of Object.keys(r.ch))data[k]={t:Float64Array.from(r.t),y:Float64Array.from(r.ch[k],v=>v===null?NaN:v)};
  S.batch={r,data,skipped:req.skipped,label:`${method} (server, rtol ${eng(r.rtol)})`,stale:false};S.batchDiag=(r.diag||[]).map(d=>({...d,src:'server'}));renderDiag();
  scope.setRefs($('#bt-show').checked?{label:S.batch.label,data}:null);renderBatch();
  const st=r.stats;btStatus(`${r.status==='ok'?'✓':'⚠'} ${esc(method)}: ${st.points.toLocaleString('el-GR')} σημεία, ${st.segments.toLocaleString('el-GR')} τμήματα, ${st.diode_events.toLocaleString('el-GR')} μεταγωγές διόδων, ${st.nfev.toLocaleString('el-GR')} f, ${st.njev} J, ${st.nlu.toLocaleString('el-GR')} LU · ${fmt(st.wall_s,3)} s στον server (${fmt((performance.now()-w0)/1000,3)} s συνολικά)${r.message?'<br>'+esc(r.message):''}${req.skipped.length?'<br>Χωρίς αναφορά: '+req.skipped.map(esc).join(', '):''}`,r.status==='ok'?'':'err');}
 catch(e){btStatus('Σφάλμα: '+esc(e.message),'err');S.batchDiag=[{sev:'error',grp:'server',src:'server',id:null,msg:e.message,fix:''}];renderDiag();openDiag();}
 finally{$('#bt-run').disabled=false;}}
function clearBatch(){S.batch=null;scope.setRefs(S.csvRef||null);$('#bt-out').innerHTML='';btStatus('');}
// time-weighted mean of a piecewise-linear trace over exactly [a,b]
function meanPL(t,y,a,b){let s=0,pt=null,pv=0;const at=x=>{let lo=0,hi=t.length-1;if(x<=t[0])return y[0];if(x>=t[hi])return y[hi];while(hi-lo>1){const m=(lo+hi)>>1;if(t[m]<=x)lo=m;else hi=m;}return t[hi]>t[lo]?y[lo]+(y[hi]-y[lo])*(x-t[lo])/(t[hi]-t[lo]):y[hi];};
 pt=a;pv=at(a);for(let i=0;i<t.length;i++){if(t[i]<=a)continue;if(t[i]>=b)break;s+=(t[i]-pt)*(pv+y[i])/2;pt=t[i];pv=y[i];}s+=(b-pt)*(pv+at(b))/2;return b>a?s/(b-a):NaN;}
function ringTrace(ci){const r=S.sim.ring,st=(r.head-r.n+r.cap)%r.cap,t=new Float64Array(r.n),y=new Float64Array(r.n);for(let i=0;i<r.n;i++){const j=(st+i)%r.cap;t[i]=r.t[j];y[i]=ci===-2?0:r.d[j*r.nch+ci];}return {t,y};}
// difference table between reference traces {key:{t,y}} (server solver or CSV) and the browser run
function compareHTML(data,label,note){if(!S.sim)return '';const T=S.sim.T;const rows=[];let common=null;
 for(const ch of scope.channels()){const d=data[ch.key];if(!d||d.t.length<2)continue;const ci=scope.resolve(ch.key);if(ci===-1)continue;const js=ringTrace(ci);if(js.t.length<2)continue;
  const a=Math.max(d.t[0],js.t[0]),b=Math.min(d.t[d.t.length-1],js.t[js.t.length-1]);if(!(b>a))continue;common=common?[Math.min(common[0],a),Math.max(common[1],b)]:[a,b];
  const a1=Math.max(a,b-T);const mb=meanPL(d.t,d.y,a1,b),mj=meanPL(js.t,js.y,a1,b);
  const diffs=[];let sq=0,n=0,scale=0;for(let i=0;i<d.t.length;i++){const t=d.t[i];if(t<a||t>b||!Number.isFinite(d.y[i]))continue;const e=scope.valueAt(ci,t)-d.y[i];if(!Number.isFinite(e))continue;diffs.push(Math.abs(e));sq+=e*e;n++;scale=Math.max(scale,Math.abs(d.y[i]));}
  diffs.sort((x,y)=>x-y);const p95=diffs.length?diffs[Math.floor(.95*(diffs.length-1))]:NaN,u=MeasureUnit(ch.key);
  const dp=Number.isFinite(mb)&&Math.abs(mb)>1e-12*Math.max(scale,1)?100*(mj-mb)/Math.abs(mb):NaN;
  rows.push(`<tr><td><i class="dot" style="background:${ch.color}"></i>${esc(ch.label)}</td><td>${eng(mb,u)}</td><td>${eng(mj,u)}</td><td class="${Math.abs(dp)<.1?'good':Math.abs(dp)<1?'':'warn-text'}">${Number.isFinite(dp)?fmt(dp,3)+' %':'—'}</td><td>${eng(Math.sqrt(sq/Math.max(n,1)),u)}</td><td>${eng(p95,u)}</td><td>${fmt(100*Math.sqrt(sq/Math.max(n,1))/Math.max(scale,1e-12),3)} %</td></tr>`);}
 return rows.length?`<h4>Σύγκριση με ${esc(label)}</h4><div class="wrap"><table><thead><tr><th>Σήμα</th><th>⟨αναφορά⟩ τελ. T</th><th>⟨browser⟩ τελ. T</th><th>Διαφορά</th><th>RMS Δ</th><th>95 % |Δ|</th><th>RMS Δ / max</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>
  <p class="muted small">Κοινό διάστημα ${eng(common[0],'s')} … ${eng(common[1],'s')}. ${note||''}</p>`:'';}
function renderBatch(){const box=$('#bt-out');const B=S.batch;if(!B||!S.sim){box.innerHTML='';return;}const r=B.r;
 const html=compareHTML(B.data,B.label,`Ο browser λύνει με ${S.sim.var?`μεταβλητό βήμα (ανοχή ${S.sim.rtol}, ${eng(S.sim.hMin,'s')} … ${eng(S.sim.hCap||S.sim.hMax,'s')})`:`σταθερό βήμα Δt = ${eng(S.sim.h,'s')}`} (${esc($('#method').selectedOptions[0]?.textContent||'')}), ο server με μεταβλητό βήμα και έλεγχο σφάλματος. Κοντά στις μεταγωγές το |Δ| είναι μεγάλο αν οι δύο λύτες βρίσκουν την ακμή σε λίγο διαφορετική στιγμή· γι' αυτό δίνεται το RMS και το 95 %.${B.stale?' <b>Το κύκλωμα άλλαξε μετά τον υπολογισμό.</b>':''}`);
 box.innerHTML=(html||`<p class="muted small">Δεν υπάρχει κοινό διάστημα με την προσομοίωση του browser: τρέξε την προσομοίωση έως ${eng(r.t_end,'s')} (⏩).</p>`)+sampleCompareHTML(r);}
// ------------------------------------------------------------------ CSV reference (PLECS, measurements, older runs)
// first column time, one signal per column, optional header row; ',' ';' or tab separated
function parseCSV(text){const lines=String(text).split(/\r?\n/).filter(l=>l.trim());if(lines.length<2)throw Error('Το αρχείο έχει λιγότερες από δύο γραμμές.');
 const head=lines[0],sep=[';','\t',','].map(c=>[c,head.split(c).length]).sort((a,b)=>b[1]-a[1])[0][0];
 const cells=l=>l.split(sep).map(x=>x.trim().replace(/^"(.*)"$/,'$1'));const comma=sep!==',';
 const num=x=>{if(x==='')return NaN;const v=Number(comma?x.replace(',','.'):x);return v;};
 const first=cells(lines[0]),hasHead=first.some(x=>x!==''&&!Number.isFinite(num(x)));
 const names=hasHead?first.map(x=>x.replace(/\s*\[[^\]]*\]\s*$/,'')):first.map((_,i)=>i?'στήλη '+i:'time');
 const body=lines.slice(hasHead?1:0).map(cells).filter(r=>Number.isFinite(num(r[0])));if(body.length<2)throw Error('Δεν βρέθηκαν αριθμητικές γραμμές.');
 const nc=names.length,t=Float64Array.from(body,r=>num(r[0]));for(let i=1;i<t.length;i++)if(!(t[i]>=t[i-1]))throw Error(`Ο χρόνος δεν αυξάνει στη γραμμή ${i+1+(hasHead?1:0)}.`);
 const cols=[];for(let c=1;c<nc;c++)cols.push(Float64Array.from(body,r=>num(r[c])));return {names:names.slice(1),t,cols};}
const normName=x=>String(x||'').toLowerCase().replace(/\[[^\]]*\]/g,'').replace(/[^a-z0-9α-ωάέήίόύώϊϋΐΰ]+/g,'');
function renderCsvMap(){const box=$('#cr-map'),C=S.csv;if(!C){box.innerHTML='';return;}const ch=scope.channels();
 const auto=nm=>{const n=normName(nm);return ch.find(c=>normName(c.label)===n||normName(c.key)===n)?.key||'';};
 box.innerHTML=`<table class="cr-table"><thead><tr><th>Στήλη CSV</th><th>Σήμα του scope</th></tr></thead><tbody>${C.names.map((nm,i)=>{const sel=C.map?.[i]??auto(nm);
  return `<tr><td>${esc(nm)}</td><td><select data-crmap="${i}"><option value="">—</option>${ch.map(c=>`<option value="${esc(c.key)}" ${c.key===sel?'selected':''}>${esc(c.label)}</option>`).join('')}</select></td></tr>`;}).join('')}</tbody></table>
  <div class="row-btns"><button id="cr-apply" class="strong">Εφαρμογή</button></div>`;
 C.map=C.names.map((nm,i)=>C.map?.[i]??auto(nm));
 $$('#cr-map [data-crmap]').forEach(el=>el.onchange=()=>{C.map[+el.dataset.crmap]=el.value;});$('#cr-apply').onclick=applyCsv;}
function applyCsv(){const C=S.csv;if(!C)return;const sh=(P.parseEng($('#cr-shift').value)||0)*1e-3,sc=+$('#cr-tscale').value||1;const data={};let n=0;
 C.map.forEach((key,i)=>{if(!key)return;data[key]={t:Float64Array.from(C.t,x=>x*sc+sh),y:C.cols[i]};n++;});
 if(!n){$('#cr-status').innerHTML='Αντιστοίχισε τουλάχιστον μία στήλη σε σήμα του scope.';$('#cr-status').className='bt-status err';return;}
 S.csvRef={label:'CSV · '+C.file,data};scope.setRefs(S.csvRef);renderCsv();
 $('#cr-status').innerHTML=`✓ ${n} ${n===1?'σήμα':'σήματα'} από ${C.t.length.toLocaleString('el-GR')} γραμμές (${eng(C.t[0]*sc+sh,'s')} … ${eng(C.t[C.t.length-1]*sc+sh,'s')}).`;$('#cr-status').className='bt-status';}
function renderCsv(){const box=$('#cr-out');if(!box)return;const R=S.csvRef;if(!R||!S.sim){box.innerHTML='';return;}
 box.innerHTML=compareHTML(R.data,R.label,'Η αναφορά από το CSV σχεδιάζεται διακεκομμένη. Για σύγκριση με PLECS χρησιμοποίησε ίδιες παραμέτρους, αρχικές συνθήκες και πρόσημα ρευμάτων.')||'<p class="muted small">Δεν υπάρχει κοινό διάστημα με την προσομοίωση: τρέξε την προσομοίωση στο διάστημα του CSV.</p>';}
function clearCsv(){S.csv=null;S.csvRef=null;scope.setRefs(S.batch&&$('#bt-show').checked?{label:S.batch.label,data:S.batch.data}:null);$('#cr-map').innerHTML='';$('#cr-out').innerHTML='';$('#cr-status').innerHTML='';}
// Sample & Hold: the same sampling instants and values in both solvers (event-level check)
function sampleCompareHTML(r){const out=[];for(const [id,sv] of Object.entries(r.samples||{})){const js=S.sim.samples(id);if(!js)continue;const tEnd=Math.min(r.t_end,S.sim.t)+1e-12;
  const a=sv.t.map((t,i)=>[t,sv.v[i]]).filter(x=>x[0]<=tEnd),b=js.t.map((t,i)=>[t,js.v[i]]).filter(x=>x[0]<=tEnd&&x[0]>=(js.t[0]??0));
  const off=b.length&&a.length?a.findIndex(x=>Math.abs(x[0]-b[0][0])<1e-9*S.sim.T+1e-15):-1;const A=off>=0?a.slice(off):a,n=Math.min(A.length,b.length);let dt=0,dv=0,sc=0;
  for(let i=0;i<n;i++){dt=Math.max(dt,Math.abs(A[i][0]-b[i][0]));if(Number.isFinite(A[i][1])&&Number.isFinite(b[i][1])){dv=Math.max(dv,Math.abs(A[i][1]-b[i][1]));sc=Math.max(sc,Math.abs(A[i][1]));}}
  const u=S.sim.shById.get(id)?.qty==='V'?'V':'A';
  out.push(`<tr><td>${esc(editor.comp(id)?.label||id)}</td><td>${a.length}</td><td>${b.length}${off>0?` (από το #${off+1})`:''}</td><td>${eng(dt,'s')}</td><td>${eng(dv,u)}</td><td>${sc?fmt(100*dv/sc,3)+' %':'—'}</td></tr>`);}
 return out.length?`<h4>Δείγματα S&H</h4><div class="wrap"><table><thead><tr><th>Μπλοκ</th><th>δείγματα server</th><th>δείγματα browser</th><th>max |Δt|</th><th>max |Δ τιμής|</th><th>/ max</th></tr></thead><tbody>${out.join('')}</tbody></table></div><p class="muted small">Ίδιες στιγμές δειγματοληψίας (από το φέρον) και ίδια τιμή του ρεύματος τη στιγμή του δείγματος στους δύο λύτες.</p>`:'';}

// ------------------------------------------------------------------ live parameters (panel over the scope)
// They change the running simulation without a pause: D, m, α and the PI reference at the next step,
// the carrier phase from the next carrier period, the sampling rule from the next trigger. Every
// change is kept with its simulation time, drawn on the scope, and D / reference changes can be
// turned into a t:value program, so pressing ⟲ replays the same run.
// 3.19: only changes at the same instant merge, so a session written as a program replays bit for bit
// 4.17: the gains of a PWM in PI/PID mode as the solver uses them: hand-set, or from the circuit (tune.js, the design of
// the last build of the netlist), with the converter, the margins and the elements of the list of roles
function pwmGainsText(c,p){const k=S.sim?.net?.ctrls?.find(q=>q.id===c.id),d=k?.design;
 if(p.gain!=='auto')return `K_p = ${eng(+p.Kp)}, K_i = ${eng(+p.Ki)}${+p.Kd?`, K_d = ${eng(+p.Kd)}`:''}.`;
 if(!d)return 'Κέρδη από το κύκλωμα: δεν υπολογίστηκαν (δες τις προειδοποιήσεις).';
 const R=Object.entries(d.roles).filter(([r])=>r!=='S'&&r!=='D').map(([r,id])=>`${r} = ${esc(editor.comp(id)?.label||id)}`).join(', ');
 return `Από το κύκλωμα (${esc(d.name)}, ${R}): K_p = ${eng(k.Kp)}, K_i = ${eng(k.Ki)}${k.Kd?`, K_d = ${eng(k.Kd)}`:''}, D₀ = ${fmt(d.D0,4)}· f_c = ${eng(d.fc,'Hz')}, περιθώριο φάσης ${fmt(d.pm,3)}°${Number.isFinite(d.gm)?`, κέρδους ${fmt(20*Math.log10(d.gm),3)} dB`:''}.`;}
// 4.17.1 (§59): the inputs of the circuit. A parameter marked «Είσοδος» (c.inp, with c.inpName and c.inpDesc) or a CONST
// with «Είσοδος»; their list and values, and the parameters «= …», come from the last build of the netlist (inputs.js)
function toggleInput(id,k){const c=editor.comp(id);if(!c)return;editor.remember('inp:'+id+':'+k);const L=new Set(c.inp||[]);
 if(L.has(k)){L.delete(k);if(c.inpName)delete c.inpName[k];if(c.inpDesc)delete c.inpDesc[k];}else L.add(k);
 if(L.size)c.inp=[...L];else{delete c.inp;delete c.inpName;delete c.inpDesc;}editor.changed('param');saveLocal();renderProps();}
function setInputMeta(id,k,patch){const c=editor.comp(id);if(!c)return;editor.remember('inpm:'+id+':'+k+':'+Object.keys(patch).join(','));
 if(c.type==='CONST'&&k==='v'){for(const [q,v] of Object.entries(patch))c.params[q]=v;}
 else for(const [q,f] of [['name','inpName'],['desc','inpDesc']])if(patch[q]!==undefined){c[f]={...(c[f]||{}),[k]:patch[q]};if(!patch[q])delete c[f][k];if(!Object.keys(c[f]).length)delete c[f];}
 editor.changed('param');saveLocal();}
function inputsHTML(){const inf=S.sim?.net?.inputs,doc=editor.doc,L=window.Inputs?Inputs.list(doc):[];if(!L.length&&!(inf?.derived?.length))return '';
 const val=q=>inf?.inputs?.find(x=>x.id===q.id&&x.k===q.k)?.value;
 const rows=L.map(q=>{const v=val(q),key=esc(q.id+'|'+q.k),raw=q.raw===undefined?'':String(q.raw);
  return `<div class="prow inp-row"><span><input data-inname="${key}" value="${esc(q.name)}" style="width:7em" aria-label="Όνομα εισόδου"> <button data-focus="${esc(q.id)}" title="Στο σχέδιο">${esc(q.label)}</button></span>
   <span class="pin-in"><input data-inval="${key}" value="${esc(raw)}" style="width:8em" inputmode="decimal" aria-label="Τιμή">${q.unit?` <em>${esc(q.unit)}</em>`:''}${Inputs.isExpr(raw)&&Number.isFinite(v)?` <small>= ${esc(eng(v,q.unit))}</small>`:''}</span>
   <small><input data-indesc="${key}" value="${esc(q.desc)}" placeholder="εξήγηση" style="width:100%" aria-label="Εξήγηση"></small></div>`;}).join('');
 const der=(inf?.derived||[]).map(d=>{const c=editor.comp(d.id),def=c?partDef(c)?.params.find(x=>x.k===d.k):null;
  return `<li><button data-focus="${esc(d.id)}">${esc(c?.label||d.id)}</button> ${esc(def?.label||d.k)} = ${esc(d.expr)} = <b>${d.value==null?'—':esc(eng(d.value,def?.unit||''))}</b>${d.error?` <span class="bad">${esc(d.error)}</span>`:''}</li>`;}).join('');
 return psec('c-inputs','Είσοδοι του κυκλώματος',`${rows||'<p class="muted small">Καμία είσοδος. Σημείωσε μια παράμετρο με ⇥ στο πάνελ του στοιχείου, ή μια σταθερά (CONST) ως «Είσοδος».</p>'}
  ${der?`<h4>Παράμετροι από εκφράσεις</h4><ul class="diag-list">${der}</ul>`:''}<small class="muted">Μια παράμετρος που αρχίζει με «=» είναι έκφραση των εισόδων (π.χ. «= J_m + m*(r_w/n)^2»: + − * / ^, sqrt, exp, pi …) και υπολογίζεται σε κάθε αλλαγή. Τα μπλοκ έκφρασης βλέπουν τις εισόδους με το όνομά τους.</small>`,{def:true,cnt:L.length});}
function liveChange(id,k,v,label,from){const s=S.sim;if(!s||!(s.t>0))return;const L=s.changes||(s.changes=[]);const last=L[L.length-1];
 if(last&&last.id===id&&last.k===k&&s.t===last.t&&!window.Live?.active){last.v=v;last.label=label;}else s.markChange({id,k,v,label,from});renderLiveLog();if(!S.running)draw(true);}
function renderLiveLog(){const box=$('#lp-log');if(!box)return;const L=S.sim?.changes||[];
 if(!L.length){box.innerHTML='<small class="muted">Οι αλλαγές που κάνεις όσο τρέχει η προσομοίωση σημειώνονται στο scope.</small>';return;}
 const rep=L.some(c=>!c.prog||c.live);
 box.innerHTML=`<div class="lp-log-head"><b>${L.length} ${L.length===1?'αλλαγή':'αλλαγές'}</b>${rep?'<button id="lp-sched" title="Οι αλλαγές γίνονται πρόγραμμα t:τιμή (το D, η αναφορά και οι σταθερές στις παραμέτρους τους, οι υπόλοιπες στο πρόγραμμα του κυκλώματος): με ⟲ ξαναπαίζεται η ίδια προσομοίωση">→ πρόγραμμα t:τιμή</button>':''}</div>
  <ol>${L.slice(-5).map(c=>`<li><span>${eng(c.t,'s',4)}</span> ${esc(c.label)}</li>`).join('')}</ol>`;
 $('#lp-sched')?.addEventListener('click',changesToSchedule);}
// live changes → programs (3.19): D, the reference and a constant become their own t:value program as before; every
// other parameter (and every ramp) goes to the program of the circuit (project.program), which the solver applies at
// the same instants as a live change (Sim.progApply). The parameters start again from their value before the first change.
function changesToSchedule(){const L=(S.sim?.changes||[]).filter(c=>!c.prog||c.live);if(!L.length)return;const by=new Map();
 for(const c of L){const key=c.id+'|'+c.k;if(!by.has(key))by.set(key,[]);by.get(key).push(c);}
 const f=v=>typeof v==='number'?+(+v).toPrecision(8):v,prog=[...(editor.doc.program||[])],moved=[];
 for(const [key,list] of by){const [id,k]=key.split('|');const comp=editor.comp(id);if(!comp)continue;
  if(['D','ref','v'].includes(k)&&!list.some(c=>c.rate)){const base=(P.parseSched(list[0].from)||[]).filter(([t])=>t<list[0].t-1e-15);
   const pr=[...base,...list.map(c=>[c.t,c.v])].map(([t,v])=>`${+t.toPrecision(9)}:${f(v)}`).join(', ');
   editor.setParams(id,k==='D'?{dsched:pr,D:f((base.length?base:[[0,list[0].v]])[0][1])}:k==='v'?{v:pr}:{ref:pr});moved.push(id);continue;}
  for(const c of list)prog.push({t:c.t,id,k,v:c.v,...(c.rate?{rate:c.rate}:{})});
  const b=list[0].from;editor.setParams(id,{[k]:b===undefined?comp.params[k]:(typeof b==='string'&&Number.isFinite(P.parseEng(b))&&!b.includes(':')?P.parseEng(b):b)});moved.push(id);}
 if(prog.length!==(editor.doc.program||[]).length)editor.setProgram(prog.sort((a,b)=>a.t-b.t));
 notice('Οι αλλαγές έγιναν πρόγραμμα t:τιμή στο '+[...new Set(moved)].map(esc).join(', ')+'. Πάτα ⟲ για να ξαναπαίξει η ίδια προσομοίωση.','info');}
function updateLivePanel(){const s=S.sim;if(!s||$('#live-panel')?.hidden)return;
 for(const el of $$('#live-controls [data-shout]')){const q=s.shById.get(el.dataset.shout);if(!q){el.textContent='';continue;}const u=q.qty==='V'?'V':'A',lt=q.log.t[q.log.t.length-1];
  el.innerHTML=`h = <b>${eng(q.h,u,5)}</b> · ${q.n} δείγματα${Number.isFinite(lt)?` · τελευταίο ${eng(lt,'s',5)}`:''}`;}
 for(const el of $$('#live-controls [data-kout]')){const v=s.now('Y:'+el.dataset.kout);el.textContent=Number.isFinite(v)?eng(v,'',5):'';}
 for(const el of $$('#live-controls [data-dnow]')){const v=s.now('D:'+el.dataset.dnow);el.textContent=Number.isFinite(v)?'D = '+fmt(v,5):'';}}
function setLivePanel(show){const pnl=$('#live-panel'),btn=$('#lp-toggle');if(!pnl)return;pnl.hidden=!show;btn?.classList.toggle('on',show);btn?.setAttribute('aria-pressed',String(show));
 try{localStorage.setItem('pcl2-live-panel',show?'1':'0');}catch{}if(show)updateLivePanel();}
// switches driven by one PWM block, the main output (g) first
function switchesOf(pwmId){const o={a:0,na:1,b:2,nb:3};return editor.doc.components.filter(c=>(c.type==='SW'&&(c.params?.gate||'pwm')==='pwm'||c.type==='SCR'&&c.params?.fire==='pwm')&&c.params?.pwm===pwmId)
 .sort((x,y)=>(o[x.params.out||'a']??0)-(o[y.params.out||'a']??0)||x.id.localeCompare(y.id,undefined,{numeric:true}));}
// gate pulses to the scope, in a pane of their own (drawn as stacked lanes)
function addPulses(keys){if(!S.sim||!keys.length)return;const panes=scope.cfg.panes;let pi=panes.findIndex(p=>p.ch.length&&p.ch.every(ch=>Scope.isLogic(ch.key)));
 if(pi<0)pi=panes.length===1&&!panes[0].ch.length?0:Math.min(panes.length,11);let any=false;for(const k of keys)any=scope.addChannel(k,chanLabel(k),pi)||any;renderChannels();flash(any?'#scope-card':'#chan-list');draw(true);}
function pulseKeys(pwmId){const sw=switchesOf(pwmId);return sw.length?sw.map(c=>'GS:'+c.id):['G:'+pwmId];}
function refreshControls(){
 const box=$('#live-controls');if(!box)return;
 if(!atTop()){box.innerHTML='<div class="muted small">Μέσα σε υποκύκλωμα. Οι ζωντανές παράμετροι του κυκλώματος φαίνονται όταν βγεις (↑ στη γραμμή πάνω από το σχέδιο).</div>';renderLiveLog();updateLivePanel();return;}const pw=editor.doc.components.filter(c=>c.type==='PWM');const meta=S.tutMeta||{};
 const phase=(c,p)=>{if(p.mode==='spwm')return '';const ph=((+p.phase||0)%360+360)%360;
  return `<div class="ctl-sub"><label>φέρον ${p.carrier==='saw'&&p.mode!=='pp'?'πριονωτό':'τριγωνικό'} · φ <output data-phout="${c.id}">${fmt(ph,4)}° · ${eng(ph/360/(+p.fs||1),'s',3)}</output></label>
   <input type="range" min="0" max="360" step="1" value="${ph}" data-ph="${c.id}"><div class="ctl-btns">${[0,90,180,270].map(d=>`<button data-phset="${c.id}" data-val="${d}">${d}°</button>`).join('')}</div></div>`;};
 // several open-loop PWMs (e.g. interleaved legs): one D for all, and in-phase / shifted by k·T/N
 const fixedPw=pw.filter(c=>({...P.defaults('PWM'),...c.params}).mode==='fixed').sort((a,b)=>a.id.localeCompare(b.id,undefined,{numeric:true}));
 const phasePw=pw.filter(c=>({...P.defaults('PWM'),...c.params}).mode!=='spwm').sort((a,b)=>a.id.localeCompare(b.id,undefined,{numeric:true}));
 let group='';if(phasePw.length>=2){const p0={...P.defaults('PWM'),...(fixedPw[0]||phasePw[0]).params};
  group=`<div class="ctl ctl-group">${fixedPw.length>=2?`<label>Όλα τα PWM (${fixedPw.length}) · D <output data-dallout>${fmt(+p0.D,4)}</output></label><input type="range" min="0" max="1" step="0.0005" value="${+p0.D}" data-dall aria-label="Κοινό D">`:`<label>Όλα τα PWM (${phasePw.length}) · φάσεις</label>`}
   <div class="ctl-btns"><button data-ilv="common" title="Ίδια φάση σε όλα τα φέροντα">Συμφασικά</button><button data-ilv="shift" title="Το k-οστό φέρον καθυστερεί k·T/N">Μετατοπισμένα k·T/N</button></div><small>Η φάση κάθε φέροντος αλλάζει από την επόμενη περίοδό του.</small><div class="ctl-btns ctl-probe"><button data-pulse-all title="Ένας παλμός ανά PWM (η κύρια έξοδος g), ο καθένας στη δική του λωρίδα">⌁ παλμοί όλων (${phasePw.length})</button></div></div>`;}
 const per=pw.map(c=>{const p={...P.defaults('PWM'),...c.params};let h='';
  if(p.mode==='fixed'||p.mode==='pp')h=`<label>${esc(c.label||c.id)} · D <output data-dout="${c.id}">${fmt(+p.D,4)}</output></label><input type="range" min="0" max="1" step="0.0005" value="${+p.D}" data-d="${c.id}">
   <div class="ctl-btns"><button data-dd="${c.id}" data-step="-0.01">−0,01</button><button data-dd="${c.id}" data-step="-0.001">−0,001</button>${meta.D0!==undefined?`<button data-dset="${c.id}" data-val="${meta.D0}">D₀ = ${fmt(meta.D0,4)}</button>`:''}<button data-dd="${c.id}" data-step="0.001">+0,001</button><button data-dd="${c.id}" data-step="0.01">+0,01</button></div>${p.dsched?'<small>Υπάρχει πρόγραμμα D(t)· η χειροκίνητη αλλαγή το απενεργοποιεί.</small>':''}`;
  else if(p.mode==='pi')h=`<label>${esc(c.label||c.id)} · αναφορά ${p.gain==='auto'?(p.ctl==='pid'?'PID':'PI'):+p.Kd?'PID':'PI'} <output data-dnow="${c.id}"></output></label><div class="ctl-row"><input data-ref="${c.id}" value="${esc(p.ref)}"><button data-refapply="${c.id}">Εφαρμογή</button></div><small>Σταθερή τιμή ή πρόγραμμα «t:τιμή». ${pwmGainsText(c,p)}${editor.comp(p.sensor)?.type==='SH'?` Μετρά το δείγμα του ${esc(editor.comp(p.sensor).label||p.sensor)}.`:''}</small>`;
  else if(p.mode==='ext')h=`<label>${esc(c.label||c.id)} · D από σήμα <output data-dnow="${c.id}"></output></label><small>Ο λόγος κατάτμησης D έρχεται από τον ακροδέκτη d${p.upd==='double'&&p.carrier!=='saw'?' (δύο ενημερώσεις ανά T)':''}.</small>`;
  else if(p.mode==='spwm')h=`<label>${esc(c.label||c.id)} · m <output data-mout="${c.id}">${fmt(+p.m,3)}</output></label><input type="range" min="0" max="1.2" step="0.01" value="${+p.m}" data-m="${c.id}">`;
  const sw=switchesOf(c.id);const probe=`<div class="ctl-btns ctl-probe"><button data-probe-d="${c.id}" title="Ο λόγος κατάτμησης D στο scope">⌁ D</button><button data-pulse="${c.id}" title="${sw.length?'Ο παλμός πύλης κάθε διακόπτη: '+esc(sw.map(x=>x.label||x.id).join(', ')):'Ο παλμός g του PWM'}">⌁ παλμ${sw.length>1?'οί':'ός'} ${esc(sw.length?sw.map(x=>x.label||x.id).join(', '):'g')}</button></div>`;
  return `<div class="ctl">${h}${probe}${phase(c,p)}</div>`;}).join('');
 box.innerHTML=group+(pw.length>=3?`<details class="ctl-more"><summary>Ανά PWM (${pw.length})</summary>${per}</details>`:per);
 const trigOpts=P.PARTS.SH.params.find(d=>d.k==='trig').options;
 box.innerHTML+=editor.doc.components.filter(c=>c.type==='SH').map(c=>{const p={...P.defaults('SH'),...c.params};
  const short={start:'Αρχή περιόδου (reset ή μέγιστο) · 1/T',mid:'Μέσο περιόδου (ελάχιστο τριγώνου) · 1/T',both:'Και τα δύο ακρότατα · 2/T'};
  return `<div class="ctl ctl-sh"><label>${esc(c.label||c.id)} · S&H</label><select data-trig="${c.id}" aria-label="Πότε παίρνει δείγμα">${trigOpts.map(([k,n])=>`<option value="${k}" title="${esc(n)}" ${p.trig===k?'selected':''}>${esc(short[k]||n)}</option>`).join('')}</select><div class="lp-read" data-shout="${c.id}"></div></div>`;}).join('');
 // constants / programs of signal blocks: changed live, like the reference of the built-in PI
 box.innerHTML+=editor.doc.components.filter(c=>c.type==='CONST').sort((a,b)=>a.id.localeCompare(b.id,undefined,{numeric:true})).map(c=>{const p={...P.defaults('CONST'),...c.params};
  return `<div class="ctl"><label>${esc(c.label||c.id)} · σταθερά <output data-kout="${c.id}"></output></label><div class="ctl-row"><input data-kv="${c.id}" value="${esc(p.v)}"><button data-kapply="${c.id}">Εφαρμογή</button></div></div>`;}).join('');
 const scr=editor.doc.components.filter(c=>c.type==='SCR'&&(c.params?.fire||'alpha')==='alpha');
 if(scr.length){const a=+(scr[0].params?.alpha??30);box.innerHTML+=`<div class="ctl"><label>Θυρίστορ (${scr.length}) · α <output data-aout>${fmt(a,4)}°</output></label><input type="range" min="0" max="180" step="0.5" value="${a}" data-alpha><small>Ίδια γωνία έναυσης σε όλα· η μετατόπιση του καθενός μένει.</small></div>`;}
 // parameters pinned with 📌 in the parameters panel (3.7): a slider a decade each way around a base value, and the exact value
 const pinned=editor.doc.components.filter(c=>Array.isArray(c.live)&&c.live.length);
 box.innerHTML+=pinned.map(c=>c.live.map(k=>{const d=partDef(c)?.params.find(x=>x.k===k);if(!d||d.type!=='num')return '';const v=numOf(c.params[k]??d.def),m=pinMap(c,k),key=c.id+'|'+k;
  return `<div class="ctl ctl-pin"><label>${esc(c.label||c.id)} · ${esc(d.label)} <output data-pout="${esc(key)}">${eng(v,d.unit||'',4)}</output></label><input type="range" min="0" max="${PSL}" step="1" value="${pinX(m,v)}" data-pr="${esc(key)}" aria-label="${esc((c.label||c.id)+' '+d.label)}">
   <div class="ctl-row"><input data-pv="${esc(key)}" value="${esc(P.eng(v,'',6).replace(/\s/g,''))}" inputmode="decimal" aria-label="τιμή"><input class="prate" data-prate="${esc(key)}" value="${c.liveRate?.[d.k]?esc(P.eng(+c.liveRate[d.k],'',4).replace(/\s/g,'')):''}" placeholder="άλμα" inputmode="decimal" title="Ρυθμός (${esc(d.unit||'μονάδες')}/s): η αλλαγή γίνεται ράμπα με αυτή την κλίση, σε βήματα το πολύ T/50. Κενό: άλμα." aria-label="ρυθμός μεταβολής"><button data-pc="${esc(key)}" title="Ο ρυθμιστής γύρω από την τρέχουσα τιμή (×0,1 … ×10)">⟲</button><button data-pu="${esc(key)}" title="Αφαίρεση από τις ζωντανές παράμετροι">✕</button></div></div>`;}).join('')).join('');
 if(!box.innerHTML)box.innerHTML='<div class="muted small">Χωρίς μπλοκ PWM, S&H ή θυρίστορ. Με 📌 στο πάνελ παραμέτρων μπαίνει εδώ οποιαδήποτε αριθμητική παράμετρος.</div>';
 const al=box.querySelector('[data-alpha]');if(al){const setA=(commit)=>{const a=+al.value,from=scr[0].params?.alpha;for(const c of scr)c.params.alpha=a;S.sim?.setFiring(a);box.querySelector('[data-aout]').textContent=fmt(a,4)+'°';editor.renderLabels();liveChange('SCR','alpha',a,`α → ${fmt(a,4)}°`,String(from));if(commit){saveLocal();if(S.theory)renderTheory();}};al.oninput=()=>setA(false);al.onchange=()=>setA(true);}
 const setD=(id,d,commit)=>{d=Math.min(1,Math.max(0,d));const c=editor.comp(id);if(!c)return;const from=c.params.dsched||String(c.params.D??P.defaults('PWM').D);c.params.D=+d.toFixed(6);if(c.params.dsched){c.params.dsched='';S.sim?.setControl(id,{dsched:null});}S.sim?.setControl(id,{D:c.params.D});
  const o=box.querySelector(`[data-dout="${id}"]`);if(o)o.textContent=fmt(d,4);const r=box.querySelector(`[data-d="${id}"]`);if(r&&commit)r.value=d;editor.renderLabels();editor.updateLive();liveChange(id,'D',c.params.D,`${c.label||id}: D → ${fmt(c.params.D,4)}`,from);if(commit)saveLocal();};
 $$('#live-controls [data-d]').forEach(r=>{r.oninput=()=>setD(r.dataset.d,+r.value,false);r.onchange=()=>setD(r.dataset.d,+r.value,true);});
 $$('#live-controls [data-dd]').forEach(b=>b.onclick=()=>{const c=editor.comp(b.dataset.dd);setD(b.dataset.dd,(+c.params.D||0)+(+b.dataset.step),true);});
 $$('#live-controls [data-dset]').forEach(b=>b.onclick=()=>setD(b.dataset.dset,+b.dataset.val,true));
 $$('#live-controls [data-m]').forEach(r=>r.oninput=()=>{const c=editor.comp(r.dataset.m);const from=String(c.params.m);c.params.m=+r.value;S.sim?.setControl(r.dataset.m,{m:+r.value});box.querySelector(`[data-mout="${r.dataset.m}"]`).textContent=fmt(+r.value,3);liveChange(r.dataset.m,'m',+r.value,`${c.label||c.id}: m → ${fmt(+r.value,3)}`,from);});
 $$('#live-controls [data-kapply]').forEach(b=>{const id=b.dataset.kapply,inp=box.querySelector(`[data-kv="${id}"]`);const go=()=>{const v=inp.value.trim();
   // a vector constant (3.18): one program per element; the same number of elements changes them live, another number rebuilds
   if(v.includes(';')){const parts=v.split(';').map(x=>x.trim()),sc=parts.map(x=>P.parseSched(x));if(sc.some(x=>!x)){inp.classList.add('bad');return;}inp.classList.remove('bad');
    const c=editor.comp(id),nv=parts.join('; ');if(vecN(id)!==parts.length){editor.setParams(id,{v:nv});return;}
    c.params.v=nv;sc.forEach((q,k)=>S.sim?.setBlock(id+'['+(k+1)+']',{sched:q}));editor.renderPart(c);editor.renderLabels();saveLocal();if(S.theory)renderTheory();return;}
   const sch=P.parseSched(v);if(!sch){inp.classList.add('bad');return;}inp.classList.remove('bad');if(vecN(id)>1){editor.setParams(id,{v});return;}
   const c=editor.comp(id),from=c.params.v;c.params.v=v;S.sim?.setBlock(id,{sched:sch});editor.renderPart(c);editor.renderLabels();if(!v.includes(':'))liveChange(id,'v',sch[0][1],`${c.label||id} → ${eng(sch[0][1])}`,from);saveLocal();if(S.theory)renderTheory();};
  b.onclick=go;inp.onkeydown=e=>{if(e.key==='Enter')go();};});
 $$('#live-controls [data-refapply]').forEach(b=>b.onclick=()=>{const id=b.dataset.refapply,v=box.querySelector(`[data-ref="${id}"]`).value,sch=P.parseSched(v);if(!sch){notice('Μη έγκυρη αναφορά.','error');return;}
  const c=editor.comp(id),from=c.params.ref;c.params.ref=v;S.sim?.setControl(id,{ref:sch});if(!v.includes(':'))liveChange(id,'ref',sch[0][1],`${c.label||id}: αναφορά → ${eng(sch[0][1])}`,from);saveLocal();});
 const setPh=(id,deg,commit)=>{const c=editor.comp(id);if(!c)return;deg=((deg%360)+360)%360;const from=String(c.params.phase??0);c.params.phase=deg;S.sim?.setControl(id,{phase:deg/360});
  const o=box.querySelector(`[data-phout="${id}"]`);if(o)o.textContent=`${fmt(deg,4)}° · ${eng(deg/360/(+c.params.fs||P.defaults('PWM').fs),'s',3)}`;const r=box.querySelector(`[data-ph="${id}"]`);if(r&&commit)r.value=deg;
  editor.renderLabels();liveChange(id,'phase',deg,`${c.label||id}: φ → ${fmt(deg,4)}° (από την επόμενη περίοδο)`,from);if(commit){saveLocal();if(S.theory)renderTheory();}};
 $$('#live-controls [data-ph]').forEach(r=>{r.oninput=()=>setPh(r.dataset.ph,+r.value,false);r.onchange=()=>setPh(r.dataset.ph,+r.value,true);});
 $$('#live-controls [data-phset]').forEach(b=>b.onclick=()=>setPh(b.dataset.phset,+b.dataset.val,true));
 const dall=box.querySelector('[data-dall]');if(dall){const f=commit=>{for(const c of fixedPw)setD(c.id,+dall.value,commit);box.querySelector('[data-dallout]').textContent=fmt(+dall.value,4);};dall.oninput=()=>f(false);dall.onchange=()=>f(true);}
 $$('#live-controls [data-probe-d]').forEach(b=>b.onclick=()=>addProbe('D:'+b.dataset.probeD));
 $$('#live-controls [data-pulse]').forEach(b=>b.onclick=()=>addPulses(pulseKeys(b.dataset.pulse)));
 box.querySelector('[data-pulse-all]')?.addEventListener('click',()=>addPulses(phasePw.map(c=>pulseKeys(c.id)[0])));
 $$('#live-controls [data-ilv]').forEach(b=>b.onclick=()=>{const n=phasePw.length;phasePw.forEach((c,k)=>setPh(c.id,b.dataset.ilv==='shift'?+(360*k/n).toFixed(6):0,true));});
 $$('#live-controls [data-trig]').forEach(el=>el.onchange=()=>{const id=el.dataset.trig,c=editor.comp(id);if(!c)return;const from=c.params.trig;c.params.trig=el.value;S.sim?.setHold(id,{trig:el.value});editor.renderLabels();
  liveChange(id,'trig',el.value,`${c.label||id}: ${el.selectedOptions[0].textContent.split(' (')[0].split(' · ')[0]}`,from);saveLocal();if(S.theory)renderTheory();});
 const pinNow=(key,v,commit)=>{const [id,k]=key.split('|');const c=editor.comp(id);const d=c&&partDef(c)?.params.find(x=>x.k===k);if(!c||!d||!Number.isFinite(v))return;
  const nv=+v.toPrecision(6);if(commit&&!S.pinDrag&&numOf(c.params[k]??d.def)===nv)return; // the same value again (e.g. change on blur after Enter)
  const rate=+(c.liveRate?.[k]||0);if(rate>0&&!commit)return; // a ramp starts when the value is set, not while dragging
  const from=String(c.params[k]??d.def);if(!S.pinDrag){editor.remember();S.pinDrag=true;}c.params[k]=nv;
  if(rate>0&&S.sim&&S.sim.t>0&&atTop()){S.sim.addProgram({t:S.sim.t,id,k,v:nv,rate,live:true});S.pinDrag=false;saveLocal();renderLiveLog();editor.renderPart(c);editor.renderLabels();
   const o=box.querySelector(`[data-pout="${CSS.escape(key)}"]`);if(o)o.textContent=eng(nv,d.unit||'',4)+' (ράμπα)';return;} // 3.19: the solver ramps it (Sim.progApply)
  liveApply();editor.renderPart(c);editor.renderLabels();
  const o=box.querySelector(`[data-pout="${CSS.escape(key)}"]`);if(o)o.textContent=eng(c.params[k],d.unit||'',4);const t=box.querySelector(`[data-pv="${CSS.escape(key)}"]`);if(t&&document.activeElement!==t)t.value=P.eng(c.params[k],'',6).replace(/\s/g,'');
  liveChange(id,k,c.params[k],`${c.label||id}: ${d.label} → ${eng(c.params[k],d.unit||'',4)}`,from);
  if(commit){S.pinDrag=false;saveLocal();renderProps();if(S.theory)renderTheory();scheduleMath();}};
 // while dragging, one reload per frame
 const pinSet=(key,v,commit)=>{if(commit){cancelAnimationFrame(S.pinRaf||0);S.pinRaf=0;pinNow(key,v,true);return;}S.pinPend=[key,v];if(!S.pinRaf)S.pinRaf=requestAnimationFrame(()=>{S.pinRaf=0;const q=S.pinPend;S.pinPend=null;if(q)pinNow(q[0],q[1],false);});};
 $$('#live-controls [data-pr]').forEach(r=>{const key=r.dataset.pr,[id,k]=key.split('|');const val=()=>pinV(pinMap(editor.comp(id),k),+r.value);r.oninput=()=>pinSet(key,val(),false);r.onchange=()=>pinSet(key,val(),true);});
 $$('#live-controls [data-pv]').forEach(inp=>{const go=()=>{const v=P.parseEng(inp.value);if(!Number.isFinite(v)){inp.classList.add('bad');return;}inp.classList.remove('bad');pinSet(inp.dataset.pv,v,true);
   const [id,k]=inp.dataset.pv.split('|'),r=box.querySelector(`[data-pr="${CSS.escape(inp.dataset.pv)}"]`);if(r)r.value=pinX(pinMap(editor.comp(id),k),v);};inp.onchange=go;inp.onkeydown=e=>{if(e.key==='Enter')go();};});
 $$('#live-controls [data-pc]').forEach(b=>b.onclick=()=>{const [id,k]=b.dataset.pc.split('|');const c=editor.comp(id);if(!c)return;c.liveBase={...(c.liveBase||{}),[k]:numOf(c.params[k])};saveLocal();refreshControls();});
 $$('#live-controls [data-pu]').forEach(b=>b.onclick=()=>{const [id,k]=b.dataset.pu.split('|');togglePin(id,k);});
 $$('#live-controls [data-prate]').forEach(inp=>inp.onchange=()=>{const [id,k]=inp.dataset.prate.split('|');const c=editor.comp(id);if(!c)return;const raw=inp.value.trim(),v=raw?P.parseEng(raw):0;
  if(raw&&!(v>0)){inp.classList.add('bad');return;}inp.classList.remove('bad');const r={...(c.liveRate||{})};if(v>0)r[k]=v;else delete r[k];if(Object.keys(r).length)c.liveRate=r;else delete c.liveRate;saveLocal();});
 renderLiveLog();updateLivePanel();
}
// slider of a pinned parameter: logarithmic over [b/10, 10·b] for a positive base b, else linear around it
const PSL=1000;
function pinMap(c,k){const d=partDef(c)?.params.find(x=>x.k===k);const b=c.liveBase?.[k]??numOf(c.params[k]??d?.def);return b>0?{log:true,lo:b/10,hi:b*10}:{log:false,lo:b-Math.max(1,Math.abs(b)),hi:b+Math.max(1,Math.abs(b))};}
function pinX(m,v){const x=m.log?PSL*Math.log(Math.max(v,m.lo*1e-6)/m.lo)/Math.log(m.hi/m.lo):PSL*(v-m.lo)/(m.hi-m.lo);return Math.round(Math.min(PSL,Math.max(0,x)));}
function pinV(m,x){return m.log?m.lo*Math.pow(m.hi/m.lo,x/PSL):m.lo+(m.hi-m.lo)*x/PSL;}
// a parameter changed while the circuit runs, from the tiles over the drawing (4.8, §47, watch.js): the same paths as the
// live panel. A constant or the reference of a PI (a value or a t:value program) through setBlock / setControl, the duty
// of a PWM through setControl, anything else (a number, yes/no, a choice) by a load with the states (liveApply), which
// live.js forwards to the worker. Each change is marked on the scope (liveChange) and can become a program; one step of
// undo per gesture; commit = the end of a gesture (saved, panels and theory again).
function liveParam(id,k,v,commit){const c=editor.comp(id),d=c&&partDef(c)?.params.find(x=>x.k===k);if(!c||!d)return false;
 const from=c.params[k]??d.def,fin=()=>{editor.renderPart(c);editor.renderLabels();if(commit){saveLocal();renderProps();if(S.theory)renderTheory();scheduleMath();}else saveLocalSoon();};
 editor.remember('lp:'+id+'|'+k);
 if((c.type==='CONST'&&k==='v')||(c.type==='PWM'&&k==='ref')){const t=String(v).trim(),sch=P.parseSched(t);if(!sch)return false;c.params[k]=t;
  if(c.type==='CONST')S.sim?.setBlock(id,{sched:sch});else S.sim?.setControl(id,{ref:sch});
  if(!t.includes(':'))liveChange(id,k,sch[0][1],`${c.label||id}${k==='ref'?': αναφορά':''} → ${eng(sch[0][1],d.unit||'',4)}`,String(from));fin();return true;}
 if(c.type==='PWM'&&k==='D'){const nv=+Math.min(1,Math.max(0,+v)).toFixed(6);const fr=c.params.dsched||String(from);c.params.D=nv;if(c.params.dsched){c.params.dsched='';S.sim?.setControl(id,{dsched:null});}S.sim?.setControl(id,{D:nv});
  editor.updateLive();liveChange(id,'D',nv,`${c.label||id}: D → ${fmt(nv,4)}`,fr);fin();refreshControls();return true;}
 const nv=d.type==='num'?+(+v).toPrecision(6):d.type==='bool'?!!v:String(v);if(d.type==='num'&&!Number.isFinite(nv))return false;
 if(nv===(d.type==='num'?numOf(from):d.type==='bool'?!!from:String(from))&&commit){fin();return true;}
 c.params[k]=nv;liveApply();
 const txt=d.type==='num'?eng(nv,d.unit||'',4):d.type==='bool'?(nv?'ναι':'όχι'):String((d.options||[]).find(o=>String(o[0])===nv)?.[1]??nv);
 liveChange(id,k,nv,`${c.label||id}: ${d.label} → ${txt}`,d.type==='bool'?!!from:String(from));fin();return true;}

// ------------------------------------------------------------------ inspector
function closeInspector(){$('#inspector').hidden=true;$('#inspector').innerHTML='';}
function placePopup(el,x,y){el.hidden=false;const r=el.getBoundingClientRect();const W=innerWidth,H=innerHeight;el.style.left=Math.max(8,Math.min(x+12,W-r.width-8))+'px';el.style.top=Math.max(8,Math.min(y+12,H-r.height-8))+'px';}
// a value typed in a parameter field. 3.18: a block on a bus takes one value per element, separated by ';' ("1; -1"),
// and a constant can be a vector of values or programs ("0:0, 0.01:10; 0")
function fieldValue(c,k,el){if(el.type==='checkbox')return {v:el.checked};const raw=String(el.value),sch=k==='dsched'||k==='sched'||k==='ref'||(k==='v'&&c.type==='CONST');
 if(raw.includes(';')&&window.Bus?.ELEMENTWISE.has(c.type)){const parts=raw.split(';').map(x=>x.trim());
  return parts.every(x=>sch?!x||P.parseSched(x):Number.isFinite(P.parseEng(x)))?{v:parts.join('; ')}:{bad:true};}
 if(el.dataset.num){if(/^\s*=/.test(raw))return {v:raw.trim()};const v=P.parseEng(raw);return Number.isFinite(v)?{v}:{bad:true};}   // 4.17.1: «= …» an expression of the inputs
 if(sch&&raw&&!P.parseSched(raw))return {bad:true};return {v:raw};}
function fieldHTML(c,def,p){const v=p[def.k]??def.def;const id='f_'+def.k;
 if(def.type==='select')return `<select id="${id}" data-k="${def.k}">${def.options.map(([k,n])=>`<option value="${k}" ${String(v)===k?'selected':''}>${esc(n)}</option>`).join('')}</select>`;
 if(def.type==='bool')return `<input type="checkbox" id="${id}" data-k="${def.k}" ${v?'checked':''}>`;
 if(def.type==='ref'){const opts=editor.doc.components.filter(k=>def.kinds.includes(k.type)&&k.id!==c.id);
  // a reference that is not on this level: outside the open subcircuit (looked up outwards), or a path into an instance (3.17)
  const far=v&&!opts.some(k=>k.id===v)?`<option value="${esc(v)}" selected>${esc(v)} (${String(v).includes('/')?'μέσα σε υποκύκλωμα':atTop()?'δεν υπάρχει':'έξω από το υποκύκλωμα'})</option>`:'';
  return `<select id="${id}" data-k="${def.k}"><option value="">—</option>${opts.map(k=>`<option value="${k.id}" ${v===k.id?'selected':''}>${esc(k.label||k.id)} (${esc(P.PARTS[k.type].name)})</option>`).join('')}${far}</select>`;}
 if(def.type==='text')return `<input id="${id}" data-k="${def.k}" value="${esc(v)}" placeholder="${esc(def.ph||'')}">`;
 if(def.type==='code')return `<textarea id="${id}" data-k="${def.k}" class="code" rows="14" spellcheck="false">${esc(v)}</textarea>`;
 if(def.type==='area')return `<textarea id="${id}" data-k="${def.k}" class="area" rows="4">${esc(v)}</textarea>`;   // 4.9: a note
 return `<input id="${id}" data-k="${def.k}" data-num="1" value="${esc(typeof v==='number'?P.eng(v,'',6).replace(/\s/g,''):v)}" inputmode="decimal">`;}
// 4.7: the settings window is dragged by its title (a CSS transform while it moves, no layout), and once moved it opens
// where it was left, in this session and the next (localStorage pcl-ins-pos). Rebuilt after a change (a select, a
// source), it keeps its place and the field that had the focus.
const INS={pos:null};try{const o=JSON.parse(localStorage.getItem('pcl-ins-pos')||'null');if(o&&Number.isFinite(o.x)&&Number.isFinite(o.y))INS.pos=o;}catch(e){}
function placeAt(el,left,top){el.hidden=false;const W=el.offsetWidth,H=el.offsetHeight;el.style.left=Math.max(8,Math.min(left,innerWidth-W-8))+'px';el.style.top=Math.max(8,Math.min(top,innerHeight-Math.min(H,innerHeight-16)-8))+'px';}
function popupDrag(el,onDone){const h=el.querySelector('.ins-head');if(!h)return;
 h.onpointerdown=e=>{if(e.button!==0||e.target.closest('input,button,select,textarea,a'))return;e.preventDefault();try{h.setPointerCapture(e.pointerId);}catch(x){}
  const x0=e.clientX,y0=e.clientY,L=parseFloat(el.style.left)||0,T=parseFloat(el.style.top)||0,W=el.offsetWidth;let dx=0,dy=0,raf=0;el.classList.add('moving');
  h.onpointermove=ev=>{dx=Math.max(8-L,Math.min(innerWidth-W-8-L,ev.clientX-x0));dy=Math.max(8-T,Math.min(innerHeight-48-T,ev.clientY-y0));
   if(!raf)raf=requestAnimationFrame(()=>{raf=0;el.style.transform=`translate(${dx}px,${dy}px)`;});};
  h.onpointerup=h.onpointercancel=()=>{h.onpointermove=h.onpointerup=h.onpointercancel=null;if(raf)cancelAnimationFrame(raf);el.style.transform='';el.classList.remove('moving');
   if(dx||dy){el.style.left=(L+dx)+'px';el.style.top=(T+dy)+'px';onDone?.(L+dx,T+dy);}};};}
// 4.7: the neural network block: its size and what it has learned so far, and a button that writes the learned weights
// into the block (the parameter «Βάρη»), so that they stay with the file and a new run starts from them
function nnBlock(id){const s=S.sim;if(!s||S.pfx===null)return null;const full=S.pfx?S.pfx+id:id;return s.net?.sig?.blocks?.find(b=>b.id===full&&b.type==='NN')||null;}
function nnBox(c,p){const b=nnBlock(c.id),st=b?.st,sz=st?.net?.sizes||(window.NNet?NNet.sizesOf(Expr.names(p.ins,6,false).length,p.hidden):[]);
 const learns=p.train==='err'||p.train==='tgt';
 return `<div class="ins-nn"><small class="muted">Δίκτυο ${sz.join(' – ')} (${window.NNet&&st?.net?NNet.count(st.net):'—'} βάρη)${learns&&st?` · ${Parts.fmtNum(st.opt?.k||0)} ενημερώσεις · L = ${eng(st.L,'',3)}`:''}${String(p.w||'').trim()?' · ξεκινά από τα βάρη του μπλοκ':' · ξεκινά από τυχαία βάρη'}</small>${learns?'<button class="primary-ghost" data-nnkeep title="Γράφει στο μπλοκ τα βάρη που έμαθε ως τώρα">Κράτα τα βάρη που έμαθε</button>':''}</div>`;}
function nnLearned(id){if(S.running)pause();const b=nnBlock(id);if(!b||!(b.st?.opt?.k>0))return null;return NNet.text(b.st.net);}
function openInspector(id,x,y,keep){
 const c=editor.comp(id);if(!c)return;const def=partDef(c);const p={...pdefaults(c),...c.params};const ins=$('#inspector');
 const was=keep&&!ins.hidden?{left:parseFloat(ins.style.left),top:parseFloat(ins.style.top),focus:document.activeElement&&ins.contains(document.activeElement)?(document.activeElement.dataset.k||document.activeElement.dataset.src||null):null}:null;
 const rows=def.params.filter(d=>!d.show||d.show(p)).map(d=>`<label class="frow"><span>${esc(d.label)}${d.unit?` <em>${esc(d.unit)}</em>`:''}</span>${fieldHTML(c,d,p)}${d.hint?`<small>${esc(d.hint)}</small>`:''}</label>`).join('');
 const sig=(S.pfx===null?[]:signalsFor(c)).slice(0,4).map(([pre,n,f])=>`<button class="chip" data-probe="${pre}${pid(c.id)}${f||''}">⌁ ${esc(n)}</button>`).join('');
 // signal inputs: a source can be chosen here instead of drawing a wire (3.0)
 const sigIns=Object.entries(P.sigPins(c)).filter(([,v])=>v.dir==='in').map(([k])=>k);
 const outs=editor.doc.components.filter(k=>k.id!==c.id).flatMap(k=>Object.entries(P.sigPins(k)).filter(([,v])=>v.dir==='out').map(([pin])=>({v:k.id+':'+pin,t:`${k.label||k.id}.${pin}`+(k.type==='TAGI'?` (ετικέτα «${k.params?.name||''}»)`:'')}))).sort((a,b)=>a.t.localeCompare(b.t,undefined,{numeric:true}));
 const wired=pin=>editor.doc.wires.some(w=>(w.a.c===c.id&&w.a.p===pin)||(w.b.c===c.id&&w.b.p===pin));
 const srcRows=sigIns.map(pin=>{const v=c.params?.['in_'+pin]||'';return `<label class="frow"><span>Πηγή της εισόδου ${esc(pin)}</span><select data-src="${esc(pin)}"><option value="">${wired(pin)?'από σύρμα':'— (καμία)'}</option>${outs.map(o=>`<option value="${esc(o.v)}" ${o.v===v?'selected':''}>${esc(o.t)}</option>`).join('')}${v&&!outs.some(o=>o.v===v)?`<option value="${esc(v)}" selected>${esc(v)} (λείπει)</option>`:''}</select></label>`;}).join('');
 ins.innerHTML=`<div class="ins-head" title="Σύρε από εδώ για να μετακινήσεις το παράθυρο"><span class="ins-grip" aria-hidden="true">⠿</span><div><small>${esc(def.name)}</small><input class="ins-label" data-label value="${esc(c.label||c.id)}"></div><button class="x" data-close>✕</button></div>
  <div class="ins-body">${c.type==='PWM'&&p.mode==='pi'&&window.CtlWin?'<button class="primary-ghost ld-open" data-ctlwin title="G(s), Bode, περιθώρια, βηματική, PI/PID και πρόσθια τροφοδότηση, με εφαρμογή στο PWM ή από κώδικα">Ρύθμιση ελεγκτή…</button>':''}${c.type==='NN'?nnBox(c,p):''}${c.type==='TLM'?(p.src==='modal'?`<small class="muted">${esc(P.tlmModel(p).err?'Δεδομένα ανά ρυθμό: '+P.tlmModel(p).err:'CP από δεδομένα ανά ρυθμό ('+P.tlmM(p)+(P.tlmM(p)===1?' αγωγός).':' αγωγοί).'))}</small>`:`<button class="primary-ghost ld-open" data-linedata>Δεδομένα γραμμής…</button><small class="muted">${esc(P.tlmModel(p).err||'Μοντέλο '+(p.model==='fd'?'FD':'CP')+' ενημερωμένο.')}</small>`):''}${rows||(srcRows?'':'<p class="muted small">Χωρίς παραμέτρους.</p>')}${srcRows?`<div class="ins-srcs"><small class="muted">Σύνδεση χωρίς καλώδιο: διάλεξε από ποια έξοδο παίρνει σήμα κάθε είσοδος. Ισοδυναμεί με σύρμα.</small>${srcRows}</div>`:''}</div>${sig?`<div class="ins-probes">${sig}</div>`:''}
  <div class="ins-foot"><small>Οι αλλαγές εφαρμόζονται αμέσως, και ενώ τρέχει η προσομοίωση. Μονάδες SI με προθέματα: 5.6u, 100m, 20k.</small></div>`;
 if(was)placeAt(ins,was.left,was.top);else if(INS.pos)placeAt(ins,INS.pos.x,INS.pos.y);else placePopup(ins,x,y);
 popupDrag(ins,(l,t)=>{INS.pos={x:l,y:t};try{localStorage.setItem('pcl-ins-pos',JSON.stringify(INS.pos));}catch(e){}});
 window.WinFrame?.frame(ins,{key:'ins',head:'.ins-head',minW:300,minH:180});
 if(was?.focus){const f=ins.querySelector(`[data-k="${CSS.escape(was.focus)}"],[data-src="${CSS.escape(was.focus)}"]`);if(f)f.focus({preventScroll:true});}
 // a value in force: the same as the part has now (a typed value that equals it changes nothing)
 const same=(k,v)=>{const o=editor.comp(id)?.params?.[k];return o!==undefined&&String(o)===String(v);};
 const apply=(el,quiet)=>{const k=el.dataset.k,f=fieldValue(c,k,el);if(!quiet||!f.bad)el.classList.toggle('bad',!!f.bad);if(f.bad)return;const v=f.v;if(quiet&&same(k,v))return;
  editor.setParams(id,{[k]:v});const def2=def.params.find(d=>d.k===k);if(def2?.type==='select'||def2?.type==='bool'||k==='gate'||k==='ff'||k==='mode'||k==='ins'||k==='outs')openInspector(id,0,0,true);};
 ins.querySelectorAll('[data-src]').forEach(el=>el.onchange=()=>{editor.setParams(id,{['in_'+el.dataset.src]:el.value||undefined});if(!el.value)delete editor.comp(id).params['in_'+el.dataset.src];editor.renderPins();openInspector(id,0,0,true);});
 // 4.7: a number takes effect 0.4 s after the last key (one undo step for the burst), as well as with Enter or on leaving the field
 ins.querySelectorAll('[data-k]').forEach(el=>{el.onchange=()=>{clearTimeout(el._t);apply(el);};if(el.dataset.num){el.onkeydown=e=>{if(e.key==='Enter'){clearTimeout(el._t);apply(el);}};
  el.oninput=()=>{clearTimeout(el._t);el._t=setTimeout(()=>{if(el.isConnected)apply(el,true);},400);};}});
 ins.querySelector('[data-label]').onchange=e=>{editor.setParams(id,{},{label:e.target.value||id});renderChannels();};
 ins.querySelector('[data-close]').onclick=closeInspector;
 ins.querySelector('[data-linedata]')?.addEventListener('click',()=>{closeInspector();LineData.open(id,lineCtx());});
 ins.querySelector('[data-ctlwin]')?.addEventListener('click',()=>{closeInspector();openCtlWin(id);});
 ins.querySelector('[data-nnkeep]')?.addEventListener('click',()=>{const w=nnLearned(id);if(!w){notice('Το δίκτυο δεν έχει μάθει ακόμη: τρέξε πρώτα την προσομοίωση.','info');setTimeout(()=>notice(''),3000);return;}
  editor.setParams(id,{w});openInspector(id,0,0,true);notice('Τα βάρη που έμαθε το δίκτυο γράφτηκαν στο μπλοκ (παράμετρος «Βάρη»): μένουν στο αρχείο και ξεκινά από αυτά.','info');setTimeout(()=>notice(''),4000);});
 ins.querySelectorAll('[data-probe]').forEach(b=>b.onclick=()=>addProbe(b.dataset.probe));
}
// 4.17.4 (ROADMAP §64): the window «Ρύθμιση ελεγκτή» of a PWM (ctlwin.js): what it needs from the application
function ctlCtx(){return {comp:id=>editor.comp(id),params:id=>{const c=editor.comp(id);return {...P.defaults('PWM'),...(c?.params||{})};},eng,parse:v=>P.parseEng(v),
 notice:t=>{notice(esc(t),'error');setTimeout(()=>notice(''),4000);},
 args:(id,over)=>{const k=S.sim?.net?.ctrls?.find(q=>q.id===(S.pfx?S.pfx+id:id));if(!k||!k.tuneArgs)return null;return {...k.tuneArgs,p:{...k.tuneArgs.p,...(over||{})}};},
 apply:(id,v)=>{editor.setParams(id,v);notice(`Τα κέρδη γράφτηκαν στο ${esc(id)} (χειροκίνητα).`,'info');setTimeout(()=>notice(''),3000);},
 code:(id,st)=>`import pcl\np = pcl.load('κύκλωμα.json')            # ή pcl.tutorial('buck_vloop')\nd = p.tune('${id}')                        # G(s), πόλοι, μηδενικά, περιθώρια, κέρδη από το κύκλωμα\nprint(d['tf'], d['poles'], d['auto'])\nd = p.tune('${id}', Kp=${+(+st.Kp).toPrecision(5)}, Ki=${+(+st.Ki).toPrecision(5)}${st.ctl==='pid'?`, Kd=${+(+st.Kd).toPrecision(5)}, Tf=${+(+st.Tf).toPrecision(5)}`:''}, ff='${st.ff}'${st.ff==='conv'?`, kc=${st.kc}, convN=${st.convN}`:''})\nprint(d['margins'])                       # wc (rad/s), pm (°), gm, ms\np.set('${id}.gain', 'manual').set('${id}.Kp', ${+(+st.Kp).toPrecision(5)}).set('${id}.Ki', ${+(+st.Ki).toPrecision(5)})${st.ctl==='pid'?`.set('${id}.ctl', 'pid').set('${id}.Kd', ${+(+st.Kd).toPrecision(5)}).set('${id}.Tf', ${+(+st.Tf).toPrecision(5)})`:''}.set('${id}.ff', '${st.ff}')\nr = p.run(t_end=0.02, channels=['V:C1'])`};}
// 4.24: the analysis of the subnetworks once per netlist (the panel of the circuit is drawn often)
// (in a WeakMap by netlist: what goes into the solver object is saved with its state)
const SPLIT_PROP=new WeakMap();
function splitProposal(sim){const n=sim.net;if(!n)return null;if(!SPLIT_PROP.has(n)){let r=null;try{r=Split.proposal(sim);}catch(e){}SPLIT_PROP.set(n,r);}return SPLIT_PROP.get(n);}
// 4.24: the run split in subnetworks (splitwin.js); the run of the page as the one simulator to compare with
function openSplitWin(){if(!window.SplitWin)return null;const doc=editor.doc,sim=S.sim&&!S.error?S.sim:null;
 // the panes of the scope on the page, the step and method of the page and its stop time (as the run of the page)
 const panes=(scope.cfg.panes||[]).map(p=>(p.ch||[]).filter(c=>c.on!==false).map(c=>[c.key,c.label||c.key])).filter(p=>p.length);
 const single=k=>{const s=S.sim;if(!s||!s.ring||!s.chIndex)return null;const i=s.chIndex.get(k);if(i===undefined)return null;const R=s.ring,t=[],v=[];for(let q=0;q<R.n;q++){const a=(R.head-R.n+q+R.cap)%R.cap;t.push(R.t[a]);v.push(R.d[a*R.nch+i]);}return {t,v};};
 const pr=sim&&window.Split?splitProposal(sim):null;
 return SplitWin.open({project:doc,title:tutorial().title||'Κύκλωμα',panes,stopT:S.stopT>0?S.stopT:(sim?10*sim.T:0.02),hDiv:+$('#sim-step').value,method:$('#method').value,auto:!!pr?.use,single});}
function openCtlWin(id){if(!window.CtlWin)return null;if(!S.sim){notice('Δεν υπάρχει λύτης για το κύκλωμα.','error');return null;}return CtlWin.open(ctlCtx(),id);}
const WIRE_COLORS=['','#147966','#c47a1c','#2f5fa0','#b03a5b','#6b4fa0','#203a3f'];
// a named wire can join every wire with the same name (3.18, like Goto/From, for electrical nodes too); a bus has no single node voltage
const WLINK_HINT='Σύρματα με το ίδιο όνομα είναι ένας κόμβος, χωρίς καλώδιο ανάμεσα: ηλεκτρικό με ηλεκτρικό, σήμα με σήμα (μέσα σε υποκύκλωμα, μόνο στο ίδιο instance). ⇄ = ενώνει σύρματα που δεν συνδέονται αλλιώς.';
const wireWidth=w=>{try{return window.Bus?Bus.widths(editor.doc).wire(w):1;}catch(e){return 1;}};
function openWireInspector(id,x,y){const w=editor.wire(id);if(!w)return;const ins=$('#inspector'),bw=wireWidth(w);
 ins.innerHTML=`<div class="ins-head"><div><small>${bw>1?'Δίαυλος '+bw:'Σύνδεση'}</small><b>${esc(w.name||'χωρίς όνομα')}</b></div><button class="x" data-close>✕</button></div><div class="ins-body">
  <label class="frow" title="${esc(WLINK_HINT)}"><span>Όνομα κόμβου</span><input data-wname value="${esc(w.name||'')}" placeholder="π.χ. v_o"></label>
  <p class="muted small">${esc(WLINK_HINT)}</p>
  <div class="frow"><span>Χρώμα</span><div class="swatches">${WIRE_COLORS.map(c=>`<button data-wc="${c}" class="${(w.color||'')===c?'on':''}" style="background:${c||'var(--wire)'}" title="${c||'προεπιλογή'}"></button>`).join('')}</div></div>
  <label class="frow"><span>Πάχος</span><select data-ww>${['',1.5,2.2,3,4].map(v=>`<option value="${v}" ${String(w.width||'')===String(v)?'selected':''}>${v||'προεπιλογή'}</option>`).join('')}</select></label>
  <div class="ins-probes">${bw>1?'':'<button class="chip" data-wprobe>⌁ Τάση κόμβου</button>'}<button class="chip" data-wroute>↯ Αυτόματη δρομολόγηση</button></div></div>`;
 if(INS.pos)placeAt(ins,INS.pos.x,INS.pos.y);else placePopup(ins,x,y);popupDrag(ins,(l,t)=>{INS.pos={x:l,y:t};try{localStorage.setItem('pcl-ins-pos',JSON.stringify(INS.pos));}catch(e){}});
 window.WinFrame?.frame(ins,{key:'ins',head:'.ins-head',minW:300,minH:180});
 ins.querySelector('[data-wname]').onchange=e=>{editor.setWireProps(id,{name:e.target.value.trim()});renderChannels();};
 ins.querySelectorAll('[data-wc]').forEach(b=>b.onclick=()=>{editor.setWireProps(id,{color:b.dataset.wc||undefined});openWireInspector(id,x,y);});
 ins.querySelector('[data-ww]').onchange=e=>editor.setWireProps(id,{width:e.target.value?+e.target.value:undefined});
 if(bw===1)ins.querySelector('[data-wprobe]').onclick=()=>addProbe('VN:'+w.a.c+':'+w.a.p,w.name?w.name:undefined);
 ins.querySelector('[data-wroute]').onclick=()=>{editor.remember();editor.route(editor.wire(id));editor.render();};
 ins.querySelector('[data-close]').onclick=closeInspector;}

// ------------------------------------------------------------------ parameters panel (3.7): collapsible, sections as an accordion
const numOf=v=>typeof v==='number'?v:P.parseEng(v);
let PS={};try{PS=JSON.parse(localStorage.getItem('pcl2-props-sec'))||{};}catch{}
const INIT_K=new Set(['i0','v0','w0','th0','ia0','im0','psi0','y0','q0','h0','init']),MECH_K=new Set(['J','bm','load','TL']),
 LOSS_K=new Set(['esr','Rs','Ls','Ron','Roff','Vf','Vce0','Vfd','Rd','Eon','Eoff','Vref','Iref','R1','R2','Llk1','Llk2','Rw','body','uni']),
 CTL_K=new Set(['sensor','qty','ref','gain','ctl','topo','rVin','rL1','rC1','rL2','rC2','rR','fc','pm','Kp','Ki','Kd','Tf','ff','ffA','ffB','D0','dmin','dmax','upd']);
const PSEC=[['main','Κύριες'],['ctl','Βρόχος ελέγχου'],['loss','Απώλειες και παρασιτικά'],['mech','Μηχανικό μέρος και φορτίο'],['init','Αρχικές συνθήκες']];
function psec(key,title,body,{def=false,cnt='',bad=false}={}){const open=PS[key]??def;
 return `<details class="psec" data-sec="${key}" ${open?'open':''}><summary>${esc(title)}${cnt!==''?`<span class="cnt${bad?' bad':''}">${esc(String(cnt))}</span>`:''}</summary><div class="psec-body">${body}</div></details>`;}
function propsOpen(){return !$('#props').classList.contains('collapsed');}
function setProps(open){const el=$('#props');if(!el)return;el.classList.toggle('collapsed',!open);const b=$('#props-btn');b.classList.toggle('on',open);b.setAttribute('aria-pressed',String(open));$('#props-tab').setAttribute('aria-expanded',String(open));
 try{localStorage.setItem('pcl2-props',open?'1':'0');}catch{}if(open)renderProps();}
function focusComp(id){const c=editor.comp(id);if(!c)return;editor.select([id],[]);editor.userView=true;editor.view.cx=c.x;editor.view.cy=c.y;editor.applyView();}
function togglePin(id,k){const c=editor.comp(id);if(!c)return;editor.remember();const L=new Set(c.live||[]);
 if(L.has(k)){L.delete(k);if(c.liveBase)delete c.liveBase[k];if(c.liveRate){delete c.liveRate[k];if(!Object.keys(c.liveRate).length)delete c.liveRate;}}else{L.add(k);const d=partDef(c).params.find(x=>x.k===k);const v=numOf(c.params[k]??d?.def);c.liveBase={...(c.liveBase||{}),[k]:Number.isFinite(v)?v:0};}
 if(L.size)c.live=[...L];else{delete c.live;delete c.liveBase;delete c.liveRate;}saveLocal();refreshControls();renderProps();if(L.has(k))setLivePanel(true);}
function renderProps(){const box=$('#props-body');if(!box||!propsOpen())return;
 box.querySelectorAll('details.psec').forEach(d=>{PS[d.dataset.sec]=d.open;}); // the toggle event may not have fired yet
 const sel=editor.selection(),act=document.activeElement,fk=box.contains(act)?act.dataset.k:null;let h;if(window.Addons&&Addons.frames.size)Addons.emit('selection',sel.c);
 const one=sel.c.length===1&&!sel.w.length?editor.comp(sel.c[0]):null;
 if(one&&one.type!=='JUNC')h=propsComp(one);else if(one)h=propsJunc(one);else if(sel.w.length===1&&!sel.c.length)h=propsWire(editor.wire(sel.w[0]));
 else if(sel.c.length+sel.w.length>1)h=propsMulti(sel);else h=atTop()?propsCircuit():propsDef();
 box.innerHTML=h;
 box.querySelectorAll('details.psec').forEach(d=>d.ontoggle=()=>{PS[d.dataset.sec]=d.open;try{localStorage.setItem('pcl2-props-sec',JSON.stringify(PS));}catch{}});
 bindProps(box,one);if(fk)box.querySelector(`[data-k="${CSS.escape(fk)}"]`)?.focus();}
function propsComp(c){const def=partDef(c),p={...pdefaults(c),...c.params},live=new Set(c.live||[]),inpS=new Set(c.inp||[]),machine=['IM','SM','SRM','DCM','GEN3'].includes(c.type),inDef=!atTop(),pub=inDef?publicOf(c.id):new Map();
 const secOf=d=>c.type==='PWM'&&CTL_K.has(d.k)?'ctl':INIT_K.has(d.k)?'init':MECH_K.has(d.k)?'mech':!machine&&LOSS_K.has(d.k)?'loss':'main';
 const groups=new Map();for(const d of def.params){if(d.show&&!d.show(p))continue;const g=secOf(d);if(!groups.has(g))groups.set(g,[]);groups.get(g).push(d);}
 const exprV=d=>{if(!(window.Inputs&&Inputs.exprAt(c,d.k,p[d.k])))return '';const x=S.sim?.net?.inputs?.derived?.find(q=>q.id===c.id&&q.k===d.k);return ` <small class="muted" title="Τιμή από τις εισόδους">= ${x&&x.value!=null?esc(eng(x.value,d.unit||'')):'—'}</small>`;};
 const inpB=d=>!inDef&&d.type==='num'?`<button class="pinbtn${inpS.has(d.k)?' on':''}" data-inp-k="${d.k}" aria-pressed="${inpS.has(d.k)}" title="${inpS.has(d.k)?'Είσοδος του κυκλώματος «'+esc(c.inpName?.[d.k]||(c.id+'_'+d.k).replace(/[^A-Za-z0-9_]/g,'_'))+'»: κλικ για να πάψει να είναι':'⇥ Είσοδος του κυκλώματος: στις παραμέτρους του κυκλώματος με την εξήγησή της, και με το όνομά της σε παραμέτρους «= …» (4.17.1)'}">⇥</button>`:'';
 const row=d=>`<div class="prow"><span>${esc(d.label)}${d.unit?` <em>${esc(d.unit)}</em>`:''}</span><span class="pin-in">${fieldHTML(c,d,p).replace(` id="f_${d.k}"`,'')}${exprV(d)}${inpB(d)}${inDef?(['num','text','select','bool','ref'].includes(d.type)?`<button class="pinbtn pubbtn${pub.has(d.k)?' on':''}" data-pub-k="${d.k}" aria-pressed="${pub.has(d.k)}" title="${pub.has(d.k)?'Δημόσια παράμετρος «'+esc(pub.get(d.k))+'» του υποκυκλώματος: κλικ για να μείνει εσωτερική':'Δημόσια παράμετρος του υποκυκλώματος: αλλάζει χωριστά σε κάθε instance'}">⤴</button>`:''):d.type==='num'&&!P.structural(c.type,d.k)?`<button class="pinbtn${live.has(d.k)?' on':''}" data-pin-k="${d.k}" aria-pressed="${live.has(d.k)}" title="${live.has(d.k)?'Αφαίρεση από τις ζωντανές παράμετροι':'📌 Στις ζωντανές παράμετροι, με ρυθμιστή'}">📌</button>`:''}${!inDef&&atTop()&&window.Watch&&((['num','bool','select'].includes(d.type)&&!P.structural(c.type,d.k))||(c.type==='CONST'&&d.k==='v')||(c.type==='PWM'&&d.k==='ref'))?`<button class="pinbtn${Watch.has(c.id,d.k)?' on':''}" data-wtile-k="${d.k}" aria-pressed="${Watch.has(c.id,d.k)}" title="${Watch.has(c.id,d.k)?'Αφαίρεση του πλακιδίου από το σχέδιο':'▣ Πλακίδιο πάνω στο σχέδιο, δίπλα στο στοιχείο: αλλάζει την ώρα που τρέχει'}">▣</button>`:''}</span>${d.hint?`<small>${esc(d.hint)}</small>`:''}</div>`;
 let h=`<div class="props-head"><div><small>${esc(def.name)}</small><input data-plabel value="${esc(c.label||c.id)}" aria-label="Όνομα στοιχείου"></div><button class="x" data-pclose title="Αποεπιλογή (Esc)">✕</button></div>`;
 for(const [g,title] of PSEC){const L=groups.get(g);if(L?.length)h+=psec('p-'+g,title,L.map(row).join(''),{def:g==='main',cnt:L.length});}
 if(c.type==='SUB')h+=propsSub(c);else if(!def.params.length)h+='<p class="muted small">Χωρίς παραμέτρους.</p>';
 const sigIns=Object.entries(P.sigPins(c)).filter(([,v])=>v.dir==='in').map(([k])=>k);
 if(sigIns.length){const outs=editor.doc.components.filter(k=>k.id!==c.id).flatMap(k=>Object.entries(P.sigPins(k)).filter(([,v])=>v.dir==='out').map(([pin])=>({v:k.id+':'+pin,t:`${k.label||k.id}.${pin}`}))).sort((a,b)=>a.t.localeCompare(b.t,undefined,{numeric:true}));
  const wired=pin=>editor.wiresAt(c.id,pin).length>0;
  h+=psec('p-src','Συνδέσεις σημάτων',sigIns.map(pin=>{const v=c.params?.['in_'+pin]||'';return `<div class="prow"><span>Είσοδος ${esc(pin)}</span><span class="pin-in"><select data-src="${esc(pin)}"><option value="">${wired(pin)?'από σύρμα':'— (καμία)'}</option>${outs.map(o=>`<option value="${esc(o.v)}" ${o.v===v?'selected':''}>${esc(o.t)}</option>`).join('')}</select></span></div>`;}).join('')+'<small class="muted">Σύνδεση χωρίς καλώδιο: ισοδυναμεί με σύρμα.</small>',{cnt:sigIns.length});}
 // 3.19: what each signal port carries (units check of the last netlist) and what an input expects
 const UT=S.sim?.net?.units,sp=Object.entries(P.sigPins(c));
 if(UT&&window.Units&&atTop()&&sp.length){const rows=sp.map(([pin,v])=>{const e=v.dir==='in'?Units.expect(c,pin):null;
   return `<li><b>${esc(pin)}</b> ${v.dir==='in'?'←':'→'} ${esc(Units.txt(UT.type(c.id+':'+pin)))}${e&&(e.u||e.f)?` <span class="muted">(περιμένει ${esc(Units.txt(e))})</span>`:''}</li>`;});
  h+=psec('p-units','Μονάδες και τύποι θυρών',`<ul class="diag-list">${rows.join('')}</ul><small class="muted">Από τον έλεγχο μονάδων (ρύθμιση στο κύκλωμα). «Χωρίς τύπο» ταιριάζει με όλα.</small>`);}
 const sig=S.pfx===null?[]:signalsFor(c);if(sig.length)h+=psec('p-scope','Scope',`<div class="chips">${sig.map(([pre,n,f])=>`<button class="chip" data-probe="${pre}${pid(c.id)}${f||''}">⌁ ${esc(n)}</button>`).join('')}</div>`,{def:true});
 const skip=S.sim?.net?.diag?.skipped.find(x=>x.id===c.id);if(skip)h+=`<p class="small bad">Εκτός επίλυσης: ${skip.why==='openI'?'πηγή ρεύματος σε ανοιχτό κύκλωμα':'χωρίς σύνδεση'}.</p>`;
 const tools=window.Addons?Addons.forType(c.type):[];
 if(tools.length||c.from)h+=psec('p-tools','Παράμετροι από κώδικα',(c.from?`<p class="from-tool">Από εργαλείο: ${Object.entries(c.from).map(([k,v])=>`${esc(k)} (${esc(v.tool||'')})`).join(', ')}</p>`:'')+
  tools.map(a=>`<button class="chip" data-tool="${esc(a.id)}" title="${esc(a.description||'')}">⚙ ${esc((a.targets.find(t=>t.type===c.type)||{}).label||a.name)}</button>`).join(''),{def:true});
 h+=`<p class="muted small">Οι αλλαγές εφαρμόζονται αμέσως, και ενώ τρέχει η προσομοίωση. Με 📌 μια παράμετρος μπαίνει με ρυθμιστή στις ζωντανές παράμετροι.</p>`;
 return h;}
function propsJunc(j){const n=editor.wiresAt(j.id).length;return `<div class="props-head"><div><small>Κόμβος</small><b>${esc(j.id)}</b></div><button class="x" data-pclose>✕</button></div>
 <p class="muted small">${n===1?'Ελεύθερο άκρο: σύρε το πάνω σε ακροδέκτη ή σύρμα για να συνδεθεί, ή συνέχισε το σύρμα με το εργαλείο W.':n+' σύρματα ενώνονται εδώ.'}</p><div class="chips"><button class="chip" data-probe="VN:${esc(j.id)}:j">⌁ Τάση κόμβου</button></div>`;}
function propsWire(w){if(!w)return '';const bw=wireWidth(w);return `<div class="props-head"><div><small>${bw>1?'Δίαυλος '+bw:'Σύρμα'}</small><input data-wname value="${esc(w.name||'')}" placeholder="όνομα κόμβου, π.χ. v_o" aria-label="Όνομα κόμβου"></div><button class="x" data-pclose>✕</button></div>
 ${psec('w-look','Εμφάνιση',`<div class="prow"><span>Χρώμα</span><div class="swatches">${WIRE_COLORS.map(c=>`<button data-wc="${c}" class="${(w.color||'')===c?'on':''}" style="background:${c||'var(--wire)'}" title="${c||'προεπιλογή'}"></button>`).join('')}</div></div>
  <div class="prow"><span>Πάχος</span><span class="pin-in"><select data-ww>${['',1.5,2.2,3,4].map(v=>`<option value="${v}" ${String(w.width||'')===String(v)?'selected':''}>${v||'προεπιλογή'}</option>`).join('')}</select></span></div>`,{def:true})}
 <p class="muted small">${esc(WLINK_HINT)}</p>
 <div class="chips">${bw>1?'':`<button class="chip" data-probe="VN:${esc(w.a.c)}:${esc(w.a.p)}">⌁ Τάση κόμβου</button>`}<button class="chip" data-wroute>↯ Αυτόματη δρομολόγηση</button></div>
 <p class="muted small">${bw>1?`Δίαυλος με ${bw} ${P.pinKind(editor.comp(w.a.c)||{},w.a.p)==='el'?'αγωγούς':'σήματα'}: για να δεις ένα, χώρισέ τον με δίαυλο αγωγών ή Demux, ή βάλε στο scope τα στοιχεία που συνδέει.`:'Για ρεύμα στο σύρμα: άφησε πάνω του ένα probe ρεύματος (μπαίνει σε σειρά). Για τάση: ένα probe τάσης ή βολτόμετρο.'}</p>`;}
function propsMulti(sel){return `<div class="props-head"><div><small>Επιλογή</small><b>${sel.c.length} στοιχεία · ${sel.w.length} σύρματα</b></div><button class="x" data-pclose>✕</button></div>
 ${sel.c.length?'<div class="chips"><button class="chip" data-group title="Τα επιλεγμένα στοιχεία γίνονται ένα υποκύκλωμα. Τα σύρματα που βγαίνουν από την επιλογή γίνονται θύρες.">▣ Υποκύκλωμα από την επιλογή (Ctrl+G)</button></div>':''}
 <ul class="diag-list">${sel.c.map(id=>editor.comp(id)).filter(c=>c&&c.type!=='JUNC').map(c=>`<li><button data-focus="${esc(c.id)}">${esc(c.label||c.id)}</button><span class="muted">${esc(P.PARTS[c.type].name)}</span></li>`).join('')}</ul>`;}
function propsCircuit(){const d=S.sim?.net?.diag,doc=editor.doc,so=doc.solve||{},nC=doc.components.filter(c=>c.type!=='JUNC').length,lb=id=>esc(editor.comp(id)?.label||id);
 let h=`<div class="props-head"><div><small>Κύκλωμα</small><b>${esc(tutorial().title||'Κύκλωμα')}</b></div></div><p class="muted small">${nC} στοιχεία · ${doc.wires.length} σύρματα${S.sim&&!S.error?' · '+S.sim.net.nNodes+' κόμβοι':''}. Διάλεξε στοιχείο ή σύρμα για τις παράμετρές του.</p>`;
 h+=inputsHTML();
 const it=[];if(S.error)it.push(`<li class="bad">⚠ ${esc(S.error)}</li>`);
 if(d){for(const x of d.skipped)it.push(`<li><button data-focus="${esc(x.id)}">${lb(x.id)}</button>${x.why==='openI'?'πηγή ρεύματος σε ανοιχτό κύκλωμα':'χωρίς σύνδεση'}, εκτός επίλυσης</li>`);
  if(d.open.length)it.push(`<li>Ανοιχτοί ακροδέκτες: ${d.open.slice(0,8).map(k=>{const i=k.lastIndexOf(':');return `<button data-focus="${esc(k.slice(0,i))}">${lb(k.slice(0,i))}.${esc(k.slice(i+1))}</button>`;}).join(' ')}${d.open.length>8?' …':''}</li>`);
  if(d.freeEnds.length)it.push(`<li>Ελεύθερα άκρα: ${d.freeEnds.slice(0,8).map(j=>`<button data-focus="${esc(j)}" title="${esc(j)}">○</button>`).join('')}<span class="muted">δεν αλλάζουν τη λύση</span></li>`);
  if(d.freeNets.length)it.push(`<li>${d.freeNets.length} ${d.freeNets.length===1?'σύρμα':'σύρματα'} χωρίς στοιχείο, εκτός επίλυσης</li>`);
  for(const q of d.islands){const k=q.pins[0],cid=k?k.slice(0,k.lastIndexOf(':')):null;
   it.push(`<li>Αιωρούμενο τμήμα${cid?` <button data-focus="${esc(cid)}">${lb(cid)}…</button>`:''}: ${q.ref==='ref'?'ο κόμβος '+esc(q.refPin||'')+' στα 0 V':'μέση τάση 0 V ως προς τη γη, μέσω '+(d.rleak>0?eng(d.rleak,'Ω'):'G_min = 1 nS')}</li>`);}}
 h+=psec('c-conn','Συνδέσεις',it.length?`<ul class="diag-list">${it.join('')}</ul>`:'<p class="ok-line">✓ Όλα συνδέονται, χωρίς αιωρούμενα τμήματα.</p>',{def:true,cnt:it.length||'✓',bad:it.length>0});
 const opt=(k,list,v)=>`<select data-solve="${k}">${list.map(([a,n])=>`<option value="${a}" ${v===a?'selected':''}>${esc(n)}</option>`).join('')}</select>`;
 h+=psec('c-solve','Επίλυση: ασύνδετα και αιωρούμενα',`<div class="prow"><span>Ασύνδετα στοιχεία, ανοιχτοί ακροδέκτες</span><span class="pin-in">${opt('unconn',[['warn','Εκτός επίλυσης, με προειδοποίηση'],['ignore','Εκτός επίλυσης, σιωπηλά'],['error','Σφάλμα: η προσομοίωση δεν τρέχει']],so.unconn||'warn')}</span>
  <small>Στοιχείο χωρίς καμία σύνδεση και πηγή ρεύματος σε ανοιχτό κύκλωμα βγαίνουν από τη λύση. Κλαδί με ανοιχτό άκρο μένει, με μηδενικό ρεύμα. Σύρματα χωρίς στοιχείο δεν κάνουν κόμβο.</small></div>
  <div class="prow"><span>Αιωρούμενα τμήματα (χωρίς αγώγιμη σύνδεση με τη γη)</span><span class="pin-in">${opt('island',[['auto','Αυτόματα: μέση τάση 0 V'],['ref','Ένας κόμβος του στα 0 V'],['error','Σφάλμα: η προσομοίωση δεν τρέχει']],so.island||'auto')}</span>
  <small>Π.χ. δευτερεύον μετασχηματιστή χωρίς γείωση. Οι τάσεις μέσα στο τμήμα δεν αλλάζουν, μόνο ως προς τη γη.</small></div>
  <div class="prow"><span>R διαρροής προς τη γη <em>Ω</em></span><span class="pin-in"><input data-solve="rleak" value="${so.rleak?esc(P.eng(+so.rleak,'',4).replace(/\s/g,'')):''}" placeholder="κενό: G_min = 1 nS" inputmode="decimal"></span><small>Για «Αυτόματα»: σε κάθε κόμβο του αιωρούμενου τμήματος.</small></div>
  <div class="prow"><span>Βάση χρόνου T <em>s</em></span><span class="pin-in"><input data-solve="tbase" value="${so.tbase?esc(P.eng(+so.tbase,'',4).replace(/\s/g,'')):''}" placeholder="κενό: 1 ms" inputmode="decimal"></span><small>Όταν καμία πηγή δεν ορίζει χρόνο (π.χ. γεννήτρια Marx με φορτισμένους πυκνωτές). Το βήμα είναι T/N από την επιλογή «Βήμα».</small></div>
  <div class="prow"><span>Μονάδες και τύποι σημάτων</span><span class="pin-in">${opt('units',[['warn','Προειδοποίηση για μονάδες, σφάλμα για abc/αβ/dq'],['strict','Αυστηρός: και οι μονάδες σφάλμα'],['off','Χωρίς έλεγχο']],so.units||'warn')}</span>
  <small>Ένα αβ σε είσοδο dq (ή dq σε Clarke) σταματά την προσομοίωση. Άλλη μονάδα (A σε είσοδο V, άθροισμα V με A) ή άλλη συνιστώσα (β στο α) είναι προειδοποίηση. Το γινόμενο και η διαίρεση πολλαπλασιάζουν μονάδες (V·A = W, V/V = 1). Μονάδα σε σταθερά ή κέρδος: στις παραμέτρους τους.</small></div>
  <small class="muted">Αποθηκεύονται με το κύκλωμα και ισχύουν και στον λύτη του server.</small>`,{cnt:(so.unconn||so.island||so.rleak||so.tbase||so.units)?'αλλαγμένες':''});
 const sv=k=>so[k]===undefined?'':String(so[k]);
 h+=psec('c-step','Βήμα του λύτη',`<div id="step-advice">${stepAdvice()}</div><div class="prow"><span>Βήμα</span><span class="pin-in">${opt('step',[['','Σταθερό T/N (επιλογή «Βήμα Δt»)'],['var','Μεταβλητό, με έλεγχο σφάλματος']],sv('step'))}</span>
  <small>Μεταβλητό: σε κάθε βήμα εκτιμάται το τοπικό σφάλμα των καταστάσεων (ρεύματα πηνίων, τάσεις πυκνωτών, ροές) από διαιρεμένες διαφορές· αν περνά την ανοχή, το βήμα ξαναγίνεται μικρότερο, αλλιώς μεγαλώνει. Οι μεταγωγές και τα συμβάντα βρίσκονται όπως και με το σταθερό. Το T/N της επιλογής «Βήμα Δt» είναι το αρχικό βήμα· το ελάχιστο είναι η ρύθμιση «Ελάχιστο βήμα» παρακάτω.</small></div>
  <div class="prow"><span>Ανοχή (σχετικό σφάλμα ανά βήμα)</span><span class="pin-in">${opt('rtol',[['0.001','10⁻³'],['0.0001','10⁻⁴'],['','10⁻⁵ (προεπιλογή)'],['0.000001','10⁻⁶']],sv('rtol'))}</span><small>Ως προς το μέγιστο |x| κάθε κατάστασης. Σε ταλάντωση με μικρή απόσβεση το συνολικό σφάλμα μεγαλώνει με τον αριθμό των περιόδων.</small></div>
  <div class="prow"><span>Μέγιστο βήμα</span><span class="pin-in">${opt('hmax',[['5','T/5'],['10','T/10'],['20','T/20'],['','T/50 (προεπιλογή)'],['100','T/100'],['200','T/200']],sv('hmax'))}</span><small>Μικρότερο μέγιστο βήμα δίνει πυκνότερα σημεία στο scope. Με τον τραπεζοειδή το βήμα δεν ξεπερνά και το 2τ της ταχύτερης σταθεράς χρόνου του κυκλώματος (όχι των R_on/R_off), αλλιώς ταλαντώνεται εκεί.</small></div>
  <div class="prow"><span>Ελάχιστο βήμα <em>s</em></span><span class="pin-in"><input data-solve="hmin" value="${so.hmin?esc(P.eng(+so.hmin,'',4).replace(/\s/g,'')):''}" placeholder="κενό: Αυτόματα${S.sim&&!S.error&&S.sim.hMinAuto>0?' ('+eng(S.sim.hMinAuto,'s',3)+')':''}" inputmode="decimal"></span><small>Το μικρότερο βήμα του μεταβλητού βήματος, π.χ. <code>1n</code>, <code>50n</code>, <code>2u</code>. «Αυτόματα»: το μεγαλύτερο από T/N·10⁻³ και T·10⁻¹⁰. Όταν το βήμα μένει στο ελάχιστο χωρίς να πιάνει την ανοχή, η κονσόλα το γράφει. Το σταθερό βήμα δεν αλλάζει.</small></div>
  <div class="prow"><span>Ιδιοδιανύσματα του ελέγχου βήματος</span><span class="pin-in">${opt('modeVec',[['','Αυτόματα: παραγοντοποίηση ανά σταθερά χρόνου (όπως ως την 4.19.2)'],['hess','Γρήγορα: από τη μορφή Hessenberg']],sv('modeVec'))}</span><small>Ο έλεγχος του βήματος βρίσκει ποια στοιχεία κουβαλούν κάθε γρήγορη σταθερά χρόνου ή ταλάντωση, μία φορά για κάθε συνδυασμό διακοπτών που άγουν. «Γρήγορα»: το κόστος ανά σταθερά χρόνου πέφτει από n³ σε n² (n οι καταστάσεις), που φαίνεται σε κυκλώματα με πολλούς διακόπτες. Οι κυματομορφές είναι οι ίδιες bit προς bit· όπου πολλά στοιχεία κουβαλούν εξίσου μια σταθερά χρόνου (οι τρεις φάσεις ενός συμμετρικού κυκλώματος), τα ονόματα σε ένα μήνυμα μπορεί να έρθουν με άλλη σειρά και το πλήθος των «πρακτικά στιγμιαίων» να διαφέρει.</small></div>
  <div class="prow"><button data-stepcheck>↻ Έλεγχος βήματος</button><small>Σταθερές χρόνου και ταλαντώσεις του κυκλώματος με τις τωρινές καταστάσεις των διακοπτών, πηγές και γραμμές, απέναντι στο βήμα. Τα μηνύματα είναι στην κονσόλα διαγνωστικών κάτω από το scope.</small></div>`,{cnt:(so.step==='var'?'μεταβλητό':'σταθερό')+(so.hmin?' · ελάχιστο '+eng(+so.hmin,'s'):''),bad:!!(S.sim&&!S.error&&S.sim.hLim&&S.sim.stepInfo(false).over)});
 // 4.19 (§68, decision 226): the linear solver: the choice of the engine from the circuit («Αυτόματα») with its reason, and the settings
 {const q=S.sim&&!S.error&&S.sim.solverInfo?S.sim.solverInfo():null,st=q?.stats,fx=x=>String(+x.toPrecision(3)).replace('.',',');
  const now=q?(q.kind==='sparse'?'αραιός LU'+(q.refac==='partial'?', μερική επαναπαραγοντοποίηση':q.refac==='full'?', πλήρης επαναπαραγοντοποίηση':', παραγοντοποίηση από την αρχή'):'πυκνός LU'):'';
  const cnt=q&&st.fact?`<p class="muted small" id="lin-stats">Ως τώρα: ${st.fact} παραγοντοποιήσεις${st.hit?' ('+st.hit+' λύσεις από τη μνήμη ανά κατάσταση διακοπτών)':''}${q.kind==='sparse'?` · ${st.full} από την αρχή, ${st.re} επαναπαραγοντοποιήσεις${st.re?' με '+fx(st.cols/st.re)+' από '+q.n+' στήλες κατά μέσο όρο':''}`:''}${q.blocks>1?' · '+q.blocks+' ανεξάρτητα υποδίκτυα':''}.</p>`:'';
  h+=psec('c-lin','Γραμμικός λύτης',`${q?`<p class="small" id="lin-advice"><b>Πρόταση του engine:</b> ${esc(q.proposal.text)}</p>${q.asProposed?'':`<p class="small bad" id="lin-now">Τώρα: ${esc(now)} (δική σου επιλογή, διαφέρει από την πρόταση).</p>`}${cnt}`:''}
   <div class="prow"><span>Λύτης</span><span class="pin-in">${opt('solver',[['','Αυτόματα (η πρόταση)'],['dense','Πυκνός LU'],['sparse','Αραιός LU']],sv('solver'))}</span>
   <small>Πυκνός: κόστος n³ ανά παραγοντοποίηση και n² ανά βήμα. Αραιός: ανάλογο με τα μη μηδενικά του πίνακα. Τα αποτελέσματα διαφέρουν μόνο στη στρογγύλευση (~10⁻¹²).</small></div>
   <div class="prow"><span>Όταν αλλάζει ο πίνακας (αραιός)</span><span class="pin-in">${opt('refac',[['','Αυτόματα: μερική επαναπαραγοντοποίηση'],['full','Επαναπαραγοντοποίηση όλων των στηλών'],['off','Παραγοντοποίηση από την αρχή (όπως ως την 4.18)']],sv('refac'))}</span>
   <small>Η επαναπαραγοντοποίηση κρατά τους ίδιους οδηγούς και δίνει τους ίδιους αριθμούς bit προς bit με την παραγοντοποίηση από την αρχή· όπου θα άλλαζε οδηγός, παραγοντοποιεί από την αρχή μόνη της. Η «μερική» ξαναϋπολογίζει μόνο τις στήλες που άλλαξαν και όσες εξαρτώνται από αυτές.</small></div>
   <div class="prow"><span>Βάση της επαναπαραγοντοποίησης (αραιός)</span><span class="pin-in">${opt('refBase',[['','Αυτόματα: από τη μνήμη, η παραγοντοποίηση με τον ίδιο κανόνα και βήμα που θέλει τις λιγότερες στήλες'],['last','Οι τελευταίοι παράγοντες (όπως ως την 4.22)']],sv('refBase'))}</span>
   <small>Μια νέα κατάσταση διακοπτών ξαναϋπολογίζει μόνο τις στήλες που αλλάζουν. Ως την 4.22 η βάση ήταν οι τελευταίοι παράγοντες, που μετά από μια μεταγωγή ανήκουν συχνά σε άλλον κανόνα ολοκλήρωσης (backward Euler) και διαφέρουν σε κάθε στήλη πηνίου ή πυκνωτή. Οι αριθμοί είναι ίδιοι bit προς bit με κάθε βάση· αλλάζει μόνο ο χρόνος.${q&&st&&st.base?` Ως τώρα: ${st.base} φορές από τη μνήμη.`:''}</small></div>
   <div class="prow"><span>Πυρήνας της λύσης (αραιός)</span><span class="pin-in">${opt('kernel',[['','Αυτόματα: WebAssembly από 4000 αγνώστους'],['js','JavaScript'],['wasm','WebAssembly']],sv('kernel'))}</span>
   <small>Η λύση εμπρός–πίσω με τους παράγοντες σε WebAssembly, με τις ίδιες πράξεις με την ίδια σειρά: ίδιοι αριθμοί bit προς bit. Χωρίς WebAssembly, JavaScript.${q?` Τώρα: ${q.kernel==='wasm'?'WebAssembly':'JavaScript'}.`:''}</small></div>
   <div class="prow"><span>Καταγραφή καναλιών</span><span class="pin-in">${opt('rec',[['',(+fullDoc().version||0)>=4?'Αυτόματα: μόνο όσα δείχνει το scope πάνω από 1000 κανάλια (5.0)':'Όλα τα κανάλια (αρχείο πριν από την 5.0)'],['all','Όλα τα κανάλια (όπως ως την 4.22)'],['watched','Μόνο όσα δείχνει το scope'],['auto','Αυτόματα: μόνο όσα δείχνει το scope πάνω από 1000 κανάλια']],sv('rec'))}</span>
   <small>Σε μεγάλο δίκτυο τα περισσότερα κανάλια δεν τα κοιτά κανείς, αλλά υπολογίζονται και γράφονται σε κάθε βήμα. «Μόνο όσα δείχνει το scope»: υπολογίζονται και γράφονται μόνο αυτά, με τους ίδιους αριθμούς, και το scope κρατά περισσότερα σημεία. Ένα κανάλι που προστίθεται καταγράφεται από εκείνη τη στιγμή. Οι τιμές πάνω στο σχέδιο και οι τρέχουσες τιμές δουλεύουν για κάθε κανάλι· τα στατιστικά ανά περίοδο και το ιστορικό, μόνο για όσα καταγράφονται. «Αυτόματα» (η προεπιλογή των αρχείων της 5.0): όλα ως 1000 κανάλια, πάνω από εκεί μόνο όσα δείχνει το scope. Ο φάκελος μελέτης γράφει όλα τα κανάλια ό,τι κι αν διαλέξεις εδώ.${S.sim&&!S.error&&S.sim.recKeys&&S.sim.recKeys!==S.sim.keys?` Τώρα: ${S.sim.recKeys.length} από ${S.sim.keys.length} κανάλια${S.sim.recAuto?' (αυτόματα)':''}.`:''}</small></div>
   <div class="prow"><span>Αρχικοποίηση με φασιθέτες</span><span class="pin-in">${opt('initSolver',[['','Αυτόματα: πυκνός ως 400 αγνώστους, αραιός από εκεί και πάνω'],['dense','Πυκνός LU'],['sparse','Αραιός LU']],sv('initSolver'))}</span>
   <small>Όπου το κύκλωμα ξεκινά από τη μόνιμη κατάσταση με φασιθέτες (γεννήτριες, «αρχικοποίηση AC»), λύνεται ένα μιγαδικό σύστημα μία φορά. Ο πυκνός λύτης θέλει μνήμη n² και χρόνο n³· ο αραιός λύνει το ίδιο σύστημα ως πραγματικό διπλάσιου μεγέθους με μία επαναληπτική βελτίωση. Τα δύο διαφέρουν μόνο στη στρογγύλευση. «Αυτόματα»: ως 400 αγνώστους ο πυκνός, όπως ως την 4.19.2.</small></div>`,{cnt:(so.solver||so.refac)?'αλλαγμένες':''});}
 // 4.24 (THEORY §8Ι.7, decision 341): the network split in subnetworks at its lines, and multirate; a run to the end in a worker of its own
 {const pr=S.sim&&!S.error&&window.Split?splitProposal(S.sim):null;
  h+=psec('c-split','Υποδίκτυα και πολλαπλοί ρυθμοί',`${pr?`<p class="small" id="split-advice"><b>Πρόταση του engine:</b> ${pr.use?'σε Workers':'ένας λύτης'}: ${esc(pr.why)}.</p>`:''}
   <div class="prow"><span>Υποδίκτυα</span><span class="pin-in">${opt('split',[['','Αυτόματα (η πρόταση)'],['serial','Στο ίδιο νήμα'],['workers','Σε Workers']],sv('split'))}</span>
   <small>Μια γραμμή με χρόνο διάδοσης τ ≥ Δt δεν δίνει όρο του πίνακα ανάμεσα στα δύο άκρα της: τα μέρη που ενώνει είναι χωριστά υποδίκτυα. Κάθε ομάδα υποδικτύων τρέχει στον δικό της λύτη (σε Workers, παράλληλα) και παίρνει από τις άλλες μόνο τα κύματα των γραμμών. Με τα ίδια βήματα οι αριθμοί είναι ίδιοι bit προς bit· κάθε ομάδα αντιδρά μόνο στα δικά της συμβάντα. Τρέχει ως το τέλος, όχι ζωντανά.</small></div>
   <div class="prow"><span>Πολλαπλοί ρυθμοί</span><span class="pin-in">${opt('rates',[['','Όχι: το ίδιο βήμα παντού'],['auto','Αυτόματα: τα αργά υποδίκτυα με m·Δt']],sv('rates'))}</span>
   <small>Αργό: χωρίς διακόπτες, μη γραμμικά, μηχανές ή σήματα. Το m είναι το μικρότερο από τ/Δt των γραμμών του, T/(40·Δt), το 1/20 του 2π√(LC) των στοιχείων του και το «μέγιστο m».</small></div>
   <div class="prow"><span>Μέγιστο m</span><span class="pin-in">${opt('rateMax',[['','16'],['4','4'],['8','8'],['15','15']],sv('rateMax'))}</span></div>
   <div class="prow"><span>Το γρήγορο υποδίκτυο όπως το βλέπει το αργό</span><span class="pin-in">${opt('smooth',[['','Γραμμική παρεμβολή'],['avg','Μέση τιμή στο βήμα του αργού'],['area','Ίσο εμβαδόν (εξομάλυνση της μελέτης αναφοράς)']],sv('smooth'))}</span>
   <small>Το αργό υποδίκτυο διαβάζει τα κύματα του γρήγορου στον δικό του χρόνο. Η εξομάλυνση ίσου εμβαδού, σε δίκτυο με ταλάντωση κοντά στο μισό του αργού ρυθμού, μεγαλώνει το σφάλμα (THEORY §8Ι.7).</small></div>
   <div class="prow"><button data-splitrun>▶ Τρέξιμο σε υποδίκτυα ως το τέλος</button><small>Σε worker, με τις ρυθμίσεις αυτές. Το παράθυρο δείχνει τα κανάλια του scope, τα βήματα κάθε ομάδας, και τη διαφορά από το τρέξιμο της σελίδας αν έχει φτάσει στο ίδιο τέλος.</small></div>`,{cnt:(so.split||so.rates)?'αλλαγμένες':''});}
 const chk=(k,t)=>`<label class="frow check"><input type="checkbox" data-eset="${k}" ${editor.settings[k]?'checked':''}><span>${t}</span></label>`;
 h+=psec('c-draw','Σχεδίαση συρμάτων',`${chk('freeEnds','Ελεύθερα άκρα: σύρμα που αφήνεις στο κενό κρατά ελεύθερο άκρο')}${chk('autoConnect','Στοιχείο που αφήνεις πάνω σε σύρμα ή ακροδέκτη συνδέεται (Shift: χωρίς σύνδεση)')}
  <ul class="kbd-list"><li><b>W</b>: εργαλείο σύρματος. Κλικ οπουδήποτε για αρχή, κλικ για γωνίες, διπλό κλικ ή Enter για ελεύθερο άκρο, Backspace για μία γωνία πίσω, Esc για έξοδο.</li>
  <li>Σύρε ένα ελεύθερο άκρο πάνω σε ακροδέκτη ή σύρμα: συνδέεται.</li><li>Στοιχείο δύο ακροδεκτών (R, L, αμπερόμετρο, probe ρεύματος) πάνω σε σύρμα, στον άξονά του: μπαίνει σε σειρά.</li>
  <li>Probe τάσης ή βολτόμετρο: ο ακροδέκτης κουμπώνει πάνω στο σύρμα.</li><li>Alt ή Ctrl + σύρσιμο από σύρμα: διακλάδωση.</li></ul>`);
 const pg=doc.program||[];
 if(pg.length)h+=psec('c-prog','Πρόγραμμα αλλαγών παραμέτρων',`<ol class="diag-list">${pg.slice(0,12).map(e=>`<li><span>${eng(+e.t,'s',4)}</span> <button data-focus="${esc(e.id)}">${lb(e.id)}</button>${esc(e.k)} → ${esc(typeof e.v==='number'?eng(e.v,'',4):String(e.v))}${e.rate?' · ράμπα '+esc(eng(+e.rate,'/s',3)):''}</li>`).join('')}${pg.length>12?`<li class="muted">… και ${pg.length-12} ακόμη</li>`:''}</ol>
  <div class="prow"><button data-progclear>✕ Σβήσιμο του προγράμματος</button><small>Ο λύτης αλλάζει κάθε παράμετρο τη στιγμή της, όπως μια ζωντανή αλλαγή. Τρέχει στον browser, στο pcl και στους workers· ο SciPy δεν το βλέπει (εκεί: πρόγραμμα t:τιμή στις παραμέτρους που το δέχονται).</small></div>`,{cnt:pg.length});
 const pins=doc.components.filter(c=>c.live?.length);
 if(pins.length)h+=psec('c-live','Ζωντανές παράμετροι (📌)',`<ul class="diag-list">${pins.map(c=>`<li><button data-focus="${esc(c.id)}">${esc(c.label||c.id)}</button>${c.live.map(k=>esc(P.PARTS[c.type].params.find(d=>d.k===k)?.label||k)).join(', ')}</li>`).join('')}</ul>`,{cnt:pins.reduce((s,c)=>s+c.live.length,0)});
 return h;}
function bindProps(box,c){
 box.querySelector('[data-pclose]')?.addEventListener('click',()=>editor.select([],[]));
 box.querySelectorAll('[data-probe]').forEach(b=>b.onclick=()=>addProbe(b.dataset.probe));
 box.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>Addons.open(b.dataset.tool,{target:c.id}));
 box.querySelectorAll('[data-focus]').forEach(b=>b.onclick=()=>focusComp(b.dataset.focus));
 box.querySelector('[data-group]')?.addEventListener('click',()=>groupSel());
 box.querySelectorAll('[data-solve]').forEach(el=>el.onchange=()=>{const k=el.dataset.solve;let v=el.value;if(k==='rleak'||k==='tbase'||k==='hmin'){v=v.trim()?P.parseEng(v):'';if(v!==''&&!(v>0)){el.classList.add('bad');return;}}if((k==='rtol'||k==='hmax'||k==='rateMax')&&v!=='')v=+v;editor.setSolve({[k]:v});});
 box.querySelector('[data-progclear]')?.addEventListener('click',()=>{editor.setProgram([]);renderProps();});
 box.querySelectorAll('[data-inval]').forEach(el=>el.onchange=()=>{const [id,k]=el.dataset.inval.split('|'),raw=el.value.trim(),v=/^=/.test(raw)?raw:P.parseEng(raw);
  if(typeof v==='number'&&!Number.isFinite(v)){el.classList.add('bad');return;}el.classList.remove('bad');editor.setParams(id,{[k]:v});renderProps();});
 box.querySelectorAll('[data-inname]').forEach(el=>el.onchange=()=>{const [id,k]=el.dataset.inname.split('|');setInputMeta(id,k,{name:el.value.trim()});renderProps();});
 box.querySelectorAll('[data-indesc]').forEach(el=>el.onchange=()=>{const [id,k]=el.dataset.indesc.split('|');setInputMeta(id,k,{desc:el.value});});
 box.querySelectorAll('[data-stepcheck]').forEach(b=>b.onclick=()=>{if(S.sim&&!S.error)S.sim.stepCheck();renderDiag();openDiag();});
 box.querySelector('[data-splitrun]')?.addEventListener('click',()=>openSplitWin());
 box.querySelectorAll('[data-eset]').forEach(el=>el.onchange=()=>{editor.settings[el.dataset.eset]=el.checked;saveSettings();});
 if(!c&&!atTop())bindDef(box);
 if(c&&c.type!=='JUNC'){const id=c.id;
  box.querySelector('[data-plabel]')?.addEventListener('change',e=>{editor.setParams(id,{},{label:e.target.value||id});renderChannels();});
  box.querySelectorAll('[data-pin-k]').forEach(b=>b.onclick=()=>togglePin(id,b.dataset.pinK));
  box.querySelectorAll('[data-inp-k]').forEach(b=>b.onclick=()=>toggleInput(id,b.dataset.inpK));
  box.querySelectorAll('[data-wtile-k]').forEach(b=>b.onclick=()=>{Watch.toggleCtl(id,b.dataset.wtileK);renderProps();});
  box.querySelectorAll('[data-pub-k]').forEach(b=>b.onclick=()=>togglePublic(id,b.dataset.pubK));
  bindSub(box,c);
  box.querySelectorAll('[data-src]').forEach(el=>el.onchange=()=>{editor.setParams(id,{['in_'+el.dataset.src]:el.value||undefined});if(!el.value)delete editor.comp(id).params['in_'+el.dataset.src];editor.renderPins();});
  box.querySelectorAll('[data-k]').forEach(el=>{const go=()=>{const k=el.dataset.k,f=fieldValue(c,k,el);el.classList.toggle('bad',!!f.bad);if(f.bad)return;const v=f.v;
    const cur=editor.comp(id)?.params[k];if(cur===v||(el.dataset.num&&numOf(cur)===v))return;editor.setParams(id,{[k]:v});
    if(S.sim&&S.sim.t>0&&P.structural(c.type,k))notice(`«${esc(partDef(c)?.params.find(d=>d.k===k)?.label||k)}» είναι δομική παράμετρος (αλλάζει τη συνδεσμολογία ή τον τρόπο λειτουργίας): για σωστό αποτέλεσμα ξεκίνα από την αρχή με ⟲.`,'info');};
   el.onchange=go;if(el.dataset.num)el.onkeydown=e=>{if(e.key==='Enter')go();};});}
 const w=editor.selection().w.length===1?editor.wire(editor.selection().w[0]):null;
 if(w){const id=w.id;box.querySelector('[data-wname]')?.addEventListener('change',e=>{editor.setWireProps(id,{name:e.target.value.trim()});renderChannels();});
  box.querySelectorAll('[data-wc]').forEach(b=>b.onclick=()=>{editor.setWireProps(id,{color:b.dataset.wc||undefined});renderProps();});
  box.querySelector('[data-ww]')?.addEventListener('change',e=>editor.setWireProps(id,{width:e.target.value?+e.target.value:undefined}));
  box.querySelector('[data-wroute]')?.addEventListener('click',()=>{editor.remember();editor.route(editor.wire(id));editor.render();});}}
// a parameter changed from the live panel: reload the netlist with the state carried over, without rebuilding the panels
// ------------------------------------------------------------------ diagnostics console (3.13, ROADMAP §40)
const DSEV={error:['Σφάλματα','⛔'],warn:['Προειδοποιήσεις','⚠'],info:['Πληροφορίες','ℹ']},DGRP={step:'βήμα',net:'συνδέσεις',nl:'μη γραμμικά',sim:'λύτης',server:'server'};
// everything the user should know about the run: netlist warnings, step checks, solver messages, the server's
function diagItems(){const out=[],lb=id=>editor.comp(id)?.label||id;
 if(S.error)out.push({sev:'error',grp:'sim',src:'browser',msg:S.error,fix:'Το κύκλωμα δεν λύνεται όπως είναι: δες το μήνυμα και τα στοιχεία που αναφέρει.'});
 const sim=S.sim&&!S.error?S.sim:null;
 if(sim){for(const w of sim.net.warnings||[])out.push({sev:'warn',grp:'net',src:'browser',msg:w,fix:''});
  for(const q of sim.net.diag?.islands||[]){const k=q.pins[0],cid=k?k.slice(0,k.lastIndexOf(':')):null;out.push({sev:'info',grp:'net',src:'browser',id:cid,msg:`Αιωρούμενο τμήμα${cid?' ('+lb(cid)+'…)':''}: ${q.ref==='ref'?'ένας κόμβος του στα 0 V':'μέση τάση 0 V ως προς τη γη'}.`,fix:'Οι τάσεις μέσα στο τμήμα δεν αλλάζουν. Η επιλογή είναι στις ρυθμίσεις του κυκλώματος.'});}
  for(const r of sim.diagnostics())out.push(r);}
 for(const r of S.batchDiag||[])out.push(r);
 for(const r of S.addonDiag||[])out.push(r);
 return out;}
function renderDiag(){const box=$('#diag-list');if(!box)return;S.diagSeen=S.sim?.dgVer;const all=diagItems(),lb=id=>editor.comp(id)?.label||id,cnt={error:0,warn:0,info:0};
 for(const r of all)cnt[r.sev]++;
 $('#diag-counts').innerHTML=['error','warn','info'].map(k=>`<span class="dc ${k}${cnt[k]?'':' zero'}" title="${DSEV[k][0]}">${DSEV[k][1]} ${cnt[k]}</span>`).join('');
 const dg=$('#diag');dg.classList.toggle('has-error',cnt.error>0);dg.classList.toggle('has-warn',!cnt.error&&cnt.warn>0);
 if(!all.length){box.innerHTML='<p class="ok-line">✓ Κανένα μήνυμα: το βήμα αρκεί για τις σταθερές χρόνου, τις πηγές και τις γραμμές του κυκλώματος.</p>';return;}
 const on=new Set([...document.querySelectorAll('[data-dsev]')].filter(x=>x.checked).map(x=>x.dataset.dsev)),src=$('#diag-src').value,q=$('#diag-q').value.trim().toLowerCase();
 const vis=all.filter(r=>on.has(r.sev)&&(!src||r.src===src)&&(!q||`${r.msg} ${r.fix||''} ${r.id?lb(r.id):''} ${DGRP[r.grp]||''}`.toLowerCase().includes(q)));
 let h='';for(const k of ['error','warn','info']){const L=vis.filter(r=>r.sev===k);if(!L.length)continue;
  h+=`<details class="dg ${k}" open><summary>${DSEV[k][1]} ${DSEV[k][0]} <span class="muted">${L.length}</span></summary><ul>`+L.map(r=>`<li class="dg-item ${k}"><div class="dg-msg">${esc(r.msg)}</div><div class="dg-meta"><span class="tag">${esc(DGRP[r.grp]||r.grp||'')}</span>${r.id&&editor.comp(r.id)?`<button data-dfocus="${esc(r.id)}" title="Δείξε το στοιχείο στο σχέδιο">◎ ${esc(lb(r.id))}</button>`:''}${Number.isFinite(r.t)&&r.t>0?`<span>t = ${eng(r.t,'s',4)}</span>`:r.pre?'<span>πριν από το τρέξιμο</span>':''}${r.n>1?`<span>×${r.n.toLocaleString('el-GR')}</span>`:''}<span class="muted">${r.src==='server'?'server (SciPy)':'browser'}</span></div>${r.fix?`<div class="dg-fix">→ ${esc(r.fix)}</div>`:''}</li>`).join('')+'</ul></details>';}
 box.innerHTML=h||'<p class="muted">Τα φίλτρα κρύβουν όλα τα μηνύματα.</p>';
 box.querySelectorAll('[data-dfocus]').forEach(b=>b.onclick=()=>flashComp(b.dataset.dfocus));}
function openDiag(){const d=$('#diag');if(d&&!d.open){d.open=true;try{localStorage.setItem('pcl-diag-open','1');}catch(e){}}}
function flashComp(id){focusComp(id);const g=document.querySelector(`#canvas .part[data-c="${CSS.escape(id)}"]`);if(!g)return;g.classList.remove('diag-hi');void g.getBoundingClientRect();g.classList.add('diag-hi');setTimeout(()=>g.classList.remove('diag-hi'),1800);}
let stepCheckTimer=0,stepCheckSeq=0,stepCheckPool=null;
// the step check after every build or change (modes at the present switch states), debounced. 4.7: in a worker of its own
// (the eigenvalues and eigenvectors took 20–70 ms of the page on every change of a large circuit): the circuit and, after a
// run, the solver's state (snapshot) go there, the messages come back to the same solver. Python blocks: in the page when
// it has Python already, else in the pool. Without workers, or if the worker fails: in the page, as before.
// 4.19.1 (decision 243): the largest step that the circuit allows, with its reason (stepcheck.js limit, kept on the solver by the
// step check), against the step that runs now; the smallest step (the setting or «Αυτόματα»)
function stepAdvice(){const sim=S.sim;if(!sim||S.error||!sim.stepInfo)return '';const q=sim.stepInfo(false),L=q.limit;
 if(!L)return '<p class="muted small" id="step-lim">Το μέγιστο βήμα από το κύκλωμα: υπολογίζεται με τον έλεγχο βήματος…</p>';
 const v=q.mode==='var',h=v?L.hVar:L.h,why=v?L.whyVar:L.why;
 let t=`<p class="small" id="step-lim"><b>Πρόταση του engine:</b> μέγιστο βήμα ${esc(eng(h,'s',3))} · ${esc(why)}.`;
 if(v&&L.h<L.hVar)t+=` Τις σταθερές χρόνου και τις ταλαντώσεις του κυκλώματος (ως ${esc(eng(L.h,'s',3))}) τις ακολουθεί ο έλεγχος σφάλματος.`;
 if(L.alg)t+=` ${L.alg===1?'Μία σταθερά χρόνου':L.alg+' σταθερές χρόνου'} (ως ${esc(eng(L.algTau,'s',3))}) είναι πάνω από 1000 φορές ταχύτερες από το τωρινό βήμα και θεωρούνται στιγμιαίες.`;
 if(L.skip)t+=` <span class="muted">(${esc(L.skip)}: μόνο πηγές, γραμμές και ρολόγια.)</span>`;
 t+='</p>';
 const now=v?`μέγιστο βήμα ${eng(q.now,'s',3)}`:`Δt = ${eng(q.h,'s',3)} (T/${q.hDiv})`,mn=v?` · ελάχιστο ${eng(q.hMin,'s',3)} (${q.hMinSet?'δική σου ρύθμιση':'Αυτόματα'})`:'';
 t+=q.over?`<p class="small bad" id="step-now">Τώρα: ${esc(now)}: ξεπερνά το μέγιστο που δίνει το κύκλωμα${esc(mn)}.</p>`:q.minOver?`<p class="small bad" id="step-now">Τώρα: ${esc(now)}${esc(mn)}: το ελάχιστο βήμα είναι πάνω από το μέγιστο που δίνει το κύκλωμα.</p>`
  :`<p class="muted small" id="step-now">Τώρα: ${esc(now)}${esc(mn)}.</p>`;
 return t;}
function stepAdviceShow(){const b=$('#step-advice');if(b)b.innerHTML=stepAdvice();}
function scheduleStepCheck(){clearTimeout(stepCheckTimer);stepCheckTimer=setTimeout(runStepCheck,250);renderDiag();}
function runStepCheck(){const sim=S.sim;if(!sim||S.error)return renderDiag();const seq=++stepCheckSeq;
 const inPage=()=>{if(seq!==stepCheckSeq||sim!==S.sim)return;try{sim.stepCheck();}catch(e){}renderDiag();stepAdviceShow();};
 // (4.8: Python blocks with stand-ins on the page go to the pool, whose worker loads Python itself)
 if(!window.Worker||!window.Pool||S.noStepWorker||sim.net.sig.blocks.some(b=>b.type==='PY'&&!b.rt?.lazy))return inPage();
 let q;try{q={action:'stepcheck',lim:true,project:fullDoc(),opts:{...sim.opts,method:sim.method},state:sim.steps>0?sim.snapshot():null};}catch(e){return inPage();}
 stepCheckPool=stepCheckPool||new Pool.SimPool(1);
 stepCheckPool.map([q]).then(([res])=>{if(seq!==stepCheckSeq||sim!==S.sim)return;const list=Array.isArray(res)?res:res?.list;
   sim.dgPre=list||[];sim.hLim=(res&&!Array.isArray(res)&&res.lim)||null;sim.dgVer=(sim.dgVer||0)+1;renderDiag();stepAdviceShow();},inPage);}
function syncStepMode(){const m=$('#step-mode');if(m)m.value=editor.doc.solve?.step==='var'?'var':'fixed';}
// ------------------------------------------------------------------ scenarios (3.14, ROADMAP §30)
// Python in a worker (scenario_worker.js): the pcl package with the app's solver, on a copy of the circuit on the screen
const SCEN={worker:null,busy:false,ready:false,files:[],t0:0};
const SCEN_EX={
 ripple:`# Κυμάτωση του ρεύματος στον buck για διάφορα L, απέναντι στη θεωρία ΔI = V_o(1 − D)/(L·f_s)
b = pcl.tutorial('buck', start='steady')
sw = b.sweep({'L1.L': ['33u', '47u', '68u', '100u', '150u', '220u']}, t_end='8m',
             measure={'Vo': ('V:C1', 'avg', 10), 'dI': ('I:L1', 'pp', 10)})
L = sw.column('L1.L')
theory = [r['Vo'] * (1 - 0.5) / (r['L1.L'] * 100e3) for r in sw.rows]
pcl.show(sw, 'Σάρωση του L')
pcl.plot([x * 1e6 for x in L], {'προσομοίωση': sw.column('dI'), 'θεωρία': theory}, 'Κυμάτωση ρεύματος πηνίου', xlabel='L (μH)', ylabel='Δi_L (A)')
sw.save('κυμάτωση.csv')
`,
 run:`# Το κύκλωμα της οθόνης: 20 περίοδοι T, κυματομορφές και μέσες τιμές στις τελευταίες 5
info = p.channels()
keys = [k for k in info['keys'] if k[:2] in ('V:', 'I:')][:6]
r = p.run(t_end=20 * info['T'], channels=keys)
print(r, 'βήματα:', r.meta['steps'])
pcl.show({k: r.measure(k, 'avg', 5) for k in keys}, 'Μέσες τιμές (5 T)')
pcl.show(r, 'Κυματομορφές')
r.save('κυματομορφές.mat')
`,
 param:`# Σάρωση μιας παραμέτρου του τρέχοντος κυκλώματος: εδώ η πρώτη αντίσταση
for cid, q in p.params().items():
    print(cid, q)
R = next(cid for cid, q in p.params().items() if q['type'] == 'R')
info = p.channels()
out = [k for k in info['keys'] if k.startswith('V:')][0]
sw = p.sweep({R + '.R': [1, 2, 5, 10, 20, 50]}, t_end=20 * info['T'],
             measure={'μέση ' + out: (out, 'avg', 5), 'p-p ' + out: (out, 'pp', 5)})
pcl.show(sw, 'Σάρωση της ' + R)
`,
 step:`# Σταθερό και μεταβλητό βήμα στο τρέχον κύκλωμα: βήματα, χρόνος και μια μέτρηση
info = p.channels()
k = [x for x in info['keys'] if x.startswith('V:')][0]
rows = []
for step in ('fixed', 'var'):
    r = p.run(t_end=10 * info['T'], channels=[k], step=step)
    rows.append({'βήμα': step, 'βήματα': r.meta['steps'], 'απορρίψεις': r.meta.get('rejected', 0),
                 'χρόνος (s)': r.meta['wall_s'], 'μέση ' + k: r.measure(k, 'avg', 5)})
pcl.show(rows, 'Σταθερό και μεταβλητό βήμα')
`,
 bif:`# Διάγραμμα διακλάδωσης ως σάρωση (3.15): peak current-mode με ρεύμα αναφοράς i_c, ένα δείγμα του ρεύματος ανά περίοδο
# μετά από 300 περιόδους μεταβατικό. Ίδιοι αριθμοί με το πάνελ «Διάγραμμα διακλάδωσης», παράλληλα σε όσους workers επιτρέπει ο browser.
c = pcl.tutorial('pcm_chaos')
b = c.bifurcation('IC.v', start=1.4, stop=3, n=33, channel='Y:AM1', stat='end', transient=300, record=64)
pcl.show(b, 'i_L στην αρχή κάθε περιόδου')
pcl.show([{'από i_c': v, 'περίοδος': f'{q}T' if q else 'χωρίς (χάος)'} for v, q in b.changes()], 'Διπλασιασμοί περιόδου')
print(b.meta['workers'], 'workers')
b.save('διακλάδωση.parquet'); b.save('διακλάδωση.mat')
`,
 big:`# Μεγάλη σάρωση σε πλέγμα, παράλληλα, και αποθήκευση σε Parquet (pandas, Polars, MATLAB parquetread)
b = pcl.tutorial('buck', start='steady')
sw = b.sweep({'L1.L': '22u:220u:8', 'C1.C': ['10u', '47u', '100u']}, t_end='6m',
             measure={'Vo': ('V:C1', 'avg', 10), 'dV': ('V:C1', 'pp', 10), 'dI': ('I:L1', 'pp', 10)})
print(sw, sw.meta['workers'], 'workers')
pcl.show(sw, 'L × C')
sw.save('σάρωση.parquet'); sw.save('σάρωση.csv')
`};
const SCEN_COLORS=['#147966','#c47a1c','#2f7fd0','#b03a5b','#6b4fbb','#3b8b3b','#8a6d1d','#555'];
function scenSetCode(code,foreign){S.scenCode=code;const t=$('#scen-code');if(t&&t.value!==code)t.value=code;if(foreign)S.scenForeign=true;}
function scenState(t,kind){const e=$('#scen-state');e.textContent=t||'';e.className='scen-state'+(kind?' '+kind:'');}
function scenTab(k){document.querySelectorAll('[data-stab]').forEach(b=>b.classList.toggle('on',b.dataset.stab===k));document.querySelectorAll('[data-spane]').forEach(p=>p.hidden=p.dataset.spane!==k);}
function scenOut(text,cls){const o=$('#scen-out'),sp=document.createElement('span');if(cls)sp.className=cls;sp.textContent=text.endsWith('\n')?text:text+'\n';o.appendChild(sp);o.scrollTop=o.scrollHeight;}
function scenWorker(){if(SCEN.worker)return SCEN.worker;const w=new Worker('studio/scenario_worker.js');w.onmessage=e=>scenMsg(e.data);
 w.onerror=e=>{scenOut('Σφάλμα του worker: '+(e.message||e),'e');scenDone(false);};SCEN.worker=w;return w;}
function scenRun(){if(SCEN.busy)return;const code=$('#scen-code').value;if(!code.trim())return;
 // code that came with a file runs only after the user has seen it (ROADMAP §10, §30)
 if(S.scenForeign&&!confirm('Ο κώδικας του σεναρίου ήρθε μαζί με το αρχείο που άνοιξες. Διάβασέ τον πριν τον εκτελέσεις: τρέχει στον browser σου.\n\nΕκτέλεση;'))return;
 S.scenForeign=false;S.scenCode=code;saveLocal();SCEN.busy=true;SCEN.t0=performance.now();
 $('#scen-out').innerHTML='';$('#scen-table').innerHTML='';$('#scen-chart').innerHTML='';SCEN.files.forEach(f=>URL.revokeObjectURL(f.url));SCEN.files=[];renderScenFiles();scenTab('out');
 $('#scen-run').disabled=true;$('#scen-stop').disabled=false;$('#scen-prog').textContent='';
 scenState(SCEN.ready?'τρέχει…':'φορτώνεται η Python (Pyodide)…','busy');
 scenWorker().postMessage({type:'run',code,project:project(),name:tutorial().title||'κύκλωμα'});}
function scenStop(){if(SCEN.pool)SCEN.pool.stop();for(const p of SCEN.evals?.values()||[])p.rej(new Error('Διακόπηκε.'));SCEN.evals?.clear();if(SCEN.worker){SCEN.worker.terminate();SCEN.worker=null;SCEN.ready=false;}scenOut('Διακόπηκε. Η Python ξαναφορτώνεται στην επόμενη εκτέλεση.','e');scenDone(false);}
function scenDone(ok,wall){SCEN.busy=false;$('#scen-run').disabled=false;$('#scen-stop').disabled=true;$('#scen-prog').textContent='';
 scenState(ok?`✓ σε ${(wall??(performance.now()-SCEN.t0)/1000).toFixed(1)} s`:'σταμάτησε με σφάλμα',ok?'':'bad');}
function scenMsg(m){switch(m.type){
 case 'ready':SCEN.ready=true;scenState('τρέχει… (Python '+m.version+')','busy');break;
 case 'out':scenOut(m.text);break;
 case 'err':scenOut(m.text,'e');break;
 case 'tick':$('#scen-prog').textContent=`${Math.round(100*m.f)} %`;break;
 case 'progress':$('#scen-prog').textContent=`σημείο ${m.i}/${m.n}`;break;
 case 'show':scenShow(m.data);break;
 case 'file':{const blob=new Blob([m.bytes]);SCEN.files.push({name:m.name,size:m.bytes.byteLength,blob,url:URL.createObjectURL(blob)});renderScenFiles();break;}
 case 'error':scenOut(m.text,'e');scenTab('out');break;
 case 'done':scenDone(m.ok,m.wall);break;
 case 'batch':scenBatch(m);break;
 case 'evalres':{const p=SCEN.evals?.get(m.id);if(p){SCEN.evals.delete(m.id);if(m.error)p.rej(new Error(m.error));else p.res(m.result);}break;}
 case 'batch-fetch':scenBatchWrite(m.sab,SCEN.batchOut);SCEN.batchOut=null;break;}}
// 3.15: a sweep of the panel in parallel. The worker sent its requests and waits (Atomics.wait) on its SharedArrayBuffer;
// the pool answers them, and the JSON of the answers goes back in the buffer (a bigger buffer when it does not fit)
async function scenBatch(m){const pool=SCEN.pool||(SCEN.pool=new Pool.SimPool()),t0=performance.now();let outs;
 try{outs=await pool.map(m.qs,(i,r,done,n)=>{$('#scen-prog').textContent=`σημείο ${done}/${n} · ${pool.n} workers`;},true);}
 catch(e){outs=m.qs.map(()=>({error:String(e&&e.message||e)}));}
 scenBatchWrite(m.sab,new TextEncoder().encode(Scenario.json({workers:pool.n,wall_s:(performance.now()-t0)/1000,outs})));}
// 3.15: Python of an add-on or of the link, in the panel's worker (the same interpreter as the scenarios)
function scenEval(code,inputs,files,addon){return new Promise((res,rej)=>{const id=(SCEN.evalSeq=(SCEN.evalSeq||0)+1);(SCEN.evals||(SCEN.evals=new Map())).set(id,{res,rej});
 scenWorker().postMessage({type:'eval',id,code,inputs,files,addon,project:project(),name:tutorial().title||'κύκλωμα'});});}
// ------------------------------------------------------------------ add-ons and the link (3.15, ROADMAP §35, §36)
function addonDock(a){const box=document.createElement('section');box.className='addon-dock';box.innerHTML=`<header><b title="${esc(a.description||'')}">${esc(a.name)}</b><small class="muted">${esc(a.version||'')}</small><button data-dmin title="Ελαχιστοποίηση">▁</button><button data-dwide title="Μεγαλύτερο">⤢</button><button data-dx title="Κλείσιμο">✕</button></header><div class="addon-body"></div>`;
 $('#addon-docks').appendChild(box);box.querySelector('[data-dx]').onclick=()=>Addons.close(a.id);box.querySelector('[data-dmin]').onclick=()=>box.classList.toggle('min');
 // 5.0.2 (ROADMAP §94 point 6): moved by its title and resized from every side (it leaves the column at the first move),
 // its place and size kept per add-on; ⤢ the largest size and back
 if(window.WinFrame){WinFrame.frame(box,{key:'addon-'+a.id,head:'header',move:true,place:true,float:true,minW:280,minH:160});box.querySelector('[data-dwide]').onclick=()=>WinFrame.max(box);}
 else box.querySelector('[data-dwide]').onclick=()=>box.classList.toggle('wide');
 return {body:box.querySelector('.addon-body'),show:()=>box.classList.remove('min'),remove:()=>box.remove()};}
function renderAddons(){const L=$('#addons-list');if(!L||!window.Addons)return;const A=Addons;
 const vsel=a=>a.builtin||!(a.versions||[]).length?`<small class="muted">${esc(a.version||'')} · ενσωματωμένο</small>`:
  `<select data-aver="${esc(a.id)}" title="Η έκδοση που ανοίγει">${a.versions.map(v=>`<option ${v===a.active?'selected':''}>${esc(v)}</option>`).join('')}</select> <small class="muted">του χρήστη</small>`;
 L.innerHTML=A.list.length?A.list.map(a=>`<div class="addon-item"><div><b>${esc(a.name)}</b> ${vsel(a)}${a.error?`<p class="bad">${esc(a.error)}</p>`:`<p class="muted">${esc(a.description||'')}</p>`}</div>
  <div class="acts">${a.error?'':`<button data-aopen="${esc(a.id)}">Άνοιγμα</button>`}${a.builtin?'':`<button data-arm="${esc(a.id)}" data-arv="${esc(a.active||'')}" title="Αφαίρεση αυτής της έκδοσης">🗑</button>`}</div></div>`).join(''):`<p class="muted small">${A.err?'Τα πρόσθετα θέλουν τον server της εφαρμογής (python run.py): '+esc(A.err):'Κανένα πρόσθετο.'}</p>`;
 L.querySelectorAll('[data-aver]').forEach(x=>x.onchange=()=>Addons.activate(x.dataset.aver,x.value).catch(e=>alert(e.message)));
 L.querySelectorAll('[data-aopen]').forEach(b=>b.onclick=()=>Addons.open(b.dataset.aopen,{target:editor.selection().c[0]||''}));
 L.querySelectorAll('[data-arm]').forEach(b=>b.onclick=async()=>{if(!confirm(`Αφαίρεση της έκδοσης ${b.dataset.arv} του πρόσθετου ${b.dataset.arm};`))return;try{await Addons.remove(b.dataset.arm,b.dataset.arv);}catch(e){alert(e.message);}});
 $('#addons-dir').textContent=A.userDir?'φάκελος χρήστη: '+A.userDir:'';
 const k=A.link;$('#link-box').innerHTML=`<label><input type="checkbox" id="link-on" ${k.on?'checked':''}> <b>Σύνδεση με εξωτερικά προγράμματα</b></label>
  <p class="muted small">Προγράμματα Python ή MATLAB σε αυτόν τον υπολογιστή διαβάζουν και αλλάζουν το κύκλωμα της οθόνης, τρέχουν προσομοιώσεις και στέλνουν πίνακες ή γραφήματα εδώ: <code>pcl.link.connect()</code>, <code>pcl_link('info')</code>. Το token είναι στο <code>~/.pcl/link.json</code>.</p>
  ${k.on?`<p class="small">${k.err?`<span class="bad">${esc(k.err)}</span>`:'● ενεργή'}${k.n?` · ${k.n} κλήσεις, τελευταία ${esc(k.last.method)} (${esc(k.last.t)})${k.last.ok?'':' με σφάλμα'}`:''}</p>`:''}`;
 $('#link-on').onchange=e=>Addons.linkOn(e.target.checked);
}
// a program on this computer asks to connect while the link is closed: accept (the link opens) or refuse (3.15)
function knockToast(k,answer){const t=document.createElement('div');t.className='knock-toast';t.setAttribute('role','alertdialog');
 t.innerHTML=`<b>Αίτημα σύνδεσης</b><p>Το «${esc(k.client)}» σε αυτόν τον υπολογιστή ζητά να διαβάσει και να αλλάξει το κύκλωμα και να τρέξει προσομοιώσεις.</p><div><button class="primary" data-k="1">Αποδοχή</button><button data-k="0">Απόρριψη</button></div>`;
 document.body.appendChild(t);const done=ok=>{t.remove();answer(ok);};t.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>done(b.dataset.k==='1'));setTimeout(()=>{if(t.isConnected)done(false);},55000);}
function initAddons(){if(!window.Addons||!$('#addons-card'))return;
 Addons.init({editor,project,applyProject:pr=>{applyProject(pr);},sim:()=>S.error?null:S.sim,advance:linkAdvance,reset:linkReset,scopeKeys:()=>(scope.cfg?.panes||[]).flatMap(p=>(p.ch||p.channels||[]).map(c=>typeof c==='string'?c:c.key)),
  selection:()=>editor.selection().c,version:()=>($('footer b')?.textContent||''),title:()=>tutorial().title||'',tutorial:()=>S.tut?.id||null,
  python:(code,inputs,files)=>scenEval(code,inputs,files),show:d=>{$('#scen').open=true;scenShow(typeof d==='object'&&d&&d.type?d:{type:'text',text:typeof d==='string'?d:JSON.stringify(d,null,1)});},
  notify:r=>{(S.addonDiag||(S.addonDiag=[])).push({grp:'sim',...r});if(S.addonDiag.length>200)S.addonDiag.shift();renderDiag();},dock:addonDock,changed:renderAddons,knock:knockToast});
 $('#addon-file').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;try{const a=await Addons.install(f);alert(`Εγκαταστάθηκε: ${a.name} ${a.version}`);}catch(x){alert('Δεν εγκαταστάθηκε: '+x.message);}};
 $('#addons-refresh').onclick=()=>Addons.refresh();}
function scenBatchWrite(sab,bytes){if(!sab||!bytes)return;const h=new Int32Array(sab,0,2),cap=sab.byteLength-8;
 if(bytes.length>cap){SCEN.batchOut=bytes;h[1]=bytes.length;Atomics.store(h,0,2);Atomics.notify(h,0);return;}
 new Uint8Array(sab,8,bytes.length).set(bytes);h[1]=bytes.length;Atomics.store(h,0,1);Atomics.notify(h,0);}
function renderScenFiles(){$('#scen-nfiles').textContent=SCEN.files.length?`(${SCEN.files.length})`:'';
 $('#scen-files').innerHTML=SCEN.files.length?SCEN.files.map(f=>`<div class="scen-file"><a href="${f.url}" download="${esc(f.name)}">⬇ ${esc(f.name)}</a><small>${(f.size/1024).toFixed(1)} kB</small></div>`).join(''):
  '<p class="muted small">Ό,τι γράφει το σενάριο εμφανίζεται εδώ για λήψη, π.χ. <code>r.save(\'αποτελέσματα.csv\')</code>, <code>.json</code> ή <code>.mat</code> (MATLAB).</p>';}
const scenNum=v=>v===null||v===undefined?'':typeof v==='number'?(Math.abs(v)>=1e4||(Math.abs(v)<1e-3&&v!==0)?v.toPrecision(5):String(+v.toPrecision(6))).replace('.',','):esc(String(v));
function scenTable(cols,rows,title){return `<table class="scen-tbl">${title?`<caption>${esc(title)}</caption>`:''}<thead><tr>${cols.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(v=>`<td>${scenNum(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;}
function scenShow(d){
 if(d.type==='text'){scenOut(d.text);return;}
 if(d.type==='table'){$('#scen-table').insertAdjacentHTML('beforeend',scenTable(d.cols,d.rows,d.title));scenTab('table');return;}
 if(d.type==='sweep'){const cols=[...d.params,...d.names];$('#scen-table').insertAdjacentHTML('beforeend',scenTable(cols,d.rows.map(r=>cols.map(c=>r[c])),d.title));
  scenTab('chart');const x=d.rows.map(r=>r[d.params[0]]);for(const n of d.names)scenPlot({title:(d.title?d.title+': ':'')+n,xlabel:d.params[0],series:[{name:n,x,y:d.rows.map(r=>r[n])}],marks:true});
  scenTab('chart');return;}
 if(d.type==='bifurcation'){scenTab('chart');const x=[],y=[];d.values.forEach((v,i)=>{for(const q of d.y[i]){x.push(v);y.push(q);}});
  scenPlot({title:d.title,xlabel:d.xlabel,ylabel:d.ylabel,series:[{name:d.ylabel||'y',x,y}],dots:true});scenTab('chart');return;}
 if(d.type==='xy'){scenTab('chart');scenPlot({title:d.title,xlabel:d.xlabel,ylabel:d.ylabel,series:Object.entries(d.series).map(([name,y])=>({name,x:d.x,y})),marks:true});scenTab('chart');return;}
 if(d.type==='run'){const m=d.measure||{};if(Object.keys(m).length)$('#scen-table').insertAdjacentHTML('beforeend',scenTable(['μέτρηση','τιμή'],Object.entries(m),d.title));
  // one chart per unit, so volts and amperes do not share an axis
  scenTab('chart');const by={};d.keys.forEach((k,i)=>{(by[d.units[i]||'']??=[]).push(k);});
  for(const [u,ks] of Object.entries(by))scenPlot({title:(d.title||'')+(u?` [${u}]`:''),xlabel:'t (s)',series:ks.map(k=>({name:k,x:d.t,y:d.ch[k]}))});scenTab('chart');}}
function scenTicks(a,b,n=5){const sp=b-a||Math.abs(a)||1,st0=sp/n,mag=10**Math.floor(Math.log10(st0)),st=[1,2,2.5,5,10].map(x=>x*mag).find(x=>x>=st0*0.999);const out=[];for(let v=Math.ceil(a/st)*st;v<=b+st*1e-9;v+=st)out.push(+v.toPrecision(12));return out;}
function scenPlot(o){const host=o.host||$('#scen-chart'),box=document.createElement('div');box.className='scen-plot';box.innerHTML=(o.title?`<h5>${esc(o.title)}</h5>`:'')+'<canvas></canvas><div class="scen-leg"></div>';host.appendChild(box);
 const cv=box.querySelector('canvas'),dpr=window.devicePixelRatio||1,W=Math.max(320,box.clientWidth||host.clientWidth-24||600),H=220;cv.width=W*dpr;cv.height=H*dpr;cv.style.width=W+'px';cv.style.height=H+'px';
 const g=cv.getContext('2d');g.scale(dpr,dpr);g.font='11px system-ui,sans-serif';
 // at most 2000 points per series on screen (first and last kept, then the extremes of each bucket)
 const thin=(x,y)=>{const n=x.length;if(n<=2000)return [x,y];const B=500,X=[],Y=[];for(let k=0;k<B;k++){const a=Math.floor(k*n/B),b=Math.floor((k+1)*n/B);let mi=a,ma=a;for(let i=a;i<b;i++){if(y[i]<y[mi])mi=i;if(y[i]>y[ma])ma=i;}for(const i of mi<ma?[a,mi,ma]:[a,ma,mi]){X.push(x[i]);Y.push(y[i]);}}X.push(x[n-1]);Y.push(y[n-1]);return [X,Y];};
 const S2=o.series.map(s=>{const [x,y]=o.dots?[s.x,s.y]:thin(s.x,s.y);return {...s,x,y};});let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity;
 for(const s of S2)for(let i=0;i<s.x.length;i++){const xv=s.x[i],yv=s.y[i];if(!Number.isFinite(xv)||!Number.isFinite(yv))continue;x0=Math.min(x0,xv);x1=Math.max(x1,xv);y0=Math.min(y0,yv);y1=Math.max(y1,yv);}
 if(!Number.isFinite(x0)){g.fillText('χωρίς τιμές',10,20);return;}if(y1===y0){y0-=Math.abs(y0)*.05||1;y1+=Math.abs(y1)*.05||1;}const pad=(y1-y0)*.06;y0-=pad;y1+=pad;if(x1===x0){x0-=1;x1+=1;}
 const L=64,R=12,T=8,B=30,px=x=>L+(x-x0)/(x1-x0)*(W-L-R),py=y=>T+(y1-y)/(y1-y0)*(H-T-B);
 g.strokeStyle='#dbe5e0';g.fillStyle='#6b807a';g.lineWidth=1;
 // enough digits for the tick step (12,00 and 12,01 must not both read 12)
 const dig=(a,b,ts)=>Math.min(9,Math.max(3,Math.ceil(Math.log10(Math.max(Math.abs(a),Math.abs(b))/((ts[1]-ts[0])||1)))+1));
 const ty=scenTicks(y0,y1),tx=scenTicks(x0,x1,6),dy=dig(y0,y1,ty),dx=dig(x0,x1,tx);
 for(const v of ty){const yy=Math.round(py(v))+.5;g.beginPath();g.moveTo(L,yy);g.lineTo(W-R,yy);g.stroke();g.textAlign='right';g.fillText(P.eng(v,'',dy),L-6,yy+4);}
 for(const v of tx){const xx=Math.round(px(v))+.5;g.beginPath();g.moveTo(xx,T);g.lineTo(xx,H-B);g.stroke();g.textAlign='center';g.fillText(P.eng(v,'',dx),xx,H-B+14);}
 g.textAlign='right';g.fillText(o.xlabel||'',W-R,H-4);if(o.ylabel){g.save();g.translate(11,T+(H-T-B)/2);g.rotate(-Math.PI/2);g.textAlign='center';g.fillText(o.ylabel,0,0);g.restore();}
 S2.forEach((s,k)=>{const c=SCEN_COLORS[k%SCEN_COLORS.length];g.strokeStyle=c;g.fillStyle=c;g.lineWidth=1.6;
  if(o.dots){for(let i=0;i<s.x.length;i++)if(Number.isFinite(s.x[i])&&Number.isFinite(s.y[i]))g.fillRect(px(s.x[i])-1,py(s.y[i])-1,2,2);return;}
  g.beginPath();let on=false;
  for(let i=0;i<s.x.length;i++){const xv=s.x[i],yv=s.y[i];if(!Number.isFinite(xv)||!Number.isFinite(yv)){on=false;continue;}const X=px(xv),Y=py(yv);if(on)g.lineTo(X,Y);else g.moveTo(X,Y);on=true;}g.stroke();
  if(o.marks&&s.x.length<=60)for(let i=0;i<s.x.length;i++)if(Number.isFinite(s.y[i])){g.beginPath();g.arc(px(s.x[i]),py(s.y[i]),2.6,0,7);g.fill();}});
 box.querySelector('.scen-leg').innerHTML=S2.map((s,k)=>`<span><i style="background:${SCEN_COLORS[k%SCEN_COLORS.length]}"></i>${esc(s.name)}</span>`).join('');}
// 5.0.8 (ROADMAP §98): the card «Γραμμή εντολών» (console.js) with what the page knows: the circuit (p), the study of the
// diagram (net: the same request the page sends for the study), the buses chosen on the diagram (sel), the code of «Σενάρια»
// (run()), and the forms of pcl.show under the command (the same as the panel «Σενάρια»)
function cmdShow(d,host){
 if(d.type==='text'){host.insertAdjacentHTML('beforeend',`<pre class="cmd-o">${esc(d.text)}</pre>`);return;}
 if(d.type==='table'){host.insertAdjacentHTML('beforeend',scenTable(d.cols,d.rows,d.title));return;}
 if(d.type==='sweep'){const cols=[...d.params,...d.names];host.insertAdjacentHTML('beforeend',scenTable(cols,d.rows.map(r=>cols.map(c=>r[c])),d.title));
  const x=d.rows.map(r=>r[d.params[0]]);for(const n of d.names)scenPlot({host,title:(d.title?d.title+': ':'')+n,xlabel:d.params[0],series:[{name:n,x,y:d.rows.map(r=>r[n])}],marks:true});return;}
 if(d.type==='bifurcation'){const x=[],y=[];d.values.forEach((v,i)=>{for(const q of d.y[i]){x.push(v);y.push(q);}});scenPlot({host,title:d.title,xlabel:d.xlabel,ylabel:d.ylabel,series:[{name:d.ylabel||'y',x,y}],dots:true});return;}
 if(d.type==='xy'){scenPlot({host,title:d.title,xlabel:d.xlabel,ylabel:d.ylabel,series:Object.entries(d.series).map(([name,y])=>({name,x:d.x,y})),marks:d.x.length<=60});return;}
 if(d.type==='run'){const m=d.measure||{};if(Object.keys(m).length)host.insertAdjacentHTML('beforeend',scenTable(['μέτρηση','τιμή'],Object.entries(m),d.title));
  const by={};d.keys.forEach((k,i)=>{(by[d.units[i]||'']??=[]).push(k);});
  for(const [u,ks] of Object.entries(by))scenPlot({host,title:(d.title||'')+(u?` [${u}]`:''),xlabel:'t (s)',series:ks.map(k=>({name:k,x:d.t,y:d.ch[k]}))});}}
function cmdScope(keys){if(!S.sim)return 'scope: δεν τρέχει προσομοίωση στη σελίδα (▶ πρώτα).';const bad=keys.filter(k=>!S.sim.chIndex?.has(k));
 if(bad.length)return `scope: η προσομοίωση της σελίδας δεν έχει τα κανάλια ${bad.join(', ')} (p.channels()['keys'])`;for(const k of keys)addProbe(k);return '✓ στο scope: '+keys.join(', ');}
function initConsole(){window.Console?.init({project:()=>project(),name:()=>tutorial().title||'κύκλωμα',net:()=>STUDY.view?.q||null,sel:()=>NV.area?.ids?.slice()||[],scen:()=>S.scenCode||'',
  toScenario:code=>{scenSetCode(code);saveLocal();window.Dock?.reveal('scen');const d=$('#scen');if(d)d.open=true;},show:cmdShow,scope:cmdScope});}
function initScenarios(){const t=$('#scen-code');if(!t)return;t.value=S.scenCode||SCEN_EX.ripple;
 t.addEventListener('input',()=>{S.scenCode=t.value;clearTimeout(SCEN.save);SCEN.save=setTimeout(saveLocal,600);});
 t.addEventListener('keydown',e=>{if(e.key==='Tab'&&!e.shiftKey){e.preventDefault();t.setRangeText('    ',t.selectionStart,t.selectionEnd,'end');}else if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();scenRun();}e.stopPropagation();});
 $('#scen-ex').onchange=e=>{const k=e.target.value;if(!k)return;if(t.value.trim()&&t.value!==SCEN_EX[k]&&!Object.values(SCEN_EX).includes(t.value)&&!confirm('Να αντικατασταθεί ο κώδικας με το παράδειγμα;')){e.target.value='';return;}t.value=SCEN_EX[k];S.scenCode=t.value;S.scenForeign=false;e.target.value='';saveLocal();};
 $('#scen-run').onclick=scenRun;$('#scen-stop').onclick=scenStop;document.querySelectorAll('[data-stab]').forEach(b=>b.onclick=()=>scenTab(b.dataset.stab));
 try{if(localStorage.getItem('pcl-scen-open')==='1')$('#scen').open=true;}catch(e){}$('#scen').addEventListener('toggle',()=>{try{localStorage.setItem('pcl-scen-open',$('#scen').open?'1':'0');}catch(e){}});
 renderScenFiles();}
function liveApply(){if(!S.sim)return;try{S.sim.load(fullDoc(),false);S.error=null;warnings(S.sim.net.warnings);scope.attach(S.sim);editor.setDiag(viewDiag(S.sim.net.diag));}catch(e){S.error=e.message;pause();notice('Η προσομοίωση σταμάτησε: '+esc(e.message),'error');}scheduleStepCheck();}

// ------------------------------------------------------------------ context menu
function closeMenu(){$('#ctx').hidden=true;const q=$('#ctx-sub');if(q)q.hidden=true;}
function openMenu(ev){
 const m=$('#ctx');let items=[];
 if(ev.kind==='comp'){const c=editor.comp(ev.id);if(!c)return;
  // 5.0.5: the scopes of a part in a submenu (its options, and the window with its pins); before, one row per signal
  if(c.type!=='JUNC'&&S.pfx!==null&&pinScopeOf(c).n)items.push({t:'⌁ Scopes',k:'▸',sub:b=>openScopeSub(c,b)});
  if(c.type==='JUNC'&&S.pfx!==null)items.push({t:'⌁ Scope: τάση κόμβου',f:()=>addProbe('VN:'+pid(c.id)+':j')});
  if(c.type!=='JUNC'&&atTop()&&window.Watch)items.push({t:'▣ Πλακίδια πάνω στο σχέδιο…',k:'S',f:()=>Watch.openAdd(c.id)});
  if(c.type==='SUB')items.push(...subMenu(c));
  if(window.Inside?.can(c))items.push({t:Inside.canDbl(c)?'⧉ Τι έχει μέσα (μπλοκ και τιμές)':'⧉ Τι έχει μέσα (στοιχεία και τιμές)',k:Inside.canDbl(c)?'διπλό κλικ':'',f:()=>Inside.open(c.id)},
   {t:'▣ Ανάπτυξη σε υποκύκλωμα (για αλλαγές)',f:()=>libToSub(c.id)});
  {const n=editor.selection().c.filter(id=>editor.comp(id)?.type!=='JUNC').length;if(n&&editor.selection().c.includes(c.id))items.push({t:'▣ Υποκύκλωμα από την επιλογή'+(n>1?` (${n})`:''),k:'Ctrl+G',f:()=>groupSel()});}
  if(c.type!=='JUNC')items.push('-',{t:'Ρυθμίσεις…',k:window.Inside?.canDbl(c)?'':'διπλό κλικ',f:()=>openInspector(c.id,ev.x,ev.y)},{t:'Περιστροφή',k:'R',f:()=>editor.rotateSel()},{t:'Καθρέφτης',k:'M',f:()=>editor.mirrorSel()},{t:'Αντιγραφή',k:'Ctrl+C',f:()=>editor.copySel()},{t:'Αποκοπή',k:'Ctrl+X',f:()=>editor.cutSel()},{t:'Διπλότυπο',k:'Ctrl+D',f:()=>{if(editor.copySel())editor.beginPaste();}});
  // 4.22 (ROADMAP §66): a label moved by hand goes back to its automatic place
  {const ids=editor.selection().c.includes(c.id)?editor.selection().c:[c.id],n=ids.filter(id=>editor.comp(id)?.lblAt).length;if(n)items.push({t:'↺ Αυτόματη θέση ετικέτας'+(n>1?` (${n})`:''),f:()=>editor.resetLabels(ids)});}
  items.push({t:'Διαγραφή',k:'Del',f:()=>editor.deleteSel(),cls:'danger'});}
 else if(ev.kind==='wire'){const w=editor.wire(ev.id);if(!w)return;if(S.pfx!==null&&wireWidth(w)===1)items.push({t:'⌁ Scope: τάση κόμβου',f:()=>addProbe('VN:'+pid(w.a.c)+':'+w.a.p,w.name||undefined)},'-');items.push({t:'Όνομα / χρώμα…',k:'διπλό κλικ',f:()=>openWireInspector(w.id,ev.x,ev.y)},{t:'Αυτόματη δρομολόγηση',f:()=>{editor.remember();editor.route(w);editor.render();}},{t:'Διαγραφή',k:'Del',f:()=>editor.deleteSel(),cls:'danger'});}
 else items.push({t:'Επικόλληση',k:'Ctrl+V',f:()=>editor.beginPaste(),dis:!editor.clip},{t:'Επιλογή όλων',k:'Ctrl+A',f:()=>editor.select(editor.doc.components.map(c=>c.id),editor.doc.wires.map(w=>w.id))},{t:'Προσαρμογή προβολής',k:'F',f:()=>editor.fit()},'-',
  ...['R','L','C','D','SW','VDC'].map(t=>({t:'+ '+P.PARTS[t].name,f:()=>{const c=editor.addPart(t,Math.round(ev.world[0]/10)*10,Math.round(ev.world[1]/10)*10);void c;}})),'-',
  {t:'╱ Σύρμα από εδώ',k:'W',f:()=>{editor.setWireTool(true);editor.startFreeWire(ev.world);}},
  ...(editor.doc.components.some(c=>c.lblAt)?[{t:'↺ Αυτόματη θέση όλων των ετικετών',f:()=>editor.resetLabels()}]:[]),{t:'Επιλογές επίλυσης (ασύνδετα, αιωρούμενα)…',f:()=>{editor.select([],[]);PS['c-solve']=true;setProps(true);}});
 m.innerHTML=items.map((it,i)=>it==='-'?'<hr>':`<button data-i="${i}" class="${it.cls||''}${it.sub?' has-sub':''}" ${it.dis?'disabled':''} ${it.sub?'aria-haspopup="menu"':''}><span>${esc(it.t)}</span>${it.k?`<kbd>${esc(it.k)}</kbd>`:''}</button>`).join('');
 // a row with a submenu opens it when the pointer comes over it (or on a click); any other row closes it
 m.querySelectorAll('[data-i]').forEach(b=>{const it=items[+b.dataset.i];b.onclick=()=>{if(it.sub){it.sub(b);return;}closeMenu();it.f();};
  b.onpointerenter=()=>{const q=$('#ctx-sub');if(it.sub)it.sub(b);else if(q&&!q.hidden)q.hidden=true;};});placePopup(m,ev.x-12,ev.y-12);}

// ------------------------------------------------------------------ the scopes of a part (5.0.5)
// What a part can show in the scope, by pin: every electrical pin has the voltage of its node to ground (VN), or the
// part's own signal for that pin when it has one (the voltage and the current of every end of a line); every output of
// a block has its signal; the rest (the current, the voltage and the power of the part, the inner signals of a
// controller) are the part's own quantities. A signal goes with a pin when its name names that pin and no other.
const PS_WORD=t=>String(t).split(/\s+/)[0];
// the short name of a channel on its chip: V⏚ a voltage to ground, V a voltage of the part, I a current, y an output
const psSym=q=>q.ph?'V⏚'+q.ph:q.pre==='VN'||/^V\d*$/.test(q.pre)&&/προς γη/.test(q.text)?'V⏚':/^V\d*$/.test(q.pre)?'V':/^I\d*$/.test(q.pre)?'I':q.pre==='Y'?'y':q.pre;
function pinScopeOf(c){const id=pid(c.id),sg=signalsFor(c),el=Object.keys(P.elPins(c)),sp=P.sigPins(c),outs=outsOf(c);
 const pins=[...el.map(k=>({k,kind:'el'})),...Object.entries(sp).map(([k,d])=>({k,kind:d.dir==='out'?'out':'in',w:d.w||1}))];
 const by=new Map(pins.map(q=>[q.k,[]])),own=[];
 const word=k=>new RegExp('(^|[\\s(])'+k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'($|[\\s),])');
 for(const [pre,text,f] of sg){const key=pre+id+(f||''),q={key,text,pre:pre.replace(/:$/,'')};
  if(pre==='Y:'){const o=outs.find((o,k)=>(k?':'+o:'')===(f||''));if(o&&by.has(o)&&!/^\//.test(f||'')){by.get(o).push(q);continue;}}
  else{const hit=el.filter(k=>word(k).test(text));if(hit.length===1){by.get(hit[0]).push(q);continue;}}
  own.push(q);}
 // the node of an electrical pin, unless the part already gives a voltage to ground there
 // (a three-phase pin, «abc»: the node of each phase, as the solver names them)
 for(const k of el){const L=by.get(k);if(L.some(q=>/^V/.test(q.pre)&&/γη/.test(q.text)))continue;const w=P.pinWidth(c,k);
  if(w>1){const ph=w===3&&/^abc/.test(k)?['a','b','c'].map(x=>x+k.slice(3)):[];L.unshift(...ph.map(x=>({key:`VN:${id}:${x}`,text:`τάση της φάσης ${x} στο ${k} (προς γη)`,pre:'VN',ph:x})));}
  else L.unshift({key:`VN:${id}:${k}`,text:`τάση του κόμβου στο ${k} (προς γη)`,pre:'VN'});}
 // where each pin is on the drawing: the side of the box it is nearest to, in the order along that side
 const bb=P.bbox(c),cx=(bb[0]+bb[2])/2,cy=(bb[1]+bb[3])/2,hw=Math.max(1,(bb[2]-bb[0])/2),hh=Math.max(1,(bb[3]-bb[1])/2);
 for(const q of pins){const at=P.pinPos(c,q.k)||[cx,cy],dx=(at[0]-cx)/hw,dy=(at[1]-cy)/hh;q.at=at;q.side=Math.abs(dx)>=Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'top':'bottom');q.sig=by.get(q.k)||[];}
 const side=s=>pins.filter(q=>q.side===s).sort((a,b)=>s==='left'||s==='right'?a.at[1]-b.at[1]:a.at[0]-b.at[0]);
 return {c,id,pins,own,side:{left:side('left'),right:side('right'),top:side('top'),bottom:side('bottom')},n:sg.length+el.length};}
const inScope=key=>scope.cfg.panes.some(p=>p.ch.some(ch=>ch.key===key));
// the value now of a channel (the node of a pin through its net)
function liveVal(key){const s=S.sim;if(!s)return NaN;try{if(key.startsWith('VN:')){const n=s.net.pinNet.get(key.slice(3));if(!n)return NaN;if(n.ground)return 0;return s.now('N:'+n.canon);}return s.now(key);}catch(e){return NaN;}}
// on or off in the scope: «to» is where a new channel goes (automatic by unit, a pane, or a new pane)
function scopeToggle(key,label,to){if(!S.sim)return;if(inScope(key)){scope.removeChannel(key);renderChannels();draw(true);return false;}
 if(to===undefined||to==='auto'){addProbe(key,label);return true;}scope.addChannel(key,label||chanLabel(key),to==='new'?scope.cfg.panes.length:+to);renderChannels();flash('#scope-card');draw(true);return true;}
function openScopeSub(c,btn){const m=$('#ctx-sub')||(()=>{const m=document.createElement('div');m.id='ctx-sub';m.className='popup ctx ctx-sub';m.setAttribute('role','menu');m.hidden=true;document.body.appendChild(m);
  m.addEventListener('click',e=>{const b=e.target.closest('[data-psk],[data-pswin]');if(!b)return;if(b.dataset.pswin!==undefined){const id=m.dataset.c;closeMenu();openPinScope(id);return;}
   const on=scopeToggle(b.dataset.psk,b.dataset.psl||undefined);b.classList.toggle('on',!!on);b.setAttribute('aria-pressed',String(!!on));});return m;})();
 const Q=pinScopeOf(c),chip=q=>`<button class="ps-opt${inScope(q.key)?' on':''}" data-psk="${esc(q.key)}" aria-pressed="${inScope(q.key)}" title="${esc(q.text)} · κλικ: ${inScope(q.key)?'αφαίρεση από':'στο'} scope">${esc(q.pre==='VN'?'τάση'+(q.ph?' '+q.ph:'')+' ⏚':PS_WORD(q.text))}</button>`;
 let h=`<button data-pswin class="ps-win"><span>▣ Παραθυράκι: οι ακροδέκτες και τι μετράει ο καθένας…</span></button><hr>`;
 const rows=Q.pins.filter(q=>q.sig.length);if(rows.length)h+=`<div class="ps-sec">Ανά ακροδέκτη</div>`+rows.map(q=>`<div class="ps-row"><span class="ps-pin" title="${q.kind==='el'?'ηλεκτρικός ακροδέκτης':q.kind==='out'?'έξοδος σήματος':'είσοδος σήματος'}">${esc(q.k)}</span>${q.sig.map(chip).join('')}</div>`).join('');
 if(Q.own.length)h+=`<div class="ps-sec">Του στοιχείου</div>`+Q.own.map(q=>`<button class="ps-item${inScope(q.key)?' on':''}" data-psk="${esc(q.key)}" aria-pressed="${inScope(q.key)}"><span>${esc(q.text)}</span><kbd>${inScope(q.key)?'✓ στο scope':''}</kbd></button>`).join('');
 m.innerHTML=h;m.dataset.c=c.id;m.hidden=false;const r=btn.getBoundingClientRect(),w=m.offsetWidth,hh=m.offsetHeight;
 m.style.left=(r.right+4+w>innerWidth-8?Math.max(8,r.left-4-w):r.right+4)+'px';m.style.top=Math.max(8,Math.min(r.top-6,innerHeight-hh-8))+'px';}
// the window of a part: its box with every pin drawn where it is, and for every pin what it measures, on or off in the
// scope with a click, with the value now; under the box the part's own quantities; where a new channel goes
const PW={id:null,pfx:null,timer:0,to:'auto'};
function pinScopeHtml(Q){const c=Q.c,lab=c.label||c.id,name=P.PARTS[c.type]?.name||c.type;
 const chip=q=>{const u=Scope.unitOf(q.key,S.sim);return `<button class="pw-chip${inScope(q.key)?' on':''}" data-pwk="${esc(q.key)}" aria-pressed="${inScope(q.key)}" title="${esc(q.text)} · κλικ: ${inScope(q.key)?'αφαίρεση από':'στο'} scope"><b>${esc(psSym(q))}</b><span class="pw-what">${esc(q.pre==='VN'?'τάση':PS_WORD(q.text))}</span><span class="pw-val" data-pwv="${esc(q.key)}" data-u="${esc(u)}">—</span></button>`;};
 const pin=(q,s)=>{const kind=q.kind==='el'?'':q.kind==='out'?' pw-out':' pw-in',chips=q.sig.length?q.sig.map(chip).join(''):`<span class="pw-none">${q.kind==='in'?'είσοδος σήματος':'—'}</span>`;
  return `<div class="pw-pin pw-${s}${kind}"><div class="pw-chips">${chips}</div><div class="pw-stub"><i></i></div><span class="pw-name">${esc(q.k)}</span></div>`;};
 const col=s=>`<div class="pw-side pw-s-${s}">${Q.side[s].map(q=>pin(q,s)).join('')}</div>`;
 const own=Q.own.length?`<div class="pw-own"><div class="ps-sec">Μεγέθη του στοιχείου</div>${Q.own.map(q=>`<label class="pw-orow"><input type="checkbox" data-pwk="${esc(q.key)}" ${inScope(q.key)?'checked':''}><span>${esc(q.text)}</span><span class="pw-val" data-pwv="${esc(q.key)}" data-u="${esc(Scope.unitOf(q.key,S.sim))}">—</span></label>`).join('')}</div>`:'';
 const panes=scope.cfg.panes.map((p,i)=>`<option value="${i}" ${PW.to===String(i)?'selected':''}>στο Π${i+1}</option>`).join('');
 return `<div class="pw-head"><b>⌁ ${esc(lab)}</b><small class="muted">${esc(name)} · ${Q.pins.length} ακροδέκτες</small><button class="x" data-pwclose title="Κλείσιμο">✕</button></div>
  <div class="pw-legend"><span><b>V⏚</b> τάση του κόμβου προς γη</span><span><b>I</b> ρεύμα</span><span><b>V</b> τάση του στοιχείου</span><span><b>y</b> έξοδος σήματος</span><span class="muted">κλικ: στο scope ή έξω</span></div>
  <div class="pw-draw"><div></div>${col('top')}<div></div>${col('left')}<div class="pw-box"><b>${esc(lab)}</b><small>${esc(name)}</small></div>${col('right')}<div></div>${col('bottom')}<div></div></div>${own}
  <div class="pw-foot"><label>Νέα κανάλια <select data-pwto><option value="auto" ${PW.to==='auto'?'selected':''}>αυτόματα, κατά μονάδα</option>${panes}<option value="new" ${PW.to==='new'?'selected':''}>σε νέο παράθυρο</option></select></label>
   <button data-pwall="v" title="Οι τάσεις όλων των ακροδεκτών">+ Όλες οι τάσεις</button><button data-pwall="i" title="Τα ρεύματα όλων των ακροδεκτών">+ Όλα τα ρεύματα</button><button data-pwnone title="Κάθε κανάλι αυτού του στοιχείου έξω από το scope">− Κανένα</button></div>`;}
function pinScopeTick(){const w=$('#pin-scope');if(!w||w.hidden){clearInterval(PW.timer);PW.timer=0;return;}
 if(PW.id&&(!editor.comp(PW.id)||S.pfx!==PW.pfx)){closePinScope();return;}       // the part went (deleted), or another level of the circuit
 {const sel=w.querySelector('[data-pwto]'),n=scope.cfg.panes.length;if(sel&&+sel.dataset.n!==n){sel.dataset.n=n;if(/^\d+$/.test(PW.to)&&+PW.to>=n)PW.to='auto';
  sel.innerHTML=`<option value="auto">αυτόματα, κατά μονάδα</option>${scope.cfg.panes.map((p,i)=>`<option value="${i}">στο Π${i+1}</option>`).join('')}<option value="new">σε νέο παράθυρο</option>`;sel.value=PW.to;}}
 for(const e of w.querySelectorAll('[data-pwv]')){const v=liveVal(e.dataset.pwv);const t=Number.isFinite(v)?eng(v,e.dataset.u||'',4):'—';if(e.textContent!==t)e.textContent=t;}
 for(const e of w.querySelectorAll('[data-pwk]')){const on=inScope(e.dataset.pwk);if(e.type==='checkbox'){if(e.checked!==on)e.checked=on;}else if(e.classList.contains('on')!==on){e.classList.toggle('on',on);e.setAttribute('aria-pressed',String(on));}}}
function openPinScope(id){const c=editor.comp(id);if(!c)return;let w=$('#pin-scope');
 if(!w){w=document.createElement('div');w.id='pin-scope';w.className='pinscope';w.setAttribute('role','dialog');w.hidden=true;document.body.appendChild(w);
  w.addEventListener('click',e=>{const t=e.target;if(t.closest('[data-pwclose]')){closePinScope();return;}
   const k=t.closest('button[data-pwk]');if(k){scopeToggle(k.dataset.pwk,undefined,PW.to);pinScopeTick();return;}
   const all=t.closest('[data-pwall]');if(all){const Q=pinScopeOf(editor.comp(PW.id)||{type:'R'}),to=PW.to==='new'?String(scope.cfg.panes.length):PW.to;
    for(const q of Q.pins)for(const g of q.sig)if((all.dataset.pwall==='v'?/^V/:/^I/).test(g.pre)&&!inScope(g.key))scopeToggle(g.key,undefined,to);pinScopeTick();return;}
   if(t.closest('[data-pwnone]')){const Q=pinScopeOf(editor.comp(PW.id));for(const g of [...Q.pins.flatMap(q=>q.sig),...Q.own])if(inScope(g.key))scope.removeChannel(g.key);renderChannels();draw(true);pinScopeTick();}});
  w.addEventListener('change',e=>{const t=e.target;if(t.matches('input[data-pwk]')){if(t.checked!==inScope(t.dataset.pwk))scopeToggle(t.dataset.pwk,undefined,PW.to);pinScopeTick();}else if(t.matches('[data-pwto]'))PW.to=t.value;});}
 PW.id=id;PW.pfx=S.pfx;w.innerHTML=pinScopeHtml(pinScopeOf(c));const first=w.hidden;w.hidden=false;
 // the first time: as wide as its drawing (at most the screen), at the right of the circuit; after that its kept size and place
 if(first&&!w._wfr){const kept=WinFrame?.size?.('pinscope');if(!kept){w.style.width='auto';const need=Math.max(w.querySelector('.pw-draw').scrollWidth,w.querySelector('.pw-foot').scrollWidth)+4,r=editor.holder.getBoundingClientRect(),ww=Math.min(innerWidth-16,Math.max(460,need));
  w.style.width=ww+'px';w.style.left=Math.max(8,Math.min(innerWidth-ww-8,r.right-ww-16))+'px';w.style.top=Math.max(8,r.top+16)+'px';}}
 if(window.WinFrame)WinFrame.frame(w,{key:'pinscope',head:'.pw-head',move:true,place:true,minW:420,minH:220});
 pinScopeTick();if(!PW.timer)PW.timer=setInterval(pinScopeTick,300);}
function closePinScope(){const w=$('#pin-scope');if(w)w.hidden=true;PW.id=null;clearInterval(PW.timer);PW.timer=0;}

// ------------------------------------------------------------------ hover readout on the schematic
let hoverComp=null,hoverPos=[0,0];
function updateHover(){const tip=$('#tip');if(!hoverComp||!S.sim||S.pfx===null){tip.hidden=true;return;}const c0=editor.comp(hoverComp),c=c0&&{...c0,id:pid(c0.id)};if(!c||['JUNC','GND','TAGO','TAGI','SUB','PORT','SIN','SOUT'].includes(c.type)){tip.hidden=true;return;}
 const s=S.sim;let html=`<b>${esc(c.label||c.id)}</b>`;
 if(c.type==='PWM')html+=`<div>D = ${fmt(s.now('D:'+c.id),5)} · φέρον c = ${fmt(s.now('CAR:'+c.id),4)}</div>${c.params.mode==='pi'?`<div>ref ${eng(s.now('REF:'+c.id))} · μέτρ. ${eng(s.now('MEAS:'+c.id))}</div>`:''}`;
 else if(c.type==='DCM'){const rows=[['ω','Y:'+c.id,'rad/s'],['τ_e','Y:'+c.id+':te','N·m'],['i_a','I:'+c.id,'A'],['v_a','V:'+c.id,'V']];
  html+='<table>'+rows.map(([n,k,u])=>`<tr><td>${n}</td><td>${eng(s.now(k),u)}</td><td class="muted">⌀ ${eng(s.lastPeriod(k)?.avg,u)}</td></tr>`).join('')+'</table>';}
 else if(P.BLOCKS.has(c.type)){const b=s.net.compInfo.get(c.id)?.blk;const u=blkUnit(c);const os=OUT_SYM[c.type]?outsOf(c):null;
  html+=os?`<div>${os.map((o,k)=>OUT_SYM[c.type][o]+' = '+eng(s.now('Y:'+c.id+(k?':'+o:'')),blkUnit(c,o),5)).join(' · ')}</div>`:`<div>${c.type==='DISP'?'τιμή':'έξοδος'} ${eng(s.now('Y:'+c.id),u,5)}</div>`;
  if(b){const ins=Object.entries(b.ins).map(([k,n])=>`${k} = ${n>=0?eng(s.sv[n],'',4):'—'}`);if(ins.length)html+=`<div class="muted">${ins.join(' · ')}</div>`;}}
 else if(c.type==='SH'){const q=s.shById.get(c.id),u=q?.sig?'':q?.qty==='V'?'V':'A';html+=q?`<div>κρατημένη τιμή ${eng(q.h,u)}</div><div>${q.n} δείγματα${q.log.t.length?` · τελευταίο στο ${eng(q.log.t[q.log.t.length-1],'s',5)}`:''}</div>`:'';}
 else{const lp=k=>s.lastPeriod(k);const rows=[['v','V:'+c.id,'V'],['i','I:'+c.id,'A'],['p','P:'+c.id,'W']];if(c.type==='SW'||c.type==='SCR')rows.unshift(['g','GS:'+c.id,'']);if(c.type==='XFMR')rows.push(['i_m','Im:'+c.id,'A'],['i₂','I2:'+c.id,'A']);
  html+='<table>'+rows.map(([n,k,u])=>`<tr><td>${n}</td><td>${eng(s.now(k),u)}</td><td class="muted">⌀ ${eng(lp(k)?.avg,u)}</td></tr>`).join('')+'</table>';}
 tip.innerHTML=html;tip.hidden=false;tip.style.left=(hoverPos[0]+16)+'px';tip.style.top=(hoverPos[1]+16)+'px';}

// ------------------------------------------------------------------ subcircuits (3.17, ROADMAP §9)
// The editor shows one level: the circuit, or a definition opened from an instance (S.nav). The simulation always runs on
// the whole project (fullDoc), so inside instance X1 the live values are those of X1 (S.pfx = 'X1/'). A definition
// opened from the library (no instance) has no live values (S.pfx = null). Leaving writes the definition back and
// copies its ports to the instances (SubCircuit.sync); the whole visit is one step of undo in the circuit.
const atTop=()=>!S.nav.length;
function topDoc(){return atTop()?editor.doc:S.top;}
function defsOf(){return topDoc().subcircuits||{};}
const pid=id=>(S.pfx||'')+id;
function fullDoc(){if(atTop())return editor.export();const top=JSON.parse(JSON.stringify(S.top)),cur=S.nav[S.nav.length-1],e=editor.export();
 top.subcircuits[cur.name]={...top.subcircuits[cur.name],components:e.components,wires:e.wires};return top;}
function commitView(){if(atTop())return;const cur=S.nav[S.nav.length-1],e=editor.export(),d=S.top.subcircuits[cur.name];if(!d)return;d.components=e.components;d.wires=e.wires;}
// the diagnostics of the flat circuit, for the level in the editor (X1/R1 → X1 in the circuit, → R1 inside X1)
function viewDiag(d){if(!d)return d;const pf=S.pfx;if(pf===null)return null;
 const rel=id=>{const r=pf?(id.startsWith(pf)?id.slice(pf.length):null):id;return r;};
 return {...d,skipped:d.skipped.map(x=>({...x,id:rel(x.id)?.split('/')[0]})).filter(x=>x.id),open:d.open.map(k=>{const i=k.lastIndexOf(':'),r=rel(k.slice(0,i));return r&&!r.includes('/')?r+k.slice(i):null;}).filter(Boolean)};}
// a part by path (X1/L1), with the label of the path and the values of that instance
function compAt(path){const parts=String(path).split('/'),defs=defsOf();let list=topDoc().components||[],c=null;const lbl=[];
 for(let i=0;i<parts.length;i++){c=list.find(k=>k.id===parts[i]);if(!c)return null;lbl.push(c.label||c.id);
  if(i<parts.length-1){if(window.NetLib&&NetLib.isLib(c.type)){list=NetLib.defOf(c).components;continue;}const d=c.type==='SUB'&&defs[c.params?.def];if(!d)return null;list=SubC.innerParts(d,c);}}
 return {...c,label:lbl.join('/')};}
// every part of the circuit, inside instances too: [{c, id (path), label}]
function allComps(){const doc=atTop()?editor.doc:fullDoc(),defs=doc.subcircuits||{},out=[];
 const walk=(list,pfx,lp,depth)=>{for(const c of list){if(c.type==='SUB'){const d=defs[c.params?.def];if(d&&depth<8)walk(SubC.innerParts(d,c),pfx+c.id+'/',lp+(c.label||c.id)+'/',depth+1);continue;}
  // a part of the network library (4.1): its channels are those of the parts of its generated definition (e.g. F1/Ia)
  if(window.NetLib&&NetLib.isLib(c.type)){out.push({c,id:pfx+c.id,label:lp+(c.label||c.id)});walk(NetLib.defOf(c).components.filter(k=>k.type==='AM'||k.type==='XFMR'||k.type==='R'||k.type==='L'||k.type==='C'),pfx+c.id+'/',lp+(c.label||c.id)+'/',depth+1);continue;}
  out.push({c,id:pfx+c.id,label:lp+(c.label||c.id)});}};
 walk(doc.components||[],'','',0);return out;}
// parameters of a part for the forms: an instance has the public parameters of its definition
function partDef(c){if(c?.type!=='SUB')return P.PARTS[c?.type];const d=defsOf()[c.params?.def];
 return {name:'Υποκύκλωμα «'+(d?.title||c.params?.def||'?')+'»',params:(d?.params||[]).map(pp=>({k:pp.k,label:pp.label||pp.k,unit:pp.unit||'',type:pp.type||'num',options:pp.options,def:pp.def,hint:pp.hint}))};}
function pdefaults(c){if(c.type!=='SUB')return P.defaults(c.type);const o={def:''};for(const d of partDef(c).params)o[d.k]=d.def;return o;}
function subParams(name){const d=defsOf()[name];if(!d)return null;return {def:name,$ports:SubC.portsOf(d),$title:String(d.title||name)};}
// a definition cannot contain itself, directly or through another
function placeOk(t){if(t.type!=='SUB'||atTop())return true;const cur=S.nav[S.nav.length-1].name,cl=SubC.closure({subcircuits:defsOf()},t.params?.def);
 if(t.params?.def===cur||cl[cur]){notice(`Το υποκύκλωμα «${esc(t.params?.def)}» δεν μπαίνει μέσα στο «${esc(cur)}»: θα περιείχε τον εαυτό του.`,'error');setTimeout(()=>notice(''),4000);return false;}return true;}
function renameChannels(f){for(const pn of scope.cfg.panes)for(const ch of pn.ch){const [pre,...rest]=ch.key.split(':');const id=rest[0],n=f(id);if(n&&n!==id){rest[0]=n;ch.key=[pre,...rest].join(':');ch.label=chanLabel(ch.key);}}renderChannels();}
// the open level as a document with the definitions (inside a definition: its parts + the project's definitions)
function levelDoc(){const e=editor.export();return atTop()?e:{...e,subcircuits:JSON.parse(JSON.stringify(S.top.subcircuits||{}))};}
function applyLevel(pr,sel){if(atTop()){editor.replaceDoc(pr,sel);return;}const {subcircuits,...rest}=pr;S.top.subcircuits=subcircuits;delete rest.solve;editor.replaceDoc(rest,sel);}
function groupSel(){const sel=editor.selection().c;
 if(!sel.length){notice('Διάλεξε πρώτα τα στοιχεία του υποκυκλώματος (κλικ ή ορθογώνιο), και μετά Ctrl+G.','info');setTimeout(()=>notice(''),3000);return;}
 let r;try{r=SubC.create(levelDoc(),sel);}catch(e){notice(esc(e.message),'error');return;}
 applyLevel(r.project,[r.id]);const pf=S.pfx||'';if(S.pfx!==null)renameChannels(id=>{const h=id.startsWith(pf)?id.slice(pf.length):null;if(h===null)return id;const head=h.split('/')[0];return r.moved.has(head)?pf+r.id+'/'+h:id;});
 renderPalette();notice(`Νέο υποκύκλωμα ${esc(r.id)} (ορισμός «${esc(r.name)}», ${r.project.subcircuits[r.name].components.filter(c=>SubC.PORT_KIND[c.type]).length} θύρες). Διπλό κλικ για να το ανοίξεις.`,'info');setTimeout(()=>notice(''),5000);}
function expandSub(id){let r;try{r=SubC.expand(levelDoc(),id);}catch(e){notice(esc(e.message),'error');return;}
 applyLevel(r.project,[...r.ids.values()]);const pf=pid(id)+'/';if(S.pfx!==null)renameChannels(k=>{if(!k.startsWith(pf))return k;const rest=k.slice(pf.length),h=rest.split('/')[0];return r.ids.has(h)?(S.pfx||'')+r.ids.get(h)+rest.slice(h.length):k;});
 notice(`Το ${esc(id)} έγινε ανοιχτό κύκλωμα (${r.ids.size} στοιχεία). Ο ορισμός μένει στη βιβλιοθήκη του project.`,'info');setTimeout(()=>notice(''),4000);}
// 4.9.1 (ROADMAP §52): a library part becomes an ordinary subcircuit with the same inner parts, names and channels
function libToSub(id){window.Inside?.close();let r;try{r=SubC.fromLib(levelDoc(),id);}catch(e){notice(esc(e.message),'error');return;}
 applyLevel(r.project,[id]);renderPalette();renderProps();notice(`Το ${esc(id)} έγινε υποκύκλωμα (ορισμός «${esc(r.name)}»): διπλό κλικ για να το ανοίξεις και να το αλλάξεις. Ίδιο κύκλωμα, ίδια κανάλια· οι παράμετροί του είναι πλέον οι τιμές των στοιχείων μέσα.${r.frozen?.length?` Οι εκφράσεις (${esc(r.frozen.join(', '))}) μπήκαν με τις τιμές τους τώρα.`:''}${r.lost?.length?` Οι είσοδοι πάνω του (${esc(r.lost.join(', '))}) καταργήθηκαν.`:''}`,'info');setTimeout(()=>notice(''),6000);}
function uniqueSub(id){let r;try{r=SubC.makeUnique(levelDoc(),id);}catch(e){notice(esc(e.message),'error');return;}applyLevel(r.project,[id]);renderPalette();renderProps();}
function subMenu(c){const name=c.params?.def,inner=S.pfx===null?[]:allComps().filter(x=>x.id.startsWith(pid(c.id)+'/'));
 return ['-',{t:'⧉ Άνοιγμα του υποκυκλώματος',k:'διπλό κλικ',f:()=>enterSub(name,S.pfx===null?null:pid(c.id))},{t:'Ανάπτυξη σε ανοιχτό κύκλωμα',k:'Ctrl+Shift+G',f:()=>expandSub(c.id)},
  {t:'Δικός του ορισμός (αντίγραφο)',f:()=>uniqueSub(c.id)},...inner.slice(0,6).flatMap(x=>signalsFor(x.c).slice(0,1).map(([pre,n,f])=>({t:`⌁ Scope: ${n} ${x.label}`,f:()=>addProbe(pre+x.id+(f||''))})))];}
// open a definition (inst = path of the instance, or null for the definition only)
function enterSub(name,inst){const d=defsOf()[name];if(!d){notice(`Δεν υπάρχει ο ορισμός «${esc(name)}».`,'error');return;}
 closeInspector();closeMenu();
 if(atTop()){S.top=editor.export();S.topUndo={u:editor.undoStack.slice(),r:editor.redoStack.slice(),before:editor.snapshot(),view:{...editor.view},user:editor.userView};}else commitView();
 S.nav.push({name,inst});S.pfx=inst?inst+'/':null;
 editor.load({components:S.top.subcircuits[name].components||[],wires:S.top.subcircuits[name].wires||[],version:S.top.version});
 if(S.sim)editor.setDiag(viewDiag(S.sim.net.diag));renderCrumbs();renderPalette();refreshControls();renderProps();editor.svg.focus({preventScroll:true});}
function leaveSub(level=0){if(atTop())return;commitView();while(S.nav.length>level)S.nav.pop();SubC.sync(S.top);
 if(atTop()){const top=S.top,u=S.topUndo;S.top=null;S.pfx='';editor.load(top,{keepView:true});
  if(u){editor.undoStack=u.u;editor.redoStack=u.r;if(editor.snapshot()!==u.before){editor.undoStack.push(u.before);editor.redoStack=[];}editor.view=u.view;editor.userView=u.user;editor.applyView();}
  S.topUndo=null;}
 else{const cur=S.nav[S.nav.length-1];S.pfx=cur.inst?cur.inst+'/':null;const d=S.top.subcircuits[cur.name];editor.load({components:d.components||[],wires:d.wires||[],version:S.top.version});}
 renderCrumbs();renderPalette();buildSim(false);renderChannels();if(atTop()&&S.theory)runTheory();}
function renderCrumbs(){let b=$('#crumbs');if(!b){b=document.createElement('nav');b.id='crumbs';b.className='crumbs';b.setAttribute('aria-label','Επίπεδα υποκυκλωμάτων');$('#canvas').appendChild(b);}
 window.Watch?.render(); // the tiles over the drawing: only at the top level (4.8)
 if(atTop()){b.hidden=true;b.innerHTML='';return;}b.hidden=false;const defs=defsOf();
 const cur=S.nav[S.nav.length-1],n=SubC.instances({...S.top,subcircuits:defs},cur.name).length;
 b.innerHTML=`<button data-lvl="0" title="Πίσω στο κύκλωμα">⌂ Κύκλωμα</button>`+S.nav.map((x,i)=>`<span>›</span><button data-lvl="${i+1}" ${i===S.nav.length-1?'aria-current="true"':''}>${esc(x.inst?x.inst.split('/').pop():'ορισμός')} · ${esc(defs[x.name]?.title||x.name)}</button>`).join('')+
  `<span class="crumb-note">${n>1?`κοινός ορισμός: οι αλλαγές εδώ ισχύουν και στα ${n} instances`:'αλλαγές στον ορισμό του υποκυκλώματος'}${S.pfx===null?' · χωρίς ζωντανές τιμές (ανοιχτό από τη βιβλιοθήκη)':''}</span><button data-lvl="${S.nav.length-1}" title="Ένα επίπεδο πάνω">↑ Έξοδος</button>`;
 b.querySelectorAll('[data-lvl]').forEach(x=>x.onclick=()=>{const l=+x.dataset.lvl;if(l<S.nav.length)leaveSub(l);});}
// the public parameters of a definition: which inner (part, parameter) each one sets
function curDef(){return atTop()?null:S.top.subcircuits[S.nav[S.nav.length-1].name];}
function publicOf(cid){const d=curDef(),m=new Map();for(const pp of d?.params||[])for(const [c,k] of pp.bind||[])if(c===cid)m.set(k,pp.k);return m;}
function togglePublic(cid,k){const d=curDef();if(!d)return;const c=editor.comp(cid),pd=P.PARTS[c?.type]?.params.find(x=>x.k===k);if(!c||!pd)return;d.params=d.params||[];
 const has=d.params.find(pp=>(pp.bind||[]).some(([a,b])=>a===cid&&b===k));
 if(has){has.bind=has.bind.filter(([a,b])=>!(a===cid&&b===k));if(!has.bind.length)d.params=d.params.filter(pp=>pp!==has);}
 else{const same=d.params.find(pp=>pp.k===k&&(pp.type||'num')===pd.type);
  if(same)same.bind.push([cid,k]);
  else{let key=k;const used=new Set(d.params.map(pp=>pp.k));if(used.has(key)||!SubC.okName(key))key=cid+'_'+k;
   d.params.push({k:key,label:`${pd.label} (${c.label||cid})`,unit:pd.unit||'',type:pd.type,...(pd.options?{options:pd.options}:{}),def:c.params[k]??pd.def,bind:[[cid,k]]});}}
 buildSim(false);saveLocal();renderProps();}
function propsSub(c){const d=defsOf()[c.params?.def],own=Object.entries(c.params||{}).filter(([k])=>k.includes('.')&&!k.startsWith('$'));
 const n=SubC.instances({...topDoc(),subcircuits:defsOf()},c.params?.def).length;
 let h=psec('p-sub','Υποκύκλωμα',`<div class="prow"><span>Ορισμός</span><span class="pin-in"><select data-subdef>${Object.entries(defsOf()).map(([k,v])=>`<option value="${esc(k)}" ${k===c.params?.def?'selected':''}>${esc(v.title||k)}</option>`).join('')}${d?'':`<option selected>${esc(c.params?.def||'—')} (λείπει)</option>`}</select></span></div>
  ${d?`<p class="small muted">${esc(d.desc||'')}${d.desc?' · ':''}έκδοση ${esc(d.version||'1')} · ${(d.components||[]).filter(k=>SubC.PORT_KIND[k.type]).length} θύρες · ${n} instance${n>1?'s':''} στο project</p>`:'<p class="small bad">Ο ορισμός λείπει από το project: το υποκύκλωμα μένει εκτός επίλυσης.</p>'}
  <div class="chips"><button class="chip" data-subopen>⧉ Άνοιγμα</button><button class="chip" data-subexp title="Ctrl+Shift+G">Ανάπτυξη</button>${n>1?'<button class="chip" data-subuniq title="Αντίγραφο του ορισμού μόνο για αυτό το instance">Δικός του ορισμός</button>':''}</div>`,{def:true});
 if(d&&!(d.params||[]).length)h+='<p class="muted small">Χωρίς δημόσιες παραμέτρους. Μέσα στο υποκύκλωμα, το ⤴ δίπλα σε μια παράμετρο την κάνει δημόσια.</p>';
 if(own.length)h+=psec('p-subown','Τιμές μόνο για αυτό το instance',own.map(([k,v])=>`<div class="prow"><span>${esc(k)}</span><span class="pin-in"><input data-subown="${esc(k)}" value="${esc(v)}"><button class="pinbtn" data-subdel="${esc(k)}" title="Αφαίρεση (ισχύει η τιμή του ορισμού)">✕</button></span></div>`).join('')+'<small class="muted">Από σενάριο ή <code>p.set("X1/L1.L", …)</code>. Υπερισχύουν των δημόσιων παραμέτρων.</small>',{cnt:own.length});
 return h;}
function bindSub(box,c){if(c?.type!=='SUB')return;const id=c.id;
 box.querySelector('[data-subopen]')?.addEventListener('click',()=>enterSub(c.params.def,S.pfx===null?null:pid(id)));
 box.querySelector('[data-subexp]')?.addEventListener('click',()=>expandSub(id));
 box.querySelector('[data-subuniq]')?.addEventListener('click',()=>uniqueSub(id));
 box.querySelector('[data-subdef]')?.addEventListener('change',e=>{const q=subParams(e.target.value);if(q&&placeOk({type:'SUB',params:q}))editor.setParams(id,q);renderProps();});
 box.querySelectorAll('[data-subown]').forEach(el=>el.onchange=()=>{const v=el.value.trim(),x=P.parseEng(v);editor.setParams(id,{[el.dataset.subown]:v!==''&&Number.isFinite(x)&&/^[-+0-9.eE]+$/.test(v)?x:v});});
 box.querySelectorAll('[data-subdel]').forEach(b=>b.onclick=()=>{editor.remember();delete editor.comp(id).params[b.dataset.subdel];editor.changed('param');renderProps();});}
// nothing selected inside a definition: the definition itself
function propsDef(){const name=S.nav[S.nav.length-1].name,d=curDef(),ports=SubC.portsOf({components:editor.doc.components}),n=SubC.instances({...S.top,subcircuits:S.top.subcircuits},name).length;
 const KIND={el:'ηλεκτρική',in:'είσοδος σήματος',out:'έξοδος σήματος'},SIDE={l:'αριστερά',r:'δεξιά',t:'πάνω',b:'κάτω'};
 let h=`<div class="props-head"><div><small>Ορισμός υποκυκλώματος «${esc(name)}»</small><input data-dk="title" value="${esc(d.title||name)}" aria-label="Τίτλος"></div><button class="x" data-subup title="Έξοδος από το υποκύκλωμα">↑</button></div>`;
 h+=psec('d-main','Ορισμός',`<div class="prow"><span>Περιγραφή</span><span class="pin-in"><input data-dk="desc" value="${esc(d.desc||'')}"></span></div><div class="prow"><span>Έκδοση</span><span class="pin-in"><input data-dk="version" value="${esc(d.version||'1')}"></span></div>
  <p class="small muted">${n} instance${n===1?'':'s'} στο project. Οι αλλαγές στα στοιχεία και στα σύρματα ισχύουν σε όλα.</p>`,{def:true});
 h+=psec('d-ports','Θύρες (ακροδέκτες του συμβόλου)',ports.length?`<ul class="diag-list">${ports.map(p=>`<li><button data-focus="${esc(p.id)}">${esc(p.name)}</button><span class="muted">${KIND[p.kind]} · ${SIDE[p.side]}</span></li>`).join('')}</ul>`:'<p class="small muted">Καμία θύρα. Βάλε θύρες από την ομάδα «Υποκυκλώματα» της παλέτας: ηλεκτρική, είσοδος ή έξοδος σήματος.</p>',{def:true,cnt:ports.length});
 const pp=d.params||[];
 h+=psec('d-pub','Δημόσιες παράμετροι',(pp.length?pp.map((q,i)=>`<div class="prow"><span><input data-pp="${i}" data-pf="label" value="${esc(q.label||q.k)}" aria-label="Ετικέτα"> <em>${esc(q.unit||'')}</em></span><span class="pin-in"><input data-pp="${i}" data-pf="def" value="${esc(q.def??'')}" aria-label="Προεπιλογή" title="Προεπιλογή"><button class="pinbtn" data-ppdel="${i}" title="Αφαίρεση">✕</button></span>
   <small>όνομα <input class="pp-k" data-pp="${i}" data-pf="k" value="${esc(q.k)}" aria-label="Όνομα"> → ${(q.bind||[]).map(([c,k])=>esc(c+'.'+k)).join(', ')||'—'}</small></div>`).join(''):'<p class="small muted">Καμία. Διάλεξε ένα στοιχείο και πάτα ⤴ δίπλα σε μια παράμετρό του: γίνεται δημόσια και αλλάζει χωριστά σε κάθε instance. Ίδιο όνομα σε δύο στοιχεία = μία κοινή παράμετρος.</p>'),{def:true,cnt:pp.length});
 // 3.19 (question 3 of 3.17): what this definition takes from outside it. It keeps working; a signal source can become a
 // port, a reference (PWM, clock, sensor) a public parameter, so that an exported definition does not depend on the project
 const ext=SubC.externalRefs({subcircuits:{[name]:{components:editor.doc.components}}},name);
 if(ext.length)h+=psec('d-ext','Αναφορές προς τα έξω',`<ul class="diag-list">${ext.map(r=>`<li><button data-focus="${esc(r.id)}">${esc(r.id)}</button>${esc(r.kind==='in'?'είσοδος '+r.k.slice(3):r.k)} → ${esc(r.ref)} ${r.kind==='in'?`<button class="chip" data-refport="${esc(r.id+'|'+r.k)}" title="Θύρα του ορισμού στη θέση της αναφοράς· κάθε instance παίρνει την ίδια πηγή στη νέα του είσοδο">→ θύρα</button>`:`<button class="chip" data-refpub="${esc(r.id+'|'+r.k)}" title="Δημόσια παράμετρος: κάθε instance διαλέγει το δικό του">⤴ δημόσια</button>`}</li>`).join('')}</ul><small class="muted">Βρίσκονται πρώτα μέσα στον ορισμό και μετά έξω. Ένας ορισμός που εξάγεται τις χρειάζεται στο νέο project.</small>`,{cnt:ext.length});
 h+=`<div class="chips"><button class="chip" data-subup>↑ Έξοδος</button><button class="chip" data-subexport title="Ο ορισμός (και όσοι χρησιμοποιεί) σε αρχείο, για άλλο project">⇩ Εξαγωγή ορισμού</button></div>`;
 return h;}
function bindDef(box){const d=curDef();if(!d)return;const name=S.nav[S.nav.length-1].name,redo=()=>{buildSim(false);saveLocal();renderCrumbs();renderProps();};
 box.querySelectorAll('[data-subup]').forEach(b=>b.onclick=()=>leaveSub(S.nav.length-1));
 box.querySelector('[data-subexport]')?.addEventListener('click',()=>exportDef(name));
 box.querySelectorAll('[data-refpub]').forEach(b=>b.onclick=()=>{const [id,k]=b.dataset.refpub.split('|');togglePublic(id,k);redo();});
 box.querySelectorAll('[data-refport]').forEach(b=>b.onclick=()=>{const [id,k]=b.dataset.refport.split('|');commitView();
  try{const r=SubC.refToPort(S.top,name,id,k);S.top=r.project;const nd=S.top.subcircuits[name];editor.load({components:nd.components||[],wires:nd.wires||[],version:S.top.version},{keepView:true});notice(`Νέα θύρα «${esc(r.port)}»· κάθε instance παίρνει την ίδια πηγή στην είσοδό του.`,'info');}
  catch(e){notice(esc(e.message),'error');return;}redo();});
 box.querySelectorAll('[data-dk]').forEach(el=>el.onchange=()=>{d[el.dataset.dk]=el.value;redo();renderPalette();});
 box.querySelectorAll('[data-pp]').forEach(el=>el.onchange=()=>{const q=d.params[+el.dataset.pp],f=el.dataset.pf;let v=el.value.trim();
  if(f==='k'){if(!SubC.okName(v)||d.params.some(x=>x!==q&&x.k===v)){el.classList.add('bad');return;}
   // the instances keep their values under the new name
   for(const {comp} of SubC.instances({...S.top,subcircuits:S.top.subcircuits},name))if(comp.params&&q.k in comp.params){comp.params[v]=comp.params[q.k];delete comp.params[q.k];}}
  if(f==='def'&&(q.type||'num')==='num'){const x=P.parseEng(v);if(!Number.isFinite(x)){el.classList.add('bad');return;}v=x;}
  q[f]=v;redo();});
 box.querySelectorAll('[data-ppdel]').forEach(b=>b.onclick=()=>{d.params.splice(+b.dataset.ppdel,1);redo();});}
// a definition as a file, with the definitions it uses (.pclsub.json), and back
function exportDef(name){const all={...topDoc(),subcircuits:defsOf()};if(!atTop()){const e=editor.export();all.subcircuits={...all.subcircuits,[S.nav[S.nav.length-1].name]:{...curDef(),components:e.components,wires:e.wires}};}
 download(name+'.pclsub.json',JSON.stringify({pcl:'subcircuit',version:1,name,subcircuits:SubC.closure(all,name)},null,1));}
function importDefs(text){const q=JSON.parse(text);if(q?.pcl!=='subcircuit'||!q.subcircuits)throw new Error('Δεν είναι αρχείο υποκυκλώματος (.pclsub.json).');
 const defs=atTop()?(editor.doc.subcircuits=editor.doc.subcircuits||{}):(S.top.subcircuits=S.top.subcircuits||{}),ren=new Map();if(atTop())editor.remember();
 for(const k of Object.keys(q.subcircuits)){let n=k;for(let i=2;defs[n];i++)n=k+'_'+i;ren.set(k,n);}
 for(const [k,d] of Object.entries(q.subcircuits)){for(const c of d.components||[])if(c.type==='SUB'&&ren.has(c.params?.def))c.params.def=ren.get(c.params.def);defs[ren.get(k)]=d;}
 renderPalette();saveLocal();return ren.get(q.name)||[...ren.values()][0];}

// ------------------------------------------------------------------ palette
// the library (4.6, decision 55): one taxonomy at a time (select above the list, remembered), groups and subgroups that
// open and close (remembered per taxonomy), the search above all of them (it opens every group), ☆ favourites and recent
// parts (in this browser). The groups come from library.js (Library.view); the subcircuits of the project come last.
const PAL={tax:'field',open:{},fav:[],recent:[]};
function palLoad(){try{const o=JSON.parse(localStorage.getItem('pcl-library')||'{}');if(o.tax&&Library.TAX.some(t=>t.id===o.tax))PAL.tax=o.tax;PAL.open=o.open||{};PAL.fav=Array.isArray(o.fav)?o.fav:[];PAL.recent=Array.isArray(o.recent)?o.recent:[];}catch{}}
function palSave(){try{localStorage.setItem('pcl-library',JSON.stringify({tax:PAL.tax,open:PAL.open,fav:PAL.fav,recent:PAL.recent}));}catch{}}
function palRecent(t){if(!P.PARTS[t])return;PAL.recent=[t,...PAL.recent.filter(x=>x!==t)].slice(0,12);palSave();if(PAL.tax==='mine')renderPalette();}
function palItem(k,d){const fav=PAL.fav.includes(k);return `<div class="pal-row"><button class="pal-item" draggable="true" data-part="${k}" title="${esc(d.name)} · κλικ και μετά κλικ στον καμβά, ή σύρσιμο"><svg viewBox="-42 -42 84 84"><g class="sym">${P.symHV?P.symHV(P.phaseSplit(k,d.draw(P.defaults(k)))):d.draw(P.defaults(k))}</g></svg><span>${esc(d.name)}</span></button><button class="pal-fav${fav?' on':''}" data-fav="${k}" title="${fav?'Αφαίρεση από τα αγαπημένα':'Στα αγαπημένα'}" aria-pressed="${fav}">${fav?'★':'☆'}</button></div>`;}
// 4.7: the library is rebuilt only when what it shows changed (search, taxonomy, favourites, recent, open groups, the
// project's subcircuits); every tutorial and every change used to draw all the symbols again (≈ 5 ms each)
let palKey='';
function renderPalette(){const q=($('#pal-search').value||'').trim();
 {const k=JSON.stringify([q,PAL.tax,PAL.fav,PAL.recent,PAL.open[PAL.tax]||null,defsOf(),P.symStyle?.()]);if(k===palKey&&$('#palette-list').childElementCount)return;palKey=k;}
 const sel=$('#pal-tax');if(sel&&!sel.options.length)sel.innerHTML=Library.TAX.map(t=>`<option value="${t.id}">${esc(t.title)}</option>`).join('');if(sel)sel.value=PAL.tax;
 // subcircuits of the project (3.17): one item per definition, plus import of a definition file
 const ql=q.toLowerCase(),defs=Object.entries(defsOf()).filter(([k,d])=>!ql||String(d.title||k).toLowerCase().includes(ql)||k.toLowerCase().includes(ql)||'υποκύκλωμα'.includes(ql));
 const subItems=defs.map(([k,d])=>{const pr=subParams(k),L=P.subLayout(pr.$ports),sc=Math.min(1,84/(2*L.W+30),84/(2*L.H+30));
  return `<div class="pal-row"><button class="pal-item" draggable="true" data-part="SUB:${esc(k)}" title="Υποκύκλωμα «${esc(d.title||k)}» · κλικ και μετά κλικ στον καμβά, ή σύρσιμο"><svg viewBox="-42 -42 84 84"><g class="sym" transform="scale(${sc})">${P.PARTS.SUB.draw(pr)}</g></svg><span>${esc(d.title||k)}</span></button></div>`;}).join('')+(q?'':`<button class="pal-item pal-import" data-subimport title="Ορισμός υποκυκλώματος από αρχείο .pclsub.json"><span>⇧ Εισαγωγή ορισμού…</span></button>`);
 const groups=Library.view(PAL.tax,P.PARTS,{q,fav:PAL.fav,recent:PAL.recent});const op=PAL.open[PAL.tax]||{};
 const isOpen=(key,i)=>q?true:key in op?op[key]:(PAL.tax==='field'?i<2:PAL.tax==='course'?i<1:true);
 let h=groups.map((g,i)=>{const key=g.title;const body=g.sub.map(s=>{const items=s.items.map(k=>palItem(k,P.PARTS[k])).join('')||(g.empty?`<p class="muted small pal-empty">${esc(g.empty)}</p>`:'');
   if(!s.title)return items;const sk=key+'/'+s.title;return `<details class="pal-sub" data-pk="${esc(sk)}"${isOpen(sk,0)?' open':''}><summary>${esc(s.title)} <span class="muted">${s.items.length}</span></summary>${items}</details>`;}).join('');
  return `<details class="pal-group" data-pk="${esc(key)}"${isOpen(key,i)?' open':''}><summary>${esc(g.title)} <span class="muted">${g.n}</span></summary>${body}</details>`;}).join('');
 if(subItems)h+=`<details class="pal-group" data-pk="$subs"${isOpen('$subs',0)?' open':''}><summary>Υποκυκλώματα του project <span class="muted">${defs.length}</span></summary>${subItems}</details>`;
 $('#palette-list').innerHTML=h||'<p class="muted small pal-empty">Κανένα στοιχείο δεν ταιριάζει.</p>';
 $$('#palette-list details[data-pk]').forEach(d=>d.addEventListener('toggle',()=>{if(q)return;(PAL.open[PAL.tax]||(PAL.open[PAL.tax]={}))[d.dataset.pk]=d.open;palSave();palKey=JSON.stringify([q,PAL.tax,PAL.fav,PAL.recent,PAL.open[PAL.tax]||null,defsOf()]);}));
 $$('#palette-list [data-fav]').forEach(b=>b.onclick=e=>{e.stopPropagation();const k=b.dataset.fav;PAL.fav=PAL.fav.includes(k)?PAL.fav.filter(x=>x!==k):[...PAL.fav,k];palSave();renderPalette();});
 $$('.pal-item[data-part]').forEach(b=>{b.onclick=()=>{const t=b.dataset.part;if(t.startsWith('SUB:')){const pr=subParams(t.slice(4));if(!pr||!placeOk({type:'SUB',params:pr}))return;editor.beginPlace('SUB',pr);}else{editor.beginPlace(t);palRecent(t);}notice('Κλικ στον καμβά για τοποθέτηση · R περιστροφή · Esc ακύρωση','info');setTimeout(()=>notice(''),3500);};
  b.ondragstart=e=>{e.dataTransfer.setData('application/x-pcl-part',b.dataset.part);e.dataTransfer.effectAllowed='copy';if(!b.dataset.part.startsWith('SUB:'))palRecent(b.dataset.part);};});
 $('[data-subimport]')?.addEventListener('click',()=>{const f=document.createElement('input');f.type='file';f.accept='.json,application/json';f.onchange=async()=>{const x=f.files[0];if(!x)return;
  try{const n=importDefs(await x.text());notice(`Ο ορισμός «${esc(n)}» μπήκε στη βιβλιοθήκη του project (παλέτα, ομάδα «Υποκυκλώματα»).`,'info');setTimeout(()=>notice(''),4000);}catch(err){notice('Εισαγωγή: '+esc(err.message),'error');}};f.click();});}

// ------------------------------------------------------------------ tutorials
function tutorial(){return Tutorials.get(S.tut.id)||Tutorials.list[0];}
// Does the drawn circuit still match the tutorial whose theory is shown?
// Signature = set of parts (id=type) + partition of their pins into nets (junctions dropped, grounds merged).
function circuitSig(doc){
 const comps=(doc.components||[]).filter(c=>P.PARTS[c.type]),type=new Map(comps.map(c=>[c.id,c.type]));
 const par=new Map(),find=k=>{while(par.get(k)!==k){par.set(k,par.get(par.get(k)));k=par.get(k);}return k;};
 for(const c of comps)for(const p of Object.keys(P.pinsOf(c)))par.set(c.id+':'+p,c.id+':'+p);
 for(const w of doc.wires||[]){const a=w.a.c+':'+w.a.p,b=w.b.c+':'+w.b.p;if(par.has(a)&&par.has(b))par.set(find(a),find(b));}
 const g=comps.filter(c=>c.type==='GND');for(let i=1;i<g.length;i++)par.set(find(g[i].id+':g'),find(g[0].id+':g'));
 const groups=new Map();for(const k of par.keys()){const r=find(k);if(!groups.has(r))groups.set(r,[]);const t=type.get(k.split(':')[0]);if(t==='GND')groups.get(r).push('⏚');else if(t!=='JUNC')groups.get(r).push(k);}
 const parts=comps.filter(c=>c.type!=='JUNC'&&c.type!=='GND').map(c=>c.id+'='+c.type).sort();
 const nets=[...groups.values()].map(m=>[...new Set(m)].sort().join(',')).filter(x=>x&&x!=='⏚').sort();
 return {parts,nets,key:parts.join(';')+'|'+nets.join(' / ')};}
function tutorialRef(tut){const t=Tutorials.get(tut?.id);if(!t||tut.id==='empty')return null;const o={};for(const op of t.options)o[op.k]=tut.options?.[op.k]??op.def;try{const pr=t.build(o);if(pr.subcircuits)SubC.sync(pr);return circuitSig(pr);}catch{return null;}}
function theoryValidity(t){
 if(!t||!t.theory||!S.tutRef)return {ok:true};const cur=circuitSig(editor.doc);if(cur.key===S.tutRef.key)return {ok:true};
 if(t.theory==='v1'&&S.recognized===t.topology&&S.recognizedKey===cur.key&&['V1','C1','R1','PWM1',t.topology==='flyback'?'T1':'L1'].every(id=>editor.comp(id)))
  return {ok:true,note:'Η συνδεσμολογία διαφέρει από το tutorial, αλλά αναγνωρίζεται από τη συνδεσμολογία ως η ίδια τοπολογία, οπότε η θεωρία ισχύει.'};
 const rp=new Set(S.tutRef.parts),cp=new Set(cur.parts);
 return {ok:false,added:cur.parts.filter(x=>!rp.has(x)),removed:S.tutRef.parts.filter(x=>!cp.has(x))};}
function staleBanner(v){const nm=x=>{const [id,ty]=x.split('=');return `${esc(id)} – ${esc(P.PARTS[ty]?.name||ty)}`;};
 const what=[v.added.length?'προστέθηκαν '+v.added.map(nm).join(', '):'',v.removed.length?'αφαιρέθηκαν '+v.removed.map(nm).join(', '):''].filter(Boolean).join(' · ')||'άλλαξαν οι συνδέσεις';
 return `<div class="th-warn"><b>⚠ Το κύκλωμα δεν είναι πια αυτό του tutorial</b> (${what}). Οι σχέσεις και η σύγκριση παρακάτω αφορούν την αρχική τοπολογία και δεν ισχύουν για το κύκλωμα όπως είναι τώρα. Για το τωρινό κύκλωμα δες «Υπολογισμοί & μαθηματικά», που αναγνωρίζει τη συνδεσμολογία.<div class="row-btns"><button data-th-restore>↺ Επαναφορά κυκλώματος tutorial</button></div></div>`;}
function bindRestore(box){box.querySelector('[data-th-restore]')?.addEventListener('click',()=>loadTutorial(S.tut.id,S.tut.options,true));}
function loadTutorial(id,options={},keepView=false){
 const t=Tutorials.get(id);if(!t)return;const opts={};for(const o of t.options)opts[o.k]=options[o.k]??o.def;S.tut={id,options:opts};
 const pr=t.build(opts);if(pr.subcircuits)SubC.sync(pr);S.tutMeta=pr.meta||null;S.tutRef=circuitSig(pr);S.switching=true;try{applyProject(pr,keepView);}finally{S.switching=false;}renderTutorial();runTheory();runMath();
}
// an older file (no version or < 3) opens the same: wire names that would now join different nets get ·2, ·3 (3.18)
function migrateFile(pr){if(!window.Bus||Bus.namesJoin(pr))return pr;const m=Bus.migrateNames(pr);
 if(m.renamed.length)setTimeout(()=>notice('Αρχείο παλιότερης έκδοσης: από την 3.18 τα σύρματα με το ίδιο όνομα είναι ένας κόμβος. Για να μείνει ίδιο το κύκλωμα, άλλαξαν ονόματα: '+m.renamed.map(r=>esc((r.where?r.where+': ':'')+r.to.join(', '))).join(' · ')+'.','info'),0);
 return m.project;}
function applyProject(pr,keepView){window.Inside?.close();if(PW.id)closePinScope();
 pr=migrateFile(pr);pause();if(S.nav.length){S.nav=[];S.top=null;S.pfx='';}if(pr.subcircuits)SubC.sync(pr);editor.load(pr,{keepView});renderCrumbs();renderPalette();if(S.batch)clearBatch();
 const sim=pr.sim||{};if(sim.hDiv){const ss=$('#sim-step'),v=String(sim.hDiv);if(![...ss.options].some(o=>o.value===v))ss.add(new Option('T/'+v,v));ss.value=v;}if(sim.method){$('#method').value=sim.method;$('#method-note').textContent={TR:'2ης τάξης, χωρίς απόσβεση',BDF2:'2ης τάξης, απόσβεση στις υψηλές συχνότητες',BE:'1ης τάξης, ισχυρή απόσβεση'}[sim.method]||'';}setSpeed(sim.speed??100);S.stopT=sim.stopT||0;$('#stop').value=S.stopT?String(+(S.stopT*1e3).toPrecision(6)):'';
 {const rs=$('#rec-res'),v=String(+(sim.rec?.dt)||0);if(rs){if(![...rs.options].some(o=>o.value===v))rs.add(new Option('κάθε '+eng(+v,'s',3),v));rs.value=[...rs.options].find(o=>+o.value===+v)?.value??'0';}}
 buildSim(true);
 scope.yst=[];if(pr.scope?.cfg){scope.cfg=pr.scope.cfg;scope.cfg.frozen=null;}
 else{scope.cfg={panes:[{ch:[]}],window:pr.scope?.window||{unit:'T',n:20},trigger:'roll',display:'auto',frozen:null,cursors:[]};
  (pr.scope?.panes||[]).forEach((pane,pi)=>pane.forEach(([key,label])=>scope.addChannel(key,label,pi)));}
 if(typeof pr.scenario==='string')scenSetCode(pr.scenario);
 syncScopeInputs();renderChannels();refreshControls();closeInspector();saveLocal();draw(true);
}
function renderTutorial(){
 const t=tutorial();const o=S.tut.options;
 $('#tut-title').textContent=t.title;$('#tut-group').textContent=t.group;
 $('#tut-desc').textContent=t.desc;
 $('#tut-options').innerHTML=t.options.map(op=>`<label>${esc(op.label)}<select data-topt="${op.k}">${op.options.map(([k,n])=>`<option value="${k}" ${String(o[op.k])===k?'selected':''}>${esc(n)}</option>`).join('')}</select></label>`).join('');
 $$('#tut-options [data-topt]').forEach(s=>s.onchange=()=>{loadTutorial(t.id,{...S.tut.options,[s.dataset.topt]:s.value},true);});
 $('#tut-tasks').innerHTML=(t.tasks||[]).map(x=>`<li>${esc(x)}</li>`).join('');
 const link=t.theory==='v1'?`<a class="btn-link" href="/converter/" target="_blank" rel="noopener">Πλήρης αναλυτικός πάγκος DC-DC ↗</a>`:t.theory==='bidir'?`<a class="btn-link" href="/bidirectional/" target="_blank" rel="noopener">Πλήρης ανάλυση άσκησης PE2 (ερωτήματα 2–5, PLECS) ↗</a>`:'';
 $('#tut-links').innerHTML=link;$('#crumb').textContent=t.title;
}
function gallery(open=true){const g=$('#gallery');g.hidden=!open;if(!open)return;const groups=[...new Set(Tutorials.list.map(t=>t.group))];
 $('#gallery-body').innerHTML=groups.map(gr=>`<section><h3>${esc(gr)}</h3><div class="cards">${Tutorials.list.filter(t=>t.group===gr).map(t=>`<button class="card ${t.id===S.tut.id?'cur':''}" data-tut="${t.id}"><b>${esc(t.title)}</b><span>${esc(t.desc.split('. ')[0])}.</span></button>`).join('')}</div></section>`).join('');
 $$('#gallery [data-tut]').forEach(b=>b.onclick=()=>{gallery(false);loadTutorial(b.dataset.tut);});}

// ------------------------------------------------------------------ theory
let apiChain=Promise.resolve();
function api(action,data){const run=async()=>{const r=await fetch('/api/'+action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const j=await r.json();if(!r.ok)throw Error(j.error||'Σφάλμα');return j;};const p=apiChain.then(run,run);apiChain=p.catch(()=>{});return p;}
function paramsOf(id){const c=editor.comp(id);if(!c)return null;const p={...P.defaults(c.type),...c.params};
 // 4.17.1: a parameter «= …» as the number the solver computed from the inputs (the last build of the netlist)
 const der=S.sim?.net?.inputs?.derived;if(der)for(const d of der)if(d.id===id&&d.value!=null)p[d.k]=d.value;return p;}
function avgOver(key,n=20){const s=S.sim;if(!s)return null;const i=s.chIndex.get(key);const p=s.per;if(i===undefined||!p.n)return null;n=Math.min(n,p.n);let a=0,mn=Infinity,mx=-Infinity,q=0;
 for(let k=1;k<=n;k++){const j=(p.head-k+p.cap)%p.cap,o=j*p.nch+i;a+=p.avg[o];q+=p.rms[o]**2;mn=Math.min(mn,p.min[o]);mx=Math.max(mx,p.max[o]);}return {avg:a/n,rms:Math.sqrt(q/n),min:mn,max:mx,pp:mx-mn};}
// a simulated quantity for the prediction questions: {key, stat, periods, abs} on a channel, or samples of an S&H
function simValue(spec){const s=S.sim;if(!s||!spec||S.error)return null;
 if(spec.samples){const L=s.samples(spec.samples);if(!L)return null;const n=+spec.periods||0;if(n&&s.t<n*s.T-1e-12)return null;return n?L.t.filter(t=>t<n*s.T-1e-12).length:L.t.length;}
 if(spec.last){const L=s.samples(spec.last);return L&&L.v.length?L.v[L.v.length-1]:null;}
 if(spec.first){const L=s.samples(spec.first);return L&&L.t.length?L.t[0]:null;}
 if(spec.key){const q=avgOver(spec.key,+spec.periods||5);if(!q||(s.periodsDone||0)<3)return null;let v=q[spec.stat||'avg'];if(spec.abs)v=Math.abs(v);return v;}
 return null;}
function lastPP(key){const p=S.sim?.lastPeriod(key);return p?p.max-p.min:NaN;}
let theoryToken=0;
async function runTheory(){
 if(!atTop())return; // inside a subcircuit the parts of the tutorial are not in the editor (3.17)
 const t=tutorial(),box=$('#theory'),token=++theoryToken;box.innerHTML='<p class="muted">Υπολογισμός…</p>';
 try{
  if(t.theory==='v1'){const V=paramsOf('V1'),L=paramsOf(t.topology==='flyback'?'T1':'L1'),Cc=paramsOf('C1'),R=paramsOf('R1'),W=paramsOf('PWM1');
   const req={topology:t.topology,vin:Math.abs(+V.V),fs:+W.fs,L:t.topology==='flyback'?+L.Lm:+L.L,C:+Cc.C,n:t.topology==='flyback'?+L.n:.5,drive:'fixed_duty',duty_set:+W.D,resistance:+R.R,load:'resistive'};
   const r=await api('analyze',req);if(token!==theoryToken)return;S.theory={kind:'v1',r,req};}
  else if(t.theory==='bidir'){const m=S.tutMeta;const r=await api('bidir',{position:m.above?'above':'below'});if(token!==theoryToken)return;S.theory={kind:'bidir',r,m};}
  else if(t.theory==='formula'){S.theory={kind:'formula'};}
  else{box.innerHTML='<p class="muted">Ελεύθερο κύκλωμα: χρησιμοποίησε scopes και μετρήσεις.</p>';S.theory=null;return;}
  renderTheory();
 }catch(e){const v=theoryValidity(t);if(!v.ok){box.innerHTML=staleBanner(v);bindRestore(box);return;}box.innerHTML=`<p class="bad">Η θεωρία δεν υπολογίστηκε: ${esc(e.message)}. ${location.protocol==='file:'?'Άνοιξε την εφαρμογή μέσω <code>python run.py</code>.':''}</p>`;}
}
function cmpRows(rows){return `<table class="cmp"><thead><tr><th>Μέγεθος</th><th>Θεωρία</th><th>Προσομοίωση</th><th>Διαφορά</th></tr></thead><tbody>${rows.map(([n,a,b,u])=>{let d=Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a)>1e-12?(100*(b/a-1)):NaN;if(Math.abs(d)<1e-9)d=0;return `<tr><td>${n}</td><td>${eng(a,u)}</td><td>${eng(b,u)}</td><td class="${Math.abs(d)<2?'good':Math.abs(d)<10?'':'warn-text'}">${Number.isFinite(d)?fmt(d,3)+' %':''}</td></tr>`;}).join('')}</tbody></table>`;}
function stepsHTML(steps){return (steps||[]).map(s=>`<details class="step"><summary>${esc(s.title)}</summary><p>${esc(s.explanation||'')}</p>${s.math?`<div class="math">${s.math.mathml||''}</div>`:''}${s.numeric?`<div class="math num">${s.numeric.mathml||''}</div>`:''}${s.result?`<div class="math res">${s.result.mathml||''}</div>`:''}</details>`).join('');}
function renderTheory(){
 const th=S.theory,box=$('#theory');if(!th){return;}const t=tutorial();let html='';const valid=theoryValidity(t);
 try{ // a circuit that is no longer the tutorial's may lack its parts (e.g. moved into a subcircuit): only the banner then
 if(th.kind==='v1'){const r=th.r,m=r.metrics,c=r.config;const neg=t.topology==='buck_boost';
  const vo=avgOver('V:C1'),il=avgOver(t.topology==='flyback'?'Im:T1':'I:L1');
  html+=`<div class="tm"><span class="badge">${esc(r.mode)}</span> V_o = ${eng(c.vo*(neg?-1:1),'V')} · I_o = ${eng(m.Iout,'A')} · D = ${fmt(m.duty,4)} · L_crit = ${eng(m.Lcrit,'H')}</div>`;
  html+=cmpRows([['V_o (μέση)',c.vo*(neg?-1:1),vo?.avg,'V'],[t.topology==='flyback'?'⟨i_m⟩':'⟨i_L⟩',m.ILmean,il?.avg,'A'],['Δi p-p',m.Iripple_pp,lastPP(t.topology==='flyback'?'Im:T1':'I:L1'),'A'],['ΔV_o p-p',m.Vripple_pp,lastPP('V:C1'),'V']]);
  html+=`<p class="muted small">Η προσομοίωση συγκρίνεται μόνο αφού σταθεροποιηθεί (μεταβατικό από την εκκίνηση). Θεωρία: ιδανικά στοιχεία, ${esc(c.drive==='fixed_duty'?'σταθερό D και ωμικό φορτίο':'')}.</p>`;
  if(editor.comp('Cc')){const T1=paramsOf('T1'),vc=avgOver('V:Cc'),ip=avgOver('I:T1',5),pr=avgOver('P:Rc'),vo2=vo?.avg,Llk=+T1.Llk1,fs=+paramsOf('PWM1').fs,Vr=vo2/(+T1.n);
   const Ppred=.5*Llk*(ip?.max??NaN)**2*fs*(vc?.avg)/((vc?.avg)-Vr);
   html+=`<h4>Σκέδαση και RCD clamp</h4><ul class="eqs"><li>Ανακλώμενη τάση V_o/n = <b>${eng(Vr,'V')}</b> · τάση clamp V_c = <b>${eng(vc?.avg,'V')}</b> · μέγιστη τάση διακόπτη V_in + V_c = <b>${eng(+paramsOf('V1').V+(vc?.avg??NaN),'V')}</b></li>
    <li>Ενέργεια σκέδασης ανά περίοδο ½·L_lk·Î_p² = <b>${eng(.5*Llk*(ip?.max??NaN)**2,'J')}</b> με Î_p = ${eng(ip?.max,'A')}</li><li>Στο clamp: P = ½·L_lk·Î_p²·f_s·V_c/(V_c − V_o/n) = <b>${eng(Ppred,'W')}</b> (μέρος της ενέργειας μαγνήτισης περνά κι αυτό από το clamp όσο σβήνει η σκέδαση)</li></ul>`;
   html+=cmpRows([['P στο R_c',Ppred,pr?.avg,'W'],['V_S,max',+paramsOf('V1').V+(vc?.avg??NaN),avgOver('V:S1',5)?.max,'V']]);
   html+=`<p class="muted small">Η θεωρία DC-DC πάνω είναι για ιδανικό μετασχηματιστή. Η σκέδαση «τρώει» λίγο από το D, γι' αυτό η V_o βγαίνει χαμηλότερη.</p>`;}
  html+=`<p class="small">Πλήρης ανάλυση με εξισώσεις και αντικατάσταση: ενότητα «Υπολογισμοί & μαθηματικά».</p>`;}
 else if(th.kind==='bidir'){const m=th.m,r=th.r;const il=avgOver('I:L1',5);const pb=avgOver('P:'+(editor.comp('VB')?'VB':'CB'),5);
  const dI=m.vlo*m.D0/(5.6e-6*20e3);
  html+=`<div class="tm"><span class="badge">${m.above?'αποθήκευση > ζυγού':'αποθήκευση < ζυγού'}</span> V_st = ${eng(m.vst,'V')} · ${m.P>0?'εκφόρτιση':'φόρτιση'} · ${m.above?(m.P>0?'Buck':'Boost'):(m.P>0?'Boost':'Buck')}</div>
   <ul class="eqs"><li>D₀ = 1 − V_lo/V_hi = 1 − ${fmt(m.vlo)}/${fmt(m.vhi)} = <b>${fmt(m.D0,5)}</b></li><li>I_L = ${m.above?'−P/V_bus':'P/V_st'} = <b>${eng(m.I,'A')}</b></li><li>Δi_L = V_lo·D/(L·f_s) = <b>${eng(dI,'A')}</b></li>
   <li>Ολίσθηση για σφάλμα δ: d⟨i_L⟩/dt = V_hi·δ/L = <b>${eng(m.vhi*.001/5.6e-6,'A/s')}</b> για δ = 0,001</li><li>Μετάβαση ±I με ΔD = 0,05: t = L·2|I|/(V_hi·ΔD) = <b>${eng(m.pulse,'s')}</b></li><li>PI (f_c = f_s/20, PM 60°): K_p = <b>${eng(m.pi.kp)}</b>, K_i = <b>${eng(m.pi.ki)}</b></li></ul>`;
  html+=cmpRows([['⟨i_L⟩ (τελευταίες 5 T)',S.tut.options.ctrl==='pi'||S.tut.options.ctrl==='pulse'?NaN:m.I,il?.avg,'A'],['Δi_L p-p',dI,lastPP('I:L1'),'A'],['P προς ζυγό',S.tut.options.bus==='ideal'?m.P:NaN,editor.comp('VB')?-(pb?.avg??NaN):NaN,'W']]);
  if(S.tut.options.sw==='real'){const q=k=>avgOver(k,5)?.avg;const pc=(q('P:S1')||0)+(q('P:S2')||0),ps=(q('PSW:S1')||0)+(q('PSW:S2')||0),pt=Math.abs(m.P);
   html+=`<h4>Απώλειες διακοπτών (μέσες, τελευταίες 5 T)</h4><ul class="eqs"><li>Αγωγής (MOSFET + δίοδοι σώματος): <b>${eng(pc,'W')}</b> · μεταγωγής: <b>${eng(ps,'W')}</b> · σύνολο <b>${eng(pc+ps,'W')}</b> ≈ ${fmt(100*(pc+ps)/pt,3)} % των ${eng(pt,'W')}</li>
    <li>Μεταγωγή: P_sw = f_s·(E_on + E_off)·(|v|/V_ref)·(|i|/I_ref) ≈ <b>${eng(20e3*2.1e-3*(m.vhi/100)*(Math.abs(m.I)/800),'W')}</b> για |i_L| = ${eng(Math.abs(m.I),'A')}, V = ${eng(m.vhi,'V')}, μόνο στον διακόπτη που μεταγάγεται σκληρά (ο άλλος ανάβει αφού άγει ήδη η δίοδός του)</li></ul>`;}
  html+=`<p class="small">Παράθυρο ${r.config.vst_min}–${r.config.vst_max} V · L_min = ${eng(r.q4.L_min,'H')} · Δi_max = ${eng(r.q4.ripple_max.dI,'A')} @ ${fmt(r.q4.ripple_max.vst)} V · μέση ισχύς φορτίου ${fmt(r.q2.load_avg_kW)} kW.</p>`;
  html+=`<h4>Δοκιμές ερωτήματος 5</h4><div class="wrap"><table class="cmp"><thead><tr><th></th><th>V_st</th><th>P</th><th>Λειτ.</th><th>D</th><th>I_L</th><th>Δi</th><th>i_L(0) συμμ.</th></tr></thead><tbody>${r.q5.tests.map(x=>`<tr><td>${esc(x.id)}</td><td>${fmt(x.vst)}</td><td>${fmt(x.p_bus/1e3)} kW</td><td>${esc(x.mode)}</td><td>${fmt(x.D,4)}</td><td>${fmt(x.IL)}</td><td>${fmt(x.dI)}</td><td>${fmt(x.iL0_symmetric)}</td></tr>`).join('')}</tbody></table></div>`;}
 else if(th.kind==='formula')html+=formulaTheory(t);
 }catch(e){if(valid.ok)throw e;html='';}
 box.innerHTML=valid.ok?(valid.note?`<p class="th-note">${esc(valid.note)}</p>`:'')+html:staleBanner(valid)+`<div class="th-stale">${html}</div>`;bindRestore(box);
}
// ideal periodic inductor current, rising while S2 conducts: deviation from the mean at carrier
// position u = τ/T, in units of Δi (−½ … ½). Sawtooth: S2 ON for u ∈ [0, D); triangle: ON around u = ½.
function rippleDev(u,D,saw){u=((u%1)+1)%1;D=Math.min(Math.max(D,1e-9),1-1e-9);
 if(saw)return u<D?-.5+u/D:.5-(u-D)/(1-D);const a=(1-D)/2,b=(1+D)/2;if(u>=a&&u<b)return -.5+(u-a)/D;const v=((u-b)%1+1)%1;return .5-v/(1-D);}
function periodAvgAt(key,t){const s=S.sim,i=s?.chIndex.get(key),p=s?.per;if(i===undefined||!p.n)return NaN;const T=s.T,end=(Math.floor(t/T+1e-9)+1)*T;
 for(let k=1;k<=p.n;k++){const j=(p.head-k+p.cap)%p.cap;const te=p.t[j];if(Math.abs(te-end)<1e-6*T)return p.avg[j*p.nch+i];if(te<end-T)break;}return NaN;}
function samplingTheory(){const s=S.sim,W=paramsOf('PWM1'),Lp=paramsOf('L1'),Hp=paramsOf('SH1'),VB=paramsOf('VB'),VS=paramsOf('VS');
 if(!W||!Lp||!Hp||!VB||!VS)return '<p class="muted">Λείπει κάποιο από τα VB, VS, L1, PWM1, SH1.</p>';
 const fs=+W.fs,T=1/fs,L=+Lp.L,vlo=s?s.now('V:VB'):+VB.V,vhi=s?s.now('V:VS'):+VS.V,saw=W.carrier==='saw',pi=W.mode==='pi',trig=Hp.trig||'start';
 const D0=1-vlo/vhi,D=pi?D0:+W.D,dI=vlo*D/(L*fs),phase=(((+W.phase||0)%360)+360)%360,tau0=((-phase/360)%1+1)%1;
 const refS=P.parseSched(W.ref)||[[0,0]],Iref=refS[refS.length-1][1],uS=trig==='mid'?.5:0;
 const Iavg=pi?Iref-dI*rippleDev(uS,D,saw):+Lp.i0-dI*rippleDev(tau0,+W.D,saw);
 const pos=trig==='both'?[0,.5]:trig==='mid'?[.5]:[0],name=u=>saw?(u===0?'reset (αρχή του ON του S2)':'μέσο της περιόδου'):(u===0?'μέγιστο του φέροντος (μέσο του OFF του S2)':'ελάχιστο του φέροντος (μέσο του ON του S2)');
 const step=trig==='both'?T/2:T,b=phase/360*T+(trig==='mid'?T/2:0),first=b-step*Math.floor(b/step+1e-9);
 const log=s?.samples('SH1'),n=log?log.t.length:0,nexp=s&&s.t>=first-1e-12?Math.floor((s.t-first)/step+1e-7)+1:0;
 const lastAt=u=>{if(!log)return NaN;for(let i=log.t.length-1;i>=0;i--){const q=((log.t[i]/T-phase/360)%1+1)%1;if(Math.min(Math.abs(q-u),1-Math.abs(q-u))<1e-6)return log.v[i];}return NaN;};
 const eqs=[`D₀ = 1 − V_bus/V_st = 1 − ${fmt(vlo,4)}/${fmt(vhi,4)} = <b>${fmt(D0,5)}</b>${pi?' · ο PI δίνει D = D_ff + διόρθωση, με D_ff = 1 − V_bus/V_st από τις μετρούμενες τάσεις':Math.abs(D-D0)>1e-6?` · <span class="warn-text">D = ${fmt(D,5)} ≠ D₀: το μέσο ρεύμα ολισθαίνει με V_st·(D − D₀)/L = ${eng(vhi*(D-D0)/L,'A/s')}</span>`:''}`,
  `Δi_L = V_bus·D/(L·f_s) = <b>${eng(dI,'A')}</b>. Το ρεύμα ανεβαίνει όσο άγει ο S2 (v_L = V_bus) και κατεβαίνει όσο άγει ο S1.`,
  saw?`Πριονωτό, trailing-edge: c = τ/T και g_S2 = (D > c), άρα ο S2 άγει από το reset έως τ = D·T = ${eng(D*T,'s')}. Στο reset ξεκινά η άνοδος: εκεί είναι η <b>κοιλάδα</b> του ρεύματος.`
   :`Συμμετρικό τρίγωνο: c = |1 − 2τ/T| και g_S2 = (D > c), άρα ο S2 άγει για τ ∈ (${fmt((1-D)/2,4)}·T, ${fmt((1+D)/2,4)}·T). Το μέγιστο του φέροντος (τ = 0) είναι το μέσο του OFF και το ελάχιστο (τ = T/2) το μέσο του ON: και στα δύο το ιδανικό ρεύμα περνά από τη <b>μέση τιμή</b>.`,
  `Δείγματα: ${pos.map(u=>`${name(u)}, όπου i_L = ⟨i_L⟩ ${rippleDev(u,D,saw)<0?'−':'+'} ${fmt(Math.abs(rippleDev(u,D,saw)),3)}·Δi = <b>${eng(Iavg+dI*rippleDev(u,D,saw),'A')}</b>`).join('· ')}. ${pos.length} ${pos.length>1?'δείγματα':'δείγμα'} ανά περίοδο, δηλαδή ${eng(pos.length*fs,'Hz')}.`,
  `Μετατόπιση φέροντος φ = ${fmt(phase,4)}° = ${eng(phase/360*T,'s')}: στο t = 0 το φέρον βρίσκεται στο τ(0) = (−φ) mod T = ${fmt(tau0,4)}·T${pi?'':Math.abs(rippleDev(tau0,+W.D,saw))<1e-9?', όπου η περιοδική κυματομορφή περνά από τη μέση τιμή':`, όπου η περιοδική κυματομορφή απέχει ${fmt(rippleDev(tau0,+W.D,saw),3)}·Δi από τη μέση τιμή`}. Πρώτο δείγμα στο t = <b>${eng(first,'s')}</b>${first<1e-15?' (το trigger συμπίπτει με το t = 0)':''}.`,
  pi?`Ο PI μηδενίζει το σφάλμα στο δείγμα: i_L(t_k) → I_ref = ${eng(Iref,'A')}, άρα ⟨i_L⟩ = I_ref ${rippleDev(uS,D,saw)<0?'+':'−'} ${fmt(Math.abs(rippleDev(uS,D,saw)),3)}·Δi = <b>${eng(Iavg,'A')}</b>.${saw?' Με πριονωτό η μέση τιμή απέχει Δi/2 από την αναφορά.':''}`
   :Math.abs(rippleDev(tau0,+W.D,saw))<1e-9?`Με i_L(0) = ${eng(+Lp.i0,'A')} σε σημείο μέσης τιμής, ⟨i_L⟩ = i_L(0) = <b>${eng(Iavg,'A')}</b>`:`Με i_L(0) = ${eng(+Lp.i0,'A')} στο τ(0), η μέση τιμή γίνεται ⟨i_L⟩ = i_L(0) − Δi·(${fmt(rippleDev(tau0,+W.D,saw),3)}) = <b>${eng(Iavg,'A')}</b>${Math.abs(rippleDev(tau0,+W.D,saw))>1e-6?' · το i_L(0) δεν πέφτει σε σημείο μέσης τιμής, άρα όλη η κυματομορφή μετατοπίζεται':''}.`];
 const rows=[['⟨i_L⟩ (τελευταίες 5 T)',Iavg,avgOver('I:L1',5)?.avg,'A'],['Δi_L p-p',dI,lastPP('I:L1'),'A'],...pos.map(u=>[`Δείγμα στο τ = ${u?'T/2':'0'}`,Iavg+dI*rippleDev(u,D,saw),lastAt(u),'A']),
  ['Δείγματα έως t',nexp,n,''],['Πρώτο δείγμα',first,log?.t[0],'s']];
 let html=`<ul class="eqs">${eqs.map(e=>`<li>${e}</li>`).join('')}</ul>${cmpRows(rows)}`;
 if(log&&log.t.length){const N=log.t.length,first6=Math.max(0,N-8);
  html+=`<h4>Τελευταία δείγματα</h4><div class="wrap"><table class="cmp"><thead><tr><th>#</th><th>t_sample</th><th>τ/T</th><th>i_L(t_k)</th><th>⟨i_L⟩ περιόδου</th><th>δείγμα − ⟨i_L⟩</th></tr></thead><tbody>${log.t.slice(first6).map((t,j)=>{const i=first6+j,v=log.v[i],a=periodAvgAt('I:L1',t),q=((t/T-phase/360)%1+1)%1;
   return `<tr><td>${(S.sim.shById.get('SH1')?.n??N)-(N-1-i)}</td><td>${eng(t,'s',6)}</td><td>${fmt(Math.min(q,1-q)<1e-6?0:q,3)}</td><td>${eng(v,'A',5)}</td><td>${eng(a,'A',5)}</td><td>${Number.isFinite(a)?eng(v-a,'A',4):'—'}</td></tr>`;}).join('')}</tbody></table></div>`;}
 const k=s?.ctrlById.get('PWM1');if(k){const tk=k.tk,dt=k.dt||0,d=Math.min(1,Math.max(0,k.dOn)),d2=Math.min(1,Math.max(0,k.dOff)),[e0,e1]=saw?[0,d*T]:[(1-d)*T/2,(1+d2)*T/2];const r=x=>`${eng(x,'s',6)} (τ = ${Math.abs(x-tk)<1e-6*T?'0':eng(x-tk,'s',4)})`;
  html+=`<h4>Χρονοδιάγραμμα της τρέχουσας περιόδου φέροντος</h4><ul class="eqs"><li>Αρχή περιόδου t_k = ${eng(tk,'s',6)}</li>${pos.map(u=>`<li>t_sample: ${r(tk+u*T)}</li>`).join('')}
   <li>t_update: ${pi?(W.upd==='double'&&!saw?`${r(tk)} για την ακμή ανάμματος (D = ${fmt(k.dOn,5)}) και ${r(tk+T/2)} για την ακμή σβησίματος (D = ${fmt(k.dOff,5)}). Ο PI τρέχει με T_s = T/2 και διαβάζει κάθε φορά το τελευταίο δείγμα`:`${r(tk)}, ο ελεγκτής διαβάζει το δείγμα που μόλις πάρθηκε και ορίζει το D της περιόδου (D = ${fmt(d,5)})`):W.upd==='double'&&!saw?`${r(tk)} και ${r(tk+T/2)} (πρόγραμμα D(t))`:'— (ανοιχτός βρόχος, σταθερό D)'}</li>
   <li>t_gate: S2 ON στο ${r(tk+e0+dt)}, S2 OFF στο ${r(tk+e1)}${dt>0?`, S1 ON στο ${r(tk+e1+dt)} (νεκρός χρόνος ${eng(dt,'s')})`:''}</li></ul>
   <p class="muted small">Στην ίδια στιγμή προηγείται το δείγμα, ακολουθεί η ενημέρωση του ελεγκτή και μετά η μεταγωγή. Το δείγμα είναι η τιμή του ρεύματος ακριβώς πριν από κάθε μεταγωγή της στιγμής εκείνης (t⁻).</p>`;}
 return html;}
// N legs on a common clock: per-leg and summed ripple, cancellation points, window scan
function polyTheory(){const s=S.sim,m=S.tutMeta||{};const legs=editor.doc.components.filter(c=>c.type==='L'&&/^L\d+$/.test(c.id)).sort((a,b)=>+a.id.slice(1)-+b.id.slice(1));
 const N=legs.length,W=paramsOf('PWM1'),VB=paramsOf('VB'),VS=paramsOf('VS');if(!N||!W||!VB||!VS)return '<p class="muted">Λείπουν τα VB, VS, L1…, PWM1….</p>';
 const fs=+W.fs,T=1/fs,L=+paramsOf('L1').L,vlo=s?s.now('V:VB'):+VB.V,vhi=s?s.now('V:VS'):+VS.V,D=1-vlo/vhi,Pw=Number.isFinite(m.P)?m.P:40e3,Ik=-Pw/(N*vlo);
 // actual duty (open loop with R, or what the PI settles to) and the ON-interval voltage V_bus − R·I_k
 const Dk=W.mode==='pi'?(s?s.now('D:PWM1'):D):+W.D,vOn=k=>vlo-(+paramsOf(legs[k].id).Rs||0)*Ik,dI=vOn(0)*Dk/(L*fs);
 const ph=legs.map((c,k)=>{const q=paramsOf('PWM'+(k+1));return q?((+q.phase||0)%360+360)%360:0;});
 const same=ph.every(x=>Math.abs(x-ph[0])<1e-6),sorted=[...ph].map(x=>((x-ph[0])%360+360)%360).sort((a,b)=>a-b),equal=!same&&sorted.every((x,k)=>Math.abs(x-360*k/N)<1e-6);
 const frac=x=>{const r=x-Math.round(x);return Math.abs(r)<1e-7?0:x-Math.floor(x);},rr=frac(N*D),shiftF=V=>{const d=1-vlo/V,r=frac(N*d);return V/L*T/N*r*(1-r);},commonF=V=>N*vlo*(1-vlo/V)/(L*fs);
 // the ideal summed waveform for the actual phases (any spacing)
 const dIk=legs.map((c,k)=>vOn(k)*Dk/((+paramsOf(c.id).L||L)*fs));
 let mn=Infinity,mx=-Infinity;for(let j=0;j<4000;j++){const u=j/4000;let y=0;for(let k=0;k<N;k++)y+=dIk[k]*rippleDev(u-ph[k]/360,D,W.carrier==='saw');mn=Math.min(mn,y);mx=Math.max(mx,y);}const dIsum=mx-mn;
 // expected mean current of each leg: the PI reference, or with winding resistance (V_bus − (1 − D)·V_st)/R
 const pi=W.mode==='pi',Rs=legs.map(c=>+paramsOf(c.id).Rs||0),expI=legs.map((c,i)=>{const q=paramsOf('PWM'+(i+1));if(q?.mode==='pi'){const r=P.parseSched(q.ref);return r?r[r.length-1][1]:NaN;}return Rs[i]>0?(vlo-(1-(+q.D))*vhi)/Rs[i]:Ik;});
 const unequalL=dIk.some(x=>Math.abs(x/dIk[0]-1)>1e-6);
 const vmin=m.vmin??60,vmax=m.vmax??100,canc=[];for(let q=1;q<N;q++){const v=vlo/(1-q/N);if(v>=vmin-1e-9&&v<=vmax+1e-9)canc.push(v);}
 let worst={v:vmin,d:0};for(let j=0;j<=2000;j++){const V=vmin+(vmax-vmin)*j/2000,d=same?commonF(V):shiftF(V);if(d>worst.d)worst={v:V,d};}
 const k=m.k??.3,dImax=vlo*(1-vlo/vmax)/(L*fs),Lmin=vlo*(1-vlo/vmax)/(k*Math.abs(Ik)*fs);
 const mode=same?'συμφασική':equal?'μετατοπισμένη κατά T/N':'άνισες φάσεις';
 const eqs=[`${N} κλάδοι, ${mode} οδήγηση (φάσεις ${ph.map(x=>fmt(x,4)+'°').join(', ')} → καθυστερήσεις ${ph.map(x=>eng(x/360*T,'s',3)).join(', ')}).`,
  `Ισομερής καταμερισμός: P_k = P/N = ${eng(Pw/N,'W')}, I_k = −P/(N·V_bus) = <b>${eng(Ik,'A')}</b> ανά κλάδο, ⟨i_Σ⟩ = N·I_k = <b>${eng(N*Ik,'A')}</b>.`,
  pi?`Κάθε κλάδος έχει δικό του PI ρεύματος: μετρά το i_L του κλάδου στην αρχή της δικής του περιόδου (μέγιστο του τριγώνου, άρα μέση τιμή) και ακολουθεί την αναφορά του, ό,τι κι αν διαφέρει ανάμεσα στους κλάδους.`
   :Rs.some(r=>r>0)?`Ανοιχτός βρόχος με αντίσταση πηνίων: σε μόνιμη κατάσταση V_bus − (1 − D)·V_st = R_k·I_k, άρα I_k = (V_bus − (1 − D)·V_st)/R_k. Ο κλάδος με τη μεγαλύτερη R παίρνει λιγότερο ρεύμα: ${legs.map((c,i)=>`${esc(c.label||c.id)} ${eng(expI[i],'A',4)}`).join(', ')}.`
   :`Ανοιχτός βρόχος με ιδανικούς κλάδους: τα μέσα ρεύματα μένουν όσο ήταν στην αρχή, γιατί τίποτα δεν τα επαναφέρει. Μια αλλαγή φάσης ή λόγου κατάτμησης αφήνει μόνιμη ανισοκατανομή.`,
  `D₀ = 1 − V_bus/V_st = 1 − ${fmt(vlo,4)}/${fmt(vhi,5)} = <b>${fmt(D,5)}</b>${Math.abs(Dk-D)>1e-6?` (εδώ D = ${fmt(Dk,5)}, γιατί καλύπτει και την πτώση R·I)`:''}, Δi_k = (V_bus − R·I_k)·D/(L·f) = <b>${eng(dI,'A')}</b> (${fmt(100*dI/Math.abs(Ik),3)} % του |I_k|), κορυφή |I_k| + Δi_k/2 = <b>${eng(Math.abs(Ik)+dI/2,'A')}</b>.`,
  same?`Συμφασικά οι κλάδοι κυματώνουν μαζί: Δi_Σ = N·Δi_k = <b>${eng(N*dI,'A')}</b>, στη συχνότητα f = ${eng(fs,'Hz')}.`
   :equal&&!unequalL?`Μετατοπισμένα: r = N·D − ⌊N·D⌋ = ${fmt(rr,4)}, Δi_Σ = (V_st/L)·(T/N)·r(1 − r) = <b>${eng(shiftF(vhi),'A')}</b>. Σε κάθε υποπερίοδο T/N άγουν ⌊N·D⌋ ή ⌊N·D⌋ + 1 κάτω διακόπτες· η κυμάτωση που μένει έχει συχνότητα N·f = ${eng(N*fs,'Hz')}.${rr<1e-6||rr>1-1e-6?' <b>Εδώ N·D είναι ακέραιος: ιδανική ακύρωση.</b>':''}`
   :`${unequalL?'Με διαφορετικά L':'Με άνισες φάσεις'} ο κλειστός τύπος δεν ισχύει και η ακύρωση δεν είναι πλήρης· η κυμάτωση του αθροίσματος υπολογίζεται από τις ιδανικές κυματομορφές των κλάδων: <b>${eng(dIsum,'A')}</b>.`,
  `Παράθυρο ${fmt(vmin)}–${fmt(vmax)} V: ${canc.length?`ακυρώσεις (N·D ακέραιος) στα ${canc.map(v=>eng(v,'V',4)).join(', ')}`:'καμία ακύρωση μέσα στο παράθυρο'}. Μέγιστη κυμάτωση αθροίσματος ${eng(worst.d,'A')} στα ${eng(worst.v,'V',4)} (${same?'συμφασικά':'μετατοπισμένα'}).`,
  `Κριτήριο 30 %: Δi_k είναι μέγιστο στη μέγιστη V_st (${eng(dImax,'A')}), άρα L_min = V_bus·D_max/(0,3·|I_k|·f) = <b>${eng(Lmin,'H')}</b>· τώρα L = ${eng(L,'H')} → ${dImax<=k*Math.abs(Ik)*(1+1e-6)?'<span class="good">μέσα στο κριτήριο</span>':'<span class="warn-text">εκτός κριτηρίου</span>'}.`];
 const rows=[['⟨i_Σ⟩ (ζυγός)',expI.reduce((a,b)=>a+b,0),avgOver('I:VB',5)?.avg,'A'],['Δi_k p-p (κλάδος 1)',dI,lastPP('I:L1'),'A'],['Δi_Σ p-p',dIsum,lastPP('I:VB'),'A'],['Κορυφή |i_L1|',Math.abs(Ik)+dI/2,(()=>{const q=s?.lastPeriod('I:L1');return q?Math.max(Math.abs(q.max),Math.abs(q.min)):NaN;})(),'A']];
 const tab=`<h4>Καταμερισμός ανά κλάδο (τελευταίες 5 T)</h4><div class="wrap"><table class="cmp"><thead><tr><th>Κλάδος</th><th>φ</th><th>L, R</th><th>⟨i_L⟩ αναμενόμενο</th><th>⟨i_L⟩</th><th>Δi p-p</th><th>P_k</th></tr></thead><tbody>${legs.map((c,i)=>{const a=avgOver('I:'+c.id,5),lp=paramsOf(c.id);
   return `<tr><td>${esc(c.label||c.id)}</td><td>${fmt(ph[i],4)}°</td><td>${eng(+lp.L,'H',4)}${+lp.Rs>0?', '+eng(+lp.Rs,'Ω',3):''}</td><td>${eng(expI[i],'A',5)}</td><td>${eng(a?.avg,'A',5)}</td><td>${eng(lastPP('I:'+c.id),'A',4)}</td><td>${eng(-(a?.avg??NaN)*vlo,'W',4)}</td></tr>`;}).join('')}</tbody></table></div>`;
 const scan=`<h4>Κυμάτωση αθροίσματος σε όλο το παράθυρο (ιδανικό μοντέλο)</h4><div class="wrap"><table class="cmp"><thead><tr><th>V_st</th><th>D</th><th>N·D</th><th>Δi_k</th><th>Δi_Σ μετατοπισμένα</th><th>Δi_Σ συμφασικά</th></tr></thead><tbody>${[...new Map([vmin,(vmin+vmax)/2,vmax,...canc,worst.v].map(v=>[v.toPrecision(6),v])).values()].sort((a,b)=>a-b).map(V=>{const d=1-vlo/V;
   return `<tr><td>${eng(V,'V',4)}</td><td>${fmt(d,4)}</td><td>${fmt(N*d,4)}</td><td>${eng(vlo*d/(L*fs),'A',4)}</td><td>${eng(shiftF(V),'A',4)}</td><td>${eng(commonF(V),'A',4)}</td></tr>`;}).join('')}</tbody></table></div>`;
 return `<ul class="eqs">${eqs.map(e=>`<li>${e}</li>`).join('')}</ul>${cmpRows(rows)}${tab}${scan}`;}
// last n complete periods of one channel: [{avg,min,max}], oldest first
function lastPeriods(key,n){const s=S.sim,i=s?.chIndex.get(key),p=s?.per;if(i===undefined||!p?.n)return [];const out=[];for(let k=Math.min(n,p.n);k>=1;k--){const j=(p.head-k+p.cap)%p.cap,o=j*p.nch+i;out.push({t:p.t[j],avg:p.avg[o],min:p.min[o],max:p.max[o]});}return out;}
function evalOrderHTML(){const o=S.sim?.net.sig.order||[];if(!o.length)return '';return `<p class="small">Σειρά υπολογισμού των μπλοκ σε κάθε στιγμή: <b>${o.map(b=>esc(b.label)).join(' → ')}</b>. Κάθε μπλοκ υπολογίζεται μετά από όσα διαβάζει άμεσα. Η z⁻¹ δεν διαβάζει άμεσα την είσοδό της, γι' αυτό σπάει τους βρόχους. Ένας κλειστός βρόχος χωρίς τέτοιο μπλοκ (αλγεβρικός βρόχος) αναφέρεται ως σφάλμα.</p>`;}
// 3.0: current loop built from blocks. The PI reads i_L at the period start (sawtooth: the valley), so it holds
// the valley at the reference and the mean is i_ref + Δi/2
// 3.17: N instances of one buck leg (subcircuit), interleaved. Per leg Δi = V_in·D(1 − D)/(L·f_s); the sum with phases
// k·360°/N: Δi_Σ = V_in·(N·D − m)(m + 1 − N·D)/(N·L·f_s), m = ⌊N·D⌋ (zero when N·D is an integer); in phase: N·Δi.
// 3.18: the dq current loop on buses. Plant L·di/dt = v − e − R·i in dq (θ = ωt − 90°), PI with K_p = ω_c·L, K_i = ω_c·R and
// decoupling ωL: i_dq/i*_dq = ω_c/(s + ω_c); in steady state v_dq = e_dq + (R + jωL)·i_dq
// 4.1: fault in a network (IEC 60909 by symmetrical components; the phase-domain solution of netlib.js for any fault)
// 4.3: generator short circuit (classical decrement curve), First Benchmark (shaft modes, published results), IEEE 9 from its load flow
function genScTheory(){const s=S.sim,m=S.tutMeta||{};if(!s||!m.gen)return '';const p={...P.defaults('GEN3'),...m.gen},g=P.genModel(p);if(g.err)return '';
 const [T1,T2]=P.genTsc(+p.Xd,+p.Xdp,+p.Xdpp,+p.Td0p,+p.Td0pp),Ib=g.Sn/(Math.sqrt(3)*g.Un),X2=(+p.Xdpp+ +p.Xqpp)/2,Ta=X2/(g.wb*Math.max(+p.Ra,1e-9));
 const Iac=tau=>((1/p.Xdpp-1/p.Xdp)*Math.exp(-tau/T2)+(1/p.Xdp-1/p.Xd)*Math.exp(-tau/T1)+1/p.Xd)*Ib;
 let h=`<ul class="eqs"><li>Συμμετρικό ρεύμα (E = 1 pu, I_b = ${eng(Ib,'A')}): I_ac(τ) = E·[(1/X″_d − 1/X′_d)·e^(−τ/T″_d) + (1/X′_d − 1/X_d)·e^(−τ/T′_d) + 1/X_d]·I_b</li>
  <li>I″ = E/X″_d = <b>${eng(Ib/p.Xdpp,'A')}</b>, I′ = E/X′_d = <b>${eng(Ib/p.Xdp,'A')}</b>, I = E/X_d = <b>${eng(Ib/p.Xd,'A')}</b> (RMS)</li>
  <li>Σταθερές βραχυκύκλωσης (ακριβείς): T′_d = <b>${eng(T1,'s',4)}</b>, T″_d = <b>${eng(T2,'s',4)}</b>· συνιστώσα DC: T_a = X₂/(ω·R_a) = ${eng(Ta,'s',3)} με X₂ = (X″_d + X″_q)/2</li></ul>`;
 const tau=s.t-m.t0-1/(2*g.f);if(tau<0.02)return h+'<p class="muted small">Τρέξε πέρα από το σφάλμα για τη σύγκριση.</p>';
 const ac=['a','b','c'].map(k=>{const q=s.lastPeriod('Y:F1/I'+k);return q?Math.sqrt(Math.max(0,q.rms*q.rms-q.avg*q.avg)):NaN;});
 return h+cmpRows([['I_ac στο τ = '+eng(tau,'s',3)+' (μέσος των φάσεων)',Iac(tau),(ac[0]+ac[1]+ac[2])/3,'A']])+'<p class="muted small">Προσομοίωση: RMS της τελευταίας περιόδου χωρίς τη μέση τιμή (DC), μέσος όρος των τριών φάσεων. Η διαφορά ανά φάση (έως 1–2 %) είναι η 2η αρμονική από X″_q ≠ X″_d.</p>';}
// natural frequencies of a shaft (pu masses H, springs K per electrical rad): ω² = eig(ω_b·K/(2H)), by Jacobi on the symmetric form
function shaftModes(H,K,fb){const n=H.length,A=Array.from({length:n},()=>new Array(n).fill(0));
 for(let i=0;i<n-1;i++){A[i][i]+=K[i];A[i+1][i+1]+=K[i];A[i][i+1]-=K[i];A[i+1][i]-=K[i];}
 const w=2*Math.PI*fb;for(let i=0;i<n;i++)for(let j=0;j<n;j++)A[i][j]*=w/(2*Math.sqrt(H[i]*H[j]));
 for(let sw=0;sw<60;sw++){let off=0;for(let p=0;p<n;p++)for(let q=p+1;q<n;q++)off+=A[p][q]*A[p][q];if(off<1e-22)break;
  for(let p=0;p<n;p++)for(let q=p+1;q<n;q++){if(Math.abs(A[p][q])<1e-300)continue;const th=(A[q][q]-A[p][p])/(2*A[p][q]),t=Math.sign(th||1)/(Math.abs(th)+Math.sqrt(th*th+1)),c=1/Math.sqrt(t*t+1),sn=t*c;
   for(let k=0;k<n;k++){const a=A[k][p],b=A[k][q];A[k][p]=c*a-sn*b;A[k][q]=sn*a+c*b;}for(let k=0;k<n;k++){const a=A[p][k],b=A[q][k];A[p][k]=c*a-sn*b;A[q][k]=sn*a+c*b;}}}
 return A.map((r,i)=>Math.sqrt(Math.max(0,r[i]))/(2*Math.PI)).sort((a,b)=>a-b).filter(x=>x>1e-3);}
function fbmTheory(){const s=S.sim,m=S.tutMeta||{};if(!s||!m.case)return '';const c=compAt('SG1'),p={...P.defaults('GEN3'),...(c?.params||{})};
 const fm=shaftModes(P.plist(p.Hm),P.plist(p.Km),+p.f),X2=m.case==='1S'?0.13+1.66*0.0408/(1.66+0.0408):0.135,Xt=X2+0.14+0.5+0.06,fer=60*Math.sqrt(m.Xc/Xt);
 let h=`<ul class="eqs"><li>Στρεπτικοί ρυθμοί του άξονα (ιδιοτιμές): ${fm.map(x=>'<b>'+fmt(x,4)+'</b>').join(', ')} Hz· στο paper (Σχ. 4) 15,71, 20,21, 25,55, 32,28 Hz</li>
  <li>Ηλεκτρικός συντονισμός: f_er = f₀·√(X_c/X_Σ) = 60·√(${fmt(m.Xc,3)}/${fmt(Xt,4)}) = <b>${fmt(fer,4)} Hz</b>, στον δρομέα f₀ − f_er = <b>${fmt(60-fer,4)} Hz</b></li></ul>`;
 if(m.case==='1S')return h+`<p>Αποτελέσματα του paper (μοντέλο έξι μαζών): ο ρυθμός 3 μεγαλώνει με σ = 1,525 1/s· σταθερή ταλάντωση με επιπλέον απόσβεση 75,9 pu στη γεννήτρια, ή R_a = 0,467 pu, ή X_c μικρότερο κατά 0,047 pu. Ο έλεγχος (tests, αναφορά επαλήθευσης) δίνει 1,520 1/s και ρυθμό ≈ 0 στις τρεις κρίσιμες τιμές.</p>`;
 if(s.t<m.tf+0.45)return h+'<p class="muted small">Τρέξε ως το τέλος (0,5 s μετά το σφάλμα) για τη σύγκριση με το Σχ. 5.</p>';
 return h+`<p>Σχ. 5 του paper (συνεχής γραμμή, ανάγνωση από το σχήμα): LPA–LPB έως ≈ 3,4 pu στα 0,135 s και ≈ 3,3 pu στα 0,32 s μετά το σφάλμα· GEN–EXC έως ≈ 1,0 pu στα 0,44 s. Σύγκρινε στο scope (ο χρόνος του scope μετρά από το 0· το σφάλμα είναι στα ${eng(m.tf,'s',4)}). Η ηλεκτρική ροπή του Σχ. 5c έχει το αντίθετο πρόσημο (ροπή κινητήρα).</p>`;}
const IEEE9_AF={G2:61.0975,G3:54.1431};
function ieee9Theory(){const s=S.sim,m=S.tutMeta||{};if(!s||!m.lf)return '';
 const rows=[];for(const [g,b] of [['G1',1],['G2',2],['G3',3]]){const q=s.lastPeriod('Y:'+g+':vt');rows.push([`|V| ζυγού ${b} (${g})`,m.lf[b][0],q?.avg,'pu']);}
 for(const [ld,b] of [['LD5',5],['LD7',7],['LD9',9]]){const q=s.lastPeriod('V:'+ld+'/Ra');rows.push([`|V| ζυγού ${b}`,m.lf[b][0],q?q.rms/(345e3/Math.sqrt(3)):NaN,'pu']);}
 if(!m.fault&&!m.noAF)for(const g of ['G2','G3']){const q=s.lastPeriod('Y:'+g+':d');rows.push([`δ ${g} (Anderson & Fouad, Πίν. 9.1)`,IEEE9_AF[g],q?.avg,'°']);}
 return `<ul class="eqs"><li>Ροή φορτίου (pcl.network, Newton–Raphson): οι γεννήτριες ξεκινούν από |V|∠θ του ζυγού τους· τα φορτία ως σταθερή εμπέδηση στην τάση της ροής φορτίου</li>
  <li>Αρχικοποίηση: το κύκλωμα λύνεται με φασιθέτες στα ${fmt(60,3)} Hz (ω_e = (2/h)·tan(ωh/2) για τον τραπεζοειδή), οι μηχανές από τη μόνιμη κατάστασή τους (δ, i_d, i_q, i_fd, E_fd, T_m)</li></ul>`+(m.fault?'':cmpRows(rows));}
// 5.0.4 (THEORY §8ΩΘ, CIGRE TB 39 §5.1, Fig. 15): the area of the IEEE 9 case with the rest of the network as one EQV3. The ports, and the
// first peak of i_a in the first cycle of the fault and its rms over the second (the trapezoid on the recorded samples) against the whole
// network (IEEE9_EQ_REF, the option «Όλο το δίκτυο»)
function ieee9EqTheory(){const s=S.sim,m=(S.tutMeta||{}).eq;if(!s||!m)return '';const f=m.f,t0=m.t0,T=1/f;
 const fig={'50':'μια πηγή θετικής ακολουθίας σε κάθε ζυγό του συνόρου, πίσω από R + L θετικής και μηδενικής ακολουθίας συζευγμένα ανάμεσα στους ζυγούς: ακριβές στη θεμελιώδη','15b':'Σχ. 15b: L_sc, R_sc χωρίς τη χωρητικότητα των γραμμών, και σε κάθε ζυγό R_s (κυματική αντίσταση) σε σειρά με C (η χωρητικότητα του υπόλοιπου δικτύου)','15c':'Σχ. 15c: R_s παράλληλα με L_sc, R_sc'};
 let h=`<ul class="eqs"><li>${m.net==='full'?'Όλο το δίκτυο: η αναφορά της σύγκρισης':'Ισοδύναμο: '+fig[m.fig]+'· η E από τη ροή φορτίου, ώστε το βασικό σημείο να μένει ακριβές'}</li>`;
 if(m.net!=='full')h+=`<li>S″k από το υπόλοιπο δίκτυο (|V|²/|Z₁,kk|): ${m.ports.map(q=>'ζυγός '+q.bus+' '+fmt(q.Sk/1e6,4)+' MVA').join(', ')}</li>`;
 h+=`<li>CIGRE TB 39 §5.1: για χειρισμούς το δίκτυο αναλυτικά ως τον δεύτερο υποσταθμό, για ενεργοποίηση γραμμής ως τον πρώτο· το ισοδύναμο σωστό ως το διπλάσιο της συχνότητας που ενδιαφέρει</li></ul>`;
 const ref=m.ref&&m.ref[m.fault],r=ref?rawSeries('Y:F1/Ia'):null;if(!r||!(s.t>=t0+2*T))return h;
 let pk=0,a=0,tf=NaN,tl=NaN;for(let j=0;j<r.t.length;j++){const t=r.t[j];if(t>t0&&t<=t0+T)pk=Math.max(pk,Math.abs(r.y[j]));
  if(t>t0+T&&t<=t0+2*T){if(Number.isFinite(tl))a+=(t-tl)*(r.y[j]**2+r.y[j-1]**2)/2;else tf=t;tl=t;}}
 const rms=Math.sqrt(a/(tl-tf));
 return h+cmpRows([['Πρώτη κορυφή του i_a (θεωρία: όλο το δίκτυο)',ref.pk,pk,'A'],['Ενεργός τιμή του i_a στον δεύτερο κύκλο',ref.rms,rms,'A']]);}
// 4.10: the modular SSSC. Single phase: two sources and a line with the compensator as −jX in series (or a constant
// quadrature voltage); three phases: the phasor solution of the four-bus network with the same series reactance
function schedNow(str,t){const q=P.parseSched(String(str??''));if(!q)return NaN;let v=q[0][1];for(const [ti,vi] of q)if(ti<=t+1e-12)v=vi;return v;}
// fundamental (peak) of a recorded signal over the last nc cycles, by the trapezoidal rule on the recorded steps
function fundOf(key,f,nc=4){const r=rawSeries(key);if(!r||r.t.length<8)return NaN;const t1=r.t[r.t.length-1];let j0=r.t.length-1;while(j0>0&&r.t[j0-1]>=t1-nc/f-1e-12)j0--;
 const Tw=t1-r.t[j0];if(Tw<0.9*nc/f)return NaN;const w=2*Math.PI*f;let a=0,b=0;
 for(let j=j0+1;j<r.t.length;j++){const dt=r.t[j]-r.t[j-1],y0=r.y[j-1],y1=r.y[j];a+=dt*(y0*Math.cos(w*r.t[j-1])+y1*Math.cos(w*r.t[j]))/2;b+=dt*(y0*Math.sin(w*r.t[j-1])+y1*Math.sin(w*r.t[j]))/2;}
 return 2*Math.hypot(a,b)/Tw;}
// phasors of the 150 kV tutorial network (RMS, phase quantities): grid E behind Z = U_n²/S″k at bus 1, π lines, the
// compensator −jX in series with jωL_σ from bus 1 to bus 4, the load at bus 2 as Y = (P − jQ)/U_n²
function ssscNet3(m,X){const w=2*Math.PI*m.f,Un=m.Un,E=Un/Math.sqrt(3),Z1=Un*Un/m.Sk,R1=Z1/Math.sqrt(1+m.XR*m.XR);
 const c=(re,im=0)=>({re,im}),add=(a,b)=>c(a.re+b.re,a.im+b.im),sub=(a,b)=>c(a.re-b.re,a.im-b.im),mul=(a,b)=>c(a.re*b.re-a.im*b.im,a.re*b.im+a.im*b.re),
  div=(a,b)=>{const d=b.re*b.re+b.im*b.im;return c((a.re*b.re+a.im*b.im)/d,(a.im*b.re-a.re*b.im)/d);},abs=a=>Math.hypot(a.re,a.im);
 const Y=[...Array(4)].map(()=>[...Array(4)].map(()=>c(0))),I=[...Array(4)].map(()=>c(0));
 const ser=(i,j,z,B=0)=>{const y=div(c(1),z);Y[i][i]=add(Y[i][i],add(y,c(0,B/2)));Y[j][j]=add(Y[j][j],add(y,c(0,B/2)));Y[i][j]=sub(Y[i][j],y);Y[j][i]=sub(Y[j][i],y);};
 const ln=km=>[c(m.r*km,w*m.l*km),w*m.c*km];
 const zs=c(R1,R1*m.XR);Y[0][0]=add(Y[0][0],div(c(1),zs));I[0]=div(c(E),zs);
 ser(0,1,...ln(m.lines.L13));ser(1,2,...ln(m.lines.L32));ser(3,2,...ln(m.lines.L42));const zk=c(0,w*(m.Lk||0)-X);ser(0,3,zk);
 Y[2][2]=add(Y[2][2],c(m.P/(Un*Un),-m.Q/(Un*Un)));
 const A=Y.map((r,i)=>[...r,I[i]]);for(let k=0;k<4;k++){for(let i=k+1;i<4;i++){const f=div(A[i][k],A[k][k]);for(let j=k;j<5;j++)A[i][j]=sub(A[i][j],mul(f,A[k][j]));}}
 const V=Array(4);for(let i=3;i>=0;i--){let s=A[i][4];for(let j=i+1;j<4;j++)s=sub(s,mul(A[i][j],V[j]));V[i]=div(s,A[i][i]);}
 const Is=div(sub(V[0],V[3]),zk),cj=a=>c(a.re,-a.im),P14=3*mul(V[0],cj(Is)).re,[z13]=ln(m.lines.L13),y13=ln(m.lines.L13)[1],I13=add(div(sub(V[0],V[1]),z13),mul(V[0],c(0,y13/2))),P13=3*mul(V[0],cj(I13)).re;
 return {I:abs(Is),V1:abs(V[0])/E,V2:abs(V[2]),V2pu:abs(V[2])/E,P14,P13};}
function ssscTheory(){const s=S.sim,m=(S.tutMeta||{}).sssc;if(!s||!m)return '';const f=m.f,T=s.T,nT=Math.max(1,Math.round(1/(f*T))),tnow=s.t;
 const cen=m.phases===3&&m.ctl&&m.ctl!=='phase',ctl=m.phases===3?(cen?'SC3':'SCa'):'SC1',bw=+(paramsOf(ctl)?.bw??8);
 let h=`<div class="tm"><span class="badge">m-SSSC</span> ${m.N} υπομονάδες × ${eng(m.Vdc,'V')} ανά φάση (ως ${eng(m.N*m.Vdc,'V')}), C = ${eng(m.C,'F')}</div><ul class="eqs">
  <li>Βραχίονας: v = Σ s_k·v_Ck − R_arm·i, s_k ∈ {−1, 0, +1} (γέφυρα H). Κάθε πυκνωτής C·dv_k/dt = s_k·i με τον κανόνα της ολοκλήρωσης: στον γρήγορο βραχίονα μία γραμμή του MNA, v_a − v_b − R_eq·i = E με R_eq = R_arm + Σ s_k²·h/(2C)</li>
  <li>Διαμόρφωση πλησιέστερης στάθμης: n = round(v_ref/V̄_C), |n| ≤ N. Ταξινόμηση: όταν sign(n)·i ≥ 0 οι πυκνωτές φορτίζονται και μπαίνουν οι |n| με τη μικρότερη τάση, αλλιώς οι |n| με τη μεγαλύτερη. Μειωμένη συχνότητα μεταγωγής: οι ίδιες υπομονάδες όσο το n δεν αλλάζει και η διασπορά μένει στη ζώνη</li>
  ${cen?`<li>Κεντρικός ελεγκτής (4.17): ${m.ctl==='cphase'?'ένα SOGI-PLL σε κάθε ρεύμα (θ_k)':`ένα τριφασικό PLL στη θετική ακολουθία των ρευμάτων (${eng(bw,'Hz')}): i_k = Î·cos θ_k, θ_k = θ − k·2π/3`}· V_q = Î·X_εντ με X = V_q/Î της θετικής ακολουθίας</li>
  <li>Νόμος ανά φάση: v_ref,k = V_q·sin θ_k + D_k·cos θ_k (κάθετο μέρος: η αντιστάθμιση· σε φάση: η ενέργεια). Ενέργεια φάσης N·½·C·V̄_k², άρα D_k = 2·N·C·V_C/Î·(u + b_k) δίνει dV̄_k/dt = u + b_k: u = PI(V_C,ref − V̄) για τη συνολική ενέργεια, b_k = PI(V̄ − V̄_k) για την εξισορρόπηση (Σ b_k = 0)· η αναφορά με προπορεία μισού δείγματος της NLC</li>`:`
  <li>PLL με SOGI (μονοφασικό, στο ρεύμα της γραμμής, ${eng(bw,'Hz')}): α′ = ω′[k(v − α) − β], β′ = ω′α, ω′ = ω₀ + PI{(−α·sin θ + β·cos θ)/√(α² + β²)}, θ′ = ω′</li>
  <li>Νόμος: v_ref = |V_q|·sin(θ + π/2 − sign(V_q)·(π/2 − Δθ)) με V_q = Î·X_εντ. Για V_q &gt; 0 η τάση καθυστερεί 90° από το ρεύμα: χωρητική, μειώνει τη συνολική αντίδραση. Δθ από PI στη μέση τάση των πυκνωτών: η μικρή ενεργός συνιστώσα καλύπτει τις απώλειες</li>`}`;
 const Xr=m.mode==='x'?schedNow(m.X,tnow):NaN,cells=k=>m.phases===3?`Y:CH${k}/X:v`:(m.fast?'Y:CH1/X:v':'Y:CH1/V');
 if(m.phases!==3){const w=2*Math.PI*f,XL=w*m.L,D=2*m.V*Math.sin(m.d*Math.PI/360);let I=NaN,Vq=NaN;
  if(m.mode==='x'){I=D/Math.hypot(m.R,XL-Xr);Vq=Xr*I;h+=`<li>Μόνιμη κατάσταση: I = (V₁∠δ − V₂)/(R + j(X_L − X)), |Î| = 2V̂·sin(δ/2)/|R + j(X_L − X)| με X_L = ${eng(XL,'Ω')}, X = ${eng(Xr,'Ω')}: <b>${eng(I,'A')}</b> (με X = 0: ${eng(D/Math.hypot(m.R,XL),'A')})</li>`;}
  else if(m.mode==='ma'){Vq=(m.sense==='ind'?-1:1)*(m.ma??0.5)*m.N*m.Vdc;const a=m.R*m.R+XL*XL,b=-2*XL*Vq,cc=Vq*Vq-D*D;I=(-b+Math.sqrt(b*b-4*a*cc))/(2*a);
   h+=`<li>Σταθερή τάση V̂_q = m_a·N·V_C = ${eng(Math.abs(Vq),'V')} σε τετραγωνισμό: |ΔV̂| = |(R + jX_L)·Î ${Vq>0?'−':'+'} jV̂_q| → <b>|Î| = ${eng(I,'A')}</b>· η «αντίδραση» V_q/Î αλλάζει με το ρεύμα</li>`;}
  else{I=schedNow(m.Iref,tnow);h+=`<li>Έλεγχος ρεύματος: Î → I_ref = <b>${eng(I,'A')}</b>, η απαιτούμενη X = X_L − √((2V̂·sin(δ/2)/Î)² − R²) = ${eng(XL-Math.sqrt(Math.max((D/I)**2-m.R*m.R,0)),'Ω')}</li>`;}
  h+='</ul>';if(tnow<0.3)return h+'<p class="muted small">Τρέξε την προσομοίωση (μετρήσεις στους τέσσερις τελευταίους κύκλους, ~0,2 s μετά από κάθε βήμα της αναφοράς).</p>';
  const ia=fundOf('I:L1',f),va=fundOf(m.fast?'Y:CH1/X':'Y:CH1/VAB',f),vc=[...Array(m.N)].map((_,k)=>s.now(cells(1)+(k+1))),sw=s.now('Y:CH1/NLC:sw');
  const rows=[['|Î| (θεμελιώδης)',I,ia,'A'],['|V̂_q| (θεμελιώδης)',Math.abs(m.mode==='i'?NaN:Vq),va,'V']];if(m.mode==='x')rows.push(['X μετρημένη (μέση, 4 κύκλοι)',Xr,avgOver('Y:SC1/XM',4*nT)?.avg,'Ω']);
  rows.push(['V̄_C (μέση)',m.Vdc,avgOver('Y:CH1/NLC:vav',4*nT)?.avg,'V']);
  return h+cmpRows(rows)+`<p class="small">Τάσεις πυκνωτών τώρα: ${eng(Math.min(...vc),'V',4)} … ${eng(Math.max(...vc),'V',4)} (διασπορά ${eng(Math.max(...vc)-Math.min(...vc),'V',3)}). Αλλαγές κατάστασης υπομονάδων: ${fmt(sw,6)}, δηλαδή ${eng(sw/m.N/Math.max(tnow,1e-9),'Hz',3)} ανά υπομονάδα. Δθ = ${fmt(s.now('Y:SC1/DTH')*180/Math.PI,3)}°.</p>`;}
 const q=ssscNet3(m,Number.isFinite(Xr)?Xr:0),q0=ssscNet3(m,0);
 h+=`<li>Φασιθέτες του δικτύου (το ίδιο κύκλωμα με σταθερές εμπεδήσεις: δίκτυο E = U_n/√3 πίσω από U_n²/S″k, γραμμές π, φορτίο Y = (P − jQ)/U_n², ο SSSC ως −jX σε σειρά με jωL_σ = ${eng(2*Math.PI*f*(m.Lk||0),'Ω')}). Με X = ${eng(Number.isFinite(Xr)?Xr:0,'Ω')}: |I| = <b>${eng(q.I,'A')}</b> RMS, P μέσω του SSSC (1–4–2) = <b>${eng(q.P14,'W')}</b>, μέσω του ζυγού 3 = ${eng(q.P13,'W')}, |V₂| = ${fmt(q.V2pu,5)} pu. Με X = 0: ${eng(q0.P14,'W')} και ${eng(q0.P13,'W')}</li>
  <li>Η ίδια λύση με τη ροή φορτίου του pcl.network: <code>net.sssc(κλάδος, X=…)</code> στον κλάδο της σύζευξης, φορτίο με zip = (1, 0, 0) (tests/test_sssc.py)</li></ul>`;
 if(tnow<0.3)return h+'<p class="muted small">Τρέξε την προσομοίωση (μετρήσεις στους τέσσερις τελευταίους κύκλους, ~0,2 s μετά από κάθε βήμα της αναφοράς).</p>';
 const rows=[],unb=!!m.unb;for(const p of ['a','b','c'])rows.push([`|I| φάσης ${p} (RMS θεμελιώδους)`,unb?NaN:q.I,fundOf('Y:AM'+p,f)/Math.SQRT2,'A']);
 if(cen)rows.push(['X θετικής ακολουθίας (μέση, 4 κύκλοι)',Xr,avgOver('Y:SC3/XM',4*nT)?.avg,'Ω']);
 else for(const p of ['a','b','c'])rows.push([`X φάσης ${p} (μέση, 4 κύκλοι)`,Xr,avgOver('Y:SC'+p+'/XM',4*nT)?.avg,'Ω']);
 rows.push(['|V₂| (RMS φάσης a)',unb?NaN:q.V2,phaseRms('V:LD2/Ra',T,4*nT),'V']);
 for(const p of ['a','b','c'])rows.push([`V̄_C φάσης ${p}`,m.Vdc,avgOver('Y:CH'+p+'/NLC:vav',4*nT)?.avg,'V']);
 const tail=cen?`D_k (σε φάση με το ρεύμα): ${['a','b','c'].map(p=>eng(avgOver('Y:SC3/D'+p,4*nT)?.avg,'V',3)).join(', ')}· u = ${eng(avgOver('Y:SC3/U',4*nT)?.avg,'V/s',3)}. Ένας ελεγκτής για τις τρεις φάσεις: μία X, και κάθε φάση παίρνει την ενεργό ισχύ που της χρειάζεται για να μείνει η V̄_k στη V̄.${unb?' Με την ασυμμετρία (10 Ω στη φάση a) τα ρεύματα διαφέρουν και η λύση με φασιθέτες της κάρτας (συμμετρική) δεν ισχύει· με συγχρονισμό στη θετική ακολουθία η τάση της φάσης a δεν είναι κάθετη στο ρεύμα της και το D_a αναπληρώνει τη διαφορά.':''}`
  :`Δθ: ${['a','b','c'].map(p=>fmt(s.now('Y:SC'+p+'/DTH')*180/Math.PI,3)+'°').join(', ')}. Κάθε φάση έχει δικό της PLL και βρόχο τάσης: οι τρεις X ταυτίζονται, οι Δθ διαφέρουν όσο διαφέρουν οι απώλειες και η αρχική φόρτιση.`;
 return h+cmpRows(rows)+`<p class="small">${tail}</p>`;}
// 4.17 (§50): the CCSC. The device as a series reactance X between two sources (X mode: I = 2V̂·sin(δ/2)/|R + j(X_L − X)|;
// fixed m_a: |ΔV̂| = |(R + jX_L)·Î − jV̂_q|), the capacitor's share I_C = V_q/X_C = (X/X_C)·I in phase with the line current,
// the converter the rest I − I_C (opposite past the natural point X = X_C), the internal loop C_s–L_c at 1/(2π√(L_c·C_s))
function ccscTheory(){const s=S.sim,m=(S.tutMeta||{}).ccsc;if(!s||!m)return '';const f=m.f,T=s.T,nT=Math.max(1,Math.round(1/(f*T))),tnow=s.t,w=2*Math.PI*f,XL=w*m.L,D=2*m.V*Math.sin(m.d*Math.PI/360);
 const fr=1/(2*Math.PI*Math.sqrt(m.Lc*m.Cs)),stage=tnow<m.t1?0:tnow<m.t2?1:2;
 // the converter's branch Z_c = R_c + (jωL_c ∥ R_p) and a lossless arm with v_arm = (V_d − jX)·I (X its measured
 // reactance, V_d for no active power): the device Z = (Z_c + v_arm/I)/(1 + jZ_c/X_C), I_conv/I = 1 − jZ/X_C (exactly
 // 0 at X = X_C); P_arm = 0 is a quadratic in V_d, the small root
 const cm=(a,b)=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]],cdv=(a,b)=>{const q=b[0]*b[0]+b[1]*b[1];return [(a[0]*b[0]+a[1]*b[1])/q,(a[1]*b[0]-a[0]*b[1])/q];},cab=a=>Math.hypot(a[0],a[1]);
 const wl=w*m.Lc,Rp=m.Rp||1e12,Zl=cdv([0,wl*Rp],[Rp,wl]),Zc=[m.Rc+Zl[0],Zl[1]],aa=[1-Zc[1]/m.Xc,Zc[0]/m.Xc],k=cdv([1/m.Xc,0],aa);
 const dev=X=>{const jkZ=cm([0,1],cm(k,Zc)),A=[1-jkZ[0]-k[0]*X,-jkZ[1]-k[1]*X],B=[k[1],-k[0]],qa=B[0],qb=A[0]-X*B[1],qc=-X*A[1];
  let Vd;if(Math.abs(qa)<1e-12)Vd=-qc/qb;else{const ds=Math.sqrt(Math.max(qb*qb-4*qa*qc,0)),r1=(-qb+ds)/(2*qa),r2=(-qb-ds)/(2*qa);Vd=Math.abs(r1)<Math.abs(r2)?r1:r2;}
  const Z=cdv([Vd+Zc[0],-X+Zc[1]],aa),Iv=[A[0]+B[0]*Vd,A[1]+B[1]*Vd];return {Z,iv:cab(Iv),ic:cab([1-Iv[0],-Iv[1]])};};
 const lineI=Z=>D/Math.hypot(m.R+Z[0],XL+Z[1]);
 let X=NaN,I=NaN,Vq=NaN,Ic=0,Iv=0,Zd=null;
 if(stage===0){X=0;I=D/Math.hypot(m.R,XL);}
 else if(stage===1){X=m.Xc;I=D/Math.hypot(m.R,XL-X);Vq=X*I;Ic=I;}
 else{let d0;if(m.mode==='x'){X=schedNow(m.X,tnow);d0=dev(X);I=lineI(d0.Z);}
  else{Vq=(m.ma??0.5)*m.N*m.Vdc;const a=m.R*m.R+XL*XL,b=-2*XL*Vq,cc=Vq*Vq-D*D;I=(-b+Math.sqrt(b*b-4*a*cc))/(2*a);
   for(let n=0;n<40;n++){X=Vq/I;d0=dev(X);const In=lineI(d0.Z);if(Math.abs(In-I)<1e-9*I){I=In;break;}I=In;}X=Vq/I;d0=dev(X);}
  Vq=X*I;Zd=d0.Z;Ic=d0.ic*I;Iv=d0.iv*I;}
 let h=`<div class="tm"><span class="badge">CCSC</span> C_s = ${eng(m.Cs,'F')} (X_C = ${eng(m.Xc,'Ω')}) ∥ μετατροπέας ${m.N} × ${eng(m.Vdc,'V')} (ως ${eng(m.N*m.Vdc,'V')}) με L_c = ${eng(m.Lc,'H')}, R_c = ${eng(m.Rc,'Ω')}</div><ul class="eqs">
  <li>Οι δύο κλάδοι έχουν την ίδια τάση: ο μετατροπέας την επιβάλλει και ο πυκνωτής παίρνει I_C = V_q/X_C, σε φάση με το ρεύμα της γραμμής (η τάση καθυστερεί 90° από το ρεύμα, το ρεύμα του πυκνωτή προηγείται 90° από την τάση)· ο μετατροπέας φέρει I − I_C</li>
  <li>Με τον κλάδο Z_c = R_c + (jωL_c ∥ R_p) και τάση βραχίονα (V_d − jX)·I (V_d ώστε ο βραχίονας να μην παίρνει ενεργό ισχύ): Z = (Z_c + V_d − jX)/(1 + jZ_c/X_C), I_C/I = jZ/X_C, I_conv/I = 1 − jZ/X_C· στο X = X_C ακριβώς Z = −jX_C και I_conv = 0${Zd?`· τώρα Z = ${eng(Zd[0],'Ω')} − j${eng(-Zd[1],'Ω')} (το R ≥ 0: οι απώλειες του κλάδου από τη γραμμή)`:''}</li>
  <li>Η διάταξη ως αντίδραση σε σειρά X = V_q/I: X = X_C στο φυσικό σημείο (ρεύμα μετατροπέα ≈ 0)· X &gt; X_C: boost, I_C &gt; I, το ρεύμα του μετατροπέα αντίθετο· X &lt; X_C: ο μετατροπέας παίρνει μέρος του ρεύματος· X &lt; 0: επαγωγική, ο μετατροπέας φέρει I + |I_C|</li>
  <li>Ενεργός ισχύς του μετατροπέα: ½·V_d·I με V_d το μέρος της τάσης σε φάση με το ρεύμα της γραμμής, όποιο κι αν είναι το ρεύμα του μετατροπέα (ο πυκνωτής δεν παίρνει ενεργό ισχύ)· άρα ο βρόχος V_C → Δθ του m-SSSC μένει ίδιος, με το PLL στο ρεύμα της γραμμής</li>
  <li>Ο βρόχος C_s–L_c: f_r = 1/(2π√(L_c·C_s)) = ${eng(fr,'Hz')}· οι αρμονικές της σκάλας κλείνουν κυρίως μέσα από τον πυκνωτή (|Z_C,h| = X_C/h έναντι της γραμμής ~h·X_L), γι' αυτό το ρεύμα της γραμμής μένει σχεδόν ημιτονικό· η R_c αποσβένει</li>
  <li>Τώρα (${['παράκαμψη: χωρίς αντιστάθμιση','μόνο ο πυκνωτής','μετατροπέας σε λειτουργία'][stage]}): X = ${eng(X,'Ω')}, |Î| = 2V̂·sin(δ/2)/|R + jX_L + Z| = <b>${eng(I,'A')}</b>${stage?`, I_C = <b>${eng(Ic,'A')}</b>, ρεύμα μετατροπέα I − I_C = <b>${eng(Iv,'A')}</b>`:''}</li></ul>`;
 if(tnow<0.3)return h+'<p class="muted small">Τρέξε την προσομοίωση (μετρήσεις στους τέσσερις τελευταίους κύκλους).</p>';
 const rows=[['|Î| γραμμής (θεμελιώδης)',I,fundOf('I:L1',f),'A'],['|Î_C| πυκνωτή (θεμελιώδης)',Ic,fundOf('Y:AM3',f),'A']];
 if(stage===2){rows.push(['|Î| μετατροπέα (θεμελιώδης)',Iv,fundOf('Y:AM2',f),'A'],['X μετρημένη (μέση, 4 κύκλοι)',X,avgOver('Y:SC1/XM',4*nT)?.avg,'Ω'],['V̄_C (μέση)',m.Vdc,avgOver('Y:CH1/NLC:vav',4*nT)?.avg,'V']);}
 return h+cmpRows(rows)+`<p class="small">Δθ = ${fmt(s.now('Y:SC1/DTH')*180/Math.PI,3)}°. Τα μεταβατικά στα ${fmt(m.t1,3)} s (μπαίνει ο πυκνωτής) και στα ${fmt(m.t2,3)} s (κλείνει ο κλάδος: αν η τάση του μετατροπέα διαφέρει από του πυκνωτή, η διαφορά πέφτει πάνω στο L_c) δεν μπαίνουν στις συγκρίσεις.</p>`;}
// 4.17 (§50): the IEEE 9 case with the three-phase m-SSSC on the line 7–6: the steady state against the load flow of
// pcl.network with the same series reactance (the table of the tutorial, IEEE9_SSSC_LF)
function ieee9ssscTheory(){const s=S.sim,m=(S.tutMeta||{}).ieee9sssc;if(!s||!m)return '';const f=m.f,T=s.T,nT=Math.max(1,Math.round(1/(f*T))),tnow=s.t;
 const Xr=schedNow(m.X,tnow),key=String(Math.round(Xr)),q=m.lf[key]||m.lf[String(m.Xf)],Vb=345e3/Math.sqrt(3);
 let h=`<div class="tm"><span class="badge">IEEE 9 + m-SSSC</span> ${m.N} × ${eng(m.Vdc,'V')} ανά φάση στη γραμμή 7–6 (κλάδος br5 του pcl.network), σύζευξη L_σ = ${eng(m.Lk,'H')}, κεντρικός ελεγκτής (${m.sync==='phase'?'SOGI ανά φάση':'θετική ακολουθία'})</div><ul class="eqs">
  <li>Θέση: <code>pcl.network.sssc_placement(ieee9())</code> με ίσα βάρη διαλέγει τον κλάδο 6–7 με X = 0,15·X_γραμμής ≈ 18 Ω (μικρότερη φόρτιση, απώλειες, απόκλιση τάσης και μέγεθος, κανονικοποιημένα με την περίπτωση χωρίς αντιστάθμιση)</li>
  <li>Ροή φορτίου με την ίδια X: <code>net.sssc(κλάδος, X=…)</code> στον κλάδο της σύζευξης 7–7s, η γραμμή 7–6 από το 7s, φορτία σταθερής εμπέδησης όπως στο EMT, γεννήτριες PV στις τάσεις τους (οι AVR τις κρατούν· οι ρυθμιστές στροφών μοιράζουν τη μικρή αλλαγή των απωλειών με τη στατικότητα τους, η ροή φορτίου τη δίνει στον ζυγό 1)</li>
  <li>Με X = ${eng(Xr,'Ω')}: |I| = <b>${eng(q?.I,'A')}</b> RMS, P = ${eng(q?Math.abs(q.P)*1e6:NaN,'W')} από τον ζυγό 6 προς τον 7, V_q = ${eng(q?.Vq,'V')} RMS, άεργος του SSSC 3·X·I² = ${eng(q?3*Xr*q.I*q.I:NaN,'var')}</li></ul>`;
 if(tnow<0.3)return h+'<p class="muted small">Τρέξε την προσομοίωση· οι συγκρίσεις έχουν νόημα αφού ηρεμήσουν οι γεννήτριες (~1,5 s μετά το βήμα).</p>';
 const rows=[];for(const p of ['a','b','c'])rows.push([`|I| φάσης ${p} (RMS θεμελιώδους)`,q?.I,fundOf('Y:AM'+p,f)/Math.SQRT2,'A']);
 rows.push(['X θετικής ακολουθίας (μέση, 4 κύκλοι)',Xr,avgOver('Y:SC3/XM',4*nT)?.avg,'Ω']);
 for(const [ld,b] of [['LD5',5],['LD7',7],['LD9',9]])rows.push([`|V| ζυγού ${b}`,q?.['V'+b],phaseRms('V:'+ld+'/Ra',T,4*nT)/Vb,'pu']);
 for(const p of ['a','b','c'])rows.push([`V̄_C φάσης ${p}`,m.Vdc,avgOver('Y:CH'+p+'/NLC:vav',4*nT)?.avg,'V']);
 return h+cmpRows(rows)+`<p class="small">Χωρίς SSSC (X = 0): |I| = ${eng(m.lf['0'].I,'A')}. Η συχνότητα μένει λίγο κάτω από τα 60 Hz (στατικότητα των ρυθμιστών), άρα οι γωνίες δ γλιστρούν αργά ως προς τη σταθερή αναφορά των 60 Hz.</p>`;}
// 4.14 (§42): the MMC-HVDC link. The steady state from the ratings and the measured powers: AC current, DC current, arm
// currents (I_dc/3 ± Î/2), the energy of the capacitors and their ripple (ΔW_arm = S/(3mω)·(1 − (m·cosφ/2)²)^{3/2}), the
// losses; compared with the means of the last 20 ms (base period 20 ms)
function hvdcTheory(){const s=S.sim,m=(S.tutMeta||{}).hvdc;if(!s||!m)return '';const w=2*Math.PI*50,Vb=m.Vac*Math.SQRT2/Math.sqrt(3),Vc=m.Vdc/m.N,en=m.model!=='m4'&&m.ectl!=='direct';
 const H=3*m.N*m.C*Vc*Vc/m.S,Wa=m.N*m.C*Vc*Vc/2,names={m1:'Model 1: κάθε υπομονάδα από IGBT και διόδους',m2:'Model 2: ισοδύναμο βραχίονα με κάθε πυκνωτή',m3:'Model 3: συνάρτηση μεταγωγής βραχίονα (ένας πυκνωτής C/N)',m4:'Model 4: μέσο μοντέλο'};
 let h=`<div class="tm"><span class="badge">MMC-HVDC</span> ${names[m.model]||m.model} · N = ${m.N} ανά βραχίονα, V_C = ${eng(Vc,'V')}, C = ${eng(m.C,'F')} · ενέργεια ${fmt(H*1000,3)} kJ/MVA</div><ul class="eqs">
  <li>Βραχίονες: v_u = V_dc/2·(1 − m_j) − u_c,j, v_l = V_dc/2·(1 + m_j) − u_c,j· ${en?'στάθμη n = round(N·v_ref/Σv_C) από τη μετρημένη Σv_C κάθε βραχίονα (βάζει ακριβώς την αναφορά)':'στάθμη n = round(v_ref/V_C) από την ονομαστική V_C (η ενέργεια των βραχιόνων ισορροπεί μόνη της)'}, ταξινόμηση όταν αλλάζει το n. Τάση AC e_j = (v_l − v_u)/2 = m_j·V_dc/2 πίσω από L_arm/2</li>${en?`
  <li>Έλεγχος ενέργειας (4.15): u_c,j = u₀ + u_CCSC,j + u_bal,j· u₀ = (V_dc,ονομ − v_W)/2 − R_d·i_z0,HP με v_W = √(Σ_k Σv_C,k²/6), άρα 2L_arm·di_z/dt = v_dc − v_W (η πλευρά DC του Model 4)· εξισορρόπηση με κυκλοφορούν i_h,j = −k_h·ΔW_j/V_dc (συνεχές) και i_v,j = k_v·(W_u,j − W_l,j)·m_j/(V_dc·⟨m²⟩) (θεμελιώδους)</li>`:''}
  <li>CCSC: i_z = (i_u + i_l)/2 σε dq αρνητικής ακολουθίας στο 2ω₀t, PI στο μηδέν με αποσύζευξη 2ω₀L_arm· το I_dc/3 (μηδενική ακολουθία) μένει</li>
  <li>Έλεγχος: P (σταθμός 1, με όριο υπέρτασης DC) και V_dc (σταθμός 2) στον άξονα d, Q στον q· ρεύμα σε dq με αποσύζευξη, m = v_c·V̂/(v_s/2) με v_s ${en?'= V_dc,ονομ':'τη μέση Σv_C βραχίονα'}· anti-windup στους εξωτερικούς ολοκληρωτές</li>
  <li>Μέσο μοντέλο: C_dc = 6C/N = ${eng(6*m.C/m.N,'F')}, L_dc = (2/3)L_arm, R = (2/3)N·R_on· ισχύς I_dc·V_dc = Σ v_conv,j·i_j</li></ul>`;
 if(s.t<0.3)return h+'<p class="muted small">Τρέξε την προσομοίωση (μετρήσεις στα τελευταία 20 ms, μετά τα 0,3 s).</p>';
 const P1=avgOver('Y:CT1/PP',1)?.avg,P2=avgOver('Y:CT2/PP',1)?.avg,v1=avgOver('Y:CT1/Fvdc',1)?.avg,Idc=avgOver('Y:MMC1/IDC',1)?.avg,Pw=P1*m.S;
 const vg=avgOver('Y:CT1/VG',1)?.avg??1,I=Pw/(1.5*Vb*vg),mm=Vb*vg/(m.Vdc/2),dW=Math.abs(Pw)/(3*mm*w)*Math.pow(Math.max(1-(mm/2)**2,0),1.5);
 const rows=[['I_dc σταθμού 1 = P/V_dc',Pw/(v1*m.Vdc),Idc,'A'],['Î AC σταθμού 1 = 2P/(3V̂), V̂ η μετρημένη στον μετατροπέα',I,lastPP('Y:MMC1/IAa')/2,'A'],['V_dc σταθμού 1 (pu)',1,v1,''],['Απώλειες (P₁ + P₂)/P₁',NaN,(P1+P2)/P1,'']];
 if(m.model!=='m4'){const key=m.model==='m1'?null:'Y:MMC1/AUa';if(key){const pp=lastPP(key);rows.push(['Κυμάτωση Σv_C άνω βραχίονα a (κορυφή–κορυφή)',dW/(m.N*m.C*Vc)*m.N,pp,'V']);}
  if(en){const vw=avgOver('Y:MMC1/VW',1)?.avg,vd=avgOver('Y:MMC1/VDC',1)?.avg,ua=m.model==='m1'?null:avgOver('Y:MMC1/AUa',1)?.avg,la=m.model==='m1'?null:avgOver('Y:MMC1/ALa',1)?.avg;
   rows.push(['v_W (ενέργεια των βραχιόνων) ≈ V_dc στους ακροδέκτες',vd,vw,'V']);if(ua!=null&&la!=null)rows.push(['(Σv_C,άνω − Σv_C,κάτω)/V_dc, φάση a (εξισορρόπηση)',NaN,(ua-la)/m.Vdc,'']);}
  rows.push(['Ρεύμα άνω βραχίονα a, κορυφή ≈ I_dc/3 + Î/2',Math.abs(Idc)/3+I/2,Math.max(Math.abs(avgOver(m.model==='m1'?'Y:MMC1/UaI':'Y:MMC1/AUa:i',1)?.max??NaN),Math.abs(avgOver(m.model==='m1'?'Y:MMC1/UaI':'Y:MMC1/AUa:i',1)?.min??NaN)),'A']);}
 return h+cmpRows(rows)+`<p class="small">ΔW βραχίονα ≈ ${eng(dW,'J')} από ${eng(Wa,'J')} (m = ${fmt(mm,3)}, cosφ = 1)· η κυμάτωση της Σv_C ≈ ΔW/(C/N·V_dc). P₁ = ${fmt(P1,4)} pu, P₂ = ${fmt(P2,4)} pu.</p>`;}
// 4.18 (§58): the grid-forming converters. The steady states of the laws against the run: the island (droop or VSM:
// one frequency, P shared by the ratings), the synchronverter of Zhong & Weiss (set mode, droops), the PSC in a weak grid
// (P = P_ref, the load angle from P = E·V_g·sin δ/X, the voltage at the point of connection). THEORY §8Ε
// 4.20.2: the island with two dVOC units. Each unit on its own law (Tayyebi et al. 2020 (22a) at the steady state, κ = π/2):
// 1 − ω = η·(P/E² − P_ref/V*²) with η = m_p·V*², and the amplitude (22b): Q = E²·(Q_ref + α·(V*² − E²))/V*², α = 1/(2·n_q·V*)
// 4.20.3: with the angle κ of each unit's coupling (dvs 'kappa') the law of (21) in polar form for any κ, at the steady
// state with ΔP = P_ref − P/E² and ΔQ = −Q/E² (V* = 1, Q_ref = 0): 1 − ω = −η·(sin κ·ΔP − cos κ·ΔQ) and cos κ·ΔP + sin κ·ΔQ =
// −α·(1 − E²); dvs 'black': the oscillators start from E₀ = 0,01 pu
function gfmIslandDvoc(m,g){const s=S.sim,eta=m.mp,al=1/(2*m.nq),kp=m.dvs==='kappa',D=Math.PI/180;
 let h=`<div class="tm"><span class="badge">Grid-forming dVOC</span> η = m_p·V*² = ${fmt(eta,3)}, α = 1/(2·n_q·V*) = ${fmt(al,3)} · R_v = ${fmt(m.rv,2)} pu · ${m.inner==='cascade'?'καταρράκτης τάσης–ρεύματος':'άμεσα η τάση'} · S₁ = ${eng(m.S1,'VA')}, S₂ = ${eng(m.S2,'VA')} · X_v = ${fmt(m.xv,2)} pu${kp?` · κ₁ = ${fmt(m.kap[1],4)}°, κ₂ = ${fmt(m.kap[2],4)}°`:m.dvs==='black'?' · εκκίνηση από E₀ = 0,01 pu':''}</div><ul class="eqs">
  ${kp?`<li>Η μορφή (21) σε αβ (Tayyebi κ.ά. 2020· Colombino κ.ά. 2019 (9), (25)) με κ = atan(X/R) της σύζευξης κάθε μονάδας (X_v και γραμμή πάνω σε R_v και γραμμή), σε πολικές: dθ/dt = ω₀·(1 + η·(sin κ·ΔP − cos κ·ΔQ)), dE/dt = ω₀·η·((cos κ·ΔP + sin κ·ΔQ)·E + α·(V*² − E²)·E/V*²), ΔP = P_ref/V*² − P/E², ΔQ = Q_ref/V*² − Q/E²</li>
  <li>Με κ < 90° η P και η Q μοιράζονται τη συχνότητα και το πλάτος: η συχνότητα πέφτει λιγότερο και η τάση περισσότερο από ό,τι με κ = 90°</li>`:`<li>dθ/dt = ω₀·(1 + η·(P_ref/V*² − P/E²)), dE/dt = ω₀·η·((Q_ref/V*² − Q/E²)·E + α·(V*² − E²)·E/V*²) (Tayyebi κ.ά. 2020 (22), το (21) σε πολικές για επαγωγικό δίκτυο), με P, Q στην τάση του ταλαντωτή E</li>
  <li>Στη μόνιμη: 1 − ω = η·(P/E² − P_ref/V*²) και Q = E²·(Q_ref + α·(V*² − E²))/V*² σε κάθε μονάδα· κοντά στο V* η στατικότητα 2 % και 5 % (Seo κ.ά. 2019)</li>${m.dvs==='black'?`<li>Εκκίνηση από E₀ = 0,01 pu: το E = 0 είναι σημείο ηρεμίας του ταλαντωτή· από κάθε E > 0 το πλάτος ανεβαίνει σχεδόν εκθετικά, με ρυθμό ω₀·η·α, ως το V* (Colombino κ.ά. 2019)</li>`:''}`}
  <li>Η εικονική αντίσταση R_v κάνει τη σύζευξη πιο ωμική: ο ταλαντωτής δεν μπορεί να είναι γρηγορότερος από τη σταθερά χρόνου L/R των γραμμών (Groß κ.ά. 2019, Πρόταση 2)</li></ul>`;
 if(s.t<0.4)return h+'<p class="muted small">Τρέξε την προσομοίωση (μετρήσεις στις δύο τελευταίες περιόδους).</p>';
 const pr=s.t>=m.tpref?m.pref1:0,rows=[];
 for(const [k,P0] of [[1,pr],[2,0]]){const p=g(`Y:CT${k}/PP`),q=g(`Y:CT${k}/QQ`),w=g(`Y:CT${k}/WW`),e=g(`Y:CT${k}/EE`);
  if(kp){const sk=Math.sin(m.kap[k]*D),ck=Math.cos(m.kap[k]*D),dP=P0-p/(e*e),dQ=-q/(e*e);
   rows.push([`Μονάδα ${k}: f = f₀·(1 + η·(sin κ·ΔP − cos κ·ΔQ))`,m.f*(1+eta*(sk*dP-ck*dQ)),m.f*w,'Hz'],[`Μονάδα ${k}: cos κ·ΔP + sin κ·ΔQ = −α·(1 − E²)`,-al*(1-e*e),ck*dP+sk*dQ,'']);continue;}
  rows.push([`Μονάδα ${k}: f = f₀·(1 + η·(P_ref − P/E²))`,m.f*(1+eta*(P0-p/(e*e))),m.f*w,'Hz'],[`Μονάδα ${k}: Q = E²·α·(1 − E²)`,e*e*al*(1-e*e),q,'']);}
 return h+cmpRows(rows)+`<p class="small">P₁·S₁ + P₂·S₂ = ${eng(g('Y:CT1/PP')*m.S1+g('Y:CT2/PP')*m.S2,'W')}· P_ref,1 = ${fmt(pr,2)} pu ${s.t>=m.tpref?'(από τα 1,0 s)':''}.</p>`;}
function gfmTheory(){const s=S.sim,m=(S.tutMeta||{}).gfm;if(!s||!m)return '';const g=k=>avgOver(k,2)?.avg,D=Math.PI/180;
 if(m.kind==='island'&&m.law==='dvoc')return gfmIslandDvoc(m,g);
 if(m.kind==='island'){const vsm=m.law==='vsm';
  let h=`<div class="tm"><span class="badge">Grid-forming</span> ${vsm?'VSM (H = 1 s, D_p = 1/m_p)':'στατικότητα με φίλτρο 5 Hz'} · ${m.inner==='cascade'?'καταρράκτης τάσης–ρεύματος':'άμεσα η τάση'} · S₁ = ${eng(m.S1,'VA')}, S₂ = ${eng(m.S2,'VA')} · X_v = ${fmt(m.xv,2)} pu</div><ul class="eqs">
   <li>${vsm?'2H·dω/dt = P_ref − P/ω − (ω − 1)/m_p (Zhong & Weiss (6), (9))· στη μόνιμη (1 − ω)·ω = m_p·(P − P_ref)':'ω = 1 − m_p·(P_f − P_ref), E = V* − n_q·(Q_f − Q_ref) (Rocabert κ.ά. (8)–(9))'}, m_p = 2 %, n_q = 5 % στη βάση κάθε μονάδας</li>
   <li>Μία συχνότητα: ΣS_k·P_k = P_φορτίου ⇒ 1 − ω = m_p·(P_φορτίου − S₁·P_ref,1)/(S₁ + S₂)${vsm?' (÷ω)':''}· η ενεργός ισχύς μοιράζεται ανάλογα με τα S_k (ίδιο pu), ανεξάρτητα από τις γραμμές</li>
   <li>Η άεργος δεν μοιράζεται ακριβώς: E_k − V ≈ X_k·Q_k, με X_k η γραμμή και η εικονική αντίδραση X_v (Rocabert κ.ά. (7), (19))</li></ul>`;
  if(s.t<0.4)return h+'<p class="muted small">Τρέξε την προσομοίωση (μετρήσεις στις δύο τελευταίες περιόδους).</p>';
  const p1=g('Y:CT1/PP'),p2=g('Y:CT2/PP'),w1=g('Y:CT1/WW'),w2=g('Y:CT2/WW'),pr=s.t>=m.tpref?m.pref1:0,rhs=m.mp*(p1*m.S1+p2*m.S2-m.S1*pr)/(m.S1+m.S2);
  const wt=vsm?(1+Math.sqrt(Math.max(1-4*rhs,0)))/2:1-rhs;
  return h+cmpRows([['Συχνότητα (από τις μετρημένες P)',m.f*wt,m.f*w1,'Hz'],['f₂ − f₁',0,m.f*(w2-w1),'Hz'],['P₁ − P₂ (pu της μονάδας)',pr,p1-p2,''],['P₁·S₁ (W)',NaN,p1*m.S1,'W'],['P₂·S₂ (W)',NaN,p2*m.S2,'W'],['Q₁ − Q₂ (pu)',NaN,g('Y:CT1/QQ')-g('Y:CT2/QQ'),'']])+
   `<p class="small">Φορτίο ${eng(p1*m.S1+p2*m.S2,'W')}· P_ref,1 = ${fmt(pr,2)} pu ${s.t>=m.tpref?'(από τα 1,0 s)':''}.</p>`;}
 if(m.kind==='sync'){const gg=m.fg/m.f;
  let h=`<div class="tm"><span class="badge">Synchronverter</span> Zhong & Weiss 2011, Πίν. I: 100 W, 20,78 V, L_s = L_g = 0,45 mH, C = 22 μF · δίκτυο ${fmt(m.fg,4)} Hz · H = ${fmt(m.H,2)} s (τ_f = ${eng(m.tf,'s')})</div><ul class="eqs">
   <li>J·θ̈ = T_m − T_e − D_p·(θ̇ − θ̇_r), T_e = P/θ̇, P = θ̇·M_f·i_f·⟨i, sin θ̃⟩ (εξ. (6), (7), (9)), J = D_p·τ_f, D_p για 100 % P στο −0,5 % της συχνότητας</li>
   <li>K·d(M_f·i_f)/dt = Q_set − Q + D_q·(V_r − V_m), K = θ̇ₙ·D_q·τ_v, D_q για 100 % Q στο −5 % της τάσης· E = θ̇·M_f·i_f</li>
   <li>Ως τα ${fmt(m.tdr,2)} s («set mode»): θ̇_r = η συχνότητα του δικτύου, χωρίς D_q ⇒ P = θ̇·P_set, Q = Q_set. Μετά: P = θ̇·(P_set + D_p·(θ̇ₙ − θ̇)), Q = Q_set + D_q·(V_r − V_m)</li>
   <li>Ο αργός πόλος του δρομέα: 2H·s² + D_p·s + ω₀·K_s = 0 με K_s = E·V/X (X = X_s + X_g)</li></ul>`;
  if(s.t<0.2)return h+'<p class="muted small">Τρέξε την προσομοίωση.</p>';
  const ps=s.t>=m.tps?m.Pset:0,qs=s.t>=m.tqs?m.Qset:0,dr=s.t>=m.tdr,vm=g('Y:CT/VG'),P=g('Y:CT/PP'),Q=g('Y:CT/QQ');
  const pt=dr?gg*(ps+(1-gg)/m.mp):gg*ps,qt=dr?qs+(1-vm)/m.nq:qs;
  return h+cmpRows([['P (W)',100*pt,100*P,'W'],['Q (var)',100*qt,100*Q,'var'],['θ̇/ω₀ = f_δικτύου/f₀',gg,g('Y:CT/WW'),'']])+`<p class="small">${dr?'Στατικότητες ενεργές':'Set mode'}· V_m = ${fmt(vm,4)} pu${s.t>=m.tdip?' (δίκτυο −5 %)':''}.</p>`;}
 if(m.kind==='weak'){const psc=m.ctl==='psc',rob=m.ctl==='gflw',X=m.Xc+m.Xtr+m.Xg,Xp=m.Xtr+m.Xg;
  // 4.18.1: the static limit seen from the PCC (|u| held at 1 by either control, grid EMF 1): P_max = 1/(X_T + X_g), for the SCR of the options
  const lim=[1,1.5,2,3,5].map(k=>[k,1/(m.Xtr+1/k)]);
  let h=`<div class="tm"><span class="badge">${psc?'PSC':rob?'Στιβαρός έλεγχος ρεύματος':'Έλεγχος ρεύματος (4.18)'}</span> Zhang, Harnefors & Nee 2010, Πίν. I: 350 MVA, 195 kV, X_c = 0,15 pu, μετασχηματιστής ${fmt(m.Xtr,3)} pu · SCR ${m.scr} (X_g = ${fmt(m.Xg,3)} pu)${psc?` · k_p = ${fmt(m.kp,3)} rad/s`:` · PLL ${fmt(m.pll,2)} Hz`}</div><ul class="eqs">
   <li>${psc?'dθ/dt = ω₀ + k_p·(P_ref − P) (4)· v_ref = V₀ − k_v·s/(s + α_v)·i (36)–(37), k_v = 0,477, α_v = 40 rad/s· V₀ = V_ref + K_E/(1 + T_E·s)·(U_ref − |u|) (Σχ. 11)'
    :rob?`Harnefors κ.ά. 2021: v = R_a·(i_ref − i) + jX_c·i + H(s)·E, R_a = α_c·X_c = ${fmt(m.acc*m.Xc,3)} pu, H(s) = α_c/(s + α_c), α_c = ${fmt(m.acc,2)} pu (εξ. (3)–(4)), χωρίς ολοκληρωτή (μόνο ένας αργός, 50 ms, για το στατικό σφάλμα)· i_ref = SAT{P_ref/E_ref + H·(E_ref − E)/R_a − j·(ω₁/R_a)·(H/s)·(E_ref − Re E)} (εξ. (8), (28), (32)): στο d αναλογική ρύθμιση της τάσης (η τάση του μετατροπέα «σκληραίνει»), στο q ολοκληρωτική`
    :'PLL στην τάση του σημείου σύνδεσης, P και V_ac στους άξονες d και q, ρεύμα σε dq με PI (10 ms), αποσύζευξη και πρόσθια τροφοδότηση της τάσης'}</li>
   <li>${psc?`Γωνία φορτίου ανάμεσα στην τάση του μετατροπέα και στο δίκτυο: P = E·V_g·sin δ/X, X = X_c + X_T + X_g = ${fmt(X,3)} pu (πάνω από 70° το περιθώριο μικραίνει πολύ, κάτω από 0,06 pu κέρδος ως τις 90°)`
    :`Από το σημείο σύνδεσης, με |u| = 1: P = |u|·V_g·sin δ/(X_T + X_g), X_T + X_g = ${fmt(Xp,3)} pu· στατικό όριο P_max = ${fmt(1/Xp,3)} pu στις 90°. Κοντά του το PLL (που βλέπει τη γωνία του u να αλλάζει με το ίδιο το ρεύμα) πρέπει να είναι αργό (Zhou κ.ά. 2014)`}</li>
   <li>${psc?`Στο σφάλμα: i_ref = (v_ref − u_f − jX_c·i)/(α_c·L_c) + i με |i_ref| ≤ I_max = ${fmt(m.Imax,3)} pu (54)–(55)· το εφεδρικό PLL αντί για τον βρόχο συγχρονισμού`
    :'Ο έλεγχος της 4.18 στο SCR 1 ταλαντώνεται ήδη χωρίς ισχύ (~400 Hz στο dq): ο βρόχος ρεύματος των 10 ms είναι αργός απέναντι στην καθυστέρηση της μέτρησης (φίλτρο 2 kHz, ένα βήμα) και στο PLL· με 3–5 ms ή με τον στιβαρό έλεγχο σταθεροποιείται'}</li></ul>
   <table class="cmp"><thead><tr><th>SCR</th>${lim.map(([k])=>`<th>${fmt(k,2)}</th>`).join('')}</tr></thead><tbody><tr><td>P_max από το σημείο σύνδεσης (pu)</td>${lim.map(([,q])=>`<td>${fmt(q,3)}</td>`).join('')}</tr></tbody></table>`;
  if(s.t<0.3)return h+'<p class="muted small">Τρέξε την προσομοίωση.</p>';
  const ref=(s.t>=1.2&&m.ev==='step')?m.p0+0.1:(s.t>=0.1*Math.round(m.p0*10)?m.p0:NaN);
  if(!psc){const P=-g('Y:CT/PP'),u=g('Y:CT/VG'),sd=P*Xp/Math.max(u,1e-6);return h+cmpRows([['P προς το δίκτυο (pu)',ref,P,''],['|u_pcc| (pu)',1,u,'']])+`<p class="small">Γωνία ανάμεσα στο σημείο σύνδεσης και στο δίκτυο δ = asin(P·(X_T + X_g)/|u|) = ${sd<1?fmt(Math.asin(sd)/D,3)+'°':'—'}.</p>`;}
  const P=g('Y:CT/PP'),E=g('Y:CT/EE'),u=g('Y:CT/VG'),sd=P*X/Math.max(E,1e-6);
  return h+cmpRows([['P (pu)',ref,P,''],['|u_pcc| (pu)',1,u,''],['|i| (pu) ≤ I_max',NaN,g('Y:CT/IG'),'']])+`<p class="small">Γωνία φορτίου δ = asin(P·X/(E·V_g)) = ${sd<1?fmt(Math.asin(sd)/D,3)+'°':'—'} με E ≈ V₀ = ${fmt(E,4)} pu.</p>`;}
 return '';}
// 4.18.1: IEEE 9 with a converter at bus 3. The metrics of Tayyebi et al. (2020) (23): the nadir max|ω₀ − ω(t)| after the
// step and the RoCoF |ω(t₀ + T) − ω(t₀)|/T with T = 250 ms, on the speed of G1 (its mean per cycle, from the period ring)
function ieee9GfmTheory(){const s=S.sim,m=(S.tutMeta||{}).ieee9gfm;if(!s||!m)return '';const f=m.f,K=m.K,un=m.unit,D=Math.PI/180;
 const Kt=K.G1+K.G2+(un==='gfl0'?0:K.G3),dfs=m.dp*1e6*1.0159**2/(Kt*m.Sb);
 const names={sm:'σύγχρονη γεννήτρια G3',droop:'grid-forming με στατικότητα 5 %',vsm:'grid-forming VSM (H = 3,01 s)',gfl:'grid-following με απόκριση στη συχνότητα 5 %',gfl0:'grid-following, σταθερή P',dvoc:'grid-forming dVOC (η, α για 5 %)',match:'grid-forming matching control (ω από τη v_dc)'};
 const dcl=m.dcLim??1.2,dcT=m.dcs?` · πηγή DC ±${fmt(dcl,2)} pu (τ_dc ${fmt(m.tdc*1e3,3)} ms)`:'',p24T=m.p24?' · όριο (24): i_th 0,9 pu, γ_p 2,3'+(m.fpl?`, φίλτρο ${fmt(m.fpl,3)} Hz στο |i|`:''):'',mdT=m.mdc==='nom'?' · διαμόρφωση με την ονομαστική V_dc (9)':'';
 let h=`<div class="tm"><span class="badge">IEEE 9 · ζυγός 3: ${esc(names[un]||un)}</span> 128 MVA · βήμα +${m.dp} MW στον ζυγό 7 στο ${m.te} s · ρυθμιστές: G1 νερό (R_P 4 %), G2 ατμός (R 5 %)${dcT}${p24T}${mdT}</div><ul class="eqs">
  <li>Μετρικές (Tayyebi κ.ά. 2020, (23)): βύθισμα ‖ω‖<sub>∞</sub> = max|ω₀ − ω(t)| μετά το βήμα και RoCoF = |ω(t₀ + T) − ω(t₀)|/T με T = 250 ms, στην ταχύτητα της G1 (μέση τιμή ανά περίοδο)</li>
  <li>Μόνιμη απόκλιση με στατικότητες: Δf/f₀ = ΔP/ΣK, K = P_r/R (G1 ${fmt(K.G1,4)}, G2 ${fmt(K.G2,4)}, ζυγός 3 ${un==='gfl0'?'0':fmt(K.G3,4)} pu/pu σε 100 MVA)· με ΔP = ${m.dp} MW·V₇² ⇒ Δf ≈ ${fmt(dfs*f,3)} Hz. Οι ρυθμιστές νερού και ατμού φτάνουν εκεί σε δεκάδες δευτερόλεπτα</li>
  <li>${un==='sm'?'Η G3 δίνει αμέσως μόνο από την αδράνειά της (H = 3,01 s) και τη ρύθμιση μέσω του ατμού (δευτερόλεπτα)':un==='droop'?'Ο grid-forming αλλάζει την ισχύ του σε δεκάδες ms: ΔP = −(Δω/ω₀)/m_p·S· με φίλτρο 5 Hz έχει αδράνεια 2H = 1/(m_p·ω_f) ≈ 0,64 s':un==='vsm'?'Η VSM δίνει αδράνεια όση η G3 (H = 3,01 s) και τη στατικότητά της αμέσως, χωρίς στρόβιλο':un==='gfl'?'Ο grid-following δίνει ΔP = −(ω_PLL − 1)/m_f μετά το PLL (5 Hz) και το φίλτρο 50 ms· χωρίς αδράνεια':un==='dvoc'?`dVOC (Tayyebi κ.ά. 2020 (22)): dθ/dt = ω₀·(1 + η·(P*/V*² − P/E²)) με η = m_p·V*² (κλίση 5 %), χωρίς φίλτρο· E από τον ταλαντωτή με α = 1/(2·n_q·V*), και εικονική αντίσταση R_v ${fmt(m.Rv,3)} pu, γιατί χωρίς αυτήν ο ταλαντωτής δεν μένει σε βήμα με τη δυναμική των γραμμών (Groß κ.ά. 2019)`:un==='match'?`Matching (Tayyebi κ.ά. 2020 (16)–(19)): ω = v_dc/V_dc*, άρα αδράνεια η ενέργεια του πυκνωτή DC (H_dc ${fmt(m.Hdc,3)} s), και στατικότητα από τον έλεγχο της τάσης DC, k_dc = 1/m_p, μέσα από την πηγή DC (τ_dc ${fmt(m.tdc*1e3,3)} ms, ±${fmt(dcl,2)} pu)`:'Ο grid-following με σταθερή P: ούτε αδράνεια ούτε ρύθμιση από τον ζυγό 3'}</li>${m.dcs&&un!=='match'?`<li>Πλευρά DC (4.20.3, Tayyebi κ.ά. 2020 (10), §IV-D): η ίδια πηγή DC με την αναφορά i*_dc = k_dc·(1 − v_dc) + P_ref + (v_dc·i_x − P), k_dc = 1/m_p. Ο νόμος δεν βλέπει τη v_dc: όταν η πηγή μένει στο όριο ±${fmt(dcl,2)} pu, ο πυκνωτής DC δίνει τη διαφορά και αδειάζει (δες τη v_dc στο scope)</li>`:''}${m.p24?`<li>Όριο ρεύματος μέσω της αναφοράς (4.20.3, Tayyebi κ.ά. 2020 (24), §IV-E): P_ref − γ_p·(|i| − i_th) όταν |i| > i_th = 0,9 pu, με γ_p = 2,3, σε κάθε νόμο και στην αναφορά DC</li>`:''}</ul>`;
 const p=s.per,i=s.chIndex.get('Y:G1');if(i===undefined||!p.n||s.t<m.te+0.3)return h+'<p class="muted small">Τρέξε την προσομοίωση ως μετά το βήμα (μετρήσεις ανά περίοδο της ταχύτητας της G1).</p>';
 const rows=[];for(let k=Math.min(p.n,p.cap);k>=1;k--){const j=(p.head-k+p.cap)%p.cap;rows.push([p.t[j],p.avg[j*p.nch+i]]);}
 const pre=rows.filter(r=>r[0]>m.te-0.1&&r[0]<=m.te),w0=pre.length?pre.reduce((a,r)=>a+r[1],0)/pre.length:1,post=rows.filter(r=>r[0]>m.te);
 let nad=0,tn=NaN;for(const r of post)if(w0-r[1]>nad){nad=w0-r[1];tn=r[0]-m.te;}const at=t=>{let b=null;for(const r of rows)if(!b||Math.abs(r[0]-t)<Math.abs(b[0]-t))b=r;return b?b[1]:NaN;};
 const rc=s.t>=m.te+m.Twin?Math.abs(at(m.te+m.Twin)-w0)/m.Twin:NaN,wn=rows[rows.length-1][1],end=post.length&&nad>0&&tn<post[post.length-1][0]-m.te-0.5;
 return h+`<table class="tbl"><tr><th>Μετρική</th><th>Τιμή</th></tr><tr><td>Βύθισμα ‖Δf‖<sub>∞</sub>${end?'':' (ως τώρα· δεν έχει ακόμη γυρίσει)'}</td><td>${fmt(nad*f,4)} Hz στα ${fmt(tn,3)} s μετά το βήμα</td></tr>
  <tr><td>RoCoF σε 250 ms</td><td>${Number.isFinite(rc)?fmt(rc*f,4)+' Hz/s':'—'}</td></tr><tr><td>Συχνότητα τώρα</td><td>${fmt(wn*f,6)} Hz (Δf ${fmt((wn-w0)*f,4)} Hz· μόνιμη ≈ ${fmt(-dfs*f,3)} Hz)</td></tr></table>
  <p class="small muted">Σύγκρινε τις επιλογές του ζυγού 3 με το ίδιο βήμα. Οι τιμές που βρήκε η επαλήθευση για +50 MW είναι στο THEORY §8Ε.</p>`;}
// 4.18.1: the MMC station as a grid-forming converter (MMCC mode 'gfm'). Island: one frequency, ω = 1 − m_p·(P − P_ref) of
// station 2 (P out of it, pu of 1059 MVA); with unit B the same ω for both, so P₂ − P_ref,2 = P_B − P_ref,B (same pu);
// weak grid: P against its reference and the angle across X_T + X_g
function hvdcGfmTheory(){const s=S.sim,m=(S.tutMeta||{}).hvdcgfm;if(!s||!m)return '';const g=k=>avgOver(k,2)?.avg,D=Math.PI/180,L={droop:'στατικότητα P–f 2 %, Q–V 5 %',vsm:'VSM (H = 2 s, D_p = 1/m_p)',psc:'PSC (k_p = 50 rad/s)',dvoc:'dVOC (η = m_p, α = 1/(2·n_q), Tayyebi κ.ά. 2020 (22))'};
 let h=`<div class="tm"><span class="badge">MMC grid-forming</span> σταθμός 2: ${esc(L[m.law]||m.law)} · άμεσα η τάση, όριο ρεύματος 1,1 pu · σταθμός 1: τάση DC · MMC: ${esc(({m1:'Model 1 (κάθε υπομονάδα)',m2:'Model 2 (κάθε πυκνωτής)',m3:'Model 3 (συνάρτηση μεταγωγής)',m4:'Model 4 (μέσο μοντέλο)'})[m.model||'m4'])}, N = ${m.N||400}${m.e0==='small'?' · ταλαντωτής από E₀ = 0,01 pu':''}</div><ul class="eqs">
  <li>Ο νόμος του «Έλεγχος grid-forming» μέσα στον έλεγχο του σταθμού (MMCC, τρόπος «grid-forming»): ω και E από τον νόμο, v_ref = E − Z_v·i, όριο με το διάνυσμα αναφοράς ρεύματος (Zhang κ.ά. (54)–(55)) πάνω στην X του σταθμού· η ενέργεια των βραχιόνων και η τάση DC από τον σταθμό 1</li>
  ${m.ac==='weak'?`<li>Ασθενές δίκτυο SCR ${fmt(m.scr,2)}: P = E·V_g·sin δ/X με X = X_σταθμού + X_T + X_g</li>`:`<li>Νησίδα: μία συχνότητα, ${m.law==='psc'?'ω = 1 + k_p·(P_ref − P)/ω₀ (χωρίς στατικότητα στη μόνιμη, το PSC δεν ορίζει συχνότητα νησίδας: η P δεν μπορεί να ακολουθήσει το P_ref όταν το φορτίο είναι άλλο)':m.law==='dvoc'?'1 − ω = m_p·(P/E² − P_ref) (dVOC με V* = 1)':'1 − ω = m_p·(P − P_ref)'}${m.ac==='par'?'· με τη μονάδα B (στατικότητα 2 % στα 500 MVA) ίδια συχνότητα ⇒ P₂ − P_ref,2 = P_B − P_ref,B (ίδιο pu, χωρίς επικοινωνία)':''}</li>`}</ul>`;
 if(s.t<0.3)return h+'<p class="muted small">Τρέξε την προσομοίωση.</p>';
 const P2=g('Y:CT2/G/PP'),w2=g('Y:CT2/G/WW');
 if(m.ac==='weak'){const ref=s.t>=m.te?0.9:0.5;return h+cmpRows([['P σταθμού 2 προς το AC (pu)',ref,P2,''],['|v| (pu)',NaN,g('Y:CT2/G/VG'),''],['|i| (pu) ≤ 1,1',NaN,g('Y:CT2/G/IG'),'']]);}
 const E2=g('Y:CT2/G/EE'),rows=m.law==='psc'?[['f σταθμού 2 (pu)',NaN,w2,'']]:m.law==='dvoc'?[['f σταθμού 2 = 1 − m_p·(P₂/E² − P_ref)',1-m.mp*(P2/(E2*E2)-m.Pr2),w2,'']]:[['f σταθμού 2 = 1 − m_p·(P₂ − P_ref)',1-m.mp*(P2-m.Pr2),w2,'']];
 if(m.ac==='par'){const PB=g('Y:CTB/PP');rows.push(['P_B − P_ref,B = P₂ − P_ref,2 (pu)',P2-m.Pr2,PB-m.PrB,''],['f_B − f₂ (pu)',0,g('Y:CTB/WW')-w2,''],['P₂·S₂ (MW)',NaN,P2*m.S/1e6,'MW'],['P_B·S_B (MW)',NaN,PB*m.SB/1e6,'MW']);}
 return h+cmpRows(rows)+`<p class="small">Φορτίο ${s.t>=m.te?'900':'600'} MW (σταθερής εμπέδησης) από τα ${fmt(m.te,2)} s.</p>`;}
// 4.16: the CIGRE HVDC benchmark (LCC). Kundur ch. 10 with the measured bus voltage, I_d and α (γ at the inverter): V_d of each
// station, μ, the α of the inverter that the measured γ implies; then the run against the PSCAD results of the benchmark
// (Faruque et al. 2006, Tables I–II). Twelve pulses: two bridges in series, each with E_LL = √(3/2)·V̂·U₂/U₁ and X_c = u_k·U₂²/S_n
function lccTheory(){const s=S.sim,m=(S.tutMeta||{}).lcc;if(!s||!m)return '';const D=Math.PI/180,names={fast:'λεπτομερές (γρήγορη υλοποίηση των γεφυρών)',blocks:'λεπτομερές (αναλυτική υλοποίηση)',avg:'μέσο μοντέλο'};
 const st=q=>{const n=q.U2/q.U1,Xc=q.uk/100*q.U2*q.U2/q.Sn;return {n,Xc,Rc:6/Math.PI*Xc};},R=st(m.r),I=st(m.i);
 let h=`<div class="tm"><span class="badge">LCC-HVDC</span> ${names[m.model]||m.model} · 12 παλμοί (YNy0 + YNd1) · X_c = ${eng(R.Xc,'Ω')} / ${eng(I.Xc,'Ω')} ανά γέφυρα · R_c = (6/π)·X_c = ${eng(R.Rc,'Ω')} / ${eng(I.Rc,'Ω')} (ανορθωτής / αντιστροφέας)</div><ul class="eqs">
  <li>V_d0 = 2·(3√2/π)·E_LL (Kundur (10.29)) με E_LL = √(3/2)·V̂·U₂/U₁ (πολική RMS στις βαλβίδες)· ανορθωτής V_d = V_d0·cos α − R_c·I_d (10.30), αντιστροφέας V_d = V_d0·cos γ − R_c·I_d (10.14)</li>
  <li>Επικάλυψη: cos(α + μ) = cos α − √2·X_c·I_d/E_LL (10.10)· στον αντιστροφέα cos β = cos γ − √2·X_c·I_d/E_LL, β = π − α· cos φ ≈ (cos α + cos(α + μ))/2 (10.20), Q = P·tan φ</li>
  <li>Έλεγχος: ο ανορθωτής ρυθμίζει το ρεύμα (α ≥ 5°)· ο αντιστροφέας το γ (${m.gref}°), με έλεγχο ρεύματος στο I_ord − 0,1 pu (περιθώριο) αν ο ανορθωτής φτάσει στο α_min· ο VDCOL μειώνει την εντολή όταν πέφτει η V_d</li></ul>`;
 if(s.t<0.8)return h+'<p class="muted small">Τρέξε την προσομοίωση (μετρήσεις στις τελευταίες 5 περιόδους, μετά τα 0,8 s· μόνιμη κατάσταση γύρω στο 1,5 s).</p>';
 const g=(k,n=5)=>avgOver(k,n),Vh=k=>Math.SQRT2*(['a','b','c'].map(x=>g(k+x)?.rms??NaN).reduce((a,b)=>a+b,0)/3);
 const Vr=Vh('Y:STR/V'),Vi=Vh('Y:STI/V'),Id=g('Y:STR/IDC')?.avg,Idi=Math.abs(g('Y:STI/IDC')?.avg),Vdr=g('Y:STR/VDC')?.avg,Vdi=Math.abs(g('Y:STI/VDC')?.avg);
 const ar=g('Y:CR/AO')?.avg,ai=g('Y:CI/AO')?.avg,gm=g('Y:STI/GM')?.avg,Er=Math.sqrt(1.5)*Vr*R.n,Ei=Math.sqrt(1.5)*Vi*I.n,V0r=6*Math.SQRT2/Math.PI*Er,V0i=6*Math.SQRT2/Math.PI*Ei;
 const mu=Math.acos(Math.min(1,Math.max(-1,Math.cos(ar*D)-Math.SQRT2*R.Xc*Id/Er)))/D-ar,bi=Math.acos(Math.min(1,Math.max(-1,Math.cos(gm*D)-Math.SQRT2*I.Xc*Idi/Ei)))/D;
 const cf=Math.cos(ar*D)/2+Math.cos((ar+mu)*D)/2,Pr=Vdr*Id,Qr=Pr*Math.tan(Math.acos(Math.min(1,cf)));
 const rows=[['V_d ανορθωτή = V_d0·cos α − R_c·I_d',V0r*Math.cos(ar*D)-R.Rc*Id,Vdr,'V'],['V_d αντιστροφέα = V_d0·cos γ − R_c·I_d',V0i*Math.cos(gm*D)-I.Rc*Idi,Vdi,'V'],
  ['α αντιστροφέα = π − β από το μετρημένο γ',180-bi,ai,'°']];
 const far=[['V_d ανορθωτή (pu)',0.99,Vdr/m.Vdn,''],['V_d αντιστροφέα (pu)',0.972,Vdi/m.Vdn,''],['I_d (pu)',1,Id/m.Idn,''],['α ανορθωτή',16.92,ar,'°'],['α αντιστροφέα',141.89,ai,'°'],['γ',15.1,gm,'°']];
 return h+cmpRows(rows)+`<p class="small">Μετρημένα: V̂ = ${eng(Vr,'V')} / ${eng(Vi,'V')} στους ζυγούς, V_d0 = ${eng(V0r,'V')} / ${eng(V0i,'V')}, μ ανορθωτή = ${fmt(mu,3)}°, cos φ ≈ ${fmt(cf,3)}, P = ${eng(Pr,'W')}, Q ≈ ${eng(Qr,'var')} στον ανορθωτή.${m.model==='avg'?'':' Στο λεπτομερές το γ είναι το μικρότερο των βαλβίδων της τελευταίας περιόδου (όπως στο benchmark), άρα λίγο κάτω από τη μέση τιμή που υποθέτει ο τύπος.'}</p>
  <h4>Απέναντι στο benchmark (PSCAD, Faruque κ.ά. 2006, Πίν. I–II)</h4>`+cmpRows(far)
  +`<p class="muted small">${m.ev==='ss'?'':'Με γεγονός στο 1,0 s: η σύγκριση έχει νόημα πριν από αυτό ή αφού ξανασταθεροποιηθεί η ζεύξη. '}${m.gref!==15?'Με γ_ref ≠ 15° οι τιμές του benchmark δεν ισχύουν. ':''}Το μέσο μοντέλο δεν έχει μεταγωγές: δεν δείχνει αποτυχία μετάβασης σε μονοφασικό σφάλμα, ούτε αρμονικές.</p>`;}
// 4.13: a wideband model in a card: its groups of modes, delays, poles, the errors of the fit and the passivity check
function wbModelHTML(name,g){const f=g.fit||{},ps=g.passive||null;
 return `<p><b>${esc(name)}</b> (WB, ${g.fit?.source==='EMTP'?'από αρχείο του EMTP':'προσαρμογή '+(g.band?eng(g.band[0],'Hz')+' – '+eng(g.band[1],'Hz')+`, με δείγματα ασφαλείας ως ${eng(g.fmin,'Hz')} – ${eng(g.fmax,'Hz')} (βάρος ${fmt(g.guard?.w??0.1,2)})`:eng(g.fmin,'Hz')+' – '+eng(g.fmax,'Hz'))}): Y_c με ${g.npoles?.yc??g.yc.p.length} πόλους, H σε ${g.groups.length} ομάδες ρυθμών.</p><table class="cmp"><tr><th>ομάδα</th><th>ρυθμοί</th><th>τ</th><th>πόλοι</th></tr>`
  +g.groups.map((q,k)=>`<tr><td>${k+1}${q.dc?' (DC)':''}</td><td>${(q.modes||[]).map(x=>x+1).join(', ')||'—'}</td><td>${eng(q.tau,'s',5)}</td><td>${q.p.length+q.p.filter(z=>z[1]>0).length}</td></tr>`).join('')+'</table>'
  +`<p class="small">Σφάλμα: H ${f.h_err!=null?fmt(f.h_err,2):'—'} (απόλυτο), Y_c ${f.yc_err!=null?fmt(f.yc_err*100,2)+' %':'—'}${f.method==='fdcm'?' · διόρθωση για καλώδια (FDCM)':''}${ps?' · παθητικότητα: '+(ps.passive?'✓':'✗ ελάχιστη ιδιοτιμή '+fmt(ps.worst,2)+' στα '+eng(ps.fworst,'Hz')):''}.</p>`
  // 4.13: the nodal admittance against the exact line per band (a short section is ill-conditioned at low frequencies)
  +(f.yn_bands?`<p class="small">Σφάλμα της αγωγιμότητας κόμβων (ως προς το μεγαλύτερο στοιχείο): ${f.yn_bands.map(b=>`${b[0]?eng(b[0],'Hz'):'0'} – ${b[1]==null?'∞':eng(b[1],'Hz')}: ${fmt(b[2]*100,2)} %`).join(' · ')}${f.lfw>1?` · βάρος χαμηλών συχνοτήτων ${fmt(f.lfw,3)}`:''}.</p>`:'');}
// 4.13: cross-bonding. The standing voltage of a minor section (exact cable at 50 Hz, wideband.sheath_check) against
// what the run shows at the joints, the sheath currents, and the peaks of a switching run
function cableXbTheory(){const s=S.sim,m=(S.tutMeta||{}).xb;if(!s||!m)return '';const LM=window.LineModels||{},ref=LM['150kV-land-s|0.5|wb']?.sheath;
 const rms=k=>{const r=rawSeries(k);if(!r||!r.t.length)return null;const t1=r.t[r.t.length-1];let a=0,n=0;for(let i=0;i<r.t.length;i++)if(r.t[i]>t1-0.02+1e-12){a+=r.y[i]**2;n++;}return n?Math.sqrt(a/n):null;};
 const pk=k=>{const r=rawSeries(k);if(!r)return null;let x=0;for(const y of r.y)x=Math.max(x,Math.abs(y));return x;};
 const lab={xb:'cross-bonding (αναλυτικό)',solid:'solid bonding (αναλυτικό)',gnd:'ομογενές, μανδύες γειωμένοι',bond:'ομογενές, μανδύες ενωμένοι'};
 const rigs=Object.entries(m.rigs||{}),pin=(g,n,end)=>{const j=n+(end===2?g.M:0);return j>1?String(j):'';};
 let h='<ul class="eqs"><li>Αναλυτικό (Cable Constants §10.1): κάθε ελάσσον τμήμα ένα μοντέλο WB έξι αγωγών· στις ενώσεις 1, 2, 4, 5, 7, 8 ο μανδύας του καλωδίου a συνεχίζει στο b, του b στο c, του c στο a· στις 0, 3, 6, 9 οι μανδύες ενώνονται και γειώνονται μέσω R_s = '+eng(m.Rs,'Ω')+'.</li>'
  +'<li>Ομογενές (§2.4, §10.2): Z̄ = (Z + P·Z·Pᵀ + P²·Z·P²ᵀ)/3 και το ίδιο για το Y, P η εναλλαγή των μανδυών· οι μανδύες ένας αγωγός (ίδια τάση, άθροισμα ρευμάτων) ή γειωμένοι (απαλοιφή).</li>'
  +'<li>Τάση στάσης ελάσσονος τμήματος (μανδύας γειωμένος στην αρχή, ανοιχτός στο τέλος, συμμετρικό ρεύμα I στους αγωγούς): U = E·I·ℓ.</li></ul>';
 if(ref&&m.ev==='load'){const I=rms(rigs[0]?`I:${rigs[0][1].first}`:'')||0;
  h+=`<table class="cmp"><tr><th>μανδύας</th><th>E (ακριβές καλώδιο, 50 Hz)</th><th>E·I·0,5 km</th><th>I_s/I με solid bonding</th></tr>`+['a','b','c'].map((q,i)=>`<tr><td>${q}</td><td>${fmt(ref.E[i]*1e3,4)} V/(kA·km)</td><td>${I?eng(ref.E[i]*I*0.5,'V',3):'—'}</td><td>${fmt(ref.Is[i],3)}</td></tr>`).join('')+'</table>';}
 if(s.t<Math.min(m.dur||0,1e-4))return h+'<p class="muted small">Τρέξε την προσομοίωση για τις μετρήσεις.</p>';
 const rows=[];for(const [pre,g] of rigs){const ex=g.kind==='xb'||g.kind==='solid',first=g.first,second=first.replace(/S1$/,'S2');
  if(m.ev==='load'){const I=rms(`I:${first}`);rows.push([lab[g.kind],I,ex?rms(`V${pin(g,4,2)}:${first}`):null,ex?rms(`V${pin(g,4,2)}:${second}`):null,ex?Math.max(...[4,5,6].map(n=>rms(`I${pin(g,n,1)}:${first}`)||0)):g.kind==='bond'?rms(`I${pin(g,4,1)}:${first}`):null]);}
  else rows.push([lab[g.kind],pk(`V${pin(g,1,2)}:${g.last}`),ex?pk(`V${pin(g,4,2)}:${first}`):null,ex?pk(`V${pin(g,4,2)}:${second}`):null,ex?Math.max(...[4,5,6].map(n=>pk(`I${pin(g,n,1)}:${first}`)||0)):null]);}
 const v=(x,u)=>x==null?'—':eng(x,u,4);
 h+=m.ev==='load'?`<table class="cmp"><tr><th>μοντέλο</th><th>I αγωγού a (rms)</th><th>μανδύας a, ένωση 1</th><th>ένωση 2</th><th>ρεύμα μανδύα (μέγιστο rms)</th></tr>${rows.map(r=>`<tr><td>${r[0]}</td><td>${v(r[1],'A')}</td><td>${v(r[2],'V')}</td><td>${v(r[3],'V')}</td><td>${v(r[4],'A')}${r[1]&&r[4]?` (${fmt(100*r[4]/r[1],3)} %)`:''}</td></tr>`).join('')}</table>`
  :`<table class="cmp"><tr><th>μοντέλο</th><th>max |v_a2|</th><th>max |v μανδύα a|, ένωση 1</th><th>ένωση 2</th><th>max |i μανδύα|</th></tr>${rows.map(r=>`<tr><td>${r[0]}</td><td>${v(r[1],'V')}</td><td>${v(r[2],'V')}</td><td>${v(r[3],'V')}</td><td>${v(r[4],'A')}</td></tr>`).join('')}</table>`;
 return h+'<p class="muted small">Επαλήθευση (tests/test_wb.py): στο φορτίο το αναλυτικό ταυτίζεται με τη λύση φασιθετών των ίδιων ελασσόνων τμημάτων (ακριβές καλώδιο, ίδιες συνδέσεις)· στη βηματική με τον αριθμητικό μετασχηματισμό Laplace των ίδιων τμημάτων.</p>';}
// 4.4: line from geometry. The modes of each line (from its model) and what the run shows at the open end
function lineFdTheory(){const s=S.sim,m=S.tutMeta||{};if(!s)return '';const ids=['L1','L2'].filter(id=>s.net.compInfo.get(id)?.tlm);if(!ids.length)return '';
 const lab=id=>s.net.compInfo.get(id)?.label||id;
 let h='<ul class="eqs">'+(m.cable?'<li>Ρουτίνα σταθερών καλωδίων (pcl/lineconst.py, όπως το Cable Data του EMTP): βρόχοι αγωγός–επόμενος αγωγός με εσωτερική, αμοιβαία και εξωτερική σύνθετη αντίσταση των σωλήνων (Bessel), μόνωση jωL = jωμ/2π·ln(r₂/r₁), επιστροφή από τη θάλασσα (άπειρο μέσο) ή το έδαφος (Pollaczek). Y = jω·2πε₀ε(ω)/ln(r₂/r₁) με αιτιατό tanδ· θωρακίσεις με φάση 0 γειωμένες στα δύο άκρα.</li>'
  :'<li>Ρουτίνα σταθερών (pcl/lineconst.py, όπως το Line Data του EMTP): Z′(ω) με Carson για την επιστροφή από τη γη και Bessel για τον σωληνωτό αγωγό (T/D), P′ από τα είδωλα, αγωγοί προστασίας με απαλοιφή, δέσμες με ένωση· Y′ = G′ + jω·P′⁻¹.</li>')
  +'<li>Ρυθμοί: v_m = T_iᵀ·v, i = T_i·i_m, με T_i τα ιδιοδιανύσματα του Y′Z′ σε μία συχνότητα (πραγματικά, σταθερά). Κάθε ρυθμός είναι μονοφασική γραμμή: i_k = v_k/Z + I_h(t − τ).</li>'
  +'<li>CP: Z_c = √(L′/C′), τ = ℓ·√(L′C′), R = R′ℓ στα R/4 – R/2 – R/4. FD (J. Marti): Z_c(s) = k₀ + Σ k_i/(s + p_i) και A(s) = e^(−sτ)·Σ c_i/(s + q_i), αναδρομικές συνελίξεις.</li></ul>';
 for(const id of ids){const g=s.net.compInfo.get(id).tlm;if(g.type==='wb'){h+=wbModelHTML(lab(id),g);continue;}h+=`<p><b>${esc(lab(id))}</b> (${g.type==='fd'?'FD, T_i στα '+eng(g.fti,'Hz'):'CP στα '+eng(g.f,'Hz')}):</p><table class="cmp"><tr><th>ρυθμός</th><th>Z_c</th><th>τ</th><th>${g.type==='fd'?'πόλοι Z_c / A':'R (όλη η γραμμή)'}</th></tr>`
  +g.modes.map((q,k)=>`<tr><td>${k+1}${k===0&&!m.cable?' (γης)':''}</td><td>${eng(g.type==='fd'?q.zc.d:q.Zc,'Ω',4)}</td><td>${eng(q.tau,'s',5)}</td><td>${g.type==='fd'?q.zc.p.length+' / '+q.a.p.length:eng(q.R,'Ω',3)}</td></tr>`).join('')+'</table>';}
 if(s.t<Math.min(m.dur||0,1e-3))return h+'<p class="muted small">Τρέξε την προσομοίωση για τις μετρήσεις στο ανοιχτό άκρο.</p>';
 const pk=k=>{const r=rawSeries(k);if(!r)return null;let mx=0,tm=0,first=null;const y0=Math.max(...r.y.map(Math.abs));for(let i=0;i<r.y.length;i++){const a=Math.abs(r.y[i]);if(a>mx){mx=a;tm=r.t[i];}if(first===null&&a>0.05*y0)first=r.t[i];}return {mx,tm,first};};
 const rows=ids.map(id=>{const a=pk('V4:'+id),b=pk('V5:'+id);return `<tr><td>${esc(lab(id))}</td><td>${a?eng(a.first,'s',4):'—'}</td><td>${a?eng(a.mx,'V',4):'—'}</td><td>${b?eng(b.mx,'V',4):'—'}</td></tr>`;}).join('');
 return h+`<table class="cmp"><tr><th>γραμμή</th><th>άφιξη στο a2 (5 %)</th><th>max |v_a2|</th><th>max |v_b2|</th></tr>${rows}</table>`
  +(m.cable?'<p class="muted small">Επαλήθευση (tests/test_lines.py): οι βρόχοι του καλωδίου ταυτίζονται με υπολογισμό πεδίου σε λεπτούς ομόκεντρους φλοιούς (10⁻⁶), ο λύτης με το ίδιο μοντέλο λυμένο με αριθμητικό μετασχηματισμό Laplace, και το FD με το ακριβές καλώδιο σε λίγα τοις χιλίοις· το CP στα 50 Hz κρατά την ταχύτητα των 50 Hz (με την εσωτερική αυτεπαγωγή του αγωγού) και το μέτωπο φτάνει αργότερα.</p>'
   :'<p class="muted small">Επαλήθευση (tests/test_lines.py): ο λύτης ταυτίζεται με το ίδιο μοντέλο λυμένο στο πεδίο της συχνότητας με αριθμητικό μετασχηματισμό Laplace, και το FD με την ακριβή γραμμή (χωρίς προσαρμογή) σε λίγα τοις χιλίοις του μεγίστου· το CP στα 50 Hz απέχει πολύ στις επαγόμενες τάσεις, γιατί κρατά την απόσβεση του ρυθμού γης στα 50 Hz.</p>');}
// 4.9: TRV cards. The first current zero of a pole after t₀ where the current stays (|i| < 1 A for 50 μs), by linear
// interpolation, and the voltage across the pole from there (t from the zero)
function trvAfterZero(ik,vk,t0,win=1e-3){const I=rawSeries(ik),V=rawSeries(vk);if(!I||!V)return null;
 for(let j=1;j<I.t.length;j++){if(I.t[j]<=t0||I.y[j-1]*I.y[j]>0)continue;const a=I.y[j-1],b=I.y[j],tz=I.t[j-1]+(I.t[j]-I.t[j-1])*(a!==b?a/(a-b):0);
  let hold=true,end=null;for(let q=j+1;q<I.t.length&&I.t[q]<tz+50e-6;q++)if(Math.abs(I.y[q])>1){hold=false;break;}if(!hold)continue;
  const t=[],u=[];for(let q=0;q<V.t.length;q++)if(V.t[q]>=tz&&V.t[q]<=tz+win){t.push(V.t[q]-tz);u.push(V.y[q]);}
  if(V.t[V.t.length-1]>=tz+win)end=true;return {tz,t,u,complete:!!end};}
 return null;}
function trvSvg(t,u,spec,o={}){const W=520,H=230,L=52,R=12,T=12,B=34,tmax=o.tmax||t[t.length-1]||1e-3;let big=0;for(const x of u)if(Math.abs(x)>Math.abs(big))big=x;const sg=big>=0?1:-1;
 const umax=Math.max(spec?spec.uc*1.15:0,...u.map(x=>sg*x),1),X=x=>L+(W-L-R)*x/tmax,Y=y=>H-B-(H-T-B)*y/umax;
 const path=(pts)=>pts.map((p,i)=>(i?'L':'M')+X(p[0]).toFixed(1)+','+Y(p[1]).toFixed(1)).join(' ');
 const step=Math.max(1,Math.floor(t.length/700)),cur=[];for(let i=0;i<t.length;i+=step)cur.push([t[i],sg*u[i]]);
 let g=`<svg viewBox="0 0 ${W} ${H}" class="trvplot" style="width:100%;max-width:560px"><rect x="${L}" y="${T}" width="${W-L-R}" height="${H-T-B}" fill="none" stroke="currentColor" stroke-opacity=".25"/>`;
 for(let k=0;k<=4;k++){const x=tmax*k/4,y=umax*k/4;g+=`<text x="${X(x)}" y="${H-B+14}" font-size="10" text-anchor="middle">${fmt(x*1e6,3)}</text><text x="${L-4}" y="${Y(y)+3}" font-size="10" text-anchor="end">${fmt(y/1e3,3)}</text>`;}
 g+=`<text x="${(L+W-R)/2}" y="${H-4}" font-size="10" text-anchor="middle">t από το μηδέν του ρεύματος (μs)</text><text x="12" y="${(T+H-B)/2}" font-size="10" transform="rotate(-90 12 ${(T+H-B)/2})" text-anchor="middle">kV</text>`;
 if(spec){const ref=TRV.referenceLine(spec,tmax),dl=TRV.delayLine(spec);g+=`<path d="${path(ref)}" fill="none" stroke="#c0392b" stroke-width="1.6"/><path d="${path(dl)}" fill="none" stroke="#c0392b" stroke-dasharray="4 3"/>`;}
 g+=`<path d="${path(cur)}" fill="none" stroke="#1f6fb2" stroke-width="1.4"/></svg>`;return g;}
function trvTerminalTheory(){const s=S.sim,m=(S.tutMeta||{}).trv;if(!s||!m||!window.TRV)return '';
 const spec=TRV.rated(m.Ur,m.duty,m.kpp,'S1',50),E=Math.sqrt(2/3)*m.Ur;
 const par=spec.params==='4p'?`u₁ = 0,75·k_pp·√(2/3)·U_r = <b>${eng(spec.u1,'V')}</b>, t₁ = u₁/(${fmt(spec.rrrv*1e-9,3)} kV/μs) = <b>${eng(spec.t1,'s')}</b>, u_c = k_pp·k_af·√(2/3)·U_r = <b>${eng(spec.uc,'V')}</b> (k_af = ${fmt(spec.kaf,3)}), t₂ = <b>${eng(spec.t2,'s')}</b>`:
  `u_c = k_pp·k_af·√(2/3)·U_r = <b>${eng(spec.uc,'V')}</b> (k_af = ${fmt(spec.kaf,3)}), t₃ = <b>${eng(spec.t3,'s')}</b>, RRRV = u_c/t₃ = <b>${fmt(spec.rrrv*1e-9,3)} kV/μs</b>`;
 let h=`<ul class="eqs"><li>Ονομαστική TRV (IEC 62271-100:2021, §7.105.5) για U_r = 145 kV, ${m.duty}, k_pp = ${fmt(spec.kpp,2)}: ${par}</li>
  <li>Γραμμή καθυστέρησης: t_d = <b>${eng(spec.td,'s')}</b>, ως u′ = ${eng(spec.ud,'V')} στο t′ = ${eng(spec.tdp,'s')}. Η TRV του δικτύου πρέπει να μένει κάτω από τη γραμμή αναφοράς (IEEE C37.011 §4).</li>
  <li>Πρώτος πόλος: τάση ισχύος επαναφοράς ≈ k_pp·√(2/3)·U_r = ${eng(spec.kpp*E,'V')}· αρχικός ρυθμός ≈ k_pp·√2·ω·I·Z_eq, με Z_eq τις ${m.n} γραμμές (${eng(400/m.n,'Ω')}) παράλληλα με τη χωρητικότητα του ζυγού.</li></ul>`;
 let best=null;for(const x of ['a','b','c']){const r=trvAfterZero('Y:CB1/I'+x,'Y:CB1/V'+x,m.topen,0.6e-3);if(r&&(!best||r.tz<best.tz))best={...r,x};}
 if(!best||!best.complete)return h+'<p class="muted small">Τρέξε ως ~1 ms μετά το άνοιγμα (60 ms) για τη σύγκριση: ο πρώτος πόλος σβήνει στο πρώτο μηδέν του ρεύματός του.</p>';
 const c=TRV.compare(best.t,best.u,spec);
 h+=`<p>Πρώτος πόλος: <b>${best.x}</b>, μηδέν ρεύματος στα ${eng(best.tz,'s',5)}. ${c.ok?'<span class="good">Η TRV μένει κάτω από τη γραμμή αναφοράς</span>':'<span class="warn-text">Η TRV ξεπερνά τη γραμμή αναφοράς</span>'} (μέγιστος λόγος u/u_ref = ${fmt(c.ratio,3)}${c.t_first!=null?', πρώτη υπέρβαση στα '+eng(c.t_first,'s'):''}).</p>`+trvSvg(best.t,best.u,spec,{tmax:0.6e-3});
 h+=cmpRows([['RRRV (εφαπτομένη από την αρχή)',spec.rrrv,c.rrrv,'V/s'],['κορυφή στο παράθυρο 0,6 ms',spec.uc,c.uc,'V']]);
 return h+`<p class="muted small">Μπλε: η τάση του πόλου από το μηδέν του ρεύματος (απόλυτη τιμή). Κόκκινο: η γραμμή αναφοράς και η γραμμή καθυστέρησης της ονομαστικής TRV. Στη «Διαφορά» ο λόγος προσομοίωση/ονομαστική − 1: αρνητικός σημαίνει περιθώριο.</p>`;}
function trvSlfTheory(){const s=S.sim,m=(S.tutMeta||{}).slf;if(!s||!m||!window.TRV)return '';
 const a=TRV.slf(m.Ur,m.Isc,m.ratio,m.f),tau=m.LL/m.Z;
 let h=`<ul class="eqs"><li>Παράρτημα A: I_L = ${fmt(m.ratio*100,3)} % του I_sc = <b>${eng(a.IL,'A')}</b>, u₀ = √2·U_G·(1 − I_L/I_sc) = <b>${eng(a.u0,'V')}</b> (η τάση της γραμμής τη στιγμή της διακοπής), u_L* = k·u₀ = <b>${eng(a.uL,'V')}</b> με k = 1,6</li>
  <li>Ρυθμός της πλευράς της γραμμής s·I_L = √2·ω·Z·I_L = <b>${fmt(a.rate_line*1e-9,3)} kV/μs</b>, t_L = k·L_L/Z = <b>${eng(a.tL,'s')}</b> (μήκος ≈ ${eng(a.L,'m')}); πλευρά της πηγής RRRV·I_L/I_sc = ${fmt(a.rrrv_slf*1e-9,3)} kV/μs· TRV στην πρώτη κορυφή u_T = u_L* + u_s* = <b>${eng(a.uT,'V')}</b></li>
  <li>Πλευρά της πηγής (κύκλωμα τροφοδοσίας της δοκιμής): R_s = RRRV/(√2·ω·I_sc) = <b>${eng(m.Rs,'Ω')}</b> για ${fmt(a.supply.rrrv*1e-9,3)} kV/μs, C_d = t_d/R_s = <b>${eng(m.Cd,'F')}</b> για t_d = ${eng(a.supply.td,'s')}</li>
  <li>Στη γραμμή χωρίς απώλειες της προσομοίωσης η πριονωτή πάει ως 2·u₀ σε 2τ = ${eng(2*tau,'s')} (k = 2)· οι πραγματικές γραμμές αποσβένουν (k = 1,6).</li></ul>`;
 const I=rawSeries('Y:CB1/I'),V=rawSeries('Y:CB1/V');if(!I||!V)return h;
 let j0=-1;for(let j=1;j<I.t.length;j++)if(I.t[j]>m.tsep&&I.y[j-1]*I.y[j]<=0){j0=j;break;}
 if(j0<0)return h+'<p class="muted small">Τρέξε ως τα 15,6 ms: το τόξο ξεκινά στα 14,7 ms και το πρώτο μηδέν έρχεται λίγο μετά.</p>';
 const ia=I.y[j0-1],ib=I.y[j0],tz=I.t[j0-1]+(I.t[j0]-I.t[j0-1])*ia/(ia-ib);
 let post=0,last=0,ext=0;for(let q=0;q<I.t.length;q++){const dt=I.t[q]-tz;if(dt>5e-6&&dt<100e-6)post=Math.max(post,Math.abs(I.y[q]));if(dt>-30e-6&&dt<0)ext=Math.max(ext,Math.abs(V.y[q]));last=I.y[q];}
 const tend=I.t[I.t.length-1],ok=tend>tz+100e-6&&Math.abs(last)<1;
 const t=[],u=[];for(let q=0;q<V.t.length;q++)if(V.t[q]>=tz&&V.t[q]<=tz+Math.min(4*tau,60e-6)){t.push(V.t[q]-tz);u.push(V.y[q]);}
 let pk=0,tp=0;const lim=2*tau*1.3;for(let q=0;q<t.length;q++)if(t[q]<=lim&&Math.abs(u[q])>pk){pk=Math.abs(u[q]);tp=t[q];}
 let rate=NaN;{const f=(x)=>{for(let q=0;q<t.length;q++)if(Math.abs(u[q])>=x*pk)return t[q];return NaN;};const t2=f(.2),t8=f(.8);if(t8>t2)rate=0.6*pk/(t8-t2);}
 h+=`<p>${tend<tz+100e-6?'<span class="muted">Τρέξε λίγο ακόμη μετά το μηδέν.</span>':ok?'<span class="good">Διακοπή στο πρώτο μηδέν</span> (στα '+eng(tz,'s',5)+'): το ρεύμα μετά το τόξο φτάνει τα '+eng(post,'A')+'.':'<span class="warn-text">Θερμική επανέναυση</span>: μετά το μηδέν των '+eng(tz,'s',5)+' το τόξο ξαναζεσταίνεται και το ρεύμα συνεχίζει ως το επόμενο μηδέν.'} Κορυφή σβέσης πριν από το μηδέν: ${eng(ext,'V')}.</p>`;
 if(ok&&t.length>3){h+=trvSvg(t,u,null,{tmax:t[t.length-1]});h+=cmpRows([['ρυθμός ανόδου (20–80 % της πρώτης κορυφής)',a.rate_line+a.rrrv_slf,rate,'V/s'],['πρώτη κορυφή (γραμμή με k = 2 + πηγή)',2*a.u0+a.rrrv_slf*Math.max(2*tau-a.supply.td,0),pk,'V'],['χρόνος της πρώτης κορυφής 2τ',2*tau,tp,'s']]);}
 return h;}
// 4.9: the lightning tutorial (lightning_gis): footing R(I), tower, arrester, the flashovers and the peaks in the substation
// against the lightning impulse withstand voltage (with the safety factor K_s), and the protective-distance rule
function lightningTheory(){const s=S.sim,m=(S.tutMeta||{}).lg;if(!s||!m)return '';
 const Ig=m.E0*m.rho/(2*Math.PI*m.R0*m.R0),k=window.NetLib?NetLib.saiParams({d:3.216,n:1,kL1:1}):null,Ri=I=>m.R0/Math.sqrt(1+I/Ig);
 const pk=key=>{const r=rawSeries(key);if(!r)return null;let v=0,t=0;for(let j=0;j<r.y.length;j++)if(Math.abs(r.y[j])>v){v=Math.abs(r.y[j]);t=r.t[j];}return {v,t,r};};
 const If=pk('Y:T2/If'),lim=m.LIWL/m.Ks;
 let h=`<ul class="eqs"><li>Γείωση ${m.foot==='ion'?`με ιονισμό: R(I) = R₀/√(1 + I/I_g), I_g = E₀·ρ/(2π·R₀²) = <b>${eng(Ig,'A')}</b> (R₀ = ${eng(m.R0,'Ω')}, ρ = ${fmt(m.rho,3)} Ω·m, E₀ = 400 kV/m)${If&&If.v>1?`· στο ρεύμα κορυφής της βάσης του T2 (${eng(If.v,'A')}) R = <b>${eng(Ri(If.v),'Ω')}</b>`:''}`:`σταθερή R₀ = ${eng(m.R0,'Ω')}`}</li>
  <li>${m.tm==='ms'?`Πύργος πολλών ορόφων (4.22): τέσσερα τμήματα, Z_t1 = 220 Ω, Z_t2 = 150 Ω, γ = 0,8, R_i = 2·Z_ti·ln(1/γ)·h_i/H, L_i = 2·(H/c)·R_i, οι φάσεις στον βραχίονα των 20 m`:`Πύργος: γραμμή χωρίς απώλειες Z_t = ${eng(m.Zt,'Ω')}, τ = h/c = ${eng(m.h/3e8,'s')}`}· αλυσίδες μονωτήρων: ${m.ins==='lpm'?'πρόοδος οχετού (LPM, 4.22): streamers ως 1/t_s = 1,25·E/E₅₀ − 0,95, μετά dL/dt = K·|u|·(|u|/(g − L) − E₀), g = 3,2 m, E₅₀ = 560 kV/m':m.ins==='de'?'καμπύλη τάσης–χρόνου ∫(|u| − U₀)dt = D, U₀ = 1,7 MV, D = 0,5 V·s':`διάσπαση στα <b>${eng(m.Ub,'V')}</b> (≈ 700 kV/m × 3,2 m)`}</li>
  ${k?`<li>Αλεξικέραυνο IEEE (U₁₀ = ${eng(m.U10,'V')}, d = 3,216 m): L₀ = ${eng(k.L0,'H')}, R₀ = ${eng(k.R0,'Ω')}, L₁ = ${eng(k.L1,'H')}, R₁ = ${eng(k.R1,'Ω')}, C = ${eng(k.C,'F')}</li>`:''}
  <li>Αντοχή του εξοπλισμού 420 kV σε κεραυνό (LIWL) ${eng(m.LIWL,'V')}· με συντελεστή ασφαλείας K_s = ${fmt(m.Ks,3)}: <b>${eng(lim,'V')}</b> (IEC 60071-2)</li></ul>`;
 if(s.t<m.stop-1e-9)return h+'<p class="muted small">Τρέξε ως τα 50 μs για τις κορυφές και τις διασπάσεις.</p>';
 const fl=[];for(const tw of ['T1','T2','T3'])for(const x of ['a','b','c']){const r=rawSeries(`Y:${tw}/I${x}`);if(!r)continue;const j=r.y.findIndex(v=>Math.abs(v)>1);if(j>=0)fl.push(`${tw} φάση ${x} στα ${eng(r.t[j],'s',3)}`);}
 const top=pk('Y:T2/Vtop');
 h+=`<p>${fl.length?'<span class="warn-text">Διάσπαση μονωτήρων</span>: '+fl.join(', '):'<span class="good">Καμία διάσπαση μονωτήρων</span>'}. Κορυφή της τάσης του T2: ${top?eng(top.v,'V'):'—'}.</p>`;
 const rows=[];for(const [pre,lab] of [['VE','Είσοδος (CVT, αλεξικέραυνο)'],['VG','GIS, στον διακόπτη'],['VT','Μετασχηματιστής']])for(const x of ['a','b','c']){const q=pk('Y:'+pre+x);if(q)rows.push([lab+' '+x,q.v,q.t]);}
 h+=`<table class="cmp"><thead><tr><th>Θέση</th><th>Κορυφή</th><th>Στιγμή</th><th>Περιθώριο ως ${eng(lim,'V')}</th></tr></thead><tbody>${rows.map(([n,v,t])=>`<tr><td>${esc(n)}</td><td>${eng(v,'V')}</td><td>${eng(t,'s',3)}</td><td class="${v>lim?'warn-text':'good'}">${v>0?fmt((lim/v-1)*100,3)+' %':'—'}${v>m.LIWL?' (πάνω από το LIWL)':v>lim?' (πάνω από LIWL/K_s)':''}</td></tr>`).join('')}</tbody></table>`;
 if(m.sa!=='none'){const r=rawSeries('Y:VEa'),e=pk('Y:VEa'),g=pk('Y:VGa');if(r&&e&&g&&e.v>50e3){let S1=0;for(let j=1;j<r.y.length;j++){if(r.t[j]>e.t)break;const d=Math.abs(r.y[j]-r.y[j-1])/((r.t[j]-r.t[j-1])||1);if(d>S1)S1=d;}
  h+=cmpRows([['φάση a: U_G ≈ U_E + 2·S·d/v (d = 56 m, S = μέγιστη du/dt στην είσοδο)',e.v+2*S1*m.dist/m.v,g.v,'V']])+'<p class="muted small">Ο κανόνας της απόστασης προστασίας υποθέτει μέτωπο ράμπας και ανοιχτό άκρο πίσω από το αλεξικέραυνο· είναι εκτίμηση, όχι ακριβής τύπος.</p>';}}
 // 4.22: the largest peak in the substation as the representative fast-front overvoltage (IEC 60071-2, 420 kV)
 const pkSub=rows.reduce((a,r)=>Math.max(a,r[1]),0);if(pkSub>0)h+=inscoHTML({Us:420,Um:420,H:0,tov:{k:1.4,lr:1.1},slow:{Ue2:2.5,Up2:3.8,Ups:800},peaks:{fast:+(pkSub/1e3).toFixed(1)},insulations:['external','gis']},'ταχέος μετώπου: η μεγαλύτερη κορυφή στον υποσταθμό');
 // 4.12: with the 50 Hz voltage the lines start from the steady state; the voltage of each insulator adds the phase voltage
 if(m.u50){const ph={peak:'στο θετικό μέγιστο',zero:'στο μηδέν',neg:'στο αρνητικό μέγιστο'}[m.u50];
  return h+`<p class="muted small">Τάση λειτουργίας 420 kV, 50 Hz (κορυφή φάσης ${eng(m.Vs,'V')}), η φάση a ${ph} τη στιγμή του κεραυνού· οι γραμμές ξεκινούν από τη μόνιμη κατάσταση (4.12). Η τάση κάθε μονωτήρα είναι u_φάσης − u_πύργου: με αρνητικό κεραυνό στον πύργο, η φάση στο θετικό μέγιστο διασπάται πιο εύκολα.</p>`;}
 return h+'<p class="muted small">Χωρίς τάση 50 Hz των φάσεων (μόνο ο κεραυνός)· η επιλογή «Τάση λειτουργίας» τη βάζει, με τις γραμμές από τη μόνιμη κατάσταση (4.12).</p>';}
// 4.22: the GIS of IEC TR 60071-4 (gis765_lv, gis_vfto) and the restrikes of a disconnector (ds_restrike)
function gisPeaks(keys){const out=[];for(const [k,lab] of keys){const r=rawSeries(k);if(!r)continue;let v=0,t=0;for(let j=0;j<r.y.length;j++)if(Math.abs(r.y[j])>Math.abs(v)){v=r.y[j];t=r.t[j];}out.push({k,lab,v,t,r});}return out;}
function atT(r,T){if(!r)return NaN;let j=0;while(j<r.t.length-1&&r.t[j+1]<=T)j++;return r.y[j];}
// the travel time along the fastest path between two nodes of the drawing (Dijkstra over the lines of the tutorial)
function gisPath(from,to){const pr=editor?.doc;if(!pr)return null;const adj=new Map(),add=(a,b,w)=>{if(!adj.has(a))adj.set(a,[]);adj.get(a).push([b,w]);};
 for(const c of pr.components)if(c.type==='TL'){const lab=String(c.label||'').split('–');if(lab.length!==2)continue;const tau=P.tlParams(c.params).tau;add(lab[0],lab[1],tau);add(lab[1],lab[0],tau);}
 const d=new Map([[from,0]]),q=[from],seen=new Set();while(q.length){q.sort((a,b)=>d.get(a)-d.get(b));const u=q.shift();if(seen.has(u))continue;seen.add(u);for(const [v,w] of adj.get(u)||[]){const nd=d.get(u)+w;if(!(d.get(v)<=nd)){d.set(v,nd);q.push(v);}}}
 return d.has(to)?d.get(to):null;}
function gis765Theory(){const s=S.sim,m=(S.tutMeta||{}).gis;if(!s||!m)return '';
 const tUK=gisPath('UC1','UK'),Vi=m.E*m.Rs/(m.Rs+m.Rs),G=(75/2-75)/(75/2+75);
 let h=`<ul class="eqs"><li>Κάθε κομμάτι του GIS: γραμμή χωρίς απώλειες με Z και τ του Πίνακα 29 του IEC TR 60071-4 (περίπτωση 4)· πηγή ${m.src==='switch'?'ράμπα ως το μέγιστο και μετά διακόπτης':'ράμπα 4 ns'}, E = ${eng(m.E,'V')} πίσω από ${eng(m.Rs,'Ω')}</li>
  <li>Κύμα που μπαίνει στον ζυγό 75 Ω: E·Z/(R_s + Z) = <b>${eng(Vi,'V')}</b>· στο J3 τρεις ζυγοί 75 Ω: συντελεστής ανάκλασης Γ = (37,5 − 75)/(37,5 + 75) = ${fmt(G,3)}, άρα στο UC1 μετά από 2·6,4 ns: ${eng(Vi*(1+G),'V')}</li>
  ${tUK!=null?`<li>Το πιο γρήγορο μονοπάτι UC1 → UK (άθροισμα των τ): <b>${eng(tUK,'s',4)}</b></li>`:''}
  <li>Μόνιμη κατάσταση: E·75/(75 + 75) = ${eng(m.E/2,'V')} παντού (οι γραμμές χωρίς απώλειες, το UK σε 75 Ω)</li></ul>`;
 if(s.t<m.stop-1e-12)return h+'<p class="muted small">Τρέξε ως τα 0,5 μs για τη σύγκριση.</p>';
 const uc=rawSeries('Y:VUC'),uk=rawSeries('Y:VUK');if(!uc||!uk)return h;
 const j=uk.y.findIndex(v=>Math.abs(v)>.01*m.E),tA=j>=0?uk.t[j]:NaN;
 h+=cmpRows([['u_UC1 στα 10 ns',Vi,atT(uc,10e-9),'V'],['u_UC1 στα 16,8 ns (μετά την ανάκλαση από το J3)',Vi*(1+G),atT(uc,16.6e-9),'V'],...(tUK!=null?[['άφιξη στο UK (1 % του E)',tUK+(m.src==='switch'?4e-9:2e-9),tA,'s']]:[]),['u_UK στα 0,5 μs (προς τη μόνιμη κατάσταση)',m.E/2,atT(uk,m.stop),'V']]);
 return h+'<p class="muted small">Ως τα 0,15 μs οι κυματομορφές συμφωνούν με τα Σχήματα 41 και 42 του TR (άφιξη στο UK στα 0,056 μs, πρώτο σκαλί περίπου 22 V, περίπου 80 V στα 0,13 μs). Αργότερα το σχήμα μένει περίπου 10 % χαμηλότερα: οι απώλειες ή οι χωρητικότητες που δεν δίνει ο πίνακας. Η ανεξάρτητη λύση με οδεύοντα κύματα (pcl.surge, μέθοδος των χαρακτηριστικών) δίνει τις ίδιες κορυφές με τον λύτη (tests/test_gis.py).</p>';}
function gisVftoTheory(){const s=S.sim,m=(S.tutMeta||{}).gis;if(!s||!m)return '';const pu=m.Vs,dU=m.Vs-m.tc,lim=m.LIWL/m.Ks;
 let h=`<ul class="eqs"><li>Βάση: 1 pu = √2·U_s/√3 = <b>${eng(pu,'V')}</b> (U_s = ${eng(m.Us,'V')})· πλευρά του διαπεραστή +1 pu, ζυγός ${fmt(m.tc/pu,3)} pu· τάση στις επαφές πριν από τη διάσπαση ΔU = <b>${fmt(dU/pu,3)} pu</b></li>
  <li>Στη διάσπαση ξεκινούν κύματα ΔU·Z/(Z + Z) = ΔU/2 προς κάθε πλευρά (ζυγοί 75 Ω)· στα ανοιχτά άκρα διπλασιάζονται, οπότε η πρώτη κορυφή φτάνει ${fmt(m.tc/pu,3)} + ΔU = ${fmt((m.tc+dU)/pu,3)} pu και οι επόμενες ανακλάσεις την ανεβάζουν (IEC 60071-2: τυπικά 1,5–2,5 pu, ως 3 pu)</li>
  <li>Αντοχή: LIWL ${eng(m.LIWL,'V')} για U_m = 800 kV, με K_s = ${fmt(m.Ks,3)}: <b>${eng(lim,'V')}</b> (εσωτερική μόνωση· το πρότυπο συγκρίνει τις VFFO με την αντοχή σε κεραυνό για U_m ≤ 800 kV)</li></ul>`;
 if(s.t<m.stop-1e-12)return h+'<p class="muted small">Τρέξε ως τα 2 μs για τις κορυφές.</p>';
 const P=gisPeaks([['Y:VUK','UK'],['Y:VT18','T18 (ανοιχτό άκρο)'],['Y:VT29','T29 (ανοιχτό άκρο)'],['Y:VJ7','J7'],['Y:VDSL','στον αποζεύκτη (πλευρά ζυγού)']]);
 h+=`<table class="cmp"><thead><tr><th>Θέση</th><th>Κορυφή</th><th>pu</th><th>Στιγμή</th><th>Περιθώριο ως ${eng(lim,'V')}</th></tr></thead><tbody>${P.map(q=>`<tr><td>${esc(q.lab)}</td><td>${eng(Math.abs(q.v),'V')}</td><td>${fmt(q.v/pu,3)}</td><td>${eng(q.t,'s',3)}</td><td class="${Math.abs(q.v)>lim?'warn-text':'good'}">${fmt((lim/Math.abs(q.v)-1)*100,3)} %</td></tr>`).join('')}</tbody></table>`;
 const mx=P.reduce((a,q)=>Math.abs(q.v)>Math.abs(a.v)?q:a,{v:0});
 return h+`<p>Η μεγαλύτερη VFFO: <b>${fmt(Math.abs(mx.v)/pu,3)} pu</b> στο ${esc(mx.lab||'—')}. Παρακάτω ο συντονισμός μόνωσης την παίρνει ως αντιπροσωπευτική υπέρταση πολύ ταχέος μετώπου.</p>`+inscoHTML({Us:800,Um:800,H:0,tov:{k:1.4,lr:1.1},slow:{Ue2:2.0,Up2:3.0,Ups:1300},peaks:{vffo:+(Math.abs(mx.v)/1e3).toFixed(1)},insulations:['gis']},'VFFO από αυτήν την προσομοίωση');}
function dsRestrikeTheory(){const s=S.sim,m=(S.tutMeta||{}).gis;if(!s||!m)return '';const pu=m.Vp;
 let h=`<ul class="eqs"><li>Τάση διάσπασης των επαφών: ${m.op==='open'?'U_b(t) = U_m·(t − t₀)/T_s μετά το t₀ (οι επαφές ανοίγουν)':'U_b(t) = U_m·(1 − (t − t₀)/T_s) (οι επαφές πλησιάζουν, ακουμπούν στο t₀ + T_s)'}, U_m = ${fmt(m.Um/pu,3)} pu, T_s = ${eng(m.Ts,'s')}</li>
  <li>Διάσπαση όταν |u_s − u_ζυγού| ≥ U_b(t)· ο σπινθήρας σβήνει όταν το ρεύμα του πέσει κάτω από I_ext, και ο ζυγός μένει στην τάση της πηγής εκείνης της στιγμής</li></ul>`;
 if(s.t<m.stop-1e-9)return h+'<p class="muted small">Τρέξε ως το τέλος για τον κατάλογο των διασπάσεων.</p>';
 const ev=(s.events?.().list||[]).filter(e=>e.kind==='gap'&&e.v===1),r=rawSeries('V:DS1'),u=rawSeries('Y:VLB');
 const rows=ev.map(e=>{let k=0;if(r)while(k<r.t.length-1&&r.t[k+1]<e.t)k++;return {t:e.t,dU:r?Math.abs(r.y[k]):NaN};});
 const mx=rows.reduce((a,q)=>q.dU>a.dU?q:a,{dU:0,t:NaN}),end=u?u.y[u.y.length-1]:NaN;
 h+=`<p>Διασπάσεις: <b>${rows.length}</b>· η μεγαλύτερη τάση στις επαφές τη στιγμή μιας διάσπασης: <b>${fmt(mx.dU/pu,3)} pu</b> (${eng(mx.dU,'V')}) στα ${eng(mx.t,'s',4)}.${m.op==='open'?` Παγιδευμένο φορτίο στον ζυγό στο τέλος: <b>${fmt(end/pu,3)} pu</b>.`:''}</p>`;
 if(rows.length)h+=`<table class="cmp"><thead><tr><th>#</th><th>Στιγμή</th><th>ΔU (pu)</th><th>U_b(t) (pu)</th></tr></thead><tbody>${rows.slice(0,40).map((q,i)=>{const f=Math.min(1,Math.max(0,(q.t-m.t0)/m.Ts)),ub=m.op==='open'?m.Um*f:m.Um*(1-f);return `<tr><td>${i+1}</td><td>${eng(q.t,'s',5)}</td><td>${fmt(q.dU/pu,3)}</td><td>${fmt(ub/pu,3)}</td></tr>`;}).join('')}</tbody></table>`;
 return h+'<p class="muted small">Η μεγαλύτερη ΔU είναι αυτή που ξεκινά τα πολύ γρήγορα μεταβατικά στον ζυγό (tutorial gis_vfto: ΔU = 2 pu με παγιδευμένο φορτίο −1 pu).</p>';}
// 4.22 (ROADMAP §51): the insulation co-ordination of a station on the engine (pcl.insulation through the local server, study
// 'insulation'): the options of the tutorial and, where the tutorial has a simulation, its peaks as the representative
// fast-front or very-fast-front overvoltage; the table of the levels and the report as one HTML file
const INSCO={key:null,busy:null,r:null,error:null,last:null};
let inscoOpts=null;
function inscoHTML(o,lead){inscoOpts=o;const key=JSON.stringify(o),st=INSCO.key===key?INSCO:{},q=st.r,f=(x,d=4)=>x===null||x===undefined?'—':fmt(x,d),INS={external:'εξωτερική',gis:'GIS (SF6)',liquid:'σε υγρό',solid:'στερεή'};
 let h=`<div class="tm" id="insco"><span class="badge">Συντονισμός μόνωσης (IEC 60071-2)</span> U_s = <b>${f(o.Us)} kV</b>, U_m = ${f(o.Um||o.Us)} kV${o.H?`, υψόμετρο ${f(o.H)} m`:''}${lead?' · '+lead:''}
  <p><button data-insco="run" ${INSCO.busy?'disabled':''}>▶ Συντονισμός μόνωσης</button> <button data-insco="report" ${INSCO.busy?'disabled':''} title="Ένα αρχείο HTML με τα βήματα του IEC 60071-2, τους πίνακες και τα δεδομένα">⬇ Αναφορά συντονισμού</button>
  <span class="muted small">${INSCO.busy?'Τρέχει στο engine…':''}</span></p>`;
 if(st.error)h+=`<p class="bad" id="insco-error">${esc(st.error)}</p>`;
 if(q){h+=`<table class="cmp" id="insco-table"><thead><tr><th>Μόνωση</th><th>Απαιτούμενες (kV)</th><th>Τυποποιημένο επίπεδο</th><th>Περιθώρια</th></tr></thead><tbody>${Object.entries(q.insulation).map(([k,x])=>{
   const nd=Object.entries(x.need).filter(([,v])=>v).map(([n,v])=>`${{sd:'SDWV',si:'SIWV',li:'LIWV'}[n]||n} ${f(v,4)}`).join(', '),lv=Object.entries(x.level).map(([n,v])=>`${{sd:'SDWV',si:'SIWV',sipp:'SIWV φ–φ',silong:'SIWV διαμ.',li:'LIWV'}[n]||n} ${f(v,5)}`).join(', ');
   const mg=Object.entries(x.margin||{}).filter(([,v])=>v!==null).map(([n,v])=>`${{sd:'SDWV',si:'SIWV',li:'LIWV'}[n]||n} ${f(100*v,3)} %`).join(', ');
   return `<tr><td>${esc(INS[k]||k)}</td><td>${nd}</td><td class="${x.covered?'good':'warn-text'}">${lv}${x.covered?'':' (δεν καλύπτεται)'}</td><td>${mg}</td></tr>`;}).join('')}</tbody></table>`;
  if(q.k)h+=`<p class="small">Συντελεστής σφάλματος προς γη από το δίκτυο: k = <b>${f(q.k,4)}</b>.</p>`;}
 return h+'</div>';}
async function inscoAct(what){const o=inscoOpts;if(!o||INSCO.busy)return;const key=JSON.stringify(o);if(INSCO.key!==key){INSCO.r=null;INSCO.last=null;}INSCO.key=key;INSCO.busy=what;INSCO.error=null;renderTheory();
 try{const q={study:'insulation',options:o};if(what==='report'){const r=await api('network_report',q);INSCO.r=r.summary;INSCO.last=r.name;download(r.name,r.html,'text/html');}else{const r=await api('network_study',q);INSCO.r=r.summary;}}
 catch(e){INSCO.r=null;INSCO.error=/fetch|NetworkError|Load failed/i.test(e.message)?'Ο συντονισμός τρέχει στο engine: ξεκίνα τον τοπικό server (python run.py) και δοκίμασε ξανά.':e.message;}
 INSCO.busy=null;renderTheory();}
// the tutorial of the procedure itself (insco_study): the worked example of a 245 kV station, or a 420 / 800 kV station
function inscoTheory(){const m=(S.tutMeta||{}).insco;if(!m)return '';
 let o=m.options;if(m.emt){const r=rawSeries('Y:VT');if(!r||!S.sim||S.sim.t<m.stop-1e-9)return '<p class="muted small">Τρέξε ως τα 20 μs: η κορυφή στον μετασχηματιστή γίνεται η υπέρταση ταχέος μετώπου του συντονισμού.</p>';
  const pk=r.y.reduce((a,v)=>Math.max(a,Math.abs(v)),0);o={...o,peaks:{...(o.peaks||{}),fast:+(pk/1e3).toFixed(1)}};}
 return `<ul class="eqs"><li>Βήμα 1: αντιπροσωπευτικές υπερτάσεις: προσωρινές από τον συντελεστή σφάλματος k και την απόρριψη φορτίου, βραδέος μετώπου από τις τιμές 2 % U_e2, U_p2 με αποκοπή 1,25·U_e2 − 0,25 και 1,25·U_p2 − 0,43 και τα αλεξικέραυνα (U_ps), ταχέος μετώπου από την απλοποιημένη στατιστική μέθοδο U_cw = U_pl + (A/n)·L/(L_sp + L_a), L_a = R_a/r</li>
  <li>Βήμα 2: U_cw = K_c·U_rp, με το K_cd του Σχήματος 7 για τα αλεξικέραυνα· βήμα 3: U_rw = U_cw·K_s·K_a, K_s = 1,15 (εσωτερική) ή 1,05 (εξωτερική), K_a = e^(m·H/8150)</li>
  <li>Βήμα 4: μετατροπή με τους συντελεστές των Πινάκων 1 (περιοχή I) και 2 (περιοχή II)· βήμα 5: το μικρότερο τυποποιημένο επίπεδο του IEC 60071-1 που τα καλύπτει</li></ul>`+inscoHTML(o,m.emt?'ταχέος μετώπου από την προσομοίωση':m.lead);}
function netFaultTheory(){const s=S.sim,m=S.tutMeta||{};if(!s||!m.grid||!window.NetLib)return '';
 const g=m.xf?NetLib.behindXF(m.grid,m.xfp):{seq:NetLib.gridZ(m.grid)},ref=NetLib.faultCurrents(g,{kind:m.kind}),Un=m.xf?m.xfp.U2:m.grid.Un;
 // 4.24: a neutral through R_n + jX_n adds 3Z_n to the zero sequence (IEC 60909-0)
 const zn=(g.seq.Rng||g.seq.Xng)?[3*(g.seq.Rng||0),3*(g.seq.Xng||0)]:null,z=zn?{...g.seq,R0:g.seq.R0+zn[0],X0:g.seq.X0+zn[1]}:g.seq;
 const Z1=Math.hypot(z.R1,z.X1),c2=(a,b)=>Math.hypot(a,b);
 let h=`<ul class="eqs"><li>${m.xf?'Δίκτυο ανηγμένο στα 20 kV και μετασχηματιστής: Z₁ = Z_Q·(U₂/U₁)² + Z_T, Z₀ = Z_T (το τρίγωνο κόβει τη μηδενική του δικτύου)':'Ισοδύναμο δικτύου (IEC 60909): Z₁ = c·U_n²/S″k'}: Z₁ = ${eng(z.R1,'Ω',3)} + j${eng(z.X1,'Ω',3)}, ${z.iso?'Z₀: μονωμένος ουδέτερος (1 MΩ)':`Z₀ = ${eng(z.R0,'Ω',3)} + j${eng(z.X0,'Ω',3)}`}${zn?` (με 3Z_n = ${eng(zn[0],'Ω',3)} + j${eng(zn[1],'Ω',3)} του ουδετέρου)`:''}, E = c·U_n/√3 = <b>${eng(z.E,'V')}</b></li>
  <li>I″k3 = E/|Z₁| = <b>${eng(z.E/Z1,'A')}</b>, I″k2 = √3·E/|2Z₁| = <b>${eng(Math.sqrt(3)*z.E/(2*Z1),'A')}</b>, ${z.iso?'μονωμένος ουδέτερος: I″k1 και I″kE2E σχεδόν μηδέν (το ρεύμα προς γη κλείνει μόνο από το 1 MΩ και τις χωρητικότητες)':`I″k1 = 3E/|2Z₁ + Z₀| = <b>${eng(3*z.E/c2(2*z.R1+z.R0,2*z.X1+z.X0),'A')}</b>, I″kE2E = 3E/|Z₁ + 2Z₀| = <b>${eng(3*z.E/c2(z.R1+2*z.R0,z.X1+2*z.X0),'A')}</b>`}</li>
  <li>Κρουστικό ρεύμα: i_p = κ·√2·I″k3, κ = 1,02 + 0,98·e^(−3R/X) = <b>${fmt(1.02+.98*Math.exp(-3*z.R1/z.X1),4)}</b>, σταθερά της DC τ = X/(ωR) = ${eng(z.X1/(z.R1*2*Math.PI*50),'s')}</li></ul>`;
 const done=s.t>=Math.min(m.dur,.2)-1e-9;
 if(!done)return h+'<p class="muted small">Τρέξε ως τα 200 ms για τη σύγκριση (η DC συνιστώσα σβήνει πρώτα).</p>';
 if(m.cb&&s.t>.2+1e-9){const ev=(s.events?.().list||[]).filter(e=>e.t>.2&&e.kind==='scr'&&!e.v).map(e=>`${esc(e.name||e.src||'')} στα ${eng(e.t,'s',5)}`);
  return h+`<p>Ο διακόπτης πήρε εντολή στα 200 ms. Πόλοι που έσβησαν: ${ev.length?ev.join(', '):'—'}. Κάθε πόλος σβήνει στο μηδέν του ρεύματός του.</p>`;}
 const rows=[];for(const x of ['a','b','c'])if(ref[x]>1)rows.push(['I″k φάσης '+x,ref[x],s.lastPeriod('Y:F1/I'+x)?.rms,'A']);
 if(ref.g>1||/g$/.test(m.kind))rows.push(['ρεύμα προς γη 3I₀',ref.g,s.lastPeriod('Y:F1/Ig')?.rms,'A']);
 return h+cmpRows(rows)+`<p class="muted small">Θεωρία: λύση στο πεδίο των φάσεων με Z_s = (2Z₁ + Z₀)/3, Z_m = (Z₀ − Z₁)/3 (ίδια με τους τύπους παραπάνω). Προσομοίωση: RMS της τελευταίας περιόδου.</p>`;}
// 5.0.1 (ROADMAP §92, THEORY §8ΩΖ): the energization of a transformer with a saturable core. Per phase (the star of side 1
// grounded: the phases do not share their flux), with R = 0: the flux the source applies, ψ(t) = ψ_r + ψ_m·(cos θ − cos(ωt + θ)),
// reaches its largest |ψ| at ψ_r + ψ_m·(cos θ ± 1); it is shared between the reactance of the network and of the leakage up to
// the branch, (L_δ + L_b)·i, and the core, f⁻¹(i): the current solves (L_δ + L_b)·i + f⁻¹(i) = ψ̂ on the curve of the core
function inrushTheory(){const s=S.sim,m=S.tutMeta||{};if(!s||!m.xf||!window.NetLib)return '';
 const g=NetLib.gridZ({...P.defaults('GRID3'),...m.grid}),c=NetLib.xfCore(m.xf),w=g.w,pm=Math.SQRT2*g.E/w,Ls=g.X1/w,th=(+m.th||0)*Math.PI/180;
 const d=NetLib.xfData({...P.defaults('XF3'),...m.xf}),Pb=Math.SQRT2*d.Uw1/d.w,Ib=Math.SQRT2*d.Su/d.Uw1;
 const inv=c?(i=>c.ch.inv(i)):(i=>i*d.Lm),Lb=c?c.Xb*c.Lb:d.Xk/2/d.w;
 let h=`<ul class="eqs"><li>Βάσεις (μία μονάδα, πλευρά 1): ψ_b = √2·U/ω = <b>${eng(Pb,'V·s')}</b>, î_b = √2·S/U = <b>${eng(Ib,'A')}</b>· δίκτυο: ψ_m = √2·E/ω = ${fmt(pm/Pb,4)} pu, X_δ = ${eng(g.X1,'Ω')} (${fmt(g.X1/(d.Zb1),3)} pu)</li>`+
  (c?`<li>Πυρήνας: ως το γόνατο η κλίση της X_m = ${fmt(c.ch.L0/c.Lb,4)} pu, μετά το τελευταίο σημείο ${fmt(c.ch.Lend/c.Lb,3)} pu· σκέδαση ως τον κλάδο ${fmt(c.Xb,3)} pu, άρα X_ac = <b>${fmt(c.Xb+c.ch.Lend/c.Lb,3)} pu</b></li>`:'<li>Γραμμικός πυρήνας: i = ψ/L_m, χωρίς ρεύμα ζεύξης</li>')+
  `<li>Με R = 0 η ροή της πηγής φτάνει ψ̂ = ψ_r + ψ_m·(cos θ ± 1), θ η φάση της τάσης στη ζεύξη· το ρεύμα λύνει (L_δ + L_b)·î + f⁻¹(î) = ψ̂ (εκτίμηση: οι αντιστάσεις το μειώνουν)</li></ul>`;
 const rows=[],few=[];
 ['a','b','c'].forEach((x,k)=>{const tk=th-k*2*Math.PI/3,pr=(c?c.psi0[k]:0),hi=pr+pm*(Math.cos(tk)+1),lo=pr+pm*(Math.cos(tk)-1),pk=Math.abs(hi)>Math.abs(lo)?hi:lo;
  let a=0,b=Math.abs(pk)/Ls,F=i=>(Ls+Lb)*i+inv(i)-Math.abs(pk);for(let it=0;it<200;it++){const q=(a+b)/2;if(F(q)>0)b=q;else a=q;}const i=(a+b)/2;
  const sp=rawSeries('PSIm:T1/T'+x),si=rawSeries('Y:CB1/I'+x),mx=r=>r&&r.y.length?r.y.reduce((u,v)=>Math.max(u,Math.abs(v)),0):NaN;
  if(c&&i>2*Ib){rows.push(['ψ̂ πυρήνα, φάση '+x,inv(i)/Pb,mx(sp)/Pb,'pu'],['î, φάση '+x,i,mx(si),'A']);}else few.push(x);});
 if(s.t<0.04)return h+'<p class="muted small">Τρέξε τουλάχιστον δύο περιόδους για τη σύγκριση.</p>';
 return h+(rows.length?cmpRows(rows):'')+(few.length?`<p>Φάσεις χωρίς βαθύ κορεσμό στη θεωρία (î < 2·î_b): ${few.join(', ')}· το ρεύμα τους στην προσομοίωση έρχεται κυρίως από τις άλλες φάσεις, μέσα από το τρίγωνο της πλευράς 2.</p>`:'')+`<p class="muted small">Προσομοίωση: η μεγαλύτερη |τιμή| ως τώρα. Η θεωρία αγνοεί τις αντιστάσεις (δικτύου, τυλιγμάτων, R_fe) και τη σύζευξη των φάσεων μέσα από το τρίγωνο της πλευράς 2: είναι εκτίμηση, όχι όριο. Παραμένουσα ροή ${(m.rem||[]).map(v=>fmt(v,2)).join(' / ')} pu, κρατιέται ως τη ζεύξη (THEORY §8ΩΖ).</p>`;}
function busDqTheory(){const s=S.sim,m=S.tutMeta||{};if(!s||!m.L)return '';const {E,R,L,f,fc,wc,Kp,Ki,id,iq,dec,t1,t2}=m,w=2*Math.PI*f;
 const t=s.t,idr=t>=t1?id:0,iqr=t>=t2?iq:0,vd=E+R*idr-w*L*iqr,vq=R*iqr+w*L*idr,ia=s.lastPeriod('I:XL/La'),va=s.lastPeriod('V:XI/Va');
 return `<ul class="eqs"><li>Σύστημα υπό έλεγχο (plant) στο dq: L·di_d/dt = v_d − e_d − R·i_d + ωL·i_q, L·di_q/dt = v_q − e_q − R·i_q − ωL·i_d (θ = ωt − 90°, e_d = Ê = ${eng(E,'V')}, e_q = 0)</li>
  <li>PI με μηδενικό στον πόλο του συστήματος υπό έλεγχο: K_p = ω_c·L = <b>${fmt(Kp,4)}</b> Ω, K_i = ω_c·R = <b>${fmt(Ki,4)}</b> Ω/s (f_c = ${fmt(fc,3)} Hz)</li>
  <li>${dec?`Με αποσύζευξη v* = PI(e) + e_dq + ωL·(−i_q, i_d): i_dq/i*_dq = ω_c/(s + ω_c), τ = 1/ω_c = <b>${eng(1/wc,'s')}</b>, οι άξονες ανεξάρτητοι`:`Χωρίς αποσύζευξη ο όρος ωL·i = ${eng(w*L,'Ω')}·i μένει: ένα βήμα στο i_q σπρώχνει το i_d και το αντίστροφο`}</li>
  <li>Μόνιμη κατάσταση: v_dq = e_dq + (R + jωL)·i_dq, |v| = <b>${eng(Math.hypot(vd,vq),'V')}</b>, Î_φάσης = √(i_d² + i_q²) = <b>${eng(Math.hypot(idr,iqr),'A')}</b></li></ul>`+
  cmpRows([['i_d',idr,s.now('Y:PK'),'A'],['i_q',iqr,s.now('Y:PK:q'),'A'],['Î φάσης a',Math.hypot(idr,iqr),ia?(ia.max-ia.min)/2:NaN,'A'],['V̂ αντιστροφέα (φάση a)',Math.hypot(vd,vq),va?(va.max-va.min)/2:NaN,'V']])+
  `<p class="muted small">Δίαυλοι: ${Object.keys(s.net.vec||{}).length} μπλοκ δουλεύουν σε δύο στοιχεία (d, q), δηλαδή ${2*Object.keys(s.net.vec||{}).length} μπλοκ στον λύτη. Ο λύτης βλέπει το ίδιο κύκλωμα με χωριστά σύρματα.</p>`;}
function subLegsTheory(){const s=S.sim,m=S.tutMeta||{};if(!s||!m.N)return '';const {N,D,Vin,L,fs,R,shift}=m,Vo=D*Vin,dI=Vin*D*(1-D)/(L*fs),k=Math.floor(N*D+1e-9);
 const dS=shift?Vin*(N*D-k)*(k+1-N*D)/(N*L*fs):N*dI,vo=avgOver('V:C1'),io=avgOver('Y:AM1',5);
 const legs=Array.from({length:N},(_,j)=>avgOver(`I:X${j+1}/L1`,5)?.avg);
 return `<ul class="eqs"><li>V_o = D·V_in = <b>${eng(Vo,'V')}</b>, I_o = V_o/R = <b>${eng(Vo/R,'A')}</b>, ανά σκέλος <b>${eng(Vo/R/N,'A')}</b></li>
  <li>Κυμάτωση σκέλους Δi = V_in·D(1 − D)/(L·f_s) = <b>${eng(dI,'A')}</b></li>
  <li>${shift?`Άθροισμα με φάσεις k·360°/N: Δi_Σ = V_in·(N·D − m)(m + 1 − N·D)/(N·L·f_s), m = ⌊N·D⌋ = ${k}: <b>${eng(dS,'A')}</b>${Math.abs(N*D-Math.round(N*D))<1e-9?' (N·D ακέραιος: ακύρωση)':''}`:`Συμφασικά τα σκέλη αθροίζονται: Δi_Σ = N·Δi = <b>${eng(dS,'A')}</b>`}</li>
  <li>Μέσο ρεύμα ανά σκέλος (προσομοίωση): ${legs.map((x,j)=>`σκέλος ${j+1} ${eng(x,'A')}`).join(' · ')}</li></ul>`+
  cmpRows([['V_o (μέση)',Vo,vo?.avg,'V'],['Δi σκέλους 1 p-p',dI,lastPP('I:X1/L1'),'A'],['Δi_Σ p-p (A_o)',dS,lastPP('Y:AM1'),'A'],['⟨i_o⟩',Vo/R,io?.avg,'A']])+
  `<p class="muted small">Κάθε σκέλος είναι instance του ίδιου ορισμού «${esc(defsOf().leg?.title||'leg')}»: ίδια στοιχεία, δική του φάση και αρχική τιμή (δημόσιες παράμετροι), δική του κατάσταση.</p>`;}
// 4.19.4: the current loop of the third exercise, made of plain blocks. Theory from the values of the parts as they stand,
// the response measured on the mean of every carrier period (on the held sample with the sawtooth, where the loop holds the peak).
// The settling band is ±2 % of I_n around the final value, whatever the size of the step.
function currentCtlTheory(){const s=S.sim,m=S.tutMeta||{};if(!s||!m.fs||!editor.comp('PI1')||!paramsOf('L1'))return '';
 const L=+paramsOf('L1').L,Kp=+paramsOf('PI1').Kp,Ki=+paramsOf('PI1').Ki,fs=m.fs,T=1/fs,Vdc=+paramsOf('VB').V,Vst=+paramsOf('VS').V;
 const sum=Kp/L,prod=Ki/L,disc=sum*sum-4*prod,a=disc>=0?(sum+Math.sqrt(disc))/2:NaN,b=disc>=0?(sum-Math.sqrt(disc))/2:NaN;
 const R2=+paramsOf('R2').R,esr=+paramsOf('C1').esr||0,D0=Vst/Vdc,dI=Vst*(1-D0)/(L*fs),Rpar=R2+esr>0?R2*esr/(R2+esr):0;
 // the step response of ((a+b)s + ab)/((s+a)(s+b)): y = 1 − (a·e^(−at) − b·e^(−bt))/(a − b); its largest value at t* = 2·ln(a/b)/(a − b)
 const tp=2*Math.log(a/b)/(a-b),mp=100*(b*Math.exp(-b*tp)-a*Math.exp(-a*tp))/(a-b);
 const key=m.saw?'H:SHi':'I:L1',rows=lastPeriods(key,100000),t=rows.map(q=>q.t),y=rows.map(q=>q.avg),ref=x=>x<m.t1?m.lev[0]:x<=m.t2?m.lev[1]:m.lev[2];
 const R=(t0,t1)=>t.length&&t[t.length-1]>=t1-T?Metrics.responseMetrics({t,y,tStep:t0,tEnd:t1,ref,band:.02*m.In/Math.max(Math.abs(ref(t1)),1e-9)}):null;
 const up=m.test!=='C'?R(m.t1,m.t2):null,dn=m.test!=='C'?R(m.t2,m.stopT):null;
 // the overshoot against the reference (the metrics measure it against the end of the window, where the slow pole still lives)
 const over=(t0,t1)=>{const r0=ref(t0-1e-12),r1=ref(t1),d=Math.sign(r1-r0);let pk=0;for(let i=0;i<t.length;i++)if(t[i]>t0&&t[i]<=t1+1e-12)pk=Math.max(pk,d*(y[i]-r1));return 100*pk/Math.abs(r1-r0);};
 const ia=avgOver('I:L1',5),hs=s.now('H:SHi'),ir=s.now('Y:KREF'),dm=avgOver('Y:SAT1',5),vb=avgOver('Y:VM2',5);
 let h=`<div class="tm"><span class="badge">δοκιμή ${({A:'Α',B:'Β',C:'Γ'})[m.test]||''}</span>${m.saw?'πριονωτό φέρον · δείγμα στην αρχή της περιόδου':'τριγωνικό φέρον · δείγμα στο μέγιστο'}${m.raw?' · V_dc χωρίς S&H':''}</div>`;
 h+=`<ul class="eqs"><li>L·di/dt = V_st − D·V_dc. Με D = (V_st − u)/V_dc το πηνίο βλέπει u (έξοδος του PI σε V) και ο βρόχος τον ολοκληρωτή 1/(sL)</li>
  <li>Κλειστός βρόχος (s + a)(s + b): K_p = L(a + b) = <b>${eng(Kp,'V/A')}</b>, K_i = L·a·b = <b>${eng(Ki,'V/(A·s)')}</b>${Number.isFinite(a)?`, άρα a = <b>${fmt(a,4)}</b> s⁻¹ και b = <b>${fmt(b,3)}</b> s⁻¹`:': μιγαδικοί πόλοι'}</li>
  ${Number.isFinite(a)?`<li>Άνοδος 10–90 % ≈ ln 9/a = <b>${eng(Math.log(9)/a,'s')}</b>. Το μηδενικό K_i/K_p = ${fmt(Ki/Kp,3)} s⁻¹ σχεδόν απλοποιεί τον αργό πόλο· η υπερύψωση της θεωρίας είναι <b>${fmt(mp,3)} %</b> και σβήνει με 1/b = ${eng(1/b,'s')}</li>`:''}
  <li>D₀ = V_st/V_dc = <b>${fmt(D0,4)}</b>, Δi = V_st·(1 − D₀)/(L·f_s) = <b>${eng(dI,'A')}</b></li>
  <li>${m.saw?'Το δείγμα στην αρχή της περιόδου είναι η <b>κορυφή</b> του i_L: ο βρόχος κρατά εκεί την αναφορά και η μέση τιμή μένει Δi/2 πιο κάτω':'Το δείγμα στο μέγιστο του τριγώνου πέφτει στο μέσο της κυμάτωσης: δείγμα = <b>μέση τιμή</b> του i_L'}</li>
  <li>Η V_dc πηδά κατά i_L·(R₂∥ESR) = <b>${eng(Math.abs(Number.isFinite(ir)?ir:m.In)*Rpar,'V')}</b> όταν αλλάζει ο S1. ${m.raw?'Χωρίς S&H το D την ακολουθεί μέσα στην περίοδο και γυρίζει στον συγκριτή χωρίς καμία κατάσταση στον δρόμο. Ο λύτης εδώ το περνά, με σταθερό και με μεταβλητό βήμα· ένας λύτης που ζητά ο βρόχος να συμφωνεί ακριβώς στη στιγμή της μεταγωγής μπορεί να μείνει σε συνεχόμενες μεταγωγές.':'Με S&H το D αλλάζει μία φορά ανά περίοδο, μακριά από τις τομές με το φέρον.'}</li></ul>`;
 h+=cmpRows([[m.saw?'δείγμα i_L (κορυφή)':'δείγμα i_L',ir,hs,'A'],['⟨i_L⟩ (τελευταίες 5 T)',m.saw?ir-dI/2:ir,ia?.avg,'A'],['D',D0,dm?.avg,''],['Δi',dI,ia?.pp,'A']]);
 const row=(n,r,os)=>r&&r.ok?`<tr><td>${n}</td><td>${Number.isFinite(r.rise)?eng(r.rise,'s'):'–'}</td><td>${fmt(os,3)} %</td><td>${Number.isFinite(r.ts)?eng(r.ts,'s'):'δεν έκλεισε'}</td><td>${fmt(100*Math.abs(r.ess)/m.In,3)} %</td></tr>`:'';
 if(up||dn)h+=`<table class="cmp"><thead><tr><th>Βήμα</th><th>Άνοδος 10–90 %</th><th>Υπερύψωση (% του βήματος)</th><th>Αποκατάσταση (±2 % του I_n)</th><th>Σφάλμα στο τέλος (% I_n)</th></tr></thead><tbody>${row(`${eng(m.lev[0],'A')} → ${eng(m.lev[1],'A')}`,up,over(m.t1,m.t2))}${row(`${eng(m.lev[1],'A')} → ${eng(m.lev[2],'A')}`,dn,over(m.t2,m.stopT))}</tbody></table><p class="small muted">Μετρημένα στη ${m.saw?'δειγματισμένη τιμή':'μέση τιμή κάθε περιόδου'}. Στόχοι της άσκησης: άνοδος περίπου 1 ms, υπερύψωση έως 10 %, αποκατάσταση έως 2 ms, μόνιμο σφάλμα έως 1 %.</p>`;
 if(m.test==='C'){const seg=rows.filter(q=>q.t>m.t1),dev=seg.length?Math.max(...seg.map(q=>Math.abs(q.avg-m.lev[0]))):NaN;
  h+=`<p class="small">Βήμα V_st +${eng(m.dV,'V')} στα ${eng(m.t1,'s')} και πίσω στα ${eng(m.t2,'s')}: μέγιστη απόκλιση ${m.saw?'του δείγματος':'της μέσης τιμής'} από την αναφορά <b>${Number.isFinite(dev)?eng(dev,'A'):'–'}</b>${Number.isFinite(dev)?` (${fmt(100*dev/m.lev[0],3)} %)`:''}.</p>`;}
 h+=evalOrderHTML();
 return h+`<p class="small muted">Τάση ζυγού ⟨V_dc⟩ = ${vb?eng(vb.avg,'V'):'–'}. Οι τιμές είναι παράδειγμα: με δικά σου L, f_s, I_n και παράθυρο τάσης άλλαξε τα στοιχεία και τα κέρδη, η κάρτα ξαναϋπολογίζει από ό,τι έχει το σχέδιο.</p>`;}
function blocksTheory(){const s=S.sim,m=S.tutMeta||{};if(!s||!m.fs||!editor.comp('AM1')||!paramsOf('VO'))return '';const T=1/m.fs,key=m.blk?'Y:AM1':'I:L1';
 const iref=m.blk?s.now('Y:K1'):s.now('REF:PWM1'),i=Number.isFinite(iref)?iref:m.i1,Vin=+paramsOf('V1').V,Vo=+paramsOf('VO').V,D=Vo/Vin,dI=(Vin-Vo)*D*T/+paramsOf('L1').L;
 const ia=avgOver(key,5),dsim=m.cmp?avgOver('GS:S1',5)?.avg:avgOver('D:PWM1',5)?.avg;
 const after=lastPeriods(key,20000).filter(q=>q.t>m.t1+T&&q.t<m.t1+40*T);const vk=after.length?Math.max(...after.map(q=>q.min)):NaN;const os=after.length>=20?100*(vk-m.i1)/(m.i1-m.i0):NaN;
 const pmLoss=360*m.fc/m.fs;
 let h=`<div class="tm"><span class="badge">${m.blk?'PI από μπλοκ':'ενσωματωμένος PI'}</span>${m.blk?(m.cmp?'φέρον + συγκριτής':'PWM με είσοδο d'):''}${m.z1?' · z⁻¹':''}</div>`;
 h+=`<ul class="eqs"><li>K_p = <b>${eng(m.kp)}</b>, K_i = <b>${eng(m.ki)}</b>: f_c = f_s/20 = ${eng(m.fc,'Hz')}, περιθώριο φάσης 60° μαζί με την καθυστέρηση ZOH${m.z1?`. Η z⁻¹ αφαιρεί άλλες ω_c·T·180°/π = <b>${fmt(pmLoss,3)}°</b>, άρα μένουν περίπου ${fmt(60-pmLoss,3)}°`:''}</li>
  <li>D = V_o/V_in = <b>${fmt(D,4)}</b>, Δi = (V_in − V_o)·D·T/L = <b>${eng(dI,'A')}</b></li>
  <li>Ο PI μετρά στην αρχή της περιόδου. Με πριονωτό φέρον εκεί είναι η <b>κοιλάδα</b> του i_L (όπως στην Άσκηση 2), άρα κοιλάδα = i_ref και ⟨i_L⟩ = i_ref + Δi/2</li>
  ${Number.isFinite(os)?`<li>Υπερύψωση της κοιλάδας μετά το βήμα ${eng(m.i0,'A')} → ${eng(m.i1,'A')}: <b>${fmt(Math.max(0,os),3)} %</b>${os<=.05?' (καμία)':''}</li>`:''}</ul>`;
 h+=cmpRows([['κοιλάδα i_L',i,ia?.min,'A'],['⟨i_L⟩ (τελευταίες 5 T)',i+dI/2,ia?.avg,'A'],['D',D,dsim,'']]);
 h+=evalOrderHTML();
 if(m.blk)h+=`<p class="small muted">Ο PI από μπλοκ ακολουθεί τους κανόνες του ενσωματωμένου (ίδιο δείγμα, ίδιο anti-windup), γι' αυτό με «PWM με είσοδο d» δίνει ακριβώς το ίδιο D. ${m.cmp?'Με φέρον και συγκριτή ο λύτης εντοπίζει τη στιγμή που το φέρον περνά το d μέσα στο βήμα του, όπως τις μεταβάσεις των διόδων.':''}</p>`;
 return h;}
// 3.0: peak current-mode. A valley error Δi is multiplied every period by λ = (m_a − m₂)/(m₁ + m_a)
function pcmTheory(){const s=S.sim,m=S.tutMeta||{};if(!s||!m.fs||!paramsOf('V1')||!paramsOf('VO')||!paramsOf('L1'))return '';const T=m.T,R=paramsOf('RMP1'),ic0=s.now('Y:IC'),ic=Number.isFinite(ic0)?ic0:m.ic,vl=m.mode==='valley';
 const Vin=+paramsOf('V1').V,Vo=+paramsOf('VO').V,L=+paramsOf('L1').L,D=Vo/Vin,m1=(Vin-Vo)/L,m2=Vo/L,ma=R?(+R.hi-+R.lo)*(+R.f):0;
 // a perturbation of the sample at the clock is multiplied by λ every period
 const lam=vl?(ma-m1)/(m2+ma):(ma-m2)/(m1+ma),stable=Math.abs(lam)<1,mamin=vl?Math.max(0,(m1-m2)/2):Math.max(0,(m2-m1)/2);
 const Ipk=vl?ic+ma*(1-D)*T+m1*D*T:ic-ma*D*T,Iv=vl?ic+ma*(1-D)*T:Ipk-m2*(1-D)*T;
 const pk=lastPeriods('Y:AM1',8),dd=lastPeriods('GS:S1',8);const ds=dd.map(q=>q.avg);const spread=ds.length?Math.max(...ds)-Math.min(...ds):NaN;
 const alt=ds.length>=6&&ds.slice(2).every((d,k)=>Math.abs(d-ds[k])<2e-3)&&spread>2e-3;
 const verdict=!ds.length?'':spread<2e-3?'σταθερό: ίδιος λόγος κατάτμησης σε κάθε περίοδο (1T)':alt?'υποαρμονική: ο λόγος κατάτμησης εναλλάσσεται κάθε περίοδο (2T)':'υποαρμονική / χαοτική: ο λόγος κατάτμησης αλλάζει από περίοδο σε περίοδο';
 const mc=1+ma/m1,Qp=1/(Math.PI*(mc*(1-D)-.5));
 let h=`<div class="tm"><span class="badge ${stable?'ccm':'dcm'}">${stable?'|λ| < 1: σταθερό':'|λ| ≥ 1: ασταθές'}</span> ${vl?'valley · ':''}D = ${fmt(D,3)} · m_a = ${m.ramp==='none'?'0':m.ramp==='half'?(vl?'m₁/2':'m₂/2'):(vl?'m₁':'m₂')}</div>`;
 h+=`<ul class="eqs"><li>Κλίσεις: m₁ = (V_in − V_o)/L = <b>${eng(m1,'A/s')}</b> (ON), m₂ = V_o/L = <b>${eng(m2,'A/s')}</b> (OFF), ράμπα m_a = <b>${eng(ma,'A/s')}</b></li>`;
 if(vl)h+=`<li>Valley: το ρολόι σβήνει τον S1 και ο συγκριτής τον ανάβει όταν i_L = i_c + m_a·t. Μια διαταραχή Δi της κορυφής γίνεται λ·Δi στην επόμενη περίοδο: λ = (m_a − m₁)/(m₂ + m_a) = <b>${fmt(lam,4)}</b></li>
  <li>Χωρίς ράμπα λ = −(1 − D)/D: ασταθές για D < 0,5, ο «καθρέφτης» του peak. Για αυτό το D σταθερό όταν m_a > (m₁ − m₂)/2 = <b>${eng(mamin,'A/s')}</b>, για κάθε D αρκεί m_a ≥ m₁/2</li>
  <li>Στη μόνιμη κατάσταση: κοιλάδα i_c + m_a·(1 − D)T = <b>${eng(Iv,'A')}</b>, κορυφή (στο ρολόι) κοιλάδα + m₁·D·T = <b>${eng(Ipk,'A')}</b></li>`;
 else h+=`<li>Μια διαταραχή Δi της κοιλάδας γίνεται λ·Δi στην επόμενη περίοδο: λ = (m_a − m₂)/(m₁ + m_a) = <b>${fmt(lam,4)}</b></li>
  <li>Χωρίς ράμπα λ = −D/(1 − D): ασταθές για D > 0,5. Για αυτό το D σταθερό όταν m_a > (m₂ − m₁)/2 = <b>${eng(mamin,'A/s')}</b>, για κάθε D αρκεί m_a ≥ m₂/2. Με m_a = m₂ ισχύει λ = 0 και η διαταραχή σβήνει σε έναν κύκλο</li>
  <li>Στη μόνιμη κατάσταση: Î = i_c − m_a·D·T = <b>${eng(Ipk,'A')}</b>, κοιλάδα Î − m₂(1 − D)T = <b>${eng(Iv,'A')}</b></li>
  <li>Στο μοντέλο μικρού σήματος (Ridley) η ίδια αστάθεια είναι ένα ζεύγος πόλων στο f_s/2 με Q = 1/(π(m_c(1 − D) − 0,5)), m_c = 1 + m_a/m₁: Q = <b>${Number.isFinite(Qp)&&Qp>0?fmt(Qp,3):'αρνητικό (ασταθές)'}</b>${Qp>2?' (μεγάλη συντονισμένη κορυφή, κοντά στο όριο)':''}</li>`;
 h+=`<li>Ο χάρτης «δείγμα στο ρολόι → επόμενο δείγμα» έχει δύο ευθύγραμμα κομμάτια: με κλίση λ όταν ο συγκριτής αλλάζει μέσα στην περίοδο, και με κλίση 1 όταν δεν αλλάζει (ολόκληρη περίοδος ON ή OFF). Με σταθερή τάση εξόδου (μπαταρία) αυτό δεν δίνει τη διαδοχή 2T → 4T: μόλις |λ| > 1 η λειτουργία γίνεται χαοτική. Δες τον χάρτη και το διάγραμμα στο «Διακλαδώσεις και Poincaré».</li></ul>`;
 h+=cmpRows(vl?[['κορυφή (στο ρολόι, τελευταία T)',stable?Ipk:NaN,pk.length?pk[pk.length-1].max:NaN,'A'],['κοιλάδα (τελευταία T)',stable?Iv:NaN,pk.length?pk[pk.length-1].min:NaN,'A'],['λόγος κατάτμησης D',stable?D:NaN,ds.length?ds[ds.length-1]:NaN,'']]
  :[['κορυφή Î (τελευταία T)',stable?Ipk:NaN,pk.length?pk[pk.length-1].max:NaN,'A'],['κοιλάδα (τελευταία T)',stable?Iv:NaN,pk.length?pk[pk.length-1].min:NaN,'A'],['⟨i_L⟩',stable?(Ipk+Iv)/2:NaN,pk.length?pk[pk.length-1].avg:NaN,'A'],['λόγος κατάτμησης D',stable?D:NaN,ds.length?ds[ds.length-1]:NaN,'']]);
 if(ds.length)h+=`<h4>Τελευταίες ${ds.length} περίοδοι</h4><p class="small">${esc(verdict)}</p><div class="wrap"><table class="cmp"><thead><tr><th>περίοδος</th>${ds.map((d,k)=>`<th>${k-ds.length+1||'τελ.'}</th>`).join('')}</tr></thead><tbody>
  <tr><td>D</td>${ds.map(d=>`<td>${fmt(d,3)}</td>`).join('')}</tr><tr><td>κορυφή i_L</td>${pk.map(q=>`<td>${fmt(q.max,4)}</td>`).join('')}</tr></tbody></table></div>`;
 h+=`<p class="small muted">Η στιγμή που αλλάζει ο συγκριτής εντοπίζεται μέσα στο βήμα του λύτη. Ο λύτης δεν έχει ειδικό κώδικα για current-mode: είναι γενικά μπλοκ (ρολόι, latch, συγκριτής, άθροισμα${vl?', λογικές πύλες':''}). Ο λύτης SciPy στον server δίνει τις ίδιες κορυφές στη σταθερή περιοχή. Στην υποαρμονική συμφωνεί για δεκάδες περιόδους και μετά δίνει την ίδια συμπεριφορά αλλά όχι την ίδια ακολουθία: εκεί κάθε μικρή αριθμητική διαφορά μεγαλώνει κατά |λ| σε κάθε περίοδο.</p>`;
 return h+evalOrderHTML();}
// 3.3: the PI as Python code (and feedforward from an expression block): same rules as the PI block, so the same duty
function codeTheory(){const s=S.sim,m=S.tutMeta||{};if(!s||!m.fs||!editor.comp('AM1'))return '';const T=1/m.fs,Vin=+paramsOf('V1').V,Vo=+paramsOf('VO').V,D=Vo/Vin,dI=(Vin-Vo)*D*T/+paramsOf('L1').L;
 const i=s.now('Y:K1'),ia=avgOver('Y:AM1',5),dsim=avgOver('D:PWM1',5)?.avg,b=s.net.sig.blocks.find(x=>x.id==='PI1'),calls=b?.type==='PY'&&b.st.last!=null?b.st.last+1:NaN;
 const early=lastPeriods('Y:AM1',20000).find(q=>q.t>=5e-4-1e-12);
 let h=`<div class="tm"><span class="badge">${m.py?'PI σε Python':'PI διακριτός (μπλοκ)'}</span>${m.ff?' · πρόσθια τροφοδότηση d = u + v_o/v_in':''}</div><ul class="eqs">
  <li>${m.py?`Ο κώδικας εκτελείται στην αρχή κάθε περιόδου του PWM: ${Number.isFinite(calls)?`<b>${calls}</b> κλήσεις ως τώρα (t·f_s + 1)`:'μία κλήση ανά T'}. Η έξοδος u μένει σταθερή ως την επόμενη κλήση, όπως σε μικροελεγκτή. Python ${esc(PyRT.py?.version?'μέσω Pyodide '+PyRT.py.version:'')}`:'Το μπλοκ «PI διακριτός» κάνει τις ίδιες πράξεις με τον κώδικα Python του tutorial, άρα δίνει ακριβώς το ίδιο D.'}</li>
  <li>K_p = <b>${eng(m.kp)}</b>, K_i = <b>${eng(m.ki)}</b>, D = V_o/V_in = <b>${fmt(D,4)}</b>, Δi = <b>${eng(dI,'A')}</b>. Ο PI μετρά την κοιλάδα (αρχή περιόδου πριονωτού), άρα κοιλάδα = i_ref</li>
  <li>${m.ff?'Πρόσθια τροφοδότηση (feedforward): το μπλοκ έκφρασης δίνει d = u + v_o/v_in από τα βολτόμετρα. Το D είναι σωστό από την πρώτη περίοδο και ο PI διορθώνει μόνο τις απώλειες και τα μεταβατικά (u ≈ 0 στη μόνιμη κατάσταση).':'Χωρίς πρόσθια τροφοδότηση ο ολοκληρωτής πρέπει να φτάσει μόνος του το D = V_o/V_in. Στην εκκίνηση το D είναι 0 και το ρεύμα πέφτει, ώσπου ο ολοκληρωτής να ανέβει.'}</li></ul>`;
 h+=cmpRows([['κοιλάδα i_L',i,ia?.min,'A'],['⟨i_L⟩ (τελευταίες 5 T)',i+dI/2,ia?.avg,'A'],['D',D,dsim,''],...(m.ff?[['κοιλάδα στα 0,5 ms (αρχική αναφορά)',m.i0,early?.min,'A']]:[])]);
 return h+evalOrderHTML();}
// 3.3.1: battery cell test: Z at the perturbation frequency from the Fourier series of v_cell and i_cell (last 2 periods of f)
function eisTheory(){const s=S.sim,m=S.tutMeta||{};if(!s||!m.fs||!editor.comp('KF'))return '';const f=+editor.comp('KF').params.v,T=s.T,P=2;
 if(s.t<P/f+.02)return '<p class="muted small">Τρέξε την προσομοίωση τουλάχιστον '+eng(P/f+.02,'s')+' για να μετρηθεί η εμπέδηση.</p>';
 const ser=k=>lastPeriods(k,Math.min(20000,Math.ceil(P/f/T)+3)).map(q=>({t:q.t-T/2,y:q.avg})),sv=ser('Y:VM1'),si=ser('Y:AM1');
 const z=Metrics.impedance({f,periods:P,tEnd:sv[sv.length-1].t,t:sv.map(q=>q.t),v:sv.map(q=>q.y),i:si.map(q=>q.y)}),zt=cellZ(f,false),zb=cellZ(f,true);if(!z.ok||!zt)return '';
 const R0=+paramsOf('R0').R,R1=+paramsOf('R1').R,C1=+paramsOf('C1').C,W=paramsOf('W1'),Lf=+paramsOf('LF').L,Co=+paramsOf('CO').C,soc=s.now('Y:SOC'),ocv=s.now('Y:EXO'),vci=avgOver('V:CI',20)?.avg,Vs=+paramsOf('V1').V;
 let h=`<div class="tm"><span class="badge">${m.rl?'εκφόρτιση στην R_L':'φόρτιση από V_S'}</span> f = ${eng(f,'Hz')} · I_dc = ${eng(m.Idc,'A')} · I_ac = ${eng(m.Iac,'A')}</div><ul class="eqs">
  <li>Μοντέλο κυψέλης: Z(jω) = R₀ + R₁/(1 + jωR₁C₁) + Z_W, με Z_W = σ(1 − j)/√ω. Ημικύκλιο με κορυφή στο f = 1/(2πR₁C₁) = <b>${eng(1/(2*Math.PI*R1*C1),'Hz')}</b>, Warburg στις 45° στις χαμηλές συχνότητες</li>
  <li>Στο ${eng(f,'Hz')}: Z = <b>${eng(zt[0],'Ω',4)} − j${eng(-zt[1],'Ω',4)}</b>, |Z| = ${eng(Math.hypot(...zt),'Ω',4)}, φάση ${fmt(Math.atan2(zt[1],zt[0])*180/Math.PI,3)}°. Το Warburg στον λύτη είναι ${(+W.N||16)} κλάδοι R–C: ${eng(zb[0],'Ω',4)} − j${eng(-zb[1],'Ω',4)}</li>
  <li>Μέτρηση: σειρά Fourier της τάσης και του ρεύματος της κυψέλης στις 2 τελευταίες περιόδους της f, Z = V₁/I₁. Η μέση τιμή ανά περίοδο μεταγωγής αφαιρεί την κυμάτωση και δεν αλλάζει τον λόγο</li>
  <li>OCV(SOC) από πίνακα: SOC = ${fmt(soc,5)}, OCV = ${eng(ocv,'V',4)}. Το SOC αλλάζει κατά I_dc·t/(3600·Q) = ${fmt(m.Idc*s.t/(3600*m.Qah)*100,3)} % σε ${eng(s.t,'s')}</li>
  <li>Φίλτρο L_f–C_o: συντονισμός στο ${eng(1/(2*Math.PI*Math.sqrt(Lf*Co)),'Hz')}, πολύ πάνω από τη διαταραχή. D ≈ v_cell/V_dc = ${fmt(s.now('Y:VM1')/(vci||Vs),3)}${m.rl?`. Στην εκφόρτιση η τάση του C_i ισορροπεί στο √(P·R_L) ≈ ${eng(Math.sqrt(Math.abs(m.Idc)*Math.abs(ocv)*m.RL),'V')} (μετρημένο ${eng(vci,'V')})`:''}</li></ul>`;
 h+=cmpRows([['Re Z',zt[0],z.re,'Ω'],['−Im Z',-zt[1],-z.im,'Ω'],['|Z|',Math.hypot(...zt),z.mag,'Ω'],['πλάτος I₁ (αναφορά I_ac)',m.Iac,z.I,'A'],['μέσο ρεύμα (ο PI κρατά το I_dc στο δείγμα της αρχής κάθε περιόδου, όχι στη μέση τιμή)',NaN,z.Idc,'A']]);
 return h+`<p class="small muted">Η σάρωση συχνότητας με διάγραμμα Nyquist και Bode είναι στο «Εμπέδηση (EIS)» πλάι στο scope. Το πλάτος του ρεύματος δεν είναι ακριβώς I_ac στις υψηλές συχνότητες (περιορισμένο εύρος ζώνης του βρόχου), αλλά το Z μετρά τον λόγο της τάσης προς το πραγματικό ρεύμα.</p>`+evalOrderHTML();}
// 3.4: induction machine (inverse-Γ). Steady state from the equivalent circuit: Z = R_s + jω₁L_σ + (jω₁L_M ‖ R_R/s)
const cx={add:(a,b)=>[a[0]+b[0],a[1]+b[1]],mul:(a,b)=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]],div:(a,b)=>{const d=b[0]*b[0]+b[1]*b[1];return [(a[0]*b[0]+a[1]*b[1])/d,(a[1]*b[0]-a[0]*b[1])/d];},abs:a=>Math.hypot(a[0],a[1])};
function imSteady(M,V1,f,TL){const w1=2*Math.PI*f,ws=w1/M.p,st=s=>{const zr=[M.RR/s,0],zm=[0,w1*M.LM],zp=cx.div(cx.mul(zm,zr),cx.add(zm,zr)),Z=cx.add([M.Rs,w1*M.Ls],zp),I=V1/cx.abs(Z),Pag=1.5*I*I*zp[0];return {I,te:Pag/ws,psi:I*cx.abs(zp)/w1};};
 // slip from τ_e(s) = τ_L + b·ω (bisection on the stable side)
 let a=1e-6,b=.3;for(let k=0;k<80;k++){const m=(a+b)/2,q=st(m),w=(1-m)*ws;if(q.te-(TL+M.b*w)>0)b=m;else a=m;}const sl=(a+b)/2,q=st(sl);return {sl,w:(1-sl)*ws,ws,...q};}
function imPar(){const p=paramsOf('M1');return p?{Rs:+p.Rs,RR:+p.RR,Ls:+p.Lsig,LM:+p.LM,p:Math.round(+p.pp),J:+p.J,b:+p.bm}:null;}
function phaseRms(key,T,n){const s=S.sim,i=s?.chIndex.get(key),p=s?.per;if(i===undefined||!p?.n)return NaN;n=Math.min(n,p.n);let q=0;for(let k=1;k<=n;k++){const j=(p.head-k+p.cap)%p.cap;q+=p.rms[j*p.nch+i]**2;}return Math.sqrt(q/n);}
function vfTheory(){const s=S.sim,m=S.tutMeta||{},M=imPar();if(!s||!M)return '';const Vdc=+paramsOf('V1').V,f=m.fn,Vref=m.Vn,T=s.T,nT=Math.round(1/(f*T));
 const mm=Vref/(Vdc/2),V1=m.mod==='square'?4/Math.PI*Vdc/2:m.mod==='spwm'?(mm<=1?Vref:Vdc/2*2/Math.PI*(mm*Math.asin(1/mm)+Math.sqrt(1-1/(mm*mm)))):Math.min(Vref,Vdc/Math.sqrt(3));
 const load=s.t>m.tTL+.15,ss=imSteady(M,V1,f,load?m.TL:0),irms=phaseRms('Y:AMa',T,nT*4);
 let h=`<div class="tm"><span class="badge">${m.mod==='svpwm'?'SVPWM':m.mod==='spwm'?'SPWM':'τετραγωνική'}</span> V/f, f_n = ${eng(f,'Hz')}, V_dc = ${eng(Vdc,'V')}</div><ul class="eqs">
  <li>Ανάστροφο-Γ: Z = R_s + jω₁L_σ + (jω₁L_M ‖ R_R/s), ροπή τ_e = (3/2)·p·|I|²·Re{jω₁L_M ‖ R_R/s}/(ω₁/p). Σύγχρονη ταχύτητα ω₁/p = <b>${eng(ss.ws,'rad/s')}</b></li>
  <li>Γραμμική περιοχή: πλάτος φάσης ως V_dc/2 = ${eng(Vdc/2,'V')} με SPWM, ως V_dc/√3 = ${eng(Vdc/Math.sqrt(3),'V')} με SVPWM (έγχυση −(max + min)/2). Τετραγωνική: 4/π·V_dc/2 = ${eng(4/Math.PI*Vdc/2,'V')}, χωρίς ρύθμιση πλάτους</li>
  <li>Στα ${eng(f,'Hz')} η αναφορά είναι ${eng(Vref,'V')}: θεμελιώδης <b>${eng(V1,'V')}</b>${m.mod==='spwm'&&mm>1?` (υπερδιαμόρφωση m = ${fmt(mm,4)}: κομμένο ημίτονο, V₁ = (V_dc/2)·(2/π)(m·asin(1/m) + √(1 − 1/m²)))`:''}</li>
  <li>Μόνιμη κατάσταση με τ_L = ${eng(load?m.TL:0,'N·m')}: ολίσθηση <b>${fmt(ss.sl*100,4)} %</b>, ω = ${eng(ss.w,'rad/s')}, |ψ_R| = ${eng(ss.psi,'V·s',4)}, I_rms = ${eng(ss.I/Math.SQRT2,'A')}</li></ul>`;
 if(s.t<.6)return h+'<p class="muted small">Τρέξε ως το τέλος για τη σύγκριση στη μόνιμη κατάσταση.</p>';
 h+=cmpRows([['ταχύτητα ω_m',ss.w,s.now('Y:M1'),'rad/s'],['|ψ_R|',ss.psi,s.now('Y:M1:psi'),'V·s'],['ρεύμα φάσης (RMS, 4 περίοδοι)',ss.I/Math.SQRT2,irms,'A'],['ροπή τ_e',(load?m.TL:0)+M.b*ss.w,avgOver('Y:M1:te',nT)?.avg,'N·m']]);
 return h+`<p class="small muted">Η θεωρία κρατά μόνο τη θεμελιώδη. Με SPWM σε υπερδιαμόρφωση και με τετραγωνική οι αρμονικές (5η, 7η…) δίνουν επιπλέον ρεύμα και κυμάτωση ροπής: δες το i_a στο «Αρμονικές». Οι τιμές της μηχανής είναι τυπικές.</p>`;}
// 3.4: field orientation with the current model. With R̂_R = k·R_R, in steady state the true rotor flux is
// ψ_R = L_M·(i_d + j·i_q)/(1 + j·k·i_q/i_d) in the estimated frame: |ψ_R| = L_M|i|/√(1 + (k·i_q/i_d)²), angle δ = atan(i_q/i_d) − atan(k·i_q/i_d)
function focTheory(){const s=S.sim,m=S.tutMeta||{},M=imPar();if(!s||!M)return '';const T=s.T,n=Math.round(.02/T),id=avgOver('Y:PK',n)?.avg,iq=avgOver('Y:PK:q',n)?.avg,k=m.k,w=s.now('Y:M1');
 const psiRef=m.psin*Math.min(1,m.wb/Math.max(Math.abs(m.wref),1)),idr=psiRef/M.LM,te=m.TL+M.b*m.wref,iqr=te/(1.5*M.p*psiRef),wsl=M.RR*iqr/psiRef,w1=M.p*m.wref+wsl;
 const us=w1*Math.hypot(M.Ls*iqr,psiRef+M.Ls*idr),Vlim=+paramsOf('V1').V/Math.sqrt(3);
 const psP=M.LM*Math.hypot(id,iq)/Math.sqrt(1+(k*iq/id)**2),dP=(Math.atan2(iq,id)-Math.atan2(k*iq,id))*180/Math.PI;let dM=(s.now('Y:M1:thf')-s.now('Y:FE'))*180/Math.PI;dM=((dM+180)%360+360)%360-180;
 let h=`<div class="tm"><span class="badge">διανυσματικός έλεγχος</span> ω_ref = ${eng(m.wref,'rad/s')}${m.wref>m.wb?' (εξασθένιση πεδίου)':''} · R̂_R = ${fmt(k,2)}·R_R</div><ul class="eqs">
  <li>Ροή αναφοράς ψ_ref = ψ_n·min(1, ω_b/ω) = <b>${eng(psiRef,'V·s',4)}</b>, i_d,ref = ψ_ref/L̂_M = <b>${eng(idr,'A')}</b></li>
  <li>Με τ_L = ${eng(m.TL,'N·m')}: τ_e = τ_L + b·ω = ${eng(te,'N·m')}, i_q = τ_e/((3/2)·p·ψ) = <b>${eng(iqr,'A')}</b>, ολίσθηση ω_sl = R_R·i_q/ψ = ${eng(wsl,'rad/s')}, ω₁ = ${eng(w1,'rad/s')}</li>
  <li>Τάση στάτη περίπου ω₁·√((L_σ·i_q)² + (ψ + L_σ·i_d)²) = ${eng(us,'V')}, όριο SVPWM V_dc/√3 = ${eng(Vlim,'V')}${us>Vlim?': δεν χωράει, χρειάζεται εξασθένιση':''}</li>
  <li>Κέρδη: ρεύματος K_p = α_c·L_σ = ${eng(m.kpc)}, K_i = α_c·(R_s + R_R) = ${eng(m.kic)} (α_c = 2π·300 Hz). Ταχύτητας K_p = α_s·J/k_t = ${eng(m.kps)}, K_i = ${eng(m.kis)} (α_s = 2π·8 Hz)</li>
  <li>Λάθος R̂_R = k·R_R: ο εκτιμητής βγάζει ολίσθηση k φορές την πραγματική. Στη μόνιμη κατάσταση |ψ_R| = L_M·|i|/√(1 + (k·i_q/i_d)²) και η γωνία της πραγματικής ροής απέχει δ = atan(i_q/i_d) − atan(k·i_q/i_d) από τον άξονα d του ελέγχου</li></ul>`;
 if(s.t<m.tTL+.5)return h+'<p class="muted small">Τρέξε ως το τέλος (1,5 s) για τη σύγκριση στη μόνιμη κατάσταση μετά το φορτίο.</p>';
 h+=cmpRows([['ταχύτητα ω_m',m.wref,w,'rad/s'],['i_d (πλαίσιο εκτιμητή)',idr,id,'A'],['i_q (πλαίσιο εκτιμητή)',k===1?iqr:NaN,iq,'A'],['|ψ_R| πραγματική, από τα μετρημένα i_d, i_q',psP,s.now('Y:M1:psi'),'V·s'],['σφάλμα γωνίας θ_f − θ̂ (°)',dP,dM,''],['ροπή τ_e',te,avgOver('Y:M1:te',n)?.avg,'N·m']]);
 return h+`<p class="small muted">Με k ≠ 1 ο βρόχος ταχύτητας αυξάνει ή μειώνει το i_q ώσπου να βγει η ροπή του φορτίου, αλλά με λάθος ροή: με k < 1 υπερμαγνήτιση, με k > 1 υπομαγνήτιση (εδώ χωρίς κορεσμό). Οι τιμές της μηχανής είναι τυπικές.</p>`+evalOrderHTML();}
// 3.5: synchronous reluctance machine. τ_e = K·i_d·i_q with K = (3/2)·p·(L_d − L_q); a current |i| at angle γ from d gives
// τ = K·|i|²·sin(2γ)/2, so the most torque per ampere at γ = 45° (MTPA, without saturation). Steady state at ω_e = p·ω:
// v_d = R·i_d − ω_e·L_q·i_q, v_q = R·i_q + ω_e·L_d·i_d, cos φ = (v_d·i_d + v_q·i_q)/(|v|·|i|) ≤ (ξ − 1)/(ξ + 1), ξ = L_d/L_q.
// Alignment: a current I on the α axis gives τ(δ) = −(3/4)·p·(L_d − L_q)·I²·sin 2δ (δ: electrical angle of d from α)
function synTheory(){const s=S.sim,m=S.tutMeta||{},M=paramsOf('M1');if(!s||!M||M.Ld===undefined)return '';
 const R=+M.Rs,Ld=+M.Ld,Lq=+M.Lq,p=Math.round(+M.pp),J=+M.J,b=+M.bm,K=1.5*p*(Ld-Lq),xi=Ld/Lq,pfMax=(xi-1)/(xi+1),T=s.T,deg=180/Math.PI;
 if(m.mode==='align'){const I=m.Va/R,tmax=.75*p*(Ld-Lq)*I*I,Kth=1.5*p*p*(Ld-Lq)*I*I,fn=Math.sqrt(Kth/J)/(2*Math.PI),psi=Ld*I,Kps=1.5*p*p*(1/Lq-1/Ld)*psi*psi,fps=Math.sqrt(Kps/J)/(2*Math.PI),th0=+m.th0,dF=Math.abs(((th0%360)+360)%360-180)<90?180:0;
  let h=`<div class="tm"><span class="badge">ευθυγράμμιση</span> σταθερό διάνυσμα v_α = ${eng(m.Va,'V')}, θ₀ = ${fmt(th0,3)}°</div><ul class="eqs">
   <li>Ρεύμα στον άξονα α: I = v_α/R_s = <b>${eng(I,'A')}</b> (φάση a: I, φάσεις b, c: −I/2). Με τον άξονα d του δρομέα σε γωνία δ: i_d = I·cos δ, i_q = −I·sin δ</li>
   <li>Ροπή μαγνητικής αντίστασης τ_e = (3/2)·p·(L_d − L_q)·i_d·i_q = <b>−(3/4)·p·(L_d − L_q)·I²·sin 2δ</b>, μέγιστη ${eng(tmax,'N·m')} στις 45°. Περίοδος 180° ηλεκτρικές: ο δρομέας δεν έχει «βόρειο» και «νότιο»</li>
   <li>Ισορροπίες: δ = 0° και 180° ευσταθείς (ο άξονας d, ελάχιστη μαγνητική αντίσταση, πάνω στο ρεύμα), δ = ±90° ασταθείς (ο άξονας q). Από θ₀ = ${fmt(th0,3)}° ο δρομέας πηγαίνει στις <b>${dF}°</b></li>
   <li>Μικρές ταλαντώσεις γύρω από το δ = 0 με <b>σταθερό ρεύμα</b> (τροφοδοσία ρεύματος): K_θ = (3/2)·p²·(L_d − L_q)·I² = ${eng(Kth,'N·m/rad')}, f = √(K_θ/J)/2π = <b>${eng(fn,'Hz')}</b></li>
   <li>Με <b>σταθερή ροή στάτη</b> ψ = L_d·I = ${eng(psi,'V·s')} (η ροή δεν προλαβαίνει να αλλάξει, L_d/R_s = ${eng(Ld/R,'s')}): τ = −(3/4)·p·(1/L_q − 1/L_d)·ψ²·sin 2δ, K_ψ = (3/2)·p²·(1/L_q − 1/L_d)·ψ² = ${eng(Kps,'N·m/rad')} = (L_d/L_q)·K_θ, f = <b>${eng(fps,'Hz')}</b></li>
   <li>Εδώ η τάση είναι σταθερή: η ταλάντωση είναι ανάμεσα στις δύο, πιο κοντά στη σταθερή ροή, και τα ρεύματα που επάγονται όταν αλλάζει η ροή τη φρενάρουν (ηλεκτρική απόσβεση)</li></ul>`;
  if(s.t<.8)return h+'<p class="muted small">Τρέξε ως το τέλος (1,2 s) για τη σύγκριση στη θέση ισορροπίας.</p>';
  // zero crossings of ω from the start; the frequency from the half periods after the first two (smaller swing)
  const w=perSamples('Y:M1','avg',Math.round(s.t/T)),cr=[];for(let k=1;k<w.length;k++)if(Math.sign(w[k])!==Math.sign(w[k-1])&&Math.abs(w[k]-w[k-1])>1e-6)cr.push(k*T);
  const hp=cr.slice(2,8).map((t,k,a)=>k?t-a[k-1]:null).filter(x=>x),fm=hp.length?1/(2*hp.reduce((x,y)=>x+y,0)/hp.length):NaN;
  const d=s.now('Y:DL')*deg,dd=dF===180?Math.abs(d):d;
  h+=cmpRows([['γωνία ισορροπίας |δ| (°)',dF,dd,''],['i_d = I·cos δ',dF===180?-I:I,s.now('Y:M1:id'),'A'],['i_q',0,s.now('Y:M1:iq'),'A'],['ροπή τ_e',0,s.now('Y:M1:te'),'N·m'],['συχνότητα ταλάντωσης (θεωρία: σταθερή ροή)',fps,fm,'Hz']]);
  return h+`<p class="small muted">Το I στην προσομοίωση είναι λίγο μικρότερο από v_α/R_s λόγω του R_on των διακοπτών. Η συχνότητα μετριέται από τις διελεύσεις του ω από το μηδέν, μετά τις δύο πρώτες (μεγάλη αρχική απόκλιση, μη γραμμικό εκκρεμές με sin 2δ). Βγαίνει ανάμεσα στα ${eng(fn,'Hz')} (σταθερό ρεύμα) και ${eng(fps,'Hz')} (σταθερή ροή): η ροή του στάτη αλλάζει λίγο μέσα σε μια περίοδο.</p>`;}
 // with a saturated d axis (3.6) ψ_d = f(i_d): τ = (3/2)·p·(f(i_d) − L_q·i_d)·i_q; the currents for each angle and the MTPA angle numerically
 const sq=M.sat==='d'?{Ld,Ldsat:+M.Ldsat,psik:+M.psikd}:null,fd=i=>sq?P.satD(sq,i).psi:Ld*i,tq=(a,c)=>1.5*p*(fd(a)-Lq*a)*c;
 const need=gg=>{const c=Math.cos(gg/deg),sn=Math.sin(gg/deg);let lo=0,hi=200;for(let k=0;k<80;k++){const mid=(lo+hi)/2;if(tq(mid*c,mid*sn)<te)lo=mid;else hi=mid;}return (lo+hi)/2;};
 const g=m.g,te=m.TL+b*m.wref,we=p*m.wref;let id,iq;if(g){const i=need(g);id=i*Math.cos(g/deg);iq=i*Math.sin(g/deg);}else{id=m.Id0;iq=te/(1.5*p*(fd(m.Id0)-Lq*m.Id0));}
 let gm=45,imtpa=Math.sqrt(2*te/K);if(sq){for(let a=30;a<=85;a+=.1){const i=need(a);if(i<imtpa){imtpa=i;gm=a;}}}
 const vd=R*id-we*Lq*iq,vq=R*iq+we*fd(id),vm=Math.hypot(vd,vq),im=Math.hypot(id,iq),pf=(vd*id+vq*iq)/(vm*im),gpf=Math.atan(Math.sqrt(xi))*deg,Vlim=+paramsOf('V1').V/Math.sqrt(3);
 let h=`<div class="tm"><span class="badge">έλεγχος dq</span> ${g?'γ = '+g+'°'+(g===45?' (MTPA)':''):'σταθερό i_d = '+eng(m.Id0,'A')} · ω_ref = ${eng(m.wref,'rad/s')}, τ_L = ${eng(m.TL,'N·m')} από ${eng(m.tTL,'s')}</div><ul class="eqs">
  <li>Ροπή τ_e = K·i_d·i_q, K = (3/2)·p·(L_d − L_q) = <b>${eng(K,'N·m/A²',4)}</b>. Με |i| σε γωνία γ από τον d: τ_e = K·|i|²·sin(2γ)/2, άρα <b>MTPA στις 45°</b>: |i| = √(2τ/K)${sq?' (χωρίς κορεσμό)':''}</li>
  ${sq?`<li><b>Με κορεσμό</b>: ψ_d = L_dsat·i_d + ψ_k·(1 − e^(−(L_d − L_dsat)·i_d/ψ_k)) με L_dsat = ${eng(sq.Ldsat,'H')}, ψ_k = ${eng(sq.psik,'V·s')}, και τ_e = (3/2)·p·(ψ_d − L_q·i_d)·i_q. Η L_d πέφτει με το ρεύμα, ο όρος (ψ_d − L_q·i_d) μεγαλώνει πιο αργά από το i_d, και η γωνία MTPA ανεβαίνει: <b>γ_MTPA = ${fmt(gm,3)}°</b> (αριθμητικά), με |i| = ${eng(imtpa,'A')}. Οι αναφορές του tutorial υπολογίζονται με το γραμμικό K: ο βρόχος ταχύτητας ζητά μεγαλύτερο τ* ώσπου να βγει η ροπή</li>`:''}
  <li>Αναφορές από τη ροπή τ* του βρόχου ταχύτητας: ${g?`|i| = √(2|τ*|/(K·sin 2γ)), i_d = |i|·cos γ, i_q = sign(τ*)·|i|·sin γ`:`i_d = ${eng(m.Id0,'A')}, i_q = τ*/(K·i_d) (η ροπή γραμμική ως προς i_q)`}</li>
  <li>Μόνιμη κατάσταση: τ_e = τ_L + b·ω = ${eng(te,'N·m')}, i_d = <b>${eng(id,'A')}</b>, i_q = <b>${eng(iq,'A')}</b>, |i| = <b>${eng(im,'A')}</b> (με MTPA${sq?' στις '+fmt(gm,3)+'°':''} ${eng(imtpa,'A')}, ${fmt(100*(im/imtpa-1),3)} % περισσότερο)</li>
  <li>Τάσεις στα ω_e = p·ω = ${eng(we,'rad/s')}: v_d = R·i_d − ω_e·L_q·i_q = ${eng(vd,'V')}, v_q = R·i_q + ω_e·${sq?'ψ_d':'L_d·i_d'} = ${eng(vq,'V')}, |v| = ${eng(vm,'V')} (όριο SVPWM ${eng(Vlim,'V')})</li>
  <li>Συντελεστής ισχύος cos φ = (v_d·i_d + v_q·i_q)/(|v|·|i|) = <b>${fmt(pf,3)}</b>. Το μέγιστο, χωρίς R_s${sq?' και χωρίς κορεσμό':''}, είναι (ξ − 1)/(ξ + 1) = ${fmt(pfMax,3)} με ξ = L_d/L_q = ${fmt(xi,3)}, στη γωνία γ = atan √ξ = ${fmt(gpf,3)}°: γι' αυτό η SynRM θέλει μεγάλο λόγο ξ</li>
  <li>Κέρδη: ρεύματος K_p = α_c·L_d = ${eng(m.kpd)} (d), α_c·L_q = ${eng(m.kpq)} (q), K_i = α_c·R_s = ${eng(m.kic)} (α_c = 2π·200 Hz), με αποσύζευξη −ω_e·L_q·i_q και +ω_e·L_d·i_d. Ταχύτητας K_p = α_s·J = ${eng(m.kps)}, K_i = α_s²·J/4 = ${eng(m.kis)} (α_s = 2π·8 Hz), έξοδος τ* ως ±${eng(m.taumax,'N·m')}</li></ul>`;
 if(s.t<m.tTL+.4)return h+'<p class="muted small">Τρέξε ως το τέλος για τη σύγκριση στη μόνιμη κατάσταση με φορτίο.</p>';
 const n=Math.round(.02/T),a=k=>avgOver(k,n)?.avg,ud=a('Y:EXUD'),uq=a('Y:EXUQ'),sid=a('Y:PK'),siq=a('Y:PK:q');
 const lead=we*T/2,dang=Math.atan2(uq,ud)-Math.atan2(vq,vd),spf2=Math.cos(Math.atan2(uq,ud)-lead-Math.atan2(siq,sid));
 h+=cmpRows([['ταχύτητα ω_m',m.wref,s.now('Y:M1'),'rad/s'],['i_d',id,sid,'A'],['i_q',iq,siq,'A'],['|i|',im,Math.hypot(sid,siq),'A'],['ροπή τ_e',te,a('Y:M1:te'),'N·m'],['|u| (εντολή)',vm,Math.hypot(ud,uq),'V'],
  ['προπορεία της εντολής ω_e·T/2 (°)',lead*deg,dang*deg,''],['cos φ',pf,spf2,'']]);
 return h+`<p class="small muted">Η σύγκριση είναι με μέσες τιμές στα τελευταία 20 ms. Οι τάσεις της προσομοίωσης είναι οι εντολές προς τον διαμορφωτή. Υπολογίζονται με τη γωνία στην αρχή της περιόδου, αλλά εφαρμόζονται κατά μέσο όρο στο μέσο της, όταν ο δρομέας έχει στραφεί κατά ω_e·T/2: γι' αυτό η εντολή προπορεύεται τόσο από τη θεωρία (το cos φ υπολογίζεται χωρίς αυτή την προπορεία). Χωρίς κορεσμό: στην πραγματική SynRM η L_d πέφτει με το ρεύμα και η γωνία MTPA ανεβαίνει πάνω από 45°. Οι τιμές της μηχανής είναι τυπικές.</p>`+evalOrderHTML();}
// 3.5: permanent-magnet synchronous machine. τ_e = (3/2)·p·(ψ_m·i_q + (L_d − L_q)·i_d·i_q); MTPA for a current amplitude i_s:
// i_d = (ψ_m − √(ψ_m² + 8·(L_q − L_d)²·i_s²))/(4·(L_q − L_d)) (from dτ/dγ = 0), i_q = √(i_s² − i_d²); i_d = 0 when L_d = L_q
function pmTheory(){const s=S.sim,m=S.tutMeta||{},M=paramsOf('M1');if(!s||!M||M.Ld===undefined)return '';
 const R=+M.Rs,Ld=+M.Ld,Lq=+M.Lq,pm=+M.psim,p=Math.round(+M.pp),b=+M.bm,dL=Lq-Ld,T=s.T,deg=180/Math.PI,te=m.TL+b*m.wref,we=p*m.wref,Vlim=+paramsOf('V1').V/Math.sqrt(3);
 const mtpa=i=>{if(Math.abs(dL)<1e-12)return [0,i];const d=(pm-Math.sqrt(pm*pm+8*dL*dL*i*i))/(4*dL);return [d,Math.sqrt(Math.max(i*i-d*d,0))];},tq=([d,q])=>1.5*p*(pm*q+(Ld-Lq)*d*q);
 let lo=0,hi=100;for(let k=0;k<100;k++){const mid=(lo+hi)/2;if(tq(mtpa(mid))<te)lo=mid;else hi=mid;}const [dM,qM]=mtpa((lo+hi)/2),q0=te/(1.5*p*pm);
 const [id,iq]=m.strat==='mtpa'?[dM,qM]:[0,q0],vd=R*id-we*Lq*iq,vq=R*iq+we*(Ld*id+pm),vm=Math.hypot(vd,vq),im=Math.hypot(id,iq),pf=(vd*id+vq*iq)/(vm*im);
 let h=`<div class="tm"><span class="badge">${Math.abs(dL)<1e-12?'SPMSM':'IPMSM'}</span> ${m.strat==='mtpa'?'MTPA':'i_d = 0'} · ω_ref = ${eng(m.wref,'rad/s')}, τ_L = ${eng(m.TL,'N·m')} από ${eng(m.tTL,'s')}</div><ul class="eqs">
  <li>Ροπή τ_e = (3/2)·p·(ψ_m·i_q + (L_d − L_q)·i_d·i_q): όρος μαγνήτη και όρος μαγνητικής αντίστασης. L_q − L_d = ${eng(dL,'H')}${dL>0?': αρνητικό i_d προσθέτει ροπή':': χωρίς ροπή μαγνητικής αντίστασης'}</li>
  <li>MTPA (από dτ/dγ = 0 για σταθερό |i|): i_d = (ψ_m − √(ψ_m² + 8·(L_q − L_d)²·i_s²))/(4·(L_q − L_d)), i_q = √(i_s² − i_d²)</li>
  <li>Μόνιμη κατάσταση με τ_e = τ_L + b·ω = ${eng(te,'N·m')}: MTPA i_d = <b>${eng(dM,'A')}</b>, i_q = <b>${eng(qM,'A')}</b>, |i| = <b>${eng(Math.hypot(dM,qM),'A')}</b>· με i_d = 0, i_q = τ/((3/2)·p·ψ_m) = <b>${eng(q0,'A')}</b></li>
  <li>Τάσεις στα ω_e = ${eng(we,'rad/s')}: v_d = R·i_d − ω_e·L_q·i_q = ${eng(vd,'V')}, v_q = R·i_q + ω_e·(L_d·i_d + ψ_m) = ${eng(vq,'V')}, |v| = ${eng(vm,'V')} (όριο ${eng(Vlim,'V')}), cos φ = <b>${fmt(pf,3)}</b></li>
  <li>Κέρδη ρεύματος όπως στη SynRM (α_c = 2π·200 Hz, αποσύζευξη με +ω_e·ψ_m στο u_q). Ταχύτητας K_p = α_s·J/k_t = ${eng(m.kps)}, K_i = ${eng(m.kis)} με k_t = (3/2)·p·ψ_m = ${eng(m.kt,'N·m/A',3)}, έξοδος i_s ως ±${eng(m.Imax,'A')}</li></ul>`;
 if(s.t<m.tTL+.4)return h+'<p class="muted small">Τρέξε ως το τέλος (1 s) για τη σύγκριση στη μόνιμη κατάσταση με φορτίο.</p>';
 const n=Math.round(.02/T),a=k=>avgOver(k,n)?.avg,ud=a('Y:EXUD'),uq=a('Y:EXUQ'),sid=a('Y:PK'),siq=a('Y:PK:q'),lead=we*T/2;
 h+=cmpRows([['ταχύτητα ω_m',m.wref,s.now('Y:M1'),'rad/s'],['i_d',id,sid,'A'],['i_q',iq,siq,'A'],['|i|',im,Math.hypot(sid,siq),'A'],['ροπή τ_e',te,a('Y:M1:te'),'N·m'],['|u| (εντολή)',vm,Math.hypot(ud,uq),'V'],
  ['cos φ',pf,Math.cos(Math.atan2(uq,ud)-lead-Math.atan2(siq,sid)),'']]);
 return h+`<p class="small muted">Μέσες τιμές στα τελευταία 20 ms. Το cos φ της προσομοίωσης αφαιρεί την προπορεία ω_e·T/2 της εντολής τάσης (όπως στη SynRM). Οι τιμές της μηχανής είναι τυπικές.</p>`+evalOrderHTML();}
// 3.6: switched reluctance machine. The energy per stroke is the area of the ψ–i loop of one phase over one electrical period, W = ∮ i dψ;
// N·N_r strokes per revolution give the mean torque N·N_r·W/(2π). Bound for a flat current I from unaligned to aligned: W′(π, I) − W′(0, I)
function srmTheory(){const s=S.sim,m=S.tutMeta||{},srm=s?.net.compInfo.get('M1')?.srm;if(!s||!srm)return '';const g=srm.g,N=srm.N,Nr=srm.Nr,b=srm.b;
 const w=s.now('Y:M1'),Te=w>1?2*Math.PI/(Nr*w):NaN,iref=s.now('Y:PIS'),Wb=P.srmCoenergy(g,Math.PI,iref)-P.srmCoenergy(g,0,iref),tb=N*Nr*Wb/(2*Math.PI);
 let h=`<div class="tm"><span class="badge">SRM ${N*2}/${Nr}</span> ${N} φάσεις · θ_on = ${m.on}°, θ_off = ${m.off}° (ηλεκτρικές) · ΔI = ${eng(m.band,'A')} · V_dc = ${eng(m.Vdc,'V')}</div><ul class="eqs">
  <li>Γωνία φάσης θ_e,k = N_r·θ − (k − 1)·360°/N: 0° μη ευθυγραμμισμένη, 180° ευθυγραμμισμένη. Βήμα (stroke) ${fmt(360/(N*Nr),3)}° μηχανικές, ${N*Nr} παλμοί ροπής ανά στροφή</li>
  <li>Ροπή φάσης τ = ∂W′/∂θ με W′(θ, i) = ∫₀ⁱ ψ(θ, i′) di′: θετική όσο η L μεγαλώνει (0° … 180°), αρνητική μετά την ευθυγράμμιση. Γι' αυτό το ρεύμα πρέπει να σβήσει πριν τις 180°</li>
  <li>Ενέργεια ανά παλμό: το εμβαδόν του βρόχου ψ–i, W = ∮ i dψ. Μέση ροπή <b>τ = N·N_r·W/(2π)</b></li>
  <li>Όριο με σταθερό ρεύμα I = i_ref = ${eng(iref,'A',3)} από τη μη ευθυγραμμισμένη ως την ευθυγραμμισμένη θέση: W′(180°, I) − W′(0°, I) = ${eng(Wb,'J',3)}, τ = <b>${eng(tb,'N·m',3)}</b></li>
  <li>Βρόχος ταχύτητας: K_p = α_s·J/K = ${eng(m.kps)}, K_i = α_s²·J/(4K) = ${eng(m.kis)} με K ≈ ${fmt(m.K,2)} N·m/A στο σημείο λειτουργίας (η ροπή της SRM αυξάνει περίπου με i², ο βρόχος δεν είναι γραμμικός). i_ref από 0 ως ${eng(m.Imax,'A')}: η μηχανή δεν φρενάρει</li></ul>`;
 if(s.t<m.tTL+.3||!(Te>0))return h+'<p class="muted small">Τρέξε ως το τέλος (0,8 s): ο βρόχος ψ–i και η σύγκριση γίνονται στη μόνιμη κατάσταση με το φορτίο.</p>';
 const ri=rawSeries('I:M1'),rp=rawSeries('PSI1:M1'),rt=rawSeries('Y:M1:te');if(!ri||!rp||!rt)return h;const t1=s.t-Te;
 let W=0,ta=0,tmin=Infinity,tmax=-Infinity,pts=[],imx=0;
 for(let k=1;k<ri.t.length;k++){if(ri.t[k-1]<t1)continue;W+=(ri.y[k]+ri.y[k-1])/2*(rp.y[k]-rp.y[k-1]);const dt=rt.t[k]-rt.t[k-1];ta+=dt*(rt.y[k]+rt.y[k-1])/2;tmin=Math.min(tmin,rt.y[k]);tmax=Math.max(tmax,rt.y[k]);pts.push([ri.y[k],rp.y[k]]);imx=Math.max(imx,ri.y[k]);}
 ta/=Te;const tl=N*Nr*W/(2*Math.PI);
 // ψ–i plane: magnetization curves at 0°, 90°, 180° and the loop of phase 1 over the last electrical period
 const Wd=440,Hd=220,Im=Math.max(1.25*imx,5),Pm=1.08*P.srmPsi(g,Math.PI,Im),X=i=>40+(Wd-50)*i/Im,Y=v=>Hd-24-(Hd-32)*v/Pm;
 const curve=th=>'M'+[...Array(61).keys()].map(k=>{const i=Im*k/60;return X(i).toFixed(1)+','+Y(P.srmPsi(g,th,i)).toFixed(1);}).join(' L');
 const step=Math.max(1,Math.floor(pts.length/600)),loop='M'+pts.filter((_,k)=>k%step===0).map(([i,v])=>X(i).toFixed(1)+','+Y(v).toFixed(1)).join(' L')+' Z';
 h+=`<svg class="bfchart" viewBox="0 0 ${Wd} ${Hd}" role="img" aria-label="Καμπύλες μαγνήτισης και βρόχος ψ–i της φάσης 1">${PlotCore.svgFrame({W:Wd,H:Hd,ml:40,mr:10,mt:8,mb:24,x:[0,Im],y:[0,Pm],xPlain:true,yPlain:true}).svg}
  ${[[0,'0° (μη ευθυγρ.)'],[Math.PI/2,'90°'],[Math.PI,'180° (ευθυγρ.)']].map(([th,l])=>`<path d="${curve(th)}" fill="none" stroke="#8a9a94" stroke-width="1"/><text x="${X(Im)-4}" y="${Y(P.srmPsi(g,th,Im))-4}" text-anchor="end">${l}</text>`).join('')}
  <path d="${loop}" fill="#0f766e" fill-opacity=".18" stroke="#0f766e" stroke-width="1.4"/>
  <text x="${(Wd+40)/2}" y="${Hd-1}" text-anchor="middle">i₁ (A)</text><text x="10" y="${Hd/2}" transform="rotate(-90 10 ${Hd/2})" text-anchor="middle">ψ₁ (V·s)</text></svg>`;
 h+=cmpRows([['μέση ροπή: από τον βρόχο N·N_r·W/(2π) ↔ μέση τ_e',tl,ta,'N·m'],['μέση ροπή: τ_L + b·ω ↔ μέση τ_e',m.TL+b*w,ta,'N·m'],['ταχύτητα ω',m.wref,w,'rad/s']]);
 return h+`<p class="small">Ενέργεια ανά παλμό W = ∮ i dψ = <b>${eng(W,'J',4)}</b> (περίοδος ${eng(Te,'s',3)}). Κυμάτωση ροπής ${eng(tmin,'N·m',3)} … ${eng(tmax,'N·m',3)}. i_ref = ${eng(iref,'A',3)}: με ιδανικό σταθερό ρεύμα από 0° ως 180° θα έδινε ${eng(tb,'N·m',3)}.</p>
  <p class="small muted">Ο βρόχος είναι η φάση 1 στην τελευταία ηλεκτρική περίοδο. Ξεκινά κοντά στην καμπύλη της μη ευθυγραμμισμένης θέσης όσο η φάση άγει με +V_dc, το ρεύμα κρατιέται στη ζώνη υστέρησης καθώς η L μεγαλώνει, και μετά το θ_off η ροή πέφτει με −V_dc. Οι τιμές της μηχανής είναι τυπικές.</p>`+evalOrderHTML();}
// 3.5: lightning current. From the waveform: peak, T1 = 1.25·(t90 − t10), T2 (virtual origin → 50 %), charge ∫i dt, specific energy ∫i² dt,
// steepest front di/dt and the peak of v = R·i + L·di/dt; from the simulation: the same on the recorded points and the per-period statistics
function lgTheory(){const s=S.sim,m=S.tutMeta||{},c=s?.net.compInfo.get('I1'),w=c?.wave,Rp=paramsOf('R1'),Lp=paramsOf('L1');if(!s||!w||!Rp||!Lp)return '';
 const R=+Rp.R,L=+Lp.L,me=P.waveMeasure(w),pk=Math.abs(w.I0),N=40000,t1=(m.dur||5*w.tau2)-w.t0;let Q=0,W=0,dmax=0,vmax=0,tp=0,y0=0;
 for(let k=1;k<=N;k++){const tt=w.t0+t1*Math.pow(k/N,3),ta=w.t0+t1*Math.pow((k-1)/N,3),y=P.waveAt(w,tt),h=tt-ta,d=(y-y0)/h;Q+=h*(y+y0)/2;W+=h*(y*y+y*y0+y0*y0)/3;
  if(Math.abs(d)>Math.abs(dmax))dmax=d;const v=R*(y+y0)/2+L*d;if(Math.abs(v)>Math.abs(vmax)){vmax=v;tp=tt;}y0=y;}
 let h=`<div class="tm"><span class="badge">${w.kind==='dexp'?'διπλοεκθετικό':'Heidler'}</span> I₀ = ${eng(w.I0,'A')} · τ₁ = ${eng(w.tau1,'s',4)}, τ₂ = ${eng(w.tau2,'s',4)}, η = ${fmt(w.eta,4)}${w.kind==='dexp'?'':', n = '+w.n}</div><ul class="eqs">
  <li>${w.kind==='dexp'?'i(t) = (I₀/η)·(e^(−t/τ₂) − e^(−t/τ₁))':'i(t) = (I₀/η)·(t/τ₁)ⁿ/(1 + (t/τ₁)ⁿ)·e^(−t/τ₂)'}, με η τέτοιο ώστε το μέγιστο να είναι I₀${m.shape==='custom'?'. Τα τ₁, τ₂ βρέθηκαν με Newton ώστε T1 = '+eng(w.T1,'s')+' και T2 = '+eng(w.T2,'s'):'. Τα τ₁, τ₂, η είναι του IEC 62305-1, Παράρτημα Β'}</li>
  <li>Χρόνος μετώπου T1 = 1,25·(t₉₀ − t₁₀) = <b>${eng(me.T1,'s',4)}</b>, χρόνος ημίσεος T2 = <b>${eng(me.T2,'s',4)}</b> (από την εικονική αρχή t₁₀ − 0,1·T1 ως το 50 % στην ουρά)</li>
  <li>Ως t = ${eng(t1+w.t0,'s')}: φορτίο Q = ∫i dt = <b>${eng(Q,'C',4)}</b>, ειδική ενέργεια W/R = ∫i² dt = <b>${eng(W,'J/Ω',4)}</b>${m.shape==='10/350'?' (IEC 62305-1, LPL I: 100 C και 10 MJ/Ω)':''}</li>
  <li>Μέγιστη κλίση di/dt = <b>${eng(dmax,'A/s',3)}</b>. Τάση v = R·i + L·di/dt με R = ${eng(R,'Ω')}, L = ${eng(L,'H')}: μέγιστη <b>${eng(vmax,'V',4)}</b> στο ${eng(tp,'s',3)}, ενώ μόνο το R·I₀ = ${eng(R*pk,'V')}</li></ul>`;
 if(s.t<m.dur*.98)return h+'<p class="muted small">Τρέξε ως το τέλος για τη σύγκριση.</p>';
 const raw=rawSeries('I:I1'),rv=rawSeries('V:I1');if(!raw||!rv)return h;const ts=raw.t,ys=raw.y;let yp=0,ip=0;for(let k=0;k<ys.length;k++)if(Math.abs(ys[k])>Math.abs(yp)){yp=ys[k];ip=k;}
 const cr=(lev,rise)=>{for(let k=1;k<ys.length;k++){const a=Math.abs(ys[k-1]),b=Math.abs(ys[k]),L0=lev*Math.abs(yp);if(rise?(k<=ip&&a<L0&&b>=L0):(k>ip&&a>L0&&b<=L0))return ts[k-1]+(L0-a)/(b-a)*(ts[k]-ts[k-1]);}return NaN;};
 const t10=cr(.1,true),t90=cr(.9,true),t50=cr(.5,false),T1=1.25*(t90-t10),T2=t50-(t10-.1*T1);
 const p=s.per,iI=s.chIndex.get('I:I1');let sq=0,sw=0;for(let k=0;k<p.n;k++){const j=(p.head-p.n+k+p.cap)%p.cap;sq+=p.avg[j*p.nch+iI]*s.T;sw+=p.rms[j*p.nch+iI]**2*s.T;}
 let vm=0;for(const v of rv.y)if(Math.abs(v)>Math.abs(vm))vm=v;
 h+=cmpRows([['μέγιστο ρεύμα',w.I0,yp,'A'],['T1',me.T1,T1,'s'],['T2',me.T2,T2,'s'],['φορτίο Q',Q,sq,'C'],['W/R',W,sw,'J/Ω'],['μέγιστη τάση',vmax,vm,'V']]);
 return h+`<p class="small muted">Από τα σημεία της προσομοίωσης (βήμα ${eng(s.h,'s')}). Q και W/R από τις στατιστικές ανά περίοδο (T = T1 της κυματομορφής), όσο το ιστορικό τις χωράει.</p>`;}
// 3.2: period doubling of the current-mode boost with an R–C load (Deane & Hamill): period from the samples at the clock
function chaosTheory(){const s=S.sim,m=S.tutMeta||{};if(!s||!m.fs||!editor.comp('IC'))return '';const x=perSamples('Y:AM1','end',200),q=Metrics.periodicity(x.slice(-100));
 if(x.length<20)return '<p class="muted small">Τρέξε την προσομοίωση μερικές δεκάδες περιόδους για να φανεί η περίοδος της λειτουργίας.</p>';
 const Vin=+paramsOf('V1').V,L=+paramsOf('L1').L,C=+paramsOf('C1').C,R=+paramsOf('R1').R,T=m.T,vo=avgOver('V:C1',20)?.avg,d=avgOver('Y:SR1',20)?.avg,m1=Vin/L,m2=Number.isFinite(vo)?(vo-Vin)/L:NaN;
 let h=`<div class="tm"><span class="badge ${q.period===1?'ccm':'dcm'}">${esc(periodText(q))}</span> i_c = ${eng(s.now('Y:IC'),'A')}</div><ul class="eqs">
  <li>Peak current-mode χωρίς ράμπα: το δείγμα του ρεύματος στο ρολόι (η κοιλάδα) ${q.period===1?'είναι ίδιο σε κάθε περίοδο':q.period>1?`επαναλαμβάνεται κάθε ${q.period} περιόδους: ${q.distinct.map(v=>eng(v,'A',4)).join(', ')}`:'δεν επαναλαμβάνεται: χαοτική λειτουργία (ή πολύ αργό μεταβατικό)'}</li>
  <li>Μέση τάση εξόδου ${eng(vo,'V')}, μέσος λόγος κατάτμησης ${fmt(d,3)}. Κλίσεις m₁ = V_in/L = <b>${eng(m1,'A/s')}</b>, m₂ = (V_o − V_in)/L = <b>${eng(m2,'A/s')}</b></li>
  <li>Αν η τάση εξόδου ήταν σταθερή, ο χάρτης θα ήταν μονοδιάστατος με λ = −m₂/m₁ = <b>${fmt(-m2/m1,3)}</b>, ασταθής για D > 0,5. Εδώ RC = ${eng(R*C,'s')} = ${fmt(R*C/T,3)}·T: η τάση αλλάζει αισθητά μέσα σε λίγες περιόδους, ο χάρτης είναι δισδιάστατος (i_L, v_o) και ο πρώτος διπλασιασμός έρχεται νωρίτερα, γύρω στο D ≈ 0,4</li>
  <li>Με τις τιμές του tutorial, καθώς μεγαλώνει το i_c: 1T → 2T (περίπου 1,65 A) → 4T (2,37 A) → 8T (2,62 A) → χάος (2,70 A). Τα διαστήματα μικραίνουν, όπως στη διαδοχή του Feigenbaum. Επειδή ο χάρτης είναι κατά τμήματα ομαλός, ο λόγος των διαστημάτων δεν είναι ακριβώς 4,67</li></ul>`;
 h+=`<p class="small muted">Το διάγραμμα διακλάδωσης βγαίνει από το «Διακλαδώσεις και Poincaré» πλάι στο scope (σάρωση του i_c). Οι τιμές είναι του γνωστού παραδείγματος των Deane & Hamill (V_in = 10 V, L = 1 mH, C = 12 μF, R = 20 Ω, T = 100 μs).</p>`;
 return h+evalOrderHTML();}
// 3.1: DC machine drive. Ideal loops (exact feedforward, no delay): i/i_ref = α_c/(s + α_c); with active damping a load
// step gives ω = −(τ_L/J)·t·e^(−α_s t), with IMC ω = −τ_L/((Js + b)(s + α_s)), which recovers with J/b
// 4.7: control with neural networks (nn_compare, nn_online): the model, the learning rule, IAE per cycle of the reference,
// and for the comparison the three controllers run in the background (pool of workers) with the same options
const NNC={res:null,key:'',busy:false};
function nnCycles(m){const s=S.sim;if(!s)return [];const ps=lastPeriods('Y:IAE',20000);const at=tt=>{let best=null;for(const q of ps)if(q.t<=tt+1e-9)best=q;else break;return best?best.max:null;};
 const out=[];let prev=0;for(let k=1;k<=m.cycles;k++){const tk=k*m.P;if(s.t<tk-1e-6)break;const v=at(tk);if(v===null)break;out.push(v-prev);prev=v;}return out;}
// 4.8.1: a generator with its controls on an infinite bus: the models and the state now against the load flow
function genCtlTheory(){const s=S.sim,m=S.tutMeta||{};if(!s||!m.smib||!editor.comp('SG1'))return '';const now=k=>s.now(k),q=m.smib,av=!!editor.comp('AV1'),ps=!!editor.comp('PS1'),gv=editor.comp('GV1');
 const ty=av?(editor.comp('AV1').params.type==='dc1a'?'DC1A':'ST1A'):'σταθερή E_fd';
 return `<div class="tm"><span class="badge">${esc(ty)}${ps?' + PSS':''}${gv?' · '+(gv.params.type==='hydro'?'υδροστρόβιλος':'ατμοστρόβιλος'):''}</span> X_T = ${fmt(q.XT,3)}, γραμμές ${fmt(q.X1,3)} ∥ ${fmt(q.X2,3)} pu, E_B = ${fmt(q.EB,5)} pu</div><ul class="eqs">
  <li>Ροή φορτίου: P = ${fmt(q.P,3)}, Q = ${fmt(q.Q,3)} pu στη |V| = 1· η γεννήτρια δίνει E_fd0 = <b>${fmt(now('Y:SG1:e0'),5)}</b>${gv?`, T_m0 = <b>${fmt(now('Y:SG1:m0'),5)}</b>`:''} και οι ελεγκτές δουλεύουν γύρω από αυτά (ξεκινούν στην ισορροπία).</li>
  ${av?(ty==='ST1A'?`<li>ST1A (Kundur Σχ. 8.43): V_c = V_t/(1+sT_R), E_fd = E_fd0 + K_A·(ΔV_ref − ΔV_c + v_s)·(1+sT_C)/(1+sT_B), μέσα στα E_t·V_RMIN … E_t·V_RMAX − K_C·I_fd και με το όριο ρεύματος K_LR·(I_fd − I_LR).</li>`
   :`<li>DC1A (Kundur Σχ. 8.40): V_R = K_A/(1+sT_A)·(ΔV_ref − ΔV_c − V_F) μέσα στα V_RMIN … V_RMAX, T_E·dE_fd/dt = V_R − (K_E + S_E(E_fd))·E_fd, S_E = A_EX·e^(B_EX·E_fd), ανάδραση ρυθμού V_F = s·K_F/(1+sT_F)·E_fd.</li>`):''}
  ${ps?`<li>PSS: v_s = K_STAB·sT_W/(1+sT_W)·(1+sT_1)/(1+sT_2)·Δω, περιορισμένο ±0,1: προσθέτει ροπή απόσβεσης σε φάση με το Δω.</li>`:''}
  ${gv?(gv.params.type==='hydro'?`<li>Υδροστρόβιλος (Σχ. 9.7, 9.10): dU/dt = (1 − (U/G)²)/T_W, P_m = (U − U_NL)·(U/G)², G = A_t·g· ρυθμιστής με μόνιμη στατικότητα R_P και μεταβατική R_T·sT_R/(1+sT_R).</li>`
   :`<li>Ατμοστρόβιλος (Σχ. 9.21, 9.31): εντολή −Δω/R + ΔP_ref, ρελέ ταχύτητας, σερβοκινητήρας με όρια ρυθμού και θέσης· P_m = F_HP·P_CH + F_IP·P_RH + F_LP·P_CO με T_CH, T_RH, T_CO.</li>`):''}
 </ul><table class="tbl"><tr><th>Μέγεθος</th><th>Τώρα</th></tr><tr><td>δ (°)</td><td>${fmt(now('Y:SG1:d'),5)}</td></tr><tr><td>|V| (pu)</td><td>${fmt(now('Y:SG1:vt'),5)}</td></tr>
  <tr><td>P · Q (pu)</td><td>${fmt(now('Y:SG1:pe'),4)} · ${fmt(now('Y:SG1:qe'),4)}</td></tr><tr><td>ω (pu)</td><td>${fmt(now('Y:SG1'),6)}</td></tr>
  ${av?`<tr><td>E_fd (pu)</td><td>${fmt(now('Y:AV1/EFD'),5)}</td></tr>`:''}${gv?`<tr><td>P_m (pu) · ${gv.params.type==='hydro'?'g':'CV'}</td><td>${fmt(now('Y:GV1/PM'),5)} · ${fmt(now('Y:GV1/G'),4)}</td></tr>`:''}</table>`;}
// 4.8: the electric vehicle: the models of the vehicle, the battery and the controller, and the energy metrics so far
function evTheory(){const s=S.sim,m=S.tutMeta||{};if(!s||!m.ev||!editor.comp('M1'))return '';const now=k=>s.now(k),n=(k,u,d=3)=>eng(now(k),u,d);
 const mo=editor.comp('MO1'),sc=mo?.params?.scheme||'moevc',cyc=Math.floor(s.t/m.D),wait=s.t<m.D?`<p class="small muted">Άφησε να τρέξει τουλάχιστον ένας κύκλος (${eng(m.D,'s')}) για τις μετρικές.</p>`:'';
 const kind=!mo?(editor.comp('C1')?'Ελεγκτής AI: ένας βρόχος τάσης (PI ή PI + νευρωνικό)':'—'):sc==='moev'?'Πολυκριτηριακός καταρράκτης (moev)':'Πολυκριτηριακός συζευγμένος (moevc)';
 return `<div class="tm"><span class="badge">${esc(kind)}</span>${mo?` τρόπος ${esc(mo.params.mode||'balanced')}`:''} · κύκλος ${cyc+1} (${eng(m.D,'s')} ο καθένας)</div><ul class="eqs">
  <li>Όχημα στον άξονα: J_eq = J_m + m·(r_w/n)² = <b>${eng(+(paramsOf('M1')?.J??m.Jeq),'kg·m²')}</b>, v = ω·r_w/n· τ_L = [m·g·C_rr·sgn v + ½·ρ·C_d·A·v·|v| + m·g·sin(atan(κλίση))]·r_w/(n·η) + τ_b + τ_a(x)</li>
  <li>Μπαταρία: OCV = 45 + 13,8·SOC − 1,8·(1 − SOC)³ V, R_int = 0,075·(1 + 2,6·(1 − SOC)²) Ω, p = v_a·i_a/η (κίνηση) ή ·η (ανάκτηση), i_bat = (OCV − √(OCV² − 4·R_int·p))/(2·R_int), dSOC/dt = −i_bat/(3600·Q)</li>
  <li>Μετατροπέας: |v_a| ≤ min(V_max, 1,75·OCV, P_max/|i_a|) με P_max = η·min(OCV·I_max − R_int·I_max², OCV²/(4R_int)): η μπαταρία δεν δίνει πάνω από I_max</li>
  ${mo?sc==='moev'?`<li>moev: τ_req = w_s·PI(ω* − ω) + τ_L + B·ω, τ* = clip(keep·τ_req, ±τ_max(SOC, P)), keep = 0,55 + 0,45·w_t − 0,2·w_e·(χαμηλό SOC)</li>`
   :`<li>moevc: ω_gov = ω + min(ω* − ω, α_max·H) (ο ρυθμιστής αναφοράς από τα όρια ροπής, ισχύος και SOC), α = PI(ω_gov − ω) + ω̇*_f, τ_req = τ_L + B·ω + J·α, τ* = clip(ρυθμός(keep·τ_req), τ_n, τ_p)</li>`:''}
  ${mo?`<li>Βρόχος ρεύματος: i* = τ*/K_t, u = K_e·ω + R·i* + K_p·(i* − i)· τώρα τ* = <b>${n('Y:MO1/TQ','N·m')}</b>, keep = <b>${fmt(now('Y:MO1/KP'),3)}</b></li>`:''}
 </ul>${wait}<table class="tbl"><tr><th>Μετρική (από την αρχή)</th><th>Τιμή</th></tr>
  <tr><td>Απόσταση</td><td>${n('Y:X','m')}</td></tr><tr><td>Ενέργεια από την μπαταρία E = ∫v_bat·i_bat</td><td>${eng(now('Y:EN')/3600,'Wh',3)}</td></tr>
  <tr><td>km/kWh · Wh/km</td><td>${fmt(now('Y:KWH'),3)} · ${fmt(now('Y:WHK'),3)}</td></tr><tr><td>N·m/kW (∫|τ_e| / ∫P_bat)</td><td>${fmt(now('Y:NMK'),3)}</td></tr>
  <tr><td>I_rms τυμπάνου</td><td>${n('Y:IRMS','A')}</td></tr><tr><td>SOC · πτώση</td><td>${fmt(100*now('Y:SOC'),4)} % · ${fmt(now('Y:DSOC'),3)} μον. %</td></tr></table>`;}
function nnTheory(t){const s=S.sim,m=S.tutMeta||{};if(!s||!m.P||!editor.comp('M1'))return '';const nn=editor.comp('NN1'),p=nn?{...P.defaults('NN'),...nn.params}:null;
 const b=nnBlock('NN1'),st=b?.st,learn=p&&(p.train==='err'||p.train==='tgt'),cyc=nnCycles(m);
 const emu=!!editor.comp('NNE'),se=emu?nnBlock('NNE')?.st:null;
 const kind=!nn?'μόνο PI':emu?'PI + αντίστροφο που μαθαίνει μέσω εξομοιωτή':learn?'PI + νευρωνικό που μαθαίνει online':'PI + αντίστροφο μοντέλο (σταθερά βάρη)';
 let h=`<div class="tm"><span class="badge">${esc(kind)}</span>${nn?` δίκτυο ${(st?.net?.sizes||[2,8,1]).join(' – ')}`:''}${learn&&st?` · ${Parts.fmtNum(st.opt?.k||0)} ενημερώσεις · L = ${eng(st.L,'V',3)}`:''}</div><ul class="eqs">
  <li>Μηχανή: u = R_a·i + L_a·di/dt + ψ·ω, &nbsp;J·dω/dt = ψ·i − b·ω − τ_L, &nbsp;τ_L = k·ω·|ω| (ανεμιστήρας, k = ${eng(m.kf,'N·m·s²')})</li>
  <li>Η τάση που χρειάζεται για να ακολουθήσει ω_r με επιτάχυνση α_r (το «αντίστροφο μοντέλο»): u* = ψ·ω_r + (R_a/ψ)·(J·α_r + b·ω_r + k·ω_r·|ω_r|) + L_a·di/dt. Μη γραμμική στο ω_r, γραμμική στο α_r· ο PI μόνος του τη βρίσκει μόνο με σφάλμα</li>
  ${emu?`<li>Εξομοιωτής (NNE): μαθαίνει τη μηχανή από τις μετρήσεις, α̂ = f(u[k−1], ω[k−1]) με στόχο α = (ω − ω[k−1])/T_s${se?` (L = ${eng(se.L,'rad/s²',3)})`:''}. Το αντίγραφό του (NNC, ίδια βάρη) υπολογίζει στην έξοδο του ελεγκτή, α̂_c = f(u_NN, ω_r), με την ευαισθησία ∂α̂_c/∂u</li>
  <li>Ελεγκτής (NN1): μαθαίνει να κάνει το μοντέλο να δίνει α_r: σφάλμα e_c = K·(α_r − α̂_c)·∂α̂_c/∂u (specialized inverse learning). Το μοντέλο μαθαίνει από ό,τι έκανε η μηχανή (ανοιχτός βρόχος), άρα ο PI που δρα παράλληλα δεν το παραπλανά· με το σφάλμα της μηχανής στη θέση του α̂_c ο ελεγκτής θα έπεφτε στον κορεσμό</li>`:learn?`<li>Feedback-error learning: u = u_PI + u_NN(ω_r, α_r). Σε κάθε δείγμα (1 kHz) τα βάρη αλλάζουν κατά Δw = η·(u_PI/${fmt(+p.ys,3)})·∂u_NN/∂w (${p.opt==='adam'?'Adam':'κλίση'}, η = ${fmt(+p.lr,3)}): ό,τι πρέπει ακόμη να δώσει ο PI είναι το σφάλμα του δικτύου, και όσο το δίκτυο μαθαίνει, ο PI δίνει λιγότερα. Δεν μαθαίνει όσο η έξοδος είναι στο όριο (όπως το anti-windup)</li>`:''}
  ${nn&&!learn?`<li>Αντίστροφο μοντέλο: το δίκτυο έμαθε offline u από (ω, α) σε προσομοίωση με διέγερση (tools/nn_weights.py, RMS σφάλμα ≈ 1 V)· εδώ παίρνει τα (ω_r, α_r) της αναφοράς. Ό,τι δεν ξέρει (άλλο φορτίο, τιμές εκτός της περιοχής εκπαίδευσης) το διορθώνει ο PI</li>`:''}
  <li>Όρια: ο ελεγκτής είναι PI + πρόσθια τροφοδότηση, άρα η ευστάθεια είναι του PI· το δίκτυο αλλάζει μόνο την είσοδο που ο PI δεν χρειάζεται να βρει. Έξω από την περιοχή που είδε (ω > 160 rad/s, άλλη μηχανή) το δίκτυο προεκτείνει χωρίς εγγύηση, και ο κορεσμός ±${m.Vmax} V περιορίζει ό,τι κι αν ζητήσει</li></ul>`;
 if(!cyc.length)h+='<p class="small muted">Τρέξε την προσομοίωση: εδώ εμφανίζεται το IAE κάθε κύκλου της αναφοράς (1,6 s).</p>';
 else h+=`<table class="cmp"><thead><tr><th>Κύκλος</th>${cyc.map((_,k)=>`<th>${k+1}</th>`).join('')}</tr></thead><tbody><tr><td>IAE (rad)</td>${cyc.map(v=>`<td>${fmt(v,3)}</td>`).join('')}</tr></tbody></table><p class="small muted">IAE = ∫|ω_r − ω|dt ανά κύκλο· σύνολο ${fmt(s.now('Y:IAE'),4)} rad, ISE = ${fmt(s.now('Y:ISE'),4)} rad²/s.</p>`;
 if(t.id==='nn_compare'){const key=JSON.stringify(S.tut?.options||{}),r=NNC.key===key?NNC.res:null;
  h+=`<h4>Σύγκριση των ελεγκτών</h4>${r?`<table class="cmp"><thead><tr><th>Ελεγκτής</th>${(r[0].per||[]).map((_,k)=>`<th>IAE ${k+1}</th>`).join('')}<th>IAE</th><th>ISE</th></tr></thead><tbody>${r.map(q=>`<tr><td>${esc(q.name)}</td>${(q.per||[]).map(v=>`<td>${fmt(v,3)}</td>`).join('')}<td>${fmt(q.iae,4)}</td><td>${fmt(q.ise,4)}</td></tr>`).join('')}</tbody></table>`:''}
   <button class="primary-ghost" data-nncmp ${NNC.busy?'disabled':''}>${NNC.busy?'Τρέχει στο παρασκήνιο…':r?'Ξανά':'Σύγκρινε και τους τέσσερις'}</button> <small class="muted">Τρέχει μόνο PI, PI + online, αντίστροφο μοντέλο και αντίστροφο μέσω εξομοιωτή με το ίδιο φορτίο, σε ξεχωριστά threads.</small>`;}
 return h;}
function nnGuiCode(){return `<h4>Το ίδιο από κώδικα (pcl.designer)</h4><pre class="code small">import pcl, pcl.designer as D
ms = {m['type']: m for m in D.machines()}            # ή D.machines(pcl.link.connect()): από την ανοιχτή εφαρμογή
out = D.design(ms['IM'], {'iae': 1, 'overshoot': .5}, controller='auto', cycles=3)
for r in out['results']:
    print(r['label'], round(r['J'], 3), r['metrics'])
pcl.link.connect().load(out['best']['project'])     # στην εφαρμογή («Αποδοχή»)</pre><p class="small muted">Κανόνες σύνθεσης ανά είδος μηχανής: ΣΡ (πηγή τάσης από σήμα), επαγωγής (αντιστροφέας, FOC), σύγχρονη (dq, MTPA), SRM (ασύμμετρος μετατροπέας). Οι γεννήτριες στην 4.8.</p>`;}
async function runNNCompare(){const t=tutorial();if(NNC.busy||t.id!=='nn_compare')return;const o={...S.tut.options},key=JSON.stringify(o);NNC.busy=true;renderTheory();
 const vars=[['pi','Μόνο PI'],['pinn','PI + online'],['inv','PI + αντίστροφο'],['emu','PI + μέσω εξομοιωτή']];const pool=NNC.pool||(NNC.pool=new Pool.SimPool(4));
 try{const qs=vars.map(([c])=>{const pr=t.build({...o,ctrl:c}),m=pr.meta;const meas=[{key:'Y:IAE',stat:'end'},{key:'Y:ISE',stat:'end'},...Array.from({length:m.cycles},(_,k)=>({key:'Y:IAE',stat:'at',at:(k+1)*m.P,name:'c'+(k+1)}))];
   return {action:'run',project:pr,t_end:pr.sim.stopT,hdiv:pr.sim.hDiv,channels:['Y:IAE','Y:ISE'],measure:meas,waveforms:false,check:false};});
  const outs=await pool.map(qs);NNC.res=outs.map((r,i)=>{const M=r.measure,n=Object.keys(M).filter(k=>/^c\d+$/.test(k)).length,c=Array.from({length:n},(_,k)=>M['c'+(k+1)]);return {name:vars[i][1],iae:M['Y:IAE:end'],ise:M['Y:ISE:end'],per:c.map((v,k)=>v-(k?c[k-1]:0))};});NNC.key=key;}
 catch(e){notice('Σύγκριση: '+esc(e.message),'error');}finally{NNC.busy=false;renderTheory();runMath();}}
// the card is drawn in the theory and, for formula tutorials, in the mathematics card too: one listener for both
document.addEventListener('click',e=>{if(e.target.closest?.('[data-nncmp]'))runNNCompare();});
function dcDriveTheory(){const s=S.sim,m=S.tutMeta||{};if(!s||!m.fs||!editor.comp('M1'))return '';const M=paramsOf('M1'),Ra=+M.Ra,La=+M.La,psi=+M.psi,J=+M.J,b=+M.bm,Vdc=+paramsOf('V1').V,T=1/m.fs;
 const per=k=>lastPeriods(k,20000).map(q=>({...q,tm:q.t-T/2}));const wNow=s.now('Y:M1'),iA=avgOver('Y:AM1',5)?.avg,dA=avgOver('D:PWM1',5)?.avg,tl=m.mode==='current'?0:(s.t>m.tTL?m.TL:0);
 const cross=(ps,t0,y0,y1)=>{const f=v=>(v-y0)/(y1-y0);let a=NaN,c=NaN;for(let k=1;k<ps.length;k++){const p0=ps[k-1],p1=ps[k];if(p1.tm<t0)continue;const g0=f(p0.avg),g1=f(p1.avg),at=x=>p0.tm+(x-g0)/(g1-g0)*(p1.tm-p0.tm);if(isNaN(a)&&g0<.1&&g1>=.1)a=at(.1);if(isNaN(c)&&g0<.9&&g1>=.9){c=at(.9);break;}}return c-a;};
 const wait=s.t<20*T?'<p class="small muted">Τρέξε την προσομοίωση για τη σύγκριση με τη θεωρία.</p>':'';
 const machine=`<li>Μηχανή: u_a = R_a·i_a + L_a·di_a/dt + ψ·ω, &nbsp;J·dω/dt = ψ·i_a − b·ω − τ_L. Στο κύκλωμα το μηχανικό μέρος είναι ισοδύναμο κύκλωμα: η τάση του κόμβου είναι το ω, ο πυκνωτής είναι το J, η αγωγιμότητα το b, η πηγή ρεύματος το τ_L, και ένας γυρατής ψ συνδέει τύμπανο και άξονα</li>`;
 let h=`<div class="tm"><span class="badge">${m.mode==='open'?'ανοιχτός βρόχος':m.mode==='current'?'βρόχος ρεύματος':'ταχύτητα σε σειρά με ρεύμα'}</span>${m.mode==='open'?'':m.act?' ενεργή αντίσταση και ενεργή απόσβεση':' IMC χωρίς ενεργούς όρους'}</div><ul class="eqs">`+machine;
 if(m.mode==='open'){const D=+paramsOf('PWM1').D,U=D*Vdc,sg=Ra/(2*La),wn=psi/Math.sqrt(La*J),wd=Math.sqrt(Math.max(wn*wn-sg*sg,0)),z=sg/wn,tp=Math.atan2(wd,sg)/wd,ip=U/(La*wd)*Math.exp(-sg*tp)*Math.sin(wd*tp);
  const w0=(U*psi-Ra*0)/(psi*psi+Ra*b),w1=(U*psi-Ra*m.TL)/(psi*psi+Ra*b),ps=per('Y:AM1'),ipk=ps.length?Math.max(...ps.map(q=>q.avg)):NaN,i1=(b*w1+m.TL)/psi;
  h+=`<li>Με σταθερή τάση U = D·V_dc = <b>${eng(U,'V')}</b> από την ηρεμία: i_a/U = (1/L_a)·s/(s² + (R_a/L_a)s + ψ²/(L_a J)), ω_n = ψ/√(L_a J) = <b>${eng(wn,'rad/s')}</b>, ζ = <b>${fmt(z,3)}</b>${z<1?' (υποαποσβεννύμενο: ταλάντωση ω και i)':''}</li>
   <li>Ρεύμα εκκίνησης: i(t) = U/(L_a ω_d)·e^(−σt)·sin(ω_d t), μέγιστο στο t = <b>${eng(tp,'s')}</b>: <b>${eng(ip,'A')}</b>, ${fmt(ip/i1,3)} φορές το ρεύμα με το φορτίο. Γι' αυτό χρειάζεται βρόχος ρεύματος (ή ράμπα τάσης)</li>
   <li>Μόνιμη κατάσταση: ω = (U·ψ − R_a·τ_L)/(ψ² + R_a·b): χωρίς φορτίο <b>${eng(w0,'rad/s')}</b>, με τ_L = ${eng(m.TL,'N·m')} <b>${eng(w1,'rad/s')}</b>. Η ταχύτητα πέφτει με το φορτίο, γιατί δεν υπάρχει βρόχος ταχύτητας</li></ul>`;
  if(wait)return h+wait;h+=cmpRows([['μέγιστο ⟨i_a⟩ στην εκκίνηση',ip,ipk,'A'],['ω στο τέλος',s.t>m.tTL?w1:w0,wNow,'rad/s'],['⟨i_a⟩ (τελευταίες 5 T)',s.t>m.tTL?i1:b*w0/psi,iA,'A']]);
  return h+`<p class="small muted">Η μικρή διαφορά στην ταχύτητα είναι η αντίσταση R_on των διακοπτών, που προστίθεται στην R_a.</p>`;}
 const tr=Math.log(9)/m.ac;
 h+=`<li>Βρόχος ρεύματος: u* = PI(i_ref − i_a) + Ê − R_a,ενεργ·i_a, με Ê = ψ̂·ω (πρόσθια τροφοδότηση). Εύρος ζώνης α_c = 2π·200 Hz = <b>${eng(m.ac,'rad/s')}</b>: K_p = α_c·L_a = <b>${eng(m.kpc)}</b>, ${m.act?`R_a,ενεργ = α_c·L_a − R_a = <b>${eng(m.Rac,'Ω')}</b>, K_i = α_c²·L_a = <b>${eng(m.kic)}</b>`:`K_i = α_c·R_a = <b>${eng(m.kic)}</b> (το μηδενικό του PI ακυρώνει τον πόλο R_a/L_a)`}</li>
  <li>Ιδανικά i_a/i_ref = α_c/(s + α_c): χρόνος ανόδου 10–90 % ln9/α_c = <b>${eng(tr,'s')}</b>. ${m.act?'Με την ενεργή αντίσταση ένα σφάλμα στο Ê σβήνει κι αυτό με α_c':`Χωρίς ενεργή αντίσταση ένα σφάλμα στο Ê σβήνει με R_a/L_a = ${eng(Ra/La,'rad/s')}, δηλαδή ${fmt(m.ac/(Ra/La),3)} φορές πιο αργά`}. Η καθυστέρηση δειγματοληψίας και PWM (περίπου 1,5·T) δίνει μικρή υπερύψωση</li>
  <li>Η ημιγέφυρα δίνει u ∈ [0, V_dc]: το ρεύμα αλλάζει φορά (πέδηση) αλλά η τάση όχι. Με u = 0 το ρεύμα πέφτει με di/dt = −(R_a·i + ψ·ω)/L_a. Ο κορεσμός είναι στο μπλοκ 0 … V_dc, άρα ο PI χρειάζεται back-calculation: tr = u_sat − u*, dx_i/dt = K_i·(e + tr/K_p)</li>`;
 if(m.mode==='current'){const ps=per('Y:AM1'),r=cross(ps,.005,0,10),ir=s.now('Y:KI'),Dth=(Ra*ir+psi*wNow)/Vdc;
  h+=`<li>Στη μόνιμη κατάσταση ⟨i_a⟩ = i_ref και D = (R_a·i_a + ψ·ω)/V_dc. Η ταχύτητα αυξάνει με dω/dt = (ψ·i_a − b·ω)/J = <b>${eng((psi*10)/J,'rad/s²')}</b> για i_a = 10 A</li></ul>`;
  if(wait)return h+wait;h+=cmpRows([['χρόνος ανόδου 10–90 % (βήμα 0 → 10 A)',tr,r,'s'],['⟨i_a⟩ (τελευταίες 5 T)',ir,iA,'A'],['D',Dth,dA,'']]);return h+evalOrderHTML();}
 const ta=J*m.wref/(psi*m.Imax),dt=s.t-m.tTL,aw=m.as,bJ=b/J;
 const dw=dt>0?(m.act?m.TL/J*dt*Math.exp(-aw*dt):m.TL/J*(Math.exp(-bJ*dt)-Math.exp(-aw*dt))/(aw-bJ)):0,wth=s.t>m.tw+ta+6/aw?m.wref-dw:NaN; // NaN while still accelerating
 const dpk=m.act?m.TL/(J*aw*Math.E):(()=>{const tp=Math.log(aw/bJ)/(aw-bJ);return m.TL/J*(Math.exp(-bJ*tp)-Math.exp(-aw*tp))/(aw-bJ);})();
 const ps=per('Y:M1'),pre=ps.filter(q=>q.tm<m.tTL),post=ps.filter(q=>q.tm>=m.tTL),wmax=pre.length?Math.max(...pre.map(q=>q.max)):NaN,wmin=post.length?Math.min(...post.map(q=>q.min)):NaN;
 h+=`<li>Βρόχος ταχύτητας: τ* = PI(ω_ref − ω) − b_a·ω, i_ref = τ_sat/ψ̂, με α_s = α_c/10 = <b>${eng(m.as,'rad/s')}</b>: K_p = α_s·J = <b>${eng(m.kps)}</b>, ${m.act?`b_a = α_s·J − b = <b>${eng(m.bac,'N·m·s')}</b>, K_i = α_s²·J = <b>${eng(m.kis)}</b>`:`K_i = α_s·b = <b>${eng(m.kis)}</b>`}. Το α_s ≤ α_c/10 κρατά τον εσωτερικό βρόχο «γρήγορο»: ο εξωτερικός τον βλέπει σχεδόν ως i_a = i_ref</li>
  <li>Επιτάχυνση με το όριο ψ̂·I_max = <b>${eng(psi*m.Imax,'N·m')}</b>: t ≈ J·ω_ref/(ψ·I_max) = <b>${eng(ta,'s')}</b>. Χωρίς anti-windup ο ολοκληρωτής θα φόρτωνε όλο αυτό το διάστημα και η ταχύτητα θα ξεπερνούσε πολύ το ω_ref</li>
  <li>Βήμα φορτίου τ_L: ${m.act?`(J·s² + (b + b_a + K_p)s + K_i) = J(s + α_s)², άρα ω = ω_ref − (τ_L/J)·t·e^(−α_s t), μέγιστη πτώση τ_L/(J·α_s·e) = <b>${eng(dpk,'rad/s')}</b> στο t = 1/α_s`:`ω = ω_ref − τ_L/((J·s + b)(s + α_s)): πτώση περίπου τ_L/(J·α_s) = <b>${eng(dpk,'rad/s')}</b>, που επανέρχεται με σταθερά χρόνου J/b = <b>${eng(J/b,'s')}</b>. Ο ολοκληρωτής K_i = α_s·b είναι σχεδόν ανύπαρκτος, γιατί η τριβή b είναι μικρή`}</li>
  <li>Μόνιμη κατάσταση: ω = ω_ref, i_a = (b·ω + τ_L)/ψ, u = R_a·i_a + ψ·ω, D = u/V_dc</li></ul>`;
 const ith=(b*wth+tl)/psi,uth=Ra*ith+psi*wth;
 if(wait)return h+wait;h+=cmpRows([['μέγιστη ω πριν από το φορτίο',m.wref,wmax,'rad/s'],...(s.t>m.tTL?[['ελάχιστη ω μετά το βήμα φορτίου',m.wref-dpk,wmin,'rad/s']]:[]),['ω τώρα',wth,wNow,'rad/s'],['⟨i_a⟩ (τελευταίες 5 T)',ith,iA,'A'],['D',uth/Vdc,dA,'']]);
 return h+`<p class="small muted">Οι θεωρητικές τιμές θεωρούν ιδανικό βρόχο ρεύματος (i_a = i_ref) και ακριβή πρόσθια τροφοδότηση. Οι παράμετροι της μηχανής είναι τυπικές τιμές.</p>`+evalOrderHTML();}
// traveling waves (3.8): the same problem by the method of characteristics (P.bewley), a lattice diagram, theory vs simulation
function twModel(){const s=S.sim,m=S.tutMeta||{},c=s?.net.compInfo.get('T1');if(!s||!c?.line||!m.dur)return null;const Z=c.line.Z,tau=c.line.tau;
 const RLp=paramsOf('RL'),RAp=paramsOf('RA'),book=m.case==='book';
 const RL=!book&&m.term==='short'?0:RLp?+RLp.R:Infinity,ta=book&&RAp?m.ta:null,par=(a,b)=>a===Infinity?b:a*b/(a+b);
 const g=R=>R===Infinity?1:(R-Z)/(R+Z),gL=t=>g(ta!==null&&t>=ta?par(RL,1e-3):RL);
 const w=m.src==='li'?s.net.compInfo.get('V1')?.wave:null,E=m.E,Ef=w?(t=>P.waveAt(w,t)):(()=>E);
 return {s,m,Z,tau,Rs:m.Rs,E,RL,ta,gL,w,book,bw:P.bewley({E:Ef,Rs:m.Rs,Z,tau,gL,tEnd:m.dur,M:w?400:200}),step:P.bewley({E:()=>E,Rs:m.Rs,Z,tau,gL,tEnd:Math.min(m.dur,9*tau),M:100})};}
function twLattice(q){const W=380,H=290,xa=70,xb=W-70,tmax=Math.min(q.m.dur,8*q.tau),y=t=>24+t/tmax*(H-44),z=1e-4*Math.abs(q.E),kv=v=>Math.abs(v)<z?'0':fmt(v/1e3,3);
 let h=`<svg class="lattice" viewBox="0 0 ${W} ${H}" role="img" aria-label="Διάγραμμα Bewley"><line x1="${xa}" y1="18" x2="${xa}" y2="${H-14}" class="ax"/><line x1="${xb}" y1="18" x2="${xb}" y2="${H-14}" class="ax"/>
  <text x="${xa}" y="12" text-anchor="middle" class="lb">A</text><text x="${xb}" y="12" text-anchor="middle" class="lb">B</text>`;
 for(let k=0;k*q.tau<=tmax+1e-15;k++)h+=`<text x="${(xa+xb)/2}" y="${y(k*q.tau)+3}" text-anchor="middle" class="tk">${k}τ</text>`;
 let n=0;for(const wv of q.step.waves){if(wv.t>tmax-1e-15||n>=14)break;n++;const t0=wv.t,t1=Math.min(t0+q.tau,tmax),x0=wv.dir>0?xa:xb,x1=wv.dir>0?xb:xa,fr=(t1-t0)/q.tau,xe=x0+(x1-x0)*fr;
  h+=`<line x1="${x0}" y1="${y(t0)}" x2="${xe}" y2="${y(t1)}" class="${wv.dir>0?'fw':'bw'}"/>`+(Math.abs(wv.amp)>.005*Math.abs(q.E)&&fr>.5?`<text x="${x0+(x1-x0)*(wv.dir>0?.3:.7)}" y="${y(t0+.3*q.tau)-3}" text-anchor="middle" class="am">${kv(wv.amp)}</text>`:'');}
 // end voltages after each change, at the sides
 const marks=(vt,x,anchor)=>{let out='',last=null;for(let k=0;k*q.tau<=tmax;k++){const v=vt((k+.5)*q.tau);if(last===null||Math.abs(v-last)>z){out+=`<text x="${x}" y="${y((k+.5)*q.tau)+3}" text-anchor="${anchor}" class="vv">${kv(v)}</text>`;last=v;}}return out;};
 h+=marks(q.step.vAt,xa-6,'end')+marks(q.step.vBt,xb+6,'start');if(q.ta!==null&&q.ta<tmax)h+=`<line x1="${xb-10}" y1="${y(q.ta)}" x2="${xb+10}" y2="${y(q.ta)}" class="arr"/>`;
 return h+'</svg>';}
function twTheory(){const q=twModel();if(!q)return '';const {s,m,Z,tau,Rs,E}=q,gs=(Rs-Z)/(Rs+Z),gl=q.gL(0),u=m.U,kv=(v,d=4)=>eng(v,'V',d);
 let h=`<div class="tm"><span class="badge">Bergeron</span> Z = ${eng(Z,'Ω',4)} · τ = ${eng(tau,'s',4)} · R_s = ${Rs?eng(Rs,'Ω',4):'0'} · ${q.RL===Infinity?'ανοιχτό άκρο':'R_L = '+eng(q.RL,'Ω',4)}${q.ta!==null?' · αλεξικέραυνο στο '+eng(q.ta,'s',3):''}</div><ul class="eqs">
  <li>Στη γραμμή ταξιδεύουν κύματα τάσης με ρεύμα i = ±v/Z. Στο άκρο με R: Γ = (R − Z)/(R + Z), διάθλαση δ = 1 + Γ.</li>
  <li>Γ_s = (R_s − Z)/(R_s + Z) = <b>${fmt(gs,4)}</b> · Γ_L = <b>${fmt(gl,4)}</b>${q.ta!==null?' (μετά το αλεξικέραυνο ≈ −1)':''} · πρώτο κύμα v⁺ = E·Z/(R_s + Z) = <b>${kv(E*Z/(Rs+Z))}</b>${q.book?` (E = 2u: η εναέρια γραμμή είναι ημιάπειρη, δ_A = 2Z_υ/(Z_ε + Z_υ) = ${fmt(2*Z/(Rs+Z),3)}, α_A = (Z_ε − Z_υ)/(Z_ε + Z_υ) = ${fmt(-gs,3)})`:''}</li>
  <li>Μέθοδος των χαρακτηριστικών, ανεξάρτητη από τον λύτη: a(t) = v⁺(t) + Γ_s·r(t − 2τ…), στο B f(t) = a(t − τ), r = Γ_L(t)·f, v_A = a + b, v_B = f + r.</li></ul>`;
 h+=`<div class="lat-wrap">${twLattice(q)}<p class="muted small">Διάγραμμα Bewley για βηματικό κύμα ${kv(E)}: κάθε γραμμή είναι ένα κύμα (kV), στα πλάγια οι τάσεις των άκρων μετά από κάθε άφιξη.${q.ta!==null?' Η κόκκινη γραμμή στο B είναι η στιγμή που ανάβει το αλεξικέραυνο: από εκεί ξεκινά νέο κύμα.':''}${q.w?' Η κρουστική 1,2/50 ακολουθεί το ίδιο διάγραμμα με τη μορφή της κυματομορφής.':''}</p></div>`;
 if(s.t<m.dur*.98)return h+'<p class="muted small">Τρέξε ως το τέλος για τη σύγκριση με την προσομοίωση.</p>';
 const sa=rawSeries('V:T1'),sb=rawSeries('V2:T1');if(!sa||!sb)return h;
 const at=(r,tq)=>{const t=r.t;let k=1;while(k<t.length&&t[k]<tq)k++;if(k>=t.length)return r.y[t.length-1];const f=(tq-t[k-1])/((t[k]-t[k-1])||1);return r.y[k-1]+(r.y[k]-r.y[k-1])*f;};
 const rows=[];
 if(!q.w){for(let j=0;j<4&&(2*j+1.5)*tau<m.dur;j++){const tq=(2*j+1.5)*tau;rows.push([`v_B στο ${fmt(2*j+1.5,3)}τ`,q.bw.vBt(tq),at(sb,tq),'V']);}
  for(let j=0;j<4&&(2*j+.5)*tau<m.dur;j++){const tq=(2*j+.5)*tau;rows.push([`v_A στο ${fmt(2*j+.5,3)}τ`,q.bw.vAt(tq),at(sa,tq),'V']);}
  if(q.ta!==null&&q.ta+.5*tau<m.dur)rows.push([`v_B μετά το αλεξικέραυνο (${eng(q.ta+.25*tau,'s',3)})`,q.bw.vBt(q.ta+.25*tau),at(sb,q.ta+.25*tau),'V']);}
 else{const pk=(arr,tt)=>{let mx=0,tm=0;for(let k=0;k<arr.length;k++)if(Math.abs(arr[k])>Math.abs(mx)){mx=arr[k];tm=tt[k];}return [mx,tm];};
  const [tb,ttb]=pk(q.bw.vB,q.bw.t),[sbm,stb]=pk(sb.y,sb.t),[tam]=pk(q.bw.vA,q.bw.t),[sam]=pk(sa.y,sa.t);
  rows.push(['κορυφή v_B',tb,sbm,'V'],['χρόνος κορυφής v_B',ttb,stb,'s'],['κορυφή v_A',tam,sam,'V']);for(const tq of [tau+2e-6,tau+20e-6,3*tau+5e-6])if(tq<m.dur)rows.push([`v_B στο ${eng(tq,'s',3)}`,q.bw.vBt(tq),at(sb,tq),'V']);}
 h+=cmpRows(rows);
 if(q.book&&!q.w){const U=x=>(Math.abs(x)<1e-4*u?'0':fmt(x/u,3))+'u',bt=tq=>q.bw.vBt(tq),atA=tq=>q.bw.vAt(tq);
  h+=`<h4>Σύγκριση με τη λύση του βιβλίου (15.4.9)</h4><table class="cmp"><thead><tr><th>Σημείο, στιγμή (βιβλίο)</th><th>Βιβλίο</th><th>Εδώ (ακριβής)</th></tr></thead><tbody>
   <tr><td>B, 0</td><td>0,3u</td><td>${U(bt(1.5*tau))}</td></tr><tr><td>B, 2τ</td><td>0,24u</td><td>${U(bt(3.5*tau))}</td></tr><tr><td>B, 4τ</td><td>0</td><td>${U(bt(5.5*tau))}</td></tr>
   <tr><td>A, −τ</td><td>0,57u</td><td>${U(atA(.5*tau))}</td></tr><tr><td>A, τ</td><td>0,19u</td><td>${U(atA(2.5*tau))}</td></tr><tr><td>A, 3τ</td><td>0,36u</td><td>${U(atA(4.5*tau))}</td></tr><tr><td>A, 5τ</td><td>0,29u</td><td>${U(atA(6.5*tau))}</td></tr></tbody></table>
   <p class="muted small">Στο βιβλίο το κύμα φτάνει στο B τη στιγμή 0, εδώ τη στιγμή τ = ${eng(tau,'s',3)} (οι στιγμές του βιβλίου είναι μετατοπισμένες κατά τ). Με το αλεξικέραυνο στα 3 μs της εκφώνησης συμπίπτουν οι δύο πρώτες τιμές σε κάθε άκρο. Οι επόμενες διαφέρουν, γιατί η λύση του βιβλίου:</p>
   <ul class="eqs"><li>υπολογίζει το B στο 2τ με α_B = −0,47, ενώ το A στο 3τ με το ίδιο κύμα ανακλασμένο με −1,</li><li>δεν περιλαμβάνει το κύμα που ξεκινά από το B τη στιγμή που ανάβει το αλεξικέραυνο.</li></ul>`;}
 return h;}
// surge arrester (3.9): U_A = U_res + 2·S·d/c while that stays below 2·U_res (exercise 15.5.3), against the simulation
function arTheory(){const s=S.sim,m=S.tutMeta||{},c=s?.net.compInfo.get('T1');if(!s||!c?.line||!m.dur)return '';const tau=c.line.tau,Z=c.line.Z,mov=s.net.compInfo.get('M1')?.main;
 const sa=rawSeries('V2:T1'),sb=rawSeries('V:T1'),si=mov?rawSeries('I:M1'):null,mx=r=>r?r.y.reduce((a,v)=>Math.max(a,v),-Infinity):NaN;
 const done=s.t>=m.dur*.98,vA=done?mx(sa):NaN,vB=done?mx(sb):NaN;
 let iEnd=NaN;if(done&&si){let a=0,w=0;for(let k=1;k<si.t.length;k++)if(si.t[k]>s.t-4*tau){const d=si.t[k]-si.t[k-1];a+=d*(si.y[k]+si.y[k-1])/2;w+=d;}iEnd=w>0?a/w:NaN;} // mean over the last 4τ: the line B–A rings
 // residual voltage: of the characteristic at the final current (E − U_res)/Z, found by fixed point
 let Ur=m.Ures;if(mov){for(let k=0;k<50;k++)Ur=mov.ch.inv((2*m.U-Ur)/Z);}
 const UA=mov?Math.min(Ur+2*m.S*tau,2*Ur):2*m.U,dmax=mov?(m.BIL-Ur)*m.c/(2*m.S):0;
 let h=`<div class="tm"><span class="badge">αλεξικέραυνο</span> S = ${eng(m.S*1e-6,'V/μs',3)} · d = ${eng(m.d,'m',4)} · τ = d/c = ${eng(tau,'s',4)} · Z = ${eng(Z,'Ω')} · BIL ${eng(m.BIL,'V')}</div><ul class="eqs">
  <li>Το κύμα ράμπας έρχεται από ημιάπειρη γραμμή: πηγή 2u πίσω από Z. Χωρίς αλεξικέραυνο, στο ανοιχτό άκρο A (Μ/Σ) γίνεται 2u.</li>
  ${mov?`<li>Παραμένουσα τάση στο τελικό ρεύμα (2u − U_res)/Z = ${eng((2*m.U-Ur)/Z,'A',4)}: U_res = <b>${eng(Ur,'V',4)}</b> (χαρακτηριστική του αλεξικέραυνου)</li>
  <li>Όταν το B κλειδώνει στο U_res, το A ανεβαίνει ακόμη για 2τ: U_A = U_res + 2·S·d/c = <b>${eng(Ur+2*m.S*tau,'V',4)}</b>${Ur+2*m.S*tau>2*Ur?`, όμως όχι πάνω από 2·U_res = <b>${eng(2*Ur,'V',4)}</b>: το αλεξικέραυνο άγει πριν επιστρέψει η ανάκλαση από το A`:''}</li>
  <li>Απόσταση προστασίας για BIL ${eng(m.BIL,'V')}: d_max = (BIL − U_res)·c/(2S) = <b>${eng(dmax,'m',4)}</b>${m.mov==='ideal'&&m.S===40e9?' (άσκηση 15.5.3: 217,5 m με U_res = 692 kV)':''}</li>`:''}</ul>`;
 if(!done)return h+'<p class="muted small">Τρέξε ως το τέλος για τη σύγκριση.</p>';
 const rows=[['μέγιστη τάση στον Μ/Σ (A)',UA,vA,'V']];if(mov)rows.push(['μέγιστη τάση στο αλεξικέραυνο (B)',Ur,vB,'V'],['ρεύμα αλεξικέραυνου (μέση τιμή στα τελευταία 4τ)',(2*m.U-Ur)/Z,iEnd,'A']);
 h+=cmpRows(rows)+`<p class="${vA<m.BIL?'good':'bad'}">${vA<m.BIL?'✓ Κάτω από τη στάθμη μόνωσης':'✗ Πάνω από τη στάθμη μόνωσης'} (${eng(vA,'V',4)} έναντι BIL ${eng(m.BIL,'V')}).</p>`;
 if(m.mov!=='ideal'&&mov)h+=`<p class="muted small">Με μαλακή χαρακτηριστική το B αρχίζει να κλειδώνει πριν από το U_res, οπότε το A μένει λίγο κάτω από τον τύπο, που υποθέτει ιδανικό αλεξικέραυνο.</p>`;
 if(m.S===40e9)h+=`<p class="muted small">Η άσκηση 15.5.3 δίνει την κλίση σε kA/μs και την παραμένουσα τάση ως ενδεικνυόμενη τιμή, αλλά στη λύση τις χρησιμοποιεί ως κλίση τάσης σε kV/μs και ως κορυφή. Εδώ είναι κλίση τάσης και κορυφές.</p>`;
 return h;}
// impulse parameters of a sampled wave (3.10): peak with parabolic interpolation; 'iec': T1 = (t₉₀ − t₃₀)/0,6 and T2 from the
// virtual origin t₃₀ − 0,3·T1 (IEC 60060-1); 'tp': time to peak and to half value from the true origin t0
function impulseMeasure(t,y,t0,basis){let k=0;for(let i=1;i<y.length;i++)if(y[i]>y[k])k=i;let tp=t[k],pk=y[k];
 if(k>0&&k<y.length-1){const a=y[k-1],b=y[k],c=y[k+1],h1=t[k]-t[k-1],h2=t[k+1]-t[k],d=a*h2-b*(h1+h2)+c*h1;if(Math.abs(h1-h2)<1e-9*h1&&d<0){const x=.5*(a-c)/(a-2*b+c);tp=t[k]+x*h1;pk=b-.25*(a-c)*x;}}
 const cross=(lv,i0,i1,dir)=>{for(let i=i0;dir>0?i<i1:i>i1;i+=dir){const a=y[i],b=y[i+dir];if((a-lv)*(b-lv)<=0&&a!==b)return t[i]+(lv-a)/(b-a)*(t[i+dir]-t[i]);}return NaN;};
 const t30=cross(.3*pk,0,k,1),t90=cross(.9*pk,0,k,1),t50=cross(.5*pk,k,y.length-1,1);
 if(basis==='tp')return {pk,tp,T1:tp-t0,T2:t50-t0};const T1=(t90-t30)/.6;return {pk,tp,T1,T2:t50-(t30-.3*T1)};}
function marxTheory(){const s=S.sim,m=S.tutMeta||{};if(!s||!m.n)return '';const P2=P.impulseRoots({R1:m.R1,R2:m.R2,C1:m.C1,C2:m.C2,pos:m.pos}),
  wm=P.waveMeasure({kind:'dexp',n:1,tau1:1/P2.a2,tau2:1/P2.a1,eta:1,I0:1,t0:0},m.basis),nV=m.n*m.V0,iec=m.basis!=='tp',T1n=iec?'T1 (IEC: 1,67·(t₉₀ − t₃₀))':'T_p (χρόνος κορυφής)',T2n=iec?'T2 (ημίσεως τιμής, από την εικονική αρχή)':'T2 (ημίσεως τιμής, από την αρχή)';
 const done=s.t>=m.dur*.98,v=done?rawSeries('V:C2'):null,q=v?impulseMeasure(v.t,v.y,m.tf,m.basis):null;
 let fired=0;if(done)for(let k=1;k<=m.n;k++){const g=rawSeries('I:SG'+k);if(g&&g.y.some(x=>Math.abs(x)>1e-3*nV/m.R1))fired++;}
 let h=`<div class="tm"><span class="badge">Marx</span> n = ${m.n} · V₀ = ${eng(m.V0,'V')} · C_κ = ${eng(m.Ck,'F')} · C₂ = ${eng(m.C2,'F')} · U_b = ${eng(m.Ub,'V')} · ${m.shape} μs</div><ul class="eqs">
  <li>Σε σειρά: C₁ = C_κ/n = <b>${eng(m.C1,'F',4)}</b> φορτισμένος στα n·V₀ = <b>${eng(nV,'V')}</b>, ενέργεια W = ½·C₁·(n·V₀)² = ${eng(.5*m.C1*nV*nV,'J',4)} (σχέσεις 3.42–3.44)</li>
  <li>R₁ = ${eng(m.R1,'Ω',4)} (μετώπου), R₂ = ${eng(m.R2,'Ω',4)} (ουράς)${m.pos==='gen'?` = n·r₂, r₂ = ${eng(m.rr,'Ω',4)}`:''}, R₃ = ${eng(m.R3,'Ω')} (φόρτισης, R₃ ≫ r₂)</li>
  <li>${m.pos==='gen'?'R₂ παράλληλα στο C₁ (τύπος β, 3.25)':'R₂ παράλληλα στο C₂ (τύπος α, 3.22)'}: α₁ = <b>${fmt(P2.a1,5)} s⁻¹</b>, α₂ = <b>${fmt(P2.a2,5)} s⁻¹</b> (ρίζες της s² + a·s + b = 0, 3.29)</li>
  <li>v(t) = n·V₀/(R₁C₂)·(e^(−α₁t) − e^(−α₂t))/(α₂ − α₁) (3.28), κορυφή στο t₁ = ln(α₂/α₁)/(α₂ − α₁) = ${eng(P2.t1,'s',4)} (3.31)</li>
  <li>Βαθμός απόδοσης η = V_p/(n·V₀) = <b>${fmt(P2.eta,4)}</b> (3.32). Προσέγγιση C₁/(C₁ + C₂) = ${fmt(m.C1/(m.C1+m.C2),4)} (3.33)</li></ul>`;
 if(!m.feas)h+=`<p class="warn-text">Με R₂ στην έξοδο και C₁/C₂ = ${fmt(m.C1/m.C2,3)} δεν υπάρχουν R₁, R₂ που να δίνουν ${m.shape} μs. Εδώ μπήκαν οι τιμές της σχεδίασης με R₂ στη γεννήτρια, και η κάρτα δείχνει τι κυματομορφή δίνουν.</p>`;
 if(!done)return h+'<p class="muted small">Τρέξε ως το τέλος για τη σύγκριση.</p>';
 h+=cmpRows([['κορυφή V_p',P2.eta*nV,q.pk,'V'],[T1n,wm.T1,q.T1,'s'],[T2n,wm.T2,q.T2,'s'],['βαθμός απόδοσης η',100*P2.eta,100*q.pk/nV,'%']]);
 h+=`<p class="${fired===m.n?'good':'bad'}">${fired===m.n?'✓ Άναψαν και οι '+m.n+' σπινθηριστές.':'✗ Άναψαν '+fired+' από τους '+m.n+' σπινθηριστές: η γεννήτρια δεν εκφορτίστηκε πλήρως.'}</p>`;
 return h+`<p class="muted small">Η θεωρία αγνοεί τις R₃ και την αντίσταση τόξου των διακένων (${eng(.1,'Ω')} το καθένα).</p>`;}
// chopped impulse: the chopping time and voltage from the generator wave (3.28). After the chop the circuit is linear with three
// states (C₁ with R₂, R₁, C₂, the loop L_c–R with R = R_c + R_arc), integrated here with RK4 from v₁(t_c), v₂(t_c), i = 0. For insight,
// with C₁ held: u'' + 2α·u' + ω₀²·u = 0, 2α = 1/(R₁C₂) + R/L_c, ω₀² = (1 + R/R₁)/(L_c·C₂), about v∞ = V₁·R/(R₁ + R)
function chopModel(m){const g=P.impulseRoots({R1:m.R1,R2:m.R2,C1:m.C1,C2:m.C2,pos:'gen'}),K=m.V/(m.R1*m.C2*(g.a2-g.a1)),v2=t=>K*(Math.exp(-g.a1*t)-Math.exp(-g.a2*t)),dv2=t=>K*(g.a2*Math.exp(-g.a2*t)-g.a1*Math.exp(-g.a1*t));
 let tc=m.tc-m.tf,vc;if(m.chop==='front'){let lo=0,hi=g.t1;for(let k=0;k<200;k++){const x=(lo+hi)/2;if(v2(x)<m.Uc)lo=x;else hi=x;}tc=(lo+hi)/2;vc=m.Uc;}else vc=v2(tc);
 const V1=v2(tc)+m.R1*m.C2*dv2(tc),R=m.Rc+m.Rarc,vinf=V1*R/(m.R1+R),al=(1/(m.R1*m.C2)+R/m.Lc)/2,w0=Math.sqrt((1+R/m.R1)/(m.Lc*m.C2)),wd=Math.sqrt(Math.max(w0*w0-al*al,0));
 const f=([a,b,i])=>[(-a/m.R2-(a-b)/m.R1)/m.C1,((a-b)/m.R1-i)/m.C2,(b-R*i)/m.Lc],T=1.5*2*Math.PI/w0,N=6000,h=T/N;let x=[V1,vc,0],vmin=vc,vmax=vc;
 for(let k=0;k<N;k++){const k1=f(x),k2=f(x.map((q,j)=>q+h/2*k1[j])),k3=f(x.map((q,j)=>q+h/2*k2[j])),k4=f(x.map((q,j)=>q+h*k3[j]));x=x.map((q,j)=>q+h/6*(k1[j]+2*k2[j]+2*k3[j]+k4[j]));vmin=Math.min(vmin,x[1]);vmax=Math.max(vmax,x[1]);}
 return {g,tc:tc+m.tf,vc,V1,R,vinf,al,w0,wd,vmin,vmax,full:g.eta*m.V};}
function chopTheory(){const s=S.sim,m=S.tutMeta||{};if(!s||!m.V)return '';const q=chopModel(m),done=s.t>=m.dur*.98,v=done?rawSeries('V:C2'):null;
 let h=`<div class="tm"><span class="badge">αποκοπή</span> C₁ = ${eng(m.C1,'F')} στο ${eng(m.V,'V')} · R₁ = ${eng(m.R1,'Ω',4)} · R₂ = ${eng(m.R2,'Ω',4)} · C₂ = ${eng(m.C2,'F')} · L_c = ${eng(m.Lc,'H')} · R_c = ${eng(m.Rc,'Ω')}</div><ul class="eqs">
  <li>Πλήρες κύμα 1,2/50: κορυφή η·V = <b>${eng(q.full,'V',4)}</b> (σχέσεις 3.28–3.32)</li>`;
 if(m.chop==='none'){if(!done)return h+'</ul><p class="muted small">Τρέξε ως το τέλος για τη σύγκριση.</p>';let mx=-Infinity;for(const y of v.y)mx=Math.max(mx,y);return h+'</ul>'+cmpRows([['κορυφή',q.full,mx,'V']]);}
 h+=`<li>Αποκοπή ${m.chop==='front'?'στο μέτωπο, όταν v = U_b':'στην ουρά, με εντολή'}: t_c = <b>${eng(q.tc,'s',4)}</b> (από την έναυση της γεννήτριας: ${eng(q.tc-m.tf,'s',4)}), v_c = <b>${eng(q.vc,'V',4)}</b></li>
  <li>Μετά την αποκοπή: L_c, R = R_c + R_τόξου = ${eng(q.R,'Ω',3)} και C₂, με απόσβεση και από την R₁: α = ½·(1/(R₁C₂) + R/L_c) = ${fmt(q.al,4)} s⁻¹, ω₀ = ${fmt(q.w0,4)} rad/s, f = ω_d/2π = ${eng(q.wd/2/Math.PI,'Hz',4)}</li>
  <li>Η τάση ταλαντώνεται γύρω από v_∞ = V₁·R/(R₁ + R) = ${eng(q.vinf,'V',3)} (V₁ = ${eng(q.V1,'V',4)} η τάση του C₁ στο t_c). Ελάχιστη τάση από τη λύση του γραμμικού κυκλώματος (C₁–R₂, R₁, C₂, L_c–R): <b>${eng(q.vmin,'V',4)}</b>, υπερύψωση αντίθετης πολικότητας <b>${fmt(-100*q.vmin/q.vc,3)} %</b> της v_c</li>
  <li>Κρίσιμη απόσβεση του βρόχου (χωρίς R₁): R = 2·√(L_c/C₂) = ${eng(2*Math.sqrt(m.Lc/m.C2),'Ω',3)}</li></ul>`;
 if(!done)return h+'<p class="muted small">Τρέξε ως το τέλος για τη σύγκριση.</p>';
 let mx=-Infinity,tm=0,mn=Infinity;for(let i=0;i<v.y.length;i++){if(v.y[i]>mx){mx=v.y[i];tm=v.t[i];}if(v.t[i]>q.tc)mn=Math.min(mn,v.y[i]);}
 const gi=rawSeries('I:SG2'),j=gi?gi.y.findIndex(x=>Math.abs(x)>1):-1,tcS=j>0?gi.t[j-1]:NaN,ok=-mn/q.vc<=.3; // the chop: the last sample before the gap carries current
 h+=cmpRows([['στιγμή αποκοπής t_c',q.tc,tcS,'s'],['μέγιστη τάση (το C₂ φορτίζεται λίγο ακόμη μετά την αποκοπή)',q.vmax,m.chop==='front'?mx:NaN,'V'],['ελάχιστη τάση μετά την αποκοπή',q.vmin,mn,'V']].filter(r=>Number.isFinite(r[2])));
 return h+`<p class="${ok?'good':'bad'}">${ok?'✓':'✗'} Υπερύψωση ${fmt(-100*mn/q.vc,3)} % της τάσης αποκοπής (IEC 60076-3: έως 30 %).</p><p class="muted small">Η θεωρία αγνοεί την αντίσταση τόξου του G1 (${eng(.1,'Ω')}).</p>`;}
// 3.11: a table with three columns for each quantity: the book's value (or its approximate formula), the exact solution and the simulation
function cmp3(rows){const pc=(a,b)=>{if(!(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(b)>1e-30))return '';let d=100*(a/b-1);if(Math.abs(d)<1e-9)d=0;return `<td class="${Math.abs(d)<2?'good':Math.abs(d)<10?'':'warn-text'}">${fmt(d,3)} %</td>`;};
 return `<table class="cmp"><thead><tr><th>Μέγεθος</th><th>Βιβλίο</th><th>Ακριβής λύση</th><th>Προσομοίωση</th><th>βιβλίο ↔ ακριβής</th><th>προσομ. ↔ ακριβής</th></tr></thead><tbody>${rows.map(([n,bk,ex,sm,u])=>
  `<tr><td>${n}</td><td>${Number.isFinite(bk)?eng(bk,u,4):'—'}</td><td>${eng(ex,u,4)}</td><td>${Number.isFinite(sm)?eng(sm,u,4):'—'}</td>${pc(bk,ex)||'<td></td>'}${pc(sm,ex)||'<td></td>'}</tr>`).join('')}</tbody></table>`;}
// the exact two-exponential wave of a single-stage equivalent (book 3.21–3.32): roots, efficiency, T1 and T2 (IEC 60060-1)
function hvExact(R1,R2,C1,C2,pos){const g=P.impulseRoots({R1,R2,C1,C2,pos}),w=P.waveMeasure({kind:'dexp',n:1,tau1:1/g.a2,tau2:1/g.a1,eta:1,I0:1,t0:0},'iec');return {...g,T1:w.T1,T2:w.T2};}
function hv153Theory(){const s=S.sim,m=S.tutMeta||{};if(!s||!m.ex)return '';const b=m.book||{},gen=m.pos==='gen',C1=m.C1,C2=m.C2,U=m.U,ex=hvExact(m.R1,m.R2,C1,C2,m.pos);
 const ser=C1*C2/(C1+C2),par=m.R1*m.R2/(m.R1+m.R2),ap={eta:C1/(C1+C2),T1:2.96*(gen?m.R1:par)*ser,T2:.73*(gen?m.R2:m.R1+m.R2)*(C1+C2)};
 const done=s.t>=m.dur*.98,v=done?rawSeries('V:'+m.out):null,q=v?impulseMeasure(v.t,v.y,m.tf,'iec'):null,kd=m.div?(m.div[0]+m.div[1])/m.div[0]:0;
 let h=`<div class="tm"><span class="badge">${esc(m.ex.replace(/^(\d\d)(\d)(\d)/,'$1.$2.$3'))}</span> ${esc(m.t)}</div><ul class="eqs">
  <li>${m.marx?`Marx ${m.marx} βαθμίδων: σε σειρά C_κ = C′_κ/${m.marx} = <b>${eng(C1,'F',4)}</b> στα ${m.marx}·${eng(m.U0,'V')} = <b>${eng(U,'V')}</b>, R_μ = ${eng(m.R1,'Ω',4)}, R_ε = ${eng(m.R2,'Ω',4)}`:`C_κ = ${eng(C1,'F',4)} στα <b>${eng(U,'V',4)}</b>, R_μ = ${eng(m.R1,'Ω',5)}, R_ε = ${eng(m.R2,'Ω',5)}, κύκλωμα ${gen?'β (R_ε παράλληλα στο C_κ)':'α (R_ε παράλληλα στο φορτίο)'}`}</li>
  <li>Φορτίο C_φ,ολ = ${m.loads.map(q=>esc(q[0])+' '+eng(q[1],'F',4)).join(' + ')}${m.div?` + καταμεριστής C_H·C_L/(C_H + C_L) = ${eng(m.Cd,'F',4)}`:''} = <b>${eng(C2,'F',4)}</b></li>
  <li>Τύποι του βιβλίου: η ≈ C_κ/(C_κ + C_φ) = ${fmt(ap.eta,4)}, T1 ≈ 2,96·${gen?'R_μ':'(R_μ∥R_ε)'}·C_κC_φ/(C_κ + C_φ) = ${eng(ap.T1,'s',4)}, T2 ≈ 0,73·${gen?'R_ε':'(R_ε + R_μ)'}·(C_κ + C_φ) = ${eng(ap.T2,'s',4)}</li>
  <li>Ακριβής λύση: α₁ = ${fmt(ex.a1,5)} s⁻¹, α₂ = ${fmt(ex.a2,5)} s⁻¹, κορυφή στο t₁ = ${eng(ex.t1,'s',4)}, η = <b>${fmt(ex.eta,4)}</b>. Η διαφορά από τους τύπους: η R_ε εκφορτίζει το C_κ όσο φορτίζεται το C_φ, και ${gen?'η R_μ':'η R_ε'} δεν είναι αμελητέα</li></ul>`;
 if(!done)return h+'<p class="muted small">Τρέξε ως το τέλος για τη σύγκριση με την προσομοίωση.</p>';
 const rows=[['κορυφή V_p',b.Vp??ap.eta*U,ex.eta*U,q.pk,'V'],['βαθμός απόδοσης η',100*(b.eta??ap.eta),100*ex.eta,100*q.pk/U,'%'],['T1 (IEC 60060-1)',b.T1??ap.T1,ex.T1,q.T1,'s'],['T2 (IEC 60060-1)',b.T2??ap.T2,ex.T2,q.T2,'s']];
 if(b.tp)rows.push(['χρόνος κορυφής',b.tp,ex.t1,q.tp-m.tf,'s']);
 if(m.div){const lv=rawSeries('V:CL'),vl=lv?Math.max(...lv.y):NaN;rows.push(['τάση βραχίονα ΧΤ (λόγος '+fmt(kd,4)+')',b.Vlv??NaN,ex.eta*U/kd,vl,'V']);}
 if(b.W)rows.push(['ενέργεια ½·C_κ·U²',b.W,.5*C1*U*U,NaN,'J']);
 h+=cmp3(rows);const notes=[];
 if(m.lim){const ok=(x,[a,c])=>x>=a&&x<=c,o1=ok(ex.T1,m.lim.T1),o2=ok(ex.T2,m.lim.T2);
  notes.push(`<p class="${o1&&o2?'good':'bad'}">Όρια της δοκιμής: T1 ${eng(m.lim.T1[0],'s')}–${eng(m.lim.T1[1],'s')} ${o1?'✓':'✗'}, T2 ${eng(m.lim.T2[0],'s')}–${eng(m.lim.T2[1],'s')} ${o2?'✓':'✗'}. ${o1&&o2?'Η δοκιμή είναι έγκυρη.':'Η δοκιμή δεν είναι έγκυρη.'}</p>`);}
 if(m.ex==='1533'){const vl=ex.eta*U/kd;notes.push(`<p class="${vl>600?'bad':'good'}">Βραχίονας ΧΤ: ${eng(vl,'V',4)} (ακριβής). ${vl>600?'Κανένας παλμογράφος ως 600 V δεν αρκεί: το συμπέρασμα του βιβλίου ισχύει, με 1001 V αντί για 1069 V.':'Αρκεί παλμογράφος '+Math.ceil(vl/100)*100+' V.'}</p>`);}
 if(m.ex==='1535'){const T1x=Cx=>hvExact(m.R1,m.R2,C1,C2-.254e-9+Cx,'gen').T1;let lo=0,hi=5e-9;for(let k=0;k<60;k++){const x=(lo+hi)/2;if(T1x(x)<1.56e-6)lo=x;else hi=x;}
  const Uac=175e3/(ex.eta*2*Math.SQRT2);notes.push(`<p>Μέγιστο δοκίμιο για T1 ≤ 1,56 μs: <b>${eng(lo,'F',4)}</b> με την ακριβή λύση (βιβλίο ${eng(b.Cx,'F',3)}).</p>
   <p class="${q.pk>=175e3?'good':'bad'}">Κορυφή με U_ac = 66,5 kV: ${eng(q.pk,'V',4)} ${q.pk>=175e3?'≥':'<'} 175 kV. Για 175 kV χρειάζεται U_ac = <b>${eng(Uac,'V',4)}</b> (βιβλίο 66,5 kV, με η = C_κ/(C_κ + C_φ)).</p>`);}
 if(m.ex.startsWith('1536')){const R1c=1.2e-6/(2.96*ser);notes.push(`<p class="${m.ex==='1536'?'bad':'good'}">Το βιβλίο γράφει R_μ = 44,59 Ω. Από τον ίδιο τύπο R_μ = T1/(2,96·C_κC_φ/(C_κ + C_φ)) = <b>${eng(R1c,'Ω',4)}</b>: λάθος ×100. ${m.ex==='1536'?'Με 45 Ω το μέτωπο βγαίνει '+eng(ex.T1,'s',3)+' αντί για 1,2 μs.':'Με τη σωστή τιμή βγαίνει 1,2/50.'}</p>`);}
 if(m.marx){let fired=0;for(let k=1;k<=m.marx;k++){const g=rawSeries('I:SG'+k);if(g&&g.y.some(x=>Math.abs(x)>1e-3*U/m.R1))fired++;}
  notes.push(`<p class="${fired===m.marx?'good':'bad'}">${fired===m.marx?'✓ Άναψαν και τα '+m.marx+' διάκενα.':'✗ Άναψαν '+fired+' από τα '+m.marx+' διάκενα.'} Η R_μ μπήκε ενιαία (3·R′_μ = ${eng(m.R1,'Ω',4)}), οι R′_ε = ${eng(m.R2/m.marx,'Ω',4)} σε κάθε βαθμίδα.</p>`);}
 return h+notes.join('')+'<p class="muted small">Οι τύποι του βιβλίου είναι προσεγγίσεις για C_κ ≫ C_φ και R_ε ≫ R_μ. Η ακριβής λύση είναι ανεξάρτητη από τον λύτη.</p>';}
// 3.11: lossy line. The exact step response of a semi-infinite line with series R′ only (Heaviside): v/V₀ = e^(−aT) + aT·∫₀^U e^(−aT·cosh u)·I₁(aT·sinh u) du,
// a = R′/(2L′), T = x/v, U = arccosh(t/T) (s = T·cosh u removes the singularity of the textbook form)
function besI1e(x){const ax=Math.abs(x);let r;if(ax<3.75){const y=(x/3.75)**2;r=ax*(.5+y*(.87890594+y*(.51498869+y*(.15084934+y*(.02658733+y*(.00301532+y*.00032411))))))*Math.exp(-ax);}
 else{const y=3.75/ax;r=(.39894228+y*(-.03988024+y*(-.00362018+y*(.00163801+y*(-.01031555+y*(.02282967+y*(-.02895312+y*(.01787654-y*.00420059))))))))/Math.sqrt(ax);}return x<0?-r:r;}
function heaviside(aT,tT){if(tT<1)return 0;const U=Math.acosh(tT),n=200,hh=U/n;let s=0;
 for(let k=0;k<=n;k++){const u=k*hh,x=aT*Math.sinh(u),f=besI1e(x)*Math.exp(x-aT*Math.cosh(u));s+=f*(k===0||k===n?1:k%2?4:2);}return Math.exp(-aT)+aT*s*hh/3;}
function lossTheory(){const s=S.sim,m=S.tutMeta||{};if(!s||!m.tau)return '';const T=m.tau,aT=m.R/(2*m.Z),open=m.end==='open',G=open?2:1,x=m.R/(4*m.N*m.Z);
 const lam=m.Rp>0?2*m.Z/m.Rp:Infinity,done=s.t>=m.dur*.98;
 let h=`<div class="tm"><span class="badge">γραμμή RLC</span> Z = ${eng(m.Z,'Ω')} · ℓ = ${eng(m.len,'m')} · τ = ${eng(T,'s')} · R′ = ${eng(m.Rp*1e3,'Ω/km')} · R = ${eng(m.R,'Ω')} · N = ${m.N}</div><ul class="eqs">
  <li>Απόσβεση του μετώπου: e^(−R′ℓ/(2Z)) = e^(−ℓ/λ) = <b>${fmt(Math.exp(-aT),5)}</b>, λ = 2Z/R′ = ${Number.isFinite(lam)?eng(lam,'m'):'∞'} (σχέση 7.88)</li>
  <li>Μοντέλο με ${m.N} τμήματα: το μέτωπο περνά ${2*m.N} αντιστάσεις R/(2N) (οι ακριανές R/(4N)) και σβήνει ως (1 + R/(4NZ))^(−2N) = <b>${fmt((1+x)**(-2*m.N),5)}</b>. Για N → ∞ δίνει το e^(−R/(2Z))</li>
  <li>Πίσω από το μέτωπο: v(x,t)/V₀ = e^(−aT) + aT·∫ e^(−as)·I₁(a√(s² − T²))/√(s² − T²) ds, a = R′/(2L′) = ${fmt(aT/T,4)} s⁻¹ (λύση του Heaviside για γραμμή με R′, χωρίς G′)</li>
  ${open?'<li>Ανοιχτό άκρο με ιδανική πηγή: v_τέλος = 2·v(ℓ, t) από το τ ως το 3τ, όταν φτάνει το κύμα που ανακλάστηκε στην πηγή</li>':'<li>Συνέχεια σε γραμμή ίδιας R′: στον κόμβο η τάση είναι η v(ℓ, t) της ημιάπειρης γραμμής ως το 7τ</li>'}</ul>`;
 if(!done)return h+'<p class="muted small">Τρέξε ως το τέλος για τη σύγκριση.</p>';
 const v=rawSeries('V2:T1'),at=tq=>{const i=v.t.findIndex(x=>x>=tq);return i>0?v.y[i-1]+(v.y[i]-v.y[i-1])*(tq-v.t[i-1])/(v.t[i]-v.t[i-1]):NaN;};
 if(m.src==='step'){const fs=open?[1.005,1.5,1.99,2.9]:[1.005,2,4,5.9];
  h+=cmpRows(fs.map(f=>[`v στο ${fmt(f,4)}·τ`,G*m.V*heaviside(aT,f),at(f*T),'V']));
  return h+`<p class="muted small">Το μοντέλο με συγκεντρωμένες αντιστάσεις συγκλίνει στην κατανεμημένη γραμμή περίπου ως 1/N: με R/(4NZ) = ${fmt(x,3)} το σφάλμα στο μέτωπο είναι περίπου ${fmt(100*Math.abs((1+x)**(-2*m.N)/Math.exp(-aT)-1),2)} %. Η R′ εδώ είναι σταθερή: το επιδερμικό φαινόμενο και το corona, που πλαταίνουν το μέτωπο στις πραγματικές γραμμές, δεν μοντελοποιούνται.</p>`;}
 // impulse: Duhamel with the exact step response g(θ) = G·v(ℓ, τ + θ)/V₀ and du/dt of the source at the grid points (trapezoid, 5 ns)
 const w=s.net.compInfo.get('V1')?.wave,n=4000,d=5e-9,gr=new Float64Array(n),du=new Float64Array(n);for(let k=0;k<n;k++){gr[k]=G*heaviside(aT,1+k*d/T);const e1=d*1e-4;du[k]=(P.waveAt(w,k*d+e1)-P.waveAt(w,Math.max(0,k*d-e1)))/(k?2*e1:e1);}   // du/dt at the grid points (one-sided at 0⁺)
 const ve=new Float64Array(n);for(let i=0;i<n;i++){let a=0;for(let j=0;j<=i;j++)a+=gr[i-j]*du[j]*(j===0||j===i?.5:1);ve[i]=a*d;}
 const te=Array.from({length:n},(_,k)=>T+k*d),qe=impulseMeasure(te,Array.from(ve),T,'iec'),i0=v.t.findIndex(x=>x>=T-1e-9),qs=impulseMeasure(v.t.slice(i0),v.y.slice(i0),T,'iec');
 h+=cmpRows([['κορυφή στο τέλος',qe.pk,qs.pk,'V'],['T1 στο τέλος (από την άφιξη)',qe.T1,qs.T1,'s'],['χωρίς απώλειες: '+(open?'2·':'')+'V_p',G*m.V,G*m.V,'V']]);
 return h+`<p class="muted small">Ακριβής λύση: συνέλιξη της βηματικής απόκρισης της κατανεμημένης γραμμής με το du/dt της πηγής. Με σταθερή R′ το μέτωπο σχεδόν δεν αλλάζει σχήμα: μικραίνει κατά e^(−R/(2Z)) και η ουρά μακραίνει λίγο.</p>`;}
// 3.11: volt–time curve from the disruptive-effect criterion D = ∫ (|u| − U₀)^k dt, integrated here on a fine grid of the analytic source (independent of the solver)
function vtBreak(u,U0,k,D,tEnd,n=20000){const h=tEnd/n;let a=0,f0=0;for(let i=1;i<=n;i++){const t=i*h,x=Math.abs(u(t))-U0,f=x>0?x**k:0;if(x<=0){a=0;f0=0;continue;}const da=(f0+f)/2*h;if(a+da>=D){const th=(D-a)/da;return t-h+th*h;}a+=da;f0=f;}return NaN;}
function vtTheory(){const s=S.sim,m=S.tutMeta||{};if(!s||!m.U0)return '';const e=s.net.compInfo.get('SG1')?.main,k=m.k,U0=m.U0,D=m.D,ramp=m.src==='ramp',w=s.net.compInfo.get('V1')?.wave;
 const Du=k===0?'s':k===1?'V·s':'V^'+k+'·s',tbR=S2=>U0/S2+((k+1)*D/S2**k)**(1/(k+1));
 let h=`<div class="tm"><span class="badge">τάση–χρόνος</span> U₀ = ${eng(U0,'V')} · k = ${k} · D = ${fmt(D,4)} ${Du} · ${ramp?'ράμπα '+eng(m.S*1e-6,'V/μs'):'κρουστική 1,2/50, '+eng(m.Vpk,'V')}</div><ul class="eqs">
  <li>Κριτήριο: διάσπαση όταν ∫ (|u| − U₀)^k dt, από τη στιγμή που η τάση ξεπερνά το U₀, φτάσει το D. ${k===0?'Με k = 0 είναι σταθερή καθυστέρηση D μετά το U₀.':k===1?'Με k = 1 είναι ο νόμος ίσων επιφανειών του Kind: το εμβαδόν πάνω από το U₀.':'Με k > 1 βαραίνει περισσότερο η υπέρταση πάνω από το U₀.'}</li>
  ${ramp?`<li>Ράμπα u = S·t: t_d = U₀/S + ((k+1)·D/S^k)^(1/(k+1)) = <b>${eng(tbR(m.S),'s',5)}</b>, τάση διάσπασης S·t_d = <b>${eng(m.S*tbR(m.S),'V',5)}</b></li>`:'<li>Κρουστική: το ολοκλήρωμα υπολογίζεται αριθμητικά πάνω στην αναλυτική κυματομορφή της πηγής</li>'}</ul>`;
 const tEnd=ramp?20*U0/m.S:60e-6,u=ramp?(t=>m.S*t):(t=>P.waveAt(w,t)),tbE=ramp?tbR(m.S):vtBreak(u,U0,k,D,tEnd);
 // the curve: ramps of 50…50 000 kV/μs, or impulses of 1,02…5 × U₀ (voltage at breakdown on the front, the peak on the tail)
 const pts=[];if(ramp){for(let q=0;q<=40;q++){const S2=5e10*Math.pow(1e3,q/40),t=tbR(S2);pts.push([t,S2*t]);}}
 else{const wm=P.waveMeasure({kind:'dexp',n:1,tau1:w.tau1,tau2:w.tau2,eta:1,I0:1,t0:0},'tp');for(let q=0;q<=40;q++){const A=U0*(1.02+3.98*q/40),f=t=>A/m.Vpk*P.waveAt(w,t),t=vtBreak(f,U0,k,D,60e-6,6000);if(Number.isFinite(t))pts.push([t,t<wm.tp?f(t):A]);}}
 const done=s.t>=m.dur*.98,tOn=e?.on?e.tOn:NaN,uOn=Number.isFinite(tOn)?u(tOn):NaN;
 if(pts.length>1){const W=560,H=200,x0=Math.log10(Math.min(...pts.map(p=>p[0]))),x1=Math.log10(Math.max(...pts.map(p=>p[0]))),y1=Math.max(...pts.map(p=>p[1]))*1.05,y0=.9*U0,X=t=>34+(W-40)*(Math.log10(t)-x0)/((x1-x0)||1),Y=v=>6+(H-28)*(1-(v-y0)/(y1-y0));
  const cur='M'+pts.map(p=>`${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(' L'),u0=`<line class="diag" x1="34" x2="${W-6}" y1="${Y(U0).toFixed(1)}" y2="${Y(U0).toFixed(1)}"/>`;
  const dot=Number.isFinite(tOn)?`<circle cx="${X(tOn).toFixed(1)}" cy="${Y(ramp||tOn<P.waveMeasure({kind:'dexp',n:1,tau1:w.tau1,tau2:w.tau2,eta:1,I0:1,t0:0},'tp').tp?uOn:m.Vpk).toFixed(1)}" r="3"/>`:'';
  // 4.22 (§63 part 2): the frame and the ticks of the core (log time, the voltage in V), the same mapping as X, Y
  const tk=`<text x="${W-8}" y="${Y(U0)-3}" text-anchor="end">U₀</text>`,FR=PlotCore.svgFrame({W,H,x:[10**x0,10**x1],xlog:true,xUnit:'s',y:[y0,y1],yUnit:'V'}).svg;
  h+=`<svg class="bfchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Καμπύλη τάσης–χρόνου">${FR}${u0}<path class="map" d="${cur}"/>${dot}${tk}<text x="${(W+34)/2}" y="${H-1}" text-anchor="middle">χρόνος ως τη διάσπαση (λογαριθμικά)</text></svg>
   <p class="muted small">Η καμπύλη: ${ramp?'ράμπες από 50 ως 50 000 kV/μs':'κρουστικές 1,2/50 από 1,02 ως 5 × U₀: η τάση τη στιγμή της διάσπασης στο μέτωπο, η κορυφή στην ουρά'}. Η κουκκίδα είναι η προσομοίωση.</p>`;}
 if(!done)return h+'<p class="muted small">Τρέξε ως το τέλος για τη σύγκριση.</p>';
 if(!Number.isFinite(tOn))return h+`<p class="${Number.isFinite(tbE)?'bad':'good'}">Το διάκενο δεν διασπάστηκε.${Number.isFinite(tbE)?' Το κριτήριο δίνει διάσπαση στο '+eng(tbE,'s',4)+'.':' Ούτε το κριτήριο δίνει διάσπαση: η τάση δεν μένει αρκετά πάνω από το U₀.'}</p>`;
 return h+cmpRows([['χρόνος ως τη διάσπαση t_d',tbE,tOn,'s'],['τάση τη στιγμή της διάσπασης',u(tbE),uOn,'V']]);}
// 3.12: AC dividers (book 15.1.3, 15.1.5) by phasors; the simulated ratio is low-voltage rms over high-voltage rms (last two periods)
function hvdivTheory(){const s=S.sim,m=S.tutMeta||{};if(!s||!m.ex)return '';const w=2*Math.PI*m.f,V=m.Vpk/Math.SQRT2,b15=m.ex==='1515',done=s.t>=m.dur*.98,T=s.T;
 const ZH=[0,-1/(w*m.CH)],YL=[b15?1/m.Rs:0,w*(m.CL+m.Ccab+m.Cs)],ZL=cx.div([1,0],YL),kC=cx.abs(cx.add(ZH,ZL))/cx.abs(ZL),kb=(m.CH+m.CL+m.Ccab+m.Cs)/m.CH;
 const r=k=>done?phaseRms(k,T,2)/phaseRms('V:V1',T,2):NaN;
 let h=`<div class="tm"><span class="badge">${b15?'15.1.5':'15.1.3'}</span> U = ${eng(V,'V',5)} rms (${eng(m.Vpk,'V',5)} κορυφή), ${eng(m.f,'Hz')}</div><ul class="eqs">
  <li>Χωρητικός: κ_C = (C_H + C_L${b15?' + C_καλ + C_παλμ':''})/C_H = <b>${fmt(kb,6)}</b>${b15?`, C_καλ = ℓ/(v·Z) = ${eng(m.Ccab,'F',4)}, και η R = 2 MΩ του παλμογράφου παράλληλα: ακριβής |Z_H + Z_L|/|Z_L| = ${fmt(kC,6)}`:''}</li>
  ${b15?'':`<li>Ωμικός: κ_R = (R_H + R_L)/R_L = <b>${fmt((m.RH+m.RL)/m.RL,6)}</b>. Για 9,1 V στο Ch1: R_L = R_H/(U/9,1 − 1) = ${eng(m.RH/(V/9.1-1),'Ω',4)}</li><li>Το ηλεκτροστατικό βολτόμετρο είναι παράλληλα στην υψηλή τάση και δείχνει την ενδεικνυόμενη τιμή της: <b>${eng(V,'V',4)}</b></li>`}</ul>`;
 if(!done)return h+'<p class="muted small">Τρέξε ως το τέλος για τη σύγκριση.</p>';
 const rows=[['τάση στον παλμογράφο'+(b15?'':' (χωρητικός, Ch2)'),b15?834.39e3/Math.SQRT2/kb:V/200,V/kC,V*r('V:CL'),'V']];
 if(!b15){rows.push(['τάση στον ωμικό (Ch1)',9.1,V*m.RL/(m.RH+m.RL),V*r('V:RL'),'V'],['ηλεκτροστατικό βολτόμετρο',100e3,V,V*r('V:ES'),'V']);}
 h+=cmp3(rows);
 if(b15){const vl=V/kC,need=m.CH*(V/500-1)-m.Ccab-m.Cs;h+=`<p class="${vl>500?'bad':'good'}">${eng(vl,'V',4)} ${vl>500?'>':'≤'} 500 V του παλμογράφου: ${vl>500?'η διάταξη δεν είναι κατάλληλη (όπως λέει και το βιβλίο). Χρειάζεται C_L ≥ '+eng(need,'F',4)+'.':'η διάταξη αρκεί.'}</p>`;}
 else h+='<p class="bad">Το βιβλίο γράφει 100 kV για το ηλεκτροστατικό βολτόμετρο. Το βολτόμετρο είναι παράλληλα στα 50 kV και δείχνει 50 kV.</p>';
 return h+'<p class="muted small">Η προσομοίωση δίνεται ως λόγος rms χαμηλής προς rms υψηλής τάσης στις δύο τελευταίες περιόδους, επί την ενδεικνυόμενη τιμή της πηγής.</p>';}
// 3.12: Schering bridge by phasors (nodes A under C_x, B under C₂, detector R_D between them) and the readings the balance relations give
function scheringTheory(){const s=S.sim,m=S.tutMeta||{};if(!s||!m.C2)return '';const w=2*Math.PI*m.f,V=[m.V,0],done=s.t>=m.dur*.98,T=s.T;
 const inv=z=>cx.div([1,0],z),Yx=inv([m.Rx,-1/(w*m.Cx)]),Y2=[0,w*m.C2],Y3=[1/m.R3,0],Y4=[1/m.R4,w*m.C4],YD=[1/m.RD,0];
 const a11=cx.add(cx.add(Yx,Y3),YD),a22=cx.add(cx.add(Y2,Y4),YD),b1=cx.mul(Yx,V),b2=cx.mul(Y2,V),det=cx.add(cx.mul(a11,a22),cx.mul(YD,YD).map(x=>-x));
 const VA=cx.div(cx.add(cx.mul(b1,a22),cx.mul(YD,b2)),det),VB=cx.div(cx.add(cx.mul(a11,b2),cx.mul(YD,b1)),det),VD=cx.add(VA,VB.map(x=>-x));
 const Cr=m.C2*m.R4/m.R3,tr=w*m.R4*m.C4,Rr=m.R3*m.C4/m.C2;
 let h=`<div class="tm"><span class="badge">Schering</span> C_x = ${eng(m.Cx,'F')}, tan δ = ${fmt(m.td,3)} (R_x = ${eng(m.Rx,'Ω',4)}) · C₂ = ${eng(m.C2,'F')} · C₄ = ${eng(m.C4,'F')} · R₃ = ${eng(m.R3,'Ω',5)} · R₄ = ${eng(m.R4,'Ω',5)}</div><ul class="eqs">
  <li>Ισορροπία Z_x·Z₄ = Z₂·Z₃: C_x = C₂·R₄/R₃, R_x = R₃·C₄/C₂, tan δ = ω·R₄·C₄ = ω·R_x·C_x</li>
  <li>Για το δοκίμιο: R_x = tan δ/(ω·C_x) = <b>${eng(m.td/(w*m.Cx),'Ω',4)}</b> (το βιβλίο γράφει 1,59 kΩ), R₄ = tan δ/(ω·C₄) = <b>${eng(m.R4f,'Ω',5)}</b>, R₃ = C₂·R₄/C_x = <b>${eng(m.R3f,'Ω',5)}</b></li>
  <li>Με τις ρυθμίσεις της γέφυρας οι σχέσεις ισορροπίας διαβάζουν C_x = <b>${eng(Cr,'F',4)}</b>, tan δ = <b>${fmt(tr,4)}</b>, R_x = ${eng(Rr,'Ω',4)}</li></ul>`;
 if(!done)return h+'<p class="muted small">Τρέξε ως το τέλος για τη σύγκριση.</p>';
 const sr=k=>phaseRms(k,T,2)/phaseRms('V:V1',T,2)*m.V;
 h+=cmpRows([['τάση κόμβου A (στην R₃)',cx.abs(VA),sr('V:R3'),'V'],['τάση ανιχνευτή',cx.abs(VD),sr('V:RD'),'V']]);
 const bal=cx.abs(VD)<1e-4*cx.abs(VA);
 h+=`<p class="${bal?'good':'bad'}">${bal?'✓ Η γέφυρα ισορροπεί: ο ανιχνευτής δείχνει '+fmt(100*cx.abs(VD)/cx.abs(VA),2)+' % της τάσης του κόμβου A.':'✗ Η γέφυρα δεν ισορροπεί: ο ανιχνευτής δείχνει '+fmt(100*cx.abs(VD)/cx.abs(VA),3)+' % της τάσης του κόμβου A.'}</p>`;
 if(m.set==='book')h+=`<p class="bad">Με τις τιμές του βιβλίου ο λόγος R₄/R₃ δίνει σωστά C_x = 2 nF, αλλά tan δ = ω·R₄·C₄ = ${fmt(tr,3)}: δέκα φορές μικρότερο. Το λάθος είναι η R_x = 1,59 kΩ αντί για 15,9 kΩ, που περνά στις R₃, R₄.</p>`;
 return h;}
// 4.19.1 (ROADMAP §68 point 6): a study of a network on the engine (pcl.network through the local server): what the engine proposes and
// why, the result in a few numbers, and its report as one HTML file («Εξαγωγή αναφοράς», from the report object of pcl.report)
const STUDY={key:null,busy:null,next:null,r:null,error:null,last:null,view:null,file:null,edits:[],netId:null,openError:null};
// 4.19.4 (ROADMAP §73, decision 273): the network of the study can come from a file (MATPOWER, PSS/E RAW, our JSON) instead of the
// list of the tutorial, and can be changed from its picture (a load, a generator, a rating, a branch out of service). The file and
// the changes are data of the request: the engine studies a copy of the network with the changes, and the picture keeps its places.
const studyNet=m=>STUDY.file?STUDY.file.name:m.net;
function studyQ(m){const id=STUDY.file?'file:'+STUDY.file.name:'case:'+m.net;if(STUDY.netId!==id){STUDY.netId=id;STUDY.edits=[];}
 const q=STUDY.file?{...(STUDY.file.feeder?{feeder:STUDY.file.feeder}:{network:STUDY.file.network}),study:m.study,options:m.options||{}}:{case:m.net,study:m.study,options:m.options||{}};if(STUDY.edits.length)q.edits=STUDY.edits;
 // 4.22 (ROADMAP §69): the places of a GeoJSON that was opened for this network, and the map
 if(STUDY.geo&&STUDY.geo.id===id){q.geojson=STUDY.geo.gj;if(STUDY.geo.len)q.geo_lengths=true;}else if(STUDY.geo)STUDY.geo=null;if(STUDY.map&&!STUDY.file?.feeder)q.map=true;
 if(m.emt)q.options=m.emt.kind==='spectrum'?{...q.options,spectra:emtSpectra(m.emt)}:{...q.options,emt:emtReadings(m.emt)};      // 4.21: what the run gives now (pcl.se.from_emt, pcl.harmonic.spectrum_from)
 return q;}
// 4.21: the Fourier blocks of the running simulation (magnitude, phase on sin from t = 0) as the spectrum of the loads that pcl.harmonic takes
function emtSpectra(e){const g=k=>S.sim?S.sim.now(k):NaN,n=x=>Number.isFinite(x)?x:null,four={};
 for(const [h,id] of Object.entries(e.orders))four[h]=[n(g('Y:'+id)),n(g('Y:'+id+':ph'))];return Object.fromEntries(e.loads.map(l=>[l,{fourier:four,ref:'sin'}]));}
// 4.21: the points of measurement of the running simulation (PMU3: the phasors of positive sequence, P⁺, Q⁺), as pcl.se.from_emt takes them
function emtReadings(e){const g=k=>S.sim?S.sim.now(k):NaN,n=x=>Number.isFinite(x)?x:null;
 return {plan:e.plan,ref:e.ref||'cos',...(e.bad&&e.bad!=='none'?{bad:e.bad}:{}),points:e.points.map(p=>({branch:p.branch,end:p.end,V:n(g('Y:'+p.id+'/SV')),thV:n(g('Y:'+p.id+'/TV')),
  I:n(g('Y:'+p.id+'/SI')),thI:n(g('Y:'+p.id+'/TI')),P:n(g('Y:'+p.id+'/PP')),Q:n(g('Y:'+p.id+'/QQ'))}))};}
const studyKey=m=>{studyQ(m);return JSON.stringify([m,STUDY.netId,STUDY.edits]);};
async function studyOpen(f){const m=S.tutMeta?.study;if(!f||!m||STUDY.busy)return;STUDY.busy='open';STUDY.openError=null;renderTheory();
 try{if(f.size>60e6)throw Error('Το αρχείο είναι πολύ μεγάλο.');const r=await api('network_open',{name:f.name,text:await f.text()});
  STUDY.file={name:r.summary.name,fileName:f.name,network:r.network,feeder:r.feeder,summary:r.summary};STUDY.r=null;STUDY.last=null;STUDY.view=null;$('#netview').hidden=true;NV.v?.destroy();NV.v=null;}
 catch(e){STUDY.openError=/fetch|NetworkError|Load failed/i.test(e.message)?'Το αρχείο διαβάζεται στο engine: ξεκίνα τον τοπικό server (python run.py) και δοκίμασε ξανά.':e.message;}
 STUDY.busy=null;renderTheory();}
const STUDY_LAB={pf:'Ροή φορτίου',n1:'N−1 σε AC',n1dc:'N−1, σάρωση DC',opf:'Βέλτιστη ροή φορτίου (AC)',dcopf:'Βέλτιστη ροή φορτίου (DC)',scopf:'Βέλτιστη ροή φορτίου με ασφάλεια N−1 (DC)',cpf:'Συνεχιζόμενη ροή φορτίου (καμπύλη P–V)',se:'Εκτίμηση κατάστασης',harmonic:'Αρμονική ροή φορτίου',unbalanced:'Ασύμμετρη (τριφασική) ροή φορτίου',acdc:'Ροή φορτίου AC/DC'};
const UNB_REG={given:'δοσμένες λήψεις',control:'λήψεις από τον έλεγχο',neutral:'λήψεις στο μηδέν'};
const SE_KIND={V:'τάση',P:'έγχυση P',Q:'έγχυση Q',Pf:'ροή P',Qf:'ροή Q',Pt:'ροή P (άκρο «προς»)',Qt:'ροή Q (άκρο «προς»)',Vr:'φασιθέτης τάσης (Re)',Vi:'φασιθέτης τάσης (Im)',
  Ifr:'φασιθέτης ρεύματος (Re)',Ifi:'φασιθέτης ρεύματος (Im)',Itr:'φασιθέτης ρεύματος, «προς» (Re)',Iti:'φασιθέτης ρεύματος, «προς» (Im)',If:'|I|',It:'|I| (άκρο «προς»)'},
 SE_PLAN={scada:'τάση στις γεννήτριες, εγχύσεις, ροές στο ένα άκρο',all:'παντού',flows:'μόνο ροές',tree:'ροές ενός δέντρου','emt-pmu':'από το EMT, φασιθέτες (PMU)','emt-scada':'από το EMT, |V|, P, Q',
  'emt-mixed':'από το EMT, |V|, P, Q και ένας φασιθέτης τάσης','emt-current':'από το EMT, |V|, P, |I| και φασιθέτες τάσης'},
 SE_BAD={flow:'μία ροή 20σ πάνω',injection:'μία έγχυση 20σ κάτω',voltage:'μία τάση 20σ πάνω',two:'ροή και έγχυση μαζί',phasor:'ένας φασιθέτης τάσης 20σ πάνω',current:'ένα |I| 20σ πάνω'};
const STUDY_METHOD={nr:'αραιός Newton–Raphson',nr_dense:'πυκνός Newton–Raphson',nr_ci:'Newton με εγχύσεις ρεύματος',fdxb:'fast-decoupled XB',fdbx:'fast-decoupled BX',sweep:'εμπρός–πίσω σάρωση',sweepc:'εμπρός–πίσω σάρωση με αντιστάθμιση',gs:'Gauss–Seidel',dc:'DC (γραμμική προσέγγιση)'};
async function studyAct(what){const m=S.tutMeta?.study;if(!m)return;
 // 5.0.1: a press while the engine still runs a study of another network (the network or the study changed meanwhile) waits for it and runs next
 if(STUDY.busy){if(STUDY.busy!=='open'&&['run','view','report'].includes(what)&&studyKey(m)!==STUDY.key){STUDY.next=what;renderTheory();}return;}
 if(what==='open'){const i=$('#study-open');i.value='';i.click();return;}
 if(what==='close'){STUDY.file=null;STUDY.error=null;STUDY.openError=null;$('#netview').hidden=true;NV.v?.destroy();NV.v=null;renderTheory();return;}
 if(what==='noedits'){STUDY.edits=[];STUDY.error=null;if(!$('#netview').hidden)what='view';else{renderTheory();return;}}
 if(m.emt&&!(S.sim&&S.sim.t>=2/(m.emt.f||50)-1e-9)&&what!=='view'){STUDY.error='Τρέξε πρώτα την προσομοίωση για δύο περιόδους τουλάχιστον: τα σημεία μέτρησης δίνουν τους φασιθέτες στο τέλος κάθε περιόδου, και η μελέτη παίρνει ό,τι δίνουν εκείνη τη στιγμή.';renderTheory();return;}
 const key=studyKey(m);if(STUDY.key!==key){STUDY.r=null;STUDY.last=null;STUDY.view=null;}STUDY.key=key;
 // 4.19.4: «Διάγραμμα του δικτύου» shows the network that was studied; if the study has not run yet, it runs first
 if(what==='view'&&STUDY.view){netViewOpen();return;}
 STUDY.busy=what;STUDY.error=null;renderTheory();
 try{const q=studyQ(m);
  // 4.21: m.layer, the layer the picture opens with
  if(what==='report'){const r=await api('network_report',q);STUDY.r={summary:r.summary,study:m.study};STUDY.last=r.name;download(r.name,r.html,'text/html');}
  else{const r=await api('network_study',{...q,view:'only',...(m.layer?{layer:m.layer}:{})});STUDY.r={summary:r.summary,study:r.study,network:r.network};STUDY.view=r.view?{view:r.view,layers:r.layers,layer:r.layer,q,edit:r.edit,done:r.network.edits||[],name:studyNet(m),id:STUDY.netId+(q.map?':map':''),geo:r.geo||null,geoIn:r.network.geo||null}:null;}}
 catch(e){STUDY.r=null;STUDY.error=/fetch|NetworkError|Load failed/i.test(e.message)?'Η μελέτη τρέχει στο engine: ξεκίνα τον τοπικό server (python run.py) και δοκίμασε ξανά.':e.message;}
 // 5.0.1: the picture opens only if the tutorial still asks for the network that was studied
 STUDY.busy=null;const now=S.tutMeta?.study,same=!!now&&studyKey(now)===key,nx=STUDY.next;STUDY.next=null;
 if(same){renderTheory();if(what==='view'&&STUDY.view)netViewOpen();else if(STUDY.view&&!$('#netview').hidden)netViewOpen();}
 if(nx&&now)studyAct(nx);else if(!same)renderTheory();}
// the window of the viewer (netview.js): the layers the study can feed, names, a bus by its name, the picture as SVG or DXF
// 5.0.6 (ROADMAP §94 step γ, decision 371): the diagram is a card of the page, a document of the central area: the first time
// it opens it goes as a tab next to the circuit (Dock.firstAs), in the place of the circuit, with the circuit one click away;
// after that it stays where the user puts it (a tab, side by side with «◫», a region, a window of its own)
const NV={v:null,id:null,sel:null,area:{ids:[],res:null,net:null,t:0,seq:0,back:null}};
function netViewOpen(){const d=STUDY.view;if(!d)return;if(!window.NetView){notice('Το διάγραμμα του δικτύου δεν φορτώθηκε στη σελίδα (netview.js). Ξαναφόρτωσέ τη με Ctrl+F5.','error');return;}const box=$('#netview');
 const was=!box.hidden&&box.getClientRects().length>0&&!box.classList.contains('dk-off');box.hidden=false;window.Dock?.firstAs('netview','circuit');window.Dock?.reveal('netview');
 if(!was)box.scrollIntoView({block:'nearest'});
 const keep=NV.v&&NV.id===d.id?{tr:NV.v.state.fitted?null:NV.v.state.tr,layer:NV.v.state.layer,names:NV.v.state.names,mode:NV.v.state.mode}:null;NV.v?.destroy();NV.id=d.id;
 $('#nv-title').textContent=`Δίκτυο της μελέτης: ${d.name} · ${STUDY_LAB[d.q.study]||d.q.study} · ${d.view.buses.length} ζυγοί, ${d.view.branches.length} κλάδοι${d.view.dc?(()=>{const dd=d.view.dc.lines.filter(e=>e.kind==='dcdc').length;return `, ${d.view.dc.buses.length} ζυγοί DC, ${d.view.dc.lines.length-dd} γραμμές DC${dd?`, ${dd} ${dd===1?'μετατροπέας':'μετατροπείς'} DC/DC`:''}, ${d.view.dc.stations.length} σταθμοί μετατροπέα`;})():''}`;      // 4.21: the DC/DC converters apart
 const v=NV.v=NetView.create($('#nv-canvas'),d,{tr:keep?.tr,layer:keep?.layer,pick:q=>nvEdit(q),select:ids=>areaChosen(ids),info:t=>{$('#nv-info').textContent=t||'Σύρε για μετακίνηση, ροδέλα για μεγέθυνση, δείξε έναν ζυγό ή έναν κλάδο για τα μεγέθη του, κάνε κλικ για να τον αλλάξεις.';}});
 areaBind(v,d,keep);
 const legend=()=>{const L=v.legend();$('#nv-legend').innerHTML=`<b>${esc(L.title)}</b>`+L.items.map(([c,t])=>`<i style="background:${esc(c)}"></i>${esc(t)}`).join('');};
 $('#nv-layer').innerHTML=v.layers().map(L=>`<option value="${esc(L.layer)}" ${L.layer===v.state.layer?'selected':''}>${esc(L.title)}</option>`).join('');$('#nv-names').value=keep?.names||'auto';if(keep)v.setNames(keep.names);else $('#nv-find').value='';legend();
 $('#nv-layer').onchange=e=>{v.setLayer(e.target.value);legend();};$('#nv-names').onchange=e=>v.setNames(e.target.value);
 $('#nv-fit').onclick=()=>v.fit();$('#nv-in').onclick=()=>v.zoom(1.5);$('#nv-out').onclick=()=>v.zoom(1/1.5);
 $('#nv-find').onchange=e=>{const ok=v.goto(e.target.value.trim());e.target.classList.toggle('bad',!ok&&!!e.target.value.trim());};
 const file=async(action,extra)=>{try{const r=await api(action,{...d.q,...extra});download(r.name,r.text,r.mime);}catch(e){$('#nv-info').textContent=e.message;}};
 // 4.22 (ROADMAP §69): the map when every bus has a place; the places from a GeoJSON; the network as GeoJSON with the results
 const G=d.geo||{};$('#nv-maplab').hidden=!G.map;$('#nv-map').checked=!!d.q.map;$('#nv-geojson').hidden=!(G.buses>0);$('#nv-geolen').checked=!!STUDY.geo?.len;
 $('#nv-map').onchange=e=>{STUDY.map=e.target.checked;STUDY.view=null;studyAct('view');};
 $('#nv-geojson').onclick=()=>file('network_view',{format:'geojson'});
 $('#nv-geoin').onclick=()=>{const i=$('#nv-geofile');i.value='';i.click();};
 $('#nv-geofile').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;let gj;try{gj=JSON.parse(await f.text());}catch(x){$('#nv-info').textContent='Το αρχείο δεν είναι JSON.';return;}
  STUDY.geo={id:STUDY.netId,gj,len:$('#nv-geolen').checked,name:f.name};STUDY.view=null;studyAct('view');};
 if(d.geoIn){const g=d.geoIn,L=g.lengths||[];$('#nv-info').textContent=`GeoJSON${STUDY.geo?.name?' «'+STUDY.geo.name+'»':''}: θέσεις ${g.buses} ζυγών, ${g.routes} διαδρομές`+(L.length?`, ${L.length} γραμμές με το μήκος της διαδρομής τους`:'')+(g.unknown?.length?` · χωρίς αντιστοίχιση: ${g.unknown.slice(0,6).join(', ')}${g.unknown.length>6?'…':''}`:'')+'.';}
 if(d.view.geo)$('#nv-title').textContent+=` · χάρτης (Web Mercator, σφάλμα κλίμακας ως ${fmt(100*d.view.geo.scale_err,2)} % στις άκρες)`;
 $('#nv-svg').onclick=()=>file('network_view',{format:'svg',layer:v.state.layer});$('#nv-dxf').onclick=()=>file('network_view',{format:'dxf',layer:v.state.layer});
 $('#nv-save').onclick=()=>file('network_save',{format:$('#nv-savefmt').value});
 $('#nv-close').onclick=()=>{box.hidden=true;NV.v?.destroy();NV.v=null;NV.sel=null;};
 // the changes made so far, one sentence each (as the engine says them), each with its own undo
 $('#nv-edits').innerHTML=d.done.length?`<b>Αλλαγές στο δίκτυο (${d.done.length}):</b> `+d.done.map((t,i)=>`<span class="nv-chip">${esc(t)} <button data-nv-drop="${i}" title="Αναίρεση αυτής της αλλαγής">✕</button></span>`).join(' ')+' <button id="nv-noedits">Αναίρεση όλων</button>':'';
 $('#nv-edits').hidden=!d.done.length;$('#nv-edits').onclick=e=>{const b=e.target.closest('[data-nv-drop]');if(b){STUDY.edits=STUDY.edits.filter((x,i)=>i!==+b.dataset.nvDrop);studyAct('view');}else if(e.target.id==='nv-noedits')studyAct('noedits');};
 // the bus or the branch that was being changed stays selected, with its new values
 const sel=NV.sel&&keep?(NV.sel.kind==='bus'?(i=>i===undefined?null:{kind:'bus',i,bus:d.view.buses[i]})(v.model.ix.get(NV.sel.bus.id)):NV.sel.kind==='branch'?(j=>j<0?null:{kind:'branch',j,branch:d.view.branches[j]})(d.view.branches.findIndex(e=>e.name===NV.sel.branch.name)):null):null;nvEdit(sel);}
// the panel of a bus (its load, its generators) or of a branch (its rating, out of service); only what was changed becomes a change
function nvEdit(q){const box=$('#nv-edit'),d=STUDY.view;NV.sel=q;if(!q||!d||!d.edit||(q.kind!=='bus'&&q.kind!=='branch')){box.hidden=true;box.innerHTML='';return;}   // (4.20.1: the DC grid only in the info line)
 const E=d.edit,n=x=>x===null||x===undefined?'':String(x);let h;
 if(q.kind==='bus'){const id=q.bus.id,L=E.load[id]||[0,0],G=E.gen[id]||[];
  h=`<b>Ζυγός ${esc(id)}</b><label>Φορτίο P <input data-nv="P" type="number" step="any" value="${n(L[0])}"> MW</label><label>Q <input data-nv="Q" type="number" step="any" value="${n(L[1])}"> Mvar</label>`
   +G.map(g=>`<span class="nv-gen" data-gen="${esc(g[0])}"><b>${esc(g[0])}</b>${g[5]?' (ζυγός ταλάντωσης)':`<label>P <input data-nv="gP" type="number" step="any" value="${n(g[1])}"> MW${g[4]!==null?' (ως '+fmt(g[4],4)+')':''}</label>`}${g[2]!==null?`<label>V <input data-nv="gV" type="number" step="any" value="${n(g[2])}"> pu</label>`:''}</span>`).join('');}
 else{const e=q.branch,r=E.rating[e.name.split('#')[0]];
  h=`<b>${e.trafo?'Μετασχηματιστής':'Κλάδος'} ${esc(e.name)}</b><span>${esc(e.a)} – ${esc(e.b)}</span><label>Όριο <input data-nv="rating" type="number" step="any" min="0" value="${n(r)}" placeholder="χωρίς όριο"> MVA</label><label><input data-nv="off" type="checkbox" ${e.off?'checked':''}> εκτός λειτουργίας</label>`;}
 box.innerHTML=h+'<button id="nv-apply" title="Η αλλαγή γίνεται σε αντίγραφο του δικτύου· η μελέτη τρέχει ξανά και το διάγραμμα μένει στη θέση του">Εφάρμοσε και τρέξε ξανά</button><span id="nv-edit-msg" class="bad small"></span>';box.hidden=false;
 $('#nv-apply').onclick=()=>nvApply(q);}
function nvApply(q){const box=$('#nv-edit'),E=STUDY.view.edit,num=el=>{if(!el)return null;const t=el.value.trim().replace(',','.');return t===''?null:Number(t);};
 const same=(x,e)=>x.op===e.op&&(e.op==='load'?x.bus===e.bus:e.op==='gen'?x.name===e.name:e.op==='rating'?x.branch===e.branch:x.element===e.element);
 const put=(e,drop)=>{const old=STUDY.edits.find(x=>same(x,e));STUDY.edits=STUDY.edits.filter(x=>!same(x,e));if(!drop)STUDY.edits.push(e.op==='gen'?{...old,...e}:e);};
 let n=0,bad=false;const chk=x=>{if(x!==null&&!Number.isFinite(x))bad=true;return x;},prev=STUDY.edits.slice();
 if(q.kind==='bus'){const id=q.bus.id,L=E.load[id]||[0,0],P=chk(num(box.querySelector('[data-nv="P"]'))),Q=chk(num(box.querySelector('[data-nv="Q"]')));
  if(!bad&&P!==null&&Q!==null&&(P!==L[0]||Q!==L[1])){put({op:'load',bus:id,P_MW:P,Q_Mvar:Q});n++;}
  box.querySelectorAll('.nv-gen').forEach(sp=>{const g=(E.gen[id]||[]).find(x=>x[0]===sp.dataset.gen);if(!g)return;const p=chk(num(sp.querySelector('[data-nv="gP"]'))),v=chk(num(sp.querySelector('[data-nv="gV"]'))),e={op:'gen',name:g[0]};
   if(p!==null&&p!==g[1])e.P_MW=p;if(v!==null&&v!==g[2])e.V_pu=v;if(!bad&&('P_MW' in e||'V_pu' in e)){put(e);n++;}});}
 else{const e=q.branch,name=e.name.split('#')[0],r0=E.rating[name]??null,r=chk(num(box.querySelector('[data-nv="rating"]'))),off=box.querySelector('[data-nv="off"]').checked;
  if(off!==!!e.off){put({op:'outage',element:name},!off);n++;}
  if(!bad&&!off&&!e.off&&r!==r0){put({op:'rating',branch:name,rating_MVA:r});n++;}}
 if(bad){$('#nv-edit-msg').textContent='Δώσε αριθμούς.';return;}
 // a change the engine refuses (or a study that fails with it) is taken back: the picture returns to what it showed, with the reason
 if(n){STUDY.error=null;studyAct('view').then(async()=>{if(!STUDY.error)return;const why=STUDY.error;STUDY.edits=prev;await studyAct('view');const el=$('#nv-edit-msg');if(el)el.textContent='Η αλλαγή δεν έγινε: '+why;});}}
// 5.0.6 (ROADMAP §94 step γ, §95 point 2, §96 B.1, open 4 of 5.0.3): the study area chosen on the diagram (Shift + click,
// a window, a lasso), its boundary as the engine finds it (pcl.study.area), the full network against the area with the
// equivalent in N−1, and the area as a circuit in EMT with the rest of the network as one EQV3 (in the place of the circuit,
// with «↶ Πίσω» to the circuit of before). The choice stays while the diagram shows the same network.
const AREA_SLACK={internal:'μέσα στην περιοχή',boundary:'στο σύνορο',external:'έξω· γίνεται ζυγός ταλάντωσης ένας ζυγός του συνόρου'};
function areaBind(v,d,keep){const A=NV.area,net=d.id;if(A.net!==net){A.ids=[];A.res=null;A.net=net;$('#nv-cmp').hidden=true;$('#nv-cmp').innerHTML='';}
 v.setMode(keep?.mode||'pan');for(const b of document.querySelectorAll('#nv-area [data-nv-mode]')){const on=b.dataset.nvMode===v.state.mode;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on));}
 if(A.ids.length){v.setSelection(A.ids,true);if(A.res&&!A.res.error)v.setBoundary(A.res.boundary);}
 $('#nv-area').onclick=e=>{const m=e.target.closest('[data-nv-mode]');if(m){NV.v?.setMode(m.dataset.nvMode);for(const b of document.querySelectorAll('#nv-area [data-nv-mode]')){const on=b===m;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on));}return;}
  if(e.target.id==='nv-area-clear')NV.v?.clearSelection();else if(e.target.id==='nv-cmp-run')areaCompare();else if(e.target.id==='nv-emt')areaEmt();else if(e.target.id==='nv-back')areaBack();};
 $('#nv-fig').onchange=()=>areaShow();
 areaShow();}
// a change of the choice: the boundary from the engine, a moment after the last change
function areaChosen(ids){const A=NV.area;A.ids=ids;A.res=null;$('#nv-cmp').hidden=true;clearTimeout(A.t);areaShow();if(!ids.length)return;A.t=setTimeout(()=>areaSplit(),160);}
async function areaSplit(){const A=NV.area,d=STUDY.view;if(!d||!A.ids.length)return;const seq=++A.seq,ids=A.ids.slice();A.busy='split';areaShow();
 try{const r=await api('network_area',{...d.q,buses:ids,what:'split'});if(seq!==A.seq)return;A.res=r;NV.v?.setBoundary(r.boundary);}
 catch(e){if(seq!==A.seq)return;A.res={error:e.message};NV.v?.setBoundary([]);}
 A.busy=null;areaShow();}
function areaShow(){const A=NV.area,r=A.res,n=A.ids.length,ok=!!r&&!r.error&&!A.busy,list=b=>b.slice(0,8).map(esc).join(', ')+(b.length>8?` … (${b.length})`:'');
 let h;if(A.busy==='compare')h='Ροή φορτίου του πλήρους δικτύου και της περιοχής, για κάθε κλάδο εκτός…';else if(A.busy==='emt')h='Το κύκλωμα της περιοχής σε EMT…';
 else if(!n)h='Διάλεξε ζυγούς: Shift + κλικ, Shift + σύρσιμο για παράθυρο, Ctrl + σύρσιμο για λάσο.';
 else if(A.busy||!r)h=`<b class="ar-c">${n}</b> ζυγοί· το σύνορο από το engine…`;
 else if(r.error)h=`<b class="ar-c">${n}</b> ζυγοί · <span class="bad">${esc(r.error)}</span>`;
 else h=`<b class="ar-c">${r.internal.length+r.boundary.length}</b> ζυγοί: ${r.internal.length} μέσα, σύνορο <b class="ar-b">${list(r.boundary)}</b> · ${r.external} έξω · ${r.branches} κλάδοι στην περιοχή · ο ζυγός ταλάντωσης ${AREA_SLACK[r.slack]||r.slack}`;
 if(A.back)h+=` · <button id="nv-back" title="Το κύκλωμα και το tutorial που ήταν πριν από «⚡ Η περιοχή σε EMT»">↶ Πίσω στο «${esc(A.back.title)}»</button>`;
 // 5.0.7: Fig. 15a is for one boundary bus, with the top of the scan beside it
 const fa=$('#nv-fig').value==='15a',fd=$('#nv-fig').value==='fdne',one=ok&&r.boundary.length===1;$('#nv-fmax-l').hidden=!fa&&!fd;$('#nv-passive-l').hidden=!fd;   // 5.0.9: and the FDNE
 if(fa&&ok&&!one)h+=` · <span class="bad">το Σχ. 15a θέλει έναν ζυγό στο σύνορο (εδώ ${r.boundary.length})</span>`;
 $('#nv-area-info').innerHTML=h;$('#nv-area-info').classList.toggle('muted',!n&&!A.back);$('#nv-cmp-run').disabled=!ok;$('#nv-emt').disabled=!ok||(fa&&!one);$('#nv-area-clear').disabled=!n;}
// the full network against the area with its equivalent: the base case and every branch of the area out (pcl.equivalent.compare)
async function areaCompare(){const A=NV.area,d=STUDY.view;if(!d||!A.res||A.res.error)return;const kind=$('#nv-eqkind').value,ids=A.ids.slice(),seq=A.seq;A.busy='compare';areaShow();
 let r=null,err='';try{r=await api('network_area',{...d.q,buses:ids,what:'compare',kind});}catch(e){err=e.message;}
 A.busy=null;areaShow();if(seq!==A.seq)return;const box=$('#nv-cmp');box.hidden=false;box.classList.remove('fz');
 if(err){box.innerHTML=`<p class="bad">${esc(err)}</p>`;return;}
 const c=r.compare,f=(x,k)=>x===null||x===undefined?'—':Math.abs(x)<1e-9?'< 10⁻⁹':fmt(x,k),rows=[{outage:'βασικό σημείο',...c.base,base:true},...c.outages];
 const ok=c.outages.filter(o=>!o.error),worst=ok.length?ok.reduce((a,b)=>b.dV>a.dV?b:a):null;
 box.innerHTML=`<div class="small"><b>Πλήρες δίκτυο απέναντι σε περιοχή + ${kind==='xward'?'extended Ward':'Ward'}</b> (σύνορο ${r.boundary.map(esc).join(', ')}${r.fictitious?`, ${r.fictitious} πλασματικοί ζυγοί PV`:''}${r.slack_bus?`, ζυγός ταλάντωσης ο ${esc(r.slack_bus)}`:''}):`
  +` στο βασικό σημείο ΔV = ${f(c.base.dV,3)} pu${worst?` · στη χειρότερη διαταραχή (${esc(worst.outage)}) ΔV = <b>${f(worst.dV,4)}</b> pu, Δθ = ${f(worst.dA,4)}°, ΔP = ${f(worst.dP,4)} MW`:''}.`
  +` Οι διαφορές είναι οι μεγαλύτερες στους ζυγούς που κρατιούνται και στις ροές των κλάδων της περιοχής.</div>`
  +`<table><thead><tr><th>Κλάδος εκτός</th><th>ΔV (pu)</th><th>Δθ (°)</th><th>ΔP (MW)</th></tr></thead><tbody>`
  +rows.map(o=>`<tr class="${o===worst?'worst':''}"><td>${o.base?'<i>βασικό σημείο</i>':esc(o.outage)}</td>${o.error?`<td colspan="3" class="muted">${o.error==='no convergence'?'χωρίς σύγκλιση (νησίδα ή όριο)':esc(o.error)}</td>`:`<td>${f(o.dV,4)}</td><td>${f(o.dA,4)}</td><td>${f(o.dP,4)}</td>`}</tr>`).join('')+'</tbody></table>';}
// the area as a circuit in EMT (Network.to_emt with the boundary): in the place of the circuit, like a file that opens
async function areaEmt(){const A=NV.area,d=STUDY.view;if(!d||!A.res||A.res.error)return;const fig=$('#nv-fig').value,ids=A.ids.slice();A.busy='emt';areaShow();
 const extra=fig==='15a'?{fmax:+$('#nv-fmax').value||2000}:fig==='fdne'?{fmax:+$('#nv-fmax').value||2000,passive:$('#nv-passive').checked}:{};
 let r=null;try{r=await api('network_area',{...d.q,buses:ids,what:'emt',fig,...extra});}catch(e){A.busy=null;areaShow();$('#nv-area-info').insertAdjacentHTML('beforeend',` · <span class="bad">${esc(e.message)}</span>`);return;}
 A.busy=null;if(!A.back)A.back={pr:project(),tut:S.tut,tutRef:S.tutRef,meta:S.tutMeta,title:tutorial().title};
 S.tut={id:'empty',options:{}};S.tutMeta=null;S.tutRef=null;applyProject(r.project);renderTutorial();runTheory();runMath();window.Dock?.reveal('circuit');$('#bench-card').scrollIntoView({block:'nearest'});areaShow();
 const q=r.project.meta?.equivalent;notice(`Η περιοχή σε EMT: ${r.internal.length+r.boundary.length} ζυγοί, και το υπόλοιπο δίκτυο ως ένα «Ισοδύναμο δικτύου» (EQV3, ${fig==='50'?'θεμελιώδης':fig==='fdne'?'FDNE':'Σχ. '+fig}) στους ζυγούς ${r.boundary.map(esc).join(', ')}`
  +(q?.Sk?` · S″k ${q.Sk.map(x=>fmt(x/1e6,4)).join(', ')} MVA`:'')+(r.foster?` · ${r.foster.blocks.length} κλάδοι Foster, απόκλιση από τη σάρωση ${fmt(100*r.foster.err1.rms,2)} % (θετική) και ${fmt(100*r.foster.err0.rms,2)} % (μηδενική ακολουθία)`:'')
  +(r.fdne?` · FDNE με ${r.fdne.terms} όρους, απόκλιση των Z_kk από τη σάρωση ${fmt(100*r.fdne.err1.rms,2)} % (θετική) και ${fmt(100*r.fdne.err0.rms,2)} % (μηδενική ακολουθία), ${r.fdne.is_passive?'παθητικό':'όχι παθητικό'}`:'')
  +'. «↶ Πίσω» στο διάγραμμα φέρνει το κύκλωμα που ήταν.','info');
 if(r.foster)fosterShow(r.foster,r.boundary[0]);if(r.fdne)fdneShow(r.fdne,r.boundary);}
// 5.0.7 (§45): the scan of the network beyond the boundary against the Foster circuit of Fig. 15a, and its blocks
function fosterPlot(F){const W=560,H=210,m={l:52,r:10,t:10,b:30},f=F.f,lx=Math.log10,all=[...F.Z1,...F.Z0,...F.Z1fit,...F.Z0fit].filter(v=>v>0);
 const x0=lx(f[0]),x1=lx(f[f.length-1]),y0=Math.floor(lx(Math.min(...all))),y1=Math.ceil(lx(Math.max(...all)));
 const X=v=>m.l+(lx(v)-x0)/(x1-x0)*(W-m.l-m.r),Y=v=>H-m.b-(lx(Math.max(v,1e-300))-y0)/Math.max(y1-y0,1e-9)*(H-m.t-m.b);
 const line=(z,c,dash)=>`<polyline fill="none" stroke="${c}" stroke-width="1.6"${dash?' stroke-dasharray="5 3"':''} points="${f.map((v,i)=>X(v).toFixed(1)+','+Y(z[i]).toFixed(1)).join(' ')}"/>`;
 let g='';for(let e=Math.ceil(x0);e<=Math.floor(x1);e++){const x=X(10**e);g+=`<line x1="${x}" x2="${x}" y1="${m.t}" y2="${H-m.b}" class="fz-grid"/><text x="${x}" y="${H-m.b+14}" text-anchor="middle">${10**e>=1000?10**e/1000+' k':10**e}</text>`;}
 for(let e=y0;e<=y1;e++){const y=Y(10**e);g+=`<line x1="${m.l}" x2="${W-m.r}" y1="${y}" y2="${y}" class="fz-grid"/><text x="${m.l-4}" y="${y+4}" text-anchor="end">10${e<0?'⁻':''}${String(Math.abs(e)).split('').map(c=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[c]).join('')}</text>`;}
 return `<svg class="fz-plot" viewBox="0 0 ${W} ${H}" role="img" aria-label="|Z₁| και |Z₀| του υπόλοιπου δικτύου απέναντι στους κλάδους Foster">${g}`
  +line(F.Z1,'#1f77b4')+line(F.Z1fit,'#1f77b4',1)+line(F.Z0,'#d95f02')+line(F.Z0fit,'#d95f02',1)
  +`<text x="${W/2}" y="${H-2}" text-anchor="middle">f (Hz)</text><text x="12" y="${m.t+8}">Ω</text></svg>`;}
function fosterShow(F,bus){const box=$('#nv-cmp'),e=x=>fmt(100*x,2)+' %',u=(v,k,d)=>v>0?fmt(v*k,d):'—';box.hidden=false;box.classList.add('fz');
 box.innerHTML=`<div class="small"><b>Σχ. 15a στον ζυγό ${esc(bus)}</b>: ${F.blocks.length} κλάδοι (L + R′) ∥ (C + R″) ∥ R_p σε σειρά${F.pure?' (χωρίς R_p, όπως το σχήμα)':''}, από τη σάρωση ${fmt(F.f[0],3)} – ${fmt(F.f[F.f.length-1],5)} Hz`
  +` (γραμμές ${F.line==='pi'?'ως ένα π η καθεμία, όπως στο πλήρες δίκτυο σε EMT':'με κατανεμημένες παραμέτρους'}). Απόκλιση |ΔZ|/|Z|: θετική ακολουθία <b>${e(F.err1.rms)}</b> rms, ${e(F.err1.max)} το πολύ (στα ${fmt(F.err1.fmax,4)} Hz), ${e(F.err1.f0)} στη θεμελιώδη·`
  +` μηδενική <b>${e(F.err0.rms)}</b> rms, ${e(F.err0.max)} το πολύ. Κορυφές της |Z₁|: ${F.peaks.length?F.peaks.map(v=>fmt(v,4)).join(', ')+' Hz':'καμία'}.</div>`
  +fosterPlot(F)+`<div class="small fz-key"><span style="color:#1f77b4">━ |Z₁| της σάρωσης ┅ των κλάδων</span> · <span style="color:#d95f02">━ |Z₀| ┅ των κλάδων</span></div>`
  +`<table><thead><tr><th>#</th><th>L₁ (mH)</th><th>R′₁ (Ω)</th><th>L₀ (mH)</th><th>R′₀ (Ω)</th><th>C (µF)</th><th>R″ (Ω)</th><th>R_p₁ (Ω)</th><th>R_p₀ (Ω)</th></tr></thead><tbody>`
  +F.blocks.map((b,i)=>`<tr><td>${i+1}</td><td>${fmt(b[0]*1e3,4)}</td><td>${u(b[1],1,4)}</td><td>${fmt(b[2]*1e3,4)}</td><td>${u(b[3],1,4)}</td><td>${u(b[4],1e6,4)}</td><td>${u(b[5],1,4)}</td><td>${u(b[6],1,4)}</td><td>${u(b[7],1,4)}</td></tr>`).join('')+'</tbody></table>';}
// 5.0.9 (§47): the FDNE against the scan: the driving-point impedance of every port (as the plot of the Foster circuit), the errors
// and the passivity check
function fdneShow(F,buses){const box=$('#nv-cmp'),e=x=>fmt(100*x,2)+' %',lam=v=>v>=0?'≥ 0':fmt(v,2);box.hidden=false;box.classList.add('fz');
 box.innerHTML=`<div class="small"><b>FDNE στους ζυγούς ${buses.map(esc).join(', ')}</b>: σχήμα π με κλάδους RL, RLC σε σειρά και L σε σειρά με C ∥ G σε κάθε ακολουθία${F.pure?' (μόνο οι κλάδοι του module: ένας RC, ένας RL, RLC σε σειρά)':''}, ${F.k} ζεύγη πόλων κοινά σε όλα τα στοιχεία, ${F.terms} όροι, από τη σάρωση ${fmt(F.f[0],3)} – ${fmt(F.f[F.f.length-1],5)} Hz.`
  +` Απόκλιση των Z_kk: θετική ακολουθία <b>${e(F.err1.rms)}</b> rms, ${e(F.err1.max)} το πολύ (στα ${fmt(F.err1.fmax,4)} Hz), ${e(F.err1.f0)} στη θεμελιώδη· μηδενική <b>${e(F.err0.rms)}</b> rms, ${e(F.err0.max)} το πολύ.`
  +` Παθητικότητα (η μικρότερη ιδιοτιμή του Re Y προς τη μεγαλύτερη, από f_min/10 ως 10·f_max): ${lam(F.lam1)} και ${lam(F.lam0)}, <b>${F.is_passive?'παθητικό':'όχι παθητικό'}</b>${F.passive?` (διόρθωση με ${F.moved} περιορισμούς)`:''}.</div>`
  +F.ports.map((P,k)=>`<div class="small"><b>${esc(buses[k])}</b></div>`+fosterPlot({f:F.f,...P})).join('')
  +`<div class="small fz-key"><span style="color:#1f77b4">━ |Z₁,kk| της σάρωσης ┅ του FDNE</span> · <span style="color:#d95f02">━ |Z₀,kk| ┅ του FDNE</span></div>`;}
function areaBack(){const A=NV.area,b=A.back;if(!b)return;A.back=null;S.tut=b.tut;S.tutRef=b.tutRef;S.tutMeta=b.meta;applyProject(b.pr);renderTutorial();runTheory();runMath();notice('');areaShow();}
// 4.20: the DC grid of five terminals: the card of the AC/DC load flow (the same grid in the engine, after the same event) and
// the values of the EMT now, side by side, terminal by terminal
function mtdcTheory(){const m=S.tutMeta?.study,q=m&&STUDY.key===studyKey(m)?STUDY.r?.summary:null,y=k=>S.sim?S.sim.now(k):NaN;
 return studyTheory()+`<div class="small" id="mtdc-emt"><b>EMT τώρα</b> (t = ${fmt(S.sim?S.sim.t:0,4)} s)${q?' και ροή φορτίου AC/DC μετά το συμβάν':' · «▶ Τρέξε τη μελέτη» για τη ροή φορτίου'}:<ul class="eqs">${[1,2,3,4,5].map(k=>{const d=q?.dc?.find(z=>z.bus===String(k));
  return `<li class="mtdc-row">Σταθμός ${k}: U = <b>${fmt(y('Y:VM'+k)/1e3,7)}</b> kV, P = <b>${fmt(y('Y:PW'+k),6)}</b> MW${d?` · ροή φορτίου ${fmt(d.U_kV,7)} kV, ${fmt(d.P_MW,6)} MW`:''}</li>`;}).join('')}</ul></div>`;}
// 4.21: the DC/DC converter of Example 30.3 (tutorial dcdc_ex303): the steady states of the DC load flow (pcl.dcgrid with the
// DC/DC converter as one element) in closed form, before and after the event, beside the EMT now. Side a: 370 kV behind 1 Ω,
// side b: E_b (400, or 395 kV after the event) behind 2 Ω; the power P from a to b: P = −v_b·(E_b − v_b)/2 and v_a·(v_a − 370 kV)/1 = −P.
function dcdcSteady(ctl,Eb){const P0=-595.5e6,U0=397e3,R=2e5;let vb=U0;
 if(ctl==='P')vb=(Eb+Math.sqrt(Eb*Eb+8*P0))/2;                                                     // v_b·(E_b − v_b)/2 = −P0
 else if(ctl==='droop'){const f=v=>v*(Eb-v)/2+P0-R*(v-U0);let lo=Eb/2,hi=Eb;                       // −P = −P0 + R·(v_b − U0)
  for(let k=0;k<200;k++){const m=(lo+hi)/2;if(f(lo)*f(m)<=0)hi=m;else lo=m;}vb=(lo+hi)/2;}
 const P=-vb*(Eb-vb)/2,va=(370e3+Math.sqrt(370e3*370e3-4*P))/2;return {P,va,vb};}
function dcdcTheory(){const m=S.tutMeta?.dcdc||{ctl:'V',drop:true,te:1},y=k=>S.sim?S.sim.now(k):NaN,b=dcdcSteady(m.ctl,400e3),a=m.drop?dcdcSteady(m.ctl,395e3):null;
 const row=(t,q)=>`<li class="dcdc-row">${t}: P = <b>${fmt(q.P/1e6,6)}</b> MW, v_a = ${fmt(q.va/1e3,7)} kV, v_b = ${fmt(q.vb/1e3,7)} kV</li>`;
 return `<div class="small" id="dcdc-emt"><b>Ροή φορτίου του δικτύου DC</b> (κλειστός τύπος· ο ίδιος με το pcl.dcgrid):<ul class="eqs">${row('Πριν από το συμβάν',b)}${a?row('Μετά το συμβάν (395 kV)',a):''}</ul>
  <b>EMT τώρα</b> (t = ${fmt(S.sim?S.sim.t:0,4)} s): P = <b>${fmt(y('Y:PW'),6)}</b> MW, v_a = <b>${fmt(y('Y:UA'),7)}</b> kV, v_b = <b>${fmt(y('Y:UB'),7)}</b> kV</div>`;}
// 4.20.1: DCS2 of the CIGRE B4 in EMT (tutorial b4dcs2) beside the AC/DC load flow of the case b4 after the same event
function b4Theory(){const m=S.tutMeta?.study,b=S.tutMeta?.b4,q=m&&STUDY.key===studyKey(m)?STUDY.r?.summary:null,y=k=>S.sim?S.sim.now(k):NaN,cv=q?.stations||[];
 const st={B2:'Cm-B2',B3:'Cm-B3',F1:'Cm-F1',E1:'Cm-E1'};
 return studyTheory()+`<div class="small" id="b4-emt"><b>EMT τώρα</b> (t = ${fmt(S.sim?S.sim.t:0,4)} s)${q?' και ροή φορτίου AC/DC του B4 μετά το συμβάν':' · «▶ Τρέξε τη μελέτη» για τη ροή φορτίου'}${b?` · συμβάν στο ${fmt(b.te,2)} s · ${b.ctl==='droop'?'στατικότητα k_d = '+fmt(b.kd,2)+' στους Cm-B2, Cm-B3':'ο Cm-B3 κρατά τη V_dc'}`:''}:<ul class="eqs">${['B2','B3','B5','F1','E1'].map(k=>{const d=q?.dc?.find(z=>z.bus==='Bm-'+k),c=st[k]?cv.find(z=>z.name===st[k]):null;
  return `<li class="b4-row">Ζυγός Bm-${k}: U = <b>${fmt(y('Y:VM'+k)/1e3,7)}</b> kV${st[k]?`, ${st[k]} P = <b>${fmt(y('Y:PW'+k),5)}</b> MW`:''}${d?` · ροή φορτίου ${fmt(d.U_kV,7)} kV${c&&c.Pdc_MW!==undefined?`, ${fmt(c.Pdc_MW,5)} MW`:''}`:''}</li>`;}).join('')}
  <li class="b4-row">Cd-E1 (από το DCS3): P = <b>${fmt(y('Y:PWCD'),5)}</b> MW</li></ul><p class="muted">Η ροή φορτίου του B4 δεν έχει απώλειες σταθμών: οι υπεράκτιοι σταθμοί δίνουν στο EMT λίγο λιγότερα από το αιολικό και λίγο περισσότερα στο φορτίο, και ο σταθμός της τάσης τα παίρνει.</p></div>`;}
function studyTheory(){const m=S.tutMeta?.study;if(!m)return '';const key=studyKey(m),st=STUDY.key===key?STUDY:{busy:STUDY.busy==='open'?'open':null,prev:!!STUDY.busy&&STUDY.busy!=='open'},F=STUDY.file,q=st.r?.summary,f=(x,d=4)=>x===null||x===undefined?'—':fmt(x,d);
 let h=`<div class="tm"><span class="badge">${STUDY_LAB[m.study]||esc(m.study)}</span> δίκτυο <b>${esc(studyNet(m))}</b>${F?' (από αρχείο)':''}${m.options?.method?' · μέθοδος: '+esc(m.options.method==='auto'?'Αυτόματα':STUDY_METHOD[m.options.method]||m.options.method):''}${m.options?.flow_limits===false?' · χωρίς όρια ροής':''}${m.options?.start==='nn'?' · εκκίνηση: νευρωνικό':''}${m.options?.backend&&m.options.backend!=='auto'?' · παρτίδα σε '+(m.options.backend==='gpu'?'GPU*':'CPU'):''}${m.study==='cpf'?(m.options?.q_limits?' · με όρια αέργου':' · χωρίς όρια αέργου')+(m.options?.direction==='load'?' · μεγαλώνουν μόνο τα φορτία':''):''}${m.study==='se'&&m.emt?' · μετρήσεις: '+esc(SE_PLAN['emt-'+m.emt.plan]||m.emt.plan)+' τη στιγμή που πατάς «Τρέξε»'+(m.emt.bad&&m.emt.bad!=='none'?' · λανθασμένη: '+esc(SE_BAD[m.emt.bad]||m.emt.bad):' · χωρίς λανθασμένη'):''}${m.study==='se'&&!m.emt?' · μετρήσεις: '+esc(SE_PLAN[m.options?.plan]||m.options?.plan||'')+(m.options?.bad?' · λανθασμένη: '+esc(SE_BAD[m.options.bad]||m.options.bad):' · χωρίς λανθασμένη'):''}${m.study==='harmonic'?(m.emt?' · φάσμα των γεφυρών HVDC από το EMT τη στιγμή που πατάς «Τρέξε»':'')+(m.options?.pulse===6?' · σαν εξαπαλμικό':' · δωδεκαπαλμικό')+(m.options?.filters===false?' · χωρίς φίλτρα':' · με φίλτρα')+(m.options?.line_model==='pi'?' · γραμμές: π':' · γραμμές: κατανεμημένες')+' · φορτία: '+(m.options?.load_model==='none'?'χωρίς':'μοντέλο '+esc(m.options?.load_model||'C')):''}${m.study==='unbalanced'?' · ρυθμιστές: '+(UNB_REG[m.options?.regulators]||UNB_REG.given)+(m.options?.spread==='middle'?' · κατανεμημένο φορτίο στο μέσο του τμήματος':' · κατανεμημένο φορτίο: ακριβές ισοδύναμο'):''}</div>
  <p><button data-study="run" ${st.busy?'disabled':''}>▶ Τρέξε τη μελέτη</button> <button data-study="report" ${st.busy?'disabled':''} title="Ένα αρχείο HTML με γραφήματα, πίνακες και τα δεδομένα της μελέτης, από το αντικείμενο αναφοράς του engine (pcl.report)">⬇ Εξαγωγή αναφοράς</button>
  <button data-study="view" ${st.busy?'disabled':''} title="Το δίκτυο που μελετιέται ως μονογραμμικό διάγραμμα, με στρώσεις από το αποτέλεσμα της μελέτης (τάσεις, ροές, παραβιάσεις, N−1, τιμές κόμβων)· εξαγωγή σε SVG και σε DXF για CAD. Το σχέδιο από κάτω είναι πάντα το δίκτυο των 9 ζυγών σε EMT">🗺 Διάγραμμα του δικτύου</button>
  <span class="muted small" id="study-status">${st.busy?(st.busy==='report'?'Γράφεται η αναφορά…':st.busy==='open'?'Διαβάζεται το αρχείο…':'Τρέχει στο engine…'):st.prev?(STUDY.next?'Τελειώνει πρώτα η μελέτη που ξεκίνησε πριν από την αλλαγή· μετά τρέχει αυτή.':'Τρέχει ακόμη η μελέτη που ξεκίνησε πριν από την αλλαγή· ό,τι πατήσεις τώρα τρέχει μόλις τελειώσει.'):st.last&&st.r?'':''}</span></p>
  <p class="small" id="study-net"><button data-study="open" ${STUDY.busy?'disabled':''} title="${m.study==='unbalanced'?'Ένας τροφοδότης τριών φάσεων από αρχείο: το JSON του pcl.unbalanced (το γράφει το «⬇ Δίκτυο» στο διάγραμμα του δικτύου, ή το Feeder.to_dict)':'Ένα δίκτυο από αρχείο αντί για τα δίκτυα της λίστας: MATPOWER (.m), PSS/E RAW (.raw, εκδόσεις 29–35) ή το JSON του pcl.network'}. Το αρχείο διαβάζεται στον τοπικό server και δεν φεύγει από τον υπολογιστή">📂 ${m.study==='unbalanced'?'Άνοιγμα αρχείου τροφοδότη':'Άνοιγμα αρχείου δικτύου'}</button>
  ${F?`<button data-study="close" ${STUDY.busy?'disabled':''} title="Πίσω στο δίκτυο που διαλέγει η επιλογή «Δίκτυο» του tutorial">✕ ${esc(m.net)} του tutorial</button> <span id="study-filenet">Από το αρχείο <b>${esc(F.fileName)}</b>: ${F.summary.feeder?`τροφοδότης τριών φάσεων, ${F.summary.buses} ζυγοί, ${F.summary.branches} τμήματα, φορτίο ${fmt(1e3*F.summary.load_MW,5)} kW`:`${F.summary.buses} ζυγοί, ${F.summary.branches} κλάδοι, ${F.summary.generators} γεννήτριες, φορτίο ${fmt(F.summary.load_MW,5)} MW${F.summary.rated?', όρια σε '+F.summary.rated+' κλάδους':', χωρίς όρια κλάδων'}${F.summary.costs?'':', χωρίς κόστη γεννητριών'}`}.</span>`:''}</p>
  ${F&&F.summary.warnings.length?`<ul class="small bad" id="study-filewarn">${F.summary.warnings.map(w=>`<li>${esc(w)}</li>`).join('')}</ul>`:''}
  ${STUDY.edits.length?`<p class="small" id="study-edits">Το δίκτυο μελετιέται με <b>${STUDY.edits.length}</b> ${STUDY.edits.length===1?'αλλαγή':'αλλαγές'} από το διάγραμμα. <button data-study="noedits" ${STUDY.busy?'disabled':''}>Αναίρεση όλων</button></p>`:''}`;
 if(st.error||STUDY.openError)h+=`<p class="bad" id="study-error">${esc(st.error||STUDY.openError)}</p>`;
 if(q){h+=`<p class="small" id="study-advice"><b>${st.r.study==='se'?'Το πρόβλημα':st.r.study==='harmonic'||st.r.study==='unbalanced'?'Η μέθοδος':'Πρόταση του engine'}:</b> ${esc(q.why||'')}.</p><ul class="eqs" id="study-result">`;
  if(st.r.study==='pf')h+=`<li>${q.converged?'Σύγκλιση':'<b class="bad">Δεν συνέκλινε</b>'} σε <b>${q.iterations}</b> επαναλήψεις με ${esc(STUDY_METHOD[q.method]||q.method||'')}${q.path&&q.path.length>1?' (διαδρομή: '+esc(q.path.join(' → '))+')':''} · ${f(q.time_ms,3)} ms</li>
   <li>Απώλειες <b>${f(q.losses_MW,5)} MW</b> · |V| από <b>${f(q.Vmin,4)}</b> pu (ζυγός ${esc(q.Vmin_bus)}) ως <b>${f(q.Vmax,4)}</b> pu (ζυγός ${esc(q.Vmax_bus)})</li>`;
  else if(st.r.study==='n1'||st.r.study==='n1dc')h+=`<li><b>${q.outages}</b> διαταραχές: λύθηκαν ${q.solved}, χωρίζουν το δίκτυο ${q.islands}, δεν συγκλίνουν ${q.failed} · ${f(q.time_ms,3)} ms${st.r.study==='n1'?` (στους παράγοντες της βάσης ${q.chord}, με πλήρη Newton ${q.newton})`:''}</li>${st.r.study==='n1'&&q.backend?`
   <li id="study-backend">Η παρτίδα έτρεξε σε: ${q.backend_why?esc(q.backend_why):(q.backend==='gpu'?'GPU*':'CPU')}</li>`:''}
   <li>Χειρότερη: η απώλεια του <b>${esc(q.worst||'—')}</b> φορτίζει τον ${esc(q.worst_branch||'—')} με <b>${f(q.worst_MVA,4)} MVA</b>${q.worst_loading!==null&&q.worst_loading!==undefined?' ('+f(100*q.worst_loading,3)+' % της ονομαστικής)':''} · με υπερφόρτιση: ${q.overloads}</li>`;
  // 4.19.5: the continuation load flow (pcl.cpf): the loading margin, the weakest bus with its curve, what the generators did on the way
  else if(st.r.study==='cpf'){const lim={max:'άνω',min:'κάτω'},C=q.curve,W=420,H=170,X0=38,Y0=8,pw=W-X0-8,ph=H-Y0-24,lx=Math.max(...C.lambda,1e-9),ln=Math.min(0,...C.lambda),vy=Math.max(...C.V)*1.05;
   const X=v=>X0+pw*(v-ln)/(lx-ln),Y=v=>Y0+ph*(1-v/vy),pth='M'+C.lambda.map((v,i)=>`${X(v).toFixed(1)},${Y(C.V[i]).toFixed(1)}`).join(' L');
   h+=`<li id="study-cpf">${q.converged?`Όριο φόρτισης στο <b>λ = ${f(q.lambda,4)}</b>`:`<b class="bad">Το όριο φόρτισης δεν βρέθηκε</b> (${esc(q.message||'')})· το ψηλότερο σημείο: λ = ${f(q.lambda,4)}`} · φορτίο από <b>${f(q.load_MW,5)}</b> σε <b>${f(q.nose_MW,5)} MW</b>: περιθώριο <b>${f(q.margin_MW,5)} MW</b>${q.margin!==null?' ('+f(100*q.margin,4)+' % του σημερινού)':''} · ${f(q.time_ms,3)} ms</li>
   <li>${q.kind==='limit'?`Το όριο είναι <b>γωνία, όχι μύτη</b>: ο ζυγός ${esc(q.last||q.bus)} αλλάζει τύπο σε όριο αέργου και από εκεί δεν υπάρχει λύση με περισσότερο φορτίο (άμεση αστάθεια στο όριο)`:q.kind==='fold'?'Το όριο είναι η <b>μύτη</b> της καμπύλης: εκεί ο πίνακας της ροής φορτίου γίνεται ιδιόμορφος'+(q.refined?'':' (δεν βρέθηκε ως σημείο της καμπύλης: δίνεται το ψηλότερο από τα δύο σημεία γύρω της)'):'—'}</li>
   <li>Πιο αδύναμος ζυγός <b>${esc(q.bus)}</b>: |V| από <b>${f(q.V0,4)}</b> σε <b>${f(q.V,4)} pu</b> στο όριο${q.weak.length>1?' · μετά: '+q.weak.slice(1).map(esc).join(', '):''} · χαμηλότερη τάση στο όριο ${f(q.Vmin,4)} pu (ζυγός ${esc(q.Vmin_bus)})</li>
   <li id="study-cpf-q">${q.q_limits?`Όρια αέργου: <b>${q.events-q.at_start}</b> αλλαγές τύπου ζυγού στη διαδρομή${q.at_start?`, ${q.at_start} ${q.at_start===1?'γεννήτρια':'γεννήτριες'} σε όριο ήδη στο σημερινό φορτίο`:''}${q.first.length?' · οι πρώτες: '+q.first.map(e=>`ζυγός ${esc(e.bus)} στο λ = ${f(e.lambda,3)} (${e.to==='PQ'?'φτάνει το '+lim[e.limit]+' όριο':'κρατά ξανά την τάση του'})`).join(' · ')+(q.events-q.at_start>q.first.length?' …':''):''}`:(m.options?.q_limits?'Το δίκτυο δεν έχει όρια αέργου στις γεννήτριές του':'Χωρίς όρια αέργου: κάθε γεννήτρια κρατά την τάση της ως το τέλος')}</li>
   <li>${q.points} σημεία της καμπύλης · ${q.steps.iterations} επαναλήψεις του διορθωτή · ${q.steps.factorizations} παραγοντοποιήσεις · βήματα που κόπηκαν: ${q.steps.cut}</li></ul>
   <svg class="bfchart" id="study-pv" viewBox="0 0 ${W} ${H}" role="img" aria-label="Καμπύλη P–V του πιο αδύναμου ζυγού" style="max-width:520px">${PlotCore.svgFrame({W,H,ml:X0,mr:W-X0-pw,mt:Y0,mb:H-Y0-ph,x:[ln,lx],y:[0,vy],xPlain:true,yPlain:true}).svg}
    <line class="diag" x1="${X(C.lambda[C.nose]).toFixed(1)}" x2="${X(C.lambda[C.nose]).toFixed(1)}" y1="${Y0}" y2="${Y0+ph}"/><path class="map" d="${pth}"/><circle cx="${X(C.lambda[C.nose]).toFixed(1)}" cy="${Y(C.V[C.nose]).toFixed(1)}" r="3"/>
    <text x="${X0+pw/2}" y="${H-2}" text-anchor="middle">|V| του ζυγού ${esc(C.bus)} (pu) ως προς το λ · η κουκκίδα είναι το όριο φόρτισης</text></svg><ul class="eqs">`;}
  // 4.19.5: state estimation (pcl.se): the two tests, what was taken out, how far the estimate is from the load flow the measurements came from
  else if(st.r.study==='se'){const e=q.error,pl=q.planted>0;
   if(!q.observable)h+=`<li id="study-se"><b class="bad">Οι μετρήσεις δεν ορίζουν την κατάσταση του δικτύου</b>${q.islands>1?`: ${q.islands} παρατηρήσιμες νησίδες`:''}${q.uncovered.length?' · ζυγοί που δεν τους αγγίζει καμία μέτρηση: '+q.uncovered.map(esc).join(', '):''} (${esc(q.message||'')})</li>`;
   else if(!q.converged)h+=`<li id="study-se"><b class="bad">Η εκτίμηση δεν συνέκλινε</b> (${esc(q.message||'')})</li>`;
   else h+=`<li id="study-se">Εκτίμηση σε <b>${q.iterations}</b> επαναλήψεις${q.rounds>1?` (${q.rounds} εκτιμήσεις: μία ανά μέτρηση που βγήκε, και η πρώτη)`:''} · ${f(q.time_ms,3)} ms</li>
   <li id="study-se-chi">Έλεγχος χ² (${f(100*q.confidence,3)} %): στην πρώτη εκτίμηση J = <b>${f(q.J_first,4)}</b> απέναντι σε κατώφλι ${f(q.chi2_first,4)} (${q.dof_first} βαθμοί ελευθερίας): ${q.suspect_first?'<b class="bad">υπάρχει λανθασμένη μέτρηση</b>':'κανένα σημάδι λανθασμένης μέτρησης'}${q.n_bad?` · στην τελική J = <b>${f(q.J,4)}</b> (κατώφλι ${f(q.chi2,4)})`:''}</li>
   <li id="study-se-bad">${q.n_bad?`Βγήκαν με τον έλεγχο του μεγαλύτερου κανονικοποιημένου υπολοίπου (κατώφλι ${f(q.threshold,2)}): `+q.bad.map(b=>`<b>${SE_KIND[b.type]||esc(b.type)} στο ${esc(b.at)}</b> (${f(b.rN,3)}· εκτίμηση σφάλματος ${f(b.sigmas,3)}σ${b.planted?'':pl||!q.plan?'· <span class="bad">δεν ήταν από τις λανθασμένες</span>':'· <span class="bad">σωστή μέτρηση που πέρασε το κατώφλι</span>'})`).join(' · ')+(q.n_bad>q.bad.length?' …':''):`Καμία μέτρηση πάνω από το κατώφλι ${f(q.threshold,2)}: το μεγαλύτερο κανονικοποιημένο υπόλοιπο είναι <b>${f(q.largest,3)}</b>`}${pl?` · από ${q.planted===1?'τη λανθασμένη που μπήκε':'τις '+q.planted+' λανθασμένες που μπήκαν'} ${q.found===q.planted?(q.planted===1?'βρέθηκε':'βρέθηκαν όλες'):`<b class="bad">${q.found?'βρέθηκαν '+q.found:'δεν βρέθηκε καμία'}</b>`}`:''}</li>
   <li>Μένει μεγαλύτερο κανονικοποιημένο υπόλοιπο ${f(q.largest,3)} · κρίσιμες μετρήσεις (το σφάλμα τους δεν φαίνεται): <b>${q.critical}</b>${q.message?' · '+esc(q.message):''}</li>
   ${e?`<li id="study-se-err">Απέναντι στη ροή φορτίου ${q.tve?'από την οποία ξεκίνησε το EMT':'από την οποία βγήκαν οι μετρήσεις'}: |V| ως <b>${f(e.V_max,3)} pu</b> (ζυγός ${esc(e.V_bus)}), γωνία ως <b>${f(e.angle_max,3)}°</b> (ζυγός ${esc(e.angle_bus)})${q.n_bad?` · πριν βγουν οι λανθασμένες: |V| ως ${f(e.first_V_max,3)} pu`:''}</li>`:''}
   ${q.absolute!==undefined?`<li id="study-se-pmu">${q.absolute?'Γωνίες μετρημένες (φασιθέτης τάσης στον κοινό χρόνο αναφοράς): κανένας ζυγός δεν είναι αναφορά, '+q.n+' άγνωστοι':'Χωρίς φασιθέτη τάσης: αναφορά ο ζυγός ταλάντωσης, '+q.n+' άγνωστοι'}${q.start==='pmu'?' · αρχή από τους φασιθέτες τάσης (με μέτρα |I|)':q.start==='staged'?' · αρχή από την εκτίμηση χωρίς τα |I|':''}</li>`:''}
   ${q.tve?`<li id="study-se-tve">TVE των φασιθετών του EMT απέναντι στη ροή φορτίου: τάση ως <b>${f(q.tve.V,3)}</b> (ζυγός ${esc(q.tve.V_at)}), ρεύμα ως <b>${f(q.tve.I,3)}</b> (${esc(q.tve.I_at)})</li>`:''}`;}
  // 4.19.5: the harmonic load flow (pcl.harmonic): the distortion against the limits, the spectrum at the bus of the scan, the scan itself
  else if(st.r.study==='harmonic'){
   if(!q.converged)h+=`<li id="study-harm"><b class="bad">Η αρμονική ροή φορτίου δεν έγινε</b>: ${esc(q.message||'')}</li>`;
   else{const w=q.worst,a=q.at,C=q.scan,ord=q.orders,pc=x=>f(x,3)+' %';
    h+=`<li id="study-harm">Μεγαλύτερη παραμόρφωση τάσης: ζυγός <b>${esc(w.bus)}</b> (${f(w.kV,4)} kV), <b>THD = ${pc(w.THD)}</b> με όριο ${f(w.limit_thd,2)} % · ${q.sources.length} ${q.sources.length===1?'πηγή':'πηγές'}, τάξεις ${ord[0]}η ως ${ord[ord.length-1]}η · ${f(q.time_ms,3)} ms</li>`;
    {const e=q.sources.find(s=>s.spec);if(e)h+=`<li id="study-harm-emt">Φάσμα από το EMT (λόγος προς τη θεμελιώδη ∠ γωνία στο συνημίτονο της μελέτης): ${Object.entries(e.spec).filter(([k])=>k!=='1').map(([k,v])=>k+'η '+f(v[0],3)+'∠'+f(v[1],3)+'°').join(' · ')}</li>`;}
    h+=`
    <li id="study-harm-over">${q.over?`<b class="bad">Πάνω από το όριο του IEEE 519: ${q.over} από ${q.buses} ζυγούς</b> (${q.over_buses.map(esc).join(', ')}${q.over>q.over_buses.length?' …':''})`:`Κανένας από τους ${q.buses} ζυγούς δεν περνά το όριο του IEEE 519 για την τάση του`}</li>
    ${a?`<li id="study-harm-at">Ζυγός <b>${esc(a.bus)}</b> (${f(a.kV,4)} kV): THD <b>${pc(a.THD)}</b> με όριο ${f(a.limit_thd,2)} % · μεγαλύτερη η <b>${a.worst}η</b> (${pc(a.worst_pct)}) · ${ord.filter(o=>o<=13).map(o=>`${o}η ${f(a.Vh[o],2)} %`).join(' · ')}</li>`:''}
    ${C?`<li id="study-harm-res">Παράλληλοι συντονισμοί όπως φαίνονται από τον ζυγό ${esc(C.bus)}: ${C.peaks.length?C.peaks.map(p=>`τάξη <b>${f(p[0],4)}</b> (${f(p[1],3)} pu)`).join(' · '):'κανένας ως την τάξη '+f(C.h[C.h.length-1],3)}</li>`:''}
    ${q.message?`<li>${esc(q.message)}</li>`:''}`;
    if(C){const W=420,H=170,X0=38,Y0=8,pw=W-X0-8,ph=H-Y0-24,hx=C.h[C.h.length-1],zy=Math.max(...C.Z)*1.05,X=v=>X0+pw*(v-1)/(hx-1),Y=v=>Y0+ph*(1-v/zy);
     h+=`</ul><svg class="bfchart" id="study-scan" viewBox="0 0 ${W} ${H}" role="img" aria-label="Σάρωση συχνότητας από τον ζυγό ${esc(C.bus)}" style="max-width:520px">${PlotCore.svgFrame({W,H,ml:X0,mr:W-X0-pw,mt:Y0,mb:H-Y0-ph,x:[1,hx],y:[0,zy],xPlain:true,yPlain:true}).svg}
      ${ord.map(o=>`<line class="diag" x1="${X(o).toFixed(1)}" x2="${X(o).toFixed(1)}" y1="${Y0}" y2="${Y0+ph}"/>`).join('')}<path class="map" d="M${C.h.map((v,i)=>`${X(v).toFixed(1)},${Y(C.Z[i]).toFixed(1)}`).join(' L')}"/>
      <text x="${X0+pw/2}" y="${H-2}" text-anchor="middle">|Z| από τον ζυγό ${esc(C.bus)} (pu) ως προς την τάξη · οι διακεκομμένες είναι οι τάξεις των πηγών</text></svg><ul class="eqs">`;}}}
  // 4.19.5: the three-phase load flow of a feeder (pcl.unbalanced): the voltage of every phase, the unbalance, the regulators, the
  // published results of the feeder, and the profile of the three phases along the buses
  // 4.20: the sequential AC/DC load flow (pcl.dcgrid): the iterations, the voltage and power of every DC bus, every station
  else if(st.r.study==='acdc'&&q.mode==='opf'){      // 4.21: the optimal power flow AC/DC
   h+=`<li id="study-acdc">${q.converged?'Βέλτιστο':'<b class="bad">Δεν λύθηκε</b> ('+esc(q.message||'')+')'} σε <b>${q.iterations}</b> επαναλήψεις · κόστος <b>${f(q.cost,7)}</b> ανά ώρα · περιορισμοί που δεσμεύουν: ${q.binding} · ${f(q.time_ms,3)} ms</li>
    <li id="study-acdc-loss">Απώλειες: AC <b>${f(q.losses_MW,4)} MW</b> · γραμμές DC <b>${f(q.losses_dc_MW,4)} MW</b> · σταθμοί ${f(q.losses_conv_MW,4)} MW</li>
    <li id="study-acdc-dc">Ζυγοί DC: ${q.dc.map(d=>`${esc(d.bus)} <b>${f(d.V,5)}</b> pu, οριακή τιμή ${f(d.lmp,5)}`).join(' · ')}</li>
    ${q.stations.map(c=>`<li class="study-acdc-st">Σταθμός <b>${esc(c.name)}</b> (${esc(c.bus)} → ${esc(c.dc)}): P_s ${f(c.Ps_MW,5)} MW, Q_s ${f(c.Qs_Mvar,4)} Mvar, |U_c| ${f(c.Uc,4)} pu, I_c ${f(c.Ic_kA,4)} kA · απώλειες ${f(c.loss_MW,4)} MW</li>`).join('')}
    <li id="study-acdc-gen">Πηγές: ${q.sources.map(g=>`${esc(g.name)} <b>${f(g.P_MW,5)}</b> MW`).join(' · ')}</li>`;}
  else if(st.r.study==='acdc'&&q.mode==='n1'){        // 4.21: N−1 AC/DC
   const KD={line:'γραμμή',branch:'κλάδος',transformer:'μετασχηματιστής',dc_line:'γραμμή DC',vsc:'σταθμός',dcdc:'μετατροπέας DC/DC'};
   h+=`<li id="study-acdc">${q.outages} διαταραχές · λύθηκαν <b>${q.solved}</b>${q.failed.length?' · <b class="bad">χωρίς λύση: '+q.failed.map(esc).join(', ')+'</b>':''} · ${f(q.time_ms,3)} ms</li>
    <li id="study-acdc-worst">Χειρότερη: <b>${esc(q.worst||'—')}</b>${q.worst_loading!=null?` (φόρτιση ${f(100*q.worst_loading,3)} % στο ${esc(q.worst_where||'')})`:''}${q.base_loading!=null?' · πριν: '+f(100*q.base_loading,3)+' %':''} · με υπερφόρτιση: ${q.overloads}${q.limits.length?' · σταθμοί σε όριο: '+q.limits.map(esc).join(', '):''}</li>
    ${q.list.slice(0,12).map(o=>`<li class="study-acdc-out">Χωρίς ${KD[o.kind]||esc(o.kind)} <b>${esc(o.name)}</b>: ${o.converged?`φόρτιση ${o.loading==null?'—':f(100*o.loading,3)+' %'} · V_min ${f(o.Vmin,4)} pu${o.Vdc_min!=null?' · V_DC '+f(o.Vdc_min,4)+'–'+f(o.Vdc_max,4)+' pu':''}`:'<b class="bad">χωρίς λύση</b>'+(o.message?' ('+esc(o.message)+')':'')}</li>`).join('')}${q.list.length>12?'<li>…</li>':''}`;}
  else if(st.r.study==='acdc'){const CT={P:'ισχύς',V:'τάση DC',droop:'στατικότητα P–U',idroop:'στατικότητα I–U'};
   h+=`<li id="study-acdc">${q.converged?'Σύγκλιση':'<b class="bad">Δεν συνέκλινε</b>'} σε <b>${q.outer}</b> επαναλήψεις AC/DC · μέθοδος AC: ${esc(STUDY_METHOD[q.method]||q.method||'')} · ${f(q.time_ms,3)} ms</li>
    <li id="study-acdc-loss">Απώλειες: AC <b>${f(q.losses_MW,4)} MW</b> · γραμμές DC <b>${f(q.losses_dc_MW,4)} MW</b> · σταθμοί ${f(q.losses_conv_MW,4)} MW</li>
    <li id="study-acdc-dc">Ζυγοί DC: ${q.dc.map(d=>`${esc(d.bus)} <b>${f(d.U_kV,6)}</b> kV / ${f(d.P_MW,6)} MW`).join(' · ')}</li>
    ${q.stations.map(c=>`<li class="study-acdc-st">Σταθμός <b>${esc(c.name)}</b> (${esc(c.bus)} → ${esc(c.dc)}, ${CT[c.control]||esc(c.control)}): P_s ${f(c.Ps_MW,5)} MW, Q_s ${f(c.Qs_Mvar,4)} Mvar προς το AC · P_dc <b>${f(c.Pdc_MW,6)} MW</b> προς το DC · απώλειες ${f(c.loss_MW,4)} MW</li>`).join('')}
    ${(q.dcdc||[]).map(d=>`<li class="study-acdc-dd">Μετατροπέας DC/DC <b>${esc(d.name)}</b> (${esc(d.a)} → ${esc(d.b)}, ${CT[d.control]||esc(d.control)}): <b>${f(d.P_MW,5)} MW</b> · U_a ${f(d.Ua_kV,5)} kV, U_b ${f(d.Ub_kV,5)} kV${d.loading!=null?' · φόρτιση '+f(100*d.loading,3)+' %':''}</li>`).join('')}
    ${(q.dispatchers||[]).map(d=>`<li class="study-acdc-disp">Κεντρικός ελεγκτής <b>${esc(d.name)}</b>: x = ${f(d.x_MW,5)} MW · μέση τάση ${f(d.V,5)} pu (αναφορά ${f(d.Vref,5)}) · ${Object.entries(d.members).map(([m,p])=>esc(m)+' '+f(p,5)+' MW').join(' · ')}</li>`).join('')}
    ${q.limits?`<li id="study-acdc-lim">Όρια σταθμών (διάγραμμα P–Q, ρεύμα, τάση): ${q.limits.length?q.limits.map(c=>`<b>${esc(c.name)}</b> ${c.held==='Q'?'στο όριο αέργου':c.held==='P'?'με μειωμένη P':c.held==='V'?'χωρίς τη ρύθμιση της τάσης AC':''}${c.over?' <b class="bad">έξω από το διάγραμμα</b>':''}`).join(' · '):'κανένας σταθμός στο όριό του'}</li>`:''}`;}
  else if(st.r.study==='unbalanced'){
   if(!q.converged)h+=`<li id="study-unb"><b class="bad">Η ροή φορτίου δεν συνέκλινε</b>: ${esc(q.message||'')}</li>`;
   else{const P=q.published,inp=q.input,phs=Object.keys(inp.kW),pr=q.profile;
    h+=`<li id="study-unb">Σύγκλιση σε <b>${q.iterations}</b> επαναλήψεις${q.rounds>1?` (${q.rounds} λύσεις για τις λήψεις των ρυθμιστών)`:''} · ${q.nodes} κόμβοι φάσης σε ${q.buses} ζυγούς · ${f(q.time_ms,3)} ms</li>
    <li id="study-unb-v">Τάση φάσης από <b>${f(q.low.V,4)}</b> pu (ζυγός ${esc(q.low.bus)}, φάση ${esc(q.low.phase)}) ως <b>${f(q.high.V,4)}</b> pu (ζυγός ${esc(q.high.bus)}, φάση ${esc(q.high.phase)})${q.unbalance.value!==null&&q.unbalance.value!==undefined?` · μεγαλύτερη ασυμμετρία τάσης <b>${f(q.unbalance.value,3)} %</b> στον ζυγό ${esc(q.unbalance.bus)}`:''}</li>
    <li id="study-unb-p">Είσοδος ανά φάση: ${phs.map(p=>`${p} <b>${f(inp.kW[p],5)}</b>`).join(' · ')} kW · φορτίο ${f(q.load_kW,5)} kW · απώλειες <b>${f(q.losses_kW,5)} kW</b> (${f(100*q.losses_kW/inp.kW_total,3)} %) · πυκνωτές ${f(q.cap_kvar,4)} kvar</li>
    ${Object.keys(q.taps).map(k=>`<li class="study-unb-reg">Ρυθμιστής <b>${esc(k)}</b>, ${UNB_REG[q.regulators]||''}: ${Object.entries(q.taps[k]).map(([p,t])=>`${p} <b>${t}</b>`).join(' · ')}${q.relay[k]&&q.band[k]?` · το ρελέ βλέπει ${Object.values(q.relay[k]).map(v=>f(v,4)).join(' / ')} V, με ζώνη ${f(q.band[k][0],4)}–${f(q.band[k][1],4)} V`:''}</li>`).join('')}
    ${q.settled===false?`<li id="study-unb-hunt"><b class="bad">Οι λήψεις δεν ισορρόπησαν</b>: η ζώνη ενός ρυθμιστή είναι στενότερη από την τάση μιας λήψης</li>`:''}
    ${P?`<li id="study-unb-pub">Απέναντι στα δημοσιευμένα αποτελέσματα του τροφοδότη: ${P.values} τάσεις φάσης με μέγιστη διαφορά <b>${f(P.dV,2)} pu</b> και ${f(P.dangle,2)}°${P.losses_kW!==null&&P.losses_kW!==undefined?` · απώλειες ${f(q.losses_kW,6)} kW, δημοσιευμένες ${f(P.losses_kW,6)} kW`:''}${P.taps?` · δημοσιευμένες λήψεις: ${Object.entries(P.taps).map(([p,t])=>p+' '+t).join(', ')}`:''}</li>`:q.published_taps?`<li id="study-unb-pub">Τα δημοσιευμένα αποτελέσματα του τροφοδότη είναι για τις λήψεις ${Object.entries(q.published_taps).map(([p,t])=>p+' '+t).join(', ')}: με άλλες λήψεις είναι άλλο σημείο λειτουργίας και δεν συγκρίνονται</li>`:''}`;
    if(pr&&pr.length>1&&pr.length<=60){const W=420,H=182,X0=38,Y0=8,pw=W-X0-8,ph=H-Y0-42,lo=Math.min(0.94,q.low.V-0.005),hi=Math.max(1.06,q.high.V+0.005),X=i=>X0+pw*(i+0.5)/pr.length,Y=v=>Y0+ph*(1-(v-lo)/(hi-lo)),COL={a:'#c2410c',b:'#0f766e',c:'#5b4fb0'};
     h+=`</ul><svg class="bfchart" id="study-profile" viewBox="0 0 ${W} ${H}" role="img" aria-label="Τάση κάθε φάσης σε κάθε ζυγό" style="max-width:520px">${PlotCore.svgFrame({W,H,ml:X0,mr:W-X0-pw,mt:Y0,mb:H-Y0-ph,x:[0,1],y:[lo,hi],xTicks:false,yPlain:true}).svg}
      ${[0.95,1.05].map(v=>`<line class="diag" x1="${X0}" x2="${X0+pw}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}"/>`).join('')}
      ${pr.map((b,i)=>`<text x="${X(i).toFixed(1)}" y="${Y0+ph+9}" text-anchor="middle">${esc(b.bus)}</text>`+['a','b','c'].map(p=>b[p]===null||b[p]===undefined?'':`<circle data-ph="${p}" cx="${X(i).toFixed(1)}" cy="${Y(b[p]).toFixed(1)}" r="2.2" style="fill:${COL[p]}"/>`).join('')).join('')}
      ${['a','b','c'].map((p,i)=>`<circle cx="${X0+8+i*46}" cy="${H-19}" r="2.2" style="fill:${COL[p]}"/><text x="${X0+13+i*46}" y="${H-16}" text-anchor="start">φάση ${p}</text>`).join('')}
      <text x="${X0+pw}" y="${H-2}" text-anchor="end">|V| κάθε φάσης (pu) σε κάθε ζυγό · οι διακεκομμένες είναι τα 0,95 και 1,05 pu</text></svg><ul class="eqs">`;}}}
  else h+=`<li>${q.converged?'Βέλτιστο':'<b class="bad">Δεν λύθηκε</b> ('+esc(q.message||'')+')'} σε <b>${q.iterations}</b> επαναλήψεις · κόστος <b>${f(q.cost,7)}</b> ανά ώρα · απώλειες ${f(q.losses_MW,4)} MW · ${f(q.time_ms,3)} ms</li>${st.r.study==='opf'&&(q.start==='warm'||(q.start_path||[]).length)?`
   <li id="study-start">Εκκίνηση: <b>${q.start==='warm'?'από την πρόταση του νευρωνικού':'κανονική'}</b>${(q.start_path||[]).length?' ('+esc(q.start_path.join(' · '))+')':''}</li>`:''}
   <li>Οριακή τιμή από <b>${f(q.lmp_min,5)}</b> ως <b>${f(q.lmp_max,5)}</b> ανά MWh · περιορισμοί που δεσμεύουν: <b>${q.binding}</b> · όρια ροής στο πρόβλημα: ${q.flow_limits}</li>
   <li>Κατανομή: ${q.sources.map(g=>`${esc(g.name)} ${f(g.P_MW,4)} MW`).join(' · ')}${q.sources.length>=12?' …':''}</li>`;
  // 4.19.4: the optimal power flow with security against every single outage (pcl.scopf): what it costs, what binds, what is left
  if(st.r.study==='scopf'&&q.security){const z=q.security,wb=z.worst_before,wa=z.worst_after,pc=x=>f(100*x,4)+' %';
   h+=`<li id="study-sec">Ασφάλεια N−1: <b>${z.secure?'ασφαλής κατανομή':'<span class="bad">όχι ασφαλής</span>'}</b> · ${z.outages} διαταραχές ελέγχθηκαν${z.islands?` (${z.islands} χωρίζουν το δίκτυο και μένουν έξω)`:''} · ${z.rounds} ${z.rounds===1?'γύρος':'γύροι'}, ${z.constraints} ${z.constraints===1?'περιορισμός':'περιορισμοί'} · κόστος της ασφάλειας <b>${z.cost_security===null?'—':f(z.cost_security,4)}</b> ανά ώρα (χωρίς ασφάλεια: ${f(z.cost_base,7)})</li>
   ${wb?`<li>Χωρίς ασφάλεια η απώλεια του <b>${esc(wb.outage)}</b> φορτίζει τον ${esc(wb.branch)} στο <b>${pc(wb.loading)}</b>${wa?` · με ασφάλεια η χειρότερη διαταραχή (${esc(wa.outage)}) φορτίζει τον ${esc(wa.branch)} στο <b>${pc(wa.loading)}</b>`:''} του ορίου</li>`:''}
   ${z.n_binding?`<li>Δεσμεύουν: ${z.binding.map(b=>`${esc(b.branch)} όταν χάνεται ο ${esc(b.outage)} (μ = ${f(b.mu,4)} ανά MWh)`).join(' · ')}${z.n_binding>z.binding.length?' …':''}</li>`:''}
   ${z.n_unsecured?`<li><b class="bad">${z.n_unsecured} ζεύγη κλάδου και διαταραχής μένουν πάνω από το όριο</b>: καμία κατανομή δεν τα καλύπτει. Το χειρότερο: ${esc(z.unsecured[0].branch)} όταν χάνεται ο ${esc(z.unsecured[0].outage)} (${pc(z.unsecured[0].loading)})</li>`:''}
   ${z.ac?`<li>Έλεγχος με ροή φορτίου AC της κατανομής: ${z.ac.converged?`απώλειες ${f(z.ac.losses/1e6,4)} MW · ${z.ac.overloads?`<b>${z.ac.overloads} ${z.ac.overloads===1?'κλάδος':'κλάδοι'} πάνω από την ονομαστική</b> (${esc(z.ac.worst_branch)}, ${pc(z.ac.worst_loading)})`:`κανένας κλάδος πάνω από την ονομαστική (${esc(z.ac.worst_branch)}, ${pc(z.ac.worst_loading)})`}: το γραμμικό μοντέλο δεν βλέπει απώλειες και άεργο`:esc(z.ac.message||'δεν συνέκλινε')}</li>`:''}`;}
  h+=`</ul>${m.options?.backend==='gpu'||q.backend==='gpu'?'<p class="muted small" id="study-gpu">* GPU: πειραματικό. Ο δρόμος GPU δεν ελέγχεται στον CI του έργου· ελέγχεται μόνο με το <code>python -m pcl accel</code> σε μηχάνημα με κάρτα. Χωρίς κάρτα ή CuPy η μελέτη τρέχει στη CPU.</p>':''}${st.last?`<p class="muted small" id="study-file">Αναφορά: ${esc(st.last)} (στις λήψεις του browser). ${F||STUDY.edits.length?'':`Την ίδια αναφορά από κώδικα: <code>${m.study==='unbalanced'?`pcl.unbalanced.case_data('${esc(m.net)}').report(${[m.options?.regulators&&m.options.regulators!=='given'?`regulators='${esc(m.options.regulators)}'`:'',m.options?.spread==='middle'?"spread='middle'":''].filter(Boolean).join(', ')}`:`pcl.network.case_data('${esc(m.net)}').report('${esc(m.study)}'`}${m.study==='cpf'?(m.options?.q_limits?', q_limits=True':'')+(m.options?.direction==='load'?", direction='load'":''):''}${m.study==='se'?`, plan='${esc(m.options?.plan||'scada')}'`+(m.options?.bad?`, bad='${esc(m.options.bad)}'`:''):''}${m.study==='harmonic'?(m.options?.pulse===6?', pulse=6':'')+(m.options?.filters===false?', filters=False':'')+(m.options?.line_model==='pi'?", line_model='pi'":'')+(m.options?.load_model&&m.options.load_model!=='C'?`, load_model='${esc(m.options.load_model)}'`:''):''}).save('αναφορά.html')</code>`}</p>`:''}`;}
 else if(!st.busy&&!st.error)h+='<p class="muted small">Πάτησε «Τρέξε τη μελέτη»: τρέχει στο engine (τοπικός server) και δείχνει τι πρότεινε και γιατί.</p>';
 let emt='';try{emt=ieee9Theory();}catch(e){}
 return h+(emt?`<p class="muted small">Το δίκτυο των 9 ζυγών του σχεδίου σε EMT${S.tutMeta?.emtFrom==='opf'?', από τη βέλτιστη κατανομή':''}:</p>`+emt:'');}
function formulaTheory(t){
 if(t.topology==='sampling')return samplingTheory();
 if(t.topology==='dc_drive')return dcDriveTheory();
 if(t.topology==='ev_drive')return evTheory();
 if(t.topology==='gen_ctl')return genCtlTheory();
 if(t.topology==='nn_compare'||t.topology==='nn_online'||t.topology==='nn_gui')return nnTheory(t)+(t.topology==='nn_gui'?nnGuiCode():'');
 if(t.topology==='current_ctl')return currentCtlTheory();
 if(t.topology==='blocks_loop')return blocksTheory();
 if(t.topology==='peak_cm')return pcmTheory();
 if(t.topology==='pcm_chaos')return chaosTheory();
 if(t.topology==='code_loop')return codeTheory();
 if(t.topology==='cell_eis')return eisTheory();
 if(t.topology==='im_vf')return vfTheory();
 if(t.topology==='im_foc')return focTheory();
 if(t.topology==='synrm')return synTheory();
 if(t.topology==='pmsm')return pmTheory();
 if(t.topology==='lightning')return lgTheory();
 if(t.topology==='twave')return twTheory();
 if(t.topology==='arrester')return arTheory();
 if(t.topology==='marx')return marxTheory();
 if(t.topology==='chop')return chopTheory();
 if(t.topology==='hv153')return hv153Theory();
 if(t.topology==='lossline')return lossTheory();
 if(t.topology==='voltime')return vtTheory();
 if(t.topology==='hvdiv')return hvdivTheory();
 if(t.topology==='schering')return scheringTheory();
 if(t.topology==='srm')return srmTheory();
 if(t.topology==='polyphase')return polyTheory();
 if(t.topology==='sub_legs')return subLegsTheory();
 if(t.topology==='bus_dq')return busDqTheory();
 if(t.topology==='net_fault')return netFaultTheory();
 if(t.topology==='xf_inrush')return inrushTheory();
 if(t.topology==='trv_terminal')return trvTerminalTheory();
 if(t.topology==='trv_slf')return trvSlfTheory();
 if(t.topology==='lightning_gis')return lightningTheory();
 if(t.topology==='gis765_lv')return gis765Theory();
 if(t.topology==='gis_vfto')return gisVftoTheory();
 if(t.topology==='ds_restrike')return dsRestrikeTheory();
 if(t.topology==='insco_study')return inscoTheory();
 if(t.topology==='line_fd'||t.topology==='cable_fd')return lineFdTheory();
 if(t.topology==='cable_xb')return cableXbTheory();
 if(t.topology==='gen_sc')return genScTheory();
 if(t.topology==='fbm')return fbmTheory();
 if(t.topology==='ieee9_emt')return ieee9Theory();
 if(t.topology==='ieee9_eq')return ieee9EqTheory();
 if(t.topology==='pf_study'||t.topology==='opf_study'||t.topology==='cpf_study'||t.topology==='se_study'||t.topology==='harm_study'||t.topology==='unb_study')return studyTheory();
 if(t.topology==='mtdc5')return mtdcTheory();
 if(t.topology==='dcdc_ex303')return dcdcTheory();
 if(t.topology==='b4dcs2')return b4Theory();
 if(t.topology==='sssc')return ssscTheory();
 if(t.topology==='ccsc')return ccscTheory();
 if(t.topology==='ieee9_sssc')return ieee9ssscTheory();
 if(t.topology==='hvdc_mmc')return hvdcTheory();
 if(t.topology==='gfm_island'||t.topology==='gfm_sync'||t.topology==='gfm_weak')return gfmTheory();
 if(t.topology==='ieee9_gfm')return ieee9GfmTheory();
 if(t.topology==='hvdc_gfm')return hvdcGfmTheory();
 if(t.topology==='hvdc_lcc')return lccTheory();
 const W=paramsOf('PWM1'),V=paramsOf('V1');let rows=[],eqs=[];
 if(t.topology==='cuk'||t.topology==='sepic'){const cl=W.mode==='pi',refS=cl?(P.parseSched(String(W.ref))||[[0,0]]):null,vf=cl?refS[refS.length-1][1]:0,Vin=+V.V,D=cl?Math.abs(vf)/(Vin+Math.abs(vf)):+W.D,R=+paramsOf('R1').R,L1=+paramsOf('L1').L,L2=+paramsOf('L2').L,Ts=1/+W.fs;const Vo=(t.topology==='cuk'?-1:1)*Vin*D/(1-D),Io=Vo/R,IL1=Math.abs(Io)*D/(1-D);
  eqs=[`V_o = ${t.topology==='cuk'?'−':''}V_in·D/(1−D) = <b>${eng(Vo,'V')}</b>`,`I_L1 = |I_o|·D/(1−D) = <b>${eng(IL1,'A')}</b>, |I_L2| = |I_o| = <b>${eng(Math.abs(Io),'A')}</b>`,`Δi_L1 = V_in·D·T/L1 = <b>${eng(Vin*D*Ts/L1,'A')}</b>, Δi_L2 = V_in·D·T/L2 = <b>${eng(Vin*D*Ts/L2,'A')}</b>`,`V_C1 = ${t.topology==='cuk'?'V_in + |V_o|':'V_in'} = <b>${eng(t.topology==='cuk'?Vin+Math.abs(Vo):Vin,'V')}</b>`];
  rows=[['V_o',Vo,avgOver('V:C2')?.avg,'V'],['⟨i_L1⟩',IL1,avgOver('I:L1')?.avg,'A'],['⟨i_L2⟩ (a→b)',-Math.abs(Io),avgOver('I:L2')?.avg,'A'],['V_C1',t.topology==='cuk'?Vin+Math.abs(Vo):Vin,avgOver('V:C1')?.avg,'V'],['Δi_L1',Vin*D*Ts/L1,lastPP('I:L1'),'A']];
  // 4.17: in closed loop the formulas at the final reference (D from V_o), and the design of the gains from the circuit
  if(cl){const k=S.sim?.net?.ctrls?.find(q=>q.id==='PWM1'),d=k?.design;eqs.unshift(`Κλειστός βρόχος: το PWM μετρά τη V_o και ρυθμίζει το D· οι τύποι στην τελική αναφορά V_ref = ${eng(vf,'V')}, άρα D = ${fmt(D,4)}`);
   if(d){eqs.push(`Μέσο μοντέλο CCM (${esc(d.name)}, από ${Object.entries(d.roles).filter(([r])=>r!=='S'&&r!=='D').map(([r,id])=>r+' = '+esc(id)).join(', ')}): G(s) = ∂V_o/∂d, G(0) = <b>${eng(d.G0,'V')}</b>${d.G0<0?' (αρνητικό: ο μετατροπέας αντιστρέφει, άρα και τα κέρδη είναι αρνητικά)':''}, συντονισμός ≈ ${eng(d.fr,'Hz')}, μηδενικό στο δεξί ημιεπίπεδο`,
     `Κέρδη από το κύκλωμα (${d.ctl==='pid'?'PID':'PI'}): K_p = <b>${eng(k.Kp)}</b>, K_i = <b>${eng(k.Ki)}</b> 1/s${k.Kd?`, K_d = <b>${eng(k.Kd)}</b> s, T_f = ${eng(k.Tf,'s')}`:''}, D₀ = ${fmt(d.D0,4)} (στην πρώτη αναφορά)· f_c = <b>${eng(d.fc,'Hz')}</b>, περιθώριο φάσης <b>${fmt(d.pm,3)}°</b>${Number.isFinite(d.gm)?`, κέρδους ${fmt(20*Math.log10(d.gm),3)} dB`:''}, M_s = ${fmt(d.ms,3)}`,
     `Επιλογή: το μεγαλύτερο K_i με περιθώριο φάσης ≥ ${fmt(+(W.pm??50),3)}°, κέρδους ≥ 6 dB, M_s ≤ 2, μία διέλευση και f_c ≤ f_s/10, με τον βρόχο C(z)·G(jω)·ZOH της δειγματοληψίας. Ο συντονισμός χωρίς απόσβεση και το μηδενικό στο δεξί ημιεπίπεδο κρατούν τη f_c πολύ κάτω από τον συντονισμό.`);}
   else eqs.push(W.gain==='auto'?'Κέρδη από το κύκλωμα: δεν υπολογίστηκαν (δες τις προειδοποιήσεις).':`Χειροκίνητα κέρδη: K_p = ${eng(+W.Kp)}, K_i = ${eng(+W.Ki)}${+W.Kd?`, K_d = ${eng(+W.Kd)}`:''}${t.topology==='cuk'?' · ο Ćuk αντιστρέφει: τα κέρδη πρέπει να είναι αρνητικά':''}.`);
   return `<ul class="eqs">${eqs.map(e=>`<li>${e}</li>`).join('')}</ul>${cmpRows(rows)}<h4>Δείκτες από την προσομοίωση</h4>${eventMetricsHTML('V:C2')}`;}}
 else if(t.topology==='hbridge'){const Vd=+V.V,R=+paramsOf('R1').R;const m=W.mode==='fixed'?2*(+W.D)-1:+W.m;const Vo=m*Vd;
  eqs=[`V_o = (2D−1)·V_d = (v_control/V_tri)·V_d = <b>${eng(Vo,'V')}</b>`,`I_o = V_o/R = <b>${eng(Vo/R,'A')}</b>`,`Συχνότητα κυμάτωσης ρεύματος: ${W.mode==='fixed'?'f_s (διπολική)':'2·f_s (μονοπολική)'}`];
  rows=[['V_o (v_A − v_B)',Vo,avgOver('V:R1')?.avg+avgOver('V:L1')?.avg,'V'],['I_o',Vo/R,avgOver('I:L1')?.avg,'A']];}
 else if(t.topology==='inverter'){const Vd=+V.V,R=+paramsOf('R1').R,L=+paramsOf('L1').L,m=+W.m,f=+W.fref,w=2*Math.PI*f;const V1=Math.min(m,1)*Vd,Z=Math.hypot(R,w*L),I1=V1/Z;
  eqs=[`V̂₁ = m·V_d = <b>${eng(V1,'V')}</b> (γραμμική περιοχή, m ≤ 1)`,`|Z| = |R + jωL| = <b>${eng(Z,'Ω')}</b>, φ = <b>${fmt(Math.atan2(w*L,R)*180/Math.PI,3)}°</b>`,`Î₁ = V̂₁/|Z| = <b>${eng(I1,'A')}</b>`,`m_f = f_s/f₁ = ${fmt(+W.fs/f)} → αρμονικές γύρω από ${W.refphase!==undefined&&editor.comp('S3')?.params.out==='b'?'2':''}m_f`];
  const pk=(()=>{const s=S.sim;if(!s)return NaN;const p=s.per;const i=s.chIndex.get('I:L1');if(i===undefined)return NaN;let mx=-Infinity;const n=Math.min(p.n,Math.round(1/f/s.T));for(let k=1;k<=n;k++){const j=(p.head-k+p.cap)%p.cap;mx=Math.max(mx,p.max[j*p.nch+i]);}return mx;})();
  rows=[['Κορυφή ρεύματος (θεμελιώδης)',I1,pk,'A']];}
 else if(t.topology==='rectifier'){const vs=paramsOf('V1'),E=+paramsOf('E1').V,R=+paramsOf('R1').R,Vpk=+vs.Vpk;if(Vpk<=E)return '<p>V̂_s ≤ E: δεν άγει καμία δίοδος.</p>';
  const a=Math.asin(E/Vpk),Iavg=(2*Vpk*Math.cos(a)-E*(Math.PI-2*a))/(Math.PI*R);let q=0;const N=2000;for(let k=0;k<N;k++){const th=a+(Math.PI-2*a)*(k+.5)/N;q+=((Vpk*Math.sin(th)-E)/R)**2;}const Irms=Math.sqrt(q*(Math.PI-2*a)/N/Math.PI);
  eqs=[`α = arcsin(E/V̂_s) = <b>${fmt(a*180/Math.PI,4)}°</b>, αγωγή από α έως π − α (${fmt((180-2*a*180/Math.PI),4)}°)`,`I_avg = [2V̂_s·cos α − E(π − 2α)]/(πR) = <b>${eng(Iavg,'A')}</b>`,`Î = (V̂_s − E)/R = <b>${eng((Vpk-E)/R,'A')}</b>`,`I_rms = <b>${eng(Irms,'A')}</b> · P_μπαταρίας = E·I_avg = <b>${eng(E*Iavg,'W')}</b> · P_R = R·I_rms² = <b>${eng(R*Irms*Irms,'W')}</b>`];
  const st=avgOver('I:R1',1);rows=[['I_avg',Iavg,st?.avg,'A'],['I_rms',Irms,st?.rms,'A'],['Î',(Vpk-E)/R,st?.max,'A']];
  if(+vs.Ls>0)eqs.push('<i>Οι τύποι ισχύουν για L_s = 0· με L_s η προσομοίωση δίνει μικρότερα ρεύματα.</i>');}
 // 4.19.6: the measuring blocks on a rectifier with a capacitor: what they give, and PF = PF₁/√(1 + THD²) with the voltage a sine
 else if(t.topology==='pq_rect'){const y=k=>S.sim?S.sim.now(k):NaN,P1=y('Y:PW:p1'),Q1=y('Y:PW:q1'),PF=y('Y:PW:pf'),PF1=y('Y:PW:pf1'),thd=y('Y:TH')/100,I1=y('Y:TH:h1'),I3=y('Y:F3');
  const pfx=PF1/Math.sqrt(1+thd*thd),st=avgOver('Y:AM1',1);
  eqs=[`Ενεργός ισχύς P = (1/T)∫v·i dt = <b>${eng(y('Y:PW'),'W')}</b>, φαινόμενη S = V·I = <b>${eng(y('Y:PW:s'),'VA')}</b>, συντελεστής ισχύος PF = P/S = <b>${fmt(PF,4)}</b>`,
   `Θεμελιώδης: P₁ = <b>${eng(P1,'W')}</b>, Q₁ = <b>${eng(Q1,'var')}</b>, PF₁ = P₁/S₁ = <b>${fmt(PF1,4)}</b> (συντελεστής μετατόπισης)`,
   `THD του ρεύματος I_H/I₁ = <b>${fmt(100*thd,4)} %</b> (I₁ = ${eng(I1,'A')}). Με ημιτονική τάση P = P₁ και S = V·I = V·I₁·√(1 + THD²), άρα PF = PF₁/√(1 + THD²) = <b>${fmt(pfx,4)}</b>`,
   `3η αρμονική του ρεύματος (κορυφή): <b>${eng(I3,'A')}</b> = ${fmt(100*I3/(I1*Math.SQRT2),3)} % της θεμελιώδους · μέση τάση στον πυκνωτή V_d = <b>${eng(y('Y:AV'),'V')}</b>`];
  rows=[['PF = PF₁/√(1 + THD²)',pfx,PF,''],['I_s,rms = I₁·√(1 + THD²)',I1*Math.sqrt(1+thd*thd),st?.rms,'A']];}
 else if(t.topology==='buck_vloop'){const Vin=+V.V,L=+paramsOf('L1').L,Cc=+paramsOf('C1').C,Rp=paramsOf('R1'),R=+Rp.R,fs=+W.fs,w0=1/Math.sqrt(L*Cc),f0=w0/2/Math.PI,Q=R*Math.sqrt(Cc/L);
  const Kp=+W.Kp,Ki=+W.Ki,Kd=+W.Kd,refS=P.parseSched(W.ref)||[[0,0]],vref=refS[refS.length-1][1],Rs=P.parseSched(Rp.sched),Rend=Rs?Rs[Rs.length-1][1]:R;
  eqs=[`G_vd(s) = V_in/(LC·s² + (L/R)·s + 1): f₀ = 1/(2π√(LC)) = <b>${eng(f0,'Hz')}</b>, Q = R·√(C/L) = <b>${fmt(Q,3)}</b>, G_vd(0) = V_in = ${eng(Vin,'V')}`,
   `Νόμος: d = D₀ + K_p·e + K_i·T_s·Σe${Kd?' + K_d·(e_k − e_{k−1})/T_s (φίλτρο T_f)':''}, με K_p = ${eng(Kp)}, K_i = ${eng(Ki)} 1/s${Kd?`, K_d = ${eng(Kd)} s`:''}, δειγματοληψία στην αρχή κάθε περιόδου (${eng(fs,'Hz')})`,
   Kd?`PID: C(s) ≈ K_i(1 + s/ω_z)²/s με ω_z = √(K_i/K_d) → f_z = <b>${eng(Math.sqrt(Ki/Kd)/2/Math.PI,'Hz')}</b> (≈ 0,7·f₀). Τα μηδενικά αντισταθμίζουν τους πόλους LC, άρα L(s) ≈ K_i·V_in/s και f_c ≈ K_i·V_in/2π = <b>${eng(Ki*Vin/2/Math.PI,'Hz')}</b>`
     :`PI: για ω ≪ ω₀, L(s) ≈ K_i·V_in/s, άρα f_c ≈ K_i·V_in/2π = <b>${eng(Ki*Vin/2/Math.PI,'Hz')}</b>. Στο f₀ η φάση είναι −180° και |L(jω₀)| ≈ Q·V_in·K_i/ω₀ = <b>${fmt(Q*Vin*Ki/w0,3)}</b>: πρέπει να μείνει < 1 (όριο K_i ≈ ${fmt(w0/(Q*Vin),3)}, χωρίς την καθυστέρηση δειγματοληψίας)`,
   `Μόνιμη κατάσταση: ο ολοκληρωτής μηδενίζει το σφάλμα στο σημείο δειγματοληψίας, άρα V_o → V_ref = <b>${eng(vref,'V')}</b> και I_L = V_o/R = <b>${eng(vref/Rend,'A')}</b>. Η μέση τιμή απέχει λίγα mV, γιατί η δειγματοληψία γίνεται σε σταθερό σημείο της κυμάτωσης.`];
  rows=[['V_o (τελικά)',vref,avgOver('V:C1',10)?.avg,'V'],['⟨i_L⟩ (τελικά)',vref/Rend,avgOver('I:L1',10)?.avg,'A']];
  return `<ul class="eqs">${eqs.map(e=>`<li>${e}</li>`).join('')}</ul>${cmpRows(rows)}<h4>Δείκτες από την προσομοίωση</h4>${eventMetricsHTML('V:C1')}`;}
 else if(t.topology==='scr1'){const Vpk=+paramsOf('V1').Vpk,R=+paramsOf('R1').R,rl=!!editor.comp('L1'),q=paramsOf('Q2'),a=(+q?.alpha||0)*Math.PI/180;const vd=nodeAvg('JPR:j',2);
  if(!rl){const Vd=Vpk/Math.PI*(1+Math.cos(a)),Vr=Vpk*Math.sqrt((Math.PI-a+Math.sin(2*a)/2)/(2*Math.PI));
   eqs=[`Ωμικό φορτίο: κάθε θυρίστορ άγει από α έως π, το ρεύμα μηδενίζεται στο τέλος κάθε ημιπεριόδου.`,`V_d = (1/π)∫_α^π V̂ sin θ dθ = (V̂/π)(1 + cos α) = <b>${eng(Vd,'V')}</b>`,
    `V_rms = V̂·√[(π − α + ½ sin 2α)/(2π)] = <b>${eng(Vr,'V')}</b>, I_d = V_d/R = <b>${eng(Vd/R,'A')}</b>, P = V_rms²/R = <b>${eng(Vr*Vr/R,'W')}</b>`];
   rows=[['V_d',Vd,vd?.avg,'V'],['I_d',Vd/R,avgOver('I:R1',2)?.avg,'A'],['V_rms (R)',Vr,avgOver('V:R1',2)?.rms,'V']];}
  else{const Vd=2*Vpk/Math.PI*Math.cos(a),Id=Vd/R;
   eqs=[`Μεγάλη L: το ρεύμα δεν σβήνει, κάθε ζεύγος άγει 180° από α έως π + α και η v_d γίνεται αρνητική μετά το π.`,`V_d = (1/π)∫_α^{π+α} V̂ sin θ dθ = (2V̂/π)·cos α = <b>${eng(Vd,'V')}</b>`,
    `I_d = V_d/R = <b>${eng(Id,'A')}</b>. Ρεύμα πηγής: ορθογώνιο ±I_d, I_s,rms = I_d, θεμελιώδης μετατοπισμένη κατά α: συντελεστής μετατόπισης cos α = ${fmt(Math.cos(a),3)}, PF = 0,9·cos α = <b>${fmt(.9*Math.cos(a),3)}</b>`];
   if(a>=Math.PI/2-1e-9)eqs.push('<i>Για α ≥ 90° χωρίς πηγή στο DC (π.χ. κινητήρα) το ρεύμα σβήνει, η αγωγή γίνεται ασυνεχής και ο τύπος δεν ισχύει.</i>');
   rows=[['V_d',Vd,vd?.avg,'V'],['I_d',Id,avgOver('I:L1',2)?.avg,'A'],['I_s,rms',Id,avgOver('I:V1',2)?.rms,'A']];}}
 else if(t.topology==='bridge3'){const Vpk=+paramsOf('V1').Vpk,R=+paramsOf('R1').R,rl=!!editor.comp('L1'),q=editor.comp('Q1'),scr=q?.type==='SCR',a=scr?(+q.params.alpha||0)*Math.PI/180:0,VLL=Math.sqrt(3)*Vpk/Math.SQRT2;
  const Vd=3*Math.sqrt(3)/Math.PI*Vpk*Math.cos(a),Id=Vd/R;
  eqs=[`V_LL = √3·V̂_φ/√2 = <b>${eng(VLL,'V')}</b> rms. Η v_d ακολουθεί την πολική τάση με τη μεγαλύτερη τιμή: 6 παλμοί ανά περίοδο (${eng(6*(+paramsOf('V1').f),'Hz')}).`,
   `V_d = (3/π)∫_{π/3+α}^{2π/3+α} √3·V̂_φ sin θ dθ = (3√3/π)·V̂_φ·cos α = 1,35·V_LL·cos α = <b>${eng(Vd,'V')}</b>${scr?` (α = ${fmt(a*180/Math.PI,3)}°)`:''}`,
   `I_d = V_d/R = <b>${eng(Id,'A')}</b>${rl?`, I_a,rms = √(2/3)·I_d = <b>${eng(Math.sqrt(2/3)*Id,'A')}</b> (ορθογώνιοι παλμοί 120°)`:''}`];
  if(!rl&&!scr)eqs.push(`Κυμάτωση: από √3·V̂_φ·cos 30° = <b>${eng(1.5*Vpk,'V')}</b> έως √3·V̂_φ = <b>${eng(Math.sqrt(3)*Vpk,'V')}</b>`);
  if(!rl&&a>Math.PI/3)eqs.push('<i>Με ωμικό φορτίο και α > 60° η αγωγή γίνεται ασυνεχής και ο τύπος δεν ισχύει.</i>');
  const vR=avgOver('V:R1',2),vL=rl?avgOver('V:L1',2):null;rows=[['V_d',Vd,vR?vR.avg+(vL?.avg||0):NaN,'V'],['I_d',Id,avgOver('I:R1',2)?.avg,'A']];
  if(rl)rows.push(['I_a,rms',Math.sqrt(2/3)*Id,avgOver('I:V1',2)?.rms,'A']);else if(!scr)rows.push(['v_d min',1.5*Vpk,avgOver('V:R1',2)?.min,'V'],['v_d max',Math.sqrt(3)*Vpk,avgOver('V:R1',2)?.max,'V']);}
 return `<ul class="eqs">${eqs.map(e=>`<li>${e}</li>`).join('')}</ul>${rows.length?cmpRows(rows):''}`;}
function nodeAvg(pin,n){const s=S.sim;if(!s)return null;const nt=s.net.pinNet.get(pin);if(!nt||nt.ground)return null;return avgOver('N:'+nt.canon,n);}

// ------------------------------------------------------------------ math panel
// circuit -> registered-family graph (source, switch, diode, inductor, capacitor, resistor, transformer)
const V1MAP={VDC:['source','Πηγή εισόδου',{p:'p',n:'n'}],SW:['switch','Διακόπτης',{d:'a',s:'b'}],D:['diode','Δίοδος',{a:'a',k:'k'}],L:['inductor','Πηνίο',{a:'a',b:'b'}],
 C:['capacitor','Πυκνωτής εξόδου',{p:'p',n:'n'}],R:['resistor','Φορτίο',{a:'a',b:'b'}],XFMR:['transformer','Μετασχηματιστής (L_m στο πρωτεύον)',null]};
function circuitForMath(){
 const doc=window.Inputs&&Inputs.needs(editor.doc)?Inputs.resolve(editor.doc).project:editor.doc;if(!S.sim||S.error)   // 4.17.1: the numbers of the inputs and of the parameters «= …»return {error:'Το κύκλωμα δεν προσομοιώνεται· διόρθωσε πρώτα τη συνδεσμολογία.'};
 {const d=S.sim.net.diag,lb=id=>editor.comp(id)?.label||id;const bad=[...(d?.skipped||[]).map(x=>lb(x.id)),...(d?.open||[])]; // 3.7: also parts left out of the solution, whatever the option
  if(bad.length)return {error:'Η συμβολική λύση θέλει κλειστό κύκλωμα. Ασύνδετα ή ανοιχτά: '+bad.slice(0,6).join(', ')+(bad.length>6?' και άλλα':'')+'.'};}
 const par=new Map(),find=k=>{while(par.get(k)!==k){par.set(k,par.get(par.get(k)));k=par.get(k);}return k;};
 for(const c of doc.components)for(const pn of Object.keys(P.pinsOf(c)))par.set(c.id+':'+pn,c.id+':'+pn);
 for(const w of doc.wires){const a=w.a.c+':'+w.a.p,b=w.b.c+':'+w.b.p;if(par.has(a)&&par.has(b))par.set(find(a),find(b));}
 const net={pinNet:{get:k=>par.has(k)?{canon:find(k)}:null}};
 const used=doc.components.filter(c=>V1MAP[c.type]),extra=doc.components.filter(c=>!V1MAP[c.type]&&!['GND','JUNC','PWM','SH','TAGO','TAGI'].includes(c.type)&&!(P.BLOCKS.has(c.type)&&c.type!=='AM'&&c.type!=='IP'));
 const why='Η πλήρης συμβολική λύση καλύπτει buck, boost, αντιστρέφοντα buck–boost και flyback με ένα στοιχείο ανά ρόλο.';
 if(!used.length)return {error:'Πρόσθεσε στοιχεία ισχύος (πηγή, διακόπτη, πηνίο…) για να βγει η συμβολική λύση.'};
 if(extra.length)return {error:why+' Αυτό το κύκλωμα έχει και: '+extra.map(c=>`${P.PARTS[c.type].name} ${c.label||c.id}`).join(', ')+'.'};
 // 4.17.1: open pins from the drawing itself (the diagnosis of the solver may still be the one before the last change)
 {const cnt=new Map();for(const k of par.keys()){const r=find(k);cnt.set(r,(cnt.get(r)||0)+1);}
  const open=used.flatMap(c=>Object.keys(P.pinsOf(c)).map(pn=>c.id+':'+pn)).filter(k=>par.has(k)&&cnt.get(find(k))===1);
  if(open.length)return {error:'Η συμβολική λύση θέλει κλειστό κύκλωμα. Ανοιχτοί ακροδέκτες: '+open.slice(0,6).join(', ')+'.'};}
 const by={};for(const c of used){(by[c.type]=by[c.type]||[]).push(c);}
 const dup=Object.entries(by).filter(([,v])=>v.length>1);if(dup.length)return {error:why+' Υπάρχουν περισσότερα από ένα: '+dup.map(([k,v])=>`${P.PARTS[k].name} (${v.map(c=>c.label||c.id).join(', ')})`).join('; ')+'.'};
 const comps=[],groups=new Map(),roles=[],notes=[],params={};
 for(const c of used){const [type,role,pm]=V1MAP[c.type];comps.push({id:c.id,type});const p={...P.defaults(c.type),...c.params};
  const pins=c.type==='XFMR'?(p.pol==='opp'?{p1:'p1',p2:'p2',s1:'s2',s2:'s1'}:{p1:'p1',p2:'p2',s1:'s1',s2:'s2'}):pm;
  for(const [sp,vp] of Object.entries(pins)){const n=net.pinNet.get(c.id+':'+sp);const key=n?n.canon:'open:'+c.id+sp;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(c.id+':'+vp);}
  let value='';
  if(c.type==='VDC'){params.vin=Math.abs(+p.V);value=eng(+p.V,'V');if(+p.Rs>0)notes.push(`Η εσωτερική αντίσταση της ${c.label||c.id} μετρά μόνο στην προσομοίωση.`);}
  if(c.type==='SW'){const pw=editor.comp(p.pwm);const q=pw?{...P.defaults('PWM'),...pw.params}:null;if(!q)return {error:`Ο διακόπτης ${c.label||c.id} δεν έχει μπλοκ PWM.`};
   if(q.mode!=='fixed')notes.push(`Το ${pw.label||pw.id} είναι σε «${q.mode}»: η ανάλυση χρησιμοποιεί το D = ${fmt(+q.D,4)} των παραμέτρων του.`);
   params.D=+q.D;params.fs=+q.fs;value=`${pw.label||pw.id} · D = ${fmt(+q.D,4)} · f_s = ${eng(+q.fs,'Hz')}`;}
  if(c.type==='D'){value='ιδανική';if(+p.Vf>0)notes.push(`Το V_f της ${c.label||c.id} μετρά μόνο στην προσομοίωση.`);}
  if(c.type==='L'){params.L=+p.L;value=eng(+p.L,'H');if(+p.Rs>0)notes.push(`Η αντίσταση τυλίγματος του ${c.label||c.id} μετρά μόνο στην προσομοίωση.`);}
  if(c.type==='C'){params.C=+p.C;value=eng(+p.C,'F');if(+p.esr>0)notes.push(`Η ESR του ${c.label||c.id} μετρά μόνο στην προσομοίωση.`);}
  if(c.type==='R'){params.R=+p.R;value=eng(+p.R,'Ω');if(p.sched)notes.push(`Το πρόγραμμα R(t) του ${c.label||c.id} αγνοείται: η ανάλυση είναι για R = ${eng(+p.R,'Ω')}.`);}
  if(c.type==='XFMR'){params.L=+p.Lm;params.n=+p.n;value=`n = N₂/N₁ = ${fmt(+p.n,4)} · L_m = ${eng(+p.Lm,'H')}`;}
  roles.push({role,label:c.label||c.id,value});}
 const wires=[];for(const g of groups.values())for(let i=1;i<g.length;i++)wires.push({from:g[0],to:g[i]});
 return {circuit:{components:comps,wires},params,roles,notes};}
let mathToken=0,mathTimer=0;
function scheduleMath(delay=700){clearTimeout(mathTimer);mathTimer=setTimeout(runMath,delay);}
function batteryKey(t){const m=S.tutMeta;if(!m||Math.abs(t.vbus-50)>1e-9)return null;const win=m.above?{min:60,mid:80,max:100}:{min:25,mid:32.5,max:40};return Object.keys(win).find(k=>Math.abs(win[k]-t.vst)<1e-9)||null;}
// solution sources for the current tutorial: code template, data templates, or the circuit itself
function mathChoices(t){const list=(window.Exercises?.allFor?.(t.id)||[]).filter(x=>x.kind!=='code'||S.tutMeta);
 const prim=x=>x.kind==='data'&&x.template?.primary;
 return [...list.filter(x=>x.kind==='code'),...list.filter(prim),{kind:'circuit',id:'circuit',title:'Από το κύκλωμα (αναγνώριση τοπολογίας)'},...list.filter(x=>x.kind==='data'&&!prim(x))];}
function renderMathChoices(t){const sel=$('#math-tpl');const list=mathChoices(t);const cur=S.mathChoice?.[t.id];const pick=list.find(x=>x.id===cur)||list[0];
 sel.innerHTML=list.map(x=>`<option value="${esc(x.id)}" ${x.id===pick.id?'selected':''}>${esc(x.kind==='code'?'Engine · '+x.title:x.kind==='data'?'Template δεδομένων · '+x.title:x.title)}</option>`).join('');sel.hidden=list.length<2;return pick;}
async function runTemplate(t,ch,box,src,token){const tpl=ch.template;S.tplOverrides=S.tplOverrides||{};const ov=S.tplOverrides[tpl.id]||{};
 const {vals,src:from}=Exercises.resolveInputs(tpl,{meta:S.tutMeta,param:paramsOf,overrides:ov});
 src.textContent=`template δεδομένων «${tpl.id}» (${ch.src}) · ${Object.values(from).filter(x=>x!=='προεπιλογή').length} είσοδοι από κύκλωμα/tutorial`;
 const r=await api('template_solve',{template:tpl,values:vals});if(token!==mathToken)return;
 MathPanel.renderTemplate(box,r,{src:from,simValue,onInput:(n,v)=>{(S.tplOverrides[tpl.id]=S.tplOverrides[tpl.id]||{})[n]=v;runMath();},onReset:()=>{delete S.tplOverrides[tpl.id];runMath();},
  onDownload:()=>download(tpl.id+'.template.json',JSON.stringify(tpl,null,1))});}
async function runMath(){
 if(!atTop())return;
 const t=tutorial(),box=$('#math'),src=$('#math-src'),token=++mathToken;
 try{
  const ch=renderMathChoices(t);
  if(ch.kind==='data'){await runTemplate(t,ch,box,src,token);return;}
  const ex=ch.kind==='code'?ch.code:null;
  if(ex&&S.tutMeta){src.textContent=`από τα δεδομένα της άσκησης (template «${ex.id}») · σημείο λειτουργίας από τις επιλογές του tutorial`;
   const r=await api(ex.engine.action,ex.engine.request(S.tutMeta));if(token!==mathToken)return;
   const ctx={meta:S.tutMeta,test:null,canLoad:x=>!!batteryKey(x),onLoad:x=>{const k=batteryKey(x);if(!k)return;loadTutorial('battery',{...S.tut.options,vst:k,dir:x.p_bus>0?'dis':'chg',ctrl:'fixed',bus:'ideal'},true);$('.bench').scrollIntoView({behavior:'smooth'});}};
   ctx.test=ex.pickTest(r,ctx);MathPanel.renderExercise(box,ex,r,ctx);return;}
  const conv=circuitForMath();
  if(conv.error){S.recognized=null;if(S.theory)renderTheory();src.textContent='από το κύκλωμα';
   // 5.0.1: a card with buttons (a study, the insulation co-ordination) lives once, in «Θεωρία & σύγκριση με την προσομοίωση»:
   // a copy here had buttons that did nothing and the same ids twice
   const fh=t.theory==='formula'&&theoryValidity(t).ok?formulaTheory(t):'',live=/<(button|select|input|textarea)\b/i.test(fh);
   box.innerHTML=`<p class="muted">${esc(conv.error)}</p>`+(!fh?'':live?`<p class="muted" id="math-live">Τα κουμπιά και τα αποτελέσματα αυτού του tutorial είναι στην κάρτα «Θεωρία & σύγκριση με την προσομοίωση», πιο κάτω. <button data-math-go>↓ Εκεί</button></p>`:`<h4>Βασικές σχέσεις για αυτό το κύκλωμα</h4>`+fh.replace(/\sid="[^"]*"/g,''));   // 5.0.2: a copy of the card carries no ids (the card keeps them)
   box.querySelector('[data-math-go]')?.addEventListener('click',()=>{window.Dock?.reveal('theory');$('#theory').scrollIntoView({behavior:'smooth',block:'start'});});return;}
  src.textContent='από το κύκλωμα · '+conv.roles.map(r=>r.label).join(', ');
  const B=await api('studio_math',{circuit:conv.circuit,params:conv.params});if(token!==mathToken)return;
  S.recognized=B.recognized?.topology||null;S.recognizedKey=circuitSig(editor.doc).key;if(S.theory)renderTheory();
  MathPanel.renderConverter(box,B,conv.roles,[...conv.notes,...(B.notes||[])]);
 }catch(e){if(token!==mathToken)return;box.innerHTML=`<p class="bad">Δεν υπολογίστηκε: ${esc(e.message)}</p>${location.protocol==='file:'?'<p>Άνοιξε την εφαρμογή μέσω <code>python run.py</code>.</p>':''}`;}
}
window.addEventListener('resize',()=>{clearTimeout(window.__mr);window.__mr=setTimeout(()=>MathPanel.redraw($('#math')),200);});

// ------------------------------------------------------------------ files
function saveLocal(){clearTimeout(S.saveT);S.saveT=0;try{localStorage.setItem('pcl2-state',JSON.stringify(project()));}catch{}}
function saveLocalSoon(){clearTimeout(S.saveT);S.saveT=setTimeout(saveLocal,400);}
addEventListener('pagehide',()=>{if(S.saveT)saveLocal();});
function download(name,text,type='application/json'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);}
function exportCSV(){const s=S.sim;if(!s)return;const ch=scope.channels();if(!ch.length){notice('Πρόσθεσε σήματα στο scope πρώτα.','info');return;}const [t0,t1]=scope.viewRange();const idx=ch.map(c=>scope.resolve(c.key));
 const r=s.ring,start=(r.head-r.n+r.cap)%r.cap;let out='time [s],'+ch.map(c=>`"${c.label} [${Scope.unitOf(c.key,s)}]"`).join(',')+'\n';
 for(let i=0;i<r.n;i++){const j=(start+i)%r.cap,t=r.t[j];if(t<t0||t>t1)continue;out+=t.toExponential(9)+','+idx.map(ci=>ci===-1?'':ci===-2?'0':r.d[j*r.nch+ci]).join(',')+'\n';}
 download('scope.csv',out,'text/csv');}

// ------------------------------------------------------------------ scope inputs
function syncScopeInputs(){const w=scope.cfg.window;$('#win-n').value=+(+w.n).toPrecision(4);$('#win-unit').value=w.unit;$('#trigger').value=scope.cfg.trigger;$('#display').value=scope.cfg.display;if($('#dense-mode'))$('#dense-mode').value=scope.cfg.dense==='solid'?'solid':'band';}
function setSpeed(v){S.speed=v==='max'?'max':+v;window.Live?.speed(S.speed,S.stopT);const sel=$('#speed');if(![...sel.options].some(o=>o.value===String(v))){const o=document.createElement('option');o.value=String(v);o.textContent=v+' T/s';sel.appendChild(o);}sel.value=String(v);}

// ------------------------------------------------------------------ settings modal
function openSettings(){const s=editor.settings,m=$('#settings');m.hidden=false;
 const sel=(k,label,opts)=>`<label class="frow"><span>${label}</span><select data-set="${k}">${opts.map(([v,n])=>`<option value="${v}" ${String(s[k])===String(v)?'selected':''}>${n}</option>`).join('')}</select></label>`;
 const chk=(k,label)=>`<label class="frow check"><input type="checkbox" data-set="${k}" ${s[k]?'checked':''}><span>${label}</span></label>`;
 $('#settings-body').innerHTML=`<section><h3>Ποντίκι</h3>
  ${sel('leftDrag','Αριστερό κλικ + σύρσιμο σε κενό',[['select','Επιλογή πολλών (ορθογώνιο)'],['pan','Μετακίνηση καμβά']])}
  ${sel('marquee','Ορθογώνιο επιλογής',[['direction','Δεξιά: πλήρως μέσα · αριστερά: όσα ακουμπά'],['contain','Μόνο όσα είναι πλήρως μέσα'],['touch','Όσα ακουμπά']])}
  ${sel('middleDrag','Μεσαίο κλικ + σύρσιμο',[['pan','Μετακίνηση καμβά'],['none','Τίποτα']])}
  ${sel('rightButton','Δεξί κλικ',[['menu','Μενού (scope, ρυθμίσεις…)'],['pan','Σύρσιμο: καμβάς · κλικ: μενού']])}
  ${sel('wheel','Ροδέλα',[['zoom','Zoom (Shift: οριζόντια κύλιση)'],['scroll','Κύλιση (Ctrl: zoom)']])}
  ${sel('dblclick','Διπλό κλικ σε στοιχείο',[['edit','Ρυθμίσεις'],['scope','Scope ρεύματος']])}
  ${chk('browserMenu','Μενού του browser με δεξί κλικ (Πίσω, Ανανέωση, Αποθήκευση…) όπου η εφαρμογή δεν έχει δικό της')}
  <p class="muted small">Space + σύρσιμο μετακινεί πάντα τον καμβά. Το κείμενο του σχεδίου δεν επιλέγεται ποτέ. Στα πεδία κειμένου το μενού του browser μένει πάντα (αντιγραφή, επικόλληση).</p></section>
  <section><h3>Όψη</h3>${sel('look','Όψη',[['tech','Τεχνική: λευκό, λεπτές ευθείες, μονόχρωμο (προεπιλογή)'],['classic','Κλασική (όπως ως την 4.17.2)']])}
  ${sel('sym','Σύμβολα',[['iec','IEC: αντίσταση ως ορθογώνιο'],['ansi','ANSI: αντίσταση ζιγκ-ζαγκ']])}
  ${s.look==='classic'?'':`${sel('techComp','Πάχος γραμμών των στοιχείων',[[1,'1 px'],[1.5,'1,5 px'],[2,'2 px'],[2.5,'2,5 px']])}${sel('techWire','Πάχος συρμάτων',[[1,'1 px'],[1.5,'1,5 px'],[2,'2 px'],[2.5,'2,5 px']])}${sel('techCorner','Γωνίες συρμάτων',[['sharp','Ορθές'],['round','Στρογγυλεμένες']])}`}
  <p class="muted small">Στην τεχνική όψη το σχέδιο είναι μονόχρωμο, με γραμμές ίδιου πάχους σε κάθε ζουμ· χρώμα παίρνει μόνο ό,τι έχεις επιλέξει.</p></section>
  <section><h3>Πλέγμα & σύρματα</h3>${chk('grid','Εμφάνιση πλέγματος')}${sel('gridStyle','Μορφή πλέγματος',[['dots','Κουκκίδες'],['lines','Γραμμές']])}
  ${s.look==='classic'?`${sel('wireWidth','Πάχος συρμάτων',[[1.6,'Λεπτό'],[2.2,'Κανονικό'],[3,'Χοντρό']])}${sel('corner','Γωνίες συρμάτων',[['round','Στρογγυλεμένες'],['sharp','Ορθές']])}`:''}
  ${chk('freeEnds','Ελεύθερα άκρα: σύρμα που αφήνεις στο κενό κρατά ελεύθερο άκρο (αλλιώς ακυρώνεται)')}${chk('autoConnect','Στοιχείο που αφήνεις πάνω σε σύρμα ή ακροδέκτη συνδέεται, ή μπαίνει σε σειρά (Shift: χωρίς σύνδεση)')}
  ${sel('snapPx','Κούμπωμα σε ακροδέκτη ή σύρμα σε απόσταση',[[6,'6 px'],[12,'12 px'],[20,'20 px']])}
  ${chk('autoRoute','Αυτόματη δρομολόγηση A* όταν αφήνεις στοιχείο (αλλιώς κρατά τη δική σου διαδρομή)')}</section>
  <section><h3>Ζωντανές ενδείξεις</h3>${chk('showLive','Τιμές πάνω στο κύκλωμα')}${chk('showArrows','Βέλη φοράς ρεύματος')}</section>
  <section><h3>Απόδοση</h3><label class="frow check"><input type="checkbox" id="set-live-worker" ${window.Live&&!Live.off?'checked':''} ${window.Live?.supported()?'':'disabled'}><span>Η προσομοίωση σε δικό της thread (Worker): το σχέδιο δεν περιμένει ποτέ τον λύτη${window.Live?.supported()?'':' (δεν υποστηρίζεται εδώ: χρειάζεται SharedArrayBuffer)'}</span></label>
  <p class="muted small">Χωρίς αυτό ο λύτης τρέχει στη σελίδα και υποχωρεί όσο κάνεις zoom, μετακίνηση ή σύρσιμο. Τα κυκλώματα με μπλοκ Python τρέχουν πάντα στη σελίδα.</p></section>`;
 $('#set-live-worker')?.addEventListener('change',e=>{if(!window.Live)return;const was=S.running;if(Live.active)pause();Live.off=!e.target.checked;try{localStorage.setItem('pcl-live-worker',Live.off?'off':'on');}catch{}if(was)play();});
 $$('#settings [data-set]').forEach(el=>el.onchange=()=>{const k=el.dataset.set;let v=el.type==='checkbox'?el.checked:el.value;if(k==='wireWidth'||k==='snapPx'||k==='techComp'||k==='techWire')v=+v;editor.settings[k]=v;saveSettings();
  if(k==='look'||k==='sym'||k==='techComp'){applyLook();renderPalette();}editor.render();renderProps();if(k==='look')openSettings();});}
// 4.17.3 (ROADMAP §65): the look (technical by default, classic) and the style of the symbols, from the settings: a class of
// the body and the widths as CSS variables; the scope takes the colours of the look at its next drawing
function applyLook(){const s=editor.settings,tech=s.look!=='classic';document.body.classList.toggle('look-tech',tech);document.body.classList.toggle('look-classic',!tech);
 document.body.style.setProperty('--w-comp',(+s.techComp||1.5)+'px');P.setSym?.(s.sym==='ansi'?'ansi':'iec');if(scope){scope._col=null;scope.requestDraw?.();}}

// ------------------------------------------------------------------ boot
function boot(){
 const saved=loadSettings();
 // 4.17.3: the look and the symbols before the first drawing
 P.setSym?.(saved.sym==='ansi'?'ansi':'iec');document.body.classList.toggle('look-tech',saved.look!=='classic');document.body.classList.toggle('look-classic',saved.look==='classic');
 editor=new Editor($('#canvas'),{settings:saved,
  onchange:kind=>{if(kind==='struct'||kind==='param'){if(S.batch)S.batch.stale=true;buildSim(false);if(S.theory)setTimeout(()=>{if(tutorial().theory==='v1'||tutorial().theory==='formula')runTheory();},50);scheduleMath();}
   // a move (drag, arrow keys) is saved a moment later, once (4.6: the whole project as JSON on every drag end cost a frame)
   if(kind==='geom')saveLocalSoon();else saveLocal();if(kind==='struct')renderChannels();if(kind==='struct'||kind==='param')window.Watch?.render();},
  onselect:sel=>{$('#selinfo').textContent=sel.c.length+sel.w.length?`${sel.c.length} στοιχεία · ${sel.w.length} σύρματα επιλεγμένα`:'';renderProps();
   // 4.8: one click on a block «Ελεγκτής AI» opens its façade next to it
   if(window.Watch&&sel.c.length===1&&!sel.w.length&&editor.comp(sel.c[0])?.type==='AIC'&&atTop())Watch.facade(sel.c[0]);},
  ontool:on=>{const b=$('#wire-tool');b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on));},
  onedit:ev=>{if(ev.kind==='comp'){const c=editor.comp(ev.id);if(c?.type==='SUB'){enterSub(c.params.def,S.pfx===null?null:pid(c.id));return;}if(window.Inside?.canDbl(c)&&Inside.open(c.id))return;const sg=editor.settings.dblclick==='scope'&&S.pfx!==null?signalsFor(c):[];if(sg.length)addProbe(sg[0][0]+pid(ev.id)+(sg[0][2]||''));else openInspector(ev.id,ev.x,ev.y);}else openWireInspector(ev.id,ev.x,ev.y);},
  ongroup:shift=>{if(shift){const id=editor.selection().c.find(i=>editor.comp(i)?.type==='SUB');if(id)expandSub(id);else{notice('Διάλεξε ένα υποκύκλωμα για ανάπτυξη (Ctrl+Shift+G).','info');setTimeout(()=>notice(''),2500);}}else groupSel();},
  canPlace:placeOk,subParams:name=>subParams(name),
  oncontext:openMenu,onwarn:t=>{notice(t,'error');setTimeout(()=>notice(''),5000);}});
 editor.setLive(liveOf);
 scope=new Scope($('#scope-canvas'),{scroller:$('#scope-scroll'),axis:$('#scope-axis'),status:$('#scope-status'),onfreeze:()=>{$('#live-btn').hidden=false;},onsel:()=>{requestMeasure();renderSel();},onpanecfg:(i,x,y)=>openPaneCfg(i,x,y),onchange:()=>{requestMeasure();$('#nav-box')?.classList.toggle('on',!!scope.cfg.box);$('#nav-sel')?.classList.toggle('on',!!scope.cfg.selMode);if(S.sim&&S.sim.recKeys&&S.sim.recKeys!==S.sim.keys&&!window.Live?.active)S.sim.watchAdd(scope.channels().map(c=>c.key));},onhover:()=>{},archive:recArchive});
 // the tiles of the control signals over the drawing (4.8, ROADMAP §47)
 window.Inside?.init({comp:id=>editor.comp(id),pid,wires:()=>editor.doc.wires,sim:()=>S.error?null:S.sim,eng,holder:()=>editor.holder,notice});
 window.Watch?.init({get S(){return S;},get editor(){return editor;},get scope(){return scope;},eng,fmt,esc,topDoc,atTop,compAt,partDef,numOf,chanLabel,
  unit:key=>{const [pre,id,pin]=key.split(':');if(pre==='Y'){const c=compAt(id);if(c&&!vecBase(id))return blkUnit({...c,id},pin);}return Scope.unitOf(key,S.sim);},
  signals:()=>SIGS,setParam:liveParam,save:saveLocal,saveSoon:saveLocalSoon,toSchedule:changesToSchedule,
  // the façade of the AI controller (4.8): parameters as from the settings window, the solver's blocks, background runs
  setParams:(id,patch)=>editor.setParams(id,patch),simBlock:id=>S.sim?.net.sig.blocks.find(b=>b.id===id)||null,fullDoc,stopT:()=>S.stopT,hdiv:()=>+$('#sim-step').value});
 $('#watch-btn')?.addEventListener('click',()=>Watch.show());
 $('#rec-res')?.addEventListener('change',()=>{applyRec();saveLocal();});$('#rec-file')?.addEventListener('click',recToggle);
 // 4.11: the memory of the scope (remembered), the panel of the recordings, the zoom axes
 $('#rec-opts')?.addEventListener('click',()=>{const P=$('#rec-panel');P.hidden=!P.hidden;if(!P.hidden){recSettings();studySettings();}});$('#study-run')?.addEventListener('click',studyRun);
 $('#zoom-axes')?.addEventListener('change',e=>{scope.cfg.zoomAxes=e.target.value;});
 // 4.17.2 (ROADMAP §63): how dense data look; the graphs in the whole window (Esc: back); the height of the box of the
 // panes (its corner) kept for the next time
 $('#dense-mode')?.addEventListener('change',e=>{scope.cfg.dense=e.target.value;draw(true);});
 {const full=v=>{$('#scope-card').classList.toggle('scope-full',v);$('#scope-full').classList.toggle('on',v);$('#scope-full').setAttribute('aria-pressed',String(v));requestAnimationFrame(()=>scope.resize());};
  $('#scope-full').onclick=()=>full(!$('#scope-card').classList.contains('scope-full'));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#scope-card').classList.contains('scope-full')&&![...document.querySelectorAll('.modal')].some(m=>!m.hidden&&m.offsetParent!==null))full(false);});}
 {const sc=$('#scope-scroll');try{const h=+localStorage.getItem('pcl-scope-h');if(h>=200)sc.style.height=h+'px';}catch(e){}
  let t=0;new ResizeObserver(()=>{if($('#scope-card').classList.contains('scope-full'))return;clearTimeout(t);t=setTimeout(()=>{const h=Math.round(sc.getBoundingClientRect().height);if(h>=200)try{localStorage.setItem('pcl-scope-h',String(h));}catch(e){}},400);}).observe(sc);}
 recSettings().catch(()=>{});
 editor.svg.addEventListener('pointermove',e=>{const el=e.target.closest?.('[data-c]');hoverComp=el?.dataset.c||null;hoverPos=[e.clientX,e.clientY];updateHover();});
 editor.svg.addEventListener('pointerleave',()=>{hoverComp=null;updateHover();});
 // toolbar
 $('#play').onclick=()=>S.running?pause():play();$('#reset').onclick=reset;$('#step1').onclick=()=>stepT(1);$('#step10').onclick=()=>stepT(10);$('#toend').onclick=runToEnd;
 $('#speed').onchange=e=>setSpeed(e.target.value);
 $('#step-mode').onchange=e=>{editor.setSolve({step:e.target.value==='var'?'var':''});};
 $('#theory').addEventListener('click',e=>{const b=e.target.closest('[data-study]');if(b)studyAct(b.dataset.study);const c=e.target.closest('[data-insco]');if(c)inscoAct(c.dataset.insco);});$('#study-open').addEventListener('change',e=>studyOpen(e.target.files[0]));   // 4.19.1: the buttons of a study card (the card is redrawn while the simulation runs)
 document.querySelectorAll('[data-dsev]').forEach(x=>x.onchange=renderDiag);$('#diag-src').onchange=renderDiag;$('#diag-q').oninput=renderDiag;
 $('#diag-check').onclick=()=>{if(S.sim&&!S.error)S.sim.stepCheck();renderDiag();};
 $('#diag-clear').onclick=()=>{if(S.sim){S.sim.dg=new Map();S.sim.dgVer=(S.sim.dgVer||0)+1;window.Live?.call('dgClear');}S.batchDiag=[];renderDiag();};
 try{if(localStorage.getItem('pcl-diag-open')==='1')$('#diag').open=true;}catch(e){}
 $('#diag').addEventListener('toggle',()=>{try{localStorage.setItem('pcl-diag-open',$('#diag').open?'1':'0');}catch(e){}});
 $('#sim-step').onchange=()=>{if(S.sim){S.sim.setStep(+$('#sim-step').value);S.sim.cache.clear();updateClock();scheduleStepCheck();}};
 $('#stop').onchange=e=>{const v=P.parseEng(e.target.value);S.stopT=Number.isFinite(v)&&v>0?v*1e-3:0;window.Live?.speed(S.speed,S.stopT);saveLocal();};
 $('#win-n').onchange=e=>{const v=P.parseEng(e.target.value);if(v>0){scope.cfg.window.n=v;scope.cfg.frozen=null;draw(true);}};
 $('#win-unit').onchange=e=>{scope.cfg.window.unit=e.target.value;scope.cfg.frozen=null;draw(true);};
 $('#trigger').onchange=e=>{scope.cfg.trigger=e.target.value;draw(true);};$('#display').onchange=e=>{scope.cfg.display=e.target.value;draw(true);};
 $('#avgline').onchange=e=>{scope.cfg.avgLine=e.target.checked;draw(true);};
 ['#rm-sig','#rm-ev','#rm-ref','#rm-band','#rm-val','#rm-t'].forEach(q=>$(q).onchange=renderMetricsPanel);$('#rm-block').ontoggle=renderMetricsPanel;
 ['#ff-sig','#ff-f1','#ff-p','#ff-h'].forEach(q=>$(q).onchange=renderFFT);$('#ff-block').ontoggle=renderFFT;
 $('#ev-block').ontoggle=renderEvents;$('#ev-kind').onchange=renderEvents;$('#ev-src').oninput=renderEvents;$('#ev-csv').onclick=eventsCsv;if($('#ev-json'))$('#ev-json').onclick=eventsJson;
 if($('#ev-max')){const m=$('#ev-max');m.value=String(evMaxSetting());m.onchange=()=>{try{localStorage.setItem(EVMAX_KEY,m.value);}catch(e){}if(S.sim?.ev)S.sim.ev.max=+m.value;renderEvents();};}
 $('#eis-block').ontoggle=renderEISForm;$('#eis-run').onclick=runEIS;$('#eis-stop').onclick=()=>{EIS.run=false;};
 ['#bf-sig','#bf-stat'].forEach(q=>$(q).onchange=renderPoincare);$('#bf-block').ontoggle=()=>{renderBifurcationForm();renderPoincare();};$('#bf-run').onclick=runBifurcation;$('#bf-stop').onclick=stopBifurcation;
 $('#bt-run').onclick=runBatch;$('#bt-clear').onclick=clearBatch;$('#bt-show').onchange=e=>{scope.setRefs(e.target.checked&&S.batch?{label:S.batch.label,data:S.batch.data}:null);};
 $('#bt-block').ontoggle=()=>{if($('#bt-block').open&&!$('#bt-tend').value&&S.sim)$('#bt-tend').placeholder=S.sim.t>0?String(+(S.sim.t*1e3).toPrecision(5)):S.stopT?String(+(S.stopT*1e3).toPrecision(5)):'ms';};
 $('#live-btn').onclick=()=>{scope.cfg.frozen=null;$('#live-btn').hidden=true;draw(true);};
 {let show=true;try{show=localStorage.getItem('pcl2-live-panel')!=='0';}catch{}setLivePanel(show);
  $('#lp-toggle').onclick=()=>setLivePanel($('#live-panel').hidden);$('#lp-hide').onclick=()=>setLivePanel(false);
  // moved by its title inside the scope area, and resized from every side (5.0.2, winframe.js: its size kept)
  window.WinFrame?.frame($('#live-panel'),{key:'live',head:'.lp-head',move:true,minW:220,minH:120});}
 const navOpen=v=>{$('#scope-nav').hidden=!v;$('#nav-toggle').setAttribute('aria-expanded',v);$('#nav-toggle').classList.toggle('on',v);try{localStorage.setItem('pcl2-nav',v?'1':'0');}catch{}scope.resize();};
 $('#nav-toggle').onclick=()=>navOpen($('#scope-nav').hidden);try{navOpen(localStorage.getItem('pcl2-nav')!=='0');}catch{navOpen(true);}
 $$('#scope-nav [data-nav]').forEach(b=>b.onclick=()=>{if(b.dataset.nav==='heights'){scope.autoHeights();renderChannels();return;}scope.nav(b.dataset.nav);$('#live-btn').hidden=!scope.cfg.frozen;$('#nav-follow').classList.toggle('on',scope.cfg.follow!==false);syncScopeInputs();renderChannels();draw(true);});
 const METHOD_NOTE={TR:'2ης τάξης, χωρίς απόσβεση',BDF2:'2ης τάξης, απόσβεση στις υψηλές συχνότητες',BE:'1ης τάξης, ισχυρή απόσβεση'};
 $('#method').onchange=e=>{S.sim?.setMethod(e.target.value);scheduleStepCheck();$('#method-note').textContent=METHOD_NOTE[e.target.value];saveLocal();};
 $('#add-signal').onchange=e=>{if(e.target.value)addProbe(e.target.value);e.target.value='';};
 // 4.18.1: a new, empty pane; the next signal added goes there (the panes that stay empty go away with the next change)
 // 4.18.1: the sources of the traces under their names (off by default: the list keeps its height), remembered
 {const on=v=>{document.body.classList.toggle('show-src',v);$('#chan-src').classList.toggle('on',v);};let v0=false;try{v0=localStorage.getItem('pcl.chanSrc')==='1';}catch(e){}on(v0);
  $('#chan-src').onclick=()=>{const v=!document.body.classList.contains('show-src');on(v);try{localStorage.setItem('pcl.chanSrc',v?'1':'0');}catch(e){}};}
 $('#pane-add').onclick=()=>{const P=scope.cfg.panes;if(P.length>=12){flash('#chan-list');return;}const last=P.length-1;if(P[last]&&!P[last].ch.length&&last>0){scope.nextPane=last;renderChannels();return;}P.push({ch:[]});scope.nextPane=P.length-1;chanKey='';renderChannels();draw(true);};
 $('#sig-search').oninput=()=>fillSignals();
 // 4.4: the add-ons card from the top bar (it sits below the scope and the scenarios)
 $('#open-addons').onclick=()=>{const d=$('#addons-block');if(!d)return;d.open=true;window.Dock?.reveal('addons');$('#addons-card').scrollIntoView({behavior:'smooth',block:'start'});};
 // Enter adds the first signal that matches; Esc clears the search
 $('#sig-search').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();const o=$('#add-signal').querySelector('option[value]:not([value=""])');if(o){addProbe(o.value);}}else if(e.key==='Escape'){e.target.value='';fillSignals();}};
 const probeSel=pre=>{const ids=editor.selection().c.filter(id=>{const c=editor.comp(id);return c&&signalsFor(c).some(([p,,f])=>p===pre&&!f);});if(!ids.length){notice('Επίλεξε πρώτα στοιχεία στο κύκλωμα (κλικ ή ορθογώνιο).','info');setTimeout(()=>notice(''),2500);return;}ids.forEach(id=>addProbe(pre+pid(id)));};
 $('#probe-i').onclick=()=>probeSel('I:');$('#probe-v').onclick=()=>probeSel('V:');
 $('#csv').onclick=exportCSV;
 $('#cr-open').onclick=()=>$('#cr-file').click();$('#cr-clear').onclick=clearCsv;
 $('#cr-file').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const C=parseCSV(await f.text());C.file=f.name;S.csv=C;renderCsvMap();$('#cr-status').innerHTML=`${C.names.length} ${C.names.length===1?'στήλη':'στήλες'} σημάτων, ${C.t.length.toLocaleString('el-GR')} γραμμές. Διάλεξε σε ποιο σήμα αντιστοιχεί η καθεμία.`;$('#cr-status').className='bt-status';}
  catch(err){$('#cr-status').innerHTML='Σφάλμα: '+esc(err.message);$('#cr-status').className='bt-status err';}e.target.value='';};$('#clear-cursors').onclick=()=>{scope.cfg.cursors=[];draw(true);};
 $('#fit').onclick=()=>editor.fit();$('#undo').onclick=()=>editor.undo();$('#redo').onclick=()=>editor.redo();$('#rot').onclick=()=>editor.rotateSel();$('#del').onclick=()=>editor.deleteSel();
 $('#tutorials').onclick=()=>gallery(true);$('#gallery-close').onclick=()=>gallery(false);
 $('#open-settings').onclick=openSettings;$('#settings-close').onclick=()=>$('#settings').hidden=true;
 $('#theory-refresh').onclick=()=>runTheory();$('#math-refresh').onclick=()=>runMath();
 $('#math-tpl').onchange=e=>{S.mathChoice=S.mathChoice||{};S.mathChoice[tutorial().id]=e.target.value;runMath();};
 $('#math-open').onclick=()=>$('#tpl-file').click();
 $('#tpl-file').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const tpl=JSON.parse(await f.text());const r=Exercises.registerData(tpl,'αρχείο '+f.name,true);S.mathChoice=S.mathChoice||{};S.mathChoice[tutorial().id]=r.id;runMath();$('#math-card').scrollIntoView({behavior:'smooth'});}catch(err){notice('Template: '+esc(err.message),'error');}e.target.value='';};
 Exercises.load().then(()=>runMath());
 $('#new').onclick=()=>loadTutorial('empty');
 $('#save').onclick=()=>download((tutorial().id||'circuit')+'.pcl.json',JSON.stringify(project(),null,1));
 $('#open').onclick=()=>$('#file').click();
 $('#file').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const pr=JSON.parse(await f.text());if(!Array.isArray(pr.components))throw Error('Δεν είναι αρχείο κυκλώματος.');S.tut=pr.tutorial||{id:'empty',options:{}};S.tutMeta=null;S.tutRef=pr.tutRef||tutorialRef(S.tut);applyProject(pr);if(typeof pr.scenario==='string')S.scenForeign=true;renderTutorial();runTheory();}catch(err){notice('Άνοιγμα: '+esc(err.message),'error');}e.target.value='';};
 // the wheel over the bench (toolbar, library, drawing, parameters) never scrolls the page (4.6): a list that can still scroll
 // in that direction takes it (and keeps it, overscroll-behavior), the drawing zooms, anything else ignores it
 $('.bench')?.addEventListener('wheel',e=>{if(e.defaultPrevented)return;let el=e.target;const top=e.currentTarget;
  while(el&&el!==top){if(el.nodeType===1&&Editor.canScroll(el,e)){const st=getComputedStyle(el);if(/(auto|scroll)/.test(st.overflowY+st.overflowX))return;}el=el.parentNode;}
  e.preventDefault();},{passive:false});
 palLoad();$('#pal-search').oninput=renderPalette;$('#pal-tax').onchange=e=>{PAL.tax=e.target.value;palSave();renderPalette();};$('#pal-toggle').onclick=()=>document.body.classList.toggle('pal-hidden');
 // parameters panel (3.7) and wire tool
 {let open=innerWidth>700;try{const v=localStorage.getItem('pcl2-props');if(v)open=v==='1';}catch{}setProps(open);
  $('#props-btn').onclick=()=>setProps(!propsOpen());$('#props-tab').onclick=()=>setProps(true);}
 $('#wire-tool').onclick=()=>{editor.setWireTool(!editor.wireTool);editor.svg.focus({preventScroll:true});};
 try{if(window.Live&&localStorage.getItem('pcl-live-worker')==='off')Live.off=true;}catch{}
 // 4.8: Python blocks run in the worker of the live simulation, which loads Python there: the page builds them without
 // the interpreter (no freeze when a tutorial with Python opens); the page loads Python only if it must run them itself
 if(window.PyRT&&window.Live&&Live.supported()&&!PyRT.ready)PyRT.lazy=true;
 // Python loaded on the page for any reason (an add-on, a script, pyPage): the stand-ins become the real blocks
 if(window.PyRT)PyRT.onready=()=>{if(window.Live?.active||!S.sim?.pyLazy?.())return;try{S.sim.pyUpgrade();}catch(e){S.error=e.message;notice('Η προσομοίωση σταμάτησε: '+esc(e.message),'error');}};
 if(window.Live)Live.onstatus=m=>{if(m.python==='loading')notice('Φορτώνεται η Python στο thread της προσομοίωσης (μία φορά· η σελίδα συνεχίζει κανονικά)…','info');else if(m.python==='ready')notice('');};
 // the time of the last input anywhere on the page: the solver yields the frame to the page for 250 ms after it (4.6)
 for(const ev of ['pointerdown','pointermove','wheel','keydown'])document.addEventListener(ev,()=>{S.lastInput=performance.now();},{capture:true,passive:true});
 // 5.0.1: the menu of the browser (Πίσω, Ανανέωση, Αποθήκευση…) does not open with a right click inside the page, unless
 // the setting «Μενού του browser με δεξί κλικ» is on; in the fields of text it stays, for copy and paste
 document.addEventListener('contextmenu',e=>{if(editor.settings.browserMenu)return;const t=e.target;if(t?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"])'))return;e.preventDefault();});
 document.addEventListener('pointerdown',e=>{if(!e.target.closest('#ctx,#ctx-sub'))closeMenu();if(!e.target.closest('#inspector')&&!e.target.closest('.schem')&&!e.target.closest('#ctx'))closeInspector();});
 document.addEventListener('keydown',e=>{const tg=e.target,typing=tg&&(tg.isContentEditable||/^(INPUT|SELECT|TEXTAREA)$/.test(tg.tagName)),plain=!e.ctrlKey&&!e.metaKey&&!e.altKey;
  // by the position of the key (4.6): the same with a Greek layout (e.key «π», «ι», «ζ»)
  if(e.code==='KeyP'&&plain&&!typing){setLivePanel($('#live-panel').hidden);return;}
  if(e.code==='KeyI'&&plain&&!typing){setProps(!propsOpen());return;}
  if(e.code==='KeyS'&&plain&&!e.shiftKey&&!typing&&window.Watch){Watch.show();return;}
  // Ctrl+Z / Ctrl+Y (Ctrl+Shift+Z) from anywhere except a text field, which keeps its own undo
  if((e.ctrlKey||e.metaKey)&&!e.altKey&&(e.code==='KeyZ'||e.code==='KeyY')&&e.target!==editor.svg){const text=tg&&(tg.isContentEditable||tg.tagName==='TEXTAREA'||(tg.tagName==='INPUT'&&/^(text|number|search|email|url|password|tel|)$/.test(tg.type||'')));if(!text&&editor.key(e,true))return;}
  if(e.key==='Escape'){closeMenu();closeInspector();gallery(false);$('#settings').hidden=true;if(e.target!==editor.svg&&editor.escape(false))editor.svg.focus({preventScroll:true});}   // Esc always drops the part being placed
  if(e.target===document.body&&e.code==='Space'){e.preventDefault();S.running?pause():play();}});
 // resizable canvas
 const grip=$('#grip');grip.onpointerdown=e=>{e.preventDefault();grip.setPointerCapture(e.pointerId);const h0=$('.work').getBoundingClientRect().height,y0=e.clientY;grip.onpointermove=ev=>{$('.work').style.height=Math.max(240,Math.min(1000,h0+ev.clientY-y0))+'px';};grip.onpointerup=()=>{grip.onpointermove=null;};};
 renderPalette();
 // restore last state or start with a tutorial
 initScenarios();initAddons();initPanels();initConsole();
 $('#sel-out')?.addEventListener('click',e=>{if(e.target.closest('[data-selzoom]'))scope.nav('selzoom');else if(e.target.closest('[data-selclear]'))scope.nav('clearsel');else if(e.target.closest('[data-selcsv]'))selCSV();});
 let st=null;try{st=JSON.parse(localStorage.getItem('pcl2-state'));}catch{}
 const qs=new URLSearchParams(location.search),want=qs.get('tutorial');let imp=null;
 if(qs.get('import')){try{imp=JSON.parse(localStorage.getItem('pcl2-import'));localStorage.removeItem('pcl2-import');}catch{}history.replaceState(null,'',location.pathname);}
 if(imp&&Array.isArray(imp.components)){S.tut=imp.tutorial||{id:'empty',options:{}};S.tutMeta=null;S.tutRef=circuitSig(imp);applyProject(imp);renderTutorial();runTheory();runMath();notice('Άνοιξε το κύκλωμα από τον αναλυτικό πάγκο '+esc(imp.from||'')+'. Οι αρχικές συνθήκες είναι της μόνιμης κατάστασης που υπολόγισε.','info');setTimeout(()=>notice(''),6000);}
 else if(want&&Tutorials.get(want))loadTutorial(want);
 else if(st&&Array.isArray(st.components)){S.tut=st.tutorial||{id:'empty',options:{}};S.tutRef=st.tutRef||tutorialRef(S.tut);const t=Tutorials.get(S.tut.id);if(t&&S.tut.id!=='empty'){const pr=t.build({...Object.fromEntries(t.options.map(o=>[o.k,o.def])),...S.tut.options});S.tutMeta=pr.meta||null;}applyProject(st);renderTutorial();runTheory();runMath();}
 else loadTutorial('buck');
 fetch('/api/health').then(r=>r.json()).then(h=>{$('#engine').textContent='Engine '+h.version;$('#engine').classList.add('ok');}).catch(()=>{$('#engine').textContent='Χωρίς server: μόνο προσομοίωση';});
 setInterval(()=>{if(S.theory&&(S.running||S.frame))renderTheoryLive();},1000);
}
function renderTheoryLive(){if(!atTop()||document.querySelector('#theory details[open]'))return;renderTheory();}
// 5.0.2 (ROADMAP §94 step α): the register of the panels (panels.js) and the menu «Παράθυρα»: the cards of the page, the
// panels of the work area and every window, each with the one element it has in the page; a window that needs a part
// or a study first says which
function initPanels(){const R=window.Panels;if(!R)return;
 const one=()=>{const ids=[...editor.sel.c];return ids.length===1?editor.comp(ids[0]):null;};
 const pick=(test,why)=>()=>{const c=one();return c&&test(c)?'':why;};
 const shut=sel=>()=>{const m=document.querySelector(sel);m?.querySelector('.modal-head .x,[data-rvclose],[data-cwclose],[data-swclose]')?.click();};
 const live=sel=>()=>{const m=document.querySelector(sel);return !!m&&!m.hidden&&m.getClientRects().length>0;};
 const cards=[['circuit','Κύκλωμα','#bench-card',false],['scope','Προσομοίωση και scopes','#scope-card'],['scen','Σενάρια (Python)','#scen-card'],['cmd','Γραμμή εντολών (Python)','#cmd-card'],['addons','Πρόσθετα και σύνδεση','#addons-card'],
  ['math','Υπολογισμοί & μαθηματικά','#math-card'],['theory','Περιγραφή & σύγκριση με τη θεωρία','#tut-card']];
 // 5.0.5 (§94 step β): a card in a tab that is not shown is still open (its tab is there); opened from the menu, it is shown
 for(const [id,title,sel,cl] of cards)R.register({id,title,group:'card',sel,closable:cl!==false,hint:cl===false?'Το σχέδιο δεν κλείνει· μετακινείται και κουμπώνει με τα ⠿ ▾ της γραμμής του':'',
  isOpen:()=>!document.querySelector(sel)?.hidden,place:()=>window.Dock?.label(id)||'',onshow:on=>{if(on)window.Dock?.reveal(id);if(on&&id==='scope'){scope.resize();draw(true);}}});
 R.register({id:'library',title:'Βιβλιοθήκη',group:'pane',sel:'.palette',isOpen:()=>!document.body.classList.contains('pal-hidden'),open:()=>document.body.classList.remove('pal-hidden'),close:()=>document.body.classList.add('pal-hidden')});
 R.register({id:'props',title:'Παράμετροι',group:'pane',sel:'#props',isOpen:()=>propsOpen(),open:()=>setProps(true),close:()=>setProps(false),hint:'πλήκτρο I'});
 R.register({id:'watch',title:'Σήματα ελέγχου',group:'pane',sel:'#watch-panel',lazy:true,isOpen:()=>!!window.Watch?.vis,can:()=>window.Watch&&atTop()&&S.pfx!==null?'':'Στο κύκλωμα του πρώτου επιπέδου',
  open:()=>Watch.show(true),close:()=>Watch.show(false),hint:'πλήκτρο S'});
 R.register({id:'live',title:'Ζωντανές παράμετροι',group:'pane',sel:'#live-panel',open:()=>setLivePanel(true),close:()=>setLivePanel(false),hint:'πλήκτρο P'});
 R.register({id:'nav',title:'Πλοήγηση γραφημάτων',group:'pane',sel:'#scope-nav',isOpen:()=>!$('#scope-nav').hidden,open:()=>{if($('#scope-nav').hidden)$('#nav-toggle').click();},close:()=>{if(!$('#scope-nav').hidden)$('#nav-toggle').click();}});
 R.register({id:'diag',title:'Κονσόλα διαγνωστικών',group:'pane',sel:'#diag',isOpen:()=>$('#diag').open&&!$('#scope-card').hidden,can:()=>$('#scope-card').hidden?'Είναι μέσα στην «Προσομοίωση και scopes»':'',open:()=>{$('#diag').open=true;},close:()=>{$('#diag').open=false;}});
 R.register({id:'gallery',title:'Tutorials',sel:'#gallery',open:()=>gallery(true),close:()=>gallery(false)});
 R.register({id:'settings',title:'Ρυθμίσεις',sel:'#settings',open:openSettings,close:()=>{$('#settings').hidden=true;}});
 R.register({id:'netview',title:'Διάγραμμα του δικτύου',sel:'#netview',can:()=>STUDY.view?'':'Ανοίγει από μια μελέτη δικτύου («🗺 Διάγραμμα του δικτύου»)',open:netViewOpen,close:()=>$('#nv-close').click()});
 R.register({id:'inspector',title:'Ρυθμίσεις στοιχείου',sel:'#inspector',can:pick(()=>true,'Διάλεξε ένα στοιχείο'),open:()=>{const c=one(),r=editor.holder.getBoundingClientRect();openInspector(c.id,r.left+r.width/2,r.top+40);},close:closeInspector});
 R.register({id:'inside',title:'⧉ Μέσα σε στοιχείο',sel:'#lib-inside',lazy:true,isOpen:()=>!!window.Inside?.openId(),can:pick(c=>!!window.Inside?.can(c),'Διάλεξε ένα στοιχείο βιβλιοθήκης (π.χ. AVR, πυλώνας)'),
  open:()=>Inside.open(one().id),close:()=>Inside.close()});
 R.register({id:'pinscope',title:'Ακροδέκτες και scopes στοιχείου',sel:'#pin-scope',lazy:true,isOpen:live('#pin-scope'),can:pick(c=>S.pfx!==null&&c.type!=='JUNC'&&pinScopeOf(c).n>0,'Διάλεξε ένα στοιχείο (δεξί κλικ → ⌁ Scopes → Παραθυράκι)'),open:()=>openPinScope(one().id),close:closePinScope});
 R.register({id:'facade',title:'Ελεγκτής AI (πρόσοψη)',sel:'#ai-facade',lazy:true,isOpen:()=>!!window.Watch?.facadeId(),can:pick(c=>c.type==='AIC'&&atTop(),'Διάλεξε ένα μπλοκ «Ελεγκτής AI»'),
  open:()=>Watch.facade(one().id),close:()=>Watch.facade(null)});
 R.register({id:'ctlwin',title:'Ρύθμιση ελεγκτή',sel:'.ctl-modal',lazy:true,isOpen:live('.ctl-modal'),can:pick(c=>c.type==='PWM'&&({...P.defaults('PWM'),...c.params}).mode==='pi'&&!!window.CtlWin,'Διάλεξε ένα PWM με ελεγκτή PI'),
  open:()=>openCtlWin(one().id),close:shut('.ctl-modal')});
 R.register({id:'linedata',title:'Δεδομένα γραμμής',sel:'.ld-modal',lazy:true,isOpen:live('.ld-modal'),can:pick(c=>c.type==='TLM'&&({...P.defaults('TLM'),...c.params}).src!=='modal'&&!!window.LineData,'Διάλεξε μια γραμμή από γεωμετρία'),
  open:()=>LineData.open(one().id,lineCtx()),close:shut('.ld-modal')});
 R.register({id:'split',title:'Τρέξιμο σε υποδίκτυα',sel:'.split-modal',lazy:true,isOpen:live('.split-modal'),can:()=>window.SplitWin&&S.sim&&!S.error?'':'Θέλει ένα κύκλωμα που τρέχει',open:openSplitWin,close:shut('.split-modal')});
 R.register({id:'recview',title:'Προβολή καταγραφής',sel:'.rv-modal',lazy:true,isOpen:live('.rv-modal'),can:()=>'Ανοίγει από τις καταγραφές («Καταγραφή» → ▤)',close:shut('.rv-modal')});
 // one entry per add-on: its window
 R.source(()=>(window.Addons?.list||[]).filter(a=>!a.error).map(a=>({id:'addon:'+a.id,title:'Πρόσθετο: '+a.name,isOpen:()=>Addons.frames.has(a.id),open:()=>Addons.open(a.id),close:()=>Addons.close(a.id)})));
 R.restore();
 // 5.0.5 (ROADMAP §94 step β): the cards dock, float, go as tabs and fill the screen (dock.js); their buttons go into the
 // row each card already has at its top
 window.Dock?.init([['circuit','#bench-card','.toolbar'],['scope','#scope-card','.sim-bar'],['scen','#scen-card','#scen > summary'],['cmd','#cmd-card','#cmd > summary'],['addons','#addons-card','#addons-block > summary'],
  ['math','#math-card','.math-top'],['theory','#tut-card','.tut-head']].map(([id,sel,head])=>({id,sel,head,title:cards.find(c=>c[0]===id)[1],closable:id!=='circuit'}))
  // 5.0.6 (§94 step γ): the diagram of the network, a document of the central area (its place in the page: under the circuit)
  .concat([{id:'netview',sel:'#netview',head:'.nv-head',title:'Διάγραμμα του δικτύου',closable:true}]));
 window.Dock?.onChange(()=>{if(!$('#scope-card').hidden)requestAnimationFrame(()=>scope.resize());});
 $('#open-panels')?.addEventListener('click',e=>R.openMenu(e.currentTarget));}
window.addEventListener('DOMContentLoaded',boot);
window.PCL={get S(){return S;},get editor(){return editor;},get scope(){return scope;},loadTutorial,libToSub,enterSub,leaveSub,openInspector,lineCtx,addProbe,play,pause,reset,renderTheory,renderFFT,renderPoincare,runBifurcation,get BF(){return BF;},runEIS,get EIS(){return EIS;},get SCEN(){return SCEN;},scenRun,
 renderEvents,togglePin,refreshControls,changesToSchedule,renderProps,studyAct,get STUDY(){return STUDY;},folderRun:studyRun,folderSettings:studySettings,folderView:studyView,get SFOLD(){return SFOLD;},get NV(){return NV;},studyOpen,runNNCompare,get NNC(){return NNC;},project,liveParam,pyPage,stepT,get REC(){return REC;},recToggle,recFlush,draw,closeInspector,openCtlWin,openPinScope,closePinScope,pinScopeOf:id=>pinScopeOf(editor.comp(id))}; // 3.19: for tests/ui/live_flow.js; 4.7: the comparison of nn_compare; 4.17.2: scope_flow
})();
