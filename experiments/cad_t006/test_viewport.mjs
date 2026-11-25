import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {Camera, dot, sub, pick, prepareMesh} from './geometry.mjs';
import {Renderer} from './renderer.mjs';

const raw=JSON.parse(readFileSync(new URL('./sample.json',import.meta.url),'utf8'));
const mesh=prepareMesh(raw);
const near=(a,b,tol=1e-6)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
function transform(m,p){return Array.from({length:4},(_,i)=>m[i]*p[0]+m[4+i]*p[1]+m[8+i]*p[2]+m[12+i]*p[3])}

test('native shaft validated, bounded and recentered',()=>{
  assert.equal(mesh.featureId,'shaft-body');assert.equal(mesh.vertexCount,506);assert.equal(mesh.triangleCount,500);
  near(mesh.center[2],50);near(mesh.radius,Math.sqrt(20**2+20**2+100**2)/2,.01);
  assert.equal(mesh.positions.length,3*mesh.vertexCount);assert.equal(mesh.indices.length,3*mesh.triangleCount);
  for(let i=0;i<mesh.normals.length;i+=3)near(Math.hypot(...mesh.normals.slice(i,i+3)),1);
});
test('malformed mesh fails without mutating existing geometry',()=>{
  for(const invalid of [{...raw,version:2},{...raw,units:'m'},{...raw,vertices:[[Infinity,0,0]]},
      {...raw,triangles:[[0,0,1]]},{...raw,triangles:[[0,1,1e6]]},{...raw,brep_valid:false}])assert.throws(()=>prepareMesh(invalid));
  assert.equal(mesh.indices.length,1500);
});
test('fit projects all vertices inside viewport through width/height extremes',()=>{
  for(const aspect of [.5,1,2.5]){
    const c=new Camera(mesh.radius,aspect),{view,projection}=c.matrices();
    for(let i=0;i<mesh.positions.length;i+=3){
      const v=transform(projection,transform(view,[...mesh.positions.slice(i,i+3),1]));
      assert.ok(v[3]>0&&Math.abs(v[0]/v[3])<1&&Math.abs(v[1]/v[3])<1&&Math.abs(v[2]/v[3])<1);
    }
  }
});
test('camera basis orthonormal; orbit / zoom / pan alter camera only',()=>{
  const c=new Camera(mesh.radius,1.4),before=c.matrices().view,positions=mesh.positions.slice();
  c.orbit(130,70);c.zoom(-120);c.pan(20,-10,500);
  const {right,up,forward}=c.basis();near(dot(right,up),0);near(dot(right,forward),0);near(dot(up,forward),0);
  for(const v of [right,up,forward])near(Math.hypot(...v),1);
  assert.notDeepEqual(c.matrices().view,before);assert.deepEqual(mesh.positions,positions);
  c.orbit(0,100000);assert.ok(c.pitch<Math.PI/2);c.zoom(-1e9);assert.ok(c.distance>=mesh.radius*.1);
});
test('picking center hits native mesh, distant corner misses, after orbit still hits',()=>{
  const c=new Camera(mesh.radius,1.4);assert.equal(pick(mesh,c.ray(0,0)).featureId,'shaft-body');assert.equal(pick(mesh,c.ray(1,1)),null);
  c.orbit(100,10);const hit=pick(mesh,c.ray(0,0));assert.ok(hit&&hit.distance>0&&hit.triangle<mesh.triangleCount);
});
test('picking returns nearest triangle rather than input order',()=>{
  const triangleMesh={featureId:'test',positions:new Float32Array([-1,-1,0,1,-1,0,0,1,0,-1,-1,2,1,-1,2,0,1,2]),indices:new Uint32Array([0,1,2,3,4,5])};
  const hit=pick(triangleMesh,{origin:[0,0,3],direction:[0,0,-1]});assert.equal(hit.triangle,1);near(hit.distance,1);
});
test('renderer retains buffers across camera and selection; replacement/disposal frees resources',()=>{
  const calls=[],gl=new Proxy({}, {get(_,key){
    if(typeof key!=='string')return undefined;
    if(key.toUpperCase()===key)return 1;
    if(key.startsWith('create')||key==='getUniformLocation')return()=>({key});
    if(key==='getShaderParameter'||key==='getProgramParameter')return()=>true;
    return(...args)=>calls.push([key,...args]);
  }});
  const r=new Renderer(gl),c=new Camera(mesh.radius,1.4);r.setMesh(mesh);
  const count=name=>calls.filter(call=>call[0]===name).length;
  assert.equal(count('bufferData'),3);r.draw(c,800,600);c.orbit(100,20);r.draw(c,800,600,true);c.zoom(-120);r.draw(c,300,400);
  assert.equal(count('bufferData'),3);assert.equal(count('drawElements'),3);assert.equal(r.uploads,1);assert.equal(r.frames,3);
  r.setMesh(mesh);assert.equal(count('deleteBuffer'),3);assert.equal(count('bufferData'),6);r.dispose();assert.equal(count('deleteBuffer'),6);assert.equal(count('deleteVertexArray'),2);assert.equal(count('deleteProgram'),1);
});
