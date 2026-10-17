// Pure per-file Video FX metadata. The caller supplies the real FX whitelist;
// this module owns record validation, detachment, ordering and atomic storage.
// No File, media URL, bytes, GPU state or captured frame is owned here.
const keyPattern = /^sha256:[0-9a-f]{64}$/;
const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const scalar = value => typeof value === 'string' || typeof value === 'boolean' ||
  (typeof value === 'number' && Number.isFinite(value));

function own(value, key) {
  if (value === null || typeof value !== 'object') return undefined;
  try { return Object.getOwnPropertyDescriptor(value, key)?.value; }
  catch { return undefined; }
}
function names(value) {
  try { return Object.getOwnPropertyNames(value); }
  catch { return []; }
}
function scalarParams(value) {
  if (!isRecord(value)) return {};
  return Object.fromEntries(names(value).flatMap(key => {
    const item = own(value, key);
    return scalar(item) ? [[key, item]] : [];
  }));
}
// Give the caller a detached, own-data-only input: even a simple sanitizer
// cannot accidentally invoke source getters or traverse a cyclic runtime object.
function effectInput(value) {
  if (!isRecord(value)) return undefined;
  const output = {params: scalarParams(own(value, 'params'))};
  for (const key of ['name', 'on', 'value']) {
    const item = own(value, key);
    if (scalar(item)) output[key] = item;
  }
  return output;
}
function sanitizedEffects(value, sanitizeEffects) {
  const input = [0, 1].map(index => effectInput(own(value, String(index))));
  const result = sanitizeEffects(input);
  if (!Array.isArray(result) || own(result, 'length') !== 2)
    throw new TypeError('Video FX sanitizer must return exactly two scalar FX specifications.');
  return [0, 1].map(index => {
    const spec = own(result, String(index)), name = own(spec, 'name'),
      on = own(spec, 'on'), amount = own(spec, 'value'), params = own(spec, 'params');
    if (!isRecord(spec) || typeof name !== 'string' || typeof on !== 'boolean' ||
        typeof amount !== 'number' || !Number.isFinite(amount) || !isRecord(params))
      throw new TypeError('Video FX sanitizer returned a malformed scalar FX specification.');
    return {name, on, value: amount, params: scalarParams(params)};
  });
}
function assertSanitizer(sanitizeEffects) {
  if (typeof sanitizeEffects !== 'function') throw new TypeError('A Video FX sanitizer callback is required.');
}
function assertKey(key) {
  if (typeof key !== 'string' || !keyPattern.test(key))
    throw new TypeError('Video FX preset key must be sha256: followed by 64 lowercase hex characters.');
}
const cloneRecord = record => ({version: 1, key: record.key, name: record.name,
  fx: record.fx.map(spec => ({name: spec.name, on: spec.on, value: spec.value,
    params: {...spec.params}}))});

function normalized(input, sanitizeEffects) {
  assertSanitizer(sanitizeEffects);
  if (!Array.isArray(input)) throw new TypeError('Video FX preset import must be an array.');
  const records = new Map();
  let accepted = 0, dropped = 0, duplicates = 0;
  // Enumerate own indexes rather than array length: inherited entries and huge
  // sparse holes are not records, and there is no arbitrary preset-count cap.
  const indexes = names(input).filter(key => /^(?:0|[1-9]\d*)$/.test(key) && Number(key) < 4294967295);
  for (const index of indexes) {
    const source = own(input, index), version = own(source, 'version'),
      key = own(source, 'key'), name = own(source, 'name'), fx = own(source, 'fx');
    if (!isRecord(source) || version !== 1 || typeof key !== 'string' || !keyPattern.test(key) ||
        typeof name !== 'string' || !Array.isArray(fx)) {
      dropped++;
      continue;
    }
    // Sanitize every candidate before changing the store. A callback failure is
    // a programming/validation error, so it aborts rather than deleting a record.
    const record = {version: 1, key, name, fx: sanitizedEffects(fx, sanitizeEffects)};
    accepted++;
    if (records.has(key)) duplicates++;
    records.set(key, record); // Last valid value, first valid position.
  }
  return {records: [...records.values()], accepted, dropped, duplicates};
}

/**
 * Normalize an array of version1 records. Invalid envelopes/records are dropped;
 * invalid top-level input or a failed sanitizer throws. The required callback
 * owns declared FX names, ranges and parameter whitelisting (including removal
 * of URL/runtime-like scalar parameters). It receives two detached own-data FX
 * inputs and must return two {name,on,value,params} specifications. Results keep
 * only that shape and finite scalar parameters, detached from both sides.
 */
export function normalizeVideoFXPresets(input, sanitizeEffects) {
  return normalized(input, sanitizeEffects).records;
}

/** In-memory metadata store only. No persistence or file hashing is performed. */
export function createVideoFXPresetStore(options = {}) {
  const sanitizeEffects = own(options, 'sanitizeEffects');
  assertSanitizer(sanitizeEffects);
  const initial = own(options, 'initial');
  let records = new Map(normalized(initial === undefined ? [] : initial, sanitizeEffects)
    .records.map(record => [record.key, record]));
  return {
    put(key, name, fx) {
      assertKey(key);
      if (typeof name !== 'string' || !Array.isArray(fx))
        throw new TypeError('Video FX preset requires a string name and an FX array.');
      const record = normalized([{version: 1, key, name, fx}], sanitizeEffects).records[0];
      records.set(key, record);
      return cloneRecord(record);
    },
    get(key) {
      assertKey(key);
      return records.has(key) ? cloneRecord(records.get(key)) : null;
    },
    snapshot() { return [...records.values()].map(cloneRecord); },
    merge(input) {
      // Validate and sanitize the entire import first. Top-level rejection,
      // callback exceptions and malformed callback outputs leave state unchanged.
      const result = normalized(input, sanitizeEffects), next = new Map(records);
      let added = 0, replaced = 0;
      for (const record of result.records) {
        if (next.has(record.key)) replaced++;
        else added++;
        next.set(record.key, record);
      }
      records = next;
      // accepted counts valid incoming records before deduplication; duplicates
      // counts repeats within that import; added/replaced count unique keys.
      return {accepted: result.accepted, dropped: result.dropped, duplicates: result.duplicates,
        added, replaced, size: records.size};
    },
  };
}
