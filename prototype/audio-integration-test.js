import { AudioEngine } from "./engine.js";
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
document.querySelector("#run").onclick = async () => {
  const button = document.querySelector("#run"),
    output = document.querySelector("#results"),
    results = [];
  button.disabled = true;
  const engine = new AudioEngine();
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
      duration = 8;
    const make = (frequency) => {
      const b = engine.ctx.createBuffer(2, sr * duration, sr);
      for (let c = 0; c < 2; c++) {
        const a = b.getChannelData(c);
        for (let i = 0; i < a.length; i++)
          a[i] =
            0.12 *
            Math.sin(
              (2 *
                Math.PI *
                (typeof frequency === "function"
                  ? frequency(i / sr)
                  : frequency) *
                i) /
                sr,
            );
      }
      return b;
    };
    const track = { id: "integration-source", duration, bpm: 120 };
    engine.buffers.set(
      track.id,
      make((t) => (t < 4 ? 440 : 880)),
    );
    const d = {
      index: 0,
      track,
      playing: false,
      processing: false,
      position: 1,
      rate: 1.5,
      keylock: true,
      keyShift: 0,
      reverse: false,
      loop: false,
      loopIn: 0,
      loopOut: 0,
      stems: [true, true, true, true],
      stemFX: [false, false, false, false],
    };
    const spectrum = () => {
      const bins = new Float32Array(engine.analyser.frequencyBinCount);
      engine.analyser.getFloatFrequencyData(bins);
      return bins;
    };
    const peak = (bins, f) => {
      const i = Math.round((f * engine.analyser.fftSize) / sr);
      return Math.max(...bins.slice(Math.max(0, i - 2), i + 3));
    };
    const dominant = () => {
      const bins = spectrum();
      let index = 1;
      for (let i = 2; i < bins.length; i++)
        if (bins[i] > bins[index]) index = i;
      return {
        frequency: (index * sr) / engine.analyser.fftSize,
        db: bins[index],
      };
    };
    const audibleAt = (measurement, f) =>
      measurement.db > -60 && Math.abs(measurement.frequency - f) < 15;
    await engine.start(d);
    await wait(300);
    let measured = dominant();
    report(
      "Keylock engine output stays 440 Hz at 1.5×",
      audibleAt(measured, 440),
      measured,
    );
    await engine.seek(d, 4.3);
    await engine.setReverse(d, true);
    await wait(550);
    measured = dominant();
    report(
      "Reverse actually crosses from second-half 880 Hz into first-half 440 Hz",
      audibleAt(measured, 440) && engine.position(d) < 4,
      { ...measured, position: engine.position(d) },
    );
    await engine.setReverse(d, false);
    await engine.seek(d, 2.8);
    await engine.setLoop(d, true, 2, 3);
    await wait(450);
    const loopPosition = engine.position(d);
    measured = dominant();
    report(
      "Keylocked loop wraps original timeline and outputs loop audio",
      loopPosition >= 2 && loopPosition < 3 && audibleAt(measured, 440),
      { ...measured, position: loopPosition },
    );
    const slow = engine.setRate(d, 0.7),
      fast = engine.setRate(d, 1.3);
    await Promise.all([slow, fast]);
    await wait(250);
    const before = engine.position(d);
    await wait(150);
    const after = engine.position(d);
    const elapsed = (after - before + 1) % 1;
    measured = dominant();
    report(
      "Latest rate request wins without stale rendered source",
      d.rate === 1.3 &&
        audibleAt(measured, 440) &&
        Math.abs(elapsed - 0.195) < 0.08,
      { ...measured, rate: d.rate, timelineAdvance: elapsed },
    );
    engine.pause(d);
    d.loop = false;
    d.position = 1;
    d.rate = 1;
    d.keylock = false;
    d.reverse = false;
    const stems = [220, 440, 880, 1760].map(make);
    await engine.attachStems(track, stems, [d]);
    await engine.start(d);
    await wait(250);
    measured = dominant();
    report(
      "All stems enabled routes original master audio",
      audibleAt(measured, 440),
      measured,
    );
    d.stems = [true, false, false, false];
    engine.updateStems(d);
    await wait(300);
    let bins = spectrum();
    report(
      "Vocal isolation reaches master and removes other stem frequencies",
      peak(bins, 220) > -55 &&
        peak(bins, 440) < peak(bins, 220) - 30 &&
        peak(bins, 880) < peak(bins, 220) - 30,
      {
        vocalDb: peak(bins, 220),
        otherDb: peak(bins, 440),
        bassDb: peak(bins, 880),
      },
    );
    d.stems = [false, false, false, false];
    engine.updateStems(d);
    await wait(300);
    const wave = new Float32Array(engine.analyser.fftSize);
    engine.analyser.getFloatTimeDomainData(wave);
    const rms = Math.sqrt(
      wave.reduce((sum, n) => sum + n * n, 0) / wave.length,
    );
    report("Muting four stems silences actual master", rms < 1e-4, { rms });
    d.stems = [false, true, true, true];
    engine.updateStems(d);
    await wait(300);
    bins = spectrum();
    report(
      "Instrumental passes melody/bass/drums and removes vocals",
      peak(bins, 440) > -55 &&
        peak(bins, 880) > -55 &&
        peak(bins, 1760) > -55 &&
        peak(bins, 220) < -65,
      {
        vocalDb: peak(bins, 220),
        melodyDb: peak(bins, 440),
        bassDb: peak(bins, 880),
        drumsDb: peak(bins, 1760),
      },
    );
    d.stems = [true, true, true, true];
    engine.updateStems(d);
    await wait(300);
    measured = dominant();
    bins = spectrum();
    report(
      "All-on restores original instead of imperfect separated sum",
      audibleAt(measured, 440) &&
        peak(bins, 220) < -65 &&
        peak(bins, 1760) < -65,
      { ...measured, vocalDb: peak(bins, 220), drumsDb: peak(bins, 1760) },
    );
    engine.stemBuffers.delete(track.id);
    engine.pause(d);
    d.position = 1;
    await engine.start(d);
    await wait(250);
    measured = dominant();
    report(
      "Explicit full-mix restore plays original source",
      audibleAt(measured, 440) && engine.voices.get(0)?.sources.length === 1,
      measured,
    );
    engine.pause(d);
    d.keylock = true;
    d.rate = 0.9;
    d.position = 4.3;
    const initial = engine.start(d);
    const reversed = engine.setReverse(d, true);
    const sought = engine.seek(d, 1.8);
    await Promise.all([initial, reversed, sought]);
    await wait(250);
    measured = dominant();
    report(
      "Immediate reverse then seek preserves pending playback intent",
      d.playing &&
        d.reverse &&
        engine.position(d) < 1.8 &&
        audibleAt(measured, 440),
      { ...measured, position: engine.position(d), playing: d.playing },
    );
    engine.pause(d);
    d.keylock = false;
    d.reverse = false;
    d.rate = 1;
    d.position = 1;
    const unlockedInitial = engine.start(d),
      unlockedRate = engine.setRate(d, 1.2);
    await Promise.all([unlockedInitial, unlockedRate]);
    await wait(250);
    measured = dominant();
    report(
      "Immediate unlocked rate change keeps playback and changes actual pitch",
      d.playing && audibleAt(measured, 528),
      { ...measured, playing: d.playing, rate: d.rate },
    );
    engine.pause(d);
    d.keylock = true;
    d.rate = 0.85;
    const pending = engine.start(d);
    engine.pause(d);
    await pending;
    report(
      "Pause during asynchronous start leaves no source or processing state",
      !d.playing && !d.processing && !engine.voices.has(0),
      {
        playing: d.playing,
        processing: d.processing,
        voices: engine.voices.size,
      },
    );
    d.keylock = false;
    const pendingPlain = engine.start(d);
    engine.silence();
    await pendingPlain;
    await wait(50);
    report(
      "Emergency silence defeats pending untransformed start",
      !d.playing && !engine.voices.has(0),
      { playing: d.playing, voices: engine.voices.size },
    );
    d.keylock = false;
    d.reverse = false;
    d.rate = 1;
    d.position = 1;
    const banks = [
      [
        {
          name: "Echo",
          on: true,
          depth: 100,
          beat: "1/4",
          params: { Feedback: 80, Tone: 18000 },
        },
      ],
      [],
    ];
    engine.configureFX(banks, ["Deck 1", "Deck 2"], [120, 120, 120, 120]);
    await engine.start(d);
    await wait(450);
    banks[0][0] = {
      name: "Distortion",
      on: true,
      depth: 100,
      beat: "1/4",
      params: { Drive: 80, Tone: 18000 },
    };
    engine.configureFX(banks, ["Deck 1", "Deck 2"], [120, 120, 120, 120]);
    await wait(300);
    bins = spectrum();
    report(
      "Changing a live FX slot replaces its algorithm without killing worklet",
      peak(bins, 440) > -60 && peak(bins, 1320) > -80,
      { fundamentalDb: peak(bins, 440), thirdHarmonicDb: peak(bins, 1320) },
    );
    banks[0][0] = {
      name: "Echo",
      on: true,
      depth: 100,
      beat: "1/4",
      params: { Feedback: 85, Tone: 18000 },
    };
    engine.configureFX(banks, ["Deck 1", "Deck 2"], [120, 120, 120, 120]);
    await wait(450);
    engine.pause(d);
    banks[0][0].depth = 75;
    engine.configureFX(banks, ["Deck 1", "Deck 2"], [120, 120, 120, 120]);
    await wait(250);
    measured = dominant();
    report(
      "Changing live depth preserves an existing echo tail",
      audibleAt(measured, 440),
      measured,
    );
    engine.silence();
    await wait(300);
    const silentWave = new Float32Array(engine.analyser.fftSize);
    engine.analyser.getFloatTimeDomainData(silentWave);
    const tailRms = Math.sqrt(
      silentWave.reduce((sum, n) => sum + n * n, 0) / silentWave.length,
    );
    report("Emergency silence clears active feedback tails", tailRms < 1e-4, {
      rms: tailRms,
    });
    d.position = 1;
    banks[0][0] = {
      name: "Delay",
      on: true,
      depth: 100,
      beat: "1/4",
      params: { Feedback: 85, HPF: 20, Drive: 0, "Beat Modify": 1 },
    };
    engine.configureFX(banks, ["Deck 1", "Deck 2"], [120, 120, 120, 120]);
    await engine.start(d);
    await wait(450);
    engine.pause(d);
    banks[0][0].depth = 75;
    engine.configureFX(banks, ["Deck 1", "Deck 2"], [120, 120, 120, 120]);
    await wait(250);
    measured = dominant();
    report(
      "Legacy Delay depth update preserves its existing feedback tail",
      audibleAt(measured, 440),
      measured,
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
