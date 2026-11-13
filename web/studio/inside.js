'use strict';
// 4.8.1 (ROADMAP «Τι προτείνω» 4.8.1 δ): the inside of a signal library part (Ελεγκτής AI, πολυκριτηριακός ελεγκτής,
// AVR, PSS, ρυθμιστής στροφών) on the screen, with a double click: its blocks laid out by the flow of the signals
// (layers from the inputs, the feedback drawn back underneath), what each one computes, and its value now, while the
// circuit runs. Read only: the part is changed from its parameters, as before.
// Layout: the edges that close a loop are found by a depth-first search from the inputs and set aside; the rest is a
// DAG whose longest paths give the layers (a block with no inputs, a constant or a clock, sits just before the first
// block it feeds); the order inside a layer comes from a few sweeps of barycentres.
(function(root){
 const P=root.Parts;
 const NL=()=>root.NetLib;
 const I={id:null,el:null,timer:null,g:null};
 const W=150,H=54,DX=190,DY=74,PAD=24;
 const C=()=>I.ctx;
 const SIGNAL=new Set(['AIC','EVC','AVR','PSS','GOV','SSSC','SPLL']);
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const short=(s,n)=>{s=String(s??'');return s.length>n?s.slice(0,n-1)+'…':s;};
 const can=c=>!!c&&!!NL()&&NL().isLib(c.type);
 // 4.9.1: a double click shows the inside of the signal parts; the electrical ones open their settings (the inside from the menu)
 const canDbl=c=>can(c)&&SIGNAL.has(c.type);

 // what a block computes, in one line (numbers with 4 significant digits)
 function what(k){const p0=k.params||{},t=k.type,p={};for(const [q,v] of Object.entries(p0)){const n=typeof v==='number'?v:typeof v==='string'&&/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(v.trim())?+v:NaN;p[q]=Number.isFinite(n)&&C()?C().eng(n,'',4).replace(/\s+$/,''):v;}
  switch(t){
   case 'SIN':return 'είσοδος '+p.name;case 'SOUT':return 'έξοδος '+p.name;
   case 'EXPR':return p.expr;case 'GAIN':return 'K = '+p.K;case 'CONST':return 'v = '+short(p.v,26);
   case 'LPF':return 'f_c = '+p.fc+' Hz';case 'INT':return '∫ dt'+(p.lo!==undefined||p.hi!==undefined?' (με όρια)':'');case 'SUM':return 'Σ '+(p.signs||'++');
   case 'PIB':return `PI: K_p = ${p.Kp}, K_i = ${p.Ki}`;case 'NN':return `νευρωνικό ${p.ins||''} → y, ${p.hidden||8} κρυφοί`;
   case 'SAT':return `όρια ${p.lo} … ${p.hi}`;case 'CLK':return 'ρολόι '+p.f+' Hz';case 'MUL':return 'a · b';case 'DIV':return 'a / b';
   case 'RLIM':return 'όριο ρυθμού';case 'UD':return 'z⁻¹';case 'F2':return 'φίλτρο 2ης τάξης';
   default:return (P.PARTS[t]?.name)||t;}}

 // the graph of the definition: nodes (no junctions, no grounds) and directed edges from an output pin to an input pin
 function graph(c){const d=NL().defOf(c),cs=d.components.filter(k=>k.type!=='JUNC'&&k.type!=='GND'),by=new Map(cs.map(k=>[k.id,k]));
  // nets: wires joined at junctions
  const par=new Map(),f=x=>{while(par.get(x)!==x){par.set(x,par.get(par.get(x)));x=par.get(x);}return x;},key=e=>{const k=d.components.find(q=>q.id===e.c);return k&&k.type==='JUNC'?'J:'+e.c:e.c+':'+e.p;};
  const add=x=>{if(!par.has(x))par.set(x,x);};
  for(const w of d.wires){const a=key(w.a),b=key(w.b);add(a);add(b);par.set(f(a),f(b));}
  const nets=new Map();for(const w of d.wires)for(const e of [w.a,w.b]){if(!by.has(e.c))continue;const r=f(key(e)),n=nets.get(r)||{src:[],dst:[]};nets.set(r,n);
   const kind=P.pinKind(by.get(e.c),e.p);const ent={c:e.c,p:e.p};if(kind==='out'){if(!n.src.some(q=>q.c===e.c&&q.p===e.p))n.src.push(ent);}else if(!n.dst.some(q=>q.c===e.c&&q.p===e.p))n.dst.push(ent);}
  const edges=[];for(const n of nets.values())for(const s of n.src)for(const t of n.dst)edges.push({a:s.c,ap:s.p,b:t.c,bp:t.p,back:false});
  return {title:d.title,nodes:cs,edges};}

 function layout(g){const ids=g.nodes.map(k=>k.id),out=new Map(ids.map(i=>[i,[]])),inn=new Map(ids.map(i=>[i,[]]));
  for(const e of g.edges){out.get(e.a).push(e);inn.get(e.b).push(e);}
  // feedback: edges into a node on the current path of a DFS from the inputs (then from what is left)
  const st=new Map(),typ=new Map(g.nodes.map(k=>[k.id,k.type]));
  const dfs=v=>{st.set(v,1);for(const e of out.get(v)){const s=st.get(e.b);if(s===1)e.back=true;else if(!s)dfs(e.b);}st.set(v,2);};
  for(const v of ids)if(typ.get(v)==='SIN'&&!st.get(v))dfs(v);
  for(const v of ids)if(!inn.get(v).length&&!st.get(v))dfs(v);
  for(const v of ids)if(!st.get(v))dfs(v);
  // layers: longest path over the forward edges
  const L=new Map(),fw=v=>inn.get(v).filter(e=>!e.back),order=[];const seen=new Set();
  const visit=v=>{if(seen.has(v))return;seen.add(v);for(const e of fw(v))visit(e.a);order.push(v);};ids.forEach(visit);
  for(const v of order){const p=fw(v);L.set(v,p.length?Math.max(...p.map(e=>L.get(e.a)+1)):0);}
  // a source that is not an input (constant, clock): just before the first block it feeds
  for(const v of [...order].reverse())if(typ.get(v)!=='SIN'&&!fw(v).length){const q=out.get(v).filter(e=>!e.back);if(q.length)L.set(v,Math.max(0,Math.min(...q.map(e=>L.get(e.b)))-1));}
  // the outputs in a column of their own, after everything else
  const last=Math.max(0,...ids.filter(v=>typ.get(v)!=='SOUT').map(v=>L.get(v)));for(const v of ids)if(typ.get(v)==='SOUT')L.set(v,last+1);
  const nl=Math.max(...[...L.values()])+1,lay=Array.from({length:nl},()=>[]);for(const v of order)lay[L.get(v)].push(v);
  // the order inside each layer: barycentres of the neighbours, down and up
  const pos=new Map();const setPos=()=>lay.forEach(a=>a.forEach((v,i)=>pos.set(v,i)));setPos();
  const bary=(v,dir)=>{const es=dir>0?inn.get(v).filter(e=>L.get(e.a)<L.get(v)).map(e=>e.a):out.get(v).filter(e=>L.get(e.b)>L.get(v)).map(e=>e.b);return es.length?es.reduce((s,u)=>s+pos.get(u),0)/es.length:pos.get(v);};
  for(let it=0;it<4;it++){for(let l=1;l<nl;l++){lay[l].sort((a,b)=>bary(a,1)-bary(b,1));lay[l].forEach((v,i)=>pos.set(v,i));}
   for(let l=nl-2;l>=0;l--){lay[l].sort((a,b)=>bary(a,-1)-bary(b,-1));lay[l].forEach((v,i)=>pos.set(v,i));}}
  const mx=Math.max(...lay.map(a=>a.length)),xy=new Map();
  lay.forEach((a,l)=>{const off=(mx-a.length)*DY/2;a.forEach((v,i)=>xy.set(v,[PAD+l*DX,PAD+off+i*DY]));});
  return {xy,w:PAD*2+(nl-1)*DX+W,h:PAD*2+(mx-1)*DY+H+40,nl};}

 // the key of a node's value: the inner block's channel; for an input, the outer signal wired to the part
 function keyOf(c,k){const x=C(),full=x.pid(c.id);
  if(k.type==='SIN'){const w=(x.wires()||[]).find(w=>(w.a.c===c.id&&w.a.p===k.params.name)||(w.b.c===c.id&&w.b.p===k.params.name));if(!w)return null;
   const o=w.a.c===c.id?w.b:w.a,oc=x.comp(o.c);if(!oc)return null;
   if(NL().isLib(oc.type)){const d=NL().defOf(oc),so=d.components.find(q=>q.type==='SOUT'&&q.params.name===o.p),w2=so&&d.wires.find(q=>q.a.c===so.id||q.b.c===so.id);if(!w2)return null;
    const src=w2.a.c===so.id?w2.b:w2.a;return 'Y:'+x.pid(o.c)+'/'+src.c+(src.p==='y'?'':':'+src.p);}  // the output of another library part: its inner block
   const outs=Object.entries(P.sigPins(oc)).filter(([,v])=>v.dir==='out').map(([q])=>q);
   return 'Y:'+x.pid(o.c)+(outs[0]===o.p?'':':'+o.p);}
  if(k.type==='SOUT')return null;
  return 'Y:'+full+'/'+k.id;}

 function draw(c){const g=graph(c),lay=layout(g),{xy}=lay,by=new Map(g.nodes.map(k=>[k.id,k]));I.g={g,keys:new Map()};
  const ymax=Math.max(...[...xy.values()].map(p=>p[1]))+H;
  const nin=new Map();for(const e of g.edges)nin.set(e.b,(nin.get(e.b)||0)+1);
  let s='';
  for(const e of g.edges){const [x1,y1]=xy.get(e.a),[x2,y2]=xy.get(e.b),a=[x1+W,y1+H/2],b=[x2,y2+H/2];
   const d=e.back?`M${a[0]},${a[1]} C${a[0]+70},${ymax+34} ${b[0]-70},${ymax+34} ${b[0]},${b[1]}`:`M${a[0]},${a[1]} C${(a[0]+b[0])/2},${a[1]} ${(a[0]+b[0])/2},${b[1]} ${b[0]},${b[1]}`;
   s+=`<path class="in-e${e.back?' back':''}" d="${d}" marker-end="url(#in-arr)"><title>${esc(e.a+'.'+e.ap+' → '+e.b+'.'+e.bp)}</title></path>`;
   if((nin.get(e.b)||0)>1)s+=`<text class="in-pin" x="${b[0]-4}" y="${b[1]-4}" text-anchor="end">${esc(e.bp)}</text>`;}
  const kin=k=>{if(k.type!=='SOUT')return keyOf(c,k);const e=g.edges.find(q=>q.b===k.id),a=e&&by.get(e.a);if(!a)return null;return a.type==='SIN'?keyOf(c,a):'Y:'+C().pid(c.id)+'/'+a.id+(e.ap==='y'?'':':'+e.ap);};
  for(const k of g.nodes){const [x,y]=xy.get(k.id),io=k.type==='SIN'||k.type==='SOUT',w=what(k),key=kin(k);if(key)I.g.keys.set(k.id,key);
   s+=`<g class="in-n${io?' io':''}" transform="translate(${x},${y})"><rect width="${W}" height="${H}" rx="7"/><title>${esc(k.id+' · '+k.type+'\n'+w)}</title>
    <text x="8" y="16" class="in-id">${esc(io?k.params.name:k.id)}<tspan class="in-ty"> ${esc(io?'':k.type)}</tspan></text>
    <text x="8" y="31" class="in-w">${esc(short(w,24))}</text><text x="8" y="46" class="in-v" data-iv="${esc(k.id)}">${key?'—':''}</text></g>`;}
  return {svg:`<svg class="in-svg" width="${lay.w}" height="${lay.h}" data-w="${lay.w}" viewBox="0 0 ${lay.w} ${lay.h}" role="img" aria-label="${esc('Τα μπλοκ μέσα στο '+(c.label||c.id))}">
   <defs><marker id="in-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>${s}</svg>`,n:g.nodes.length,ne:g.edges.length,nb:g.edges.filter(e=>e.back).length,title:g.title,layers:lay.nl};}

 // 4.9.1 (ROADMAP §52): the inside of an electrical part (tower, arrester, grid, breaker, transformer …): its elements with
 // their symbols, laid out by NetLib.layoutDef, the wires as right-angle paths, and under each element its current now
 // (the meters: their reading). The same positions as «Ανάπτυξη σε υποκύκλωμα» gives in the editor.
 function elValue(k){const p={...P.defaults(k.type),...(k.params||{})},d=P.PARTS[k.type];let v=null;try{v=d?.value?d.value(p):null;}catch(e){}
  if(v===null||v===undefined||v==='')return '';const n=typeof v==='number'?v:typeof v==='string'?P.parseEng(v):NaN;return Number.isFinite(n)&&C()?C().eng(n,d.unit||'',3):short(String(v),18);}
 function drawEl(c){const d=NL().defOf(c),lay=NL().layoutDef(d,NL().sidesOf(c)),cs=lay.components,by=new Map(cs.map(k=>[k.id,k]));I.g={g:{nodes:cs},keys:new Map()};
  let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;for(const k of cs){const [bx,by2,bw,bh]=P.boxOf(k);const pts=[[bx,by2],[bx+bw,by2+bh]].map(q=>P.xf(k,q));for(const q of [...pts,...Object.keys(P.pinsOf(k)).map(n=>P.pinPos(k,n))]){x0=Math.min(x0,q[0]);y0=Math.min(y0,q[1]);x1=Math.max(x1,q[0]);y1=Math.max(y1,q[1]);}}
  const M=40,W0=x1-x0+2*M,H0=y1-y0+2*M+16,ox=M-x0,oy=M-y0;let s='';
  // wires: horizontal first from a pin that points sideways, vertical first otherwise
  for(const w of lay.wires){const A=by.get(w.a.c),B=by.get(w.b.c);if(!A||!B)continue;const a=P.pinPos(A,w.a.p),b=P.pinPos(B,w.b.p);if(!a||!b)continue;
   const da=P.pinDir(A,w.a.p),via=w.pts&&w.pts.length?w.pts:[da[0]&&A.type!=='JUNC'?[b[0],a[1]]:[a[0],b[1]]],pts=[a,...via,b].map(q=>(q[0]+ox)+','+(q[1]+oy)).join(' ');
   s+=`<polyline class="in-ew" points="${pts}"/>`;}
  for(const k of cs){if(k.type==='JUNC'){const n=[...lay.wires].filter(w=>w.a.c===k.id||w.b.c===k.id).length;if(n>2)s+=`<circle class="in-dot" cx="${k.x+ox}" cy="${k.y+oy}" r="3.2"/>`;continue;}
   const def=P.PARTS[k.type];if(!def)continue;const tf=`translate(${k.x+ox},${k.y+oy}) rotate(${90*(k.rot||0)}) scale(${k.flip?-1:1},1)`;
   let sym='';try{sym=def.draw({...P.defaults(k.type),...k.params});}catch(e){sym='<rect class="block" x="-15" y="-10" width="30" height="20"/>';}
   {const r=k.rot||0,f=k.flip?-1:1;if(r||k.flip)sym=sym.replace(/<text class="(btxt|bsm)" x="([-\d.]+)" y="([-\d.]+)"/g,(m,q,x,y)=>`${m} transform="translate(${x} ${+y-4}) scale(${f} 1) rotate(${-90*r}) translate(${-x} ${4-y})"`);}  // upright text, as in the editor
   const io=['PORT','SIN','SOUT'].includes(k.type),gnd=k.type==='GND';
   s+=`<g class="part t-${k.type} in-part" transform="${tf}"><title>${esc(k.id+' · '+(def.name||k.type))}</title><g class="sym">${sym}</g></g>`;
   if(gnd)continue;const [bx,by2,bw,bh]=P.boxOf(k),bb=[[bx,by2],[bx+bw,by2+bh]].map(q=>P.xf(k,q)),bx1=Math.max(bb[0][0],bb[1][0]),byt=Math.min(bb[0][1],bb[1][1]),byb=Math.max(bb[0][1],bb[1][1]);
   const tx=bx1+4+ox,lab=io?k.params.name:k.id,val=io?'':elValue(k);
   s+=`<text class="in-lbl" x="${tx}" y="${byt+10+oy}">${esc(lab)}</text>`;if(val)s+=`<text class="in-val0" x="${tx}" y="${byt+22+oy}">${esc(val)}</text>`;
   // the live value: meters show their reading, the other elements their current
   const meter=['AM','VM','VP','IP'].includes(k.type),key=io?null:meter?'Y:'+C().pid(c.id)+'/'+k.id:'I:'+C().pid(c.id)+'/'+k.id;
   if(key){I.g.keys.set(k.id,key);s+=`<text class="in-v" x="${tx}" y="${Math.max(byb,byt+24)+8+oy}" data-iv="${esc(k.id)}">—</text>`;}}
  const n=cs.filter(k=>!['JUNC','GND','PORT','SIN','SOUT'].includes(k.type)).length;
  return {svg:`<svg class="in-svg in-el" width="${W0}" height="${H0}" data-w="${W0}" viewBox="0 0 ${W0} ${H0}" role="img" aria-label="${esc('Τα στοιχεία μέσα στο '+(c.label||c.id))}">${s}</svg>`,n,ne:lay.wires.length,nb:0,title:d.title,el:true};}

 function update(){const x=C(),el=I.el;if(!el||el.hidden||!I.g)return;const s=x.sim();
  for(const [id,key] of I.g.keys){const t=el.querySelector(`[data-iv="${CSS.escape(id)}"]`);if(!t)continue;let v=NaN;if(s&&s.chIndex?.has(key))v=s.now(key);
   const tx=Number.isFinite(v)?(key.startsWith('I:')?'i = '+x.eng(v,'A',3):'= '+x.eng(v,'',4)):'—';if(t.textContent!==tx)t.textContent=tx;}
  const tt=el.querySelector('[data-it]');if(tt&&s)tt.textContent='t = '+x.eng(s.t,'s',4);}

 function open(id){const x=C(),c=id&&x.comp(id);if(!can(c)){close();return false;}
  if(!I.el){const el=document.createElement('div');el.className='wpanel winside';el.id='lib-inside';el.hidden=true;x.holder().appendChild(el);I.el=el;
   el.addEventListener('click',e=>{if(e.target.closest('[data-iclose]'))close();if(e.target.closest('[data-ifit]')){const b=el.querySelector('.in-body');b.classList.toggle('fit');I.fit=b.classList.contains('fit');}});
   el.addEventListener('keydown',e=>{if(e.key==='Escape')close();});}
  let r;try{r=SIGNAL.has(c.type)?draw(c):drawEl(c);}catch(e){x.notice?.('Δεν σχεδιάστηκε το εσωτερικό: '+esc(e.message),'error');return false;}
  I.id=id;const el=I.el;
  el.innerHTML=`<div class="wp-head"><b>⧉ Μέσα στο ${esc(c.label||c.id)}</b><small class="wf-id">${esc(P.PARTS[c.type]?.name||c.type)} · ${r.el?`${r.n} στοιχεία${c.params?.impl==='fast'?' (γρήγορη υλοποίηση: ένα στοιχείο του λύτη)':''}`:`${r.n} μπλοκ, ${r.ne} σήματα${r.nb?`, ${r.nb} ανατροφοδότηση (διακεκομμένα)`:''}`}</small><small class="in-t" data-it></small><button class="in-fit" data-ifit title="Όλο το διάγραμμα στο πλάτος του παραθύρου, ή σε φυσικό μέγεθος με κύλιση">⤢ Όλο / 1:1</button><button class="x" data-iclose title="Κλείσιμο (Esc)">✕</button></div>
   <div class="in-body own-scroll" tabindex="0">${r.svg}</div>
   <div class="wp-foot small muted">${r.el?'Μόνο για ανάγνωση: κάτω από κάθε στοιχείο η τιμή του και το ρεύμα του τώρα (στα όργανα, η ένδειξή τους). Για αλλαγές: «▣ Ανάπτυξη σε υποκύκλωμα» από το μενού του στοιχείου.':'Μόνο για ανάγνωση: οι τιμές είναι του τρεξίματος, το μπλοκ αλλάζει από τις παραμέτρους του. Πέρασε από πάνω από ένα μπλοκ για την πλήρη έκφραση.'}</div>`;
  el.hidden=false;{const b=el.querySelector('.in-body'),sw=+el.querySelector('.in-svg').dataset.w;b.classList.toggle('fit',I.fit??(sw<=1.35*b.clientWidth));}update();clearInterval(I.timer);I.timer=setInterval(update,250);el.querySelector('.in-body')?.focus();return true;}
 function close(){clearInterval(I.timer);I.timer=null;I.id=null;I.g=null;if(I.el)I.el.hidden=true;}

 const api={init:ctx=>{I.ctx=ctx;},open,close,can,canDbl,openId:()=>I.id,graph,layout,update,drawEl};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Inside=api;
})(typeof window!=='undefined'?window:globalThis);
