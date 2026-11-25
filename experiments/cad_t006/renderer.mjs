// Retained WebGL2 buffers. Camera/selection changes update uniforms, not mesh.
const VS=`#version 300 es
layout(location=0) in vec3 aPosition;
layout(location=1) in vec3 aNormal;
uniform mat4 uView, uProjection;
out vec3 vNormal;
void main(){vNormal=aNormal;gl_Position=uProjection*uView*vec4(aPosition,1.0);}`;
const FS=`#version 300 es
precision highp float;
in vec3 vNormal;
uniform vec3 uColor;
out vec4 color;
void main(){vec3 n=normalize(vNormal);float l=0.35+0.65*max(0.0,dot(n,normalize(vec3(0.5,-0.65,0.8))));color=vec4(uColor*l,1.0);}`;

function shader(gl,type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const error=gl.getShaderInfoLog(s);gl.deleteShader(s);throw Error(error)}return s}
function program(gl){
  const p=gl.createProgram();let v,f;
  try{v=shader(gl,gl.VERTEX_SHADER,VS);f=shader(gl,gl.FRAGMENT_SHADER,FS);gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p}
  catch(e){gl.deleteProgram(p);throw e}finally{if(v)gl.deleteShader(v);if(f)gl.deleteShader(f)}
}

export class Renderer {
  constructor(gl){
    if(!gl)throw Error("WebGL2 unavailable");this.gl=gl;this.program=program(gl);this.vao=null;this.buffers=[];this.count=0;this.uploads=0;this.frames=0;
    this.view=gl.getUniformLocation(this.program,"uView");this.proj=gl.getUniformLocation(this.program,"uProjection");this.color=gl.getUniformLocation(this.program,"uColor");
    gl.enable(gl.DEPTH_TEST);gl.clearColor(.95,.97,.96,1);
  }
  releaseMesh(){const g=this.gl;if(this.vao)g.deleteVertexArray(this.vao);for(const b of this.buffers)g.deleteBuffer(b);this.vao=null;this.buffers=[];this.count=0}
  setMesh(mesh){
    this.releaseMesh();const g=this.gl;this.vao=g.createVertexArray();g.bindVertexArray(this.vao);
    for(const [location,data] of [[0,mesh.positions],[1,mesh.normals]]){const b=g.createBuffer();this.buffers.push(b);g.bindBuffer(g.ARRAY_BUFFER,b);g.bufferData(g.ARRAY_BUFFER,data,g.STATIC_DRAW);g.enableVertexAttribArray(location);g.vertexAttribPointer(location,3,g.FLOAT,false,0,0)}
    const b=g.createBuffer();this.buffers.push(b);g.bindBuffer(g.ELEMENT_ARRAY_BUFFER,b);g.bufferData(g.ELEMENT_ARRAY_BUFFER,mesh.indices,g.STATIC_DRAW);this.count=mesh.indices.length;
    g.bindVertexArray(null);g.bindBuffer(g.ARRAY_BUFFER,null);this.uploads++;
  }
  draw(camera,width,height,selected=false){
    const g=this.gl;if(width<=0||height<=0)return;g.viewport(0,0,width,height);g.clear(g.COLOR_BUFFER_BIT|g.DEPTH_BUFFER_BIT);this.frames++;
    if(!this.vao)return;const {view,projection}=camera.matrices();g.useProgram(this.program);g.uniformMatrix4fv(this.view,false,view);g.uniformMatrix4fv(this.proj,false,projection);
    g.uniform3fv(this.color,selected?[.18,.49,.83]:[.42,.58,.63]);g.bindVertexArray(this.vao);g.drawElements(g.TRIANGLES,this.count,g.UNSIGNED_INT,0);g.bindVertexArray(null);
  }
  dispose(){this.releaseMesh();if(this.program)this.gl.deleteProgram(this.program);this.program=null}
}
