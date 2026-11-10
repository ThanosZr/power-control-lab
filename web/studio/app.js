'use strict';
(function(){
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const P=window.Parts,SubC=window.SubCircuit,eng=(v,u,d=4)=>P.eng(v,u,d);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(v,d=4)=>Number.isFinite(v)?Number(v.toPrecision(d)).toLocaleString('el-GR',{maximumFractionDigits:8}):'—';
const S={tut:{id:'buck',options:{}},sim:null,running:false,frame:0,speed:100,stopT:0,error:null,last:0,limited:false,
 nav:[],top:null,pfx:''}; // subcircuits (3.17): the levels open in the editor, the top document while inside, the path of the open instance
let editor,scope;

// ------------------------------------------------------------------ settings
const SETTINGS_KEY='pcl2-settings';
function loadSettings(){try{return JSON.parse(localStorage.getItem(SETTINGS_KEY))||{};}catch{return {};}}
function saveSettings(){try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(editor.settings));}catch{}}

// ------------------------------------------------------------------ notices
function notice(text,kind='info'){const n=$('#notice');if(!text){n.hidden=true;return;}n.hidden=false;n.className='notice '+kind;n.innerHTML=text;}
function warnings(list){const w=$('#netwarn');w.innerHTML=(list||[]).map(t=>`<span>⚠ ${esc(t)}</span>`).join('');w.hidden=!(list&&list.length);}

// ------------------------------------------------------------------ simulation
function project(){return {...fullDoc(),tutRef:S.tutRef||null,sim:{hDiv:+$('#sim-step').value,speed:S.speed,stopT:S.stopT,method:$('#method').value},scope:{cfg:scope.cfg},tutorial:S.tut,...(S.scenCode?{scenario:S.scenCode}:{})};}
function buildSim(fresh){
 const doc=fullDoc();
 try{
  if(!S.sim||fresh){S.sim=new MNA.Sim(doc,{hDiv:+$('#sim-step').value,method:$('#method').value});}
  else S.sim.load(doc,false);
  S.error=null;warnings(S.sim.net.warnings);scope.attach(S.sim);notice('');editor.setDiag(viewDiag(S.sim.net.diag));
 }catch(e){S.error=e.message;pause();
  if(e.needPython){notice(esc(e.message),'info'); // code blocks (3.3): load Pyodide once, then build again
   PyRT.load().then(()=>{buildSim(true);draw(true);if(!S.error)notice(`Η Python (Pyodide ${esc(PyRT.py?.version||'')}) είναι έτοιμη (${PyRT.source?.startsWith('http')?'από το CDN':'τοπικό αντίγραφο'}).`,'info');setTimeout(()=>notice(''),3000);})
    .catch(err=>notice('Δεν φορτώθηκε η Python (Pyodide): '+esc(err.message)+'. Χρειάζεται σύνδεση στο internet ή τοπικό αντίγραφο: <code>python tools/get_pyodide.py</code>.','error'));}
  else notice('Η προσομοίωση σταμάτησε: '+esc(e.message),'error');editor.setDiag(null);}
 refreshControls();renderChannels();updateClock();renderProps();syncStepMode();scheduleStepCheck();
}
function play(){if(!S.sim||S.error)return;if(S.stopT>0&&S.sim.t>=S.stopT-1e-12){notice('Έφτασε στο τέλος του εύρους. Πάτα ⟲ ή αύξησε τη διάρκεια.','info');return;}S.running=true;S.last=performance.now();$('#play').classList.add('running');$('#play').innerHTML='❚❚ Παύση';scope.running=true;requestAnimationFrame(loop);}
function pause(){S.running=false;scope.running=false;$('#play')?.classList.remove('running');if($('#play'))$('#play').innerHTML='▶ Προσομοίωση';draw(true);}
function reset(){pause();buildSim(true);scope.cfg.frozen=null;draw(true);}
function stepT(n=1){if(!S.sim||S.error)return;pause();S.sim.run(n*S.sim.T);draw(true);}
function runToEnd(){if(!S.sim||!(S.stopT>0))return;pause();const t0=performance.now();notice('Υπολογισμός έως '+eng(S.stopT,'s')+'…','info');
 const chunk=()=>{const left=S.stopT-S.sim.t;if(left<=1e-12){notice('');draw(true);return;}try{S.sim.run(left,Infinity,performance.now()+40);}catch(e){notice(esc(e.message),'error');return;}draw(false);updateClock();
  if(performance.now()-t0>120000){notice('Σταμάτησε μετά από 2 λεπτά. Μεγάλωσε το βήμα ή μείωσε τη διάρκεια.','error');return;}setTimeout(chunk,0);};chunk();}
function loop(now){
 if(!S.running)return;const dt=Math.min(.1,(now-S.last)/1000);S.last=now;
 let want=S.speed==='max'?1e9:dt*S.speed*S.sim.T;if(S.stopT>0)want=Math.min(want,S.stopT-S.sim.t);
 const before=S.sim.t;try{S.sim.run(want,Infinity,now+14);}catch(e){S.error=e.message;notice('Σφάλμα λύτη: '+esc(e.message),'error');pause();return;}
 S.limited=S.speed!=='max'&&S.sim.t-before<want*.98;
 S.frame++;draw(false);
 if(S.stopT>0&&S.sim.t>=S.stopT-1e-12){pause();notice('Τέλος εύρους προσομοίωσης ('+eng(S.stopT,'s')+'). ▶ συνεχίζει αν αυξήσεις τη διάρκεια.','info');return;}
 requestAnimationFrame(loop);
}
function draw(all){scope.draw();navRange();if(all||S.frame%3===0){S.iScaleNext=0;editor.updateLive();S.iScale=Math.max(S.iScaleNext||0,1e-9);updateClock();}if(all||S.frame%8===0){renderMeasure();updateHover();renderMetricsPanel();updateLivePanel();if(S.sim&&S.sim.dgVer!==S.diagSeen)renderDiag();}if(all){if(!S.running&&!S.switching){renderFFT();renderPoincare();if($('#eis-block')?.open&&!EIS.run)renderEISForm();}if(S.batch)renderBatch();if(S.csvRef)renderCsv();if(S.theory&&!S.running&&!S.switching)renderTheoryLive();}}  // no theory refresh while the editor still holds the previous circuit
function navRange(){const el=$('#nav-range');if(!el||el.offsetParent===null||!S.sim)return;const [a,b]=scope.viewRange();el.textContent=`${eng(a,'s',4)} … ${eng(b,'s',4)} · ${fmt((b-a)/S.sim.T,3)} T${scope.cfg.frozen?' · σταθερή προβολή':' · ζωντανά'}`;}
function updateClock(){const s=S.sim;if(!s)return;$('#clock').textContent='t = '+eng(s.t,'s',5);$('#periods').textContent=`${Math.floor(s.t/s.T+1e-9)} T · βήματα ${s.steps.toLocaleString('el-GR')}`;
 $('#cpu').hidden=!S.limited;$('#speed-note').textContent=S.speed==='max'?'όσο αντέχει ο υπολογιστής':`${eng(S.speed*s.T,'s',3)} ανά δευτερόλεπτο`;$('#step-note').textContent=s.var?`Δt = ${eng(s.hv,'s',3)} μεταβλητό (${eng(s.hMin,'s',2)} … ${eng(s.hCap||s.hMax,'s',2)}) · απορρίψεις ${s.nRej}`:'Δt = '+eng(s.h,'s',3)+' · T = '+eng(s.T,'s',3);}

// live values on the schematic
function liveOf(c0){const s=S.sim;if(!s||S.error||S.pfx===null)return null;if(['GND','JUNC','TAGO','TAGI','SUB','PORT','SIN','SOUT'].includes(c0.type))return null;
 const c=S.pfx?{...c0,id:S.pfx+c0.id}:c0;
 const avg=S.running&&(S.speed==='max'||S.speed>=200);const val=k=>{if(avg){const p=s.lastPeriod(k);return p?p.avg:s.now(k);}return s.now(k);};
 if(c.type==='PWM'){const d=s.now('D:'+c.id);return {text:'D = '+fmt(d,4)};}
 // a block on a bus (3.18): the values of its elements, [a, b, …]
 {const n=vecN(c.id);if(n>1&&P.BLOCKS.has(c.type))return {text:'y = ['+Array.from({length:n},(_,k)=>eng(val('Y:'+c.id+'['+(k+1)+']'),blkUnit(c),3)).join(', ')+']'};}
 if(c.type==='SH'){const q=s.shById.get(c.id);return {text:q?'h = '+eng(q.h,q.sig?'':q.qty==='V'?'V':'A',4):''};}
 if(c.type==='PY'){const os=outsOf(c);return {text:os.map((o,k)=>o+' = '+eng(s.now('Y:'+c.id+(k?':'+o:'')),'',4)).join(' · ')};}
 if(c.type==='IM')return {i:s.now('I:'+c.id),text:'ω '+eng(val('Y:'+c.id),'rad/s',4)+' · τ '+eng(val('Y:'+c.id+':te'),'N·m',3)+' · |ψ| '+eng(s.now('Y:'+c.id+':psi'),'V·s',3)};
 if(c.type==='SRM'){const n=s.net.compInfo.get(c.id)?.srm?.N||0;return {i:s.now('I:'+c.id),text:'ω '+eng(val('Y:'+c.id),'rad/s',4)+' · τ '+eng(val('Y:'+c.id+':te'),'N·m',3)+' · '+Array.from({length:n},(_,k)=>'i'+'₁₂₃₄'[k]+' '+eng(val((k?'I'+(k+1):'I')+':'+c.id),'A',3)).join(' · ')};}
 if(c.type==='SM')return {i:s.now('I:'+c.id),text:'ω '+eng(val('Y:'+c.id),'rad/s',4)+' · τ '+eng(val('Y:'+c.id+':te'),'N·m',3)+' · i_d '+eng(val('Y:'+c.id+':id'),'A',3)+' · i_q '+eng(val('Y:'+c.id+':iq'),'A',3)};
 if(c.type==='TL')return {i:s.now('I:'+c.id),text:'v₁ '+eng(val('V:'+c.id),'V',3)+' · v₂ '+eng(val('V2:'+c.id),'V',3)};
 if(c.type==='KL'||c.type==='KG'){const n=s.net.compInfo.get(c.id)?.ports?.length||0;return {i:s.now('I:'+c.id),text:Array.from({length:n},(_,k)=>(avg?'⌀ ':'')+'i'+'₁₂₃₄₅₆₇₈'[k]+' '+eng(val((k?'I'+(k+1):'I')+':'+c.id),'A',3)).join(' · ')};}
 if(c.type==='DCM')return {i:s.now('I:'+c.id),text:'ω '+eng(val('Y:'+c.id),'rad/s',4)+' · '+(avg?'⌀ ':'')+eng(val('I:'+c.id),'A',3)};
 if(OUT_SYM[c.type]&&c.type!=='SR'){const os=outsOf(c);return {text:os.map((o,k)=>OUT_SYM[c.type][o]+' '+eng(s.now('Y:'+c.id+(k?':'+o:'')),blkUnit(c,o),3)).join(' · ')};}
 if(P.BLOCKS.has(c.type)){const y=s.now('Y:'+c.id);if(LOGIC_BLK.has(c.type))return {on:y>=.5,text:(c.type==='SR'?'Q = ':'y = ')+(y>=.5?'1':'0')};
  const u=blkUnit(c);return {text:(c.type==='DISP'?'':c.type==='VM'||c.type==='VP'?'v = ':c.type==='AM'||c.type==='IP'?'i = ':'y = ')+eng(y,u,+(c.params?.dig)||4)};}
 const i=val('I:'+c.id),v=val('V:'+c.id);let on;
 if(c.type==='SW'){const e=s.net.compInfo.get(c.id)?.main;on=!!e?.on;}if(c.type==='D'||c.type==='SCR'){const e=s.net.compInfo.get(c.id)?.main;on=!!e?.on;}
 const pre=avg?'⌀ ':'';let text='';const scale=S.iScale||1;const z=x=>Math.abs(x)<2e-4*scale?0:x;
 if(c.type==='C')text=pre+eng(v,'V',4);else if(c.type==='CPL')text=pre+eng(val('P:'+c.id),'W',3);else if(c.type==='XFMR')text=pre+'i_m '+eng(val('Im:'+c.id),'A',3);else text=pre+eng(z(i),'A',4);
 if(['L','VDC','VAC','VAC3','SW','D','SCR','R'].includes(c.type)&&Number.isFinite(i))S.iScaleNext=Math.max(S.iScaleNext||0,Math.abs(i));
 return {on,i:avg?i:s.now('I:'+c.id),text};}

// signal blocks (3.0): output unit, and which outputs are 0/1
const LOGIC_BLK=new Set(['CMP','SR','CLK','LOGIC']);
function blkUnit(c,pin){if(!c)return '';const t=c.type;if(t==='VM'||t==='VP')return 'V';if(t==='AM'||t==='IP')return 'A';if(t==='MEAS')return c.params?.qty==='V'?'V':'A';
 if(t==='DCM')return pin==='te'?'N·m':'rad/s';if(t==='IM')return pin==='te'?'N·m':pin==='psi'?'V·s':pin==='w'||!pin?'rad/s':'rad';if(t==='SM')return pin==='te'?'N·m':pin==='th'?'rad':pin==='id'||pin==='iq'?'A':'rad/s';if(t==='SRM')return pin==='te'?'N·m':pin==='th'?'rad':/^i\d$/.test(pin||'')?'A':'rad/s';if(t==='FEST')return pin==='psi'?'V·s':pin==='w1'?'rad/s':'rad';if(t==='PLL')return pin==='amp'?'':pin==='w'?'rad/s':'rad';if(t==='INT'&&c.params?.wrap==='2pi')return 'rad';return '';}
// symbols of the outputs of multi-output blocks (first output = channel Y:id, the others Y:id:pin)
const OUT_SYM={IM:{w:'ω',te:'τ_e',psi:'|ψ_R|',thf:'θ_f',thr:'θ_r'},SM:{w:'ω',te:'τ_e',th:'θ',id:'i_d',iq:'i_q'},SRM:{w:'ω',te:'τ_e',th:'θ_e',i1:'i₁',i2:'i₂',i3:'i₃',i4:'i₄'},FEST:{th:'θ̂',psi:'|ψ̂|',w1:'ω̂₁'},MOD3:{da:'d_a',db:'d_b',dc:'d_c'},DCM:{w:'ω',te:'τ_e'},PLL:{th:'θ',w:'ω',amp:'V̂_d'},CLARKE:{al:'α',be:'β'},IPARK:{al:'α',be:'β'},PARK:{d:'d',q:'q'},ICLARKE:{a:'a',b:'b',c:'c'},SR:{q:'Q',nq:'Q̄'}};
const OUT_TXT={IM:{w:'ταχύτητα ω',te:'ροπή τ_e',psi:'ροή δρομέα |ψ_R|',thf:'γωνία ροής θ_f',thr:'γωνία δρομέα θ_r'},SM:{w:'ταχύτητα ω',te:'ροπή τ_e',th:'ηλεκτρική γωνία δρομέα θ',id:'ρεύμα i_d',iq:'ρεύμα i_q'},SRM:{w:'ταχύτητα ω',te:'ροπή τ_e',th:'γωνία θ_e της φάσης 1',i1:'ρεύμα φάσης 1 (αισθητήρας)',i2:'ρεύμα φάσης 2 (αισθητήρας)',i3:'ρεύμα φάσης 3 (αισθητήρας)',i4:'ρεύμα φάσης 4 (αισθητήρας)'},FEST:{th:'γωνία θ̂',psi:'ροή |ψ̂|',w1:'συχνότητα ω̂₁'},MOD3:{da:'d_a',db:'d_b',dc:'d_c'},DCM:{w:'ταχύτητα ω',te:'ροπή τ_e'},PLL:{th:'γωνία θ',w:'συχνότητα ω',amp:'πλάτος (v_d)'},CLARKE:{al:'συνιστώσα α',be:'συνιστώσα β'},IPARK:{al:'συνιστώσα α',be:'συνιστώσα β'},PARK:{d:'συνιστώσα d',q:'συνιστώσα q'},ICLARKE:{a:'φάση a',b:'φάση b',c:'φάση c'},SR:{q:'έξοδος Q',nq:'έξοδος Q̄'}};
function outsOf(c){const q=c?.params?.conn==='bus'?{...c,params:{...c.params,conn:'sep'}}:c;return Object.entries(P.sigPins(q)).filter(([,d])=>d.dir==='out').map(([k])=>k);}
// a block on a bus (3.18) runs as one block per element, <id>[k]: how many (after the last build), and the id without [k]
const vecN=id=>S.sim?.net?.vec?.[id]||0,vecBase=id=>{const m=/^(.*)\[(\d+)\]$/.exec(String(id));return m?{id:m[1],k:+m[2]}:null;};
// ------------------------------------------------------------------ channels
function chanLabel(key){const [pre,id0,pin]=key.split(':'),vb=vecBase(id0);if(vb&&!compAt(id0)){const b=chanLabel([pre,vb.id,pin].filter(x=>x!==undefined).join(':'));return b+'['+vb.k+']';}
 const id=id0,c=compAt(id);const name=c?.label||id;
 if(pre==='VN'){const w=(id.includes('/')?[]:topDoc().wires||[]).find(w=>w.name&&((w.a.c===id&&w.a.p===pin)||(w.b.c===id&&w.b.p===pin)));return w?w.name:'v('+(c?.type==='JUNC'?'κόμβος '+id:name+'.'+pin)+')';}
 if(pre==='Y'&&c?.type==='PY')return (pin||outsOf(c)[0]||'y')+'('+name+')';
 if(pre==='Y'&&c&&OUT_SYM[c.type]){const o=pin||outsOf(c)[0];return (OUT_SYM[c.type][o]||o)+'('+name+')';}
 if(/^PSI\d$/.test(pre))return 'ψ'+'₀₁₂₃₄₅₆₇₈₉'[+pre[3]]+'('+name+')';
 const pm=pre.match(/^([IV])([1-9])$/);if(pm)return (pm[1]==='I'?'i':'v')+'₀₁₂₃₄₅₆₇₈₉'[+pm[2]]+'('+name+')';if((pre==='I'||pre==='V')&&(c?.type==='KL'||c?.type==='KG'||c?.type==='SRM'||c?.type==='TL'))return (pre==='I'?'i₁':'v₁')+'('+name+')';
 const c3=c?.type==='VAC3';return ({I:c3?'i_a':'i',V:c3?'v_an':'v',P:'p',I2:'i₂',V2:'v₂',Im:'i_m',Ib:'i_b',Ic:'i_c',Vb:'v_bn',Vc:'v_cn',Vab:'v_ab',PSW:'p_sw',D:'D',G:'g',GS:'g',REF:'ref',MEAS:'μέτρ.',CAR:'c',H:'hold',Y:c?.type==='VM'?'v':c?.type==='AM'?'i':c?.type==='SR'?'Q':'y'}[pre]||pre)+'('+name+')';}
function addProbe(key,label){if(!S.sim)return;const ok=scope.addChannel(key,label||chanLabel(key));renderChannels();if(!ok)flash('#chan-list');else{flash('#scope-card');}draw(true);}
function flash(sel){const e=$(sel);if(!e)return;e.classList.remove('flash');void e.offsetWidth;e.classList.add('flash');}
function signalsFor(c,full){const t=c.type,nv=vecN(full||(S.pfx?pid(c.id):c.id));if(t==='GND'||t==='JUNC'||t==='TAGO'||t==='TAGI'||t==='SUB'||SubC.PORT_KIND[t])return [];
 if(t==='PY')return outsOf(c).map((o,k)=>['Y:','έξοδος '+o,k?':'+o:'']);
 if(OUT_TXT[t]){const os=outsOf(c),m=os.map((o,k)=>[k?'Y:':'Y:',OUT_TXT[t][o]||o,k?':'+o:'']);return t==='DCM'?[...m,['I:','ρεύμα τυμπάνου i_a'],['V:','τάση τυμπάνου v_a'],['P:','ηλεκτρική ισχύς']]:t==='IM'||t==='SM'?[...m,['I:','ρεύμα φάσης a'],['V:','πολική τάση v_ab']]:t==='SRM'?[...m,...Array.from({length:P.srmGeo({...P.defaults(t),...c.params})[0]},(_,k)=>[[(k?'I'+(k+1):'I')+':',`ρεύμα φάσης ${k+1}`],[(k?'V'+(k+1):'V')+':',`τάση φάσης ${k+1}`],['PSI'+(k+1)+':',`ροή φάσης ${k+1} ψ`]]).flat()]:m;}
 if(P.BLOCKS.has(t)&&nv>1)return Array.from({length:nv},(_,k)=>['Y:',`έξοδος y, στοιχείο ${k+1} του διαύλου`,`[${k+1}]`]);
 if(P.BLOCKS.has(t))return [['Y:',t==='DISP'?'τιμή εισόδου':t==='VM'?'τάση (μέτρηση)':t==='VP'?'τάση ως προς τη γη':t==='AM'?'ρεύμα a → b (μέτρηση)':t==='IP'?'ρεύμα a → b (τσιμπίδα)':t==='SR'?'έξοδος Q':'έξοδος y']];if(t==='PWM'){const k=c.params?.mode==='pi';return [['D:','duty D'],['G:','παλμός πύλης g'],['CAR:','φέρον c(t)'],...(k?[['REF:','αναφορά'],['MEAS:','μετρούμενο']]:[])];}
 if(t==='SH')return [['H:','κρατημένη τιμή (δείγματα)']];
 if(t==='MOV')return [['I:','ρεύμα αλεξικέραυνου'],['V:','τάση αλεξικέραυνου'],['P:','ισχύς']];
 if(t==='SG')return [['I:','ρεύμα σπινθηριστή'],['V:','τάση στο διάκενο'],['P:','ισχύς στο τόξο']];
 if(t==='TL')return [['V:','τάση στην αρχή (a1 − b1)'],['V2:','τάση στο τέλος (a2 − b2)'],['I:','ρεύμα που μπαίνει στην αρχή'],['I2:','ρεύμα που μπαίνει στο τέλος']];
 if(t==='KL'||t==='KG'){const n=P.nPorts({...P.defaults(t),...c.params}),w=t==='KL'?'τυλίγματος':'θύρας';return Array.from({length:n},(_,k)=>[[(k?'I'+(k+1):'I')+':',`ρεύμα ${w} ${k+1} (a → b)`],[(k?'V'+(k+1):'V')+':',`τάση ${w} ${k+1}`]]).flat();}
 const base=[['I:','ρεύμα'],['V:','τάση'],['P:',['VDC','VAC','IDC'].includes(t)?'ισχύς που δίνει':'ισχύς']];if(t==='SW'||t==='SCR')base.splice(1,0,['GS:','παλμός πύλης (1 = ON)']);if(t==='SW'&&(+c.params?.Eon>0||+c.params?.Eoff>0))base.push(['PSW:','απώλειες μεταγωγής (μέση ανά T)']);
 if(t==='VAC3')return [['I:','ρεύμα φάσης a'],['Ib:','ρεύμα φάσης b'],['Ic:','ρεύμα φάσης c'],['V:','τάση v_an'],['Vb:','τάση v_bn'],['Vc:','τάση v_cn'],['Vab:','πολική τάση v_ab'],['P:','ισχύς που δίνει (3φ)']];if(t==='XFMR')return [['I:','ρεύμα πρωτεύοντος'],['V:','τάση πρωτεύοντος'],['I2:','ρεύμα δευτερεύοντος'],['V2:','τάση δευτερεύοντος'],['Im:','ρεύμα μαγνήτισης'],['P:','ισχύς']];return base;}
function renderChannels(){
 const sel=$('#add-signal');const opts=['<option value="">+ Σήμα στο scope…</option>'];
 for(const {c,id,label} of allComps()){const sg=signalsFor(c,id);if(!sg.length)continue;opts.push(`<optgroup label="${esc(label)} · ${esc(P.PARTS[c.type].name)}">`+sg.map(([p,n,f])=>`<option value="${p}${id}${f||''}">${esc(n)} ${esc(label)}</option>`).join('')+'</optgroup>');}
 const nodes=(topDoc().wires||[]).filter(w=>w.name).map(w=>`<option value="VN:${w.a.c}:${w.a.p}">τάση κόμβου ${esc(w.name)}</option>`);if(nodes.length)opts.push('<optgroup label="Κόμβοι με όνομα">'+nodes.join('')+'</optgroup>');
 sel.innerHTML=opts.join('');
 const panes=scope.cfg.panes;
 $('#chan-list').innerHTML=panes.map((p,pi)=>`<div class="pane-row"><div class="pane-head"><b>Παράθυρο ${pi+1}</b><label class="mini"><input type="checkbox" data-pauto="${pi}" ${p.y?.auto===false?'':'checked'}> auto</label>${p.y?.auto===false?`<input class="ymin" data-pmin="${pi}" value="${p.y.min??''}" placeholder="min"><input class="ymax" data-pmax="${pi}" value="${p.y.max??''}" placeholder="max">`:''}<label class="mini"><input type="checkbox" data-pzero="${pi}" ${p.zero?'checked':''}> 0</label></div>
  ${p.ch.map(ch=>`<div class="chan" data-key="${esc(ch.key)}"><label class="sw"><input type="checkbox" data-on="${esc(ch.key)}" ${ch.on?'checked':''}><i style="background:${ch.color}"></i></label><input class="clabel" data-label="${esc(ch.key)}" value="${esc(ch.label)}"><select data-pane="${esc(ch.key)}">${[0,1,2,3].map(i=>`<option value="${i}" ${i===pi?'selected':''}>Π${i+1}</option>`).join('')}</select><button class="x" data-rm="${esc(ch.key)}" title="Αφαίρεση">✕</button></div>`).join('')||'<div class="muted small">Κανένα σήμα. Δεξί κλικ σε στοιχείο → Scope, ή επίλεξε από τη λίστα.</div>'}</div>`).join('');
 $$('#chan-list [data-rm]').forEach(b=>b.onclick=()=>{scope.removeChannel(b.dataset.rm);renderChannels();draw(true);});
 $$('#chan-list [data-on]').forEach(b=>b.onchange=()=>{const ch=scope.channels().find(c=>c.key===b.dataset.on);for(const p of scope.cfg.panes)for(const c of p.ch)if(c.key===b.dataset.on)c.on=b.checked;void ch;draw(true);});
 $$('#chan-list [data-pane]').forEach(b=>b.onchange=()=>{scope.moveChannel(b.dataset.pane,+b.value);renderChannels();draw(true);});
 $$('#chan-list [data-label]').forEach(b=>b.onchange=()=>{for(const p of scope.cfg.panes)for(const c of p.ch)if(c.key===b.dataset.label)c.label=b.value;draw(true);});
 $$('#chan-list [data-pauto]').forEach(b=>b.onchange=()=>{const p=scope.cfg.panes[+b.dataset.pauto];if(b.checked)p.y={auto:true};else{const L=scope.layout?.[+b.dataset.pauto];p.y={auto:false,min:L?+L.lo.toPrecision(3):-1,max:L?+L.hi.toPrecision(3):1};}renderChannels();draw(true);});
 $$('#chan-list [data-pzero]').forEach(b=>b.onchange=()=>{scope.cfg.panes[+b.dataset.pzero].zero=b.checked;draw(true);});
 $$('#chan-list [data-pmin],#chan-list [data-pmax]').forEach(b=>b.onchange=()=>{const pi=+(b.dataset.pmin??b.dataset.pmax);const p=scope.cfg.panes[pi];const v=P.parseEng(b.value);if(Number.isFinite(v)){if(b.dataset.pmin!==undefined)p.y.min=v;else p.y.max=v;}draw(true);});
}
function renderMeasure(){
 if(!S.sim)return;const rows=[];const cur=scope.cfg.cursors;
 for(const ch of scope.channels()){if(!ch.on)continue;const st=scope.stats(ch.key);const u=MeasureUnit(ch.key);const lp=S.sim.lastPeriod(ch.key.startsWith('VN:')?(()=>{const n=S.sim.net.pinNet.get(ch.key.slice(3));return n&&!n.ground?'N:'+n.canon:'';})():ch.key);
  let cv='';if(cur.length){const ci=scope.resolve(ch.key);const a=ci===-1?NaN:scope.valueAt(ci,cur[0]),b=cur[1]!==undefined&&ci!==-1?scope.valueAt(ci,cur[1]):NaN;cv=`<td>${eng(a,u)}</td><td>${cur.length>1?eng(b,u):''}</td><td>${cur.length>1?eng(b-a,u):''}</td>`;}
  rows.push(`<tr><td><i class="dot" style="background:${ch.color}"></i>${esc(ch.label)}</td><td>${st?eng(st.avg,u):'—'}</td><td>${st&&Number.isFinite(st.rms)?eng(st.rms,u):'—'}</td><td>${st?eng(st.min,u):'—'}</td><td>${st?eng(st.max,u):'—'}</td><td>${st?eng(st.pp,u):'—'}</td><td>${lp?eng(lp.avg,u):'—'}</td>${cv}</tr>`);}
 const [t0,t1]=scope.viewRange();
 $('#measure').innerHTML=`<table><thead><tr><th>Σήμα</th><th>Μέση</th><th>RMS</th><th>min</th><th>max</th><th>p-p</th><th>⌀ τελ. T</th>${cur.length?`<th>A @ ${eng(cur[0],'s')}</th><th>${cur.length>1?'B @ '+eng(cur[1],'s'):'B'}</th><th>B − A${cur.length>1?' · Δt '+eng(cur[1]-cur[0],'s'):''}</th>`:''}</tr></thead><tbody>${rows.join('')}</tbody></table>
  <p class="muted small">Στατιστικά στο ορατό παράθυρο ${eng(t0,'s')} … ${eng(t1,'s')}${scope.cfg.frozen?' (σταθερή προβολή · διπλό κλικ για ζωντανή)':''}. Κλικ στο scope: cursor A, Shift+κλικ: cursor B.</p>`;
}
function MeasureUnit(key){return MeasureUnitCache[key.split(':')[0]]??Scope.unitOf(key,S.sim);}const MeasureUnitCache={};

// ------------------------------------------------------------------ response metrics
function simKey(key){if(!key.startsWith('VN:'))return key;const n=S.sim?.net.pinNet.get(key.slice(3));return n&&!n.ground?'N:'+n.canon:null;}
function perSeries(key){const s=S.sim;const k=simKey(key);const i=k===null?undefined:s?.chIndex.get(k);if(i===undefined)return null;const p=s.per,t=[],y=[];const st=(p.head-p.n+p.cap)%p.cap;for(let q=0;q<p.n;q++){const j=(st+q)%p.cap;t.push(p.t[j]);y.push(p.avg[j*p.nch+i]);}return {t,y};}
function refFor(key){ // reference of the loop that measures this signal, as a function of t
 const sched=(s,t,d)=>{if(!s)return d;let v=s[0][1];if(t<s[0][0])return d;for(const [ts,val] of s){if(ts<=t+1e-15)v=val;else break;}return v;};
 for(const c of editor.doc.components){if(c.type!=='PWM')continue;const p={...P.defaults('PWM'),...c.params};if(p.mode!=='pi')continue;
  if(key==='MEAS:'+c.id||key===(p.qty==='V'?'V:':'I:')+p.sensor){const s=P.parseSched(p.ref);if(s)return {fn:t=>sched(s,t,s[0][1]),label:`αναφορά του ${c.label||c.id}`};}}
 return null;}
function metricsFor(key,ev,opts={}){const d=perSeries(key);if(!d||d.t.length<4)return {ok:false,why:'Δεν υπάρχουν ακόμη αρκετές περίοδοι.'};
 const evs=Metrics.scheduleEvents(editor.doc,P.parseSched);const i=evs.findIndex(e=>Math.abs(e.t-ev.t)<1e-12);const next=evs.find((e,j)=>j>i&&e.t>ev.t+1e-12);
 const tEnd=Math.min(next?next.t:Infinity,S.sim.t);const rf=opts.ref==='final'?null:opts.ref==='value'?opts.value:(refFor(key)?.fn||null);
 return Metrics.responseMetrics({t:d.t,y:d.y,tStep:ev.t,tEnd,ref:rf,band:opts.band??.02});}
function metricsRows(m,u){if(!m.ok)return `<p class="muted small">${esc(m.why)}</p>`;const pct=v=>Number.isFinite(v)?fmt(v,3)+' %':'—';
 const rows=m.disturbance?[['Μέγιστη απόκλιση',eng(m.maxDev,u)],['τη στιγμή (μετά το βήμα)',eng(m.tDev,'s')],['Επαναφορά στη ζώνη ±'+eng(m.tol,u),m.settled?eng(m.ts,'s'):'δεν επανήλθε']]
  :[['Υπερύψωση',pct(m.overshoot)],['Χρόνος ανόδου 10–90 %',eng(m.rise,'s')],['Χρόνος κορυφής',eng(m.tPeak,'s')],['Αποκατάσταση στη ζώνη ±'+eng(m.tol,u),m.settled?eng(m.ts,'s'):'δεν σταθεροποιήθηκε']];
 return `<table class="kv"><tbody><tr><td>Αρχική → τελική</td><td>${eng(m.y0,u)} → ${eng(m.yf,u)}</td></tr>${rows.map(([a,b])=>`<tr><td>${a}</td><td>${b}</td></tr>`).join('')}
  ${Number.isFinite(m.ess)?`<tr><td>Σφάλμα μόνιμης κατάστασης</td><td>${eng(m.ess,u)}</td></tr>`:''}<tr><td>IAE = ∫|e|dt</td><td>${eng(m.IAE,u+'·s')}</td></tr><tr><td>ISE = ∫e²dt</td><td>${eng(m.ISE,u?u+'²·s':'s')}</td></tr><tr><td>ITAE = ∫t|e|dt</td><td>${eng(m.ITAE,u+'·s²')}</td></tr></tbody></table>`;}
function eventMetricsHTML(key){if(!S.sim)return '';const evs=Metrics.scheduleEvents(editor.doc,P.parseSched).filter(e=>e.t<S.sim.t);if(!evs.length)return '<p class="muted small">Τρέξε την προσομοίωση πέρα από τα βήματα (⏩) για να βγουν οι δείκτες.</p>';
 const u=MeasureUnit(key);return evs.map(e=>{const m=metricsFor(key,e);return `<div class="evm"><b>${esc(e.what)} @ ${eng(e.t,'s')}</b>${m.ok?(m.disturbance?` · μέγ. απόκλιση ${eng(m.maxDev,u)}, επαναφορά ${m.settled?eng(m.ts,'s'):'—'}`:` · υπερύψωση ${fmt(m.overshoot,3)} %, t_r ${eng(m.rise,'s')}, t_s(±2 %) ${m.settled?eng(m.ts,'s'):'—'}`)+` · IAE ${eng(m.IAE,u+'·s')}`:' · '+esc(m.why)}</div>`;}).join('');}
function renderMetricsPanel(){const box=$('#rm-out');if(!box||!S.sim||!$('#rm-block').open)return;
 const sig=$('#rm-sig'),evSel=$('#rm-ev');const chans=scope.channels();const keep=sig.value;
 sig.innerHTML=chans.map(c=>`<option value="${esc(c.key)}">${esc(c.label)}</option>`).join('')||'<option value="">— πρόσθεσε σήμα στο scope —</option>';if(chans.some(c=>c.key===keep))sig.value=keep;
 const evs=Metrics.scheduleEvents(editor.doc,P.parseSched),kev=evSel.value;evSel.innerHTML=evs.map((e,i)=>`<option value="${i}">${esc(e.what)} @ ${eng(e.t,'s')}</option>`).join('')+'<option value="manual">χειροκίνητα…</option>';
 if([...evSel.options].some(o=>o.value===kev))evSel.value=kev;$('#rm-t-l').hidden=evSel.value!=='manual';$('#rm-val-l').hidden=$('#rm-ref').value!=='value';
 const key=sig.value;if(!key){box.innerHTML='';return;}
 const ev=evSel.value==='manual'?{t:(P.parseEng($('#rm-t').value)||0)*1e-3}:evs[+evSel.value];if(!ev){box.innerHTML='<p class="muted small">Δεν υπάρχει πρόγραμμα R(t), V(t), P(t), D(t) ή αναφοράς: διάλεξε «χειροκίνητα» και δώσε τη στιγμή του βήματος.</p>';return;}
 const refMode=$('#rm-ref').value,rf=refFor(key);const m=metricsFor(key,ev,{ref:refMode==='auto'&&!rf?'final':refMode,value:P.parseEng($('#rm-val').value),band:+$('#rm-band').value});
 box.innerHTML=`<p class="muted small">${refMode==='auto'?(rf?esc(rf.label):'σφάλμα ως προς την τελική τιμή'):refMode==='final'?'σφάλμα ως προς την τελική τιμή':'σφάλμα ως προς σταθερή τιμή'} · από μέσες τιμές ανά περίοδο (χωρίς την κυμάτωση)</p>`+metricsRows(m,MeasureUnit(key));}

// ------------------------------------------------------------------ harmonics (Fourier series over whole periods of f₁) and THD
function rawSeries(key){const s=S.sim;const k=simKey(key);const i=k===null?undefined:s?.chIndex.get(k);if(i===undefined)return null;const r=s.ring,t=[],y=[];const st=(r.head-r.n+r.cap)%r.cap;
 for(let q=0;q<r.n;q++){const j=(st+q)%r.cap;t.push(r.t[j]);y.push(r.d[j*r.nch+i]);}return {t,y};}
// fundamental: the AC source, the SPWM reference or the PLL, else the switching frequency
function autoF1(){for(const c of editor.doc.components){const p={...P.defaults(c.type),...c.params};if(c.type==='VAC3'||c.type==='VAC')return [+p.f,`πηγή ${c.label||c.id}`];if(c.type==='PWM'&&p.mode==='spwm')return [+p.fref,`αναφορά SPWM ${c.label||c.id}`];if(c.type==='PLL')return [+p.f0,`PLL ${c.label||c.id}`];}
 return S.sim?[1/S.sim.T,'συχνότητα βάσης (μεταγωγή)']:[50,'προεπιλογή'];}
function renderFFT(){const box=$('#ff-out');if(!box||!S.sim||!$('#ff-block').open)return;
 const sig=$('#ff-sig');const chans=scope.channels();const keep=sig.value;
 sig.innerHTML=chans.map(c=>`<option value="${esc(c.key)}">${esc(c.label)}</option>`).join('')||'<option value="">— πρόσθεσε σήμα στο scope —</option>';if(chans.some(c=>c.key===keep))sig.value=keep;
 const key=sig.value;if(!key){box.innerHTML='';return;}
 const fv=P.parseEng($('#ff-f1').value),[fa,fsrc]=autoF1(),f1=Number.isFinite(fv)&&fv>0?fv:fa,d=rawSeries(key);if(!d){box.innerHTML='';return;}
 const r=Metrics.harmonics({t:d.t,y:d.y,f1,periods:+$('#ff-p').value,H:+$('#ff-h').value*+$('#ff-p').value});
 if(!r.ok){box.innerHTML=`<p class="muted small">${esc(r.why)}</p>`;return;}
 const u=MeasureUnit(key),A1=r.A1,rel=h=>A1>0?100*r.A[h]/A1:NaN;
 const top=[...Array(r.H+1).keys()].slice(2).sort((a,b)=>r.A[b]-r.A[a]).slice(0,8).filter(h=>r.A[h]>1e-9*Math.max(A1,1e-30)).sort((a,b)=>a-b);
 // bar chart: harmonics in % of the fundamental, scaled to the largest one (the fundamental bar is clipped)
 const W=260,Hh=110,pl=28,pb=16,n=r.H,bw=(W-pl-4)/n,mx=Math.max(1e-9,...[...Array(n+1).keys()].slice(2).map(rel).filter(Number.isFinite)),ns=niceTop(mx);
 const bars=[...Array(n).keys()].map(k=>{const h=k+1,v=h===1?ns:Math.min(rel(h),ns),y=Hh-pb-(Hh-pb-6)*v/ns;return `<rect class="${h===1?'f1':'hb'}" x="${pl+k*bw+bw*.15}" y="${y}" width="${Math.max(bw*.7,.6)}" height="${Hh-pb-y}"><title>h = ${h} · ${eng(h*f1,'Hz')} · ${fmt(rel(h),3)} %</title></rect>`;}).join('');
 const ticks=[0,.5,1].map(f=>`<text x="${pl-3}" y="${Hh-pb-(Hh-pb-6)*f+3}" text-anchor="end">${fmt(ns*f,2)}%</text>`).join('')+[1,...[5,10,20,50,100,200,500].filter(h=>h<=n)].filter((h,i,a)=>a.length<7||h!==a[1]).map(h=>`<text x="${pl+(h-.5)*bw}" y="${Hh-3}" text-anchor="${h===n?'end':'middle'}">${h}</text>`).join('');
 box.innerHTML=`<p class="muted small">f₁ = ${eng(f1,'Hz')} (${Number.isFinite(fv)&&fv>0?'χειροκίνητα':esc(fsrc)}) · ${r.periods} ${r.periods>1?'περίοδοι':'περίοδος'}, ${eng(r.window[0],'s')} … ${eng(r.window[1],'s')} · ${r.n} σημεία</p>
  <svg class="ffchart" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Αρμονικές σε % της θεμελιώδους">${bars}<line x1="${pl}" y1="${Hh-pb}" x2="${W-2}" y2="${Hh-pb}"/>${ticks}</svg>
  <table class="kv"><tbody><tr><td>DC</td><td>${eng(r.dc,u)}</td></tr><tr><td>Θεμελιώδης: πλάτος / RMS</td><td>${eng(A1,u)} / ${eng(r.rms1,u)}</td></tr><tr><td>Φάση θεμελιώδους (cos, από την αρχή του παραθύρου)</td><td>${fmt(-r.ph[1],4)}°</td></tr><tr><td>RMS (όλο το σήμα)</td><td>${eng(r.rms,u)}</td></tr>
  <tr><td>THD (h = 2 … ${r.H})</td><td><b>${fmt(r.thd,4)} %</b></td></tr><tr><td>THD (όλο το φάσμα, από την RMS)</td><td>${fmt(r.thdAll,4)} %</td></tr></tbody></table>
  ${top.length?`<table class="kv ff-top"><tbody><tr><td>h</td><td>f</td><td>πλάτος</td><td>% A₁</td><td>φάση</td></tr>${top.map(h=>`<tr><td>${h}</td><td>${eng(h*f1,'Hz')}</td><td>${eng(r.A[h],u)}</td><td>${fmt(rel(h),3)}</td><td>${fmt(-r.ph[h],3)}°</td></tr>`).join('')}</tbody></table>`:''}
  <p class="muted small">Σειρά Fourier πάνω σε ακέραιες περιόδους της f₁, με ακριβή ολοκλήρωση ανάμεσα στα σημεία του λύτη (όχι επαναδειγματοληψία). THD = √(Σ A_h²)/A₁ για h ≥ 2. Η δεύτερη τιμή περιέχει και ό,τι δεν είναι αρμονική της f₁ (π.χ. υποαρμονικές, συνιστώσες μεταγωγής πάνω από το h).</p>`;}
// ------------------------------------------------------------------ impedance spectroscopy (3.3.1): Z(f) = V₁/I₁ at each frequency of the perturbation
const EIS={run:false,pts:[]};
// model impedance of the cell of the tutorial: R₀ + R₁‖C₁ + Warburg (exact, and with the R–C bank the solver uses)
function cellZ(f,bank){const w=2*Math.PI*f,R0=+paramsOf('R0')?.R,R1=+paramsOf('R1')?.R,C1=+paramsOf('C1')?.C,W=paramsOf('W1');if(![R0,R1,C1].every(Number.isFinite))return null;
 const d=1+(w*R1*C1)**2,zw=W?(bank?P.cpeZbank:P.cpeZ)({...P.defaults('CPE'),...W},w):[0,0];return [R0+R1/d+zw[0],-w*R1*R1*C1/d+zw[1]];}
function renderEISForm(){const vs=$('#eis-v'),is=$('#eis-i'),par=$('#eis-par');if(!vs)return;const chans=scope.channels(),m=S.tutMeta?.eis;
 const opt=(sel,list,pref)=>{const keep=sel.value;sel.innerHTML=list.map(([k,n])=>`<option value="${esc(k)}">${esc(n)}</option>`).join('');if(list.some(x=>x[0]===keep))sel.value=keep;else if(pref&&list.some(x=>x[0]===pref))sel.value=pref;};
 const all=[...new Set([...chans.map(c=>c.key),...(S.sim?S.sim.keys.filter(k=>k.startsWith('Y:')):[])])].map(k=>[k,chans.find(c=>c.key===k)?.label||chanLabel(k)]);
 opt(vs,all,m?.vKey);opt(is,all,m?.iKey);const ps=bfParams().map(([k,n])=>[k,n]);const pk=par.value;opt(par,ps,m?m.comp+'.'+m.param:'');
 if(m&&!$('#eis-from').value){$('#eis-from').value=m.from;$('#eis-to').value=m.to;$('#eis-ppd').value=m.ppd;$('#eis-settle').value=m.settle;$('#eis-per').value=m.periods;}}
async function runEIS(){if(EIS.run||!S.sim||S.error)return;const [comp,param]=String($('#eis-par').value).split('.'),vKey=$('#eis-v').value,iKey=$('#eis-i').value,out=$('#eis-out');
 const a=P.parseEng($('#eis-from').value),b=P.parseEng($('#eis-to').value),ppd=Math.max(1,Math.min(20,+$('#eis-ppd').value|0)),settle=Math.max(0,+$('#eis-settle').value||3),per=Math.max(1,+$('#eis-per').value|0||2);
 if(!comp||!vKey||!iKey||!(a>0)||!(b>a)){out.innerHTML='<p class="muted small">Διάλεξε τάση, ρεύμα, την παράμετρο της συχνότητας και εύρος.</p>';return;}
 const n=Math.max(2,Math.round(Math.log10(b/a)*ppd)+1),fs=[...Array(n).keys()].map(k=>a*Math.pow(b/a,k/(n-1))).reverse(),base=project();
 EIS.run=true;EIS.pts=[];EIS.meta={vKey,iKey,cell:S.tut?.id==='cell_eis'};$('#eis-run').disabled=true;$('#eis-stop').disabled=false;const t0=performance.now();
 try{for(const f of fs){if(!EIS.run)break;const r=MNA.eisPoint(base,{comp,param,f:+f.toPrecision(6),vKey:simKey(vKey),iKey:simKey(iKey),settle,periods:per,minSettle:S.tutMeta?.eis?.minSettle||0,hDiv:+$('#sim-step').value||50,method:$('#method').value});
   const z=Metrics.impedance(r);if(z.ok)EIS.pts.push(z);drawEIS(`${EIS.pts.length}/${n} · ${fmt((performance.now()-t0)/1e3,3)} s`);await new Promise(res=>setTimeout(res,0));}}
 catch(e){out.insertAdjacentHTML('beforeend',`<p class="warn-text small">${esc(e.message)}</p>`);}finally{EIS.run=false;$('#eis-run').disabled=false;$('#eis-stop').disabled=true;drawEIS(`${EIS.pts.length} συχνότητες · ${fmt((performance.now()-t0)/1e3,3)} s`);}}
function drawEIS(status){const out=$('#eis-out');if(!out||!EIS.pts.length)return;const pts=[...EIS.pts].sort((p,q)=>p.f-q.f),W=260,H=190,Pp=svgPlot(W,H,[34,6,6,22]),mo=EIS.meta.cell;
 const th=mo?pts.map(p=>({f:p.f,z:cellZ(p.f,false)})).filter(q=>q.z):[];const fine=mo?[...Array(60).keys()].map(k=>{const f=pts[0].f*Math.pow(pts[pts.length-1].f/pts[0].f,k/59);return cellZ(f,false);}).filter(Boolean):[];
 // Nyquist: −Im(Z) up, same scale on both axes
 const re=[...pts.map(p=>p.re),...fine.map(z=>z[0])],im=[...pts.map(p=>-p.im),...fine.map(z=>-z[1])];let x0=Math.min(...re),x1=Math.max(...re),y0=Math.min(0,...im),y1=Math.max(...im);const span=Math.max(x1-x0,y1-y0)*1.1||1;x0-=span*.05;x1=x0+span;y1=y0+span*(H-28)/(W-40);
 const ny=`<svg class="bfchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Διάγραμμα Nyquist"><rect x="34" y="6" width="${W-40}" height="${H-28}" class="frame"/>${fine.length?`<path class="map" d="M${fine.map(z=>`${Pp.X(z[0],x0,x1).toFixed(1)},${Pp.Y(-z[1],y0,y1).toFixed(1)}`).join(' L')}"/>`:''}
  ${pts.map(p=>`<circle cx="${Pp.X(p.re,x0,x1).toFixed(1)}" cy="${Pp.Y(-p.im,y0,y1).toFixed(1)}" r="2.2"><title>${eng(p.f,'Hz')}: ${eng(p.re,'Ω')} − j${eng(-p.im,'Ω')}</title></circle>`).join('')}
  <text x="${(W+34)/2}" y="${H-1}" text-anchor="middle">Re Z (${eng(x0,'Ω',3)} … ${eng(x1,'Ω',3)})</text><text x="8" y="${H/2}" transform="rotate(-90 8 ${H/2})" text-anchor="middle">−Im Z</text></svg>`;
 // Bode: |Z| and phase against log f
 const lf=pts.map(p=>Math.log10(p.f)),la=Math.min(...lf),lb=Math.max(...lf)+1e-9,mags=pts.map(p=>p.mag),ma=Math.min(...mags),mb=Math.max(...mags),phs=pts.map(p=>p.phase),pa=Math.min(...phs,0),pb=Math.max(...phs,0);
 const bo=`<svg class="bfchart" viewBox="0 0 ${W} 120" role="img" aria-label="Διάγραμμα Bode"><rect x="34" y="6" width="${W-40}" height="92" class="frame"/>
  <path class="map" d="M${pts.map((p,k)=>`${(34+(W-40)*(lf[k]-la)/(lb-la)).toFixed(1)},${(98-88*(p.mag-ma)/((mb-ma)||1)).toFixed(1)}`).join(' L')}"/>
  <path class="cob" d="M${pts.map((p,k)=>`${(34+(W-40)*(lf[k]-la)/(lb-la)).toFixed(1)},${(98-88*(p.phase-pa)/((pb-pa)||1)).toFixed(1)}`).join(' L')}"/>
  <text x="30" y="12" text-anchor="end">${eng(mb,'Ω',3)}</text><text x="30" y="98" text-anchor="end">${eng(ma,'Ω',3)}</text><text x="${(W+34)/2}" y="116" text-anchor="middle">${eng(pts[0].f,'Hz')} … ${eng(pts[pts.length-1].f,'Hz')} (log) · |Z| κόκκινο, φάση πράσινο (${fmt(pa,3)}° … ${fmt(pb,3)}°)</text></svg>`;
 const rows=pts.map(p=>{const z=th.find(q=>q.f===p.f)?.z;const e=z?100*Math.hypot(p.re-z[0],p.im-z[1])/Math.hypot(z[0],z[1]):NaN;return `<tr><td>${eng(p.f,'Hz',3)}</td><td>${eng(p.mag,'Ω',4)}</td><td>${fmt(p.phase,3)}°</td>${mo?`<td>${z?eng(Math.hypot(...z),'Ω',4):''}</td><td>${Number.isFinite(e)?fmt(e,2)+' %':''}</td>`:''}</tr>`;}).join('');
 out.innerHTML=ny+bo+`<p class="muted small">${esc(status)} · Z = V₁/I₁ στη θεμελιώδη, από μέσες τιμές ανά περίοδο μεταγωγής, με αφαίρεση γραμμικής ολίσθησης${mo?' · καμπύλη: θεωρητικό Z του μοντέλου της κυψέλης':''}</p>
  <table class="kv ff-top"><tbody><tr><td>f</td><td>|Z|</td><td>φάση</td>${mo?'<td>|Z| θεωρία</td><td>διαφορά</td>':''}</tr>${rows}</tbody></table>`;}

// ------------------------------------------------------------------ Poincaré map and bifurcation diagram (3.2)
// one sample per period of a channel: the value at the period boundary (e.g. the current at the clock) or min/max/mean
function perSamples(key,stat,n=400){const s=S.sim;const k=simKey(key);const i=k===null?undefined:s?.chIndex.get(k);if(i===undefined)return [];const p=s.per,a=p[stat]||p.end,out=[];
 for(let q=Math.min(n,p.n);q>=1;q--){const j=(p.head-q+p.cap)%p.cap;out.push(a[j*p.nch+i]);}return out;}
function periodText(q){return Number.isNaN(q.period)?'λίγες περίοδοι':q.period===0?'χωρίς περίοδο ≤ 16T (χαοτική ή ακόμη μεταβατική)':q.period+'T'+(q.period>1?' (υποαρμονική)':'');}
const svgPlot=(W,H,pad)=>{const [l,r,t,b]=pad;return {X:(v,lo,hi)=>l+(W-l-r)*(v-lo)/(hi-lo||1),Y:(v,lo,hi)=>H-b-(H-t-b)*(v-lo)/(hi-lo||1)};};
// ideal return map of the current-mode buck with a battery: two straight branches (reset inside the period, or none)
function pcmMapFn(m){if(!paramsOf('V1')||!paramsOf('VO')||!paramsOf('L1'))return null;const vl=m.mode==='valley',ic=+(editor.comp('IC')?.params.v??m.ic),Vin=+paramsOf('V1').V,Vo=+paramsOf('VO').V,L=+paramsOf('L1').L,R=paramsOf('RMP1'),T=m.T;
 const m1=(Vin-Vo)/L,m2=Vo/L,ma=R?(+R.hi-+R.lo)/T:0;
 const z=v=>Math.max(0,v); // the diode stops the current at zero
 return vl?x=>{const t=(x-ic)/(m2+ma);return t>=T?z(x-m2*T):t<=0?x+m1*T:ic+ma*t+m1*(T-t);}   // valley: OFF from the clock until i_L = i_c + ramp
  :x=>{const t=(ic-x)/(m1+ma);return t>=T?x+m1*T:t<=0?z(x-m2*T):z(ic-ma*t-m2*(T-t));};}    // peak: ON from the clock until i_L + ramp = i_c
function renderPoincare(){const box=$('#bf-map');if(!box||!S.sim||!$('#bf-block').open)return;if(!BF.run)renderBifurcationForm();
 const sig=$('#bf-sig'),chans=scope.channels(),keep=sig.value;sig.innerHTML=chans.map(c=>`<option value="${esc(c.key)}">${esc(c.label)}</option>`).join('')||'<option value="">— πρόσθεσε σήμα στο scope —</option>';
 if(chans.some(c=>c.key===keep))sig.value=keep;else if(S.tutMeta?.poincare&&chans.some(c=>c.key===S.tutMeta.poincare.key))sig.value=S.tutMeta.poincare.key;
 const key=sig.value;if(!key){box.innerHTML='';return;}const x=perSamples(key,$('#bf-stat').value,300);if(x.length<8){box.innerHTML='<p class="muted small">Τρέξε την προσομοίωση μερικές περιόδους.</p>';return;}
 const q=Metrics.periodicity(x.slice(-100)),u=MeasureUnit(key),W=260,H=200,P=svgPlot(W,H,[34,6,6,22]);let lo=Math.min(...x),hi=Math.max(...x);const pd=(hi-lo)*.08||Math.abs(hi)*.02||1;lo-=pd;hi+=pd;
 const fn=S.tutMeta?.map==='pcm'&&S.tut?.id==='peak_cm'&&key==='Y:AM1'&&$('#bf-stat').value==='end'?pcmMapFn(S.tutMeta):null;
 const pts=x.slice(1).map((v,k)=>`<circle cx="${P.X(x[k],lo,hi).toFixed(1)}" cy="${P.Y(v,lo,hi).toFixed(1)}" r="1.6"/>`).join('');
 const cob=x.slice(-17);let cw=`M${P.X(cob[0],lo,hi).toFixed(1)},${P.Y(cob[0],lo,hi).toFixed(1)}`;for(let k=1;k<cob.length;k++)cw+=` V${P.Y(cob[k],lo,hi).toFixed(1)} H${P.X(cob[k],lo,hi).toFixed(1)}`;
 let curve='';if(fn){const n=120;curve='M'+[...Array(n+1).keys()].map(k=>{const v=lo+(hi-lo)*k/n;return `${P.X(v,lo,hi).toFixed(1)},${P.Y(fn(v),lo,hi).toFixed(1)}`;}).join(' L');}
 const tk=[lo+pd,hi-pd].map(v=>`<text x="${P.X(v,lo,hi)}" y="${H-8}" text-anchor="middle">${fmt(v,3)}</text><text x="30" y="${P.Y(v,lo,hi)+3}" text-anchor="end">${fmt(v,3)}</text>`).join('');
 box.innerHTML=`<svg class="bfchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Χάρτης Poincaré"><rect x="34" y="6" width="${W-40}" height="${H-28}" class="frame"/>
  <line class="diag" x1="${P.X(lo,lo,hi)}" y1="${P.Y(lo,lo,hi)}" x2="${P.X(hi,lo,hi)}" y2="${P.Y(hi,lo,hi)}"/>${curve?`<path class="map" d="${curve}"/>`:''}<path class="cob" d="${cw}"/>${pts}${tk}
  <text x="${(W+34)/2}" y="${H-1}" text-anchor="middle">x[n]</text><text x="8" y="${H/2}" transform="rotate(-90 8 ${H/2})" text-anchor="middle">x[n+1]</text></svg>
  <p class="small">Περίοδος: <b>${esc(periodText(q))}</b>${q.period>0?` · τιμές ${q.distinct.map(v=>eng(v,u,4)).join(', ')}`:''}</p>
  <p class="muted small">Κάθε σημείο: το δείγμα μιας περιόδου (οριζόντια) και της επόμενης (κάθετα). Σταθερό σημείο πάνω στη διαγώνιο = λειτουργία 1T. Η σκάλα (cobweb) δείχνει τις τελευταίες 16 περιόδους.${fn?' Η καμπύλη είναι ο ιδανικός χάρτης: η κλίση του στο σταθερό σημείο είναι το λ.':''}</p>`;}
const BF={run:false,pts:[]};
function bfParams(){const out=[];for(const c of editor.doc.components){const d=P.PARTS[c.type];if(!d?.params)continue;const p={...P.defaults(c.type),...c.params};
  for(const sp of d.params){if(sp.show&&!sp.show(p))continue;const v=+p[sp.k];if((sp.type==='num'||(c.type==='CONST'&&sp.k==='v'))&&Number.isFinite(v))out.push([c.id+'.'+sp.k,`${c.label||c.id}: ${sp.label}${sp.unit?' ('+sp.unit+')':''}`,v]);}}return out;}
function renderBifurcationForm(){const sel=$('#bf-par');if(!sel)return;const ps=bfParams(),keep=sel.value,sw=S.tutMeta?.sweep;
 sel.innerHTML=ps.map(([k,n])=>`<option value="${esc(k)}">${esc(n)}</option>`).join('');const pref=sw?sw.comp+'.'+sw.param:'';
 if(ps.some(p=>p[0]===keep))sel.value=keep;else if(ps.some(p=>p[0]===pref)){sel.value=pref;$('#bf-from').value=sw.from;$('#bf-to').value=sw.to;$('#bf-n').value=sw.n;$('#bf-tr').value=sw.transient;$('#bf-rec').value=sw.record;if(sw.stat)$('#bf-stat').value=sw.stat;}
 else if(ps.length&&!$('#bf-from').value){const v=ps[0][2];$('#bf-from').value=+(v*.5).toPrecision(4);$('#bf-to').value=+(v*1.5).toPrecision(4);}}
// 3.15: one value = Scenario.bifPoint, the same as pcl's bifurcation (ROADMAP §30); in parallel on the pool of solver workers,
// or in order when the circuit has a Python block or workers are not available
async function runBifurcation(){if(BF.run||!S.sim||S.error)return;const [comp,param]=String($('#bf-par').value).split('.');const key=$('#bf-sig').value,stat=$('#bf-stat').value;
 const a=P.parseEng($('#bf-from').value),b=P.parseEng($('#bf-to').value),n=Math.max(2,Math.min(400,+$('#bf-n').value|0)),tr=Math.max(0,+$('#bf-tr').value|0),rec=Math.max(4,Math.min(400,+$('#bf-rec').value|0));
 const out=$('#bf-out');if(!comp||!key||!Number.isFinite(a)||!Number.isFinite(b)){out.innerHTML='<p class="muted small">Διάλεξε σήμα, παράμετρο και εύρος.</p>';return;}
 const base=project();BF.run=true;BF.pts=[];BF.meta={comp,param,key,stat,a,b,label:$('#bf-par').selectedOptions[0]?.textContent||param,u:MeasureUnit(key)};$('#bf-run').disabled=true;$('#bf-stop').disabled=false;const t0=performance.now();
 const spec={comp,param,key,stat,transient:tr,record:rec,hDiv:+$('#sim-step').value||100,method:$('#method').value};
 const vals=Array.from({length:n},(_,k)=>a+(b-a)*k/(n-1)),add=(v,r)=>BF.pts.push({v,y:r.y,q:Metrics.periodicity(r.y)});
 const par=window.Pool&&window.Worker&&n>2;let lastDraw=0;BF.par=par?(BF.pool||(BF.pool=new Pool.SimPool())).n:1;
 try{
  if(par){const got=new Array(n);
   await BF.pool.map(vals.map(v=>({action:'bifurcation',project:base,...spec,hdiv:spec.hDiv,values:[v]})),(i,o)=>{got[i]=o.points[0];
     BF.pts=[];got.forEach((r,k)=>{if(r)add(vals[k],r);});const now=performance.now();if(now-lastDraw>150){lastDraw=now;drawBifurcation(`${BF.pts.length}/${n} · ${fmt((now-t0)/1e3,3)} s · ${BF.par} workers`);}});}
  else for(let k=0;k<n&&BF.run;k++){const v=vals[k];add(v,Scenario.bifPoint(base,{...spec,value:+v.toPrecision(10)}));if(k%2===1||k===n-1){drawBifurcation(`${k+1}/${n} · ${fmt((performance.now()-t0)/1e3,3)} s`);await new Promise(res=>setTimeout(res,0));}}}
 catch(e){if(BF.run)out.innerHTML=`<p class="warn-text small">${esc(e.message)}</p>`;}
 finally{BF.run=false;$('#bf-run').disabled=false;$('#bf-stop').disabled=true;drawBifurcation(`${BF.pts.length} σημεία · ${fmt((performance.now()-t0)/1e3,3)} s${BF.par>1?` · ${BF.par} workers`:''}`);}}
function stopBifurcation(){BF.run=false;if(BF.pool)BF.pool.stop();}
function drawBifurcation(status){const out=$('#bf-out'),m=BF.meta;if(!out||!m||!BF.pts.length)return;const W=260,H=200,P=svgPlot(W,H,[34,6,6,22]);
 const ys=BF.pts.flatMap(p=>p.y);let lo=Math.min(...ys),hi=Math.max(...ys);const pd=(hi-lo)*.05||1;lo-=pd;hi+=pd;
 const dots=BF.pts.map(p=>p.y.map(y=>`<circle cx="${P.X(p.v,m.a,m.b).toFixed(1)}" cy="${P.Y(y,lo,hi).toFixed(1)}" r="1"/>`).join('')).join('');
 // first value of each new period (1T → 2T → 4T …) along the sweep
 const ch=[];for(let k=1;k<BF.pts.length;k++){const p0=BF.pts[k-1].q.period,p1=BF.pts[k].q.period;if(p1!==p0&&p1!==0||p1===0&&p0>0)ch.push([BF.pts[k].v,p1]);}
 const tk=[m.a,m.b].map(v=>`<text x="${P.X(v,m.a,m.b)}" y="${H-8}" text-anchor="middle">${fmt(v,3)}</text>`).join('')+[lo+pd,hi-pd].map(v=>`<text x="30" y="${P.Y(v,lo,hi)+3}" text-anchor="end">${fmt(v,3)}</text>`).join('');
 out.innerHTML=`<svg class="bfchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Διάγραμμα διακλάδωσης"><rect x="34" y="6" width="${W-40}" height="${H-28}" class="frame"/>${dots}${tk}<text x="${(W+34)/2}" y="${H-1}" text-anchor="middle">${esc(m.label)}</text></svg>
  <p class="muted small">${esc(status)} · ${BF.pts[0].y.length} δείγματα ανά τιμή μετά από μεταβατικό</p>
  ${ch.length?`<table class="kv"><tbody>${ch.map(([v,p])=>`<tr><td>από ${fmt(v,4)}</td><td>${p===0?'χωρίς περίοδο (χάος ή αργό μεταβατικό)':p+'T'}</td></tr>`).join('')}</tbody></table>`:''}`;}

function niceTop(v){const e=Math.pow(10,Math.floor(Math.log10(v))),m=v/e;return (m<=1?1:m<=2?2:m<=5?5:10)*e;}

// ------------------------------------------------------------------ server reference solver (SciPy)
function btStatus(text,kind=''){const el=$('#bt-status');el.innerHTML=text;el.className='bt-status '+kind;}
function parseStep(v){v=String(v||'').trim();if(!v)return 0;const m=v.match(/^T\s*\/\s*([\d.]+)$/i);if(m&&S.sim)return S.sim.T/+m[1];const x=P.parseEng(v);return Number.isFinite(x)&&x>0?x:NaN;}
async function runBatch(){
 if(!S.sim||S.error){btStatus('Το κύκλωμα δεν προσομοιώνεται.','err');return;}
 const keys=scope.channels().map(c=>c.key);if(!keys.length){btStatus('Πρόσθεσε πρώτα σήματα στο scope: αυτά θα υπολογίσει ο server.','err');return;}
 const tv=P.parseEng($('#bt-tend').value),tEnd=Number.isFinite(tv)&&tv>0?tv*1e-3:(S.sim.t>0?S.sim.t:S.stopT);
 if(!(tEnd>0)){btStatus('Δώσε διάρκεια ή τρέξε πρώτα την προσομοίωση: η σύγκριση γίνεται στο ίδιο διάστημα.','err');return;}
 const hmax=parseStep($('#bt-hmax').value);if(Number.isNaN(hmax)){btStatus('Μέγιστο βήμα: τιμή σε s (π.χ. 1u) ή «T/100».','err');return;}
 let req;try{req=MNA.exportForBatch(fullDoc(),keys);}catch(e){btStatus(esc(e.message),'err');return;}
 const method=$('#bt-method').value,rtol=P.parseEng($('#bt-rtol').value),atol=P.parseEng($('#bt-atol').value);
 $('#bt-run').disabled=true;btStatus(`Ο ${esc(method)} τρέχει στον server έως ${eng(tEnd,'s')}…`);const w0=performance.now();
 try{const r=await api('batch_sim',{net:req.net,channels:req.channels,t_end:tEnd,method,rtol:Number.isFinite(rtol)?rtol:1e-6,atol:Number.isFinite(atol)?atol:1e-9,max_step:hmax||0,max_points:30000});
  const data={};for(const k of Object.keys(r.ch))data[k]={t:Float64Array.from(r.t),y:Float64Array.from(r.ch[k],v=>v===null?NaN:v)};
  S.batch={r,data,skipped:req.skipped,label:`${method} (server, rtol ${eng(r.rtol)})`,stale:false};S.batchDiag=(r.diag||[]).map(d=>({...d,src:'server'}));renderDiag();
  scope.setRefs($('#bt-show').checked?{label:S.batch.label,data}:null);renderBatch();
  const st=r.stats;btStatus(`${r.status==='ok'?'✓':'⚠'} ${esc(method)}: ${st.points.toLocaleString('el-GR')} σημεία, ${st.segments.toLocaleString('el-GR')} τμήματα, ${st.diode_events.toLocaleString('el-GR')} μεταγωγές διόδων, ${st.nfev.toLocaleString('el-GR')} f, ${st.njev} J, ${st.nlu.toLocaleString('el-GR')} LU · ${fmt(st.wall_s,3)} s στον server (${fmt((performance.now()-w0)/1000,3)} s συνολικά)${r.message?'<br>'+esc(r.message):''}${req.skipped.length?'<br>Χωρίς αναφορά: '+req.skipped.map(esc).join(', '):''}`,r.status==='ok'?'':'err');}
 catch(e){btStatus('Σφάλμα: '+esc(e.message),'err');S.batchDiag=[{sev:'error',grp:'server',src:'server',id:null,msg:e.message,fix:''}];renderDiag();openDiag();}
 finally{$('#bt-run').disabled=false;}}
function clearBatch(){S.batch=null;scope.setRefs(S.csvRef||null);$('#bt-out').innerHTML='';btStatus('');}
// time-weighted mean of a piecewise-linear trace over exactly [a,b]
function meanPL(t,y,a,b){let s=0,pt=null,pv=0;const at=x=>{let lo=0,hi=t.length-1;if(x<=t[0])return y[0];if(x>=t[hi])return y[hi];while(hi-lo>1){const m=(lo+hi)>>1;if(t[m]<=x)lo=m;else hi=m;}return t[hi]>t[lo]?y[lo]+(y[hi]-y[lo])*(x-t[lo])/(t[hi]-t[lo]):y[hi];};
 pt=a;pv=at(a);for(let i=0;i<t.length;i++){if(t[i]<=a)continue;if(t[i]>=b)break;s+=(t[i]-pt)*(pv+y[i])/2;pt=t[i];pv=y[i];}s+=(b-pt)*(pv+at(b))/2;return b>a?s/(b-a):NaN;}
function ringTrace(ci){const r=S.sim.ring,st=(r.head-r.n+r.cap)%r.cap,t=new Float64Array(r.n),y=new Float64Array(r.n);for(let i=0;i<r.n;i++){const j=(st+i)%r.cap;t[i]=r.t[j];y[i]=ci===-2?0:r.d[j*r.nch+ci];}return {t,y};}
// difference table between reference traces {key:{t,y}} (server solver or CSV) and the browser run
function compareHTML(data,label,note){if(!S.sim)return '';const T=S.sim.T;const rows=[];let common=null;
 for(const ch of scope.channels()){const d=data[ch.key];if(!d||d.t.length<2)continue;const ci=scope.resolve(ch.key);if(ci===-1)continue;const js=ringTrace(ci);if(js.t.length<2)continue;
  const a=Math.max(d.t[0],js.t[0]),b=Math.min(d.t[d.t.length-1],js.t[js.t.length-1]);if(!(b>a))continue;common=common?[Math.min(common[0],a),Math.max(common[1],b)]:[a,b];
  const a1=Math.max(a,b-T);const mb=meanPL(d.t,d.y,a1,b),mj=meanPL(js.t,js.y,a1,b);
  const diffs=[];let sq=0,n=0,scale=0;for(let i=0;i<d.t.length;i++){const t=d.t[i];if(t<a||t>b||!Number.isFinite(d.y[i]))continue;const e=scope.valueAt(ci,t)-d.y[i];if(!Number.isFinite(e))continue;diffs.push(Math.abs(e));sq+=e*e;n++;scale=Math.max(scale,Math.abs(d.y[i]));}
  diffs.sort((x,y)=>x-y);const p95=diffs.length?diffs[Math.floor(.95*(diffs.length-1))]:NaN,u=MeasureUnit(ch.key);
  const dp=Number.isFinite(mb)&&Math.abs(mb)>1e-12*Math.max(scale,1)?100*(mj-mb)/Math.abs(mb):NaN;
  rows.push(`<tr><td><i class="dot" style="background:${ch.color}"></i>${esc(ch.label)}</td><td>${eng(mb,u)}</td><td>${eng(mj,u)}</td><td class="${Math.abs(dp)<.1?'good':Math.abs(dp)<1?'':'warn-text'}">${Number.isFinite(dp)?fmt(dp,3)+' %':'—'}</td><td>${eng(Math.sqrt(sq/Math.max(n,1)),u)}</td><td>${eng(p95,u)}</td><td>${fmt(100*Math.sqrt(sq/Math.max(n,1))/Math.max(scale,1e-12),3)} %</td></tr>`);}
 return rows.length?`<h4>Σύγκριση με ${esc(label)}</h4><div class="wrap"><table><thead><tr><th>Σήμα</th><th>⟨αναφορά⟩ τελ. T</th><th>⟨browser⟩ τελ. T</th><th>Διαφορά</th><th>RMS Δ</th><th>95 % |Δ|</th><th>RMS Δ / max</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>
  <p class="muted small">Κοινό διάστημα ${eng(common[0],'s')} … ${eng(common[1],'s')}. ${note||''}</p>`:'';}
function renderBatch(){const box=$('#bt-out');const B=S.batch;if(!B||!S.sim){box.innerHTML='';return;}const r=B.r;
 const html=compareHTML(B.data,B.label,`Ο browser λύνει με ${S.sim.var?`μεταβλητό βήμα (ανοχή ${S.sim.rtol}, ${eng(S.sim.hMin,'s')} … ${eng(S.sim.hCap||S.sim.hMax,'s')})`:`σταθερό βήμα Δt = ${eng(S.sim.h,'s')}`} (${esc($('#method').selectedOptions[0]?.textContent||'')}), ο server με μεταβλητό βήμα και έλεγχο σφάλματος. Κοντά στις μεταγωγές το |Δ| είναι μεγάλο αν οι δύο λύτες βρίσκουν την ακμή σε λίγο διαφορετική στιγμή· γι' αυτό δίνεται το RMS και το 95 %.${B.stale?' <b>Το κύκλωμα άλλαξε μετά τον υπολογισμό.</b>':''}`);
 box.innerHTML=(html||`<p class="muted small">Δεν υπάρχει κοινό διάστημα με την προσομοίωση του browser: τρέξε την προσομοίωση έως ${eng(r.t_end,'s')} (⏩).</p>`)+sampleCompareHTML(r);}
// ------------------------------------------------------------------ CSV reference (PLECS, measurements, older runs)
// first column time, one signal per column, optional header row; ',' ';' or tab separated
function parseCSV(text){const lines=String(text).split(/\r?\n/).filter(l=>l.trim());if(lines.length<2)throw Error('Το αρχείο έχει λιγότερες από δύο γραμμές.');
 const head=lines[0],sep=[';','\t',','].map(c=>[c,head.split(c).length]).sort((a,b)=>b[1]-a[1])[0][0];
 const cells=l=>l.split(sep).map(x=>x.trim().replace(/^"(.*)"$/,'$1'));const comma=sep!==',';
 const num=x=>{if(x==='')return NaN;const v=Number(comma?x.replace(',','.'):x);return v;};
 const first=cells(lines[0]),hasHead=first.some(x=>x!==''&&!Number.isFinite(num(x)));
 const names=hasHead?first.map(x=>x.replace(/\s*\[[^\]]*\]\s*$/,'')):first.map((_,i)=>i?'στήλη '+i:'time');
 const body=lines.slice(hasHead?1:0).map(cells).filter(r=>Number.isFinite(num(r[0])));if(body.length<2)throw Error('Δεν βρέθηκαν αριθμητικές γραμμές.');
 const nc=names.length,t=Float64Array.from(body,r=>num(r[0]));for(let i=1;i<t.length;i++)if(!(t[i]>=t[i-1]))throw Error(`Ο χρόνος δεν αυξάνει στη γραμμή ${i+1+(hasHead?1:0)}.`);
 const cols=[];for(let c=1;c<nc;c++)cols.push(Float64Array.from(body,r=>num(r[c])));return {names:names.slice(1),t,cols};}
const normName=x=>String(x||'').toLowerCase().replace(/\[[^\]]*\]/g,'').replace(/[^a-z0-9α-ωάέήίόύώϊϋΐΰ]+/g,'');
function renderCsvMap(){const box=$('#cr-map'),C=S.csv;if(!C){box.innerHTML='';return;}const ch=scope.channels();
 const auto=nm=>{const n=normName(nm);return ch.find(c=>normName(c.label)===n||normName(c.key)===n)?.key||'';};
 box.innerHTML=`<table class="cr-table"><thead><tr><th>Στήλη CSV</th><th>Σήμα του scope</th></tr></thead><tbody>${C.names.map((nm,i)=>{const sel=C.map?.[i]??auto(nm);
  return `<tr><td>${esc(nm)}</td><td><select data-crmap="${i}"><option value="">—</option>${ch.map(c=>`<option value="${esc(c.key)}" ${c.key===sel?'selected':''}>${esc(c.label)}</option>`).join('')}</select></td></tr>`;}).join('')}</tbody></table>
  <div class="row-btns"><button id="cr-apply" class="strong">Εφαρμογή</button></div>`;
 C.map=C.names.map((nm,i)=>C.map?.[i]??auto(nm));
 $$('#cr-map [data-crmap]').forEach(el=>el.onchange=()=>{C.map[+el.dataset.crmap]=el.value;});$('#cr-apply').onclick=applyCsv;}
function applyCsv(){const C=S.csv;if(!C)return;const sh=(P.parseEng($('#cr-shift').value)||0)*1e-3,sc=+$('#cr-tscale').value||1;const data={};let n=0;
 C.map.forEach((key,i)=>{if(!key)return;data[key]={t:Float64Array.from(C.t,x=>x*sc+sh),y:C.cols[i]};n++;});
 if(!n){$('#cr-status').innerHTML='Αντιστοίχισε τουλάχιστον μία στήλη σε σήμα του scope.';$('#cr-status').className='bt-status err';return;}
 S.csvRef={label:'CSV · '+C.file,data};scope.setRefs(S.csvRef);renderCsv();
 $('#cr-status').innerHTML=`✓ ${n} ${n===1?'σήμα':'σήματα'} από ${C.t.length.toLocaleString('el-GR')} γραμμές (${eng(C.t[0]*sc+sh,'s')} … ${eng(C.t[C.t.length-1]*sc+sh,'s')}).`;$('#cr-status').className='bt-status';}
function renderCsv(){const box=$('#cr-out');if(!box)return;const R=S.csvRef;if(!R||!S.sim){box.innerHTML='';return;}
 box.innerHTML=compareHTML(R.data,R.label,'Η αναφορά από το CSV σχεδιάζεται διακεκομμένη. Για σύγκριση με PLECS χρησιμοποίησε ίδιες παραμέτρους, αρχικές συνθήκες και πρόσημα ρευμάτων.')||'<p class="muted small">Δεν υπάρχει κοινό διάστημα με την προσομοίωση: τρέξε την προσομοίωση στο διάστημα του CSV.</p>';}
function clearCsv(){S.csv=null;S.csvRef=null;scope.setRefs(S.batch&&$('#bt-show').checked?{label:S.batch.label,data:S.batch.data}:null);$('#cr-map').innerHTML='';$('#cr-out').innerHTML='';$('#cr-status').innerHTML='';}
// Sample & Hold: the same sampling instants and values in both solvers (event-level check)
function sampleCompareHTML(r){const out=[];for(const [id,sv] of Object.entries(r.samples||{})){const js=S.sim.samples(id);if(!js)continue;const tEnd=Math.min(r.t_end,S.sim.t)+1e-12;
  const a=sv.t.map((t,i)=>[t,sv.v[i]]).filter(x=>x[0]<=tEnd),b=js.t.map((t,i)=>[t,js.v[i]]).filter(x=>x[0]<=tEnd&&x[0]>=(js.t[0]??0));
  const off=b.length&&a.length?a.findIndex(x=>Math.abs(x[0]-b[0][0])<1e-9*S.sim.T+1e-15):-1;const A=off>=0?a.slice(off):a,n=Math.min(A.length,b.length);let dt=0,dv=0,sc=0;
  for(let i=0;i<n;i++){dt=Math.max(dt,Math.abs(A[i][0]-b[i][0]));if(Number.isFinite(A[i][1])&&Number.isFinite(b[i][1])){dv=Math.max(dv,Math.abs(A[i][1]-b[i][1]));sc=Math.max(sc,Math.abs(A[i][1]));}}
  const u=S.sim.shById.get(id)?.qty==='V'?'V':'A';
  out.push(`<tr><td>${esc(editor.comp(id)?.label||id)}</td><td>${a.length}</td><td>${b.length}${off>0?` (από το #${off+1})`:''}</td><td>${eng(dt,'s')}</td><td>${eng(dv,u)}</td><td>${sc?fmt(100*dv/sc,3)+' %':'—'}</td></tr>`);}
 return out.length?`<h4>Δείγματα Sample & Hold</h4><div class="wrap"><table><thead><tr><th>Μπλοκ</th><th>δείγματα server</th><th>δείγματα browser</th><th>max |Δt|</th><th>max |Δ τιμής|</th><th>/ max</th></tr></thead><tbody>${out.join('')}</tbody></table></div><p class="muted small">Ίδιες στιγμές δειγματοληψίας (από το φέρον) και ίδια τιμή του ρεύματος τη στιγμή του δείγματος στους δύο λύτες.</p>`:'';}

// ------------------------------------------------------------------ live parameters (panel over the scope)
// They change the running simulation without a pause: D, m, α and the PI reference at the next step,
// the carrier phase from the next carrier period, the sampling rule from the next trigger. Every
// change is kept with its simulation time, drawn on the scope, and D / reference changes can be
// turned into a t:value program, so pressing ⟲ replays the same run.
function liveChange(id,k,v,label,from){const s=S.sim;if(!s||!(s.t>0))return;const L=s.changes||(s.changes=[]);const last=L[L.length-1];
 if(last&&last.id===id&&last.k===k&&s.t-last.t<=s.T*1.0001){last.v=v;last.label=label;}else s.markChange({id,k,v,label,from});renderLiveLog();if(!S.running)draw(true);}
function renderLiveLog(){const box=$('#lp-log');if(!box)return;const L=S.sim?.changes||[];
 if(!L.length){box.innerHTML='<small class="muted">Οι αλλαγές που κάνεις όσο τρέχει η προσομοίωση σημειώνονται στο scope.</small>';return;}
 const rep=L.some(c=>c.k==='D'||c.k==='ref'||c.k==='v');
 box.innerHTML=`<div class="lp-log-head"><b>${L.length} ${L.length===1?'αλλαγή':'αλλαγές'}</b>${rep?'<button id="lp-sched" title="Οι αλλαγές του D και της αναφοράς γίνονται πρόγραμμα t:τιμή: με ⟲ ξαναπαίζεται η ίδια προσομοίωση">→ πρόγραμμα t:τιμή</button>':''}</div>
  <ol>${L.slice(-5).map(c=>`<li><span>${eng(c.t,'s',4)}</span> ${esc(c.label)}</li>`).join('')}</ol>`;
 $('#lp-sched')?.addEventListener('click',changesToSchedule);}
function changesToSchedule(){const L=(S.sim?.changes||[]).filter(c=>c.k==='D'||c.k==='ref'||c.k==='v');if(!L.length)return;const by=new Map();
 for(const c of L){const key=c.id+'|'+c.k;if(!by.has(key))by.set(key,[]);by.get(key).push(c);}
 const f=v=>+(+v).toPrecision(8);
 for(const [key,list] of by){const [id,k]=key.split('|');const comp=editor.comp(id);if(!comp)continue;const base=(P.parseSched(list[0].from)||[]).filter(([t])=>t<list[0].t-1e-15);
  const prog=[...base,...list.map(c=>[c.t,c.v])].map(([t,v])=>`${+t.toPrecision(9)}:${f(v)}`).join(', ');
  editor.setParams(id,k==='D'?{dsched:prog,D:f((base.length?base:[[0,list[0].v]])[0][1])}:k==='v'?{v:prog}:{ref:prog});}
 notice('Οι αλλαγές έγιναν πρόγραμμα t:τιμή στο '+[...by.keys()].map(k=>esc(k.split('|')[0])).join(', ')+'. Πάτα ⟲ για να ξαναπαίξει η ίδια προσομοίωση.','info');}
function updateLivePanel(){const s=S.sim;if(!s||$('#live-panel')?.hidden)return;
 for(const el of $$('#live-controls [data-shout]')){const q=s.shById.get(el.dataset.shout);if(!q){el.textContent='';continue;}const u=q.qty==='V'?'V':'A',lt=q.log.t[q.log.t.length-1];
  el.innerHTML=`h = <b>${eng(q.h,u,5)}</b> · ${q.n} δείγματα${Number.isFinite(lt)?` · τελευταίο ${eng(lt,'s',5)}`:''}`;}
 for(const el of $$('#live-controls [data-kout]')){const v=s.now('Y:'+el.dataset.kout);el.textContent=Number.isFinite(v)?eng(v,'',5):'';}
 for(const el of $$('#live-controls [data-dnow]')){const v=s.now('D:'+el.dataset.dnow);el.textContent=Number.isFinite(v)?'D = '+fmt(v,5):'';}}
function setLivePanel(show){const pnl=$('#live-panel'),btn=$('#lp-toggle');if(!pnl)return;pnl.hidden=!show;btn?.classList.toggle('on',show);btn?.setAttribute('aria-pressed',String(show));
 try{localStorage.setItem('pcl2-live-panel',show?'1':'0');}catch{}if(show)updateLivePanel();}
// switches driven by one PWM block, the main output (g) first
function switchesOf(pwmId){const o={a:0,na:1,b:2,nb:3};return editor.doc.components.filter(c=>(c.type==='SW'&&(c.params?.gate||'pwm')==='pwm'||c.type==='SCR'&&c.params?.fire==='pwm')&&c.params?.pwm===pwmId)
 .sort((x,y)=>(o[x.params.out||'a']??0)-(o[y.params.out||'a']??0)||x.id.localeCompare(y.id,undefined,{numeric:true}));}
// gate pulses to the scope, in a pane of their own (drawn as stacked lanes)
function addPulses(keys){if(!S.sim||!keys.length)return;const panes=scope.cfg.panes;let pi=panes.findIndex(p=>p.ch.length&&p.ch.every(ch=>Scope.isLogic(ch.key)));
 if(pi<0)pi=panes.length===1&&!panes[0].ch.length?0:Math.min(panes.length,3);let any=false;for(const k of keys)any=scope.addChannel(k,chanLabel(k),pi)||any;renderChannels();flash(any?'#scope-card':'#chan-list');draw(true);}
function pulseKeys(pwmId){const sw=switchesOf(pwmId);return sw.length?sw.map(c=>'GS:'+c.id):['G:'+pwmId];}
function refreshControls(){
 const box=$('#live-controls');if(!box)return;
 if(!atTop()){box.innerHTML='<div class="muted small">Μέσα σε υποκύκλωμα. Οι ζωντανές παράμετροι του κυκλώματος φαίνονται όταν βγεις (↑ στη γραμμή πάνω από το σχέδιο).</div>';renderLiveLog();updateLivePanel();return;}const pw=editor.doc.components.filter(c=>c.type==='PWM');const meta=S.tutMeta||{};
 const phase=(c,p)=>{if(p.mode==='spwm')return '';const ph=((+p.phase||0)%360+360)%360;
  return `<div class="ctl-sub"><label>φέρον ${p.carrier==='saw'&&p.mode!=='pp'?'πριονωτό':'τριγωνικό'} · φ <output data-phout="${c.id}">${fmt(ph,4)}° · ${eng(ph/360/(+p.fs||1),'s',3)}</output></label>
   <input type="range" min="0" max="360" step="1" value="${ph}" data-ph="${c.id}"><div class="ctl-btns">${[0,90,180,270].map(d=>`<button data-phset="${c.id}" data-val="${d}">${d}°</button>`).join('')}</div></div>`;};
 // several open-loop PWMs (e.g. interleaved legs): one D for all, and in-phase / shifted by k·T/N
 const fixedPw=pw.filter(c=>({...P.defaults('PWM'),...c.params}).mode==='fixed').sort((a,b)=>a.id.localeCompare(b.id,undefined,{numeric:true}));
 const phasePw=pw.filter(c=>({...P.defaults('PWM'),...c.params}).mode!=='spwm').sort((a,b)=>a.id.localeCompare(b.id,undefined,{numeric:true}));
 let group='';if(phasePw.length>=2){const p0={...P.defaults('PWM'),...(fixedPw[0]||phasePw[0]).params};
  group=`<div class="ctl ctl-group">${fixedPw.length>=2?`<label>Όλα τα PWM (${fixedPw.length}) · D <output data-dallout>${fmt(+p0.D,4)}</output></label><input type="range" min="0" max="1" step="0.0005" value="${+p0.D}" data-dall aria-label="Κοινό D">`:`<label>Όλα τα PWM (${phasePw.length}) · φάσεις</label>`}
   <div class="ctl-btns"><button data-ilv="common" title="Ίδια φάση σε όλα τα φέροντα">Συμφασικά</button><button data-ilv="shift" title="Το k-οστό φέρον καθυστερεί k·T/N">Μετατοπισμένα k·T/N</button></div><small>Η φάση κάθε φέροντος αλλάζει από την επόμενη περίοδό του.</small><div class="ctl-btns ctl-probe"><button data-pulse-all title="Ένας παλμός ανά PWM (η κύρια έξοδος g), ο καθένας στη δική του λωρίδα">⌁ παλμοί όλων (${phasePw.length})</button></div></div>`;}
 const per=pw.map(c=>{const p={...P.defaults('PWM'),...c.params};let h='';
  if(p.mode==='fixed'||p.mode==='pp')h=`<label>${esc(c.label||c.id)} · D <output data-dout="${c.id}">${fmt(+p.D,4)}</output></label><input type="range" min="0" max="1" step="0.0005" value="${+p.D}" data-d="${c.id}">
   <div class="ctl-btns"><button data-dd="${c.id}" data-step="-0.01">−0,01</button><button data-dd="${c.id}" data-step="-0.001">−0,001</button>${meta.D0!==undefined?`<button data-dset="${c.id}" data-val="${meta.D0}">D₀ = ${fmt(meta.D0,4)}</button>`:''}<button data-dd="${c.id}" data-step="0.001">+0,001</button><button data-dd="${c.id}" data-step="0.01">+0,01</button></div>${p.dsched?'<small>Υπάρχει πρόγραμμα D(t)· η χειροκίνητη αλλαγή το απενεργοποιεί.</small>':''}`;
  else if(p.mode==='pi')h=`<label>${esc(c.label||c.id)} · αναφορά ${+p.Kd?'PID':'PI'} <output data-dnow="${c.id}"></output></label><div class="ctl-row"><input data-ref="${c.id}" value="${esc(p.ref)}"><button data-refapply="${c.id}">Εφαρμογή</button></div><small>Σταθερή τιμή ή πρόγραμμα «t:τιμή». K_p = ${eng(+p.Kp)}, K_i = ${eng(+p.Ki)}${+p.Kd?`, K_d = ${eng(+p.Kd)}`:''}.${editor.comp(p.sensor)?.type==='SH'?` Μετρά το δείγμα του ${esc(editor.comp(p.sensor).label||p.sensor)}.`:''}</small>`;
  else if(p.mode==='ext')h=`<label>${esc(c.label||c.id)} · D από σήμα <output data-dnow="${c.id}"></output></label><small>Το duty έρχεται από τον ακροδέκτη d${p.upd==='double'&&p.carrier!=='saw'?' (δύο ενημερώσεις ανά T)':''}.</small>`;
  else if(p.mode==='spwm')h=`<label>${esc(c.label||c.id)} · m <output data-mout="${c.id}">${fmt(+p.m,3)}</output></label><input type="range" min="0" max="1.2" step="0.01" value="${+p.m}" data-m="${c.id}">`;
  const sw=switchesOf(c.id);const probe=`<div class="ctl-btns ctl-probe"><button data-probe-d="${c.id}" title="Το duty D στο scope">⌁ D</button><button data-pulse="${c.id}" title="${sw.length?'Ο παλμός πύλης κάθε διακόπτη: '+esc(sw.map(x=>x.label||x.id).join(', ')):'Ο παλμός g του PWM'}">⌁ παλμ${sw.length>1?'οί':'ός'} ${esc(sw.length?sw.map(x=>x.label||x.id).join(', '):'g')}</button></div>`;
  return `<div class="ctl">${h}${probe}${phase(c,p)}</div>`;}).join('');
 box.innerHTML=group+(pw.length>=3?`<details class="ctl-more"><summary>Ανά PWM (${pw.length})</summary>${per}</details>`:per);
 const trigOpts=P.PARTS.SH.params.find(d=>d.k==='trig').options;
 box.innerHTML+=editor.doc.components.filter(c=>c.type==='SH').map(c=>{const p={...P.defaults('SH'),...c.params};
  const short={start:'Αρχή περιόδου (reset ή μέγιστο) · 1/T',mid:'Μέσο περιόδου (ελάχιστο τριγώνου) · 1/T',both:'Και τα δύο ακρότατα · 2/T'};
  return `<div class="ctl ctl-sh"><label>${esc(c.label||c.id)} · Sample & Hold</label><select data-trig="${c.id}" aria-label="Πότε παίρνει δείγμα">${trigOpts.map(([k,n])=>`<option value="${k}" title="${esc(n)}" ${p.trig===k?'selected':''}>${esc(short[k]||n)}</option>`).join('')}</select><div class="lp-read" data-shout="${c.id}"></div></div>`;}).join('');
 // constants / programs of signal blocks: changed live, like the reference of the built-in PI
 box.innerHTML+=editor.doc.components.filter(c=>c.type==='CONST').sort((a,b)=>a.id.localeCompare(b.id,undefined,{numeric:true})).map(c=>{const p={...P.defaults('CONST'),...c.params};
  return `<div class="ctl"><label>${esc(c.label||c.id)} · σταθερά <output data-kout="${c.id}"></output></label><div class="ctl-row"><input data-kv="${c.id}" value="${esc(p.v)}"><button data-kapply="${c.id}">Εφαρμογή</button></div></div>`;}).join('');
 const scr=editor.doc.components.filter(c=>c.type==='SCR'&&(c.params?.fire||'alpha')==='alpha');
 if(scr.length){const a=+(scr[0].params?.alpha??30);box.innerHTML+=`<div class="ctl"><label>Θυρίστορ (${scr.length}) · α <output data-aout>${fmt(a,4)}°</output></label><input type="range" min="0" max="180" step="0.5" value="${a}" data-alpha><small>Ίδια γωνία έναυσης σε όλα· η μετατόπιση του καθενός μένει.</small></div>`;}
 // parameters pinned with 📌 in the parameters panel (3.7): a slider a decade each way around a base value, and the exact value
 const pinned=editor.doc.components.filter(c=>Array.isArray(c.live)&&c.live.length);
 box.innerHTML+=pinned.map(c=>c.live.map(k=>{const d=partDef(c)?.params.find(x=>x.k===k);if(!d||d.type!=='num')return '';const v=numOf(c.params[k]??d.def),m=pinMap(c,k),key=c.id+'|'+k;
  return `<div class="ctl ctl-pin"><label>${esc(c.label||c.id)} · ${esc(d.label)} <output data-pout="${esc(key)}">${eng(v,d.unit||'',4)}</output></label><input type="range" min="0" max="${PSL}" step="1" value="${pinX(m,v)}" data-pr="${esc(key)}" aria-label="${esc((c.label||c.id)+' '+d.label)}">
   <div class="ctl-row"><input data-pv="${esc(key)}" value="${esc(P.eng(v,'',6).replace(/\s/g,''))}" inputmode="decimal" aria-label="τιμή"><button data-pc="${esc(key)}" title="Ο ρυθμιστής γύρω από την τρέχουσα τιμή (×0,1 … ×10)">⟲</button><button data-pu="${esc(key)}" title="Αφαίρεση από τις ζωντανές παράμετροι">✕</button></div></div>`;}).join('')).join('');
 if(!box.innerHTML)box.innerHTML='<div class="muted small">Χωρίς μπλοκ PWM, Sample & Hold ή θυρίστορ. Με 📌 στο πάνελ παραμέτρων μπαίνει εδώ οποιαδήποτε αριθμητική παράμετρος.</div>';
 const al=box.querySelector('[data-alpha]');if(al){const setA=(commit)=>{const a=+al.value,from=scr[0].params?.alpha;for(const c of scr)c.params.alpha=a;S.sim?.setFiring(a);box.querySelector('[data-aout]').textContent=fmt(a,4)+'°';editor.renderLabels();liveChange('SCR','alpha',a,`α → ${fmt(a,4)}°`,String(from));if(commit){saveLocal();if(S.theory)renderTheory();}};al.oninput=()=>setA(false);al.onchange=()=>setA(true);}
 const setD=(id,d,commit)=>{d=Math.min(1,Math.max(0,d));const c=editor.comp(id);if(!c)return;const from=c.params.dsched||String(c.params.D??P.defaults('PWM').D);c.params.D=+d.toFixed(6);if(c.params.dsched){c.params.dsched='';S.sim?.setControl(id,{dsched:null});}S.sim?.setControl(id,{D:c.params.D});
  const o=box.querySelector(`[data-dout="${id}"]`);if(o)o.textContent=fmt(d,4);const r=box.querySelector(`[data-d="${id}"]`);if(r&&commit)r.value=d;editor.renderLabels();editor.updateLive();liveChange(id,'D',c.params.D,`${c.label||id}: D → ${fmt(c.params.D,4)}`,from);if(commit)saveLocal();};
 $$('#live-controls [data-d]').forEach(r=>{r.oninput=()=>setD(r.dataset.d,+r.value,false);r.onchange=()=>setD(r.dataset.d,+r.value,true);});
 $$('#live-controls [data-dd]').forEach(b=>b.onclick=()=>{const c=editor.comp(b.dataset.dd);setD(b.dataset.dd,(+c.params.D||0)+(+b.dataset.step),true);});
 $$('#live-controls [data-dset]').forEach(b=>b.onclick=()=>setD(b.dataset.dset,+b.dataset.val,true));
 $$('#live-controls [data-m]').forEach(r=>r.oninput=()=>{const c=editor.comp(r.dataset.m);const from=String(c.params.m);c.params.m=+r.value;S.sim?.setControl(r.dataset.m,{m:+r.value});box.querySelector(`[data-mout="${r.dataset.m}"]`).textContent=fmt(+r.value,3);liveChange(r.dataset.m,'m',+r.value,`${c.label||c.id}: m → ${fmt(+r.value,3)}`,from);});
 $$('#live-controls [data-kapply]').forEach(b=>{const id=b.dataset.kapply,inp=box.querySelector(`[data-kv="${id}"]`);const go=()=>{const v=inp.value.trim();
   // a vector constant (3.18): one program per element; the same number of elements changes them live, another number rebuilds
   if(v.includes(';')){const parts=v.split(';').map(x=>x.trim()),sc=parts.map(x=>P.parseSched(x));if(sc.some(x=>!x)){inp.classList.add('bad');return;}inp.classList.remove('bad');
    const c=editor.comp(id),nv=parts.join('; ');if(vecN(id)!==parts.length){editor.setParams(id,{v:nv});return;}
    c.params.v=nv;sc.forEach((q,k)=>S.sim?.setBlock(id+'['+(k+1)+']',{sched:q}));editor.renderPart(c);editor.renderLabels();saveLocal();if(S.theory)renderTheory();return;}
   const sch=P.parseSched(v);if(!sch){inp.classList.add('bad');return;}inp.classList.remove('bad');if(vecN(id)>1){editor.setParams(id,{v});return;}
   const c=editor.comp(id),from=c.params.v;c.params.v=v;S.sim?.setBlock(id,{sched:sch});editor.renderPart(c);editor.renderLabels();if(!v.includes(':'))liveChange(id,'v',sch[0][1],`${c.label||id} → ${eng(sch[0][1])}`,from);saveLocal();if(S.theory)renderTheory();};
  b.onclick=go;inp.onkeydown=e=>{if(e.key==='Enter')go();};});
 $$('#live-controls [data-refapply]').forEach(b=>b.onclick=()=>{const id=b.dataset.refapply,v=box.querySelector(`[data-ref="${id}"]`).value,sch=P.parseSched(v);if(!sch){notice('Μη έγκυρη αναφορά.','error');return;}
  const c=editor.comp(id),from=c.params.ref;c.params.ref=v;S.sim?.setControl(id,{ref:sch});if(!v.includes(':'))liveChange(id,'ref',sch[0][1],`${c.label||id}: αναφορά → ${eng(sch[0][1])}`,from);saveLocal();});
 const setPh=(id,deg,commit)=>{const c=editor.comp(id);if(!c)return;deg=((deg%360)+360)%360;const from=String(c.params.phase??0);c.params.phase=deg;S.sim?.setControl(id,{phase:deg/360});
  const o=box.querySelector(`[data-phout="${id}"]`);if(o)o.textContent=`${fmt(deg,4)}° · ${eng(deg/360/(+c.params.fs||P.defaults('PWM').fs),'s',3)}`;const r=box.querySelector(`[data-ph="${id}"]`);if(r&&commit)r.value=deg;
  editor.renderLabels();liveChange(id,'phase',deg,`${c.label||id}: φ → ${fmt(deg,4)}° (από την επόμενη περίοδο)`,from);if(commit){saveLocal();if(S.theory)renderTheory();}};
 $$('#live-controls [data-ph]').forEach(r=>{r.oninput=()=>setPh(r.dataset.ph,+r.value,false);r.onchange=()=>setPh(r.dataset.ph,+r.value,true);});
 $$('#live-controls [data-phset]').forEach(b=>b.onclick=()=>setPh(b.dataset.phset,+b.dataset.val,true));
 const dall=box.querySelector('[data-dall]');if(dall){const f=commit=>{for(const c of fixedPw)setD(c.id,+dall.value,commit);box.querySelector('[data-dallout]').textContent=fmt(+dall.value,4);};dall.oninput=()=>f(false);dall.onchange=()=>f(true);}
 $$('#live-controls [data-probe-d]').forEach(b=>b.onclick=()=>addProbe('D:'+b.dataset.probeD));
 $$('#live-controls [data-pulse]').forEach(b=>b.onclick=()=>addPulses(pulseKeys(b.dataset.pulse)));
 box.querySelector('[data-pulse-all]')?.addEventListener('click',()=>addPulses(phasePw.map(c=>pulseKeys(c.id)[0])));
 $$('#live-controls [data-ilv]').forEach(b=>b.onclick=()=>{const n=phasePw.length;phasePw.forEach((c,k)=>setPh(c.id,b.dataset.ilv==='shift'?+(360*k/n).toFixed(6):0,true));});
 $$('#live-controls [data-trig]').forEach(el=>el.onchange=()=>{const id=el.dataset.trig,c=editor.comp(id);if(!c)return;const from=c.params.trig;c.params.trig=el.value;S.sim?.setHold(id,{trig:el.value});editor.renderLabels();
  liveChange(id,'trig',el.value,`${c.label||id}: ${el.selectedOptions[0].textContent.split(' (')[0].split(' · ')[0]}`,from);saveLocal();if(S.theory)renderTheory();});
 const pinNow=(key,v,commit)=>{const [id,k]=key.split('|');const c=editor.comp(id);const d=c&&partDef(c)?.params.find(x=>x.k===k);if(!c||!d||!Number.isFinite(v))return;
  const nv=+v.toPrecision(6);if(commit&&!S.pinDrag&&numOf(c.params[k]??d.def)===nv)return; // the same value again (e.g. change on blur after Enter)
  const from=String(c.params[k]??d.def);if(!S.pinDrag){editor.remember();S.pinDrag=true;}c.params[k]=nv;liveApply();editor.renderPart(c);editor.renderLabels();
  const o=box.querySelector(`[data-pout="${CSS.escape(key)}"]`);if(o)o.textContent=eng(c.params[k],d.unit||'',4);const t=box.querySelector(`[data-pv="${CSS.escape(key)}"]`);if(t&&document.activeElement!==t)t.value=P.eng(c.params[k],'',6).replace(/\s/g,'');
  liveChange(id,k,c.params[k],`${c.label||id}: ${d.label} → ${eng(c.params[k],d.unit||'',4)}`,from);
  if(commit){S.pinDrag=false;saveLocal();renderProps();if(S.theory)renderTheory();scheduleMath();}};
 // while dragging, one reload per frame
 const pinSet=(key,v,commit)=>{if(commit){cancelAnimationFrame(S.pinRaf||0);S.pinRaf=0;pinNow(key,v,true);return;}S.pinPend=[key,v];if(!S.pinRaf)S.pinRaf=requestAnimationFrame(()=>{S.pinRaf=0;const q=S.pinPend;S.pinPend=null;if(q)pinNow(q[0],q[1],false);});};
 $$('#live-controls [data-pr]').forEach(r=>{const key=r.dataset.pr,[id,k]=key.split('|');const val=()=>pinV(pinMap(editor.comp(id),k),+r.value);r.oninput=()=>pinSet(key,val(),false);r.onchange=()=>pinSet(key,val(),true);});
 $$('#live-controls [data-pv]').forEach(inp=>{const go=()=>{const v=P.parseEng(inp.value);if(!Number.isFinite(v)){inp.classList.add('bad');return;}inp.classList.remove('bad');pinSet(inp.dataset.pv,v,true);
   const [id,k]=inp.dataset.pv.split('|'),r=box.querySelector(`[data-pr="${CSS.escape(inp.dataset.pv)}"]`);if(r)r.value=pinX(pinMap(editor.comp(id),k),v);};inp.onchange=go;inp.onkeydown=e=>{if(e.key==='Enter')go();};});
 $$('#live-controls [data-pc]').forEach(b=>b.onclick=()=>{const [id,k]=b.dataset.pc.split('|');const c=editor.comp(id);if(!c)return;c.liveBase={...(c.liveBase||{}),[k]:numOf(c.params[k])};saveLocal();refreshControls();});
 $$('#live-controls [data-pu]').forEach(b=>b.onclick=()=>{const [id,k]=b.dataset.pu.split('|');togglePin(id,k);});
 renderLiveLog();updateLivePanel();
}
// slider of a pinned parameter: logarithmic over [b/10, 10·b] for a positive base b, else linear around it
const PSL=1000;
function pinMap(c,k){const d=partDef(c)?.params.find(x=>x.k===k);const b=c.liveBase?.[k]??numOf(c.params[k]??d?.def);return b>0?{log:true,lo:b/10,hi:b*10}:{log:false,lo:b-Math.max(1,Math.abs(b)),hi:b+Math.max(1,Math.abs(b))};}
function pinX(m,v){const x=m.log?PSL*Math.log(Math.max(v,m.lo*1e-6)/m.lo)/Math.log(m.hi/m.lo):PSL*(v-m.lo)/(m.hi-m.lo);return Math.round(Math.min(PSL,Math.max(0,x)));}
function pinV(m,x){return m.log?m.lo*Math.pow(m.hi/m.lo,x/PSL):m.lo+(m.hi-m.lo)*x/PSL;}

// ------------------------------------------------------------------ inspector
function closeInspector(){$('#inspector').hidden=true;$('#inspector').innerHTML='';}
function placePopup(el,x,y){el.hidden=false;const r=el.getBoundingClientRect();const W=innerWidth,H=innerHeight;el.style.left=Math.max(8,Math.min(x+12,W-r.width-8))+'px';el.style.top=Math.max(8,Math.min(y+12,H-r.height-8))+'px';}
// a value typed in a parameter field. 3.18: a block on a bus takes one value per element, separated by ';' ("1; -1"),
// and a constant can be a vector of values or programs ("0:0, 0.01:10; 0")
function fieldValue(c,k,el){if(el.type==='checkbox')return {v:el.checked};const raw=String(el.value),sch=k==='dsched'||k==='sched'||k==='ref'||(k==='v'&&c.type==='CONST');
 if(raw.includes(';')&&window.Bus?.ELEMENTWISE.has(c.type)){const parts=raw.split(';').map(x=>x.trim());
  return parts.every(x=>sch?!x||P.parseSched(x):Number.isFinite(P.parseEng(x)))?{v:parts.join('; ')}:{bad:true};}
 if(el.dataset.num){const v=P.parseEng(raw);return Number.isFinite(v)?{v}:{bad:true};}
 if(sch&&raw&&!P.parseSched(raw))return {bad:true};return {v:raw};}
function fieldHTML(c,def,p){const v=p[def.k]??def.def;const id='f_'+def.k;
 if(def.type==='select')return `<select id="${id}" data-k="${def.k}">${def.options.map(([k,n])=>`<option value="${k}" ${String(v)===k?'selected':''}>${esc(n)}</option>`).join('')}</select>`;
 if(def.type==='bool')return `<input type="checkbox" id="${id}" data-k="${def.k}" ${v?'checked':''}>`;
 if(def.type==='ref'){const opts=editor.doc.components.filter(k=>def.kinds.includes(k.type)&&k.id!==c.id);
  // a reference that is not on this level: outside the open subcircuit (looked up outwards), or a path into an instance (3.17)
  const far=v&&!opts.some(k=>k.id===v)?`<option value="${esc(v)}" selected>${esc(v)} (${String(v).includes('/')?'μέσα σε υποκύκλωμα':atTop()?'δεν υπάρχει':'έξω από το υποκύκλωμα'})</option>`:'';
  return `<select id="${id}" data-k="${def.k}"><option value="">—</option>${opts.map(k=>`<option value="${k.id}" ${v===k.id?'selected':''}>${esc(k.label||k.id)} (${esc(P.PARTS[k.type].name)})</option>`).join('')}${far}</select>`;}
 if(def.type==='text')return `<input id="${id}" data-k="${def.k}" value="${esc(v)}" placeholder="${esc(def.ph||'')}">`;
 if(def.type==='code')return `<textarea id="${id}" data-k="${def.k}" class="code" rows="14" spellcheck="false">${esc(v)}</textarea>`;
 return `<input id="${id}" data-k="${def.k}" data-num="1" value="${esc(typeof v==='number'?P.eng(v,'',6).replace(/\s/g,''):v)}" inputmode="decimal">`;}
function openInspector(id,x,y){
 const c=editor.comp(id);if(!c)return;const def=partDef(c);const p={...pdefaults(c),...c.params};const ins=$('#inspector');
 const rows=def.params.filter(d=>!d.show||d.show(p)).map(d=>`<label class="frow"><span>${esc(d.label)}${d.unit?` <em>${esc(d.unit)}</em>`:''}</span>${fieldHTML(c,d,p)}${d.hint?`<small>${esc(d.hint)}</small>`:''}</label>`).join('');
 const sig=(S.pfx===null?[]:signalsFor(c)).slice(0,4).map(([pre,n,f])=>`<button class="chip" data-probe="${pre}${pid(c.id)}${f||''}">⌁ ${esc(n)}</button>`).join('');
 // signal inputs: a source can be chosen here instead of drawing a wire (3.0)
 const sigIns=Object.entries(P.sigPins(c)).filter(([,v])=>v.dir==='in').map(([k])=>k);
 const outs=editor.doc.components.filter(k=>k.id!==c.id).flatMap(k=>Object.entries(P.sigPins(k)).filter(([,v])=>v.dir==='out').map(([pin])=>({v:k.id+':'+pin,t:`${k.label||k.id}.${pin}`+(k.type==='TAGI'?` (ετικέτα «${k.params?.name||''}»)`:'')}))).sort((a,b)=>a.t.localeCompare(b.t,undefined,{numeric:true}));
 const wired=pin=>editor.doc.wires.some(w=>(w.a.c===c.id&&w.a.p===pin)||(w.b.c===c.id&&w.b.p===pin));
 const srcRows=sigIns.map(pin=>{const v=c.params?.['in_'+pin]||'';return `<label class="frow"><span>Πηγή της εισόδου ${esc(pin)}</span><select data-src="${esc(pin)}"><option value="">${wired(pin)?'από σύρμα':'— (καμία)'}</option>${outs.map(o=>`<option value="${esc(o.v)}" ${o.v===v?'selected':''}>${esc(o.t)}</option>`).join('')}${v&&!outs.some(o=>o.v===v)?`<option value="${esc(v)}" selected>${esc(v)} (λείπει)</option>`:''}</select></label>`;}).join('');
 ins.innerHTML=`<div class="ins-head"><div><small>${esc(def.name)}</small><input class="ins-label" data-label value="${esc(c.label||c.id)}"></div><button class="x" data-close>✕</button></div>
  <div class="ins-body">${rows||(srcRows?'':'<p class="muted small">Χωρίς παραμέτρους.</p>')}${srcRows?`<div class="ins-srcs"><small class="muted">Σύνδεση χωρίς καλώδιο: διάλεξε από ποια έξοδο παίρνει σήμα κάθε είσοδος. Ισοδυναμεί με σύρμα.</small>${srcRows}</div>`:''}</div>${sig?`<div class="ins-probes">${sig}</div>`:''}
  <div class="ins-foot"><small>Οι αλλαγές εφαρμόζονται αμέσως, και ενώ τρέχει η προσομοίωση. Μονάδες SI με προθέματα: 5.6u, 100m, 20k.</small></div>`;
 placePopup(ins,x,y);
 const apply=el=>{const k=el.dataset.k,f=fieldValue(c,k,el);el.classList.toggle('bad',!!f.bad);if(f.bad)return;const v=f.v;
  editor.setParams(id,{[k]:v});const def2=def.params.find(d=>d.k===k);if(def2?.type==='select'||def2?.type==='bool'||k==='gate'||k==='ff'||k==='mode'||k==='ins'||k==='outs')openInspector(id,parseFloat(ins.style.left)-12,parseFloat(ins.style.top)-12);};
 ins.querySelectorAll('[data-src]').forEach(el=>el.onchange=()=>{editor.setParams(id,{['in_'+el.dataset.src]:el.value||undefined});if(!el.value)delete editor.comp(id).params['in_'+el.dataset.src];editor.renderPins();openInspector(id,parseFloat(ins.style.left)-12,parseFloat(ins.style.top)-12);});
 ins.querySelectorAll('[data-k]').forEach(el=>{el.onchange=()=>apply(el);if(el.dataset.num)el.onkeydown=e=>{if(e.key==='Enter')apply(el);};});
 ins.querySelector('[data-label]').onchange=e=>{editor.setParams(id,{},{label:e.target.value||id});renderChannels();};
 ins.querySelector('[data-close]').onclick=closeInspector;
 ins.querySelectorAll('[data-probe]').forEach(b=>b.onclick=()=>addProbe(b.dataset.probe));
}
const WIRE_COLORS=['','#147966','#c47a1c','#2f5fa0','#b03a5b','#6b4fa0','#203a3f'];
// a named wire can join every wire with the same name (3.18, like Goto/From, for electrical nodes too); a bus has no single node voltage
const WLINK_HINT='Σύρματα με το ίδιο όνομα είναι ένας κόμβος, χωρίς καλώδιο ανάμεσα: ηλεκτρικό με ηλεκτρικό, σήμα με σήμα (μέσα σε υποκύκλωμα, μόνο στο ίδιο instance). ⇄ = ενώνει σύρματα που δεν συνδέονται αλλιώς.';
const wireWidth=w=>{try{return window.Bus?Bus.widths(editor.doc).wire(w):1;}catch(e){return 1;}};
function openWireInspector(id,x,y){const w=editor.wire(id);if(!w)return;const ins=$('#inspector'),bw=wireWidth(w);
 ins.innerHTML=`<div class="ins-head"><div><small>${bw>1?'Δίαυλος '+bw:'Σύνδεση'}</small><b>${esc(w.name||'χωρίς όνομα')}</b></div><button class="x" data-close>✕</button></div><div class="ins-body">
  <label class="frow" title="${esc(WLINK_HINT)}"><span>Όνομα κόμβου</span><input data-wname value="${esc(w.name||'')}" placeholder="π.χ. v_o"></label>
  <p class="muted small">${esc(WLINK_HINT)}</p>
  <div class="frow"><span>Χρώμα</span><div class="swatches">${WIRE_COLORS.map(c=>`<button data-wc="${c}" class="${(w.color||'')===c?'on':''}" style="background:${c||'var(--wire)'}" title="${c||'προεπιλογή'}"></button>`).join('')}</div></div>
  <label class="frow"><span>Πάχος</span><select data-ww>${['',1.5,2.2,3,4].map(v=>`<option value="${v}" ${String(w.width||'')===String(v)?'selected':''}>${v||'προεπιλογή'}</option>`).join('')}</select></label>
  <div class="ins-probes">${bw>1?'':'<button class="chip" data-wprobe>⌁ Τάση κόμβου</button>'}<button class="chip" data-wroute>↯ Αυτόματη δρομολόγηση</button></div></div>`;
 placePopup(ins,x,y);
 ins.querySelector('[data-wname]').onchange=e=>{editor.setWireProps(id,{name:e.target.value.trim()});renderChannels();};
 ins.querySelectorAll('[data-wc]').forEach(b=>b.onclick=()=>{editor.setWireProps(id,{color:b.dataset.wc||undefined});openWireInspector(id,x,y);});
 ins.querySelector('[data-ww]').onchange=e=>editor.setWireProps(id,{width:e.target.value?+e.target.value:undefined});
 if(bw===1)ins.querySelector('[data-wprobe]').onclick=()=>addProbe('VN:'+w.a.c+':'+w.a.p,w.name?w.name:undefined);
 ins.querySelector('[data-wroute]').onclick=()=>{editor.remember();editor.route(editor.wire(id));editor.render();};
 ins.querySelector('[data-close]').onclick=closeInspector;}

// ------------------------------------------------------------------ parameters panel (3.7): collapsible, sections as an accordion
const numOf=v=>typeof v==='number'?v:P.parseEng(v);
let PS={};try{PS=JSON.parse(localStorage.getItem('pcl2-props-sec'))||{};}catch{}
const INIT_K=new Set(['i0','v0','w0','th0','ia0','im0','psi0','y0','q0','h0','init']),MECH_K=new Set(['J','bm','load','TL']),
 LOSS_K=new Set(['esr','Rs','Ls','Ron','Roff','Vf','Vce0','Vfd','Rd','Eon','Eoff','Vref','Iref','R1','R2','Llk1','Llk2','Rw','body','uni']),
 CTL_K=new Set(['sensor','qty','ref','Kp','Ki','Kd','Tf','ff','ffA','ffB','D0','dmin','dmax','upd']);
const PSEC=[['main','Κύριες'],['ctl','Βρόχος ελέγχου'],['loss','Απώλειες και παρασιτικά'],['mech','Μηχανικό μέρος και φορτίο'],['init','Αρχικές συνθήκες']];
function psec(key,title,body,{def=false,cnt='',bad=false}={}){const open=PS[key]??def;
 return `<details class="psec" data-sec="${key}" ${open?'open':''}><summary>${esc(title)}${cnt!==''?`<span class="cnt${bad?' bad':''}">${esc(String(cnt))}</span>`:''}</summary><div class="psec-body">${body}</div></details>`;}
function propsOpen(){return !$('#props').classList.contains('collapsed');}
function setProps(open){const el=$('#props');if(!el)return;el.classList.toggle('collapsed',!open);const b=$('#props-btn');b.classList.toggle('on',open);b.setAttribute('aria-pressed',String(open));$('#props-tab').setAttribute('aria-expanded',String(open));
 try{localStorage.setItem('pcl2-props',open?'1':'0');}catch{}if(open)renderProps();}
function focusComp(id){const c=editor.comp(id);if(!c)return;editor.select([id],[]);editor.userView=true;editor.view.cx=c.x;editor.view.cy=c.y;editor.applyView();}
function togglePin(id,k){const c=editor.comp(id);if(!c)return;editor.remember();const L=new Set(c.live||[]);
 if(L.has(k)){L.delete(k);if(c.liveBase)delete c.liveBase[k];}else{L.add(k);const d=partDef(c).params.find(x=>x.k===k);const v=numOf(c.params[k]??d?.def);c.liveBase={...(c.liveBase||{}),[k]:Number.isFinite(v)?v:0};}
 if(L.size)c.live=[...L];else{delete c.live;delete c.liveBase;}saveLocal();refreshControls();renderProps();if(L.has(k))setLivePanel(true);}
function renderProps(){const box=$('#props-body');if(!box||!propsOpen())return;
 box.querySelectorAll('details.psec').forEach(d=>{PS[d.dataset.sec]=d.open;}); // the toggle event may not have fired yet
 const sel=editor.selection(),act=document.activeElement,fk=box.contains(act)?act.dataset.k:null;let h;if(window.Addons&&Addons.frames.size)Addons.emit('selection',sel.c);
 const one=sel.c.length===1&&!sel.w.length?editor.comp(sel.c[0]):null;
 if(one&&one.type!=='JUNC')h=propsComp(one);else if(one)h=propsJunc(one);else if(sel.w.length===1&&!sel.c.length)h=propsWire(editor.wire(sel.w[0]));
 else if(sel.c.length+sel.w.length>1)h=propsMulti(sel);else h=atTop()?propsCircuit():propsDef();
 box.innerHTML=h;
 box.querySelectorAll('details.psec').forEach(d=>d.ontoggle=()=>{PS[d.dataset.sec]=d.open;try{localStorage.setItem('pcl2-props-sec',JSON.stringify(PS));}catch{}});
 bindProps(box,one);if(fk)box.querySelector(`[data-k="${CSS.escape(fk)}"]`)?.focus();}
function propsComp(c){const def=partDef(c),p={...pdefaults(c),...c.params},live=new Set(c.live||[]),machine=['IM','SM','SRM','DCM'].includes(c.type),inDef=!atTop(),pub=inDef?publicOf(c.id):new Map();
 const secOf=d=>c.type==='PWM'&&CTL_K.has(d.k)?'ctl':INIT_K.has(d.k)?'init':MECH_K.has(d.k)?'mech':!machine&&LOSS_K.has(d.k)?'loss':'main';
 const groups=new Map();for(const d of def.params){if(d.show&&!d.show(p))continue;const g=secOf(d);if(!groups.has(g))groups.set(g,[]);groups.get(g).push(d);}
 const row=d=>`<div class="prow"><span>${esc(d.label)}${d.unit?` <em>${esc(d.unit)}</em>`:''}</span><span class="pin-in">${fieldHTML(c,d,p).replace(` id="f_${d.k}"`,'')}${inDef?(['num','text','select','bool'].includes(d.type)?`<button class="pinbtn pubbtn${pub.has(d.k)?' on':''}" data-pub-k="${d.k}" aria-pressed="${pub.has(d.k)}" title="${pub.has(d.k)?'Δημόσια παράμετρος «'+esc(pub.get(d.k))+'» του υποκυκλώματος: κλικ για να μείνει εσωτερική':'Δημόσια παράμετρος του υποκυκλώματος: αλλάζει χωριστά σε κάθε instance'}">⤴</button>`:''):d.type==='num'?`<button class="pinbtn${live.has(d.k)?' on':''}" data-pin-k="${d.k}" aria-pressed="${live.has(d.k)}" title="${live.has(d.k)?'Αφαίρεση από τις ζωντανές παράμετροι':'📌 Στις ζωντανές παράμετροι, με ρυθμιστή'}">📌</button>`:''}</span>${d.hint?`<small>${esc(d.hint)}</small>`:''}</div>`;
 let h=`<div class="props-head"><div><small>${esc(def.name)}</small><input data-plabel value="${esc(c.label||c.id)}" aria-label="Όνομα στοιχείου"></div><button class="x" data-pclose title="Αποεπιλογή (Esc)">✕</button></div>`;
 for(const [g,title] of PSEC){const L=groups.get(g);if(L?.length)h+=psec('p-'+g,title,L.map(row).join(''),{def:g==='main',cnt:L.length});}
 if(c.type==='SUB')h+=propsSub(c);else if(!def.params.length)h+='<p class="muted small">Χωρίς παραμέτρους.</p>';
 const sigIns=Object.entries(P.sigPins(c)).filter(([,v])=>v.dir==='in').map(([k])=>k);
 if(sigIns.length){const outs=editor.doc.components.filter(k=>k.id!==c.id).flatMap(k=>Object.entries(P.sigPins(k)).filter(([,v])=>v.dir==='out').map(([pin])=>({v:k.id+':'+pin,t:`${k.label||k.id}.${pin}`}))).sort((a,b)=>a.t.localeCompare(b.t,undefined,{numeric:true}));
  const wired=pin=>editor.wiresAt(c.id,pin).length>0;
  h+=psec('p-src','Συνδέσεις σημάτων',sigIns.map(pin=>{const v=c.params?.['in_'+pin]||'';return `<div class="prow"><span>Είσοδος ${esc(pin)}</span><span class="pin-in"><select data-src="${esc(pin)}"><option value="">${wired(pin)?'από σύρμα':'— (καμία)'}</option>${outs.map(o=>`<option value="${esc(o.v)}" ${o.v===v?'selected':''}>${esc(o.t)}</option>`).join('')}</select></span></div>`;}).join('')+'<small class="muted">Σύνδεση χωρίς καλώδιο: ισοδυναμεί με σύρμα.</small>',{cnt:sigIns.length});}
 const sig=S.pfx===null?[]:signalsFor(c);if(sig.length)h+=psec('p-scope','Scope',`<div class="chips">${sig.map(([pre,n,f])=>`<button class="chip" data-probe="${pre}${pid(c.id)}${f||''}">⌁ ${esc(n)}</button>`).join('')}</div>`,{def:true});
 const skip=S.sim?.net?.diag?.skipped.find(x=>x.id===c.id);if(skip)h+=`<p class="small bad">Εκτός επίλυσης: ${skip.why==='openI'?'πηγή ρεύματος σε ανοιχτό κύκλωμα':'χωρίς σύνδεση'}.</p>`;
 const tools=window.Addons?Addons.forType(c.type):[];
 if(tools.length||c.from)h+=psec('p-tools','Παράμετροι από κώδικα',(c.from?`<p class="from-tool">Από εργαλείο: ${Object.entries(c.from).map(([k,v])=>`${esc(k)} (${esc(v.tool||'')})`).join(', ')}</p>`:'')+
  tools.map(a=>`<button class="chip" data-tool="${esc(a.id)}" title="${esc(a.description||'')}">⚙ ${esc((a.targets.find(t=>t.type===c.type)||{}).label||a.name)}</button>`).join(''),{def:true});
 h+=`<p class="muted small">Οι αλλαγές εφαρμόζονται αμέσως, και ενώ τρέχει η προσομοίωση. Με 📌 μια παράμετρος μπαίνει με ρυθμιστή στις ζωντανές παράμετροι.</p>`;
 return h;}
function propsJunc(j){const n=editor.wiresAt(j.id).length;return `<div class="props-head"><div><small>Κόμβος</small><b>${esc(j.id)}</b></div><button class="x" data-pclose>✕</button></div>
 <p class="muted small">${n===1?'Ελεύθερο άκρο: σύρε το πάνω σε ακροδέκτη ή σύρμα για να συνδεθεί, ή συνέχισε το σύρμα με το εργαλείο W.':n+' σύρματα ενώνονται εδώ.'}</p><div class="chips"><button class="chip" data-probe="VN:${esc(j.id)}:j">⌁ Τάση κόμβου</button></div>`;}
function propsWire(w){if(!w)return '';const bw=wireWidth(w);return `<div class="props-head"><div><small>${bw>1?'Δίαυλος '+bw:'Σύρμα'}</small><input data-wname value="${esc(w.name||'')}" placeholder="όνομα κόμβου, π.χ. v_o" aria-label="Όνομα κόμβου"></div><button class="x" data-pclose>✕</button></div>
 ${psec('w-look','Εμφάνιση',`<div class="prow"><span>Χρώμα</span><div class="swatches">${WIRE_COLORS.map(c=>`<button data-wc="${c}" class="${(w.color||'')===c?'on':''}" style="background:${c||'var(--wire)'}" title="${c||'προεπιλογή'}"></button>`).join('')}</div></div>
  <div class="prow"><span>Πάχος</span><span class="pin-in"><select data-ww>${['',1.5,2.2,3,4].map(v=>`<option value="${v}" ${String(w.width||'')===String(v)?'selected':''}>${v||'προεπιλογή'}</option>`).join('')}</select></span></div>`,{def:true})}
 <p class="muted small">${esc(WLINK_HINT)}</p>
 <div class="chips">${bw>1?'':`<button class="chip" data-probe="VN:${esc(w.a.c)}:${esc(w.a.p)}">⌁ Τάση κόμβου</button>`}<button class="chip" data-wroute>↯ Αυτόματη δρομολόγηση</button></div>
 <p class="muted small">${bw>1?`Δίαυλος με ${bw} ${P.pinKind(editor.comp(w.a.c)||{},w.a.p)==='el'?'αγωγούς':'σήματα'}: για να δεις ένα, χώρισέ τον με δίαυλο αγωγών ή Demux, ή βάλε στο scope τα στοιχεία που συνδέει.`:'Για ρεύμα στο σύρμα: άφησε πάνω του ένα probe ρεύματος (μπαίνει σε σειρά). Για τάση: ένα probe τάσης ή βολτόμετρο.'}</p>`;}
function propsMulti(sel){return `<div class="props-head"><div><small>Επιλογή</small><b>${sel.c.length} στοιχεία · ${sel.w.length} σύρματα</b></div><button class="x" data-pclose>✕</button></div>
 ${sel.c.length?'<div class="chips"><button class="chip" data-group title="Τα επιλεγμένα στοιχεία γίνονται ένα υποκύκλωμα. Τα σύρματα που βγαίνουν από την επιλογή γίνονται θύρες.">▣ Υποκύκλωμα από την επιλογή (Ctrl+G)</button></div>':''}
 <ul class="diag-list">${sel.c.map(id=>editor.comp(id)).filter(c=>c&&c.type!=='JUNC').map(c=>`<li><button data-focus="${esc(c.id)}">${esc(c.label||c.id)}</button><span class="muted">${esc(P.PARTS[c.type].name)}</span></li>`).join('')}</ul>`;}
function propsCircuit(){const d=S.sim?.net?.diag,doc=editor.doc,so=doc.solve||{},nC=doc.components.filter(c=>c.type!=='JUNC').length,lb=id=>esc(editor.comp(id)?.label||id);
 let h=`<div class="props-head"><div><small>Κύκλωμα</small><b>${esc(tutorial().title||'Κύκλωμα')}</b></div></div><p class="muted small">${nC} στοιχεία · ${doc.wires.length} σύρματα${S.sim&&!S.error?' · '+S.sim.net.nNodes+' κόμβοι':''}. Διάλεξε στοιχείο ή σύρμα για τις παράμετρές του.</p>`;
 const it=[];if(S.error)it.push(`<li class="bad">⚠ ${esc(S.error)}</li>`);
 if(d){for(const x of d.skipped)it.push(`<li><button data-focus="${esc(x.id)}">${lb(x.id)}</button>${x.why==='openI'?'πηγή ρεύματος σε ανοιχτό κύκλωμα':'χωρίς σύνδεση'}, εκτός επίλυσης</li>`);
  if(d.open.length)it.push(`<li>Ανοιχτοί ακροδέκτες: ${d.open.slice(0,8).map(k=>{const i=k.lastIndexOf(':');return `<button data-focus="${esc(k.slice(0,i))}">${lb(k.slice(0,i))}.${esc(k.slice(i+1))}</button>`;}).join(' ')}${d.open.length>8?' …':''}</li>`);
  if(d.freeEnds.length)it.push(`<li>Ελεύθερα άκρα: ${d.freeEnds.slice(0,8).map(j=>`<button data-focus="${esc(j)}" title="${esc(j)}">○</button>`).join('')}<span class="muted">δεν αλλάζουν τη λύση</span></li>`);
  if(d.freeNets.length)it.push(`<li>${d.freeNets.length} ${d.freeNets.length===1?'σύρμα':'σύρματα'} χωρίς στοιχείο, εκτός επίλυσης</li>`);
  for(const q of d.islands){const k=q.pins[0],cid=k?k.slice(0,k.lastIndexOf(':')):null;
   it.push(`<li>Αιωρούμενο τμήμα${cid?` <button data-focus="${esc(cid)}">${lb(cid)}…</button>`:''}: ${q.ref==='ref'?'ο κόμβος '+esc(q.refPin||'')+' στα 0 V':'μέση τάση 0 V ως προς τη γη, μέσω '+(d.rleak>0?eng(d.rleak,'Ω'):'G_min = 1 nS')}</li>`);}}
 h+=psec('c-conn','Συνδέσεις',it.length?`<ul class="diag-list">${it.join('')}</ul>`:'<p class="ok-line">✓ Όλα συνδέονται, χωρίς αιωρούμενα τμήματα.</p>',{def:true,cnt:it.length||'✓',bad:it.length>0});
 const opt=(k,list,v)=>`<select data-solve="${k}">${list.map(([a,n])=>`<option value="${a}" ${v===a?'selected':''}>${esc(n)}</option>`).join('')}</select>`;
 h+=psec('c-solve','Επίλυση: ασύνδετα και αιωρούμενα',`<div class="prow"><span>Ασύνδετα στοιχεία, ανοιχτοί ακροδέκτες</span><span class="pin-in">${opt('unconn',[['warn','Εκτός επίλυσης, με προειδοποίηση'],['ignore','Εκτός επίλυσης, σιωπηλά'],['error','Σφάλμα: η προσομοίωση δεν τρέχει']],so.unconn||'warn')}</span>
  <small>Στοιχείο χωρίς καμία σύνδεση και πηγή ρεύματος σε ανοιχτό κύκλωμα βγαίνουν από τη λύση. Κλαδί με ανοιχτό άκρο μένει, με μηδενικό ρεύμα. Σύρματα χωρίς στοιχείο δεν κάνουν κόμβο.</small></div>
  <div class="prow"><span>Αιωρούμενα τμήματα (χωρίς αγώγιμη σύνδεση με τη γη)</span><span class="pin-in">${opt('island',[['auto','Αυτόματα: μέση τάση 0 V'],['ref','Ένας κόμβος του στα 0 V'],['error','Σφάλμα: η προσομοίωση δεν τρέχει']],so.island||'auto')}</span>
  <small>Π.χ. δευτερεύον μετασχηματιστή χωρίς γείωση. Οι τάσεις μέσα στο τμήμα δεν αλλάζουν, μόνο ως προς τη γη.</small></div>
  <div class="prow"><span>R διαρροής προς τη γη <em>Ω</em></span><span class="pin-in"><input data-solve="rleak" value="${so.rleak?esc(P.eng(+so.rleak,'',4).replace(/\s/g,'')):''}" placeholder="κενό: G_min = 1 nS" inputmode="decimal"></span><small>Για «Αυτόματα»: σε κάθε κόμβο του αιωρούμενου τμήματος.</small></div>
  <div class="prow"><span>Βάση χρόνου T <em>s</em></span><span class="pin-in"><input data-solve="tbase" value="${so.tbase?esc(P.eng(+so.tbase,'',4).replace(/\s/g,'')):''}" placeholder="κενό: 1 ms" inputmode="decimal"></span><small>Όταν καμία πηγή δεν ορίζει χρόνο (π.χ. γεννήτρια Marx με φορτισμένους πυκνωτές). Το βήμα είναι T/N από την επιλογή «Βήμα».</small></div>
  <small class="muted">Αποθηκεύονται με το κύκλωμα και ισχύουν και στον λύτη του server.</small>`,{cnt:(so.unconn||so.island||so.rleak||so.tbase)?'αλλαγμένες':''});
 const sv=k=>so[k]===undefined?'':String(so[k]);
 h+=psec('c-step','Βήμα του λύτη',`<div class="prow"><span>Βήμα</span><span class="pin-in">${opt('step',[['','Σταθερό T/N (επιλογή «Βήμα Δt»)'],['var','Μεταβλητό, με έλεγχο σφάλματος']],sv('step'))}</span>
  <small>Μεταβλητό: σε κάθε βήμα εκτιμάται το τοπικό σφάλμα των καταστάσεων (ρεύματα πηνίων, τάσεις πυκνωτών, ροές) από διαιρεμένες διαφορές· αν περνά την ανοχή, το βήμα ξαναγίνεται μικρότερο, αλλιώς μεγαλώνει. Οι μεταγωγές και τα συμβάντα βρίσκονται όπως και με το σταθερό. Το T/N της επιλογής «Βήμα Δt» είναι το αρχικό βήμα, και το ελάχιστο είναι T/N·10⁻³.</small></div>
  <div class="prow"><span>Ανοχή (σχετικό σφάλμα ανά βήμα)</span><span class="pin-in">${opt('rtol',[['0.001','10⁻³'],['0.0001','10⁻⁴'],['','10⁻⁵ (προεπιλογή)'],['0.000001','10⁻⁶']],sv('rtol'))}</span><small>Ως προς το μέγιστο |x| κάθε κατάστασης. Σε ταλάντωση με μικρή απόσβεση το συνολικό σφάλμα μεγαλώνει με τον αριθμό των περιόδων.</small></div>
  <div class="prow"><span>Μέγιστο βήμα</span><span class="pin-in">${opt('hmax',[['5','T/5'],['10','T/10'],['20','T/20'],['','T/50 (προεπιλογή)'],['100','T/100'],['200','T/200']],sv('hmax'))}</span><small>Μικρότερο μέγιστο βήμα δίνει πυκνότερα σημεία στο scope. Με τον τραπεζοειδή το βήμα δεν ξεπερνά και το 2τ της ταχύτερης σταθεράς χρόνου του κυκλώματος (όχι των R_on/R_off), αλλιώς ταλαντώνεται εκεί.</small></div>
  <div class="prow"><button data-stepcheck>↻ Έλεγχος βήματος</button><small>Σταθερές χρόνου και ταλαντώσεις του κυκλώματος με τις τωρινές καταστάσεις των διακοπτών, πηγές και γραμμές, απέναντι στο βήμα. Τα μηνύματα είναι στην κονσόλα διαγνωστικών κάτω από το scope.</small></div>`,{cnt:so.step==='var'?'μεταβλητό':'σταθερό'});
 const chk=(k,t)=>`<label class="frow check"><input type="checkbox" data-eset="${k}" ${editor.settings[k]?'checked':''}><span>${t}</span></label>`;
 h+=psec('c-draw','Σχεδίαση συρμάτων',`${chk('freeEnds','Ελεύθερα άκρα: σύρμα που αφήνεις στο κενό κρατά ελεύθερο άκρο')}${chk('autoConnect','Στοιχείο που αφήνεις πάνω σε σύρμα ή ακροδέκτη συνδέεται (Shift: χωρίς σύνδεση)')}
  <ul class="kbd-list"><li><b>W</b>: εργαλείο σύρματος. Κλικ οπουδήποτε για αρχή, κλικ για γωνίες, διπλό κλικ ή Enter για ελεύθερο άκρο, Backspace για μία γωνία πίσω, Esc για έξοδο.</li>
  <li>Σύρε ένα ελεύθερο άκρο πάνω σε ακροδέκτη ή σύρμα: συνδέεται.</li><li>Στοιχείο δύο ακροδεκτών (R, L, αμπερόμετρο, probe ρεύματος) πάνω σε σύρμα, στον άξονά του: μπαίνει σε σειρά.</li>
  <li>Probe τάσης ή βολτόμετρο: ο ακροδέκτης κουμπώνει πάνω στο σύρμα.</li><li>Alt ή Ctrl + σύρσιμο από σύρμα: διακλάδωση.</li></ul>`);
 const pins=doc.components.filter(c=>c.live?.length);
 if(pins.length)h+=psec('c-live','Ζωντανές παράμετροι (📌)',`<ul class="diag-list">${pins.map(c=>`<li><button data-focus="${esc(c.id)}">${esc(c.label||c.id)}</button>${c.live.map(k=>esc(P.PARTS[c.type].params.find(d=>d.k===k)?.label||k)).join(', ')}</li>`).join('')}</ul>`,{cnt:pins.reduce((s,c)=>s+c.live.length,0)});
 return h;}
function bindProps(box,c){
 box.querySelector('[data-pclose]')?.addEventListener('click',()=>editor.select([],[]));
 box.querySelectorAll('[data-probe]').forEach(b=>b.onclick=()=>addProbe(b.dataset.probe));
 box.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>Addons.open(b.dataset.tool,{target:c.id}));
 box.querySelectorAll('[data-focus]').forEach(b=>b.onclick=()=>focusComp(b.dataset.focus));
 box.querySelector('[data-group]')?.addEventListener('click',()=>groupSel());
 box.querySelectorAll('[data-solve]').forEach(el=>el.onchange=()=>{const k=el.dataset.solve;let v=el.value;if(k==='rleak'||k==='tbase'){v=v.trim()?P.parseEng(v):'';if(v!==''&&!(v>0)){el.classList.add('bad');return;}}if((k==='rtol'||k==='hmax')&&v!=='')v=+v;editor.setSolve({[k]:v});});
 box.querySelectorAll('[data-stepcheck]').forEach(b=>b.onclick=()=>{if(S.sim&&!S.error)S.sim.stepCheck();renderDiag();openDiag();});
 box.querySelectorAll('[data-eset]').forEach(el=>el.onchange=()=>{editor.settings[el.dataset.eset]=el.checked;saveSettings();});
 if(!c&&!atTop())bindDef(box);
 if(c&&c.type!=='JUNC'){const id=c.id;
  box.querySelector('[data-plabel]')?.addEventListener('change',e=>{editor.setParams(id,{},{label:e.target.value||id});renderChannels();});
  box.querySelectorAll('[data-pin-k]').forEach(b=>b.onclick=()=>togglePin(id,b.dataset.pinK));
  box.querySelectorAll('[data-pub-k]').forEach(b=>b.onclick=()=>togglePublic(id,b.dataset.pubK));
  bindSub(box,c);
  box.querySelectorAll('[data-src]').forEach(el=>el.onchange=()=>{editor.setParams(id,{['in_'+el.dataset.src]:el.value||undefined});if(!el.value)delete editor.comp(id).params['in_'+el.dataset.src];editor.renderPins();});
  box.querySelectorAll('[data-k]').forEach(el=>{const go=()=>{const k=el.dataset.k,f=fieldValue(c,k,el);el.classList.toggle('bad',!!f.bad);if(f.bad)return;const v=f.v;
    const cur=editor.comp(id)?.params[k];if(cur===v||(el.dataset.num&&numOf(cur)===v))return;editor.setParams(id,{[k]:v});};
   el.onchange=go;if(el.dataset.num)el.onkeydown=e=>{if(e.key==='Enter')go();};});}
 const w=editor.selection().w.length===1?editor.wire(editor.selection().w[0]):null;
 if(w){const id=w.id;box.querySelector('[data-wname]')?.addEventListener('change',e=>{editor.setWireProps(id,{name:e.target.value.trim()});renderChannels();});
  box.querySelectorAll('[data-wc]').forEach(b=>b.onclick=()=>{editor.setWireProps(id,{color:b.dataset.wc||undefined});renderProps();});
  box.querySelector('[data-ww]')?.addEventListener('change',e=>editor.setWireProps(id,{width:e.target.value?+e.target.value:undefined}));
  box.querySelector('[data-wroute]')?.addEventListener('click',()=>{editor.remember();editor.route(editor.wire(id));editor.render();});}}
// a parameter changed from the live panel: reload the netlist with the state carried over, without rebuilding the panels
// ------------------------------------------------------------------ diagnostics console (3.13, ROADMAP §40)
const DSEV={error:['Σφάλματα','⛔'],warn:['Προειδοποιήσεις','⚠'],info:['Πληροφορίες','ℹ']},DGRP={step:'βήμα',net:'συνδέσεις',nl:'μη γραμμικά',sim:'λύτης',server:'server'};
// everything the user should know about the run: netlist warnings, step checks, solver messages, the server's
function diagItems(){const out=[],lb=id=>editor.comp(id)?.label||id;
 if(S.error)out.push({sev:'error',grp:'sim',src:'browser',msg:S.error,fix:'Το κύκλωμα δεν λύνεται όπως είναι: δες το μήνυμα και τα στοιχεία που αναφέρει.'});
 const sim=S.sim&&!S.error?S.sim:null;
 if(sim){for(const w of sim.net.warnings||[])out.push({sev:'warn',grp:'net',src:'browser',msg:w,fix:''});
  for(const q of sim.net.diag?.islands||[]){const k=q.pins[0],cid=k?k.slice(0,k.lastIndexOf(':')):null;out.push({sev:'info',grp:'net',src:'browser',id:cid,msg:`Αιωρούμενο τμήμα${cid?' ('+lb(cid)+'…)':''}: ${q.ref==='ref'?'ένας κόμβος του στα 0 V':'μέση τάση 0 V ως προς τη γη'}.`,fix:'Οι τάσεις μέσα στο τμήμα δεν αλλάζουν. Η επιλογή είναι στις ρυθμίσεις του κυκλώματος.'});}
  for(const r of sim.diagnostics())out.push(r);}
 for(const r of S.batchDiag||[])out.push(r);
 for(const r of S.addonDiag||[])out.push(r);
 return out;}
function renderDiag(){const box=$('#diag-list');if(!box)return;S.diagSeen=S.sim?.dgVer;const all=diagItems(),lb=id=>editor.comp(id)?.label||id,cnt={error:0,warn:0,info:0};
 for(const r of all)cnt[r.sev]++;
 $('#diag-counts').innerHTML=['error','warn','info'].map(k=>`<span class="dc ${k}${cnt[k]?'':' zero'}" title="${DSEV[k][0]}">${DSEV[k][1]} ${cnt[k]}</span>`).join('');
 const dg=$('#diag');dg.classList.toggle('has-error',cnt.error>0);dg.classList.toggle('has-warn',!cnt.error&&cnt.warn>0);
 if(!all.length){box.innerHTML='<p class="ok-line">✓ Κανένα μήνυμα: το βήμα αρκεί για τις σταθερές χρόνου, τις πηγές και τις γραμμές του κυκλώματος.</p>';return;}
 const on=new Set([...document.querySelectorAll('[data-dsev]')].filter(x=>x.checked).map(x=>x.dataset.dsev)),src=$('#diag-src').value,q=$('#diag-q').value.trim().toLowerCase();
 const vis=all.filter(r=>on.has(r.sev)&&(!src||r.src===src)&&(!q||`${r.msg} ${r.fix||''} ${r.id?lb(r.id):''} ${DGRP[r.grp]||''}`.toLowerCase().includes(q)));
 let h='';for(const k of ['error','warn','info']){const L=vis.filter(r=>r.sev===k);if(!L.length)continue;
  h+=`<details class="dg ${k}" open><summary>${DSEV[k][1]} ${DSEV[k][0]} <span class="muted">${L.length}</span></summary><ul>`+L.map(r=>`<li class="dg-item ${k}"><div class="dg-msg">${esc(r.msg)}</div><div class="dg-meta"><span class="tag">${esc(DGRP[r.grp]||r.grp||'')}</span>${r.id&&editor.comp(r.id)?`<button data-dfocus="${esc(r.id)}" title="Δείξε το στοιχείο στο σχέδιο">◎ ${esc(lb(r.id))}</button>`:''}${Number.isFinite(r.t)&&r.t>0?`<span>t = ${eng(r.t,'s',4)}</span>`:r.pre?'<span>πριν από το τρέξιμο</span>':''}${r.n>1?`<span>×${r.n.toLocaleString('el-GR')}</span>`:''}<span class="muted">${r.src==='server'?'server (SciPy)':'browser'}</span></div>${r.fix?`<div class="dg-fix">→ ${esc(r.fix)}</div>`:''}</li>`).join('')+'</ul></details>';}
 box.innerHTML=h||'<p class="muted">Τα φίλτρα κρύβουν όλα τα μηνύματα.</p>';
 box.querySelectorAll('[data-dfocus]').forEach(b=>b.onclick=()=>flashComp(b.dataset.dfocus));}
function openDiag(){const d=$('#diag');if(d&&!d.open){d.open=true;try{localStorage.setItem('pcl-diag-open','1');}catch(e){}}}
function flashComp(id){focusComp(id);const g=document.querySelector(`#canvas .part[data-c="${CSS.escape(id)}"]`);if(!g)return;g.classList.remove('diag-hi');void g.getBoundingClientRect();g.classList.add('diag-hi');setTimeout(()=>g.classList.remove('diag-hi'),1800);}
let stepCheckTimer=0;
// the step check after every build or change (modes at the present switch states), debounced
function scheduleStepCheck(){clearTimeout(stepCheckTimer);stepCheckTimer=setTimeout(()=>{if(S.sim&&!S.error)try{S.sim.stepCheck();}catch(e){}renderDiag();},250);renderDiag();}
function syncStepMode(){const m=$('#step-mode');if(m)m.value=editor.doc.solve?.step==='var'?'var':'fixed';}
// ------------------------------------------------------------------ scenarios (3.14, ROADMAP §30)
// Python in a worker (scenario_worker.js): the pcl package with the app's solver, on a copy of the circuit on the screen
const SCEN={worker:null,busy:false,ready:false,files:[],t0:0};
const SCEN_EX={
 ripple:`# Κυμάτωση του ρεύματος στον buck για διάφορα L, απέναντι στη θεωρία ΔI = V_o(1 − D)/(L·f_s)
b = pcl.tutorial('buck', start='steady')
sw = b.sweep({'L1.L': ['33u', '47u', '68u', '100u', '150u', '220u']}, t_end='8m',
             measure={'Vo': ('V:C1', 'avg', 10), 'dI': ('I:L1', 'pp', 10)})
L = sw.column('L1.L')
theory = [r['Vo'] * (1 - 0.5) / (r['L1.L'] * 100e3) for r in sw.rows]
pcl.show(sw, 'Σάρωση του L')
pcl.plot([x * 1e6 for x in L], {'προσομοίωση': sw.column('dI'), 'θεωρία': theory}, 'Κυμάτωση ρεύματος πηνίου', xlabel='L (μH)', ylabel='Δi_L (A)')
sw.save('κυμάτωση.csv')
`,
 run:`# Το κύκλωμα της οθόνης: 20 περίοδοι T, κυματομορφές και μέσες τιμές στις τελευταίες 5
info = p.channels()
keys = [k for k in info['keys'] if k[:2] in ('V:', 'I:')][:6]
r = p.run(t_end=20 * info['T'], channels=keys)
print(r, 'βήματα:', r.meta['steps'])
pcl.show({k: r.measure(k, 'avg', 5) for k in keys}, 'Μέσες τιμές (5 T)')
pcl.show(r, 'Κυματομορφές')
r.save('κυματομορφές.mat')
`,
 param:`# Σάρωση μιας παραμέτρου του τρέχοντος κυκλώματος: εδώ η πρώτη αντίσταση
for cid, q in p.params().items():
    print(cid, q)
R = next(cid for cid, q in p.params().items() if q['type'] == 'R')
info = p.channels()
out = [k for k in info['keys'] if k.startswith('V:')][0]
sw = p.sweep({R + '.R': [1, 2, 5, 10, 20, 50]}, t_end=20 * info['T'],
             measure={'μέση ' + out: (out, 'avg', 5), 'p-p ' + out: (out, 'pp', 5)})
pcl.show(sw, 'Σάρωση της ' + R)
`,
 step:`# Σταθερό και μεταβλητό βήμα στο τρέχον κύκλωμα: βήματα, χρόνος και μια μέτρηση
info = p.channels()
k = [x for x in info['keys'] if x.startswith('V:')][0]
rows = []
for step in ('fixed', 'var'):
    r = p.run(t_end=10 * info['T'], channels=[k], step=step)
    rows.append({'βήμα': step, 'βήματα': r.meta['steps'], 'απορρίψεις': r.meta.get('rejected', 0),
                 'χρόνος (s)': r.meta['wall_s'], 'μέση ' + k: r.measure(k, 'avg', 5)})
pcl.show(rows, 'Σταθερό και μεταβλητό βήμα')
`,
 bif:`# Διάγραμμα διακλάδωσης ως σάρωση (3.15): peak current-mode με ρεύμα αναφοράς i_c, ένα δείγμα του ρεύματος ανά περίοδο
# μετά από 300 περιόδους μεταβατικό. Ίδιοι αριθμοί με το πάνελ «Διάγραμμα διακλάδωσης», παράλληλα σε όσους workers επιτρέπει ο browser.
c = pcl.tutorial('pcm_chaos')
b = c.bifurcation('IC.v', start=1.4, stop=3, n=33, channel='Y:AM1', stat='end', transient=300, record=64)
pcl.show(b, 'i_L στην αρχή κάθε περιόδου')
pcl.show([{'από i_c': v, 'περίοδος': f'{q}T' if q else 'χωρίς (χάος)'} for v, q in b.changes()], 'Διπλασιασμοί περιόδου')
print(b.meta['workers'], 'workers')
b.save('διακλάδωση.parquet'); b.save('διακλάδωση.mat')
`,
 big:`# Μεγάλη σάρωση σε πλέγμα, παράλληλα, και αποθήκευση σε Parquet (pandas, Polars, MATLAB parquetread)
b = pcl.tutorial('buck', start='steady')
sw = b.sweep({'L1.L': '22u:220u:8', 'C1.C': ['10u', '47u', '100u']}, t_end='6m',
             measure={'Vo': ('V:C1', 'avg', 10), 'dV': ('V:C1', 'pp', 10), 'dI': ('I:L1', 'pp', 10)})
print(sw, sw.meta['workers'], 'workers')
pcl.show(sw, 'L × C')
sw.save('σάρωση.parquet'); sw.save('σάρωση.csv')
`};
const SCEN_COLORS=['#147966','#c47a1c','#2f7fd0','#b03a5b','#6b4fbb','#3b8b3b','#8a6d1d','#555'];
function scenSetCode(code,foreign){S.scenCode=code;const t=$('#scen-code');if(t&&t.value!==code)t.value=code;if(foreign)S.scenForeign=true;}
function scenState(t,kind){const e=$('#scen-state');e.textContent=t||'';e.className='scen-state'+(kind?' '+kind:'');}
function scenTab(k){document.querySelectorAll('[data-stab]').forEach(b=>b.classList.toggle('on',b.dataset.stab===k));document.querySelectorAll('[data-spane]').forEach(p=>p.hidden=p.dataset.spane!==k);}
function scenOut(text,cls){const o=$('#scen-out'),sp=document.createElement('span');if(cls)sp.className=cls;sp.textContent=text.endsWith('\n')?text:text+'\n';o.appendChild(sp);o.scrollTop=o.scrollHeight;}
function scenWorker(){if(SCEN.worker)return SCEN.worker;const w=new Worker('studio/scenario_worker.js');w.onmessage=e=>scenMsg(e.data);
 w.onerror=e=>{scenOut('Σφάλμα του worker: '+(e.message||e),'e');scenDone(false);};SCEN.worker=w;return w;}
function scenRun(){if(SCEN.busy)return;const code=$('#scen-code').value;if(!code.trim())return;
 // code that came with a file runs only after the user has seen it (ROADMAP §10, §30)
 if(S.scenForeign&&!confirm('Ο κώδικας του σεναρίου ήρθε μαζί με το αρχείο που άνοιξες. Διάβασέ τον πριν τον εκτελέσεις: τρέχει στον browser σου.\n\nΕκτέλεση;'))return;
 S.scenForeign=false;S.scenCode=code;saveLocal();SCEN.busy=true;SCEN.t0=performance.now();
 $('#scen-out').innerHTML='';$('#scen-table').innerHTML='';$('#scen-chart').innerHTML='';SCEN.files.forEach(f=>URL.revokeObjectURL(f.url));SCEN.files=[];renderScenFiles();scenTab('out');
 $('#scen-run').disabled=true;$('#scen-stop').disabled=false;$('#scen-prog').textContent='';
 scenState(SCEN.ready?'τρέχει…':'φορτώνεται η Python (Pyodide)…','busy');
 scenWorker().postMessage({type:'run',code,project:project(),name:tutorial().title||'κύκλωμα'});}
function scenStop(){if(SCEN.pool)SCEN.pool.stop();for(const p of SCEN.evals?.values()||[])p.rej(new Error('Διακόπηκε.'));SCEN.evals?.clear();if(SCEN.worker){SCEN.worker.terminate();SCEN.worker=null;SCEN.ready=false;}scenOut('Διακόπηκε. Η Python ξαναφορτώνεται στην επόμενη εκτέλεση.','e');scenDone(false);}
function scenDone(ok,wall){SCEN.busy=false;$('#scen-run').disabled=false;$('#scen-stop').disabled=true;$('#scen-prog').textContent='';
 scenState(ok?`✓ σε ${(wall??(performance.now()-SCEN.t0)/1000).toFixed(1)} s`:'σταμάτησε με σφάλμα',ok?'':'bad');}
function scenMsg(m){switch(m.type){
 case 'ready':SCEN.ready=true;scenState('τρέχει… (Python '+m.version+')','busy');break;
 case 'out':scenOut(m.text);break;
 case 'err':scenOut(m.text,'e');break;
 case 'tick':$('#scen-prog').textContent=`${Math.round(100*m.f)} %`;break;
 case 'progress':$('#scen-prog').textContent=`σημείο ${m.i}/${m.n}`;break;
 case 'show':scenShow(m.data);break;
 case 'file':{const blob=new Blob([m.bytes]);SCEN.files.push({name:m.name,size:m.bytes.byteLength,blob,url:URL.createObjectURL(blob)});renderScenFiles();break;}
 case 'error':scenOut(m.text,'e');scenTab('out');break;
 case 'done':scenDone(m.ok,m.wall);break;
 case 'batch':scenBatch(m);break;
 case 'evalres':{const p=SCEN.evals?.get(m.id);if(p){SCEN.evals.delete(m.id);if(m.error)p.rej(new Error(m.error));else p.res(m.result);}break;}
 case 'batch-fetch':scenBatchWrite(m.sab,SCEN.batchOut);SCEN.batchOut=null;break;}}
// 3.15: a sweep of the panel in parallel. The worker sent its requests and waits (Atomics.wait) on its SharedArrayBuffer;
// the pool answers them, and the JSON of the answers goes back in the buffer (a bigger buffer when it does not fit)
async function scenBatch(m){const pool=SCEN.pool||(SCEN.pool=new Pool.SimPool()),t0=performance.now();let outs;
 try{outs=await pool.map(m.qs,(i,r,done,n)=>{$('#scen-prog').textContent=`σημείο ${done}/${n} · ${pool.n} workers`;},true);}
 catch(e){outs=m.qs.map(()=>({error:String(e&&e.message||e)}));}
 scenBatchWrite(m.sab,new TextEncoder().encode(Scenario.json({workers:pool.n,wall_s:(performance.now()-t0)/1000,outs})));}
// 3.15: Python of an add-on or of the link, in the panel's worker (the same interpreter as the scenarios)
function scenEval(code,inputs,files,addon){return new Promise((res,rej)=>{const id=(SCEN.evalSeq=(SCEN.evalSeq||0)+1);(SCEN.evals||(SCEN.evals=new Map())).set(id,{res,rej});
 scenWorker().postMessage({type:'eval',id,code,inputs,files,addon,project:project(),name:tutorial().title||'κύκλωμα'});});}
// ------------------------------------------------------------------ add-ons and the link (3.15, ROADMAP §35, §36)
function addonDock(a){const box=document.createElement('section');box.className='addon-dock';box.innerHTML=`<header><b title="${esc(a.description||'')}">${esc(a.name)}</b><small class="muted">${esc(a.version||'')}</small><button data-dmin title="Ελαχιστοποίηση">▁</button><button data-dwide title="Μεγαλύτερο">⤢</button><button data-dx title="Κλείσιμο">✕</button></header><div class="addon-body"></div>`;
 $('#addon-docks').appendChild(box);box.querySelector('[data-dx]').onclick=()=>Addons.close(a.id);box.querySelector('[data-dmin]').onclick=()=>box.classList.toggle('min');box.querySelector('[data-dwide]').onclick=()=>box.classList.toggle('wide');
 return {body:box.querySelector('.addon-body'),show:()=>box.classList.remove('min'),remove:()=>box.remove()};}
function renderAddons(){const L=$('#addons-list');if(!L||!window.Addons)return;const A=Addons;
 const vsel=a=>a.builtin||!(a.versions||[]).length?`<small class="muted">${esc(a.version||'')} · ενσωματωμένο</small>`:
  `<select data-aver="${esc(a.id)}" title="Η έκδοση που ανοίγει">${a.versions.map(v=>`<option ${v===a.active?'selected':''}>${esc(v)}</option>`).join('')}</select> <small class="muted">του χρήστη</small>`;
 L.innerHTML=A.list.length?A.list.map(a=>`<div class="addon-item"><div><b>${esc(a.name)}</b> ${vsel(a)}${a.error?`<p class="bad">${esc(a.error)}</p>`:`<p class="muted">${esc(a.description||'')}</p>`}</div>
  <div class="acts">${a.error?'':`<button data-aopen="${esc(a.id)}">Άνοιγμα</button>`}${a.builtin?'':`<button data-arm="${esc(a.id)}" data-arv="${esc(a.active||'')}" title="Αφαίρεση αυτής της έκδοσης">🗑</button>`}</div></div>`).join(''):`<p class="muted small">${A.err?'Τα πρόσθετα θέλουν τον server της εφαρμογής (python run.py): '+esc(A.err):'Κανένα πρόσθετο.'}</p>`;
 L.querySelectorAll('[data-aver]').forEach(x=>x.onchange=()=>Addons.activate(x.dataset.aver,x.value).catch(e=>alert(e.message)));
 L.querySelectorAll('[data-aopen]').forEach(b=>b.onclick=()=>Addons.open(b.dataset.aopen,{target:editor.selection().c[0]||''}));
 L.querySelectorAll('[data-arm]').forEach(b=>b.onclick=async()=>{if(!confirm(`Αφαίρεση της έκδοσης ${b.dataset.arv} του πρόσθετου ${b.dataset.arm};`))return;try{await Addons.remove(b.dataset.arm,b.dataset.arv);}catch(e){alert(e.message);}});
 $('#addons-dir').textContent=A.userDir?'φάκελος χρήστη: '+A.userDir:'';
 const k=A.link;$('#link-box').innerHTML=`<label><input type="checkbox" id="link-on" ${k.on?'checked':''}> <b>Σύνδεση με εξωτερικά προγράμματα</b></label>
  <p class="muted small">Προγράμματα Python ή MATLAB σε αυτόν τον υπολογιστή διαβάζουν και αλλάζουν το κύκλωμα της οθόνης, τρέχουν προσομοιώσεις και στέλνουν πίνακες ή γραφήματα εδώ: <code>pcl.link.connect()</code>, <code>pcl_link('info')</code>. Το token είναι στο <code>~/.pcl/link.json</code>.</p>
  ${k.on?`<p class="small">${k.err?`<span class="bad">${esc(k.err)}</span>`:'● ενεργή'}${k.n?` · ${k.n} κλήσεις, τελευταία ${esc(k.last.method)} (${esc(k.last.t)})${k.last.ok?'':' με σφάλμα'}`:''}</p>`:''}`;
 $('#link-on').onchange=e=>Addons.linkOn(e.target.checked);
}
// a program on this computer asks to connect while the link is closed: accept (the link opens) or refuse (3.15)
function knockToast(k,answer){const t=document.createElement('div');t.className='knock-toast';t.setAttribute('role','alertdialog');
 t.innerHTML=`<b>Αίτημα σύνδεσης</b><p>Το «${esc(k.client)}» σε αυτόν τον υπολογιστή ζητά να διαβάσει και να αλλάξει το κύκλωμα και να τρέξει προσομοιώσεις.</p><div><button class="primary" data-k="1">Αποδοχή</button><button data-k="0">Απόρριψη</button></div>`;
 document.body.appendChild(t);const done=ok=>{t.remove();answer(ok);};t.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>done(b.dataset.k==='1'));setTimeout(()=>{if(t.isConnected)done(false);},55000);}
function initAddons(){if(!window.Addons||!$('#addons-card'))return;
 Addons.init({editor,project,applyProject:pr=>{applyProject(pr);},sim:()=>S.error?null:S.sim,scopeKeys:()=>(scope.cfg?.panes||[]).flatMap(p=>(p.ch||p.channels||[]).map(c=>typeof c==='string'?c:c.key)),
  selection:()=>editor.selection().c,version:()=>($('footer b')?.textContent||''),title:()=>tutorial().title||'',tutorial:()=>S.tut?.id||null,
  python:(code,inputs,files)=>scenEval(code,inputs,files),show:d=>{$('#scen').open=true;scenShow(typeof d==='object'&&d&&d.type?d:{type:'text',text:typeof d==='string'?d:JSON.stringify(d,null,1)});},
  notify:r=>{(S.addonDiag||(S.addonDiag=[])).push({grp:'sim',...r});if(S.addonDiag.length>200)S.addonDiag.shift();renderDiag();},dock:addonDock,changed:renderAddons,knock:knockToast});
 $('#addon-file').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;try{const a=await Addons.install(f);alert(`Εγκαταστάθηκε: ${a.name} ${a.version}`);}catch(x){alert('Δεν εγκαταστάθηκε: '+x.message);}};
 $('#addons-refresh').onclick=()=>Addons.refresh();}
function scenBatchWrite(sab,bytes){if(!sab||!bytes)return;const h=new Int32Array(sab,0,2),cap=sab.byteLength-8;
 if(bytes.length>cap){SCEN.batchOut=bytes;h[1]=bytes.length;Atomics.store(h,0,2);Atomics.notify(h,0);return;}
 new Uint8Array(sab,8,bytes.length).set(bytes);h[1]=bytes.length;Atomics.store(h,0,1);Atomics.notify(h,0);}
function renderScenFiles(){$('#scen-nfiles').textContent=SCEN.files.length?`(${SCEN.files.length})`:'';
 $('#scen-files').innerHTML=SCEN.files.length?SCEN.files.map(f=>`<div class="scen-file"><a href="${f.url}" download="${esc(f.name)}">⬇ ${esc(f.name)}</a><small>${(f.size/1024).toFixed(1)} kB</small></div>`).join(''):
  '<p class="muted small">Ό,τι γράφει το σενάριο εμφανίζεται εδώ για λήψη, π.χ. <code>r.save(\'αποτελέσματα.csv\')</code>, <code>.json</code> ή <code>.mat</code> (MATLAB).</p>';}
const scenNum=v=>v===null||v===undefined?'':typeof v==='number'?(Math.abs(v)>=1e4||(Math.abs(v)<1e-3&&v!==0)?v.toPrecision(5):String(+v.toPrecision(6))).replace('.',','):esc(String(v));
function scenTable(cols,rows,title){return `<table class="scen-tbl">${title?`<caption>${esc(title)}</caption>`:''}<thead><tr>${cols.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(v=>`<td>${scenNum(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;}
function scenShow(d){
 if(d.type==='text'){scenOut(d.text);return;}
 if(d.type==='table'){$('#scen-table').insertAdjacentHTML('beforeend',scenTable(d.cols,d.rows,d.title));scenTab('table');return;}
 if(d.type==='sweep'){const cols=[...d.params,...d.names];$('#scen-table').insertAdjacentHTML('beforeend',scenTable(cols,d.rows.map(r=>cols.map(c=>r[c])),d.title));
  scenTab('chart');const x=d.rows.map(r=>r[d.params[0]]);for(const n of d.names)scenPlot({title:(d.title?d.title+': ':'')+n,xlabel:d.params[0],series:[{name:n,x,y:d.rows.map(r=>r[n])}],marks:true});
  scenTab('chart');return;}
 if(d.type==='bifurcation'){scenTab('chart');const x=[],y=[];d.values.forEach((v,i)=>{for(const q of d.y[i]){x.push(v);y.push(q);}});
  scenPlot({title:d.title,xlabel:d.xlabel,ylabel:d.ylabel,series:[{name:d.ylabel||'y',x,y}],dots:true});scenTab('chart');return;}
 if(d.type==='xy'){scenTab('chart');scenPlot({title:d.title,xlabel:d.xlabel,ylabel:d.ylabel,series:Object.entries(d.series).map(([name,y])=>({name,x:d.x,y})),marks:true});scenTab('chart');return;}
 if(d.type==='run'){const m=d.measure||{};if(Object.keys(m).length)$('#scen-table').insertAdjacentHTML('beforeend',scenTable(['μέτρηση','τιμή'],Object.entries(m),d.title));
  // one chart per unit, so volts and amperes do not share an axis
  scenTab('chart');const by={};d.keys.forEach((k,i)=>{(by[d.units[i]||'']??=[]).push(k);});
  for(const [u,ks] of Object.entries(by))scenPlot({title:(d.title||'')+(u?` [${u}]`:''),xlabel:'t (s)',series:ks.map(k=>({name:k,x:d.t,y:d.ch[k]}))});scenTab('chart');}}
function scenTicks(a,b,n=5){const sp=b-a||Math.abs(a)||1,st0=sp/n,mag=10**Math.floor(Math.log10(st0)),st=[1,2,2.5,5,10].map(x=>x*mag).find(x=>x>=st0*0.999);const out=[];for(let v=Math.ceil(a/st)*st;v<=b+st*1e-9;v+=st)out.push(+v.toPrecision(12));return out;}
function scenPlot(o){const box=document.createElement('div');box.className='scen-plot';box.innerHTML=(o.title?`<h5>${esc(o.title)}</h5>`:'')+'<canvas></canvas><div class="scen-leg"></div>';$('#scen-chart').appendChild(box);
 const cv=box.querySelector('canvas'),dpr=window.devicePixelRatio||1,W=Math.max(320,box.clientWidth||$('#scen-chart').clientWidth-24||600),H=220;cv.width=W*dpr;cv.height=H*dpr;cv.style.width=W+'px';cv.style.height=H+'px';
 const g=cv.getContext('2d');g.scale(dpr,dpr);g.font='11px system-ui,sans-serif';
 // at most 2000 points per series on screen (first and last kept, then the extremes of each bucket)
 const thin=(x,y)=>{const n=x.length;if(n<=2000)return [x,y];const B=500,X=[],Y=[];for(let k=0;k<B;k++){const a=Math.floor(k*n/B),b=Math.floor((k+1)*n/B);let mi=a,ma=a;for(let i=a;i<b;i++){if(y[i]<y[mi])mi=i;if(y[i]>y[ma])ma=i;}for(const i of mi<ma?[a,mi,ma]:[a,ma,mi]){X.push(x[i]);Y.push(y[i]);}}X.push(x[n-1]);Y.push(y[n-1]);return [X,Y];};
 const S2=o.series.map(s=>{const [x,y]=o.dots?[s.x,s.y]:thin(s.x,s.y);return {...s,x,y};});let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity;
 for(const s of S2)for(let i=0;i<s.x.length;i++){const xv=s.x[i],yv=s.y[i];if(!Number.isFinite(xv)||!Number.isFinite(yv))continue;x0=Math.min(x0,xv);x1=Math.max(x1,xv);y0=Math.min(y0,yv);y1=Math.max(y1,yv);}
 if(!Number.isFinite(x0)){g.fillText('χωρίς τιμές',10,20);return;}if(y1===y0){y0-=Math.abs(y0)*.05||1;y1+=Math.abs(y1)*.05||1;}const pad=(y1-y0)*.06;y0-=pad;y1+=pad;if(x1===x0){x0-=1;x1+=1;}
 const L=64,R=12,T=8,B=30,px=x=>L+(x-x0)/(x1-x0)*(W-L-R),py=y=>T+(y1-y)/(y1-y0)*(H-T-B);
 g.strokeStyle='#dbe5e0';g.fillStyle='#6b807a';g.lineWidth=1;
 // enough digits for the tick step (12,00 and 12,01 must not both read 12)
 const dig=(a,b,ts)=>Math.min(9,Math.max(3,Math.ceil(Math.log10(Math.max(Math.abs(a),Math.abs(b))/((ts[1]-ts[0])||1)))+1));
 const ty=scenTicks(y0,y1),tx=scenTicks(x0,x1,6),dy=dig(y0,y1,ty),dx=dig(x0,x1,tx);
 for(const v of ty){const yy=Math.round(py(v))+.5;g.beginPath();g.moveTo(L,yy);g.lineTo(W-R,yy);g.stroke();g.textAlign='right';g.fillText(P.eng(v,'',dy),L-6,yy+4);}
 for(const v of tx){const xx=Math.round(px(v))+.5;g.beginPath();g.moveTo(xx,T);g.lineTo(xx,H-B);g.stroke();g.textAlign='center';g.fillText(P.eng(v,'',dx),xx,H-B+14);}
 g.textAlign='right';g.fillText(o.xlabel||'',W-R,H-4);if(o.ylabel){g.save();g.translate(11,T+(H-T-B)/2);g.rotate(-Math.PI/2);g.textAlign='center';g.fillText(o.ylabel,0,0);g.restore();}
 S2.forEach((s,k)=>{const c=SCEN_COLORS[k%SCEN_COLORS.length];g.strokeStyle=c;g.fillStyle=c;g.lineWidth=1.6;
  if(o.dots){for(let i=0;i<s.x.length;i++)if(Number.isFinite(s.x[i])&&Number.isFinite(s.y[i]))g.fillRect(px(s.x[i])-1,py(s.y[i])-1,2,2);return;}
  g.beginPath();let on=false;
  for(let i=0;i<s.x.length;i++){const xv=s.x[i],yv=s.y[i];if(!Number.isFinite(xv)||!Number.isFinite(yv)){on=false;continue;}const X=px(xv),Y=py(yv);if(on)g.lineTo(X,Y);else g.moveTo(X,Y);on=true;}g.stroke();
  if(o.marks&&s.x.length<=60)for(let i=0;i<s.x.length;i++)if(Number.isFinite(s.y[i])){g.beginPath();g.arc(px(s.x[i]),py(s.y[i]),2.6,0,7);g.fill();}});
 box.querySelector('.scen-leg').innerHTML=S2.map((s,k)=>`<span><i style="background:${SCEN_COLORS[k%SCEN_COLORS.length]}"></i>${esc(s.name)}</span>`).join('');}
function initScenarios(){const t=$('#scen-code');if(!t)return;t.value=S.scenCode||SCEN_EX.ripple;
 t.addEventListener('input',()=>{S.scenCode=t.value;clearTimeout(SCEN.save);SCEN.save=setTimeout(saveLocal,600);});
 t.addEventListener('keydown',e=>{if(e.key==='Tab'&&!e.shiftKey){e.preventDefault();t.setRangeText('    ',t.selectionStart,t.selectionEnd,'end');}else if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();scenRun();}e.stopPropagation();});
 $('#scen-ex').onchange=e=>{const k=e.target.value;if(!k)return;if(t.value.trim()&&t.value!==SCEN_EX[k]&&!Object.values(SCEN_EX).includes(t.value)&&!confirm('Να αντικατασταθεί ο κώδικας με το παράδειγμα;')){e.target.value='';return;}t.value=SCEN_EX[k];S.scenCode=t.value;S.scenForeign=false;e.target.value='';saveLocal();};
 $('#scen-run').onclick=scenRun;$('#scen-stop').onclick=scenStop;document.querySelectorAll('[data-stab]').forEach(b=>b.onclick=()=>scenTab(b.dataset.stab));
 try{if(localStorage.getItem('pcl-scen-open')==='1')$('#scen').open=true;}catch(e){}$('#scen').addEventListener('toggle',()=>{try{localStorage.setItem('pcl-scen-open',$('#scen').open?'1':'0');}catch(e){}});
 renderScenFiles();}
function liveApply(){if(!S.sim)return;try{S.sim.load(fullDoc(),false);S.error=null;warnings(S.sim.net.warnings);scope.attach(S.sim);editor.setDiag(viewDiag(S.sim.net.diag));}catch(e){S.error=e.message;pause();notice('Η προσομοίωση σταμάτησε: '+esc(e.message),'error');}scheduleStepCheck();}

// ------------------------------------------------------------------ context menu
function closeMenu(){$('#ctx').hidden=true;}
function openMenu(ev){
 const m=$('#ctx');let items=[];
 if(ev.kind==='comp'){const c=editor.comp(ev.id);if(!c)return;
  if(c.type!=='JUNC'&&S.pfx!==null)items.push(...signalsFor(c).map(([pre,n,f])=>({t:'⌁ Scope: '+n,f:()=>addProbe(pre+pid(c.id)+(f||''))})));
  if(c.type==='JUNC'&&S.pfx!==null)items.push({t:'⌁ Scope: τάση κόμβου',f:()=>addProbe('VN:'+pid(c.id)+':j')});
  if(c.type==='SUB')items.push(...subMenu(c));
  {const n=editor.selection().c.filter(id=>editor.comp(id)?.type!=='JUNC').length;if(n&&editor.selection().c.includes(c.id))items.push({t:'▣ Υποκύκλωμα από την επιλογή'+(n>1?` (${n})`:''),k:'Ctrl+G',f:()=>groupSel()});}
  if(c.type!=='JUNC')items.push('-',{t:'Ρυθμίσεις…',k:'διπλό κλικ',f:()=>openInspector(c.id,ev.x,ev.y)},{t:'Περιστροφή',k:'R',f:()=>editor.rotateSel()},{t:'Καθρέφτης',k:'M',f:()=>editor.mirrorSel()},{t:'Διπλότυπο',k:'Ctrl+D',f:()=>{editor.copySel();editor.paste(20,20);}});
  items.push({t:'Διαγραφή',k:'Del',f:()=>editor.deleteSel(),cls:'danger'});}
 else if(ev.kind==='wire'){const w=editor.wire(ev.id);if(!w)return;if(S.pfx!==null&&wireWidth(w)===1)items.push({t:'⌁ Scope: τάση κόμβου',f:()=>addProbe('VN:'+pid(w.a.c)+':'+w.a.p,w.name||undefined)},'-');items.push({t:'Όνομα / χρώμα…',k:'διπλό κλικ',f:()=>openWireInspector(w.id,ev.x,ev.y)},{t:'Αυτόματη δρομολόγηση',f:()=>{editor.remember();editor.route(w);editor.render();}},{t:'Διαγραφή',k:'Del',f:()=>editor.deleteSel(),cls:'danger'});}
 else items.push({t:'Επικόλληση',k:'Ctrl+V',f:()=>editor.paste(),dis:!editor.clip},{t:'Επιλογή όλων',k:'Ctrl+A',f:()=>editor.select(editor.doc.components.map(c=>c.id),editor.doc.wires.map(w=>w.id))},{t:'Προσαρμογή προβολής',k:'F',f:()=>editor.fit()},'-',
  ...['R','L','C','D','SW','VDC'].map(t=>({t:'+ '+P.PARTS[t].name,f:()=>{const c=editor.addPart(t,Math.round(ev.world[0]/10)*10,Math.round(ev.world[1]/10)*10);void c;}})),'-',
  {t:'╱ Σύρμα από εδώ',k:'W',f:()=>{editor.setWireTool(true);editor.startFreeWire(ev.world);}},{t:'Επιλογές επίλυσης (ασύνδετα, αιωρούμενα)…',f:()=>{editor.select([],[]);PS['c-solve']=true;setProps(true);}});
 m.innerHTML=items.map((it,i)=>it==='-'?'<hr>':`<button data-i="${i}" class="${it.cls||''}" ${it.dis?'disabled':''}><span>${esc(it.t)}</span>${it.k?`<kbd>${esc(it.k)}</kbd>`:''}</button>`).join('');
 m.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{closeMenu();items[+b.dataset.i].f();});placePopup(m,ev.x-12,ev.y-12);}

// ------------------------------------------------------------------ hover readout on the schematic
let hoverComp=null,hoverPos=[0,0];
function updateHover(){const tip=$('#tip');if(!hoverComp||!S.sim||S.pfx===null){tip.hidden=true;return;}const c0=editor.comp(hoverComp),c=c0&&{...c0,id:pid(c0.id)};if(!c||['JUNC','GND','TAGO','TAGI','SUB','PORT','SIN','SOUT'].includes(c.type)){tip.hidden=true;return;}
 const s=S.sim;let html=`<b>${esc(c.label||c.id)}</b>`;
 if(c.type==='PWM')html+=`<div>D = ${fmt(s.now('D:'+c.id),5)} · φέρον c = ${fmt(s.now('CAR:'+c.id),4)}</div>${c.params.mode==='pi'?`<div>ref ${eng(s.now('REF:'+c.id))} · μέτρ. ${eng(s.now('MEAS:'+c.id))}</div>`:''}`;
 else if(c.type==='DCM'){const rows=[['ω','Y:'+c.id,'rad/s'],['τ_e','Y:'+c.id+':te','N·m'],['i_a','I:'+c.id,'A'],['v_a','V:'+c.id,'V']];
  html+='<table>'+rows.map(([n,k,u])=>`<tr><td>${n}</td><td>${eng(s.now(k),u)}</td><td class="muted">⌀ ${eng(s.lastPeriod(k)?.avg,u)}</td></tr>`).join('')+'</table>';}
 else if(P.BLOCKS.has(c.type)){const b=s.net.compInfo.get(c.id)?.blk;const u=blkUnit(c);const os=OUT_SYM[c.type]?outsOf(c):null;
  html+=os?`<div>${os.map((o,k)=>OUT_SYM[c.type][o]+' = '+eng(s.now('Y:'+c.id+(k?':'+o:'')),blkUnit(c,o),5)).join(' · ')}</div>`:`<div>${c.type==='DISP'?'τιμή':'έξοδος'} ${eng(s.now('Y:'+c.id),u,5)}</div>`;
  if(b){const ins=Object.entries(b.ins).map(([k,n])=>`${k} = ${n>=0?eng(s.sv[n],'',4):'—'}`);if(ins.length)html+=`<div class="muted">${ins.join(' · ')}</div>`;}}
 else if(c.type==='SH'){const q=s.shById.get(c.id),u=q?.sig?'':q?.qty==='V'?'V':'A';html+=q?`<div>κρατημένη τιμή ${eng(q.h,u)}</div><div>${q.n} δείγματα${q.log.t.length?` · τελευταίο στο ${eng(q.log.t[q.log.t.length-1],'s',5)}`:''}</div>`:'';}
 else{const lp=k=>s.lastPeriod(k);const rows=[['v','V:'+c.id,'V'],['i','I:'+c.id,'A'],['p','P:'+c.id,'W']];if(c.type==='SW'||c.type==='SCR')rows.unshift(['g','GS:'+c.id,'']);if(c.type==='XFMR')rows.push(['i_m','Im:'+c.id,'A'],['i₂','I2:'+c.id,'A']);
  html+='<table>'+rows.map(([n,k,u])=>`<tr><td>${n}</td><td>${eng(s.now(k),u)}</td><td class="muted">⌀ ${eng(lp(k)?.avg,u)}</td></tr>`).join('')+'</table>';}
 tip.innerHTML=html;tip.hidden=false;tip.style.left=(hoverPos[0]+16)+'px';tip.style.top=(hoverPos[1]+16)+'px';}

// ------------------------------------------------------------------ subcircuits (3.17, ROADMAP §9)
// The editor shows one level: the circuit, or a definition opened from an instance (S.nav). The simulation always runs on
// the whole project (fullDoc), so inside instance X1 the live values are those of X1 (S.pfx = 'X1/'). A definition
// opened from the library (no instance) has no live values (S.pfx = null). Leaving writes the definition back and
// copies its ports to the instances (SubCircuit.sync); the whole visit is one step of undo in the circuit.
const atTop=()=>!S.nav.length;
function topDoc(){return atTop()?editor.doc:S.top;}
function defsOf(){return topDoc().subcircuits||{};}
const pid=id=>(S.pfx||'')+id;
function fullDoc(){if(atTop())return editor.export();const top=JSON.parse(JSON.stringify(S.top)),cur=S.nav[S.nav.length-1],e=editor.export();
 top.subcircuits[cur.name]={...top.subcircuits[cur.name],components:e.components,wires:e.wires};return top;}
function commitView(){if(atTop())return;const cur=S.nav[S.nav.length-1],e=editor.export(),d=S.top.subcircuits[cur.name];if(!d)return;d.components=e.components;d.wires=e.wires;}
// the diagnostics of the flat circuit, for the level in the editor (X1/R1 → X1 in the circuit, → R1 inside X1)
function viewDiag(d){if(!d)return d;const pf=S.pfx;if(pf===null)return null;
 const rel=id=>{const r=pf?(id.startsWith(pf)?id.slice(pf.length):null):id;return r;};
 return {...d,skipped:d.skipped.map(x=>({...x,id:rel(x.id)?.split('/')[0]})).filter(x=>x.id),open:d.open.map(k=>{const i=k.lastIndexOf(':'),r=rel(k.slice(0,i));return r&&!r.includes('/')?r+k.slice(i):null;}).filter(Boolean)};}
// a part by path (X1/L1), with the label of the path and the values of that instance
function compAt(path){const parts=String(path).split('/'),defs=defsOf();let list=topDoc().components||[],c=null;const lbl=[];
 for(let i=0;i<parts.length;i++){c=list.find(k=>k.id===parts[i]);if(!c)return null;lbl.push(c.label||c.id);
  if(i<parts.length-1){const d=c.type==='SUB'&&defs[c.params?.def];if(!d)return null;list=SubC.innerParts(d,c);}}
 return {...c,label:lbl.join('/')};}
// every part of the circuit, inside instances too: [{c, id (path), label}]
function allComps(){const doc=atTop()?editor.doc:fullDoc(),defs=doc.subcircuits||{},out=[];
 const walk=(list,pfx,lp,depth)=>{for(const c of list){if(c.type==='SUB'){const d=defs[c.params?.def];if(d&&depth<8)walk(SubC.innerParts(d,c),pfx+c.id+'/',lp+(c.label||c.id)+'/',depth+1);continue;}
  out.push({c,id:pfx+c.id,label:lp+(c.label||c.id)});}};
 walk(doc.components||[],'','',0);return out;}
// parameters of a part for the forms: an instance has the public parameters of its definition
function partDef(c){if(c?.type!=='SUB')return P.PARTS[c?.type];const d=defsOf()[c.params?.def];
 return {name:'Υποκύκλωμα «'+(d?.title||c.params?.def||'?')+'»',params:(d?.params||[]).map(pp=>({k:pp.k,label:pp.label||pp.k,unit:pp.unit||'',type:pp.type||'num',options:pp.options,def:pp.def,hint:pp.hint}))};}
function pdefaults(c){if(c.type!=='SUB')return P.defaults(c.type);const o={def:''};for(const d of partDef(c).params)o[d.k]=d.def;return o;}
function subParams(name){const d=defsOf()[name];if(!d)return null;return {def:name,$ports:SubC.portsOf(d),$title:String(d.title||name)};}
// a definition cannot contain itself, directly or through another
function placeOk(t){if(t.type!=='SUB'||atTop())return true;const cur=S.nav[S.nav.length-1].name,cl=SubC.closure({subcircuits:defsOf()},t.params?.def);
 if(t.params?.def===cur||cl[cur]){notice(`Το υποκύκλωμα «${esc(t.params?.def)}» δεν μπαίνει μέσα στο «${esc(cur)}»: θα περιείχε τον εαυτό του.`,'error');setTimeout(()=>notice(''),4000);return false;}return true;}
function renameChannels(f){for(const pn of scope.cfg.panes)for(const ch of pn.ch){const [pre,...rest]=ch.key.split(':');const id=rest[0],n=f(id);if(n&&n!==id){rest[0]=n;ch.key=[pre,...rest].join(':');ch.label=chanLabel(ch.key);}}renderChannels();}
// the open level as a document with the definitions (inside a definition: its parts + the project's definitions)
function levelDoc(){const e=editor.export();return atTop()?e:{...e,subcircuits:JSON.parse(JSON.stringify(S.top.subcircuits||{}))};}
function applyLevel(pr,sel){if(atTop()){editor.replaceDoc(pr,sel);return;}const {subcircuits,...rest}=pr;S.top.subcircuits=subcircuits;delete rest.solve;editor.replaceDoc(rest,sel);}
function groupSel(){const sel=editor.selection().c;
 if(!sel.length){notice('Διάλεξε πρώτα τα στοιχεία του υποκυκλώματος (κλικ ή ορθογώνιο), και μετά Ctrl+G.','info');setTimeout(()=>notice(''),3000);return;}
 let r;try{r=SubC.create(levelDoc(),sel);}catch(e){notice(esc(e.message),'error');return;}
 applyLevel(r.project,[r.id]);const pf=S.pfx||'';if(S.pfx!==null)renameChannels(id=>{const h=id.startsWith(pf)?id.slice(pf.length):null;if(h===null)return id;const head=h.split('/')[0];return r.moved.has(head)?pf+r.id+'/'+h:id;});
 renderPalette();notice(`Νέο υποκύκλωμα ${esc(r.id)} (ορισμός «${esc(r.name)}», ${r.project.subcircuits[r.name].components.filter(c=>SubC.PORT_KIND[c.type]).length} θύρες). Διπλό κλικ για να το ανοίξεις.`,'info');setTimeout(()=>notice(''),5000);}
function expandSub(id){let r;try{r=SubC.expand(levelDoc(),id);}catch(e){notice(esc(e.message),'error');return;}
 applyLevel(r.project,[...r.ids.values()]);const pf=pid(id)+'/';if(S.pfx!==null)renameChannels(k=>{if(!k.startsWith(pf))return k;const rest=k.slice(pf.length),h=rest.split('/')[0];return r.ids.has(h)?(S.pfx||'')+r.ids.get(h)+rest.slice(h.length):k;});
 notice(`Το ${esc(id)} έγινε ανοιχτό κύκλωμα (${r.ids.size} στοιχεία). Ο ορισμός μένει στη βιβλιοθήκη του project.`,'info');setTimeout(()=>notice(''),4000);}
function uniqueSub(id){let r;try{r=SubC.makeUnique(levelDoc(),id);}catch(e){notice(esc(e.message),'error');return;}applyLevel(r.project,[id]);renderPalette();renderProps();}
function subMenu(c){const name=c.params?.def,inner=S.pfx===null?[]:allComps().filter(x=>x.id.startsWith(pid(c.id)+'/'));
 return ['-',{t:'⧉ Άνοιγμα του υποκυκλώματος',k:'διπλό κλικ',f:()=>enterSub(name,S.pfx===null?null:pid(c.id))},{t:'Ανάπτυξη σε ανοιχτό κύκλωμα',k:'Ctrl+Shift+G',f:()=>expandSub(c.id)},
  {t:'Δικός του ορισμός (αντίγραφο)',f:()=>uniqueSub(c.id)},...inner.slice(0,6).flatMap(x=>signalsFor(x.c).slice(0,1).map(([pre,n,f])=>({t:`⌁ Scope: ${n} ${x.label}`,f:()=>addProbe(pre+x.id+(f||''))})))];}
// open a definition (inst = path of the instance, or null for the definition only)
function enterSub(name,inst){const d=defsOf()[name];if(!d){notice(`Δεν υπάρχει ο ορισμός «${esc(name)}».`,'error');return;}
 closeInspector();closeMenu();
 if(atTop()){S.top=editor.export();S.topUndo={u:editor.undoStack.slice(),r:editor.redoStack.slice(),before:editor.snapshot(),view:{...editor.view},user:editor.userView};}else commitView();
 S.nav.push({name,inst});S.pfx=inst?inst+'/':null;
 editor.load({components:S.top.subcircuits[name].components||[],wires:S.top.subcircuits[name].wires||[],version:S.top.version});
 if(S.sim)editor.setDiag(viewDiag(S.sim.net.diag));renderCrumbs();renderPalette();refreshControls();renderProps();editor.svg.focus({preventScroll:true});}
function leaveSub(level=0){if(atTop())return;commitView();while(S.nav.length>level)S.nav.pop();SubC.sync(S.top);
 if(atTop()){const top=S.top,u=S.topUndo;S.top=null;S.pfx='';editor.load(top,{keepView:true});
  if(u){editor.undoStack=u.u;editor.redoStack=u.r;if(editor.snapshot()!==u.before){editor.undoStack.push(u.before);editor.redoStack=[];}editor.view=u.view;editor.userView=u.user;editor.applyView();}
  S.topUndo=null;}
 else{const cur=S.nav[S.nav.length-1];S.pfx=cur.inst?cur.inst+'/':null;const d=S.top.subcircuits[cur.name];editor.load({components:d.components||[],wires:d.wires||[],version:S.top.version});}
 renderCrumbs();renderPalette();buildSim(false);renderChannels();if(atTop()&&S.theory)runTheory();}
function renderCrumbs(){let b=$('#crumbs');if(!b){b=document.createElement('nav');b.id='crumbs';b.className='crumbs';b.setAttribute('aria-label','Επίπεδα υποκυκλωμάτων');$('#canvas').appendChild(b);}
 if(atTop()){b.hidden=true;b.innerHTML='';return;}b.hidden=false;const defs=defsOf();
 const cur=S.nav[S.nav.length-1],n=SubC.instances({...S.top,subcircuits:defs},cur.name).length;
 b.innerHTML=`<button data-lvl="0" title="Πίσω στο κύκλωμα">⌂ Κύκλωμα</button>`+S.nav.map((x,i)=>`<span>›</span><button data-lvl="${i+1}" ${i===S.nav.length-1?'aria-current="true"':''}>${esc(x.inst?x.inst.split('/').pop():'ορισμός')} · ${esc(defs[x.name]?.title||x.name)}</button>`).join('')+
  `<span class="crumb-note">${n>1?`κοινός ορισμός: οι αλλαγές εδώ ισχύουν και στα ${n} instances`:'αλλαγές στον ορισμό του υποκυκλώματος'}${S.pfx===null?' · χωρίς ζωντανές τιμές (ανοιχτό από τη βιβλιοθήκη)':''}</span><button data-lvl="${S.nav.length-1}" title="Ένα επίπεδο πάνω">↑ Έξοδος</button>`;
 b.querySelectorAll('[data-lvl]').forEach(x=>x.onclick=()=>{const l=+x.dataset.lvl;if(l<S.nav.length)leaveSub(l);});}
// the public parameters of a definition: which inner (part, parameter) each one sets
function curDef(){return atTop()?null:S.top.subcircuits[S.nav[S.nav.length-1].name];}
function publicOf(cid){const d=curDef(),m=new Map();for(const pp of d?.params||[])for(const [c,k] of pp.bind||[])if(c===cid)m.set(k,pp.k);return m;}
function togglePublic(cid,k){const d=curDef();if(!d)return;const c=editor.comp(cid),pd=P.PARTS[c?.type]?.params.find(x=>x.k===k);if(!c||!pd)return;d.params=d.params||[];
 const has=d.params.find(pp=>(pp.bind||[]).some(([a,b])=>a===cid&&b===k));
 if(has){has.bind=has.bind.filter(([a,b])=>!(a===cid&&b===k));if(!has.bind.length)d.params=d.params.filter(pp=>pp!==has);}
 else{const same=d.params.find(pp=>pp.k===k&&(pp.type||'num')===pd.type);
  if(same)same.bind.push([cid,k]);
  else{let key=k;const used=new Set(d.params.map(pp=>pp.k));if(used.has(key)||!SubC.okName(key))key=cid+'_'+k;
   d.params.push({k:key,label:`${pd.label} (${c.label||cid})`,unit:pd.unit||'',type:pd.type,...(pd.options?{options:pd.options}:{}),def:c.params[k]??pd.def,bind:[[cid,k]]});}}
 buildSim(false);saveLocal();renderProps();}
function propsSub(c){const d=defsOf()[c.params?.def],own=Object.entries(c.params||{}).filter(([k])=>k.includes('.')&&!k.startsWith('$'));
 const n=SubC.instances({...topDoc(),subcircuits:defsOf()},c.params?.def).length;
 let h=psec('p-sub','Υποκύκλωμα',`<div class="prow"><span>Ορισμός</span><span class="pin-in"><select data-subdef>${Object.entries(defsOf()).map(([k,v])=>`<option value="${esc(k)}" ${k===c.params?.def?'selected':''}>${esc(v.title||k)}</option>`).join('')}${d?'':`<option selected>${esc(c.params?.def||'—')} (λείπει)</option>`}</select></span></div>
  ${d?`<p class="small muted">${esc(d.desc||'')}${d.desc?' · ':''}έκδοση ${esc(d.version||'1')} · ${(d.components||[]).filter(k=>SubC.PORT_KIND[k.type]).length} θύρες · ${n} instance${n>1?'s':''} στο project</p>`:'<p class="small bad">Ο ορισμός λείπει από το project: το υποκύκλωμα μένει εκτός επίλυσης.</p>'}
  <div class="chips"><button class="chip" data-subopen>⧉ Άνοιγμα</button><button class="chip" data-subexp title="Ctrl+Shift+G">Ανάπτυξη</button>${n>1?'<button class="chip" data-subuniq title="Αντίγραφο του ορισμού μόνο για αυτό το instance">Δικός του ορισμός</button>':''}</div>`,{def:true});
 if(d&&!(d.params||[]).length)h+='<p class="muted small">Χωρίς δημόσιες παραμέτρους. Μέσα στο υποκύκλωμα, το ⤴ δίπλα σε μια παράμετρο την κάνει δημόσια.</p>';
 if(own.length)h+=psec('p-subown','Τιμές μόνο για αυτό το instance',own.map(([k,v])=>`<div class="prow"><span>${esc(k)}</span><span class="pin-in"><input data-subown="${esc(k)}" value="${esc(v)}"><button class="pinbtn" data-subdel="${esc(k)}" title="Αφαίρεση (ισχύει η τιμή του ορισμού)">✕</button></span></div>`).join('')+'<small class="muted">Από σενάριο ή <code>p.set("X1/L1.L", …)</code>. Υπερισχύουν των δημόσιων παραμέτρων.</small>',{cnt:own.length});
 return h;}
function bindSub(box,c){if(c?.type!=='SUB')return;const id=c.id;
 box.querySelector('[data-subopen]')?.addEventListener('click',()=>enterSub(c.params.def,S.pfx===null?null:pid(id)));
 box.querySelector('[data-subexp]')?.addEventListener('click',()=>expandSub(id));
 box.querySelector('[data-subuniq]')?.addEventListener('click',()=>uniqueSub(id));
 box.querySelector('[data-subdef]')?.addEventListener('change',e=>{const q=subParams(e.target.value);if(q&&placeOk({type:'SUB',params:q}))editor.setParams(id,q);renderProps();});
 box.querySelectorAll('[data-subown]').forEach(el=>el.onchange=()=>{const v=el.value.trim(),x=P.parseEng(v);editor.setParams(id,{[el.dataset.subown]:v!==''&&Number.isFinite(x)&&/^[-+0-9.eE]+$/.test(v)?x:v});});
 box.querySelectorAll('[data-subdel]').forEach(b=>b.onclick=()=>{editor.remember();delete editor.comp(id).params[b.dataset.subdel];editor.changed('param');renderProps();});}
// nothing selected inside a definition: the definition itself
function propsDef(){const name=S.nav[S.nav.length-1].name,d=curDef(),ports=SubC.portsOf({components:editor.doc.components}),n=SubC.instances({...S.top,subcircuits:S.top.subcircuits},name).length;
 const KIND={el:'ηλεκτρική',in:'είσοδος σήματος',out:'έξοδος σήματος'},SIDE={l:'αριστερά',r:'δεξιά',t:'πάνω',b:'κάτω'};
 let h=`<div class="props-head"><div><small>Ορισμός υποκυκλώματος «${esc(name)}»</small><input data-dk="title" value="${esc(d.title||name)}" aria-label="Τίτλος"></div><button class="x" data-subup title="Έξοδος από το υποκύκλωμα">↑</button></div>`;
 h+=psec('d-main','Ορισμός',`<div class="prow"><span>Περιγραφή</span><span class="pin-in"><input data-dk="desc" value="${esc(d.desc||'')}"></span></div><div class="prow"><span>Έκδοση</span><span class="pin-in"><input data-dk="version" value="${esc(d.version||'1')}"></span></div>
  <p class="small muted">${n} instance${n===1?'':'s'} στο project. Οι αλλαγές στα στοιχεία και στα σύρματα ισχύουν σε όλα.</p>`,{def:true});
 h+=psec('d-ports','Θύρες (ακροδέκτες του συμβόλου)',ports.length?`<ul class="diag-list">${ports.map(p=>`<li><button data-focus="${esc(p.id)}">${esc(p.name)}</button><span class="muted">${KIND[p.kind]} · ${SIDE[p.side]}</span></li>`).join('')}</ul>`:'<p class="small muted">Καμία θύρα. Βάλε θύρες από την ομάδα «Υποκυκλώματα» της παλέτας: ηλεκτρική, είσοδος ή έξοδος σήματος.</p>',{def:true,cnt:ports.length});
 const pp=d.params||[];
 h+=psec('d-pub','Δημόσιες παράμετροι',(pp.length?pp.map((q,i)=>`<div class="prow"><span><input data-pp="${i}" data-pf="label" value="${esc(q.label||q.k)}" aria-label="Ετικέτα"> <em>${esc(q.unit||'')}</em></span><span class="pin-in"><input data-pp="${i}" data-pf="def" value="${esc(q.def??'')}" aria-label="Προεπιλογή" title="Προεπιλογή"><button class="pinbtn" data-ppdel="${i}" title="Αφαίρεση">✕</button></span>
   <small>όνομα <input class="pp-k" data-pp="${i}" data-pf="k" value="${esc(q.k)}" aria-label="Όνομα"> → ${(q.bind||[]).map(([c,k])=>esc(c+'.'+k)).join(', ')||'—'}</small></div>`).join(''):'<p class="small muted">Καμία. Διάλεξε ένα στοιχείο και πάτα ⤴ δίπλα σε μια παράμετρό του: γίνεται δημόσια και αλλάζει χωριστά σε κάθε instance. Ίδιο όνομα σε δύο στοιχεία = μία κοινή παράμετρος.</p>'),{def:true,cnt:pp.length});
 h+=`<div class="chips"><button class="chip" data-subup>↑ Έξοδος</button><button class="chip" data-subexport title="Ο ορισμός (και όσοι χρησιμοποιεί) σε αρχείο, για άλλο project">⇩ Εξαγωγή ορισμού</button></div>`;
 return h;}
function bindDef(box){const d=curDef();if(!d)return;const name=S.nav[S.nav.length-1].name,redo=()=>{buildSim(false);saveLocal();renderCrumbs();renderProps();};
 box.querySelectorAll('[data-subup]').forEach(b=>b.onclick=()=>leaveSub(S.nav.length-1));
 box.querySelector('[data-subexport]')?.addEventListener('click',()=>exportDef(name));
 box.querySelectorAll('[data-dk]').forEach(el=>el.onchange=()=>{d[el.dataset.dk]=el.value;redo();renderPalette();});
 box.querySelectorAll('[data-pp]').forEach(el=>el.onchange=()=>{const q=d.params[+el.dataset.pp],f=el.dataset.pf;let v=el.value.trim();
  if(f==='k'){if(!SubC.okName(v)||d.params.some(x=>x!==q&&x.k===v)){el.classList.add('bad');return;}
   // the instances keep their values under the new name
   for(const {comp} of SubC.instances({...S.top,subcircuits:S.top.subcircuits},name))if(comp.params&&q.k in comp.params){comp.params[v]=comp.params[q.k];delete comp.params[q.k];}}
  if(f==='def'&&(q.type||'num')==='num'){const x=P.parseEng(v);if(!Number.isFinite(x)){el.classList.add('bad');return;}v=x;}
  q[f]=v;redo();});
 box.querySelectorAll('[data-ppdel]').forEach(b=>b.onclick=()=>{d.params.splice(+b.dataset.ppdel,1);redo();});}
// a definition as a file, with the definitions it uses (.pclsub.json), and back
function exportDef(name){const all={...topDoc(),subcircuits:defsOf()};if(!atTop()){const e=editor.export();all.subcircuits={...all.subcircuits,[S.nav[S.nav.length-1].name]:{...curDef(),components:e.components,wires:e.wires}};}
 download(name+'.pclsub.json',JSON.stringify({pcl:'subcircuit',version:1,name,subcircuits:SubC.closure(all,name)},null,1));}
function importDefs(text){const q=JSON.parse(text);if(q?.pcl!=='subcircuit'||!q.subcircuits)throw new Error('Δεν είναι αρχείο υποκυκλώματος (.pclsub.json).');
 const defs=atTop()?(editor.doc.subcircuits=editor.doc.subcircuits||{}):(S.top.subcircuits=S.top.subcircuits||{}),ren=new Map();if(atTop())editor.remember();
 for(const k of Object.keys(q.subcircuits)){let n=k;for(let i=2;defs[n];i++)n=k+'_'+i;ren.set(k,n);}
 for(const [k,d] of Object.entries(q.subcircuits)){for(const c of d.components||[])if(c.type==='SUB'&&ren.has(c.params?.def))c.params.def=ren.get(c.params.def);defs[ren.get(k)]=d;}
 renderPalette();saveLocal();return ren.get(q.name)||[...ren.values()][0];}

// ------------------------------------------------------------------ palette
function renderPalette(){const q=($('#pal-search').value||'').toLowerCase();
 // subcircuits of the project (3.17): one item per definition, plus import of a definition file
 const defs=Object.entries(defsOf()).filter(([k,d])=>!q||String(d.title||k).toLowerCase().includes(q)||k.toLowerCase().includes(q)||'υποκύκλωμα'.includes(q));
 const subItems=defs.map(([k,d])=>{const pr=subParams(k),L=P.subLayout(pr.$ports),sc=Math.min(1,84/(2*L.W+30),84/(2*L.H+30));
  return `<button class="pal-item" draggable="true" data-part="SUB:${esc(k)}" title="Υποκύκλωμα «${esc(d.title||k)}» · κλικ και μετά κλικ στον καμβά, ή σύρσιμο"><svg viewBox="-42 -42 84 84"><g class="sym" transform="scale(${sc})">${P.PARTS.SUB.draw(pr)}</g></svg><span>${esc(d.title||k)}</span></button>`;}).join('');
 $('#palette-list').innerHTML=P.GROUPS.map(g=>{const items=Object.entries(P.PARTS).filter(([k,d])=>d.group===g&&!d.hidden&&(!q||d.name.toLowerCase().includes(q)||k.toLowerCase().includes(q)));
  const extra=g==='Υποκυκλώματα'?subItems+(q?'':`<button class="pal-item pal-import" data-subimport title="Ορισμός υποκυκλώματος από αρχείο .pclsub.json"><span>⇧ Εισαγωγή ορισμού…</span></button>`):'';if(!items.length&&!extra)return '';
  return `<div class="pal-group"><small>${esc(g)}</small>${items.map(([k,d])=>`<button class="pal-item" draggable="true" data-part="${k}" title="${esc(d.name)} · κλικ και μετά κλικ στον καμβά, ή σύρσιμο"><svg viewBox="-42 -42 84 84"><g class="sym">${d.draw(P.defaults(k))}</g></svg><span>${esc(d.name)}</span></button>`).join('')}${extra}</div>`;}).join('');
 $$('.pal-item[data-part]').forEach(b=>{b.onclick=()=>{const t=b.dataset.part;if(t.startsWith('SUB:')){const pr=subParams(t.slice(4));if(!pr||!placeOk({type:'SUB',params:pr}))return;editor.beginPlace('SUB',pr);}else editor.beginPlace(t);notice('Κλικ στον καμβά για τοποθέτηση · R περιστροφή · Esc ακύρωση','info');setTimeout(()=>notice(''),3500);};
  b.ondragstart=e=>{e.dataTransfer.setData('application/x-pcl-part',b.dataset.part);e.dataTransfer.effectAllowed='copy';};});
 $('[data-subimport]')?.addEventListener('click',()=>{const f=document.createElement('input');f.type='file';f.accept='.json,application/json';f.onchange=async()=>{const x=f.files[0];if(!x)return;
  try{const n=importDefs(await x.text());notice(`Ο ορισμός «${esc(n)}» μπήκε στη βιβλιοθήκη του project (παλέτα, ομάδα «Υποκυκλώματα»).`,'info');setTimeout(()=>notice(''),4000);}catch(err){notice('Εισαγωγή: '+esc(err.message),'error');}};f.click();});}

// ------------------------------------------------------------------ tutorials
function tutorial(){return Tutorials.get(S.tut.id)||Tutorials.list[0];}
// Does the drawn circuit still match the tutorial whose theory is shown?
// Signature = set of parts (id=type) + partition of their pins into nets (junctions dropped, grounds merged).
function circuitSig(doc){
 const comps=(doc.components||[]).filter(c=>P.PARTS[c.type]),type=new Map(comps.map(c=>[c.id,c.type]));
 const par=new Map(),find=k=>{while(par.get(k)!==k){par.set(k,par.get(par.get(k)));k=par.get(k);}return k;};
 for(const c of comps)for(const p of Object.keys(P.pinsOf(c)))par.set(c.id+':'+p,c.id+':'+p);
 for(const w of doc.wires||[]){const a=w.a.c+':'+w.a.p,b=w.b.c+':'+w.b.p;if(par.has(a)&&par.has(b))par.set(find(a),find(b));}
 const g=comps.filter(c=>c.type==='GND');for(let i=1;i<g.length;i++)par.set(find(g[i].id+':g'),find(g[0].id+':g'));
 const groups=new Map();for(const k of par.keys()){const r=find(k);if(!groups.has(r))groups.set(r,[]);const t=type.get(k.split(':')[0]);if(t==='GND')groups.get(r).push('⏚');else if(t!=='JUNC')groups.get(r).push(k);}
 const parts=comps.filter(c=>c.type!=='JUNC'&&c.type!=='GND').map(c=>c.id+'='+c.type).sort();
 const nets=[...groups.values()].map(m=>[...new Set(m)].sort().join(',')).filter(x=>x&&x!=='⏚').sort();
 return {parts,nets,key:parts.join(';')+'|'+nets.join(' / ')};}
function tutorialRef(tut){const t=Tutorials.get(tut?.id);if(!t||tut.id==='empty')return null;const o={};for(const op of t.options)o[op.k]=tut.options?.[op.k]??op.def;try{const pr=t.build(o);if(pr.subcircuits)SubC.sync(pr);return circuitSig(pr);}catch{return null;}}
function theoryValidity(t){
 if(!t||!t.theory||!S.tutRef)return {ok:true};const cur=circuitSig(editor.doc);if(cur.key===S.tutRef.key)return {ok:true};
 if(t.theory==='v1'&&S.recognized===t.topology&&S.recognizedKey===cur.key&&['V1','C1','R1','PWM1',t.topology==='flyback'?'T1':'L1'].every(id=>editor.comp(id)))
  return {ok:true,note:'Η συνδεσμολογία διαφέρει από το tutorial, αλλά αναγνωρίζεται από τη συνδεσμολογία ως η ίδια τοπολογία, οπότε η θεωρία ισχύει.'};
 const rp=new Set(S.tutRef.parts),cp=new Set(cur.parts);
 return {ok:false,added:cur.parts.filter(x=>!rp.has(x)),removed:S.tutRef.parts.filter(x=>!cp.has(x))};}
function staleBanner(v){const nm=x=>{const [id,ty]=x.split('=');return `${esc(id)} – ${esc(P.PARTS[ty]?.name||ty)}`;};
 const what=[v.added.length?'προστέθηκαν '+v.added.map(nm).join(', '):'',v.removed.length?'αφαιρέθηκαν '+v.removed.map(nm).join(', '):''].filter(Boolean).join(' · ')||'άλλαξαν οι συνδέσεις';
 return `<div class="th-warn"><b>⚠ Το κύκλωμα δεν είναι πια αυτό του tutorial</b> (${what}). Οι σχέσεις και η σύγκριση παρακάτω αφορούν την αρχική τοπολογία και δεν ισχύουν για το κύκλωμα όπως είναι τώρα. Για το τωρινό κύκλωμα δες «Υπολογισμοί & μαθηματικά», που αναγνωρίζει τη συνδεσμολογία.<div class="row-btns"><button data-th-restore>↺ Επαναφορά κυκλώματος tutorial</button></div></div>`;}
function bindRestore(box){box.querySelector('[data-th-restore]')?.addEventListener('click',()=>loadTutorial(S.tut.id,S.tut.options,true));}
function loadTutorial(id,options={},keepView=false){
 const t=Tutorials.get(id);if(!t)return;const opts={};for(const o of t.options)opts[o.k]=options[o.k]??o.def;S.tut={id,options:opts};
 const pr=t.build(opts);if(pr.subcircuits)SubC.sync(pr);S.tutMeta=pr.meta||null;S.tutRef=circuitSig(pr);S.switching=true;try{applyProject(pr,keepView);}finally{S.switching=false;}renderTutorial();runTheory();runMath();
}
// an older file (no version or < 3) opens the same: wire names that would now join different nets get ·2, ·3 (3.18)
function migrateFile(pr){if(!window.Bus||Bus.namesJoin(pr))return pr;const m=Bus.migrateNames(pr);
 if(m.renamed.length)setTimeout(()=>notice('Αρχείο παλιότερης έκδοσης: από την 3.18 τα σύρματα με το ίδιο όνομα είναι ένας κόμβος. Για να μείνει ίδιο το κύκλωμα, άλλαξαν ονόματα: '+m.renamed.map(r=>esc((r.where?r.where+': ':'')+r.to.join(', '))).join(' · ')+'.','info'),0);
 return m.project;}
function applyProject(pr,keepView){
 pr=migrateFile(pr);pause();if(S.nav.length){S.nav=[];S.top=null;S.pfx='';}if(pr.subcircuits)SubC.sync(pr);editor.load(pr,{keepView});renderCrumbs();renderPalette();if(S.batch)clearBatch();
 const sim=pr.sim||{};if(sim.hDiv){const ss=$('#sim-step'),v=String(sim.hDiv);if(![...ss.options].some(o=>o.value===v))ss.add(new Option('T/'+v,v));ss.value=v;}if(sim.method){$('#method').value=sim.method;$('#method-note').textContent={TR:'2ης τάξης, χωρίς απόσβεση',BDF2:'2ης τάξης, απόσβεση στις υψηλές συχνότητες',BE:'1ης τάξης, ισχυρή απόσβεση'}[sim.method]||'';}setSpeed(sim.speed??100);S.stopT=sim.stopT||0;$('#stop').value=S.stopT?String(+(S.stopT*1e3).toPrecision(6)):'';
 buildSim(true);
 if(pr.scope?.cfg){scope.cfg=pr.scope.cfg;scope.cfg.frozen=null;}
 else{scope.cfg={panes:[{ch:[]}],window:pr.scope?.window||{unit:'T',n:20},trigger:'roll',display:'auto',frozen:null,cursors:[]};
  (pr.scope?.panes||[]).forEach((pane,pi)=>pane.forEach(([key,label])=>scope.addChannel(key,label,pi)));}
 if(typeof pr.scenario==='string')scenSetCode(pr.scenario);
 syncScopeInputs();renderChannels();refreshControls();closeInspector();saveLocal();draw(true);
}
function renderTutorial(){
 const t=tutorial();const o=S.tut.options;
 $('#tut-title').textContent=t.title;$('#tut-group').textContent=t.group;
 $('#tut-desc').textContent=t.desc;
 $('#tut-options').innerHTML=t.options.map(op=>`<label>${esc(op.label)}<select data-topt="${op.k}">${op.options.map(([k,n])=>`<option value="${k}" ${String(o[op.k])===k?'selected':''}>${esc(n)}</option>`).join('')}</select></label>`).join('');
 $$('#tut-options [data-topt]').forEach(s=>s.onchange=()=>{loadTutorial(t.id,{...S.tut.options,[s.dataset.topt]:s.value},true);});
 $('#tut-tasks').innerHTML=(t.tasks||[]).map(x=>`<li>${esc(x)}</li>`).join('');
 const link=t.theory==='v1'?`<a class="btn-link" href="/converter/" target="_blank" rel="noopener">Πλήρης αναλυτικός πάγκος DC-DC ↗</a>`:t.theory==='bidir'?`<a class="btn-link" href="/bidirectional/" target="_blank" rel="noopener">Πλήρης ανάλυση άσκησης PE2 (ερωτήματα 2–5, PLECS) ↗</a>`:'';
 $('#tut-links').innerHTML=link;$('#crumb').textContent=t.title;
}
function gallery(open=true){const g=$('#gallery');g.hidden=!open;if(!open)return;const groups=[...new Set(Tutorials.list.map(t=>t.group))];
 $('#gallery-body').innerHTML=groups.map(gr=>`<section><h3>${esc(gr)}</h3><div class="cards">${Tutorials.list.filter(t=>t.group===gr).map(t=>`<button class="card ${t.id===S.tut.id?'cur':''}" data-tut="${t.id}"><b>${esc(t.title)}</b><span>${esc(t.desc.split('. ')[0])}.</span></button>`).join('')}</div></section>`).join('');
 $$('#gallery [data-tut]').forEach(b=>b.onclick=()=>{gallery(false);loadTutorial(b.dataset.tut);});}

// ------------------------------------------------------------------ theory
let apiChain=Promise.resolve();
function api(action,data){const run=async()=>{const r=await fetch('/api/'+action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const j=await r.json();if(!r.ok)throw Error(j.error||'Σφάλμα');return j;};const p=apiChain.then(run,run);apiChain=p.catch(()=>{});return p;}
function paramsOf(id){const c=editor.comp(id);return c?{...P.defaults(c.type),...c.params}:null;}
function avgOver(key,n=20){const s=S.sim;if(!s)return null;const i=s.chIndex.get(key);const p=s.per;if(i===undefined||!p.n)return null;n=Math.min(n,p.n);let a=0,mn=Infinity,mx=-Infinity,q=0;
 for(let k=1;k<=n;k++){const j=(p.head-k+p.cap)%p.cap,o=j*p.nch+i;a+=p.avg[o];q+=p.rms[o]**2;mn=Math.min(mn,p.min[o]);mx=Math.max(mx,p.max[o]);}return {avg:a/n,rms:Math.sqrt(q/n),min:mn,max:mx,pp:mx-mn};}
// a simulated quantity for the prediction questions: {key, stat, periods, abs} on a channel, or samples of an S&H
function simValue(spec){const s=S.sim;if(!s||!spec||S.error)return null;
 if(spec.samples){const L=s.samples(spec.samples);if(!L)return null;const n=+spec.periods||0;if(n&&s.t<n*s.T-1e-12)return null;return n?L.t.filter(t=>t<n*s.T-1e-12).length:L.t.length;}
 if(spec.last){const L=s.samples(spec.last);return L&&L.v.length?L.v[L.v.length-1]:null;}
 if(spec.first){const L=s.samples(spec.first);return L&&L.t.length?L.t[0]:null;}
 if(spec.key){const q=avgOver(spec.key,+spec.periods||5);if(!q||(s.periodsDone||0)<3)return null;let v=q[spec.stat||'avg'];if(spec.abs)v=Math.abs(v);return v;}
 return null;}
function lastPP(key){const p=S.sim?.lastPeriod(key);return p?p.max-p.min:NaN;}
let theoryToken=0;
async function runTheory(){
 if(!atTop())return; // inside a subcircuit the parts of the tutorial are not in the editor (3.17)
 const t=tutorial(),box=$('#theory'),token=++theoryToken;box.innerHTML='<p class="muted">Υπολογισμός…</p>';
 try{
  if(t.theory==='v1'){const V=paramsOf('V1'),L=paramsOf(t.topology==='flyback'?'T1':'L1'),Cc=paramsOf('C1'),R=paramsOf('R1'),W=paramsOf('PWM1');
   const req={topology:t.topology,vin:Math.abs(+V.V),fs:+W.fs,L:t.topology==='flyback'?+L.Lm:+L.L,C:+Cc.C,n:t.topology==='flyback'?+L.n:.5,drive:'fixed_duty',duty_set:+W.D,resistance:+R.R,load:'resistive'};
   const r=await api('analyze',req);if(token!==theoryToken)return;S.theory={kind:'v1',r,req};}
  else if(t.theory==='bidir'){const m=S.tutMeta;const r=await api('bidir',{position:m.above?'above':'below'});if(token!==theoryToken)return;S.theory={kind:'bidir',r,m};}
  else if(t.theory==='formula'){S.theory={kind:'formula'};}
  else{box.innerHTML='<p class="muted">Ελεύθερο κύκλωμα: χρησιμοποίησε scopes και μετρήσεις.</p>';S.theory=null;return;}
  renderTheory();
 }catch(e){const v=theoryValidity(t);if(!v.ok){box.innerHTML=staleBanner(v);bindRestore(box);return;}box.innerHTML=`<p class="bad">Η θεωρία δεν υπολογίστηκε: ${esc(e.message)}. ${location.protocol==='file:'?'Άνοιξε την εφαρμογή μέσω <code>python run.py</code>.':''}</p>`;}
}
function cmpRows(rows){return `<table class="cmp"><thead><tr><th>Μέγεθος</th><th>Θεωρία</th><th>Προσομοίωση</th><th>Διαφορά</th></tr></thead><tbody>${rows.map(([n,a,b,u])=>{let d=Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a)>1e-12?(100*(b/a-1)):NaN;if(Math.abs(d)<1e-9)d=0;return `<tr><td>${n}</td><td>${eng(a,u)}</td><td>${eng(b,u)}</td><td class="${Math.abs(d)<2?'good':Math.abs(d)<10?'':'warn-text'}">${Number.isFinite(d)?fmt(d,3)+' %':''}</td></tr>`;}).join('')}</tbody></table>`;}
function stepsHTML(steps){return (steps||[]).map(s=>`<details class="step"><summary>${esc(s.title)}</summary><p>${esc(s.explanation||'')}</p>${s.math?`<div class="math">${s.math.mathml||''}</div>`:''}${s.numeric?`<div class="math num">${s.numeric.mathml||''}</div>`:''}${s.result?`<div class="math res">${s.result.mathml||''}</div>`:''}</details>`).join('');}
function renderTheory(){
 const th=S.theory,box=$('#theory');if(!th){return;}const t=tutorial();let html='';const valid=theoryValidity(t);
 try{ // a circuit that is no longer the tutorial's may lack its parts (e.g. moved into a subcircuit): only the banner then
 if(th.kind==='v1'){const r=th.r,m=r.metrics,c=r.config;const neg=t.topology==='buck_boost';
  const vo=avgOver('V:C1'),il=avgOver(t.topology==='flyback'?'Im:T1':'I:L1');
  html+=`<div class="tm"><span class="badge">${esc(r.mode)}</span> V_o = ${eng(c.vo*(neg?-1:1),'V')} · I_o = ${eng(m.Iout,'A')} · D = ${fmt(m.duty,4)} · L_crit = ${eng(m.Lcrit,'H')}</div>`;
  html+=cmpRows([['V_o (μέση)',c.vo*(neg?-1:1),vo?.avg,'V'],[t.topology==='flyback'?'⟨i_m⟩':'⟨i_L⟩',m.ILmean,il?.avg,'A'],['Δi p-p',m.Iripple_pp,lastPP(t.topology==='flyback'?'Im:T1':'I:L1'),'A'],['ΔV_o p-p',m.Vripple_pp,lastPP('V:C1'),'V']]);
  html+=`<p class="muted small">Η προσομοίωση συγκρίνεται μόνο αφού σταθεροποιηθεί (μεταβατικό από την εκκίνηση). Θεωρία: ιδανικά στοιχεία, ${esc(c.drive==='fixed_duty'?'σταθερό D και ωμικό φορτίο':'')}.</p>`;
  if(editor.comp('Cc')){const T1=paramsOf('T1'),vc=avgOver('V:Cc'),ip=avgOver('I:T1',5),pr=avgOver('P:Rc'),vo2=vo?.avg,Llk=+T1.Llk1,fs=+paramsOf('PWM1').fs,Vr=vo2/(+T1.n);
   const Ppred=.5*Llk*(ip?.max??NaN)**2*fs*(vc?.avg)/((vc?.avg)-Vr);
   html+=`<h4>Σκέδαση και RCD clamp</h4><ul class="eqs"><li>Ανακλώμενη τάση V_o/n = <b>${eng(Vr,'V')}</b> · τάση clamp V_c = <b>${eng(vc?.avg,'V')}</b> · μέγιστη τάση διακόπτη V_in + V_c = <b>${eng(+paramsOf('V1').V+(vc?.avg??NaN),'V')}</b></li>
    <li>Ενέργεια σκέδασης ανά περίοδο ½·L_lk·Î_p² = <b>${eng(.5*Llk*(ip?.max??NaN)**2,'J')}</b> με Î_p = ${eng(ip?.max,'A')}</li><li>Στο clamp: P = ½·L_lk·Î_p²·f_s·V_c/(V_c − V_o/n) = <b>${eng(Ppred,'W')}</b> (μέρος της ενέργειας μαγνήτισης περνά κι αυτό από το clamp όσο σβήνει η σκέδαση)</li></ul>`;
   html+=cmpRows([['P στο R_c',Ppred,pr?.avg,'W'],['V_S,max',+paramsOf('V1').V+(vc?.avg??NaN),avgOver('V:S1',5)?.max,'V']]);
   html+=`<p class="muted small">Η θεωρία DC-DC πάνω είναι για ιδανικό μετασχηματιστή. Η σκέδαση «τρώει» λίγο από το D, γι' αυτό η V_o βγαίνει χαμηλότερη.</p>`;}
  html+=`<p class="small">Πλήρης ανάλυση με εξισώσεις και αντικατάσταση: ενότητα «Υπολογισμοί & μαθηματικά».</p>`;}
 else if(th.kind==='bidir'){const m=th.m,r=th.r;const il=avgOver('I:L1',5);const pb=avgOver('P:'+(editor.comp('VB')?'VB':'CB'),5);
  const dI=m.vlo*m.D0/(5.6e-6*20e3);
  html+=`<div class="tm"><span class="badge">${m.above?'αποθήκευση > ζυγού':'αποθήκευση < ζυγού'}</span> V_st = ${eng(m.vst,'V')} · ${m.P>0?'εκφόρτιση':'φόρτιση'} · ${m.above?(m.P>0?'Buck':'Boost'):(m.P>0?'Boost':'Buck')}</div>
   <ul class="eqs"><li>D₀ = 1 − V_lo/V_hi = 1 − ${fmt(m.vlo)}/${fmt(m.vhi)} = <b>${fmt(m.D0,5)}</b></li><li>I_L = ${m.above?'−P/V_bus':'P/V_st'} = <b>${eng(m.I,'A')}</b></li><li>Δi_L = V_lo·D/(L·f_s) = <b>${eng(dI,'A')}</b></li>
   <li>Ολίσθηση για σφάλμα δ: d⟨i_L⟩/dt = V_hi·δ/L = <b>${eng(m.vhi*.001/5.6e-6,'A/s')}</b> για δ = 0,001</li><li>Μετάβαση ±I με ΔD = 0,05: t = L·2|I|/(V_hi·ΔD) = <b>${eng(m.pulse,'s')}</b></li><li>PI (f_c = f_s/20, PM 60°): K_p = <b>${eng(m.pi.kp)}</b>, K_i = <b>${eng(m.pi.ki)}</b></li></ul>`;
  html+=cmpRows([['⟨i_L⟩ (τελευταίες 5 T)',S.tut.options.ctrl==='pi'||S.tut.options.ctrl==='pulse'?NaN:m.I,il?.avg,'A'],['Δi_L p-p',dI,lastPP('I:L1'),'A'],['P προς ζυγό',S.tut.options.bus==='ideal'?m.P:NaN,editor.comp('VB')?-(pb?.avg??NaN):NaN,'W']]);
  if(S.tut.options.sw==='real'){const q=k=>avgOver(k,5)?.avg;const pc=(q('P:S1')||0)+(q('P:S2')||0),ps=(q('PSW:S1')||0)+(q('PSW:S2')||0),pt=Math.abs(m.P);
   html+=`<h4>Απώλειες διακοπτών (μέσες, τελευταίες 5 T)</h4><ul class="eqs"><li>Αγωγής (MOSFET + δίοδοι σώματος): <b>${eng(pc,'W')}</b> · μεταγωγής: <b>${eng(ps,'W')}</b> · σύνολο <b>${eng(pc+ps,'W')}</b> ≈ ${fmt(100*(pc+ps)/pt,3)} % των ${eng(pt,'W')}</li>
    <li>Μεταγωγή: P_sw = f_s·(E_on + E_off)·(|v|/V_ref)·(|i|/I_ref) ≈ <b>${eng(20e3*2.1e-3*(m.vhi/100)*(Math.abs(m.I)/800),'W')}</b> για |i_L| = ${eng(Math.abs(m.I),'A')}, V = ${eng(m.vhi,'V')}, μόνο στον διακόπτη που μεταγάγεται σκληρά (ο άλλος ανάβει αφού άγει ήδη η δίοδός του)</li></ul>`;}
  html+=`<p class="small">Παράθυρο ${r.config.vst_min}–${r.config.vst_max} V · L_min = ${eng(r.q4.L_min,'H')} · Δi_max = ${eng(r.q4.ripple_max.dI,'A')} @ ${fmt(r.q4.ripple_max.vst)} V · μέση ισχύς φορτίου ${fmt(r.q2.load_avg_kW)} kW.</p>`;
  html+=`<h4>Δοκιμές ερωτήματος 5</h4><div class="wrap"><table class="cmp"><thead><tr><th></th><th>V_st</th><th>P</th><th>Λειτ.</th><th>D</th><th>I_L</th><th>Δi</th><th>i_L(0) συμμ.</th></tr></thead><tbody>${r.q5.tests.map(x=>`<tr><td>${esc(x.id)}</td><td>${fmt(x.vst)}</td><td>${fmt(x.p_bus/1e3)} kW</td><td>${esc(x.mode)}</td><td>${fmt(x.D,4)}</td><td>${fmt(x.IL)}</td><td>${fmt(x.dI)}</td><td>${fmt(x.iL0_symmetric)}</td></tr>`).join('')}</tbody></table></div>`;}
 else if(th.kind==='formula')html+=formulaTheory(t);
 }catch(e){if(valid.ok)throw e;html='';}
 box.innerHTML=valid.ok?(valid.note?`<p class="th-note">${esc(valid.note)}</p>`:'')+html:staleBanner(valid)+`<div class="th-stale">${html}</div>`;bindRestore(box);
}
// ideal periodic inductor current, rising while S2 conducts: deviation from the mean at carrier
// position u = τ/T, in units of Δi (−½ … ½). Sawtooth: S2 ON for u ∈ [0, D); triangle: ON around u = ½.
function rippleDev(u,D,saw){u=((u%1)+1)%1;D=Math.min(Math.max(D,1e-9),1-1e-9);
 if(saw)return u<D?-.5+u/D:.5-(u-D)/(1-D);const a=(1-D)/2,b=(1+D)/2;if(u>=a&&u<b)return -.5+(u-a)/D;const v=((u-b)%1+1)%1;return .5-v/(1-D);}
function periodAvgAt(key,t){const s=S.sim,i=s?.chIndex.get(key),p=s?.per;if(i===undefined||!p.n)return NaN;const T=s.T,end=(Math.floor(t/T+1e-9)+1)*T;
 for(let k=1;k<=p.n;k++){const j=(p.head-k+p.cap)%p.cap;const te=p.t[j];if(Math.abs(te-end)<1e-6*T)return p.avg[j*p.nch+i];if(te<end-T)break;}return NaN;}
function samplingTheory(){const s=S.sim,W=paramsOf('PWM1'),Lp=paramsOf('L1'),Hp=paramsOf('SH1'),VB=paramsOf('VB'),VS=paramsOf('VS');
 if(!W||!Lp||!Hp||!VB||!VS)return '<p class="muted">Λείπει κάποιο από τα VB, VS, L1, PWM1, SH1.</p>';
 const fs=+W.fs,T=1/fs,L=+Lp.L,vlo=s?s.now('V:VB'):+VB.V,vhi=s?s.now('V:VS'):+VS.V,saw=W.carrier==='saw',pi=W.mode==='pi',trig=Hp.trig||'start';
 const D0=1-vlo/vhi,D=pi?D0:+W.D,dI=vlo*D/(L*fs),phase=(((+W.phase||0)%360)+360)%360,tau0=((-phase/360)%1+1)%1;
 const refS=P.parseSched(W.ref)||[[0,0]],Iref=refS[refS.length-1][1],uS=trig==='mid'?.5:0;
 const Iavg=pi?Iref-dI*rippleDev(uS,D,saw):+Lp.i0-dI*rippleDev(tau0,+W.D,saw);
 const pos=trig==='both'?[0,.5]:trig==='mid'?[.5]:[0],name=u=>saw?(u===0?'reset (αρχή του ON του S2)':'μέσο της περιόδου'):(u===0?'μέγιστο του φέροντος (μέσο του OFF του S2)':'ελάχιστο του φέροντος (μέσο του ON του S2)');
 const step=trig==='both'?T/2:T,b=phase/360*T+(trig==='mid'?T/2:0),first=b-step*Math.floor(b/step+1e-9);
 const log=s?.samples('SH1'),n=log?log.t.length:0,nexp=s&&s.t>=first-1e-12?Math.floor((s.t-first)/step+1e-7)+1:0;
 const lastAt=u=>{if(!log)return NaN;for(let i=log.t.length-1;i>=0;i--){const q=((log.t[i]/T-phase/360)%1+1)%1;if(Math.min(Math.abs(q-u),1-Math.abs(q-u))<1e-6)return log.v[i];}return NaN;};
 const eqs=[`D₀ = 1 − V_bus/V_st = 1 − ${fmt(vlo,4)}/${fmt(vhi,4)} = <b>${fmt(D0,5)}</b>${pi?' · ο PI δίνει D = D_ff + διόρθωση, με D_ff = 1 − V_bus/V_st από τις μετρούμενες τάσεις':Math.abs(D-D0)>1e-6?` · <span class="warn-text">D = ${fmt(D,5)} ≠ D₀: το μέσο ρεύμα ολισθαίνει με V_st·(D − D₀)/L = ${eng(vhi*(D-D0)/L,'A/s')}</span>`:''}`,
  `Δi_L = V_bus·D/(L·f_s) = <b>${eng(dI,'A')}</b>. Το ρεύμα ανεβαίνει όσο άγει ο S2 (v_L = V_bus) και κατεβαίνει όσο άγει ο S1.`,
  saw?`Πριονωτό, trailing-edge: c = τ/T και g_S2 = (D > c), άρα ο S2 άγει από το reset έως τ = D·T = ${eng(D*T,'s')}. Στο reset ξεκινά η άνοδος: εκεί είναι η <b>κοιλάδα</b> του ρεύματος.`
   :`Συμμετρικό τρίγωνο: c = |1 − 2τ/T| και g_S2 = (D > c), άρα ο S2 άγει για τ ∈ (${fmt((1-D)/2,4)}·T, ${fmt((1+D)/2,4)}·T). Το μέγιστο του φέροντος (τ = 0) είναι το μέσο του OFF και το ελάχιστο (τ = T/2) το μέσο του ON: και στα δύο το ιδανικό ρεύμα περνά από τη <b>μέση τιμή</b>.`,
  `Δείγματα: ${pos.map(u=>`${name(u)}, όπου i_L = ⟨i_L⟩ ${rippleDev(u,D,saw)<0?'−':'+'} ${fmt(Math.abs(rippleDev(u,D,saw)),3)}·Δi = <b>${eng(Iavg+dI*rippleDev(u,D,saw),'A')}</b>`).join('· ')}. ${pos.length} ${pos.length>1?'δείγματα':'δείγμα'} ανά περίοδο, δηλαδή ${eng(pos.length*fs,'Hz')}.`,
  `Μετατόπιση φέροντος φ = ${fmt(phase,4)}° = ${eng(phase/360*T,'s')}: στο t = 0 το φέρον βρίσκεται στο τ(0) = (−φ) mod T = ${fmt(tau0,4)}·T${pi?'':Math.abs(rippleDev(tau0,+W.D,saw))<1e-9?', όπου η περιοδική κυματομορφή περνά από τη μέση τιμή':`, όπου η περιοδική κυματομορφή απέχει ${fmt(rippleDev(tau0,+W.D,saw),3)}·Δi από τη μέση τιμή`}. Πρώτο δείγμα στο t = <b>${eng(first,'s')}</b>${first<1e-15?' (το trigger συμπίπτει με το t = 0)':''}.`,
  pi?`Ο PI μηδενίζει το σφάλμα στο δείγμα: i_L(t_k) → I_ref = ${eng(Iref,'A')}, άρα ⟨i_L⟩ = I_ref ${rippleDev(uS,D,saw)<0?'+':'−'} ${fmt(Math.abs(rippleDev(uS,D,saw)),3)}·Δi = <b>${eng(Iavg,'A')}</b>.${saw?' Με πριονωτό η μέση τιμή απέχει Δi/2 από την αναφορά.':''}`
   :Math.abs(rippleDev(tau0,+W.D,saw))<1e-9?`Με i_L(0) = ${eng(+Lp.i0,'A')} σε σημείο μέσης τιμής, ⟨i_L⟩ = i_L(0) = <b>${eng(Iavg,'A')}</b>`:`Με i_L(0) = ${eng(+Lp.i0,'A')} στο τ(0), η μέση τιμή γίνεται ⟨i_L⟩ = i_L(0) − Δi·(${fmt(rippleDev(tau0,+W.D,saw),3)}) = <b>${eng(Iavg,'A')}</b>${Math.abs(rippleDev(tau0,+W.D,saw))>1e-6?' · το i_L(0) δεν πέφτει σε σημείο μέσης τιμής, άρα όλη η κυματομορφή μετατοπίζεται':''}.`];
 const rows=[['⟨i_L⟩ (τελευταίες 5 T)',Iavg,avgOver('I:L1',5)?.avg,'A'],['Δi_L p-p',dI,lastPP('I:L1'),'A'],...pos.map(u=>[`Δείγμα στο τ = ${u?'T/2':'0'}`,Iavg+dI*rippleDev(u,D,saw),lastAt(u),'A']),
  ['Δείγματα έως t',nexp,n,''],['Πρώτο δείγμα',first,log?.t[0],'s']];
 let html=`<ul class="eqs">${eqs.map(e=>`<li>${e}</li>`).join('')}</ul>${cmpRows(rows)}`;
 if(log&&log.t.length){const N=log.t.length,first6=Math.max(0,N-8);
  html+=`<h4>Τελευταία δείγματα</h4><div class="wrap"><table class="cmp"><thead><tr><th>#</th><th>t_sample</th><th>τ/T</th><th>i_L(t_k)</th><th>⟨i_L⟩ περιόδου</th><th>δείγμα − ⟨i_L⟩</th></tr></thead><tbody>${log.t.slice(first6).map((t,j)=>{const i=first6+j,v=log.v[i],a=periodAvgAt('I:L1',t),q=((t/T-phase/360)%1+1)%1;
   return `<tr><td>${(S.sim.shById.get('SH1')?.n??N)-(N-1-i)}</td><td>${eng(t,'s',6)}</td><td>${fmt(Math.min(q,1-q)<1e-6?0:q,3)}</td><td>${eng(v,'A',5)}</td><td>${eng(a,'A',5)}</td><td>${Number.isFinite(a)?eng(v-a,'A',4):'—'}</td></tr>`;}).join('')}</tbody></table></div>`;}
 const k=s?.ctrlById.get('PWM1');if(k){const tk=k.tk,dt=k.dt||0,d=Math.min(1,Math.max(0,k.dOn)),d2=Math.min(1,Math.max(0,k.dOff)),[e0,e1]=saw?[0,d*T]:[(1-d)*T/2,(1+d2)*T/2];const r=x=>`${eng(x,'s',6)} (τ = ${Math.abs(x-tk)<1e-6*T?'0':eng(x-tk,'s',4)})`;
  html+=`<h4>Χρονοδιάγραμμα της τρέχουσας περιόδου φέροντος</h4><ul class="eqs"><li>Αρχή περιόδου t_k = ${eng(tk,'s',6)}</li>${pos.map(u=>`<li>t_sample: ${r(tk+u*T)}</li>`).join('')}
   <li>t_update: ${pi?(W.upd==='double'&&!saw?`${r(tk)} για την ακμή ανάμματος (D = ${fmt(k.dOn,5)}) και ${r(tk+T/2)} για την ακμή σβησίματος (D = ${fmt(k.dOff,5)}). Ο PI τρέχει με T_s = T/2 και διαβάζει κάθε φορά το τελευταίο δείγμα`:`${r(tk)}, ο ελεγκτής διαβάζει το δείγμα που μόλις πάρθηκε και ορίζει το D της περιόδου (D = ${fmt(d,5)})`):W.upd==='double'&&!saw?`${r(tk)} και ${r(tk+T/2)} (πρόγραμμα D(t))`:'— (ανοιχτός βρόχος, σταθερό D)'}</li>
   <li>t_gate: S2 ON στο ${r(tk+e0+dt)}, S2 OFF στο ${r(tk+e1)}${dt>0?`, S1 ON στο ${r(tk+e1+dt)} (νεκρός χρόνος ${eng(dt,'s')})`:''}</li></ul>
   <p class="muted small">Στην ίδια στιγμή προηγείται το δείγμα, ακολουθεί η ενημέρωση του ελεγκτή και μετά η μεταγωγή. Το δείγμα είναι η τιμή του ρεύματος ακριβώς πριν από κάθε μεταγωγή της στιγμής εκείνης (t⁻).</p>`;}
 return html;}
// N legs on a common clock: per-leg and summed ripple, cancellation points, window scan
function polyTheory(){const s=S.sim,m=S.tutMeta||{};const legs=editor.doc.components.filter(c=>c.type==='L'&&/^L\d+$/.test(c.id)).sort((a,b)=>+a.id.slice(1)-+b.id.slice(1));
 const N=legs.length,W=paramsOf('PWM1'),VB=paramsOf('VB'),VS=paramsOf('VS');if(!N||!W||!VB||!VS)return '<p class="muted">Λείπουν τα VB, VS, L1…, PWM1….</p>';
 const fs=+W.fs,T=1/fs,L=+paramsOf('L1').L,vlo=s?s.now('V:VB'):+VB.V,vhi=s?s.now('V:VS'):+VS.V,D=1-vlo/vhi,Pw=Number.isFinite(m.P)?m.P:40e3,Ik=-Pw/(N*vlo);
 // actual duty (open loop with R, or what the PI settles to) and the ON-interval voltage V_bus − R·I_k
 const Dk=W.mode==='pi'?(s?s.now('D:PWM1'):D):+W.D,vOn=k=>vlo-(+paramsOf(legs[k].id).Rs||0)*Ik,dI=vOn(0)*Dk/(L*fs);
 const ph=legs.map((c,k)=>{const q=paramsOf('PWM'+(k+1));return q?((+q.phase||0)%360+360)%360:0;});
 const same=ph.every(x=>Math.abs(x-ph[0])<1e-6),sorted=[...ph].map(x=>((x-ph[0])%360+360)%360).sort((a,b)=>a-b),equal=!same&&sorted.every((x,k)=>Math.abs(x-360*k/N)<1e-6);
 const frac=x=>{const r=x-Math.round(x);return Math.abs(r)<1e-7?0:x-Math.floor(x);},rr=frac(N*D),shiftF=V=>{const d=1-vlo/V,r=frac(N*d);return V/L*T/N*r*(1-r);},commonF=V=>N*vlo*(1-vlo/V)/(L*fs);
 // the ideal summed waveform for the actual phases (any spacing)
 const dIk=legs.map((c,k)=>vOn(k)*Dk/((+paramsOf(c.id).L||L)*fs));
 let mn=Infinity,mx=-Infinity;for(let j=0;j<4000;j++){const u=j/4000;let y=0;for(let k=0;k<N;k++)y+=dIk[k]*rippleDev(u-ph[k]/360,D,W.carrier==='saw');mn=Math.min(mn,y);mx=Math.max(mx,y);}const dIsum=mx-mn;
 // expected mean current of each leg: the PI reference, or with winding resistance (V_bus − (1 − D)·V_st)/R
 const pi=W.mode==='pi',Rs=legs.map(c=>+paramsOf(c.id).Rs||0),expI=legs.map((c,i)=>{const q=paramsOf('PWM'+(i+1));if(q?.mode==='pi'){const r=P.parseSched(q.ref);return r?r[r.length-1][1]:NaN;}return Rs[i]>0?(vlo-(1-(+q.D))*vhi)/Rs[i]:Ik;});
 const unequalL=dIk.some(x=>Math.abs(x/dIk[0]-1)>1e-6);
 const vmin=m.vmin??60,vmax=m.vmax??100,canc=[];for(let q=1;q<N;q++){const v=vlo/(1-q/N);if(v>=vmin-1e-9&&v<=vmax+1e-9)canc.push(v);}
 let worst={v:vmin,d:0};for(let j=0;j<=2000;j++){const V=vmin+(vmax-vmin)*j/2000,d=same?commonF(V):shiftF(V);if(d>worst.d)worst={v:V,d};}
 const k=m.k??.3,dImax=vlo*(1-vlo/vmax)/(L*fs),Lmin=vlo*(1-vlo/vmax)/(k*Math.abs(Ik)*fs);
 const mode=same?'συμφασική':equal?'μετατοπισμένη κατά T/N':'άνισες φάσεις';
 const eqs=[`${N} κλάδοι, ${mode} οδήγηση (φάσεις ${ph.map(x=>fmt(x,4)+'°').join(', ')} → καθυστερήσεις ${ph.map(x=>eng(x/360*T,'s',3)).join(', ')}).`,
  `Ισομερής καταμερισμός: P_k = P/N = ${eng(Pw/N,'W')}, I_k = −P/(N·V_bus) = <b>${eng(Ik,'A')}</b> ανά κλάδο, ⟨i_Σ⟩ = N·I_k = <b>${eng(N*Ik,'A')}</b>.`,
  pi?`Κάθε κλάδος έχει δικό του PI ρεύματος: μετρά το i_L του κλάδου στην αρχή της δικής του περιόδου (μέγιστο του τριγώνου, άρα μέση τιμή) και ακολουθεί την αναφορά του, ό,τι κι αν διαφέρει ανάμεσα στους κλάδους.`
   :Rs.some(r=>r>0)?`Ανοιχτός βρόχος με αντίσταση πηνίων: σε μόνιμη κατάσταση V_bus − (1 − D)·V_st = R_k·I_k, άρα I_k = (V_bus − (1 − D)·V_st)/R_k. Ο κλάδος με τη μεγαλύτερη R παίρνει λιγότερο ρεύμα: ${legs.map((c,i)=>`${esc(c.label||c.id)} ${eng(expI[i],'A',4)}`).join(', ')}.`
   :`Ανοιχτός βρόχος με ιδανικούς κλάδους: τα μέσα ρεύματα μένουν όσο ήταν στην αρχή, γιατί τίποτα δεν τα επαναφέρει. Μια αλλαγή φάσης ή duty αφήνει μόνιμη ανισοκατανομή.`,
  `D₀ = 1 − V_bus/V_st = 1 − ${fmt(vlo,4)}/${fmt(vhi,5)} = <b>${fmt(D,5)}</b>${Math.abs(Dk-D)>1e-6?` (εδώ D = ${fmt(Dk,5)}, γιατί καλύπτει και την πτώση R·I)`:''}, Δi_k = (V_bus − R·I_k)·D/(L·f) = <b>${eng(dI,'A')}</b> (${fmt(100*dI/Math.abs(Ik),3)} % του |I_k|), κορυφή |I_k| + Δi_k/2 = <b>${eng(Math.abs(Ik)+dI/2,'A')}</b>.`,
  same?`Συμφασικά οι κλάδοι κυματώνουν μαζί: Δi_Σ = N·Δi_k = <b>${eng(N*dI,'A')}</b>, στη συχνότητα f = ${eng(fs,'Hz')}.`
   :equal&&!unequalL?`Μετατοπισμένα: r = N·D − ⌊N·D⌋ = ${fmt(rr,4)}, Δi_Σ = (V_st/L)·(T/N)·r(1 − r) = <b>${eng(shiftF(vhi),'A')}</b>. Σε κάθε υποπερίοδο T/N άγουν ⌊N·D⌋ ή ⌊N·D⌋ + 1 κάτω διακόπτες· η κυμάτωση που μένει έχει συχνότητα N·f = ${eng(N*fs,'Hz')}.${rr<1e-6||rr>1-1e-6?' <b>Εδώ N·D είναι ακέραιος: ιδανική ακύρωση.</b>':''}`
   :`${unequalL?'Με διαφορετικά L':'Με άνισες φάσεις'} ο κλειστός τύπος δεν ισχύει και η ακύρωση δεν είναι πλήρης· η κυμάτωση του αθροίσματος υπολογίζεται από τις ιδανικές κυματομορφές των κλάδων: <b>${eng(dIsum,'A')}</b>.`,
  `Παράθυρο ${fmt(vmin)}–${fmt(vmax)} V: ${canc.length?`ακυρώσεις (N·D ακέραιος) στα ${canc.map(v=>eng(v,'V',4)).join(', ')}`:'καμία ακύρωση μέσα στο παράθυρο'}. Μέγιστη κυμάτωση αθροίσματος ${eng(worst.d,'A')} στα ${eng(worst.v,'V',4)} (${same?'συμφασικά':'μετατοπισμένα'}).`,
  `Κριτήριο 30 %: Δi_k είναι μέγιστο στη μέγιστη V_st (${eng(dImax,'A')}), άρα L_min = V_bus·D_max/(0,3·|I_k|·f) = <b>${eng(Lmin,'H')}</b>· τώρα L = ${eng(L,'H')} → ${dImax<=k*Math.abs(Ik)*(1+1e-6)?'<span class="good">μέσα στο κριτήριο</span>':'<span class="warn-text">εκτός κριτηρίου</span>'}.`];
 const rows=[['⟨i_Σ⟩ (ζυγός)',expI.reduce((a,b)=>a+b,0),avgOver('I:VB',5)?.avg,'A'],['Δi_k p-p (κλάδος 1)',dI,lastPP('I:L1'),'A'],['Δi_Σ p-p',dIsum,lastPP('I:VB'),'A'],['Κορυφή |i_L1|',Math.abs(Ik)+dI/2,(()=>{const q=s?.lastPeriod('I:L1');return q?Math.max(Math.abs(q.max),Math.abs(q.min)):NaN;})(),'A']];
 const tab=`<h4>Καταμερισμός ανά κλάδο (τελευταίες 5 T)</h4><div class="wrap"><table class="cmp"><thead><tr><th>Κλάδος</th><th>φ</th><th>L, R</th><th>⟨i_L⟩ αναμενόμενο</th><th>⟨i_L⟩</th><th>Δi p-p</th><th>P_k</th></tr></thead><tbody>${legs.map((c,i)=>{const a=avgOver('I:'+c.id,5),lp=paramsOf(c.id);
   return `<tr><td>${esc(c.label||c.id)}</td><td>${fmt(ph[i],4)}°</td><td>${eng(+lp.L,'H',4)}${+lp.Rs>0?', '+eng(+lp.Rs,'Ω',3):''}</td><td>${eng(expI[i],'A',5)}</td><td>${eng(a?.avg,'A',5)}</td><td>${eng(lastPP('I:'+c.id),'A',4)}</td><td>${eng(-(a?.avg??NaN)*vlo,'W',4)}</td></tr>`;}).join('')}</tbody></table></div>`;
 const scan=`<h4>Κυμάτωση αθροίσματος σε όλο το παράθυρο (ιδανικό μοντέλο)</h4><div class="wrap"><table class="cmp"><thead><tr><th>V_st</th><th>D</th><th>N·D</th><th>Δi_k</th><th>Δi_Σ μετατοπισμένα</th><th>Δi_Σ συμφασικά</th></tr></thead><tbody>${[...new Map([vmin,(vmin+vmax)/2,vmax,...canc,worst.v].map(v=>[v.toPrecision(6),v])).values()].sort((a,b)=>a-b).map(V=>{const d=1-vlo/V;
   return `<tr><td>${eng(V,'V',4)}</td><td>${fmt(d,4)}</td><td>${fmt(N*d,4)}</td><td>${eng(vlo*d/(L*fs),'A',4)}</td><td>${eng(shiftF(V),'A',4)}</td><td>${eng(commonF(V),'A',4)}</td></tr>`;}).join('')}</tbody></table></div>`;
 return `<ul class="eqs">${eqs.map(e=>`<li>${e}</li>`).join('')}</ul>${cmpRows(rows)}${tab}${scan}`;}
// last n complete periods of one channel: [{avg,min,max}], oldest first
function lastPeriods(key,n){const s=S.sim,i=s?.chIndex.get(key),p=s?.per;if(i===undefined||!p?.n)return [];const out=[];for(let k=Math.min(n,p.n);k>=1;k--){const j=(p.head-k+p.cap)%p.cap,o=j*p.nch+i;out.push({t:p.t[j],avg:p.avg[o],min:p.min[o],max:p.max[o]});}return out;}
function evalOrderHTML(){const o=S.sim?.net.sig.order||[];if(!o.length)return '';return `<p class="small">Σειρά υπολογισμού των μπλοκ σε κάθε στιγμή: <b>${o.map(b=>esc(b.label)).join(' → ')}</b>. Κάθε μπλοκ υπολογίζεται μετά από όσα διαβάζει άμεσα. Η z⁻¹ δεν διαβάζει άμεσα την είσοδό της, γι' αυτό σπάει τους βρόχους. Ένας κλειστός βρόχος χωρίς τέτοιο μπλοκ (αλγεβρικός βρόχος) αναφέρεται ως σφάλμα.</p>`;}
// 3.0: current loop built from blocks. The PI reads i_L at the period start (sawtooth: the valley), so it holds
// the valley at the reference and the mean is i_ref + Δi/2
// 3.17: N instances of one buck leg (subcircuit), interleaved. Per leg Δi = V_in·D(1 − D)/(L·f_s); the sum with phases
// k·360°/N: Δi_Σ = V_in·(N·D − m)(m + 1 − N·D)/(N·L·f_s), m = ⌊N·D⌋ (zero when N·D is an integer); in phase: N·Δi.
// 3.18: the dq current loop on buses. Plant L·di/dt = v − e − R·i in dq (θ = ωt − 90°), PI with K_p = ω_c·L, K_i = ω_c·R and
// decoupling ωL: i_dq/i*_dq = ω_c/(s + ω_c); in steady state v_dq = e_dq + (R + jωL)·i_dq
function busDqTheory(){const s=S.sim,m=S.tutMeta||{};if(!s||!m.L)return '';const {E,R,L,f,fc,wc,Kp,Ki,id,iq,dec,t1,t2}=m,w=2*Math.PI*f;
 const t=s.t,idr=t>=t1?id:0,iqr=t>=t2?iq:0,vd=E+R*idr-w*L*iqr,vq=R*iqr+w*L*idr,ia=s.lastPeriod('I:XL/La'),va=s.lastPeriod('V:XI/Va');
 return `<ul class="eqs"><li>Φυτό στο dq: L·di_d/dt = v_d − e_d − R·i_d + ωL·i_q, L·di_q/dt = v_q − e_q − R·i_q − ωL·i_d (θ = ωt − 90°, e_d = Ê = ${eng(E,'V')}, e_q = 0)</li>
  <li>PI με μηδενικό στον πόλο του φυτού: K_p = ω_c·L = <b>${fmt(Kp,4)}</b> Ω, K_i = ω_c·R = <b>${fmt(Ki,4)}</b> Ω/s (f_c = ${fmt(fc,3)} Hz)</li>
  <li>${dec?`Με αποσύζευξη v* = PI(e) + e_dq + ωL·(−i_q, i_d): i_dq/i*_dq = ω_c/(s + ω_c), τ = 1/ω_c = <b>${eng(1/wc,'s')}</b>, οι άξονες ανεξάρτητοι`:`Χωρίς αποσύζευξη ο όρος ωL·i = ${eng(w*L,'Ω')}·i μένει: ένα βήμα στο i_q σπρώχνει το i_d και το αντίστροφο`}</li>
  <li>Μόνιμη κατάσταση: v_dq = e_dq + (R + jωL)·i_dq, |v| = <b>${eng(Math.hypot(vd,vq),'V')}</b>, Î_φάσης = √(i_d² + i_q²) = <b>${eng(Math.hypot(idr,iqr),'A')}</b></li></ul>`+
  cmpRows([['i_d',idr,s.now('Y:PK'),'A'],['i_q',iqr,s.now('Y:PK:q'),'A'],['Î φάσης a',Math.hypot(idr,iqr),ia?(ia.max-ia.min)/2:NaN,'A'],['V̂ αντιστροφέα (φάση a)',Math.hypot(vd,vq),va?(va.max-va.min)/2:NaN,'V']])+
  `<p class="muted small">Δίαυλοι: ${Object.keys(s.net.vec||{}).length} μπλοκ δουλεύουν σε δύο στοιχεία (d, q), δηλαδή ${2*Object.keys(s.net.vec||{}).length} μπλοκ στον λύτη. Ο λύτης βλέπει το ίδιο κύκλωμα με χωριστά σύρματα.</p>`;}
function subLegsTheory(){const s=S.sim,m=S.tutMeta||{};if(!s||!m.N)return '';const {N,D,Vin,L,fs,R,shift}=m,Vo=D*Vin,dI=Vin*D*(1-D)/(L*fs),k=Math.floor(N*D+1e-9);
 const dS=shift?Vin*(N*D-k)*(k+1-N*D)/(N*L*fs):N*dI,vo=avgOver('V:C1'),io=avgOver('Y:AM1',5);
 const legs=Array.from({length:N},(_,j)=>avgOver(`I:X${j+1}/L1`,5)?.avg);
 return `<ul class="eqs"><li>V_o = D·V_in = <b>${eng(Vo,'V')}</b>, I_o = V_o/R = <b>${eng(Vo/R,'A')}</b>, ανά σκέλος <b>${eng(Vo/R/N,'A')}</b></li>
  <li>Κυμάτωση σκέλους Δi = V_in·D(1 − D)/(L·f_s) = <b>${eng(dI,'A')}</b></li>
  <li>${shift?`Άθροισμα με φάσεις k·360°/N: Δi_Σ = V_in·(N·D − m)(m + 1 − N·D)/(N·L·f_s), m = ⌊N·D⌋ = ${k}: <b>${eng(dS,'A')}</b>${Math.abs(N*D-Math.round(N*D))<1e-9?' (N·D ακέραιος: ακύρωση)':''}`:`Συμφασικά τα σκέλη αθροίζονται: Δi_Σ = N·Δi = <b>${eng(dS,'A')}</b>`}</li>
  <li>Μέσο ρεύμα ανά σκέλος (προσομοίωση): ${legs.map((x,j)=>`σκέλος ${j+1} ${eng(x,'A')}`).join(' · ')}</li></ul>`+
  cmpRows([['V_o (μέση)',Vo,vo?.avg,'V'],['Δi σκέλους 1 p-p',dI,lastPP('I:X1/L1'),'A'],['Δi_Σ p-p (A_o)',dS,lastPP('Y:AM1'),'A'],['⟨i_o⟩',Vo/R,io?.avg,'A']])+
  `<p class="muted small">Κάθε σκέλος είναι instance του ίδιου ορισμού «${esc(defsOf().leg?.title||'leg')}»: ίδια στοιχεία, δική του φάση και αρχική τιμή (δημόσιες παράμετροι), δική του κατάσταση.</p>`;}
function blocksTheory(){const s=S.sim,m=S.tutMeta||{};if(!s||!m.fs||!editor.comp('AM1')||!paramsOf('VO'))return '';const T=1/m.fs,key=m.blk?'Y:AM1':'I:L1';
 const iref=m.blk?s.now('Y:K1'):s.now('REF:PWM1'),i=Number.isFinite(iref)?iref:m.i1,Vin=+paramsOf('V1').V,Vo=+paramsOf('VO').V,D=Vo/Vin,dI=(Vin-Vo)*D*T/+paramsOf('L1').L;
 const ia=avgOver(key,5),dsim=m.cmp?avgOver('GS:S1',5)?.avg:avgOver('D:PWM1',5)?.avg;
 const after=lastPeriods(key,20000).filter(q=>q.t>m.t1+T&&q.t<m.t1+40*T);const vk=after.length?Math.max(...after.map(q=>q.min)):NaN;const os=after.length>=20?100*(vk-m.i1)/(m.i1-m.i0):NaN;
 const pmLoss=360*m.fc/m.fs;
 let h=`<div class="tm"><span class="badge">${m.blk?'PI από μπλοκ':'ενσωματωμένος PI'}</span>${m.blk?(m.cmp?'φέρον + συγκριτής':'PWM με είσοδο d'):''}${m.z1?' · z⁻¹':''}</div>`;
 h+=`<ul class="eqs"><li>K_p = <b>${eng(m.kp)}</b>, K_i = <b>${eng(m.ki)}</b>: f_c = f_s/20 = ${eng(m.fc,'Hz')}, περιθώριο φάσης 60° μαζί με την καθυστέρηση ZOH${m.z1?`. Η z⁻¹ αφαιρεί άλλες ω_c·T·180°/π = <b>${fmt(pmLoss,3)}°</b>, άρα μένουν περίπου ${fmt(60-pmLoss,3)}°`:''}</li>
  <li>D = V_o/V_in = <b>${fmt(D,4)}</b>, Δi = (V_in − V_o)·D·T/L = <b>${eng(dI,'A')}</b></li>
  <li>Ο PI μετρά στην αρχή της περιόδου. Με πριονωτό φέρον εκεί είναι η <b>κοιλάδα</b> του i_L (όπως στην Άσκηση 2), άρα κοιλάδα = i_ref και ⟨i_L⟩ = i_ref + Δi/2</li>
  ${Number.isFinite(os)?`<li>Υπερύψωση της κοιλάδας μετά το βήμα ${eng(m.i0,'A')} → ${eng(m.i1,'A')}: <b>${fmt(Math.max(0,os),3)} %</b>${os<=.05?' (καμία)':''}</li>`:''}</ul>`;
 h+=cmpRows([['κοιλάδα i_L',i,ia?.min,'A'],['⟨i_L⟩ (τελευταίες 5 T)',i+dI/2,ia?.avg,'A'],['D',D,dsim,'']]);
 h+=evalOrderHTML();
 if(m.blk)h+=`<p class="small muted">Ο PI από μπλοκ ακολουθεί τους κανόνες του ενσωματωμένου (ίδιο δείγμα, ίδιο anti-windup), γι' αυτό με «PWM με είσοδο d» δίνει ακριβώς το ίδιο D. ${m.cmp?'Με φέρον και συγκριτή ο λύτης εντοπίζει τη στιγμή που το φέρον περνά το d μέσα στο βήμα του, όπως τις μεταβάσεις των διόδων.':''}</p>`;
 return h;}
// 3.0: peak current-mode. A valley error Δi is multiplied every period by λ = (m_a − m₂)/(m₁ + m_a)
function pcmTheory(){const s=S.sim,m=S.tutMeta||{};if(!s||!m.fs||!paramsOf('V1')||!paramsOf('VO')||!paramsOf('L1'))return '';const T=m.T,R=paramsOf('RMP1'),ic0=s.now('Y:IC'),ic=Number.isFinite(ic0)?ic0:m.ic,vl=m.mode==='valley';
 const Vin=+paramsOf('V1').V,Vo=+paramsOf('VO').V,L=+paramsOf('L1').L,D=Vo/Vin,m1=(Vin-Vo)/L,m2=Vo/L,ma=R?(+R.hi-+R.lo)*(+R.f):0;
 // a perturbation of the sample at the clock is multiplied by λ every period
 const lam=vl?(ma-m1)/(m2+ma):(ma-m2)/(m1+ma),stable=Math.abs(lam)<1,mamin=vl?Math.max(0,(m1-m2)/2):Math.max(0,(m2-m1)/2);
 const Ipk=vl?ic+ma*(1-D)*T+m1*D*T:ic-ma*D*T,Iv=vl?ic+ma*(1-D)*T:Ipk-m2*(1-D)*T;
 const pk=lastPeriods('Y:AM1',8),dd=lastPeriods('GS:S1',8);const ds=dd.map(q=>q.avg);const spread=ds.length?Math.max(...ds)-Math.min(...ds):NaN;
 const alt=ds.length>=6&&ds.slice(2).every((d,k)=>Math.abs(d-ds[k])<2e-3)&&spread>2e-3;
 const verdict=!ds.length?'':spread<2e-3?'σταθερό: ίδιο duty σε κάθε περίοδο (1T)':alt?'υποαρμονική: το duty εναλλάσσεται κάθε περίοδο (2T)':'υποαρμονική / χαοτική: το duty αλλάζει από περίοδο σε περίοδο';
 const mc=1+ma/m1,Qp=1/(Math.PI*(mc*(1-D)-.5));
 let h=`<div class="tm"><span class="badge ${stable?'ccm':'dcm'}">${stable?'|λ| < 1: σταθερό':'|λ| ≥ 1: ασταθές'}</span> ${vl?'valley · ':''}D = ${fmt(D,3)} · m_a = ${m.ramp==='none'?'0':m.ramp==='half'?(vl?'m₁/2':'m₂/2'):(vl?'m₁':'m₂')}</div>`;
 h+=`<ul class="eqs"><li>Κλίσεις: m₁ = (V_in − V_o)/L = <b>${eng(m1,'A/s')}</b> (ON), m₂ = V_o/L = <b>${eng(m2,'A/s')}</b> (OFF), ράμπα m_a = <b>${eng(ma,'A/s')}</b></li>`;
 if(vl)h+=`<li>Valley: το ρολόι σβήνει τον S1 και ο συγκριτής τον ανάβει όταν i_L = i_c + m_a·t. Μια διαταραχή Δi της κορυφής γίνεται λ·Δi στην επόμενη περίοδο: λ = (m_a − m₁)/(m₂ + m_a) = <b>${fmt(lam,4)}</b></li>
  <li>Χωρίς ράμπα λ = −(1 − D)/D: ασταθές για D < 0,5, ο «καθρέφτης» του peak. Για αυτό το D σταθερό όταν m_a > (m₁ − m₂)/2 = <b>${eng(mamin,'A/s')}</b>, για κάθε D αρκεί m_a ≥ m₁/2</li>
  <li>Στη μόνιμη κατάσταση: κοιλάδα i_c + m_a·(1 − D)T = <b>${eng(Iv,'A')}</b>, κορυφή (στο ρολόι) κοιλάδα + m₁·D·T = <b>${eng(Ipk,'A')}</b></li>`;
 else h+=`<li>Μια διαταραχή Δi της κοιλάδας γίνεται λ·Δi στην επόμενη περίοδο: λ = (m_a − m₂)/(m₁ + m_a) = <b>${fmt(lam,4)}</b></li>
  <li>Χωρίς ράμπα λ = −D/(1 − D): ασταθές για D > 0,5. Για αυτό το D σταθερό όταν m_a > (m₂ − m₁)/2 = <b>${eng(mamin,'A/s')}</b>, για κάθε D αρκεί m_a ≥ m₂/2. Με m_a = m₂ ισχύει λ = 0 και η διαταραχή σβήνει σε έναν κύκλο</li>
  <li>Στη μόνιμη κατάσταση: Î = i_c − m_a·D·T = <b>${eng(Ipk,'A')}</b>, κοιλάδα Î − m₂(1 − D)T = <b>${eng(Iv,'A')}</b></li>
  <li>Στο μοντέλο μικρού σήματος (Ridley) η ίδια αστάθεια είναι ένα ζεύγος πόλων στο f_s/2 με Q = 1/(π(m_c(1 − D) − 0,5)), m_c = 1 + m_a/m₁: Q = <b>${Number.isFinite(Qp)&&Qp>0?fmt(Qp,3):'αρνητικό (ασταθές)'}</b>${Qp>2?' (μεγάλη συντονισμένη κορυφή, κοντά στο όριο)':''}</li>`;
 h+=`<li>Ο χάρτης «δείγμα στο ρολόι → επόμενο δείγμα» έχει δύο ευθύγραμμα κομμάτια: με κλίση λ όταν ο συγκριτής αλλάζει μέσα στην περίοδο, και με κλίση 1 όταν δεν αλλάζει (ολόκληρη περίοδος ON ή OFF). Με σταθερή τάση εξόδου (μπαταρία) αυτό δεν δίνει τη διαδοχή 2T → 4T: μόλις |λ| > 1 η λειτουργία γίνεται χαοτική. Δες τον χάρτη και το διάγραμμα στο «Διακλαδώσεις και Poincaré».</li></ul>`;
 h+=cmpRows(vl?[['κορυφή (στο ρολόι, τελευταία T)',stable?Ipk:NaN,pk.length?pk[pk.length-1].max:NaN,'A'],['κοιλάδα (τελευταία T)',stable?Iv:NaN,pk.length?pk[pk.length-1].min:NaN,'A'],['duty',stable?D:NaN,ds.length?ds[ds.length-1]:NaN,'']]
  :[['κορυφή Î (τελευταία T)',stable?Ipk:NaN,pk.length?pk[pk.length-1].max:NaN,'A'],['κοιλάδα (τελευταία T)',stable?Iv:NaN,pk.length?pk[pk.length-1].min:NaN,'A'],['⟨i_L⟩',stable?(Ipk+Iv)/2:NaN,pk.length?pk[pk.length-1].avg:NaN,'A'],['duty',stable?D:NaN,ds.length?ds[ds.length-1]:NaN,'']]);
 if(ds.length)h+=`<h4>Τελευταίες ${ds.length} περίοδοι</h4><p class="small">${esc(verdict)}</p><div class="wrap"><table class="cmp"><thead><tr><th>περίοδος</th>${ds.map((d,k)=>`<th>${k-ds.length+1||'τελ.'}</th>`).join('')}</tr></thead><tbody>
  <tr><td>duty</td>${ds.map(d=>`<td>${fmt(d,3)}</td>`).join('')}</tr><tr><td>κορυφή i_L</td>${pk.map(q=>`<td>${fmt(q.max,4)}</td>`).join('')}</tr></tbody></table></div>`;
 h+=`<p class="small muted">Η στιγμή που αλλάζει ο συγκριτής εντοπίζεται μέσα στο βήμα του λύτη. Ο λύτης δεν έχει ειδικό κώδικα για current-mode: είναι γενικά μπλοκ (ρολόι, latch, συγκριτής, άθροισμα${vl?', λογικές πύλες':''}). Ο λύτης SciPy στον server δίνει τις ίδιες κορυφές στη σταθερή περιοχή. Στην υποαρμονική συμφωνεί για δεκάδες περιόδους και μετά δίνει την ίδια συμπεριφορά αλλά όχι την ίδια ακολουθία: εκεί κάθε μικρή αριθμητική διαφορά μεγαλώνει κατά |λ| σε κάθε περίοδο.</p>`;
 return h+evalOrderHTML();}
// 3.3: the PI as Python code (and feedforward from an expression block): same rules as the PI block, so the same duty
function codeTheory(){const s=S.sim,m=S.tutMeta||{};if(!s||!m.fs||!editor.comp('AM1'))return '';const T=1/m.fs,Vin=+paramsOf('V1').V,Vo=+paramsOf('VO').V,D=Vo/Vin,dI=(Vin-Vo)*D*T/+paramsOf('L1').L;
 const i=s.now('Y:K1'),ia=avgOver('Y:AM1',5),dsim=avgOver('D:PWM1',5)?.avg,b=s.net.sig.blocks.find(x=>x.id==='PI1'),calls=b?.type==='PY'&&b.st.last!=null?b.st.last+1:NaN;
 const early=lastPeriods('Y:AM1',20000).find(q=>q.t>=5e-4-1e-12);
 let h=`<div class="tm"><span class="badge">${m.py?'PI σε Python':'PI διακριτός (μπλοκ)'}</span>${m.ff?' · feedforward d = u + v_o/v_in':''}</div><ul class="eqs">
  <li>${m.py?`Ο κώδικας εκτελείται στην αρχή κάθε περιόδου του PWM: ${Number.isFinite(calls)?`<b>${calls}</b> κλήσεις ως τώρα (t·f_s + 1)`:'μία κλήση ανά T'}. Η έξοδος u μένει σταθερή ως την επόμενη κλήση, όπως σε μικροελεγκτή. Python ${esc(PyRT.py?.version?'μέσω Pyodide '+PyRT.py.version:'')}`:'Το μπλοκ «PI διακριτός» κάνει τις ίδιες πράξεις με τον κώδικα Python του tutorial, άρα δίνει ακριβώς το ίδιο D.'}</li>
  <li>K_p = <b>${eng(m.kp)}</b>, K_i = <b>${eng(m.ki)}</b>, D = V_o/V_in = <b>${fmt(D,4)}</b>, Δi = <b>${eng(dI,'A')}</b>. Ο PI μετρά την κοιλάδα (αρχή περιόδου πριονωτού), άρα κοιλάδα = i_ref</li>
  <li>${m.ff?'Feedforward: το μπλοκ έκφρασης δίνει d = u + v_o/v_in από τα βολτόμετρα. Το D είναι σωστό από την πρώτη περίοδο και ο PI διορθώνει μόνο τις απώλειες και τα μεταβατικά (u ≈ 0 στη μόνιμη κατάσταση).':'Χωρίς feedforward ο ολοκληρωτής πρέπει να φτάσει μόνος του το D = V_o/V_in. Στην εκκίνηση το D είναι 0 και το ρεύμα πέφτει, ώσπου ο ολοκληρωτής να ανέβει.'}</li></ul>`;
 h+=cmpRows([['κοιλάδα i_L',i,ia?.min,'A'],['⟨i_L⟩ (τελευταίες 5 T)',i+dI/2,ia?.avg,'A'],['D',D,dsim,''],...(m.ff?[['κοιλάδα στα 0,5 ms (αρχική αναφορά)',m.i0,early?.min,'A']]:[])]);
 return h+evalOrderHTML();}
// 3.3.1: battery cell test: Z at the perturbation frequency from the Fourier series of v_cell and i_cell (last 2 periods of f)
function eisTheory(){const s=S.sim,m=S.tutMeta||{};if(!s||!m.fs||!editor.comp('KF'))return '';const f=+editor.comp('KF').params.v,T=s.T,P=2;
 if(s.t<P/f+.02)return '<p class="muted small">Τρέξε την προσομοίωση τουλάχιστον '+eng(P/f+.02,'s')+' για να μετρηθεί η εμπέδηση.</p>';
 const ser=k=>lastPeriods(k,Math.min(20000,Math.ceil(P/f/T)+3)).map(q=>({t:q.t-T/2,y:q.avg})),sv=ser('Y:VM1'),si=ser('Y:AM1');
 const z=Metrics.impedance({f,periods:P,tEnd:sv[sv.length-1].t,t:sv.map(q=>q.t),v:sv.map(q=>q.y),i:si.map(q=>q.y)}),zt=cellZ(f,false),zb=cellZ(f,true);if(!z.ok||!zt)return '';
 const R0=+paramsOf('R0').R,R1=+paramsOf('R1').R,C1=+paramsOf('C1').C,W=paramsOf('W1'),Lf=+paramsOf('LF').L,Co=+paramsOf('CO').C,soc=s.now('Y:SOC'),ocv=s.now('Y:EXO'),vci=avgOver('V:CI',20)?.avg,Vs=+paramsOf('V1').V;
 let h=`<div class="tm"><span class="badge">${m.rl?'εκφόρτιση στην R_L':'φόρτιση από V_S'}</span> f = ${eng(f,'Hz')} · I_dc = ${eng(m.Idc,'A')} · I_ac = ${eng(m.Iac,'A')}</div><ul class="eqs">
  <li>Μοντέλο κυψέλης: Z(jω) = R₀ + R₁/(1 + jωR₁C₁) + Z_W, με Z_W = σ(1 − j)/√ω. Ημικύκλιο με κορυφή στο f = 1/(2πR₁C₁) = <b>${eng(1/(2*Math.PI*R1*C1),'Hz')}</b>, Warburg στις 45° στις χαμηλές συχνότητες</li>
  <li>Στο ${eng(f,'Hz')}: Z = <b>${eng(zt[0],'Ω',4)} − j${eng(-zt[1],'Ω',4)}</b>, |Z| = ${eng(Math.hypot(...zt),'Ω',4)}, φάση ${fmt(Math.atan2(zt[1],zt[0])*180/Math.PI,3)}°. Το Warburg στον λύτη είναι ${(+W.N||16)} κλάδοι R–C: ${eng(zb[0],'Ω',4)} − j${eng(-zb[1],'Ω',4)}</li>
  <li>Μέτρηση: σειρά Fourier της τάσης και του ρεύματος της κυψέλης στις 2 τελευταίες περιόδους της f, Z = V₁/I₁. Η μέση τιμή ανά περίοδο μεταγωγής αφαιρεί την κυμάτωση και δεν αλλάζει τον λόγο</li>
  <li>OCV(SOC) από πίνακα: SOC = ${fmt(soc,5)}, OCV = ${eng(ocv,'V',4)}. Το SOC αλλάζει κατά I_dc·t/(3600·Q) = ${fmt(m.Idc*s.t/(3600*m.Qah)*100,3)} % σε ${eng(s.t,'s')}</li>
  <li>Φίλτρο L_f–C_o: συντονισμός στο ${eng(1/(2*Math.PI*Math.sqrt(Lf*Co)),'Hz')}, πολύ πάνω από τη διαταραχή. D ≈ v_cell/V_dc = ${fmt(s.now('Y:VM1')/(vci||Vs),3)}${m.rl?`. Στην εκφόρτιση η τάση του C_i ισορροπεί στο √(P·R_L) ≈ ${eng(Math.sqrt(Math.abs(m.Idc)*Math.abs(ocv)*m.RL),'V')} (μετρημένο ${eng(vci,'V')})`:''}</li></ul>`;
 h+=cmpRows([['Re Z',zt[0],z.re,'Ω'],['−Im Z',-zt[1],-z.im,'Ω'],['|Z|',Math.hypot(...zt),z.mag,'Ω'],['πλάτος I₁ (αναφορά I_ac)',m.Iac,z.I,'A'],['μέσο ρεύμα (ο PI κρατά το I_dc στο δείγμα της αρχής κάθε περιόδου, όχι στη μέση τιμή)',NaN,z.Idc,'A']]);
 return h+`<p class="small muted">Η σάρωση συχνότητας με διάγραμμα Nyquist και Bode είναι στο «Εμπέδηση (EIS)» πλάι στο scope. Το πλάτος του ρεύματος δεν είναι ακριβώς I_ac στις υψηλές συχνότητες (περιορισμένο εύρος ζώνης του βρόχου), αλλά το Z μετρά τον λόγο της τάσης προς το πραγματικό ρεύμα.</p>`+evalOrderHTML();}
// 3.4: induction machine (inverse-Γ). Steady state from the equivalent circuit: Z = R_s + jω₁L_σ + (jω₁L_M ‖ R_R/s)
const cx={add:(a,b)=>[a[0]+b[0],a[1]+b[1]],mul:(a,b)=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]],div:(a,b)=>{const d=b[0]*b[0]+b[1]*b[1];return [(a[0]*b[0]+a[1]*b[1])/d,(a[1]*b[0]-a[0]*b[1])/d];},abs:a=>Math.hypot(a[0],a[1])};
function imSteady(M,V1,f,TL){const w1=2*Math.PI*f,ws=w1/M.p,st=s=>{const zr=[M.RR/s,0],zm=[0,w1*M.LM],zp=cx.div(cx.mul(zm,zr),cx.add(zm,zr)),Z=cx.add([M.Rs,w1*M.Ls],zp),I=V1/cx.abs(Z),Pag=1.5*I*I*zp[0];return {I,te:Pag/ws,psi:I*cx.abs(zp)/w1};};
 // slip from τ_e(s) = τ_L + b·ω (bisection on the stable side)
 let a=1e-6,b=.3;for(let k=0;k<80;k++){const m=(a+b)/2,q=st(m),w=(1-m)*ws;if(q.te-(TL+M.b*w)>0)b=m;else a=m;}const sl=(a+b)/2,q=st(sl);return {sl,w:(1-sl)*ws,ws,...q};}
function imPar(){const p=paramsOf('M1');return p?{Rs:+p.Rs,RR:+p.RR,Ls:+p.Lsig,LM:+p.LM,p:Math.round(+p.pp),J:+p.J,b:+p.bm}:null;}
function phaseRms(key,T,n){const s=S.sim,i=s?.chIndex.get(key),p=s?.per;if(i===undefined||!p?.n)return NaN;n=Math.min(n,p.n);let q=0;for(let k=1;k<=n;k++){const j=(p.head-k+p.cap)%p.cap;q+=p.rms[j*p.nch+i]**2;}return Math.sqrt(q/n);}
function vfTheory(){const s=S.sim,m=S.tutMeta||{},M=imPar();if(!s||!M)return '';const Vdc=+paramsOf('V1').V,f=m.fn,Vref=m.Vn,T=s.T,nT=Math.round(1/(f*T));
 const mm=Vref/(Vdc/2),V1=m.mod==='square'?4/Math.PI*Vdc/2:m.mod==='spwm'?(mm<=1?Vref:Vdc/2*2/Math.PI*(mm*Math.asin(1/mm)+Math.sqrt(1-1/(mm*mm)))):Math.min(Vref,Vdc/Math.sqrt(3));
 const load=s.t>m.tTL+.15,ss=imSteady(M,V1,f,load?m.TL:0),irms=phaseRms('Y:AMa',T,nT*4);
 let h=`<div class="tm"><span class="badge">${m.mod==='svpwm'?'SVPWM':m.mod==='spwm'?'SPWM':'τετραγωνική'}</span> V/f, f_n = ${eng(f,'Hz')}, V_dc = ${eng(Vdc,'V')}</div><ul class="eqs">
  <li>Ανάστροφο-Γ: Z = R_s + jω₁L_σ + (jω₁L_M ‖ R_R/s), ροπή τ_e = (3/2)·p·|I|²·Re{jω₁L_M ‖ R_R/s}/(ω₁/p). Σύγχρονη ταχύτητα ω₁/p = <b>${eng(ss.ws,'rad/s')}</b></li>
  <li>Γραμμική περιοχή: πλάτος φάσης ως V_dc/2 = ${eng(Vdc/2,'V')} με SPWM, ως V_dc/√3 = ${eng(Vdc/Math.sqrt(3),'V')} με SVPWM (έγχυση −(max + min)/2). Τετραγωνική: 4/π·V_dc/2 = ${eng(4/Math.PI*Vdc/2,'V')}, χωρίς ρύθμιση πλάτους</li>
  <li>Στα ${eng(f,'Hz')} η αναφορά είναι ${eng(Vref,'V')}: θεμελιώδης <b>${eng(V1,'V')}</b>${m.mod==='spwm'&&mm>1?` (υπερδιαμόρφωση m = ${fmt(mm,4)}: κομμένο ημίτονο, V₁ = (V_dc/2)·(2/π)(m·asin(1/m) + √(1 − 1/m²)))`:''}</li>
  <li>Μόνιμη κατάσταση με τ_L = ${eng(load?m.TL:0,'N·m')}: ολίσθηση <b>${fmt(ss.sl*100,4)} %</b>, ω = ${eng(ss.w,'rad/s')}, |ψ_R| = ${eng(ss.psi,'V·s',4)}, I_rms = ${eng(ss.I/Math.SQRT2,'A')}</li></ul>`;
 if(s.t<.6)return h+'<p class="muted small">Τρέξε ως το τέλος για τη σύγκριση στη μόνιμη κατάσταση.</p>';
 h+=cmpRows([['ταχύτητα ω_m',ss.w,s.now('Y:M1'),'rad/s'],['|ψ_R|',ss.psi,s.now('Y:M1:psi'),'V·s'],['ρεύμα φάσης (RMS, 4 περίοδοι)',ss.I/Math.SQRT2,irms,'A'],['ροπή τ_e',(load?m.TL:0)+M.b*ss.w,avgOver('Y:M1:te',nT)?.avg,'N·m']]);
 return h+`<p class="small muted">Η θεωρία κρατά μόνο τη θεμελιώδη. Με SPWM σε υπερδιαμόρφωση και με τετραγωνική οι αρμονικές (5η, 7η…) δίνουν επιπλέον ρεύμα και κυμάτωση ροπής: δες το i_a στο «Αρμονικές». Οι τιμές της μηχανής είναι τυπικές.</p>`;}
// 3.4: field orientation with the current model. With R̂_R = k·R_R, in steady state the true rotor flux is
// ψ_R = L_M·(i_d + j·i_q)/(1 + j·k·i_q/i_d) in the estimated frame: |ψ_R| = L_M|i|/√(1 + (k·i_q/i_d)²), angle δ = atan(i_q/i_d) − atan(k·i_q/i_d)
function focTheory(){const s=S.sim,m=S.tutMeta||{},M=imPar();if(!s||!M)return '';const T=s.T,n=Math.round(.02/T),id=avgOver('Y:PK',n)?.avg,iq=avgOver('Y:PK:q',n)?.avg,k=m.k,w=s.now('Y:M1');
 const psiRef=m.psin*Math.min(1,m.wb/Math.max(Math.abs(m.wref),1)),idr=psiRef/M.LM,te=m.TL+M.b*m.wref,iqr=te/(1.5*M.p*psiRef),wsl=M.RR*iqr/psiRef,w1=M.p*m.wref+wsl;
 const us=w1*Math.hypot(M.Ls*iqr,psiRef+M.Ls*idr),Vlim=+paramsOf('V1').V/Math.sqrt(3);
 const psP=M.LM*Math.hypot(id,iq)/Math.sqrt(1+(k*iq/id)**2),dP=(Math.atan2(iq,id)-Math.atan2(k*iq,id))*180/Math.PI;let dM=(s.now('Y:M1:thf')-s.now('Y:FE'))*180/Math.PI;dM=((dM+180)%360+360)%360-180;
 let h=`<div class="tm"><span class="badge">διανυσματικός έλεγχος</span> ω_ref = ${eng(m.wref,'rad/s')}${m.wref>m.wb?' (εξασθένιση πεδίου)':''} · R̂_R = ${fmt(k,2)}·R_R</div><ul class="eqs">
  <li>Ροή αναφοράς ψ_ref = ψ_n·min(1, ω_b/ω) = <b>${eng(psiRef,'V·s',4)}</b>, i_d,ref = ψ_ref/L̂_M = <b>${eng(idr,'A')}</b></li>
  <li>Με τ_L = ${eng(m.TL,'N·m')}: τ_e = τ_L + b·ω = ${eng(te,'N·m')}, i_q = τ_e/((3/2)·p·ψ) = <b>${eng(iqr,'A')}</b>, ολίσθηση ω_sl = R_R·i_q/ψ = ${eng(wsl,'rad/s')}, ω₁ = ${eng(w1,'rad/s')}</li>
  <li>Τάση στάτη περίπου ω₁·√((L_σ·i_q)² + (ψ + L_σ·i_d)²) = ${eng(us,'V')}, όριο SVPWM V_dc/√3 = ${eng(Vlim,'V')}${us>Vlim?': δεν χωράει, χρειάζεται εξασθένιση':''}</li>
  <li>Κέρδη: ρεύματος K_p = α_c·L_σ = ${eng(m.kpc)}, K_i = α_c·(R_s + R_R) = ${eng(m.kic)} (α_c = 2π·300 Hz). Ταχύτητας K_p = α_s·J/k_t = ${eng(m.kps)}, K_i = ${eng(m.kis)} (α_s = 2π·8 Hz)</li>
  <li>Λάθος R̂_R = k·R_R: ο εκτιμητής βγάζει ολίσθηση k φορές την πραγματική. Στη μόνιμη κατάσταση |ψ_R| = L_M·|i|/√(1 + (k·i_q/i_d)²) και η γωνία της πραγματικής ροής απέχει δ = atan(i_q/i_d) − atan(k·i_q/i_d) από τον άξονα d του ελέγχου</li></ul>`;
 if(s.t<m.tTL+.5)return h+'<p class="muted small">Τρέξε ως το τέλος (1,5 s) για τη σύγκριση στη μόνιμη κατάσταση μετά το φορτίο.</p>';
 h+=cmpRows([['ταχύτητα ω_m',m.wref,w,'rad/s'],['i_d (πλαίσιο εκτιμητή)',idr,id,'A'],['i_q (πλαίσιο εκτιμητή)',k===1?iqr:NaN,iq,'A'],['|ψ_R| πραγματική, από τα μετρημένα i_d, i_q',psP,s.now('Y:M1:psi'),'V·s'],['σφάλμα γωνίας θ_f − θ̂ (°)',dP,dM,''],['ροπή τ_e',te,avgOver('Y:M1:te',n)?.avg,'N·m']]);
 return h+`<p class="small muted">Με k ≠ 1 ο βρόχος ταχύτητας αυξάνει ή μειώνει το i_q ώσπου να βγει η ροπή του φορτίου, αλλά με λάθος ροή: με k < 1 υπερμαγνήτιση, με k > 1 υπομαγνήτιση (εδώ χωρίς κορεσμό). Οι τιμές της μηχανής είναι τυπικές.</p>`+evalOrderHTML();}
// 3.5: synchronous reluctance machine. τ_e = K·i_d·i_q with K = (3/2)·p·(L_d − L_q); a current |i| at angle γ from d gives
// τ = K·|i|²·sin(2γ)/2, so the most torque per ampere at γ = 45° (MTPA, without saturation). Steady state at ω_e = p·ω:
// v_d = R·i_d − ω_e·L_q·i_q, v_q = R·i_q + ω_e·L_d·i_d, cos φ = (v_d·i_d + v_q·i_q)/(|v|·|i|) ≤ (ξ − 1)/(ξ + 1), ξ = L_d/L_q.
// Alignment: a current I on the α axis gives τ(δ) = −(3/4)·p·(L_d − L_q)·I²·sin 2δ (δ: electrical angle of d from α)
function synTheory(){const s=S.sim,m=S.tutMeta||{},M=paramsOf('M1');if(!s||!M||M.Ld===undefined)return '';
 const R=+M.Rs,Ld=+M.Ld,Lq=+M.Lq,p=Math.round(+M.pp),J=+M.J,b=+M.bm,K=1.5*p*(Ld-Lq),xi=Ld/Lq,pfMax=(xi-1)/(xi+1),T=s.T,deg=180/Math.PI;
 if(m.mode==='align'){const I=m.Va/R,tmax=.75*p*(Ld-Lq)*I*I,Kth=1.5*p*p*(Ld-Lq)*I*I,fn=Math.sqrt(Kth/J)/(2*Math.PI),psi=Ld*I,Kps=1.5*p*p*(1/Lq-1/Ld)*psi*psi,fps=Math.sqrt(Kps/J)/(2*Math.PI),th0=+m.th0,dF=Math.abs(((th0%360)+360)%360-180)<90?180:0;
  let h=`<div class="tm"><span class="badge">ευθυγράμμιση</span> σταθερό διάνυσμα v_α = ${eng(m.Va,'V')}, θ₀ = ${fmt(th0,3)}°</div><ul class="eqs">
   <li>Ρεύμα στον άξονα α: I = v_α/R_s = <b>${eng(I,'A')}</b> (φάση a: I, φάσεις b, c: −I/2). Με τον άξονα d του δρομέα σε γωνία δ: i_d = I·cos δ, i_q = −I·sin δ</li>
   <li>Ροπή μαγνητικής αντίστασης τ_e = (3/2)·p·(L_d − L_q)·i_d·i_q = <b>−(3/4)·p·(L_d − L_q)·I²·sin 2δ</b>, μέγιστη ${eng(tmax,'N·m')} στις 45°. Περίοδος 180° ηλεκτρικές: ο δρομέας δεν έχει «βόρειο» και «νότιο»</li>
   <li>Ισορροπίες: δ = 0° και 180° ευσταθείς (ο άξονας d, ελάχιστη μαγνητική αντίσταση, πάνω στο ρεύμα), δ = ±90° ασταθείς (ο άξονας q). Από θ₀ = ${fmt(th0,3)}° ο δρομέας πηγαίνει στις <b>${dF}°</b></li>
   <li>Μικρές ταλαντώσεις γύρω από το δ = 0 με <b>σταθερό ρεύμα</b> (τροφοδοσία ρεύματος): K_θ = (3/2)·p²·(L_d − L_q)·I² = ${eng(Kth,'N·m/rad')}, f = √(K_θ/J)/2π = <b>${eng(fn,'Hz')}</b></li>
   <li>Με <b>σταθερή ροή στάτη</b> ψ = L_d·I = ${eng(psi,'V·s')} (η ροή δεν προλαβαίνει να αλλάξει, L_d/R_s = ${eng(Ld/R,'s')}): τ = −(3/4)·p·(1/L_q − 1/L_d)·ψ²·sin 2δ, K_ψ = (3/2)·p²·(1/L_q − 1/L_d)·ψ² = ${eng(Kps,'N·m/rad')} = (L_d/L_q)·K_θ, f = <b>${eng(fps,'Hz')}</b></li>
   <li>Εδώ η τάση είναι σταθερή: η ταλάντωση είναι ανάμεσα στις δύο, πιο κοντά στη σταθερή ροή, και τα ρεύματα που επάγονται όταν αλλάζει η ροή τη φρενάρουν (ηλεκτρική απόσβεση)</li></ul>`;
  if(s.t<.8)return h+'<p class="muted small">Τρέξε ως το τέλος (1,2 s) για τη σύγκριση στη θέση ισορροπίας.</p>';
  // zero crossings of ω from the start; the frequency from the half periods after the first two (smaller swing)
  const w=perSamples('Y:M1','avg',Math.round(s.t/T)),cr=[];for(let k=1;k<w.length;k++)if(Math.sign(w[k])!==Math.sign(w[k-1])&&Math.abs(w[k]-w[k-1])>1e-6)cr.push(k*T);
  const hp=cr.slice(2,8).map((t,k,a)=>k?t-a[k-1]:null).filter(x=>x),fm=hp.length?1/(2*hp.reduce((x,y)=>x+y,0)/hp.length):NaN;
  const d=s.now('Y:DL')*deg,dd=dF===180?Math.abs(d):d;
  h+=cmpRows([['γωνία ισορροπίας |δ| (°)',dF,dd,''],['i_d = I·cos δ',dF===180?-I:I,s.now('Y:M1:id'),'A'],['i_q',0,s.now('Y:M1:iq'),'A'],['ροπή τ_e',0,s.now('Y:M1:te'),'N·m'],['συχνότητα ταλάντωσης (θεωρία: σταθερή ροή)',fps,fm,'Hz']]);
  return h+`<p class="small muted">Το I στην προσομοίωση είναι λίγο μικρότερο από v_α/R_s λόγω του R_on των διακοπτών. Η συχνότητα μετριέται από τις διελεύσεις του ω από το μηδέν, μετά τις δύο πρώτες (μεγάλη αρχική απόκλιση, μη γραμμικό εκκρεμές με sin 2δ). Βγαίνει ανάμεσα στα ${eng(fn,'Hz')} (σταθερό ρεύμα) και ${eng(fps,'Hz')} (σταθερή ροή): η ροή του στάτη αλλάζει λίγο μέσα σε μια περίοδο.</p>`;}
 // with a saturated d axis (3.6) ψ_d = f(i_d): τ = (3/2)·p·(f(i_d) − L_q·i_d)·i_q; the currents for each angle and the MTPA angle numerically
 const sq=M.sat==='d'?{Ld,Ldsat:+M.Ldsat,psik:+M.psikd}:null,fd=i=>sq?P.satD(sq,i).psi:Ld*i,tq=(a,c)=>1.5*p*(fd(a)-Lq*a)*c;
 const need=gg=>{const c=Math.cos(gg/deg),sn=Math.sin(gg/deg);let lo=0,hi=200;for(let k=0;k<80;k++){const mid=(lo+hi)/2;if(tq(mid*c,mid*sn)<te)lo=mid;else hi=mid;}return (lo+hi)/2;};
 const g=m.g,te=m.TL+b*m.wref,we=p*m.wref;let id,iq;if(g){const i=need(g);id=i*Math.cos(g/deg);iq=i*Math.sin(g/deg);}else{id=m.Id0;iq=te/(1.5*p*(fd(m.Id0)-Lq*m.Id0));}
 let gm=45,imtpa=Math.sqrt(2*te/K);if(sq){for(let a=30;a<=85;a+=.1){const i=need(a);if(i<imtpa){imtpa=i;gm=a;}}}
 const vd=R*id-we*Lq*iq,vq=R*iq+we*fd(id),vm=Math.hypot(vd,vq),im=Math.hypot(id,iq),pf=(vd*id+vq*iq)/(vm*im),gpf=Math.atan(Math.sqrt(xi))*deg,Vlim=+paramsOf('V1').V/Math.sqrt(3);
 let h=`<div class="tm"><span class="badge">έλεγχος dq</span> ${g?'γ = '+g+'°'+(g===45?' (MTPA)':''):'σταθερό i_d = '+eng(m.Id0,'A')} · ω_ref = ${eng(m.wref,'rad/s')}, τ_L = ${eng(m.TL,'N·m')} από ${eng(m.tTL,'s')}</div><ul class="eqs">
  <li>Ροπή τ_e = K·i_d·i_q, K = (3/2)·p·(L_d − L_q) = <b>${eng(K,'N·m/A²',4)}</b>. Με |i| σε γωνία γ από τον d: τ_e = K·|i|²·sin(2γ)/2, άρα <b>MTPA στις 45°</b>: |i| = √(2τ/K)${sq?' (χωρίς κορεσμό)':''}</li>
  ${sq?`<li><b>Με κορεσμό</b>: ψ_d = L_dsat·i_d + ψ_k·(1 − e^(−(L_d − L_dsat)·i_d/ψ_k)) με L_dsat = ${eng(sq.Ldsat,'H')}, ψ_k = ${eng(sq.psik,'V·s')}, και τ_e = (3/2)·p·(ψ_d − L_q·i_d)·i_q. Η L_d πέφτει με το ρεύμα, ο όρος (ψ_d − L_q·i_d) μεγαλώνει πιο αργά από το i_d, και η γωνία MTPA ανεβαίνει: <b>γ_MTPA = ${fmt(gm,3)}°</b> (αριθμητικά), με |i| = ${eng(imtpa,'A')}. Οι αναφορές του tutorial υπολογίζονται με το γραμμικό K: ο βρόχος ταχύτητας ζητά μεγαλύτερο τ* ώσπου να βγει η ροπή</li>`:''}
  <li>Αναφορές από τη ροπή τ* του βρόχου ταχύτητας: ${g?`|i| = √(2|τ*|/(K·sin 2γ)), i_d = |i|·cos γ, i_q = sign(τ*)·|i|·sin γ`:`i_d = ${eng(m.Id0,'A')}, i_q = τ*/(K·i_d) (η ροπή γραμμική ως προς i_q)`}</li>
  <li>Μόνιμη κατάσταση: τ_e = τ_L + b·ω = ${eng(te,'N·m')}, i_d = <b>${eng(id,'A')}</b>, i_q = <b>${eng(iq,'A')}</b>, |i| = <b>${eng(im,'A')}</b> (με MTPA${sq?' στις '+fmt(gm,3)+'°':''} ${eng(imtpa,'A')}, ${fmt(100*(im/imtpa-1),3)} % περισσότερο)</li>
  <li>Τάσεις στα ω_e = p·ω = ${eng(we,'rad/s')}: v_d = R·i_d − ω_e·L_q·i_q = ${eng(vd,'V')}, v_q = R·i_q + ω_e·${sq?'ψ_d':'L_d·i_d'} = ${eng(vq,'V')}, |v| = ${eng(vm,'V')} (όριο SVPWM ${eng(Vlim,'V')})</li>
  <li>Συντελεστής ισχύος cos φ = (v_d·i_d + v_q·i_q)/(|v|·|i|) = <b>${fmt(pf,3)}</b>. Το μέγιστο, χωρίς R_s${sq?' και χωρίς κορεσμό':''}, είναι (ξ − 1)/(ξ + 1) = ${fmt(pfMax,3)} με ξ = L_d/L_q = ${fmt(xi,3)}, στη γωνία γ = atan √ξ = ${fmt(gpf,3)}°: γι' αυτό η SynRM θέλει μεγάλο λόγο ξ</li>
  <li>Κέρδη: ρεύματος K_p = α_c·L_d = ${eng(m.kpd)} (d), α_c·L_q = ${eng(m.kpq)} (q), K_i = α_c·R_s = ${eng(m.kic)} (α_c = 2π·200 Hz), με αποσύζευξη −ω_e·L_q·i_q και +ω_e·L_d·i_d. Ταχύτητας K_p = α_s·J = ${eng(m.kps)}, K_i = α_s²·J/4 = ${eng(m.kis)} (α_s = 2π·8 Hz), έξοδος τ* ως ±${eng(m.taumax,'N·m')}</li></ul>`;
 if(s.t<m.tTL+.4)return h+'<p class="muted small">Τρέξε ως το τέλος για τη σύγκριση στη μόνιμη κατάσταση με φορτίο.</p>';
 const n=Math.round(.02/T),a=k=>avgOver(k,n)?.avg,ud=a('Y:EXUD'),uq=a('Y:EXUQ'),sid=a('Y:PK'),siq=a('Y:PK:q');
 const lead=we*T/2,dang=Math.atan2(uq,ud)-Math.atan2(vq,vd),spf2=Math.cos(Math.atan2(uq,ud)-lead-Math.atan2(siq,sid));
 h+=cmpRows([['ταχύτητα ω_m',m.wref,s.now('Y:M1'),'rad/s'],['i_d',id,sid,'A'],['i_q',iq,siq,'A'],['|i|',im,Math.hypot(sid,siq),'A'],['ροπή τ_e',te,a('Y:M1:te'),'N·m'],['|u| (εντολή)',vm,Math.hypot(ud,uq),'V'],
  ['προπορεία της εντολής ω_e·T/2 (°)',lead*deg,dang*deg,''],['cos φ',pf,spf2,'']]);
 return h+`<p class="small muted">Η σύγκριση είναι με μέσες τιμές στα τελευταία 20 ms. Οι τάσεις της προσομοίωσης είναι οι εντολές προς τον διαμορφωτή. Υπολογίζονται με τη γωνία στην αρχή της περιόδου, αλλά εφαρμόζονται κατά μέσο όρο στο μέσο της, όταν ο δρομέας έχει στραφεί κατά ω_e·T/2: γι' αυτό η εντολή προπορεύεται τόσο από τη θεωρία (το cos φ υπολογίζεται χωρίς αυτή την προπορεία). Χωρίς κορεσμό: στην πραγματική SynRM η L_d πέφτει με το ρεύμα και η γωνία MTPA ανεβαίνει πάνω από 45°. Οι τιμές της μηχανής είναι τυπικές.</p>`+evalOrderHTML();}
// 3.5: permanent-magnet synchronous machine. τ_e = (3/2)·p·(ψ_m·i_q + (L_d − L_q)·i_d·i_q); MTPA for a current amplitude i_s:
// i_d = (ψ_m − √(ψ_m² + 8·(L_q − L_d)²·i_s²))/(4·(L_q − L_d)) (from dτ/dγ = 0), i_q = √(i_s² − i_d²); i_d = 0 when L_d = L_q
function pmTheory(){const s=S.sim,m=S.tutMeta||{},M=paramsOf('M1');if(!s||!M||M.Ld===undefined)return '';
 const R=+M.Rs,Ld=+M.Ld,Lq=+M.Lq,pm=+M.psim,p=Math.round(+M.pp),b=+M.bm,dL=Lq-Ld,T=s.T,deg=180/Math.PI,te=m.TL+b*m.wref,we=p*m.wref,Vlim=+paramsOf('V1').V/Math.sqrt(3);
 const mtpa=i=>{if(Math.abs(dL)<1e-12)return [0,i];const d=(pm-Math.sqrt(pm*pm+8*dL*dL*i*i))/(4*dL);return [d,Math.sqrt(Math.max(i*i-d*d,0))];},tq=([d,q])=>1.5*p*(pm*q+(Ld-Lq)*d*q);
 let lo=0,hi=100;for(let k=0;k<100;k++){const mid=(lo+hi)/2;if(tq(mtpa(mid))<te)lo=mid;else hi=mid;}const [dM,qM]=mtpa((lo+hi)/2),q0=te/(1.5*p*pm);
 const [id,iq]=m.strat==='mtpa'?[dM,qM]:[0,q0],vd=R*id-we*Lq*iq,vq=R*iq+we*(Ld*id+pm),vm=Math.hypot(vd,vq),im=Math.hypot(id,iq),pf=(vd*id+vq*iq)/(vm*im);
 let h=`<div class="tm"><span class="badge">${Math.abs(dL)<1e-12?'SPMSM':'IPMSM'}</span> ${m.strat==='mtpa'?'MTPA':'i_d = 0'} · ω_ref = ${eng(m.wref,'rad/s')}, τ_L = ${eng(m.TL,'N·m')} από ${eng(m.tTL,'s')}</div><ul class="eqs">
  <li>Ροπή τ_e = (3/2)·p·(ψ_m·i_q + (L_d − L_q)·i_d·i_q): όρος μαγνήτη και όρος μαγνητικής αντίστασης. L_q − L_d = ${eng(dL,'H')}${dL>0?': αρνητικό i_d προσθέτει ροπή':': χωρίς ροπή μαγνητικής αντίστασης'}</li>
  <li>MTPA (από dτ/dγ = 0 για σταθερό |i|): i_d = (ψ_m − √(ψ_m² + 8·(L_q − L_d)²·i_s²))/(4·(L_q − L_d)), i_q = √(i_s² − i_d²)</li>
  <li>Μόνιμη κατάσταση με τ_e = τ_L + b·ω = ${eng(te,'N·m')}: MTPA i_d = <b>${eng(dM,'A')}</b>, i_q = <b>${eng(qM,'A')}</b>, |i| = <b>${eng(Math.hypot(dM,qM),'A')}</b>· με i_d = 0, i_q = τ/((3/2)·p·ψ_m) = <b>${eng(q0,'A')}</b></li>
  <li>Τάσεις στα ω_e = ${eng(we,'rad/s')}: v_d = R·i_d − ω_e·L_q·i_q = ${eng(vd,'V')}, v_q = R·i_q + ω_e·(L_d·i_d + ψ_m) = ${eng(vq,'V')}, |v| = ${eng(vm,'V')} (όριο ${eng(Vlim,'V')}), cos φ = <b>${fmt(pf,3)}</b></li>
  <li>Κέρδη ρεύματος όπως στη SynRM (α_c = 2π·200 Hz, αποσύζευξη με +ω_e·ψ_m στο u_q). Ταχύτητας K_p = α_s·J/k_t = ${eng(m.kps)}, K_i = ${eng(m.kis)} με k_t = (3/2)·p·ψ_m = ${eng(m.kt,'N·m/A',3)}, έξοδος i_s ως ±${eng(m.Imax,'A')}</li></ul>`;
 if(s.t<m.tTL+.4)return h+'<p class="muted small">Τρέξε ως το τέλος (1 s) για τη σύγκριση στη μόνιμη κατάσταση με φορτίο.</p>';
 const n=Math.round(.02/T),a=k=>avgOver(k,n)?.avg,ud=a('Y:EXUD'),uq=a('Y:EXUQ'),sid=a('Y:PK'),siq=a('Y:PK:q'),lead=we*T/2;
 h+=cmpRows([['ταχύτητα ω_m',m.wref,s.now('Y:M1'),'rad/s'],['i_d',id,sid,'A'],['i_q',iq,siq,'A'],['|i|',im,Math.hypot(sid,siq),'A'],['ροπή τ_e',te,a('Y:M1:te'),'N·m'],['|u| (εντολή)',vm,Math.hypot(ud,uq),'V'],
  ['cos φ',pf,Math.cos(Math.atan2(uq,ud)-lead-Math.atan2(siq,sid)),'']]);
 return h+`<p class="small muted">Μέσες τιμές στα τελευταία 20 ms. Το cos φ της προσομοίωσης αφαιρεί την προπορεία ω_e·T/2 της εντολής τάσης (όπως στη SynRM). Οι τιμές της μηχανής είναι τυπικές.</p>`+evalOrderHTML();}
// 3.6: switched reluctance machine. The energy per stroke is the area of the ψ–i loop of one phase over one electrical period, W = ∮ i dψ;
// N·N_r strokes per revolution give the mean torque N·N_r·W/(2π). Bound for a flat current I from unaligned to aligned: W′(π, I) − W′(0, I)
function srmTheory(){const s=S.sim,m=S.tutMeta||{},srm=s?.net.compInfo.get('M1')?.srm;if(!s||!srm)return '';const g=srm.g,N=srm.N,Nr=srm.Nr,b=srm.b;
 const w=s.now('Y:M1'),Te=w>1?2*Math.PI/(Nr*w):NaN,iref=s.now('Y:PIS'),Wb=P.srmCoenergy(g,Math.PI,iref)-P.srmCoenergy(g,0,iref),tb=N*Nr*Wb/(2*Math.PI);
 let h=`<div class="tm"><span class="badge">SRM ${N*2}/${Nr}</span> ${N} φάσεις · θ_on = ${m.on}°, θ_off = ${m.off}° (ηλεκτρικές) · ΔI = ${eng(m.band,'A')} · V_dc = ${eng(m.Vdc,'V')}</div><ul class="eqs">
  <li>Γωνία φάσης θ_e,k = N_r·θ − (k − 1)·360°/N: 0° μη ευθυγραμμισμένη, 180° ευθυγραμμισμένη. Βήμα (stroke) ${fmt(360/(N*Nr),3)}° μηχανικές, ${N*Nr} παλμοί ροπής ανά στροφή</li>
  <li>Ροπή φάσης τ = ∂W′/∂θ με W′(θ, i) = ∫₀ⁱ ψ(θ, i′) di′: θετική όσο η L μεγαλώνει (0° … 180°), αρνητική μετά την ευθυγράμμιση. Γι' αυτό το ρεύμα πρέπει να σβήσει πριν τις 180°</li>
  <li>Ενέργεια ανά παλμό: το εμβαδόν του βρόχου ψ–i, W = ∮ i dψ. Μέση ροπή <b>τ = N·N_r·W/(2π)</b></li>
  <li>Όριο με σταθερό ρεύμα I = i_ref = ${eng(iref,'A',3)} από τη μη ευθυγραμμισμένη ως την ευθυγραμμισμένη θέση: W′(180°, I) − W′(0°, I) = ${eng(Wb,'J',3)}, τ = <b>${eng(tb,'N·m',3)}</b></li>
  <li>Βρόχος ταχύτητας: K_p = α_s·J/K = ${eng(m.kps)}, K_i = α_s²·J/(4K) = ${eng(m.kis)} με K ≈ ${fmt(m.K,2)} N·m/A στο σημείο λειτουργίας (η ροπή της SRM αυξάνει περίπου με i², ο βρόχος δεν είναι γραμμικός). i_ref από 0 ως ${eng(m.Imax,'A')}: η μηχανή δεν φρενάρει</li></ul>`;
 if(s.t<m.tTL+.3||!(Te>0))return h+'<p class="muted small">Τρέξε ως το τέλος (0,8 s): ο βρόχος ψ–i και η σύγκριση γίνονται στη μόνιμη κατάσταση με το φορτίο.</p>';
 const ri=rawSeries('I:M1'),rp=rawSeries('PSI1:M1'),rt=rawSeries('Y:M1:te');if(!ri||!rp||!rt)return h;const t1=s.t-Te;
 let W=0,ta=0,tmin=Infinity,tmax=-Infinity,pts=[],imx=0;
 for(let k=1;k<ri.t.length;k++){if(ri.t[k-1]<t1)continue;W+=(ri.y[k]+ri.y[k-1])/2*(rp.y[k]-rp.y[k-1]);const dt=rt.t[k]-rt.t[k-1];ta+=dt*(rt.y[k]+rt.y[k-1])/2;tmin=Math.min(tmin,rt.y[k]);tmax=Math.max(tmax,rt.y[k]);pts.push([ri.y[k],rp.y[k]]);imx=Math.max(imx,ri.y[k]);}
 ta/=Te;const tl=N*Nr*W/(2*Math.PI);
 // ψ–i plane: magnetization curves at 0°, 90°, 180° and the loop of phase 1 over the last electrical period
 const Wd=440,Hd=220,Im=Math.max(1.25*imx,5),Pm=1.08*P.srmPsi(g,Math.PI,Im),X=i=>40+(Wd-50)*i/Im,Y=v=>Hd-24-(Hd-32)*v/Pm;
 const curve=th=>'M'+[...Array(61).keys()].map(k=>{const i=Im*k/60;return X(i).toFixed(1)+','+Y(P.srmPsi(g,th,i)).toFixed(1);}).join(' L');
 const step=Math.max(1,Math.floor(pts.length/600)),loop='M'+pts.filter((_,k)=>k%step===0).map(([i,v])=>X(i).toFixed(1)+','+Y(v).toFixed(1)).join(' L')+' Z';
 h+=`<svg class="bfchart" viewBox="0 0 ${Wd} ${Hd}" role="img" aria-label="Καμπύλες μαγνήτισης και βρόχος ψ–i της φάσης 1"><rect x="40" y="8" width="${Wd-50}" height="${Hd-32}" class="frame"/>
  ${[[0,'0° (μη ευθυγρ.)'],[Math.PI/2,'90°'],[Math.PI,'180° (ευθυγρ.)']].map(([th,l])=>`<path d="${curve(th)}" fill="none" stroke="#8a9a94" stroke-width="1"/><text x="${X(Im)-4}" y="${Y(P.srmPsi(g,th,Im))-4}" text-anchor="end">${l}</text>`).join('')}
  <path d="${loop}" fill="#0f766e" fill-opacity=".18" stroke="#0f766e" stroke-width="1.4"/>
  <text x="${(Wd+40)/2}" y="${Hd-4}" text-anchor="middle">i₁ (A), ως ${eng(Im,'A',3)}</text><text x="10" y="${Hd/2}" transform="rotate(-90 10 ${Hd/2})" text-anchor="middle">ψ₁ (V·s)</text></svg>`;
 h+=cmpRows([['μέση ροπή: από τον βρόχο N·N_r·W/(2π) ↔ μέση τ_e',tl,ta,'N·m'],['μέση ροπή: τ_L + b·ω ↔ μέση τ_e',m.TL+b*w,ta,'N·m'],['ταχύτητα ω',m.wref,w,'rad/s']]);
 return h+`<p class="small">Ενέργεια ανά παλμό W = ∮ i dψ = <b>${eng(W,'J',4)}</b> (περίοδος ${eng(Te,'s',3)}). Κυμάτωση ροπής ${eng(tmin,'N·m',3)} … ${eng(tmax,'N·m',3)}. i_ref = ${eng(iref,'A',3)}: με ιδανικό σταθερό ρεύμα από 0° ως 180° θα έδινε ${eng(tb,'N·m',3)}.</p>
  <p class="small muted">Ο βρόχος είναι η φάση 1 στην τελευταία ηλεκτρική περίοδο. Ξεκινά κοντά στην καμπύλη της μη ευθυγραμμισμένης θέσης όσο η φάση άγει με +V_dc, το ρεύμα κρατιέται στη ζώνη υστέρησης καθώς η L μεγαλώνει, και μετά το θ_off η ροή πέφτει με −V_dc. Οι τιμές της μηχανής είναι τυπικές.</p>`+evalOrderHTML();}
// 3.5: lightning current. From the waveform: peak, T1 = 1.25·(t90 − t10), T2 (virtual origin → 50 %), charge ∫i dt, specific energy ∫i² dt,
// steepest front di/dt and the peak of v = R·i + L·di/dt; from the simulation: the same on the recorded points and the per-period statistics
function lgTheory(){const s=S.sim,m=S.tutMeta||{},c=s?.net.compInfo.get('I1'),w=c?.wave,Rp=paramsOf('R1'),Lp=paramsOf('L1');if(!s||!w||!Rp||!Lp)return '';
 const R=+Rp.R,L=+Lp.L,me=P.waveMeasure(w),pk=Math.abs(w.I0),N=40000,t1=(m.dur||5*w.tau2)-w.t0;let Q=0,W=0,dmax=0,vmax=0,tp=0,y0=0;
 for(let k=1;k<=N;k++){const tt=w.t0+t1*Math.pow(k/N,3),ta=w.t0+t1*Math.pow((k-1)/N,3),y=P.waveAt(w,tt),h=tt-ta,d=(y-y0)/h;Q+=h*(y+y0)/2;W+=h*(y*y+y*y0+y0*y0)/3;
  if(Math.abs(d)>Math.abs(dmax))dmax=d;const v=R*(y+y0)/2+L*d;if(Math.abs(v)>Math.abs(vmax)){vmax=v;tp=tt;}y0=y;}
 let h=`<div class="tm"><span class="badge">${w.kind==='dexp'?'διπλοεκθετικό':'Heidler'}</span> I₀ = ${eng(w.I0,'A')} · τ₁ = ${eng(w.tau1,'s',4)}, τ₂ = ${eng(w.tau2,'s',4)}, η = ${fmt(w.eta,4)}${w.kind==='dexp'?'':', n = '+w.n}</div><ul class="eqs">
  <li>${w.kind==='dexp'?'i(t) = (I₀/η)·(e^(−t/τ₂) − e^(−t/τ₁))':'i(t) = (I₀/η)·(t/τ₁)ⁿ/(1 + (t/τ₁)ⁿ)·e^(−t/τ₂)'}, με η τέτοιο ώστε το μέγιστο να είναι I₀${m.shape==='custom'?'. Τα τ₁, τ₂ βρέθηκαν με Newton ώστε T1 = '+eng(w.T1,'s')+' και T2 = '+eng(w.T2,'s'):'. Τα τ₁, τ₂, η είναι του IEC 62305-1, Παράρτημα Β'}</li>
  <li>Χρόνος μετώπου T1 = 1,25·(t₉₀ − t₁₀) = <b>${eng(me.T1,'s',4)}</b>, χρόνος ημίσεος T2 = <b>${eng(me.T2,'s',4)}</b> (από την εικονική αρχή t₁₀ − 0,1·T1 ως το 50 % στην ουρά)</li>
  <li>Ως t = ${eng(t1+w.t0,'s')}: φορτίο Q = ∫i dt = <b>${eng(Q,'C',4)}</b>, ειδική ενέργεια W/R = ∫i² dt = <b>${eng(W,'J/Ω',4)}</b>${m.shape==='10/350'?' (IEC 62305-1, LPL I: 100 C και 10 MJ/Ω)':''}</li>
  <li>Μέγιστη κλίση di/dt = <b>${eng(dmax,'A/s',3)}</b>. Τάση v = R·i + L·di/dt με R = ${eng(R,'Ω')}, L = ${eng(L,'H')}: μέγιστη <b>${eng(vmax,'V',4)}</b> στο ${eng(tp,'s',3)}, ενώ μόνο το R·I₀ = ${eng(R*pk,'V')}</li></ul>`;
 if(s.t<m.dur*.98)return h+'<p class="muted small">Τρέξε ως το τέλος για τη σύγκριση.</p>';
 const raw=rawSeries('I:I1'),rv=rawSeries('V:I1');if(!raw||!rv)return h;const ts=raw.t,ys=raw.y;let yp=0,ip=0;for(let k=0;k<ys.length;k++)if(Math.abs(ys[k])>Math.abs(yp)){yp=ys[k];ip=k;}
 const cr=(lev,rise)=>{for(let k=1;k<ys.length;k++){const a=Math.abs(ys[k-1]),b=Math.abs(ys[k]),L0=lev*Math.abs(yp);if(rise?(k<=ip&&a<L0&&b>=L0):(k>ip&&a>L0&&b<=L0))return ts[k-1]+(L0-a)/(b-a)*(ts[k]-ts[k-1]);}return NaN;};
 const t10=cr(.1,true),t90=cr(.9,true),t50=cr(.5,false),T1=1.25*(t90-t10),T2=t50-(t10-.1*T1);
 const p=s.per,iI=s.chIndex.get('I:I1');let sq=0,sw=0;for(let k=0;k<p.n;k++){const j=(p.head-p.n+k+p.cap)%p.cap;sq+=p.avg[j*p.nch+iI]*s.T;sw+=p.rms[j*p.nch+iI]**2*s.T;}
 let vm=0;for(const v of rv.y)if(Math.abs(v)>Math.abs(vm))vm=v;
 h+=cmpRows([['μέγιστο ρεύμα',w.I0,yp,'A'],['T1',me.T1,T1,'s'],['T2',me.T2,T2,'s'],['φορτίο Q',Q,sq,'C'],['W/R',W,sw,'J/Ω'],['μέγιστη τάση',vmax,vm,'V']]);
 return h+`<p class="small muted">Από τα σημεία της προσομοίωσης (βήμα ${eng(s.h,'s')}). Q και W/R από τις στατιστικές ανά περίοδο (T = T1 της κυματομορφής), όσο το ιστορικό τις χωράει.</p>`;}
// 3.2: period doubling of the current-mode boost with an R–C load (Deane & Hamill): period from the samples at the clock
function chaosTheory(){const s=S.sim,m=S.tutMeta||{};if(!s||!m.fs||!editor.comp('IC'))return '';const x=perSamples('Y:AM1','end',200),q=Metrics.periodicity(x.slice(-100));
 if(x.length<20)return '<p class="muted small">Τρέξε την προσομοίωση μερικές δεκάδες περιόδους για να φανεί η περίοδος της λειτουργίας.</p>';
 const Vin=+paramsOf('V1').V,L=+paramsOf('L1').L,C=+paramsOf('C1').C,R=+paramsOf('R1').R,T=m.T,vo=avgOver('V:C1',20)?.avg,d=avgOver('Y:SR1',20)?.avg,m1=Vin/L,m2=Number.isFinite(vo)?(vo-Vin)/L:NaN;
 let h=`<div class="tm"><span class="badge ${q.period===1?'ccm':'dcm'}">${esc(periodText(q))}</span> i_c = ${eng(s.now('Y:IC'),'A')}</div><ul class="eqs">
  <li>Peak current-mode χωρίς ράμπα: το δείγμα του ρεύματος στο ρολόι (η κοιλάδα) ${q.period===1?'είναι ίδιο σε κάθε περίοδο':q.period>1?`επαναλαμβάνεται κάθε ${q.period} περιόδους: ${q.distinct.map(v=>eng(v,'A',4)).join(', ')}`:'δεν επαναλαμβάνεται: χαοτική λειτουργία (ή πολύ αργό μεταβατικό)'}</li>
  <li>Μέση τάση εξόδου ${eng(vo,'V')}, μέσο duty ${fmt(d,3)}. Κλίσεις m₁ = V_in/L = <b>${eng(m1,'A/s')}</b>, m₂ = (V_o − V_in)/L = <b>${eng(m2,'A/s')}</b></li>
  <li>Αν η τάση εξόδου ήταν σταθερή, ο χάρτης θα ήταν μονοδιάστατος με λ = −m₂/m₁ = <b>${fmt(-m2/m1,3)}</b>, ασταθής για D > 0,5. Εδώ RC = ${eng(R*C,'s')} = ${fmt(R*C/T,3)}·T: η τάση αλλάζει αισθητά μέσα σε λίγες περιόδους, ο χάρτης είναι δισδιάστατος (i_L, v_o) και ο πρώτος διπλασιασμός έρχεται νωρίτερα, γύρω στο D ≈ 0,4</li>
  <li>Με τις τιμές του tutorial, καθώς μεγαλώνει το i_c: 1T → 2T (περίπου 1,65 A) → 4T (2,37 A) → 8T (2,62 A) → χάος (2,70 A). Τα διαστήματα μικραίνουν, όπως στη διαδοχή του Feigenbaum. Επειδή ο χάρτης είναι κατά τμήματα ομαλός, ο λόγος των διαστημάτων δεν είναι ακριβώς 4,67</li></ul>`;
 h+=`<p class="small muted">Το διάγραμμα διακλάδωσης βγαίνει από το «Διακλαδώσεις και Poincaré» πλάι στο scope (σάρωση του i_c). Οι τιμές είναι του γνωστού παραδείγματος των Deane & Hamill (V_in = 10 V, L = 1 mH, C = 12 μF, R = 20 Ω, T = 100 μs).</p>`;
 return h+evalOrderHTML();}
// 3.1: DC machine drive. Ideal loops (exact feedforward, no delay): i/i_ref = α_c/(s + α_c); with active damping a load
// step gives ω = −(τ_L/J)·t·e^(−α_s t), with IMC ω = −τ_L/((Js + b)(s + α_s)), which recovers with J/b
function dcDriveTheory(){const s=S.sim,m=S.tutMeta||{};if(!s||!m.fs||!editor.comp('M1'))return '';const M=paramsOf('M1'),Ra=+M.Ra,La=+M.La,psi=+M.psi,J=+M.J,b=+M.bm,Vdc=+paramsOf('V1').V,T=1/m.fs;
 const per=k=>lastPeriods(k,20000).map(q=>({...q,tm:q.t-T/2}));const wNow=s.now('Y:M1'),iA=avgOver('Y:AM1',5)?.avg,dA=avgOver('D:PWM1',5)?.avg,tl=m.mode==='current'?0:(s.t>m.tTL?m.TL:0);
 const cross=(ps,t0,y0,y1)=>{const f=v=>(v-y0)/(y1-y0);let a=NaN,c=NaN;for(let k=1;k<ps.length;k++){const p0=ps[k-1],p1=ps[k];if(p1.tm<t0)continue;const g0=f(p0.avg),g1=f(p1.avg),at=x=>p0.tm+(x-g0)/(g1-g0)*(p1.tm-p0.tm);if(isNaN(a)&&g0<.1&&g1>=.1)a=at(.1);if(isNaN(c)&&g0<.9&&g1>=.9){c=at(.9);break;}}return c-a;};
 const wait=s.t<20*T?'<p class="small muted">Τρέξε την προσομοίωση για τη σύγκριση με τη θεωρία.</p>':'';
 const machine=`<li>Μηχανή: u_a = R_a·i_a + L_a·di_a/dt + ψ·ω, &nbsp;J·dω/dt = ψ·i_a − b·ω − τ_L. Στο κύκλωμα το μηχανικό μέρος είναι ισοδύναμο κύκλωμα: η τάση του κόμβου είναι το ω, ο πυκνωτής είναι το J, η αγωγιμότητα το b, η πηγή ρεύματος το τ_L, και ένας γυρατής ψ συνδέει τύμπανο και άξονα</li>`;
 let h=`<div class="tm"><span class="badge">${m.mode==='open'?'ανοιχτός βρόχος':m.mode==='current'?'βρόχος ρεύματος':'ταχύτητα σε σειρά με ρεύμα'}</span>${m.mode==='open'?'':m.act?' ενεργή αντίσταση και ενεργή απόσβεση':' IMC χωρίς ενεργούς όρους'}</div><ul class="eqs">`+machine;
 if(m.mode==='open'){const D=+paramsOf('PWM1').D,U=D*Vdc,sg=Ra/(2*La),wn=psi/Math.sqrt(La*J),wd=Math.sqrt(Math.max(wn*wn-sg*sg,0)),z=sg/wn,tp=Math.atan2(wd,sg)/wd,ip=U/(La*wd)*Math.exp(-sg*tp)*Math.sin(wd*tp);
  const w0=(U*psi-Ra*0)/(psi*psi+Ra*b),w1=(U*psi-Ra*m.TL)/(psi*psi+Ra*b),ps=per('Y:AM1'),ipk=ps.length?Math.max(...ps.map(q=>q.avg)):NaN,i1=(b*w1+m.TL)/psi;
  h+=`<li>Με σταθερή τάση U = D·V_dc = <b>${eng(U,'V')}</b> από την ηρεμία: i_a/U = (1/L_a)·s/(s² + (R_a/L_a)s + ψ²/(L_a J)), ω_n = ψ/√(L_a J) = <b>${eng(wn,'rad/s')}</b>, ζ = <b>${fmt(z,3)}</b>${z<1?' (υποαποσβεννύμενο: ταλάντωση ω και i)':''}</li>
   <li>Ρεύμα εκκίνησης: i(t) = U/(L_a ω_d)·e^(−σt)·sin(ω_d t), μέγιστο στο t = <b>${eng(tp,'s')}</b>: <b>${eng(ip,'A')}</b>, ${fmt(ip/i1,3)} φορές το ρεύμα με το φορτίο. Γι' αυτό χρειάζεται βρόχος ρεύματος (ή ράμπα τάσης)</li>
   <li>Μόνιμη κατάσταση: ω = (U·ψ − R_a·τ_L)/(ψ² + R_a·b): χωρίς φορτίο <b>${eng(w0,'rad/s')}</b>, με τ_L = ${eng(m.TL,'N·m')} <b>${eng(w1,'rad/s')}</b>. Η ταχύτητα πέφτει με το φορτίο, γιατί δεν υπάρχει βρόχος ταχύτητας</li></ul>`;
  if(wait)return h+wait;h+=cmpRows([['μέγιστο ⟨i_a⟩ στην εκκίνηση',ip,ipk,'A'],['ω στο τέλος',s.t>m.tTL?w1:w0,wNow,'rad/s'],['⟨i_a⟩ (τελευταίες 5 T)',s.t>m.tTL?i1:b*w0/psi,iA,'A']]);
  return h+`<p class="small muted">Η μικρή διαφορά στην ταχύτητα είναι η αντίσταση R_on των διακοπτών, που προστίθεται στην R_a.</p>`;}
 const tr=Math.log(9)/m.ac;
 h+=`<li>Βρόχος ρεύματος: u* = PI(i_ref − i_a) + Ê − R_a,ενεργ·i_a, με Ê = ψ̂·ω (feedforward). Εύρος ζώνης α_c = 2π·200 Hz = <b>${eng(m.ac,'rad/s')}</b>: K_p = α_c·L_a = <b>${eng(m.kpc)}</b>, ${m.act?`R_a,ενεργ = α_c·L_a − R_a = <b>${eng(m.Rac,'Ω')}</b>, K_i = α_c²·L_a = <b>${eng(m.kic)}</b>`:`K_i = α_c·R_a = <b>${eng(m.kic)}</b> (το μηδενικό του PI ακυρώνει τον πόλο R_a/L_a)`}</li>
  <li>Ιδανικά i_a/i_ref = α_c/(s + α_c): χρόνος ανόδου 10–90 % ln9/α_c = <b>${eng(tr,'s')}</b>. ${m.act?'Με την ενεργή αντίσταση ένα σφάλμα στο Ê σβήνει κι αυτό με α_c':`Χωρίς ενεργή αντίσταση ένα σφάλμα στο Ê σβήνει με R_a/L_a = ${eng(Ra/La,'rad/s')}, δηλαδή ${fmt(m.ac/(Ra/La),3)} φορές πιο αργά`}. Η καθυστέρηση δειγματοληψίας και PWM (περίπου 1,5·T) δίνει μικρή υπερύψωση</li>
  <li>Η ημιγέφυρα δίνει u ∈ [0, V_dc]: το ρεύμα αλλάζει φορά (πέδηση) αλλά η τάση όχι. Με u = 0 το ρεύμα πέφτει με di/dt = −(R_a·i + ψ·ω)/L_a. Ο κορεσμός είναι στο μπλοκ 0 … V_dc, άρα ο PI χρειάζεται back-calculation: tr = u_sat − u*, dx_i/dt = K_i·(e + tr/K_p)</li>`;
 if(m.mode==='current'){const ps=per('Y:AM1'),r=cross(ps,.005,0,10),ir=s.now('Y:KI'),Dth=(Ra*ir+psi*wNow)/Vdc;
  h+=`<li>Στη μόνιμη κατάσταση ⟨i_a⟩ = i_ref και D = (R_a·i_a + ψ·ω)/V_dc. Η ταχύτητα αυξάνει με dω/dt = (ψ·i_a − b·ω)/J = <b>${eng((psi*10)/J,'rad/s²')}</b> για i_a = 10 A</li></ul>`;
  if(wait)return h+wait;h+=cmpRows([['χρόνος ανόδου 10–90 % (βήμα 0 → 10 A)',tr,r,'s'],['⟨i_a⟩ (τελευταίες 5 T)',ir,iA,'A'],['D',Dth,dA,'']]);return h+evalOrderHTML();}
 const ta=J*m.wref/(psi*m.Imax),dt=s.t-m.tTL,aw=m.as,bJ=b/J;
 const dw=dt>0?(m.act?m.TL/J*dt*Math.exp(-aw*dt):m.TL/J*(Math.exp(-bJ*dt)-Math.exp(-aw*dt))/(aw-bJ)):0,wth=s.t>m.tw+ta+6/aw?m.wref-dw:NaN; // NaN while still accelerating
 const dpk=m.act?m.TL/(J*aw*Math.E):(()=>{const tp=Math.log(aw/bJ)/(aw-bJ);return m.TL/J*(Math.exp(-bJ*tp)-Math.exp(-aw*tp))/(aw-bJ);})();
 const ps=per('Y:M1'),pre=ps.filter(q=>q.tm<m.tTL),post=ps.filter(q=>q.tm>=m.tTL),wmax=pre.length?Math.max(...pre.map(q=>q.max)):NaN,wmin=post.length?Math.min(...post.map(q=>q.min)):NaN;
 h+=`<li>Βρόχος ταχύτητας: τ* = PI(ω_ref − ω) − b_a·ω, i_ref = τ_sat/ψ̂, με α_s = α_c/10 = <b>${eng(m.as,'rad/s')}</b>: K_p = α_s·J = <b>${eng(m.kps)}</b>, ${m.act?`b_a = α_s·J − b = <b>${eng(m.bac,'N·m·s')}</b>, K_i = α_s²·J = <b>${eng(m.kis)}</b>`:`K_i = α_s·b = <b>${eng(m.kis)}</b>`}. Το α_s ≤ α_c/10 κρατά τον εσωτερικό βρόχο «γρήγορο»: ο εξωτερικός τον βλέπει σχεδόν ως i_a = i_ref</li>
  <li>Επιτάχυνση με το όριο ψ̂·I_max = <b>${eng(psi*m.Imax,'N·m')}</b>: t ≈ J·ω_ref/(ψ·I_max) = <b>${eng(ta,'s')}</b>. Χωρίς anti-windup ο ολοκληρωτής θα φόρτωνε όλο αυτό το διάστημα και η ταχύτητα θα ξεπερνούσε πολύ το ω_ref</li>
  <li>Βήμα φορτίου τ_L: ${m.act?`(J·s² + (b + b_a + K_p)s + K_i) = J(s + α_s)², άρα ω = ω_ref − (τ_L/J)·t·e^(−α_s t), μέγιστη πτώση τ_L/(J·α_s·e) = <b>${eng(dpk,'rad/s')}</b> στο t = 1/α_s`:`ω = ω_ref − τ_L/((J·s + b)(s + α_s)): πτώση περίπου τ_L/(J·α_s) = <b>${eng(dpk,'rad/s')}</b>, που επανέρχεται με σταθερά χρόνου J/b = <b>${eng(J/b,'s')}</b>. Ο ολοκληρωτής K_i = α_s·b είναι σχεδόν ανύπαρκτος, γιατί η τριβή b είναι μικρή`}</li>
  <li>Μόνιμη κατάσταση: ω = ω_ref, i_a = (b·ω + τ_L)/ψ, u = R_a·i_a + ψ·ω, D = u/V_dc</li></ul>`;
 const ith=(b*wth+tl)/psi,uth=Ra*ith+psi*wth;
 if(wait)return h+wait;h+=cmpRows([['μέγιστη ω πριν από το φορτίο',m.wref,wmax,'rad/s'],...(s.t>m.tTL?[['ελάχιστη ω μετά το βήμα φορτίου',m.wref-dpk,wmin,'rad/s']]:[]),['ω τώρα',wth,wNow,'rad/s'],['⟨i_a⟩ (τελευταίες 5 T)',ith,iA,'A'],['D',uth/Vdc,dA,'']]);
 return h+`<p class="small muted">Οι θεωρητικές τιμές θεωρούν ιδανικό βρόχο ρεύματος (i_a = i_ref) και ακριβή feedforward. Οι παράμετροι της μηχανής είναι τυπικές τιμές.</p>`+evalOrderHTML();}
// traveling waves (3.8): the same problem by the method of characteristics (P.bewley), a lattice diagram, theory vs simulation
function twModel(){const s=S.sim,m=S.tutMeta||{},c=s?.net.compInfo.get('T1');if(!s||!c?.line||!m.dur)return null;const Z=c.line.Z,tau=c.line.tau;
 const RLp=paramsOf('RL'),RAp=paramsOf('RA'),book=m.case==='book';
 const RL=!book&&m.term==='short'?0:RLp?+RLp.R:Infinity,ta=book&&RAp?m.ta:null,par=(a,b)=>a===Infinity?b:a*b/(a+b);
 const g=R=>R===Infinity?1:(R-Z)/(R+Z),gL=t=>g(ta!==null&&t>=ta?par(RL,1e-3):RL);
 const w=m.src==='li'?s.net.compInfo.get('V1')?.wave:null,E=m.E,Ef=w?(t=>P.waveAt(w,t)):(()=>E);
 return {s,m,Z,tau,Rs:m.Rs,E,RL,ta,gL,w,book,bw:P.bewley({E:Ef,Rs:m.Rs,Z,tau,gL,tEnd:m.dur,M:w?400:200}),step:P.bewley({E:()=>E,Rs:m.Rs,Z,tau,gL,tEnd:Math.min(m.dur,9*tau),M:100})};}
function twLattice(q){const W=380,H=290,xa=70,xb=W-70,tmax=Math.min(q.m.dur,8*q.tau),y=t=>24+t/tmax*(H-44),z=1e-4*Math.abs(q.E),kv=v=>Math.abs(v)<z?'0':fmt(v/1e3,3);
 let h=`<svg class="lattice" viewBox="0 0 ${W} ${H}" role="img" aria-label="Διάγραμμα Bewley"><line x1="${xa}" y1="18" x2="${xa}" y2="${H-14}" class="ax"/><line x1="${xb}" y1="18" x2="${xb}" y2="${H-14}" class="ax"/>
  <text x="${xa}" y="12" text-anchor="middle" class="lb">A</text><text x="${xb}" y="12" text-anchor="middle" class="lb">B</text>`;
 for(let k=0;k*q.tau<=tmax+1e-15;k++)h+=`<text x="${(xa+xb)/2}" y="${y(k*q.tau)+3}" text-anchor="middle" class="tk">${k}τ</text>`;
 let n=0;for(const wv of q.step.waves){if(wv.t>tmax-1e-15||n>=14)break;n++;const t0=wv.t,t1=Math.min(t0+q.tau,tmax),x0=wv.dir>0?xa:xb,x1=wv.dir>0?xb:xa,fr=(t1-t0)/q.tau,xe=x0+(x1-x0)*fr;
  h+=`<line x1="${x0}" y1="${y(t0)}" x2="${xe}" y2="${y(t1)}" class="${wv.dir>0?'fw':'bw'}"/>`+(Math.abs(wv.amp)>.005*Math.abs(q.E)&&fr>.5?`<text x="${x0+(x1-x0)*(wv.dir>0?.3:.7)}" y="${y(t0+.3*q.tau)-3}" text-anchor="middle" class="am">${kv(wv.amp)}</text>`:'');}
 // end voltages after each change, at the sides
 const marks=(vt,x,anchor)=>{let out='',last=null;for(let k=0;k*q.tau<=tmax;k++){const v=vt((k+.5)*q.tau);if(last===null||Math.abs(v-last)>z){out+=`<text x="${x}" y="${y((k+.5)*q.tau)+3}" text-anchor="${anchor}" class="vv">${kv(v)}</text>`;last=v;}}return out;};
 h+=marks(q.step.vAt,xa-6,'end')+marks(q.step.vBt,xb+6,'start');if(q.ta!==null&&q.ta<tmax)h+=`<line x1="${xb-10}" y1="${y(q.ta)}" x2="${xb+10}" y2="${y(q.ta)}" class="arr"/>`;
 return h+'</svg>';}
function twTheory(){const q=twModel();if(!q)return '';const {s,m,Z,tau,Rs,E}=q,gs=(Rs-Z)/(Rs+Z),gl=q.gL(0),u=m.U,kv=(v,d=4)=>eng(v,'V',d);
 let h=`<div class="tm"><span class="badge">Bergeron</span> Z = ${eng(Z,'Ω',4)} · τ = ${eng(tau,'s',4)} · R_s = ${Rs?eng(Rs,'Ω',4):'0'} · ${q.RL===Infinity?'ανοιχτό άκρο':'R_L = '+eng(q.RL,'Ω',4)}${q.ta!==null?' · αλεξικέραυνο στο '+eng(q.ta,'s',3):''}</div><ul class="eqs">
  <li>Στη γραμμή ταξιδεύουν κύματα τάσης με ρεύμα i = ±v/Z. Στο άκρο με R: Γ = (R − Z)/(R + Z), διάθλαση δ = 1 + Γ.</li>
  <li>Γ_s = (R_s − Z)/(R_s + Z) = <b>${fmt(gs,4)}</b> · Γ_L = <b>${fmt(gl,4)}</b>${q.ta!==null?' (μετά το αλεξικέραυνο ≈ −1)':''} · πρώτο κύμα v⁺ = E·Z/(R_s + Z) = <b>${kv(E*Z/(Rs+Z))}</b>${q.book?` (E = 2u: η εναέρια γραμμή είναι ημιάπειρη, δ_A = 2Z_υ/(Z_ε + Z_υ) = ${fmt(2*Z/(Rs+Z),3)}, α_A = (Z_ε − Z_υ)/(Z_ε + Z_υ) = ${fmt(-gs,3)})`:''}</li>
  <li>Μέθοδος των χαρακτηριστικών, ανεξάρτητη από τον λύτη: a(t) = v⁺(t) + Γ_s·r(t − 2τ…), στο B f(t) = a(t − τ), r = Γ_L(t)·f, v_A = a + b, v_B = f + r.</li></ul>`;
 h+=`<div class="lat-wrap">${twLattice(q)}<p class="muted small">Διάγραμμα Bewley για βηματικό κύμα ${kv(E)}: κάθε γραμμή είναι ένα κύμα (kV), στα πλάγια οι τάσεις των άκρων μετά από κάθε άφιξη.${q.ta!==null?' Η κόκκινη γραμμή στο B είναι η στιγμή που ανάβει το αλεξικέραυνο: από εκεί ξεκινά νέο κύμα.':''}${q.w?' Η κρουστική 1,2/50 ακολουθεί το ίδιο διάγραμμα με τη μορφή της κυματομορφής.':''}</p></div>`;
 if(s.t<m.dur*.98)return h+'<p class="muted small">Τρέξε ως το τέλος για τη σύγκριση με την προσομοίωση.</p>';
 const sa=rawSeries('V:T1'),sb=rawSeries('V2:T1');if(!sa||!sb)return h;
 const at=(r,tq)=>{const t=r.t;let k=1;while(k<t.length&&t[k]<tq)k++;if(k>=t.length)return r.y[t.length-1];const f=(tq-t[k-1])/((t[k]-t[k-1])||1);return r.y[k-1]+(r.y[k]-r.y[k-1])*f;};
 const rows=[];
 if(!q.w){for(let j=0;j<4&&(2*j+1.5)*tau<m.dur;j++){const tq=(2*j+1.5)*tau;rows.push([`v_B στο ${fmt(2*j+1.5,3)}τ`,q.bw.vBt(tq),at(sb,tq),'V']);}
  for(let j=0;j<4&&(2*j+.5)*tau<m.dur;j++){const tq=(2*j+.5)*tau;rows.push([`v_A στο ${fmt(2*j+.5,3)}τ`,q.bw.vAt(tq),at(sa,tq),'V']);}
  if(q.ta!==null&&q.ta+.5*tau<m.dur)rows.push([`v_B μετά το αλεξικέραυνο (${eng(q.ta+.25*tau,'s',3)})`,q.bw.vBt(q.ta+.25*tau),at(sb,q.ta+.25*tau),'V']);}
 else{const pk=(arr,tt)=>{let mx=0,tm=0;for(let k=0;k<arr.length;k++)if(Math.abs(arr[k])>Math.abs(mx)){mx=arr[k];tm=tt[k];}return [mx,tm];};
  const [tb,ttb]=pk(q.bw.vB,q.bw.t),[sbm,stb]=pk(sb.y,sb.t),[tam]=pk(q.bw.vA,q.bw.t),[sam]=pk(sa.y,sa.t);
  rows.push(['κορυφή v_B',tb,sbm,'V'],['χρόνος κορυφής v_B',ttb,stb,'s'],['κορυφή v_A',tam,sam,'V']);for(const tq of [tau+2e-6,tau+20e-6,3*tau+5e-6])if(tq<m.dur)rows.push([`v_B στο ${eng(tq,'s',3)}`,q.bw.vBt(tq),at(sb,tq),'V']);}
 h+=cmpRows(rows);
 if(q.book&&!q.w){const U=x=>(Math.abs(x)<1e-4*u?'0':fmt(x/u,3))+'u',bt=tq=>q.bw.vBt(tq),atA=tq=>q.bw.vAt(tq);
  h+=`<h4>Σύγκριση με τη λύση του βιβλίου (15.4.9)</h4><table class="cmp"><thead><tr><th>Σημείο, στιγμή (βιβλίο)</th><th>Βιβλίο</th><th>Εδώ (ακριβής)</th></tr></thead><tbody>
   <tr><td>B, 0</td><td>0,3u</td><td>${U(bt(1.5*tau))}</td></tr><tr><td>B, 2τ</td><td>0,24u</td><td>${U(bt(3.5*tau))}</td></tr><tr><td>B, 4τ</td><td>0</td><td>${U(bt(5.5*tau))}</td></tr>
   <tr><td>A, −τ</td><td>0,57u</td><td>${U(atA(.5*tau))}</td></tr><tr><td>A, τ</td><td>0,19u</td><td>${U(atA(2.5*tau))}</td></tr><tr><td>A, 3τ</td><td>0,36u</td><td>${U(atA(4.5*tau))}</td></tr><tr><td>A, 5τ</td><td>0,29u</td><td>${U(atA(6.5*tau))}</td></tr></tbody></table>
   <p class="muted small">Στο βιβλίο το κύμα φτάνει στο B τη στιγμή 0, εδώ τη στιγμή τ = ${eng(tau,'s',3)} (οι στιγμές του βιβλίου είναι μετατοπισμένες κατά τ). Με το αλεξικέραυνο στα 3 μs της εκφώνησης συμπίπτουν οι δύο πρώτες τιμές σε κάθε άκρο. Οι επόμενες διαφέρουν, γιατί η λύση του βιβλίου:</p>
   <ul class="eqs"><li>υπολογίζει το B στο 2τ με α_B = −0,47, ενώ το A στο 3τ με το ίδιο κύμα ανακλασμένο με −1,</li><li>δεν περιλαμβάνει το κύμα που ξεκινά από το B τη στιγμή που ανάβει το αλεξικέραυνο.</li></ul>`;}
 return h;}
// surge arrester (3.9): U_A = U_res + 2·S·d/c while that stays below 2·U_res (exercise 15.5.3), against the simulation
function arTheory(){const s=S.sim,m=S.tutMeta||{},c=s?.net.compInfo.get('T1');if(!s||!c?.line||!m.dur)return '';const tau=c.line.tau,Z=c.line.Z,mov=s.net.compInfo.get('M1')?.main;
 const sa=rawSeries('V2:T1'),sb=rawSeries('V:T1'),si=mov?rawSeries('I:M1'):null,mx=r=>r?r.y.reduce((a,v)=>Math.max(a,v),-Infinity):NaN;
 const done=s.t>=m.dur*.98,vA=done?mx(sa):NaN,vB=done?mx(sb):NaN;
 let iEnd=NaN;if(done&&si){let a=0,w=0;for(let k=1;k<si.t.length;k++)if(si.t[k]>s.t-4*tau){const d=si.t[k]-si.t[k-1];a+=d*(si.y[k]+si.y[k-1])/2;w+=d;}iEnd=w>0?a/w:NaN;} // mean over the last 4τ: the line B–A rings
 // residual voltage: of the characteristic at the final current (E − U_res)/Z, found by fixed point
 let Ur=m.Ures;if(mov){for(let k=0;k<50;k++)Ur=mov.ch.inv((2*m.U-Ur)/Z);}
 const UA=mov?Math.min(Ur+2*m.S*tau,2*Ur):2*m.U,dmax=mov?(m.BIL-Ur)*m.c/(2*m.S):0;
 let h=`<div class="tm"><span class="badge">αλεξικέραυνο</span> S = ${eng(m.S*1e-6,'V/μs',3)} · d = ${eng(m.d,'m',4)} · τ = d/c = ${eng(tau,'s',4)} · Z = ${eng(Z,'Ω')} · BIL ${eng(m.BIL,'V')}</div><ul class="eqs">
  <li>Το κύμα ράμπας έρχεται από ημιάπειρη γραμμή: πηγή 2u πίσω από Z. Χωρίς αλεξικέραυνο, στο ανοιχτό άκρο A (Μ/Σ) γίνεται 2u.</li>
  ${mov?`<li>Παραμένουσα τάση στο τελικό ρεύμα (2u − U_res)/Z = ${eng((2*m.U-Ur)/Z,'A',4)}: U_res = <b>${eng(Ur,'V',4)}</b> (χαρακτηριστική του αλεξικέραυνου)</li>
  <li>Όταν το B κλειδώνει στο U_res, το A ανεβαίνει ακόμη για 2τ: U_A = U_res + 2·S·d/c = <b>${eng(Ur+2*m.S*tau,'V',4)}</b>${Ur+2*m.S*tau>2*Ur?`, όμως όχι πάνω από 2·U_res = <b>${eng(2*Ur,'V',4)}</b>: το αλεξικέραυνο άγει πριν επιστρέψει η ανάκλαση από το A`:''}</li>
  <li>Απόσταση προστασίας για BIL ${eng(m.BIL,'V')}: d_max = (BIL − U_res)·c/(2S) = <b>${eng(dmax,'m',4)}</b>${m.mov==='ideal'&&m.S===40e9?' (άσκηση 15.5.3: 217,5 m με U_res = 692 kV)':''}</li>`:''}</ul>`;
 if(!done)return h+'<p class="muted small">Τρέξε ως το τέλος για τη σύγκριση.</p>';
 const rows=[['μέγιστη τάση στον Μ/Σ (A)',UA,vA,'V']];if(mov)rows.push(['μέγιστη τάση στο αλεξικέραυνο (B)',Ur,vB,'V'],['ρεύμα αλεξικέραυνου (μέση τιμή στα τελευταία 4τ)',(2*m.U-Ur)/Z,iEnd,'A']);
 h+=cmpRows(rows)+`<p class="${vA<m.BIL?'good':'bad'}">${vA<m.BIL?'✓ Κάτω από τη στάθμη μόνωσης':'✗ Πάνω από τη στάθμη μόνωσης'} (${eng(vA,'V',4)} έναντι BIL ${eng(m.BIL,'V')}).</p>`;
 if(m.mov!=='ideal'&&mov)h+=`<p class="muted small">Με μαλακή χαρακτηριστική το B αρχίζει να κλειδώνει πριν από το U_res, οπότε το A μένει λίγο κάτω από τον τύπο, που υποθέτει ιδανικό αλεξικέραυνο.</p>`;
 if(m.S===40e9)h+=`<p class="muted small">Η άσκηση 15.5.3 δίνει την κλίση σε kA/μs και την παραμένουσα τάση ως ενδεικνυόμενη τιμή, αλλά στη λύση τις χρησιμοποιεί ως κλίση τάσης σε kV/μs και ως κορυφή. Εδώ είναι κλίση τάσης και κορυφές.</p>`;
 return h;}
// impulse parameters of a sampled wave (3.10): peak with parabolic interpolation; 'iec': T1 = (t₉₀ − t₃₀)/0,6 and T2 from the
// virtual origin t₃₀ − 0,3·T1 (IEC 60060-1); 'tp': time to peak and to half value from the true origin t0
function impulseMeasure(t,y,t0,basis){let k=0;for(let i=1;i<y.length;i++)if(y[i]>y[k])k=i;let tp=t[k],pk=y[k];
 if(k>0&&k<y.length-1){const a=y[k-1],b=y[k],c=y[k+1],h1=t[k]-t[k-1],h2=t[k+1]-t[k],d=a*h2-b*(h1+h2)+c*h1;if(Math.abs(h1-h2)<1e-9*h1&&d<0){const x=.5*(a-c)/(a-2*b+c);tp=t[k]+x*h1;pk=b-.25*(a-c)*x;}}
 const cross=(lv,i0,i1,dir)=>{for(let i=i0;dir>0?i<i1:i>i1;i+=dir){const a=y[i],b=y[i+dir];if((a-lv)*(b-lv)<=0&&a!==b)return t[i]+(lv-a)/(b-a)*(t[i+dir]-t[i]);}return NaN;};
 const t30=cross(.3*pk,0,k,1),t90=cross(.9*pk,0,k,1),t50=cross(.5*pk,k,y.length-1,1);
 if(basis==='tp')return {pk,tp,T1:tp-t0,T2:t50-t0};const T1=(t90-t30)/.6;return {pk,tp,T1,T2:t50-(t30-.3*T1)};}
function marxTheory(){const s=S.sim,m=S.tutMeta||{};if(!s||!m.n)return '';const P2=P.impulseRoots({R1:m.R1,R2:m.R2,C1:m.C1,C2:m.C2,pos:m.pos}),
  wm=P.waveMeasure({kind:'dexp',n:1,tau1:1/P2.a2,tau2:1/P2.a1,eta:1,I0:1,t0:0},m.basis),nV=m.n*m.V0,iec=m.basis!=='tp',T1n=iec?'T1 (IEC: 1,67·(t₉₀ − t₃₀))':'T_p (χρόνος κορυφής)',T2n=iec?'T2 (ημίσεως τιμής, από την εικονική αρχή)':'T2 (ημίσεως τιμής, από την αρχή)';
 const done=s.t>=m.dur*.98,v=done?rawSeries('V:C2'):null,q=v?impulseMeasure(v.t,v.y,m.tf,m.basis):null;
 let fired=0;if(done)for(let k=1;k<=m.n;k++){const g=rawSeries('I:SG'+k);if(g&&g.y.some(x=>Math.abs(x)>1e-3*nV/m.R1))fired++;}
 let h=`<div class="tm"><span class="badge">Marx</span> n = ${m.n} · V₀ = ${eng(m.V0,'V')} · C_κ = ${eng(m.Ck,'F')} · C₂ = ${eng(m.C2,'F')} · U_b = ${eng(m.Ub,'V')} · ${m.shape} μs</div><ul class="eqs">
  <li>Σε σειρά: C₁ = C_κ/n = <b>${eng(m.C1,'F',4)}</b> φορτισμένος στα n·V₀ = <b>${eng(nV,'V')}</b>, ενέργεια W = ½·C₁·(n·V₀)² = ${eng(.5*m.C1*nV*nV,'J',4)} (σχέσεις 3.42–3.44)</li>
  <li>R₁ = ${eng(m.R1,'Ω',4)} (μετώπου), R₂ = ${eng(m.R2,'Ω',4)} (ουράς)${m.pos==='gen'?` = n·r₂, r₂ = ${eng(m.rr,'Ω',4)}`:''}, R₃ = ${eng(m.R3,'Ω')} (φόρτισης, R₃ ≫ r₂)</li>
  <li>${m.pos==='gen'?'R₂ παράλληλα στο C₁ (τύπος β, 3.25)':'R₂ παράλληλα στο C₂ (τύπος α, 3.22)'}: α₁ = <b>${fmt(P2.a1,5)} s⁻¹</b>, α₂ = <b>${fmt(P2.a2,5)} s⁻¹</b> (ρίζες της s² + a·s + b = 0, 3.29)</li>
  <li>v(t) = n·V₀/(R₁C₂)·(e^(−α₁t) − e^(−α₂t))/(α₂ − α₁) (3.28), κορυφή στο t₁ = ln(α₂/α₁)/(α₂ − α₁) = ${eng(P2.t1,'s',4)} (3.31)</li>
  <li>Βαθμός απόδοσης η = V_p/(n·V₀) = <b>${fmt(P2.eta,4)}</b> (3.32). Προσέγγιση C₁/(C₁ + C₂) = ${fmt(m.C1/(m.C1+m.C2),4)} (3.33)</li></ul>`;
 if(!m.feas)h+=`<p class="warn-text">Με R₂ στην έξοδο και C₁/C₂ = ${fmt(m.C1/m.C2,3)} δεν υπάρχουν R₁, R₂ που να δίνουν ${m.shape} μs. Εδώ μπήκαν οι τιμές της σχεδίασης με R₂ στη γεννήτρια, και η κάρτα δείχνει τι κυματομορφή δίνουν.</p>`;
 if(!done)return h+'<p class="muted small">Τρέξε ως το τέλος για τη σύγκριση.</p>';
 h+=cmpRows([['κορυφή V_p',P2.eta*nV,q.pk,'V'],[T1n,wm.T1,q.T1,'s'],[T2n,wm.T2,q.T2,'s'],['βαθμός απόδοσης η',100*P2.eta,100*q.pk/nV,'%']]);
 h+=`<p class="${fired===m.n?'good':'bad'}">${fired===m.n?'✓ Άναψαν και οι '+m.n+' σπινθηριστές.':'✗ Άναψαν '+fired+' από τους '+m.n+' σπινθηριστές: η γεννήτρια δεν εκφορτίστηκε πλήρως.'}</p>`;
 return h+`<p class="muted small">Η θεωρία αγνοεί τις R₃ και την αντίσταση τόξου των διακένων (${eng(.1,'Ω')} το καθένα).</p>`;}
// chopped impulse: the chopping time and voltage from the generator wave (3.28). After the chop the circuit is linear with three
// states (C₁ with R₂, R₁, C₂, the loop L_c–R with R = R_c + R_arc), integrated here with RK4 from v₁(t_c), v₂(t_c), i = 0. For insight,
// with C₁ held: u'' + 2α·u' + ω₀²·u = 0, 2α = 1/(R₁C₂) + R/L_c, ω₀² = (1 + R/R₁)/(L_c·C₂), about v∞ = V₁·R/(R₁ + R)
function chopModel(m){const g=P.impulseRoots({R1:m.R1,R2:m.R2,C1:m.C1,C2:m.C2,pos:'gen'}),K=m.V/(m.R1*m.C2*(g.a2-g.a1)),v2=t=>K*(Math.exp(-g.a1*t)-Math.exp(-g.a2*t)),dv2=t=>K*(g.a2*Math.exp(-g.a2*t)-g.a1*Math.exp(-g.a1*t));
 let tc=m.tc-m.tf,vc;if(m.chop==='front'){let lo=0,hi=g.t1;for(let k=0;k<200;k++){const x=(lo+hi)/2;if(v2(x)<m.Uc)lo=x;else hi=x;}tc=(lo+hi)/2;vc=m.Uc;}else vc=v2(tc);
 const V1=v2(tc)+m.R1*m.C2*dv2(tc),R=m.Rc+m.Rarc,vinf=V1*R/(m.R1+R),al=(1/(m.R1*m.C2)+R/m.Lc)/2,w0=Math.sqrt((1+R/m.R1)/(m.Lc*m.C2)),wd=Math.sqrt(Math.max(w0*w0-al*al,0));
 const f=([a,b,i])=>[(-a/m.R2-(a-b)/m.R1)/m.C1,((a-b)/m.R1-i)/m.C2,(b-R*i)/m.Lc],T=1.5*2*Math.PI/w0,N=6000,h=T/N;let x=[V1,vc,0],vmin=vc,vmax=vc;
 for(let k=0;k<N;k++){const k1=f(x),k2=f(x.map((q,j)=>q+h/2*k1[j])),k3=f(x.map((q,j)=>q+h/2*k2[j])),k4=f(x.map((q,j)=>q+h*k3[j]));x=x.map((q,j)=>q+h/6*(k1[j]+2*k2[j]+2*k3[j]+k4[j]));vmin=Math.min(vmin,x[1]);vmax=Math.max(vmax,x[1]);}
 return {g,tc:tc+m.tf,vc,V1,R,vinf,al,w0,wd,vmin,vmax,full:g.eta*m.V};}
function chopTheory(){const s=S.sim,m=S.tutMeta||{};if(!s||!m.V)return '';const q=chopModel(m),done=s.t>=m.dur*.98,v=done?rawSeries('V:C2'):null;
 let h=`<div class="tm"><span class="badge">αποκοπή</span> C₁ = ${eng(m.C1,'F')} στο ${eng(m.V,'V')} · R₁ = ${eng(m.R1,'Ω',4)} · R₂ = ${eng(m.R2,'Ω',4)} · C₂ = ${eng(m.C2,'F')} · L_c = ${eng(m.Lc,'H')} · R_c = ${eng(m.Rc,'Ω')}</div><ul class="eqs">
  <li>Πλήρες κύμα 1,2/50: κορυφή η·V = <b>${eng(q.full,'V',4)}</b> (σχέσεις 3.28–3.32)</li>`;
 if(m.chop==='none'){if(!done)return h+'</ul><p class="muted small">Τρέξε ως το τέλος για τη σύγκριση.</p>';let mx=-Infinity;for(const y of v.y)mx=Math.max(mx,y);return h+'</ul>'+cmpRows([['κορυφή',q.full,mx,'V']]);}
 h+=`<li>Αποκοπή ${m.chop==='front'?'στο μέτωπο, όταν v = U_b':'στην ουρά, με εντολή'}: t_c = <b>${eng(q.tc,'s',4)}</b> (από την έναυση της γεννήτριας: ${eng(q.tc-m.tf,'s',4)}), v_c = <b>${eng(q.vc,'V',4)}</b></li>
  <li>Μετά την αποκοπή: L_c, R = R_c + R_τόξου = ${eng(q.R,'Ω',3)} και C₂, με απόσβεση και από την R₁: α = ½·(1/(R₁C₂) + R/L_c) = ${fmt(q.al,4)} s⁻¹, ω₀ = ${fmt(q.w0,4)} rad/s, f = ω_d/2π = ${eng(q.wd/2/Math.PI,'Hz',4)}</li>
  <li>Η τάση ταλαντώνεται γύρω από v_∞ = V₁·R/(R₁ + R) = ${eng(q.vinf,'V',3)} (V₁ = ${eng(q.V1,'V',4)} η τάση του C₁ στο t_c). Ελάχιστη τάση από τη λύση του γραμμικού κυκλώματος (C₁–R₂, R₁, C₂, L_c–R): <b>${eng(q.vmin,'V',4)}</b>, υπερύψωση αντίθετης πολικότητας <b>${fmt(-100*q.vmin/q.vc,3)} %</b> της v_c</li>
  <li>Κρίσιμη απόσβεση του βρόχου (χωρίς R₁): R = 2·√(L_c/C₂) = ${eng(2*Math.sqrt(m.Lc/m.C2),'Ω',3)}</li></ul>`;
 if(!done)return h+'<p class="muted small">Τρέξε ως το τέλος για τη σύγκριση.</p>';
 let mx=-Infinity,tm=0,mn=Infinity;for(let i=0;i<v.y.length;i++){if(v.y[i]>mx){mx=v.y[i];tm=v.t[i];}if(v.t[i]>q.tc)mn=Math.min(mn,v.y[i]);}
 const gi=rawSeries('I:SG2'),j=gi?gi.y.findIndex(x=>Math.abs(x)>1):-1,tcS=j>0?gi.t[j-1]:NaN,ok=-mn/q.vc<=.3; // the chop: the last sample before the gap carries current
 h+=cmpRows([['στιγμή αποκοπής t_c',q.tc,tcS,'s'],['μέγιστη τάση (το C₂ φορτίζεται λίγο ακόμη μετά την αποκοπή)',q.vmax,m.chop==='front'?mx:NaN,'V'],['ελάχιστη τάση μετά την αποκοπή',q.vmin,mn,'V']].filter(r=>Number.isFinite(r[2])));
 return h+`<p class="${ok?'good':'bad'}">${ok?'✓':'✗'} Υπερύψωση ${fmt(-100*mn/q.vc,3)} % της τάσης αποκοπής (IEC 60076-3: έως 30 %).</p><p class="muted small">Η θεωρία αγνοεί την αντίσταση τόξου του G1 (${eng(.1,'Ω')}).</p>`;}
// 3.11: a table with three columns for each quantity: the book's value (or its approximate formula), the exact solution and the simulation
function cmp3(rows){const pc=(a,b)=>{if(!(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(b)>1e-30))return '';let d=100*(a/b-1);if(Math.abs(d)<1e-9)d=0;return `<td class="${Math.abs(d)<2?'good':Math.abs(d)<10?'':'warn-text'}">${fmt(d,3)} %</td>`;};
 return `<table class="cmp"><thead><tr><th>Μέγεθος</th><th>Βιβλίο</th><th>Ακριβής λύση</th><th>Προσομοίωση</th><th>βιβλίο ↔ ακριβής</th><th>προσομ. ↔ ακριβής</th></tr></thead><tbody>${rows.map(([n,bk,ex,sm,u])=>
  `<tr><td>${n}</td><td>${Number.isFinite(bk)?eng(bk,u,4):'—'}</td><td>${eng(ex,u,4)}</td><td>${Number.isFinite(sm)?eng(sm,u,4):'—'}</td>${pc(bk,ex)||'<td></td>'}${pc(sm,ex)||'<td></td>'}</tr>`).join('')}</tbody></table>`;}
// the exact two-exponential wave of a single-stage equivalent (book 3.21–3.32): roots, efficiency, T1 and T2 (IEC 60060-1)
function hvExact(R1,R2,C1,C2,pos){const g=P.impulseRoots({R1,R2,C1,C2,pos}),w=P.waveMeasure({kind:'dexp',n:1,tau1:1/g.a2,tau2:1/g.a1,eta:1,I0:1,t0:0},'iec');return {...g,T1:w.T1,T2:w.T2};}
function hv153Theory(){const s=S.sim,m=S.tutMeta||{};if(!s||!m.ex)return '';const b=m.book||{},gen=m.pos==='gen',C1=m.C1,C2=m.C2,U=m.U,ex=hvExact(m.R1,m.R2,C1,C2,m.pos);
 const ser=C1*C2/(C1+C2),par=m.R1*m.R2/(m.R1+m.R2),ap={eta:C1/(C1+C2),T1:2.96*(gen?m.R1:par)*ser,T2:.73*(gen?m.R2:m.R1+m.R2)*(C1+C2)};
 const done=s.t>=m.dur*.98,v=done?rawSeries('V:'+m.out):null,q=v?impulseMeasure(v.t,v.y,m.tf,'iec'):null,kd=m.div?(m.div[0]+m.div[1])/m.div[0]:0;
 let h=`<div class="tm"><span class="badge">${esc(m.ex.replace(/^(\d\d)(\d)(\d)/,'$1.$2.$3'))}</span> ${esc(m.t)}</div><ul class="eqs">
  <li>${m.marx?`Marx ${m.marx} βαθμίδων: σε σειρά C_κ = C′_κ/${m.marx} = <b>${eng(C1,'F',4)}</b> στα ${m.marx}·${eng(m.U0,'V')} = <b>${eng(U,'V')}</b>, R_μ = ${eng(m.R1,'Ω',4)}, R_ε = ${eng(m.R2,'Ω',4)}`:`C_κ = ${eng(C1,'F',4)} στα <b>${eng(U,'V',4)}</b>, R_μ = ${eng(m.R1,'Ω',5)}, R_ε = ${eng(m.R2,'Ω',5)}, κύκλωμα ${gen?'β (R_ε παράλληλα στο C_κ)':'α (R_ε παράλληλα στο φορτίο)'}`}</li>
  <li>Φορτίο C_φ,ολ = ${m.loads.map(q=>esc(q[0])+' '+eng(q[1],'F',4)).join(' + ')}${m.div?` + καταμεριστής C_H·C_L/(C_H + C_L) = ${eng(m.Cd,'F',4)}`:''} = <b>${eng(C2,'F',4)}</b></li>
  <li>Τύποι του βιβλίου: η ≈ C_κ/(C_κ + C_φ) = ${fmt(ap.eta,4)}, T1 ≈ 2,96·${gen?'R_μ':'(R_μ∥R_ε)'}·C_κC_φ/(C_κ + C_φ) = ${eng(ap.T1,'s',4)}, T2 ≈ 0,73·${gen?'R_ε':'(R_ε + R_μ)'}·(C_κ + C_φ) = ${eng(ap.T2,'s',4)}</li>
  <li>Ακριβής λύση: α₁ = ${fmt(ex.a1,5)} s⁻¹, α₂ = ${fmt(ex.a2,5)} s⁻¹, κορυφή στο t₁ = ${eng(ex.t1,'s',4)}, η = <b>${fmt(ex.eta,4)}</b>. Η διαφορά από τους τύπους: η R_ε εκφορτίζει το C_κ όσο φορτίζεται το C_φ, και ${gen?'η R_μ':'η R_ε'} δεν είναι αμελητέα</li></ul>`;
 if(!done)return h+'<p class="muted small">Τρέξε ως το τέλος για τη σύγκριση με την προσομοίωση.</p>';
 const rows=[['κορυφή V_p',b.Vp??ap.eta*U,ex.eta*U,q.pk,'V'],['βαθμός απόδοσης η',100*(b.eta??ap.eta),100*ex.eta,100*q.pk/U,'%'],['T1 (IEC 60060-1)',b.T1??ap.T1,ex.T1,q.T1,'s'],['T2 (IEC 60060-1)',b.T2??ap.T2,ex.T2,q.T2,'s']];
 if(b.tp)rows.push(['χρόνος κορυφής',b.tp,ex.t1,q.tp-m.tf,'s']);
 if(m.div){const lv=rawSeries('V:CL'),vl=lv?Math.max(...lv.y):NaN;rows.push(['τάση βραχίονα ΧΤ (λόγος '+fmt(kd,4)+')',b.Vlv??NaN,ex.eta*U/kd,vl,'V']);}
 if(b.W)rows.push(['ενέργεια ½·C_κ·U²',b.W,.5*C1*U*U,NaN,'J']);
 h+=cmp3(rows);const notes=[];
 if(m.lim){const ok=(x,[a,c])=>x>=a&&x<=c,o1=ok(ex.T1,m.lim.T1),o2=ok(ex.T2,m.lim.T2);
  notes.push(`<p class="${o1&&o2?'good':'bad'}">Όρια της δοκιμής: T1 ${eng(m.lim.T1[0],'s')}–${eng(m.lim.T1[1],'s')} ${o1?'✓':'✗'}, T2 ${eng(m.lim.T2[0],'s')}–${eng(m.lim.T2[1],'s')} ${o2?'✓':'✗'}. ${o1&&o2?'Η δοκιμή είναι έγκυρη.':'Η δοκιμή δεν είναι έγκυρη.'}</p>`);}
 if(m.ex==='1533'){const vl=ex.eta*U/kd;notes.push(`<p class="${vl>600?'bad':'good'}">Βραχίονας ΧΤ: ${eng(vl,'V',4)} (ακριβής). ${vl>600?'Κανένας παλμογράφος ως 600 V δεν αρκεί: το συμπέρασμα του βιβλίου ισχύει, με 1001 V αντί για 1069 V.':'Αρκεί παλμογράφος '+Math.ceil(vl/100)*100+' V.'}</p>`);}
 if(m.ex==='1535'){const T1x=Cx=>hvExact(m.R1,m.R2,C1,C2-.254e-9+Cx,'gen').T1;let lo=0,hi=5e-9;for(let k=0;k<60;k++){const x=(lo+hi)/2;if(T1x(x)<1.56e-6)lo=x;else hi=x;}
  const Uac=175e3/(ex.eta*2*Math.SQRT2);notes.push(`<p>Μέγιστο δοκίμιο για T1 ≤ 1,56 μs: <b>${eng(lo,'F',4)}</b> με την ακριβή λύση (βιβλίο ${eng(b.Cx,'F',3)}).</p>
   <p class="${q.pk>=175e3?'good':'bad'}">Κορυφή με U_ac = 66,5 kV: ${eng(q.pk,'V',4)} ${q.pk>=175e3?'≥':'<'} 175 kV. Για 175 kV χρειάζεται U_ac = <b>${eng(Uac,'V',4)}</b> (βιβλίο 66,5 kV, με η = C_κ/(C_κ + C_φ)).</p>`);}
 if(m.ex.startsWith('1536')){const R1c=1.2e-6/(2.96*ser);notes.push(`<p class="${m.ex==='1536'?'bad':'good'}">Το βιβλίο γράφει R_μ = 44,59 Ω. Από τον ίδιο τύπο R_μ = T1/(2,96·C_κC_φ/(C_κ + C_φ)) = <b>${eng(R1c,'Ω',4)}</b>: λάθος ×100. ${m.ex==='1536'?'Με 45 Ω το μέτωπο βγαίνει '+eng(ex.T1,'s',3)+' αντί για 1,2 μs.':'Με τη σωστή τιμή βγαίνει 1,2/50.'}</p>`);}
 if(m.marx){let fired=0;for(let k=1;k<=m.marx;k++){const g=rawSeries('I:SG'+k);if(g&&g.y.some(x=>Math.abs(x)>1e-3*U/m.R1))fired++;}
  notes.push(`<p class="${fired===m.marx?'good':'bad'}">${fired===m.marx?'✓ Άναψαν και τα '+m.marx+' διάκενα.':'✗ Άναψαν '+fired+' από τα '+m.marx+' διάκενα.'} Η R_μ μπήκε ενιαία (3·R′_μ = ${eng(m.R1,'Ω',4)}), οι R′_ε = ${eng(m.R2/m.marx,'Ω',4)} σε κάθε βαθμίδα.</p>`);}
 return h+notes.join('')+'<p class="muted small">Οι τύποι του βιβλίου είναι προσεγγίσεις για C_κ ≫ C_φ και R_ε ≫ R_μ. Η ακριβής λύση είναι ανεξάρτητη από τον λύτη.</p>';}
// 3.11: lossy line. The exact step response of a semi-infinite line with series R′ only (Heaviside): v/V₀ = e^(−aT) + aT·∫₀^U e^(−aT·cosh u)·I₁(aT·sinh u) du,
// a = R′/(2L′), T = x/v, U = arccosh(t/T) (s = T·cosh u removes the singularity of the textbook form)
function besI1e(x){const ax=Math.abs(x);let r;if(ax<3.75){const y=(x/3.75)**2;r=ax*(.5+y*(.87890594+y*(.51498869+y*(.15084934+y*(.02658733+y*(.00301532+y*.00032411))))))*Math.exp(-ax);}
 else{const y=3.75/ax;r=(.39894228+y*(-.03988024+y*(-.00362018+y*(.00163801+y*(-.01031555+y*(.02282967+y*(-.02895312+y*(.01787654-y*.00420059))))))))/Math.sqrt(ax);}return x<0?-r:r;}
function heaviside(aT,tT){if(tT<1)return 0;const U=Math.acosh(tT),n=200,hh=U/n;let s=0;
 for(let k=0;k<=n;k++){const u=k*hh,x=aT*Math.sinh(u),f=besI1e(x)*Math.exp(x-aT*Math.cosh(u));s+=f*(k===0||k===n?1:k%2?4:2);}return Math.exp(-aT)+aT*s*hh/3;}
function lossTheory(){const s=S.sim,m=S.tutMeta||{};if(!s||!m.tau)return '';const T=m.tau,aT=m.R/(2*m.Z),open=m.end==='open',G=open?2:1,x=m.R/(4*m.N*m.Z);
 const lam=m.Rp>0?2*m.Z/m.Rp:Infinity,done=s.t>=m.dur*.98;
 let h=`<div class="tm"><span class="badge">γραμμή RLC</span> Z = ${eng(m.Z,'Ω')} · ℓ = ${eng(m.len,'m')} · τ = ${eng(T,'s')} · R′ = ${eng(m.Rp*1e3,'Ω/km')} · R = ${eng(m.R,'Ω')} · N = ${m.N}</div><ul class="eqs">
  <li>Απόσβεση του μετώπου: e^(−R′ℓ/(2Z)) = e^(−ℓ/λ) = <b>${fmt(Math.exp(-aT),5)}</b>, λ = 2Z/R′ = ${Number.isFinite(lam)?eng(lam,'m'):'∞'} (σχέση 7.88)</li>
  <li>Μοντέλο με ${m.N} τμήματα: το μέτωπο περνά ${2*m.N} αντιστάσεις R/(2N) (οι ακριανές R/(4N)) και σβήνει ως (1 + R/(4NZ))^(−2N) = <b>${fmt((1+x)**(-2*m.N),5)}</b>. Για N → ∞ δίνει το e^(−R/(2Z))</li>
  <li>Πίσω από το μέτωπο: v(x,t)/V₀ = e^(−aT) + aT·∫ e^(−as)·I₁(a√(s² − T²))/√(s² − T²) ds, a = R′/(2L′) = ${fmt(aT/T,4)} s⁻¹ (λύση του Heaviside για γραμμή με R′, χωρίς G′)</li>
  ${open?'<li>Ανοιχτό άκρο με ιδανική πηγή: v_τέλος = 2·v(ℓ, t) από το τ ως το 3τ, όταν φτάνει το κύμα που ανακλάστηκε στην πηγή</li>':'<li>Συνέχεια σε γραμμή ίδιας R′: στον κόμβο η τάση είναι η v(ℓ, t) της ημιάπειρης γραμμής ως το 7τ</li>'}</ul>`;
 if(!done)return h+'<p class="muted small">Τρέξε ως το τέλος για τη σύγκριση.</p>';
 const v=rawSeries('V2:T1'),at=tq=>{const i=v.t.findIndex(x=>x>=tq);return i>0?v.y[i-1]+(v.y[i]-v.y[i-1])*(tq-v.t[i-1])/(v.t[i]-v.t[i-1]):NaN;};
 if(m.src==='step'){const fs=open?[1.005,1.5,1.99,2.9]:[1.005,2,4,5.9];
  h+=cmpRows(fs.map(f=>[`v στο ${fmt(f,4)}·τ`,G*m.V*heaviside(aT,f),at(f*T),'V']));
  return h+`<p class="muted small">Το μοντέλο με συγκεντρωμένες αντιστάσεις συγκλίνει στην κατανεμημένη γραμμή περίπου ως 1/N: με R/(4NZ) = ${fmt(x,3)} το σφάλμα στο μέτωπο είναι περίπου ${fmt(100*Math.abs((1+x)**(-2*m.N)/Math.exp(-aT)-1),2)} %. Η R′ εδώ είναι σταθερή: το επιδερμικό φαινόμενο και το corona, που πλαταίνουν το μέτωπο στις πραγματικές γραμμές, δεν μοντελοποιούνται.</p>`;}
 // impulse: Duhamel with the exact step response g(θ) = G·v(ℓ, τ + θ)/V₀ and du/dt of the source at the grid points (trapezoid, 5 ns)
 const w=s.net.compInfo.get('V1')?.wave,n=4000,d=5e-9,gr=new Float64Array(n),du=new Float64Array(n);for(let k=0;k<n;k++){gr[k]=G*heaviside(aT,1+k*d/T);const e1=d*1e-4;du[k]=(P.waveAt(w,k*d+e1)-P.waveAt(w,Math.max(0,k*d-e1)))/(k?2*e1:e1);}   // du/dt at the grid points (one-sided at 0⁺)
 const ve=new Float64Array(n);for(let i=0;i<n;i++){let a=0;for(let j=0;j<=i;j++)a+=gr[i-j]*du[j]*(j===0||j===i?.5:1);ve[i]=a*d;}
 const te=Array.from({length:n},(_,k)=>T+k*d),qe=impulseMeasure(te,Array.from(ve),T,'iec'),i0=v.t.findIndex(x=>x>=T-1e-9),qs=impulseMeasure(v.t.slice(i0),v.y.slice(i0),T,'iec');
 h+=cmpRows([['κορυφή στο τέλος',qe.pk,qs.pk,'V'],['T1 στο τέλος (από την άφιξη)',qe.T1,qs.T1,'s'],['χωρίς απώλειες: '+(open?'2·':'')+'V_p',G*m.V,G*m.V,'V']]);
 return h+`<p class="muted small">Ακριβής λύση: συνέλιξη της βηματικής απόκρισης της κατανεμημένης γραμμής με το du/dt της πηγής. Με σταθερή R′ το μέτωπο σχεδόν δεν αλλάζει σχήμα: μικραίνει κατά e^(−R/(2Z)) και η ουρά μακραίνει λίγο.</p>`;}
// 3.11: volt–time curve from the disruptive-effect criterion D = ∫ (|u| − U₀)^k dt, integrated here on a fine grid of the analytic source (independent of the solver)
function vtBreak(u,U0,k,D,tEnd,n=20000){const h=tEnd/n;let a=0,f0=0;for(let i=1;i<=n;i++){const t=i*h,x=Math.abs(u(t))-U0,f=x>0?x**k:0;if(x<=0){a=0;f0=0;continue;}const da=(f0+f)/2*h;if(a+da>=D){const th=(D-a)/da;return t-h+th*h;}a+=da;f0=f;}return NaN;}
function vtTheory(){const s=S.sim,m=S.tutMeta||{};if(!s||!m.U0)return '';const e=s.net.compInfo.get('SG1')?.main,k=m.k,U0=m.U0,D=m.D,ramp=m.src==='ramp',w=s.net.compInfo.get('V1')?.wave;
 const Du=k===0?'s':k===1?'V·s':'V^'+k+'·s',tbR=S2=>U0/S2+((k+1)*D/S2**k)**(1/(k+1));
 let h=`<div class="tm"><span class="badge">τάση–χρόνος</span> U₀ = ${eng(U0,'V')} · k = ${k} · D = ${fmt(D,4)} ${Du} · ${ramp?'ράμπα '+eng(m.S*1e-6,'V/μs'):'κρουστική 1,2/50, '+eng(m.Vpk,'V')}</div><ul class="eqs">
  <li>Κριτήριο: διάσπαση όταν ∫ (|u| − U₀)^k dt, από τη στιγμή που η τάση ξεπερνά το U₀, φτάσει το D. ${k===0?'Με k = 0 είναι σταθερή καθυστέρηση D μετά το U₀.':k===1?'Με k = 1 είναι ο νόμος ίσων επιφανειών του Kind: το εμβαδόν πάνω από το U₀.':'Με k > 1 βαραίνει περισσότερο η υπέρταση πάνω από το U₀.'}</li>
  ${ramp?`<li>Ράμπα u = S·t: t_d = U₀/S + ((k+1)·D/S^k)^(1/(k+1)) = <b>${eng(tbR(m.S),'s',5)}</b>, τάση διάσπασης S·t_d = <b>${eng(m.S*tbR(m.S),'V',5)}</b></li>`:'<li>Κρουστική: το ολοκλήρωμα υπολογίζεται αριθμητικά πάνω στην αναλυτική κυματομορφή της πηγής</li>'}</ul>`;
 const tEnd=ramp?20*U0/m.S:60e-6,u=ramp?(t=>m.S*t):(t=>P.waveAt(w,t)),tbE=ramp?tbR(m.S):vtBreak(u,U0,k,D,tEnd);
 // the curve: ramps of 50…50 000 kV/μs, or impulses of 1,02…5 × U₀ (voltage at breakdown on the front, the peak on the tail)
 const pts=[];if(ramp){for(let q=0;q<=40;q++){const S2=5e10*Math.pow(1e3,q/40),t=tbR(S2);pts.push([t,S2*t]);}}
 else{const wm=P.waveMeasure({kind:'dexp',n:1,tau1:w.tau1,tau2:w.tau2,eta:1,I0:1,t0:0},'tp');for(let q=0;q<=40;q++){const A=U0*(1.02+3.98*q/40),f=t=>A/m.Vpk*P.waveAt(w,t),t=vtBreak(f,U0,k,D,60e-6,6000);if(Number.isFinite(t))pts.push([t,t<wm.tp?f(t):A]);}}
 const done=s.t>=m.dur*.98,tOn=e?.on?e.tOn:NaN,uOn=Number.isFinite(tOn)?u(tOn):NaN;
 if(pts.length>1){const W=560,H=200,x0=Math.log10(Math.min(...pts.map(p=>p[0]))),x1=Math.log10(Math.max(...pts.map(p=>p[0]))),y1=Math.max(...pts.map(p=>p[1]))*1.05,y0=.9*U0,X=t=>34+(W-40)*(Math.log10(t)-x0)/((x1-x0)||1),Y=v=>6+(H-28)*(1-(v-y0)/(y1-y0));
  const cur='M'+pts.map(p=>`${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(' L'),u0=`<line class="diag" x1="34" x2="${W-6}" y1="${Y(U0).toFixed(1)}" y2="${Y(U0).toFixed(1)}"/>`;
  const dot=Number.isFinite(tOn)?`<circle cx="${X(tOn).toFixed(1)}" cy="${Y(ramp||tOn<P.waveMeasure({kind:'dexp',n:1,tau1:w.tau1,tau2:w.tau2,eta:1,I0:1,t0:0},'tp').tp?uOn:m.Vpk).toFixed(1)}" r="3"/>`:'';
  const tk=[x0,x1].map((lx,i)=>`<text x="${X(10**lx)}" y="${H-8}" text-anchor="${i?'end':'start'}">${eng(10**lx,'s',2)}</text>`).join('')+`<text x="30" y="${Y(U0)+3}" text-anchor="end">U₀</text><text x="30" y="${Y(y1/1.05)+3}" text-anchor="end">${eng(y1/1.05,'V',2)}</text>`;
  h+=`<svg class="bfchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Καμπύλη τάσης–χρόνου"><rect x="34" y="6" width="${W-40}" height="${H-28}" class="frame"/>${u0}<path class="map" d="${cur}"/>${dot}${tk}<text x="${(W+34)/2}" y="${H-1}" text-anchor="middle">χρόνος ως τη διάσπαση (λογαριθμικά)</text></svg>
   <p class="muted small">Η καμπύλη: ${ramp?'ράμπες από 50 ως 50 000 kV/μs':'κρουστικές 1,2/50 από 1,02 ως 5 × U₀: η τάση τη στιγμή της διάσπασης στο μέτωπο, η κορυφή στην ουρά'}. Η κουκκίδα είναι η προσομοίωση.</p>`;}
 if(!done)return h+'<p class="muted small">Τρέξε ως το τέλος για τη σύγκριση.</p>';
 if(!Number.isFinite(tOn))return h+`<p class="${Number.isFinite(tbE)?'bad':'good'}">Το διάκενο δεν διασπάστηκε.${Number.isFinite(tbE)?' Το κριτήριο δίνει διάσπαση στο '+eng(tbE,'s',4)+'.':' Ούτε το κριτήριο δίνει διάσπαση: η τάση δεν μένει αρκετά πάνω από το U₀.'}</p>`;
 return h+cmpRows([['χρόνος ως τη διάσπαση t_d',tbE,tOn,'s'],['τάση τη στιγμή της διάσπασης',u(tbE),uOn,'V']]);}
// 3.12: AC dividers (book 15.1.3, 15.1.5) by phasors; the simulated ratio is low-voltage rms over high-voltage rms (last two periods)
function hvdivTheory(){const s=S.sim,m=S.tutMeta||{};if(!s||!m.ex)return '';const w=2*Math.PI*m.f,V=m.Vpk/Math.SQRT2,b15=m.ex==='1515',done=s.t>=m.dur*.98,T=s.T;
 const ZH=[0,-1/(w*m.CH)],YL=[b15?1/m.Rs:0,w*(m.CL+m.Ccab+m.Cs)],ZL=cx.div([1,0],YL),kC=cx.abs(cx.add(ZH,ZL))/cx.abs(ZL),kb=(m.CH+m.CL+m.Ccab+m.Cs)/m.CH;
 const r=k=>done?phaseRms(k,T,2)/phaseRms('V:V1',T,2):NaN;
 let h=`<div class="tm"><span class="badge">${b15?'15.1.5':'15.1.3'}</span> U = ${eng(V,'V',5)} rms (${eng(m.Vpk,'V',5)} κορυφή), ${eng(m.f,'Hz')}</div><ul class="eqs">
  <li>Χωρητικός: κ_C = (C_H + C_L${b15?' + C_καλ + C_παλμ':''})/C_H = <b>${fmt(kb,6)}</b>${b15?`, C_καλ = ℓ/(v·Z) = ${eng(m.Ccab,'F',4)}, και η R = 2 MΩ του παλμογράφου παράλληλα: ακριβής |Z_H + Z_L|/|Z_L| = ${fmt(kC,6)}`:''}</li>
  ${b15?'':`<li>Ωμικός: κ_R = (R_H + R_L)/R_L = <b>${fmt((m.RH+m.RL)/m.RL,6)}</b>. Για 9,1 V στο Ch1: R_L = R_H/(U/9,1 − 1) = ${eng(m.RH/(V/9.1-1),'Ω',4)}</li><li>Το ηλεκτροστατικό βολτόμετρο είναι παράλληλα στην υψηλή τάση και δείχνει την ενδεικνυόμενη τιμή της: <b>${eng(V,'V',4)}</b></li>`}</ul>`;
 if(!done)return h+'<p class="muted small">Τρέξε ως το τέλος για τη σύγκριση.</p>';
 const rows=[['τάση στον παλμογράφο'+(b15?'':' (χωρητικός, Ch2)'),b15?834.39e3/Math.SQRT2/kb:V/200,V/kC,V*r('V:CL'),'V']];
 if(!b15){rows.push(['τάση στον ωμικό (Ch1)',9.1,V*m.RL/(m.RH+m.RL),V*r('V:RL'),'V'],['ηλεκτροστατικό βολτόμετρο',100e3,V,V*r('V:ES'),'V']);}
 h+=cmp3(rows);
 if(b15){const vl=V/kC,need=m.CH*(V/500-1)-m.Ccab-m.Cs;h+=`<p class="${vl>500?'bad':'good'}">${eng(vl,'V',4)} ${vl>500?'>':'≤'} 500 V του παλμογράφου: ${vl>500?'η διάταξη δεν είναι κατάλληλη (όπως λέει και το βιβλίο). Χρειάζεται C_L ≥ '+eng(need,'F',4)+'.':'η διάταξη αρκεί.'}</p>`;}
 else h+='<p class="bad">Το βιβλίο γράφει 100 kV για το ηλεκτροστατικό βολτόμετρο. Το βολτόμετρο είναι παράλληλα στα 50 kV και δείχνει 50 kV.</p>';
 return h+'<p class="muted small">Η προσομοίωση δίνεται ως λόγος rms χαμηλής προς rms υψηλής τάσης στις δύο τελευταίες περιόδους, επί την ενδεικνυόμενη τιμή της πηγής.</p>';}
// 3.12: Schering bridge by phasors (nodes A under C_x, B under C₂, detector R_D between them) and the readings the balance relations give
function scheringTheory(){const s=S.sim,m=S.tutMeta||{};if(!s||!m.C2)return '';const w=2*Math.PI*m.f,V=[m.V,0],done=s.t>=m.dur*.98,T=s.T;
 const inv=z=>cx.div([1,0],z),Yx=inv([m.Rx,-1/(w*m.Cx)]),Y2=[0,w*m.C2],Y3=[1/m.R3,0],Y4=[1/m.R4,w*m.C4],YD=[1/m.RD,0];
 const a11=cx.add(cx.add(Yx,Y3),YD),a22=cx.add(cx.add(Y2,Y4),YD),b1=cx.mul(Yx,V),b2=cx.mul(Y2,V),det=cx.add(cx.mul(a11,a22),cx.mul(YD,YD).map(x=>-x));
 const VA=cx.div(cx.add(cx.mul(b1,a22),cx.mul(YD,b2)),det),VB=cx.div(cx.add(cx.mul(a11,b2),cx.mul(YD,b1)),det),VD=cx.add(VA,VB.map(x=>-x));
 const Cr=m.C2*m.R4/m.R3,tr=w*m.R4*m.C4,Rr=m.R3*m.C4/m.C2;
 let h=`<div class="tm"><span class="badge">Schering</span> C_x = ${eng(m.Cx,'F')}, tan δ = ${fmt(m.td,3)} (R_x = ${eng(m.Rx,'Ω',4)}) · C₂ = ${eng(m.C2,'F')} · C₄ = ${eng(m.C4,'F')} · R₃ = ${eng(m.R3,'Ω',5)} · R₄ = ${eng(m.R4,'Ω',5)}</div><ul class="eqs">
  <li>Ισορροπία Z_x·Z₄ = Z₂·Z₃: C_x = C₂·R₄/R₃, R_x = R₃·C₄/C₂, tan δ = ω·R₄·C₄ = ω·R_x·C_x</li>
  <li>Για το δοκίμιο: R_x = tan δ/(ω·C_x) = <b>${eng(m.td/(w*m.Cx),'Ω',4)}</b> (το βιβλίο γράφει 1,59 kΩ), R₄ = tan δ/(ω·C₄) = <b>${eng(m.R4f,'Ω',5)}</b>, R₃ = C₂·R₄/C_x = <b>${eng(m.R3f,'Ω',5)}</b></li>
  <li>Με τις ρυθμίσεις της γέφυρας οι σχέσεις ισορροπίας διαβάζουν C_x = <b>${eng(Cr,'F',4)}</b>, tan δ = <b>${fmt(tr,4)}</b>, R_x = ${eng(Rr,'Ω',4)}</li></ul>`;
 if(!done)return h+'<p class="muted small">Τρέξε ως το τέλος για τη σύγκριση.</p>';
 const sr=k=>phaseRms(k,T,2)/phaseRms('V:V1',T,2)*m.V;
 h+=cmpRows([['τάση κόμβου A (στην R₃)',cx.abs(VA),sr('V:R3'),'V'],['τάση ανιχνευτή',cx.abs(VD),sr('V:RD'),'V']]);
 const bal=cx.abs(VD)<1e-4*cx.abs(VA);
 h+=`<p class="${bal?'good':'bad'}">${bal?'✓ Η γέφυρα ισορροπεί: ο ανιχνευτής δείχνει '+fmt(100*cx.abs(VD)/cx.abs(VA),2)+' % της τάσης του κόμβου A.':'✗ Η γέφυρα δεν ισορροπεί: ο ανιχνευτής δείχνει '+fmt(100*cx.abs(VD)/cx.abs(VA),3)+' % της τάσης του κόμβου A.'}</p>`;
 if(m.set==='book')h+=`<p class="bad">Με τις τιμές του βιβλίου ο λόγος R₄/R₃ δίνει σωστά C_x = 2 nF, αλλά tan δ = ω·R₄·C₄ = ${fmt(tr,3)}: δέκα φορές μικρότερο. Το λάθος είναι η R_x = 1,59 kΩ αντί για 15,9 kΩ, που περνά στις R₃, R₄.</p>`;
 return h;}
function formulaTheory(t){
 if(t.topology==='sampling')return samplingTheory();
 if(t.topology==='dc_drive')return dcDriveTheory();
 if(t.topology==='blocks_loop')return blocksTheory();
 if(t.topology==='peak_cm')return pcmTheory();
 if(t.topology==='pcm_chaos')return chaosTheory();
 if(t.topology==='code_loop')return codeTheory();
 if(t.topology==='cell_eis')return eisTheory();
 if(t.topology==='im_vf')return vfTheory();
 if(t.topology==='im_foc')return focTheory();
 if(t.topology==='synrm')return synTheory();
 if(t.topology==='pmsm')return pmTheory();
 if(t.topology==='lightning')return lgTheory();
 if(t.topology==='twave')return twTheory();
 if(t.topology==='arrester')return arTheory();
 if(t.topology==='marx')return marxTheory();
 if(t.topology==='chop')return chopTheory();
 if(t.topology==='hv153')return hv153Theory();
 if(t.topology==='lossline')return lossTheory();
 if(t.topology==='voltime')return vtTheory();
 if(t.topology==='hvdiv')return hvdivTheory();
 if(t.topology==='schering')return scheringTheory();
 if(t.topology==='srm')return srmTheory();
 if(t.topology==='polyphase')return polyTheory();
 if(t.topology==='sub_legs')return subLegsTheory();
 if(t.topology==='bus_dq')return busDqTheory();
 const W=paramsOf('PWM1'),V=paramsOf('V1');let rows=[],eqs=[];
 if(t.topology==='cuk'||t.topology==='sepic'){const D=+W.D,Vin=+V.V,R=+paramsOf('R1').R,L1=+paramsOf('L1').L,L2=+paramsOf('L2').L,Ts=1/+W.fs;const Vo=(t.topology==='cuk'?-1:1)*Vin*D/(1-D),Io=Vo/R,IL1=Math.abs(Io)*D/(1-D);
  eqs=[`V_o = ${t.topology==='cuk'?'−':''}V_in·D/(1−D) = <b>${eng(Vo,'V')}</b>`,`I_L1 = |I_o|·D/(1−D) = <b>${eng(IL1,'A')}</b>, |I_L2| = |I_o| = <b>${eng(Math.abs(Io),'A')}</b>`,`Δi_L1 = V_in·D·T/L1 = <b>${eng(Vin*D*Ts/L1,'A')}</b>, Δi_L2 = V_in·D·T/L2 = <b>${eng(Vin*D*Ts/L2,'A')}</b>`,`V_C1 = ${t.topology==='cuk'?'V_in + |V_o|':'V_in'} = <b>${eng(t.topology==='cuk'?Vin+Math.abs(Vo):Vin,'V')}</b>`];
  rows=[['V_o',Vo,avgOver('V:C2')?.avg,'V'],['⟨i_L1⟩',IL1,avgOver('I:L1')?.avg,'A'],['⟨i_L2⟩ (a→b)',-Math.abs(Io),avgOver('I:L2')?.avg,'A'],['V_C1',t.topology==='cuk'?Vin+Math.abs(Vo):Vin,avgOver('V:C1')?.avg,'V'],['Δi_L1',Vin*D*Ts/L1,lastPP('I:L1'),'A']];}
 else if(t.topology==='hbridge'){const Vd=+V.V,R=+paramsOf('R1').R;const m=W.mode==='fixed'?2*(+W.D)-1:+W.m;const Vo=m*Vd;
  eqs=[`V_o = (2D−1)·V_d = (v_control/V_tri)·V_d = <b>${eng(Vo,'V')}</b>`,`I_o = V_o/R = <b>${eng(Vo/R,'A')}</b>`,`Συχνότητα κυμάτωσης ρεύματος: ${W.mode==='fixed'?'f_s (διπολική)':'2·f_s (μονοπολική)'}`];
  rows=[['V_o (v_A − v_B)',Vo,avgOver('V:R1')?.avg+avgOver('V:L1')?.avg,'V'],['I_o',Vo/R,avgOver('I:L1')?.avg,'A']];}
 else if(t.topology==='inverter'){const Vd=+V.V,R=+paramsOf('R1').R,L=+paramsOf('L1').L,m=+W.m,f=+W.fref,w=2*Math.PI*f;const V1=Math.min(m,1)*Vd,Z=Math.hypot(R,w*L),I1=V1/Z;
  eqs=[`V̂₁ = m·V_d = <b>${eng(V1,'V')}</b> (γραμμική περιοχή, m ≤ 1)`,`|Z| = |R + jωL| = <b>${eng(Z,'Ω')}</b>, φ = <b>${fmt(Math.atan2(w*L,R)*180/Math.PI,3)}°</b>`,`Î₁ = V̂₁/|Z| = <b>${eng(I1,'A')}</b>`,`m_f = f_s/f₁ = ${fmt(+W.fs/f)} → αρμονικές γύρω από ${W.refphase!==undefined&&editor.comp('S3')?.params.out==='b'?'2':''}m_f`];
  const pk=(()=>{const s=S.sim;if(!s)return NaN;const p=s.per;const i=s.chIndex.get('I:L1');if(i===undefined)return NaN;let mx=-Infinity;const n=Math.min(p.n,Math.round(1/f/s.T));for(let k=1;k<=n;k++){const j=(p.head-k+p.cap)%p.cap;mx=Math.max(mx,p.max[j*p.nch+i]);}return mx;})();
  rows=[['Κορυφή ρεύματος (θεμελιώδης)',I1,pk,'A']];}
 else if(t.topology==='rectifier'){const vs=paramsOf('V1'),E=+paramsOf('E1').V,R=+paramsOf('R1').R,Vpk=+vs.Vpk;if(Vpk<=E)return '<p>V̂_s ≤ E: δεν άγει καμία δίοδος.</p>';
  const a=Math.asin(E/Vpk),Iavg=(2*Vpk*Math.cos(a)-E*(Math.PI-2*a))/(Math.PI*R);let q=0;const N=2000;for(let k=0;k<N;k++){const th=a+(Math.PI-2*a)*(k+.5)/N;q+=((Vpk*Math.sin(th)-E)/R)**2;}const Irms=Math.sqrt(q*(Math.PI-2*a)/N/Math.PI);
  eqs=[`α = arcsin(E/V̂_s) = <b>${fmt(a*180/Math.PI,4)}°</b>, αγωγή από α έως π − α (${fmt((180-2*a*180/Math.PI),4)}°)`,`I_avg = [2V̂_s·cos α − E(π − 2α)]/(πR) = <b>${eng(Iavg,'A')}</b>`,`Î = (V̂_s − E)/R = <b>${eng((Vpk-E)/R,'A')}</b>`,`I_rms = <b>${eng(Irms,'A')}</b> · P_μπαταρίας = E·I_avg = <b>${eng(E*Iavg,'W')}</b> · P_R = R·I_rms² = <b>${eng(R*Irms*Irms,'W')}</b>`];
  const st=avgOver('I:R1',1);rows=[['I_avg',Iavg,st?.avg,'A'],['I_rms',Irms,st?.rms,'A'],['Î',(Vpk-E)/R,st?.max,'A']];
  if(+vs.Ls>0)eqs.push('<i>Οι τύποι ισχύουν για L_s = 0· με L_s η προσομοίωση δίνει μικρότερα ρεύματα.</i>');}
 else if(t.topology==='buck_vloop'){const Vin=+V.V,L=+paramsOf('L1').L,Cc=+paramsOf('C1').C,Rp=paramsOf('R1'),R=+Rp.R,fs=+W.fs,w0=1/Math.sqrt(L*Cc),f0=w0/2/Math.PI,Q=R*Math.sqrt(Cc/L);
  const Kp=+W.Kp,Ki=+W.Ki,Kd=+W.Kd,refS=P.parseSched(W.ref)||[[0,0]],vref=refS[refS.length-1][1],Rs=P.parseSched(Rp.sched),Rend=Rs?Rs[Rs.length-1][1]:R;
  eqs=[`G_vd(s) = V_in/(LC·s² + (L/R)·s + 1): f₀ = 1/(2π√(LC)) = <b>${eng(f0,'Hz')}</b>, Q = R·√(C/L) = <b>${fmt(Q,3)}</b>, G_vd(0) = V_in = ${eng(Vin,'V')}`,
   `Νόμος: d = D₀ + K_p·e + K_i·T_s·Σe${Kd?' + K_d·(e_k − e_{k−1})/T_s (φίλτρο T_f)':''}, με K_p = ${eng(Kp)}, K_i = ${eng(Ki)} 1/s${Kd?`, K_d = ${eng(Kd)} s`:''}, δειγματοληψία στην αρχή κάθε περιόδου (${eng(fs,'Hz')})`,
   Kd?`PID: C(s) ≈ K_i(1 + s/ω_z)²/s με ω_z = √(K_i/K_d) → f_z = <b>${eng(Math.sqrt(Ki/Kd)/2/Math.PI,'Hz')}</b> (≈ 0,7·f₀). Τα μηδενικά αντισταθμίζουν τους πόλους LC, άρα L(s) ≈ K_i·V_in/s και f_c ≈ K_i·V_in/2π = <b>${eng(Ki*Vin/2/Math.PI,'Hz')}</b>`
     :`PI: για ω ≪ ω₀, L(s) ≈ K_i·V_in/s, άρα f_c ≈ K_i·V_in/2π = <b>${eng(Ki*Vin/2/Math.PI,'Hz')}</b>. Στο f₀ η φάση είναι −180° και |L(jω₀)| ≈ Q·V_in·K_i/ω₀ = <b>${fmt(Q*Vin*Ki/w0,3)}</b>: πρέπει να μείνει < 1 (όριο K_i ≈ ${fmt(w0/(Q*Vin),3)}, χωρίς την καθυστέρηση δειγματοληψίας)`,
   `Μόνιμη κατάσταση: ο ολοκληρωτής μηδενίζει το σφάλμα στο σημείο δειγματοληψίας, άρα V_o → V_ref = <b>${eng(vref,'V')}</b> και I_L = V_o/R = <b>${eng(vref/Rend,'A')}</b>. Η μέση τιμή απέχει λίγα mV, γιατί η δειγματοληψία γίνεται σε σταθερό σημείο της κυμάτωσης.`];
  rows=[['V_o (τελικά)',vref,avgOver('V:C1',10)?.avg,'V'],['⟨i_L⟩ (τελικά)',vref/Rend,avgOver('I:L1',10)?.avg,'A']];
  return `<ul class="eqs">${eqs.map(e=>`<li>${e}</li>`).join('')}</ul>${cmpRows(rows)}<h4>Δείκτες από την προσομοίωση</h4>${eventMetricsHTML('V:C1')}`;}
 else if(t.topology==='scr1'){const Vpk=+paramsOf('V1').Vpk,R=+paramsOf('R1').R,rl=!!editor.comp('L1'),q=paramsOf('Q2'),a=(+q?.alpha||0)*Math.PI/180;const vd=nodeAvg('JPR:j',2);
  if(!rl){const Vd=Vpk/Math.PI*(1+Math.cos(a)),Vr=Vpk*Math.sqrt((Math.PI-a+Math.sin(2*a)/2)/(2*Math.PI));
   eqs=[`Ωμικό φορτίο: κάθε θυρίστορ άγει από α έως π, το ρεύμα μηδενίζεται στο τέλος κάθε ημιπεριόδου.`,`V_d = (1/π)∫_α^π V̂ sin θ dθ = (V̂/π)(1 + cos α) = <b>${eng(Vd,'V')}</b>`,
    `V_rms = V̂·√[(π − α + ½ sin 2α)/(2π)] = <b>${eng(Vr,'V')}</b>, I_d = V_d/R = <b>${eng(Vd/R,'A')}</b>, P = V_rms²/R = <b>${eng(Vr*Vr/R,'W')}</b>`];
   rows=[['V_d',Vd,vd?.avg,'V'],['I_d',Vd/R,avgOver('I:R1',2)?.avg,'A'],['V_rms (R)',Vr,avgOver('V:R1',2)?.rms,'V']];}
  else{const Vd=2*Vpk/Math.PI*Math.cos(a),Id=Vd/R;
   eqs=[`Μεγάλη L: το ρεύμα δεν σβήνει, κάθε ζεύγος άγει 180° από α έως π + α και η v_d γίνεται αρνητική μετά το π.`,`V_d = (1/π)∫_α^{π+α} V̂ sin θ dθ = (2V̂/π)·cos α = <b>${eng(Vd,'V')}</b>`,
    `I_d = V_d/R = <b>${eng(Id,'A')}</b>. Ρεύμα πηγής: ορθογώνιο ±I_d, I_s,rms = I_d, θεμελιώδης μετατοπισμένη κατά α: συντελεστής μετατόπισης cos α = ${fmt(Math.cos(a),3)}, PF = 0,9·cos α = <b>${fmt(.9*Math.cos(a),3)}</b>`];
   if(a>=Math.PI/2-1e-9)eqs.push('<i>Για α ≥ 90° χωρίς πηγή στο DC (π.χ. κινητήρα) το ρεύμα σβήνει, η αγωγή γίνεται ασυνεχής και ο τύπος δεν ισχύει.</i>');
   rows=[['V_d',Vd,vd?.avg,'V'],['I_d',Id,avgOver('I:L1',2)?.avg,'A'],['I_s,rms',Id,avgOver('I:V1',2)?.rms,'A']];}}
 else if(t.topology==='bridge3'){const Vpk=+paramsOf('V1').Vpk,R=+paramsOf('R1').R,rl=!!editor.comp('L1'),q=editor.comp('Q1'),scr=q?.type==='SCR',a=scr?(+q.params.alpha||0)*Math.PI/180:0,VLL=Math.sqrt(3)*Vpk/Math.SQRT2;
  const Vd=3*Math.sqrt(3)/Math.PI*Vpk*Math.cos(a),Id=Vd/R;
  eqs=[`V_LL = √3·V̂_φ/√2 = <b>${eng(VLL,'V')}</b> rms. Η v_d ακολουθεί την πολική τάση με τη μεγαλύτερη τιμή: 6 παλμοί ανά περίοδο (${eng(6*(+paramsOf('V1').f),'Hz')}).`,
   `V_d = (3/π)∫_{π/3+α}^{2π/3+α} √3·V̂_φ sin θ dθ = (3√3/π)·V̂_φ·cos α = 1,35·V_LL·cos α = <b>${eng(Vd,'V')}</b>${scr?` (α = ${fmt(a*180/Math.PI,3)}°)`:''}`,
   `I_d = V_d/R = <b>${eng(Id,'A')}</b>${rl?`, I_a,rms = √(2/3)·I_d = <b>${eng(Math.sqrt(2/3)*Id,'A')}</b> (ορθογώνιοι παλμοί 120°)`:''}`];
  if(!rl&&!scr)eqs.push(`Κυμάτωση: από √3·V̂_φ·cos 30° = <b>${eng(1.5*Vpk,'V')}</b> έως √3·V̂_φ = <b>${eng(Math.sqrt(3)*Vpk,'V')}</b>`);
  if(!rl&&a>Math.PI/3)eqs.push('<i>Με ωμικό φορτίο και α > 60° η αγωγή γίνεται ασυνεχής και ο τύπος δεν ισχύει.</i>');
  const vR=avgOver('V:R1',2),vL=rl?avgOver('V:L1',2):null;rows=[['V_d',Vd,vR?vR.avg+(vL?.avg||0):NaN,'V'],['I_d',Id,avgOver('I:R1',2)?.avg,'A']];
  if(rl)rows.push(['I_a,rms',Math.sqrt(2/3)*Id,avgOver('I:V1',2)?.rms,'A']);else if(!scr)rows.push(['v_d min',1.5*Vpk,avgOver('V:R1',2)?.min,'V'],['v_d max',Math.sqrt(3)*Vpk,avgOver('V:R1',2)?.max,'V']);}
 return `<ul class="eqs">${eqs.map(e=>`<li>${e}</li>`).join('')}</ul>${rows.length?cmpRows(rows):''}`;}
function nodeAvg(pin,n){const s=S.sim;if(!s)return null;const nt=s.net.pinNet.get(pin);if(!nt||nt.ground)return null;return avgOver('N:'+nt.canon,n);}

// ------------------------------------------------------------------ math panel
// circuit -> registered-family graph (source, switch, diode, inductor, capacitor, resistor, transformer)
const V1MAP={VDC:['source','Πηγή εισόδου',{p:'p',n:'n'}],SW:['switch','Διακόπτης',{d:'a',s:'b'}],D:['diode','Δίοδος',{a:'a',k:'k'}],L:['inductor','Πηνίο',{a:'a',b:'b'}],
 C:['capacitor','Πυκνωτής εξόδου',{p:'p',n:'n'}],R:['resistor','Φορτίο',{a:'a',b:'b'}],XFMR:['transformer','Μετασχηματιστής (L_m στο πρωτεύον)',null]};
function circuitForMath(){
 const doc=editor.doc;if(!S.sim||S.error)return {error:'Το κύκλωμα δεν προσομοιώνεται· διόρθωσε πρώτα τη συνδεσμολογία.'};
 {const d=S.sim.net.diag,lb=id=>editor.comp(id)?.label||id;const bad=[...(d?.skipped||[]).map(x=>lb(x.id)),...(d?.open||[])]; // 3.7: also parts left out of the solution, whatever the option
  if(bad.length)return {error:'Η συμβολική λύση θέλει κλειστό κύκλωμα. Ασύνδετα ή ανοιχτά: '+bad.slice(0,6).join(', ')+(bad.length>6?' και άλλα':'')+'.'};}
 const par=new Map(),find=k=>{while(par.get(k)!==k){par.set(k,par.get(par.get(k)));k=par.get(k);}return k;};
 for(const c of doc.components)for(const pn of Object.keys(P.pinsOf(c)))par.set(c.id+':'+pn,c.id+':'+pn);
 for(const w of doc.wires){const a=w.a.c+':'+w.a.p,b=w.b.c+':'+w.b.p;if(par.has(a)&&par.has(b))par.set(find(a),find(b));}
 const net={pinNet:{get:k=>par.has(k)?{canon:find(k)}:null}};
 const used=doc.components.filter(c=>V1MAP[c.type]),extra=doc.components.filter(c=>!V1MAP[c.type]&&!['GND','JUNC','PWM','SH','TAGO','TAGI'].includes(c.type)&&!(P.BLOCKS.has(c.type)&&c.type!=='AM'&&c.type!=='IP'));
 const why='Η πλήρης συμβολική λύση καλύπτει buck, boost, αντιστρέφοντα buck–boost και flyback με ένα στοιχείο ανά ρόλο.';
 if(!used.length)return {error:'Πρόσθεσε στοιχεία ισχύος (πηγή, διακόπτη, πηνίο…) για να βγει η συμβολική λύση.'};
 if(extra.length)return {error:why+' Αυτό το κύκλωμα έχει και: '+extra.map(c=>`${P.PARTS[c.type].name} ${c.label||c.id}`).join(', ')+'.'};
 const by={};for(const c of used){(by[c.type]=by[c.type]||[]).push(c);}
 const dup=Object.entries(by).filter(([,v])=>v.length>1);if(dup.length)return {error:why+' Υπάρχουν περισσότερα από ένα: '+dup.map(([k,v])=>`${P.PARTS[k].name} (${v.map(c=>c.label||c.id).join(', ')})`).join('; ')+'.'};
 const comps=[],groups=new Map(),roles=[],notes=[],params={};
 for(const c of used){const [type,role,pm]=V1MAP[c.type];comps.push({id:c.id,type});const p={...P.defaults(c.type),...c.params};
  const pins=c.type==='XFMR'?(p.pol==='opp'?{p1:'p1',p2:'p2',s1:'s2',s2:'s1'}:{p1:'p1',p2:'p2',s1:'s1',s2:'s2'}):pm;
  for(const [sp,vp] of Object.entries(pins)){const n=net.pinNet.get(c.id+':'+sp);const key=n?n.canon:'open:'+c.id+sp;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(c.id+':'+vp);}
  let value='';
  if(c.type==='VDC'){params.vin=Math.abs(+p.V);value=eng(+p.V,'V');if(+p.Rs>0)notes.push(`Η εσωτερική αντίσταση της ${c.label||c.id} μετρά μόνο στην προσομοίωση.`);}
  if(c.type==='SW'){const pw=editor.comp(p.pwm);const q=pw?{...P.defaults('PWM'),...pw.params}:null;if(!q)return {error:`Ο διακόπτης ${c.label||c.id} δεν έχει μπλοκ PWM.`};
   if(q.mode!=='fixed')notes.push(`Το ${pw.label||pw.id} είναι σε «${q.mode}»: η ανάλυση χρησιμοποιεί το D = ${fmt(+q.D,4)} των παραμέτρων του.`);
   params.D=+q.D;params.fs=+q.fs;value=`${pw.label||pw.id} · D = ${fmt(+q.D,4)} · f_s = ${eng(+q.fs,'Hz')}`;}
  if(c.type==='D'){value='ιδανική';if(+p.Vf>0)notes.push(`Το V_f της ${c.label||c.id} μετρά μόνο στην προσομοίωση.`);}
  if(c.type==='L'){params.L=+p.L;value=eng(+p.L,'H');if(+p.Rs>0)notes.push(`Η αντίσταση τυλίγματος του ${c.label||c.id} μετρά μόνο στην προσομοίωση.`);}
  if(c.type==='C'){params.C=+p.C;value=eng(+p.C,'F');if(+p.esr>0)notes.push(`Η ESR του ${c.label||c.id} μετρά μόνο στην προσομοίωση.`);}
  if(c.type==='R'){params.R=+p.R;value=eng(+p.R,'Ω');if(p.sched)notes.push(`Το πρόγραμμα R(t) του ${c.label||c.id} αγνοείται: η ανάλυση είναι για R = ${eng(+p.R,'Ω')}.`);}
  if(c.type==='XFMR'){params.L=+p.Lm;params.n=+p.n;value=`n = N₂/N₁ = ${fmt(+p.n,4)} · L_m = ${eng(+p.Lm,'H')}`;}
  roles.push({role,label:c.label||c.id,value});}
 const wires=[];for(const g of groups.values())for(let i=1;i<g.length;i++)wires.push({from:g[0],to:g[i]});
 return {circuit:{components:comps,wires},params,roles,notes};}
let mathToken=0,mathTimer=0;
function scheduleMath(delay=700){clearTimeout(mathTimer);mathTimer=setTimeout(runMath,delay);}
function batteryKey(t){const m=S.tutMeta;if(!m||Math.abs(t.vbus-50)>1e-9)return null;const win=m.above?{min:60,mid:80,max:100}:{min:25,mid:32.5,max:40};return Object.keys(win).find(k=>Math.abs(win[k]-t.vst)<1e-9)||null;}
// solution sources for the current tutorial: code template, data templates, or the circuit itself
function mathChoices(t){const list=(window.Exercises?.allFor?.(t.id)||[]).filter(x=>x.kind!=='code'||S.tutMeta);
 const prim=x=>x.kind==='data'&&x.template?.primary;
 return [...list.filter(x=>x.kind==='code'),...list.filter(prim),{kind:'circuit',id:'circuit',title:'Από το κύκλωμα (αναγνώριση τοπολογίας)'},...list.filter(x=>x.kind==='data'&&!prim(x))];}
function renderMathChoices(t){const sel=$('#math-tpl');const list=mathChoices(t);const cur=S.mathChoice?.[t.id];const pick=list.find(x=>x.id===cur)||list[0];
 sel.innerHTML=list.map(x=>`<option value="${esc(x.id)}" ${x.id===pick.id?'selected':''}>${esc(x.kind==='code'?'Engine · '+x.title:x.kind==='data'?'Template δεδομένων · '+x.title:x.title)}</option>`).join('');sel.hidden=list.length<2;return pick;}
async function runTemplate(t,ch,box,src,token){const tpl=ch.template;S.tplOverrides=S.tplOverrides||{};const ov=S.tplOverrides[tpl.id]||{};
 const {vals,src:from}=Exercises.resolveInputs(tpl,{meta:S.tutMeta,param:paramsOf,overrides:ov});
 src.textContent=`template δεδομένων «${tpl.id}» (${ch.src}) · ${Object.values(from).filter(x=>x!=='προεπιλογή').length} είσοδοι από κύκλωμα/tutorial`;
 const r=await api('template_solve',{template:tpl,values:vals});if(token!==mathToken)return;
 MathPanel.renderTemplate(box,r,{src:from,simValue,onInput:(n,v)=>{(S.tplOverrides[tpl.id]=S.tplOverrides[tpl.id]||{})[n]=v;runMath();},onReset:()=>{delete S.tplOverrides[tpl.id];runMath();},
  onDownload:()=>download(tpl.id+'.template.json',JSON.stringify(tpl,null,1))});}
async function runMath(){
 if(!atTop())return;
 const t=tutorial(),box=$('#math'),src=$('#math-src'),token=++mathToken;
 try{
  const ch=renderMathChoices(t);
  if(ch.kind==='data'){await runTemplate(t,ch,box,src,token);return;}
  const ex=ch.kind==='code'?ch.code:null;
  if(ex&&S.tutMeta){src.textContent=`από τα δεδομένα της άσκησης (template «${ex.id}») · σημείο λειτουργίας από τις επιλογές του tutorial`;
   const r=await api(ex.engine.action,ex.engine.request(S.tutMeta));if(token!==mathToken)return;
   const ctx={meta:S.tutMeta,test:null,canLoad:x=>!!batteryKey(x),onLoad:x=>{const k=batteryKey(x);if(!k)return;loadTutorial('battery',{...S.tut.options,vst:k,dir:x.p_bus>0?'dis':'chg',ctrl:'fixed',bus:'ideal'},true);$('.bench').scrollIntoView({behavior:'smooth'});}};
   ctx.test=ex.pickTest(r,ctx);MathPanel.renderExercise(box,ex,r,ctx);return;}
  const conv=circuitForMath();
  if(conv.error){S.recognized=null;if(S.theory)renderTheory();src.textContent='από το κύκλωμα';box.innerHTML=`<p class="muted">${esc(conv.error)}</p>`+(t.theory==='formula'&&theoryValidity(t).ok?`<h4>Βασικές σχέσεις για αυτό το κύκλωμα</h4>`+formulaTheory(t):'');return;}
  src.textContent='από το κύκλωμα · '+conv.roles.map(r=>r.label).join(', ');
  const B=await api('studio_math',{circuit:conv.circuit,params:conv.params});if(token!==mathToken)return;
  S.recognized=B.recognized?.topology||null;S.recognizedKey=circuitSig(editor.doc).key;if(S.theory)renderTheory();
  MathPanel.renderConverter(box,B,conv.roles,[...conv.notes,...(B.notes||[])]);
 }catch(e){if(token!==mathToken)return;box.innerHTML=`<p class="bad">Δεν υπολογίστηκε: ${esc(e.message)}</p>${location.protocol==='file:'?'<p>Άνοιξε την εφαρμογή μέσω <code>python run.py</code>.</p>':''}`;}
}
window.addEventListener('resize',()=>{clearTimeout(window.__mr);window.__mr=setTimeout(()=>MathPanel.redraw($('#math')),200);});

// ------------------------------------------------------------------ files
function saveLocal(){try{localStorage.setItem('pcl2-state',JSON.stringify(project()));}catch{}}
function download(name,text,type='application/json'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);}
function exportCSV(){const s=S.sim;if(!s)return;const ch=scope.channels();if(!ch.length){notice('Πρόσθεσε σήματα στο scope πρώτα.','info');return;}const [t0,t1]=scope.viewRange();const idx=ch.map(c=>scope.resolve(c.key));
 const r=s.ring,start=(r.head-r.n+r.cap)%r.cap;let out='time [s],'+ch.map(c=>`"${c.label} [${Scope.unitOf(c.key,s)}]"`).join(',')+'\n';
 for(let i=0;i<r.n;i++){const j=(start+i)%r.cap,t=r.t[j];if(t<t0||t>t1)continue;out+=t.toExponential(9)+','+idx.map(ci=>ci===-1?'':ci===-2?'0':r.d[j*r.nch+ci]).join(',')+'\n';}
 download('scope.csv',out,'text/csv');}

// ------------------------------------------------------------------ scope inputs
function syncScopeInputs(){const w=scope.cfg.window;$('#win-n').value=+(+w.n).toPrecision(4);$('#win-unit').value=w.unit;$('#trigger').value=scope.cfg.trigger;$('#display').value=scope.cfg.display;}
function setSpeed(v){S.speed=v==='max'?'max':+v;const sel=$('#speed');if(![...sel.options].some(o=>o.value===String(v))){const o=document.createElement('option');o.value=String(v);o.textContent=v+' T/s';sel.appendChild(o);}sel.value=String(v);}

// ------------------------------------------------------------------ settings modal
function openSettings(){const s=editor.settings,m=$('#settings');m.hidden=false;
 const sel=(k,label,opts)=>`<label class="frow"><span>${label}</span><select data-set="${k}">${opts.map(([v,n])=>`<option value="${v}" ${String(s[k])===String(v)?'selected':''}>${n}</option>`).join('')}</select></label>`;
 const chk=(k,label)=>`<label class="frow check"><input type="checkbox" data-set="${k}" ${s[k]?'checked':''}><span>${label}</span></label>`;
 $('#settings-body').innerHTML=`<section><h3>Ποντίκι</h3>
  ${sel('leftDrag','Αριστερό κλικ + σύρσιμο σε κενό',[['select','Επιλογή πολλών (ορθογώνιο)'],['pan','Μετακίνηση καμβά']])}
  ${sel('marquee','Ορθογώνιο επιλογής',[['direction','Δεξιά: πλήρως μέσα · αριστερά: όσα ακουμπά'],['contain','Μόνο όσα είναι πλήρως μέσα'],['touch','Όσα ακουμπά']])}
  ${sel('middleDrag','Μεσαίο κλικ + σύρσιμο',[['pan','Μετακίνηση καμβά'],['none','Τίποτα']])}
  ${sel('rightButton','Δεξί κλικ',[['menu','Μενού (scope, ρυθμίσεις…)'],['pan','Σύρσιμο: καμβάς · κλικ: μενού']])}
  ${sel('wheel','Ροδέλα',[['zoom','Zoom (Shift: οριζόντια κύλιση)'],['scroll','Κύλιση (Ctrl: zoom)']])}
  ${sel('dblclick','Διπλό κλικ σε στοιχείο',[['edit','Ρυθμίσεις'],['scope','Scope ρεύματος']])}
  <p class="muted small">Space + σύρσιμο μετακινεί πάντα τον καμβά. Το κείμενο του σχεδίου δεν επιλέγεται ποτέ.</p></section>
  <section><h3>Πλέγμα & σύρματα</h3>${chk('grid','Εμφάνιση πλέγματος')}${sel('gridStyle','Μορφή πλέγματος',[['dots','Κουκκίδες'],['lines','Γραμμές']])}
  ${sel('wireWidth','Πάχος συρμάτων',[[1.6,'Λεπτό'],[2.2,'Κανονικό'],[3,'Χοντρό']])}${sel('corner','Γωνίες συρμάτων',[['round','Στρογγυλεμένες'],['sharp','Ορθές']])}
  ${chk('freeEnds','Ελεύθερα άκρα: σύρμα που αφήνεις στο κενό κρατά ελεύθερο άκρο (αλλιώς ακυρώνεται)')}${chk('autoConnect','Στοιχείο που αφήνεις πάνω σε σύρμα ή ακροδέκτη συνδέεται, ή μπαίνει σε σειρά (Shift: χωρίς σύνδεση)')}
  ${sel('snapPx','Κούμπωμα σε ακροδέκτη ή σύρμα σε απόσταση',[[6,'6 px'],[12,'12 px'],[20,'20 px']])}
  ${chk('autoRoute','Αυτόματη δρομολόγηση A* όταν αφήνεις στοιχείο (αλλιώς κρατά τη δική σου διαδρομή)')}</section>
  <section><h3>Ζωντανές ενδείξεις</h3>${chk('showLive','Τιμές πάνω στο κύκλωμα')}${chk('showArrows','Βέλη φοράς ρεύματος')}</section>`;
 $$('#settings [data-set]').forEach(el=>el.onchange=()=>{const k=el.dataset.set;let v=el.type==='checkbox'?el.checked:el.value;if(k==='wireWidth'||k==='snapPx')v=+v;editor.settings[k]=v;saveSettings();editor.render();renderProps();});}

// ------------------------------------------------------------------ boot
function boot(){
 const saved=loadSettings();
 editor=new Editor($('#canvas'),{settings:saved,
  onchange:kind=>{if(kind==='struct'||kind==='param'){if(S.batch)S.batch.stale=true;buildSim(false);if(S.theory)setTimeout(()=>{if(tutorial().theory==='v1'||tutorial().theory==='formula')runTheory();},50);scheduleMath();}saveLocal();if(kind==='struct')renderChannels();},
  onselect:sel=>{$('#selinfo').textContent=sel.c.length+sel.w.length?`${sel.c.length} στοιχεία · ${sel.w.length} σύρματα επιλεγμένα`:'';renderProps();},
  ontool:on=>{const b=$('#wire-tool');b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on));},
  onedit:ev=>{if(ev.kind==='comp'){const c=editor.comp(ev.id);if(c?.type==='SUB'){enterSub(c.params.def,S.pfx===null?null:pid(c.id));return;}const sg=editor.settings.dblclick==='scope'&&S.pfx!==null?signalsFor(c):[];if(sg.length)addProbe(sg[0][0]+pid(ev.id)+(sg[0][2]||''));else openInspector(ev.id,ev.x,ev.y);}else openWireInspector(ev.id,ev.x,ev.y);},
  ongroup:shift=>{if(shift){const id=editor.selection().c.find(i=>editor.comp(i)?.type==='SUB');if(id)expandSub(id);else{notice('Διάλεξε ένα υποκύκλωμα για ανάπτυξη (Ctrl+Shift+G).','info');setTimeout(()=>notice(''),2500);}}else groupSel();},
  canPlace:placeOk,subParams:name=>subParams(name),
  oncontext:openMenu,onwarn:t=>{notice(t,'error');setTimeout(()=>notice(''),5000);}});
 editor.setLive(liveOf);
 scope=new Scope($('#scope-canvas'),{onfreeze:()=>{$('#live-btn').hidden=false;},onchange:()=>{renderMeasure();},onhover:()=>{}});
 editor.svg.addEventListener('pointermove',e=>{const el=e.target.closest?.('[data-c]');hoverComp=el?.dataset.c||null;hoverPos=[e.clientX,e.clientY];updateHover();});
 editor.svg.addEventListener('pointerleave',()=>{hoverComp=null;updateHover();});
 // toolbar
 $('#play').onclick=()=>S.running?pause():play();$('#reset').onclick=reset;$('#step1').onclick=()=>stepT(1);$('#step10').onclick=()=>stepT(10);$('#toend').onclick=runToEnd;
 $('#speed').onchange=e=>setSpeed(e.target.value);
 $('#step-mode').onchange=e=>{editor.setSolve({step:e.target.value==='var'?'var':''});};
 document.querySelectorAll('[data-dsev]').forEach(x=>x.onchange=renderDiag);$('#diag-src').onchange=renderDiag;$('#diag-q').oninput=renderDiag;
 $('#diag-check').onclick=()=>{if(S.sim&&!S.error)S.sim.stepCheck();renderDiag();};
 $('#diag-clear').onclick=()=>{if(S.sim){S.sim.dg=new Map();S.sim.dgVer=(S.sim.dgVer||0)+1;}S.batchDiag=[];renderDiag();};
 try{if(localStorage.getItem('pcl-diag-open')==='1')$('#diag').open=true;}catch(e){}
 $('#diag').addEventListener('toggle',()=>{try{localStorage.setItem('pcl-diag-open',$('#diag').open?'1':'0');}catch(e){}});
 $('#sim-step').onchange=()=>{if(S.sim){S.sim.setStep(+$('#sim-step').value);S.sim.cache.clear();updateClock();scheduleStepCheck();}};
 $('#stop').onchange=e=>{const v=P.parseEng(e.target.value);S.stopT=Number.isFinite(v)&&v>0?v*1e-3:0;saveLocal();};
 $('#win-n').onchange=e=>{const v=P.parseEng(e.target.value);if(v>0){scope.cfg.window.n=v;scope.cfg.frozen=null;draw(true);}};
 $('#win-unit').onchange=e=>{scope.cfg.window.unit=e.target.value;scope.cfg.frozen=null;draw(true);};
 $('#trigger').onchange=e=>{scope.cfg.trigger=e.target.value;draw(true);};$('#display').onchange=e=>{scope.cfg.display=e.target.value;draw(true);};
 $('#avgline').onchange=e=>{scope.cfg.avgLine=e.target.checked;draw(true);};
 ['#rm-sig','#rm-ev','#rm-ref','#rm-band','#rm-val','#rm-t'].forEach(q=>$(q).onchange=renderMetricsPanel);$('#rm-block').ontoggle=renderMetricsPanel;
 ['#ff-sig','#ff-f1','#ff-p','#ff-h'].forEach(q=>$(q).onchange=renderFFT);$('#ff-block').ontoggle=renderFFT;
 $('#eis-block').ontoggle=renderEISForm;$('#eis-run').onclick=runEIS;$('#eis-stop').onclick=()=>{EIS.run=false;};
 ['#bf-sig','#bf-stat'].forEach(q=>$(q).onchange=renderPoincare);$('#bf-block').ontoggle=()=>{renderBifurcationForm();renderPoincare();};$('#bf-run').onclick=runBifurcation;$('#bf-stop').onclick=stopBifurcation;
 $('#bt-run').onclick=runBatch;$('#bt-clear').onclick=clearBatch;$('#bt-show').onchange=e=>{scope.setRefs(e.target.checked&&S.batch?{label:S.batch.label,data:S.batch.data}:null);};
 $('#bt-block').ontoggle=()=>{if($('#bt-block').open&&!$('#bt-tend').value&&S.sim)$('#bt-tend').placeholder=S.sim.t>0?String(+(S.sim.t*1e3).toPrecision(5)):S.stopT?String(+(S.stopT*1e3).toPrecision(5)):'ms';};
 $('#live-btn').onclick=()=>{scope.cfg.frozen=null;$('#live-btn').hidden=true;draw(true);};
 {let show=true;try{show=localStorage.getItem('pcl2-live-panel')!=='0';}catch{}setLivePanel(show);
  $('#lp-toggle').onclick=()=>setLivePanel($('#live-panel').hidden);$('#lp-hide').onclick=()=>setLivePanel(false);
  // drag the panel by its title, inside the scope area
  const pnl=$('#live-panel'),head=pnl.querySelector('.lp-head');head.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;e.preventDefault();head.setPointerCapture(e.pointerId);
   const wrap=pnl.parentElement.getBoundingClientRect(),r=pnl.getBoundingClientRect(),dx=e.clientX-r.left,dy=e.clientY-r.top;
   const mv=ev=>{const x=Math.min(Math.max(0,ev.clientX-wrap.left-dx),wrap.width-r.width),y=Math.min(Math.max(0,ev.clientY-wrap.top-dy),Math.max(0,wrap.height-40));pnl.style.left=x+'px';pnl.style.top=y+'px';pnl.style.right='auto';};
   const up=()=>{head.removeEventListener('pointermove',mv);head.removeEventListener('pointerup',up);};head.addEventListener('pointermove',mv);head.addEventListener('pointerup',up);});}
 const navOpen=v=>{$('#scope-nav').hidden=!v;$('#nav-toggle').setAttribute('aria-expanded',v);$('#nav-toggle').classList.toggle('on',v);try{localStorage.setItem('pcl2-nav',v?'1':'0');}catch{}scope.resize();};
 $('#nav-toggle').onclick=()=>navOpen($('#scope-nav').hidden);try{navOpen(localStorage.getItem('pcl2-nav')!=='0');}catch{navOpen(true);}
 $$('#scope-nav [data-nav]').forEach(b=>b.onclick=()=>{scope.nav(b.dataset.nav);$('#live-btn').hidden=!scope.cfg.frozen;$('#nav-follow').classList.toggle('on',scope.cfg.follow!==false);syncScopeInputs();renderChannels();draw(true);});
 const METHOD_NOTE={TR:'2ης τάξης, χωρίς απόσβεση',BDF2:'2ης τάξης, απόσβεση στις υψηλές συχνότητες',BE:'1ης τάξης, ισχυρή απόσβεση'};
 $('#method').onchange=e=>{S.sim?.setMethod(e.target.value);scheduleStepCheck();$('#method-note').textContent=METHOD_NOTE[e.target.value];saveLocal();};
 $('#add-signal').onchange=e=>{if(e.target.value)addProbe(e.target.value);e.target.value='';};
 const probeSel=pre=>{const ids=editor.selection().c.filter(id=>{const c=editor.comp(id);return c&&signalsFor(c).some(([p,,f])=>p===pre&&!f);});if(!ids.length){notice('Επίλεξε πρώτα στοιχεία στο κύκλωμα (κλικ ή ορθογώνιο).','info');setTimeout(()=>notice(''),2500);return;}ids.forEach(id=>addProbe(pre+pid(id)));};
 $('#probe-i').onclick=()=>probeSel('I:');$('#probe-v').onclick=()=>probeSel('V:');
 $('#csv').onclick=exportCSV;
 $('#cr-open').onclick=()=>$('#cr-file').click();$('#cr-clear').onclick=clearCsv;
 $('#cr-file').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const C=parseCSV(await f.text());C.file=f.name;S.csv=C;renderCsvMap();$('#cr-status').innerHTML=`${C.names.length} ${C.names.length===1?'στήλη':'στήλες'} σημάτων, ${C.t.length.toLocaleString('el-GR')} γραμμές. Διάλεξε σε ποιο σήμα αντιστοιχεί η καθεμία.`;$('#cr-status').className='bt-status';}
  catch(err){$('#cr-status').innerHTML='Σφάλμα: '+esc(err.message);$('#cr-status').className='bt-status err';}e.target.value='';};$('#clear-cursors').onclick=()=>{scope.cfg.cursors=[];draw(true);};
 $('#fit').onclick=()=>editor.fit();$('#undo').onclick=()=>editor.undo();$('#redo').onclick=()=>editor.redo();$('#rot').onclick=()=>editor.rotateSel();$('#del').onclick=()=>editor.deleteSel();
 $('#tutorials').onclick=()=>gallery(true);$('#gallery-close').onclick=()=>gallery(false);
 $('#open-settings').onclick=openSettings;$('#settings-close').onclick=()=>$('#settings').hidden=true;
 $('#theory-refresh').onclick=()=>runTheory();$('#math-refresh').onclick=()=>runMath();
 $('#math-tpl').onchange=e=>{S.mathChoice=S.mathChoice||{};S.mathChoice[tutorial().id]=e.target.value;runMath();};
 $('#math-open').onclick=()=>$('#tpl-file').click();
 $('#tpl-file').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const tpl=JSON.parse(await f.text());const r=Exercises.registerData(tpl,'αρχείο '+f.name,true);S.mathChoice=S.mathChoice||{};S.mathChoice[tutorial().id]=r.id;runMath();$('#math-card').scrollIntoView({behavior:'smooth'});}catch(err){notice('Template: '+esc(err.message),'error');}e.target.value='';};
 Exercises.load().then(()=>runMath());
 $('#new').onclick=()=>loadTutorial('empty');
 $('#save').onclick=()=>download((tutorial().id||'circuit')+'.pcl.json',JSON.stringify(project(),null,1));
 $('#open').onclick=()=>$('#file').click();
 $('#file').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const pr=JSON.parse(await f.text());if(!Array.isArray(pr.components))throw Error('Δεν είναι αρχείο κυκλώματος.');S.tut=pr.tutorial||{id:'empty',options:{}};S.tutMeta=null;S.tutRef=pr.tutRef||tutorialRef(S.tut);applyProject(pr);if(typeof pr.scenario==='string')S.scenForeign=true;renderTutorial();runTheory();}catch(err){notice('Άνοιγμα: '+esc(err.message),'error');}e.target.value='';};
 $('#pal-search').oninput=renderPalette;$('#pal-toggle').onclick=()=>document.body.classList.toggle('pal-hidden');
 // parameters panel (3.7) and wire tool
 {let open=innerWidth>700;try{const v=localStorage.getItem('pcl2-props');if(v)open=v==='1';}catch{}setProps(open);
  $('#props-btn').onclick=()=>setProps(!propsOpen());$('#props-tab').onclick=()=>setProps(true);}
 $('#wire-tool').onclick=()=>{editor.setWireTool(!editor.wireTool);editor.svg.focus({preventScroll:true});};
 document.addEventListener('pointerdown',e=>{if(!e.target.closest('#ctx'))closeMenu();if(!e.target.closest('#inspector')&&!e.target.closest('.schem')&&!e.target.closest('#ctx'))closeInspector();});
 document.addEventListener('keydown',e=>{const tg=e.target,typing=tg&&(tg.isContentEditable||/^(INPUT|SELECT|TEXTAREA)$/.test(tg.tagName)),plain=!e.ctrlKey&&!e.metaKey&&!e.altKey;
  if((e.key==='p'||e.key==='P')&&plain&&!typing){setLivePanel($('#live-panel').hidden);return;}
  if((e.key==='i'||e.key==='I')&&plain&&!typing){setProps(!propsOpen());return;}
  if(e.key==='Escape'){closeMenu();closeInspector();gallery(false);$('#settings').hidden=true;if(e.target!==editor.svg&&editor.escape(false))editor.svg.focus({preventScroll:true});}   // Esc always drops the part being placed
  if(e.target===document.body&&e.code==='Space'){e.preventDefault();S.running?pause():play();}});
 // resizable canvas
 const grip=$('#grip');grip.onpointerdown=e=>{e.preventDefault();grip.setPointerCapture(e.pointerId);const h0=$('.work').getBoundingClientRect().height,y0=e.clientY;grip.onpointermove=ev=>{$('.work').style.height=Math.max(240,Math.min(1000,h0+ev.clientY-y0))+'px';};grip.onpointerup=()=>{grip.onpointermove=null;};};
 renderPalette();
 // restore last state or start with a tutorial
 initScenarios();initAddons();
 let st=null;try{st=JSON.parse(localStorage.getItem('pcl2-state'));}catch{}
 const qs=new URLSearchParams(location.search),want=qs.get('tutorial');let imp=null;
 if(qs.get('import')){try{imp=JSON.parse(localStorage.getItem('pcl2-import'));localStorage.removeItem('pcl2-import');}catch{}history.replaceState(null,'',location.pathname);}
 if(imp&&Array.isArray(imp.components)){S.tut=imp.tutorial||{id:'empty',options:{}};S.tutMeta=null;S.tutRef=circuitSig(imp);applyProject(imp);renderTutorial();runTheory();runMath();notice('Άνοιξε το κύκλωμα από τον αναλυτικό πάγκο '+esc(imp.from||'')+'. Οι αρχικές συνθήκες είναι της μόνιμης κατάστασης που υπολόγισε.','info');setTimeout(()=>notice(''),6000);}
 else if(want&&Tutorials.get(want))loadTutorial(want);
 else if(st&&Array.isArray(st.components)){S.tut=st.tutorial||{id:'empty',options:{}};S.tutRef=st.tutRef||tutorialRef(S.tut);const t=Tutorials.get(S.tut.id);if(t&&S.tut.id!=='empty'){const pr=t.build({...Object.fromEntries(t.options.map(o=>[o.k,o.def])),...S.tut.options});S.tutMeta=pr.meta||null;}applyProject(st);renderTutorial();runTheory();runMath();}
 else loadTutorial('buck');
 fetch('/api/health').then(r=>r.json()).then(h=>{$('#engine').textContent='Engine '+h.version;$('#engine').classList.add('ok');}).catch(()=>{$('#engine').textContent='Χωρίς server: μόνο προσομοίωση';});
 setInterval(()=>{if(S.theory&&(S.running||S.frame))renderTheoryLive();},1000);
}
function renderTheoryLive(){if(!atTop()||document.querySelector('#theory details[open]'))return;renderTheory();}
window.addEventListener('DOMContentLoaded',boot);
window.PCL={get S(){return S;},get editor(){return editor;},get scope(){return scope;},loadTutorial,addProbe,play,pause,reset,renderTheory,renderFFT,renderPoincare,runBifurcation,get BF(){return BF;},runEIS,get EIS(){return EIS;},get SCEN(){return SCEN;},scenRun};
})();
