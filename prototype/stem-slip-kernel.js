// Independent selected-stem transport. Positions and velocities use original
// track seconds and original track seconds per rendered second, respectively.
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export class StemSlipKernel {
  constructor(sampleRate) {
    this.sr = sampleRate;
    this.buffers = [];
    this.scale = 1;
    this.mode = 'off';
    this.phase = 'idle';
    this.owner = null;
    this.position = this.selected = 0;
    this.rate = 1;
    this.bpm = 120;
    this.duration = 0;
    this.playing = this.audition = false;
    this.velocity = 1;
    this.startAt = 0;
    this.audioTime = 0;
    this.release = null;
    this.loop = null;
    this.reverse = false;
    this.ended = false;
  }
  load(buffers, scale = 1) { this.buffers = buffers; this.scale = scale; }
  selectedStem(index) { return this.mode === 'vocal' ? index === 0 : index > 0; }
  transitionTo(position, velocity = this.rate) {
    this.transition = {position: this.selected, velocity: this.velocity, left: Math.max(1, Math.round(this.sr * .003))};
    this.selected = clamp(position, 0, this.duration);
    this.velocity = velocity;
  }
  align() {
    this.transitionTo(this.position, this.rate);
    this.phase = 'idle'; this.owner = null; this.release = null;
    this.audition = false; this.loop = null; this.reverse = false;
  }
  command(type, data = {}) {
    if (type === 'configure') {
      this.duration = data.duration;
      this.bpm = data.bpm || 120;
      this.rate = data.rate || 1;
      this.position = this.selected = clamp(data.position || 0, 0, this.duration);
      this.mode = data.mode;
      this.playing = !!data.playing;
      this.startAt = data.startAt || 0;
      this.reverse = !!data.reverse;
      this.loop = data.loop && data.loop.end > data.loop.start ? data.loop : null;
      this.velocity = this.rate * (this.reverse ? -1 : 1);
      this.ended = false;
    } else if (type === 'mode') {
      this.align(); this.mode = data.mode;
    } else if (type === 'play') {
      this.playing = true; this.ended = false; this.startAt = data.startAt || 0;
      if (this.phase === 'idle') this.align();
    } else if (type === 'pause') {
      this.playing = false; this.align();
    } else if (type === 'seek') {
      this.position = clamp(data.position, 0, this.duration); this.align();
    } else if (type === 'rate') {
      this.rate = data.rate; this.bpm = data.bpm || this.bpm;
      if (this.phase !== 'manipulating') this.velocity = this.rate;
    } else if (type === 'begin') {
      if (this.owner !== data.owner) this.align();
      this.owner = data.owner; this.phase = 'manipulating'; this.release = null;
      this.audition = true;
      if (!this.playing) this.velocity = 0;
    } else if ((type === 'scratch' || type === 'cue') && this.owner === data.owner && this.phase === 'manipulating') {
      this.loop = null; this.reverse = false;
      this.transitionTo(data.position, type === 'cue' ? this.rate : clamp(data.velocity, -16, 16));
      this.audition = true;
    } else if (type === 'reverse' && this.owner === data.owner) {
      this.reverse = !!data.reverse; this.velocity = this.rate * (this.reverse ? -1 : 1);
    } else if (type === 'loop' && this.owner === data.owner) {
      this.loop = data.end > data.start ? {start: data.start, end: data.end} : null;
    } else if (type === 'end' && this.owner === data.owner) {
      const beats = [0, .5, 1, 2, 4].includes(data.beats) ? data.beats : 0;
      if (!this.playing || !beats) this.align();
      else {
        const end = this.selected, length = beats * 60 / this.bpm;
        this.release = {start: end - length, end, remainingBeats: beats};
        this.transitionTo(end - length, this.rate);
        // Negative start is silence padding, never clamped into later audio.
        this.selected = end - length;
        this.phase = 'releasing'; this.owner = null; this.loop = null; this.reverse = false;
      }
    } else if (type === 'cancel') this.align();
    return this.state();
  }
  sample(index, channel, position) {
    const buffer = this.buffers[index];
    if (!buffer || position < 0 || position >= this.duration) return 0;
    const samples = buffer.channels[channel] || buffer.channels[0];
    const at = position / this.scale * buffer.sampleRate, i = Math.floor(at), f = at - i;
    if (i < 0 || i >= samples.length) return 0;
    return samples[i] * (1 - f) + (samples[i + 1] || 0) * f;
  }
  process(outputs, startTime = this.audioTime) {
    const frames = outputs[0][0].length;
    for (let n = 0; n < frames; n++) {
      const time = startTime + n / this.sr, active = time >= this.startAt;
      for (let stem = 0; stem < 4; stem++) for (let channel = 0; channel < 2; channel++) {
        let value = 0;
        if (active && this.mode !== 'off') {
          if (this.selectedStem(stem)) {
            if (this.playing || this.audition) {
              value = this.sample(stem, channel, this.selected);
              if (this.transition) {
                const mix = this.transition.left / Math.max(1, Math.round(this.sr * .003));
                value = value * (1 - mix) + this.sample(stem, channel, this.transition.position) * mix;
              }
            }
          } else if (this.playing) value = this.sample(stem, channel, this.position);
        }
        outputs[stem][channel][n] = Number.isFinite(value) ? value : 0;
      }
      if (active) {
        if (this.playing) this.position = Math.min(this.duration, this.position + this.rate / this.sr);
        if (this.playing || this.audition) {
          this.selected += this.velocity / this.sr;
          if (this.loop && this.phase !== 'releasing') {
            const size = this.loop.end - this.loop.start;
            if (this.selected >= this.loop.end || this.selected < this.loop.start)
              this.selected = this.loop.start + ((this.selected - this.loop.start) % size + size) % size;
          }
          if (this.transition) {
            this.transition.position += this.transition.velocity / this.sr;
            if (--this.transition.left <= 0) this.transition = null;
          }
        }
        if (this.phase === 'releasing' && this.playing) {
          this.release.remainingBeats -= this.rate * this.bpm / 60 / this.sr;
          if (this.release.remainingBeats <= 1e-9) this.align();
        }
        if (this.playing && this.position >= this.duration) {
          this.playing = false; this.align(); this.mode = 'off'; this.ended = true;
        }
      }
    }
    this.audioTime = startTime + frames / this.sr;
  }
  state() {
    return {mode: this.mode, phase: this.phase, owner: this.owner,
      position: this.position, selectedPosition: this.selected, rate: this.rate,
      velocity: this.velocity, bpm: this.bpm, scale: this.scale, playing: this.playing, audition: this.audition,
      startAt: this.startAt, audioTime: this.audioTime, duration: this.duration,
      release: this.release && {...this.release}, loop: this.loop && {...this.loop}, reverse: this.reverse,
      ended: this.ended};
  }
}
