'use strict';
// 4.17.1 (ROADMAP §59, THEORY §8Β): the inputs of a circuit and the parameters computed from them.
//
// An input is a parameter of a part marked «Είσοδος» (c.inp: [k, …], with an optional name c.inpName[k] and an
// explanation c.inpDesc[k]; otherwise the name <id>_<k> and the explanation of the parameter), or a constant block
// (CONST) with «Είσοδος» (its parameters input, name, desc; the value is v). A parameter whose value is a text that
// starts with «=» is an expression of the inputs (the language of the expression block: + − * / ^, functions, pi, e).
// An input may itself be an expression of other inputs. resolve() runs at the start of every build of the netlist, so
// any change recomputes the parameters; the solver, the SciPy export and the theory cards see numbers. The expression
// blocks see the inputs by name (as constants).
(function(root){
 const P=root.Parts||(typeof require!=='undefined'?require('./parts.js'):null);
 const Ex=root.Expr||(typeof require!=='undefined'?require('./expr.js'):null);
 const ID=/^[A-Za-z_]\w*$/;
 const isExpr=v=>typeof v==='string'&&/^\s*=/.test(v);
 const yes=v=>v===true||v==='1'||v==='true'||v===1;
 const defsOf=c=>{const d=P&&P.PARTS[c.type];return d&&Array.isArray(d.params)?d.params:[];};
 // only numeric parameters (and the value of a constant) take «= …»: a text such as the unit «=» of a gain (the unit of its
 // input) stays text
 const exprAt=(c,k,v)=>{if(!isExpr(v))return false;if(c.type==='CONST'&&k==='v')return true;const d=defsOf(c).find(q=>q.k===k);return !!d&&d.type==='num';};
 const safe=s=>{let n=String(s).replace(/[^A-Za-z0-9_]/g,'_');if(!/^[A-Za-z_]/.test(n))n='_'+n;return n;};
 const numOf=v=>{if(typeof v==='number')return v;const s=String(v??'').trim();if(!s)return NaN;
  const x=P&&P.parseEng?P.parseEng(s):parseFloat(s);if(Number.isFinite(x))return x;
  const sc=P&&P.parseSched?P.parseSched(s):null;return sc&&sc.length?sc[0][1]:NaN;};
 // the inputs declared in a project, in the order of the parts: {name, id, k, raw, unit, label, desc, kind}
 function list(project){const out=[];
  for(const c of project.components||[]){const p={...(P&&P.defaults?P.defaults(c.type):{}),...(c.params||{})},defs=defsOf(c);
   if(c.type==='CONST'&&yes(p.input)){const name=String(p.name||'').trim()||safe(c.label&&ID.test(c.label)?c.label:c.id);
    out.push({name,id:c.id,k:'v',raw:p.v,unit:String(p.unit||''),label:c.label||c.id,desc:String(p.desc||''),kind:'const'});}
   for(const k of Array.isArray(c.inp)?c.inp:[]){const d=defs.find(q=>q.k===k);const name=String(c.inpName?.[k]||'').trim()||safe(c.id+'_'+k);
    out.push({name,id:c.id,k,raw:p[k]??d?.def,unit:d?.unit||'',label:`${c.label||c.id} · ${d?.label||k}`,desc:String(c.inpDesc?.[k]||d?.hint||''),kind:'param'});}}
  return out;}
 function needs(project){return (project.components||[]).some(c=>(Array.isArray(c.inp)&&c.inp.length)||(c.type==='CONST'&&yes(c.params?.input))||Object.entries(c.params||{}).some(([k,v])=>exprAt(c,k,v)));}
 // the value of an expression «= …» with the inputs env ({name: number}); throws Expr's errors
 function evaluate(text,env){const src=String(text).replace(/^\s*=/,''),names=Object.keys(env),ast=Ex.parse(src,names),cv={};names.forEach((n,i)=>{cv[i]=env[n];});
  const v=Ex.compile(ast,cv)(new Array(names.length).fill(0),0);if(!Number.isFinite(v))throw new Error('η τιμή δεν είναι πεπερασμένος αριθμός');return v;}
 // → {project (a copy with numbers), env, inputs (with value), derived [{id, k, expr, value}], warnings}
 function resolve(project){const warnings=[],inputs=list(project),env={},seen=new Map();
  for(const q of inputs){if(!ID.test(q.name)){warnings.push(`Είσοδος «${q.name}» (${q.label}): το όνομα θέλει γράμματα, ψηφία και _ (λατινικά), όχι ψηφίο στην αρχή.`);q.bad=true;continue;}
   if(['t','pi','e'].includes(q.name)){warnings.push(`Είσοδος «${q.name}»: δεσμευμένο όνομα (t, pi, e).`);q.bad=true;continue;}
   if(seen.has(q.name)){warnings.push(`Δύο είσοδοι με το ίδιο όνομα «${q.name}» (${seen.get(q.name)}, ${q.label}): κρατιέται η πρώτη.`);q.bad=true;continue;}
   seen.set(q.name,q.label);}
  const todo=inputs.filter(q=>!q.bad);
  // numbers first, then the expressions whose names are known, in passes (an input of other inputs)
  for(const q of todo)if(!isExpr(q.raw)){const v=numOf(q.raw);if(Number.isFinite(v)){env[q.name]=v;q.value=v;q.done=true;}else{warnings.push(`Είσοδος «${q.name}» (${q.label}): η τιμή «${q.raw}» δεν είναι αριθμός.`);q.done=true;}}
  for(let pass=0;pass<=todo.length;pass++){let moved=false;
   for(const q of todo){if(q.done)continue;try{const v=evaluate(q.raw,env);env[q.name]=v;q.value=v;q.done=true;moved=true;}catch(e){q.err=e.message;}}
   if(!moved)break;}
  const failed=new Set();
  for(const q of todo)if(!q.done){failed.add(q.id+'|'+q.k);warnings.push(`Είσοδος «${q.name}» (${q.label}): ${/Άγνωστο όνομα/.test(q.err||'')?'κυκλική εξάρτηση ή άγνωστη είσοδος':'λάθος στην έκφραση'}: ${q.err} · μπαίνει η προεπιλογή.`);}
  // the project with numbers: every parameter «= …» of every part
  const out={...project,components:[]},derived=[];
  for(const c of project.components||[]){let cp=c;
   for(const [k,v] of Object.entries(c.params||{})){if(!exprAt(c,k,v))continue;if(cp===c)cp={...c,params:{...c.params}};
    try{const x=evaluate(v,env);cp.params[k]=x;derived.push({id:c.id,k,expr:String(v).replace(/^\s*=\s*/,''),value:x});}
    catch(e){delete cp.params[k];derived.push({id:c.id,k,expr:String(v).replace(/^\s*=\s*/,''),value:null,error:e.message});
     if(!failed.has(c.id+'|'+k))warnings.push(`${c.label||c.id}: η παράμετρος ${k} = «${v}» δεν υπολογίζεται (${e.message}) · μπαίνει η προεπιλογή.`);}}
   out.components.push(cp);}
  return {project:out,env,inputs:inputs.map(({done,err,...q})=>q),derived,warnings};}
 const api={list,needs,resolve,evaluate,isExpr,exprAt,safe};
 root.Inputs=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
