// 5.0.10 (ROADMAP §94 step ε): the window of the second screen (web/studio/screen.js) without a browser: its hello to the
// page that opened it, with a stand-in page (opener.Dock.screenHello) and stand-in elements. Prints JSON for
// tests/test_dock.py: no page behind it; a page that is not ready, then takes the card; a reload of the page (another Dock:
// the old card leaves the window, the hello starts again); a page that no longer has the card there; a page that closed.
const fs=require('fs'),path=require('path'),vm=require('vm');
const SRC=fs.readFileSync(path.join(__dirname,'..','..','web','studio','screen.js'),'utf8');
function world(card){
 const el=id=>({id,hidden:false,textContent:'',cleared:0,replaceChildren(){this.cleared++;}});
 const E={'screen-wait':el('screen-wait'),'screen-msg':el('screen-msg'),'screen-root':el('screen-root')};
 const W={ticks:[],timers:[],closed:0,opener:null};
 const win={location:{search:'?card='+card},document:{getElementById:id=>E[id]||null},close(){W.closed++;}};
 Object.defineProperty(win,'opener',{get:()=>W.opener});
 const ctx=vm.createContext({window:win,location:win.location,document:win.document,URLSearchParams,console,
  setInterval:f=>{W.ticks.push(f);return 1;},setTimeout:f=>{W.timers.push(f);return 1;}});
 vm.runInContext(SRC,ctx);
 const tick=(n=1)=>{for(let i=0;i<n;i++)W.ticks[0]();};
 return {W,E,win,tick};}
const page=answers=>{const calls=[];let i=0;return {calls,Dock:{screenHello:(c,w)=>{calls.push(c);const r=answers[Math.min(i,answers.length-1)];i++;return r;}}};};
const out={};
// no page behind the window: after a few ticks it says where it opens from
{const T=world('scope');T.tick(1);const m1=T.E['screen-msg'].textContent;T.tick(3);out.alone={first:m1,later:T.E['screen-msg'].textContent,closed:T.W.closed,ticks:T.W.ticks.length};}
// a page that is not ready ('wait' twice), then takes the card ('ok'): no more hello after that
{const T=world('scope'),P=page(['wait','wait','ok']);T.W.opener={closed:false,Dock:P.Dock};T.tick(1);T.tick(5);
 out.ready={calls:P.calls.length,card:P.calls[0],cleared:T.E['screen-root'].cleared,closed:T.W.closed};}
// a reload of the page: the Dock goes (the old card leaves, the window waits), a new Dock comes and is asked again
{const T=world('netview'),P=page(['ok']);T.W.opener={closed:false,Dock:P.Dock};T.tick(2);const before=P.calls.length;
 T.W.opener.Dock=undefined;T.tick(1);const mid={cleared:T.E['screen-root'].cleared,msg:T.E['screen-msg'].textContent,wait:T.E['screen-wait'].hidden};
 const P2=page(['wait','ok']);T.W.opener.Dock=P2.Dock;T.tick(4);
 out.reload={before,mid,again:P2.calls.length,card:P2.calls[0],cleared:T.E['screen-root'].cleared,closed:T.W.closed};}
// the page no longer has this card on the second screen: the window closes
{const T=world('scope'),P=page(['close']);T.W.opener={closed:false,Dock:P.Dock};T.tick(1);out.close={closed:T.W.closed,cleared:T.E['screen-root'].cleared};}
// the page closed: the window says so and closes
{const T=world('scope'),P=page(['ok']);T.W.opener={closed:false,Dock:P.Dock};T.tick(1);T.W.opener.closed=true;T.tick(1);const msg=T.E['screen-msg'].textContent;for(const f of T.W.timers)f();
 out.gone={msg,closed:T.W.closed,cleared:T.E['screen-root'].cleared};}
// a page of another site (no access): as no page there yet
{const T=world('scope');T.W.opener={closed:false,get Dock(){throw new Error('SecurityError');}};T.tick(3);out.foreign={closed:T.W.closed,msg:T.E['screen-msg'].textContent};}
console.log(JSON.stringify(out));
