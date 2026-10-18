import { createEffect } from "./effects.js";
import {
  prepareExtendedEffects,
  createExtendedEffect,
  extendedEffectNames,
  channelEffectNames,
} from "./extended-effects.js";
function rms(a) {
  let s = 0;
  for (const x of a) s += x * x;
  return Math.sqrt(s / a.length);
}
function difference(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s / a.length);
}
const button = document.querySelector("#run"),
  summary = document.querySelector("#summary"),
  table = document.querySelector("#results");
button.onclick = async () => {
  button.disabled = true;
  table.replaceChildren();
  let passed = 0,
    failed = 0;
  const records = [];
  for (const name of [...extendedEffectNames, ...channelEffectNames]) {
    summary.textContent = `Rendering ${passed + failed + 1}/59: ${name}`;
    const row = document.createElement("tr");
    table.append(row);
    try {
      const sr = 24000,
        N = sr * 3,
        ctx = new OfflineAudioContext(2, N, sr);
      await prepareExtendedEffects(ctx);
      const buffer = ctx.createBuffer(2, N, sr);
      for (let c = 0; c < 2; c++)
        for (let i = 0; i < N; i++)
          buffer.getChannelData(c)[i] =
            0.16 * Math.sin((2 * Math.PI * (220 + c * 110) * i) / sr) +
            0.08 * Math.sin((2 * Math.PI * (1900 + c * 1000) * i) / sr) +
            0.04 * Math.sin((2 * Math.PI * (73 + c * 13) * i) / sr) +
            0.025 *
              Math.sin(2 * Math.PI * ((150 * i) / sr + 37 * (i / sr) ** 2)) +
            (i % (sr / 4) < 40 ? 0.15 : 0);
      const fx = createExtendedEffect(
          ctx,
          { name, on: true, depth: 100, beat: "1/2", params: {} },
          120,
        ),
        source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(fx.input);
      fx.output.connect(ctx.destination);
      source.start();
      const output = await ctx.startRendering(),
        a = output.getChannelData(0),
        b = output.getChannelData(1),
        level = rms(a),
        delta = difference(a, buffer.getChannelData(0));
      if (
        !a.every(Number.isFinite) ||
        !b.every(Number.isFinite) ||
        level < 1e-5 ||
        delta < 0.001
      )
        throw new Error(
          `Invalid/empty/passthrough output: RMS ${level}, difference ${delta}`,
        );
      if (name === "Roll") {
        const offset = sr / 2,
          division = sr / 4;
        const repeated = difference(
          a.subarray(offset, offset + division),
          a.subarray(offset + division, offset + division * 2),
        );
        const changingInput = difference(
          buffer.getChannelData(0).subarray(offset, offset + division),
          buffer
            .getChannelData(0)
            .subarray(offset + division, offset + division * 2),
        );
        if (repeated > 1e-5 || changingInput < 0.001)
          throw new Error(
            `Roll witness failed: output repeat difference ${repeated}; input difference ${changingInput}`,
          );
      }
      fx.dispose();
      source.disconnect();
      passed++;
      const evidence = `AudioWorklet rendered ${N} frames; RMS ${level.toFixed(5)}; dry difference ${delta.toFixed(5)}`;
      records.push({
        name,
        status: "pass",
        sampleRate: sr,
        frames: N,
        rms: level,
        difference: delta,
      });
      for (const text of [name, "PASS", evidence]) {
        const cell = document.createElement("td");
        cell.textContent = text;
        row.append(cell);
      }
    } catch (e) {
      failed++;
      records.push({ name, status: "fail", error: e.message });
      for (const text of [name, "FAIL", e.message]) {
        const cell = document.createElement("td");
        cell.textContent = text;
        row.append(cell);
      }
    }
  }
  summary.textContent = `${passed}/59 passed; ${failed} failed. Actual AudioWorklet rendering; independent DSP only.`;
  button.disabled = false;
  const report = document.createElement("pre");
  report.id = "test-json";
  report.textContent = JSON.stringify(
    { date: new Date().toISOString(), passed, failed, records },
    null,
    2,
  );
  table.after(report);
};

const lifecycleButton = document.querySelector("#run-native");
lifecycleButton.onclick = async () => {
  lifecycleButton.disabled = true;
  const status = document.querySelector("#native-summary"),
    records = [];
  for (const name of ["LPF", "Delay", "Reverb", "Wah Filter"]) {
    try {
      const sr = 24000,
        N = sr * 2,
        ctx = new OfflineAudioContext(2, N, sr),
        source = ctx.createBufferSource(),
        buffer = ctx.createBuffer(2, N, sr);
      if(name==="LPF")await prepareExtendedEffects(ctx);
      for (let c = 0; c < 2; c++)
        for (let n = 0; n < N; n++)
          buffer.getChannelData(c)[n] =
            name === "Delay" || name === "Reverb"
              ? n < 20
                ? 0.4
                : 0
              : 0.3 * Math.sin((2 * Math.PI * 440 * n) / sr);
      source.buffer = buffer;
      const spec = {
          name,
          on: true,
          depth: 100,
          beat: "1/2",
          params:
            name === "Delay"
              ? { Feedback: 80 }
              : name === "Reverb"
                ? { Decay: 3 }
                : {},
        },
        fx = createEffect(ctx, spec, 120);
      source.connect(fx.input);
      fx.output.connect(ctx.destination);
      source.start();
      const pause = ctx.suspend(0.5),
        rendering = ctx.startRendering();
      await pause;
      const kept = fx.update(
        {
          ...spec,
          depth: 50,
          params: {
            ...spec.params,
            ...(name === "LPF"
              ? { "Min Freq": 500 }
              : name === "Wah Filter"
                ? { Range: 3 }
                : name === "Reverb"
                  ? { Contour: 20 }
                  : { Feedback: 70 }),
          },
        },
        120,
      );
      if (kept !== true)
        throw new Error(
          "Ordinary parameter update replaced the native processor",
        );
      await ctx.resume();
      const out = await rendering,
        late = out.getChannelData(0).subarray(sr * 0.55, sr);
      const tail = rms(late);
      if (!Number.isFinite(tail) || tail < 1e-6)
        throw new Error("Updated graph lost its audio/tail");
      const structural =
        name === "Reverb"
          ? fx.update({ ...spec, params: { Decay: 4 } }, 120)
          : name === "LPF"
            ? fx.update({ ...spec, params: { Slope: 48 } }, 120)
            : false;
      if (name === "Reverb" && structural !== false)
        throw new Error("Impulse response change must request a slot replacement");
      if (name === "LPF" && structural !== true)
        throw new Error("LPF slope change must preserve its warmed processor");
      fx.dispose();
      records.push({
        name,
        status: "pass",
        tailRms: tail,
        ordinaryUpdatePreserved: true,
      });
    } catch (e) {
      records.push({ name, status: "fail", error: e.message });
    }
  }
  try {
    const sr = 24000,
      N = sr * 2,
      ctx = new OfflineAudioContext(2, N, sr);
    await prepareExtendedEffects(ctx);
    const source = ctx.createBufferSource(),
      buffer = ctx.createBuffer(2, N, sr);
    for (let c = 0; c < 2; c++)
      for (let n = 0; n < N; n++)
        buffer.getChannelData(c)[n] =
          0.2 *
          (Math.sin((2 * Math.PI * 100 * n) / sr) +
            Math.sin((2 * Math.PI * 4000 * n) / sr));
    source.buffer = buffer;
    let fx = createEffect(
        ctx,
        { name: "Echo", on: true, depth: 100, beat: "1/2", params: {} },
        120,
      ),
      errors = [];
    fx.processor.onprocessorerror = () => errors.push("Echo processorerror");
    source.connect(fx.input);
    fx.output.connect(ctx.destination);
    source.start();
    const pause = ctx.suspend(0.5),
      rendering = ctx.startRendering();
    await pause;
    const next = {
      name: "HPF",
      on: true,
      depth: 100,
      beat: "1/2",
      params: { Cutoff: 1000, Resonance: 0.707 },
    };
    if (fx.update(next, 120) !== false)
      throw new Error("Effect type change did not request replacement");
    source.disconnect();
    fx.dispose();
    fx = createEffect(ctx, next, 120);
    fx.processor.onprocessorerror = () => errors.push("HPF processorerror");
    source.connect(fx.input);
    fx.output.connect(ctx.destination);
    await ctx.resume();
    const rendered = await rendering,
      a = rendered.getChannelData(0);
    const amplitude = (hz) => {
      let re = 0,
        im = 0;
      for (let n = sr; n < N; n++) {
        re += a[n] * Math.cos((2 * Math.PI * hz * n) / sr);
        im += a[n] * Math.sin((2 * Math.PI * hz * n) / sr);
      }
      return (2 * Math.hypot(re, im)) / sr;
    };
    const low = amplitude(100),
      high = amplitude(4000);
    if (errors.length || high / low < 10)
      throw new Error(
        `Same-slot replacement failed: ${errors.join(",")} high/low=${high / low}`,
      );
    fx.dispose();
    records.push({
      name: "Echo to HPF same-slot replacement",
      status: "pass",
      low,
      high,
      processorErrors: errors.length,
    });
  } catch (e) {
    records.push({
      name: "Echo to HPF same-slot replacement",
      status: "fail",
      error: e.message,
    });
  }
  const pass = records.filter((x) => x.status === "pass").length;
  status.textContent =
    `${pass}/5 live-update lifecycle checks passed. ` +
    records
      .map(
        (x) => `${x.name}: ${x.status}${x.error ? " (" + x.error + ")" : ""}`,
      )
      .join("; ");
  const report = document.createElement("pre");
  report.id = "native-test-json";
  report.textContent = JSON.stringify(records, null, 2);
  status.after(report);
  lifecycleButton.disabled = false;
};
