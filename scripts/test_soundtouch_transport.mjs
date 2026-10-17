import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const reportPath = process.argv.find(x => x.startsWith('--report='))?.slice(9);
assert(reportPath && !fs.existsSync(reportPath), 'Supply a new report identity');
let Transport, loadError;
try { ({SoundTouchTransport: Transport} = await import('../experiments/keylock-soundtouch/pull-transport.mjs')); }
catch (error) { loadError = {name: error.name, message: error.message}; }
const checks = [];
const hash = array => crypto.createHash('sha256').update(new Uint8Array(array.buffer)).digest('hex');
const fixture = (sr, seconds = 14, tones = [330, 550]) => tones.map((hz, c) =>
  Float32Array.from({length: Math.round(sr * seconds)}, (_, i) => .14 * Math.sin(2 * Math.PI * hz * i / sr + [.17, .53][c])));
async function check(name, run) {
  const evidence = {};
  try { assert.equal(typeof Transport, 'function', 'The isolated SoundTouch transport is not implemented'); await run(evidence); checks.push({name, passed: true, evidence}); }
  catch (error) { checks.push({name, passed: false, evidence, error: {name: error.name, message: error.message, stack: error.stack}}); }
}
function capture(transport, endFrame) {
  const first = transport.nextFrame, end = Math.ceil(endFrame / 128) * 128;
  const result = transport.channelCounts.map(n => Array.from({length: n}, () => new Float32Array(end - first)));
  for (let at = first; at < end; at += 128) {
    const output = transport.render(at, 128);
    output.forEach((source, s) => source.forEach((channel, c) => result[s][c].set(channel, at - first)));
  }
  assert(result.every(source => source.every(channel => channel.every(Number.isFinite))), 'All retained output must be finite');
  return result;
}
function metrics(channel, sr, from, to) {
  const data = channel.subarray(Math.round(from * sr), Math.round(to * sr));
  let mean = 0, power = 0; for (const value of data) { mean += value; power += value * value; } mean /= data.length;
  const crossings = [];
  for (let i = 1; i < data.length; i++) if (data[i - 1] < mean && data[i] >= mean)
    crossings.push(i - 1 - (data[i - 1] - mean) / (data[i] - data[i - 1]));
  return {rms: Math.sqrt(power / data.length), hz: (crossings.length - 1) * sr / (crossings.at(-1) - crossings[0]), sha256: hash(channel)};
}
for (const sampleRate of [44100, 48000]) {
  await check(`Actual stereo +2 at rate1.08 preserves the fixed 1Hz criterion (${sampleRate})`, e => {
    const t = new Transport({sampleRate, buffers: [fixture(sampleRate)]});
    const ack = t.schedule({type: 'start', frame: 256, rate: 1.08, semitones: 2, keylock: true, position: 0});
    const out = capture(t, sampleRate * 8);
    e.ack = ack; e.channels = out[0].map((c, i) => metrics(c, sampleRate, 5, 7));
    e.channels.forEach((m, i) => { assert(m.rms > .001); assert(Math.abs(m.hz - [330, 550][i] * 2 ** (2 / 12)) <= 1); });
    assert(Math.abs(t.stateAt(t.nextFrame).position - (t.nextFrame - 256) / sampleRate * 1.08) < 1e-9);
    e.snapshot = t.snapshot(); t.dispose();
  });
  await check(`Pause at a non-quantum frame emits exact silence and freezes nominal position (${sampleRate})`, e => {
    const t = new Transport({sampleRate, buffers: [fixture(sampleRate, 5)]});
    t.schedule({type: 'start', frame: 256, rate: 1.08});
    const frame = Math.floor(sampleRate * 2.3) + 37;
    t.schedule({type: 'pause', frame});
    const out = capture(t, sampleRate * 3);
    assert(out[0].every(c => c.subarray(frame).every(v => v === 0)));
    const state = t.stateAt(t.nextFrame); assert.equal(state.playing, false);
    assert(Math.abs(state.position - (frame - 256) / sampleRate * 1.08) < 1e-9);
    e.state = state; e.frame = frame; e.hashes = out[0].map(hash); t.dispose();
  });
  await check(`Seek creates an isolated fresh epoch and emits the destination region (${sampleRate})`, e => {
    const channels = fixture(sampleRate, 20);
    for (let c = 0; c < 2; c++) for (let i = sampleRate * 10; i < channels[c].length; i++)
      channels[c][i] = .14 * Math.sin(2 * Math.PI * [660, 880][c] * i / sampleRate);
    const t = new Transport({sampleRate, buffers: [channels]});
    const a = t.schedule({type: 'start', frame: 256});
    const b = t.schedule({type: 'seek', frame: sampleRate * 2 + 17, position: 12});
    const out = capture(t, sampleRate * 5);
    e.destination = out[0].map(c => metrics(c, sampleRate, 3, 4));
    e.destination.forEach((m, i) => assert(Math.abs(m.hz - [660, 880][i]) <= 1));
    assert.notEqual(a.generation, b.generation); assert.equal(t.snapshot().epochs.length, 1);
    e.snapshot = t.snapshot(); t.dispose();
  });
  await check(`Rate and pitch updates restore both desired factors in a fresh epoch (${sampleRate})`, e => {
    const t = new Transport({sampleRate, buffers: [fixture(sampleRate)]});
    t.schedule({type: 'start', frame: 256, rate: 1.08, semitones: 2});
    const ack = t.schedule({type: 'update', frame: sampleRate * 3, rate: .75, semitones: -12});
    const out = capture(t, sampleRate * 7);
    e.changed = out[0].map(c => metrics(c, sampleRate, 5, 6));
    e.changed.forEach((m, i) => assert(Math.abs(m.hz - [165, 275][i]) <= 1));
    const state = t.stateAt(t.nextFrame);
    const expected = (sampleRate * 3 - 256) / sampleRate * 1.08 + (t.nextFrame - sampleRate * 3) / sampleRate * .75;
    assert(Math.abs(state.position - expected) < 1e-9); e.state = state; e.ack = ack; t.dispose();
  });
  await check(`Silent input has a bounded nominal EOS without signal-based trimming (${sampleRate})`, e => {
    const t = new Transport({sampleRate, buffers: [[new Float32Array(sampleRate)]]});
    t.schedule({type: 'start', frame: 256}); const out = capture(t, sampleRate * 2);
    assert(out[0][0].every(v => v === 0)); assert.equal(t.stateAt(t.nextFrame).playing, false);
    assert.equal(t.stateAt(t.nextFrame).position, 1); e.snapshot = t.snapshot(); t.dispose();
  });
  await check(`Five positional sources share command frames; stale future epochs are retired (${sampleRate})`, e => {
    const t = new Transport({sampleRate, buffers: Array.from({length: 5}, () => fixture(sampleRate, 3))});
    t.schedule({type: 'start', frame: 256});
    const stale = t.schedule({type: 'seek', frame: sampleRate * 2, position: 1});
    const latest = t.schedule({type: 'update', frame: sampleRate, rate: 1.08});
    assert(latest.superseded.includes(stale.generation));
    const out = capture(t, sampleRate * 2);
    for (let i = 1; i < 5; i++) for (let c = 0; c < 2; c++) assert.equal(hash(out[i][c]), hash(out[0][c]));
    e.snapshot = t.snapshot(); e.hashes = out.map(source => source.map(hash)); t.dispose();
    assert.equal(t.snapshot().epochs.length, 0);
    assert.throws(() => t.schedule({type: 'start', frame: t.nextFrame + 256}), {name: 'InvalidStateError'});
  });
}
await check('Invalid and late commands do not replace the current prepared owner', e => {
  const sr = 44100, t = new Transport({sampleRate: sr, buffers: [fixture(sr, 3)]});
  t.schedule({type: 'start', frame: 256}); capture(t, sr * .5);
  const before = t.snapshot();
  for (const command of [{type: 'seek', position: -1}, {type: 'update', rate: 0}, {type: 'update', semitones: NaN}, {type: 'update', rate: 4, keylock: false, semitones: 24}])
    assert.throws(() => t.schedule({...command, frame: t.nextFrame + 256}));
  assert.throws(() => t.schedule({type: 'seek', position: 1, frame: t.nextFrame - 1}), {name: 'LateScheduleError'});
  assert.equal(t.snapshot().generation, before.generation);
  assert.equal(t.snapshot().epochs.length, before.epochs.length); e.snapshot = t.snapshot(); t.dispose();
});
const report = {created_at: new Date().toISOString(), loadError, passed: checks.filter(c => c.passed).length,
  failed: checks.filter(c => !c.passed).length, checks,
  scope: 'Actual pinned SoundTouch DSP through the candidate pull transport in serial Node. Scheduler/nominal clock and actual finite PCM/tone/isolation behavior; no actual browser/native/deadline/audible-cursor/music/reference or full-feature acceptance.'};
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', {flag: 'wx'});
console.log(JSON.stringify({passed: report.passed, failed: report.failed, loadError, failures: checks.filter(c => !c.passed).map(c => ({name: c.name, error: c.error.message}))}, null, 2));
assert.equal(report.failed, 0);
