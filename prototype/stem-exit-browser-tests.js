import { createStemExitFX, renderStemExitPCM } from "./stem-exit-fx.js";
const button = document.querySelector("#run"),
  summary = document.querySelector("#summary"),
  output = document.querySelector("#results");
button.onclick = async () => {
  button.disabled = true;
  const results = [];
  for (const kind of ["echo", "brake"])
    try {
      const sr = 24000,
        ctx = new OfflineAudioContext(2, sr * 5, sr),
        buffer = ctx.createBuffer(2, sr * 3, sr);
      for (let c = 0; c < 2; c++)
        for (let n = 0; n < buffer.length; n++)
          buffer.getChannelData(c)[n] =
            n < sr
              ? 0.3 * Math.sin((2 * Math.PI * (440 + c * 220) * n) / sr)
              : 0.8;
      const options = { buffer, offset: 1, rate: 1, bpm: 120, kind },
        reference = renderStemExitPCM({
          ...options,
          channels: [buffer.getChannelData(0), buffer.getChannelData(1)],
          sampleRate: sr,
        });
      const fx = createStemExitFX(ctx, options);
      fx.output.connect(ctx.destination);
      const rendered = await ctx.startRendering();
      let maxError = 0,
        tailPeak = 0;
      for (let c = 0; c < 2; c++)
        for (let n = 0; n < rendered.length; n++) {
          const value = rendered.getChannelData(c)[n];
          maxError = Math.max(
            maxError,
            Math.abs(value - (reference.channels[c][n] || 0)),
          );
          if (n > reference.channels[c].length)
            tailPeak = Math.max(tailPeak, Math.abs(value));
        }
      if (maxError > 1e-6 || tailPeak > 1e-9)
        throw new Error(`PCM mismatch ${maxError}; post-stop tail ${tailPeak}`);
      fx.dispose();
      results.push({
        kind,
        status: "pass",
        actualAudioGraph: true,
        maxError,
        tailPeak,
        duration: fx.duration,
        capture: fx.capture,
      });
    } catch (error) {
      results.push({ kind, status: "fail", error: error.message });
    }
  summary.textContent = `${results.filter((x) => x.status === "pass").length}/2 actual stem exit graph checks passed.`;
  output.textContent = JSON.stringify(results, null, 2);
  button.disabled = false;
};
