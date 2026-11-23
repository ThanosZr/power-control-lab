// 5.0.11 (ROADMAP §70 point 1): the common model of a drawing (web/studio/model.js), for tests/test_model.py.
//   node model_cases.js tutorials              → per tutorial (its defaults): the counts of the model, what it left out, the warnings
//   node model_cases.js start <project.json>   → the EMT start of a drawing (mna.js acInit): the phasor (peak) of the voltage of
//                                                 phase a of every LOAD3 (its channel V:<id>/Ra; 5.0.12: also inside subcircuits,
//                                                 V:X1/<id>/Ra), from the samples at t = 0 and a quarter period later, and the step h
//   node model_cases.js key <params.json>       → the key of the model of a TLM (Parts.tlmKey of the params with the defaults)
//   node model_cases.js build <id> [<options>]  → a tutorial with its defaults and the options (JSON)
//   node model_cases.js typical                 → the typical lines of Parts.TLM_TYPICAL
//   node model_cases.js model <project.json>   → Model.of of a drawing
//   node model_cases.js faults                 → the fault currents of the tutorial net_fault in the phase domain (NetLib.faultCurrents)
const W=require('path').resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');const NL=require(W+'/netlib.js');const MNA=require(W+'/mna.js');require(W+'/tutorials.js');
const M=require(W+'/model.js'),SC=require(W+'/subcircuit.js');const T=globalThis.Tutorials,fs=require('fs');
const build=id=>{const t=T.get(id),o={};for(const op of t.options)o[op.k]=op.def;return t.build(o);};
const what=process.argv[2],out={};
if(what==='tutorials'){for(const t of (Array.isArray(T.list)?T.list:T.list())){let m;try{m=M.of(build(t.id));}catch(e){out[t.id]={error:e.message};continue;}
  const n={};for(const e of m.elements)n[e.type]=(n[e.type]||0)+1;
  out[t.id]={buses:m.buses.length,types:n,skipped:m.skipped.map(s=>s.type+':'+s.why),warnings:m.warnings.length,touching:m.touching.length};}}
else if(what==='start'){const pr=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));const s=new MNA.Sim(pr,{hDiv:+(pr.sim?.hDiv||400),method:'TR'});
  const flat=SC.needs(pr)?SC.flatten(pr,{lib:false}).project:pr,ids=flat.components.filter(c=>c.type==='LOAD3').map(c=>c.id),v0={};for(const id of ids)v0[id]=s.now('V:'+id+'/Ra');
  const f=+(pr.components.find(c=>c.params&&+c.params.f>0)?.params.f||50);s.run(1/(4*f));
  out.h=s.h;out.f=f;out.v={};for(const id of ids)out.v[id]=[v0[id],s.now('V:'+id+'/Ra')];}
else if(what==='model')Object.assign(out,M.of(JSON.parse(fs.readFileSync(process.argv[3],'utf8'))));
else if(what==='build'){const t=T.get(process.argv[3]),o={};for(const op of t.options)o[op.k]=op.def;Object.assign(o,JSON.parse(process.argv[4]||'{}'));Object.assign(out,t.build(o));}
else if(what==='typical')Object.assign(out,Parts.TLM_TYPICAL);
else if(what==='key')out.key=Parts.tlmKey({...Parts.defaults('TLM'),...JSON.parse(fs.readFileSync(process.argv[3],'utf8'))});
else if(what==='faults'){const pr=build('net_fault'),g=pr.components.find(c=>c.type==='GRID3'),f=pr.components.find(c=>c.type==='FLT3');
  out.model=M.of(pr);out.cur={};for(const k of ['abc','ag','ab','abg'])out.cur[k]=NL.faultCurrents(g.params,{...f.params,kind:k,Rf:0,Rg:0});}
else throw new Error('tutorials | start <file> | model <file> | key <file> | build <id> [<options>] | typical | faults');
process.stdout.write(JSON.stringify(out));
