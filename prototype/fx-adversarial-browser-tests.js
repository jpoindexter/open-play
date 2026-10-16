import {prepareExtendedEffects, createExtendedEffect} from './extended-effects.js';

// Actual browser AudioWorklet graphs. These regressions establish independent
// behavior, not vendor transfer functions or equivalence to reference audio.
const rms = samples => Math.sqrt(samples.reduce((sum, value) => sum + value * value, 0) / samples.length);
function maximumDifference(a, b) {
  let maximum = 0;
  for (let i = 0; i < a.length; i++) maximum = Math.max(maximum, Math.abs(a[i] - b[i]));
  return maximum;
}
function peak(samples) {
  let maximum = 0;
  for (const value of samples) maximum = Math.max(maximum, Math.abs(value));
  return maximum;
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
async function render(input, sampleRate, spec, initialSpec) {
  const context = new OfflineAudioContext(2, input.length, sampleRate);
  await prepareExtendedEffects(context);
  const buffer = context.createBuffer(2, input.length, sampleRate);
  buffer.copyToChannel(input, 0);
  buffer.copyToChannel(input, 1);
  const source = context.createBufferSource();
  source.buffer = buffer;
  const effect = createExtendedEffect(context, initialSpec || spec, 120);
  let processorFailed = false;
  effect.processor.onprocessorerror = () => { processorFailed = true; };
  source.connect(effect.input);
  effect.output.connect(context.destination);
  try {
    let updateLifecycle;
    source.start();
    let rendering;
    if (initialSpec) {
      // Starting an offline render is what constructs/runs its processor. A
      // timer before startRendering does not establish that the update arrived.
      // The timing fixture has silent input until 1.024s, so suspend after eight
      // real render quanta and update the running processor before that input.
      const suspended = context.suspend(.256);
      rendering = context.startRendering();
      await suspended;
      assert(context.state === 'suspended' && context.currentTime > 0,
        'Offline processor did not reach the scheduled update boundary.');
      updateLifecycle = {state: context.state, appliedAfterRenderSeconds: context.currentTime};
      assert(effect.update(spec, 120), 'Existing AudioWorklet rejected its timing update.');
      // Yield a task while the known-live processor is suspended. The output
      // equality/tap assertions below, not this yield, prove update delivery.
      await new Promise(resolve => setTimeout(resolve, 0));
      await context.resume();
    } else rendering = context.startRendering();
    const result = await rendering;
    assert(!processorFailed, 'AudioWorklet processor failed.');
    const left = result.getChannelData(0).slice();
    const right = result.getChannelData(1).slice();
    assert(left.every(Number.isFinite) && right.every(Number.isFinite), 'AudioWorklet produced nonfinite output.');
    const channels = [left, right];
    channels.updateLifecycle = updateLifecycle;
    return channels;
  } finally {
    effect.dispose();
    source.disconnect();
  }
}
const spec = (name, params, beat = '1/2') => ({name, on: true, depth: 100, beat, params});
const cases = [];

for (const Pattern of ['Shreds', 'Even', 'Dotted']) cases.push({
  name: `Multi Tap Delay / ${Pattern}: maximum feedback decays through 45 seconds`,
  async run() {
    const rate = 4000, input = new Float32Array(rate * 45);
    input.fill(.2, 0, rate / 20);
    const output = await render(input, rate, spec('Multi Tap Delay', {Pattern, Feedback: 90, Filter: 0}));
    const channels = output.map(samples => {
      const earlyRms = rms(samples.subarray(rate * 5, rate * 10));
      const lateRms = rms(samples.subarray(rate * 35, rate * 40));
      const maximum = peak(samples);
      assert(earlyRms > 1e-5, 'Fixture did not establish an audible feedback tail.');
      assert(lateRms < earlyRms * .001, `Feedback tail failed to decay: ${lateRms / earlyRms}`);
      assert(maximum < 1, `Feedback unexpectedly grew or clipped: peak=${maximum}`);
      return {earlyRms, lateRms, decayRatio: lateRms / earlyRms, peak: maximum};
    });
    return {sampleRate: rate, renderedSeconds: 45, channels};
  },
});

cases.push({
  name: 'Multi Tap Delay: public timing/pattern update retains the 24-second third tap',
  async run() {
    const rate = 4000, origin = 4096, input = new Float32Array(origin + rate * 27);
    input[origin] = .5;
    const initial = spec('Multi Tap Delay', {Pattern: 'Shreds', Feedback: 0, Filter: 0, 'Beat Modify': 1}, '4');
    const final = spec('Multi Tap Delay', {...initial.params, Pattern: 'Even', 'Beat Modify': 4}, '4');
    const updated = await render(input, rate, final, initial);
    const fresh = await render(input, rate, final);
    const channels = updated.map((samples, channel) => {
      const maximum = maximumDifference(samples, fresh[channel]);
      const thirdTapFrame = origin + rate * 24;
      const thirdTapPeak = peak(samples.subarray(thirdTapFrame, thirdTapFrame + 100));
      const oldFirstTapPeak = peak(samples.subarray(origin + rate * 2, origin + rate * 2 + 100));
      assert(maximum < 1e-6, `Updated processor differs from fresh construction: ${JSON.stringify({maximum, oldFirstTapPeak, thirdTapPeak, updateLifecycle: updated.updateLifecycle})}`);
      assert(thirdTapPeak > .05, `Third tap at 24 seconds is missing: ${thirdTapPeak}`);
      assert(oldFirstTapPeak === 0, 'Initial timing remained active after the suspended public update.');
      return {maximumDifference: maximum, thirdTapPeak, oldFirstTapPeak, tapTimeAfterInputSeconds: 24, absoluteTapTimeSeconds: thirdTapFrame / rate};
    });
    return {sampleRate: rate, renderedSeconds: input.length / rate, inputOriginSeconds: origin / rate, updateLifecycle: updated.updateLifecycle, channels};
  },
});

for (const name of ['Infinity Filter', 'Falling Flanger', 'Infinity Flanger', 'Space Invader']) cases.push({
  name: `${name}: equivalent fractional signed sweep velocities remain continuous`,
  async run() {
    const rate = 24000;
    const input = Float32Array.from({length: rate * 2}, (_, i) => .3 * Math.sin(2 * Math.PI * 440 * i / rate));
    const a = await render(input, rate, spec(name, {Direction: -7, 'Beat Modify': 1}));
    const b = await render(input, rate, spec(name, {Direction: -28, 'Beat Modify': 4}));
    const maximum = Math.max(...a.map((samples, channel) => maximumDifference(samples, b[channel])));
    assert(peak(a[0]) > .001, 'Fixture did not establish nonzero affected output.');
    assert(maximum < 1e-6, `Equivalent sweep velocities diverged at a base beat: ${maximum}`);
    return {sampleRate: rate, renderedSeconds: 2, maximumDifference: maximum};
  },
});

cases.push({
  name: 'Stretch exit plays and rewinds a late marker while rejecting later live input',
  async run() {
    const rate = 4000, input = new Float32Array(rate * 8);
    input.fill(.4, rate * .7, rate * .75);
    const later = input.slice();
    later.fill(.8, rate * 3, rate * 4);
    const a = await render(input, rate, spec('Epic Stretch Rewind', {}));
    const b = await render(later, rate, spec('Epic Stretch Rewind', {}));
    const channels = a.map((samples, channel) => {
      const forwardRms = rms(samples.subarray(rate * .5, rate * 2));
      const reverseRms = rms(samples.subarray(rate * 2, rate * 7));
      const maximum = maximumDifference(samples, b[channel]);
      assert(forwardRms > .001, `Forward Stretch missed the .7-second source marker: ${forwardRms}`);
      assert(reverseRms > .001, `Reverse Stretch missed the .7-second source marker: ${reverseRms}`);
      assert(maximum < 1e-6, `Post-capture live input entered the finite exit: ${maximum}`);
      return {forwardRms, reverseRms, laterInputMaximumDifference: maximum};
    });
    return {sampleRate: rate, renderedSeconds: 8, channels};
  },
});

const run = document.querySelector('#run');
const summary = document.querySelector('#summary');
const output = document.querySelector('#results');
run.onclick = async () => {
  run.disabled = true;
  document.body.dataset.result = 'running';
  const results = [];
  for (const item of cases) {
    summary.textContent = `Running ${results.length + 1}/${cases.length}: ${item.name}…`;
    try {
      results.push({name: item.name, passed: true, evidence: await item.run()});
    } catch (error) {
      results.push({name: item.name, passed: false, error: error.message, stack: error.stack});
    }
    output.textContent = JSON.stringify(results, null, 2);
  }
  const passed = results.filter(result => result.passed).length;
  document.body.dataset.result = passed === cases.length ? 'passed' : 'failed';
  summary.textContent = `${passed}/${cases.length} FX adversarial audio graph checks passed.`;
  output.textContent = JSON.stringify({
    scope: 'Executed OfflineAudioContext/createExtendedEffect AudioWorklet graphs. Independent behavior; vendor ranges and sonic equivalence remain unverified.',
    passed, total: cases.length, results,
  }, null, 2);
  run.disabled = false;
};
