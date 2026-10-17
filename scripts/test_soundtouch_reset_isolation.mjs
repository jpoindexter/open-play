import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import SoundTouch from '../local-evidence/keylock-soundtouch-source/node_modules/@soundtouchjs/core/.dist/SoundTouch.js';

const reportPath = process.argv.find(x => x.startsWith('--report='))?.slice(9);
assert(reportPath, 'Supply a new --report= path; retained results are never overwritten');
assert(!fs.existsSync(reportPath));
const fresh = process.argv.includes('--fresh');
const checks = [];
for (const sampleRate of [44100, 48000]) {
  let processor = new SoundTouch({sampleRate, interpolationStrategy: 'lanczos'});
  const input = new Float32Array(2000 * 2).fill(.25);
  processor.inputBuffer.putSamples(input, 0, 2000);
  processor.process();
  const before = {input: processor.inputBuffer.frameCount, output: processor.outputBuffer.frameCount};
  if (fresh) processor = new SoundTouch({sampleRate, interpolationStrategy: 'lanczos'});
  else processor.clear();
  const after = {input: processor.inputBuffer.frameCount, output: processor.outputBuffer.frameCount};
  processor.inputBuffer.putSamples(new Float32Array(16000 * 2), 0, 16000);
  processor.process();
  const frames = processor.outputBuffer.frameCount;
  const output = new Float32Array(frames * 2);
  processor.outputBuffer.extract(output, 0, frames, true);
  const nonzero = output.reduce((n, value) => n + (Math.abs(value) > 1e-7), 0);
  const peak = output.reduce((n, value) => Math.max(n, Math.abs(value)), 0);
  checks.push({sampleRate, reset: fresh ? 'fresh-instance' : 'publisher-default-clear',
    before, after, frames, nonzero, peak,
    outputSHA256: crypto.createHash('sha256').update(new Uint8Array(output.buffer)).digest('hex'),
    passed: frames > 0 && nonzero === 0});
}
const report = {scope: 'Actual pinned SoundTouch core; incomplete prior input then reset to silence. This is an upstream reset/isolation contract, not a defect claim about unchanged Open Play.',
  fresh, checks, passed: checks.filter(c => c.passed).length, failed: checks.filter(c => !c.passed).length};
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', {flag: 'wx'});
console.log(JSON.stringify(report, null, 2));
assert.equal(report.failed, 0, 'Reset must not emit samples from the previous input owner');
