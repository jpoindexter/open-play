import { createEffect } from "./effects.js";
import { prepareExtendedEffects } from "./extended-effects.js";
import { KeylockRenderer } from "./keylock.js";
import { prepareStemHistory, createStemHistory } from "./stem-history.js";
import { createStemExitFX } from "./stem-exit-fx.js";
import { prepareStemSlip, createStemSlipTransport } from "./stem-slip.js";
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
    this.stemSlipTracks = new Map();
    this.stemSlipOwners = new Map();
    this.stemSlipPending = new Map();
    this.stemSlipRateTokens = new Map();
  }
  init() {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.effectsReady = Promise.all([
      prepareExtendedEffects(this.ctx),
      prepareStemHistory(this.ctx),
      prepareStemSlip(this.ctx),
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
    const split = this.voices.get(d.index)?.stemSlipTransport;
    if (split) return split.state().position;
    const pending = this.stemSlipPending.get(d.index);
    if (pending && pending.track === d.track && !pending.controller.signal.aborted)
      return this.stemSlipClockPosition(pending.clock, d.track.duration, this.ctx?.currentTime || 0);
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
  stopSource(i, { preserveStemExit = false } = {}) {
    const source = this.voices.get(i);
    if (source) {
      source.stemSlipTransport?.dispose();
      for (const item of source.sources || [source]) {
        item.onended = null;
        try {
          item.stop();
        } catch {}
        item.disconnect();
      }
      const state = this.stemStates.get(i);
      for (const history of state?.histories || []) {
        // Detach only the voice gain; the zero-gain sink keeps recording silence.
        const gain = source.stemGains?.[state.histories.indexOf(history) + 1];
        if (gain) history.node.disconnect(gain);
      }
      for (const gain of source.stemGains || []) gain.disconnect();
      this.voices.delete(i);
    }
    // Captured exits have their own finite source and deck bus. Replacing the
    // transport must not cut them; explicit stop must also clear orphan tails
    // when no ordinary voice remains (for example after seeking to track end).
    if (!preserveStemExit) {
      const state = this.stemStates.get(i);
      state?.effects.forEach((effect, index) => {
        effect?.dispose();
        state.effects[index] = null;
        state.generations[index]++;
      });
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
    if (d.stemSlip && d.stemSlip !== "off") {
      if (this.stemSlipTracks.get(d.index) !== d.track) {
        d.stemSlip = "off"; d.stemSlipPhase = "idle";
        this.stemSlipOwners.delete(d.index);
      } else {
        const transport = this.voices.get(d.index)?.stemSlipTransport;
        if (transport) {
          await transport.command("play", {startAt: this.ctx.currentTime + .01});
          d.playing = true;
          return;
        }
        return this.startStemSlip(d, true);
      }
    }
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
      this.stopSource(d.index, { preserveStemExit: true });
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
      const stemState = stems ? this.ensureStemState(d) : null;
      voice.stemGains = stems
        ? sources.map((_, index) => {
            const gain = this.ctx.createGain();
            gain.gain.value = 0;
            gain.connect(index === 0 ? this.nodes[d.index].input : stemState.routes[index - 1]);
            return gain;
          })
        : [];
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
      this.setCross(this.cross);
      if (stems) this.updateStems(d);
      const when = this.ctx.currentTime + 0.01;
      d.anchorPosition = d.position;
      d.anchorTime = when;
      d.playing = true;
      voice.onended = () => {
        if (this.voices.get(d.index) !== voice) return;
        this.stopSource(d.index, { preserveStemExit: true });
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

  pause(d, { preserveStemExit = false } = {}) {
    const position = this.position(d);
    this.stemSlipRateTokens.set(d.index, (this.stemSlipRateTokens.get(d.index) || 0) + 1);
    this.transforms.get(d.index)?.abort();
    this.transforms.delete(d.index);
    d.processing = false;
    this.startTokens.set(d.index, (this.startTokens.get(d.index) || 0) + 1);
    d.position = position;
    d.playing = false;
    d.stemSlipPhase = "idle";
    this.stemSlipOwners.delete(d.index);
    this.stopSource(d.index, { preserveStemExit });
  }
  async seek(d, p) {
    if (d.stemSlip && d.stemSlip !== "off") {
      const was = d.playing || d.processing;
      this.pause(d, {preserveStemExit: true});
      d.position = Math.max(0, Math.min(d.track.duration, p));
      if (d.position >= d.track.duration) { d.stemSlip = "off"; return; }
      if (was) await this.start(d);
      return;
    }
    const was = d.playing || d.processing;
    this.pause(d, { preserveStemExit: true });
    d.position = Math.max(0, Math.min(d.track?.duration || 48, p));
    if (was && (d.reverse ? d.position > 0 : d.position < d.track.duration))
      await this.start(d);
  }
  async setRate(d, rate) {
    if (d.stemSlip && d.stemSlip !== "off") {
      const pending = this.stemSlipPending.get(d.index);
      if (pending?.committing) {
        const track = d.track, mode = d.stemSlip;
        await pending.promise;
        if (d.track === track && d.stemSlip === mode) return this.setRate(d, rate);
        return;
      }
      const token = (this.stemSlipRateTokens.get(d.index) || 0) + 1;
      this.stemSlipRateTokens.set(d.index, token);
      const track = d.track, mode = d.stemSlip;
      d.position = this.position(d); d.rate = rate;
      const transport = this.voices.get(d.index)?.stemSlipTransport;
      const current = () => this.stemSlipRateTokens.get(d.index) === token &&
        d.track === track && d.stemSlip === mode &&
        (!transport || this.voices.get(d.index)?.stemSlipTransport === transport);
      if (pending && !transport) {
        pending.revision++; pending.preparation?.abort();
        await pending.promise;
      } else if (transport && (d.keylock || d.keyShift)) await this.refreshStemSlipBuffers(d);
      else if (transport) await transport.command("rate", {rate, bpm: d.track.bpm || 120});
      if (!current()) return;
      if (this.nodes[d.index]) {
        this.nodes[d.index].channelBpm = (d.track.bpm || 120) * rate;
        await this.applyChannelFX(d.index);
      }
      if (!current()) return;
      if (this.fxState) {
        this.fxState[2][d.index] = (d.track.bpm || 120) * rate;
        this.configureFX(...this.fxState);
      }
      return;
    }
    const p = this.position(d);
    if (d.slipOrigin) {
      d.slipOrigin.position +=
        (this.ctx.currentTime - d.slipOrigin.time) * d.slipOrigin.rate;
      d.slipOrigin.time = this.ctx.currentTime;
      d.slipOrigin.rate = rate;
    }
    const was = d.playing || d.processing;
    const restart = d.keylock || d.keyShift || d.processing;
    if (restart) this.pause(d, { preserveStemExit: true });
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
    if (d.stemSlip && d.stemSlip !== "off") {
      d.loop = on; d.loopIn = start; d.loopOut = end;
      if (on) {
        await this.beginStemSlipGesture(d, "transport:loop");
        await this.voices.get(d.index)?.stemSlipTransport.command("loop", {owner: "transport:loop", start, end});
      } else await this.endStemSlipGesture(d, "transport:loop");
      return;
    }
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
        (this.voices.get(i)?.stemSlipTransport ? 1 : side) * n.level * n.trim,
        this.ctx.currentTime,
        0.01,
      );
      const split = this.voices.get(i)?.stemSlipTransport;
      const mode = this.deckStates.get(i)?.stemSlip;
      this.stemStates.get(i)?.routes.forEach((route, stem) => {
        const selected = mode === "vocal" ? stem === 0 : stem > 0;
        route.gain.setTargetAtTime(split && selected ? side : 1, this.ctx.currentTime, .003);
      });
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
    if (d.stemSlip && d.stemSlip !== "off") {
      const pending = this.stemSlipPending.get(d.index);
      if (pending?.committing) {
        const track = d.track, mode = d.stemSlip;
        await pending.promise;
        if (d.track === track && d.stemSlip === mode) return this.setPitch(d, {keylock, semitones});
        return;
      }
      d.keylock = keylock; d.keyShift = semitones;
      if (pending && !this.voices.get(d.index)?.stemSlipTransport) {
        pending.revision++; pending.preparation?.abort(); await pending.promise;
      } else if (this.voices.get(d.index)?.stemSlipTransport) await this.refreshStemSlipBuffers(d);
      return;
    }
    const was = d.playing || d.processing;
    this.pause(d, { preserveStemExit: true });
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
      if (this.voices.get(d.index)?.stemSlipTransport) {
        await this.refreshStemSlipBuffers(d);
        continue;
      }
      const was = d.playing || d.processing;
      this.pause(d, { preserveStemExit: true });
      if (was) await this.start(d);
    }
  }
  ensureStemState(d) {
    let state = this.stemStates.get(d.index);
    if (state && state.track !== d.track) {
      state.effects.forEach((effect) => effect?.dispose());
      state.histories.forEach((history) => history.dispose());
      state.routes.forEach((route) => route.disconnect());
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
        routes: Array.from({length: 4}, () => {
          const gain = this.ctx.createGain(); gain.connect(this.nodes[d.index].input); return gain;
        }),
      };
      this.stemStates.set(d.index, state);
    }
    return state;
  }
  updateStems(d) {
    const voice = this.voices.get(d.index);
    const state = this.stemStates.get(d.index);
    if (!state || state.track !== d.track) return;
    const originalMix = !voice?.stemSlipTransport && d.stems.every(Boolean) && !d.stemFX.some(Boolean);
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
          effect.output.connect(state.routes[i]);
          state.effects[i] = effect;
        })
        .catch((error) => {
          if (error.name !== "AbortError") this.onError?.(error);
        });
    });
    if (voice) voice.stemInitialized = true;
  }
  async setReverse(d, reverse) {
    if (d.stemSlip && d.stemSlip !== "off") {
      d.reverse = reverse;
      if (reverse) {
        await this.beginStemSlipGesture(d, "transport:reverse");
        await this.voices.get(d.index)?.stemSlipTransport.command("reverse", {owner: "transport:reverse", reverse});
      } else await this.endStemSlipGesture(d, "transport:reverse");
      return;
    }
    const playing = d.playing || d.processing;
    this.pause(d, { preserveStemExit: true });
    d.reverse = reverse;
    if (playing) await this.start(d);
  }
  // Stem Slip is an independent browser policy, not a vendor state-table claim.
  // All positions are original-track seconds; scratch velocity is signed
  // original-track seconds per AudioContext second (bounded to +/-16).
  stemSlipClockPosition(clock, duration, time) {
    let position = clock.position + (clock.playing ? Math.max(0, time - clock.time) * clock.rate * (clock.reverse ? -1 : 1) : 0);
    if (clock.loop && clock.loopOut > clock.loopIn) {
      const size = clock.loopOut - clock.loopIn;
      if (position >= clock.loopOut || (clock.reverse && position < clock.loopIn))
        position = clock.loopIn + ((position - clock.loopIn) % size + size) % size;
    }
    return Math.max(0, Math.min(duration, position));
  }
  stemSlipState(d) {
    const state = this.voices.get(d.index)?.stemSlipTransport?.state();
    return state || {mode: d.stemSlip || "off", phase: d.stemSlipPhase || "idle",
      position: d.position, selectedPosition: d.position, playing: false,
      audition: false, owner: null, release: null, rate: d.rate};
  }
  selectedPosition(d) { return this.stemSlipState(d).selectedPosition; }
  async queryStemSlipState(d) {
    return this.voices.get(d.index)?.stemSlipTransport?.command("query") || this.stemSlipState(d);
  }
  async setStemSlip(d, mode) {
    if (!["off", "vocal", "instrumental"].includes(mode)) throw new Error("Unknown Stem Slip mode.");
    this.stemSlipRateTokens.set(d.index, (this.stemSlipRateTokens.get(d.index) || 0) + 1);
    const active = this.voices.get(d.index)?.stemSlipTransport;
    if (mode === "off") {
      const was = d.playing, position = this.position(d);
      this.pause(d, {preserveStemExit: true});
      d.stemSlip = "off"; d.stemSlipPhase = "idle";
      this.stemSlipTracks.delete(d.index);
      d.position = position;
      this.setCross(this.cross);
      if (was && d.track && position < d.track.duration) await this.start(d);
      return;
    }
    if (!d.track || d.track.provider || d.track.missing || !this.stemBuffers.has(d.track.id))
      throw new Error("Prepare four real local stems before using Stem Slip.");
    d.slip = false; d.slipOrigin = null;
    d.stemSlip = mode;
    this.stemSlipTracks.set(d.index, d.track);
    this.stemSlipOwners.delete(d.index);
    if (active) {
      await active.command("mode", {mode});
      d.stemSlipPhase = "idle";
      this.updateStems(d); this.setCross(this.cross);
      return;
    }
    await this.startStemSlip(d, d.playing || d.processing);
  }
  async stemSlipBuffers(d, signal) {
    const buffers = this.stemBuffers.get(d.track.id);
    if (!buffers) throw new Error("Prepared stem audio is unavailable.");
    const transformed = d.keylock || (d.keyShift || 0) !== 0;
    const tempo = d.rate, shift = d.keyShift || 0, keylock = d.keylock;
    const rendered = [];
    for (const buffer of buffers) rendered.push(transformed
      ? await this.keylockRenderer.render(buffer, {tempo,
        semitones: shift + (keylock ? 0 : 12 * Math.log2(tempo)), signal})
      : buffer);
    return {buffers: rendered, scale: transformed ? tempo : 1};
  }
  async refreshStemSlipBuffers(d) {
    const voice = this.voices.get(d.index), track = d.track;
    if (!voice?.stemSlipTransport) return;
    this.transforms.get(d.index)?.abort();
    const controller = new AbortController(); this.transforms.set(d.index, controller);
    d.processing = true; this.onProcessing(d);
    try {
      const prepared = await this.stemSlipBuffers(d, controller.signal);
      if (controller.signal.aborted || d.track !== track || this.voices.get(d.index) !== voice) return;
      await voice.stemSlipTransport.replaceBuffers(prepared.buffers, prepared.scale,
        {rate: d.rate, bpm: d.track.bpm || 120});
    } catch (error) { if (error.name !== "AbortError") throw error; }
    finally {
      if (this.transforms.get(d.index) === controller) {
        this.transforms.delete(d.index); d.processing = false; this.onProcessing(d);
      }
    }
  }
  async startStemSlip(d, playing) {
    const prior = this.stemSlipPending.get(d.index);
    if (prior && !prior.controller.signal.aborted && prior.track === d.track && prior.mode === d.stemSlip) {
      prior.playing ||= playing;
      return prior.promise;
    }
    this.deckStates.set(d.index, d);
    const clock = prior?.track === d.track && !prior.controller.signal.aborted ? prior.clock : {
      position: this.position(d), time: this.ctx?.currentTime || 0, playing: d.playing,
      rate: d.rate, reverse: d.reverse, loop: d.loop, loopIn: d.loopIn, loopOut: d.loopOut,
      keylock: d.keylock, keyShift: d.keyShift,
    };
    this.transforms.get(d.index)?.abort();
    const controller = new AbortController(), track = d.track;
    const token = (this.startTokens.get(d.index) || 0) + 1;
    this.startTokens.set(d.index, token); this.transforms.set(d.index, controller);
    const request = {track, mode: d.stemSlip, playing, clock, controller, revision: 0};
    this.stemSlipPending.set(d.index, request);
    const current = () => !controller.signal.aborted && d.track === track &&
      d.stemSlip === request.mode && this.startTokens.get(d.index) === token;
    d.processing = true; this.onProcessing(d);
    request.promise = (async () => {
      let voice, committed = false;
      try {
        await this.resume();
        const state = this.ensureStemState(d);
        const transport = createStemSlipTransport(this.ctx, {
          onState: value => {
            if (this.voices.get(d.index) !== voice) return;
            d.stemSlipPhase = value.phase;
            if (value.ended) {
              d.position = track.duration; d.playing = false;
              d.stemSlip = "off"; d.stemSlipPhase = "idle";
              this.stemSlipOwners.delete(d.index);
              this.transforms.get(d.index)?.abort();
              this.stopSource(d.index, {preserveStemExit: true});
              this.setCross(this.cross); this.onEnd(d);
            }
          },
          onError: error => { if (this.voices.get(d.index) === voice) this.pause(d); this.onError?.(error); },
        });
        voice = {sources: [], stemSlipTransport: transport, stemGains: []};
        for (let i = 0; i < 5; i++) {
          const gain = this.ctx.createGain(); gain.gain.value = 0;
          gain.connect(i === 0 ? this.nodes[d.index].input : state.routes[i - 1]);
          voice.stemGains.push(gain);
          if (i > 0) {
            transport.node.connect(state.histories[i - 1].node, i - 1);
            state.histories[i - 1].node.connect(gain);
          }
        }
        // Revisions cancel only candidate rendering, never the audible normal
        // voice. Its immutable effective clock survives requested tempo changes.
        while (current()) {
          const revision = request.revision, preparation = new AbortController();
          request.preparation = preparation;
          const abort = () => preparation.abort();
          controller.signal.addEventListener("abort", abort, {once: true});
          let prepared;
          try { prepared = await this.stemSlipBuffers(d, preparation.signal); }
          catch (error) {
            if (error.name === "AbortError" && current() && revision !== request.revision) continue;
            throw error;
          } finally { controller.signal.removeEventListener("abort", abort); }
          if (!current()) return;
          if (revision !== request.revision) continue;
          await transport.replaceBuffers(prepared.buffers, prepared.scale);
          if (!current()) return;
          if (revision === request.revision) break;
        }
        if (!current()) return;
        request.committing = true;
        const when = this.ctx.currentTime + .01;
        let position = this.position(d);
        if (request.playing && position >= track.duration) {
          if (clock.playing) { d.stemSlip = "off"; return; }
          position = 0;
        }
        if (clock.playing) position = this.stemSlipClockPosition(clock, track.duration, when);
        this.stopSource(d.index, {preserveStemExit: true});
        this.voices.set(d.index, voice); committed = true;
        d.position = position; d.playing = request.playing;
        this.nodes[d.index].channelBpm = (track.bpm || 120) * d.rate;
        await this.applyChannelFX(d.index);
        if (!current()) return;
        await transport.command("configure", {mode: d.stemSlip, position, playing: request.playing,
          duration: track.duration, rate: d.rate, bpm: track.bpm || 120, startAt: when,
          reverse: d.reverse, loop: d.loop ? {start: d.loopIn, end: d.loopOut} : null});
        this.updateStems(d); this.setCross(this.cross);
        return voice;
      } catch (error) {
        if (committed && this.voices.get(d.index) === voice) this.pause(d);
        else if (error.name !== "AbortError" && current()) {
          d.position = this.stemSlipClockPosition(clock, track.duration, this.ctx.currentTime);
          d.anchorPosition = d.position; d.anchorTime = this.ctx.currentTime;
          d.rate = clock.rate; d.keylock = clock.keylock; d.keyShift = clock.keyShift;
          d.stemSlip = "off"; d.stemSlipPhase = "idle";
        }
        if (error.name !== "AbortError") throw error;
      } finally {
        if (!committed && voice) {
          voice.stemSlipTransport.dispose();
          const state = this.stemStates.get(d.index);
          voice.stemGains.forEach((gain, i) => {
            if (i > 0) { try { state?.histories[i - 1].node.disconnect(gain); } catch {} }
            gain.disconnect();
          });
        }
        if (this.stemSlipPending.get(d.index) === request) this.stemSlipPending.delete(d.index);
        if (this.transforms.get(d.index) === controller) {
          this.transforms.delete(d.index); d.processing = false; this.onProcessing(d);
        }
      }
    })();
    return request.promise;
  }
  async beginStemSlipGesture(d, owner) {
    if (!["vocal", "instrumental"].includes(d.stemSlip)) return false;
    const intent = {owner, track: d.track};
    this.stemSlipOwners.set(d.index, intent);
    let voice = this.voices.get(d.index);
    if (!voice?.stemSlipTransport) voice = await this.startStemSlip(d, d.playing);
    if (!voice || this.stemSlipOwners.get(d.index) !== intent || d.track !== intent.track) return false;
    await voice.stemSlipTransport.command("begin", {owner});
    return this.stemSlipOwners.get(d.index) === intent;
  }
  async stemSlipScratch(d, position, velocity, owner) {
    const intent = this.stemSlipOwners.get(d.index);
    if (!intent || intent.owner !== owner || intent.track !== d.track) return false;
    const transport = this.voices.get(d.index)?.stemSlipTransport;
    if (!transport || !Number.isFinite(position) || !Number.isFinite(velocity)) return false;
    await transport.command("scratch", {owner, position, velocity}); return true;
  }
  async stemSlipCue(d, position, owner) {
    const intent = this.stemSlipOwners.get(d.index);
    if (!intent || intent.owner !== owner || intent.track !== d.track || !Number.isFinite(position)) return false;
    const transport = this.voices.get(d.index)?.stemSlipTransport;
    if (!transport) return false;
    await transport.command("cue", {owner, position}); return true;
  }
  async endStemSlipGesture(d, owner, {immediate = false} = {}) {
    if (owner == null && immediate) {
      this.stemSlipOwners.delete(d.index);
      const transport = this.voices.get(d.index)?.stemSlipTransport;
      if (transport) await transport.command("cancel");
      return !!transport;
    }
    const intent = this.stemSlipOwners.get(d.index);
    if (!intent || intent.owner !== owner) return false;
    this.stemSlipOwners.delete(d.index);
    const pending = this.stemSlipPending.get(d.index);
    if (pending) await pending.promise;
    if (this.stemSlipOwners.has(d.index) || d.track !== intent.track) return false;
    const transport = this.voices.get(d.index)?.stemSlipTransport;
    if (!transport) return false;
    await transport.command("end", {owner, beats: immediate ? 0 : Number(d.stemSlipRelease) || 0});
    return true;
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
    for (const d of this.deckStates.values()) {
      this.pause(d); d.stemSlip = "off"; d.stemSlipPhase = "idle";
    }
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
