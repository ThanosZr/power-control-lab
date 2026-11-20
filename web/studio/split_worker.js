'use strict';
// 4.24 (THEORY §8Ι.7): one group of a network split in subnetworks, in a Worker (split.js workers()). The same file runs in
// the browser (a Worker, importScripts) and in Node (worker_threads, require).
//   in:  {project, opt: {sim, tEnd, groups, rates, smooth}, g, links: [SharedArrayBuffer, …]}
//   out: {g, keys, t, v: [Float32Array per channel], steps, h, build, ms, lu} or {error}
if(typeof importScripts==='function'){
 self.window=self;
 importScripts('expr.js','parts.js','stepcheck.js','netlib.js','subcircuit.js','bus.js','units.js','pyrt.js','sparse.js','kernels.js','nn.js','tune.js','inputs.js','mna.js','linemodels.js','split.js');
 // the page sends {coord: true, project, opt: {mode: 'serial' | 'workers', …}, keys}: this worker plans the parts, runs them (its own
 // Workers for 'workers') and answers {keys, t, v, g, stats, plan} for the channels asked; a group's worker gets {project, opt, g, links}
 self.onmessage=async e=>{const d=e.data;
  if(d.coord){try{const ws=d.opt.mode==='workers'&&typeof SharedArrayBuffer!=='undefined'&&self.crossOriginIsolated; // Workers need shared memory (COOP/COEP of run.py)
    const r=ws?await Split.workers(d.project,{...d.opt,workerURL:'split_worker.js'}):Split.serial(d.project,d.opt);if(!ws&&d.opt.mode==='workers')r.stats.note='χωρίς κοινή μνήμη: στο ίδιο νήμα';
    const out=Split.summary(r,d.keys);self.postMessage(out);}catch(x){self.postMessage({error:String(x&&x.message||x)});}return;}
  const {project,opt,g,links}=d;
  try{const r=Split.runGroup(project,opt,g,links);self.postMessage(r,[r.t.buffer,...r.v.map(a=>a.buffer)]);}
  catch(x){self.postMessage({error:String(x&&x.message||x)});}};
}else{
 const {parentPort,workerData}=require('worker_threads'),path=require('path'),W=__dirname;
 global.window=globalThis;global.Parts=require(path.join(W,'parts.js'));global.Expr=require(path.join(W,'expr.js'));global.StepCheck=require(path.join(W,'stepcheck.js'));
 global.LineModels=require(path.join(W,'linemodels.js'));for(const f of ['netlib','subcircuit','bus','units','nn','inputs'])require(path.join(W,f+'.js'));
 require(path.join(W,'sparse.js'));require(path.join(W,'kernels.js'));global.MNA=require(path.join(W,'mna.js'));const Split=require(path.join(W,'split.js'));
 const {project,opt,g,links}=workerData;
 try{const r=Split.runGroup(project,opt,g,links);parentPort.postMessage(r,[r.t.buffer,...r.v.map(a=>a.buffer)]);}
 catch(x){parentPort.postMessage({error:String(x&&x.stack||x)});}
}
