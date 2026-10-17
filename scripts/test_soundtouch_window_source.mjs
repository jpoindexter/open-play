import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {SoundTouchTransport} from '../experiments/keylock-soundtouch/pull-transport.mjs';
const reportPath = process.argv.find(x => x.startsWith('--report='))?.slice(9);
assert(reportPath && !fs.existsSync(reportPath));
let WindowPCMSource, loadError;
try {({WindowPCMSource} = await import('../experiments/keylock-soundtouch/window-source.mjs'));} catch (error) {loadError = error.message;}
const checks = [], digest = data => crypto.createHash('sha256').update(new Uint8Array(data.buffer)).digest('hex');
function check(name, run) {const evidence = {}; try {assert.equal(typeof WindowPCMSource, 'function', 'Bounded PCM source is not implemented');run(evidence); checks.push({name, passed: true, evidence});} catch (error) {checks.push({name, passed: false, evidence, error: {name: error.name, message: error.message}});}}
function fixture(sr, seconds = 14) {return [330, 550].map((hz, c) => Float32Array.from({length: sr * seconds}, (_, i) => .14 * Math.sin(2 * Math.PI * hz * i / sr + [.17, .53][c])));}
function append(store, channels, frames = store.sampleRate / 2) {
  const startFrame = store.endFrame;
  const data = channels.map(c => c.slice(startFrame, startFrame + frames));
  return store.append({startFrame, buffers: [data]});
}
for (const sr of [44100, 48000]) {
  check(`Contiguous PCM copies preserve exact stereo samples and drop only whole chunks (${sr})`, e => {
    const source = fixture(sr), store = new WindowPCMSource({sampleRate: sr, durationFrames: sr * 14, channelCounts: [2], maxRetainedFrames: sr * 4});
    for (let i = 0; i < 6; i++) append(store, source);
    const first = sr / 2 - 20, pcm = new Float32Array(1024 * 2);
    store.readStereo(0, 0, first, 1024, pcm);
    for (let i = 0; i < 1024; i++) for (let c = 0; c < 2; c++) assert.equal(pcm[i * 2 + c], source[c][first + i]);
    const extent = store.dropBefore(sr * 1.25, {protectedFrame: sr * 2});
    assert.equal(extent.startFrame, sr); assert.equal(extent.endFrame, sr * 3);
    assert.throws(() => store.readStereo(0, 0, sr - 1, 128, pcm), {name: 'CoverageError'});
    e.extent = extent; e.pcmSHA256 = digest(pcm); e.snapshot = store.snapshot(); store.dispose();
  });
  check(`Missing future PCM is an error; only the real source endpoint permits zero padding (${sr})`, e => {
    const store = new WindowPCMSource({sampleRate: sr, durationFrames: sr, channelCounts: [1], maxRetainedFrames: sr * 2});
    const samples = new Float32Array(sr).fill(.25); append(store, [samples]);
    const out = new Float32Array(256).fill(.9), before = digest(out);
    assert.throws(() => store.readStereo(0, 0, sr / 2 - 10, 128, out), {name: 'CoverageError'});
    assert.equal(digest(out), before, 'Rejected reads must not partially alter the destination');
    append(store, [samples]); store.readStereo(0, 0, sr - 10, 128, out);
    assert(out.slice(0, 20).every(v => v === .25)); assert(out.slice(20).every(v => v === 0));
    e.snapshot = store.snapshot(); store.dispose();
  });
  check(`Invalid append, quota exhaustion and protected drop leave source ownership unchanged (${sr})`, e => {
    const source = fixture(sr), store = new WindowPCMSource({sampleRate: sr, durationFrames: sr * 14, channelCounts: [2], maxRetainedFrames: sr});
    append(store, source); const before = JSON.stringify(store.snapshot());
    assert.throws(() => store.append({startFrame: 1, buffers: [[new Float32Array(10), new Float32Array(10)]]}));
    assert.throws(() => store.append({startFrame: store.endFrame, buffers: [[new Float32Array(10), new Float32Array(10).fill(NaN)]]}));
    assert.throws(() => store.dropBefore(sr / 2, {protectedFrame: sr / 4}), {name: 'InUseError'});
    assert.equal(JSON.stringify(store.snapshot()), before);
    append(store, source); const full = JSON.stringify(store.snapshot());
    assert.throws(() => append(store, source), {name: 'QuotaExceededError'}); assert.equal(JSON.stringify(store.snapshot()), full);
    e.snapshot = store.dispose(); assert.equal(e.snapshot.retainedPCMBytes, 0);
    assert.throws(() => append(store, source), {name: 'InvalidStateError'});
  });
  check(`Real DSP on refilled bounded PCM matches whole-source output bit-for-bit (${sr})`, e => {
    const source = fixture(sr), store = new WindowPCMSource({sampleRate: sr, durationFrames: sr * 14, channelCounts: [2], maxRetainedFrames: sr * 4});
    for (let i = 0; i < 6; i++) append(store, source);
    const windowed = new SoundTouchTransport({sampleRate: sr, store}), whole = new SoundTouchTransport({sampleRate: sr, buffers: [source]});
    const command = {type: 'start', frame: 256, rate: 1.08, semitones: 2}; windowed.schedule(command); whole.schedule(command);
    let peakBytes = 0, blocks = 0;
    for (let frame = 0; frame < sr * 8; frame += 128) {
      const position = windowed.stateAt(frame).position;
      const keep = Math.max(0, Math.floor((position - .5) * sr / (sr / 2)) * (sr / 2));
      const protectedFrame = Math.min(...windowed.snapshot().epochs.flatMap(v => v.counters.map(p => p.sourceCursorFrame)));
      store.dropBefore(keep, {protectedFrame});
      const target = Math.min(sr * 14, Math.ceil((position + 2) * sr / (sr / 2)) * (sr / 2));
      while (store.endFrame < target) append(store, source);
      const a = windowed.render(frame), b = whole.render(frame);
      for (let c = 0; c < 2; c++) assert.equal(digest(a[0][c]), digest(b[0][c]));
      peakBytes = Math.max(peakBytes, store.snapshot().retainedPCMBytes); blocks++;
    }
    assert(peakBytes <= sr * 4 * 2 * 4); assert(store.startFrame > 0);
    const before = JSON.stringify(windowed.snapshot());
    assert.throws(() => windowed.schedule({type: 'seek', frame: windowed.nextFrame + 256, position: 12}), {name: 'CoverageError'});
    assert.equal(JSON.stringify(windowed.snapshot()), before);
    e.blocks = blocks; e.peakRetainedPCMBytes = peakBytes; e.store = store.snapshot();
    windowed.dispose(); whole.dispose(); store.dispose();
  });
}
const result = {created_at: new Date().toISOString(), passed: checks.filter(c => c.passed).length, failed: checks.filter(c => !c.passed).length,
  loadError, checks, scope: 'Actual public DSP plus bounded source geometry/retention and error contracts in serial Node. No browser/native/SRC/cancellation/music/latency or full parity acceptance.'};
fs.writeFileSync(reportPath, JSON.stringify(result, null, 2) + '\n', {flag: 'wx'});
console.log(JSON.stringify({passed: result.passed, failed: result.failed, loadError, failures: checks.filter(c => !c.passed).map(c => ({name: c.name, error: c.error.message}))}, null, 2));
assert.equal(result.failed, 0);
