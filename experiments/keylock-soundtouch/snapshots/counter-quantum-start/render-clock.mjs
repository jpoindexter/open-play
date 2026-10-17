// Prospective clock, never a repair of historical labels. One declared future
// anchor then independent callback counting, checked against the a-rate ramp.
const mismatch = message => { throw Object.assign(new Error(message), {name: 'ClockMismatchError'}); };
export class AnchoredRenderClock {
  #anchor; #next = null; #blocks = 0; #disagreements = 0; #maxGlobalDifference = 0;
  constructor(anchorFrame) {
    if (!Number.isSafeInteger(anchorFrame) || anchorFrame < 0 || anchorFrame % 128) throw new RangeError('Declare a future integer quantum anchor');
    this.#anchor = anchorFrame;
  }
  get nextFrame() { return this.#next; }
  begin(tags, frames, globalFrame) {
    if (!Number.isInteger(frames) || frames < 1 || frames > 128 || !(tags instanceof Float32Array) || ![1, frames].includes(tags.length) || tags.some(v => !Number.isFinite(v))) mismatch('Invalid audio-clock parameter geometry');
    if (this.#next === null && tags[0] === -1) return null;
    const expected = this.#next ?? this.#anchor;
    if (Math.abs(tags[0] - expected) > .25) mismatch(`Audio clock discontinuity: expected ${expected}, received ${tags[0]}, global ${globalFrame}`);
    if (globalFrame !== expected) { this.#disagreements++; this.#maxGlobalDifference = Math.max(this.#maxGlobalDifference, Math.abs(globalFrame - expected)); }
    this.#next = expected + frames; this.#blocks++;
    return expected;
  }
  snapshot() { return {anchorFrame: this.#anchor, nextFrame: this.#next, blocks: this.#blocks, globalDisagreements: this.#disagreements, maxGlobalDifference: this.#maxGlobalDifference, scope: 'Callback counter checked against scheduled AudioParam at each quantum start; not physical latency.'}; }
}
