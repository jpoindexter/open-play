// Executes the real preparation adapter with mocked fetch/decode/activation.
// No service, model download, SCNet inference, or browser UI is exercised here.
import assert from 'node:assert/strict';
import { createStemPreparation } from '../prototype/stems.js';

const checks = [];
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const tick = () => new Promise(resolve => setImmediate(resolve));
async function until(predicate) {
  for (let i = 0; i < 50; i++) {
    if (predicate()) return;
    await tick();
  }
  assert.fail('Expected adapter boundary was not reached.');
}
const audio = {
  numberOfChannels: 2, length: 8, sampleRate: 8, duration: 1,
  getChannelData: () => new Float32Array(8).fill(.1),
};
const names = ['vocals', 'other', 'bass', 'drums'];
const complete = {
  id: 'job-1', state: 'complete', model: 'scnet',
  stems: names.map(name => ({name, url: `/stems/${name}`})),
};
const json = (value, ok = true) => ({ok, json: async () => value});
function fixture({buffer, fetch: fetchOverride, decode, attach} = {}) {
  const calls = {requests: [], buffers: 0, decodes: [], activations: []};
  const track = {id: 'local-track', duration: 1};
  const decks = [{index: 0, track}];
  const engine = {
    buffer: async t => { calls.buffers++; return buffer ? buffer(t) : audio; },
    ctx: {decodeAudioData: async bytes => {
      calls.decodes.push(bytes);
      return decode ? decode(bytes) : {channel: names[new Uint8Array(bytes)[0]]};
    }},
    attachStems: async (...args) => {
      calls.activations.push(args);
      if (attach) await attach(...args);
    },
  };
  globalThis.fetch = async (url, options = {}) => {
    calls.requests.push({url, ...options});
    if (fetchOverride) {
      const response = await fetchOverride(url, options, calls);
      if (response !== undefined) return response;
    }
    if (options.method === 'POST' || url === '/api/stems/job-1') return json(complete);
    if (options.method === 'DELETE') return json({state: 'cancelled'});
    const index = names.findIndex(name => url === `/stems/${name}`);
    assert.ok(index >= 0, `Unexpected fetch: ${url}`);
    return {ok: true, arrayBuffer: async () => Uint8Array.of(index).buffer};
  };
  return {track, decks, engine, calls, preparation: createStemPreparation(engine, decks)};
}
async function test(name, run) {
  const original = globalThis.fetch;
  try {
    await run();
    checks.push({name, passed: true});
  } finally { globalThis.fetch = original; }
}
const posts = calls => calls.requests.filter(r => r.method === 'POST');
const deletes = calls => calls.requests.filter(r => r.method === 'DELETE');
const downloads = calls => calls.requests.filter(r => r.url.startsWith('/stems/'));

await test('Matching callers share one promise, POST, decode/activation and all progress', async () => {
  const gate = deferred();
  const f = fixture({buffer: () => gate.promise});
  const first = [], second = [];
  const p = f.preparation.prepare(f.track, message => first.push(message));
  await until(() => first.length > 0);
  const shared = f.preparation.prepare(f.track, message => second.push(message));
  assert.equal(shared, p);
  assert.deepEqual(second, first, 'Late subscriber receives current progress immediately');
  gate.resolve(audio);
  const [left, right] = await Promise.all([p, shared]);
  assert.equal(left, right);
  assert.deepEqual(first, second);
  assert.match(first.at(-1), /^Ready/);
  assert.equal(posts(f.calls).length, 1);
  assert.equal(f.calls.buffers, 1);
  assert.equal(f.calls.decodes.length, 4);
  assert.equal(f.calls.activations.length, 1);
  assert.equal(f.calls.activations[0][0], f.track);
  assert.deepEqual(f.calls.activations[0][1].map(b => b.channel), names);
  assert.equal(f.calls.activations[0][2], f.decks);
  const wav = new DataView(posts(f.calls)[0].body);
  assert.equal(wav.getUint16(20, true), 3, 'Actual adapter encodes float WAV');
  assert.equal(wav.getUint16(22, true), 2);
  assert.equal(f.preparation.active.size, 0);
});

await test('Progress listener failure cannot fail shared preparation or other listeners', async () => {
  const f = fixture();
  const messages = [];
  const p = f.preparation.prepare(f.track, () => { throw new Error('Detached view'); });
  assert.equal(f.preparation.prepare(f.track, message => messages.push(message)), p);
  await p;
  assert.match(messages.at(-1), /^Ready/);
  assert.equal(f.calls.activations.length, 1);
});

await test('Late callers receive current worker progress and share the polling request', async () => {
  const f = fixture({fetch: (_url, options) => options.method === 'POST'
    ? json({id: 'job-1', state: 'running', stage: 'separating_audio', progress: .35})
    : undefined});
  const first = [], second = [];
  const p = f.preparation.prepare(f.track, message => first.push(message));
  await until(() => first.some(message => message.includes('35%')));
  assert.equal(f.preparation.prepare(f.track, message => second.push(message)), p);
  assert.equal(second[0], 'separating audio · 35%');
  await p;
  assert.match(second.at(-1), /^Ready/);
  assert.equal(posts(f.calls).length, 1);
  assert.equal(f.calls.requests.filter(r => r.url === '/api/stems/job-1').length, 1);
  assert.equal(f.calls.activations.length, 1);
});

await test('A different backend conflicts without replacing or canceling active work', async () => {
  const gate = deferred();
  const f = fixture({buffer: () => gate.promise});
  const p = f.preparation.prepare(f.track, undefined, 'scnet');
  await assert.rejects(f.preparation.prepare(f.track, undefined, 'spleeter'), /already being prepared with scnet/);
  assert.equal(f.preparation.active.get(f.track.id).backend, 'scnet');
  assert.equal(f.preparation.prepare(f.track), p);
  gate.resolve(audio);
  await p;
  assert.equal(posts(f.calls).length, 1);
  assert.match(posts(f.calls)[0].url, /model=scnet$/);
  assert.equal(deletes(f.calls).length, 0);
});

await test('Cancel during source decoding creates no server job and permits clean retry', async () => {
  const gate = deferred();
  let reads = 0;
  const f = fixture({buffer: () => ++reads === 1 ? gate.promise : audio});
  const p = f.preparation.prepare(f.track);
  await until(() => f.calls.buffers === 1);
  const rejected = assert.rejects(p, {name: 'AbortError'});
  await f.preparation.cancel(f.track);
  assert.equal(f.preparation.prepare(f.track), p, 'Canceled operation remains shared until settled');
  gate.resolve(audio);
  await rejected;
  assert.equal(posts(f.calls).length, 0);
  assert.equal(f.calls.activations.length, 0);
  assert.equal(f.preparation.active.size, 0);
  await f.preparation.prepare(f.track);
  assert.equal(posts(f.calls).length, 1);
  assert.equal(f.calls.activations.length, 1);
});

await test('Immediate cancellation starts neither source decoding nor upload', async () => {
  const f = fixture();
  const p = f.preparation.prepare(f.track);
  const rejected = assert.rejects(p, {name: 'AbortError'});
  await f.preparation.cancel(f.track);
  await rejected;
  assert.equal(f.calls.buffers, 0);
  assert.equal(posts(f.calls).length, 0);
  assert.equal(f.calls.activations.length, 0);
  assert.equal(f.preparation.active.size, 0);
});

await test('Cancel during POST deletes the returned job before any channel download', async () => {
  const gate = deferred();
  const f = fixture({fetch: (_url, options) => options.method === 'POST' ? gate.promise : undefined});
  const p = f.preparation.prepare(f.track);
  const rejected = assert.rejects(p, {name: 'AbortError'});
  await until(() => posts(f.calls).length === 1);
  await f.preparation.cancel(f.track);
  gate.resolve(json(complete));
  await rejected;
  assert.equal(deletes(f.calls).length, 1);
  assert.equal(downloads(f.calls).length, 0);
  assert.equal(f.calls.activations.length, 0);
  assert.equal(f.preparation.active.size, 0);
});

await test('Failed shared POST notifies both callers, releases active work, and can retry', async () => {
  let attempts = 0;
  const f = fixture({fetch: (_url, options) => {
    if (options.method === 'POST' && ++attempts === 1) return json({error: 'Worker unavailable'}, false);
  }});
  const first = [], second = [];
  const p = f.preparation.prepare(f.track, message => first.push(message));
  const shared = f.preparation.prepare(f.track, message => second.push(message));
  assert.equal(p, shared);
  await assert.rejects(p, /Worker unavailable/);
  assert.deepEqual(first, second);
  assert.match(first.at(-1), /^Failed/);
  assert.equal(f.preparation.active.size, 0);
  assert.equal(f.calls.activations.length, 0);
  await f.preparation.prepare(f.track);
  assert.equal(posts(f.calls).length, 2);
  assert.equal(f.calls.activations.length, 1);
});

await test('Cancellation during channel download skips arrayBuffer/decode and activation', async () => {
  const gate = deferred();
  let bodyReads = 0;
  const f = fixture({fetch: url => url === '/stems/vocals' ? gate.promise : undefined});
  const p = f.preparation.prepare(f.track);
  const rejected = assert.rejects(p, {name: 'AbortError'});
  await until(() => downloads(f.calls).length === 1);
  await f.preparation.cancel(f.track);
  gate.resolve({ok: true, arrayBuffer: async () => { bodyReads++; return new ArrayBuffer(1); }});
  await rejected;
  assert.equal(bodyReads, 0);
  assert.equal(f.calls.decodes.length, 0);
  assert.equal(f.calls.activations.length, 0);
  assert.equal(f.preparation.active.size, 0);
});

await test('Cancellation during channel decode cannot activate partial or finished buffers', async () => {
  const gate = deferred();
  const f = fixture({decode: () => gate.promise});
  const p = f.preparation.prepare(f.track);
  const rejected = assert.rejects(p, {name: 'AbortError'});
  await until(() => f.calls.decodes.length === 1);
  await f.preparation.cancel(f.track);
  gate.resolve({channel: 'vocals'});
  await rejected;
  assert.equal(downloads(f.calls).length, 1);
  assert.equal(f.calls.activations.length, 0);
  assert.equal(f.preparation.active.size, 0);
});

await test('A progress callback can cancel before upload without a subsequent POST', async () => {
  const f = fixture();
  const p = f.preparation.prepare(f.track, message => {
    if (message.startsWith('Sending')) void f.preparation.cancel(f.track);
  });
  await assert.rejects(p, {name: 'AbortError'});
  assert.equal(posts(f.calls).length, 0);
  assert.equal(f.calls.activations.length, 0);
});

await test('Activation cancellation reaches its AbortSignal, preserves shared rejection and does not cancel completed cache', async () => {
  const gate=deferred();
  const f=fixture({attach:(_track,_buffers,_decks,{signal})=>{signal.addEventListener('abort',()=>gate.reject(new DOMException('Cancelled','AbortError')),{once:true});return gate.promise;}});
  const first=[],second=[];const p=f.preparation.prepare(f.track,message=>first.push(message));
  const rejected=assert.rejects(p,{name:'AbortError'});await until(()=>f.calls.activations.length===1);
  const shared=f.preparation.prepare(f.track,message=>second.push(message));assert.equal(shared,p);assert.match(second[0],/^Activating/);
  await f.preparation.cancel(f.track);await rejected;
  assert(f.calls.activations[0][3].signal.aborted);assert.equal(deletes(f.calls).length,0);assert.match(second.at(-1),/^Cancelled/);
  assert.equal(f.track.stemModel,undefined);assert.equal(f.preparation.active.size,0);gate.resolve();await tick();assert.match(second.at(-1),/^Cancelled/);
});

console.log(JSON.stringify({
  scope: 'Executed real stems.js adapter with mocked network, decode and activation. Does not establish service inference, SCNet quality, browser UI, or audio routing.',
  passed: checks.length, checks,
}, null, 2));
