// 4.17.3 (ROADMAP §65): the symbols of the technical look headless (parts.js symHV, hvPath, setSym), for test_look.py.
// Usage: node look_cases.js -> JSON
const path=require('path');const W=path.resolve(__dirname,'../../web/studio');
global.window=globalThis;const P=require(W+'/parts.js');
const R={};
R.hv=['M-30,0 H-20 l2.5,-7 5,14 H30','M0,-30 V-5 M-15,-5 H15 M-15,5 H15 M0,5 V30','M-15,-6 H15 V6 H-15 Z','M-30,0 H-24 a6,6 0 0,1 12,0 H30','M0,0 L10,0 L10,10 L0,10 z','M0,0 l10,0 0,10 -10,0 z','M0,0 L10,10'].map(d=>P.hvPath(d));
R.marked=P.symHV('<path d="M0,0 H10"/><path class="thin" d="M0,0 V5"/><path d="M0,0 L5,5"/><circle r="3"/>');
P.setSym('iec');R.iec=P.PARTS.R.draw({});R.style1=P.symStyle();
P.setSym('ansi');R.ansi=P.PARTS.R.draw({});R.style2=P.symStyle();P.setSym('iec');
// every symbol of the library: how many paths are axis-aligned (crisp in the technical look) and none breaks
let n=0,hv=0,bad=[];for(const [k,d] of Object.entries(P.PARTS)){if(typeof d.draw!=='function')continue;try{const s=P.symHV(d.draw(P.defaults(k)));n+=(s.match(/<path/g)||[]).length;hv+=(s.match(/class="[^"]*\bhv\b/g)||[]).length;}catch(e){bad.push(k+': '+e.message);}}
R.lib={n,hv,bad};
process.stdout.write(JSON.stringify(R));
