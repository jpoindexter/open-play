// New prospective observer. Historical global-frame captures are never relabeled.
class CounterCapture extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [{name: 'frameTag', defaultValue: 0, minValue: 0, maxValue: 1e8, automationRate: 'a-rate'}]; }
  constructor({processorOptions}) {
    super(); this.sources = processorOptions.sources; this.armed = false; this.sequence = 0; this.frames = 0; this.nextFrame = null;
    this.port.onmessage = ({data}) => {
      if (data.type === 'arm') { this.armed = true; this.sequence = 0; this.frames = 0; this.nextFrame = null; }
      else if (data.type === 'stop') this.armed = false;
      this.port.postMessage({requestId: data.requestId, value: {frame: this.nextFrame, globalFrame: currentFrame, sequence: this.sequence, frames: this.frames, armed: this.armed}});
    };
    this.port.postMessage({type: 'ready'});
  }
  process(inputs, outputs, parameters) {
    for (const bus of outputs) for (const channel of bus) channel.fill(0);
    if (this.armed) {
      const frames = outputs[0][0].length, channels = [];
      if (this.nextFrame === null) {
        const anchor = Math.round(parameters.frameTag[0]);
        if (!Number.isSafeInteger(anchor) || anchor < 0 || anchor % 128 || Math.abs(anchor - parameters.frameTag[0]) > .25) { this.port.postMessage({type:'capture-error',error:'First armed callback is not on the declared ramp quantum'}); this.armed = false; return true; }
        this.nextFrame = anchor;
      }
      for (let source = 0; source < this.sources; source++) for (let c = 0; c < 2; c++) channels.push(Float32Array.from(inputs[source]?.[c] ?? new Float32Array(frames)));
      channels.push(Float32Array.from(inputs[this.sources]?.[0] ?? new Float32Array(frames)));
      channels.push(Float32Array.from({length: frames}, (_, i) => parameters.frameTag.length === 1 ? parameters.frameTag[0] : parameters.frameTag[i]));
      this.port.postMessage({type: 'pcm', sequence: this.sequence++, frame: this.nextFrame, globalFrame: currentFrame, globalTime: currentTime, frameSource: 'one-anchor-then-callback-counter', frames, channels}, channels.map(c => c.buffer));
      this.frames += frames; this.nextFrame += frames;
    }
    return true;
  }
}
registerProcessor('open-play-soundtouch-counter-capture', CounterCapture);
