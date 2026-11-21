// 5.0.5 (ROADMAP §94 step β): the model of the layout of the cards (web/studio/dock.js, Dock.model), without a page.
// Prints JSON for tests/test_dock.py: named cases, and a long random walk over every action with the invariants checked
// after each step (every card in exactly one group, no empty group, the shown card in its group, a floating group of one
// card, only known regions).
const D=require('../../web/studio/dock.js'),M=D.model;
const IDS=['circuit','scope','scen','addons','math','theory'];
const inv=L=>{const seen=new Map();for(const g of L.groups){if(!g.cards.length)return 'empty group '+g.id;if(!g.cards.includes(g.active))return 'active outside '+g.id;
  if(!['main','left','right','bottom','float'].includes(g.at))return 'region '+g.at;if(g.at==='float'&&g.cards.length!==1)return 'float of '+g.cards.length;
  for(const c of g.cards)seen.set(c,(seen.get(c)||0)+1);}
 for(const c of IDS)if(seen.get(c)!==1)return c+' ×'+(seen.get(c)||0);if(new Set(L.groups.map(g=>g.id)).size!==L.groups.length)return 'group id twice';return '';};
const out={cases:{},walk:{}};
const C=(k,v)=>{out.cases[k]=v;};
let L=M.fresh(IDS);
C('fresh',{n:L.groups.length,allMain:L.groups.every(g=>g.at==='main'&&g.cards.length===1),inv:inv(L),order:M.groups(L,'main',IDS).map(g=>g.cards[0])});
M.place(L,'scope','left');C('left',{w:M.where(L,'scope'),inv:inv(L)});
M.tab(L,'math','scope');C('tab',{scope:M.where(L,'scope'),math:M.where(L,'math'),inv:inv(L)});
M.activate(L,'scope');C('activate',{scope:M.where(L,'scope'),math:M.where(L,'math')});
M.place(L,'addons','float');M.tab(L,'theory','addons');C('noTabIntoFloat',{theory:M.where(L,'theory'),addons:M.where(L,'addons'),inv:inv(L)});
M.place(L,'math','main');C('backFromTab',{math:M.where(L,'math'),scope:M.where(L,'scope'),inv:inv(L)});
M.place(L,'scen','bottom');M.place(L,'theory','bottom');C('bottomTwo',{groups:M.groups(L,'bottom').map(g=>g.cards),inv:inv(L)});
M.tab(L,'circuit','theory');M.tab(L,'scope','circuit');C('mainOrder',{order:M.groups(L,'main',IDS).map(g=>g.cards)});
// tabs in the page: a group of many goes to the place of its first card in the page
const P=M.fresh(IDS);M.tab(P,'circuit','theory');C('pageGroupPlace',{order:M.groups(P,'main',IDS).map(g=>g.cards),active:M.where(P,'circuit').active});
// the layout from the storage: anything that is not a known card in a known region goes, a missing card comes back
C('normGarbage',{a:inv(M.normalize(null,IDS)),b:inv(M.normalize({groups:'x'},IDS)),c:inv(M.normalize(42,IDS))});
const bad={groups:[{id:'g1',at:'left',cards:['scope','scope','ghost','math'],active:'ghost'},{id:'g1',at:'float',cards:['scen','addons']},{id:'g9',at:'moon',cards:['theory']},{at:'right',cards:[]}],
 size:{left:5,right:'wide',bottom:99999},float:{scen:{x:1,y:2,w:3,h:4},ghost:{x:0,y:0,w:9,h:9},addons:{x:'a'}},max:'ghost'};
const N=M.normalize(bad,IDS);
C('normBad',{inv:inv(N),scope:M.where(N,'scope'),math:M.where(N,'math'),scen:M.where(N,'scen'),addons:M.where(N,'addons'),theory:M.where(N,'theory'),circuit:M.where(N,'circuit'),
 size:N.size,float:Object.keys(N.float),max:N.max});
const N2=M.normalize(M.copy(L),[...IDS,'new']);C('normNewCard',{w:M.where(N2,'new'),n:N2.groups.length-L.groups.length});
// a long random walk over every action
let seed=12345;const rnd=n=>{seed=(seed*1103515245+12345)%2147483648;return seed%n;};
let W=M.fresh(IDS),bad1='',steps=0;const AT=['main','left','right','bottom','float'];
for(let i=0;i<4000;i++){const a=rnd(4),id=IDS[rnd(IDS.length)];
 if(a===0)M.place(W,id,AT[rnd(AT.length)]);else if(a===1)M.tab(W,id,IDS[rnd(IDS.length)]);else if(a===2)M.activate(W,id);else W=M.normalize(JSON.parse(JSON.stringify(W)),IDS);
 steps++;const e=inv(W);if(e){bad1=i+': '+e;break;}}
out.walk={steps,bad:bad1,end:inv(M.normalize(W,IDS))};
let threw='';try{M.place(M.fresh(IDS),'scope','sky');}catch(e){threw=e.message;}out.cases.unknownRegion=threw;
console.log(JSON.stringify(out));
