import {
  observedControlAdapters,
  parseObservedControl,
  parseBeatModifier,
} from "./observed-fx-control-adapters.js";
// Independent DSP designs. Names identify parity targets, not vendor algorithms.
// Pure JavaScript kernel shared by AudioWorklet and deterministic signal tests.
const TAU = Math.PI * 2;
const MULTITAP_PATTERNS = {
  Shreds: [1, 1.5, 2.25],
  Even: [1, 2, 3],
  Dotted: [.75, 1.5, 2.25],
};
const MULTITAP_WEIGHT_SUM = 1 + .65 + .4;
function lfoValue(shape, phase) {
  const p = ((phase % 1) + 1) % 1;
  switch (shape) {
    case "Triangle":
      return 1 - 4 * Math.abs(p - 0.5);
    case "Square":
      return p < 0.5 ? 1 : -1;
    case "Saw":
      return 2 * p - 1;
    default:
      return Math.sin(TAU * p);
  }
}
function saturate(x, drive, type = "Smooth Drive", character = 50) {
  const gain = 1 + drive / 8, shape = clamp(character / 100, 0, 1), z = x * gain;
  if (type === "Hard Clip") return clamp(z * (0.5 + shape), -1, 1);
  if (type === "Foldback") return Math.asin(Math.sin(z * (1 + shape * 2))) * 2 / Math.PI;
  if (type === "Warm") return Math.tanh(z + shape * z * z * .2) / Math.tanh(gain);
  return Math.tanh(z * (.5 + shape)) / Math.tanh(gain * (.5 + shape));
}
function skewPhase(phase, skew) {
  const p = ((phase % 1) + 1) % 1,
    s = clamp(skew, 0.05, 0.95);
  return p < s ? p / (2 * s) : 0.5 + (p - s) / (2 * (1 - s));
}

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const num = (v, fallback) =>
  Number.isFinite(parseFloat(v)) ? parseFloat(v) : fallback;
const beat = (v) => {
  const [a, b] = String(v ?? "1/2")
    .split("/")
    .map(Number);
  return Number.isFinite(a) ? a / (b || 1) : 0.5;
};
const control = (name, min, max, value, step = 1) => ({
  name,
  min,
  max,
  value,
  step,
});
const commonDelay = [
  control("Feedback", 0, 90, 45),
  control("Tone", 100, 18000, 6000, 100),
];
const modulation = [
  control("Rate", 0.05, 20, 1, 0.05),
  control("Mod Depth", 0, 100, 65),
  control("Feedback", 0, 85, 35),
];
const loopControls = [
  control("Length", 0.125, 8, 1, 0.125),
  control("Gate", 5, 100, 60),
  control("Speed", 0.25, 2, 1, 0.05),
];
const outControls = [
  control("Duration", 0.1, 8, 2, 0.1),
  control("Feedback", 0, 90, 55),
  control("Curve", 0.25, 4, 1, 0.05),
];
const reverbControls = [
  control("Decay", 0.1, 10, 3, 0.1),
  control("Tone", 200, 18000, 6000, 100),
  control("Width", 0, 100, 100),
];
export const extendedEffectDefinitions = {
  Echo: ["delay", { damp: 6500 }, commonDelay],
  "Low Cut Echo": [
    "delay",
    { highpass: 900, damp: 11000 },
    [...commonDelay, control("Low Cut", 20, 4000, 900, 20)],
  ],
  "Multi Tap Delay": [
    "multitap",
    {},
    [...commonDelay, control("Tap Spread", 0.25, 2, 1, 0.05)],
  ],
  "Ping Pong Delay": [
    "pingpong",
    {},
    [...commonDelay, control("Width", 0, 100, 100)],
  ],
  "Spiral Echo": [
    "spiralecho",
    {},
    [...commonDelay, control("Pitch", -12, 12, 4, 0.1)],
  ],
  "Version Echo": [
    "delay",
    { drive: 3, damp: 3200, highpass: 180 },
    [...commonDelay, control("Drive", 0, 100, 40)],
  ],
  "Bit Crush": [
    "crush",
    { bits: 6, hold: 4 },
    [control("Bits", 2, 16, 6), control("Reduction", 1, 64, 4)],
  ],
  Distortion: [
    "distortion",
    {},
    [control("Drive", 0, 100, 50), control("Tone", 200, 18000, 12000, 100)],
  ],
  "Lo-Fi Crush": [
    "crush",
    { bits: 5, hold: 8, lowpass: 4000 },
    [
      control("Bits", 2, 16, 5),
      control("Reduction", 1, 64, 8),
      control("Tone", 200, 18000, 4000, 100),
    ],
  ],
  "Lo-Fi Warmth": [
    "warmth",
    {},
    [
      control("Drive", 0, 100, 35),
      control("Wow", 0, 100, 35),
      control("Tone", 200, 18000, 5000, 100),
    ],
  ],
  "Sizzle Crush": [
    "crush",
    { bits: 4, hold: 3, sizzle: true },
    [
      control("Bits", 2, 16, 4),
      control("Reduction", 1, 64, 3),
      control("Sizzle", 0, 100, 70),
    ],
  ],
  "Combo Filter": [
    "filter",
    { combo: true },
    [
      control("Position", -100, 100, -50),
      control("Resonance", 0.1, 12, 1, 0.1),
    ],
  ],
  "Drive Filter": [
    "filter",
    { drive: true },
    [
      control("Cutoff", 40, 18000, 1200, 10),
      control("Resonance", 0.1, 12, 2, 0.1),
      control("Drive", 0, 100, 50),
    ],
  ],
  HPF: [
    "filter",
    { hp: true },
    [
      control("Cutoff", 20, 18000, 1000, 10),
      control("Resonance", 0.1, 12, 0.7, 0.1),
    ],
  ],
  "Infinity Filter": [
    "infinityfilter",
    {},
    [
      control("Rate", 0.05, 8, 0.5, 0.05),
      control("Direction", -1, 1, 1, 2),
      control("Resonance", 0.1, 12, 4, 0.1),
    ],
  ],
  "LFO Filter": [
    "filter",
    { lfo: true },
    [
      control("Cutoff", 40, 18000, 1800, 10),
      control("Rate", 0.05, 20, 1, 0.05),
      control("Mod Depth", 0, 100, 80),
      control("Resonance", 0.1, 12, 2, 0.1),
    ],
  ],
  Repeater: ["loop", { repeat: true }, loopControls],
  "Retro Halftime": [
    "loop",
    { half: true },
    [
      control("Length", 0.125, 8, 2, 0.125),
      control("Pitch Lock", 0, 1, 1),
      control("Speed", 0.25, 1, 0.5, 0.05),
    ],
  ],
  Roll: ["loop", { roll: true }, loopControls],
  "Slip Roll": ["loop", { slip: true }, loopControls],
  Stretch: [
    "loop",
    { stretch: true },
    [
      control("Length", 0.125, 8, 2, 0.125),
      control("Stretch", 1, 8, 3, 0.25),
      control("Grain", 10, 150, 50, 1),
    ],
  ],
  "Stutter Repeater": ["loop", { repeat: true, stutter: true }, loopControls],
  "Stutter Roll": [
    "loop",
    { roll: true, stutter: true },
    [...loopControls, control("Pulses", 1, 8, 4)],
  ],
  "Chorus Basic": ["chorus", { voices: 2 }, modulation],
  "Chorus Quad": ["chorus", { voices: 4 }, modulation],
  "Falling Flanger": ["flanger", { falling: true }, modulation],
  Flanger: ["flanger", {}, modulation],
  "Infinity Flanger": [
    "flanger",
    { infinity: true },
    [...modulation, control("Direction", -1, 1, 1, 2)],
  ],
  Pansformer: [
    "pan",
    {},
    [
      control("Rate", 0.05, 20, 2, 0.05),
      control("Gate", 5, 95, 70),
      control("Width", 0, 100, 100),
    ],
  ],
  Phaser: ["phaser", {}, [...modulation, control("Stages", 2, 12, 6, 2)]],
  "Pulse Spiral": [
    "spiral",
    { pulse: true },
    [
      control("Pitch", -24, 24, 12),
      control("Rate", 0.05, 8, 1, 0.05),
      control("Gate", 5, 100, 60),
    ],
  ],
  Spiral: [
    "spiral",
    {},
    [control("Pitch", -24, 24, 12), control("Rate", 0.05, 8, 0.5, 0.05)],
  ],
  Transform: [
    "gate",
    {},
    [control("Rate", 0.05, 20, 2, 0.05), control("Gate", 5, 95, 50)],
  ],
  Tremolo: [
    "tremolo",
    {},
    [control("Rate", 0.05, 20, 2, 0.05), control("Mod Depth", 0, 100, 100)],
  ],
  "Brake Echo": ["out", { brake: true, echo: true }, outControls],
  "Brake Rewind": ["out", { brake: true, rewind: true }, outControls],
  Braker: ["out", { brake: true }, outControls],
  "Clean Echo Out": ["out", { echo: true, clean: true }, outControls],
  "Clean Rollout": ["out", { roll: true, clean: true }, outControls],
  "Combo Fade Echo": ["out", { echo: true, combo: true }, outControls],
  "Echo Out": ["out", { echo: true }, outControls],
  "Epic Stretch Rewind": ["out", { stretch: true, rewind: true }, outControls],
  "Roll Out": ["out", { roll: true, accelerate: true }, outControls],
  "Short Brake Echo": [
    "out",
    { brake: true, echo: true, short: true },
    outControls,
  ],
  "Slow Roll Out": ["out", { roll: true, slow: true }, outControls],
  "Turntable Brake": ["out", { brake: true, vinyl: true }, outControls],
  "Bright Reverb": ["reverb", { tone: 14000, decay: 2 }, reverbControls],
  "Empty Mall Verb": [
    "reverb",
    { mall: true, tone: 5000, decay: 4 },
    reverbControls,
  ],
  "Epic Reverb": ["reverb", { tone: 7000, decay: 5 }, reverbControls],
  "Epic Reverb Drop": [
    "reverb",
    { drop: true, tone: 7000, decay: 5 },
    reverbControls,
  ],
  "Next Door Verb": ["reverb", { tone: 800, decay: 2.5 }, reverbControls],
  "Vast Reverb": ["reverb", { tone: 4000, decay: 8 }, reverbControls],
  "Vast Verb Drop": [
    "reverb",
    { drop: true, tone: 4000, decay: 8 },
    reverbControls,
  ],
  "Infinity Tone": [
    "tone",
    {},
    [
      control("Frequency", 50, 1000, 110),
      control("Rate", 0.05, 8, 0.3, 0.05),
      control("Direction", -1, 1, 1, 2),
    ],
  ],
  "Space Invader": [
    "invader",
    {},
    [
      control("Frequency", 50, 2000, 220),
      control("Rate", 0.05, 20, 4, 0.05),
      control("Steps", 2, 8, 4),
    ],
  ],
  // These are separate Channel FX targets, not additions to the 59-name DJ-FX count.
  "Channel Filter": [
    "filter",
    { combo: true },
    [
      control("Position", -100, 100, -50),
      control("Resonance", 0.1, 12, 1, 0.1),
    ],
  ],
  "Channel Dub Echo": ["delay", { drive: 2, damp: 2800 }, commonDelay],
  "Channel Space": ["reverb", { tone: 8500, decay: 5 }, reverbControls],
  "Channel Noise": [
    "noise",
    {},
    [control("Color", 100, 16000, 4000, 100), control("Level", 0, 100, 20)],
  ],
};
// Do not expose controls that a given independent variant does not consume.
for (const [name, def] of Object.entries(extendedEffectDefinitions)) {
  const [kind, v] = def;
  if (kind === "out")
    def[2] = outControls.filter(
      (c) =>
        (c.name !== "Feedback" || v.echo) &&
        (!v.echo || v.brake || v.combo || c.name === "Feedback"),
    );
  if (kind === "loop" && !v.half && !v.stretch)
    def[2] = def[2].filter((c) => c.name !== "Gate" || v.stutter);
  if (kind === "delay" && v.damp && !v.drive && name === "Echo")
    def[2] = commonDelay;
}
export const extendedEffectNames = Object.keys(
  extendedEffectDefinitions,
).filter((n) => !n.startsWith("Channel "));
export const channelEffectNames = Object.keys(extendedEffectDefinitions).filter(
  (n) => n.startsWith("Channel "),
);
export function getExtendedEffectControls(name) {
  if (observedControlAdapters[name])
    return observedControlAdapters[name].map((c) => ({ ...c }));
  const def = extendedEffectDefinitions[name];
  if (!def) return [];
  return def[2].map((c) => ({
    ...c,
    value:
      c.name === "Decay" && def[1].decay
        ? def[1].decay
        : c.name === "Tone" && def[1].tone
          ? def[1].tone
          : c.value,
  }));
}
class Biquad {
  constructor() {
    this.z1 = 0;
    this.z2 = 0;
  }
  process(x, f, q, sr, type = "lowpass") {
    const w = (TAU * clamp(f, 15, sr * 0.45)) / sr,
      c = Math.cos(w),
      s = Math.sin(w),
      a = s / (2 * Math.max(0.1, q));
    let b0, b1, b2;
    if (type === "highpass") {
      b0 = (1 + c) / 2;
      b1 = -(1 + c);
      b2 = b0;
    } else if (type === "bandpass") {
      b0 = a;
      b1 = 0;
      b2 = -a;
    } else {
      b0 = (1 - c) / 2;
      b1 = 1 - c;
      b2 = b0;
    }
    const inv = 1 / (1 + a),
      a1 = -2 * c * inv,
      a2 = (1 - a) * inv;
    const y = b0 * inv * x + this.z1;
    this.z1 = b1 * inv * x - a1 * y + this.z2;
    this.z2 = b2 * inv * x - a2 * y;
    return y;
  }
}
export class ExtendedEffectKernel {
  constructor(spec, sampleRate = 48000, bpm = 120) {
    if (!extendedEffectDefinitions[spec.name])
      throw new Error(`Unknown extended effect: ${spec.name}`);
    this.sr = sampleRate;
    this.name = spec.name;
    this.spec = { ...spec, params: { ...spec.params } };
    [this.kind, this.variant] = extendedEffectDefinitions[spec.name];
    if (spec.name === "Lo-Fi Warmth") {
      this.kind = "crush";
      this.variant = { warmth: true, bits: 6, hold: 1, lowpass: 9000 };
    }
    this.p = Object.fromEntries(
      getExtendedEffectControls(spec.name).map((x) => [x.name, x.value]),
    );
    this.setParams(spec.params || {});
    this.syncObservedLoopParams();
    this.depth = spec.on === false ? 0 : clamp(num(spec.depth, 50) / 100, 0, 1);
    this.T = clamp(
      (60 / clamp(bpm, 20, 400)) *
        beat(spec.beat) *
        this.param("Beat Modify", 1),
      0.006,
      96,
    );
    this.bpm = clamp(bpm, 20, 400);
    this.size = Math.ceil(
      sampleRate *
        Math.max(
          12,
          this.delayHistorySeconds(),
          (this.param("Length", 1) * 60) / this.bpm + 0.2,
          this.kind === "out" ? this.outDuration() + this.param("Spinback", 0) + .2 : 0,
        ),
    );
    this.ring = [new Float32Array(this.size), new Float32Array(this.size)];
    this.feedbackRing = [
      new Float32Array(this.size),
      new Float32Array(this.size),
    ];
    this.n = 0;
    this.filters = Array.from({ length: 12 }, () => [
      new Biquad(),
      new Biquad(),
    ]);
    this.low = [0, 0];
    this.hold = [0, 0];
    this.crushLow = [0, 0];
    this.crushPhase = 1;
    this.ap = Array.from({ length: 12 }, () => [0, 0]);
    this.apIn = Array.from({ length: 12 }, () => [0, 0]);
    this.captureLength =
      clamp(
        ((this.param("Length", 1) * 60) / clamp(bpm, 20, 400)) * sampleRate,
        32,
        this.size - 2,
      ) | 0;
    if (this.variant.slip) {
      this.captureLength = Math.min(
        this.captureLength,
        Math.floor(this.T * this.sr),
      );
    }
    if (this.kind === "loop") this.recentRing = [new Float32Array(this.size), new Float32Array(this.size)];
    if (this.kind === "out" && this.variant.roll) {
      this.outCapture = [
        new Float32Array(Math.ceil(this.T * this.sr)),
        new Float32Array(Math.ceil(this.T * this.sr)),
      ];
      this.outCaptureLength = Math.floor(this.T * this.sr);
    }
    this.seed = 182713;
    this.phases = new Float64Array(8);
    this.pitchPhases = [0, 0];
    this.outRead = 0;
    this.loopRead = 0;
    this.revLengths = [
      0.0297, 0.0371, 0.0411, 0.0437, 0.0531, 0.0617, 0.0713, 0.0797,
    ].map(
      (x, i) =>
        Math.floor(x * sampleRate) * (this.variant.mall ? 2 : 1) + (i % 2),
    );
    this.revLines = this.revLengths.map((x) => new Float32Array(x));
    this.revPos = new Int32Array(8);
    this.revLow = new Float64Array(8);
  }
  update(spec, bpm = 120) {
    if (spec.name !== this.name)
      throw new Error("Changing effect type requires a new processor");
    const priorLength = this.param("Length", 1);
    const priorTime = this.T;
    const wasOn = this.spec.on !== false;
    this.spec = {
      ...this.spec,
      ...spec,
      params: { ...this.spec.params, ...spec.params },
    };
    this.setParams(spec.params || {});
    this.syncObservedLoopParams();
    this.targetDepth =
      this.spec.on === false ? 0 : clamp(num(this.spec.depth, 50) / 100, 0, 1);
    this.T = clamp(
      (60 / clamp(bpm, 20, 400)) *
        beat(this.spec.beat) *
        this.param("Beat Modify", 1),
      0.006,
      96,
    );
    this.bpm = clamp(bpm, 20, 400);
    this.ensureHistory(
      Math.max(
        12,
        this.delayHistorySeconds(),
        (this.param("Length", 1) * 60) / this.bpm + 0.2,
        this.kind === "out" ? this.outDuration() + this.param("Spinback", 0) + .2 : 0,
      ),
    );
    if (
      (!wasOn && this.spec.on !== false) ||
      (this.kind === "loop" && priorLength !== this.param("Length", 1))
    ) {
      this.n = 0;
      this.period = undefined;
      this.captureLength =
        clamp(
          ((this.param("Length", 1) * 60) / clamp(bpm, 20, 400)) * this.sr,
          32,
          this.size - 2,
        ) | 0;
      for (const a of [...this.ring, ...this.feedbackRing]) a.fill(0);
      this.capturePhaseStart = undefined;
      if (this.recentRing) for (const a of this.recentRing) a.fill(0);
    }
    if (this.variant.slip && priorTime !== this.T && this.n > 0) {
      const window = Math.max(
        1,
        Math.min(
          this.n,
          Math.floor(this.T * this.sr),
          Math.floor(
            ((this.param("Length", 1) * 60) / clamp(bpm, 20, 400)) * this.sr,
          ),
        ),
      );
      for (let c = 0; c < 2; c++)
        for (let i = 0; i < window; i++)
          this.ring[c][i] = this.read(this.recentRing, c, this.n - window + i);
      this.captureLength = window;
      this.capturePhaseStart = this.n;
    }
  }
  ensureHistory(seconds) {
    const nextSize = Math.ceil(this.sr * seconds);
    if (nextSize <= this.size) return;
    const previousSize = this.size;
    const grow = (pair) =>
      pair.map((old) => {
        const next = new Float32Array(nextSize);
        if (this.kind === "loop" && pair === this.ring) next.set(old);
        else
          for (let at = Math.max(0, this.n - previousSize); at < this.n; at++)
            next[at % nextSize] = old[at % previousSize];
        return next;
      });
    this.ring = grow(this.ring);
    this.feedbackRing = grow(this.feedbackRing);
    if (this.recentRing) this.recentRing = grow(this.recentRing);
    this.size = nextSize;
  }
  setParams(values) {
    const controls = [
      ...getExtendedEffectControls(this.name),
      ...extendedEffectDefinitions[this.name][2],
    ];
    const explicit = new Set();
    for (const [name, value] of Object.entries(values)) {
      const key =
        controls.find((c) => c.name.toUpperCase() === name.toUpperCase())
          ?.name || name;
      this.p[key] = parseObservedControl(key, value, this.p[key] ?? 0);
      explicit.add(key);
    }
    if (explicit.has("Max Feedback")) delete this.p.Feedback;
    if (explicit.has("Bit Depth")) delete this.p.Bits;
    if (explicit.has("Downsampling")) delete this.p.Reduction;
    if (explicit.has("Contour")) delete this.p.Tone;
    if (explicit.has("HPF")) delete this.p["Low Cut"];
    else if (explicit.has("Low Cut")) this.p.HPF = this.p["Low Cut"];
  }
  delayHistorySeconds() {
    if (this.kind !== "multitap") return this.T + .2;
    const pattern = MULTITAP_PATTERNS[this.p.Pattern] || MULTITAP_PATTERNS.Shreds,
      spread = this.param("Tap Spread", 1);
    return this.T * Math.max(pattern[0], pattern[1] * spread, pattern[2] * spread) + .2;
  }
  outDuration() {
    const v = this.variant, p = this.p;
    if (p.Duration !== undefined) return clamp(this.param("Duration", 2) * (v.short ? .25 : v.slow ? 2 : 1), .03, 30);
    const factor = p["Stop Time"] !== undefined ? this.param("Stop Time", 1) / (p["Stop Curve"] !== undefined || v.combo ? 100 : 1) : v.roll ? 8 : 1;
    return clamp(this.T * factor, .03, 30);
  }
  syncObservedLoopParams() {
    if (this.kind !== "loop") return;
    const legacy = this.spec.params || {};
    if (legacy.Length === undefined) this.p.Length = this.variant.half || this.variant.stretch ? 1 : this.param("Range", 1);
    if (legacy.Stretch === undefined && this.variant.stretch) this.p.Stretch = this.param("Range", 4);
    if (legacy.Speed === undefined && this.variant.half) this.p.Speed = 1 / this.param("Range", 2);
    if (legacy.Grain === undefined) this.p.Grain = this.param("Grains", 50);
  }
  param(key, fallback) {
    return num(this.p[key], fallback);
  }
  read(r, c, index) {
    if (index < 0) return 0;
    const j = Math.floor(index),
      f = index - j;
    return r[c][j % this.size] * (1 - f) + r[c][(j + 1) % this.size] * f;
  }
  past(c, delay, feedback = false) {
    return this.read(
      feedback ? this.feedbackRing : this.ring,
      c,
      this.n - Math.max(1, delay),
    );
  }
  captured(c, phase, len = this.captureLength) {
    const available = Math.min(this.n + 1, len);
    const idx = ((phase % available) + available) % available;
    return this.read(this.ring, c, idx);
  }
  // Overlapping constant-speed grains decouple captured-source position from pitch.
  grain(c, sourcePosition, pitch = 1, grainMs = 50, captureEnd = null) {
    const g = Math.max(128, (this.sr * grainMs) / 1000),
      hop = g / 2;
    let y = 0,
      w = 0;
    const k = Math.floor(this.n / hop);
    for (let j = k - 1; j <= k; j++) {
      const age = this.n - j * hop;
      if (age < 0 || age >= g) continue;
      const env = 0.5 - 0.5 * Math.cos((TAU * age) / g);
      let base =
        sourcePosition -
        age *
          (this.variant.half
            ? this.param("Speed", 0.5)
            : 1 / this.param("Stretch", 3));
      if (this.period > 0) base = Math.round(base / this.period) * this.period;
      const index = base + age * pitch;
      // Loops wrap their fragment. Exit grains read the finite absolute source
      // extent, so material after the first beat remains reachable on rewind.
      const sample = captureEnd === null
        ? this.captured(c, index)
        : index >= 0 && index < Math.min(this.n + 1, captureEnd)
          ? this.read(this.ring, c, index)
          : 0;
      y += sample * env;
      w += env;
    }
    return w ? y / w : 0;
  }
  pitchDelay(c, delay, ratio, feedback = false) {
    const window = 0.06 * this.sr,
      phase = (this.pitchPhases[c] =
        (((this.pitchPhases[c] + (1 - ratio) / window) % 1) + 1) % 1);
    let result = 0;
    for (let j = 0; j < 2; j++) {
      const ph = (phase + j * 0.5) % 1,
        weight = 0.5 - 0.5 * Math.cos(TAU * ph);
      result += this.past(c, delay + ph * window, feedback) * weight;
    }
    return result;
  }
  ambience(signal) {
    const amount = this.param("Ambience", 0) / 100;
    return signal.map((z, c) => {
      const tail = this.past(c, this.sr * (.071 + c * .023), true);
      this.feedbackRing[c][this.n % this.size] = z + tail * amount * .65;
      return z + tail * amount * .5;
    });
  }
  estimatePeriod() {
    // Period alignment prevents opposite-phase overlap cancellation on tonal material.
    // This is a compact granular approximation, not a transparent polyphonic stretcher.
    const samples = Math.min(1024, this.captureLength / 2) | 0,
      min = Math.max(8, Math.floor(this.sr / 1200)),
      max = Math.min(512, Math.floor(this.sr / 60));
    const correlations = new Float64Array(max + 2);
    for (let lag = min; lag <= max + 1; lag++) {
      let xy = 0,
        xx = 0,
        yy = 0;
      for (let i = 0; i < samples; i++) {
        const a = this.ring[0][i],
          b = this.ring[0][i + lag];
        xy += a * b;
        xx += a * a;
        yy += b * b;
      }
      correlations[lag] = xy / Math.max(1e-12, Math.sqrt(xx * yy));
      if (
        lag > min + 1 &&
        correlations[lag - 1] > 0.88 &&
        correlations[lag - 1] > correlations[lag - 2] &&
        correlations[lag - 1] > correlations[lag]
      ) {
        const a = correlations[lag - 2],
          b = correlations[lag - 1],
          c = correlations[lag],
          delta = (0.5 * (a - c)) / (a - 2 * b + c);
        return lag - 1 + clamp(delta, -0.5, 0.5);
      }
    }
    return 0;
  }
  process(inL, inR, outL, outR) {
    for (let i = 0; i < outL.length; i++) {
      const x = [inL[i] || 0, inR?.[i] ?? inL[i] ?? 0],
        idx = this.n % this.size;
      // Captured loop effects preserve their first full window; all other families use a rolling buffer.
      if (this.kind !== "loop" || this.n < this.captureLength) {
        this.ring[0][idx] = x[0];
        this.ring[1][idx] = x[1];
      }
      if (this.recentRing) {
        this.recentRing[0][idx] = x[0];
        this.recentRing[1][idx] = x[1];
      }
      if (this.outCapture && this.n < this.outCaptureLength) {
        this.outCapture[0][this.n] = x[0];
        this.outCapture[1][this.n] = x[1];
      }
      if (this.targetDepth !== undefined)
        this.depth +=
          (this.targetDepth - this.depth) *
          (1 - Math.exp(-1 / (this.sr * 0.005)));
      const wet = this.frame(x),
        d = this.depth;
      for (let c = 0; c < 2; c++) {
        const dryGain =
          this.kind === "reverb" && this.p["Mix Mode"] === "Send" ? 1 :
          this.kind === "reverb" && this.p["Mix Mode"] === "Send+Mix" ? 1 - d * .5 : 1 - d;
        const y = x[c] * dryGain + wet[c] * d;
        (c ? outR : outL)[i] = Number.isFinite(y) ? clamp(y, -4, 4) : 0;
      }
      this.n++;
    }
  }
  frame(x) {
    const sr = this.sr,
      t = this.n / sr,
      p = this.p,
      v = this.variant,
      T = this.T * sr,
      rate =
        this.kind === "chorus"
          ? this.bpm / (60 * this.param("Rate", 4))
          : this.p.Rate !== undefined
            ? this.param("Rate", 1)
            : this.p["Beat Modify"] !== undefined
              ? 1 / this.T
              : 1,
      phase = (t * rate) % 1;
    const fb = clamp(
        this.param("Feedback", this.param("Max Feedback", 45)) / 100,
        0,
        this.p["Max Feedback"] !== undefined ? 0.95 : 0.9,
      ),
      y = [0, 0];
    if (["delay", "pingpong", "multitap", "spiralecho"].includes(this.kind)) {
      for (let c = 0; c < 2; c++) {
        let z =
          this.kind === "spiralecho"
            ? this.pitchDelay(c, T, 2 ** (this.param("Pitch", this.param("Speed", 33.333) * .12) / 12), true)
            : this.past(c, T, true);
        if (this.kind === "multitap") {
          const pattern = MULTITAP_PATTERNS[p.Pattern] || MULTITAP_PATTERNS.Shreds, spread = this.param("Tap Spread", 1);
          // A convex tap mix bounds the feedback path below unity at90%.
          z = (this.past(c, T * pattern[0], true) + this.past(c, T * pattern[1] * spread, true) * .65 + this.past(c, T * pattern[2] * spread, true) * .4) / MULTITAP_WEIGHT_SUM;
        }
        if (v.highpass || this.p.HPF !== undefined)
          z = this.filters[0][c].process(
            z,
            this.param("HPF", this.param("Low Cut", v.highpass || 20)),
            0.707,
            sr,
            "highpass",
          );
        if (this.p.BPF !== undefined && this.p.BPF > 0)
          z = this.filters[2][c].process(
            z,
            300 + this.p.BPF * 40,
            0.3 + this.p.BPF / 15,
            sr,
            "bandpass",
          );
        const cutoff = this.param("Tone", this.kind === "multitap" ? 18000 * .012 ** (this.param("Filter", 20) / 100) : v.damp || 10000);
        z = this.filters[1][c].process(z, cutoff, 0.707, sr);
        y[c] = z;
      }
      for (let c = 0; c < 2; c++) {
        const input =
          this.kind === "pingpong" ? (c === 0 ? (x[0] + x[1]) * 0.5 : 0) : x[c];
        const back = this.kind === "pingpong" ? y[1 - c] : y[c];
        const driveAmount = this.param("Drive", v.drive ? v.drive * 10 : 0),
          drive = 1 + driveAmount / 20,
          signal = input + back * fb;
        this.feedbackRing[c][this.n % this.size] =
          driveAmount > 0
            ? Math.tanh(signal * drive) / Math.max(1, drive * 0.6)
            : signal;
      }
      if (this.kind === "pingpong") {
        const width = this.param("Width", 100) / 100,
          mid = (y[0] + y[1]) * 0.5;
        return y.map((z) => mid + (z - mid) * width);
      }
      if (this.kind === "spiralecho") {
        for (let c = 0; c < 2; c++) {
          const low = this.filters[4][c].process(x[c], this.param("Low Bypass", 20), .707, sr),
            high = this.filters[5][c].process(x[c], this.param("High Bypass", 20000), .707, sr, "highpass");
          // Bypass bands remain live; only the middle band enters the shifted return.
          y[c] = this.filters[6][c].process(y[c], this.param("Low Bypass", 20), .707, sr, "highpass");
          y[c] = this.filters[7][c].process(y[c], this.param("High Bypass", 20000), .707, sr) + low + high;
        }
      }
      return y;
    }
    if (this.kind === "crush") {
      const bits = clamp(
          this.param("Bits", this.param("Bit Depth", v.bits || 6)),
          2,
          16,
        ),
        levels = 2 ** bits;
      const downsample =
        this.p.Reduction !== undefined
          ? sr / Math.max(1, this.param("Reduction", 1))
          : clamp(this.param("Downsampling", sr / (v.hold || 1)), 20, sr);
      const refresh = this.crushPhase >= 1 - 1e-10;
      if (refresh) this.crushPhase = Math.max(0, this.crushPhase - 1);
      this.crushPhase += downsample / sr;
      const character = clamp(this.param("Character", 100) / 100, 0, 1),
        drive = this.param("Low Drive", 0) / 100;
      for (let c = 0; c < 2; c++) {
        this.crushLow[c] +=
          (1 - Math.exp((-TAU * 250) / sr)) * (x[c] - this.crushLow[c]);
        const low = this.crushLow[c],
          gain = 1 + drive * 8,
          driven =
            x[c] +
            (Math.tanh(low * gain) / Math.max(1, gain * 0.5) - low) * drive;
        if (refresh) {
          const quantized =
            Math.round(clamp(driven, -1, 1) * (levels / 2 - 1)) /
            (levels / 2 - 1);
          this.hold[c] = driven * (1 - character) + quantized * character;
        }
        let z = this.hold[c];
        if (v.lowpass)
          z = this.filters[0][c].process(
            z,
            this.param("Tone", v.lowpass),
            0.707,
            sr,
          );
        if (v.warmth) z = Math.tanh(z * 1.4) / 1.4;
        if (v.sizzle) {
          this.low[c] += 0.08 * (z - this.low[c]);
          z += (this.param("Sizzle", 70) / 100) * (z - this.low[c]) * 2;
        }
        y[c] = z;
      }
      return y;
    }
    if (this.kind === "distortion" || this.kind === "warmth") {
      for (let c = 0; c < 2; c++) {
        let z = x[c];
        if (this.kind === "warmth")
          z = this.past(
            c,
            sr *
              (0.012 +
                (this.param("Wow", 35) / 100) *
                  0.006 *
                  Math.sin(TAU * t * 0.7 + c * 0.4)),
          );
        z = saturate(z, this.param("Drive", 50), p.Type, this.param("Character", 50));
        const tone = this.param("Tone", this.kind === "warmth" ? 5000 : 0);
        if (Math.abs(tone) <= 24) {
          const low = this.filters[0][c].process(z, 1000, .707, sr), high = z - low;
          y[c] = low * 10 ** (-tone / 40) + high * 10 ** (tone / 40);
        } else y[c] = this.filters[0][c].process(z, tone, .707, sr);
      }
      return y;
    }
    if (this.kind === "filter") {
      const lo = this.param("Min Freq", 40),
        hi = Math.max(lo, this.param("Max Freq", 10000));
      let cutoff = this.param(
          "Cutoff",
          v.hp ? lo * (hi / lo) ** this.depth : 1200,
        ),
        type = v.hp ? "highpass" : "lowpass";
      if (v.combo) {
        const pos =
          this.p.Position !== undefined
            ? this.param("Position", -50) / 100
            : this.depth * 2 - 1;
        if (Math.abs(pos) < 0.001) return x;
        type = pos > 0 ? "highpass" : "lowpass";
        cutoff = pos > 0 ? lo * (hi / lo) ** pos : hi * (lo / hi) ** -pos;
      }
      if (v.lfo)
        cutoff *=
          2 **
          ((lfoValue(this.p["LFO Shape"] || "Sine", phase) *
            this.param("Mod Depth", this.param("LFO Depth", 80))) /
            25);
      const slope =
          this.p.Slope !== undefined
            ? clamp(Math.round(this.p.Slope / 6) * 6, 6, 48)
            : 12,
        pairs = Math.floor(slope / 12),
        single = slope % 12 >= 6;
      for (let c = 0; c < 2; c++) {
        let z = v.drive
          ? saturate(x[c], this.param("Drive", 50), p.Type || "Light Sat.", 50)
          : x[c];
        for (let stage = 0; stage < pairs; stage++)
          z = this.filters[stage][c].process(
            z,
            cutoff,
            this.param("Resonance", 1) / Math.max(1, pairs),
            sr,
            type,
          );
        if (single) {
          this.low[c] +=
            (1 - Math.exp((-TAU * clamp(cutoff, 15, sr * 0.45)) / sr)) *
            (z - this.low[c]);
          z = type === "highpass" ? z - this.low[c] : this.low[c];
        }
        y[c] = z;
      }
      return y;
    }
    if (this.kind === "infinityfilter") {
      for (let j = 0; j < 4; j++) {
        const ph = (((t * rate * this.param("Direction", 50) / 50 + j / 4) % 1) + 1) % 1,
          weight = Math.sin(Math.PI * ph) ** 2,
          f = this.param("Centre Freq.", 700) * 2 ** ((ph - .5) * 7), q = p.Type === "Wide" ? .5 : p.Type === "Narrow" ? 9 : 4;
        for (let c = 0; c < 2; c++)
          y[c] +=
            this.filters[j][c].process(
              x[c],
              f,
              this.param("Resonance", q),
              sr,
              "bandpass",
            ) *
            weight *
            0.65;
      }
      return y;
    }
    if (this.kind === "loop") {
      if (this.n < this.captureLength) return x;
      const stretchRatio = v.half || v.stretch ? this.param("Range", v.half ? 2 : 4) : 1,
        outputCycle = Math.max(1, Math.round(this.captureLength * stretchRatio));
      if (p.Retrigger === "On" && this.n > this.captureLength && (this.n - this.captureLength) % outputCycle === 0) {
        for (let c = 0; c < 2; c++) for (let j = 0; j < this.captureLength; j++) this.ring[c][j] = this.read(this.recentRing, c, this.n - this.captureLength + j);
        this.capturePhaseStart = this.n;
        this.period = undefined;
      }
      if ((v.stretch || v.half) && this.period === undefined)
        this.period = this.estimatePeriod();
      const elapsed = this.n - (this.capturePhaseStart ?? this.captureLength),
        len = this.captureLength,
        unit = Math.max(32, (v.roll || v.slip ? Math.min(len, T) : Math.min(len, T * 2)) / this.param("Repeats", 1)),
        shreds = clamp(this.param("Shreds", 0) / 100, 0, 1);
      for (let c = 0; c < 2; c++) {
        if (v.stretch || (v.half && this.param("Pitch Lock", 1) > 0)) {
          const speed = v.half
            ? this.param("Speed", 0.5)
            : 1 / this.param("Stretch", 3);
          y[c] = this.grain(c, elapsed * speed, 1, this.param("Grain", 50));
        } else {
          const speed = v.half
            ? this.param("Speed", 0.5)
            : this.param("Speed", 1);
          let position = elapsed * speed;
          const shredUnit = unit / (1 + Math.floor(shreds * 15));
          position = position % shredUnit;
          y[c] = this.captured(c, position, shredUnit);
        }
        if (v.repeat && !v.stutter)
          y[c] *= 0.85 + 0.15 * Math.cos((TAU * (elapsed % unit)) / unit);
        if (v.stutter || shreds > 0) {
          const gates = v.roll ? this.param("Pulses", 4) : 2 + Math.floor(shreds * 14),
            ph = ((elapsed / unit) * gates) % 1;
          y[c] *= ph < this.param("Gate", 100 - shreds * 70) / 100 ? 1 : 0;
        }
        const mix = clamp(this.param("Mix", 100) / 100, 0, 1);
        y[c] = x[c] * (1 - mix) + y[c] * mix;
      }
      return y;
    }
    if (this.kind === "chorus" || this.kind === "flanger") {
      for (let c = 0; c < 2; c++) {
        if (this.kind === "chorus") {
          for (let j = 0; j < v.voices; j++) {
            const ph = TAU * (phase + j / v.voices + c * 0.13),
              delay =
                sr *
                (this.param("Delay", 15) / 1000 +
                  j * 0.0007 +
                  (((this.param("Mod Depth", this.param("LFO Depth", 65)) /
                    100) *
                    this.param("Delay", 15)) /
                    1000) *
                    0.8 *
                    Math.sin(ph));
            y[c] += this.past(c, delay, true) / v.voices;
          }
        } else if (v.infinity || v.falling) {
          const count = v.infinity ? 3 : 2;
          for (let j = 0; j < count; j++) {
            let ph =
              (((t * rate * (this.param("Direction", v.falling ? -50 : 50) / 50) +
                j / count) %
                1) +
                1) %
              1;
            const weight = Math.sin(Math.PI * ph) ** 2;
            const delay =
              sr * ((1 / this.param("Centre Freq.", v.falling ? 212 : 800)) *
                (p.Type === "Wide" ? 4 : p.Type === "Narrow" ? .5 : 2) * (.1 + ph) * this.param("Mod Depth", 65) / 65);
            y[c] += (this.past(c, delay, true) * weight * 2) / count;
          }
        } else {
          const base = this.param("Pitch", 3) / 1000,
            mod = this.param("Mod Depth", this.param("LFO Depth", 65)) / 100;
          y[c] = this.past(
            c,
            sr * base * (1 + 0.95 * mod * Math.sin(TAU * phase + c * 0.4)),
            true,
          );
        }
        this.feedbackRing[c][this.n % this.size] = x[c] + y[c] * fb;
      }
      return y.map((z, c) => (this.kind === "flanger" ? (x[c] + z) * 0.5 : z));
    }
    if (this.kind === "phaser") {
      const stages = Math.round(clamp(this.param("Stages", 6), 2, 12)),
        f = clamp(
          this.param("Pitch", 800) *
            2 **
              ((Math.sin(TAU * phase) *
                this.param("Mod Depth", this.param("LFO Depth", 65))) /
                30),
          40,
          sr * 0.4,
        );
      const g = Math.tan((Math.PI * f) / sr),
        a = (1 - g) / (1 + g);
      for (let c = 0; c < 2; c++) {
        let z = x[c] + this.low[c] * fb;
        for (let j = 0; j < stages; j++) {
          const next = -a * z + this.apIn[j][c] + a * this.ap[j][c];
          this.apIn[j][c] = z;
          this.ap[j][c] = next;
          z = next;
        }
        this.low[c] = z;
        y[c] = (x[c] + z) * 0.5;
      }
      return y;
    }
    if (this.kind === "spiral") {
      const semitones = this.param("Pitch", this.param("Slide Rate", 50) * .24) * (0.25 + 0.75 * phase),
        ratio = 2 ** (semitones / 12);
      for (let c = 0; c < 2; c++) {
        const shifted = this.pitchDelay(c, sr * .01, ratio, true),
          filtered = this.filters[0][c].process(shifted, 18000 * .012 ** (this.param("Filter", 0) / 100), .707, sr);
        y[c] = filtered * (v.pulse ? (phase < this.param("Gate", 60) / 100 ? 1 : 0) : 1);
        this.feedbackRing[c][this.n % this.size] = x[c] + filtered * fb;
      }
      return y;
    }
    if (["gate", "tremolo", "pan"].includes(this.kind)) {
      const duty = this.param("Gate", this.param("Skew", 50)) / 100,
        stereo = this.param("Stereo", this.kind === "pan" ? -100 : 0) / 100;
      this.seed = (1664525 * this.seed + 1013904223) >>> 0;
      const noise = this.seed / 2147483648 - 1;
      for (let c = 0; c < 2; c++) {
        const ph = (((phase + c * stereo * 0.5) % 1) + 1) % 1;
        let gain;
        if (this.kind === "tremolo")
          gain =
            1 -
            (this.param("Mod Depth", 100) / 100) *
              (0.5 -
                0.5 *
                  lfoValue(this.p["LFO Shape"] || "Sine", skewPhase(ph, duty)));
        else gain = ph < duty ? 1 : 0;
        const signal =
          x[c] +
          ((noise * this.param("Noise", 0)) / 100) * Math.abs(x[c]) * 0.4;
        y[c] = signal * gain;
      }
      return y;
    }
    if (this.kind === "out") {
      const legacy = this.p.Duration !== undefined,
        duration = this.outDuration(),
        progress = clamp(t / duration, 0, 1),
        exponent = legacy ? Math.max(.1, this.param("Curve", 1)) : 2 ** this.param("Stop Curve", this.param("Curve", 0)),
        envelope = (1 - progress) ** exponent,
        cap = Math.max(32, Math.floor(T)), cutoff = this.n < cap,
        spin = this.param("Spinback", 0),
        spinProgress = clamp((t - duration) / Math.max(.001, spin), 0, 1),
        spinEnvelope = t >= duration && spin > 0 ? Math.min(1, (t - duration) / .01) * (1 - spinProgress) ** .5 : 0;
      for (let c = 0; c < 2; c++) {
        let z = x[c];
        if (v.brake || v.stretch) {
          let read = sr * duration / (exponent + 1) * (1 - (1 - progress) ** (exponent + 1));
          // Integrating the slowdown curve keeps source position continuous.
          const stretch = p.Mode ? p.Mode === "Stretch" : v.stretch;
          if (legacy) {
            read = sr * (t - t * t / (2 * duration));
            if (v.vinyl) read = sr * duration / 3 * (1 - (1 - progress) ** 3);
            if (v.rewind && progress > .5) read = sr * duration * .375 - (t - duration * .5) * sr * .75;
          }
          if (!legacy && t >= duration && spin > 0) read *= 1 - spinProgress;
          const gain = spinEnvelope > 0 ? spinEnvelope : envelope,
            captureEnd = sr * duration / (legacy ? 1 : exponent + 1);
          z = (stretch ? this.grain(c, Math.max(0, read), spinEnvelope > 0 ? -1 : 1, 80, captureEnd) : this.read(this.ring, c, Math.max(0, read))) * gain;
          const mix = clamp(this.param("Mix", 100) / 100, 0, 1);
          z = x[c] * (1 - mix) + z * mix;
        }
        if (v.roll) {
          const roll = this.param("Roll", 1),
            read = v.accelerate ? this.n * (1 + progress * roll) : v.slow ? duration * sr / roll * Math.log1p(t * roll / duration) : this.n * roll,
            length = this.outCaptureLength,
            position = ((read % length) + length) % length, index = Math.floor(position), frac = position - index;
          z = (this.outCapture[c][index] * (1 - frac) + this.outCapture[c][(index + 1) % length] * frac) * envelope;
          const echo = this.past(c, T, true), amount = this.param("Echo/Feedback", 0) / 100;
          this.feedbackRing[c][this.n % this.size] = z + echo * amount;
          z = this.filters[0][c].process(z + echo * amount, 18000 * .012 ** (this.param("Filter", 0) / 100), .707, sr);
        }
        if (v.echo) {
          const tail = this.past(c, T, true);
          let feed = v.brake ? z : cutoff ? x[c] : 0;
          if (v.combo) {
            feed = saturate(x[c] * envelope, this.param("Drive", 25));
            z = this.filters[0][c].process(tail, 200 + progress * 6000, .707, sr, "highpass");
          } else z = tail;
          if (p["Echo Level"] !== undefined) z = this.filters[3][c].process(z, 18000 * .012 ** (this.param("Filter", 0) / 100), .707, sr) * this.param("Echo Level", 70) / 100;
          this.feedbackRing[c][this.n % this.size] = v.clean ? feed + tail * fb : Math.tanh((feed + tail * fb) * 1.2) / 1.2;
        }
        y[c] = z;
      }
      return y;
    }
    if (this.kind === "reverb") {
      const percentageDecay = ["Vast Reverb", "Vast Verb Drop", "Epic Reverb Drop"].includes(this.name),
        decay = percentageDecay ? .15 * 2 ** (clamp(this.param("Decay", 85), 0, 100) / 12) : this.param("Decay", v.decay || 3),
        tone = this.param(
          "Tone",
          (v.tone || 6000) * 2 ** (this.param("Contour", 0) / 25),
        ),
        width = clamp(this.param("Width", 100) / 100, 0, 2);
      const live = v.drop && t > this.T ? 0 : 1,
        mono = (x[0] + x[1]) * 0.5 * live,
        alpha = 1 - Math.exp((-TAU * clamp(tone, 200, sr * 0.4)) / sr);
      let left = 0,
        right = 0;
      for (let j = 0; j < 8; j++) {
        const pos = this.revPos[j],
          line = this.revLines[j],
          z = line[pos];
        this.revLow[j] += alpha * (z - this.revLow[j]);
        const feedback = Math.pow(0.001, this.revLengths[j] / sr / decay);
        line[pos] = mono * 0.22 + this.revLow[j] * feedback;
        this.revPos[j] = (pos + 1) % line.length;
        left += z * (j % 2 ? 0.7 : 1);
        right += z * (j % 2 ? 1 : -0.7);
      }
      if (v.mall) {
        left += this.past(0, sr * 0.12) * 0.3 + this.past(0, sr * 0.23) * 0.2;
        right += this.past(1, sr * 0.18) * 0.3 + this.past(1, sr * 0.31) * 0.2;
      }
      const mid = (left + right) * 0.5;
      const result = [mid + (left - mid) * width, mid + (right - mid) * width];
      if (p["Drop Range"] !== undefined) for (let c = 0; c < 2; c++) {
        this.feedbackRing[c][this.n % this.size] = result[c];
        result[c] = this.pitchDelay(c, 1, 2 ** (-this.param("Drop Range", 24) * clamp(t / 2, 0, 1) / 12), true);
      }
      return result;
    }
    if (this.kind === "tone") {
      const env = Math.min(1, Math.abs(x[0]) + Math.abs(x[1]));
      this.low[0] += 0.002 * (env - this.low[0]);
      let z = 0;
      for (let j = 0; j < 6; j++) {
        const ph =
            (((t * rate * this.param("Direction", 50) / 50 + j / 6) % 1) + 1) % 1,
          f = this.param("Frequency", 55 * 2 ** (this.param("Timbre", 50) / 50)) * 2 ** (ph * 6);
        this.phases[j] = (this.phases[j] + (TAU * f) / sr) % TAU;
        z += (Math.sin(this.phases[j]) * Math.sin(Math.PI * ph) ** 2) / 3;
      }
      return this.ambience([z * this.low[0], z * this.low[0]]);
    }
    if (this.kind === "invader") {
      const steps = this.param("Steps", 4),
        motion = this.p.Frequency !== undefined ? phase : (((t * rate * this.param("Direction", -100) / 100) % 1) + 1) % 1,
        step = Math.floor(motion * steps),
        carrier = this.param("Frequency", 220 * 2 ** (this.param("Timbre", 0) / 25)) * 2 ** (step / steps);
      this.phases[0] = (this.phases[0] + (TAU * carrier) / sr) % TAU;
      const result = x.map((z) => z * Math.sin(this.phases[0]));
      return this.p.Frequency !== undefined ? result : this.ambience(result);
    }
    if (this.kind === "noise") {
      this.seed = (1664525 * this.seed + 1013904223) >>> 0;
      const z = ((this.seed / 2147483648 - 1) * this.param("Level", 20)) / 100;
      return [0, 1].map((c) =>
        this.filters[0][c].process(z, this.param("Color", 4000), 0.707, sr),
      );
    }
    return x;
  }
}
