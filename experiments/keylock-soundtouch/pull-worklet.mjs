import {SoundTouchTransport} from './pull-transport.mjs';

class PullWorklet extends AudioWorkletProcessor {
  constructor() {
    super(); this.transport = null; this.pendingLoad = null; this.closed = false; this.blocks = 0;
    this.port.onmessage = ({data}) => {
      const reply = (value, failure) => this.port.postMessage({requestId: data.requestId, value, error: failure});
      try {
        if (data.type === 'load') {
          if (this.transport || this.pendingLoad) throw new Error('An owned transport is already loaded');
          if (data.sampleRate !== sampleRate) throw new Error('Source/context sample rate mismatch');
          this.pendingLoad = data; return;
        }
        if (!this.transport || this.closed) throw new Error('No live transport');
        if (data.type === 'commands') {
          const acks = data.commands.map(command => this.transport.schedule(command));
          reply({acks, snapshot: this.transport.snapshot(), processorFrame: currentFrame}); return;
        }
        if (data.type === 'snapshot') { reply(this.transport.snapshot()); return; }
        if (data.type === 'dispose') { const snapshot = this.transport.dispose(); this.closed = true; reply(snapshot); return; }
        throw new Error('Unknown worklet request');
      } catch (cause) { reply(null, {name: cause.name, message: cause.message, stack: cause.stack}); }
    };
  }
  process(inputs, outputs) {
    for (const bus of outputs) for (const channel of bus) channel.fill(0);
    if (this.closed) return false;
    try {
      if (this.pendingLoad) {
        const data = this.pendingLoad; this.pendingLoad = null;
        this.transport = new SoundTouchTransport({sampleRate, buffers: data.buffers, initialFrame: currentFrame});
        this.port.postMessage({requestId: data.requestId, value: {loaded: true, frame: currentFrame, sourceBytes: this.transport.sourceBytes}});
      }
      if (this.transport) {
        const result = this.transport.render(currentFrame, outputs[0][0].length);
        if (result.length !== outputs.length) throw new Error('Output group geometry mismatch');
        result.forEach((source, s) => source.forEach((channel, c) => outputs[s][c].set(channel)));
        if (++this.blocks % 128 === 0) this.port.postMessage({type: 'snapshot', processorFrame: currentFrame, snapshot: this.transport.snapshot()});
      }
      return true;
    } catch (cause) {
      this.transport?.dispose(); this.closed = true;
      for (const bus of outputs) for (const channel of bus) channel.fill(0);
      this.port.postMessage({type: 'fatal', frame: currentFrame, error: {name: cause.name, message: cause.message, stack: cause.stack}});
      return false;
    }
  }
}
registerProcessor('open-play-soundtouch-pull-experiment', PullWorklet);
