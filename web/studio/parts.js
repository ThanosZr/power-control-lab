'use strict';
// Component catalog shared by the editor (symbols, pins, parameter forms) and
// the simulator (pin names, parameter defaults). Local coordinates use a 10-unit
// grid; pins always sit on grid points so wires stay orthogonal.
(function(root){
 const num=(k,label,unit,def,extra={})=>({k,label,unit,def,type:'num',...extra});
 const sel=(k,label,options,def,extra={})=>({k,label,type:'select',options,def,...extra});
 const txt=(k,label,def,extra={})=>({k,label,type:'text',def,...extra});
 const ref=(k,label,kinds,extra={})=>({k,label,type:'ref',kinds,def:'',...extra});
 const bool=(k,label,def,extra={})=>({k,label,type:'bool',def,...extra});
 // signal pins (3.0): {at, dir}; a part's signal pins may depend on its parameters
 const I=(x,y)=>({at:[x,y],dir:'in'}),O=(x,y)=>({at:[x,y],dir:'out'});
 const xe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const sb=(w,h)=>`<rect class="block sblk" x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" rx="4"/>`;
 const tx=(t,x=0,y=4,cls='btxt')=>`<text class="${cls}" x="${x}" y="${y}" text-anchor="middle">${t}</text>`;
 const sl=d=>`<path class="sigl" d="${d}"/>`;
 const Ex=root.Expr||(typeof require!=='undefined'?require('./expr.js'):null);
 // code blocks (3.3): inputs on the left and outputs on the right, named by the user, 20 apart on the grid
 const codeIO=(ins,outs)=>{const o={};ins.forEach((k,i)=>o[k]=I(-40,-10*(ins.length-1)+20*i));outs.filter(k=>!(k in o)).forEach((k,i,a)=>o[k]=O(40,-10*(a.length-1)+20*i));return o;};
 const codeH=(ins,outs)=>Math.max(15,10*Math.max(ins.length,outs.length));
 const pyIns=p=>Ex.names(p.ins,6,false),pyOuts=p=>Ex.names(p.outs,6,false).filter(k=>!pyIns(p).includes(k));
 const codeDraw=(ins,outs,label)=>{const h=codeH(ins,outs);return sb(60,2*h)+tx(label,0,4,'btxt')+sl([...ins.map((k,i)=>`M-40,${-10*(ins.length-1)+20*i} H-30`),...outs.map((k,i)=>`M30,${-10*(outs.length-1)+20*i} H40`)].join(' '))
  +ins.map((k,i)=>tx(k,-27,-10*(ins.length-1)+20*i-3,'pinl')).join('')+outs.map((k,i)=>tx(k,27,-10*(outs.length-1)+20*i-3,'pinl')).join('');};
 const PY_DEFAULT='# Καλείται σε κάθε δείγμα του ρολογιού.\n# u: είσοδοι, s: κατάσταση, p: παράμετροι (και p["Ts"] = περίοδος δειγματοληψίας).\ndef init(p):\n    return {"xi": 0.0}\n\ndef step(t, u, s, p):\n    e = u["e"]\n    s["xi"] += p["Ki"] * p["Ts"] * e\n    return {"y": p["Kp"] * e + s["xi"]}\n';
 const CLOCK=(extra={})=>ref('clock','Ρολόι (PWM ή μπλοκ Ρολόι)',['PWM','CLK'],{hint:'Ενημέρωση σε σημεία του φέροντος του PWM (ή στην ανερχόμενη ακμή του μπλοκ Ρολόι), όπως στο Sample & Hold.',...extra});
 const TRIG=sel('trig','Πότε ενημερώνεται',[['start','Αρχή περιόδου του φέροντος (1 ανά T)'],['mid','Μέσο περιόδου (1 ανά T)'],['both','Και τα δύο (2 ανά T)']],'start');
 const SCHED='Πρόγραμμα: ζεύγη «t:τιμή» χωρισμένα με κόμμα, π.χ. 0:60000, 0.005:30000. Κενό = σταθερή τιμή.';
 const SRM_TBL=srmTableText({Lu:.008,La:.06,Lsat:.008,psik:.35});
 const PARTS={
  R:{name:'Αντίσταση',prefix:'R',group:'Παθητικά',pins:{a:[-30,0],b:[30,0]},box:[-22,-8,44,16],
   params:[num('R','Αντίσταση','Ω',10),txt('sched','R(t)','',{hint:SCHED})],
   value:p=>p.R,unit:'Ω',
   draw:()=>'<path d="M-30,0 H-20 l2.5,-7 5,14 5,-14 5,14 5,-14 5,14 5,-14 5,14 2.5,-7 H30"/>'},
  CPE:{name:'CPE / Warburg',prefix:'W',group:'Παθητικά',pins:{a:[-30,0],b:[30,0]},box:[-22,-10,44,20],
   params:[sel('kind','Είδος',[['warburg','Warburg: Z = σ(1 − j)/√ω'],['cpe','CPE: Z = 1/(Q·(jω)^α)']],'warburg'),
    num('sigma','Συντελεστής Warburg σ','Ω/√s',0.05,{show:p=>p.kind!=='cpe'}),num('Q','Q','F·s^(α−1)',1,{show:p=>p.kind==='cpe'}),num('alpha','Εκθέτης α (0 < α < 1)','',0.8,{show:p=>p.kind==='cpe'}),
    num('fmin','Ισχύει από','Hz',1),num('fmax','έως','Hz',10e3),num('N','Κλάδοι R–C','',16,{hint:'Το στοιχείο φτιάχνεται από N σειριακούς κλάδους R–C σε παράλληλη σύνδεση (και δύο για τις ουρές). Ακρίβεια περίπου 1 % στη ζώνη f_min … f_max.'})],
   value:p=>p.kind==='cpe'?p.Q:p.sigma,unit:'',
   draw:p=>'<path d="M-30,0 H-22 M22,0 H30"/><rect class="block" x="-22" y="-10" width="44" height="20" rx="2"/>'+tx(p.kind==='cpe'?'CPE':'W',0,4,'btxt')},
  L:{name:'Πηνίο',prefix:'L',group:'Παθητικά',pins:{a:[-30,0],b:[30,0]},box:[-24,-9,48,11],
   params:[num('L','Αυτεπαγωγή','H',100e-6),num('i0','Αρχικό ρεύμα a→b','A',0,{signed:true,hint:'i_L(0): ρεύμα από τον ακροδέκτη a προς τον b.'}),num('Rs','Αντίσταση τυλίγματος','Ω',0,{zero:true})],
   value:p=>p.L,unit:'H',
   draw:()=>'<path d="M-30,0 H-24 a6,6 0 0,1 12,0 a6,6 0 0,1 12,0 a6,6 0 0,1 12,0 a6,6 0 0,1 12,0 H30"/>'},
  C:{name:'Πυκνωτής',prefix:'C',group:'Παθητικά',pins:{p:[0,-30],n:[0,30]},box:[-15,-7,30,14],
   params:[num('C','Χωρητικότητα','F',100e-6),num('v0','Αρχική τάση p−n','V',0,{signed:true}),num('esr','ESR','Ω',0,{zero:true})],
   value:p=>p.C,unit:'F',
   draw:()=>'<path d="M0,-30 V-5 M-15,-5 H15 M-15,5 H15 M0,5 V30"/><path class="thin" d="M8,-14 h6 M11,-17 v6"/>'},
  VDC:{name:'Πηγή DC / μπαταρία',prefix:'V',group:'Πηγές',pins:{p:[0,-40],n:[0,40]},box:[-17,-17,34,34],
   spins:p=>p.ctl==='sig'?{u:I(-30,0)}:{},
   params:[sel('ctl','Τιμή',[['val','Σταθερή ή πρόγραμμα'],['sig','Από σήμα (ακροδέκτης u)']],'val',{hint:'«Από σήμα»: πηγή ελεγχόμενη από σήμα, π.χ. OCV(SOC) μιας κυψέλης από μπλοκ έκφρασης. Η τιμή διαβάζεται σε κάθε βήμα.'}),
    num('V','Τάση','V',12,{signed:true,show:p=>p.ctl!=='sig'}),num('Rs','Εσωτερική αντίσταση','Ω',0,{zero:true}),bool('uni','Μονόδρομη (δίοδος σε σειρά)',false),txt('sched','V(t)','',{hint:SCHED,show:p=>p.ctl!=='sig'})],
   value:p=>p.V,unit:'V',
   draw:p=>(p.ctl==='sig'?sl('M-30,0 H-17'):'')+(p.uni?'<path d="M0,-40 V-34 M0,-24 V-16 M0,16 V40"/><path class="fill" d="M-5,-24 L5,-24 L0,-33 Z"/><path d="M-6,-34 H6"/><circle r="16"/><path class="thin" d="M-4,-7 h8 M0,-11 v8 M-4,8 h8"/>':'<path d="M0,-40 V-16 M0,16 V40"/><circle r="16"/><path class="thin" d="M-4,-7 h8 M0,-11 v8 M-4,8 h8"/>')},
  VAC:{name:'Πηγή AC',prefix:'V',group:'Πηγές',pins:{p:[0,-40],n:[0,40]},box:[-17,-17,34,34],
   params:[num('Vpk','Πλάτος','V',325),num('f','Συχνότητα','Hz',50),num('phase','Φάση','°',0,{signed:true,zero:true}),num('off','DC offset','V',0,{signed:true,zero:true}),num('Rs','Εσωτερική αντίσταση','Ω',0,{zero:true}),num('Ls','Εσωτερική αυτεπαγωγή','H',0,{zero:true})],
   value:p=>p.Vpk,unit:'V',
   draw:()=>'<path d="M0,-40 V-16 M0,16 V40"/><circle r="16"/><path class="thin" d="M-9,0 c3,-10 6,-10 9,0 c3,10 6,10 9,0"/>'},
  VAC3:{name:'Τριφασική πηγή (Y)',prefix:'V',group:'Πηγές',pins:{a:[40,-20],b:[40,0],c:[40,20],n:[0,40]},box:[-20,-30,40,60],
   params:[num('Vpk','Πλάτος φασικής τάσης','V',325),num('f','Συχνότητα','Hz',50),num('phase','Φάση της a','°',0,{signed:true,zero:true}),
    sel('seq','Διαδοχή φάσεων',[['abc','a → b → c'],['acb','a → c → b']],'abc'),num('Rs','Αντίσταση ανά φάση','Ω',0,{zero:true}),num('Ls','Αυτεπαγωγή ανά φάση','H',0,{zero:true})],
   value:p=>p.Vpk,unit:'V',
   draw:()=>'<rect class="block" x="-20" y="-30" width="40" height="60" rx="6"/><path d="M20,-20 H40 M20,0 H40 M20,20 H40 M0,30 V40"/><path class="thin" d="M-11,-20 c2,-7 5,-7 7,0 c2,7 5,7 7,0 M-11,0 c2,-7 5,-7 7,0 c2,7 5,7 7,0 M-11,20 c2,-7 5,-7 7,0 c2,7 5,7 7,0"/>'},
  IDC:{name:'Πηγή ρεύματος',prefix:'I',group:'Πηγές',pins:{p:[0,-40],n:[0,40]},box:[-17,-17,34,34],
   spins:p=>p.ctl==='sig'?{u:I(-30,0)}:{},
   params:[sel('ctl','Τιμή',[['val','Σταθερή ή πρόγραμμα'],['sig','Από σήμα (ακροδέκτης u)']],'val',{hint:'«Από σήμα»: π.χ. ρεύμα διέγερσης I_dc + I_ac·sin(2πft) από μπλοκ έκφρασης, ή κεραυνικό ρεύμα Heidler.'}),
    num('I','Ρεύμα (βγαίνει από το p)','A',1,{signed:true,show:p=>p.ctl!=='sig'}),txt('sched','I(t)','',{hint:SCHED,show:p=>p.ctl!=='sig'})],
   value:p=>p.I,unit:'A',
   draw:p=>(p.ctl==='sig'?sl('M-30,0 H-17'):'')+'<path d="M0,-40 V-16 M0,16 V40"/><circle r="16"/><path class="thin" d="M0,10 V-9 M-5,-3 L0,-10 L5,-3"/>'},
  SW:{name:'Διακόπτης (MOSFET / IGBT)',prefix:'S',group:'Ημιαγωγοί',pins:{d:[0,-30],s:[0,30]},box:[-16,-17,43,34],
   spins:p=>p.gate==='sig'?{g:I(-20,0)}:{},
   params:[sel('gate','Οδήγηση',[['pwm','Από PWM'],['sig','Από σήμα (ακροδέκτης g)'],['on','Πάντα ON'],['off','Πάντα OFF']],'pwm'),ref('pwm','Μπλοκ PWM',['PWM'],{show:p=>p.gate==='pwm'}),
    sel('out','Έξοδος PWM',[['a','g (κύρια)'],['na','ḡ (συμπληρωματική)'],['b','g₂ (2ο σκέλος)'],['nb','ḡ₂']],'a',{show:p=>p.gate==='pwm'}),
    sel('model','Μοντέλο',[['mos','MOSFET: R_on, άγει και ανάστροφα'],['igbt','IGBT: V_ce0 + R_on, μόνο ορθή φορά']],'mos'),
    num('Ron','R_on','Ω',1e-3),num('Vce0','V_ce0 (κατώφλι αγωγής)','V',1,{zero:true,show:p=>p.model==='igbt'}),num('Roff','R_off','Ω',1e6),
    bool('body','Αντιπαράλληλη δίοδος',true),num('Vfd','V_f διόδου','V',0,{zero:true,show:p=>p.body}),num('Rd','R_on διόδου','Ω',0,{zero:true,show:p=>p.body,hint:'0 = ίδια με το R_on του διακόπτη.'}),
    num('Eon','E_on (ενέργεια ανοίγματος)','J',0,{zero:true,hint:'Μετρημένη στις V_ref, I_ref. Κλιμακώνεται με |v|·|i| τη στιγμή της μεταγωγής. 0 = χωρίς απώλειες μεταγωγής.'}),num('Eoff','E_off (ενέργεια σβέσης)','J',0,{zero:true}),
    num('Vref','V_ref','V',600,{show:p=>+p.Eon>0||+p.Eoff>0}),num('Iref','I_ref','A',100,{show:p=>+p.Eon>0||+p.Eoff>0})],
   value:()=>null,
   draw:p=>{const gs=p.gate==='sig'?sl('M-14,0 H-20'):'';const d=gs+(p.body?(p.model==='igbt'?'<path class="thin" d="M0,-20 H20 V-5 M0,20 H20 V5 M15,5 H25 M15,-4 H25 L20,5 Z"/>':'<path class="thin" d="M8,-12 H20 V-5 M8,12 H20 V5 M15,5 H25 M15,-4 H25 L20,5 Z"/>'):'');
    return p.model==='igbt'?`<path d="M0,-30 V-14 L8,-8 M8,8 L0,14 V30 M8,-13 V13 M2,-12 V12 M2,0 H-14"/><path class="fill" d="M1.2,14.6 l1.6,-6.2 l4.4,4.4 z"/>${d}`
     :`<path d="M0,-30 V-12 H8 M0,30 V12 H8 M8,-17 V-7 M8,-3 V3 M8,7 V17 M2,-15 V15 M2,0 H-14"/><path class="fill" d="M8,12 l-6,-3.5 v7 z"/>${d}`;}},
  D:{name:'Δίοδος',prefix:'D',group:'Ημιαγωγοί',pins:{a:[-30,0],k:[30,0]},box:[-10,-11,20,22],
   params:[num('Ron','R_on','Ω',1e-3),num('Vf','Τάση γονάτου V_f','V',0,{zero:true}),num('Roff','R_off','Ω',1e6)],
   value:()=>null,
   draw:()=>'<path d="M-30,0 H-9 M9,0 H30 M9,-10 V10"/><path class="fill" d="M-9,-10 L9,0 L-9,10 Z"/>'},
  SCR:{name:'Θυρίστορ (SCR)',prefix:'Q',group:'Ημιαγωγοί',pins:{a:[-30,0],k:[30,0]},box:[-10,-11,29,26],
   params:[sel('fire','Έναυση',[['alpha','Γωνία α ως προς πηγή AC'],['pwm','Από PWM'],['on','Συνεχώς (σαν δίοδος)']],'alpha'),
    ref('refsrc','Πηγή αναφοράς',['VAC','VAC3'],{show:p=>p.fire==='alpha',hint:'Η α μετριέται από τη θετική διάβαση από το μηδέν της τάσης αναφοράς (φάση a στην τριφασική).'}),
    num('alpha','Γωνία έναυσης α','°',30,{zero:true,show:p=>p.fire==='alpha'}),
    num('shift','Μετατόπιση','°',0,{signed:true,zero:true,show:p=>p.fire==='alpha',hint:'Προστίθεται στην α: 180° για τα θυρίστορ της αρνητικής ημιπεριόδου, 30° + 60°·k στις τριφασικές γέφυρες.'}),
    num('pw','Διάρκεια παλμού','°',20,{show:p=>p.fire==='alpha'}),num('fref','Συχνότητα (χωρίς πηγή αναφοράς)','Hz',50,{show:p=>p.fire==='alpha'&&!p.refsrc}),
    ref('pwm','Μπλοκ PWM',['PWM'],{show:p=>p.fire==='pwm'}),sel('out','Έξοδος PWM',[['a','g'],['na','ḡ'],['b','g₂'],['nb','ḡ₂']],'a',{show:p=>p.fire==='pwm'}),
    num('Ron','R_on','Ω',1e-3),num('Vf','Τάση γονάτου V_f','V',0,{zero:true}),num('Roff','R_off','Ω',1e6)],
   value:()=>null,
   draw:()=>'<path d="M-30,0 H-9 M9,0 H30 M9,-10 V10 M9,5 L18,14"/><path class="fill" d="M-9,-10 L9,0 L-9,10 Z"/>'},
  XFMR:{name:'Μετασχηματιστής',prefix:'T',group:'Μαγνητικά',pins:{p1:[-30,-30],p2:[-30,30],s1:[30,-30],s2:[30,30]},box:[-20,-26,40,52],
   params:[num('n','Λόγος N₂/N₁','',1),num('Lm','Αυτεπαγωγή μαγνήτισης (πρωτεύον)','H',1e-3),num('im0','Αρχικό ρεύμα μαγνήτισης','A',0,{signed:true,zero:true}),
    num('Llk1','Σκέδαση πρωτεύοντος L_lk1','H',0,{zero:true,hint:'Σε σειρά με το πρωτεύον, έξω από την L_m. Στο flyback χρειάζεται κύκλωμα clamp (RCD).'}),num('Llk2','Σκέδαση δευτερεύοντος L_lk2','H',0,{zero:true}),
    num('R1','Αντίσταση πρωτεύοντος','Ω',0,{zero:true}),num('R2','Αντίσταση δευτερεύοντος','Ω',0,{zero:true}),
    sel('pol','Πολικότητα',[['same','Τελείες p1 και s1'],['opp','Τελείες p1 και s2 (flyback)']],'same')],
   value:p=>p.n,unit:'',
   draw:p=>`<path d="M-30,-30 H-14 V-24 a6,6 0 0,1 0,12 a6,6 0 0,1 0,12 a6,6 0 0,1 0,12 a6,6 0 0,1 0,12 V30 H-30 M30,-30 H14 V-24 a6,6 0 0,0 0,12 a6,6 0 0,0 0,12 a6,6 0 0,0 0,12 a6,6 0 0,0 0,12 V30 H30"/><path class="thin" d="M-3,-26 V26 M3,-26 V26"/><circle class="dot" cx="-20" cy="-26" r="2.6"/><circle class="dot" cx="20" cy="${p.pol==='opp'?26:-26}" r="2.6"/>`},
  // lightning current (3.5): Heidler or double exponential, IEC 62305-1 waveforms or fitted to a front/tail time
  ILG:{name:'Κεραυνικό ρεύμα (Heidler)',prefix:'I',group:'Πηγές',pins:{p:[0,-40],n:[0,40]},box:[-17,-17,34,34],
   params:[sel('shape','Κυματομορφή',[['10/350','10/350 μs: πρώτο θετικό πλήγμα (IEC 62305-1)'],['1/200','1/200 μs: πρώτο αρνητικό πλήγμα'],['0.25/100','0,25/100 μs: επόμενο αρνητικό πλήγμα'],['custom','Άλλη T1/T2 (προσαρμογή των τ₁, τ₂)']],'10/350',
     {hint:'Heidler: i(t) = (I₀/η)·(t/τ₁)ⁿ/(1 + (t/τ₁)ⁿ)·e^(−t/τ₂). Οι τρεις τυπικές με τα τ₁, τ₂, η του IEC 62305-1 (n = 10). T1 = 1,25·(t₉₀ − t₁₀), T2 από την εικονική αρχή ως το 50 % στην ουρά.'}),
    num('Ipk','Μέγιστο ρεύμα I₀ (βγαίνει από το p)','A',200e3,{signed:true}),
    sel('model','Μοντέλο',[['heidler','Heidler'],['dexp','Διπλοεκθετικό: I₀/η·(e^(−t/τ₂) − e^(−t/τ₁))']],'heidler',{show:p=>p.shape==='custom'}),
    num('T1','Χρόνος μετώπου T1','s',1.2e-6,{show:p=>p.shape==='custom'}),num('T2','Χρόνος ημίσεος T2','s',50e-6,{show:p=>p.shape==='custom'}),num('n','Εκθέτης n (Heidler)','',10,{show:p=>p.shape==='custom'&&p.model!=='dexp'}),
    num('t0','Καθυστέρηση','s',0,{zero:true})],
   value:p=>p.Ipk,unit:'A',
   draw:()=>'<path d="M0,-40 V-16 M0,16 V40"/><circle r="16"/><path class="thin" d="M3,-11 L-4,1 L2,1 L-3,11 M-3,11 L-4,5 M-3,11 L1,7"/>'},
  // multiport elements (3.5): N windings or ports, one above the other, a_k on the left and b_k on the right (dots at a_k)
  // impulse voltage (3.8): double exponential v = (V₀/η)·(e^(−t/τ₂) − e^(−t/τ₁)), IEC 60060-1 times
  VIMP:{name:'Κρουστική τάση (1,2/50, 250/2500)',prefix:'V',group:'Πηγές',pins:{p:[0,-40],n:[0,40]},box:[-17,-17,34,34],
   params:[sel('shape','Κυματομορφή',[['1.2/50','1,2/50 μs: κεραυνική (LI)'],['250/2500','250/2500 μs: χειρισμών (SI, χρόνος κορυφής)'],['custom','Άλλη (προσαρμογή των τ₁, τ₂)'],['ramp','Ράμπα με κλίση S ως τη V₀']],'1.2/50',
     {hint:'v(t) = (V₀/η)·(e^(−t/τ₂) − e^(−t/τ₁)), κορυφή V₀. IEC 60060-1: T1 = 1,67·(t₉₀ − t₃₀), T2 από την εικονική αρχή t₃₀ − 0,3·T1 ως το 50 % στην ουρά. Για 250/2500: χρόνος κορυφής T_p και T2 από το t = 0.'}),
    num('Vpk','Μέγιστη τάση V₀','V',100e3,{signed:true}),
    sel('basis','Ορισμός χρόνων',[['iec','T1 (30–90 %) και T2 από την εικονική αρχή'],['tp','T_p (χρόνος κορυφής) και T2 από το t = 0']],'iec',{show:p=>p.shape==='custom'}),
    num('T1','Χρόνος μετώπου T1 ή T_p','s',1.2e-6,{show:p=>p.shape==='custom'}),num('T2','Χρόνος ημίσεος T2','s',50e-6,{show:p=>p.shape==='custom'}),
    num('S','Κλίση μετώπου S','V/s',1e12,{show:p=>p.shape==='ramp'}),
    num('Rs','Εσωτερική αντίσταση','Ω',0,{zero:true,hint:'Π.χ. Z της γραμμής: «προσπίπτον κύμα πίσω από Z».'}),num('t0','Καθυστέρηση','s',0,{zero:true})],
   value:p=>p.Vpk,unit:'V',
   draw:()=>'<path d="M0,-40 V-16 M0,16 V40"/><circle r="16"/><path class="thin" d="M-8,7 L-5,-8 C-2,-8 0,4 9,6"/><path class="thin" d="M-5,-12 H5"/>'},
  // transmission line (3.8): lossless, Bergeron / Dommel. At each end i = v/Z + I_h, I_h(t) = −(v/Z + i) of the other end at t − τ
  TL:{name:'Γραμμή μεταφοράς (οδεύοντα κύματα)',prefix:'TL',group:'Παθητικά',pins:{a1:[-60,-20],b1:[-60,20],a2:[60,-20],b2:[60,20]},box:[-45,-26,90,52],
   params:[sel('spec','Δεδομένα',[['zt','Z και χρόνος διάδοσης τ'],['zl','Z, μήκος και ταχύτητα'],['lc','L′, C′ ανά μέτρο και μήκος']],'zt',{hint:'Γραμμή χωρίς απώλειες. Ο ένας αγωγός από a1 σε a2, ο άλλος (ή η γη) από b1 σε b2. Το βήμα του λύτη μένει ≤ τ.'}),
    num('Z','Κυματική αντίσταση Z','Ω',400,{show:p=>p.spec!=='lc'}),num('tau','Χρόνος διάδοσης τ','s',10e-6,{show:p=>p.spec==='zt'}),
    num('len','Μήκος','m',3000,{show:p=>p.spec!=='zt'}),num('vel','Ταχύτητα διάδοσης','m/s',3e8,{show:p=>p.spec==='zl',hint:'Εναέρια γραμμή περίπου 3·10⁸ m/s, καλώδιο c/√ε_r.'}),
    num('Lp','Αυτεπαγωγή ανά μέτρο L′','H/m',1.333e-6,{show:p=>p.spec==='lc'}),num('Cp','Χωρητικότητα ανά μέτρο C′','F/m',8.333e-12,{show:p=>p.spec==='lc'}),
    num('Rt','Αντίσταση σειράς όλης της γραμμής R','Ω',0,{show:p=>p.spec==='zt',hint:'Απώλειες (3.11): η R μπαίνει συγκεντρωμένη, R/4 στα άκρα και R/2 στη μέση κάθε τμήματος (Dommel). Το μέτωπο σβήνει περίπου ως e^(−R/(2Z)). 0 = χωρίς απώλειες.'}),
    num('Rp','Αντίσταση σειράς ανά μέτρο R′','Ω/m',0,{show:p=>p.spec!=='zt',hint:'Απώλειες (3.11): R = R′·μήκος, συγκεντρωμένη R/4 στα άκρα και R/2 στη μέση κάθε τμήματος (Dommel). Το μέτωπο σβήνει περίπου ως e^(−R′x/(2Z)). 0 = χωρίς απώλειες.'}),
    num('nsec','Τμήματα για τις απώλειες','',1,{show:p=>parseEng(p.spec==='zt'?p.Rt:p.Rp)>0,hint:'Η γραμμή χωρίζεται σε N ίσα τμήματα, το καθένα με R/N. Με R/(4N) ≪ Z το μοντέλο πλησιάζει την κατανεμημένη γραμμή. Το βήμα του λύτη μένει ≤ τ/N.'})],
   value:p=>p.Z,unit:'Ω',
   draw:p=>'<path d="M-60,-20 H-34 M34,-20 H60"/><path class="thin" d="M-60,20 H-34 M34,20 H60"/><rect class="block" x="-34" y="-26" width="68" height="52" rx="5"/><path class="thin" d="M-26,-20 H26"/><path class="thin" stroke-dasharray="3 3" d="M-26,20 H26"/>'+tx(parseEng(p?.spec==='zt'?p?.Rt:p?.Rp)>0?'Z, τ, R':'Z, τ',0,4,'bsm')},
  KL:{name:'Συζευγμένα πηνία (N×N)',prefix:'K',group:'Μαγνητικά',pins:p=>portPins(nPorts(p)),box:p=>portBox(nPorts(p)),
   params:[sel('nw','Τυλίγματα',[['2','2'],['3','3'],['4','4']],'2',{show:p=>!String(p.Lmat||'').trim()}),
    num('L1','L₁','H',1e-3,{show:p=>!String(p.Lmat||'').trim()}),num('L2','L₂','H',1e-3,{show:p=>!String(p.Lmat||'').trim()}),
    num('L3','L₃','H',1e-3,{show:p=>!String(p.Lmat||'').trim()&&+p.nw>=3}),num('L4','L₄','H',1e-3,{show:p=>!String(p.Lmat||'').trim()&&+p.nw>=4}),
    num('k','Συντελεστής σύζευξης k (όλα τα ζεύγη)','',0.95,{show:p=>!String(p.Lmat||'').trim(),hint:'M_ij = k·√(L_i·L_j), με 0 ≤ k < 1. Αρνητικό k: αντίθετες τελείες.'}),
    txt('kpairs','k ανά ζεύγος','',{show:p=>!String(p.Lmat||'').trim(),hint:'Προαιρετικά, π.χ. «12:0.98, 23:0.9». Τα ζεύγη που δεν γράφεις παίρνουν το κοινό k.'}),
    txt('Lmat','Πίνακας αυτεπαγωγής (αντί για τα παραπάνω)','',{hint:'Γραμμές με «;», στοιχεία με «,», σε H, π.χ. «1m, 0.9m; 0.9m, 1m». Συμμετρικός και θετικά ορισμένος. Το πλήθος των γραμμών δίνει τα τυλίγματα.'}),
    num('Rw','Αντίσταση κάθε τυλίγματος','Ω',0,{zero:true}),txt('i0','Αρχικά ρεύματα a → b','0',{hint:'Ένα ανά τύλιγμα, π.χ. «0, 0». Ένα μόνο = ίδιο σε όλα.'})],
   value:p=>p.k,unit:'',
   draw:p=>{const N=nPorts(p);let s='';for(let k=0;k<N;k++){const y=portY(N,k);s+=`<path d="M-30,${y} H-18 a3,4 0 0,1 6,0 a3,4 0 0,1 6,0 a3,4 0 0,1 6,0 a3,4 0 0,1 6,0 a3,4 0 0,1 6,0 a3,4 0 0,1 6,0 H30"/><circle class="dot" cx="-22" cy="${y-4}" r="2.2"/>`;}
    return s+`<path class="thin" d="M-18,${portY(N,0)-8} H18 M-18,${portY(N,N-1)+5} H18"/>`;}},
  KG:{name:'Πολυθυρική αντίσταση / αγωγιμότητα',prefix:'Y',group:'Παθητικά',pins:p=>portPins(nPorts(p)),box:p=>portBox(nPorts(p)),
   params:[sel('kind','Πίνακας',[['R','Αντιστάσεων R (Ω): v = R·i'],['G','Αγωγιμοτήτων G (S): i = G·v']],'R',{hint:'Ρεύμα κάθε θύρας από το a_k προς το b_k μέσα στο στοιχείο. Π.χ. αμοιβαίες αντιστάσεις ηλεκτροδίων γείωσης (μέθοδος μέσου δυναμικού).'}),
    txt('mat','Πίνακας','10, 2; 2, 10',{hint:'Γραμμές με «;», στοιχεία με «,». Συμμετρικός και θετικά ορισμένος.'})],
   value:()=>null,
   draw:p=>{const N=nPorts(p);let s='';for(let k=0;k<N;k++){const y=portY(N,k);s+=`<path d="M-30,${y} H-14 M14,${y} H30"/>`;}const y0=portY(N,0)-7,h=portY(N,N-1)-portY(N,0)+14;
    return s+`<rect x="-14" y="${y0}" width="28" height="${h}" rx="2"/>`+tx(p.kind==='G'?'[G]':'[R]',0,(portY(N,0)+portY(N,N-1))/2+4,'bsm');}},
  // metal-oxide surge arrester (3.9): i = I_ref·(|v|/U_ref)^α·sign v, or log-log interpolation of a table of (current, voltage)
  MOV:{name:'Αλεξικέραυνο (MOV, μη γραμμική αντίσταση)',prefix:'MOV',group:'Παθητικά',pins:{a:[0,-40],b:[0,40]},box:[-12,-22,24,44],
   params:[sel('model','Χαρακτηριστική',[['pow','i = I_ref·(v/U_ref)^α'],['table','Πίνακας ρεύματος–τάσης']],'pow',{hint:'Συμμετρική ως προς την πολικότητα. Ο λύτης βρίσκει την τάση με Newton σε κάθε βήμα.'}),
    num('Uref','Παραμένουσα τάση U_ref','V',692e3,{show:p=>p.model!=='table'}),num('Iref','στο ρεύμα I_ref','A',20e3,{show:p=>p.model!=='table'}),num('alpha','Εκθέτης α','',30,{show:p=>p.model!=='table',hint:'ZnO: 20–50, SiC: 2–6.'}),
    txt('tbl','Σημεία «ρεύμα: τάση»','1e-3: 379k, 1e3: 700k, 10e3: 823k',{show:p=>p.model==='table',hint:'Π.χ. ο απαγωγός 420 kV του βιβλίου: √2·U_c = 379 kV στο 1 mA, 823 kV στα 10 kA.'})],
   value:p=>p.Uref,unit:'V',
   draw:()=>'<path d="M0,-40 V-22 M0,22 V40"/><rect x="-9" y="-22" width="18" height="44" rx="2"/><path class="thin" d="M-15,14 L-6,14 L6,-14 L15,-14"/>'},
  // spark gap (3.10): closes when |v| reaches the breakdown voltage U_b, or at a trigger time (trigatron); conducts
  // through the arc resistance; opens at a current zero, below I_ext, or never. Off: R_off.
  SG:{name:'Σπινθηριστής (διάκενο)',prefix:'SG',group:'Παθητικά',pins:{a:[-30,0],b:[30,0]},box:[-14,-11,28,22],
   params:[sel('vt','Διάσπαση',[['inst','Ακαριαία στο U_b'],['de','Με καμπύλη τάσης–χρόνου (U₀, k, D)']],'inst',{hint:'Καμπύλη τάσης–χρόνου (3.11): κλείνει όταν ∫ (|v| − U₀)^k dt, πάνω από το U₀, φτάσει το D (disruptive effect). k = 0: σταθερή καθυστέρηση D δευτερόλεπτα πάνω από το U₀. k = 1: νόμος ίσων επιφανειών (Kind).'}),
    num('Ub','Τάση διάσπασης U_b','V',100e3,{show:p=>p.vt!=='de',hint:'Κλείνει όταν |v| ≥ U_b, με οποιαδήποτε πολικότητα. Χωρίς καθυστέρηση διάσπασης.'}),
    num('U0','Τάση έναρξης U₀','V',80e3,{show:p=>p.vt==='de',hint:'Κάτω από το U₀ δεν διασπάται ποτέ (η στατική τάση διάσπασης). Όταν η τάση πέσει κάτω από το U₀, το ολοκλήρωμα μηδενίζεται.'}),
    num('kde','Εκθέτης k','',1,{show:p=>p.vt==='de'}),
    num('Dde','Σταθερά D','V^k·s',5e-3,{show:p=>p.vt==='de',hint:'Σε V^k·s: με k = 1 σε V·s (5·10⁻³ V·s = 5 kV·μs), με k = 0 σε s. Με ράμπα S διασπάται στο U₀ + ((k+1)·D·S^k)^(1/(k+1)).'}),
    txt('trig','Έναυση (trigatron) τη στιγμή','',{hint:'Π.χ. «2u». Κλείνει τότε όποια κι αν είναι η τάση, μία φορά. Κενό: μόνο με την τάση διάσπασης.'}),
    num('Rarc','Αντίσταση τόξου','Ω',.1),
    sel('ext','Σβήνει',[['zero','Στον μηδενισμό του ρεύματος'],['iext','Όταν |i| < I_ext'],['never','Ποτέ (μένει κλειστός)']],'zero',{hint:'Μετά τη σβέση ξανακλείνει αν η τάση ξεπεράσει πάλι το U_b.'}),
    num('Iext','Ρεύμα σβέσης I_ext','A',1,{show:p=>p.ext==='iext'}),
    num('Roff','R_off (ανοιχτός)','Ω',1e10)],
   value:p=>p.vt==='de'?p.U0:p.Ub,unit:'V',
   draw:p=>'<path d="M-30,0 H-11 M11,0 H30"/><circle cx="-6.5" cy="0" r="4.5"/><circle cx="6.5" cy="0" r="4.5"/>'+(String(p.trig||'').trim()?'<path class="thin" d="M0,10 V4 M-3,7 L0,4 L3,7"/>':'')},
  CPL:{name:'Φορτίο σταθερής ισχύος',prefix:'P',group:'Φορτία',pins:{p:[0,-30],n:[0,30]},box:[-12,-17,24,34],
   params:[num('P','Ισχύς','W',1000,{signed:true}),num('Vmin','Τάση κάτω από την οποία γίνεται ωμικό','V',5),txt('sched','P(t)','',{hint:SCHED})],
   value:p=>p.P,unit:'W',
   draw:()=>'<path d="M0,-30 V-16 M0,16 V30"/><rect x="-11" y="-16" width="22" height="32" rx="2"/><path class="thin" d="M-4,6 V-6 h5 a3.5,3.5 0 0,1 0,7 h-5"/>'},
  SH:{name:'Sample & Hold',prefix:'SH',group:'Έλεγχος',pins:{},box:[-30,-18,60,36],
   spins:p=>p.in==='sig'?{u:I(-40,0),y:O(40,0)}:{y:O(40,0)},
   params:[sel('in','Είσοδος',[['elem','Μέτρηση στοιχείου'],['sig','Σήμα (ακροδέκτης u)']],'elem',{hint:'Η κρατημένη τιμή βγαίνει πάντα στον ακροδέκτη y, για μπλοκ σημάτων.'}),
    ref('src','Μετρούμενο στοιχείο',['L','R','C','VDC','CPL','SW','D','SCR','XFMR','IDC','VAC','VAC3'],{show:p=>p.in!=='sig'}),sel('qty','Μέγεθος',[['I','Ρεύμα'],['V','Τάση']],'I',{show:p=>p.in!=='sig'}),
    ref('clock','Φέρον (PWM ή μπλοκ Ρολόι)',['PWM','CLK'],{hint:'Τα δείγματα παίρνονται σε σημεία του φέροντος αυτού του PWM, άρα ακολουθούν τη συχνότητα και τη μετατόπισή του.'}),
    sel('trig','Πότε παίρνει δείγμα',[['start','Αρχή περιόδου: reset πριονωτού ή μέγιστο τριγώνου (1 ανά T)'],['mid','Μέσο περιόδου: ελάχιστο τριγώνου (1 ανά T)'],['both','Και στα δύο ακρότατα (2 ανά T)']],'start'),
    sel('init','Πριν από το πρώτο δείγμα',[['value','Δηλωμένη αρχική τιμή'],['nan','Μη έγκυρη τιμή (κενό)']],'value'),num('h0','Αρχική τιμή','',0,{signed:true,zero:true,show:p=>p.init!=='nan'})],
   value:()=>null,
   draw:p=>'<rect class="block" x="-30" y="-18" width="60" height="36" rx="6"/><path class="thin" d="M-22,9 H-11 V1 H0 V-7 H11 V3 H22"/><path class="thin accent" d="M-11,-13 V13 M0,-13 V13 M11,-13 V13" stroke-dasharray="2 3"/>'+sl('M30,0 H40')+(p.in==='sig'?sl('M-40,0 H-30'):'')},
  GND:{name:'Γείωση',prefix:'G',group:'Βασικά',pins:{g:[0,0]},box:[-11,2,22,16],params:[],value:()=>null,
   draw:()=>'<path d="M0,0 V8 M-11,8 H11 M-7,13 H7 M-3,18 H3"/>'},
  JUNC:{name:'Κόμβος',prefix:'J',group:'Βασικά',pins:{j:[0,0]},box:[-4,-4,8,8],params:[],hidden:true,value:()=>null,draw:()=>''},
  PWM:{name:'PWM / έλεγχος',prefix:'PWM',group:'Έλεγχος',pins:{},box:[-34,-20,68,40],spins:p=>p.mode==='ext'?{d:I(-40,0)}:{},
   params:[num('fs','Συχνότητα','Hz',20e3),
    sel('mode','Τρόπος',[['fixed','Σταθερό D (ανοικτός βρόχος)'],['pi','Βρόχος PI / PID'],['spwm','Ημιτονοειδές SPWM'],['pp','Δύο εξόδων (full-bridge)'],['ext','D από σήμα (ακροδέκτης d)']],'fixed',{hint:'Με «D από σήμα» το duty διαβάζεται από τον ακροδέκτη d στα σημεία ενημέρωσης (αρχή περιόδου, και στο μέσο με διπλή ενημέρωση).'}),
    num('D','Duty D','',0.5,{zero:true,show:p=>p.mode==='fixed'||p.mode==='pp'}),
    txt('dsched','D(t)','',{hint:SCHED+' Για παλμό ΔD: 0:0.5, 0.001:0.55, 0.0028:0.5',show:p=>p.mode==='fixed'}),
    sel('carrier','Φορέας',[['triangle','Τριγωνικός (συμμετρικός)'],['saw','Πριονωτός (ON πρώτα)']],'triangle',{show:p=>p.mode!=='spwm'&&p.mode!=='pp'}),
    num('phase','Μετατόπιση φορέα','°',0,{signed:true,zero:true}),
    sel('upd','Ενημέρωση του D',[['single','Μία φορά ανά περίοδο (στην αρχή)'],['double','Δύο φορές: και στο ελάχιστο του τριγώνου']],'single',{show:p=>(p.mode==='fixed'||p.mode==='pi'||p.mode==='ext')&&p.carrier!=='saw',hint:'Με δύο ενημερώσεις η ακμή ανάμματος χρησιμοποιεί το D της αρχής της περιόδου και η ακμή σβησίματος το D του μέσου. Ο PI τρέχει με T_s = T/2.'}),
    num('dt','Νεκρός χρόνος','s',0,{zero:true,hint:'Καθυστερεί το άνοιγμα κάθε εξόδου (g, ḡ, g₂, ḡ₂). Στο διάστημα αυτό το ρεύμα περνά από τις διόδους.'}),
    ref('sensor','Μετρούμενο στοιχείο',['L','R','C','VDC','CPL','SW','D','SCR','XFMR','IDC','VAC','VAC3','SH'],{show:p=>p.mode==='pi',hint:'Με μπλοκ Sample & Hold ο ελεγκτής διαβάζει την κρατημένη τιμή του, δηλαδή το τελευταίο δείγμα.'}),
    sel('qty','Μέγεθος',[['I','Ρεύμα'],['V','Τάση']],'I',{show:p=>p.mode==='pi'}),
    txt('ref','Αναφορά (τιμή ή πρόγραμμα)','0',{hint:'Σταθερή τιμή ή «t:τιμή», π.χ. 0:-800, 0.003:800',show:p=>p.mode==='pi'}),
    num('Kp','K_p','',1e-3,{zero:true,signed:true,show:p=>p.mode==='pi'}),num('Ki','K_i','1/s',1,{zero:true,signed:true,show:p=>p.mode==='pi'}),num('Kd','K_d (0 = PI)','s',0,{zero:true,signed:true,show:p=>p.mode==='pi',hint:'d = D₀ + K_p·e + K_i·T_s·Σe + K_d·de/dt, με δειγματοληψία μία φορά ανά περίοδο.'}),num('Tf','Φίλτρο παραγώγου T_f','s',0,{zero:true,show:p=>p.mode==='pi'&&+p.Kd!==0,hint:'Πρώτης τάξης φίλτρο στον παράγωγο όρο, π.χ. 2·T_s. 0 = χωρίς φίλτρο.'}),
    sel('ff','Feedforward',[['none','Χωρίς'],['ratio','D₀ = 1 − V(A)/V(B)'],['const','Σταθερό D₀']],'none',{show:p=>p.mode==='pi'}),
    ref('ffA','V(A)',['VDC','C','CPL','R','VAC'],{show:p=>p.mode==='pi'&&p.ff==='ratio'}),ref('ffB','V(B)',['VDC','C','CPL','R','VAC'],{show:p=>p.mode==='pi'&&p.ff==='ratio'}),
    num('D0','D₀','',0.5,{zero:true,show:p=>p.mode==='pi'&&p.ff==='const'}),
    num('dmin','D_min','',0.01,{zero:true,show:p=>p.mode==='pi'}),num('dmax','D_max','',0.99,{show:p=>p.mode==='pi'}),
    num('m','Δείκτης διαμόρφωσης m','',0.8,{show:p=>p.mode==='spwm'}),num('fref','Συχνότητα αναφοράς','Hz',50,{show:p=>p.mode==='spwm'}),
    num('refphase','Φάση αναφοράς','°',0,{signed:true,zero:true,show:p=>p.mode==='spwm'})],
   value:p=>p.fs,unit:'Hz',
   draw:p=>'<rect class="block" x="-34" y="-20" width="68" height="40" rx="6"/><path class="thin" d="M-24,8 L-14,-8 L-4,8 L6,-8 L16,8 L24,-4"/><path class="thin accent" d="M-26,-2 H26"/>'+(p.mode==='ext'?sl('M-40,0 H-34'):'')},
  // ---------------------------------------------------------------- machines (3.1)
  DCM:{name:'Μηχανή ΣΡ (ανεξάρτητη διέγερση)',prefix:'M',group:'Μηχανές',pins:{a:[0,-40],b:[0,40]},box:[-20,-20,40,40],lbl:'left',
   spins:p=>p.load==='sig'?{w:O(40,-10),te:O(40,10),tl:I(-40,0)}:{w:O(40,-10),te:O(40,10)},
   params:[num('Ra','Αντίσταση τυμπάνου R_a','Ω',0.5),num('La','Αυτεπαγωγή τυμπάνου L_a','H',10e-3),num('psi','Ροή ψ (σταθερά k)','V·s/rad',1,{hint:'Αντι-ΗΕΔ E = ψ·ω, ροπή τ_e = ψ·i_a.'}),
    num('J','Ροπή αδράνειας J','kg·m²',0.02),num('bm','Τριβή b','N·m·s',0.002,{zero:true}),
    sel('load','Ροπή φορτίου',[['sched','Τιμή ή πρόγραμμα'],['sig','Από σήμα (ακροδέκτης tl)']],'sched'),
    txt('TL','τ_L(t)','0',{hint:'Σταθερή τιμή ή «t:τιμή» σε N·m, π.χ. 0:0, 0.25:10.',show:p=>p.load!=='sig'}),
    num('w0','Αρχική ταχύτητα','rad/s',0,{signed:true,zero:true}),num('ia0','Αρχικό ρεύμα','A',0,{signed:true,zero:true})],
   value:p=>p.psi,unit:'V·s',
   draw:p=>'<path d="M0,-40 V-18 M0,18 V40"/><circle r="18"/>'+tx('M',0,1,'btxt')+'<path class="thin" d="M-6,7 H6 M-6,10 H6"/>'+sl('M18,-10 H40 M18,10 H40')+(p.load==='sig'?sl('M-40,0 H-18'):'')},
  // ---------------------------------------------------------------- signal blocks (3.0)
  VM:{name:'Βολτόμετρο',prefix:'VM',group:'Σήματα',pins:{p:[0,-30],n:[0,30]},spins:{y:O(30,0)},box:[-15,-15,30,30],params:[],value:()=>null,blk:true,unit:'V',
   draw:()=>'<path d="M0,-30 V-14 M0,14 V30"/><circle r="14"/>'+tx('V')+sl('M14,0 H30')},
  AM:{name:'Αμπερόμετρο (σε σειρά)',prefix:'AM',group:'Σήματα',pins:{a:[-30,0],b:[30,0]},spins:{y:O(0,-30)},box:[-13,-13,26,26],params:[],value:()=>null,blk:true,unit:'A',
   draw:()=>'<path d="M-30,0 H-12 M12,0 H30"/><circle r="12"/>'+tx('A')+sl('M0,-12 V-30')+'<path class="thin" d="M17,5 H25 M22,2 L25,5 L22,8"/>'},
  // probes (3.7): clip onto a wire. VP: node voltage to ground through one pin; IP: a current clamp, a 0 V meter in series that keeps the wire's look
  VP:{name:'Probe τάσης (ως προς τη γη)',prefix:'VP',group:'Σήματα',pins:{p:[0,20]},spins:{y:O(30,-10)},box:[-11,-21,22,30],params:[],value:()=>null,blk:true,unit:'V',
   draw:()=>'<path d="M0,20 V-1"/><path class="probe" d="M0,-1 L-9,-10 L0,-19 L9,-10 Z"/>'+tx('V',0,-6,'bsm')+sl('M9,-10 H30')},
  IP:{name:'Probe ρεύματος (τσιμπίδα)',prefix:'IP',group:'Σήματα',pins:{a:[-20,0],b:[20,0]},spins:{y:O(0,-30)},box:[-12,-14,24,26],params:[],value:()=>null,blk:true,unit:'A',
   draw:()=>'<path d="M-20,0 H20"/><path class="probe" d="M-4,-10 A10,10 0 1,0 4,-10"/><path class="thin" d="M-6,15 H5 M2,12 L5,15 L2,18"/>'+sl('M0,-10 V-30')},
  MEAS:{name:'Μέτρηση στοιχείου',prefix:'M',group:'Σήματα',pins:{},spins:{y:O(40,0)},box:[-30,-13,60,26],blk:true,
   params:[ref('src','Στοιχείο',['L','R','C','VDC','CPL','SW','D','SCR','XFMR','IDC','VAC','VAC3']),sel('qty','Μέγεθος',[['I','Ρεύμα'],['V','Τάση']],'I')],value:()=>null,
   draw:p=>sb(60,26)+tx(`${p.qty==='V'?'v':'i'}(${xe(p.src||'?')})`)+sl('M30,0 H40')},
  CONST:{name:'Σταθερά / πρόγραμμα',prefix:'K',group:'Σήματα',pins:{},spins:{y:O(30,0)},box:[-20,-12,40,24],blk:true,
   params:[txt('v','Τιμή ή πρόγραμμα','1',{hint:'Σταθερή τιμή ή «t:τιμή», π.χ. 0:5, 0.002:10. Αλλάζει και εν κινήσει από τις ζωντανές παραμέτρους.'})],value:()=>null,
   draw:p=>sb(40,24)+tx(String(p.v).includes(':')?'c(t)':xe(String(p.v).slice(0,6)))+sl('M20,0 H30')},
  GAIN:{name:'Κέρδος',prefix:'GN',group:'Σήματα',pins:{},spins:{u:I(-30,0),y:O(30,0)},box:[-20,-15,40,30],blk:true,params:[num('K','Κέρδος K','',1,{signed:true,zero:true})],value:()=>null,
   draw:()=>'<path class="block sblk" d="M-20,-15 L20,0 L-20,15 Z"/>'+tx('K',-7)+sl('M-30,0 H-20 M20,0 H30')},
  SUM:{name:'Άθροισμα',prefix:'SUM',group:'Σήματα',pins:{},spins:p=>{const o={a:I(-30,-10),b:I(-30,10),y:O(30,0)};if(String(p.signs||'').length>=3)o.c=I(0,30);return o;},box:[-15,-15,30,30],blk:true,
   params:[txt('signs','Πρόσημα εισόδων (a, b, c)','+-',{hint:'π.χ. «+-» για a − b, «++-» για a + b − c (τρίτη είσοδος από κάτω).'})],value:()=>null,
   draw:p=>{const g=String(p.signs||'+-');return '<circle class="block sblk" r="15"/>'+tx('Σ',0,5)+tx(g[0]==='-'?'−':'+',-20,-14,'bsm')+tx(g[1]==='-'?'−':'+',-20,22,'bsm')+(g.length>=3?tx(g[2]==='-'?'−':'+',8,26,'bsm')+sl('M0,15 V30'):'')+sl('M-30,-10 H-11 M-30,10 H-11 M15,0 H30');}},
  MUL:{name:'Γινόμενο',prefix:'MUL',group:'Σήματα',pins:{},spins:{a:I(-30,-10),b:I(-30,10),y:O(30,0)},box:[-20,-20,40,40],blk:true,params:[],value:()=>null,
   draw:()=>sb(40,40)+tx('×',0,6,'btxt big')+sl('M-30,-10 H-20 M-30,10 H-20 M20,0 H30')},
  DIV:{name:'Διαίρεση a/b',prefix:'DIV',group:'Σήματα',pins:{},spins:{a:I(-30,-10),b:I(-30,10),y:O(30,0)},box:[-20,-20,40,40],blk:true,
   params:[num('eps','Προστασία |b| <','',1e-9,{zero:true,hint:'Όταν |b| είναι μικρότερο, η έξοδος κρατά την προηγούμενη τιμή.'})],value:()=>null,
   draw:()=>sb(40,40)+tx('÷',0,6,'btxt big')+tx('a',-13,-7,'bsm')+tx('b',-13,14,'bsm')+sl('M-30,-10 H-20 M-30,10 H-20 M20,0 H30')},
  SAT:{name:'Κορεσμός',prefix:'SAT',group:'Σήματα',pins:{},spins:{u:I(-30,0),y:O(30,0)},box:[-20,-15,40,30],blk:true,
   params:[num('lo','Κάτω όριο','',0,{signed:true,zero:true}),num('hi','Άνω όριο','',1,{signed:true,zero:true})],value:()=>null,
   draw:()=>sb(40,30)+'<path class="thin" d="M-13,8 H-5 L5,-8 H13"/>'+sl('M-30,0 H-20 M20,0 H30')},
  CMP:{name:'Συγκριτής',prefix:'CMP',group:'Σήματα',pins:{},spins:{p:I(-30,-10),n:I(-30,10),y:O(30,0)},box:[-20,-20,40,40],blk:true,
   params:[num('hys','Υστέρηση','',0,{zero:true,hint:'Έξοδος 1 όταν (+) − (−) > h/2, 0 όταν < −h/2. Η στιγμή της διέλευσης εντοπίζεται μέσα στο βήμα του λύτη.'})],value:()=>null,
   draw:()=>'<path class="block sblk" d="M-20,-20 L20,0 L-20,20 Z"/>'+tx('+',-13,-6,'bsm')+tx('−',-13,15,'bsm')+sl('M-30,-10 H-20 M-30,10 H-20 M20,0 H30')},
  LOGIC:{name:'Λογική πύλη',prefix:'LG',group:'Σήματα',pins:{},spins:p=>p.op==='not'?{a:I(-30,0),y:O(30,0)}:{a:I(-30,-10),b:I(-30,10),y:O(30,0)},box:[-20,-20,40,40],blk:true,
   params:[sel('op','Πράξη',[['and','AND'],['or','OR'],['xor','XOR'],['not','NOT'],['nand','NAND'],['nor','NOR']],'or',{hint:'Είσοδος ≥ 0,5 = 1. Έξοδος 0 ή 1.'})],value:()=>null,
   draw:p=>sb(40,40)+tx({and:'&',or:'≥1',xor:'=1',not:'1',nand:'&',nor:'≥1'}[p.op]||'≥1',0,5)+(['not','nand','nor'].includes(p.op)?'<circle class="thin" cx="23" cy="0" r="3"/>':'')+sl(p.op==='not'?'M-30,0 H-20 M26,0 H30':'M-30,-10 H-20 M-30,10 H-20 M'+(['nand','nor'].includes(p.op)?26:20)+',0 H30')},
  PIB:{name:'PI διακριτός',prefix:'PI',group:'Σήματα',pins:{},spins:p=>p.aw==='track'?{u:I(-30,0),tr:I(0,30),y:O(30,0)}:{u:I(-30,0),y:O(30,0)},box:[-20,-15,40,30],blk:true,
   params:[num('Kp','K_p','',1e-3,{zero:true,signed:true}),num('Ki','K_i','1/s',1,{zero:true,signed:true}),CLOCK(),TRIG,
    num('y0','Σταθερός όρος (feedforward)','',0,{signed:true,zero:true}),
    sel('aw','Anti-windup',[['clamp','Όρια στην έξοδο του PI'],['track','Back-calculation: είσοδος tr = u_sat − u']],'clamp',{hint:'Back-calculation: dx_i/dt = K_i·(e + tr/K_p), με tr = κορεσμένη έξοδος − έξοδος πριν από τον κορεσμό (σταθερά παρακολούθησης T_t = K_p/K_i). Χρήσιμο όταν ο κορεσμός γίνεται πιο κάτω, μετά από feedforward ή ενεργή απόσβεση. Η είσοδος tr διαβάζεται μετά τον υπολογισμό, άρα δεν κάνει αλγεβρικό βρόχο.'}),
    num('ymin','Κάτω όριο εξόδου','',0,{signed:true,zero:true,show:p=>p.aw!=='track'}),num('ymax','Άνω όριο εξόδου','',1,{signed:true,zero:true,show:p=>p.aw!=='track'})],value:()=>null,
   draw:p=>sb(40,30)+tx('PI',0,5)+sl('M-30,0 H-20 M20,0 H30')+(p.aw==='track'?sl('M0,15 V30'):'')},
  UD:{name:'Καθυστέρηση z⁻¹',prefix:'Z',group:'Σήματα',pins:{},spins:{u:I(-30,0),y:O(30,0)},box:[-20,-15,40,30],blk:true,
   params:[CLOCK(),TRIG,num('y0','Αρχική έξοδος','',0,{signed:true,zero:true})],value:()=>null,
   draw:()=>sb(40,30)+tx('z⁻¹',0,5)+sl('M-30,0 H-20 M20,0 H30')},
  SR:{name:'SR latch',prefix:'SR',group:'Σήματα',pins:{},spins:{s:I(-30,-10),r:I(-30,10),q:O(30,-10),nq:O(30,10)},box:[-20,-20,40,40],blk:true,
   params:[sel('q0','Αρχική κατάσταση',[['0','Q = 0'],['1','Q = 1']],'0')],value:()=>null,
   draw:()=>sb(40,40)+tx('S',-12,-6,'bsm')+tx('R',-12,14,'bsm')+tx('Q',12,-6,'bsm')+tx('Q̄',12,14,'bsm')+'<path class="thin" d="M-20,-15 L-15,-10 L-20,-5"/>'+sl('M-30,-10 H-20 M-30,10 H-20 M20,-10 H30 M20,10 H30')},
  CLK:{name:'Ρολόι (τετραγωνικό)',prefix:'CLK',group:'Σήματα',pins:{},spins:{y:O(30,0)},box:[-20,-15,40,30],blk:true,
   params:[num('f','Συχνότητα','Hz',100e3),num('duty','Ποσοστό σε 1','',0.5,{zero:true}),num('phase','Φάση','°',0,{signed:true,zero:true})],value:p=>p.f,unit:'Hz',
   draw:()=>sb(40,30)+'<path class="thin" d="M-14,7 V-7 H-6 V7 H2 V-7 H10 V7 H14"/>'+sl('M20,0 H30')},
  RAMP:{name:'Φέρον / ράμπα',prefix:'RMP',group:'Σήματα',pins:{},spins:{y:O(30,0)},box:[-20,-15,40,30],blk:true,
   params:[num('f','Συχνότητα','Hz',100e3),sel('shape','Μορφή',[['saw','Πριονωτή (από κάτω προς τα πάνω)'],['tri','Τριγωνική (μέγιστο στην αρχή)']],'saw'),
    num('lo','Ελάχιστη τιμή','',0,{signed:true,zero:true}),num('hi','Μέγιστη τιμή','',1,{signed:true,zero:true}),num('phase','Φάση','°',0,{signed:true,zero:true})],value:p=>p.f,unit:'Hz',
   draw:p=>sb(40,30)+(p.shape==='tri'?'<path class="thin" d="M-14,-7 L-7,7 L0,-7 L7,7 L14,-7"/>':'<path class="thin" d="M-14,7 L-2,-7 V7 L10,-7 V7"/>')+sl('M20,0 H30')},
  // ---------------------------------------------------------------- continuous blocks and frame transformations (3.1)
  EXPR:{name:'Έκφραση',prefix:'EX',group:'Κώδικας',pins:{},spins:p=>codeIO(Ex.names(p.ins),['y']),box:p=>{const h=codeH(Ex.names(p.ins),['y']);return [-30,-h,60,2*h];},blk:true,
   params:[txt('expr','y =','u1*u2',{hint:'Πράξεις + − * / ^ %, συγκρίσεις (δίνουν 1 ή 0), && || !, c ? a : b, και sin cos tan asin acos atan atan2 sinh cosh tanh exp log log10 sqrt abs min max pow floor ceil round sign hypot clamp mod, και lut(x, x1, y1, x2, y2, …) για πίνακα τιμών. Ονόματα: οι είσοδοι, οι σταθερές, t, pi, e.'}),
    txt('ins','Είσοδοι','u1, u2',{hint:'Ονόματα χωρισμένα με κόμμα, έως 6.'}),txt('pars','Σταθερές','',{hint:'π.χ. a = 2, b = 0.5'})],value:()=>null,
   draw:p=>codeDraw(Ex.names(p.ins),['y'],'f(u)')},
  PY:{name:'Μπλοκ Python',prefix:'PY',group:'Κώδικας',pins:{},spins:p=>codeIO(pyIns(p),pyOuts(p)),box:p=>{const h=codeH(pyIns(p),pyOuts(p));return [-30,-h,60,2*h];},blk:true,
   params:[{k:'code',label:'Κώδικας Python',type:'code',def:PY_DEFAULT,hint:'Ορίζει step(t, u, s, p) και προαιρετικά init(p). Επιστρέφει dict {έξοδος: τιμή}, λίστα ή αριθμό. Τρέχει στα δείγματα του ρολογιού και η έξοδος μένει σταθερή ως το επόμενο (όπως σε μικροελεγκτή). Διαθέσιμο το math.'},
    txt('ins','Είσοδοι','e',{hint:'Ονόματα χωρισμένα με κόμμα, έως 6.'}),txt('outs','Έξοδοι','y',{hint:'Ονόματα χωρισμένα με κόμμα, έως 6.'}),
    txt('pars','Παράμετροι p','Kp = 0.1, Ki = 100',{hint:'Αριθμοί που φτάνουν στον κώδικα ως p["όνομα"].'}),CLOCK(),TRIG,num('y0','Αρχική τιμή εξόδων','',0,{signed:true,zero:true})],value:()=>null,
   draw:p=>codeDraw(pyIns(p),pyOuts(p),'Py')},
  IM:{name:'Μηχανή επαγωγής (ανάστροφο-Γ)',prefix:'M',group:'Μηχανές',pins:{a:[-40,-20],b:[-40,0],c:[-40,20]},box:[-25,-25,50,50],lbl:'above',
   spins:p=>p.load==='sig'?{w:O(40,-20),te:O(40,-10),psi:O(40,0),thf:O(40,10),thr:O(40,20),tl:I(0,40)}:{w:O(40,-20),te:O(40,-10),psi:O(40,0),thf:O(40,10),thr:O(40,20)},
   params:[num('Rs','Αντίσταση στάτη R_s','Ω',3),num('RR','Αντίσταση δρομέα R_R','Ω',2,{hint:'Ανάστροφο-Γ: R_R, L_M και L_σ αντί για R_r, L_m, L_ls, L_lr (γ = L_m/L_r).'}),num('Lsig','Αυτεπαγωγή σκέδασης L_σ','H',0.025),
    num('LM','Αυτεπαγωγή μαγνήτισης L_M','H',0.3),num('pp','Ζεύγη πόλων p','',2),num('J','Ροπή αδράνειας J','kg·m²',0.02),num('bm','Τριβή b','N·m·s',0.002,{zero:true}),
    sel('load','Ροπή φορτίου',[['sched','Τιμή ή πρόγραμμα'],['sig','Από σήμα (ακροδέκτης tl)']],'sched'),txt('TL','τ_L(t)','0',{hint:'Σταθερή τιμή ή «t:τιμή» σε N·m.',show:p=>p.load!=='sig'}),
    num('w0','Αρχική μηχανική ταχύτητα','rad/s',0,{signed:true,zero:true})],
   value:p=>p.pp,unit:'',
   draw:p=>'<path d="M-40,-20 H-25 M-40,0 H-25 M-40,20 H-25"/><circle r="22"/>'+tx('IM',0,4,'btxt')+sl('M22,-20 H40 M25,-10 H40 M25,0 H40 M25,10 H40 M22,20 H40')+(p.load==='sig'?sl('M0,22 V40'):'')
    +tx('ω',30,-23,'pinl')+tx('τ',30,-13,'pinl')+tx('ψ',30,-3,'pinl')+tx('θf',30,7,'pinl')+tx('θr',30,17,'pinl')},
  // synchronous machine (3.5): d, q inductances and magnet flux; ψ_m = 0 is the synchronous reluctance machine (SynRM)
  SM:{name:'Σύγχρονη μηχανή (SynRM / PMSM)',prefix:'M',group:'Μηχανές',pins:{a:[-40,-20],b:[-40,0],c:[-40,20]},box:[-25,-25,50,50],lbl:'above',
   spins:p=>{const o={w:O(40,-20),te:O(40,-10),th:O(40,0),id:O(40,10),iq:O(40,20)};if(p.load==='sig')o.tl=I(0,40);return o;},
   params:[num('Rs','Αντίσταση στάτη R_s','Ω',2),num('Ld','Αυτεπαγωγή άξονα d L_d','H',0.15,{hint:'SynRM: d είναι ο άξονας της ελάχιστης μαγνητικής αντίστασης (L_d > L_q). PMSM: d είναι ο άξονας του μαγνήτη (στην IPMSM L_q > L_d, στην SPMSM L_d = L_q).'}),
    num('Lq','Αυτεπαγωγή άξονα q L_q','H',0.03),
    sel('sat','Κορεσμός στον άξονα d',[['none','Όχι: ψ_d = L_d·i_d + ψ_m'],['d','Ναι: ψ_d(i_d) με γόνατο']],'none',{hint:'ψ_d = L_dsat·i_d + ψ_k·(1 − e^(−(L_d − L_dsat)·|i_d|/ψ_k))·sign(i_d) + ψ_m: κλίση L_d γύρω από το 0 και L_dsat σε κορεσμό. Ο άξονας q μένει γραμμικός.'}),
    num('Ldsat','L_d σε κορεσμό (κλίση)','H',0.04,{show:p=>p.sat==='d'}),num('psikd','ψ_k: γόνατο κορεσμού d','V·s',0.5,{show:p=>p.sat==='d'}),
    num('psim','Ροή μαγνήτη ψ_m','V·s',0,{zero:true,hint:'0 = μηχανή μαγνητικής αντίστασης (SynRM). Ροπή τ_e = (3/2)·p·(ψ_m·i_q + (L_d − L_q)·i_d·i_q).'}),
    num('pp','Ζεύγη πόλων p','',2),num('J','Ροπή αδράνειας J','kg·m²',0.02),num('bm','Τριβή b','N·m·s',0.002,{zero:true}),
    sel('load','Ροπή φορτίου',[['sched','Τιμή ή πρόγραμμα'],['sig','Από σήμα (ακροδέκτης tl)']],'sched'),txt('TL','τ_L(t)','0',{hint:'Σταθερή τιμή ή «t:τιμή» σε N·m.',show:p=>p.load!=='sig'}),
    num('w0','Αρχική μηχανική ταχύτητα','rad/s',0,{signed:true,zero:true}),num('th0','Αρχική γωνία δρομέα θ (ηλεκτρική, ως προς τη φάση a)','°',0,{signed:true,zero:true})],
   value:p=>p.pp,unit:'',
   draw:p=>'<path d="M-40,-20 H-25 M-40,0 H-25 M-40,20 H-25"/><circle r="22"/>'+tx(+p.psim>0?'PM':'SynRM',0,4,+p.psim>0?'btxt':'bsm')+sl('M22,-20 H40 M25,-10 H40 M25,0 H40 M25,10 H40 M22,20 H40')+(p.load==='sig'?sl('M0,22 V40'):'')
    +tx('ω',30,-23,'pinl')+tx('τ',30,-13,'pinl')+tx('θ',30,-3,'pinl')+tx('d',30,7,'pinl')+tx('q',30,17,'pinl')},
  // switched reluctance machine (3.6): one winding per phase, pins on top (phase k: a_k, b_k 20 apart, phases 160 apart, under the columns
  // of an asymmetric bridge); ψ(θ, i) from parameters or a table, torque from the co-energy
  SRM:{name:'Μηχανή μαγνητικής αντίστασης με διακόπτες (SRM)',prefix:'M',group:'Μηχανές',pins:p=>srmPins(srmGeo(p)[0]),box:p=>{const N=srmGeo(p)[0];return [-80*(N-1)-40,-30,160*(N-1)+80,60];},lbl:'left',
   spins:p=>srmSpins(p),
   params:[sel('geo','Δομή N_s/N_r',[['8/6','8/6: 4 φάσεις, N_r = 6'],['6/4','6/4: 3 φάσεις, N_r = 4'],['12/8','12/8: 3 φάσεις, N_r = 8']],'8/6',{hint:'Γωνία φάσης θ_e = N_r·θ − (k − 1)·2π/N: 0 όταν ο πόλος του δρομέα είναι μη ευθυγραμμισμένος με τη φάση k, π όταν είναι ευθυγραμμισμένος.'}),
    num('Rs','Αντίσταση φάσης R','Ω',0.5),
    sel('mag','Μαγνήτιση ψ(θ, i)',[['model','Από L_u, L_a, L_sat, ψ_k'],['table','Από πίνακα (μετρήσεις ή FEM)']],'model',{hint:'Ροπή από τη συνενέργεια: τ = ∂/∂θ ∫₀ⁱ ψ(θ, i′) di′ για κάθε φάση. Χωρίς αμοιβαία σύζευξη ανάμεσα στις φάσεις.'}),
    num('Lu','L_u: μη ευθυγραμμισμένη θέση','H',0.008,{show:p=>p.mag!=='table'}),num('La','L_a: ευθυγραμμισμένη, χωρίς κορεσμό','H',0.06,{show:p=>p.mag!=='table'}),
    num('Lsat','L_sat: ευθυγραμμισμένη, σε κορεσμό (κλίση)','H',0.008,{show:p=>p.mag!=='table'}),num('psik','ψ_k: γόνατο κορεσμού','V·s',0.35,{show:p=>p.mag!=='table',hint:'Ευθυγραμμισμένη: ψ_a(i) = L_sat·i + ψ_k·(1 − e^(−(L_a − L_sat)·i/ψ_k)). Ενδιάμεσα: ψ = L_u·i + (ψ_a(i) − L_u·i)·(1 − cos θ_e)/2.'}),
    num('Imax','Πλέγμα ρεύματος ως','A',40,{show:p=>p.mag!=='table'}),
    txt('tbl','Πίνακας ψ (V·s)',SRM_TBL,{show:p=>p.mag==='table',hint:'Πρώτη γραμμή: ρεύματα (A) από 0. Μετά μία γραμμή ανά γωνία: «θ_e: ψ, ψ, …» σε ηλεκτρικές μοίρες, 0 = μη ευθυγραμμισμένη, 180 = ευθυγραμμισμένη. Γραμμές με «;». Γίνεται προσαρμογή σειράς συνημιτόνων στη γωνία και γραμμική παρεμβολή στο ρεύμα.'}),
    num('J','Ροπή αδράνειας J','kg·m²',0.01),num('bm','Τριβή b','N·m·s',0.001,{zero:true}),
    sel('load','Ροπή φορτίου',[['sched','Τιμή ή πρόγραμμα'],['sig','Από σήμα (ακροδέκτης tl)']],'sched'),txt('TL','τ_L(t)','0',{hint:'Σταθερή τιμή ή «t:τιμή» σε N·m.',show:p=>p.load!=='sig'}),
    num('w0','Αρχική μηχανική ταχύτητα','rad/s',0,{signed:true,zero:true}),num('th0','Αρχική γωνία θ_e της φάσης 1','°',30,{signed:true,zero:true})],
   value:p=>p.geo,unit:'',
   draw:p=>{const [N]=srmGeo(p),W=80*(N-1)+40;let s=`<rect x="${-W}" y="-26" width="${2*W}" height="52" rx="8"/>`;
    for(let k=0;k<N;k++){const X=-80*(N-1)+160*k;s+=`<path d="M${X-10},-30 V-16 a5,5 0 0,0 10,0 a5,5 0 0,0 10,0 V-30"/>`+tx(String(k+1),X,8,'pinl');}
    const sp=srmSpins(p);return s+tx('SRM '+(p.geo||'8/6'),0,-6,'bsm')+sl(Object.values(sp).map(q=>`M${q.at[0]},26 V40`).join(' '))
     +Object.entries(sp).map(([k,q])=>tx({w:'ω',te:'τ',th:'θ',tl:'τ_L'}[k]||'i'+k.slice(1),q.at[0],20,'pinl')).join('');}},
  MOD3:{name:'Διαμορφωτής τριφασικός',prefix:'MD',group:'Έλεγχος',pins:{},spins:{va:I(-30,-20),vb:I(-30,-10),vc:I(-30,0),vdc:I(-30,20),da:O(30,-10),db:O(30,0),dc:O(30,10)},box:[-20,-25,40,50],blk:true,
   params:[sel('mode','Διαμόρφωση',[['spwm','SPWM: d = ½ + v/V_dc'],['svpwm','SVPWM: έγχυση μηδενικής ακολουθίας −(max + min)/2'],['square','Τετραγωνική (six-step): d = 1 όταν v > 0']],'svpwm',{hint:'Τα d πάνε στα PWM με «D από σήμα» και τριγωνικό φέρον, ένα ανά σκέλος. Γραμμική περιοχή: πλάτος φάσης ≤ V_dc/2 (SPWM), ≤ V_dc/√3 (SVPWM).'})],value:()=>null,
   draw:p=>sb(40,50)+tx(p.mode==='square'?'6-step':p.mode==='spwm'?'SPWM':'SVM',0,4,'bsm')+sl('M-30,-20 H-20 M-30,-10 H-20 M-30,0 H-20 M-30,20 H-20 M20,-10 H30 M20,0 H30 M20,10 H30')},
  FEST:{name:'Εκτιμητής ροής δρομέα',prefix:'FE',group:'Έλεγχος',pins:{},spins:{al:I(-30,-10),be:I(-30,0),wr:I(-30,10),th:O(30,-10),psi:O(30,0),w1:O(30,10)},box:[-20,-20,40,40],blk:true,
   params:[sel('mode','Μοντέλο',[['cm','Μοντέλο ρεύματος (σταθερό πλαίσιο στάτη)']],'cm',{hint:'dψ̂/dt = R̂_R·i_s − (R̂_R/L̂_M − jω_r)ψ̂. Είσοδοι: i_α, i_β (Clarke) και ω_r ηλεκτρική (p·ω). Έξοδοι: γωνία θ̂, μέτρο ψ̂, ω̂₁ = ω_r + R̂_R·i_q/ψ̂.'}),
    num('RR','R̂_R','Ω',2),num('LM','L̂_M','H',0.3),num('psi0','Αρχική ροή (άξονας α)','V·s',0,{zero:true})],value:()=>null,
   draw:()=>sb(40,40)+tx('ψ̂',0,4,'btxt')+sl('M-30,-10 H-20 M-30,0 H-20 M-30,10 H-20 M20,-10 H30 M20,0 H30 M20,10 H30')},
  INT:{name:'Ολοκληρωτής',prefix:'INT',group:'Σήματα',pins:{},spins:{u:I(-30,0),y:O(30,0)},box:[-20,-15,40,30],blk:true,
   params:[num('y0','Αρχική τιμή','',0,{signed:true,zero:true}),num('lo','Κάτω όριο','',-1e9,{signed:true}),num('hi','Άνω όριο','',1e9,{signed:true}),
    sel('wrap','Αναδίπλωση',[['none','Καμία'],['2pi','Γωνία: 0 … 2π']],'none',{hint:'Με «Γωνία» η έξοδος μένει στο [0, 2π), π.χ. θ = ∫ω dt.'})],value:()=>null,
   draw:()=>sb(40,30)+tx('∫',0,6,'btxt big')+sl('M-30,0 H-20 M20,0 H30')},
  LPF:{name:'Βαθυπερατό 1ης τάξης',prefix:'LPF',group:'Σήματα',pins:{},spins:{u:I(-30,0),y:O(30,0)},box:[-20,-15,40,30],blk:true,
   params:[num('fc','Συχνότητα αποκοπής','Hz',1000),num('y0','Αρχική τιμή','',0,{signed:true,zero:true})],value:p=>p.fc,unit:'Hz',
   draw:()=>sb(40,30)+'<path class="thin" d="M-13,-5 H0 Q6,-5 12,8"/>'+sl('M-30,0 H-20 M20,0 H30')},
  CLARKE:{name:'Clarke abc → αβ',prefix:'CL',group:'Σήματα',pins:{},spins:{a:I(-30,-10),b:I(-30,0),c:I(-30,10),al:O(30,-10),be:O(30,10)},box:[-20,-20,40,40],blk:true,
   params:[sel('inv','Κλίμακα',[['amp','Διατήρηση πλάτους (α = a)'],['pow','Διατήρηση ισχύος']],'amp')],value:()=>null,
   draw:()=>sb(40,40)+tx('abc',-6,-8,'bsm')+tx('αβ',8,14,'bsm')+'<path class="thin" d="M-12,12 L12,-12"/>'+sl('M-30,-10 H-20 M-30,0 H-20 M-30,10 H-20 M20,-10 H30 M20,10 H30')},
  ICLARKE:{name:'Clarke αβ → abc',prefix:'ICL',group:'Σήματα',pins:{},spins:{al:I(-30,-10),be:I(-30,10),a:O(30,-10),b:O(30,0),c:O(30,10)},box:[-20,-20,40,40],blk:true,
   params:[sel('inv','Κλίμακα',[['amp','Διατήρηση πλάτους'],['pow','Διατήρηση ισχύος']],'amp')],value:()=>null,
   draw:()=>sb(40,40)+tx('αβ',-7,-8,'bsm')+tx('abc',6,14,'bsm')+'<path class="thin" d="M-12,12 L12,-12"/>'+sl('M-30,-10 H-20 M-30,10 H-20 M20,-10 H30 M20,0 H30 M20,10 H30')},
  PARK:{name:'Park αβ → dq',prefix:'PK',group:'Σήματα',pins:{},spins:{al:I(-30,-10),be:I(-30,0),th:I(-30,10),d:O(30,-10),q:O(30,10)},box:[-20,-20,40,40],blk:true,params:[],value:()=>null,
   draw:()=>sb(40,40)+tx('αβ',-7,-8,'bsm')+tx('dq',8,14,'bsm')+tx('θ',-13,13,'bsm')+'<path class="thin" d="M-12,12 L12,-12"/>'+sl('M-30,-10 H-20 M-30,0 H-20 M-30,10 H-20 M20,-10 H30 M20,10 H30')},
  IPARK:{name:'Park dq → αβ',prefix:'IPK',group:'Σήματα',pins:{},spins:{d:I(-30,-10),q:I(-30,0),th:I(-30,10),al:O(30,-10),be:O(30,10)},box:[-20,-20,40,40],blk:true,params:[],value:()=>null,
   draw:()=>sb(40,40)+tx('dq',-7,-8,'bsm')+tx('αβ',8,14,'bsm')+tx('θ',-13,13,'bsm')+'<path class="thin" d="M-12,12 L12,-12"/>'+sl('M-30,-10 H-20 M-30,0 H-20 M-30,10 H-20 M20,-10 H30 M20,10 H30')},
  PLL:{name:'PLL (τριφασικό)',prefix:'PLL',group:'Σήματα',pins:{},spins:{a:I(-30,-10),b:I(-30,0),c:I(-30,10),th:O(30,-10),w:O(30,0),amp:O(30,10)},box:[-20,-20,40,40],blk:true,
   params:[num('f0','Ονομαστική συχνότητα','Hz',50),num('bw','Εύρος ζώνης','Hz',20,{hint:'ω_n = 2π·εύρος, ζ = 0,707: K_p = 2ζω_n, K_i = ω_n². Το σφάλμα είναι κανονικοποιημένο με το πλάτος, άρα τα κέρδη δεν εξαρτώνται από την τάση. Το θ φέρνει τον άξονα d πάνω στο διάνυσμα της τάσης: με v_a = V̂·sin(ωt + φ), όπως οι πηγές, θ = ωt + φ − 90°, v_d = V̂, v_q = 0.'}),
    num('th0','Αρχική γωνία','°',0,{signed:true,zero:true})],value:p=>p.f0,unit:'Hz',
   draw:()=>sb(40,40)+tx('PLL',0,4,'bsm')+tx('θ',12,-7,'bsm')+tx('ω',12,3,'bsm')+sl('M-30,-10 H-20 M-30,0 H-20 M-30,10 H-20 M20,-10 H30 M20,0 H30 M20,10 H30')},
  // Goto / From: signals joined by name, without a wire (like PLECS / Simulink tags)
  TAGO:{name:'Ετικέτα: προς (Goto)',prefix:'TG',group:'Σήματα',pins:{},spins:{u:I(-30,0)},box:[-20,-10,44,20],
   params:[txt('name','Όνομα σήματος','g',{hint:'Ό,τι μπαίνει εδώ βγαίνει από κάθε ετικέτα «από» με το ίδιο όνομα, σε όλο το κύκλωμα.'})],value:()=>null,
   draw:p=>'<path class="block sblk" d="M-20,-10 H12 L22,0 L12,10 H-20 Z"/>'+tx(xe(String(p.name||'').slice(0,7)),0,4,'bsm')+sl('M-30,0 H-20')},
  TAGI:{name:'Ετικέτα: από (From)',prefix:'TF',group:'Σήματα',pins:{},spins:{y:O(30,0)},box:[-22,-10,44,20],
   params:[txt('name','Όνομα σήματος','g',{hint:'Βγάζει το σήμα της ετικέτας «προς» με το ίδιο όνομα.'})],value:()=>null,
   draw:p=>'<path class="block sblk" d="M-22,-10 L-12,0 L-22,10 H20 V-10 Z"/>'+tx(xe(String(p.name||'').slice(0,7)),1,4,'bsm')+sl('M20,0 H30')},
  DISP:{name:'Ένδειξη',prefix:'DSP',group:'Σήματα',pins:{},spins:{u:I(-40,0)},box:[-30,-13,60,26],blk:true,params:[num('dig','Σημαντικά ψηφία','',4)],value:()=>null,
   draw:()=>'<rect class="block sblk" x="-30" y="-13" width="60" height="26" rx="3"/><rect class="thin" x="-24" y="-8" width="48" height="16" rx="2"/>'+tx('—',0,4,'bsm')+sl('M-40,0 H-30')},
 };
 const GROUPS=['Πηγές','Παθητικά','Ημιαγωγοί','Μαγνητικά','Μηχανές','Φορτία','Έλεγχος','Σήματα','Κώδικας','Βασικά'];
 function defaults(type){const o={};for(const p of PARTS[type].params)o[p.k]=p.def;return o;}
 // electrical + signal pins of one placed part; the electrical pins of a multiport depend on its parameters (3.5)
 function elPins(c){const d=PARTS[c.type];if(!d)return {};return typeof d.pins==='function'?d.pins({...defaults(c.type),...(c.params||{})}):d.pins;}
 function sigPins(c){const d=PARTS[c.type];if(!d||!d.spins)return {};return typeof d.spins==='function'?d.spins({...defaults(c.type),...(c.params||{})}):d.spins;}
 function pinsOf(c){const d=PARTS[c.type];if(!d)return {};const o={...elPins(c)};if(!d.spins)return o;for(const [k,v] of Object.entries(sigPins(c)))o[k]=v.at;return o;}
 // ---------------------------------------------------------------- multiports (3.5)
 // "a, b; c, d": rows with ';', entries with ',' or spaces (engineering prefixes allowed); null if not a square matrix of numbers
 function parseMat(s){s=String(s??'').trim();if(!s)return null;const rows=s.split(/[;\n]+/).map(r=>r.trim()).filter(Boolean).map(r=>r.split(/[,\s]+/).filter(Boolean).map(parseEng));
  const N=rows.length;if(!N||rows.some(r=>r.length!==N||r.some(v=>!Number.isFinite(v))))return null;return rows;}
 function nPorts(p){const m=parseMat(p.Lmat??p.mat);if(m)return Math.min(8,m.length);return Math.max(2,Math.min(4,Math.round(+p.nw)||2));}
 function portY(N,k){return -10*(N-1)+20*k;}
 function portPins(N){const o={};for(let k=0;k<N;k++){o['a'+(k+1)]=[-30,portY(N,k)];o['b'+(k+1)]=[30,portY(N,k)];}return o;}
 function portBox(N){return [-24,portY(N,0)-10,48,20*N];}
 // Cholesky: true if the symmetric matrix m (rows) is positive definite
 function posDef(m){const N=m.length,L=m.map(()=>new Array(N).fill(0));for(let i=0;i<N;i++)for(let j=0;j<=i;j++){let s=m[i][j];for(let k=0;k<j;k++)s-=L[i][k]*L[j][k];
   if(i===j){if(!(s>0))return false;L[i][i]=Math.sqrt(s);}else L[i][j]=s/L[j][j];}return true;}
 function symmetric(m){const s=Math.max(...m.flat().map(Math.abs))||1;return m.every((r,i)=>r.every((v,j)=>Math.abs(v-m[j][i])<=1e-9*s));}
 function matInv(m){const N=m.length,a=m.map((r,i)=>[...r,...m.map((_,j)=>i===j?1:0)]);
  for(let c=0;c<N;c++){let p=c;for(let r=c+1;r<N;r++)if(Math.abs(a[r][c])>Math.abs(a[p][c]))p=r;[a[c],a[p]]=[a[p],a[c]];const d=a[c][c];if(!d)return null;
   for(let j=0;j<2*N;j++)a[c][j]/=d;for(let r=0;r<N;r++)if(r!==c){const f=a[r][c];if(f)for(let j=0;j<2*N;j++)a[r][j]-=f*a[c][j];}}
  return a.map(r=>r.slice(N));}
 // inductance matrix of the coupled inductors: {L: rows} or {err}
 function klMatrix(p){let L=parseMat(p.Lmat);
  if(!L&&String(p.Lmat||'').trim())return {err:'Ο πίνακας αυτεπαγωγής πρέπει να είναι τετραγωνικός, με αριθμούς (γραμμές με «;», στοιχεία με «,»).'};
  if(!L){const N=nPorts(p),Ls=[p.L1,p.L2,p.L3,p.L4].slice(0,N).map(parseEng),k0=parseEng(p.k),kp={};
   for(const q of String(p.kpairs||'').split(',').map(s=>s.trim()).filter(Boolean)){const m=q.match(/^(\d)(\d)\s*:\s*(.+)$/);if(!m)return {err:`k ανά ζεύγος: δεν καταλαβαίνω το «${q}» (γράψε π.χ. 12:0.98).`};kp[m[1]+m[2]]=kp[m[2]+m[1]]=parseEng(m[3]);}
   if(Ls.some(v=>!(v>0)))return {err:'Οι αυτεπαγωγές πρέπει να είναι θετικές.'};
   L=Ls.map((Li,i)=>Ls.map((Lj,j)=>i===j?Li:(kp[(i+1)+''+(j+1)]??k0)*Math.sqrt(Li*Lj)));}
  if(L.length>8)return {err:'Έως 8 τυλίγματα.'};
  if(!symmetric(L))return {err:'Ο πίνακας αυτεπαγωγής πρέπει να είναι συμμετρικός (M_ij = M_ji).'};
  if(!posDef(L))return {err:'Ο πίνακας αυτεπαγωγής δεν είναι θετικά ορισμένος: |k| < 1 σε κάθε ζεύγος (και συμβατά k σε 3 ή περισσότερα τυλίγματα).'};
  return {L};}
 // conductance matrix of the multiport resistance: {G: rows} or {err}
 function kgMatrix(p){const m=parseMat(p.mat);if(!m)return {err:'Ο πίνακας πρέπει να είναι τετραγωνικός, με αριθμούς (γραμμές με «;»).'};
  if(!symmetric(m))return {err:'Ο πίνακας πρέπει να είναι συμμετρικός.'};if(!posDef(m))return {err:'Ο πίνακας πρέπει να είναι θετικά ορισμένος (π.χ. διαγώνια στοιχεία μεγαλύτερα από τα αμοιβαία).'};
  return {G:p.kind==='G'?m:matInv(m)};}
 // ---------------------------------------------------------------- switched reluctance machine (3.6)
 // ψ(θ, i) = Σ_m c_m(i)·cos(m·θ) (θ: electrical angle of the phase, 0 unaligned, π aligned), c_m linear in i between the grid currents.
 // Then ψ is piecewise linear in i (exact inverse i(ψ), positive incremental inductance), the co-energy W′ = ∫ψ di is piecewise quadratic
 // and the torque N_r·∂W′/∂θ follows exactly from the same representation (energy-consistent).
 const SRM_GEOS={'8/6':[4,6],'6/4':[3,4],'12/8':[3,8]};
 function srmGeo(p){return SRM_GEOS[p.geo]||SRM_GEOS['8/6'];}
 // signal pins on the bottom edge: the phase currents under their phases, then ω, τ_e, θ_e (and τ_L in)
 function srmSpins(p){const [N]=srmGeo(p),X=k=>-80*(N-1)+160*k,o={w:O(X(0)+40,40),te:O(X(0)+60,40),th:O(X(0)+80,40)}; // ω first: it is the channel Y:id
  for(let k=0;k<N;k++)o['i'+(k+1)]=O(X(k),40);if(p.load==='sig')o.tl=I(X(N-1)+40,40);return o;}
 function srmPins(N){const o={};for(let k=0;k<N;k++){const X=-80*(N-1)+160*k;o['a'+(k+1)]=[X-10,-30];o['b'+(k+1)]=[X+10,-30];}return o;}
 // saturated d axis of the synchronous machine (3.6): f(i) = L_dsat·i + ψ_k·(1 − e^(−(L_d − L_dsat)·|i|/ψ_k))·sign(i), and its inverse (Newton)
 function satD(q,i){const a=Math.abs(i),dL=q.Ld-q.Ldsat,e=Math.exp(-dL*a/q.psik);return {psi:Math.sign(i)*(q.Ldsat*a+q.psik*(1-e)),L:q.Ldsat+dL*e};}
 function satDinv(q,psi){const a=Math.abs(psi);let i=a/q.Ld;for(let k=0;k<50;k++){const f=satD(q,i),di=(f.psi-a)/f.L;i-=di;if(Math.abs(di)<1e-13*(1+i))break;}return Math.sign(psi)*i;}
 function srmAlignedPsi(q,i){const dL=q.La-q.Lsat;return dL>0&&q.psik>0?q.Lsat*i+q.psik*(1-Math.exp(-dL*i/q.psik)):q.La*i;}
 function srmModelPsi(q,th,i){return q.Lu*i+(srmAlignedPsi(q,i)-q.Lu*i)*(1-Math.cos(th))/2;}
 function srmTableText(q,cur=[0,5,10,15,20,25,30,35,40],ang=[0,30,60,90,120,150,180]){const r=x=>+x.toPrecision(4);
  return [cur.join(', '),...ang.map(a=>a+': '+cur.map(i=>r(srmModelPsi(q,a*Math.PI/180,i))).join(', '))].join('; ');}
 // {N, Nr, I: grid currents, C: [c_0 … c_M] per grid current, M} or {err}
 function srmMag(p){const [N,Nr]=srmGeo(p);const num=v=>parseEng(v);
  if(p.mag!=='table'){const q={Lu:num(p.Lu),La:num(p.La),Lsat:num(p.Lsat),psik:num(p.psik)},Imax=num(p.Imax)>0?num(p.Imax):40,K=80;
   if(!(q.Lu>0&&q.La>q.Lu))return {err:'Χρειάζεται 0 < L_u < L_a.'};if(!(q.Lsat>0)||!(q.psik>0))return {err:'Τα L_sat και ψ_k πρέπει να είναι θετικά.'};
   const I=[],C=[];for(let k=0;k<=K;k++){const i=Imax*k/K,d=srmAlignedPsi(q,i)-q.Lu*i;I.push(i);C.push([q.Lu*i+d/2,-d/2]);}
   return chkMag({N,Nr,I,C,M:1});}
  const rows=String(p.tbl||'').split(/[;\n]+/).map(r=>r.trim()).filter(Boolean);if(rows.length<3)return {err:'Ο πίνακας θέλει τη γραμμή των ρευμάτων και τουλάχιστον δύο γωνίες.'};
  let I=rows[0].split(/[,\s]+/).filter(Boolean).map(parseEng);if(I.some(v=>!Number.isFinite(v)))return {err:'Η πρώτη γραμμή πρέπει να έχει τα ρεύματα (A).'};
  const ang=[],Y=[];for(const r of rows.slice(1)){const m=r.match(/^([^:]+):(.*)$/);if(!m)return {err:`Γραμμή «${r}»: γράψε «θ_e: ψ, ψ, …».`};
   const a=parseEng(m[1]),v=m[2].split(/[,\s]+/).filter(Boolean).map(parseEng);if(!Number.isFinite(a)||v.length!==I.length||v.some(x=>!Number.isFinite(x)))return {err:`Γραμμή «${r}»: χρειάζονται ${I.length} τιμές ψ.`};ang.push(a*Math.PI/180);Y.push(v);}
  if(I[0]!==0){I=[0,...I];Y.forEach((v,j)=>Y[j]=[0,...v]);}
  for(let k=1;k<I.length;k++)if(!(I[k]>I[k-1]))return {err:'Τα ρεύματα πρέπει να αυξάνουν.'};
  // least squares in θ for each current: ψ(θ_j) ≈ Σ c_m cos(m θ_j)
  const M=Math.min(4,ang.length-1),A=ang.map(t=>Array.from({length:M+1},(_,m)=>Math.cos(m*t)));
  const AtA=Array.from({length:M+1},(_,r)=>Array.from({length:M+1},(_,c)=>A.reduce((s,row)=>s+row[r]*row[c],0))),inv=matInv(AtA);if(!inv)return {err:'Οι γωνίες του πίνακα δεν αρκούν (διαφορετικές τιμές από 0 έως 180).'};
  const C=I.map((_,k)=>{const b=Array.from({length:M+1},(_,r)=>A.reduce((s,row,j)=>s+row[r]*Y[j][k],0));return inv.map(row=>row.reduce((s,v,c)=>s+v*b[c],0));});
  C[0]=C[0].map(()=>0);return chkMag({N,Nr,I,C,M});}
 function chkMag(g){for(let d=0;d<=180;d+=3){const A=srmA(g,d*Math.PI/180).A;for(let k=1;k<A.length;k++)if(!(A[k]>A[k-1]))return {err:`Η ψ δεν αυξάνει με το ρεύμα στις ${d}° (ανάμεσα σε ${g.I[k-1]} και ${g.I[k]} A).`};}return g;}
 // ψ at the grid currents and its θ-derivative, at electrical angle th
 function srmA(g,th){const K=g.I.length,cs=[],sn=[];for(let m=0;m<=g.M;m++){cs.push(Math.cos(m*th));sn.push(Math.sin(m*th));}
  const A=new Float64Array(K),D=new Float64Array(K);for(let k=0;k<K;k++){const c=g.C[k];let a=0,d=0;for(let m=0;m<=g.M;m++){a+=c[m]*cs[m];d-=m*c[m]*sn[m];}A[k]=a;D[k]=d;}return {A,D};}
 // segment of |x| in the increasing list L (last segment extrapolates)
 function seg(L,x){let k=0;while(k<L.length-2&&x>=L[k+1])k++;return k;}
 function srmPsi(g,th,i){const {A}=srmA(g,th),a=Math.abs(i),k=seg(g.I,a),B=(A[k+1]-A[k])/(g.I[k+1]-g.I[k]);return Math.sign(i)*(A[k]+B*(a-g.I[k]));}
 // current and incremental inverse inductance di/dψ for a flux ψ
 function srmCur(g,th,psi){const {A}=srmA(g,th),a=Math.abs(psi);let k=0;while(k<A.length-2&&a>=A[k+1])k++;const B=(A[k+1]-A[k])/(g.I[k+1]-g.I[k]);return {i:Math.sign(psi)*(g.I[k]+(a-A[k])/B),g:1/B};}
 // torque of one phase: N_r·∂W′/∂θ_e at constant current
 function srmTorque(g,th,i){const {A,D}=srmA(g,th),a=Math.abs(i),k=seg(g.I,a);let w=0;for(let j=0;j<k;j++)w+=(D[j]+D[j+1])/2*(g.I[j+1]-g.I[j]);const x=a-g.I[k],h=g.I[k+1]-g.I[k];
  return g.Nr*(w+D[k]*x+(D[k+1]-D[k])/h*x*x/2);}
 // co-energy W′(θ, i) = ∫₀ⁱ ψ di′
 function srmCoenergy(g,th,i){const {A}=srmA(g,th),a=Math.abs(i),k=seg(g.I,a);let w=0;for(let j=0;j<k;j++)w+=(A[j]+A[j+1])/2*(g.I[j+1]-g.I[j]);const x=a-g.I[k],h=g.I[k+1]-g.I[k];return w+A[k]*x+(A[k+1]-A[k])/h*x*x/2;}
 // ---------------------------------------------------------------- lightning current (3.5)
 // IEC 62305-1 Annex B: η, τ₁, τ₂ for n = 10
 const HEIDLER={'10/350':{eta:.93,tau1:19e-6,tau2:485e-6,n:10,T1:10e-6,T2:350e-6},'1/200':{eta:.986,tau1:1.82e-6,tau2:285e-6,n:10,T1:1e-6,T2:200e-6},'0.25/100':{eta:.993,tau1:.454e-6,tau2:143e-6,n:10,T1:.25e-6,T2:100e-6}};
 function waveShape(w,t){if(!(t>0))return 0;if(w.kind==='ramp')return Math.min(1,t/w.tr);if(w.kind==='dexp')return Math.exp(-t/w.tau2)-Math.exp(-t/w.tau1);const x=Math.pow(t/w.tau1,w.n);return x/(1+x)*Math.exp(-t/w.tau2);}
 function waveAt(w,t){return w.I0/w.eta*waveShape(w,t-w.t0);}
 // peak, front time T1 = 1.25·(t90 − t10) and time to half value T2 (from the virtual origin t10 − 0.1·T1) of a shape
 // basis 'iec' (impulse voltage, IEC 60060-1): T1 = (t90 − t30)/0.6, virtual origin t30 − 0.3·T1; basis 'tp': time to peak and T2 from t = 0
 function waveMeasure(w,basis){const f=t=>waveShape(w,t),a=Math.min(w.tau1,w.tau2)*1e-3,b=Math.max(w.tau1,w.tau2)*30,N=3000;let tp=a,fp=0;
  for(let k=0;k<=N;k++){const t=a*Math.pow(b/a,k/N),v=f(t);if(v>fp){fp=v;tp=t;}}
  let lo=tp*Math.pow(b/a,-1/N),hi=tp*Math.pow(b/a,1/N);for(let k=0;k<80;k++){const m1=lo+(hi-lo)*.382,m2=lo+(hi-lo)*.618;if(f(m1)<f(m2))lo=m1;else hi=m2;}tp=(lo+hi)/2;fp=f(tp);
  const cross=(lev,x0,x1)=>{const g=t=>f(t)-lev*fp,s0=Math.sign(g(x0));for(let k=0;k<100;k++){const m=(x0+x1)/2;if(Math.sign(g(m))===s0)x0=m;else x1=m;}return (x0+x1)/2;};
  const t10=cross(.1,a,tp),t90=cross(.9,t10,tp),t50=cross(.5,tp,b);
  if(basis==='iec'){const t30=cross(.3,a,tp),T1=(t90-t30)/.6;return {peak:fp,tp,t30,t90,t50,T1,T2:t50-(t30-.3*T1)};}
  if(basis==='tp')return {peak:fp,tp,t50,T1:tp,T2:t50};
  const T1=1.25*(t90-t10);return {peak:fp,tp,t10,t90,t50,T1,T2:t50-(t10-.1*T1)};}
 // τ₁, τ₂ for a front time T1 and time to half value T2: Newton on (ln τ₁, ln τ₂) with a numerical Jacobian
 function waveFit(kind,T1,T2,n=10,basis){const mk=(x)=>({kind,n,tau1:Math.exp(x[0]),tau2:Math.exp(x[1])});
  const res=x=>{const m=waveMeasure(mk(x),basis);return [Math.log(m.T1/T1),Math.log(m.T2/T2)];};
  let x=basis==='tp'?[Math.log(T1/4),Math.log(T2*1.3)]:basis==='iec'?[Math.log(T1/2.47),Math.log(T2*1.44)]:kind==='dexp'?[Math.log(T1/2.9),Math.log(T2*1.38)]:[Math.log(T1*1.9),Math.log(T2*1.39)],r=res(x);
  for(let it=0;it<40&&Math.hypot(...r)>1e-9;it++){const d=1e-6,J=[0,1].map(j=>{const y=[...x];y[j]+=d;const q=res(y);return [(q[0]-r[0])/d,(q[1]-r[1])/d];});
   const det=J[0][0]*J[1][1]-J[1][0]*J[0][1];if(!det)break;let dx=[-(r[0]*J[1][1]-r[1]*J[1][0])/det,-(J[0][0]*r[1]-J[0][1]*r[0])/det];const s=Math.max(1,Math.hypot(...dx));dx=dx.map(v=>v/s);
   let lam=1,y,q;for(let k=0;k<20;k++){y=[x[0]+lam*dx[0],x[1]+lam*dx[1]];q=res(y);if(Math.hypot(...q)<Math.hypot(...r))break;lam/=2;}x=y;r=q;}
  const w=mk(x),m=waveMeasure(w,basis);return {...w,eta:m.peak,fitT1:m.T1,fitT2:m.T2,ok:Math.hypot(...r)<1e-4};}
 // impulse voltage (3.8): fitted on the definitions of IEC 60060-1
 const VIMP_STD={'1.2/50':{T1:1.2e-6,T2:50e-6,basis:'iec'},'250/2500':{T1:250e-6,T2:2500e-6,basis:'tp'}};
 const vimpCache=new Map();
 function impulseWave(p){const V0=parseEng(p.Vpk)||0,t0=Math.max(0,parseEng(p.t0)||0),pre=VIMP_STD[p.shape];
  if(p.shape==='ramp'){const S=Math.abs(parseEng(p.S))||1e12,tr=Math.abs(V0)/S||1e-9;return {kind:'ramp',tr,S,eta:1,I0:V0,t0,T1:tr,T2:Infinity,tau1:tr,tau2:tr,fitOk:true};}
  const T1=pre?pre.T1:Math.max(parseEng(p.T1)||1.2e-6,1e-12),T2=pre?pre.T2:Math.max(parseEng(p.T2)||50e-6,1.5*T1),basis=pre?pre.basis:(p.basis==='tp'?'tp':'iec'),key=[T1,T2,basis].join('|');
  let f=vimpCache.get(key);if(!f){f=waveFit('dexp',T1,T2,10,basis);vimpCache.set(key,f);}
  return {kind:'dexp',n:10,tau1:f.tau1,tau2:f.tau2,eta:f.eta,I0:V0,t0,T1,T2,basis,fitOk:f.ok};}
 // traveling waves by the method of characteristics (3.8), independent of the MNA solver: a source E(t) behind R_s drives a
 // lossless line (Z, τ) ending in a resistance with reflection coefficient Γ_L(t). Forward wave at A: a = E·Z/(R_s + Z) + Γ_s·b,
 // at B it arrives as f(t) = a(t − τ) and returns r = Γ_L(t)·f; at A it arrives as b(t) = r(t − τ). v_A = a + b, v_B = f + r.
 function bewley({E,Rs,Z,tau,gL,tEnd,M=200}){const dt=tau/M,N=Math.ceil(tEnd/dt)+1,gs=(Rs-Z)/(Rs+Z),k=Z/(Rs+Z);
  const a=new Float64Array(N),f=new Float64Array(N),r=new Float64Array(N),b=new Float64Array(N),t=new Float64Array(N),vA=new Float64Array(N),vB=new Float64Array(N);
  for(let i=0;i<N;i++){const ti=i*dt;t[i]=ti;f[i]=i>=M?a[i-M]:0;r[i]=gL(ti)*f[i];b[i]=i>=M?r[i-M]:0;a[i]=k*E(ti)+gs*b[i];vA[i]=a[i]+b[i];vB[i]=f[i]+r[i];}
  const at=(arr,tq)=>{const x=tq/dt,i=Math.floor(x);if(i<0)return 0;if(i>=N-1)return arr[N-1];return arr[i]+(arr[i+1]-arr[i])*(x-i);};
  // the waves of a lattice (Bewley) diagram: every jump of a (forward, from A) or of r (backward, from B)
  const waves=[];for(let i=0;i<N;i++){const da=a[i]-(i?a[i-1]:0),dr=r[i]-(i?r[i-1]:0);if(Math.abs(da)>1e-12)waves.push({t:t[i],dir:1,amp:da});if(Math.abs(dr)>1e-12)waves.push({t:t[i],dir:-1,amp:dr});}
  const iA=a.map((x,i)=>(x-b[i])/Z),iB=f.map((x,i)=>(x-r[i])/Z); // into the line at A, out of the line into the load at B
  return {t,vA,vB,iA,iB,gs,k,dt,vAt:tq=>at(vA,tq),vBt:tq=>at(vB,tq),iAt:tq=>at(iA,tq),iBt:tq=>at(iB,tq),waves};}
 // surge arrester (3.9): current and slope of i(v), and the inverse v(i), from the power law or a table (log-log segments)
 function movChar(p){const pts=[];
  if(p.model==='table'){for(const q of String(p.tbl||'').split(/[;,]/)){const m=q.split(':');if(m.length!==2)continue;const I=parseEng(m[0]),V=parseEng(m[1]);if(I>0&&V>0)pts.push([I,V]);}
   pts.sort((a,b)=>a[0]-b[0]);if(pts.length<2)return {err:'Ο πίνακας θέλει τουλάχιστον δύο σημεία «ρεύμα: τάση».'};for(let k=1;k<pts.length;k++)if(!(pts[k][1]>pts[k-1][1]))return {err:'Η τάση πρέπει να αυξάνει με το ρεύμα.'};}
  else{const U=parseEng(p.Uref),I=parseEng(p.Iref),a=parseEng(p.alpha);if(!(U>0&&I>0&&a>=1))return {err:'U_ref, I_ref > 0 και α ≥ 1.'};pts.push([I,U],[I*10,U*Math.pow(10,1/a)]);}
  const seg=pts.slice(1).map((q,k)=>({I:pts[k][0],V:pts[k][1],a:Math.log(q[0]/pts[k][0])/Math.log(q[1]/pts[k][1])}));
  const pick=v=>{let k=0;while(k<seg.length-1&&v>=pts[k+1][1])k++;return seg[k];};
  const cur=v=>{const x=Math.abs(v);if(!(x>0))return {i:0,g:0};const s=pick(x),i=s.I*Math.pow(x/s.V,s.a);return {i:Math.sign(v)*i,g:s.a*i/x};};
  const inv=i=>{const y=Math.abs(i);if(!(y>0))return 0;let k=0;while(k<seg.length-1&&y>=pts[k+1][0])k++;const s=seg[k];return Math.sign(i)*s.V*Math.pow(y/s.I,1/s.a);};
  return {pts,seg,cur,inv};}
 // impulse generator design (3.10, book eq. 3.21–3.33): R₁ (front) and R₂ (tail) from C₁, C₂ and the roots α₁ < α₂ of the wave.
 // pos 'gen': R₂ across C₁ (type β), 'load': R₂ across C₂ (type α). Both give V(t) = V₀/(R₁C₂)·(e^(−α₁t) − e^(−α₂t))/(α₂ − α₁).
 function impulseDesign({C1,C2,a1,a2,pos}){const a=a1+a2,b=a1*a2,A=1/C1+1/C2,B=b*(pos==='load'?C1:C2),D=a*a-4*A*B;
  if(!(C1>0&&C2>0&&a2>a1&&a1>0)||!(D>=0))return {err:'Δεν υπάρχουν R₁, R₂ για αυτά τα C₁, C₂ και την κυματομορφή.'};
  const x=(a+Math.sqrt(D))/(2*A),R1=1/x,R2=x/(b*C1*C2),t1=Math.log(a2/a1)/(a2-a1),eta=(Math.exp(-a1*t1)-Math.exp(-a2*t1))/(R1*C2*(a2-a1));
  return {R1,R2,t1,eta,v:(V0,t)=>t>0?V0/(R1*C2*(a2-a1))*(Math.exp(-a1*t)-Math.exp(-a2*t)):0};}
 // the reverse: the roots α₁, α₂ of a given generator (book eq. 3.22, 3.25, 3.29), its peak time t₁ and efficiency η = V_p/V₀ (3.31, 3.32)
 function impulseRoots({R1,R2,C1,C2,pos}){const a=1/(R1*C1)+1/(R1*C2)+1/(R2*(pos==='load'?C2:C1)),b=1/(R1*R2*C1*C2),q=Math.sqrt(a*a/4-b),a1=a/2-q,a2=a/2+q,
  t1=Math.log(a2/a1)/(a2-a1),eta=(Math.exp(-a1*t1)-Math.exp(-a2*t1))/(R1*C2*(a2-a1));return {a1,a2,t1,eta,v:(V0,t)=>t>0?V0/(R1*C2*(a2-a1))*(Math.exp(-a1*t)-Math.exp(-a2*t)):0};}
 // transmission line (3.8): Z and τ from the chosen data
 function tlParams(p){const num=v=>parseEng(v);let Z,tau;
  if(p.spec==='lc'){const L=num(p.Lp),C=num(p.Cp),l=num(p.len);if(!(L>0&&C>0&&l>0))return {err:'L′, C′ και μήκος πρέπει να είναι θετικά.'};Z=Math.sqrt(L/C);tau=l*Math.sqrt(L*C);}
  else if(p.spec==='zl'){Z=num(p.Z);const l=num(p.len),v=num(p.vel);if(!(l>0&&v>0))return {err:'Μήκος και ταχύτητα πρέπει να είναι θετικά.'};tau=l/v;}
  else{Z=num(p.Z);tau=num(p.tau);}
  if(!(Z>0))return {err:'Η κυματική αντίσταση πρέπει να είναι θετική.'};if(!(tau>0))return {err:'Ο χρόνος διάδοσης πρέπει να είναι θετικός.'};
  const R=p.spec==='zt'?(num(p.Rt)||0):(num(p.Rp)||0)*num(p.len);if(!(R>=0))return {err:'Η αντίσταση σειράς δεν μπορεί να είναι αρνητική.'};
  const N=R>0?Math.round(num(p.nsec)||1):1;if(!(N>=1&&N<=1000))return {err:'Τα τμήματα πρέπει να είναι από 1 ως 1000.'};return {Z,tau,R,N};}
 // the waveform of a lightning-current part: {kind, n, tau1, tau2, eta, I0, t0, T1, T2}
 function lightningWave(p){const I0=parseEng(p.Ipk)||0,t0=Math.max(0,parseEng(p.t0)||0),pre=HEIDLER[p.shape];
  if(pre)return {kind:'heidler',...pre,I0,t0};
  const T1=Math.max(parseEng(p.T1)||1.2e-6,1e-12),T2=Math.max(parseEng(p.T2)||50e-6,1.5*T1),kind=p.model==='dexp'?'dexp':'heidler',n=Math.max(1,Math.min(30,parseEng(p.n)||10));
  const f=waveFit(kind,T1,T2,n);return {kind,n,tau1:f.tau1,tau2:f.tau2,eta:f.eta,I0,t0,T1,T2,fitOk:f.ok};}
 function pinKind(c,pin){const s=sigPins(c)[pin];return s?s.dir:'el';}
 // rotation (0..3 quarter turns) and mirror applied to a local point
 function xf(c,[x,y]){if(c.flip)x=-x;for(let i=0;i<(c.rot||0);i++)[x,y]=[-y,x];return [c.x+x,c.y+y];}
 function pinPos(c,pin){const q=pinsOf(c)[pin];return q?xf(c,q):null;}
 // outward direction of a pin (unit vector), for wire escape
 function pinDir(c,pin){const [x,y]=pinsOf(c)[pin]||[1,0];let d=Math.abs(x)>=Math.abs(y)?[Math.sign(x)||1,0]:[0,Math.sign(y)||1];
  if(c.type==='GND')d=[0,-1];if(c.type==='JUNC')d=[0,0];
  const o=xf({x:0,y:0,rot:c.rot,flip:c.flip},d);return o;}
 // CPE admittance Q·s^α = Q·sin(απ)/π ∫ x^α · s/(s + x) d(ln x): log-spaced x_k → branches g_k·s/(s + x_k) (series R–C),
 // plus a conductance for x < x_min and a capacitance for x > x_max; band extended ×10 on each side
 function cpeParams(p){const a=p.kind==='cpe'?Math.min(.99,Math.max(.01,+p.alpha)):.5,Q=p.kind==='cpe'?+p.Q:1/(Math.SQRT2*Math.max(+p.sigma,1e-12));return {a,Q};}
 function cpeBank(p){const {a,Q}=cpeParams(p),N=Math.max(4,Math.min(40,Math.round(+p.N||16))),x0=2*Math.PI*Math.max(+p.fmin,1e-6)/10,x1=2*Math.PI*Math.max(+p.fmax,+p.fmin*10)*10,D=Math.log(x1/x0)/(N-1),K=Q*Math.sin(a*Math.PI)/Math.PI,br=[];
  for(let k=0;k<N;k++){const x=x0*Math.exp(k*D),g=K*Math.pow(x,a)*(k===0||k===N-1?D/2:D);br.push({R:1/g,C:g/x});}
  return {br,G0:K*Math.pow(x0,a)/a,Cinf:K*Math.pow(x1,a-1)/(1-a),a,Q};}
 // exact impedance and the impedance of the bank, at ω (rad/s): [re, im]
 function cpeZ(p,w){const {a,Q}=cpeParams(p),m=1/(Q*Math.pow(w,a)),ph=-a*Math.PI/2;return [m*Math.cos(ph),m*Math.sin(ph)];}
 function cpeZbank(p,w){const b=cpeBank(p);let yr=b.G0,yi=w*b.Cinf;for(const {R,C} of b.br){const d=1+(w*R*C)**2;yr+=w*w*R*C*C/d;yi+=w*C/d;}const m=yr*yr+yi*yi;return [yr/m,-yi/m];}
 function boxOf(c){const b=PARTS[c.type].box;return typeof b==='function'?b({...defaults(c.type),...(c.params||{})}):b;}
 function bbox(c){const [bx,by,bw,bh]=boxOf(c);const pts=[[bx,by],[bx+bw,by],[bx,by+bh],[bx+bw,by+bh]].map(p=>xf(c,p));
  const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);return [Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];}
 // engineering notation
 const PRE=[[1e9,'G'],[1e6,'M'],[1e3,'k'],[1,''],[1e-3,'m'],[1e-6,'μ'],[1e-9,'n'],[1e-12,'p']];
 function eng(v,unit='',d=3){if(v===null||v===undefined||!Number.isFinite(v))return '—';if(Math.abs(v)<1e-13)return '0'+(unit?' '+unit:'');const a=Math.abs(v);
  for(const [k,p] of PRE)if(a>=k*.9995){const s=Number((v/k).toPrecision(d)).toLocaleString('el-GR',{maximumFractionDigits:6});return s+(unit||p?' '+p+unit:'');}
  return v.toExponential(2)+' '+unit;}
 const PFX={G:1e9,M:1e6,k:1e3,K:1e3,m:1e-3,u:1e-6,'μ':1e-6,'µ':1e-6,n:1e-9,p:1e-12};
 function parseEng(s){if(typeof s==='number')return s;s=String(s).trim().replace(',','.').replace(/\s+/g,'');if(!s)return NaN;
  const m=s.match(/^([-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)([GMkKmuμµnp]?)[A-Za-zΩ°]*$/);if(!m)return NaN;return Number(m[1])*(m[2]?PFX[m[2]]:1);}
 // "t:v, t:v" schedules
 function parseSched(s){if(s===undefined||s===null)return null;s=String(s).trim();if(!s)return null;
  if(!s.includes(':')){const v=parseEng(s);return Number.isFinite(v)?[[0,v]]:null;}
  const out=[];for(const part of s.split(/[;,]\s*(?=[-+.\d])/)){const [a,b]=part.split(':');const t=parseEng(a),v=parseEng(b);if(!Number.isFinite(t)||!Number.isFinite(v))return null;out.push([t,v]);}
  out.sort((x,y)=>x[0]-y[0]);return out.length?out:null;}
 const BLOCKS=new Set(Object.keys(PARTS).filter(k=>PARTS[k].blk));
 const api={PARTS,GROUPS,BLOCKS,defaults,elPins,sigPins,pinsOf,pinKind,xf,pinPos,pinDir,bbox,boxOf,eng,parseEng,parseSched,cpeBank,cpeZ,cpeZbank,
  parseMat,nPorts,klMatrix,kgMatrix,matInv,posDef,HEIDLER,waveShape,waveAt,waveMeasure,waveFit,lightningWave,VIMP_STD,impulseWave,impulseDesign,impulseRoots,tlParams,bewley,movChar,
  srmGeo,srmMag,srmA,srmPsi,srmCur,srmTorque,srmCoenergy,srmModelPsi,srmAlignedPsi,satD,satDinv};
 root.Parts=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
