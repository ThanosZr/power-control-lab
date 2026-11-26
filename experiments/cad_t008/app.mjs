import {Sketch,sample} from './sketch.mjs';
const $=id=>document.getElementById(id);
let sketch=new Sketch(sample());
function element(tag,attrs,text){const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [key,value] of Object.entries(attrs))n.setAttribute(key,value);if(text)n.textContent=text;return n}
function render(state){
  const {model,diagnostics:d,revision}=state,p=new Map(model.points.map(p=>[p.id,p]));
  const xs=model.points.map(p=>p.x),ys=model.points.map(p=>-p.y);
  for(const c of model.circles){const q=p.get(c.center);xs.push(q.x-c.radius,q.x+c.radius);ys.push(-q.y-c.radius,-q.y+c.radius)}
  const minX=Math.min(...xs),minY=Math.min(...ys),w=Math.max(1,Math.max(...xs)-minX),h=Math.max(1,Math.max(...ys)-minY),pad=Math.max(w,h)*.16;
  const view=$('view');view.setAttribute('viewBox',`${minX-pad} ${minY-pad} ${w+2*pad} ${h+2*pad}`);view.dataset.revision=revision;view.replaceChildren();
  for(const l of model.lines){const a=p.get(l.a),b=p.get(l.b);view.append(element('line',{x1:a.x,y1:-a.y,x2:b.x,y2:-b.y,stroke:'#56b9d9','stroke-width':2,'vector-effect':'non-scaling-stroke','data-id':l.id}))}
  for(const c of model.circles){const a=p.get(c.center);view.append(element('circle',{cx:a.x,cy:-a.y,r:c.radius,fill:'none',stroke:'#f3bf68','stroke-width':2,'vector-effect':'non-scaling-stroke','data-id':c.id}))}
  const size=Math.max(w,h)/35;
  for(const a of model.points){view.append(element('circle',{cx:a.x,cy:-a.y,r:size*.35,fill:'#e3ecf6'}));view.append(element('text',{x:a.x+size,y:-a.y-size,fill:'#e3ecf6','font-size':size},a.id))}
  $('revision').textContent=revision;$('dof').textContent=d.dof;$('rank').textContent=`${d.rank} / ${d.variables}`;$('redundant').textContent=d.redundantRows;
}
function report(result){const d=result.diagnostics;$('status').dataset.state=result.ok?'ready':'error';$('status').textContent=result.ok?d.status.replaceAll('_',' '):`Rejected: ${d.message}`;
  $('diagnostics').textContent=JSON.stringify(d,null,2);if(result.ok)render(result.state)}
function resetForm(){const state=sketch.snapshot();$('width').value=80;$('height').value=45;$('radius').value=10;$('free').checked=false;$('conflict').checked=false;report({ok:true,diagnostics:state.diagnostics,state});}
$('edit').addEventListener('submit',event=>{event.preventDefault();const state=sketch.snapshot(),m=state.model;
  m.constraints=m.constraints.filter(c=>!['height','conflictingWidth'].includes(c.id));
  m.constraints.find(c=>c.id==='width').value=$('width').valueAsNumber;
  m.constraints.find(c=>c.id==='holeRadius').value=$('radius').valueAsNumber;
  if(!$('free').checked)m.constraints.push({id:'height',type:'dy',a:'B',b:'C',value:$('height').valueAsNumber});
  if($('conflict').checked)m.constraints.push({id:'conflictingWidth',type:'dx',a:'A',b:'B',value:$('width').valueAsNumber+20});
  report(sketch.apply(m,state.revision));
});
$('reset').addEventListener('click',()=>{sketch=new Sketch(sample());resetForm()});resetForm();
