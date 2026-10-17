class TransportCapture extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [{name: 'frameTag', defaultValue: 0, minValue: 0, maxValue: 1e8, automationRate: 'a-rate'}]; }
  constructor({processorOptions}) {
    super(); this.sources = processorOptions.sources; this.armed = false; this.sequence = 0; this.frames = 0;
    this.port.onmessage = ({data}) => {
      if (data.type === 'arm') { this.armed = true; this.sequence = 0; this.frames = 0; }
      else if (data.type === 'stop') this.armed = false;
      this.port.postMessage({requestId: data.requestId, value: {frame: currentFrame, sequence: this.sequence, frames: this.frames, armed: this.armed}});
    };
    this.port.postMessage({type: 'ready'});
  }
  process(inputs, outputs, parameters) {
    for (const bus of outputs) for (const channel of bus) channel.fill(0);
    if (this.armed) {
      const frames = outputs[0][0].length, channels = [];
      for (let source = 0; source < this.sources; source++) for (let c = 0; c < 2; c++) channels.push(Float32Array.from(inputs[source]?.[c] ?? new Float32Array(frames)));
      channels.push(Float32Array.from(inputs[this.sources]?.[0] ?? new Float32Array(frames)));
      channels.push(Float32Array.from({length: frames}, (_, i) => parameters.frameTag.length === 1 ? parameters.frameTag[0] : parameters.frameTag[i]));
      this.port.postMessage({type: 'pcm', sequence: this.sequence++, frame: currentFrame, frames, channels}, channels.map(c => c.buffer));
      this.frames += frames;
    }
    return true;
  }
}
registerProcessor('open-play-soundtouch-transport-capture', TransportCapture);
