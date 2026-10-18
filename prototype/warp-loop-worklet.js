import {WarpLoopKernel} from './warp-loop-kernel.js';
class WarpLoopProcessor extends AudioWorkletProcessor{
 constructor(){super();this.kernel=new WarpLoopKernel(sampleRate);this.port.onmessage=({data})=>{try{let result;if(data.type==='load')this.kernel.load(data.buffers);else if(data.type==='start')result=this.kernel.start(data.options);else if(data.type==='dispose')this.kernel.alive=false;else throw Error('Unknown warp-loop command.');if(data.id)this.port.postMessage({id:data.id,result});}catch(error){this.port.postMessage({id:data.id,error:{name:error.name,message:error.message}});}};}
 process(_inputs,outputs){try{const alive=this.kernel.process(outputs,currentTime);if(this.kernel.endedFrame!==null&&this.kernel.endedFrame!==undefined&&this.sentEnd!==this.kernel.endedFrame){this.sentEnd=this.kernel.endedFrame;this.port.postMessage({type:'ended',frame:this.sentEnd});}return alive;}catch(error){for(const output of outputs)for(const channel of output)channel.fill(0);this.port.postMessage({error:{name:error.name,message:error.message}});return false;}}
}
registerProcessor('open-play-warp-loop-v1',WarpLoopProcessor);
