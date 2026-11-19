'use strict';
// 4.17.5 (ROADMAP §66, THEORY §8Δ): where the labels of the parts go, so that on a dense drawing they do not fall on one
// another, on the parts or on the wires, and a long value (an expression) does not run over its neighbours.
//
// Each part has up to three lines: its name (.lbl), its value (.val, editor.valueText) and its live value (.lv). Before
// 4.17.5 they always went to the same place (above, or at the side of a vertical part) and kept a line for an empty
// value. Now each part gets the best of a few candidates: the side it had before (first, and kept when it is free), the
// same side moved to the start or the end of the box, the opposite side, the sides at right angles; and, only when every
// side collides, shorter forms: the value cut to the width of its box (with «…»), the value hidden, the name and the live
// value on one line. The cost of a candidate is the area it covers of other parts and other labels, the length of wire
// it covers, plus a small price for each step away from the side of before and from the full text. A greedy pass (the
// hardest parts first) and up to four passes that move again what still collides. Pure: no DOM (the editor gives the
// widths of the texts; here an estimate for Node). The whole value stays in the tooltip of the part and in the label of
// a selected part.
(function(root){
 const P=root.Parts||(typeof require!=='undefined'?require('./parts.js'):null);
 const FS={lbl:11.5,val:10.5,lv:10.5};          // font sizes of the three lines (style.css .lbl, .val, .lv)
 const PITCH=12.5,GAP=7,SGAP=8,AIR=1.5,ILGAP=6;  // baseline to baseline; from the box above/below, at the side; air; inline
 const asc=k=>.8*FS[k],dsc=k=>.2*FS[k];          // the line box: translate(…, -.8em), line-height 1
 const NOLBL=new Set(['JUNC','GND','TAGO','TAGI','PORT','SIN','SOUT','NOTE']),ARROWS=new Set(['L','R','C','VDC','VAC','D','SW','CPL','IDC']);
 const CODE=new Set(['EXPR','PY']);                 // values that are code: above a block only as wide as the block
 const W_PART=3,W_LBL=3,W_MISC=2,W_WIRE=4;        // cost per px² of a part, a label or a text covered, per px of wire covered
 // the price of a side, by the side of before (0): the start/end (top/bottom) of the same side 6–8, the opposite side 16,
 // the sides at right angles 26 and more, the corners (which a dense column makes ambiguous) last, 30–60
 const PREF={above:{above:0,'above-s':8,'above-e':8,below:16,'below-s':22,'below-e':22,right:26,'right-t':32,'right-b':32,left:30,'left-t':36,'left-b':36,ne:46,nw:50,se:56,sw:60},
  below:{below:0,'below-s':8,'below-e':8,above:16,'above-s':22,'above-e':22,right:26,'right-t':32,'right-b':32,left:30,'left-t':36,'left-b':36,se:46,sw:50,ne:56,nw:60},
  right:{right:0,'right-t':6,'right-b':6,left:16,'left-t':20,'left-b':20,above:26,below:30,ne:30,se:30,'above-s':32,'above-e':32,'below-s':36,'below-e':36,nw:46,sw:46},
  left:{left:0,'left-t':6,'left-b':6,right:16,'right-t':20,'right-b':20,above:26,below:30,nw:30,sw:30,'above-s':32,'above-e':32,'below-s':36,'below-e':36,ne:46,se:46}};
 const SIDES=Object.keys(PREF.above);
 const CAP_SIDE=170,CUT_MIN=44;
 const LEAD=10;                                    // 4.22: a label moved by hand this far from its part has a leader line                    // the widest value at the side; the narrowest cut
 // the width of a text without a canvas (Node, tests): monospace 0.6 em; the name in the proportional font, by kind of letter
 function est(text,kind){const s=String(text??'');if(!s)return 0;if(kind!=='lbl')return [...s].length*.6*FS[kind];
  let w=0;for(const ch of s)w+=/[ilI.,:;'|!1j()\[\] ]/.test(ch)?.33:/[mwMWΩΜΨ]/.test(ch)?.86:/[A-ZΑ-Ω0-9]/.test(ch)?.66:.56;return w*FS.lbl;}
 const ov=(a,b)=>Math.max(0,Math.min(a[2],b[2])-Math.max(a[0],b[0]))*Math.max(0,Math.min(a[3],b[3])-Math.max(a[1],b[1]));
 // the length of the segment s ([x0, y0, x1, y1]) inside the box r (Liang–Barsky)
 function clipLen(s,r){let t0=0,t1=1;const dx=s[2]-s[0],dy=s[3]-s[1];
  for(const [p,q] of [[-dx,s[0]-r[0]],[dx,r[2]-s[0]],[-dy,s[1]-r[1]],[dy,r[3]-s[1]]]){if(p===0){if(q<0)return 0;continue;}const t=q/p;if(p<0){if(t>t1)return 0;if(t>t0)t0=t;}else{if(t<t0)return 0;if(t<t1)t1=t;}}
  return (t1-t0)*Math.hypot(dx,dy);}
 // a uniform grid of boxes (cells of 48 px)
 class Grid{constructor(){this.m=new Map();}
  *cells(r){const x0=Math.floor(r[0]/48),x1=Math.floor(r[2]/48),y0=Math.floor(r[1]/48),y1=Math.floor(r[3]/48);for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)yield x*65599+y;}
  add(r,o){for(const k of this.cells(r)){let a=this.m.get(k);if(!a)this.m.set(k,a=[]);a.push(o);}}
  del(r,o){for(const k of this.cells(r)){const a=this.m.get(k);if(!a)continue;const i=a.indexOf(o);if(i>=0)a.splice(i,1);}}
  near(r){const s=new Set();for(const k of this.cells(r)){const a=this.m.get(k);if(a)for(const o of a)s.add(o);}return s;}}
 const midLabel=pts=>{let best=-1,bi=1;for(let i=1;i<pts.length;i++){const l=Math.abs(pts[i][0]-pts[i-1][0])+Math.abs(pts[i][1]-pts[i-1][1]);if(l>best){best=l;bi=i;}}return [(pts[bi][0]+pts[bi-1][0])/2,(pts[bi][1]+pts[bi-1][1])/2];};
 // the side of before 4.17.5 (editor.renderLabels): at the side for vertical two-pin parts and for blocks that are not
 // signal blocks (PWM, S&H …), on the left with lbl 'left'; below with lbl 'below'; otherwise above
 function sideOf(c){const def=P.PARTS[c.type],lb=c.lbl||def.lbl;if(lb==='below')return 'below';if(lb==='above')return 'above';
  const pk=Object.keys(P.elPins(c)),blk=!pk.length,q0=pk[0]&&P.pinPos(c,pk[0]),q1=pk[1]&&P.pinPos(c,pk[1]);
  const vert=!blk&&c.type!=='XFMR'&&c.type!=='VAC3'&&q0&&q1&&q0[0]===q1[0];
  if((vert||blk)&&!(blk&&P.BLOCKS.has(c.type)))return lb==='left'?'left':'right';return 'above';}
 // parts, wires and the other texts of the drawing (pin tags, names of wires, tiles), and the parts with a label
 //  o.measure(text, kind) → px (default est), o.valueText(c), o.lvChars(c) → characters kept for the live value,
 //  o.arrows: the arrows of the current are shown
 // 4.22 (ROADMAP §66): a label moved by hand. c.lblAt = [dx, dy, a]: the anchor of its first line (x as the anchor a = s / m
 // / e, y its baseline) from the centre of the box of the part, in the units of the drawing; it moves and turns with the part
 function pinOf(v){if(!Array.isArray(v)||v.length<2)return null;const dx=+v[0],dy=+v[1];if(!Number.isFinite(dx)||!Number.isFinite(dy)||Math.abs(dx)>5000||Math.abs(dy)>5000)return null;
  return [dx,dy,v[2]==='s'||v[2]==='e'?v[2]:'m'];}
 function gather(doc,o){o=o||{};const ms=o.measure||est,vt=o.valueText||(()=>''),lvc=o.lvChars||(()=>0),cw=ms('0000000000','lv')/10;
  const parts=[],segs=[],misc=[],items=[],byId=new Map();for(const c of doc.components||[])byId.set(c.id,c);
  for(const c of doc.components||[]){const def=P.PARTS[c.type];if(!def)continue;let b;try{b=P.bbox(c);}catch(e){continue;}if(!b.every(Number.isFinite))continue;
   // the obstacle of a part: its box and its pins (the leads of a resistor, the pins of a block outside its box)
   const o=[...b];if(c.type!=='JUNC'){for(const q of Object.values(P.pinsOf(c))){const z=P.xf(c,q);o[0]=Math.min(o[0],z[0]-3);o[1]=Math.min(o[1],z[1]-3);o[2]=Math.max(o[2],z[0]+3);o[3]=Math.max(o[3],z[1]+3);}parts.push({b:o,id:c.id});}
   // the tags «← block.output» of inputs that take their signal from the parameters (editor.renderPins)
   for(const p of Object.keys(P.pinsOf(c))){if(c.type==='JUNC'||P.pinKind(c,p)!=='in')continue;const src=c.params?.['in_'+p];if(!src)continue;
    const [sc,sp]=String(src).split(':'),s0=byId.get(sc),t=s0?'← '+(s0.label||sc)+'.'+sp:'← ? '+src,q=P.pinPos(c,p),d=P.pinDir(c,p),w=ms(t,'lbl')*9.5/11.5;
    const x=q[0]+d[0]*7,y=q[1]+(d[1]?d[1]*12:-5),x0=d[0]<0?x-w:d[0]>0?x:x-w/2;misc.push([x0,y-8,x0+w,y+2]);}
   // the arrows of the current (editor.drawArrows, when they are shown): below a horizontal element, left of a vertical one
   if(o.arrows&&ARROWS.has(c.type)){const pk=Object.keys(P.pinsOf(c));if(pk.length>=2){const a=P.pinPos(c,pk[0]),z=P.pinPos(c,pk[1]),mx=(a[0]+z[0])/2,my=(a[1]+z[1])/2;
    if(Math.abs(a[1]-z[1])<1)misc.push([mx-14,b[3]+7,mx+14,b[3]+17]);else misc.push([b[0]-17,my-14,b[0]-7,my+14]);}}
   if(NOLBL.has(c.type))continue;const lb=c.lbl||def.lbl;if(lb==='none')continue;
   const name=String(c.label||c.id),val=String(vt(c)??''),nl=Math.max(0,+lvc(c)||0);
   const at=pinOf(c.lblAt);
   items.push({id:c.id,t:c.type,code:CODE.has(c.type),b,o,side:sideOf(c),name,nw:ms(name,'lbl'),val,vw:ms(val,'val'),lw:nl*cw,...(at?{at}:{})});}
  for(const w of doc.wires||[]){const a=byId.get(w.a?.c),z=byId.get(w.b?.c);if(!a||!z)continue;const pa=P.pinPos(a,w.a.p),pz=P.pinPos(z,w.b.p);if(!pa||!pz)continue;
   const pts=[pa,...(w.pts||[]),pz];for(let i=1;i<pts.length;i++)segs.push([pts[i-1][0],pts[i-1][1],pts[i][0],pts[i][1]]);
   if(w.name){const m=midLabel(pts),t=String(w.name),wd=[...t].length*.6*11+12;misc.push([m[0]-wd/2,m[1]-15,m[0]+wd/2,m[1]-4]);}}
  const wt=doc.watch;if(wt&&wt.show!==false&&Array.isArray(wt.tiles))for(const t of wt.tiles)if(Array.isArray(t?.at)&&t.at.every(Number.isFinite)){const x0=t.at[0]-(t.al==='r'?150:0);misc.push([x0,t.at[1],x0+150,t.at[1]+(t.ctl?96:66)]);}
  return {items,parts,segs,misc,cw};}
 // the lines of one candidate: positions (baseline x, y and anchor), the boxes that are tested, what is hidden or cut.
 // Above or below a box a value that is code (an expression, Python) is never wider than the box and 24 px, or 96 px
 // (15 characters) for a narrow box: a long expression does not run over its neighbours («…», whole in the tooltip and
 // when selected); other values up to 140 px; at the side or at a corner up to 170 px.
 //  form 0: name, value, live · 1: the value cut to the box · 2: the value hidden · 3: name and live on one line
 function stack(it,side,form){const b=it.b,cx=(b[0]+b[2])/2,cy=(b[1]+b[3])/2,bw=b[2]-b[0],base=side.split('-')[0],sub=side.split('-')[1]||'',pin=side==='pin'&&it.at;
  if(side==='pin'&&!pin)return null;if(pin&&form!==0)return null;
  const ab=!pin&&(base==='above'||base==='below'),hasV=!!it.val,hasL=it.lw>0,cap=ab?(it.code?Math.max(bw+24,96):Math.max(bw+24,140)):CAP_SIDE,cut=Math.max(Math.min(bw,120),CUT_MIN);
  if(form===1&&!(hasV&&Math.min(it.vw,cap)>cut+2))return null;if(form===2&&!hasV)return null;if(form===3&&!hasL)return null;
  const vw=form===1?cut:Math.min(it.vw,cap),mw=form===1||it.vw>cap+.5?vw:0;
  // rows top to bottom: each row is one or two pieces {k, w}
  const rows=[];if(form===3)rows.push([{k:'lbl',w:it.nw},{k:'lv',w:it.lw}]);else{rows.push([{k:'lbl',w:it.nw}]);if(hasV&&form<2)rows.push([{k:'val',w:vw}]);if(hasL)rows.push([{k:'lv',w:it.lw}]);}
  // away from the box with its pins (o), along the box itself (b): above, a block with a pin on top keeps its lead free
  const o=it.o||b,n=rows.length,k0=rows[0][0].k,kn=rows[n-1][0].k,ys=new Array(n),up=base==='above'||base==='ne'||base==='nw';
  if(pin){for(let i=0;i<n;i++)ys[i]=cy+it.at[1]+i*PITCH;}
  else if(up){let y=o[1]-(base==='above'?GAP:2)-dsc(kn);for(let i=n-1;i>=0;i--){ys[i]=y;y-=PITCH;}}
  else if(base==='below'||base==='se'||base==='sw'){let y=o[3]+(base==='below'?GAP:2)+asc(k0);for(let i=0;i<n;i++){ys[i]=y;y+=PITCH;}}
  else{const H=(n-1)*PITCH+asc(k0)+dsc(kn);let y=sub==='t'?b[1]+asc(k0):sub==='b'?b[3]-H+asc(k0):cy-H/2+asc(k0);for(let i=0;i<n;i++){ys[i]=y;y+=PITCH;}}
  const a=pin?it.at[2]:base==='right'||base==='ne'||base==='se'?'s':base==='left'||base==='nw'||base==='sw'?'e':sub||'m';
  const x=pin?cx+it.at[0]:base==='right'?o[2]+SGAP:base==='left'?o[0]-SGAP:base==='ne'||base==='se'?o[2]+5:base==='nw'||base==='sw'?o[0]-5:a==='s'?b[0]:a==='e'?b[2]:cx;
  const L={},R=[];
  rows.forEach((row,i)=>{const W=row.reduce((s,q)=>s+q.w,0)+(row.length-1)*ILGAP,x0=a==='s'?x:a==='e'?x-W:x-W/2;let xx=x0;
   for(const q of row){const r=[xx-AIR,ys[i]-asc(q.k)-AIR,xx+q.w+AIR,ys[i]+dsc(q.k)+AIR];if(q.w>0)R.push(r);
    L[q.k]=row.length>1?{x:xx,y:ys[i],as:true}:{x,y:ys[i]};if(q.k==='val'&&mw)L.val.mw=mw;xx+=q.w+ILGAP;}});
  // what is not shown still has a place (an empty live value until the solver writes it; a hidden value shown when the
  // part is selected): one row further from the box
  const far=up?ys[0]-PITCH:ys[n-1]+PITCH;
  if(!L.lv)L.lv={x,y:far};if(!L.val)L.val={x,y:up?far-(L.lv.y===far?PITCH:0):far+(L.lv.y===far?PITCH:0),hid:hasV};
  return {side,form,a,L,R,ax:x,ay:ys[0],cut:!!(hasV&&form<2&&mw),pen:pin?0:(PREF[it.side][side]??40)+(form===1?30+.25*(Math.min(it.vw,cap)-cut):form===2?70+.15*it.vw:form===3?40+(hasV?45+.15*it.vw:0):0)};}
 // the candidates by their price: a search can stop at the first whose price alone is above the best cost found (the cost
 // is never below the price)
 function cands(it){if(it.at){const c=stack(it,'pin',0);return c?[c]:[];}const out=[];for(const s of SIDES)for(let f=0;f<4;f++){const c=stack(it,s,f);if(c)out.push(c);}return out.sort((a,b)=>a.pen-b.pen);}
 // the cost of a candidate against the parts, wires, texts and the labels already placed (G: grid of the labels)
 // (what does not move, the parts, wires and texts, is counted once per candidate)
 function cost(it,c,S,G,skip){if(c.sk===undefined){let k=c.pen;
   for(const r of c.R){for(const o of S.pg.near(r))k+=W_PART*ov(r,o.b);for(const o of S.mg.near(r))k+=W_MISC*ov(r,o);for(const s of S.sg.near(r))k+=W_WIRE*clipLen(s,r);}c.sk=k;}
  let k=c.sk;if(G)for(const r of c.R)for(const o of G.near(r))if(o.id!==skip)k+=W_LBL*ov(r,o.r);return k;}
 // place the labels: → {items:[{id, a, L, form, side, cost, cut, hidden}], boxes:[[x0, y0, x1, y1]]}
 function place(g){const pg=new Grid(),sg=new Grid(),mg=new Grid(),G=new Grid();
  for(const p of g.parts)pg.add(p.b,p);for(const s of g.segs)sg.add([Math.min(s[0],s[2]),Math.min(s[1],s[3]),Math.max(s[0],s[2]),Math.max(s[1],s[3])],s);for(const m of g.misc)mg.add(m,m);
  const S={pg,sg,mg},C=g.items.map(cands),best=new Array(g.items.length);
  // the hardest first: the cost of the best candidate without the other labels
  const best0=(i,G,skip)=>{let bc=null,bk=Infinity;for(const c of C[i]){if(c.pen>=bk)break;const k=cost(g.items[i],c,S,G,skip);if(k<bk-1e-9){bk=k;bc=c;}}return [bc,bk];};
  const hard=g.items.map((_,i)=>best0(i,null)[1]);
  // the labels kept by hand first (4.22): they do not move, the others keep off them
  const order=g.items.map((_,i)=>i).sort((i,j)=>(g.items[j].at?1:0)-(g.items[i].at?1:0)||hard[j]-hard[i]||g.items[i].b[1]-g.items[j].b[1]||g.items[i].b[0]-g.items[j].b[0]);
  const put=(i,c)=>{best[i]=c;for(const r of c.R)G.add(r,{id:i,r});},take=i=>{const c=best[i];if(!c)return;for(const r of c.R)for(const o of G.near(r))if(o.id===i&&o.r===r)G.del(r,o);best[i]=null;};
  const pick=i=>{const [bc,bk]=best0(i,G,i);if(bc)bc.k=bk;return bc;};
  for(const i of order){const c=pick(i);if(c)put(i,c);}
  for(let pass=0;pass<4;pass++){let moved=0;const again=order.filter(i=>best[i]&&best[i].k>best[i].pen+1e-6).sort((i,j)=>best[j].k-best[i].k);
   for(const i of again){const was=best[i];take(i);const c=pick(i);put(i,c);if(c!==was)moved++;}if(!moved)break;}
  // a column or a row of parts of the same type (the inputs of a circuit, a bank of integrators): the side that most of
  // its neighbours took, where it is free here too, so that the column reads the same way
  const ctr=it=>[(it.b[0]+it.b[2])/2,(it.b[1]+it.b[3])/2];
  for(const i of order){const it=g.items[i],c=best[i];if(!c||it.at)continue;const [x,y]=ctr(it),h=it.b[3]-it.b[1],w=it.b[2]-it.b[0],cnt=new Map();
   g.items.forEach((jt,j)=>{if(j===i||jt.t!==it.t||!best[j]||jt.at)return;const [xj,yj]=ctr(jt);if((Math.abs(xj-x)<1&&Math.abs(yj-y)<4*h+60)||(Math.abs(yj-y)<1&&Math.abs(xj-x)<4*w+60))cnt.set(best[j].side,(cnt.get(best[j].side)||0)+1);});
   let s0=null,n0=1;for(const [sd,n] of cnt)if(n>n0||(n===n0&&s0===null&&n>=2)){s0=sd;n0=n;}if(!s0||s0===c.side||n0<2)continue;
   take(i);let sw=null;for(const q of C[i])if(q.side===s0&&q.form<=c.form){const k=cost(it,q,S,G,i);if(k-q.pen<1e-6&&(!sw||k<sw.k)){q.k=k;sw=q;}}put(i,sw||c);}
  const items=g.items.map((it,i)=>{const c=best[i];if(!c)return {id:it.id,a:'m',L:{lbl:{x:(it.b[0]+it.b[2])/2,y:it.b[1]-GAP},val:{x:0,y:0},lv:{x:0,y:0}},form:0,side:it.side,cost:0};
   const R=c.R.map(r=>[r[0]+AIR,r[1]+AIR,r[2]-AIR,r[3]-AIR]),out={id:it.id,a:c.a,L:c.L,form:c.form,side:c.side,cost:+(c.k-c.pen).toFixed(3),cut:c.cut,hidden:c.form>=2&&!!it.val,full:it.val,ax:c.ax,ay:c.ay,R};
   if(it.at){out.pinned=true;const ld=lead(R,it.o||it.b);if(ld)out.lead=ld;}
   return out;});
  const boxes=[];best.forEach(c=>{if(c)for(const r of c.R)boxes.push(r);});
  return {items,boxes};}
 // the leader of a label kept by hand: the shortest segment between the box of its lines and the box of its part (with
 // its pins), when it is longer than LEAD
 function lead(R,o){if(!R.length)return null;const U=[Math.min(...R.map(r=>r[0])),Math.min(...R.map(r=>r[1])),Math.max(...R.map(r=>r[2])),Math.max(...R.map(r=>r[3]))];
  const near=(a0,a1,b0,b1)=>a1<b0?[a1,b0]:b1<a0?[a0,b1]:[(Math.max(a0,b0)+Math.min(a1,b1))/2,(Math.max(a0,b0)+Math.min(a1,b1))/2];
  const [x1,x2]=near(U[0],U[2],o[0],o[2]),[y1,y2]=near(U[1],U[3],o[1],o[3]),r1=v=>Math.round(v*10)/10;
  return Math.hypot(x2-x1,y2-y1)>LEAD?[r1(x1),r1(y1),r1(x2),r1(y2)]:null;}
 function layout(doc,o){const g=gather(doc,o);const r=place(g);r.g=g;return r;}
 // for the tests: what still collides in a layout (pairs of labels, label and part, wire length under labels)
 function check(lay){const g=lay.g,byI=new Map(),boxes=[];lay.items.forEach((it,i)=>{const c=g.items[i];byI.set(it.id,c);});
  const own=[];lay.items.forEach((it,i)=>{const it0=g.items[i];const st=stack(it0,it.side,it.form);if(st)for(const r of st.R)own.push({id:it.id,r:[r[0]+AIR,r[1]+AIR,r[2]-AIR,r[3]-AIR]});});
  let ll=0,lp=0,wire=0;const bad=[];
  for(let i=0;i<own.length;i++){for(let j=i+1;j<own.length;j++)if(own[i].id!==own[j].id){const a=ov(own[i].r,own[j].r);if(a>1){ll++;bad.push(['ll',own[i].id,own[j].id,+a.toFixed(1)]);}}
   for(const p of g.parts){const a=ov(own[i].r,p.b);if(a>1){lp++;bad.push(['lp',own[i].id,p.id,+a.toFixed(1)]);}}
   for(const s of g.segs)wire+=clipLen(s,own[i].r);}
  void boxes;void byI;return {ll,lp,wire:+wire.toFixed(1),bad};}
 const api={est,gather,stack,place,layout,check,sideOf,clipLen,pinOf,lead,FS,PITCH,LEAD};
 root.LblPlace=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
