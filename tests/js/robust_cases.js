// 4.20 (decision 221 (a)): the robust current control of the MMC station (MMCC cc = 'robust') in the modes V_dc and droop
// P/V_dc, on the link of hvdc_mmc (Model 4): the station 1 in P, the station 2 in V_dc (the option cc of the tutorial) or, here,
// in droop. Means and swings of the power and the DC voltage of the station 2 over 120 ms before the step of P at 0.5 s and at
// the end. Usage: node robust_cases.js -> JSON
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');global.Expr=require(W+'/expr.js');global.StepCheck=require(W+'/stepcheck.js');
global.LineModels=require(W+'/linemodels.js');
for(const f of ['netlib','subcircuit','bus','units','nn'])require(W+'/'+f+'.js');
global.MNA=require(W+'/mna.js');require(W+'/tutorials.js');
const t=Tutorials.get('hvdc_mmc'),K=['Y:CT1/PP','Y:CT2/PP','Y:CT2/Fvdc','Y:CT1/Fvdc'];
function run(cc,over){const pr=t.build({model:'m4',N:'400',ectl:'energy',ev:'pstep',cc});if(over)Object.assign(pr.components.find(c=>c.id==='CT2').params,over);
 const s=new MNA.Sim(pr,{hDiv:pr.sim.hDiv,method:'TR'}),out={warn:s.net.warnings,win:[]};
 for(const [a,b] of [[0.38,0.5],[0.78,0.9]]){s.run(a-s.t);const v=[];while(s.t<b-1e-9){s.run(2e-4);v.push(K.map(k=>s.now(k)));}
  out.win.push(K.map((k,j)=>{const x=v.map(q=>q[j]);return {mean:x.reduce((p,q)=>p+q,0)/x.length,min:Math.min(...x),max:Math.max(...x)};}));}
 return out;}
console.log(JSON.stringify({pi:run('pi'),vdc:run('robust'),droop:run('robust',{mode:'droop',Pref:'-1',Vdcref:'1',kdr:0.05}),
 parts:{show:['p','vdc','droop','vf','gfm'].map(mode=>Parts.PARTS.MMCC.params.filter(q=>['cc','acc','Tii'].includes(q.k)).map(q=>!!q.show({mode,cc:'robust'})))}}));
