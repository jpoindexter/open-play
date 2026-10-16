// Independent pre-EQ channel / post-master spectral taps. No source audio is added.
export const videoAnalysisPolicy = Object.freeze({
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
        return {bass: 0, mid: 0, treble: 0, level: 0, audioAvailable: false};
      tap.analyser.getFloatFrequencyData(tap.frequencies);
      tap.analyser.getFloatTimeDomainData(tap.samples);
      const level = Math.min(1, Math.sqrt(tap.samples.reduce((sum, n) => sum + n*n, 0) / tap.samples.length));
      return {...videoBands(tap.frequencies, ctx.sampleRate, tap.analyser.fftSize), level, audioAvailable: true};
    },
    dispose() {
      if (disposed) return; disposed = true;
      for (const {source, analyser} of taps) { source.disconnect(analyser); analyser.disconnect(); }
      sink.disconnect();
    },
  };
}
