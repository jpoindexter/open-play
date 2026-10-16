import { ExtendedEffectKernel } from "../prototype/extended-effects-kernel.js";
const sr = 8000,
  results = [];
const rmsDifference = (a, b, from = 0) =>
  Math.sqrt(
    a.slice(from).reduce((sum, x, i) => sum + (x - b[from + i]) ** 2, 0) /
      (a.length - from),
  );
const render = (k, input) => {
  const output = new Float32Array(input.length);
  k.process(input, input, output, new Float32Array(input.length));
  return output;
};
const tone = (hz, seconds) =>
  Float32Array.from(
    { length: sr * seconds },
    (_, i) => 0.2 * Math.sin((2 * Math.PI * hz * i) / sr),
  );
const first = tone(220, 1),
  later = tone(880, 1),
  variants = [];
for (const division of ["1/2", "1/8"]) {
  const k = new ExtendedEffectKernel(
    {
      name: "Slip Roll",
      on: true,
      depth: 100,
      beat: "1/2",
      params: { Length: 1, Speed: 1 },
    },
    sr,
    120,
  );
  render(k, first);
  k.update({ name: "Slip Roll", beat: division }, 120);
  variants.push(render(k, later));
}
const difference = rmsDifference(...variants);
results.push({
  name: "Slip Roll subdivision change changes and recaptures output",
  passed: difference > 0.001,
  differenceRms: difference,
  criterion:
    "Changing subdivision cannot leave exactly the same captured playback.",
});
const tails = [];
for (const marker of [false, true]) {
  const k = new ExtendedEffectKernel(
    {
      name: "Slow Roll Out",
      on: true,
      depth: 100,
      beat: "1/2",
      params: { Duration: 8 },
    },
    sr,
    120,
  );
  const input = Float32Array.from({ length: sr * 16 }, (_, i) =>
    i < sr * 0.25
      ? 0.2 * Math.sin((2 * Math.PI * 220 * i) / sr)
      : marker && i >= sr * 12 && i < sr * 12.25
        ? 0.8 * Math.sin((2 * Math.PI * 880 * i) / sr)
        : 0,
  );
  tails.push(render(k, input));
}
const tailDifference = rmsDifference(...tails, sr * 12);
results.push({
  name: "Slow Roll Out preserves capture beyond general ring-buffer wrap",
  passed: tailDifference < 1e-7,
  tailDifferenceRms: tailDifference,
  criterion:
    "Adding a new input marker12s after capture must not change the captured tail.",
});
const long = new ExtendedEffectKernel(
  {
    name: "Roll",
    on: true,
    depth: 100,
    beat: "8",
    params: { Length: 8, Speed: 1 },
  },
  sr,
  60,
);
const input = Float32Array.from(
    { length: sr * 8 },
    (_, i) => 0.2 * Math.sin((2 * Math.PI * (i < sr * 4 ? 220 : 880) * i) / sr),
  ),
  output = render(long, input);
function amplitude(hz) {
  let re = 0,
    im = 0;
  for (let n = sr * 5; n < sr * 6; n++) {
    re += output[n] * Math.cos((2 * Math.PI * hz * n) / sr);
    im -= output[n] * Math.sin((2 * Math.PI * hz * n) / sr);
  }
  return (Math.hypot(re, im) * 2) / sr;
}
const oldTone = amplitude(220),
  liveTone = amplitude(880);
results.push({
  name: "Roll honors exposed eight-beat capture at60BPM",
  passed: liveTone > 0.1 && oldTone < 0.01,
  output220Hz: oldTone,
  output880Hz: liveTone,
  requestedSeconds: 8,
  criterion:
    "At5s the8s capture is still collecting live input, not replaying a silently truncated4s capture.",
});
console.log(
  JSON.stringify(
    {
      executedAt: new Date().toISOString(),
      passed: results.filter((r) => r.passed).length,
      total: results.length,
      results,
    },
    null,
    2,
  ),
);
if (results.some((r) => !r.passed)) process.exitCode = 1;
