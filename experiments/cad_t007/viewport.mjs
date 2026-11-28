import {Camera,prepareMesh,pick} from '../cad_t006/geometry.mjs';
import {Renderer} from '../cad_t006/renderer.mjs';

const canvas=document.querySelector('canvas'), status=document.querySelector('#status'), info=document.querySelector('#info');
const fit=document.querySelector('#fit'), selection=document.querySelector('#selection');
let renderer,mesh,camera,selected=false,frame=0,drag=null,uploads=0,selectedEdges=[];
const explain=e=>{status.textContent=String(e.message||e);status.dataset.state='error'};
function update(){
  if(frame||!renderer||!camera)return;
  frame=requestAnimationFrame(()=>{frame=0;if(!renderer||!camera)return;
    const r=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2),w=Math.round(r.width*dpr),h=Math.round(r.height*dpr);
    if(!w||!h)return;
    if(canvas.width!==w)canvas.width=w;if(canvas.height!==h)canvas.height=h;
    camera.resize(w,h);renderer.draw(camera,w,h,selected,selectedEdges);
    info.textContent=`${mesh.vertexCount} vertices · ${mesh.triangleCount} triangles · ${uploads} mesh upload(s) · ${renderer.frames} frame(s)`;
    canvas.dataset.uploads=String(uploads);canvas.dataset.frames=String(renderer.frames);canvas.dataset.edgeSelection=String(selectedEdges.length);
  });
}
function clearSelection(){selected=false;selection.textContent='None';update()}
export function setMesh(raw){
  const next=prepareMesh(raw);
  if(raw.edges!==undefined){
    if(!Array.isArray(raw.edges)||raw.edges.length>128||new Set(raw.edges.map(e=>e.ref)).size!==raw.edges.length||
       raw.edges.some(e=>typeof e.ref!=='string'||!Array.isArray(e.points)||e.points.length<2||e.points.length>33||e.points.some(p=>!Array.isArray(p)||p.length!==3||p.some(v=>!Number.isFinite(v)||Math.abs(v)>1e6)))) throw Error('Invalid native edge catalogue');
    next.edges=raw.edges;
  }
  selectedEdges=[];if(renderer){renderer.setMesh(next);uploads++;}
  mesh=next;camera=new Camera(mesh.radius,Math.max(1,canvas.clientWidth)/Math.max(1,canvas.clientHeight));clearSelection();
  status.textContent=`Native BRep display · ${raw.feature_id} · mm`;status.dataset.state='ready';update();
}
export function setEdgeSelection(refs){selectedEdges=refs.filter(ref=>mesh?.edges?.some(e=>e.ref===ref));update();}
function init(){renderer=new Renderer(canvas.getContext('webgl2',{antialias:true,alpha:false}));if(mesh){renderer.setMesh(mesh);uploads++;update()}}
const observer=new ResizeObserver(update);observer.observe(canvas);
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();if(frame)cancelAnimationFrame(frame);frame=0;renderer=null;status.textContent='Graphics context lost; awaiting restore';status.dataset.state='error'});
canvas.addEventListener('webglcontextrestored',()=>{try{init();status.textContent='Graphics context restored';status.dataset.state='ready'}catch(e){explain(e)}});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('pointerdown',e=>{if(!camera||drag||![0,1,2].includes(e.button))return;canvas.focus();canvas.setPointerCapture(e.pointerId);drag={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false,pan:e.button!==0||e.shiftKey};});
canvas.addEventListener('pointermove',e=>{
  if(!drag||drag.id!==e.pointerId||!camera)return;
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.moved&&Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)<4)return;
  drag.moved=true;if(drag.pan)camera.pan(dx,dy,canvas.clientHeight);else camera.orbit(dx,dy);drag.x=e.clientX;drag.y=e.clientY;update();
});
canvas.addEventListener('pointerup',e=>{
  if(!drag||drag.id!==e.pointerId)return;
  if(!drag.moved&&!drag.pan&&mesh&&camera){const r=canvas.getBoundingClientRect();if(r.width&&r.height){const hit=pick(mesh,camera.ray(2*(e.clientX-r.left)/r.width-1,1-2*(e.clientY-r.top)/r.height));selected=!!hit;selection.textContent=hit?`${hit.featureId} (body)`: 'None';update()}}
  drag=null;
});
for(const name of ['pointercancel','lostpointercapture'])canvas.addEventListener(name,e=>{if(drag?.id===e.pointerId)drag=null});
canvas.addEventListener('wheel',e=>{if(!camera)return;e.preventDefault();camera.zoom(e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?canvas.clientHeight:1));update()},{passive:false});
fit.onclick=()=>{if(camera){camera.fit();update()}};
canvas.addEventListener('keydown',e=>{if(e.key==='f'||e.key==='F'){e.preventDefault();fit.click()}else if(e.key==='Escape'){clearSelection()}});
window.addEventListener('pagehide',e=>{if(e.persisted)return;observer.disconnect();if(frame)cancelAnimationFrame(frame);renderer?.dispose();renderer=null});
try{init()}catch(e){explain(e)}
