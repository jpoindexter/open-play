import {
  prepareExtendedEffects,
  createExtendedEffect,
} from "./extended-effects.js";
const cases = [
  { name: "Echo", low: { HPF: 20 }, high: { HPF: 4000 } },
  {
    name: "Bit Crush",
    low: { Downsampling: 48000 },
    high: { Downsampling: 1000 },
  },
  {
    name: "HPF",
    low: { Cutoff: 1000, Slope: 12 },
    high: { Cutoff: 1000, Slope: 24 },
  },
  { name: "Bright Reverb", low: { Width: 100 }, high: { Width: 200 } },
  { name: "Chorus Quad", low: { Delay: 5 }, high: { Delay: 20 } },
  { name: "Phaser", low: { Pitch: 500 }, high: { Pitch: 4000 } },
  {
    name: "LFO Filter",
    low: { "LFO Shape": "Sine" },
    high: { "LFO Shape": "Square" },
  },
  { name: "Tremolo", low: { Stereo: 0 }, high: { Stereo: 100 } },
  { name: "Transform", low: { Noise: 0 }, high: { Noise: 100 } },
];
async function render(name, params) {
  const sr = 24000,
    ctx = new OfflineAudioContext(2, sr * 2, sr);
  await prepareExtendedEffects(ctx);
  const b = ctx.createBuffer(2, sr * 2, sr);
  for (let c = 0; c < 2; c++)
    for (let n = 0; n < b.length; n++)
      b.getChannelData(c)[n] =
        0.15 * Math.sin((2 * Math.PI * (100 + c * 37) * n) / sr) +
        0.15 * Math.sin((2 * Math.PI * (4000 + c * 250) * n) / sr);
  const source = ctx.createBufferSource();
  source.buffer = b;
  const effect = createExtendedEffect(
    ctx,
    { name, on: true, depth: 100, beat: "1/2", params },
    120,
  );
  source.connect(effect.input);
  effect.output.connect(ctx.destination);
  source.start();
  const result = await ctx.startRendering();
  effect.dispose();
  source.disconnect();
  return result;
}
const run = document.querySelector("#run"),
  summary = document.querySelector("#summary"),
  output = document.querySelector("#results");
run.onclick = async () => {
  run.disabled = true;
  const results = [];
  for (const item of cases) {
    summary.textContent = `Rendering ${item.name}…`;
    try {
      const low = await render(item.name, item.low),
        high = await render(item.name, item.high);
      let energy = 0;
      for (let c = 0; c < 2; c++)
        for (let n = 0; n < low.length; n++)
          energy += (low.getChannelData(c)[n] - high.getChannelData(c)[n]) ** 2;
      const difference = Math.sqrt(energy / (2 * low.length));
      if (!Number.isFinite(difference) || difference < 0.001)
        throw new Error(
          `Control did not measurably change rendered graph: ${difference}`,
        );
      results.push({
        name: item.name,
        status: "pass",
        difference,
        low: item.low,
        high: item.high,
      });
    } catch (error) {
      results.push({ name: item.name, status: "fail", error: error.message });
    }
  }
  summary.textContent = `${results.filter((r) => r.status === "pass").length}/${cases.length} observed-control audio graph checks passed.`;
  output.textContent = JSON.stringify(results, null, 2);
  run.disabled = false;
};
