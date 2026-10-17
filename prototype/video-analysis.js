// Independent pre-EQ channel / post-master spectral taps. No source audio is added.
export const videoAnalysisPolicy = Object.freeze({
  spectrum8Hz: Object.freeze([20, 63, 125, 250, 500, 1000, 2000, 4000, 20000]),
  spectrum8Mapping: 'Eight independent FFT-bin power sums; upper-exclusive ranges clipped at Nyquist. Empty ranges are zero. Not vendor bands.',
  fftSize: 2048, bassHz: [20, 250], midHz: [250, 4000], trebleHz: [4000, 20000],
  tap: 'Deck input before channel EQ and fader; master after master gain.',
  mapping: 'Square root of summed FFT-bin power, clamped 0..1; level is time-domain RMS. Not a recovered Serato mapping.',
});
export function videoBands(frequencies, sampleRate, fftSize) {
  const band = (low, high) => {
    let power = 0;
    for (let i = Math.max(1, Math.ceil(low * fftSize / sampleRate));
      i < Math.min(frequencies.length, Math.ceil(high * fftSize / sampleRate)); i++)
      if (Number.isFinite(frequencies[i])) power += 10 ** (frequencies[i] / 10);
    return Math.min(1, Math.sqrt(power));
  };
  return {bass: band(20, 250), mid: band(250, 4000), treble: band(4000, 20000)};
}
// Exact own numeric data only: silence is an eight-zero vector, while missing,
// accessor/inherited/sparse/nonfinite/out-of-range data is explicitly unavailable.
// Consumers receive a copy; neither validation nor later rendering invokes getters.
export function normalizeSpectrum8(input) {
  try {
    if (!Array.isArray(input) || Object.getOwnPropertyDescriptor(input, 'length')?.value !== 8) return null;
    const output = [];
    for (let i = 0; i < 8; i++) {
      const descriptor = Object.getOwnPropertyDescriptor(input, String(i));
      if (!descriptor || !Object.hasOwn(descriptor, 'value') ||
          !Number.isFinite(descriptor.value) || descriptor.value < 0 || descriptor.value > 1) return null;
      output.push(descriptor.value);
    }
    return output;
  } catch { return null; }
}
export function videoSpectrum8(frequencies, sampleRate, fftSize) {
  if (!Number.isFinite(sampleRate) || sampleRate <= 0 || !Number.isInteger(fftSize) || fftSize < 2 || fftSize % 2)
    throw new RangeError('Spectrum analysis requires a positive sample rate and an even FFT size.');
  const nyquist = sampleRate / 2, edges = videoAnalysisPolicy.spectrum8Hz;
  return edges.slice(0, -1).map((low, index) => {
    const high = Math.min(edges[index + 1], nyquist);
    if (low >= high) return 0;
    let power = 0;
    const end = Math.min(frequencies.length, Math.ceil(high * fftSize / sampleRate));
    for (let bin = Math.max(1, Math.ceil(low * fftSize / sampleRate)); bin < end; bin++)
      if (Number.isFinite(frequencies[bin])) power += 10 ** (frequencies[bin] / 10);
    return Math.min(1, Math.sqrt(power));
  });
}
export function createVideoAnalysis(ctx, sources) {
  const sink = ctx.createGain(); sink.gain.value = 0; sink.connect(ctx.destination);
  const taps = sources.map(source => {
    const analyser = ctx.createAnalyser(); analyser.fftSize = videoAnalysisPolicy.fftSize;
    analyser.smoothingTimeConstant = 0;
    source.connect(analyser); analyser.connect(sink);
    return {source, analyser, frequencies: new Float32Array(analyser.frequencyBinCount),
      samples: new Float32Array(analyser.fftSize)};
  });
  let disposed = false;
  return {
    read(index) {
      const tap = taps[index];
      if (disposed || !tap || ctx.state !== 'running')
        return {bass: 0, mid: 0, treble: 0, level: 0, audioAvailable: false, spectrum8: null, spectrum8Available: false};
      tap.analyser.getFloatFrequencyData(tap.frequencies);
      tap.analyser.getFloatTimeDomainData(tap.samples);
      const level = Math.min(1, Math.sqrt(tap.samples.reduce((sum, n) => sum + n*n, 0) / tap.samples.length));
      return {...videoBands(tap.frequencies, ctx.sampleRate, tap.analyser.fftSize), level, audioAvailable: true,
        spectrum8: videoSpectrum8(tap.frequencies, ctx.sampleRate, tap.analyser.fftSize), spectrum8Available: true};
    },
    dispose() {
      if (disposed) return; disposed = true;
      for (const {source, analyser} of taps) { source.disconnect(analyser); analyser.disconnect(); }
      sink.disconnect();
    },
  };
}
