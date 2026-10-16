import {AudioEngine} from './engine.js';
import {createCueHolds} from './holds.js';
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const deferred = () => { let resolve; const promise = new Promise(yes => { resolve = yes; }); return {promise, resolve}; };
const button = document.querySelector('#run'), summary = document.querySelector('#summary'), output = document.querySelector('#results');
button.onclick = async () => {
  button.disabled = true; document.body.dataset.result = 'running';
  const results = [], engine = new AudioEngine();
  const report = (name, passed, evidence) => {
    results.push({name, passed: !!passed, evidence}); summary.textContent = `${results.filter(x => x.passed).length}/${results.length} passed · ${name}`;
    output.textContent = JSON.stringify(results, null, 2);
  };
  try {
    await engine.resume(); engine.analyser.disconnect(); engine.analyser.fftSize = 8192; engine.analyser.smoothingTimeConstant = 0;
    engine.configureFX([[], []], ['Deck 1', 'Deck 2'], [120, 120, 120, 120]);
    const sr = engine.ctx.sampleRate, duration = 30;
    const make = fn => {
      const buffer = engine.ctx.createBuffer(2, Math.ceil(sr * duration), sr);
      for (let c = 0; c < 2; c++) {
        const samples = buffer.getChannelData(c);
        for (let n = 0; n < samples.length; n++) samples[n] = fn(n / sr);
      }
      return buffer;
    };
    const sine = (frequency, t) => .12 * Math.sin(2 * Math.PI * frequency * t);
    const vocal = t => sine(t < 1.8 ? 220 : t < 3 ? 330 : 1370, t);
    const melody = t => sine(t < 4 ? 440 : 660, t);
    const stemBuffers = [make(vocal), make(melody), make(t => sine(880, t)), make(t => sine(1760, t))];
    const track = {id: 'stem-slip-markers', duration, bpm: 120, cues: [{position: 1}], plays: 0};
    const d = {index: 0, track, position: 4.5, playing: false, processing: false,
      rate: 1, keylock: false, keyShift: 0, reverse: false, loop: false, loopIn: 0, loopOut: 0,
      stems: [true, true, true, true], stemFX: [false, false, false, false], stemSlip: 'off', stemSlipRelease: 0, cue: 1};
    engine.buffers.set(track.id, make(t => vocal(t) + melody(t) + sine(880, t) + sine(1760, t)));
    await engine.attachStems(track, stemBuffers, [d]);
    const errors = [];
    engine.onError = error => errors.push(error.message);
    const holds = createCueHolds({engine, state: {decks: [d]}, quantized: (_d, position) => position,
      record() {}, persist() {}, render() {}, notify: message => errors.push(message)});
    const bins = () => { const values = new Float32Array(engine.analyser.frequencyBinCount); engine.analyser.getFloatFrequencyData(values); return values; };
    const band = (values, frequency) => {
      const index = Math.round(frequency * engine.analyser.fftSize / sr);
      return Math.max(...values.subarray(Math.max(0, index - 2), index + 3));
    };
    const rms = () => { const values = new Float32Array(engine.analyser.fftSize); engine.analyser.getFloatTimeDomainData(values); return Math.sqrt(values.reduce((sum, value) => sum + value * value, 0) / values.length); };
    const state = () => engine.queryStemSlipState(d);
    const aligned = s => Math.abs(s.position - s.selectedPosition) < .005;
    async function settled(maxMs = 4000) {
      const end = performance.now() + maxMs;
      while (performance.now() < end) { const s = await state(); if (s.phase === 'idle') return s; await wait(15); }
      throw new Error('Stem Slip release did not settle.');
    }

    await engine.start(d);
    await engine.setPitch(d, {keylock: true, semitones: 0}); await engine.setRate(d, 1.1);
    const initialRenderer = engine.keylockRenderer.render.bind(engine.keylockRenderer);
    const armGate = deferred(), armEntered = deferred(); let firstArmRender = true;
    engine.keylockRenderer.render = async (...args) => {
      if (firstArmRender) { firstArmRender = false; armEntered.resolve(); await armGate.promise; }
      return initialRenderer(...args);
    };
    const firstArm = engine.setStemSlip(d, 'vocal'); await armEntered.promise;
    const normalVoice = engine.voices.get(0), clockStart = engine.ctx.currentTime, positionStart = engine.position(d);
    const pendingArmRate = engine.setRate(d, 1.2); await wait(220);
    let pendingBins = bins();
    const actualAdvance = engine.position(d) - positionStart, expectedAdvance = (engine.ctx.currentTime - clockStart) * 1.1;
    report('First-arm tempo changes preserve audible normal playback and its effective position clock',
      engine.voices.get(0) === normalVoice && Math.abs(actualAdvance - expectedAdvance) < .025 && band(pendingBins, 1370) > -65 && band(pendingBins, 1494.5) < -85,
      {actualAdvance, expectedAdvance, requestedRate: d.rate, vocal1370: band(pendingBins, 1370)});
    armGate.resolve(); await Promise.all([firstArm, pendingArmRate]);
    engine.keylockRenderer.render = initialRenderer; await wait(220);
    let armState = await state(); pendingBins = bins();
    report('First-arm preparation activates the latest matching rate and PCM scale atomically',
      armState.rate === 1.2 && armState.scale === 1.2 && band(pendingBins, 1370) > -65 && band(pendingBins, 1494.5) < -85,
      {snapshot: armState, vocal1370: band(pendingBins, 1370), incorrectlyShifted1494: band(pendingBins, 1494.5)});
    await engine.setRate(d, 1); await engine.setPitch(d, {keylock: false, semitones: 0}); await wait(220);
    let measured = bins(), snapshot = await state();
    const transport = engine.voices.get(0).stemSlipTransport;
    report('Arming uses four real audible sources and a latched independent transport',
      d.stemSlip === 'vocal' && snapshot.playing && [1370, 660, 880, 1760].every(f => band(measured, f) > -65), snapshot);
    await holds.press('playing-cue', d, 0); await wait(220);
    measured = bins(); snapshot = await state();
    report('Real cue-hold controller moves vocal marker while backing keeps its later marker',
      band(measured, 220) > -65 && band(measured, 1370) < -90 && band(measured, 660) > -65 && band(measured, 440) < -90 && snapshot.position > 4.5 && snapshot.selectedPosition < 2,
      {snapshot, vocal220: band(measured, 220), vocal1370: band(measured, 1370), backing660: band(measured, 660)});
    await holds.release('playing-cue'); await wait(220); measured = bins(); snapshot = await state();
    report('Cue release0 rejoins current audio marker without restarting backing or disarming',
      aligned(snapshot) && band(measured, 1370) > -65 && band(measured, 660) > -65 && engine.voices.get(0).stemSlipTransport === transport && d.stemSlip === 'vocal', snapshot);

    await engine.beginStemSlipGesture(d, 'negative'); await engine.stemSlipScratch(d, 2.1, -1, 'negative'); await wait(460);
    measured = bins(); snapshot = await state();
    report('Signed negative PCM read-head crosses backward into the earlier vocal marker only',
      snapshot.selectedPosition < 1.8 && band(measured, 220) > -65 && band(measured, 660) > -65, {snapshot, vocal220: band(measured, 220), backing660: band(measured, 660)});
    await engine.stemSlipScratch(d, 2.1, 1, 'negative'); await wait(220); measured = bins();
    report('Positive PCM read-head traverses the later vocal marker with backing unchanged',
      band(measured, 330) > -65 && band(measured, 220) < -90 && band(measured, 660) > -65,
      {vocal330: band(measured, 330), vocal220: band(measured, 220), backing660: band(measured, 660)});
    await engine.endStemSlipGesture(d, 'negative');

    const otherTrack = {id: 'stem-slip-other', duration, bpm: 120};
    const other = {...d, index: 1, track: otherTrack, position: 1, playing: false, stemSlip: 'off', stems: [true, true, true, true], stemFX: [false, false, false, false]};
    engine.buffers.set(otherTrack.id, make(t => sine(2500, t))); await engine.start(other); await wait(220);
    const beforeCut = bins(); engine.setCross(1); await wait(220); measured = bins();
    report('Crossfader cuts selected vocal while backing and other deck retain audible level',
      band(measured, 1370) < -90 && band(measured, 660) > -65 && Math.abs(band(measured, 660) - band(beforeCut, 660)) < 2 && Math.abs(band(measured, 2500) - band(beforeCut, 2500)) < 2,
      {vocal: band(measured, 1370), backing: band(measured, 660), other: band(measured, 2500)});
    engine.pause(other); engine.setCross(0); engine.mix(0, 'level', 0);
    // The analyser retains a full FFT window. Flush that window only after the
    // 10ms gain target has settled, rather than measuring its earlier residue.
    await wait(Math.ceil(engine.analyser.fftSize / sr * 1000) + 150);
    report('Shared channel level still silences selected and backing groups', rms() < 1e-4, {rms: rms()});
    engine.mix(0, 'level', .8);
    const mask = [true, false, true, false]; d.stems = mask.slice(); engine.updateStems(d);
    await holds.press('mask', d, 0); await holds.release('mask'); await wait(220); measured = bins();
    report('Custom stem mask survives cue/release and remains audible in the real routing',
      JSON.stringify(d.stems) === JSON.stringify(mask) && band(measured, 880) > -65 && band(measured, 660) < -90 && band(measured, 1760) < -90,
      {mask: d.stems, bass: band(measured, 880), melody: band(measured, 660), drums: band(measured, 1760)});
    d.stems = [true, true, true, true]; engine.updateStems(d);

    for (const beats of [.5, 1, 2, 4]) {
      d.stemSlipRelease = beats;
      await engine.beginStemSlipGesture(d, `release:${beats}`); await engine.stemSlipCue(d, 2.5, `release:${beats}`);
      const start = engine.ctx.currentTime;
      await engine.endStemSlipGesture(d, `release:${beats}`);
      const during = await state(); snapshot = await settled();
      const elapsed = engine.ctx.currentTime - start;
      report(`Selected-only ${beats}-beat release finishes on the canonical beat clock`,
        during.phase === 'releasing' && aligned(snapshot) && elapsed >= beats * .5 - .04 && elapsed < beats * .5 + .15,
        {elapsed, expectedSeconds: beats * .5, during, after: snapshot});
    }
    d.stemSlipRelease = 1;
    await engine.beginStemSlipGesture(d, 'tempo-release'); await engine.stemSlipCue(d, 2.5, 'tempo-release');
    await engine.endStemSlipGesture(d, 'tempo-release'); await wait(180); await engine.setRate(d, 2);
    snapshot = await settled(); report('Tempo change during release advances remaining beats and rejoins', aligned(snapshot) && snapshot.rate === 2, snapshot);
    await engine.setRate(d, 1); d.stemSlipRelease = 0;

    engine.pause(d); const frozen = d.position; await wait(220);
    report('Explicit pause freezes both clocks, clears audio, and keeps selection armed', !d.playing && d.stemSlip === 'vocal' && engine.position(d) === frozen && rms() < 1e-4, {position: engine.position(d), rms: rms()});
    await engine.seek(d, 5);
    await holds.press('paused-cue', d, 0); await wait(220); measured = bins(); snapshot = await state();
    report('Paused cue-hold auditions selected vocal without starting canonical/backing transport',
      !d.playing && snapshot.position === 5 && band(measured, 220) > -65 && band(measured, 660) < -90, snapshot);
    await holds.release('paused-cue'); await wait(220); snapshot = await state();
    report('Paused cue release stops audition and restores the frozen canonical cursor', !snapshot.audition && aligned(snapshot) && rms() < 1e-4, {snapshot, rms: rms()});
    await holds.press('play-latch', d, 0); await engine.start(d); await wait(150); await holds.release('play-latch'); await wait(220); measured = bins();
    report('Play during paused cue audition resumes split playback and release continues aligned', d.playing && aligned(await state()) && band(measured, 1370) > -65 && band(measured, 660) > -65, await state());
    engine.pause(d); await engine.seek(d, 5);
    const rapidPress = holds.press('rapid', d, 0), rapidRelease = holds.release('rapid');
    await Promise.all([rapidPress, rapidRelease]); await wait(220); snapshot = await state();
    report('Release before selected processor preparation completes cannot resurrect paused audition', !d.playing && !snapshot.audition && snapshot.phase === 'idle' && rms() < 1e-4, {snapshot, rms: rms()});

    await engine.start(d); await engine.beginStemSlipGesture(d, 'seek-owner'); await engine.stemSlipCue(d, 1, 'seek-owner');
    await engine.seek(d, 8); await engine.endStemSlipGesture(d, 'seek-owner'); await wait(220); snapshot = await state();
    report('Global seek moves both clocks and invalidates stale gesture releases', snapshot.position >= 8 && aligned(snapshot) && snapshot.phase === 'idle', snapshot);
    await engine.beginStemSlipGesture(d, 'switch-old'); await engine.stemSlipCue(d, 1, 'switch-old');
    await engine.setStemSlip(d, 'instrumental'); await engine.endStemSlipGesture(d, 'switch-old');
    await engine.beginStemSlipGesture(d, 'inverse'); await engine.stemSlipCue(d, 1, 'inverse'); await wait(220); measured = bins();
    report('Instrumental selection moves three real sources while vocal stays on canonical timeline',
      band(measured, 1370) > -65 && band(measured, 440) > -65 && band(measured, 660) < -90, {snapshot: await state(), vocal1370: band(measured, 1370), melody440: band(measured, 440)});
    await engine.endStemSlipGesture(d, 'inverse'); await engine.setStemSlip(d, 'vocal');

    await engine.setPitch(d, {keylock: true, semitones: 0});
    const originalRender = engine.keylockRenderer.render.bind(engine.keylockRenderer);
    let gate = deferred(), held = true;
    engine.keylockRenderer.render = async (...args) => { if (held) { held = false; await gate.promise; } return originalRender(...args); };
    const changingRate = engine.setRate(d, 1.1); await wait(220); measured = bins(); snapshot = await state();
    report('Pending Key Lock rendering retains the old effective tempo and audible pitch', snapshot.rate === 1 && band(measured, 1370) > -65 && band(measured, 1507) < -90, snapshot);
    gate.resolve(); await changingRate; await wait(220); measured = bins(); snapshot = await state();
    report('Prepared Key Lock rate and buffer scale activate together without pitch transposition', snapshot.rate === 1.1 && band(measured, 1370) > -65 && band(measured, 1507) < -85, snapshot);
    gate = deferred(); held = true;
    const staleRate = engine.setRate(d, 1.2); await wait(30); const latestRate = engine.setRate(d, .9);
    await latestRate; gate.resolve(); await staleRate; snapshot = await state();
    report('Only latest Key Lock preparation can activate audio and publish synced FX tempo',
      snapshot.rate === .9 && d.rate === .9 && engine.nodes[0].channelBpm === 108 && engine.fxState[2][0] === 108,
      {snapshot, channelBpm: engine.nodes[0].channelBpm, fxBpm: engine.fxState[2][0]});
    gate = deferred(); held = true;
    const cancelledRate = engine.setRate(d, 1.15); await wait(30); engine.pause(d); gate.resolve(); await cancelledRate;
    engine.keylockRenderer.render = originalRender; await wait(220);
    report('Pause during Key Lock preparation prevents stale buffer or audio activation', !d.playing && !engine.voices.has(0) && rms() < 1e-4, {rms: rms(), voices: engine.voices.size});

    d.rate = 1; d.keylock = false; d.keyShift = 0; d.position = 5;
    await engine.start(d); await wait(600); d.stemFX[0] = true; engine.updateStems(d); await wait(220);
    engine.setCross(1); await wait(220); measured = bins();
    report('Captured Stems exit follows selected crossfader routing while backing stays audible', band(measured, 1370) < -90 && band(measured, 660) > -65, {vocalTail: band(measured, 1370), backing: band(measured, 660)});
    engine.setCross(0); engine.silence(); await engine.endStemSlipGesture(d, 'inverse'); await wait(220);
    report('Emergency silence clears both source groups, finite exits, and the mode', d.stemSlip === 'off' && !d.playing && engine.voices.size === 0 && rms() < 1e-4, {mode: d.stemSlip, rms: rms()});
    d.stemFX = [false, false, false, false]; engine.updateStems(d); d.position = duration - .15;
    await engine.setStemSlip(d, 'vocal'); await engine.start(d); await engine.beginStemSlipGesture(d, 'ending'); await engine.stemSlipCue(d, 1, 'ending');
    await wait(400); await engine.endStemSlipGesture(d, 'ending'); await wait(200);
    report('Canonical track end stops and disarms even while selected audio was elsewhere', !d.playing && d.stemSlip === 'off' && engine.voices.size === 0 && rms() < 1e-4, {mode: d.stemSlip, position: d.position, rms: rms()});
    report('No unhandled engine or cue-controller failures', errors.length === 0, {errors});
  } catch (error) {
    report('Unhandled Stem Slip integration error', false, {message: error.message, stack: error.stack});
  } finally {
    engine.silence(); await engine.ctx?.close(); button.disabled = false;
    const passed = results.filter(result => result.passed).length;
    summary.textContent = `${passed}/${results.length} Stem Slip integration checks passed.`;
    document.body.dataset.result = passed === results.length ? 'passed' : 'failed';
    output.textContent = JSON.stringify({scope: 'Actual AudioContext/AudioWorklet four-source engine, shared mixer and real cue-hold controller. Independent browser behavior; native/controller and vendor parity remain unverified.', passed, total: results.length, results}, null, 2);
  }
};
