// The trapezoidal rule after backward-Euler steps (4.9, 4.8.2 γ; THEORY §8κ): the generator of gen_ctl with an AVR and
// a step of V_ref at 1 s, with the consistent restart (default) and with the old one (solve.trStart 'be'), against BDF2
// at a small step: the Nyquist ripple of |V| step by step after the event, and |V| at 1,2 s.
// Usage: node trstart_cases.js -> JSON
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');for(const f of ['netlib','subcircuit','bus','units','expr','nn'])require(W+'/'+f+'.js');
const MNA=require(W+'/mna.js');require(W+'/tutorials.js');const T=globalThis.Tutorials;
function run(method,hDiv,trStart){const pr=T.get('gen_ctl').build({ctl:'avr',gov:'none',ev:'vref'});pr.sim.method=method;if(trStart)pr.solve={...(pr.solve||{}),trStart};
 const s=new MNA.Sim(pr,{hDiv,method});s.run(1.0);const a=[];for(let i=0;i<400;i++){s.run(s.h);a.push(s.now('Y:SG1:vt'));}
 let nyq=0;for(let i=1;i+1<a.length;i++)nyq=Math.max(nyq,Math.abs(a[i+1]-2*a[i]+a[i-1])/4);s.run(1.2-s.t);return {nyq,vt:s.now('Y:SG1:vt')};}
console.log(JSON.stringify({state:run('TR',400),be:run('TR',400,'be'),ref:run('BDF2',4000)}));
