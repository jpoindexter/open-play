// Test-only continuous finite/gap telemetry; silent output, bounded per-second state.
class SoakMeter extends AudioWorkletProcessor{
 constructor(){super();this.frames=0;this.nonfinite=0;this.peak=0;this.power=0;this.zeros=0;this.longestZero=0;this.previous=0;this.step=0;}
 process(inputs,outputs){
  for(const output of outputs)for(const channel of output)channel.fill(0);
  const a=inputs[0]?.[0];if(!a)return true;
  for(const v of a){if(!Number.isFinite(v))this.nonfinite++;this.peak=Math.max(this.peak,Math.abs(v));this.power+=v*v;this.step=Math.max(this.step,Math.abs(v-this.previous));this.previous=v;this.zeros=v===0?this.zeros+1:0;this.longestZero=Math.max(this.longestZero,this.zeros);}
  this.frames+=a.length;
  if(this.frames>=sampleRate){this.port.postMessage({frame:currentFrame,frames:this.frames,nonfinite:this.nonfinite,peak:this.peak,rms:Math.sqrt(this.power/this.frames),longestZero:this.longestZero,maxSampleStep:this.step});this.frames=0;this.nonfinite=0;this.peak=0;this.power=0;this.longestZero=this.zeros;this.step=0;}
  return true;
 }
}
registerProcessor('open-play-soak-meter',SoakMeter);
