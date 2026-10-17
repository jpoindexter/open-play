// Prospective phase observer; original global labels are retained, never repaired.
import {PhaseRenderClock} from './phase-render-clock.mjs';
class PhaseCapture extends AudioWorkletProcessor {
 static get parameterDescriptors(){return[{name:'framePhase',defaultValue:-1,minValue:-1,maxValue:1,automationRate:'a-rate'}];}
 constructor({processorOptions}){
  super();this.sources=processorOptions.sources;this.armed=false;this.sequence=0;this.frames=0;this.clock=null;this.failed=false;
  this.port.onmessage=({data})=>{
   try{
    if(data.type==='configure-clock'){if(this.clock)throw Error('Observer clock already declared');this.clock=new PhaseRenderClock(data.clock);}
    else if(data.type==='arm'){if(!this.clock||this.clock.nextFrame===null)throw Error('Observer clock has not started');this.armed=true;this.sequence=0;this.frames=0;}
    else if(data.type==='stop')this.armed=false;else throw Error('Unknown observer command');
    this.port.postMessage({requestId:data.requestId,value:{frame:this.clock?.nextFrame,globalFrame:currentFrame,sequence:this.sequence,frames:this.frames,armed:this.armed,clock:this.clock?.snapshot()}});
   }catch(error){this.port.postMessage({requestId:data.requestId,error:{name:error.name,message:error.message}});}
  };
  this.port.postMessage({type:'ready'});
 }
 process(inputs,outputs,parameters){
  for(const channel of outputs[0])channel.fill(0);if(this.failed)return false;
  if(!this.clock)return true;
  try{
   const count=outputs[0][0].length,frame=this.clock.begin(parameters.framePhase,count,currentFrame);if(frame===null||!this.armed)return true;
   const channels=[];for(let s=0;s<this.sources;s++)for(let c=0;c<2;c++)channels.push(Float32Array.from(inputs[s]?.[c]??new Float32Array(count)));
   channels.push(Float32Array.from(inputs[this.sources]?.[0]??new Float32Array(count)));channels.push(Float32Array.from(parameters.framePhase));
   this.port.postMessage({type:'pcm',sequence:this.sequence++,frame,globalFrame:currentFrame,globalTime:currentTime,frameSource:'declared-anchor-integer-counter-checked-looping-phase',frames:count,channels},channels.map(c=>c.buffer));this.frames+=count;return true;
  }catch(error){this.failed=true;this.port.postMessage({type:'fatal',error:{name:error.name,message:error.message},globalFrame:currentFrame,clock:this.clock.snapshot()});return false;}
 }
}
registerProcessor('open-play-soundtouch-phase-capture',PhaseCapture);
