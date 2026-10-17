// Diagnostic baseline: no SoundTouch/core/PCM processing or imports.
class BareClockProbe extends AudioWorkletProcessor {
 constructor(){super();this.closed=false;this.last=null;this.sequence=0;this.port.onmessage=({data})=>{if(data.type==='dispose'){this.closed=true;this.port.postMessage({type:'disposed'});}};}
 process(inputs,outputs){for(const c of outputs[0])c.fill(0);if(this.closed)return false;
  if(this.last===null)this.port.postMessage({type:'ready',frame:currentFrame});
  else if(currentFrame!==this.last+128)this.port.postMessage({type:'clock-anomaly',previous:this.last,frame:currentFrame,currentTime,sampleRate,sequence:this.sequence});
  this.last=currentFrame;this.sequence++;return true;}
}
registerProcessor('open-play-bare-clock-probe',BareClockProbe);
