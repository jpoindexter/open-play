import {
  prepareExtendedEffects,
  createExtendedEffect,
} from "./extended-effects.js";
import { extendedEffectNames, getExtendedEffectControls } from "./extended-effects-kernel.js";
// Exercise each exposed observed control through the actual AudioWorklet graph.
// Parameter contrasts prove independently implemented behavior, not reference DSP parity.
const cases = extendedEffectNames.flatMap(name => getExtendedEffectControls(name).map(control => ({
  name, control: control.name,
  depth: /Min Freq|Max Freq/.test(control.name) ? 75 : 100,
  low: {[control.name]: control.options ? control.options[0] : control.name === "Stereo" ? 0 : control.min},
  high: {[control.name]: control.options ? control.options.at(-1) : control.max},
})));
async function render(name, params, depth = 100) {
  const sr = 24000,
    ctx = new OfflineAudioContext(2, Math.ceil(sr * 3.2), sr);
  await prepareExtendedEffects(ctx);
  const b = ctx.createBuffer(2, Math.ceil(sr * 3.2), sr);
  for (let c = 0; c < 2; c++)
    for (let n = 0; n < b.length; n++)
      b.getChannelData(c)[n] =
        (0.65 + 0.35 * Math.cos(2 * Math.PI * .73 * n / sr)) *
        (0.15 * Math.sin((2 * Math.PI * (123.37 + c * 59.82) * n) / sr) +
        0.15 * Math.sin((2 * Math.PI * (4000 + c * 250) * n) / sr));
  const source = ctx.createBufferSource();
  source.buffer = b;
  const effect = createExtendedEffect(
    ctx,
    { name, on: true, depth, beat: "1/2", params },
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
    summary.textContent = `Rendering ${results.length + 1}/${cases.length}: ${item.name} / ${item.control}…`;
    try {
      const low = await render(item.name, item.low, item.depth),
        high = await render(item.name, item.high, item.depth);
      let energy = 0;
      for (let c = 0; c < 2; c++)
        for (let n = 0; n < low.length; n++)
          energy += (low.getChannelData(c)[n] - high.getChannelData(c)[n]) ** 2;
      const difference = Math.sqrt(energy / (2 * low.length));
      if (!Number.isFinite(difference) || difference < 0.00001)
        throw new Error(
          `Control did not measurably change rendered graph: ${difference}`,
        );
      results.push({
        name: item.name,
        control: item.control,
        status: "pass",
        difference,
        low: item.low,
        high: item.high,
      });
    } catch (error) {
      results.push({ name: item.name, control: item.control, status: "fail", error: error.message });
    }
  }
  summary.textContent = `${results.filter((r) => r.status === "pass").length}/${cases.length} observed-control audio graph checks passed.`;
  output.textContent = JSON.stringify(results, null, 2);
  run.disabled = false;
};
