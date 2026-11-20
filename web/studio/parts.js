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
 const area=(k,label,def,extra={})=>({k,label,type:'area',def,...extra});   // 4.9: several lines (a note on the drawing)
 // signal pins (3.0): {at, dir}; a part's signal pins may depend on its parameters
 const I=(x,y)=>({at:[x,y],dir:'in'}),O=(x,y)=>({at:[x,y],dir:'out'});
 const xe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const sb=(w,h)=>`<rect class="block sblk" x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" rx="4"/>`;
 const tx=(t,x=0,y=4,cls='btxt')=>`<text class="${cls}" x="${x}" y="${y}" text-anchor="middle">${t}</text>`;
 const sl=d=>`<path class="sigl" d="${d}"/>`;
 // 4.17.3 (ROADMAP §65): the style of the symbols, «iec» (the default: the resistor as a rectangle) or «ansi» (zig-zag);
 // setSym changes it, and the editor and the library draw again
 let SYM='iec';const setSym=v=>{SYM=v==='ansi'?'ansi':'iec';};const symStyle=()=>SYM;
 // the paths of a symbol made only of horizontal and vertical segments get the class «hv» (drawn without antialiasing in
 // the technical look: no grey edge); a cache per symbol text
 const HV=new Map();
 function hvPath(d){const t=String(d).match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g)||[];let cmd='',i=0,x=0,y=0,x0=0,y0=0;const n=()=>+t[i++];
  while(i<t.length){if(/[a-zA-Z]/.test(t[i]))cmd=t[i++];
   switch(cmd){case 'M':x=n();y=n();x0=x;y0=y;cmd='L';break;case 'm':x+=n();y+=n();x0=x;y0=y;cmd='l';break;
    case 'H':x=n();break;case 'h':x+=n();break;case 'V':y=n();break;case 'v':y+=n();break;
    case 'L':{const a=n(),b=n();if(a!==x&&b!==y)return false;x=a;y=b;break;}case 'l':{const a=n(),b=n();if(a!==0&&b!==0)return false;x+=a;y+=b;break;}
    case 'Z':case 'z':if(x!==x0&&y!==y0)return false;x=x0;y=y0;break;default:return false;}}
  return true;}
 function symHV(svg){let r=HV.get(svg);if(r!==undefined)return r;
  r=String(svg).replace(/<path((?:\s+[\w:-]+="[^"]*")*)\s*\/?>/g,(m,attrs)=>{const d=/\sd="([^"]*)"/.exec(attrs);if(!d||!hvPath(d[1]))return m;
   return /\sclass="/.test(attrs)?m.replace(/\sclass="([^"]*)"/,(q,c)=>` class="${c} hv"`):m.replace('<path','<path class="hv"');});
  if(HV.size>4000)HV.clear();HV.set(svg,r);return r;}
 // the phases of a three-phase part in their colours (technical look): the stubs of a path at three levels (top to
 // bottom or left to right: a, b, c) become one path per phase with the classes «ph ph-a/b/c»; what else the path has
 // stays as it was (a neutral, a slanted line)
 const PH3=new Set(['VAC3','IM','SM','EBUS','GRID3','FLT3','CB3','XF3','LOAD3','GEN3','LINE3','TLM','MMC','LCC6','LCCS','LCCX','FILT3','ZSER3']);
 function phaseSplit(type,svg){if(!PH3.has(type))return svg;
  return String(svg).replace(/<path d="([^"]*)"\s*\/>/g,(m,d)=>{const t=d.trim().replace(/\s+/g,' '),re=/M\s*(-?[\d.]+)[ ,]\s*(-?[\d.]+)\s*([HV])\s*(-?[\d.]+)/g,segs=[];let q,joined='';
   while((q=re.exec(t))){segs.push({x:+q[1],y:+q[2],k:q[3],s:q[0]});joined+=q[0];}
   if(segs.length<3||joined.replace(/\s/g,'')!==t.replace(/\s/g,''))return m;
   for(const kind of ['H','V']){const g=segs.filter(z=>z.k===kind),lev=[...new Set(g.map(z=>kind==='H'?z.y:z.x))].sort((a,b)=>a-b);if(g.length<3||lev.length!==3)continue;
    const rest=segs.filter(z=>z.k!==kind).map(z=>z.s).join(' ');
    return ['a','b','c'].map((ph,i)=>`<path class="ph ph-${ph}" d="${g.filter(z=>(kind==='H'?z.y:z.x)===lev[i]).map(z=>z.s).join(' ')}"/>`).join('')+(rest?`<path d="${rest}"/>`:'');}
   return m;});}
 // buses (3.18): thick leads, electrical (bl) and signal (sbl); CONN = separate pins or one bus pin
 const bl=d=>`<path class="busl" d="${d}"/>`,sbl=d=>`<path class="sigl busl" d="${d}"/>`;
 // 4.9 (ROADMAP §31): the arc of a circuit-breaker pole, black-box models (THEORY §Arc). Values: indicative, from the
 // literature (the improved Mayr: a fit to current-zero measurements of a 245 kV / 50 kA SF6 puffer breaker; the
 // three-Mayr model: the breaker constants of a 145 kV breaker and median state values). Real breakers: to do (decision 76).
 const ARC_MODELS=[['imayr','Mayr βελτιωμένο: P = P₀ + P₁·u·i (από μετρήσεις)'],['mayr','Mayr'],['cassie','Cassie'],['habedank','Cassie + Mayr σε σειρά (Habedank)'],
  ['schwarz','Mayr τροποποιημένο: τ = τ₀·g^α, P = P₀·g^β (Schwarz)'],['kema','Τρία τροποποιημένα Mayr σε σειρά (KEMA)']];
 const arcParams=(on=()=>true)=>{const m=(...k)=>p=>on(p)&&k.includes(p.arc||'imayr');return [
  sel('arc','Μοντέλο τόξου',ARC_MODELS,'imayr',{show:on,hint:'Η αγωγιμότητα g του τόξου μετά τον χωρισμό των επαφών: dg/dt = (g^λ·u²/Π − g)/τ ανά τμήμα (Mayr λ = 2, Π = P₀· Cassie λ = 1, Π = U_c²). Ενδεικτικές τιμές από τη βιβλιογραφία.'}),
  num('tau','Σταθερά χρόνου τ','s',0.27e-6,{show:m('imayr','mayr','schwarz'),hint:'Mayr: 0,1–0,5 μs σε SF6. Στο Schwarz είναι το τ₀ (τ = τ₀·g^α).'}),
  num('P0','Ισχύς ψύξης P₀','W',15917,{show:m('imayr','mayr','schwarz'),hint:'Βελτιωμένο Mayr: P₀ = 15 917 W και P₁ = 0,9943 με τ = 0,27 μs ταιριάζουν σε μετρήσεις κοντινής γραμμής 90 % ενός διακόπτη SF6 245 kV / 50 kA.'}),
  num('P1','Συντελεστής P₁','',0.9943,{show:m('imayr'),hint:'P = P₀ + P₁·u·i: η ψύξη αυξάνει με την ηλεκτρική ισχύ (πίεση από τη θέρμανση του αερίου). P₁ < 1.'}),
  num('alpha','Εκθέτης α','',0.25,{show:m('schwarz')}),num('beta','Εκθέτης β','',0.6,{show:m('schwarz')}),
  num('tauc','Σταθερά χρόνου Cassie τ_c','s',1.2e-6,{show:m('cassie','habedank')}),
  num('Uc','Τάση τόξου Cassie U_c','V',1500,{show:m('cassie','habedank'),hint:'Η σταθερή τάση του τόξου σε μεγάλα ρεύματα (Π = U_c²).'}),
  num('taum','Σταθερά χρόνου Mayr τ_m','s',0.3e-6,{show:m('habedank')}),num('Pm','Ισχύς ψύξης Mayr P_m','W',30e3,{show:m('habedank')}),
  num('tau1','τ₁ (πρώτο τμήμα)','s',4e-6,{show:m('kema'),hint:'τ₂ = τ₁/k₁, τ₃ = τ₂/k₂. Π₃ = k₃·Π₂ είναι η ισχύς ψύξης του τρίτου (καθαρό Mayr) τμήματος.'}),
  num('Pi1','Π₁ (λ₁ = 1,4)','A^0,4·V^1,6',4.4e6,{show:m('kema'),hint:'Ορίζει την τάση του τόξου σε μεγάλα ρεύματα: U ≈ (Π₁/|i|^0,4)^(1/1,6) (≈ 1 kV στα 40 kA).'}),
  num('Pi2','Π₂ (λ₂ = 1,9)','A^0,9·V^1,1',30,{show:m('kema')}),
  num('k1','k₁','',5.7,{show:m('kema')}),num('k2','k₂','',10,{show:m('kema')}),num('k3','k₃','',100,{show:m('kema')}),
  num('gmin','Ελάχιστη αγωγιμότητα','S',1e-12,{show:on,hint:'Κάτω όριο της αγωγιμότητας μετά τη διακοπή (ρεύμα μετά το τόξο σε S × V).'})];};

 const CONN=what=>sel('conn','Ακροδέκτες',[['sep','Χωριστοί'],['bus',`Δίαυλος ${what} (ένας ακροδέκτης)`]],'sep',{hint:'Δίαυλος (3.18): ένα σύρμα μεταφέρει όλες τις φάσεις ή συνιστώσες, στη σειρά που γράφεται. Το ίδιο κύκλωμα με χωριστά σύρματα δίνει τα ίδια αποτελέσματα.'});
 // 4.24 (decisions 208, 345): one option «Ουδέτερος» in every three-phase part with a star point: solidly grounded, through
 // R_n + jX_n, isolated, or a terminal n outside. The default of each part is what it did before 4.24 (the same netlist).
 const NEUT_LBL={gnd:'Στερεά γειωμένος',z:'Μέσω R_n + jX_n',iso:'Μονωμένος',pin:'Ακροδέκτης n'};
 const NEUT=(k,def,o={})=>{const vals=o.vals||['gnd','z','iso','pin'],sfx=o.sfx||'',vis=o.show||(()=>true),isZ=p=>vis(p)&&(p[k]||def)==='z';
  return [sel(k,o.label||'Ουδέτερος',vals.map(v=>[v,v==='auto'?o.auto:NEUT_LBL[v]]),def,{show:o.show,struct:true,hint:(o.hint?o.hint+' ':'')+'«Μέσω R_n + jX_n»: εμπέδηση από το κέντρο του αστέρα στη γη, 3Z_n στη μηδενική ακολουθία. «Ακροδέκτης n»: το κέντρο του αστέρα έξω, για σύνδεση με το χέρι (4.24).'}),
   num('Rng'+sfx,'R_n'+(sfx?' (πλευρά '+sfx+')':'')+' του ουδετέρου','Ω',0,{zero:true,show:isZ}),
   num('Xng'+sfx,'X_n'+(sfx?' (πλευρά '+sfx+')':'')+' του ουδετέρου','Ω',0,{zero:true,show:isZ,hint:'Επαγωγική αντίδραση στη συχνότητα του στοιχείου, ή στα 50 Hz αν δεν έχει (πηνίο Petersen ή περιορισμού).'})];};
 const neutOf=(p,k,def)=>{const v=p?.[k];return v==='gnd'||v==='z'||v==='iso'||v==='pin'||v==='auto'?v:def;};
 // the two sides of a transformer group (YN/Y/D, yn/y/d), whether a side is a star, and the neutral a side has (null: delta)
 const xfGrp=p=>{const m=/^(YN|Y|D)(yn|y|d)/.exec(String(p?.grp||'Dyn11'));return m?[m[1],m[2]]:['D','yn'];};
 const xfStar=(p,side)=>xfGrp(p)[side-1][0].toUpperCase()==='Y';
 const xfNeut=(p,side)=>{if(!xfStar(p,side))return null;const v=neutOf(p,'neut'+side,'auto');return v==='auto'?(xfGrp(p)[side-1].length===2?'gnd':'iso'):v;};
 const isBus=p=>p.conn==='bus';
 const WIDTH=sel('width','Πλάτος (δίαυλος)',[['1','1: ένα σήμα ή ό,τι συνδεθεί'],['2','2 (π.χ. αβ, dq)'],['3','3 (π.χ. abc)'],['4','4'],['5','5'],['6','6']],'1',{hint:'Πλάτος > 1: ο ακροδέκτης του συμβόλου είναι δίαυλος με τόσα σήματα ή αγωγούς (3.18). Με 1 περνά ό,τι συνδεθεί, και δίαυλος.'});
 const nIO=p=>Math.max(2,Math.min(8,Math.round(+p.n)||3)),nEL=p=>Math.max(2,Math.min(6,Math.round(+p.n)||3));
 const ioY=(n,k)=>-10*(n-1)+20*k;
 const Ex=root.Expr||(typeof require!=='undefined'?require('./expr.js'):null);
 // code blocks (3.3): inputs on the left and outputs on the right, named by the user, 20 apart on the grid
 const codeIO=(ins,outs)=>{const o={};ins.forEach((k,i)=>o[k]=I(-40,-10*(ins.length-1)+20*i));outs.filter(k=>!(k in o)).forEach((k,i,a)=>o[k]=O(40,-10*(a.length-1)+20*i));return o;};
 const codeH=(ins,outs)=>Math.max(15,10*Math.max(ins.length,outs.length));
 // 4.10: the parameters of a cascaded arm (shared by CHB and its compact element CHBX) and the pins of NLC and CHBX
 const nCells=p=>Math.max(1,Math.min(64,Math.round(+p.N)||1));
 const chbParams=()=>[num('N','Υπομονάδες N','',10,{hint:'Έως 64. Ο βραχίονας αλλάζει την τάση του σε βήματα V_C: σε δίκτυο βάλε σε σειρά την αυτεπαγωγή σύζευξης (σκέδαση μετασχηματιστή ή πηνίο βραχίονα). Ανάμεσα σε δύο χωρητικούς κόμβους (εγκάρσιες χωρητικότητες γραμμών) κάθε βήμα θα έδινε κρουστικό ρεύμα.'}),sel('cell','Υπομονάδα',[['fb','Γέφυρα H: −v_C, 0, +v_C (CHB, SSSC, STATCOM)'],['hb','Ημιγέφυρα: 0, +v_C (MMC)']],'fb'),
  num('C','Πυκνωτής υπομονάδας C','F',10e-3),num('Vdc','Αρχική τάση πυκνωτών V_C','V',1000,{zero:true}),num('Ron','R_on ανά ημιαγωγό σε αγωγή','Ω',1e-3,{hint:'Σε κάθε υπομονάδα άγουν δύο ημιαγωγοί (γέφυρα H) ή ένας (ημιγέφυρα): R_arm = N·2·R_on ή N·R_on.'}),
  num('Rp','Αντίσταση απωλειών παράλληλα σε κάθε πυκνωτή','Ω',0,{zero:true,hint:'0 = χωρίς. Παριστάνει τις απώλειες της υπομονάδας ως εκφόρτιση του πυκνωτή.'})];
 const nlcIns=p=>['ref','i',...Array.from({length:nCells(p)},(_,k)=>'v'+(k+1))],nlcOuts=p=>['n','vav','sw',...Array.from({length:nCells(p)},(_,k)=>'s'+(k+1))];
 const nlcIO=p=>codeIO(nlcIns(p),nlcOuts(p)),nlcH=p=>codeH(nlcIns(p),nlcOuts(p));
 const chbxIO=p=>codeIO(Array.from({length:nCells(p)},(_,k)=>'s'+(k+1)),['v','i',...Array.from({length:nCells(p)},(_,k)=>'v'+(k+1))]),chbxH=p=>codeH(Array.from({length:nCells(p)},(_,k)=>'s'+(k+1)),[...Array.from({length:nCells(p)+2},(_,k)=>'x'+k)]);
 const pyIns=p=>Ex.names(p.ins,6,false),pyOuts=p=>Ex.names(p.outs,6,false).filter(k=>!pyIns(p).includes(k));
 // 4.7: the neural network block: its named inputs, and when it learns the learning signal (e or tgt) and the freeze input fz;
 // outputs y and the learning curve L
 const nnIns=p=>[...Ex.names(p.ins,6,false),...(p.train==='err'?['e','fz']:p.train==='tgt'?['tgt','fz']:[])],nnOuts=p=>[...(p.train==='err'||p.train==='tgt'?['y','L']:['y']),...(String(p.jac||'').trim()?['dy']:[])];
 const codeDraw=(ins,outs,label)=>{const h=codeH(ins,outs);return sb(60,2*h)+tx(label,0,4,'btxt')+sl([...ins.map((k,i)=>`M-40,${-10*(ins.length-1)+20*i} H-30`),...outs.map((k,i)=>`M30,${-10*(outs.length-1)+20*i} H40`)].join(' '))
  +ins.map((k,i)=>tx(k,-27,-10*(ins.length-1)+20*i-3,'pinl')).join('')+outs.map((k,i)=>tx(k,27,-10*(outs.length-1)+20*i-3,'pinl')).join('');};
 const PY_DEFAULT='# Καλείται σε κάθε δείγμα του ρολογιού.\n# u: είσοδοι, s: κατάσταση, p: παράμετροι (και p["Ts"] = περίοδος δειγματοληψίας).\ndef init(p):\n    return {"xi": 0.0}\n\ndef step(t, u, s, p):\n    e = u["e"]\n    s["xi"] += p["Ki"] * p["Ts"] * e\n    return {"y": p["Kp"] * e + s["xi"]}\n';
 // 4.9.1 (ROADMAP §52, rule of 13/11): a part made of other parts runs either as the fast ready-made part (one compact
 // element of the solver) or as the detailed one built from basic elements, which can be seen and expanded. Parts that were
 // definitions before 4.9.1 keep the detailed one as default (4.x rule: an old file gives the same numbers).
 const IMPL=(def='blocks',hint='')=>sel('impl','Υλοποίηση',[['blocks','Αναλυτική από στοιχεία (φαίνεται, αναπτύσσεται)'],['fast','Γρήγορη (συμπαγές στοιχείο του λύτη)']],def,{hint:'Ίδιο μοντέλο, ίδια αποτελέσματα (test ισοδυναμίας). Η αναλυτική είναι φτιαγμένη από βασικά στοιχεία: «⧉ Τι έχει μέσα» τη δείχνει, «▣ Ανάπτυξη σε υποκύκλωμα» την κάνει υποκύκλωμα για αλλαγές. Η γρήγορη λύνει τα εσωτερικά μέσα σε ένα στοιχείο του λύτη.'+(hint?' '+hint:'')});
 const CLOCK=(extra={})=>ref('clock','Ρολόι (PWM ή μπλοκ Ρολόι)',['PWM','CLK'],{hint:'Ενημέρωση σε σημεία του φέροντος του PWM (ή στην ανερχόμενη ακμή του μπλοκ Ρολόι), όπως στο S&H.',...extra});
 const TRIG=sel('trig','Πότε ενημερώνεται',[['start','Αρχή περιόδου του φέροντος (1 ανά T)'],['mid','Μέσο περιόδου (1 ανά T)'],['both','Και τα δύο (2 ανά T)']],'start');
 // 4.19.6 (ROADMAP §76): the window of the blocks that measure a signal (mean, RMS): np periods of 1/f, running with the time or closed once per period
 const MWIN=(o={})=>[sel('win','Παράθυρο',[['run','Κυλιόμενο: οι τελευταίες περίοδοι ως τώρα'],['per','Ανά περίοδο: η έξοδος αλλάζει στο τέλος κάθε περιόδου']],o.win||'run',
   {hint:'Κυλιόμενο: η έξοδος σε κάθε στιγμή είναι το μέγεθος πάνω στο διάστημα [t − παράθυρο, t]. Ανά περίοδο: το μέγεθος της περιόδου που μόλις τελείωσε, κρατημένο ως το τέλος της επόμενης (όπως τα στατιστικά ανά περίοδο του scope).'}),
  num('f',o.fName||'Συχνότητα','Hz',50,{hint:o.fHint||'Το παράθυρο είναι «Περίοδοι ανά παράθυρο» φορές 1/f.'}),num('np','Περίοδοι ανά παράθυρο','',1,{hint:'Ακέραιος, τουλάχιστον 1.'}),
  sel('fsrc','Συχνότητα από',[['par','Την παράμετρο'],['in','Την είσοδο f (Hz)']],'par',{show:p=>p.win!=='per',hint:'Με είσοδο f το παράθυρο ακολουθεί τη συχνότητα σε κάθε στιγμή (π.χ. από ένα PLL: ω/2π).'}),
  num('fmin','Ελάχιστη συχνότητα','Hz',25,{show:p=>p.win!=='per'&&p.fsrc==='in',hint:'Κάτω από αυτήν το παράθυρο δεν μεγαλώνει άλλο: το μπλοκ κρατά ιστορικό ως «Περίοδοι ανά παράθυρο»/f_min.'}),
  num('t0','Αρχή της πρώτης περιόδου','s',0,{signed:true,zero:true,show:p=>p.win==='per'}),
  CLOCK({show:p=>p.win==='per',hint:'Προαιρετικό. Με ρολόι η περίοδος είναι η περίοδος του φέροντος του PWM (ή του μπλοκ Ρολόι) και η συχνότητα δεν χρησιμοποιείται.'}),
  sel('first','Πριν γεμίσει το πρώτο παράθυρο',[['hold','Η αρχική έξοδος'],['grow','Το μέγεθος από την αρχή ως τώρα']],'hold',{show:p=>p.win!=='per'}),
  num('y0','Αρχική έξοδος','',0,{signed:true,zero:true,hint:o.y0Hint||'Η έξοδος ως το τέλος του πρώτου παραθύρου.'})];
 const mwinF=p=>p.win!=='per'&&p.fsrc==='in';
 // 4.19.6 (§76): the window of the blocks of the harmonics: the frequency is the fundamental, and the window np of its periods
 const F1W={fName:'Θεμελιώδης συχνότητα f₁',fHint:'Το παράθυρο είναι «Περίοδοι ανά παράθυρο» φορές 1/f₁, και η φάση μετριέται από το t = 0 (με ρολόι: από την αρχή της περιόδου του φέροντος).'};
 const SCHED='Πρόγραμμα: ζεύγη «t:τιμή» χωρισμένα με κόμμα, π.χ. 0:60000, 0.005:30000. Κενό = σταθερή τιμή.';
 const SRM_TBL=srmTableText({Lu:.008,La:.06,Lsat:.008,psik:.35});
 // subcircuit symbol (3.17): ports on four sides, 20 apart, ordered as drawn inside (SubCircuit.portsOf)
 const portSide=sel('side','Πλευρά στο σύμβολο',[['auto','προς τα πού κοιτά η θύρα'],['l','αριστερά'],['r','δεξιά'],['t','πάνω'],['b','κάτω']],'auto');
 function subLayout(ports){
  const L=Array.isArray(ports)?ports:[],by=s=>L.filter(p=>p.side===s),l=by('l'),r=by('r'),t=by('t'),b=by('b');
  const len=a=>Math.max(0,...a.map(p=>Math.min(5,String(p.name).length)));
  const H=10*Math.max(l.length,r.length,1)+20,W=Math.max(40,10*Math.max(t.length,b.length)+20,10*Math.ceil((2.6*(len(l)+len(r))+24)/10));
  const pins={},spins={},pos=[],at=(p,x,y)=>{if(p.kind==='el')pins[p.name]=[x,y];else spins[p.name]={at:[x,y],dir:p.kind,...(+p.w>1?{w:+p.w}:{})};pos.push({...p,x,y});};
  l.forEach((p,i)=>at(p,-W-10,-10*(l.length-1)+20*i));r.forEach((p,i)=>at(p,W+10,-10*(r.length-1)+20*i));
  t.forEach((p,i)=>at(p,-10*(t.length-1)+20*i,-H-10));b.forEach((p,i)=>at(p,-10*(b.length-1)+20*i,H+10));
  return {W,H,pins,spins,pos};}
 function subDraw(p){const {W,H,pos}=subLayout(p.$ports);
  let s=`<rect class="block sub" x="${-W}" y="${-H}" width="${2*W}" height="${2*H}" rx="3"/><rect class="thin" x="${-W+3}" y="${-H+3}" width="${2*W-6}" height="${2*H-6}" rx="2"/>`;
  s+='<rect class="thin" x="-7" y="-6" width="10" height="8" rx="1"/><rect class="thin" x="-3" y="-2" width="10" height="8" rx="1"/>';
  for(const q of pos){const lead=q.x<-W?`M${q.x},${q.y} H${-W}`:q.x>W?`M${q.x},${q.y} H${W}`:q.y<-H?`M${q.x},${q.y} V${-H}`:`M${q.x},${q.y} V${H}`;
   s+=+q.w>1?(q.kind==='el'?bl(lead):sbl(lead)):q.kind==='el'?`<path d="${lead}"/>`:sl(lead);
   const [lx,ly,anc]=q.x<-W?[-W+6,q.y+3,'start']:q.x>W?[W-6,q.y+3,'end']:q.y<-H?[q.x,-H+12,'middle']:[q.x,H-6,'middle'];
   s+=`<text class="pinl" x="${lx}" y="${ly}" text-anchor="${anc}">${xe(q.name.slice(0,5))}</text>`;}
  return s;}
 // 4.4: typical single-circuit lines (positions and heights in m, radii in cm, R_dc in Ω/km; phase 0 = ground wire), the same
 // data as pcl/lineconst.py TYPICAL (a test keeps them equal)
 const TLM_TYPICAL={
  '150kV':{name:'Τυπική γραμμή 150 kV, απλό κύκλωμα (ACSR 636 MCM)',rho:100,length:50,earth:'carson',skin:true,
   wires:[{ph:0,x:-4.25,y:23.81,ymid:14.01,r:0.4765,Rdc:3.4617,tD:0.5},{ph:0,x:4.25,y:23.81,ymid:14.01,r:0.4765,Rdc:3.4617,tD:0.5},
    {ph:1,x:-6.28,y:19.95,ymid:10.15,r:1.2575,Rdc:0.0877,tD:0.3157},{ph:2,x:0,y:19.95,ymid:10.15,r:1.2575,Rdc:0.0877,tD:0.3157},{ph:3,x:6.28,y:19.95,ymid:10.15,r:1.2575,Rdc:0.0877,tD:0.3157}]},
  '400kV':{name:'Τυπική γραμμή 400 kV, απλό κύκλωμα (2 × ACSR 954 MCM)',rho:100,length:100,earth:'carson',skin:true,
   wires:[{ph:0,x:-6.1,y:27.15,ymid:18.35,r:0.63,Rdc:2.0276,tD:0.5},{ph:0,x:6.1,y:27.15,ymid:18.35,r:0.63,Rdc:2.0276,tD:0.5}],
   bundles:[{ph:1,x:-8.6,y:20,ymid:11.2,n:2,R:20,ang:0,r:1.521,Rdc:0.0587,tD:0.3335},{ph:2,x:0,y:20,ymid:11.2,n:2,R:20,ang:0,r:1.521,Rdc:0.0587,tD:0.3335},
    {ph:3,x:8.6,y:20,ymid:11.2,n:2,R:20,ang:0,r:1.521,Rdc:0.0587,tD:0.3335}]},
  // 4.9: the same 400 kV line with its two ground wires kept as conductors 4 and 5 (for lightning: they end at the tower tops)
  '400kV-gw':{name:'Τυπική γραμμή 400 kV με τους αγωγούς προστασίας ως αγωγούς 4 και 5 (για κεραυνούς)',rho:100,length:100,earth:'carson',skin:true,
   wires:[{ph:4,x:-6.1,y:27.15,ymid:18.35,r:0.63,Rdc:2.0276,tD:0.5},{ph:5,x:6.1,y:27.15,ymid:18.35,r:0.63,Rdc:2.0276,tD:0.5}],
   bundles:[{ph:1,x:-8.6,y:20,ymid:11.2,n:2,R:20,ang:0,r:1.521,Rdc:0.0587,tD:0.3335},{ph:2,x:0,y:20,ymid:11.2,n:2,R:20,ang:0,r:1.521,Rdc:0.0587,tD:0.3335},
    {ph:3,x:8.6,y:20,ymid:11.2,n:2,R:20,ang:0,r:1.521,Rdc:0.0587,tD:0.3335}]},
  // 4.5: typical single-core XLPE cables (radii in m, resistivities in Ω·m, phase 0 = sheath bonded and earthed at both ends)
  '220kV-sea':{name:'Τυπικό υποβρύχιο καλώδιο 220 kV (3 μονοπολικά XLPE, θάλασσα)',medium:'sea',rho:0.2,length:30,cables:[{x:-1.0,y:30,ph:[1,0],layers:[{t:'c',rin:0,rout:0.0256,rho:1.7e-08},{t:'i',rout:0.055,epsr:2.3,tand:0.0004},{t:'c',rin:0.055,rout:0.0575,rho:2.8e-08},{t:'i',rout:0.085,epsr:2.3}]},{x:0.0,y:30,ph:[2,0],layers:[{t:'c',rin:0,rout:0.0256,rho:1.7e-08},{t:'i',rout:0.055,epsr:2.3,tand:0.0004},{t:'c',rin:0.055,rout:0.0575,rho:2.8e-08},{t:'i',rout:0.085,epsr:2.3}]},{x:1.0,y:30,ph:[3,0],layers:[{t:'c',rin:0,rout:0.0256,rho:1.7e-08},{t:'i',rout:0.055,epsr:2.3,tand:0.0004},{t:'c',rin:0.055,rout:0.0575,rho:2.8e-08},{t:'i',rout:0.085,epsr:2.3}]}]},
  '150kV-land':{name:'Τυπικό υπόγειο καλώδιο 150 kV (3 μονοπολικά XLPE 1000 mm², επίπεδη διάταξη)',medium:'earth',rho:100,length:10,cables:[{x:-0.25,y:1.2,ph:[1,0],layers:[{t:'c',rin:0,rout:0.0189,rho:1.93e-08},{t:'i',rout:0.038,epsr:2.5,tand:0.0004},{t:'c',rin:0.038,rout:0.0384,rho:1.72e-08},{t:'i',rout:0.048,epsr:2.3}]},{x:0.0,y:1.2,ph:[2,0],layers:[{t:'c',rin:0,rout:0.0189,rho:1.93e-08},{t:'i',rout:0.038,epsr:2.5,tand:0.0004},{t:'c',rin:0.038,rout:0.0384,rho:1.72e-08},{t:'i',rout:0.048,epsr:2.3}]},{x:0.25,y:1.2,ph:[3,0],layers:[{t:'c',rin:0,rout:0.0189,rho:1.93e-08},{t:'i',rout:0.038,epsr:2.5,tand:0.0004},{t:'c',rin:0.038,rout:0.0384,rho:1.72e-08},{t:'i',rout:0.048,epsr:2.3}]}]}};
 // 4.14: the two poles of a ±320 kV HVDC link (pcl.lineconst.TYPICAL['320kV-dc']; our typical values)
 TLM_TYPICAL['320kV-dc']={name:'Τυπικά καλώδια ±320 kV DC (2 μονοπολικά XLPE 2000 mm², υπόγεια)',medium:'earth',rho:100,length:70,cables:[-0.25,0.25].map((x,k)=>({x,y:1.3,ph:[k+1,0],layers:[{t:'c',rin:0,rout:0.0265,rho:1.9e-08},{t:'i',rout:0.0535,epsr:2.3,tand:0.0004},{t:'c',rin:0.0535,rout:0.0565,rho:2.8e-08},{t:'i',rout:0.0625,epsr:2.3}]}))};
 // 4.20.1: the 320 kV XLPE cable of the four-terminal HVDC grid test system (pcl.lineconst.TYPICAL['320kV-xlpe'], Leterme et al. 2015)
 TLM_TYPICAL['320kV-xlpe']={name:'Καλώδιο ±320 kV XLPE με μανδύα και οπλισμό (δίκτυο δοκιμής τεσσάρων τερματικών)',medium:'earth',rho:1,length:100,
  cables:[{x:0,y:1,ph:[1,0,0],layers:[{t:'c',rin:0,rout:0.0195,rho:1.7e-8},{t:'s',rout:0.0212},{t:'i',rout:0.0468,epsr:2.3},{t:'s',rout:0.0487},
   {t:'c',rin:0.0487,rout:0.0517,rho:2.2e-7},{t:'i',rout:0.0547,epsr:2.3},{t:'c',rin:0.0547,rout:0.0587,rho:1.8e-7,mur:10},{t:'i',rout:0.0637,epsr:2.3}]}]};
 // 4.13: the land cable with its sheaths kept as conductors 4–6 (pcl.lineconst.TYPICAL['150kV-land-s'])
 TLM_TYPICAL['150kV-land-s']=(()=>{const d=JSON.parse(JSON.stringify(TLM_TYPICAL['150kV-land']));d.name='Τυπικό υπόγειο καλώδιο 150 kV με τους μανδύες ως αγωγούς 4–6 (για cross-bonding)';d.cables.forEach((c,k)=>{c.ph=[k+1,k+4];});return d;})();
 // 4.22: the leader progression model of a gap (an SG with vt = 'lpm' and a tower's strings): the data of the cap-and-pin
 // insulators of the IEEE fast-front guidelines (K, E₀ for each polarity), E₅₀ the mean gradient at the CFO (our default)
 function LPM_PARAMS(show){return [num('gl','Διάκενο g (απόσταση διάσπασης)','m',3.2,{show}),num('E50','Μέση ένταση στην U₅₀ (CFO) E₅₀','V/m',560e3,{show,hint:'Οι streamers χρειάζονται t_s με 1/t_s = 1,25·E/E₅₀ − 0,95 (t_s σε μs, E = |v|/g). Μετά προχωρά ο οχετός.'}),
  num('Kp','K (θετική πολικότητα)','m²/(V²·s)',1.2e-6,{show,hint:'dL/dt = K·|v|·(|v|/(g − L) − E₀). Μονωτήρες πινακίου: θετική 1,2·10⁻⁶ με E₀ 520 kV/m, αρνητική 1,3·10⁻⁶ με 600 kV/m· διάκενα αέρα και μονωτήρες στύλου 0,8·10⁻⁶ / 600 kV/m και 1,0·10⁻⁶ / 670 kV/m.'}),
  num('E0p','E₀ (θετική πολικότητα)','V/m',520e3,{show}),num('Kn','K (αρνητική πολικότητα)','m²/(V²·s)',1.3e-6,{show}),num('E0n','E₀ (αρνητική πολικότητα)','V/m',600e3,{show})];}
 // 5.0.1: the line element with CP data per mode (as the 'CP m-phase' of the EMTP): its parameters, shown only with
 // src = 'modal', and the parameters of the line from geometry hidden then (vtrap and conn stay for both)
 const isModal=p=>p&&p.src==='modal',modal=o=>({...o,show:p=>isModal(p)});
 const TLCP_P=[num('nph','Αγωγοί (φάσεις)','',3,modal({hint:'1 ως 12, ακροδέκτες a, b, c, … όπως η γραμμή από γεωμετρία.'})),
  sel('lu','Μονάδα μήκους',[['km','km'],['m','m']],'km',modal({hint:'Το μήκος, τα R′, L′, C′ ανά μονάδα μήκους και η ταχύτητα σε μονάδες μήκους ανά s, όπως στο EMTP.'})),
  num('mlen','Μήκος (στη μονάδα μήκους)','',100,modal({})),
  sel('mspec','Είδος δεδομένων',[['zv','R′, Z_c, v (ταχύτητα)'],['zt','R′, Z_c, τ (χρόνος διάδοσης όλης της γραμμής)'],['lc','R′, L′, C′']],'zv',modal({})),
  sel('transp','Συνεχής μετάθεση',[['1','Ναι: ρυθμοί γης και εναέριος, T_i του Clarke'],['0','Όχι: ένας ρυθμός ανά αγωγό, T_i από τον χρήστη']],'1',modal({})),
  txt('mdata','Δεδομένα ανά ρυθμό (γραμμές με «;»)','0.25, 650, 2.2e5; 0.03, 280, 2.95e5',modal({hint:'Μία γραμμή ανά ρυθμό, χωρισμένες με «;», με τις τιμές της με κόμματα, στη σειρά του «Είδους δεδομένων» (R′ σε Ω, L′ σε H, C′ σε F ανά μονάδα μήκους· Z_c σε Ω· v σε μονάδες μήκους ανά s· τ σε s). Με συνεχή μετάθεση δύο γραμμές: ο ρυθμός 1 (γης) και ο 2 (εναέριος, ίδιος για τους ρυθμούς 2 ως m). Χωρίς μετάθεση μία γραμμή ανά αγωγό.'})),
  txt('mti','T_i (γραμμές με «;»)','',{show:p=>isModal(p)&&p.transp==='0',hint:'Πραγματικός m × m, γραμμή ανά αγωγό και στήλη ανά ρυθμό, π.χ. από τη «Γραμμή από γεωμετρία» στη συχνότητα των παραμέτρων. Αντιστρέψιμος.'}),
  sel('mloss','Μοντέλο των απωλειών',[['lumped','R/4 – R/2 – R/4 (όπως το EMTP)'],['dl','Χωρίς παραμόρφωση: κάθε κύμα × e^(−R/2Z_c)']],'lumped',modal({}))];
 const TLCP_KEYS=new Set(['src','conn','vtrap',...TLCP_P.map(q=>q.k)]);
 const geoOnly=q=>TLCP_KEYS.has(q.k)?q:{...q,show:p=>!isModal(p)&&(q.show?q.show(p):true)};
 const PARTS={
  R:{name:'Αντίσταση',prefix:'R',group:'Παθητικά',pins:{a:[-30,0],b:[30,0]},box:[-22,-8,44,16],
   params:[num('R','Αντίσταση','Ω',10),txt('sched','R(t)','',{hint:SCHED})],
   value:p=>p.R,unit:'Ω',
   draw:()=>SYM==='iec'?'<path d="M-30,0 H-15 M15,0 H30"/><path d="M-15,-6 H15 V6 H-15 Z"/>':'<path d="M-30,0 H-20 l2.5,-7 5,14 5,-14 5,14 5,-14 5,14 5,-14 5,14 2.5,-7 H30"/>'},
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
   params:[num('Vpk','Πλάτος','V',325),num('f','Συχνότητα','Hz',50),num('phase','Φάση','°',0,{signed:true,zero:true}),num('off','Συνεχής συνιστώσα (DC offset)','V',0,{signed:true,zero:true}),num('Rs','Εσωτερική αντίσταση','Ω',0,{zero:true}),num('Ls','Εσωτερική αυτεπαγωγή','H',0,{zero:true})],
   value:p=>p.Vpk,unit:'V',
   draw:()=>'<path d="M0,-40 V-16 M0,16 V40"/><circle r="16"/><path class="thin" d="M-9,0 c3,-10 6,-10 9,0 c3,10 6,10 9,0"/>'},
  VAC3:{name:'Τριφασική πηγή (Y)',prefix:'V',group:'Πηγές',pins:p=>{const n=neutOf(p,'neut','pin')==='pin'?{n:[0,40]}:{};return isBus(p)?{abc:[40,0],...n}:{a:[40,-20],b:[40,0],c:[40,20],...n};},box:[-20,-30,40,60],
   bus:p=>isBus(p)?{abc:['a','b','c']}:{},
   params:[num('Vpk','Πλάτος φασικής τάσης','V',325,{hint:'Ιδανική πηγή με R και L ανά φάση. Για πηγή με στάθμη βραχυκύκλωσης (S″k, X/R, μηδενική ακολουθία, συντελεστής c του IEC 60909): «Ισοδύναμο δικτύου» στη βιβλιοθήκη, «Δίκτυο και γραμμές» (4.24).'}),num('f','Συχνότητα','Hz',50),num('phase','Φάση της a','°',0,{signed:true,zero:true}),
    sel('seq','Διαδοχή φάσεων',[['abc','a → b → c'],['acb','a → c → b']],'abc'),num('Rs','Αντίσταση ανά φάση','Ω',0,{zero:true}),num('Ls','Αυτεπαγωγή ανά φάση','H',0,{zero:true}),
    ...NEUT('neut','pin',{hint:'Ως την 4.23 πάντα ακροδέκτης n, όπως η πηγή του EMTP.'}),CONN('abc')],
   value:p=>p.Vpk,unit:'V',
   draw:p=>'<rect class="block" x="-20" y="-30" width="40" height="60" rx="6"/>'+(isBus(p)?bl('M20,0 H40'):'<path d="M20,-20 H40 M20,0 H40 M20,20 H40"/>')+(neutOf(p,'neut','pin')==='pin'?'<path d="M0,30 V40"/>':'')+'<path class="thin" d="M-11,-20 c2,-7 5,-7 7,0 c2,7 5,7 7,0 M-11,0 c2,-7 5,-7 7,0 c2,7 5,7 7,0 M-11,20 c2,-7 5,-7 7,0 c2,7 5,7 7,0"/>'},
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
    num('Eon','E_on (ενέργεια έναυσης)','J',0,{zero:true,hint:'Μετρημένη στις V_ref, I_ref. Κλιμακώνεται με |v|·|i| τη στιγμή της μεταγωγής. 0 = χωρίς απώλειες μεταγωγής.'}),num('Eoff','E_off (ενέργεια σβέσης)','J',0,{zero:true}),
    num('Vref','V_ref','V',600,{show:p=>+p.Eon>0||+p.Eoff>0}),num('Iref','I_ref','A',100,{show:p=>+p.Eon>0||+p.Eoff>0})],
   value:()=>null,
   draw:p=>{const gs=p.gate==='sig'?sl('M-14,0 H-20'):'';const d=gs+(p.body?(p.model==='igbt'?'<path class="thin" d="M0,-20 H20 V-5 M0,20 H20 V5 M15,5 H25 M15,-4 H25 L20,5 Z"/>':'<path class="thin" d="M8,-12 H20 V-5 M8,12 H20 V5 M15,5 H25 M15,-4 H25 L20,5 Z"/>'):'');
    return p.model==='igbt'?`<path d="M0,-30 V-14 L8,-8 M8,8 L0,14 V30 M8,-13 V13 M2,-12 V12 M2,0 H-14"/><path class="fill" d="M1.2,14.6 l1.6,-6.2 l4.4,4.4 z"/>${d}`
     :`<path d="M0,-30 V-12 H8 M0,30 V12 H8 M8,-17 V-7 M8,-3 V3 M8,7 V17 M2,-15 V15 M2,0 H-14"/><path class="fill" d="M8,12 l-6,-3.5 v7 z"/>${d}`;}},
  D:{name:'Δίοδος',prefix:'D',group:'Ημιαγωγοί',pins:{a:[-30,0],k:[30,0]},box:[-10,-11,20,22],
   params:[num('Ron','R_on','Ω',1e-3),num('Vf','Τάση κατωφλίου V_f','V',0,{zero:true}),num('Roff','R_off','Ω',1e6)],
   value:()=>null,
   draw:()=>'<path d="M-30,0 H-9 M9,0 H30 M9,-10 V10"/><path class="fill" d="M-9,-10 L9,0 L-9,10 Z"/>'},
  SCR:{name:'Θυρίστορ (SCR)',prefix:'Q',group:'Ημιαγωγοί',pins:{a:[-30,0],k:[30,0]},box:[-10,-11,29,26],
   spins:p=>p.fire==='sig'?{g:I(0,30)}:{},
   params:[sel('fire','Έναυση',[['alpha','Γωνία α ως προς πηγή AC'],['pwm','Από PWM'],['on','Συνεχώς (σαν δίοδος)'],['sig','Από σήμα (ακροδέκτης g, 4.1)']],'alpha',{hint:'Από σήμα: άγει όσο το g ≥ 0,5 και είναι ορθά πολωμένο· όταν το g πέσει, σβήνει στο επόμενο μηδέν του ρεύματος (όπως ένας πόλος διακόπτη ισχύος).'}),
    ref('refsrc','Πηγή αναφοράς',['VAC','VAC3'],{show:p=>p.fire==='alpha',hint:'Η α μετριέται από τη θετική διάβαση από το μηδέν της τάσης αναφοράς (φάση a στην τριφασική).'}),
    num('alpha','Γωνία έναυσης α','°',30,{zero:true,show:p=>p.fire==='alpha'}),
    num('shift','Μετατόπιση','°',0,{signed:true,zero:true,show:p=>p.fire==='alpha',hint:'Προστίθεται στην α: 180° για τα θυρίστορ της αρνητικής ημιπεριόδου, 30° + 60°·k στις τριφασικές γέφυρες.'}),
    num('pw','Διάρκεια παλμού','°',20,{show:p=>p.fire==='alpha'}),num('fref','Συχνότητα (χωρίς πηγή αναφοράς)','Hz',50,{show:p=>p.fire==='alpha'&&!p.refsrc}),
    ref('pwm','Μπλοκ PWM',['PWM'],{show:p=>p.fire==='pwm'}),sel('out','Έξοδος PWM',[['a','g'],['na','ḡ'],['b','g₂'],['nb','ḡ₂']],'a',{show:p=>p.fire==='pwm'}),
    num('Ron','R_on','Ω',1e-3),num('Vf','Τάση κατωφλίου V_f','V',0,{zero:true}),num('Roff','R_off','Ω',1e6),
    num('tq','Χρόνος σβέσης t_q','s',0,{zero:true,hint:'4.16: 0 = ιδανικό. Με t_q > 0 το θυρίστορ που ξαναβρίσκει θετική τάση πριν περάσει το t_q από τη σβέση του ξανανάβει χωρίς παλμό. Μόνο στον λύτη της εφαρμογής.'})],
   value:()=>null,
   draw:p=>'<path d="M-30,0 H-9 M9,0 H30 M9,-10 V10 M9,5 L18,14"/><path class="fill" d="M-9,-10 L9,0 L-9,10 Z"/>'+(p.fire==='sig'?sl('M18,14 V22 H0 V30'):'')},
  XFMR:{name:'Μετασχηματιστής',prefix:'T',group:'Μαγνητικά',pins:{p1:[-30,-30],p2:[-30,30],s1:[30,-30],s2:[30,30]},box:[-20,-26,40,52],
   params:[num('n','Λόγος N₂/N₁','',1),num('Lm','Αυτεπαγωγή μαγνήτισης (πρωτεύον)','H',1e-3),num('im0','Αρχικό ρεύμα μαγνήτισης','A',0,{signed:true,zero:true,show:p=>p.sat!=='sat'}),
    num('Llk1','Σκέδαση πρωτεύοντος L_lk1','H',0,{zero:true,hint:'Σε σειρά με το πρωτεύον, έξω από την L_m. Στο flyback χρειάζεται κύκλωμα clamp (RCD).'}),num('Llk2','Σκέδαση δευτερεύοντος L_lk2','H',0,{zero:true}),
    num('R1','Αντίσταση πρωτεύοντος','Ω',0,{zero:true}),num('R2','Αντίσταση δευτερεύοντος','Ω',0,{zero:true}),
    sel('pol','Πολικότητα',[['same','Τελείες p1 και s1'],['opp','Τελείες p1 και s2 (flyback)']],'same'),
    // 5.0.1 (ROADMAP §56): the saturable core and the place of the magnetizing branch
    sel('mpos','Θέση του κλάδου μαγνήτισης',[['mid','Στη μέση, μετά τη σκέδαση του πρωτεύοντος (όπως ως τώρα)'],['w1','Στους ακροδέκτες του πρωτεύοντος'],['w2','Στους ακροδέκτες του δευτερεύοντος']],'mid',
     {hint:'Με κορεσμό η θέση μετρά: ο κορεσμένος κλάδος έχει αυτεπαγωγή της τάξης της σκέδασης (Part III των IEEE PES TF, σελ. 2052). Στο δευτερεύον η καμπύλη μεταφέρεται με τον λόγο (ψ₂ = n·ψ₁, i₂ = i₁/n).'}),
    sel('sat','Μαγνήτιση',[['lin','Γραμμική L_m (όπως ως τώρα)'],['sat','Με κορεσμό: καμπύλη ψ–i κατά τμήματα']],'lin',{hint:'Με κορεσμό ο κλάδος μαγνήτισης ακολουθεί την καμπύλη ψ–i (στο πρωτεύον) και ο λύτης λύνει με Newton σε κάθε βήμα.'}),
    txt('satTab','Σημεία «ρεύμα: ροή» (A: V·s, στο πρωτεύον)','',{show:p=>p.sat==='sat',hint:'Ο θετικός κλάδος, χωρίς το (0, 0)· η καμπύλη είναι συμμετρική. Κενό: δύο κλίσεις, L_m ως τη ροή του γονάτου και L_air μετά.'}),
    num('psiK','Ροή στο γόνατο ψ_k','V·s',0.01,{show:p=>p.sat==='sat'&&!String(p.satTab??'').trim()}),
    num('Lair','Κλίση μετά το τελευταίο σημείο L_air (πυρήνας αέρα)','H',1e-5,{show:p=>p.sat==='sat',hint:'Η αυτεπαγωγή του κορεσμένου πυρήνα, στο πρωτεύον. Με πίνακα, 0 = συνέχεια του τελευταίου τμήματος.'}),
    num('psi0','Αρχική (παραμένουσα) ροή ψ₀','V·s',0,{signed:true,zero:true,show:p=>p.sat==='sat',hint:'Κρατιέται όσο ο πυρήνας δεν διεγείρεται, και σβήνει σε περίπου μία περίοδο διέγερσης (THEORY §8ΩΖ). 0: αρχή από τη μόνιμη κατάσταση ή από το μηδέν.'})],
   value:p=>p.n,unit:'',
   draw:p=>`<path d="M-30,-30 H-14 V-24 a6,6 0 0,1 0,12 a6,6 0 0,1 0,12 a6,6 0 0,1 0,12 a6,6 0 0,1 0,12 V30 H-30 M30,-30 H14 V-24 a6,6 0 0,0 0,12 a6,6 0 0,0 0,12 a6,6 0 0,0 0,12 a6,6 0 0,0 0,12 V30 H30"/><path class="thin" d="M-3,-26 V26 M3,-26 V26"/><circle class="dot" cx="-20" cy="-26" r="2.6"/><circle class="dot" cx="20" cy="${p.pol==='opp'?26:-26}" r="2.6"/>`},
  // 5.0.1 (ROADMAP §56): a nonlinear inductor, ψ–i piecewise linear (the core of a transformer, a saturable reactor), as the
  // nonlinear inductance of the EMTP-type programs; the state is the flux
  LSAT:{name:'Μη γραμμικό πηνίο (ψ–i)',prefix:'LN',group:'Μαγνητικά',pins:{a:[-30,0],b:[30,0]},box:[-24,-14,48,22],
   params:[txt('tab','Σημεία «ρεύμα: ροή» (A: V·s)','1: 0.1, 10: 0.11',{hint:'Ο θετικός κλάδος, χωρίς το (0, 0)· η καμπύλη είναι συμμετρική, και ρεύμα και ροή αυξάνουν μαζί. Η πρώτη κλίση είναι η ακόρεστη αυτεπαγωγή.'}),
    num('Lair','Κλίση μετά το τελευταίο σημείο L_air','H',1e-3,{zero:true,hint:'0 = συνέχεια του τελευταίου τμήματος (όπως το EMTP).'}),
    sel('init','Αρχή',[['ss','Στη μόνιμη κατάσταση γραμμικό, με την πρώτη κλίση'],['psi0','Από τη ροή ψ₀ (έξω από τη μόνιμη κατάσταση)']],'ss',{hint:'Η μόνιμη κατάσταση μετρά μόνο όταν το κύκλωμα ξεκινά από φασιθέτες (Ρυθμίσεις επίλυσης → Αρχή). Χωρίς αυτήν το πηνίο ξεκινά από ψ = 0.'}),
    num('psi0','Αρχική ροή ψ₀','V·s',0,{signed:true,zero:true,show:p=>p.init==='psi0',hint:'Κρατιέται χωρίς ρεύμα όσο το πηνίο δεν διεγείρεται, και σβήνει σε περίπου μία περίοδο διέγερσης (THEORY §8ΩΖ).'})],
   value:p=>p.Lair,unit:'H',
   draw:()=>'<path d="M-30,0 H-24 a6,6 0 0,1 12,0 a6,6 0 0,1 12,0 a6,6 0 0,1 12,0 a6,6 0 0,1 12,0 H30"/><path class="thin" d="M-18,10 L-8,10 L8,-10 L18,-10"/>'},
  // lightning current (3.5): Heidler or double exponential, IEC 62305-1 waveforms or fitted to a front/tail time
  ILG:{name:'Κεραυνικό ρεύμα (Heidler)',prefix:'I',group:'Πηγές',pins:{p:[0,-40],n:[0,40]},box:[-17,-17,34,34],
   params:[sel('shape','Κυματομορφή',[['10/350','10/350 μs: πρώτο θετικό πλήγμα (IEC 62305-1)'],['1/200','1/200 μs: πρώτο αρνητικό πλήγμα'],['0.25/100','0,25/100 μs: επόμενο αρνητικό πλήγμα'],['custom','Άλλη T1/T2 (προσαρμογή των τ₁, τ₂)'],['direct','Παράμετροι τ₁, τ₂, η (π.χ. από εργαλείο)']],'10/350',
     {hint:'Heidler: i(t) = (I₀/η)·(t/τ₁)ⁿ/(1 + (t/τ₁)ⁿ)·e^(−t/τ₂). Οι τρεις τυπικές με τα τ₁, τ₂, η του IEC 62305-1 (n = 10). T1 = 1,25·(t₉₀ − t₁₀), T2 από την εικονική αρχή ως το 50 % στην ουρά.'}),
    num('Ipk','Μέγιστο ρεύμα I₀ (βγαίνει από το p)','A',200e3,{signed:true}),
    sel('model','Μοντέλο',[['heidler','Heidler'],['dexp','Διπλοεκθετικό: I₀/η·(e^(−t/τ₂) − e^(−t/τ₁))']],'heidler',{show:p=>p.shape==='custom'||p.shape==='direct'}),
    num('tau1','τ₁','s',1.83192713504729e-6,{show:p=>p.shape==='direct',hint:'i(t) = (I₀/η)·(t/τ₁)ⁿ/(1 + (t/τ₁)ⁿ)·e^(−t/τ₂), όπως το Lightning Impulse Manager. Με η = μέγιστο της μορφής (AutoH) η κορυφή είναι I₀· με άλλο η (FixedH) είναι I₀·max/η.'}),
    num('tau2','τ₂','s',284.843991112265e-6,{show:p=>p.shape==='direct'}),num('eta','η','',0.986296525678929,{show:p=>p.shape==='direct'}),
    num('T1','Χρόνος μετώπου T1','s',1.2e-6,{show:p=>p.shape==='custom'}),num('T2','Χρόνος ημίσεος T2','s',50e-6,{show:p=>p.shape==='custom'}),num('n','Εκθέτης n (Heidler)','',10,{show:p=>(p.shape==='custom'||p.shape==='direct')&&p.model!=='dexp'}),
    num('t0','Καθυστέρηση','s',0,{zero:true})],
   value:p=>p.Ipk,unit:'A',
   draw:()=>'<path d="M0,-40 V-16 M0,16 V40"/><circle r="16"/><path class="thin" d="M3,-11 L-4,1 L2,1 L-3,11 M-3,11 L-4,5 M-3,11 L1,7"/>'},
  // multiport elements (3.5): N windings or ports, one above the other, a_k on the left and b_k on the right (dots at a_k)
  // impulse voltage (3.8): double exponential v = (V₀/η)·(e^(−t/τ₂) − e^(−t/τ₁)), IEC 60060-1 times
  VIMP:{name:'Κρουστική τάση (1,2/50, 250/2500)',prefix:'V',group:'Πηγές',pins:{p:[0,-40],n:[0,40]},box:[-17,-17,34,34],
   params:[sel('shape','Κυματομορφή',[['1.2/50','1,2/50 μs: κεραυνική (LI)'],['170/2500','170/2500 μs: χειρισμών (SI, T1 30–90 %)'],['250/2500','250/2500 μs: χειρισμών (SI, χρόνος κορυφής)'],['custom','Άλλη (προσαρμογή των τ₁, τ₂)'],['direct','Παράμετροι α, β, K (π.χ. από εργαλείο)'],['ramp','Ράμπα με κλίση S ως τη V₀']],'1.2/50',
     {hint:'v(t) = (V₀/η)·(e^(−t/τ₂) − e^(−t/τ₁)), κορυφή V₀. IEC 60060-1: T1 = 1,67·(t₉₀ − t₃₀), T2 από την εικονική αρχή t₃₀ − 0,3·T1 ως το 50 % στην ουρά. Για 250/2500: χρόνος κορυφής T_p και T2 από το t = 0.'}),
    num('Vpk','Μέγιστη τάση V₀','V',100e3,{signed:true}),
    sel('basis','Ορισμός χρόνων',[['iec','T1 (30–90 %) και T2 από την εικονική αρχή'],['tp','T_p (χρόνος κορυφής) και T2 από το t = 0']],'iec',{show:p=>p.shape==='custom'}),
    num('T1','Χρόνος μετώπου T1 ή T_p','s',1.2e-6,{show:p=>p.shape==='custom'}),num('T2','Χρόνος ημίσεος T2','s',50e-6,{show:p=>p.shape==='custom'}),
    num('S','Κλίση μετώπου S','V/s',1e12,{show:p=>p.shape==='ramp'}),
    num('alpha','α (ουρά)','1/s',14659.1086811327,{show:p=>p.shape==='direct',hint:'v(t) = V₀·K·(e^(−αt) − e^(−βt)), όπως το Voltage Impulse GUI. Η κορυφή είναι V₀ όταν K = 1/max(e^(−αt) − e^(−βt)).'}),
    num('beta','β (μέτωπο)','1/s',2468926.6530487,{show:p=>p.shape==='direct'}),num('K','K','',1.03725220061775,{show:p=>p.shape==='direct'}),
    num('Rs','Εσωτερική αντίσταση','Ω',0,{zero:true,hint:'Π.χ. Z της γραμμής: «προσπίπτον κύμα πίσω από Z».'}),num('t0','Καθυστέρηση','s',0,{zero:true})],
   value:p=>p.Vpk,unit:'V',
   draw:()=>'<path d="M0,-40 V-16 M0,16 V40"/><circle r="16"/><path class="thin" d="M-8,7 L-5,-8 C-2,-8 0,4 9,6"/><path class="thin" d="M-5,-12 H5"/>'},
  // transmission line (3.8): lossless, Bergeron / Dommel. At each end i = v/Z + I_h, I_h(t) = −(v/Z + i) of the other end at t − τ
  TL:{name:'Γραμμή μεταφοράς (οδεύοντα κύματα)',prefix:'TL',group:'Παθητικά',pins:{a1:[-60,-20],b1:[-60,20],a2:[60,-20],b2:[60,20]},box:[-45,-26,90,52],
   params:[sel('spec','Δεδομένα',[['zt','Z και χρόνος διάδοσης τ'],['zl','Z, μήκος και ταχύτητα'],['lc','L′, C′ ανά μέτρο και μήκος'],['coax','Ομοαξονική: ζυγός GIS ή καλώδιο (D, d, ε_r)']],'zt',{hint:'Γραμμή χωρίς απώλειες. Ο ένας αγωγός από a1 σε a2, ο άλλος (ή η γη) από b1 σε b2. Το βήμα του λύτη μένει ≤ τ. Ομοαξονική (4.22): Z = 60·ln(D/d)/√ε_r και ταχύτητα k·c/√ε_r.'}),
    num('Z','Κυματική αντίσταση Z','Ω',400,{show:p=>p.spec!=='lc'&&p.spec!=='coax'}),
    num('Dco','Εσωτερική διάμετρος του περιβλήματος D','m',.5,{show:p=>p.spec==='coax',hint:'Ζυγός GIS 420 kV: περίπου 0,4–0,6 m.'}),num('dco','Διάμετρος του αγωγού d','m',.15,{show:p=>p.spec==='coax'}),
    num('erco','Σχετική διηλεκτρική σταθερά ε_r','',1,{show:p=>p.spec==='coax',hint:'SF6 ≈ 1, καλώδιο XLPE ≈ 2,3.'}),num('kv','Συντελεστής ταχύτητας k','',.96,{show:p=>p.spec==='coax',hint:'Με τους αποστάτες η ταχύτητα σε ζυγό GIS είναι περίπου 0,95–0,98 της ταχύτητας του φωτός.'}),num('tau','Χρόνος διάδοσης τ','s',10e-6,{show:p=>p.spec==='zt'}),
    num('len','Μήκος','m',3000,{show:p=>p.spec!=='zt'}),num('vel','Ταχύτητα διάδοσης','m/s',3e8,{show:p=>p.spec==='zl',hint:'Εναέρια γραμμή περίπου 3·10⁸ m/s, καλώδιο c/√ε_r.'}),
    num('Lp','Αυτεπαγωγή ανά μέτρο L′','H/m',1.333e-6,{show:p=>p.spec==='lc'}),num('Cp','Χωρητικότητα ανά μέτρο C′','F/m',8.333e-12,{show:p=>p.spec==='lc'}),
    num('Rt','Αντίσταση σειράς όλης της γραμμής R','Ω',0,{show:p=>p.spec==='zt',hint:'Απώλειες (3.11): η R μπαίνει συγκεντρωμένη, R/4 στα άκρα και R/2 στη μέση κάθε τμήματος (Dommel). Το μέτωπο σβήνει περίπου ως e^(−R/(2Z)). 0 = χωρίς απώλειες.'}),
    num('Rp','Αντίσταση σειράς ανά μέτρο R′','Ω/m',0,{show:p=>p.spec!=='zt',hint:'Απώλειες (3.11): R = R′·μήκος, συγκεντρωμένη R/4 στα άκρα και R/2 στη μέση κάθε τμήματος (Dommel). Το μέτωπο σβήνει περίπου ως e^(−R′x/(2Z)). 0 = χωρίς απώλειες.'}),
    sel('loss','Μοντέλο των απωλειών',[['lumped','Συγκεντρωμένες: R/4 – R/2 – R/4 σε κάθε τμήμα (Dommel)'],['dl','Χωρίς παραμόρφωση: κάθε κύμα που φτάνει × e^(−R/2Z)']],'lumped',{show:p=>parseEng(p.spec==='zt'?p.Rt:p.Rp)>0,hint:'5.0.1: όπως το «Distortionless» του CP του EMTP (και το «χωρίς παραμόρφωση» της «Γραμμής από γεωμετρία»): η γραμμή χωρίς απώλειες, και κάθε κύμα που φτάνει στο άλλο άκρο πολλαπλασιάζεται με e^(−R/2Z), ένα τμήμα. Η κυματομορφή δεν παραμορφώνεται, μόνο μικραίνει (THEORY §8ΩΖ.10).'}),
    num('nsec','Τμήματα για τις απώλειες','',1,{show:p=>parseEng(p.spec==='zt'?p.Rt:p.Rp)>0&&p.loss!=='dl',hint:'Η γραμμή χωρίζεται σε N ίσα τμήματα, το καθένα με R/N. Με R/(4N) ≪ Z το μοντέλο πλησιάζει την κατανεμημένη γραμμή. Το βήμα του λύτη μένει ≤ τ/N.'}),
    num('v0','Αρχική τάση (παγιδευμένο φορτίο)','V',0,{signed:true,zero:true,hint:'4.22: η γραμμή ξεκινά με τάση v₀ σε όλο το μήκος της και χωρίς ρεύμα, π.χ. το φορτίο που μένει σε ζυγό GIS μετά από το άνοιγμα ενός αποζεύκτη. 0 = χωρίς τάση.'})],
   value:p=>p.spec==='coax'?tlParams(p).Z:p.Z,unit:'Ω',
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
   params:[sel('vt','Διάσπαση',[['inst','Ακαριαία στο U_b'],['de','Με καμπύλη τάσης–χρόνου (U₀, k, D)'],['lpm','Πρόοδος οχετού (LPM)']],'inst',{hint:'Καμπύλη τάσης–χρόνου (3.11): κλείνει όταν ∫ (|v| − U₀)^k dt, πάνω από το U₀, φτάσει το D (disruptive effect). k = 0: σταθερή καθυστέρηση D δευτερόλεπτα πάνω από το U₀. k = 1: νόμος ίσων επιφανειών (Kind).'}),
    num('Ub','Τάση διάσπασης U_b','V',100e3,{show:p=>p.vt!=='de',hint:'Κλείνει όταν |v| ≥ U_b, με οποιαδήποτε πολικότητα. Χωρίς καθυστέρηση διάσπασης.'}),
    num('U0','Τάση έναρξης U₀','V',80e3,{show:p=>p.vt==='de',hint:'Κάτω από το U₀ δεν διασπάται ποτέ (η στατική τάση διάσπασης). Όταν η τάση πέσει κάτω από το U₀, το ολοκλήρωμα μηδενίζεται.'}),
    num('kde','Εκθέτης k','',1,{show:p=>p.vt==='de'}),
    num('Dde','Σταθερά D','V^k·s',5e-3,{show:p=>p.vt==='de',hint:'Σε V^k·s: με k = 1 σε V·s (5·10⁻³ V·s = 5 kV·μs), με k = 0 σε s. Με ράμπα S διασπάται στο U₀ + ((k+1)·D·S^k)^(1/(k+1)).'}),
    ...LPM_PARAMS(p=>p.vt==='lpm'),
    txt('trig','Έναυση (trigatron) τη στιγμή','',{hint:'Π.χ. «2u». Κλείνει τότε όποια κι αν είναι η τάση, μία φορά. Κενό: μόνο με την τάση διάσπασης.'}),
    num('Rarc','Αντίσταση τόξου','Ω',.1),
    sel('ext','Σβήνει',[['zero','Στον μηδενισμό του ρεύματος'],['iext','Όταν |i| < I_ext'],['never','Ποτέ (μένει κλειστός)']],'zero',{hint:'Μετά τη σβέση ξανακλείνει αν η τάση ξεπεράσει πάλι το U_b.'}),
    num('Iext','Ρεύμα σβέσης I_ext','A',1,{show:p=>p.ext==='iext'}),
    num('Roff','R_off (ανοιχτός)','Ω',1e10)],
   value:p=>p.vt==='de'?p.U0:p.vt==='lpm'?parseEng(p.E50)*parseEng(p.gl):p.Ub,unit:'V',
   draw:p=>'<path d="M-30,0 H-11 M11,0 H30"/><circle cx="-6.5" cy="0" r="4.5"/><circle cx="6.5" cy="0" r="4.5"/>'+(String(p.trig||'').trim()?'<path class="thin" d="M0,10 V4 M-3,7 L0,4 L3,7"/>':'')},
  // 4.22: a disconnector of a GIS: the gap between its contacts closes (or opens) over the travel T_s, so its breakdown
  // voltage goes linearly from U_m to zero (or from zero to U_m); every breakdown is a spark that goes out when its current
  // falls below I_ext (or at a current zero), and strikes again when the voltage across reaches U_b(t) again
  DS:{name:'Αποζεύκτης με επαναναύσεις (GIS)',prefix:'DS',group:'Δίκτυο',pins:{a:[-30,0],b:[30,0]},box:[-16,-14,32,24],
   params:[sel('op','Χειρισμός',[['close','Κλείσιμο'],['open','Άνοιγμα']],'close',{hint:'Κλείσιμο: ανοιχτός ως το t₀, οι επαφές πλησιάζουν για T_s και ακουμπούν στο t₀ + T_s. Άνοιγμα: κλειστός ως το t₀, μετά οι επαφές απομακρύνονται.'}),
    num('t0','Έναρξη της κίνησης t₀','s',1e-3,{zero:true}),num('Ts','Χρόνος κίνησης T_s','s',.05,{hint:'Ως τη στιγμή που οι επαφές ακουμπούν (ή ως την πλήρη απόσταση). Πραγματικοί αποζεύκτες: δεκάδες ms ως μερικά s.'}),
    num('Um','Τάση διάσπασης στην πλήρη απόσταση U_m','V',1e6,{hint:'Η τάση διάσπασης πέφτει γραμμικά από U_m στο μηδέν όσο κλείνουν οι επαφές (ή ανεβαίνει από το μηδέν στο U_m όσο ανοίγουν).'}),
    num('Rarc','Αντίσταση σπινθήρα','Ω',1),
    sel('ext','Ο σπινθήρας σβήνει',[['iext','Όταν |i| < I_ext (το υψίσυχνο ρεύμα έχει σβήσει)'],['zero','Στον πρώτο μηδενισμό του ρεύματος']],'iext'),
    num('Iext','Ρεύμα σβέσης I_ext','A',1,{show:p=>p.ext!=='zero'}),num('Roff','R_off (ανοιχτός)','Ω',1e10)],
   value:p=>p.Um,unit:'V',
   draw:p=>'<path d="M-30,0 H-13 M13,0 H30"/><path d="M-13,0 L9,-11"/><circle cx="13" cy="0" r="2.5"/><path class="thin" d="M-4,8 h8 M-1,11 h2" />'+tx(p&&p.op==='open'?'↗':'↘',0,-8,'bsm')},
  CPL:{name:'Φορτίο σταθερής ισχύος',prefix:'P',group:'Φορτία',pins:{p:[0,-30],n:[0,30]},box:[-12,-17,24,34],
   params:[num('P','Ισχύς','W',1000,{signed:true}),num('Vmin','Τάση κάτω από την οποία γίνεται ωμικό','V',5),txt('sched','P(t)','',{hint:SCHED})],
   value:p=>p.P,unit:'W',
   draw:()=>'<path d="M0,-30 V-16 M0,16 V30"/><rect x="-11" y="-16" width="22" height="32" rx="2"/><path class="thin" d="M-4,6 V-6 h5 a3.5,3.5 0 0,1 0,7 h-5"/>'},
  SH:{name:'Δειγματοληψία και συγκράτηση (S&H)',prefix:'SH',group:'Έλεγχος',pins:{},box:[-30,-18,60,36],
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
    sel('mode','Τρόπος',[['fixed','Σταθερό D (ανοικτός βρόχος)'],['pi','Βρόχος PI / PID'],['spwm','Ημιτονοειδές SPWM'],['pp','Δύο εξόδων (πλήρης γέφυρα)'],['ext','D από σήμα (ακροδέκτης d)']],'fixed',{hint:'Με «D από σήμα» ο λόγος κατάτμησης διαβάζεται από τον ακροδέκτη d στα σημεία ενημέρωσης (αρχή περιόδου, και στο μέσο με διπλή ενημέρωση).'}),
    num('D','Λόγος κατάτμησης D','',0.5,{zero:true,show:p=>p.mode==='fixed'||p.mode==='pp'}),
    txt('dsched','D(t)','',{hint:SCHED+' Για παλμό ΔD: 0:0.5, 0.001:0.55, 0.0028:0.5',show:p=>p.mode==='fixed'}),
    sel('carrier','Φορέας',[['triangle','Τριγωνικός (συμμετρικός)'],['saw','Πριονωτός (ON πρώτα)']],'triangle',{show:p=>p.mode!=='spwm'&&p.mode!=='pp'}),
    num('phase','Μετατόπιση φορέα','°',0,{signed:true,zero:true}),
    sel('upd','Ενημέρωση του D',[['single','Μία φορά ανά περίοδο (στην αρχή)'],['double','Δύο φορές: και στο ελάχιστο του τριγώνου']],'single',{show:p=>(p.mode==='fixed'||p.mode==='pi'||p.mode==='ext')&&p.carrier!=='saw',hint:'Με δύο ενημερώσεις η ακμή ανάμματος χρησιμοποιεί το D της αρχής της περιόδου και η ακμή σβησίματος το D του μέσου. Ο PI τρέχει με T_s = T/2.'}),
    num('dt','Νεκρός χρόνος','s',0,{zero:true,hint:'Καθυστερεί το άνοιγμα κάθε εξόδου (g, ḡ, g₂, ḡ₂). Στο διάστημα αυτό το ρεύμα περνά από τις διόδους.'}),
    ref('sensor','Μετρούμενο στοιχείο',['L','R','C','VDC','CPL','SW','D','SCR','XFMR','IDC','VAC','VAC3','SH'],{show:p=>p.mode==='pi',hint:'Με μπλοκ S&H ο ελεγκτής διαβάζει την κρατημένη τιμή του, δηλαδή το τελευταίο δείγμα.'}),
    sel('qty','Μέγεθος',[['I','Ρεύμα'],['V','Τάση']],'I',{show:p=>p.mode==='pi'}),
    txt('ref','Αναφορά (τιμή ή πρόγραμμα)','0',{hint:'Σταθερή τιμή ή «t:τιμή», π.χ. 0:-800, 0.003:800',show:p=>p.mode==='pi'}),
    // 4.17: the gains from the circuit (tune.js): the converter is recognised, its elements fill a list of roles that the
    // user may change, and K_p, K_i (K_d, T_f) and D₀ are computed again whenever the circuit changes
    sel('gain','Κέρδη',[['manual','Χειροκίνητα (K_p, K_i, K_d)'],['auto','Από το κύκλωμα (μέσο μοντέλο)']],'manual',{show:p=>p.mode==='pi',hint:'4.17: με «Από το κύκλωμα» αναγνωρίζεται ο μετατροπέας (buck, boost, buck–boost, Ćuk, SEPIC) και από τα στοιχεία της λίστας ρόλων υπολογίζονται το G(s) = ∂(μέτρηση)/∂d, το πρόσημό του και τα κέρδη με τα περιθώρια. Ξαναϋπολογίζονται σε κάθε αλλαγή του κυκλώματος.'}),
    sel('ctl','Ελεγκτής',[['pi','PI'],['pid','PID (διπλό μηδενικό)']],'pi',{show:p=>p.mode==='pi'&&p.gain==='auto'}),
    sel('topo','Τοπολογία',[['auto','Αναγνώριση από το κύκλωμα'],['buck','Buck'],['boost','Boost'],['buck_boost','Buck–boost'],['cuk','Ćuk'],['sepic','SEPIC']],'auto',{show:p=>p.mode==='pi'&&p.gain==='auto'}),
    ref('rVin','Ρόλος V_in',['VDC'],{show:p=>p.mode==='pi'&&p.gain==='auto',hint:'Κενό: από την αναγνώριση. Διάλεξε άλλο στοιχείο για να το βάλεις στον ρόλο.'}),
    ref('rL1','Ρόλος L1',['L'],{show:p=>p.mode==='pi'&&p.gain==='auto'}),
    ref('rC1','Ρόλος C1 (εξόδου στα buck, boost, buck–boost· σύζευξης στα Ćuk, SEPIC)',['C'],{show:p=>p.mode==='pi'&&p.gain==='auto'}),
    ref('rL2','Ρόλος L2 (Ćuk, SEPIC)',['L'],{show:p=>p.mode==='pi'&&p.gain==='auto'&&!['buck','boost','buck_boost'].includes(p.topo)}),
    ref('rC2','Ρόλος C2 εξόδου (Ćuk, SEPIC)',['C'],{show:p=>p.mode==='pi'&&p.gain==='auto'&&!['buck','boost','buck_boost'].includes(p.topo)}),
    ref('rR','Ρόλος R φορτίου',['R'],{show:p=>p.mode==='pi'&&p.gain==='auto'}),
    num('fc','Στόχος f_c (0 = η μεγαλύτερη με τα περιθώρια)','Hz',0,{zero:true,show:p=>p.mode==='pi'&&p.gain==='auto'}),
    num('pm','Περιθώριο φάσης','°',50,{show:p=>p.mode==='pi'&&p.gain==='auto',hint:'Μαζί: περιθώριο κέρδους 6 dB, μέγιστη ευαισθησία 2, μία διέλευση, f_c ≤ f_s/10.'}),
    num('Kp','K_p','',1e-3,{zero:true,signed:true,show:p=>p.mode==='pi'&&p.gain!=='auto'}),num('Ki','K_i','1/s',1,{zero:true,signed:true,show:p=>p.mode==='pi'&&p.gain!=='auto'}),num('Kd','K_d (0 = PI)','s',0,{zero:true,signed:true,show:p=>p.mode==='pi'&&p.gain!=='auto',hint:'d = D₀ + K_p·e + K_i·T_s·Σe + K_d·de/dt, με δειγματοληψία μία φορά ανά περίοδο. Σε μετατροπέα που αντιστρέφει (buck–boost, Ćuk) τα κέρδη είναι αρνητικά.'}),num('Tf','Φίλτρο παραγώγου T_f','s',0,{zero:true,show:p=>p.mode==='pi'&&p.gain!=='auto'&&+p.Kd!==0,hint:'Πρώτης τάξης φίλτρο στον παράγωγο όρο, π.χ. 2·T_s. 0 = χωρίς φίλτρο.'}),
    sel('ff','Πρόσθια τροφοδότηση (feedforward)',[['none','Χωρίς'],['ratio','D₀ = 1 − V(A)/V(B)'],['const','Σταθερό D₀'],['conv','Μέθοδος σύγκλισης (πηγή του Θάνου)']],'none',{show:p=>p.mode==='pi'}),
    // 4.17.4 (ROADMAP §64): the convergence method: D′ = (1 − s)·D + s·M⁻¹(M(D)·|r|/|y|), s = min(1, k·|r − y|/|r|), every N periods
    num('kc','Συντελεστής προσαρμογής k','',1,{show:p=>p.mode==='pi'&&p.ff==='conv',hint:'s = min(1, k·|r − y|/|r|): με k = 1 όπως στην πηγή· μεγαλύτερο k, γρηγορότερη σύγκλιση.'}),
    num('convN','Κάθε N περιόδους (0: αυτόματα)','',0,{zero:true,show:p=>p.mode==='pi'&&p.ff==='conv',hint:'Η διόρθωση του D κάθε N περιόδους μεταγωγής, με τη μέση τιμή της εξόδου σε αυτές· 0: μία περίοδος του πιο αργού ταλαντευόμενου ρυθμού του μέσου μοντέλου, ώστε η μέση τιμή να είναι κοντά εκεί που κάθεται η έξοδος.'}),
    ref('ffA','V(A)',['VDC','C','CPL','R','VAC'],{show:p=>p.mode==='pi'&&p.ff==='ratio'}),ref('ffB','V(B)',['VDC','C','CPL','R','VAC'],{show:p=>p.mode==='pi'&&p.ff==='ratio'}),
    num('D0','D₀','',0.5,{zero:true,show:p=>p.mode==='pi'&&p.ff==='const'&&p.gain!=='auto'}),
    num('dmin','D_min','',0.01,{zero:true,show:p=>p.mode==='pi'}),num('dmax','D_max','',0.99,{show:p=>p.mode==='pi'}),
    num('m','Δείκτης διαμόρφωσης m','',0.8,{show:p=>p.mode==='spwm'}),num('fref','Συχνότητα αναφοράς','Hz',50,{show:p=>p.mode==='spwm'}),
    num('refphase','Φάση αναφοράς','°',0,{signed:true,zero:true,show:p=>p.mode==='spwm'})],
   value:p=>p.fs,unit:'Hz',
   draw:p=>'<rect class="block" x="-34" y="-20" width="68" height="40" rx="6"/><path class="thin" d="M-24,8 L-14,-8 L-4,8 L6,-8 L16,8 L24,-4"/><path class="thin accent" d="M-26,-2 H26"/>'+(p.mode==='ext'?sl('M-40,0 H-34'):'')},
  // ---------------------------------------------------------------- machines (3.1)
  DCM:{name:'Μηχανή ΣΡ (ανεξάρτητη διέγερση)',prefix:'M',group:'Μηχανές',pins:{a:[0,-40],b:[0,40]},box:[-20,-20,40,40],lbl:'left',
   machine:{kind:'dc',speed:'w',torque:'te',load:{param:'load',sig:'tl',sched:'TL'},inertia:'J',supply:'τάση τυμπάνου (τσόπερ ή γέφυρα, εδώ μέση τιμή)'},
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
   params:[ref('src','Στοιχείο',['L','R','C','VDC','CPL','SW','D','SCR','XFMR','IDC','VAC','VAC3']),sel('qty','Μέγεθος',[['I','Ρεύμα'],['V','Τάση'],['E','Ενέργεια μεταγωγής (από την αρχή, J)']],'I',
    {hint:'4.19.6: η ενέργεια μεταγωγής ενός διακόπτη με E_on, E_off, αθροισμένη από το t = 0· ανεβαίνει με βήμα σε κάθε μεταγωγή. Με το μπλοκ «Περιοδικός μέσος παλμών» γίνεται ισχύς απωλειών μεταγωγής ανά περίοδο.'})],value:()=>null,
   draw:p=>sb(60,26)+tx(`${p.qty==='V'?'v':p.qty==='E'?'E_sw':'i'}(${xe(p.src||'?')})`)+sl('M30,0 H40')},
  CONST:{name:'Σταθερά / πρόγραμμα',prefix:'K',group:'Σήματα',pins:{},spins:{y:O(30,0)},box:[-20,-12,40,24],blk:true,
   params:[txt('v','Τιμή ή πρόγραμμα','1',{hint:'Σταθερή τιμή ή «t:τιμή», π.χ. 0:5, 0.002:10. Αλλάζει και εν κινήσει από τις ζωντανές παραμέτρους.'}),
    txt('unit','Μονάδα (προαιρετικά)','',{hint:'π.χ. A για αναφορά ρεύματος, rad/s για ταχύτητα. Ελέγχεται στις συνδέσεις και φαίνεται στα scopes (3.19).'}),
    // 4.17.1 (§59): a constant as an input of the circuit: in the parameters of the circuit with its explanation, and by its
    // name in the parameters «= …» of other parts and in the expression blocks
    bool('input','Είσοδος του κυκλώματος (4.17.1)',false,{hint:'Η τιμή φαίνεται στις παραμέτρους του κυκλώματος (όταν δεν έχεις διαλέξει στοιχείο) μαζί με την εξήγηση, και χρησιμοποιείται με το όνομά της σε παραμέτρους «= …» άλλων στοιχείων και σε μπλοκ έκφρασης.'}),
    txt('name','Όνομα εισόδου','',{show:p=>p.input===true||p.input==='1'||p.input==='true',hint:'Λατινικά γράμματα, ψηφία και _, π.χ. m, Crr, V_in. Κενό: το όνομα του στοιχείου.'}),
    txt('desc','Εξήγηση','',{show:p=>p.input===true||p.input==='1'||p.input==='true',hint:'Τι είναι η είσοδος (φαίνεται δίπλα της στις παραμέτρους του κυκλώματος).'})],value:()=>null,
   draw:p=>sb(40,24)+tx(String(p.v).includes(':')?'c(t)':xe(String(p.v).slice(0,6)))+sl('M20,0 H30')},
  GAIN:{name:'Κέρδος',prefix:'GN',group:'Σήματα',pins:{},spins:{u:I(-30,0),y:O(30,0)},box:[-20,-15,40,30],blk:true,params:[num('K','Κέρδος K','',1,{signed:true,zero:true}),txt('unit','Μονάδα εξόδου','',{hint:'Κενό: άγνωστη (ταιριάζει με όλα). «=»: ίδια με την είσοδο (αδιάστατο K). «·Ω» ή «/V»: η μονάδα της εισόδου επί ή διά μια μονάδα (4.0). Ή η μονάδα της εξόδου, π.χ. V για ω·L·i (3.19).'})],value:()=>null,
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
    num('y0','Σταθερός όρος (πρόσθια τροφοδότηση)','',0,{signed:true,zero:true}),
    sel('aw','Anti-windup',[['clamp','Όρια στην έξοδο του PI'],['track','Back-calculation: είσοδος tr = u_sat − u']],'clamp',{hint:'Back-calculation: dx_i/dt = K_i·(e + tr/K_p), με tr = κορεσμένη έξοδος − έξοδος πριν από τον κορεσμό (σταθερά παρακολούθησης T_t = K_p/K_i). Χρήσιμο όταν ο κορεσμός γίνεται πιο κάτω, μετά από πρόσθια τροφοδότηση ή ενεργή απόσβεση. Η είσοδος tr διαβάζεται μετά τον υπολογισμό, άρα δεν κάνει αλγεβρικό βρόχο.'}),
    num('ymin','Κάτω όριο εξόδου','',0,{signed:true,zero:true,show:p=>p.aw!=='track'}),num('ymax','Άνω όριο εξόδου','',1,{signed:true,zero:true,show:p=>p.aw!=='track'})],value:()=>null,
   draw:p=>sb(40,30)+tx('PI',0,5)+sl('M-30,0 H-20 M20,0 H30')+(p.aw==='track'?sl('M0,15 V30'):'')},
  UD:{name:'Καθυστέρηση z⁻¹',prefix:'Z',group:'Σήματα',pins:{},spins:{u:I(-30,0),y:O(30,0)},box:[-20,-15,40,30],blk:true,
   params:[CLOCK(),TRIG,num('y0','Αρχική έξοδος','',0,{signed:true,zero:true})],value:()=>null,
   draw:()=>sb(40,30)+tx('z⁻¹',0,5)+sl('M-30,0 H-20 M20,0 H30')},
  SR:{name:'Μανδαλωτής SR (latch)',prefix:'SR',group:'Σήματα',pins:{},spins:{s:I(-30,-10),r:I(-30,10),q:O(30,-10),nq:O(30,10)},box:[-20,-20,40,40],blk:true,
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
  // 4.7: a multilayer perceptron with fixed weights or learning inside the simulation (web/studio/nn.js)
  // 4.8 (ROADMAP §46): one control loop with a learning network, as a library part (netlib.js aicDef: PI, network,
  // emulator); its façade over the drawing (watch.js facade) changes scheme, mode, target and learning while it runs
  AIC:{name:'Ελεγκτής AI (βρόχος με νευρωνικό)',prefix:'C',group:'Έλεγχος',pins:{},spins:p=>({r:I(-40,-20),y:I(-40,20),u:O(40,-30),L:O(40,-10),iae:O(40,10),sat:O(40,30),...(p.scheme==='emu'?{yd:O(0,-50)}:{})}),box:[-30,-40,60,80],blk:true,
   params:[sel('scheme','Σχήμα',[['pi','Μόνο PI'],['fel','PI + νευρωνικό που μαθαίνει online (feedback-error learning)'],['fel2','PI + νευρωνικό που μαθαίνει χωρίς εκτροπή (παράγοντας προσαρμογής)'],['inv','PI + αντίστροφο μοντέλο (σταθερά βάρη)'],['emu','PI + αντίστροφο μέσω εξομοιωτή (δύο αντίγραφα)']],'fel'),
    sel('mode','Αναφορά',[['ref','Από την είσοδο r'],['live','Ζωντανός στόχος (παράμετρος «Στόχος»)']],'ref',{hint:'«Ζωντανός στόχος»: η αναφορά είναι η παράμετρος «Στόχος», που αλλάζει την ώρα που τρέχει (ρυθμιστής στην πρόσοψη).'}),
    num('target','Στόχος','',100,{signed:true,zero:true,show:p=>p.mode==='live'}),
    bool('learn','Μαθαίνει (keep learning)',true,{hint:'Κλειστό: τα βάρη μένουν όπως είναι. Αλλάζει και την ώρα της προσομοίωσης.'}),
    num('fs','Συχνότητα δειγματοληψίας','Hz',1000),num('fr','Εύρος του φίλτρου αναφοράς','Hz',5,{hint:'Η αναφορά περνά από βαθυπερατό: r_f και η παράγωγός της ṙ_f είναι οι είσοδοι του δικτύου.'}),
    num('ka','Συντελεστής προσαρμογής k','',10,{show:p=>p.scheme==='fel2',hint:'4.17.4 (ROADMAP §62): το σήμα μάθησης επί s = min(1, k·|e|/max(|r_f|, κλίμακα/20)): η μάθηση σβήνει όσο το σφάλμα παρακολούθησης πάει στο μηδέν, και τα βάρη δεν εκτρέπονται (πηγή του Θάνου §3.7).'}),
    num('Kp','K_p','',.5,{zero:true,signed:true}),num('Ki','K_i','1/s',10,{zero:true,signed:true}),
    num('umin','Κάτω όριο εξόδου','',-220,{signed:true,zero:true}),num('umax','Άνω όριο εξόδου','',220,{signed:true,zero:true}),
    num('rs','Κλίμακα αναφοράς','',150,{hint:'Τυπικό μέγεθος της αναφοράς (και της μέτρησης), για τις εισόδους του δικτύου.'}),num('dxs','Κλίμακα της παραγώγου ṙ','',0,{zero:true,hint:'Τυπικό μέγεθος της ṙ_f για την είσοδο του δικτύου· 0: 2π·f_r·(κλίμακα αναφοράς).'}),num('us','Κλίμακα εξόδου του δικτύου','',100),
    txt('hidden','Κρυφά στρώματα','8'),sel('opt','Αλγόριθμος',[['sgd','Κλίση (SGD)'],['adam','Adam']],'sgd'),num('lr','Ρυθμός μάθησης η','',.005),
    num('elr','Ρυθμός μάθησης του εξομοιωτή','',2e-3,{show:p=>p.scheme==='emu'}),num('K','Κέρδος του σφάλματος μέσω εξομοιωτή K','',.1,{show:p=>p.scheme==='emu'}),
    num('ds','Κλίμακα της παραγώγου ẏ','',0,{zero:true,show:p=>p.scheme==='emu',hint:'0: 2π·f_r·(κλίμακα αναφοράς)/4.'}),
    num('seed','Σπόρος τυχαίων βαρών','',1,{zero:true}),
    {k:'w',label:'Βάρη (JSON)',type:'code',def:'',hint:'Τα βάρη του ελεγκτή (μορφή pcl.control). «Κράτα τα βάρη» και «Εκπαίδευση εκτός οθόνης» στην πρόσοψη τα γράφουν εδώ. Στο «αντίστροφο μοντέλο» μένουν σταθερά, αλλιώς είναι η αρχή της μάθησης.'}],value:()=>null,
   draw:p=>sb(60,80)+tx('AI',0,-2,'btxt big')+tx({pi:'PI',fel:'PI+NN',fel2:'PI+NN·s',inv:'NN⁻¹',emu:'NN⁻¹·εξ.'}[p.scheme]||'',0,14,'bsm')+'<path class="thin" d="M-12,24 l5,-7 l4,5 l6,-10 l5,6"/>'+sl('M-40,-20 H-30 M-40,20 H-30 M30,-30 H40 M30,-10 H40 M30,10 H40 M30,30 H40')+(p.scheme==='emu'?sl('M0,-40 V-50'):'')},
  // 4.8: the multi-objective cascade of the EV workbench (moevc) as a library part (netlib.js evcDef)
  // 4.8.1: controls of a synchronous generator (library parts, netlib.js avrDef, pssDef, govDef; Kundur ch. 8–9)
  AVR:{name:'Διέγερση και ρυθμιστής τάσης (AVR: IEEE ST1A, DC1A)',prefix:'AVR',group:'Δίκτυο',pins:{},spins:{vt:I(-40,-30),v0:I(-40,-15),e0:I(-40,0),ifd:I(-40,15),vs:I(-40,30),efd:O(40,0)},box:[-30,-40,60,80],blk:true,
   params:[sel('type','Τύπος',[['st1a','ST1A: στατική διέγερση από τους ακροδέκτες (θυρίστορ)'],['dc1a','DC1A: διεγέρτρια ΣΡ με κορεσμό']],'st1a',{hint:'Kundur §8.6, Σχ. 8.43 (ST1A) και 8.40 (DC1A), με τα δείγματα δεδομένων του βιβλίου ως προεπιλογές. Σύνδεσε vt, v0, e0 και ifd από τη γεννήτρια (με «E_fd: από σήμα» η γεννήτρια δίνει e0 και v0 της ροής φορτίου): η προσομοίωση ξεκινά στην ισορροπία.'}),
    txt('Vref','V_ref (pu)','',{hint:'Κενό: η |V| της ροής φορτίου (είσοδος v0). Ή μια τιμή.'}),txt('dV','Αλλαγή του V_ref ΔV(t)','0',{sched:true,unit:'pu',hint:'Σταθερή τιμή ή «t:τιμή» σε pu, π.χ. 0:0, 1:0.05 για βήμα 5 % στο 1 s.'}),
    num('TR','T_R (μετατροπέας τάσης)','s',0.015,{zero:true}),num('KA','K_A','',200),num('TA','T_A','s',0,{zero:true,hint:'0: χωρίς σταθερά χρόνου (ST1A του βιβλίου).'}),
    num('TC','T_C (μείωση μεταβατικού κέρδους)','s',0,{zero:true,hint:'Με T_B > T_C: μείωση του μεταβατικού κέρδους (TGR), π.χ. T_C = 1, T_B = 10.'}),num('TB','T_B','s',0,{zero:true}),num('TC1','T_C1','s',0,{zero:true}),num('TB1','T_B1','s',0,{zero:true}),
    num('KF','K_F (ανάδραση ρυθμού)','',0,{zero:true}),num('TF','T_F','s',1),
    num('VRMAX','V_RMAX','pu',7),num('VRMIN','V_RMIN','pu',-6.4,{signed:true}),num('KC','K_C (πτώση του ανορθωτή)','',0.04,{zero:true,show:p=>p.type!=='dc1a'}),
    num('KLR','K_LR (όριο ρεύματος διέγερσης)','',4.54,{zero:true,show:p=>p.type!=='dc1a'}),num('ILR','I_LR','pu',4.4,{show:p=>p.type!=='dc1a'}),
    txt('KE','K_E','',{show:p=>p.type==='dc1a',hint:'Κενό: αυτοδιεγειρόμενη, K_E ώστε V_R = 0 στην αρχή (όπως στο βιβλίο).'}),num('TE','T_E','s',1.15,{show:p=>p.type==='dc1a'}),
    num('AEX','A_EX (κορεσμός S_E = A_EX·e^(B_EX·E_fd))','',0.014,{zero:true,show:p=>p.type==='dc1a'}),num('BEX','B_EX','',1.55,{zero:true,show:p=>p.type==='dc1a'})],value:()=>null,
   draw:p=>sb(60,80)+tx('AVR',0,-6,'btxt big')+tx(p.type==='dc1a'?'DC1A':'ST1A',0,12,'bsm')+sl('M-40,-30 H-30 M-40,-15 H-30 M-40,0 H-30 M-40,15 H-30 M-40,30 H-30 M30,0 H40')},
  PSS:{name:'Σταθεροποιητής συστήματος (PSS)',prefix:'PSS',group:'Δίκτυο',pins:{},spins:{w:I(-40,0),vs:O(40,0)},box:[-30,-20,60,40],blk:true,
   params:[num('KS','K_STAB','pu',20,{zero:true,hint:'V_s = K·sT_W/(1+sT_W)·(1+sT1)/(1+sT2)·(1+sT3)/(1+sT4)·Δω, στην είσοδο v_s του AVR. Τυπικές τιμές· η ρύθμιση για συγκεκριμένο δίκτυο στο Kundur κεφ. 12.'}),
    num('TW','T_W (washout)','s',1.4),num('T1','T_1','s',0.154,{zero:true}),num('T2','T_2','s',0.033,{zero:true}),num('T3','T_3','s',0,{zero:true}),num('T4','T_4','s',0,{zero:true}),
    num('VSMAX','V_SMAX','pu',0.1),num('VSMIN','V_SMIN','pu',-0.1,{signed:true})],value:()=>null,
   draw:()=>sb(60,40)+tx('PSS',0,-1,'btxt big')+tx('Δω → v_s',0,13,'bsm')+sl('M-40,0 H-30 M30,0 H40')},
  GOV:{name:'Ρυθμιστής στροφών και στρόβιλος',prefix:'GOV',group:'Δίκτυο',pins:{},spins:{w:I(-40,-15),m0:I(-40,15),tm:O(40,-20),pm:O(40,0),g:O(40,20)},box:[-30,-30,60,60],blk:true,
   params:[sel('type','Στρόβιλος',[['steam','Ατμοστρόβιλος με αναθέρμανση (μηχανοϋδραυλικός ρυθμιστής)'],['hydro','Υδροστρόβιλος (μόνιμη και μεταβατική στατικότητα, αγωγός πτώσης)']],'steam',{hint:'Kundur Σχ. 9.21 και 9.31 (ατμός), 9.7 και 9.10 (νερό), με τα δείγματα δεδομένων του βιβλίου. Σύνδεσε w και m0 από τη γεννήτρια (με «T_m: από σήμα» η γεννήτρια δίνει m0 της ροής φορτίου) και tm στην είσοδό της.'}),
    txt('dP','Αλλαγή αναφοράς φορτίου ΔP(t)','0',{sched:true,unit:'pu',hint:'Σταθερή τιμή ή «t:τιμή» σε pu της ισχύος του στροβίλου.'}),num('Pr','Ισχύς στροβίλου / βάση μηχανής P_r','',1),
    num('R','Στατικότητα R (K_G = 1/R)','pu',0.05,{show:p=>p.type!=='hydro'}),num('TSR','T_SR (ρελέ ταχύτητας)','s',0.7,{zero:true,show:p=>p.type!=='hydro'}),num('TSM','T_SM (σερβοκινητήρας)','s',0.23,{show:p=>p.type!=='hydro'}),
    num('LC1','Ρυθμός ανοίγματος L_C1','pu/s',1,{show:p=>p.type!=='hydro'}),num('LC2','Ρυθμός κλεισίματος L_C2','pu/s',-3,{signed:true,show:p=>p.type!=='hydro'}),
    num('V1','Κατώφλι βοηθητικού ρυθμιστή V_1','pu',0.02,{zero:true,show:p=>p.type!=='hydro'}),num('KAX','K_AX','',149,{zero:true,show:p=>p.type!=='hydro'}),
    num('FHP','F_HP','',0.3,{zero:true,show:p=>p.type!=='hydro'}),num('FIP','F_IP','',0.3,{zero:true,show:p=>p.type!=='hydro'}),num('FLP','F_LP','',0.4,{zero:true,show:p=>p.type!=='hydro'}),
    num('TCH','T_CH (θάλαμος ατμού)','s',0.3,{zero:true,show:p=>p.type!=='hydro'}),num('TRH','T_RH (αναθερμαντήρας)','s',7,{zero:true,show:p=>p.type!=='hydro'}),num('TCO','T_CO (διασταύρωση)','s',0.5,{zero:true,show:p=>p.type!=='hydro'}),
    num('RP','Μόνιμη στατικότητα R_P','pu',0.04,{show:p=>p.type==='hydro'}),num('RT','Μεταβατική στατικότητα R_T','pu',0.4,{zero:true,show:p=>p.type==='hydro'}),num('TR','T_R (επαναφορά)','s',5,{show:p=>p.type==='hydro'}),
    num('TP','T_P (πιλοτική βαλβίδα)','s',0.05,{zero:true,show:p=>p.type==='hydro'}),num('KS','K_s (κέρδος σερβο)','',5,{show:p=>p.type==='hydro'}),num('TG','T_G (κύριος σερβοκινητήρας)','s',0.2,{zero:true,show:p=>p.type==='hydro'}),
    num('Ropen','Μέγιστος ρυθμός ανοίγματος','pu/s',0.16,{show:p=>p.type==='hydro'}),num('Rclose','Μέγιστος ρυθμός κλεισίματος','pu/s',0.16,{show:p=>p.type==='hydro'}),
    num('Tw','T_W (χρόνος εκκίνησης νερού)','s',1,{show:p=>p.type==='hydro'}),num('gFL','Θυρόφραγμα πλήρους φορτίου g_FL','pu',0.96,{show:p=>p.type==='hydro'}),num('gNL','Θυρόφραγμα χωρίς φορτίο g_NL','pu',0.16,{zero:true,show:p=>p.type==='hydro'})],value:()=>null,
   draw:p=>sb(60,60)+tx('GOV',0,-4,'btxt big')+tx(p.type==='hydro'?'νερό':'ατμός',0,12,'bsm')+sl('M-40,-15 H-30 M-40,15 H-30 M30,-20 H40 M30,0 H40 M30,20 H40')},
  EVC:{name:'Πολυκριτηριακός ελεγκτής οχήματος (ταχύτητα → ροπή → ρεύμα)',prefix:'MO',group:'Έλεγχος',pins:{},spins:{r:I(-40,-40),y:I(-40,-20),i:I(-40,0),soc:I(-40,20),tl:I(-40,40),u:O(40,-40),tau:O(40,-20),rg:O(40,0),lim:O(40,20),keep:O(40,40),pw:O(0,60)},box:[-30,-50,60,100],blk:true,
   params:[sel('scheme','Σχήμα',[['moevc','Συζευγμένο: ρυθμιστής αναφοράς, ταχύτητα → επιτάχυνση → ροπή (moevc)'],['moev','Καταρράκτης: ταχύτητα → ροπή με επόπτη SOC/ισχύος (moev)']],'moevc',{hint:'Τα δύο σχήματα του Control Workbench EV/DC. Στο «moev» ο PI ταχύτητας δίνει απευθείας ροπή· στο «moevc» δίνει επιτάχυνση, που γίνεται ροπή μέσω της δυναμικής του οχήματος, και ο ρυθμιστής αναφοράς κόβει τον στόχο στα όρια.'}),
    sel('mode','Τρόπος',[['balanced','Ισορροπημένος'],['eco','Οικονομικός (eco)'],['performance','Επιδόσεων (performance)']],'balanced',{hint:'Όπως στο workbench: eco ανεβάζει το βάρος της ενέργειας και χαμηλώνει τα όρια ισχύος και ρεύματος, performance το αντίθετο.'}),
    num('ws','Βάρος ταχύτητας','',1,{zero:true}),num('wt','Βάρος ροπής','',.75,{zero:true}),num('we','Βάρος ενέργειας','',.55,{zero:true,hint:'Μαζί με το χαμηλό SOC μειώνει τη ροπή που ζητείται και τα όρια.'}),
    num('Kt','K_t (= K_e)','N·m/A',.2),num('Ke','K_e','V·s/rad',.2),num('R','R_a','Ω',.22),num('J','Ισοδύναμη ροπή αδράνειας J','kg·m²',.17),num('B','Τριβή B','N·m·s/rad',.012,{zero:true}),
    num('kpw','K_p ταχύτητας → ροπή','N·m·s/rad',.2,{show:p=>p.scheme==='moev'}),num('kiw','K_i ταχύτητας → ροπή','N·m/rad',.6,{zero:true,show:p=>p.scheme==='moev'}),num('atl','Όριο ροπής επιτάχυνσης','N·m',40,{show:p=>p.scheme==='moev'}),
    num('kpa','K_p ταχύτητας → επιτάχυνση','1/s',2.2,{show:p=>p.scheme!=='moev'}),num('kia','K_i ταχύτητας → επιτάχυνση','1/s²',.45,{zero:true,show:p=>p.scheme!=='moev'}),num('alim','Όριο επιτάχυνσης','rad/s²',150,{show:p=>p.scheme!=='moev'}),num('aff','Πρόσθια τροφοδότηση της επιτάχυνσης αναφοράς','',1,{zero:true,show:p=>p.scheme!=='moev',hint:'Η παράγωγος της αναφοράς (φιλτραρισμένη) προστίθεται στην επιτάχυνση που ζητείται: ο βρόχος ταχύτητας δεν «φορτώνει» τον ολοκληρωτή στις ράμπες και το όχημα δεν κυλά πίσω στη στάση. 0: όπως ο καταρράκτης «moevc» του Control Workbench, χωρίς αυτήν.'}),num('fr','Συχνότητα του φίλτρου αναφοράς','Hz',2,{show:p=>p.scheme!=='moev'}),num('H','Ορίζοντας του ρυθμιστή αναφοράς','s',.85,{show:p=>p.scheme!=='moev'}),num('ffg','Κέρδος πρόσθιας τροφοδότησης φορτίου','',1,{zero:true,show:p=>p.scheme!=='moev'}),
    num('taulim','Όριο ροπής','N·m',40),num('ilim','Όριο ρεύματος','A',200),num('plim','Όριο ισχύος','kW',8),num('regen','Όριο ροπής ανάκτησης','N·m',16,{show:p=>p.scheme!=='moev'}),num('slew','Ρυθμός μεταβολής ροπής','N·m/s',420,{show:p=>p.scheme!=='moev'}),
    num('kpi','K_p ρεύματος','V/A',.02,{zero:true}),num('kii','K_i ρεύματος','V/(A·s)',0,{zero:true}),num('umin','Κάτω όριο τάσης','V',-96,{signed:true}),num('umax','Άνω όριο τάσης','V',96),num('fs','Συχνότητα δειγματοληψίας','Hz',1000)],value:()=>null,
   draw:p=>sb(60,100)+tx('MO',0,-6,'btxt big')+tx({eco:'eco',performance:'perf',balanced:'bal'}[p.mode]||'bal',0,10,'bsm')+tx(p.scheme==='moev'?'ω→τ→i':'ω→α→τ→i',0,26,'bsm')+sl('M-40,-40 H-30 M-40,-20 H-30 M-40,0 H-30 M-40,20 H-30 M-40,40 H-30 M30,-40 H40 M30,-20 H40 M30,0 H40 M30,20 H40 M30,40 H40 M0,50 V60')},
  NN:{name:'Νευρωνικό δίκτυο (MLP)',prefix:'NN',group:'Έλεγχος',pins:{},spins:p=>codeIO(nnIns(p),nnOuts(p)),box:p=>{const h=codeH(nnIns(p),nnOuts(p));return [-30,-h,60,2*h];},blk:true,
   params:[txt('ins','Είσοδοι','x1, x2',{hint:'Ονόματα χωρισμένα με κόμμα, έως 6. Στο δίκτυο μπαίνει κάθε είσοδος διαιρεμένη με την κλίμακά της.'}),
    txt('xs','Κλίμακες εισόδων','1',{hint:'Μία τιμή για όλες ή μία ανά είσοδο (κόμμα): τυπικό μέγεθος κάθε εισόδου, ώστε στο δίκτυο να μπαίνουν τιμές γύρω στο ±1.'}),
    txt('hidden','Κρυφά στρώματα','8',{hint:'Νευρώνες ανά κρυφό στρώμα (tanh), π.χ. 8 ή 16, 8. Η έξοδος είναι γραμμική.'}),
    num('ys','Κλίμακα εξόδου','',1,{signed:true,hint:'y = κλίμακα × έξοδος του δικτύου. Η ίδια κλίμακα κανονικοποιεί το σφάλμα της μάθησης.'}),
    num('ymin','Κάτω όριο εξόδου','',-1,{signed:true,zero:true}),num('ymax','Άνω όριο εξόδου','',1,{signed:true,zero:true}),
    sel('train','Μάθηση',[['off','Όχι: σταθερά βάρη'],['err','Online, με σήμα σφάλματος e (feedback-error learning)'],['tgt','Online, προς στόχο tgt (εποπτευόμενη)']],'off',
     {hint:'Σε κάθε δείγμα: «σήμα σφάλματος»: τα βάρη αλλάζουν ώστε να μικρύνει το e (π.χ. η έξοδος ενός PI σε σειρά: το δίκτυο μαθαίνει την πρόσθια τροφοδότηση που λείπει). «Στόχος»: το δίκτυο μαθαίνει να δίνει tgt από τις εισόδους. Η είσοδος fz ≥ 0,5 παγώνει τη μάθηση.'}),
    bool('learn','Μαθαίνει',true,{show:p=>p.train==='err'||p.train==='tgt',hint:'Κλειστό: τα βάρη μένουν όπως είναι (πάγωμα). Αλλάζει και την ώρα της προσομοίωσης (📌).'}),
    sel('opt','Αλγόριθμος',[['adam','Adam'],['sgd','Κλίση (SGD)']],'adam',{show:p=>p.train==='err'||p.train==='tgt'}),
    num('lr','Ρυθμός μάθησης η','',1e-3,{show:p=>p.train==='err'||p.train==='tgt'}),
    num('clip','Όριο κλίσης','',5,{show:p=>p.train==='err'||p.train==='tgt',hint:'Κάθε στοιχείο της κλίσης κόβεται στο ±όριο πριν από το βήμα.'}),
    num('l2','Απόσβεση βαρών (L2)','',0,{zero:true,show:p=>p.train==='err'||p.train==='tgt'}),
    num('nl','Παράθυρο καμπύλης μάθησης','δείγματα',200,{show:p=>p.train==='err'||p.train==='tgt',hint:'Η έξοδος L είναι η RMS τιμή του σφάλματος στα τελευταία τόσα δείγματα (εκθετικός μέσος).'}),
    txt('share','Βάρη από το μπλοκ (αντίγραφο)','',{hint:'id ενός άλλου μπλοκ NN με ίδιο μέγεθος, π.χ. NNE: αυτό το μπλοκ υπολογίζει με τα βάρη εκείνου όπως είναι τη στιγμή του δείγματος και δεν μαθαίνει μόνο του. Για τον εξομοιωτή του αντίστροφου ελέγχου σε δύο αντίγραφα: ένα μαθαίνει το σύστημα από τις μετρήσεις, το άλλο υπολογίζει στην έξοδο του ελεγκτή. Κενό: δικά του βάρη.'}),
    txt('jac','Έξοδος παραγώγου ως προς την είσοδο','',{struct:true,hint:'Όνομα μιας εισόδου, π.χ. u: η έξοδος dy = ∂y/∂u (στις μονάδες των σημάτων). Για τον εξομοιωτή του αντίστροφου ελέγχου: ο ελεγκτής μαθαίνει από το σφάλμα επί ∂ŷ/∂u (specialized inverse learning). Κενό: χωρίς.'}),
    sel('init','Αρχικά βάρη (όταν δεν δίνονται)',[['zero','Τυχαία, με μηδενική έξοδο (για online μάθηση)'],['rand','Όλα τυχαία']],'zero'),
    num('seed','Σπόρος τυχαίων βαρών','',1,{zero:true}),
    {k:'w',label:'Βάρη (JSON)',type:'code',def:'',hint:'{"sizes": [εισόδους, …, 1], "W": [...], "b": [...]}, όπως τα δίνει το pcl.control. Κενό: τυχαία από τον σπόρο. «Κράτα τα βάρη» στις ρυθμίσεις γράφει εδώ ό,τι έμαθε το δίκτυο.'},
    CLOCK(),TRIG,num('y0','Αρχική έξοδος','',0,{signed:true,zero:true})],value:()=>null,
   draw:p=>codeDraw(nnIns(p),nnOuts(p),'NN')+(p.train==='err'||p.train==='tgt'?'<path class="thin" d="M-9,13 l4,-6 l3,4 l5,-8"/>':'')},
  IM:{machine:{kind:'induction',speed:'w',torque:'te',load:{param:'load',sig:'tl',sched:'TL'},inertia:'J',supply:'τριφασικός αντιστροφέας με διανυσματικό έλεγχο (FOC)'},name:'Μηχανή επαγωγής (ισοδύναμο αντίστροφου Γ)',prefix:'M',group:'Μηχανές',pins:p=>isBus(p)?{abc:[-40,0]}:{a:[-40,-20],b:[-40,0],c:[-40,20]},bus:p=>isBus(p)?{abc:['a','b','c']}:{},box:[-25,-25,50,50],lbl:'above',
   spins:p=>p.load==='sig'?{w:O(40,-20),te:O(40,-10),psi:O(40,0),thf:O(40,10),thr:O(40,20),tl:I(0,40)}:{w:O(40,-20),te:O(40,-10),psi:O(40,0),thf:O(40,10),thr:O(40,20)},
   params:[num('Rs','Αντίσταση στάτη R_s','Ω',3),num('RR','Αντίσταση δρομέα R_R','Ω',2,{hint:'Ανάστροφο-Γ: R_R, L_M και L_σ αντί για R_r, L_m, L_ls, L_lr (γ = L_m/L_r).'}),num('Lsig','Αυτεπαγωγή σκέδασης L_σ','H',0.025),
    num('LM','Αυτεπαγωγή μαγνήτισης L_M','H',0.3),num('pp','Ζεύγη πόλων p','',2),num('J','Ροπή αδράνειας J','kg·m²',0.02),num('bm','Τριβή b','N·m·s',0.002,{zero:true}),
    sel('load','Ροπή φορτίου',[['sched','Τιμή ή πρόγραμμα'],['sig','Από σήμα (ακροδέκτης tl)']],'sched'),txt('TL','τ_L(t)','0',{hint:'Σταθερή τιμή ή «t:τιμή» σε N·m.',show:p=>p.load!=='sig'}),
    num('w0','Αρχική μηχανική ταχύτητα','rad/s',0,{signed:true,zero:true}),CONN('abc')],
   value:p=>p.pp,unit:'',
   draw:p=>(isBus(p)?bl('M-40,0 H-22'):'<path d="M-40,-20 H-25 M-40,0 H-25 M-40,20 H-25"/>')+'<circle r="22"/>'+tx('IM',0,4,'btxt')+sl('M22,-20 H40 M25,-10 H40 M25,0 H40 M25,10 H40 M22,20 H40')+(p.load==='sig'?sl('M0,22 V40'):'')
    +tx('ω',30,-23,'pinl')+tx('τ',30,-13,'pinl')+tx('ψ',30,-3,'pinl')+tx('θf',30,7,'pinl')+tx('θr',30,17,'pinl')},
  // synchronous machine (3.5): d, q inductances and magnet flux; ψ_m = 0 is the synchronous reluctance machine (SynRM)
  SM:{machine:{kind:'sync',speed:'w',torque:'te',load:{param:'load',sig:'tl',sched:'TL'},inertia:'J',supply:'τριφασικός αντιστροφέας, έλεγχος dq (MTPA)'},name:'Σύγχρονη μηχανή (SynRM / PMSM)',prefix:'M',group:'Μηχανές',pins:p=>isBus(p)?{abc:[-40,0]}:{a:[-40,-20],b:[-40,0],c:[-40,20]},bus:p=>isBus(p)?{abc:['a','b','c']}:{},box:[-25,-25,50,50],lbl:'above',
   spins:p=>{const o={w:O(40,-20),te:O(40,-10),th:O(40,0),id:O(40,10),iq:O(40,20)};if(p.load==='sig')o.tl=I(0,40);return o;},
   params:[num('Rs','Αντίσταση στάτη R_s','Ω',2),num('Ld','Αυτεπαγωγή άξονα d L_d','H',0.15,{hint:'SynRM: d είναι ο άξονας της ελάχιστης μαγνητικής αντίστασης (L_d > L_q). PMSM: d είναι ο άξονας του μαγνήτη (στην IPMSM L_q > L_d, στην SPMSM L_d = L_q).'}),
    num('Lq','Αυτεπαγωγή άξονα q L_q','H',0.03),
    sel('sat','Κορεσμός στον άξονα d',[['none','Όχι: ψ_d = L_d·i_d + ψ_m'],['d','Ναι: ψ_d(i_d) με γόνατο']],'none',{hint:'ψ_d = L_dsat·i_d + ψ_k·(1 − e^(−(L_d − L_dsat)·|i_d|/ψ_k))·sign(i_d) + ψ_m: κλίση L_d γύρω από το 0 και L_dsat σε κορεσμό. Ο άξονας q μένει γραμμικός.'}),
    num('Ldsat','L_d σε κορεσμό (κλίση)','H',0.04,{show:p=>p.sat==='d'}),num('psikd','ψ_k: γόνατο κορεσμού d','V·s',0.5,{show:p=>p.sat==='d'}),
    num('psim','Ροή μαγνήτη ψ_m','V·s',0,{zero:true,hint:'0 = μηχανή μαγνητικής αντίστασης (SynRM). Ροπή τ_e = (3/2)·p·(ψ_m·i_q + (L_d − L_q)·i_d·i_q).'}),
    num('pp','Ζεύγη πόλων p','',2),num('J','Ροπή αδράνειας J','kg·m²',0.02),num('bm','Τριβή b','N·m·s',0.002,{zero:true}),
    sel('load','Ροπή φορτίου',[['sched','Τιμή ή πρόγραμμα'],['sig','Από σήμα (ακροδέκτης tl)']],'sched'),txt('TL','τ_L(t)','0',{hint:'Σταθερή τιμή ή «t:τιμή» σε N·m.',show:p=>p.load!=='sig'}),
    num('w0','Αρχική μηχανική ταχύτητα','rad/s',0,{signed:true,zero:true}),num('th0','Αρχική γωνία δρομέα θ (ηλεκτρική, ως προς τη φάση a)','°',0,{signed:true,zero:true}),CONN('abc')],
   value:p=>p.pp,unit:'',
   draw:p=>(isBus(p)?bl('M-40,0 H-22'):'<path d="M-40,-20 H-25 M-40,0 H-25 M-40,20 H-25"/>')+'<circle r="22"/>'+tx(+p.psim>0?'PM':'SynRM',0,4,+p.psim>0?'btxt':'bsm')+sl('M22,-20 H40 M25,-10 H40 M25,0 H40 M25,10 H40 M22,20 H40')+(p.load==='sig'?sl('M0,22 V40'):'')
    +tx('ω',30,-23,'pinl')+tx('τ',30,-13,'pinl')+tx('θ',30,-3,'pinl')+tx('d',30,7,'pinl')+tx('q',30,17,'pinl')},
  // switched reluctance machine (3.6): one winding per phase, pins on top (phase k: a_k, b_k 20 apart, phases 160 apart, under the columns
  // of an asymmetric bridge); ψ(θ, i) from parameters or a table, torque from the co-energy
  SRM:{machine:{kind:'srm',speed:'w',torque:'te',load:{param:'load',sig:'tl',sched:'TL'},inertia:'J',supply:'ασύμμετρος μετατροπέας ανά φάση, υστέρηση ρεύματος'},name:'Μηχανή μεταβλητής μαγνητικής αντίστασης (SRM)',prefix:'M',group:'Μηχανές',pins:p=>srmPins(srmGeo(p)[0]),box:p=>{const N=srmGeo(p)[0];return [-80*(N-1)-40,-30,160*(N-1)+80,60];},lbl:'left',
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
  MOD3:{name:'Διαμορφωτής τριφασικός',prefix:'MD',group:'Έλεγχος',pins:{},spins:p=>isBus(p)?{v:I(-30,-10),vdc:I(-30,20),d:O(30,0)}:{va:I(-30,-20),vb:I(-30,-10),vc:I(-30,0),vdc:I(-30,20),da:O(30,-10),db:O(30,0),dc:O(30,10)},
   bus:p=>isBus(p)?{v:['va','vb','vc'],d:['da','db','dc']}:{},box:[-20,-25,40,50],blk:true,
   params:[sel('mode','Διαμόρφωση',[['spwm','SPWM: d = ½ + v/V_dc'],['svpwm','SVPWM: έγχυση μηδενικής ακολουθίας −(max + min)/2'],['square','Τετραγωνική (six-step): d = 1 όταν v > 0']],'svpwm',{hint:'Τα d πάνε στα PWM με «D από σήμα» και τριγωνικό φέρον, ένα ανά σκέλος. Γραμμική περιοχή: πλάτος φάσης ≤ V_dc/2 (SPWM), ≤ V_dc/√3 (SVPWM).'}),CONN('v_abc → d_abc')],value:()=>null,
   draw:p=>sb(40,50)+tx(p.mode==='square'?'6-step':p.mode==='spwm'?'SPWM':'SVM',0,4,'bsm')+(isBus(p)?sbl('M-30,-10 H-20 M20,0 H30')+sl('M-30,20 H-20'):sl('M-30,-20 H-20 M-30,-10 H-20 M-30,0 H-20 M-30,20 H-20 M20,-10 H30 M20,0 H30 M20,10 H30'))},
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
  // B1, the rest (3.19): second-order filter, rate limiter, rate transition, edge detector. All work per element of a bus.
  F2:{name:'Φίλτρο 2ης τάξης',prefix:'F2',group:'Σήματα',pins:{},spins:{u:I(-30,0),y:O(30,0)},box:[-20,-15,40,30],blk:true,
   params:[sel('kind','Είδος',[['lp','Βαθυπερατό ω₀²/D(s)'],['hp','Υψηλοπερατό s²/D(s)'],['bp','Ζωνοπερατό 2ζω₀·s/D(s)'],['notch','Notch (s² + ω₀²)/D(s)']],'lp',{hint:'D(s) = s² + 2ζω₀s + ω₀², ω₀ = 2πf₀. Κέρδος 1 στη ζώνη διέλευσης (το ζωνοπερατό στο f₀). Το notch στο 2f κόβει την κυμάτωση 2ω σε μονοφασικό PLL ή DC bus.'}),
    num('f0','Συχνότητα f₀','Hz',1000),num('zeta','Απόσβεση ζ','',0.7071,{hint:'Q = 1/(2ζ). Στο βαθυπερατό με ζ < 1: υπερύψωση exp(−πζ/√(1−ζ²)) στο βήμα.'}),
    num('u0','Είσοδος πριν από t = 0','',0,{signed:true,zero:true,hint:'Το φίλτρο ξεκινά σε ισορροπία με αυτή την είσοδο (βαθυπερατό: έξοδος u₀, υψηλοπερατό και ζωνοπερατό: 0).'})],value:p=>p.f0,unit:'Hz',
   draw:p=>sb(40,30)+'<path class="thin" d="'+({hp:'M-13,8 Q-6,-5 0,-5 H13',bp:'M-13,8 Q-4,-10 0,-6 Q4,-10 13,8',notch:'M-13,-5 H-5 Q0,10 5,-5 H13'}[p.kind]||'M-13,-5 H0 Q6,-5 12,8')+'"/>'+tx('2',13,-5,'bsm')+sl('M-30,0 H-20 M20,0 H30')},
  RLIM:{name:'Όριο ρυθμού μεταβολής',prefix:'RL',group:'Σήματα',pins:{},spins:{u:I(-30,0),y:O(30,0)},box:[-20,-15,40,30],blk:true,
   params:[num('up','Μέγιστος ρυθμός ανόδου','1/s',1000,{hint:'Μονάδα εισόδου ανά δευτερόλεπτο, π.χ. A/s για αναφορά ρεύματος. Η έξοδος ακολουθεί την είσοδο με κλίση το πολύ τόση.'}),
    num('dn','Μέγιστος ρυθμός καθόδου','1/s',1000),num('y0','Αρχική έξοδος','',0,{signed:true,zero:true})],value:()=>null,
   draw:()=>sb(40,30)+'<path class="thin" d="M-13,8 H-7 L7,-7 H13"/>'+tx('/',0,13,'bsm')+sl('M-30,0 H-20 M20,0 H30')},
  RT:{name:'Αλλαγή ρυθμού δειγματοληψίας',prefix:'RT',group:'Σήματα',pins:{},spins:{u:I(-30,0),y:O(30,0)},box:[-20,-15,40,30],blk:true,
   params:[CLOCK({label:'Ρολόι εξόδου (PWM ή μπλοκ Ρολόι)'}),TRIG,sel('mode','Μεταφορά',[['zoh','Δείγμα της στιγμής (ZOH): y = u(t_k)'],['delay','Ντετερμινιστική με καθυστέρηση: y = u(t_{k−1})']],'zoh',{hint:'Από γρήγορο σε αργό ρυθμό (π.χ. ADC 20 kHz → ελεγκτής 10 kHz). «Με καθυστέρηση» η έξοδος δεν εξαρτάται από τη σειρά υπολογισμού στη στιγμή του δείγματος, όπως η μεταφορά ανάμεσα σε δύο tasks.'}),
    num('y0','Αρχική έξοδος','',0,{signed:true,zero:true})],value:()=>null,
   draw:p=>sb(40,30)+'<path class="thin" d="M-13,6 H-6 V-2 H2 V-8 H13"/>'+tx(p.mode==='delay'?'z⁻¹':'ZOH',0,12,'bsm')+sl('M-30,0 H-20 M20,0 H30')},
  EDGE:{name:'Ανιχνευτής ακμής',prefix:'ED',group:'Σήματα',pins:{},spins:{u:I(-30,0),y:O(30,-8),n:O(30,8)},box:[-20,-18,40,36],blk:true,
   params:[sel('edge','Ακμή',[['rise','Ανερχόμενη (0 → 1)'],['fall','Κατερχόμενη (1 → 0)'],['both','Και οι δύο']],'rise',{hint:'Είσοδος ≥ 0,5 = 1, και πριν από t = 0 θεωρείται 0 (όπως στο SR latch). Έξοδος y = 1 για διάρκεια t_w μετά την ακμή, n = πλήθος ακμών από την αρχή.'}),
    num('tw','Διάρκεια παλμού t_w','s',0,{zero:true,hint:'0 = μόνο η στιγμή της ακμής (για latch, μετρητή ή reset). Με t_w > 0 το τέλος του παλμού είναι συμβάν του λύτη, ίδιο στον browser και στον SciPy.'})],value:()=>null,
   draw:p=>sb(40,36)+'<path class="thin" d="'+(p.edge==='fall'?'M-13,-6 H-2 V6 H6':'M-13,6 H-2 V-6 H6')+(p.edge==='both'?' V6 H11':'')+'"/>'+tx('y',14,-5,'bsm')+tx('n',14,11,'bsm')+sl('M-30,0 H-20 M20,-8 H30 M20,8 H30')},
  CLARKE:{name:'Clarke abc → αβ',prefix:'CL',group:'Σήματα',pins:{},spins:p=>isBus(p)?{abc:I(-30,0),ab:O(30,0)}:{a:I(-30,-10),b:I(-30,0),c:I(-30,10),al:O(30,-10),be:O(30,10)},box:[-20,-20,40,40],blk:true,
   bus:p=>isBus(p)?{abc:['a','b','c'],ab:['al','be']}:{},
   params:[sel('inv','Κλίμακα',[['amp','Διατήρηση πλάτους (α = a)'],['pow','Διατήρηση ισχύος']],'amp'),CONN('abc → αβ')],value:()=>null,
   draw:p=>sb(40,40)+tx('abc',-6,-8,'bsm')+tx('αβ',8,14,'bsm')+'<path class="thin" d="M-12,12 L12,-12"/>'+(isBus(p)?sbl('M-30,0 H-20 M20,0 H30'):sl('M-30,-10 H-20 M-30,0 H-20 M-30,10 H-20 M20,-10 H30 M20,10 H30'))},
  ICLARKE:{name:'Clarke αβ → abc',prefix:'ICL',group:'Σήματα',pins:{},spins:p=>isBus(p)?{ab:I(-30,0),abc:O(30,0)}:{al:I(-30,-10),be:I(-30,10),a:O(30,-10),b:O(30,0),c:O(30,10)},box:[-20,-20,40,40],blk:true,
   bus:p=>isBus(p)?{ab:['al','be'],abc:['a','b','c']}:{},
   params:[sel('inv','Κλίμακα',[['amp','Διατήρηση πλάτους'],['pow','Διατήρηση ισχύος']],'amp'),CONN('αβ → abc')],value:()=>null,
   draw:p=>sb(40,40)+tx('αβ',-7,-8,'bsm')+tx('abc',6,14,'bsm')+'<path class="thin" d="M-12,12 L12,-12"/>'+(isBus(p)?sbl('M-30,0 H-20 M20,0 H30'):sl('M-30,-10 H-20 M-30,10 H-20 M20,-10 H30 M20,0 H30 M20,10 H30'))},
  PARK:{name:'Park αβ → dq',prefix:'PK',group:'Σήματα',pins:{},spins:p=>isBus(p)?{ab:I(-30,-10),th:I(-30,10),dq:O(30,0)}:{al:I(-30,-10),be:I(-30,0),th:I(-30,10),d:O(30,-10),q:O(30,10)},box:[-20,-20,40,40],blk:true,
   bus:p=>isBus(p)?{ab:['al','be'],dq:['d','q']}:{},params:[CONN('αβ → dq')],value:()=>null,
   draw:p=>sb(40,40)+tx('αβ',-7,-8,'bsm')+tx('dq',8,14,'bsm')+tx('θ',-13,13,'bsm')+'<path class="thin" d="M-12,12 L12,-12"/>'+(isBus(p)?sbl('M-30,-10 H-20 M20,0 H30')+sl('M-30,10 H-20'):sl('M-30,-10 H-20 M-30,0 H-20 M-30,10 H-20 M20,-10 H30 M20,10 H30'))},
  IPARK:{name:'Park dq → αβ',prefix:'IPK',group:'Σήματα',pins:{},spins:p=>isBus(p)?{dq:I(-30,-10),th:I(-30,10),ab:O(30,0)}:{d:I(-30,-10),q:I(-30,0),th:I(-30,10),al:O(30,-10),be:O(30,10)},box:[-20,-20,40,40],blk:true,
   bus:p=>isBus(p)?{dq:['d','q'],ab:['al','be']}:{},params:[CONN('dq → αβ')],value:()=>null,
   draw:p=>sb(40,40)+tx('dq',-7,-8,'bsm')+tx('αβ',8,14,'bsm')+tx('θ',-13,13,'bsm')+'<path class="thin" d="M-12,12 L12,-12"/>'+(isBus(p)?sbl('M-30,-10 H-20 M20,0 H30')+sl('M-30,10 H-20'):sl('M-30,-10 H-20 M-30,0 H-20 M-30,10 H-20 M20,-10 H30 M20,10 H30'))},
  PLL:{name:'PLL (τριφασικό)',prefix:'PLL',group:'Σήματα',pins:{},spins:p=>isBus(p)?{abc:I(-30,0),th:O(30,-10),w:O(30,0),amp:O(30,10)}:{a:I(-30,-10),b:I(-30,0),c:I(-30,10),th:O(30,-10),w:O(30,0),amp:O(30,10)},box:[-20,-20,40,40],blk:true,
   bus:p=>isBus(p)?{abc:['a','b','c']}:{},
   params:[num('f0','Ονομαστική συχνότητα','Hz',50),num('bw','Εύρος ζώνης','Hz',20,{hint:'ω_n = 2π·εύρος, ζ = 0,707: K_p = 2ζω_n, K_i = ω_n². Το σφάλμα είναι κανονικοποιημένο με το πλάτος, άρα τα κέρδη δεν εξαρτώνται από την τάση. Το θ φέρνει τον άξονα d πάνω στο διάνυσμα της τάσης: με v_a = V̂·sin(ωt + φ), όπως οι πηγές, θ = ωt + φ − 90°, v_d = V̂, v_q = 0.'}),
    num('th0','Αρχική γωνία','°',0,{signed:true,zero:true}),sel('ini','Αρχική γωνία από',[['th0','Την τιμή θ₀'],['v','Την τάση στο πρώτο βήμα (κλειδωμένο από την αρχή)']],'th0',{hint:'4.16: με «την τάση» το θ ξεκινά πάνω στο διάνυσμα της τάσης τη στιγμή του πρώτου υπολογισμού (αν η τάση δεν είναι μηδέν)· χρήσιμο για PLL με μικρό εύρος ζώνης, όπως ο ταλαντωτής μιας γέφυρας LCC.'}),CONN('abc')],value:p=>p.f0,unit:'Hz',
   draw:p=>sb(40,40)+tx('PLL',0,4,'bsm')+tx('θ',12,-7,'bsm')+tx('ω',12,3,'bsm')+(isBus(p)?sbl('M-30,0 H-20')+sl('M20,-10 H30 M20,0 H30 M20,10 H30'):sl('M-30,-10 H-20 M-30,0 H-20 M-30,10 H-20 M20,-10 H30 M20,0 H30 M20,10 H30'))},
  // Goto / From: signals joined by name, without a wire (like PLECS / Simulink tags)
  TAGO:{name:'Ετικέτα: προς (Goto)',prefix:'TG',group:'Σήματα',pins:{},spins:{u:I(-30,0)},box:[-20,-10,44,20],
   params:[txt('name','Όνομα σήματος','g',{hint:'Ό,τι μπαίνει εδώ βγαίνει από κάθε ετικέτα «από» με το ίδιο όνομα, σε όλο το κύκλωμα.'})],value:()=>null,
   draw:p=>'<path class="block sblk" d="M-20,-10 H12 L22,0 L12,10 H-20 Z"/>'+tx(xe(String(p.name||'').slice(0,7)),0,4,'bsm')+sl('M-30,0 H-20')},
  TAGI:{name:'Ετικέτα: από (From)',prefix:'TF',group:'Σήματα',pins:{},spins:{y:O(30,0)},box:[-22,-10,44,20],
   params:[txt('name','Όνομα σήματος','g',{hint:'Βγάζει το σήμα της ετικέτας «προς» με το ίδιο όνομα.'})],value:()=>null,
   draw:p=>'<path class="block sblk" d="M-22,-10 L-12,0 L-22,10 H20 V-10 Z"/>'+tx(xe(String(p.name||'').slice(0,7)),1,4,'bsm')+sl('M20,0 H30')},
  // 4.19.6 (ROADMAP §76): blocks that measure a signal inside the simulation and give the result as a signal: mean value, RMS, lowest and highest value
  AVG:{name:'Μέση τιμή',prefix:'AVG',group:'Σήματα',pins:{},spins:p=>mwinF(p)?{u:I(-30,-8),f:I(-30,8),y:O(30,0)}:{u:I(-30,0),y:O(30,0)},box:[-20,-15,40,30],blk:true,
   params:MWIN(),value:p=>p.f,unit:'Hz',
   draw:p=>sb(40,30)+tx('x̄',0,6,'btxt big')+sl(mwinF(p)?'M-30,-8 H-20 M-30,8 H-20 M20,0 H30':'M-30,0 H-20 M20,0 H30')},
  RMS:{name:'Ενεργός τιμή (RMS)',prefix:'RMS',group:'Σήματα',pins:{},spins:p=>mwinF(p)?{u:I(-30,-8),f:I(-30,8),y:O(30,0)}:{u:I(-30,0),y:O(30,0)},box:[-20,-15,40,30],blk:true,
   params:MWIN(),value:p=>p.f,unit:'Hz',
   draw:p=>sb(40,30)+tx('RMS',0,4,'bsm')+sl(mwinF(p)?'M-30,-8 H-20 M-30,8 H-20 M20,0 H30':'M-30,0 H-20 M20,0 H30')},
  MNMX:{name:'Ελάχιστο και μέγιστο ανά περίοδο',prefix:'MM',group:'Σήματα',pins:{},spins:{u:I(-30,0),min:O(30,-10),max:O(30,0),pp:O(30,10)},box:[-20,-18,40,36],blk:true,
   params:[num('f','Συχνότητα','Hz',50,{hint:'Η περίοδος είναι «Περίοδοι ανά παράθυρο» φορές 1/f.'}),num('np','Περίοδοι ανά παράθυρο','',1,{hint:'Ακέραιος, τουλάχιστον 1.'}),
    num('t0','Αρχή της πρώτης περιόδου','s',0,{signed:true,zero:true}),
    CLOCK({hint:'Προαιρετικό. Με ρολόι η περίοδος είναι η περίοδος του φέροντος του PWM (ή του μπλοκ Ρολόι) και η συχνότητα δεν χρησιμοποιείται.'}),
    num('y0','Αρχική έξοδος','',0,{signed:true,zero:true,hint:'Το ελάχιστο και το μέγιστο ως το τέλος της πρώτης περιόδου.'})],value:p=>p.f,unit:'Hz',
   draw:()=>sb(40,36)+tx('min',10,-6,'bsm')+tx('max',10,4,'bsm')+tx('p-p',10,14,'bsm')+sl('M-30,0 H-20 M20,-10 H30 M20,0 H30 M20,10 H30')},
  // 4.19.6 (§76): one harmonic of a signal (magnitude, phase, RMS and the two components), and its total harmonic distortion, over the
  // window of the mean and the RMS (MWIN)
  FOUR:{name:'Fourier: αρμονική ν',prefix:'FR',group:'Σήματα',pins:{},spins:p=>({...(mwinF(p)?{u:I(-30,-10),f:I(-30,10)}:{u:I(-30,0)}),mag:O(30,-20),ph:O(30,-10),rms:O(30,0),a:O(30,10),b:O(30,20)}),
   box:[-20,-25,40,50],blk:true,
   params:[num('nu','Τάξη αρμονικής ν','',1,{zero:true,hint:'0 = η συνεχής συνιστώσα, 1 = η θεμελιώδης. Με «Περίοδοι ανά παράθυρο» n το ν μπορεί να είναι και πολλαπλάσιο του 1/n (ενδιάμεσες αρμονικές)· αλλιώς η συνιστώσα δεν χωρά ακέραιες φορές στο παράθυρο και η μέτρηση έχει διαρροή από τις άλλες.'}),
    sel('ref','Φάση ως προς',[['sin','sin(νω₁t): u = |U|·sin(νω₁t + φ)'],['cos','cos(νω₁t): u = |U|·cos(νω₁t + φ)']],'sin',{hint:'Με «sin» μια πηγή AC με φάση φ δίνει φάση φ, όπως οι πηγές του εργαλείου. Οι έξοδοι a, b είναι οι συντελεστές της σειράς: u ≈ a·cos(νω₁t) + b·sin(νω₁t).'}),
    ...MWIN({...F1W,y0Hint:'Το πλάτος ως το τέλος του πρώτου παραθύρου (με φάση 0).'})],value:p=>p.f,unit:'Hz',
   draw:p=>sb(40,50)+tx('ν',-10,-1,'bsm')+tx(xe(String(p.nu??1).slice(0,4)),-10,9,'bsm')+tx('|U|',10,-17,'bsm')+tx('φ',13,-7,'bsm')+tx('rms',9,3,'bsm')+tx('a',13,13,'bsm')+tx('b',13,23,'bsm')
    +sl((mwinF(p)?'M-30,-10 H-20 M-30,10 H-20':'M-30,0 H-20')+' M20,-20 H30 M20,-10 H30 M20,0 H30 M20,10 H30 M20,20 H30')},
  THD:{name:'Ολική αρμονική παραμόρφωση (THD)',prefix:'THD',group:'Σήματα',pins:{},spins:p=>({...(mwinF(p)?{u:I(-30,-10),f:I(-30,10)}:{u:I(-30,0)}),thd:O(30,-15),h1:O(30,-5),hh:O(30,5),rms:O(30,15)}),
   box:[-20,-20,40,40],blk:true,
   params:[sel('dc','Συνεχής συνιστώσα',[['in','Μετρά στην παραμόρφωση (U_H² = U² − U₁²)'],['out','Δεν μετρά (U_H² = U² − U₁² − U₀²)']],'in',{hint:'Ο ορισμός του IEEE Std 1459 βάζει τη συνεχή συνιστώσα μέσα στο U_H. Με «Δεν μετρά» το THD είναι μόνο οι συνιστώσες με συχνότητα εκτός της θεμελιώδους.'}),
    sel('scale','Έξοδος THD',[['1','Λόγος (0,05 = 5 %)'],['%','Επί τοις εκατό']],'1'),
    ...MWIN({...F1W,y0Hint:'Το THD ως το τέλος του πρώτου παραθύρου (οι άλλες έξοδοι 0).'})],value:p=>p.f,unit:'Hz',
   draw:p=>sb(40,40)+tx('THD',8,-12,'bsm')+tx('U₁',11,-2,'bsm')+tx('U_H',10,8,'bsm')+tx('U',13,18,'bsm')
    +sl((mwinF(p)?'M-30,-10 H-20 M-30,10 H-20':'M-30,0 H-20')+' M20,-15 H30 M20,-5 H30 M20,5 H30 M20,15 H30')},
  // 4.19.6 (§76, THEORY §8Τ): power from a voltage and a current. PQ1: single phase over a window (IEEE Std 1459: P, and P₁, Q₁ of the
  // fundamental); PQ3: the instantaneous powers of the p-q theory (no window); PPOS: positive-sequence power over a window; SEQ: the
  // symmetrical components of a three-phase quantity over a window
  PQ1:{name:'Ισχύς (μονοφασική)',prefix:'PW',group:'Σήματα',pins:{},
   spins:p=>({v:I(-30,-10),i:I(-30,10),...(mwinF(p)?{f:I(-30,20)}:{}),p:O(30,-25),q1:O(30,-15),s:O(30,-5),pf:O(30,5),p1:O(30,15),pf1:O(30,25)}),box:[-20,-30,40,60],blk:true,
   params:[...MWIN({...F1W,y0Hint:'Το P ως το τέλος του πρώτου παραθύρου (οι άλλες έξοδοι 0).'})],value:p=>p.f,unit:'Hz',
   draw:p=>sb(40,60)+tx('v',-13,-7,'bsm')+tx('i',-13,13,'bsm')+tx('P',13,-22,'bsm')+tx('Q₁',11,-12,'bsm')+tx('S',13,-2,'bsm')+tx('PF',11,8,'bsm')+tx('P₁',11,18,'bsm')+tx('PF₁',9,28,'bsm')
    +sl('M-30,-10 H-20 M-30,10 H-20'+(mwinF(p)?' M-30,20 H-20':'')+' M20,-25 H30 M20,-15 H30 M20,-5 H30 M20,5 H30 M20,15 H30 M20,25 H30')},
  PQ3:{name:'Στιγμιαία ισχύς p, q (τριφασική)',prefix:'PQ',group:'Σήματα',pins:{},
   spins:p=>isBus(p)?{v:I(-30,-10),i:I(-30,10),p:O(30,-10),q:O(30,0),p0:O(30,10)}:{va:I(-30,-25),vb:I(-30,-15),vc:I(-30,-5),ia:I(-30,5),ib:I(-30,15),ic:I(-30,25),p:O(30,-10),q:O(30,0),p0:O(30,10)},
   box:p=>isBus(p)?[-20,-20,40,40]:[-20,-30,40,60],blk:true,bus:p=>isBus(p)?{v:['va','vb','vc'],i:['ia','ib','ic']}:{},
   params:[sel('qsign','Πρόσημο του q',[['lag','q > 0 για ρεύμα που καθυστερεί (επαγωγικό): q = v_β·i_α − v_α·i_β'],['orig','Ο αρχικός ορισμός: q = v_α·i_β − v_β·i_α']],'lag',
     {hint:'p = v_α·i_α + v_β·i_β, p₀ = v₀·i₀, με τον μετασχηματισμό Clarke που διατηρεί την ισχύ: p + p₀ = v_a·i_a + v_b·i_b + v_c·i_c σε κάθε στιγμή.'}),CONN('v abc και i abc')],value:()=>null,
   draw:p=>sb(40,isBus(p)?40:60)+tx('p',12,-7,'bsm')+tx('q',12,3,'bsm')+tx('p₀',11,13,'bsm')+tx('pq',-6,isBus(p)?4:4,'bsm')
    +(isBus(p)?sbl('M-30,-10 H-20 M-30,10 H-20')+sl('M20,-10 H30 M20,0 H30 M20,10 H30'):sl('M-30,-25 H-20 M-30,-15 H-20 M-30,-5 H-20 M-30,5 H-20 M-30,15 H-20 M-30,25 H-20 M20,-10 H30 M20,0 H30 M20,10 H30'))},
  PPOS:{name:'Ισχύς θετικής ακολουθίας',prefix:'PP',group:'Σήματα',pins:{},
   spins:p=>({...(isBus(p)?{v:I(-30,-10),i:I(-30,10)}:{va:I(-30,-25),vb:I(-30,-15),vc:I(-30,-5),ia:I(-30,5),ib:I(-30,15),ic:I(-30,25)}),...(mwinF(p)?{f:I(-30,isBus(p)?20:35)}:{}),
    p:O(30,-15),q:O(30,-5),v:O(30,5),i:O(30,15)}),box:p=>isBus(p)?[-20,-25,40,50]:[-20,-35,40,70],blk:true,bus:p=>isBus(p)?{v:['va','vb','vc'],i:['ia','ib','ic']}:{},
   params:[...MWIN({...F1W,y0Hint:'Το P⁺ ως το τέλος του πρώτου παραθύρου (οι άλλες έξοδοι 0).'}),CONN('v abc και i abc')],value:p=>p.f,unit:'Hz',
   draw:p=>sb(40,isBus(p)?50:70)+tx('P⁺',11,-12,'bsm')+tx('Q⁺',11,-2,'bsm')+tx('V⁺',11,8,'bsm')+tx('I⁺',11,18,'bsm')
    +(isBus(p)?sbl('M-30,-10 H-20 M-30,10 H-20'):sl('M-30,-25 H-20 M-30,-15 H-20 M-30,-5 H-20 M-30,5 H-20 M-30,15 H-20 M-30,25 H-20'))+sl((mwinF(p)?'M-30,'+(isBus(p)?20:35)+' H-20 ':'')+'M20,-15 H30 M20,-5 H30 M20,5 H30 M20,15 H30')},
  SEQ:{name:'Αναλυτής ακολουθιών',prefix:'SQ',group:'Σήματα',pins:{},
   spins:p=>({...(isBus(p)?{abc:I(-30,0)}:{a:I(-30,-10),b:I(-30,0),c:I(-30,10)}),...(mwinF(p)?{f:I(-30,20)}:{}),pos:O(30,-30),phpos:O(30,-20),neg:O(30,-10),phneg:O(30,0),zero:O(30,10),phzero:O(30,20),unb:O(30,30)}),
   box:[-20,-35,40,70],blk:true,bus:p=>isBus(p)?{abc:['a','b','c']}:{},
   params:[sel('amp','Μέτρο',[['pk','Πλάτος (κορυφή), όπως το Fourier'],['rms','Ενεργός τιμή']],'pk',{hint:'Οι φάσεις ως προς sin(ω₁t) από το t = 0, όπως στο Fourier: μια θετική ακολουθία με v_a = V̂·sin(ω₁t + φ) δίνει μέτρο V̂ και φάση φ.'}),
    ...MWIN({...F1W,y0Hint:'Το μέτρο της θετικής ακολουθίας ως το τέλος του πρώτου παραθύρου (οι άλλες έξοδοι 0).'}),CONN('abc')],value:p=>p.f,unit:'Hz',
   draw:p=>sb(40,70)+tx('+',12,-27,'bsm')+tx('∠+',11,-17,'bsm')+tx('−',12,-7,'bsm')+tx('∠−',11,3,'bsm')+tx('0',12,13,'bsm')+tx('∠0',11,23,'bsm')+tx('u₂',11,33,'bsm')
    +(isBus(p)?sbl('M-30,0 H-20'):sl('M-30,-10 H-20 M-30,0 H-20 M-30,10 H-20'))+sl((mwinF(p)?'M-30,20 H-20 ':'')+'M20,-30 H30 M20,-20 H30 M20,-10 H30 M20,0 H30 M20,10 H30 M20,20 H30 M20,30 H30')},
  // 4.19.6 (§76, THEORY §8Υ): the periodic average of impulses. The input is what the impulses add up to (an energy that rises by a
  // step at every switching, from «Μέτρηση στοιχείου»); the output is its rise over the window divided by the window (a power)
  PIA:{name:'Περιοδικός μέσος παλμών',prefix:'PIA',group:'Σήματα',pins:{},spins:p=>mwinF(p)?{u:I(-30,-8),f:I(-30,8),y:O(30,0)}:{u:I(-30,0),y:O(30,0)},box:[-20,-15,40,30],blk:true,
   params:MWIN({win:'per',fHint:'Το παράθυρο είναι «Περίοδοι ανά παράθυρο» φορές 1/f: για απώλειες μεταγωγής η συχνότητα μεταγωγής, ή ρολόι το PWM.',
    y0Hint:'Η έξοδος ως το τέλος του πρώτου παραθύρου. Η είσοδος είναι το άθροισμα των παλμών από την αρχή (π.χ. ενέργεια μεταγωγής σε J)· η έξοδος η αύξησή του στο παράθυρο διά το παράθυρο (σε W).'}),value:p=>p.f,unit:'Hz',
   draw:p=>sb(40,30)+tx('ΔΣ/T',0,4,'bsm')+sl(mwinF(p)?'M-30,-8 H-20 M-30,8 H-20 M20,0 H30':'M-30,0 H-20 M20,0 H30')},
  DISP:{name:'Ένδειξη',prefix:'DSP',group:'Σήματα',pins:{},spins:{u:I(-40,0)},box:[-30,-13,60,26],blk:true,params:[num('dig','Σημαντικά ψηφία','',4)],value:()=>null,
   draw:()=>'<rect class="block sblk" x="-30" y="-13" width="60" height="26" rx="3"/><rect class="thin" x="-24" y="-8" width="48" height="16" rx="2"/>'+tx('—',0,4,'bsm')+sl('M-40,0 H-30')},
  // subcircuits (3.17, ROADMAP §9): an instance draws the ports of its definition ($ports, copied by SubCircuit.sync);
  // inside a definition the ports are parts. The solvers never see these: SubCircuit.flatten replaces them.
  SUB:{name:'Υποκύκλωμα',prefix:'X',group:'Υποκυκλώματα',hidden:true,pins:p=>subLayout(p.$ports).pins,spins:p=>subLayout(p.$ports).spins,
   box:p=>{const L=subLayout(p.$ports);return [-L.W,-L.H,2*L.W,2*L.H];},params:[txt('def','Ορισμός','')],value:p=>p.$title||p.def||'—',
   draw:p=>subDraw(p)},
  PORT:{name:'Θύρα (ηλεκτρική)',prefix:'P',group:'Υποκυκλώματα',pins:{p:[-30,0]},box:[-20,-10,42,20],
   params:[txt('name','Όνομα ακροδέκτη','e1',{hint:'Το όνομα του ακροδέκτη στο σύμβολο του υποκυκλώματος. Χωρίς κενά, «:», «.» και «/».'}),portSide,WIDTH],value:()=>null,
   draw:p=>(+p.width>1?bl('M-30,0 H-20'):'<path d="M-30,0 H-20"/>')+'<path class="block" d="M-20,-9 H10 L20,0 L10,9 H-20 Z"/>'+tx(xe(String(p.name||'').slice(0,6)),-2,4,'bsm')},
  SIN:{name:'Θύρα εισόδου σήματος',prefix:'IN',group:'Υποκυκλώματα',pins:{},spins:{y:O(30,0)},box:[-22,-10,42,20],
   params:[txt('name','Όνομα εισόδου','u1',{hint:'Το σήμα που μπαίνει στο υποκύκλωμα από αυτόν τον ακροδέκτη του συμβόλου.'}),portSide,WIDTH],value:()=>null,
   draw:p=>'<path class="block sblk" d="M-22,-9 L-12,0 L-22,9 H20 V-9 Z"/>'+tx(xe(String(p.name||'').slice(0,6)),1,4,'bsm')+(+p.width>1?sbl:sl)('M20,0 H30')},
  SOUT:{name:'Θύρα εξόδου σήματος',prefix:'OUT',group:'Υποκυκλώματα',pins:{},spins:{u:I(-30,0)},box:[-20,-10,42,20],
   params:[txt('name','Όνομα εξόδου','y1',{hint:'Το σήμα που βγαίνει από το υποκύκλωμα σε αυτόν τον ακροδέκτη του συμβόλου.'}),portSide,WIDTH],value:()=>null,
   draw:p=>'<path class="block sblk" d="M-20,-9 H10 L20,0 L10,9 H-20 Z"/>'+tx(xe(String(p.name||'').slice(0,6)),-2,4,'bsm')+(+p.width>1?sbl:sl)('M-30,0 H-20')},
  // buses (3.18, ROADMAP §3): wiring only, Bus.expand takes them out before the solver
  MUX:{name:'Πολυπλέκτης (Mux): σήματα → δίαυλος',prefix:'MX',group:'Δίαυλοι',pins:{},spins:p=>{const n=nIO(p),o={};for(let k=0;k<n;k++)o['u'+(k+1)]=I(-20,ioY(n,k));o.y=O(20,0);return o;},
   box:p=>{const n=nIO(p);return [-8,-10*n-2,16,20*n+4];},
   params:[num('n','Είσοδοι','',3,{hint:'2 έως 8. Η έξοδος είναι δίαυλος με τις εισόδους στη σειρά, από πάνω προς τα κάτω. Μια είσοδος που είναι δίαυλος δίνει όλα της τα σήματα.'}),
    sel('frame','Τύπος διανύσματος',[['auto','Από τις εισόδους (π.χ. d, q → dq)'],['abc','abc'],['ab','αβ'],['dq','dq'],['none','Γενικό (χωρίς τύπο)']],'auto',{hint:'3.19: ο τύπος ελέγχεται στις συνδέσεις, ώστε ένα αβ να μη μπαίνει σε είσοδο dq. Με abc, αβ ή dq οι είσοδοι πρέπει να είναι οι συνιστώσες του με τη σειρά.'})],value:p=>nIO(p),unit:'',
   draw:p=>{const n=nIO(p);return `<rect class="block sblk" x="-4" y="${-10*n}" width="8" height="${20*n}" rx="2"/>`+sl(Array.from({length:n},(_,k)=>`M-20,${ioY(n,k)} H-4`).join(' '))+sbl('M4,0 H20');}},
  DEMUX:{name:'Αποπολυπλέκτης (Demux): δίαυλος → σήματα',prefix:'DX',group:'Δίαυλοι',pins:{},spins:p=>{const n=nIO(p),o={u:I(-20,0)};for(let k=0;k<n;k++)o['y'+(k+1)]=O(20,ioY(n,k));return o;},
   box:p=>{const n=nIO(p);return [-8,-10*n-2,16,20*n+4];},
   params:[num('n','Έξοδοι','',3,{hint:'2 έως 8. Ο δίαυλος χωρίζεται σε n ίσα μέρη, στη σειρά: με δίαυλο 6 και n = 3 κάθε έξοδος είναι δίαυλος 2.'})],value:p=>nIO(p),unit:'',
   draw:p=>{const n=nIO(p);return `<rect class="block sblk" x="-4" y="${-10*n}" width="8" height="${20*n}" rx="2"/>`+sbl('M-20,0 H-4')+sl(Array.from({length:n},(_,k)=>`M4,${ioY(n,k)} H20`).join(' '));}},
  BSEL:{name:'Επιλογή από δίαυλο',prefix:'BS',group:'Δίαυλοι',pins:{},spins:{u:I(-30,0),y:O(30,0)},box:[-20,-12,40,24],
   params:[txt('idx','Στοιχεία (από 1)','1, 2',{hint:'Ποια στοιχεία του διαύλου βγαίνουν, με τη σειρά, π.χ. «2, 1» αντιστρέφει δύο σήματα (dq → qd), «3» δίνει μόνο το τρίτο. Ένα στοιχείο μπορεί να επαναληφθεί.'})],value:()=>null,
   draw:p=>sb(40,24)+tx('['+xe(String(p.idx||'').replace(/\s+/g,'').slice(0,7))+']',0,4,'bsm')+sbl('M-30,0 H-20')+(String(p.idx||'').split(/[,;\s]+/).filter(Boolean).length>1?sbl:sl)('M20,0 H30')},
  EBUS:{name:'Δίαυλος αγωγών (π.χ. τριφασικός)',prefix:'B',group:'Δίαυλοι',pins:p=>{const n=nEL(p),o={};for(let k=0;k<n;k++)o['abcdef'[k]]=[-20,ioY(n,k)];o.bus=[20,0];return o;},
   box:p=>{const n=nEL(p);return [-8,-10*n-2,16,20*n+4];},
   params:[num('n','Αγωγοί','',3,{hint:'2 έως 6, ακροδέκτες a, b, c, … Ο ακροδέκτης «bus» είναι ένας ηλεκτρικός δίαυλος με τους αγωγούς στη σειρά: δύο δίαυλοι ενώνονται αγωγό προς αγωγό (a με a, b με b, …), όπως οι ακροδέκτες «abc» των τριφασικών στοιχείων.'})],value:p=>nEL(p),unit:'',
   draw:p=>{const n=nEL(p);return `<rect class="block busbar" x="-4" y="${-10*n}" width="8" height="${20*n}" rx="2"/>`+`<path d="${Array.from({length:n},(_,k)=>`M-20,${ioY(n,k)} H-4`).join(' ')}"/>`+bl('M4,0 H20')+Array.from({length:n},(_,k)=>tx('abcdef'[k],-13,ioY(n,k)-3,'bsm')).join('');}},
  // network library (4.1, ROADMAP §31): each of these is a subcircuit made from its parameters by netlib.js
  // (NetLib.defOf), out of the primitive parts above, so both solvers, the buses and the channels see it as such
  // 4.24: other names in the search of the library (a three-phase source with a short-circuit level is this part)
  GRID3:{name:'Ισοδύναμο δικτύου (S″k, X/R, Z₀)',prefix:'NET',group:'Δίκτυο',alias:['τριφασική πηγή με στάθμη βραχυκύκλωσης','πηγή τάσης δικτύου','ισχύς βραχυκύκλωσης','Sk','S″k','IEC 60909'],pins:p=>{const n=neutOf(p,'neut','gnd')==='pin'?{n:[0,40]}:{};return isBus(p)?{abc:[40,0],...n}:{a:[40,-20],b:[40,0],c:[40,20],...n};},box:[-20,-30,40,60],
   bus:p=>isBus(p)?{abc:['a','b','c']}:{},
   params:[num('Un','Ονομαστική πολική τάση U_n','V',20e3),num('f','Συχνότητα','Hz',50),num('phase','Φάση της a','°',0,{signed:true,zero:true}),
    num('cf','Συντελεστής τάσης c (IEC 60909)','',1.1,{hint:'Η ΗΕΔ είναι c·U_n/√3 και Z₁ = c·U_n²/S″k, οπότε ένα τριφασικό βραχυκύκλωμα στα άκρα δίνει I″k3 = S″k/(√3·U_n). c = 1 για ΗΕΔ ίση με την ονομαστική.'}),
    sel('emf','ΗΕΔ της πηγής',[['c','c·U_n/√3 (όπως ως τώρα)'],['un','U_n/√3, το c μόνο στο Z₁']],'c',{hint:'«U_n/√3»: η ΗΕΔ είναι η ονομαστική και το c μένει μόνο στο Z₁ = c·U_n²/S″k, οπότε το τριφασικό βραχυκύκλωμα στα άκρα δίνει S″k/(√3·U_n·c) (4.2).'}),
    num('Sk','S″k τριφασικό','VA',500e6),num('XR','X/R θετικής ακολουθίας','',10),
    sel('z0','Μηδενική ακολουθία',[['ratio','Z₀/Z₁ και X₀/R₀'],['sk1','S″k1 μονοφασικό και X₀/R₀'],['iso','Μονωμένος ουδέτερος']],'ratio',{hint:'Μέσα είναι εμπέδηση 3×3 με Z_s = (2Z₁ + Z₀)/3 και Z_m = (Z₀ − Z₁)/3: δίνει σωστά ρεύματα σε κάθε είδος σφάλματος χωρίς να «ξέρει» το σφάλμα.'}),
    num('Z0Z1','|Z₀|/|Z₁|','',1,{show:p=>(p.z0||'ratio')==='ratio'}),num('Sk1','S″k1 μονοφασικό','VA',400e6,{show:p=>p.z0==='sk1',hint:'I″k1 = √3·c·U_n/|2Z₁ + Z₀|, με S″k1 = √3·U_n·I″k1.'}),
    num('XR0','X₀/R₀','',10,{show:p=>p.z0!=='iso'}),num('Rn','Αντίσταση γείωσης ουδετέρου R_n','Ω',0,{zero:true,show:p=>(p.z0||'ratio')==='ratio'&&neutOf(p,'neut','gnd')==='gnd',hint:'Προστίθεται 3R_n στη μηδενική ακολουθία (μέσα στο Z₀, χωρίς κόμβο ουδετέρου).'}),
    ...NEUT('neut','gnd',{show:p=>p.z0!=='iso',hint:'«Στερεά γειωμένος»: όπως ως την 4.23, το Z₀ του δικτύου (με το R_n παραπάνω).'}),CONN('abc')],
   value:p=>p.Sk,unit:'VA',
   draw:p=>'<rect class="block" x="-20" y="-30" width="40" height="60" rx="6"/>'+(isBus(p)?bl('M20,0 H40'):'<path d="M20,-20 H40 M20,0 H40 M20,20 H40"/>')+(p.z0!=='iso'&&neutOf(p,'neut','gnd')==='pin'?'<path d="M0,30 V40"/>':'')+'<path class="thin" d="M-12,-14 c3,-8 6,-8 8,0 c2,8 5,8 8,0 M-12,8 H12 M-12,16 H12 M-6,24 H6"/>'+tx('S″k',0,-20,'bsm')},
  FLT3:{name:'Σφάλμα (βραχυκύκλωμα)',prefix:'F',group:'Δίκτυο',pins:p=>isBus(p)?{abc:[0,-40]}:{a:[-20,-40],b:[0,-40],c:[20,-40]},box:[-25,-30,50,50],
   bus:p=>isBus(p)?{abc:['a','b','c']}:{},spins:p=>p.ctl==='sig'?{f:I(-40,0)}:{},
   params:[sel('kind','Είδος',[['ag','a–γη'],['bg','b–γη'],['cg','c–γη'],['ab','a–b'],['bc','b–c'],['ca','c–a'],['abg','a–b–γη'],['bcg','b–c–γη'],['cag','c–a–γη'],['abc','a–b–c'],['abcg','a–b–c–γη']],'abc'),
    num('Rf','R_f ανά φάση','Ω',0,{zero:true,hint:'0 = μεταλλικό (10⁻⁴ Ω μέσα στο κύκλωμα).'}),num('Rg','R_g προς γη','Ω',0,{zero:true,show:p=>/g$/.test(p.kind||'abc')}),
    sel('ctl','Χειρισμός',[['time','Χρόνοι'],['sig','Από σήμα (ακροδέκτης f ≥ 0,5)']],'time'),
    num('ton','Έναρξη','s',0.04,{zero:true,show:p=>p.ctl!=='sig'}),num('toff','Εκκαθάριση (0 = ποτέ)','s',0,{zero:true,show:p=>p.ctl!=='sig'}),
    sel('clr','Εκκαθάριση στο',[['inst','Αμέσως (ιδανικός διακόπτης)'],['zero','Μηδενισμό του ρεύματος κάθε φάσης (ζεύγος θυρίστορ, όπως ο διακόπτης)']],'inst',{hint:'Αμέσως: το ρεύμα των αυτεπαγωγών κόβεται απότομα και δίνει υπέρταση. Στον μηδενισμό: όπως ένας διακόπτης ισχύος.'}),CONN('abc')],
   value:p=>p.kind,unit:'',
   draw:p=>'<rect class="block" x="-25" y="-30" width="50" height="50" rx="4"/>'+(isBus(p)?bl('M0,-40 V-30'):'<path d="M-20,-40 V-30 M0,-40 V-30 M20,-40 V-30"/>')+'<path class="fill" d="M3,-24 L-8,-3 L0,-3 L-5,14 L9,-8 L1,-8 L7,-24 Z"/>'+(p.ctl==='sig'?sl('M-40,0 H-25'):'')},
  CB3:{name:'Διακόπτης ισχύος (τριφασικός)',prefix:'CB',group:'Δίκτυο',pins:p=>isBus(p)?{abc1:[-40,0],abc2:[40,0]}:{a1:[-40,-20],b1:[-40,0],c1:[-40,20],a2:[40,-20],b2:[40,0],c2:[40,20]},box:[-25,-30,50,60],
   bus:p=>isBus(p)?{abc1:['a1','b1','c1'],abc2:['a2','b2','c2']}:{},spins:p=>p.ctl==='sig'?{cmd:I(0,40)}:{},
   params:[sel('ctl','Χειρισμός',[['time','Πρόγραμμα εντολών'],['sig','Από σήμα (ακροδέκτης cmd: ≥ 0,5 κλειστός)']],'time'),
    txt('cmd','Εντολές t:κατάσταση','0:1, 0.1:0',{show:p=>p.ctl!=='sig',hint:'1 = κλείσιμο, 0 = άνοιγμα. Κάθε πόλος ανοίγει στο πρώτο μηδέν του ρεύματός του μετά την εντολή (αντιπαράλληλα θυρίστορ από σήμα).'}),
    sel('model','Πόλος',[['ideal','Ιδανικός: ανοίγει στο πρώτο μηδέν'],['arc','Με τόξο (4.9)']],'ideal',{hint:'Με τόξο: κάθε πόλος είναι ένα μοντέλο τόξου από τον χωρισμό των επαφών (η εντολή 0)· το ρεύμα διακόπτεται σε ένα μηδέν αν το τόξο ψυχθεί απέναντι στην TRV.'}),
    ...arcParams(p=>p.model==='arc'),
    num('Ron','R_on ανά πόλο','Ω',1e-4),num('Roff','R_off ανά πόλο','Ω',1e6,{show:p=>p.model!=='arc'}),
    bool('vm','Μέτρηση τάσης πόλων (TRV)',false,{hint:'Κανάλια CB1/Va, CB1/Vb, CB1/Vc: η τάση ανάμεσα στις δύο πλευρές κάθε πόλου, για τη μεταβατική τάση επαναφοράς (pcl.network.trv) (4.2).'}),CONN('abc')],
   value:()=>null,
   draw:p=>'<rect class="block" x="-25" y="-30" width="50" height="60" rx="4"/>'+(isBus(p)?bl('M-40,0 H-25 M25,0 H40'):'<path d="M-40,-20 H-25 M-40,0 H-25 M-40,20 H-25 M25,-20 H40 M25,0 H40 M25,20 H40"/>')+'<path class="thin" d="M-14,0 H-6 L8,-10 M8,0 H14"/>'+tx('CB',0,22,'bsm')+(p.ctl==='sig'?sl('M0,40 V30'):'')},
  ARCX:{name:'Τμήμα τόξου',prefix:'AX',group:'Δίκτυο',hidden:true,pins:{a:[-20,0],b:[20,0]},spins:{g:I(0,-20)},box:[-12,-8,24,16],
   params:[num('lam','Εκθέτης λ','',2),num('tau0','τ₀','s',0.27e-6),num('alpha','α','',0),num('P0','Π (P₀)','',15917),num('P1','P₁','',0),num('beta','β','',0),
    num('Ron','R κλειστού','Ω',1e-4),num('gmin','g_min','S',1e-12)],value:()=>null,
   draw:()=>'<path d="M-20,0 H-10 M10,0 H20"/><path class="thin" d="M-10,0 C-6,-6 -2,6 2,0 S8,-4 10,0"/>'},
  ARC:{name:'Διακόπτης με τόξο (μονοφασικός)',prefix:'CBA',group:'Δίκτυο',pins:{a:[-40,0],b:[40,0]},box:[-25,-16,50,32],spins:p=>p.ctl==='sig'?{cmd:I(0,30)}:{},
   params:[sel('ctl','Χειρισμός',[['time','Πρόγραμμα εντολών'],['sig','Από σήμα (ακροδέκτης cmd: ≥ 0,5 κλειστός)']],'time'),
    txt('cmd','Εντολές t:κατάσταση','0:1, 0.005:0',{show:p=>p.ctl!=='sig',hint:'1 = κλειστός, 0 = χωρισμός των επαφών (αρχή του τόξου). Το ρεύμα διακόπτεται σε ένα μηδέν του, αν το τόξο ψυχθεί αρκετά απέναντι στη μεταβατική τάση επαναφοράς· αλλιώς επανέναυση ως το επόμενο μηδέν.'}),
    ...arcParams(),num('Ron','R κλειστού','Ω',1e-4),
    bool('vm','Μέτρηση τάσης (TRV)',true,{hint:'Κανάλι V:<id>/V: η τάση ανάμεσα στους ακροδέκτες (a − b).'})],
   value:p=>(ARC_MODELS.find(m=>m[0]===(p.arc||'imayr'))||ARC_MODELS[0])[0],
   draw:p=>'<rect class="block" x="-25" y="-16" width="50" height="32" rx="4"/><path d="M-40,0 H-25 M25,0 H40"/><path class="thin" d="M-14,4 H-6 L8,-6 M8,4 H14"/><path class="thin" d="M-4,-1 C-2,-5 0,1 2,-3 S5,-2 6,-4"/>'+tx('CB~',0,13,'bsm')+(p.ctl==='sig'?sl('M0,30 V16'):'')},
  XF3:{name:'Μετασχηματιστής τριφασικός (ομάδα σύνδεσης)',prefix:'TR',group:'Δίκτυο',pins:p=>{const n={...(xfNeut(p,1)==='pin'?{n1:[-10,40]}:{}),...(xfNeut(p,2)==='pin'?{n2:[10,40]}:{})};
    return isBus(p)?{abc1:[-40,0],abc2:[40,0],...n}:{a1:[-40,-20],b1:[-40,0],c1:[-40,20],a2:[40,-20],b2:[40,0],c2:[40,20],...n};},box:[-25,-30,50,60],
   bus:p=>isBus(p)?{abc1:['a1','b1','c1'],abc2:['a2','b2','c2']}:{},
   params:[sel('grp','Ομάδα σύνδεσης',[['Yy0','Yy0'],['YNyn0','YNyn0'],['Yyn0','Yyn0'],['YNy0','YNy0'],['Yd1','Yd1'],['Yd11','Yd11'],['YNd1','YNd1'],['YNd11','YNd11'],['Dy1','Dy1'],['Dy11','Dy11'],['Dyn1','Dyn1'],['Dyn11','Dyn11'],['Dd0','Dd0']],'Dyn11',
     {hint:'Κεφαλαίο: πλευρά 1 (a1, b1, c1), μικρό: πλευρά 2. N/n: ουδέτερος γειωμένος. Ο αριθμός × 30° είναι η καθυστέρηση της πλευράς 2 (11 = προπορεία 30°).'}),
    num('Sn','Ονομαστική ισχύς S_n','VA',40e6),num('U1','Πολική τάση πλευράς 1','V',150e3),num('U2','Πολική τάση πλευράς 2','V',20e3),num('f','Συχνότητα','Hz',50),
    num('uk','Τάση βραχυκύκλωσης u_k','%',10),num('Pk','Απώλειες χαλκού P_k','W',0,{zero:true}),num('i0','Ρεύμα κενού i_0','%',0.5,{zero:true,hint:'0 = χωρίς ρεύμα μαγνήτισης (πολύ μεγάλη L_m).'}),num('P0','Απώλειες σιδήρου P_0','W',0,{zero:true}),
    num('tap','Τάπ στην πλευρά 1','%',0,{signed:true,zero:true,hint:'+2,5 % = 2,5 % περισσότερες σπείρες στην πλευρά 1 (χαμηλότερη τάση στην πλευρά 2).'}),
    sel('core','Πυρήνας',[['3x1','Τρεις μονοφασικοί (όπως ως τώρα)'],['5leg','Πέντε σκελών ή shell'],['3leg','Τριών σκελών']],'3x1',{hint:'Τριών σκελών: η ροή μηδενικής ακολουθίας κλείνει από τον αέρα και το δοχείο, οπότε η μαγνήτιση μηδενικής ακολουθίας είναι μικρή και γραμμική, στην πλευρά 1 (Dommel, EMTP Theory Book, κεφ. 6). Πέντε σκελών και shell: ίδια με τη θετική, όπως οι τρεις μονοφασικοί (4.2).'}),
    num('i00','Ρεύμα κενού μηδενικής ακολουθίας i₀₀','%',100,{show:p=>p.core==='3leg',hint:'Ρεύμα μαγνήτισης με τάση μηδενικής ακολουθίας ίση με την ονομαστική φασική, στην πλευρά 1. 100 % = X₀m ίση με την εμπέδηση βάσης.'}),
    // 5.0.1 (ROADMAP §56, THEORY §8ΩΖ): the saturable core of each unit, the place of its branch and the split of the leakage
    sel('sat','Μαγνήτιση',[['lin','Γραμμική (όπως ως τώρα)'],['two','Κορεσμός: δύο κλίσεις (γόνατο και πυρήνας αέρα)'],['tab','Κορεσμός: σημεία ψ–i σε pu'],['rms','Κορεσμός: από τη δοκιμή κενού (rms)']],'lin',
     {hint:'Κάθε μονοφασική μονάδα έχει τον δικό της κλάδο μαγνήτισης με καμπύλη ψ–i κατά τμήματα (στην πλευρά 1), σε κάθε ομάδα σύνδεσης. Δύο κλίσεις αρκούν για τα περισσότερα φαινόμενα· ο σιδηροσυντονισμός θέλει πιο λεπτομερή καμπύλη (Part III των IEEE PES TF, σελ. 2054).'}),
    num('psiK','Ροή στο γόνατο ψ_k','pu',1.2,{show:p=>p.sat==='two',hint:'Σε pu της ονομαστικής κορυφής √2·U/ω. Ως το γόνατο η κλίση είναι η X_m του i₀ (X_m = 100/i₀ pu)· συνήθως 1,1–1,25 pu.'}),
    txt('satTab','Σημεία «ρεύμα: ροή» σε pu (κορυφές)','0.005: 1, 0.02: 1.15, 0.1: 1.25',{show:p=>p.sat==='tab',hint:'Ρεύμα σε pu της ονομαστικής κορυφής √2·I_n της πλευράς 1, ροή σε pu της √2·U/ω. Ο θετικός κλάδος, χωρίς το (0, 0)· η καμπύλη είναι συμμετρική.'}),
    txt('satRms','Δοκιμή κενού «ρεύμα: τάση» (% rms: pu rms)','0.3: 0.9, 0.5: 1, 1.5: 1.1, 5: 1.2',{show:p=>p.sat==='rms',hint:'Από την πλευρά 1, ρεύμα σε % του ονομαστικού και τάση σε pu. Το μέρος των απωλειών (P₀ με σταθερή R_fe) αφαιρείται, και τα rms γίνονται καμπύλη κορυφών σημείο προς σημείο (THEORY §8ΩΖ).'}),
    num('Xac','Αντίδραση πυρήνα αέρα X_ac από την πλευρά 1','pu',0,{zero:true,show:p=>p.sat&&p.sat!=='lin',hint:'0 = Αυτόματα: 2·u_k (η πρακτική του PSCAD). Μετά το τελευταίο σημείο της καμπύλης η κλίση του κλάδου είναι X_ac μείον τη σκέδαση από την πλευρά 1 ως τον κλάδο. Συνήθως 0,3–0,8 pu σε μεγάλους μετασχηματιστές, 0,05–0,15 pu σε μετασχηματιστές διανομής (Part III, σελ. 2054).'}),
    num('psiRa','Παραμένουσα ροή φάσης a','pu',0,{signed:true,zero:true,show:p=>p.sat&&p.sat!=='lin',hint:'Σε pu της ονομαστικής κορυφής, στη μονάδα της φάσης a. Κρατιέται όσο ο μετασχηματιστής είναι εκτός και σβήνει σε περίπου μία περίοδο μετά τη ζεύξη (THEORY §8ΩΖ). Μετρημένες τιμές: 40–90 %.'}),
    num('psiRb','Παραμένουσα ροή φάσης b','pu',0,{signed:true,zero:true,show:p=>p.sat&&p.sat!=='lin'}),num('psiRc','Παραμένουσα ροή φάσης c','pu',0,{signed:true,zero:true,show:p=>p.sat&&p.sat!=='lin'}),
    sel('mpos','Θέση του κλάδου μαγνήτισης',[['mid','Στη μέση, μετά τη σκέδαση της πλευράς 1 (όπως ως τώρα)'],['w1','Στους ακροδέκτες της πλευράς 1'],['w2','Στους ακροδέκτες της πλευράς 2']],'mid',{hint:'Με κορεσμό η θέση μετρά (Part III, σελ. 2052). Το PSCAD τον βάζει συνήθως στο τύλιγμα που είναι πιο κοντά στον πυρήνα.'}),
    num('xs1','Μερίδιο της πλευράς 1 στη σκέδαση','%',50,{hint:'Όπως ως τώρα: 50 %. Όταν μετρά ο κορεσμός, το Part III προτείνει 75–90 % στην πλευρά υψηλής τάσης (εξωτερικό τύλιγμα, σελ. 2053).'}),
    ...NEUT('neut1','auto',{sfx:'1',label:'Ουδέτερος πλευράς 1',vals:['auto','gnd','z','iso','pin'],auto:'Όπως η ομάδα (N: στερεά, χωρίς N: μονωμένος)',show:p=>xfStar(p,1)}),
    ...NEUT('neut2','auto',{sfx:'2',label:'Ουδέτερος πλευράς 2',vals:['auto','gnd','z','iso','pin'],auto:'Όπως η ομάδα (n: στερεά, χωρίς n: μονωμένος)',show:p=>xfStar(p,2)}),CONN('abc')],
   value:p=>p.grp,unit:'',
   draw:p=>'<rect class="block" x="-25" y="-30" width="50" height="60" rx="4"/>'+(isBus(p)?bl('M-40,0 H-25 M25,0 H40'):'<path d="M-40,-20 H-25 M-40,0 H-25 M-40,20 H-25 M25,-20 H40 M25,0 H40 M25,20 H40"/>')+(xfNeut(p,1)==='pin'?'<path d="M-10,30 V40"/>':'')+(xfNeut(p,2)==='pin'?'<path d="M10,30 V40"/>':'')+'<circle class="thin" cx="-6" cy="-4" r="11"/><circle class="thin" cx="6" cy="-4" r="11"/>'+tx(xe(String(p.grp||'')),0,22,'bsm')},
  LOAD3:{name:'Τριφασικό φορτίο (P, Q)',prefix:'LD',group:'Δίκτυο',pins:p=>{const n=p&&p.cn!=='d'&&neutOf(p,'neut','auto')==='pin'?{n:[0,30]}:{};return isBus(p)?{abc:[0,-40],...n}:{a:[-20,-40],b:[0,-40],c:[20,-40],...n};},box:[-25,-30,50,50],
   bus:p=>isBus(p)?{abc:['a','b','c']}:{},
   params:[sel('cn','Σύνδεση',[['yn','Y με γειωμένο ουδέτερο'],['y','Y χωρίς γείωση'],['d','Δ']],'yn'),num('Un','Ονομαστική πολική τάση U_n','V',20e3),num('f','Συχνότητα','Hz',50),
    num('P','Ενεργός ισχύς P (στην U_n)','W',10e6,{zero:true}),num('Q','Άεργος ισχύς Q (στην U_n)','var',3e6,{signed:true,zero:true,hint:'Θετική: επαγωγική (L), αρνητική: χωρητική (C). Σταθερή εμπέδηση: R ∥ X ανά φάση.'}),
    sel('model','Μοντέλο',[['z','Σταθερή εμπέδηση (όπως ως τώρα)'],['zip','ZIP (εμπέδηση, ρεύμα, ισχύς)']],'z',{hint:'ZIP: P(V) = P·(z·V² + i·V + p), το ίδιο το Q, με V = |V|/U_n από το διάνυσμα αβ των τάσεων (4.2). Τα μέρη i και p είναι πηγές ρεύματος από σήμα.'}),
    num('kz','z (σταθερή εμπέδηση)','%',0,{zero:true,show:p=>p.model==='zip'}),num('ki','i (σταθερό ρεύμα)','%',0,{zero:true,show:p=>p.model==='zip'}),num('kp','p (σταθερή ισχύς)','%',100,{zero:true,show:p=>p.model==='zip'}),
    num('Vmin','Κάτω από V_min: σταθερή εμπέδηση','%',70,{show:p=>p.model==='zip',hint:'Τα μέρη i και p γίνονται σταθερή εμπέδηση κάτω από αυτή την τάση (π.χ. σε σφάλμα), όπως στα προγράμματα ροής φορτίου.'}),
    ...NEUT('neut','auto',{vals:['auto','gnd','z','iso','pin'],auto:'Όπως η σύνδεση (Y με γείωση: στερεά, Y χωρίς γείωση: μονωμένος)',show:p=>p.cn!=='d'}),CONN('abc')],
   value:p=>p.P,unit:'W',
   draw:p=>'<rect class="block" x="-25" y="-30" width="50" height="50" rx="4"/>'+(isBus(p)?bl('M0,-40 V-30'):'<path d="M-20,-40 V-30 M0,-40 V-30 M20,-40 V-30"/>')+'<path class="thin" d="M-12,-18 V8 M0,-18 V8 M12,-18 V8 M-16,8 H16"/>'+tx('P,Q',0,17,'bsm')},
  // 4.3 (§31.6, §25): synchronous generator with field and dampers, a shaft of one or more masses, steady start from the
  // terminal voltage of a load flow. Per unit on S_n, U_n (reactances, resistances), times in s.
  GEN3:{machine:{kind:'gen',speed:'w',torque:'te',voltage:'vt',inputs:{exc:'efd',mech:'tm'},inertia:'H',supply:'δίκτυο (γεννήτρια)'},name:'Σύγχρονη γεννήτρια (διέγερση, αποσβεστήρες, άξονας)',prefix:'G',group:'Δίκτυο',pins:p=>{const o=isBus(p)?{abc:[40,0]}:{a:[40,-20],b:[40,0],c:[40,20]};if(p.neut==='pin')o.n=[40,40];return o;},
   box:p=>[-30,-35,60,p.shaft==='multi'?80:70],bus:p=>isBus(p)?{abc:['a','b','c']}:{},spins:p=>genSpins(p),
   params:[num('Sn','Ονομαστική ισχύς S_n (βάση των ανά μονάδα)','VA',100e6),num('Un','Ονομαστική πολική τάση U_n','V',13.8e3),num('f','Συχνότητα','Hz',50),num('pp','Ζεύγη πόλων p','',1),
    sel('data','Δεδομένα μηχανής',[['std','Τυπικά: X_d, X′_d, X″_d, T′_d0, …'],['circ','Κύκλωμα δρομέα: X_ad, X_fd, R_fd, …']],'std',{hint:'Τυπικά δεδομένα: μετατρέπονται στο κύκλωμα του δρομέα (διέγερση και έως ένας αποσβεστήρας στον άξονα d, έως δύο στον q). Ένα τύλιγμα παραλείπεται όταν η σταθερά χρόνου του είναι 0.'}),
    sel('conv','Μετατροπή σε κύκλωμα',[['exact','Ακριβής (ορισμοί IEEE 115)'],['class','Κλασική (προσεγγιστική)']],'exact',{show:p=>p.data!=='circ',hint:'Ακριβής: οι σταθερές χρόνου βραχυκύκλωσης και ανοιχτού κυκλώματος είναι ακριβώς οι ρίζες του κυκλώματος, όπως στο παράρτημα του IEEE First Benchmark Model. Κλασική: οι προσεγγιστικοί τύποι (T′_d0 για τη διέγερση μόνη, T″_d0 για τον αποσβεστήρα).'}),
    num('Ra','Αντίσταση στάτη R_a','pu',0.003,{zero:true}),num('Xl','Σκέδαση στάτη X_l','pu',0.15,{zero:true}),num('X0','Μηδενική ακολουθία X₀','pu',0.15,{hint:'Αυτεπαγωγή μηδενικής ακολουθίας του στάτη (συνήθως κοντά στη X_l).'}),
    num('Xd','X_d','pu',1.81,{show:p=>p.data!=='circ'}),num('Xdp','X′_d','pu',0.3,{show:p=>p.data!=='circ'}),num('Xdpp','X″_d','pu',0.23,{show:p=>p.data!=='circ'}),
    num('Xq','X_q','pu',1.76,{show:p=>p.data!=='circ'}),num('Xqp','X′_q','pu',0.65,{show:p=>p.data!=='circ',hint:'Ίση με X_q (ή T′_q0 = 0): χωρίς αργό τύλιγμα στον άξονα q (μηχανή έκτυπων πόλων).'}),num('Xqpp','X″_q','pu',0.25,{show:p=>p.data!=='circ'}),
    num('Td0p','T′_d0','s',8,{show:p=>p.data!=='circ'}),num('Td0pp','T″_d0','s',0.03,{zero:true,show:p=>p.data!=='circ',hint:'0: χωρίς αποσβεστήρα στον άξονα d.'}),
    num('Tq0p','T′_q0','s',1,{zero:true,show:p=>p.data!=='circ'}),num('Tq0pp','T″_q0','s',0.07,{zero:true,show:p=>p.data!=='circ'}),
    num('cXad','X_ad','pu',1.66,{show:p=>p.data==='circ'}),num('cXfd','X_fd (σκέδαση διέγερσης)','pu',0.062,{zero:true,show:p=>p.data==='circ'}),num('cRfd','R_fd','pu',0.0014,{show:p=>p.data==='circ',hint:'Σε ανά μονάδα. Αν η πηγή δίνει 377·R (όπως ο Πίνακας I του First Benchmark), διαίρεσε με 377.'}),
    num('cXkd','X_kd (αποσβεστήρας d)','pu',0.0055,{zero:true,show:p=>p.data==='circ'}),num('cRkd','R_kd','pu',0.0041,{zero:true,show:p=>p.data==='circ',hint:'0: χωρίς αποσβεστήρα d.'}),
    num('cXaq','X_aq','pu',1.58,{show:p=>p.data==='circ'}),num('cX1q','X_1q','pu',0.326,{zero:true,show:p=>p.data==='circ'}),num('cR1q','R_1q','pu',0.0141,{zero:true,show:p=>p.data==='circ',hint:'0: χωρίς αυτό το τύλιγμα.'}),
    num('cX2q','X_2q','pu',0.095,{zero:true,show:p=>p.data==='circ'}),num('cR2q','R_2q','pu',0.0082,{zero:true,show:p=>p.data==='circ'}),
    sel('shaft','Άξονας',[['one','Μία μάζα (H, D)'],['multi','Πολλές μάζες με ελατήρια']],'one',{hint:'Ανά μονάδα: 2H·dω/dt = T, dδ/dt = ω_b·(ω − 1) με δ σε ηλεκτρικά rad, K σε ανά μονάδα ροπή ανά rad, D σε ανά μονάδα ροπή ανά ανά μονάδα ταχύτητα.'}),
    num('H','Σταθερά αδράνειας H','s',3.5,{show:p=>p.shaft!=='multi'}),num('D','Απόσβεση D','pu',0,{zero:true,show:p=>p.shaft!=='multi'}),
    txt('Hm','H ανά μάζα (s, με «;»)','0.6; 2.5; 0.05',{show:p=>p.shaft==='multi',hint:'Από τη μία άκρη του άξονα στην άλλη, π.χ. στρόβιλοι, γεννήτρια, διεγέρτρια.'}),
    txt('Km','K ανά τμήμα άξονα (pu/rad, με «;»)','40; 3',{show:p=>p.shaft==='multi',hint:'Ένα λιγότερο από τις μάζες: το τμήμα k ενώνει τις μάζες k και k + 1.'}),
    txt('Dm','D ανά μάζα (pu, με «;»)','0; 0; 0',{show:p=>p.shaft==='multi',hint:'Απόσβεση ως προς τη σύγχρονη ταχύτητα: D·(ω − 1).'}),
    txt('Dmu','D ανά τμήμα άξονα (pu, με «;»)','0; 0',{show:p=>p.shaft==='multi',hint:'Αμοιβαία απόσβεση D·(ω_k − ω_k+1).'}),
    txt('Tfr','Μερίδιο της T_m ανά μάζα (%, με «;»)','100; 0; 0',{show:p=>p.shaft==='multi'}),num('gm','Μάζα της γεννήτριας (αριθμός)','',2,{show:p=>p.shaft==='multi'}),
    sel('exc','Τάση διέγερσης E_fd',[['init','Από τη μόνιμη κατάσταση (σταθερή)'],['sched','Τιμή ή πρόγραμμα'],['sig','Από σήμα (ακροδέκτης efd)']],'init',{hint:'E_fd σε ανά μονάδα στην ευθεία του διακένου: E_fd = 1 δίνει 1 pu τάση χωρίς φορτίο.'}),
    txt('Efd','E_fd(t)','1',{show:p=>p.exc==='sched',hint:'Σταθερή τιμή ή «t:τιμή» σε pu.'}),
    sel('mech','Μηχανική ροπή T_m',[['init','Από τη μόνιμη κατάσταση (σταθερή)'],['sched','Τιμή ή πρόγραμμα'],['sig','Από σήμα (ακροδέκτης tm)']],'init'),
    txt('Tm','T_m(t)','0',{show:p=>p.mech==='sched',hint:'Σταθερή τιμή ή «t:τιμή» σε pu, μοιρασμένη στις μάζες κατά τα μερίδια.'}),
    sel('init','Αρχική κατάσταση',[['lf','Μόνιμη κατάσταση από την τάση ακροδεκτών (ροή φορτίου)'],['zero','Από την αρχή (ροές 0, ω = 1)']],'lf',{hint:'Ροή φορτίου: το κύκλωμα λύνεται πρώτα με φασιθέτες, με τη γεννήτρια ως πηγή |V|∠θ, και η μηχανή, ο άξονας και το δίκτυο ξεκινούν από αυτή τη μόνιμη κατάσταση.'}),
    num('V0','Τάση ακροδεκτών |V|','pu',1,{show:p=>p.init!=='zero'}),num('ang0','Γωνία τάσης θ (φάση a)','°',0,{signed:true,zero:true,show:p=>p.init!=='zero',hint:'v_a = √2·|V|·U_n/√3·sin(ωt + θ), όπως οι πηγές της εφαρμογής.'}),
    ...NEUT('neut','gnd',{label:'Ουδέτερος στάτη'}),CONN('abc')],
   value:p=>p.Sn,unit:'VA',
   draw:p=>{const sp=genSpins(p),L=Object.entries(sp);let h='<rect class="block" x="-30" y="-35" width="60" height="'+(p.shaft==='multi'?80:70)+'" rx="6"/><circle r="15" cy="-5"/><path class="thin" d="M-8,-5 c3,-7 5,-7 8,0 c3,7 5,7 8,0"/>'+tx('SG',0,22,'bsm');
    h+=isBus(p)?bl('M30,0 H40'):'<path d="M30,-20 H40 M30,0 H40 M30,20 H40"/>';if(p.neut==='pin')h+='<path d="M30,40 H40"/>';
    const LB={w:'ω',te:'τ',pe:'P',qe:'Q',vt:'V',ifd:'i_f',d:'δ'};for(const [k,s] of L){const [x,y]=s.at;if(LB[k])h+=tx(LB[k],-23,y+3,'pinl');h+=sl(x<-30?`M${x},${y} H-30`:y<-35?`M${x},${y} V-35`:`M${x},${y} V${p.shaft==='multi'?45:35}`);}
    return h;}},
  // 4.3: three-phase line as one π section from sequence data (R₁, X₁, B₁, R₀, X₀, B₀), in Ω and S or in per unit
  LINE3:{name:'Γραμμή (τμήμα π, ακολουθίες)',prefix:'LN',group:'Δίκτυο',pins:p=>isBus(p)?{abc1:[-40,0],abc2:[40,0]}:{a1:[-40,-20],b1:[-40,0],c1:[-40,20],a2:[40,-20],b2:[40,0],c2:[40,20]},box:[-30,-25,60,50],
   bus:p=>isBus(p)?{abc1:['a1','b1','c1'],abc2:['a2','b2','c2']}:{},
   params:[sel('unit','Δεδομένα σε',[['ohm','Ω και S (σύνολο της γραμμής)'],['pu','Ανά μονάδα στη βάση S_b, U_n']],'ohm'),num('Un','Ονομαστική πολική τάση U_n','V',150e3),
    num('Sb','Ισχύς βάσης S_b','VA',100e6,{show:p=>p.unit==='pu'}),num('f','Συχνότητα','Hz',50),
    num('R1','R₁ (θετική ακολουθία, Ω ή pu)','',5,{zero:true}),num('X1','X₁ (Ω ή pu)','',40),num('B1','B₁ (εγκάρσια, όλη η γραμμή, S ή pu)','',3e-4,{zero:true,hint:'Μισή σε κάθε άκρο (τμήμα π). 0: χωρίς χωρητικότητα.'}),
    sel('z0','Μηδενική ακολουθία',[['same','Ίδια με τη θετική'],['given','R₀, X₀, B₀']],'same'),
    num('R0','R₀ (Ω ή pu)','',15,{zero:true,show:p=>p.z0==='given'}),num('X0','X₀ (Ω ή pu)','',120,{show:p=>p.z0==='given'}),num('B0','B₀ (S ή pu)','',2e-4,{zero:true,show:p=>p.z0==='given',hint:'B₀ ≤ B₁ (η χωρητικότητα μεταξύ φάσεων είναι (C₁ − C₀)/3).'}),
    sel('model','Μοντέλο στον χρόνο',[['pi','Τμήμα π (συγκεντρωμένες παράμετροι)'],['tl','Κατανεμημένες παράμετροι (Bergeron ανά φάση)']],'pi',{show:p=>p.z0!=='given',hint:'4.24: Bergeron ανά φάση, Z_c = √(L/C), τ = √(L·C), η R συγκεντρωμένη R/4, R/2, R/4. Μόνο με ίδια μηδενική ακολουθία (φάσεις χωρίς σύζευξη). Ο χρόνος διάδοσης χωρίζει το δίκτυο σε υποδίκτυα («Ρυθμίσεις επίλυσης → Υποδίκτυα»), και το βήμα μένει ≤ τ.'}),CONN('abc')],
   value:p=>p.X1,unit:'',
   draw:p=>'<rect class="block" x="-30" y="-25" width="60" height="50" rx="4"/>'+(isBus(p)?bl('M-40,0 H-30 M30,0 H40'):'<path d="M-40,-20 H-30 M-40,0 H-30 M-40,20 H-30 M30,-20 H40 M30,0 H40 M30,20 H40"/>')
    +'<path class="thin" d="M-18,-4 h6 c2,-6 4,-6 6,0 c2,-6 4,-6 6,0 c2,-6 4,-6 6,0 h6 M-18,-4 v10 M18,-4 v10 M-22,6 h8 M14,6 h8 M-22,10 h8 M14,10 h8"/>'+tx('π',0,-12,'bsm')},
  // line from geometry (4.4, ROADMAP §26): the conductors (line data, as the EMTP Line Data) give Z′(ω), Y′(ω) in Python
  // (pcl/lineconst.py, /api/line_model); the solver uses the model kept in `mdl`: CP (modal Bergeron with R/4, R/2, R/4)
  // or FD (J. Marti: Z_c(s), A(s)·e^(−sτ) as rational functions with real poles, recursive convolution), constant real T_i
  TLM:{name:'Γραμμή από γεωμετρία (CP / FD / WB)',prefix:'LG',group:'Δίκτυο',pins:p=>tlmPins(p),box:p=>{const M=tlmM(p),h=isBus(p)&&M===3?50:Math.max(50,20*M+10);return [-30,-h/2,60,h];},
   bus:p=>isBus(p)&&tlmM(p)===3?{abc1:['a1','b1','c1'],abc2:['a2','b2','c2']}:{},
   params:[sel('src','Δεδομένα',[['geo','Από τη γεωμετρία («Δεδομένα γραμμής…»)'],['modal','CP με δεδομένα ανά ρυθμό (όπως το «CP m-phase» του EMTP)']],'geo',{hint:'5.0.1: με «δεδομένα ανά ρυθμό» η γραμμή είναι CP (Bergeron ανά ρυθμό, όπως με τη γεωμετρία) από R′, Z_c, v (ή τ, ή L′, C′) ανά ρυθμό, χωρίς τον server. Συνεχής μετάθεση: δύο ρυθμοί (γης και εναέριος) με τον ενσωματωμένο T_i του Clarke για m αγωγούς· αλλιώς ένας ρυθμός ανά αγωγό και πραγματικός T_i (i = T_i·i_ρυθμού, v_ρυθμού = T_iᵀ·v). THEORY §8ΩΖ.10.'}),
    ...TLCP_P,
    sel('model','Μοντέλο',[['cp','CP: σταθερές παράμετροι (Bergeron, R/4 – R/2 – R/4)'],['fd','FD: εξάρτηση από τη συχνότητα (J. Marti)'],['pi','π ονομαστικό σε τμήματα (4.11)'],['wb','WB: wideband στο πεδίο των φάσεων (ULM, 4.13)']],'cp',{hint:'Όπως το EMTP: CP στη συχνότητα που δίνεις (κάθε ρυθμός μια γραμμή Bergeron με συγκεντρωμένη R), FD με Z_c(ω) και A(ω) ως ρητές συναρτήσεις, και τα δύο με σταθερό πραγματικό T_i· π: συζευγμένα R, L, C σε N τμήματα.'}),
    num('len','Μήκος','km',100),
    num('f','Συχνότητα των παραμέτρων (CP, π)','Hz',50,{show:p=>p.model!=='fd'&&p.model!=='wb',hint:'50 Hz για μόνιμη κατάσταση και σφάλματα, 1–5 kHz για χειρισμούς, 100–500 kHz για κεραυνούς.'}),
    sel('cp','Είδος CP',[['lumped','R/4 – R/2 – R/4'],['lossless','χωρίς απώλειες'],['distortionless','χωρίς παραμόρφωση'],['hf','χωρίς απώλειες, υψηλές συχνότητες']],'lumped',{show:p=>(p.model||'cp')==='cp'}),
    num('npi','Τμήματα του π','',1,{show:p=>p.model==='pi'}),
    num('fmin','Ελάχιστη συχνότητα προσαρμογής','Hz',0.01,{show:p=>p.model==='fd'||p.model==='wb'}),num('dec','Δεκάδες','',9,{show:p=>p.model==='fd'||p.model==='wb',hint:'Μέγιστη συχνότητα f_min·10^δεκάδες (προεπιλογή 0,01 Hz … 10 MHz, όπως το EMTP).'}),
    num('ppd','Σημεία ανά δεκάδα','',10,{show:p=>p.model==='fd'||p.model==='wb'}),num('fti','Συχνότητα του T_i','Hz',1000,{show:p=>p.model==='fd'&&p.tiauto!=='1',hint:'Ο πραγματικός T_i υπολογίζεται σε μία συχνότητα (το EMTP προτείνει 0,5–5 kHz για χειρισμούς).'}),
    sel('tiauto','Συχνότητα του T_i αυτόματα',[['0','Όχι'],['1','Ναι (500 Hz – 5 kHz)']],'0',{show:p=>p.model==='fd'}),
    num('nmax','Πόλοι ανά συνάρτηση (μέγιστο)','',30,{show:p=>p.model==='fd'||p.model==='wb'}),
    sel('ti','Πραγματικός T_i',[['gm0','G_m = 0 (EMTP)'],['minimag','ελάχιστο φανταστικό'],['balanced','ισορροπημένη (Clarke)'],['double','διπλό κύκλωμα']],'gm0',{show:p=>p.model!=='pi'&&p.model!=='wb'}),
    // 4.13: the options of the wideband fitter (as the WB fitter of the EMTP: tolerance, cable model correction, DC
    // correction, grouping, the advanced delays, passivity), or a model file of the EMTP
    sel('wsrc','Μοντέλο WB από',[['fit','προσαρμογή εδώ (pcl.wideband)'],['emtp','αρχείο του EMTP (_WB.mod)']],'fit',{show:p=>p.model==='wb',hint:'Το αρχείο _WB.mod του WB fitter του EMTP διαβάζεται στο «Δεδομένα γραμμής» → «Μοντέλο»· χρειάζεται τις ίδιες φάσεις.'}),
    num('wtol','Ανοχή της προσαρμογής','%',0.2,{show:p=>p.model==='wb'&&p.wsrc!=='emtp',hint:'Μέγιστο σφάλμα του H (απόλυτο) και του Y_c (ως προς το μέτρο του) σε κάθε συχνότητα.'}),
    sel('wgrp','Ομαδοποίηση ρυθμών με ίδια καθυστέρηση',[['1','Ναι'],['0','Όχι']],'1',{show:p=>p.model==='wb'&&p.wsrc!=='emtp'}),
    sel('wfdcm','Διόρθωση για καλώδια (FDCM)',[['auto','αυτόματα, όταν υπόλοιπο/πόλος > 1000'],['always','πάντα'],['never','ποτέ']],'auto',{show:p=>p.model==='wb'&&p.wsrc!=='emtp'}),
    sel('wdc','Διόρθωση DC',[['0','Όχι'],['1','Ναι (κάτω από 1 Hz χωριστά· f_min ≤ 0,001 Hz)']],'0',{show:p=>p.model==='wb'&&p.wsrc!=='emtp'}),
    sel('wlfw','Βάρος στις χαμηλές συχνότητες',[['100','100 (προεπιλογή)'],['300','300'],['30','30'],['0','χωρίς (το απλό ULM)']],'100',{show:p=>p.model==='wb'&&p.wsrc!=='emtp',hint:'Το σφάλμα του H μετρά ως προς |1 − H| του ρυθμού με τη μικρότερη απόσβεση, έως αυτόν τον συντελεστή: ένα κοντό τμήμα (π.χ. ελάσσον τμήμα cross-bonding) κρατά τη σύνθετη αντίσταση σειράς του στα 50 Hz. Η επιβολή παθητικότητας μετρά τις αλλαγές του H με τον ίδιο τρόπο.'}),
    sel('wopt','Καθυστερήσεις με βελτιστοποίηση',[['0','Όχι (Bode, και αναζήτηση όταν δεν σβήνει στη ζώνη)'],['1','Ναι, σε όλες']],'0',{show:p=>p.model==='wb'&&p.wsrc!=='emtp'}),
    sel('wpas','Παθητικότητα',[['check','έλεγχος (σάρωση)'],['enforce','έλεγχος και επιβολή'],['none','χωρίς έλεγχο']],'check',{show:p=>p.model==='wb'}),
    sel('wgd','Ζώνη ασφαλείας (4.17)',[['auto','αυτόματα: δείγματα ως 0,01 Hz – 1 MHz με βάρος 0,1'],['none','χωρίς: μόνο η ζώνη']],'auto',{show:p=>p.model==='wb'&&p.wsrc!=='emtp',hint:'Μια ζώνη στενότερη από 0,01 Hz – 1 MHz παίρνει δείγματα και έξω από αυτήν (από τη γεωμετρία), με ανοχή δέκα φορές μεγαλύτερη: έξω από τα δείγματά της η προσαρμογή είναι ελεύθερη και χάνει την παθητικότητα.'}),
    txt('wbref','Αρχείο WB του EMTP','',{show:()=>false}),txt('wbtxt','Κείμενο του αρχείου WB','',{show:()=>false}),
    txt('vtrap','Παγιδευμένο φορτίο: τάση ανά αγωγό (V)','',{show:p=>p.model!=='pi',hint:'4.11: η γραμμή ξεκινά φορτισμένη σε αυτές τις τάσεις ΣΡ (μία ανά φάση, με κόμμα), όπως οι αρχικές συνθήκες του CP/FD του EMTP (για επαναζεύξη). Όχι μαζί με εκκίνηση από ροή φορτίου.'}),
    txt('data','Δεδομένα γραμμής (JSON)',JSON.stringify(TLM_TYPICAL['400kV']),{show:()=>false}),txt('mdl','Υπολογισμένο μοντέλο (JSON)','',{show:()=>false}),
    sel('conn','Ακροδέκτες',[['sep','Χωριστοί'],['bus','Δίαυλος abc (3 φάσεις)']],'sep')].map(geoOnly),
   value:p=>p.src==='modal'?parseEng(p.mlen):p.len,unit:'',
   draw:p=>{const M=tlmM(p),bus=isBus(p)&&M===3,h=bus?50:Math.max(50,20*M+10),y=k=>-10*(M-1)+20*k;
    return `<rect class="block" x="-30" y="${-h/2}" width="60" height="${h}" rx="4"/>`+(bus?bl('M-40,0 H-30 M30,0 H40'):`<path d="${Array.from({length:M},(_,k)=>`M-40,${y(k)} H-30 M30,${y(k)} H40`).join(' ')}"/>`)
     +'<path class="thin" d="M-20,-6 Q-10,-14 0,-6 T20,-6 M-20,4 H20"/>'+tx(p.model==='fd'?'FD':p.model==='wb'?'WB':'CP',0,18,'bsm');}},
  // 4.9 (ROADMAP §51): a transmission-line tower for lightning studies (network library, NetLib.towerDef): the tower as a
  // lossless vertical line (Z_t, height, speed) from its top to the footing resistance (constant, or R(I) with soil
  // ionization), an insulator string between each phase and the top (flashover at U_50 or on a volt–time curve).
  // Pins in the order of the conductors of a line from geometry with its two ground wires kept (a, b, c, d, e): the phases
  // pass through, the ground wires end at the top.
  TOWER:{name:'Πύργος γραμμής (κεραυνοί)',prefix:'TW',group:'Δίκτυο',pins:{a1:[-40,-40],b1:[-40,-20],c1:[-40,0],d1:[-40,20],e1:[-40,40],a2:[40,-40],b2:[40,-20],c2:[40,0],d2:[40,20],e2:[40,40]},box:[-30,-50,60,100],
   params:[sel('model','Μοντέλο πύργου',[['line','Μία γραμμή (κορυφή ως βάση)'],['ms','Πολλών ορόφων (τέσσερα τμήματα με R ∥ L)']],'line',{hint:'Πολλών ορόφων (4.22): τέσσερα τμήματα χωρίς απώλειες, Z_t1 για τα τρία πάνω και Z_t2 για το κάτω, με R_i ∥ L_i μετά από το καθένα: R_i = 2·Z_ti·ln(1/γ)·h_i/H, L_i = 2·(H/v)·R_i. Οι αλυσίδες των φάσεων a, b, c καταλήγουν στους τρεις βραχίονες.'}),
    num('h','Ύψος (κορυφή, αγωγοί προστασίας)','m',27.15,{hint:'Ο πύργος γίνεται μια γραμμή χωρίς απώλειες από την κορυφή ως τη βάση, με επιστροφή τη γη: χρόνος διάδοσης τ = h/v. Το βήμα του λύτη μένει ≤ τ.'}),
    num('Zt1','Z_t1 (τα τρία πάνω τμήματα)','Ω',220,{show:p=>p.model==='ms'}),num('Zt2','Z_t2 (το κάτω τμήμα)','Ω',150,{show:p=>p.model==='ms'}),
    num('gam','Συντελεστής εξασθένησης γ','',.8,{show:p=>p.model==='ms',hint:'γ = 1: χωρίς απόσβεση (μόνο οι γραμμές).'}),
    sel('arms','Βραχίονες',[['three','Τρεις (a, b, c σε τρία ύψη)'],['one','Ένας για όλες τις φάσεις (οριζόντια διάταξη)']],'three',{show:p=>p.model==='ms'}),
    num('h1','h₁: από την κορυφή ως τον πάνω βραχίονα (φάση a)','m',5.33,{show:p=>p.model==='ms'}),num('h2','h₂: ως τον μεσαίο βραχίονα (φάση b)','m',13.05,{show:p=>p.model==='ms'}),
    num('h3','h₃: ως τον κάτω βραχίονα (φάση c)','m',13.05,{show:p=>p.model==='ms',hint:'Το h₄ = H − h₁ − h₂ − h₃ είναι από τον κάτω βραχίονα ως τη βάση.'}),
    num('Zt','Κυματική αντίσταση Z_t','Ω',200,{show:p=>p.model!=='ms',hint:'Τυπικά 100–300 Ω. Κύλινδρος ακτίνας r: Z_t = 60·(ln(2√2·h/r) − 1) (Sargent–Darveniza). Το CIGRE TB 63 δίνει τύπους για μορφές πύργων.'}),
    num('vt','Ταχύτητα διάδοσης στον πύργο','m/s',3e8,{hint:'Συνήθως c· μερικοί οδηγοί προτείνουν 0,85·c.'}),
    sel('foot','Γείωση της βάσης',[['ion','R(I) με ιονισμό του εδάφους (CIGRE, IEEE 1243)'],['r','Σταθερή R₀']],'ion',{hint:'Ιονισμός: R(I) = R₀/√(1 + I/I_g), I_g = E₀·ρ/(2π·R₀²). Σε μεγάλα ρεύματα το έδαφος γύρω από τα ηλεκτρόδια ιονίζεται και η αντίσταση πέφτει.'}),
    num('R0','R₀ (χαμηλό ρεύμα, χαμηλή συχνότητα)','Ω',15),
    num('rho','Ειδική αντίσταση εδάφους ρ','Ω·m',100,{show:p=>p.foot!=='r'}),num('E0','Πεδίο ιονισμού E₀','V/m',400e3,{show:p=>p.foot!=='r',hint:'Περίπου 400 kV/m (CIGRE).'}),
    sel('ins','Αλυσίδες μονωτήρων',[['ub','Διάσπαση στην τάση U_b (διακόπτης τάσης)'],['de','Καμπύλη τάσης–χρόνου (U₀, k, D)'],['lpm','Πρόοδος οχετού (LPM)'],['none','Χωρίς διάσπαση']],'ub',{hint:'Ανάμεσα σε κάθε φάση και την κορυφή. Διακόπτης τάσης: U_b ≈ U_50 της αλυσίδας (αρνητική πολικότητα περίπου 700 kV/m × απόσταση διάσπασης, IEC 60071-2). Καμπύλη τάσης–χρόνου: όπως ο σπινθηριστής, ∫ (|u| − U₀)^k dt = D.'}),
    num('Ub','Τάση διάσπασης U_b','V',2.24e6,{show:p=>p.ins==='ub',hint:'Π.χ. απόσταση διάσπασης 3,2 m × 700 kV/m = 2,24 MV.'}),
    num('U0','U₀','V',1.7e6,{show:p=>p.ins==='de'}),num('kde','Εκθέτης k','',1,{show:p=>p.ins==='de'}),num('Dde','Σταθερά D','V^k·s',0.5,{show:p=>p.ins==='de',hint:'Με k = 1 σε V·s (0,5 V·s = 500 kV·μs).'}),
    ...LPM_PARAMS(p=>p.ins==='lpm'),
    IMPL('blocks','Γρήγορη: η γείωση R(I) λύνεται μέσα στη γραμμή του πύργου (η βάση εξαρτάται μόνο από την ιστορία της γραμμής), χωρίς επαναλήψεις Newton. Ο πύργος πολλών ορόφων έχει μόνο την αναλυτική.'),
    bool('meas','Μετρήσεις (κορυφή, μονωτήρες, βάση)',true,{hint:'Κανάλια TW/Vtop (τάση κορυφής), TW/Ua … (τάση κάθε αλυσίδας), TW/Ia … (ρεύμα διάσπασης), TW/If (ρεύμα της βάσης).'})],
   value:p=>p.R0,unit:'Ω',
   draw:p=>'<rect class="block" x="-30" y="-50" width="60" height="100" rx="4"/><path d="M-40,-40 H-30 M-40,-20 H-30 M-40,0 H-30 M-40,20 H-30 M-40,40 H-30 M30,-40 H40 M30,-20 H40 M30,0 H40 M30,20 H40 M30,40 H40"/>'
    +'<path class="thin" d="M-10,44 L-4,-38 L4,-38 L10,44 M-20,-30 H20 M-16,-14 H16 M-7,2 H7 M-8,18 L8,30 M8,18 L-8,30 M-6,-30 L6,-14 M6,-30 L-6,-14"/>'+tx('TW',0,-42,'bsm')},
  // 4.9: a metal-oxide arrester with the frequency-dependent model of the IEEE WG 3.4.11 (1992): A0 and A1 nonlinear,
  // L0 ∥ R0, L1 ∥ R1 and C from the height d and the columns n (network library, NetLib.saiDef)
  SAI:{name:'Αλεξικέραυνο ZnO, μοντέλο IEEE (εξαρτάται από τη συχνότητα)',prefix:'SA',group:'Δίκτυο',pins:{a:[0,-40],b:[0,40]},box:[-14,-24,28,48],
   params:[num('U10','Παραμένουσα τάση U₁₀ (10 kA, 8/20 μs)','V',819e3,{hint:'Από το φύλλο δεδομένων. Π.χ. αλεξικέραυνο 420 kV (U_r 360 kV): 819 kV.'}),
    num('d','Ύψος d','m',3.216),num('n','Παράλληλες στήλες n','',1),
    num('kL1','Διόρθωση του L₁','',1,{show:p=>!(p.L1fit===true||p.L1fit==='true'),hint:'L₀ = 0,2·d/n μH, R₀ = 100·d/n Ω, L₁ = 15·d/n μH, R₁ = 65·d/n Ω, C = 100·n/d pF. Το IEEE WG ρυθμίζει μετά το L₁ ώστε να βγαίνει η U₁₀ με 8/20 μs (συντελεστής του L₁).'}),
    bool('L1fit','Ρύθμιση του L₁ στην U₁₀ (διαδικασία IEEE)',false,{hint:'Ο συντελεστής του L₁ βρίσκεται μόνος του, ώστε ρεύμα 10 kA 8/20 μs να δίνει τάση U₁₀ (το αλεξικέραυνο μόνο του, χωρίς τους αγωγούς σύνδεσης· ακρίβεια 0,05 %). Αλλιώς ισχύει η «Διόρθωση του L₁» (4.9.1).'}),
    num('Llead','Αυτεπαγωγή αγωγών σύνδεσης','H',0,{zero:true,hint:'Περίπου 1 μH/m μήκους των αγωγών προς τη φάση και τη γη.'}),
    txt('A0','A0: ρεύμα (kA): τάση (ανά μονάδα U₁₀)','0.01: 0.875, 1: 1.056, 5: 1.131, 10: 1.188, 15: 1.244, 20: 1.313',{hint:'Οι χαρακτηριστικές του IEEE WG (Durbak).'}),
    txt('A1','A1: ρεύμα (kA): τάση (ανά μονάδα U₁₀)','0.01: 0.681, 1: 0.856, 20: 1.000'),
    IMPL('blocks','Γρήγορη: ένα δίπολο του λύτη που απαλείφει τους δύο εσωτερικούς κόμβους (A0, A1, L₀ ∥ R₀, L₁ ∥ R₁, C) σε κάθε επανάληψη.'),
    bool('meas','Μετρήσεις (τάση, ρεύμα)',true,{hint:'Κανάλια SA/V (τάση a–b) και SA/I (ρεύμα από a προς b).'})],
   value:p=>p.U10,unit:'V',
   draw:()=>'<path d="M0,-40 V-24 M0,24 V40"/><rect x="-10" y="-24" width="20" height="48" rx="2"/><path class="thin" d="M-15,14 L-6,14 L6,-14 L15,-14"/>'+tx('IEEE',0,34,'bsm')},
  // 4.9.1: compact solver elements behind the fast implementations (hidden from the library; built by NetLib):
  // the IEEE arrester as one two-terminal element (inner nodes eliminated), and a tower footing R(I) solved from the history
  // of the tower's line (its foot node joins only that line and this footing)
  SAIX:{name:'Αλεξικέραυνο IEEE (συμπαγές)',prefix:'AX',group:'Δίκτυο',hidden:true,pins:{a:[0,-40],b:[0,40]},box:[-14,-24,28,48],
   params:[num('L0','L₀','H',0.6432e-6),num('R0','R₀','Ω',321.6),num('L1','L₁','H',48.24e-6),num('R1','R₁','Ω',209.04),num('C','C','F',31.095e-12),
    txt('tbl0','A0: ρεύμα: τάση','10: 716625, 1000: 864864'),txt('tbl1','A1: ρεύμα: τάση','10: 557739, 1000: 701064')],value:()=>null,
   draw:()=>'<path d="M0,-40 V-24 M0,24 V40"/><rect x="-10" y="-24" width="20" height="48" rx="2"/><path class="thin" d="M-15,14 L-6,14 L6,-14 L15,-14"/>'},
  RFX:{name:'Γείωση πύργου R(I) (από τη γραμμή του πύργου)',prefix:'RX',group:'Δίκτυο',hidden:true,pins:{a:[-30,0],b:[30,0]},box:[-22,-8,44,16],
   params:[num('R0','R₀','Ω',15),txt('tbl','R(I): ρεύμα: τάση','1: 15, 1000: 14000'),ref('line','Γραμμή του πύργου',['TL'])],value:p=>p.R0,unit:'Ω',
   draw:()=>'<path d="M-30,0 H-20 l2.5,-7 5,14 5,-14 5,14 5,-14 5,14 5,-14 5,14 2.5,-7 H30"/><path class="thin" d="M-14,10 L14,-10"/>'},
  // 4.10 (ROADMAP §50): modular multilevel converters. A cascaded arm of N cells (H bridges, or half bridges as in the MMC)
  // with their capacitors, the nearest-level modulation (NLC) with balancing of the capacitors by sorting, the single-phase
  // PLL with a second-order generalized integrator (SOGI) and the controller of a modular SSSC.
  CHB:{name:'Αρθρωτός βραχίονας: γέφυρες H σε σειρά (CHB)',prefix:'CH',group:'Ημιαγωγοί',pins:{a:[0,-50],b:[0,50]},spins:{ref:I(-40,-20),vav:O(40,-20),n:O(40,0),v:O(40,20)},box:[-30,-36,60,72],
   params:[...chbParams(),num('fs','Συχνότητα δειγματοληψίας της NLC','Hz',10e3,{hint:'Η στάθμη και η επιλογή των υπομονάδων αλλάζουν μόνο σε αυτά τα σημεία (ρολόι μέσα στο στοιχείο).'}),
    sel('norm','Στάθμη της NLC από',[['avg','Τη μέση τάση των πυκνωτών (μετρημένη)'],['nom','Την ονομαστική V_C']],'avg',{hint:'n = round(v_ref / V_C), περιορισμένο στο ±N (στο 0…N για ημιγέφυρες).'}),
    sel('sel','Εξισορρόπηση των πυκνωτών',[['sort','Ταξινόμηση σε κάθε δείγμα'],['reduced','Ταξινόμηση μόνο όταν χρειάζεται (μειωμένη συχνότητα μεταγωγής)']],'sort',{hint:'Ταξινόμηση: όταν το ρεύμα φορτίζει τους πυκνωτές που μπαίνουν, μπαίνουν οι n με τη μικρότερη τάση, αλλιώς οι n με τη μεγαλύτερη. Με μειωμένη συχνότητα: όταν το n μένει ίδιο και οι τάσεις απέχουν λιγότερο από ΔV, οι ίδιες υπομονάδες μένουν μέσα· όταν το n αλλάζει, μπαίνουν ή βγαίνουν μόνο όσες χρειάζεται.'}),
    num('band','Ζώνη ΔV (μέγιστη − ελάχιστη τάση)','V',20,{show:p=>p.sel==='reduced'}),
    IMPL('fast','Γρήγορη: ένα στοιχείο του λύτη με τις N τάσεις των πυκνωτών ως καταστάσεις (συνάρτηση μεταγωγής: +v_C, −v_C ή παράκαμψη ανά υπομονάδα). Αναλυτική: N γέφυρες από διακόπτες και πυκνωτές με τη λογική των πυλών.')],
   value:p=>p.N,unit:'',
   draw:p=>'<path d="M0,-50 V-36 M0,36 V50"/><rect x="-22" y="-36" width="44" height="72" rx="3"/>'+[-22,-6,10].map(y=>`<rect class="thin" x="-12" y="${y}" width="24" height="12" rx="1"/>`).join('')+'<path class="thin" d="M0,-24 V-22 M0,-10 V-6 M0,6 V10 M0,22 V26"/>'+tx(p.cell==='hb'?'½H':'H',0,-27,'bsm')+tx('N='+p.N,0,33,'bsm')+sl('M-40,-20 H-22 M22,-20 H40 M22,0 H40 M22,20 H40')},
  NLC:{name:'Διαμόρφωση πλησιέστερης στάθμης (NLC) με ταξινόμηση',prefix:'NLC',group:'Σήματα',pins:{},spins:p=>nlcIO(p),box:p=>{const h=nlcH(p);return [-30,-h,60,2*h];},blk:true,
   params:[num('N','Υπομονάδες N','',10),sel('cell','Υπομονάδα',[['fb','Γέφυρα H: s = −1, 0, +1'],['hb','Ημιγέφυρα: s = 0, +1']],'fb'),
    num('Vdc','Ονομαστική τάση πυκνωτή V_C','V',1000),sel('norm','Στάθμη από',[['avg','Τη μέση τάση των πυκνωτών'],['nom','Την ονομαστική V_C']],'avg'),
    sel('sel','Εξισορρόπηση',[['sort','Ταξινόμηση σε κάθε δείγμα'],['reduced','Μόνο όταν χρειάζεται (ζώνη ΔV)'],['trigger','Ταξινόμηση μόνο όταν αλλάζει το n (όπως το EMTP)']],'sort'),num('band','Ζώνη ΔV','V',20,{show:p=>p.sel==='reduced'}),CLOCK(),TRIG],
   value:p=>p.N,unit:'',
   draw:p=>codeDraw(nlcIns(p),nlcOuts(p),'NLC')},
  SPLL:{name:'PLL μονοφασικό (SOGI)',prefix:'SPLL',group:'Σήματα',pins:{},spins:{v:I(-30,0),th:O(30,-20),w:O(30,-10),amp:O(30,0),al:O(30,10),be:O(30,20)},box:[-20,-25,40,50],blk:true,
   params:[num('f0','Ονομαστική συχνότητα','Hz',50),num('bw','Εύρος ζώνης του βρόχου','Hz',20,{hint:'Όπως το τριφασικό PLL: ω_n = 2π·εύρος, ζ = 0,707, σφάλμα κανονικοποιημένο με το πλάτος.'}),
    num('k','Κέρδος του SOGI k','',Math.SQRT2,{hint:'Μικρότερο k: καλύτερο φιλτράρισμα αρμονικών, πιο αργή απόκριση. √2 είναι η συνήθης επιλογή (ζ = 0,707 του SOGI).'}),
    num('k0','Απόρριψη DC k₀','',0.1,{zero:true,hint:'Τρίτος ολοκληρωτής που εκτιμά το DC της εισόδου και το αφαιρεί πριν από το SOGI (αλλιώς το DC περνά στο qv′ με κέρδος k). 0 = το κλασικό SOGI.'}),
    num('th0','Αρχική γωνία','°',0,{signed:true,zero:true}),
    IMPL('fast','Γρήγορη: ένα μπλοκ με τις καταστάσεις του SOGI και του βρόχου. Αναλυτική: ολοκληρωτές και εκφράσεις της βιβλιοθήκης.')],value:p=>p.f0,unit:'Hz',
   draw:()=>sb(40,50)+tx('SOGI',0,-2,'bsm')+tx('PLL',0,8,'bsm')+sl('M-30,0 H-20 M20,-20 H30 M20,-10 H30 M20,0 H30 M20,10 H30 M20,20 H30')},
  SSSC:{name:'Έλεγχος αρθρωτού SSSC (m-SSSC)',prefix:'SSC',group:'Δίκτυο',pins:{},spins:{i:I(-40,-30),v:I(-40,-10),vav:I(-40,10),vb:I(-40,30),vref:O(40,-20),x:O(40,0),dth:O(40,20)},box:[-30,-40,60,80],blk:true,
   params:[sel('mode','Τρόπος',[['ma','Σταθερός δείκτης διαμόρφωσης m_a'],['x','Έγχυση αντίδρασης X (πρόσθια τροφοδότηση + PI)'],['i','Έλεγχος ρεύματος γραμμής'],['v','Έλεγχος τάσης ζυγού (είσοδος vb)']],'x',{hint:'Η εγχεόμενη τάση είναι κάθετη στο ρεύμα της γραμμής (θ_i από SOGI-PLL), με μικρή διόρθωση γωνίας Δθ από τη μέση τάση των πυκνωτών, ώστε η διάταξη να παίρνει από τη γραμμή την ενεργό ισχύ των απωλειών της.'}),
    num('N','Υπομονάδες N','',10),num('Vdc','Τάση πυκνωτή V_C (αναφορά)','V',1000),
    num('ma','m_a','',0.8,{show:p=>p.mode==='ma'}),sel('sense','Χαρακτήρας',[['cap','Χωρητικός (η τάση καθυστερεί 90° από το ρεύμα)'],['ind','Επαγωγικός (προηγείται 90°)']],'cap',{show:p=>p.mode==='ma'}),
    txt('X','X_ref (χωρητική θετική)','10',{sched:true,unit:'Ω',show:p=>p.mode==='x',hint:'Σταθερή τιμή ή «t:τιμή» σε Ω, π.χ. 0:0, 0.1:10. Θετική: χωρητική (μειώνει την αντίδραση της γραμμής), αρνητική: επαγωγική.'}),
    txt('Iref','I_ref (πλάτος)','100',{sched:true,unit:'A',show:p=>p.mode==='i'}),txt('Vbref','V_ref του ζυγού (πλάτος)','1000',{sched:true,unit:'V',show:p=>p.mode==='v'}),
    num('Kp','K_p του βρόχου X','Ω/Ω',0.5,{zero:true,show:p=>p.mode==='x',hint:'Ο PI δίνει αντίδραση X_cmd (Ω) και η εντολή είναι V_q = Î·X_cmd. Στον τρόπο X μαζί με την πρόσθια τροφοδότηση X_ref.'}),
    num('Ki','K_i του βρόχου X','Ω/(Ω·s)',20,{zero:true,show:p=>p.mode==='x'}),
    num('KpI','K_p του βρόχου ρεύματος','Ω/A',0.02,{zero:true,show:p=>p.mode==='i',hint:'X_cmd = PI(I_ref − Î). Μεγάλο κέρδος φέρνει τη χωρητική X κοντά στην αντίδραση της γραμμής (συντονισμός).'}),
    num('KiI','K_i του βρόχου ρεύματος','Ω/(A·s)',5,{zero:true,show:p=>p.mode==='i'}),
    num('KpV','K_p του βρόχου τάσης','Ω',5,{zero:true,show:p=>p.mode==='v',hint:'X_cmd = PI((V_ref − V̂)/V_ref), το σφάλμα ανά μονάδα.'}),
    num('KiV','K_i του βρόχου τάσης','Ω/s',200,{zero:true,show:p=>p.mode==='v'}),
    num('kpd','K_p του βρόχου V_C → Δθ','rad/V',2e-4,{zero:true}),num('fv','Φίλτρο της μέσης τάσης (2ης τάξης)','Hz',10),num('kid','K_i του βρόχου V_C → Δθ','rad/(V·s)',4e-3,{zero:true}),num('dmax','Μέγιστη |Δθ|','°',20),
    num('mmax','Μέγιστο m_a','',1),num('f0','Ονομαστική συχνότητα','Hz',50),num('bw','Εύρος ζώνης του PLL','Hz',8,{hint:'Το PLL κλειδώνει στο ρεύμα που η ίδια η διάταξη αλλάζει: με επαγωγική έγχυση η γωνία του ρεύματος ακολουθεί το σφάλμα του PLL προς την ανάποδη μεριά και ο βρόχος γίνεται πιο γρήγορος. Με 20 Hz η επαγωγική έγχυση πάνω από ~10 Ω ταλαντεύεται (στο tutorial), με 8 Hz όχι.'}),num('fx','Φίλτρο της μέτρησης της X (2ης τάξης)','Hz',10,{hint:'Η αντίδραση μετριέται από τη συνιστώσα της τάσης v (είσοδος) σε τετραγωνισμό με το ρεύμα: X = V_q/Î.'}),
    num('ton','Ενεργοποίηση στο','s',0.15,{zero:true,hint:'Ως τότε v_ref = 0 (όλες οι υπομονάδες σε παράκαμψη), ώστε να κλειδώσει το PLL στο ρεύμα.'}),
    num('tadv','Προπορεία της αναφοράς (4.17)','s',0,{zero:true,hint:'Η NLC δειγματοληπτεί την αναφορά, οπότε η σκάλα καθυστερεί περίπου μισό δείγμα (50 μs για 10 kHz) και ο βραχίονας ανταλλάσσει ενεργό ισχύ ~V_q·ω·T_s/2 με τη γραμμή, που την αναπληρώνει το Δθ. Με t_adv = 1/(2f_s) η αναφορά προηγείται όσο καθυστερεί η σκάλα. 0 = όπως στην 4.10.'})],value:()=>null,
   draw:()=>sb(60,80)+tx('m-SSSC',0,4,'bsm')+sl('M-40,-30 H-30 M-40,-10 H-30 M-40,10 H-30 M-40,30 H-30 M30,-20 H40 M30,0 H40 M30,20 H40')},
  // 4.17 (§50): one controller for the three arms of a three-phase m-SSSC (sync on the positive sequence or per phase,
  // one reactance loop, the total energy and the balancing between the phases). THEORY §8ρ
  SSSC3:{name:'Κεντρικός έλεγχος τριφασικού m-SSSC',prefix:'SS3',group:'Δίκτυο',pins:{},
   spins:{ia:I(-50,-70),ib:I(-50,-60),ic:I(-50,-50),va:I(-50,-30),vb:I(-50,-20),vc:I(-50,-10),ca:I(-50,10),cb:I(-50,20),cc:I(-50,30),ua:I(-50,50),ub:I(-50,60),uc:I(-50,70),
    ra:O(50,-70),rb:O(50,-60),rc:O(50,-50),x:O(50,-30),u:O(50,-10)},box:[-40,-80,80,160],blk:true,
   params:[sel('mode','Τρόπος',[['ma','Σταθερός δείκτης διαμόρφωσης m_a'],['x','Έγχυση αντίδρασης X (πρόσθια τροφοδότηση + PI)'],['i','Έλεγχος ρεύματος γραμμής (θετική ακολουθία)'],['v','Έλεγχος τάσης ζυγού (είσοδοι ua, ub, uc)']],'x',{hint:'Ένας βρόχος για τις τρεις φάσεις. Η αναφορά κάθε βραχίονα έχει ένα μέρος κάθετο στο ρεύμα της φάσης του (V_q, η άεργος αντιστάθμιση) και ένα μέρος σε φάση με αυτό (D_k), που κρατά τους πυκνωτές: τη συνολική ενέργεια και την εξισορρόπηση ανάμεσα στις φάσεις.'}),
    sel('sync','Συγχρονισμός',[['pos','Θετική ακολουθία: ένα τριφασικό PLL στα τρία ρεύματα'],['phase','Ανά φάση: ένα SOGI-PLL σε κάθε ρεύμα (όπως η 4.10)']],'pos',{hint:'Με τη θετική ακολουθία οι τρεις τάσεις είναι συμμετρικές και το πλάτος και η X δεν έχουν κυμάτωση 2ω όταν τα ρεύματα είναι συμμετρικά. Με ασύμμετρα ρεύματα η τάση κάθε φάσης δεν είναι ακριβώς κάθετη στο ρεύμα της, και η εξισορρόπηση ανάμεσα στις φάσεις μοιράζει τη διαφορά. Ανά φάση: κάθε τάση κάθετη στο ρεύμα της φάσης της (V_q ανά φάση = Î_k·X).'}),
    num('N','Υπομονάδες ανά φάση N','',10),num('Vdc','Τάση πυκνωτή V_C (αναφορά)','V',1000),num('C','Πυκνωτής υπομονάδας C','F',10e-3,{hint:'Για τα κέρδη του βρόχου της ενέργειας (ενέργεια ανά φάση N·½·C·V_C²).'}),
    num('ma','m_a','',0.8,{show:p=>p.mode==='ma'}),sel('sense','Χαρακτήρας',[['cap','Χωρητικός (η τάση καθυστερεί 90° από το ρεύμα)'],['ind','Επαγωγικός (προηγείται 90°)']],'cap',{show:p=>p.mode==='ma'}),
    txt('X','X_ref (χωρητική θετική)','10',{sched:true,unit:'Ω',show:p=>p.mode==='x',hint:'Σταθερή τιμή ή «t:τιμή» σε Ω, π.χ. 0:0, 0.3:10.'}),
    txt('Iref','I_ref (πλάτος, θετική ακολουθία)','100',{sched:true,unit:'A',show:p=>p.mode==='i'}),txt('Vbref','V_ref του ζυγού (πλάτος φασικής)','1000',{sched:true,unit:'V',show:p=>p.mode==='v'}),
    num('Kp','K_p του βρόχου X','Ω/Ω',0.5,{zero:true,show:p=>p.mode==='x'}),num('Ki','K_i του βρόχου X','Ω/(Ω·s)',20,{zero:true,show:p=>p.mode==='x'}),
    num('KpI','K_p του βρόχου ρεύματος','Ω/A',0.02,{zero:true,show:p=>p.mode==='i'}),num('KiI','K_i του βρόχου ρεύματος','Ω/(A·s)',5,{zero:true,show:p=>p.mode==='i'}),
    num('KpV','K_p του βρόχου τάσης','Ω',5,{zero:true,show:p=>p.mode==='v'}),num('KiV','K_i του βρόχου τάσης','Ω/s',200,{zero:true,show:p=>p.mode==='v'}),
    num('tv','Σταθερά χρόνου του βρόχου της ενέργειας','s',0.05,{hint:'u = PI(V_C,ref − V̄) σε V/s με K_p = 1/τ, K_i = 1/(4τ²): κλειστός βρόχος (s + 1/(2τ))².'}),num('umax','Όριο των ολοκληρωτών (u, b_k)','V/s',2000,{hint:'Σε V/s της μέσης τάσης: 2000 V/s σε 10 × 1 kV με 10 mF είναι 200 kW ανά φάση.'}),
    sel('bal','Εξισορρόπηση ανάμεσα στις φάσεις',[['on','Ναι: b_k = PI(V̄ − V̄_k) με K_p = 1/τ_b, K_i = 1/(4τ_b²)'],['off','Όχι (μόνο η συνολική ενέργεια)']],'on'),num('tb','Σταθερά χρόνου της εξισορρόπησης τ_b','s',0.03,{show:p=>p.bal!=='off'}),
    num('fv','Φίλτρο των μέσων τάσεων (2ης τάξης)','Hz',10),num('dmax','Μέγιστο |D_k| (κλάσμα του N·V_C)','',0.3),num('imin','Ελάχιστο ρεύμα στο κέρδος D_k','A',10,{hint:'D_k = 2·N·C·V_C/max(Î, I_min)·(u + b_k): σε πολύ μικρό ρεύμα το κέρδος δεν απειρίζεται.'}),
    num('mmax','Μέγιστο m_a','',1),num('f0','Ονομαστική συχνότητα','Hz',50),num('bw','Εύρος ζώνης του PLL','Hz',8),num('fx','Φίλτρο της μέτρησης της X (2ης τάξης)','Hz',10),
    num('tadv','Προπορεία της αναφοράς','s',5e-5,{zero:true,hint:'Η NLC δειγματοληπτεί την αναφορά (f_s του βραχίονα), οπότε η σκάλα καθυστερεί περίπου μισό δείγμα: 1/(2f_s) = 50 μs για 10 kHz. Χωρίς προπορεία μια χωρητική V_q καθυστερεί 90° + ε από το ρεύμα και ο βραχίονας δίνει ενεργό ισχύ (~V_q·ω·T_s/2), που πρέπει να την αναπληρώνει ο βρόχος της ενέργειας. 0 = καμία.'}),
    num('ton','Ενεργοποίηση στο','s',0.15,{zero:true,hint:'Ως τότε όλες οι αναφορές μηδέν (υπομονάδες σε παράκαμψη), ώστε να κλειδώσει το PLL.'})],value:()=>null,
   draw:()=>sb(80,160)+tx('m-SSSC',0,-4,'bsm')+tx('3φ',0,8,'bsm')+sl('M-50,-70 H-40 M-50,-60 H-40 M-50,-50 H-40 M-50,-30 H-40 M-50,-20 H-40 M-50,-10 H-40 M-50,10 H-40 M-50,20 H-40 M-50,30 H-40 M-50,50 H-40 M-50,60 H-40 M-50,70 H-40 M40,-70 H50 M40,-60 H50 M40,-50 H50 M40,-30 H50 M40,-10 H50')},
  // 4.14 (§42): a modular multilevel converter (MMC) for HVDC, in the four models of the MMC station of EMTP-RV: 1 every
  // cell from switches and diodes (the detailed implementation), 2 the detailed equivalent (every capacitor in one solver
  // element per arm), 3 the switching function of the arm (one capacitor C/N per arm), 4 the average model (controlled
  // sources). The modulation of each arm: references from m_a, m_b, m_c, the circulating-current suppression (CCSC) on θ,
  // the nearest level and the balancing of the capacitors (THEORY §8χ)
  MMC:{name:'Μετατροπέας MMC (HVDC, μοντέλα 1–4)',prefix:'MMC',group:'Ημιαγωγοί',
   pins:p=>isBus(p)?{abc:[-50,-30],p:[50,-40],n:[50,-20]}:{a:[-50,-40],b:[-50,-30],c:[-50,-20],p:[50,-40],n:[50,-20]},
   bus:p=>isBus(p)?{abc:['a','b','c']}:{},
   spins:{ma:I(-50,0),mb:I(-50,10),mc:I(-50,20),blk:I(-50,40),va:O(50,0),vb:O(50,10),vc:O(50,20),ia:O(50,30),ib:O(50,40),ic:O(50,50),vdc:O(50,60),idc:O(50,70),vs:O(50,80)},box:[-40,-50,80,140],
   params:[IMPL('fast','Αναλυτική = Model 1: κάθε υπομονάδα από δύο IGBT με αντιπαράλληλες διόδους και τον πυκνωτή της (για N έως 40). Γρήγορη: ένα από τα μοντέλα 2–4.'),
    sel('model','Μοντέλο (γρήγορη υλοποίηση)',[['m2','Model 2: ισοδύναμο βραχίονα με κάθε πυκνωτή (ταξινόμηση, μπλοκάρισμα)'],['m3','Model 3: συνάρτηση μεταγωγής βραχίονα (ένας πυκνωτής C/N)'],['m4','Model 4: μέσο μοντέλο (ελεγχόμενες πηγές, C_dc = 6C/N)']],'m2',{show:p=>p.impl!=='blocks',hint:'Όπως ο σταθμός MMC του EMTP-RV. Model 2: κάθε υπομονάδα με την τάση της, ένα στοιχείο του λύτη ανά βραχίονα (ισοδύναμο Thévenin). Model 3: οι πυκνωτές του βραχίονα θεωρούνται ίσοι (κυκλοφορούν ρεύμα και απώλειες ναι, εξισορρόπηση όχι). Model 4: χωρίς βραχίονες· όχι κυκλοφορούν ρεύμα, όχι CCSC· στο μπλοκάρισμα γέφυρα διόδων.'}),
    num('N','Υπομονάδες ανά βραχίονα N','',400,{hint:'Ημιγέφυρες. Model 2 και 3: έως 2000· Model 1 (αναλυτική): έως 40.'}),
    num('C','Πυκνωτής υπομονάδας C','F',10e-3,{hint:'Αποθηκευμένη ενέργεια 3·N·C·V_C²/S (30–40 kJ/MVA τυπικά).'}),
    num('Vdc','Ονομαστική τάση DC (πόλος–πόλος)','V',640e3,{hint:'V_C ονομαστική = V_dc/N· η στάθμη n = round(v_ref/V_C).'}),
    num('vc0','Αρχική τάση πυκνωτών','pu',1,{zero:true,hint:'Ως προς V_dc/N. 1 = φορτισμένοι (εκκίνηση χωρίς ακολουθία προφόρτισης, όπως στο EMTP)· 0 = άδειοι.'}),
    num('Larm','Αυτεπαγωγή βραχίονα','H',0.05),num('Ron','R_on ανά ημιαγωγό σε αγωγή','Ω',1e-3,{zero:true,hint:'R_arm = N·R_on (σε κάθε υπομονάδα άγει ένας ημιαγωγός).'}),
    num('fs','Δειγματοληψία της NLC','Hz',0,{zero:true,hint:'0 = σε κάθε βήμα του λύτη (με τις αναφορές του προηγούμενου, όπως ο έλεγχος του EMTP). Στο Model 1 0 σημαίνει 1/h.'}),
    sel('sel','Εξισορρόπηση των πυκνωτών',[['trigger','Ταξινόμηση όταν αλλάζει το n (όπως το EMTP)'],['sort','Ταξινόμηση σε κάθε δείγμα'],['reduced','Μόνο όσες υπομονάδες χρειάζονται (ζώνη ΔV)']],'trigger',{show:p=>p.impl==='blocks'||p.model!=='m3'&&p.model!=='m4'}),
    num('band','Ζώνη ΔV','pu',0.05,{show:p=>p.sel==='reduced',hint:'Ως προς V_C.'}),
    sel('ectl','Ενέργεια των βραχιόνων',[['energy','Έλεγχος ενέργειας (στάθμη από τη μετρημένη V_C κάθε βραχίονα)'],['direct','Άμεση διαμόρφωση (στάθμη από την ονομαστική V_C, όπως η 4.14)']],'energy',{show:p=>p.impl==='blocks'||p.model!=='m4',hint:'Έλεγχος ενέργειας (4.15): οι βραχίονες βάζουν ακριβώς την αναφορά τους (η πλευρά AC είναι του Model 4). Η συνολική ενέργεια ακολουθεί τη V_dc όπως ο C_dc του Model 4 (u₀ = (V_dc,ονομ − v_W)/2, v_W από την ενέργεια των έξι βραχιόνων), ενώ η ενέργεια ανάμεσα στις φάσεις και ανάμεσα σε άνω και κάτω βραχίονα εξισορροπείται με κυκλοφορούν ρεύμα: συνεχές και θεμελιώδους συχνότητας σε φάση με το m. Άμεση: οι πυκνωτές ισορροπούν μόνοι τους, αλλά η κυμάτωσή τους περνά στην τάση AC.'}),
    sel('norm','Στάθμη από',[['nom','Την ονομαστική V_C (άμεση διαμόρφωση)'],['avg','Τη μετρημένη μέση V_C']],'nom',{show:p=>p.ectl==='direct'&&(p.impl==='blocks'||p.model!=='m4'),hint:'Με την ονομαστική η ενέργεια των βραχιόνων ισορροπεί μόνη της (η τάση που μπαίνει μεγαλώνει με τους πυκνωτές). Με τη μετρημένη χρειάζεται ο έλεγχος ενέργειας.'}),
    num('kh','Εξισορρόπηση ανάμεσα στις φάσεις k_h','1/s',10,{zero:true,show:p=>p.ectl!=='direct'&&(p.impl==='blocks'||p.model!=='m4'),hint:'i_h,j = −k_h·ΔW_j/V_dc (συνεχές κυκλοφορούν ρεύμα ανά φάση).'}),
    num('kv','Εξισορρόπηση άνω–κάτω k_v','1/s',10,{zero:true,show:p=>p.ectl!=='direct'&&(p.impl==='blocks'||p.model!=='m4'),hint:'i_v,j = k_v·(W_u,j − W_l,j)·m_j/(V_dc·⟨m²⟩) (κυκλοφορούν θεμελιώδους συχνότητας σε φάση με την τάση AC).'}),
    num('fe','Φίλτρο των ενεργειών f_e','Hz',10,{show:p=>p.ectl!=='direct'&&(p.impl==='blocks'||p.model!=='m4'),hint:'Βαθυπερατό 2ης τάξης (ζ = 0,707): η ενέργεια κάθε βραχίονα έχει κυμάτωση στα ω₀ και 2ω₀.'}),
    num('Rd','Ενεργή απόσβεση της πλευράς DC R_d','Ω',20,{zero:true,show:p=>p.ectl!=='direct',hint:'Πάνω από το f_d, στο κοινό κυκλοφορούν ρεύμα (Model 1–3) ή ως (2/3)·R_d στους πόλους (Model 4). Αποσβένει τον συντονισμό (2/3)L_arm με C_dc και τη γραμμή.'}),
    num('fd','Κάτω συχνότητα της απόσβεσης f_d','Hz',10,{show:p=>p.ectl!=='direct'}),
    sel('ccsc','Καταστολή του κυκλοφορούντος ρεύματος (CCSC)',[['on','Ναι: PI σε dq στο 2θ (αρνητική ακολουθία)'],['off','Όχι']],'on',{show:p=>p.impl==='blocks'||p.model!=='m4'}),
    num('tcc','Σταθερά χρόνου του CCSC','s',5e-3,{show:p=>p.ccsc!=='off'&&(p.impl==='blocks'||p.model!=='m4'),hint:'K_p = L_arm/τ, K_i = K_p/(4τ).'}),
    num('f0','Ονομαστική συχνότητα','Hz',50),
    sel('disc','Αλλαγές εισαγωγής στον λύτη',[['smooth','Τραπεζοειδής από συνεπή σημείο μετά από κάθε αλλαγή'],['disc','Ως ασυνέχεια: BE μετά από κάθε αλλαγή (όπως το Model 1)']],'smooth',{show:p=>p.impl!=='blocks'&&p.model!=='m4',hint:'Η αλλαγή των υπομονάδων δεν σπάει καμία κατάσταση (πυκνωτές, πηνία). Προεπιλογή: τραπεζοειδής, με τις παραγώγους ξαναϋπολογισμένες αμέσως μετά την αλλαγή (με απλό τραπεζοειδή η αλλαγή θα έπιανε μισό βήμα αργότερα: 3 % στο ρεύμα με h = 20 μs). Με BE: όπως ο λύτης χειρίζεται κάθε διακόπτη (ίδιο με το Model 1, αλλά με απόσβεση πρώτης τάξης).'}),CONN('abc')],value:()=>null,
   draw:p=>'<rect x="-30" y="-50" width="60" height="140" rx="4"/>'+tx('MMC',0,-8,'bsm')+'<path d="M-18,6 H18 M-18,14 H18" class="thin"/>'+tx('AC/DC',0,30,'bsm')+(isBus(p)?'<path d="M-50,-30 H-30"/>':'<path d="M-50,-40 H-30 M-50,-30 H-30 M-50,-20 H-30"/>')+'<path d="M30,-40 H50 M30,-20 H50"/>'+sl('M-50,0 H-30 M-50,10 H-30 M-50,20 H-30 M-50,40 H-30 M30,0 H50 M30,10 H50 M30,20 H50 M30,30 H50 M30,40 H50 M30,50 H50 M30,60 H50 M30,70 H50 M30,80 H50')},
  // 4.14 (§42): the control of an MMC station as in EMTP-RV (upper level): PLL, dq, outer P / V_dc / droop / V-f and Q / V_ac,
  // inner current control with decoupling, current limit with priority, protection (DC overcurrent, deep voltage sag),
  // deblocking and breaker commands. Per unit on the station's ratings; P and Q flow into the converter. THEORY §8χ
  MMCC:{name:'Έλεγχος σταθμού MMC (HVDC)',prefix:'MCC',group:'Δίκτυο',pins:{},
   spins:{va:I(-50,-40),vb:I(-50,-30),vc:I(-50,-20),ia:I(-50,0),ib:I(-50,10),ic:I(-50,20),vdc:I(-50,40),idc:I(-50,50),vs:I(-50,60),ma:O(50,-40),mb:O(50,-30),mc:O(50,-20),th:O(50,0),blk:O(50,10),brk:O(50,20),p:O(50,40),q:O(50,50)},box:[-40,-50,80,110],blk:true,
   params:[sel('mode','Εξωτερικός έλεγχος',[['p','Ενεργός ισχύς P'],['vdc','Τάση DC'],['droop','Στατικότητα P/V_dc'],['vf','Τάση και συχνότητα (V/f, παθητικό δίκτυο)'],['gfm','Grid-forming (στατικότητα, VSM ή PSC, 4.18.1)']],'p',{hint:'Grid-forming: ο σταθμός σχηματίζει την τάση του με τον νόμο του στοιχείου «Έλεγχος grid-forming» (GFMC) και συγχρονίζεται μέσω της ισχύος, άμεσα η τάση με όριο ρεύματος (THEORY §8Ε). Η τάση DC την κρατά ο άλλος σταθμός.'}),
    sel('qmode','Έλεγχος Q ή V_ac',[['q','Άεργος ισχύς Q'],['vac','Τάση AC']],'q',{show:p=>p.mode!=='vf'&&p.mode!=='gfm'}),
    sel('law','Νόμος grid-forming',[['droop','Στατικότητα P–f και Q–V (με φίλτρο)'],['vsm','Εικονική σύγχρονη μηχανή (VSM)'],['psc','Συγχρονισμός μέσω ισχύος (PSC)'],['dvoc','Ταλαντωτής dVOC (4.20.2)']],'droop',{show:p=>p.mode==='gfm'}),
    num('S','Ονομαστική ισχύς (βάση)','VA',1059e6),num('Vac','Τάση AC στον μετατροπέα (πολική, RMS)','V',333e3),num('Vdc','Ονομαστική τάση DC (πόλος–πόλος)','V',640e3),num('f0','Ονομαστική συχνότητα','Hz',50),
    txt('Pref','P_ref (προς τον μετατροπέα)','1',{sched:true,unit:'pu',show:p=>p.mode==='p'||p.mode==='droop'||p.mode==='gfm',hint:'Σταθερή ή «t:τιμή», π.χ. 0:1, 0.5:0.5. Θετική: ισχύς από το δίκτυο AC προς τον μετατροπέα (ανόρθωση).'}),
    num('Tp','Χρόνος απόκρισης P (5 %)','s',0.1,{show:p=>p.mode==='p'||p.mode==='droop'}),
    sel('frq','Απόκριση στη συχνότητα (grid-following)',[['off','Όχι: σταθερή P_ref'],['droop','Στατικότητα από τη συχνότητα του PLL']],'off',{show:p=>p.mode==='p',hint:'4.18.1: P_ref + (ω_PLL − ω₀)/(ω₀·m_f), με το ω του PLL μέσα από βαθυπερατό T_f (ισχύς προς τον μετατροπέα: όταν η συχνότητα πέφτει, ο σταθμός δίνει περισσότερη). Η απόκριση έρχεται μετά το PLL και το φίλτρο, όχι αμέσως όπως στον grid-forming.'}),
    num('mf','Στατικότητα m_f (Δf για 1 pu P)','%',5,{show:p=>p.mode==='p'&&p.frq==='droop'}),num('Tf','Φίλτρο της συχνότητας T_f','s',0.05,{show:p=>p.mode==='p'&&p.frq==='droop'}),
    txt('Vdcref','V_dc,ref','1',{sched:true,unit:'pu',show:p=>p.mode==='vdc'||p.mode==='droop'}),num('Tvdc','Χρόνος απόκρισης V_dc (5 %)','s',0.1,{show:p=>p.mode==='vdc'}),
    num('kdr','Στατικότητα ΔV_dc/ΔP','pu',0.2,{show:p=>p.mode==='droop'}),
    num('H','Σταθερά ενέργειας των πυκνωτών (για τον PI της V_dc)','s',0.03,{show:p=>p.mode==='vdc',hint:'3·N·C·V_C²/S. Ο PI: 2H·s² + K_p·s + K_i με ζ = 0,8 και χρόνο αποκατάστασης 3/(ζω_n).'}),
    txt('Vfref','V_ref (V/f)','1',{sched:true,unit:'pu',show:p=>p.mode==='vf'}),num('Tvf','Χρόνος απόκρισης V/f','s',0.1,{show:p=>p.mode==='vf'}),
    txt('Qref','Q_ref (προς τον μετατροπέα)','0',{sched:true,unit:'pu',show:p=>p.mode==='gfm'?p.law!=='psc':p.mode!=='vf'&&p.qmode!=='vac'}),num('Tq','Χρόνος απόκρισης Q','s',0.1,{show:p=>p.mode!=='vf'&&p.qmode!=='vac'}),
    txt('Vacref','V_ac,ref','1',{sched:true,unit:'pu',show:p=>p.mode==='gfm'?p.law==='psc'&&p.avc!=='fixed':p.mode!=='vf'&&p.qmode==='vac'}),num('Tvac','Χρόνος απόκρισης V_ac','s',0.1,{show:p=>p.mode!=='vf'&&p.mode!=='gfm'&&p.qmode==='vac'}),
    num('Xpcc','X του δικτύου στο σημείο σύνδεσης','pu',0.1,{show:p=>p.mode!=='vf'&&p.mode!=='gfm'&&p.qmode==='vac'||p.mode==='vf'}),
    txt('Vref','V_ref (πλάτος, ή V₀ στο PSC)','1',{sched:true,unit:'pu',show:p=>p.mode==='gfm'}),
    num('mp','Στατικότητα συχνότητας m_p (Δf για 1 pu P)','%',2,{show:p=>p.mode==='gfm'&&p.law!=='psc'}),num('nq','Στατικότητα τάσης n_q (ΔV για 1 pu Q)','%',5,{show:p=>p.mode==='gfm'&&p.law!=='psc'}),
    num('fp','Φίλτρο των P και Q (στατικότητα)','Hz',5,{show:p=>p.mode==='gfm'&&p.law==='droop'}),
    num('Hv','Σταθερά αδράνειας H της VSM','s',2,{show:p=>p.mode==='gfm'&&p.law==='vsm',hint:'Η εικονική αδράνεια του νόμου (όχι η ενέργεια των πυκνωτών, H του PI της V_dc).'}),
    num('tv','Σταθερά χρόνου του βρόχου τάσης τ_v','s',0.01,{show:p=>p.mode==='gfm'&&p.law==='vsm'}),
    num('kp','Κέρδος συγχρονισμού k_p','rad/s/pu',50,{show:p=>p.mode==='gfm'&&p.law==='psc'}),
    sel('avc','Τάση στο PSC',[['fixed','Σταθερή V₀ = V_ref'],['vac','Ρύθμιση της τάσης AC (V_ac,ref)']],'vac',{show:p=>p.mode==='gfm'&&p.law==='psc'}),
    num('KE','Κέρδος K_E','pu/pu',5,{show:p=>p.mode==='gfm'&&p.law==='psc'&&p.avc!=='fixed'}),num('TE','Σταθερά χρόνου T_E','s',0.05,{show:p=>p.mode==='gfm'&&p.law==='psc'&&p.avc!=='fixed'}),
    num('kv','Υψιπερατή ανάδραση ρεύματος k_v','pu',0,{zero:true,show:p=>p.mode==='gfm'}),num('av','α_v του υψιπερατού','rad/s',40,{show:p=>p.mode==='gfm'&&parseFloat(p.kv)!==0}),
    num('Rv','Εικονική αντίσταση R_v','pu',0,{zero:true,show:p=>p.mode==='gfm'}),num('Xv','Εικονική αντίδραση X_v','pu',0,{zero:true,show:p=>p.mode==='gfm'}),
    num('kap','Γωνία κ του δικτύου (dVOC, 4.20.4)','°',90,{zero:true,show:p=>p.mode==='gfm'&&p.law==='dvoc',hint:'Όπως στο στοιχείο «Έλεγχος grid-forming»: κ = atan(ωL/R) της σύζευξης του σταθμού (X και R του σταθμού, R_v και X_v). 90°: επαγωγικό δίκτυο.'}),txt('E0','Αρχικό πλάτος του ταλαντωτή (dVOC, 4.20.4)','',{unit:'pu',show:p=>p.mode==='gfm'&&p.law==='dvoc',hint:'Κενό: V_ref. Μικρό (π.χ. 0,01): εκκίνηση από σχεδόν μηδενική τάση (το E = 0 είναι σημείο ηρεμίας). Πριν από την απεμπλοκή (t_db) το πλάτος ακολουθεί την τάση του PLL, όπως η ροή της VSM.'}),
    num('Ufd','Ανίχνευση σφάλματος: |v| κάτω από','pu',0.6,{show:p=>p.mode==='gfm'&&p.law==='psc'}),num('tsoft','Ομαλή εκκίνηση του E','s',0.05,{zero:true,show:p=>p.mode==='gfm'}),
    num('ac','Εύρος του ελέγχου ρεύματος στο όριο α_c','rad/s',600,{show:p=>p.mode==='gfm'}),
    num('Ti','Χρόνος απόκρισης του ρεύματος (5 %)','s',0.01,{show:p=>p.mode!=='gfm',hint:'K_p = X/(ω₀τ), K_i = max(R/τ, K_p/(4τ)), τ = T/3 (αποσύζευξη και πρόσθια τροφοδότηση της τάσης). 4.18.1: σε πολύ ασθενές δίκτυο (SCR ≈ 1) ως 3–5 ms· με 10 ms ο βρόχος ρεύματος, το PLL και η καθυστέρηση της μέτρησης ταλαντώνονται στα ~400 Hz (THEORY §8Ε).'}),
    sel('cc','Έλεγχος ρεύματος',[['pi','PI με αποσύζευξη και πρόσθια τροφοδότηση της τάσης'],['robust','Στιβαρός για ασθενές δίκτυο (VCC, 4.18.1)']],'pi',{show:p=>['p','vdc','droop'].includes(p.mode),hint:'4.18.1 (THEORY §8Ε.1), και στους τρόπους V_dc και στατικότητας από την 4.20: v = R_a(i_ref − i) + jX·i + H(s)·E με R_a = α_c·X και H = α_c/(s + α_c)· η αναφορά του ρεύματος από P_ref/E_ref και τις διορθώσεις της τάσης, χωρίς PLL στον βρόχο του ρεύματος· μένει σταθερός στο SCR 1. Μόνο με έλεγχο P.'}),
    num('acc','Εύρος του στιβαρού ελέγχου α_c (σε ω₀)','pu',4,{show:p=>['p','vdc','droop'].includes(p.mode)&&p.cc==='robust',hint:'R_a = α_c·X και φίλτρο H(s) = α_c/(s + α_c), α_c σε pu της ω₀ (4 → 1257 rad/s στα 50 Hz).'}),
    num('Tii','Ολοκλήρωση του σφάλματος ρεύματος T_ii','s',0.05,{show:p=>['p','vdc','droop'].includes(p.mode)&&p.cc==='robust',hint:'Μικρό ολοκληρωτικό κέρδος K_i = R_a/T_ii που σβήνει το στατικό σφάλμα της P (χωρίς αυτό ~2 %).'}),
    num('X','X μετατροπέα (L_arm/2 + σκέδαση μετασχηματιστή)','pu',0.255),num('R','R μετατροπέα','pu',0.003,{zero:true}),
    sel('ovl','Όριο υπέρτασης DC',[['on','Ναι: κόβει το ρεύμα πάνω από V_dc,max'],['off','Όχι']],'on',{show:p=>p.mode==='p'||p.mode==='droop',hint:'4.15: όταν ο σταθμός της τάσης DC δεν μπορεί να πάρει ισχύ (π.χ. σφάλμα AC και μπλοκάρισμα), i_d,ref μειώνεται κατά k_ov·(v_dc − V_dc,max) και ο ολοκληρωτής του P κρατιέται.'}),
    num('Vdcmax','V_dc,max','pu',1.1,{show:p=>(p.mode==='p'||p.mode==='droop')&&p.ovl!=='off'}),num('kov','Κέρδος k_ov','pu/pu',10,{show:p=>(p.mode==='p'||p.mode==='droop')&&p.ovl!=='off'}),
    sel('prio','Προτεραιότητα στο όριο ρεύματος',[['p','Ενεργός ισχύς'],['q','Άεργος ισχύς']],'p',{show:p=>p.mode!=='gfm'}),
    num('Ilim','Μέγιστο ρεύμα','pu',1.1),num('Idlim','Μέγιστο I_d','pu',1.1,{show:p=>p.prio!=='q'&&p.mode!=='gfm'}),num('Iqlim','Μέγιστο I_q','pu',0.5,{show:p=>p.prio==='q'&&p.mode!=='gfm'}),
    num('vmax','Μέγιστη |v_conv|','pu',1.5),num('bw','Εύρος ζώνης του PLL','Hz',20),num('th0','Αρχική γωνία του PLL','°',0,{signed:true,zero:true,hint:'Για εκκίνηση χωρίς μεταβατικό: η γωνία της τάσης της φάσης a στο t = 0 μείον 90°.'}),
    num('fm','Φίλτρο των μετρήσεων','Hz',2000),
    sel('prot','Προστασία',[['on','Ναι'],['off','Όχι']],'on',{hint:'Υπερένταση DC → μπλοκάρισμα (κρατιέται) και άνοιγμα του διακόπτη AC μετά από 40 ms· τάση AC κάτω από 0,1 pu → μπλοκάρισμα με 20 ms καθυστέρηση απελευθέρωσης. Ενεργή μετά το t_prot.'}),
    num('Idcmax','Όριο ρεύματος DC','pu',2,{show:p=>p.prot!=='off'}),num('tprot','Ενεργοποίηση της προστασίας','s',0.3,{zero:true,show:p=>p.prot!=='off'}),
    num('tdb','Απεμπλοκή των υπομονάδων στο','s',0,{zero:true}),num('tbrk','Κλείσιμο του διακόπτη AC στο','s',0,{zero:true})],value:()=>null,
   draw:()=>sb(80,110)+tx('MMC',0,-6,'bsm')+tx('έλεγχος',0,10,'bsm')+sl('M-50,-40 H-40 M-50,-30 H-40 M-50,-20 H-40 M-50,0 H-40 M-50,10 H-40 M-50,20 H-40 M-50,40 H-40 M-50,50 H-40 M-50,60 H-40 M40,-40 H50 M40,-30 H50 M40,-20 H50 M40,0 H50 M40,10 H50 M40,20 H50 M40,40 H50 M40,50 H50')},
  // 4.18 (§58): the two-level voltage-source converter as an average model (controlled sources), and the grid-forming control
  // (droop P–f/Q–V, virtual synchronous machine as the synchronverter, power-synchronization control; direct voltage with a
  // virtual impedance or cascaded voltage and current loops; current limit with a backup PLL). THEORY §8Ε
  VSC2:{name:'Μετατροπέας VSC δύο επιπέδων (μέσο μοντέλο, φίλτρο L ή LC)',prefix:'VSC',group:'Ημιαγωγοί',
   pins:p=>{const ac=isBus(p)?{abc:[50,-20]}:{a:[50,-30],b:[50,-20],c:[50,-10]};return p.dc==='pins'?{...ac,p:[-50,-30],n:[-50,-10]}:ac;},
   bus:p=>isBus(p)?{abc:['a','b','c'],m:['ma','mb','mc'],meas:['ia','ib','ic','va','vb','vc','oa','ob','oc','vdc']}:{},
   spins:p=>isBus(p)?{m:I(-50,20),meas:O(50,60)}:{ma:I(-50,10),mb:I(-50,20),mc:I(-50,30),ia:O(50,10),ib:O(50,20),ic:O(50,30),va:O(50,50),vb:O(50,60),vc:O(50,70),oa:O(50,90),ob:O(50,100),oc:O(50,110),vdc:O(50,130)},box:[-40,-40,80,180],
   params:[sel('dc','Πλευρά DC',[['ideal','Ιδανική πηγή V_dc (μέσον γειωμένο)'],['pins','Ακροδέκτες p, n (μπαταρία, πυκνωτής, γραμμή DC)']],'ideal',{hint:'Ιδανική: v_j = m_j·V_dc/2 ως προς τη γη. Ακροδέκτες: v_j = (1 + m_j)·v_dc/2 από τον n και ρεύμα Σ(1 + m_j)·i_j/2 από τον p, ώστε η ισχύς DC να είναι ίση με την AC (χωρίς απώλειες).'}),
    num('Vdc','Τάση DC','V',800,{show:p=>p.dc!=='pins'}),
    num('mmax','Μέγιστο |m| ανά φάση','',1,{hint:'Κορεσμός του δείκτη διαμόρφωσης· 1 = γραμμική περιοχή της ημιτονικής PWM (φασική κορυφή V_dc/2)· 1,155 = με έγχυση τρίτης αρμονικής (χωρίς ουδέτερο, το μέσο μοντέλο δεν τη δείχνει).'}),
    sel('filt','Φίλτρο',[['l','L (πηνίο του μετατροπέα)'],['lc','LC (πυκνωτές σε αστέρα με γειωμένο κέντρο)'],['none','Χωρίς (οι ακροδέκτες είναι οι πηγές)']],'l'),
    sel('init','Αρχική κατάσταση',[['zero','Από το μηδέν'],['lf','Από ροή φορτίου: E₀∠θ₀ στις πηγές (με «αρχικοποίηση από ροή φορτίου» του κυκλώματος)']],'zero',{hint:'4.18.1: στην αρχικοποίηση από φασιθέτες (όπως οι γεννήτριες) οι πηγές του μετατροπέα έχουν την τάση E₀∠θ₀ αντί για 0, ώστε το δίκτυο να ξεκινά στη μόνιμη κατάσταση· ο έλεγχος πρέπει να δίνει την ίδια τάση στο t = 0 (π.χ. GFMC με θ₀ και V_ref της ροής φορτίου). 4.20.1: με ακροδέκτες DC οι πηγές έχουν και την τάση v_dc,0/2 πάνω από τον n, και η πλευρά DC το ρεύμα P/v_dc,0 της ισχύος που δίνουν οι πηγές στη λύση με φασιθέτες· ο πυκνωτής DC θέλει αρχική τάση v_dc,0 (από τη ροή φορτίου του δικτύου DC).'}),
    num('E0','E₀ (φασική κορυφή στις πηγές)','V',0,{zero:true,show:p=>p.init==='lf'}),num('th0','θ₀ (φάση a ως συνημίτονο)','°',0,{signed:true,zero:true,show:p=>p.init==='lf'}),
    num('Vdc0','v_dc,0 (τάση DC στην αρχή)','V',800,{show:p=>p.init==='lf'&&p.dc==='pins',hint:'4.20.1: η τάση των ακροδεκτών DC στη μόνιμη κατάσταση από την οποία ξεκινά (από τη ροή φορτίου του δικτύου DC)· η ίδια με την αρχική τάση του πυκνωτή DC.'}),
    num('Lf','L του φίλτρου','H',5e-3,{show:p=>p.filt!=='none'}),num('Rf','R του πηνίου','Ω',0.05,{zero:true,show:p=>p.filt!=='none'}),num('Cf','C του φίλτρου','F',20e-6,{show:p=>p.filt==='lc'}),sel('conn','Ακροδέκτες',[['sep','Χωριστοί'],['bus','Δίαυλοι: abc, m (m_a, m_b, m_c) και meas (i_abc, v_abc, o_abc, v_dc)']],'sep',{hint:'Δίαυλος (3.18): ένα σύρμα για τις τρεις φάσεις, ένα για τη διαμόρφωση και ένα για τις μετρήσεις, ώστε ο έλεγχος grid-forming να συνδέεται με δύο σύρματα.'})],
   value:p=>p.dc==='pins'?null:p.Vdc,unit:'V',
   draw:p=>'<rect x="-30" y="-40" width="60" height="180" rx="4"/><path class="thin" d="M-30,40 L30,-40"/>'+tx('=',-14,-14,'bsm')+tx('~',14,26,'bsm')+tx(p.filt==='lc'?'LC':p.filt==='none'?'':'L',0,80,'bsm')+(isBus(p)?bl('M30,-20 H50'):'<path d="M30,-30 H50 M30,-20 H50 M30,-10 H50"/>')+(p.dc==='pins'?'<path d="M-50,-30 H-30 M-50,-10 H-30"/>':'')+(isBus(p)?sbl('M-50,20 H-30 M30,60 H50'):sl('M-50,10 H-30 M-50,20 H-30 M-50,30 H-30 M30,10 H50 M30,20 H50 M30,30 H50 M30,50 H50 M30,60 H50 M30,70 H50 M30,90 H50 M30,100 H50 M30,110 H50 M30,130 H50'))},
  // 4.21 (ROADMAP §87): a DC/DC converter as the averaged model of Jovcic (2019), §30.3.3, Fig. 30.7 (netlib.js dcdcDef)
  DCDC:{name:'Μετατροπέας DC/DC (μέσο μοντέλο, χωρίς απώλειες)',prefix:'DD',group:'Δίκτυο',
   pins:{pa:[-50,-30],na:[-50,-10],pb:[50,-30],nb:[50,-10]},spins:{p:O(50,20),ia:O(50,30),ib:O(50,40),va:O(50,50),vb:O(50,60)},box:[-40,-40,80,110],
   params:[sel('ctl','Έλεγχος',[['V','Τάση της πλευράς b (V_ref)'],['P','Ισχύς από το a στο b (P)'],['droop','Στατικότητα P–U στην πλευρά b']],'V',{hint:'Ο Jovcic (2019, §30.3.2): ένας μετατροπέας DC/DC ελέγχει μία μεταβλητή του δικτύου DC· η τάση στον εξωτερικό βρόχο, ή σταθερή ισχύς στο καλώδιο με στατικότητα τάσης. Ο εσωτερικός βρόχος κρατά το ρεύμα της πλευράς a.'}),
    num('Vref','V_ref (τάση της πλευράς b)','V',397e3,{show:p=>p.ctl!=='P',hint:'Για «Στατικότητα»: η τάση U₀ γύρω από την οποία P = P₀ − R·(v_b − U₀).'}),
    num('P','P (από το a στο b)','W',0,{signed:true,zero:true,show:p=>p.ctl!=='V',hint:'Για «Στατικότητα»: το P₀. Αρνητικό: η ισχύς πηγαίνει από το b στο a.'}),
    num('tr','Ράμπα της P στην αρχή','s',0.05,{zero:true,show:p=>p.ctl==='P'}),num('Rd','R της στατικότητας','W/V',1e3,{show:p=>p.ctl==='droop'}),
    num('kpv','k_p του βρόχου τάσης','A/V',1,{zero:true,show:p=>p.ctl==='V'}),num('kiv','k_i του βρόχου τάσης','A/(V·s)',100,{zero:true,show:p=>p.ctl==='V'}),
    num('Imax','Μέγιστο ρεύμα της πλευράς a','A',1800),num('L','L της πλευράς a','H',0.2,{hint:'Ο Jovcic, Παράδειγμα 30.3, (30.2): L = ΔV·d/(f·ΔI) = 0,2 H για 1500 Hz και κυμάτωση 6 %.'}),num('R','R του πηνίου','Ω',0,{zero:true}),
    num('C','C της πλευράς b','F',200e-6),num('Vb0','Αρχική τάση του C','V',397e3,{zero:true}),num('bwi','Εύρος ζώνης του βρόχου ρεύματος','Hz',100)],
   value:p=>p.ctl==='P'?null:p.Vref,unit:'V',
   draw:()=>'<rect x="-40" y="-40" width="80" height="110" rx="4"/><path class="thin" d="M-40,70 L40,-40"/>'+tx('=',-20,-12,'bsm')+tx('=',20,40,'bsm')+'<path d="M-50,-30 H-40 M-50,-10 H-40 M40,-30 H50 M40,-10 H50"/>'+tx('a',-30,-26,'bsm')+tx('b',30,-26,'bsm')
    +sl('M40,20 H50 M40,30 H50 M40,40 H50 M40,50 H50 M40,60 H50')},
  // 4.21 (§87): a phasor measurement unit at a point of a three-phase network, in series: the voltage at its side 1 and the current
  // from side 1 to side 2, as synchrophasors of positive sequence over one window of periods of f (RMS; the phase on cos(2πf₀t) with
  // t = 0 as the rollover of a UTC second, the definition of IEC/IEEE 60255-118-1 §4.2–4.3, or on sin(ω₁t) as the blocks of the
  // studio), and P, Q of positive sequence. The estimate itself is our own (one-cycle windows, no compliance claimed)
  PMU3:{name:'Μονάδα μέτρησης φασιθετών (PMU, θετική ακολουθία)',prefix:'PMU',group:'Δίκτυο',
   pins:p=>isBus(p)?{abc1:[-30,0],abc2:[30,0]}:{a1:[-30,-10],b1:[-30,0],c1:[-30,10],a2:[30,-10],b2:[30,0],c2:[30,10]},
   spins:{v:O(-10,-25),thv:O(0,-25),p:O(10,-25),i:O(-10,25),thi:O(0,25),q:O(10,25)},box:[-20,-15,40,30],
   bus:p=>isBus(p)?{abc1:['a1','b1','c1'],abc2:['a2','b2','c2']}:{},
   params:[num('f','Ονομαστική συχνότητα f₀','Hz',50,{hint:'Το παράθυρο είναι «Περίοδοι ανά παράθυρο» φορές 1/f₀, ανά περίοδο: οι έξοδοι αλλάζουν στο τέλος κάθε περιόδου, την ίδια στιγμή σε όλες τις μονάδες. Ο κοινός χρόνος αναφοράς είναι ο χρόνος της προσομοίωσης.'}),
    num('np','Περίοδοι ανά παράθυρο','',1,{hint:'Ακέραιος, τουλάχιστον 1.'}),
    sel('ref','Φάση ως προς',[['cos','cos(2πf₀t), με το t = 0 ως αρχή δευτερολέπτου UTC (ο ορισμός του IEC/IEEE 60255-118-1)'],['sin','sin(ω₁t) από το t = 0, όπως τα μπλοκ μέτρησης και οι πηγές του εργαλείου']],'cos',
     {hint:'Ο φασιθέτης είναι η ενεργός τιμή με τη φάση ως προς το συνημίτονο της ονομαστικής συχνότητας. Οι πηγές του εργαλείου γράφονται με ημίτονο: μια πηγή με φάση φ δίνει φασιθέτη φ − 90°. Ο έλεγχος συμμόρφωσης με το πρότυπο (κλάσεις P και M) δεν έχει γίνει.'}),
    CONN('abc1 και abc2')],
   value:p=>p.f,unit:'Hz',
   draw:p=>'<rect x="-20" y="-15" width="40" height="30" rx="3"/>'+tx('PMU',0,4,'bsm')+(isBus(p)?sbl('M-30,0 H-20 M20,0 H30'):'<path d="M-30,-10 H-20 M-30,0 H-20 M-30,10 H-20 M20,-10 H30 M20,0 H30 M20,10 H30"/>')
    +sl('M-10,-15 V-25 M0,-15 V-25 M10,-15 V-25 M-10,15 V25 M0,15 V25 M10,15 V25')},
  GFMC:{name:'Έλεγχος grid-forming (στατικότητα, VSM, PSC, dVOC, matching)',prefix:'GFM',group:'Δίκτυο',pins:{},
   spins:p=>({...(isBus(p)?{meas:I(-50,0)}:{vdc:I(-50,-60),va:I(-50,-40),vb:I(-50,-30),vc:I(-50,-20),ia:I(-50,0),ib:I(-50,10),ic:I(-50,20),
    ...(p.inner==='cascade'?{oa:I(-50,40),ob:I(-50,50),oc:I(-50,60)}:{})}),...(p.sync==='g'?(isBus(p)?{ga:I(-50,40),gb:I(-50,60),gc:I(-50,80)}:{ga:I(-50,80),gb:I(-50,90),gc:I(-50,100)}):{}),
    ...(isBus(p)?{m:O(50,-30)}:{ma:O(50,-40),mb:O(50,-30),mc:O(50,-20)}),th:O(50,0),w:O(50,10),p:O(50,30),q:O(50,40),e:O(50,50),lim:O(50,60),...(p.law==='match'||p.dcc==='on'?{idc:O(50,80)}:{})}),box:[-40,-70,80,180],blk:true,
   bus:p=>isBus(p)?{meas:['ia','ib','ic','va','vb','vc','oa','ob','oc','vdc'],m:['ma','mb','mc']}:{},
   params:[sel('law','Νόμος',[['droop','Στατικότητα P–f και Q–V (με φίλτρο)'],['vsm','Εικονική σύγχρονη μηχανή (synchronverter)'],['psc','Συγχρονισμός μέσω ισχύος (PSC)'],['dvoc','Ταλαντωτής dVOC (dispatchable virtual oscillator control, 4.20.2)'],['match','Matching control: ω από την τάση DC (4.20.2)']],'droop',{hint:'Στατικότητα: ω = ω* − m_p·(P_f − P_ref), E = V* − n_q·(Q_f − Q_ref) (Rocabert κ.ά. 2012). VSM: 2H·dω/dt = P_ref − P/ω − D_p·(ω − ω_r), D_p = 1/m_p, dψ/dt = (Q_ref − Q + D_q·(V_ref − V))/(D_q·τ_v), E = ω·ψ (Zhong & Weiss 2011). PSC: dθ/dt = ω₀ + k_p·(P_ref − P), v = V₀ − H_HP(s)·i (Zhang κ.ά. 2010). dVOC: dθ/dt = ω₀·(1 + η·(P_ref/V*² − P/E²)), dE/dt = ω₀·η·((Q_ref/V*² − Q/E²)·E + α·(V*² − E²)·E/V*²), η = m_p·V*², α = 1/(2·n_q·V*) (Tayyebi κ.ά. 2020 (22)). Matching: dθ/dt = ω₀·v_dc/V_dc* (ω = v_dc σε pu), E = k_p·(V* − |v|) + k_i·∫(V* − |v|), και ρεύμα της πηγής DC i*_dc = (1 − v_dc)/m_p + P_ref στην έξοδο idc (Tayyebi κ.ά. 2020 (10), (16)–(17)).'}),
    sel('inner','Εσωτερικός έλεγχος',[['direct','Άμεσα η τάση (εικονική εμπέδηση, όριο ρεύματος με το διάνυσμα αναφοράς ρεύματος)'],['cascade','Καταρράκτης: βρόχος τάσης πυκνωτή και βρόχος ρεύματος (φίλτρο LC)']],'direct',{hint:'Άμεσα: η τάση του μετατροπέα είναι η αναφορά (το πηνίο του είναι η «σύγχρονη αντίδραση»)· όταν το ρεύμα που θα έβγαινε ξεπερνά το I_max, ο ίδιος νόμος γίνεται έλεγχος ρεύματος με το περιορισμένο διάνυσμα (Zhang κ.ά. (54)–(55)). Καταρράκτης: PI τάσης στον πυκνωτή → αναφορά ρεύματος (κορεσμός |i| ≤ I_max) → PI ρεύματος, με αποσύζευξη (Rocabert κ.ά. Σχ. 2)· χρειάζεται και το ρεύμα εξόδου o.'}),
    num('S','Ονομαστική ισχύς (βάση)','VA',10e3),num('Vac','Ονομαστική τάση AC (πολική, RMS)','V',400),num('Vdc','Ονομαστική τάση DC','V',800,{hint:'m = v_c·V̂/(v_dc/2), με τη μετρημένη v_dc αν συνδεθεί (πάνω από 0,1 pu), αλλιώς την ονομαστική.'}),num('f0','Ονομαστική συχνότητα','Hz',50),
    txt('Pref','P_ref (από τον μετατροπέα)','0',{sched:true,unit:'pu',hint:'Σταθερή ή «t:τιμή». Θετική: ισχύς προς το δίκτυο AC.'}),
    txt('Qref','Q_ref (από τον μετατροπέα)','0',{sched:true,unit:'pu',show:p=>p.law!=='psc'}),
    txt('Vref','V_ref (πλάτος, ή V₀ στο PSC)','1',{sched:true,unit:'pu'}),
    num('mp','Στατικότητα συχνότητας m_p (Δf για 1 pu P)','%',2,{show:p=>p.law!=='psc',hint:'Στο dVOC δίνει το η = m_p·V*², και στο matching το κέρδος της τάσης DC k_dc = 1/m_p: η ίδια κλίση με τη στατικότητα (Tayyebi κ.ά. 2020).'}),num('nq','Στατικότητα τάσης n_q (ΔV για 1 pu Q)','%',5,{show:p=>p.law!=='psc'&&p.law!=='match',hint:'Στο dVOC δίνει το α = 1/(2·n_q·V*): κοντά στο V* η ίδια κλίση Q–V.'}),
    num('kpm','Κέρδος k_p του πλάτους (matching)','pu/pu',0.001,{zero:true,show:p=>p.law==='match',hint:'E = k_p·(V* − |v|) + k_i·∫(V* − |v|) (Tayyebi κ.ά. 2020 (17), Πίν. I: 0,001 και 0,5).'}),num('kim','Κέρδος k_i του πλάτους (matching)','1/s',0.5,{zero:true,show:p=>p.law==='match'}),
    txt('mu0','Αρχική τιμή του πλάτους (matching)','',{unit:'pu',show:p=>p.law==='match',hint:'Κενό: V_ref. Σε δίκτυο από ροή φορτίου: η E της πηγής του μετατροπέα πίσω από το πηνίο.'}),
    sel('dcc','Έλεγχος της πλευράς DC (4.20.3)',[['off','Όχι: ιδανική πλευρά DC (ή η πηγή DC με δικό της έλεγχο)'],['on','Ναι: αναφορά ρεύματος της πηγής DC i*_dc στην έξοδο idc']],'off',{show:p=>p.law!=='match',hint:'Η ρύθμιση της τάσης DC του matching (Tayyebi κ.ά. 2020 (10)) και για τους άλλους νόμους: i*_dc = k_dc·(V_dc* − v_dc) + P_ref/V_dc* + G_dc·v_dc + (v_dc·i_x − P)/V_dc*, με k_dc = 1/m_p, σε pu του S/V_dc. Η πηγή DC (υστέρηση, όριο) είναι στο κύκλωμα, όπως στο matching. Οι νόμοι αυτοί δεν βλέπουν τη v_dc: όταν η πηγή μένει στο όριό της, ο πυκνωτής DC αδειάζει (§IV-D).'}),
    num('Gdc','G_dc (απώλειες DC στη ροή του ρεύματος DC)','pu',0,{zero:true,show:p=>p.law==='match'||p.dcc==='on'}),
    sel('plim','Όριο ρεύματος μέσω της P_ref (4.20.3)',[['off','Όχι'],['on','Ναι: P_ref − γ_p·(|i| − i_th) όταν |i| > i_th']],'off',{hint:'Tayyebi κ.ά. 2020 (24), §IV-E: όταν το μέτρο του ρεύματος του μετατροπέα ξεπερνά το κατώφλι i_th, η αναφορά ισχύος πέφτει κατά γ_p·(|i| − i_th), σε κάθε νόμο και στην αναφορά ρεύματος DC. Κρατά το ρεύμα κάτω από το όριο σε μεγάλη αύξηση του φορτίου· μετακινεί και το σημείο λειτουργίας όσο το ρεύμα μένει πάνω από το i_th.'}),
    num('ith','Κατώφλι i_th','pu',0.9,{show:p=>p.plim==='on',hint:'Μικρότερο από το I_max (στο paper 0,9 με όριο 1,2).'}),num('gp','Κέρδος γ_p','pu/pu',2.3,{show:p=>p.plim==='on'}),
    num('fpl','Φίλτρο του |i| της (24) (4.20.4)','Hz',0,{zero:true,show:p=>p.plim==='on',hint:'Δική μας προσθήκη, όχι του paper: φίλτρο πρώτης τάξης στο μέτρο του ρεύματος πριν από τη (24). 0: χωρίς φίλτρο (4.20.3). Στο ieee9_gfm με +150 MW χωρίς φίλτρο η στατικότητα και το dVOC ταλαντώνονται στο όριο· με 20 Hz ησυχάζουν και οι τέσσερις νόμοι (THEORY §8ΩΑ.1).'}),
    sel('mdc','Διαμόρφωση (4.20.4)',[['meas','Με τη μετρημένη v_dc (4.18): η τάση AC δεν εξαρτάται από τη v_dc'],['nom','Με την ονομαστική V_dc*, όπως η (9) των Tayyebi κ.ά.: η τάση AC ακολουθεί τη v_dc']],'meas',{show:p=>p.law!=='match',hint:'Το matching διαμορφώνει πάντα με την ονομαστική. Με «ονομαστική» η τάση του κόμβου μεταγωγής είναι v_c·v_dc, και η αναφορά DC (10) παίρνει την ισχύ v_dc·v_c·i (THEORY §8ΩΑ.2).'}),
    num('kap','Γωνία κ του δικτύου (dVOC)','°',90,{zero:true,show:p=>p.law==='dvoc',hint:'κ = atan(ωL/R) της σύζευξης (Tayyebi κ.ά. 2020 (21), Colombino κ.ά. 2019 (25)). 90°: επαγωγικό δίκτυο, η μορφή που μοιάζει με στατικότητα (P–f, Q–V). Με κ < 90° η P και η Q μοιράζονται τη συχνότητα και το πλάτος.'}),
    txt('E0','Αρχικό πλάτος του ταλαντωτή (dVOC)','',{unit:'pu',show:p=>p.law==='dvoc',hint:'Κενό: V_ref. Μικρό (π.χ. 0,01): εκκίνηση από σχεδόν μηδενική τάση· το E = 0 είναι σημείο ηρεμίας του ταλαντωτή, και από κάθε E > 0 πάει στο V* (Colombino κ.ά. 2019).'}),
    num('fp','Φίλτρο των P και Q (στατικότητα)','Hz',5,{show:p=>p.law==='droop',hint:'Η στατικότητα με φίλτρο ω_f είναι ισοδύναμη με VSM με 2H = 1/(m_p·ω_f) και D_p = 1/m_p (THEORY §8Ε).'}),
    num('H','Σταθερά αδράνειας H','s',2,{show:p=>p.law==='vsm',hint:'2H = J·ω₀²/S. Η σταθερά χρόνου του βρόχου στατικότητας τ_f = J/D_p = 2H·m_p (Zhong & Weiss: J = D_p·τ_f).'}),
    num('tv','Σταθερά χρόνου του βρόχου τάσης τ_v','s',0.01,{show:p=>p.law==='vsm',hint:'K = θ̇ₙ·D_q·τ_v: ο ολοκληρωτής της ροής διέγερσης M_f·i_f.'}),
    num('tdr','Στατικότητες ενεργές από','s',0,{zero:true,show:p=>p.law==='vsm',hint:'Πριν: ω_r = η συχνότητα του δικτύου από το PLL και χωρίς D_q (P και Q ακολουθούν ακριβώς τις αναφορές· «set mode» του synchronverter).'}),
    num('kp','Κέρδος συγχρονισμού k_p','rad/s/pu',50,{show:p=>p.law==='psc',hint:'dΔθ/dt = k_p·(P_ref − P) (Zhang κ.ά. (4)). Το εύρος του βρόχου ≈ k_p·E·V·cosδ/X· σε ασθενές δίκτυο (X ≈ 1 pu) το paper βάζει 130.'}),
    sel('avc','Τάση στο PSC',[['fixed','Σταθερή V₀ = V_ref'],['vac','Ρύθμιση της τάσης AC: V₀ = V_ref + K_E/(1 + T_E·s)·(U_ref − |u|)']],'vac',{show:p=>p.law==='psc'}),
    txt('Uref','U_ref (τάση AC στο σημείο σύνδεσης)','1',{sched:true,unit:'pu',show:p=>p.law==='psc'&&p.avc!=='fixed'}),
    num('KE','Κέρδος K_E','pu/pu',5,{show:p=>p.law==='psc'&&p.avc!=='fixed'}),num('TE','Σταθερά χρόνου T_E','s',0.05,{show:p=>p.law==='psc'&&p.avc!=='fixed'}),
    num('kv','Υψιπερατή ανάδραση ρεύματος k_v (ενεργή απόσβεση)','pu',0,{zero:true,show:p=>p.inner!=='cascade',hint:'v = … − k_v·s/(s + α_v)·i (Zhang κ.ά. (36)–(37)): «ενεργή αντίσταση» στις μεταβολές, όχι στη μόνιμη κατάσταση· αποσβένει τον συντονισμό στα 50 Hz όταν η R είναι μικρή. Μικρότερο από την αντίδραση σύζευξης X (στο paper 0,477 με X ≈ 1,26 pu): αλλιώς η σύζευξη γίνεται ωμική στα μεταβατικά και η στατικότητα P–f χάνει τον συγχρονισμό. 0 = χωρίς.'}),
    num('av','α_v του υψιπερατού','rad/s',40,{show:p=>p.inner!=='cascade'&&parseFloat(p.kv)!==0}),
    num('Rv','Εικονική αντίσταση R_v','pu',0,{zero:true}),num('Xv','Εικονική αντίδραση X_v','pu',0,{zero:true,hint:'v_ref = E − (R_v + jX_v)·i (ρεύμα του μετατροπέα στο άμεσο, ρεύμα εξόδου στον καταρράκτη· Rocabert κ.ά. (19)). Κάνει την έξοδο πιο επαγωγική και μοιράζει καλύτερα την άεργο.'}),
    num('Xc','X του πηνίου του μετατροπέα','pu',0.15,{hint:'Για την αποσύζευξη ωL·i και τον βρόχο ρεύματος.'}),
    num('Bf','Β του πυκνωτή του φίλτρου (ω₀C)','pu',0.1,{show:p=>p.inner==='cascade'}),
    num('Tvl','Χρόνος απόκρισης του βρόχου τάσης','s',0.003,{show:p=>p.inner==='cascade',hint:'K_p = B/(ω₀τ), K_i = K_p/(2τ) (ζ ≈ 0,7), τ = T/3. Πολύ γρηγορότερος από τον βρόχο της στατικότητας και από τη σύζευξη με το δίκτυο: με k_ff < 1 το υπόλοιπο ρεύμα εξόδου (1 − k_ff)·o = (1 − k_ff)·(v − v_δικτύου)/jX είναι ανάδραση της τάσης που πρέπει να τη νικά το K_p (4.18: έως ~4 ms με X ≈ 0,2 pu)· ο βρόχος ρεύματος 5–8 φορές γρηγορότερος.'}),num('Til','Χρόνος απόκρισης του βρόχου ρεύματος','s',0.0005,{show:p=>p.inner==='cascade',hint:'K_p = X/(ω₀τ), K_i = K_p/(4τ), τ = T/3.'}),
    num('kff','Πρόσθια τροφοδότηση του ρεύματος εξόδου k_ff','',0.8,{zero:true,show:p=>p.inner==='cascade',hint:'i_ref = k_ff·o + jB·v + PI(v_ref − v). Με k_ff = 1 και βρόχο ρεύματος με υστέρηση τ_i, ένα φορτίο G φαίνεται σαν χωρητικότητα −G·τ_i δίπλα στο B/ω₀: ασταθές όταν G·τ_i > B/ω₀ (μικρός πυκνωτής, μεγάλο φορτίο)· με k_ff μικρό, ο βρόχος τάσης δεν φτάνει απέναντι σε δίκτυο μικρής εμπέδησης. 0,8: συμβιβασμός (4.18).'}),
    num('Imax','Μέγιστο ρεύμα','pu',1.2,{hint:'Στο όριο ο ολοκληρωτής της ροής της VSM μόνο ξετυλίγεται· οι νόμοι P–f της στατικότητας και της VSM συνεχίζουν: η ισχύς που κόβει το όριο ανεβάζει τη συχνότητα, και οι παράλληλες μονάδες μένουν σε βήμα.'}),num('Ufd','Ανίχνευση σφάλματος: |v| κάτω από','pu',0.6,{show:p=>p.law==='psc',hint:'Στο σφάλμα (και 50 ms μετά) το PSC περνά στο εφεδρικό PLL, με τη γωνία στη μετατόπιση που είχε από αυτό, και κρατά τη ρύθμιση της τάσης (Zhang κ.ά.: εναλλαγή από λογική ανίχνευσης σφάλματος).'}),num('tsoft','Ομαλή εκκίνηση (ράμπα του E από το 0)','s',0.05,{zero:true}),sel('fi','Αρχικές τιμές του νόμου',[['zero','P_f = Q_f = 0, ψ = 1 (όπως η 4.18)'],['ref','Από τις αναφορές στο t = 0 (εκκίνηση από ροή φορτίου)']],'zero',{show:p=>p.law!=='psc',hint:'4.18.1: σε δίκτυο που ξεκινά από τη ροή φορτίου, τα φίλτρα της στατικότητας και η ροή της VSM ξεκινούν από P_ref, Q_ref και V_ref, ώστε η συχνότητα να μην ξεκινά μετατοπισμένη κατά m_p·P_ref.'}),num('ac','Εύρος του ελέγχου ρεύματος στο όριο α_c','rad/s',600,{show:p=>p.inner!=='cascade',hint:'v = α_c·L·(i_ref − i) + jωL·i + u_f όταν |i_ref| > I_max· i_ref από τον νόμο της τάσης, άρα κάτω από το όριο v = v_ref ακριβώς.'}),
    num('vmax','Μέγιστη |v_conv|','pu',1.3),
    sel('sync','PLL (συγχρονισμός, εφεδρικό στο όριο)',[['v','Στην τάση v'],['g','Σε χωριστή τάση g (δίκτυο, πριν από τον διακόπτη)']],'v'),
    num('bw','Εύρος ζώνης του PLL','Hz',20),num('tsync','Συγχρονισμός με το PLL ως','s',0,{zero:true,hint:'Ως τότε το θ ακολουθεί το PLL (π.χ. πριν κλείσει ο διακόπτης προς το δίκτυο). Μετά, ο νόμος.'}),
    num('th0','Αρχική γωνία','°',0,{signed:true,zero:true,hint:'Η γωνία της φάσης a ως συνημίτονο, v_a = V·cos θ (όπως ο έλεγχος του MMC).'}),
    num('fm','Φίλτρο των μετρήσεων','Hz',2000),sel('conn','Ακροδέκτες σήματος',[['sep','Χωριστοί'],['bus','Δίαυλοι meas (i_abc, v_abc, o_abc, v_dc) και m']],'sep',{hint:'Με δίαυλους ο έλεγχος συνδέεται με τον μετατροπέα VSC (μέσο μοντέλο) με δύο σύρματα: meas → meas και m → m.'})],value:()=>null,
   draw:p=>{const b=isBus(p),L=b?[]:[-60,-40,-30,-20,0,10,20,...(p.inner==='cascade'?[40,50,60]:[])],G=p.sync==='g'?(b?[40,60,80]:[80,90,100]):[],R=[...(b?[]:[-40,-30,-20]),0,10,30,40,50,60];
    return '<rect class="block sblk" x="-40" y="-70" width="80" height="180" rx="4"/>'+tx('GFM',0,-6,'bsm')+tx({droop:'P–f, Q–V',vsm:'VSM',psc:'PSC'}[p.law]||'',0,10,'bsm')+sl([...L,...G].map(y=>`M-50,${y} H-40`).join(' ')+' '+R.map(y=>`M40,${y} H50`).join(' '))+(b?sbl('M-50,0 H-40 M40,-30 H50'):'');}},
  // 4.16 (§42): the line-commutated converter (LCC) of the first CIGRE HVDC benchmark: the six-pulse Graetz bridge of
  // thyristors with its firing (phase-locked oscillator, equidistant pulses, the instant inside the step) and the measurement
  // of α and γ; the twelve-pulse station (two bridges behind YNy0 and YNd1 transformers, or the average model); the control of
  // a station (current with α limits, constant γ with the current margin, VDCOL, start-up, blocking, forced retard); a
  // three-phase AC filter (THEORY §8ω)
  LCC6:{name:'Γέφυρα θυρίστορ 6 παλμών (LCC)',prefix:'BR',group:'Ημιαγωγοί',
   pins:p=>isBus(p)?{abc:[-50,-20],p:[50,-40],n:[50,0]}:{a:[-50,-30],b:[-50,-20],c:[-50,-10],p:[50,-40],n:[50,0]},
   bus:p=>isBus(p)?{abc:['a','b','c']}:{},
   spins:p=>({ao:I(-50,20),blk:I(-50,30),...(p.sync==='sig'?{va:I(-50,50),vb:I(-50,60),vc:I(-50,70)}:{}),am:O(50,20),gm:O(50,30),gl:O(50,40),th:O(50,50),cf:O(50,60)}),box:[-40,-50,80,130],
   params:[IMPL('fast','Αναλυτική: έξι θυρίστορ με τα snubber τους, PLL, συγκριτές για τη στιγμή της πυροδότησης και μπλοκ μέτρησης του α και του γ. Γρήγορη: οι βαλβίδες, ο ταλαντωτής, η πυροδότηση και η μέτρηση μέσα σε ένα στοιχείο του λύτη.'),
    sel('sync','Τάσεις μετάβασης (συγχρονισμός)',[['sig','Από σήματα va, vb, vc (ο ζυγός AC πριν από την αυτεπαγωγή μετάβασης)'],['term','Οι τάσεις στους ακροδέκτες AC της γέφυρας']],'sig',{hint:'Ο ταλαντωτής (PLO) κλειδώνει σε αυτές τις τάσεις, και από τις διαβάσεις τους από το μηδέν μετριούνται το α και το γ. Η μηδενική ακολουθία δεν μετρά. Το α της θεωρίας μετριέται από τις τάσεις πίσω από την αυτεπαγωγή μετάβασης (ο ζυγός AC με τα φίλτρα, μέσω του μετασχηματιστή). Στους ακροδέκτες της γέφυρας οι εγκοπές της μετάβασης αλλοιώνουν τον ταλαντωτή και δίνουν ψεύτικες διαβάσεις: μόνο για μικρή αυτεπαγωγή μετάβασης.'}),
    num('shift','Μετατόπιση των τάσεων μετάβασης','°',0,{signed:true,zero:true,hint:'−30° για γέφυρα πίσω από μετασχηματιστή Yd1 όταν οι τάσεις έρχονται από το πρωτεύον (η πλευρά των βαλβίδων καθυστερεί 30°).'}),
    num('f0','Ονομαστική συχνότητα','Hz',50),num('bw','Εύρος ζώνης του ταλαντωτή (PLO)','Hz',1.125,{hint:'Ίδιες εξισώσεις με το μπλοκ PLL: ω_n = 2π·εύρος, ζ = 0,707. 1,125 Hz δίνει K_p = 10, K_i = 50, όπως η γέφυρα του benchmark της CIGRE.'}),
    sel('ini','Αρχική γωνία του ταλαντωτή',[['v','Από την τάση στο πρώτο βήμα (κλειδωμένος από την αρχή)'],['th0','Η τιμή θ₀']],'v',{hint:'Με εύρος ζώνης 1 Hz ο ταλαντωτής θέλει δευτερόλεπτα για να κλειδώσει από τυχαία γωνία· από την τάση ξεκινά κλειδωμένος.'}),
    num('th0','θ₀','°',0,{signed:true,zero:true,show:p=>p.ini==='th0',hint:'Η γωνία της τάσης μετάβασης της φάσης a στο t = 0 μείον 90° (με v_a = V̂·sin(ωt + φ): φ − 90°).'}),
    num('pw','Διάρκεια παλμού','°',120,{hint:'120°: κάθε βαλβίδα έχει παλμό όσο θα έπρεπε να άγει, οπότε ξανανάβει μόνη της μετά από διακοπή του ρεύματος.'}),
    num('Ron','R_on ανά βαλβίδα','Ω',0.01),num('Vf','Τάση κατωφλίου V_f','V',0,{zero:true}),num('Roff','R_off','Ω',1e8),
    num('Rsn','Snubber: R','Ω',5000,{zero:true,hint:'R και C σε σειρά, παράλληλα σε κάθε βαλβίδα· 0 = χωρίς snubber.'}),num('Csn','Snubber: C','F',0.05e-6,{zero:true}),
    num('tq','Χρόνος σβέσης t_q','s',0,{zero:true,hint:'0 = ιδανικά θυρίστορ (όπως το benchmark). Με t_q > 0 μια βαλβίδα που ξαναβρίσκει θετική τάση πριν περάσει το t_q από τη σβέση της ξανανάβει χωρίς παλμό: αποτυχία μετάβασης όταν γ < ω·t_q. Μόνο στον λύτη της εφαρμογής.'}),
    num('Ith','Κατώφλι αγωγής για τη μέτρηση','A',1,{show:p=>p.impl==='blocks',hint:'Αναλυτική υλοποίηση: η μέτρηση βλέπει μια βαλβίδα σε αγωγή όταν το ρεύμα της ξεπερνά αυτή την τιμή.'}),CONN('abc')],value:()=>null,
   draw:p=>'<rect x="-40" y="-50" width="80" height="130" rx="4"/><path class="thin" d="M-12,-14 H12 M0,-14 V2 M-10,2 H10 M-10,2 L0,-12 L10,2 M10,-4 L18,-12"/>'+tx('LCC',0,22,'bsm')+tx('6 παλμοί',0,36,'bsm')+(isBus(p)?'<path d="M-50,-20 H-40"/>':'<path d="M-50,-30 H-40 M-50,-20 H-40 M-50,-10 H-40"/>')+'<path d="M40,-40 H50 M40,0 H50"/>'+sl('M-50,20 H-40 M-50,30 H-40'+(p.sync==='sig'?' M-50,50 H-40 M-50,60 H-40 M-50,70 H-40':'')+' M40,20 H50 M40,30 H50 M40,40 H50 M40,50 H50 M40,60 H50')},
  LCCS:{name:'Σταθμός LCC 12 παλμών (HVDC)',prefix:'ST',group:'Δίκτυο',
   pins:p=>isBus(p)?{abc:[-60,-20],p:[60,-40],n:[60,0]}:{a:[-60,-30],b:[-60,-20],c:[-60,-10],p:[60,-40],n:[60,0]},
   bus:p=>isBus(p)?{abc:['a','b','c']}:{},
   spins:{ao:I(-60,20),blk:I(-60,30),am:O(60,20),gm:O(60,30),cf:O(60,40),vd:O(60,50),id:O(60,60)},box:[-50,-50,100,130],
   params:[sel('model','Μοντέλο',[['det','Λεπτομερές: δύο γέφυρες 6 παλμών πίσω από μετασχηματιστές YNy0 και YNd1'],['avg','Μέσο μοντέλο (χωρίς μεταγωγές)']],'det',{hint:'Μέσο μοντέλο: στην πλευρά DC πηγή V_d0·cos α με την ισοδύναμη αντίσταση μετάβασης R_c = 2·(3/π)·X_c και δίοδο (Kundur Σχ. 10.18, εξ. 10.29–10.30)· στην πλευρά AC πηγές ρεύματος της θεμελιώδους με P = V_d·I_d και Q = I_d·√(V_d0² − V_d²) (cos φ = V_d/V_d0, εξ. 10.24). Χωρίς αρμονικές και χωρίς αποτυχία μετάβασης (το γ υπολογίζεται από την εξ. 10.10).'}),
    {...IMPL('fast','Οι δύο γέφυρες 6 παλμών με αυτή την υλοποίηση.'),show:p=>p.model!=='avg'},
    num('Sn','Ονομαστική ισχύς κάθε μετασχηματιστή','VA',603.73e6),num('U1','Πολική τάση πλευράς AC','V',345e3),num('U2','Πολική τάση πλευράς βαλβίδων','V',213.4557e3),num('f','Συχνότητα','Hz',50),
    num('uk','Τάση βραχυκύκλωσης u_k','%',18,{hint:'Η σκέδαση είναι η αυτεπαγωγή μετάβασης: X_c = u_k·U₂²/S_n στην πλευρά των βαλβίδων.'}),
    num('tap','Τάπ στην πλευρά AC','%',0,{signed:true,zero:true,hint:'+1 % = 1 % περισσότερες σπείρες στην πλευρά AC (χαμηλότερη τάση στις βαλβίδες), όπως στον τριφασικό μετασχηματιστή.'}),
    num('bw','Εύρος ζώνης των ταλαντωτών','Hz',1.125,{show:p=>p.model!=='avg'}),num('pw','Διάρκεια παλμού','°',120,{show:p=>p.model!=='avg'}),
    num('Ron','R_on ανά βαλβίδα','Ω',0.01,{show:p=>p.model!=='avg'}),num('Vf','V_f ανά βαλβίδα','V',0,{zero:true,show:p=>p.model!=='avg'}),
    num('Rsn','Snubber: R','Ω',5000,{zero:true,show:p=>p.model!=='avg'}),num('Csn','Snubber: C','F',0.05e-6,{zero:true,show:p=>p.model!=='avg'}),
    num('tq','Χρόνος σβέσης t_q','s',0,{zero:true,show:p=>p.model!=='avg'}),
    num('fm','Φίλτρο της τάσης AC (μέσο μοντέλο)','Hz',500,{show:p=>p.model==='avg',hint:'Βαθυπερατό στο πλάτος της τάσης του ζυγού από το PLL.'}),CONN('abc')],value:()=>null,
   draw:p=>'<rect x="-50" y="-50" width="100" height="130" rx="4"/><circle class="thin" cx="-26" cy="-14" r="10"/><circle class="thin" cx="-16" cy="-14" r="10"/><path class="thin" d="M4,-24 H28 M16,-24 V-8 M6,-8 H26 M6,-8 L16,-22 L26,-8"/>'+tx('LCC',0,22,'bsm')+tx('12 παλμοί',0,36,'bsm')+(isBus(p)?'<path d="M-60,-20 H-50"/>':'<path d="M-60,-30 H-50 M-60,-20 H-50 M-60,-10 H-50"/>')+'<path d="M50,-40 H60 M50,0 H60"/>'+sl('M-60,20 H-50 M-60,30 H-50 M50,20 H60 M50,30 H60 M50,40 H60 M50,50 H60 M50,60 H60')},
  LCCC:{name:'Έλεγχος σταθμού LCC (HVDC)',prefix:'LC',group:'Δίκτυο',pins:{},
   spins:p=>({id:I(-50,-30),vd:I(-50,-20),...(p.mode==='inv'?{gm:I(-50,-10)}:p.iext==='sig'?{iref:I(-50,-10)}:{}),ao:O(50,-30),blk:O(50,-20),iord:O(50,-10),cc:O(50,0),fr:O(50,10)}),box:[-40,-40,80,70],blk:true,
   params:[sel('mode','Σταθμός',[['rect','Ανορθωτής: σταθερό ρεύμα'],['inv','Αντιστροφέας: σταθερό γ, και ρεύμα με περιθώριο']],'rect'),
    sel('iext','Εντολή ρεύματος',[['sig','Από τον αντιστροφέα (είσοδος iref, όπως στο benchmark)'],['own','Δική του, με VDCOL από τη δική του V_dc']],'sig',{show:p=>p.mode!=='inv'}),
    num('Idn','Ονομαστικό ρεύμα DC (βάση)','A',2000),num('Vdn','Ονομαστική τάση DC (βάση)','V',500e3),
    txt('Iord','Εντολή ρεύματος','1',{sched:true,unit:'pu',show:p=>p.mode==='inv'||p.iext!=='sig',hint:'Σταθερή ή «t:τιμή», π.χ. 0:1, 1:0.9.'}),
    num('tramp','Ράμπα της εντολής μετά την απεμπλοκή','s',0,{zero:true,show:p=>p.mode==='inv'||p.iext!=='sig',hint:'Εκκίνηση: η εντολή ανεβαίνει από το I_min του VDCOL στην τιμή της σε αυτόν τον χρόνο. 0 = αμέσως (όπως το benchmark).'}),
    num('Tid','Σταθερά του φίλτρου του ρεύματος','s',1.2e-3),
    num('KpR','K_p του PI ρεύματος','rad/pu',1.0989,{show:p=>p.mode!=='inv'}),num('TiR','T_i του PI ρεύματος','s',0.01092,{show:p=>p.mode!=='inv'}),
    num('aminR','α_min','°',5,{show:p=>p.mode!=='inv'}),num('amaxR','α_max','°',150.2,{show:p=>p.mode!=='inv'}),
    num('KpI','K_p του PI ρεύματος','rad/pu',0.63,{show:p=>p.mode==='inv'}),num('TiI','T_i του PI ρεύματος','s',0.01524,{show:p=>p.mode==='inv'}),
    num('aminC','α_min του PI ρεύματος','°',70,{show:p=>p.mode==='inv'}),
    num('KpG','K_p του PI του γ','rad/rad',0.7506,{show:p=>p.mode==='inv'}),num('TiG','T_i του PI του γ','s',0.0544,{show:p=>p.mode==='inv'}),
    num('aminG','α_min του PI του γ','°',90,{show:p=>p.mode==='inv'}),num('amaxI','α_max του αντιστροφέα','°',150.2,{show:p=>p.mode==='inv'}),
    num('gref','γ_ref','°',15,{show:p=>p.mode==='inv'}),num('dI','Περιθώριο ρεύματος ΔI','pu',0.1,{show:p=>p.mode==='inv'}),
    num('dgc','Αύξηση του γ από το σφάλμα ρεύματος (για σφάλμα ΔI)','°',16,{zero:true,show:p=>p.mode==='inv',hint:'Ομαλή μετάβαση από τον έλεγχο του γ στον έλεγχο ρεύματος: το γ_ref αυξάνεται γραμμικά με το σφάλμα ρεύματος (εντολή − I_d) ως αυτή την τιμή στο ΔI. Benchmark: 0,2793 rad.'}),
    num('gemin','Ελάχιστο σφάλμα του γ','°',-31.17,{signed:true,show:p=>p.mode==='inv',hint:'Το σφάλμα γ_ref − γ δεν πέφτει κάτω από αυτή την τιμή (benchmark: −0,544 rad).'}),
    num('V1','VDCOL: κάτω τάση','pu',0.4,{show:p=>p.mode==='inv'||p.iext!=='sig'}),num('I1','VDCOL: ρεύμα στην κάτω τάση','pu',0.55,{show:p=>p.mode==='inv'||p.iext!=='sig'}),
    num('V2','VDCOL: πάνω τάση','pu',0.9,{show:p=>p.mode==='inv'||p.iext!=='sig'}),num('I2','VDCOL: ρεύμα στην πάνω τάση','pu',1,{show:p=>p.mode==='inv'||p.iext!=='sig'}),
    num('Tv','VDCOL: φίλτρο της τάσης','s',0.02,{show:p=>p.mode==='inv'||p.iext!=='sig'}),num('kc','VDCOL: αντιστάθμιση R·I_d','pu',0.01,{zero:true,show:p=>p.mode==='inv'||p.iext!=='sig',hint:'Η τάση του VDCOL είναι V_d + k·I_d (pu): η τάση πιο μέσα στη γραμμή.'}),
    txt('blks','Μπλοκάρισμα t:κατάσταση','0:1, 0.04:0',{hint:'1 = μπλοκαρισμένες γέφυρες. Οι ολοκληρωτές κρατιούνται όσο είναι μπλοκαρισμένες.'}),
    sel('fr','Εξαναγκασμένη καθυστέρηση στο σφάλμα DC',[['off','Όχι (όπως το benchmark)'],['on','Ναι']],'off',{show:p=>p.mode!=='inv',hint:'Όταν η V_d του ανορθωτή μείνει κάτω από το V_fr για t_det (μετά το t_prot), το α πάει στο α_fr για t_fr και ο PI ξεκινά από εκεί.'}),
    num('Vfr','V_fr','pu',0.3,{show:p=>p.mode!=='inv'&&p.fr==='on'}),num('tdet','t_det','s',0.005,{show:p=>p.mode!=='inv'&&p.fr==='on'}),num('afr','α_fr','°',140,{show:p=>p.mode!=='inv'&&p.fr==='on'}),
    num('tfr','t_fr','s',0.1,{show:p=>p.mode!=='inv'&&p.fr==='on'}),num('tprot','t_prot','s',0.3,{zero:true,show:p=>p.mode!=='inv'&&p.fr==='on'})],value:()=>null,
   draw:p=>sb(80,70)+tx('LCC',0,-6,'bsm')+tx(p.mode==='inv'?'αντιστροφέας':'ανορθωτής',0,10,'bsm')+sl('M-50,-30 H-40 M-50,-20 H-40'+(p.mode==='inv'||p.iext==='sig'?' M-50,-10 H-40':'')+' M40,-30 H50 M40,-20 H50 M40,-10 H50 M40,0 H50 M40,10 H50')},
  FILT3:{name:'Φίλτρο AC τριφασικό',prefix:'FL',group:'Δίκτυο',pins:p=>{const n=neutOf(p,'neut','gnd')==='pin'?{n:[0,40]}:{};return isBus(p)?{abc:[0,-40],...n}:{a:[-20,-40],b:[0,-40],c:[20,-40],...n};},box:[-25,-30,50,60],
   bus:p=>isBus(p)?{abc:['a','b','c']}:{},
   params:[sel('kind','Είδος',[['c','Πυκνωτής'],['st','Συντονισμένο: C, L, R σε σειρά'],['hp','Υψιπερατό 2ης τάξης: C σε σειρά με (L ∥ R)'],['cig','Διπλό της CIGRE: C₁ σε σειρά με [(L + R + C₂) ∥ R_p]']],'c',{hint:'Ανά φάση, σε αστέρα με γειωμένο ουδέτερο. Συντονισμός του συντονισμένου στο 1/(2π√(LC₁)).'}),
    num('C1','C₁','F',1e-6),num('L','L','H',0.1,{show:p=>p.kind!=='c'}),num('R','R','Ω',10,{zero:true,show:p=>p.kind!=='c'}),
    num('C2','C₂','F',10e-6,{show:p=>p.kind==='cig'}),num('Rp','R_p','Ω',100,{show:p=>p.kind==='cig'}),...NEUT('neut','gnd',{hint:'«Στερεά γειωμένος»: όπως ως την 4.23.'}),CONN('abc')],value:p=>p.C1,unit:'F',
   draw:p=>'<rect class="block" x="-25" y="-30" width="50" height="60" rx="4"/>'+(isBus(p)?bl('M0,-40 V-30'):'<path d="M-20,-40 V-30 M0,-40 V-30 M20,-40 V-30"/>')+'<path class="thin" d="M0,-22 V-10 M-9,-10 H9 M-9,-5 H9 M0,-5 V4"/>'+(p.kind!=='c'?'<path class="thin" d="M0,4 c5,0 5,4 0,4 c5,0 5,4 0,4 c5,0 5,4 0,4"/>':'')+(neutOf(p,'neut','gnd')==='pin'?'<path d="M0,30 V40"/>':'<path class="thin" d="M-7,22 H7 M-4,25 H4"/>')},
  ZSER3:{name:'Τριφασική εμπέδηση σειράς (R + L + (R + L) ∥ R)',prefix:'Z',group:'Δίκτυο',pins:p=>isBus(p)?{abc1:[-40,0],abc2:[40,0]}:{a1:[-40,-20],b1:[-40,0],c1:[-40,20],a2:[40,-20],b2:[40,0],c2:[40,20]},box:[-25,-30,50,60],
   bus:p=>isBus(p)?{abc1:['a1','b1','c1'],abc2:['a2','b2','c2']}:{},
   params:[num('Rs','R σε σειρά','Ω',1,{zero:true}),num('Ls','L σε σειρά','H',0,{zero:true}),
    num('Rp1','Παράλληλος κλάδος: R','Ω',0,{zero:true}),num('Lp','Παράλληλος κλάδος: L','H',0.1,{zero:true}),num('Rp2','Παράλληλη R','Ω',0,{zero:true,hint:'Ανά φάση: R_s + L_s σε σειρά με (R_p1 + L_p) ∥ R_p2, χωρίς σύζευξη ανάμεσα στις φάσεις. 0 = χωρίς τον κλάδο. Η εμπέδηση των δικτύων AC του benchmark HVDC της CIGRE (απόσβεση στη 2η αρμονική).'}),CONN('abc')],value:()=>null,
   draw:p=>'<rect class="block" x="-25" y="-30" width="50" height="60" rx="4"/>'+(isBus(p)?bl('M-40,0 H-25 M25,0 H40'):'<path d="M-40,-20 H-25 M-40,0 H-25 M-40,20 H-25 M25,-20 H40 M25,0 H40 M25,20 H40"/>')+'<path class="thin" d="M-16,0 H-10 l2,-5 l4,10 l4,-10 l4,10 l2,-5 H16"/>'+tx('Z',0,22,'bsm')},
  // 4.16: the compact solver element behind the fast implementation of LCC6, and the measurement block of the detailed one (hidden)
  LCCX:{name:'Γέφυρα 6 παλμών (συμπαγής)',prefix:'BX',group:'Ημιαγωγοί',hidden:true,pins:{a:[-50,-30],b:[-50,-20],c:[-50,-10],p:[50,-40],n:[50,0]},
   spins:{ao:I(-50,20),blk:I(-50,30),va:I(-50,50),vb:I(-50,60),vc:I(-50,70),am:O(50,20),gm:O(50,30),gl:O(50,40),th:O(50,50),cf:O(50,60)},box:[-40,-50,80,130],
   params:[num('shift','Μετατόπιση','°',0,{signed:true,zero:true}),num('f0','f₀','Hz',50),num('bw','Εύρος ζώνης','Hz',1.125),sel('ini','Αρχή',[['v','v'],['th0','θ₀']],'v'),num('th0','θ₀','°',0,{signed:true,zero:true}),num('pw','Παλμός','°',120),
    num('Ron','R_on','Ω',0.01),num('Vf','V_f','V',0,{zero:true}),num('Roff','R_off','Ω',1e8),num('Rsn','R snubber','Ω',5000,{zero:true}),num('Csn','C snubber','F',0.05e-6,{zero:true}),num('tq','t_q','s',0,{zero:true})],value:()=>null,
   draw:()=>'<rect x="-40" y="-50" width="80" height="130" rx="4"/>'+tx('LCC',0,4,'bsm')},
  LCCM:{name:'Μέτρηση α και γ (γέφυρα 6 παλμών)',prefix:'LM',group:'Σήματα',hidden:true,pins:{},
   spins:{i1:I(-40,-40),i2:I(-40,-30),i3:I(-40,-20),i4:I(-40,-10),i5:I(-40,0),i6:I(-40,10),va:I(-40,20),vb:I(-40,30),vc:I(-40,40),w:I(-40,50),am:O(40,-20),gm:O(40,-10),gl:O(40,0),cf:O(40,10)},box:[-30,-50,60,110],blk:true,
   params:[num('shift','Μετατόπιση','°',0,{signed:true,zero:true}),num('f0','f₀','Hz',50),num('Ith','Κατώφλι αγωγής','A',1)],value:()=>null,
   draw:()=>sb(60,110)+tx('α, γ',0,4,'bsm')},
  // 4.14: the compact arm of an MMC (Model 2 with every cell, or Model 3 with one capacitor C/N), modulator and blocking inside
  MMCA:{name:'Βραχίονας MMC (συμπαγής)',prefix:'MA',group:'Ημιαγωγοί',hidden:true,pins:{a:[0,-50],b:[0,50]},spins:{ref:I(-40,-10),blk:I(-40,10),vs:O(40,-20),vav:O(40,-10),n:O(40,0),i:O(40,10),v:O(40,20)},box:[-30,-36,60,72],
   params:[num('N','N','',400),sel('model','Μοντέλο',[['cells','Κάθε πυκνωτής (Model 2)'],['avg','Ένας πυκνωτής C/N (Model 3)']],'cells'),num('C','C','F',10e-3),num('Vc','V_C ονομαστική','V',1600),num('v0','Αρχική V_C','V',1600,{zero:true}),num('Ron','R_on','Ω',1e-3,{zero:true}),
    num('fs','f_s','Hz',0,{zero:true}),sel('sel','Εξισορρόπηση',[['trigger','trigger'],['sort','sort'],['reduced','reduced']],'trigger'),num('band','ΔV','pu',0.05),sel('norm','Στάθμη',[['nom','nom'],['avg','avg']],'nom'),sel('disc','Αλλαγές',[['smooth','smooth'],['disc','disc']],'smooth')],value:()=>null,
   draw:()=>'<path d="M0,-50 V-36 M0,36 V50"/><rect x="-22" y="-36" width="44" height="72" rx="3"/>'+tx('MMC',0,4,'bsm')},
  // 4.10: the compact solver elements behind the fast implementations of CHB and SPLL (hidden from the library; built by NetLib)
  CHBX:{name:'Αρθρωτός βραχίονας (συμπαγής)',prefix:'CX',group:'Ημιαγωγοί',hidden:true,pins:{a:[0,-50],b:[0,50]},spins:p=>chbxIO(p),box:p=>{const h=Math.max(36,chbxH(p));return [-30,-h,60,2*h];},
   params:[...chbParams()],value:()=>null,
   draw:p=>'<path d="M0,-50 V-36 M0,36 V50"/><rect x="-22" y="-36" width="44" height="72" rx="3"/>'+tx('CHB',0,4,'bsm')},
  SPLX:{name:'PLL μονοφασικό (SOGI, συμπαγές)',prefix:'SPX',group:'Σήματα',hidden:true,pins:{},spins:{v:I(-30,0),th:O(30,-20),w:O(30,-10),amp:O(30,0),al:O(30,10),be:O(30,20)},box:[-20,-25,40,50],blk:true,
   params:[num('f0','f₀','Hz',50),num('bw','Εύρος ζώνης','Hz',20),num('k','k','',Math.SQRT2),num('k0','k₀','',0.1,{zero:true}),num('th0','θ₀','°',0,{signed:true,zero:true})],value:p=>p.f0,unit:'Hz',
   draw:()=>sb(40,50)+tx('SOGI',0,4,'bsm')},
  // 4.9: a note on the drawing (several lines, size, bold, colour); not part of the circuit
  NOTE:{name:'Σημείωση (κείμενο στο σχέδιο)',prefix:'N',group:'Βασικά',pins:{},box:p=>noteBox(p),lbl:'none',
   params:[area('text','Κείμενο','Σημείωση',{hint:'Πολλές γραμμές με Enter. Δεν επηρεάζει την προσομοίωση.'}),num('size','Μέγεθος γραμμάτων','px',16),bool('bold','Έντονα',false),
    sel('color','Χρώμα',[['ink','Σκούρο'],['acc','Πράσινο'],['red','Κόκκινο'],['blue','Μπλε'],['muted','Γκρι']],'ink'),bool('frame','Πλαίσιο',false)],
   value:()=>null,draw:()=>''},
 };
 // the box of a note from its lines and its size (the text is drawn in HTML by the editor, Editor.renderLabels)
 function noteBox(p){const L=String(p.text??'').split('\n'),z=Math.max(6,Math.min(96,parseEng(p.size)||16));const w=Math.max(4,...L.map(l=>l.length))*z*(p.bold===true||p.bold==='true'?.6:.56);
  return [0,0,Math.round(w+8),Math.round(L.length*z*1.25+6)];}
 const GROUPS=['Πηγές','Παθητικά','Ημιαγωγοί','Μαγνητικά','Μηχανές','Δίκτυο','Φορτία','Έλεγχος','Σήματα','Δίαυλοι','Κώδικας','Υποκυκλώματα','Βασικά'];
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
 // generator (4.3): outputs on the left (ω first: the channel Y:id), inputs on top, shaft-section torques at the bottom
 function genSpins(p){const o={w:O(-40,-30),te:O(-40,-20),pe:O(-40,-10),qe:O(-40,0),vt:O(-40,10),ifd:O(-40,20),d:O(-40,30)};
  if(p.exc==='sig'){o.efd=I(-10,-45);o.e0=O(-25,-45);o.v0=O(-40,-45);}if(p.mech==='sig'){o.tm=I(10,-45);o.m0=O(25,-45);} // 4.8.1: e0, v0, m0 of the load flow, for the AVR and the governor
  if(p.shaft==='multi'){const n=Math.min(6,Math.max(0,plist(p.Hm).length-1));for(let k=0;k<n;k++)o['ts'+(k+1)]=O(-25+10*k,55);}
  return o;}
 // ---------------------------------------------------------------- synchronous generator (4.3, ROADMAP §31.6, §25)
 // One axis of the rotor from the standard data. Reactances in pu, times in pu (ω_b·T). Exact (IEEE 115 definitions, as
 // in the appendix of the IEEE First Benchmark Model): the short-circuit time constants T′, T″ follow from X″ = X·T′T″/(T′₀T″₀)
 // and X′ = X·T′(T′ − T″)/(T′(T′ − T″) − (T′ − T′₀)(T′ − T″₀)) (1/X(s) in partial fractions); then the rotor circuit
 // X_l + X_a ∥ (R₁/s + X₁) ∥ (R₂/s + X₂) whose open- and short-circuit polynomials have those roots (Newton from the
 // classical circuit). Classical: the usual approximate formulas (T′₀ for the first winding alone, T″₀ for the second with
 // the first shorted). One winding: exact either way.
 function genTsc(X,X1,X2,T10,T20){const P=X2*T10*T20/X,f=T=>X1*(T*(T-P/T)-(T-T10)*(T-T20))-X*T*(T-P/T);let T=X1/X*T10;
  for(let k=0;k<80;k++){const d=(f(T*(1+1e-7))-f(T))/(T*1e-7);if(!(Math.abs(d)>0))break;const dT=f(T)/d;T-=dT;if(Math.abs(dT)<1e-14*T)break;}
  return [T,P/T];}
 // the rotor circuit of two windings with the given open- and short-circuit polynomials: Newton on the four equations in
 // X₁, X₂, 1/R₁, 1/R₂ from the classical circuit (start), the slow winding (field on the d axis) first
 function genCirc2(Xa,Xl,a1,a2,b1,b2,start){const Lm=Xa*Xl/(Xa+Xl);
  const Fn=z=>{const [A,B,x1,x2]=z,P=x1*x2;return [(Xa+A)*x1+(Xa+B)*x2-a1,(Xa*(A+B)+A*B)*P-a2,(Lm+A)*x1+(Lm+B)*x2-b1,(Lm*(A+B)+A*B)*P-b2];};
  const sc=[a1,a2,b1,b2];let z=[start[0].X,start[1].X,1/start[0].R,1/start[1].R];
  for(let it=0;it<100;it++){const f=Fn(z),err=Math.max(...f.map((v,k)=>Math.abs(v/sc[k])));if(err<1e-13)break;
   const J=[[],[],[],[]];for(let q=0;q<4;q++){const d=Math.abs(z[q])*1e-7+1e-12,zz=z.slice();zz[q]+=d;const g=Fn(zz);for(let k=0;k<4;k++)J[k][q]=(g[k]-f[k])/d;}
   const Ji=matInv(J),dz=[0,1,2,3].map(k=>J[0]?Ji[k].reduce((s,v,q)=>s+v*f[q],0):0);let lam=1;
   for(let tries=0;tries<30;tries++){const zn=z.map((v,k)=>v-lam*dz[k]);if(zn.every(v=>v>0)&&Fn(zn).reduce((s,v,k)=>s+Math.abs(v/sc[k]),0)<f.reduce((s,v,k)=>s+Math.abs(v/sc[k]),0)){z=zn;break;}lam/=2;if(tries===29)return null;}}
  const f=Fn(z);if(!z.every(v=>v>0&&Number.isFinite(v))||Math.max(...f.map((v,k)=>Math.abs(v/sc[k])))>1e-9)return null;
  const w=[{X:z[0],R:1/z[2]},{X:z[1],R:1/z[3]}];w.sort((p,q)=>(Xa+q.X)/q.R-(Xa+p.X)/p.R);return w;}
 function genAxis(X,X1,X2,Xl,T10,T20,wb,exact){
  const Xa=X-Xl,one=(Xp,T0)=>{const Xw=Xa*(Xp-Xl)/(Xa-Xp+Xl);return {X:Xw,R:(Xa+Xw)/(wb*T0)};};
  if(!(Xa>0))return {err:'Χρειάζεται X > X_l.'};
  const w1=T10>0&&X1>Xl&&X1<X,w2=T20>0&&X2>Xl&&X2<(w1?X1:X);
  if(!w1&&!w2)return {Xa,w:[]};
  if(w1&&!w2)return {Xa,w:[one(X1,T10)]};
  if(!w1&&w2)return {Xa,w:[one(X2,T20)]};
  if(!(T10>T20))return {err:'Χρειάζεται T′₀ > T″₀.'};
  const classic=()=>{const f=one(X1,T10),X2w=(X2-Xl)*Xa*f.X/(Xa*f.X-(X2-Xl)*(Xa+f.X));return X2w>0?[f,{X:X2w,R:(X2w+Xa*f.X/(Xa+f.X))/(wb*T20)}]:null;};
  if(exact){const [T1,T2]=genTsc(X,X1,X2,T10,T20);
   if(T1>T2&&T2>0&&T10>T1&&T20>T2){const c0=classic();if(c0){const r=genCirc2(Xa,Xl,wb*(T10+T20),wb*wb*T10*T20,wb*(T1+T2),wb*wb*T1*T2,c0);if(r)return {Xa,w:r,T:[T1,T2]};}}}
  // classical (or the exact one has no solution: the data do not fit two rotor windings without a Canay reactance)
  const c=classic();if(!c)return {err:'Τα X′ και X″ δεν δίνουν θετική σκέδαση αποσβεστήρα.'};
  return {Xa,w:c,classical:exact};}
 const plist=s=>String(s??'').split(/[;\n]/).map(x=>x.trim()).filter(x=>x!=='').map(x=>parseEng(x));
 // the generator from its parameters: per-unit data, the rotor circuits, the inductance matrices of the d and q groups
 // in SI (power-invariant Park, the rotor referred to the stator: L = X·L_b, R = R·Z_b with Z_b = U_n²/S_n, so that the
 // stator–rotor mutuals are symmetric), their inverses, and the shaft. {err} when the data do not make a machine.
 function genModel(p){const n=(v,d)=>{const x=parseEng(v);return Number.isFinite(x)?x:d;};
  const Sn=Math.max(n(p.Sn,100e6),1),Un=Math.max(n(p.Un,13.8e3),1e-3),f=Math.max(n(p.f,50),1e-6),pp=Math.max(1,Math.round(n(p.pp,1))),wb=2*Math.PI*f;
  const Zb=Un*Un/Sn,Lb=Zb/wb,Ra=Math.max(n(p.Ra,0),0),Xl=Math.max(n(p.Xl,0.15),0),X0=Math.max(n(p.X0,Xl)||Xl,1e-6);
  let Xad,Xaq,dw,qw,note=null;
  if(p.data==='circ'){Xad=n(p.cXad,1.66);Xaq=n(p.cXaq,1.58);
   if(!(Xad>0)||!(Xaq>0))return {err:'Χρειάζονται X_ad > 0 και X_aq > 0.'};
   const w=(X,R)=>({X:n(X,0),R:n(R,0)});
   dw=[w(p.cXfd,p.cRfd),w(p.cXkd,p.cRkd)].filter((q,k)=>k===0||q.R>0);qw=[w(p.cX1q,p.cR1q),w(p.cX2q,p.cR2q)].filter(q=>q.R>0);
   if(!(dw[0].R>0)||!(dw[0].X>=0))return {err:'Το τύλιγμα διέγερσης θέλει R_fd > 0 και X_fd ≥ 0.'};}
  else{const ex=p.conv!=='class';
   const d=genAxis(n(p.Xd,1.81),n(p.Xdp,0.3),n(p.Xdpp,0.23),Xl,n(p.Td0p,8),n(p.Td0pp,0.03),wb,ex);if(d.err)return {err:'Άξονας d: '+d.err};
   const q=genAxis(n(p.Xq,1.76),n(p.Xqp,0.65),n(p.Xqpp,0.25),Xl,n(p.Tq0p,1),n(p.Tq0pp,0.07),wb,ex);if(q.err)return {err:'Άξονας q: '+q.err};
   if(!d.w.length)return {err:'Άξονας d: χρειάζεται τύλιγμα διέγερσης (X′_d < X_d και T′_d0 > 0).'};
   Xad=d.Xa;Xaq=q.Xa;dw=d.w;qw=q.w;if(d.classical||q.classical)note='Η ακριβής μετατροπή δεν έχει λύση με δύο τυλίγματα: κλασική.';}
  for(const q of [...dw,...qw])if(!(q.X>=0)||!(q.R>0))return {err:'Ένα τύλιγμα του δρομέα βγαίνει με αρνητική σκέδαση ή αντίσταση: έλεγξε τα δεδομένα.'};
  const grp=(Xm,Xs,ws)=>{const N=1+ws.length,L=[];for(let i=0;i<N;i++){L.push([]);for(let j=0;j<N;j++)L[i].push(Xm*Lb);}
   L[0][0]=(Xs+Xm)*Lb;ws.forEach((q,k)=>{L[k+1][k+1]=(Xm+q.X)*Lb;});return {L,G:matInv(L)};};
  const D=grp(Xad,Xl,dw),Q=grp(Xaq,Xl,qw),nd=dw.length,nq=qw.length;
  // shaft: masses in per unit on S_n (2H·dω/dt = T, dδ/dt = ω_b(ω − 1), δ in electrical rad, K in pu torque per rad)
  let sh;
  if(p.shaft==='multi'){const H=plist(p.Hm),K=plist(p.Km),Ds=plist(p.Dm),Dmu=plist(p.Dmu),fr=plist(p.Tfr),N=H.length,gm=Math.round(n(p.gm,1))-1;
   if(N<1||H.some(x=>!(x>0)))return {err:'Άξονας: οι σταθερές H πρέπει να είναι θετικές.'};
   if(K.length!==N-1||K.some(x=>!(x>0)))return {err:`Άξονας: χρειάζονται ${N-1} θετικές σταθερές ελατηρίου K.`};
   if(!(gm>=0&&gm<N))return {err:`Άξονας: η μάζα της γεννήτριας πρέπει να είναι από 1 έως ${N}.`};
   const F=Array.from({length:N},(_,i)=>Math.max(fr[i]||0,0)),tot=F.reduce((a,b)=>a+b,0);
   sh={N,H,K,D:Array.from({length:N},(_,i)=>Math.max(Ds[i]||0,0)),Dmu:Array.from({length:N-1},(_,i)=>Math.max(Dmu[i]||0,0)),fr:tot>0?F.map(x=>x/tot):F.map((_,i)=>i===gm?1:0),gm};}
  else sh={N:1,H:[Math.max(n(p.H,3.5),1e-6)],K:[],D:[Math.max(n(p.D,0),0)],Dmu:[],fr:[1],gm:0};
  return {Sn,Un,f,pp,wb,Zb,Lb,Ra,Xl,X0,Xad,Xaq,dw,qw,nd,nq,N:3+nd+nq,Ld:D.L,Gd:D.G,Lq:Q.L,Gq:Q.G,L0:X0*Lb,g0:1/(X0*Lb),
   Rr:[...dw,...qw].map(q=>q.R*Zb),vfK:dw[0].R/Xad*Un,ifK:Xad*Un/Sn,sh,note};}
 // Γ(θ) of the flux element: ports a, b, c (to the neutral), then the d rotor windings, then the q ones; θ the electrical
 // angle of the d axis from phase a, the q axis 90° ahead. Γ = Tᵀ·blockdiag(Γ_d, Γ_q, 1/L₀)·T with T orthonormal.
 const R23=Math.sqrt(2/3),R13=1/Math.sqrt(3);
 function genGamma(g,th,G){const N=g.N,nd=g.nd,dd=[],qq=[];
  for(let k=0;k<3;k++){const a=th-k*2*Math.PI/3;dd.push(R23*Math.cos(a));qq.push(-R23*Math.sin(a));}
  const Gd=g.Gd,Gq=g.Gq,g0=g.g0/3;
  for(let k=0;k<3;k++)for(let j=0;j<3;j++)G[k*N+j]=Gd[0][0]*dd[k]*dd[j]+Gq[0][0]*qq[k]*qq[j]+g0;
  for(let r=0;r<nd;r++){const c=3+r;for(let k=0;k<3;k++){const v=Gd[0][r+1]*dd[k];G[k*N+c]=v;G[c*N+k]=v;}for(let s=0;s<nd;s++)G[c*N+3+s]=Gd[r+1][s+1];for(let s=0;s<g.nq;s++){G[c*N+3+nd+s]=0;G[(3+nd+s)*N+c]=0;}}
  for(let r=0;r<g.nq;r++){const c=3+nd+r;for(let k=0;k<3;k++){const v=Gq[0][r+1]*qq[k];G[k*N+c]=v;G[c*N+k]=v;}for(let s=0;s<g.nq;s++)G[c*N+3+nd+s]=Gq[r+1][s+1];}
  return G;}
 // d, q (power-invariant) of the stator part of a port vector at angle θ
 function genDQ(x,th){let d=0,q=0,z=0;for(let k=0;k<3;k++){const a=th-k*2*Math.PI/3;d+=R23*Math.cos(a)*x[k];q-=R23*Math.sin(a)*x[k];z+=R13*x[k];}return [d,q,z];}
 // steady state from the positive-sequence phasors (peak, cosine reference) of the stator port voltage and of the current
 // into the machine, at ω (rad/s): θ₀ (d axis at t = 0), dq currents, field current, port fluxes, E_fd (pu) and the
 // electrical torque on the rotor (pu, motor sense). The dampers carry no current.
 function genSteady(g,V,I,w){const k=Math.sqrt(1.5),Lq=g.Lq[0][0],Ld=g.Ld[0][0],Lad=g.Xad*g.Lb;
  const E=[V[0]+w*Lq*I[1],V[1]-w*Lq*I[0]],th=Math.atan2(E[1],E[0])-Math.PI/2,c=Math.cos(th),s=Math.sin(th);
  const rot=z=>[k*(z[0]*c+z[1]*s),k*(z[1]*c-z[0]*s)],[vd,vq]=rot(V),[id,iq]=rot(I);
  const ifd=(vq/w-Ld*id)/Lad,pd=Ld*id+Lad*ifd,pq=Lq*iq;
  const psi=new Float64Array(g.N);for(let j=0;j<3;j++){const a=th-j*2*Math.PI/3;psi[j]=R23*(Math.cos(a)*pd-Math.sin(a)*pq);}
  psi[3]=g.Ld[1][0]*id+g.Ld[1][1]*ifd;for(let r=1;r<g.nd;r++)psi[3+r]=g.Ld[r+1][0]*id+g.Ld[r+1][1]*ifd;
  for(let r=0;r<g.nq;r++)psi[3+g.nd+r]=g.Lq[r+1][0]*iq;
  const If=new Float64Array(g.N);If[3]=ifd;
  return {th,vd,vq,id,iq,ifd,psi,Efd:g.Rr[0]*ifd/g.vfK,Te:(pd*iq-pq*id)*g.wb/g.Sn,res:vd+w*Lq*iq};}
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
 // 170/2500: the switching impulse of IEC 60060-1:2025 (T1 by 30–90 %), as in the Voltage Impulse GUI 1.1 (3.15)
 const VIMP_STD={'1.2/50':{T1:1.2e-6,T2:50e-6,basis:'iec'},'170/2500':{T1:170e-6,T2:2500e-6,basis:'iec'},'250/2500':{T1:250e-6,T2:2500e-6,basis:'tp'}};
 // given parameters (3.15, from a tool or its CSV): the times are measured, not fitted
 const directCache=new Map();
 function directWave(kind,n,tau1,tau2,eta,basis){const key=[kind,n,tau1,tau2,eta,basis].join('|');let m=directCache.get(key);
  if(!m){m=waveMeasure({kind,n,tau1,tau2},basis);directCache.set(key,m);}return {kind,n,tau1,tau2,eta,T1:m.T1,T2:m.T2,peak:m.peak,fitOk:tau1>0&&tau2>0&&eta>0};}
 const vimpCache=new Map();
 function impulseWave(p){const V0=parseEng(p.Vpk)||0,t0=Math.max(0,parseEng(p.t0)||0),pre=VIMP_STD[p.shape];
  if(p.shape==='ramp'){const S=Math.abs(parseEng(p.S))||1e12,tr=V0?Math.max(Math.abs(V0)/S,1e-12):1e-6;   // 4.12: a ramp of 0 V no longer sets a time base of 1 ns
  return {kind:'ramp',tr,S,eta:1,I0:V0,t0,T1:tr,T2:Infinity,tau1:tr,tau2:tr,fitOk:true};}
  if(p.shape==='direct'){const a=parseEng(p.alpha),b=parseEng(p.beta),K=parseEng(p.K);if(!(a>0&&b>a&&K>0))return {kind:'dexp',n:10,tau1:1e-6,tau2:1e-5,eta:1,I0:0,t0,T1:NaN,T2:NaN,basis:'iec',fitOk:false,err:'α, β, K > 0 και β > α.'};
   return {...directWave('dexp',10,1/b,1/a,1/K,'iec'),I0:V0,t0,basis:'iec'};}
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
 // 5.0.1 (ROADMAP §56, THEORY §8ΩΖ): the curve of a saturable core, ψ–i piecewise linear through points of the positive
 // branch ([[i, ψ], …], (0, 0) implied), odd, and beyond the last point the slope L_end (the air-core segment; 0 = the last
 // segment continued), as the nonlinear inductance of the EMTP-type programs. cur(ψ) → {i, g = di/dψ}, inv(i) → ψ.
 function magChar(pts,Lend){const q=[[0,0]];
  for(const r of pts||[]){const i=+r[0],f=+r[1];if(!(Number.isFinite(i)&&Number.isFinite(f)))return {err:'Η καμπύλη ψ–i έχει σημείο που δεν είναι αριθμός.'};if(i===0&&f===0)continue;q.push([i,f]);}
  if(q.length<2)return {err:'Η καμπύλη ψ–i θέλει τουλάχιστον ένα σημείο «ρεύμα: ροή» εκτός από το (0, 0).'};
  for(let k=1;k<q.length;k++)if(!(q[k][0]>q[k-1][0]&&q[k][1]>q[k-1][1]))return {err:'Στην καμπύλη ψ–i το ρεύμα και η ροή αυξάνουν μαζί σε κάθε σημείο (θετικός κλάδος, από το (0, 0)).'};
  const N=q.length-1,I=Float64Array.from(q,x=>x[0]),F=Float64Array.from(q,x=>x[1]),s=new Float64Array(N+1);
  for(let k=0;k<N;k++)s[k]=(I[k+1]-I[k])/(F[k+1]-F[k]);
  const Le=Lend>0?Lend:1/s[N-1];if(!(Number.isFinite(Le)&&Le>0))return {err:'Η κλίση μετά το τελευταίο σημείο (πυρήνας αέρα) πρέπει να είναι θετική.'};s[N]=1/Le;
  const cur=psi=>{const x=Math.abs(psi);let k=0;while(k<N&&x>=F[k+1])k++;const i=I[k]+(x-F[k])*s[k];return {i:psi<0?-i:i,g:s[k]};};
  const inv=i=>{const y=Math.abs(i);let k=0;while(k<N&&y>=I[k+1])k++;const f=F[k]+(y-I[k])/s[k];return i<0?-f:f;};
  return {I,F,s,N,L0:1/s[0],Lend:Le,cur,inv,pts:q};}
 // a table «a: b, a: b» (as the arrester's) → [[a, b], …]
 function pairTable(t){if(Array.isArray(t))return t.map(r=>[+r[0],+r[1]]);const out=[];for(const q of String(t||'').split(/[;,]/)){const m=q.split(':');if(m.length!==2)continue;const a=parseEng(m[0]),b=parseEng(m[1]);if(Number.isFinite(a)&&Number.isFinite(b))out.push([a,b]);}return out;}
 // (2/π)·∫₀^{π/2} i(Ψ·sin θ)² dθ, the mean square of the current of the curve (I, F, s up to the segment of Ψ) under a
 // sinusoidal flux of amplitude Ψ: on segment k i = a + b·Ψ·sin θ, and ∫(a + bΨ sin θ)² = a²θ − 2abΨ cos θ + b²Ψ²(θ/2 − sin 2θ/4)
 function magMeanSq(I,F,s,N,Psi){let sum=0,th0=0;
  for(let k=0;k<=N&&th0<Math.PI/2;k++){const th1=k<N&&F[k+1]<Psi?Math.asin(F[k+1]/Psi):Math.PI/2,b=s[k],a=I[k]-b*F[k];
   const P=th=>a*a*th-2*a*b*Psi*Math.cos(th)+b*b*Psi*Psi*(th/2-Math.sin(2*th)/4);sum+=P(th1)-P(th0);th0=th1;}
  return sum*2/Math.PI;}
 // 5.0.1: the open-circuit test in rms values to the peak curve, point by point (the idea of the SATURATION routine of the
 // EMTP-type programs; the formulation ours, THEORY §8ΩΖ): rows [[I_rms, U_rms]] in pu of the rated current and voltage
 // (the loss part already taken out), sorted by U; the k-th peak flux is Ψ_k = U_k (pu of √2·U/ω) and its peak current
 // i_k (pu of √2·I) the one for which the mean square of the curve so far, under the flux Ψ_k·sin θ, is I_k²/2. That mean
 // square is quadratic in i_k (the segment from the previous point is linear in it): three values give it exactly.
 function magRms(rows){const r=(rows||[]).filter(q=>q[0]>0&&q[1]>0).sort((x,y)=>x[1]-y[1]);
  if(!r.length)return {err:'Η δοκιμή κενού θέλει τουλάχιστον ένα σημείο «ρεύμα: τάση» με θετικές τιμές.'};
  for(let k=1;k<r.length;k++)if(!(r[k][1]>r[k-1][1]&&r[k][0]>r[k-1][0]))return {err:'Στη δοκιμή κενού η τάση και το ρεύμα αυξάνουν μαζί σε κάθε σημείο.'};
  const pts=[];
  for(let k=0;k<r.length;k++){const Psi=r[k][1],T=r[k][0]*r[k][0]/2,i0=k?pts[k-1][0]:0,d=Math.max(i0,r[k][0]);
   const g=x=>{const c=magChar([...pts,[x,Psi]],1);return magMeanSq(c.I,c.F,c.s,c.N,Psi);};
   const x0=i0+d,x1=i0+2*d,x2=i0+3*d,g0=g(x0),g1=g(x1),g2=g(x2),A=(g2-2*g1+g0)/(2*d*d),B=(g1-g0)/d-A*(x0+x1),C=g0-A*x0*x0-B*x0;
   const D=B*B-4*A*(C-T),x=A>0&&D>=0?(-B+Math.sqrt(D))/(2*A):NaN;
   if(!(x>i0))return {err:`Η δοκιμή κενού δεν δίνει μονότονη καμπύλη στο σημείο ${k+1} (U = ${fmtNum(Psi)} pu): το ρεύμα αυξάνει λιγότερο από όσο ζητά η καμπύλη ως εκεί.`};
   pts.push([x,Psi]);}
  return {pts};}
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
  else if(p.spec==='coax'){const D=num(p.Dco),d=num(p.dco),er=num(p.erco??1),k=num(p.kv??.96),l=num(p.len);
   if(!(D>d&&d>0))return {err:'Η διάμετρος D του περιβλήματος πρέπει να είναι μεγαλύτερη από τη διάμετρο d του αγωγού.'};if(!(er>=1&&k>0&&k<=1&&l>0))return {err:'Χρειάζονται ε_r ≥ 1, 0 < k ≤ 1 και θετικό μήκος.'};
   Z=60*Math.log(D/d)/Math.sqrt(er);tau=l*Math.sqrt(er)/(k*299792458);} // 4.22: coaxial, Z = (η₀/2π)·ln(D/d)/√ε_r with η₀/2π ≈ 60 Ω
  else{Z=num(p.Z);tau=num(p.tau);}
  if(!(Z>0))return {err:'Η κυματική αντίσταση πρέπει να είναι θετική.'};if(!(tau>0))return {err:'Ο χρόνος διάδοσης πρέπει να είναι θετικός.'};
  const R=p.spec==='zt'?(num(p.Rt)||0):(num(p.Rp)||0)*num(p.len);if(!(R>=0))return {err:'Η αντίσταση σειράς δεν μπορεί να είναι αρνητική.'};
  if(p.loss==='dl'&&R>0)return {Z,tau,R,N:1,dl:true}; // 5.0.1: without distortion, one section, every arriving wave times e^(−R/2Z)
  const N=R>0?Math.round(num(p.nsec)||1):1;if(!(N>=1&&N<=1000))return {err:'Τα τμήματα πρέπει να είναι από 1 ως 1000.'};return {Z,tau,R,N};}

 const tlmCache=new Map();
 function tlmData(p){const s=String(p.data??'');if(tlmCache.has(s))return tlmCache.get(s);let d=null;try{d=JSON.parse(s);}catch(e){d=null;}if(tlmCache.size>64)tlmCache.clear();tlmCache.set(s,d);return d;}
 // number of phases: the largest phase number of the conductors (0 = ground wire); 3 when the data cannot be read
 function tlmM(p){if(isModal(p))return Math.max(1,Math.min(12,Math.round(parseEng(p.nph))||1));const d=tlmData(p);if(!d)return 3;let M=0;for(const w of [...(d.wires||[]),...(d.bundles||[])])M=Math.max(M,Math.round(+w.ph)||0);
  // 4.13: a homogeneous cross-bonded cable (pcl.lineconst.xbond_avg): the sheaths (second conductor of each cable) as one
  // conductor ('bond') or grounded ('gnd'), the phases numbered again
  if(d.cables&&(d.xbond==='bond'||d.xbond==='gnd')&&d.cables.length===3){const ph=d.cables.map(c=>[].concat(c.ph??[]).map(v=>Math.round(+v)||0)),s0=ph[0][1]||0;
   const all=ph.flatMap((q,i)=>q.map((v,k)=>k===1?(d.xbond==='gnd'?0:(s0||99)):v));return Math.max(1,Math.min(12,new Set(all.filter(v=>v>0)).size||3));}
  for(const c of d.cables||[])for(const v of [].concat(c.ph??[]))M=Math.max(M,Math.round(+v)||0);
  if(d.seq)M=Math.round(+d.seq.M)||3;else if(d.zyfile&&d.zyfile.Zr?.length)M=d.zyfile.Zr[0].length;return Math.max(1,Math.min(12,M||3));}
 function tlmPin(k,end){return 'abcdefghijkl'[k]+end;}
 function tlmPins(p){const M=tlmM(p);if(isBus(p)&&M===3)return {abc1:[-40,0],abc2:[40,0]};const o={},y=k=>-10*(M-1)+20*k;for(let k=0;k<M;k++){o[tlmPin(k,1)]=[-40,y(k)];o[tlmPin(k,2)]=[40,y(k)];}return o;}
 // what the model was computed from: a change in any of these asks for a new model
 function tlmKey(p){const d=tlmData(p),n=v=>{const x=parseEng(v);return Number.isFinite(x)?x:String(v);};
  const o={data:d,model:['fd','pi','wb'].includes(p.model)?p.model:'cp',len:n(p.len)};if(o.model==='wb')Object.assign(o,{fmin:n(p.fmin),dec:n(p.dec),ppd:n(p.ppd)});else if(o.model!=='fd')o.f=n(p.f);else Object.assign(o,{fmin:n(p.fmin),dec:n(p.dec),ppd:n(p.ppd),fti:n(p.fti)});
  // 4.11: the options of the model enter the key only when they differ from the defaults (old models stay valid)
  if(o.model==='cp'&&p.cp&&p.cp!=='lumped')o.cp=p.cp;if(o.model==='pi')o.npi=n(p.npi??1);if(o.model!=='pi'&&p.ti&&p.ti!=='gm0')o.ti=p.ti;
  if(o.model==='fd'){if(p.tiauto==='1'){o.tiauto=1;delete o.fti;}if(p.nmax!=null&&+p.nmax!==30)o.nmax=n(p.nmax);}
  // 4.13: the wideband options (only when they differ from the defaults), or the EMTP file the model was read from
  if(o.model==='wb'){if(p.wsrc==='emtp'){o.wsrc='emtp';o.wbref=String(p.wbref||'');for(const k of ['fmin','dec','ppd'])delete o[k];}
   else{if(p.wtol!=null&&+p.wtol!==0.2)o.wtol=n(p.wtol);if(p.wgrp==='0')o.wgrp=0;if(p.wfdcm&&p.wfdcm!=='auto')o.wfdcm=p.wfdcm;if(p.wdc==='1')o.wdc=1;if(p.wopt==='1')o.wopt=1;if(p.wlfw!=null&&+p.wlfw!==100)o.wlfw=n(p.wlfw);if(p.nmax!=null&&+p.nmax!==30)o.nmax=n(p.nmax);}
   if(p.wpas&&p.wpas!=='check')o.wpas=p.wpas;if(p.wgd&&p.wgd!=='auto'&&p.wsrc!=='emtp')o.wgd=p.wgd;}
  return JSON.stringify(o);}
 // the model for the solver: {M, type, Ti (M×M, by rows), modes} or {err}
 // 5.0.1: the CP model from data per mode (src = 'modal'): per mode Z_c, τ (of the whole line) and R = R′·length, with the
 // built-in Clarke transformation of an m-phase continuously transposed line (column 1 all 1/√m, column j: 1/√(j(j−1)) in the
 // rows above j, −(j−1)/√(j(j−1)) in row j), or a real T_i of the user (invertible)
 function clarkeTi(M){return Array.from({length:M},(_,r)=>Array.from({length:M},(_,c)=>{if(c===0)return 1/Math.sqrt(M);const j=c+1,d=Math.sqrt(j*(j-1));return r<c?1/d:r===c?-(j-1)/d:0;}));}
 function tlcpModel(p){const M=tlmM(p),len=parseEng(p.mlen);if(!(len>0))return {err:'το μήκος πρέπει να είναι θετικό.'};
  const rows=String(p.mdata??'').split(';').map(r=>r.trim()).filter(Boolean).map(r=>r.split(/[,\s]+/).filter(Boolean).map(parseEng));
  const tr=p.transp!=='0'||M===1,need=M===1?1:tr?2:M;if(rows.length!==need)return {err:`τα δεδομένα ανά ρυθμό θέλουν ${need} ${need===1?'γραμμή':'γραμμές'} (${M===1?'ένας ρυθμός':tr?'ρυθμός γης και εναέριος':'μία ανά αγωγό'}), δόθηκαν ${rows.length}.`};
  const sp=['zt','lc'].includes(p.mspec)?p.mspec:'zv',dl=p.mloss==='dl',modes=[];
  for(const [k,r] of rows.entries()){if(r.length!==3||r.some(v=>!Number.isFinite(v)))return {err:`ο ρυθμός ${k+1} θέλει τρεις αριθμούς.`};
   const [Rp,a,b]=r;let Zc,tau;if(sp==='lc'){if(!(a>0&&b>0))return {err:`ρυθμός ${k+1}: τα L′ και C′ πρέπει να είναι θετικά.`};Zc=Math.sqrt(a/b);tau=len*Math.sqrt(a*b);}
   else{Zc=a;tau=sp==='zt'?b:len/b;if(!(b>0))return {err:`ρυθμός ${k+1}: ${sp==='zt'?'ο χρόνος διάδοσης':'η ταχύτητα'} πρέπει να είναι θετικ${sp==='zt'?'ός':'ή'}.`};}
   if(!(Zc>0))return {err:`ρυθμός ${k+1}: η Z_c πρέπει να είναι θετική.`};if(!(Rp>=0))return {err:`ρυθμός ${k+1}: το R′ δεν μπορεί να είναι αρνητικό.`};
   modes.push({Zc,tau,R:Rp*len,...(dl?{dl:true}:{})});}
  let Ti;if(M===1)Ti=[[1]];else if(tr){Ti=clarkeTi(M);while(modes.length<M)modes.push({...modes[1]});}
  else{Ti=String(p.mti??'').split(';').map(r=>r.trim()).filter(Boolean).map(r=>r.split(/[,\s]+/).filter(Boolean).map(parseEng));
   if(Ti.length!==M||Ti.some(r=>r.length!==M||r.some(v=>!Number.isFinite(v))))return {err:`ο T_i θέλει ${M} γραμμές με ${M} αριθμούς.`};
   const A=Ti.map(r=>r.slice());for(let c=0;c<M;c++){let q=c;for(let r=c+1;r<M;r++)if(Math.abs(A[r][c])>Math.abs(A[q][c]))q=r;if(!(Math.abs(A[q][c])>1e-12))return {err:'ο T_i δεν αντιστρέφεται.'};[A[c],A[q]]=[A[q],A[c]];
    for(let r=c+1;r<M;r++){const f=A[r][c]/A[c][c];for(let z=c;z<M;z++)A[r][z]-=f*A[c][z];}}}
  return {type:'cp',src:'modal',M,Ti,modes};}
 function tlmModel(p){if(isModal(p))return tlcpModel(p);if(!tlmData(p))return {err:'τα δεδομένα της γραμμής δεν διαβάζονται (JSON).'};let m=null;try{m=p.mdl?JSON.parse(p.mdl):null;}catch(e){m=null;}
  if(!m||!m.modes)return {err:'δεν έχει υπολογιστεί μοντέλο. Άνοιξε «Δεδομένα γραμμής» και πάτα «Υπολογισμός» (χρειάζεται ο server).',need:true};
  if(m.src!==tlmKey(p))return {err:'το μοντέλο είναι παλιό (άλλαξαν δεδομένα, μήκος ή επιλογές). «Δεδομένα γραμμής» → «Υπολογισμός».',need:true};
  const M=m.M;if(!(M>=1&&m.Ti?.length===M&&m.modes.length===M))return {err:'μη έγκυρο μοντέλο γραμμής.'};
  for(const q of m.modes){const tau=+q.tau;if(!(tau>0))return {err:'μη έγκυρος χρόνος διάδοσης στο μοντέλο.'};}
  if(m.type==='wb'&&!(Array.isArray(m.groups)&&m.groups.length&&m.groups.every(g=>+g.tau>0&&Array.isArray(g.p))&&m.yc?.d?.length===M))return {err:'μη έγκυρο μοντέλο WB.'};
  return m;}
 // the waveform of a lightning-current part: {kind, n, tau1, tau2, eta, I0, t0, T1, T2}
 function lightningWave(p){const I0=parseEng(p.Ipk)||0,t0=Math.max(0,parseEng(p.t0)||0),pre=HEIDLER[p.shape];
  if(pre)return {kind:'heidler',...pre,I0,t0};
  if(p.shape==='direct'){const kind=p.model==='dexp'?'dexp':'heidler',n=Math.max(1,Math.min(30,parseEng(p.n)||10)),t1=parseEng(p.tau1),t2=parseEng(p.tau2),eta=parseEng(p.eta);
   if(!(t1>0&&t2>0&&eta>0))return {kind,n,tau1:1e-6,tau2:1e-4,eta:1,I0:0,t0,T1:NaN,T2:NaN,fitOk:false,err:'τ₁, τ₂, η > 0.'};
   return {...directWave(kind,n,t1,t2,eta),I0,t0};}
  const T1=Math.max(parseEng(p.T1)||1.2e-6,1e-12),T2=Math.max(parseEng(p.T2)||50e-6,1.5*T1),kind=p.model==='dexp'?'dexp':'heidler',n=Math.max(1,Math.min(30,parseEng(p.n)||10));
  const f=waveFit(kind,T1,T2,n);return {kind,n,tau1:f.tau1,tau2:f.tau2,eta:f.eta,I0,t0,T1,T2,fitOk:f.ok};}
 function pinKind(c,pin){const s=sigPins(c)[pin];return s?s.dir:'el';}
 // 3.19 (§4): a structural parameter changes the graph (the pins of the part) or what the solver is built around (the
 // carrier, the mode of a PWM): its change during a run asks for a restart, and it cannot be pinned (📌). Everything else
 // is live: applied at the boundary of a solver step (a discrete block uses it at its next sample).
 const STRUCT={PWM:new Set(['mode','carrier','upd']),SW:new Set(['gate','model']),VAC3:new Set(['conn','neut'])};
 // the network library: a change rebuilds its definition (4.1); from 4.2 a value that keeps the inner circuit the same is
 // live (the reload carries the states by the inner ids), and only what changes the inner circuit is structural
 Object.assign(STRUCT,{AIC:new Set(['scheme']),GRID3:new Set(['z0','conn','neut']),FLT3:new Set(['kind','ctl','conn']),CB3:new Set(['ctl','vm','conn','model','arc']),ARC:new Set(['ctl','vm','arc']),
  XF3:new Set(['grp','P0','core','conn','neut1','neut2','sat','mpos']),XFMR:new Set(['sat','mpos']),LOAD3:new Set(['cn','model','conn','neut']),
  GEN3:new Set(['data','conv','shaft','Hm','exc','mech','init','neut','conn']),LINE3:new Set(['unit','z0','conn']),TLM:new Set(['model','data','mdl','len','f','fmin','dec','ppd','fti','conn','cp','npi','tiauto','nmax','ti','vtrap','src','nph','transp'])});
 const structCache=new Map();
 function structural(type,k){const key=type+'|'+k;if(structCache.has(key))return structCache.get(key);let r=!!STRUCT[type]?.has(k);
  const d=PARTS[type],pd=d?.params?.find(x=>x.k===k);if(!r&&pd&&pd.struct)r=true;
  if(!r&&d&&pd){const base={...defaults(type)},keys=q=>{try{return Object.keys(pinsOf({type,params:q})).sort().join(',');}catch(e){return '?';}},k0=keys(base);
   const tries=pd.type==='select'?pd.options.map(o=>o[0]):pd.type==='bool'?[true,false]:pd.type==='num'&&['n','nw','N'].includes(k)?[2,3,4,5,6]:pd.type==='text'&&['signs','ins','outs'].includes(k)?['+-','++-','a,b','x']:[];
   r=tries.some(v=>keys({...base,[k]:v})!==k0);}
  structCache.set(key,r);return r;}
 // the declared width of a pin (3.18): a bus pin of a part, a port of a subcircuit; 1 otherwise (Bus.widths infers the rest)
 function pinWidth(c,pin){const d=PARTS[c?.type];if(!d)return 1;if(c.type==='SUB'){const q=(c.params?.$ports||[]).find(x=>x.name===pin);return q&&+q.w>1?+q.w:1;}
  if(typeof d.bus==='function'){const m=d.bus({...defaults(c.type),...(c.params||{})})||{};if(m[pin])return m[pin].length;}return 1;}
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
 // numbers in Greek notation (4.6): one Intl.NumberFormat per set of options, the same text as toLocaleString('el-GR', o)
 // but without building a new formatter on every call (it was the largest single cost while dragging a large circuit)
 const NF=new Map();
 function fmtNum(v,o){const k=o?JSON.stringify(o):'';let f=NF.get(k);if(!f){f=new Intl.NumberFormat('el-GR',o);NF.set(k,f);}return f.format(v);}
 const NF6={maximumFractionDigits:6};
 // engineering notation
 const PRE=[[1e9,'G'],[1e6,'M'],[1e3,'k'],[1,''],[1e-3,'m'],[1e-6,'μ'],[1e-9,'n'],[1e-12,'p']];
 function eng(v,unit='',d=3){if(v===null||v===undefined||!Number.isFinite(v))return '—';if(Math.abs(v)<1e-13)return '0'+(unit?' '+unit:'');const a=Math.abs(v);
  for(const [k,p] of PRE)if(a>=k*.9995){const s=fmtNum(Number((v/k).toPrecision(d)),NF6);return s+(unit||p?' '+p+unit:'');}
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
 // 4.7: the machines the app has, for programs outside it (pcl.machines(), the link's machines(), the Python GUI of
 // pcl.gui): every part with a «machine» descriptor (kind, speed and torque outputs, load input, inertia), its pins and
 // its parameters with their defaults. A machine added later with a descriptor shows up there without other changes.
 function machines(){return Object.entries(PARTS).filter(([,d])=>d.machine).map(([type,d])=>{const p=defaults(type),sp=sigPins({type,params:p}),m=d.machine;
  return {type,name:d.name,...m,pins:Object.keys(elPins({type,params:p})),outputs:Object.entries(sp).filter(([,v])=>v.dir==='out').map(([k])=>k),
   params:d.params.map(x=>({k:x.k,label:x.label,unit:x.unit||'',def:x.def,type:x.type,...(x.options?{options:x.options.map(o=>o[0])}:{})}))};});}
 const api={setSym,symStyle,symHV,hvPath,phaseSplit,machines,structural,PARTS,GROUPS,BLOCKS,subLayout,defaults,elPins,sigPins,pinsOf,pinKind,pinWidth,xf,pinPos,pinDir,bbox,boxOf,eng,fmtNum,parseEng,parseSched,cpeBank,cpeZ,cpeZbank,
  parseMat,nPorts,klMatrix,kgMatrix,matInv,posDef,HEIDLER,waveShape,waveAt,waveMeasure,waveFit,lightningWave,VIMP_STD,impulseWave,impulseDesign,impulseRoots,tlParams,clarkeTi,tlcpModel,bewley,movChar,TLM_TYPICAL,tlmData,tlmM,tlmPin,tlmPins,tlmKey,tlmModel,
  srmGeo,srmMag,srmA,srmPsi,srmCur,srmTorque,srmCoenergy,srmModelPsi,srmAlignedPsi,satD,satDinv,magChar,magRms,magMeanSq,pairTable,
  genModel,genAxis,genTsc,genGamma,genDQ,genSteady,plist,neutOf,xfNeut,xfStar};
 root.Parts=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
