import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {SoundTouchTransport} from '../experiments/keylock-soundtouch/pull-transport.mjs';
const reportPath = process.argv.find(x => x.startsWith('--report='))?.slice(9);
assert(reportPath && !fs.existsSync(reportPath));
const checks = [], hash = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
function check(name, run) {
  const evidence = {};
  try { run(evidence); checks.push({name, passed: true, evidence}); }
  catch (error) { checks.push({name, passed: false, evidence, error: {name: error.name, message: error.message}}); }
}
for (const sampleRate of [44100, 48000]) {
  check(`Historical nominal clock retains the original anchor after an update (${sampleRate})`, e => {
    const t = new SoundTouchTransport({sampleRate, buffers: [[new Float32Array(sampleRate * 5)]]});
    t.schedule({type: 'start', frame: 256, rate: 1.08});
    const change = sampleRate * 2;
    t.schedule({type: 'update', frame: change, rate: .75});
    for (let frame = 0; frame < change + 256; frame += 128) t.render(frame);
    const requested = change - 1, expected = (requested - 256) / sampleRate * 1.08;
    e.expected = expected; e.actual = t.stateAt(requested).position;
    assert(Math.abs(e.actual - expected) < 1e-9); t.dispose();
  });
  check(`Stem data beyond the original endpoint cannot leak into the nominal mix (${sampleRate})`, e => {
    const original = new Float32Array(sampleRate), long = new Float32Array(sampleRate + Math.round(sampleRate * .09));
    long.fill(.25, sampleRate);
    const buffers = [[original], [long], [original], [original], [original]];
    const t = new SoundTouchTransport({sampleRate, buffers});
    t.schedule({type: 'start', frame: 256}); let nonzero = 0, peak = 0;
    for (let frame = 0; frame < sampleRate + 512; frame += 128) for (const channel of t.render(frame)[1])
      for (const v of channel) { if (Math.abs(v) > 1e-7) nonzero++; peak = Math.max(peak, Math.abs(v)); }
    e.nonzero = nonzero; e.peak = peak; assert.equal(nonzero, 0); t.dispose();
  });
  check(`Nominal EOS preserves diagnostic padding and pull counters (${sampleRate})`, e => {
    const t = new SoundTouchTransport({sampleRate, buffers: [[new Float32Array(sampleRate)]]});
    t.schedule({type: 'start', frame: 256});
    for (let frame = 0; frame < sampleRate * 2; frame += 128) t.render(frame);
    const snapshot = t.snapshot(); e.snapshot = snapshot;
    assert.equal(snapshot.epochs.length, 0);
    assert(snapshot.retiredSummaries?.length > 0, 'EOS counters must remain available after epoch retirement');
    const counters = snapshot.retiredSummaries.flatMap(s => s.counters);
    assert(counters.some(c => c.paddingFramesFed > 0));
    assert(counters.every(c => c.paddingFramesFed <= c.paddingLimit)); t.dispose();
  });
}
const report = {created_at: new Date().toISOString(), passed: checks.filter(c => c.passed).length, failed: checks.filter(c => !c.passed).length,
  inputs: ['scripts/test_soundtouch_transport_boundaries.mjs', 'experiments/keylock-soundtouch/pull-transport.mjs'].map(path => ({path, sha256: hash(path)})), checks,
  scope: 'Actual pinned DSP through serial candidate transport; anchor history, original duration authority and retained EOS diagnostics. Not audible sample-position/EOS tail or native acceptance.'};
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', {flag: 'wx'});
console.log(JSON.stringify(report, null, 2)); assert.equal(report.failed, 0);
