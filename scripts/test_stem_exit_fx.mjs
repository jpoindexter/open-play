import assert from "node:assert/strict";
import { renderStemExitPCM } from "../prototype/stem-exit-fx.js";
const sr = 24000,
  TAU = 2 * Math.PI;
function tone(frequency, seconds = 3) {
  return Float32Array.from(
    { length: sr * seconds },
    (_, n) => 0.3 * Math.sin((TAU * frequency * n) / sr),
  );
}
function rms(a, start = 0, end = a.length) {
  let energy = 0;
  for (let n = start; n < end; n++) energy += a[n] ** 2;
  return Math.sqrt(energy / Math.max(1, end - start));
}
function diff(a, b) {
  let max = 0;
  for (let n = 0; n < a.length; n++) max = Math.max(max, Math.abs(a[n] - b[n]));
  return max;
}
function hz(a, start, end) {
  let crossings = 0;
  for (let n = Math.floor(start * sr) + 1; n < end * sr; n++)
    if (a[n - 1] < 0 && a[n] >= 0) crossings++;
  return crossings / (end - start);
}
let count = 0;
function test(name, fn) {
  fn();
  console.log("PASS", name);
  count++;
}
for (const kind of ["echo", "brake"]) {
  test(`${kind}: never reads post-trigger markers`, () => {
    const original = tone(440),
      changed = original.slice();
    changed.fill(0.8, sr);
    const a = renderStemExitPCM({
        channels: [original],
        sampleRate: sr,
        offset: 1,
        kind,
      }),
      b = renderStemExitPCM({
        channels: [changed],
        sampleRate: sr,
        offset: 1,
        kind,
      });
    assert.equal(diff(a.channels[0], b.channels[0]), 0);
    assert(rms(a.channels[0]) > 0.01);
    assert.equal(a.capture.endFrameExclusive, sr);
  });
  test(`${kind}: trigger at start is silent, not future/end wrap`, () => {
    const a = renderStemExitPCM({
      channels: [tone(440)],
      sampleRate: sr,
      offset: 0,
      kind,
    });
    assert.equal(rms(a.channels[0]), 0);
    assert(a.capture.paddedFrames > 0);
  });
  test(`${kind}: stereo and prepared buffer preserved`, () => {
    const left = tone(330),
      right = tone(660),
      a = renderStemExitPCM({
        channels: [left, right],
        sampleRate: sr,
        offset: 1.5,
        rate: 0.8,
        bpm: 96,
        kind,
      });
    assert(a.channels.every((c) => c.every(Number.isFinite)));
    assert(diff(a.channels[0], a.channels[1]) > 0.01);
    assert.equal(a.beatSeconds, 60 / 96);
    assert(a.channels.every((c) => c.at(-1) === 0));
  });
  test(`${kind}: partial initial history uses silence padding`, () => {
    const a = renderStemExitPCM({
      channels: [tone(440)],
      sampleRate: sr,
      offset: 0.1,
      kind,
    });
    assert.equal(a.capture.startFrame, 0);
    assert.equal(a.capture.endFrameExclusive, sr * 0.1);
    assert.equal(a.capture.paddedFrames, sr * 0.4);
  });
}
test("echo beat repeats decay by configured ratio and end finitely", () => {
  const a = renderStemExitPCM({
      channels: [tone(440)],
      sampleRate: sr,
      offset: 1,
      kind: "echo",
    }),
    x = a.channels[0],
    N = sr / 2,
    levels = [];
  for (let i = 0; i < 8; i++) levels.push(rms(x, i * N, (i + 1) * N));
  for (let i = 1; i < levels.length; i++)
    assert(Math.abs(levels[i] / levels[i - 1] - a.feedback) < 0.003);
  assert(levels.at(-1) < 0.0002);
  assert.equal(a.duration, 4.5);
});
test("brake pitch slows progressively and stops within one beat", () => {
  const a = renderStemExitPCM({
      channels: [tone(440)],
      sampleRate: sr,
      offset: 1,
      kind: "brake",
    }),
    x = a.channels[0];
  assert.equal(a.duration, 0.5);
  const early = hz(x, 0.02, 0.12),
    late = hz(x, 0.35, 0.45);
  assert(early > late * 3);
  assert(rms(x, x.length - 120) < 0.001);
  assert.equal(x.at(-1), 0);
  console.log({ earlyHz: early, lateHz: late, stopSeconds: a.duration });
});
test("rate changes preserve audible beat duration and source-space capture length", () => {
  for (const speed of [0.5, 1, 2]) {
    const a = renderStemExitPCM({
      channels: [tone(440)],
      sampleRate: sr,
      offset: 2,
      rate: speed,
      bpm: 120,
      kind: "brake",
    });
    assert.equal(a.duration, 0.5);
    assert.equal(a.capture.inputFrames, sr * 0.5 * speed);
  }
});
console.log(`${count}/${count} stem exit signal checks passed.`);
