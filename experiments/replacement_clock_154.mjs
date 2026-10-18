// Recorded replacement render order against actual WASM/SRC; no live devices.
import assert from 'node:assert/strict';
import {existsSync, readFileSync, mkdirSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {copyPCMChunk} from '../prototype/pcm-resample.js';

const root = new URL('../', import.meta.url), capturePath = process.argv[2];
assert(capturePath, 'Pass the original browser154 packet');
const browserBytes = readFileSync(capturePath), browser = JSON.parse(browserBytes);
assert.equal(browser.diagnosticCheckpoint, 154);
const destination = new URL('local-evidence/replacement-clock-154/replay/', root);
mkdirSync(destination, {recursive: true});
assert(!existsSync(new URL('original.json', destination)), 'Preserve earlier originals');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const sr = browser.sampleRate, quantum = 128, registry = new Map();
assert.equal(sr, 44100);
globalThis.sampleRate = sr; globalThis.currentFrame = 0; globalThis.currentTime = 0;
globalThis.AudioWorkletProcessor = class {
  constructor() { this.events = []; this.port = {onmessage: null, postMessage: data => this.events.push(data)}; }
};
globalThis.registerProcessor = (name, ctor) => registry.set(name, ctor);
const modulePath = 'prototype/vendor/signalsmith-stretch/SignalsmithStretch-open-play-replace.mjs';
await import(new URL(modulePath, root));
let sequence = 0;
function call(processor, method, ...args) {
  const id = ++sequence;
  processor.port.onmessage({data: [id, method, ...args]});
  const event = processor.events.findLast(row => row[0] === id);
  assert(event, method);
  if (event[2] === 'error') throw Object.assign(Error(event[1].message), {name: event[1].name});
  return event[1];
}
const authored = [330, 550].map(hz => Float32Array.from({length: 48 * sr}, (_, i) => .06 * Math.sin(2 * Math.PI * hz * i / sr)));
const cases = [];
for (const deck of [1, 2]) {
  const observed = browser.samples[0].decks[deck].remote.startup;
  const command = observed.firstActiveCommand, q = 2 ** (browser.transport[deck].keyShift / 12);
  const firstRenderFrame = observed.firstActiveFrame - observed.inactiveQuantaBeforeFirstActive * quantum;
  const endFrame = Math.ceil((browser.pcm[0].startFrame + browser.pcm[0].frames) / quantum) * quantum;
  const frames = endFrame - firstRenderFrame, preparedFrames = Math.ceil(authored[0].length / q);
  const prepared = await copyPCMChunk(authored, sr, sr / q, 0, preparedFrames);
  const replacements = [];
  for (const c of browser.calls.filter(c => c.deck === deck)) {
    assert(Number.isSafeInteger(c.appliedRenderQuanta) && c.appliedRenderQuanta >= 0);
    assert.equal(c.appliedFrame, firstRenderFrame + c.appliedRenderQuanta * quantum);
    assert(c.firstChannel === 2 || c.firstChannel === 10);
    const pcm = await copyPCMChunk(authored, sr, sr / q, c.startFrame, c.endFrame - c.startFrame);
    assert.deepEqual(pcm[0], prepared[0].subarray(c.startFrame, c.endFrame));
    assert.deepEqual(pcm[1], prepared[1].subarray(c.startFrame, c.endFrame));
    assert.deepEqual([...pcm[0].slice(0, 8)], c.melodyLeftHead);
    assert.deepEqual([...pcm[0].slice(-8)], c.melodyLeftTail);
    const zero = new Float32Array(pcm[0].length);
    replacements.push({...c, sampleBuffers: [zero, zero, pcm[0], pcm[1], zero, zero, zero, zero]});
  }
  replacements.sort((a, b) => a.appliedRenderQuanta - b.appliedRenderQuanta);
  const points = [...new Set([0, preparedFrames, ...replacements.flatMap(c => [c.startFrame, c.endFrame])])].sort((a, b) => a - b);
  for (const c of replacements) assert.equal(points.indexOf(c.endFrame) - points.indexOf(c.startFrame), 1);
  globalThis.currentFrame = observed.createdFrame; globalThis.currentTime = currentFrame / sr;
  const configs = ['first-bank-only', 'both-recorded-banks'].map(name => ({
    name,
    processor: new (registry.get('signalsmith-stretch-open-play-replace'))({numberOfOutputs: 1, outputChannelCount: [18]}),
    output: [Array.from({length: 18}, () => new Float32Array(quantum))],
    samples: [0, 4, 12].map(() => new Float32Array(frames)),
    acknowledgments: [],
  }));
  for (let i = 0; i < observed.notReadyQuanta; i++) {
    globalThis.currentFrame = observed.createdFrame + i * quantum; globalThis.currentTime = currentFrame / sr;
    configs.forEach(c => c.processor.process([[]], c.output, {}));
  }
  globalThis.currentFrame = observed.wasmReadyFrame; globalThis.currentTime = currentFrame / sr;
  for (const c of configs) while (!c.processor.wasmReady) await new Promise(resolve => setImmediate(resolve));
  for (let i = 0; i < points.length - 1; i++) {
    const lo = points[i], hi = points[i + 1], zero = new Float32Array(hi - lo);
    const channels = Array.from({length: 18}, (_, channel) => channel < 2 ? prepared[channel].subarray(lo, hi) : zero);
    for (const c of configs) call(c.processor, 'addBuffers', channels);
  }
  for (const c of configs) call(c.processor, 'schedule', {active: true, ...command});
  let next = 0;
  for (let frame = firstRenderFrame; frame < endFrame; frame += quantum) {
    globalThis.currentFrame = frame; globalThis.currentTime = frame / sr;
    const rendered = (frame - firstRenderFrame) / quantum;
    while (next < replacements.length && replacements[next].appliedRenderQuanta === rendered) {
      const event = replacements[next++];
      for (const c of configs) {
        assert.equal(c.processor.renderQuanta, rendered);
        if (event.firstChannel === 10 && c.name === 'first-bank-only') continue;
        const ack = call(c.processor, 'replaceBufferChannels', event.startFrame, event.firstChannel, event.sampleBuffers);
        assert.equal(ack.appliedFrame, event.appliedFrame);
        assert.equal(ack.appliedRenderQuanta, event.appliedRenderQuanta);
        c.acknowledgments.push(ack);
      }
    }
    for (const c of configs) {
      assert(c.processor.process([[]], c.output, {}));
      [0, 4, 12].forEach((channel, i) => c.samples[i].set(c.output[0][channel], frame - firstRenderFrame));
    }
  }
  assert.equal(next, replacements.length);
  const results = [];
  for (const c of configs) {
    const startup = call(c.processor, 'resourceSnapshot').startup;
    assert.equal(startup.firstActiveFrame, observed.firstActiveFrame);
    assert.equal(startup.inactiveQuantaBeforeFirstActive, observed.inactiveQuantaBeforeFirstActive);
    const pcm = [];
    for (const [i, channel] of [0, 4, 12].entries()) {
      const file = `deck${deck}-${c.name}-${channel}.f32`, bytes = Buffer.from(c.samples[i].buffer);
      writeFileSync(new URL(file, destination), bytes, {flag: 'wx'});
      pcm.push({channel, file, frames, sha256: sha(bytes)});
    }
    results.push({name: c.name, startup, acknowledgments: c.acknowledgments, pcm});
    call(c.processor, 'dispose');
  }
  cases.push({deck, keyShift: browser.transport[deck].keyShift, observedStartup: observed, firstRenderFrame, endFrame, frames,
    replacementCount: replacements.length, partitionChunks: points.length - 1,
    recordedCalls: replacements.map(({sampleBuffers, ...metadata}) => metadata), results});
}
const result = {checkpoint: 154, scope: 'Actual WASM/SRC with recorded startup and exact applied-render-quantum replacement order. Control receives first bank only; treatment receives both. Source heads/tails and full SRC ranges checked. All original input retained from startup; no append/drop, browser async transfer, bank-gate fades or physical output. Not old151 reproduction or full parity.',
  sampleRate: sr, quantum, browserOriginalSHA256: sha(browserBytes), cases,
  sourceHashes: Object.fromEntries([modulePath, 'prototype/pcm-resample.js', 'experiments/replacement_clock_154.mjs'].map(p => [p, sha(readFileSync(new URL(p, root)))])),
  original151FailureStillOpen: true, fullParityAcceptance: false};
writeFileSync(new URL('original.json', destination), JSON.stringify(result, null, 2) + '\n', {flag: 'wx'});
console.log(JSON.stringify({checkpoint: 154, cases: cases.map(c => ({deck: c.deck, frames: c.frames, replacementCount: c.replacementCount}))}, null, 2));
