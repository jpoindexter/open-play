import { createEffect } from "./effects.js";
import { prepareExtendedEffects } from "./extended-effects.js";
import { KeylockRenderer } from "./keylock.js";
import { DeckScratchCache } from "./deck-scratch-cache.js";
import { KeylockScratchShadow, canRetainScratchShadow } from './keylock-scratch-shadow.js';
import { createSilentAudioPull, prepareSilentAudioPull } from './silent-audio-pull.js';
import { advanceDeckScratchPosition } from "./deck-scratch-kernel.js";
import { prepareDeckScratch, createDeckScratchTransport } from "./deck-scratch.js";
import { prepareStemHistory, createStemHistory } from "./stem-history.js";
import { createStemExitFX } from "./stem-exit-fx.js";
import { prepareStemSlip, createStemSlipTransport } from "./stem-slip.js";
import { createVideoAnalysis } from "./video-analysis.js";
import { describeAudioVideoLinks } from "./video-audio-fx-state.js";
import { effectiveFXBPM, normalizeFXTempoSettings } from "./fx-tempo.js";
import {createAudioMonitor,monitorSettings as normalizeMonitorSettings} from './audio-monitor.js';
import {createWarpLoopTransport} from './warp-loop.js';
import {createSyncTempoHandoff} from './sync-tempo-handoff.js';
import {createReverseCensorPlan} from './reverse-censor-plan.js';
import {CensorBacking} from './censor-backing.js';
import {createBeatgrid} from './beatgrid.js';
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
    this.monitorSettings=normalizeMonitorSettings();
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
    this.deckScratchRequests = new Map();
    this.deckScratchShadows = new Map();
    this.deckScratchGeneration = 0;
    this.scratchCache = new DeckScratchCache({buffer: track => this.buffer(track), stems: track => this.stemBuffers.get(track.id),
      prepare: deck => this.prepareOrdinaryScratch(deck), nextGeneration: () => ++this.deckScratchGeneration,
      beforeClear: (index,entry) => {if (this.voices.get(index)?.deckScratchTransport === entry.transport) this.pause(entry.deck,{preserveStemExit:true});},
      onPhase: (entry,phase,error) => {if (entry.deck.track === entry.track) {entry.deck.scratchWarmState = phase; entry.deck.scratchWarmError = error?.name === 'AbortError' ? '' : error?.message || '';}}
    });
    this.retiringVoices = new Map();
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
    this.master.connect(this.destination);
    for (let i = 0; i < 4; i++) {
      const input = this.ctx.createGain(),
        low = this.ctx.createBiquadFilter(),
        mid = this.ctx.createBiquadFilter(),
        high = this.ctx.createBiquadFilter(),
        filter = this.ctx.createBiquadFilter(),
        gain = this.ctx.createGain(),monitorTap=this.ctx.createGain(),
        cueTap=this.ctx.createGain(),ordinaryCue=this.ctx.createGain();
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
      high.connect(monitorTap);monitorTap.connect(gain);
      monitorTap.connect(ordinaryCue);ordinaryCue.connect(cueTap);
      gain.connect(this.masterInput);
      this.nodes.push({
        input,
        low,
        mid,
        high,
        filter,
        gain,
        monitorTap,cueTap,ordinaryCue,
        pfl:false,eqTargets:{low:0,mid:0,high:0},
        level: 0.8,
        trim: 1,
      });
    }
    this.audioMonitor=createAudioMonitor(this.ctx,{master:this.analyser,deckTaps:this.nodes.map(n=>n.cueTap),settings:this.monitorSettings});
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
    if (track.file || track.readFile) {
      const file=track.file||await track.readFile();
      const b = await this.ctx.decodeAudioData(await file.arrayBuffer());
      track.file=file;
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
    const gridVoice=this.voices.get(d.index);
    if(gridVoice?.handoffBefore&&this.ctx.currentTime<gridVoice.handoffBefore.until)return gridVoice.handoffBefore.clock(this.ctx.currentTime);
    if(gridVoice?.censorReverse)return d.track.duration-gridVoice.censorReverse.position();
    if (gridVoice?.gridTimeline) return this.voiceClock(d,gridVoice)(this.ctx.currentTime);
    const live = this.voices.get(d.index)?.liveKeylock;
    if (live) {
      const bridge = this.voices.get(d.index).handoffBefore;
      if (bridge && this.ctx.currentTime < bridge.until) return bridge.clock(this.ctx.currentTime);
      return live.position();
    }
    const scratch = this.voices.get(d.index)?.deckScratchTransport;
    if (scratch) {
      const value = scratch.state();
      if (value.phase === 'idle' && value.playing)
        return advanceDeckScratchPosition(value.audiblePosition, Math.max(0, this.ctx.currentTime - value.audioTime) * value.rate * (value.reverse ? -1 : 1), value.duration, value.loop);
      return value.audiblePosition;
    }
    const split = this.voices.get(d.index)?.stemSlipTransport;
    if (split) return split.state().position;
    const pending = this.stemSlipPending.get(d.index);
    if (pending && pending.track === d.track && !pending.controller.signal.aborted)
      return this.stemSlipClockPosition(pending.clock, d.track.duration, this.ctx?.currentTime || 0);
    if (!d.playing || !this.ctx) return d.position;
    let p =
      d.anchorPosition +
      Math.max(0, this.ctx.currentTime - d.anchorTime) *
        this.voiceRateAt(d,gridVoice,this.ctx.currentTime) *
        (d.reverse ? -1 : 1);
    if (d.loop && d.loopOut > d.loopIn) {
      const n = d.loopOut - d.loopIn;
      if (p >= d.loopOut || (d.reverse && p < d.loopIn))
        p = d.loopIn + ((((p - d.loopIn) % n) + n) % n);
    }
    return Math.max(0, Math.min(d.track?.duration || 48, p));
  }
  stopSource(i, { preserveStemExit = false } = {}) {
    this.deckScratchShadows.get(i)?.dispose();
    const source = this.voices.get(i);
    if (source) {this.disposeVoice(i, source); this.voices.delete(i);}
    for (const job of this.retiringVoices.get(i) || []) {clearTimeout(job.timer); this.disposeVoice(i, job.voice);}
    this.retiringVoices.delete(i);
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
  disposeVoice(i, source) {
    source.censorBacking?.dispose();source.censorBacking=null;
    source.censorOwnerController?.abort();
    source.censorReverse?.dispose().catch(error=>this.onError?.(error));
    source.warpLoopTransport?.dispose();
    source.stemSlipTransport?.dispose();
    if (source.deckScratchTransport) {
      const transport = source.deckScratchTransport;
      if (this.scratchCache.owns(transport)) {
        const current = this.voices.get(i), request = this.deckScratchRequests.get(i);
        const adopted = current !== source && current?.deckScratchTransport === transport ||
          request?.transport === transport && request.beginPosted && !request.controller.signal.aborted && request.owner !== source.scratchOwner;
        if (!adopted) transport.command('pause',{generation:transport.state().generation}).catch(error=>{if(error.name!=='AbortError')this.onError?.(error);});
        // Disconnect this retiring owner's gates only. A newer gesture can be
        // using the same prepared node through different output connections.
        for (const [output,gate] of (source.sourceGates || []).entries()) {try{transport.node.disconnect(gate,output,0);}catch{}}
      } else transport.dispose();
    }
    source.liveOwnerController?.abort();
    source.liveKeylock?.dispose().catch(error => this.onError?.(error));
    for (const item of source.sources || [source]) {
      item.onended = null; try {item.stop();} catch {} item.disconnect();
    }
    const state = source.stemHistoryState || this.stemStates.get(i);
    for (const [index, history] of (state?.histories || []).entries()) {
      const gain = source.stemGains?.[index + 1];
      if (gain) {try {history.node.disconnect(gain);} catch {}}
    }
    for (const gain of [...(source.stemGains || []), ...(source.sourceGates || [])]) gain.disconnect();
  }
  retireVoiceAt(i, voice, when) {
    if (!voice) return;
    const end = when + .01;
    for (const gate of voice.sourceGates || []) {
      gate.gain.cancelScheduledValues(when); gate.gain.setValueAtTime(1, when); gate.gain.linearRampToValueAtTime(0, end);
    }
    // Gated voices stop after their10ms audio-time fade. A legacy ungated
    // voice still stops at the handoff boundary.
    for (const source of voice.sources || []) {source.onended = null; try {source.stop(voice.sourceGates?.length?end:when);} catch {}}
    const jobs = this.retiringVoices.get(i) || new Set(); this.retiringVoices.set(i, jobs);
    const job = {voice, timer: null}; jobs.add(job);
    const poll = () => {
      if (this.ctx.currentTime < end) {job.timer = setTimeout(poll, Math.min(100, Math.max(10, (end - this.ctx.currentTime) * 1000))); return;}
      jobs.delete(job); if (!jobs.size) this.retiringVoices.delete(i); const current=this.voices.get(i);if(current?.handoffBefore?.owner===voice)current.handoffBefore=null;this.disposeVoice(i, voice);
    };
    job.timer = setTimeout(poll, Math.max(10, (end - this.ctx.currentTime) * 1000));
  }
  voiceClock(d, voice) {
    if(voice?.handoffBefore&&!voice.gridTimeline&&!voice.liveKeylock){const bridge=voice.handoffBefore,after=this.voiceClock(d,{...voice,handoffBefore:null});return at=>at<bridge.until?bridge.clock(at):after(at);}

    if(voice?.censorReverse){const duration=d.track.duration;return at=>voice.handoffBefore&&at<voice.handoffBefore.until?voice.handoffBefore.clock(at):duration-voice.censorReverse.position(at);}
    if (voice?.gridTimeline) return at => voice.handoffBefore && at < voice.handoffBefore.until ? voice.handoffBefore.clock(at) : voice.gridTimeline.clock(at);
    if (voice?.liveKeylock) return at => voice.handoffBefore && at < voice.handoffBefore.until ? voice.handoffBefore.clock(at) : voice.liveKeylock.position(at);
    if (voice?.deckScratchTransport) return at => {
      const value = voice.deckScratchTransport.state();
      return value.phase === 'idle' && value.playing ? advanceDeckScratchPosition(value.audiblePosition,
        Math.max(0, at - value.audioTime) * value.rate * (value.reverse ? -1 : 1), value.duration, value.loop) : value.audiblePosition;
    };
    const start = d.anchorPosition, time = d.anchorTime, rate = this.voiceRateAt(d,voice,this.ctx?.currentTime||0) * (d.reverse ? -1 : 1), playing = d.playing,
      position = d.position, duration = d.track.duration, loop = d.loop ? {start:d.loopIn,end:d.loopOut} : null;
    return at => playing ? advanceDeckScratchPosition(start, Math.max(0,at-time)*rate, duration,loop) : position;
  }
  audibleRate(d) {
    const voice = this.voices.get(d.index);
    return this.voiceRateAt(d, voice, this.ctx?.currentTime || 0);
  }
  voiceRateAt(d, voice, at) {
    if (voice?.handoffBefore && at < voice.handoffBefore.until) return voice.handoffBefore.rate(at);
    if(voice?.censorReverse)return voice.censorReverse.stateAt(at).rate;
    if (voice?.gridTimeline) return voice.gridTimeline.rateAt(at);
    if (voice?.liveKeylock) return voice.liveKeylock.stateAt(at).rate;
    if (voice?.deckScratchTransport) return voice.deckScratchTransport.state().rate;
    const source = voice?.sources?.[0];
    return source?.playbackRate ? source.playbackRate.value * (voice.timelineScale || 1) : d.rate;
  }
  async waitForVoiceRetirement(index, signal) {
    const started = performance.now();
    while (this.retiringVoices.get(index)?.size) {
      if (signal.aborted) throw new DOMException('Live preparation superseded.', 'AbortError');
      if (performance.now() - started > 5000) throw Object.assign(new Error('Previous live handoff did not retire within5seconds.'), {name:'TimeoutError'});
      await new Promise(resolve => setTimeout(resolve, 20));
    }
  }
  async createForwardKeylock(options) {
    const {createLiveKeylock} = await import('./keylock-shadow-live.js');
    void prepareSilentAudioPull(this.ctx).catch(()=>{});
    return createLiveKeylock(this.ctx, options);
  }
  createScratchShadowPull(options) {return createSilentAudioPull(this.ctx,options);}
  failKeylockScratchShadow(d,lease,error) {
    if(this.deckScratchShadows.get(d.index)!==lease)return;
    if(d.track!==lease.track){lease.dispose();return;}
    const position=this.position(d);this.pause(d);d.position=position;this.onProcessing(d);this.onError?.(error);
  }
  async startWarpLoop(d,buffers,controller,current,{positionAt,priorClock,keylock=false,semitones=0,handoff=null}={}){
    const old=this.voices.get(d.index),playing=d.playing,oldClock=priorClock||this.voiceClock(d,old);let transport,committed=false;
    try{
      const loop={start:d.loopIn,end:d.loopOut},initialTimeline=this.onGridTimeline(d,{position:d.position,when:this.ctx.currentTime}),transformed=keylock||semitones!==0;
      if(transformed){const rendered=[];for(const buffer of buffers){rendered.push(await this.keylockRenderer.renderWarpLoop(buffer,{track:d.track,loop,bpm:initialTimeline.bpm,keylock,semitones,signal:controller.signal}));if(!current())return;}buffers=rendered;}
      transport=await createWarpLoopTransport(this.ctx,buffers,{signal:controller.signal,onError:error=>{const current=this.voices.get(d.index);if(current?.censorBacking?.liveVoice.warpLoopTransport===transport)current.censorBacking.fail(error);else if(current?.warpLoopTransport===transport){this.pause(d);this.onError?.(error);}}});
      if(!current())return;
      const when=handoff?await handoff.prepared(d.index,this.ctx.currentTime+.05):this.ctx.currentTime+.05;
      const position=positionAt?positionAt(when):playing?oldClock(when):d.position;
      const timeline=this.onGridTimeline(d,{position,when});
      const ack=await transport.start({track:{bpm:d.track.bpm,grid:d.track.grid,duration:d.track.duration,gridWarpMarkers:d.track.gridWarpMarkers},loop:timeline.loop,bpm:timeline.bpm,position,when,renderedLoop:transformed});
      if(handoff)await handoff.arm(d.index);
      if(!current())return;
      const voice={sources:[],warpLoopTransport:transport,liveOwnerController:controller,gridTimeline:timeline,stemGains:[],handoffBefore:old&&playing?{until:when,owner:old,clock:oldClock,rate:at=>this.voiceRateAt(d,old,at)}:null};
      this.routeOrdinaryVoice(d,voice,transport.outputs,buffers.length===5,{when,reuseVoice:old});committed=true;this.retireVoiceAt(d.index,old,when);
      d.position=ack.position;d.anchorPosition=ack.position;d.anchorTime=when;d.playing=true;
    }finally{if(!committed)transport?.dispose();}
  }
  async startForwardKeylock(d, buffers, controller, current, {positionAt, priorClock,handoff=null} = {}) {
    const track = d.track, old = this.voices.get(d.index), initiallyPlaying = d.playing, oldClock = priorClock || this.voiceClock(d, this.voices.get(d.index));
    let adapter, committed = false;
    try {
      await this.waitForVoiceRetirement(d.index, controller.signal);
      if (!current()) return;
      const prospectiveGrid=this.onGridTimeline?.(d,{position:this.position(d),when:this.ctx.currentTime});
      adapter = await this.createForwardKeylock({buffers, position: this.position(d), rate: d.rate,
        resamplePitch:true,
        pitchRateMap:prospectiveGrid?[{position:0,rate:prospectiveGrid.bpm/prospectiveGrid.grid[0].bpm},...prospectiveGrid.grid.slice(1).map(node=>({position:node.time,rate:prospectiveGrid.bpm/node.bpm}))]:null,
        keylock: !!d.keylock, semitones: d.keyShift || 0, signal: controller.signal,
        onEvent: event => {
          const backing=this.voices.get(d.index)?.censorBacking;
          if(backing?.liveVoice.liveKeylock===adapter){if(event.type==='error')backing.fail(Object.assign(Error(event.error.message),{name:event.error.name}));return;}
          const shadow=this.deckScratchShadows.get(d.index);
          if(shadow?.adapter===adapter){
            if(event.type==='error')shadow.fail(Object.assign(Error(event.error.message),{name:event.error.name}));
            if(event.type==='ended'){this.pause(d);d.position=track.duration;this.onEnd(d);}
            return;
          }
          if (this.voices.get(d.index)?.liveKeylock !== adapter) return;
          if (event.type === 'ended') {this.pause(d,{preserveStemExit:true});d.position=track.duration;this.onEnd(d);}
          if (event.type === 'error') {const position = adapter.position(); this.pause(d); d.position = position; this.onProcessing(d); this.onError?.(Object.assign(new Error(event.error.message), {name: event.error.name}));}
        }});
      if (!current()) return;
      // Preparation can advance the old audible clock. Choose its position AT
      // the returned future output time, rather than replaying a stale cursor.
      const lead = Math.max(...adapter.snapshot().groups.map(group => group.latency), 0) + .05;
      const when = handoff?await handoff.prepared(d.index,this.ctx.currentTime+lead):this.ctx.currentTime+lead;
      let position = this.position(d);
      if (initiallyPlaying && old === this.voices.get(d.index)) position = oldClock(when);
      if (positionAt) position = positionAt(when);
      if (!Number.isFinite(position) || position < 0 || position > track.duration) throw new RangeError("Invalid synchronized source position.");
      if (position >= track.duration) position = initiallyPlaying ? track.duration : 0;
      const gridTimeline=this.onGridTimeline?.(d,{position,when});
      if(gridTimeline && typeof adapter.startTimeline !== 'function')throw new Error('This pitch backend cannot schedule Beat Warp Markers.');
      const ack = gridTimeline ? await adapter.startTimeline({position,when,events:gridTimeline.events}) : await adapter.start({position, when});
      if(handoff)await handoff.arm(d.index);
      if (!current()) return;
      const voice = {sources: [], liveKeylock: adapter, liveOwnerController: controller, gridTimeline, stemGains: [],
        handoffBefore: old && initiallyPlaying ? {until: ack.when, owner:old, clock: oldClock, rate: at => this.voiceRateAt(d, old, at)} : null};
      this.routeOrdinaryVoice(d, voice, adapter.outputs, buffers.length === 5, {when: ack.when, reuseVoice: old});
      committed = true;
      this.retireVoiceAt(d.index, old, ack.when);
      d.position = ack.position; d.anchorPosition = ack.position; d.anchorTime = ack.when; d.playing = ack.playing;
    } finally {if (!committed) await adapter?.dispose();}
  }
  async start(d, {positionAt, priorClock,handoff=null} = {}) {
    this.onValidateTransport?.(d);
    this.cancelDeckScratchRequest(d);
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
    handoff?.watch(d.index,controller,()=>this.startTokens.get(d.index)===token&&d.track===track);
    try {
      await this.resume();
      this.nodes[d.index].channelBpm = (track.bpm || 120) * this.audibleRate(d);
      await this.applyChannelFX(d.index);
      const original = await this.buffer(track);
      const stems = this.stemBuffers.get(track.id);
      let buffers = stems ? [original, ...stems] : [original];
      const transformed = keylock || shift !== 0;
      const scale = transformed ? tempo : 1;
      if (!current()) return;
      if(d.loop&&track.gridWarpMarkers?.length&&this.onGridTimeline?.(d,{position:d.position,when:this.ctx.currentTime})){
        if(d.reverse)throw Error('Warped loops with reverse are not available yet.');
        await this.startWarpLoop(d,buffers,controller,current,{positionAt,priorClock,keylock,semitones:shift,handoff});return;
      }
      if (transformed && !d.reverse && !d.loop) {
        await this.startForwardKeylock(d, buffers, controller, current, {positionAt, priorClock,handoff});
        return;
      }
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
      let syncWhen = null;
      if (positionAt) {
        syncWhen = handoff?await handoff.prepared(d.index,this.ctx.currentTime+.03):this.ctx.currentTime+.03;
        const aligned = positionAt(syncWhen);
        if (!Number.isFinite(aligned) || aligned < 0 || aligned >= track.duration) throw new RangeError("Invalid synchronized source position.");
        d.position = aligned;
      }
      if (!d.reverse && d.position >= track.duration) d.position = 0;
      const when = syncWhen ?? this.ctx.currentTime + .01;
      const gridTimeline = this.onGridTimeline?.(d,{position:d.position,when});
      if (gridTimeline && (transformed || d.reverse || d.loop)) throw new Error("Warped Sync with keylock, pitch shift, reverse or loops is not available yet.");
      const old=handoff?this.voices.get(d.index):null;
      if(!handoff)this.stopSource(d.index, { preserveStemExit: true });
      const sources = buffers.map((buffer) => {
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = transformed ? 1 : tempo;
        for (const event of gridTimeline?.events || []) source.playbackRate.setValueAtTime(event.rate,event.when);
        source.loop = d.loop;
        source.loopStart =
          (d.reverse ? track.duration - d.loopOut : d.loopIn) / scale;
        source.loopEnd =
          (d.reverse ? track.duration - d.loopIn : d.loopOut) / scale;
        return source;
      });
      if(handoff){
        const voice={sources,timelineScale:scale,gridTimeline,stemGains:[],handoffBefore:old?{until:when,owner:old,clock:priorClock,rate:at=>this.voiceRateAt(d,old,at)}:null};let committed=false;
        try{
          sources.forEach(source=>source.start(when,Math.max(0,Math.min(source.buffer.duration-1/source.buffer.sampleRate,d.position/scale))));
          await handoff.arm(d.index);if(!current())return;
          this.routeOrdinaryVoice(d,voice,sources,!!stems,{when,reuseVoice:old});committed=true;this.retireVoiceAt(d.index,old,when);
          d.anchorPosition=d.position;d.anchorTime=when;d.playing=true;
          sources[0].onended=()=>{if(this.voices.get(d.index)!==voice)return;this.stopSource(d.index,{preserveStemExit:true});d.position=track.duration;d.playing=false;this.onEnd(d);};
          return;
        }finally{if(!committed)this.disposeVoice(d.index,voice);}
      }
      const voice = sources[0];
      voice.sources = sources;
      voice.sourceGates=sources.map(()=>this.ctx.createGain());
      voice.timelineScale = scale;
      voice.gridTimeline = gridTimeline;
      const stemState = stems ? this.ensureStemState(d) : null;
      voice.stemHistoryState = stemState;
      voice.stemGains = stems
        ? sources.map((_, index) => {
            const gain = this.ctx.createGain();
            gain.gain.value = 0;
            gain.connect(index === 0 ? this.nodes[d.index].input : (stemState.inputs||stemState.routes)[index - 1]);
            return gain;
          })
        : [];
      sources.forEach((source, i) => {
        const output=voice.sourceGates[i];source.connect(output);
        if (stemState && i > 0) {
          output.connect(stemState.histories[i - 1].node);
          stemState.histories[i - 1].node.connect(voice.stemGains[i]);
        } else
          output.connect(
            stems ? voice.stemGains[i] : this.nodes[d.index].input,
          );
      });
      this.voices.set(d.index, voice);
      this.setCross(this.cross);
      if (stems) this.updateStems(d);
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
      handoff?.fail(error);
      if (error.name !== "AbortError") throw error;
    } finally {
      if (current()) {
        d.processing = false;
        this.transforms.delete(d.index);
        this.onProcessing(d);
      }
    }
  }

  async synchronize(d, {rate, positionAt, priorClock}) {
    const track = d.track, previousRate = d.rate;
    let scheduled = false;
    d.rate = rate;
    try {
      await this.start(d, {priorClock, positionAt: when => {const position = positionAt(when); scheduled = true; return position;}});
      if (!scheduled || d.track !== track || d.rate !== rate || !d.playing)
        throw new DOMException("Sync preparation superseded.", "AbortError");
      return {when: d.anchorTime, position: d.anchorPosition, rate};
    } catch (error) {
      if (d.track === track && d.rate === rate) d.rate = previousRate;
      throw error;
    }
  }

  pause(d, { preserveStemExit = false } = {}) {
    const position = this.position(d);
    this.cancelDeckScratchRequest(d);
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
    this.onManualPosition?.(d);
    if(this.voices.get(d.index)?.gridTimeline){
      const was=d.playing||d.processing;this.pause(d,{preserveStemExit:true});
      d.position=Math.max(0,Math.min(d.track.duration,p));
      if(was&&d.position<d.track.duration)await this.start(d);
      return;
    }
    const live = this.voices.get(d.index)?.liveKeylock;
    if (live) {
      const position = Math.max(0, Math.min(d.track.duration, p));
      let ack; try {ack = await live.seek(position);} catch (error) {if (error.name === 'AbortError') return; throw error;}
      if (this.voices.get(d.index)?.liveKeylock === live) {d.position = ack.position; d.anchorPosition = ack.position; d.anchorTime = ack.when;}
      return;
    }
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
  async setJogBend(d, factor, {voice=this.voices.get(d.index)}={}) {
    if(!Number.isFinite(factor)||factor<.75||factor>1.25)throw new RangeError('Jog bend multiplier is outside .75–1.25.');
    const current=()=>d.playing&&this.voices.get(d.index)===voice;
    if(!voice||!d.track||!current())return false;
    // Piecewise maps and gesture transports need their own future-clock map;
    // never silently replace them with a raw seek or alter a synced group.
    if(voice.gridTimeline||voice.stemSlipTransport||
      (voice.deckScratchTransport&&(voice.deckScratchTransport.state().phase!=='idle'||this.deckScratchRequests.has(d.index)))||
      (factor!==1&&(d.processing||this.deckScratchRequests.has(d.index))))
      throw Error('Jog bend is not available during preparation, warped Sync, scratch or Stem Slip.');
    if(factor!==1&&!voice.liveKeylock&&(d.keylock||d.keyShift))
      throw Error('This rendered loop/reverse pitch path cannot bend while preserving key.');
    const rate=Math.max(.25,Math.min(4,d.rate*factor));
    if(factor!==1)this.onManualPosition?.(d);
    if(voice.deckScratchTransport){
      const transport=voice.deckScratchTransport;
      const ack=await transport.command('rate',{generation:transport.state().generation,rate});
      if(!current())return false;
      d.position=ack.position;d.anchorPosition=ack.position;d.anchorTime=ack.audioTime;
    }else if(voice.liveKeylock){
      const ack=await voice.liveKeylock.update({rate});
      if(!current()||ack.superseded)return false;
      d.position=ack.position;d.anchorPosition=ack.position;d.anchorTime=ack.when;
    }else{
      const position=this.position(d),when=this.ctx.currentTime;
      for(const source of voice.sources)source.playbackRate.value=rate/(voice.timelineScale||1);
      d.position=position;d.anchorPosition=position;d.anchorTime=when;
    }
    return {rate,nominalRate:d.rate};
  }
  async setSyncedRates(changes){
    const saved=changes.map(({deck,rate})=>({deck,rate,previous:deck.rate,track:deck.track,playing:deck.playing,clock:this.voiceClock(deck,this.voices.get(deck.index))}));
    if(saved.some(x=>x.deck.processing&&!x.playing))throw Error('Finish deck preparation before changing group tempo.');
    const active=saved.filter(x=>x.playing);
    const gesture=active.some(x=>this.voices.get(x.deck.index)?.deckScratchTransport||(x.deck.stemSlip&&x.deck.stemSlip!=='off')||x.deck.reverse);
    const requiresPreparation=active.some(x=>x.deck.keylock||x.deck.keyShift||this.voices.get(x.deck.index)?.gridTimeline||this.voices.get(x.deck.index)?.liveKeylock);
    // Preserve the existing immediate AudioParam path for ordinary raw decks.
    // Gesture transports retain their existing path pending group acceptance.
    if(gesture||!requiresPreparation)return Promise.all(saved.map(x=>this.setRate(x.deck,x.rate,{syncInternal:true})));
    const group=active.length?createSyncTempoHandoff(this.ctx,active.map(x=>x.deck.index)):null;
    try{
      const jobs=saved.map(async x=>{
        x.deck.rate=x.rate;
        try{if(x.playing)await this.start(x.deck,{priorClock:x.clock,positionAt:x.clock,handoff:group});}catch(error){group?.fail(error);throw error;}
      });
      const results=await Promise.allSettled(jobs);const failed=results.find(r=>r.status==='rejected');if(failed){group?.fail(failed.reason);throw failed.reason;}group?.finish();
      for(const x of saved)if(this.nodes[x.deck.index]){this.nodes[x.deck.index].channelBpm=x.track.bpm*x.rate;try{await this.applyChannelFX(x.deck.index);}catch(error){this.onError?.(error);}}
      if(this.fxState){for(const x of saved)this.fxState[2][x.deck.index]=x.track.bpm*x.rate;try{this.configureFX(...this.fxState);}catch(error){this.onError?.(error);}}
    }catch(error){
      group?.fail(error);
      for(const x of saved)if(x.deck.track===x.track&&x.deck.rate===x.rate&&(!x.playing||group?.owns(x.deck.index))){
        x.deck.rate=x.previous;x.deck.processing=false;const controller=group?.controller(x.deck.index);if(this.transforms.get(x.deck.index)===controller)this.transforms.delete(x.deck.index);this.onProcessing(x.deck);
      }
      throw error;
    }finally{group?.dispose();}
  }
  async setRate(d, rate, {syncInternal = false} = {}) {
    if (!syncInternal && this.onRateRequest) return this.onRateRequest(d, rate);
    this.cancelDeckScratchRequest(d);
    if (this.voices.get(d.index)?.gridTimeline) {
      const position=this.position(d), was=d.playing;
      this.pause(d,{preserveStemExit:true});d.position=position;d.rate=rate;
      if(was)await this.start(d);
      return;
    }
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
    const live = this.voices.get(d.index)?.liveKeylock;
    if (live) {
      const previous = d.rate; d.rate = rate;
      if (d.processing) return this.start(d); // Supersede prepared settings while old audio continues.
      let ack; try {ack = await live.update({rate});} catch (error) {if (error.name === 'AbortError') return; if (d.rate === rate) d.rate = previous; throw error;}
      if (this.voices.get(d.index)?.liveKeylock !== live || ack.superseded) return;
      d.position = ack.position; d.anchorPosition = ack.position; d.anchorTime = ack.when;
      if (this.nodes[d.index]) {this.nodes[d.index].channelBpm = (d.track.bpm || 120) * this.audibleRate(d); await this.applyChannelFX(d.index);}
      if (this.voices.get(d.index)?.liveKeylock !== live) return;
      if (this.fxState) {this.fxState[2][d.index] = (d.track.bpm || 120) * this.audibleRate(d); this.configureFX(...this.fxState);}
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
    const restart = d.keylock || d.keyShift || d.processing || this.voices.get(d.index)?.deckScratchTransport || this.voices.get(d.index)?.censorReverse;
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
    this.onValidateTransport?.(d,{loop:on,loopIn:start,loopOut:end});
    if(this.voices.get(d.index)?.gridTimeline){
      const prior=this.voiceClock(d,this.voices.get(d.index)),was=d.playing;d.position=this.position(d);d.loop=on;d.loopIn=start;d.loopOut=end;
      if(was)await this.start(d,{priorClock:prior,positionAt:at=>{const p=prior(at);return on&&p>=end?start+((p-start)%(end-start)+(end-start))%(end-start):p;}});
      return;
    }
    if (this.voices.get(d.index)?.deckScratchTransport || this.voices.get(d.index)?.liveKeylock || this.deckScratchRequests.has(d.index)) {
      const was = d.playing; this.pause(d, {preserveStemExit: true});
      d.loop = on; d.loopIn = start; d.loopOut = end;
      if (was) await this.start(d);
      return;
    }
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
      this.audioMonitor?.setPFL(i,!!n.pfl,n.trim);
      n.gain.gain.setTargetAtTime(
        (this.voices.get(i)?.stemSlipTransport ? 1 : side) * n.level * n.trim,
        this.ctx.currentTime,
        0.01,
      );
      const split = this.voices.get(i)?.stemSlipTransport;
      const mode = this.deckStates.get(i)?.stemSlip;
      // Stem Slip applies the crossfader to selected stems before the main EQ.
      // Its cue strip receives the same stem/exit mix before those route gains.
      n.ordinaryCue?.gain.setTargetAtTime(split?0:1,this.ctx.currentTime,.003);
      n.stemMonitor?.gate.gain.setTargetAtTime(split?1:0,this.ctx.currentTime,.003);
      this.stemStates.get(i)?.routes.forEach((route, stem) => {
        const selected = mode === "vocal" ? stem === 0 : stem > 0;
        route.gain.setTargetAtTime(split && selected ? side : 1, this.ctx.currentTime, .003);
      });
    }
  }
  setPFL(index,on){
    if(!Number.isInteger(index)||index<0||index>3||typeof on!=='boolean')throw new TypeError('Cue needs a deck and boolean state.');
    this.init();this.nodes[index].pfl=on;this.audioMonitor.setPFL(index,on,this.nodes[index].trim);
  }
  setMonitorSettings(next){
    const value=normalizeMonitorSettings({...this.monitorSettings,...next});
    this.audioMonitor?.update(value);this.monitorSettings=value;return {...value};
  }
  mix(i, kind, value) {
    this.init();
    const n = this.nodes[i];
    value = Number(value);
    if (kind === "level" || kind === "trim") {
      n[kind] = value;
      this.setCross(this.cross);
    } else if (["low", "mid", "high"].includes(kind)) {
      (n.eqTargets||=( {} ))[kind]=value;
      n[kind].gain.setTargetAtTime(value, this.ctx.currentTime, 0.015);
      n.stemMonitor?.[kind].gain.setTargetAtTime(value,this.ctx.currentTime,.015);
    }
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
    const n=this.nodes[i];
    for(const strip of [n,n.stemMonitor].filter(Boolean)){
      if(strip!==n){strip.channelValue=n.channelValue;strip.channelBpm=n.channelBpm;}
      this.applyChannelFXStrip(strip);
    }
  }
  applyChannelFXStrip(n) {
    const value = n.channelValue || 0,
      name = this.channelFXType;
    if (name === "Filter") {
      n.channelEffect?.dispose();
      n.channelEffect = null;
      n.high.disconnect();
      n.filter.disconnect();
      if (value === 0) {
        n.high.connect(n.monitorTap||n.gain);
        return;
      }
      n.high.connect(n.filter);
      n.filter.connect(n.monitorTap||n.gain);
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
    n.channelEffect.output.connect(n.monitorTap||n.gain);
  }

  updateFXBPMs(bpms) {
    if (!Array.isArray(bpms) || bpms.some(bpm => typeof bpm !== 'number' || !Number.isFinite(bpm) || bpm <= 0))
      throw new TypeError('FX track tempos must be finite positive numbers.');
    for (const [index,bpm] of bpms.entries()) {
      const node = this.nodes[index];
      if (node && node.channelBpm !== bpm) {node.channelBpm = bpm; if (node.channelEffect) this.applyChannelFX(index).catch(error => this.onError?.(error));}
    }
    if (!this.fxState) return false;
    const prior = this.fxState[2];
    if (prior.length === bpms.length && prior.every((bpm, index) => bpm === bpms[index])) return false;
    this.configureFX(this.fxState[0], this.fxState[1], [...bpms], this.fxState[3]);
    return true;
  }
  configureFX(banks, routes = [], bpms = [120, 120, 120, 120], tempo = []) {
    const settings = normalizeFXTempoSettings(tempo, banks.length);
    const state = [banks, routes, bpms, settings];
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
          effectiveFXBPM(settings[slot.bank], bpms[slot.route] || bpms[0] || 120),
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
          slot.update(spec, effectiveFXBPM(settings[b], bpms[i] || bpms[0] || 120));
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
  videoAnalysis(index = 4) {
    if (!this.ctx) return {bass: 0, mid: 0, treble: 0, level: 0, audioAvailable: false, spectrum8: null, spectrum8Available: false};
    this.videoAnalyzers ||= createVideoAnalysis(this.ctx, [...this.nodes.map(n => n.input), this.master]);
    return this.videoAnalyzers.read(index);
  }
  videoFXLinks() {
    // Semantic snapshot only: no analyzer inference or audio graph mutation.
    return describeAudioVideoLinks(this.fxState, {
      ready: this.ctx?.state === "running" && this.effectsPrepared === true,
    });
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
    this.onValidateTransport?.(d,{keylock,keyShift:semitones});
    this.cancelDeckScratchRequest(d);
    if(this.voices.get(d.index)?.gridTimeline){
      const track=d.track,previous={keylock:d.keylock,keyShift:d.keyShift},clock=this.voiceClock(d,this.voices.get(d.index)),was=d.playing||d.processing;
      d.position=this.position(d);d.keylock=keylock;d.keyShift=semitones;
      try{if(was)await this.start(d,{priorClock:clock,positionAt:clock});}
      catch(error){if(d.track===track&&d.keylock===keylock&&d.keyShift===semitones)Object.assign(d,previous);throw error;}
      return;
    }
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
    const live = this.voices.get(d.index)?.liveKeylock;
    if (live) {
      const previous = {keylock:d.keylock,keyShift:d.keyShift}; d.keylock = keylock; d.keyShift = semitones;
      if (d.processing) return this.start(d);
      let ack; try {ack = await live.update({keylock: !!keylock, semitones});} catch (error) {if (error.name === 'AbortError') return; if (d.keylock === keylock && d.keyShift === semitones) Object.assign(d,previous); throw error;}
      if (this.voices.get(d.index)?.liveKeylock === live && !ack.superseded) {d.keylock = keylock; d.keyShift = semitones;}
      return;
    }
    if(d.playing&&d.loop&&!d.reverse){
      const track=d.track,previous={keylock:d.keylock,keyShift:d.keyShift},clock=this.voiceClock(d,this.voices.get(d.index));
      const handoff=createSyncTempoHandoff(this.ctx,[d.index]);
      d.keylock=keylock;d.keyShift=semitones;
      try{await this.start(d,{priorClock:clock,positionAt:clock,handoff});handoff.finish();}
      catch(error){handoff.fail(error);if(d.track===track&&handoff.owns(d.index)&&d.keylock===keylock&&d.keyShift===semitones)Object.assign(d,previous);throw error;}
      finally{handoff.dispose();}
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
      this.clearDeckScratchCache(d.index);
      if (was) await this.start(d);
    }
  }
  ensureStemMonitor(index) {
    const n=this.nodes[index];
    if(!this.audioMonitor||!n.cueTap||n.stemMonitor)return;
    const input=this.ctx.createGain(),low=this.ctx.createBiquadFilter(),mid=this.ctx.createBiquadFilter(),high=this.ctx.createBiquadFilter(),filter=this.ctx.createBiquadFilter(),gate=this.ctx.createGain();
    for(const [key,node]of Object.entries({low,mid,high,filter})){
      const original=n[key];node.type=original.type;
      for(const parameter of ['frequency','Q','gain'])node[parameter].value=original[parameter].value;
      if(key!=='filter'&&Number.isFinite(n.eqTargets?.[key]))node.gain.setTargetAtTime(n.eqTargets[key],this.ctx.currentTime,.015);
    }
    gate.gain.value=0;input.connect(low);low.connect(mid);mid.connect(high);high.connect(gate);gate.connect(n.cueTap);
    n.stemMonitor={input,low,mid,high,filter,gate,monitorTap:gate,channelValue:n.channelValue,channelBpm:n.channelBpm};
    this.applyChannelFXStrip(n.stemMonitor);
  }
  ensureStemState(d) {
    this.ensureStemMonitor(d.index);
    let state = this.stemStates.get(d.index);
    if (state && state.track !== d.track) {
      state.effects.forEach((effect) => effect?.dispose());
      state.histories.forEach((history) => history.dispose());
      state.routes.forEach((route) => route.disconnect());
      state.inputs?.forEach((input)=>input.disconnect());
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
      state.inputs=state.routes.map(route=>{
        const input=this.ctx.createGain();input.connect(route);
        if(this.nodes[d.index].stemMonitor)input.connect(this.nodes[d.index].stemMonitor.input);
        return input;
      });
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
          effect.output.connect((state.inputs||state.routes)[i]);
          state.effects[i] = effect;
        })
        .catch((error) => {
          if (error.name !== "AbortError") this.onError?.(error);
        });
    });
    if (voice) voice.stemInitialized = true;
  }
  async setReverse(d, reverse) {
    this.onValidateTransport?.(d,{reverse});
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
  // Whole-deck scratch uses original PCM, independently of the pitch renderer.
  // Ownership is invalidated synchronously before asynchronous preparation can commit.
  cancelDeckScratchRequest(d, {preserveShadow=false} = {}) {
    if(!preserveShadow)this.deckScratchShadows.get(d.index)?.dispose();
    const request = this.deckScratchRequests.get(d.index);
    if (!request) return;
    this.deckScratchRequests.delete(d.index);
    request.controller.abort();
    if(request.censor)this.onCensorEnd?.(d,request.owner);
    if(request.stemSlip)void this.endStemSlipGesture(d,request.owner,{immediate:true}).catch(error=>{if(error.name!=='AbortError')this.onError?.(error);});
    // A reused transport may already have accepted Begin while its ACK is in
    // flight. Queue its matching End before any newer owner's Begin.
    if (!request.ready && request.transport && request.beginPosted)
      request.transport.command('end', {generation: request.transport.state().generation, owner: request.owner}).catch(error => {if (error.name !== 'AbortError') this.onError?.(error);});
    d.scratchPreparing = false;
  }
  preloadDeckScratch(d) {
    if (!d.track || d.track.missing || d.track.provider) return Promise.resolve(false);
    this.deckStates.set(d.index,d);return this.scratchCache.get(d);
  }
  clearDeckScratchCache(index) {const deck=this.deckStates.get(index);if(deck)this.cancelDeckScratchRequest(deck);this.scratchCache.clear(index);}
  async prepareOrdinaryScratch(d) {
    const loadedTrack = d.track;
    await this.resume();
    await prepareDeckScratch(this.ctx);
    let lastPosition = this.position(d);
    const transport = createDeckScratchTransport(this.ctx, {
      onState: value => {
        lastPosition = value.audiblePosition;
        if (!value.ended || !d.playing || this.voices.get(d.index)?.deckScratchTransport !== transport) return;
        d.position = value.position; d.playing = false; this.cancelDeckScratchRequest(d);
        this.stopSource(d.index, {preserveStemExit: true}); this.onEnd(d);
      }, onError: error => {
        const wasActive = this.voices.get(d.index)?.deckScratchTransport === transport;
        if (this.scratchCache.peek(d.index)?.transport === transport) this.scratchCache.clear(d.index);
        if (wasActive) {
          if (this.voices.get(d.index)?.deckScratchTransport === transport) this.pause(d);
          if (d.track === loadedTrack) d.position = lastPosition;
          this.onProcessing(d);
        }
        this.onError?.(error);
      }
    });
    return transport;
  }
  routeOrdinaryVoice(d, voice, outputs, stems, {when = null, reuseVoice = null} = {}) {
    const state = stems ? this.ensureStemState(d) : null;
    voice.stemHistoryState = state;
    voice.sourceGates = outputs.map(() => {
      const gate = this.ctx.createGain();
      gate.gain.value = when === null ? 1 : 0;
      if (when !== null) {gate.gain.setValueAtTime(0, when); gate.gain.linearRampToValueAtTime(1, when + .01);}
      return gate;
    });
    const reuse = stems && reuseVoice?.stemHistoryState === state && reuseVoice.stemGains?.length === 5;
    voice.stemInitialized = reuse && reuseVoice.stemInitialized;
    voice.stemGains = reuse ? reuseVoice.stemGains : stems ? outputs.map((_, index) => {
      const gain = this.ctx.createGain(); gain.gain.value = 0;
      gain.connect(index === 0 ? this.nodes[d.index].input : (state.inputs||state.routes)[index - 1]);
      return gain;
    }) : [];
    if (reuse) reuseVoice.stemGains = []; // Transfer sole shared history output ownership.
    outputs.forEach((source, i) => {
      // A scratch node has five distinct output buses; other voices provide gains.
      const connect = destination => voice.deckScratchTransport
        ? source.connect(destination, i, 0) : source.connect(destination);
      const gate = voice.sourceGates[i]; connect(gate);
      if (state && i > 0) {
        gate.connect(state.histories[i - 1].node);
        if (!reuse) state.histories[i - 1].node.connect(voice.stemGains[i]);
      } else gate.connect(stems ? voice.stemGains[i] : this.nodes[d.index].input);
    });
    this.voices.set(d.index, voice);
    this.deckStates.set(d.index, d);
    this.setCross(this.cross);
    if (stems) this.updateStems(d);
  }
  async prepareCensorPitchTransport(d, request) {
    let transport;
    try {
      const original=await this.buffer(d.track),stems=this.stemBuffers.get(d.track.id)||null;
      const rate=d.rate,semitones=(d.keyShift||0)+(d.keylock?0:12*Math.log2(rate));
      const buffers=[];
      for(const buffer of stems?[original,...stems]:[original]){
        const rendered=await this.keylockRenderer.render(buffer,{tempo:rate,semitones,signal:request.controller.signal});
        buffers.push({sampleRate:rendered.sampleRate/rate,channels:Array.from({length:rendered.numberOfChannels},(_,c)=>rendered.getChannelData(c))});
      }
      if(request.controller.signal.aborted)throw new DOMException('Censor preparation canceled.','AbortError');
      transport=await this.prepareOrdinaryScratch(d);request.transport=transport;
      await transport.replaceBuffers({generation:++this.deckScratchGeneration,original:buffers[0],stems:stems?buffers.slice(1):null,signal:request.controller.signal});
      return transport;
    } catch(error){transport?.dispose();throw error;}
  }
  async beginWarpedCensor(d,owner){
    const live=this.voices.get(d.index),request={owner,censor:true,track:d.track,controller:new AbortController(),ready:false,closing:false,reverse:null,backing:null};
    const plan=createReverseCensorPlan(d.track,live.gridTimeline.bpm),clock=this.voiceClock(d,live);this.deckScratchRequests.set(d.index,request);d.scratchPreparing=true;
    const current=()=>this.deckScratchRequests.get(d.index)===request&&d.track===request.track&&d.playing&&!request.controller.signal.aborted;
    let adapter,backing,committed=false;
    try{
      const original=await this.buffer(d.track),stems=this.stemBuffers.get(d.track.id);let buffers=stems?[original,...stems]:[original];
      const loop=d.loop?{start:d.loopIn,end:d.loopOut}:null,reverseLoop=loop?plan.loop(loop):null;
      if(loop&&(d.keylock||d.keyShift)){
        const rendered=[];for(const buffer of buffers){rendered.push(await this.keylockRenderer.renderWarpLoop(buffer,{track:d.track,loop,bpm:live.gridTimeline.bpm,keylock:!!d.keylock,semitones:d.keyShift||0,signal:request.controller.signal}));if(!current())return false;}buffers=rendered;
      }
      buffers=buffers.map(buffer=>this.reverseBuffer(d.track.id,buffer));
      if(!current())return false;
      if(loop){
        const transport=await createWarpLoopTransport(this.ctx,buffers,{signal:request.controller.signal,onError:error=>{if(this.voices.get(d.index)?.censorReverse===adapter){this.pause(d);this.onError?.(error);}}});let timeline=null;
        adapter={outputs:transport.outputs,position:at=>timeline?.clock(at??this.ctx.currentTime)??plan.duration-clock(this.ctx.currentTime),stateAt:at=>({rate:timeline?.rateAt(at??this.ctx.currentTime)??plan.rateAt(plan.duration-clock(this.ctx.currentTime))}),snapshot:()=>({groups:[],loop:reverseLoop,renderedLoop:!!(d.keylock||d.keyShift),timeline}),async dispose(){transport.dispose();},startTimeline:async({position,when})=>{timeline=createBeatgrid(plan.track).timeline({position,when,bpm:live.gridTimeline.bpm,loop:reverseLoop});return transport.start({track:plan.track,loop:reverseLoop,bpm:live.gridTimeline.bpm,position,when,renderedLoop:!!(d.keylock||d.keyShift)});}};
      }else adapter=await this.createForwardKeylock({buffers,position:Math.max(0,plan.duration-clock(this.ctx.currentTime)),rate:plan.rateAt(Math.max(0,plan.duration-clock(this.ctx.currentTime))),keylock:!!d.keylock,semitones:d.keyShift||0,resamplePitch:true,pitchRateMap:plan.points,signal:request.controller.signal,onEvent:event=>{
        if(event.type==='error'&&this.voices.get(d.index)?.censorReverse===adapter){const error=Object.assign(Error(event.error.message),{name:event.error.name});this.pause(d);this.onError?.(error);}
      }});request.reverse=adapter;if(!current())return false;
      backing=await new CensorBacking(this,d,live,request).prepare();request.backing=backing;if(!current())return false;
      const lead=Math.max(...adapter.snapshot().groups.map(g=>g.latency),0)+.05,when=this.ctx.currentTime+lead,position=clock(when),reversePosition=plan.duration-position;
      if(reversePosition<=0)return false;
      const events=loop?null:plan.events(reversePosition,when),ack=await adapter.startTimeline({position:reversePosition,when,events});if(!current())return false;
      const voice={sources:[],stemGains:[],censorReverse:adapter,censorOwnerController:request.controller,censorBacking:backing,handoffBefore:{until:ack.when,owner:live,clock,rate:at=>this.voiceRateAt(d,live,at)}};
      backing.claim(voice,ack.when);this.routeOrdinaryVoice(d,voice,adapter.outputs,!!stems,{when:ack.when,reuseVoice:live});committed=true;request.ready=true;d.scratchPreparing=false;d.position=position;d.anchorPosition=position;d.anchorTime=ack.when;
      return{owner,when:ack.when,position,reversePosition,events};
    }catch(error){if(current()){this.deckScratchRequests.delete(d.index);d.scratchPreparing=false;}if(error.name!=='AbortError')throw error;return false;}
    finally{if(!committed){backing?.dispose();await adapter?.dispose();if(this.deckScratchRequests.get(d.index)===request){this.deckScratchRequests.delete(d.index);d.scratchPreparing=false;}}}
  }
  async beginStemSlipCensor(d,owner){
    if(this.stemSlipOwners.has(d.index))throw new Error('Release the selected-stem gesture before Censor.');
    const request={owner,censor:true,stemSlip:true,track:d.track,mode:d.stemSlip,controller:new AbortController(),ready:false,closing:false};
    this.deckScratchRequests.set(d.index,request);d.scratchPreparing=true;
    const current=()=>this.deckScratchRequests.get(d.index)===request&&!request.controller.signal.aborted&&d.track===request.track&&d.stemSlip===request.mode&&d.playing;
    let committed=false;
    try{
      if(!await this.beginStemSlipGesture(d,owner)||!current())return false;
      const transport=this.voices.get(d.index)?.stemSlipTransport;if(!transport)return false;request.transport=transport;
      await transport.command('reverse',{owner,reverse:true});if(!current())return false;
      request.ready=true;d.scratchPreparing=false;committed=true;
      return{owner,selectedGroup:request.mode,position:this.position(d),selectedPosition:this.selectedPosition(d)};
    }finally{
      if(!committed){if(this.deckScratchRequests.get(d.index)===request){this.deckScratchRequests.delete(d.index);d.scratchPreparing=false;}await this.endStemSlipGesture(d,owner,{immediate:true});}
    }
  }
  async beginDeckScratch(d, owner, {censor=false}={}) {
    if (!d.track || d.track.missing || d.track.provider) return false;
    if (typeof owner !== 'string' || !owner.length) throw new TypeError('Scratch owner required.');
    if(censor){
      if(d.mode==='ABS')throw new Error('Censor is unavailable in Absolute mode.');
      if(!d.playing)return false;
      if(this.deckScratchRequests.has(d.index))throw new Error('Release the current scratch gesture before Censor.');
    }else this.onManualPosition?.(d);
    if (d.stemSlip && d.stemSlip !== 'off') {
      if(censor)return this.beginStemSlipCensor(d,owner);
      throw new Error('Use the selected-stem scratch control while Stem Slip is armed.');
    }
    if(censor&&this.voices.get(d.index)?.gridTimeline)return this.beginWarpedCensor(d,owner);
    let retained=this.deckScratchShadows.get(d.index);
    if(retained&&!retained.sourcesMatch()){retained.dispose();retained=null;}
    this.cancelDeckScratchRequest(d,{preserveShadow:!!retained});
    this.deckStates.set(d.index, d);
    const request = {owner, censor, track: d.track, controller: new AbortController(), transport: null, ready: false, closing: false, wasPlaying: !!(d.playing || d.processing)};
    this.deckScratchRequests.set(d.index, request);
    if(retained){retained.reserve(request);request.shadowLease=retained;}
    const current = () => this.deckScratchRequests.get(d.index) === request && d.track === request.track && !request.controller.signal.aborted && !request.closing;
    const pitchedCensor=censor&&(d.keylock||d.keyShift);
    let transport = pitchedCensor?null:this.voices.get(d.index)?.deckScratchTransport, committed = !!transport;
    let preparedShadow=null;
    d.scratchPreparing = !transport;
    try {
      if (!transport) {
        // Keep an existing ordinary voice audible while preparing, but prevent a
        // pre-existing asynchronous buffered start from committing over this owner.
        const pending=this.transforms.get(d.index),selected=this.voices.get(d.index)?.liveOwnerController;
        if(pending!==selected)pending?.abort();this.transforms.delete(d.index);
        this.startTokens.set(d.index, (this.startTokens.get(d.index) || 0) + 1);
        d.processing = false;
        transport = pitchedCensor?await this.prepareCensorPitchTransport(d,request):await this.preloadDeckScratch(d);
        if (!current()) return false;
        request.transport = transport;
        const live=this.voices.get(d.index);
        if(canRetainScratchShadow(this,d,live)){
          preparedShadow=await new KeylockScratchShadow(this,d,live).prepare(request);
          if(!current())return false;
        }
        const stems = this.stemBuffers.get(request.track.id) || null;
        const generation = transport.state().generation;
        if (!current()) return false;
        // The backing clock begins at commit, after the old voice's preparation span.
        await transport.command('configure', {generation, position: this.position(d), rate: d.rate,
          reverse: !!d.reverse, loop: d.loop ? {start: d.loopIn, end: d.loopOut} : null,
          slip: !!d.slip, playing: request.wasPlaying, startAt: this.ctx.currentTime});
        if (!current()) return false;
        request.beginPosted = true;
        await transport.command(censor?'censor':'begin', {generation, owner});
        if (!current()) return false;
        const voice = {sources: [], deckScratchTransport: transport, scratchOwner:owner, stemGains: []};
        if(preparedShadow){
          preparedShadow.claim(request,voice);request.shadowLease=preparedShadow;
          this.routeOrdinaryVoice(d,voice,Array(stems?5:1).fill(transport.node),stems,{reuseVoice:preparedShadow.liveVoice});
          preparedShadow.sample();
        }else{
          this.stopSource(d.index, {preserveStemExit: true});
          this.routeOrdinaryVoice(d, voice, Array(stems ? 5 : 1).fill(transport.node), stems);
        }
        committed = true;
      } else {
        request.transport = transport;
        const generation = transport.state().generation;
        if (!current()) return false;
        request.beginPosted = true;
        await transport.command(censor?'censor':'begin', {generation, owner});
        if (!current()) return false;
        if(retained)retained.claim(request,this.voices.get(d.index));
      }
      if (this.voices.get(d.index)?.deckScratchTransport === transport) this.voices.get(d.index).scratchOwner = owner;
      request.ready = true; d.scratchPreparing = false; d.playing = request.wasPlaying;
      return {owner, generation: transport.state().generation};
    } catch (error) {
      if(preparedShadow?.ownsLive)this.pause(d);
      if (current()) {this.deckScratchRequests.delete(d.index); d.scratchPreparing = false;}
      if (error.name !== 'AbortError') throw error;
      return false;
    } finally {
      if(!committed)preparedShadow?.dispose();
      if (!committed && !this.scratchCache.owns(transport)) transport?.dispose();
      if (this.deckScratchRequests.get(d.index) === request) d.scratchPreparing = false;
    }
  }
  async updateDeckScratch(d, movement, owner) {
    const request = this.deckScratchRequests.get(d.index);
    if (!request || !request.ready || request.closing || request.owner !== owner || request.track !== d.track || request.controller.signal.aborted) return false;
    const transport = request.transport;
    await transport.command('scratch', {...movement, generation: transport.state().generation, owner});
    return this.deckScratchRequests.get(d.index) === request;
  }
  async endDeckScratch(d, owner, {cancel = false} = {}) {
    const request = this.deckScratchRequests.get(d.index);
    if (!request || request.owner !== owner || request.track !== d.track || request.closing) return false;
    const shadow=this.deckScratchShadows.get(d.index);
    if (!request.ready&&!shadow) {this.cancelDeckScratchRequest(d); return false;}
    request.closing = true;
    if(request.stemSlip){
      const ended=await this.endStemSlipGesture(d,owner,{immediate:true});
      if(this.deckScratchRequests.get(d.index)!==request)return false;
      this.deckScratchRequests.delete(d.index);d.scratchPreparing=false;
      return ended?{owner,position:this.position(d),playing:d.playing,selectedGroup:request.mode,releasedImmediately:true}:false;
    }
    if(request.backing){const result=request.backing.adopt();if(result&&!result.playing){this.pause(d);d.position=result.position;this.onEnd(d);}return result;}
    const transport = request.transport;
    const shadowRevision=shadow?.beginRelease(owner);
    const result = await transport.command('end', {generation: transport.state().generation, owner});
    if (this.deckScratchRequests.get(d.index) !== request || d.track !== request.track) return false;
    if(shadow&&shadowRevision!==false){
      try{
        if(!result.playing){this.pause(d);d.position=result.position;return{owner,canceled:!!cancel,position:result.position,playing:false};}
        const ack=await shadow.align(owner,shadowRevision,result);
        if(!shadow.adopt(owner,shadowRevision,result,ack))return false;
        request.controller.abort();return{owner,canceled:!!cancel,position:result.position,playing:ack.playing};
      }catch(error){
        if(this.deckScratchShadows.get(d.index)===shadow&&shadow.owner===owner&&shadow.revision===shadowRevision){
          this.failKeylockScratchShadow(d,shadow,error);if(error.name!=='AbortError')throw error;
        }
        return false;
      }
    }
    this.deckScratchRequests.delete(d.index); request.controller.abort();
    d.position = result.position; d.playing = result.playing;
    d.loop = !!result.loop; if (result.loop) {d.loopIn = result.loop.start; d.loopOut = result.loop.end;}
    d.anchorPosition = result.position; d.anchorTime = result.audioTime;
    // Preserve raw playback after release; transformed playback currently uses
    // the explicit existing renderer until live adapter integration is verified.
    if (d.playing && (d.keylock || d.keyShift)) await this.start(d);
    return {owner, canceled: !!cancel, position: result.position, playing: result.playing};
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
    this.onValidateTransport?.(d,{stemSlip:mode});
    if (!["off", "vocal", "instrumental"].includes(mode)) throw new Error("Unknown Stem Slip mode.");
    if(this.deckScratchRequests.get(d.index)?.stemSlip)this.cancelDeckScratchRequest(d);
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
              this.cancelDeckScratchRequest(d);
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
          gain.connect(i === 0 ? this.nodes[d.index].input : (state.inputs||state.routes)[i - 1]);
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
    const censor=this.deckScratchRequests.get(d.index);
    if(censor?.stemSlip&&censor.owner!==owner)this.cancelDeckScratchRequest(d);
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
    for(const lease of this.deckScratchShadows.values())lease.dispose();
    this.scratchCache.clearAll();
    for (const d of this.deckStates.values()) {
      this.pause(d); d.stemSlip = "off"; d.stemSlipPhase = "idle";
    }
    for (const controller of this.transforms.values()) controller.abort();
    this.transforms.clear();
    for (const i of this.voices.keys()) this.stopSource(i);
    for (const state of this.stemStates.values())
      state.histories.forEach((history) => history.clear());
    this.stopAllSamples();
    for (const channel of this.nodes) {
      for (const n of [channel,channel.stemMonitor].filter(Boolean)) {
      n.channelEffect?.dispose();
      n.channelEffect = null;
      n.channelValue = 0;
      n.high.disconnect();
      n.filter.disconnect();
      n.high.connect(n.monitorTap||n.gain);
      }
    }
    this.setCross(this.cross);
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
