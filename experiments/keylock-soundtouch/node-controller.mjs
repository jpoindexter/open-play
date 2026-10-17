import {WindowPCMSource} from './window-source.mjs';
import {SoundTouchTransport} from './pull-transport.mjs';
const fail = (name, message) => { throw Object.assign(new Error(message), {name}); };

// The exact controller used by the experimental worklet, also exercised with
// real DSP in serial tests. All seconds use a FIXED node origin.
export class SoundTouchNodeController {
  constructor({sampleRate, durationFrames, channels, initialFrame}) {
    this.sampleRate = sampleRate; this.closed = false;
    this.store = new WindowPCMSource({sampleRate, durationFrames, channelCounts: [channels], maxRetainedFrames: Math.floor(sampleRate * 11)});
    this.transport = new SoundTouchTransport({sampleRate, store: this.store, initialFrame});
  }
  get nextFrame() { return this.transport.nextFrame; }
  get addedEnd() { return this.store.endFrame / this.sampleRate; }
  assertOpen() { if (this.closed) fail('InvalidStateError', 'SoundTouch node is disposed'); }
  outputFrame(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0 || !Number.isSafeInteger(Math.round(seconds * this.sampleRate))) throw new RangeError('Invalid context output time');
    return Math.round(seconds * this.sampleRate);
  }
  addBuffers(channels) { this.assertOpen(); this.store.append({startFrame: this.store.endFrame, buffers: [channels]}); return this.addedEnd; }
  dropBuffers(beforeSeconds) {
    this.assertOpen(); this.outputFrame(beforeSeconds);
    const epochs = this.transport.snapshot().epochs;
    const protectedFrame = Math.min(...epochs.flatMap(epoch => epoch.counters.map(pipe => pipe.sourceCursorFrame)));
    const extent = this.store.dropBefore(Math.round(beforeSeconds * this.sampleRate), {protectedFrame});
    return {start: extent.startFrame / this.sampleRate, end: extent.endFrame / this.sampleRate};
  }
  schedule({active, input, output, rate, semitones}) {
    this.assertOpen(); let frame = this.outputFrame(output);
    if (active && frame < this.nextFrame + 256) fail('LateScheduleError', 'Active output requires at least two unrendered quanta');
    // A pause may be requested at currentTime after that quantum was rendered.
    // Apply at the first unrendered frame; the outer adapter already mutes gain.
    if (!active) frame = Math.max(frame, this.nextFrame);
    return this.transport.schedule({type: active ? 'start' : 'pause', frame, position: input, rate, semitones, keylock: true});
  }
  stop(output) { this.assertOpen(); return this.transport.schedule({type: 'pause', frame: Math.max(this.nextFrame, this.outputFrame(output))}); }
  render(frame, count = 128) { return this.transport.render(frame, count)[0]; }
  snapshot() { return {disposed: this.closed, store: this.store.snapshot(), transport: this.transport.snapshot()}; }
  dispose() {
    if (!this.closed) { this.transport.dispose(); this.store.dispose(); this.closed = true; }
    return this.snapshot();
  }
}
