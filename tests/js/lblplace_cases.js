// 4.17.5 (ROADMAP §66): the labels of the parts headless (lblplace.js, with the estimated widths), for test_lblplace.py.
// Usage: node lblplace_cases.js -> JSON
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;global.Parts=require(W+'/parts.js');global.Expr=require(W+'/expr.js');require(W+'/netlib.js');require(W+'/tutorials.js');
const Inputs=require(W+'/inputs.js');require(W+'/editor.js');const LP=require(W+'/lblplace.js');const P=global.Parts;
const vt=globalThis.Editor.prototype.valueText,T=globalThis.Tutorials;
const C=(id,type,x,y,params={},extra={})=>({id,type,x,y,rot:0,flip:false,label:id,params:{...P.defaults(type),...params},...extra});
const opt={valueText:c=>vt(c),lvChars:c=>c.type==='SUB'?0:10};
const R={};
// 1. a sparse drawing keeps the side of before, the whole text, no cost
{const lay=LP.layout({components:[C('R1','R',100,100,{R:10}),C('V1','VDC',300,100,{V:12},{rot:1})],wires:[]},opt);
 R.sparse=lay.items.map(i=>({id:i.id,side:i.side,form:i.form,cost:i.cost,cut:i.cut}));}
// 2. a column of inputs 40 px apart (as in the vehicle): nothing on anything, one side for all
{const comps=[];for(let k=0;k<9;k++)comps.push(C('IN'+k,'CONST',0,40*k,{v:+(0.001*(k+1)).toFixed(3),input:true,name:'n'+k},{label:'n'+k}));
 const lay=LP.layout({components:comps,wires:[]},opt);R.column={sides:[...new Set(lay.items.map(i=>i.side))],check:LP.check(lay)};}
// 3. a long expression above its block: cut to the block (or 15 characters), flagged; a short one whole
{const long='(vk/3.6/rw*n/0.85)*clamp(lut(mod(t, D), 0, 0, 60, 0.28), 0, 0.85)',lay=LP.layout({components:[C('E1','EXPR',0,0,{expr:long,ins:'',pars:''}),C('E2','EXPR',300,0,{expr:'i*i',ins:'i',pars:''})],wires:[]},opt);
 const g=lay.g.items,e1=lay.items[0],e2=lay.items[1];R.expr={cut1:e1.cut,mw:e1.L.val.mw,bw:g[0].b[2]-g[0].b[0],full:e1.full,cut2:e2.cut,mw2:e2.L.val.mw||0};}
// 4. a wire across the side of before: the label moves off it
{const comps=[C('R1','R',100,100,{R:10}),C('J1','JUNC',60,70),C('J2','JUNC',160,70)];const lay=LP.layout({components:comps,wires:[{id:'w1',a:{c:'J1',p:'j'},b:{c:'J2',p:'j'}}]},opt);
 R.wire={side:lay.items[0].side,check:LP.check(lay)};}
// 5. the pins of a part are part of it: a machine with signal pins on both sides (no label on them)
{const lay=LP.layout({components:[C('M1','DCM',0,0,{})],wires:[]},opt);R.pins={side:lay.items[0].side,check:LP.check(lay)};}
// 6. the same drawing, the same layout
{const t=T.get('ev_drive'),o={};for(const q of t.options)o[q.k]=q.def;const pr=t.build(o),a=JSON.stringify(LP.layout(pr,opt).items),b=JSON.stringify(LP.layout(pr,opt).items);R.same=a===b;}
// 7. every tutorial: no label on another label or on a part (estimated widths); against the places of before 4.17.5
const ov=(a,b)=>Math.max(0,Math.min(a[2],b[2])-Math.max(a[0],b[0]))*Math.max(0,Math.min(a[3],b[3])-Math.max(a[1],b[1]));
function before(pr,g){const L=[];for(const it of g.items){const b=it.b,s=it.side,c=pr.components.find(q=>q.id===it.id),blk=!Object.keys(P.elPins(c)).length,side=s==='right'||s==='left';
  const x=s==='left'?b[0]-8:s==='right'?b[2]+8:(b[0]+b[2])/2,y=side?(b[1]+b[3])/2-(blk?10:2):s==='below'?b[3]+40:b[1]-7,ys=side?[y,y+13,y+26]:[y-24,y-12,y];
  [['lbl',it.nw],['val',Math.min(it.vw,28*6.3)],['lv',it.lw]].forEach(([k,w],i)=>{if(!w)return;const x0=s==='left'?x-w:s==='right'?x:x-w/2;L.push({id:it.id,r:[x0,ys[i]-.8*LP.FS[k],x0+w,ys[i]+.2*LP.FS[k]]});});}
 let ll=0,lp=0;for(let i=0;i<L.length;i++){for(let j=i+1;j<L.length;j++)if(L[i].id!==L[j].id&&ov(L[i].r,L[j].r)>1)ll++;for(const p of g.parts)if(ov(L[i].r,p.b)>6)lp++;}return {ll,lp};}
const all={n:0,ll:0,lp:0,wire:0,bad:[],old:{ll:0,lp:0,tuts:0},ms:0};
for(const t of T.list){const o={};for(const q of t.options||[])o[q.k]=q.def;const pr=t.build(o);
 let num=null;if(Inputs.needs(pr)){const r=Inputs.resolve(pr);num=new Map(r.project.components.map(c=>[c.id,c]));}
 const t0=Date.now(),lay=LP.layout(pr,{valueText:c=>vt(num&&num.get(c.id)||c),lvChars:opt.lvChars});all.ms=Math.max(all.ms,Date.now()-t0);
 const ch=LP.check(lay),lp=ch.bad.filter(b=>b[0]==='lp'&&b[3]>6),old=before(pr,lay.g);
 all.n++;all.ll+=ch.ll;all.lp+=lp.length;all.wire+=ch.wire;if(ch.ll||lp.length)all.bad.push([t.id,ch.bad.filter(b=>b[0]==='ll'||b[3]>6).slice(0,3)]);
 all.old.ll+=old.ll;all.old.lp+=old.lp;if(old.ll||old.lp)all.old.tuts++;}
all.wire=Math.round(all.wire);R.all=all;
// 8. the values of the parameters «= …» (4.17.1): numbers through the inputs, «—» (not NaN) when they are not computed
{const t=T.get('ev_drive'),o={};for(const q of t.options)o[q.k]=q.def;const pr=t.build(o),r=Inputs.resolve(pr),m=new Map(r.project.components.map(c=>[c.id,c]));
 const M1=pr.components.find(c=>c.id==='M1'),GV=pr.components.find(c=>c.id==='GV'),REF=pr.components.find(c=>c.id==='REF');
 R.values={m1:vt(m.get('M1')),m1raw:vt(M1),gv:vt(m.get('GV')),gvraw:vt(GV),ref:vt(REF),refExpr:REF.params.expr};}
process.stdout.write(JSON.stringify(R));
