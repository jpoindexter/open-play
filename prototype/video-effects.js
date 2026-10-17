import { videoEffectCatalog } from "./video-effects-catalog.js";
import { videoVertexShader, videoFragmentShader } from "./video-effects-shaders.js";
import { normalizeVideoContext, normalizeVideoSpec, createVideoEffectState,
  planVideoEffectFrame, videoEffectUniforms } from "./video-effects-state.js";
export { videoEffectCatalog } from "./video-effects-catalog.js";
export const videoEffectCapabilities = Object.freeze({ backend: "WebGL2", slots: 2,
  maxPixels: 1920*1080, maxSide: 4096, historySamples: 16,
  historyMaxWidth: 320, historyMaxHeight: 180, referenceVisualParity: false });

/**
 * Original two-slot WebGL2 renderer. render() returns this same private canvas.
 * Ordered specs: {name,on,value:0..1,params}. Unknown enabled names throw.
 * Context time is seconds; bpm is20..400; bands/level/upfader are normalized0..1.
 * Optional rate is signed transport speed; position overrides record integration.
 * Optional secondarySource supplies a keyed background, otherwise keys retain alpha.
 * assetId explicitly identifies media replaced inside the same canvas/video element.
 * Source identity/currentSrc, effect/off changes, reset and backward time clear state.
 * Keep time monotonic and frameId stable for duplicate renders of the same input frame.
 * Manual Meaning Freeze expires by supplied presentation time, including duplicate
 * frame IDs/paused source; legacy mode retains one frame indefinitely until retrigger.
 * Manual Meaning Analyzer consumes an exact validated eight-value spectrum8
 * vector; unavailable data bypasses pixels and is reported in diagnostics().
 * History uses16 real captured frames at up to320x180; unavailable ages use oldest.
 * Internal textures are premultiplied for correct transparent-edge filtering;
 * colour algorithms use decoded straight RGB, then re-encode per pass. Output is straight.
 * No image readback occurs in render(); readPixels() is a synchronous test/debug API.
 * Caller owns animation scheduling; this module makes no60fps/full-pipeline claim.
 */
export function createVideoEffects({width = 640, height = 360} = {}) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 ||
      width > 4096 || height > 4096 || width*height > videoEffectCapabilities.maxPixels)
    throw new Error("Video FX output must be positive integer dimensions within the independent1080p pixel budget.");
  if (typeof document === "undefined") throw new Error("Independent Video FX needs a browser canvas with WebGL2; no headless pixel fallback is implied.");
  const canvas = document.createElement("canvas"); canvas.width=width;canvas.height=height;
  const gl = canvas.getContext("webgl2", {alpha:true,premultipliedAlpha:false,
    preserveDrawingBuffer:true,antialias:false,depth:false,stencil:false});
  if (!gl) throw new Error("Independent Video FX requires WebGL2. Effects are unavailable; no cosmetic fallback is substituted.");
  let disposed=false, lost=false, lastSource=null, lastAsset, lastURL="";
  let lastDiagnostics={spectrum8Available:false,slots:[]};
  const slots=[null,null], textures=new Set(), framebuffers=new Set();
  const shader=(type,source)=>{
    const result=gl.createShader(type);gl.shaderSource(result,source);gl.compileShader(result);
    if(!gl.getShaderParameter(result,gl.COMPILE_STATUS)) {
      const message=gl.getShaderInfoLog(result);gl.deleteShader(result);throw new Error(`Video FX shader compile failed: ${message}`);
    }return result;
  };
  const vertex=shader(gl.VERTEX_SHADER,videoVertexShader), fragment=shader(gl.FRAGMENT_SHADER,videoFragmentShader);
  const program=gl.createProgram();gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);
  gl.deleteShader(vertex);gl.deleteShader(fragment);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(`Video FX shader link failed: ${gl.getProgramInfoLog(program)}`);
  gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,"position");gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  const uniforms=Object.fromEntries(["inputFrame","holdFrame","backgroundFrame","historyFrames","effect","amount","time","bpm","level","upfader","rate","recordPosition","reducedMotion","hasBackground","outputPremultiplied","resolution","bands","spectrum8[0]","columns","p","historyLayers[0]"].map(name=>[name,gl.getUniformLocation(program,name)]));
  gl.uniform1i(uniforms.inputFrame,0);gl.uniform1i(uniforms.holdFrame,1);
  gl.uniform1i(uniforms.backgroundFrame,2);gl.uniform1i(uniforms.historyFrames,3);
  gl.disable(gl.BLEND);gl.disable(gl.DEPTH_TEST);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
  function texture(w,h,array=false) {
    const t=gl.createTexture(), target=array?gl.TEXTURE_2D_ARRAY:gl.TEXTURE_2D;
    textures.add(t);gl.bindTexture(target,t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
    gl.texParameteri(target,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(target,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(target,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(target,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    if(array)gl.texImage3D(target,0,gl.RGBA8,w,h,16,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
    else gl.texImage2D(target,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
    return t;
  }
  function framebuffer(t,arrayLayer=null) {
    const f=gl.createFramebuffer();framebuffers.add(f);gl.bindFramebuffer(gl.FRAMEBUFFER,f);
    if(arrayLayer===null)gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);
    else gl.framebufferTextureLayer(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,t,0,arrayLayer);
    if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error("Independent Video FX framebuffer allocation failed.");
    return f;
  }
  const input=texture(width,height), background=texture(width,height), blank=texture(1,1), blankHistory=texture(1,1,true);
  const work=[0,1].map(()=>{const t=texture(width,height);return{texture:t,framebuffer:framebuffer(t)};});
  const bindTexture=(unit,target,t)=>{gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(target,t);};
  function draw(source,target,spec=null,context=null,state=null,plan=null,w=width,h=height,hasBackground=false) {
    gl.bindFramebuffer(gl.FRAMEBUFFER,target);gl.viewport(0,0,w,h);gl.useProgram(program);
    bindTexture(0,gl.TEXTURE_2D,source);bindTexture(1,gl.TEXTURE_2D,state?.hold || blank);
    bindTexture(2,gl.TEXTURE_2D,background);bindTexture(3,gl.TEXTURE_2D_ARRAY,state?.history || blankHistory);
    gl.uniform1i(uniforms.effect,spec?.id ?? -1);gl.uniform1f(uniforms.amount,spec?.value ?? 0);
    gl.uniform2f(uniforms.resolution,width,height);
    gl.uniform1f(uniforms.outputPremultiplied,target?1:0);
    if(spec) {
      gl.uniform1f(uniforms.time,context.time);gl.uniform1f(uniforms.bpm,context.bpm);
      gl.uniform1f(uniforms.level,context.level);gl.uniform1f(uniforms.upfader,context.upfader);
      gl.uniform1f(uniforms.rate,context.rate);gl.uniform1f(uniforms.recordPosition,state.recordPosition);
      gl.uniform1f(uniforms.reducedMotion,context.reducedMotion?1:0);
      gl.uniform1f(uniforms.hasBackground,hasBackground?1:0);
      gl.uniform3fv(uniforms.bands,context.bands);gl.uniform3fv(uniforms.columns,state.columns);
      gl.uniform1fv(uniforms["spectrum8[0]"],context.spectrum8??[0,0,0,0,0,0,0,0]);
      gl.uniform4fv(uniforms.p,videoEffectUniforms(spec,state,context));
      gl.uniform1iv(uniforms["historyLayers[0]"],new Int32Array(plan.historyLayers));
    }
    gl.drawArrays(gl.TRIANGLES,0,6);
  }
  function deleteTexture(t){if(t){gl.deleteTexture(t);textures.delete(t);}}
  function deleteFramebuffer(f){if(f){gl.deleteFramebuffer(f);framebuffers.delete(f);}}
  function clearSlot(index) {
    const s=slots[index];if(!s)return;
    deleteTexture(s.hold);deleteTexture(s.history);deleteFramebuffer(s.holdFramebuffer);
    for(const f of s.historyFramebuffers || [])deleteFramebuffer(f);
    slots[index]=null;
  }
  function stateFor(index,name) {
    if(slots[index]?.name!==name)clearSlot(index);
    if(!slots[index]) {
      const state=createVideoEffectState(name);
      if(name==="Frame Freeze") {
        state.hold=texture(width,height);state.holdFramebuffer=framebuffer(state.hold);
      }
      if(name==="Delay Grid") {
        const scale=Math.min(1,320/width,180/height);
        state.historyWidth=Math.max(1,Math.round(width*scale));state.historyHeight=Math.max(1,Math.round(height*scale));
        state.history=texture(state.historyWidth,state.historyHeight,true);
        state.historyFramebuffers=Array.from({length:16},(_,layer)=>framebuffer(state.history,layer));
      }
      slots[index]=state;
    }return slots[index];
  }
  function upload(target,source) {
    const w=source.videoWidth || source.naturalWidth || source.width,
      h=source.videoHeight || source.naturalHeight || source.height;
    if(!w || !h || (typeof source.readyState === "number" && source.readyState < 2) ||
      (typeof source.naturalWidth === "number" && source.naturalWidth === 0))
      throw new Error("Video FX source frame is not decoded/available yet.");
    bindTexture(0,gl.TEXTURE_2D,target);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
    try {gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);}
    catch(error){throw new Error(`Video FX could not read the source frame: ${error.message}`);}
    const uploadError=gl.getError();
    if(uploadError!==gl.NO_ERROR)throw new Error(`Video FX source upload failed (${uploadError}); no frame was captured.`);
  }
  function reset() {
    for(let i=0;i<2;i++)clearSlot(i);
    lastSource=null;lastAsset=undefined;lastURL="";
    lastDiagnostics={spectrum8Available:false,slots:[]};
    if(!disposed&&!lost){gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);}
  }
  const contextLost=event=>{event.preventDefault();lost=true;};
  canvas.addEventListener("webglcontextlost",contextLost);
  function render(source,specs=[],rawContext={}) {
    if(disposed)throw new Error("Independent Video FX renderer is disposed.");
    if(lost||gl.isContextLost())throw new Error("Video FX WebGL context was lost. Recreate the renderer before applying effects.");
    if(!source)throw new Error("Video FX needs an actual canvas, video or image source.");
    if(!Array.isArray(specs)||specs.length>2)throw new Error("Each independent Video FX renderer accepts at most two ordered slots.");
    const url=source.currentSrc || source.src || "";
    if(source!==lastSource || rawContext.assetId!==lastAsset || url!==lastURL) {
      reset();lastSource=source;lastAsset=rawContext.assetId;lastURL=url;
    }
    const context=normalizeVideoContext(rawContext);
    lastDiagnostics={spectrum8Available:context.spectrum8Available,slots:[]};
    upload(input,source);
    const hasBackground=!!rawContext.secondarySource;
    if(hasBackground)upload(background,rawContext.secondarySource);
    let current=input;
    for(let i=0;i<2;i++) {
      const spec=normalizeVideoSpec(specs[i]);
      const missing=spec?.name==='Analyzer' && spec.params.behavior!=='Earlier Open Play' && spec.value>0 && !context.spectrum8Available;
      lastDiagnostics.slots.push({slot:i,name:spec?.name??null,behavior:spec?.params.behavior??null,sourceBypass:!spec||spec.value===0||missing,reason:missing?'spectrum8-unavailable':null});
      if(!spec){clearSlot(i);continue;}
      const state=stateFor(i,spec.name), plan=planVideoEffectFrame(state,spec,context);
      if(plan.captureHold)draw(current,state.holdFramebuffer);
      if(plan.captureHistoryLayer!==null)draw(current,state.historyFramebuffers[plan.captureHistoryLayer],null,null,null,null,state.historyWidth,state.historyHeight);
      draw(current,work[i].framebuffer,spec,context,state,plan,width,height,hasBackground);
      current=work[i].texture;
    }
    draw(current,null);
    const error=gl.getError();if(error!==gl.NO_ERROR)throw new Error(`Independent Video FX WebGL processing failed (${error}).`);
    return canvas;
  }
  function readPixels() {
    if(disposed||lost)throw new Error("Video FX pixels are unavailable after disposal/context loss.");
    const pixels=new Uint8Array(width*height*4),result=new Uint8Array(pixels.length);
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
    const row=width*4;for(let y=0;y<height;y++)result.set(pixels.subarray(y*row,(y+1)*row),(height-1-y)*row);
    return result;
  }
  function dispose() {
    if(disposed)return;reset();disposed=true;
    canvas.removeEventListener("webglcontextlost",contextLost);
    for(const t of textures)gl.deleteTexture(t);for(const f of framebuffers)gl.deleteFramebuffer(f);
    textures.clear();framebuffers.clear();gl.deleteBuffer(buffer);gl.deleteProgram(program);
    // This renderer owns its private context; release its GPU allocation eagerly.
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
  return {canvas,render,readPixels,reset,dispose,capabilities:videoEffectCapabilities,
    diagnostics:()=>({spectrum8Available:lastDiagnostics.spectrum8Available,slots:lastDiagnostics.slots.map(slot=>({...slot})),disposed,lost})};
}
