import assert from "node:assert/strict";
import {
  ExtendedEffectKernel,
  extendedEffectNames,
  channelEffectNames,
  getExtendedEffectControls,
} from "../prototype/extended-effects-kernel.js";
const sr = 24000,
  seconds = 3.2,
  N = Math.floor(sr * seconds),
  TAU = 2 * Math.PI;
const input = new Float32Array(N),
  right = new Float32Array(N);
for (let n = 0; n < N; n++) {
  const t = n / sr;
  input[n] =
    0.18 * Math.sin(TAU * 220 * t) +
    0.1 * Math.sin(TAU * 1900 * t) +
    0.08 * Math.sin(TAU * 73 * t);
  right[n] = 0.15 * Math.sin(TAU * 330 * t) + 0.08 * Math.sin(TAU * 2900 * t);
  if (n % (sr / 4) < 50) input[n] += 0.2;
}
function render(
  name,
  { params = {}, depth = 100, on = true, l = input, r = right, rate = sr } = {},
) {
  const k = new ExtendedEffectKernel(
      { name, params, depth, on, beat: "1/2" },
      rate,
      120,
    ),
    a = new Float32Array(l.length),
    b = new Float32Array(l.length);
  k.process(l, r, a, b);
  return [a, b];
}
function rms(a, start = 0, end = a.length) {
  let s = 0;
  for (let n = start; n < end; n++) s += a[n] * a[n];
  return Math.sqrt(s / (end - start));
}
function diff(a, b) {
  let sum = 0;
  for (let n = 0; n < a.length; n++) sum += (a[n] - b[n]) ** 2;
  return Math.sqrt(sum / a.length);
}
function energy(a, start, end) {
  let sum = 0;
  for (let n = start; n < end; n++) sum += a[n] * a[n];
  return sum;
}
function tone(hz, secs = 2, level = 0.4, rate = sr) {
  return Float32Array.from(
    { length: Math.floor(rate * secs) },
    (_, n) => level * Math.sin((TAU * hz * n) / rate),
  );
}
function amplitude(a, hz, from = sr / 2, to = a.length, rate = sr) {
  let re = 0,
    im = 0;
  for (let n = from; n < to; n++) {
    re += a[n] * Math.cos((TAU * hz * n) / rate);
    im -= a[n] * Math.sin((TAU * hz * n) / rate);
  }
  return (2 * Math.hypot(re, im)) / (to - from);
}
let passed = 0;
const checks = [];
function test(name, fn) {
  try {
    const detail = fn();
    checks.push({ name, status: "pass", detail });
    passed++;
    console.log("PASS", name, detail ?? "");
  } catch (e) {
    checks.push({ name, status: "fail", error: e.message });
    console.error("FAIL", name, e.message);
    process.exitCode = 1;
  }
}
const outputs = new Map();
for (const name of [...extendedEffectNames, ...channelEffectNames])
  test(`functional signal: ${name}`, () => {
    const [a, b] = render(name);
    assert(a.every(Number.isFinite) && b.every(Number.isFinite));
    assert(rms(a) > 1e-5, "must produce processed audio");
    assert(diff(a, input) > 0.001, "must change audio, not passthrough");
    assert(Math.max(...a.subarray(0, 10000).map(Math.abs)) <= 4);
    const [dry] = render(name, { depth: 0 });
    assert.equal(diff(dry, input), 0, "zero depth must be exact dry");
    outputs.set(name, [a, b]);
    return { rms: rms(a), difference: diff(a, input) };
  });
test("every visible parameter affects measured output", () => {
  const failures = [];
  for (const name of [...extendedEffectNames, ...channelEffectNames])
    for (const c of getExtendedEffectControls(name)) {
      const depth = /Min Freq|Max Freq/.test(c.name) ? 75 : 100;
      // Phase offsets of -100%/+100% coincide at half a cycle; contrast neutral to full stereo.
      const a = render(name, {
          depth,
          params: {
            [c.name]: c.options
              ? c.options[0]
              : c.name === "Stereo"
                ? 0
                : c.min,
          },
        }),
        b = render(name, {
          depth,
          params: { [c.name]: c.options ? c.options.at(-1) : c.max },
        });
      if (Math.max(diff(a[0], b[0]), diff(a[1], b[1])) < 1e-5)
        failures.push(`${name}: ${c.name}`);
    }
  assert.deepEqual(failures, []);
  return "stereo-aware control contrast >0.00001 (neutral-to-extreme for cyclic stereo phase)";
});
test("no exact audio aliases among 55 named variants", () => {
  const pairs = [];
  for (let i = 0; i < extendedEffectNames.length; i++)
    for (let j = 0; j < i; j++)
      if (
        [0, 1].every(
          (c) =>
            diff(
              outputs.get(extendedEffectNames[i])[c],
              outputs.get(extendedEffectNames[j])[c],
            ) < 1e-7,
        )
      )
        pairs.push([extendedEffectNames[i], extendedEffectNames[j]]);
  assert.deepEqual(pairs, []);
  return "all default stereo outputs distinct on a multitone/transient fixture";
});
test("bit crush quantization and sample hold", () => {
  const x = Float32Array.from({ length: sr }, (_, n) => (2 * n) / sr - 1),
    a = render("Bit Crush", {
      params: { Bits: 4, Reduction: 4 },
      l: x,
      r: x,
    })[0];
  assert(new Set(a).size <= 16);
  for (let n = 0; n < a.length; n += 4)
    for (let j = 1; j < 4; j++) assert.equal(a[n], a[n + j]);
  return { levels: new Set(a).size, hold: 4 };
});
test("ping pong alternates stereo impulse repeats", () => {
  const x = new Float32Array(sr * 2);
  x[0] = 0.5;
  const [a, b] = render("Ping Pong Delay", {
    l: x,
    r: x,
    params: { Feedback: 70, Tone: 18000 },
  });
  const T = sr / 4,
    w = 100;
  const ratios = [];
  for (let k = 1; k <= 4; k++) {
    const L = energy(a, k * T, k * T + w),
      R = energy(b, k * T, k * T + w);
    ratios.push([L, R]);
    assert((k % 2 ? L : R) > 100 * (k % 2 ? R : L) + 1e-10);
  }
  return ratios;
});
test("high pass rejects bass and preserves high band", () => {
  const x = Float32Array.from(
      { length: sr * 2 },
      (_, n) =>
        0.2 *
        (Math.sin((TAU * 100 * n) / sr) + Math.sin((TAU * 4000 * n) / sr)),
    ),
    a = render("HPF", {
      l: x,
      r: x,
      params: { Cutoff: 1000, Resonance: 0.707 },
    })[0];
  const low = amplitude(a, 100),
    high = amplitude(a, 4000);
  assert(high / low > 10);
  return { bass: low, high, ratio: high / low };
});
test("transform has timed silent windows", () => {
  const x = new Float32Array(sr * 2).fill(0.2),
    a = render("Transform", { l: x, r: x, params: { Rate: 2, Gate: 50 } })[0];
  assert(rms(a, sr / 4, sr / 2) < 1e-10);
  assert(rms(a, 0, sr / 4) > 0.19);
  return "250ms open / 250ms closed at 2Hz";
});
test("braker slows sine pitch then reaches silence", () => {
  const x = tone(440, 3),
    a = render("Braker", { l: x, r: x, params: { Duration: 2 } })[0];
  function crossings(start, end) {
    let count = 0;
    for (let n = start + 1; n < end; n++)
      if (a[n - 1] < 0 && a[n] >= 0) count++;
    return (count / (end - start)) * sr;
  }
  const early = crossings(sr * 0.1, sr * 0.3),
    late = crossings(sr * 1.5, sr * 1.7);
  assert(early > late * 2);
  assert(rms(a, sr * 2.1) < 1e-9);
  return { earlyHz: early, lateHz: late };
});
test("clean echo capture rejects later input markers", () => {
  const x = new Float32Array(sr * 2);
  x[100] = 0.4;
  const y = x.slice();
  y[sr] = 0.8;
  const a = render("Clean Echo Out", { l: x, r: x })[0],
    b = render("Clean Echo Out", { l: y, r: y })[0];
  assert.equal(diff(a, b), 0);
  assert(rms(a, sr / 4, sr) > 0.001);
  return "late marker absent; captured tail remains";
});
test("reverb persists after silence and width zero collapses channels", () => {
  const x = new Float32Array(sr * 2);
  x[0] = 0.4;
  const [a, b] = render("Epic Reverb", {
    l: x,
    r: x,
    params: { Width: 0, Decay: 3 },
  });
  assert(rms(a, sr / 2, sr) > 0.00001);
  assert.equal(diff(a, b), 0);
  return { tailRms: rms(a, sr / 2, sr) };
});
test("halftime pitch lock preserves tone while unlocked resampling lowers it", () => {
  const x = tone(440, 3),
    a = render("Retro Halftime", {
      l: x,
      r: x,
      params: { "Pitch Lock": 1, Speed: 0.5, Length: 1 },
    })[0],
    b = render("Retro Halftime", {
      l: x,
      r: x,
      params: { "Pitch Lock": 0, Speed: 0.5, Length: 1 },
    })[0];
  const locked440 = amplitude(a, 440, sr),
    locked220 = amplitude(a, 220, sr),
    unlocked220 = amplitude(b, 220, sr);
  assert(locked440 > locked220 * 5);
  assert(unlocked220 > amplitude(b, 440, sr) * 5);
  return { locked440, locked220, unlocked220 };
});
test("ring modulation has sum and difference sidebands", () => {
  const x = tone(440),
    a = render("Space Invader", {
      l: x,
      r: x,
      params: { Frequency: 220, Rate: 0.05, Steps: 2 },
    })[0];
  assert(amplitude(a, 220) > 0.1);
  assert(amplitude(a, 660) > 0.1);
  assert(amplitude(a, 440) < 0.01);
  return "220Hz and 660Hz sidebands from 440Hz source and 220Hz carrier";
});
test("silence remains silent except explicit Channel Noise generator", () => {
  const x = new Float32Array(sr),
    fail = [];
  for (const name of [
    ...extendedEffectNames,
    ...channelEffectNames.filter((n) => n !== "Channel Noise"),
  ])
    if (rms(render(name, { l: x, r: x })[0]) > 1e-9) fail.push(name);
  assert.deepEqual(fail, []);
  return "no unexpected oscillator output from silent input";
});
test("beat timing holds at 44.1 and 48kHz", () => {
  for (const rate of [44100, 48000]) {
    const x = new Float32Array(rate);
    x[0] = 0.4;
    const a = render("Ping Pong Delay", {
      l: x,
      r: x,
      rate,
      params: { Feedback: 0, Tone: 18000 },
    })[0];
    let peak = 0;
    for (let n = 0; n < a.length; n++)
      if (Math.abs(a[n]) > Math.abs(a[peak])) peak = n;
    assert(Math.abs(peak / rate - 0.25) < 0.001);
  }
  return "first repeat at 250ms for 120BPM × 1/2 beat";
});
test("live depth updates preserve delay history and ramp output", () => {
  const k = new ExtendedEffectKernel(
    {
      name: "Echo",
      on: true,
      depth: 100,
      beat: "1/2",
      params: { Feedback: 80, Tone: 18000 },
    },
    sr,
    120,
  );
  const before = new Float32Array(sr / 2);
  before[0] = 0.5;
  const left = new Float32Array(before.length),
    rightOut = new Float32Array(before.length);
  k.process(before, before, left, rightOut);
  const prior = k.n;
  k.update({ name: "Echo", on: true, depth: 50, params: {} }, 120);
  assert.equal(k.n, prior);
  const quiet = new Float32Array(sr / 2),
    a = new Float32Array(quiet.length),
    b = new Float32Array(quiet.length);
  k.process(quiet, quiet, a, b);
  assert(rms(a) > 0.0001, "existing echo tail must survive updating depth");
  assert(Math.abs(k.depth - 0.5) < 0.00001);
  return { historyFrames: prior, tailRms: rms(a), settledDepth: k.depth };
});
test("loop capture repeats a preserved fragment", () => {
  const k = new ExtendedEffectKernel(
    {
      name: "Roll",
      on: true,
      depth: 100,
      beat: "1/2",
      params: { Length: 1, Speed: 1 },
    },
    sr,
    120,
  );
  const x = Float32Array.from(
    { length: sr * 2 },
    (_, n) => 0.2 * Math.sin(n * 0.013) + 0.1 * Math.sin(n * 0.037),
  );
  const a = new Float32Array(x.length),
    b = new Float32Array(x.length);
  k.process(x, x, a, b);
  const division = sr / 4,
    capture = sr / 2;
  let error = 0;
  for (let i = 0; i < division; i++)
    error += Math.abs(a[capture + i] - a[capture + division + i]);
  assert(error < division * 1e-7);
  return { captureSeconds: 0.5, repeatSeconds: 0.25 };
});
test("stutter has silent gaps beyond ordinary roll", () => {
  const x = new Float32Array(sr * 2).fill(0.3),
    plain = render("Roll", { l: x, r: x })[0],
    stutter = render("Stutter Roll", {
      l: x,
      r: x,
      params: { Gate: 50, Pulses: 4 },
    })[0];
  let silent = 0;
  for (let i = sr; i < 2 * sr; i++) if (Math.abs(stutter[i]) < 1e-8) silent++;
  assert(silent > sr * 0.45 && silent < sr * 0.55);
  assert(rms(plain, sr) > 0.29);
  return { silentFraction: silent / sr };
});
test("phaser and flanger change over time rather than static coloration", () => {
  const x = Float32Array.from(
    { length: sr * 3 },
    (_, n) => 0.2 * Math.sin((2 * Math.PI * 700 * n) / sr),
  );
  for (const name of ["Phaser", "Flanger"]) {
    const a = render(name, {
      l: x,
      r: x,
      params: { Rate: 1, "Mod Depth": 100 },
    })[0];
    const windows = [];
    for (let i = 0; i < 8; i++)
      windows.push(rms(a, sr + (i * sr) / 8, sr + ((i + 1) * sr) / 8));
    assert(
      Math.max(...windows) - Math.min(...windows) > 0.025,
      name + " must have time-varying notches",
    );
  }
  return "windowed tone energy changes with modulation phase";
});
test("Slip Roll subdivision changes recapture the current rolling fragment", () => {
  const rate = 8000,
    k = new ExtendedEffectKernel(
      { name: "Slip Roll", on: true, depth: 100, beat: "1/2", params: {} },
      rate,
      120,
    );
  const x = Float32Array.from(
    { length: rate * 2 },
    (_, n) =>
      0.3 * Math.sin(2 * Math.PI * ((180 * n) / rate + 75 * (n / rate) ** 2)),
  );
  k.process(x, x, new Float32Array(x.length), new Float32Array(x.length));
  const count = k.n;
  k.update(
    { name: "Slip Roll", on: true, depth: 100, beat: "1/8", params: {} },
    120,
  );
  assert.equal(k.n, count, "source timeline must not reset");
  const quiet = new Float32Array(rate / 4),
    a = new Float32Array(quiet.length),
    b = new Float32Array(quiet.length);
  k.process(quiet, quiet, a, b);
  const length = rate / 16;
  assert(
    diff(a.subarray(0, length), x.subarray(x.length - length)) < 1e-7,
    "new capture must use the recent fragment",
  );
  assert(
    diff(a.subarray(0, length), a.subarray(length, 2 * length)) < 1e-7,
    "new division must repeat at1/8beat",
  );
  k.update(
    { name: "Slip Roll", on: true, depth: 100, beat: "1/2", params: {} },
    120,
  );
  assert.equal(k.captureLength, rate / 4, "division must grow again");
  return { newDivisionFrames: length, sourceFramesPreserved: count };
});
test("Slow Roll Out owns its capture beyond the rolling buffer horizon", () => {
  const rate = 8000,
    length = rate * 16,
    x = new Float32Array(length);
  for (let n = 0; n < rate / 4; n++)
    x[n] = 0.3 * Math.sin((2 * Math.PI * 220 * n) / rate);
  const changed = x.slice();
  for (let n = rate * 12; n < rate * 12.25; n++)
    changed[n] = 0.3 * Math.sin((2 * Math.PI * 880 * n) / rate);
  const a = render("Slow Roll Out", {
      l: x,
      r: x,
      rate,
      params: { Duration: 8 },
    })[0],
    b = render("Slow Roll Out", {
      l: changed,
      r: changed,
      rate,
      params: { Duration: 8 },
    })[0];
  assert.equal(diff(a.subarray(rate * 12), b.subarray(rate * 12)), 0);
  assert(rms(a, rate * 12) > 1e-4);
  return "late880Hzmarker cannot overwrite the first captured220Hzphrase";
});
test("Length8 at60BPM captures8seconds rather than truncating4", () => {
  const rate = 8000,
    k = new ExtendedEffectKernel(
      { name: "Roll", on: true, depth: 100, beat: "8", params: { Length: 8 } },
      rate,
      60,
    );
  assert.equal(k.captureLength, rate * 8);
  assert.equal(k.T, 8);
  const x = Float32Array.from(
      { length: rate * 10 },
      (_, n) =>
        0.3 * Math.sin((2 * Math.PI * (n < rate * 4 ? 220 : 880) * n) / rate),
    ),
    a = new Float32Array(x.length),
    b = new Float32Array(x.length);
  k.process(x, x, a, b);
  assert(
    diff(a.subarray(rate * 5, rate * 6), x.subarray(rate * 5, rate * 6)) < 1e-7,
    "capture must still be live at5seconds",
  );
  return { captureFrames: k.captureLength, beatSeconds: k.T };
});
test("Spiral Echo raises pitch on successive feedback repeats", () => {
  const x = Float32Array.from({ length: sr * 2 }, (_, n) =>
      n < sr * 0.12 ? 0.4 * Math.sin((TAU * 440 * n) / sr) : 0,
    ),
    a = render("Spiral Echo", {
      l: x,
      r: x,
      params: { Pitch: 4, Feedback: 70, Tone: 18000 },
    })[0],
    measured = [];
  for (const [index, start] of [0.28, 0.56, 0.84].entries()) {
    let strongest = 0,
      hz = 0;
    for (let f = 300; f < 1100; f++) {
      const level = amplitude(
        a,
        f,
        Math.floor(sr * start),
        Math.floor(sr * (start + 0.1)),
      );
      if (level > strongest) {
        strongest = level;
        hz = f;
      }
    }
    const expected = 440 * 2 ** ((index + 1) / 3);
    assert(Math.abs(hz / expected - 1) < 0.03);
    measured.push({ hz, expected });
  }
  return measured;
});
console.log(
  JSON.stringify(
    {
      passed,
      total: checks.length,
      failed: checks.filter((x) => x.status === "fail").map((x) => x.name),
    },
    null,
    2,
  ),
);
