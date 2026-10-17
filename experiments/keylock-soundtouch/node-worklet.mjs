import {PhaseRenderClock} from './phase-render-clock.mjs';
import {SoundTouchNodeController} from './node-controller.mjs';
class WindowedSoundTouchProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [{name:'renderClock',defaultValue:-1,minValue:-1,maxValue:1,automationRate:'a-rate'}]; }
  constructor({processorOptions}) {
    super(); this.options = processorOptions; this.clock = new PhaseRenderClock({anchorFrame:processorOptions.anchorFrame,periodFrames:processorOptions.periodFrames}); this.controller = null; this.closed = false;
    this.port.onmessage = ({data}) => {
      const reply = (value, cause) => this.port.postMessage({id: data.id, value, error: cause && {name: cause.name, message: cause.message, stack: cause.stack}});
      try {
        if (data.type === 'dispose' && !this.controller) { this.closed = true; reply({disposed: true, beforeInitialization: true, retainedPCMBytes: 0}); return; }
        if (!this.controller || this.closed) throw Object.assign(new Error('No live windowed processor'), {name: 'InvalidStateError'});
        const {type, args = []} = data;
        if (!['addBuffers', 'dropBuffers', 'schedule', 'stop', 'snapshot', 'dispose'].includes(type)) throw new TypeError('Unknown processor operation');
        let value = this.controller[type](...args);
        if (type === 'snapshot' || type === 'dispose') value = {...value, renderClock: this.clock.snapshot()};
        if (type === 'dispose') this.closed = true;
        reply(value);
      } catch (cause) { reply(null, cause); }
    };
  }
  process(inputs, outputs, parameters) {
    for (const channel of outputs[0]) channel.fill(0);
    if (this.closed) return false;
    try {
      const frame = this.clock.begin(parameters.renderClock, outputs[0][0].length, currentFrame);
      if (frame === null) return true;
      if (!this.controller) {
        this.controller = new SoundTouchNodeController({...this.options, sampleRate, initialFrame: frame});
        this.port.postMessage({type: 'ready', frame, globalFrame: currentFrame, clock: this.clock.snapshot()});
      }
      const audio = this.controller.render(frame, outputs[0][0].length);
      if (audio.length !== outputs[0].length) throw new RangeError('Output channel geometry changed');
      audio.forEach((channel, c) => outputs[0][c].set(channel));
      return true;
    } catch (cause) {
      this.controller?.dispose(); this.closed = true;
      for (const channel of outputs[0]) channel.fill(0);
      this.port.postMessage({type: 'fatal', frame: currentFrame, error: {name: cause.name, message: cause.message, stack: cause.stack}, diagnostic: {currentFrame, currentTime, outputFrames: outputs[0][0].length, nextFrame: this.controller?.nextFrame, snapshot: this.controller?.snapshot(), clock: this.clock.snapshot()}});
      return false;
    }
  }
}
registerProcessor('open-play-windowed-soundtouch-experiment', WindowedSoundTouchProcessor);
