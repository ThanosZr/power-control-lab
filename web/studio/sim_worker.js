'use strict';
// One solver of the pool (3.15, ROADMAP §30 and §21): the app's solver in a worker, without Python and without a page.
// Answers the requests of web/studio/scenario.js (run, bifurcation, …) one at a time:
//   in:  {id, q}       out: {id, out} or {id, error, needPython}
self.window=self; // tutorials.js registers on window
importScripts('expr.js','parts.js','stepcheck.js','mna.js','metrics.js','tutorials.js','scenario.js');
self.onmessage=e=>{const {id,q}=e.data;
 try{self.postMessage({id,out:Scenario.handle(q)});}
 catch(x){self.postMessage({id,error:String(x&&x.message||x),needPython:!!(x&&x.needPython)});}};
