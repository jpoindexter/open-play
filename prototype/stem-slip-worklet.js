import {StemSlipKernel} from './stem-slip-kernel.js';
class StemSlipProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.kernel = new StemSlipKernel(sampleRate);
    this.alive = true;
    this.sequence = 0;
    this.port.onmessage = ({data}) => {
      if (data.type === 'dispose') { this.alive = false; return; }
      if (data.type === 'buffers') {
        this.kernel.load(data.buffers, data.scale);
        if (data.rate !== undefined) this.kernel.command('rate', {rate: data.rate, bpm: data.bpm});
      }
      else this.kernel.command(data.type, data);
      this.port.postMessage({id: data.id, state: this.kernel.state()});
    };
  }
  process(_inputs, outputs) {
    if (!this.alive) return false;
    this.kernel.process(outputs, currentTime);
    if (++this.sequence % 8 === 0 || this.kernel.ended) {
      this.port.postMessage({state: this.kernel.state()});
      if (this.kernel.ended) this.kernel.ended = false;
    }
    return true;
  }
}
registerProcessor('open-play-stem-slip-v1', StemSlipProcessor);
