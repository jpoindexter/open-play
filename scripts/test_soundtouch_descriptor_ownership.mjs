import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {SoundTouchTransport} from '../experiments/keylock-soundtouch/pull-transport.mjs';
const reportPath = process.argv.find(x => x.startsWith('--report='))?.slice(9);
assert(reportPath && !fs.existsSync(reportPath));
const checks = [];
for (const sampleRate of [44100, 48000]) {
  const original = new Float32Array(sampleRate * 3).fill(.25), descriptor = [original];
  const t = new SoundTouchTransport({sampleRate, buffers: [descriptor]});
  t.schedule({type: 'start', frame: 256});
  descriptor[0] = new Float32Array(sampleRate * 3).fill(-.25);
  t.schedule({type: 'seek', frame: sampleRate, position: 1});
  let sum = 0, frames = 0;
  for (let at = 0; at < sampleRate * 2; at += 128) {
    const channel = t.render(at)[0][0];
    for (let i = 0; i < channel.length; i++) if (at + i >= sampleRate * 1.5) {sum += channel[i]; frames++;}
  }
  const mean = sum / frames;
  checks.push({sampleRate, originalImmutablePCMUnchanged: original.every(v => v === .25), mean, passed: Math.abs(mean - .25) < 1e-7});
  t.dispose();
}
const report = {scope: 'Caller replacing a borrowed channel descriptor must not silently replace future epochs; underlying PCM remains borrowed immutable data.', checks,
  moduleSHA256: crypto.createHash('sha256').update(fs.readFileSync('experiments/keylock-soundtouch/pull-transport.mjs')).digest('hex'),
  passed: checks.filter(c => c.passed).length, failed: checks.filter(c => !c.passed).length};
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', {flag: 'wx'});
console.log(JSON.stringify(report, null, 2)); assert.equal(report.failed, 0);
