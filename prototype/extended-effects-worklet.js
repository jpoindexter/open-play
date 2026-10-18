import { ExtendedEffectKernel } from "./extended-effects-kernel.js";
import {LPFKernel} from './lpf-kernel.js';
class ExtendedEffectsProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const p = options.processorOptions;
    this.kernel = new ExtendedEffectKernel(p.spec, sampleRate, p.bpm);
    this.alive = true;
    this.port.onmessage = (e) => {
      if (e.data?.type === "dispose") this.alive = false;
      if (e.data?.type === "update")
        this.kernel.update(e.data.spec, e.data.bpm);
    };
  }
  process(inputs, outputs) {
    if (!this.alive) return false;
    const output = outputs[0];
    if (!output?.length) return true;
    const input = inputs[0] || [];
    if (!this.zero || this.zero.length !== output[0].length)
      this.zero = new Float32Array(output[0].length);
    const zero = this.zero;
    this.kernel.process(
      input[0] || zero,
      input[1] || input[0] || zero,
      output[0],
      output[1] || output[0],
    );
    return true;
  }
}
registerProcessor("open-play-extended-effect-v1", ExtendedEffectsProcessor);

class LPFProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors(){return[
    {name:'cutoff',defaultValue:1000,minValue:20,maxValue:20000,automationRate:'a-rate'},
    {name:'resonance',defaultValue:1.77,minValue:.1,maxValue:12,automationRate:'a-rate'},
    {name:'slope',defaultValue:24,minValue:6,maxValue:48,automationRate:'k-rate'},
  ];}
  constructor(){super();this.kernel=new LPFKernel(sampleRate);this.alive=true;this.port.onmessage=e=>{if(e.data?.type==='dispose')this.alive=false;};}
  process(inputs,outputs,parameters){
    if(!this.alive)return false;
    if(outputs[0]?.length)this.kernel.process(inputs[0]||[],outputs[0],parameters.cutoff,parameters.resonance,parameters.slope);
    return true;
  }
}
registerProcessor('open-play-stateful-lpf-v1',LPFProcessor);
