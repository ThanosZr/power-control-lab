import {setMesh} from './viewport.mjs';
const $=id=>document.getElementById(id);
let state=null,busy=false;
function lock(value){busy=value;for(const b of document.querySelectorAll('[data-edit],#parameters input'))b.disabled=value||!state;}
function status(message,error=false){$('edit-status').textContent=message;$('edit-status').dataset.state=error?'error':'ready';}
async function json(url,options){const response=await fetch(url,options);const data=await response.json();if(!response.ok)throw Error(data.error||'Request failed');return data;}
function accept(next){
    const changed=!state||next.session!==state.session||next.document.revision!==state.document.revision;
    state=next;
    for(const p of next.document.parameters)$(p.id).value=p.value;
    $('revision').textContent='Revision '+next.document.revision;
    $('volume').textContent='Exact volume: '+next.mesh.volume_mm3.toFixed(3)+' mm³';
    if(changed)setMesh(next.mesh);
}
async function command(action,extra={}){
    if(busy||!state)return;
    lock(true);status('Native transaction: '+action+'…');
    try{
        const next=await json('/api/command',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,session:state.session,revision:state.document.revision,...extra})});
        accept(next);status('Ready');
    }catch(e){
        // Resynchronize after ambiguous network failure, without retrying a mutation.
        try{accept(await json('/api/state'));}catch(_){}
        status(e.message,true);
    }finally{lock(false);}
}
$('parameters').onsubmit=e=>{e.preventDefault();command('edit',{changes:{diameter:$('diameter').valueAsNumber,length:$('length').valueAsNumber}});};
$('undo').onclick=()=>command('undo');
$('redo').onclick=()=>command('redo');
$('open').onclick=()=>$('document-file').click();
$('document-file').onchange=async()=>{
    const f=$('document-file').files[0];$('document-file').value='';
    if(!f||busy)return;
    if(f.size>65536){status('CAD document exceeds 64 KiB',true);return;}
    lock(true);
    let text;
    try{text=await f.text();}catch(e){status(e.message,true);return;}finally{lock(false);}
    await command('open',{text});
};
$('save').onclick=async()=>{
    if(busy||!state)return;
    lock(true);
    try{
        const data=await json('/api/save'),url=URL.createObjectURL(new Blob([data.text],{type:'application/json'}));
        const a=document.createElement('a');a.href=url;a.download='shaft.cad.json';a.click();
        setTimeout(()=>URL.revokeObjectURL(url),1000);status('Saved document snapshot');
    }catch(e){status(e.message,true);}finally{lock(false);}
};
lock(true);
try{accept(await json('/api/state'));status('Ready');}catch(e){status(e.message,true);}finally{lock(false);}
