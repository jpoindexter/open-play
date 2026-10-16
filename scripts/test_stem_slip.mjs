// Real PCM transport kernel; no browser scheduling, model inference, or vendor parity.
import assert from 'node:assert/strict';
import {StemSlipKernel} from '../prototype/stem-slip-kernel.js';
import {AudioEngine} from '../prototype/engine.js';
const sr = 4000, duration = 30;
const buffers = Array.from({length: 4}, (_, stem) => ({sampleRate: sr,
  channels: [Float32Array.from({length: sr * duration}, (_, n) =>
    .2 * Math.sin(2 * Math.PI * (67 + stem * 43) * n / sr) * (.6 + .4 * Math.sin(n / sr * 1.7 + stem)))]}));
function setup({position = 5, mode = 'vocal', playing = true, bpm = 120, rate = 1, reverse = false, loop = null} = {}) {
  const kernel = new StemSlipKernel(sr); kernel.load(buffers);
  kernel.command('configure', {position, mode, playing, bpm, rate, duration, reverse, loop});
  return kernel;
}
function render(kernel, seconds) {
  const outputs = Array.from({length: 4}, () => [new Float32Array(Math.round(sr * seconds)), new Float32Array(Math.round(sr * seconds))]);
  kernel.process(outputs); return outputs;
}
const maxDiff = (a, b) => a.reduce((maximum, value, i) => Math.max(maximum, Math.abs(value - b[i])), 0);
const rms = a => Math.sqrt(a.reduce((sum, value) => sum + value * value, 0) / a.length);
const close = (a, b, tolerance = 1 / sr) => assert(Math.abs(a - b) < tolerance, `${a} != ${b}`);
const checks = [];
function test(name, run) { run(); checks.push({name, passed: true}); }

test('Selected cue and signed scratch leave complementary PCM bit-identical to untouched playback', () => {
  for (const mode of ['vocal', 'instrumental']) {
    const actual = setup({mode}), reference = setup({mode});
    actual.command('begin', {owner: 'scratch'});
    actual.command('cue', {owner: 'scratch', position: 1});
    const cue = render(actual, .2), baseline = render(reference, .2);
    for (let stem = 0; stem < 4; stem++) {
      const selected = mode === 'vocal' ? stem === 0 : stem > 0;
      assert(selected ? maxDiff(cue[stem][0], baseline[stem][0]) > .01 : maxDiff(cue[stem][0], baseline[stem][0]) === 0);
    }
    actual.command('scratch', {owner: 'scratch', position: 2, velocity: -1});
    const scratched = render(actual, .3), continued = render(reference, .3);
    close(actual.selected, 1.7); close(actual.position, 5.5);
    for (let stem = 0; stem < 4; stem++) if (!actual.selectedStem(stem)) assert.equal(maxDiff(scratched[stem][0], continued[stem][0]), 0);
  }
});

for (const bpm of [60, 120, 180]) for (const beats of [0, .5, 1, 2, 4]) test(`Release ${beats} beats at ${bpm} BPM rejoins on the advancing clock`, () => {
  const kernel = setup({bpm});
  kernel.command('begin', {owner: 'cue'}); kernel.command('cue', {owner: 'cue', position: 2});
  render(kernel, .1);
  kernel.command('end', {owner: 'cue', beats});
  if (beats) {
    assert.equal(kernel.phase, 'releasing');
    const frames = Math.ceil(beats * 60 / bpm * sr);
    if (frames > 1) { render(kernel, (frames - 1) / sr); assert.equal(kernel.phase, 'releasing'); }
    render(kernel, 1 / sr);
  }
  assert.equal(kernel.phase, 'idle'); close(kernel.selected, kernel.position);
  assert.equal(kernel.mode, 'vocal');
});

test('Tempo change during release counts elapsed beats rather than a stale wall-clock timer', () => {
  const kernel = setup(); kernel.command('begin', {owner: 'cue'}); kernel.command('cue', {owner: 'cue', position: 2});
  kernel.command('end', {owner: 'cue', beats: 1}); render(kernel, .25);
  close(kernel.release.remainingBeats, .5);
  kernel.command('rate', {rate: 2}); render(kernel, .12475);
  assert.equal(kernel.phase, 'releasing'); render(kernel, 1 / sr);
  assert.equal(kernel.phase, 'idle'); close(kernel.selected, kernel.position); close(kernel.position, 5.5);
});

test('Paused cue/scratch auditions only selected PCM and release restores frozen canonical position', () => {
  const kernel = setup({playing: false}); kernel.command('begin', {owner: 'cue'});
  kernel.command('cue', {owner: 'cue', position: 1});
  const output = render(kernel, .2);
  assert(rms(output[0][0]) > .01);
  for (let stem = 1; stem < 4; stem++) assert.equal(rms(output[stem][0]), 0);
  assert.equal(kernel.position, 5);
  kernel.command('end', {owner: 'cue', beats: 4});
  assert.equal(kernel.phase, 'idle'); assert.equal(kernel.selected, 5);
  assert.equal(rms(render(kernel, .1)[0][0]), 0);
});

test('Play during paused selected audition resumes canonical playback and release continues', () => {
  const kernel = setup({playing: false}); kernel.command('begin', {owner: 'cue'}); kernel.command('cue', {owner: 'cue', position: 1});
  render(kernel, .1); kernel.command('play');
  render(kernel, .2); kernel.command('end', {owner: 'cue', beats: 0});
  assert(kernel.playing); close(kernel.selected, kernel.position); close(kernel.position, 5.2);
});

test('Old gesture releases cannot alter a new owner; cancellation terminates an already-running roll', () => {
  const kernel = setup(); kernel.command('begin', {owner: 'old'}); kernel.command('cue', {owner: 'old', position: 1});
  kernel.command('begin', {owner: 'new'}); kernel.command('scratch', {owner: 'new', position: 2, velocity: -1});
  kernel.command('end', {owner: 'old', beats: 4}); assert.equal(kernel.owner, 'new'); assert.equal(kernel.phase, 'manipulating');
  kernel.command('end', {owner: 'new', beats: 4}); assert.equal(kernel.phase, 'releasing');
  kernel.command('cancel'); assert.equal(kernel.phase, 'idle'); close(kernel.selected, kernel.position);
});

test('Pause and global seek invalidate release state and freeze/reposition both clocks', () => {
  const kernel = setup(); kernel.command('begin', {owner: 'cue'}); kernel.command('end', {owner: 'cue', beats: 4});
  kernel.command('pause'); render(kernel, .5); assert.equal(kernel.position, 5); assert.equal(kernel.phase, 'idle');
  kernel.command('seek', {position: 12}); assert.equal(kernel.selected, 12); assert.equal(kernel.position, 12);
  assert.equal(kernel.release, null); assert.equal(kernel.owner, null);
});

test('Release fragment excludes audio after the release cursor and pads a negative start with silence', () => {
  const kernel = setup({position: 5});
  const markerBuffers = buffers.map(buffer => ({sampleRate: sr, channels: [buffer.channels[0].slice()]}));
  markerBuffers[0].channels[0].fill(0); markerBuffers[0].channels[0].fill(.9, sr * 2);
  kernel.load(markerBuffers); kernel.command('begin', {owner: 'cue'}); kernel.command('cue', {owner: 'cue', position: .1});
  kernel.command('end', {owner: 'cue', beats: 4});
  const output = render(kernel, 1.9);
  assert.equal(rms(output[0][0]), 0); assert.equal(kernel.phase, 'releasing');
});

test('Mode switch joins old selection before selecting the complementary group', () => {
  const kernel = setup(); kernel.command('begin', {owner: 'cue'}); kernel.command('cue', {owner: 'cue', position: 1});
  kernel.command('mode', {mode: 'instrumental'});
  assert.equal(kernel.mode, 'instrumental'); assert.equal(kernel.owner, null); close(kernel.selected, kernel.position);
});

test('Reverse and loop entry are retained on selected transport while canonical stays forward', () => {
  const reverse = setup({reverse: true}); render(reverse, .25); close(reverse.position, 5.25); close(reverse.selected, 4.75);
  const loop = setup({loop: {start: 4.9, end: 5.1}}); render(loop, .3); close(loop.position, 5.3); close(loop.selected, 4.9, .001);
});

test('Canonical track end cancels all playback and disarms without a stale owner', () => {
  const kernel = setup({position: duration - .1}); kernel.command('begin', {owner: 'cue'}); kernel.command('cue', {owner: 'cue', position: 1});
  render(kernel, .2); assert.equal(kernel.mode, 'off'); assert(!kernel.playing && !kernel.audition);
  assert.equal(kernel.owner, null); assert.equal(kernel.phase, 'idle');
  kernel.command('end', {owner: 'cue', beats: 4}); assert.equal(rms(render(kernel, .1)[0][0]), 0);
});

// Execute the real engine method; defer only its asynchronous render boundary.
// The PCM/browser tests above and in the integration page cover actual rendering.
const deferred = () => { let resolve; const promise = new Promise(yes => { resolve = yes; }); return {promise, resolve}; };
function rateFixture() {
  const engine = new AudioEngine(), writes = [];
  engine.nodes = [{channelBpm: 120}];
  engine.voices.set(0, {sources: [], stemSlipTransport: {state: () => ({position: 5}), dispose() {}}});
  engine.applyChannelFX = async () => { writes.push(engine.nodes[0].channelBpm); };
  engine.fxState = [[], [], [120, 120, 120, 120]];
  engine.configureFX = (...args) => { engine.fxState = args; };
  const d = {index: 0, track: {bpm: 120}, rate: 1, keylock: true, keyShift: 0, stemSlip: 'vocal'};
  return {engine, d, writes};
}
async function asyncTest(name, run) { await run(); checks.push({name, passed: true}); }
await asyncTest('Actual setRate cannot publish stale channel/FX tempo after a newer preparation settles', async () => {
  const {engine, d, writes} = rateFixture(), oldGate = deferred(), latestGate = deferred();
  let calls = 0; engine.refreshStemSlipBuffers = () => ++calls === 1 ? oldGate.promise : latestGate.promise;
  const old = engine.setRate(d, 1.2), latest = engine.setRate(d, .9);
  latestGate.resolve(); await latest; oldGate.resolve(); await old;
  assert.equal(engine.nodes[0].channelBpm, 108); assert.equal(engine.fxState[2][0], 108);
  assert.deepEqual(writes, [108]);
});
await asyncTest('Actual setRate uses request ownership even when requested values return to the same rate', async () => {
  const {engine, d, writes} = rateFixture(), gates = [deferred(), deferred(), deferred()];
  let calls = 0; engine.refreshStemSlipBuffers = () => gates[calls++].promise;
  const first = engine.setRate(d, 1.2), second = engine.setRate(d, .9), third = engine.setRate(d, 1.2);
  gates[2].resolve(); await third; gates[1].resolve(); await second; gates[0].resolve(); await first;
  assert.deepEqual(writes, [144]); assert.equal(engine.fxState[2][0], 144);
});
await asyncTest('Actual setRate cannot publish channel/FX tempo for a replaced track or mode', async () => {
  for (const replace of [d => { d.track = {bpm: 90}; }, d => { d.stemSlip = 'instrumental'; }]) {
    const {engine, d, writes} = rateFixture(), gate = deferred();
    engine.refreshStemSlipBuffers = () => gate.promise;
    const pending = engine.setRate(d, 1.2); replace(d); gate.resolve(); await pending;
    assert.deepEqual(writes, []); assert.equal(engine.fxState[2][0], 120);
  }
});
await asyncTest('Pause invalidates pending rate metadata as well as source activation', async () => {
  const {engine, d, writes} = rateFixture(), gate = deferred();
  engine.refreshStemSlipBuffers = () => gate.promise;
  const pending = engine.setRate(d, 1.2); engine.pause(d); gate.resolve(); await pending;
  assert.deepEqual(writes, []); assert.equal(engine.fxState[2][0], 120);
});

await asyncTest('First-arm tempo changes preserve the audible old clock and activate matching newest PCM scale/rate', async () => {
  const originalWorklet = globalThis.AudioWorkletNode, created = [];
  class WorkletBoundary {
    constructor() {
      this.kernel = new StemSlipKernel(sr); created.push(this);
      this.port = {close() {}, postMessage: message => queueMicrotask(() => {
        if (message.type === 'dispose') return;
        if (message.type === 'buffers') this.kernel.load(message.buffers, message.scale);
        else this.kernel.command(message.type, message);
        this.port.onmessage?.({data: {id: message.id, state: this.kernel.state()}});
      })};
    }
    connect() {} disconnect() {}
  }
  globalThis.AudioWorkletNode = WorkletBoundary;
  try {
    const gain = () => ({gain: {value: 0, setTargetAtTime() {}, setValueAtTime() {}, cancelScheduledValues() {}}, connect() {}, disconnect() {}});
    const engine = new AudioEngine(); engine.ctx = {currentTime: 0, createGain: gain};
    engine.nodes = Array.from({length: 4}, () => ({input: gain(), gain: gain(), level: .8, trim: 1}));
    engine.resume = async () => {}; engine.applyChannelFX = async () => {};
    const track = {id: 'first-arm', duration, bpm: 120};
    const d = {index: 0, track, position: 5, anchorPosition: 5, anchorTime: 0,
      rate: 1.1, keylock: true, keyShift: 0, playing: true, processing: false,
      reverse: false, loop: false, stems: [true, true, true, true], stemFX: [false, false, false, false]};
    const state = {track, effects: [null, null, null, null], modes: ['', '', '', ''], generations: [0, 0, 0, 0],
      histories: Array.from({length: 4}, () => ({node: gain()})), routes: Array.from({length: 4}, gain)};
    engine.stemStates.set(0, state); engine.ensureStemState = () => state;
    const audioBuffers = buffers.map(buffer => ({numberOfChannels: 1, sampleRate: sr,
      getChannelData: () => buffer.channels[0]}));
    engine.stemBuffers.set(track.id, audioBuffers);
    let stopped = false; const source = {playbackRate: {value: 1}, stop() { stopped = true; }, disconnect() {}};
    engine.voices.set(0, {sources: [source], stemGains: []});
    const gate = deferred(), entered = deferred(), tempos = []; let first = true;
    engine.keylockRenderer.render = async (buffer, options) => {
      tempos.push(options.tempo);
      if (first) { first = false; entered.resolve(); await gate.promise; }
      if (options.signal.aborted) throw new DOMException('Aborted candidate', 'AbortError');
      return buffer;
    };
    const arm = engine.setStemSlip(d, 'vocal'); await entered.promise;
    engine.ctx.currentTime = .2;
    const changingRate = engine.setRate(d, 1.2);
    close(engine.position(d), 5.22); assert(!stopped); assert.equal(source.playbackRate.value, 1);
    engine.ctx.currentTime = .4; close(engine.position(d), 5.44);
    gate.resolve(); await Promise.all([arm, changingRate]);
    const processor = created.at(-1).kernel;
    assert.equal(processor.scale, 1.2); assert.equal(processor.rate, 1.2);
    close(processor.position, 5.451, 1e-9); assert(stopped);
    assert.deepEqual(tempos, [1.1, 1.2, 1.2, 1.2, 1.2]);
    assert.equal(engine.nodes[0].channelBpm, 144); engine.pause(d);
  } finally {
    if (originalWorklet === undefined) delete globalThis.AudioWorkletNode;
    else globalThis.AudioWorkletNode = originalWorklet;
  }
});

console.log(JSON.stringify({scope: 'Executed actual PCM kernel and engine rate/first-arm methods with deferred rendering/worklet boundaries. Actual browser scheduling, mixer/UI integration and vendor behavior remain separate gates.', passed: checks.length, checks}, null, 2));
