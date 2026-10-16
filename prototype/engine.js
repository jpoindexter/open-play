import { createEffect } from "./effects.js";
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.voices = new Map();
    this.nodes = [];
    this.buffers = new Map();
    this.recording = false;
    this.chunks = [];
    this.cross = 0;
    this.masterLevel = 0.55;
    this.onEnd = () => {};
    this.onSampleEnd = () => {};
    this.reversed = new Map();
    this.sampleTokens = new Map();
    this.startTokens = new Map();
    this.fxChains = [];
    this.fxState = null;
  }
  init() {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.masterInput = this.ctx.createGain();
    this.samplerInput = this.ctx.createGain();
    this.samplerInput.connect(this.masterInput);
    this.masterInput.connect(this.master);
    this.master.gain.value = this.masterLevel;
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.destination = this.ctx.createMediaStreamDestination();
    this.master.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
    this.master.connect(this.destination);
    for (let i = 0; i < 4; i++) {
      const input = this.ctx.createGain(),
        low = this.ctx.createBiquadFilter(),
        mid = this.ctx.createBiquadFilter(),
        high = this.ctx.createBiquadFilter(),
        filter = this.ctx.createBiquadFilter(),
        gain = this.ctx.createGain();
      low.type = "lowshelf";
      low.frequency.value = 250;
      mid.type = "peaking";
      mid.frequency.value = 1000;
      mid.Q.value = 0.7;
      high.type = "highshelf";
      high.frequency.value = 4000;
      filter.type = "lowpass";
      filter.frequency.value = 20000;
      input.connect(low);
      low.connect(mid);
      mid.connect(high);
      high.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterInput);
      this.nodes.push({
        input,
        low,
        mid,
        high,
        filter,
        gain,
        level: 0.8,
        trim: 1,
      });
    }
    this.setCross(0);
    if (this.fxState) this.configureFX(...this.fxState);
  }
  async resume() {
    this.init();
    await this.ctx.resume();
  }
  async buffer(track) {
    this.init();
    if (this.buffers.has(track.id)) return this.buffers.get(track.id);
    if (track.file) {
      const b = await this.ctx.decodeAudioData(await track.file.arrayBuffer());
      this.buffers.set(track.id, b);
      track.duration = b.duration;
      return b;
    }
    if (!track.demo)
      throw new Error("Audio file unavailable. Re-import this local file.");
    const sr = 22050,
      seconds = 48,
      b = this.ctx.createBuffer(2, sr * seconds, sr),
      beat = 60 / track.bpm;
    for (let c = 0; c < 2; c++) {
      const a = b.getChannelData(c);
      let seed = track.seed + c * 97;
      for (let i = 0; i < a.length; i++) {
        const t = i / sr,
          p = t % beat;
        seed = (seed * 1664525 + 1013904223) >>> 0;
        const kick =
          Math.sin(
            2 * Math.PI * (48 * p + (35 * (1 - Math.exp(-p * 25))) / 25),
          ) *
          Math.exp(-p * 25) *
          0.25;
        const eighth = t % (beat / 2);
        const hat =
          ((seed / 4294967296) * 2 - 1) * Math.exp(-eighth * 150) * 0.04;
        const bass =
          Math.sin(2 * Math.PI * track.freq * t) *
          (0.07 + 0.03 * Math.sin((2 * Math.PI * t) / beat / 4));
        const chord =
          Math.sin(2 * Math.PI * track.freq * 3 * t + c * 0.1) * 0.025;
        const fade = Math.min(1, t * 2, (seconds - t) * 2);
        a[i] = (kick + hat + bass + chord) * fade;
      }
    }
    this.buffers.set(track.id, b);
    return b;
  }
  position(d) {
    if (!d.playing || !this.ctx) return d.position;
    let p =
      d.anchorPosition +
      (this.ctx.currentTime - d.anchorTime) * d.rate * (d.reverse ? -1 : 1);
    if (d.loop && d.loopOut > d.loopIn) {
      const n = d.loopOut - d.loopIn;
      if (p >= d.loopOut || (d.reverse && p < d.loopIn))
        p = d.loopIn + ((((p - d.loopIn) % n) + n) % n);
    }
    return Math.max(0, Math.min(d.track?.duration || 48, p));
  }
  stopSource(i) {
    const source = this.voices.get(i);
    if (source) {
      source.onended = null;
      try {
        source.stop();
      } catch {}
      this.voices.delete(i);
    }
  }
  async start(d) {
    if (!d.track) throw new Error("Load a track first.");
    if (d.track.missing || d.track.provider)
      throw new Error(
        d.track.provider
          ? "Provider playback is simulated; choose a local track."
          : "File missing. Relocate or re-import this track.",
      );
    const token = (this.startTokens.get(d.index) || 0) + 1;
    this.startTokens.set(d.index, token);
    const track = d.track;
    await this.resume();
    let buffer = await this.buffer(track);
    if (this.startTokens.get(d.index) !== token || d.track !== track) return;
    if (d.reverse) buffer = this.reverseBuffer(d.track.id, buffer);
    this.stopSource(d.index);
    if (!d.reverse && d.position >= buffer.duration) d.position = 0;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = d.rate;
    src.loop = d.loop;
    src.loopStart = d.reverse ? buffer.duration - d.loopOut : d.loopIn;
    src.loopEnd = d.reverse ? buffer.duration - d.loopIn : d.loopOut;
    src.connect(this.nodes[d.index].input);
    d.anchorPosition = d.position;
    d.anchorTime = this.ctx.currentTime;
    d.playing = true;
    src.onended = () => {
      if (this.voices.get(d.index) !== src) return;
      this.voices.delete(d.index);
      d.position = d.reverse ? 0 : buffer.duration;
      d.playing = false;
      this.onEnd(d);
    };
    src.start(
      0,
      Math.max(
        0,
        Math.min(
          buffer.duration - 1 / buffer.sampleRate,
          d.reverse ? buffer.duration - d.position : d.position,
        ),
      ),
    );
    this.voices.set(d.index, src);
  }
  pause(d) {
    this.startTokens.set(d.index, (this.startTokens.get(d.index) || 0) + 1);
    d.position = this.position(d);
    d.playing = false;
    this.stopSource(d.index);
  }
  async seek(d, p) {
    const was = d.playing;
    this.pause(d);
    d.position = Math.max(0, Math.min(d.track?.duration || 48, p));
    if (was && (d.reverse ? d.position > 0 : d.position < d.track.duration))
      await this.start(d);
  }
  async setRate(d, rate) {
    const p = this.position(d);
    if (d.slipOrigin) {
      d.slipOrigin.position +=
        (this.ctx.currentTime - d.slipOrigin.time) * d.slipOrigin.rate;
      d.slipOrigin.time = this.ctx.currentTime;
      d.slipOrigin.rate = rate;
    }
    d.rate = rate;
    d.position = p;
    d.anchorPosition = p;
    d.anchorTime = this.ctx?.currentTime || 0;
    const s = this.voices.get(d.index);
    if (s) s.playbackRate.value = rate;
    if (this.fxState) {
      this.fxState[2][d.index] = (d.track?.bpm || 120) * rate;
      this.configureFX(...this.fxState);
    }
  }
  async setLoop(d, on, start, end) {
    d.position = this.position(d);
    d.loop = on;
    d.loopIn = start;
    d.loopOut = end;
    d.anchorPosition = d.position;
    d.anchorTime = this.ctx?.currentTime || 0;
    const s = this.voices.get(d.index);
    if (s) {
      s.loop = on;
      s.loopStart = d.reverse ? d.track.duration - end : start;
      s.loopEnd = d.reverse ? d.track.duration - start : end;
      if (on && d.position >= end) await this.seek(d, start);
    }
  }
  setCross(value) {
    this.cross = Number(value);
    if (!this.ctx) return;
    for (let i = 0; i < 4; i++) {
      const side =
          i % 2 ? Math.min(1, 1 + this.cross) : Math.min(1, 1 - this.cross),
        n = this.nodes[i];
      n.gain.gain.setTargetAtTime(
        side * n.level * n.trim,
        this.ctx.currentTime,
        0.01,
      );
    }
  }
  mix(i, kind, value) {
    this.init();
    const n = this.nodes[i];
    value = Number(value);
    if (kind === "level" || kind === "trim") {
      n[kind] = value;
      this.setCross(this.cross);
    } else if (["low", "mid", "high"].includes(kind))
      n[kind].gain.setTargetAtTime(value, this.ctx.currentTime, 0.015);
    else if (kind === "filter") {
      n.filter.type = value < 0 ? "lowpass" : "highpass";
      n.filter.frequency.setTargetAtTime(
        value < 0
          ? 20000 * Math.pow(0.003, -value)
          : 20 * Math.pow(1000, value),
        this.ctx.currentTime,
        0.015,
      );
    }
  }
  configureFX(banks, routes = [], bpms = [120, 120, 120, 120]) {
    this.fxState = [banks, routes, bpms];
    if (!this.ctx) return;
    for (const chain of this.fxChains) chain.dispose();
    this.fxChains = [];
    const inputs = [
      ...this.nodes.map((n) => n.gain),
      this.samplerInput,
      this.masterInput,
    ];
    const names = ["Deck 1", "Deck 2", "Deck 3", "Deck 4", "Sampler", "Master"];
    inputs.forEach((input, i) => {
      input.disconnect();
      let tail = input;
      banks.forEach((bank, b) => {
        if ((routes[b] || `Deck ${b + 1}`) !== names[i]) return;
        for (const spec of bank) {
          const effect = createEffect(
            this.ctx,
            spec,
            bpms[i] || bpms[0] || 120,
          );
          tail.connect(effect.input);
          tail = effect.output;
          this.fxChains.push(effect);
        }
      });
      tail.connect(i === 5 ? this.master : this.masterInput);
    });
  }
  meter() {
    if (!this.ctx) return 0;
    const a = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(a);
    return (
      Math.sqrt(a.reduce((s, v) => s + ((v - 128) / 128) ** 2, 0) / a.length) *
      3
    );
  }
  async recordStart() {
    await this.resume();
    if (!window.MediaRecorder)
      throw new Error("This browser does not support mix recording.");
    this.chunks = [];
    const type = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find(
      (t) => MediaRecorder.isTypeSupported(t),
    );
    this.recorder = new MediaRecorder(
      this.destination.stream,
      type ? { mimeType: type } : {},
    );
    this.recorder.ondataavailable = (e) => {
      if (e.data.size) this.chunks.push(e.data);
    };
    this.recorder.start(250);
    this.recording = true;
    this.recordStarted = this.ctx.currentTime;
  }
  recordStop() {
    return new Promise((resolve) => {
      if (!this.recorder || !this.recording) return resolve(null);
      this.recorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: this.recorder.mimeType });
        this.recording = false;
        resolve(blob);
      };
      this.recorder.stop();
    });
  }
  reverseBuffer(id, original) {
    if (this.reversed.has(id)) return this.reversed.get(id);
    const out = this.ctx.createBuffer(
      original.numberOfChannels,
      original.length,
      original.sampleRate,
    );
    for (let c = 0; c < original.numberOfChannels; c++)
      out.copyToChannel(original.getChannelData(c).slice().reverse(), c);
    this.reversed.set(id, out);
    return out;
  }
  async setReverse(d, reverse) {
    const playing = d.playing;
    this.pause(d);
    d.reverse = reverse;
    if (playing) await this.start(d);
  }
  beginSlip(d, reason) {
    if (!d.slip || d.slipOrigin || !d.playing) return;
    d.slipOrigin = {
      position: this.position(d),
      time: this.ctx.currentTime,
      rate: d.rate,
      reason,
    };
  }
  async endSlip(d, reason) {
    const origin = d.slipOrigin;
    if (!origin || (reason && reason !== origin.reason)) return;
    d.slipOrigin = null;
    await this.seek(
      d,
      origin.position + (this.ctx.currentTime - origin.time) * origin.rate,
    );
  }
  async sample(track, slot, options = {}) {
    const settings =
      typeof options === "boolean" ? { repeat: options } : options;
    this.stopSample(slot);
    const token = (this.sampleTokens.get(slot) || 0) + 1;
    this.sampleTokens.set(slot, token);
    await this.resume();
    const b = await this.buffer(track);
    if (this.sampleTokens.get(slot) !== token) return false;
    const source = this.ctx.createBufferSource(),
      gain = this.ctx.createGain();
    source.buffer = b;
    source.loop = !!settings.repeat;
    source.loopStart = settings.loopStart || 0;
    source.loopEnd = settings.loopEnd || b.duration;
    source.playbackRate.value = settings.rate || 1;
    gain.gain.value = settings.muted ? 0 : (settings.gain ?? 0.8) * 0.5;
    source.connect(gain);
    gain.connect(this.samplerInput);
    this.samples ??= new Map();
    this.samples.set(slot, { source, gain });
    source.onended = () => {
      if (this.samples.get(slot)?.source === source) {
        this.samples.delete(slot);
        this.onSampleEnd(slot);
      }
      gain.disconnect();
    };
    source.start(
      0,
      Math.max(0, Math.min(b.duration - 0.001, settings.start || 0)),
    );
    return true;
  }
  updateSample(slot, options) {
    const voice = this.samples?.get(slot);
    if (!voice) return;
    if (options.rate !== undefined)
      voice.source.playbackRate.setTargetAtTime(
        options.rate,
        this.ctx.currentTime,
        0.01,
      );
    if (options.gain !== undefined)
      voice.gain.gain.setTargetAtTime(
        options.gain * 0.5,
        this.ctx.currentTime,
        0.01,
      );
  }
  stopSample(slot) {
    this.sampleTokens.set(slot, (this.sampleTokens.get(slot) || 0) + 1);
    const voice = this.samples?.get(slot);
    if (voice) {
      voice.source.onended = null;
      try {
        voice.source.stop();
      } catch {}
      voice.gain.disconnect();
      this.samples.delete(slot);
    }
  }
  silence() {
    for (const s of this.voices.values()) {
      s.onended = null;
      try {
        s.stop();
      } catch {}
    }
    this.voices.clear();
    for (const key of this.samples?.keys() || []) this.stopSample(key);
  }
}
