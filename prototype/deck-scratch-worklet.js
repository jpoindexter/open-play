import {DeckScratchKernel} from './deck-scratch-kernel.js';
class DeckScratchProcessor extends AudioWorkletProcessor{
  constructor(options={}){
    super();this.kernel=new DeckScratchKernel(sampleRate,options.processorOptions||{});this.sequence=0;
    this.port.onmessage=({data})=>{
      try{
        // A disconnected/suspended node may receive commands before its first
        // process quantum. Gesture watchdogs use the observed host audio clock.
        this.kernel.audioTime=Math.max(this.kernel.audioTime,currentTime);
        const state=data.type==='buffers'?this.kernel.load(data):this.kernel.command(data.type,data);
        if(data.id)this.port.postMessage({id:data.id,state});
      }catch(error){this.port.postMessage({id:data.id,error:{name:error.name,message:error.message},state:this.kernel.state()});}
    };
  }
  process(_inputs,outputs){
    const alive=this.kernel.process(outputs,currentTime);
    if(alive&&++this.sequence%8===0)this.port.postMessage({state:this.kernel.state()});
    return alive;
  }
}
registerProcessor('open-play-deck-scratch-v1',DeckScratchProcessor);
