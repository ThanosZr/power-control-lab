// The library in taxonomies (4.6, library.js): what every taxonomy shows, for test_library.py
global.window=globalThis;require('../../web/studio/parts.js');const L=require('../../web/studio/library.js');const P=globalThis.Parts;
const vis=Object.entries(P.PARTS).filter(([k,d])=>!d.hidden).map(([k])=>k);const out={visible:vis,tax:{}};
for(const t of L.TAX){const v=L.view(t.id,P.PARTS,{fav:['R','CPL'],recent:['SCR','L']});const items=v.flatMap(g=>g.sub.flatMap(s=>s.items));
 out.tax[t.id]={groups:v.map(g=>g.title),items,multi:!!t.multi};}
out.search={pinio:L.view('field',P.PARTS,{q:'πηνιο'}).flatMap(g=>g.sub.flatMap(s=>s.items)),sw:L.view('abc',P.PARTS,{q:'διακόπτης'}).flatMap(g=>g.sub.flatMap(s=>s.items)),
 none:L.view('field',P.PARTS,{q:'zzzz'}).length};
// a part that no taxonomy names (a new one) is never lost: it goes to «Άλλα»
const extra={...P.PARTS,NEWX:{name:'Νέο στοιχείο',group:'Πηγές'}};out.extra=L.view('field',extra,{}).filter(g=>g.title==='Άλλα').flatMap(g=>g.sub.flatMap(s=>s.items));
out.abcOrder=L.view('abc',P.PARTS,{})[0].sub[0].items.slice(0,5).map(k=>P.PARTS[k].name);
console.log(JSON.stringify(out));
