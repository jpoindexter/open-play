// Independent integer callback count checked against bounded audio-rate phase.
// Six-hour anchors in arithmetic tests are NOT six-hour browser-run evidence.
const mismatch = message => { throw Object.assign(new Error(message), {name:'ClockMismatchError'}); };
export class PhaseRenderClock {
  #anchor; #period; #next = null; #blocks = 0; #globalDisagreements = 0; #maxGlobalDifference = 0; #wraps = 0;
  constructor({anchorFrame, periodFrames}) {
    if (!Number.isSafeInteger(anchorFrame) || anchorFrame < 0 || anchorFrame % 128 ||
      !Number.isInteger(periodFrames) || periodFrames < 256 || periodFrames > 2 ** 22 || periodFrames % 128)
      throw new RangeError('Integer quantum anchor and bounded quantum-aligned phase period required');
    this.#anchor = anchorFrame; this.#period = periodFrames;
  }
  get nextFrame() { return this.#next; }
  begin(tags, frames, globalFrame) {
    if (!Number.isInteger(frames) || frames < 1 || frames > 128 || !(tags instanceof Float32Array) ||
      ![1, frames].includes(tags.length) || tags.some(v => !Number.isFinite(v))) mismatch('Invalid phase geometry');
    if (this.#next === null && tags[0] === -1) return null;
    const expected = this.#next ?? this.#anchor;
    if (!Number.isSafeInteger(expected + frames)) throw Object.assign(new Error('Callback clock exceeded safe integer range'), {name:'ClockRangeError'});
    if (tags.length !== frames) mismatch('Active phase clock requires a complete a-rate quantum');
    const offset = expected - this.#anchor;
    for (let i = 0; i < frames; i++) {
      const phase = (offset + i) % this.#period;
      if (tags[i] < 0 || tags[i] >= 1 || Math.abs(tags[i] * this.#period - phase) > .25)
        mismatch(`Phase mismatch at ${i}: expected ${phase}, received ${tags[i] * this.#period}, absolute ${expected}, global ${globalFrame}`);
    }
    if (!Number.isSafeInteger(globalFrame) || globalFrame < 0 || Math.abs(globalFrame - expected) > 256) mismatch(`Coarse absolute clock disagreement: expected ${expected}, global ${globalFrame}`);
    if (globalFrame !== expected) { this.#globalDisagreements++; this.#maxGlobalDifference = Math.max(this.#maxGlobalDifference, Math.abs(globalFrame - expected)); }
    this.#next = expected + frames; this.#blocks++; this.#wraps = Math.floor((offset + frames) / this.#period);
    return expected;
  }
  snapshot() { return {anchorFrame:this.#anchor,periodFrames:this.#period,nextFrame:this.#next,blocks:this.#blocks,wraps:this.#wraps,
    globalDisagreements:this.#globalDisagreements,maxGlobalDifference:this.#maxGlobalDifference,
    coarseGlobalFenceFrames:256, scope:'Integer callback clock checked against every normalized phase sample. Not a physical clock, sample provenance or long-session acceptance.'}; }
}
