import {setMesh} from '../cad_t007/viewport.mjs';
const $=id=>document.getElementById(id);
let state=null,busy=false;
function status(message,error=false){$('edit-status').textContent=message;$('edit-status').dataset.state=error?'error':'ready';}
function lock(value){busy=value;for(const b of document.querySelectorAll('[data-edit],#params input,#feature-params input,#feature-params select,#document'))b.disabled=value||!state;
  if(state&&!value){$('undo').disabled=!state.can_undo;$('redo').disabled=!state.can_redo;
    const f=state.document.features.find(f=>f.id==='profile'&&f.op==='sketch'),p=state.document.features.find(f=>f.id==='plate'&&f.op==='extrude');
    $('apply').disabled=!p||!f?.model.constraints.some(c=>c.id==='width');
    $('apply-feature').disabled=!state.document.features.some(f=>f.id==='body'&&f.op==='revolve')||!state.document.features.some(f=>f.id==='result'&&['union','subtract','intersect'].includes(f.op));}}
async function request(url,options){const response=await fetch(url,options),data=await response.json();if(!response.ok)throw Error(data.error||'Request failed');return data;}
function accept(next){
  const mesh=next.results[next.document.output], changed=!state||next.revision!==state.revision;
  if(changed)setMesh(mesh);state=next;
  $('tree').replaceChildren(...next.document.features.map(f=>{const row=document.createElement('li');row.textContent=`${f.id} · ${f.op}${f.profile?' ← '+f.profile:f.left?' ← '+f.left+', '+f.right:''} · ${next.regeneration.rebuilt.includes(f.id)?'rebuilt':'reused'}`;return row;}));
  const expanded=next.document.schema===2;
  $('params').hidden=expanded;$('feature-params').hidden=!expanded;$('param-title').textContent=expanded?'Revolve / boolean parameters':'Plate parameters';
  if(expanded){document.querySelector('header h1').textContent='Power & Control Lab · CAD Native Features';document.querySelector('header p').textContent='0.10.0 · exact revolve and boolean BRep · isolated C3 reference';}
  $('angle').value=next.document.features.find(f=>f.id==='body'&&f.op==='revolve')?.angle_deg??'';
  $('boolean').value=next.document.features.find(f=>f.id==='result')?.op??'';
  const p=next.document.features.find(f=>f.id==='profile'&&f.op==='sketch');
  $('width').value=p?.model.constraints.find(c=>c.id==='width')?.value??'';
  $('depth').value=next.document.features.find(f=>f.id==='plate'&&f.op==='extrude')?.depth_mm??'';
  $('document').value=JSON.stringify(next.document,null,2);$('revision').textContent='Revision '+next.revision;
  $('volume').textContent='Exact volume: '+mesh.volume_mm3.toFixed(3)+' mm³';
}
async function command(action,extra={}){if(busy||!state)return;lock(true);status('Regenerating…');try{
  accept(await request('/api/command',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,revision:state.revision,...extra})}));status('Ready');
}catch(e){try{const latest=await request('/api/state');if(latest.revision!==state.revision)accept(latest);}catch(_){}status(e.message,true);}finally{lock(false);}}
$('params').onsubmit=e=>{e.preventDefault();const doc=structuredClone(state.document);doc.features.find(f=>f.id==='profile').model.constraints.find(c=>c.id==='width').value=$('width').valueAsNumber;doc.features.find(f=>f.id==='plate').depth_mm=$('depth').valueAsNumber;command('apply',{document:doc});};
$('feature-params').onsubmit=e=>{e.preventDefault();const doc=structuredClone(state.document);doc.features.find(f=>f.id==='body').angle_deg=$('angle').valueAsNumber;doc.features.find(f=>f.id==='result').op=$('boolean').value;command('apply',{document:doc});};
$('apply-document').onclick=()=>{try{command('apply',{document:JSON.parse($('document').value)});}catch(e){status(e.message,true);}};
$('undo').onclick=()=>command('undo');$('redo').onclick=()=>command('redo');$('open').onclick=()=>$('file').click();
$('file').onchange=async()=>{const f=$('file').files[0];$('file').value='';if(!f)return;if(f.size>65536){status('Document exceeds 64 KiB',true);return;}try{await command('open',{text:await f.text()});}catch(e){status(e.message,true);}};
$('save').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(state.document)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='features.cad.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
lock(true);try{accept(await request('/api/state'));status('Ready');}catch(e){status(e.message,true);}finally{lock(false);}
