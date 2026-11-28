import {setMesh,setEdgeSelection} from '../cad_t007/viewport.mjs';
const $=id=>document.getElementById(id);
const solids=new Set(['extrude','revolve','sweep','loft','union','subtract','intersect']);
const patternMode=location.pathname.startsWith('/experiments/cad_t013/');
const edgeMode=patternMode||location.pathname.startsWith('/experiments/cad_t012/'),edgeOps=new Set(['fillet','chamfer']);
const patternOps=new Set(['linear_pattern','circular_pattern','mirror','shell']);
if(edgeMode){
  for(const op of edgeOps){solids.add(op);const o=document.createElement('option');o.value=op;o.textContent=op;$('add-op').append(o);}
  document.title='CAD · Fillet & Chamfer';document.querySelector('h1').textContent='Power & Control Lab · CAD Edge Features';
  document.querySelector('header p').textContent='0.12.0 · native BRep / retained WebGL2 · isolated C3';
}
if(patternMode){
  for(const op of patternOps){solids.add(op);const o=document.createElement('option');o.value=op;o.textContent=op.replaceAll('_',' ');$('add-op').append(o);}
  document.title='CAD · Patterns, Mirror & Shell';document.querySelector('h1').textContent='Power & Control Lab · CAD Patterns, Mirror & Shell';
  document.querySelector('header p').textContent='0.13.0 · native BRep / retained WebGL2 · isolated C3';
}
let state=null,selected=null,draft=null,busy=false,active=null,sequence=0,readFields=null;
function status(message,error=false){$('edit-status').textContent=message;$('edit-status').dataset.state=error?'error':'ready';}
function lock(value){busy=value;for(const node of document.querySelectorAll('[data-edit],#fields input,#fields select,#fields textarea'))node.disabled=value||!state;
  $('cancel').disabled=!active;
  if(state&&!value){$('undo').disabled=!state.can_undo;$('redo').disabled=!state.can_redo;$('remove').disabled=!!draft||!selected;}}
async function request(url,data){const response=await fetch(url,data===undefined?undefined:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}),value=await response.json();if(!response.ok)throw Error(value.error||'Request failed');return value;}
const dependency=f=>f.op==='mirror'?[f.body,f.plane]:f.body?[f.body]:f.parent?[f.parent]:f.plane?[f.plane]:f.path?[f.profile,f.path]:f.profile?[f.profile]:f.profiles??(f.left?[f.left,f.right]:[]);
function options(select,values){select.replaceChildren(...values.map(([id,label])=>{const opt=document.createElement('option');opt.value=id;opt.textContent=label;return opt;}));}
function tree(){
  $('tree').replaceChildren(...state.document.features.map(f=>{const row=document.createElement('li'),button=document.createElement('button');button.type='button';button.dataset.edit='';button.dataset.feature=f.id;button.setAttribute('aria-pressed',String(f.id===selected));button.textContent=`${f.id} · ${f.op}${dependency(f).length?' ← '+dependency(f).join(', '):''} · ${state.regeneration.rebuilt.includes(f.id)?'rebuilt':'reused'}`;button.onclick=()=>{if(!busy){draft=null;selected=f.id;tree();inspector();}};row.append(button);return row;}));
}
function inspector(){
  const all=state.document.features,f=draft??all.find(f=>f.id===selected),div=$('fields');div.replaceChildren();readFields=null;setEdgeSelection([]);
  if(!f){$('feature-title').textContent='Inspector';return;}
  $('feature-title').textContent=(draft?'New ':'Inspector · ')+f.op+' · '+f.id;
  const earlier=draft?all:all.slice(0,all.indexOf(f)),readers=[];
  function field(key,label,type,value,choices){const wrap=document.createElement('label');wrap.textContent=label;
    const node=document.createElement(type==='json'?'textarea':type==='select'?'select':'input');node.id='field-'+key;node.setAttribute('aria-label',label);
    if(type==='select')options(node,choices);
    if(type==='number'){node.type='number';node.step='any';node.required=true;}
    if(type==='checkbox'){node.type='checkbox';node.checked=value;}
    else node.value=type==='json'?JSON.stringify(value):value??'';
    wrap.append(node);div.append(wrap);readers.push(out=>{const v=type==='json'?JSON.parse(node.value):type==='number'?node.valueAsNumber:type==='checkbox'?node.checked:node.value;
      if(type==='number'&&!Number.isFinite(v))throw Error('Invalid '+label);if(v!=='')out[key]=v;});}
  const refs=(kind,optional=false)=>[...(optional?[['','Global XY / world']]:[]),...earlier.filter(f=>kind(f.op)).map(f=>[f.id,f.id])];
  const plane=op=>op==='plane',sketch=op=>op==='sketch';
  if(draft)field('id','Feature ID','text',f.id);
  if(f.op==='plane'){field('parent','Parent datum','select',f.parent,refs(plane,true));for(const k of ['origin','x','normal'])field(k,k+' (XYZ)','json',f[k]);}
  else if(f.op==='sketch'){field('plane','Sketch datum','select',f.plane,refs(plane,true));field('model','T008 constraint model','json',f.model);}
  else if(f.op==='path'){field('plane','Path datum','select',f.plane,refs(plane,true));field('kind','Path type','select',f.kind,[['line','Line · 2 points'],['arc','Circular arc · 3 points']]);field('points','Ordered XYZ points','json',f.points);}
  else if(['extrude','revolve','sweep'].includes(f.op)){field('profile','Profile sketch','select',f.profile,refs(sketch));if(f.op==='sweep')field('path','Spine','select',f.path,refs(op=>op==='path'));else{const k=f.op==='extrude'?'depth_mm':'angle_deg';field(k,k,'number',f[k]);}}
  else if(f.op==='loft'){field('profiles','Ordered sketch IDs (JSON)','json',f.profiles);const hint=document.createElement('small');hint.textContent='Earlier sketches: '+refs(sketch).map(x=>x[0]).join(', ');div.append(hint);field('ruled','Ruled loft','checkbox',f.ruled);}
  else if(patternMode&&patternOps.has(f.op)){
    field('body','Source solid','select',f.body,refs(op=>solids.has(op)));
    if(f.op==='mirror')field('plane','Mirror datum','select',f.plane,refs(plane));
    else if(f.op==='shell'){
      const body=$('field-body'),wrap=document.createElement('label'),list=document.createElement('select'),hint=document.createElement('small');
      wrap.textContent='Native planar faces to remove';list.id='field-faces';list.multiple=true;list.size=6;list.setAttribute('aria-label','Native planar faces');wrap.append(list);div.append(wrap,hint);
      const chosen=()=>Array.from(list.selectedOptions,x=>x.value);
      const highlight=()=>{const ids=new Set(chosen());setEdgeSelection(body.value===state.document.output?[...new Set((state.results[body.value]?.faces??[]).filter(f=>ids.has(f.ref)).flatMap(f=>f.edge_refs))]:[]);};
      const populate=keep=>{
        const faces=state.results[body.value]?.faces??[],wanted=keep?f.faces??[]:[];
        options(list,faces.map(e=>[e.ref,`${e.ref.startsWith('s:')?e.ref.split(':').at(-1):'face '+e.ref.slice(2,10)} · ${e.area_mm2.toFixed(2)} mm² · (${e.center_mm.map(x=>Number(x.toFixed(2))).join(', ')})`]));
        for(const o of list.options)o.selected=wanted.includes(o.value);
        hint.textContent=faces.length?(body.value===state.document.output?'Selected face boundaries are highlighted where supported.':'Choose the source as Displayed solid to preview face boundaries.'):'No supported planar faces on this solid.';
        highlight();
      };
      body.onchange=()=>populate(false);list.onchange=highlight;populate(true);
      readers.push(out=>{out.faces=chosen();if(!out.faces.length)throw Error('Select at least one native planar face');});
      field('thickness_mm','Inward wall thickness (mm)','number',f.thickness_mm);
    }else{
      field('count','Instance count (including source)','number',f.count);
      if(f.op==='linear_pattern')field('step','World step XYZ (mm)','json',f.step);
      else{field('origin','Axis origin XYZ (mm)','json',f.origin);field('axis','Axis direction XYZ','json',f.axis);field('angle_deg','Step angle (degrees)','number',f.angle_deg);}
      const hint=document.createElement('small');hint.textContent='Each transformed copy must add material and fuse into one connected solid.';div.append(hint);
    }
  }
  else if(edgeMode&&edgeOps.has(f.op)){
    field('body','Source solid','select',f.body,refs(op=>solids.has(op)));
    const body=$('field-body'),wrap=document.createElement('label'),list=document.createElement('select'),hint=document.createElement('small');
    wrap.textContent='Native edges (select one or more)';list.id='field-edges';list.multiple=true;list.size=7;list.setAttribute('aria-label','Native edges');wrap.append(list);div.append(wrap,hint);
    const chosen=()=>Array.from(list.selectedOptions,x=>x.value);
    const highlight=()=>{setEdgeSelection(body.value===state.document.output?chosen():[]);};
    const populate=keep=>{
      const edges=state.results[body.value]?.edges??[],wanted=keep?f.edges??[]:[];
      const label=e=>{const p=e.points[0].map(x=>Number(x.toFixed(2))).join(', ');return (e.ref.startsWith('s:')?e.ref.split(':').slice(2).join(' · '):e.kind+' · '+e.ref.slice(2,10))+' · '+e.length_mm.toFixed(2)+' mm · ('+p+')';};
      options(list,edges.map(e=>[e.ref,label(e)]));for(const o of list.options)o.selected=wanted.includes(o.value);
      hint.textContent=edges.length?(body.value===state.document.output?'Selected edges are highlighted in the viewport.':'Choose the source as Displayed solid to preview edges.'):'No supported native edges on this solid.';
      highlight();
    };
    body.onchange=()=>populate(false);list.onchange=highlight;populate(true);
    readers.push(out=>{out.edges=chosen();if(!out.edges.length)throw Error('Select at least one native edge');});
    const k=f.op==='fillet'?'radius_mm':'distance_mm';field(k,k,'number',f[k]);
  }
  else{field('left','Left solid','select',f.left,refs(op=>solids.has(op)));field('right','Right solid','select',f.right,refs(op=>solids.has(op)));}
  readFields=()=>{const out={id:f.id,op:f.op};for(const read of readers)read(out);return out;};lock(busy);
}
function accept(next){
  const mesh=next.results[next.document.output];
  if(!state||state.results[state.document.output].geometry_key!==mesh.geometry_key)setMesh(mesh);
  state=next;draft=null;if(!state.document.features.some(f=>f.id===selected))selected=next.document.output;
  options($('output'),next.document.features.filter(f=>solids.has(f.op)).map(f=>[f.id,f.id+' · '+f.op]));$('output').value=next.document.output;
  tree();inspector();$('document').value=JSON.stringify(next.document,null,2);$('revision').textContent='Revision '+next.revision;$('volume').textContent='Exact volume: '+mesh.volume_mm3.toFixed(3)+' mm³';
}
async function command(action,extra={}){if(busy||!state)return;active=`cad-${Date.now()}-${++sequence}`;const token=active;lock(true);status('Regenerating…');try{accept(await request('/api/command',{action,revision:state.revision,request_id:token,...extra}));status('Ready');}
  catch(e){try{const latest=await request('/api/state');if(latest.revision!==state.revision)accept(latest);}catch(_){}$('output').value=state.document.output;status(e.message,true);}
  finally{active=null;lock(false);}}
function edit(fn){try{const doc=structuredClone(state.document);fn(doc);command('apply',{document:doc});}catch(e){status(e.message,true);}}
$('inspector').onsubmit=e=>{e.preventDefault();if(!readFields)return;edit(doc=>{const f=readFields();doc.schema=patternMode?5:edgeMode?4:3;if(draft){doc.features.push(f);if(solids.has(f.op))doc.output=f.id;selected=f.id;}else doc.features[doc.features.findIndex(x=>x.id===selected)]=f;});};
$('add').onclick=()=>{const op=$('add-op').value,all=state.document.features;let i=1;while(all.some(f=>f.id===op+i))i++;
  const entries=kind=>all.filter(f=>kind(f.op)).map(f=>f.id),sketch=entries(x=>x==='sketch'),path=entries(x=>x==='path'),bodies=entries(x=>solids.has(x));const f={id:op+i,op};
  if(op==='plane')Object.assign(f,{origin:[0,0,0],x:[1,0,0],normal:[0,0,1]});
  else if(op==='sketch')f.model={schema:1,points:[{id:'p',x:0,y:0}],lines:[],circles:[{id:'c',center:'p',radius:2}],constraints:[{id:'fixed',type:'fixed',point:'p',x:0,y:0},{id:'radius',type:'radius',circle:'c',value:2}]};
  else if(op==='path')Object.assign(f,{kind:'line',points:[[0,0,0],[0,0,10]]});
  else if(op==='loft')Object.assign(f,{profiles:sketch.slice(0,2),ruled:true});
  else if(patternMode&&patternOps.has(op)){
    f.body=state.document.output;
    if(op==='linear_pattern')Object.assign(f,{step:[10,0,0],count:2});
    else if(op==='circular_pattern')Object.assign(f,{origin:[0,0,0],axis:[0,0,1],angle_deg:90,count:2});
    else if(op==='mirror')f.plane=entries(x=>x==='plane')[0];
    else Object.assign(f,{faces:[],thickness_mm:1});
  }
  else if(edgeMode&&edgeOps.has(op))Object.assign(f,{body:state.document.output,edges:[],[op==='fillet'?'radius_mm':'distance_mm']:1});
  else if(solids.has(op)&&!['extrude','revolve','sweep'].includes(op))Object.assign(f,{left:bodies[0],right:bodies[1]});
  else{f.profile=sketch[0];if(op==='sweep')f.path=path[0];else f[op==='extrude'?'depth_mm':'angle_deg']=op==='extrude'?10:360;}
  draft=f;selected=null;tree();inspector();};
$('remove').onclick=()=>edit(doc=>{if(selected===doc.output)throw Error('Choose another displayed solid before removal');doc.features=doc.features.filter(f=>f.id!==selected);});
$('output').onchange=()=>edit(doc=>{doc.output=$('output').value;});
$('apply-document').onclick=()=>{try{command('apply',{document:JSON.parse($('document').value)});}catch(e){status(e.message,true);}};
$('cancel').onclick=async()=>{if(!active)return;try{const token=active,r=await request('/api/cancel',{request_id:token});if(active===token&&r.accepted)status('Cancelling…');}catch(e){status(e.message,true);}};
$('undo').onclick=()=>command('undo');$('redo').onclick=()=>command('redo');$('open').onclick=()=>$('file').click();
$('file').onchange=async()=>{const f=$('file').files[0];$('file').value='';if(!f)return;if(f.size>65536){status('Document exceeds 64 KiB',true);return;}try{await command('open',{text:await f.text()});}catch(e){status(e.message,true);}};
$('save').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(state.document)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='features.cad.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
lock(true);try{accept(await request('/api/state'));status('Ready');}catch(e){status(e.message,true);}finally{lock(false);}
