import assert from 'node:assert/strict';
import {normalizeVideoFXPresets, createVideoFXPresetStore} from '../prototype/video-fx-presets.js';

const checks = [];
function test(name, run) { run(); checks.push({name, passed: true}); }
const key = n => 'sha256:' + n.toString(16).padStart(64, '0');
const fx = (amount = .5, extra = {}) => [{name: 'Demo', on: true, value: amount,
  params: {depth: amount, ...extra}}];
const record = (n, name = 'Track ' + n, effects = fx()) => ({version: 1, key: key(n), name, fx: effects});
// Deliberately tiny collaborator, not the application's real Video FX sanitizer.
// Its domain is Demo/Off plus one depth parameter, so tests can observe when the
// store detaches and when the collaborator applies its own whitelist/defaults.
function sanitizeEffects(input) {
  return [0, 1].map(index => {
    const spec = input[index];
    return {name: spec?.name === 'Demo' ? 'Demo' : 'Off', on: spec?.on === true,
      value: typeof spec?.value === 'number' && Number.isFinite(spec.value) ? Math.max(0, Math.min(1, spec.value)) : 0,
      params: {depth: typeof spec?.params?.depth === 'number' && Number.isFinite(spec.params.depth)
        ? Math.max(0, Math.min(1, spec.params.depth)) : 0}};
  });
}
const store = initial => createVideoFXPresetStore({initial, sanitizeEffects});

test('Records become two detached scalar sanitized FX specifications', () => {
  const input = [record(1, 'Track', fx(.3))], output = normalizeVideoFXPresets(input, sanitizeEffects);
  assert.deepEqual(output, [{version: 1, key: key(1), name: 'Track', fx: [
    {name: 'Demo', on: true, value: .3, params: {depth: .3}},
    {name: 'Off', on: false, value: 0, params: {depth: 0}},
  ]}]);
  input[0].fx[0].params.depth = .9;
  assert.equal(output[0].fx[0].params.depth, .3);
  output[0].fx[0].params.depth = .7;
  assert.equal(input[0].fx[0].params.depth, .9);
});
test('Duplicate keys use last valid value at the first valid position', () => {
  const result = normalizeVideoFXPresets([record(2, 'First'), record(1), record(2, 'Last'),
    {...record(2), version: 2}, {...record(1), name: null}], sanitizeEffects);
  assert.deepEqual(result.map(r => [r.key, r.name]), [[key(2), 'Last'], [key(1), 'Track 1']]);
});
test('Invalid envelopes, versions, keys and nonrecord FX arrays are dropped without coercion', () => {
  let calls = 0;
  const hostile = {toString() { calls++; throw Error('coercion'); }};
  const bad = [null, false, 1, 'record', [], {...record(1), version: '1'}, {...record(1), version: 0},
    {...record(1), version: 99}, {...record(1), key: key(1).toUpperCase()},
    {...record(1), key: 'sha256:' + 'a'.repeat(63)}, {...record(1), key: 'sha256:' + 'g'.repeat(64)},
    {...record(1), key: hostile}, {...record(1), name: hostile}, {...record(1), fx: {}},
    {...record(1), fx: 'blob:runtime'}, Object.create(record(1))];
  assert.deepEqual(normalizeVideoFXPresets(bad, sanitizeEffects), []);
  assert.equal(calls, 0);
});
test('Array/record/effect/parameter getters and inherited properties never execute', () => {
  let calls = 0;
  const accessor = () => { calls++; throw Error('getter'); };
  const badRecord = record(1); Object.defineProperty(badRecord, 'key', {get: accessor});
  const entries = [record(2), badRecord]; Object.defineProperty(entries, '2', {get: accessor});
  const params = Object.create({depth: 1}); Object.defineProperty(params, 'depth', {get: accessor});
  const effect = {params}; for (const field of ['name', 'on', 'value']) Object.defineProperty(effect, field, {get: accessor});
  const arr = [effect]; Object.defineProperty(arr, '1', {get: accessor});
  entries.push(record(3, 'Own data', arr));
  const result = normalizeVideoFXPresets(entries, sanitizeEffects);
  assert.equal(calls, 0); assert.deepEqual(result.map(r => r.key), [key(2), key(3)]);
  assert.equal(result[1].fx[0].name, 'Off'); assert.equal(result[1].fx[0].params.depth, 0);
});
test('Non-enumerable own records count, inherited sparse entries and holes do not', () => {
  const input = []; input.length = 4294967295;
  Object.defineProperty(input, '4', {value: record(4), enumerable: false});
  const proto = Object.create(Array.prototype); proto[2] = record(2); Object.setPrototypeOf(input, proto);
  assert.deepEqual(normalizeVideoFXPresets(input, sanitizeEffects).map(r => r.key), [key(4)]);
});
test('JSON scalar corruption is sanitized without accepting string booleans or nonfinite values', () => {
  const input = record(1, '', [{name: 'Demo', on: 'true', value: '0.8', params: {depth: null}},
    {name: 'Demo', on: false, value: Infinity, params: {depth: NaN}}]);
  const result = normalizeVideoFXPresets([input], sanitizeEffects)[0];
  assert.equal(result.name, '');
  assert(result.fx.every(s => s.on === false && s.value === 0 && s.params.depth === 0));
  const json = JSON.parse(JSON.stringify(result)); assert.deepEqual(json, result);
});
test('Runtime fields, cyclic objects, URLs, bytes and images do not survive the supplied whitelist', () => {
  const cycle = {}; cycle.self = cycle;
  const input = record(1, 'Original', fx(0, {runtime: cycle, url: 'blob:private', image: new Uint8Array([1, 2])}));
  input.file = cycle; input.url = 'file:///private'; input.fx[0].holdFrame = cycle; input.fx[0].captureTime = 99;
  const result = normalizeVideoFXPresets([input], sanitizeEffects)[0];
  assert.deepEqual(Object.keys(result), ['version', 'key', 'name', 'fx']);
  assert.deepEqual(result.fx[0], {name: 'Demo', on: true, value: 0, params: {depth: 0}});
  assert(!JSON.stringify(result).includes('private'));
});
test('Sanitizer cannot keep caller aliases or inject output getters and nested runtime objects', () => {
  let calls = 0, collaboratorInput, collaboratorOutput;
  const sanitize = input => {
    collaboratorInput = input; collaboratorOutput = sanitizeEffects(input);
    collaboratorOutput[0].params.nested = {runtime: true};
    Object.defineProperty(collaboratorOutput[0].params, 'accessor', {get() { calls++; throw Error('getter'); }});
    return collaboratorOutput;
  };
  const s = createVideoFXPresetStore({sanitizeEffects: sanitize}); s.put(key(1), 'First', fx(.4));
  collaboratorInput[0].params.depth = .9; collaboratorOutput[0].params.depth = .8;
  assert.equal(s.get(key(1)).fx[0].params.depth, .4); assert.equal(calls, 0);
  assert.deepEqual(Object.keys(s.get(key(1)).fx[0].params), ['depth']);
});
test('Put/get/snapshot/merge return detached records and preserve literal zero/false', () => {
  const s = store([]), added = s.put(key(1), 'First', [{name: 'Demo', on: false, value: 0, params: {depth: 0}}]);
  added.name = 'Changed'; added.fx[0].params.depth = .9;
  const fetched = s.get(key(1)); assert.equal(fetched.name, 'First'); assert.equal(fetched.fx[0].params.depth, 0);
  fetched.fx[0].on = true; s.snapshot()[0].fx[0].value = 1;
  assert.deepEqual(s.get(key(1)).fx[0], {name: 'Demo', on: false, value: 0, params: {depth: 0}});
  assert.equal(s.get(key(99)), null);
  const round = store(JSON.parse(JSON.stringify(s.snapshot()))); assert.deepEqual(round.snapshot(), s.snapshot());
});
test('Merge reports malformed drops and duplicate/added/replaced counts with stable ordering', () => {
  const s = store([record(1), record(2)]);
  const report = s.merge([record(3, 'Third'), record(1, 'Replace'), null, record(3, 'Third latest'), {...record(2), version: 3}]);
  assert.deepEqual(report, {accepted: 3, dropped: 2, duplicates: 1, added: 1, replaced: 1, size: 3});
  assert.deepEqual(s.snapshot().map(r => [r.key, r.name]), [[key(1), 'Replace'], [key(2), 'Track 2'], [key(3), 'Third latest']]);
  assert.deepEqual(s.merge([]), {accepted: 0, dropped: 0, duplicates: 0, added: 0, replaced: 0, size: 3});
});
test('Invalid top-level merge input throws and leaves the entire prior store unchanged', () => {
  const s = store([record(1)]), before = s.snapshot();
  for (const bad of [undefined, null, false, 0, '{}', {}, {0: record(2), length: 1}]) {
    assert.throws(() => s.merge(bad), /import must be an array/); assert.deepEqual(s.snapshot(), before);
  }
});
test('Sanitizer exception or malformed output aborts the entire merge before any replacement', () => {
  let fail = false, malformed = false;
  const sanitize = input => { if (fail && input[0]?.value === .9) throw Error('Collaborator failed');
    if (malformed && input[0]?.value === .9) return [{name: 'bad'}]; return sanitizeEffects(input); };
  const s = createVideoFXPresetStore({initial: [record(1)], sanitizeEffects: sanitize}), before = s.snapshot();
  fail = true; assert.throws(() => s.merge([record(1, 'Would replace', fx(.2)), record(2, 'Failure', fx(.9))]), /Collaborator failed/);
  assert.deepEqual(s.snapshot(), before);
  fail = false; malformed = true; assert.throws(() => s.merge([record(3), record(2, 'Bad output', fx(.9))]), /exactly two/);
  assert.deepEqual(s.snapshot(), before);
});
test('Failed put cannot corrupt an existing key and invalid get does not coerce', () => {
  const s = store([record(1)]), before = s.snapshot(); let calls = 0;
  for (const bad of ['', 'sha256:' + 'A'.repeat(64), {toString() { calls++; return key(1); }}]) {
    assert.throws(() => s.put(bad, 'Bad', fx()), /preset key/); assert.throws(() => s.get(bad), /preset key/);
  }
  assert.throws(() => s.put(key(1), false, fx()), /string name/);
  assert.throws(() => s.put(key(1), 'Bad FX', {}), /FX array/);
  assert.equal(calls, 0); assert.deepEqual(s.snapshot(), before);
});
test('No arbitrary record cap truncates valid imported file identities', () => {
  const input = Array.from({length: 1000}, (_, index) => record(index)), s = store(input);
  assert.equal(s.snapshot().length, 1000); assert.equal(s.get(key(999)).name, 'Track 999');
});
test('Required sanitizer and own options cannot be supplied through accessors or inheritance', () => {
  assert.throws(() => normalizeVideoFXPresets([], null), /callback is required/);
  assert.throws(() => createVideoFXPresetStore(Object.create({sanitizeEffects})), /callback is required/);
  let calls = 0; const options = {}; Object.defineProperty(options, 'sanitizeEffects', {get() { calls++; throw Error('getter'); }});
  assert.throws(() => createVideoFXPresetStore(options), /callback is required/); assert.equal(calls, 0);
});

console.log(JSON.stringify({scope: 'Executed pure preset-store record validation, detachment, ordering and atomicity with a tiny Demo/Off sanitizer collaborator. Does not prove the actual FX sanitizer, browser persistence, file hashing, recall, pixels, or native app behavior.',
  passed: checks.length, checks}, null, 2));
