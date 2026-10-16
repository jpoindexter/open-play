import {createVideoAudioFXFrameState,planVideoAudioFXFrame,videoAudioFXPolicy} from './video-audio-fx-state.js';
export {describeAudioVideoLinks,videoAudioFXPolicy} from './video-audio-fx-state.js';
const vertex=`#version 300 es
in vec2 point;out vec2 uv;void main(){uv=point*.5+.5;gl_Position=vec4(point,0.,1.);}`;
const fragment=`#version 300 es
precision highp float;precision highp sampler2DArray;
in vec2 uv;out vec4 outputColor;
uniform sampler2D inputFrame;uniform sampler2DArray pastFrames;
uniform int kind;uniform ivec3 taps;uniform vec4 controls;uniform vec4 colour;
uniform float amount;uniform float motion;uniform float premultipliedOutput;
vec4 pm(vec4 c){return vec4(c.rgb*c.a,c.a);}vec4 st(vec4 c){return vec4(c.a>.000001?c.rgb/c.a:vec3(0.),c.a);}
bool outside(vec2 p){return any(lessThan(p,vec2(0.)))||any(greaterThan(p,vec2(1.)));}
vec4 source(vec2 p){return outside(p)?vec4(0.):st(texture(inputFrame,p));}
vec4 past(vec2 p,int layer){return outside(p)||layer<0?vec4(0.):st(texture(pastFrames,vec3(p,float(layer))));}
vec4 over(vec4 a,vec4 b){float alpha=a.a+b.a*(1.-a.a);return vec4(alpha>.000001?(a.rgb*a.a+b.rgb*b.a*(1.-a.a))/alpha:vec3(0.),alpha);}
void main(){vec4 c=source(uv),z=c;
 if(kind==0){for(int i=0;i<3;i++){int layer=i==0?taps.x:i==1?taps.y:taps.z;vec2 offset=vec2(.06,.015)*amount*float(i+1);vec4 ghost=past(uv-offset,layer);float decay=i==0?1.:pow(controls.x,float(i));ghost.a*=amount*.65*decay;z=over(ghost,z);}}
 else if(kind==1){vec2 p=uv;p.x+=sin(uv.y*6.28318530718*(2.+colour.y*20.))*.07*colour.x*amount*motion;z=source(p);float k=1.+colour.x*8.;vec3 rgb;
  if(colour.w<.5)rgb=(tanh((z.rgb-.5)*k)/max(.00001,tanh(k*.5))+1.)*.5;
  else if(colour.w<1.5)rgb=clamp((z.rgb-.5)*(1.+colour.x*5.)+.5,0.,1.);
  else rgb=abs(fract(z.rgb*k*.5)*2.-1.);
  rgb+=vec3(.15,0.,-.15)*colour.z;z.rgb=mix(z.rgb,clamp(rgb,0.,1.),amount);
 }
 z=vec4(clamp(z.rgb,0.,1.),clamp(z.a,0.,1.));outputColor=premultipliedOutput>.5?pm(z):z;}`;

/** Original semantic processor. Empty links is identity by reference, without a
 * GPU allocation/readback. Active links preserve bank/slot order, with dedicated
 * timestamped input history. No audio graph API or FFT input is consulted here.
 * All internal filtering is premultiplied; output is straight-alpha Canvas.
 */
export function createVideoAudioFX({width=640,height=360}={}){
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>4096||height>4096||width*height>1920*1080)throw new RangeError('Semantic Video FX needs integer output dimensions within the independent1080p budget.');
  let gpu=null,disposed=false,last={active:[],policy:videoAudioFXPolicy};const states=new Map();
  function live(){if(disposed)throw new Error('Semantic Video FX was disposed.');}
  function setup(){
    if(gpu)return gpu;if(typeof document==='undefined')throw new Error('Semantic Video FX needs a browser WebGL2 canvas.');
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    const gl=canvas.getContext('webgl2',{alpha:true,premultipliedAlpha:false,preserveDrawingBuffer:true,antialias:false,depth:false,stencil:false});
    if(!gl)throw new Error('Semantic Video FX requires WebGL2; no placeholder rendering.');
    const textures=new Set(),buffers=new Set();
    function texture(w,h,array=false){const t=gl.createTexture(),target=array?gl.TEXTURE_2D_ARRAY:gl.TEXTURE_2D;textures.add(t);gl.bindTexture(target,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);for(const p of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(target,p,gl.LINEAR);for(const p of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(target,p,gl.CLAMP_TO_EDGE);if(array)gl.texImage3D(target,0,gl.RGBA8,w,h,16,0,gl.RGBA,gl.UNSIGNED_BYTE,null);else gl.texImage2D(target,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);return t;}
    function framebuffer(t,layer=null){const f=gl.createFramebuffer();buffers.add(f);gl.bindFramebuffer(gl.FRAMEBUFFER,f);if(layer===null)gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);else gl.framebufferTextureLayer(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,t,0,layer);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('Semantic Video FX framebuffer failed.');return f;}
    const compile=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const error=gl.getShaderInfoLog(s);gl.deleteShader(s);throw new Error('Semantic Video FX shader: '+error);}return s;};
    const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment),program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Semantic Video FX shader link: '+gl.getProgramInfoLog(program));gl.useProgram(program);
    const quad=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,quad);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const point=gl.getAttribLocation(program,'point');gl.enableVertexAttribArray(point);gl.vertexAttribPointer(point,2,gl.FLOAT,false,0,0);
    const uniform=Object.fromEntries(['inputFrame','pastFrames','kind','taps','controls','colour','amount','motion','premultipliedOutput'].map(name=>[name,gl.getUniformLocation(program,name)]));gl.uniform1i(uniform.inputFrame,0);gl.uniform1i(uniform.pastFrames,1);gl.disable(gl.BLEND);gl.disable(gl.DEPTH_TEST);
    const input=texture(width,height),blank=texture(1,1,true),work=[0,1].map(()=>{const t=texture(width,height);return {texture:t,framebuffer:framebuffer(t)};});
    gpu={gl,canvas,program,quad,uniform,input,blank,work,textures,buffers,texture,framebuffer};return gpu;
  }
  function release(state){if(!gpu||!state)return;const {gl}=gpu;if(state.history){gl.deleteTexture(state.history);gpu.textures.delete(state.history);}for(const f of state.framebuffers||[]){gl.deleteFramebuffer(f);gpu.buffers.delete(f);}}
  function reset(){live();for(const state of states.values())release(state);states.clear();last={active:[],policy:videoAudioFXPolicy};}
  function draw(source,target,link=null,state=null,plan=null,w=width,h=height){
    const {gl,uniform,program,blank}=gpu;gl.bindFramebuffer(gl.FRAMEBUFFER,target);gl.viewport(0,0,w,h);gl.useProgram(program);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,source);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D_ARRAY,state?.history||blank);
    gl.uniform1i(uniform.kind,link?link.kind==='echo'?(plan.suppressed?-1:0):1:-1);gl.uniform1f(uniform.amount,link?.amount??0);gl.uniform1f(uniform.motion,plan?.geometricMotion?1:0);gl.uniform1f(uniform.premultipliedOutput,target?1:0);
    gl.uniform3iv(uniform.taps,new Int32Array(plan?.taps||[-1,-1,-1]));gl.uniform4f(uniform.controls,link?.feedback??0,0,0,0);gl.uniform4f(uniform.colour,link?.drive??0,link?.character??.5,(link?.tone??0)/24,['Smooth Drive','Hard Clip','Foldback'].indexOf(link?.type));gl.drawArrays(gl.TRIANGLES,0,6);
  }
  function render(source,links=[],context={}){
    live();if(!Array.isArray(links))throw new TypeError('Semantic Video FX links must be an array.');
    const ids=new Set();for(const link of links){if(!link||!['echo','distortion'].includes(link.kind)||typeof link.id!=='string'||ids.has(link.id)||!Number.isFinite(link.amount)||link.amount<0||link.amount>1||!Number.isFinite(link.delaySeconds)||link.delaySeconds<=0)throw new TypeError('Semantic Video FX received malformed or duplicate links.');ids.add(link.id);}
    for(const [id,state] of states)if(!ids.has(id)){release(state);states.delete(id);}
    if(!links.length){last={active:[],policy:videoAudioFXPolicy};return source;}
    const {gl,input,work,canvas}=setup();if(gl.isContextLost())throw new Error('Semantic Video FX context was lost; recreate the pipeline.');
    const w=source?.videoWidth||source?.naturalWidth||source?.width,h=source?.videoHeight||source?.naturalHeight||source?.height;
    if(!w||!h||(typeof source.readyState==='number'&&source.readyState<2))throw new Error('Semantic Video FX needs an available decoded frame.');
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,input);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);
    let current=input,pass=0;const active=[],prefix=[];
    for(const link of links){let state=states.get(link.id);if(state&&state.kind!==link.kind){release(state);states.delete(link.id);state=null;}
      if(!state){state={kind:link.kind,clock:createVideoAudioFXFrameState()};if(link.kind==='echo'){const scale=Math.min(1,320/width,180/height);state.width=Math.max(1,Math.round(width*scale));state.height=Math.max(1,Math.round(height*scale));state.history=gpu.texture(state.width,state.height,true);state.framebuffers=Array.from({length:16},(_,layer)=>gpu.framebuffer(state.history,layer));}states.set(link.id,state);}
      prefix.push([link.id,link.kind]);const plan=planVideoAudioFXFrame(state.clock,link,{...context,topologyKey:JSON.stringify(prefix)});if(plan.captureLayer!==null)draw(current,state.framebuffers[plan.captureLayer],null,null,null,state.width,state.height);
      const target=work[pass++%2];draw(current,target.framebuffer,link,state,plan);current=target.texture;
      active.push({id:link.id,name:link.name,kind:link.kind,amount:link.amount,delaySeconds:link.delaySeconds,feedback:link.feedback,suppressed:plan.suppressed,resetReasons:plan.resetReasons,taps:plan.taps,captureCount:state.clock.captures,retainedFrames:state.clock.times.filter(Number.isFinite).length,lastReset:state.clock.lastReset});
    }
    draw(current,null);const error=gl.getError();if(error!==gl.NO_ERROR)throw new Error('Semantic Video FX WebGL processing failed: '+error);last={active,policy:videoAudioFXPolicy};return canvas;
  }
  function dispose(){if(disposed)return;reset();disposed=true;if(gpu){const {gl}=gpu;for(const t of gpu.textures)gl.deleteTexture(t);for(const f of gpu.buffers)gl.deleteFramebuffer(f);gl.deleteBuffer(gpu.quad);gl.deleteProgram(gpu.program);gl.getExtension('WEBGL_lose_context')?.loseContext();gpu.canvas.width=gpu.canvas.height=0;gpu=null;}}
  return {render,reset,dispose,diagnostics:()=>({...last,disposed,backend:gpu?'WebGL2':'unallocated-off'})};
}
