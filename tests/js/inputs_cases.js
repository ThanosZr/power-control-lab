// 4.17.1 (ROADMAP §59, THEORY §8Β): the inputs of a circuit and the parameters «= …» (web/studio/inputs.js) as the
// netlist builder resolves them, headless. Usage: node inputs_cases.js '[{kind, …}, …]' -> JSON [result, …]
//  {kind:'resolve', id, opts, patch, add, keys, T}  a tutorial (or 'buck') with parameters patched ({id: {k: v}}, a value
//                                                    may be «= …»), components added (CONST inputs, expression blocks)
//                                                    and fields set ({id: {inp, inpName, inpDesc}}): the inputs, the
//                                                    derived parameters, the warnings, the numbers of the netlist (L, C,
//                                                    R of the elements by key) and, after T, the value of every key
//  {kind:'export', …}                               the same and the SciPy export: the elements' values in the export
//  {kind:'fromlib', id, lib, fields}                 the library part lib made a subcircuit: frozen expressions, lost inputs
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');global.Expr=require(W+'/expr.js');global.MNA=require(W+'/mna.js');require(W+'/tutorials.js');
const T=global.Tutorials;
function build(o){const t=T.get(o.id||'buck'),opts={...Object.fromEntries((t.options||[]).map(q=>[q.k,q.def])),...(o.opts||{})},pr=t.build(opts);
 for(const [id,ps] of Object.entries(o.patch||{})){const c=pr.components.find(q=>q.id===id);if(!c)throw new Error('no '+id);c.params={...c.params,...ps};}
 for(const [id,f] of Object.entries(o.fields||{})){const c=pr.components.find(q=>q.id===id);if(!c)throw new Error('no '+id);Object.assign(c,f);}
 for(const c of o.add||[])pr.components.push({x:0,y:0,...c});return pr;}
function resolve(o){const pr=build(o),s=new MNA.Sim(pr,{hDiv:o.hDiv||20}),els={};
 for(const e of s.net.els)if(e.key&&(e.k==='L'||e.k==='C'))els[e.key]=e.k==='L'?e.L:e.C;
 const out={warn:s.net.warnings,inputs:s.net.inputs,els,ctl:s.net.ctrls[0]?{Kp:s.net.ctrls[0].Kp,Ki:s.net.ctrls[0].Ki,fs:s.net.ctrls[0].fs,D:s.net.ctrls[0].D,design:s.net.ctrls[0].design?{values:s.net.ctrls[0].design.values}:null}:null};
 if(o.T){s.run(o.T-s.t);out.now=Object.fromEntries((o.keys||[]).map(k=>[k,s.now(k)]));}return out;}
function exportCase(o){const pr=build(o),b=MNA.exportForBatch(pr,o.keys||[]);
 return {els:b.net.els.filter(e=>e.k==='L'||e.k==='C'||e.k==='G').map(e=>({k:e.k,L:e.L,C:e.C,R:e.R,key:e.key})),blocks:b.net.sig.blocks.filter(q=>q.type==='EXPR').map(q=>({id:q.id,parVals:q.parVals}))};}
// a library part with parameters «= …» made a subcircuit (SubCircuit.fromLib): the expressions go in with their values,
// the inputs declared on the part go away; and a text parameter «=» (the unit of a gain) is not an expression
function fromLib(o){const SC=require(W+'/subcircuit.js'),pr=build(o),I=require(W+'/inputs.js'),r=SC.fromLib(pr,o.lib),c=r.project.components.find(q=>q.id===o.lib);
 const g={id:'GN',type:'GAIN',params:{K:'= 2*3',unit:'='}};
 return {frozen:r.frozen,lost:r.lost,type:c.type,inp:c.inp||null,gain:{K:I.exprAt(g,'K',g.params.K),unit:I.exprAt(g,'unit',g.params.unit),
  resolved:I.resolve({components:[g],wires:[]}).project.components[0].params}};}
const F={resolve,export:exportCase,fromlib:fromLib};
const q=JSON.parse(process.argv[2]||'[]');process.stdout.write(JSON.stringify(q.map(o=>F[o.kind](o))));
