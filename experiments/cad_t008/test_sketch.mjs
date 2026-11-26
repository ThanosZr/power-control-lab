import test from 'node:test';
import assert from 'node:assert/strict';
import {Sketch,solve,sample,LIMITS} from './sketch.mjs';
const blank=()=>({schema:1,points:[],lines:[],circles:[],constraints:[]});
const point=(id,x,y)=>({id,x,y});
const model=(points,constraints=[],lines=[],circles=[])=>({...blank(),points,constraints,lines,circles});
const fixed=(id,p,x,y)=>({id,type:'fixed',point:p,x,y});
const distance=(id,a,b,value)=>({id,type:'distance',a,b,value});
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
const value=(m,id,v)=>{m.constraints.find(c=>c.id===id).value=v;return m};

test('empty and free sketches have local DoF',()=>{
  assert.equal(solve(blank()).diagnostics.dof,0);
  const r=solve(model([point('A',2,3),point('B',5,6)]));assert.ok(r.ok);
  assert.equal(r.diagnostics.rank,0);assert.equal(r.diagnostics.dof,4);
});
test('reference rectangle and circle are fully constrained',()=>{
  const r=solve(sample());assert.ok(r.ok);assert.equal(r.diagnostics.rank,11);
  assert.equal(r.diagnostics.dof,0);assert.equal(r.diagnostics.redundantRows,0);
});
test('dimensional edit changes rectangle and radius, not fixed center',()=>{
  const s=new Sketch(sample()), m=s.snapshot().model;
  value(value(value(m,'width',100),'height',60),'holeRadius',14);
  const r=s.apply(m,0);assert.ok(r.ok);assert.equal(r.state.revision,1);
  const p=id=>r.state.model.points.find(p=>p.id===id);
  near(p('C').x,100);near(p('C').y,60);near(p('A').x,0);near(p('O').y,22.5);
  near(r.state.model.circles[0].radius,14);
});
test('nonlinear distance drives an underconstrained point',()=>{
  const r=solve(model([point('A',0,0),point('B',3,4)],[fixed('anchor','A',0,0),distance('d','A','B',10)]));
  assert.ok(r.ok);assert.equal(r.diagnostics.rank,3);assert.equal(r.diagnostics.dof,1);
  near(r.model.points[1].x,6);near(r.model.points[1].y,8);
});
test('equal-length nonlinear geometry and horizontal line',()=>{
  const r=solve(model([point('A',0,0),point('B',10,0),point('C',0,4),point('D',2,4)],
    [fixed('a','A',0,0),fixed('b','B',10,0),fixed('c','C',0,4),{id:'h',type:'horizontal',line:'CD'},{id:'eq',type:'equal_length',a:'AB',b:'CD'}],
    [{id:'AB',a:'A',b:'B'},{id:'CD',a:'C',b:'D'}]));
  assert.ok(r.ok);assert.equal(r.diagnostics.dof,0);near(r.model.points[3].x,10);near(r.model.points[3].y,4);
});
test('coincident points and consistent redundant rows',()=>{
  const r=solve(model([point('A',0,0),point('B',2,3)],[fixed('a','A',0,0),fixed('b','B',0,0),{id:'same',type:'coincident',a:'A',b:'B'}]));
  assert.ok(r.ok);assert.equal(r.diagnostics.rank,4);assert.equal(r.diagnostics.redundantRows,2);assert.equal(r.diagnostics.dof,0);
});
test('incompatible dimensions preserve exact previous snapshot',()=>{
  const s=new Sketch(sample()),before=s.snapshot(),m=s.snapshot().model;
  m.constraints.push({id:'conflict',type:'dx',a:'A',b:'B',value:130});
  const r=s.apply(m,0);assert.equal(r.ok,false);assert.equal(r.diagnostics.status,'unsatisfied');
  assert.ok(r.diagnostics.violations.includes('width'));assert.ok(r.diagnostics.violations.includes('conflict'));
  assert.ok(r.diagnostics.redundantRows>0);assert.deepEqual(r.state,before);assert.deepEqual(s.snapshot(),before);
  assert.ok(s.apply(value(s.snapshot().model,'width',90),0).ok);
});
test('stale revision cannot replace a committed model',()=>{
  const s=new Sketch(sample());s.apply(value(s.snapshot().model,'width',95),0);const before=s.snapshot();
  const r=s.apply(sample(),0);assert.equal(r.diagnostics.status,'stale');assert.deepEqual(s.snapshot(),before);
});
test('invalid references and nonfinite input are atomic',()=>{
  const s=new Sketch(sample()),before=s.snapshot(),m=s.snapshot().model;m.points[0].x=NaN;
  assert.equal(s.apply(m,0).diagnostics.status,'invalid');m.points[0].x=0;m.lines[0].a='missing';
  assert.equal(s.apply(m,0).diagnostics.status,'invalid');assert.deepEqual(s.snapshot(),before);
  assert.equal(solve({...sample(),points:[point('A',0,0),point('A',0,1)]}).ok,false);
});
test('reject collapsed segment even when algebraic residual is zero',()=>{
  const m=model([point('A',0,0),point('B',1,0)],[fixed('a','A',0,0),fixed('b','B',0,0)],[{id:'AB',a:'A',b:'B'}]);
  const r=solve(m);assert.equal(r.ok,false);assert.equal(r.diagnostics.status,'degenerate');assert.ok(!('model' in r));
});
test('coincident distance seed fails explicitly rather than inventing direction',()=>{
  const r=solve(model([point('A',0,0),point('B',0,0)],[distance('d','A','B',10)]));
  assert.equal(r.ok,false);assert.equal(r.diagnostics.status,'unsatisfied');assert.deepEqual(r.diagnostics.violations,['d']);
});
test('canonical ordering gives deterministic results and no-op revision',()=>{
  const m=value(sample(),'width',120),n=structuredClone(m);for(const k of ['points','lines','circles','constraints'])n[k].reverse();
  assert.deepEqual(solve(m),solve(n));const s=new Sketch(m),before=s.snapshot();
  assert.ok(s.apply(before.model,0).ok);assert.deepEqual(s.snapshot(),before);
  before.model.points[0].x=999;assert.notEqual(s.snapshot().model.points[0].x,999);
});
test('bounds and signed negative dimensions',()=>{
  assert.equal(solve(model(Array.from({length:LIMITS.variables},(_,i)=>point('p'+i,i,0)))).diagnostics.status,'invalid');
  assert.equal(solve(value(sample(),'holeRadius',-1)).diagnostics.status,'invalid');
  const r=solve(value(sample(),'width',-80));assert.ok(r.ok);near(r.model.points.find(p=>p.id==='B').x,-80);
});
