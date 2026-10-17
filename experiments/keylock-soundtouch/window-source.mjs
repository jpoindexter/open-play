// PCM ownership for the independent SoundTouch experiment. No DSP changes.
const fail = (name, message) => { throw Object.assign(new Error(message), {name}); };
const frame = (n, name) => {
  if (!Number.isSafeInteger(n) || n < 0) throw new RangeError(`${name} must be a nonnegative safe integer`);
  return n;
};
function geometry({sampleRate, durationFrames, channelCounts}) {
  if (!Number.isFinite(sampleRate) || sampleRate <= 0) throw new RangeError('Positive sample rate required');
  frame(durationFrames, 'durationFrames');
  if (!durationFrames || !Array.isArray(channelCounts) || ![1, 5].includes(channelCounts.length) ||
    channelCounts.some(n => !Number.isInteger(n) || n < 1 || n > 8)) throw new RangeError('Original alone or original plus four sources with 1..8 channels required');
  return Object.freeze({sampleRate, durationFrames, channelCounts: Object.freeze([...channelCounts])});
}
function readArguments(g, source, channel, start, count, target) {
  frame(source, 'source'); frame(channel, 'channel'); frame(start, 'start'); frame(count, 'count');
  if (source >= g.channelCounts.length || channel >= g.channelCounts[source]) throw new RangeError('Source/channel outside geometry');
  if (!(target instanceof Float32Array) || target.length < count * 2 || !Number.isSafeInteger(start + count)) throw new RangeError('Invalid destination or read extent');
}

export class WindowPCMSource {
  #g; #chunks = []; #start = 0; #end = 0; #closed = false; #limit; #bytes = 0;
  constructor(options) {
    this.#g = geometry(options); this.#limit = frame(options.maxRetainedFrames, 'maxRetainedFrames');
    if (!this.#limit) throw new RangeError('Positive retained window required');
  }
  get sampleRate() { return this.#g.sampleRate; }
  get durationFrames() { return this.#g.durationFrames; }
  get channelCounts() { return this.#g.channelCounts; }
  get startFrame() { return this.#start; }
  get endFrame() { return this.#end; }
  #open() { if (this.#closed) fail('InvalidStateError', 'PCM source is disposed'); }
  append({startFrame, buffers} = {}) {
    this.#open(); frame(startFrame, 'startFrame');
    if (startFrame !== this.#end) fail('CoverageError', 'Append must continue the fixed source timeline without gaps or overwrite');
    if (!Array.isArray(buffers) || buffers.length !== this.channelCounts.length) throw new RangeError('Source count changed');
    const count = buffers[0]?.[0]?.length;
    if (!Number.isSafeInteger(count) || count < 1 || count > Math.floor(this.sampleRate / 2) || this.#end + count > this.durationFrames) throw new RangeError('Chunk must contain 1..half-second frames within the original duration');
    const owned = buffers.map((channels, source) => {
      if (!Array.isArray(channels) || channels.length !== this.channelCounts[source]) throw new RangeError('Channel geometry changed');
      for (const channel of channels) {
        if (!(channel instanceof Float32Array) || channel.length !== count || channel.byteOffset !== 0 || channel.byteLength !== channel.buffer.byteLength)
          throw new TypeError('Each channel must own a full, equally sized Float32Array backing buffer');
        for (const value of channel) if (!Number.isFinite(value)) throw new TypeError('Nonfinite PCM');
      }
      return [...channels];
    });
    if (this.#end + count - this.#start > this.#limit) fail('QuotaExceededError', 'Retained PCM window is full');
    const bytes = owned.reduce((sum, channels) => sum + channels.reduce((n, c) => n + c.byteLength, 0), 0);
    this.#chunks.push({start: this.#end, end: this.#end + count, buffers: owned, bytes});
    this.#end += count; this.#bytes += bytes;
    return {startFrame: this.#start, endFrame: this.#end};
  }
  dropBefore(before, {protectedFrame = Infinity} = {}) {
    this.#open(); if (!Number.isFinite(before) || before < 0 || !(protectedFrame >= 0)) throw new RangeError('Invalid drop boundary');
    let count = 0;
    while (count < this.#chunks.length && this.#chunks[count].end <= before) count++;
    const start = count ? this.#chunks[count - 1].end : this.#start;
    if (start > protectedFrame) fail('InUseError', 'Drop would remove PCM still required by a prepared epoch');
    for (let i = 0; i < count; i++) this.#bytes -= this.#chunks[i].bytes;
    this.#chunks.splice(0, count); this.#start = start;
    return {startFrame: this.#start, endFrame: this.#end};
  }
  readStereo(source, channel, start, count, target) {
    this.#open(); readArguments(this.#g, source, channel, start, count, target);
    const realEnd = Math.min(this.durationFrames, start + count);
    // Validate the WHOLE real range before touching the destination. Only the
    // declared file endpoint permits zeros; missing future/history is an error.
    if (start < realEnd && (start < this.#start || realEnd > this.#end)) fail('CoverageError', 'Requested PCM is outside the retained window');
    let chunkIndex = 0;
    while (chunkIndex < this.#chunks.length && this.#chunks[chunkIndex].end <= start) chunkIndex++;
    for (let i = 0; i < count; i++) {
      const at = start + i;
      if (at >= this.durationFrames) { target[i * 2] = 0; target[i * 2 + 1] = 0; continue; }
      while (this.#chunks[chunkIndex].end <= at) chunkIndex++;
      const chunk = this.#chunks[chunkIndex], channels = chunk.buffers[source];
      target[i * 2] = channels[channel][at - chunk.start];
      target[i * 2 + 1] = channels[channel + 1]?.[at - chunk.start] ?? channels[channel][at - chunk.start];
    }
    return target;
  }
  snapshot() {
    return {...this.#g, startFrame: this.#start, endFrame: this.#end, disposed: this.#closed,
      retainedPCMBytes: this.#bytes, maxRetainedFrames: this.#limit, retainedChunks: this.#chunks.length,
      ownership: 'Snapshotted descriptors; borrowed immutable whole-buffer PCM. Payload bytes exclude DSP and JavaScript overhead.'};
  }
  dispose() { this.#chunks = []; this.#bytes = 0; this.#closed = true; return this.snapshot(); }
}

// Fixed source retains the historical whole-source path, including short-stem
// zero padding and long-stem truncation at the ORIGINAL endpoint.
export class FixedPCMSource {
  #g; #buffers; #bytes;
  constructor(sampleRate, buffers) {
    this.#g = geometry({sampleRate, durationFrames: buffers[0][0].length, channelCounts: buffers.map(c => c.length)});
    this.#buffers = buffers.map(c => [...c]);
    this.#bytes = buffers.reduce((sum, c) => sum + c.reduce((n, a) => n + a.byteLength, 0), 0);
  }
  get sampleRate() { return this.#g.sampleRate; }
  get durationFrames() { return this.#g.durationFrames; }
  get channelCounts() { return this.#g.channelCounts; }
  readStereo(source, channel, start, count, target) {
    readArguments(this.#g, source, channel, start, count, target);
    if (!this.#buffers) fail('InvalidStateError', 'PCM source is disposed');
    const channels = this.#buffers[source];
    for (let i = 0; i < count; i++) for (let c = 0; c < 2; c++) {
      const at = start + i, data = channels[Math.min(channel + c, channels.length - 1)];
      target[i * 2 + c] = at < this.durationFrames && at < data.length ? data[at] : 0;
    }
  }
  snapshot() { return {retainedPCMBytes: this.#buffers ? this.#bytes : 0}; }
  dispose() { this.#buffers = null; }
}
