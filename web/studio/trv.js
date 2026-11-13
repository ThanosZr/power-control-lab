'use strict';
// Rated TRV of IEC 62271-100:2021 in the browser (4.9, ROADMAP §31): the same rules as pcl/trv.py (rated, reference_line,
// delay_line, compare, the slf of Annex A) for the theory cards of the TRV tutorials; tests/test_trv.py checks that both
// give the same numbers (tests/js/trv_cases.js). SI units. No DOM.
(function(root){
 const SQ23=Math.sqrt(2/3);
 const UR_LOW=[3.6,4.76,7.2,8.25,12,15,15.5,17.5,24,25.8,27,36,38,40.5,48.3,52,72.5];
 const T3={S1:[40.7,43.7,49.8,52.4,61.2,67.9,68.9,73.2,86.0,89.4,91.6,107,110,114,126,132,164],
  S2:[11.4,13.9,18.5,20.4,26.5,31.0,31.7,34.5,43.0,45.2,46.7,57.1,59.3,62.0,70.2,73.9,93.3]};
 const UR_HIGH=[100,123,145,170,245,300,362,420,550,800,1100,1200],TI=[0.4,0.4,0.4,0.5,0.6,0.7,0.8,0.8,1.0,1.1,1.5,1.5];
 const KAF={S1:{T100:1.4,T60:1.5,T30:1.6,T10:1.7,OP:1.25},S2:{T100:1.54,T60:1.65,T30:1.74,T10:1.8,OP:1.25}};
 const FR={S1:{T100:1,T60:0.44,T30:0.22,T10:0.22},S2:{T100:1,T60:0.67,T30:0.40,T10:0.40}};
 const DUTIES=['T100','T60','T30','T10','OP','SLF'];
 function lowT3(u,cls){const t=T3[cls];const i=UR_LOW.findIndex(x=>Math.abs(x-u)<1e-9);if(i>=0)return [t[i],true];
  let k=u<UR_LOW[0]?0:u>UR_LOW[UR_LOW.length-1]?UR_LOW.length-2:UR_LOW.findIndex((x,j)=>x<=u&&UR_LOW[j+1]>u);
  const a=Math.log(t[k+1]/t[k])/Math.log(UR_LOW[k+1]/UR_LOW[k]);return [t[k]*Math.pow(u/UR_LOW[k],a),false];}
 function defaultKpp(Ur,earthed=true,duty='T100'){const u=Ur/1e3;if(duty==='OP')return !earthed&&u<=170?2.5:2.0;if(duty==='SLF')return 1;if(u>800)return 1.2;return earthed||u>170?1.3:1.5;}
 // the specified TRV of a test-duty (pcl.trv.rated): {params, uc, t3 | u1, t1, t2, td, ud, tdp, rrrv, kpp, kaf}
 function rated(Ur,duty='T100',kpp=null,cls='S1',f=50,earthed=true){
  const u=Ur/1e3;duty=String(duty).toUpperCase();cls=String(cls).toUpperCase();if(!(u>0)||!DUTIES.includes(duty))throw new Error('TRV: U_r > 0 and a test-duty of '+DUTIES.join(', '));
  if(kpp==null)kpp=defaultKpp(Ur,earthed,duty);const E=SQ23*u,o={Ur,duty,kpp,cls:u<100?cls:null,f,standard:true};
  if(u<100){
   if(duty==='SLF'){const [t15,std]=lowT3(u,'S2');const t3=t15/1.5;Object.assign(o,{params:'2p',kaf:1.54,uc:1.54*E,t3,td:0.05*t3,standard:std});}
   else if(duty==='OP'){const [t15,std]=lowT3(u,cls);const rate=2.5*1.25*E/(2*t15),uc=kpp*1.25*E,t3=uc/rate;Object.assign(o,{params:'2p',kaf:1.25,uc,t3,td:0.15*t3,standard:std});}
   else{const [t15,std]=lowT3(u,cls);if(duty==='T10'){kpp=1.5;o.kpp=1.5;}const kaf=KAF[cls][duty],t3=FR[cls][duty]*t15*kpp/1.5;let td=0.15*t3;
    if(duty==='T100'&&cls==='S2'){o.td_max=0.15*t3*1e-6;td=0.05*t3;}Object.assign(o,{params:'2p',kaf,uc:kpp*kaf*E,t3,td,standard:std});}
   o.ud=o.uc/3;o.tdp=o.td+o.t3/3;o.rrrv=o.uc/o.t3;}
  else{const top=u>800,u1=0.75*kpp*E;
   if(duty==='T100'||duty==='SLF'){const kaf=top?1.5:1.4,t1=u1/2;Object.assign(o,{params:'4p',kaf,u1,t1,uc:kpp*kaf*E,t2:(top?3:4)*t1,td:2,ud:u1/2,rrrv:2,td_max:0.28*t1*1e-6});}
   else if(duty==='T60'){const t1=u1/3;Object.assign(o,{params:'4p',kaf:1.5,u1,t1,uc:kpp*1.5*E,t2:(top?4.5:6)*t1,td:2,ud:u1/2,rrrv:3,td_max:0.3*t1*1e-6});}
   else if(duty==='T30'||duty==='T10'){let kaf,uc,rate;if(duty==='T30'){kaf=1.54;rate=5;uc=kpp*kaf*E;}else{rate=7;if(top){kaf=1.76;uc=kpp*kaf*E;}else{uc=1.5*1.53*E;kaf=uc/(kpp*E);}}
    const t3=uc/rate;Object.assign(o,{params:'2p',kaf,uc,t3,td:0.15*t3,ud:uc/3,rrrv:rate});}
   else{const uc=kpp*1.25*E,t1100=0.75*defaultKpp(Ur,earthed,'T100')*E/2;
    if(top){const t3=uc/1.54;Object.assign(o,{params:'2p',kaf:1.25,uc,t3,td:0.05*t3,ud:uc/3,rrrv:1.54});}
    else{const t1=2*t1100;Object.assign(o,{params:'4p',kaf:1.25,u1,t1,uc,t2:4*t1100,td:2,ud:u1/2,rrrv:u1/t1,t2_max:8*t1100*1e-6,td_max:0.1*t1*1e-6});}}
   o.tdp=o.params==='4p'?o.td+o.ud/o.rrrv:o.td+o.t3/3;}
  for(const k of ['uc','u1','ud'])if(k in o)o[k]*=1e3;for(const k of ['t1','t2','t3','td','tdp'])if(k in o)o[k]*=1e-6;o.rrrv*=1e9;return o;}
 function referenceLine(s,tEnd){const p=s.params==='4p'?[[0,0],[s.t1,s.u1],[s.t2,s.uc]]:[[0,0],[s.t3,s.uc]];const last=p[p.length-1][0];p.push([tEnd&&tEnd>last?tEnd:2*last,s.uc]);return p;}
 function delayLine(s){return [[s.td,0],[s.tdp,s.ud]];}
 function lineValue(p,t){if(t<=p[0][0])return t===p[0][0]?p[0][1]:0;for(let k=1;k<p.length;k++)if(t<=p[k][0]){const [ta,ua]=p[k-1],[tb,ub]=p[k];return tb>ta?ua+(ub-ua)*(t-ta)/(tb-ta):ub;}return p[p.length-1][1];}
 // a TRV curve (t from current zero) against a rating: ok, the largest u/u_ref where u_ref ≥ 5 % u_c, the first excess,
 // and the two-parameter shape of the curve (first tangent through the origin, highest peak)
 function compare(t,u,s){let big=0;for(const x of u)if(Math.abs(x)>Math.abs(big))big=x;const sg=big>=0?1:-1,ref=referenceLine(s,t[t.length-1]);
  let ratio=0,first=null,worst=null,at=null,uc=0,tp=0,m1=0;
  for(let i=0;i<t.length;i++){if(t[i]<0)continue;const v=sg*u[i],r=lineValue(ref,t[i]);if(v>r+0.01*s.uc&&first===null)first=t[i];
   if(r>=0.05*s.uc){ratio=Math.max(ratio,v/r);const m=r-v;if(worst===null||m<worst){worst=m;at=t[i];}}if(v>uc){uc=v;tp=t[i];}}
  for(let i=0;i<t.length;i++)if(t[i]>0&&t[i]<=tp&&sg*u[i]>=0.05*uc)m1=Math.max(m1,sg*u[i]/t[i]);
  return {ok:first===null,ratio,margin:worst,t_margin:at,t_first:first,uc,t_peak:tp,rrrv:m1,t3:m1>0?uc/m1:0,uc_ratio:uc/s.uc,rrrv_ratio:m1/s.rrrv};}
 // the short-line fault of Annex A (pcl.trv.slf): u0, uL, tL, the line side rate, the source side, uT at tT
 function slf(Ur,Isc,ratio=0.9,f=50){const w=2*Math.PI*f,Z=Ur>800e3?330:450,k=1.6,s=Math.SQRT2*w*Z,tdL=Ur<=48.3e3?0.1e-6:Ur<=170e3?0.2e-6:0.5e-6;
  const IL=ratio*Isc,UG=Ur/Math.sqrt(3),LS=UG/(w*Isc),LL=UG*(1-ratio)/(IL*w),Um=Math.SQRT2*UG,u0=Um*(1-ratio),ux=w*LS*IL*Math.SQRT2,uL=k*u0,tL=uL/(s*IL);
  const sup=rated(Ur,'SLF',null,'S1',f),um=u0+sup.kaf*ux,rr=sup.rrrv*ratio,dt=Math.max(tdL,0.1e-6),tT=tdL+tL+dt,us=rr*Math.max(tT-sup.td,0);
  return {IL,LS,LL,Um,u0,ux,uL,tL,rate_line:s*IL,Z,k,tdL,um,rrrv_slf:rr,us,uT:uL+us,tT,L:300e6*tL/2,supply:sup};}
 const api={rated,referenceLine,delayLine,lineValue,compare,slf,defaultKpp,DUTIES};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;root.TRV=api;
})(typeof window!=='undefined'?window:globalThis);
