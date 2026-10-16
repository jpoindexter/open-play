import { AudioEngine } from "./engine.js";
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
document.querySelector("#run").onclick = async () => {
  const button = document.querySelector("#run"),
    output = document.querySelector("#results"),
    engine = new AudioEngine(),
    results = [];
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
    const sr = engine.ctx.sampleRate;
    const make = (seconds, fn) => {
      const b = engine.ctx.createBuffer(2, Math.round(sr * seconds), sr);
      for (let c = 0; c < 2; c++) {
        const a = b.getChannelData(c);
        for (let i = 0; i < a.length; i++)
          a[i] = 0.15 * Math.sin((2 * Math.PI * fn(i / sr) * i) / sr);
      }
      return b;
    };
    const track = { id: "sampler-tone", duration: 8, bpm: 120 };
    engine.buffers.set(
      track.id,
      make(8, () => 440),
    );
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
    await engine.sample(track, 0, { rate: 1.5, keylock: true });
    await wait(300);
    let p = dominant();
    report(
      "Sampler Key Lock preserves440Hz at1.5x speed",
      Math.abs(p.frequency - 440) < 12 && p.db > -70,
      { ...p, renderedDuration: engine.samples.get(0)?.source.buffer.duration },
    );
    let before = engine.samplePosition(0);
    await wait(200);
    let delta = engine.samplePosition(0) - before;
    report(
      "Sampler timeline advances at requested speed",
      Math.abs(delta - 0.3) < 0.07,
      { advance: delta },
    );
    await engine.updateSample(0, { rate: 0.8 });
    await wait(300);
    p = dominant();
    report(
      "Live keylocked speed update preserves440Hz and playback",
      Math.abs(p.frequency - 440) < 12 &&
        engine.samples.get(0)?.settings.rate === 0.8,
      p,
    );
    await engine.updateSample(0, { keylock: false, rate: 1.5 });
    await wait(300);
    p = dominant();
    report(
      "Disabling Key Lock restores coupled speed/pitch",
      Math.abs(p.frequency - 660) < 12,
      p,
    );
    await engine.updateSample(0, { gain: 0 });
    await wait(250);
    let level = rms();
    report("Live sampler gain reaches actual master silence", level < 1e-4, {
      rms: level,
    });
    engine.stopAllSamples();
    const loop = { id: "sampler-loop", duration: 8, bpm: 120 };
    engine.buffers.set(
      loop.id,
      make(8, (t) => (t >= 2 && t < 3 ? 440 : 880)),
    );
    await engine.sample(loop, 0, {
      rate: 1.5,
      keylock: true,
      start: 2,
      repeat: true,
      loopStart: 2,
      loopEnd: 3,
    });
    await wait(900);
    p = dominant();
    let position = engine.samplePosition(0);
    report(
      "Keylocked saved-loop coordinates wrap within original timeline",
      Math.abs(p.frequency - 440) < 12 && position >= 2 && position < 3,
      {
        ...p,
        position,
        loopStart: engine.samples.get(0)?.source.loopStart,
        loopEnd: engine.samples.get(0)?.source.loopEnd,
      },
    );
    engine.stopAllSamples();
    const short = { id: "sampler-short", duration: 1, bpm: 120 };
    engine.buffers.set(
      short.id,
      make(1, () => 440),
    );
    let endedAt = null;
    engine.onSampleEnd = () => {
      endedAt = engine.ctx.currentTime;
    };
    await engine.sample(short, 0, { rate: 1.5, keylock: true, start: 0.25 });
    const startedAt = engine.ctx.currentTime;
    await wait(750);
    report(
      "Cue offset and time stretch produce expected actual end event",
      endedAt !== null && Math.abs(endedAt - startedAt - 0.5) < 0.09,
      { elapsed: endedAt === null ? null : endedAt - startedAt, expected: 0.5 },
    );
    const pending = engine.sample(track, 0, { rate: 1.37, keylock: true });
    engine.stopSample(0);
    const released = await pending;
    await wait(150);
    report(
      "Hold release during preparation cancels without zombie audio",
      released === false &&
        !engine.samples.has(0) &&
        !engine.sampleRequests.has(0),
      {
        returned: released,
        voices: engine.samples.size,
        requests: engine.sampleRequests.size,
      },
    );
    // Enter the actual Worker-render path before releasing Hold.
    const render = engine.keylockRenderer.render.bind(engine.keylockRenderer);
    let began;
    const rendering = new Promise((resolve) => {
      began = resolve;
    });
    engine.keylockRenderer.render = (...args) => {
      const result = render(...args);
      began();
      return result;
    };
    const activePreparation = engine.sample(track, 0, {
      rate: 1.39,
      keylock: true,
    });
    await rendering;
    engine.keylockRenderer.render = render;
    engine.stopSample(0);
    const cancelledWorker = await activePreparation;
    report(
      "Hold release aborts actual in-flight Key Lock rendering",
      cancelledWorker === false &&
        !engine.samples.has(0) &&
        !engine.sampleRequests.has(0),
      {
        returned: cancelledWorker,
        voices: engine.samples.size,
        requests: engine.sampleRequests.size,
      },
    );
    const preparingGain = engine.sample(track, 0, {
      rate: 1.41,
      keylock: true,
    });
    await engine.updateSample(0, { gain: 0 });
    await preparingGain;
    await wait(250);
    level = rms();
    report(
      "Gain change during preparation is applied before first sampler audio",
      level < 1e-4,
      { rms: level },
    );
    engine.stopAllSamples();
    const first = engine.sample(track, 0, { rate: 1.23, keylock: true });
    const second = engine.updateSample(0, { rate: 1.7 });
    await Promise.all([first, second]);
    await wait(250);
    p = dominant();
    report(
      "Latest speed request wins during sampler preparation",
      engine.samples.get(0)?.settings.rate === 1.7 &&
        Math.abs(p.frequency - 440) < 12,
      { ...p, rate: engine.samples.get(0)?.settings.rate },
    );
    engine.stopAllSamples();
    const starts = [
      engine.sample(track, 1, { rate: 1.31, keylock: true }),
      engine.sample(track, 2, { rate: 1.43, keylock: true }),
    ];
    engine.silence();
    await Promise.all(starts);
    // getFloatTimeDomainData returns a full historical FFT window, not only
    // samples produced after stop. Wait that exact window plus two quanta.
    const silenceWindowMs = Math.ceil(
      ((engine.analyser.fftSize + 256) / sr) * 1000,
    );
    await wait(silenceWindowMs);
    report(
      "Emergency all-stop cancels every pending sampler slot",
      engine.samples.size === 0 &&
        engine.sampleRequests.size === 0 &&
        rms() < 1e-4,
      {
        voices: engine.samples.size,
        requests: engine.sampleRequests.size,
        rms: rms(),
        analyserWindowMs: (engine.analyser.fftSize / sr) * 1000,
        waitedMs: silenceWindowMs,
      },
    );
    engine.mix(0, "level", 0);
    engine.setSamplerOutput("Deck 1");
    await engine.sample(track, 0, { repeat: true });
    await wait(250);
    level = rms();
    report("Sampler Deck1 bus obeys Deck1 fader", level < 1e-4, { rms: level });
    engine.setSamplerOutput("Master");
    await wait(250);
    level = rms();
    report("Sampler Master bus bypasses Deck1 fader", level > 1e-3, {
      rms: level,
    });
    engine.configureFX(
      [[{ name: "Delay", on: false, depth: 0, beat: "1/2" }]],
      ["Sampler"],
    );
    engine.setSamplerOutput("Deck 1");
    await wait(250);
    level = rms();
    report("Sampler routing survives FX graph reconstruction", level < 1e-4, {
      rms: level,
    });
    engine.mix(0, "level", 0.8);
    await wait(250);
    level = rms();
    report("Sampler Deck1 bus reaches master when fader opens", level > 1e-3, {
      rms: level,
    });
    engine.stopAllSamples();
    await wait(200);
    report(
      "Stop all leaves no active sampler sources or preparation",
      engine.samples.size === 0 && engine.sampleRequests.size === 0,
      { voices: engine.samples.size, requests: engine.sampleRequests.size },
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
