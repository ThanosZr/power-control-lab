'use strict';
// The browser's solver for the pcl package (3.13, ROADMAP §30): the same web/studio/*.js as the app, in Node.
// Reads one JSON request from stdin and writes one JSON reply to stdout. The requests are web/studio/scenario.js
// (shared with the "Σενάρια" panel of the app, 3.14): run, export, tutorial, tutorials, channels.
const path=require('path');const W=path.resolve(__dirname,'../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');global.Expr=require(W+'/expr.js');global.StepCheck=require(W+'/stepcheck.js');
global.MNA=require(W+'/mna.js');require(W+'/tutorials.js');global.Metrics=require(W+'/metrics.js');
const Scenario=require(W+'/scenario.js');

async function main(){
 let txt='';for await(const c of process.stdin)txt+=c;const q=JSON.parse(txt||'{}');let out;
 try{out=Scenario.handle(q);}
 catch(e){if(!e.needPython)throw e;await require(W+'/pyrt.js').load();out=Scenario.handle(q);} // a circuit with a Python block: load Python, then again
 process.stdout.write(Scenario.json(out));}
main().catch(e=>{process.stderr.write(String(e&&e.message||e));process.exit(1);});
