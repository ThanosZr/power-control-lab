'use strict';
// The client of an add-on (3.15): include it with <script src="/studio/addon_client.js"></script> in the add-on's page.
// Every call returns a Promise. The add-on runs in a sandboxed frame: it reaches the app only through these calls,
// and only with the permissions of its pcl-addon.json. The page's own scripts go in files (the app's CSP has no inline scripts).
//   await PCL.info()                         app, version, circuit, selection, T
//   await PCL.project() / PCL.params(id?)    the circuit, its components and parameters
//   await PCL.get('R1.R') / PCL.set('R1.R', 10, {tool:'…'}) / PCL.setMany({...}, source)
//   await PCL.selection() / PCL.channels() / PCL.scope({keys})
//   await PCL.run({t_end, channels, measure}) / PCL.batch([...]) / PCL.bifurcation({comp, param, key, values})
//   await PCL.python(code, inputs, files)   Python in the app's worker, the answer is the variable `result`
//   PCL.show(obj) / PCL.notify(msg, sev) / PCL.download(name, text | {base64}, mime)
//   PCL.on('target' | 'selection' | 'project', f)
(function(){
 const pending=new Map(),handlers={};let seq=0;
 window.addEventListener('message',e=>{if(e.source!==window.parent)return;const m=e.data;if(!m)return;
  if(m.pclReply===1){const p=pending.get(m.id);if(!p)return;pending.delete(m.id);if('error' in m)p.rej(new Error(m.error));else p.res(m.result);return;}
  if(m.pclEvent)for(const f of handlers[m.pclEvent]||[])try{f(m.data);}catch(x){console.error(x);}});
 const call=(method,args)=>new Promise((res,rej)=>{const id=++seq;pending.set(id,{res,rej});window.parent.postMessage({pcl:1,id,method,args:args||{}},'*');});
 const q=new URLSearchParams(location.search);
 window.PCL={call,target:q.get('target')||'',
  info:()=>call('info'),project:()=>call('project.get'),load:project=>call('project.load',{project}),params:id=>call('params',{id}),
  get:key=>call('get',{key}),set:(key,value,source)=>call('set',{key,value,source}),setMany:(values,source)=>call('set_many',{values,source}),
  selection:()=>call('selection'),presets:()=>call('presets'),channels:()=>call('channels'),scope:(o={})=>call('scope',o),values:keys=>call('values',{keys}),advance:(dt,set,keys)=>call('advance',{dt,set,keys}),reset:()=>call('reset'),
  run:(o={})=>call('run',o),batch:queries=>call('batch',{queries}),bifurcation:o=>call('bifurcation',o),
  python:(code,inputs,files)=>call('python',{code,inputs:inputs||{},files:files||{}}),
  show:obj=>call('show',{obj}),notify:(msg,sev,fix)=>call('notify',{msg,sev,fix}),
  download:(name,data,mime)=>call('download',typeof data==='string'?{name,text:data,mime}:{name,...data,mime}),
  on:(ev,f)=>{(handlers[ev]=handlers[ev]||[]).push(f);}};
 PCL.on('target',d=>{PCL.target=d.target||'';});
})();
