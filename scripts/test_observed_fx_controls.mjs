import assert from "node:assert/strict";
import fs from "node:fs";
import {
  ExtendedEffectKernel,
  getExtendedEffectControls,
} from "../prototype/extended-effects-kernel.js";
import {
  observedControlAdapters,
  parseBeatModifier,
} from "../prototype/observed-fx-control-adapters.js";
const sr = 24000,
  TAU = 2 * Math.PI;
const sine = (f, seconds = 2, level = 0.3) =>
  Float32Array.from(
    { length: sr * seconds },
    (_, n) => level * Math.sin((TAU * f * n) / sr),
  );
function render(name, params = {}, x = sine(440), depth = 100) {
  const k = new ExtendedEffectKernel(
      { name, on: true, depth, beat: "1/2", params },
      sr,
      120,
    ),
    a = new Float32Array(x.length),
    b = new Float32Array(x.length);
  k.process(x, x, a, b);
  return [a, b, k];
}
function amp(a, f, first = sr / 2, last = a.length) {
  let re = 0,
    im = 0;
  for (let n = first; n < last; n++) {
    re += a[n] * Math.cos((TAU * f * n) / sr);
    im += a[n] * Math.sin((TAU * f * n) / sr);
  }
  return (2 * Math.hypot(re, im)) / (last - first);
}
function diff(a, b) {
  let s = 0;
  for (let n = 0; n < a.length; n++) s += (a[n] - b[n]) ** 2;
  return Math.sqrt(s / a.length);
}
function rms(a) {
  return Math.sqrt(a.reduce((s, v) => s + v * v, 0) / a.length);
}
let passed = 0;
function test(name, fn) {
  const detail = fn();
  console.log("PASS", name, detail ?? "");
  passed++;
}
test("24 observed schemas expose exactly their four observed labels", () => {
  const observed = JSON.parse(
    fs.readFileSync(
      new URL("../docs/research/fx-observed-parameters.json", import.meta.url),
    ),
  );
  const norm = (s) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");
  for (const [name, controls] of Object.entries(observedControlAdapters)) {
    const source = observed.effects.find((e) => e.name === name);
    assert.deepEqual(
      controls.map((c) => norm(c.name)).sort(),
      source.parameters.map((p) => norm(p.label)).sort(),
    );
    assert(controls.every((c) => c.rangeStatus && c.observedLabel));
  }
  return (
    Object.keys(observedControlAdapters).length +
    " observed label schemas; vendor ranges not claimed"
  );
});
test("fraction/dotted/triplet beat modifiers alter actual echo timing", () => {
  assert.equal(parseBeatModifier("1/2 Dotted"), 0.75);
  assert.equal(parseBeatModifier("1 Triplet"), 2 / 3);
  const input = new Float32Array(sr * 2);
  input[0] = 0.5;
  for (const [modifier, seconds] of [
    ["1", 0.25],
    ["1/2 Dotted", 0.1875],
    ["1 Triplet", 1 / 6],
  ]) {
    const a = render(
      "Echo",
      { "Beat Modify": modifier, Feedback: 0, HPF: 20, Drive: 0 },
      input,
    )[0];
    let peak = 0;
    for (let i = 0; i < a.length; i++)
      if (Math.abs(a[i]) > Math.abs(a[peak])) peak = i;
    assert(Math.abs(peak / sr - seconds) < 0.001);
  }
});
test("echo HPF removes bass from delayed audio", () => {
  const x = Float32Array.from(
      { length: sr * 2 },
      (_, n) =>
        0.15 *
        (Math.sin((TAU * 100 * n) / sr) + Math.sin((TAU * 4000 * n) / sr)),
    ),
    a = render("Echo", { Feedback: 0, HPF: 1000, Drive: 0 }, x)[0];
  assert(amp(a, 4000) / amp(a, 100) > 30);
  return { low: amp(a, 100), high: amp(a, 4000) };
});
test("drive adds measurable harmonics independently of echo timing", () => {
  const x = sine(440, 2, 0.7),
    clean = render("Echo", { Feedback: 0, Drive: 0 }, x)[0],
    driven = render("Echo", { Feedback: 0, Drive: 100 }, x)[0];
  assert(amp(driven, 1320) > amp(clean, 1320) + 0.02);
});
test("downsampling uses sample-rate units and aliases unit strings", () => {
  const x = sine(440),
    a = render(
      "Bit Crush",
      {
        Downsampling: "1 kHz",
        "Bit Depth": 16,
        "Low Drive": 0,
        Character: 100,
      },
      x,
    )[0],
    b = render(
      "Bit Crush",
      { Downsampling: 1000, "Bit Depth": 16, "Low Drive": 0, Character: 100 },
      x,
    )[0];
  assert.equal(diff(a, b), 0);
  for (let i = 0; i < a.length - 24; i += 24)
    for (let j = 1; j < 24; j++) assert(a[i] === a[i + j]);
  return "24 held samples at24kHz /1kHz";
});
test("Character changes quantization strength instead of a label", () => {
  const x = Float32Array.from({ length: sr }, (_, n) => (n / sr) * 1.8 - 0.9),
    coarse = render(
      "Bit Crush",
      { "Bit Depth": 3, Downsampling: 48000, Character: 100, "Low Drive": 0 },
      x,
    )[0],
    smooth = render(
      "Bit Crush",
      { "Bit Depth": 3, Downsampling: 48000, Character: 0, "Low Drive": 0 },
      x,
    )[0];
  assert(new Set(coarse).size <= 8);
  assert(new Set(smooth).size > 1000);
});
test("Low Drive creates bass harmonics before quantization", () => {
  const x = sine(100, 2, 0.6),
    a = render(
      "Bit Crush",
      { "Bit Depth": 16, Downsampling: 48000, Character: 0, "Low Drive": 0 },
      x,
    )[0],
    b = render(
      "Bit Crush",
      { "Bit Depth": 16, Downsampling: 48000, Character: 0, "Low Drive": 100 },
      x,
    )[0];
  assert(amp(b, 300) > amp(a, 300) + 0.01);
});
test("HPF18dB slope falls between12dB and24dB response", () => {
  const x = sine(100, 2),
    levels = [6, 12, 18, 24].map((Slope) =>
      amp(render("HPF", { Cutoff: 1000, Resonance: 0.707, Slope }, x)[0], 100),
    );
  for (let i = 1; i < levels.length; i++)
    assert(levels[i] < levels[i - 1] * 0.2);
  return levels;
});
test("reverb width200 doubles side amplitude relative to100", () => {
  const x = new Float32Array(sr * 2);
  x[0] = 0.5;
  const [a, b] = render("Bright Reverb", { Width: 100 }, x),
    [c, d] = render("Bright Reverb", { Width: 200 }, x),
    side1 = Float32Array.from(a, (v, i) => v - b[i]),
    side2 = Float32Array.from(c, (v, i) => v - d[i]);
  assert(Math.abs(rms(side2) / rms(side1) - 2) < 1e-5);
});
test("reverb Send retains dry attack while Wet Mix replaces it", () => {
  const x = new Float32Array(sr).fill(0.2),
    wet = render("Epic Reverb", { "Mix Mode": "Wet Mix" }, x)[0],
    send = render("Epic Reverb", { "Mix Mode": "Send" }, x)[0];
  assert.equal(wet[0], 0);
  assert(Math.abs(send[0] - 0.2) < 1e-7);
});
test("millisecond reverb decay and kHz phaser pitch parse correctly", () => {
  const a = render("Empty Mall Verb", { Decay: "299 ms" })[0],
    b = render("Empty Mall Verb", { Decay: 0.299 })[0];
  assert.equal(diff(a, b), 0);
  const c = render("Phaser", { Pitch: "2.00 kHz" })[0],
    d = render("Phaser", { Pitch: 2000 })[0];
  assert.equal(diff(c, d), 0);
});
test("chorus Delay changes actual first arrival", () => {
  const x = new Float32Array(sr);
  x[0] = 0.4;
  const first = (delay) => {
    const a = render(
      "Chorus Basic",
      { Delay: delay, "LFO Depth": 0, Feedback: 0 },
      x,
    )[0];
    return a.findIndex((v) => Math.abs(v) > 1e-6) / sr;
  };
  assert(Math.abs(first(20) - first(5) - 0.015) < 0.0001);
});
test("LFO shapes produce different filter and tremolo trajectories", () => {
  for (const name of ["LFO Filter", "Tremolo"]) {
    const a = render(name, { "LFO Shape": "Sine" })[0],
      b = render(name, { "LFO Shape": "Square" })[0];
    assert(diff(a, b) > 0.02);
  }
});
test("Stereo moves transform gate timing independently per channel", () => {
  const x = new Float32Array(sr).fill(0.2),
    [a, b] = render(
      "Transform",
      { Noise: 0, Skew: 50, Stereo: 100, "Beat Modify": 1 },
      x,
    );
  assert(diff(a, b) > 0.1);
  for (let i = 0; i < sr; i++) assert(Math.abs(a[i] + b[i] - 0.2) < 1e-6);
});
test("Echo Out Max Feedback extends decay and Echo Level scales only captured output", () => {
  const x = new Float32Array(sr * 3);
  x[100] = 0.4;
  const low = render(
      "Clean Echo Out",
      { "Max Feedback": 20, "Echo Level": 100 },
      x,
    )[0],
    high = render(
      "Clean Echo Out",
      { "Max Feedback": 90, "Echo Level": 100 },
      x,
    )[0],
    half = render(
      "Clean Echo Out",
      { "Max Feedback": 90, "Echo Level": 50 },
      x,
    )[0];
  assert(rms(high.subarray(sr)) > rms(low.subarray(sr)) * 10);
  assert(Math.abs(rms(half) / rms(high) - 0.5) < 1e-6);
});
console.log(`${passed}/${passed} observed-control signal checks passed.`);
