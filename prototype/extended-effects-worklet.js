import { ExtendedEffectKernel } from "./extended-effects-kernel.js";
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
