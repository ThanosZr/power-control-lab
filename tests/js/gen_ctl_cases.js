// The controls of a generator (4.8.1, library parts AVR, PSS, GOV; Kundur ch. 8–9; tutorial gen_ctl): a start in
// equilibrium for every combination (the generator gives e0, v0, m0 of its load flow), the fault with constant E_fd,
// with the AVR alone and with the PSS, a step of V_ref with ST1A and DC1A, steps of the load reference with steam and
// hydro, DC1A with a given K_E, and IEEE 9 with AVRs on the fault that makes it lose synchronism without them.
// Usage: node gen_ctl_cases.js -> JSON
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');for(const f of ['netlib','subcircuit','bus','units','expr','nn'])require(W+'/'+f+'.js');
const MNA=require(W+'/mna.js');require(W+'/tutorials.js');const T=globalThis.Tutorials;
const sim=pr=>new MNA.Sim(pr,{hDiv:pr.sim.hDiv,method:pr.sim.method});
const build=(o,mod)=>{const pr=T.get('gen_ctl').build({ctl:'avr_pss',gov:'none',ev:'none',...o});if(mod)mod(pr);return pr;};
const P=(pr,id,kv)=>Object.assign(pr.components.find(c=>c.id===id).params,kv);
const out={};
// 1. equilibrium at the start: the largest change of P_e, E_fd, T_m over 1 s
out.steady=[];for(const [ctl,gov] of [['none','none'],['avr','none'],['avr_pss','none'],['tgr','none'],['dc1a','none'],['avr_pss','steam'],['avr_pss','hydro'],['dc1a','hydro']]){
 const pr=build({ctl,gov});const s=sim(pr);const k0={pe:'Y:SG1:pe',efd:ctl==='none'?'Y:SG1:ifd':'Y:AV1/EFD',...(gov!=='none'?{tm:'Y:GV1/TM'}:{})};s.run(0.01);
 const v0=Object.fromEntries(Object.entries(k0).map(([k,q])=>[k,s.now(q)]));const dev=Object.fromEntries(Object.keys(k0).map(k=>[k,0]));
 for(let i=1;i<=50;i++){s.run(0.02);for(const [k,q] of Object.entries(k0))dev[k]=Math.max(dev[k],Math.abs(s.now(q)-v0[k]));}
 out.steady.push({ctl,gov,dev,warn:s.net.warnings,e0:s.now('Y:SG1:e0'),m0:gov!=='none'?s.now('Y:SG1:m0'):null,v0:s.now('Y:SG1:v0'),Efd0:s.gens[0].Efd0,Tm0:s.gens[0].Tm0,tm:gov!=='none'?s.now('Y:GV1/TM'):null});}
// 2. the fault on line 2 (1 s, cleared at 1.07 s), 6 s
const fault=ctl=>{const s=sim(build({ctl,ev:'fault'}));let slip=false,dmax=-1e9,vs=[0,0];const tail=[];
 for(let k=1;k<=600;k++){s.run(k/100-s.t);const w=s.now('Y:SG1');if(Math.abs(w-1)>0.02)slip=true;if(s.t>1&&s.t<2.5)dmax=Math.max(dmax,s.now('Y:SG1:d'));
  if(ctl==='avr_pss'){const v=s.now('Y:PS1/VS');vs=[Math.min(vs[0],v),Math.max(vs[1],v)];}if(s.t>5.5)tail.push([s.now('Y:SG1:d'),s.now('Y:SG1:vt')]);}
 const m=i=>tail.reduce((a,x)=>a+x[i],0)/tail.length,sp=i=>Math.max(...tail.map(x=>x[i]))-Math.min(...tail.map(x=>x[i]));
 return {slip,dmax,dEnd:m(0),dSpread:sp(0),vEnd:m(1),vs};};
out.fault={};for(const c of ['none','avr','avr_pss'])out.fault[c]=fault(c);
// 3. a step of +5 % in V_ref at 1 s
const vref=ctl=>{const s=sim(build({ctl,ev:'vref'}));const r={};for(const t of [0.9,1.2,1.5,3])r[t]=(s.run(t-s.t),s.now('Y:SG1:vt'));return r;};
out.vref={st1a:vref('avr_pss'),dc1a:vref('dc1a')};
// 4. a step of +0.05 pu in the load reference at 1 s
const load=(gov,T)=>{const s=sim(build({gov,ev:'load'}));s.run(0.9);const p0=s.now('Y:GV1/PM');let pmin=p0;const r={p0};
 while(s.t<2-1e-9){s.run(0.01);pmin=Math.min(pmin,s.now('Y:GV1/PM'));}r.p2=s.now('Y:GV1/PM');r.pmin=pmin;s.run(T-s.t);r.pT=s.now('Y:GV1/PM');r.g=s.now('Y:GV1/G');r.w=s.now('Y:SG1');return r;};
out.load={steam:load('steam',15),hydro:load('hydro',15)};
// 5. DC1A with a given K_E (V_R starts at (K_E + S_E(E_fd0))·E_fd0)
{const pr=build({ctl:'dc1a'},q=>P(q,'AV1',{KE:'1'}));const s=sim(pr);s.run(0.01);const e=s.now('Y:AV1/EFD');s.run(1);out.dc1aKE={d:Math.abs(s.now('Y:AV1/EFD')-e),vr0:s.now('Y:AV1/VR0')};}
// 6. IEEE 9 with the full data and the fault: without control G2, G3 lose synchronism; with AVRs they do not
out.ieee9={};for(const ctl of ['none','avr']){const pr=T.get('ieee9_emt').build({ev:'full',ctl});const s=sim(pr);let slip=false;
 for(let k=1;k<=300;k++){s.run(k/100-s.t);for(const g of ['G1','G2','G3'])if(Math.abs(s.now('Y:'+g)-1)>0.03)slip=true;}
 out.ieee9[ctl]={slip,d21:s.now('Y:G2:d')-s.now('Y:G1:d'),d31:s.now('Y:G3:d')-s.now('Y:G1:d'),warn:s.net.warnings};}
console.log(JSON.stringify(out));
