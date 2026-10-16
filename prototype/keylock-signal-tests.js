export function tone(sampleRate, seconds, frequency) {
  const a = new Float32Array(Math.round(sampleRate * seconds));
  for (let i = 0; i < a.length; i++) {
    const t = i / sampleRate;
    a[i] =
      0.3 *
      Math.sin(2 * Math.PI * frequency * t) *
      Math.min(1, t * 20, (seconds - t) * 20);
  }
  return a;
}
function measure(a, sampleRate) {
  const from = Math.round(sampleRate * 0.5),
    to = Math.min(a.length - Math.round(sampleRate * 0.5), sampleRate * 2.5);
  let crossings = 0,
    square = 0,
    finite = true;
  for (let i = 0; i < a.length; i++) if (!Number.isFinite(a[i])) finite = false;
  for (let i = from; i < to; i++) {
    if (a[i] <= 0 && a[i + 1] > 0) crossings++;
    square += a[i] * a[i];
  }
  return {
    frequency: (crossings * sampleRate) / (to - from),
    rms: Math.sqrt(square / (to - from)),
    finite,
  };
}

// render receives channel arrays and returns channel arrays. The browser and Node
// runners both execute the same vendored WASM processor, with separate hosts.
export async function runSignalTests(render) {
  const sampleRate = 44100,
    seconds = 4,
    input = [
      tone(sampleRate, seconds, 440),
      tone(sampleRate, seconds, 659.255),
    ];
  const results = [];
  for (const [tempo, semitones] of [
    [1.25, 0],
    [0.8, 0],
    [1, 12],
    [1, -12],
    [1.25, 7],
  ]) {
    const start = performance.now();
    const channels = await render(input, sampleRate, { tempo, semitones });
    const expectedFrames = Math.round(input[0].length / tempo);
    const measured = channels.map((c) => measure(c, sampleRate));
    const expected = [440, 659.255].map((f) => f * 2 ** (semitones / 12));
    results.push({
      name: `Stereo tempo ${tempo}×; pitch ${semitones} semitones`,
      passed:
        channels.length === 2 &&
        channels.every((c) => c.length === expectedFrames) &&
        measured.every(
          (m, i) =>
            m.finite && m.rms > 0.1 && Math.abs(m.frequency - expected[i]) < 2,
        ),
      duration: channels[0].length / sampleRate,
      expectedDuration: seconds / tempo,
      measured,
      expectedFrequencies: expected,
      elapsedMs: Math.round(performance.now() - start),
    });
  }
  const silent = await render([new Float32Array(sampleRate)], sampleRate, {
    tempo: 1.2,
    semitones: 3,
  });
  results.push({
    name: "Silent input stays silent and finite",
    passed: silent[0].every((v) => Number.isFinite(v) && Math.abs(v) < 1e-6),
  });
  const pulse = tone(sampleRate, 4, 440);
  for (let i = 0; i < pulse.length; i++)
    pulse[i] *= Math.exp(-(((i / sampleRate - 2) / 0.1) ** 2));
  for (const tempo of [0.8, 1.25]) {
    const [audio] = await render([pulse], sampleRate, { tempo, semitones: 0 });
    let energy = 0,
      weightedTime = 0;
    for (let i = 0; i < audio.length; i++) {
      const e = audio[i] ** 2;
      energy += e;
      weightedTime += (i / sampleRate) * e;
    }
    const centroid = weightedTime / energy,
      expected = 2 / tempo;
    results.push({
      name: `Timeline mapping at ${tempo}×`,
      passed: Math.abs(centroid - expected) < 0.01,
      expectedSeconds: expected,
      measuredSeconds: centroid,
      toleranceSeconds: 0.01,
    });
  }
  return results;
}
