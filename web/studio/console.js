'use strict';
// 5.0.8 (ROADMAP §98, decision 372): the card «Γραμμή εντολών»: one Python command at a time, the variables kept between
// the commands, as the Command Window of MATLAB. Two kernels with the same commands (pcl/console.py): Pyodide in a worker of
// the page (console_worker.js), and the Python of the local server (engine/console.py, a process per page). «Αυτόματα» takes
// the server when it runs and has Node.js (then p.run, net, SciPy and the files of the computer all work), else Pyodide.
// app.js gives what the page knows (Console.init): the circuit, the study of the diagram, the chosen buses, the code of
// «Σενάρια», how to show a table or a chart, and how to put a channel on the scope.
(function(root){
 const $=s=>document.querySelector(s)||root.Dock?.q?.(s)||null;   // 5.0.10: the card may be on the second screen (dock.js)
 const HKEY='pcl.console.history',KKEY='pcl.console.kernel',HMAX=500;
 const C={ctx:null,w:null,wready:false,ibuf:null,busy:false,more:false,kernel:'auto',active:null,why:'',sid:null,token:null,info:null,
  hist:[],hpos:-1,draft:'',seq:0,wait:new Map(),sent:{pyodide:null,server:null},files:[],started:null,gen:0,activeGen:-1};
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const store={get(k){try{return localStorage.getItem(k);}catch(e){return null;}},set(k,v){try{localStorage.setItem(k,v);}catch(e){}}};

 function init(ctx){C.ctx=ctx;const card=$('#cmd-card');if(!card)return;
  try{C.hist=JSON.parse(store.get(HKEY)||'[]').filter(x=>typeof x==='string').slice(-HMAX);}catch(e){C.hist=[];}
  C.kernel=['auto','pyodide','server'].includes(store.get(KKEY))?store.get(KKEY):'auto';$('#cmd-kernel').value=C.kernel;
  const t=$('#cmd-line');
  t.addEventListener('keydown',key);t.addEventListener('input',fit);
  $('#cmd-kernel').onchange=e=>{C.kernel=e.target.value;store.set(KKEY,C.kernel);C.gen++;C.active=null;state('');out(`Πυρήνας: ${label(C.kernel)}. Οι μεταβλητές κάθε πυρήνα είναι χωριστές.`,'note');start();};
  $('#cmd-stop').onclick=interrupt;$('#cmd-clc').onclick=clc;$('#cmd-script').onclick=saveScript;$('#cmd-toscen').onclick=toScen;
  $('#cmd-file').onchange=upload;$('#cmd-out').addEventListener('click',()=>{if(!getSelection().toString())t.focus();});
  $('#cmd').addEventListener('toggle',()=>{if($('#cmd').open)start();});
  prompt();}

 function label(k){return {auto:'Αυτόματα',pyodide:'Pyodide (στη σελίδα)',server:'Python του server'}[k]||k;}
 function state(t,kind){const e=$('#cmd-state');if(!e)return;e.textContent=t||'';e.className='scen-state'+(kind?' '+kind:'');}
 function kinfo(t){const e=$('#cmd-kinfo');if(e)e.textContent=t;}
 function prompt(){$('#cmd-prompt').textContent=C.more?'...':'>>>';}
 function fit(){const t=$('#cmd-line');t.style.height='auto';t.style.height=Math.min(240,t.scrollHeight)+'px';}
 function out(text,cls){const o=$('#cmd-out'),el=document.createElement('pre');el.className='cmd-o'+(cls?' '+cls:'');el.textContent=String(text).replace(/\n$/,'');o.appendChild(el);o.scrollTop=o.scrollHeight;return el;}
 function echo(code,cont){out(code.split('\n').map((l,i)=>(i||cont?'... ':'>>> ')+l).join('\n'),'cmd-echo');}
 function clc(){$('#cmd-out').innerHTML='';}

 // ------------------------------------------------------------- the kernels
 async function start(){
  for(;;){if(C.active&&C.activeGen===C.gen)return C.active;
   if(C.started){await C.started.catch(()=>{});continue;}
   const gen=C.gen;C.started=open();let k;try{k=await C.started;}finally{C.started=null;}
   if(gen===C.gen){C.active=k;C.activeGen=gen;return k;}
   if(k==='server')closeServer();}}          // opened for a kernel that is no longer the chosen one
 async function open(){const k=C.kernel;let why='';
  if(k!=='pyodide'){const s=await openServer();
   if(s&&(k==='server'||s.node)){C.why=k==='server'?'':'ο server της εφαρμογής τρέχει και έχει Node.js: p.run, net, SciPy και τα αρχεία του υπολογιστή';
    kinfo(`Python ${s.python} του server · φάκελος ${s.cwd}`+(k==='auto'?` · Αυτόματα: ${C.why}`:''));return 'server';}
   if(s&&!s.node){why='ο server δεν βρίσκει το Node.js (το p.run θέλει την Python της σελίδας)';closeServer();}
   else why=k==='server'?'ο server δεν απαντά (python run.py)':'χωρίς server της εφαρμογής';
   if(k==='server')kinfo('Ο πυρήνας του server δεν ανοίγει: '+why+'. Μένει η Python της σελίδας.');}
  C.why=why;worker();if(!C.wready)state('φορτώνεται η Python (Pyodide)…','busy');
  kinfo('Pyodide στη σελίδα'+(why?` · ${k==='auto'?'Αυτόματα: ':''}${why}`:''));return 'pyodide';}
 async function openServer(){try{if(!C.token){const t=await fetch('/api/link/token');if(!t.ok)return null;C.token=(await t.json()).token;}
   const r=await post({op:'open'});C.sid=r.session;C.info=r;C.sent.server=null;return r;}catch(e){return null;}}
 function closeServer(){if(C.sid)post({op:'close',session:C.sid}).catch(()=>{});C.sid=null;}
 async function post(body){const r=await fetch('/api/console',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:C.token,...body})});
  const j=await r.json();if(!r.ok)throw new Error(j.error||('HTTP '+r.status));return j;}
 function worker(){if(C.w)return C.w;const w=new Worker('studio/console_worker.js');C.w=w;C.wready=false;C.sent.pyodide=null;
  w.onmessage=e=>msg(e.data);w.onerror=e=>{out('Σφάλμα του worker: '+(e.message||e),'cmd-err');done();};w.postMessage({type:'boot'});return w;}
 function msg(m){switch(m.type){
  case 'cready':C.wready=true;C.ibuf=m.buf||null;if(!C.busy)state('');kinfo(`Pyodide ${m.version} στη σελίδα`+(C.why?` · ${C.kernel==='auto'?'Αυτόματα: ':''}${C.why}`:'')+(m.interrupt?'':' · Ctrl+C ξεκινά την Python από την αρχή'));break;
  case 'res':{const p=C.wait.get(m.id);if(p){C.wait.delete(m.id);p(m.result);}break;}
  case 'out':out(m.text);break;case 'err':out(m.text,'cmd-err');break;
  case 'tick':state(`τρέχει… ${Math.round(100*m.f)} %`,'busy');break;case 'progress':state(`τρέχει… σημείο ${m.i}/${m.n}`,'busy');break;
  case 'file':file(m.name,m.bytes);break;
  case 'batch':batch(m);break;case 'batch-fetch':write(m.sab,C.batchOut);C.batchOut=null;break;}}
 // a sweep of a command in parallel, on the pool of the page (as the panel «Σενάρια»)
 async function batch(m){const pool=C.pool||(C.pool=new Pool.SimPool()),t0=performance.now();let outs;
  try{outs=await pool.map(m.qs,(i,r,d,n)=>state(`τρέχει… σημείο ${d}/${n} · ${pool.n} workers`,'busy'),true);}catch(e){outs=m.qs.map(()=>({error:String(e&&e.message||e)}));}
  write(m.sab,new TextEncoder().encode(Scenario.json({workers:pool.n,wall_s:(performance.now()-t0)/1000,outs})));}
 function write(sab,bytes){const h=new Int32Array(sab,0,2),cap=sab.byteLength-8;
  if(bytes.length>cap){C.batchOut=bytes;h[1]=bytes.length;Atomics.store(h,0,2);Atomics.notify(h,0);return;}
  new Uint8Array(sab,8,bytes.length).set(bytes);h[1]=bytes.length;Atomics.store(h,0,1);Atomics.notify(h,0);}
 function ask(req){return new Promise(res=>{const id=++C.seq;C.wait.set(id,res);worker().postMessage({...req,id});});}

 // what the page knows, sent with a command: the circuit only when it changed since the last command of this kernel
 function context(kind){const c=C.ctx,o={};try{const pj=JSON.stringify(c.project());if(pj!==C.sent[kind]){o.project=pj;o.name=c.name();C.sent[kind]=pj;}}catch(e){}
  o.net=c.net()||null;o.sel=c.sel()||[];o.scen=c.scen()||'';return o;}
 async function request(req){const k=await start();
  if(k==='server'){try{return await post({...req,session:C.sid,ctx:req.ctx&&context('server')});}
   catch(e){if(/συνεδρία|session/i.test(e.message)){C.active=null;C.sid=null;out('Ο πυρήνας του server ξανάνοιξε: οι μεταβλητές του χάθηκαν.','cmd-err');await start();return post({...req,session:C.sid,ctx:req.ctx&&context('server')});}throw e;}}
  return ask({type:req.op,code:req.code,block:req.block,text:req.text,ctx:req.ctx&&context('pyodide')});}

 // ------------------------------------------------------------- a command
 async function submit(){const t=$('#cmd-line'),code=t.value;if(C.busy)return;
  const block=code.includes('\n');if(!code.trim()&&!C.more){echo('',false);return;}
  t.value='';fit();if(code.trim()){remember(code);}C.hpos=-1;
  echo(code,C.more&&!block);
  C.busy=true;$('#cmd-stop').disabled=false;state('τρέχει…','busy');
  let r;try{r=await request({op:'exec',code,block,ctx:true});}catch(e){r={more:false,error:String(e.message||e)};}
  done(r);}
 function done(r){C.busy=false;$('#cmd-stop').disabled=true;if(!r){state('');return;}
  C.more=!!r.more;prompt();state('');
  if(r.out)out(r.out);if(r.err)out(r.err,'cmd-err');
  for(const d of r.shows||[]){const host=document.createElement('div');host.className='cmd-show';$('#cmd-out').appendChild(host);C.ctx.show(d,host);}
  for(const a of r.page||[])page(a);
  if(r.error)out(r.error,'cmd-err');
  if(r.whos)whos(r.whos);
  const o=$('#cmd-out');o.scrollTop=o.scrollHeight;$('#cmd-line').focus();}
 function page(a){if(a.op==='clc')clc();else if(a.op==='scope'){const res=C.ctx.scope(a.keys||[]);if(res)out(res,res.startsWith('✓')?'note':'cmd-err');}}
 function remember(code){if(C.hist[C.hist.length-1]!==code)C.hist.push(code);if(C.hist.length>HMAX)C.hist.splice(0,C.hist.length-HMAX);store.set(HKEY,JSON.stringify(C.hist));}

 async function interrupt(){if(!C.busy)return;state('διακοπή…','busy');
  if(C.active==='server'){try{await post({op:'interrupt',session:C.sid});}catch(e){}return;}
  if(C.ibuf){C.ibuf[0]=2;return;}
  // without a SharedArrayBuffer the only way is to stop the worker: its variables are lost
  C.w.terminate();C.w=null;C.wready=false;for(const p of C.wait.values())p({more:false,error:'KeyboardInterrupt: η Python σταμάτησε και ξεκινά από την αρχή· οι μεταβλητές χάθηκαν (η σελίδα δεν είναι cross-origin isolated).'});C.wait.clear();worker();}

 async function complete(){const t=$('#cmd-line'),pos=t.selectionStart,text=t.value.slice(0,pos);if(C.busy||!/[A-Za-z_][\w.]*$/.test(text))return false;
  let r;try{r=await request({op:'complete',text,ctx:true});}catch(e){return true;}
  const ms=r.matches||[];if(!ms.length)return true;const word=text.slice(r.start);
  let pre=ms[0];for(const m of ms)while(!m.startsWith(pre))pre=pre.slice(0,-1);
  if(pre.length>word.length||ms.length===1){const ins=(ms.length===1?ms[0]:pre).slice(word.length);t.setRangeText(ins,pos,pos,'end');fit();}
  else out(ms.slice(0,60).join('   ')+(ms.length>60?`   … (${ms.length})`:''),'cmd-comp');
  return true;}

 function key(e){const t=e.target;e.stopPropagation();
  if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();submit();return;}
  if(e.key==='Tab'&&!e.shiftKey){e.preventDefault();complete();return;}
  if((e.ctrlKey||e.metaKey)&&e.code==='KeyC'&&t.selectionStart===t.selectionEnd){e.preventDefault();
   if(C.busy){interrupt();return;}
   if(t.value||C.more){echo(t.value+'^C',C.more);t.value='';fit();if(C.more){C.more=false;prompt();request({op:'reset'}).catch(()=>{});}out('KeyboardInterrupt','cmd-err');}return;}
  if(e.key==='Escape'){t.value='';fit();return;}
  if(e.code==='KeyL'&&e.ctrlKey){e.preventDefault();clc();return;}
  const first=!t.value.slice(0,t.selectionStart).includes('\n'),last=!t.value.slice(t.selectionEnd).includes('\n');
  if(e.key==='ArrowUp'&&first&&C.hist.length){e.preventDefault();if(C.hpos<0){C.draft=t.value;C.hpos=C.hist.length;}if(C.hpos>0)C.hpos--;t.value=C.hist[C.hpos];fit();return;}
  if(e.key==='ArrowDown'&&last&&C.hpos>=0){e.preventDefault();C.hpos++;if(C.hpos>=C.hist.length){C.hpos=-1;t.value=C.draft;}else t.value=C.hist[C.hpos];fit();}}

 // ------------------------------------------------------------- the table of the variables, the files, the script
 function whos(rows){const tb=$('#cmd-ws tbody');if(!tb)return;
  tb.innerHTML=rows.length?rows.map(r=>`<tr class="${r.given?'given':''}" title="${esc(r.value)}"><td>${esc(r.name)}</td><td>${esc(r.type)}</td><td>${esc(r.size)}</td><td>${esc(r.value)}</td></tr>`).join(''):'<tr><td colspan="4" class="muted">καμία μεταβλητή</td></tr>';}
 function file(name,bytes){const old=C.files.findIndex(f=>f.name===name);if(old>=0){URL.revokeObjectURL(C.files[old].url);C.files.splice(old,1);}
  const blob=new Blob([bytes]);C.files.push({name,size:bytes.byteLength,url:URL.createObjectURL(blob)});
  $('#cmd-files').innerHTML=C.files.map(f=>`<a href="${f.url}" download="${esc(f.name)}" title="${(f.size/1024).toFixed(1)} kB">⬇ ${esc(f.name)}</a>`).join(' ');}
 async function upload(e){const fs=[...e.target.files];e.target.value='';if(!fs.length)return;
  if(C.active==='server'){out('Ο πυρήνας του server διαβάζει τα αρχεία του υπολογιστή κατευθείαν: load(r"διαδρομή"), run(r"διαδρομή.py").','note');return;}
  await start();for(const f of fs){const b=await f.arrayBuffer();const r=await new Promise(res=>{const id=++C.seq;C.wait.set(id,res);worker().postMessage({type:'put',id,name:f.name,bytes:b},[b]);});out(`Στον φάκελο της Python της σελίδας: ${r.put||f.name}`,'note');}}
 // the commands that went through, as a script for «Σενάρια» or for the command line of the system
 async function script(){let hist=[];try{const r=await request({op:'history'});hist=r.history||[];}catch(e){}
  if(!hist.length)return '';const uses=n=>hist.some(h=>new RegExp('\\b'+n+'\\b').test(h)),c=C.ctx;
  const head=['# Από τη γραμμή εντολών της εφαρμογής ('+new Date().toISOString().slice(0,16).replace('T',' ')+')','import pcl','from pcl.console import *        # plot, scope, whos, clear, save, load, help, run, clc',
   "if 'p' not in globals():","    p = pcl.current()            # στα «Σενάρια» το κύκλωμα της οθόνης· αλλού: pcl.use(pcl.load('…')) πρώτα"];
  if(uses('np'))head.push('import numpy as np');
  if(uses('sel'))head.push('sel = '+JSON.stringify(c.sel()||[]));
  if(uses('net')&&c.net())head.push('import json, pcl.study','net = pcl.study.network_of(json.loads('+JSON.stringify(JSON.stringify(c.net()))+'))   # το δίκτυο της μελέτης του διαγράμματος, με τις αλλαγές του');
  return head.join('\n')+'\n\n'+hist.join('\n')+'\n';}
 async function saveScript(){const s=await script();if(!s){out('Καμία εντολή ακόμη.','note');return;}
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([s],{type:'text/x-python'}));a.download='γραμμή_εντολών.py';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);}
 async function toScen(){const s=await script();if(!s){out('Καμία εντολή ακόμη.','note');return;}C.ctx.toScenario(s);out('Οι εντολές είναι στα «Σενάρια».','note');}

 root.Console={init,start,submit:code=>{$('#cmd-line').value=code;return submit();},get state(){return {busy:C.busy,more:C.more,active:C.active,why:C.why,hist:C.hist.slice(),ready:C.active==='server'?!!C.sid:C.wready,files:C.files.map(f=>f.name)};},interrupt,clc,script};
})(typeof window!=='undefined'?window:globalThis);
