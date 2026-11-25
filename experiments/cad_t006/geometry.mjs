// Pure camera/mesh contract. Coordinates and distances are millimetres.
export const add = (a,b) => a.map((v,i)=>v+b[i]);
export const sub = (a,b) => a.map((v,i)=>v-b[i]);
export const mul = (a,s) => a.map(v=>v*s);
export const dot = (a,b) => a.reduce((s,v,i)=>s+v*b[i],0);
export const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm = a => Math.hypot(...a);
const unit = a => {const n=norm(a); return n>0?mul(a,1/n):[0,0,1]};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export function prepareMesh(raw) {
  if (!raw || raw.kind!=="native-cylinder-mesh" || raw.version!==1 || raw.units!=="mm" ||
      raw.brep_valid!==true || typeof raw.feature_id!=="string" || !raw.feature_id || raw.feature_id.length>128 ||
      !Array.isArray(raw.vertices) || !Array.isArray(raw.triangles) || !raw.vertices.length || !raw.triangles.length ||
      raw.vertices.length>100000 || raw.triangles.length>200000) throw Error("Unsupported native mesh v1");
  const low=[Infinity,Infinity,Infinity], high=[-Infinity,-Infinity,-Infinity];
  const points=raw.vertices;
  for(const p of points){
    if(!Array.isArray(p)||p.length!==3||p.some(v=>!Number.isFinite(v)||Math.abs(v)>1e6)) throw Error("Invalid vertex");
    p.forEach((v,i)=>{low[i]=Math.min(low[i],v);high[i]=Math.max(high[i],v)});
  }
  const center=mul(add(low,high),.5), radius=norm(sub(high,low))/2;
  if(!Number.isFinite(radius)||radius<=0) throw Error("Empty bounds");
  const positions=new Float32Array(points.length*3), normals=new Float32Array(positions.length);
  const indices=new Uint32Array(raw.triangles.length*3);
  points.forEach((p,i)=>positions.set(sub(p,center),i*3));
  for(const [i,t] of raw.triangles.entries()){
    if(!Array.isArray(t)||t.length!==3||new Set(t).size!==3||t.some(v=>!Number.isInteger(v)||v<0||v>=points.length)) throw Error("Invalid triangle");
    indices.set(t,i*3);
    const n=cross(sub(points[t[1]],points[t[0]]),sub(points[t[2]],points[t[0]]));
    for(const k of t) for(let axis=0;axis<3;axis++) normals[3*k+axis]+=n[axis];
  }
  for(let i=0;i<normals.length;i+=3) normals.set(unit(Array.from(normals.subarray(i,i+3))),i);
  return {featureId:raw.feature_id,center,radius,positions,normals,indices,vertexCount:points.length,triangleCount:raw.triangles.length};
}

export class Camera {
  constructor(radius=1,aspect=1){this.radius=radius;this.aspect=aspect;this.fov=Math.PI/4;this.fit()}
  fit(){this.target=[0,0,0];this.yaw=-Math.PI/4;this.pitch=Math.PI/6;this.distance=this.fitDistance()}
  fitDistance(){return 1.12*this.radius/Math.sin(Math.min(this.fov/2,Math.atan(Math.tan(this.fov/2)*this.aspect)))}
  resize(width,height){if(width>0&&height>0)this.aspect=width/height}
  orbit(dx,dy){this.yaw=(this.yaw-dx*.008)%(Math.PI*2);this.pitch=clamp(this.pitch+dy*.008,-Math.PI/2+.01,Math.PI/2-.01)}
  zoom(delta){this.distance=clamp(this.distance*Math.exp(clamp(delta,-1000,1000)*.0015),this.radius*.1,this.radius*1000)}
  basis(){
    const outward=[Math.cos(this.pitch)*Math.cos(this.yaw),Math.cos(this.pitch)*Math.sin(this.yaw),Math.sin(this.pitch)];
    const forward=mul(outward,-1),right=unit(cross(forward,[0,0,1])),up=cross(right,forward);
    return {eye:add(this.target,mul(outward,this.distance)),forward,right,up};
  }
  pan(dx,dy,height){if(height<=0)return;const {right,up}=this.basis(),s=2*this.distance*Math.tan(this.fov/2)/height;this.target=add(this.target,add(mul(right,-dx*s),mul(up,dy*s)))}
  matrices(){
    const {eye,forward:f,right:r,up:u}=this.basis();
    const view=new Float32Array([r[0],u[0],-f[0],0,r[1],u[1],-f[1],0,r[2],u[2],-f[2],0,-dot(r,eye),-dot(u,eye),dot(f,eye),1]);
    const depth=dot(mul(eye,-1),f);
    const near=Math.max(this.radius*.0005,depth-this.radius*1.4),far=Math.max(near+this.radius,depth+this.radius*1.4);
    const a=1/Math.tan(this.fov/2),d=near-far;
    return {view,projection:new Float32Array([a/this.aspect,0,0,0,0,a,0,0,0,0,(far+near)/d,-1,0,0,2*far*near/d,0])};
  }
  ray(x,y){ // NDC: [-1,1], +Y up
    const {eye,forward,right,up}=this.basis(),t=Math.tan(this.fov/2);
    return {origin:eye,direction:unit(add(forward,add(mul(right,x*t*this.aspect),mul(up,y*t))))};
  }
}

// Exact triangle hit on display mesh, double-sided, nearest positive distance.
export function pick(mesh,ray){
  const {origin:o,direction:d}=ray, {indices,positions}=mesh;
  const vertex=i=>Array.from(positions.subarray(3*i,3*i+3));
  let nearest=Infinity,triangle=-1;
  for(let i=0;i<indices.length;i+=3){
    const a=vertex(indices[i]),e1=sub(vertex(indices[i+1]),a),e2=sub(vertex(indices[i+2]),a),p=cross(d,e2),det=dot(e1,p);
    if(Math.abs(det)<1e-10)continue;
    const inv=1/det,s=sub(o,a),u=dot(s,p)*inv;if(u<0||u>1)continue;
    const q=cross(s,e1),v=dot(d,q)*inv;if(v<0||u+v>1)continue;
    const t=dot(e2,q)*inv;if(t>0&&t<nearest){nearest=t;triangle=i/3}
  }
  return triangle<0?null:{featureId:mesh.featureId,triangle,distance:nearest};
}
