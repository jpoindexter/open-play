import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {SoundTouchTransport} from '../experiments/keylock-soundtouch/pull-transport.mjs';
const reportPath = process.argv.find(x => x.startsWith('--report='))?.slice(9);
assert(reportPath && !fs.existsSync(reportPath));
const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'performance'), checks = [];
try {
  delete globalThis.performance;
  for (const sampleRate of [44100, 48000]) {
    let t;
    try {
      t = new SoundTouchTransport({sampleRate, buffers: [[new Float32Array(sampleRate).fill(.1)]]});
      const ack = t.schedule({type: 'start', frame: 256});
      assert.equal(ack.preparationMilliseconds, null, 'Unavailable timing must not be invented');
      assert.equal(ack.preparationClock, 'unavailable');
      t.render(0); t.render(128); const out = t.render(256)[0][0];
      assert(out.every(Number.isFinite)); assert(out.some(v => v !== 0));
      checks.push({sampleRate, passed: true, ack, scope: 'Actual DSP with performance global absent; not a browser deadline or CPU measurement'});
    } catch (error) {checks.push({sampleRate, passed: false, error: {name: error.name, message: error.message}});}
    finally {t?.dispose();}
  }
} finally {Object.defineProperty(globalThis, 'performance', descriptor);}
const result = {checks, passed: checks.filter(c => c.passed).length, failed: checks.filter(c => !c.passed).length,
  moduleSHA256: crypto.createHash('sha256').update(fs.readFileSync('experiments/keylock-soundtouch/pull-transport.mjs')).digest('hex')};
fs.writeFileSync(reportPath, JSON.stringify(result, null, 2) + '\n', {flag: 'wx'});
console.log(JSON.stringify(result, null, 2)); assert.equal(result.failed, 0);
