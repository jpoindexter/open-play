import { analyzePCM, analyzeBuffer } from "../prototype/analysis.js";
const sr = 44100;
const results = [];
function check(name, passed, observed) {
  results.push({ name, passed: Boolean(passed), observed });
}
function pulse(bpm, duration = 24, offset = 0.27) {
  const x = new Float32Array(Math.round(sr * duration));
  let seed = 123;
  for (let b = offset; b < duration; b += 60 / bpm) {
    for (
      let i = 0;
      i < Math.floor(sr * 0.09) && Math.round(b * sr) + i < x.length;
      i++
    ) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const t = i / sr,
        noise = (seed / 4294967296) * 2 - 1;
      x[Math.round(b * sr) + i] +=
        (0.7 * Math.sin(2 * Math.PI * (60 * t + 3 * (1 - Math.exp(-t * 35)))) +
          0.1 * noise) *
        Math.exp(-t * 45);
    }
  }
  return x;
}
function melody(root, minor = false, duration = 24) {
  const x = new Float32Array(sr * duration),
    pattern = minor
      ? [0, 3, 7, 0, 5, 8, 7, 10, 2, 7, 0, 3]
      : [0, 4, 7, 0, 5, 9, 7, 11, 2, 7, 0, 4];
  for (let i = 0; i < x.length; i++) {
    const t = i / sr,
      step = Math.floor(t / 0.5),
      position = t % 0.5,
      f = 440 * 2 ** ((60 + root + pattern[step % pattern.length] - 69) / 12);
    const envelope =
      Math.min(1, position / 0.012) * Math.min(1, (0.5 - position) / 0.025);
    x[i] =
      envelope *
      (0.18 * Math.sin(2 * Math.PI * f * t) +
        0.045 * Math.sin(4 * Math.PI * f * t) +
        0.015 * Math.sin(6 * Math.PI * f * t));
  }
  return x;
}
const start = performance.now();
for (const bpm of [60, 80, 95, 110, 128, 150, 174, 200]) {
  const result = analyzePCM([pulse(bpm)], sr);
  check(
    `Tempo ${bpm} BPM within 1 BPM`,
    result.bpm != null && Math.abs(result.bpm - bpm) <= 1,
    { bpm: result.bpm, confidence: result.tempo?.confidence },
  );
  const period = 60 / bpm,
    phase = result.grid?.firstBeat,
    phaseError =
      phase == null
        ? null
        : Math.min(
            Math.abs(phase - 0.27),
            Math.abs(phase + period - 0.27),
            Math.abs(phase - period - 0.27),
          );
  check(
    `Tempo ${bpm} initial grid phase within 65ms`,
    phaseError != null && phaseError < 0.065 && result.grid.downbeat === null,
    { firstBeat: phase, phaseError },
  );
}
for (const [root, minor, expected] of [
  "C",
  "C#",
  "D",
  "Eb",
  "E",
  "F",
  "F#",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
].flatMap((name, root) => [
  [root, false, name],
  [root, true, name + "m"],
])) {
  const r = analyzePCM([melody(root, minor)], sr);
  check(`Tonal sequence identifies ${expected}`, r.key === expected, {
    key: r.key,
    confidence: r.keyEstimate?.confidence,
    candidates: r.keyEstimate?.candidates,
  });
}
const silence = analyzePCM([new Float32Array(sr * 10)], sr);
check(
  "Silence returns unknown BPM/key and no gain boost",
  silence.bpm === null &&
    silence.key === null &&
    silence.gain.recommendedDb === null,
  silence.warnings,
);
const tone = new Float32Array(sr * 12);
for (let i = 0; i < tone.length; i++)
  tone[i] = 0.2 * Math.sin((2 * Math.PI * 440 * i) / sr);
const sine = analyzePCM([tone], sr);
check(
  "Steady sine has no invented tempo or musical key",
  sine.bpm === null && sine.key === null,
  { bpm: sine.bpm, key: sine.key, warnings: sine.warnings },
);
check(
  "Sine RMS measurement within 0.01dB",
  Math.abs(sine.gain.rmsDbfs - 20 * Math.log10(0.2 / Math.sqrt(2))) < 0.01,
  sine.gain,
);
check(
  "Sine peak measurement within 0.001",
  Math.abs(sine.gain.samplePeak - 0.2) < 0.001,
  sine.gain.samplePeak,
);
let seed = 876;
const noise = new Float32Array(sr * 12);
for (let i = 0; i < noise.length; i++) {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  noise[i] = ((seed / 4294967296) * 2 - 1) * 0.2;
}
const noisy = analyzePCM([noise], sr);
check(
  "Seeded noise returns unknown key and tempo",
  noisy.key === null && noisy.bpm === null,
  { bpm: noisy.bpm, key: noisy.key, warnings: noisy.warnings },
);
const rhythm = pulse(128),
  inverse = Float32Array.from(rhythm, (x) => -x);
const stereo = analyzePCM([rhythm, inverse], sr);
check(
  "Opposite-phase stereo still analyzes rhythm",
  Math.abs(stereo.bpm - 128) < 1,
  { bpm: stereo.bpm },
);
for (const [name, channels, rate] of [
  ["NaN", [Float32Array.of(NaN)], sr],
  ["unequal channels", [new Float32Array(5), new Float32Array(3)], sr],
  ["invalid sample rate", [new Float32Array(5)], 0],
]) {
  let error = false;
  try {
    analyzePCM(channels, rate);
  } catch {
    error = true;
  }
  check(`Reject ${name}`, error);
}
const partial = analyzePCM([pulse(100)], sr, { maxSeconds: 8 });
check(
  "Partial analysis explicitly reported",
  partial.partial && partial.analyzedDuration === 8,
  partial.warnings,
);

const drifting = pulse(120, 24);
const fast = pulse(150, 24);
for (let i = sr * 12; i < drifting.length; i++) drifting[i] = fast[i];
const drift = analyzePCM([drifting], sr);
check(
  "Abrupt 120 to 150 BPM does not claim a confident fixed grid",
  drift.bpm === null || drift.tempo.confidence < 0.65,
  { bpm: drift.bpm, confidence: drift.tempo?.confidence },
);
const irregular = new Float32Array(sr * 20);
let time = 0.2;
seed = 127;
while (time < 20) {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  time += 0.15 + (seed / 4294967296) * 0.8;
  const at = Math.round(time * sr);
  for (let i = 0; i < 1000 && at + i < irregular.length; i++)
    irregular[at + i] = Math.sin(i * 0.3) * Math.exp(-i / 100) * 0.4;
}
const randomOnsets = analyzePCM([irregular], sr);
check("Irregular attacks return unknown tempo", randomOnsets.bpm === null, {
  bpm: randomOnsets.bpm,
  confidence: randomOnsets.tempo?.confidence,
});
const extreme = Float32Array.from(tone, (x) => x * 100);
const loud = analyzePCM([extreme], sr);
check(
  "Recommended cut keeps extreme float signal below minus1dBFS",
  loud.gain.samplePeak * 10 ** (loud.gain.recommendedDb / 20) <=
    10 ** (-1 / 20) + 1e-8,
  { gainDb: loud.gain.recommendedDb, peak: loud.gain.samplePeak },
);
check(
  "Clipped input samples counted",
  loud.gain.clippedSamples > 0,
  loud.gain.clippedSamples,
);
for (const sampleRate of [22050, 48000, 96000]) {
  const source = pulse(95, 12),
    converted = new Float32Array(Math.floor((source.length * sampleRate) / sr));
  for (let i = 0; i < converted.length; i++)
    converted[i] = source[Math.floor((i * sr) / sampleRate)];
  const r = analyzePCM([converted], sampleRate);
  check(`95 BPM at ${sampleRate}Hz within1BPM`, Math.abs(r.bpm - 95) < 1, {
    bpm: r.bpm,
  });
}
let rangeError = false;
try {
  analyzePCM([tone], sr, { minBpm: 180, maxBpm: 80 });
} catch {
  rangeError = true;
}
check("Invalid BPM search range rejected", rangeError);
const alreadyCancelled = new AbortController();
alreadyCancelled.abort();
let cancellationName = null,
  accessedPCM = false;
try {
  await analyzeBuffer(
    {
      get numberOfChannels() {
        accessedPCM = true;
        throw new Error("Should not read PCM");
      },
    },
    { signal: alreadyCancelled.signal },
  );
} catch (error) {
  cancellationName = error.name;
}
check(
  "Worker-absent pre-aborted analysis rejects without touching PCM",
  typeof Worker === "undefined" &&
    cancellationName === "AbortError" &&
    !accessedPCM,
  { cancellationName, accessedPCM },
);
// Non-silent fixtures distinguish disabled analysis from an ordinary unknown result.
const selectiveTonal = melody(0, false),
  selectivePulse = pulse(128);
const selectiveKey = analyzePCM([selectiveTonal], sr, { analyzeTempo: false });
check(
  "Disabling tempo preserves measurable C major key",
  selectiveKey.key === "C" &&
    selectiveKey.bpm === null &&
    selectiveKey.grid === null &&
    selectiveKey.tempo?.reason === "tempo_analysis_disabled",
  { key: selectiveKey.key, tempo: selectiveKey.tempo },
);
const lockedKey = analyzePCM([selectiveTonal], sr, { analyzeKey: false });
check(
  "Disabled key publishes no estimate or candidates for known tonal PCM",
  lockedKey.key === null &&
    lockedKey.keyEstimate?.value === null &&
    lockedKey.keyEstimate?.reason === "key_analysis_disabled" &&
    lockedKey.keyEstimate.candidates.length === 0 &&
    lockedKey.keyEstimate.confidence === 0,
  lockedKey.keyEstimate,
);
const noTempo = analyzePCM([selectivePulse], sr, { analyzeTempo: false });
check(
  "Disabled tempo publishes no BPM or grid for known periodic PCM",
  noTempo.bpm === null &&
    noTempo.grid === null &&
    noTempo.tempo?.value === null &&
    noTempo.tempo.reason === "tempo_analysis_disabled" &&
    noTempo.tempo.confidence === 0,
  noTempo.tempo,
);
const tempoOnly = analyzePCM([selectivePulse], sr, { analyzeKey: false });
check(
  "Disabling key leaves 128 BPM measurement enabled",
  Math.abs(tempoOnly.bpm - 128) < 1 &&
    tempoOnly.grid?.beats.length > 20 &&
    tempoOnly.key === null,
  { bpm: tempoOnly.bpm, key: tempoOnly.key },
);
const neither = analyzePCM([selectiveTonal], sr, {
  analyzeKey: false,
  analyzeTempo: false,
});
check(
  "Both disabled leave actual level measurements unchanged",
  neither.key === null &&
    neither.bpm === null &&
    neither.grid === null &&
    neither.gain.rmsDbfs === selectiveKey.gain.rmsDbfs &&
    neither.gain.samplePeak === selectiveKey.gain.samplePeak &&
    Number.isFinite(neither.gain.recommendedDb),
  neither.gain,
);
const fallbackSelective = await analyzeBuffer(
  { numberOfChannels: 1, sampleRate: sr, getChannelData: () => selectiveTonal },
  { analyzeKey: false, analyzeTempo: false },
);
check(
  "Worker-absent buffer API forwards both selective flags",
  fallbackSelective.keyEstimate?.reason === "key_analysis_disabled" &&
    fallbackSelective.tempo?.reason === "tempo_analysis_disabled" &&
    fallbackSelective.key === null &&
    fallbackSelective.bpm === null,
  { key: fallbackSelective.keyEstimate, tempo: fallbackSelective.tempo },
);
const report = {
  executedAt: new Date().toISOString(),
  runtime: "Node executing actual browser PCM module",
  elapsedSeconds: (performance.now() - start) / 1000,
  passed: results.filter((r) => r.passed).length,
  total: results.length,
  results,
};
console.log(JSON.stringify(report, null, 2));
if (results.some((r) => !r.passed)) process.exitCode = 1;
