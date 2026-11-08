'use strict';
// Step-response metrics from a sampled signal (per-period averages, so the
// switching ripple does not count as overshoot).
//
// responseMetrics({t, y, tStep, tEnd, ref, band, bandOf})
//   t, y    arrays (same length), t increasing
//   tStep   instant of the step (reference or disturbance)
//   tEnd    end of the evaluation window (default: last sample)
//   ref     number, function of t, or null (then the error is y_final − y)
//   band    settling band as a fraction (default 0.02)
//   bandOf  'final' (± band·|y_final|, textbook) or 'step' (± band·|Δy|)
(function(root){
 function responseMetrics(o){
  const t=o.t,y=o.y,n=t.length,band=o.band??.02,tStep=o.tStep??t[0],tEnd=o.tEnd??t[n-1];
  const refAt=typeof o.ref==='function'?o.ref:Number.isFinite(o.ref)?()=>o.ref:null;
  let i0=-1;for(let i=0;i<n;i++){if(t[i]<=tStep+1e-15)i0=i;else break;}
  const idx=[];for(let i=0;i<n;i++)if(t[i]>tStep+1e-15&&t[i]<=tEnd+1e-15)idx.push(i);
  if(idx.length<3)return {ok:false,why:'Λίγα δείγματα μετά το βήμα: τρέξε την προσομοίωση πιο πολύ.'};
  const y0=i0>=0?y[i0]:y[idx[0]];
  const tail=Math.max(3,Math.round(idx.length*.1));let yf=0;for(let k=idx.length-tail;k<idx.length;k++)yf+=y[idx[k]];yf/=tail;
  const r0=refAt?refAt(tStep-1e-12):null,r1=refAt?refAt(tEnd):null;
  const target=refAt?r1:yf,dy=yf-y0,dir=Math.sign((refAt?r1-(r0??y0):dy))||1;
  const disturbance=Math.abs(refAt?(r1-(r0??r1)):dy)<band*Math.max(Math.abs(yf),1e-12);
  const tol=(o.bandOf==='step'&&!disturbance?Math.abs(dy):Math.abs(yf))*band||band;
  // peak / overshoot, rise time, settling
  let peak=-Infinity,tPeak=NaN,dev=0,tDev=NaN;
  for(const i of idx){const e=dir*(y[i]-yf);if(e>peak){peak=e;tPeak=t[i];}const a=Math.abs(y[i]-yf);if(a>dev){dev=a;tDev=t[i];}}
  let t10=NaN,t90=NaN;if(!disturbance)for(const i of idx){const f=(y[i]-y0)/dy;if(!Number.isFinite(t10)&&f>=.1)t10=t[i];if(!Number.isFinite(t90)&&f>=.9){t90=t[i];break;}}
  let last=-1;for(let k=0;k<idx.length;k++)if(Math.abs(y[idx[k]]-yf)>tol)last=k;
  const settled=last<idx.length-Math.max(2,Math.round(idx.length*.05));
  const ts=last<0?0:settled?t[idx[Math.min(last+1,idx.length-1)]]-tStep:NaN;
  // integral criteria from tStep to tEnd (trapezoidal)
  let IAE=0,ISE=0,ITAE=0;let pt=tStep,pe=(refAt?refAt(tStep):yf)-(i0>=0?y[i0]:y[idx[0]]);
  for(const i of idx){const e=(refAt?refAt(t[i]):yf)-y[i],h=t[i]-pt;IAE+=h*(Math.abs(e)+Math.abs(pe))/2;ISE+=h*(e*e+pe*pe)/2;ITAE+=h*((t[i]-tStep)*Math.abs(e)+(pt-tStep)*Math.abs(pe))/2;pt=t[i];pe=e;}
  return {ok:true,disturbance,y0,yf,dy,target,ess:refAt?target-yf:NaN,
   overshoot:!disturbance&&peak>0?100*peak/Math.abs(dy):0,tPeak:tPeak-tStep,maxDev:dev,tDev:tDev-tStep,
   rise:Number.isFinite(t10)&&Number.isFinite(t90)?t90-t10:NaN,ts,settled:last<0||settled,tol,IAE,ISE,ITAE,n:idx.length,window:[tStep,Math.min(tEnd,t[idx[idx.length-1]])]};
 }
 // all scheduled instants of a project (steps of R, V, I, P, D or the reference)
 function scheduleEvents(project,parseSched){const ev=[];
  for(const c of project.components||[]){const p=c.params||{};const name=c.label||c.id;
   const add=(s,what)=>{const sc=parseSched(s);if(!sc||sc.length<2)return;for(let i=1;i<sc.length;i++)if(sc[i][1]!==sc[i-1][1])ev.push({t:sc[i][0],what:`${what} ${name}: ${sc[i-1][1]} → ${sc[i][1]}`,id:c.id,kind:what});};
   if(c.type==='PWM'){if(p.mode==='pi')add(p.ref,'αναφορά');else add(p.dsched,'D');}
   else if(p.sched)add(p.sched,c.type==='R'?'R':c.type==='CPL'?'P':c.type==='IDC'?'I':'V');}
  ev.sort((a,b)=>a.t-b.t);return ev;}
 // Fourier series of a sampled signal over an integer number of fundamental periods, ending at tEnd.
 // The samples are joined by straight lines (as on the scope) and each segment is integrated exactly, so uneven
 // solver steps and jumps (two samples at the same instant) are handled without resampling.
 //   harmonics({t, y, f1, periods, H, tEnd}) → {ok, dc, A[h], ph[h] (deg, cos), rms, thd (h = 2…H, % of A₁), thdAll (from the RMS)}
 function harmonics(o){
  const t=o.t,y=o.y,n=t.length,f1=+o.f1,P=Math.max(1,Math.round(o.periods||1)),H=Math.max(1,Math.min(1000,Math.round(o.H||50)));
  if(!(f1>0)||n<3)return {ok:false,why:'Χρειάζονται δείγματα και θεμελιώδης συχνότητα f₁ > 0.'};
  const tb=Math.min(o.tEnd??t[n-1],t[n-1]),Tw=P/f1,ta=tb-Tw;
  if(ta<t[0]-1e-12)return {ok:false,why:`Χρειάζεται ιστορικό ${P} περιόδων της f₁ (${(Tw*1e3).toPrecision(4)} ms): τρέξε την προσομοίωση περισσότερο ή μεγάλωσε το ιστορικό.`};
  // the window [ta, tb] as a list of points, with linear interpolation at the two ends
  const at=(i,x)=>t[i+1]>t[i]?y[i]+(y[i+1]-y[i])*(x-t[i])/(t[i+1]-t[i]):y[i+1];
  let i0=0;while(i0<n-1&&t[i0+1]<=ta)i0++;
  const T=[0],Y=[at(i0,ta)];for(let i=i0+1;i<n&&t[i]<tb;i++){T.push(t[i]-ta);Y.push(y[i]);}
  let i1=0;while(i1<n-2&&t[i1+1]<tb)i1++;T.push(Tw);Y.push(t[n-1]<=tb?y[n-1]:at(i1,tb));
  let s0=0,s2=0;for(let k=1;k<T.length;k++){const h=T[k]-T[k-1];if(h<=0)continue;const a=Y[k-1],b=Y[k];s0+=h*(a+b)/2;s2+=h*(a*a+a*b+b*b)/3;}
  const dc=s0/Tw,rms=Math.sqrt(Math.max(s2/Tw,0)),A=new Float64Array(H+1),ph=new Float64Array(H+1);A[0]=Math.abs(dc);
  for(let h=1;h<=H;h++){const w=2*Math.PI*h*f1/P;let re=0,im=0;let c0=1,n0=0;
   // ∫ y·e^{jωτ} over a segment = (y₁E₁ − y₀E₀)/(jω) + s·(E₁ − E₀)/ω², s = slope
   for(let k=1;k<T.length;k++){const d=T[k]-T[k-1],c1=Math.cos(w*T[k]),n1=Math.sin(w*T[k]);if(d>0){const a=Y[k-1],b=Y[k],sl=(b-a)/d;
     const ur=b*c1-a*c0,ui=b*n1-a*n0;re+=ui/w+sl*(c1-c0)/(w*w);im+=-ur/w+sl*(n1-n0)/(w*w);}c0=c1;n0=n1;}
   const ak=2*re/Tw,bk=2*im/Tw;A[h]=Math.hypot(ak,bk);ph[h]=Math.atan2(bk,ak)*180/Math.PI;}
  // with P periods in the window the harmonics of f₁ are the bins h = P, 2P, …; the others are sub/inter-harmonics
  const H1=Math.floor(H/P),Ah=new Float64Array(H1+1),Ph=new Float64Array(H1+1);Ah[0]=A[0];for(let k=1;k<=H1;k++){Ah[k]=A[k*P];Ph[k]=ph[k*P];}
  let s=0;for(let k=2;k<=H1;k++)s+=Ah[k]*Ah[k];const A1=Ah[1]||0;
  const rest=Math.max(rms*rms-dc*dc-A1*A1/2,0);
  return {ok:true,f1,periods:P,H:H1,dc,A:Ah,ph:Ph,bins:A,rms,A1,rms1:A1/Math.SQRT2,thd:A1>0?100*Math.sqrt(s/2)/(A1/Math.SQRT2):NaN,thdAll:A1>0?100*Math.sqrt(rest)/(A1/Math.SQRT2):NaN,window:[ta,tb],n:T.length};
 }
 const api={responseMetrics,scheduleEvents,harmonics};
 root.Metrics=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
