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
 const CLOCK=(extra={})=>ref('clock','Ρολόι (PWM ή μπλοκ Ρολόι)',['PWM','CLK'],{hint:'Ενημέρωση σε σημεία του φέροντος του PWM (ή στην ανερχόμενη ακμή του μπλοκ Ρολόι), όπως στο Sample & Hold.',...extra});
 const TRIG=sel('trig','Πότε ενημερώνεται',[['start','Αρχή περιόδου του φέροντος (1 ανά T)'],['mid','Μέσο περιόδου (1 ανά T)'],['both','Και τα δύο (2 ανά T)']],'start');
 const SCHED='Πρόγραμμα: ζεύγη «t:τιμή» χωρισμένα με κόμμα, π.χ. 0:60000, 0.005:30000. Κενό = σταθερή τιμή.';
 const PARTS={
  R:{name:'Αντίσταση',prefix:'R',group:'Παθητικά',pins:{a:[-30,0],b:[30,0]},box:[-22,-8,44,16],
   params:[num('R','Αντίσταση','Ω',10),txt('sched','R(t)','',{hint:SCHED})],
   value:p=>p.R,unit:'Ω',
   draw:()=>'<path d="M-30,0 H-20 l2.5,-7 5,14 5,-14 5,14 5,-14 5,14 5,-14 5,14 2.5,-7 H30"/>'},
  L:{name:'Πηνίο',prefix:'L',group:'Παθητικά',pins:{a:[-30,0],b:[30,0]},box:[-24,-9,48,11],
   params:[num('L','Αυτεπαγωγή','H',100e-6),num('i0','Αρχικό ρεύμα a→b','A',0,{signed:true,hint:'i_L(0): ρεύμα από τον ακροδέκτη a προς τον b.'}),num('Rs','Αντίσταση τυλίγματος','Ω',0,{zero:true})],
   value:p=>p.L,unit:'H',
   draw:()=>'<path d="M-30,0 H-24 a6,6 0 0,1 12,0 a6,6 0 0,1 12,0 a6,6 0 0,1 12,0 a6,6 0 0,1 12,0 H30"/>'},
  C:{name:'Πυκνωτής',prefix:'C',group:'Παθητικά',pins:{p:[0,-30],n:[0,30]},box:[-15,-7,30,14],
   params:[num('C','Χωρητικότητα','F',100e-6),num('v0','Αρχική τάση p−n','V',0,{signed:true}),num('esr','ESR','Ω',0,{zero:true})],
   value:p=>p.C,unit:'F',
   draw:()=>'<path d="M0,-30 V-5 M-15,-5 H15 M-15,5 H15 M0,5 V30"/><path class="thin" d="M8,-14 h6 M11,-17 v6"/>'},
  VDC:{name:'Πηγή DC / μπαταρία',prefix:'V',group:'Πηγές',pins:{p:[0,-40],n:[0,40]},box:[-17,-17,34,34],
   params:[num('V','Τάση','V',12,{signed:true}),num('Rs','Εσωτερική αντίσταση','Ω',0,{zero:true}),bool('uni','Μονόδρομη (δίοδος σε σειρά)',false),txt('sched','V(t)','',{hint:SCHED})],
   value:p=>p.V,unit:'V',
   draw:p=>p.uni?'<path d="M0,-40 V-34 M0,-24 V-16 M0,16 V40"/><path class="fill" d="M-5,-24 L5,-24 L0,-33 Z"/><path d="M-6,-34 H6"/><circle r="16"/><path class="thin" d="M-4,-7 h8 M0,-11 v8 M-4,8 h8"/>':'<path d="M0,-40 V-16 M0,16 V40"/><circle r="16"/><path class="thin" d="M-4,-7 h8 M0,-11 v8 M-4,8 h8"/>'},
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
   params:[num('I','Ρεύμα (βγαίνει από το p)','A',1,{signed:true}),txt('sched','I(t)','',{hint:SCHED})],
   value:p=>p.I,unit:'A',
   draw:()=>'<path d="M0,-40 V-16 M0,16 V40"/><circle r="16"/><path class="thin" d="M0,10 V-9 M-5,-3 L0,-10 L5,-3"/>'},
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
 const GROUPS=['Πηγές','Παθητικά','Ημιαγωγοί','Μαγνητικά','Μηχανές','Φορτία','Έλεγχος','Σήματα','Βασικά'];
 function defaults(type){const o={};for(const p of PARTS[type].params)o[p.k]=p.def;return o;}
 // electrical + signal pins of one placed part
 function sigPins(c){const d=PARTS[c.type];if(!d||!d.spins)return {};return typeof d.spins==='function'?d.spins({...defaults(c.type),...(c.params||{})}):d.spins;}
 function pinsOf(c){const d=PARTS[c.type];if(!d)return {};if(!d.spins)return d.pins;const o={...d.pins};for(const [k,v] of Object.entries(sigPins(c)))o[k]=v.at;return o;}
 function pinKind(c,pin){const s=sigPins(c)[pin];return s?s.dir:'el';}
 // rotation (0..3 quarter turns) and mirror applied to a local point
 function xf(c,[x,y]){if(c.flip)x=-x;for(let i=0;i<(c.rot||0);i++)[x,y]=[-y,x];return [c.x+x,c.y+y];}
 function pinPos(c,pin){const q=pinsOf(c)[pin];return q?xf(c,q):null;}
 // outward direction of a pin (unit vector), for wire escape
 function pinDir(c,pin){const [x,y]=pinsOf(c)[pin]||[1,0];let d=Math.abs(x)>=Math.abs(y)?[Math.sign(x)||1,0]:[0,Math.sign(y)||1];
  if(c.type==='GND')d=[0,-1];if(c.type==='JUNC')d=[0,0];
  const o=xf({x:0,y:0,rot:c.rot,flip:c.flip},d);return o;}
 function bbox(c){const [bx,by,bw,bh]=PARTS[c.type].box;const pts=[[bx,by],[bx+bw,by],[bx,by+bh],[bx+bw,by+bh]].map(p=>xf(c,p));
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
 const api={PARTS,GROUPS,BLOCKS,defaults,sigPins,pinsOf,pinKind,xf,pinPos,pinDir,bbox,eng,parseEng,parseSched};
 root.Parts=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
