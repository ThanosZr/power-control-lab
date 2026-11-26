// Isolated, dependency-free 2D reference solver; lengths are in mm.
export const LIMITS = Object.freeze({variables: 64, constraints: 128, magnitude: 10000,
  residual: 1e-7, rank: 1e-8, geometry: 1e-6, iterations: 80});
const idOK = s => typeof s === 'string' && /^[A-Za-z][A-Za-z0-9_-]{0,39}$/.test(s);
const finite = x => typeof x === 'number' && Number.isFinite(x) && Math.abs(x) <= LIMITS.magnitude;
const positive = x => finite(x) && x > LIMITS.geometry;
const copy = x => structuredClone(x);
const fail = message => { throw new TypeError(message); };
const ordered = a => [...a].sort((a,b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

function prepare(input) {
  if (!input || input.schema !== 1) fail('Expected schema 1');
  for (const key of ['points','lines','circles','constraints'])
    if (!Array.isArray(input[key]) || input[key].length > LIMITS.constraints) fail('Invalid '+key);
  if (2*input.points.length + input.circles.length > LIMITS.variables) fail('Variable limit');
  const ids = new Set(), points = new Map(), lines = new Map(), circles = new Map(), x = [];
  function identify(item) {
    if (!item || !idOK(item.id) || ids.has(item.id)) fail('Invalid or duplicate ID');
    ids.add(item.id);
  }
  const model = {schema:1,points:[],lines:[],circles:[],constraints:[]};
  for (const p of ordered(input.points.map(p=>{identify(p);return p}))) {
    if (!finite(p.x) || !finite(p.y)) fail('Invalid point '+p.id);
    points.set(p.id,x.length); x.push(p.x,p.y); model.points.push({id:p.id,x:p.x,y:p.y});
  }
  function point(id) { if (!points.has(id)) fail('Unknown point '+id); return points.get(id); }
  for (const l of ordered(input.lines.map(l=>{identify(l);return l}))) {
    const a=point(l.a), b=point(l.b); if(a===b) fail('Line endpoints must differ');
    lines.set(l.id,[a,b]); model.lines.push({id:l.id,a:l.a,b:l.b});
  }
  for (const c of ordered(input.circles.map(c=>{identify(c);return c}))) {
    point(c.center); if(!positive(c.radius)) fail('Invalid circle radius');
    circles.set(c.id,x.length); x.push(c.radius); model.circles.push({id:c.id,center:c.center,radius:c.radius});
  }
  const rows=[];
  function line(id) { if(!lines.has(id)) fail('Unknown line '+id); return lines.get(id); }
  function circle(id) { if(!circles.has(id)) fail('Unknown circle '+id); return circles.get(id); }
  // Each row emits a residual and analytic gradient. Row IDs make diagnostics stable.
  function linear(id, terms, target=0) {
    rows.push({id, eval(v) { const g=Array(v.length).fill(0); let r=-target;
      for(const [i,k] of terms){g[i]+=k;r+=k*v[i]} return {r,g}; }});
  }
  function difference(v,a,b,g,weight) {
    const dx=v[b]-v[a], dy=v[b+1]-v[a+1], d=Math.hypot(dx,dy);
    if(d>1e-12) { const u=weight*dx/d,w=weight*dy/d;
      g[b]+=u;g[a]-=u;g[b+1]+=w;g[a+1]-=w; }
    return d;
  }
  for(const c of ordered(input.constraints.map(c=>{identify(c);return c}))) {
    let record={id:c.id,type:c.type}; const key=c.id;
    switch(c.type) {
      case 'fixed': { const a=point(c.point); if(!finite(c.x)||!finite(c.y))fail('Invalid fixed target');
        linear(key,[[a,1]],c.x);linear(key,[[a+1,1]],c.y);Object.assign(record,{point:c.point,x:c.x,y:c.y});break; }
      case 'coincident': { const a=point(c.a),b=point(c.b);if(a===b)fail('Coincident references must differ');
        linear(key,[[a,1],[b,-1]]);linear(key,[[a+1,1],[b+1,-1]]);Object.assign(record,{a:c.a,b:c.b});break; }
      case 'horizontal': case 'vertical': { const [a,b]=line(c.line), k=c.type==='horizontal'?1:0;
        linear(key,[[b+k,1],[a+k,-1]]);record.line=c.line;break; }
      case 'dx': case 'dy': { const a=point(c.a),b=point(c.b),k=c.type==='dx'?0:1;
        if(a===b||!finite(c.value))fail('Invalid signed dimension');
        linear(key,[[b+k,1],[a+k,-1]],c.value);Object.assign(record,{a:c.a,b:c.b,value:c.value});break; }
      case 'distance': { const a=point(c.a),b=point(c.b); if(a===b||!positive(c.value))fail('Invalid distance');
        rows.push({id:key,eval(v){const g=Array(v.length).fill(0);return {r:difference(v,a,b,g,1)-c.value,g}}});
        Object.assign(record,{a:c.a,b:c.b,value:c.value});break; }
      case 'radius': { const i=circle(c.circle);if(!positive(c.value))fail('Invalid radius target');
        linear(key,[[i,1]],c.value);Object.assign(record,{circle:c.circle,value:c.value});break; }
      case 'equal_length': { const [a,b]=line(c.a),[d,e]=line(c.b);if(c.a===c.b)fail('Equal length references must differ');
        rows.push({id:key,eval(v){const g=Array(v.length).fill(0);return {r:difference(v,a,b,g,1)-difference(v,d,e,g,-1),g}}});
        Object.assign(record,{a:c.a,b:c.b});break; }
      default: fail('Unsupported constraint '+c.type);
    }
    model.constraints.push(record);
  }
  return {model,x,rows,lines,circles};
}

function evaluate(rows,x) {
  const values=rows.map(row=>({...row.eval(x),id:row.id}));
  return {values,cost:values.reduce((s,{r})=>s+r*r,0),max:values.reduce((s,{r})=>Math.max(s,Math.abs(r)),0)};
}
// Rank of the row-normalized Jacobian, using pivoted elimination. Local rank only.
function rankOf(values,n) {
  const a=values.map(({g})=>{const norm=Math.hypot(...g);return norm>1e-12?g.map(v=>v/norm):[...g]});
  let r=0;
  for(let c=0;c<n && r<a.length;c++) {
    let p=r;for(let i=r+1;i<a.length;i++)if(Math.abs(a[i][c])>Math.abs(a[p][c]))p=i;
    if(Math.abs(a[p][c])<=LIMITS.rank)continue;
    [a[p],a[r]]=[a[r],a[p]];
    for(let i=r+1;i<a.length;i++){const f=a[i][c]/a[r][c];for(let j=c;j<n;j++)a[i][j]-=f*a[r][j]}
    r++;
  }
  return r;
}
function step(values,n,lambda) {
  // Damped normal equations. Positive diagonal damping makes the system nonsingular.
  const a=Array.from({length:n},(_,i)=>Array.from({length:n+1},(_,j)=>i===j?lambda:0));
  for(const {g,r} of values)for(let i=0;i<n;i++)if(g[i]){
    for(let j=0;j<n;j++)a[i][j]+=g[i]*g[j];a[i][n]-=g[i]*r;
  }
  for(let c=0;c<n;c++){
    let p=c;for(let i=c+1;i<n;i++)if(Math.abs(a[i][c])>Math.abs(a[p][c]))p=i;
    [a[c],a[p]]=[a[p],a[c]];
    if(!Number.isFinite(a[c][c])||Math.abs(a[c][c])<1e-15)return null;
    for(let i=c+1;i<n;i++){const f=a[i][c]/a[c][c];for(let j=c;j<=n;j++)a[i][j]-=f*a[c][j]}
  }
  const d=Array(n).fill(0);
  for(let i=n-1;i>=0;i--){let s=a[i][n];for(let j=i+1;j<n;j++)s-=a[i][j]*d[j];d[i]=s/a[i][i]}
  return d;
}
function geometric(p,x) {
  for(const [id,[a,b]] of p.lines)if(Math.hypot(x[b]-x[a],x[b+1]-x[a+1])<=LIMITS.geometry)return 'Degenerate line '+id;
  for(const [id,i] of p.circles)if(!positive(x[i]))return 'Invalid solved radius '+id;
  return null;
}

export function solve(input) {
  let p;try{p=prepare(input)}catch(e){return {ok:false,diagnostics:{status:'invalid',message:e.message}}}
  let x=p.x, ev=evaluate(p.rows,x), lambda=1e-4, iterations=0;
  while(ev.max>LIMITS.residual && iterations<LIMITS.iterations && lambda<=1e12){
    iterations++;const d=step(ev.values,x.length,lambda);if(!d)break;
    const trial=x.map((v,i)=>v+d[i]);
    if(trial.every(finite)){
      const next=evaluate(p.rows,trial);
      if(next.cost<ev.cost){x=trial;ev=next;lambda=Math.max(1e-10,lambda/10);continue}
    }
    lambda*=10;
  }
  const rank=rankOf(ev.values,x.length), dof=x.length-rank, redundantRows=p.rows.length-rank;
  const violations=[...new Set(ev.values.filter(v=>Math.abs(v.r)>LIMITS.residual).map(v=>v.id))];
  const geometryError=geometric(p,x), ok=ev.max<=LIMITS.residual&&!geometryError;
  const diagnostics={status:ok?(dof?'underconstrained':'fully_constrained'):(geometryError?'degenerate':'unsatisfied'),
    variables:x.length,equations:p.rows.length,rank,dof,redundantRows,maxResidual:ev.max,iterations,violations};
  if(!ok){diagnostics.message=geometryError||'Residual tolerance not reached; incompatible or locally non-convergent constraints';return {ok:false,diagnostics}}
  let i=0;for(const q of p.model.points){q.x=x[i++];q.y=x[i++]}
  for(const q of p.model.circles)q.radius=x[i++];
  return {ok:true,model:p.model,diagnostics};
}

// One owner. Whole-model candidate, optimistic revision, atomic commit on success only.
export class Sketch {
  #state;
  constructor(model){const result=solve(model);if(!result.ok)throw new TypeError(result.diagnostics.message);
    this.#state={revision:0,model:result.model,diagnostics:result.diagnostics};}
  snapshot(){return copy(this.#state)}
  apply(model,expectedRevision){
    if(expectedRevision!==this.#state.revision)return {ok:false,diagnostics:{status:'stale',message:'Revision mismatch'},state:this.snapshot()};
    const result=solve(model);
    if(result.ok && JSON.stringify(result.model)!==JSON.stringify(this.#state.model))
      this.#state={revision:this.#state.revision+1,model:result.model,diagnostics:result.diagnostics};
    return {ok:result.ok,diagnostics:copy(result.diagnostics),state:this.snapshot()};
  }
}

export function sample(){return {schema:1,
  points:[{id:'A',x:0,y:0},{id:'B',x:80,y:0},{id:'C',x:80,y:45},{id:'D',x:0,y:45},{id:'O',x:40,y:22.5}],
  lines:[{id:'AB',a:'A',b:'B'},{id:'BC',a:'B',b:'C'},{id:'CD',a:'C',b:'D'},{id:'DA',a:'D',b:'A'}],
  circles:[{id:'hole',center:'O',radius:10}],constraints:[
    {id:'anchor',type:'fixed',point:'A',x:0,y:0},{id:'center',type:'fixed',point:'O',x:40,y:22.5},
    {id:'bottom',type:'horizontal',line:'AB'},{id:'top',type:'horizontal',line:'CD'},
    {id:'left',type:'vertical',line:'DA'},{id:'right',type:'vertical',line:'BC'},
    {id:'width',type:'dx',a:'A',b:'B',value:80},{id:'height',type:'dy',a:'B',b:'C',value:45},
    {id:'holeRadius',type:'radius',circle:'hole',value:10}]};}
