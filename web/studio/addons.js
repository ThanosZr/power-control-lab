'use strict';
// Add-ons and the link to outside programs (3.15, ROADMAP §35, §36). The host side, in the page.
// * An add-on is a page (pcl-addon.json + HTML/JS) opened in a sandboxed frame. It talks to the app only through
//   messages: {pcl:1, id, method, args} → {pclReply:1, id, result | error}. The client is studio/addon_client.js.
// * The link: programs on this computer call the same methods through the server (engine/addons.py Link), when the
//   user has turned it on: the page takes each call with a long poll and posts the answer back.
// Methods (and the permission an add-on needs for each; the link may call all of them):
//   info, presets · project.get, params, get, selection, channels, scope, values (project.read) · set, set_many, project.load (project.write)
//   run, batch, bifurcation (run) · python (python) · show, notify (show) · download (files)
(function(root){
 const PERM={'project.get':'project.read',params:'project.read',get:'project.read',selection:'project.read',channels:'project.read',scope:'project.read',values:'project.read',
  set:'project.write',set_many:'project.write','project.load':'project.write',run:'run',batch:'run',bifurcation:'run',python:'python',show:'show',notify:'show',download:'files'};
 const PERM_TXT={'project.read':'διαβάζει το κύκλωμα και τα αποτελέσματα','project.write':'αλλάζει παραμέτρους ή φορτώνει κύκλωμα','run':'τρέχει προσομοιώσεις',
  'python':'τρέχει κώδικα Python (στον browser)','show':'δείχνει πίνακες, γραφήματα και μηνύματα','files':'κατεβάζει αρχεία'};
 const A={list:[],ctx:null,frames:new Map(),pool:null,link:{on:false,token:null,n:0,last:null,err:null},PERM,PERM_TXT};
 const clone=o=>JSON.parse(JSON.stringify(o));
 const num=v=>{const x=typeof v==='number'?v:root.Parts.parseEng(v);return Number.isFinite(x)?x:v;};

 A.init=function(ctx){A.ctx=ctx;root.addEventListener('message',onMessage);A.refresh();try{if(localStorage.getItem('pcl-link')==='1')A.linkOn(true);}catch(e){}};
 A.refresh=async function(){try{const r=await fetch('api/addons');if(!r.ok)throw new Error((await r.json()).error||r.status);const j=await r.json();A.list=j.addons;A.userDir=j.user_dir;}
  catch(e){A.list=[];A.err=String(e.message||e);}if(A.ctx&&A.ctx.changed)A.ctx.changed();return A.list;};
 A.forType=type=>A.list.filter(a=>!a.error&&(a.targets||[]).some(t=>t.type===type));

 // -------------------------------------------------------------- the methods
 function key(k){const s=String(k||''),i=s.indexOf('.');if(i<1)throw new Error(`Το κλειδί γράφεται <id>.<παράμετρος>, όχι «${s}».`);return [s.slice(0,i),s.slice(i+1)];}
 function comp(id){const c=A.ctx.editor.comp(id);if(!c){const ids=A.ctx.editor.doc.components.map(x=>x.id);throw new Error(`Δεν υπάρχει στοιχείο «${id}». Υπάρχουν: ${ids.join(', ')}`);}return c;}
 function setOne(k,v,src){const [id,p]=key(k);const c=comp(id);const val=typeof v==='string'||typeof v==='number'||typeof v==='boolean'?v:JSON.stringify(v);
  A.ctx.editor.setParams(id,{[p]:val});if(src){c.from={...(c.from||{}),[p]:src};}return c.params[p];}
 function query(a){const q={...a,project:a.project||A.ctx.project()};delete q.method;return q;}
 function poolOf(){return A.pool||(A.pool=new root.Pool.SimPool());}
 // a circuit with a Python block runs here, in the page (the pool's workers have no Python): Python is loaded the first time
 async function onPage(q){try{return root.Scenario.handle(q);}catch(e){if(!e.needPython||!root.PyRT)throw e;await root.PyRT.load();return root.Scenario.handle(q);}}
 async function solve(q){if(root.Pool.hasPython(q.project))return onPage(q);
  const [o]=await poolOf().map([q]);return o;}
 function scopeData(a){const s=A.ctx.sim();if(!s)throw new Error('Δεν υπάρχει προσομοίωση.');const r=s.ring;
  const want=a.keys&&a.keys.length?a.keys:A.ctx.scopeKeys().filter(k=>s.chIndex.has(k));const idx=want.map(k=>{const i=s.chIndex.get(k);if(i===undefined)throw new Error(`Άγνωστο κανάλι ${k}`);return i;});
  const t=[],y=want.map(()=>[]);for(let j=0;j<r.n;j++){t.push(r.t[j]);idx.forEach((i,m)=>y[m].push(r.d[j*r.nch+i]));}
  const ch={};want.forEach((k,m)=>{ch[k]=y[m];});return {keys:want,t,ch,T:s.T,now:s.t};}
 const M={
  info:a=>({app:'Power Converter Lab',version:A.ctx.version(),title:A.ctx.title(),tutorial:A.ctx.tutorial(),selection:A.ctx.selection(),
   T:A.ctx.sim()?.T??null,t:A.ctx.sim()?.t??null,isolated:!!root.crossOriginIsolated,workers:root.Pool?root.Pool.SIZE():1}),
  'project.get':()=>clone(A.ctx.project()),
  'project.load':a=>{if(!a.project||!Array.isArray(a.project.components))throw new Error('Λείπει το project (components, wires).');A.ctx.applyProject(clone(a.project));return {ok:true,components:a.project.components.length};},
  params:a=>{const out={};for(const c of A.ctx.editor.doc.components){if(a.id&&c.id!==a.id)continue;out[c.id]={type:c.type,label:c.label||c.id,params:clone(c.params||{}),from:c.from||null};}return out;},
  get:a=>{const [id,p]=key(a.key);const c=comp(id);const d={...(root.Parts.defaults?root.Parts.defaults(c.type):{}),...c.params};if(!(p in d))throw new Error(`Το ${id} δεν έχει παράμετρο «${p}».`);return d[p];},
  set:a=>({key:a.key,value:setOne(a.key,a.value,a.source)}),
  set_many:a=>{const out={};for(const [k,v] of Object.entries(a.values||{}))out[k]=setOne(k,v,a.source);return out;},
  selection:()=>A.ctx.selection(),
  presets:async()=>{const r=await fetch('api/presets');if(!r.ok)throw new Error('Τα πρότυπα θέλουν τον server της εφαρμογής.');return (await r.json()).presets;},
  channels:()=>{const s=A.ctx.sim();return s?{keys:[...s.keys],T:s.T}:{keys:[],T:null};},
  values:a=>{const s=A.ctx.sim();if(!s)return {t:null,values:{}};const v={};for(const k of a.keys||[])if(s.chIndex.has(k))v[k]=s.now(k);return {t:s.t,values:v};},
  scope:a=>scopeData(a),
  run:async a=>solve({...query(a),action:'run'}),
  batch:async a=>{const qs=(a.queries||[]).map(q=>({...query(q),action:q.action||'run'}));if(qs.some(q=>root.Pool.hasPython(q.project))){const out=[];for(const q of qs){try{out.push({out:await onPage(q)});}catch(e){out.push({error:String(e.message||e)});}}return out;}
   return poolOf().map(qs,null,true);},
  bifurcation:async a=>{const q=query(a),vals=(a.values||[]).map(Number);const outs=await poolOf().map(vals.map(v=>({...q,action:'bifurcation',values:[v]})));return {points:outs.map(o=>o.points[0])};},
  python:async a=>A.ctx.python(String(a.code||''),a.inputs||{},a.files||{}),
  show:a=>{A.ctx.show(a.obj||a);return true;},
  notify:a=>{A.ctx.notify({sev:['error','warn','info'].includes(a.sev)?a.sev:'info',msg:String(a.msg||''),fix:String(a.fix||''),id:a.id||null,src:a.src||'addon'});return true;},
  download:a=>{const data=a.base64?Uint8Array.from(atob(a.base64),c=>c.charCodeAt(0)):String(a.text??'');const url=URL.createObjectURL(new Blob([data],{type:a.mime||'application/octet-stream'}));
   const el=document.createElement('a');el.href=url;el.download=String(a.name||'αρχείο');document.body.appendChild(el);el.click();el.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);return true;},
 };
 // one call: the method, its arguments, who calls (an add-on with its permissions, or the link)
 A.call=async function(method,args,from){const f=M[method];if(!f)throw new Error('Άγνωστη μέθοδος: '+method);
  if(from&&from.addon){const need=PERM[method];if(need&&!(from.addon.permissions||[]).includes(need))throw new Error(`Το πρόσθετο «${from.addon.name}» δεν έχει δηλώσει την άδεια ${need}.`);}
  return f(args||{});};

 // -------------------------------------------------------------- the frames
 async function onMessage(e){const m=e.data;if(!m||m.pcl!==1)return;let fr=null;for(const f of A.frames.values())if(f.el.contentWindow===e.source){fr=f;break;}if(!fr)return;
  let reply;try{reply={pclReply:1,id:m.id,result:await A.call(m.method,m.args,{addon:fr.addon})};}catch(x){reply={pclReply:1,id:m.id,error:String(x&&x.message||x)};}
  try{e.source.postMessage(JSON.parse(JSON.stringify(reply,(k,v)=>typeof v==='number'&&!Number.isFinite(v)?null:v)),'*');}catch(x){e.source.postMessage({pclReply:1,id:m.id,error:'Η απάντηση δεν στέλνεται: '+x.message},'*');}}
 A.confirmed=a=>{if(a.builtin)return true;try{return localStorage.getItem('pcl-addon-ok:'+a.id+'@'+a.version)==='1';}catch(e){return false;}};
 // open an add-on in its dock (a user add-on asks first, with its permissions, like code that came with a file, §10)
 A.open=function(id,opts={}){const a=A.list.find(x=>x.id===id);if(!a||a.error)return false;
  if(!A.confirmed(a)){const txt=(a.permissions||[]).map(p=>'• '+(PERM_TXT[p]||p)).join('\n')||'• (καμία)';
   if(!confirm(`Το πρόσθετο «${a.name}» ${a.version} δεν είναι ενσωματωμένο. Ανοίγει σε απομονωμένο πλαίσιο και μπορεί να:\n${txt}\n\nΆνοιγμα;`))return false;
   try{localStorage.setItem('pcl-addon-ok:'+a.id+'@'+a.version,'1');}catch(e){}}
  let fr=A.frames.get(id);const qs=new URLSearchParams({target:opts.target||'',v:a.version});
  if(!fr){const box=A.ctx.dock(a);const el=document.createElement('iframe');el.className='addon-frame';el.title=a.name;
   el.setAttribute('sandbox','allow-scripts allow-forms allow-downloads allow-modals');el.src=a.base+a.entry+'?'+qs;box.body.appendChild(el);fr={addon:a,el,box};A.frames.set(id,fr);}
  else{fr.box.show();fr.el.contentWindow?.postMessage({pclEvent:'target',data:{target:opts.target||''}},'*');}
  return true;};
 A.close=function(id){const fr=A.frames.get(id);if(!fr)return;fr.el.remove();fr.box.remove();A.frames.delete(id);};
 // events to every open add-on: the selection or the circuit changed
 A.emit=function(ev,data){for(const f of A.frames.values())try{f.el.contentWindow?.postMessage({pclEvent:ev,data},'*');}catch(e){}};
 A.install=async function(file){const buf=new Uint8Array(await file.arrayBuffer());let bin='';for(let i=0;i<buf.length;i+=0x8000)bin+=String.fromCharCode(...buf.subarray(i,i+0x8000));
  const r=await fetch('api/addon_install',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:file.name,zip:btoa(bin)})});const j=await r.json();if(!r.ok)throw new Error(j.error||r.status);await A.refresh();return j;};
 A.remove=async function(id){const r=await fetch('api/addon_remove',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});const j=await r.json();if(!r.ok)throw new Error(j.error);A.close(id);await A.refresh();return j;};

 // -------------------------------------------------------------- the link
 A.linkOn=async function(on){A.link.on=!!on;try{localStorage.setItem('pcl-link',on?'1':'0');}catch(e){}if(A.ctx.changed)A.ctx.changed();if(!on||A.link.loop)return;
  A.link.loop=true;try{while(A.link.on){try{if(!A.link.token){const r=await fetch('api/link/token');if(!r.ok)throw new Error((await r.json()).error||r.status);A.link.token=(await r.json()).token;}
     const r=await fetch('api/link/next?token='+encodeURIComponent(A.link.token),{cache:'no-store'});
     if(r.status===204)continue;if(r.status===403){A.link.token=null;continue;}if(!r.ok)throw new Error('server '+r.status);
     const c=await r.json();let ans;try{ans={result:await A.call(c.method,c.args,null)};}catch(x){ans={error:String(x&&x.message||x)};}
     A.link.n++;A.link.last={method:c.method,t:new Date().toLocaleTimeString(),ok:!ans.error};A.link.err=null;if(A.ctx.changed)A.ctx.changed();
     await fetch('api/link/reply',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:A.link.token,id:c.id,...JSON.parse(JSON.stringify(ans,(k,v)=>typeof v==='number'&&!Number.isFinite(v)?null:v))})});}
    catch(x){A.link.err=String(x.message||x);if(A.ctx.changed)A.ctx.changed();await new Promise(r=>setTimeout(r,3000));}}}
  finally{A.link.loop=false;}};

 root.Addons=A;if(typeof module!=='undefined')module.exports=A;
})(typeof window!=='undefined'?window:globalThis);
