import { analyzeBuffer } from "./analysis.js";
const run = document.querySelector("#run"),
  report = document.querySelector("#report");
run.onclick = async () => {
  run.disabled = true;
  report.textContent = "Running actual worker…";
  const results = [],
    check = (name, passed, observed) =>
      results.push({ name, passed: Boolean(passed), observed });
  try {
    const sampleRate = 44100,
      duration = 12,
      buffer = new AudioBuffer({
        length: sampleRate * duration,
        sampleRate,
        numberOfChannels: 1,
      }),
      pcm = buffer.getChannelData(0);
    for (let time = 0.25; time < duration; time += 60 / 128)
      for (
        let i = 0;
        i < 2205 && Math.round(time * sampleRate) + i < pcm.length;
        i++
      )
        pcm[Math.round(time * sampleRate) + i] =
          0.5 * Math.sin(i * 0.09) * Math.exp(-i / 350);
    const snapshot = pcm.slice(),
      progress = [];
    const result = await analyzeBuffer(buffer, {
      onProgress: (value) => progress.push(value),
    });
    check(
      "Worker detects generated 128 BPM within 1 BPM",
      result.bpm !== null && Math.abs(result.bpm - 128) < 1,
      result.bpm,
    );
    check(
      "Worker provides constant grid with downbeat unverified",
      result.grid?.type === "constant" &&
        result.grid.downbeat === null &&
        result.grid.beats.length > 10,
      result.grid?.firstBeat,
    );
    check(
      "Input AudioBuffer remains intact after transfer",
      pcm.length === snapshot.length && pcm.every((x, i) => x === snapshot[i]),
      pcm.length,
    );
    check(
      "Worker progress reaches one monotonically",
      progress.at(-1) === 1 &&
        progress.every((x, i) => !i || x >= progress[i - 1]),
      progress,
    );
    // A known tonal fixture proves key suppression is not mere failure to find a key.
    const tonal = new AudioBuffer({
        length: sampleRate * 24,
        sampleRate,
        numberOfChannels: 1,
      }),
      tonalPCM = tonal.getChannelData(0),
      notes = [0, 4, 7, 0, 5, 9, 7, 11, 2, 7, 0, 4];
    for (let i = 0; i < tonalPCM.length; i++) {
      const t = i / sampleRate,
        position = t % 0.5,
        frequency =
          440 *
          2 ** ((60 + notes[Math.floor(t / 0.5) % notes.length] - 69) / 12),
        envelope =
          Math.min(1, position / 0.012) * Math.min(1, (0.5 - position) / 0.025);
      tonalPCM[i] =
        envelope *
        (0.18 * Math.sin(2 * Math.PI * frequency * t) +
          0.045 * Math.sin(4 * Math.PI * frequency * t) +
          0.015 * Math.sin(6 * Math.PI * frequency * t));
    }
    const tonalEnabled = await analyzeBuffer(tonal, { analyzeTempo: false });
    check(
      "Worker key analysis recognizes C major with tempo disabled",
      tonalEnabled.key === "C" &&
        tonalEnabled.tempo?.reason === "tempo_analysis_disabled" &&
        tonalEnabled.bpm === null &&
        tonalEnabled.grid === null,
      { key: tonalEnabled.key, tempo: tonalEnabled.tempo },
    );
    const keyDisabled = await analyzeBuffer(tonal, { analyzeKey: false });
    check(
      "Worker disabled key returns no computed estimate or candidates",
      keyDisabled.key === null &&
        keyDisabled.keyEstimate?.value === null &&
        keyDisabled.keyEstimate?.reason === "key_analysis_disabled" &&
        keyDisabled.keyEstimate.confidence === 0 &&
        keyDisabled.keyEstimate.candidates.length === 0,
      keyDisabled.keyEstimate,
    );
    const tempoDisabled = await analyzeBuffer(buffer, { analyzeTempo: false });
    check(
      "Worker disabled tempo suppresses known rhythm and constant grid",
      tempoDisabled.bpm === null &&
        tempoDisabled.grid === null &&
        tempoDisabled.tempo?.value === null &&
        tempoDisabled.tempo?.reason === "tempo_analysis_disabled" &&
        tempoDisabled.tempo.confidence === 0,
      tempoDisabled.tempo,
    );
    const tempoOnly = await analyzeBuffer(buffer, { analyzeKey: false });
    check(
      "Worker key suppression preserves measured 128 BPM",
      Math.abs(tempoOnly.bpm - 128) < 1 &&
        tempoOnly.key === null &&
        tempoOnly.grid?.beats.length > 10,
      { bpm: tempoOnly.bpm, key: tempoOnly.key },
    );
    const bothDisabled = await analyzeBuffer(tonal, {
      analyzeKey: false,
      analyzeTempo: false,
    });
    check(
      "Worker both disabled still measures original PCM levels",
      bothDisabled.key === null &&
        bothDisabled.bpm === null &&
        bothDisabled.grid === null &&
        bothDisabled.gain.rmsDbfs === tonalEnabled.gain.rmsDbfs &&
        bothDisabled.gain.samplePeak === tonalEnabled.gain.samplePeak &&
        Number.isFinite(bothDisabled.gain.recommendedDb),
      bothDisabled.gain,
    );
    check(
      "Worker both disabled retains distinct reasons",
      bothDisabled.keyEstimate?.reason === "key_analysis_disabled" &&
        bothDisabled.tempo?.reason === "tempo_analysis_disabled",
      {
        key: bothDisabled.keyEstimate?.reason,
        tempo: bothDisabled.tempo?.reason,
      },
    );
    const controller = new AbortController();
    const cancelled = analyzeBuffer(buffer, { signal: controller.signal });
    controller.abort();
    let cancelledCorrectly = false;
    try {
      await cancelled;
    } catch (error) {
      cancelledCorrectly = error.name === "AbortError";
    }
    check("Cancellation rejects with AbortError", cancelledCorrectly);
    const silence = new AudioBuffer({
        length: sampleRate * 7,
        sampleRate,
        numberOfChannels: 2,
      }),
      quiet = await analyzeBuffer(silence);
    check(
      "Silent stereo remains unknown and unboosted",
      quiet.bpm === null &&
        quiet.key === null &&
        quiet.gain.recommendedDb === null,
      quiet.warnings,
    );
    const invalid = new AudioBuffer({
      length: sampleRate,
      sampleRate,
      numberOfChannels: 1,
    });
    invalid.getChannelData(0)[12] = NaN;
    let rejected = false;
    try {
      await analyzeBuffer(invalid);
    } catch (error) {
      rejected = /non-finite/.test(error.message);
    }
    check("Worker malformed PCM propagates rejection", rejected);
  } catch (error) {
    check("Unexpected execution error", false, error.message);
  }
  report.textContent = JSON.stringify(
    {
      executedAt: new Date().toISOString(),
      passed: results.filter((r) => r.passed).length,
      total: results.length,
      results,
    },
    null,
    2,
  );
  run.disabled = false;
};
