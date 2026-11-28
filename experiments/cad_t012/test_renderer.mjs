import assert from 'node:assert/strict';
import {test} from 'node:test';
import {Renderer} from '../cad_t006/renderer.mjs';
import {Camera,prepareMesh} from '../cad_t006/geometry.mjs';
import {readFileSync} from 'node:fs';

test('retained native edge buffer uses range draws; selecting and zooming never uploads',()=>{
  const raw=JSON.parse(readFileSync(new URL('../cad_t006/sample.json',import.meta.url),'utf8'));
  const mesh=prepareMesh(raw);
  mesh.edges=[{ref:'a',points:[[0,0,0],[0,0,10]]},{ref:'b',points:[[0,0,10],[1,0,10],[2,1,10]]}];
  const calls=[],gl=new Proxy({}, {get(_,key){
    if(typeof key!=='string')return undefined;
    if(key.toUpperCase()===key)return key;
    if(key.startsWith('create')||key==='getUniformLocation')return()=>({key});
    if(key==='getShaderParameter'||key==='getProgramParameter')return()=>true;
    return(...args)=>calls.push([key,...args]);
  }});
  const r=new Renderer(gl),c=new Camera(mesh.radius,1.4);
  const count=name=>calls.filter(x=>x[0]===name).length;
  r.setMesh(mesh);assert.equal(count('bufferData'),4);
  r.draw(c,800,600,false,['a']);c.zoom(-100);r.draw(c,800,600,false,['b','missing']);
  assert.deepEqual(calls.filter(x=>x[0]==='drawArrays'),[['drawArrays','LINE_STRIP',0,2],['drawArrays','LINE_STRIP',2,3]]);
  assert.equal(count('bufferData'),4);assert.equal(r.uploads,1);
  r.setMesh(prepareMesh(raw));assert.equal(count('deleteBuffer'),4);assert.equal(count('deleteVertexArray'),2);
  r.draw(c,800,600,false,['a']);assert.equal(count('drawArrays'),2);
  r.dispose();assert.equal(count('deleteBuffer'),7);assert.equal(count('deleteVertexArray'),3);
});
