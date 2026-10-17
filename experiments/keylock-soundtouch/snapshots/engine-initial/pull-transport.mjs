// Independent experimental transport around the unmodified pinned public DSP.
// Position is explicitly NOMINAL. WSOLA output does not identify a unique source
// sample; real captured cursor/latency/music/native acceptance remains separate.
import {FixedPCMSource} from './window-source.mjs';
import SoundTouch from '../../local-evidence/keylock-soundtouch-source/node_modules/@soundtouchjs/core/.dist/SoundTouch.js';

const error = (name, message) => Object.assign(new Error(message), {name});
const integer = (value, name) => {
  if (!Number.isSafeInteger(value) || value < 0) throw new RangeError(name + ' must be a nonnegative safe integer');
  return value;
};
const finite = (value, name) => {
  if (!Number.isFinite(value)) throw new TypeError(name + ' must be finite');
  return value;
};
function parameters(state) {
  const rate = finite(state.rate, 'rate'), semitones = finite(state.semitones, 'semitones');
  if (rate < .25 || rate > 4 || Math.abs(semitones) > 24) throw new RangeError('Rate .25..4 and requested pitch ±24 are required');
  const keylock = !!state.keylock;
  const effectiveSemitones = semitones + (keylock ? 0 : 12 * Math.log2(rate));
  if (Math.abs(effectiveSemitones) > 24) throw new RangeError('Effective pitch must stay within ±24 semitones');
  return {rate, semitones, keylock, effectiveSemitones};
}

class PullPipe {
  constructor(store, sourceIndex, channelOffset, sampleRate, originalFrames, position, state) {
    this.store = store; this.sourceIndex = sourceIndex; this.channelOffset = channelOffset;
    this.sampleRate = sampleRate;
    this.originalFrames = originalFrames;
    this.pipe = new SoundTouch({sampleRate, interpolationStrategy: 'lanczos'});
    // Setting pitch rewrites tempo and stage order. Set the explicit tempo LAST.
    this.pipe.pitchSemitones = state.effectiveSemitones;
    const pitchFactor = 2 ** (state.effectiveSemitones / 12);
    this.pipe.stretch.tempo = state.rate / pitchFactor;
    this.origin = Math.max(0, Math.floor((position - .25) * sampleRate));
    this.cursor = this.origin;
    this.input = new Float32Array(2048);
    this.realFramesFed = 0;
    this.paddingFramesFed = 0;
    this.generatedFrames = 0;
    this.extractedFrames = 0;
    this.discardedPrerollFrames = 0;
    this.paddingLimit = Math.ceil(Math.max(sampleRate * 2,
      (this.pipe.stretch.sampleReq + this.pipe.stretch.overlapLength) * Math.max(1, pitchFactor) * 4 + 8192));
    const discard = Math.round((position * sampleRate - this.origin) / state.rate);
    let left = discard;
    while (left > 0) {
      const count = Math.min(left, 128);
      this.read(count); this.discardedPrerollFrames += count; left -= count;
    }
    this.ensure(128); // Actual output is present before the command can commit.
  }
  ensure(frames) {
    let iterations = 0;
    while (this.pipe.outputBuffer.frameCount < frames) {
      if (++iterations > 1024) throw error('ProcessingBoundError', 'DSP exceeded a bounded output-pull iteration count');
      const count = 1024;
      this.input.fill(0);
      const real = Math.max(0, Math.min(count, this.originalFrames - this.cursor));
      this.store.readStereo(this.sourceIndex, this.channelOffset, this.cursor, count, this.input);
      this.realFramesFed += real;
      this.paddingFramesFed += count - real;
      if (this.paddingFramesFed > this.paddingLimit)
        throw error('EndPaddingBoundError', 'DSP could not produce requested output within the declared padding bound');
      this.pipe.inputBuffer.putSamples(this.input, 0, count);
      this.cursor += count;
      const before = this.pipe.outputBuffer.frameCount;
      this.pipe.process();
      this.generatedFrames += this.pipe.outputBuffer.frameCount - before;
    }
  }
  read(frames) {
    this.ensure(frames);
    const result = new Float32Array(frames * 2);
    const got = this.pipe.outputBuffer.extract(result, 0, frames, true);
    if (got !== frames) throw error('UnderrunError', 'Prepared DSP output was shorter than the requested pull');
    for (const value of result) if (!Number.isFinite(value)) throw error('NonFiniteAudioError', 'DSP emitted nonfinite audio');
    this.extractedFrames += frames;
    return result;
  }
  snapshot() {
    return {originFrame: this.origin, sourceCursorFrame: this.cursor, realFramesFed: this.realFramesFed,
      paddingFramesFed: this.paddingFramesFed, paddingLimit: this.paddingLimit, generatedFrames: this.generatedFrames,
      extractedFrames: this.extractedFrames, discardedPrerollFrames: this.discardedPrerollFrames,
      outputFramesReady: this.pipe.outputBuffer.frameCount};
  }
  dispose() {
    // Do not reuse clear(): the default circular adapter retains staged input.
    this.pipe = null; this.store = null; this.input = null;
  }
}

export class SoundTouchTransport {
  constructor({sampleRate, buffers, store, initialFrame = 0, crossfadeSeconds = .01} = {}) {
    finite(sampleRate, 'sampleRate'); if (sampleRate <= 0) throw new RangeError('Positive sampleRate required');
    integer(initialFrame, 'initialFrame');
    if (store && buffers) throw new TypeError('Supply either a bounded store or whole buffers');
    this.externalStore = !!store;
    if (store) {
      if (store.sampleRate !== sampleRate || !Number.isSafeInteger(store.durationFrames) || store.durationFrames < 1 ||
        !Array.isArray(store.channelCounts) || ![1, 5].includes(store.channelCounts.length) ||
        store.channelCounts.some(n => !Number.isInteger(n) || n < 1 || n > 8) ||
        typeof store.readStereo !== 'function' || typeof store.snapshot !== 'function') throw new TypeError('Invalid PCM store');
      this.store = store; this.buffers = [];
      this.originalFrames = store.durationFrames;
      this.channelCounts = [...store.channelCounts];
    } else {
      if (!Array.isArray(buffers) || ![1, 5].includes(buffers.length)) throw new RangeError('Supply original alone or original plus four stems');
      this.buffers = buffers.map(channels => {
        if (!Array.isArray(channels) || channels.length < 1 || channels.length > 8) throw new RangeError('Source channel policy is1..8');
        const frames = channels[0]?.length;
        if (!Number.isSafeInteger(frames) || frames < 1 || channels.some(c => !(c instanceof Float32Array) || c.length !== frames))
          throw new TypeError('Each source requires equally sized Float32Array channels');
        for (const channel of channels) for (const value of channel) if (!Number.isFinite(value)) throw new TypeError('Nonfinite source input');
        // Freeze source identity/geometry, while borrowing the actual PCM as
        // immutable data. The AudioWorklet wrapper owns transferred PCM storage.
        return [...channels];
      });
      this.originalFrames = this.buffers[0][0].length;
      if (this.buffers.slice(1).some(c => Math.abs(c[0].length - this.originalFrames) > sampleRate * .1 + 1))
        throw new RangeError('Stem durations must remain within0.1s of the original');
      this.store = new FixedPCMSource(sampleRate, this.buffers);
      this.channelCounts = this.buffers.map(c => c.length);
    }
    this.sampleRate = sampleRate; this.duration = this.originalFrames / sampleRate;
    this.nextFrame = initialFrame; this.generation = 0; this.queue = []; this.voices = [];
    this.history = [{frame: initialFrame, position: 0, playing: false, ...parameters({rate: 1, semitones: 0, keylock: true})}];
    finite(crossfadeSeconds, 'crossfadeSeconds');
    if (crossfadeSeconds < 0 || crossfadeSeconds > .1) throw new RangeError('Crossfade must be0..0.1s');
    this.fadeFrames = Math.round(crossfadeSeconds * sampleRate);
    this.disposed = false; this.retiredEpochs = 0; this.retiredSummaries = []; this.renderedFrames = 0;

  }
  stateAt(frame) {
    integer(frame, 'frame');
    if (frame < this.history[0].frame) throw new RangeError('Requested frame predates retained clock anchors');
    let segment = this.history[0];
    for (const next of [...this.history.slice(1), ...this.queue.map(q => q.state)]) {
      if (next.frame > frame) break;
      segment = next;
    }
    const position = Math.min(this.duration, segment.position + (segment.playing ? Math.max(0, frame - segment.frame) / this.sampleRate * segment.rate : 0));
    return {...segment, anchorPosition: segment.position, position, playing: segment.playing && position < this.duration, positionKind: 'nominal-not-measured-audible'};
  }
  prepareEpoch(position, state, generation) {
    const pipes = [], mapping = [];
    try {
      for (let source = 0; source < this.channelCounts.length; source++) for (let c = 0; c < this.channelCounts[source]; c += 2) {
        pipes.push(new PullPipe(this.store, source, c, this.sampleRate, this.originalFrames, position, state));
        mapping.push({source, channel: c});
      }
      return {generation, pipes, mapping, startFrame: 0, endFrame: Infinity, startGain: 1, endGain: 1};
    } catch (cause) { pipes.forEach(p => p.dispose()); throw cause; }
  }
  schedule(command) {
    if (this.disposed) throw error('InvalidStateError', 'Disposed transport cannot schedule');
    if (!['start', 'update', 'seek', 'pause'].includes(command?.type)) throw new TypeError('Unknown transport command');
    const frame = integer(command.frame ?? this.nextFrame + 256, 'frame');
    if (frame < this.nextFrame) throw error('LateScheduleError', 'Requested output frame is already rendered');
    const kept = this.queue.filter(q => q.state.frame < frame);
    if (kept.length >= 8 || this.voices.length + kept.filter(q => q.epoch).length >= 16)
      throw error('QueueBoundError', 'Too many pending or crossfading epochs');
    // New commands supersede later pending commands. Derive inheritance only
    // from the history that survives, not the very future state being discarded.
    const future = this.queue; this.queue = kept;
    let previous;
    try { previous = this.stateAt(frame); } finally { this.queue = future; }
    const normalized = parameters({rate: command.rate ?? previous.rate, semitones: command.semitones ?? previous.semitones,
      keylock: command.keylock ?? previous.keylock});
    const position = finite(command.position ?? previous.position, 'position');
    if (position < 0 || position > this.duration) throw new RangeError('Position outside original duration');
    const playing = command.type === 'start' ? position < this.duration : command.type === 'pause' ? false : previous.playing && position < this.duration;
    const generation = this.generation + 1;
    const state = {frame, position, playing, generation, ...normalized};
    const started = globalThis.performance?.now?.() ?? null;
    const epoch = playing ? this.prepareEpoch(position, state, generation) : null;
    const superseded = future.filter(q => q.state.frame >= frame);
    superseded.forEach(q => this.retireEpoch(q.epoch));
    this.queue = [...kept, {state, epoch}]; this.generation = generation;
    const finished = globalThis.performance?.now?.() ?? null;
    return {...state, ready: true, generation, superseded: superseded.map(q => q.state.generation),
      preparationMilliseconds: started === null || finished === null ? null : finished - started,
      preparationClock: started === null || finished === null ? 'unavailable' : 'performance.now',
      positionKind: 'nominal-not-measured-audible',
      counters: epoch?.pipes.map(p => p.snapshot()) ?? []};
  }
  gain(voice, frame) {
    if (voice.startFrame === voice.endFrame) return voice.endGain;
    const fraction = Math.max(0, Math.min(1, (frame - voice.startFrame) / (voice.endFrame - voice.startFrame)));
    return voice.startGain + (voice.endGain - voice.startGain) * fraction;
  }
  retireEpoch(epoch) {
    if (!epoch || epoch.retired) return;
    this.retiredSummaries.push({generation: epoch.generation, counters: epoch.pipes.map(p => p.snapshot())});
    if (this.retiredSummaries.length > 64) this.retiredSummaries.shift();
    epoch.pipes.forEach(p => p.dispose()); epoch.pipes = []; epoch.mapping = []; epoch.retired = true; this.retiredEpochs++;
  }
  apply(next) {
    const {state, epoch} = next;
    this.history = [this.history.at(-1), state];
    if (!state.playing) { this.voices.forEach(v => this.retireEpoch(v)); this.voices = []; return; }
    for (const voice of this.voices) {
      const gain = this.gain(voice, state.frame);
      voice.startFrame = state.frame; voice.endFrame = state.frame + this.fadeFrames; voice.startGain = gain; voice.endGain = 0;
    }
    epoch.startFrame = state.frame; epoch.endFrame = state.frame + this.fadeFrames;
    epoch.startGain = this.voices.length ? 0 : 1; epoch.endGain = 1; this.voices.push(epoch);
  }
  render(frame, frames = 128) {
    integer(frame, 'frame'); integer(frames, 'frames');
    if (frames < 1 || frames > 128 || frame !== this.nextFrame) throw error('RenderClockError', 'Render must be contiguous, with1..128frames');
    const output = this.channelCounts.map(n => Array.from({length: n}, () => new Float32Array(frames)));
    if (this.disposed) { this.nextFrame += frames; return output; }
    let at = frame;
    while (at < frame + frames) {
      while (this.queue[0]?.state.frame === at) this.apply(this.queue.shift());
      const current = this.stateAt(at);
      if (!current.playing && current.position >= this.duration) {
        this.voices.forEach(v => this.retireEpoch(v)); this.voices = [];
      }
      let end = Math.min(frame + frames, this.queue[0]?.state.frame ?? Infinity);
      if (current.playing) end = Math.min(end, Math.max(at + 1,
        current.frame + Math.ceil((this.duration - current.anchorPosition) / current.rate * this.sampleRate)));
      const count = end - at;
      for (const voice of this.voices) {
        if (voice.endGain === 0 && at >= voice.endFrame) continue;
        voice.pipes.forEach((pipe, p) => {
          const samples = pipe.read(count), map = voice.mapping[p];
          for (let i = 0; i < count; i++) {
            const gain = this.gain(voice, at + i);
            for (let c = 0; c < 2 && map.channel + c < this.channelCounts[map.source]; c++)
              output[map.source][map.channel + c][at - frame + i] += gain * samples[i * 2 + c];
          }
        });
      }
      at = end;
      this.voices = this.voices.filter(v => { if (v.endGain === 0 && at >= v.endFrame) { this.retireEpoch(v); return false; } return true; });
    }
    this.nextFrame += frames; this.renderedFrames += frames;
    return output;
  }
  snapshot() {
    const pending = this.queue.filter(q => q.epoch).map(q => ({...q.epoch, role: 'pending'}));
    return {sampleRate: this.sampleRate, nextFrame: this.nextFrame, generation: this.generation,
      disposed: this.disposed, state: this.stateAt(this.nextFrame), sourceBytes: this.disposed ? 0 : this.store.snapshot().retainedPCMBytes,
      retainedWholeSources: !this.disposed && !this.externalStore, memoryLimit: this.externalStore ? 'Caller-bounded PCM window plus bounded16epochs; opaque DSP heaps not counted.' : 'Whole caller-provided PCM plus bounded16epochs; opaque DSP heaps not counted.',
      pcmOwnership: 'Descriptors are snapshotted; PCM arrays are borrowed immutable data for the transport lifetime. The worklet owns transferred storage.',
      renderedFrames: this.renderedFrames, retiredEpochs: this.retiredEpochs,
      retiredSummaries: this.retiredSummaries, retiredSummaryLimit: 64, clockRetention: 'Last two applied anchors; older queries reject explicitly.',
      epochs: [...this.voices.map(v => ({...v, role: 'active-or-retiring'})), ...pending].map(v => ({generation: v.generation, role: v.role, counters: v.pipes.map(p => p.snapshot())})),
      scope: 'Forward pull-based experiment; nominal output endpoint, not measured audible source position or proved EOS tail preservation.'};
  }
  dispose() {
    if (this.disposed) return this.snapshot();
    const state = this.stateAt(this.nextFrame);
    this.voices.forEach(v => this.retireEpoch(v)); this.queue.forEach(q => this.retireEpoch(q.epoch));
    this.voices = []; this.queue = []; this.buffers = []; this.disposed = true;
    if (!this.externalStore) this.store.dispose();
    this.store = null;
    this.history = [{...state, frame: this.nextFrame, playing: false}];
    return this.snapshot();
  }
}
