'use strict';
// The browser's solver for the pcl package (3.13, ROADMAP §30): the same web/studio/*.js as the app, in Node.
// Reads one JSON request from stdin and writes one JSON reply to stdout. The requests are web/studio/scenario.js
// (shared with the "Σενάρια" panel of the app, 3.14): run, export, tutorial, tutorials, channels, and the sessions of 3.16.
const path=require('path');const W=path.resolve(__dirname,'../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');global.Expr=require(W+'/expr.js');global.StepCheck=require(W+'/stepcheck.js');
global.MNA=require(W+'/mna.js');require(W+'/tutorials.js');global.Metrics=require(W+'/metrics.js');
const Scenario=require(W+'/scenario.js');

async function answer(q){
 try{return Scenario.handle(q);}
 catch(e){if(!e.needPython)throw e;await require(W+'/pyrt.js').load();return Scenario.handle(q);}} // a circuit with a Python block: load Python, then again

async function main(){
 let txt='';for await(const c of process.stdin)txt+=c;const q=JSON.parse(txt||'{}');
 process.stdout.write(Scenario.json(await answer(q)));}

// 3.16 (ROADMAP §41.1): --session keeps the solver open. One request per line in, one answer per line out:
// {"ok": …} or {"error": "…"}. Sessions (open, advance, state, close) live until the process ends.
function serve(){console.log=(...a)=>process.stderr.write(a.join(' ')+'\n'); // only answers on stdout (Pyodide prints while loading)
 const rl=require('readline').createInterface({input:process.stdin,crlfDelay:Infinity});let chain=Promise.resolve();
 rl.on('line',line=>{if(!line.trim())return;chain=chain.then(async()=>{let r;try{r={ok:await answer(JSON.parse(line))};}catch(e){r={error:String(e&&e.message||e)};}
  process.stdout.write(Scenario.json(r)+'\n');});});
 rl.on('close',()=>chain.then(()=>process.exit(0)));}

if(process.argv.includes('--session'))serve();
else main().catch(e=>{process.stderr.write(String(e&&e.message||e));process.exit(1);});
