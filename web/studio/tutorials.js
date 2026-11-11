'use strict';
// Tutorial circuits. Each tutorial is a function of its options that returns a
// complete, editable project: components, wires, simulation settings and scopes.
(function(root){
 const C=(id,type,x,y,params={},o={})=>({id,type,x,y,rot:o.rot||0,flip:!!o.flip,label:o.label||id,params,...(o.lbl?{lbl:o.lbl}:{})});
 const J=(id,x,y)=>C(id,'JUNC',x,y,{},{label:''});
 const pin=s=>{const [c,p]=s.split(':');return {c,p:p||'j'};};
 // version 3 (3.18): wire names join (Bus.namesJoin); no tutorial has one name on two different nets
 const project=(comps,wires,extra={})=>({version:3,components:comps,wires:wires.map((w,i)=>({id:'w'+(i+1),a:pin(w[0]),b:pin(w[1]),pts:w[2]||[],...(w[3]||{})})),...extra});
 const gnd=(x,y)=>C('G1','GND',x,y,{},{label:'0 V'});
 // PE2 PI design (same as the bidirectional tutorial app): crossover fs/20, PM 60°, ZOH delay Ts
 function piGains(L,vhi,fs,fcRatio=.05,pm=60){const wc=2*Math.PI*fcRatio*fs,phid=wc/fs;let th=Math.PI/2-pm*Math.PI/180-phid;if(th<=0)th=5*Math.PI/180;const wz=wc*Math.tan(th),kp=wc*L*Math.cos(th)/vhi;return {kp,ki:kp*wz,fc:wc/2/Math.PI};}

 // Steady-state start for buck and boost (ideal, resistive load), CCM or DCM.
 // With the symmetric carrier t = 0 is the middle of the OFF interval, so i_L(0)
 // is the mean current in CCM, and in DCM the falling current (or zero) at that instant.
 function steadyStart(kind,{Vin,D,L,fs,R}){const T=1/fs,K=2*L*fs/R;
  if(kind==='buck'){const ccm=K>=1-D,Vo=ccm?D*Vin:Vin*2/(1+Math.sqrt(1+4*K/(D*D)));
   const i0=ccm?Vo/R:Math.max(0,(Vin-Vo)*D*T/L-Vo/L*(1-D)*T/2);return {Vo,i0,mode:ccm?'CCM':'DCM'};}
  const ccm=K>=D*(1-D)**2,Vo=ccm?Vin/(1-D):Vin*(1+Math.sqrt(1+4*D*D/K))/2;
  const i0=ccm?Vo*Vo/(R*Vin):Math.max(0,Vin*D*T/L-(Vo-Vin)/L*(1-D)*T/2);return {Vo,i0,mode:ccm?'CCM':'DCM'};}
 const T=[];
 // ------------------------------------------------------------------ Buck
 T.push({id:'buck',group:'DC-DC χωρίς απομόνωση',title:'Buck (υποβιβασμός)',theory:'v1',topology:'buck',
  options:[{k:'load',label:'Φορτίο',options:[['10','R = 10 Ω · CCM'],['50','R = 50 Ω · DCM']],def:'10'},{k:'start',label:'Εκκίνηση',options:[['zero','Από μηδέν (μεταβατικό)'],['steady','Από μόνιμη κατάσταση']],def:'zero'}],
  desc:'Ο διακόπτης S1 εφαρμόζει V_in στο πηνίο για χρόνο D·T. Η δίοδος D1 κρατά τη ροή του ρεύματος όταν ο S1 σβήνει. Μέση τάση εξόδου V_o = D·V_in σε CCM.',
  tasks:['Δεξί κλικ στο L1 → Scope ρεύματος, και στον κόμβο μεταγωγής → τάση κόμβου.','Άλλαξε το D από τον έλεγχο κάτω από το κύκλωμα και δες την έξοδο να ακολουθεί.','Διάλεξε R = 50 Ω: το ρεύμα του πηνίου μηδενίζεται για ένα διάστημα (DCM) και η V_o ανεβαίνει πάνω από D·V_in.'],
  build(o){const R=+o.load,st=o.start==='steady',ss=steadyStart('buck',{Vin:24,D:.5,L:100e-6,fs:100e3,R}),Vo=+ss.Vo.toFixed(4);
   return project([C('V1','VDC',100,210,{V:24},{label:'V_in'}),gnd(100,300),C('S1','SW',200,150,{pwm:'PWM1',out:'a',body:false},{rot:3}),J('J1',270,150),C('D1','D',270,200,{},{rot:3}),
     C('L1','L',340,150,{L:100e-6,i0:st?+ss.i0.toFixed(5):0}),J('J2',430,150),C('C1','C',430,210,{C:100e-6,v0:st?Vo:0},{label:'C'}),C('R1','R',520,210,{R},{rot:1,label:'R'}),
     J('J3',100,270),J('J4',270,270),J('J5',430,270),C('PWM1','PWM',200,60,{fs:100e3,D:.5})],
    [['V1:p','S1:d',[[100,150]]],['S1:s','J1'],['J1','L1:a'],['J1','D1:k'],['L1:b','J2',[],{name:'v_o'}],['J2','C1:p'],['J2','R1:a',[[520,150]]],
     ['V1:n','J3'],['J3','G1:g'],['J3','J4'],['J4','D1:a'],['J4','J5'],['J5','C1:n'],['J5','R1:b',[[520,270]]]],
    {sim:{hDiv:200,speed:100,stopT:0},scope:{panes:[[['I:L1','i_L']],[['VN:J1:j','v_sw'],['V:C1','v_o']]],window:{unit:'T',n:10}}});}});
 // ------------------------------------------------------------------ Boost
 T.push({id:'boost',group:'DC-DC χωρίς απομόνωση',title:'Boost (ανύψωση)',theory:'v1',topology:'boost',
  options:[{k:'load',label:'Φορτίο',options:[['20','R = 20 Ω · CCM'],['200','R = 200 Ω · DCM']],def:'20'},{k:'start',label:'Εκκίνηση',options:[['zero','Από μηδέν'],['steady','Από μόνιμη κατάσταση']],def:'steady'}],
  desc:'Με τον S1 κλειστό το πηνίο αποθηκεύει ενέργεια από την V_in. Όταν ανοίγει, το ρεύμα του πηνίου περνά από τη D1 στην έξοδο. Σε CCM V_o = V_in/(1−D).',
  tasks:['Scope στο ρεύμα της διόδου D1: είναι το ρεύμα που φορτίζει τον πυκνωτή (Θέμα 1 εξετάσεων).','Με R = 200 Ω η έξοδος ξεπερνά τα 24 V: ασυνεχής αγωγή.','Scope ρεύματος στον C1: φαίνεται η φόρτιση/εκφόρτιση που ορίζει την κυμάτωση.'],
  build(o){const R=+o.load,st=o.start==='steady',ss=steadyStart('boost',{Vin:12,D:.5,L:100e-6,fs:100e3,R}),Vo=+ss.Vo.toFixed(4);
   return project([C('V1','VDC',100,210,{V:12},{label:'V_in'}),gnd(100,300),C('L1','L',170,150,{L:100e-6,i0:st?+ss.i0.toFixed(5):0}),J('J1',230,150),C('S1','SW',230,200,{pwm:'PWM1',out:'a',body:false}),
     C('D1','D',290,150),J('J2',360,150),C('C1','C',360,210,{C:220e-6,v0:st?Vo:12}),C('R1','R',450,210,{R},{rot:1,label:'R'}),J('J3',100,270),J('J4',230,270),J('J5',360,270),C('PWM1','PWM',230,60,{fs:100e3,D:.5})],
    [['V1:p','L1:a',[[100,150]]],['L1:b','J1'],['J1','S1:d'],['J1','D1:a'],['D1:k','J2',[],{name:'v_o'}],['J2','C1:p'],['J2','R1:a',[[450,150]]],['V1:n','J3'],['J3','G1:g'],['J3','J4'],['J4','S1:s'],['J4','J5'],['J5','C1:n'],['J5','R1:b',[[450,270]]]],
    {sim:{hDiv:200,speed:100,stopT:0},scope:{panes:[[['I:L1','i_L'],['I:D1','i_D']],[['V:C1','v_o']]],window:{unit:'T',n:10}}});}});
 // ------------------------------------------------------------------ Buck-boost
 T.push({id:'buck_boost',group:'DC-DC χωρίς απομόνωση',title:'Buck–boost (αναστροφής)',theory:'v1',topology:'buck_boost',
  options:[{k:'D',label:'Duty',options:[['0.4','D = 0,4 · |V_o| < V_in'],['0.6','D = 0,6 · |V_o| > V_in']],def:'0.4'}],
  desc:'Το πηνίο φορτίζεται από την είσοδο όταν άγει ο S1 και εκφορτίζεται στην έξοδο μέσω της D1. Η έξοδος είναι αρνητική: V_o = −V_in·D/(1−D).',
  tasks:['Δες ότι η τάση του πυκνωτή είναι αρνητική ως προς τη γείωση.','Σύγκρινε το μέσο ρεύμα του πηνίου με το I_o/(1−D).'],
  build(o){const D=+o.D;
   return project([C('V1','VDC',100,210,{V:12},{label:'V_in'}),gnd(100,300),C('S1','SW',200,150,{pwm:'PWM1',out:'a',body:false},{rot:3}),J('J1',270,150),C('L1','L',270,210,{L:100e-6},{rot:1}),
     C('D1','D',330,150,{},{rot:2}),J('J2',400,150),C('C1','C',400,210,{C:220e-6}),C('R1','R',480,210,{R:10},{rot:1,label:'R'}),J('J3',100,270),J('J4',270,270),J('J5',400,270),C('PWM1','PWM',200,60,{fs:100e3,D})],
    [['V1:p','S1:d',[[100,150]]],['S1:s','J1'],['J1','D1:k'],['J1','L1:a'],['D1:a','J2',[],{name:'v_o'}],['J2','C1:p'],['J2','R1:a',[[480,150]]],['V1:n','J3'],['J3','G1:g'],['J3','J4'],['J4','L1:b'],['J4','J5'],['J5','C1:n'],['J5','R1:b',[[480,270]]]],
    {sim:{hDiv:200,speed:200,stopT:0},scope:{panes:[[['I:L1','i_L']],[['V:C1','v_o']]],window:{unit:'T',n:10}}});}});
 // ------------------------------------------------------------------ Cuk
 T.push({id:'cuk',group:'DC-DC χωρίς απομόνωση',title:'Ćuk',theory:'formula',topology:'cuk',
  options:[{k:'D',label:'Duty',options:[['0.4','D = 0,4'],['0.6','D = 0,6']],def:'0.4'}],
  desc:'Η ενέργεια μεταφέρεται μέσω του πυκνωτή C1. Και τα δύο πηνία έχουν συνεχές ρεύμα, άρα και η είσοδος και η έξοδος δεν διακόπτονται. V_o = −V_in·D/(1−D).',
  tasks:['Scope τάσης στον C1: μέση τιμή V_in + |V_o|.','Σύγκρινε τις κυματώσεις των δύο πηνίων με αυτές του buck–boost.'],
  build(o){const D=+o.D,Vo=-12*D/(1-D),Io=Vo/8;
   return project([C('V1','VDC',100,210,{V:12},{label:'V_in'}),gnd(100,300),C('L1','L',170,150,{L:200e-6,i0:+(Math.abs(Io)*D/(1-D)).toFixed(5)}),J('JA',230,150),C('S1','SW',230,200,{pwm:'PWM1',out:'a',body:false}),C('C1','C',290,150,{C:10e-6,v0:+(12-Vo).toFixed(5)},{rot:3}),
     J('JB',350,150),C('D1','D',350,200,{},{rot:1}),C('L2','L',420,150,{L:200e-6,i0:+Io.toFixed(5)}),J('JO',490,150),C('C2','C',490,210,{C:100e-6,v0:+Vo.toFixed(5)}),C('R1','R',570,210,{R:8},{rot:1,label:'R'}),
     J('J3',100,270),J('J4',230,270),J('J5',350,270),J('J6',490,270),C('PWM1','PWM',230,60,{fs:100e3,D})],
    [['V1:p','L1:a',[[100,150]]],['L1:b','JA'],['JA','S1:d'],['JA','C1:p'],['C1:n','JB'],['JB','D1:a'],['JB','L2:a'],['L2:b','JO',[],{name:'v_o'}],['JO','C2:p'],['JO','R1:a',[[570,150]]],
     ['V1:n','J3'],['J3','G1:g'],['J3','J4'],['J4','S1:s'],['J4','J5'],['J5','D1:k'],['J5','J6'],['J6','C2:n'],['J6','R1:b',[[570,270]]]],
    {sim:{hDiv:200,speed:200,stopT:0},scope:{panes:[[['I:L1','i_L1'],['I:L2','i_L2']],[['V:C1','v_C1']],[['V:C2','v_o']]],window:{unit:'T',n:10}}});}});
 // ------------------------------------------------------------------ SEPIC
 T.push({id:'sepic',group:'DC-DC χωρίς απομόνωση',title:'SEPIC',theory:'formula',topology:'sepic',
  options:[{k:'D',label:'Duty',options:[['0.4','D = 0,4 · V_o < V_in'],['0.6','D = 0,6 · V_o > V_in']],def:'0.6'}],
  desc:'Μη αναστρέφουσα έξοδος που μπορεί να είναι μεγαλύτερη ή μικρότερη από την είσοδο: V_o = V_in·D/(1−D). Ο C1 φορτίζεται μέσα στην περίοδο στη V_in.',
  tasks:['Scope τάσης C1: μέση τιμή V_in.','Δες ότι το ρεύμα της διόδου είναι i_L1 + i_L2 όταν ο S1 είναι OFF.'],
  build(o){const D=+o.D,Vo=12*D/(1-D),Io=Vo/18;
   return project([C('V1','VDC',100,210,{V:12},{label:'V_in'}),gnd(100,300),C('L1','L',170,150,{L:200e-6,i0:+(Io*D/(1-D)).toFixed(5)}),J('JA',230,150),C('S1','SW',230,200,{pwm:'PWM1',out:'a',body:false}),C('C1','C',290,150,{C:10e-6,v0:12},{rot:3}),
     J('JB',350,150),C('L2','L',350,210,{L:200e-6,i0:+(-Io).toFixed(5)},{rot:1}),C('D1','D',410,150),J('JO',480,150),C('C2','C',480,210,{C:100e-6,v0:+Vo.toFixed(5)}),C('R1','R',560,210,{R:18},{rot:1,label:'R'}),
     J('J3',100,270),J('J4',230,270),J('J5',350,270),J('J6',480,270),C('PWM1','PWM',230,60,{fs:100e3,D})],
    [['V1:p','L1:a',[[100,150]]],['L1:b','JA'],['JA','S1:d'],['JA','C1:p'],['C1:n','JB'],['JB','L2:a'],['JB','D1:a'],['D1:k','JO',[],{name:'v_o'}],['JO','C2:p'],['JO','R1:a',[[560,150]]],
     ['V1:n','J3'],['J3','G1:g'],['J3','J4'],['J4','S1:s'],['J4','J5'],['J5','L2:b'],['J5','J6'],['J6','C2:n'],['J6','R1:b',[[560,270]]]],
    {sim:{hDiv:200,speed:200,stopT:0},scope:{panes:[[['I:L1','i_L1'],['I:L2','i_L2']],[['V:C1','v_C1']],[['V:C2','v_o']]],window:{unit:'T',n:10}}});}});
 // ------------------------------------------------------------------ Flyback
 T.push({id:'flyback',group:'DC-DC με απομόνωση',title:'Flyback',theory:'v1',topology:'flyback',
  options:[{k:'R',label:'Φορτίο',options:[['8','R = 8 Ω · CCM'],['40','R = 40 Ω · DCM']],def:'8'},{k:'lk',label:'Μετασχηματιστής',options:[['ideal','Χωρίς σκέδαση'],['clamp','L_lk = 4 μH + RCD clamp']],def:'ideal'}],
  desc:'Ο μετασχηματιστής είναι συζευγμένα πηνία: όταν άγει ο S1 αποθηκεύεται ενέργεια στη μαγνήτιση L_m, όταν σβήνει μεταφέρεται στο δευτερεύον μέσω της D1. Σε CCM V_o = V_in·n·D/(1−D), με n = N₂/N₁. Με σκέδαση, η ενέργεια ½·L_lk·i² δεν περνά στο δευτερεύον: την απορροφά το clamp D_c, C_c, R_c και η τάση του διακόπτη κόβεται στο V_in + V_c.',
  tasks:['Scope: ρεύμα μαγνήτισης (Im) και ρεύματα πρωτεύοντος/δευτερεύοντος του T1.','Τάση του διακόπτη: V_in + V_o/n όταν σβήνει.','Με R = 40 Ω το ρεύμα μαγνήτισης μηδενίζεται: DCM.','Με σκέδαση: δες την αιχμή στον S1, την τάση του C_c και τη μέση ισχύ στο R_c (≈ ½·L_lk·Î²·f_s·V_c/(V_c − V_o/n)).'],
  build(o){const R=+o.R;
   if(o.lk==='clamp')return project([C('V1','VDC',60,230,{V:24},{label:'V_in'}),J('JT1',130,130),J('JT2',230,130),C('Cc','C',130,200,{C:100e-9,v0:32},{rot:2,label:'C_c'}),C('Rc','R',230,200,{R:2200},{rot:1,label:'R_c'}),
     J('JK1',130,270),J('JK2',230,270),C('Dc','D',300,270,{},{rot:2,label:'D_c',lbl:'below'}),J('JD',360,270),C('T1','XFMR',390,190,{n:.5,Lm:200e-6,Llk1:4e-6,pol:'opp',im0:R===8?.83:0}),C('S1','SW',360,330,{pwm:'PWM1',out:'a',body:false}),
     C('D1','D',500,160),J('JO',580,160),C('C1','C',580,220,{C:220e-6,v0:R===8?7.8:0}),C('R1','R',680,220,{R},{rot:1,label:'R'}),J('J5',420,280),C('G2','GND',420,310,{},{label:'0 V′'}),J('J6',580,280),
     J('J0',60,400),gnd(60,420),C('PWM1','PWM',100,60,{fs:100e3,D:.4})],
    [['V1:p','JT1',[[60,130]]],['JT1','JT2'],['JT2','T1:p1',[[360,130]]],['JT1','Cc:n'],['Cc:p','JK1'],['JT2','Rc:a'],['Rc:b','JK2'],['JK1','JK2'],['JK2','Dc:k'],['Dc:a','JD'],['T1:p2','JD'],['JD','S1:d',[],{name:'v_d'}],
     ['S1:s','J0',[[360,400]]],['V1:n','J0'],['J0','G1:g'],['T1:s1','D1:a'],['D1:k','JO',[],{name:'v_o'}],['JO','C1:p'],['JO','R1:a',[[680,160]]],['T1:s2','J5'],['J5','G2:g'],['J5','J6'],['J6','C1:n'],['J6','R1:b',[[680,280]]]],
    {sim:{hDiv:400,speed:100,stopT:0},scope:{panes:[[['V:S1','v_S1'],['V:Cc','v_Cc']],[['I:T1','i_p'],['I:Dc','i_Dc'],['I2:T1','i_sec']],[['V:C1','v_o']]],window:{unit:'T',n:4}}});
   return project([C('V1','VDC',100,210,{V:24},{label:'V_in'}),gnd(100,370),C('T1','XFMR',220,200,{n:.5,Lm:200e-6,pol:'opp'}),C('S1','SW',190,280,{pwm:'PWM1',out:'a',body:false}),
     C('D1','D',310,170),J('JO',380,170),C('C1','C',380,230,{C:220e-6}),C('R1','R',460,230,{R},{rot:1,label:'R'}),
     J('J3',100,340),J('J5',250,290),C('G2','GND',250,320,{},{label:'0 V′'}),J('J6',380,290),C('PWM1','PWM',100,60,{fs:100e3,D:.4})],
    [['V1:p','T1:p1'],['T1:p2','S1:d'],['V1:n','J3'],['J3','G1:g'],['J3','S1:s',[[190,340]]],['T1:s1','D1:a'],['D1:k','JO',[],{name:'v_o'}],['JO','C1:p'],['JO','R1:a',[[460,170]]],
     ['T1:s2','J5'],['J5','G2:g'],['J5','J6'],['J6','C1:n'],['J6','R1:b',[[460,290]]]],
    {sim:{hDiv:200,speed:200,stopT:0},scope:{panes:[[['Im:T1','i_m'],['I2:T1','i_sec']],[['V:S1','v_S1']],[['V:C1','v_o']]],window:{unit:'T',n:10}}});}});
 // ------------------------------------------------------------------ H-bridge DC-DC
 function hbridge(o,inv){
  const comps=[C('V1','VDC',60,220,{V:inv?400:48},{label:'V_d'}),C('S1','SW',180,150,{}),J('JA',180,220),C('S2','SW',180,280,{}),C('S3','SW',380,150,{}),J('JB',380,220),C('S4','SW',380,280,{}),
   C('R1','R',250,220,{R:inv?10:2},{label:'R'}),C('L1','L',320,220,{L:inv?10e-3:2e-3}),J('JT',180,110),J('J0',60,330),gnd(60,350),J('JBt',180,330)];
  const uni=o.pwm==='uni';
  const g={S1:'a',S2:'na',S3:uni?'b':'na',S4:uni?'nb':'a'};for(const k of Object.keys(g)){const c=comps.find(x=>x.id===k);c.params={pwm:'PWM1',out:g[k],body:true};}
  comps.push(C('PWM1','PWM',280,50,inv?{fs:5e3,mode:'spwm',m:+o.m,fref:50,refphase:0}:uni?{fs:20e3,mode:'spwm',m:+o.m,fref:0,refphase:90}:{fs:20e3,mode:'fixed',D:(1+ +o.m)/2}));
  return project(comps,[['V1:p','JT',[[60,110]]],['JT','S1:d'],['JT','S3:d',[[380,110]]],['S1:s','JA'],['JA','S2:d'],['S3:s','JB'],['JB','S4:d'],['JA','R1:a',[],{name:'A'}],['R1:b','L1:a'],['L1:b','JB',[],{name:'B'}],
    ['V1:n','J0'],['J0','G1:g'],['J0','JBt'],['JBt','S2:s'],['JBt','S4:s',[[380,330]]]],
   {sim:inv?{hDiv:100,speed:500,stopT:0}:{hDiv:200,speed:100,stopT:0},scope:{panes:[[['V:R1','v_R'],['VN:JA:j','v_A']],[['I:L1','i_o']]],window:inv?{unit:'T',n:200}:{unit:'T',n:6}}});}
 T.push({id:'hbridge',group:'Γέφυρες',title:'Full-bridge DC-DC (H-γέφυρα)',theory:'formula',topology:'hbridge',
  options:[{k:'pwm',label:'Διαμόρφωση',options:[['bi','Διπολική (S1,S4 | S2,S3)'],['uni','Μονοπολική (δύο σκέλη)']],def:'bi'},{k:'m',label:'v_control / V_tri',options:[['0.5','0,5'],['0.2','0,2'],['-0.5','−0,5']],def:'0.5'}],
  desc:'Τετράγωνη γέφυρα με φορτίο R–L. Στη διπολική διαμόρφωση η v_AB εναλλάσσεται ±V_d. Στη μονοπολική παίρνει 0 και ±V_d με διπλάσια φαινόμενη συχνότητα. Σε κάθε περίπτωση V_o = (v_control/V_tri)·V_d.',
  tasks:['Σύγκρινε την κυμάτωση του ρεύματος στη διπολική και στη μονοπολική για το ίδιο m.','Με αρνητικό m η μέση τάση αλλάζει πρόσημο: λειτουργία δύο τεταρτημορίων τάσης.'],
  build(o){const p=hbridge(o,false);p.scope.panes=[[['VN:JA:j','v_A'],['VN:JB:j','v_B']],[['I:L1','i_o']]];return p;}});
 T.push({id:'inverter',group:'Γέφυρες',title:'Μονοφασικός αντιστροφέας SPWM',theory:'formula',topology:'inverter',
  options:[{k:'pwm',label:'Διαμόρφωση',options:[['bi','Διπολική'],['uni','Μονοπολική']],def:'uni'},{k:'m',label:'Δείκτης m',options:[['0.8','0,8'],['0.5','0,5'],['1','1,0']],def:'0.8'}],
  desc:'Ημιτονοειδής αναφορά 50 Hz συγκρίνεται με τριγωνικό φορέα 5 kHz. Το πλάτος της θεμελιώδους στη γραμμική περιοχή είναι m·V_d.',
  tasks:['Παράθυρο 20 ms (100 περίοδοι φορέα): το ρεύμα του R–L φορτίου είναι σχεδόν ημιτονοειδές.','Σύγκρινε την κορυφή του ρεύματος με m·V_d/|R + jωL|.'],
  build(o){const p=hbridge(o,true);p.scope.panes=[[['V:R1','v_R'],['VN:JA:j','v_A']],[['I:L1','i_o']]];return p;}});
 // ------------------------------------------------------------------ rectifier
 T.push({id:'rectifier',group:'Ανορθωτές',title:'Ανορθωτής γέφυρας → μπαταρία',theory:'formula',topology:'rectifier',
  options:[{k:'Ls',label:'Αυτεπαγωγή πηγής',options:[['0','L_s = 0'],['0.002','L_s = 2 mH']],def:'0'},{k:'E',label:'Μπαταρία E',options:[['200','E = 200 V'],['150','E = 150 V']],def:'200'}],
  desc:'Πηγή 230 V / 50 Hz, μονοφασική γέφυρα διόδων, φορτίο μπαταρίας E σε σειρά με R = 2 Ω (Θέμα 2). Ρεύμα υπάρχει μόνο όταν |v_s| > E.',
  tasks:['Scope ρεύματος στο R: παλμοί γύρω από τις κορυφές της τάσης.','Μέτρησε μέση και RMS τιμή στο παράθυρο μίας περιόδου και σύγκρινε με τη θεωρία.','Με L_s = 2 mH οι παλμοί διευρύνονται και η κορυφή μειώνεται.'],
  build(o){
   return project([C('V1','VAC',260,210,{Vpk:230*Math.SQRT2,f:50,Ls:+o.Ls},{rot:1,label:'v_s',lbl:'below'}),C('D1','D',200,160,{},{rot:3}),C('D3','D',200,260,{},{rot:3}),J('JA',200,210),C('D2','D',320,160,{},{rot:3}),C('D4','D',320,260,{},{rot:3}),J('JB',320,210),
     J('JP',200,110),J('JPR',320,110),J('JN',200,310),J('JNR',320,310),C('R1','R',440,170,{R:2},{rot:1,label:'R'}),C('E1','VDC',440,260,{V:+o.E},{label:'E'}),gnd(200,340)],
    [['JA','V1:n'],['V1:p','JB'],['D1:a','JA'],['JA','D3:k'],['D2:a','JB'],['JB','D4:k'],['D1:k','JP'],['JP','JPR',[],{name:'v_d+'}],['JPR','D2:k'],['JPR','R1:a',[[440,110]]],['R1:b','E1:p'],
     ['D3:a','JN'],['JN','JNR'],['JNR','D4:a'],['JNR','E1:n',[[440,310]]],['JN','G1:g']],
    {sim:{hDiv:2000,speed:2,stopT:0},scope:{panes:[[['V:V1','v_s']],[['I:R1','i_o']]],window:{unit:'T',n:2}}});}});
 // ------------------------------------------------------------------ buck voltage loop
 // PI: integral-dominant, crossover well below f0. PID: two zeros at 0.7·ω0 cancel the LC pair,
 // crossover f_c = K_i·V_in/2π = 2 kHz (f_s/25), derivative filter T_f = T_s/2.
 function vloopGains(ctrl,Vin,L,Cc){const w0=1/Math.sqrt(L*Cc);if(ctrl==='pi')return {Kp:.01,Ki:60,Kd:0,Tf:0,w0};const Ki=2*Math.PI*2000/Vin,wz=.7*w0;return {Kp:+(2*Ki/wz).toPrecision(3),Ki:+Ki.toPrecision(3),Kd:+(Ki/wz/wz).toPrecision(3),Tf:10e-6,w0,wz};}
 T.push({id:'buck_vloop',group:'Έλεγχος',title:'Buck με βρόχο τάσης (PI / PID)',theory:'formula',topology:'buck_vloop',
  options:[{k:'ctrl',label:'Ελεγκτής',options:[['pi','PI (K_p = 0,01, K_i = 60)'],['pid','PID (μηδενικά στο 0,7·ω₀)']],def:'pi'},{k:'steps',label:'Διαταραχές',options:[['both','Βήμα αναφοράς 12 → 15 V και φορτίου 5 → 10 A'],['ref','Μόνο βήμα αναφοράς'],['load','Μόνο βήμα φορτίου']],def:'both'}],
  desc:'Buck 24 V → 12 V, L = 100 μH, C = 100 μF, f_s = 50 kHz. Το PWM μετρά την τάση εξόδου μία φορά ανά περίοδο και διορθώνει το D. Η ισχύς προς το φορτίο φτάνει μέσα από το φίλτρο LC, με συντονισμό στο f₀ = 1,59 kHz και Q = 3. Με PI το κέρδος πρέπει να μείνει χαμηλά για να μην ταλαντωθεί στο f₀. Με PID τα δύο μηδενικά αντισταθμίζουν τους πόλους LC και ο βρόχος γίνεται 10 φορές πιο γρήγορος.',
  tasks:['Τρέξε έως το τέλος (⏩) και άνοιξε «Δείκτες απόκρισης» δίπλα στο scope: διάλεξε v_o και το βήμα αναφοράς στα 4 ms.','Σύγκρινε PI και PID: υπερύψωση, χρόνος ανόδου, χρόνος αποκατάστασης (±2 %), IAE.','Βήμα φορτίου στα 10 ms: μέγιστη πτώση και χρόνος επαναφοράς. Γιατί το PID δεν πέφτει κάτω από ~1,7 V; (το D φτάνει στο D_max)','Δοκίμασε K_i = 150 στο PI από τις ρυθμίσεις του PWM1: ο βρόχος ταλαντώνεται στο f₀.'],
  build(o){const Vin=24,L=100e-6,Cc=100e-6,g=vloopGains(o.ctrl,Vin,L,Cc);const ref=o.steps==='load'?'15':o.steps==='ref'?'0:12, 0.004:15':'0:12, 0.004:15',v0=o.steps==='load'?15:12,R0=3;
   const Rs=o.steps==='ref'?'':'0:3, 0.010:1.5';
   return project([C('V1','VDC',100,210,{V:Vin},{label:'V_in'}),gnd(100,300),C('S1','SW',200,150,{pwm:'PWM1',out:'a',body:false},{rot:3}),J('J1',270,150),C('D1','D',270,200,{},{rot:3}),
     C('L1','L',340,150,{L,i0:v0/R0}),J('J2',430,150),C('C1','C',430,210,{C:Cc,v0},{label:'C'}),C('R1','R',520,210,{R:R0,sched:Rs},{rot:1,label:'R'}),
     J('J3',100,270),J('J4',270,270),J('J5',430,270),C('PWM1','PWM',200,60,{fs:50e3,mode:'pi',sensor:'C1',qty:'V',ref,Kp:g.Kp,Ki:g.Ki,Kd:g.Kd,Tf:g.Tf,ff:'const',D0:.5,dmin:0,dmax:.95})],
    [['V1:p','S1:d',[[100,150]]],['S1:s','J1'],['J1','L1:a'],['J1','D1:k'],['L1:b','J2',[],{name:'v_o'}],['J2','C1:p'],['J2','R1:a',[[520,150]]],
     ['V1:n','J3'],['J3','G1:g'],['J3','J4'],['J4','D1:a'],['J4','J5'],['J5','C1:n'],['J5','R1:b',[[520,270]]]],
    {sim:{hDiv:100,speed:300,stopT:18e-3},scope:{panes:[[['V:C1','v_o'],['REF:PWM1','v_ref']],[['I:L1','i_L']],[['D:PWM1','D']]],window:{unit:'T',n:900}},meta:{g,Vin,L,C:Cc,R0,fs:50e3,steps:o.steps}});}});
 // ------------------------------------------------------------------ single-phase thyristor bridge
 T.push({id:'scr1',group:'Ανορθωτές',title:'Ελεγχόμενος ανορθωτής γέφυρας (θυρίστορ)',theory:'formula',topology:'scr1',
  options:[{k:'load',label:'Φορτίο',options:[['r','R = 10 Ω'],['rl','R = 10 Ω + L = 0,5 H (συνεχές ρεύμα)']],def:'r'},{k:'alpha',label:'Γωνία έναυσης α',options:[['0','0°'],['30','30°'],['60','60°'],['90','90°']],def:'60'}],
  desc:'Πηγή 230 V / 50 Hz και τέσσερα θυρίστορ. Τα Q2, Q3 ανάβουν στη γωνία α της θετικής ημιπεριόδου και τα Q1, Q4 στο α + 180°. Με ωμικό φορτίο το ρεύμα μηδενίζεται στο τέλος κάθε ημιπεριόδου: V_d = (V̂/π)(1 + cos α). Με μεγάλη L το ρεύμα δεν σβήνει, η v_d γίνεται και αρνητική μετά το π, και V_d = (2V̂/π)·cos α.',
  tasks:['Άλλαξε ζωντανά τη γωνία α με τον ρυθμιστή δίπλα στο scope και δες τη μέση τάση στη στήλη «Μέση».','Σύγκρινε R και R–L για την ίδια α: πού αρχίζει να άγει το επόμενο ζεύγος;','Με R–L, η ισχύς της πηγής έχει μέση τιμή V_d·I_d αλλά και άεργη: συντελεστής μετατόπισης cos α.'],
  build(o){const a=+o.alpha,rl=o.load==='rl',Vpk=230*Math.SQRT2,sc=(id,x,y,shift)=>C(id,'SCR',x,y,{refsrc:'V1',alpha:a,shift,pw:20},{rot:3});
   const Id=2*Vpk/Math.PI*Math.cos(a*Math.PI/180)/10;
   const comps=[C('V1','VAC',330,210,{Vpk,f:50},{rot:1,label:'v_s',lbl:'above'}),sc('Q1',200,160,180),sc('Q3',200,260,0),J('JA',200,210),sc('Q2',460,160,0),sc('Q4',460,260,180),J('JB',460,210),
    J('JP',200,110),J('JPR',460,110),J('JN',200,310),J('JNR',460,310),gnd(200,340)];
   const wires=[['JA','V1:n'],['V1:p','JB'],['Q1:a','JA'],['JA','Q3:k'],['Q2:a','JB'],['JB','Q4:k'],['Q1:k','JP'],['JP','JPR',[],{name:'v_d'}],['JPR','Q2:k'],['Q3:a','JN'],['JN','JNR'],['JNR','Q4:a'],['JN','G1:g']];
   if(rl){comps.push(C('R1','R',600,170,{R:10},{rot:1,label:'R'}),C('L1','L',600,260,{L:.5,i0:+Id.toFixed(4)},{rot:1,label:'L'}));wires.push(['JPR','R1:a',[[600,110]]],['R1:b','L1:a'],['L1:b','JNR',[[600,310]]]);}
   else{comps.push(C('R1','R',600,210,{R:10},{rot:1,label:'R'}));wires.push(['JPR','R1:a',[[600,110]]],['R1:b','JNR',[[600,310]]]);}
   return project(comps,wires,{sim:{hDiv:2000,speed:2,stopT:0},scope:{panes:[[['V:V1','v_s'],['VN:JPR:j','v_d']],[['I:R1','i_d'],['I:V1','i_s']],[['I:Q2','i_Q2'],['I:Q1','i_Q1']]],window:{unit:'T',n:2}}});}});
 // ------------------------------------------------------------------ three-phase bridge
 T.push({id:'bridge3',group:'Ανορθωτές',title:'Τριφασική γέφυρα 6 παλμών',theory:'formula',topology:'bridge3',
  options:[{k:'dev',label:'Στοιχεία',options:[['diode','Δίοδοι'],['30','Θυρίστορ α = 30°'],['60','Θυρίστορ α = 60°']],def:'diode'},{k:'load',label:'Φορτίο',options:[['r','R = 20 Ω'],['rl','R = 20 Ω + L = 50 mH']],def:'r'}],
  desc:'Τριφασική πηγή 400 V πολική (325 V φασική κορυφή), 50 Hz. Κάθε στιγμή άγει το θυρίστορ της πάνω σειράς με τη μεγαλύτερη φασική τάση και αυτό της κάτω με τη μικρότερη, άρα η v_d είναι η περιβάλλουσα των πολικών τάσεων, με κυμάτωση 300 Hz. V_d = (3√3/π)·V̂_φ·cos α = 1,35·V_LL·cos α. Η α μετριέται από το σημείο φυσικής μετάβασης, 30° μετά τη διάβαση της φασικής τάσης από το μηδέν.',
  tasks:['Scope: v_P και v_N ως προς τον ουδέτερο είναι η πάνω και η κάτω περιβάλλουσα των φασικών τάσεων.','Ρεύμα φάσης i_a: δύο παλμοί 120° ανά περίοδο. Με R–L γίνεται σχεδόν ορθογώνιο, με RMS √(2/3)·I_d.','Με θυρίστορ άλλαξε ζωντανά την α: μέχρι 60° η αγωγή μένει συνεχής και με ωμικό φορτίο.'],
  build(o){const scr=o.dev!=='diode',a=scr?+o.dev:0,rl=o.load==='rl';
   const dev=(id,x,y,shift)=>scr?C(id,'SCR',x,y,{refsrc:'V1',alpha:a,shift,pw:120},{rot:3}):C(id,'D',x,y,{},{rot:3});
   const comps=[C('V1','VAC3',100,210,{Vpk:325,f:50},{label:'v_abc'}),C('G1','GND',100,280,{},{label:'0 V'}),
    dev('Q1',260,130,30),dev('Q3',380,130,150),dev('Q5',500,130,270),dev('Q4',260,290,210),dev('Q6',380,290,330),dev('Q2',500,290,90),
    J('JA',260,190),J('JB',380,210),J('JC',500,230),J('JP1',260,70),J('JP3',380,70),J('JP5',500,70),J('JN1',260,350),J('JN3',380,350),J('JN5',500,350)];
   const wires=[['V1:a','JA'],['V1:b','JB'],['V1:c','JC'],['V1:n','G1:g'],['Q1:a','JA'],['JA','Q4:k'],['Q3:a','JB'],['JB','Q6:k'],['Q5:a','JC'],['JC','Q2:k'],
    ['Q1:k','JP1'],['JP1','JP3',[],{name:'P'}],['JP3','Q3:k'],['JP3','JP5'],['JP5','Q5:k'],['Q4:a','JN1'],['JN1','JN3',[],{name:'N'}],['JN3','Q6:a'],['JN3','JN5'],['JN5','Q2:a']];
   const Id=3*Math.sqrt(3)/Math.PI*325*Math.cos(a*Math.PI/180)/20;
   if(rl){comps.push(C('R1','R',640,170,{R:20},{rot:1,label:'R'}),C('L1','L',640,260,{L:.05,i0:+Id.toFixed(4)},{rot:1,label:'L'}));wires.push(['JP5','R1:a',[[640,70]]],['R1:b','L1:a'],['L1:b','JN5',[[640,350]]]);}
   else{comps.push(C('R1','R',640,210,{R:20},{rot:1,label:'R'}));wires.push(['JP5','R1:a',[[640,70]]],['R1:b','JN5',[[640,350]]]);}
   return project(comps,wires,{sim:{hDiv:3000,speed:2,stopT:0},scope:{panes:[[['VN:JP1:j','v_P'],['VN:JN1:j','v_N'],['V:V1','v_an']],[['V:R1','v_R']],[['I:V1','i_a'],['Ib:V1','i_b']]],window:{unit:'T',n:2}}});}});
 // ------------------------------------------------------------------ bidirectional battery (PE2)
 T.push({id:'battery',group:'Αμφίδρομος · μπαταρία (PE2)',title:'Αμφίδρομος μετατροπέας μπαταρίας',theory:'bidir',topology:'bidir',
  options:[{k:'pos',label:'Θέση αποθήκευσης',options:[['above','> 50 V (60–100 V)'],['below','< 50 V (25–40 V)']],def:'above'},
   {k:'vst',label:'V_st',options:[['min','ελάχιστη'],['mid','μέση'],['max','μέγιστη']],def:'max'},
   {k:'dir',label:'Ισχύς',options:[['dis','Εκφόρτιση +40 kW'],['chg','Φόρτιση −40 kW']],def:'dis'},
   {k:'bus',label:'Ζυγός',options:[['ideal','Ιδανική πηγή 50 V (ερ. 5)'],['system','Πηγή 50 V/1 mΩ + C + φορτίο']],def:'ideal'},
   {k:'ctrl',label:'Έλεγχος',options:[['fixed','Σταθερό D = D₀ (χειροκίνητα ζωντανά)'],['zero','D₀ με i_L(0) = 0'],['pulse','Παλμός ΔD: φόρτιση ↔ εκφόρτιση'],['pi','PI ρεύματος + αναστροφή στα 3 ms']],def:'fixed'},
   {k:'sw',label:'Διακόπτες',options:[['ideal','Ιδανικοί (R_on = 0,1 μΩ)'],['real','MOSFET 1 mΩ · δίοδος 0,8 V · t_d = 200 ns · E_on/E_off']],def:'ideal'}],
  desc:'Σύγχρονη ημιγέφυρα ανάμεσα σε ζυγό 50 V και αποθήκευση. Το πηνίο είναι πάντα στη χαμηλή πλευρά και D είναι το duty του κάτω S2. Με αποθήκευση > 50 V η εκφόρτιση είναι buck, με < 50 V είναι boost. Η φορά της ισχύος αλλάζει μόνο μέσω του ρεύματος: στο D₀ = 1 − V_lo/V_hi το ρεύμα μένει όπου είναι.',
  tasks:['«Σταθερό D»: μετακίνησε ζωντανά το D λίγο πάνω ή κάτω από το D₀. Το ρεύμα περνά από το μηδέν και η ισχύς αλλάζει φορά, και όταν επιστρέψεις στο D₀ μένει εκεί.','«i_L(0) = 0»: χωρίς σωστό αρχικό ρεύμα το κύκλωμα δεν πάει ποτέ στα 40 kW.','«Πηγή + C + φορτίο»: στα 5 ms το φορτίο πέφτει 60 → 30 kW, η μονόδρομη πηγή μπλοκάρει και ο ζυγός ανεβαίνει.','«Πραγματικοί διακόπτες»: με σταθερό D το ρεύμα ολισθαίνει (νεκρός χρόνος, πτώσεις τάσης). Με PI μένει στην αναφορά. Scope: απώλειες μεταγωγής p_sw και αγωγής p των S1, S2.'],
  build(o){
   const above=o.pos!=='below',win=above?{min:60,mid:80,max:100}:{min:25,mid:32.5,max:40},vst=win[o.vst]||win.max,P=o.dir==='chg'?-40e3:40e3,fs=20e3,L=5.6e-6;
   const vbus=50,vlo=above?vbus:vst,vhi=above?vst:vbus,D0=1-vlo/vhi,I=above?-P/vbus:P/vst,sys=o.bus==='system';
   const g=piGains(L,vhi,fs);const dt=L*Math.abs(2*I)/(vhi*.05);
   let pwm={fs,mode:'fixed',D:+D0.toFixed(6)},i0=o.ctrl==='zero'?0:I;
   if(o.ctrl==='pulse'){const sgn=Math.sign(-2*I);const t1=1e-3,t2=t1+Math.round(dt*fs)/fs;pwm.dsched=`0:${D0.toFixed(6)}, ${t1}:${(D0+sgn*.05).toFixed(6)}, ${t2.toFixed(6)}:${D0.toFixed(6)}`;}
   if(o.ctrl==='pi'){pwm={fs,mode:'pi',sensor:'L1',qty:'I',ref:sys?`0:${I.toFixed(3)}`:`0:${I.toFixed(3)}, 0.003:${(-I).toFixed(3)}`,Kp:+g.kp.toPrecision(5),Ki:+g.ki.toPrecision(5),ff:'ratio',ffA:above?(sys?'CB':'VB'):'VS',ffB:above?'VS':(sys?'CB':'VB'),dmin:.01,dmax:.99};i0=sys?I:0;}
   if(sys&&o.ctrl!=='pi')i0=I;
   const real=o.sw==='real',sw=real?{Ron:1e-3,body:true,Vfd:.8,Rd:1e-3,Eon:1.2e-3,Eoff:.9e-3,Vref:100,Iref:800}:{Ron:1e-7,body:true};if(real)pwm.dt=200e-9;
   const comps=[C('L1','L',360,170,{L,i0:+i0.toFixed(4)}),J('JM',430,170),C('S1','SW',430,100,{pwm:'PWM1',out:'na',...sw}),C('S2','SW',430,220,{pwm:'PWM1',out:'a',...sw}),J('J2',430,300),C('PWM1','PWM',200,60,pwm)];
   const wires=[['L1:b','JM'],['S1:s','JM'],['JM','S2:d'],['J2','S2:s']];
   const bus=(x)=>{ // bus side, either ideal or full system; x = connection point column
    if(!sys){comps.push(C('VB','VDC',x,230,{V:vbus},{label:'V_bus'}));return ['VB','VB'];}
    const vb0=(50+Math.sqrt(Math.max(0,2500-4e-3*(60e3-(above?P:P)))))/2;
    comps.push(C('VSRC','VDC',x-140,230,{V:50,Rs:1e-3,uni:true},{label:'V_src'}),C('CB','C',x,230,{C:.1,esr:2e-4,v0:+vb0.toFixed(4)},{label:'C_bus'}),C('LD','CPL',x+100,230,{P:60e3,sched:'0:60000, 0.005:30000'},{label:'Φορτίο'}));
    return ['VSRC','CB','LD'];};
   if(above){ // bus low (left), storage high (right)
    const ids=bus(sys?190:100);comps.push(C('VS','VDC',540,190,{V:vst},{label:'V_st'}),gnd(sys?100:100,330));
    wires.push(['S1:d','VS:p',[[430,60],[540,60]]],['J2','VS:n',[[540,300]]]);
    if(!sys){wires.push(['VB:p','L1:a',[[100,170]],{name:'v_bus'}],['VB:n','J1'],['J1','G1:g'],['J1','J2']);comps.push(J('J1',100,300));comps.find(c=>c.id==='G1').y=330;}
    else{comps.push(J('JC',190,170),J('JL',290,170),J('J1',50,300),J('JC2',190,300),J('JL2',290,300));comps.find(c=>c.id==='G1').x=50;
     wires.push(['VSRC:p','JC',[[50,170]]],['JC','CB:p'],['JC','JL',[],{name:'v_bus'}],['JL','LD:p'],['JL','L1:a'],['VSRC:n','J1'],['J1','G1:g'],['J1','JC2'],['JC2','CB:n'],['JC2','JL2'],['JL2','LD:n'],['JL2','J2']);}
    void ids;
   }else{ // storage low (left), bus high (right)
    comps.push(C('VS','VDC',100,230,{V:vst},{label:'V_st'}),J('J1',100,300),gnd(100,330));
    wires.push(['VS:p','L1:a',[[100,170]]],['VS:n','J1'],['J1','G1:g'],['J1','J2']);
    if(!sys){comps.push(C('VB','VDC',540,190,{V:vbus},{label:'V_bus'}));wires.push(['S1:d','VB:p',[[430,60],[540,60]],{name:'v_bus'}],['J2','VB:n',[[540,300]]]);}
    else{comps.push(C('CB','C',540,190,{C:.1,esr:2e-4,v0:+((50+Math.sqrt(Math.max(0,2500-4e-3*(60e3-P))))/2).toFixed(4)},{label:'C_bus'}),C('LD','CPL',650,190,{P:60e3,sched:'0:60000, 0.005:30000'},{label:'Φορτίο'}),C('VSRC','VDC',760,190,{V:50,Rs:1e-3,uni:true},{label:'V_src'}),
      J('JH1',540,60),J('JH2',650,60),J('JR1',540,300),J('JR2',650,300));
     wires.push(['S1:d','JH1',[[430,60]],{name:'v_bus'}],['JH1','CB:p'],['JH1','JH2'],['JH2','LD:p'],['JH2','VSRC:p',[[760,60]]],['J2','JR1'],['JR1','CB:n'],['JR1','JR2'],['JR2','LD:n'],['JR2','VSRC:n',[[760,300]]]);}
   }
   const busId=sys?'CB':'VB';
   const panes=[[['I:L1','i_L'],...(o.ctrl==='pi'?[['REF:PWM1','I_ref']]:[])],[['V:'+busId,'v_bus'],...(sys?[['I:VSRC','i_src']]:[])],[['D:PWM1','D']]];
   if(sys)panes[1]=[['V:'+busId,'v_bus']],panes.splice(2,0,[['I:VSRC','i_src'],['I:LD','i_φορτίου']]);
   return project(comps,wires,{sim:{hDiv:500,speed:o.ctrl==='fixed'?100:400,stopT:sys?7e-3:0},scope:{panes,window:{unit:'T',n:o.ctrl==='fixed'||o.ctrl==='zero'?20:200}},
    meta:{above,vst,vbus,P,D0,I,vlo,vhi,pi:g,pulse:dt}});}});
 // ------------------------------------------------------------------ sampling (PE2, exercise 2)
 // Carrier position τ (from the period start) of the middle of the S2 ON / OFF interval,
 // and the carrier delay that puts that point at t = 0: t_c = (−τ) mod T.
 function samplingPhase(carrier,D,where){const saw=carrier==='saw';const tau=where==='midon'?(saw?D/2:.5):where==='midoff'?(saw?(1+D)/2:0):0;
  const frac=((-tau)%1+1)%1;return {tau,frac:+frac.toFixed(9),deg:+(360*frac).toFixed(6)};}
 T.push({id:'sampling',group:'Αμφίδρομος · μπαταρία (PE2)',title:'Άσκηση 2 · Επίδραση δειγματοληψίας',theory:'formula',topology:'sampling',
  options:[{k:'case',label:'Δειγματοληψία',options:[['saw','Πριονωτό, trailing-edge · 1 δείγμα στο reset'],['tri1','Συμμετρικό τρίγωνο · 1 δείγμα στο μέγιστο'],['tri2','Συμμετρικό τρίγωνο · 2 δείγματα στα ακρότατα']],def:'saw'},
   {k:'start',label:'Αρχική κατάσταση',options:[['midoff','i_L(0) = I_avg στο μέσο του OFF του S2'],['midon','i_L(0) = I_avg στο μέσο του ON του S2'],['none','i_L(0) = I_avg χωρίς μετατόπιση φέροντος']],def:'midoff'},
   {k:'vst',label:'V_st',options:[['min','60 V'],['mid','80 V'],['max','100 V']],def:'max'},
   {k:'dir',label:'Ισχύς',options:[['dis','Εκφόρτιση +40 kW'],['chg','Φόρτιση −40 kW']],def:'dis'},
   {k:'ctrl',label:'Έλεγχος',options:[['fixed','Ανοιχτός βρόχος: D = D₀'],['pi','PI ρεύματος με το δείγμα · D_ff από τις μετρούμενες τάσεις']],def:'fixed'},
   {k:'upd',label:'Ενημέρωση D',options:[['single','Μία φορά ανά T (στην αρχή)'],['double','Δύο φορές ανά T (και στο ελάχιστο του τριγώνου)']],def:'single'},
   {k:'sw',label:'Διακόπτες',options:[['ideal','Ιδανικοί'],['real','MOSFET 1 mΩ · δίοδος 0,8 V · t_d = 200 ns']],def:'ideal'}],
  desc:'Η διάταξη της Άσκησης 1 (ζυγός 50 V, αποθήκευση 60–100 V, L = 5,6 μH, 20 kHz) με ένα μπλοκ Sample & Hold στο ρεύμα του πηνίου. Το S&H παίρνει δείγματα σε σημεία του ίδιου φέροντος που οδηγεί τη φάση: στο reset του πριονωτού, στο μέγιστο του τριγώνου, ή και στα δύο ακρότατα του τριγώνου. Στο scope φαίνονται το πραγματικό i_L, τα δείγματα (κουκκίδες) και η κρατημένη τιμή ως βαθμίδες, μαζί με το φέρον, το D και το gate του S2.',
  tasks:['Πριονωτό: το δείγμα στο reset πέφτει στην κοιλάδα του ρεύματος, Δi/2 κάτω από τη μέση τιμή. Στο τρίγωνο το δείγμα στο μέγιστο είναι η μέση τιμή.','Τρίγωνο με 2 δείγματα: 100 δείγματα σε 50 περιόδους, και τα δύο ίσα με τη μέση τιμή σε μόνιμη κατάσταση.','«Χωρίς μετατόπιση» στο πριονωτό: το i_L(0) = I_avg πέφτει στην κοιλάδα και όλη η κυματομορφή μετατοπίζεται κατά Δi/2.','Άλλαξε ζωντανά τη μετατόπιση του φέροντος (π.χ. 90°: το πρώτο reset έρχεται στα 12,5 μs) ή τον κανόνα δειγματοληψίας από τον πίνακα ζωντανών παραμέτρων.','«PI με το δείγμα»: ο ελεγκτής κρατά το δείγμα στην αναφορά. Με πριονωτό η μέση τιμή απέχει Δi/2 από την αναφορά, με τρίγωνο όχι. Στα 2 ms η αναφορά πέφτει στο μισό και στα 5 ms αλλάζει η V_st: το D_ff την ακολουθεί μέσω των μετρούμενων τάσεων.','Τρίγωνο με 2 δείγματα και «Δύο φορές ανά T»: ο PI τρέχει με T_s = T/2 και η ακμή σβησίματος χρησιμοποιεί το δεύτερο δείγμα. Σύγκρινε το βήμα αναφοράς στα 2 ms με τη μία ενημέρωση.'],
  build(o){
   const vst=({min:60,mid:80,max:100})[o.vst]||100,vbus=50,P=o.dir==='chg'?-40e3:40e3,fs=20e3,L=5.6e-6,Tsw=1/fs;
   const D0=1-vbus/vst,I=-P/vbus,dI=vbus*D0/(L*fs),saw=o.case==='saw',carrier=saw?'saw':'triangle',trig=o.case==='tri2'?'both':'start';
   const ph=samplingPhase(carrier,D0,o.start),pi=o.ctrl==='pi',g=piGains(L,vst,fs),vst2=vst===80?100:80;
   const real=o.sw==='real',sw=real?{Ron:1e-3,body:true,Vfd:.8,Rd:1e-3}:{Ron:1e-7,body:true};
   const pwm=pi?{fs,mode:'pi',carrier,phase:ph.deg,upd:o.upd==='double'?'double':'single',sensor:'SH1',qty:'I',ref:`0:${I.toFixed(3)}, 0.002:${(I/2).toFixed(3)}`,Kp:+g.kp.toPrecision(5),Ki:+g.ki.toPrecision(5),ff:'ratio',ffA:'VB',ffB:'VS',dmin:.01,dmax:.99}
    :{fs,mode:'fixed',D:+D0.toFixed(6),carrier,phase:ph.deg,upd:o.upd==='double'?'double':'single'};if(real)pwm.dt=200e-9;
   const comps=[C('VB','VDC',100,230,{V:vbus},{label:'V_bus'}),J('J1',100,300),gnd(100,330),C('L1','L',360,170,{L,i0:+I.toFixed(4)}),J('JM',430,170),
    C('S1','SW',430,100,{pwm:'PWM1',out:'na',...sw}),C('S2','SW',430,220,{pwm:'PWM1',out:'a',...sw}),J('J2',430,300),
    C('VS','VDC',540,190,{V:vst,sched:pi?`0:${vst}, 0.005:${vst2}`:''},{label:'V_st'}),C('PWM1','PWM',200,60,pwm),
    C('SH1','SH',90,105,{src:'L1',qty:'I',clock:'PWM1',trig,init:'value',h0:+I.toFixed(4)},{label:'S&H'})];
   const wires=[['VB:p','L1:a',[[100,170]],{name:'v_bus'}],['VB:n','J1'],['J1','G1:g'],['J1','J2'],['L1:b','JM'],['S1:s','JM'],['JM','S2:d'],['J2','S2:s'],
    ['S1:d','VS:p',[[430,60],[540,60]]],['J2','VS:n',[[540,300]]]];
   const panes=pi?[[['I:L1','i_L'],['H:SH1','i_L,hold'],['REF:PWM1','I_ref']],[['D:PWM1','D']]]:[[['I:L1','i_L'],['H:SH1','i_L,hold']],[['CAR:PWM1','φέρον c(t)'],['D:PWM1','D'],['G:PWM1','g_S2']],[['GS:S2','g_S2'],['GS:S1','g_S1']]];
   return project(comps,wires,{sim:{hDiv:500,speed:pi?300:20,stopT:pi?8e-3:0},scope:{panes,window:{unit:'T',n:pi?160:4}},
    meta:{vbus,vst,vst2,P,D0,I,dI,L,fs,T:Tsw,carrier,trig,upd:o.upd,saw:saw?1:0,nps:trig==='both'?2:1,start:o.start,tau0:ph.tau,phaseDeg:ph.deg,tc:ph.frac*Tsw,pi,real,g}});}});
 // ------------------------------------------------------------------ polyphase (PE2, exercise 2)
 // Ideal periodic inductor current around its mean (units of Δi, −½ … ½), rising while S2 conducts,
 // at carrier position u = τ/T. Sawtooth: S2 ON for u ∈ [0, D); triangle: ON around u = ½.
 function rippleDev(u,D,saw){u=((u%1)+1)%1;D=Math.min(Math.max(D,1e-9),1-1e-9);
  if(saw)return u<D?-.5+u/D:.5-(u-D)/(1-D);const a=(1-D)/2,b=(1+D)/2;if(u>=a&&u<b)return -.5+(u-a)/D;const v=((u-b)%1+1)%1;return .5-v/(1-D);}
 // equal sharing and L per leg from Δi_k ≤ k·|I_k| over the window (Δi_k grows with D: worst at the highest V_st)
 function polyDesign({vbus,vmax,P,N,fs,k=.3}){const Ik=Math.abs(P)/(N*vbus),Dmax=1-vbus/vmax;return {Ik,Dmax,L:vbus*Dmax/(k*Ik*fs),Ipk:Ik*(1+k/2)};}
 // storage voltages where N·D is an integer: ideal cancellation of the summed ripple with shifted drive
 function polyCancel(vbus,N,vmin,vmax){const out=[];for(let m=1;m<N;m++){const v=vbus/(1-m/N);if(v>=vmin-1e-9&&v<=vmax+1e-9)out.push(v);}return out;}
 T.push({id:'polyphase',group:'Αμφίδρομος · μπαταρία (PE2)',title:'Άσκηση 2 · Πολυφασική σχεδίαση',theory:'formula',topology:'polyphase',
  options:[{k:'N',label:'Κλάδοι N',options:[['2','2'],['3','3'],['4','4'],['5','5'],['6','6']],def:'4'},
   {k:'drive',label:'Οδήγηση',options:[['shift','Μετατοπισμένη: Δt_k = k·T/N'],['common','Συμφασική (κοινή φάση)']],def:'shift'},
   {k:'vst',label:'V_st',options:[['min','60 V'],['mid','80 V'],['max','100 V'],['cancel','Σημείο ακύρωσης (N·D ακέραιος)']],def:'mid'},
   {k:'fs',label:'f_PWM',options:[['20000','20 kHz'],['40000','40 kHz (δεύτερη συχνότητα)']],def:'20000'},
   {k:'L',label:'L ανά κλάδο',options:[['design','L_min για Δi_k ≤ 30 % |I_k| στην επιλεγμένη f'],['keep','Το L των 20 kHz']],def:'design'},
   {k:'dir',label:'Ισχύς',options:[['dis','Εκφόρτιση +40 kW'],['chg','Φόρτιση −40 kW']],def:'dis'},
   {k:'ctrl',label:'Έλεγχος',options:[['open','Ανοιχτός βρόχος, κοινό D'],['pi','PI ρεύματος ανά φάση (αναφορά P/N ανά κλάδο)']],def:'open'},
   {k:'mis',label:'Κλάδοι',options:[['none','Όμοιοι, ιδανικά πηνία'],['dcr','R πηνίων 5 mΩ, ο κλάδος 2 έχει 7,5 mΩ'],['L','R πηνίων 5 mΩ, ο κλάδος 2 έχει L + 20 %']],def:'none'}],
  desc:'N όμοιοι κλάδοι ημιγέφυρας ανάμεσα στον ζυγό 50 V και την αποθήκευση, ο καθένας με δικό του ασύζευκτο πηνίο, ίδιο duty και ίδια συχνότητα. Τα φέροντα έχουν κοινό ρολόι. Στη μετατοπισμένη οδήγηση ο κλάδος k καθυστερεί κατά k·T/N. Το ρεύμα του ζυγού είναι το άθροισμα των ρευμάτων των κλάδων. Κάθε κλάδος ξεκινά από την περιοδική του κυματομορφή στη δική του φάση, με κοινό μέσο ρεύμα P/(N·V_bus).',
  tasks:['Σύγκρινε συμφασική και μετατοπισμένη οδήγηση: η κυμάτωση κάθε κλάδου είναι ίδια, η κυμάτωση του αθροίσματος όχι.','Μετατοπισμένα, η κυμάτωση του αθροίσματος έχει συχνότητα N·f. Στο «σημείο ακύρωσης» (N·D ακέραιος) μηδενίζεται θεωρητικά.','Στον πίνακα ζωντανών παραμέτρων: «Συμφασικά» ↔ «Μετατοπισμένα» ενώ τρέχει. Η αλλαγή φάσης αφήνει μόνιμη ανισοκατανομή: με ιδανικούς κλάδους και ίδιο duty τίποτα δεν τη διορθώνει. Γι\' αυτό στην πράξη κάθε φάση έχει δικό της βρόχο ρεύματος.','N = 4 → 5 με την ίδια ισχύ: το ρεύμα ανά κλάδο πέφτει, και το L_min ανεβαίνει ανάλογα με το N για το ίδιο σχετικό κριτήριο.','40 kHz με «το L των 20 kHz»: η κυμάτωση μισή. Με «L_min» το L μισό και η ίδια κυμάτωση (L·f σταθερό).','«R 7,5 mΩ στον κλάδο 2» με ανοιχτό βρόχο: ο κλάδος 2 παίρνει λιγότερο ρεύμα (τα ρεύματα μοιράζονται αντίστροφα με τις αντιστάσεις). Με «PI ανά φάση» κάθε κλάδος κρατά P/N.','«PI ανά φάση» και «Συμφασικά» ↔ «Μετατοπισμένα» ζωντανά: η ανισοκατανομή μετά την αλλαγή φάσης διορθώνεται μόνη της.'],
  build(o){const N=Math.min(6,Math.max(1,+o.N||4)),vbus=50,P=o.dir==='chg'?-40e3:40e3,fs=+o.fs||20e3,Tsw=1/fs,shift=o.drive!=='common';
   const canc=polyCancel(vbus,N,60,100),pick=canc.find(v=>![60,80,100].some(x=>Math.abs(x-v)<1e-6))??canc[0]??100;
   const vst=+(o.vst==='cancel'?pick:({min:60,mid:80,max:100})[o.vst]||80).toPrecision(10);
   const d20=polyDesign({vbus,vmax:100,P,N,fs:20e3}),dd=polyDesign({vbus,vmax:100,P,N,fs}),Lx=o.L==='keep'?d20.L:dd.L,e=10**(Math.floor(Math.log10(Lx))-5),L=+(Math.ceil(Lx/e-1e-9)*e).toPrecision(6); // rounded up: stays inside the criterion
   const pi=o.ctrl==='pi',mis=o.mis||'none',Rs=mis==='none'?0:5e-3,Rk=k=>mis==='dcr'&&k===1?7.5e-3:Rs,Lk=k=>mis==='L'&&k===1?+(1.2*L).toPrecision(6):L;
   // with winding resistance the open-loop duty must also cover R·I: V_bus − (1 − D)·V_st − R·I_k = 0
   const D=1-(vbus-Rs*(-P/(N*vbus)))/vst,Ik=-P/(N*vbus),dI=vbus*D/(L*fs),phases=[...Array(N).keys()].map(k=>shift?+(360*k/N).toFixed(6):0);
   const y0=90,pitch=150,xb=300,xm=420,xv=560,comps=[C('VB','VDC',200,150,{V:vbus},{label:'V_bus'}),C('G0','GND',200,200,{},{label:'0 V'}),C('VS','VDC',640,150,{V:vst},{label:'V_st'}),C('GV','GND',640,200,{},{label:'0 V'})];
   const wires=[['VB:p','JB1',[[200,y0]],{name:'v_bus'}],['VB:n','G0:g'],['JV1','VS:p',[[640,y0]]],['VS:n','GV:g']];
   const g=piGains(L,vst,fs);
   for(let k=0;k<N;k++){const i=k+1,y=y0+pitch*k,sw={pwm:'PWM'+i,Ron:1e-7,body:true},u0=((-phases[k]/360)%1+1)%1,i0=Ik+vbus*D/(Lk(k)*fs)*rippleDev(u0,D,false);
    const pwm=pi?{fs,mode:'pi',carrier:'triangle',phase:phases[k],sensor:'L'+i,qty:'I',ref:String(+Ik.toFixed(4)),Kp:+g.kp.toPrecision(5),Ki:+g.ki.toPrecision(5),ff:'ratio',ffA:'VB',ffB:'VS',dmin:.01,dmax:.99}
     :{fs,D:+D.toFixed(8),carrier:'triangle',phase:phases[k]};
    comps.push(J('JB'+i,xb,y),C('L'+i,'L',350,y,{L:Lk(k),i0:+i0.toFixed(4),Rs:Rk(k)}),J('JM'+i,xm,y),C('S1'+i,'SW',470,y,{...sw,out:'na'},{rot:1,label:'S1.'+i}),C('S2'+i,'SW',xm,y+60,{...sw,out:'a'},{label:'S2.'+i}),
     C('GS'+i,'GND',xm,y+100,{},{label:''}),J('JV'+i,xv,y),C('PWM'+i,'PWM',50,290+60*k,pwm));
    wires.push(['JB'+i,'L'+i+':a'],['L'+i+':b','JM'+i],['JM'+i,'S1'+i+':s'],['S1'+i+':d','JV'+i],['JM'+i,'S2'+i+':d'],['S2'+i+':s','GS'+i+':g']);
    if(k<N-1)wires.push(['JB'+i,'JB'+(i+1)],['JV'+i,'JV'+(i+1)]);}
   const panes=[[...[...Array(N).keys()].map(k=>['I:L'+(k+1),'i_L'+(k+1)])],[['I:VB','i_Σ (ζυγός)']],[...[...Array(N).keys()].map(k=>['GS:S2'+(k+1),'g_S2.'+(k+1)])]];
   const slow=mis!=='none'||pi;
   return project(comps,wires,{sim:{hDiv:slow?200:400,speed:slow?400:20,stopT:slow?.02:0},scope:{panes,window:slow?{unit:'T',n:400}:{unit:'T',n:3}},
    meta:{N,vbus,vst,P,fs,T:Tsw,L,D,Ik,dI,shift,phases,canc,vmin:60,vmax:100,Lmin:dd.L,L20:d20.L,Ipk:dd.Ipk,k:.3,pi,mis,Rs,R2:Rk(1),L2:Lk(1)}});}});
 // ------------------------------------------------------------------ empty
 // ------------------------------------------------------------------ 3.0: current loop from signal blocks
 T.push({id:'blocks_loop',group:'Μπλοκ σημάτων (3.0)',title:'Βρόχος ρεύματος από μπλοκ',theory:'formula',topology:'blocks_loop',
  options:[{k:'ctrl',label:'Ελεγκτής',options:[['blocks','PI από μπλοκ (σύρματα σημάτων)'],['builtin','Ενσωματωμένος PI του PWM (σύγκριση)']],def:'blocks'},
   {k:'mod',label:'Διαμορφωτής',options:[['pwm','Μπλοκ PWM με είσοδο d'],['cmp','Φέρον + συγκριτής → πύλη του S1']],def:'pwm'},
   {k:'delay',label:'Καθυστέρηση υπολογισμού',options:[['none','Καμία: το D ισχύει από το ίδιο δείγμα'],['z1','z⁻¹: το D ισχύει μία περίοδο αργότερα']],def:'none'}],
  desc:'Buck 48 V προς μπαταρία 24 V, L = 100 μH, f_s = 50 kHz. Το ρεύμα του πηνίου μετριέται με αμπερόμετρο σε σειρά. Η αναφορά (σταθερά), το σφάλμα (άθροισμα), ο PI και το duty είναι μπλοκ ενωμένα με σύρματα σημάτων. Το duty φτάνει στον διακόπτη είτε από το μπλοκ PWM (είσοδος d) είτε από φέρον και συγκριτή, που είναι ακριβώς ό,τι κάνει το PWM μέσα του. Βήμα αναφοράς 5 → 10 A στα 2 ms.',
  tasks:['Τρέξε έως το τέλος (⏩). Το i_L ακολουθεί την αναφορά. Δες στην κάρτα θεωρίας τη σειρά με την οποία υπολογίζονται τα μπλοκ.','Διάλεξε «Ενσωματωμένος PI»: ίδια καμπύλη, γιατί ο PI από μπλοκ ενημερώνεται με τους ίδιους κανόνες.','Διάλεξε «Φέρον + συγκριτής»: ίδια συμπεριφορά. Ο συγκριτής σβήνει τον S1 μέσα στο βήμα του λύτη, στη στιγμή που το φέρον περνά το d.','Πρόσθεσε z⁻¹: το περιθώριο φάσης πέφτει κατά ω_c·T (≈ 18°) και εμφανίζεται υπερύψωση μετά το βήμα.','Άλλαξε την αναφορά εν κινήσει από τις ζωντανές παραμέτρους (σταθερά i_ref).'],
  build(o){const Vin=48,Vo=24,L=100e-6,fs=50e3,g=piGains(L,Vin,fs),ref='0:5, 0.002:10',blk=o.ctrl!=='builtin',cmp=blk&&o.mod==='cmp',z1=blk&&o.delay==='z1';
   const kp=+g.kp.toPrecision(4),ki=+g.ki.toPrecision(4),clock=cmp?'CLK1':'PWM1';
   const comps=[C('V1','VDC',100,210,{V:Vin},{label:'V_in'}),gnd(100,300),C('S1','SW',200,150,cmp?{gate:'sig',body:false}:{pwm:'PWM1',out:'a',body:false},{rot:3,flip:true}),J('J1',270,150),C('D1','D',270,200,{},{rot:3}),
     C('L1','L',330,150,{L,i0:5}),C('AM1','AM',400,150,{},{label:'A_L',lbl:'below'}),C('VO','VDC',490,210,{V:Vo},{label:'V_o'}),
     J('J3',100,270),J('J4',270,270)];
   const wires=[['V1:p','S1:d',[[100,150]]],['S1:s','J1'],['J1','L1:a'],['J1','D1:k'],['L1:b','AM1:a'],['AM1:b','VO:p',[[490,150]],{name:'v_o'}],
     ['V1:n','J3'],['J3','G1:g'],['J3','J4'],['J4','D1:a'],['J4','VO:n',[[490,270]]]];
   if(!blk)comps.push(C('PWM1','PWM',200,60,{fs,mode:'pi',carrier:'saw',sensor:'L1',qty:'I',ref,Kp:kp,Ki:ki,ff:'none',dmin:0,dmax:.95}));
   else{comps.push(C('K1','CONST',250,60,{v:ref},{label:'i_ref'}),C('SUM1','SUM',330,70,{signs:'+-'},{label:'e'}),C('PI1','PIB',430,70,{Kp:kp,Ki:ki,clock,trig:'start',y0:0,ymin:0,ymax:.95},{label:'PI'}));
    wires.push(['K1:y','SUM1:a'],['AM1:y','SUM1:b',[[400,100],[290,100],[290,80]]],['SUM1:y','PI1:u']);
    let d='PI1:y';if(z1){comps.push(C('UD1','UD',510,70,{clock,trig:'start',y0:0},{label:'z⁻¹'}));wires.push(['PI1:y','UD1:u']);d='UD1:y';}
    const xd=z1?540:460;
    if(!cmp){comps.push(C('PWM1','PWM',xd+140,70,{fs,mode:'ext',carrier:'saw'}));wires.push([d,'PWM1:d']);}
    else{comps.push(C('CLK1','CLK',120,50,{f:fs,duty:.5},{label:'ρολόι PI'}),C('RMP1','RAMP',xd+60,10,{f:fs,shape:'saw',lo:0,hi:1},{label:'φέρον'}),C('CMP1','CMP',xd+140,70,{},{label:'σύγκριση'}));
     // the gate goes back to S1 through a pair of tags (Goto/From) instead of a long wire
     comps.push(C('TG1','TAGO',xd+210,70,{name:'g_S1'}),C('TF1','TAGI',120,100,{name:'g_S1'}));
     wires.push([d,'CMP1:p'],['RMP1:y','CMP1:n'],['CMP1:y','TG1:u'],['TF1:y','S1:g',[[200,100]]]);}}
   const panes=!blk?[[['I:L1','i_L'],['REF:PWM1','i_ref']],[['D:PWM1','D']]]
    :[[['Y:AM1','i_L (αμπερόμετρο)'],['Y:K1','i_ref']],cmp?[['Y:'+(z1?'UD1':'PI1'),'d'],['Y:RMP1','φέρον']]:[['D:PWM1','D']]];
   return project(comps,wires,{sim:{hDiv:200,speed:300,stopT:4e-3},scope:{panes,window:{unit:'T',n:100}},meta:{Vin,Vo,L,fs,kp,ki,fc:g.fc,i0:5,i1:10,t1:.002,blk,cmp,z1}});}});
 // ------------------------------------------------------------------ 3.3: code blocks (Python, expression)
 const PY_PI='# PI με όρια: ίδιοι κανόνες με το μπλοκ «PI διακριτός» (κράτηση του ολοκληρωτή στον κορεσμό).\n# Καλείται στην αρχή κάθε περιόδου του PWM. p["Ts"] είναι η περίοδος δειγματοληψίας.\ndef init(p):\n    return {"xi": 0.0}\n\ndef step(t, u, s, p):\n    e = u["e"]\n    s["xi"] += p["Ki"] * p["Ts"] * e\n    y = p["Kp"] * e + s["xi"]\n    if y > p["ymax"] or y < p["ymin"]:\n        s["xi"] -= p["Ki"] * p["Ts"] * e\n        y = min(p["ymax"], max(p["ymin"], p["Kp"] * e + s["xi"]))\n    return {"u": y}\n';
 T.push({id:'code_loop',group:'Μπλοκ κώδικα (3.3)',title:'PI σε Python και feedforward με έκφραση',theory:'formula',topology:'code_loop',
  options:[{k:'ctrl',label:'Ελεγκτής',options:[['python','PI σε μπλοκ Python'],['pib','PI διακριτός (μπλοκ, για σύγκριση)']],def:'python'},
   {k:'ff',label:'Feedforward',options:[['none','Χωρίς'],['expr','d = u + v_o/v_in (μπλοκ έκφρασης)']],def:'none'}],
  desc:'Ο ίδιος buck 48 V → μπαταρία 24 V με το «Βρόχος ρεύματος από μπλοκ», αλλά ο PI είναι κώδικας Python: ο κώδικας τρέχει σε κάθε δείγμα του PWM, όπως σε μικροελεγκτή, και η έξοδός του μένει σταθερή ως το επόμενο. Με feedforward, ένα μπλοκ έκφρασης υπολογίζει d = u + v_o/v_in από δύο βολτόμετρα, οπότε ο PI διορθώνει μόνο το υπόλοιπο. Η Python τρέχει στον browser με το Pyodide και στον server με την κανονική Python.',
  tasks:['Τρέξε έως το τέλος (⏩). Με «PI διακριτός» βγαίνει ακριβώς το ίδιο D: ο κώδικας Python κάνει τις ίδιες πράξεις.','Άνοιξε τον κώδικα (διπλό κλικ στο μπλοκ Py) και άλλαξε κάτι, π.χ. το όριο ή τον τύπο του ολοκληρωτή. Η αλλαγή εφαρμόζεται αμέσως.','Διάλεξε feedforward: το ρεύμα μένει στα 5 A από την αρχή (χωρίς feedforward πέφτει στο 0 ώσπου ο ολοκληρωτής να φτάσει το D = 0,5) και ο PI διορθώνει μόνο το υπόλοιπο.','Γράψε δικό σου κώδικα: π.χ. PI με μεταβλητά κέρδη, ή έλεγχο κατάστασης με if.'],
  build(o){const Vin=48,Vo=24,L=100e-6,fs=50e3,g=piGains(L,Vin,fs),ref='0:5, 0.002:10',py=o.ctrl!=='pib',ff=o.ff==='expr';
   const kp=+g.kp.toPrecision(4),ki=+g.ki.toPrecision(4),lo=ff?-.5:0,hi=ff?.5:.95;
   const comps=[C('V1','VDC',100,210,{V:Vin},{label:'V_in'}),gnd(100,300),C('S1','SW',200,150,{pwm:'PWM1',out:'a',body:false},{rot:3,flip:true}),J('J1',270,150),C('D1','D',270,200,{},{rot:3}),
     C('L1','L',330,150,{L,i0:5}),C('AM1','AM',400,150,{},{label:'A_L',lbl:'below'}),C('VO','VDC',490,210,{V:Vo},{label:'V_o'}),J('J3',100,270),J('J4',270,270),
     C('K1','CONST',250,60,{v:ref},{label:'i_ref'}),C('SUM1','SUM',330,70,{signs:'+-'},{label:'e'}),
     py?C('PI1','PY',440,70,{code:PY_PI,ins:'e',outs:'u',pars:`Kp = ${kp}, Ki = ${ki}, ymin = ${lo}, ymax = ${hi}`,clock:'PWM1',trig:'start',y0:0},{label:'PI (Python)'})
       :C('PI1','PIB',440,70,{Kp:kp,Ki:ki,clock:'PWM1',trig:'start',y0:0,ymin:lo,ymax:hi},{label:'PI'}),
     C('PWM1','PWM',ff?720:600,70,{fs,mode:'ext',carrier:'saw'})];
   const wires=[['V1:p','S1:d',[[100,150]]],['S1:s','J1'],['J1','L1:a'],['J1','D1:k'],['L1:b','AM1:a'],['AM1:b','VO:p',[[490,150]],{name:'v_o'}],
     ['V1:n','J3'],['J3','G1:g'],['J3','J4'],['J4','D1:a'],['J4','VO:n',[[490,270]]],
     ['K1:y','SUM1:a'],['AM1:y','SUM1:b',[[400,100],[290,100],[290,80]]],['SUM1:y','PI1:'+(py?'e':'u')]];
   const u=py?'PI1:u':'PI1:y';
   if(ff){comps.push(C('VMI','VM',40,210,{},{label:'v_in'}),C('VMO','VM',560,210,{},{label:'v_o'}),C('TGi','TAGO',40,140,{name:'v_in'}),C('TGo','TAGO',600,160,{name:'v_o'}),
     C('TFi','TAGI',500,10,{name:'v_in'}),C('TFo','TAGI',500,-30,{name:'v_o'}),C('EX1','EXPR',600,50,{expr:'clamp(u + vo/vin, 0, 0.95)',ins:'u, vo, vin'},{label:'d = u + v_o/v_in'}));
    wires.push(['VMI:p','V1:p',[[40,150],[100,150]]],['VMI:n','V1:n',[[40,270],[100,270]]],['VMO:p','VO:p',[[560,150]]],['VMO:n','VO:n',[[560,270]]],['VMI:y','TGi:u'],['VMO:y','TGo:u'],
     [u,'EX1:u',[[520,70],[520,30]]],['TFo:y','EX1:vo',[[540,-30],[540,50]]],['TFi:y','EX1:vin',[[530,10],[530,70]]],['EX1:y','PWM1:d']);}
   else wires.push([u,'PWM1:d']);
   return project(comps,wires,{sim:{hDiv:200,speed:300,stopT:4e-3},scope:{panes:[[['Y:AM1','i_L'],['Y:K1','i_ref']],[['D:PWM1','D'],['Y:PI1','u (PI)']]],window:{unit:'T',n:100}},
    meta:{Vin,Vo,L,fs,kp,ki,fc:g.fc,i0:5,i1:10,t1:.002,py,ff}});}});
 // ------------------------------------------------------------------ 3.3.1: battery cell test with a converter (EIS)
 T.push({id:'cell_eis',group:'Μπαταρίες και EIS (3.3.1)',title:'Δοκιμή κυψέλης: EIS με μετατροπέα',theory:'formula',topology:'cell_eis',
  options:[{k:'src',label:'Λειτουργία',options:[['vs','Φόρτιση από V_S (I_dc = +2 A)'],['rl','Εκφόρτιση στην R_L (S(N/C) ανοίγει, S(N/O) κλείνει)']],def:'vs'},
   {k:'f',label:'Συχνότητα διαταραχής',options:[['10','10 Hz'],['50','50 Hz'],['200','200 Hz'],['1000','1 kHz']],def:'200'}],
  desc:'Δοκιμή κυψέλης με ημιγέφυρα (Q1, Q2) και φίλτρο L, C_o, L_f. Η αναφορά ρεύματος είναι I_ref = I_dc + I_ac·sin(2πft), από μπλοκ έκφρασης, και ο PI ρυθμίζει το ρεύμα της κυψέλης. Η κυψέλη είναι OCV(SOC) με R_0, R_1‖C_1 και στοιχείο Warburg. Το SOC ολοκληρώνεται από το ρεύμα και το OCV βγαίνει από πίνακα τιμών (lut) σε πηγή ελεγχόμενη από σήμα. Στην εκφόρτιση η πηγή V_S αποσυνδέεται (S(N/C)) και η ενέργεια πάει στην R_L (S(N/O)). Τιμές τυπικές για κυψέλη ιόντων λιθίου 2,5 Ah.',
  tasks:['Τρέξε 0,1 s. Η κάρτα θεωρίας δίνει την εμπέδηση Z = V₁/I₁ στη συχνότητα της διαταραχής, από τη σειρά Fourier της τάσης και του ρεύματος της κυψέλης, και τη συγκρίνει με το μοντέλο.','Άνοιξε «Εμπέδηση (EIS)» πλάι στο scope και τρέξε τη σάρωση 10 Hz – 1 kHz: διάγραμμα Nyquist και Bode μαζί με το θεωρητικό Z(s). Το ημικύκλιο είναι το R_1‖C_1, η ευθεία στις 45° το Warburg.','Διάλεξε «Εκφόρτιση»: η V_S αποσυνδέεται στα 5 ms, η R_L παίρνει την ισχύ και η τάση του C_i ισορροπεί εκεί που P_R = P_κυψέλης. Η εμπέδηση δεν αλλάζει.','Στο πάνελ «Αρμονικές» φαίνεται και η φάση κάθε αρμονικής.'],
  build(o){const Vs=12,fs=20e3,L=47e-6,Lf=4.7e-6,Co=100e-6,Ci=1e-3,RL=20,R0=.03,R1=.02,C1=.05,sig=.05,Qah=2.5,soc0=.5,rl=o.src==='rl',Idc=rl?-2:2,Iac=.5,f=+o.f;
   const lut='lut(soc, 0, 3.0, 0.1, 3.45, 0.3, 3.6, 0.5, 3.7, 0.7, 3.85, 0.9, 4.05, 1, 4.2)',ocv0=3.7,g=piGains(L+Lf,Vs,fs),kp=+g.kp.toPrecision(4),ki=+g.ki.toPrecision(4);
   const comps=[C('V1','VDC',100,240,{V:Vs},{label:'V_S'}),C('SNC','SW',100,155,{gate:'sig',body:false},{label:'S(N/C)'}),C('SNO','SW',230,155,{gate:'sig',body:false},{label:'S(N/O)'}),
    C('RL','R',230,240,{R:RL},{rot:1,label:'R_L'}),C('CI','C',310,225,{C:Ci,v0:Vs},{label:'C_i'}),C('Q1','SW',390,160,{pwm:'PWM1',out:'a',body:true,Ron:5e-3}),C('Q2','SW',390,260,{pwm:'PWM1',out:'na',body:true,Ron:5e-3}),
    C('L1','L',460,210,{L,i0:Idc},{label:'L'}),C('CO','C',520,265,{C:Co,v0:+(ocv0+Idc*(R0+R1)).toFixed(4)},{label:'C_o'}),C('LF','L',580,210,{L:Lf,i0:Idc},{label:'L_f'}),
    C('AM1','AM',650,210,{},{label:'I_cell',lbl:'below'}),C('VM1','VM',700,270,{},{label:'v_cell'}),C('R0','R',750,210,{R:R0},{label:'R_0'}),C('R1','R',840,180,{R:R1},{label:'R_1'}),C('C1','C',840,240,{C:C1,v0:+(Idc*R1).toFixed(5)},{rot:1,label:'C_1',lbl:'below'}),
    C('W1','CPE',930,210,{kind:'warburg',sigma:sig,fmin:1,fmax:10e3,N:16},{label:'Warburg'}),C('OCV','VDC',1030,270,{ctl:'sig',V:ocv0},{flip:true,label:'OCV(SOC)',lbl:'left'}),
    J('JT1',100,120),J('JT2',230,120),J('JT3',310,120),J('JM',390,210),J('J2',520,210),J('J4',800,210),J('J5',890,210),
    J('JB1',100,330),J('JB2',230,330),J('JB3',310,330),J('JB4',390,330),J('JB5',520,330),J('JB6',700,330),gnd(100,370),
    C('KNC','CONST',30,155,{v:rl?'0:1, 0.005:0':'1'},{label:'S(N/C)'}),C('KNO','CONST',160,70,{v:rl?'0:0, 0.005:1':'0'},{label:'S(N/O)'}),
    C('KF','CONST',380,-120,{v:String(f)},{label:'f'}),C('EXI','EXPR',480,-120,{expr:'Idc + Iac*sin(2*pi*f*t)',ins:'f',pars:`Idc = ${Idc}, Iac = ${Iac}`},{label:'I_ref'}),
    C('SUM1','SUM',580,-110,{signs:'+-'},{label:'e'}),C('PI1','PIB',680,-110,{Kp:kp,Ki:ki,clock:'PWM1',trig:'start',y0:+(ocv0/Vs).toFixed(4),ymin:0,ymax:.98},{label:'PI'}),C('PWM1','PWM',800,-110,{fs,mode:'ext',carrier:'saw'}),
    C('TGi','TAGO',700,170,{name:'i_cell'}),C('TFi','TAGI',520,-60,{name:'i_cell'}),C('TFi2','TAGI',760,60,{name:'i_cell'}),
    C('GQ','GAIN',850,60,{K:+(1/(3600*Qah)).toPrecision(6)},{label:'1/(3600·Q)'}),C('SOC','INT',940,60,{y0:soc0,lo:0,hi:1},{label:'SOC'}),C('EXO','EXPR',1040,60,{expr:lut,ins:'soc'},{label:'OCV(SOC)'})];
   const wires=[['SNC:d','JT1'],['SNC:s','V1:p'],['V1:n','JB1'],['SNO:d','JT2'],['SNO:s','RL:a'],['RL:b','JB2'],['CI:p','JT3'],['CI:n','JB3'],['Q1:d','JT4x'],
    ['JT1','JT2'],['JT2','JT3'],['Q1:s','JM'],['JM','Q2:d'],['Q2:s','JB4'],['JM','L1:a'],['L1:b','J2'],['J2','CO:p'],['CO:n','JB5'],['J2','LF:a'],['LF:b','AM1:a'],
    ['AM1:b','R0:a'],['VM1:p','AM1:b',[[700,210]]],['VM1:n','JB6'],['R0:b','J4'],['J4','R1:a',[[800,180]]],['J4','C1:n',[[800,240]]],['R1:b','J5',[[890,180]]],['C1:p','J5',[[890,240]]],['J5','W1:a'],
    ['W1:b','OCV:p',[[1030,210]]],['OCV:n','JB7x'],['JB1','JB2'],['JB2','JB3'],['JB3','JB4'],['JB4','JB5'],['JB5','JB6'],['JB1','G1:g'],
    ['KNC:y','SNC:g'],['KNO:y','SNO:g',[[200,70],[200,155]]],['AM1:y','TGi:u',[[650,170]]],
    ['KF:y','EXI:f'],['EXI:y','SUM1:a',[[530,-120]]],['TFi:y','SUM1:b',[[550,-60],[550,-100]]],['SUM1:y','PI1:u'],['PI1:y','PWM1:d'],
    ['TFi2:y','GQ:u'],['GQ:y','SOC:u'],['SOC:y','EXO:soc'],['EXO:y','OCV:u',[[1030,60],[1080,270]]]];
   // top rail to Q1 and bottom rail to the cell
   const ws=wires.map(w=>w[1]==='JT4x'?['Q1:d','JT3',[[390,120]]]:w[1]==='JB7x'?['OCV:n','JB6',[[1030,330]]]:w);
   return project(comps,ws,{sim:{hDiv:50,speed:30,stopT:.1},scope:{panes:[[['Y:AM1','i_cell'],['Y:EXI','I_ref']],[['Y:VM1','v_cell']],[['V:CI','v_Ci']]],window:{unit:'s',n:.02}},
    meta:{Vs,fs,L,Lf,Co,Ci,RL,R0,R1,C1,sig,Qah,soc0,Idc,Iac,f,rl,kp,ki,eis:{comp:'KF',param:'v',vKey:'Y:VM1',iKey:'Y:AM1',from:10,to:1000,ppd:3,settle:3,periods:2,minSettle:.02}}});}});
 // ------------------------------------------------------------------ 3.4: three-phase inverter and induction machine
 // power stage shared by the two tutorials: V_dc, three legs (S1–S6, triangle carriers in phase), ammeters, machine (pins on top)
 function invIM(o){const Vdc=600,fs=5e3,X=[300,420,540],ph=['a','b','c'],comps=[C('V1','VDC',120,200,{V:Vdc},{label:'V_dc'}),gnd(120,330),J('JTL',120,110),J('JBL',120,290)],wires=[['V1:p','JTL'],['V1:n','JBL'],['JBL','G1:g']];
  X.forEach((x,k)=>{const P='PWM'+ph[k].toUpperCase(),q=ph[k];comps.push(C('S'+(2*k+1),'SW',x,160,{pwm:P,out:'a',body:true,Ron:.01},{label:'S'+(2*k+1)}),C('S'+(2*k+2),'SW',x,240,{pwm:P,out:'na',body:true,Ron:.01},{label:'S'+(2*k+2)}),
    J('JT'+q,x,110),J('JM'+q,x,200),J('JB'+q,x,290),C('AM'+q,'AM',x+50,330,{},{rot:1,label:'i_'+q}),C('TG'+q,'TAGO',x+100,330,{name:'i_'+q}),C(P,'PWM',x,40,{fs,mode:'ext',carrier:'triangle'},{label:'PWM '+q,lbl:'above'}),C('TD'+q,'TAGI',x-80,40,{name:'d_'+q}));
   wires.push(['S'+(2*k+1)+':d','JT'+q],['S'+(2*k+1)+':s','JM'+q],['JM'+q,'S'+(2*k+2)+':d'],['S'+(2*k+2)+':s','JB'+q],['JM'+q,'AM'+q+':a',[[x+50,200]]],['AM'+q+':y','TG'+q+':u'],['TD'+q+':y',P+':d']);});
  wires.push(['JTL','JTa'],['JTa','JTb'],['JTb','JTc'],['JBL','JBa'],['JBa','JBb'],['JBb','JBc']);
  if(o.sm){comps.push(C('M1','SM',470,470,{...o.sm,TL:o.TL},{flip:true,rot:3,label:o.label||'M (σύγχρονη)',lbl:'left'}),C('TGw','TAGO',560,620,{name:'ω'}),C('TGf','TAGO',560,580,{name:'θ'}));
   wires.push(['AMa:b','M1:a',[[350,400],[450,400]]],['AMb:b','M1:b'],['AMc:b','M1:c',[[590,400],[490,400]]],['M1:w','TGw:u',[[450,620]]],['M1:th','TGf:u',[[470,580]]]);}
  else{comps.push(C('M1','IM',470,470,{TL:o.TL,w0:0},{flip:true,rot:3,label:'M (επαγωγής)',lbl:'left'}),C('TGw','TAGO',560,560,{name:'ω'}),C('TGf','TAGO',560,600,{name:'θ_f'}));
   wires.push(['AMa:b','M1:a',[[350,400],[450,400]]],['AMb:b','M1:b'],['AMc:b','M1:c',[[590,400],[490,400]]],['M1:w','TGw:u',[[450,560]]],['M1:thf','TGf:u',[[480,600]]]);}
  return {comps,wires,Vdc,fs};}
 const IMP={Rs:3,RR:2,Ls:.025,LM:.3,p:2,J:.02,b:.002};
 T.push({id:'im_vf',group:'Ηλεκτρική κίνηση (3.4)',title:'Μηχανή επαγωγής: V/f και διαμόρφωση SPWM, SVPWM, τετραγωνική',theory:'formula',topology:'im_vf',
  options:[{k:'mod',label:'Διαμόρφωση',options:[['svpwm','SVPWM'],['spwm','SPWM'],['square','Τετραγωνική (six-step)']],def:'svpwm'}],
  desc:'Τριφασικός αντιστροφέας 600 V, 5 kHz, που τροφοδοτεί μηχανή επαγωγής 4 πόλων (μοντέλο ανάστροφο-Γ, τυπικές τιμές περίπου 2 kW). Ανοιχτός βρόχος V/f: η συχνότητα ανεβαίνει με ράμπα 100 Hz/s ως τα 50 Hz και η τάση ακολουθεί V = V_b + (V_n − V_b)·f/f_n. Η γωνία θ = ∫2πf dt και το πλάτος δίνουν τις τάσεις αναφοράς (αντίστροφος Park και Clarke), και ο τριφασικός διαμορφωτής τις κάνει duty για τα τρία σκέλη. Ροπή φορτίου 10 N·m στα 0,7 s.',
  tasks:['Τρέξε έως το τέλος. Η μηχανή επιταχύνει ακολουθώντας τη συχνότητα, με ολίσθηση που μεγαλώνει με το φορτίο. Η κάρτα θεωρίας συγκρίνει ταχύτητα, ρεύμα και ροπή με το ισοδύναμο κύκλωμα στη μόνιμη κατάσταση.','SPWM: στα 50 Hz η αναφορά 326,6 V ξεπερνά το V_dc/2 = 300 V (υπερδιαμόρφωση), το πλάτος κόβεται και εμφανίζονται χαμηλές αρμονικές. SVPWM: ως V_dc/√3 = 346 V, χωράει.','Τετραγωνική: το πλάτος δεν ρυθμίζεται (4/π·V_dc/2 = 382 V), άρα δεν γίνεται V/f. Εδώ η μηχανή ξεκινά απευθείας στα 50 Hz, με μεγάλο ρεύμα εκκίνησης.','Στο πάνελ «Αρμονικές» διάλεξε το i_a: σύγκρινε το THD των τριών διαμορφώσεων.'],
  build(o){const sq=o.mod==='square',pw=invIM({TL:'0:0, 0.7:10'}),{comps,wires}=pw,Vn=326.6,fn=50,Vb=10;
   comps.push(C('EXF','EXPR',-120,-160,{expr:sq?'fn':'min(fn, rate*t)',ins:'',pars:`fn = ${fn}, rate = 100`},{label:'f(t)'}),C('GW','GAIN',-20,-160,{K:+(2*Math.PI).toPrecision(8)},{label:'2π'}),C('TH','INT',80,-160,{wrap:'2pi'},{label:'θ'}),
    C('EXV','EXPR',-20,-100,{expr:'Vb + (Vn - Vb)*f/fn',ins:'f',pars:`Vb = ${Vb}, Vn = ${Vn}, fn = ${fn}`},{label:'V(f)'}),C('KQ','CONST',80,-60,{v:'0'},{label:'0'}),
    C('IPK','IPARK',180,-120,{},{label:'dq → αβ'}),C('ICL','ICLARKE',280,-120,{},{label:'αβ → abc'}),C('KDC','CONST',280,-40,{v:'600'},{label:'V_dc'}),
    C('MD','MOD3',390,-110,{mode:o.mod},{label:'διαμορφωτής'}),C('TGda','TAGO',470,-130,{name:'d_a'}),C('TGdb','TAGO',470,-110,{name:'d_b'}),C('TGdc','TAGO',470,-90,{name:'d_c'}));
   wires.push(['EXF:y','GW:u'],['GW:y','TH:u'],['EXF:y','EXV:f',[[-60,-160],[-60,-100]]],['EXV:y','IPK:d',[[130,-100],[130,-130]]],['KQ:y','IPK:q',[[140,-60],[140,-120]]],['TH:y','IPK:th',[[150,-160],[150,-110]]],
    ['IPK:al','ICL:al'],['IPK:be','ICL:be'],['ICL:a','MD:va',[[340,-130]]],['ICL:b','MD:vb',[[345,-120]]],['ICL:c','MD:vc',[[350,-110]]],['KDC:y','MD:vdc',[[340,-40],[340,-90]]],['MD:da','TGda:u'],['MD:db','TGdb:u'],['MD:dc','TGdc:u']);
   return project(comps,wires,{sim:{hDiv:40,speed:20,stopT:.9},scope:{panes:[[['Y:M1','ω_m']],[['Y:AMa','i_a'],['Y:AMb','i_b']],[['Y:M1:te','τ_e']]],window:{unit:'s',n:.9}},
    meta:{...IMP,Vdc:600,fs:5e3,Vn,fn,Vb,mod:o.mod,TL:10,tTL:.7}});}});
 T.push({id:'im_foc',group:'Ηλεκτρική κίνηση (3.4)',title:'Μηχανή επαγωγής: διανυσματικός έλεγχος, εξασθένιση πεδίου, R̂_R',theory:'formula',topology:'im_foc',
  options:[{k:'wref',label:'Ταχύτητα αναφοράς',options:[['100','100 rad/s (περιοχή σταθερής ροής)'],['230','230 rad/s (εξασθένιση πεδίου)']],def:'100'},
   {k:'rr',label:'R̂_R στον εκτιμητή',options:[['1','R̂_R = R_R'],['0.5','R̂_R = 0,5·R_R'],['1.5','R̂_R = 1,5·R_R']],def:'1'}],
  desc:'Διανυσματικός έλεγχος με προσανατολισμό στη ροή του δρομέα. Τα ρεύματα των φάσεων περνούν από Clarke, ο εκτιμητής ροής (μοντέλο ρεύματος) δίνει τη γωνία θ̂, και με Park γίνονται i_d, i_q. Δύο PI ρεύματος δίνουν u_d, u_q, που επιστρέφουν με αντίστροφο Park και Clarke στον διαμορφωτή SVPWM. Ο βρόχος ταχύτητας δίνει το i_q,ref και η ροή το i_d,ref = ψ_ref/L̂_M. Με εξασθένιση πεδίου, ψ_ref = ψ_n·min(1, ω_b/|ω|). Το μπλοκ της μηχανής δίνει και την πραγματική γωνία της ροής θ_f, για σύγκριση με την εκτίμηση.',
  tasks:['Τρέξε: η ροή χτίζεται τα πρώτα 0,2 s, μετά βήμα ταχύτητας και βήμα φορτίου 10 N·m στα 0,6 s. Η κάρτα θεωρίας δίνει i_d, i_q, ολίσθηση και ροπή στη μόνιμη κατάσταση.','Εξασθένιση πεδίου (230 rad/s): πάνω από τα 157 rad/s η ροή μειώνεται ώστε η τάση να χωράει στο V_dc/√3.','R̂_R λάθος: ο εκτιμητής υπολογίζει λάθος ολίσθηση και η γωνία θ̂ απομακρύνεται από την πραγματική θ_f. Η ροή και η ροπή ανά αμπέρ αλλάζουν. Δες το σφάλμα γωνίας στην κάρτα θεωρίας.'],
  build(o){const wref=+o.wref,k=+o.rr,pw=invIM({TL:'0:0, 0.6:10'}),{comps,wires}=pw,psin=.9,wb=157,{Ls,Rs,RR,LM,p,J}=IMP,ac=2*Math.PI*300,as=2*Math.PI*8,kt=1.5*p*psin;
   const kpc=+(ac*Ls).toPrecision(4),kic=+(ac*(Rs+RR)).toPrecision(4),kps=+(as*J/kt).toPrecision(4),kis=+(as*as*J/kt/4).toPrecision(4),Imax=15;
   comps.push(C('TFa','TAGI',-260,-350,{name:'i_a'}),C('TFb','TAGI',-260,-325,{name:'i_b'}),C('TFc','TAGI',-260,-300,{name:'i_c'}),C('CL','CLARKE',-138,-325,{},{label:'abc → αβ'}),
    C('TFw','TAGI',-260,-250,{name:'ω'}),C('GP','GAIN',-138,-250,{K:p},{label:'ω_r = p·ω'}),C('FE','FEST',-4,-312,{RR:+(k*RR).toPrecision(4),LM},{label:'εκτιμητής ροής'}),
    C('PK','PARK',145,-338,{},{label:'αβ → dq'}),
    C('KW','CONST',-260,-150,{v:`0:0, 0.2:${wref}`},{label:'ω_ref'}),C('TFw2','TAGI',-260,-100,{name:'ω'}),C('SW1','SUM',-138,-138,{signs:'+-'},{label:'e_ω'}),
    C('PIS','PIB',-4,-138,{Kp:kps,Ki:kis,clock:'PWMA',trig:'start',y0:0,ymin:-Imax,ymax:Imax},{label:'PI ταχύτητας'}),
    C('TFw3','TAGI',-260,-38,{name:'ω'}),C('EXP','EXPR',-138,-38,{expr:'psin*min(1, wb/max(abs(w), 1))',ins:'w',pars:`psin = ${psin}, wb = ${wb}`},{label:'ψ_ref'}),C('GL','GAIN',-4,-38,{K:+(1/LM).toPrecision(6)},{label:'1/L̂_M'}),
    C('SD','SUM',145,-75,{signs:'+-'},{label:'e_d'}),C('SQ','SUM',145,-162,{signs:'+-'},{label:'e_q'}),
    C('PID','PIB',280,-75,{Kp:kpc,Ki:kic,clock:'PWMA',trig:'start',y0:0,ymin:-350,ymax:350},{label:'PI i_d'}),C('PIQ','PIB',280,-162,{Kp:kpc,Ki:kic,clock:'PWMA',trig:'start',y0:0,ymin:-350,ymax:350},{label:'PI i_q'}),
    C('TFth','TAGI',280,-250,{name:'θ̂'}),C('IPK','IPARK',428,-138,{},{label:'dq → αβ'}),C('ICL','ICLARKE',564,-138,{},{label:'αβ → abc'}),C('KDC','CONST',564,-38,{v:'600'},{label:'V_dc'}),
    C('MD','MOD3',712,-125,{mode:'svpwm'},{label:'SVPWM'}),C('TGda','TAGO',820,-150,{name:'d_a'}),C('TGdb','TAGO',820,-125,{name:'d_b'}),C('TGdc','TAGO',820,-100,{name:'d_c'}),
    C('TGth','TAGO',145,-250,{name:'θ̂'}),C('TGid','TAGO',280,-350,{name:'i_d'}),C('TGiq','TAGO',280,-312,{name:'i_q'}),C('TFid','TAGI',10,-88,{name:'i_d'}),C('TFiq','TAGI',10,-188,{name:'i_q'}));
   wires.push(['TFa:y','CL:a'],['TFb:y','CL:b'],['TFc:y','CL:c'],['TFw:y','GP:u'],['CL:al','FE:al'],['CL:be','FE:be'],['GP:y','FE:wr',[[-71,-250],[-71,-300]]],['FE:th','TGth:u',[[64,-325],[64,-250]]],
    ['CL:al','PK:al',[[-84,-338],[-84,-375],[91,-375],[91,-350]]],['CL:be','PK:be',[[-78,-312],[-78,-381],[98,-381],[98,-338]]],['TFth2x','PK:th'],
    ['PK:d','TGid:u',[[213,-350]]],['PK:q','TGiq:u',[[219,-325],[219,-312]]],
    ['KW:y','SW1:a'],['TFw2:y','SW1:b',[[-192,-100],[-192,-125]]],['SW1:y','PIS:u'],['PIS:y','SQ:a',[[91,-138],[91,-175]]],['TFiq:y','SQ:b',[[91,-188],[91,-150]]],
    ['TFw3:y','EXP:w'],['EXP:y','GL:u'],['GL:y','SD:a',[[78,-38],[78,-88]]],['TFid:y','SD:b',[[78,-88],[78,-62]]],
    ['SD:y','PID:u'],['SQ:y','PIQ:u'],['PID:y','IPK:d',[[361,-75],[361,-150]]],['PIQ:y','IPK:q',[[368,-162],[368,-138]]],['TFth:y','IPK:th',[[374,-250],[374,-125]]],
    ['IPK:al','ICL:al'],['IPK:be','ICL:be'],['ICL:a','MD:va',[[645,-150]]],['ICL:b','MD:vb',[[651,-138]]],['ICL:c','MD:vc',[[658,-125]]],['KDC:y','MD:vdc',[[645,-38],[645,-100]]],['MD:da','TGda:u'],['MD:db','TGdb:u'],['MD:dc','TGdc:u']);
   // θ̂ to Park through a second "from" tag
   const ws=wires.map(w=>w[0]==='TFth2x'?['TFth3:y','PK:th']:w);comps.push(C('TFth3','TAGI',64,-288,{name:'θ̂'}));
   return project(comps,ws,{sim:{hDiv:40,speed:20,stopT:1.5},scope:{panes:[[['Y:M1','ω_m'],['Y:KW','ω_ref']],[['Y:PK','i_d'],['Y:PK:q','i_q']],[['Y:M1:psi','|ψ_R| (πραγματική)'],['Y:FE:psi','|ψ̂_R|']],[['Y:M1:te','τ_e']]],window:{unit:'s',n:1.5}},
    meta:{...IMP,Vdc:600,fs:5e3,psin,wb,wref,k,kpc,kic,kps,kis,Imax,ac,as,TL:10,tTL:.6}});}});
 // ------------------------------------------------------------------ 3.5: synchronous reluctance machine (Θάνος, 8/11): the rotor turns to the minimum reluctance
 const r4=v=>+v.toPrecision(4);
 // dq current control of a synchronous machine on the power stage of invIM: Clarke + Park with the rotor angle θ of the machine, speed PI
 // (output cfg.in: torque or current amplitude), references i_d,ref and i_q,ref from expressions, PI per axis with decoupling
 // u_d = PI_d − ω_e·L_q·i_q, u_q = PI_q + ω_e·L_d·i_d, inverse Park and Clarke, SVPWM. Speed step at 0.05 s.
 function smFoc(pw,M,cfg){const {comps,wires}=pw,ac=2*Math.PI*200,wref=100,kpd=r4(ac*M.Ld),kpq=r4(ac*M.Lq),kic=r4(ac*M.Rs),u=cfg.in;
  comps.push(C('TFa','TAGI',-260,-350,{name:'i_a'}),C('TFb','TAGI',-260,-325,{name:'i_b'}),C('TFc','TAGI',-260,-300,{name:'i_c'}),C('CL','CLARKE',-138,-325,{},{label:'abc → αβ'}),
   C('TFth','TAGI',-100,-270,{name:'θ'}),C('PK','PARK',-4,-315,{},{label:'αβ → dq'}),C('TGid','TAGO',100,-325,{name:'i_d'}),C('TGiq','TAGO',100,-305,{name:'i_q'}),
   C('KW','CONST',-260,-180,{v:`0:0, 0.05:${wref}`},{label:'ω_ref'}),C('TFw','TAGI',-260,-140,{name:'ω'}),C('SW1','SUM',-170,-170,{signs:'+-'},{label:'e_ω'}),
   C('PIS','PIB',-80,-170,{Kp:cfg.kps,Ki:cfg.kis,clock:'PWMA',trig:'start',y0:0,ymin:-cfg.ymax,ymax:cfg.ymax},{label:cfg.label}),
   C('EXD','EXPR',50,-200,cfg.exd,{label:'i_d,ref'}),C('EXQ','EXPR',50,-100,cfg.exq,{label:'i_q,ref'}),
   C('TFid','TAGI',115,-180,{name:'i_d'}),C('TFiq','TAGI',115,-80,{name:'i_q'}),C('SD','SUM',180,-190,{signs:'+-'},{label:'e_d'}),C('SQ','SUM',180,-90,{signs:'+-'},{label:'e_q'}),
   C('PID','PIB',260,-190,{Kp:kpd,Ki:kic,clock:'PWMA',trig:'start',y0:0,ymin:-350,ymax:350},{label:'PI i_d'}),C('PIQ','PIB',260,-90,{Kp:kpq,Ki:kic,clock:'PWMA',trig:'start',y0:0,ymin:-350,ymax:350},{label:'PI i_q'}),
   C('TFw2','TAGI',305,-170,{name:'ω'}),C('TFiq2','TAGI',305,-150,{name:'i_q'}),C('TFw3','TAGI',305,-70,{name:'ω'}),C('TFid2','TAGI',305,-50,{name:'i_d'}),
   C('EXUD','EXPR',390,-170,{expr:'v - p*w*Lq*iq',ins:'v, w, iq',pars:`p = ${M.p}, Lq = ${M.Lq}`},{label:'u_d'}),
   C('EXUQ','EXPR',390,-70,{expr:M.psim>0?'v + p*w*(Ld*id + psim)':'v + p*w*Ld*id',ins:'v, w, id',pars:`p = ${M.p}, Ld = ${M.Ld}`+(M.psim>0?`, psim = ${M.psim}`:'')},{label:'u_q'}),
   C('TFth2','TAGI',450,-30,{name:'θ'}),C('IPK','IPARK',510,-150,{},{label:'dq → αβ'}),C('ICL','ICLARKE',620,-150,{},{label:'αβ → abc'}),C('KDC','CONST',620,-60,{v:'600'},{label:'V_dc'}),
   C('MD','MOD3',730,-140,{mode:'svpwm'},{label:'SVPWM'}),C('TGda','TAGO',830,-165,{name:'d_a'}),C('TGdb','TAGO',830,-140,{name:'d_b'}),C('TGdc','TAGO',830,-115,{name:'d_c'}));
  wires.push(['TFa:y','CL:a'],['TFb:y','CL:b'],['TFc:y','CL:c'],['CL:al','PK:al'],['CL:be','PK:be'],['TFth:y','PK:th'],['PK:d','TGid:u'],['PK:q','TGiq:u'],
   ['KW:y','SW1:a'],['TFw:y','SW1:b'],['SW1:y','PIS:u'],...(String(cfg.exd.ins).trim()?[['PIS:y','EXD:'+u]]:[]),['PIS:y','EXQ:'+u],['EXD:y','SD:a'],['TFid:y','SD:b'],['EXQ:y','SQ:a'],['TFiq:y','SQ:b'],
   ['SD:y','PID:u'],['SQ:y','PIQ:u'],['PID:y','EXUD:v'],['TFw2:y','EXUD:w'],['TFiq2:y','EXUD:iq'],['PIQ:y','EXUQ:v'],['TFw3:y','EXUQ:w'],['TFid2:y','EXUQ:id'],
   ['EXUD:y','IPK:d'],['EXUQ:y','IPK:q'],['TFth2:y','IPK:th'],['IPK:al','ICL:al'],['IPK:be','ICL:be'],['ICL:a','MD:va'],['ICL:b','MD:vb'],['ICL:c','MD:vc'],['KDC:y','MD:vdc'],['MD:da','TGda:u'],['MD:db','TGdb:u'],['MD:dc','TGdc:u']);
  return {wref,TL:8,tTL:.5,ac,kpd,kpq,kic,kps:cfg.kps,kis:cfg.kis};}
 const SYN={Rs:2,Ld:.15,Lq:.03,psim:0,p:2,J:.02,b:.002};
 T.push({id:'synrm',group:'Ηλεκτρική κίνηση (3.5)',title:'Σύγχρονη μηχανή μαγνητικής αντίστασης (SynRM): ευθυγράμμιση, έλεγχος dq, MTPA',theory:'formula',topology:'synrm',
  options:[{k:'mode',label:'Πείραμα',options:[['foc','Έλεγχος ταχύτητας και ρεύματος dq'],['align','Ευθυγράμμιση: σταθερό διάνυσμα ρεύματος']],def:'foc'},
   {k:'strat',label:'Γωνία ρεύματος (έλεγχος dq)',options:[['mtpa','MTPA: γ = 45° (ελάχιστο ρεύμα ανά ροπή)'],['g30','γ = 30°'],['g60','γ = 60°'],['idc','Σταθερό i_d = 4 A (σταθερή «ροή»)']],def:'mtpa'},
   {k:'th0',label:'Αρχική γωνία δρομέα (ευθυγράμμιση)',options:[['60','θ₀ = 60°'],['120','θ₀ = 120°'],['89','θ₀ = 89° (σχεδόν στον άξονα q)']],def:'60'},
   {k:'sat',label:'Κορεσμός L_d',options:[['none','Χωρίς (γραμμική μηχανή)'],['d','Με κορεσμό: L_d → 0,04 H, γόνατο 0,5 V·s (3.6)']],def:'none'}],
  desc:'Η SynRM δεν έχει μαγνήτες ούτε τύλιγμα στον δρομέα. Ο δρομέας έχει άξονα εύκολης μαγνήτισης d (L_d μεγάλη) και δύσκολης q (L_q μικρή), και η ροπή είναι μόνο ροπή μαγνητικής αντίστασης: τ_e = (3/2)·p·(L_d − L_q)·i_d·i_q. Ο δρομέας στρέφεται ώστε ο άξονας d να πέσει πάνω στο διάνυσμα του ρεύματος, δηλαδή εκεί όπου η μαγνητική αντίσταση στη ροή είναι ελάχιστη. Τριφασικός αντιστροφέας 600 V, 5 kHz, SVPWM, μηχανή 4 πόλων με L_d = 0,15 H, L_q = 0,03 H (τυπικές τιμές). Η γωνία του δρομέα έρχεται από τη μηχανή (κωδικοποιητής).',
  tasks:['Ευθυγράμμιση: ο αντιστροφέας δίνει σταθερό διάνυσμα τάσης στον άξονα α, άρα ρεύμα 10 A στη φάση a. Ο δρομέας ξεκινά στις 60° και ταλαντεύεται γύρω από τη γωνία 0: εκεί ο άξονας d βλέπει το ρεύμα. Η ροπή είναι ανάλογη του −sin 2δ.','Με θ₀ = 120° ο δρομέας πηγαίνει στις 180°, όχι στο 0. Και οι δύο φορές του άξονα d είναι ελάχιστη μαγνητική αντίσταση, γι\'αυτό η ροπή έχει περίοδο 180° ηλεκτρικές. Με θ₀ = 89° η ροπή ξεκινά σχεδόν μηδενική: ο άξονας q είναι ασταθής θέση ισορροπίας.','Έλεγχος dq: ο βρόχος ταχύτητας δίνει ροπή αναφοράς τ*, και από αυτή βγαίνουν i_d,ref και i_q,ref για τη γωνία γ που διαλέγεις. Με φορτίο 8 N·m στα 0,5 s δες στην κάρτα θεωρίας το ρεύμα που χρειάζεται κάθε γωνία: το MTPA (45°) θέλει το λιγότερο.','Με κορεσμό της L_d η γωνία MTPA ανεβαίνει πάνω από τις 45°: σύγκρινε στην κάρτα θεωρίας το ρεύμα στις 45° και στις 60°.','Οι PI ρεύματος έχουν αποσύζευξη: u_d = PI_d − ω_e·L_q·i_q και u_q = PI_q + ω_e·L_d·i_d. Ο συντελεστής ισχύος της SynRM είναι μικρός. Η κάρτα θεωρίας δίνει το cos φ και το όριο (ξ − 1)/(ξ + 1) για ξ = L_d/L_q.'],
  build(o){const M=SYN,align=o.mode==='align',th0=align?+o.th0:0,pw=invIM({TL:align?'0':'0:0, 0.5:8',sm:{Rs:M.Rs,Ld:M.Ld,Lq:M.Lq,psim:0,pp:M.p,J:M.J,bm:M.b,th0,...(o.sat==='d'?{sat:'d',Ldsat:.04,psikd:.5}:{})},label:'M (SynRM)'}),{comps,wires}=pw;
   const sim={hDiv:40,speed:20,stopT:align||o.sat==='d'?1.2:1};
   if(align){const Va=20;
    comps.push(C('KA','CONST',520,-160,{v:String(Va)},{label:'v_α'}),C('KB','CONST',520,-110,{v:'0'},{label:'v_β = 0'}),C('ICL','ICLARKE',620,-150,{},{label:'αβ → abc'}),C('KDC','CONST',620,-60,{v:'600'},{label:'V_dc'}),
     C('MD','MOD3',730,-140,{mode:'svpwm'},{label:'SVPWM'}),C('TGda','TAGO',830,-165,{name:'d_a'}),C('TGdb','TAGO',830,-140,{name:'d_b'}),C('TGdc','TAGO',830,-115,{name:'d_c'}),
     C('TFth','TAGI',300,-240,{name:'θ'}),C('DL','EXPR',420,-240,{expr:'mod(th + pi, 2*pi) - pi',ins:'th',pars:''},{label:'δ ∈ (−π, π]'}));
    wires.push(['KA:y','ICL:al'],['KB:y','ICL:be'],['ICL:a','MD:va'],['ICL:b','MD:vb'],['ICL:c','MD:vc'],['KDC:y','MD:vdc'],['MD:da','TGda:u'],['MD:db','TGdb:u'],['MD:dc','TGdc:u'],['TFth:y','DL:th']);
    return project(comps,wires,{sim,scope:{panes:[[['Y:DL','δ (γωνία δρομέα)']],[['Y:M1:te','τ_e']],[['Y:M1:id','i_d'],['Y:M1:iq','i_q']],[['Y:M1','ω_m']]],window:{unit:'s',n:1.2}},
     meta:{...M,Vdc:600,fs:5e3,mode:'align',Va,th0}});}
   const st=o.strat,g={mtpa:45,g30:30,g60:60}[st],K=1.5*M.p*(M.Ld-M.Lq),Id0=4,as=2*Math.PI*8,taumax=o.sat==='d'?25:15; // with saturation the linear K underestimates: τ* above the load torque
   const pars=g?`K = ${r4(K)}, s2 = ${r4(Math.sin(2*g*Math.PI/180))}, cg = ${r4(Math.cos(g*Math.PI/180))}, sg = ${r4(Math.sin(g*Math.PI/180))}`:`K = ${r4(K)}, Id0 = ${Id0}`;
   // τ = K·i_d·i_q = K·|i|²·sin(2γ)/2 → |i| = √(2|τ|/(K·sin 2γ))
   const exd=g?{expr:'cg*sqrt(2*abs(tau)/(K*s2))',ins:'tau',pars}:{expr:'Id0',ins:'',pars},exq=g?{expr:'sign(tau)*sg*sqrt(2*abs(tau)/(K*s2))',ins:'tau',pars}:{expr:'tau/(K*Id0)',ins:'tau',pars};
   const c=smFoc(pw,M,{exd,exq,in:'tau',kps:r4(as*M.J),kis:r4(as*as*M.J/4),ymax:taumax,label:'PI ταχύτητας → τ*'});
   return project(comps,wires,{sim,scope:{panes:[[['Y:M1','ω_m'],['Y:KW','ω_ref']],[['Y:PK','i_d'],['Y:PK:q','i_q'],['Y:EXD','i_d,ref'],['Y:EXQ','i_q,ref']],[['Y:M1:te','τ_e'],['Y:PIS','τ*']],[['Y:AMa','i_a']]],window:{unit:'s',n:1}},
    meta:{...M,Vdc:600,fs:5e3,mode:'foc',strat:st,g,K,Id0,...c,as,taumax}});}});
 // permanent-magnet synchronous machine: the same model with ψ_m > 0 (d on the magnet). The speed PI gives the current amplitude i_s;
 // MTPA: i_d = (ψ_m − √(ψ_m² + 8·(L_q − L_d)²·i_s²))/(4·(L_q − L_d)), i_q = sign(i_s)·√(i_s² − i_d²); for L_d = L_q (SPMSM) i_d = 0
 const PMS={ipm:{Rs:2,Ld:.04,Lq:.1,psim:.3,p:2,J:.02,b:.002},spm:{Rs:2,Ld:.06,Lq:.06,psim:.3,p:2,J:.02,b:.002}};
 T.push({id:'pmsm',group:'Ηλεκτρική κίνηση (3.5)',title:'Σύγχρονη μηχανή μόνιμων μαγνητών (PMSM / IPMSM): i_d = 0 και MTPA',theory:'formula',topology:'pmsm',
  options:[{k:'mach',label:'Μηχανή',options:[['ipm','IPMSM: L_d = 0,04 H, L_q = 0,1 H, ψ_m = 0,3 V·s'],['spm','SPMSM: L_d = L_q = 0,06 H, ψ_m = 0,3 V·s']],def:'ipm'},
   {k:'strat',label:'Ρεύματα αναφοράς',options:[['mtpa','MTPA'],['id0','i_d = 0']],def:'mtpa'}],
  desc:'Το ίδιο μοντέλο σύγχρονης μηχανής με τη SynRM, με μαγνήτη ψ_m στον άξονα d. Η ροπή έχει δύο όρους: τ_e = (3/2)·p·(ψ_m·i_q + (L_d − L_q)·i_d·i_q). Στην IPMSM L_q > L_d, άρα αρνητικό i_d δίνει επιπλέον ροπή μαγνητικής αντίστασης. Στην SPMSM L_d = L_q και μένει μόνο ο όρος του μαγνήτη. Ο βρόχος ταχύτητας δίνει το πλάτος ρεύματος i_s, και το MTPA το μοιράζει σε i_d και i_q. Ίδιος αντιστροφέας και ίδιοι PI ρεύματος με αποσύζευξη (u_q με +ω_e·ψ_m) όπως στη SynRM.',
  tasks:['IPMSM με MTPA και φορτίο 8 N·m: το i_d βγαίνει αρνητικό. Σύγκρινε στην κάρτα θεωρίας το ρεύμα με το i_d = 0: για την ίδια ροπή το MTPA θέλει λιγότερο.','SPMSM: τα δύο ταυτίζονται, γιατί χωρίς διαφορά L_d − L_q το i_d δεν δίνει ροπή.','Δες την τάση: με i_d = 0 η πτώση ω_e·L_q·i_q στον άξονα d είναι μεγάλη. Το αρνητικό i_d του MTPA μειώνει και τη ροή του άξονα d, ψ_d = L_d·i_d + ψ_m.'],
  build(o){const M=PMS[o.mach]||PMS.ipm,st=o.strat==='id0'||M.Ld===M.Lq?'id0':'mtpa',pw=invIM({TL:'0:0, 0.5:8',sm:{Rs:M.Rs,Ld:M.Ld,Lq:M.Lq,psim:M.psim,pp:M.p,J:M.J,bm:M.b,th0:0},label:o.mach==='spm'?'M (SPMSM)':'M (IPMSM)'}),{comps,wires}=pw;
   const kt=1.5*M.p*M.psim,as=2*Math.PI*8,Imax=15,dL=M.Lq-M.Ld;
   const exd=st==='mtpa'?{expr:'(psim - sqrt(psim^2 + 8*dL^2*i^2))/(4*dL)',ins:'i',pars:`psim = ${M.psim}, dL = ${r4(dL)}`}:{expr:'0',ins:'',pars:''};
   const exq=st==='mtpa'?{expr:'sign(i)*sqrt(max(i^2 - ((psim - sqrt(psim^2 + 8*dL^2*i^2))/(4*dL))^2, 0))',ins:'i',pars:`psim = ${M.psim}, dL = ${r4(dL)}`}:{expr:'i',ins:'i',pars:''};
   const c=smFoc(pw,M,{exd,exq,in:'i',kps:r4(as*M.J/kt),kis:r4(as*as*M.J/kt/4),ymax:Imax,label:'PI ταχύτητας → i_s'});
   return project(comps,wires,{sim:{hDiv:40,speed:20,stopT:1},scope:{panes:[[['Y:M1','ω_m'],['Y:KW','ω_ref']],[['Y:PK','i_d'],['Y:PK:q','i_q'],['Y:EXD','i_d,ref'],['Y:EXQ','i_q,ref']],[['Y:M1:te','τ_e']],[['Y:AMa','i_a']]],window:{unit:'s',n:1}},
    meta:{...M,Vdc:600,fs:5e3,mach:o.mach,strat:st,kt,Imax,as,...c}});}});
 // ------------------------------------------------------------------ 3.6: switched reluctance machine 8/6, asymmetric half-bridge per phase
 // phase k: S_top from +V_dc to A, D from 0 V to A, D from B to +V_dc, S_bottom from B to 0 V; the winding A → B. Hysteresis current control
 // (comparator i_ref − i_k with band ΔI) inside the window θ_on ≤ θ_e,k < θ_off, θ_e,k = θ_e − (k − 1)·2π/N; speed PI → i_ref
 const SRMP={Rs:.5,Lu:.008,La:.06,Lsat:.008,psik:.35,J:.01,b:.001,N:4,Nr:6};
 T.push({id:'srm',group:'Ηλεκτρική κίνηση (3.6)',title:'Μηχανή μαγνητικής αντίστασης με διακόπτες (SRM 8/6): γωνίες, υστέρηση, βρόχος ψ–i',theory:'formula',topology:'srm',
  options:[{k:'ang',label:'Γωνίες αγωγής (ηλεκτρικές)',options:[['30-150','θ_on = 30°, θ_off = 150°'],['0-120','θ_on = 0°, θ_off = 120° (νωρίς)'],['60-180','θ_on = 60°, θ_off = 180° (αργά)']],def:'30-150'},
   {k:'band',label:'Ζώνη υστέρησης ΔI',options:[['1','1 A'],['3','3 A']],def:'1'}],
  desc:'SRM 8/6 (4 φάσεις, 6 πόλοι δρομέα) με κορεσμό: L_u = 8 mH, L_a = 60 mH, γόνατο ψ_k = 0,35 V·s (τυπικές τιμές). Κάθε φάση έχει ασύμμετρη γέφυρα από 300 V: όταν άγουν και οι δύο διακόπτες η φάση παίρνει +V_dc, όταν σβήνουν το ρεύμα επιστρέφει από τις διόδους με −V_dc. Ο έλεγχος ρεύματος είναι με υστέρηση, μόνο μέσα στο παράθυρο θ_on … θ_off της κάθε φάσης (0° = μη ευθυγραμμισμένη, 180° = ευθυγραμμισμένη). Ο βρόχος ταχύτητας δίνει το i_ref. Η ροπή βγαίνει από τη συνενέργεια W′ = ∫ψ di.',
  tasks:['Τρέξε ως το τέλος (0,8 s). Η μηχανή ανεβαίνει με ράμπα στα 100 rad/s και στα 0,35 s παίρνει φορτίο 3 N·m. Δες τις τέσσερις φάσεις να άγουν η μία μετά την άλλη, κάθε 90° ηλεκτρικές (15° μηχανικές).','Οι πύλες S1…S8 παίρνουν το σήμα τους χωρίς καλώδιο από τα μπλοκ g_1…g_4 (πεδίο «Πηγή» της εισόδου g). Η κάρτα θεωρίας σχεδιάζει τις καμπύλες ψ(i) στη μη ευθυγραμμισμένη και στην ευθυγραμμισμένη θέση και τον βρόχο ψ–i της φάσης 1. Το εμβαδόν του βρόχου είναι η ενέργεια ανά παλμό, και N·N_r·W/(2π) είναι η μέση ροπή.','Αργό σβήσιμο (θ_off = 180°): το ρεύμα δεν προλαβαίνει να μηδενιστεί πριν την ευθυγράμμιση και δίνει αρνητική ροπή. Χρειάζεται μεγαλύτερο i_ref για την ίδια ροπή. Νωρίς: λιγότερη ροπή ανά αμπέρ, αλλά καθαρός βρόχος.','Η κυμάτωση της ροπής φαίνεται στο τ_e: η SRM δίνει ροπή σε παλμούς, γι\'αυτό έχει θόρυβο και ταλαντώσεις.'],
  build(o){const [on,off]=o.ang.split('-').map(Number),band=+o.band,Vdc=300,M=SRMP,N=M.N,X=k=>230+160*k,r4=v=>+v.toPrecision(4),comps=[],wires=[];
   comps.push(C('V1','VDC',100,200,{V:Vdc},{label:'V_dc'}),gnd(100,380),J('JTL',100,60),J('JBL',100,330));wires.push(['V1:p','JTL'],['V1:n','JBL'],['JBL','G1:g']);
   // gates without a wire: the input g of both switches of phase q names the output of its window block (in_g = "WINq:y")
   for(let k=0;k<N;k++){const x=X(k),q=k+1,u='S'+(2*k+1),l='S'+(2*k+2),gs={gate:'sig',body:false,Ron:.01,in_g:'WIN'+q+':y'};
    comps.push(C(u,'SW',x-40,140,gs,{label:u,lbl:'above'}),C('DU'+q,'D',x+40,140,{},{rot:3,label:'D'+(2*k+1),lbl:'above'}),C(l,'SW',x+40,260,gs,{label:l,lbl:'below'}),C('DL'+q,'D',x-40,260,{},{rot:3,label:'D'+(2*k+2),lbl:'below'}),
     J('JTa'+q,x-40,60),J('JTb'+q,x+40,60),J('JBa'+q,x-40,330),J('JBb'+q,x+40,330),J('JA'+q,x-40,200),J('JB'+q,x+40,200));
    wires.push([u+':d','JTa'+q],[u+':s','JA'+q],['JA'+q,'DL'+q+':k'],['DL'+q+':a','JBa'+q],['DU'+q+':k','JTb'+q],['DU'+q+':a','JB'+q],['JB'+q,l+':d'],[l+':s','JBb'+q],['JTa'+q,'JTb'+q],['JBa'+q,'JBb'+q],
     ['JA'+q,'M1:a'+q,[[x-10,200]]],['JB'+q,'M1:b'+q,[[x+10,200]]]);
    if(k)wires.push(['JTb'+k,'JTa'+q],['JBb'+k,'JBa'+q]);}
   wires.push(['JTL','JTa1'],['JBL','JBa1']);
   comps.push(C('M1','SRM',470,480,{Rs:M.Rs,Lu:M.Lu,La:M.La,Lsat:M.Lsat,psik:M.psik,J:M.J,bm:M.b,TL:'0:0, 0.35:3',th0:30},{label:'M (SRM 8/6)',lbl:'left'}));
   const xs=X(0);comps.push(C('TGw','TAGO',xs+100,600,{name:'ω'}),C('TGth','TAGO',xs+120,560,{name:'θ'}));wires.push(['M1:w','TGw:u',[[xs+40,600]]],['M1:th','TGth:u',[[xs+80,560]]]);
   for(let k=0;k<N;k++){const q=k+1;comps.push(C('TGi'+q,'TAGO',X(k)+30,640,{name:'i_'+q}));wires.push(['M1:i'+q,'TGi'+q+':u',[[X(k),640]]]);}
   // control: clock for the speed PI, speed loop, and per phase comparator (hysteresis) × angle window
   // speed PI on a torque constant of about 0.5 N·m/A near 6–10 A (the SRM torque grows with i², the loop is tuned at the operating point)
   const Imax=20,as=2*Math.PI*6,K=.5,kps=r4(as*M.J/K),kis=r4(as*as*M.J/K/4),rad=d=>r4(d*Math.PI/180);
   comps.push(C('CLK1','CLK',-260,-540,{f:10e3},{label:'ρολόι 10 kHz'}),C('KW','EXPR',-260,-480,{expr:'min(wr, a*t)',ins:'',pars:'wr = 100, a = 400'},{label:'ω_ref (ράμπα 400 rad/s²)'}),C('TFw','TAGI',-260,-440,{name:'ω'}),C('SW1','SUM',-170,-470,{signs:'+-'},{label:'e_ω'}),
    C('PIS','PIB',-80,-470,{Kp:kps,Ki:kis,clock:'CLK1',trig:'start',y0:0,ymin:0,ymax:Imax},{label:'PI ταχύτητας → i_ref'}),C('TGir','TAGO',30,-470,{name:'i_ref'}));
   wires.push(['KW:y','SW1:a'],['TFw:y','SW1:b'],['SW1:y','PIS:u'],['PIS:y','TGir:u']);
   for(let k=0;k<N;k++){const q=k+1,y=-380+100*k;
    comps.push(C('TFr'+q,'TAGI',-280,y-10,{name:'i_ref'}),C('TFi'+q,'TAGI',-280,y+10,{name:'i_'+q}),C('CMP'+q,'CMP',-190,y,{hys:band},{label:'υστέρηση '+q}),
     C('TFt'+q,'TAGI',-130,y+20,{name:'θ'}),C('WIN'+q,'EXPR',-40,y+10,{expr:'c*(mod(th - d, 2*pi) >= on)*(mod(th - d, 2*pi) < off)',ins:'c, th',pars:`d = ${rad(90*k)}, on = ${rad(on)}, off = ${rad(off)}`},{label:'g_'+q}));
    wires.push(['TFr'+q+':y','CMP'+q+':p'],['TFi'+q+':y','CMP'+q+':n'],['CMP'+q+':y','WIN'+q+':c'],['TFt'+q+':y','WIN'+q+':th']);}
   return project(comps,wires,{sim:{hDiv:20,speed:2000,stopT:.8},scope:{panes:[[['Y:M1','ω_m'],['Y:KW','ω_ref']],[['I:M1','i₁'],['I2:M1','i₂'],['I3:M1','i₃'],['I4:M1','i₄']],[['Y:M1:te','τ_e']],[['PSI1:M1','ψ₁']]],window:{unit:'s',n:.05}},
    meta:{...M,Vdc,on,off,band,Imax,kps,kis,as,K,TL:3,tTL:.35,wref:100}});}});
 // ------------------------------------------------------------------ 3.5: lightning current (Heidler, IEC 62305-1) into a down conductor and an earth resistance
 T.push({id:'lightning',group:'Κεραυνικά (3.5)',title:'Κεραυνικό ρεύμα Heidler: 10/350, 1/200, 0,25/100 μs',theory:'formula',topology:'lightning',
  options:[{k:'shape',label:'Κυματομορφή',options:[['10/350','10/350 μs, 200 kA (πρώτο θετικό, LPL I)'],['1/200','1/200 μs, 100 kA (πρώτο αρνητικό)'],['0.25/100','0,25/100 μs, 50 kA (επόμενο αρνητικό)'],['custom','1,2/50 μs διπλοεκθετικό, 10 kA (προσαρμογή τ₁, τ₂)']],def:'10/350'}],
  desc:'Πηγή ρεύματος Heidler i(t) = (I₀/η)·(t/τ₁)ⁿ/(1 + (t/τ₁)ⁿ)·e^(−t/τ₂) με τα τ₁, τ₂, η του IEC 62305-1 (n = 10), σε αγωγό καθόδου 10 m (L = 10 μH) και αντίσταση γείωσης 10 Ω. Η τάση στην κορυφή του αγωγού είναι v = R·i + L·di/dt: στο μέτωπο κυριαρχεί ο όρος L·di/dt. Η τέταρτη επιλογή δείχνει την προσαρμογή των τ₁, τ₂ σε άλλο χρόνο μετώπου/ημίσεος. Τα πλέγματα γείωσης με αμοιβαία σύζευξη έρχονται αργότερα.',
  tasks:['Τρέξε: η κάρτα θεωρίας συγκρίνει μέγιστο, T1 και T2 με τις τιμές της κυματομορφής, και το φορτίο Q = ∫i dt και την ειδική ενέργεια W/R = ∫i² dt με τον IEC 62305-1 (10/350 στα 200 kA: 100 C, 10 MJ/Ω).','Σύγκρινε τη μέγιστη τάση στις τρεις κυματομορφές: το 0,25/100 έχει το μικρότερο ρεύμα αλλά τη μεγαλύτερη κλίση di/dt, άρα τη μεγαλύτερη επαγωγική τάση.','Στις ρυθμίσεις της πηγής διάλεξε «Άλλη T1/T2»: τα τ₁, τ₂ προσαρμόζονται ώστε η κυματομορφή να έχει ακριβώς αυτούς τους χρόνους.'],
  build(o){// [I₀, duration (tail down to below 1 %), speed, step T1/hDiv]
   const sh={'10/350':[200e3,3e-3,100,100],'1/200':[100e3,1.5e-3,500,100],'0.25/100':[50e3,8e-4,2000,50],custom:[10e3,4e-4,100,100]}[o.shape]||[200e3,3e-3,100,100],R=10,L=10e-6;
   const ip=o.shape==='custom'?{shape:'custom',model:'dexp',T1:1.2e-6,T2:50e-6,Ipk:sh[0]}:{shape:o.shape,Ipk:sh[0]};
   const comps=[C('I1','ILG',100,200,ip,{label:'i κεραυνού'}),C('L1','L',200,120,{L},{label:'αγωγός καθόδου'}),C('R1','R',300,200,{R},{rot:1,label:'R_γείωσης'}),gnd(200,320),J('J1',100,120)];
   const wires=[['I1:p','J1'],['J1','L1:a'],['L1:b','R1:a',[[300,120]]],['R1:b','G1:g',[[300,300],[200,300]]],['I1:n','G1:g',[[100,300],[200,300]]]];
   return project(comps,wires,{sim:{hDiv:sh[3],speed:sh[2],stopT:sh[1]},scope:{panes:[[['I:I1','i(t)']],[['V:I1','v = R·i + L·di/dt'],['V:R1','R·i']]],window:{unit:'s',n:sh[1]}},
    meta:{shape:o.shape,I0:sh[0],R,L,dur:sh[1]}});}});
 // ------------------------------------------------------------------ 3.8: traveling waves on a line (Bergeron)
 T.push({id:'twave',group:'Υψηλές τάσεις (3.8)',title:'Οδεύοντα κύματα: ανάκλαση σε ανοιχτό, βραχυκυκλωμένο ή ωμικό άκρο, διάγραμμα Bewley',theory:'formula',topology:'twave',
  options:[{k:'case',label:'Διάταξη',options:[['line','Γραμμή 3 km (Z = 400 Ω, τ = 10 μs) με τερματισμό'],['book','Εναέρια γραμμή → καλώδιο 165 m → Μ/Σ (άσκηση 15.4.9)']],def:'line'},
   {k:'term',label:'Τερματισμός (γραμμή)',options:[['open','Ανοιχτό άκρο (Γ = +1)'],['short','Βραχυκύκλωμα (Γ = −1)'],['match','R = Z (χωρίς ανάκλαση)'],['r3z','R = 3Z (Γ = +0,5)'],['rz3','R = Z/3 (Γ = −0,5)']],def:'open'},
   {k:'rs',label:'Πηγή (γραμμή)',options:[['0','Ιδανική (R_s = 0, Γ_s = −1)'],['z','Με R_s = Z (απορροφά τις επιστροφές)']],def:'0'},
   {k:'src',label:'Κυματομορφή',options:[['step','Βηματική 100 kV'],['li','Κρουστική 1,2/50 μs, 100 kV']],def:'step'},
   {k:'arr',label:'Αλεξικέραυνο στο Μ/Σ (15.4.9)',options:[['3','Ανάβει 3 μs μετά την άφιξη (εκφώνηση)'],['2','2 μs μετά την άφιξη (λύση του βιβλίου)'],['none','Χωρίς αλεξικέραυνο']],def:'3'}],
  desc:'Γραμμή χωρίς απώλειες ως στοιχείο Bergeron: σε κάθε άκρο αγωγιμότητα 1/Z και πηγή ιστορικού από το άλλο άκρο πριν από χρόνο τ. Τα κύματα ανακλώνται με Γ = (R − Z)/(R + Z) και διαθλώνται με δ = 1 + Γ. Η κάρτα θεωρίας λύνει το ίδιο πρόβλημα με τη μέθοδο των χαρακτηριστικών (ανεξάρτητα από τον λύτη), σχεδιάζει το διάγραμμα Bewley και συγκρίνει. Η δεύτερη διάταξη είναι η άσκηση 15.4.9 του βιβλίου «Υψηλές Τάσεις»: η εναέρια γραμμή είναι ημιάπειρη, άρα το προσπίπτον κύμα u είναι πηγή 2u πίσω από Z_ε.',
  tasks:['Ανοιχτό άκρο με ιδανική πηγή: η τάση στο τέλος γίνεται 2·100 kV στο τ, ξαναγίνεται 0 στο 3τ και επαναλαμβάνεται με περίοδο 4τ.','Βραχυκύκλωμα: η τάση στο τέλος μένει 0 και το ρεύμα ανεβαίνει σκαλωτά κατά 2·u/Z σε κάθε επιστροφή.','R = Z ή R_s = Z: δες πότε σταματούν οι ανακλάσεις.','Κρουστική 1,2/50: στο ανοιχτό άκρο η κορυφή διπλασιάζεται, όπως στο βηματικό.','Άσκηση 15.4.9: σύγκρινε τις τιμές της κάρτας με τον πίνακα του βιβλίου και δες το κύμα που ξεκινά από το Μ/Σ όταν ανάβει το αλεξικέραυνο.'],
  build(o){const book=o.case==='book',li=o.src==='li',U=100e3;
   const Z=book?1/(1.5e8*40e-12):400,tau=book?165/1.5e8:10e-6,Rs=book?1/(3e8*8e-12):o.rs==='z'?Z:0,E=book?2*U:U;
   const ta=book&&o.arr!=='none'?tau+(+o.arr)*1e-6:null,RL=book?60:{open:Infinity,short:0,match:Z,r3z:3*Z,rz3:Z/3}[o.term];
   const src=li?C('V1','VIMP',100,200,{shape:'1.2/50',Vpk:E},{label:book?'2u (κρουστική)':'u(t)'}):C('V1','VDC',100,200,{V:E},{label:book?'2u':'u'});
   const comps=[src,C('T1','TL',320,180,book?{spec:'zl',Z,len:165,vel:1.5e8}:{spec:'zt',Z,tau},{label:book?'καλώδιο 165 m':'γραμμή 3 km'}),gnd(320,300)];
   const wires=[['V1:n','G1:g',[[100,280],[320,280]]],['T1:b1','G1:g',[[260,280],[320,280]]],['T1:b2','G1:g',[[380,280],[320,280]]]];
   if(Rs>0){comps.push(C('RS','R',180,160,{R:Rs},{label:book?'Z_ε (εναέρια)':'R_s'}));wires.push(['V1:p','RS:a',[[100,160]]],['RS:b','T1:a1']);}else wires.push(['V1:p','T1:a1',[[100,160]]]);
   if(book){comps.push(C('RL','R',460,190,{R:60},{rot:1,label:'Μ/Σ 60 Ω'}));wires.push(['T1:a2','RL:a',[[460,160]]],['RL:b','G1:g',[[460,280],[320,280]]]);
    if(ta){comps.push(C('RA','R',540,190,{R:1e9,sched:`0:1e9, ${ta}:1e-3`},{rot:1,label:'αλεξικέραυνο'}));wires.push(['RL:a','RA:a',[[540,160]]],['RA:b','G1:g',[[540,280],[320,280]]]);}}
   else if(o.term==='short')wires.push(['T1:a2','G1:g',[[440,160],[440,280],[320,280]]]);
   else if(o.term!=='open'){comps.push(C('RL','R',460,190,{R:RL},{rot:1,label:'R_L'}));wires.push(['T1:a2','RL:a',[[460,160]]],['RL:b','G1:g',[[460,280],[320,280]]]);}
   const stopT=book?8e-6:li?80e-6:100e-6,hDiv=book?(li?120:220):li?120:400;
   return project(comps,wires,{sim:{hDiv,speed:li||book?20:5,stopT,method:'TR'},scope:{panes:[[['V:T1','v_A (αρχή)'],['V2:T1','v_B (τέλος)']],[['I:T1','i_A'],['I2:T1','i_B (μπαίνει στο τέλος)']]],window:{unit:'s',n:stopT}},
    meta:{case:o.case,src:o.src,term:o.term,E,U,Rs,Z,tau,RL,ta,dur:stopT}});}});
 // ------------------------------------------------------------------ 3.9: surge arrester and its protective distance (exercise 15.5.3)
 T.push({id:'arrester',group:'Υψηλές τάσεις (3.9)',title:'Αλεξικέραυνο: παραμένουσα τάση και απόσταση προστασίας',theory:'formula',topology:'arrester',
  options:[{k:'d',label:'Απόσταση αλεξικέραυνου – Μ/Σ',options:[['100','100 m'],['217.5','217,5 m (όριο της άσκησης 15.5.3)'],['400','400 m']],def:'217.5'},
   {k:'S',label:'Κλίση μετώπου του κύματος',options:[['40','40 kV/μs (άσκηση 15.5.3)'],['500','500 kV/μs'],['1000','1000 kV/μs']],def:'40'},
   {k:'mov',label:'Αλεξικέραυνο',options:[['ideal','Σχεδόν ιδανικό: 692 kV (α = 2000)'],['zno','ZnO: 692 kV στα 20 kA, α = 30'],['table','Απαγωγός 420 kV του βιβλίου (πίνακας)'],['none','Χωρίς αλεξικέραυνο']],def:'ideal'}],
  desc:'Κύμα ράμπας κλίσης S έρχεται από ημιάπειρη γραμμή (Z = 400 Ω), άρα είναι πηγή 2u πίσω από Z. Στο σημείο B είναι το αλεξικέραυνο, και ο Μ/Σ (ανοιχτό άκρο) είναι στο A, σε απόσταση d πάνω σε γραμμή Bergeron. Όσο το αλεξικέραυνο δεν άγει, το κύμα διπλασιάζεται στο A. Όταν άγει, κρατά το B στην παραμένουσα τάση U_res, αλλά το A ανεβαίνει ακόμη για 2τ: U_A ≈ U_res + 2·S·d/c (άσκηση 15.5.3 του βιβλίου «Υψηλές Τάσεις»). Το αλεξικέραυνο είναι μη γραμμική αντίσταση i = I_ref·(v/U_ref)^α ή πίνακας, και ο λύτης βρίσκει την τάση του με Newton σε κάθε βήμα.',
  tasks:['Με 217,5 m και 40 kV/μs: η μέγιστη τάση στον Μ/Σ φτάνει περίπου τα 750 kV (BIL) της άσκησης.','Διπλασίασε την απόσταση: η τάση στον Μ/Σ ανεβαίνει κατά 2·S·Δd/c.','Κλίση 1000 kV/μs: η απόσταση προστασίας πέφτει σε λίγα μέτρα. Γι’ αυτό τα αλεξικέραυνα μπαίνουν στους ακροδέκτες του Μ/Σ.','ZnO με α = 30: η παραμένουσα τάση εξαρτάται από το ρεύμα. Σύγκρινε το U_res της κάρτας με τα 692 kV.','Χωρίς αλεξικέραυνο: το κύμα διπλασιάζεται στο ανοιχτό άκρο.'],
  build(o){const Z=400,c=3e8,d=+o.d,S=(+o.S)*1e9,U=1.2e6,tau=d/c,mv={ideal:{model:'pow',Uref:692e3,Iref:20e3,alpha:2000},zno:{model:'pow',Uref:692e3,Iref:20e3,alpha:30},table:{model:'table',tbl:'1e-3: 379k, 1e3: 700k, 10e3: 823k'}}[o.mov];
   const comps=[C('V1','VIMP',100,200,{shape:'ramp',Vpk:2*U,S:2*S,Rs:Z},{label:'2u πίσω από Z'}),C('T1','TL',360,180,{spec:'zl',Z,len:d,vel:c},{label:'γραμμή B → A'}),gnd(300,300)];
   const wires=[['V1:n','G1:g',[[100,280],[300,280]]],['V1:p','T1:a1',[[100,160]]],['T1:b1','G1:g',[[300,280]]],['T1:b2','G1:g',[[420,280],[300,280]]]];
   if(mv){comps.push(C('M1','MOV',220,220,mv,{label:'αλεξικέραυνο B'}));wires.push(['M1:a','T1:a1',[[220,160]]],['M1:b','G1:g',[[220,280]]]);}
   const stopT=Math.max(U/S*1.3,8*tau)+4*tau;
   return project(comps,wires,{sim:{hDiv:100,speed:20,stopT,method:'TR'},scope:{panes:[[['V2:T1','v_A (Μ/Σ)'],['V:T1','v_B (αλεξικέραυνο)']],mv?[['I:M1','i αλεξικέραυνου']]:[['I:T1','i_B']]],window:{unit:'s',n:stopT}},
    meta:{d,S,U,Z,c,tau,mov:o.mov,BIL:750e3,Ures:692e3,dur:stopT}});}});
 // ------------------------------------------------------------------ 3.10: Marx generator (book «Υψηλές Τάσεις» 3.4.3, fig. 3.19)
 // ladder: left column ℓ₀…ℓₙ₋₁ (charging resistors R₃), right column ρ₀ = 0 V … ρₙ (r₂ or R₃). C_κk from ℓₖ₋₁ (−) to ρₖ (+),
 // gap Gk from ℓₖ₋₁ to ρₖ₋₁. Before firing ρ = 0 V and ℓ = −V₀; after all gaps fire the capacitors are in series.
 T.push({id:'marx',group:'Υψηλές τάσεις (3.10)',title:'Γεννήτρια Marx: πολυβάθμια κρουστική γεννήτρια με σπινθηριστές',theory:'formula',topology:'marx',
  options:[{k:'n',label:'Βαθμίδες',options:[['2','2 βαθμίδες'],['4','4 βαθμίδες (σχήμα 3.19)'],['6','6 βαθμίδες']],def:'4'},
   {k:'wave',label:'Κυματομορφή σχεδίασης',options:[['li','1,2/50 μs (κεραυνική)'],['si','250/2500 μs (χειρισμών)']],def:'li'},
   {k:'r2',label:'Αντίσταση ουράς R₂',options:[['gen','r₂ σε κάθε βαθμίδα: R₂ = n·r₂ παράλληλα στο C₁'],['load','Στην έξοδο: R₂ παράλληλα στο C₂']],def:'gen'}],
  desc:'n πυκνωτές C_κ = 0,1 μF φορτισμένοι παράλληλα στα V₀ = 100 kV. Ο σπινθηριστής G1 ανάβει με εντολή (trigatron). Η τάση στα επόμενα διάκενα ανεβαίνει πάνω από την τάση διάσπασης U_b = 110 kV και ανάβουν διαδοχικά, οπότε οι πυκνωτές εκφορτίζονται σε σειρά: C₁ = C_κ/n φορτισμένος στα n·V₀. Η αντίσταση μετώπου R₁ και η αντίσταση ουράς R₂ υπολογίζονται από τις ρίζες α₁, α₂ της κυματομορφής και τα C₁, C₂ (σχέσεις 3.21–3.29 του βιβλίου «Υψηλές Τάσεις»). Οι σπινθηριστές είναι στοιχεία του λύτη που κλείνουν όταν |v| ≥ U_b, χωρίς ειδικό κώδικα για τη γεννήτρια.',
  tasks:['Δες στο δεύτερο scope τα ρεύματα των σπινθηριστών: ανάβουν όλοι μαζί με τον G1, γιατί κάθε διάκενο βλέπει υπέρταση μόλις ανάψει το προηγούμενο.','Η κάρτα θεωρίας συγκρίνει κορυφή, T1, T2 και βαθμό απόδοσης με τη σχεδίαση (σχέσεις 3.28–3.32).','R₂ στην έξοδο: ο βαθμός απόδοσης πέφτει, γιατί οι R₁ και R₂ κάνουν διαιρέτη τάσης. Με 2 βαθμίδες (μεγάλο C₁/C₂) το κύκλωμα αυτό δεν δίνει καθόλου 1,2/50: η κάρτα δείχνει τι δίνει.','250/2500 μs: ίδια γεννήτρια, πολύ μεγαλύτερες R₁ και R₂.','Ανέβασε την τάση διάσπασης ενός διακένου πάνω από n·V₀: η γεννήτρια ανάβει μέχρι εκεί και η έξοδος μένει χαμηλή.'],
  build(o){const P=root.Parts,n=+o.n,V0=100e3,Ck=.1e-6,C2=1.2e-9,R3=o.wave==='si'?50e6:1e6,Ub=1.1*V0,sh=o.wave==='si'?'250/2500':'1.2/50',w=P.impulseWave({shape:sh,Vpk:1}),
    dz=pos=>P.impulseDesign({C1:Ck/n,C2,a1:1/w.tau2,a2:1/w.tau1,pos});let d=dz(o.r2);const feas=!d.err;if(!feas)d=dz('gen'); // type α has no solution for large C₁/C₂: keep the type-β values
   const R1=+d.R1.toPrecision(4),R2=+d.R2.toPrecision(4),tf=+(w.T1/10).toPrecision(3),rr=o.r2==='gen'?+(R2/n).toPrecision(4):R3;
   const {comps,wires}=marxCircuit({n,V0,Ck,C2,R1,R2,rr,R3,Ub,tf,pos:o.r2});
   const stopT=o.wave==='si'?3*w.T2:2.4*w.T2;
   return project(comps,wires,{solve:{tbase:w.T1},sim:{hDiv:o.wave==='si'?200:100,speed:20,stopT,method:'TR'},
    scope:{panes:[[['V:C2','v_out (C₂)']],Array.from({length:n},(_,k)=>['I:SG'+(k+1),'i G'+(k+1)])],window:{unit:'s',n:stopT}},
    meta:{n,V0,Ck,C1:Ck/n,C2,R1,R2,R3,rr,Ub,tf,pos:o.r2,feas,shape:sh,basis:w.basis,T1:w.T1,T2:w.T2,a1:1/w.tau2,a2:1/w.tau1,dur:stopT}});}});

 // Marx generator circuit (3.10; the book's 15.3.7 in 3.11): n stages C_κ charged to V₀ through R₃, gaps G1…Gn (G1 triggered at t_f),
 // the tail resistance in every stage (r₂, type β) or at the output (R₂, type α), front resistor R₁, load C₂
 function marxCircuit({n,V0,Ck,C2,R1,R2,rr,R3,Ub,tf,pos,lab={}}){
  const H=90,y0=110+n*H,Y=k=>y0-k*H,xl=100,xg=180,xc=260,xr=370,xo=540,top=Y(n),comps=[gnd(xr,y0+50)],wires=[['JR0','G1:g']];
  for(let k=0;k<=n;k++){if(k<n)comps.push(J('JL'+k,xl,Y(k)));comps.push(J('JR'+k,xr,Y(k)));}
  for(let k=1;k<=n;k++){const yb=Y(k-1);
   comps.push(C('SG'+k,'SG',xg,yb,{Ub,Rarc:.1,ext:'zero',...(k===1?{trig:String(tf)}:{})},{label:'G'+k,lbl:'below'}),C('CK'+k,'C',xc,yb-45,{C:Ck,v0:V0},{label:(lab.Ck||'C_κ')+k}),
    C('RR'+k,'R',xr,yb-45,{R:rr},{rot:1,label:pos==='gen'?lab.rr||'r₂':'R₃'}));
   wires.push(['JL'+(k-1),'SG'+k+':a'],['SG'+k+':b','JR'+(k-1)],['CK'+k+':n','SG'+k+':a',[[xg-30,yb-15]]],['CK'+k+':p','JR'+k,[[xc,yb-90]]],['RR'+k+':b','JR'+(k-1)],['RR'+k+':a','JR'+k]);
   if(k<n){comps.push(C('RL'+k,'R',xl,yb-45,{R:R3},{rot:1,label:'R₃',lbl:'left'}));wires.push(['RL'+k+':b','JL'+(k-1)],['RL'+k+':a','JL'+k]);}}
  comps.push(C('R1','R',(xr+xo)/2,top,{R:R1},{label:lab.R1||'R₁'}),J('OUT',xo,top),C('C2','C',xo,y0-45,{C:C2},{label:lab.C2||'C₂ (φορτίο)'}));
  wires.push(['JR'+n,'R1:a'],['R1:b','OUT'],['OUT','C2:p'],['C2:n','G1:g',[[xo,y0+50]]]);
  if(pos==='load'){comps.push(C('RT','R',xo+80,y0-45,{R:R2},{rot:1,label:'R₂'}));wires.push(['RT:a','OUT',[[xo+80,top]]],['RT:b','G1:g',[[xo+80,y0+50]]]);}
  return {comps,wires};}
 // ------------------------------------------------------------------ 3.10: chopped impulse (IEC 60076-3): chopping gap with a loop L and damping R
 T.push({id:'chop',group:'Υψηλές τάσεις (3.10)',title:'Αποκομμένη κρουστική τάση: σπινθηριστής αποκοπής',theory:'formula',topology:'chop',
  options:[{k:'chop',label:'Αποκοπή',options:[['tail','Στην ουρά: έναυση 3 μs μετά τη γεννήτρια'],['front','Στο μέτωπο: διάσπαση στα 800 kV'],['none','Χωρίς αποκοπή (πλήρες κύμα)']],def:'tail'},
   {k:'Rc',label:'Αντίσταση απόσβεσης στον βρόχο αποκοπής',options:[['0','0 Ω'],['20','20 Ω'],['50','50 Ω']],def:'20'},
   {k:'Lc',label:'Επαγωγή του βρόχου αποκοπής',options:[['1','1 μH'],['5','5 μH'],['20','20 μH']],def:'5'}],
  desc:'Κρουστική γεννήτρια μιας βαθμίδας (ισοδύναμη της Marx με 4 βαθμίδες): C₁ = 25 nF στο 1 MV, σπινθηριστής G1 με εντολή, R₁ και R₂ για 1,2/50 μs, αντικείμενο δοκιμής C₂ = 1,2 nF. Παράλληλα στο C₂ είναι ο σπινθηριστής αποκοπής, σε σειρά με την επαγωγή L_c του βρόχου και την αντίσταση απόσβεσης R_c. Όταν ανάψει, το C₂ εκφορτίζεται ταλαντευτικά: η τάση περνά στην αντίθετη πολικότητα (υπερύψωση). Στις δοκιμές μετασχηματιστών (IEC 60076-3) η αποκοπή γίνεται στην ουρά λίγα μs μετά την αρχή (συνήθως 3–6 μs) και η υπερύψωση αντίθετης πολικότητας περιορίζεται στο 30 % της τάσης αποκοπής.',
  tasks:['Με R_c = 0 Ω η τάση πέφτει από την κορυφή σε αρνητική τιμή κοντά στην αντίθετη κορυφή. Η κάρτα δίνει την υπερύψωση από τη λύση του κυκλώματος RLC.','Με 50 Ω η υπερύψωση πέφτει κάτω από 30 %. Βρες την αντίσταση που χρειάζεται για κάθε L_c.','Αποκοπή στο μέτωπο: ο σπινθηριστής διασπάται όταν η τάση φτάσει τα 800 kV, πριν από την κορυφή.','Μεγάλη L_c: η αποκοπή γίνεται πιο αργή και η ταλάντωση έχει μικρότερη συχνότητα f = ω_d/2π.'],
  build(o){const P=root.Parts,V=1e6,C1=25e-9,C2=1.2e-9,Rc=+o.Rc,Lc=(+o.Lc)*1e-6,w=P.impulseWave({shape:'1.2/50',Vpk:1}),d=P.impulseDesign({C1,C2,a1:1/w.tau2,a2:1/w.tau1,pos:'gen'}),
    R1=+d.R1.toPrecision(4),R2=+d.R2.toPrecision(4),tf=.1e-6,tc=tf+3e-6,Uc=800e3;
   // R₂ after the gap (book fig. 3.15β): the gap carries the discharge current of C₁, which never reverses
   const comps=[C('C1','C',100,200,{C:C1,v0:V},{label:'C₁ (n·V₀)'}),C('SG1','SG',170,120,{Ub:2*V,trig:String(tf),Rarc:.1},{label:'G1'}),J('J1',240,120),C('RT','R',240,200,{R:R2},{rot:1,label:'R₂'}),
    C('R1','R',320,120,{R:R1},{label:'R₁'}),J('OUT',400,120),C('C2','C',400,200,{C:C2},{label:'C₂ (δοκίμιο)'}),gnd(300,300)];
   const wires=[['C1:p','SG1:a',[[100,120]]],['SG1:b','J1'],['J1','RT:a'],['J1','R1:a'],['R1:b','OUT'],['OUT','C2:p'],['C1:n','G1:g',[[100,280],[300,280]]],['RT:b','G1:g',[[240,280],[300,280]]],['C2:n','G1:g',[[400,280],[300,280]]]];
   if(o.chop!=='none'){comps.push(C('LC','L',490,120,{L:Lc},{label:'L_c'}),C('RC','R',560,170,{R:Math.max(Rc,1e-6)},{rot:1,label:'R_c'}),
     C('SG2','SG',560,240,{Ub:o.chop==='front'?Uc:2*V,...(o.chop==='tail'?{trig:String(tc)}:{}),Rarc:.1,ext:'never'},{rot:1,label:'G αποκοπής',lbl:'right'}));
    wires.push(['OUT','LC:a'],['LC:b','RC:a',[[560,120]]],['RC:b','SG2:a'],['SG2:b','G1:g',[[560,280],[300,280]]]);}
   const stopT=o.chop==='none'?100e-6:12e-6;
   return project(comps,wires,{solve:{tbase:w.T1},sim:{hDiv:o.chop==='none'?400:1000,speed:5,stopT,method:'TR'},
    scope:{panes:[[['V:C2','v (δοκίμιο)']],o.chop!=='none'?[['I:SG2','i αποκοπής']]:[['I:R1','i R₁']]],window:{unit:'s',n:stopT}},
    meta:{V,C1,C2,R1,R2,Rc,Lc,Rarc:.1,tf,tc,Uc,chop:o.chop,T1:w.T1,a1:1/w.tau2,a2:1/w.tau1,dur:stopT}});}});
 // ------------------------------------------------------------------ 3.11: the book's impulse-generator exercises 15.3.x as benchmarks
 // (the book's approximate formulas ↔ the exact two-exponential solution ↔ the simulation). Loads in parallel at the output; a divider is C_H in series with C_L.
 const HV153={
  '1531':{t:'15.3.1: κύκλωμα β, C_κ = 25 nF, φορτίο 0,65 nF + καταμεριστής 50 pF, 300 kV',pos:'gen',Ck:25e-9,U:300e3,R1:569.88,R2:2735.4,load:[['CF',.65e-9,'C_φ'],['CD',50e-12,'καταμεριστής']],
   book:{eta:.97,Vp:291e3,T1:1.148e-6,T2:51.32e-6,tp:2.076e-6,W:1125}},
  '1532a':{t:'15.3.2α: κύκλωμα β, 15 nF / 1,5 nF, 230 kV',pos:'gen',Ck:15e-9,U:230e3,R1:297,R2:4151,load:[['CF',1.5e-9,'C_φ']],book:{eta:.909,Vp:209.7e3,T1:1.2e-6,T2:50e-6}},
  '1532c':{t:'15.3.2γ: ίδια γεννήτρια, καλώδιο 10 m (5 nF) και καταμεριστής 1/99 nF',pos:'gen',Ck:15e-9,U:230e3,R1:297,R2:4151,load:[['CF',1.5e-9,'C_φ'],['CC',5e-9,'καλώδιο']],div:[1e-9,99e-9],
   book:{T1:4.39e-6,T2:68.15e-6},lim:{T1:[.5e-6,5e-6],T2:[40e-6,60e-6]}},
  '1533':{t:'15.3.3: κύκλωμα α, 6,5 nF / 1 nF, καταμεριστής 0,1/9,9 nF, 125 kV',pos:'load',Ck:6.5e-9,U:125e3,R1:500,R2:10e3,load:[['CF',1e-9,'C_φ']],div:[.1e-9,9.9e-9],
   book:{eta:6.5/7.599,Vp:106.9e3,T1:1.23e-6,T2:57.5e-6,Vlv:1069},scopes:600},
  '1535':{t:'15.3.5: δοκίμιο 0,254 nF (το μέγιστο του βιβλίου), U_DC = 2√2 · 66,5 kV',pos:'gen',Ck:10e-9,U:2*Math.SQRT2*66.5e3,R1:750,R2:6.5e3,load:[['CF',.3e-9,'C_φ'],['CX',.254e-9,'δοκίμιο']],div:[.2e-9,100e-9],
   book:{Cx:.254e-9,T1:1.56e-6,T2:51e-6,Vp:175e3,Uac:66.5e3},lim:{T1:[.84e-6,1.56e-6],T2:[40e-6,60e-6]}},
  '1536':{t:'15.3.6: 1 nF / 0,1 nF, R_ε = 62 kΩ, R_μ = 45 Ω όπως στο βιβλίο',pos:'gen',Ck:1e-9,U:110e3,R1:45,R2:62e3,load:[['CF',.1e-9,'C_φ']],book:{eta:1/1.1,Vp:100e3,T1:1.21e-6,T2:49.73e-6,R1:44.59}},
  '1536c':{t:'15.3.6: με τη διορθωμένη R_μ = 4,46 kΩ',pos:'gen',Ck:1e-9,U:110e3,R1:4459.5,R2:62e3,load:[['CF',.1e-9,'C_φ']],book:{eta:1/1.1,Vp:100e3,T1:1.21e-6,T2:49.73e-6,R1:44.59}},
  '1537':{t:'15.3.7: Marx 3 βαθμίδων, 3 × 100 kV, C_φ = 500 pF',marx:3,pos:'gen',Ck:12e-9,U:100e3,R1:912,R2:15220.7,load:[['C2',500e-12,'C_φ']],book:{eta:.889,Vp:267e3,R1:912,R2:15220.7,T1:1.2e-6,T2:50e-6}}};
 T.push({id:'hv153',group:'Υψηλές τάσεις (3.11)',title:'Ασκήσεις 15.3: γεννήτριες κρουστικών τάσεων (βιβλίο, ακριβής λύση, προσομοίωση)',theory:'formula',topology:'hv153',
  options:[{k:'ex',label:'Άσκηση',options:Object.entries(HV153).map(([k,v])=>[k,v.t]),def:'1531'}],
  desc:'Οι λυμένες ασκήσεις 15.3.1–15.3.7 του βιβλίου «Υψηλές Τάσεις» με τα στοιχεία τους. Ο πυκνωτής κρούσης C_κ είναι φορτισμένος στην τάση της άσκησης και ο σπινθηριστής ανάβει με εντολή. Κύκλωμα β: η R_ε παράλληλα στο C_κ (μετά το διάκενο). Κύκλωμα α: η R_ε παράλληλα στο φορτίο. Η κάρτα θεωρίας βάζει δίπλα δίπλα τρεις τιμές για κάθε μέγεθος: των προσεγγιστικών τύπων του βιβλίου (T1 ≈ 2,96·R_μ·C_κC_φ/(C_κ + C_φ), T2 ≈ 0,73·R_ε·(C_κ + C_φ), η ≈ C_κ/(C_κ + C_φ)), της ακριβούς λύσης με τις ρίζες α₁, α₂ (σχέσεις 3.21–3.32) και της προσομοίωσης.',
  tasks:['15.3.1: το βιβλίο δίνει 291 kV με η = C_κ/(C_κ + C_φ). Η ακριβής κορυφή είναι χαμηλότερη, γιατί η R_ε εκφορτίζει το C_κ όσο φορτίζεται το C_φ.','15.3.2γ: με το καλώδιο το T2 βγαίνει εκτός ορίων και με την ακριβή λύση: το συμπέρασμα του βιβλίου ισχύει, τα νούμερα όχι.','15.3.3: δες στο δεύτερο scope την τάση του βραχίονα χαμηλής τάσης. Ισχύει το συμπέρασμα ότι κανένας παλμογράφος ως 600 V δεν αρκεί;','15.3.5: με τα 66,5 kV του βιβλίου η κορυφή δεν φτάνει τα 175 kV. Η κάρτα δίνει την τάση που χρειάζεται και το μέγιστο δοκίμιο από την ακριβή λύση.','15.3.6: με τα 45 Ω του βιβλίου το μέτωπο βγαίνει εκατό φορές μικρότερο από 1,2 μs. Δες τη διορθωμένη R_μ.','15.3.7: Marx 3 βαθμίδων. Ανάβουν και τα τρία διάκενα; Πόσο απέχει η κορυφή από τα 267 kV του βιβλίου;'],
  build(o){const P=root.Parts,x=HV153[o.ex]||HV153['1531'],ser=(a,b)=>a*b/(a+b),Cd=x.div?ser(x.div[0],x.div[1]):0,Cl=x.load.reduce((s,q)=>s+q[1],0)+Cd;
   const n=x.marx||1,C1=x.Ck/n,U=n*x.U,g=P.impulseRoots({R1:x.R1,R2:x.R2,C1,C2:Cl,pos:x.pos}),wm=P.waveMeasure({kind:'dexp',n:1,tau1:1/g.a2,tau2:1/g.a1,eta:1,I0:1,t0:0},'iec');
   const tf=+(wm.T1/20).toPrecision(3),fast=wm.T2/wm.T1>400,stopT=(fast?1.25:2.4)*wm.T2+tf;let comps,wires,out;
   if(x.marx){({comps,wires}=marxCircuit({n,V0:x.U,Ck:x.Ck,C2:x.load[0][1],R1:x.R1,R2:x.R2,rr:+(x.R2/n).toPrecision(5),R3:10e6,Ub:1.1*x.U,tf,pos:'gen',lab:{Ck:'C′_κ',rr:'R′_ε',R1:'R_μ = 3·R′_μ',C2:'C_φ'}}));out='C2';}
   else{const yb=300,gx=300;comps=[C('CK','C',100,210,{C:x.Ck,v0:x.U},{label:'C_κ'}),C('SG1','SG',170,130,{Ub:10*x.U,trig:String(tf),Rarc:1e-3,ext:'never'},{label:'σπινθηριστής'}),J('J1',240,130),
     C('RM','R',320,130,{R:x.R1},{label:'R_μ'}),J('OUT',400,130),gnd(gx,yb+20)];
    wires=[['CK:p','SG1:a',[[100,130]]],['SG1:b','J1'],['J1','RM:a'],['RM:b','OUT'],['CK:n','G1:g',[[100,yb],[gx,yb]]]];let xk=400;
    const down=(id,a)=>wires.push([id+':n','G1:g',[[a,yb],[gx,yb]]]);
    if(x.pos==='gen'){comps.push(C('RE','R',240,210,{R:x.R2},{rot:1,label:'R_ε'}));wires.push(['J1','RE:a'],['RE:b','G1:g',[[240,yb],[gx,yb]]]);}
    else{comps.push(C('RE','R',xk,210,{R:x.R2},{rot:1,label:'R_ε'}));wires.push(['OUT','RE:a'],['RE:b','G1:g',[[xk,yb],[gx,yb]]]);xk+=80;}
    for(const [id,c,lb] of x.load){comps.push(C(id,'C',xk,210,{C:c},{label:lb}));wires.push(['OUT',id+':p',[[xk,130]]]);down(id,xk);xk+=80;}
    if(x.div){comps.push(C('CH','C',xk,175,{C:x.div[0]},{label:'C_H'}),C('CL','C',xk,245,{C:x.div[1]},{label:'C_L'}));wires.push(['OUT','CH:p',[[xk,130]]],['CH:n','CL:p'],['CL:n','G1:g',[[xk,yb],[gx,yb]]]);}
    out=x.load[0][0];}
   const lv=x.div?[['V:CL','v βραχίονα ΧΤ (C_L)']]:x.marx?Array.from({length:n},(_,k)=>['I:SG'+(k+1),'i G'+(k+1)]):[['I:'+(x.pos==='gen'?'RE':'RM'),x.pos==='gen'?'i R_ε':'i R_μ']];
   return project(comps,wires,{solve:{tbase:wm.T1},sim:{hDiv:fast?20:100,speed:20,stopT,method:'TR'},scope:{panes:[[['V:'+out,'v (φορτίο)']],lv],window:{unit:'s',n:stopT}},
    meta:{ex:o.ex,t:x.t,pos:x.pos,marx:x.marx||0,Ck:x.Ck,C1,U0:x.U,U,R1:x.R1,R2:x.R2,C2:Cl,Cd,div:x.div||null,loads:x.load.map(q=>[q[2],q[1]]),book:x.book,lim:x.lim||null,scopes:x.scopes||0,out,tf,dur:stopT}});}});
 // ------------------------------------------------------------------ 3.11: lossy line: attenuation and distortion of a travelling wave (book §7.7)
 T.push({id:'lossline',group:'Υψηλές τάσεις (3.11)',title:'Γραμμή με απώλειες: απόσβεση και παραμόρφωση οδεύοντος κύματος',theory:'formula',topology:'lossline',
  options:[{k:'Rp',label:'Αντίσταση R′ της γραμμής',options:[['0','0 (χωρίς απώλειες)'],['0.5','0,5 Ω/km'],['2','2 Ω/km'],['5','5 Ω/km']],def:'2'},
   {k:'nsec',label:'Τμήματα του μοντέλου',options:[['1','1 (R/4, R/2, R/4)'],['4','4'],['16','16']],def:'4'},
   {k:'src',label:'Κυματομορφή',options:[['step','Βηματική 100 kV'],['li','Κρουστική 1,2/50 μs, 100 kV']],def:'step'},
   {k:'end',label:'Άκρο',options:[['open','Ανοιχτό άκρο'],['semi','Συνέχεια σε μακριά γραμμή (χωρίς ανάκλαση ως το 7τ)']],def:'open'}],
  desc:'Εναέρια γραμμή 30 km (Z = 400 Ω, v = 3·10⁸ m/s, τ = 100 μs) από ιδανική πηγή. Οι απώλειες σειράς R = R′·ℓ μπαίνουν συγκεντρωμένες σε N τμήματα, R/(4N) στα άκρα και R/(2N) στη μέση κάθε τμήματος (μοντέλο Dommel του EMTP). Το μέτωπο του κύματος σβήνει ως e^(−R′x/(2Z)), δηλαδή u(x) = u(0)·e^(−x/λ) με λ = 2Z/R′ (σχέση 7.88 του βιβλίου), και πίσω του μένει μια ουρά που ανεβαίνει αργά: η παραμόρφωση της §7.7. Η κάρτα θεωρίας λύνει την κατανεμημένη γραμμή RLC ακριβώς (λύση του Heaviside με συνάρτηση Bessel I₁) και συγκρίνει.',
  tasks:['Βηματική, ανοιχτό άκρο: στο τ η τάση πηδά στο 2·e^(−R/(2Z))·100 kV και μετά ανεβαίνει αργά. Χωρίς απώλειες πηδά στα 200 kV και μένει εκεί ως το 3τ.','Άλλαξε τα τμήματα από 1 σε 16: το σφάλμα απέναντι στην κατανεμημένη γραμμή πέφτει περίπου ανάλογα με 1/N.','Κρουστική 1,2/50: η κορυφή στο τέλος πέφτει και το μέτωπο πλαταίνει. Η κάρτα δίνει την ακριβή κορυφή από τη συνέλιξη με τη βηματική απόκριση.','Συνέχεια σε μακριά γραμμή: βλέπεις μόνο το κύμα που οδεύει, χωρίς ανάκλαση από το άκρο.'],
  build(o){const Z=400,len=30e3,vel=3e8,tau=len/vel,V=100e3,Rp=(+o.Rp)/1e3,N=+o.nsec,li=o.src==='li',semi=o.end==='semi';
   const comps=[li?C('V1','VIMP',100,200,{shape:'1.2/50',Vpk:V},{label:'u(t)'}):C('V1','VDC',100,200,{V},{label:'u'}),
    C('T1','TL',300,180,{spec:'zl',Z,len,vel,Rp,nsec:N},{label:'γραμμή 30 km'}),gnd(300,300)];
   const wires=[['V1:p','T1:a1',[[100,160]]],['V1:n','G1:g',[[100,280],[300,280]]],['T1:b1','G1:g',[[240,280],[300,280]]],['T1:b2','G1:g',[[360,280],[300,280]]]];
   if(semi){comps.push(C('T2','TL',520,180,{spec:'zl',Z,len:3*len,vel,Rp,nsec:3*N},{label:'συνέχεια 90 km'}));wires.push(['T1:a2','T2:a1'],['T2:b1','G1:g',[[460,280],[300,280]]],['T2:b2','G1:g',[[580,280],[300,280]]]);}
   const stopT=semi?6*tau:li?4*tau:8*tau;
   // the time base is the shortest of the source front (1,2 μs) and τ: h = 50 ns for the impulse, 0,25 μs for the step
   return project(comps,wires,{solve:{tbase:tau},sim:{hDiv:li?24:400,speed:20,stopT,method:'TR'},scope:{panes:[[['V:T1','v (αρχή)'],['V2:T1','v (τέλος 30 km)']],[['I:T1','i (αρχή)']]],window:{unit:'s',n:stopT}},
    meta:{Z,len,vel,tau,V,Rp,R:Rp*len,N,src:o.src,end:o.end,dur:stopT}});}});
 // ------------------------------------------------------------------ 3.11: volt–time curve of a gap (disruptive effect)
 T.push({id:'voltime',group:'Υψηλές τάσεις (3.11)',title:'Καμπύλη τάσης–χρόνου διακένου (κριτήριο ενέργειας διάσπασης)',theory:'formula',topology:'voltime',
  options:[{k:'src',label:'Τάση',options:[['ramp','Ράμπα (σταθερή κλίση)'],['li','Κρουστική 1,2/50 μs']],def:'ramp'},
   {k:'S',label:'Κλίση (ράμπα)',options:[['500','500 kV/μs'],['1000','1000 kV/μs'],['2000','2000 kV/μs'],['5000','5000 kV/μs']],def:'1000'},
   {k:'amp',label:'Κορυφή (κρουστική)',options:[['1.1','1,1 · U₀'],['1.3','1,3 · U₀'],['1.6','1,6 · U₀'],['2.5','2,5 · U₀']],def:'1.6'},
   {k:'k',label:'Εκθέτης k',options:[['0','0: σταθερή καθυστέρηση'],['1','1: ίσες επιφάνειες (Kind)'],['2','2']],def:'1'}],
  desc:'Διάκενο με τάση έναρξης U₀ = 100 kV σε πηγή με εσωτερική αντίσταση 50 Ω. Δεν διασπάται στο U₀: διασπάται όταν το ολοκλήρωμα D = ∫ (|u| − U₀)^k dt, από τη στιγμή που η τάση περνά το U₀, φτάσει μια σταθερά του διακένου (κριτήριο ενέργειας διάσπασης, disruptive effect). Με k = 0 είναι σταθερή καθυστέρηση, με k = 1 ο νόμος ίσων επιφανειών του Kind. Οι σταθερές D εδώ είναι ενδεικτικές, διαλεγμένες ώστε και τα τρία κριτήρια να δίνουν 200 kV σε ράμπα 1000 kV/μs. Όσο πιο απότομη η τάση, τόσο πιο ψηλά διασπάται: αυτή είναι η καμπύλη τάσης–χρόνου. Η κάρτα θεωρίας τη σχεδιάζει από το ίδιο κριτήριο και βάζει πάνω της το σημείο της προσομοίωσης.',
  tasks:['Ράμπα: η κάρτα δίνει τον κλειστό τύπο t_d = U₀/S + ((k+1)·D/S^k)^(1/(k+1)) και την τάση διάσπασης S·t_d. Πέρασε από 500 σε 5000 kV/μs.','Κρουστική 2,5 · U₀: διάσπαση στο μέτωπο, πολύ πάνω από το U₀. Με 1,1 · U₀ η διάσπαση γίνεται στην ουρά, ή καθόλου.','Σύγκρινε τα k = 0, 1, 2: στην ίδια ράμπα δίνουν την ίδια τάση, σε άλλες κλίσεις όχι.'],
  build(o){const U0=100e3,k=+o.k,Dk=[.1e-6,5e-3,1e-21*1e24/3][k],ramp=o.src==='ramp',S=(+o.S)*1e9,amp=+o.amp;
   const comps=[ramp?C('V1','VIMP',100,200,{shape:'ramp',Vpk:3e6,S},{label:'ράμπα'}):C('V1','VIMP',100,200,{shape:'1.2/50',Vpk:amp*U0},{label:'1,2/50'}),
    C('RS','R',200,160,{R:50},{label:'50 Ω'}),C('SG1','SG',300,200,{vt:'de',U0,kde:k,Dde:Dk,Rarc:1,ext:'never'},{rot:1,label:'διάκενο',lbl:'right'}),gnd(200,300)];
   const wires=[['V1:p','RS:a',[[100,160]]],['RS:b','SG1:a',[[300,160]]],['SG1:b','G1:g',[[300,280],[200,280]]],['V1:n','G1:g',[[100,280],[200,280]]]];
   // the time base is the front of the source (V_pk/S for the ramp, 1,2 μs for the impulse); about 3000 steps per run
   const stopT=ramp?Math.max(3*(U0/S),.4e-6):(amp<1.25?60e-6:12e-6),Tb=ramp?3e6/S:1.2e-6;
   return project(comps,wires,{sim:{hDiv:Math.round(Tb*3000/stopT),speed:5,stopT,method:'TR'},scope:{panes:[[['V:V1','u πηγής'],['V:SG1','u διακένου']],[['I:SG1','i διακένου']]],window:{unit:'s',n:stopT}},
    meta:{U0,k,D:Dk,src:o.src,S,amp,Vpk:amp*U0,Rs:50,dur:stopT}});}});
 // ------------------------------------------------------------------ 3.12: measuring AC high voltage with dividers (book 15.1.3, 15.1.5)
 T.push({id:'hvdiv',group:'Υψηλές τάσεις (3.12)',title:'Μέτρηση εναλλασσόμενης υψηλής τάσης: καταμεριστές (ασκήσεις 15.1.3, 15.1.5)',theory:'formula',topology:'hvdiv',
  options:[{k:'ex',label:'Άσκηση',options:[['1513','15.1.3: 50 kV, χωρητικός 0,1/19,9 nF, ωμικός 10 kΩ / R_L, ηλεκτροστατικό βολτόμετρο'],['1515','15.1.5: 834,39 kV κορυφή, χωρητικός 0,1/99,9 nF, καλώδιο 10 m, παλμογράφος 2 MΩ ∥ 30 pF']],def:'1513'}],
  desc:'Η υψηλή τάση του μετασχηματιστή δοκιμών (εδώ η πηγή, στη συχνότητα του δικτύου) μετριέται με καταμεριστές. Χωρητικός: λόγος (C_H + C_L,ολ)/C_H, όπου στο C_L,ολ μετρούν και το καλώδιο και ο παλμογράφος. Ωμικός: (R_H + R_L)/R_L. Το ηλεκτροστατικό βολτόμετρο δείχνει την ενδεικνυόμενη (rms) τιμή. Στην 15.1.5 το καλώδιο μπαίνει ως χωρητικότητα ℓ/(v·Z), όπως στο βιβλίο (στα 50 Hz ο χρόνος διάδοσης των 53 ns είναι αμελητέος), μαζί με τα 30 pF του παλμογράφου, πίσω από την αντίσταση του καλωδίου. Το ηλεκτροστατικό βολτόμετρο μπαίνει ως πολύ μεγάλη αντίσταση: μετρά μόνο την τάση. Η πηγή έχει 1 Ω εσωτερική αντίσταση και οι λόγοι μετριούνται ως προς την τάση στους ακροδέκτες της. Η κάρτα θεωρίας λύνει τους καταμεριστές με φασιθέτες και ελέγχει τις απαντήσεις του βιβλίου.',
  tasks:['15.1.3: η κάρτα δίνει 250 V στον χωρητικό, 9,1 V στον ωμικό με R_L = 1,82 Ω, και 50 kV στο ηλεκτροστατικό βολτόμετρο (το βιβλίο γράφει 100 kV).','15.1.5: τα 585,7 V ξεπερνούν τα 500 V του παλμογράφου. Πόσο πρέπει να γίνει το C_L για να χωρά η μέτρηση;','Άλλαξε το C_H: ο λόγος αλλάζει ανάλογα, αλλά το φορτίο του καταμεριστή στην πηγή μένει σχεδόν ίδιο.'],
  build(o){const b15=o.ex==='1515',f=50,Vpk=b15?834.39e3:50e3*Math.SQRT2,yb=300,gx=260;
   const comps=[C('V1','VAC',100,210,{Vpk,f,Rs:1},{label:b15?'834,39 kV κορυφή':'50 kV rms'}),J('HV',100,130),gnd(gx,yb+20)];   // 1 Ω inside the source: no loop of an ideal source with capacitors
   const wires=[['V1:p','HV'],['V1:n','G1:g',[[100,yb],[gx,yb]]]],dn=(id,x)=>wires.push([id+':n','G1:g',[[x,yb],[gx,yb]]]);
   comps.push(C('CH','C',200,175,{C:.1e-9},{label:'C_H'}),C('CL','C',200,245,{C:b15?99.9e-9:19.9e-9},{label:'C_L'}));wires.push(['HV','CH:p',[[200,130]]],['CH:n','CL:p']);dn('CL',200);
   // the cable as its capacitance ℓ/(v·Z) together with the oscilloscope input (as in the book), behind the cable's 0,1 Ω: no loop of capacitors alone
   if(b15){const Ccab=+(10/(3e8/Math.sqrt(2.5)*75)).toPrecision(4);comps.push(C('RC','R',290,210,{R:.1},{label:'καλώδιο 10 m'}),J('SC',370,210),C('CK','C',370,250,{C:Ccab+30e-12},{label:'C_καλ + C_παλμ'}),C('RS','R',450,250,{R:2e6},{rot:1,label:'παλμογράφος 2 MΩ'}));
    wires.push(['CL:p','RC:a',[[200,210]]],['RC:b','SC'],['SC','CK:p'],['SC','RS:a',[[450,210]]]);dn('CK',370);wires.push(['RS:b','G1:g',[[450,yb],[gx,yb]]]);}
   else{comps.push(C('RH','R',320,175,{R:10e3},{rot:1,label:'R_H'}),C('RL','R',320,245,{R:1.82},{rot:1,label:'R_L'}),C('ES','R',420,210,{R:1e12},{rot:1,label:'ηλεκτροστατικό βολτόμετρο'}));
    wires.push(['HV','RH:a',[[320,130]]],['RH:b','RL:a'],['RL:b','G1:g',[[320,yb],[gx,yb]]],['HV','ES:a',[[420,130]]],['ES:b','G1:g',[[420,yb],[gx,yb]]]);}
   const stopT=6/f;
   return project(comps,wires,{sim:{hDiv:200,speed:2,stopT,method:'TR'},scope:{panes:[[['V:V1','v (υψηλή)']],b15?[['V:CK','v παλμογράφου']]:[['V:CL','v χωρητικού (Ch2)'],['V:RL','v ωμικού (Ch1)']]],window:{unit:'s',n:stopT}},
    meta:{ex:o.ex,Vpk,f,CH:.1e-9,CL:b15?99.9e-9:19.9e-9,Ccab:b15?+(10/(3e8/Math.sqrt(2.5)*75)).toPrecision(4):0,Rs:b15?2e6:0,Cs:b15?30e-12:0,RH:b15?0:10e3,RL:b15?0:1.82,dur:stopT}});}});
 // ------------------------------------------------------------------ 3.12: Schering bridge (book 15.5.12)
 T.push({id:'schering',group:'Υψηλές τάσεις (3.12)',title:'Γέφυρα Schering: χωρητικότητα και συντελεστής απωλειών (άσκηση 15.5.12)',theory:'formula',topology:'schering',
  options:[{k:'set',label:'Ρυθμίσεις της γέφυρας',options:[['fix','R₃, R₄ από τη συνθήκη ισορροπίας (σωστές)'],['book','R₃ = 14,86 Ω, R₄ = 212,29 Ω (λύση του βιβλίου)'],['r4','R₄ 10 % μεγαλύτερη (εκτός ισορροπίας)']],def:'fix'}],
  desc:'Δοκίμιο C_x = 2 nF με συντελεστή απωλειών tan δ = 10⁻² (σειριακό ισοδύναμο R_x–C_x), πρότυπος πυκνωτής C₂ = 140 pF, πυκνωτής χαμηλής τάσης C₄ = 15 nF, τάση 10 kV στα 50 Hz. Κάτω από το C_x η R₃, κάτω από το C₂ η R₄ παράλληλα στο C₄. Ο ανιχνευτής (10 MΩ) είναι ανάμεσα στους δύο κόμβους χαμηλής τάσης. Ισορροπία: Z_x·Z₄ = Z₂·Z₃, δηλαδή C_x = C₂·R₄/R₃, R_x = R₃·C₄/C₂ και tan δ = ω·R₄·C₄. Η κάρτα θεωρίας λύνει τη γέφυρα με φασιθέτες και συγκρίνει την τάση του ανιχνευτή.',
  tasks:['Με τις σωστές τιμές ο ανιχνευτής δείχνει σχεδόν μηδέν. Από τις R₃, R₄, C₄ η κάρτα βγάζει πάλι C_x = 2 nF και tan δ = 10⁻².','Λύση του βιβλίου: R_x = 1,59 kΩ αντί για 15,9 kΩ (λάθος ×10), και οι R₃, R₄ δεν ικανοποιούν τις σχέσεις ισορροπίας. Δες τι δείχνει ο ανιχνευτής.','R₄ 10 % μεγαλύτερη: πόση τάση εμφανίζεται στον ανιχνευτή, και ποια τιμή C_x θα διάβαζες αν τη θεωρούσες ισορροπημένη;'],
  build(o){const f=50,w=2*Math.PI*f,Cx=2e-9,td=1e-2,C2=140e-12,C4=15e-9,Rx=td/(w*Cx),R4f=td/(w*C4),R3f=C2*R4f/Cx;
   const R3=o.set==='book'?14.86:+R3f.toPrecision(6),R4=o.set==='book'?212.29:+(R4f*(o.set==='r4'?1.1:1)).toPrecision(6),V=10e3,yb=320,gx=300;
   const comps=[C('V1','VAC',80,220,{Vpk:V*Math.SQRT2,f,Rs:1},{label:'10 kV rms'}),J('HV',80,90),C('RX','R',200,115,{R:+Rx.toPrecision(6)},{rot:1,label:'R_x'}),C('CX','C',200,180,{C:Cx},{label:'C_x (δοκίμιο)'}),J('A',200,220),
    C('C2','C',400,150,{C:C2},{label:'C₂ (πρότυπος)'}),J('B',400,220),C('R3','R',200,270,{R:R3},{rot:1,label:'R₃'}),C('R4','R',380,270,{R:R4},{rot:1,label:'R₄'}),C('C4','C',440,270,{C:C4},{label:'C₄'}),
    C('RD','R',300,220,{R:10e6},{label:'ανιχνευτής'}),gnd(gx,yb+20)];
   const wires=[['V1:p','HV'],['HV','RX:a',[[200,90]]],['RX:b','CX:p'],['CX:n','A'],['HV','C2:p',[[400,90]]],['C2:n','B'],['A','RD:a'],['RD:b','B'],['A','R3:a'],['B','R4:a',[[380,220]]],['B','C4:p',[[440,220]]],
    ['R3:b','G1:g',[[200,yb],[gx,yb]]],['R4:b','G1:g',[[380,yb],[gx,yb]]],['C4:n','G1:g',[[440,yb],[gx,yb]]],['V1:n','G1:g',[[80,yb],[gx,yb]]]];
   const stopT=8/f;
   return project(comps,wires,{sim:{hDiv:400,speed:2,stopT,method:'TR'},scope:{panes:[[['V:V1','v (υψηλή)']],[['V:RD','v ανιχνευτή'],['V:R3','v_A'],['V:R4','v_B']]],window:{unit:'s',n:stopT}},
    meta:{set:o.set,f,V,Cx,td,Rx:+Rx.toPrecision(6),C2,C4,R3,R4,RD:10e6,R3f,R4f,dur:stopT}});}});
 // ------------------------------------------------------------------ 3.0: peak current-mode, subharmonic oscillation
 T.push({id:'peak_cm',group:'Μπλοκ σημάτων (3.0)',title:'Peak current-mode και υποαρμονική',theory:'formula',topology:'peak_cm',
  options:[{k:'mode',label:'Έλεγχος',options:[['peak','Peak: ρολόι → ON, κορυφή → OFF'],['valley','Valley: ρολόι → OFF, κοιλάδα → ON']],def:'peak'},
   {k:'D',label:'Duty (V_o = D·V_in)',options:[['0.4','D = 0,4'],['0.6','D = 0,6'],['0.7','D = 0,7']],def:'0.6'},
   {k:'ramp',label:'Αντιστάθμιση κλίσης',options:[['none','Χωρίς ράμπα'],['half','m_a = m₂/2'],['full','m_a = m₂ (ένας κύκλος)']],def:'none'}],
  desc:'Buck 24 V προς μπαταρία V_o, L = 50 μH, f_s = 100 kHz. Δεν υπάρχει μπλοκ PWM: το ρολόι κάνει SET στο latch στην αρχή κάθε περιόδου και ανάβει τον S1. Η έξοδος του latch φτάνει στην πύλη μέσω ζεύγους ετικετών «g_S1» (Goto/From), χωρίς καλώδιο. Ο συγκριτής κάνει RESET όταν το ρεύμα του πηνίου, συν τη ράμπα αντιστάθμισης, φτάσει την εντολή i_c. Η στιγμή του RESET εντοπίζεται μέσα στο βήμα του λύτη, χωρίς ειδικό κώδικα για peak current-mode.',
  tasks:['Με D = 0,4 και χωρίς ράμπα: σταθερή κορυφή στο i_c από περίοδο σε περίοδο.','Με D = 0,6 χωρίς ράμπα: οι κορυφές και οι κοιλάδες εναλλάσσονται (υποαρμονική). Η κάρτα θεωρίας δίνει λ = (m_a − m₂)/(m₁ + m_a).','Πρόσθεσε ράμπα m₂/2: η ταλάντωση σβήνει. Με m_a = m₂ σβήνει σε έναν κύκλο.','Άλλαξε εν κινήσει την εντολή i_c από τις ζωντανές παραμέτρους.','Valley: το ρολόι σβήνει τον S1 και ο συγκριτής τον ανάβει όταν το ρεύμα πέσει στο i_c + ράμπα. Εδώ η υποαρμονική εμφανίζεται για D < 0,5 (δοκίμασε D = 0,4) και σβήνει για D > 0,5.','Χάρτης Poincaré και διάγραμμα διακλάδωσης (πλάι στο scope, «Διακλαδώσεις και Poincaré»): η κοιλάδα κάθε περιόδου σε σχέση με την προηγούμενη, και σάρωση του V_o. Με μπαταρία στην έξοδο ο χάρτης έχει δύο ευθύγραμμα κομμάτια, και πάνω από D = 0,5 περνά κατευθείαν σε χαοτική συμπεριφορά. Τη διαδοχή 1T → 2T → 4T τη δείχνει το tutorial «Διακλαδώσεις και χάος (boost)».','Άσκηση: πρόσθεσε μέγιστο duty με μπλοκ από τη βιβλιοθήκη (π.χ. ρολόι με ποσοστό 0,9, NOT και OR στο reset).'],
  build(o){const Vin=24,L=50e-6,fs=100e3,T=1/fs,D=+o.D,Vo=+(D*Vin).toFixed(6),vl=o.mode==='valley',ic=vl?3:5,m1=(Vin-Vo)/L,m2=Vo/L,ma={none:0,half:.5,full:1}[o.ramp]*(vl?m1:m2),hi=+(ma*T).toPrecision(6);
   const comps=[C('V1','VDC',100,210,{V:Vin},{label:'V_in'}),gnd(100,300),C('S1','SW',200,150,{gate:'sig',body:false},{rot:3,flip:true}),J('J1',270,150),C('D1','D',270,200,{},{rot:3}),
    C('AM1','AM',370,150,{},{label:'A_L',lbl:'below'}),C('L1','L',480,150,{L,i0:0}),C('VO','VDC',580,210,{V:Vo},{label:'V_o'}),J('J3',100,270),J('J4',270,270),
    C('RMP1','RAMP',290,20,{f:fs,shape:'saw',lo:0,hi},{label:'ράμπα m_a'}),C('SUM1','SUM',400,40,{signs:'++'},{label:vl?'i_c + ράμπα':'i_L + ράμπα'}),C('IC','CONST',vl?290:430,vl?-40:100,{v:String(ic)},{label:'i_c'}),
    C('CMP1','CMP',510,60,{},{label:vl?'i_L < i_c + ράμπα':'reset'}),C('CLK1','CLK',510,-30,{f:fs,duty:vl?.02:.5},{label:vl?'ρολόι (reset)':'ρολόι (set)'}),C('SR1','SR',620,50,{},{label:'latch'}),
    ...(vl?[C('NOT1','LOGIC',580,0,{op:'not'},{label:'NOT'}),C('AND1','LOGIC',580,70,{op:'and'},{label:'set'})]:[]),
    C('TG1','TAGO',690,40,{name:'g_S1'}),C('TF1','TAGI',120,100,{name:'g_S1'})];
   const wires=[['V1:p','S1:d',[[100,150]]],['S1:s','J1'],['J1','AM1:a'],['J1','D1:k'],['AM1:b','L1:a'],['L1:b','VO:p',[[580,150]]],['V1:n','J3'],['J3','G1:g'],['J3','J4'],['J4','D1:a'],['J4','VO:n',[[580,270]]],
    ['RMP1:y','SUM1:a',[[350,20],[350,30]]],['SUM1:y','CMP1:p',[[460,40],[460,50]]],['SR1:q','TG1:u'],['TF1:y','S1:g',[[200,100]]],
    ...(vl?[['IC:y','SUM1:b',[[340,-40],[340,50]]],['AM1:y','CMP1:n',[[370,100],[470,100],[470,70]]],['CMP1:y','AND1:a'],['CLK1:y','NOT1:a',[[545,-30],[545,0]]],['NOT1:y','AND1:b',[[610,0],[610,40],[545,40],[545,80]]],['AND1:y','SR1:s',[[615,70],[615,40]]],['CLK1:y','SR1:r',[[540,-30],[540,110],[600,110],[600,60]]]]
     :[['AM1:y','SUM1:b'],['IC:y','CMP1:n',[[470,100],[470,70]]],['CMP1:y','SR1:r'],['CLK1:y','SR1:s',[[570,-30],[570,40]]]])];
   return project(comps,wires,{sim:{hDiv:500,speed:20,stopT:0},scope:{panes:[[['Y:AM1','i_L'],['Y:SUM1',vl?'i_c + ράμπα':'i_L + ράμπα'],...(vl?[]:[['Y:IC','i_c']])],[['Y:SR1','Q → S1'],['Y:CLK1','ρολόι'],['Y:CMP1',vl?'set':'reset']]],window:{unit:'T',n:6}},
    meta:{Vin,Vo,L,fs,T,D,ic,m1,m2,ma,hi,ramp:o.ramp,mode:vl?'valley':'peak',valley:vl?1:0,map:'pcm',
     // the sample of each period is the current at the clock: valley (peak mode) or peak (valley mode)
     poincare:{key:'Y:AM1',stat:'end'},sweep:{comp:'VO',param:'V',from:4.8,to:21.6,n:43,key:'Y:AM1',stat:'end',transient:150,record:40,label:'V_o'}}});}});
 // ------------------------------------------------------------------ 3.2: period doubling and chaos (boost with RC load, i_c as the bifurcation parameter)
 T.push({id:'pcm_chaos',group:'Μπλοκ σημάτων (3.0)',title:'Διακλαδώσεις και χάος στο peak current-mode (boost)',theory:'formula',topology:'pcm_chaos',
  options:[{k:'ic',label:'Εντολή i_c',options:[['1.5','i_c = 1,5 A (1T)'],['2','i_c = 2 A (2T)'],['2.5','i_c = 2,5 A (4T)'],['2.65','i_c = 2,65 A (8T)'],['3','i_c = 3 A (χάος)']],def:'2'}],
  desc:'Boost 10 V με φορτίο R–C (L = 1 mH, C = 12 μF, R = 20 Ω, T = 100 μs), peak current-mode χωρίς ράμπα: το ρολόι ανάβει τον S1, ο συγκριτής τον σβήνει όταν i_L = i_c. Είναι το κλασικό παράδειγμα των Deane & Hamill. Όσο μεγαλώνει το i_c, η τάση εξόδου και το D μεγαλώνουν, και η περιοδική λειτουργία χάνει τη σταθερότητά της με διπλασιασμούς περιόδου: 1T → 2T → 4T → χάος. Ο πυκνωτής κάνει τον χάρτη δισδιάστατο, γι\'αυτό εδώ φαίνεται όλη η διαδοχή.',
  tasks:['Διάλεξε i_c = 1,5, 2, 2,5, 2,65 και 3 A και δες στο scope την κοιλάδα του ρεύματος: επαναλαμβάνεται κάθε 1, 2, 4, 8 περιόδους ή ποτέ.','Άνοιξε «Διακλαδώσεις και Poincaré» πλάι στο scope: ο χάρτης Poincaré δείχνει την κοιλάδα κάθε περιόδου σε σχέση με την προηγούμενη (1, 2, 4, 8 σημεία ή σύννεφο).','Τρέξε τη σάρωση του i_c από 1,4 έως 3 A: είναι το διάγραμμα διακλάδωσης. Βρες τα σημεία των διπλασιασμών (περίπου 1,65, 2,37 και 2,62 A).','Η κάρτα θεωρίας δίνει την περίοδο που βρέθηκε, το D και την εκτίμηση λ = −m₂/m₁ του μονοδιάστατου μοντέλου.'],
  build(o){const Vin=10,L=1e-3,Cv=12e-6,R=20,fs=1e4,T=1/fs,ic=+o.ic;
   const comps=[C('V1','VDC',100,210,{V:Vin},{label:'V_in'}),gnd(100,300),C('AM1','AM',180,150,{},{label:'A_L',lbl:'below'}),C('L1','L',280,150,{L,i0:0}),J('J1',360,150),
    C('S1','SW',360,210,{gate:'sig',body:false}),C('D1','D',440,150),J('J2',520,150),C('C1','C',520,210,{C:Cv,v0:Vin}),C('R1','R',600,210,{R},{rot:1}),J('J3',100,270),J('J4',360,270),J('J5',520,270),
    C('IC','CONST',400,40,{v:String(ic)},{label:'i_c'}),C('CMP1','CMP',500,40,{},{label:'reset'}),C('CLK1','CLK',500,-40,{f:fs,duty:.5},{label:'ρολόι (set)'}),C('SR1','SR',610,30,{},{label:'latch'}),
    C('TG1','TAGO',680,20,{name:'g_S1'}),C('TF1','TAGI',290,210,{name:'g_S1'}),C('TGi','TAGO',240,100,{name:'i_L'}),C('TFi','TAGI',400,0,{name:'i_L'})];
   const wires=[['V1:p','AM1:a',[[100,150]]],['AM1:b','L1:a'],['L1:b','J1'],['J1','S1:d'],['J1','D1:a'],['D1:k','J2'],['J2','C1:p'],['J2','R1:a',[[600,150]]],['V1:n','J3'],['J3','G1:g'],['J3','J4'],['J4','S1:s'],['J4','J5'],['J5','C1:n'],['J5','R1:b',[[600,270]]],
    ['AM1:y','TGi:u',[[180,100]]],['TFi:y','CMP1:p',[[450,0],[450,30]]],['IC:y','CMP1:n'],['CMP1:y','SR1:r',[[560,40],[560,40]]],['CLK1:y','SR1:s',[[570,-40],[570,20]]],['SR1:q','TG1:u'],['TF1:y','S1:g']];
   return project(comps,wires,{sim:{hDiv:200,speed:20,stopT:0},scope:{panes:[[['Y:AM1','i_L'],['Y:IC','i_c']],[['V:C1','v_o']],[['Y:SR1','Q → S1']]],window:{unit:'T',n:8}},
    meta:{Vin,L,C:Cv,R,fs,T,ic,map:null,poincare:{key:'Y:AM1',stat:'end'},sweep:{comp:'IC',param:'v',from:1.4,to:3,n:65,key:'Y:AM1',stat:'end',transient:300,record:64,label:'i_c'}}});}});
 // ------------------------------------------------------------------ 3.1: DC machine drive
 T.push({id:'dc_drive',group:'Ηλεκτρική κίνηση (3.1)',title:'Μηχανή ΣΡ: βρόχοι ρεύματος και ταχύτητας',theory:'formula',topology:'dc_drive',
  options:[{k:'mode',label:'Έλεγχος',options:[['speed','Ταχύτητα σε σειρά με ρεύμα'],['current','Μόνο βρόχος ρεύματος'],['open','Ανοιχτός βρόχος (D = 0,5)']],def:'speed'},
   {k:'design',label:'Σχεδίαση κερδών',options:[['active','Με ενεργό αντίσταση και ενεργή απόσβεση'],['imc','IMC χωρίς ενεργούς όρους']],def:'active'}],
  desc:'Μηχανή ΣΡ ανεξάρτητης διέγερσης από ημιγέφυρα 220 V, 5 kHz, με τριγωνικό φέρον. Το ρεύμα μετριέται με αμπερόμετρο σε σειρά στην αρχή κάθε περιόδου, δηλαδή στο μέσο του OFF, άρα είναι η μέση τιμή (Άσκηση 2). Ο βρόχος ρεύματος δίνει τάση με PI, feedforward της αντι-ΗΕΔ Ê = ψ̂·ω και, προαιρετικά, ενεργό αντίσταση. Ο βρόχος ταχύτητας δίνει ροπή με PI και ενεργή απόσβεση, και από εκεί το i_ref = τ_ref/ψ̂. Οι τιμές της μηχανής είναι τυπικές.',
  tasks:['Ταχύτητα: βήμα αναφοράς 0 → 150 rad/s στα 20 ms, βήμα φορτίου 10 N·m στα 250 ms. Δες στην κάρτα θεωρίας τα κέρδη και τη σύγκριση με τη μόνιμη κατάσταση.','Στην επιτάχυνση το i_ref φτάνει το όριο των 30 A: ο βρόχος ταχύτητας κορέννυται. Το back-calculation (είσοδος tr του PI = τ_sat − τ*) κρατά τον ολοκληρωτή εκεί που πρέπει, άρα η ταχύτητα φτάνει τα 150 rad/s χωρίς υπερύψωση.','Σύγκρινε «Με ενεργούς όρους» και «IMC»: με IMC η ταχύτητα πέφτει περίπου 4 rad/s στο βήμα φορτίου και επανέρχεται με σταθερά χρόνου J/b = 10 s, γιατί ο ολοκληρωτής K_i = α_s·b είναι σχεδόν μηδενικός.','Ανοιχτός βρόχος: η εκκίνηση με D = 0,5 δίνει μεγάλο ρεύμα εκκίνησης. Γι\'αυτό χρειάζεται ο βρόχος ρεύματος.','Άλλαξε εν κινήσει την αναφορά (σταθερά ω_ref ή i_ref) από τις ζωντανές παραμέτρους.'],
  build(o){const Vdc=220,Ra=.5,La=10e-3,psi=1,Jm=.02,bm=.002,fs=5e3,ac=2*Math.PI*200,as=ac/10,act=o.design!=='imc',Imax=30;
   const kpc=+(ac*La).toPrecision(5),kic=+(act?ac*ac*La:ac*Ra).toPrecision(5),Rac=act?+(ac*La-Ra).toPrecision(5):0;
   const kps=+(as*Jm).toPrecision(5),kis=+(act?as*as*Jm:as*bm).toPrecision(5),bac=act?+(as*Jm-bm).toPrecision(5):0;
   const TL=o.mode==='current'?'0':'0:0, 0.25:10';
   // power stage: half-bridge, series ammeter, machine; ω and i_a leave through tags
   const comps=[C('V1','VDC',100,290,{V:Vdc},{label:'V_dc'}),gnd(100,440),J('J3',100,410),J('J4',260,410),J('JM',260,300),
    C('S1','SW',260,250,{pwm:'PWM1',out:'a',body:true,Ron:1e-3}),C('S2','SW',260,340,{pwm:'PWM1',out:'na',body:true,Ron:1e-3}),
    C('AM1','AM',400,300,{},{label:'A_a',lbl:'below'}),C('M1','DCM',580,340,{Ra,La,psi,J:Jm,bm,TL,w0:0,ia0:0},{label:'M'}),
    C('TGi','TAGO',440,270,{name:'i_a'}),C('TGw','TAGO',660,330,{name:'ω'})];
   const wires=[['V1:p','S1:d',[[100,220]]],['S1:s','JM'],['JM','S2:d'],['JM','AM1:a'],['AM1:b','M1:a'],['V1:n','J3'],['J3','G1:g'],['J3','J4'],['S2:s','J4'],['J4','M1:b',[[580,410]]],
    ['AM1:y','TGi:u'],['M1:w','TGw:u']];
   let panes,stopT;
   if(o.mode==='open'){comps.push(C('PWM1','PWM',670,-20,{fs,D:.5,carrier:'triangle'}));panes=[[['Y:AM1','i_a']],[['Y:M1','ω']],[['Y:M1:te','τ_e']]];stopT=.4;}
   else{
    // current loop: u* = PI(i_ref − i) + ψ̂·ω − R_a·i, saturated to 0 … V_dc, d = u_sat/V_dc; back-calculation tr = u_sat − u*
    comps.push(C('TFi1','TAGI',110,20,{name:'i_a'}),C('SUMi','SUM',200,-20,{signs:'+-'},{label:'e_i'}),C('PIc','PIB',290,-20,{Kp:kpc,Ki:kic,clock:'PWM1',trig:'start',y0:0,aw:'track'},{label:'PI ρεύματος'}),
     C('TFtc','TAGI',240,40,{name:'tr_i'}),C('SUMu','SUM',380,-20,{signs:'++-'},{label:'u*'}),C('TFw3','TAGI',210,115,{name:'ω'}),C('GPe','GAIN',300,115,{K:psi},{label:'Ê = ψ̂·ω'}),
     C('TFi2','TAGI',210,185,{name:'i_a'}),C('GRa','GAIN',300,185,{K:Rac},{label:'R_a'}),C('SATu','SAT',470,-20,{lo:0,hi:Vdc},{label:'0 … V_dc'}),
     C('GV','GAIN',560,-20,{K:+(1/Vdc).toPrecision(6)},{label:'1/V_dc'}),C('PWM1','PWM',670,-20,{fs,mode:'ext',carrier:'triangle'}),
     C('SUMtc','SUM',590,65,{signs:'+-'},{label:'u_sat − u*'}),C('TGtc','TAGO',660,65,{name:'tr_i'}));
    wires.push(['TFi1:y','SUMi:b',[[160,20],[160,-10]]],['SUMi:y','PIc:u'],['TFtc:y','PIc:tr',[[290,40]]],['PIc:y','SUMu:a',[[330,-20],[330,-30]]],
     ['TFw3:y','GPe:u'],['GPe:y','SUMu:b',[[340,115],[340,-10]]],['TFi2:y','GRa:u'],['GRa:y','SUMu:c',[[380,185]]],['SUMu:y','SATu:u'],['SATu:y','GV:u'],['GV:y','PWM1:d'],
     ['SATu:y','SUMtc:a',[[515,-20],[515,55]]],['SUMu:y','SUMtc:b',[[420,-20],[420,90],[550,90],[550,75]]],['SUMtc:y','TGtc:u']);
    if(o.mode==='current'){comps.push(C('KI','CONST',110,-30,{v:'0:0, 0.005:10, 0.03:-5'},{label:'i_ref'}));wires.push(['KI:y','SUMi:a']);
     panes=[[['Y:AM1','i_a'],['Y:KI','i_ref']],[['Y:M1','ω']],[['D:PWM1','D']]];stopT=.06;}
    else{ // speed loop: τ* = PI(ω_ref − ω) − b_a·ω, saturated to ±ψ̂·I_max, i_ref = τ_sat/ψ̂; back-calculation tr = τ_sat − τ*
     comps.push(C('TFir','TAGI',110,-30,{name:'i_ref'}),C('KW','CONST',110,-210,{v:'0:0, 0.02:150'},{label:'ω_ref'}),C('TFw1','TAGI',110,-160,{name:'ω'}),
      C('SUMw','SUM',200,-200,{signs:'+-'},{label:'e_ω'}),C('PIs','PIB',290,-200,{Kp:kps,Ki:kis,clock:'PWM1',trig:'start',y0:0,aw:'track'},{label:'PI ταχύτητας'}),
      C('TFts','TAGI',240,-140,{name:'tr_ω'}),C('SUMt','SUM',380,-200,{signs:'+-'},{label:'τ*'}),C('TFw2','TAGI',210,-100,{name:'ω'}),C('GBa','GAIN',310,-100,{K:bac},{label:'b_a'}),
      C('SATt','SAT',470,-200,{lo:-Imax*psi,hi:Imax*psi},{label:'±ψ̂·I_max'}),C('GPsi','GAIN',560,-200,{K:+(1/psi).toPrecision(6)},{label:'1/ψ̂'}),C('TGir','TAGO',650,-200,{name:'i_ref'}),
      C('SUMts','SUM',590,-130,{signs:'+-'},{label:'τ_sat − τ*'}),C('TGts','TAGO',660,-130,{name:'tr_ω'}));
     wires.push(['TFir:y','SUMi:a'],['KW:y','SUMw:a',[[150,-210]]],['TFw1:y','SUMw:b',[[160,-160],[160,-190]]],['SUMw:y','PIs:u'],['TFts:y','PIs:tr',[[290,-140]]],
      ['PIs:y','SUMt:a',[[330,-200],[330,-210]]],['TFw2:y','GBa:u'],['GBa:y','SUMt:b',[[340,-100],[340,-190]]],['SUMt:y','SATt:u'],['SATt:y','GPsi:u'],['GPsi:y','TGir:u'],
      ['SATt:y','SUMts:a',[[515,-200],[515,-140]]],['SUMt:y','SUMts:b',[[420,-200],[420,-105],[550,-105],[550,-120]]],['SUMts:y','TGts:u']);
     panes=[[['Y:M1','ω'],['Y:KW','ω_ref']],[['Y:AM1','i_a'],['Y:GPsi','i_ref']],[['D:PWM1','D']]];stopT=.4;}}
   return project(comps,wires,{sim:{hDiv:100,speed:300,stopT},scope:{panes,window:{unit:'T',n:Math.round(stopT*fs)}},
    meta:{Vdc,Ra,La,psi,J:Jm,bm,fs,fc:200,ac,as,act:act?1:0,Imax,kpc,kic,Rac,kps,kis,bac,mode:o.mode,wref:150,TL:10,tTL:.25,tw:.02}});}});
 // ------------------------------------------------------------------ 3.17: subcircuits (ROADMAP §9)
 // one leg (PWM, switch, diode, inductor) as a definition; N instances with their own phase, interleaved on one output
 T.push({id:'sub_legs',group:'Υποκυκλώματα (3.17)',title:'Πολυφασικός buck από ένα υποκύκλωμα σκέλους',theory:'formula',topology:'sub_legs',
  options:[{k:'N',label:'Σκέλη N',options:[['2','2'],['3','3'],['4','4']],def:'3'},
   {k:'drive',label:'Οδήγηση',options:[['shift','Μετατοπισμένη: φάση k·360°/N ανά instance'],['common','Συμφασική (ίδια φάση)']],def:'shift'},
   {k:'D',label:'D',options:[['0.5','0,5'],['0.3','0,3'],['0.75','0,75']],def:'0.5'}],
  desc:'Ένα σκέλος buck (PWM, διακόπτης, δίοδος, πηνίο) είναι ένας ορισμός υποκυκλώματος με δύο θύρες, «in» και «out». Τα N instances του κάθονται παράλληλα ανάμεσα στην πηγή και τον πυκνωτή εξόδου. Κάθε instance έχει τις δικές του δημόσιες παραμέτρους (φάση, D, L, f_s) και τη δική του κατάσταση, ενώ τα στοιχεία και τα σύρματα είναι κοινά: μια αλλαγή μέσα σε ένα instance (διπλό κλικ) αλλάζει όλα τα σκέλη μαζί.',
  tasks:['Διπλό κλικ σε ένα σκέλος: ανοίγει ο ορισμός, με τις ζωντανές τιμές αυτού του instance. Βγες με «⌂ Κύκλωμα» ή «↑ Έξοδος».','Διάλεξε ένα σκέλος και άλλαξε τη φάση του στο πάνελ παραμέτρων: αλλάζει μόνο αυτό. Με όλες τις φάσεις ίσες η κυμάτωση του αθροίσματος γίνεται N φορές η κυμάτωση ενός σκέλους.','Με N·D ακέραιο (π.χ. N = 2, D = 0,5) η κυμάτωση του αθροίσματος μηδενίζεται: δες το σήμα του αμπερομέτρου A_o.','Διάλεξε τα στοιχεία ενός σκέλους μέσα στον ορισμό και πάτα ⤴ σε μια παράμετρο: γίνεται δημόσια. Ctrl+Shift+G σε ένα instance το κάνει πάλι ανοιχτό κύκλωμα.'],
  build(o){const N=Math.min(4,Math.max(2,+o.N||3)),shift=o.drive!=='common',D=+o.D||.5,Vin=48,fs=50e3,L=100e-6,Cc=47e-6,R=2,Vo=D*Vin,Il=Vo/R/N;
   const leg={title:'Σκέλος buck',desc:'PWM, διακόπτης, δίοδος και πηνίο, από «in» προς «out»',version:'1',
    components:[C('Pin','PORT',-120,0,{name:'in',side:'auto'},{rot:2,label:'in'}),C('S1','SW',-40,0,{pwm:'PWM1',out:'a',body:false},{rot:3,flip:true}),J('J1',20,0),
     C('D1','D',20,50,{},{rot:3}),gnd(20,110),C('L1','L',80,0,{L,i0:Il}),C('Pout','PORT',170,0,{name:'out',side:'auto'},{label:'out'}),C('PWM1','PWM',-40,-80,{fs,D,phase:0,carrier:'saw'})],
    wires:[['Pin:p','S1:d'],['S1:s','J1'],['J1','L1:a'],['J1','D1:k'],['D1:a','G1:g'],['L1:b','Pout:p']].map((w,i)=>({id:'w'+(i+1),a:pin(w[0]),b:pin(w[1]),pts:[]})),
    params:[{k:'phase',label:'Φάση φέροντος',unit:'°',type:'num',def:0,bind:[['PWM1','phase']]},{k:'D',label:'D',unit:'',type:'num',def:D,bind:[['PWM1','D']]},
     {k:'L',label:'L σκέλους',unit:'H',type:'num',def:L,bind:[['L1','L']]},{k:'fs',label:'f_s',unit:'Hz',type:'num',def:fs,bind:[['PWM1','fs']]},
     {k:'i0',label:'i_L(0)',unit:'A',type:'num',def:Il,bind:[['L1','i0']]}]};
   // each instance starts on its own periodic current (as the polyphase exercise): the mean plus the ripple at its carrier position
   const dI=Vin*D*(1-D)/(L*fs),i0=ph=>+(Il+dI*rippleDev(((-ph/360)%1+1)%1,D,true)).toPrecision(8);
   const y=k=>60+130*k,yb=y(N-1)+90,comps=[C('V1','VDC',60,y(0)+60,{V:Vin},{label:'V_in'}),gnd(60,yb+40)],wires=[['V1:n','JG0']];
   comps.push(J('JG0',60,yb));
   for(let k=0;k<N;k++){const ph=shift?+(360*k/N).toFixed(6):0;comps.push(C('X'+(k+1),'SUB',260,y(k),{def:'leg',phase:ph,i0:i0(ph)},{label:'σκέλος '+(k+1)}),J('JA'+k,160,y(k)),J('JB'+k,360,y(k)));
    wires.push(['JA'+k,'X'+(k+1)+':in'],['X'+(k+1)+':out','JB'+k]);if(k){wires.push(['JA'+(k-1),'JA'+k],['JB'+(k-1),'JB'+k]);}}
   wires.push(['V1:p','JA0',[[60,y(0)]]]);
   comps.push(C('AM1','AM',430,y(0),{},{label:'A_o',lbl:'below'}),C('C1','C',520,y(0)+60,{C:Cc,v0:Vo}),C('R1','R',600,y(0)+60,{R},{rot:1}),J('JO',520,y(0)),J('JG1',520,yb),J('JG2',600,yb));
   wires.push(['JB0','AM1:a'],['AM1:b','JO'],['JO','C1:p'],['JO','R1:a',[[600,y(0)]]],['C1:n','JG1',[[520,yb]]],['R1:b','JG2'],['JG0','JG1'],['JG1','JG2'],['JG0','G1:g']);
   for(const c of comps)if(c.id==='G1'){c.x=60;c.y=yb+40;}
   const pr=project(comps,wires,{subcircuits:{leg},sim:{hDiv:200,speed:100,stopT:4e-3},
    scope:{panes:[[['V:C1','v_o']],[['I:X1/L1','i σκέλους 1'],['I:X2/L1','i σκέλους 2']],[['Y:AM1','i_o (άθροισμα)']]],window:{unit:'T',n:4}},
    meta:{N,shift,D,Vin,fs,L,C:Cc,R,Vo,Il}});
   return pr;}});
 // ------------------------------------------------------------------ 3.18: buses and vectors (ROADMAP §3)
 // A grid-side converter (average model) behind a three-phase R–L line, with a current loop in dq. Every three-phase
 // connection is one bus wire; the PI works on the dq vector: one sum, one gain, one integrator for both axes.
 // Plant in dq (θ = ωt − 90°, d on the grid voltage): L·di_d/dt = v_d − e_d − R·i_d + ωL·i_q, L·di_q/dt = v_q − e_q − R·i_q − ωL·i_d.
 // v* = PI(e) + e_dq + ωL·(−i_q, i_d) with K_p = ω_c·L, K_i = ω_c·R: i_dq/i*_dq = ω_c/(s + ω_c) on each axis.
 T.push({id:'bus_dq',group:'Δίαυλοι (3.18)',title:'Βρόχος ρεύματος dq με διαύλους: τριφασικός μετατροπέας προς δίκτυο',theory:'formula',topology:'bus_dq',
  options:[{k:'wc',label:'Εύρος ζώνης f_c',options:[['200','200 Hz'],['100','100 Hz'],['400','400 Hz']],def:'200'},
   {k:'dec',label:'Αποσύζευξη ωL',options:[['on','Με αποσύζευξη'],['off','Χωρίς']],def:'on'},
   {k:'iq',label:'Βήμα i_q* στα 25 ms',options:[['5','5 A'],['-5','−5 A'],['0','0 A']],def:'5'}],
  desc:'Ένας τριφασικός μετατροπέας (μέσο μοντέλο: τρεις πηγές ελεγχόμενες από σήμα) δίνει ρεύμα στο δίκτυο μέσα από γραμμή R–L. Κάθε τριφασική σύνδεση είναι ένα σύρμα-δίαυλος: η πηγή του δικτύου, οι θύρες «abc» των δύο υποκυκλωμάτων, τα ρεύματα i και η τάση v*. Ο ελεγκτής δουλεύει πάνω στο διάνυσμα dq: ένα άθροισμα, ένα κέρδος K_p, ένα K_i και ένας ολοκληρωτής για τους δύο άξονες μαζί (το καθένα γίνεται δύο μπλοκ, ένα ανά στοιχείο). Η επιλογή «2, 1» αντιστρέφει το dq σε qd για την αποσύζευξη ωL.',
  tasks:['Δες τα παχιά σύρματα: το νούμερο πάνω τους είναι το πλάτος του διαύλου (3 για abc, 2 για dq).','Στο scope, το i_d ακολουθεί το βήμα στα 10 ms με σταθερά χρόνου 1/ω_c, και το i_q στα 25 ms χωρίς να πειράξει το i_d. Δοκίμασε «Χωρίς αποσύζευξη»: τώρα το ένα ρεύμα σπρώχνει το άλλο.','Διπλό κλικ στη «γραμμή»: μέσα, ένας δίαυλος αγωγών χωρίζει τη θύρα abc σε τρεις φάσεις, και ένα Mux μαζεύει τα τρία ρεύματα στον δίαυλο i.','Βάλε στο scope το «v_a» του αντιστροφέα: το πλάτος του είναι |e + (R + jωL)·i| από τη θεωρία.'],
  build(o){const E=325,R=.5,L=5e-3,f=50,w=2*Math.PI*f,fc=+o.wc||200,wc=2*Math.PI*fc,Kp=wc*L,Ki=wc*R,id=10,iq=+o.iq||0,dec=o.dec!=='off',t1=.01,t2=.025,r=x=>+x.toPrecision(10);
   const ws=l=>l.map((x,i)=>({id:'w'+(i+1),a:pin(x[0]),b:pin(x[1]),pts:x[2]||[]}));
   const inv={title:'Αντιστροφέας (μέση τιμή)',desc:'Τρεις πηγές ελεγχόμενες από τον δίαυλο v*, με κοινό ουδέτερο στη γη',version:'1',params:[],
    components:[C('Pv','SIN',-140,80,{name:'v',side:'auto',width:'3'},{label:'v*'}),C('DX','DEMUX',-80,80,{n:3}),
     C('Va','VDC',20,0,{ctl:'sig',V:0},{label:'v_a'}),C('Vb','VDC',20,120,{ctl:'sig',V:0},{label:'v_b'}),C('Vc','VDC',20,240,{ctl:'sig',V:0},{label:'v_c'}),
     C('B1','EBUS',140,80,{n:3}),C('Pabc','PORT',220,80,{name:'abc',side:'auto',width:'3'},{label:'abc'}),C('G1','GND',20,320,{},{label:'0 V'})],
    wires:ws([['Pv:y','DX:u'],['DX:y1','Va:u'],['DX:y2','Vb:u'],['DX:y3','Vc:u'],['Va:p','B1:a'],['Vb:p','B1:b'],['Vc:p','B1:c'],['B1:bus','Pabc:p'],['Va:n','G1:g'],['Vb:n','G1:g'],['Vc:n','G1:g']])};
   const line={title:'Γραμμή R–L τριφασική',desc:'R και L ανά φάση, αμπερόμετρα και δίαυλος ρευμάτων i (από τον αντιστροφέα προς το δίκτυο)',version:'1',
    params:[{k:'R',label:'R ανά φάση',unit:'Ω',type:'num',def:R,bind:[['Ra','R'],['Rb','R'],['Rc','R']]},{k:'L',label:'L ανά φάση',unit:'H',type:'num',def:L,bind:[['La','L'],['Lb','L'],['Lc','L']]}],
    components:[C('Pa','PORT',-190,40,{name:'a',side:'auto',width:'3'},{rot:2,label:'a'}),C('BA','EBUS',-120,40,{n:3},{flip:true}),
     C('Aa','AM',-40,0,{},{label:'A_a'}),C('Ab','AM',-40,80,{},{label:'A_b'}),C('Ac','AM',-40,160,{},{label:'A_c'}),
     C('Ra','R',60,0,{R}),C('Rb','R',60,80,{R}),C('Rc','R',60,160,{R}),C('La','L',150,0,{L}),C('Lb','L',150,80,{L}),C('Lc','L',150,160,{L}),
     C('BB','EBUS',240,40,{n:3}),C('Pb','PORT',300,40,{name:'b',side:'auto',width:'3'},{label:'b'}),
     C('MX','MUX',60,-100,{n:3}),C('Pi','SOUT',140,-100,{name:'i',side:'b',width:'3'},{label:'i'})],
    wires:ws([['Pa:p','BA:bus'],['BA:a','Aa:a'],['BA:b','Ab:a'],['BA:c','Ac:a'],['Aa:b','Ra:a'],['Ab:b','Rb:a'],['Ac:b','Rc:a'],['Ra:b','La:a'],['Rb:b','Lb:a'],['Rc:b','Lc:a'],
     ['La:b','BB:a'],['Lb:b','BB:b'],['Lc:b','BB:c'],['BB:bus','Pb:p'],['Aa:y','MX:u1'],['Ab:y','MX:u2'],['Ac:y','MX:u3'],['MX:y','Pi:u']])};
   const comps=[C('TV','TAGI',60,160,{name:'v*'}),C('XI','SUB',200,160,{def:'inv'},{label:'αντιστροφέας'}),C('XL','SUB',440,160,{def:'line'},{label:'γραμμή'}),
    C('E','VAC3',680,160,{Vpk:E,f,phase:0,conn:'bus'},{flip:true,label:'δίκτυο'}),gnd(680,240),
    C('CL','CLARKE',560,320,{conn:'bus'},{label:'abc → αβ'}),C('TT1','TAGI',560,370,{name:'θ'}),C('PK','PARK',660,340,{conn:'bus'},{label:'αβ → dq'}),C('TO1','TAGO',760,340,{name:'i_dq'}),
    C('TH','RAMP',60,620,{f,shape:'saw',lo:0,hi:r(2*Math.PI),phase:90},{label:'θ = ωt − 90°'}),C('TO2','TAGO',140,620,{name:'θ'}),
    C('IR','CONST',60,440,{v:`0:0, ${t1}:${id}; 0:0, ${t2}:${iq}`},{label:'i*_dq'}),C('TI1','TAGI',60,480,{name:'i_dq'}),C('SE','SUM',160,450,{signs:'+-'},{label:'e'}),
    C('KP','GAIN',260,420,{K:r(Kp)},{label:'K_p'}),C('KI','GAIN',260,480,{K:r(Ki)},{label:'K_i'}),C('II','INT',340,480,{},{label:'∫'}),C('SP','SUM',420,440,{signs:'++'},{label:'PI'}),
    C('TI2','TAGI',260,560,{name:'i_dq'}),C('SW','BSEL',340,560,{idx:'2, 1'},{label:'(i_q, i_d)'}),C('KD','GAIN',420,560,{K:dec?`${r(-w*L)}; ${r(w*L)}`:'0'},{label:'ωL'}),
    C('EF','CONST',440,640,{v:`${E}; 0`},{label:'e_dq'}),C('SV','SUM',520,470,{signs:'+++'},{label:'v*_dq'}),
    C('IPK','IPARK',620,480,{conn:'bus'},{label:'dq → αβ'}),C('TT2','TAGI',560,520,{name:'θ'}),C('ICL','ICLARKE',720,480,{conn:'bus'},{label:'αβ → abc'}),C('TO3','TAGO',820,480,{name:'v*'})];
   const wires=[['TV:y','XI:v'],['XI:abc','XL:a'],['XL:b','E:abc'],['E:n','G1:g'],['XL:i','CL:abc'],['CL:ab','PK:ab'],['TT1:y','PK:th'],['PK:dq','TO1:u'],['TH:y','TO2:u'],
    ['IR:y','SE:a'],['TI1:y','SE:b'],['SE:y','KP:u'],['SE:y','KI:u'],['KI:y','II:u'],['KP:y','SP:a'],['II:y','SP:b'],['SP:y','SV:a'],['TI2:y','SW:u'],['SW:y','KD:u'],['KD:y','SV:b'],['EF:y','SV:c'],
    ['SV:y','IPK:dq'],['TT2:y','IPK:th'],['IPK:ab','ICL:ab'],['ICL:abc','TO3:u']];
   const pr=project(comps,wires,{subcircuits:{inv,line},sim:{hDiv:4000,speed:2,stopT:.04},
    scope:{panes:[[['Y:PK','i_d'],['Y:PK:q','i_q']],[['I:XL/La','i_a'],['I:XL/Lb','i_b'],['I:XL/Lc','i_c']],[['V:XI/Va','v_a (αντιστροφέας)'],['V:E','e_a (δίκτυο)']]],window:{unit:'T',n:2}},
    meta:{E,R,L,f,fc,wc,Kp,Ki,id,iq,dec,t1,t2,dur:.04}});
   return pr;}});
 // 4.1: network library (ROADMAP §31): network equivalent, breaker, transformer, fault, load, as one-wire buses
 T.push({id:'net_fault',group:'Δίκτυο (4.1)',title:'Βραχυκύκλωμα σε δίκτυο: IEC 60909 και συμμετρικές συνιστώσες',theory:'formula',topology:'net_fault',
  options:[{k:'kind',label:'Σφάλμα στα 40 ms',options:[['abc','Τριφασικό'],['ag','Μονοφασικό a–γη'],['ab','Διφασικό a–b'],['abg','Διφασικό με γη a–b–γη']],def:'abc'},
   {k:'xf',label:'Θέση',options:[['none','Στα άκρα του δικτύου 20 kV'],['dyn11','Πίσω από μετασχηματιστή 150/20 kV Dyn11']],def:'none'},
   {k:'z0',label:'Μηδενική ακολουθία του δικτύου',options:[['1.5','Z₀ = 1,5·Z₁'],['3','Z₀ = 3·Z₁'],['iso','Μονωμένος ουδέτερος']],def:'1.5'},
   {k:'cb',label:'Διακόπτης ισχύος',options:[['none','Μένει κλειστός'],['open','Ανοίγει στα 200 ms']],def:'none'}],
  desc:'Ένα ισοδύναμο δικτύου (S″k, X/R, Z₀) τροφοδοτεί μέσω διακόπτη ισχύος (και, αν θέλεις, μετασχηματιστή Dyn11) ένα φορτίο. Στα 40 ms γίνεται σφάλμα. Όλα τα σύρματα είναι τριφασικοί δίαυλοι. Κάθε στοιχείο της βιβλιοθήκης «Δίκτυο» είναι υποκύκλωμα από απλά στοιχεία, οπότε τα ρεύματα φαίνονται ως F1/Ia, CB1/Ia κ.λπ.',
  tasks:['Σύγκρινε το I″k κάθε φάσης στην κάρτα με τον τύπο της IEC 60909 (μόνιμη τιμή, όταν σβήσει η συνιστώσα DC με τ = X/(ωR)).','Μονοφασικό με μονωμένο ουδέτερο: σχεδόν μηδέν ρεύμα. Πίσω από το Dyn11 όμως ρέει, γιατί το αστέρι 20 kV είναι γειωμένο.','Με «Ανοίγει στα 200 ms»: κάθε πόλος σβήνει στο δικό του μηδέν ρεύματος (δες και το αρχείο συμβάντων).'],
  build(o){const xf=o.xf==='dyn11',kind=o.kind||'abc',iso=o.z0==='iso',dur=o.cb==='open'?.26:.2;
   const grid=xf?{Un:150e3,Sk:5e9,XR:10}:{Un:20e3,Sk:500e6,XR:10};Object.assign(grid,iso?{z0:'iso'}:{z0:'ratio',Z0Z1:+o.z0||1.5,XR0:5},{conn:'bus'});
   const comps=[C('G1','GRID3',120,200,grid,{label:'δίκτυο'}),C('CB1','CB3',260,200,{cmd:o.cb==='open'?'0:1, 0.2:0':'0:1',conn:'bus'}),
    C('J1','JUNC',560,200),C('F1','FLT3',560,320,{kind,ton:.04,conn:'bus'}),C('L1','LOAD3',700,320,{Un:20e3,P:5e6,Q:2e6,cn:'y',conn:'bus'})];
   const wires=[['G1:abc','CB1:abc1'],['J1:j','F1:abc'],['J1:j','L1:abc']];
   if(xf){comps.push(C('T1','XF3',420,200,{grp:'Dyn11',Sn:40e6,U1:150e3,U2:20e3,uk:10,Pk:200e3,i0:.5,conn:'bus'}));wires.push(['CB1:abc2','T1:abc1'],['T1:abc2','J1:j']);}
   else wires.push(['CB1:abc2','J1:j']);
   return project(comps,wires,{sim:{hDiv:2000,speed:5,stopT:dur},
    scope:{panes:[[['Y:F1/Ia','i_a σφάλματος'],['Y:F1/Ib','i_b σφάλματος'],['Y:F1/Ic','i_c σφάλματος']],[['Y:F1/Ig','ρεύμα προς γη'],['Y:CB1/Ia','i_a διακόπτη']]],window:{unit:'T',n:4}},
    meta:{grid,kind,xf,dur,cb:o.cb==='open',xfp:xf?{grp:'Dyn11',Sn:40e6,U1:150e3,U2:20e3,uk:10,Pk:200e3}:null}});}});
 T.push({id:'empty',group:'Νέο',title:'Κενό κύκλωμα',theory:null,options:[],desc:'Ξεκίνα από την αρχή: πρόσθεσε στοιχεία από τη βιβλιοθήκη (κλικ ή σύρσιμο), ένωσε ακροδέκτες και πάτα ▶.',tasks:['Χρειάζεται γείωση (σύμβολο 0 V) και μπλοκ PWM για τους διακόπτες.'],
  build(){return project([gnd(200,300),C('PWM1','PWM',200,80,{fs:20e3,D:.5})],[],{sim:{hDiv:200,speed:100,stopT:0},scope:{panes:[[]],window:{unit:'T',n:10}}});}});
 root.Tutorials={list:T,piGains,steadyStart,samplingPhase,rippleDev,polyDesign,polyCancel,get:id=>T.find(t=>t.id===id)};
})(window);
