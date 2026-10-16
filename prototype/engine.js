import { createEffect } from "./effects.js";
import { prepareExtendedEffects } from "./extended-effects.js";
import { KeylockRenderer } from "./keylock.js";
import { prepareStemHistory, createStemHistory } from "./stem-history.js";
import { createStemExitFX } from "./stem-exit-fx.js";
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
    this.reversed = new WeakMap();
    this.keylockRenderer = new KeylockRenderer();
    this.transforms = new Map();
    this.stemBuffers = new Map();
    this.stemStates = new Map();
    this.onProcessing = () => {};
    this.deckStates = new Map();
    this.sampleTokens = new Map();
    this.sampleRequests = new Map();
    this.onSampleState = () => {};
    this.samplerRoute = "Master";
    this.startTokens = new Map();
    this.fxChains = [];
    this.fxState = null;
    this.channelFXType = "Filter";
  }
  init() {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.effectsReady = Promise.all([
      prepareExtendedEffects(this.ctx),
      prepareStemHistory(this.ctx),
    ]).then(() => {
      this.effectsPrepared = true;
    });
    this.effectsReady.catch((error) => this.onError?.(error));
    this.master = this.ctx.createGain();
    this.masterInput = this.ctx.createGain();
    this.samplerInput = this.ctx.createGain();
    this.samplerOutput = this.ctx.createGain();
    this.samplerInput.connect(this.samplerOutput);
    this.samplerOutput.connect(this.masterInput);
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
      high.connect(gain);
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
    await this.effectsReady;
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
      Math.max(0, this.ctx.currentTime - d.anchorTime) *
        d.rate *
        (d.reverse ? -1 : 1);
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
      for (const item of source.sources || [source]) {
        item.onended = null;
        try {
          item.stop();
        } catch {}
        item.disconnect();
      }
      const state = this.stemStates.get(i);
      if (state)
        state.effects.forEach((effect, index) => {
          effect?.dispose();
          state.effects[index] = null;
          state.generations[index]++;
        });
      for (const history of state?.histories || []) {
        // Detach only the voice gain; the zero-gain sink keeps recording silence.
        const gain = source.stemGains?.[state.histories.indexOf(history) + 1];
        if (gain) history.node.disconnect(gain);
      }
      for (const gain of source.stemGains || []) gain.disconnect();
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
    this.deckStates.set(d.index, d);
    this.transforms.get(d.index)?.abort();
    const controller = new AbortController();
    this.transforms.set(d.index, controller);
    const token = (this.startTokens.get(d.index) || 0) + 1;
    this.startTokens.set(d.index, token);
    const track = d.track;
    const tempo = d.rate,
      keylock = d.keylock,
      shift = d.keyShift || 0;
    d.processing = true;
    this.onProcessing(d);
    const current = () =>
      this.startTokens.get(d.index) === token &&
      d.track === track &&
      !controller.signal.aborted;
    try {
      await this.resume();
      this.nodes[d.index].channelBpm = (track.bpm || 120) * tempo;
      await this.applyChannelFX(d.index);
      const original = await this.buffer(track);
      const stems = this.stemBuffers.get(track.id);
      let buffers = stems ? [original, ...stems] : [original];
      const transformed = keylock || shift !== 0;
      const scale = transformed ? tempo : 1;
      if (!current()) return;
      if (transformed) {
        d.processing = true;
        this.onProcessing(d);
        const rendered = [];
        for (const buffer of buffers) {
          rendered.push(
            await this.keylockRenderer.render(buffer, {
              tempo,
              semitones: shift + (keylock ? 0 : 12 * Math.log2(tempo)),
              signal: controller.signal,
            }),
          );
          if (!current()) return;
        }
        buffers = rendered;
      }
      if (!current()) return;
      if (d.reverse)
        buffers = buffers.map((buffer) => this.reverseBuffer(track.id, buffer));
      this.stopSource(d.index);
      if (!d.reverse && d.position >= track.duration) d.position = 0;
      const sources = buffers.map((buffer) => {
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = transformed ? 1 : tempo;
        source.loop = d.loop;
        source.loopStart =
          (d.reverse ? track.duration - d.loopOut : d.loopIn) / scale;
        source.loopEnd =
          (d.reverse ? track.duration - d.loopIn : d.loopOut) / scale;
        return source;
      });
      const voice = sources[0];
      voice.sources = sources;
      voice.timelineScale = scale;
      voice.stemGains = stems
        ? sources.map(() => {
            const gain = this.ctx.createGain();
            gain.gain.value = 0;
            gain.connect(this.nodes[d.index].input);
            return gain;
          })
        : [];
      const stemState = stems ? this.ensureStemState(d) : null;
      sources.forEach((source, i) => {
        if (stemState && i > 0) {
          source.connect(stemState.histories[i - 1].node);
          stemState.histories[i - 1].node.connect(voice.stemGains[i]);
        } else
          source.connect(
            stems ? voice.stemGains[i] : this.nodes[d.index].input,
          );
      });
      this.voices.set(d.index, voice);
      if (stems) this.updateStems(d);
      const when = this.ctx.currentTime + 0.01;
      d.anchorPosition = d.position;
      d.anchorTime = when;
      d.playing = true;
      voice.onended = () => {
        if (this.voices.get(d.index) !== voice) return;
        this.stopSource(d.index);
        d.position = d.reverse ? 0 : track.duration;
        d.playing = false;
        this.onEnd(d);
      };
      sources.forEach((source) =>
        source.start(
          when,
          Math.max(
            0,
            Math.min(
              source.buffer.duration - 1 / source.buffer.sampleRate,
              (d.reverse ? track.duration - d.position : d.position) / scale,
            ),
          ),
        ),
      );
    } catch (error) {
      if (error.name !== "AbortError") throw error;
    } finally {
      if (current()) {
        d.processing = false;
        this.transforms.delete(d.index);
        this.onProcessing(d);
      }
    }
  }

  pause(d) {
    this.transforms.get(d.index)?.abort();
    this.transforms.delete(d.index);
    d.processing = false;
    this.startTokens.set(d.index, (this.startTokens.get(d.index) || 0) + 1);
    d.position = this.position(d);
    d.playing = false;
    this.stopSource(d.index);
  }
  async seek(d, p) {
    const was = d.playing || d.processing;
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
    const was = d.playing || d.processing;
    const restart = d.keylock || d.keyShift || d.processing;
    if (restart) this.pause(d);
    d.rate = rate;
    d.position = p;
    d.anchorPosition = p;
    d.anchorTime = this.ctx?.currentTime || 0;
    const s = this.voices.get(d.index);
    if (s)
      for (const source of s.sources || [s]) source.playbackRate.value = rate;
    if (was && restart) await this.start(d);
    if (this.nodes[d.index]) {
      this.nodes[d.index].channelBpm = (d.track?.bpm || 120) * rate;
      await this.applyChannelFX(d.index);
    }
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
      for (const source of s.sources || [s]) {
        source.loop = on;
        source.loopStart =
          (d.reverse ? d.track.duration - end : start) / (s.timelineScale || 1);
        source.loopEnd =
          (d.reverse ? d.track.duration - start : end) / (s.timelineScale || 1);
      }
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
      n.channelValue = value;
      this.applyChannelFX(i).catch((error) => this.onError?.(error));
    }
  }
  async setChannelFX(name) {
    if (!["Filter", "Dub Echo", "Space", "Noise"].includes(name))
      throw new Error("Unknown Channel FX.");
    this.channelFXType = name;
    this.init();
    await Promise.all(this.nodes.map((_, i) => this.applyChannelFX(i)));
  }
  async applyChannelFX(i) {
    await this.effectsReady;
    const n = this.nodes[i],
      value = n.channelValue || 0,
      name = this.channelFXType;
    if (name === "Filter") {
      n.channelEffect?.dispose();
      n.channelEffect = null;
      n.high.disconnect();
      n.filter.disconnect();
      if (value === 0) {
        n.high.connect(n.gain);
        return;
      }
      n.high.connect(n.filter);
      n.filter.connect(n.gain);
      n.filter.type = value < 0 ? "lowpass" : "highpass";
      n.filter.frequency.setTargetAtTime(
        value < 0
          ? 20000 * Math.pow(0.003, -value)
          : 20 * Math.pow(1000, value),
        this.ctx.currentTime,
        0.015,
      );
      return;
    }
    const spec = {
      name: `Channel ${name}`,
      on: value !== 0,
      depth: Math.abs(value) * 100,
      beat: "1/2",
      params: {},
    };
    if (n.channelEffect?.update?.(spec, n.channelBpm || 120) === true) return;
    n.channelEffect?.dispose();
    n.high.disconnect();
    n.filter.disconnect();
    n.channelEffect = createEffect(this.ctx, spec, n.channelBpm || 120);
    n.high.connect(n.channelEffect.input);
    n.channelEffect.output.connect(n.gain);
  }

  configureFX(banks, routes = [], bpms = [120, 120, 120, 120]) {
    const state = [banks, routes, bpms];
    this.fxState = state;
    if (!this.ctx) return;
    if (!this.effectsPrepared) {
      this.effectsReady
        .then(() => {
          if (this.fxState === state) this.configureFX(...state);
        })
        .catch((error) => this.onError?.(error));
      return;
    }
    const signature = JSON.stringify([
      routes,
      banks.map((bank) => bank.length),
    ]);
    if (this.fxLayout === signature && this.fxSlots) {
      for (const slot of this.fxSlots)
        slot.update(
          banks[slot.bank][slot.index],
          bpms[slot.route] || bpms[0] || 120,
        );
      return;
    }
    this.fxLayout = signature;
    this.fxSlots = [];
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
        bank.forEach((spec, index) => {
          const entry = this.ctx.createGain(),
            exit = this.ctx.createGain();
          let effect, previous;
          const slot = {
            bank: b,
            index,
            route: i,
            input: entry,
            output: exit,
            update: (next, bpm) => {
              const serialized = JSON.stringify([next, bpm]);
              if (serialized === previous) return;
              if (
                effect &&
                effect.update?.(next, bpm) !== false &&
                effect.update
              ) {
                previous = serialized;
                return;
              }
              entry.disconnect();
              effect?.dispose();
              effect = createEffect(this.ctx, next, bpm);
              entry.connect(effect.input);
              effect.output.connect(exit);
              previous = serialized;
            },
            dispose: () => {
              entry.disconnect();
              exit.disconnect();
              effect?.dispose();
            },
          };
          slot.update(spec, bpms[i] || bpms[0] || 120);
          tail.connect(entry);
          tail = exit;
          this.fxChains.push(slot);
          this.fxSlots.push(slot);
        });
      });
      tail.connect(
        i === 5 ? this.master : i === 4 ? this.samplerOutput : this.masterInput,
      );
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
    if (this.reversed.has(original)) return this.reversed.get(original);
    const out = this.ctx.createBuffer(
      original.numberOfChannels,
      original.length,
      original.sampleRate,
    );
    for (let c = 0; c < original.numberOfChannels; c++)
      out.copyToChannel(original.getChannelData(c).slice().reverse(), c);
    this.reversed.set(original, out);
    return out;
  }
  async setPitch(d, { keylock = d.keylock, semitones = d.keyShift || 0 } = {}) {
    const was = d.playing || d.processing;
    this.pause(d);
    d.keylock = keylock;
    d.keyShift = semitones;
    if (was) await this.start(d);
  }
  async attachStems(track, buffers, decks = []) {
    if (
      buffers.length !== 4 ||
      buffers.some((b) => Math.abs(b.duration - track.duration) > 0.1)
    )
      throw new Error("Stem duration does not match original audio.");
    this.stemBuffers.set(track.id, buffers);
    for (const d of decks.filter((d) => d.track === track)) {
      const was = d.playing || d.processing;
      this.pause(d);
      if (was) await this.start(d);
    }
  }
  ensureStemState(d) {
    let state = this.stemStates.get(d.index);
    if (state && state.track !== d.track) {
      state.effects.forEach((effect) => effect?.dispose());
      state.histories.forEach((history) => history.dispose());
      this.stemStates.delete(d.index);
      state = null;
    }
    if (!state) {
      state = {
        track: d.track,
        modes: ["", "", "", ""],
        generations: [0, 0, 0, 0],
        effects: [null, null, null, null],
        histories: Array.from({ length: 4 }, () => createStemHistory(this.ctx)),
      };
      this.stemStates.set(d.index, state);
    }
    return state;
  }
  updateStems(d) {
    const voice = this.voices.get(d.index);
    const state = this.stemStates.get(d.index);
    if (!state || state.track !== d.track) return;
    const originalMix = d.stems.every(Boolean) && !d.stemFX.some(Boolean);
    const modes = d.stems.map((enabled, i) => {
      if (!enabled) return "";
      if (i > 0 && d.stemFX[2]) return "brake";
      if (
        (i === 0 && d.stemFX[0]) ||
        (i > 0 && d.stemFX[1]) ||
        (i === 3 && d.stemFX[3])
      )
        return "echo";
      return "";
    });
    voice?.stemGains?.forEach((gain, index) => {
      const level =
        index === 0
          ? Number(originalMix)
          : Number(!originalMix && d.stems[index - 1] && !modes[index - 1]);
      gain.gain.cancelScheduledValues(this.ctx.currentTime);
      if (!voice.stemInitialized)
        gain.gain.setValueAtTime(level, this.ctx.currentTime);
      else gain.gain.setTargetAtTime(level, this.ctx.currentTime, 0.003);
    });
    modes.forEach((mode, i) => {
      if (state.modes[i] === mode) return;
      state.effects[i]?.dispose();
      state.effects[i] = null;
      const generation = ++state.generations[i];
      // Disabling while paused rearms. Enabling waits until a voice exists.
      if (!voice && mode) return;
      state.modes[i] = mode;
      if (!mode) return;
      const bpm = (d.track.bpm || 120) * d.rate;
      state.histories[i]
        .capture(60 / Math.max(20, Math.min(400, bpm)))
        .then((buffer) => {
          if (
            this.stemStates.get(d.index) !== state ||
            state.generations[i] !== generation ||
            state.modes[i] !== mode
          )
            return;
          const effect = createStemExitFX(this.ctx, {
            buffer,
            offset: buffer.duration,
            rate: 1,
            bpm,
            kind: mode,
          });
          effect.output.connect(this.nodes[d.index].input);
          state.effects[i] = effect;
        })
        .catch((error) => {
          if (error.name !== "AbortError") this.onError?.(error);
        });
    });
    if (voice) voice.stemInitialized = true;
  }
  async setReverse(d, reverse) {
    const playing = d.playing || d.processing;
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
  setSamplerOutput(route = "Master") {
    if (!["Master", "Deck 1", "Deck 2", "Deck 3", "Deck 4"].includes(route))
      throw new Error("Unknown sampler bus.");
    this.init();
    this.samplerRoute = route;
    this.samplerOutput.disconnect();
    this.samplerOutput.connect(
      route === "Master"
        ? this.masterInput
        : this.nodes[Number(route.slice(-1)) - 1].input,
    );
  }
  samplePosition(slot) {
    const voice = this.samples?.get(slot),
      request = this.sampleRequests.get(slot);
    if (!voice) return request?.settings.start || 0;
    let position =
      voice.anchorPosition +
      Math.max(0, this.ctx.currentTime - voice.anchorTime) *
        voice.settings.rate;
    if (voice.settings.repeat && position >= voice.settings.loopEnd) {
      const length = voice.settings.loopEnd - voice.settings.loopStart;
      if (length > 0)
        position =
          voice.settings.loopStart +
          ((position - voice.settings.loopStart) % length);
    }
    return Math.min(voice.track.duration, position);
  }
  async sample(track, slot, options = {}) {
    if (!track) throw new Error("Load a sample first.");
    const settings = {
      ...(typeof options === "boolean" ? { repeat: options } : options),
    };
    settings.rate = Math.max(0.5, Math.min(2, Number(settings.rate) || 1));
    settings.keylock = !!settings.keylock;
    settings.start = Math.max(0, Number(settings.start) || 0);
    this.stopSample(slot);
    const token = (this.sampleTokens.get(slot) || 0) + 1;
    this.sampleTokens.set(slot, token);
    const controller = new AbortController();
    const request = { track, settings, controller, processing: true };
    this.sampleRequests.set(slot, request);
    const current = () =>
      this.sampleTokens.get(slot) === token && !controller.signal.aborted;
    this.onSampleState(slot, { playing: false, processing: true });
    try {
      await this.resume();
      if (!current()) return false;
      const original = await this.buffer(track);
      if (!current()) return false;
      settings.loopStart = Math.max(
        0,
        Math.min(original.duration, Number(settings.loopStart) || 0),
      );
      settings.loopEnd = Math.max(
        settings.loopStart,
        Math.min(
          original.duration,
          Number(settings.loopEnd) || original.duration,
        ),
      );
      const scale = settings.keylock ? settings.rate : 1;
      const buffer = settings.keylock
        ? await this.keylockRenderer.render(original, {
            tempo: settings.rate,
            semitones: 0,
            signal: controller.signal,
          })
        : original;
      if (!current()) return false;
      const source = this.ctx.createBufferSource(),
        gain = this.ctx.createGain();
      source.buffer = buffer;
      source.loop = !!settings.repeat && settings.loopEnd > settings.loopStart;
      source.loopStart = settings.loopStart / scale;
      source.loopEnd = settings.loopEnd / scale;
      source.playbackRate.value = settings.keylock ? 1 : settings.rate;
      gain.gain.value = settings.muted ? 0 : (settings.gain ?? 0.8) * 0.5;
      source.connect(gain);
      gain.connect(this.samplerInput);
      const start = Math.min(
        original.duration - 1 / original.sampleRate,
        settings.start,
      );
      this.samples ??= new Map();
      this.samples.set(slot, {
        source,
        gain,
        settings,
        track,
        anchorPosition: start,
        anchorTime: this.ctx.currentTime,
        scale,
      });
      source.onended = () => {
        if (this.samples.get(slot)?.source === source) {
          this.samples.delete(slot);
          this.sampleRequests.delete(slot);
          this.onSampleState(slot, { playing: false, processing: false });
          this.onSampleEnd(slot);
        }
        source.disconnect();
        gain.disconnect();
      };
      source.start(this.ctx.currentTime, Math.max(0, start / scale));
      request.processing = false;
      this.onSampleState(slot, { playing: true, processing: false });
      return true;
    } catch (error) {
      if (current()) {
        this.sampleRequests.delete(slot);
        this.onSampleState(slot, { playing: false, processing: false });
      }
      if (error.name === "AbortError") return false;
      throw error;
    }
  }
  async updateSample(slot, options = {}) {
    const request = this.sampleRequests.get(slot),
      voice = this.samples?.get(slot);
    if (!request) return false;
    const position = this.samplePosition(slot),
      before = request.settings;
    // Play From is a trigger setting; changing it never seeks a live voice.
    const next = { ...before, ...options, start: before.start };
    next.rate = Math.max(0.5, Math.min(2, Number(next.rate) || 1));
    const transformChanged =
      next.rate !== before.rate || !!next.keylock !== !!before.keylock;
    if (
      transformChanged &&
      (request.processing || next.keylock || before.keylock)
    )
      return this.sample(request.track, slot, { ...next, start: position });
    Object.assign(before, next);
    if (voice) {
      voice.anchorPosition = position;
      voice.anchorTime = this.ctx.currentTime;
      voice.source.playbackRate.value = before.keylock ? 1 : before.rate;
      voice.source.loop = !!before.repeat && before.loopEnd > before.loopStart;
      voice.source.loopStart = before.loopStart / voice.scale;
      voice.source.loopEnd = before.loopEnd / voice.scale;
      voice.gain.gain.setTargetAtTime(
        before.muted ? 0 : (before.gain ?? 0.8) * 0.5,
        this.ctx.currentTime,
        0.01,
      );
    }
    return !!voice;
  }
  stopSample(slot) {
    this.sampleTokens.set(slot, (this.sampleTokens.get(slot) || 0) + 1);
    this.sampleRequests.get(slot)?.controller.abort();
    this.sampleRequests.delete(slot);
    const voice = this.samples?.get(slot);
    if (voice) {
      voice.source.onended = null;
      try {
        voice.source.stop();
      } catch {}
      voice.source.disconnect();
      voice.gain.disconnect();
      this.samples.delete(slot);
    }
    this.onSampleState(slot, { playing: false, processing: false });
  }
  stopAllSamples() {
    for (const slot of new Set([
      ...this.sampleRequests.keys(),
      ...(this.samples?.keys() || []),
    ]))
      this.stopSample(slot);
  }
  silence() {
    for (const d of this.deckStates.values()) this.pause(d);
    for (const controller of this.transforms.values()) controller.abort();
    this.transforms.clear();
    for (const i of this.voices.keys()) this.stopSource(i);
    for (const state of this.stemStates.values())
      state.histories.forEach((history) => history.clear());
    this.stopAllSamples();
    for (const n of this.nodes) {
      n.channelEffect?.dispose();
      n.channelEffect = null;
      n.channelValue = 0;
      n.high.disconnect();
      n.filter.disconnect();
      n.high.connect(n.gain);
    }
    for (const chain of this.fxChains) chain.dispose();
    this.fxChains = [];
    this.fxSlots = null;
    this.fxLayout = null;
    if (this.fxState) {
      for (const bank of this.fxState[0])
        for (const spec of bank) spec.on = false;
      this.configureFX(...this.fxState);
    }
  }
}
