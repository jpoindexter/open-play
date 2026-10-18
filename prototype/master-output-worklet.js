import {MasterOutputKernel} from './master-output-kernel.js';
class MasterOutputProcessor extends AudioWorkletProcessor{
 constructor(){super();this.kernel=new MasterOutputKernel(sampleRate);this.next=Math.round(sampleRate*.05);this.port.postMessage({type:'ready'});}
 process(inputs,outputs){this.kernel.process(inputs[0]||[],outputs[0]||[]);if(this.kernel.frames>=this.next){this.port.postMessage({type:'meter',...this.kernel.snapshot(),at:(currentFrame+(outputs[0]?.[0]?.length||0))/sampleRate});this.kernel.reset();}return true;}
}
registerProcessor('open-play-master-output',MasterOutputProcessor);
