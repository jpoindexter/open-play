import { videoEffectByName } from "./video-effects-catalog.js";
import { normalizeSpectrum8 } from "./video-analysis.js";
export const clampVideo = (value, low = 0, high = 1) => Math.max(low, Math.min(high, value));
const finite = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
export function normalizeVideoContext(context = {}) {
  const bands = [context.bass, context.mid, context.treble].map(v => clampVideo(finite(v, 0)));
  let input;try{input=Object.getOwnPropertyDescriptor(context,'spectrum8')?.value;}catch{}
  const spectrum8=normalizeSpectrum8(input);
  return { time: finite(context.time, 0), bpm: clampVideo(finite(context.bpm, 120), 20, 400),
    spectrum8,spectrum8Available:spectrum8!==null,
    bands, level: clampVideo(finite(context.level, bands.reduce((a,b)=>a+b,0)/3)),
    upfader: clampVideo(finite(context.upfader, 1)), rate: clampVideo(finite(context.rate, 1), -4, 4),
    position: context.position === undefined ? undefined : finite(context.position, 0),
    frameId: context.frameId, reducedMotion: !!context.reducedMotion };
}
export function normalizeVideoSpec(spec) {
  if (!spec || spec.on === false || !spec.name || spec.name === "Off") return null;
  const definition = videoEffectByName.get(spec.name);
  if (!definition) throw new Error(`Unknown independent Video effect: ${spec.name}`);
  const params={ ...definition.default.params, ...spec.params };
  // Saved beat-timed pulses remain beat-timed, unless seconds is explicitly
  // supplied. This compatibility affects timing only; frames are never held.
  if(spec.name==="Frame Pulse" && spec.params?.periodBeats!==undefined && spec.params?.periodSeconds===undefined)
    delete params.periodSeconds;
  return { name: spec.name, id: definition.id,
    value: clampVideo(finite(spec.value, definition.default.value)),params };
}
export function createVideoEffectState(name) {
  return { name, holdCaptured: false, captureToken: undefined,holdActive:false,
    captureTime:undefined,holdExpired:false,freezeBehavior:undefined,
    historyTimes: Array(16).fill(null), nextLayer: 0, lastCaptureTime: -Infinity,
    lastTime: undefined, lastFrameId: undefined, recordPosition: 0,
    columns: [0,0,0], velocity: [0,0,0] };
}
export function videoHistoryLayers(times, time, spacing) {
  const available = times.map((at,layer)=>({at,layer})).filter(item=>item.at!==null);
  if (!available.length) return Array(16).fill(0);
  const oldest = available.reduce((a,b)=>a.at<b.at?a:b);
  return Array.from({length:16},(_,age)=>{
    const target = time-age*spacing;
    return available.filter(item=>item.at<=target+1e-8)
      .reduce((best,item)=>!best||item.at>best.at?item:best,null)?.layer ?? oldest.layer;
  });
}
export function planVideoEffectFrame(state, spec, context) {
  const time = context.time, params = spec.params;
  if (state.lastTime !== undefined && time < state.lastTime)
    Object.assign(state, createVideoEffectState(state.name));
  const duplicate = context.frameId !== undefined && context.frameId === state.lastFrameId;
  const dt = state.lastTime === undefined ? 1/60 : clampVideo(time-state.lastTime,0,.1);
  const plan = { captureHold: false, captureHistoryLayer: null, historyLayers: Array(16).fill(0) };
  if (state.name === "Frame Freeze") {
    const behavior=params.behavior === "Earlier Open Play" ? "Earlier Open Play" : "Manual Meaning";
    if(state.freezeBehavior !== behavior || spec.value <= 0){
      state.holdCaptured=false;state.captureToken=undefined;state.captureTime=undefined;state.holdExpired=false;state.holdActive=false;
    }
    state.freezeBehavior=behavior;
    if(spec.value > 0){
      if(!state.holdCaptured || !Object.is(state.captureToken,params.captureToken)){
        plan.captureHold=true;state.holdCaptured=true;state.captureToken=params.captureToken;state.captureTime=time;state.holdExpired=false;
      }
      const duration=clampVideo(finite(params.durationSeconds,1),.05,16);
      if(behavior === "Manual Meaning" && !state.holdExpired && time >= state.captureTime+duration)state.holdExpired=true;
      state.holdActive=behavior === "Earlier Open Play" || !state.holdExpired;
    }
  }
  if (state.name === "Delay Grid") {
    const seconds = clampVideo(finite(params.historySeconds,2),.25,4);
    if (!duplicate && time-state.lastCaptureTime >= seconds/16-1e-8) {
      plan.captureHistoryLayer = state.nextLayer;
      state.historyTimes[state.nextLayer] = time;
      state.nextLayer = (state.nextLayer+1)%16;
      state.lastCaptureTime = time;
    }
    plan.historyLayers = videoHistoryLayers(state.historyTimes,time,
      clampVideo(finite(params.delaySeconds,.125),.015625,4));
  }
  if (!duplicate) {
    const elapsed = state.lastTime === undefined ? time : time-state.lastTime;
    state.recordPosition = context.position ?? state.recordPosition + elapsed*context.rate;
    if (state.name === "Block Columns") {
      const steps = Math.max(1,Math.ceil(dt/.016)), step = dt/steps;
      for(let n=0;n<steps;n++)for(let i=0;i<3;i++) {
        state.velocity[i] += ((context.bands[i]-state.columns[i])*32-state.velocity[i]*10)*step;
        state.columns[i] = clampVideo(state.columns[i]+state.velocity[i]*step);
      }
    }
  }
  state.lastTime = time; state.lastFrameId = context.frameId;
  return plan;
}
export function videoEffectUniforms(spec,state,context) {
  const x=spec.params, n=(key,fallback,lo,hi)=>clampVideo(finite(x[key],fallback),lo,hi);
  switch(spec.name) {
    case "Filter": return [["Low Pass","High Pass","Band Pass"].indexOf(x.mode),n("radius",3,.1,24),0,0];
    case "Frame Freeze":return [state?.holdActive?1:0,n("durationSeconds",1,.05,16),0,x.behavior==="Earlier Open Play"?1:0];
    case "Isolator Bass":return [n("hue",0,0,360),n("width",.08,.001,.5),n("softness",.08,.001,.5),x.behavior==="Earlier Open Play"?1:0];
    case "Analyzer":return [n("hue",120,0,360),n("gain",1,0,4),context?.spectrum8Available===true?1:0,x.behavior==="Earlier Open Play"?1:0];
    case "Delay Grid":return [Math.round(n("columns",4,2,8)),0,0,0];
    case "Frame Pulse":return [x.periodSeconds===undefined?0:n("periodSeconds",1,.1,16),n("edgeWidth",.12,.005,.45),n("periodBeats",1,.125,16),0];
    case "Flash On BPM":return [n("periodBeats",1,.125,16),n("duty",.15,.02,.95),0,0];
    case "Split":return [Math.round(n("panels",5,2,12)),0,0,0];
    case "Record Rotate":return [n("turnsPerSecond",.25,-4,4),0,0,0];
    case "RGB Eq":return [n("red",1.3,0,3),n("green",1,0,3),n("blue",.7,0,3),0];
    case "CSL Eq":return [n("hue",45,-360,360),n("saturation",1.25,0,3),n("luminance",.04,-1,1),0];
    case "Brightness":return [n("exposure",1,0,2),0,0,0];
    case "Smudge":return [n("radiusPixels",24,0,96),n("edgeWidth",.25,.01,.45),n("angle",0,-360,360)*Math.PI/180,x.behavior==="Earlier Open Play"?1:0];
    case "Mirror":return [["Horizontal","Vertical","Both"].indexOf(x.axis),0,0,0];
    case "Kaleidoscope":return [Math.round(n("sectors",6,2,24)),n("angle",0,-360,360)*Math.PI/180,0,0];
    case "Saturation":return [n("saturation",2,0,3),0,0,0];
    case "Gamma":return [n("shadowPower",2,1,4),n("gamma",3,.1,8),0,x.behavior==="Earlier Open Play"?1:0];
    case "UV Paint":return [n("colorThreshold",.2,0,1),n("softness",.05,.001,.25),0,x.behavior==="Earlier Open Play"?1:0];
    case "Color Isolator":return [n("hue",0,0,360),n("width",.08,.001,.5),n("softness",.08,.001,.5),0];
    case "Anaglyph 3D":return [n("pixels",12,0,64),0,0,0];
    case "Luma Key Black":case "Luma Key White":return [n("softness",.04,.001,.25),0,0,0];
    case "Chroma Key Green":return [n("softness",.04,.001,.25),n("spill",.5,0,1),0,0];
    case "Rotate":return [n("angle",90,-360,360),0,0,0];
    case "Zoom":return [n("scale",4,.25,8),n("centerX",.5,0,1),n("centerY",.5,0,1),0];
    case "Tile":return [Math.round(n("tiles",5,2,12)),0,0,0];
    default:return [0,0,0,0];
  }
}
