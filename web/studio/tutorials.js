'use strict';
// Tutorial circuits. Each tutorial is a function of its options that returns a
// complete, editable project: components, wires, simulation settings and scopes.
(function(root){
 const C=(id,type,x,y,params={},o={})=>({id,type,x,y,rot:o.rot||0,flip:!!o.flip,label:o.label||id,params,...(o.lbl?{lbl:o.lbl}:{}),...(o.inp?{inp:o.inp,...(o.inpName?{inpName:o.inpName}:{}),...(o.inpDesc?{inpDesc:o.inpDesc}:{})}:{})});   // 4.17.1: inp, inpName, inpDesc (inputs of the circuit)
 const J=(id,x,y)=>C(id,'JUNC',x,y,{},{label:''});
 const pin=s=>{const [c,p]=s.split(':');return {c,p:p||'j'};};
 // version 3 (3.18): wire names join (Bus.namesJoin); no tutorial has one name on two different nets
 const project=(comps,wires,extra={})=>({version:4,components:comps,wires:wires.map((w,i)=>({id:'w'+(i+1),a:pin(w[0]),b:pin(w[1]),pts:w[2]||[],...(w[3]||{})})),...extra});
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
  options:[{k:'D',label:'Duty',options:[['0.4','D = 0,4'],['0.6','D = 0,6']],def:'0.4'},
   {k:'ctrl',label:'Έλεγχος (4.17)',options:[['ol','Ανοικτός βρόχος (σταθερό D)'],['pi','PI με κέρδη από το κύκλωμα'],['pid','PID με κέρδη από το κύκλωμα']],def:'ol'}],
  desc:'Η ενέργεια μεταφέρεται μέσω του πυκνωτή C1. Και τα δύο πηνία έχουν συνεχές ρεύμα, άρα και η είσοδος και η έξοδος δεν διακόπτονται. V_o = −V_in·D/(1−D). Με PI/PID (4.17) το PWM μετρά τη V_o και τα κέρδη βγαίνουν από το μέσο μοντέλο του κυκλώματος: ο Ćuk αντιστρέφει (∂V_o/∂D < 0), άρα τα κέρδη είναι αρνητικά.',
  tasks:['Scope τάσης στον C1: μέση τιμή V_in + |V_o|.','Σύγκρινε τις κυματώσεις των δύο πηνίων με αυτές του buck–boost.','Με «PI με κέρδη από το κύκλωμα» δες στις παραμέτρους του PWM τη λίστα ρόλων (V_in, L1, C1, L2, C2, R) και στον ζωντανό πίνακα τα κέρδη. Άλλαξε το C2 ή το R: τα κέρδη ξαναϋπολογίζονται.','Βάλε «Κέρδη: Χειροκίνητα» με θετικά K_p, K_i: η προειδοποίηση λέει ότι ο βρόχος έχει θετική ανάδραση, και η V_o φεύγει από την αναφορά.'],
  build(o){const D=+o.D,Vo=-12*D/(1-D),Io=Vo/8,cl=o.ctrl==='pi'||o.ctrl==='pid';
   const pwm=cl?{fs:100e3,mode:'pi',gain:'auto',ctl:o.ctrl,sensor:'C2',qty:'V',ref:`0:${+Vo.toFixed(4)}, 0.01:${+(1.25*Vo).toFixed(4)}`,dmin:.05,dmax:.85}:{fs:100e3,D};
   return project([C('V1','VDC',100,210,{V:12},{label:'V_in'}),gnd(100,300),C('L1','L',170,150,{L:200e-6,i0:+(Math.abs(Io)*D/(1-D)).toFixed(5)}),J('JA',230,150),C('S1','SW',230,200,{pwm:'PWM1',out:'a',body:false}),C('C1','C',290,150,{C:10e-6,v0:+(12-Vo).toFixed(5)},{rot:3}),
     J('JB',350,150),C('D1','D',350,200,{},{rot:1}),C('L2','L',420,150,{L:200e-6,i0:+Io.toFixed(5)}),J('JO',490,150),C('C2','C',490,210,{C:100e-6,v0:+Vo.toFixed(5)}),C('R1','R',570,210,{R:8},{rot:1,label:'R'}),
     J('J3',100,270),J('J4',230,270),J('J5',350,270),J('J6',490,270),C('PWM1','PWM',230,60,pwm)],
    [['V1:p','L1:a',[[100,150]]],['L1:b','JA'],['JA','S1:d'],['JA','C1:p'],['C1:n','JB'],['JB','D1:a'],['JB','L2:a'],['L2:b','JO',[],{name:'v_o'}],['JO','C2:p'],['JO','R1:a',[[570,150]]],
     ['V1:n','J3'],['J3','G1:g'],['J3','J4'],['J4','S1:s'],['J4','J5'],['J5','D1:k'],['J5','J6'],['J6','C2:n'],['J6','R1:b',[[570,270]]]],
    {sim:{hDiv:200,speed:200,stopT:cl?0.03:0},scope:{panes:[[['I:L1','i_L1'],['I:L2','i_L2']],[['V:C1','v_C1']],[['V:C2','v_o'],...(cl?[['REF:PWM1','αναφορά']]:[])],...(cl?[[['D:PWM1','D']]]:[])],window:cl?{unit:'T',n:3000}:{unit:'T',n:10}}});}});
 // ------------------------------------------------------------------ SEPIC
 T.push({id:'sepic',group:'DC-DC χωρίς απομόνωση',title:'SEPIC',theory:'formula',topology:'sepic',
  options:[{k:'D',label:'Duty',options:[['0.4','D = 0,4 · V_o < V_in'],['0.6','D = 0,6 · V_o > V_in']],def:'0.6'},
   {k:'ctrl',label:'Έλεγχος (4.17)',options:[['ol','Ανοικτός βρόχος (σταθερό D)'],['pi','PI με κέρδη από το κύκλωμα'],['pid','PID με κέρδη από το κύκλωμα']],def:'ol'}],
  desc:'Μη αναστρέφουσα έξοδος που μπορεί να είναι μεγαλύτερη ή μικρότερη από την είσοδο: V_o = V_in·D/(1−D). Ο C1 φορτίζεται μέσα στην περίοδο στη V_in. Με PI/PID (4.17) τα κέρδη βγαίνουν από το μέσο μοντέλο του κυκλώματος.',
  tasks:['Scope τάσης C1: μέση τιμή V_in.','Δες ότι το ρεύμα της διόδου είναι i_L1 + i_L2 όταν ο S1 είναι OFF.','Με PI ή PID από το κύκλωμα: σύγκρινε τη f_c και το περιθώριο φάσης της κάρτας με τον Ćuk. Και οι δύο έχουν μηδενικό στο δεξί ημιεπίπεδο.'],
  build(o){const D=+o.D,Vo=12*D/(1-D),Io=Vo/18,cl=o.ctrl==='pi'||o.ctrl==='pid';
   const pwm=cl?{fs:100e3,mode:'pi',gain:'auto',ctl:o.ctrl,sensor:'C2',qty:'V',ref:`0:${+Vo.toFixed(4)}, 0.01:${+(1.25*Vo).toFixed(4)}`,dmin:.05,dmax:.85}:{fs:100e3,D};
   return project([C('V1','VDC',100,210,{V:12},{label:'V_in'}),gnd(100,300),C('L1','L',170,150,{L:200e-6,i0:+(Io*D/(1-D)).toFixed(5)}),J('JA',230,150),C('S1','SW',230,200,{pwm:'PWM1',out:'a',body:false}),C('C1','C',290,150,{C:10e-6,v0:12},{rot:3}),
     J('JB',350,150),C('L2','L',350,210,{L:200e-6,i0:+(-Io).toFixed(5)},{rot:1}),C('D1','D',410,150),J('JO',480,150),C('C2','C',480,210,{C:100e-6,v0:+Vo.toFixed(5)}),C('R1','R',560,210,{R:18},{rot:1,label:'R'}),
     J('J3',100,270),J('J4',230,270),J('J5',350,270),J('J6',480,270),C('PWM1','PWM',230,60,pwm)],
    [['V1:p','L1:a',[[100,150]]],['L1:b','JA'],['JA','S1:d'],['JA','C1:p'],['C1:n','JB'],['JB','L2:a'],['JB','D1:a'],['D1:k','JO',[],{name:'v_o'}],['JO','C2:p'],['JO','R1:a',[[560,150]]],
     ['V1:n','J3'],['J3','G1:g'],['J3','J4'],['J4','S1:s'],['J4','J5'],['J5','L2:b'],['J5','J6'],['J6','C2:n'],['J6','R1:b',[[560,270]]]],
    {sim:{hDiv:200,speed:200,stopT:cl?0.03:0},scope:{panes:[[['I:L1','i_L1'],['I:L2','i_L2']],[['V:C1','v_C1']],[['V:C2','v_o'],...(cl?[['REF:PWM1','αναφορά']]:[])],...(cl?[[['D:PWM1','D']]]:[])],window:cl?{unit:'T',n:3000}:{unit:'T',n:10}}});}});
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
 // ------------------------------------------------------------------ 4.19.6 (ROADMAP §76): the measuring blocks on a rectifier with a capacitor
 // The line current of a diode bridge with a capacitor is pulses near the peaks of the voltage: its THD, its third harmonic, and the
 // power at the source (P, Q₁, S, PF, PF₁) from the blocks, and the mean of the DC voltage. The voltmeter is on the source itself (an
 // ideal sine), so PF = PF₁·I₁/I = PF₁/√(1 + THD²) with the THD of IEEE Std 1459 (the card shows both)
 T.push({id:'pq_rect',group:'Ανορθωτές',title:'Ανορθωτής με πυκνωτή · αρμονικές και συντελεστής ισχύος',theory:'formula',topology:'pq_rect',
  options:[{k:'Ls',label:'Αυτεπαγωγή πηγής',options:[['0.0002','L_s = 0,2 mH'],['0.002','L_s = 2 mH'],['0.01','L_s = 10 mH']],def:'0.002'},
   {k:'R',label:'Φορτίο',options:[['100','R = 100 Ω'],['30','R = 30 Ω']],def:'100'},
   {k:'win',label:'Παράθυρο των μπλοκ',options:[['per','Ανά περίοδο'],['run','Κυλιόμενο']],def:'per'}],
  desc:'Πηγή 230 V / 50 Hz με αυτεπαγωγή L_s, μονοφασική γέφυρα διόδων, πυκνωτής 1 mF και φορτίο R. Το ρεύμα της πηγής είναι παλμοί γύρω από τις κορυφές της τάσης. Τα μπλοκ μέτρησης δίνουν ως σήματα το THD του ρεύματος, την 3η αρμονική του, την ισχύ στην πηγή (P, Q₁, S, PF, PF₁) και τη μέση τάση στον πυκνωτή.',
  tasks:['Τρέξε μερικές περιόδους: οι τιμές των μπλοκ γράφονται πάνω στο σχέδιο. Το PF είναι μικρότερο από το PF₁: η διαφορά είναι η παραμόρφωση του ρεύματος, PF = PF₁/√(1 + THD²) με την τάση ημιτονική (η κάρτα θεωρίας δείχνει και τα δύο).',
   'Άλλαξε το L_s: με μεγαλύτερο L_s οι παλμοί απλώνουν, το THD πέφτει και το PF ανεβαίνει, ενώ το PF₁ πέφτει λίγο (το ρεύμα καθυστερεί).',
   'Με «Κυλιόμενο» παράθυρο οι έξοδοι αλλάζουν συνεχώς και φτάνουν στις ίδιες τιμές με το «Ανά περίοδο» όταν η λειτουργία είναι περιοδική.'],
  build(o){const Vpk=230*Math.SQRT2,R=+o.R,w={win:o.win==='run'?'run':'per',f:50},sg=(id,x,y,name)=>C(id,'TAGI',x,y,{name},{label:'',lbl:'none'});
   const comps=[C('D1','D',200,160,{},{rot:3}),C('D3','D',200,260,{},{rot:3}),J('JA',200,210),C('D2','D',480,160,{},{rot:3}),C('D4','D',480,260,{},{rot:3}),J('JB',480,210),
    J('JP',200,110),J('JPR',480,110),J('JN',200,310),J('JNR',480,310),gnd(200,340),
    C('AM1','AM',250,210,{},{label:'i_s'}),C('V1','VAC',340,210,{Vpk,f:50},{rot:1,label:'v_s',lbl:'above'}),C('L1','L',430,210,{L:+o.Ls},{label:'L_s',lbl:'above'}),
    C('VM1','VM',340,260,{},{label:'v_s',lbl:'none'}),J('JC1',560,110),J('JC2',560,310),C('C1','C',560,210,{C:1e-3,v0:300},{label:'C'}),J('JR1',640,110),J('JR2',640,310),
    C('R1','R',640,210,{R},{rot:1,label:'R'}),C('VM2','VM',720,210,{},{label:'v_d'}),
    C('TS','TAGO',290,140,{name:'i_s'},{label:'',lbl:'none'}),C('TV','TAGO',420,260,{name:'v_s'},{label:'',lbl:'none'}),
    sg('GI1',150,470,'i_s'),sg('GV1',150,430,'v_s'),C('PW','PQ1',260,450,w,{label:'Ισχύς'}),
    sg('GI2',420,450,'i_s'),C('TH','THD',510,450,{...w,dc:'out',scale:'%'},{label:'THD(i_s)'}),
    sg('GI3',650,450,'i_s'),C('F3','FOUR',740,450,{...w,nu:3},{label:'i_s, 3η'}),C('AV','AVG',820,210,w,{label:'V_d'})];
   const wires=[['JA','AM1:a'],['AM1:b','V1:n'],['V1:p','L1:a'],['L1:b','JB'],['D1:a','JA'],['JA','D3:k'],['D2:a','JB'],['JB','D4:k'],
    ['D1:k','JP'],['JP','JPR',[],{name:'v_d+'}],['JPR','D2:k'],['D3:a','JN'],['JN','JNR'],['JNR','D4:a'],['JN','G1:g'],
    ['JPR','JC1'],['JC1','C1:p'],['C1:n','JC2'],['JC2','JNR'],['JC1','JR1'],['JR1','R1:a'],['R1:b','JR2'],['JR2','JC2'],['JR1','VM2:p',[[720,110]]],['VM2:n','JR2',[[720,310]]],
    ['VM1:p','V1:p',[[380,230]]],['VM1:n','V1:n',[[300,290]]],
    ['AM1:y','TS:u',[[250,140]]],['VM1:y','TV:u'],['GV1:y','PW:v',[[220,430],[220,440]]],['GI1:y','PW:i',[[220,470],[220,460]]],['GI2:y','TH:u'],['GI3:y','F3:u'],['VM2:y','AV:u']];
   return project(comps,wires,{sim:{hDiv:400,speed:2,stopT:0},scope:{panes:[[['V:V1','v_s']],[['Y:AM1','i_s']],[['Y:PW:pf','PF'],['Y:PW:pf1','PF₁']],[['Y:TH','THD(i_s) %']]],window:{unit:'T',n:2}},
    meta:{Vpk,R,Ls:+o.Ls,win:w.win}});}});
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
  desc:'Σύγχρονη ημιγέφυρα ανάμεσα σε ζυγό 50 V και αποθήκευση. Το πηνίο είναι πάντα στη χαμηλή πλευρά και D είναι ο λόγος κατάτμησης του κάτω S2. Με αποθήκευση > 50 V η εκφόρτιση είναι buck, με < 50 V είναι boost. Η φορά της ισχύος αλλάζει μόνο μέσω του ρεύματος: στο D₀ = 1 − V_lo/V_hi το ρεύμα μένει όπου είναι.',
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
  desc:'Η διάταξη της Άσκησης 1 (ζυγός 50 V, αποθήκευση 60–100 V, L = 5,6 μH, 20 kHz) με ένα μπλοκ δειγματοληψίας και συγκράτησης (S&H) στο ρεύμα του πηνίου. Το S&H παίρνει δείγματα σε σημεία του ίδιου φέροντος που οδηγεί τη φάση: στο reset του πριονωτού, στο μέγιστο του τριγώνου, ή και στα δύο ακρότατα του τριγώνου. Στο scope φαίνονται το πραγματικό i_L, τα δείγματα (κουκκίδες) και η κρατημένη τιμή ως βαθμίδες, μαζί με το φέρον, το D και το gate του S2.',
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
  desc:'N όμοιοι κλάδοι ημιγέφυρας ανάμεσα στον ζυγό 50 V και την αποθήκευση, ο καθένας με δικό του ασύζευκτο πηνίο, ίδιο λόγο κατάτμησης και ίδια συχνότητα. Τα φέροντα έχουν κοινό ρολόι. Στη μετατοπισμένη οδήγηση ο κλάδος k καθυστερεί κατά k·T/N. Το ρεύμα του ζυγού είναι το άθροισμα των ρευμάτων των κλάδων. Κάθε κλάδος ξεκινά από την περιοδική του κυματομορφή στη δική του φάση, με κοινό μέσο ρεύμα P/(N·V_bus).',
  tasks:['Σύγκρινε συμφασική και μετατοπισμένη οδήγηση: η κυμάτωση κάθε κλάδου είναι ίδια, η κυμάτωση του αθροίσματος όχι.','Μετατοπισμένα, η κυμάτωση του αθροίσματος έχει συχνότητα N·f. Στο «σημείο ακύρωσης» (N·D ακέραιος) μηδενίζεται θεωρητικά.','Στον πίνακα ζωντανών παραμέτρων: «Συμφασικά» ↔ «Μετατοπισμένα» ενώ τρέχει. Η αλλαγή φάσης αφήνει μόνιμη ανισοκατανομή: με ιδανικούς κλάδους και ίδιο λόγο κατάτμησης τίποτα δεν τη διορθώνει. Γι\' αυτό στην πράξη κάθε φάση έχει δικό της βρόχο ρεύματος.','N = 4 → 5 με την ίδια ισχύ: το ρεύμα ανά κλάδο πέφτει, και το L_min ανεβαίνει ανάλογα με το N για το ίδιο σχετικό κριτήριο.','40 kHz με «το L των 20 kHz»: η κυμάτωση μισή. Με «L_min» το L μισό και η ίδια κυμάτωση (L·f σταθερό).','«R 7,5 mΩ στον κλάδο 2» με ανοιχτό βρόχο: ο κλάδος 2 παίρνει λιγότερο ρεύμα (τα ρεύματα μοιράζονται αντίστροφα με τις αντιστάσεις). Με «PI ανά φάση» κάθε κλάδος κρατά P/N.','«PI ανά φάση» και «Συμφασικά» ↔ «Μετατοπισμένα» ζωντανά: η ανισοκατανομή μετά την αλλαγή φάσης διορθώνεται μόνη της.'],
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
 // ------------------------------------------------------------------ 4.19.4: current control from plain blocks (PE2, exercise 3)
 // One branch: storage source, inductor, half bridge on the DC bus (a source behind 1 mΩ beside 100 mF with 0,2 mΩ in series).
 // The duty of the upper switch is D = (V_st − u)/V_dc with u the output of the PI in volts: the inductor then sees u, and the
 // loop sees 1/(sL). Closed loop (s + a)(s + b): K_p = L(a + b), K_i = L·a·b; a = ln 9/t_r for a rise of t_r, and b so small
 // that the overshoot, about b/(a − b), is 1 % of the step: a reversal of 2·I_n then stays inside ±2 % of I_n. Example values.
 function ccDesign(L,tr=1e-3,b=25){const a=Math.round(Math.log(9)/tr/100)*100;return {a,b,kp:+(L*(a+b)).toPrecision(4),ki:+(L*a*b).toPrecision(4)};}
 T.push({id:'current_ctl',group:'Αμφίδρομος · μπαταρία (PE2)',title:'Άσκηση 3 · Έλεγχος ρεύματος από μπλοκ',theory:'formula',topology:'current_ctl',
  options:[{k:'test',label:'Δοκιμή',options:[['A','Α · 0,25 I_n → I_n → 0,25 I_n'],['B','Β · +I_n → −I_n → +I_n'],['C','Γ · 0,5 I_n και βήμα V_st ±0,1·(V_max − V_min)']],def:'A'},
   {k:'vst',label:'V_st',options:[['min','24 V'],['mid','30 V'],['max','36 V']],def:'mid'},
   {k:'carrier',label:'Φέρον και δείγμα',options:[['tri','Συμμετρικό τρίγωνο · δείγμα στο μέγιστο'],['saw','Πριονωτό, trailing-edge · δείγμα στην αρχή της περιόδου']],def:'tri'},
   {k:'vdc',label:'V_dc στη διαίρεση',options:[['sh','Με S&H, μαζί με το ρεύμα'],['raw','Κατευθείαν από το βολτόμετρο']],def:'sh'}],
  desc:'Ένας κλάδος αμφίδρομου μετατροπέα: αποθήκευση 24–36 V, πηνίο 20 μH, ημιγέφυρα στον ζυγό των 50 V, 20 kHz, I_n = 100 A. Ο ζυγός είναι πηγή 50 V πίσω από 1 mΩ, παράλληλα με πυκνωτή 100 mF με ESR 0,2 mΩ. Ο ελεγκτής είναι μόνο απλά μπλοκ ενωμένα με σύρματα σημάτων: ρολόι, S&H στο i_L, στο V_st και στο V_dc, αναφορά, άθροισμα, PI με όρια, δεύτερο άθροισμα, διαίρεση, κορεσμός, φέρον, συγκριτής και NOT. Ο PI βγάζει τάση u και ο λόγος κατάτμησης του πάνω διακόπτη είναι D = (V_st − u)/V_dc: το πηνίο βλέπει τότε u και ο βρόχος μόνο τον ολοκληρωτή 1/(sL). Οι τιμές είναι παράδειγμα· βάλε τις δικές σου από τις Ασκήσεις 1 και 2. Πρόταση σχεδιασμού, όχι λύση.',
  tasks:['Δοκιμή Α με τρίγωνο: τρέξε έως το τέλος (⏩). Το δείγμα στο μέγιστο του φέροντος πέφτει στο μέσο της κυμάτωσης, άρα ισούται με τη μέση τιμή του i_L. Άνοδος, υπερύψωση και αποκατάσταση μετριούνται στην κάρτα θεωρίας.','Πριονωτό: το δείγμα στην αρχή της περιόδου είναι η κορυφή του ρεύματος. Ο βρόχος κρατά το δείγμα στην αναφορά και η μέση τιμή μένει Δi/2 πιο κάτω.','Δοκιμή Β: αναστροφή του ρεύματος. Στο βήμα το u πηδά κατά K_p·2·I_n = 8,9 V, το D φεύγει από το V_st/V_dc και γυρίζει πίσω. Μετά το βήμα μένει μια μικρή ουρά που σβήνει με 1/b = 40 ms: γι\' αυτό το b είναι μικρό.','Δοκιμή Γ: βήμα στο V_st. Η πρόσθια τροφοδότηση το βλέπει στο επόμενο δείγμα, άρα η απόκλιση κρατά λίγες περιόδους.','«Κατευθείαν από το βολτόμετρο»: η V_dc πηδά κάθε φορά που αλλάζει ο S1 και το D την ακολουθεί μέσα στην περίοδο. Ο βρόχος V_dc → D → συγκριτής → διακόπτης → V_dc δεν έχει τότε καμία κατάσταση. Ο λύτης εδώ τον περνά με την ίδια απόκριση, και με σταθερό και με μεταβλητό βήμα· ένας λύτης που ζητά ο βρόχος να συμφωνεί ακριβώς στη στιγμή της μεταγωγής μπορεί να μείνει σε συνεχόμενες μεταγωγές. Γι\' αυτό το S&H.','Άλλαξε K_p, K_i ή τα όρια του PI από τις ζωντανές παραμέτρους και ξανατρέξε.'],
  build(o){
   const Vdc=50,Rs=1e-3,Cb=0.1,esr=0.2e-3,fs=20e3,L=20e-6,In=100,Vmin=24,Vmax=36,Vst=({min:Vmin,mid:30,max:Vmax})[o.vst]||30;
   const test=['A','B','C'].includes(o.test)?o.test:'A',saw=o.carrier==='saw',raw=o.vdc==='raw',g=ccDesign(L),t1=4e-3,t2=10e-3,stopT=16e-3,dV=+(0.1*(Vmax-Vmin)).toFixed(3);
   const lev=test==='B'?[In,-In,In]:test==='C'?[.5*In,.5*In,.5*In]:[.25*In,In,.25*In],i0=lev[0];
   const ref=test==='C'?`0:${i0}`:`0:${lev[0]}, ${t1}:${lev[1]}, ${t2}:${lev[2]}`,vs=test==='C'?[Vst,Vst+dV,Vst]:[Vst,Vst,Vst];
   const sw={gate:'sig',model:'mos',Ron:1e-6,body:true};
   const comps=[
    // power stage
    C('VS','VDC',100,330,{V:Vst,sched:test==='C'?`0:${vs[0]}, ${t1}:${vs[1]}, ${t2}:${vs[2]}`:''},{label:'V_st'}),C('VM1','VM',30,330,{},{label:'V_st μέτρηση'}),gnd(100,420),
    C('AM1','AM',200,250,{},{label:'A (i_L)'}),C('L1','L',290,250,{L,i0}),J('JM',370,250),
    C('S1','SW',370,180,{...sw},{label:'S1 (πάνω)'}),C('S2','SW',370,330,{...sw},{label:'S2 (κάτω)'}),
    J('JT1',370,110),J('JT2',480,110),J('JT3',590,110),J('JT4',680,110),J('JB0',100,410),J('JB1',370,410),J('JB2',480,410),J('JB3',590,410),J('JB4',680,410),J('JS',100,250),J('JS2',30,250),J('JS3',30,410),
    C('C1','C',480,260,{C:Cb,v0:Vdc,esr},{label:'C1'}),C('R2','R',590,180,{R:Rs},{rot:1,label:'R2'}),C('VB','VDC',590,330,{V:Vdc},{label:'V_dc'}),
    C('VM2','VM',680,260,{},{label:'V_dc μέτρηση'}),
    // control from plain blocks
    C('CLK1','CLK',-140,-250,{f:fs,duty:.5,phase:0},{label:'ρολόι δειγμάτων'}),
    C('TFi','TAGI',-140,-60,{name:'i_L'}),C('SHi','SH',-40,-60,{in:'sig',clock:'CLK1',trig:'start',init:'value',h0:i0},{label:'S&H i_L'}),
    C('KREF','CONST',-140,-130,{v:ref,unit:'A'},{label:'I_ref'}),C('SUM1','SUM',70,-120,{signs:'+-'},{label:'e'}),
    C('PI1','PIB',170,-120,{Kp:g.kp,Ki:g.ki,clock:'CLK1',trig:'start',y0:0,aw:'clamp',ymin:-Vdc,ymax:Vdc},{label:'PI (u σε V)'}),
    C('TFvs','TAGI',170,-200,{name:'V_st'}),C('SHvs','SH',270,-200,{in:'sig',clock:'CLK1',trig:'start',init:'value',h0:Vst},{label:'S&H V_st'}),
    C('SUM2','SUM',370,-130,{signs:'+-'},{label:'V_st − u'}),
    C('TFvd','TAGI',370,-40,{name:'V_dc'}),...(raw?[]:[C('SHvd','SH',470,-40,{in:'sig',clock:'CLK1',trig:'start',init:'value',h0:Vdc},{label:'S&H V_dc'})]),
    C('DIV1','DIV',580,-120,{},{label:'÷ V_dc'}),C('SAT1','SAT',680,-120,{lo:.02,hi:.98},{label:'όρια D'}),C('TGd','TAGO',770,-120,{name:'D'}),
    C('TFd','TAGI',370,-250,{name:'D'}),C('RMP1','RAMP',370,-320,{f:fs,shape:saw?'saw':'tri',lo:0,hi:1,phase:0},{label:saw?'πριονωτό φέρον':'τριγωνικό φέρον'}),
    C('CMP1','CMP',480,-260,{},{label:'D > φέρον'}),C('TGg1','TAGO',570,-260,{name:'g_S1'}),C('NOT1','LOGIC',570,-330,{op:'not'},{label:'NOT'}),C('TGg2','TAGO',660,-330,{name:'g_S2'}),
    C('TFg1','TAGI',270,180,{name:'g_S1'}),C('TFg2','TAGI',270,330,{name:'g_S2'}),
    C('TGi','TAGO',200,170,{name:'i_L'}),C('TGvs','TAGO',-50,330,{name:'V_st'},{flip:true}),C('TGvd','TAGO',770,260,{name:'V_dc'})];
   const wires=[['VS:p','JS',[[100,250]]],['JS','AM1:a'],['AM1:b','L1:a'],['L1:b','JM'],['S1:s','JM'],['JM','S2:d'],['S1:d','JT1'],['JT1','JT2'],['JT2','JT3'],['JT3','JT4'],
    ['VS:n','JB0'],['JB0','G1:g'],['JB0','JB1'],['S2:s','JB1'],['JB1','JB2'],['JB2','JB3'],['JB3','JB4'],
    ['JT2','C1:p'],['C1:n','JB2'],['JT3','R2:a'],['R2:b','VB:p'],['VB:n','JB3'],['JT4','VM2:p'],['VM2:n','JB4'],
    ['JS','JS2'],['JS2','VM1:p'],['VM1:n','JS3'],['JS3','JB0'],
    ['AM1:y','TGi:u'],['VM1:y','TGvs:u'],['VM2:y','TGvd:u'],
    ['TFi:y','SHi:u'],['KREF:y','SUM1:a'],['SHi:y','SUM1:b'],['SUM1:y','PI1:u'],
    ['TFvs:y','SHvs:u'],['SHvs:y','SUM2:a'],['PI1:y','SUM2:b'],['SUM2:y','DIV1:a'],
    ...(raw?[['TFvd:y','DIV1:b']]:[['TFvd:y','SHvd:u'],['SHvd:y','DIV1:b']]),
    ['DIV1:y','SAT1:u'],['SAT1:y','TGd:u'],
    ['TFd:y','CMP1:p'],['RMP1:y','CMP1:n'],['CMP1:y','TGg1:u'],['CMP1:y','NOT1:a'],['NOT1:y','TGg2:u'],
    ['TFg1:y','S1:g'],['TFg2:y','S2:g']];
   const panes=[[['I:L1','i_L'],['H:SHi','i_L δείγμα'],['Y:KREF','I_ref']],[['Y:SAT1','D'],['Y:PI1','u (V)']],[['Y:VM2','V_dc'],['Y:VM1','V_st']]];
   // the sawtooth with a finer step: its sample is taken at the reset of the carrier, the instant of a switching (ROADMAP §74, the open point)
   return project(comps,wires,{sim:{hDiv:saw?1000:200,speed:200,stopT},scope:{panes,window:{unit:'T',n:Math.round(stopT*fs)}},
    meta:{Vdc,Vst,Vmin,Vmax,dV,In,L,fs,a:g.a,b:g.b,kp:g.kp,ki:g.ki,D0:Vst/Vdc,dI:Vst*(1-Vst/Vdc)/(L*fs),Rpar:Rs*esr/(Rs+esr),saw:saw?1:0,raw:raw?1:0,test,t1,t2,stopT,lev,vs}});}});
 // ------------------------------------------------------------------ 5.0.18: bus voltage control (PE2, exercise 4), from the drawings of the exercise
 // The bus of current_ctl (a source of 50 V behind 1 mΩ, here one-way: a diode in series; 100 mF with 0,2 mΩ) feeds a constant power load.
 // N = 4 branches of the bidirectional converter on shifted carriers (as polyphase), each with the current loop of current_ctl (S&H at
 // the start of its period, a PI in volts, the duty from the sampled voltages). The voltage loop: a PI on the sampled bus voltage gives
 // the current I_c into the bus; per branch −I_c/N when the storage is above the bus (the inductor on the bus side), I_c·v_bus/(N·V_st)
 // when it is below (the inductor on the storage side, by the balance of power); the limit of a branch I_n, with an overload I_ol for
 // T_ol (a timer), and back-calculation into the voltage PI. The source at V_ref gives (V_src − V_ref)/R_s, the converter the rest of the
 // load. The design: C·v′ = −G·v + i_c with G = 1/R_s − P/V_ref² (the source and the load linearized at the load P of the design), and
 // K_i = ω_v·(G + K_p): the slow pole near ω_v when (G + K_p)/C ≫ ω_v. Example values, not those of the exercise.
 function vcDesign(Rs,Vref,P,Kp=150,wv=300){const G=1/Rs-P/(Vref*Vref);return {G,Kp,wv,Ki:+(wv*(G+Kp)).toPrecision(4)};}
 const VC_TEST={step:'Βήμα φορτίου 15 → 35 kW στα 5 ms',profile:'Προφίλ φορτίου 15 → 35 → 25 → 15 kW (στα 20, 40, 60 ms)',limit:'Πέρα από τις δυνατότητες: 15 → 55 kW στα 5 ms'};
 T.push({id:'voltage_ctl',group:'Αμφίδρομος · μπαταρία (PE2)',title:'Άσκηση 4 · Έλεγχος τάσης ζυγού',theory:'formula',topology:'voltage_ctl',
  options:[{k:'vst',label:'Αποθήκευση',options:[['lo','V_st = 30 V, κάτω από τον ζυγό (πηνίο στην πλευρά της αποθήκευσης)'],['hi','V_st = 80 V, πάνω από τον ζυγό (πηνίο στην πλευρά του ζυγού)']],def:'lo'},
   {k:'test',label:'Δοκιμή',options:Object.entries(VC_TEST),def:'step'},
   {k:'vs',label:'Μέτρηση V_bus',options:[['peak','S&H στην αρχή της περιόδου του κλάδου 1 (μία φορά ανά T)'],['both','S&H δύο φορές ανά T (και στη μέση της περιόδου)'],['raw','Χωρίς S&H (η μέτρηση κατευθείαν)']],def:'peak'},
   {k:'gain',label:'Ελεγκτής τάσης',options:[['design','K_p = 150 A/V, ω_v = 300 rad/s'],['int','Χωρίς αναλογικό όρο (K_p = 0), ω_v = 300 rad/s'],['slow','K_p = 150 A/V, ω_v = 75 rad/s']],def:'design'}],
  desc:'Ο ζυγός της Άσκησης 3 (πηγή 50 V πίσω από 1 mΩ, εδώ μονόδρομη: δίοδος σε σειρά· πυκνωτής 100 mF με ESR 0,2 mΩ) τροφοδοτεί φορτίο σταθερής ισχύος. Τέσσερις κλάδοι του αμφίδρομου μετατροπέα, με μετατοπισμένα φέροντα όπως στην πολυφασική σχεδίαση, ενώνουν τον ζυγό με την αποθήκευση (30 ή 80 V). Κάθε κλάδος έχει τον βρόχο ρεύματος της Άσκησης 3: S&H, PI σε V, λόγο κατάτμησης από τις δειγματισμένες τάσεις. Ο βρόχος τάσης είναι ένας PI στη δειγματισμένη τάση του ζυγού, που δίνει το ρεύμα I_c προς τον ζυγό. Από αυτό βγαίνει η αναφορά κάθε κλάδου: −I_c/N όταν η αποθήκευση είναι πάνω από τον ζυγό, I_c·v_bus/(N·V_st) όταν είναι κάτω. Κάθε κλάδος έχει όριο I_n, με υπερφόρτιση I_ol για χρόνο T_ol (χρονομετρητής), και ο PI τάσης έχει back-calculation. Στα V_ref η πηγή δίνει (V_src − V_ref)/R_s, και ο μετατροπέας παίρνει ή δίνει τη διαφορά από το φορτίο. Οι τιμές είναι παράδειγμα· βάλε τις δικές σου από την εκφώνηση. Πρόταση σχεδιασμού, όχι λύση.',
  tasks:['Βήμα φορτίου: τρέξε έως το τέλος (⏩). Ο μετατροπέας περνά από φόρτιση σε εκφόρτιση της αποθήκευσης. Η τάση πέφτει για λίγο και γυρίζει στο V_ref. Το ελάχιστο και ο χρόνος αποκατάστασης είναι στην κάρτα θεωρίας, δίπλα στην εκτίμηση από τους δύο πόλους του βρόχου.','Άλλαξε την αποθήκευση από 30 σε 80 V. Ο βρόχος τάσης μένει ίδιος, αλλάζει μόνο η αναφορά του κλάδου: I_c·v_bus/(N·V_st) αντί για −I_c/N, γιατί το πηνίο πάει από την πλευρά της αποθήκευσης στην πλευρά του ζυγού.','Πέρα από τις δυνατότητες: η αναφορά του κλάδου φτάνει το I_ol. Μετά από T_ol ο χρονομετρητής τη ρίχνει στο I_n, και η τάση κάθεται πιο κάτω, ώσπου η πηγή να δίνει ό,τι λείπει. Με το back-calculation ο PI τάσης δεν φουσκώνει, και η τάση γυρίζει αμέσως όταν πέσει το φορτίο.','Προφίλ φορτίου: τρία βήματα. Οι τέσσερις κλάδοι μοιράζονται το ρεύμα εξίσου (οι μέσες τιμές στις ενδείξεις).','Μέτρηση V_bus: με S&H δύο φορές ανά T ή χωρίς S&H η απόκριση σχεδόν δεν αλλάζει, γιατί ο PI τάσης διαβάζει την είσοδό του στο δικό του ρολόι. Το S&H κρατά σταθερή την τάση του ζυγού στον υπολογισμό του λόγου κατάτμησης μέσα στην περίοδο.','Ελεγκτής τάσης: χωρίς K_p το ακρότατο είναι λίγο βαθύτερο. Με ω_v = 75 rad/s η τάση γυρίζει πολύ πιο αργά, με σταθερά χρόνου περίπου 1/ω_v, και στα 30 ms δεν έχει φτάσει ακόμη στο V_ref.','Άλλαξε τα K_p, K_i του PI τάσης από τις ζωντανές παραμέτρους. Ο αργός πόλος είναι περίπου στο K_i/(G + K_p), και ο γρήγορος στο (G + K_p)/C.'],
  build(o){const lo=o.vst!=='hi',test=VC_TEST[o.test]?o.test:'step',vs=['peak','both','raw'].includes(o.vs)?o.vs:'peak',gain=['design','int','slow'].includes(o.gain)?o.gain:'design';
   const Vsrc=50,Rs=1e-3,Cb=0.1,esr=0.2e-3,fs=20e3,Tsw=1/fs,L=20e-6,N=4,In=100,Iol=1.3*In,Tol=0.005,Vref=49.5,Vst=lo?30:80,P0=15e3,Pd=35e3,band=0.1;
   const prof=test==='profile'?[[0,P0],[.02,Pd],[.04,25e3],[.06,P0]]:[[0,P0],[.005,test==='limit'?55e3:Pd]],stopT=test==='profile'?.08:.03;
   const Is=(Vsrc-Vref)/Rs,Ps=Vref*Is,g=vcDesign(Rs,Vref,Pd,gain==='int'?0:150,gain==='slow'?75:300),cc=ccDesign(L);
   // the operating points at V_ref: the converter gives the load less the source; per branch on its own side
   const rows=prof.map(([t,p])=>{const pc=p-Ps,ic=pc/Vref,Ik=lo?pc/(N*Vst):-ic/N;return {t,p,pc,ic,Ik,ok:Math.abs(Ik)<=In};});
   const Vl=lo?Vst:Vref,Vh=lo?Vref:Vst,D0=1-Vl/Vh,dI=Vl*D0/(L*fs),Ik0=rows[0].Ik,ic0=rows[0].ic;
   const sched=prof.map(([t,p])=>`${t}:${p}`).join(', ');
   const comps=[C('VSRC','VDC',60,190,{V:Vsrc,Rs,uni:true},{label:'V_src'}),C('GS0','GND',60,250,{},{label:'0 V'}),C('CB','C',140,190,{C:Cb,esr,v0:Vref},{label:'C_bus'}),C('GC0','GND',140,250,{},{label:'0 V'}),
    C('LD','CPL',220,190,{P:P0,Vmin:25,sched},{label:'Φορτίο P/v'}),C('GL0','GND',220,250,{},{label:'0 V'}),J('JS1',140,90),J('JS2',220,90),C('VS','VDC',640,150,{V:Vst},{label:'V_st'}),C('GV','GND',640,200,{},{label:'0 V'})];
   const wires=[['VSRC:p','JS1',[[60,90]]],['JS1','CB:p'],['JS1','JS2'],['JS2','LD:p'],['JS2','JB1',[],{name:'v_bus'}],['VSRC:n','GS0:g'],['CB:n','GC0:g'],['LD:n','GL0:g'],['JV1','VS:p',[[640,90]]],['VS:n','GV:g']];
   const dExpr=lo?'clamp(1 - (vs - u)/vb, 0.02, 0.98)':'clamp(1 - (vb - u)/vs, 0.02, 0.98)',umin=lo?Vst-Vsrc:Vsrc-Vst,umax=lo?Vst:Vsrc;
   for(let k=1;k<=N;k++){const y=90+150*(k-1),ph=360*(k-1)/N,u0=((-ph/360)%1+1)%1,i0=+(Ik0+dI*rippleDev(u0,D0,false)).toFixed(4),sw={pwm:'PWM'+k,Ron:1e-7,body:true};
    comps.push(J('JB'+k,300,y),C('L'+k,'L',lo?490:350,y,{L,i0}),J('JM'+k,420,y),C('S1'+k,'SW',lo?350:470,y,{...sw,out:'na'},{label:'S1.'+k}),C('S2'+k,'SW',420,y+60,{...sw,out:'a'},{label:'S2.'+k}),
     C('GS'+k,'GND',420,y+100,{},{label:''}),J('JV'+k,560,y),
     C('TI'+k,'TAGI',760,y-20,{name:'I*'}),C('SHi'+k,'SH',760,y+30,{src:'L'+k,qty:'I',clock:'PWM'+k,trig:'start',init:'value',h0:+Ik0.toFixed(4)},{label:'S&H i_L'+k}),C('SU'+k,'SUM',850,y,{signs:'+-'}),
     C('PI'+k,'PIB',940,y,{Kp:cc.kp,Ki:cc.ki,clock:'PWM'+k,trig:'start',y0:0,aw:'clamp',ymin:umin,ymax:umax},{label:'PI ρεύματος '+k}),C('TV'+k,'TAGI',940,y+45,{name:'v_s'}),C('TS'+k,'TAGI',940,y+75,{name:'vst_s'}),
     C('EXd'+k,'EXPR',1050,y+25,{expr:dExpr,ins:'u, vb, vs'},{label:'d'+k}),C('PWM'+k,'PWM',1170,y+25,{fs,mode:'ext',carrier:'triangle',phase:ph,upd:'single'}));
    // storage below the bus: bus – S1 – switching node – inductor (a at the storage) ; above: bus – inductor – switching node – S1 – storage
    if(lo)wires.push(['JB'+k,'S1'+k+':d'],['S1'+k+':s','JM'+k],['JM'+k,'L'+k+':b'],['L'+k+':a','JV'+k]);
    else wires.push(['JB'+k,'L'+k+':a'],['L'+k+':b','JM'+k],['JM'+k,'S1'+k+':s'],['S1'+k+':d','JV'+k]);
    wires.push(['JM'+k,'S2'+k+':d'],['S2'+k+':s','GS'+k+':g'],['TI'+k+':y','SU'+k+':a'],['SHi'+k+':y','SU'+k+':b'],['SU'+k+':y','PI'+k+':u'],['PI'+k+':y','EXd'+k+':u'],['TV'+k+':y','EXd'+k+':vb'],['TS'+k+':y','EXd'+k+':vs'],['EXd'+k+':y','PWM'+k+':d']);
    if(k<N)wires.push(['JB'+k,'JB'+(k+1)],['JV'+k,'JV'+(k+1)]);}
   // the voltage loop: the sampled voltages, the PI (A into the bus), the reference of a branch, its limit with the overload timer, back-calculation
   comps.push(C('MV','MEAS',60,730,{src:'CB',qty:'V'},{label:'v_bus'}),...(vs==='raw'?[]:[C('SHv','SH',170,730,{in:'sig',clock:'PWM1',trig:vs==='both'?'both':'start',init:'value',h0:Vref},{label:'S&H v_bus'})]),C('TGv','TAGO',260,730,{name:'v_s'}),
    C('MS','MEAS',60,790,{src:'VS',qty:'V'},{label:'v_st'}),C('SHs','SH',170,790,{in:'sig',clock:'PWM1',trig:'start',init:'value',h0:Vst},{label:'S&H V_st'}),C('TGs','TAGO',260,790,{name:'vst_s'}),
    C('VREF','CONST',60,860,{v:Vref,unit:'V'},{label:'V_ref'}),C('TFv','TAGI',60,910,{name:'v_s'}),C('SUv','SUM',160,880,{signs:'+-'},{label:'V_ref − v'}),
    C('PIv','PIB',260,880,{Kp:g.Kp,Ki:g.Ki,clock:'PWM1',trig:'start',y0:+ic0.toFixed(4),aw:'track'},{label:'PI τάσης (A προς τον ζυγό)'}),
    C('EXo','EXPR',370,960,{expr:'abs(r) > In ? 1 : -5',ins:'r',pars:`In = ${In}`},{label:'πάνω από I_n; (+1, αλλιώς −5)'}),
    C('PIt','PIB',480,960,{Kp:0,Ki:1,clock:'PWM1',trig:'start',y0:0,aw:'clamp',ymin:0,ymax:+(1.2*Tol).toPrecision(6)},{label:'χρόνος υπερφόρτισης'}),
    C('EXl','EXPR',590,890,{expr:'clamp(r, -(tm < Tol ? Iol : In), tm < Tol ? Iol : In)',ins:'r, tm',pars:`In = ${In}, Iol = ${Iol}, Tol = ${Tol}`},{label:'όριο του κλάδου'}),C('TGr','TAGO',700,890,{name:'I*'}),
    C('SUb','SUM',480,1030,{signs:'+-'},{label:'tr'}));
   wires.push(...(vs==='raw'?[['MV:y','TGv:u']]:[['MV:y','SHv:u'],['SHv:y','TGv:u']]),['MS:y','SHs:u'],['SHs:y','TGs:u'],['VREF:y','SUv:a'],['TFv:y','SUv:b'],['SUv:y','PIv:u']);
   if(lo){comps.push(C('GNr','EXPR',370,880,{expr:'r*vb/(n*vs)',ins:'r, vb, vs',pars:`n = ${N}`},{label:'× v_bus/(N·V_st)'}),C('TFv2','TAGI',260,820,{name:'v_s'}),C('TFs2','TAGI',260,840,{name:'vst_s'}),
     C('GNb','EXPR',590,980,{expr:'r*n*vs/vb',ins:'r, vb, vs',pars:`n = ${N}`},{label:'× N·V_st/v_bus'}));
    wires.push(['PIv:y','GNr:r'],['TFv2:y','GNr:vb'],['TFs2:y','GNr:vs'],['TFv2:y','GNb:vb'],['TFs2:y','GNb:vs'],['EXl:y','GNb:r']);}
   else{comps.push(C('GNr','GAIN',370,880,{K:-1/N,unit:'='},{label:'−1/N'}),C('GNb','GAIN',590,980,{K:-N,unit:'='},{label:'−N'}));wires.push(['PIv:y','GNr:u'],['EXl:y','GNb:u']);}
   wires.push(['GNr:y','EXl:r'],['GNr:y','EXo:r'],['EXo:y','PIt:u'],['PIt:y','EXl:tm'],['EXl:y','TGr:u'],['GNb:y','SUb:a'],['PIv:y','SUb:b'],['SUb:y','PIv:tr']);
   // the indications: the means per period of the voltage, of the powers and of the branch currents
   const avg=(id,x,y,label)=>C(id,'AVG',x,y,{win:'per',f:fs,np:1,clock:'PWM1'},{label});
   comps.push(avg('AVv',170,1110,'⟨v_bus⟩'),C('DSv','DISP',280,1110,{dig:5},{label:'⟨V_bus⟩ (V)'}),C('MIs','MEAS',60,1180,{src:'VSRC',qty:'I'},{label:'i_src'}),C('MIl','MEAS',60,1280,{src:'LD',qty:'I'},{label:'i_φορτίου'}),
    C('EXps','EXPR',170,1180,{expr:'v*i',ins:'v, i'},{label:'p_πηγής'}),C('EXpl','EXPR',170,1280,{expr:'v*i',ins:'v, i'},{label:'p_φορτίου'}),
    C('EXpc','EXPR',170,1380,{expr:lo?'v*(i1 + i2 + i3 + i4)':'-v*(i1 + i2 + i3 + i4)',ins:'v, i1, i2, i3, i4'},{label:'p_μετατροπέα'}),
    avg('AVps',280,1180,'⟨P_πηγής⟩'),avg('AVpl',280,1280,'⟨P_φορτίου⟩'),avg('AVpc',280,1380,'⟨P_μετατροπέα⟩'),
    C('DSps','DISP',430,1180,{dig:5},{label:'P πηγής (W)'}),C('DSpl','DISP',430,1280,{dig:5},{label:'P φορτίου (W)'}),C('DSpc','DISP',430,1380,{dig:5},{label:'P μετατροπέα (W)'}),
    C('TFr','TAGI',510,1110,{name:'I*'}),C('DSr','DISP',620,1110,{dig:5},{label:'I*_k (A)'}));
   wires.push(['MV:y','AVv:u'],['AVv:y','DSv:u'],['MV:y','EXps:v'],['MIs:y','EXps:i'],['MV:y','EXpl:v'],['MIl:y','EXpl:i'],[lo?'MS:y':'MV:y','EXpc:v'],
    ['EXps:y','AVps:u'],['EXpl:y','AVpl:u'],['EXpc:y','AVpc:u'],['AVps:y','DSps:u'],['AVpl:y','DSpl:u'],['AVpc:y','DSpc:u'],['TFr:y','DSr:u']);
   for(let k=1;k<=N;k++){const y=1170+60*(k-1);comps.push(C('ML'+k,'MEAS',510,y,{src:'L'+k,qty:'I'},{label:'i_L'+k}),avg('AV'+k,620,y,'⟨i_L'+k+'⟩'),C('DS'+k,'DISP',730,y,{dig:5},{label:'⟨i_L'+k+'⟩ (A)'}));
    wires.push(['ML'+k+':y','AV'+k+':u'],['AV'+k+':y','DS'+k+':u'],['ML'+k+':y','EXpc:i'+k]);}
   const panes=[[['Y:MV','v_bus'],['Y:AVv','⟨v_bus⟩ ανά T'],['Y:VREF','V_ref']],[['Y:AVps','P_πηγής'],['Y:AVpl','P_φορτίου'],['Y:AVpc','P_μετατροπέα']],
    [['Y:EXl','I*_k'],...[1,2,3,4].map(k=>['Y:AV'+k,'⟨i_L'+k+'⟩'])],[...[1,2,3,4].map(k=>['I:L'+k,'i_L'+k])]];
   return project(comps,wires,{sim:{hDiv:100,speed:400,stopT},scope:{panes,window:{unit:'T',n:Math.round(stopT*fs)}},
    meta:{side:lo?'lo':'hi',test,vs,gain,Vsrc,Rs,Cb,esr,fs,T:Tsw,L,N,In,Iol,Tol,Vref,Vst,P0,Pd,band,prof,stopT,Is,Ps,G:g.G,Kpv:g.Kp,Kiv:g.Ki,wv:g.wv,a:cc.a,b:cc.b,kp:cc.kp,ki:cc.ki,D0,dI,rows}});}});
 // ------------------------------------------------------------------ empty
 // ------------------------------------------------------------------ 3.0: current loop from signal blocks
 T.push({id:'blocks_loop',group:'Μπλοκ σημάτων (3.0)',title:'Βρόχος ρεύματος από μπλοκ',theory:'formula',topology:'blocks_loop',
  options:[{k:'ctrl',label:'Ελεγκτής',options:[['blocks','PI από μπλοκ (σύρματα σημάτων)'],['builtin','Ενσωματωμένος PI του PWM (σύγκριση)']],def:'blocks'},
   {k:'mod',label:'Διαμορφωτής',options:[['pwm','Μπλοκ PWM με είσοδο d'],['cmp','Φέρον + συγκριτής → πύλη του S1']],def:'pwm'},
   {k:'delay',label:'Καθυστέρηση υπολογισμού',options:[['none','Καμία: το D ισχύει από το ίδιο δείγμα'],['z1','z⁻¹: το D ισχύει μία περίοδο αργότερα']],def:'none'}],
  desc:'Buck 48 V προς μπαταρία 24 V, L = 100 μH, f_s = 50 kHz. Το ρεύμα του πηνίου μετριέται με αμπερόμετρο σε σειρά. Η αναφορά (σταθερά), το σφάλμα (άθροισμα), ο PI και ο λόγος κατάτμησης D είναι μπλοκ ενωμένα με σύρματα σημάτων. Το D φτάνει στον διακόπτη είτε από το μπλοκ PWM (είσοδος d) είτε από φέρον και συγκριτή, που είναι ακριβώς ό,τι κάνει το PWM μέσα του. Βήμα αναφοράς 5 → 10 A στα 2 ms.',
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
 T.push({id:'code_loop',group:'Μπλοκ κώδικα (3.3)',title:'PI σε Python και πρόσθια τροφοδότηση με έκφραση',theory:'formula',topology:'code_loop',
  options:[{k:'ctrl',label:'Ελεγκτής',options:[['python','PI σε μπλοκ Python'],['pib','PI διακριτός (μπλοκ, για σύγκριση)']],def:'python'},
   {k:'ff',label:'Πρόσθια τροφοδότηση',options:[['none','Χωρίς'],['expr','d = u + v_o/v_in (μπλοκ έκφρασης)']],def:'none'}],
  desc:'Ο ίδιος buck 48 V → μπαταρία 24 V με το «Βρόχος ρεύματος από μπλοκ», αλλά ο PI είναι κώδικας Python: ο κώδικας τρέχει σε κάθε δείγμα του PWM, όπως σε μικροελεγκτή, και η έξοδός του μένει σταθερή ως το επόμενο. Με πρόσθια τροφοδότηση (feedforward), ένα μπλοκ έκφρασης υπολογίζει d = u + v_o/v_in από δύο βολτόμετρα, οπότε ο PI διορθώνει μόνο το υπόλοιπο. Η Python τρέχει στον browser με το Pyodide και στον server με την κανονική Python.',
  tasks:['Τρέξε έως το τέλος (⏩). Με «PI διακριτός» βγαίνει ακριβώς το ίδιο D: ο κώδικας Python κάνει τις ίδιες πράξεις.','Άνοιξε τον κώδικα (διπλό κλικ στο μπλοκ Py) και άλλαξε κάτι, π.χ. το όριο ή τον τύπο του ολοκληρωτή. Η αλλαγή εφαρμόζεται αμέσως.','Διάλεξε πρόσθια τροφοδότηση: το ρεύμα μένει στα 5 A από την αρχή (χωρίς αυτήν πέφτει στο 0 ώσπου ο ολοκληρωτής να φτάσει το D = 0,5) και ο PI διορθώνει μόνο το υπόλοιπο.','Γράψε δικό σου κώδικα: π.χ. PI με μεταβλητά κέρδη, ή έλεγχο κατάστασης με if.'],
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
  desc:'Τριφασικός αντιστροφέας 600 V, 5 kHz, που τροφοδοτεί μηχανή επαγωγής 4 πόλων (ισοδύναμο αντίστροφου Γ, τυπικές τιμές περίπου 2 kW). Ανοιχτός βρόχος V/f: η συχνότητα ανεβαίνει με ράμπα 100 Hz/s ως τα 50 Hz και η τάση ακολουθεί V = V_b + (V_n − V_b)·f/f_n. Η γωνία θ = ∫2πf dt και το πλάτος δίνουν τις τάσεις αναφοράς (αντίστροφος Park και Clarke), και ο τριφασικός διαμορφωτής τις κάνει λόγους κατάτμησης για τα τρία σκέλη. Ροπή φορτίου 10 N·m στα 0,7 s.',
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
   // 4.8 (§47): the speed reference next to its block, the references and currents of the vector control in the panel
   const watch={tiles:[{ctl:'KW.v',label:'ω_ref',at:[-290,-200],al:'r',rng:[0,2*wref],steps:'-10%; +10%'},['Y:M1','ω_m'],['Y:PIS','i_q* (από τον PI ταχύτητας)'],['Y:GL','i_d* (ροή)'],['Y:PK','i_d'],['Y:PK:q','i_q']]};
   return project(comps,ws,{watch,sim:{hDiv:40,speed:20,stopT:1.5},scope:{panes:[[['Y:M1','ω_m'],['Y:KW','ω_ref']],[['Y:PK','i_d'],['Y:PK:q','i_q']],[['Y:M1:psi','|ψ_R| (πραγματική)'],['Y:FE:psi','|ψ̂_R|']],[['Y:M1:te','τ_e']]],window:{unit:'s',n:1.5}},
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
 T.push({id:'srm',group:'Ηλεκτρική κίνηση (3.6)',title:'Μηχανή μεταβλητής μαγνητικής αντίστασης (SRM 8/6): γωνίες, υστέρηση, βρόχος ψ–i',theory:'formula',topology:'srm',
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
  tasks:['Με D = 0,4 και χωρίς ράμπα: σταθερή κορυφή στο i_c από περίοδο σε περίοδο.','Με D = 0,6 χωρίς ράμπα: οι κορυφές και οι κοιλάδες εναλλάσσονται (υποαρμονική). Η κάρτα θεωρίας δίνει λ = (m_a − m₂)/(m₁ + m_a).','Πρόσθεσε ράμπα m₂/2: η ταλάντωση σβήνει. Με m_a = m₂ σβήνει σε έναν κύκλο.','Άλλαξε εν κινήσει την εντολή i_c από τις ζωντανές παραμέτρους.','Valley: το ρολόι σβήνει τον S1 και ο συγκριτής τον ανάβει όταν το ρεύμα πέσει στο i_c + ράμπα. Εδώ η υποαρμονική εμφανίζεται για D < 0,5 (δοκίμασε D = 0,4) και σβήνει για D > 0,5.','Χάρτης Poincaré και διάγραμμα διακλάδωσης (πλάι στο scope, «Διακλαδώσεις και Poincaré»): η κοιλάδα κάθε περιόδου σε σχέση με την προηγούμενη, και σάρωση του V_o. Με μπαταρία στην έξοδο ο χάρτης έχει δύο ευθύγραμμα κομμάτια, και πάνω από D = 0,5 περνά κατευθείαν σε χαοτική συμπεριφορά. Τη διαδοχή 1T → 2T → 4T τη δείχνει το tutorial «Διακλαδώσεις και χάος (boost)».','Άσκηση: πρόσθεσε μέγιστο λόγο κατάτμησης με μπλοκ από τη βιβλιοθήκη (π.χ. ρολόι με ποσοστό 0,9, NOT και OR στο reset).'],
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
  desc:'Μηχανή ΣΡ ανεξάρτητης διέγερσης από ημιγέφυρα 220 V, 5 kHz, με τριγωνικό φέρον. Το ρεύμα μετριέται με αμπερόμετρο σε σειρά στην αρχή κάθε περιόδου, δηλαδή στο μέσο του OFF, άρα είναι η μέση τιμή (Άσκηση 2). Ο βρόχος ρεύματος δίνει τάση με PI, πρόσθια τροφοδότηση της αντι-ΗΕΔ Ê = ψ̂·ω και, προαιρετικά, ενεργό αντίσταση. Ο βρόχος ταχύτητας δίνει ροπή με PI και ενεργή απόσβεση, και από εκεί το i_ref = τ_ref/ψ̂. Οι τιμές της μηχανής είναι τυπικές.',
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
 // ------------------------------------------------------------------ 4.7: control with neural networks (ROADMAP «Τι προτείνω» 4.7.3)
 // A DC machine with a fan load τ_L = k·ω·|ω| fed by a voltage from a signal (the average model of a chopper, ±220 V),
 // speed control sampled at 1 kHz. The reference ω* repeats a pattern of steps every 1.6 s and is smoothed by a
 // first-order filter (5 Hz): ω_r and its exact derivative α_r = (ω* − ω_r)·2π·5. The PI acts on ω_r − ω; the network
 // block (NN) gives a voltage from (ω_r, α_r): learning online from the PI's output (feedback-error learning: what the PI
 // still has to add is the network's error), or with fixed weights of an inverse model trained offline (tools/nn_weights.py).
 // NN_DC_INV is written by tools/nn_weights.py (the inverse model v(ω, α) of this machine from a run with excitation)
 const NN_DC_INV={"sizes":[2,8,1],"W":[[[0.00196441162,0.00330956961],[-0.00628090524,-0.037189757],[1.13134454,-1.42721214],[0.000783870424,-0.0016382741],[2.02776093,0.984907499],[0.00811231506,0.0881211352],[1.84800893,1.00771851],[0.00218112585,-0.0105740028]],[[-0.000225075288,0.00225405235,0.186802432,-0.000104009595,0.79486467,-0.00316870136,0.652587898,-0.000498883642]]],"b":[[-0.00122119006,0.00260948702,-0.625079848,-0.000570516699,-1.96918539,-0.00363568317,-0.300114917,-0.0015707975],[1.06780814]]};
 const NN_PAT=[[0,0],[.1,100],[.5,150],[.9,50],[1.3,120]],NN_PAT2=[[0,40],[.2,140],[.45,20],[.7,90],[1.05,160],[1.35,60]];
 function nnSched(cycles,P=1.6,from=0,pat=NN_PAT){const out=[];for(let r=0;r<cycles;r++)for(const [t,v] of pat)out.push(`${+(from+t+r*P).toFixed(4)}:${v}`);return out;}
 function nnDrive(o){const P=1.6,fc=5,kf=1.33e-3,Ra=1,Kp=.5,Ki=10,cyc=o.cycles||4,stopT=+(cyc*P).toFixed(4),ctrl=o.ctrl;
  let ref=nnSched(cyc,P);if(o.event==='ref'){const k=Math.floor(cyc/2);ref=[...nnSched(k,P),...nnSched(cyc-k,P,k*P,NN_PAT2)];}
  const kl=o.load==='step'?`0:1, ${+(Math.floor(cyc/2)*P).toFixed(4)}:2`:'1';
  const comps=[C('CLK1','CLK',40,-120,{f:1000},{label:'Ρολόι 1 kHz'}),
   // reference: ω* → filter → ω_r, α_r
   C('KW','CONST',40,0,{v:ref.join(', ')},{label:'ω*'}),C('LP','LPF',140,0,{fc},{label:'5 Hz'}),C('TGr','TAGO',240,0,{name:'ω_r'}),
   C('DA','SUM',140,80,{signs:'+-'},{label:'ω* − ω_r'}),C('TFr0','TAGI',40,90,{name:'ω_r'}),C('GA','GAIN',230,80,{K:+(2*Math.PI*fc).toPrecision(6)},{label:'2π·5'}),C('TGa','TAGO',320,80,{name:'α_r'}),
   // controller: e = ω_r − ω, PI, + network, limited to ±220 V
   C('TFr','TAGI',40,200,{name:'ω_r'}),C('TFw','TAGI',40,240,{name:'ω'}),C('E1','SUM',140,210,{signs:'+-'},{label:'e'}),
   C('PI1','PIB',240,210,{Kp,Ki,clock:'CLK1',trig:'start',y0:0,ymin:-220,ymax:220},{label:'PI ταχύτητας'}),C('TGpi','TAGO',330,170,{name:'u_PI'}),
   C('U1','SUM',450,220,{signs:'++'},{label:'u'}),C('SAT1','SAT',540,220,{lo:-220,hi:220},{label:'±220 V'}),C('TGu','TAGO',630,220,{name:'u'}),C('TGe','TAGO',230,260,{name:'e'}),
   // plant: voltage from the signal u, DC machine, fan load
   C('TFu','TAGI',-20,560,{name:'u'}),C('V1','VDC',120,560,{ctl:'sig',V:0},{label:'μετατροπέας',lbl:'left'}),gnd(120,650),
   C('M1','DCM',300,560,{Ra,La:10e-3,psi:1,J:.02,bm:.002,load:'sig',w0:0,ia0:0},{label:'M'}),C('TGw','TAGO',430,550,{name:'ω'}),
   C('KL','CONST',40,700,{v:kl},{label:'συντελεστής φορτίου'}),C('TFw3','TAGI',40,760,{name:'ω'}),
   C('TLX','EXPR',170,730,{expr:'k*u1*u2*abs(u2)',ins:'u1, u2',pars:`k = ${kf}`},{label:'τ_L = k·ω·|ω|'}),
   // performance: IAE = ∫|e|, ISE = ∫e²
   C('TFe','TAGI',460,720,{name:'e'}),C('AE','EXPR',570,690,{expr:'abs(u1)',ins:'u1'},{label:'|e|'}),C('IAE','INT',680,690,{y0:0},{label:'IAE'}),
   C('SE','EXPR',570,770,{expr:'u1*u1',ins:'u1'},{label:'e²'}),C('ISE','INT',680,770,{y0:0},{label:'ISE'})];
  const wires=[['KW:y','LP:u'],['LP:y','TGr:u'],['KW:y','DA:a',[[90,0],[90,70]]],['TFr0:y','DA:b'],['DA:y','GA:u'],['GA:y','TGa:u'],
   ['TFr:y','E1:a'],['TFw:y','E1:b',[[90,240],[90,220]]],['E1:y','PI1:u'],['E1:y','TGe:u',[[185,210],[185,260]]],['PI1:y','U1:a'],['PI1:y','TGpi:u',[[285,210],[285,170]]],['U1:y','SAT1:u'],['SAT1:y','TGu:u'],
   ['TFu:y','V1:u'],['V1:p','M1:a'],['V1:n','G1:g'],['M1:b','G1:g',[[300,650]]],['M1:w','TGw:u'],
   ['KL:y','TLX:u1',[[100,700],[100,720]]],['TFw3:y','TLX:u2',[[100,760],[100,740]]],['TLX:y','M1:tl',[[240,730],[240,560]]],
   ['TFe:y','AE:u1',[[510,720],[510,690]]],['TFe:y','SE:u1',[[510,720],[510,770]]],['AE:y','IAE:u'],['SE:y','ISE:u']];
  if(ctrl!=='pi'){const learn=ctrl!=='inv',lr=o.lr==='slow'?.002:o.lr==='adam'?3e-4:o.lr==='fast'?.02:.005,opt=o.lr==='adam'?'adam':'sgd';
   const nn={ins:'wr, ar',xs:'150, 3000',hidden:'8',ys:100,ymin:-220,ymax:220,train:learn?'err':'off',opt,lr,clip:5,nl:400,init:'zero',seed:1,clock:'CLK1',trig:'start',y0:0,
    w:learn?'':JSON.stringify(NN_DC_INV||{})};
   comps.push(C('NN1','NN',330,340,nn,{label:learn?'NN (μαθαίνει)':'NN αντίστροφο'}),C('TFr2','TAGI',190,300,{name:'ω_r'}),C('TFa','TAGI',190,340,{name:'α_r'}));
   const yy=learn?330:340;wires.push(['TFr2:y','NN1:wr',learn?[]:[[250,300],[250,330]]],['TFa:y','NN1:ar',learn?[[250,340],[250,320]]:[[250,340],[250,350]]],['NN1:y','U1:b',[[400,yy],[400,230]]]);
   // 4.8: the inverse learned online through an emulator, two copies of one network (specialized inverse learning, as
   // PY_INV_NN of pcl.control): NNE learns the machine from the measurements, α̂ = f(u[k−1], ω[k−1]) → α = Δω/T_s; its copy
   // NNC (share) computes at the controller's own output, α̂_c = f(u_NN, ω_r), with dy = ∂α̂_c/∂u. The controller learns
   // to make the model give α_r: e_c = K·(α_r − α̂_c)·∂α̂_c/∂u (one sample later, z⁻¹, so that no loop is algebraic).
   // The model is learned in open loop from what the machine did, so the PI that also acts does not bias it.
   if(ctrl==='emu'){const Ts=1e-3;comps.push(C('TFu5','TAGI',470,330,{name:'u'}),C('UDu','UD',560,330,{clock:'CLK1',trig:'start',y0:0},{label:'u[k−1]'}),
     C('TFw5','TAGI',470,380,{name:'ω'}),C('UDw','UD',560,380,{clock:'CLK1',trig:'start',y0:0},{label:'ω[k−1]'}),
     C('DW','SUM',660,440,{signs:'+-'},{label:'ω − ω[k−1]'}),C('TFw6','TAGI',560,430,{name:'ω'}),C('GAm','GAIN',750,440,{K:1/Ts},{label:'α = Δω/T_s'}),
     C('NNE','NN',710,355,{ins:'u, w',xs:'220, 150',hidden:'8',ys:1000,ymin:-1e5,ymax:1e5,train:'tgt',opt:'adam',lr:2e-3,clip:5,nl:400,init:'zero',seed:2,clock:'CLK1',trig:'start',y0:0},{label:'εξομοιωτής α̂(u, ω): μαθαίνει'}),
     C('TFr5','TAGI',470,580,{name:'ω_r'}),C('NNC','NN',710,560,{ins:'u, w',xs:'220, 150',hidden:'8',ys:1000,ymin:-1e5,ymax:1e5,train:'off',share:'NNE',jac:'u',init:'zero',seed:2,clock:'CLK1',trig:'start',y0:0},{label:'αντίγραφο στην έξοδο του ελεγκτή'}),
     C('TFa5','TAGI',470,650,{name:'α_r'}),C('EA','SUM',820,660,{signs:'+-'},{label:'α_r − α̂_c'}),
     C('MC','MUL',920,600,{},{label:'× ∂α̂/∂u'}),C('GKc','GAIN',1010,600,{K:.1},{label:'K'}),C('UDe','UD',1100,600,{clock:'CLK1',trig:'start',y0:0},{label:'z⁻¹'}),C('TGec','TAGO',1190,600,{name:'e_c'}),C('TFec','TAGI',190,380,{name:'e_c'}),
     C('TFn5','TAGI',470,540,{name:'u_NN'}),C('TGn','TAGO',470,290,{name:'u_NN'}));
    wires.push(['TFu5:y','UDu:u'],['TFw5:y','UDw:u'],['UDu:y','NNE:u',[[620,330],[620,345]]],['UDw:y','NNE:w',[[620,380],[620,365]]],['TFw6:y','DW:a',[[610,430]]],['UDw:y','DW:b',[[600,380],[600,450],[630,450]]],['DW:y','GAm:u'],
     ['GAm:y','NNE:tgt',[[790,440],[790,410],[650,410],[650,375]]],['TFn5:y','NNC:u',[[620,540],[620,550]]],['TFr5:y','NNC:w',[[620,580],[620,570]]],
     ['TFa5:y','EA:a',[[780,650]]],['NNC:y','EA:b',[[770,560],[770,670]]],['EA:y','MC:a',[[870,660],[870,590]]],['NNC:dy','MC:b',[[790,580],[790,610]]],['MC:y','GKc:u'],['GKc:y','UDe:u'],['UDe:y','TGec:u'],
     ['TFec:y','NN1:e',[[250,380],[250,350]]],['NN1:y','TGn:u',[[420,yy],[420,290]]]);}
   else if(learn){comps.push(C('TFpi','TAGI',190,380,{name:'u_PI'}));wires.push(['TFpi:y','NN1:e',[[250,380],[250,350]]]);
    if(o.freeze&&o.freeze!=='never'){const tf=o.freeze==='f2'?2*P/1.6:Math.floor(cyc*3/4)*P;comps.push(C('FZ','CONST',90,440,{v:`0:0, ${+tf.toFixed(4)}:1`},{label:'πάγωμα'}));wires.push(['FZ:y','NN1:fz',[[260,440],[260,370]]]);}}}
  else{comps.push(C('K0','CONST',330,330,{v:0},{label:'χωρίς δίκτυο'}));wires.push(['K0:y','U1:b',[[400,330],[400,230]]]);}
  const panes=[[['Y:LP','ω_r'],['Y:M1','ω']],[['Y:E1','e = ω_r − ω']],[['Y:PI1','u_PI'],...(ctrl!=='pi'?[['Y:NN1','u_NN']]:[])],...(ctrl==='pinn'||ctrl==='online'?[[['Y:NN1:L','L (σφάλμα μάθησης)']]]:ctrl==='emu'?[[['Y:NNE:L','L του εξομοιωτή (rad/s²)']]]:[[['Y:IAE','IAE']]])];
  // 4.8 (§47): the target and the learning switch live over the drawing; the reference tile sets a constant ω* over the
  // program of steps (→ πρόγραμμα t:τιμή keeps it), the load factor a step of ±50 %
  // the controls next to their blocks, the signals in the panel
  const learnTile=ctrl==='pinn'||ctrl==='online'||ctrl==='emu',watch={tiles:[{ctl:'KW.v',label:'ω* (στόχος)',at:[10,-50],al:'r',rng:[0,200],steps:'-20; +20; =100'},
   ...(learnTile?[{ctl:'NN1.learn',label:ctrl==='emu'?'Ο ελεγκτής μαθαίνει':'Μαθαίνει',at:[430,390]}]:[]),...(ctrl==='emu'?[{ctl:'NNE.learn',label:'Ο εξομοιωτής μαθαίνει',at:[860,300]},['Y:NNE:L','L του εξομοιωτή']]:[]),{ctl:'KL.v',label:'Φορτίο (συντελεστής)',at:[10,640],al:'r',rng:[0,4],steps:'-50%; +50%'},
   ['Y:M1','ω'],['Y:E1','e = ω_r − ω'],...(learnTile?[['Y:NN1:L','L (σφάλμα μάθησης)']]:[]),['Y:PI1','u_PI'],['Y:IAE','IAE']]};
  return project(comps,wires,{watch,sim:{hDiv:20,speed:1000,stopT},scope:{panes,window:{unit:'s',n:3.2}},
   meta:{P,fc,kf,Kp,Ki,ctrl,cycles:cyc,Ra,La:10e-3,psi:1,J:.02,bm:.002,Vmax:220}});}
 T.push({id:'nn_compare',group:'Έλεγχος με νευρωνικά δίκτυα (4.7)',title:'Έλεγχος με νευρωνικό δίκτυο: σύγκριση',theory:'formula',topology:'nn_compare',
  options:[{k:'ctrl',label:'Ελεγκτής',options:[['pi','Μόνο PI'],['pinn','PI + νευρωνικό που μαθαίνει online (feedback-error learning)'],['inv','PI + αντίστροφο μοντέλο (νευρωνικό, εκπαιδευμένο offline)'],['emu','PI + αντίστροφο που μαθαίνει μέσω εξομοιωτή (δύο αντίγραφα ενός δικτύου, 4.8)']],def:'pinn'},
   {k:'load',label:'Φορτίο',options:[['fan','Ανεμιστήρας τ_L = k·ω·|ω|'],['step','Ανεμιστήρας, διπλάσιο από τη μέση της προσομοίωσης']],def:'fan'}],
  desc:'Έλεγχος ταχύτητας μηχανής ΣΡ με φορτίο ανεμιστήρα, ο μετατροπέας ως πηγή τάσης από σήμα (μέση τιμή). Η αναφορά επαναλαμβάνει ένα μοτίβο βημάτων κάθε 1,6 s, φιλτραρισμένο στα 5 Hz (ω_r και η παράγωγός του α_r). Ο PI μόνος του αργεί στα βήματα. Το νευρωνικό δίκτυο δίνει από τα (ω_r, α_r) την τάση που χρειάζεται η μηχανή (πρόσθια τροφοδότηση), είτε μαθαίνοντας online από την έξοδο του PI είτε με βάρη ενός αντίστροφου μοντέλου εκπαιδευμένου εκ των προτέρων. Οι τιμές της μηχανής είναι τυπικές.',
  tasks:['Τρέξε «Μόνο PI» και κράτα τα IAE και ISE στο τέλος (κάρτα θεωρίας). Μετά «PI + νευρωνικό»: στον πρώτο κύκλο είναι σχεδόν ίδιο, από τον δεύτερο το σφάλμα μικραίνει κάθε φορά.','Δες στο scope το u_PI: όσο το δίκτυο μαθαίνει, ο PI χρειάζεται να δώσει όλο και λιγότερα· αυτό ακριβώς είναι το σφάλμα του δικτύου (feedback-error learning).','«Αντίστροφο μοντέλο»: τα βάρη είναι έτοιμα, άρα βελτιώνει από την αρχή. Στην κάρτα θεωρίας «Σύγκρινε και τους τέσσερις» τρέχει όλες τις εκδοχές στο παρασκήνιο και δίνει τον πίνακα.','«Μέσω εξομοιωτή»: ένα δεύτερο δίκτυο μαθαίνει τη μηχανή (α̂ από u και ω) και ένα αντίγραφό του δίνει στον ελεγκτή την ευαισθησία ∂α̂/∂u· από τον δεύτερο κύκλο είναι ήδη κοντά στο αντίστροφο μοντέλο. Δες στα πλακίδια το L του εξομοιωτή και κλείσε τη μάθηση του καθενός χωριστά.','Με «διπλάσιο φορτίο» το αντίστροφο μοντέλο δεν το ξέρει (εκτός εκπαίδευσης): ο PI καλύπτει τη διαφορά. Το online δίκτυο ξαναπροσαρμόζεται.','Στις ρυθμίσεις του NN (διπλό κλικ): «Κράτα τα βάρη που έμαθε» τα γράφει στο μπλοκ, ώστε την επόμενη φορά να ξεκινά εκπαιδευμένο.'],
  build(o){return nnDrive({ctrl:o.ctrl,load:o.load,cycles:4,lr:'mid'});}});
 T.push({id:'nn_online',group:'Έλεγχος με νευρωνικά δίκτυα (4.7)',title:'Νευρωνικό που μαθαίνει αμέσως',theory:'formula',topology:'nn_online',
  options:[{k:'lr',label:'Μάθηση',options:[['fast','Γρήγορη: κλίση (SGD), η = 0,02'],['adam','Adam, η = 3·10⁻⁴'],['slow','Αργή: κλίση, η = 0,002']],def:'fast'},
   {k:'event',label:'Στη μέση (3,2 s)',options:[['load','Διπλάσιο φορτίο'],['ref','Νέο μοτίβο αναφοράς'],['none','Καμία αλλαγή']],def:'load'},
   {k:'freeze',label:'Πάγωμα της μάθησης',options:[['never','Μαθαίνει συνέχεια'],['f6','Πάγωμα στα 4,8 s'],['f2','Πάγωμα στα 2 s, πριν από την αλλαγή']],def:'never'}],
  desc:'Το ίδιο κύκλωμα με τη «σύγκριση», με το νευρωνικό δίκτυο να ξεκινά χωρίς εκπαίδευση (έξοδος 0) και να μαθαίνει μέσα στα πρώτα δευτερόλεπτα. Στο scope η καμπύλη μάθησης L: η RMS τιμή του σφάλματος μάθησης (της εξόδου του PI) στα τελευταία 400 δείγματα. Στη μέση αλλάζει το φορτίο ή η αναφορά, και το δίκτυο ξαναπροσαρμόζεται, εκτός αν η μάθηση έχει παγώσει (είσοδος fz ή παράμετρος «Μαθαίνει»).',
  tasks:['Δες την L να πέφτει στον πρώτο κιόλας κύκλο με τη «Γρήγορη»: το δίκτυο μαθαίνει την τάση που χρειάζεται η μηχανή για κάθε (ω_r, α_r).','«Νέο μοτίβο αναφοράς»: το δίκτυο έμαθε μια σχέση, όχι μια χρονοσειρά· το νέο μοτίβο (μέσα στην ίδια περιοχή ταχυτήτων) ακολουθείται αμέσως.','«Διπλάσιο φορτίο»: η L ανεβαίνει στην αλλαγή και ξαναπέφτει. Με «Πάγωμα στα 2 s» μένει ψηλά: ο PI κάνει όλη τη διόρθωση.','Ξεκλείδωσε/κλείδωσε τη μάθηση την ώρα της προσομοίωσης: διπλό κλικ στο NN → «Μαθαίνει».','Σύγκρινε «Γρήγορη» και «Αργή»: γρηγορότερη μάθηση, αλλά και πιο θορυβώδη βάρη (δες το u_NN).'],
  build(o){return nnDrive({ctrl:'online',load:o.event==='load'?'step':'fan',event:o.event,freeze:o.freeze,cycles:5,lr:o.lr});}});
 // 4.8 (ROADMAP §46): the same machine with one block «Ελεγκτής AI» instead of the PI and the network wired by hand;
 // its façade (click on the block) changes scheme, mode, target and learning while it runs
 // 4.8: the pattern of steps repeats for ever (an expression of t), so the run lasts minutes; the record keeps a point
 // per millisecond (the memory then covers minutes) and the load step comes at 1 minute
 const NN_PAT_EXPR='m < 0.1 ? 0 : m < 0.5 ? 100 : m < 0.9 ? 150 : m < 1.3 ? 50 : 120';
 function aiBlock(o){const P=1.6,cyc=o.cycles||4,stopT=o.cycles?+(cyc*P).toFixed(4):0,kf=1.33e-3,live=o.mode==='live',tStep=o.cycles?+(Math.floor(cyc/2)*P).toFixed(4):60;
  const comps=[o.cycles?C('KW','CONST',40,0,{v:nnSched(cyc,P).join(', ')},{label:'ω*'}):C('KW','EXPR',40,0,{expr:NN_PAT_EXPR.replace(/m/g,'mod(t, 1.6)'),ins:''},{label:'ω* (επαναλαμβάνεται)'}),C('TFw','TAGI',40,80,{name:'ω'}),
   C('C1','AIC',220,40,{scheme:o.scheme,mode:live?'live':'ref',target:100,fs:1000,fr:5,Kp:.5,Ki:10,umin:-220,umax:220,rs:150,dxs:3000,us:100,hidden:'8',opt:'sgd',lr:.005,seed:1,
    w:o.scheme==='inv'?JSON.stringify(NN_DC_INV):''},{label:'Ελεγκτής AI'}),C('TGu','TAGO',330,10,{name:'u'}),
   C('TFu','TAGI',-20,300,{name:'u'}),C('V1','VDC',120,300,{ctl:'sig',V:0},{label:'μετατροπέας',lbl:'left'}),gnd(120,390),
   C('M1','DCM',300,300,{Ra:1,La:10e-3,psi:1,J:.02,bm:.002,load:'sig',w0:0,ia0:0},{label:'M'}),C('TGw','TAGO',430,290,{name:'ω'}),
   C('KL','CONST',40,440,{v:o.load==='step'?`0:1, ${tStep}:2`:'1'},{label:'συντελεστής φορτίου'}),C('TFw3','TAGI',40,500,{name:'ω'}),
   C('TLX','EXPR',170,470,{expr:'k*u1*u2*abs(u2)',ins:'u1, u2',pars:`k = ${kf}`},{label:'τ_L = k·ω·|ω|'})];
  const wires=[['KW:y','C1:r',[[120,0],[120,20]]],['TFw:y','C1:y',[[120,80],[120,60]]],['C1:u','TGu:u',[[290,10]]],['TFu:y','V1:u'],['V1:p','M1:a'],['V1:n','G1:g'],['M1:b','G1:g',[[300,390]]],['M1:w','TGw:u'],
   ['KL:y','TLX:u1',[[100,440],[100,460]]],['TFw3:y','TLX:u2',[[100,500],[100,480]]],['TLX:y','M1:tl',[[240,470],[240,300]]]];
  const panes=[[['Y:C1/LP','ω_r'],['Y:M1','ω']],[['Y:C1/E','e = ω_r − ω']],[['Y:C1/PI','u_PI'],['Y:C1/SAT','u']],[['Y:C1/NN1:L','L (σφάλμα μάθησης)']]];
  const watch={tiles:[{ctl:'C1.learn',label:'Μαθαίνει',at:[300,-80]},{ctl:'C1.target',label:'Στόχος ω*',at:[150,-80],al:'r',rng:[0,200],steps:'-20; +20'},['Y:M1','ω'],['Y:C1/E','e'],['Y:C1/IAE','IAE'],['Y:C1/NN1:L','L']]};
  return project(comps,wires,{watch,sim:{hDiv:20,speed:1000,stopT,...(o.cycles?{}:{rec:{dt:1e-3}})},scope:{panes,window:{unit:'s',n:3.2}},meta:{P,cycles:cyc,kf,aic:'C1'}});}
 T.push({id:'ai_block',group:'Έλεγχος με νευρωνικά δίκτυα (4.7)',title:'Ελεγκτής AI με πρόσοψη',theory:'formula',topology:'ai_block',
  options:[{k:'scheme',label:'Σχήμα',options:[['fel','PI + νευρωνικό online'],['emu','PI + αντίστροφο μέσω εξομοιωτή'],['inv','PI + αντίστροφο μοντέλο (σταθερά βάρη)'],['pi','Μόνο PI']],def:'fel'},
   {k:'mode',label:'Αναφορά',options:[['ref','Μοτίβο βημάτων (είσοδος r)'],['live','Ζωντανός στόχος (ρυθμιστής)']],def:'ref'},
   {k:'load',label:'Φορτίο',options:[['fan','Ανεμιστήρας'],['step','Διπλάσιο στο 1 λεπτό']],def:'fan'}],
  desc:'Τρέχει χωρίς τέλος: η αναφορά επαναλαμβάνεται κάθε 1,6 s, η καταγραφή κρατά ένα σημείο ανά ms (η μνήμη καλύπτει λεπτά) και «⭳ σε αρχείο» γράφει όλο το τρέξιμο στον δίσκο. Η μηχανή ΣΡ της «σύγκρισης» με ένα μόνο μπλοκ «Ελεγκτής AI» (βιβλιοθήκη «Έλεγχος»): μέσα του φίλτρο αναφοράς, PI, νευρωνικό δίκτυο και, στο σχήμα με εξομοιωτή, το δεύτερο δίκτυο με το αντίγραφό του. Κλικ στο μπλοκ ανοίγει την πρόσοψη: σχήμα, τρόπος (εκπαίδευση εκτός οθόνης, τρέξιμο με αναφορά, ζωντανός στόχος), «Μαθαίνει», ζωντανές τιμές και καμπύλες, επαναφορά και αποθήκευση βαρών, σύγκριση με τον PI.',
  tasks:['Κλικ στο μπλοκ «Ελεγκτής AI»: η πρόσοψη ανοίγει δίπλα του. ▶ και δες το IAE ανά κύκλο και την καμπύλη μάθησης.','«Εκπαίδευση εκτός οθόνης»: το ίδιο κύκλωμα τρέχει στο παρασκήνιο με μάθηση και τα βάρη γράφονται στο μπλοκ· μετά το ▶ ξεκινά εκπαιδευμένο.','«Ζωντανός στόχος»: η αναφορά γίνεται ο ρυθμιστής της πρόσοψης· άλλαξέ τον όσο τρέχει.','Κλείσε το «Μαθαίνει» στη μέση και άλλαξε το φορτίο: ο PI καλύπτει τη διαφορά.','«Σύγκριση με PI»: το ίδιο κύκλωμα με μόνο τον PI στο παρασκήνιο· ο πίνακας δίνει το IAE ανά κύκλο.'],
  build(o){return aiBlock(o);}});
 // 4.8: an electric vehicle (ROADMAP §46, decision 50; Control Workbench EV/DC v0.17): battery with SOC, a converter
 // as an average model (the armature voltage the controller asks for, within what the battery allows), the DC machine
 // of the tool with the vehicle's inertia reflected to the shaft, the road load (rolling, air, grade that changes with
 // the distance, a variable load), and the energy metrics. The battery and the vehicle are signal models, as in the
 // workbench; the machine and its current are the tool's. The driving cycle repeats (minutes, no end of the run).
 const EVV={R:.22,La:.003,K:.2,Jm:.018,B:4e-4,gear:7,eta:.92,rw:.255,m:115,Crr:.012,CdA:.32,rho:1.225,Tb:.05,Ta:.45,lp:55,gp:90,Q:18,ocv0:45,ocv1:58.8,Rb:.075,Rg:2.6,ceta:.94,boost:1.75,vmax:96,ibmax:140,vkph:45};
 // the cycles of the workbench, with a stop at the end so that they repeat (decelerate to 0 and wait)
 const EV_CYC={urban:{t:[0,.11,.2,.38,.5,.63,.74,.84,.92,1],y:[0,.28,.58,.58,.32,.72,.48,.62,0,0]},grade:{t:[0,.09,.2,.41,.53,.65,.78,.86,.93,1],y:[0,.34,.66,.66,.50,.74,.58,.64,0,0]},
  // 4.8: hard accelerations, where the power limit of each mode binds (eco 5.2 kW, balanced 8 kW, performance 10.8 kW)
  sport:{t:[0,.07,.24,.31,.42,.5,.66,.76,.9,1],y:[0,.85,.85,.3,.3,.8,.8,.45,0,0]}};
 function evDrive(o){const V=EVV,g=9.80665,grade=o.cycle==='grade',sport=o.cycle==='sport',m=V.m+(grade?35:0),g0=grade?4:0,ga=grade?2.5:1.5,soc0=grade?.55:.85,D=+o.D||60;
  const Jeq=+(V.Jm+m*(V.rw/V.gear)**2).toPrecision(6),wmax=+((V.vkph/3.6)/V.rw*V.gear/.85).toPrecision(6),cy=EV_CYC[grade?'grade':sport?'sport':'urban'];
  const lut=cy.t.map((t,k)=>`${+(t*D).toPrecision(6)}, ${cy.y[k]}`).join(', ');
  const ctl=['moev','moevc','ai','pi'].includes(o.ctrl)?o.ctrl:'moevc2',mo=ctl==='moev'||ctl==='moevc'||ctl==='moevc2';
  // 4.17.1 (§59): the vehicle as inputs of the circuit (constants with «Είσοδος», in the parameters of the circuit with
  // their explanation); the inertia at the shaft, the friction, the gear of the speed and the road load are expressions
  // of them, computed again at every change
  const IN=(name,v,desc,k)=>C('IN_'+name,'CONST',-560,-80+40*k,{v,input:true,name,desc},{label:name});
  const inputs=[IN('m',m,'μάζα του οχήματος με τον αναβάτη (kg)'+(grade?': 115 + 35 φορτίο':''),0),IN('B',V.B,'ιξώδης τριβή της μηχανής (N·m·s/rad): 1–2 % της ισχύος της στις ονομαστικές στροφές',1),
   IN('Jm',V.Jm,'ροπή αδράνειας του δρομέα (kg·m²)',2),IN('rw',V.rw,'ακτίνα του τροχού (m)',3),IN('n',V.gear,'λόγος μετάδοσης (στροφές μηχανής ανά στροφή τροχού)',4),
   IN('eta',V.eta,'απόδοση της μετάδοσης',5),IN('Crr',V.Crr,'συντελεστής κύλισης',6),IN('CdA',V.CdA,'συντελεστής αεροδυναμικής αντίστασης επί μετωπική επιφάνεια (m²)',7),
   IN('vk',V.vkph,'τελική ταχύτητα του οχήματος (km/h): ο κύκλος φτάνει ως 0,85 της',8)];
  const comps=[...inputs,
   // driving cycle: normalized speed (0 … 0.85 of the top speed vk) repeating every D seconds, with a slow ripple
   C('REF','EXPR',-300,-80,{expr:`(vk/3.6/rw*n/0.85)*clamp(lut(mod(t, D), ${lut})*(1 + 0.025*sin(2*pi*t/(D/3))), 0, 0.85)`,ins:'',pars:`D = ${D}`},{label:'κύκλος οδήγησης ω*'}),
   C('TGr','TAGO',-170,-80,{name:'ω*'}),
   // the battery (signals): OCV(SOC), R_int(SOC), current from the power the converter draws, SOC
   C('TFsoc','TAGI',-300,250,{name:'SOC'}),C('TFva','TAGI',-300,290,{name:'v_a'}),C('TFia','TAGI',-300,330,{name:'i_a'}),
   C('BAT','EXPR',-150,290,{expr:'(oc - sqrt(max(oc*oc - 4*rb*pb, 0)))/(2*rb)',ins:'s, va, ia',pars:''},{label:'i_bat'}),
   C('TGib','TAGO',-30,290,{name:'i_bat'}),
   C('GQ','GAIN',60,250,{K:+(-1/(3600*V.Q)).toPrecision(8)},{label:'−1/(3600·Q)'}),C('TFib','TAGI',-30,250,{name:'i_bat'}),
   C('SOC','INT',160,250,{y0:soc0,lo:0,hi:1},{label:'SOC'}),C('TGs','TAGO',260,250,{name:'SOC'}),
   // the converter: the armature voltage within ± min(V_max, boost·OCV)
   C('TFu','TAGI',-300,450,{name:'u'}),C('TFs2','TAGI',-300,490,{name:'SOC'}),C('TFia3','TAGI',-300,530,{name:'i_a'}),
   C('CNV','EXPR',-150,490,{expr:'',ins:'u, s, ia',pars:''},{label:'V_arm (όρια μπαταρίας)'}),C('TGva','TAGO',-30,470,{name:'v_a'}),
   C('TFva2','TAGI',40,560,{name:'v_a'}),C('V1','VDC',140,560,{ctl:'sig',V:0},{label:'μετατροπέας',lbl:'left'}),gnd(140,660),
   C('AM1','AM',260,500,{},{label:'i_a'}),C('TGi','TAGO',340,460,{name:'i_a'}),
   C('TFl','TAGI',240,600,{name:'τ_L'}),C('M1','DCM',380,560,{Ra:V.R,La:V.La,psi:V.K,J:'= Jm + m*(rw/n)^2',bm:'= B',load:'sig',w0:0,ia0:0},{label:'M (ΣΡ)'}),C('TGw','TAGO',500,550,{name:'ω'}),
   // the road: distance, grade and load
   C('TFw','TAGI',-300,660,{name:'ω'}),C('GV','GAIN',-180,660,{K:'= rw/n'},{label:'v = ω·r/n'}),C('X','INT',-80,660,{y0:0},{label:'απόσταση x'}),C('TGx','TAGO',20,660,{name:'x'}),C('TGv','TAGO',-80,610,{name:'v'}),
   C('TFw4','TAGI',-300,740,{name:'ω'}),C('TFx','TAGI',-300,780,{name:'x'}),
   C('ROAD','EXPR',-150,760,{expr:'(m*g*Crr*sg + 0.5*rho*CdA*v*abs(v) + m*g*sin(atan((g0 + ga*sin(2*pi*x/gp))/100)))*rw/(n*eta) + (Tb + Ta*(0.5 + 0.5*sin(2*pi*x/lp)))*sg',
    ins:'w, x',pars:`g = ${g}, rho = ${V.rho}, g0 = ${g0}, ga = ${ga}, gp = ${V.gp}, Tb = ${V.Tb}, Ta = ${V.Ta}, lp = ${V.lp}, v = 0, sg = 0`},{label:'τ_L φορτίου δρόμου'}),
   C('TGl','TAGO',-30,760,{name:'τ_L'}),
   // metrics: energy drawn (and regenerated), distance, km/kWh, Wh/km, N·m/kW, RMS current, SOC drop
   C('TFib2','TAGI',600,-80,{name:'i_bat'}),C('TFs3','TAGI',600,-40,{name:'SOC'}),C('PB','EXPR',720,-60,{expr:'ib*(oc - ib*rb)',ins:'ib, s',pars:''},{label:'P_bat = v_bat·i_bat'}),
   C('EN','INT',840,-60,{y0:0},{label:'E (J)'}),C('TFx2','TAGI',600,20,{name:'x'}),
   C('KWH','EXPR',960,0,{expr:'en > 1 ? (x/1000)/(en/3.6e6) : 0',ins:'x, en'},{label:'km/kWh'}),C('WHK','EXPR',960,60,{expr:'x > 1 ? (en/3600)/(x/1000) : 0',ins:'x, en'},{label:'Wh/km'}),
   C('TFw7','TAGI',600,120,{name:'ω'}),C('AT','EXPR',720,140,{expr:'abs(te)',ins:'te'},{label:'|τ_e|'}),C('IT','INT',840,140,{y0:0},{label:'∫|τ_e|'}),C('IP','INT',840,200,{y0:0},{label:'∫P_bat'}),
   C('NMK','EXPR',960,170,{expr:'p > 1e-6 ? q/(p/1000) : 0',ins:'q, p'},{label:'N·m/kW'}),
   C('TFia2','TAGI',600,260,{name:'i_a'}),C('I2','EXPR',720,260,{expr:'i*i',ins:'i'},{label:'i_a²'}),C('II2','INT',840,260,{y0:0},{label:'∫i_a²'}),
   C('IRMS','EXPR',960,260,{expr:'t > 0 ? sqrt(q/t) : 0',ins:'q'},{label:'I_rms'}),
   C('TFs4','TAGI',840,320,{name:'SOC'}),C('DSOC','EXPR',960,320,{expr:'100*(s0 - s)',ins:'s',pars:`s0 = ${soc0}`},{label:'πτώση SOC (μον. %)'}),
   C('TFv2','TAGI',840,380,{name:'v'}),C('KPH','GAIN',960,380,{K:3.6},{label:'km/h'})];
  // the expressions of the battery need OCV and R_int of the SOC: written out in each (a function of the SOC)
  const ocv=`(${V.ocv0} + ${+(V.ocv1-V.ocv0).toPrecision(6)}*s - 1.8*(1 - s)^3)`,rb=`(${V.Rb}*(1 + ${V.Rg}*(1 - s)^2))`;
  const fix=c=>{if(c.params?.expr)c.params.expr=c.params.expr.replace(/\boc\b/g,ocv).replace(/\brb\b/g,rb);return c;};
  const byId=Object.fromEntries(comps.map(c=>[c.id,c]));
  byId.BAT.params.expr=`clamp((oc - sqrt(max(oc*oc - 4*rb*pb, 0)))/(2*rb), -${V.ibmax}, ${V.ibmax})`.replace(/pb/g,`(va*ia >= 0 ? va*ia/${V.ceta} : va*ia*${V.ceta})`);
  // the converter: within ± V_max and the boost of the OCV, and (motoring) within the power the battery can give at its
  // current limit: P_max = η·min(OCV·I_max − R·I_max², OCV²/(4R)), so |v_a| ≤ P_max/|i_a|
  const vl=`min(${V.vmax}, ${V.boost}*oc, u*ia > 0 ? ${V.ceta}*min(oc*${V.ibmax} - ${V.ibmax*V.ibmax}*rb, oc*oc/(4*rb))/max(abs(ia), 1) : 1e9)`;
  byId.CNV.params.expr=`clamp(u, -${vl}, ${vl})`;
  byId.ROAD.params.expr=byId.ROAD.params.expr.replace(/\bv\b/g,'(w*rw/n)').replace(/\bsg\b/g,'tanh(w*rw/n/0.25)');byId.ROAD.params.pars=byId.ROAD.params.pars.replace(', v = 0, sg = 0','');
  comps.forEach(fix);
  const wires=[['REF:y','TGr:u'],['TFsoc:y','BAT:s'],['TFva:y','BAT:va'],['TFia:y','BAT:ia'],['BAT:y','TGib:u'],['TFib:y','GQ:u'],['GQ:y','SOC:u'],['SOC:y','TGs:u'],
   ['TFu:y','CNV:u'],['TFs2:y','CNV:s'],['TFia3:y','CNV:ia'],['CNV:y','TGva:u'],['TFva2:y','V1:u'],['V1:p','AM1:a',[[140,500]]],['AM1:b','M1:a',[[380,500]]],['AM1:y','TGi:u',[[300,460]]],['V1:n','G1:g'],['M1:b','G1:g',[[380,660]]],['M1:w','TGw:u'],['TFl:y','M1:tl',[[320,600],[320,560]]],
   ['TFw:y','GV:u'],['GV:y','X:u'],['X:y','TGx:u'],['GV:y','TGv:u',[[-130,660],[-130,610]]],['TFw4:y','ROAD:w'],['TFx:y','ROAD:x'],['ROAD:y','TGl:u'],
   ['TFib2:y','PB:ib'],['TFs3:y','PB:s'],['PB:y','EN:u'],['TFx2:y','KWH:x'],['EN:y','KWH:en',[[900,-60],[900,10]]],['TFx2:y','WHK:x',[[660,20],[660,50]]],['EN:y','WHK:en',[[910,-60],[910,70]]],
   ['M1:te','AT:te',[[540,570],[540,140]]],['AT:y','IT:u'],['PB:y','IP:u',[[780,-60],[780,200]]],['IT:y','NMK:q'],['IP:y','NMK:p'],['TFia2:y','I2:i'],['I2:y','II2:u'],['II2:y','IRMS:q'],['TFs4:y','DSOC:s'],['TFv2:y','KPH:u']];
  // the controller
  if(mo){comps.push(C('TFr','TAGI',-300,-30,{name:'ω*'}),C('TFw5','TAGI',-300,10,{name:'ω'}),C('TFi5','TAGI',-300,50,{name:'i_a'}),C('TFs5','TAGI',-300,90,{name:'SOC'}),C('TFl5','TAGI',-300,130,{name:'τ_L'}),
    C('MO1','EVC',-150,40,{scheme:ctl,mode:o.mode||'balanced',J:'= Jm + m*(rw/n)^2',Kt:V.K,Ke:V.K,R:V.R,B:'= B',umin:-V.vmax,umax:V.vmax},{label:'πολυκριτηριακός'}),C('TGu','TAGO',-30,0,{name:'u'}),C('TGt','TAGO',-30,20,{name:'τ*'}));
   wires.push(['TFr:y','MO1:r',[[-220,-30],[-220,0]]],['TFw5:y','MO1:y',[[-210,10],[-210,20]]],['TFi5:y','MO1:i',[[-200,50],[-200,40]]],['TFs5:y','MO1:soc',[[-200,90],[-200,60]]],['TFl5:y','MO1:tl',[[-210,130],[-210,80]]],['MO1:u','TGu:u'],['MO1:tau','TGt:u']);}
  else{comps.push(C('TFr','TAGI',-300,-30,{name:'ω*'}),C('TFw5','TAGI',-300,10,{name:'ω'}),
    C('C1','AIC',-150,0,{scheme:ctl==='ai'?'fel':'pi',fs:1000,fr:2,Kp:1.5,Ki:6,umin:-V.vmax,umax:V.vmax,rs:300,us:50,hidden:'8',opt:'sgd',lr:.003,seed:1},{label:'Ελεγκτής AI'}),C('TGu','TAGO',-30,-30,{name:'u'}));
   wires.push(['TFr:y','C1:r',[[-220,-30],[-220,-20]]],['TFw5:y','C1:y',[[-220,10],[-220,20]]],['C1:u','TGu:u']);}
  const watch={tiles:[...(mo?[{ctl:'MO1.mode',label:'Τρόπος',at:[-300,-275]},{ctl:'MO1.ws',label:'Βάρος ταχύτητας',rng:[0,1.5],steps:['-0.1','+0.1']},{ctl:'MO1.wt',label:'Βάρος ροπής',rng:[0,1.5],steps:['-0.1','+0.1']},{ctl:'MO1.we',label:'Βάρος ενέργειας',rng:[0,1.5],steps:['-0.1','+0.1']}]:[]),
   ['Y:KPH','ταχύτητα (km/h)'],['Y:SOC','SOC'],['Y:KWH','km/kWh'],['Y:WHK','Wh/km'],['Y:NMK','N·m/kW'],['Y:IRMS','I_rms (A)'],['Y:DSOC','πτώση SOC (μον. %)'],...(mo?[['Y:MO1/KP','κράτηση ροπής (keep)'],['Y:MO1/LIM','κατανομή / όριο ενεργό']]:[])]};
  const panes=[[['Y:REF','ω*'],['Y:M1','ω'],...(ctl==='moevc'||ctl==='moevc2'?[['Y:MO1/GOV','ω* μετά τον ρυθμιστή']]:[])],[['Y:M1:te','τ_e'],...(mo?[['Y:MO1/TQ','τ*']]:[]),['Y:ROAD','τ_L']],[['Y:SOC','SOC']],[['Y:AM1','i_a']]];
  return project(comps,wires,{watch,sim:{hDiv:2,speed:3000,stopT:0,rec:{dt:1e-3}},scope:{panes,window:{unit:'s',n:D}},meta:{ev:true,D,soc0,Jeq,wmax,ctrl:ctl}});}
 T.push({id:'ev_drive',group:'Ηλεκτρικό όχημα (4.8)',title:'Ηλεκτρικό όχημα: πολυκριτηριακός έλεγχος',theory:'formula',topology:'ev_drive',
  options:[{k:'ctrl',label:'Ελεγκτής',options:[['moevc2','Πολυκριτηριακός συζευγμένος με βάρη που δρουν πάντα (4.18.1)'],['moevc','Πολυκριτηριακός συζευγμένος (4.8): ρυθμιστής αναφοράς, ταχύτητα → ροπή → ρεύμα'],['moev','Πολυκριτηριακός καταρράκτης: ταχύτητα → ροπή → ρεύμα, επόπτης SOC/ισχύος'],['ai','Ελεγκτής AI: PI + νευρωνικό (ένας βρόχος τάσης)'],['pi','Μόνο PI ταχύτητας (τάση)']],def:'moevc2'},
   {k:'mode',label:'Τρόπος',options:[['balanced','Ισορροπημένος'],['eco','Οικονομικός (eco)'],['performance','Επιδόσεων']],def:'balanced'},
   {k:'cycle',label:'Διαδρομή',options:[['urban','Αστική (κλίση ± 1,5 %, SOC 85 %)'],['grade','Με κλίση 4 % ± 2,5 %, φορτίο +35 kg, SOC 55 %'],['sport','Γρήγορες επιταχύνσεις (εκεί φαίνεται ο τρόπος)']],def:'urban'}],
  desc:'Όχημα 115 kg με μηχανή ΣΡ (μετάδοση 7:1, τροχός 0,255 m), μπαταρία 18 Ah με OCV(SOC) και R_int(SOC), μετατροπέας ως μέσο μοντέλο, φορτίο δρόμου (κύλιση, αέρας, κλίση που αλλάζει με την απόσταση). Ο κύκλος οδήγησης επαναλαμβάνεται κάθε 60 s και η προσομοίωση δεν τελειώνει: τρέχει όσα λεπτά θέλεις, η καταγραφή κρατά ένα σημείο ανά ms και «⭳ σε αρχείο» γράφει όλο το τρέξιμο στον δίσκο. Ο πολυκριτηριακός ελεγκτής είναι ο καταρράκτης «moevc» του Control Workbench EV/DC: ρυθμιστής αναφοράς από τα όρια, ταχύτητα → επιτάχυνση → ροπή μέσω της δυναμικής του οχήματος, κατανομή με βάρη ταχύτητας, ροπής και ενέργειας, βρόχος ρεύματος.',
  tasks:['▶ και άφησε τουλάχιστον έναν κύκλο (60 s): στα πλακίδια km/kWh, Wh/km, N·m/kW, I_rms και η πτώση του SOC.','Άλλαξε τον «Τρόπο» σε eco την ώρα που τρέχει (πλακίδιο): η ροπή που ζητείται μειώνεται, η ταχύτητα ακολουθεί πιο αργά και τα km/kWh ανεβαίνουν.','Παίξε με τα βάρη ταχύτητας, ροπής και ενέργειας: η «κράτηση ροπής» (keep) δείχνει πόσο από τη ροπή που χρειάζεται δίνει ο ελεγκτής.','«Με κλίση» και SOC 55 %: ο ρυθμιστής αναφοράς κόβει τον στόχο όταν η ροπή δεν φτάνει (ω* μετά τον ρυθμιστή στο scope).','Σύγκρινε με «Ελεγκτής AI» και «Μόνο PI»: ένας βρόχος τάσης ακολουθεί την ταχύτητα χωρίς να ξέρει την μπαταρία.','Για ώρες: «Καταγραφή» κάθε 10 ms και «⭳ σε αρχείο».'],
  build(o){return evDrive(o);}});
 T.push({id:'nn_gui',group:'Έλεγχος με νευρωνικά δίκτυα (4.7)',title:'Σύνθεση ελέγχου από Python: κάθε μηχανή, στόχοι με βάρη',theory:'formula',topology:'nn_gui',
  options:[{k:'ctrl',label:'Τι έστειλε το παράθυρο (παράδειγμα)',options:[['pinn','PI + νευρωνικό online'],['inv','PI + αντίστροφο μοντέλο'],['pi','Μόνο PI']],def:'pinn'}],
  desc:'Το εξωτερικό παράθυρο σε Python (python -m pcl gui) διαβάζει από την εφαρμογή ποιες μηχανές υπάρχουν, σε αφήνει να διαλέξεις τι θέλεις να επιτύχει ο έλεγχος (IAE, ISE, υπέρβαση, αποκατάσταση, ενέργεια ελέγχου, ανοχή στο φορτίο, με βάρη), συνθέτει το κύκλωμα ανάλογα με το είδος της μηχανής (ΣΡ, επαγωγής, σύγχρονη, SRM) με πραγματικά σύρματα, εκπαιδεύει, τρέχει τις εκδοχές παράλληλα και στέλνει την καλύτερη εδώ. Το κύκλωμα αυτού του tutorial είναι αυτό που συνθέτει για τη μηχανή ΣΡ, με βήμα φορτίου στον τελευταίο κύκλο.',
  tasks:['Σε ένα τερματικό (Anaconda: conda activate pcl): python -m pcl gui. Πάτα «Σύνδεση με την εφαρμογή» και «Αποδοχή» εδώ: η λίστα μηχανών έρχεται από την εφαρμογή.','Διάλεξε «Μηχανή επαγωγής», ελεγκτή «Αυτόματα», στόχους IAE και υπέρβαση, και «Εκπαίδευση και τρέξιμο». Ο πίνακας ταξινομεί τις εκδοχές κατά J.','Διάλεξε μια γραμμή και «Στείλε στην εφαρμογή»: το κύκλωμα ανοίγει εδώ, με το NN και τα σύρματά του. ▶ για να τρέξει και να συνεχίσει να μαθαίνει.','Χωρίς παράθυρο: python -m pcl design --machine IM --goal iae=1 --goal overshoot=0.5 --out im.pcl.json (ο κώδικας στην κάρτα θεωρίας).','Μια νέα μηχανή στο parts.js με περιγραφή «machine» γνωστού είδους εμφανίζεται στη λίστα χωρίς αλλαγή στο παράθυρο.'],
  build(o){const pr=nnDrive({ctrl:o.ctrl==='pi'?'pi':o.ctrl,load:'step',cycles:3,lr:'mid'});pr.meta.gui=true;return pr;}});
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
   {k:'z0',label:'Μηδενική ακολουθία του δικτύου',options:[['1.5','Z₀ = 1,5·Z₁'],['3','Z₀ = 3·Z₁'],['iso','Μονωμένος ουδέτερος'],['zn','Z₀ = 1,5·Z₁, ουδέτερος μέσω R_n + jX_n = 10 + j20 Ω (4.24)']],def:'1.5'},
   {k:'cb',label:'Διακόπτης ισχύος',options:[['none','Μένει κλειστός'],['open','Ανοίγει στα 200 ms']],def:'none'}],
  desc:'Ένα ισοδύναμο δικτύου (S″k, X/R, Z₀) τροφοδοτεί μέσω διακόπτη ισχύος (και, αν θέλεις, μετασχηματιστή Dyn11) ένα φορτίο. Στα 40 ms γίνεται σφάλμα. Όλα τα σύρματα είναι τριφασικοί δίαυλοι. Κάθε στοιχείο της βιβλιοθήκης «Δίκτυο» είναι υποκύκλωμα από απλά στοιχεία, οπότε τα ρεύματα φαίνονται ως F1/Ia, CB1/Ia κ.λπ.',
  tasks:['Σύγκρινε το I″k κάθε φάσης στην κάρτα με τον τύπο της IEC 60909 (μόνιμη τιμή, όταν σβήσει η συνιστώσα DC με τ = X/(ωR)).','Μονοφασικό με μονωμένο ουδέτερο: σχεδόν μηδέν ρεύμα. Πίσω από το Dyn11 όμως ρέει, γιατί το αστέρι 20 kV είναι γειωμένο.','Μονοφασικό με ουδέτερο μέσω R_n + jX_n: η μηδενική ακολουθία βλέπει Z₀ + 3Z_n, και το ρεύμα πέφτει από 12,4 kA σε 0,54 kA (4.24). Η επιλογή «Ουδέτερος» υπάρχει σε κάθε τριφασικό στοιχείο με κέντρο αστέρα.','Με «Ανοίγει στα 200 ms»: κάθε πόλος σβήνει στο δικό του μηδέν ρεύματος (δες και το αρχείο συμβάντων).'],
  build(o){const xf=o.xf==='dyn11',kind=o.kind||'abc',iso=o.z0==='iso',dur=o.cb==='open'?.26:.2;
   const grid=xf?{Un:150e3,Sk:5e9,XR:10}:{Un:20e3,Sk:500e6,XR:10};Object.assign(grid,iso?{z0:'iso'}:{z0:'ratio',Z0Z1:+o.z0||1.5,XR0:5},o.z0==='zn'?{neut:'z',Rng:10,Xng:20}:{},{conn:'bus'});
   const comps=[C('G1','GRID3',220,200,grid,{label:'δίκτυο'}),C('CB1','CB3',360,200,{cmd:o.cb==='open'?'0:1, 0.2:0':'0:1',conn:'bus'}),
    C('J1','JUNC',660,200),C('F1','FLT3',660,340,{kind,ton:.04,conn:'bus'},{lbl:'below'}),C('L1','LOAD3',820,340,{Un:20e3,P:5e6,Q:2e6,cn:'y',conn:'bus'},{lbl:'below'})];
   const wires=[['G1:abc','CB1:abc1'],['J1:j','F1:abc'],['J1:j','L1:abc']];
   if(xf){comps.push(C('T1','XF3',520,200,{grp:'Dyn11',Sn:40e6,U1:150e3,U2:20e3,uk:10,Pk:200e3,i0:.5,conn:'bus'}));wires.push(['CB1:abc2','T1:abc1'],['T1:abc2','J1:j']);}
   else wires.push(['CB1:abc2','J1:j']);
   return project(comps,wires,{sim:{hDiv:2000,speed:5,stopT:dur},
    scope:{panes:[[['Y:F1/Ia','i_a σφάλματος'],['Y:F1/Ib','i_b σφάλματος'],['Y:F1/Ic','i_c σφάλματος']],[['Y:F1/Ig','ρεύμα προς γη'],['Y:CB1/Ia','i_a διακόπτη']]],window:{unit:'T',n:4}},
    meta:{grid,kind,xf,dur,cb:o.cb==='open',xfp:xf?{grp:'Dyn11',Sn:40e6,U1:150e3,U2:20e3,uk:10,Pk:200e3}:null}});}});
 // 4.3: synchronous generator (§31.6), the IEEE First Benchmark Model (§25), IEEE 9 in EMT from its load flow (§31.7)
 const ph3=['a','b','c'];
 // three-phase short circuit at the terminals of a generator at no load (typical round-rotor data, as in the part)
 T.push({id:'gen_sc',group:'Συστήματα ισχύος (4.3)',title:'Τριφασικό βραχυκύκλωμα στα άκρα σύγχρονης γεννήτριας',theory:'formula',topology:'gen_sc',
  options:[{k:'t0',label:'Στιγμή σφάλματος',options:[['zero','v_a = 0 (μέγιστη συνιστώσα DC στη φάση a)'],['peak','v_a στο μέγιστο (χωρίς DC στη φάση a)']],def:'zero'},
   {k:'ra',label:'R_a',options:[['0.003','0,003 pu (τυπική)'],['0.01','0,01 pu (γρήγορη απόσβεση της DC)']],def:'0.003'}],
  desc:'Γεννήτρια 100 MVA, 13,8 kV χωρίς φορτίο, με τάση 1 pu. Στα 40 ms περίπου γίνεται τριφασικό βραχυκύκλωμα στα άκρα της. Το ρεύμα περνά από την υπομεταβατική στη μεταβατική και στη μόνιμη τιμή, με τις σταθερές χρόνου T″_d και T′_d· η συνιστώσα DC σβήνει με T_a.',
  tasks:['Σύγκρινε το πλάτος του ρεύματος στην αρχή, στα 0,3 s και στα 2 s με τα E/X″_d, E/X′_d, E/X_d της κάρτας.','Με σφάλμα στο μέγιστο της v_a, η φάση a ξεκινά χωρίς συνιστώσα DC· οι b και c όχι.','Το ρεύμα διέγερσης πηδά στο σφάλμα: η ροή του δρομέα διατηρείται.'],
  build(o){const Ra=+o.ra||0.003,f=50,w=2*Math.PI*f,t0=(Math.ceil(0.04*f*2)/(2*f))+(o.t0==='peak'?1/(4*f):0);
   const comps=[C('SG1','GEN3',160,240,{Ra,V0:1,ang0:0},{label:'γεννήτρια'}),C('F1','FLT3',360,340,{kind:'abcg',ton:t0,Rf:0,Rg:0},{lbl:'below'}),gnd(160,360)];
   const wires=ph3.map((k,j)=>['SG1:'+k,'F1:'+k]);
   return project(comps,wires,{version:4,sim:{hDiv:400,speed:2,stopT:2.5},
    scope:{panes:[[['Y:F1/Ia','i_a'],['Y:F1/Ib','i_b'],['Y:F1/Ic','i_c']],[['Y:SG1:ifd','i_fd (pu)'],['Y:SG1:te','T_e (pu)']]],window:{unit:'s',n:2.5}},
    meta:{gen:{...Parts.defaults('GEN3'),Ra,V0:1},t0}});}});
 // IEEE First Benchmark Model (1977): generator, Δ-Y transformer, line with series capacitor, infinite bus; six masses
 const FBM_SHAFT={shaft:'multi',Hm:'0.092897; 0.155589; 0.858670; 0.884215; 0.868495; 0.0342165',Km:'19.303; 34.929; 52.038; 70.858; 2.822',Dmu:'0; 0; 0; 0; 0',Tfr:'30; 26; 22; 22; 0; 0',gm:5};
 function fbmPoint(P0,pf,Xc){const Q0=P0*Math.tan(Math.acos(pf)),c=(r,i)=>({r,i}),mul=(a,b)=>c(a.r*b.r-a.i*b.i,a.r*b.i+a.i*b.r),sub=(a,b)=>c(a.r-b.r,a.i-b.i),sh=c(Math.cos(Math.PI/6),Math.sin(Math.PI/6));
  const I=c(P0,-Q0),VA=mul(sub(c(1,0),mul(c(0,0.14),I)),sh),Ih=mul(I,sh),VB=sub(VA,mul(c(0.02,0.5-Xc),Ih)),E=sub(VB,mul(c(0,0.06),Ih));
  return {E:Math.hypot(E.r,E.i),eAng:Math.atan2(E.i,E.r),bAng:Math.atan2(VB.i,VB.r)};}
 T.push({id:'fbm',group:'Συστήματα ισχύος (4.3)',title:'IEEE First Benchmark Model: υποσύγχρονος συντονισμός (SSR)',theory:'formula',topology:'fbm',
  options:[{k:'case',label:'Περίπτωση',options:[['1T','1-T: σφάλμα στο B, X_c = 0,371 pu'],['1S','1-S: αυτοδιέγερση, ρυθμός 3, X_c = 0,287 pu']],def:'1T'}],
  desc:'Το δίκτυο και ο στρόβιλος-γεννήτρια του IEEE First Benchmark Model (1977): γεννήτρια 892,4 MVA με άξονα έξι μαζών (HP, IP, LPA, LPB, GEN, EXC), μετασχηματιστής Δ-Υ, γραμμή με πυκνωτή σειράς και άπειρος ζυγός, όλα σε ανά μονάδα της γεννήτριας στα 60 Hz. 1-T: P = 0,9 pu, cos φ = 0,9· τριφασικό σφάλμα με γη μέσω X_F = 0,04 pu στο B, όταν v_a = 0, που εκκαθαρίζεται σε 0,075 s στα μηδενισμένα ρεύματα. 1-S: χωρίς φορτίο, μοντέλο δρομέα του ρυθμού 3 και απόσβεση στη μάζα της γεννήτριας· ένας μικρός παλμός ροπής διεγείρει τους ρυθμούς.',
  tasks:['1-T: σύγκρινε τη ροπή LPA–LPB και GEN–EXC με το Σχ. 5 του paper (κάρτα).','1-S: ο ρυθμός 3 (25,55 Hz) μεγαλώνει με ρυθμό περίπου 1,52 1/s· μέτρησε από την περιβάλλουσα της ροπής.','Άλλαξε το X_c του πυκνωτή και δες πότε ο συντονισμός f₀ − f_er πέφτει πάνω σε άλλο στρεπτικό ρυθμό.'],
  build(o){const S1=o.case==='1S',Sn=892.4e6,Ug=22e3,Uh=500e3,f=60,w=2*Math.PI*f,Zb=Uh*Uh/Sn,Xc=S1?0.287:0.371,P0=S1?0:0.9,op=fbmPoint(P0,0.9,Xc);
   const tf=S1?0:(Math.ceil((0.05*w+op.bAng)/Math.PI)*Math.PI-op.bAng)/w;
   const rotor=S1?{data:'circ',cXad:1.66,cXfd:0.04080,cRfd:0.00764,cXkd:0,cRkd:0,cXaq:1.58,cX1q:0.04556,cR1q:0.00998,cX2q:0,cR2q:0}
    :{data:'circ',cXad:1.66,cXfd:0.062,cRfd:0.53/377,cXkd:0.0055,cRkd:1.54/377,cXaq:1.58,cX1q:0.326,cR1q:5.3/377,cX2q:0.095,cR2q:3.1/377};
   const comps=[C('SG1','GEN3',140,300,{Sn,Un:Ug,f,pp:1,...rotor,Ra:0,Xl:0.13,X0:0.13,...FBM_SHAFT,Dm:S1?'0; 0; 0; 0; 0.77504; 0':'0; 0; 0; 0; 0; 0',V0:1,ang0:0,
     ...(S1?{mech:'sched',Tm:'0:0, 0.02:0.05, 0.03:0'}:{})},{label:'γεννήτρια'}),
    C('T1','XF3',320,300,{grp:'Dyn11',U1:Ug,U2:Uh,Sn,f,uk:14,Pk:0,i0:0,P0:0}),
    C('LN1','LINE3',500,300,{unit:'pu',Un:Uh,Sb:Sn,f,R1:0.02,X1:0.5,B1:0,z0:'given',R0:0.5,X0:1.56,B0:0},{label:'γραμμή'}),
    C('E1','VAC3',980,300,{Vpk:op.E*Uh*Math.SQRT2/Math.sqrt(3),f,phase:op.eAng*180/Math.PI,Rs:0,Ls:0},{label:'άπειρος ζυγός'}),C('GND','GND',980,380,{},{label:'0 V'})];
   const wires=[['E1:n','GND:g']];
   ph3.forEach((k,j)=>{const y=200+100*j;comps.push(C('C'+k,'C',660,y,{C:1/(w*Xc*Zb)},{rot:1,label:'C_'+k}),C('LS'+k,'L',820,y,{L:0.06*Zb/w},{label:'X_s'}));
    wires.push(['SG1:'+k,'T1:'+k+'1'],['T1:'+k+'2','LN1:'+k+'1'],['LN1:'+k+'2','C'+k+':p'],['C'+k+':n','LS'+k+':a'],['LS'+k+':b','E1:'+k]);});
   if(!S1){comps.push(C('CB1','CB3',760,560,{cmd:`0:0, ${+tf.toFixed(6)}:1, ${+(tf+0.075).toFixed(6)}:0`},{label:'σφάλμα στο B'}));
    ph3.forEach((k,j)=>{comps.push(C('LF'+k,'L',900,520+40*j,{L:0.04*Zb/w},{label:'X_F'}));wires.push(['C'+k+':n','CB1:'+k+'1'],['CB1:'+k+'2','LF'+k+':a'],['LF'+k+':b','GND:g']);});}
   const panes=S1?[[['Y:SG1:ts2','IP–LPA'],['Y:SG1:ts4','LPB–GEN']],[['Y:SG1','ω (pu)']]]:[[['Y:SG1:ts3','LPA–LPB'],['Y:SG1:ts5','GEN–EXC']],[['Y:SG1:te','T_e (pu)']],[['I:SG1','i_a γεννήτριας'],['V:Ca','v του πυκνωτή']]];
   return project(comps,wires,{version:4,sim:{hDiv:333,speed:2,stopT:S1?4:+(tf+0.5).toFixed(4)},scope:{panes,window:{unit:'s',n:S1?4:0.5}},meta:{case:S1?'1S':'1T',tf,Xc,P0}});}});
 // 4.8.1: a generator on an infinite bus with its controls (AVR ST1A/DC1A, PSS, governor with steam or hydro turbine;
 // Kundur ch. 8–9). Typical round-rotor data of the part, 100 MVA, 13.8 kV, 50 Hz; transformer X_T = 0.15 and two lines
 // X = 0.5 and 0.93 pu to an infinite bus; P = 0.9, Q = 0.436 pu at |V| = 1 (E_B = 0.90081 pu), a classic study case.
 function smibPoint(P,Q,Xeq){const Ir=P,Ii=-Q,Er=1+Xeq*Ii,Ei=-Xeq*Ir;return {EB:Math.hypot(Er,Ei),th:-Math.atan2(Ei,Er)*180/Math.PI};}
 function genCtl(o){const Un=13.8e3,Sb=100e6,f=50,c={conn:'bus'},XT=0.15,X1=0.5,X2=0.93,P=0.9,Q=0.436,op=smibPoint(P,Q,XT+X1*X2/(X1+X2));
  const avr=o.ctl!=='none',pss=o.ctl==='avr_pss'||o.ctl==='full',gov=o.gov&&o.gov!=='none';
  const L=(id,x,y,xx,lbl)=>C(id,'LINE3',x,y,{unit:'pu',Un,Sb,f,R1:0,X1:xx,B1:0,z0:'same',...c},{label:lbl});
  const comps=[C('SG1','GEN3',140,300,{Sn:Sb,Un,f,pp:1,V0:1,ang0:+op.th.toFixed(6),H:3.5,D:0,exc:avr?'sig':'init',mech:gov?'sig':'init',...c},{label:'γεννήτρια'}),
   L('TR1',320,300,XT,'μετασχηματιστής X_T'),J('HT',460,300),L('LN1',640,240,X1,'γραμμή 1'),J('INF',820,300),
   J('FP',600,400),L('LN2',700,400,X2,'γραμμή 2'),
   C('NET','GRID3',960,300,{Un,f,phase:0,cf:+op.EB.toFixed(8),emf:'c',Sk:1e13,XR:10,z0:'ratio',Z0Z1:1,XR0:10,...c},{flip:true,label:'άπειρος ζυγός'})];
  const wires=[['SG1:abc','TR1:abc1'],['TR1:abc2','HT'],['HT','LN1:abc1'],['LN1:abc2','INF'],['FP','LN2:abc1'],['INF','NET:abc']];
  // the breakers of line 2 only with the fault: a breaker opens at the current zeros (two thyristors per pole), whose
  // commutations every half cycle leave a ripple of the order of h in the steady state
  if(o.ev==='fault'){comps.push(C('CB2','CB3',520,400,{cmd:'0:1, 1.07:0',...c},{label:'CB γραμμής 2'}),C('CB3','CB3',780,400,{cmd:'0:1, 1.07:0',...c},{label:'CB'}),
    C('F1','FLT3',600,520,{kind:'abcg',ton:1,toff:1.2,Rf:0,Rg:0,...c},{lbl:'below',label:'σφάλμα στη γραμμή 2'}));
   wires.push(['HT','CB2:abc1'],['CB2:abc2','FP'],['LN2:abc2','CB3:abc1'],['CB3:abc2','INF'],['FP','F1:abc']);}
  else wires.push(['HT','FP'],['LN2:abc2','INF']);
  if(avr){comps.push(C('AV1','AVR',140,60,{type:o.ctl==='dc1a'?'dc1a':'st1a',dV:o.ev==='vref'?'0:0, 1:0.05':'0',...(o.ctl==='tgr'?{TC:1,TB:10}:{})},{label:'AVR'}));
   wires.push(['SG1:vt','AV1:vt'],['SG1:v0','AV1:v0'],['SG1:e0','AV1:e0'],['SG1:ifd','AV1:ifd'],['AV1:efd','SG1:efd']);
   if(pss){comps.push(C('PS1','PSS',-60,60,{},{label:'PSS'}));wires.push(['SG1:w','PS1:w'],['PS1:vs','AV1:vs']);}}
  if(gov){comps.push(C('GV1','GOV',340,60,{type:o.gov,dP:o.ev==='load'?'0:0, 1:0.05':'0'},{label:o.gov==='hydro'?'ρυθμιστής (νερό)':'ρυθμιστής (ατμός)'}));
   wires.push(['SG1:w','GV1:w'],['SG1:m0','GV1:m0'],['GV1:tm','SG1:tm']);}
  const panes=[[['Y:SG1:d','δ (°)']],[['Y:SG1:pe','P_e'],['Y:SG1:qe','Q_e']],[['Y:SG1:vt','|V| (pu)']],[avr?['Y:AV1/EFD','E_fd']:['Y:SG1:ifd','i_fd']],[['Y:SG1','ω (pu)'],...(gov?[['Y:GV1/PM','P_m']]:[])]];
  const watch={tiles:[...(avr?[{ctl:'AV1.dV',label:'ΔV_ref',at:[100,-150],rng:[-0.1,0.1],steps:['-0.02','+0.02','=0']}]:[]),...(gov?[{ctl:'GV1.dP',label:'ΔP_ref',at:[340,-150],rng:[-0.3,0.3],steps:['-0.05','+0.05','=0']}]:[]),
   ['Y:SG1:d','δ (°)'],['Y:SG1:pe','P_e'],['Y:SG1:vt','|V|'],...(avr?[['Y:AV1/EFD','E_fd']]:[]),...(pss?[['Y:PS1/VS','v_s']]:[]),...(gov?[['Y:GV1/PM','P_m'],['Y:GV1/G','βαλβίδα / θυρόφραγμα']]:[]),['Y:SG1','ω']]};
  const T=o.ev==='load'&&o.gov==='steam'?30:o.ev==='load'?40:10;
  return project(comps,wires,{version:4,watch,sim:{hDiv:400,method:'TR',speed:25,stopT:T},scope:{panes,window:{unit:'s',n:T}},meta:{smib:{XT,X1,X2,P,Q,EB:op.EB,th:op.th},ctl:o.ctl,gov:o.gov,ev:o.ev}});}
 T.push({id:'gen_ctl',group:'Συστήματα ισχύος (4.8.1)',title:'Γεννήτρια με AVR, PSS και ρυθμιστή στροφών',theory:'formula',topology:'gen_ctl',
  options:[{k:'ctl',label:'Διέγερση',options:[['none','Σταθερή E_fd'],['avr','AVR ST1A (K_A = 200)'],['avr_pss','AVR ST1A και PSS'],['tgr','ST1A με μείωση μεταβατικού κέρδους (T_C = 1, T_B = 10)'],['dc1a','AVR DC1A (διεγέρτρια ΣΡ)']],def:'avr_pss'},
   {k:'gov',label:'Ρυθμιστής στροφών',options:[['none','Σταθερή T_m'],['steam','Ατμοστρόβιλος με αναθέρμανση'],['hydro','Υδροστρόβιλος']],def:'none'},
   {k:'ev',label:'Γεγονός',options:[['fault','Τριφασικό σφάλμα στη γραμμή 2 στο 1 s, απομονώνεται στα 70 ms'],['vref','Βήμα +5 % στο V_ref στο 1 s'],['load','Βήμα +0,05 pu στην αναφορά φορτίου στο 1 s'],['none','Καμία: η ισορροπία της ροής φορτίου']],def:'fault'}],
  desc:'Γεννήτρια 100 MVA (τυπικά δεδομένα στροβιλογεννήτριας) σε άπειρο ζυγό μέσω μετασχηματιστή και δύο γραμμών, με P = 0,9 και Q = 0,436 pu (E_B = 0,9008 pu, κλασική περίπτωση μελέτης ευστάθειας). Η διέγερση και ο ρυθμιστής στροφών είναι μπλοκ της βιβλιοθήκης «Δίκτυο» με τα μοντέλα του Kundur (κεφ. 8–9) και τα δείγματα δεδομένων του: ST1A ή DC1A, PSS, ατμοστρόβιλος με αναθέρμανση ή υδροστρόβιλος με αγωγό πτώσης. Όλα ξεκινούν από τη ροή φορτίου: η γεννήτρια δίνει τα E_fd, |V| και T_m της ισορροπίας (e0, v0, m0) και οι ελεγκτές δουλεύουν γύρω από αυτά.',
  tasks:['Σφάλμα με σταθερή E_fd: η γωνία δ ταλαντώνεται αργά με απόσβεση από τους αποσβεστήρες. Με AVR ST1A (K_A = 200) η τάση επανέρχεται γρήγορα αλλά η απόσβεση της ταλάντωσης χειροτερεύει.','Πρόσθεσε τον PSS: η ταλάντωση της δ σβήνει σε 1–2 κύκλους. Δες το v_s και την E_fd.','Βήμα στο V_ref: σύγκρινε ST1A, ST1A με μείωση μεταβατικού κέρδους και DC1A στον χρόνο ανόδου της |V| και στην E_fd.','Ρυθμιστής στροφών και βήμα φορτίου: με ατμό η ισχύς ανεβαίνει σε δύο χρόνους (θάλαμος ατμού και αναθερμαντήρας, T_RH = 7 s)· με νερό πρώτα πέφτει (μη ελάχιστης φάσης, T_W) και η μεταβατική στατικότητα κρατά τη ρύθμιση ευσταθή.','Άλλαξε ζωντανά τα ΔV_ref και ΔP_ref από τα πλακίδια.'],
  build(o){return genCtl(o);}});
 // IEEE 9-bus (WSCC) system in EMT, from its load flow (pcl.network.ieee9(), MATPOWER numbering; machines of Anderson & Fouad)
 const IEEE9_LF={1:[1.04,0],2:[1.025,9.280005],3:[1.025,4.664751],5:[1.012654,-3.687396],7:[1.015883,0.727536],9:[0.995631,-3.988805]};
 const IEEE9_GEN={G1:{Xd:0.1460,Xdp:0.0608,Xdpp:0.0608,Xq:0.0969,Xqp:0.0969,Xqpp:0.0969,Xl:0.0336,X0:0.0336,Td0p:8.96,Td0pp:0,Tq0p:0,Tq0pp:0,H:23.64},
  G2:{Xd:0.8958,Xdp:0.1198,Xdpp:0.1198,Xq:0.8645,Xqp:0.1969,Xqpp:0.1969,Xl:0.0521,X0:0.0521,Td0p:6.00,Td0pp:0,Tq0p:0.535,Tq0pp:0,H:6.40},
  G3:{Xd:1.3125,Xdp:0.1813,Xdpp:0.1813,Xq:1.2578,Xqp:0.25,Xqpp:0.25,Xl:0.0742,X0:0.0742,Td0p:5.89,Td0pp:0,Tq0p:0.600,Tq0pp:0,H:3.01}};
 // 4.17: the turbines at the ratings of Anderson & Fouad Table 2.1 (247.5, 192, 128 MVA) on the 100 MVA base of the data:
 // with P_r = 1 the valve of G2 (163 MW) was at its limit from the start and the case drifted (governors since 4.8.1)
 const IEEE9_PR={G1:2.475,G2:1.92,G3:1.28};
 // 4.17: the build of the IEEE 9 case as a function, so that the m-SSSC case (ieee9_sssc) can insert its arms (ext)
 // 4.21: the points of measurement of se_emt: id, bus, the pin of the branch at it, place, orientation; the branch of the load flow and
 // its end (all «from»)
 const IEEE9_PMU=[['PM1','B1','T41:abc2',720,840,{rot:3}],['PM2','B4','L54:abc2',780,640,{}],['PM3','B5','L65:abc2',1000,420,{rot:3}],['PM4','B3','T63:abc2',1210,160,{flip:true}],
  ['PM5','B6','L76:abc2',950,160,{flip:true}],['PM6','B7','L87:abc2',670,160,{flip:true}],['PM7','B8','T28:abc2',400,160,{flip:true}],['PM8','B8','L89:abc1',440,220,{rot:1}],['PM9','B9','L94:abc1',490,560,{}]];
 const IEEE9_PMU_BR={PM1:'br1',PM2:'br2',PM3:'br3',PM4:'br4',PM5:'br5',PM6:'br6',PM7:'br7',PM8:'br8',PM9:'br9'};
 function ieee9Build(o,ext){const F=o.ev==='fault'||o.ev==='full',cl=o.ev==='fault',Un=345e3,Sb=100e6,f=60,c={conn:'bus'},LF=o.lf||IEEE9_LF;   // 4.19.1: o.lf = another operating point (the optimal power flow)
   // the classical model of the example: E′ behind X′_d constant (X′_q = X′_d, very long T′_d0 and T′_q0)
   const GD=id=>cl?{...IEEE9_GEN[id],Xqp:IEEE9_GEN[id].Xdp,Xqpp:IEEE9_GEN[id].Xdp,Td0p:1000,Tq0p:1000}:IEEE9_GEN[id];
   const L=(id,x,y,r,xx,b,rot)=>C(id,'LINE3',x,y,{unit:'pu',Un,Sb,f,R1:r,X1:xx,B1:b,z0:'same',...c},{rot:rot||0,label:id});
   const avr=o.ctl&&o.ctl!=='none'&&!cl,pss=avr&&(o.ctl==='avr_pss'||o.ctl==='full'),gov=avr&&o.ctl==='full',xc={...(avr?{exc:'sig'}:{}),...(gov?{mech:'sig'}:{})};
   // 4.24 (decision 343): the exciter of the reference book on generator 2 only (an IEEE Type 1, here DC1A, with the data of the
   // Mag-A-Stat of its table of excitation systems), generators 1 and 3 with a constant E_fd, as in the study of the book
   const book=avr&&o.ctl==='book',xg=id=>book?(id==='G2'?{exc:'sig'}:{}):xc;
   const G=(id,bus,x,y)=>C(id,'GEN3',x,y,{Sn:Sb,Un,f,pp:1,data:'std',...GD(id),Ra:0,shaft:'one',D:0,V0:LF[bus][0],ang0:LF[bus][1],...xg(id),...c},{label:id+' (ζυγός '+bus+')'});
   const Ld=(id,bus,x,y,P,Q)=>{const V=LF[bus][0];return C(id,'LOAD3',x,y,{cn:'yn',Un,f,P:P/(V*V),Q:Q/(V*V),model:'z',...c},{label:id,lbl:'below'});};
   const comps=[G('G2',2,100,160),J('B2',220,160),L('T28',320,160,0,0.0625,0),J('B8',440,160),L('L87',580,160,0.0085,0.072,0.149),J('B7',720,160),L('L76',860,160,0.0119,0.1008,0.209),J('B6',1000,160),
    L('T63',1120,160,0,0.0586,0),J('B3',1220,160),C('G3','GEN3',1360,160,{Sn:Sb,Un,f,pp:1,data:'std',...GD('G3'),Ra:0,shaft:'one',D:0,V0:LF[3][0],ang0:LF[3][1],...xg('G3'),...c},{flip:true,label:'G3 (ζυγός 3)'}),
    Ld('LD7',7,720,280,100e6,35e6),L('L89',440,320,0.032,0.161,0.306,1),J('B9',440,480),Ld('LD9',9,320,600,125e6,50e6),L('L65',1000,320,0.039,0.17,0.358,1),J('B5',1000,480),Ld('LD5',5,1120,600,90e6,30e6),
    L('L94',580,560,0.01,0.085,0.176),J('B4',720,640),L('L54',860,560,0.017,0.092,0.158),L('T41',720,760,0,0.0576,0,1),J('B1',720,880),G('G1',1,560,880)];
   const wires=[['G2:abc','B2'],['B2','T28:abc1'],['T28:abc2','B8'],['B8','L87:abc1'],['L87:abc2','B7'],...(ext?[]:[['B7','L76:abc1']]),['L76:abc2','B6'],['B6','T63:abc1'],['T63:abc2','B3'],['B3','G3:abc'],
    ['B7','LD7:abc'],['B9','LD9:abc'],['B6','L65:abc1'],['L65:abc2','B5'],['B5','LD5:abc'],['B9','L94:abc1'],['L94:abc2','B4'],['B5','L54:abc1'],['L54:abc2','B4'],['B4','T41:abc1'],['T41:abc2','B1'],['B1','G1:abc']];
   if(F){comps.push(C('CB8','CB3',440,250,{cmd:'0:1, 0.183333:0',...c},{rot:1,label:'CB 8'}),J('FP',440,300),C('CB9','CB3',440,400,{cmd:'0:1, 0.183333:0',...c},{rot:1,label:'CB 9'}),C('F1','FLT3',540,300,{kind:'abcg',ton:0.1,Rf:0,Rg:0,...c},{lbl:'below'}));
    comps.find(q=>q.id==='L89').y=340;wires.push(['B8','CB8:abc1'],['CB8:abc2','FP'],['FP','F1:abc'],['FP','L89:abc1'],['L89:abc2','CB9:abc1'],['CB9:abc2','B9']);}
   else wires.push(['B8','L89:abc1'],['L89:abc2','B9']);
   // 4.19.1 (decision 220): instruments at two points for the tutorials of the load flow: the current of the line 8–7 with the voltage of
   // bus 8, and the current into the load of bus 5 with its voltage
   const mpanes=[];
   if(o.meter){let i=wires.findIndex(w=>w[0]==='B8'&&w[1]==='L87:abc1');wires.splice(i,1);
    {const [mL,mR]=busMeter(comps,wires,'M87',500,100,{i:'i_a γραμμής 8–7',v:'v_a ζυγού 8'});wires.push(['B8',mL],[mR,'L87:abc1']);}
    i=wires.findIndex(w=>w[0]==='B5'&&w[1]==='LD5:abc');wires.splice(i,1);
    {const [mL,mR]=busMeter(comps,wires,'M5',1180,480,{i:'i_a φορτίου 5',v:'v_a ζυγού 5'});wires.push(['B5',mL],[mR,'LD5:abc']);}
    mpanes.push([['Y:M87A','i_a γραμμής 8–7'],['Y:M5A','i_a φορτίου 5']],[['Y:M87V','v_a ζυγού 8'],['Y:M5V','v_a ζυγού 5']]);}
   // 4.21 (§87): a phasor measurement unit (PMU3) at the «from» end of every branch of the load flow (MATPOWER numbering), on the side
   // of the bus: the points of the tutorial of the state estimation from the EMT (B3 and G3 move 60 px right to make room)
   if(o.pmu){for(const q of comps)if(q.id==='B3'||q.id==='G3')q.x+=60;
    for(const [id,bus,pin,x,y,lo] of IEEE9_PMU){const i=wires.findIndex(w=>(w[0]===bus&&w[1]===pin)||(w[0]===pin&&w[1]===bus));wires.splice(i,1);
     comps.push(C(id,'PMU3',x,y,{f,np:1,...c},{label:id,lbl:'none',...lo}));wires.push([bus,id+':abc1'],[id+':abc2',pin]);}}
   // 4.8.1: AVR (and PSS, governor) next to each generator, from its steady state (e0, v0, m0)
   if(avr)for(const [g,x,y,hy] of [['G1',560,1000,true],['G2',100,40,false],['G3',1360,40,false]]){const n=g.slice(1);if(book&&g!=='G2')continue;
    comps.push(C('AV'+n,'AVR',x-150,y,book?{type:'dc1a',TR:0,KA:400,TA:0.05,KE:'-0.17',TE:0.95,KF:0.04,TF:1,VRMAX:3.5,VRMIN:-3.5,AEX:0.0039,BEX:1.555}:{type:'st1a'},{label:'AVR '+n}));wires.push([g+':vt','AV'+n+':vt'],[g+':v0','AV'+n+':v0'],[g+':e0','AV'+n+':e0'],[g+':ifd','AV'+n+':ifd'],['AV'+n+':efd',g+':efd']);
    if(pss){comps.push(C('PS'+n,'PSS',x-300,y,{},{label:'PSS '+n}));wires.push([g+':w','PS'+n+':w'],['PS'+n+':vs','AV'+n+':vs']);}
    if(gov){comps.push(C('GV'+n,'GOV',x+150,y,{type:hy?'hydro':'steam',Pr:IEEE9_PR[g]},{label:(hy?'ρυθμιστής (νερό) ':'ρυθμιστής (ατμός) ')+n}));wires.push([g+':w','GV'+n+':w'],[g+':m0','GV'+n+':m0'],['GV'+n+':tm',g+':tm']);}}
   const panes=[[['Y:G1:d','δ₁ (°)'],['Y:G2:d','δ₂ (°)'],['Y:G3:d','δ₃ (°)']],[['Y:G1:pe','P₁'],['Y:G2:pe','P₂'],['Y:G3:pe','P₃']],[['Y:G1','ω₁'],['Y:G2','ω₂'],['Y:G3','ω₃']],
    ...(avr?[book?[['Y:AV2/EFD','E_fd2']]:[['Y:AV1/EFD','E_fd1'],['Y:AV2/EFD','E_fd2'],['Y:AV3/EFD','E_fd3']],[['Y:G1:vt','|V₁|'],['Y:G2:vt','|V₂|'],['Y:G3:vt','|V₃|']]]:[]),...mpanes];
   const Tf=avr?5:2;
   if(ext){ext.add(comps,wires,panes);return project(comps,wires,{version:4,solve:{init:'ac'},sim:{hDiv:10,method:'TR',speed:0.05,stopT:ext.T},scope:{panes,window:{unit:'s',n:0.5}},meta:{lf:LF,fault:false,classical:false,ctl:o.ctl,...ext.meta}});}
   return project(comps,wires,{version:4,sim:{hDiv:400,...(avr?{method:'TR'}:{}),speed:F?(avr?10:5):2,stopT:F?Tf:0.5},scope:{panes,window:{unit:'s',n:F?Tf:0.5}},meta:{lf:LF,fault:F,classical:cl,ctl:avr?o.ctl:'none',...(ext?ext.meta:{})}});}
 T.push({id:'se_emt',group:'Ροή φορτίου και OPF (4.19.1)',title:'Εκτίμηση κατάστασης από μετρήσεις του EMT: φασιθέτες (PMU), SCADA και μέτρα ρεύματος',theory:'formula',topology:'se_emt',
  options:[{k:'plan',label:'Τι στέλνουν τα σημεία μέτρησης',options:[['pmu','Φασιθέτες τάσης και ρεύματος (PMU) από κάθε σημείο'],['scada','|V|, P και Q (SCADA) από κάθε σημείο'],
    ['mixed','SCADA, και ένας φασιθέτης τάσης (στον ζυγό 1)'],['current','|V|, P και |I| από κάθε σημείο, με τους φασιθέτες τάσης']],def:'pmu'},
   {k:'bad',label:'Λανθασμένη μέτρηση',options:[['none','Καμία'],['flow','Η μεγαλύτερη ροή P, 20σ πάνω (όχι με PMU)'],['phasor','Το φανταστικό μέρος του φασιθέτη τάσης με τη μεγαλύτερη τιμή, 20σ πάνω (όχι με SCADA)'],
    ['current','Το μεγαλύτερο |I|, 20σ πάνω (μόνο με |I|)']],def:'none'}],
  desc:'Το δίκτυο των 9 ζυγών σε EMT, από τη ροή φορτίου του (όπως το «IEEE 9 ζυγών σε EMT»), με μια μονάδα μέτρησης φασιθετών (PMU) στο άκρο «από» κάθε κλάδου, στην πλευρά του ζυγού. Κάθε μονάδα μετρά τις τρεις τάσεις και τα τρία ρεύματα και δίνει, στο τέλος κάθε περιόδου των 60 Hz, τον φασιθέτη θετικής ακολουθίας της τάσης και του ρεύματος όπως τον ορίζει το IEC/IEEE 60255-118-1: ενεργός τιμή, φάση ως προς cos(2πf₀t), με το t = 0 της προσομοίωσης ως αρχή δευτερολέπτου UTC. Όλες οι μονάδες έχουν τον ίδιο χρόνο αναφοράς, όπως με GPS. Οι πηγές του εργαλείου γράφονται με ημίτονο, άρα μια γωνία θ της ροής φορτίου φαίνεται στη μονάδα ως θ − 90°· το engine το ξέρει. Ο έλεγχος συμμόρφωσης με τις κλάσεις P και M του προτύπου δεν έχει γίνει. Η κάρτα στέλνει στο engine (pcl.se, στον τοπικό server) ό,τι δίνουν τα σημεία τη στιγμή που πατάς το κουμπί, και η εκτίμηση κατάστασης βρίσκει τις τάσεις των ζυγών· τις συγκρίνει με τη ροή φορτίου από την οποία ξεκίνησε το EMT.',
  tasks:['Τρέξε δύο περιόδους τουλάχιστον και πάτα «Εκτίμηση κατάστασης»: με PMU οι γωνίες είναι μετρημένες, άρα κανένας ζυγός δεν είναι αναφορά (18 άγνωστοι αντί για 17), και η εκτίμηση απέχει από τη ροή φορτίου όσο το EMT από αυτήν.',
   'Το TVE (ολικό διανυσματικό σφάλμα) των φασιθετών απέναντι στη ροή φορτίου είναι γραμμένο στην κάρτα: 2,06·10⁻⁵ στην τάση. Είναι σχεδόν όλο της μονάδας: ολοκληρώνει τις ευθείες ανάμεσα στα βήματα του λύτη, και με 400 βήματα ανά περίοδο ο φασιθέτης βγαίνει μικρότερος κατά (ωh)²/12. Το ίδιο το EMT απέχει από τη ροή φορτίου λιγότερο από 4·10⁻⁶ στις τάσεις.',
   '«SCADA»: χωρίς φασιθέτη, ο ζυγός ταλάντωσης γίνεται ξανά αναφορά. «Ένας φασιθέτης τάσης» φέρνει τις γωνίες στον κοινό χρόνο αναφοράς.',
   '«|I|»: το μέτρο του ρεύματος δεν λέει προς τα πού πηγαίνει η ισχύς· η εκτίμηση ξεκινά από τις γωνίες των φασιθετών τάσης, και όχι από επίπεδη αρχή.',
   'Λανθασμένη μέτρηση: ο έλεγχος του μεγαλύτερου κανονικοποιημένου υπολοίπου τη βρίσκει και τη βγάζει, όπως στο «Εκτίμηση κατάστασης» με μετρήσεις από τη ροή φορτίου.',
   '«Ένας φασιθέτης τάσης» με λάθος στον φασιθέτη: είναι η μόνη γωνία στον κοινό χρόνο αναφοράς, άρα το λάθος του γυρίζει όλες τις γωνίες (2,2°) και σχεδόν δεν φαίνεται (κανονικοποιημένο υπόλοιπο 0,31).'],
  build(o){const pr=ieee9Build({ev:'none',ctl:'none',pmu:true});
   pr.scope.panes=[[['Y:PM1/SV','|V⁺| ζυγός 1'],['Y:PM2/SV','|V⁺| ζυγός 4'],['Y:PM6/SV','|V⁺| ζυγός 7']],[['Y:PM1/TV','∠V⁺ ζυγός 1'],['Y:PM2/TV','∠V⁺ ζυγός 4'],['Y:PM6/TV','∠V⁺ ζυγός 7']],
    [['Y:PM1/PP','P⁺ κλάδος 1–4'],['Y:PM6/PP','P⁺ κλάδος 7–8'],['Y:PM8/PP','P⁺ κλάδος 8–9']]];
   pr.meta.study={net:'ieee9',study:'se',emt:{f:60,ref:'cos',plan:o.plan,bad:o.bad,points:IEEE9_PMU.map(q=>({id:q[0],branch:IEEE9_PMU_BR[q[0]],end:'f'}))},options:{}};
   pr.meta.pmu={plan:o.plan,bad:o.bad};return pr;}});
 T.push({id:'ieee9_emt',group:'Συστήματα ισχύος (4.3)',title:'IEEE 9 ζυγών σε EMT, από τη ροή φορτίου',theory:'formula',topology:'ieee9_emt',
  options:[{k:'ev',label:'Γεγονός',options:[['none','Καμία διαταραχή: η μόνιμη κατάσταση της ροής φορτίου'],['fault','Σφάλμα 5 κύκλων (A&F, Παρ. 2.7), μηχανές ως κλασικό μοντέλο'],['full','Το ίδιο σφάλμα με τα πλήρη δεδομένα']],def:'none'},
   {k:'ctl',label:'Έλεγχος γεννητριών (4.8.1)',options:[['none','Σταθερά E_fd και T_m'],['avr','AVR ST1A σε κάθε γεννήτρια'],['avr_pss','AVR ST1A και PSS'],['full','AVR, PSS και ρυθμιστές στροφών (G1 νερό, G2 και G3 ατμός)'],['book','AVR του βιβλίου αναφοράς μόνο στη G2 (IEEE Τύπος 1 ως DC1A, Mag-A-Stat), οι άλλες με σταθερή E_fd (4.24)']],def:'none'}],
  desc:'Το δίκτυο WSCC των 9 ζυγών (αρίθμηση του MATPOWER, 345 kV, 100 MVA, 60 Hz). Οι γεννήτριες έχουν τα δεδομένα του Anderson & Fouad (Πίν. 2.1) και ξεκινούν από την τάση |V|∠θ της ροής φορτίου του pcl.network· τα φορτία είναι σταθερές εμπεδήσεις ίσες με το φορτίο στην τάση της ροής φορτίου. Οι μετασχηματιστές είναι κλάδοι σε ανά μονάδα, όπως στη ροή φορτίου. Χωρίς διαταραχή το EMT μένει στη ροή φορτίου.',
  tasks:['Χωρίς διαταραχή: P, Q και δ των γεννητριών μένουν σταθερά· η κάρτα δείχνει τις τιμές της ροής φορτίου και του Anderson & Fouad.','Σφάλμα με κλασικό μοντέλο: η δ₂ − δ₁ ανεβαίνει περίπου 70° και επιστρέφει, όπως στο Σχ. 2.22 του Anderson & Fouad (85° από 17,5°).','Με τα πλήρη δεδομένα και σταθερή E_fd οι γεννήτριες 2 και 3 χάνουν τον συγχρονισμό: η ροή του άξονα q σβήνει γρήγορα (T′_q0 ≈ 0,5 s) και χωρίς AVR η E_fd δεν βοηθά.','Με τα πλήρη δεδομένα και «AVR ST1A σε κάθε γεννήτρια» (4.8.1) οι γεννήτριες μένουν σε συγχρονισμό: η E_fd ανεβαίνει στο όριο κατά το σφάλμα και κρατά τη ροή. Με PSS και ρυθμιστές στροφών σβήνουν και οι ταλαντώσεις. Με κλασικό μοντέλο ο έλεγχος δεν εφαρμόζεται (σταθερή E′).'],
  build(o){return ieee9Build(o);}});
 // 5.1.2 (ROADMAP §101 step 1, THEORY §8ΩΧ): the two-area system of Example 12.6 of Power System Stability and Control in EMT, from its load
 // flow (pcl.network case 'two_area', the data of pcl/data/two_area.json), as the IEEE 9 case above: 230 kV, 100 MVA, 60 Hz, the step-up
 // transformers branches in per unit (j0,15 on 900 MVA), each line one π section (r, x, b per km of the example), the loads and the shunt
 // capacitors of buses 7 and 9 constant impedances at the voltage of the load flow. TWO_AREA_LF: |V|, θ (°) of Network.power_flow() of the
 // case (tests/test_two_area_emt.py checks them). The units of the example (pcl.rms.TWO_AREA_UNIT, without its saturation: the GEN3 has none)
 // with the excitation of part (b) of the example (pcl.rms.TWO_AREA_EXCITATION, with the limits of the defaults: its thyristor exciter has
 // no K_C and no field current limiter); its self-excited DC exciter (V_X of (8.21)) is not in the EMT
 const TWO_AREA_LF={1:[1.03,20.270160],2:[1.01,10.505862],3:[1.03,-6.8],4:[1.01,-16.991934],5:[1.006458,13.808299],6:[0.978134,3.723760],7:[0.961021,-4.685333],
  8:[0.948618,-18.555131],9:[0.971373,-32.152282],10:[0.983465,-23.737102],11:[1.008258,-13.426987]};
 const TWO_AREA_P={G1:700,G2:700,G3:719.09,G4:700};
 function twoAreaBuild(o){const Un=230e3,Sb=100e6,f=60,c={conn:'bus'},LF=TWO_AREA_LF,exc=o.exc||'manual',ev=o.ev||'none',avr=exc!=='manual',pss=exc==='pss';
  const L=(id,x,y,km,rot,lbl)=>C(id,'LINE3',x,y,{unit:'pu',Un,Sb,f,R1:+(0.0001*km).toFixed(6),X1:+(0.001*km).toFixed(6),B1:+(0.00175*km).toFixed(6),z0:'same',...c},{rot:rot||0,label:lbl||id});
  const T=(id,x,y,rot)=>C(id,'LINE3',x,y,{unit:'pu',Un,Sb,f,R1:0,X1:+(0.15/9).toFixed(9),B1:0,z0:'same',...c},{rot:rot||0,label:id});
  const G=(id,bus,x,y,H,flip)=>C(id,'GEN3',x,y,{Sn:900e6,Un,f,pp:1,data:'std',Xd:1.8,Xdp:0.3,Xdpp:0.25,Xq:1.7,Xqp:0.55,Xqpp:0.25,Xl:0.2,X0:0.2,Td0p:8,Td0pp:0.03,Tq0p:0.4,Tq0pp:0.05,
   Ra:0.0025,shaft:'one',H,D:0,V0:LF[bus][0],ang0:LF[bus][1],...(avr?{exc:'sig'}:{}),...c},{flip:!!flip,label:id+' (ζυγός '+bus+')'});
  const Ld=(id,bus,x,y,P,Q,lbl)=>{const V=LF[bus][0];return C(id,'LOAD3',x,y,{cn:'yn',Un,f,P:+(P/(V*V)).toFixed(3),Q:+(Q/(V*V)).toFixed(3),model:'z',...c},{label:lbl||id,lbl:'below'});};
  const Cp=(id,x,y,Q,lbl)=>C(id,'LOAD3',x,y,{cn:'yn',Un,f,P:0,Q:-Q,model:'z',...c},{label:lbl,lbl:'below'});
  const comps=[G('G1',1,80,200,6.5),J('B1',200,200),T('T1',300,200),J('B5',420,200),L('L56',540,200,25,0,'L5-6'),J('B6',660,200),L('L67',780,200,10,0,'L6-7'),J('B7',900,200),
   L('L78a',1080,110,110,0,'L7-8 (1)'),L('L78b',1080,290,110,0,'L7-8 (2)'),J('B8',1260,200),L('L89a',1420,110,110,0,'L8-9 (1)'),L('L89b',1420,290,110,0,'L8-9 (2)'),J('B9',1580,200),
   L('L910',1700,200,10,0,'L9-10'),J('B10',1820,200),L('L1011',1940,200,25,0,'L10-11'),J('B11',2060,200),T('T3',2160,200),J('B3',2280,200),G('G3',3,2400,200,6.175,true),
   T('T2',660,320,1),J('B2',660,440),G('G2',2,540,440,6.5),T('T4',1820,320,1),J('B4',1820,440),G('G4',4,1940,440,6.175,true),
   Ld('LD7',7,860,400,967e6,100e6,'φορτίο 7'),Cp('C7',960,400,200e6,'C 7'),Ld('LD9',9,1520,400,1767e6,100e6,'φορτίο 9'),Cp('C9',1640,400,350e6,'C 9')];
  const wires=[['G1:abc','B1'],['B1','T1:abc1'],['T1:abc2','B5'],['B5','L56:abc1'],['L56:abc2','B6'],['B6','L67:abc1'],['L67:abc2','B7'],['B7','L78a:abc1'],['L78a:abc2','B8'],
   ['B8','L89a:abc1'],['L89a:abc2','B9'],['B8','L89b:abc1'],['L89b:abc2','B9'],['B9','L910:abc1'],['L910:abc2','B10'],['B10','L1011:abc1'],['L1011:abc2','B11'],['B11','T3:abc1'],['T3:abc2','B3'],['B3','G3:abc'],
   ['B6','T2:abc1'],['T2:abc2','B2'],['B2','G2:abc'],['B10','T4:abc1'],['T4:abc2','B4'],['B4','G4:abc'],['B7','LD7:abc'],['B7','C7:abc'],['B9','LD9:abc'],['B9','C9:abc']];
  // the events: a three-phase fault on bus 8 from 1 s to 1,1 s (it clears at the zeros of its currents); a pulse of 10 MW on bus 9 for 0,1 s (a
  // load behind a breaker); the opening of circuit 2 of 7–8 at 1 s (a breaker at each end)
  if(ev==='trip'){comps.find(q=>q.id==='L78b').x=1080;comps.push(C('CB7','CB3',980,290,{cmd:'0:1, 1:0',...c},{label:'CB 7'}),C('CB8','CB3',1180,290,{cmd:'0:1, 1:0',...c},{label:'CB 8'}));
   wires.push(['B7','CB7:abc1'],['CB7:abc2','L78b:abc1'],['L78b:abc2','CB8:abc1'],['CB8:abc2','B8']);}
  else wires.push(['B7','L78b:abc1'],['L78b:abc2','B8']);
  if(ev==='fault'){comps.push(C('F8','FLT3',1260,400,{kind:'abcg',ton:1,toff:1.1,Rf:0,Rg:0,...c},{lbl:'below',label:'σφάλμα στον ζυγό 8'}));wires.push(['B8','F8:abc']);}
  if(ev==='pulse'){comps.push(C('CBP','CB3',1480,520,{cmd:'0:0, 1:1, 1.1:0',...c},{rot:1,label:'CB φορτίου'}),J('BP',1480,600),C('LDP','LOAD3',1480,680,{cn:'yn',Un,f,P:10e6,Q:0,model:'z',...c},{label:'10 MW',lbl:'below'}));
   wires.push(['B9','CBP:abc1'],['CBP:abc2','BP'],['BP','LDP:abc']);}
  // the excitation of part (b): the thyristor exciter of high gain (ST1A with K_A 200, T_R 0,01 s, without K_C and K_LR), with the transient
  // gain reduction T_C/T_B = 1/10, or with the stabilizer of Fig. E12.9
  const AV={type:'st1a',KA:200,TR:0.01,KC:0,KLR:0,...(exc==='tgr'?{TC:1,TB:10}:{})},PS={KS:20,TW:10,T1:0.05,T2:0.02,T3:3,T4:5.4};
  if(avr)for(const [g,x,y] of [['G1',80,60],['G2',540,580],['G3',2400,60],['G4',1940,580]]){const n=g.slice(1);
   comps.push(C('AV'+n,'AVR',x-150,y,AV,{label:'AVR '+n}));wires.push([g+':vt','AV'+n+':vt'],[g+':v0','AV'+n+':v0'],[g+':e0','AV'+n+':e0'],[g+':ifd','AV'+n+':ifd'],['AV'+n+':efd',g+':efd']);
   if(pss){comps.push(C('PS'+n,'PSS',x-300,y,PS,{label:'PSS '+n}));wires.push([g+':w','PS'+n+':w'],['PS'+n+':vs','AV'+n+':vs']);}}
  const G4=['G1','G2','G3','G4'],sub=['₁','₂','₃','₄'],panes=[G4.map((g,i)=>['Y:'+g+':d','δ'+sub[i]+' (°)']),G4.map((g,i)=>['Y:'+g+':pe','P'+sub[i]]),G4.map((g,i)=>['Y:'+g,'ω'+sub[i]]),
   ...(avr?[G4.map((g,i)=>['Y:AV'+(i+1)+'/EFD','E_fd'+sub[i]])]:[]),G4.map((g,i)=>['Y:'+g+':vt','|V'+sub[i]+'|'])];
  const Tf=ev==='none'?1:10;
  return project(comps,wires,{version:4,sim:{hDiv:+(o.hdiv||100),method:'TR',speed:ev==='none'?2:10,stopT:Tf},scope:{panes,window:{unit:'s',n:Tf}},meta:{lf:LF,P:TWO_AREA_P,exc,ev}});}
 T.push({id:'two_area_emt',group:'Συστήματα ισχύος (5.1.2)',title:'Σύστημα δύο περιοχών (Παράδειγμα 12.6) σε EMT, από τη ροή φορτίου',theory:'formula',topology:'two_area_emt',
  options:[{k:'exc',label:'Διέγερση',options:[['manual','Σταθερή E_fd'],['thyristor','Θυριστορικός διεγέρτης, K_A = 200'],['tgr','Θυριστορικός με μείωση μεταβατικού κέρδους (T_C = 1, T_B = 10)'],['pss','Θυριστορικός και PSS']],def:'pss'},
   {k:'ev',label:'Γεγονός',options:[['none','Καμία διαταραχή: η μόνιμη κατάσταση της ροής φορτίου'],['fault','Τριφασικό σφάλμα στον ζυγό 8 στο 1 s, για 0,1 s'],['pulse','Παλμός φορτίου 10 MW στον ζυγό 9 στο 1 s, για 0,1 s'],['trip','Άνοιγμα του κυκλώματος 2 της 7–8 στο 1 s']],def:'fault'}],
  desc:'Το σύστημα δύο περιοχών του Παραδείγματος 12.6 του «Power System Stability and Control» (το δίκτυο δοκιμής two_area): δύο όμοιες περιοχές με δύο μονάδες των 900 MVA η καθεμία, ενωμένες με δύο κυκλώματα των 2 × 110 km ανάμεσα στους ζυγούς 7, 8 και 9 (230 kV, 100 MVA, 60 Hz)· η περιοχή 1 στέλνει περίπου 400 MW στην 2. Οι μονάδες ξεκινούν από την τάση |V|∠θ της ροής φορτίου του pcl.network, με τα δεδομένα του παραδείγματος (pcl.rms.TWO_AREA_UNIT) χωρίς τον κορεσμό του. Οι μετασχηματιστές ανύψωσης είναι κλάδοι σε ανά μονάδα, κάθε γραμμή ένα τμήμα π, τα φορτία και οι πυκνωτές των ζυγών 7 και 9 σταθερές εμπεδήσεις στην τάση της ροής φορτίου. Οι διεγέρσεις είναι του μέρους (b) του παραδείγματος, με τα όρια των προεπιλογών: θυριστορικός διεγέρτης με K_A = 200, με μείωση του μεταβατικού κέρδους, ή με PSS. Το βήμα είναι 1/(100·60) s: η δ₁ − δ₃ του σφάλματος απέχει 0,008° από αυτήν με 1/(400·60) s. Η κάρτα «Δυναμική RMS» λύνει το ίδιο σχέδιο σε φασιθέτες και δίνει τους ηλεκτρομηχανικούς τρόπους στην αρχή.',
  tasks:['Χωρίς διαταραχή: το EMT μένει στη ροή φορτίου· η κάρτα θεωρίας δείχνει |V| και P των μονάδων απέναντι σε αυτήν.','Σφάλμα με PSS: η δ₁ − δ₃ ανεβαίνει από 25,95° στις 30,84° (στα 1,50 s) και η ταλάντωση σβήνει. Τρέξε την κάρτα «Δυναμική RMS» στο ίδιο σχέδιο: 30,62°, και σε 10 s οι δύο απέχουν ως 0,26°.','Θυριστορικός διεγέρτης χωρίς PSS: ο διαπεριοχικός τρόπος (οι G1, G2 απέναντι στις G3, G4) είναι ασταθής και μετά το σφάλμα η ταλάντωση μεγαλώνει· με τη μείωση του μεταβατικού κέρδους ακόμη πιο γρήγορα. Στην κάρτα RMS οι ιδιοτιμές στην αρχή έχουν σ > 0.','Παλμός φορτίου με σταθερή E_fd: ο διαπεριοχικός τρόπος στα 0,544 Hz στο EMT, στα 0,543 Hz στις ιδιοτιμές της κάρτας. Η απόσβεση διαφέρει (σ −0,111/s στο EMT, −0,092/s στο RMS)· η διαφορά είναι γραμμένη στο THEORY §8ΩΧ.','Άνοιγμα του κυκλώματος 2 της 7–8: η σύνδεση γίνεται πιο ασθενής και η γωνία ανεβαίνει (με PSS ως 52,9°). Χωρίς ρυθμιστές στροφών η συχνότητα ανεβαίνει, γιατί οι μονάδες δίνουν λιγότερη ισχύ από την T_m τους· με σταθερή E_fd το EMT χάνει τον συγχρονισμό στα 16,5 s, ενώ το RMS, με το δίκτυο στα 60 Hz, όχι.'],
  build(o){return twoAreaBuild(o);}});

 // 5.0.4 (ROADMAP §96 B.2, CIGRE TB 39 §5.1, Fig. 15): the area of buses 1 and 4 of the IEEE 9 case in EMT, the rest of the network as one
 // EQV3 at the boundary buses 5 and 9, or the whole network for the comparison. IEEE9_EQ: pcl.equivalent.emt_ports(ieee9 at 60 Hz, ['5', '9'],
 // internal ['1'], machines IEEE9_MACHINES, fig) per figure (tests/test_equivalent.py checks it); IEEE9_EQ_REF: the first peak and the rms of
 // the second cycle of i_a of the fault at bus 4 in the whole network (the option «Όλο το δίκτυο» of this tutorial, the same test)
 const IEEE9_EQ={"50":{"E":"1.141278402; 1.129339453","ang":"9.444863467; 11.38399072","R1":"0.06002104445, 0.01051869275; 0.01051869275, 0.04931310297","X1":"0.3368968384, 0.08353049215; 0.08353049215, 0.3037516904","R0":"0.04909550594, 0.002647056836; 0.002647056836, 0.04051827686","X0":"0.2755357295, 0.04010733982; 0.04010733982, 0.2549396064","Rs":"0.0; 0.0","C":"0.0; 0.0","Sk":[299667935.9,322128300.3]},"15b":{"E":"0.9860360159; 0.9939866148","ang":"15.45792084; 16.72532955","R1":"0.05137711445, 0.006704954436; 0.006704954436, 0.04329491252","X1":"0.3087234779, 0.0687552007; 0.0687552007, 0.2827520774","R0":"0.04414490141, 0.00160047649; 0.00160047649, 0.03712979821","X0":"0.2595184343, 0.03459117107; 0.03459117107, 0.2427333749","Rs":"820.2025922; 863.3570007","C":"1.182296322e-06; 1.095325352e-06","Sk":[327657927.6,346544094.2]},"15c":{"E":"1.171935799; 1.167370905","ang":"3.035658261; 5.154436611","R1":"0.05137711445, 0.006704954436; 0.006704954436, 0.04329491252","X1":"0.3087234779, 0.0687552007; 0.0687552007, 0.2827520774","R0":"0.04414490141, 0.00160047649; 0.00160047649, 0.03712979821","X0":"0.2595184343, 0.03459117107; 0.03459117107, 0.2427333749","Rs":"820.2025922; 863.3570007","C":"1.182296322e-06; 1.095325352e-06","Sk":[327657927.6,346544094.2]}};
 const IEEE9_EQ_REF={abcg:{pk:5932.0867,rms:3146.1649},ag:{pk:6435.5156,rms:3396.5181}};
 T.push({id:'ieee9_eq',group:'Συστήματα ισχύος (4.3)',title:'Το υπόλοιπο δίκτυο ως ισοδύναμο σε EMT (CIGRE TB 39, Σχ. 15): η περιοχή του ζυγού 4 στο IEEE 9',theory:'formula',topology:'ieee9_eq',
  options:[{k:'net',label:'Δίκτυο',options:[['eq','Η περιοχή των ζυγών 1 και 4, με το υπόλοιπο δίκτυο ως ισοδύναμο στους ζυγούς 5 και 9'],['full','Όλο το δίκτυο, για σύγκριση']],def:'eq'},
   {k:'fig',label:'Κύκλωμα του ισοδυνάμου',options:[['50','Πηγές πίσω από R + L θετικής και μηδενικής ακολουθίας (ακριβές στη θεμελιώδη)'],['15b','Σχ. 15b: και R_s σε σειρά με C σε κάθε ζυγό'],['15c','Σχ. 15c: R_s παράλληλα με το R + L']],def:'50'},
   {k:'fault',label:'Σφάλμα στον ζυγό 4 (50 ms, 5 κύκλοι)',options:[['abcg','Τριφασικό προς γη'],['ag','Μονοφασικό a–γη'],['none','Χωρίς σφάλμα: η μόνιμη κατάσταση της ροής φορτίου']],def:'abcg'}],
  desc:'Το IEEE 9 σε EMT (όπως το «IEEE 9 ζυγών σε EMT»), όπου κρατιούνται μόνο η γεννήτρια 1, ο μετασχηματιστής της, ο ζυγός 4 και οι γραμμές του ως τους ζυγούς 5 και 9 με τα φορτία τους. Το υπόλοιπο δίκτυο (γεννήτριες 2 και 3, ζυγοί 6, 7, 8) είναι ένα «Ισοδύναμο δικτύου πολλών θυρών»: σε κάθε ζυγό του συνόρου μια πηγή θετικής ακολουθίας πίσω από τις εμπεδήσεις θετικής και μηδενικής ακολουθίας, συζευγμένες ανάμεσα στους δύο ζυγούς, όπως στο Σχ. 15 του CIGRE TB 39. Τα δεδομένα του βγαίνουν από τη ροή φορτίου (pcl.network, net.to_emt(…, boundary=[\'5\', \'9\'], internal=[\'1\'])): το βασικό σημείο είναι ακριβές, και οι εξωτερικές γεννήτριες είναι σταθερές πηγές πίσω από τη X″d τους.',
  tasks:['Χωρίς σφάλμα: η γεννήτρια 1 μένει στο P και στο Q της ροής φορτίου, με το ισοδύναμο όπως και με όλο το δίκτυο.','Τριφασικό σφάλμα: η κάρτα δίνει την πρώτη κορυφή και την ενεργό τιμή του δεύτερου κύκλου του i_a, απέναντι στο πλήρες δίκτυο. Στο κύκλωμα των 50/60 Hz απέχουν κάτω από 2 %: στους πρώτους κύκλους οι μηχανές είναι πράγματι σταθερές πηγές πίσω από τη X″d.','Μονοφασικό σφάλμα: περνά και η μηδενική ακολουθία του ισοδυνάμου.','Σχ. 15b: η R_s (η κυματική αντίσταση της γραμμής που φτάνει στον ζυγό) με τη C του υπόλοιπου δικτύου δίνουν τη χωρητική συμπεριφορά στις υψηλότερες συχνότητες· η E αλλάζει ώστε το βασικό σημείο να μένει ίδιο.','Σχ. 15c: για μεγάλη ισχύ βραχυκύκλωσης· εδώ, με ~300 MVA ανά ζυγό, η R_s παράλληλα μικραίνει την εμπέδηση και το ρεύμα βγαίνει μερικά % μεγαλύτερο από το πλήρες δίκτυο.','Τι μένει αναλυτικά: για χειρισμούς το TB προτείνει το δίκτυο ως τον δεύτερο υποσταθμό πίσω από τον διακόπτη, για ενεργοποίηση γραμμής ως τον πρώτο.'],
  build(o){const f=60,Sb=100e6,Un=345e3,c={conn:'bus'},t0=0.05,t1=+(t0+5/f).toFixed(6),flt=o.fault!=='none';let pr;
   if(o.net==='full')pr=ieee9Build({ev:'none',ctl:'none'});
   else{const LF=IEEE9_LF,L=(id,x,y,r,xx,b,rot)=>C(id,'LINE3',x,y,{unit:'pu',Un,Sb,f,R1:r,X1:xx,B1:b,z0:'same',...c},{rot:rot||0,label:id});
    const Ld=(id,bus,x,y,P,Q)=>{const V=LF[bus][0];return C(id,'LOAD3',x,y,{cn:'yn',Un,f,P:P/(V*V),Q:Q/(V*V),model:'z',...c},{label:id,lbl:'below'});};
    const q=IEEE9_EQ[o.fig]||IEEE9_EQ['50'];
    const comps=[J('B9',440,480),Ld('LD9',9,320,600,125e6,50e6),J('B5',1000,480),Ld('LD5',5,1120,600,90e6,30e6),L('L94',580,560,0.01,0.085,0.176),J('B4',720,640),L('L54',860,560,0.017,0.092,0.158),
     L('T41',720,760,0,0.0576,0,1),J('B1',720,880),C('G1','GEN3',560,880,{Sn:Sb,Un,f,pp:1,data:'std',...IEEE9_GEN.G1,Ra:0,shaft:'one',D:0,V0:LF[1][0],ang0:LF[1][1],...c},{label:'G1 (ζυγός 1)'}),
     C('EQ1','EQV3',720,330,{names:'5; 9',f,Sb,Un:'345e3; 345e3',E:q.E,ang:q.ang,R1:q.R1,X1:q.X1,R0:q.R0,X0:q.X0,fig:o.fig||'50',Rs:q.Rs,C:q.C,...c},{label:'υπόλοιπο δίκτυο'})];
    const wires=[['B9','LD9:abc'],['B5','LD5:abc'],['B9','L94:abc1'],['L94:abc2','B4'],['B5','L54:abc1'],['L54:abc2','B4'],['B4','T41:abc1'],['T41:abc2','B1'],['B1','G1:abc'],
     ['EQ1:abc1','B5',[[1000,330]]],['EQ1:abc2','B9',[[800,390],[800,440],[440,440]]]];
    pr=project(comps,wires,{version:4,sim:{hDiv:400,speed:2,stopT:0.25},scope:{panes:[],window:{unit:'s',n:0.25}},meta:{lf:LF}});}
   if(flt){pr.components.push(C('F1','FLT3',860,740,{kind:o.fault,ton:t0,toff:t1,Rf:0,Rg:0,...c},{lbl:'below',label:'σφάλμα στον ζυγό 4'}));
    pr.wires.push({id:'w'+(pr.wires.length+1),a:{c:'B4',p:'j'},b:{c:'F1',p:'abc'},pts:[[860,640]]});}
   pr.sim={...pr.sim,hDiv:400,speed:2,stopT:0.25};
   pr.scope={panes:[...(flt?[[['Y:F1/Ia','i_a σφάλματος'],['Y:F1/Ib','i_b σφάλματος'],['Y:F1/Ic','i_c σφάλματος']]]:[]),[['Y:G1:pe','P₁'],['Y:G1:qe','Q₁']],[['Y:G1','ω₁']]],window:{unit:'s',n:0.25}};
   pr.meta={...pr.meta,eq:{net:o.net,fig:o.fig||'50',fault:o.fault,t0,f,ports:['5','9'].map((b,k)=>({bus:b,Sk:(IEEE9_EQ[o.fig]||IEEE9_EQ['50']).Sk[k]})),ref:IEEE9_EQ_REF}};
   return pr;}});

 // 4.19.3 (ROADMAP §68, decision 264): a large network in the time domain, to see and to measure the linear solver. A k × k
 // mesh of 150 kV buses, like a sub-transmission network: a π section of about 30 km between neighbours (0,13 Ω/km,
 // 0,4 Ω/km, 9 nF/km), a load of about 10 MW on every bus, an infeed from the transmission grid (a grid equivalent, 5 GVA)
 // every fourth bus in each direction, and a three-phase fault in the middle that clears by itself. Every part of the
 // mesh is fed from near, so the voltages stay close to 1 pu at any size; only the linear algebra grows with k.
 // bigGrid(k, ev) is also what the measurements and the checks use (tests/js/big_cases.js, tools/verify.py)
 function bigGrid(k,ev,lm){const Un=150e3,Sb=100e6,f=50,c={conn:'bus'},dx=200,dy=200,x0=260,y0=160,comps=[],wires=[],tl=lm==='tl';
   const B=(r,q)=>'B'+r+'_'+q,X=q=>x0+q*dx,Y=r=>y0+r*dy,quiet={label:'',lbl:'none'};
   // loads and line lengths vary a little from place to place (a fixed rule, no random numbers), so that no two buses are alike
   const w=(r,q)=>1+0.3*Math.sin(1.7*r+0.9*q),line=(id,x,y,s,rot)=>C(id,'LINE3',x,y,{unit:'pu',Un,Sb,f,R1:+(0.0173*s).toFixed(6),X1:+(0.0533*s).toFixed(6),B1:+(0.0191*s).toFixed(6),z0:'same',...(tl?{model:'tl'}:{}),...c},{rot:rot||0,...quiet});
   const grid={Un,f,Sk:5e9,XR:10,cf:1,z0:'ratio',Z0Z1:1.5,XR0:5,...c};let ng=0;
   // around a bus: the line to the right, the line below, the load below and to the right, an infeed above and to the left;
   // the many lines and loads carry no text in the drawing (their values are in their panels)
   for(let r=0;r<k;r++)for(let q=0;q<k;q++){comps.push(J(B(r,q),X(q),Y(r)));
    comps.push(C('LD'+r+'_'+q,'LOAD3',X(q)+60,Y(r)+80,{cn:'yn',Un,f,P:+(10e6*w(r,q)).toFixed(0),Q:+(3e6*w(r,q)).toFixed(0),model:'z',...c},quiet));wires.push([B(r,q),'LD'+r+'_'+q+':abc',[[X(q)+60,Y(r)]]]);
    if(q<k-1){const id='H'+r+'_'+q;comps.push(line(id,X(q)+dx/2,Y(r),w(q,r)));wires.push([B(r,q),id+':abc1'],[id+':abc2',B(r,q+1)]);}
    if(r<k-1){const id='V'+r+'_'+q;comps.push(line(id,X(q),Y(r)+dy/2,w(q+1,r+2),1));wires.push([B(r,q),id+':abc1'],[id+':abc2',B(r+1,q)]);}
    if(r%4===1&&q%4===1){const id='NET'+(++ng);comps.push(C(id,'GRID3',X(q)-100,Y(r)-60,grid,{label:'τροφοδότηση '+ng}));wires.push([id+':abc',B(r,q),[[X(q)-40,Y(r)-60],[X(q)-40,Y(r)]]]);}}
   const m=k>>1;
   if(ev==='fault'){comps.push(C('F1','FLT3',X(m)-60,Y(m)+90,{kind:'abcg',ton:0.04,toff:0.14,Rf:0.5,Rg:0,...c},{lbl:'below',label:'σφάλμα'}));wires.push([B(m,m),'F1:abc',[[X(m)-60,Y(m)]]]);}
   // the voltage of a bus = the voltage of the shunt capacitor of a line that starts there (phase a)
   // (4.24: with distributed lines, the voltage at the first end of the phase-a line that starts at the bus)
   const panes=[[[tl?'V:H'+m+'_'+m+'/Ta':'V:H'+m+'_'+Math.min(m,k-2)+'/Ca'+(m<k-1?1:2),'v_a στη μέση'],[tl?'V:H'+(k-1)+'_0/Ta':'V:H'+(k-1)+'_0/Ca1','v_a στη γωνία']],[['I:NET1/E','i_a της τροφοδότησης 1'],...(ng>1?[['I:NET'+ng+'/E','i_a της τροφοδότησης '+ng]]:[])],
    ...(ev==='fault'?[[['Y:F1/Ia','i_a του σφάλματος']]]:[])];
   return project(comps,wires,{version:4,solve:{init:'ac'},sim:{hDiv:400,method:'TR',speed:0.2,stopT:0.2},scope:{panes,window:{unit:'s',n:0.2}},meta:{big:{k,buses:k*k,lines:2*k*(k-1),infeeds:ng,ev,...(tl?{line:'tl'}:{})}}});}
 T.push({id:'big_grid',group:'Μεγάλα δίκτυα (4.19.3)',title:'Πλέγμα k × k ζυγών σε EMT: ο γραμμικός λύτης σε μεγάλο δίκτυο',theory:'formula',topology:'big_grid',
  options:[{k:'k',label:'Μέγεθος',options:[['4','4 × 4: 16 ζυγοί'],['8','8 × 8: 64 ζυγοί'],['12','12 × 12: 144 ζυγοί'],['16','16 × 16: 256 ζυγοί'],['24','24 × 24: 576 ζυγοί']],def:'4'},
   {k:'ev',label:'Γεγονός',options:[['fault','Τριφασικό σφάλμα στη μέση (40 ms, καθαρίζει στα 140 ms)'],['none','Καμία διαταραχή']],def:'fault'},
   {k:'line',label:'Γραμμές',options:[['pi','Τμήματα π'],['tl','Κατανεμημένες παράμετροι (4.24): κάθε ζυγός ένα υποδίκτυο']],def:'pi'}],
  desc:'Ένα πλέγμα ζυγών 150 kV, σαν δίκτυο υπομεταφοράς: τμήμα π περίπου 30 km ανάμεσα σε γειτονικούς ζυγούς, φορτίο περίπου 10 MW σε κάθε ζυγό, τροφοδότηση από το δίκτυο μεταφοράς (ισοδύναμο 5 GVA) κάθε τέταρτο ζυγό. Το κύκλωμα δεν έχει τίποτα δύσκολο για το βήμα· μεγαλώνει μόνο η γραμμική άλγεβρα. Έτσι φαίνεται τι κάνει ο αραιός λύτης: η διάταξη των αγνώστων κρατά τους παράγοντες L και U αραιούς, και ο χρόνος ανά βήμα μεγαλώνει σχεδόν ανάλογα με τους ζυγούς, όχι με το τετράγωνο ή τον κύβο τους.',
  tasks:['Άνοιξε «Ρυθμίσεις επίλυσης → Γραμμικός λύτης»: πόσους αγνώστους έχει το δίκτυο, ποιον λύτη προτείνει το engine και γιατί.','Το 4 × 4 ανοίγει αμέσως. Τρέξε μετά το 8 × 8 και το 16 × 16: οι ζυγοί τετραπλασιάζονται κάθε φορά. Σύγκρινε τον χρόνο εκτέλεσης.','Βάλε «Πυκνός LU» στο 12 × 12 και σύγκρινε: ο πυκνός λύνει n² πράξεις ανά βήμα, ο αραιός όσα είναι τα μη μηδενικά των παραγόντων.','Στο σφάλμα ο πίνακας αλλάζει δύο φορές (έναρξη και καθαρισμός): η μερική επαναπαραγοντοποίηση ξαναϋπολογίζει μόνο τις στήλες που εξαρτώνται από τον ζυγό του σφάλματος. Ο μετρητής είναι στην ίδια καρτέλα.'],
  build(o){return bigGrid(+o.k||4,o.ev||'fault',o.line||'pi');}});

 // 4.24 (THEORY §8Ι.7, ROADMAP §90): multirate. Two slow areas and one fast one joined by three lines, the network of the example
 // of the multirate paper (Fig. 10: the elements and the lengths of the lines; the line data Z = 400 Ω, v = 3·10⁸ m/s and the
 // losses are our choice). The fast area (a 1 μF capacitor charged to 1 V, 25 μH and 1 Ω) rings at about 30 kHz and needs a
 // step of 1 μs; the slow areas (1 Ω and 25 mH) need much less. With «Υποδίκτυα» each area is a subnetwork, and with
 // «πολλαπλοί ρυθμοί» the slow ones take m·h.
 T.push({id:'multirate_lines',group:'Μεγάλα δίκτυα (4.24)',title:'Πολλαπλοί ρυθμοί: γρήγορο και αργά υποδίκτυα με γραμμές ανάμεσα',theory:'formula',topology:'multirate_lines',
  options:[{k:'step',label:'Βήμα (στον ζωντανό λύτη)',options:[['fine','1 μs σε όλο το δίκτυο'],['coarse','15 μs σε όλο το δίκτυο']],def:'fine'},
   {k:'loss',label:'Γραμμές',options:[['lossy','Με απώλειες (R′ = 0,05 Ω/km)'],['lossless','Χωρίς απώλειες']],def:'lossy'}],
  desc:'Το δίκτυο του παραδείγματος μιας μελέτης αναφοράς για τους πολλαπλούς ρυθμούς: μια πηγή 1 V στα 60 Hz με 1 Ω και 25 mH (αργή περιοχή 1), φορτίο 1 Ω και 25 mH (αργή περιοχή 2), και μια γρήγορη περιοχή με πυκνωτή 1 μF φορτισμένο στο 1 V και κλάδο 1 Ω, 25 μH. Τρεις γραμμές τις ενώνουν: 150 km (αργή 1 με γρήγορη), 210 km (αργή 1 με αργή 2), 180 km (αργή 2 με γρήγορη). Οι γραμμές (Z = 400 Ω, v = 3·10⁸ m/s, τ = 0,5 / 0,7 / 0,6 ms) χωρίζουν το δίκτυο σε τρία υποδίκτυα. Η γρήγορη περιοχή ταλαντώνεται στα 30 kHz περίπου και θέλει βήμα 1 μs· οι αργές όχι. Με «Ρυθμίσεις επίλυσης → Υποδίκτυα» και πολλαπλούς ρυθμούς, οι αργές περιοχές παίρνουν 15 μs και η γρήγορη 1 μs.',
  tasks:['Τρέξε με βήμα 1 μs σε όλο το δίκτυο: η τάση του πυκνωτή ταλαντώνεται και σβήνει σε περίπου 0,3 ms. Αυτή είναι η αναφορά.','Άλλαξε σε 15 μs σε όλο το δίκτυο: η ταλάντωση των 30 kHz χάνεται (δύο βήματα ανά περίοδο). Η τάση στο πηνίο της αργής περιοχής 1 μένει σωστή.','Άνοιξε «Ρυθμίσεις επίλυσης → Υποδίκτυα και πολλαπλοί ρυθμοί», διάλεξε «Αυτόματα» στους ρυθμούς, και πάτα «Τρέξιμο σε υποδίκτυα»: η γρήγορη περιοχή με 1 μs, οι αργές με 15 μs. Το παράθυρο δίνει τη μέγιστη διαφορά από το τρέξιμο με 1 μs.','Χωρίς απώλειες στις γραμμές: τα γρήγορα κύματα φτάνουν στις αργές περιοχές χωρίς απόσβεση. Με 15 μs εκεί, η αργή πλευρά τα βλέπει εξομαλυμένα (ίδιο εμβαδόν σε κάθε βήμα της).'],
  build(o){const lossy=o.loss!=='lossless',Rp=lossy?0.05e-3:0,Z=400,vel=3e8;
   const tl=(id,x,y,len,lab)=>C(id,'TL',x,y,{spec:'zl',Z,len,vel,Rp,nsec:1},{label:lab});
   const comps=[C('V1','VAC',100,280,{Vpk:1,f:60,ph:0},{label:'1 V, 60 Hz'}),C('R1','R',170,200,{R:1},{label:'1 Ω'}),C('L1','L',260,200,{L:25e-3,i0:0},{label:'25 mH'}),J('S1',360,200),
    tl('TA',500,180,150e3,'150 km'),J('F',640,160),C('C1','C',640,250,{C:1e-6,v0:1,esr:0},{label:'1 μF'}),C('R3','R',720,160,{R:1},{label:'1 Ω'}),C('L3','L',800,160,{L:25e-6,i0:0},{label:'25 μH'}),
    tl('TB',500,380,210e3,'210 km'),J('S2',640,360),C('R2','R',720,360,{R:1},{label:'1 Ω'}),C('L2','L',800,360,{L:25e-3,i0:0},{label:'25 mH'}),
    tl('TC',500,540,180e3,'180 km'),C('G1','GND',100,620,{},{label:'0 V'})];
   const wires=[['V1:p','R1:a',[[100,200]]],['R1:b','L1:a'],['L1:b','S1'],['S1','TA:a1',[[360,160]]],['TA:a2','F'],['F','C1:p',[[640,160]]],['F','R3:a'],['R3:b','L3:a'],
    ['S1','TB:a1',[[360,360]]],['TB:a2','S2'],['S2','R2:a'],['R2:b','L2:a'],['S2','TC:a1',[[600,460],[420,460],[420,520]]],['TC:a2','F',[[880,520],[880,100],[640,100]]],
    ['V1:n','G1:g',[[100,620]]],['TA:b1','G1:g',[[440,600],[100,600]]],['TA:b2','G1:g',[[560,600],[100,600]]],['C1:n','G1:g',[[640,600],[100,600]]],
    ['L3:b','G1:g',[[860,160],[860,600],[100,600]]],['TB:b1','G1:g',[[440,600],[100,600]]],['TB:b2','G1:g',[[560,600],[100,600]]],['L2:b','G1:g',[[840,360],[840,600],[100,600]]],
    ['TC:b1','G1:g',[[440,600],[100,600]]],['TC:b2','G1:g',[[560,600],[100,600]]]];
   const h=o.step==='coarse'?16667/15:16667,stopT=2e-3;
   return project(comps,wires,{solve:{rateMax:15},sim:{hDiv:Math.round(h),method:'TR',speed:0.05,stopT},scope:{panes:[[['V:C1','v_C (γρήγορη περιοχή)']],[['V:L1','v_L1 (αργή περιοχή 1)']],[['V:L2','v_L2 (αργή περιοχή 2)']]],window:{unit:'s',n:stopT}},meta:{multirate:{fast:['C1','R3','L3'],slow:['V1','R1','L1','R2','L2'],m:15}}});}});

 // 4.19.1 (ROADMAP §68 point 6): load flow, N−1 and optimal power flow as studies of the engine (pcl.network on the local server), next to
 // the 9-bus network in EMT with instruments at two points. The card runs the study on the chosen network and exports its report.
 // IEEE9_OPF: |V| (pu) and angle (°) of the AC optimal power flow of pcl.network.ieee9() (cost 5296,69 per hour; tests/test_report.py checks it)
 const IEEE9_OPF={1:[1.1,0],2:[1.097355,4.893644],3:[1.08662,3.249542],5:[1.084448,-3.981982],7:[1.089489,-1.196272],9:[1.071755,-4.615239]};
 const NETS_PF=[['ieee9','IEEE 9 ζυγών (το δίκτυο του σχεδίου)'],['ieee14','IEEE 14 ζυγών'],['ieee30','IEEE 30 ζυγών'],['ieee57','IEEE 57 ζυγών'],['ieee118','IEEE 118 ζυγών'],['ieee300','IEEE 300 ζυγών'],
  ['case33bw','Ακτινικό 33 ζυγών (Baran & Wu)'],['case69','Ακτινικό 69 ζυγών (Baran & Wu)'],
  // 4.19.3 (decision 264): a large network (PEGASE, fictitious data of the size of a part of the European network, CC BY 4.0)
  ['pegase1354','PEGASE 1354 ζυγών (μέγεθος μέρους του ευρωπαϊκού δικτύου, πλασματικά δεδομένα)']];
 T.push({id:'pf_study',group:'Ροή φορτίου και OPF (4.19.1)',title:'Ροή φορτίου και N−1 σε δίκτυα IEEE',theory:'formula',topology:'pf_study',
  options:[{k:'net',label:'Δίκτυο της μελέτης',options:NETS_PF,def:'ieee9'},
   {k:'study',label:'Μελέτη',options:[['pf','Ροή φορτίου'],['n1','N−1 σε AC: η απώλεια κάθε κλάδου'],['n1dc','N−1, σάρωση DC (LODF)']],def:'pf'},
   {k:'method',label:'Μέθοδος ροής φορτίου',options:[['auto','Αυτόματα: η πρόταση του engine από το δίκτυο'],['nr','Αραιός Newton–Raphson'],['nr_dense','Πυκνός Newton–Raphson (ως την 4.19)'],['nr_ci','Newton με εγχύσεις ρεύματος'],
    ['fdxb','Fast-decoupled XB'],['fdbx','Fast-decoupled BX'],['sweep','Εμπρός–πίσω σάρωση (ακτινικά, χωρίς ζυγούς PV)'],['sweepc','Σάρωση με αντιστάθμιση (λίγοι βρόχοι και ζυγοί PV)'],['gs','Gauss–Seidel (αργό, για διδασκαλία)'],['dc','DC (γραμμική προσέγγιση)']],def:'auto'},
   {k:'backend',label:'Η παρτίδα του N−1 σε AC τρέχει σε',options:[['auto','Αυτόματα: στη CPU, εκτός αν η μέτρηση του μηχανήματος βρήκε την GPU* ταχύτερη'],['cpu','CPU'],['gpu','GPU* (πειραματικό: θέλει CuPy και κάρτα CUDA)']],def:'auto'}],
  desc:'Η μελέτη τρέχει στο engine (pcl.network, στον τοπικό server) πάνω στο δίκτυο που διαλέγεις, και η κάρτα δείχνει τι πρότεινε το engine και γιατί. Κάθε μέθοδος σταματά στο ίδιο υπόλοιπο, άρα δίνει την ίδια λύση· αλλάζουν οι επαναλήψεις και ο χρόνος. Το σχέδιο είναι το δίκτυο των 9 ζυγών σε EMT από τη ροή φορτίου του, με όργανα στη γραμμή 8–7 και στο φορτίο του ζυγού 5: χωρίς διαταραχή μένει στη μόνιμη κατάσταση που βρήκε η μελέτη.',
  tasks:['Τρέξε τη ροή φορτίου στο IEEE 118 με «Αυτόματα» και μετά με fast-decoupled XB: ίδιες τάσεις, περισσότερες επαναλήψεις.','Στο ακτινικό των 69 ζυγών δοκίμασε τη σάρωση και τον Newton: το engine εξηγεί γιατί εδώ προτείνει τον Newton (βαθύ δίκτυο, 26 επίπεδα). Στο των 33 ζυγών προτείνει τον πυκνό Newton, γιατί το δίκτυο είναι μικρό.',
   'N−1 σε AC στο IEEE 118: ποια απώλεια φορτίζει περισσότερο το δίκτυο, και ποιοι κλάδοι το χωρίζουν;','Σύγκρινε τη σάρωση DC με το N−1 σε AC: ίδια χειρότερη διαταραχή;','«Εξαγωγή αναφοράς»: ένα αρχείο HTML με γραφήματα, πίνακες και τα δεδομένα μέσα.',
   'N−1 σε AC με «GPU*»: χωρίς κάρτα η μελέτη τρέχει στη CPU και η κάρτα γράφει τον λόγο. Τι βρίσκει το μηχάνημά σου: python -m pcl accel',
   '«Σάρωση με αντιστάθμιση» (4.19.5): στο IEEE 14 (7 βρόχοι, 4 ζυγοί PV) δίνει τις ίδιες τάσεις σε 18 επαναλήψεις· στο IEEE 118 (62 βρόχοι, 53 ζυγοί PV) δεν συγκλίνει και η κάρτα το λέει. Είναι μέθοδος για ακτινικά και ασθενώς βροχοειδή δίκτυα.'],
  build(o){const pr=ieee9Build({ev:'none',ctl:'none',meter:true});pr.meta={...pr.meta,study:{net:o.net,study:o.study,options:o.study==='pf'?{method:o.method}:o.study==='n1'?{backend:o.backend||'auto'}:{}}};return pr;}});
 T.push({id:'opf_study',group:'Ροή φορτίου και OPF (4.19.1)',title:'Βέλτιστη ροή φορτίου (OPF) σε δίκτυα IEEE',theory:'formula',topology:'opf_study',
  options:[{k:'net',label:'Δίκτυο της μελέτης',options:[...NETS_PF.slice(0,6),['case30','30 ζυγών με όρια γραμμών (Alsac & Stott)'],NETS_PF[NETS_PF.length-1]],def:'ieee9'},
   {k:'kind',label:'Μοντέλο',options:[['opf','AC: πλήρεις εξισώσεις, εσωτερικό σημείο'],['dcopf','DC: γραμμικό δίκτυο'],['scopf','DC με ασφάλεια N−1: καμία απώλεια κλάδου δεν υπερφορτίζει άλλον']],def:'opf'},
   {k:'limits',label:'Όρια ροής των κλάδων',options:[['yes','Ναι, όπου υπάρχει ονομαστική ισχύς'],['no','Όχι']],def:'yes'},
   {k:'start',label:'Εκκίνηση του λύτη (AC)',options:[['auto','Κανονική: το μέσο των ορίων'],['nn','Νευρωνικό αρχικό σημείο, όπου υπάρχει μοντέλο του δικτύου· ο λύτης επαληθεύει']],def:'auto'},
   {k:'emt',label:'Το EMT του σχεδίου ξεκινά από',options:[['lf','Τη ροή φορτίου του IEEE 9'],['opf','Τη βέλτιστη κατανομή (AC-OPF) του IEEE 9']],def:'lf'}],
  desc:'Η φθηνότερη κατανομή της παραγωγής που αντέχει το δίκτυο: ελαχιστοποίηση του κόστους με τις εξισώσεις ισχύος ως ισότητες και τα όρια τάσης, παραγωγής και ροής ως ανισότητες, με μέθοδο εσωτερικού σημείου στο engine (pcl.opf). Η κάρτα δείχνει κόστος, οριακές τιμές και τους περιορισμούς που δεσμεύουν. Με «βέλτιστη κατανομή» το EMT του σχεδίου ξεκινά από το σημείο που βρήκε ο OPF για το δίκτυο των 9 ζυγών.',
  tasks:['IEEE 9: κόστος 5296,69 ανά ώρα, όπως στη βιβλιογραφία. Ποιες τάσεις κάθονται στο όριο 1,1 pu;','Το δίκτυο των 30 ζυγών με και χωρίς όρια ροής: πόσο ακριβαίνει η λύση, και σε ποιους ζυγούς ανεβαίνει η οριακή τιμή;',
   'AC απέναντι σε DC: το DC δεν έχει απώλειες, άρα βγαίνει φθηνότερο κατά λίγα τοις εκατό.','Ξεκίνα το EMT από τη βέλτιστη κατανομή: οι ισχείς των γεννητριών στο scope είναι αυτές του OPF.','«Εξαγωγή αναφοράς» για την κατανομή, τις οριακές τιμές και τους περιορισμούς.',
   'Δίκτυο των 30 ζυγών με «DC με ασφάλεια N−1» (4.19.4): η κατανομή ακριβαίνει κατά 0,147 ανά ώρα και καμία απώλεια κλάδου δεν υπερφορτίζει πια άλλον. Το διάγραμμα ανοίγει στη στρώση της ασφάλειας. Τα όρια ροής είναι τότε πάντα μέσα στο πρόβλημα· δίκτυο χωρίς ονομαστικές ισχείς δεν έχει τι να ασφαλίσει.',
   'Στα IEEE 9, IEEE 14 και στο δίκτυο των 30 ζυγών βάλε «Νευρωνικό αρχικό σημείο»: ίδιο κόστος, λιγότερες επαναλήψεις. Στα άλλα δίκτυα δεν υπάρχει μοντέλο και η κάρτα το λέει (εκπαίδευση: python -m pcl nnstart ieee118).'],
  build(o){const pr=ieee9Build({ev:'none',ctl:'none',meter:true,lf:o.emt==='opf'?IEEE9_OPF:null});pr.meta={...pr.meta,study:{net:o.net,study:o.kind,options:o.kind==='opf'?{flow_limits:o.limits!=='no',start:o.start||'auto'}:o.kind==='scopf'?{}:{flow_limits:o.limits!=='no'}},emtFrom:o.emt,noAF:o.emt==='opf'};return pr;}});

 // 4.19.5 (ROADMAP §77): the continuation load flow (pcl.cpf): the P–V curve, the loading margin and the weakest buses of a network
 T.push({id:'cpf_study',group:'Ροή φορτίου και OPF (4.19.1)',title:'Ευστάθεια τάσης: καμπύλη P–V και περιθώριο φόρτισης (συνεχιζόμενη ροή φορτίου)',theory:'formula',topology:'cpf_study',
  options:[{k:'net',label:'Δίκτυο της μελέτης',options:NETS_PF,def:'ieee14'},
   {k:'qlim',label:'Όρια αέργου των γεννητριών',options:[['yes','Ναι: μια γεννήτρια στο όριό της παύει να κρατά την τάση του ζυγού της'],['no','Όχι: κάθε γεννήτρια κρατά την τάση της όσο κι αν μεγαλώσει το φορτίο']],def:'yes'},
   {k:'grow',label:'Τι μεγαλώνει',options:[['all','Όλα τα φορτία, και οι γεννήτριες αναλογικά'],['load','Μόνο τα φορτία: την αύξηση την καλύπτει ο ζυγός ταλάντωσης']],def:'all'}],
  desc:'Πόσο μπορεί να μεγαλώσει το φορτίο ενός δικτύου πριν η ροή φορτίου πάψει να έχει λύση. Κάθε φορτίο γίνεται S·(1 + λ) και το engine (pcl.cpf, στον τοπικό server) ακολουθεί την καμπύλη των λύσεων καθώς το λ μεγαλώνει: πρόβλεψη στην εφαπτομένη, διόρθωση Newton με έναν άγνωστο κρατημένο σταθερό, ώστε να περνά τη μύτη της καμπύλης, εκεί όπου ο απλός Newton αποκλίνει. Η κάρτα δείχνει το περιθώριο φόρτισης, τον πιο αδύναμο ζυγό με την καμπύλη P–V του, και τις γεννήτριες που έφτασαν σε όριο αέργου στη διαδρομή. Το σχέδιο είναι το δίκτυο των 9 ζυγών σε EMT από τη ροή φορτίου του.',
  tasks:['IEEE 14 με όρια αέργου: το όριο φόρτισης είναι στο λ = 0,778, δηλαδή 201,5 MW πάνω από τα 259 MW του δικτύου. Ο πιο αδύναμος ζυγός είναι ο 14: από 1,036 pu πέφτει στα 0,616 pu.',
   'Το ίδιο δίκτυο χωρίς όρια αέργου φτάνει ως λ = 3,06: τέσσερις γεννήτριες που χάνουν τον έλεγχο της τάσης (ζυγοί 2, 3, 6, 8, όλες πριν από το λ = 0,23) κόβουν το περιθώριο στο ένα τέταρτο.',
   'IEEE 9 με όρια αέργου: το όριο δεν είναι μύτη. Στο λ = 1,566 η γεννήτρια του ζυγού 2 φτάνει το άνω όριό της και από εκεί δεν υπάρχει λύση με περισσότερο φορτίο (άμεση αστάθεια στο όριο)· χωρίς όρια η μύτη είναι στο 1,641.',
   '«Διάγραμμα του δικτύου»: ανοίγει στη στρώση της ευστάθειας τάσης. Ποιοι ζυγοί πέφτουν περισσότερο, και πόσο απέχουν από γεννήτρια που κρατά ακόμη την τάση της;',
   '«Μόνο τα φορτία» στο IEEE 14 με όρια: το όριο πέφτει από 0,778 σε 0,760, γιατί όλη η αύξηση έρχεται από τον ζυγό ταλάντωσης.',
   'IEEE 118 με όρια αέργου: πέντε γεννήτριες ξεκινούν στο κάτω όριό τους και ξαναπαίρνουν τον έλεγχο της τάσης όσο το φορτίο μεγαλώνει. Το όριο (λ = 1,081) είναι πάλι γωνία, στον ζυγό 10.',
   '«Εξαγωγή αναφοράς»: η καμπύλη P–V των τεσσάρων πιο αδύναμων ζυγών, ο δείκτης που μηδενίζεται στη μύτη, και ο πίνακας με κάθε αλλαγή τύπου ζυγού στη διαδρομή.'],
  build(o){const pr=ieee9Build({ev:'none',ctl:'none',meter:true});pr.meta={...pr.meta,study:{net:o.net,study:'cpf',options:{q_limits:o.qlim!=='no',direction:o.grow==='load'?'load':'all'}}};return pr;}});

 // 4.19.5 (ROADMAP §79): state estimation as a study of the engine (pcl.se): measurements made from the load flow of the network
 // with random errors and, by choice, gross ones; the card shows the tests and what was taken out
 T.push({id:'se_study',group:'Ροή φορτίου και OPF (4.19.1)',title:'Εκτίμηση κατάστασης: μετρήσεις με σφάλματα και εντοπισμός των λανθασμένων',theory:'formula',topology:'se_study',
  options:[{k:'net',label:'Δίκτυο της μελέτης',options:NETS_PF,def:'ieee14'},
   {k:'plan',label:'Πού υπάρχουν μετρήσεις',options:[['scada','Τάση στους ζυγούς με γεννήτρια, εγχύσεις σε κάθε ζυγό, ροές στο ένα άκρο κάθε κλάδου'],['all','Παντού: τάση και εγχύσεις σε κάθε ζυγό, ροές στα δύο άκρα κάθε κλάδου'],
    ['flows','Μόνο ροές στο ένα άκρο κάθε κλάδου, και η τάση του ζυγού ταλάντωσης'],['tree','Ροές μόνο στους κλάδους ενός δέντρου: καμία περίσσεια']],def:'scada'},
   {k:'bad',label:'Λανθασμένη μέτρηση (πέρα από τα τυχαία σφάλματα)',options:[['none','Καμία'],['flow','Η μεγαλύτερη ροή ενεργού ισχύος, 20σ πάνω'],['injection','Η μεγαλύτερη έγχυση ενεργού ισχύος, 20σ κάτω'],
    ['voltage','Η χαμηλότερη μέτρηση τάσης, 20σ πάνω'],['two','Δύο μαζί: η ροή και η έγχυση']],def:'flow'}],
  desc:'Το κέντρο ελέγχου δεν ξέρει τις τάσεις του δικτύου: έχει μετρήσεις με σφάλματα, περισσότερες από τους αγνώστους. Η εκτίμηση κατάστασης (pcl.se, στον τοπικό server) βρίσκει τις τάσεις που ταιριάζουν καλύτερα σε όλες μαζί (ελάχιστα τετράγωνα με βάρος 1/σ² σε κάθε μέτρηση) και μετά ρωτά αν κάποια μέτρηση είναι λανθασμένη: ο έλεγχος χ² λέει αν υπάρχει, το κανονικοποιημένο υπόλοιπο λέει ποια. Εδώ οι μετρήσεις φτιάχνονται από τη ροή φορτίου του δικτύου με τυχαία σφάλματα (τάση σ = 0,004 pu, ροές 0,008 pu, εγχύσεις 0,010 pu), ώστε η εκτίμηση να συγκρίνεται με την «αλήθεια» που σε πραγματικό δίκτυο δεν υπάρχει. Το σχέδιο είναι το δίκτυο των 9 ζυγών σε EMT από τη ροή φορτίου του.',
  tasks:['IEEE 14 με μία ροή 20σ πάνω: 71 μετρήσεις για 27 αγνώστους. Το J της πρώτης εκτίμησης είναι 244,3, πάνω από το κατώφλι χ² (71,2): κάποια μέτρηση είναι λανθασμένη. Το μεγαλύτερο κανονικοποιημένο υπόλοιπο (14,4) δείχνει τη ροή του κλάδου br1· χωρίς αυτήν το J πέφτει στο 36,9.',
   'Η εκτίμηση του σφάλματος της μέτρησης που βγήκε είναι 18,4σ. Μπήκαν 20σ πάνω στο τυχαίο σφάλμα της ίδιας μέτρησης: η εκτίμηση βλέπει το άθροισμα.',
   '«Καμία»: J = 38,5 με 46 βαθμούς ελευθερίας, κοντά στην αναμενόμενη τιμή του (όσοι οι βαθμοί ελευθερίας). Η εκτίμηση απέχει από τη ροή φορτίου ως 0,0019 pu, ενώ μια μέτρηση τάσης έχει σ = 0,004 pu: η περίσσεια διορθώνει τις μετρήσεις.',
   '«Δύο μαζί»: βγαίνουν και οι δύο, πρώτα η έγχυση. Η εκτίμηση του σφάλματός της (−33,6σ αντί για −20σ) είναι λάθος, γιατί εκείνη τη στιγμή η λανθασμένη ροή του ίδιου ζυγού είναι ακόμη μέσα.',
   '«Μόνο ροές» με τη ροή 20σ πάνω: ο έλεγχος χ² το πιάνει (56,2 πάνω από 32,0), αλλά βγαίνει η ροή του br2 αντί του br1. Οι δύο ροές του ζυγού 1 έχουν σχεδόν το ίδιο κανονικοποιημένο υπόλοιπο (6,34 και 6,26): με λίγη περίσσεια το σφάλμα ανιχνεύεται χωρίς να εντοπίζεται σωστά.',
   '«Δέντρο»: 27 μετρήσεις για 27 αγνώστους. Το ίδιο σφάλμα δεν φαίνεται πουθενά (J = 0,8 με ή χωρίς αυτό) και περνά ολόκληρο στην εκτίμηση: 16 μετρήσεις είναι κρίσιμες.',
   '«Διάγραμμα του δικτύου»: ανοίγει στη στρώση των υπολοίπων. Πού είναι η μέτρηση που βγήκε, και πόσο μακριά της φτάνει η επιρροή της;',
   'IEEE 118 χωρίς λανθασμένη μέτρηση: βγαίνει μία σωστή, με κανονικοποιημένο υπόλοιπο 3,3. Με 642 μετρήσεις και κατώφλι 3,0 αυτό είναι αναμενόμενο (πιθανότητα 0,27 % ανά μέτρηση): το κατώφλι είναι συμβιβασμός ανάμεσα σε ό,τι χάνεις και σε ό,τι πετάς άδικα.'],
  build(o){const pr=ieee9Build({ev:'none',ctl:'none',meter:true});const opt={plan:o.plan||'scada'};if(o.bad&&o.bad!=='none')opt.bad=o.bad;pr.meta={...pr.meta,study:{net:o.net,study:'se',options:opt}};return pr;}});

 // 4.19.5 (ROADMAP §80): the harmonic load flow as a study of the engine (pcl.harmonic) on the first test system of the Task Force
 // on Harmonics Modeling and Simulation (1999): a twelve-pulse HVDC terminal at bus 3 and an SVC at bus 8
 // 4.21 (§87): the AC/DC study of the five-bus network of the AC/DC optimal power flow: the load flow with the limits of the stations,
 // the optimal power flow AC/DC, N−1 AC/DC (the drawing below is the 9-bus network in EMT, as in the other study tutorials)
 T.push({id:'acdc_study',group:'Ροή φορτίου και OPF (4.19.1)',title:'Δίκτυο AC/DC: όρια σταθμών, βέλτιστη ροή φορτίου AC/DC, N−1 AC/DC',theory:'formula',topology:'acdc_study',
  options:[{k:'mode',label:'Μελέτη',options:[['flow','Ροή φορτίου AC/DC'],['opf','Βέλτιστη ροή φορτίου AC/DC'],['n1','N−1 AC/DC']],def:'flow'},
   {k:'lim',label:'Όρια των σταθμών (ροή φορτίου)',options:[['data','Των δεδομένων: I_max 187 A, |U_c| 0,9–1,1 pu, Q ±50 Mvar'],['110','Ο C1 με I_max = 110 A'],['100','Ο C1 με I_max = 100 A'],['off','Χωρίς όρια']],def:'data'}],
  desc:'Δίκτυο πέντε ζυγών AC με τρεις σταθμούς VSC και τρεις ζυγούς DC, από τα δεδομένα της υλοποίησης αναφοράς της βέλτιστης ροής φορτίου AC/DC (άδεια BSD 3-Clause, μέσα στο αρχείο). Κάθε σταθμός έχει μετασχηματιστή, φίλτρο και πηνίο, απώλειες a + b·I + c·I², και όρια: ρεύμα του μετατροπέα, τάση του μετατροπέα, άεργο. Το engine (pcl.dcgrid, στον τοπικό server) λύνει τη ροή φορτίου AC/DC με τα όρια (προτεραιότητα στην ενεργό ισχύ), τη βέλτιστη ροή φορτίου με το μη γραμμικό μοντέλο εγχύσεων ζυγών, ή N−1 για κάθε κλάδο AC, γραμμή DC και σταθμό.',
  tasks:['Βέλτιστη ροή φορτίου AC/DC: κόστος 194,1388 ανά ώρα σε 20 επαναλήψεις, όπως το 194,139 του πίνακα της δημοσίευσης για το ίδιο μοντέλο. Η απλή βέλτιστη ροή φορτίου AC, με τους σταθμούς ως σταθερές εγχύσεις, κοστίζει περισσότερο.',
   'Ροή φορτίου με «Ο C1 με I_max = 110 A»: ο C1 κρατά τα −60 MW και η άεργός του πέφτει από −40 σε −25,86 Mvar, στο όριο του ρεύματος. Με 100 A δεν χωρά ούτε η P: πέφτει στα −59,76 MW.',
   'N−1 AC/DC: 13 διαταραχές, 12 με λύση. Χωρίς τον C2 το δίκτυο DC μένει χωρίς σταθμό που κρατά την τάση του, και η μελέτη το λέει. Η χειρότερη είναι ο κλάδος br2 (φόρτιση 149 % απέναντι σε 122 % πριν).'],
  build(o){const pr=ieee9Build({ev:'none',ctl:'none'});const opt={mode:o.mode};
   if(o.mode==='flow'){opt.limits=o.lim!=='off';if(o.lim==='110'||o.lim==='100')opt.set={C1:{Imax:+o.lim}};}
   pr.meta={...pr.meta,study:{net:'case5_acdc',study:'acdc',layer:{flow:'flow',opf:'lmp',n1:'n1'}[o.mode],options:opt}};return pr;}});
 // 4.21 (§87): the spectrum of a six-pulse bridge from the EMT, for the harmonic load flow: the Fourier blocks of 4.19.6 on the current
 // that the bridge draws from phase a (sin(hω₁t) from t = 0, per period), pcl.harmonic.spectrum_from on the engine
 const HARM_EMT_H=[1,5,7,11,13,17,19,23,25];
 T.push({id:'harm_emt',group:'Ροή φορτίου και OPF (4.19.1)',title:'Φάσμα από το EMT για την αρμονική ροή φορτίου: γέφυρα 6 παλμών με μετάβαση',theory:'formula',topology:'harm_emt',
  options:[{k:'Ls',label:'Αυτεπαγωγή μετάβασης L_s (ανά φάση)',options:[['0','Καμία: ακαριαία μετάβαση (η ιδανική γέφυρα)'],['0.0005','L_s = 0,5 mH'],['0.002','L_s = 2 mH']],def:'0'},
   {k:'dev',label:'Στοιχεία',options:[['diode','Δίοδοι'],['15','Θυρίστορ, α = 15°'],['40','Θυρίστορ, α = 40°']],def:'diode'}],
  desc:'Πηγή 400 V πολική, 60 Hz, με αυτεπαγωγή L_s ανά φάση, γέφυρα 6 παλμών και στην πλευρά DC πηνίο 1 H με αντίσταση 20 Ω: το ρεύμα DC είναι σχεδόν σταθερό. Εννέα μπλοκ Fourier μετρούν στο ρεύμα της φάσης a, ανά περίοδο, το πλάτος και τη φάση των τάξεων 1, 5, 7, 11, 13, 17, 19, 23 και 25 ως προς sin(hω₁t) από το t = 0. Η κάρτα στέλνει ό,τι δίνουν τη στιγμή που πατάς το κουμπί στο engine (pcl.harmonic, στον τοπικό server): το φάσμα γίνεται λόγος προς τη θεμελιώδη και γωνία ως προς h φορές τη γωνία της, στο συνημίτονο της μελέτης, και μπαίνει στις δύο γέφυρες του τερματικού HVDC του συστήματος δοκιμής αρμονικών των 14 ζυγών, στη θέση του φάσματος του πίνακα της δημοσίευσης.',
  tasks:['Χωρίς L_s: το φάσμα είναι της ιδανικής γέφυρας, 1/h, με τις τάξεις 6k − 1 απέναντι στη θεμελιώδη και τις 6k + 1 μαζί της, για κάθε α μέσα σε 0,0014 της θεμελιώδους και 0,3°. Η καθυστέρηση α μετακινεί κάθε τάξη κατά h·α, και η μετατροπή το αφαιρεί· το 0,0014 είναι η κυμάτωση του ρεύματος DC.',
   'Με L_s: η μετάβαση (μ = 21,5° με διόδους και L_s = 2 mH) στρογγυλεύει τους παλμούς του ρεύματος, και οι υψηλές τάξεις πέφτουν πιο πολύ: η 25η από 0,040 σε 0,009 της θεμελιώδους. Με α = 40° η μετάβαση είναι πιο σύντομη (4,5°) και το φάσμα μένει πιο κοντά στο ιδανικό.',
   'Πάτα «Τρέξε τη μελέτη» μετά από δύο περιόδους τουλάχιστον. Με το ιδανικό φάσμα (ως την 25η) το THD του ζυγού 301 βγαίνει 6,00 %, με διόδους και L_s = 2 mH 2,54 %, και με το φάσμα του πίνακα της δημοσίευσης 4,13 % (το «Αρμονικές: παραμόρφωση τάσης και συντονισμοί»).'],
  build(o){const Vpk=400*Math.SQRT2/Math.sqrt(3),f=60,Ls=+o.Ls,scr=o.dev!=='diode',a=scr?+o.dev:0,R=20,Ld=1,w={win:'per',f},sg=(id,x,y,name)=>C(id,'TAGI',x,y,{name},{label:'',lbl:'none'});
   const dev=(id,x,y,shift)=>scr?C(id,'SCR',x,y,{refsrc:'V1',alpha:a,shift,pw:120},{rot:3}):C(id,'D',x,y,{},{rot:3});
   const Id=(3*Math.sqrt(3)/Math.PI*Vpk*Math.cos(a*Math.PI/180))/(R+3*2*Math.PI*f*Ls/Math.PI);
   const comps=[C('V1','VAC3',60,210,{Vpk,f},{label:'v_abc'}),C('G1','GND',60,280,{},{label:'0 V'}),C('AMA','AM',130,190,{},{label:'i_a'}),C('TA','TAGO',130,140,{name:'i_a'},{label:'',lbl:'none'}),
    dev('Q1',260,130,30),dev('Q3',380,130,150),dev('Q5',500,130,270),dev('Q4',260,290,210),dev('Q6',380,290,330),dev('Q2',500,290,90),
    J('JA',260,190),J('JB',380,210),J('JC',500,230),J('JP1',260,70),J('JP3',380,70),J('JP5',500,70),J('JN1',260,350),J('JN3',380,350),J('JN5',500,350),
    C('LD','L',640,170,{L:Ld,i0:+Id.toFixed(4)},{rot:1,label:'L_d'}),C('RD','R',640,260,{R},{rot:1,label:'R'})];
   const wires=[['V1:n','G1:g'],['V1:a','AMA:a'],['Q1:a','JA'],['JA','Q4:k'],['Q3:a','JB'],['JB','Q6:k'],['Q5:a','JC'],['JC','Q2:k'],
    ['Q1:k','JP1'],['JP1','JP3',[],{name:'P'}],['JP3','Q3:k'],['JP3','JP5'],['JP5','Q5:k'],['Q4:a','JN1'],['JN1','JN3',[],{name:'N'}],['JN3','Q6:a'],['JN3','JN5'],['JN5','Q2:a'],
    ['JP5','LD:a',[[640,70]]],['LD:b','RD:a'],['RD:b','JN5',[[640,350]]],['AMA:y','TA:u']];
   if(Ls>0){comps.push(C('LA','L',200,190,{L:Ls},{label:'L_s'}),C('LB','L',200,210,{L:Ls},{label:'',lbl:'none'}),C('LC','L',200,230,{L:Ls},{label:'',lbl:'none'}));
    wires.push(['AMA:b','LA:a'],['LA:b','JA'],['V1:b','LB:a'],['LB:b','JB'],['V1:c','LC:a'],['LC:b','JC']);}
   else wires.push(['AMA:b','JA'],['V1:b','JB'],['V1:c','JC']);
   HARM_EMT_H.forEach((h,k)=>{const x=120+150*(k%5),y=k<5?460:560;comps.push(sg('GF'+h,x,y,'i_a'),C('F'+h,'FOUR',x+80,y,{...w,nu:h},{label:'i_a, '+h+(h===1?'η (θεμελιώδης)':'η')}));wires.push(['GF'+h+':y','F'+h+':u']);});
   return project(comps,wires,{sim:{hDiv:3000,speed:2,stopT:0.25},scope:{panes:[[['Y:AMA','i_a']],[['V:RD','v_R']],[['Y:F1','|I₁|'],['Y:F5','|I₅|'],['Y:F7','|I₇|'],['Y:F11','|I₁₁|']]],window:{unit:'T',n:2}},
    meta:{Vpk,f,Ls,alpha:a,Id,study:{net:'harmonic14',study:'harmonic',emt:{kind:'spectrum',f,orders:Object.fromEntries(HARM_EMT_H.map(h=>[h,'F'+h])),loads:['hvdc1','hvdc2']},options:{}}}});}});
 T.push({id:'harm_study',group:'Ροή φορτίου και OPF (4.19.1)',title:'Αρμονικές: παραμόρφωση τάσης και συντονισμοί (αρμονική ροή φορτίου)',theory:'formula',topology:'harm_study',
  options:[{k:'net',label:'Δίκτυο της μελέτης',options:[['harmonic14','Σύστημα δοκιμής αρμονικών: 14 ζυγοί μεταφοράς με τερματικό HVDC και SVC (Task Force 1999)']],def:'harmonic14'},
   {k:'pulse',label:'Τερματικό HVDC',options:[['12','Δωδεκαπαλμικό: η μία γέφυρα πίσω από αστέρα–αστέρα, η άλλη πίσω από αστέρα–τρίγωνο'],['6','Σαν εξαπαλμικό: και οι δύο γέφυρες πίσω από αστέρα–αστέρα']],def:'12'},
   {k:'filters',label:'Συντονισμένα φίλτρα',options:[['yes','Με τα φίλτρα (11ης στον ζυγό 3· 2ης, 5ης, 7ης, 11ης στον ζυγό 8)'],['no','Χωρίς τα φίλτρα, και χωρίς την άεργο που δίνουν']],def:'yes'},
   {k:'lines',label:'Μοντέλο γραμμών',options:[['distributed','Κατανεμημένες παράμετροι (μοντέλο μακριάς γραμμής)'],['pi','Συγκεντρωμένο ισοδύναμο π']],def:'distributed'},
   {k:'load',label:'Μοντέλο φορτίων στις αρμονικές',options:[['C','C: R παράλληλα με L, σε σειρά με την αυτεπαγωγή του μετασχηματιστή'],['A','A: R παράλληλα με L από τα P και Q'],['none','Χωρίς τα φορτία']],def:'C'}],
  desc:'Ένας μετατροπέας τραβά ρεύμα που δεν είναι ημιτονικό. Οι αρμονικές του ρεύματος αυτού περνούν από τις εμπεδήσεις του δικτύου και παραμορφώνουν την τάση σε κάθε ζυγό, πιο πολύ εκεί όπου οι χωρητικότητες των γραμμών και των φίλτρων συντονίζουν με τις αυτεπαγωγές. Το engine (pcl.harmonic, στον τοπικό server) λύνει πρώτα τη ροή φορτίου της θεμελιώδους, βρίσκει από αυτήν το ρεύμα κάθε μη γραμμικού φορτίου, και για κάθε τάξη λύνει το γραμμικό δίκτυο με τα ρεύματα του φάσματος. Η κάρτα δείχνει την παραμόρφωση τάσης (THD) απέναντι στα όρια του IEEE 519, το φάσμα στον ζυγό του HVDC, και τη σάρωση συχνότητας: την εμπέδηση που βλέπει ο ζυγός 3 ως προς την τάξη. Το δίκτυο είναι το πρώτο σύστημα δοκιμής της Task Force on Harmonics Modeling and Simulation· το σχέδιο από κάτω είναι το δίκτυο των 9 ζυγών σε EMT.',
  tasks:['Δωδεκαπαλμικό με τα φίλτρα: στον ζυγό 3 (HVDC, 230 kV) το THD είναι 1,51 %. Η 5η είναι μόλις 0,06 % και η 17η και η 19η μηδέν: σε αυτές τις τάξεις οι δύο γέφυρες αναιρούν η μία την άλλη. Το 0,06 % της 5ης είναι του TCR.',
   'Η μεγαλύτερη αρμονική εκεί είναι η 25η (1,32 %), όχι η 11η (0,26 %), αν και το ρεύμα της 25ης είναι το ένα τρίτο του ρεύματος της 11ης: η σάρωση δείχνει παράλληλο συντονισμό στην τάξη 25,25, και τα φίλτρα απορροφούν την 11η.',
   'Τέσσερις ζυγοί των 230 kV (1, 2, 3, 5) περνούν το όριο 1,5 % του IEEE 519. Οι ζυγοί των γεφυρών (35,4 kV) έχουν 4,13 % με όριο 5 %.',
   '«Σαν εξαπαλμικό»: η 5η στον ζυγό 3 γίνεται 9,49 % και το THD 10,07 %· 15 ζυγοί πάνω από το όριο. Αυτό κερδίζει η δεύτερη γέφυρα πίσω από τρίγωνο.',
   '«Χωρίς τα φίλτρα»: ο συντονισμός πάει στην τάξη 18,95 με εμπέδηση 50,8 pu και το THD του ζυγού 3 γίνεται 9,78 %. Τα φίλτρα δεν απορροφούν μόνο την 11η: αλλάζουν και το πού συντονίζει το δίκτυο.',
   '«Συγκεντρωμένο π»: η 25η στον ζυγό 3 βγαίνει 0,83 % αντί για 1,32 %, γιατί ο συντονισμός μετακινείται στην τάξη 26,9, και κανένας ζυγός δεν φαίνεται πάνω από το όριο. Στις υψηλές τάξεις οι γραμμές των 230 kV θέλουν το μοντέλο μακριάς γραμμής.',
   '«Διάγραμμα του δικτύου»: στη στρώση της παραμόρφωσης, ποιοι ζυγοί είναι κοντά στο όριό τους; «Εξαγωγή αναφοράς»: το φάσμα, η σάρωση με τους συντονισμούς της, και οι κλάδοι με το πιο παραμορφωμένο ρεύμα.',
   'Η δημοσίευση δίνει για τον ζυγό 3 THD 1,516 %· εδώ 1,513 %. Στους ζυγούς των 115 kV η διαφορά φτάνει το 15 %, και στους ζυγούς των γεφυρών η δημοσίευση δίνει 9,17 % αντί για 4,13 %: εκεί μετρά το μοντέλο του μετατροπέα, που εδώ είναι σταθερή πηγή ρεύματος.'],
  build(o){const pr=ieee9Build({ev:'none',ctl:'none',meter:true});const opt={line_model:o.lines==='pi'?'pi':'distributed',load_model:['A','none'].includes(o.load)?o.load:'C'};if(o.pulse==='6')opt.pulse=6;if(o.filters==='no')opt.filters=false;
   pr.meta={...pr.meta,study:{net:o.net||'harmonic14',study:'harmonic',options:opt}};return pr;}});
 // 4.19.5 (ROADMAP §81): the three-phase load flow of a distribution feeder (pcl.unbalanced). The network of the study is a feeder
 // (every phase of every node on its own), not a positive-sequence network: the card sends its name as the case of the study
 // 'unbalanced'. tests/test_report.py checks every number of the tasks against the engine
 T.push({id:'unb_study',group:'Ροή φορτίου και OPF (4.19.1)',title:'Ασύμμετρη ροή φορτίου: ένας τροφοδότης διανομής φάση προς φάση',theory:'formula',topology:'unb_study',
  options:[{k:'net',label:'Τροφοδότης της μελέτης',options:[['feeder13','IEEE 13 node test feeder: 4,16 kV, ρυθμιστής τάσης, κλάδοι μίας και δύο φάσεων']],def:'feeder13'},
   {k:'reg',label:'Λήψεις του ρυθμιστή τάσης',options:[['given','Οι λήψεις της δημοσίευσης (a 10, b 8, c 11)'],['control','Από τον έλεγχο: αντισταθμιστής πτώσης γραμμής, μία λήψη τη φορά από το μηδέν'],['neutral','Όλες στο μηδέν: χωρίς ρύθμιση']],def:'given'},
   {k:'spread',label:'Κατανεμημένο φορτίο του τμήματος 632–671',options:[['exact','Ακριβές ισοδύναμο: δύο τρίτα στο ένα τέταρτο του τμήματος, ένα τρίτο στο άκρο'],['middle','Ολόκληρο στο μέσο του τμήματος']],def:'exact'}],
  desc:'Σε έναν τροφοδότη διανομής οι τρεις φάσεις δεν είναι ίδιες: οι γραμμές δεν είναι αντιμετατεθειμένες, υπάρχουν κλάδοι με μία ή δύο φάσεις, και τα φορτία συνδέονται ανάμεσα σε μια φάση και τον ουδέτερο ή ανάμεσα σε δύο φάσεις. Η ροή φορτίου θετικής ακολουθίας δεν τα βλέπει αυτά. Το engine (pcl.unbalanced, στον τοπικό server) λύνει κάθε φάση κάθε κόμβου χωριστά: κάθε τμήμα γραμμής είναι ο πίνακας εμπεδήσεων των φάσεών του με τις αμοιβαίες, και τα ρεύματα των φορτίων επαναλαμβάνονται πάνω στον παραγοντοποιημένο πίνακα αγωγιμοτήτων ως το σταθερό σημείο. Ο τροφοδότης είναι ο IEEE 13 node test feeder: 4,16 kV, ένας ρυθμιστής τάσης με τρεις μονοφασικές μονάδες στην αρχή, φορτία σταθερής ισχύος, ρεύματος και εμπέδησης σε αστέρα και σε τρίγωνο, ένα κατανεμημένο φορτίο, πυκνωτές και ένας μετασχηματιστής. Η κάρτα δείχνει την τάση κάθε φάσης σε κάθε ζυγό και τη συγκρίνει με τα δημοσιευμένα αποτελέσματα του τροφοδότη· το σχέδιο από κάτω είναι το δίκτυο των 9 ζυγών σε EMT.',
  tasks:['Με τις λήψεις της δημοσίευσης: η χαμηλότερη τάση είναι 0,9739 pu στη φάση c του ζυγού 611 και η ψηλότερη 1,0687 pu στη φάση c αμέσως μετά τον ρυθμιστή. Η κάρτα συγκρίνει 35 τάσεις φάσης με τα δημοσιευμένα αποτελέσματα: μέγιστη διαφορά 0,00017 pu και 0,015°.',
   'Η φάση b έχει 1,0500 pu μετά τον ρυθμιστή και 1,0553 pu στο τέλος του τροφοδότη (ζυγός 675): ανεβαίνει αντί να πέφτει. Είναι η φάση με το μικρότερο φορτίο (977 kW, με 1251 και 1348 kW στις άλλες δύο), και τα ρεύματα των άλλων δύο της επάγουν τάση μέσα από τη σύζευξη της γραμμής.',
   'Η ασυμμετρία τάσης (αρνητική ως προς θετική ακολουθία) φτάνει το 2,06 % στον ζυγό 675. Πέντε ζυγοί (611, 645, 646, 652, 684) έχουν μία ή δύο φάσεις: εκεί δεν ορίζεται, και στη στρώση του διαγράμματος μένουν γκρι.',
   'Απώλειες 111,0 kW, το 3,10 % της εισόδου (δημοσιευμένες 111,063 kW). Στην αναφορά η φάση b έχει αρνητικές «απώλειες» (−4,7 kW): δίνει ισχύ στις άλλες δύο μέσω της σύζευξης. Το άθροισμα των τριών φάσεων είναι οι απώλειες του τροφοδότη.',
   '«Από τον έλεγχο»: ο ρυθμιστής ανεβαίνει μία λήψη τη φορά ώσπου το ρελέ του να δει τάση μέσα στη ζώνη 121–123 V, και σταματά στις λήψεις 9, 6, 9 (ρελέ 121,4 / 121,0 / 121,3 V). Οι λήψεις της δημοσίευσης (10, 8, 11) είναι κι αυτές μέσα στη ζώνη (122,2 / 122,6 / 122,9 V): μέσα στη ζώνη χωρούν δύο ή τρεις θέσεις, και ποια βγαίνει εξαρτάται από πού ξεκίνησε ο ρυθμιστής. Η χαμηλότερη τάση γίνεται 0,9598 pu.',
   '«Όλες στο μηδέν»: χωρίς ρύθμιση η φάση c του ζυγού 611 πέφτει στα 0,8954 pu και οι απώλειες ανεβαίνουν στα 124,6 kW. Η φάση b στον ζυγό 675 είναι στα 1,0041 pu, πάνω από την τάση της πηγής.',
   '«Ολόκληρο στο μέσο»: το κατανεμημένο φορτίο του τμήματος 632–671 είναι 200 kW από τα 3466 kW του τροφοδότη, και οι απώλειες γίνονται 111,05 αντί για 111,00 kW· οι τάσεις μένουν ίδιες στα τρία δεκαδικά. Όταν ένα κατανεμημένο φορτίο είναι το μόνο φορτίο του τμήματός του, το μέσο δίνει τη σωστή πτώση τάσης αλλά 50 % περισσότερες απώλειες.',
   '«Διάγραμμα του δικτύου»: η στρώση της ασυμμετρίας, και η στρώση των παραβιάσεων: ποιοι ζυγοί έχουν κάποια φάση πάνω από 1,05 pu; «Εξαγωγή αναφοράς»: η τάση και η γωνία κάθε φάσης απέναντι στη δημοσίευση, και τα ρεύματα και οι απώλειες κάθε τμήματος ανά φάση.'],
  build(o){const pr=ieee9Build({ev:'none',ctl:'none',meter:true});const opt={};if(['control','neutral'].includes(o.reg))opt.regulators=o.reg;if(o.spread==='middle')opt.spread='middle';
   pr.meta={...pr.meta,study:{net:o.net||'feeder13',study:'unbalanced',options:opt}};return pr;}});

 // 4.17 (§50): the IEEE 9 case in EMT with a three-phase m-SSSC (one arm per phase and the central controller) in series
 // with the line 7–6 at bus 7 (branch br5 of pcl.network, 6–7: the choice of pcl.network.sssc_placement), through a
 // coupling inductance (the line's π capacitances are on both sides). AVR, PSS and governors on the generators, so that
 // the swings after the step of X die out; the steady state against the load flow of pcl.network with the same X
 // (IEEE9_SSSC_LF, constant-impedance loads; tests/test_sssc.py checks the table)
 // the load flow of pcl.network for each X (Ω) at the end of each option: the case of ieee9() with the loads as constant
 // impedances (as the EMT), the coupling L_σ = 5 mH as a branch 7–7s carrying the compensator, the line 7–6 from 7s;
 // I (A RMS) and P, Q (MW, Mvar: into the compensator from bus 7), |V| (pu), V_q (V RMS). tests/test_sssc.py checks it
 const IEEE9_SSSC_LF={"0":{I:56.120506,P:-24.015718,Q:-24.155246,V5:1.01267,V7:1.015713,V9:0.995609,Vq:0.0},"60":{I:65.495709,P:-26.916683,Q:-29.598411,V5:1.012062,V7:1.022222,V9:0.996474,Vq:3929.742538},"18":{I:58.591406,P:-24.80338,Q:-25.5672,V5:1.012515,V7:1.017415,V9:0.995832,Vq:1054.645311},"-40":{I:51.404118,P:-22.461403,Q:-21.511406,V5:1.012953,V7:1.012495,V9:0.995191,Vq:-2056.164719}};
 const IEEE9_SSSC_X={x60:'0:0, 0.4:60',x18:'0:0, 0.4:18',xm40:'0:0, 0.4:-40'};
 T.push({id:'ieee9_sssc',group:'FACTS: CCSC και IEEE 9 με m-SSSC (4.17)',title:'IEEE 9 ζυγών σε EMT με τριφασικό m-SSSC (κεντρικός έλεγχος)',theory:'formula',topology:'ieee9_sssc',
  options:[{k:'X',label:'X_ref στη γραμμή 7–6 (στα 0,4 s)',options:[['x60','+60 Ω (χωρητική, 50 % της X της γραμμής)'],['x18','+18 Ω (η επιλογή του sssc_placement με ίσα βάρη)'],['xm40','−40 Ω (επαγωγική)']],def:'x60'},
   {k:'sync',label:'Συγχρονισμός',options:[['pos','Θετική ακολουθία (ένα τριφασικό PLL)'],['phase','Ανά φάση (SOGI)']],def:'pos'}],
  desc:'Το δίκτυο των 9 ζυγών του tutorial «IEEE 9 ζυγών σε EMT» (345 kV, 60 Hz, γεννήτριες του Anderson & Fouad με AVR, PSS και ρυθμιστές στροφών) με έναν τριφασικό αρθρωτό SSSC σε σειρά με τη γραμμή 7–6, στον ζυγό 7: έναν βραχίονα 10 × 1 kV (10 mF) ανά φάση με αυτεπαγωγή σύζευξης 5 mH, και τον κεντρικό ελεγκτή της 4.17. Η γραμμή είναι αυτή που διαλέγει η αναζήτηση θέσης του pcl.network (sssc_placement). Στα 0,4 s ο ελεγκτής πάει από X = 0 στη X_ref: η ροή στη διαδρομή 7–6 αλλάζει, οι γεννήτριες ταλαντεύονται και ηρεμούν σε νέα μόνιμη κατάσταση, που η κάρτα τη συγκρίνει με τη ροή φορτίου με την ίδια αντίδραση σε σειρά.',
  tasks:['Πόσο αλλάζει η ενεργός ισχύς στη γραμμή 7–6 με +60 Ω; Σύγκρινε στην κάρτα με τη ροή φορτίου.','Με την επιλογή του sssc_placement (+18 Ω) η αλλαγή είναι μικρή: γιατί η αναζήτηση την προτιμά; (δες τα κριτήρια: φόρτιση, απώλειες, απόκλιση τάσης, μέγεθος)','Πόση τάση χρειάζεται ο SSSC για +60 Ω, και πόση άεργο ισχύ ανταλλάσσει (3·X·I²);'],
  build(o){const N=10,Vdc=1000,X=IEEE9_SSSC_X[o.X]||IEEE9_SSSC_X.x60,Lk=5e-3,f=60;
   const ext={T:2.5,meta:{ieee9sssc:{N,Vdc,C:10e-3,X,Xf:{x60:60,x18:18,xm40:-40}[o.X]??60,Lk,f,line:'br5',sync:o.sync==='phase'?'phase':'pos',lf:IEEE9_SSSC_LF}},
    add(comps,wires,panes){const y0=-700;
     comps.push(C('SB1','EBUS',700,y0+260,{n:3},{flip:true}),C('SB2','EBUS',1160,y0+260,{n:3},{label:'προς τη γραμμή 7–6'}),
      C('SC3','SSSC3',1320,y0+260,{mode:'x',N,Vdc,C:10e-3,X,f0:f,sync:o.sync==='phase'?'phase':'pos'},{label:'κεντρικός έλεγχος'}));
     wires.push(['B7','SB1:bus',[[720,y0+260]]],['SB2:bus','L76:abc1',[[1230,y0+260],[1230,100],[790,100]]]);
     ['a','b','c'].forEach((ph,k)=>{const y=y0+260*k;
      comps.push(C('AM'+ph,'AM',800,y,{},{label:'i_'+ph}),C('LK'+ph,'L',890,y,{L:Lk},{label:'L_σ '+ph}),
       C('CH'+ph,'CHB',1020,y,{N,C:10e-3,Vdc,fs:10e3,sel:'reduced',band:30,impl:'fast'},{rot:3,label:'SSSC '+ph}));
      wires.push(['SB1:'+ph,'AM'+ph+':a',...(k===1?[]:[[[755,y0+240+20*k],[755,y]]])],['AM'+ph+':b','LK'+ph+':a'],['LK'+ph+':b','CH'+ph+':a'],
       ['CH'+ph+':b','SB2:'+ph,...(k===1?[]:[[[1120,y],[1120,y0+240+20*k]]])],
       ['AM'+ph+':y','SC3:i'+ph],['CH'+ph+':v','SC3:v'+ph],['CH'+ph+':vav','SC3:c'+ph],['SC3:r'+ph,'CH'+ph+':ref']);});
     panes.unshift([['Y:AMa','i_a (γραμμή 7–6)'],['Y:AMb','i_b'],['Y:AMc','i_c']],[['Y:SC3/XM','X (θετική ακολουθία)'],['Y:SC3/VQ','V_q (εντολή)']],[['Y:CHa/NLC:vav','V_C a'],['Y:CHb/NLC:vav','V_C b'],['Y:CHc/NLC:vav','V_C c']]);}};
   return ieee9Build({ev:'none',ctl:'full'},ext);}});
 // ------------------------------------------------------------------ 4.4: lines from geometry, CP and FD (ROADMAP §26)
 // the typical 400 kV line of 100 km (Parts.TLM_TYPICAL), with its models from tools/line_models.py (pcl/lineconst.py)
 const LM=()=>root.LineModels||(typeof require!=='undefined'?require('./linemodels.js'):null);
 // 4.13: model 'wb' with the options of tools/line_models.py (0,01 Hz – 1 MHz, passivity enforced); xbond: the homogeneous
 // cross-bonded cable ('bond', 'gnd') of the data
 function tlmPart(id,x,y,model,f,label,line='400kV',len=100,xb=''){const P=root.Parts,d=JSON.parse(JSON.stringify(P.TLM_TYPICAL[line]));if(xb)d.xbond=xb;
  const p={...P.defaults('TLM'),model,len,data:JSON.stringify(d)};if(model==='cp')p.f=f;if(model==='wb')Object.assign(p,{dec:8,wpas:'enforce'});
  const m=LM()?.[model==='cp'?`${line}|${len}|cp|${f}`:model==='wb'?`${line}${xb?'+'+xb:''}|${len}|wb`:`${line}|${len}|fd`];p.mdl=m?JSON.stringify({...m,src:P.tlmKey(p)}):'';return C(id,'TLM',x,y,p,{label});}
 // 4.9 (ROADMAP §31): transient recovery voltage of a breaker (IEC 62271-100) and the arc on a short-line fault
 // terminal fault at 145 kV: network equivalent, bus capacitance and n lines (open at their far ends) per phase, the
 // breaker with the voltage across its poles, a fault at its terminals; the first pole to clear against the rated TRV
 T.push({id:'trv_terminal',group:'Διακόπτες ισχύος (4.9)',title:'TRV σε σφάλμα ακροδεκτών: IEC 62271-100',theory:'formula',topology:'trv_terminal',
  options:[{k:'duty',label:'Δοκιμή (ρεύμα)',options:[['T100','T100: 100 % του I_sc (31,5 kA)'],['T60','T60: 60 %'],['T30','T30: 30 %'],['T10','T10: 10 %']],def:'T100'},
   {k:'kind',label:'Σφάλμα',options:[['abc','Τριφασικό χωρίς γη (k_pp = 1,5)'],['abcg','Τριφασικό με γη, X₀/X₁ = 3 (k_pp ≈ 1,3)']],def:'abc'},
   {k:'n',label:'Γραμμές στον ζυγό',options:[['6','6 γραμμές (Z_c/6 = 67 Ω)'],['4','4 γραμμές (100 Ω)'],['2','2 γραμμές (200 Ω)']],def:'6'},
   {k:'cb',label:'Χωρητικότητα ζυγού',options:[['20n','20 nF (καθυστέρηση ≈ 2 μs)'],['5n','5 nF'],['80n','80 nF']],def:'20n'},
   {k:'pole',label:'Πόλος',options:[['ideal','Ιδανικός (ανοίγει στο μηδέν)'],['arc','Με τόξο (βελτιωμένο Mayr)']],def:'ideal'}],
  desc:'Ένα δίκτυο 145 kV τροφοδοτεί ζυγό με χωρητικότητα και n γραμμές (Z_c = 400 Ω, κλεισμένες στη χαρακτηριστική τους εμπέδηση, όπως μακριές γραμμές προς άλλα δίκτυα: χωρίς ανακλάσεις). Στα άκρα του διακόπτη γίνεται σφάλμα στα 20 ms και ο διακόπτης ανοίγει στα 60 ms. Ο πρώτος πόλος που σβήνει βλέπει τη μεταβατική τάση επαναφοράς (TRV): στην κάρτα, απέναντι στην ονομαστική TRV του IEC 62271-100 για 145 kV / 31,5 kA.',
  tasks:['T100 με 6 γραμμές: η TRV μένει κάτω από τη γραμμή αναφοράς τεσσάρων παραμέτρων (u₁, t₁, u_c, t₂) και δεξιά από τη γραμμή καθυστέρησης;','Με 4 ή 2 γραμμές ο ρυθμός ανόδου μεγαλώνει (Z_c/n): το RRRV ξεπερνά τα 2 kV/μs;','Τριφασικό με γη: η TRV του πρώτου πόλου πέφτει (k_pp ≈ 1,3 αντί για 1,5).','T30/T10: λιγότερο ρεύμα, ο ρυθμός πέφτει, αλλά το πρότυπο ζητά μεγαλύτερο RRRV (5 και 7 kV/μs): η δοκιμή T10 αντιστοιχεί σε σφάλμα πίσω από μετασχηματιστή, με ελάχιστη χωρητικότητα.'],
  build(o){const duty=o.duty||'T100',fr={T100:1,T60:.6,T30:.3,T10:.1}[duty]||1,Isc=31.5e3*fr,Un=145e3,n=+o.n||6,Cb=Parts.parseEng(o.cb||'20n'),gnd=o.kind==='abcg';
   const grid={Un,Sk:Math.sqrt(3)*Un*Isc,XR:15,z0:'ratio',Z0Z1:gnd?3:1,XR0:15,conn:'sep'};
   const comps=[C('G1','GRID3',160,220,grid,{label:'δίκτυο 145 kV'}),C('CB1','CB3',520,220,{cmd:'0:1, 0.06:0',vm:true,model:o.pole==='arc'?'arc':'ideal',arc:'imayr'},{label:'CB'}),
    C('F1','FLT3',700,220,{kind:gnd?'abcg':'abc',ton:.02},{label:'σφάλμα'})];
   const wires=[['CB1:a2','F1:a'],['CB1:b2','F1:b'],['CB1:c2','F1:c']];
   ['a','b','c'].forEach((x,k)=>{const y=140+80*k;comps.push(C('B'+x,'JUNC',360,y),C('C'+x,'C',300,y+40,{C:Cb}),C('GC'+x,'GND',300,y+80),
     C('TL'+x,'TL',420,y+40,{spec:'zt',Z:400/n,tau:100e-6,nsec:1},{label:'γραμμές '+x}),C('GT'+x,'GND',360,y+80),C('RT'+x,'R',480,y+40,{R:400/n},{rot:1,label:'Z_c/n'}),C('GR'+x,'GND',480,y+80));
    wires.push(['G1:'+x,'B'+x+':j'],['B'+x+':j','CB1:'+x+'1'],['B'+x+':j','C'+x+':p'],['C'+x+':n','GC'+x+':g'],['B'+x+':j','TL'+x+':a1'],['TL'+x+':b1','GT'+x+':g'],['TL'+x+':b2','GT'+x+':g'],['TL'+x+':a2','RT'+x+':a'],['RT'+x+':b','GR'+x+':g']);});
   return project(comps,wires,{version:4,solve:{init:'ac'},sim:{hDiv:40000,method:'TR',speed:2,stopT:.064},
    scope:{panes:[[['Y:CB1/Va','TRV πόλου a'],['Y:CB1/Vb','TRV πόλου b'],['Y:CB1/Vc','TRV πόλου c']],[['Y:CB1/Ia','i_a'],['Y:CB1/Ib','i_b'],['Y:CB1/Ic','i_c']]],window:{unit:'s',n:.064}},
    meta:{trv:{Ur:Un,Isc:31.5e3,duty,kpp:gnd?1.3:1.5,topen:.06,n,Cb,pole:o.pole||'ideal'}}});}});
 // short-line fault at 245 kV / 50 kA (IEC 62271-100 §7.109, Annex A): source with the supply circuit's TRV, the
 // breaker with an arc, a short line (Z = 450 Ω) to the fault; L90 is the most severe for a weakened arc
 T.push({id:'trv_slf',group:'Διακόπτες ισχύος (4.9)',title:'Σφάλμα κοντινής γραμμής και τόξο του διακόπτη',theory:'formula',topology:'trv_slf',
  options:[{k:'ratio',label:'Δοκιμή',options:[['0.9','L90: I_L = 90 % του I_sc'],['0.75','L75'],['0.95','L95 (πιο κοντά)'],['0.6','L60']],def:'0.9'},
   {k:'arc',label:'Μοντέλο τόξου',options:[['imayr','Mayr βελτιωμένο (από μετρήσεις)'],['kema','Τρία τροποποιημένα Mayr'],['habedank','Cassie + Mayr'],['mayr','Mayr']],def:'imayr'},
   {k:'state',label:'Διακόπτης',options:[['1','Όπως στις μετρήσεις'],['weak','Εξασθενημένος (λιγότερη ψύξη)'],['vweak','Πολύ εξασθενημένος']],def:'1'}],
  desc:'Μονοφασικό κύκλωμα δοκιμής κοντινής γραμμής (IEC 62271-100, Σχ. 48): πηγή U_r/√3 με αυτεπαγωγή για I_sc = 50 kA, χωρητικότητα και αντίσταση της πλευράς της πηγής, ο διακόπτης με τόξο (χωρισμός επαφών στα 14,7 ms) και γραμμή Z = 450 Ω μήκους τέτοιου ώστε το ρεύμα να είναι I_L. Μετά το μηδέν η πλευρά της γραμμής δίνει πριονωτή τάση με ρυθμό s·I_L: το τόξο πρέπει να ψυχθεί μέσα σε λίγα μs.',
  tasks:['L90 με τον διακόπτη των μετρήσεων: διακοπή στο πρώτο μηδέν, ρεύμα μετά το τόξο λίγα mA.','Εξασθενημένος: στο L90 θερμική επανέναυση, στο L75 και στο L60 διακοπή (στο L95 ανάλογα με το μοντέλο). Γιατί το πρότυπο ζητά L90 και L75;','Mayr με σταθερή ισχύ ψύξης P₀: αποτυγχάνει ήδη στο L90 με τις τιμές των μετρήσεων. Τι προσθέτει ο όρος P₁·u·i του βελτιωμένου Mayr;','Σύγκρινε στην κάρτα το u₀, το u_L*, το t_L και την TRV στην πρώτη κορυφή με τους τύπους του Παραρτήματος A.'],
  build(o){const Ur=245e3,Isc=50e3,f=50,w=2*Math.PI*f,r=+o.ratio||0.9,UG=Ur/Math.sqrt(3),LS=UG/(w*Isc),IL=r*Isc,LL=UG*(1-r)/(IL*w),Z=450,tsep=0.0147,
    // supply side as in Annex A: R_s ∥ C_d behind L_S, with the rated RRRV of the supply circuit (2 kV/µs at I_sc) and its delay t_d (2 µs)
    sup=window.TRV?TRV.rated(Ur,'SLF',null,'S1',f):{rrrv:2e9,td:2e-6},Rs=sup.rrrv/(Math.SQRT2*w*Isc),Cd=sup.td/Rs;
   const arcP={arc:o.arc||'imayr',cmd:'0:1, '+tsep+':0'},WEAK={imayr:[.33,.25],mayr:[.45,.3],kema:[.35,.25],habedank:[.7,.45]},sc=o.state==='weak'?WEAK[arcP.arc][0]:o.state==='vweak'?WEAK[arcP.arc][1]:1;
   // the cooling power scaled: P₀ (Mayr), Π₂ and so Π₃ (three Mayr), P_m (Cassie + Mayr); the factors put the weak breaker
   // just past thermal failure at L90 while L75 and L60 still clear (runs in tests/test_trv.py)
   if(sc!==1){if(arcP.arc==='kema')arcP.Pi2=String(30*sc);else if(arcP.arc==='habedank')arcP.Pm=String(30e3*sc);else arcP.P0=String(15917*sc);}
   const comps=[C('V1','VAC',100,220,{Vpk:UG*Math.SQRT2,f,phase:0},{label:'U_r/√3'}),C('LS','L',220,140,{L:LS},{label:'L_S'}),C('J1','JUNC',340,140),
    C('CD','C',340,240,{C:Cd},{label:'C_d'}),C('RS','R',420,240,{R:Rs},{rot:1,label:'R_s'}),C('CB1','ARC',520,140,arcP,{label:'CB'}),
    C('TL1','TL',700,160,{spec:'zt',Z,tau:LL/Z,nsec:1},{label:'γραμμή'}),C('G1','GND',100,320),C('G2','GND',340,320),C('G3','GND',420,320),C('G4','GND',640,320),C('G5','GND',780,320)];
   const wires=[['V1:p','LS:a'],['LS:b','J1:j'],['V1:n','G1:g'],['J1:j','CD:p'],['CD:n','G2:g'],['J1:j','RS:a'],['RS:b','G3:g'],['J1:j','CB1:a'],['CB1:b','TL1:a1'],['TL1:b1','G4:g'],['TL1:a2','G5:g'],['TL1:b2','G5:g']];
   return project(comps,wires,{version:4,solve:{init:'ac'},sim:{hDiv:400000,method:'TR',speed:0.05,stopT:0.0156},
    scope:{panes:[[['Y:CB1/V','τάση διακόπτη (TRV)']],[['Y:CB1/I','ρεύμα τόξου']],[['Garc:CB1/A1','αγωγιμότητα τόξου']]],window:{unit:'s',n:0.0156}},
    meta:{slf:{Ur,Isc,f,ratio:r,arc:arcP.arc,state:sc,tsep,LL,LS,Z,Rs,Cd}}});}});
 // 4.9 (ROADMAP §51): a lightning stroke on a 400 kV line next to a GIS substation and the insulation coordination of the
 // substation, after the structure of the EMTP example «Insulation coordination of a 765 kV GIS»: a long FD section
 // against reflections, three towers with 300 m FD spans (the ground wires kept as conductors 4 and 5), footing R(I) with
 // soil ionization, insulator strings that flash over, ZnO arresters with the IEEE model, bushings and GIS bus ducts as
 // lossless lines, an open breaker in the GIS and the transformer as a capacitance. Values of the elements: typical
 // (EMTP example, IEEE WG 3.4.11 for the arrester, CIGRE TB 63 for the footing).
 function tlmGW(id,x,y,len,label,wb){const P=root.Parts,p={...P.defaults('TLM'),model:wb?'wb':'fd',len,data:JSON.stringify(P.TLM_TYPICAL['400kV-gw'])};
  // 4.13: the wideband lines of the same data (0,01 Hz – 10 MHz, passivity enforced) instead of FD with T_i at 500 kHz
  if(wb)Object.assign(p,{dec:9,wpas:'enforce'});else p.fti=5e5;
  const m=LM()?.[wb?`400kV-gw|${len}|wb`:`400kV-gw|${len}|fd|500k`];p.mdl=m?JSON.stringify({...m,src:P.tlmKey(p)}):'';return C(id,'TLM',x,y,p,{label});}
 const note=(id,x,y,text,o={})=>C(id,'NOTE',x,y,{text,size:o.size||16,bold:!!o.bold,color:o.color||'ink',frame:!!o.frame},{label:''});
 T.push({id:'lightning_gis',group:'Κεραυνοί και συντονισμός μόνωσης (4.9)',title:'Κεραυνός σε γραμμή 400 kV δίπλα σε υποσταθμό GIS: συντονισμός μόνωσης',theory:'formula',topology:'lightning_gis',
  options:[{k:'strike',label:'Πλήγμα',options:[['tower','Στην κορυφή του πύργου T2 (ανάστροφη υπερπήδηση)'],['phase','Στη φάση a δίπλα στον T2 (αστοχία θωράκισης)']],def:'tower'},
   {k:'I',label:'Ρεύμα κεραυνού (αρνητικό, 3/100 μs)',options:[['200','200 kA'],['100','100 kA'],['50','50 kA'],['20','20 kA'],['10','10 kA']],def:'200'},
   {k:'foot',label:'Γείωση πύργων',options:[['ion','R(I) με ιονισμό, R₀ = 15 Ω'],['r','Σταθερή 15 Ω'],['r50','Σταθερή 50 Ω (κακή γείωση)']],def:'ion'},
   {k:'sa',label:'Αλεξικέραυνα',options:[['both','Στην είσοδο και στον μετασχηματιστή'],['entry','Μόνο στην είσοδο'],['none','Χωρίς']],def:'both'},
   {k:'cb',label:'Διακόπτης στο GIS',options:[['open','Ανοιχτός'],['closed','Κλειστός']],def:'open'},
   {k:'impl',label:'Υλοποίηση πύργων και αλεξικέραυνων (4.9.1)',options:[['blocks','Αναλυτική από στοιχεία'],['fast','Γρήγορη (συμπαγή στοιχεία του λύτη)']],def:'blocks'},
   {k:'u50',label:'Τάση λειτουργίας 50 Hz (4.12)',options:[['0','Χωρίς (μόνο ο κεραυνός)'],['peak','420 kV, η φάση a στο θετικό μέγιστο'],['zero','420 kV, η φάση a στο μηδέν'],['neg','420 kV, η φάση a στο αρνητικό μέγιστο']],def:'0'},
   {k:'lm',label:'Μοντέλο γραμμών (4.13)',options:[['fd','FD (J. Marti, T_i στα 500 kHz)'],['wb','WB: wideband στο πεδίο των φάσεων (0,01 Hz – 10 MHz)']],def:'fd'},
   {k:'tm',label:'Μοντέλο πύργων (4.22)',options:[['line','Μία γραμμή (Z_t = 200 Ω)'],['ms','Πολλών ορόφων (Z_t1 = 220 Ω, Z_t2 = 150 Ω, γ = 0,8, ένας βραχίονας)']],def:'line'},
   {k:'ins',label:'Αλυσίδες μονωτήρων (4.22)',options:[['ub','Διάσπαση στα 2,24 MV'],['de','Καμπύλη τάσης–χρόνου (U₀ = 1,7 MV, D = 0,5 V·s)'],['lpm','Πρόοδος οχετού (LPM, g = 3,2 m)']],def:'ub'}],
  desc:'Κεραυνός 3/100 μs πέφτει στον πύργο T2 μιας γραμμής 400 kV (ή στη φάση a, αν περάσει τη θωράκιση). Η γραμμή είναι η τυπική 400 kV από τη γεωμετρία με τους δύο αγωγούς προστασίας ως αγωγούς 4 και 5, σε μοντέλο FD: ανοίγματα 300 m και ένα τμήμα 30 km προς το δίκτυο, ώστε οι ανακλάσεις να μη γυρίσουν μέσα στα 50 μs. Κάθε πύργος είναι μια γραμμή χωρίς απώλειες (Z_t = 200 Ω, 27 m) με γείωση R(I) και αλυσίδες μονωτήρων που διασπώνται στα 2,24 MV. Το κύμα μπαίνει στον υποσταθμό: αλεξικέραυνο ZnO (μοντέλο IEEE, U₁₀ = 819 kV) και CVT στην είσοδο, διαπεραστής, ζυγοί GIS (Z = 73 Ω), μετασχηματιστής τάσης, ανοιχτός διακόπτης, και στην άλλη πλευρά ο μετασχηματιστής ισχύος (4 nF) με το δικό του αλεξικέραυνο. Οι τάσεις συγκρίνονται με το επίπεδο αντοχής σε κεραυνό του εξοπλισμού 420 kV (1425 kV) και με τον συντελεστή ασφαλείας 1,15 (IEC 60071-2).',
  tasks:['200 kA στον πύργο: ποιες αλυσίδες διασπώνται και πότε; Δες στην κάρτα την τάση της κορυφής του T2 και τις τάσεις των μονωτήρων.','Γείωση 50 Ω αντί για R(I): η κορυφή ανεβαίνει και η διάσπαση γίνεται νωρίτερα και με μικρότερο ρεύμα. Από ποιο ρεύμα και πάνω υπάρχει ανάστροφη υπερπήδηση;','Πλήγμα στη φάση με 10–20 kA (αστοχία θωράκισης): η υπέρταση φτάνει απευθείας στον υποσταθμό.','Χωρίς αλεξικέραυνα: πόσο ξεπερνά η τάση στον ανοιχτό διακόπτη το 1425 kV; Με αλεξικέραυνο μόνο στην είσοδο: πόση είναι η απόσταση προστασίας (σύγκρινε με U ≈ U_res + 2·S·d/v της κάρτας);','Κλειστός διακόπτης: το κύμα φτάνει στον μετασχηματιστή. Χρειάζεται εκεί δεύτερο αλεξικέραυνο;','Άνοιξε τον πύργο ή το αλεξικέραυνο (διπλό κλικ): δες τι έχουν μέσα. Τα κείμενα στο σχέδιο είναι στοιχεία «Σημείωση».'],
  build(o){const I=(+o.I||200)*1e3,ion=o.foot==='ion',R0=o.foot==='r50'?50:15,sa=o.sa||'both',open=o.cb!=='closed',Y0=200,PHS=['a','b','c'],rowY=[160,360,560];
   const impl=o.impl==='fast'?'fast':'blocks',tw=(id,x,lab,r0)=>C(id,'TOWER',x,Y0,{h:27.15,Zt:200,vt:3e8,foot:ion?'ion':'r',R0:r0,rho:100,E0:400e3,ins:'ub',Ub:2.24e6,meas:true,impl,
     // 4.22: the multistory tower (one crossarm at 20 m for the three phases) and the other models of the strings
     ...(o.tm==='ms'?{model:'ms',Zt1:220,Zt2:150,gam:.8,arms:'one',h1:7.15,h2:6,h3:6}:{}),...(o.ins==='de'?{ins:'de',U0:1.7e6,kde:1,Dde:.5}:o.ins==='lpm'?{ins:'lpm',gl:3.2}:{})},{label:lab});
   const WBL=o.lm==='wb',comps=[tlmGW('L30',260,Y0,30,'30 km',WBL),tw('T1',400,'T1',R0),tlmGW('S1',540,Y0,0.3,'300 m',WBL),tw('T2',680,'T2',R0),tlmGW('S2',820,Y0,0.3,'300 m',WBL),tw('T3',960,'T3',o.foot==='r50'?R0:1),
    C('I1','ILG',620,60,{shape:'custom',model:'heidler',T1:3e-6,T2:100e-6,n:10,Ipk:-I,t0:1e-6},{label:'κεραυνός'}),C('GI','GND',620,110),
    C('RTa','R',110,290,{R:400},{rot:1,label:'R_a'}),C('RTb','R',140,290,{R:400},{rot:1,label:'R_b'}),C('RTc','R',170,290,{R:400},{rot:1,label:'R_c'}),
    J('JW',205,230),C('GW','GND',205,300)];
   // 4.12: the network behind the 400 Ω terminations at 420 kV, 50 Hz (the lines start from the steady state): the phase of
   // phase a at the stroke (t₀ = 1 μs) at its positive peak, zero or negative peak
   const u50=['peak','zero','neg'].includes(o.u50)?o.u50:'',Vs=420e3*Math.SQRT2/Math.sqrt(3),ph0={peak:90,zero:0,neg:-90}[u50]-360*50*1e-6;
   const wires=[['L30:a1','RTa:a',[[110,160]]],['L30:b1','RTb:a',[[140,180]]],['L30:c1','RTc:a',[[170,200]]],
    ['L30:d1','JW:j',[[205,220]]],['L30:e1','JW:j',[[205,240]]],['JW:j','GW:g'],['I1:n','GI:g']];
   PHS.forEach((x,k)=>{const xs=[110,140,170][k];
    if(!u50){comps.push(C('GT'+x,'GND',xs,330));wires.push(['RT'+x+':b','GT'+x+':g']);return;}
    const xv=[90,140,190][k];comps.push(C('VS'+x,'VAC',xv,380,{Vpk:Vs,f:50,phase:ph0-120*k},{label:'u_'+x}),C('GT'+x,'GND',xv,440));
    wires.push(['RT'+x+':b','VS'+x+':p',[[xs,330],[xv,330]]],['VS'+x+':n','GT'+x+':g']);});
   const chain=[['L30','T1'],['T1','S1'],['S1','T2'],['T2','S2'],['S2','T3']];
   for(const [a,b] of chain)for(const x of ['a','b','c','d','e'])wires.push([a+':'+x+'2',b+':'+x+'1']);
   wires.push(o.strike==='phase'?['I1:p','T2:a2',[[730,20],[730,160]]]:['I1:p','T2:d2',[[740,20],[740,220]]]);
   const tl=(id,x,Y,len,Z,lab)=>C(id,'TL',x,Y+20,{spec:'zl',Z,len,vel:3e8},{label:lab});
   PHS.forEach((ph,k)=>{const Y=rowY[k],q=s=>s+ph,G=(id,x,y)=>comps.push(C(q(id),'GND',x,y));
    // from the last tower to the row of this phase
    wires.push(['T3:'+ph+'2',q('Lc')+':a',k===0?[]:[[1030+20*(k-1),Y0-40+20*k],[1030+20*(k-1),Y]]]);
    comps.push(C(q('Lc'),'L',1110,Y,{L:10e-6},{label:'10 μH'}),J(q('JE'),1180,Y),C(q('VE'),'VP',1180,Y-40,{},{label:'u_E'+ph}),C(q('Cv'),'C',1180,Y+60,{C:4e-9},{label:'CVT'}),J(q('J2'),1240,Y),
     C(q('Lb'),'L',1310,Y,{L:10e-6},{label:'10 μH'}),tl(q('TB'),1430,Y,8,250,'διαπεραστής'),J(q('JB'),1530,Y),C(q('CB'),'C',1530,Y+60,{C:0.1e-9},{label:'0,1 nF'}),
     tl(q('TG'),1630,Y,48,73,'GIS 48 m'),J(q('JG'),1730,Y),C(q('VG'),'VP',1730,Y-40,{},{label:'u_G'+ph}),C(q('Cvt'),'C',1730,Y+60,{C:0.1e-9},{label:'VT'}),
     C(q('BR'),'R',1800,Y,{R:open?1e6:1e-3},{label:open?'CB ανοιχτός':'CB κλειστός'}),tl(q('TH'),1930,Y,52,73,'GIS 52 m'),J(q('JH'),2030,Y),C(q('CH'),'C',2030,Y+60,{C:0.1e-9},{label:'0,1 nF'}),
     tl(q('TC'),2130,Y,8,250,'διαπεραστής'),C(q('Lt'),'L',2250,Y,{L:10e-6},{label:'10 μH'}),J(q('JT'),2330,Y),C(q('VT'),'VP',2330,Y-40,{},{label:'u_T'+ph}),C(q('Ct'),'C',2330,Y+60,{C:4e-9},{label:'μετασχ. 4 nF'}));
    G('GCv',1180,Y+100);G('GB',1530,Y+100);G('GVt',1730,Y+100);G('GH',2030,Y+100);G('GCt',2330,Y+100);
    for(const [t,x] of [['TB',1490],['TG',1690],['TH',1990],['TC',2190]])G('G'+t,x,Y+50);
    wires.push([q('Lc')+':b',q('JE')+':j'],[q('JE')+':j',q('VE')+':p'],[q('JE')+':j',q('Cv')+':p'],[q('Cv')+':n',q('GCv')+':g'],[q('JE')+':j',q('J2')+':j'],[q('J2')+':j',q('Lb')+':a'],
     [q('Lb')+':b',q('TB')+':a1'],[q('TB')+':a2',q('JB')+':j'],[q('JB')+':j',q('CB')+':p'],[q('CB')+':n',q('GB')+':g'],[q('JB')+':j',q('TG')+':a1'],[q('TG')+':a2',q('JG')+':j'],
     [q('JG')+':j',q('VG')+':p'],[q('JG')+':j',q('Cvt')+':p'],[q('Cvt')+':n',q('GVt')+':g'],[q('JG')+':j',q('BR')+':a'],[q('BR')+':b',q('TH')+':a1'],[q('TH')+':a2',q('JH')+':j'],
     [q('JH')+':j',q('CH')+':p'],[q('CH')+':n',q('GH')+':g'],[q('JH')+':j',q('TC')+':a1'],[q('TC')+':a2',q('Lt')+':a'],[q('Lt')+':b',q('JT')+':j'],[q('JT')+':j',q('VT')+':p'],
     [q('JT')+':j',q('Ct')+':p'],[q('Ct')+':n',q('GCt')+':g']);
    for(const [t,x] of [['TB',1430],['TG',1630],['TH',1930],['TC',2130]])wires.push([q(t)+':b1',q(t)+':b2'],[q(t)+':b2',q('G'+t)+':g']);
    const sa1=sa!=='none',sa2=sa==='both',arr=(id,x)=>C(q(id),'SAI',x,Y+70,{U10:819e3,d:3.216,n:1,kL1:1,Llead:5e-6,meas:true,impl},{label:'ZnO'});
    if(sa1){comps.push(arr('SE',1260));G('GSE',1260,Y+120);wires.push([q('J2')+':j',q('SE')+':a',[[1260,Y]]],[q('SE')+':b',q('GSE')+':g']);}
    if(sa2){comps.push(arr('ST',2400));G('GST',2400,Y+120);wires.push([q('JT')+':j',q('ST')+':a',[[2400,Y]]],[q('ST')+':b',q('GST')+':g']);}});
   comps.push(note('N1',40,-200,'Συντονισμός μόνωσης υποσταθμού GIS 400 kV: κεραυνός στη γραμμή',{size:28,bold:true,frame:true}),
    note('N2',40,-140,(o.strike==='phase'?'– Αστοχία θωράκισης: πλήγμα στη φάση a':'– Ανάστροφη υπερπήδηση: πλήγμα στην κορυφή του πύργου T2')+'\n– Γείωση πύργων R(I) = R₀/√(1 + I/I_g) με ιονισμό του εδάφους\n– Αλεξικέραυνα ZnO με το μοντέλο IEEE (εξάρτηση από τη συχνότητα)\n– Γραμμές FD από τη γεωμετρία, οι αγωγοί προστασίας ως αγωγοί 4 και 5',{size:16}),
    note('N3',u50?-60:40,u50?470:360,u50?'Δίκτυο 420 kV, 50 Hz\n(πίσω από 400 Ω)':'Δίκτυο\n(τερματισμός 400 Ω)',{size:15,bold:true}),note('N4',200,80,'Γραμμή 400 kV: 30 km, ώστε να μη\nγυρίσουν ανακλάσεις μέσα στα 50 μs',{size:14,color:'muted'}),
    note('N5',470,300,'Ανοίγματα 300 m, πύργοι T1–T3\n(Z_t = 200 Ω, h = 27 m, μονωτήρες 2,24 MV)',{size:14,color:'muted'}),
    note('N6',650,-60,`${I/1e3} kA, 3/100 μs`,{size:16,bold:true,color:'red'}),
    note('N7',1080,60,'Υποσταθμός αέρα (AIS)',{size:20,bold:true,color:'blue'}),note('N8',1560,60,'Υποσταθμός GIS (SF₆)',{size:20,bold:true,color:'blue'}),
    note('N9',2120,60,'Αέρας και μετασχηματιστής ισχύος',{size:20,bold:true,color:'blue'}),
    note('N10',1700,680,'Επίπεδο αντοχής σε κεραυνό (420 kV): 1425 kV\nμε συντελεστή ασφαλείας 1,15: 1239 kV',{size:15,color:'red'}));
   const PANE=(pre,lab)=>PHS.map(ph=>['Y:'+pre+ph,lab+' '+ph]);
   const panes=[PANE('VE','u_E'),PANE('VG','u_G (GIS)'),PANE('VT','u_T (μετασχ.)'),[['Y:T2/Vtop','κορυφή T2'],['Y:T2/Ua','μονωτήρας a'],['Y:T2/Ub','μονωτήρας b'],['Y:T2/Uc','μονωτήρας c']],
    [['I:I1','κεραυνός'],['Y:T2/If','βάση T2'],...(sa!=='none'?[['Y:SEa/I','ZnO είσοδος a']]:[])]];
   const stopT=50e-6;
   return project(comps,wires,{version:4,...(u50?{solve:{init:'ac'}}:{}),sim:{hDiv:u50?1.5e6:2,method:'TR',speed:400,stopT},scope:{panes,window:{unit:'s',n:stopT}},
    meta:{lg:{I,u50,Vs,strike:o.strike||'tower',foot:o.foot||'ion',R0,rho:100,E0:400e3,sa,open,Zt:200,h:27.15,Ub:2.24e6,U10:819e3,LIWL:1425e3,Ks:1.15,dist:56,v:3e8,t0:1e-6,stop:stopT,
     ...(o.tm==='ms'?{tm:'ms'}:{}),...(o.ins&&o.ins!=='ub'?{ins:o.ins}:{})}}});}});
 // 4.22: the 765 kV GIS of IEC TR 60071-4 (test case 4, Table 29: surge impedance and travel time of each part; the table's
 // «J7 – T25» is J7 – T26 in its Figure 40). Each part a lossless line, its outer conductor (the enclosure) earthed.
 const GIS765=[['UC1','J3',75,6.4],['J3','J4',75,48],['J4','T22',75,2.2],['T22','T23',51,1.9],['J4','D9',78,2.2],['D9','D88',68,1.8],['D88','D66',59,4.2],['D44','D22',33,5.8],
  ['D22','D1',330,9.1],['J3','T21',75,2.2],['T21','T20',51,1.9],['T20','T19',160,.67],['T19','T18',65,1.7],['T19','T17',75,6.8],['T17','T16',65,1.7],['T17','J7',75,8.5],['J7','T24',75,2.2],
  ['T24','T25',51,1.9],['J7','T26',75,2.2],['T26','T27',51,1.9],['T17','T14',160,.67],['T14','T13',51,1.9],['T13','T11',75,9.9],['T11','T12',65,1.7],['T11','J2',75,7.5],['J2','T9',75,2.2],
  ['T9','T10',51,1.9],['T10','T28',160,.67],['T28','J6',75,7.1],['J6','UK',75,6.4],['T28','T29',65,1.7],['T28','J5',75,8.8],['J5','T30',75,2.2],['T30','T32',51,1.9],['J2','J1',75,6.7],
  ['J1','T4',75,2.2],['T4','T3',51,1.9],['J1','T5',75,2.2],['T5','T6',51,1.9]];
 // the nodes in the drawing (our layout of the connectivity of Figure 40)
 const GIS765_XY={T23:[200,400],T22:[400,400],J4:[600,400],J3:[800,400],T21:[1000,400],T20:[1300,400],T19:[1600,400],T18:[1800,400],UC1:[800,600],
  D9:[600,200],D88:[600,0],D66:[600,-200],D44:[600,-400],D22:[600,-600],D1:[600,-800],
  T25:[1200,0],T24:[1400,0],J7:[1600,0],T26:[1800,0],T27:[2000,0],T12:[2700,0],T4:[3200,0],T3:[3200,-200],
  T16:[1400,200],T17:[1600,200],T14:[1800,200],T13:[2000,200],T11:[2700,200],J2:[2950,200],J1:[3200,200],T5:[3200,400],T6:[3200,600],
  T9:[2950,400],T10:[2950,600],T28:[2950,800],UK:[2450,800],J6:[2700,800],J5:[3150,800],T30:[3350,800],T32:[3550,800],T29:[2950,1000],DSL:[900,400]};
 // the parts of the GIS as lines between the nodes (horizontal or vertical); v0(node pair) the initial voltage of each part
 function gisLines(list,v0,comps,wires){const nodes=new Set();for(const [a,b] of list){nodes.add(a);nodes.add(b);}
  for(const n of nodes){const [x,y]=GIS765_XY[n];comps.push(J('N_'+n,x,y));}
  list.forEach(([a,b,Z,tau],i)=>{let [xa,ya]=GIS765_XY[a],[xb,yb]=GIS765_XY[b],A=a,B=b;
   if(ya===yb&&xa>xb||xa===xb&&ya>yb){[xa,ya,xb,yb,A,B]=[xb,yb,xa,ya,b,a];}const id='L'+(i+1),v=v0?v0(a,b):0,p={spec:'zt',Z,tau:+(tau*1e-9).toPrecision(6),...(v?{v0:+v.toPrecision(8)}:{})};
   if(ya===yb){const xm=(xa+xb)/2;comps.push(C(id,'TL',xm,ya+20,p,{label:a+'–'+b,lbl:'none'}),C('G'+id,'GND',xm,ya+70,{},{label:''}));
    wires.push(['N_'+A+':j',id+':a1'],[id+':a2','N_'+B+':j'],[id+':b1',id+':b2'],[id+':b2','G'+id+':g',[[xm,ya+40]]]);}
   else{const ym=(ya+yb)/2;comps.push(C(id,'TL',xa-20,ym,p,{rot:1,label:a+'–'+b,lbl:'none'}),C('G'+id,'GND',xa-80,ym+70,{},{label:''}));
    wires.push(['N_'+A+':j',id+':a1'],[id+':a2','N_'+B+':j'],[id+':b1',id+':b2'],[id+':b2','G'+id+':g',[[xa-80,ym+60]]]);}});}
 T.push({id:'gis765_lv',group:'Υποσταθμός GIS και πολύ γρήγορα μεταβατικά (4.22)',title:'GIS 765 kV: δοκιμή με βηματική τάση 100 V (IEC TR 60071-4, περίπτωση 4)',theory:'formula',topology:'gis765_lv',
  options:[{k:'src',label:'Πηγή',options:[['ramp','Ράμπα 4 ns ως τα 100 V στο UC1 (πίσω από 75 Ω)'],['switch','Ράμπα ως το μέγιστο και μετά διακόπτης (Σχήμα 42)']],def:'ramp'}],
  desc:'Το τμήμα του GIS 765 kV της περίπτωσης δοκιμής 4 του IEC TR 60071-4: 39 κομμάτια ζυγών, γωνιών, διακοπτών και μετασχηματιστών οργάνων, το καθένα γραμμή χωρίς απώλειες με την κυματική αντίσταση και τον χρόνο διάδοσης του Πίνακα 29, μια αντίσταση 100 Ω και μια χωρητικότητα 10 pF. Στο UC1 μπαίνει βηματική τάση 100 V με μέτωπο 4 ns μέσα από αντίσταση 75 Ω που ταιριάζει με τον ζυγό, και στο UK η γραμμή κλείνει σε 75 Ω. Η κάρτα συγκρίνει τις τάσεις στο UC1 και στο UK με μια ανεξάρτητη λύση με οδεύοντα κύματα (μέθοδος των χαρακτηριστικών, pcl.surge) και με όσα δείχνουν τα Σχήματα 41 και 42 του TR.',
  tasks:['Πότε φτάνει το κύμα στο UK; Βρες τη διαδρομή από το UC1 και πρόσθεσε τους χρόνους διάδοσης του πίνακα.','Γιατί η τάση στο UC1 πέφτει από τα 100 V σε περίπου 67 V μετά από 12,8 ns; (τρεις ζυγοί 75 Ω στο J3)','Σύγκρινε ράμπα και διακόπτη: μόνο τα πρώτα ns κοντά στο UC1 διαφέρουν.'],
  build(o){const sw=o.src==='switch',comps=[],wires=[];gisLines(GIS765,null,comps,wires);
   comps.push(C('RD','R',600,-300,{R:100},{rot:1,label:'100 Ω'}),C('CD1','C',720,-800,{C:10e-12},{rot:0,label:'10 pF'}),C('GCD','GND',720,-720,{},{label:''}),
    C('RS','R',800,720,{R:75},{rot:1,label:'75 Ω'}),C('VS','VIMP',800,880,{shape:'ramp',S:5e10,Vpk:200},{label:'ράμπα 4 ns'}),C('GVS','GND',800,960,{},{label:''}),
    C('RK','R',2450,900,{R:75},{rot:1,label:'75 Ω'}),C('GRK','GND',2450,980,{},{label:''}),C('VUC','VP',880,560,{},{label:'u_UC1'}),C('VUK','VP',2380,760,{},{label:'u_UK'}));
   wires.push(['N_D66:j','RD:a'],['RD:b','N_D44:j'],['N_D1:j','CD1:p',[[720,-830]]],['CD1:n','GCD:g'],['N_UC1:j','VUC:p',[[880,600]]],['N_UK:j','VUK:p',[[2380,800]]],['N_UK:j','RK:a',[[2450,840]]],['RK:b','GRK:g']);
   if(sw){comps.push(C('SW1','SG',800,650,{Ub:1e9,trig:'4n',Rarc:1e-6,ext:'never'},{rot:1,label:'διακόπτης στα 4 ns'}));wires.push(['N_UC1:j','SW1:a'],['SW1:b','RS:a'],['RS:b','VS:p'],['VS:n','GVS:g']);}
   else wires.push(['N_UC1:j','RS:a'],['RS:b','VS:p'],['VS:n','GVS:g']);
   comps.push(note('N1',150,-1000,'GIS 765 kV: βηματική 100 V με μέτωπο 4 ns (IEC TR 60071-4, περίπτωση δοκιμής 4)',{size:26,bold:true,frame:true}),
    note('N2',150,-930,'Κάθε κομμάτι του GIS είναι γραμμή χωρίς απώλειες (Z, τ του Πίνακα 29)· το περίβλημα γειωμένο.',{size:15,color:'muted'}));
   const stopT=0.5e-6;
   return project(comps,wires,{version:4,sim:{hDiv:4,method:'TR',speed:200,stopT},scope:{panes:[[['Y:VUC','u_UC1']],[['Y:VUK','u_UK']]],window:{unit:'s',n:stopT}},
    meta:{gis:{kind:'lv',src:sw?'switch':'ramp',E:200,Rs:75,Rk:75,tr:4e-9,stop:stopT}}});}});
 // 4.22: very-fast-front overvoltages: the same GIS at 800 kV with a disconnector that strikes between the side of the bushing
 // (at the source voltage) and a bus with a trapped charge; every part of the bus starts at its voltage (TL v₀)
 T.push({id:'gis_vfto',group:'Υποσταθμός GIS και πολύ γρήγορα μεταβατικά (4.22)',title:'Πολύ γρήγορα μεταβατικά (VFTO) από τον αποζεύκτη ενός GIS 800 kV',theory:'formula',topology:'gis_vfto',
  options:[{k:'tc',label:'Παγιδευμένο φορτίο στον ζυγό',options:[['-1','−1 pu (το χειρότερο)'],['-0.5','−0,5 pu'],['0','Χωρίς']],def:'-1'},
   {k:'rs',label:'Πλευρά του διαπεραστή',options:[['75','75 Ω (ταιριαστή, όπως η περίπτωση δοκιμής)'],['350','350 Ω (εναέρια γραμμή)']],def:'75'},
   {k:'uk',label:'Στο UK',options:[['c','Χωρητικότητα 500 pF (διαπεραστής, CVT)'],['open','Ανοιχτό']],def:'c'},
   {k:'rarc',label:'Αντίσταση του σπινθήρα',options:[['0.5','0,5 Ω'],['5','5 Ω'],['20','20 Ω']],def:'0.5'}],
  desc:'Ο ίδιος υποσταθμός GIS της περίπτωσης δοκιμής 4, στα 800 kV. Ο αποζεύκτης ανάμεσα στο J3 (πλευρά του διαπεραστή, στην τάση πηγής +1 pu = √2·800/√3 kV) και στο T21 κλείνει με διάσπαση στο 1 ns, ενώ ο ζυγός πίσω του έχει παγιδευμένο φορτίο. Κάθε κομμάτι ξεκινά με την τάση του (αρχική τάση της γραμμής). Τα κύματα που ξεκινούν από τον σπινθήρα ανακλώνται στα ανοιχτά άκρα (T18, T29, T3, T6, …) και δίνουν υπερτάσεις πολύ ταχέος μετώπου ως 2–3 pu. Η κάρτα δείχνει τις κορυφές, τη σύγκριση με την ανεξάρτητη λύση με οδεύοντα κύματα και τον έλεγχο απέναντι στην αντοχή.',
  tasks:['Με −1 pu: σε ποιο σημείο η κορυφή είναι μεγαλύτερη; Γιατί σε ανοιχτό άκρο;','Χωρίς παγιδευμένο φορτίο: πόσο πέφτει η κορυφή; (ΔU από 2 σε 1 pu)','Αντίσταση σπινθήρα 20 Ω: πόσο αποσβένει τις ταλαντώσεις;'],
  build(o){const Vs=800e3*Math.SQRT2/Math.sqrt(3),tc=(+o.tc||0)*Vs,src=new Set(['UC1','J3','J4','T22','T23','D9','D88','D66','D44','D22','D1']),rs=+o.rs||75,rarc=+o.rarc||.5;
   // the branch J3 – T21 split by the disconnector: J3 –[DS]– DSL –[line 2,2 ns]– T21
   const list=GIS765.map(r=>r[0]==='J3'&&r[1]==='T21'?['DSL','T21',r[2],r[3]]:r),comps=[],wires=[];
   gisLines(list,(a,b)=>src.has(a)&&src.has(b)?Vs:tc,comps,wires);
   comps.push(C('DS1','SG',850,400,{Ub:1e9,trig:'1n',Rarc:rarc,ext:'never'},{label:'αποζεύκτης'}),C('RD','R',600,-300,{R:100},{rot:1,label:'100 Ω'}),
    C('CD1','C',720,-800,{C:10e-12,v0:+Vs.toPrecision(8)},{label:'10 pF'}),C('GCD','GND',720,-720,{},{label:''}),
    C('RS','R',800,720,{R:rs},{rot:1,label:rs+' Ω'}),C('VS','VDC',800,880,{V:+Vs.toPrecision(8)},{label:'+1 pu'}),C('GVS','GND',800,960,{},{label:''}),
    C('VUK','VP',2380,760,{},{label:'u_UK'}),C('VT18','VP',1880,360,{},{label:'u_T18'}),C('VT29','VP',3030,1000,{},{label:'u_T29'}),C('VJ7','VP',1680,-40,{},{label:'u_J7'}),C('VDSL','VP',900,330,{},{label:'u_DS'}));
   wires.push(['N_J3:j','DS1:a',[[820,400]]],['DS1:b','N_DSL:j'],['N_D66:j','RD:a'],['RD:b','N_D44:j'],['N_D1:j','CD1:p',[[720,-830]]],['CD1:n','GCD:g'],['N_UC1:j','RS:a'],['RS:b','VS:p'],['VS:n','GVS:g'],
    ['N_UK:j','VUK:p',[[2380,800]]],['N_T18:j','VT18:p',[[1880,400]]],['N_T29:j','VT29:p',[[3030,1000]]],['N_J7:j','VJ7:p',[[1680,0]]],['N_DSL:j','VDSL:p',[[900,330]]]);
   if(o.uk!=='open'){comps.push(C('CK','C',2450,900,{C:500e-12,v0:+tc.toPrecision(8)},{label:'500 pF'}),C('GCK','GND',2450,980,{},{label:''}));wires.push(['N_UK:j','CK:p',[[2450,840]]],['CK:n','GCK:g']);}
   comps.push(note('N1',150,-1000,'VFTO: διάσπαση στον αποζεύκτη ενός GIS 800 kV με παγιδευμένο φορτίο',{size:26,bold:true,frame:true}),
    note('N2',150,-930,`Πλευρά του διαπεραστή στο +1 pu (${(Vs/1e3).toFixed(0)} kV), ζυγός πίσω από τον αποζεύκτη στο ${(+o.tc||0)} pu· σπινθήρας ${rarc} Ω στο 1 ns.`,{size:15,color:'muted'}));
   const stopT=2e-6;
   return project(comps,wires,{version:4,sim:{hDiv:4,method:'TR',speed:200,stopT},scope:{panes:[[['Y:VUK','u_UK'],['Y:VT18','u_T18']],[['Y:VT29','u_T29'],['Y:VJ7','u_J7']],[['Y:VDSL','u_DS'],['I:DS1','i σπινθήρα']]],window:{unit:'s',n:stopT}},
    meta:{gis:{kind:'vfto',Vs,tc,Us:800e3,rs,rarc,uk:o.uk||'c',LIWL:2100e3,Ks:1.15,stop:stopT}}});}});
 // 4.22: the restrikes of a disconnector at 50 Hz (lumped): every strike equalises the bus to the source through the damping
 // of the circuit, the spark goes out when its current falls below I_ext, the next strike when |u_s − u_bus| reaches U_b(t)
 T.push({id:'ds_restrike',group:'Υποσταθμός GIS και πολύ γρήγορα μεταβατικά (4.22)',title:'Αποζεύκτης GIS 420 kV: επαναναύσεις στο κλείσιμο και στο άνοιγμα',theory:'formula',topology:'ds_restrike',
  options:[{k:'op',label:'Χειρισμός',options:[['close','Κλείσιμο (ζυγός με παγιδευμένο φορτίο −1 pu)'],['close0','Κλείσιμο (ζυγός χωρίς φορτίο)'],['open','Άνοιγμα']],def:'close'},
   {k:'ts',label:'Χρόνος κίνησης των επαφών',options:[['60m','60 ms'],['200m','200 ms']],def:'60m'},
   {k:'um',label:'Τάση διάσπασης στην πλήρη απόσταση',options:[['3','3 pu'],['2','2 pu']],def:'3'}],
  desc:'Ένας αποζεύκτης GIS 420 kV ανάμεσα στον ζυγό της πηγής (C_s = 1 nF, με το δίκτυο πίσω από 5 mH) και σε έναν ζυγό χωρίς φορτίο (C_L = 0,5 nF). Οι επαφές κινούνται για T_s, και η τάση διάσπασης του διακένου πέφτει (κλείσιμο) ή ανεβαίνει (άνοιγμα) γραμμικά. Σε κάθε διάσπαση ο σπινθήρας φέρνει τον ζυγό στην τάση της πηγής μέσα από την απόσβεση του κυκλώματος (400 Ω) και σβήνει όταν το ρεύμα του πέσει κάτω από 0,5 A. Η τάση του ζυγού γίνεται σκάλα, και η μεγαλύτερη τάση ανάμεσα στις επαφές τη στιγμή μιας διάσπασης (ΔU) είναι αυτή που ξεκινά τα πολύ γρήγορα μεταβατικά του gis_vfto.',
  tasks:['Στο κλείσιμο με −1 pu: πόσες διασπάσεις, και ποια είναι η μεγαλύτερη ΔU;','Στο άνοιγμα: ποιο φορτίο μένει παγιδευμένο στον ζυγό στο τέλος;','Με 200 ms οι επαφές κινούνται πιο αργά: τι γίνεται με το πλήθος των διασπάσεων;'],
  build(o){const Vp=420e3*Math.SQRT2/Math.sqrt(3),op=o.op==='open'?'open':'close',Ts=o.ts==='200m'?.2:.06,Um=(+o.um||3)*Vp,v0=o.op==='close'?-Vp:0,stopT=Ts+0.03;
   const comps=[C('VS','VAC',100,240,{Vpk:+Vp.toPrecision(8),f:50,phase:0},{label:'δίκτυο 420 kV'}),gnd(100,330),C('LS','L',220,150,{L:5e-3},{label:'5 mH'}),J('JS',320,150),
    C('CS','C',320,230,{C:1e-9},{label:'C_s 1 nF'}),C('GS','GND',320,310,{},{label:''}),C('RD','R',420,150,{R:400},{label:'απόσβεση 400 Ω'}),
    C('DS1','DS',540,150,{op,t0:'2m',Ts:String(Ts),Um:+Um.toPrecision(8),Rarc:1,ext:'iext',Iext:.5},{label:'αποζεύκτης'}),J('JL',660,150),
    C('CL','C',660,230,{C:.5e-9,v0:+v0.toPrecision(8)},{label:'C_L 0,5 nF'}),C('GL','GND',660,310,{},{label:''}),C('VSB','VP',320,80,{},{label:'u_s'}),C('VLB','VP',660,80,{},{label:'u_ζυγού'})];
   const wires=[['VS:p','LS:a',[[100,150]]],['VS:n','G1:g'],['LS:b','JS:j'],['JS:j','CS:p'],['CS:n','GS:g'],['JS:j','RD:a'],['RD:b','DS1:a'],['DS1:b','JL:j'],['JL:j','CL:p'],['CL:n','GL:g'],['JS:j','VSB:p'],['JL:j','VLB:p']];
   comps.push(note('N1',60,-40,'Αποζεύκτης GIS 420 kV: '+(op==='open'?'άνοιγμα':'κλείσιμο')+', επαφές σε '+(Ts*1e3)+' ms',{size:22,bold:true,frame:true}));
   return project(comps,wires,{version:4,sim:{hDiv:20000,method:'TR',speed:2,stopT},scope:{panes:[[['Y:VSB','u_s'],['Y:VLB','u_ζυγού']],[['V:DS1','u επαφών'],['I:DS1','i σπινθήρα']]],window:{unit:'s',n:stopT}},
    meta:{gis:{kind:'ds',op,Vp,Ts,Um,t0:2e-3,v0,stop:stopT}}});}});
 // 4.22: the procedure of insulation co-ordination itself (pcl.insulation, study 'insulation'), with a small circuit of the
 // line entrance (an incoming surge, the arrester, the separation to the transformer) whose peak can be the fast-front
 // overvoltage of the procedure
 const INSCO_CASES={
  g2:{Us:245,Um:245,H:1000,tov:{k:1.5,lr:1.4,polluted:true},slow:{Ue2:1.9,Up2:2.9,Ups:410},fast:{Upl:500,A:4500,n:2,Lsp:300,Ra:1/400,r:1e-5,L:{external:60,liquid:30}},insulations:['external','liquid'],U10:500e3,d:2,Vin:1.6e6,L:30},
  '420':{Us:420,Um:420,H:0,tov:{k:1.3,lr:1.2},slow:{Ue2:2.2,Up2:3.4,Ups:700},fast:{Upl:820,A:11000,n:2,Lsp:400,Ra:1/400,r:5e-6,L:{external:60,gis:40}},insulations:['external','gis'],U10:820e3,d:3.216,Vin:2.4e6,L:40},
  '800':{Us:800,Um:800,H:0,tov:{k:1.3,lr:1.1},slow:{Ue2:1.8,Up2:2.9,Ups:1300},fast:{Upl:1474,A:11000,n:2,Lsp:400,Ra:1/400,r:5e-6,L:{external:60,gis:40}},vffo:{peak:1050,K:1.0},insulations:['external','gis'],U10:1474e3,d:6,Vin:4.2e6,L:40}};
 T.push({id:'insco_study',group:'Υποσταθμός GIS και πολύ γρήγορα μεταβατικά (4.22)',title:'Συντονισμός μόνωσης υποσταθμού κατά IEC 60071-2 (με αναφορά)',theory:'formula',topology:'insco_study',
  options:[{k:'case',label:'Υποσταθμός',options:[['g2','245 kV, υψόμετρο 1000 m (το αριθμητικό παράδειγμα του IEC 60071-2, Παράρτημα G.2)'],['420','GIS 420 kV (περιοχή II)'],['800','GIS 800 kV (περιοχή II, με VFFO από το gis_vfto)']],def:'g2'},
   {k:'fast',label:'Υπερτάσεις ταχέος μετώπου',options:[['simplified','Απλοποιημένη στατιστική μέθοδος (Παράρτημα E)'],['emt','Η κορυφή στον μετασχηματιστή από αυτήν την προσομοίωση']],def:'simplified'}],
  desc:'Τα πέντε βήματα του IEC 60071-2 τρέχουν στο engine (pcl.insulation): αντιπροσωπευτικές υπερτάσεις (προσωρινές, βραδέος, ταχέος και πολύ ταχέος μετώπου), τάσεις αντοχής συντονισμού, απαιτούμενες τάσεις αντοχής με τους συντελεστές ασφαλείας και υψομέτρου, μετατροπή στις κυματομορφές της περιοχής και επιλογή του τυποποιημένου επιπέδου του IEC 60071-1, με τα περιθώρια. Το κύκλωμα είναι η είσοδος του υποσταθμού: ένα κύμα 1,2/50 μs πάνω σε γραμμή 400 Ω, το αλεξικέραυνο στην είσοδο και ο μετασχηματιστής (3 nF) σε απόσταση L. Με «από αυτήν την προσομοίωση» η κορυφή στον μετασχηματιστή γίνεται η αντιπροσωπευτική υπέρταση ταχέος μετώπου. Η «Αναφορά συντονισμού» είναι ένα αρχείο HTML με όλα τα βήματα.',
  tasks:['Στο παράδειγμα των 245 kV τρέξε τον συντονισμό: βγαίνει το επίπεδο 395 kV / 950 kV όπως στο πρότυπο;','Άλλαξε σε «από αυτήν την προσομοίωση»: πόσο διαφέρει η κορυφή στον μετασχηματιστή από την απλοποιημένη μέθοδο;','Στο GIS 800 kV: ποιο από τα LIWV, SIWV και VFFO ορίζει το επίπεδο;'],
  build(o){const c=INSCO_CASES[o.case]||INSCO_CASES.g2,emt=o.fast==='emt';
   const comps=[C('VS','VIMP',100,240,{shape:'1.2/50',Vpk:c.Vin},{label:'κύμα 1,2/50'}),gnd(100,330),C('RS','R',190,150,{R:400},{label:'400 Ω'}),
    C('TLL','TL',330,170,{spec:'zl',Z:400,len:300,vel:3e8},{label:'γραμμή 300 m'}),C('GLL','GND',330,240,{},{label:''}),J('JE',460,150),
    C('SA','SAI',460,230,{U10:c.U10,d:c.d,n:1,kL1:1,Llead:5e-6,meas:true,impl:'blocks'},{label:'ZnO'}),C('GSA','GND',460,300,{},{label:''}),
    C('TLG','TL',600,170,{spec:'zl',Z:75,len:c.L,vel:2.88e8},{label:`${c.L} m`}),C('GLG','GND',600,240,{},{label:''}),J('JT',740,150),
    C('CT','C',740,230,{C:3e-9},{label:'μετασχ. 3 nF'}),C('GCT','GND',740,300,{},{label:''}),C('VE','VP',460,80,{},{label:'u_E'}),C('VT','VP',740,80,{},{label:'u_T'})];
   const wires=[['VS:p','RS:a',[[100,150]]],['VS:n','G1:g'],['RS:b','TLL:a1'],['TLL:a2','JE:j'],['TLL:b1','TLL:b2'],['TLL:b2','GLL:g'],['JE:j','SA:a'],['SA:b','GSA:g'],
    ['JE:j','TLG:a1'],['TLG:a2','JT:j'],['TLG:b1','TLG:b2'],['TLG:b2','GLG:g'],['JT:j','CT:p'],['CT:n','GCT:g'],['JE:j','VE:p'],['JT:j','VT:p']];
   comps.push(note('N1',60,-40,`Συντονισμός μόνωσης: υποσταθμός ${c.Us} kV`,{size:22,bold:true,frame:true}));
   const stopT=20e-6,{U10,d,Vin,L,...opts}=c;
   return project(comps,wires,{version:4,sim:{hDiv:10,method:'TR',speed:200,stopT},scope:{panes:[[['Y:VE','u_E (είσοδος)'],['Y:VT','u_T (μετασχηματιστής)']],[['Y:SA/I','i αλεξικέραυνου']]],window:{unit:'s',n:stopT}},
    meta:{insco:{options:emt?{...opts,fast:undefined}:opts,emt,stop:stopT,lead:o.case==='g2'?'το παράδειγμα του Παραρτήματος G.2':''}}});}});
 T.push({id:'line_fd',group:'Γραμμές (4.4)',title:'Ζεύξη γραμμής 400 kV: σταθερές παράμετροι (CP) και εξάρτηση από τη συχνότητα (FD)',theory:'formula',topology:'line_fd',
  options:[{k:'cmp',label:'Γραμμές',options:[['cp50','CP στα 50 Hz και FD, δίπλα δίπλα'],['cp5k','CP στα 5 kHz και FD'],['fd','Μόνο FD'],['wbfd','WB (wideband, 4.13) και FD, δίπλα δίπλα']],def:'cp50'},
   {k:'src',label:'Ζεύξη',options:[['step','Μία φάση (a), βηματική 1 kV πίσω από 10 Ω'],['ac3','Τριφασική 400 kV, στην κορυφή της v_a']],def:'step'}],
  desc:'Η τυπική γραμμή 400 kV απλού κυκλώματος (2 × ACSR 954 MCM ανά φάση, δύο αγωγοί προστασίας, ρ = 100 Ω·m), 100 km, ανοιχτή στο τέλος. Οι σταθερές βγαίνουν από τη γεωμετρία (Carson, Bessel, αγωγοί προστασίας με απαλοιφή) με τη ρουτίνα pcl/lineconst.py, όπως το Line Data του EMTP· η γραμμή γίνεται τρεις ρυθμοί με σταθερό πραγματικό T_i. Το CP κρατά τις παραμέτρους μιας συχνότητας (κάθε ρυθμός Bergeron με R/4 – R/2 – R/4), το FD (J. Marti) προσαρμόζει Z_c(ω) και A(ω) με ρητές συναρτήσεις από 0,01 Hz ως 10 MHz. Το «Δεδομένα γραμμής…» της γραμμής (δεξί κλικ ή διπλό κλικ) δείχνει τους πίνακες, τους ρυθμούς και την προσαρμογή.',
  tasks:['Μία φάση: δες στο τέλος της φάσης a το κύμα που φτάνει περίπου 336 μs μετά (ρυθμός γης) και 334 μs (ρυθμοί αέρα), και στις φάσεις b, c την επαγόμενη τάση.','CP στα 50 Hz έναντι FD: ο ρυθμός γης στα 50 Hz έχει πολύ μικρή απόσβεση· το CP κρατά ψηλά τις επαγόμενες τάσεις, το FD τις σβήνει όπως η ακριβής γραμμή.','CP στα 5 kHz: πιο κοντά στο FD στο πρώτο μέτωπο, χειρότερα στη χαμηλή συχνότητα.','Τριφασική ζεύξη: η υπέρταση στο ανοιχτό άκρο (έως περίπου 2 pu) και η ταλάντωση με περίοδο 4τ.','Άνοιξε «Δεδομένα γραμμής…» και άλλαξε την ειδική αντίσταση του εδάφους ή το μήκος: το μοντέλο ξαναϋπολογίζεται στον server.'],
  build(o){const both=o.cmp!=='fd',f=o.cmp==='cp5k'?5000:50,ac=o.src==='ac3',Vpk=400e3*Math.SQRT2/Math.sqrt(3);
   const comps=[gnd(320,420)],wires=[],panes=[[],[]];
   const rig=(sfx,y,line,lab)=>{const V='V'+sfx,L='L'+sfx;
    if(ac){comps.push(C(V,'VAC3',100,y,{Vpk,f:50,phase:90,Rs:10},{label:'400 kV'}));wires.push([V+':a',L+':a1'],[V+':b',L+':b1'],[V+':c',L+':c1'],[V+':n','G1:g',[[100,400],[320,400]]]);}
    else{comps.push(C(V,'VIMP',100,y,{shape:'ramp',Vpk:1e3,S:1e3/1e-6,Rs:10},{label:'1 kV'}),C('RB'+sfx,'R',170,y+40,{R:10},{rot:1,label:'R_b'}),C('RC'+sfx,'R',250,y+40,{R:10},{rot:1,label:'R_c'}));
     wires.push([V+':p',L+':a1',[[100,y-20]]],[V+':n','G1:g',[[100,400],[320,400]]],[L+':b1','RB'+sfx+':a',[[170,y]]],[L+':c1','RC'+sfx+':a',[[250,y+20]]],['RB'+sfx+':b','G1:g',[[170,400]]],['RC'+sfx+':b','G1:g',[[250,400]]]);}
    comps.push(line);return lab;};
   const wb=o.cmp==='wbfd',top=wb?tlmPart('L1',320,100,'wb',0,'WB'):both?tlmPart('L1',320,100,'cp',f,`CP ${f===50?'50 Hz':'5 kHz'}`):tlmPart('L1',320,100,'fd',0,'FD');
   const l1=rig('1',100,top,wb?'WB':both?`CP${f===50?'50':'5k'}`:'FD');
   if(both){rig('2',260,tlmPart('L2',320,260,'fd',0,'FD'),'FD');}
   const ids=both?[['L1',l1],['L2','FD']]:[['L1',l1]];
   for(const [id,lab] of ids){panes[0].push(['V4:'+id,`v_a2 ${lab}`]);panes[1].push(['V5:'+id,`v_b2 ${lab}`]);}
   if(!ac)for(const [id,lab] of ids)panes[1].push(['V6:'+id,`v_c2 ${lab}`]);
   const stopT=ac?0.02:4e-3;
   return project(comps,wires,{sim:{hDiv:ac?20000:1,speed:ac?0.2:0.05,stopT,method:'TR'},scope:{panes,window:{unit:'s',n:stopT}},meta:{cmp:o.cmp,src:o.src,f,dur:stopT}});}});
 // ------------------------------------------------------------------ 4.5: cables (ROADMAP §26, Dommel ch. 5)
 T.push({id:'cable_fd',group:'Καλώδια (4.5)',title:'Ζεύξη υποβρύχιου καλωδίου 220 kV: CP και FD',theory:'formula',topology:'cable_fd',
  options:[{k:'cmp',label:'Μοντέλα',options:[['cp50','CP στα 50 Hz και FD, δίπλα δίπλα'],['fd','Μόνο FD'],['wbfd','WB (wideband, 4.13) και FD, δίπλα δίπλα']],def:'cp50'},
   {k:'src',label:'Ζεύξη',options:[['step','Μία φάση (a), βηματική 1 kV πίσω από 30 Ω'],['ac3','Τριφασική 220 kV, στην κορυφή της v_a']],def:'step'}],
  desc:'Τρία μονοπολικά καλώδια XLPE 220 kV (χάλκινος αγωγός, θωράκιση μολύβδου, εξωτερική μόνωση) σε θάλασσα (ρ = 0,2 Ω·m), 30 km, οι θωρακίσεις γειωμένες στα δύο άκρα, ανοιχτό στο τέλος. Οι σταθερές βγαίνουν από τη γεωμετρία των στρωμάτων (βρόχοι αγωγός–θωράκιση με συναρτήσεις Bessel, επιστροφή από τη θάλασσα ως άπειρο μέσο, μόνωση με ε_r και tanδ) με τη ρουτίνα pcl/lineconst.py, όπως το Cable Data του EMTP. Το «Δεδομένα γραμμής…» (διπλό κλικ) δείχνει τα στρώματα, την τομή, τους ρυθμούς και την προσαρμογή FD.',
  tasks:['Μία φάση: το κύμα φτάνει στο ανοιχτό άκρο περίπου 152 μs μετά (v ≈ c/√ε_r ≈ 198 000 km/s) και διπλασιάζεται· στις φάσεις b, c σχεδόν τίποτα, γιατί οι θωρακίσεις κλείνουν το πεδίο μέσα σε κάθε καλώδιο.','CP στα 50 Hz: το κύμα φτάνει αργότερα (περίπου 174 μs), γιατί η εσωτερική αυτεπαγωγή του αγωγού στα 50 Hz κάνει τον ρυθμό πιο αργό, και η φάση b παίρνει μεγάλη επαγόμενη τάση: στα 50 Hz η λεπτή θωράκιση δεν κλείνει ακόμη το πεδίο (βάθος διείσδυσης στον μόλυβδο περίπου 37 mm), στις συχνότητες του μετώπου το κλείνει. Το FD ακολουθεί το ακριβές καλώδιο σε λίγα τοις χιλίοις (tests/test_lines.py).','Σύγκρινε με το tutorial της εναέριας γραμμής: Z_c του καλωδίου περίπου 30 Ω αντί για 300 Ω, ταχύτητα δύο τρίτα του φωτός.','Τριφασική ζεύξη: υπέρταση στο ανοιχτό άκρο με περίοδο 4τ ≈ 0,6 ms και το μεγάλο ρεύμα φόρτισης.','Στο «Δεδομένα γραμμής…» άλλαξε το μέσο σε έδαφος (Pollaczek) ή το tanδ της μόνωσης και ξαναϋπολόγισε.'],
  build(o){const both=o.cmp!=='fd',ac=o.src==='ac3',Vpk=220e3*Math.SQRT2/Math.sqrt(3),Rs=ac?1:30,LINE='220kV-sea',LEN=30;
   const comps=[gnd(320,420)],wires=[],panes=[[],[]];
   const rig=(sfx,y,line)=>{const V='V'+sfx,L='L'+sfx;
    if(ac){comps.push(C(V,'VAC3',100,y,{Vpk,f:50,phase:90,Rs},{label:'220 kV'}));wires.push([V+':a',L+':a1'],[V+':b',L+':b1'],[V+':c',L+':c1'],[V+':n','G1:g',[[100,400],[320,400]]]);}
    else{comps.push(C(V,'VIMP',100,y,{shape:'ramp',Vpk:1e3,S:1e3/5e-6,Rs},{label:'1 kV'}),C('RB'+sfx,'R',170,y+40,{R:Rs},{rot:1,label:'R_b'}),C('RC'+sfx,'R',250,y+40,{R:Rs},{rot:1,label:'R_c'}));
     wires.push([V+':p',L+':a1',[[100,y-20]]],[V+':n','G1:g',[[100,400],[320,400]]],[L+':b1','RB'+sfx+':a',[[170,y]]],[L+':c1','RC'+sfx+':a',[[250,y+20]]],['RB'+sfx+':b','G1:g',[[170,400]]],['RC'+sfx+':b','G1:g',[[250,400]]]);}
    comps.push(line);};
   const wb=o.cmp==='wbfd';
   rig('1',100,wb?tlmPart('L1',320,100,'wb',0,'WB',LINE,LEN):both?tlmPart('L1',320,100,'cp',50,'CP 50 Hz',LINE,LEN):tlmPart('L1',320,100,'fd',0,'FD',LINE,LEN));
   if(both)rig('2',260,tlmPart('L2',320,260,'fd',0,'FD',LINE,LEN));
   const ids=both?[['L1',wb?'WB':'CP50'],['L2','FD']]:[['L1','FD']];
   for(const [id,lab] of ids){panes[0].push(['V4:'+id,`v_a2 ${lab}`]);panes[1].push(['I:'+id,`i_a1 ${lab}`]);}
   const stopT=ac?0.02:2e-3;
   return project(comps,wires,{sim:{hDiv:ac?20000:10,speed:ac?0.2:0.05,stopT,method:'TR'},scope:{panes,window:{unit:'s',n:stopT}},meta:{cmp:o.cmp,src:o.src,f:50,dur:stopT,cable:true}});}});
 // ------------------------------------------------------------------ 4.13 (ROADMAP §26): a cross-bonded land cable
 // The land cable of 4.5 with its sheaths as conductors 4–6 (Parts.TLM_TYPICAL['150kV-land-s']), 4,5 km in three major
 // sections of three minor sections of 0,5 km, each a WB model. Explicit (Cable Constants §10.1): the sheaths rotated at
 // the minor joints (the sheath of cable a goes on in cable b, b in c, c in a) and bonded and earthed through R_s at the
 // major junctions and the two ends; solid bonding: the same sections without the rotation. Homogeneous (§2.4, §10.2):
 // the matrices averaged over the rotation (pcl.lineconst.xbond_avg), the sheaths bonded into one conductor (a model per
 // major section, R_s at the junctions) or grounded (one model of 4,5 km).
 const XB_N=9,XB_DX=160,XB_RL=108;
 function xbRig(pre,x0,y,kind,Rs,comps,wires){const sec=k=>pre+'S'+(k+1),xs=k=>x0+XB_DX*k;
  // the sheaths of joint j (0: sending end, 9: receiving end) bonded at x and earthed through R_s
  const bond=(j,x,n=3)=>{const ids=Array.from({length:n},(_,i)=>pre+'J'+j+'def'[i]);ids.forEach((id,i)=>comps.push(J(id,x,y+10+20*i)));
   comps.push(C(pre+'R'+j,'R',x,y+100,{R:Rs},{rot:1,label:'R_s'}),C(pre+'G'+j,'GND',x,y+150,{},{label:''}));
   for(let i=1;i<n;i++)wires.push([ids[i-1],ids[i]]);wires.push([ids[n-1],pre+'R'+j+':a',[[x,y+70]]],[pre+'R'+j+':b',pre+'G'+j+':g']);return ids;};
  if(kind==='gnd'){comps.push(tlmPart(pre+'S1',xs(4),y-30,'wb',0,'ομογενές 4,5 km','150kV-land-s',4.5,'gnd'));return {first:pre+'S1',last:pre+'S1',M:3,x1:xs(4)-40,x2:xs(4)+40};}
  if(kind==='bond'){for(let k=0;k<3;k++)comps.push(tlmPart(sec(k),xs(3*k+1),y-20,'wb',0,`ομογενές ${k+1}`,'150kV-land-s',1.5,'bond'));
   // the bonded sheaths (pin d at y + 10) earthed at the ends and the major junctions
   for(let j=0;j<=3;j++){const x=j===0?xs(0)-60:j===3?xs(XB_N-1)+60:xs(3*j-1)+XB_DX/2,m=bond(3*j,x,1)[0];
    if(j>0)wires.push([sec(j-1)+':d2',m]);if(j<3)wires.push([m,sec(j)+':d1']);}
   for(let k=0;k<2;k++)for(const q of ['a','b','c'])wires.push([sec(k)+':'+q+'2',sec(k+1)+':'+q+'1']);
   return {first:sec(0),last:sec(2),M:4,x1:xs(1)-40,x2:xs(7)+40};}
  const rot=kind==='xb';for(let k=0;k<XB_N;k++)comps.push(tlmPart(sec(k),xs(k),y,'wb',0,`${k+1}`,'150kV-land-s',0.5));
  const s=bond(0,xs(0)-60);['d','e','f'].forEach((q,i)=>wires.push([s[i],sec(0)+':'+q+'1']));
  const r=bond(XB_N,xs(XB_N-1)+60);['d','e','f'].forEach((q,i)=>wires.push([sec(XB_N-1)+':'+q+'2',r[i]]));
  for(let k=0;k<XB_N-1;k++){const a=sec(k),b=sec(k+1),x=xs(k),j=k+1;
   for(const q of ['a','b','c'])wires.push([a+':'+q+'2',b+':'+q+'1']);
   if(j%3===0){const m=bond(j,x+XB_DX/2);['d','e','f'].forEach((q,i)=>wires.push([a+':'+q+'2',m[i]],[m[i],b+':'+q+'1']));}
   else if(!rot)for(const q of ['d','e','f'])wires.push([a+':'+q+'2',b+':'+q+'1']);
   // the cross-bonding joint: d2 → e1 and e2 → f1 one row down, f2 → d1 under the section and back up
   else wires.push([a+':d2',b+':e1',[[x+60,y+10],[x+60,y+30]]],[a+':e2',b+':f1',[[x+50,y+30],[x+50,y+50]]],[a+':f2',b+':d1',[[x+40,y+70],[x+110,y+70],[x+110,y+10]]]);}
  return {first:sec(0),last:sec(XB_N-1),M:6,x1:xs(0)-40,x2:xs(XB_N-1)+40};}
 T.push({id:'cable_xb',group:'Καλώδια: wideband και cross-bonding (4.13)',title:'Υπόγειο καλώδιο 150 kV με cross-bonding: αναλυτικό και ομογενές μοντέλο',theory:'formula',topology:'cable_xb',
  options:[{k:'cmp',label:'Μοντέλα',options:[['xb_gnd','Αναλυτικό cross-bonding και ομογενές (μανδύες γειωμένοι), δίπλα δίπλα'],['xb_bond','Αναλυτικό και ομογενές (μανδύες ενωμένοι, R_s στις ενώσεις)'],
    ['xb_solid','Αναλυτικό cross-bonding και solid bonding'],['xb','Μόνο αναλυτικό cross-bonding']],def:'xb_gnd'},
   {k:'ev',label:'Λειτουργία',options:[['load','Φορτίο 50 Hz (≈ 800 A), από μόνιμη κατάσταση'],['energize','Ζεύξη του ανοιχτού καλωδίου στην κορυφή της v_a'],['step','Βηματική 1 kV στον αγωγό a (μέτωπο 1 μs)']],def:'load'},
   {k:'rs',label:'R_s γείωσης',options:[['0.1','0,1 Ω'],['1','1 Ω'],['10','10 Ω']],def:'1'}],
  desc:'Τρία μονοπολικά καλώδια XLPE 150 kV σε επίπεδη διάταξη (το υπόγειο καλώδιο της 4.5) με τους μανδύες ως αγωγούς 4–6, 4,5 km: τρία μείζονα τμήματα, το καθένα τρία ελάσσονα τμήματα των 0,5 km. Κάθε ελάσσον τμήμα είναι ένα μοντέλο WB (wideband, ULM) έξι αγωγών. Στις ενώσεις των ελασσόνων τμημάτων οι μανδύες αλλάζουν θέση (ο μανδύας του καλωδίου a συνεχίζει στο b, του b στο c, του c στο a), ώστε κατά μήκος ενός μείζονος τμήματος κάθε μανδύας περνά από τα τρία καλώδια και οι επαγόμενες τάσεις αλληλοαναιρούνται. Στα άκρα των μειζόνων τμημάτων οι μανδύες ενώνονται και γειώνονται μέσω R_s. Το ομογενές μοντέλο (Cable Constants του EMTP) κάνει την εναλλαγή μέσο όρο των πινάκων: οι μανδύες γίνονται ένας αγωγός, ή γειωμένοι, μένουν μόνο οι αγωγοί. Το solid bonding είναι τα ίδια τμήματα χωρίς εναλλαγή.',
  tasks:['Φορτίο 50 Hz: πόση τάση έχουν οι μανδύες στις ενώσεις 1 και 2 (link boxes) και πόσο ρεύμα κυκλοφορεί σε αυτούς; Σύγκρινε στην κάρτα με την τάση ανά km και kA ενός ελάσσονος τμήματος.','Solid bonding: το ρεύμα των μανδυών γίνεται μεγάλο κλάσμα του ρεύματος φορτίου (απώλειες στους μανδύες). Γιατί το cross-bonding σχεδόν το μηδενίζει;','Ζεύξη: η τάση στο ανοιχτό άκρο του αγωγού a κατά το αναλυτικό και κατά το ομογενές μοντέλο. Πού συμφωνούν και πού όχι;','Ζεύξη και βηματική: η μεταβατική τάση των μανδυών στις ενώσεις φτάνει kV. Γι\' αυτό τα link boxes έχουν απαγωγούς (SVL). Το ομογενές μοντέλο τη δείχνει;','Άλλαξε την R_s: τι αλλάζει στις τάσεις των μανδυών στο φορτίο και στη ζεύξη;'],
  build(o){const cmp=o.cmp||'xb_gnd',ev=o.ev||'load',Rs=+o.rs||1,Vpk=150e3*Math.SQRT2/Math.sqrt(3),x0=260;
   const comps=[],wires=[],rigs=[['X',160,'xb']];if(cmp!=='xb')rigs.push(['Y',520,cmp==='xb_solid'?'solid':cmp.slice(3)]);
   const info={};
   for(const [pre,y,kind] of rigs){const g=xbRig(pre,x0,y,kind,Rs,comps,wires);info[pre]={...g,kind};
    const ya=y-50,a1=g.first+':a1',b1=g.first+':b1',c1=g.first+':c1',x=x0-220;
    // the step on core a behind 30 Ω, cores b and c earthed through 30 Ω
    if(ev==='step'){comps.push(C(pre+'V','VIMP',x,ya+40,{shape:'ramp',Vpk:1e3,S:1e9,Rs:30},{label:'1 kV'}),C(pre+'GV','GND',x,ya+110,{},{label:''}),
      C(pre+'RB','R',x+60,ya+60,{R:30},{rot:1,label:'30 Ω'}),C(pre+'RC','R',x+110,ya+70,{R:30},{rot:1,label:'30 Ω'}),C(pre+'GB','GND',x+60,ya+110,{},{label:''}),C(pre+'GC','GND',x+110,ya+120,{},{label:''}));
     wires.push([pre+'V:p',a1],[pre+'V:n',pre+'GV:g'],[b1,pre+'RB:a',[[x+60,ya+20]]],[c1,pre+'RC:a'],[pre+'RB:b',pre+'GB:g'],[pre+'RC:b',pre+'GC:g']);}
    else{comps.push(C(pre+'V','VAC3',x,ya+20,{Vpk,f:50,phase:ev==='energize'?90:0,Rs:ev==='energize'?1:0.5},{label:'150 kV'}),C(pre+'GV','GND',x,ya+90,{},{label:''}));
     wires.push([pre+'V:a',a1],[pre+'V:b',b1],[pre+'V:c',c1],[pre+'V:n',pre+'GV:g']);
     // the load: one vertical resistor per phase to ground, a furthest right so that the wires do not cross
     if(ev==='load'){const xl=g.x2+100;['a','b','c'].forEach((q,i)=>{const x=xl+70*(2-i),y0=ya+20*i;
       comps.push(C(pre+'RL'+q,'R',x,y0+30,{R:XB_RL},{rot:1,label:'R_L '+q}),C(pre+'GL'+q,'GND',x,y0+80,{},{label:''}));
       wires.push([g.last+':'+q+'2',pre+'RL'+q+':a'],[pre+'RL'+q+':b',pre+'GL'+q+':g']);});}}}
   // channels: the core a at the receiving end, the sheaths at joints 1 and 2 (explicit), the sheath currents at the
   // sending end; the pin numbers of a TLM of M conductors: a1…(M)1 are 1…M, a2… are M + 1…
   const X=info.X,Y=info.Y,ch=(g,pinNo,end,id)=>`${pinNo+(end===2?g.M:0)>1?'V'+(pinNo+(end===2?g.M:0)):'V'}:${id}`,
    ich=(g,pinNo,end,id)=>`${pinNo+(end===2?g.M:0)>1?'I'+(pinNo+(end===2?g.M:0)):'I'}:${id}`,lab={xb:'cross-bonding',solid:'solid bonding',gnd:'ομογενές (γειωμένοι)',bond:'ομογενές (ενωμένοι)'};
   const panes=[[],[],[]];
   for(const g of [X,Y].filter(Boolean)){const L=lab[g.kind];
    panes[0].push(ev==='load'?[ich(g,1,1,g.first),'i_a '+L]:[ch(g,1,2,g.last),'v_a2 '+L]);
    if(g.kind==='xb'||g.kind==='solid'){const s1=g.first,s2=g.first.replace(/S1$/,'S2');
     panes[1].push([ch(g,4,2,s1),`μανδύας a, ένωση 1 (${L})`]);if(g.kind==='xb')panes[1].push([ch(g,5,2,s1),'μανδύας b, ένωση 1'],[ch(g,4,2,s2),'μανδύας a, ένωση 2']);
     panes[2].push([ich(g,4,1,s1),`i μανδύα a (${L})`]);if(g.kind==='xb')panes[2].push([ich(g,5,1,s1),'i μανδύα b'],[ich(g,6,1,s1),'i μανδύα c']);}
    else if(g.kind==='bond')panes[2].push([ich(g,4,1,g.first),'i μανδυών (ομογενές)']);}
   // the base period: 20 ms with the sources at 50 Hz, the front (1 μs) with the step; h = 2 μs, 1 μs, 0,1 μs
   const stopT={load:.02,energize:.005,step:3e-4}[ev],hDiv={load:10000,energize:20000,step:10}[ev];
   return project(comps,wires,{version:4,...(ev==='load'?{solve:{init:'ac'}}:{}),sim:{hDiv,method:'TR',speed:ev==='load'?0.1:0.02,stopT},scope:{panes:panes.filter(p=>p.length),window:{unit:'s',n:stopT}},
    meta:{xb:{cmp,ev,Rs,Vpk,RL:XB_RL,n:XB_N,lmin:0.5,len:4.5,rigs:Object.fromEntries(Object.entries(info).map(([k,g])=>[k,{kind:g.kind,first:g.first,last:g.last,M:g.M}])),dur:stopT}}});}});
 // ------------------------------------------------------------------ 4.10 (ROADMAP §50): the modular SSSC
 // A cascaded arm of N H bridges (CHB) in series with a line, its nearest-level modulation with sorting (NLC) and the m-SSSC
 // controller (SOGI-PLL on the line current, the injected voltage in quadrature with it, Δθ from the mean cell voltage).
 // Values: typical (10 cells of 1 kV with 10 mF per phase; line 0.08 Ω/km, 1.2 mH/km, 9.5 nF/km).
 const SSSC_X={steps:'0:0, 0.3:10, 0.8:-8',cap:'10',ind:'-8'};
 function ssscChannels(id,fast,N){const a=fast?`Y:${id}/X`:`Y:${id}/VAB`;return {arm:a,cells:Array.from({length:N},(_,k)=>fast?`Y:${id}/X:v${k+1}`:`Y:${id}/V${k+1}`)};}
 T.push({id:'sssc_1ph',group:'FACTS: αρθρωτός SSSC (4.10)',title:'Αρθρωτός SSSC σε γραμμή (μονοφασικό)',theory:'formula',topology:'sssc',
  options:[{k:'mode',label:'Έλεγχος',options:[['x','Έγχυση αντίδρασης X (πρόσθια τροφοδότηση + PI)'],['ma','Σταθερός δείκτης m_a = 0,5 (χωρητικός)'],['i','Ρεύμα γραμμής: 280 A → 180 A (0,8 s)']],def:'x'},
   {k:'X',label:'X_ref (τρόπος X)',options:[['steps','0 → +10 Ω (0,3 s) → −8 Ω (0,8 s)'],['cap','+10 Ω (χωρητική)'],['ind','−8 Ω (επαγωγική)']],def:'steps'},
   {k:'sel',label:'Εξισορρόπηση πυκνωτών',options:[['sort','Ταξινόμηση σε κάθε δείγμα'],['reduced','Μειωμένη συχνότητα μεταγωγής (ζώνη 30 V)']],def:'sort'},
   {k:'impl',label:'Βραχίονας',options:[['fast','Γρήγορος (συνάρτηση μεταγωγής)'],['blocks','Αναλυτικός (40 διακόπτες, 10 πυκνωτές)']],def:'fast'},
   {k:'d',label:'Γωνία μεταφοράς δ',options:[['4','4°'],['8','8°']],def:'4'}],
  desc:'Δύο ζυγοί 150 kV (πολική) με γωνία δ, μεταξύ τους γραμμή 100 km (8 Ω, 120 mH: X_L = 37,7 Ω) και σε σειρά ένας αρθρωτός SSSC: 10 γέφυρες H με πυκνωτή 10 mF στο 1 kV η καθεμία (ως 10 kV). Ο έλεγχος κλειδώνει στο ρεύμα με μονοφασικό PLL (SOGI) και εγχέει τάση κάθετη σε αυτό: καθυστερεί 90° (χωρητική, μειώνει την αντίδραση της γραμμής) ή προηγείται (επαγωγική). Μια μικρή γωνία Δθ από τη μέση τάση των πυκνωτών παίρνει από τη γραμμή την ενεργό ισχύ των απωλειών. Η διαμόρφωση πλησιέστερης στάθμης (NLC) βάζει n = round(v_ref/V_C) υπομονάδες και η ταξινόμηση διαλέγει ποιες.',
  tasks:['Τρόπος X με βήματα: στα 0,3 s +10 Ω, το ρεύμα ανεβαίνει από 221 σε ~296 A· στα 0,8 s −8 Ω, πέφτει στα ~184 A. Σύγκρινε στην κάρτα με το I = 2V·sin(δ/2)/|R + j(X_L − X)|.','Δες τις τάσεις των 10 πυκνωτών: μένουν κοντά στο 1 kV. Πόσο απέχουν μεταξύ τους με ταξινόμηση σε κάθε δείγμα και πόσο με μειωμένη συχνότητα μεταγωγής; Πόσες μεταγωγές έγιναν σε κάθε περίπτωση;','Η γωνία Δθ: θετική όταν η διάταξη πρέπει να πάρει ενέργεια (χωρητική), αρνητική στην επαγωγική. Γιατί; (Η δειγματοληψία της NLC καθυστερεί την τάση.)','Γρήγορος και αναλυτικός βραχίονας: ίδια αποτελέσματα· πόσο πιο αργά τρέχει ο αναλυτικός;','Σταθερό m_a: η τάση μένει 5 kV όποιο κι αν είναι το ρεύμα. Τι αντίδραση «βλέπει» η γραμμή;'],
  build(o){const N=10,Vdc=1000,V=150e3*Math.SQRT2/Math.sqrt(3),fast=o.impl!=='blocks',mode=o.mode||'x',d=+o.d||4,ch=ssscChannels('CH1',fast,N);
   const sc={mode,N,Vdc,X:SSSC_X[o.X||'steps'],ma:0.5,sense:'cap',Iref:'0:280, 0.8:180'};
   const comps=[C('V1','VAC',80,220,{Vpk:V,f:50,phase:d},{label:'V₁∠δ'}),C('R1','R',180,140,{R:8},{label:'R'}),C('L1','L',280,140,{L:0.12},{label:'L'}),C('AM1','AM',380,140,{},{label:'i'}),
    C('CH1','CHB',500,140,{N,C:10e-3,Vdc,fs:10e3,sel:o.sel==='reduced'?'reduced':'sort',band:30,impl:fast?'fast':'blocks'},{rot:3,label:'m-SSSC'}),
    C('V2','VAC',660,220,{Vpk:V,f:50,phase:0},{label:'V₂∠0'}),C('SC1','SSSC',500,320,sc,{label:'έλεγχος'}),C('G1','GND',80,300),C('G2','GND',660,300)];
   const wires=[['V1:p','R1:a',[[80,140]]],['R1:b','L1:a'],['L1:b','AM1:a'],['AM1:b','CH1:a'],['CH1:b','V2:p',[[660,140]]],['V1:n','G1:g'],['V2:n','G2:g'],
    ['AM1:y','SC1:i'],['CH1:v','SC1:v'],['CH1:vav','SC1:vav'],['SC1:vref','CH1:ref']];
   return project(comps,wires,{version:4,solve:{init:'ac'},sim:{hDiv:10,method:'TR',speed:0.2,stopT:1.2},
    scope:{panes:[[['I:L1','ρεύμα γραμμής']],[[ch.arm,'τάση SSSC'],['Y:SC1/VR','αναφορά']],[['Y:SC1/XM','X μετρημένη'],['Y:SC1/VQ','V_q (εντολή)']],ch.cells.slice(0,4).map((k,i)=>[k,'v_C'+(i+1)])],window:{unit:'s',n:0.1}},
    meta:{sssc:{V,d,R:8,L:0.12,f:50,N,Vdc,C:10e-3,mode,X:sc.X,Iref:sc.Iref,ma:sc.ma,sense:sc.sense,fast,phases:1}}});}});
 // three phases, four buses at 150 kV: a grid at bus 1, two paths to the load at bus 2 (through the m-SSSC and a 100 km line,
 // or through bus 3 and 50 + 70 km of line); one arm and one controller per phase
 T.push({id:'sssc_3ph',group:'FACTS: αρθρωτός SSSC (4.10)',title:'Αρθρωτός SSSC σε δίκτυο 150 kV (τριφασικό, 4 ζυγοί)',theory:'formula',topology:'sssc',
  options:[{k:'X',label:'X_ref',options:[['steps','0 → +10 Ω (0,3 s) → −8 Ω (0,8 s)'],['cap','+10 Ω (χωρητική)'],['ind','−8 Ω (επαγωγική)']],def:'steps'},
   {k:'sel',label:'Εξισορρόπηση πυκνωτών',options:[['sort','Ταξινόμηση σε κάθε δείγμα'],['reduced','Μειωμένη συχνότητα μεταγωγής (ζώνη 30 V)']],def:'reduced'},
   {k:'load',label:'Φορτίο στον ζυγό 2',options:[['150','150 MW, 30 Mvar'],['250','250 MW, 50 Mvar']],def:'150'},
   {k:'ctl',label:'Έλεγχος (4.17)',options:[['central','Κεντρικός: ένα PLL θετικής ακολουθίας, ένας βρόχος X, ενέργεια και εξισορρόπηση των τριών φάσεων'],['cphase','Κεντρικός, με συγχρονισμό ανά φάση (SOGI σε κάθε ρεύμα)'],['phase','Ένας ελεγκτής ανά φάση (4.10)']],def:'central'},
   {k:'unb',label:'Ασυμμετρία (4.17)',options:[['0','Καμία'],['r','R = 10 Ω σε σειρά στη φάση a της διαδρομής του SSSC']],def:'0'}],
  desc:'Τριφασικό δίκτυο 150 kV με τέσσερις ζυγούς: ισοδύναμο δικτύου στον ζυγό 1 (5 GVA), δύο διαδρομές προς το φορτίο του ζυγού 2: μέσω του m-SSSC (ζυγός 4) και γραμμής 100 km, ή μέσω του ζυγού 3 και γραμμών 50 + 70 km. Γραμμές τμήματα π με 0,08 Ω/km, 1,2 mH/km, 9,5 nF/km. Ένας αρθρωτός βραχίονας (10 × 1 kV) ανά φάση με αυτεπαγωγή σύζευξης 5 mH (η σκέδαση του μετασχηματιστή σύζευξης ή το πηνίο του βραχίονα). Ο κεντρικός ελεγκτής (4.17) οδηγεί και τους τρεις βραχίονες: ένα PLL στη θετική ακολουθία των ρευμάτων, ένας βρόχος της X, και για κάθε φάση ένα μέρος της τάσης κάθετο στο ρεύμα της (η αντιστάθμιση) και ένα σε φάση (η ενέργεια των πυκνωτών και η εξισορρόπηση ανάμεσα στις φάσεις). Με «ένας ελεγκτής ανά φάση» κάθε φάση έχει δικό της SOGI-PLL, βρόχο X και Δθ (4.10). Χωρίς αυτήν ο βραχίονας θα ήταν ανάμεσα στις εγκάρσιες χωρητικότητες των δύο γραμμών και κάθε αλλαγή στάθμης θα έδινε κρουστικό ρεύμα στη μέτρηση. Η χωρητική έγχυση στέλνει περισσότερη ισχύ από τη διαδρομή του SSSC, η επαγωγική λιγότερη.',
  tasks:['Πώς μοιράζεται η ισχύς στις δύο διαδρομές πριν από τα 0,3 s, με +10 Ω και με −8 Ω; Σύγκρινε στην κάρτα με τη ροή φορτίου του pcl.network με την ίδια αντίδραση σε σειρά.','Με ελεγκτή ανά φάση: έχουν οι τρεις φάσεις την ίδια X και την ίδια Δθ; Με τον κεντρικό: πόσο διαφέρουν οι μέσες τάσεις των πυκνωτών των τριών φάσεων, και πόσο το μέρος D_k σε φάση με το ρεύμα;','Με την ασυμμετρία (10 Ω στη φάση a) τα τρία ρεύματα διαφέρουν: με τον κεντρικό ελεγκτή και συγχρονισμό στη θετική ακολουθία, η τάση κάθε φάσης δεν είναι ακριβώς κάθετη στο ρεύμα της. Τι κάνει η εξισορρόπηση; (δες D_a, D_b, D_c)','Με φορτίο 250 MW το ρεύμα ανεβαίνει: πόση X μπορεί να δώσει η διάταξη με 10 kV ανά φάση;'],
  build(o){const N=10,Vdc=1000,f=50,w=2*Math.PI*f,X=SSSC_X[o.X||'steps'],P=+o.load||150,Q=P/5;
   // the network with three-phase buses (one wire per bus), the arms one per phase between two bus splitters
   const ln=(id,x,y,km,label)=>C(id,'LINE3',x,y,{unit:'ohm',Un:150e3,f,R1:+(0.08*km).toFixed(6),X1:+(w*1.2e-3*km).toFixed(6),B1:+(w*9.5e-9*km).toExponential(6),z0:'same',conn:'bus'},{label});
   const comps=[C('NET','GRID3',100,860,{Un:150e3,f,Sk:5e9,XR:10,cf:1,emf:'un',conn:'bus'},{label:'ζυγός 1'}),C('J1','JUNC',180,860),
    C('B1','EBUS',220,340,{n:3},{flip:true}),C('B2','EBUS',680,340,{n:3},{label:'ζυγός 4'}),
    ln('L13',400,860,50,'1–3 · 50 km'),ln('L32',680,860,70,'3–2 · 70 km'),ln('L42',780,340,100,'4–2 · 100 km'),
    C('J2','JUNC',900,340),C('LD2','LOAD3',900,480,{cn:'yn',Un:150e3,f,P:P*1e6,Q:Q*1e6,conn:'bus'},{label:'ζυγός 2'})];
   const wires=[['NET:abc','J1:j'],['J1:j','B1:bus',[[180,340]]],['J1:j','L13:abc1'],['L13:abc2','L32:abc1'],['L32:abc2','J2:j',[[900,860]]],
    ['B2:bus','L42:abc1'],['L42:abc2','J2:j'],['J2:j','LD2:abc']];
   // 4.17: one central controller (SC3) for the three arms, or one controller per phase (4.10); the asymmetry: R in phase a
   const ctl=['central','cphase','phase'].includes(o.ctl)?o.ctl:'central',cen=ctl!=='phase',unb=o.unb==='r';
   if(cen)comps.push(C('SC3','SSSC3',840,150,{mode:'x',N,Vdc,C:10e-3,X,sync:ctl==='cphase'?'phase':'pos'},{label:'κεντρικός έλεγχος'}));
   ['a','b','c'].forEach((ph,k)=>{const y=80+260*k,ra=unb&&ph==='a';
    comps.push(C('AM'+ph,'AM',300,y,{},{label:'i_'+ph}),C('LK'+ph,'L',390,y,{L:5e-3},{label:'L_σ '+ph}),
     C('CH'+ph,'CHB',520,y,{N,C:10e-3,Vdc,fs:10e3,sel:o.sel==='sort'?'sort':'reduced',band:30,impl:'fast'},{rot:3,label:'SSSC '+ph}));
    if(ra)comps.push(C('RUa','R',455,y,{R:10},{label:'10 Ω'}));
    if(!cen)comps.push(C('SC'+ph,'SSSC',520,y+150,{mode:'x',N,Vdc,X},{label:'έλεγχος '+ph}));
    wires.push(['B1:'+ph,'AM'+ph+':a',k===1?undefined:[[255,320+20*k],[255,y]]],['AM'+ph+':b','LK'+ph+':a'],...(ra?[['LK'+ph+':b','RUa:a'],['RUa:b','CH'+ph+':a']]:[['LK'+ph+':b','CH'+ph+':a']]),
     ['CH'+ph+':b','B2:'+ph,k===1?undefined:[[640,y],[640,320+20*k]]]);
    if(cen)wires.push(['AM'+ph+':y','SC3:i'+ph],['CH'+ph+':v','SC3:v'+ph],['CH'+ph+':vav','SC3:c'+ph],['SC3:r'+ph,'CH'+ph+':ref']);
    else wires.push(['AM'+ph+':y','SC'+ph+':i'],['CH'+ph+':v','SC'+ph+':v'],['CH'+ph+':vav','SC'+ph+':vav'],['SC'+ph+':vref','CH'+ph+':ref']);});
   const xp=cen?[['Y:SC3/XM','X (θετική ακολουθία)'],['Y:SC3/Da','D_a'],['Y:SC3/Db','D_b'],['Y:SC3/Dc','D_c']]:[['Y:SCa/XM','X a'],['Y:SCb/XM','X b'],['Y:SCc/XM','X c']];
   return project(comps,wires.map(w=>w.filter(x=>x!==undefined)),{version:4,solve:{init:'ac'},sim:{hDiv:10,method:'TR',speed:0.1,stopT:1.2},
    scope:{panes:[[['Y:AMa','i_a (SSSC)'],['Y:AMb','i_b'],['Y:AMc','i_c']],[['Y:CHa/X','v_a SSSC'],[cen?'Y:SC3/VRa':'Y:SCa/VR','αναφορά a']],xp,[['Y:CHa/NLC:vav','V_C a'],['Y:CHb/NLC:vav','V_C b'],['Y:CHc/NLC:vav','V_C c']]],window:{unit:'s',n:0.1}},
    meta:{sssc:{phases:3,N,Vdc,C:10e-3,X,f,Un:150e3,Sk:5e9,XR:10,P:P*1e6,Q:Q*1e6,lines:{L13:50,L32:70,L42:100},Lk:5e-3,r:0.08,l:1.2e-3,c:9.5e-9,fast:true,mode:'x',ctl,unb}}});}});
 // 4.17 (§50): the converter-controlled series capacitor (CCSC): a series capacitor C_s in parallel with the modular arm
 // (through L_c ∥ R_p and R_c), a bypass switch across the whole and a switch in the converter's branch (the inverter
 // controlled series compensator of Nelson and Ramey, US 5 814 975). The single-phase line of sssc_1ph; the controller
 // with its PLL on the line current; X_C = 15 Ω (half of the line's X_L after R)
 const CCSC_X={steps:'0:15, 0.8:22, 1.1:8',nat:'15',boost:'22'};
 T.push({id:'ccsc_1ph',group:'FACTS: CCSC και IEEE 9 με m-SSSC (4.17)',title:'CCSC: πυκνωτής σειράς ελεγχόμενος από μετατροπέα (μονοφασικό)',theory:'formula',topology:'ccsc',
  options:[{k:'mode',label:'Έλεγχος',options:[['x','Έγχυση αντίδρασης X (η συνολική X της διάταξης)'],['ma','Σταθερός δείκτης m_a = 0,5 (χωρητικός, boost)']],def:'x'},
   {k:'X',label:'X_ref (τρόπος X)',options:[['steps','15 Ω (φυσικό σημείο) → 22 Ω (0,8 s, boost) → 8 Ω (1,1 s)'],['nat','15 Ω: το φυσικό σημείο (μετατροπέας χωρίς ρεύμα)'],['boost','22 Ω: boost']],def:'steps'},
   {k:'d',label:'Γωνία μεταφοράς δ',options:[['4','4°'],['8','8°']],def:'4'}],
  desc:'Η γραμμή του μονοφασικού tutorial του m-SSSC (δύο ζυγοί 150 kV, 8 Ω + 120 mH) με CCSC σε σειρά: πυκνωτής C_s = 212 μF (X_C = 15 Ω) παράλληλα με τον κλάδο του μετατροπέα: αρθρωτός βραχίονας 10 × 1,5 kV (10 mF), L_c = 1,5 mH (με R_p = 1 kΩ παράλληλα, για το άνοιγμα του διακόπτη) και R_c = 0,5 Ω. Ως τα 0,2 s ο διακόπτης παράκαμψης είναι κλειστός (χωρίς αντιστάθμιση)· τότε ανοίγει και μπαίνει μόνο ο πυκνωτής· στα 0,5 s κλείνει ο διακόπτης του κλάδου και ο μετατροπέας επιβάλλει την τάση της διάταξης. Ο ελεγκτής είναι ο ίδιος με του m-SSSC, με το PLL στο ρεύμα της γραμμής: η τάση μένει κάθετη στο ρεύμα της γραμμής, όπως ενός πυκνωτή σειράς.',
  tasks:['Στο φυσικό σημείο (X_ref = X_C = 15 Ω) πόσο ρεύμα φέρει ο μετατροπέας; Σύγκρινε με τον m-SSSC σε σειρά, που φέρει όλο το ρεύμα της γραμμής.','Σε boost (22 Ω) το ρεύμα του πυκνωτή ξεπερνά το ρεύμα της γραμμής: προς ποια φορά κυκλοφορεί η διαφορά μέσα από τον μετατροπέα; Η κάρτα δίνει I_C = (X/X_C)·I.','Το ρεύμα του πυκνωτή και του μετατροπέα έχει αρμονικές της σκάλας, το ρεύμα της γραμμής σχεδόν όχι: γιατί; (ο βρόχος C_s–L_c συντονίζεται στα 1/(2π√(L_c·C_s)))','Τι γίνεται τη στιγμή που κλείνει ο διακόπτης του κλάδου, αν η τάση του μετατροπέα δεν είναι ίση με την τάση του πυκνωτή;'],
  build(o){const N=10,Vdc=1500,V=150e3*Math.SQRT2/Math.sqrt(3),mode=o.mode==='ma'?'ma':'x',d=+o.d||4,Xc=15,Cs=+(1/(2*Math.PI*50*Xc)).toPrecision(6),ch=ssscChannels('CH1',true,N);
   const sc={mode,N,Vdc,X:CCSC_X[o.X]||CCSC_X.steps,ma:0.5,sense:'cap',ton:0.15,tadv:5e-5};
   const sw=(id,x,y,lbl)=>C(id,'SW',x,y,{gate:'sig',model:'mos',Ron:1e-3,Roff:1e6,body:false},{rot:1,label:lbl});
   const comps=[C('V1','VAC',80,240,{Vpk:V,f:50,phase:d},{label:'V₁∠δ'}),C('R1','R',180,160,{R:8},{label:'R'}),C('L1','L',280,160,{L:0.12},{label:'L'}),C('AM1','AM',380,160,{},{label:'i γραμμής'}),
    J('JA',460,160),J('JB',880,160),sw('S1',670,60,'παράκαμψη'),C('AM3','AM',560,160,{},{label:'i_C'}),C('CS','C',670,160,{C:Cs},{rot:1,label:'C_s'}),
    sw('S2',540,300,'κλάδος'),J('JL1',610,300),J('JL2',690,300),C('LC','L',650,300,{L:1.5e-3},{label:'L_c'}),C('RP','R',650,360,{R:1000},{label:'R_p'}),
    C('RC','R',740,300,{R:0.5},{label:'R_c'}),C('AM2','AM',800,300,{},{label:'i μετατροπέα'}),
    C('CH1','CHB',880,300,{N,C:10e-3,Vdc,fs:10e3,sel:'sort',impl:'fast'},{rot:3,label:'m-SSSC'}),
    C('V2','VAC',980,240,{Vpk:V,f:50,phase:0},{label:'V₂∠0'}),C('G1','GND',80,320),C('G2','GND',980,320),
    C('K1','CONST',600,0,{v:'0:1, 0.2:0'},{label:'παράκαμψη (1 = κλειστή)'}),C('K2','CONST',470,360,{v:'0:0, 0.5:1'},{label:'κλάδος (1 = κλειστός)'}),
    C('SC1','SSSC',880,470,sc,{label:'έλεγχος'})];
   const wires=[['V1:p','R1:a',[[80,160]]],['R1:b','L1:a'],['L1:b','AM1:a'],['AM1:b','JA:j'],['JA:j','S1:d',[[460,60]]],['S1:s','JB:j',[[880,60]]],
    ['JA:j','AM3:a'],['AM3:b','CS:p'],['CS:n','JB:j'],['JA:j','S2:d',[[460,300]]],['S2:s','JL1:j'],['JL1:j','LC:a'],['LC:b','JL2:j'],['JL1:j','RP:a',[[610,360]]],['RP:b','JL2:j',[[690,360]]],
    ['JL2:j','RC:a'],['RC:b','AM2:a'],['AM2:b','CH1:a'],['CH1:b','JB:j'],['JB:j','V2:p',[[980,160]]],['V1:n','G1:g'],['V2:n','G2:g'],
    ['K1:y','S1:g'],['K2:y','S2:g'],['AM1:y','SC1:i'],['CH1:v','SC1:v'],['CH1:vav','SC1:vav'],['SC1:vref','CH1:ref']];
   return project(comps,wires,{version:4,solve:{init:'ac'},sim:{hDiv:10,method:'TR',speed:0.2,stopT:1.4},
    scope:{panes:[[['I:L1','ρεύμα γραμμής'],['Y:AM3','ρεύμα πυκνωτή'],['Y:AM2','ρεύμα μετατροπέα']],[[ch.arm,'τάση μετατροπέα'],['Y:SC1/VR','αναφορά']],[['Y:SC1/XM','X μετρημένη'],['Y:SC1/VQ','V_q (εντολή)']],ch.cells.slice(0,4).map((k,i)=>[k,'v_C'+(i+1)])],window:{unit:'s',n:0.1}},
    meta:{ccsc:{V,d,R:8,L:0.12,f:50,N,Vdc,C:10e-3,Cs,Xc,Lc:1.5e-3,Rc:0.5,Rp:1000,mode,X:sc.X,ma:sc.ma,t1:0.2,t2:0.5}}});}});
 // 4.14 (ROADMAP §42): an MMC-HVDC link as the test system of the MMC station of EMTP-RV: two stations, AC grids of 10 GVA,
 // transformers 400/333 kV (YNd1, 18 %), star-point reactors, MMCs of N cells per arm (the four models), a ±320 kV cable
 // pair of 70 km as a wideband model (DC correction); station 1 controls P (and Q), station 2 the DC voltage (and Q)
 const HVDC_UP='0:0, 0.1:0.25, 0.125:0.5, 0.15:0.75, 0.175:1',HVDC_P={pstep:HVDC_UP+', 0.5:0.5',acf:HVDC_UP,dcf:HVDC_UP,rev:HVDC_UP+', 0.5:0.5, 0.55:0, 0.6:-0.5'};
 T.push({id:'hvdc_mmc',group:'HVDC: MMC (4.14)',title:'Σύνδεση HVDC με MMC σημείο προς σημείο (±320 kV, 1000 MW)',theory:'formula',topology:'hvdc_mmc',
  options:[{k:'model',label:'Μοντέλο MMC',options:[['m2','Model 2: ισοδύναμο βραχίονα (κάθε πυκνωτής)'],['m3','Model 3: συνάρτηση μεταγωγής βραχίονα'],['m4','Model 4: μέσο μοντέλο (AVM)'],['m1','Model 1: κάθε υπομονάδα από IGBT (N = 20, αργό)']],def:'m4'},
   {k:'N',label:'Υπομονάδες ανά βραχίονα',options:[['400','400 (401 επίπεδα)'],['100','100'],['20','20']],def:'400'},
   {k:'ectl',label:'Ενέργεια των βραχιόνων (Model 1–3)',options:[['energy','Έλεγχος ενέργειας (4.15): ίδια απόκριση με το Model 4'],['direct','Άμεση διαμόρφωση (4.14)']],def:'energy'},
   {k:'cc',label:'Έλεγχος ρεύματος των σταθμών (4.20)',options:[['pi','PI με αποσύζευξη και πρόσθια τροφοδότηση της τάσης'],['robust','Στιβαρός (VCC): ο σταθμός 1 σε P, ο σταθμός 2 σε V_dc']],def:'pi'},
   {k:'ev',label:'Γεγονός',options:[['pstep','Βήμα P του σταθμού 1: 1 → 0,5 pu στα 0,5 s'],['acf','Τριφασικό σφάλμα AC στον σταθμό 2 (0,5–0,65 s)'],['dcf','Σφάλμα DC πόλου–πόλου στον σταθμό 2 (0,5 s)'],['rev','Αντιστροφή ροής: 1 → 0 → −0,5 pu (0,5–0,6 s)']],def:'pstep'}],
  desc:'Δύο σταθμοί MMC όπως ο σταθμός MMC του EMTP-RV: δίκτυα AC 400 kV με S″k 10 GVA, μετασχηματιστές 400/333 kV YNd1 με u_k 18 %, αντιδραστήρες αστέρα για αναφορά γης στο τρίγωνο, μετατροπείς με N υπομονάδες ανά βραχίονα (C = 10 mF για N = 400, ίδια ενέργεια για τα άλλα N, 30 kJ/MVA), αυτεπαγωγή βραχίονα 50 mH, και ζεύγος καλωδίων ±320 kV 70 km ως μοντέλο wideband (1 mHz – 10 MHz, με διόρθωση DC). Ο σταθμός 1 ρυθμίζει P και Q, ο σταθμός 2 την τάση DC και Q. Οι πυκνωτές και τα καλώδια ξεκινούν φορτισμένα· οι μετατροπείς απεμπλέκονται στα 50 ms (ώσπου να κλειδώσουν τα PLL).',
  tasks:['Μετά το βήμα του P στα 0,5 s: πόσο αλλάζει η V_dc του σταθμού 2 και σε πόσο χρόνο επανέρχεται; Σύγκρινε τα μοντέλα 2, 3 και 4.','Με την άμεση διαμόρφωση (4.14) η κυμάτωση των πυκνωτών περνά στην τάση AC και τα Model 2 και 3 απομακρύνονται από το Model 4. Πόσο; Με τον έλεγχο ενέργειας ξανά ίδια: δες τις Σv_C του άνω και του κάτω βραχίονα (εξισορρόπηση).','Στο σφάλμα AC ο σταθμός 2 μπλοκάρει: τι κρατά τη V_dc κάτω από 1,2 pu; (Το όριο υπέρτασης DC του σταθμού 1.)','Στο σφάλμα DC: πόσο φτάνει το ρεύμα DC πριν και μετά το μπλοκάρισμα; Από πού έρχεται το ρεύμα μετά το μπλοκάρισμα;','Με N = 20 οι τάσεις των πυκνωτών και το ρεύμα AC έχουν σκαλοπάτια: πόσο μεγάλα; Πόση είναι η κυμάτωση των πυκνωτών στη σταθερή κατάσταση;'],
  build(o){const model=['m1','m2','m3','m4'].includes(o.model)?o.model:'m4',N=model==='m1'?20:(+o.N||400),ev=HVDC_P[o.ev]?o.ev:'pstep',f=50;
   const mmc={impl:model==='m1'?'blocks':'fast',model:model==='m1'?'m2':model,N,C:+(10e-3*N/400).toPrecision(6),Vdc:640e3,Larm:0.05,Ron:1e-3,ectl:o.ectl==='direct'?'direct':'energy',conn:'bus'};
   const ctl={S:1059e6,Vac:333e3,Vdc:640e3,f0:f,X:0.075,R:0.002,th0:-120,tdb:0.05,tbrk:0,prot:'on',Idcmax:2,tprot:0.3};
   const comps=[],wires=[];
   const station=(k,x0,dir,ctlp)=>{const X=d=>x0+dir*d,id=s=>s+k;
    comps.push(C(id('NET'),'GRID3',X(0),300,{Un:400e3,f,Sk:10e9,XR:10,cf:1,emf:'un',conn:'bus'},{label:'δίκτυο '+k,flip:dir<0}),
     C(id('CB'),'CB3',X(120),300,{ctl:'sig',model:'ideal',conn:'bus'},{label:'διακόπτης AC '+k,flip:dir<0}),
     C(id('TR'),'XF3',X(240),300,{grp:'YNd1',Sn:1059e6,U1:400e3,U2:333e3,f,uk:18,i0:0,conn:'bus'},{label:'400/333 kV',flip:dir<0}),
     C(id('J'),'JUNC',X(340),300),C(id('SR'),'LOAD3',X(340),420,{cn:'yn',Un:333e3,f,P:5e4,Q:3e6,conn:'bus'},{label:'αντιδραστήρας αστέρα'}),
     C(id('MMC'),'MMC',X(480),320,mmc,{label:'MMC '+k,flip:dir<0}),
     C(id('CT'),'MMCC',X(480),600,{...ctl,...ctlp},{label:'έλεγχος '+k,flip:dir<0}));
    wires.push([id('NET')+':abc',id('CB')+':abc1'],[id('CB')+':abc2',id('TR')+':abc1'],[id('TR')+':abc2',id('J')+':j'],[id('J')+':j',id('SR')+':abc'],[id('J')+':j',id('MMC')+':abc']);
    for(const s of ['va','vb','vc','ia','ib','ic','vdc','idc','vs'])wires.push([id('MMC')+':'+s,id('CT')+':'+s]);
    for(const s of ['ma','mb','mc','blk'])wires.push([id('CT')+':'+s,id('MMC')+':'+s]);
    wires.push([id('CT')+':brk',id('CB')+':cmd']);};
   // 4.20 (decision 221 (a)): the robust current control in both stations, the station of V_dc too
   const rob=o.cc==='robust'?{cc:'robust',acc:4,Tii:0.05,bw:5}:{};          // with the PLL of 5 Hz, as in gfm_weak (decision 209): at 20 Hz the station of V_dc swings at ~30 Hz
   station(1,60,1,{mode:'p',Pref:HVDC_P[ev],Tp:0.1,qmode:'q',Qref:'0',Tq:0.1,...rob});
   station(2,1740,-1,{mode:'vdc',Vdcref:'1',Tvdc:0.05,H:0.03,qmode:'q',Qref:'0',Tq:0.1,...rob});
   // the cable pair: conductor 1 the + pole, conductor 2 the − pole, charged to ±320 kV
   const Pp=root.Parts,d=JSON.parse(JSON.stringify(Pp.TLM_TYPICAL['320kV-dc']));
   const pc={...Pp.defaults('TLM'),model:'wb',len:70,fmin:1e-3,dec:10,wdc:'1',wpas:'enforce',vtrap:'320e3, -320e3',data:JSON.stringify(d)};
   const m=LM()?.['320kV-dc|70|wb'];pc.mdl=m?JSON.stringify({...m,src:Pp.tlmKey(pc)}):'';
   comps.push(C('CAB','TLM',900,300,pc,{label:'καλώδια ±320 kV · 70 km (WB)'}));
   wires.push(['MMC1:p','CAB:a1'],['MMC1:n','CAB:b1'],['CAB:a2','MMC2:p'],['CAB:b2','MMC2:n']);
   if(ev==='acf'){comps.push(C('FAC','FLT3',1400,460,{kind:'abcg',ton:0.5,toff:0.65,clr:'zero',conn:'bus'},{label:'σφάλμα AC'}));wires.push(['J2:j','FAC:abc']);}
   if(ev==='dcf'){comps.push(C('FDC','SW',1180,300,{gate:'sig',model:'mos',Ron:0.1,Roff:1e9,body:false},{rot:1,label:'σφάλμα DC'}),C('KDC','CONST',1100,420,{v:'0:0, 0.5:1'}));
    wires.push(['FDC:d','MMC2:p'],['FDC:s','MMC2:n'],['KDC:y','FDC:g']);}
   const arm=model==='m4'?[['Y:MMC1/VCD','v του C_dc 1'],['Y:MMC2/VCD','v του C_dc 2']]:model==='m1'?[['Y:MMC1/UaN:vav','μέση V_C άνω a 1'],['Y:MMC1/LaN:vav','μέση V_C κάτω a 1']]:[['Y:MMC1/AUa','Σv_C άνω a 1'],['Y:MMC1/ALa','Σv_C κάτω a 1']];
   return project(comps,wires,{version:4,solve:{tbase:0.02},sim:{hDiv:1000,method:'TR',speed:0.02,stopT:1},
    scope:{panes:[[['Y:CT1/PP','P σταθμού 1 (pu)'],['Y:CT2/PP','P σταθμού 2 (pu)']],[['Y:CT1/Fvdc','V_dc 1 (pu)'],['Y:CT2/Fvdc','V_dc 2 (pu)']],[['Y:MMC1/IDC','I_dc 1'],['Y:MMC2/IDC','I_dc 2']],
     [['Y:MMC1/IAa','i_a 1'],['Y:MMC1/IAb','i_b 1'],['Y:MMC1/IAc','i_c 1']],arm],window:{unit:'s',n:0.2}},
    meta:{hvdc:{model,N,ev,ectl:mmc.ectl,S:1059e6,Vdc:640e3,Vac:333e3,C:mmc.C,Larm:0.05,Ron:1e-3,Sk:10e9,uk:18,len:70}}});}});
 // 4.18.1 (§58): the MMC station as a grid-forming converter (MMCC mode 'gfm': the law of GFMC inside). The link of hvdc_mmc
 // (Model 4, cables ±320 kV 70 km WB): station 1 holds V_dc from a strong grid, station 2 forms the AC voltage of an island
 // (load step), of a weak grid (SCR 1,5, step of P) or of an island together with a second grid-forming unit (VSC2 + GFMC
 // 500 MVA, droop: the load shared in proportion to the ratings)
 const HVDC_G={island:'Νησίδα: μόνο φορτία, +300 MW στα 0,6 s',weak:'Ασθενές δίκτυο (SCR 1,5): P 0,5 → 0,9 pu στα 0,6 s',par:'Νησίδα με δεύτερη μονάδα grid-forming 500 MVA: +300 MW στα 0,6 s'};
 // ------------------------------------------------------------------ 4.20 (ROADMAP §82): a multi-terminal DC grid in EMT
 // The five-terminal grid of Haileselassie & Uhlen (2012, Fig. 3, Tables II–IV): 400 kV pole to pole, r = 0.01 Ω/km and
 // c = 5 μF/km per conductor (the paper gives no inductance: 0.2 mH/km here, a value of an example). One line per pole
 // pair: R = 2·r·l and L = 2·L′·l in series, and the capacitance between the poles c·l/2 split at the two ends. Each
 // converter as its DC side only: a current source I = P(u)/u through a lag of 5 ms (the current control), with
 // P = P₀ − R·(u − U₀) on the droop (R = P_rated/(ρ·U_n)) and a schedule of P at terminal 3; 50 μF of its own. The start is
 // the load flow of Table IV (the capacitors at its voltages, the lines at its currents); the card runs the AC/DC load
 // flow of the same grid in the engine (pcl.dcgrid, the case mtdc5), so the two can be compared after the step.
 const MTDC5={U:{1:399.550e3,2:400e3,3:396.613e3,4:396.928e3,5:385.247e3},P:{1:600e6,2:535.938e6,3:-750e6,4:550e6,5:-900e6},rated:{1:900e6,2:800e6,3:1000e6,4:750e6,5:1200e6},
  lines:[['1','2',80],['1','4',125],['1','3',200],['2','3',160],['3','4',160],['4','5',250]]};
 T.push({id:'mtdc5',group:'Δίκτυα DC πολλών τερματικών (4.20)',title:'Δίκτυο DC πέντε τερματικών με στατικότητα τάσης (EMT και ροή φορτίου AC/DC)',theory:'formula',topology:'mtdc5',
  options:[{k:'step',label:'Συμβάν στα 0,1 s',options:[['m50','Ο σταθμός 3 παίρνει 50 MW περισσότερα (−750 → −800 MW)'],['p250','Ο σταθμός 3 παίρνει 250 MW λιγότερα (−750 → −500 MW)'],['trip5','Ο σταθμός 5 βγαίνει (−900 MW → 0)'],['none','Κανένα']],def:'m50'},
   {k:'rho',label:'Στατικότητα ρ των σταθμών 1, 2, 4, 5',options:[['0.04','ρ = 0,04'],['0.08','ρ = 0,08'],['0.02','ρ = 0,02']],def:'0.04'}],
  desc:'Πέντε σταθμοί μετατροπέων σε ένα δίκτυο DC 400 kV (πόλος–πόλος) με έξι καλώδια. Οι σταθμοί 1, 2, 4, 5 μοιράζονται κάθε αλλαγή ισχύος με στατικότητα τάσης: P = P₀ − R·(U − U₀), με R = P_ονομ/(ρ·U_n). Ο σταθμός 3 κρατά σταθερή ισχύ. Κάθε σταθμός είναι εδώ μόνο η πλευρά DC του: πηγή ρεύματος I = P(U)/U με καθυστέρηση 5 ms. Το δίκτυο ξεκινά στη ροή φορτίου της δημοσίευσης. Η κάρτα τρέχει στο engine τη ροή φορτίου AC/DC του ίδιου δικτύου μετά το συμβάν, για σύγκριση με τις τιμές του EMT όταν ηρεμήσει. Δεδομένα: Haileselassie & Uhlen (2012), Σχ. 3 και Πίν. II–IV.',
  tasks:['Τρέξε ως τα 0,6 s με «−750 → −800 MW»: στα 0,6 s οι τάσεις είναι 399,287 / 399,726 / 396,204 / 396,677 / 385,118 kV και οι ισχείς 614,82 / 549,65 / −800 / 561,75 / −890,33 MW. Είναι οι τιμές της ροής φορτίου στην κάρτα, και του PSCAD της δημοσίευσης (Πίν. VI) μέσα σε 0,01 MW.',
   'Η αλλαγή δεν μοιράζεται ανάλογα με τα R: ο σταθμός 5, ο πιο μακρινός από τον 3, παίρνει 9,7 MW αντί για 16,4 MW που θα έδινε ένα δίκτυο χωρίς αντιστάσεις. Οι πτώσεις τάσης στις γραμμές αλλάζουν τη μοιρασιά.',
   'Με ρ = 0,02 οι τάσεις αλλάζουν λιγότερο και ο σταθμός 5 παίρνει ακόμη λιγότερο από τα +250 MW (−34,5 MW). Με ρ = 0,08 οι τάσεις αλλάζουν περισσότερο και η μοιρασιά πλησιάζει την αναλογία των R.',
   '«Ο σταθμός 5 βγαίνει»: οι σταθμοί 1, 2, 4 παίρνουν τα 900 MW που έδινε με τις στατικότητές τους, και οι τάσεις ανεβαίνουν ως τα 405 kV. Η ροή φορτίου της κάρτας δίνει τις ίδιες τιμές.',
   'Η κάρτα: «▶ Τρέξε τη μελέτη» και «⬇ Εξαγωγή αναφοράς». Από κώδικα: pcl.network.case_data(\'mtdc5\').acdc_flow().'],
  build(o){const D=MTDC5,rho=+o.rho||0.04,lp=0.2e-3,cpk=5e-6,Cc=50e-6,tau=5e-3,ts=0.1,X={2:120,1:300,3:480,4:660,5:840},Y0=230;
   const comps=[],wires=[],Cend={1:Cc,2:Cc,3:Cc,4:Cc,5:Cc};
   for(const [a,b,l] of D.lines){Cend[a]+=cpk*l/4;Cend[b]+=cpk*l/4;}
   const P3=o.step==='m50'?-800e6:o.step==='p250'?-500e6:-750e6;
   for(const k of [1,2,3,4,5]){const x=X[k],U0=D.U[k],I0=D.P[k]/U0;
    comps.push(J('N'+k,x,Y0),C('C'+k,'C',x-50,Y0+80,{C:+Cend[k].toPrecision(6),v0:U0},{label:'',lbl:'none'}),C('I'+k,'IDC',x+10,Y0+80,{ctl:'sig'},{label:'',lbl:'none'}),
     C('VM'+k,'VM',x+70,Y0+80,{},{label:'U'+k}),J('A'+k,x+10,Y0),J('B'+k,x+70,Y0),J('Z'+k,x+10,Y0+150),J('Q'+k,x-50,Y0+150),J('W'+k,x+70,Y0+150),C('G'+k,'GND',x+10,Y0+180,{},{label:'',lbl:'none'}),
     C('F'+k,'LPF',x+10,Y0+300,{fc:+(1/(2*Math.PI*tau)).toPrecision(6),y0:String(+I0.toPrecision(10))},{label:'',lbl:'none'}),
     C('PW'+k,'EXPR',x+20,Y0+380,{expr:'u*i/1e6',ins:'u, i',pars:''},{label:'P'+k+' (MW)',lbl:'below'}));
    const R=D.rated[k]/(rho*400e3),trip=o.step==='trip5'&&k===5;
    if(k===3){comps.push(C('PR3','CONST',x-80,Y0+240,{v:o.step==='m50'||o.step==='p250'?`0:${D.P[3]}, ${ts}:${P3}`:String(D.P[3]),unit:'W'},{label:'P₃',lbl:'above'}),
      C('K3','EXPR',x-60,Y0+300,{expr:'p/max(u, 1e5)',ins:'u, p',pars:''},{label:'',lbl:'none'}));wires.push(['PR3:y','K3:p',[[x-40,Y0+240],[x-40,Y0+290],[x-95,Y0+290],[x-95,Y0+310]]]);}
    else comps.push(C('K'+k,'EXPR',x-60,Y0+300,{expr:trip?`t < ${ts} ? (p0 - r*(u - u0))/max(u, 1e5) : 0`:'(p0 - r*(u - u0))/max(u, 1e5)',ins:'u',pars:`p0 = ${+D.P[k].toPrecision(10)}, r = ${+R.toPrecision(10)}, u0 = ${U0}`},{label:'',lbl:'none'}));
    wires.push(['N'+k,'A'+k],['A'+k,'B'+k],['A'+k,'I'+k+':p'],['B'+k,'VM'+k+':p'],['N'+k,'C'+k+':p',[[x-50,Y0]]],['C'+k+':n','Q'+k],['Q'+k,'Z'+k],['I'+k+':n','Z'+k],['VM'+k+':n','W'+k],['W'+k,'Z'+k],['Z'+k,'G'+k+':g'],
     ['VM'+k+':y','K'+k+':u',[[x+120,Y0+80],[x+120,Y0+230],[x-110,Y0+230],[x-110,Y0+300]]],['K'+k+':y','F'+k+':u'],['F'+k+':y','I'+k+':u',[[x+60,Y0+300],[x+60,Y0+200],[x-20,Y0+200],[x-20,Y0+80]]],
     ['VM'+k+':y','PW'+k+':u',[[x+120,Y0+80],[x+120,Y0+360],[x-30,Y0+360],[x-30,Y0+370]]],['F'+k+':y','PW'+k+':i',[[x+60,Y0+300],[x+60,Y0+340],[x-25,Y0+340],[x-25,Y0+390]]]);}
   // the six lines above the buses: the neighbours on one level, the two that skip a bus higher up
   const lv={'2-1':0,'1-3':0,'3-4':0,'4-5':0,'2-3':1,'1-4':2};
   for(const [a,b,l] of D.lines){const key=lv[`${a}-${b}`]!==undefined?`${a}-${b}`:`${b}-${a}`,[p,q]=key.split('-'),h=Y0-50-55*lv[key],xm=(X[p]+X[q])/2,R=2*0.01*l,Lh=2*lp*l,i0=(D.U[p]-D.U[q])/R;
    comps.push(C('L'+a+b,'L',xm,h,{L:+Lh.toPrecision(6),Rs:R,i0:+i0.toPrecision(10)},{label:`${a}–${b} · ${l} km`,lbl:'above'}));
    wires.push(['N'+p,'L'+a+b+':a',[[X[p],h]]],['L'+a+b+':b','N'+q,[[X[q],h]]]);}
   const ms=o.step==='none'?0.3:0.6;
   return project(comps,wires,{sim:{hDiv:10,speed:300,stopT:ms},scope:{panes:[[...[1,2,3,4,5].map(k=>['Y:VM'+k,'U'+k])],[...[1,2,3,4,5].map(k=>['Y:PW'+k,'P'+k+' (MW)'])]],window:{unit:'T',n:Math.round(ms/1e-3)}},
    meta:{rho,step:o.step,study:{net:'mtdc5',study:'acdc',layer:'flow',options:o.step==='trip5'?{out:['C5'],...(rho!==0.04?{set:Object.fromEntries(['C1','C2','C4'].map(c=>[c,{droop:rho}]))}:{})}:
     {set:{...(P3!==-750e6?{C3:P3}:{}),...(rho!==0.04?Object.fromEntries(['C1','C2','C4','C5'].map(c=>[c,{droop:rho}])):{})}}}}});}});
 // ------------------------------------------------------------------ 4.20.1 (ROADMAP §83, decision 320): DCS2 of the CIGRE B4 in EMT
 // The five-terminal ±200 kV grid DCS2 of the CIGRE B4 as the book of Jovcic gives it (2019, §27.8, Fig. 27.6, Tables 7.3 and
 // 27.11; pcl.dcgrid.cigre_b4): B2–B3 cable 200 km, B5–B3 overhead line 100 km, F1–B5 cable 100 km, E1–F1 cable 200 km, one
 // line per pole pair as in mtdc5 (R = 2·r·l and L = 2·L′·l in series, the capacitance between the poles c·l/2 split at the
 // two ends; the conductance G of the cables left out). Four MMC stations (Model 4) with their AC side through a YNd1
 // transformer (u_k 18 %): Cm-B3 (1200 MVA) holds V_dc, or droops; Cm-B2 (800 MVA) gives 150 MW, or droops; Cm-E1 (200 MVA)
 // forms the voltage and frequency of the offshore load of 100 MW; Cm-F1 (800 MVA) forms those of an offshore wind farm of
 // 500 MW (a two-level converter with current control, an average model). The DC/DC converter Cd-E1 as its DC side: a current
 // source P/u at E1 through a lag of 5 ms. The station data (the voltages on the AC side, the arm, the cells, the gains) are
 // the per-unit values of hvdc_mmc, values of an example: the book gives only the ratings. The DC buses and lines start on
 // the load flow of pcl.dcgrid.cigre_b4() (B4_DCS2 below, checked in tests/test_b4.py); the card runs the AC/DC load flow
 // of the case b4 in the engine after the same event, for comparison.
 const B4_DCS2={U:{B2:401419.9592890437,B3:400000,B5:404559.8670495563,F1:407816.9149420965,E1:409672.05733317713},
  lines:[['B2','B3',200,'cable',373.6734971167569],['B5','B3',100,'ohl',1714.2357329158963],['F1','B5',100,'cable',1714.2357329158963],['E1','F1',200,'cable',488.1953660738471]],
  data:{cable:[0.0095,2.111e-3,0.2104e-6],ohl:[0.0133,0.8273e-3,0.0139e-6]}};
 // the AC/DC load flow of the case b4 (pcl.network.case_data('b4')) after the same event, with the same laws of the onshore stations
 function b4Study(ev,dr,kd){const set={};
  if(ev==='cd55')set['Cd-E1']=55e6;else if(ev==='wind')set['Cm-F1']=250e6;else if(ev==='load')set['Cm-E1']=-150e6;
  if(dr){set['Cm-B3']={control:'droop',droop:kd,P:-900e6,V:1};set['Cm-B2']={control:'droop',droop:kd,P:150e6,V:1};}
  return Object.keys(set).length?{set}:{};}
 const B4_EV={cd55:'Ο Cd-E1 ρίχνει την ισχύ του 300 → 55 MW στο 1 s (όπως στο Σχ. 27.7)',wind:'Το αιολικό του F1 πέφτει 500 → 250 MW στο 1 s',load:'Το υπεράκτιο φορτίο του E1 ανεβαίνει 100 → 150 MW στο 1 s',none:'Κανένα'};
 T.push({id:'b4dcs2',group:'Δίκτυα DC πολλών τερματικών (4.20)',title:'Το DCS2 του B4 της CIGRE: πέντε τερματικά ±200 kV με σταθμούς MMC (EMT και ροή φορτίου)',theory:'formula',topology:'b4dcs2',
  options:[{k:'ev',label:'Συμβάν',options:Object.entries(B4_EV),def:'cd55'},
   {k:'ctl',label:'Οι σταθμοί της ξηράς',options:[['vdc','Cm-B3 κρατά τη V_dc, Cm-B2 δίνει 150 MW (όπως το cigre_b4)'],['droop','Και οι δύο με στατικότητα k_d = 0,05 γύρω από τις αναφορές τους']],def:'vdc'}],
  desc:'Το DCS2 του δικτύου δοκιμής B4 της CIGRE όπως το δίνει το βιβλίο του Jovcic (§27.8): πέντε ζυγοί ±200 kV, τρία καλώδια και μία εναέρια γραμμή με τα δεδομένα του Πίν. 7.3, τέσσερις σταθμοί MMC (Model 4) με την πλευρά AC τους και ο μετατροπέας DC/DC Cd-E1 που φέρνει 300 MW από το DCS3. Οι σταθμοί της ξηράς Cm-B3 και Cm-B2 κρατούν την τάση DC και τα 150 MW του Πίν. 27.11, ή μοιράζονται κάθε αλλαγή με στατικότητα. Οι υπεράκτιοι Cm-E1 και Cm-F1 σχηματίζουν την τάση και τη συχνότητα των δικτύων τους (V/f): ένα φορτίο 100 MW και ένα αιολικό 500 MW. Οι γραμμές ξεκινούν στη ροή φορτίου του δικτύου DC· οι σταθμοί ξεκλειδώνουν στα 20 ms, το αιολικό και ο Cd-E1 ανεβαίνουν από τα 0,1 s. Η κάρτα τρέχει τη ροή φορτίου AC/DC του B4 μετά το ίδιο συμβάν και δείχνει δίπλα τις τιμές του EMT.',
  tasks:['Στα 0,95 s (πριν από το συμβάν): οι τάσεις DC είναι της ροής φορτίου της κάρτας στο 0,1 % περίπου. Η διαφορά είναι οι απώλειες των σταθμών, που η ροή φορτίου του B4 δεν έχει.','«Ο Cd-E1 ρίχνει την ισχύ του»: τα 245 MW που λείπουν τα παίρνει ο Cm-B3, που κρατά την τάση. Με στατικότητα τα παίρνουν οι δύο σταθμοί της ξηράς, αλλά όχι 2:3 όπως οι ονομαστικές τους ισχείς: η τάση του B3 πέφτει περισσότερο από του B2, και ο Cm-B2 παίρνει περίπου 77 MW, ο Cm-B3 160 MW, όσο και στη ροή φορτίου. Σύγκρινε με το Σχ. 27.7, όπου τα μοιράζει και ο κεντρικός ελεγκτής.','Οι υπεράκτιοι σταθμοί δεν βλέπουν το συμβάν: κρατούν την τάση και τη συχνότητα των δικτύων τους, και η ισχύς τους είναι όση ζητούν το φορτίο και το αιολικό.','Η κάρτα: «▶ Τρέξε τη μελέτη» για τη ροή φορτίου AC/DC όλου του B4 μετά το συμβάν. Από κώδικα: pcl.network.case_data(\'b4\').acdc_flow() ή pcl.dcgrid.cigre_b4().flow().'],
  build(o){const ev=B4_EV[o.ev]?o.ev:'cd55',dr=o.ctl==='droop',f=50,Vdc=400e3,Vac=208e3,N=400,te=1,kd=0.05,ms=2,D=B4_DCS2,r=x=>+x.toPrecision(10);
   const comps=[],wires=[],X={B2:520,B3:1120,B5:1460,F1:2240,E1:2840},Y0=200,Cend={B2:0,B3:0,B5:0,F1:0,E1:0};
   for(const [a,b,l,k] of D.lines){const c=D.data[k][2]*l/4;Cend[a]+=c;Cend[b]+=c;}
   // a DC bus: its node, the capacitance of its lines to ground and a voltmeter
   const dcbus=k=>{const x=X[k],id=s=>s+k;
    comps.push(J(id('N'),x,Y0),C(id('CB'),'C',x-60,Y0+70,{C:r(Cend[k]),v0:r(D.U[k])},{label:'',lbl:'none'}),J(id('Q'),x-60,Y0+140),C(id('GB'),'GND',x-60,Y0+170,{},{label:'',lbl:'none'}),
     C(id('VM'),'VM',x+60,Y0+70,{},{label:'U '+k,lbl:'right'}),J(id('W'),x+60,Y0+140),C(id('GW'),'GND',x+60,Y0+170,{},{label:'',lbl:'none'}));
    wires.push([id('N'),id('CB')+':p',[[x-60,Y0]]],[id('CB')+':n',id('Q')],[id('Q'),id('GB')+':g'],[id('N'),id('VM')+':p',[[x+60,Y0]]],[id('VM')+':n',id('W')],[id('W'),id('GW')+':g']);};
   // a station: the MMC (Model 4) below and left of its bus (AC on the left, DC on the right), its transformer left of it,
   // its control below it; returns the AC pin of the transformer and where it is
   const mmcp=S=>({impl:'fast',model:'m4',N,C:r(2*30e3*S/1e6/(6*N*(Vdc/N)**2)),Vdc,Larm:r(0.15*Vac*Vac/S/(2*Math.PI*f)),Ron:1e-3,ectl:'energy',conn:'bus'});
   const station=(k,S,U1,ctl,label)=>{const x=X[k],id=s=>s+k,xm=x-140,ym=Y0+320;dcbus(k);
    comps.push(C(id('MMC'),'MMC',xm,ym,{...mmcp(S),vc0:r(D.U[k]/Vdc)},{label,lbl:'above'}),C(id('GN'),'GND',xm+80,ym+30,{},{label:'',lbl:'none'}),
     C(id('TR'),'XF3',xm-170,ym-30,{grp:'YNd1',Sn:S,U1,U2:Vac,f,uk:18,i0:0,conn:'bus'},{label:'',lbl:'none'}),
     C(id('CT'),'MMCC',xm,ym+230,{S,Vac,Vdc,f0:f,X:0.075,R:0.002,th0:-120,tdb:0.02,tbrk:0,prot:'off',...ctl},{label:'',lbl:'none'}),
     C(id('PW'),'EXPR',x+170,Y0+130,{expr:'u*i/1e6',ins:'u, i',pars:''},{label:'P '+k+' (MW)',lbl:'above'}));
    wires.push([id('N'),id('MMC')+':p',[[x,ym-40]]],[id('MMC')+':n',id('GN')+':g',[[xm+80,ym-20]]],[id('TR')+':abc2',id('MMC')+':abc']);
    // the signals in channels 8 apart (no routing at load): the measurements down the right of the MMC, across between the
    // two, up the left into the control; the modulation from the right of the control around both into the left of the MMC
    const yo={va:0,vb:10,vc:20,ia:30,ib:40,ic:50,vdc:60,idc:70,vs:80},yi={va:-40,vb:-30,vc:-20,ia:0,ib:10,ic:20,vdc:40,idc:50,vs:60},yc=ym+230;
    Object.keys(yo).forEach((s,j)=>{const xr=xm+62+8*j,xl=xm-62-8*(8-j),h=ym+128+6*j;wires.push([id('MMC')+':'+s,id('CT')+':'+s,[[xr,ym+yo[s]],[xr,h],[xl,h],[xl,yc+yi[s]]]]);});
    [['ma',-40,0],['mb',-30,10],['mc',-20,20],['blk',10,40]].forEach(([s,a,b],j)=>{const xr=xm+150+8*j,xl=xm-150-8*j,h=ym+100+6*j;
     wires.push([id('CT')+':'+s,id('MMC')+':'+s,[[xr,yc+a],[xr,yc+90+8*j],[xl,yc+90+8*j],[xl,ym+b]]]);});
    wires.push([id('VM')+':y',id('PW')+':u'],[id('MMC')+':idc',id('PW')+':i']);
    return [id('TR')+':abc1',xm-170,ym-30];};
   dcbus('B5');
   // the onshore stations: a network of 400 kV, S″k 10 GVA
   const sB3=dr?{mode:'droop',Pref:'-0.75',Vdcref:'1',kdr:kd,Tp:0.1,qmode:'q',Qref:'0',Tq:0.1}:{mode:'vdc',Vdcref:'1',Tvdc:0.1,H:0.03,qmode:'q',Qref:'0',Tq:0.1};
   const sB2=dr?{mode:'droop',Pref:'0.1875',Vdcref:'1',kdr:kd,Tp:0.1,qmode:'q',Qref:'0',Tq:0.1}:{mode:'p',Pref:'0.1875',Tp:0.1,qmode:'q',Qref:'0',Tq:0.1};
   for(const [k,S,ctl] of [['B3',1200e6,sB3],['B2',800e6,sB2]]){const [pin,x,y]=station(k,S,400e3,ctl,'Cm-'+k);
    comps.push(C('NET'+k,'GRID3',x-150,y,{Un:400e3,f,Sk:10e9,XR:10,cf:1,emf:'un',conn:'bus'},{label:'δίκτυο '+k,lbl:'below'}));wires.push(['NET'+k+':abc',pin]);}
   // the offshore stations form their AC voltage (V/f) on 145 kV: E1 a load, F1 a wind farm
   {const [pin,x,y]=station('E1',200e6,145e3,{mode:'vf',Vfref:'1',Tvf:0.05,Xpcc:0.18},'Cm-E1');
    comps.push(J('JE1',x-90,y),C('LDE1','LOAD3',x-90,y+80,{cn:'yn',Un:145e3,f,P:100e6,Q:0,model:'z',conn:'bus'},{label:'φορτίο 100 MW',lbl:'below'}));wires.push(['JE1',pin],['JE1','LDE1:abc']);
    if(ev==='load'){comps.push(C('CBL','CB3',x-200,y,{cmd:`0:0, ${te}:1`,model:'ideal',conn:'bus'},{label:'',lbl:'none'}),C('LDL','LOAD3',x-280,y+80,{cn:'yn',Un:145e3,f,P:50e6,Q:0,model:'z',conn:'bus'},{label:'+50 MW',lbl:'below'}));
     wires.push(['JE1','CBL:abc2'],['CBL:abc1','LDL:abc',[[x-280,y]]]);}}
   {const [pin,x,y]=station('F1',800e6,145e3,{mode:'vf',Vfref:'1',Tvf:0.05,Xpcc:0.18},'Cm-F1'),Sw=600e6,Zb=145e3*145e3/Sw,Pw=ev==='wind'?`0:0, 0.1:-0.8333333333, ${te}:-0.4166666667`:'0:0, 0.1:-0.8333333333',xv=x-230;
    comps.push(C('WBS','EBUS',x-90,y,{n:3},{label:'',lbl:'none',flip:true}),
     C('WF','VSC2',xv,y+20,{dc:'ideal',Vdc:300e3,mmax:1.155,filt:'l',Lf:r(0.15*Zb/(2*Math.PI*f)),Rf:r(0.003*Zb),conn:'sep'},{label:'αιολικό 500 MW',lbl:'above'}),
     C('WCT','MMCC',xv-200,y+60,{mode:'p',Pref:Pw,Tp:0.1,qmode:'q',Qref:'0',Tq:0.1,S:Sw,Vac:145e3,Vdc:300e3,f0:f,X:0.15,R:0.003,th0:-120,tdb:0.02,tbrk:0,prot:'off',bw:20},{label:'',lbl:'none'}),
     C('WK0','CONST',xv-330,y+170,{v:'0'},{label:'',lbl:'none'}));
    wires.push(['WBS:bus',pin],['WBS:a','WF:a'],['WBS:b','WF:b'],['WBS:c','WF:c'],['WF:vdc','WCT:vdc'],['WK0:y','WCT:idc'],['WK0:y','WCT:vs']);
    ['a','b','c'].forEach((q,j)=>{comps.push(C('WN'+q,'GAIN',xv+110,y+150+30*j,{K:-1},{label:'',lbl:'none'}));
     wires.push(['WF:i'+q,'WN'+q+':u'],['WN'+q+':y','WCT:i'+q],['WF:v'+q,'WCT:v'+q],['WCT:m'+q,'WF:m'+q]);});}
   // the DC/DC converter Cd-E1 as its DC side at E1: 300 MW from 0.1 s to 0.3 s, then the event
   {const x=X.E1+180,Pc=ev==='cd55'?`min(1, max(0, (t - 0.1)/0.2))*(t < ${te} ? 300e6 : 55e6)`:'min(1, max(0, (t - 0.1)/0.2))*300e6';
    comps.push(C('ICD','IDC',x,Y0+70,{ctl:'sig'},{label:'Cd-E1',lbl:'right'}),C('GCD','GND',x,Y0+140,{},{label:'',lbl:'none'}),
     C('KCD','EXPR',x+120,Y0+250,{expr:`(${Pc})/max(u, 1e5)`,ins:'u',pars:''},{label:'',lbl:'none'}),C('FCD','LPF',x+120,Y0+320,{fc:r(1/(2*Math.PI*5e-3)),y0:'0'},{label:'',lbl:'none'}),
     C('PWCD','EXPR',x+170,Y0+130,{expr:'u*i/1e6',ins:'u, i',pars:''},{label:'P Cd-E1 (MW)',lbl:'above'}));
    wires.push(['NE1','ICD:p',[[x,Y0]]],['ICD:n','GCD:g'],['VME1:y','KCD:u'],['KCD:y','FCD:u'],['FCD:y','ICD:u'],['VME1:y','PWCD:u'],['FCD:y','PWCD:i']);}
   // the lines above the buses
   for(const [a,b,l,k,i0] of D.lines){const [p,q]=X[a]<X[b]?[a,b]:[b,a],h=Y0-60,xm=(X[p]+X[q])/2,[rr,lp]=D.data[k];
    comps.push(C('L'+a+b,'L',xm,h,{L:r(2*lp*l),Rs:r(2*rr*l),i0:r(X[a]<X[b]?i0:-i0)},{label:`${a}–${b} · ${l} km ${k==='ohl'?'εναέρια':'καλώδιο'}`,lbl:'above'}));
    wires.push(['N'+p,'L'+a+b+':a',[[X[p],h]]],['L'+a+b+':b','N'+q,[[X[q],h]]]);}
   // the other wires that are not straight: a Z in the direction their first pin leaves (no routing at load)
   {const Pp=root.Parts,byId=new Map(comps.map(c=>[c.id,c])),at=q=>{const [c,pn]=q.includes(':')?q.split(':'):[q,'j'];return [byId.get(c),pn];},sn=v=>Math.round(v/10)*10;
    for(const w of wires){if(w[2]&&w[2].length)continue;const [ca,pa]=at(w[0]),[cb,pb]=at(w[1]),a=Pp.pinPos(ca,pa),b=Pp.pinPos(cb,pb);if(a[0]===b[0]||a[1]===b[1])continue;
     const d=Pp.pinDir(ca,pa);w[2]=d[0]?[[sn((a[0]+b[0])/2),a[1]],[sn((a[0]+b[0])/2),b[1]]]:[[a[0],sn((a[1]+b[1])/2)],[b[0],sn((a[1]+b[1])/2)]];}}
   const K=['B2','B3','B5','F1','E1'];
   return project(comps,wires,{version:4,solve:{tbase:0.02},sim:{hDiv:1000,method:'TR',speed:0.02,stopT:ms},
    scope:{panes:[K.filter(k=>k!=='B5').map(k=>['Y:PW'+k,'P '+k+' (MW)']).concat([['Y:PWCD','P Cd-E1 (MW)']]),K.map(k=>['Y:VM'+k,'U '+k])],window:{unit:'s',n:ms}},
    meta:{b4:{ev,ctl:dr?'droop':'vdc',kd,te},study:{net:'b4',study:'acdc',layer:'flow',options:b4Study(ev,dr,kd)}}});}});
 // ------------------------------------------------------------------ 4.21 (ROADMAP §87): the DC/DC converter as one element
 // Example 30.3 of Jovcic (2019, printed p. 470–471): a 370 kV DC grid (1 Ω) and a 400 kV DC grid (2 Ω), one pole each, joined by a
 // DC/DC converter (the averaged model of §30.3.3, DCDC) that holds 397 kV on the 400 kV side: (400 − 397)/2 = 1.5 kA and
 // 595.5 MW towards the 370 kV grid; when grid 2 falls to 395 kV at 1 s the converter holds 397 kV by reversing the power:
 // (397 − 395)/2 = 1 kA, 397 MW into grid 2. The sources are ideal behind their resistances (the cables of the example).
 T.push({id:'dcdc_ex303',group:'Δίκτυα DC πολλών τερματικών (4.20)',title:'Μετατροπέας DC/DC ανάμεσα σε δύο δίκτυα DC 370 και 400 kV (Παράδειγμα 30.3)',theory:'formula',topology:'dcdc_ex303',
  options:[{k:'ctl',label:'Έλεγχος του μετατροπέα',options:[['V','Κρατά 397 kV στην πλευρά των 400 kV'],['P','Σταθερή ισχύς: 595,5 MW από τα 400 προς τα 370 kV'],['droop','Στατικότητα: 595,5 MW στα 397 kV, R = 200 MW/kV']],def:'V'},
   {k:'ev',label:'Συμβάν στο 1 s',options:[['drop','Το δίκτυο των 400 kV πέφτει στα 395 kV'],['none','Κανένα']],def:'drop'}],
  desc:'Δύο δίκτυα DC ενός πόλου, 370 kV με καλώδιο 1 Ω και 400 kV με καλώδιο 2 Ω, και ένας μετατροπέας DC/DC ανάμεσά τους ως ένα στοιχείο: το μέσο μοντέλο του Jovcic (2019, §30.3.3, Σχ. 30.7), με ελεγχόμενη πηγή τάσης πίσω από το πηνίο L = 0,2 H στην πλευρά a (370 kV) και ελεγχόμενη πηγή ρεύματος με πυκνωτή στην πλευρά b (400 kV), χωρίς απώλειες. Ο εσωτερικός βρόχος κρατά το ρεύμα της πλευράς a· ο εξωτερικός την τάση της πλευράς b, ή την ισχύ, ή μια στατικότητα. Δεδομένα: Παράδειγμα 30.3. Η κάρτα δίνει τη μόνιμη κατάσταση της ροής φορτίου του δικτύου DC (pcl.dcgrid, με τον μετατροπέα DC/DC ως ένα στοιχείο) δίπλα στις τιμές του EMT.',
  tasks:['Πριν από το συμβάν: ο μετατροπέας κρατά 397 kV, το ρεύμα από το δίκτυο των 400 kV είναι (400 − 397)/2 = 1,5 kA, και 595,5 MW πηγαίνουν προς τα 370 kV (στο βιβλίο «600 MW»). Η πλευρά a είναι στα 371,6 kV: τα 595,5 MW περνούν από το καλώδιο του 1 Ω.',
   'Στο 1 s το δίκτυο των 400 kV πέφτει στα 395 kV. Με έλεγχο τάσης ο μετατροπέας κρατά τα 397 kV αντιστρέφοντας την ισχύ: (397 − 395)/2 = 1 kA, 397 MW προς τα 395 kV («400 MW» στο βιβλίο).',
   'Με σταθερή ισχύ ο μετατροπέας δεν στηρίζει την τάση: παίρνει πάντα 595,5 MW, και η τάση της πλευράς b πέφτει μαζί με το δίκτυο, στα 391,96 kV. Με στατικότητα βρίσκει ένα σημείο ανάμεσα, με R = 200 MW/kV γύρω από τα 397 kV: η ισχύς προς τα 370 kV πέφτει από 595,5 σε 97,1 MW, και η τάση μένει στα 394,51 kV.',
   'Από κώδικα: g = pcl.dcgrid.DCGrid(); … g.dcdc(\'B1\', \'B2\', \'V\', V=397/400); g.flow()[\'dcdc\'] (ο οδηγός, §31).'],
  build(o){const ctl=['V','P','droop'].includes(o.ctl)?o.ctl:'V',drop=o.ev!=='none',te=1,ms=drop?1.6:1;
   const pr={ctl,Vref:'397e3',P:ctl==='V'?'0':'-595.5e6',tr:'0.05',Rd:'2e5',kpv:'1',kiv:'100',Imax:'1800',L:'0.2',R:'0',C:'200e-6',Vb0:'397e3',bwi:'100'};
   const comps=[C('G1','VDC',120,260,{V:370e3,Rs:1},{label:'370 kV · 1 Ω',lbl:'left'}),C('G2','VDC',700,260,{V:400e3,Rs:2,...(drop?{sched:`0:400e3, ${te}:395e3`}:{})},{label:drop?'400 → 395 kV · 2 Ω':'400 kV · 2 Ω',lbl:'right'}),
    C('DD','DCDC',410,240,pr,{label:'DC/DC',lbl:'above'}),J('A1',120,210),J('A2',120,330),J('B1',700,210),J('B2',700,330),
    C('GA','GND',260,380,{},{label:'',lbl:'none'}),C('GB','GND',560,380,{},{label:'',lbl:'none'}),
    C('PW','EXPR',560,470,{expr:'p/1e6',ins:'p',pars:''},{label:'P a → b (MW)',lbl:'below'}),
    C('UA','EXPR',560,520,{expr:'u/1e3',ins:'u',pars:''},{label:'v_a (kV)',lbl:'below'}),C('UB','EXPR',560,570,{expr:'u/1e3',ins:'u',pars:''},{label:'v_b (kV)',lbl:'below'})];
   const wires=[['G1:p','A1'],['A1','DD:pa',[[300,210],[300,210]]],['G1:n','A2'],['A2','DD:na',[[330,330],[330,230]]],['G2:p','B1'],['B1','DD:pb',[[520,210]]],['G2:n','B2'],['B2','DD:nb',[[490,330],[490,230]]],
    ['A2','GA:g',[[260,330]]],['B2','GB:g',[[560,330]]],['DD:p','PW:p',[[480,260],[480,470]]],['DD:va','UA:u',[[470,290],[470,520]]],['DD:vb','UB:u',[[465,300],[465,570]]]];
   return project(comps,wires,{version:4,solve:{tbase:0.02},sim:{hDiv:400,method:'TR',speed:0.05,stopT:ms},
    scope:{panes:[[['Y:PW','P a → b (MW)']],[['Y:UB','v_b (kV)'],['Y:UA','v_a (kV)']],[['Y:DD/IA','i_a (A)'],['Y:DD/IBU','i_b (A)']]],window:{unit:'s',n:ms}},
    meta:{dcdc:{ctl,drop,te}}});}});
 T.push({id:'hvdc_gfm',group:'Grid-forming (4.18.1)',title:'Σταθμός MMC ως grid-forming: νησίδα, ασθενές δίκτυο, παράλληλα με άλλη μονάδα',theory:'formula',topology:'hvdc_gfm',
  options:[{k:'ac',label:'Δίκτυο του σταθμού 2',options:Object.entries(HVDC_G),def:'island'},{k:'law',label:'Νόμος του σταθμού 2',options:[['droop','Στατικότητα P–f 2 %, Q–V 5 % (φίλτρο 5 Hz)'],['vsm','VSM (H = 2 s)'],['psc','PSC (k_p = 50 rad/s, ρύθμιση V_ac)'],['dvoc','dVOC (η, α για 2 % και 5 %, 4.20.2)']],def:'droop'},
   // 4.20.2: the four models of the MMC as in hvdc_mmc (Model 1 with N = 20, the others with N = 400), with the energy control of the arms (4.15)
   {k:'model',label:'Μοντέλο MMC (4.20.2)',options:[['m4','Model 4: μέσο μοντέλο (AVM)'],['m3','Model 3: συνάρτηση μεταγωγής βραχίονα (≈ 4 φορές πιο αργό)'],['m2','Model 2: ισοδύναμο βραχίονα, κάθε πυκνωτής (≈ 7 φορές πιο αργό)'],['m1','Model 1: κάθε υπομονάδα από IGBT (N = 20, πολύ αργό)']],def:'m4'},
   {k:'e0',label:'dVOC: αρχικό πλάτος του ταλαντωτή (4.20.4)',options:[['vs','V_ref (ως την απεμπλοκή ακολουθεί την τάση του PLL)'],['small','E₀ = 0,01 pu (η νησίδα ξεκινά από σχεδόν μηδενική τάση)']],def:'vs'},
   // 4.21 (ROADMAP §87): the virtual resistance of dVOC; without it the DC part of the island's currents grows (a 50 Hz ripple of P)
   {k:'rv',label:'dVOC: εικονική αντίσταση R_v (4.21)',options:[['0.05','R_v = 0,05 pu (όπως στο ieee9_gfm): η συνεχής συνιστώσα των ρευμάτων σβήνει'],['0','R_v = 0 (όπως ως την 4.20.4): η συνεχής συνιστώσα μεγαλώνει, κυμάτωση 50 Hz στην P']],def:'0.05'}],
  desc:'Η σύνδεση HVDC του tutorial MMC (σταθμοί 1059 MVA, Model 4 ή όποιο μοντέλο διαλέξεις, καλώδια ±320 kV 70 km wideband). Ο σταθμός 1 κρατά την τάση DC από ένα ισχυρό δίκτυο. Ο σταθμός 2 είναι grid-forming: σχηματίζει την τάση AC του δικτύου του με τον νόμο του στοιχείου «Έλεγχος grid-forming» (στατικότητα, VSM ή PSC) μέσα στον έλεγχο του σταθμού, άμεσα η τάση με όριο ρεύματος στο 1,1 pu. Στη νησίδα δεν υπάρχει άλλη πηγή: ο σταθμός ορίζει και τη συχνότητα.',
  tasks:['Νησίδα: μετά το βήμα φορτίου η συχνότητα πέφτει κατά m_p·ΔP (κάρτα) και η ενέργεια έρχεται από τον σταθμό 1 μέσω της τάσης DC.','Με δεύτερη μονάδα: το φορτίο μοιράζεται ανάλογα με τα 1059 και 500 MVA (ίδιο pu στις δύο), χωρίς επικοινωνία.','Ασθενές δίκτυο: ο σταθμός φτάνει τα 0,9 pu στο SCR 1,5 (ο έλεγχος ρεύματος του σταθμού της 4.18 ήταν ασταθής στο SCR 1).','Σύγκρινε στατικότητα, VSM και PSC στην πτώση της συχνότητας αμέσως μετά το βήμα.','Άλλαξε το μοντέλο του MMC: με τον έλεγχο ενέργειας των βραχιόνων τα Model 2 και 3 δίνουν την P, τη συχνότητα και τη V_dc του Model 4 (κάρτα). Τι προσθέτουν; (Κυμάτωση των πυκνωτών, σκαλοπάτια της τάσης με N = 20 στο Model 1.)',
   'dVOC στη νησίδα με R_v = 0 (4.21): η συνεχής συνιστώσα των ρευμάτων AC μεγαλώνει (6 A στα 0,6 s, 23 A στα 2,85 s), και στο πλαίσιο dq φαίνεται ως κυμάτωση 50 Hz της P. Ο ταλαντωτής δεν έχει φίλτρο στις P και Q, και το δίκτυο της νησίδας έχει μεγάλη σταθερά χρόνου L/R. Με R_v = 0,05 pu σβήνει (0,45 A στα 2,85 s), με τίμημα μια πτώση στην εικονική αντίσταση: |v| 0,933 αντί 0,968 pu.'],
  build(o){const ac=HVDC_G[o.ac]?o.ac:'island',law=['droop','vsm','psc','dvoc'].includes(o.law)?o.law:'droop',f=50,S=1059e6,te=0.6,r=x=>+x.toPrecision(6);
   const model=['m1','m2','m3','m4'].includes(o.model)?o.model:'m4',N=model==='m1'?20:400;
   const mmc={impl:model==='m1'?'blocks':'fast',model:model==='m1'?'m2':model,N,C:+(10e-3*N/400).toPrecision(6),Vdc:640e3,Larm:0.05,Ron:1e-3,ectl:'energy',conn:'bus'};
   const ctl={S,Vac:333e3,Vdc:640e3,f0:f,X:0.075,R:0.002,th0:-120,tdb:0.05,tbrk:0,prot:'on',Idcmax:2,tprot:0.3};
   const comps=[],wires=[],isl=ac!=='weak';
   const station=(k,x0,dir,ctlp,grid,gap=0)=>{const X=d=>x0+dir*(d<200?d:d+gap),id=q=>q+k;       // gap: room between the transformer and the grid side (4.19: the instruments)
    if(grid)comps.push(C(id('NET'),'GRID3',X(0),300,{Un:400e3,f,Sk:grid,XR:10,cf:1,emf:'un',conn:'bus'},{label:'δίκτυο '+k,flip:dir<0}),C(id('CB'),'CB3',X(120),300,{ctl:'sig',model:'ideal',conn:'bus'},{label:'διακόπτης AC '+k,flip:dir<0}));
    else comps.push(C(id('JL'),'JUNC',X(120),300));
    comps.push(C(id('TR'),'XF3',X(240),300,{grp:'YNd1',Sn:S,U1:400e3,U2:333e3,f,uk:18,i0:0,conn:'bus'},{label:'400/333 kV',flip:dir<0}),
     C(id('J'),'JUNC',X(340),300),C(id('SR'),'LOAD3',X(340),420,{cn:'yn',Un:333e3,f,P:5e4,Q:3e6,conn:'bus'},{label:'αντιδραστήρας αστέρα'}),
     C(id('MMC'),'MMC',X(480),320,mmc,{label:'MMC '+k,flip:dir<0}),C(id('CT'),'MMCC',X(480),600,{...ctl,...ctlp},{label:'έλεγχος '+k,flip:dir<0}));
    // 4.19 (decision 220): at station 2 an ammeter in phase a and a voltage probe on the 400 kV side (positive to the AC network)
    let gs=grid?id('CB')+':abc2':id('JL')+':j';
    if(gap){const [mL,mR]=busMeter(comps,wires,'M'+k,X(240)+80,300,{i:'i_a προς το AC',v:'v_a 400 kV'});wires.push([gs,mR]);gs=mL;}
    if(grid)wires.push([id('NET')+':abc',id('CB')+':abc1'],[gs,id('TR')+':abc1'],[id('CT')+':brk',id('CB')+':cmd']);else wires.push([gs,id('TR')+':abc1']);
    wires.push([id('TR')+':abc2',id('J')+':j'],[id('J')+':j',id('SR')+':abc'],[id('J')+':j',id('MMC')+':abc']);
    for(const q of ['va','vb','vc','ia','ib','ic','vdc','idc','vs'])wires.push([id('MMC')+':'+q,id('CT')+':'+q]);
    for(const q of ['ma','mb','mc','blk'])wires.push([id('CT')+':'+q,id('MMC')+':'+q]);};
   station(1,60,1,{mode:'vdc',Vdcref:'1',Tvdc:0.05,H:0.03,qmode:'q',Qref:'0',Tq:0.1},10e9);
   // station 2: P_ref into the converter (−: to the AC side); in the island its share comes from the droop
   const e0=law==='dvoc'&&o.e0==='small'?'small':'vs',rv=law==='dvoc'&&o.rv!=='0'?'0.05':'0';
   const g2={mode:'gfm',law,Pref:ac==='weak'?`0:-0.5, ${te}:-0.9`:'-0.55',Qref:'0',Vref:'1',mp:2,nq:5,fp:5,Hv:2,tv:0.02,kp:50,avc:'vac',Vacref:'1',KE:5,TE:0.05,kv:law==='psc'?0.3:0,av:40,Xv:0,Ilim:1.1,Idlim:1.1,vmax:1.3,bw:20,tsoft:0.05,ac:600,Ufd:0.6,...(e0==='small'?{E0:'0.01'}:{}),...(rv!=='0'?{Rv:rv}:{})};
   station(2,1940,-1,g2,ac==='weak'?r(1.5*S):0,200);
   const Pp=root.Parts,d=JSON.parse(JSON.stringify(Pp.TLM_TYPICAL['320kV-dc']));
   const pc={...Pp.defaults('TLM'),model:'wb',len:70,fmin:1e-3,dec:10,wdc:'1',wpas:'enforce',vtrap:'320e3, -320e3',data:JSON.stringify(d)};
   const m=LM()?.['320kV-dc|70|wb'];pc.mdl=m?JSON.stringify({...m,src:Pp.tlmKey(pc)}):'';
   comps.push(C('CAB','TLM',900,300,pc,{label:'καλώδια ±320 kV · 70 km (WB)'}));
   // 4.19 (decision 220): the current of the positive pole and the voltage between the poles at station 1
   comps.push(C('ADC','AM',720,260,{},{label:'I_dc'}),C('VDC','VM',800,200,{},{label:'V_dc',rot:2}));
   wires.push(['MMC1:p','ADC:a'],['ADC:b','CAB:a1'],['VDC:p','ADC:b'],['VDC:n','CAB:b1'],['MMC1:n','CAB:b1'],['CAB:a2','MMC2:p'],['CAB:b2','MMC2:n']);
   if(isl){comps.push(C('LD2','LOAD3',1820,440,{cn:'yn',Un:400e3,f,P:600e6,Q:100e6,model:'z',conn:'bus'},{label:'φορτίο 600 MW',lbl:'below'}),C('CBL','CB3',1940,300,{cmd:`0:0, ${te}:1`,model:'ideal',conn:'bus'},{label:`κλείνει στα ${te} s`}),
     C('LS2','LOAD3',2060,440,{cn:'yn',Un:400e3,f,P:300e6,Q:0,model:'z',conn:'bus'},{label:'+300 MW',lbl:'below'}));wires.push(['JL2:j','LD2:abc'],['JL2:j','CBL:abc1'],['CBL:abc2','LS2:abc']);}
   if(ac==='par'){const SB=500e6,Zb=400e3*400e3/SB,w0=2*Math.PI*f;
    comps.push(C('VSB','VSC2',2020,80,{dc:'ideal',Vdc:r(2*400e3*Math.SQRT2/Math.sqrt(3)*1.3),mmax:1.155,filt:'l',Lf:r(0.15*Zb/w0),Rf:r(0.003*Zb),conn:'bus'},{label:'μονάδα B 500 MVA',flip:true}),
     C('CTB','GFMC',2200,-20,{law:'droop',inner:'direct',S:SB,Vac:400e3,Vdc:r(2*400e3*Math.SQRT2/Math.sqrt(3)*1.3),f0:f,Pref:'0.55',Qref:'0',Vref:'1',mp:2,nq:5,fp:5,Xc:0.15,Imax:1.2,tsoft:0.05,conn:'bus'},{label:'grid-forming B'}),
     C('ZB','ZSER3',1880,60,{Rs:r(0.01*Zb),Ls:r(0.1*Zb/w0),Rp1:0,Lp:0,Rp2:0,conn:'bus'},{label:'γραμμή B'}));
    wires.push(['VSB:abc','ZB:abc2'],['ZB:abc1','JL2:j'],...gfmWire('CTB','VSB',2020,80,2200,-20,-100));}
   const pB=ac==='par'?[['Y:CTB/PP','P μονάδας B (pu των 500 MVA)']]:[],wB=ac==='par'?[['Y:CTB/WW','f B (pu)']]:[];
   // 4.20.2: the arms of station 2 in the detailed models (with Model 4 the scope of before)
   const arm=model==='m4'?[]:[model==='m1'?[['Y:MMC2/UaN:vav','μέση V_C άνω a 2'],['Y:MMC2/LaN:vav','μέση V_C κάτω a 2']]:[['Y:MMC2/AUa','Σv_C άνω a 2'],['Y:MMC2/ALa','Σv_C κάτω a 2']]];
   return project(comps,wires,{version:4,solve:{tbase:0.02},sim:{hDiv:1000,method:'TR',speed:0.02,stopT:1.2},
    scope:{panes:[[['Y:CT2/G/PP','P σταθμού 2 προς το AC (pu)'],...pB],[['Y:CT2/G/WW','f σταθμού 2 (pu)'],...wB],[['Y:CT2/G/VG','|v| σταθμού 2 (pu)'],['Y:CT2/G/IG','|i| (pu)'],['Y:CT2/G/LR','όριο ρεύματος']],[['Y:CT1/Fvdc','V_dc 1 (pu)'],['Y:CT2/Fvdc','V_dc 2 (pu)']],
     [['Y:ADC','I_dc του θετικού πόλου (αμπερόμετρο, A)']],[['Y:VDC','V_dc ανάμεσα στους πόλους (βολτόμετρο, V)']],[['Y:M2A','i_a του σταθμού 2 προς το AC (αμπερόμετρο, A)']],[['Y:M2V','v_a στα 400 kV του σταθμού 2 (probe, V)']],...arm],window:{unit:'s',n:1.2}},
    meta:{hvdcgfm:{ac,law,model,N,te,S,SB:500e6,mp:0.02,Pload:600e6,dP:300e6,Pr2:0.55,PrB:0.55,scr:1.5,e0,rv}}});}});
 // ------------------------------------------------------------------ 4.16 (§42): the first CIGRE HVDC benchmark (LCC)
 // The network of the benchmark at 50 Hz (Faruque et al. 2006 Fig. 1 and Table V, Watson & Arrillaga App. D), the transformers
 // and the controls of the example of the benchmark in PSCAD; the events of Faruque et al. (at 1,0 s for 0,15 s, 0,1 Ω)
 const LCC_EV={ss:'Μόνιμη κατάσταση',step:'Βήμα της εντολής ρεύματος 1 → 0,9 pu στο 1,0 s',dcf:'Σφάλμα DC στο μέσο της γραμμής (1,0–1,15 s)',ac1:'Σφάλμα φάσης a–γη στον ζυγό του αντιστροφέα (1,0–1,15 s)',ac3:'Τριφασικό σφάλμα στον ζυγό του αντιστροφέα (1,0–1,15 s)'};
 T.push({id:'hvdc_lcc',group:'HVDC: LCC (4.16)',title:'Το πρώτο benchmark HVDC της CIGRE (LCC 12 παλμών, 500 kV, 1000 MW)',theory:'formula',topology:'hvdc_lcc',
  options:[{k:'model',label:'Μοντέλο σταθμών',options:[['fast','Λεπτομερές (γρήγορη υλοποίηση των γεφυρών)'],['blocks','Λεπτομερές (αναλυτική: θυρίστορ, PLL, συγκριτές)'],['avg','Μέσο μοντέλο (χωρίς μεταγωγές)']],def:'fast'},
   {k:'ev',label:'Γεγονός',options:Object.entries(LCC_EV),def:'ss'},
   {k:'gref',label:'γ_ref του αντιστροφέα',options:[['15','15° (benchmark)'],['18','18°']],def:'15'},
   {k:'fr',label:'Εξαναγκασμένη καθυστέρηση στον ανορθωτή',options:[['off','Όχι (benchmark)'],['on','Ναι (α = 140° για 0,1 s)']],def:'off'}],
  desc:'Μονοπολική ζεύξη 500 kV, 2 kA με μετατροπείς 12 παλμών, όπως το πρώτο benchmark HVDC της CIGRE: ασθενή δίκτυα AC (SCR 2,5) 345 kV (ανορθωτής, 1,088 pu ∠22,18°) και 230 kV (αντιστροφέας, 0,935 pu ∠−23,14°) με εμπεδήσεις που αποσβένουν στη 2η αρμονική, πυκνωτές και φίλτρα (11η/13η και υψιπερατό), μετασχηματιστές YNy0 και YNd1 με u_k 18 %, αντιδραστήρες εξομάλυνσης 0,5968 H και γραμμή DC ως ισοδύναμο T (2 × 2,5 Ω, 26 μF). Ο ανορθωτής ρυθμίζει το ρεύμα· ο αντιστροφέας το γ (15°), με έλεγχο ρεύματος με περιθώριο 0,1 pu και VDCOL που δίνει και την εντολή του ανορθωτή. Τα δίκτυα AC ξεκινούν από τη μόνιμη κατάσταση με τις γέφυρες μπλοκαρισμένες ως τα 40 ms.',
  tasks:['Μόνιμη κατάσταση: σύγκρινε V_d, α του ανορθωτή, α και γ του αντιστροφέα με την κάρτα (τύποι του Kundur) και με τα αποτελέσματα του benchmark (Faruque 2006: α_r ≈ 16,9°, α_i ≈ 141,9°, γ ≈ 15,1°).','Βήμα ρεύματος: ποιος σταθμός ρυθμίζει το ρεύμα και ποιος την τάση; Πόσο αλλάζει το α του ανορθωτή;','Σφάλμα DC: τι κάνει ο VDCOL στην εντολή, και σε πόσο χρόνο ξαναβρίσκει η ζεύξη τα 1000 MW μετά την εκκαθάριση;','Σφάλματα AC στον αντιστροφέα: πότε έχουμε αποτυχία μετάβασης; Δες τη σημαία cf και το γ. Πόσο φτάνει το ρεύμα DC;','Μέσο μοντέλο: ποια μεγέθη δίνει σωστά (V_d, I_d, P, Q, α) και τι δεν δείχνει (αρμονικές, αποτυχία μετάβασης);','Κάρτα «Δυναμική RMS» (5.1.7): το ίδιο σχέδιο σε φασιθέτες, με τη ζεύξη ως στοιχείο του σχεδίου και τα ίδια συμβάντα (βήμα 1 ms). Σύγκρινε I_d, V_d και γ με το EMT: πού συμφωνούν, και πού διαφέρουν στο τριφασικό σφάλμα;'],
  build(o){const model=['fast','blocks','avg'].includes(o.model)?o.model:'fast',ev=LCC_EV[o.ev]?o.ev:'ss',f=50,gref=o.gref==='18'?18:15;
   const st={model:model==='avg'?'avg':'det',impl:model==='blocks'?'blocks':'fast',uk:18,f,conn:'bus'};
   const comps=[],wires=[];const vpk=(u,pu)=>+(pu*u*Math.SQRT2/Math.sqrt(3)).toPrecision(8);
   // rectifier side
   comps.push(C('SR','VAC3',40,300,{Vpk:vpk(345e3,1.088),f,phase:22.18,seq:'abc',Rs:0,Ls:0,conn:'bus'},{label:'345 kV · 1,088 pu ∠22,18°'}),C('GR','GND',40,380,{},{label:'0 V'}),
    C('ZR','ZSER3',160,300,{Rs:3.737,Ls:0,Rp1:0,Lp:0.151,Rp2:2160.633,conn:'bus'},{label:'Z δικτύου'}),J('JR',280,300),
    C('FR1','FILT3',280,440,{kind:'c',C1:3.342e-6,conn:'bus'},{label:'C 3,342 μF'}),C('FR2','FILT3',380,440,{kind:'cig',C1:6.685e-6,L:0.1364,R:29.76,C2:74.28e-6,Rp:261.87,conn:'bus'},{label:'φίλτρο 11/13'}),
    C('FR3','FILT3',480,440,{kind:'hp',C1:6.685e-6,L:0.0136,R:83.32,conn:'bus'},{label:'υψιπερατό'}),
    C('STR','LCCS',600,300,{...st,Sn:603.73e6,U1:345e3,U2:213.4557e3},{label:'ανορθωτής'}),C('GS1','GND',680,400,{},{label:'0 V'}),
    C('CR','LCCC',600,560,{mode:'rect',iext:'sig',fr:o.fr==='on'?'on':'off',afr:140,tfr:0.1,Vfr:0.3,tdet:0.005,tprot:0.3},{label:'έλεγχος ανορθωτή'}));
   wires.push(['SR:abc','ZR:abc1'],['SR:n','GR:g'],['ZR:abc2','JR:j'],['JR:j','FR1:abc'],['JR:j','FR2:abc'],['JR:j','FR3:abc'],['JR:j','STR:abc'],['STR:n','GS1:g']);
   // DC: smoothing reactors and the T line
   comps.push(C('LR','L',780,260,{L:0.5968},{label:'0,5968 H'}),C('R1','R',880,260,{R:2.5},{label:'2,5 Ω'}),J('JM',960,260),C('CM','C',960,360,{C:26e-6},{rot:1,label:'26 μF'}),C('GM','GND',960,420,{},{label:'0 V'}),
    C('R2','R',1040,260,{R:2.5},{label:'2,5 Ω'}),C('LI','L',1140,260,{L:0.5968},{label:'0,5968 H'}));
   wires.push(['STR:p','LR:a'],['LR:b','R1:a'],['R1:b','JM:j'],['JM:j','CM:p'],['CM:n','GM:g'],['JM:j','R2:a'],['R2:b','LI:a']);
   // inverter side (the station flipped: its n on the line, its p grounded)
   comps.push(C('STI','LCCS',1320,300,{...st,Sn:591.79e6,U1:230e3,U2:209.2288e3},{label:'αντιστροφέας',flip:true}),C('GS2','GND',1240,400,{},{label:'0 V'}),
    C('CI','LCCC',1320,560,{mode:'inv',gref,Iord:ev==='step'?'0:1, 1:0.9':'1'},{label:'έλεγχος αντιστροφέα',flip:true}),
    J('JI',1640,300),C('FI1','FILT3',1640,440,{kind:'c',C1:7.522e-6,conn:'bus'},{label:'C 7,522 μF'}),C('FI2','FILT3',1540,440,{kind:'cig',C1:15.04e-6,L:0.0606,R:13.23,C2:167.2e-6,Rp:116.38,conn:'bus'},{label:'φίλτρο 11/13'}),
    C('FI3','FILT3',1440,440,{kind:'hp',C1:15.04e-6,L:0.0061,R:37.03,conn:'bus'},{label:'υψιπερατό'}),
    C('ZI','ZSER3',1760,300,{Rs:0.7406,Ls:0.0365,Rp1:0.7406,Lp:0.0365,Rp2:24.81,conn:'bus'},{label:'Z δικτύου',flip:true}),
    C('SI','VAC3',1880,300,{Vpk:vpk(230e3,0.935),f,phase:-23.14,seq:'abc',Rs:0,Ls:0,conn:'bus'},{label:'230 kV · 0,935 pu ∠−23,14°',flip:true}),C('GI','GND',1880,380,{},{label:'0 V'}));
   wires.push(['LI:b','STI:n'],['STI:p','GS2:g'],['STI:abc','JI:j'],['JI:j','FI1:abc'],['JI:j','FI2:abc'],['JI:j','FI3:abc'],['JI:j','ZI:abc1'],['ZI:abc2','SI:abc'],['SI:n','GI:g']);
   // controls: the measured current and voltage of each station, the γ of the inverter, the order of the rectifier from the inverter (VDCOL)
   wires.push(['STR:id','CR:id'],['STR:vd','CR:vd'],['CR:ao','STR:ao'],['CR:blk','STR:blk'],['CI:iord','CR:iref'],
    ['STI:id','CI:id'],['STI:vd','CI:vd'],['STI:gm','CI:gm'],['CI:ao','STI:ao'],['CI:blk','STI:blk']);
   if(ev==='dcf'){comps.push(C('FDC','SW',1020,360,{gate:'sig',model:'mos',Ron:0.1,Roff:1e9,body:false},{rot:1,label:'σφάλμα DC'}),C('KDC','CONST',1100,440,{v:'0:0, 1:1, 1.15:0'}),C('GF','GND',1020,440,{},{label:'0 V'}));
    wires.push(['JM:j','FDC:d'],['FDC:s','GF:g'],['KDC:y','FDC:g']);}
   if(ev==='ac1'||ev==='ac3'){comps.push(C('FAC','FLT3',1640,180,{kind:ev==='ac1'?'ag':'abcg',Rf:0.1,Rg:0,ton:1,toff:1.15,clr:'inst',conn:'bus'},{label:'σφάλμα AC'}));wires.push(['JI:j','FAC:abc']);}
   return project(comps,wires,{version:4,solve:{tbase:0.02,init:'ac'},sim:{hDiv:400,method:'TR',speed:0.05,stopT:ev==='ss'?1.5:2},
    scope:{panes:[[['Y:CR/KV','V_d ανορθωτή (pu)'],['Y:CI/KV','V_d αντιστροφέα (pu)']],[['Y:CR/FI','I_d ανορθωτή (pu)'],['Y:CI/FI','I_d αντιστροφέα (pu)'],['Y:CI/ORD','εντολή (VDCOL)']],
     [['Y:CR/AO','α ανορθωτή (°)'],['Y:CI/AO','α αντιστροφέα (°)'],['Y:STI/GM','γ αντιστροφέα (°)']],[['Y:STI/CF','αποτυχία μετάβασης'],['Y:CI/CC','αντιστροφέας σε έλεγχο ρεύματος']]],window:{unit:'s',n:0.4}},
    meta:{lcc:{model,ev,gref,Idn:2000,Vdn:500e3,r:{U1:345e3,U2:213.4557e3,Sn:603.73e6,uk:18},i:{U1:230e3,U2:209.2288e3,Sn:591.79e6,uk:18}}}});}});
 // ------------------------------------------------------------------ 4.18 (§58): grid-forming converters (THEORY §8Ε)
 // The two-level VSC as an average model with its filter (VSC2) and the grid-forming control (GFMC); the measurements of the
 // converter go to the control and its modulation back. Per unit on each converter's ratings
 // the buses meas and m (conn = 'bus' on both); meas around under the two blocks: VSC2 at (xv, yv), GFMC at (xc, yc), yb below both
 const gfmWire=(ct,vs,xv,yv,xc,yc,yb)=>[[vs+':meas',ct+':meas',[[xv+70,yv+60],[xv+70,yb],[xc-70,yb],[xc-70,yc]]],[ct+':m',vs+':m']];
 // 4.19 (decision 220): instruments at a few points of a drawing, next to the signals of the scope. On a three-phase bus: two
 // conductor buses with an ammeter in phase a between them and a voltage probe (to ground) after it. The bus pins are at
 // (x − 20, y) and (x + 160, y), phase a runs at y − 20; the current is positive from the left pin to the right one
 const busMeter=(comps,wires,id,x,y,o={})=>{const E=(q,ex,fl)=>C(id+q,'EBUS',ex,y,{n:3},{flip:fl,lbl:'none'});
  const rv=!!o.rev,pa=rv?'b':'a',pb=rv?'a':'b';                     // rev: positive from the right pin to the left one (the ammeter mirrored)
  comps.push(E('L',x,true),C(id+'A','AM',x+70,y-20,{},{label:o.i||'i_a',flip:rv}),E('R',x+140,false));
  wires.push([id+'L:a',id+'A:'+pa],[id+'A:'+pb,id+'R:a'],[id+'L:b',id+'R:b'],[id+'L:c',id+'R:c']);
  if(o.v!==false){comps.push(C(id+'V','VP',x+100,y-60,{},{label:o.v||'v_a'}));wires.push([id+'V:p',id+'A:'+pb]);}
  return [id+'L:bus',id+'R:bus'];};
 T.push({id:'gfm_island',group:'Grid-forming (4.18)',title:'Νησίδα με δύο μετατροπείς grid-forming: μοιρασιά του φορτίου με τη στατικότητα',theory:'formula',topology:'gfm_island',
  options:[{k:'law',label:'Νόμος',options:[['droop','Στατικότητα P–f, Q–V (φίλτρο 5 Hz)'],['vsm','Εικονική σύγχρονη μηχανή (H = 1 s)'],['dvoc','Ταλαντωτής dVOC (η, α για 2 % και 5 %, R_v 0,1 pu, 4.20.2)']],def:'droop'},
   {k:'inner',label:'Εσωτερικός έλεγχος',options:[['cascade','Καταρράκτης: βρόχος τάσης πυκνωτή και ρεύματος'],['direct','Άμεσα η τάση (με υψιπερατή ανάδραση ρεύματος)']],def:'cascade'},
   {k:'size',label:'Ονομαστικές ισχείς',options:[['eq','10 kVA και 10 kVA'],['21','10 kVA και 5 kVA']],def:'eq'},
   {k:'xv',label:'Εικονική αντίδραση X_v',options:[['0.1','0,1 pu'],['0','Χωρίς']],def:'0.1'},
   {k:'dvs',label:'dVOC: μορφή και εκκίνηση (4.20.3)',options:[['polar','κ = 90°, από V* (4.20.2)'],['kappa','κ από τη σύζευξη κάθε μονάδας'],['black','κ = 90°, από E₀ = 0,01 pu (εκκίνηση χωρίς τάση)']],def:'polar'}],
  desc:'Δύο μετατροπείς 400 V (μέσο μοντέλο, φίλτρο LC) τροφοδοτούν ένα κοινό φορτίο μέσα από γραμμές με διαφορετική εμπέδηση, χωρίς δίκτυο και χωρίς επικοινωνία. Καθένας σχηματίζει την τάση του (grid-forming): η συχνότητα πέφτει με την ενεργό ισχύ του και το πλάτος με την άεργο (στατικότητα 2 % και 5 % στη δική του βάση). Στα 0,5 s κλείνει ένα δεύτερο φορτίο· στα 1,0 s η μονάδα 1 παίρνει εντολή P_ref = 0,2 pu (δευτερεύουσα ρύθμιση).',
  tasks:['Σύγκρινε στην κάρτα τη συχνότητα της μόνιμης κατάστασης με τον τύπο ω = 1 − m_p·(P_φορτίου − S₁·P_ref,1)/(S₁ + S₂): δεν εξαρτάται από τις γραμμές.','Με 10 και 5 kVA: η ενεργός ισχύς μοιράζεται 2:1 (ίδιο pu σε κάθε μονάδα). Η άεργος όχι: εξαρτάται από τις πτώσεις τάσης στις γραμμές. Βάλε X_v = 0,1 pu και δες τη διαφορά των Q να μικραίνει.','Η VSM δίνει την ίδια μόνιμη κατάσταση με τη στατικότητα (D_p = 1/m_p) αλλά άλλη μεταβατική: σύγκρινε την πτώση της συχνότητας στα 0,5 s.','Με dVOC η συχνότητα αλλάζει χωρίς φίλτρο: 1 − ω = η·(P/E² − P_ref/V*²) σε κάθε μονάδα (κάρτα), δηλαδή σχεδόν η στατικότητα των 2 % όταν E ≈ V*. Χωρίς την εικονική αντίσταση R_v οι δύο ταλαντωτές δεν ησυχάζουν πάνω στις γραμμές.'],
  build(o){const law=['vsm','dvoc'].includes(o.law)?o.law:'droop',cas=o.inner!=='direct',rv=law==='dvoc'?0.1:0,S1=10e3,S2=o.size==='21'?5e3:10e3,St=S1+S2,xv=o.xv==null?0.1:+o.xv||0,Vll=400,f=50,w0=2*Math.PI*f,r=x=>+x.toPrecision(6);
   // 4.20.3: dVOC with the angle κ of each unit's coupling (the virtual impedance and its line, κ = atan(X/R)), or started
   // from an oscillator amplitude of 0,01 pu without the soft start (a start without voltage: E = 0 is a rest point)
   const dvs=law==='dvoc'&&['kappa','black'].includes(o.dvs)?o.dvs:'polar',kap={};
   const comps=[],wires=[];
   const unit=(k,y0,S,Rl,Ll)=>{const Zb=Vll*Vll/S,Lf=r(0.06*Zb/w0),Cf=r(0.1/(w0*Zb)),id=q=>q+k;kap[k]=r(Math.atan2(xv+w0*Ll/Zb,rv+Rl/Zb)*180/Math.PI);
    comps.push(C(id('CT'),'GFMC',60,y0+60,{law,inner:cas?'cascade':'direct',S,Vac:Vll,Vdc:800,f0:f,Pref:k===1?'0:0, 1:0.2':'0',Qref:'0',Vref:'1',mp:2,nq:5,fp:5,H:1,tv:0.01,
      kv:0,Rv:rv,Xv:xv,Xc:0.06,Bf:0.1,Tvl:0.003,Til:0.0005,kff:0.8,Imax:1.2,...(dvs==='kappa'?{kap:kap[k]}:dvs==='black'?{E0:'0.01',tsoft:0}:{}),conn:'bus'},{label:'έλεγχος '+k}),
     C(id('VS'),'VSC2',260,y0,{dc:'ideal',Vdc:800,mmax:1,filt:'lc',Lf,Rf:r(0.005*Zb),Cf,conn:'bus'},{label:`μετατροπέας ${k} (${S/1e3} kVA)`}),
     C(id('Z'),'ZSER3',680,y0-20,{Rs:Rl,Ls:Ll,Rp1:0,Lp:0,Rp2:0,conn:'bus'},{label:'γραμμή '+k}));
    const [mL,mR]=busMeter(comps,wires,'M'+k,380,y0-20,{i:'i_a'+k,v:'v_a'+k});
    wires.push([id('VS')+':abc',mL],[mR,id('Z')+':abc1'],[id('Z')+':abc2','JB:j'],...gfmWire(id('CT'),id('VS'),260,y0,60,y0+60,y0+200));};
   unit(1,160,S1,0.1,1.5e-3);unit(2,520,S2,0.2,3e-3);
   comps.push(C('JB','JUNC',860,320),C('LD','LOAD3',860,460,{cn:'yn',Un:Vll,f,P:r(0.4*St),Q:r(0.1*St),conn:'bus'},{label:'φορτίο'}),
    C('CB','CB3',1000,320,{cmd:'0:0, 0.5:1',model:'ideal',conn:'bus'},{label:'κλείνει στα 0,5 s'}),C('LS','LOAD3',1140,460,{cn:'yn',Un:Vll,f,P:r(0.4*St),Q:0,conn:'bus'},{label:'δεύτερο φορτίο'}));
   wires.push(['JB:j','LD:abc'],['JB:j','CB:abc1'],['CB:abc2','LS:abc']);
   return project(comps,wires,{version:4,solve:{tbase:0.02},sim:{hDiv:400,method:'TR',speed:0.2,stopT:1.5},
    scope:{panes:[[['Y:CT1/PP','P₁ (pu της μονάδας 1)'],['Y:CT2/PP','P₂ (pu της μονάδας 2)']],[['Y:CT1/WW','f₁ (pu)'],['Y:CT2/WW','f₂ (pu)']],[['Y:CT1/QQ','Q₁ (pu)'],['Y:CT2/QQ','Q₂ (pu)']],[['Y:CT1/VG','|v₁| (pu)'],['Y:CT2/VG','|v₂| (pu)']],
     [['Y:M1A','i_a της μονάδας 1 (αμπερόμετρο, A)'],['Y:M2A','i_a της μονάδας 2 (A)']],[['Y:M1V','v_a της μονάδας 1 (probe, V)'],['Y:M2V','v_a της μονάδας 2 (V)']]],window:{unit:'s',n:1.5}},
    meta:{gfm:{kind:'island',law,inner:cas?'cascade':'direct',S1,S2,mp:0.02,nq:0.05,xv,rv,tstep:0.5,tpref:1,pref1:0.2,Vll,f,dvs,kap}}});}});
 // The synchronverter of Zhong & Weiss (2011): the inverter of their Table I (100 W, 20,78 V, L_s = L_g = 0,45 mH, C = 22 μF,
 // R ∥ C 1 kΩ), D_p for 100 % P at −0,5 % frequency, D_q for 100 % Q at −5 % voltage, τ_f = τ_v = 2 ms; the sequence of their
 // Fig. 5 every 0,3 s (breaker, P_set, Q_set, droops, grid −5 %), with the grid at 50 or 49,95 Hz
 T.push({id:'gfm_sync',group:'Grid-forming (4.18)',title:'Synchronverter: αντιστροφέας που μιμείται σύγχρονη γεννήτρια (Zhong & Weiss 2011)',theory:'formula',topology:'gfm_sync',
  options:[{k:'fg',label:'Συχνότητα του δικτύου',options:[['50','50 Hz (ονομαστική)'],['49.95','49,95 Hz (−0,1 %)']],def:'49.95'},
   {k:'H',label:'Αδράνεια',options:[['0.2','H = 0,2 s (τ_f = 2 ms, όπως το paper)'],['2','H = 2 s (τ_f = 20 ms)']],def:'0.2'}],
  desc:'Ο αντιστροφέας του Πίν. I των Zhong & Weiss (100 W, 20,78 V πολική, φίλτρο LC, μέσο μοντέλο) ελέγχεται σαν σύγχρονη γεννήτρια: εικονικός δρομέας με αδράνεια J = D_p·τ_f και ροπή T_e = P/θ̇, ροή διέγερσης M_f·i_f από έναν ολοκληρωτή της άεργου, E = θ̇·M_f·i_f (εξ. (6)–(9)). Τα γεγονότα του Σχ. 5, ανά 0,3 s: 0,1 s κλείνει ο διακόπτης (ως τότε συγχρονισμός με PLL στην τάση του δικτύου), 0,3 s P_set = 80 W, 0,6 s Q_set = 60 var, 0,9 s ενεργές οι στατικότητες, 1,2 s η τάση του δικτύου πέφτει 5 %.',
  tasks:['Ως τα 0,9 s τα P και Q ακολουθούν τις αναφορές χωρίς σφάλμα σε περίπου δέκα περιόδους (ο αργός πόλος του δρομέα, κάρτα).','Με το δίκτυο στα 49,95 Hz: μόλις μπουν οι στατικότητες το P ανεβαίνει κατά 0,1 %/0,5 % × 100 W = 20 W (κάρτα).','Στα 0,9 s το Q πέφτει, γιατί η τάση στους πυκνωτές είναι πάνω από την ονομαστική: ΔQ = D_q·(V_r − V_m). Στα 1,2 s, με το δίκτυο 5 % κάτω, ανεβαίνει ξανά.'],
  build(o){const S=100,Vll=20.78,f=50,fg=o.fg==null?49.95:+o.fg||50,H=o.H==null?0.2:+o.H||0.2,Ls=0.45e-3,Rs=0.135,Cf=22e-6,Zb=Vll*Vll/S,w0=2*Math.PI*f,Vg=Vll*Math.SQRT2/Math.sqrt(3),r=x=>+x.toPrecision(6);
   const comps=[C('CT','GFMC',-140,360,{law:'vsm',inner:'direct',S,Vac:Vll,Vdc:42,f0:f,Pref:'0:0, 0.3:0.8',Qref:'0:0, 0.6:0.6',Vref:'1',mp:0.5,nq:5,H,tv:0.002,tdr:0.9,kv:0,Rv:0,Xv:0,
     Xc:r(w0*Ls/Zb),Imax:2,sync:'g',bw:20,tsync:0.1,tsoft:0.05,conn:'bus'},{label:'synchronverter'}),
    C('VS','VSC2',60,300,{dc:'ideal',Vdc:42,mmax:1,filt:'lc',Lf:Ls,Rf:Rs,Cf,conn:'bus'},{label:'αντιστροφέας 100 W'}),
    C('JT','JUNC',420,280),C('RP','LOAD3',420,420,{cn:'yn',Un:Vll,f,P:r(Vll*Vll/1000),Q:0,conn:'bus'},{label:'R ∥ C = 1 kΩ'}),
    C('CB','CB3',540,280,{cmd:'0:0, 0.1:1',model:'ideal',conn:'bus'},{label:'κλείνει στα 0,1 s'}),
    C('ZG','ZSER3',680,280,{Rs:Rs,Ls:Ls,Rp1:0,Lp:0,Rp2:0,conn:'bus'},{label:'L_g, R_g'}),C('BG','EBUS',800,280,{n:3},{flip:true})];
   const wires=[['JT:j','RP:abc'],['JT:j','CB:abc1'],['CB:abc2','ZG:abc1'],['ZG:abc2','BG:bus'],...gfmWire('CT','VS',60,300,-140,360,500)];
   {const [mL,mR]=busMeter(comps,wires,'M',180,280,{i:'i_a',v:'v_a'});wires.push(['VS:abc',mL],[mR,'JT:j']);}
   ['a','b','c'].forEach((x,k)=>{const y=200+80*k,X=x.toUpperCase();
    comps.push(C('G'+X,'VDC',900,y,{ctl:'sig',V:0},{rot:1,label:'v_g'+x}),C('E'+X,'EXPR',1100,y,{expr:`v*(1 - 0.05*(t >= 1.2))*cos(2*pi*fg*t - ${r(2*Math.PI*k/3)})`,ins:'',pars:`v = ${r(Vg)}, fg = ${fg}`},{label:'δίκτυο '+x}),
     C('P'+X,'VP',860,y-30,{},{label:'g'+x}),C('TO'+X,'TAGO',940,y-40,{name:'v_g'+x},{label:'v_g'+x}),C('TI'+X,'TAGI',-230,400+20*k,{name:'v_g'+x},{label:'v_g'+x}));
    wires.push(['BG:'+x,'G'+X+':n'],['E'+X+':y','G'+X+':u'],['G'+X+':n','P'+X+':p'],['P'+X+':y','TO'+X+':u'],['TI'+X+':y','CT:g'+x]);});
   comps.push(C('G1','GND',1000,460,{},{label:'0 V'}));['A','B','C'].forEach(X=>wires.push(['G'+X+':p','G1:g']));
   return project(comps,wires,{version:4,solve:{tbase:0.02},sim:{hDiv:1000,method:'TR',speed:0.2,stopT:1.5},
    scope:{panes:[[['Y:CT/PP','P (pu των 100 W)'],['Y:CT/QQ','Q (pu των 100 var)']],[['Y:CT/WW','θ̇/ω₀ (pu)']],[['Y:CT/VG','|v| στους πυκνωτές (pu)'],['Y:CT/EE','E = θ̇·M_f·i_f (pu)']],
     [['Y:MA','i_a του αντιστροφέα (αμπερόμετρο, A)']],[['Y:MV','v_a στους πυκνωτές (probe, V)'],['Y:PA','v_a του δικτύου (probe, V)']]],window:{unit:'s',n:1.5}},
    meta:{gfm:{kind:'sync',S,Vll,fg,f,mp:0.005,nq:0.05,H,tf:2*H*0.005,tv:0.002,Pset:0.8,Qset:0.6,tps:0.3,tqs:0.6,tdr:0.9,tdip:1.2}}});}});
 // Power-synchronization control in a weak grid (Zhang, Harnefors & Nee 2010): the VSC of their Table I (350 MVA, 195 kV,
 // phase reactor 0,15 pu, transformer 195/400 kV 12 %, ±150 kV, I_max 1,08 pu) against a 400 kV grid of SCR 1, 2 or 5; their
 // gains (k_p = 130 rad/s at SCR 1, scaled with the reactance; k_v = 0,477, α_v = 40 rad/s), or vector current control with a
 // PLL (the control of the MMC station, on the same average model)
 const GFM_W={step:'Βήμα P_ref +0,1 pu στο 1,2 s',fault:'Τριφασικό σφάλμα στο σημείο σύνδεσης (1,2–1,35 s, 10 Ω)'};
 T.push({id:'gfm_weak',group:'Grid-forming (4.18)',title:'Συγχρονισμός μέσω ισχύος (PSC) σε ασθενές δίκτυο, απέναντι στον έλεγχο ρεύματος με PLL',theory:'formula',topology:'gfm_weak',
  options:[{k:'ctl',label:'Έλεγχος',options:[['psc','Grid-forming: PSC με ρύθμιση της τάσης AC'],['gflw','Grid-following, στιβαρός έλεγχος ρεύματος για κάθε SCR (Harnefors κ.ά. 2021, 4.18.1)'],['gfl','Grid-following, ο έλεγχος ρεύματος του σταθμού MMC (PI 10 ms, όπως η 4.18)']],def:'psc'},
   {k:'scr',label:'Λόγος βραχυκύκλωσης SCR',options:[['1','1 (πολύ ασθενές, όπως το paper)'],['1.5','1,5'],['2','2'],['3','3'],['5','5']],def:'1'},
   {k:'pll',label:'Εύρος του PLL (grid-following)',options:[['5','5 Hz'],['2','2 Hz'],['20','20 Hz']],def:'5'},
   {k:'p0',label:'Ισχύς πριν από το γεγονός',options:[['0.8','0,8 pu'],['0.5','0,5 pu']],def:'0.8'},
   {k:'ev',label:'Γεγονός',options:Object.entries(GFM_W),def:'step'}],
  desc:'Ένας VSC 350 MVA (μέσο μοντέλο, πηνίο 0,15 pu, μετασχηματιστής 195/400 kV, 12 %) στέλνει ισχύ σε δίκτυο 400 kV με S″k = SCR·350 MVA. Με PSC ο μετατροπέας σχηματίζει την τάση του και συγχρονίζεται όπως μια σύγχρονη μηχανή, μέσω της ισχύος (dθ/dt = ω₀ + k_p·(P_ref − P)), με υψιπερατή ανάδραση ρεύματος για απόσβεση και όριο ρεύματος με εφεδρικό PLL. Με τον έλεγχο ρεύματος, το PLL στο ασθενές δίκτυο περιορίζει την ισχύ. Το P ανεβαίνει σε βήματα ως την ισχύ της επιλογής και στο 1,2 s γίνεται το γεγονός.',
  tasks:['SCR 1, 0,8 pu: με PSC η γωνία φορτίου είναι γύρω στις 65° (κάρτα) και το βήμα στα 0,9 pu περνά με μικρή μη ελάχιστη φάση.','Ο έλεγχος ρεύματος της 4.18 (PI 10 ms, PLL 20 Hz) ταλαντώνεται στο SCR 1 από την αρχή, χωρίς ισχύ (~400 Hz στο dq): ο βρόχος ρεύματος είναι πολύ αργός απέναντι στην καθυστέρηση της μέτρησης και στο PLL. Στο SCR 2 και 5 δουλεύει.','Ο στιβαρός έλεγχος ρεύματος (χωρίς ολοκληρωτή στον βρόχο ρεύματος, πρόσθια τροφοδότηση της τάσης με το εύρος του βρόχου, ρύθμιση της τάσης AC με αναλογικό μέρος στο d) με την ίδια ρύθμιση σε κάθε SCR: στο SCR 1 φτάνει τα 0,8 pu· τα 0,9 pu (κοντά στο στατικό όριο, κάρτα) μόνο με PLL 2 Hz.','Σφάλμα: με PSC το ρεύμα μένει στο I_max = 1,08 pu (μόνο μια αιχμή στην αρχή) και ο μετατροπέας περνά στο εφεδρικό PLL· μετά την εκκαθάριση γυρίζει στο PSC.'],
  build(o){const S=350e6,Vc=195e3,Vdc=300e3,f=50,w0=2*Math.PI*f,Zb=Vc*Vc/S,scr=o.scr==null?1:+o.scr||1,p0=o.p0==null?0.8:+o.p0||0.8,ev=GFM_W[o.ev]?o.ev:'step',psc=o.ctl!=='gfl'&&o.ctl!=='gflw',rob=o.ctl==='gflw',pll=o.pll==null?5:+o.pll||5,r=x=>+x.toPrecision(6);
   const Xt=0.15+0.11*350/380+1/scr,kp=r(130*Xt/(0.15+0.11*350/380+1));
   let ps='0:0';for(let k=1;k*0.1<=p0+1e-9;k++)ps+=`, ${r(0.1*k)}:${r(0.1*k)}`;if(ev==='step')ps+=`, 1.2:${r(p0+0.1)}`;
   const comps=[C('VS','VSC2',300,300,{dc:'ideal',Vdc,mmax:1.155,filt:'l',Lf:0.052,Rf:0.06,conn:'bus'},{label:'VSC 350 MVA'}),
    C('JP','JUNC',660,280),C('TR','XF3',800,280,{grp:'YNd1',Sn:380e6,U1:400e3,U2:Vc,f,uk:12,Pk:0,i0:0,conn:'bus'},{label:'400/195 kV',flip:true}),
    C('NET','GRID3',980,280,{Un:400e3,f,phase:0,cf:1,emf:'un',Sk:r(scr*S),XR:10,conn:'bus'},{label:`δίκτυο, SCR ${scr}`,flip:true})];
   const wires=[['JP:j','TR:abc2'],['TR:abc1','NET:abc']];
   {const [mL,mR]=busMeter(comps,wires,'M',400,280,{i:'i_a',v:'v_a (PCC)'});wires.push(['VS:abc',mL],[mR,'JP:j']);}
   if(ev==='fault'){comps.push(C('FL','FLT3',720,420,{kind:'abc',Rf:10,ton:1.2,toff:1.35,conn:'bus'},{label:'σφάλμα'}));wires.push(['JP:j','FL:abc']);}
   if(psc){comps.push(C('CT','GFMC',80,340,{law:'psc',inner:'direct',S,Vac:Vc,Vdc,f0:f,Pref:ps,Vref:'1',kp,avc:'vac',Uref:'1',KE:10,TE:0.05,kv:0.477,av:40,Rv:0,Xv:0,Xc:0.15,
     Imax:1.08,ac:600,vmax:1.3,bw:20,th0:-120,tsoft:0.05,conn:'bus'},{label:'PSC'}));wires.push(...gfmWire('CT','VS',300,300,80,340,480));}
   else{comps.push(C('CT','MMCC',80,340,{mode:'p',qmode:'vac',S,Vac:Vc,Vdc,f0:f,Pref:ps.replace(/:(\d[\d.]*)/g,(m,v)=>':'+(v==='0'?'0':'-'+v)),Tp:0.2,Vacref:'1',Tvac:0.1,Xpcc:r(0.11*350/380+1/scr),
      Ti:0.01,X:0.15,R:0.0055,prio:'p',Ilim:1.08,Idlim:1.08,vmax:1.3,bw:rob?pll:20,th0:-120,prot:'off',tdb:0,tbrk:0,...(rob?{cc:'robust',acc:4,Tii:0.05,R:0.00055}:{})},{label:rob?'στιβαρός έλεγχος ρεύματος':'έλεγχος ρεύματος'}));
    // the measurements of the bus meas, the currents into the converter (as the station control takes them), m back in a bus
    comps.push(C('SI','BSEL',440,420,{idx:'1, 2, 3'},{label:'i_abc'}),C('NI','GAIN',520,420,{K:-1},{label:'−1'}),C('DI','DEMUX',600,420,{n:3}),
     C('SV','BSEL',440,500,{idx:'4, 5, 6'},{label:'v_abc'}),C('DV','DEMUX',600,500,{n:3}),C('SD','BSEL',440,580,{idx:'10'},{label:'v_dc'}),C('MX','MUX',200,300,{n:3},{label:'m'}),C('K0','CONST',-40,560,{v:'0'},{label:'I_dc, v_s: όχι'}));
    wires.push(['VS:meas','SI:u'],['VS:meas','SV:u'],['VS:meas','SD:u'],['SI:y','NI:u'],['NI:y','DI:u'],['SV:y','DV:u'],['SD:y','CT:vdc'],['MX:y','VS:m'],['K0:y','CT:idc'],['K0:y','CT:vs']);
    ['a','b','c'].forEach((x,k)=>wires.push(['DI:y'+(k+1),'CT:i'+x],['DV:y'+(k+1),'CT:v'+x],['CT:m'+x,'MX:u'+(k+1)]));}
   const P=psc?'Y:CT/PP':'Y:CT/PP',sc=psc?[[['Y:CT/PP','P (pu)']],[['Y:CT/VG','|u_pcc| (pu)'],['Y:CT/EE','V₀ (pu)']],[['Y:CT/IG','|i| (pu)'],['Y:CT/LR','όριο ρεύματος']],[['Y:CT/WW','ω (pu)']]]
    :[[['Y:CT/PP','P προς τον μετατροπέα (pu)']],[['Y:CT/VG','|u_pcc| (pu)']],[['Y:CT/ID','i_d (pu)'],['Y:CT/IQ','i_q (pu)']]];
   sc.push([['Y:MA','i_a του μετατροπέα (αμπερόμετρο, A)']],[['Y:MV','v_a στο σημείο σύνδεσης (probe, V)']]);
   return project(comps,wires,{version:4,solve:{tbase:0.02},sim:{hDiv:400,method:'TR',speed:0.2,stopT:1.6},scope:{panes:sc,window:{unit:'s',n:1.6}},
    meta:{gfm:{kind:'weak',ctl:psc?'psc':rob?'gflw':'gfl',scr,p0,ev,S,Vc,Xc:0.15,Xtr:r(0.11*350/380),Xg:r(1/scr),kp,Imax:1.08,pll:rob?pll:20,acc:4}}});}});
 // 4.18.1 (§58): the IEEE 9 case (ieee9Build with AVR, PSS and governors) with the unit at bus 3 a converter of the rating
 // of G3 (128 MVA): grid-forming (droop of 5 % as its governor, or a VSM with its H) or grid-following (the robust current
 // control with or without a frequency response of 5 %), from the load flow (85 MW, −10,86 Mvar, 1,025∠4,665°); a load step
 // at bus 7. The frequency metrics as Tayyebi et al. (2020): the nadir and the RoCoF over 250 ms of the speed of G1
 const DVOC_RV=0.05;   // 4.20.2: the virtual resistance of dVOC in ieee9_gfm (THEORY §8Ψ.2: without it the oscillator with η for 5 % loses step with the lines)
 const IEEE9_GFM_U={sm:'Σύγχρονη γεννήτρια G3 (AVR, PSS, ρυθμιστής ατμού), όπως το δίκτυο',droop:'Grid-forming: στατικότητα P–f 5 % (όση ο ρυθμιστής της G3), φίλτρο 5 Hz',
  vsm:'Grid-forming: VSM με H = 3,01 s (όση η G3) και D_p για 5 %',gfl:'Grid-following: στιβαρός έλεγχος ρεύματος, απόκριση στη συχνότητα 5 % (PLL 5 Hz)',gfl0:'Grid-following χωρίς απόκριση στη συχνότητα (σταθερή P)',
  dvoc:'Grid-forming: dVOC με η και α για 5 % και 5 % (4.20.2)',match:'Grid-forming: matching control, ω από την τάση DC, k_dc για 5 % (4.20.2)'};
 T.push({id:'ieee9_gfm',group:'Grid-forming (4.18.1)',title:'IEEE 9 με μετατροπέα στη θέση της G3: grid-forming ή grid-following (nadir, RoCoF)',theory:'formula',topology:'ieee9_gfm',
  options:[{k:'unit',label:'Στον ζυγό 3',options:Object.entries(IEEE9_GFM_U),def:'droop'},{k:'dp',label:'Βήμα φορτίου στον ζυγό 7 στο 1 s',options:[['50','+50 MW'],['25','+25 MW'],['90','+90 MW'],['150','+150 MW (μεγάλη διαταραχή, 4.20.3)']],def:'50'},
   {k:'dc',label:'Πλευρά DC του μετατροπέα (4.20.3)',options:[['ideal','Ιδανική (το matching έχει πάντα πηγή DC ±1,2 pu)'],['source','Πηγή DC ±1,2 pu για κάθε νόμο'],['low','Πηγή DC ±0,8 pu (μικρό περιθώριο) για κάθε νόμο']],def:'ideal'},
   {k:'lim',label:'Όριο ρεύματος μέσω της P_ref (4.20.3)',options:[['off','Όχι'],['p24','Ναι: i_th 0,9 pu, γ_p 2,3'],['p24f','Ναι, με φίλτρο 20 Hz στο |i| (δική μας προσθήκη, 4.20.4)']],def:'off'},
   {k:'mod',label:'Διαμόρφωση εκτός matching (4.20.4)',options:[['meas','Με τη μετρημένη v_dc (4.18)'],['nom','Με την ονομαστική V_dc, όπως η (9) των Tayyebi κ.ά.']],def:'meas'}],
  desc:'Το δίκτυο των 9 ζυγών σε EMT (ροή φορτίου του pcl.network, AVR, PSS και ρυθμιστές στροφών στις G1, G2) με τη μονάδα του ζυγού 3 ως μετατροπέα 128 MVA (όση η G3, μέσο μοντέλο VSC με πηνίο 0,15 pu) που δίνει τα 85 MW και −10,9 Mvar της ροής φορτίου. Grid-forming: σχηματίζει την τάση του και αλλάζει τη συχνότητά του με την ισχύ (στατικότητα ή εικονική αδράνεια). Grid-following: ακολουθεί τη γωνία του δικτύου με PLL και δίνει ρεύμα· η απόκριση στη συχνότητα έρχεται μετά το PLL. Στο 1 s κλείνει ένα φορτίο στον ζυγό 7.',
  tasks:['Σύγκρινε στην κάρτα το βύθισμα (nadir) και το RoCoF (σε 250 ms, όπως οι Tayyebi κ.ά. 2020) της ταχύτητας της G1 για κάθε επιλογή του ζυγού 3, με το ίδιο βήμα φορτίου.','Ο grid-forming με στατικότητα δίνει ισχύ αμέσως (σε δεκάδες ms)· η G3 μέσω του ρυθμιστή ατμού (δευτερόλεπτα)· η VSM με H = 3,01 s κάνει ό,τι η αδράνεια της G3, χωρίς τον αργό στρόβιλο.','Ο grid-following χωρίς απόκριση στη συχνότητα αφαιρεί την αδράνεια και τη ρύθμιση της G3: το βύθισμα είναι το μεγαλύτερο. Με απόκριση 5 % πλησιάζει τον grid-forming, αλλά μετά την καθυστέρηση του PLL και του φίλτρου.','Η μόνιμη απόκλιση της συχνότητας (κάρτα) είναι ίδια όταν η στατικότητα είναι ίδια (5 % σε 128 MVA), αλλά οι ρυθμιστές νερού και ατμού φτάνουν εκεί σε δεκάδες δευτερόλεπτα.','dVOC και matching (4.20.2): το dVOC κάνει ό,τι η στατικότητα χωρίς το φίλτρο της· στο matching η συχνότητα είναι η τάση DC (δες τη v_dc στο scope) και η αδράνεια η ενέργεια του πυκνωτή DC (0,0476 s). Ποιο έχει μικρότερο RoCoF, και γιατί;'],
  build(o){const unit=IEEE9_GFM_U[o.unit]?o.unit:'droop',dp=+o.dp||50,S=128e6,Un=345e3,f=60,w0=2*Math.PI*f,te=1,T=12,r=x=>+x.toPrecision(6);
   const Zb=Un*Un/S,X=0.15,Lf=r(X*Zb/w0),Rf=r(0.003*Zb),Vdc=r(2*Un*Math.SQRT2/Math.sqrt(3)*1.3),V3=1.025,a3=4.664751,P3=85e6/S,Q3=-10.859709e6/S;
   // the EMF of the grid-forming converter behind X for the load flow at bus 3 (pu on S): E = V + jX·conj(S/V)
   const Ir=P3/V3,Ii=-Q3/V3,Er=V3-X*Ii,Ei=X*Ir,E=Math.hypot(Er,Ei),dl=Math.atan2(Ei,Er)*180/Math.PI,gfm=['droop','vsm','dvoc','match'].includes(unit),gfl=unit==='gfl'||unit==='gfl0',mt=unit==='match';
   // 4.20.3: the DC side of matching for every grid-forming law (dc = 'source': the control gives the DC current reference
   // (10), dcc), and the current limitation through the power set-point (24) with the threshold and gain of Tayyebi et al.
   // 2020 §IV-E
   const dcs=mt||(gfm&&(o.dc==='source'||o.dc==='low')),p24=gfm&&(o.lim==='p24'||o.lim==='p24f'),dcLim=dcs&&o.dc==='low'?0.8:1.2;
   // 4.20.4: a filter of 20 Hz on |i| before (24) (our addition: without it droop and dVOC swing at the limit), and the
   // modulation (9) on the nominal V_dc for the laws other than matching
   const fpl=p24&&o.lim==='p24f'?20:0,mdc=gfm&&!mt&&o.mod==='nom'?'nom':'meas';
   // 4.20.2: matching control has the DC side of Tayyebi et al. (2020): the DC capacitor with the energy of their Table I
   // (H_dc = C·V_dc²/(2S) = 0,0476 s) and a DC current source from the output idc of the control through a first-order lag
   // and ±1,2 pu ((2)–(3)); the lag 5 ms, not their 50 ms (THEORY §8Ψ.3)
   const Hdc=0.0476,Cdc=r(2*Hdc*S/(Vdc*Vdc)),Idb=r(S/Vdc),tdc=0.005;
   // dVOC with the virtual resistance R_v: the oscillator's voltage is E + R_v·I, and its set-points are the power at it (P and Q
   // at the internal EMF), so that the start is the load flow
   const dv=unit==='dvoc',Rv=dv?DVOC_RV:0,Eor=Er+Rv*Ir,Eoi=Ei+Rv*Ii,Eo=Math.hypot(Eor,Eoi),dlo=Math.atan2(Eoi,Eor)*180/Math.PI,Po=Eor*Ir+Eoi*Ii,Qo=Eoi*Ir-Eor*Ii;
   const ext={T,meta:{ieee9gfm:{unit,dp,S,te,mp:0.05,H:3.01,P3,Q3,E,V3,Hdc,tdc,Rv,Po,Qo,Eo,dcs,p24,dcLim,fpl,mdc,K:{G1:2.475/0.04,G2:1.92/0.05,G3:1.28/0.05},Sb:100e6,f,Twin:0.25}},
    add(comps,wires,panes){wires.push(['B7','L76:abc1']);
     if(unit!=='sm'){const gone=new Set(['G3','AV3','PS3','GV3']),own=q=>typeof q==='string'&&gone.has(q.split(':')[0]);
      for(let k=comps.length-1;k>=0;k--)if(gone.has(comps[k].id))comps.splice(k,1);for(let k=wires.length-1;k>=0;k--)if(own(wires[k][0])||own(wires[k][1]))wires.splice(k,1);
      comps.push(C('VS3','VSC2',1560,160,{...(dcs?{dc:'pins',Vdc0:Vdc}:{dc:'ideal',Vdc}),mmax:1.155,filt:'l',Lf,Rf,init:'lf',E0:r(E*Un*Math.SQRT2/Math.sqrt(3)),th0:r(a3-90+dl),conn:'bus'},{label:'μετατροπέας 128 MVA',flip:true}));
      if(dcs){comps.push(C('CD3','C',1700,150,{C:Cdc,v0:Vdc},{label:'C_dc (H_dc 0,0476 s)'}),C('ID3','IDC',1800,150,{ctl:'sig'},{label:'πηγή DC'}),
        C('LD3','LPF',1600,400,{fc:r(1/(2*Math.PI*tdc)),y0:String(r(P3))},{label:'τ_dc 5 ms'}),C('SD3','SAT',1680,400,{lo:-dcLim,hi:dcLim},{label:dcLim===1.2?'±1,2 pu':'±0,8 pu'}),C('KD3','GAIN',1760,400,{K:Idb},{label:'× S/V_dc'}));
       wires.push(['VS3:p','CD3:p'],['VS3:n','CD3:n'],['ID3:p','VS3:p'],['ID3:n','VS3:n'],['CT3:idc','LD3:u'],['LD3:y','SD3:u'],['SD3:y','KD3:u'],['KD3:y','ID3:u']);}
      {const [mL,mR]=busMeter(comps,wires,'M3',1300,140,{i:'i_a προς τον ζυγό 3',v:'v_a ζυγού 3',rev:true});wires.push(['B3',mL],[mR,'VS3:abc']);}
      if(gfm){comps.push(C('CT3','GFMC',1180,300,{law:unit,inner:'direct',S,Vac:Un,Vdc,f0:f,Pref:String(r(dv?Po:P3)),Qref:String(r(dv?Qo:Q3)),Vref:String(r(mt?V3:dv?Eo:E)),mp:5,nq:5,fp:5,H:3.01,tv:0.02,kv:0,Rv,Xv:0,Xc:X,Imax:1.2,
        ac:600,vmax:1.3,bw:20,th0:r(a3-90+(dv?dlo:dl)),tsoft:0,fi:'ref',...(mt?{kpm:0.001,kim:0.5,mu0:String(r(E))}:dcs?{dcc:'on'}:{}),...(p24?{plim:'on',ith:0.9,gp:2.3,...(fpl?{fpl}:{})}:{}),...(mdc==='nom'?{mdc}:{}),conn:'bus'},{label:{vsm:'VSM',dvoc:'dVOC',match:'matching control'}[unit]||'grid-forming (στατικότητα)'}));wires.push(...gfmWire('CT3','VS3',1560,160,1180,300,420));}
      else{comps.push(C('CT3','MMCC',1180,300,{mode:'p',cc:'robust',acc:4,Tii:0.05,S,Vac:Un,Vdc,f0:f,Pref:String(r(-P3)),Vacref:String(V3),frq:unit==='gfl'?'droop':'off',mf:5,Tf:0.05,X,R:0.003,Ilim:1.2,vmax:1.3,bw:5,th0:r(a3-90),prot:'off',tdb:0,tbrk:0},
         {label:unit==='gfl'?'grid-following με απόκριση στη συχνότητα':'grid-following, σταθερή P'}),
        C('SI3','BSEL',1260,420,{idx:'1, 2, 3'},{label:'i_abc'}),C('NI3','GAIN',1220,460,{K:-1},{label:'−1'}),C('DI3','DEMUX',1140,460,{n:3}),C('SV3','BSEL',1260,500,{idx:'4, 5, 6'},{label:'v_abc'}),C('DV3','DEMUX',1140,520,{n:3}),
        C('SD3','BSEL',1260,580,{idx:'10'},{label:'v_dc'}),C('MX3','MUX',1290,260,{n:3},{label:'m'}),C('K03','CONST',1040,600,{v:'0'},{label:'I_dc, v_s: όχι'}));
       wires.push(['VS3:meas','SI3:u'],['VS3:meas','SV3:u'],['VS3:meas','SD3:u'],['SI3:y','NI3:u'],['NI3:y','DI3:u'],['SV3:y','DV3:u'],['SD3:y','CT3:vdc'],['MX3:y','VS3:m'],['K03:y','CT3:idc'],['K03:y','CT3:vs']);
       ['a','b','c'].forEach((x,k)=>wires.push(['DI3:y'+(k+1),'CT3:i'+x],['DV3:y'+(k+1),'CT3:v'+x],['CT3:m'+x,'MX3:u'+(k+1)]));}}
     // the load step at bus 7 (constant impedance: dp at the nominal voltage)
     comps.push(C('CBS','CB3',840,280,{cmd:`0:0, ${te}:1`,model:'ideal',conn:'bus'},{label:`κλείνει στο ${te} s`}),C('LDS','LOAD3',840,400,{cn:'yn',Un,f,P:dp*1e6,Q:0,model:'z',conn:'bus'},{label:`+${dp} MW`,lbl:'below'}));
     wires.push(['B7','CBS:abc1'],['CBS:abc2','LDS:abc']);
     const w3=unit==='sm'?[['Y:G3','ω₃']]:gfm?[['Y:CT3/WW','ω του μετατροπέα']]:unit==='gfl'?[['Y:CT3/WPU','ω του PLL (φίλτρο 50 ms)']]:[];
     const p3=unit==='sm'?[['Y:G3:pe','P₃ (pu των 100 MVA)']]:gfm?[['Y:CT3/PP','P του μετατροπέα (pu των 128 MVA)']]:[['Y:CT3/PP','P προς τον μετατροπέα (pu των 128 MVA)']];
     panes.length=0;panes.push([['Y:G1','ω₁ (G1)'],['Y:G2','ω₂ (G2)'],...w3],[['Y:G1:pe','P₁ (pu των 100 MVA)'],['Y:G2:pe','P₂'],...p3],[['Y:G1:vt','|V₁|'],['Y:G2:vt','|V₂|'],...(unit==='sm'?[['Y:G3:vt','|V₃|']]:[['Y:CT3/VG','|V₃| (μετατροπέας)']])]);
     if(unit!=='sm')panes.push([['Y:M3A','i_a του μετατροπέα προς τον ζυγό 3 (αμπερόμετρο, A)']],[['Y:M3V','v_a του ζυγού 3 (probe, V)']]);
     if(dcs)panes.push([['Y:VS3/VD','v_dc του μετατροπέα (V)']]);}};
   const pr=ieee9Build({ev:'none',ctl:'full'},ext);pr.sim={...pr.sim,hDiv:200,speed:0.5,stopT:T};pr.scope={...pr.scope,window:{unit:'s',n:T}};return pr;}});
 T.push({id:'empty',group:'Νέο',title:'Κενό κύκλωμα',theory:null,options:[],desc:'Ξεκίνα από την αρχή: πρόσθεσε στοιχεία από τη βιβλιοθήκη (κλικ ή σύρσιμο), ένωσε ακροδέκτες και πάτα ▶.',tasks:['Χρειάζεται γείωση (σύμβολο 0 V) και μπλοκ PWM για τους διακόπτες.'],
  build(){return project([gnd(200,300),C('PWM1','PWM',200,80,{fs:20e3,D:.5})],[],{sim:{hDiv:200,speed:100,stopT:0},scope:{panes:[[]],window:{unit:'T',n:10}}});}});
 // 5.0.1 (ROADMAP §92, THEORY §8ΩΖ): the energization of a transformer with a saturable core: the inrush current and the
 // residual flux. The three poles close at t = 0 (the breaker is closed from the start: a pole that starts open would be
 // latched by the start of the solver where its voltage is positive); the instant on the wave is the phase of the network.
 // Kept as a case for the comparison with the EMTP (decision 351)
 T.push({id:'xf_inrush',group:'Μετασχηματιστές (5.0.1)',title:'Ζεύξη μετασχηματιστή: ρεύμα ζεύξης και παραμένουσα ροή',theory:'formula',topology:'xf_inrush',
  options:[{k:'rem',label:'Παραμένουσα ροή (a, b, c)',options:[['worst','+0,8 / −0,8 / 0 pu'],['half','+0,4 / −0,4 / 0 pu'],['none','Καμία']],def:'worst'},
   {k:'th',label:'Στιγμή ζεύξης',options:[['0','v_a = 0 (η μεγαλύτερη ροή στη φάση a)'],['90','v_a στο μέγιστο (η φάση a χωρίς ασυμμετρία)']],def:'0'},
   {k:'sat',label:'Πυρήνας',options:[['two','Κορεσμός: δύο κλίσεις (γόνατο 1,2 pu)'],['tab','Κορεσμός: σημεία ψ–i'],['lin','Γραμμικός, χωρίς κορεσμό (για σύγκριση)']],def:'two'},
   {k:'pos',label:'Κλάδος μαγνήτισης',options:[['mid','Στη μέση της σκέδασης'],['w2','Στην πλευρά 20 kV (πιο κοντά στον πυρήνα)']],def:'mid'}],
  desc:'Ένας μετασχηματιστής 40 MVA, 150/20 kV YNd11 χωρίς φορτίο μπαίνει στο δίκτυο 150 kV (S″k = 3 GVA) στο t = 0. Κάθε μονοφασική μονάδα έχει πυρήνα με καμπύλη ψ–i κατά τμήματα: ως το γόνατο η κλίση της X_m (i₀ = 0,3 %), μετά η κλίση του πυρήνα αέρα. Ο πυρήνας ξεκινά από την παραμένουσα ροή της επιλογής. Αν η ροή ξεπεράσει το γόνατο, το ρεύμα μαγνήτισης γίνεται ρεύμα ζεύξης, πολλές φορές το ονομαστικό, με συνιστώσα DC που σβήνει αργά. Το παράδειγμα κρατιέται για σύγκριση με το EMTP.',
  tasks:['Με v_a = 0 και +0,8 pu στη φάση a, η ροή της πηγής φτάνει 0,8 + 2 = 2,8 pu· ο πυρήνας φτάνει λιγότερο, γιατί το ρεύμα ζεύξης ρίχνει τάση στο δίκτυο και στη σκέδαση. Η κάρτα δίνει μια εκτίμηση της κορυφής με την εμπέδηση του δικτύου· σύγκρινε με την προσομοίωση.',
   'Βάλε «Καμία» παραμένουσα ροή και ζεύξη στο μέγιστο της v_a: η φάση a ξεκινά συμμετρική, οι b και c όχι.','Ο γραμμικός πυρήνας δεν δίνει ρεύμα ζεύξης: μόνο το ρεύμα μαγνήτισης με DC.',
   'Η συνιστώσα DC της ροής σβήνει με τις απώλειες: τρέξε ως το 1 s και δες το ρεύμα να μικραίνει από περίοδο σε περίοδο.','Μετακίνησε τον κλάδο στην πλευρά 20 kV: η κορυφή αλλάζει, γιατί αλλάζει η σκέδαση ανάμεσα στο δίκτυο και τον κορεσμένο πυρήνα (Part III, σελ. 2052).'],
  build(o){const rem=o.rem==='none'?[0,0,0]:o.rem==='half'?[0.4,-0.4,0]:[0.8,-0.8,0],th=+o.th||0,sat=o.sat==='tab'?'tab':o.sat==='lin'?'lin':'two',pos=o.pos==='w2'?'w2':'mid';
   const grid={Un:150e3,Sk:3e9,XR:10,emf:'un',phase:th,conn:'bus'},xf={grp:'YNd11',Sn:40e6,U1:150e3,U2:20e3,uk:12,Pk:150e3,i0:0.3,P0:25e3,conn:'bus',
    ...(sat==='lin'?{}:{sat,psiK:1.2,satTab:'0.003: 1, 0.012: 1.15, 0.06: 1.25',psiRa:rem[0],psiRb:rem[1],psiRc:rem[2]}),...(pos==='w2'?{mpos:'w2'}:{})};
   const comps=[C('G1','GRID3',140,280,grid,{label:'δίκτυο 150 kV'}),C('CB1','CB3',460,280,{cmd:'0:1',conn:'bus'},{label:'κλείνει στο t = 0'}),C('T1','XF3',640,280,xf,{label:'40 MVA YNd11'}),C('B2','EBUS',800,280,{n:3},{lbl:'none'})];
   const wires=[['CB1:abc2','T1:abc1'],['T1:abc2','B2:bus']];
   {const [mL,mR]=busMeter(comps,wires,'M',230,280,{i:'i_a',v:'v_a'});wires.push(['G1:abc',mL],[mR,'CB1:abc1']);}
   return project(comps,wires,{sim:{hDiv:400,speed:2,stopT:1},
    scope:{panes:[[['Y:CB1/Ia','i_a'],['Y:CB1/Ib','i_b'],['Y:CB1/Ic','i_c']],...(sat==='lin'?[[['Im:T1/Ta','i_m,a'],['Im:T1/Tb','i_m,b'],['Im:T1/Tc','i_m,c']]]:[[['PSIm:T1/Ta','ψ_a'],['PSIm:T1/Tb','ψ_b'],['PSIm:T1/Tc','ψ_c']]])],window:{unit:'T',n:10}},
    meta:{grid,xf,rem,th,sat,pos}});}});
 // 4.17.1 (§59): the DC-DC tutorials declare their inputs (parameters marked «Είσοδος», in the parameters of the circuit
 // with their explanation): V_in, the inductors and capacitors, the load, the switching frequency and (fixed D) the duty
 const DCDC_IN={V1:[['V','Vin','τάση εισόδου']],L1:[['L','L1','αυτεπαγωγή L1']],L2:[['L','L2','αυτεπαγωγή L2']],C1:[['C','C1','χωρητικότητα C1']],C2:[['C','C2','χωρητικότητα C2 (εξόδου)']],
  R1:[['R','R','αντίσταση φορτίου']],PWM1:[['fs','fs','συχνότητα μεταγωγής'],['D','D','λόγος κατάτμησης (ανοικτός βρόχος)']]};
 function dcdcInputs(pr){for(const c of pr.components||[]){const L=DCDC_IN[c.id];if(!L)continue;
   for(const [k,name,desc] of L){if(k==='D'&&c.params.mode&&c.params.mode!=='fixed')continue;if(c.params[k]===undefined&&k!=='fs')continue;
    c.inp=[...(c.inp||[]),k];c.inpName={...(c.inpName||{}),[k]:name};c.inpDesc={...(c.inpDesc||{}),[k]:desc};}}
  return pr;}
 for(const id of ['buck','boost','buck_boost','cuk','sepic','buck_vloop']){const t=T.find(q=>q.id===id);if(t){const b=t.build;t.build=o=>dcdcInputs(b.call(t,o));}}
 root.Tutorials={list:T,bigGrid,piGains,steadyStart,samplingPhase,rippleDev,polyDesign,polyCancel,get:id=>T.find(t=>t.id===id)};
})(window);
