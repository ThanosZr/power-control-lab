'use strict';
// The library of parts in categories (4.6, decision 55): several taxonomies and the user picks one; categories and
// subcategories open and close; the search stays above all of them. No DOM here (app.js draws it; tests in Node):
//  Library.TAX                     the taxonomies: [{id, title, groups:[{title, sub:[{title, items:[types]}]}]}]
//  Library.view(tax, parts, opt)   the groups to draw: every visible part exactly once per taxonomy (those a taxonomy does
//                                  not name go to «Άλλα»); with opt.q only the parts that match, in the same groups;
//                                  'abc' is one group sorted by name (Greek order); 'mine' is favourites and recent ones
//  Library.match(type, def, q)     the search (name, type, group, and words without accents)
(function(root){
 const S=(title,items)=>({title,items});
 // by field: what a part is
 const FIELD=[
  {title:'Πηγές',sub:[S('Τάσης και ρεύματος',['VDC','VAC','VAC3','IDC']),S('Κρουστικές και κεραυνικές',['VIMP','ILG'])]},
  {title:'Παθητικά',sub:[S('Βασικά',['R','L','C']),S('Ειδικά',['CPE','KG']),S('Μαγνητικά',['XFMR','KL'])]},
  {title:'Ημιαγωγοί',sub:[S('',['SW','D','SCR'])]},
  {title:'Μηχανές',sub:[S('',['DCM','IM','SM','SRM'])]},
  {title:'Δίκτυο και γραμμές',sub:[S('Δίκτυο (τριφασικά)',['GRID3','GEN3','XF3','LOAD3','FLT3','CB3']),S('Γραμμές',['LINE3','TLM','TL']),S('Υψηλές τάσεις',['MOV','SG'])]},
  {title:'Φορτία',sub:[S('',['CPL'])]},
  {title:'Μετρήσεις',sub:[S('',['VM','AM','VP','IP','MEAS','DISP'])]},
  {title:'Έλεγχος',sub:[S('Διαμόρφωση',['PWM','MOD3','SH']),S('Ρυθμιστές',['PIB','NN','AIC','EVC']),S('Εκτιμητές και συγχρονισμός',['FEST','PLL'])]},
  {title:'Σήματα και μαθηματικά',sub:[S('Πηγές σήματος',['CONST','CLK','RAMP']),S('Πράξεις',['GAIN','SUM','MUL','DIV','SAT']),S('Δυναμικά και φίλτρα',['INT','LPF','F2','RLIM','UD','RT']),
   S('Λογική',['CMP','LOGIC','SR','EDGE']),S('Μετασχηματισμοί abc, αβ, dq',['CLARKE','ICLARKE','PARK','IPARK'])]},
  {title:'Δίαυλοι',sub:[S('',['MUX','DEMUX','BSEL','EBUS'])]},
  {title:'Κώδικας',sub:[S('',['EXPR','PY'])]},
  {title:'Υποκυκλώματα',sub:[S('',['PORT','SIN','SOUT'])],subs:true},
  {title:'Βασικά',sub:[S('',['GND','TAGO','TAGI'])]}];
 // by course or exercise: where a part is used (a part may be in more than one course)
 const COURSE=[
  {title:'Ηλεκτρικά κυκλώματα',sub:[S('',['R','L','C','VDC','VAC','IDC','VM','AM','VP','IP','GND','XFMR','KL','KG'])]},
  {title:'Ηλεκτρονική ισχύος',sub:[S('Διακόπτες και έλεγχος',['SW','D','SCR','PWM','MOD3','SH']),S('Κύκλωμα',['L','C','R','VDC','VAC','VAC3','CPL','XFMR','KL','CPE']),S('Μετρήσεις',['VM','AM','MEAS','DISP'])]},
  {title:'Ηλεκτρικές μηχανές και κινητήρια',sub:[S('Μηχανές',['DCM','IM','SM','SRM']),S('Έλεγχος',['CLARKE','ICLARKE','PARK','IPARK','PLL','FEST','PIB','NN','AIC','EVC','MOD3'])]},
  {title:'Συστήματα ηλεκτρικής ενέργειας',sub:[S('',['GRID3','GEN3','XF3','LOAD3','LINE3','TLM','FLT3','CB3','VAC3','EBUS'])]},
  {title:'Υψηλές τάσεις',sub:[S('',['VIMP','ILG','TL','MOV','SG','C','R'])]},
  {title:'Συστήματα αυτομάτου ελέγχου',sub:[S('',['CONST','GAIN','SUM','MUL','DIV','SAT','INT','LPF','F2','RLIM','UD','RT','CMP','LOGIC','SR','EDGE','CLK','RAMP','PIB','NN','AIC'])]},
  {title:'Προγραμματισμός και οργάνωση',sub:[S('',['EXPR','PY','MUX','DEMUX','BSEL','PORT','SIN','SOUT','TAGO','TAGI'])],subs:true}];
 const BASIC=new Set(['R','L','C','VDC','VAC','IDC','GND','SW','D','VM','AM','VP','PWM','CONST','GAIN','SUM','XFMR','DISP']);
 const TAX=[{id:'field',title:'Κατά πεδίο',groups:FIELD},{id:'course',title:'Κατά μάθημα',groups:COURSE,multi:true},{id:'level',title:'Κατά επίπεδο'},{id:'abc',title:'Αλφαβητικά'},{id:'mine',title:'Αγαπημένα και πρόσφατα'}];
 const strip=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
 function match(k,d,q){if(!q)return true;const w=strip(q).split(/\s+/).filter(Boolean),h=strip(k+' '+d.name+' '+(d.group||''));return w.every(x=>h.includes(x));}
 const coll=typeof Intl!=='undefined'?new Intl.Collator('el',{sensitivity:'base'}):null;
 function view(tax,parts,opt={}){const q=opt.q||'',vis=Object.entries(parts).filter(([k,d])=>!d.hidden),ok=new Set(vis.filter(([k,d])=>match(k,d,q)).map(([k])=>k));
  const T=TAX.find(t=>t.id===tax)||TAX[0];const pick=items=>items.filter(k=>parts[k]&&!parts[k].hidden&&ok.has(k));let out=[];
  if(T.id==='abc'){const items=[...ok].sort((a,b)=>coll?coll.compare(parts[a].name,parts[b].name):parts[a].name<parts[b].name?-1:1);out=[{title:'Όλα τα στοιχεία',sub:[S('',items)]}];}
  else if(T.id==='level'){const b=[...ok].filter(k=>BASIC.has(k)),a=[...ok].filter(k=>!BASIC.has(k));
   const by=(ks)=>{const g=new Map();for(const k of ks){const t=parts[k].group||'Άλλα';if(!g.has(t))g.set(t,[]);g.get(t).push(k);}return [...g].map(([t,i])=>S(t,i));};
   out=[{title:'Βασικά',sub:by(b)},{title:'Προχωρημένα',sub:by(a)}];}
  else if(T.id==='mine'){const fav=(opt.fav||[]).filter(k=>ok.has(k)),rec=(opt.recent||[]).filter(k=>ok.has(k));
   out=[{title:'Αγαπημένα',sub:[S('',fav)],empty:'Το ☆ δίπλα σε ένα στοιχείο το βάζει εδώ.'},{title:'Πρόσφατα',sub:[S('',rec)],empty:'Τα στοιχεία που τοποθετείς μπαίνουν εδώ.'}];}
  else{const seen=new Set();out=T.groups.map(g=>({title:g.title,subs:!!g.subs,sub:g.sub.map(s=>{const it=pick(s.items);it.forEach(k=>seen.add(k));return S(s.title,it);})}));
   // what this taxonomy does not name (a new part, say) is never lost
   const rest=[...ok].filter(k=>!seen.has(k)&&!out.some(g=>g.sub.some(s=>s.items.includes(k))));if(rest.length)out.push({title:'Άλλα',sub:[S('',rest)]});}
  for(const g of out){g.sub=g.sub.filter(s=>s.items.length||(T.id==='mine'));g.n=g.sub.reduce((a,s)=>a+s.items.length,0);}
  return out.filter(g=>g.n||g.subs&&opt.subs||T.id==='mine');}
 const api={TAX,view,match,BASIC};
 root.Library=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
