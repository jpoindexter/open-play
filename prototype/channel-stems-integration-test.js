import { AudioEngine } from "./engine.js";
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
      duration = 8;
    const make = (fn) => {
      const b = engine.ctx.createBuffer(2, sr * duration, sr);
      for (let c = 0; c < 2; c++) {
        const a = b.getChannelData(c);
        for (let i = 0; i < a.length; i++) a[i] = fn(i / sr);
      }
      return b;
    };
    const sine = (f) => (t) => 0.12 * Math.sin(2 * Math.PI * f * t);
    const sampleRms = () => {
      const a = new Float32Array(engine.analyser.fftSize);
      engine.analyser.getFloatTimeDomainData(a);
      return Math.sqrt(a.reduce((s, n) => s + n * n, 0) / a.length);
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
    const track = { id: "channel-review", duration, bpm: 120 },
      d = {
        index: 0,
        track,
        position: 1,
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
      };
    const knob = async (value) => {
      engine.mix(0, "filter", value);
      await engine.applyChannelFX(0);
      await wait(250);
    };
    engine.buffers.set(track.id, make(sine(20)));
    await engine.setChannelFX("Dub Echo");
    await knob(0);
    await engine.start(d);
    await wait(300);
    const baseline = sampleRms();
    await engine.setChannelFX("Filter");
    await knob(0);
    const zero = sampleRms();
    report(
      "Channel Filter zero preserves bass rather than applying a20Hz high-pass",
      Math.abs(zero / baseline - 1) < 0.1,
      { dryRms: baseline, filterZeroRms: zero, ratio: zero / baseline },
    );
    engine.pause(d);
    engine.buffers.set(
      track.id,
      make(
        (t) =>
          0.1 * Math.sin(2 * Math.PI * 100 * t) +
          0.1 * Math.sin(2 * Math.PI * 4400 * t),
      ),
    );
    d.position = 1;
    await engine.start(d);
    await knob(-0.6);
    let bins = spectrum();
    const low = { bass: peak(bins, 100), high: peak(bins, 4400) };
    await knob(0.6);
    bins = spectrum();
    const high = { bass: peak(bins, 100), high: peak(bins, 4400) };
    report(
      "Channel Filter bipolar knob changes actual low/high-band response",
      low.bass > low.high + 20 && high.high > high.bass + 20,
      { lowpass: low, highpass: high },
    );
    engine.pause(d);
    engine.buffers.set(track.id, make(sine(440)));
    d.position = 1;
    await engine.setChannelFX("Dub Echo");
    await knob(0.8);
    await engine.start(d);
    await wait(500);
    engine.pause(d);
    await knob(0.6);
    let level = sampleRms();
    report(
      "Channel Dub Echo survives source pause and depth adjustment",
      level > 1e-4,
      { tailRms: level },
    );
    await knob(0);
    level = sampleRms();
    report(
      "Channel Dub Echo zero is dry bypass with no orphan tail",
      level < 1e-4,
      { rms: level },
    );
    await engine.setChannelFX("Space");
    await knob(1);
    d.position = 1;
    await engine.start(d);
    await wait(600);
    engine.pause(d);
    await wait(300);
    level = sampleRms();
    report(
      "Channel Space produces an audible decay after source pause",
      level > 1e-4,
      { tailRms: level },
    );
    await knob(0);
    level = sampleRms();
    report("Channel Space zero bypass suppresses wet decay", level < 1e-4, {
      rms: level,
    });
    await engine.setChannelFX("Noise");
    await knob(0.8);
    level = sampleRms();
    report(
      "Channel Noise generates actual audio without a loaded voice",
      level > 1e-4,
      { noiseRms: level },
    );
    engine.mix(0, "level", 0);
    await wait(250);
    let muted = sampleRms();
    report("Channel Noise obeys channel fader routing", muted < 1e-4, {
      mutedRms: muted,
    });
    engine.mix(0, "level", 0.8);
    await knob(0);
    level = sampleRms();
    report("Channel Noise zero disables generation at master", level < 1e-4, {
      rms: level,
    });
    await knob(0.8);
    engine.silence();
    await wait(250);
    level = sampleRms();
    report("Emergency silence also clears Channel Noise", level < 1e-4, {
      rms: level,
    });
    await engine.setChannelFX("Filter");
    await knob(0);
    const stemTrack = { id: "stems-fx-review", duration, bpm: 120 };
    d.track = stemTrack;
    const original = make(sine(330));
    engine.buffers.set(stemTrack.id, original);
    const vocal = make(
      (t) => 0.12 * Math.sin(2 * Math.PI * (t < 1.8 ? 220 : 710) * t),
    );
    const stemBuffers = [
      vocal,
      make(sine(440)),
      make(sine(880)),
      make(sine(1760)),
    ];
    await engine.attachStems(stemTrack, stemBuffers, [d]);
    d.position = 1;
    d.stems = [true, false, false, false];
    d.stemFX = [false, false, false, false];
    await engine.start(d);
    await wait(600);
    d.stemFX = [true, false, false, false];
    engine.updateStems(d);
    await wait(400);
    bins = spectrum();
    const earlyVocal = peak(bins, 220);
    await wait(800);
    bins = spectrum();
    const lateVocal = peak(bins, 710);
    report(
      "Vocal Echo captures a tail and excludes subsequent vocal markers",
      earlyVocal > -80 && lateVocal < -90,
      { early220Db: earlyVocal, late710Db: lateVocal },
    );
    d.stems[2] = true;
    engine.updateStems(d);
    await wait(450);
    bins = spectrum();
    report(
      "Unrelated stem mute change preserves existing Vocal Echo capture",
      peak(bins, 710) < -90 && peak(bins, 880) > -60,
      { lateVocalDb: peak(bins, 710), enabledBassDb: peak(bins, 880) },
    );
    engine.pause(d);
    d.position = 1;
    const changingMelody = make(
      (t) => 0.12 * Math.sin(2 * Math.PI * (t < 1.8 ? 440 : 660) * t),
    );
    const changingBass = make(
      (t) => 0.12 * Math.sin(2 * Math.PI * (t < 1.8 ? 880 : 1370) * t),
    );
    const changingInstrumentalDrums = make(
      (t) => 0.12 * Math.sin(2 * Math.PI * (t < 1.8 ? 1760 : 2300) * t),
    );
    await engine.attachStems(
      stemTrack,
      [
        make(sine(220)),
        changingMelody,
        changingBass,
        changingInstrumentalDrums,
      ],
      [d],
    );
    d.stems = [true, true, true, true];
    d.stemFX = [false, false, false, false];
    await engine.start(d);
    await wait(600);
    d.stemFX = [false, true, false, false];
    engine.updateStems(d);
    await wait(1200);
    bins = spectrum();
    report(
      "Instrumental Echo excludes later melody/bass/drum markers while vocals continue",
      peak(bins, 660) < -90 &&
        peak(bins, 1370) < -90 &&
        peak(bins, 2300) < -90 &&
        peak(bins, 220) > -60,
      {
        laterMelodyDb: peak(bins, 660),
        laterBassDb: peak(bins, 1370),
        laterDrumDb: peak(bins, 2300),
        vocalDb: peak(bins, 220),
      },
    );
    engine.pause(d);
    d.position = 1;
    await engine.attachStems(
      stemTrack,
      [
        vocal,
        make((t) => 0.24 * Math.sin(2 * Math.PI * 440 * t)),
        make((t) => 0.06 * Math.sin(2 * Math.PI * 880 * t)),
        make((t) => 0.06 * Math.sin(2 * Math.PI * 1760 * t)),
      ],
      [d],
    );
    d.stems = [false, true, true, true];
    d.stemFX = [false, false, false, false];
    await engine.start(d);
    await wait(600);
    d.stemFX = [false, false, true, false];
    engine.updateStems(d);
    await wait(200);
    const braking = dominant();
    await wait(1900);
    level = sampleRms();
    report(
      "Instrumental Braker lowers instrument pitch before stopping",
      braking.db > -75 && braking.frequency > 100 && braking.frequency < 420,
      braking,
    );
    report(
      "Instrumental Braker fully mutes melody/bass/drums after brake",
      level < 1e-4,
      { lateRms: level },
    );
    await engine.setPitch(d, { keylock: true, semitones: 0 });
    await wait(200);
    level = sampleRms();
    report(
      "Pitch preparation restart does not retrigger a finished Instrumental Braker",
      level < 1e-4,
      { afterRestartRms: level },
    );
    engine.pause(d);
    d.keylock = false;
    const drum = make(
      (t) => 0.12 * Math.sin(2 * Math.PI * (t < 1.8 ? 1760 : 2200) * t),
    );
    await engine.attachStems(
      stemTrack,
      [make(sine(220)), make(sine(440)), make(sine(880)), drum],
      [d],
    );
    d.position = 1;
    d.stems = [true, false, false, true];
    d.stemFX = [false, false, false, false];
    await engine.start(d);
    await wait(600);
    d.stemFX = [false, false, false, true];
    engine.updateStems(d);
    await wait(1200);
    bins = spectrum();
    report(
      "Drums Echo excludes later drum markers while vocals continue",
      peak(bins, 2200) < -90 && peak(bins, 220) > -60,
      { laterDrumDb: peak(bins, 2200), vocalDb: peak(bins, 220) },
    );
    engine.pause(d);
    // Only 220 Hz lies inside this short loop. The 1370 Hz prefix was never played.
    const loopVocal = make(
      (t) => 0.12 * Math.sin(2 * Math.PI * (t < 2 ? 1370 : 220) * t),
    );
    await engine.attachStems(
      stemTrack,
      [loopVocal, make(sine(440)), make(sine(880)), make(sine(1760))],
      [d],
    );
    Object.assign(d, {
      position: 2.05,
      loop: true,
      loopIn: 2,
      loopOut: 2.25,
      stems: [true, false, false, false],
      stemFX: [false, false, false, false],
    });
    await engine.start(d);
    await wait(600);
    d.stemFX[0] = true;
    engine.updateStems(d);
    await wait(200);
    bins = spectrum();
    report(
      "Vocal Echo captures audible loop history without leaking unplayed pre-loop audio",
      peak(bins, 1370) < -90 && peak(bins, 220) > -75,
      {
        unplayedPrefixDb: peak(bins, 1370),
        loopVocalDb: peak(bins, 220),
        position: engine.position(d),
      },
    );
    engine.silence();
    await wait(250);
    level = sampleRms();
    report(
      "Emergency silence clears active Stems FX and original sources",
      level < 1e-4,
      { rms: level },
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
