import { AudioEngine } from "./engine.js";
import { createPitchPlay, planKeySync } from "./pitchplay.js";
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
document.querySelector("#run").onclick = async () => {
  const button = document.querySelector("#run"),
    output = document.querySelector("#results"),
    results = [],
    engine = new AudioEngine();
  button.disabled = true;
  const report = (name, passed, evidence) => {
    results.push({ name, passed, evidence });
    output.textContent = JSON.stringify(results, null, 2);
  };
  try {
    await engine.resume();
    engine.analyser.disconnect();
    engine.analyser.fftSize = 8192;
    engine.analyser.smoothingTimeConstant = 0;
    const sr = engine.ctx.sampleRate,
      track = {
        id: "pitchplay-tone",
        duration: 8,
        bpm: 120,
        key: "Am",
        cues: [{ position: 2, name: "Cue1" }],
      };
    const buffer = engine.ctx.createBuffer(2, sr * 8, sr);
    for (let c = 0; c < 2; c++) {
      const a = buffer.getChannelData(c);
      for (let i = 0; i < a.length; i++)
        a[i] =
          0.15 * Math.sin((2 * Math.PI * (i / sr < 1 ? 880 : 440) * i) / sr);
    }
    engine.buffers.set(track.id, buffer);
    const d = {
      index: 0,
      track,
      position: 0,
      rate: 1,
      playing: false,
      processing: false,
      keylock: false,
      keyShift: 0,
      reverse: false,
      loop: false,
      loopIn: 0,
      loopOut: 0,
      stems: [true, true, true, true],
      stemFX: [false, false, false, false],
      pitchCue: 0,
      pitchRangeMode: "Middle",
    };
    const pitch = createPitchPlay({
      engine,
      notify: (message) => {
        throw new Error(message);
      },
    });
    const dominant = () => {
      const b = new Float32Array(engine.analyser.frequencyBinCount);
      engine.analyser.getFloatFrequencyData(b);
      let i = 1;
      for (let j = 2; j < b.length; j++) if (b[j] > b[i]) i = j;
      return { frequency: (i * sr) / engine.analyser.fftSize, db: b[i] };
    };
    const rms = () => {
      const a = new Float32Array(engine.analyser.fftSize);
      engine.analyser.getFloatTimeDomainData(a);
      return Math.sqrt(a.reduce((s, v) => s + v * v, 0) / a.length);
    };
    await pitch.press("a", d, 1);
    await wait(300);
    let p = dominant();
    report(
      "Middle+1 pad plays selected cue at466Hz rather than file start",
      Math.abs(p.frequency - 440 * 2 ** (1 / 12)) < 12 &&
        engine.position(d) >= 2,
      { ...p, position: engine.position(d), shift: d.keyShift },
    );
    await pitch.release("a");
    await wait(200);
    report(
      "Paused Pitch Play release returns cue and stops actual audio",
      !d.playing &&
        !d.processing &&
        Math.abs(d.position - 2) < 0.01 &&
        rms() < 1e-4,
      {
        playing: d.playing,
        processing: d.processing,
        position: d.position,
        rms: rms(),
      },
    );
    const render = engine.keylockRenderer.render.bind(engine.keylockRenderer);
    let started;
    const rendering = new Promise((r) => {
      started = r;
    });
    engine.keylockRenderer.render = (...args) => {
      const result = render(...args);
      started();
      return result;
    };
    const preparing = pitch.press("b", d, 3);
    await rendering;
    engine.keylockRenderer.render = render;
    await pitch.release("b");
    await preparing;
    await wait(200);
    report(
      "Release during actual pitch rendering cancels without zombie playback",
      !d.playing && !d.processing && !engine.voices.has(0),
      {
        playing: d.playing,
        processing: d.processing,
        voices: engine.voices.size,
      },
    );
    const old = pitch.press("old", d, 1),
      latest = pitch.press("new", d, 2);
    await pitch.release("old");
    await Promise.all([old, latest]);
    await wait(300);
    p = dominant();
    report(
      "Earlier pad release cannot stop newer pitched note",
      d.playing && Math.abs(p.frequency - 440 * 2 ** (2 / 12)) < 12,
      p,
    );
    await pitch.release("new");
    d.pitchRangeMode = "Up";
    await pitch.press("up", d, 3);
    await wait(300);
    p = dominant();
    report(
      "Up range pad4 performs actual+7 semitones",
      Math.abs(p.frequency - 440 * 2 ** (7 / 12)) < 12,
      { ...p, shift: d.keyShift },
    );
    await pitch.release("up");
    d.pitchRangeMode = "Down";
    await pitch.press("down", d, 4);
    await wait(300);
    p = dominant();
    report(
      "Down range pad5 performs actual−7 semitones",
      Math.abs(p.frequency - 440 * 2 ** (-7 / 12)) < 12,
      { ...p, shift: d.keyShift },
    );
    await pitch.release("down");
    d.pitchRangeMode = "Middle";
    await pitch.press("latch", d, 1);
    const latched = pitch.latch(d);
    await pitch.release("latch");
    await wait(250);
    report(
      "Play latch keeps a paused Pitch Play audition running after release",
      latched && d.playing,
      { latched, playing: d.playing },
    );
    engine.pause(d);
    d.position = 2;
    d.keyShift = 0;
    await engine.start(d);
    await pitch.press("playing", d, 2);
    await pitch.release("playing");
    const before = engine.position(d);
    await wait(200);
    report(
      "Already-playing deck continues pitched transport after pad release",
      d.playing && engine.position(d) > before + 0.15,
      { playing: d.playing, advance: engine.position(d) - before },
    );
    engine.pause(d);
    d.position = 3.25;
    const oldCue = track.cues[0];
    await pitch.press("select", d, 5, true);
    report(
      "Shift-empty-pad creates and selects cue without starting audio",
      d.pitchCue === 5 && track.cues[5]?.position === 3.25 && !d.playing,
      {
        cue: d.pitchCue,
        position: track.cues[5]?.position,
        playing: d.playing,
      },
    );
    await pitch.press("select-existing", d, 0, true);
    report(
      "Shift-existing-pad selects without deleting cue",
      d.pitchCue === 0 && track.cues[0] === oldCue,
      { cue: d.pitchCue, position: track.cues[0]?.position },
    );
    d.position = 2;
    d.keyShift = 0;
    await engine.start(d);
    const peer = {
      index: 1,
      track: { key: "C#m" },
      rate: 1,
      keylock: true,
      keyShift: 0,
    };
    const plan = planKeySync(d, [d, peer]);
    await engine.setPitch(d, { keylock: true, semitones: plan.semitones });
    await wait(300);
    p = dominant();
    report(
      "Harmonic Key Sync applies nearest compatible actual pitch",
      plan.ok &&
        plan.semitones === -1 &&
        Math.abs(p.frequency - 440 * 2 ** (-1 / 12)) < 12,
      { ...p, plan },
    );
    await engine.setPitch(d, { keylock: true, semitones: 0 });
    await wait(300);
    p = dominant();
    report(
      "Key reset restores original pitch without stopping transport",
      d.playing && Math.abs(p.frequency - 440) < 12,
      p,
    );
    engine.pause(d);
    d.position = 2;
    const pending = pitch.press("cancel-load", d, 3);
    pitch.cancelDeck(d);
    engine.pause(d);
    await pending;
    report(
      "Track-load cancellation invalidates pending Pitch Play ownership",
      !d.playing && !d.processing && !engine.voices.has(0),
      {
        playing: d.playing,
        processing: d.processing,
        voices: engine.voices.size,
      },
    );
  } catch (error) {
    report("Unhandled integration error", false, {
      message: error.message,
      stack: error.stack,
    });
  } finally {
    engine.silence();
    await engine.ctx?.close();
    button.disabled = false;
    document.body.dataset.result = results.every((r) => r.passed)
      ? "passed"
      : "failed";
    output.textContent = `${results.filter((r) => r.passed).length}/${results.length} passed\n${JSON.stringify(results, null, 2)}`;
  }
};
