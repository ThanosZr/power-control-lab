// 5.0.5 (ROADMAP §94 step β): the model of the layout of the cards (web/studio/dock.js, Dock.model), without a page.
// Prints JSON for tests/test_dock.py: named cases, and a long random walk over every action with the invariants checked
// after each step (every card in exactly one group, no empty group, the shown card in its group, a floating group of one
// card, only known regions). 5.0.10 (§94 steps δ and ε): the ready layouts, where a layout came from, and the second screen.
const D=require('../../web/studio/dock.js'),M=D.model;
const IDS=['circuit','scope','scen','addons','math','theory'];
const SOLO=['float','screen'];
const inv=(L,ids=IDS)=>{const seen=new Map();for(const g of L.groups){if(!g.cards.length)return 'empty group '+g.id;if(!g.cards.includes(g.active))return 'active outside '+g.id;
  if(!['main','left','right','bottom','float','screen'].includes(g.at))return 'region '+g.at;if(SOLO.includes(g.at)&&g.cards.length!==1)return g.at+' of '+g.cards.length;
  if(g.side!==undefined&&(!g.cards.includes(g.side)||g.side===g.active||SOLO.includes(g.at)||!(g.r>=0.2&&g.r<=0.8)))return 'side of '+g.id;
  for(const c of g.cards)seen.set(c,(seen.get(c)||0)+1);}
 for(const c of ids)if(seen.get(c)!==1)return c+' ×'+(seen.get(c)||0);if(new Set(L.groups.map(g=>g.id)).size!==L.groups.length)return 'group id twice';
 if(!L.from||!['home','preset','tutorial','saved','user'].includes(L.from.kind))return 'from '+JSON.stringify(L.from);return '';};
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
// 5.0.6 (§94 step γ): side by side in a group, its share of the width, a card that leaves, and the first place of a document
const S=M.fresh(IDS);M.side(S,'circuit','theory');
C('side',{c:M.where(S,'circuit'),t:M.where(S,'theory'),r:M.groupOf(S,'circuit').r,inv:inv(S),order:M.groups(S,'main',IDS).map(g=>g.cards.slice())});
M.activate(S,'theory');C('sideActivate',{c:M.where(S,'circuit'),t:M.where(S,'theory')});
M.tab(S,'scope','circuit');M.activate(S,'scope');C('sideThird',{s:M.where(S,'scope'),t:M.where(S,'theory'),c:M.where(S,'circuit'),inv:inv(S)});
M.ratio(S,'scope',0.95);C('sideRatio',{r:M.groupOf(S,'scope').r});M.ratio(S,'scope',0.3);
M.place(S,'theory','left');C('sideLeaves',{s:M.where(S,'scope'),c:M.where(S,'circuit'),inv:inv(S)});
M.side(S,'scope','circuit');M.place(S,'scope','main');C('activeLeaves',{c:M.where(S,'circuit'),inv:inv(S)});
M.side(S,'circuit','math');M.side(S,'circuit',null);C('sideOff',{c:M.where(S,'circuit'),m:M.where(S,'math'),inv:inv(S)});
M.place(S,'addons','float');M.side(S,'addons','scen');C('noSideInFloat',{a:M.where(S,'addons'),inv:inv(S)});
const Ns=M.normalize({groups:[{id:'a',at:'main',cards:['circuit','theory'],active:'circuit',side:'theory',r:7},{id:'b',at:'main',cards:['scope','math'],active:'scope',side:'scope'},{id:'c',at:'left',cards:['scen'],active:'scen',side:'ghost'}],docs:{scope:1,ghost:1}},IDS);
C('normSide',{a:M.groupOf(Ns,'circuit').side,r:M.groupOf(Ns,'circuit').r,b:M.groupOf(Ns,'scope').side===undefined,c:M.groupOf(Ns,'scen').side===undefined,docs:Object.keys(Ns.docs),inv:inv(Ns)});
const F=M.fresh(IDS);M.firstAs(F,'theory','circuit');const f1=M.where(F,'theory');M.place(F,'theory','right');M.firstAs(F,'theory','circuit');
const F2=M.fresh(IDS);M.place(F2,'theory','bottom');M.firstAs(F2,'theory','circuit');
C('firstAs',{f1,f2:M.where(F,'theory'),moved:M.where(F2,'theory'),docs:Object.keys(F.docs),fresh:Object.keys(M.fresh(IDS).docs).length});
// 5.0.10 (§94 step δ): the ready layouts, from all the cards of the page (and from fewer: a card that is not there is left out)
const ALL=['circuit','netview','scope','scen','cmd','addons','math','theory'];
const P0=M.preset('home',ALL),Pd=M.preset('design',ALL),Ps=M.preset('study',ALL),Pa=M.preset('analysis',ALL);
C('presets',{names:M.PRESETS.map(p=>p.name),titles:M.PRESETS.map(p=>p.title),inv:[P0,Pd,Ps,Pa].map(L=>inv(L,ALL)),from:[P0,Pd,Ps,Pa].map(L=>L.from),
 home:M.same(P0,M.fresh(ALL)),unknown:M.preset('moon',ALL)});
C('presetDesign',{scope:M.where(Pd,'scope'),bottom:Pd.size.bottom,main:M.groups(Pd,'main',ALL).map(g=>g.cards.join('+'))});
C('presetStudy',{nv:M.where(Ps,'netview'),c:M.where(Ps,'circuit'),th:M.where(Ps,'theory'),right:Ps.size.right,docs:Object.keys(Ps.docs)});
C('presetAnalysis',{c:M.where(Pa,'circuit'),s:M.where(Pa,'scope'),r:M.groupOf(Pa,'circuit').r,bottom:M.groups(Pa,'bottom').map(g=>[g.cards,g.active]),size:Pa.size.bottom});
C('presetFew',{inv:['home','design','study','analysis'].map(n=>inv(M.preset(n,IDS))),study:M.where(M.preset('study',IDS),'circuit'),analysis:M.groups(M.preset('analysis',IDS),'bottom').map(g=>g.cards)});
// where a layout came from: kept by normalize; an older layout (before 5.0.10, no «from») is the first page or the user's own
const old=f=>{const x=M.fresh(IDS);if(f)f(x);delete x.from;return M.normalize(x,IDS).from;};
C('from',{fresh:M.fresh(IDS).from,kept:M.normalize(M.copy(Pd),ALL).from,bad:M.normalize({...M.copy(Pd),from:{kind:'moon'}},ALL).from,
 oldHome:old(),oldUser:old(x=>M.place(x,'scope','left')),oldTabs:old(x=>M.tab(x,'math','scope')),name:M.normalize({...M.copy(Pd),from:{kind:'saved',name:'x'.repeat(80)}},ALL).from.name.length,
 sameIds:M.same(M.normalize(M.copy(Ps),ALL),Ps),notSame:M.same(Ps,Pd)});
// 5.0.10 (§94 step ε): the second screen: a group of one card; no tab into it and no side by side there; its rectangle kept
const Q=M.fresh(IDS);M.place(Q,'scope','screen');C('screen',{w:M.where(Q,'scope'),inv:inv(Q)});
M.tab(Q,'math','scope');C('noTabIntoScreen',{math:M.where(Q,'math'),scope:M.where(Q,'scope')});
M.side(Q,'scope','math');C('noSideOnScreen',{scope:M.where(Q,'scope')});
M.place(Q,'scope','screen');C('screenAgain',{w:M.where(Q,'scope'),n:Q.groups.length});
M.tab(Q,'scope','math');C('screenToTab',{scope:M.where(Q,'scope'),math:M.where(Q,'math'),inv:inv(Q)});
const Nq=M.normalize({groups:[{id:'s1',at:'screen',cards:['scope','math'],active:'scope',side:'math'}],screen:{scope:{x:1,y:2,w:800,h:600},math:{x:'a'},ghost:{x:0,y:0,w:1,h:1}}},IDS);
C('normScreen',{scope:M.where(Nq,'scope'),math:M.where(Nq,'math'),screen:Object.keys(Nq.screen),rect:Nq.screen.scope,inv:inv(Nq)});
const Qm=M.fresh(IDS);Qm.max='scope';M.place(Qm,'scope','screen');C('screenMax',{max:Qm.max});
// a long random walk over every action (5.0.10: and the second screen, and the ready layouts)
let seed=12345;const rnd=n=>{seed=(seed*1103515245+12345)%2147483648;return seed%n;};
let W=M.fresh(IDS),bad1='',steps=0;const AT=['main','left','right','bottom','float','screen'];
for(let i=0;i<4000;i++){const a=rnd(8),id=IDS[rnd(IDS.length)];
 if(a===0)M.place(W,id,AT[rnd(AT.length)]);else if(a===1)M.tab(W,id,IDS[rnd(IDS.length)]);else if(a===2)M.activate(W,id);
 else if(a===3)M.side(W,id,rnd(4)?IDS[rnd(IDS.length)]:null);else if(a===4)M.ratio(W,id,rnd(100)/50);else if(a===5)M.firstAs(W,id,IDS[rnd(IDS.length)]);
 else if(a===6)W=M.preset(M.PRESETS[rnd(M.PRESETS.length)].name,IDS);else W=M.normalize(JSON.parse(JSON.stringify(W)),IDS);
 steps++;const e=inv(W);if(e){bad1=i+': '+e;break;}}
out.walk={steps,bad:bad1,end:inv(M.normalize(W,IDS))};
let threw='';try{M.place(M.fresh(IDS),'scope','sky');}catch(e){threw=e.message;}out.cases.unknownRegion=threw;
console.log(JSON.stringify(out));
