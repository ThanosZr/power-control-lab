'use strict';
// Expressions of the expression block (3.3): a small safe parser, no eval (the page has a strict CSP).
// The same tree is sent to the server, where engine/batch.py evaluates it (eval_ast), so both solvers agree.
//   Expr.parse(src, names) → tree      names: identifiers that are inputs or parameters (index = position)
//   Expr.compile(tree)     → f(vals, t)
// Grammar: c ? a : b, ||, &&, comparisons (1/0), + −, * / %, unary − ! +, ^ or ** (right-assoc), calls, ( ).
(function(root){
 // lut(x, x1, y1, x2, y2, …): piecewise linear table, constant outside (e.g. OCV(SOC))
 function lut(x,...p){const n=p.length>>1;if(x<=p[0])return p[1];for(let k=1;k<n;k++)if(x<=p[2*k]){const x0=p[2*k-2],y0=p[2*k-1],x1=p[2*k],y1=p[2*k+1];return x1>x0?y0+(y1-y0)*(x-x0)/(x1-x0):y1;}return p[2*n-1];}
 const FUN={sin:Math.sin,cos:Math.cos,tan:Math.tan,asin:Math.asin,acos:Math.acos,atan:Math.atan,atan2:Math.atan2,sinh:Math.sinh,cosh:Math.cosh,tanh:Math.tanh,
  exp:Math.exp,log:Math.log,log10:Math.log10,sqrt:Math.sqrt,abs:Math.abs,min:Math.min,max:Math.max,pow:Math.pow,floor:Math.floor,ceil:Math.ceil,round:x=>Math.floor(x+.5),
  sign:Math.sign,hypot:Math.hypot,clamp:(x,a,b)=>Math.min(Math.max(x,a),b),mod:(a,b)=>a-b*Math.floor(a/b),lut};
 const ARITY={atan2:2,pow:2,clamp:3,mod:2,min:-2,max:-2,hypot:-2,lut:-5};   // −n: at least n arguments
 const CONST={pi:Math.PI,e:Math.E};
 class ExprError extends Error{}
 function tokens(src){const out=[],re=/\s*(?:(\d+\.?\d*(?:[eE][+-]?\d+)?|\.\d+(?:[eE][+-]?\d+)?)|([A-Za-z_]\w*)|(\*\*|<=|>=|==|!=|&&|\|\||[-+*/%^()<>!?:,]))/y;let m,i=0;
  while(i<src.length){re.lastIndex=i;m=re.exec(src);if(!m||m[0].length===0){if(/^\s*$/.test(src.slice(i)))break;throw new ExprError(`Άγνωστο σύμβολο στη θέση ${i+1}: «${src.slice(i).trim()[0]}».`);}
   i=re.lastIndex;out.push(m[1]!==undefined?{k:'n',v:+m[1]}:m[2]!==undefined?{k:'id',v:m[2]}:{k:'op',v:m[3]});}
  return out;}
 function parse(src,names=[]){const tk=tokens(String(src||''));if(!tk.length)throw new ExprError('Κενή έκφραση.');let i=0;
  const peek=()=>tk[i],eat=v=>{const t=tk[i];if(t&&t.k==='op'&&t.v===v){i++;return true;}return false;},need=v=>{if(!eat(v))throw new ExprError(`Λείπει «${v}».`);};
  const expr=()=>{const c=or();if(eat('?')){const a=expr();need(':');const b=expr();return ['if',c,a,b];}return c;};
  const bin=(next,ops)=>()=>{let a=next();for(;;){const t=peek();if(t&&t.k==='op'&&ops.includes(t.v)){i++;a=['bin',t.v,a,next()];}else return a;}};
  const unary=()=>{if(eat('-'))return ['un','-',unary()];if(eat('+'))return unary();if(eat('!'))return ['un','!',unary()];return power();};
  const power=()=>{const a=atom();if(eat('^')||eat('**'))return ['bin','^',a,unary()];return a;};
  const mul=bin(unary,['*','/','%']),add=bin(mul,['+','-']),cmp=bin(add,['<','>','<=','>=','==','!=']),and=bin(cmp,['&&']),or=bin(and,['||']);
  function atom(){const t=tk[i++];if(!t)throw new ExprError('Η έκφραση τελειώνει απότομα.');
   if(t.k==='n')return ['num',t.v];
   if(t.k==='op'&&t.v==='('){const a=expr();need(')');return a;}
   if(t.k==='id'){if(eat('(')){if(!FUN[t.v])throw new ExprError(`Άγνωστη συνάρτηση «${t.v}».`);const args=[];if(!eat(')')){do args.push(expr());while(eat(','));need(')');}
     const n=ARITY[t.v]??1;if(n>0&&args.length!==n||n<0&&args.length<-n)throw new ExprError(`Η ${t.v} θέλει ${n<0?'τουλάχιστον '+(-n):n} ορίσματα.`);return ['call',t.v,args];}
    const k=names.indexOf(t.v);if(k>=0)return ['var',k];if(t.v==='t')return ['t'];if(t.v in CONST)return ['num',CONST[t.v]];
    throw new ExprError(`Άγνωστο όνομα «${t.v}». Επιτρέπονται: ${[...names,'t','pi','e'].join(', ')}.`);}
   throw new ExprError(`Μη αναμενόμενο «${t.v}».`);}
  const tree=expr();if(i<tk.length)throw new ExprError(`Περισσεύει «${tk[i].v}».`);return tree;}
 function compile(n){switch(n[0]){
  case 'num':{const v=n[1];return ()=>v;}
  case 'var':{const k=n[1];return v=>v[k];}
  case 't':return (v,t)=>t;
  case 'un':{const a=compile(n[2]);return n[1]==='-'?(v,t)=>-a(v,t):(v,t)=>a(v,t)?0:1;}
  case 'if':{const c=compile(n[1]),a=compile(n[2]),b=compile(n[3]);return (v,t)=>c(v,t)?a(v,t):b(v,t);}
  case 'call':{const f=FUN[n[1]],as=n[2].map(compile);return as.length===1?(v,t)=>f(as[0](v,t)):(v,t)=>f(...as.map(g=>g(v,t)));}
  case 'bin':{const a=compile(n[2]),b=compile(n[3]);switch(n[1]){
   case '+':return (v,t)=>a(v,t)+b(v,t);case '-':return (v,t)=>a(v,t)-b(v,t);case '*':return (v,t)=>a(v,t)*b(v,t);case '/':return (v,t)=>a(v,t)/b(v,t);
   case '%':return (v,t)=>{const x=a(v,t),y=b(v,t);return x-y*Math.floor(x/y);};case '^':return (v,t)=>Math.pow(a(v,t),b(v,t));
   case '<':return (v,t)=>a(v,t)<b(v,t)?1:0;case '>':return (v,t)=>a(v,t)>b(v,t)?1:0;case '<=':return (v,t)=>a(v,t)<=b(v,t)?1:0;case '>=':return (v,t)=>a(v,t)>=b(v,t)?1:0;
   case '==':return (v,t)=>a(v,t)===b(v,t)?1:0;case '!=':return (v,t)=>a(v,t)!==b(v,t)?1:0;case '&&':return (v,t)=>a(v,t)&&b(v,t)?1:0;case '||':return (v,t)=>a(v,t)||b(v,t)?1:0;}}}
  throw new ExprError('Άγνωστος κόμβος.');}
 // "a, b c" → ['a','b','c'] (valid identifiers, no duplicates, at most `max`)
 // strict (expressions): not t, pi, e or a function name, which the parser reserves
 function names(s,max=6,strict=true){const out=[];for(const w of String(s||'').split(/[\s,;]+/))if(/^[A-Za-z_]\w*$/.test(w)&&!out.includes(w)&&!(strict&&((w in CONST)||w==='t'||FUN[w])))out.push(w);return out.slice(0,max);}
 // "Kp = 0.1, Ki=200" → {Kp:0.1, Ki:200}
 function params(s){const o={};for(const part of String(s||'').split(/[,;\n]+/)){const m=part.match(/^\s*([A-Za-z_]\w*)\s*=\s*([-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)\s*$/);if(m)o[m[1]]=+m[2];}return o;}
 const api={parse,compile,names,params,ExprError,FUN:Object.keys(FUN)};
 root.Expr=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
