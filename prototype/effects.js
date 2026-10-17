import { parseBeatModifier } from "./observed-fx-control-adapters.js";
// Independent Web Audio processors. No claim of Serato's proprietary transfer functions.
import {
  createExtendedEffect,
  extendedEffectNames,
  channelEffectNames,
} from "./extended-effects.js";
export const implementedEffects = [
  "LPF",
  "Delay",
  "Reverb",
  "Wah Filter",
  ...extendedEffectNames,
];
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
function number(value, fallback) {
  const x = parseFloat(value);
  return Number.isFinite(x) ? x : fallback;
}
function frequency(value, fallback) {
  return number(value, fallback) * (/khz/i.test(String(value)) ? 1000 : 1);
}
function beatValue(value) {
  const [n, d] = String(value).split("/").map(Number);
  return Number.isFinite(n) ? n / (d || 1) : 0.5;
}
export function createEffect(ctx, spec, bpm = 120) {
  // The app mutates slot objects in place; construction identity is immutable.
  spec = {...spec, params: {...spec.params}};
  if (
    extendedEffectNames.includes(spec.name) ||
    channelEffectNames.includes(spec.name)
  )
    return createExtendedEffect(ctx, spec, bpm);
  let currentSpec = { ...spec, params: { ...spec.params } };
  let applyParams = () => true;
  let disposed = false;
  const smooth = (param, value) => {
    param.cancelScheduledValues(ctx.currentTime);
    param.setTargetAtTime(value, ctx.currentTime, 0.005);
  };
  const input = ctx.createGain(),
    output = ctx.createGain(),
    dry = ctx.createGain(),
    wet = ctx.createGain();
  const nodes = [input, output, dry, wet],
    sources = [];
  input.connect(dry);
  dry.connect(output);
  wet.connect(output);
  const depth = clamp(number(spec.depth, 50) / 100, 0, 1),
    p = spec.params || {};
  const active = spec.on && implementedEffects.includes(spec.name);
  dry.gain.value = active ? 1 - depth : 1;
  wet.gain.value = active ? depth : 0;
  const node = (type) => {
    const n = ctx[type]();
    nodes.push(n);
    return n;
  };
  if (active && spec.name === "LPF") {
    const min = clamp(frequency(p["Min Freq"], 200), 20, 20000),
      max = clamp(frequency(p["Max Freq"], 20000), min, 20000);
    const count = clamp(Math.round(number(p.Slope, 24) / 12), 1, 4);
    const filters = [];
    let previous = input;
    for (let i = 0; i < count; i++) {
      const filter = node("createBiquadFilter");
      filters.push(filter);
      filter.type = "lowpass";
      filter.frequency.value = max * Math.pow(min / max, depth);
      filter.Q.value = clamp(number(p.Resonance, 1.77), 0.1, 12) / count;
      previous.connect(filter);
      previous = filter;
    }
    previous.connect(wet);
    applyParams = (next, nextDepth) => {
      const nextCount = clamp(Math.round(number(next.Slope, 24) / 12), 1, 4);
      if (nextCount !== count) return false;
      const lo = clamp(frequency(next["Min Freq"], 200), 20, 20000);
      const hi = clamp(frequency(next["Max Freq"], 20000), lo, 20000);
      for (const filter of filters) {
        smooth(filter.frequency, hi * Math.pow(lo / hi, nextDepth));
        smooth(filter.Q, clamp(number(next.Resonance, 1.77), 0.1, 12) / count);
      }
      return true;
    };
  } else if (active && spec.name === "Delay") {
    const delay = ctx.createDelay(96),
      feedback = node("createGain"),
      highpass = node("createBiquadFilter"),
      drive = node("createWaveShaper");
    nodes.push(delay);
    delay.delayTime.value = clamp(
      (60 / Math.max(20, bpm)) *
        beatValue(spec.beat) *
        parseBeatModifier(p["Beat Modify"], 1),
      0.005,
      96,
    );
    feedback.gain.value = clamp(number(p.Feedback, 40) / 100, 0, 0.9);
    highpass.type = "highpass";
    highpass.frequency.value = clamp(frequency(p.HPF, 20), 20, 18000);
    const amount = clamp(number(p.Drive, 0) / 100, 0, 1);
    if (amount) {
      const curve = new Float32Array(2048);
      const k = 1 + amount * 12;
      for (let i = 0; i < curve.length; i++)
        curve[i] =
          Math.tanh(((2 * i) / (curve.length - 1) - 1) * k) / Math.tanh(k);
      drive.curve = curve;
    }
    input.connect(drive);
    drive.connect(delay);
    delay.connect(wet);
    delay.connect(highpass);
    highpass.connect(feedback);
    feedback.connect(delay);
    applyParams = (next, nextDepth, nextBpm, nextSpec) => {
      smooth(
        delay.delayTime,
        clamp(
          (60 / Math.max(20, nextBpm)) *
            beatValue(nextSpec.beat) *
            parseBeatModifier(next["Beat Modify"], 1),
          0.005,
          96,
        ),
      );
      smooth(feedback.gain, clamp(number(next.Feedback, 40) / 100, 0, 0.9));
      smooth(highpass.frequency, clamp(frequency(next.HPF, 20), 20, 18000));
      if (number(next.Drive, 0) !== number(currentSpec.params.Drive, 0)) {
        const amount = clamp(number(next.Drive, 0) / 100, 0, 1);
        if (!amount) drive.curve = null;
        else {
          const curve = new Float32Array(2048),
            k = 1 + amount * 12;
          for (let i = 0; i < curve.length; i++)
            curve[i] =
              Math.tanh(((2 * i) / (curve.length - 1) - 1) * k) / Math.tanh(k);
          drive.curve = curve;
        }
      }
      return true;
    };
  } else if (active && spec.name === "Reverb") {
    const convolver = node("createConvolver"),
      contour = node("createBiquadFilter");
    const decay = clamp(number(p.Decay, 1.5), 0.1, 8),
      width = clamp(number(p.Width, 100) / 100, 0, 2);
    const impulse = ctx.createBuffer(
      2,
      Math.ceil(ctx.sampleRate * decay),
      ctx.sampleRate,
    );
    let seed = 72341;
    for (let i = 0; i < impulse.length; i++) {
      seed = (1664525 * seed + 1013904223) >>> 0;
      const left = seed / 2147483648 - 1;
      seed = (1664525 * seed + 1013904223) >>> 0;
      const right = seed / 2147483648 - 1;
      const envelope = Math.pow(1 - i / impulse.length, 2.5);
      impulse.getChannelData(0)[i] = left * envelope;
      impulse.getChannelData(1)[i] =
        (left * (1 - width) + right * width) * envelope;
    }
    convolver.buffer = impulse;
    contour.type = "lowpass";
    contour.frequency.value =
      18000 * Math.pow(0.02, clamp(number(p.Contour, 0) / 100, 0, 1));
    input.connect(convolver);
    convolver.connect(contour);
    contour.connect(wet);
    if (p["Mix Mode"] && p["Mix Mode"] !== "Wet Mix") dry.gain.value = 1;
    applyParams = (next) => {
      // Changing IR shape requires replacing this slot. Depth/contour/mix keep the existing tail.
      if (
        clamp(number(next.Decay, 1.5), 0.1, 8) !== decay ||
        clamp(number(next.Width, 100) / 100, 0, 2) !== width
      )
        return false;
      smooth(
        contour.frequency,
        18000 * Math.pow(0.02, clamp(number(next.Contour, 0) / 100, 0, 1)),
      );
      return true;
    };
  } else if (active && spec.name === "Wah Filter") {
    const filter = node("createBiquadFilter"),
      lfo = node("createOscillator"),
      modulation = node("createGain");
    filter.type = "bandpass";
    filter.Q.value = clamp(number(p.Resonance, 8), 0.1, 16);
    const octaves = clamp(number(p.Range, 4), 0.1, 6),
      center = 160 * Math.pow(2, octaves * depth);
    filter.frequency.value = clamp(center, 40, 12000);
    lfo.frequency.value = clamp(bpm / 60 / number(p.Rate, 2), 0.05, 20);
    modulation.gain.value = Math.min(
      center * 0.95,
      center * clamp(number(p["LFO Depth"], 0) / 100, 0, 1),
    );
    lfo.connect(modulation);
    modulation.connect(filter.frequency);
    lfo.start();
    sources.push(lfo);
    input.connect(filter);
    filter.connect(wet);
    applyParams = (next, nextDepth, nextBpm) => {
      const octaves = clamp(number(next.Range, 4), 0.1, 6),
        center = 160 * Math.pow(2, octaves * nextDepth);
      smooth(filter.Q, clamp(number(next.Resonance, 8), 0.1, 16));
      smooth(filter.frequency, clamp(center, 40, 12000));
      smooth(
        lfo.frequency,
        clamp(nextBpm / 60 / Math.max(0.01, number(next.Rate, 2)), 0.05, 20),
      );
      smooth(
        modulation.gain,
        Math.min(
          center * 0.95,
          center * clamp(number(next["LFO Depth"], 0) / 100, 0, 1),
        ),
      );
      return true;
    };
  }
  return {
    input,
    output,
    update(nextSpec, nextBpm = bpm) {
      if (
        disposed ||
        nextSpec.name !== spec.name ||
        Boolean(nextSpec.on) !== Boolean(spec.on)
      )
        return false;
      const merged = {
        ...currentSpec,
        ...nextSpec,
        params: { ...currentSpec.params, ...nextSpec.params },
      };
      const nextDepth = clamp(number(merged.depth, 50) / 100, 0, 1);
      if (!applyParams(merged.params, nextDepth, nextBpm, merged)) return false;
      const additive =
        spec.name === "Reverb" &&
        merged.params["Mix Mode"] &&
        merged.params["Mix Mode"] !== "Wet Mix";
      smooth(dry.gain, active ? (additive ? 1 : 1 - nextDepth) : 1);
      smooth(wet.gain, active ? nextDepth : 0);
      currentSpec = merged;
      return true;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const source of sources) source.stop();
      for (const n of nodes) n.disconnect();
    },
  };
}
