// Observed labels with independently selected operational bounds. These are NOT
// verified vendor ranges/defaults or a complete vendor enum catalog.
const c = (name, min, max, value, step = 1) => ({
  name,
  min,
  max,
  value,
  step,
  observedLabel: true,
  rangeStatus: "independent proposed range",
  defaultStatus: "independent starting value, not verified vendor default",
});
export const observedControlAdapters = {
  Echo: [
    c("Feedback", 0, 90, 80),
    c("HPF", 20, 18000, 20, 10),
    c("Drive", 0, 100, 0),
    c("Beat Modify", 0.125, 4, 1, 0.125),
  ],
  "Low Cut Echo": [
    c("Feedback", 0, 90, 60),
    c("HPF", 20, 18000, 300, 10),
    c("Drive", 0, 100, 25),
    c("Beat Modify", 0.125, 4, 1, 0.125),
  ],
  "Version Echo": [
    c("Feedback", 0, 90, 90),
    c("BPF", 0, 100, 0),
    c("Drive", 0, 100, 50),
    c("Beat Modify", 0.125, 4, 0.75, 0.125),
  ],
  "Ping Pong Delay": [
    c("Feedback", 0, 90, 60),
    c("HPF", 20, 18000, 20, 10),
    c("Width", 0, 100, 100),
    c("Beat Modify", 0.125, 4, 1, 0.125),
  ],
  "Bit Crush": [
    c("Bit Depth", 2, 16, 4, 0.1),
    c("Downsampling", 200, 48000, 1320, 10),
    c("Character", 0, 100, 100),
    c("Low Drive", 0, 100, 50),
  ],
  "Lo-Fi Crush": [
    c("Bit Depth", 2, 16, 5.08, 0.1),
    c("Downsampling", 200, 48000, 10100, 10),
    c("Character", 0, 100, 72),
    c("Low Drive", 0, 100, 66),
  ],
  "Lo-Fi Warmth": [
    c("Bit Depth", 2, 16, 6, 0.1),
    c("Downsampling", 200, 48000, 44100, 10),
    c("Character", 0, 100, 100),
    c("Low Drive", 0, 100, 100),
  ],
  "Sizzle Crush": [
    c("Bit Depth", 2, 16, 6, 0.1),
    c("Downsampling", 200, 48000, 8000, 10),
    c("Character", 0, 100, 100),
    c("Low Drive", 0, 100, 50),
  ],
  HPF: [
    c("Resonance", 0.1, 12, 1.77, 0.1),
    c("Slope", 6, 48, 12, 6),
    c("Min Freq", 20, 2000, 40, 10),
    c("Max Freq", 2000, 20000, 10000, 100),
  ],
  "Combo Filter": [
    c("Resonance", 0.1, 12, 1.77, 0.1),
    c("Slope", 6, 48, 18, 6),
    c("Min Freq", 20, 2000, 200, 10),
    c("Max Freq", 2000, 20000, 10000, 100),
  ],
};
// Enum values below are observed examples, not a claim that the vendor list is complete.
const mixMode = (value) => ({
  name: "Mix Mode",
  value,
  options: ["Wet Mix", "Send"],
  observedLabel: true,
  rangeStatus: "observed examples; catalog incomplete",
  defaultStatus: "independent starting mode",
});
for (const [name, decay, contour, width, mode] of [
  ["Bright Reverb", 1.5, 25, 155, "Wet Mix"],
  ["Empty Mall Verb", 0.299, 0, 200, "Wet Mix"],
  ["Epic Reverb", 5, -20, 100, "Send"],
  ["Next Door Verb", 0.31, -100, 166, "Wet Mix"],
])
  observedControlAdapters[name] = [
    c("Decay", 0.1, 10, decay, 0.1),
    c("Contour", -100, 100, contour),
    c("Width", 0, 200, width),
    mixMode(mode),
  ];
const shape = {
  name: "LFO Shape",
  value: "Sine",
  options: ["Sine", "Triangle", "Square", "Saw"],
  observedLabel: true,
  rangeStatus:
    "Sine observed; other supported shapes are independent proposals, vendor catalog unknown",
};
for (const name of ["Chorus Basic", "Chorus Quad"])
  observedControlAdapters[name] = [
    c("Feedback", 0, 85, 0),
    c("Delay", 1, 40, 5, 0.1),
    c("LFO Depth", 0, 100, 50),
    c("Rate", 0.125, 16, 4, 0.125),
  ];
observedControlAdapters.Flanger = [
  c("Feedback", 0, 90, 83),
  c("Pitch", 0.05, 20, 0.2, 0.05),
  c("LFO Depth", 0, 100, 17),
  c("Beat Modify", 0.125, 4, 4, 0.125),
];
observedControlAdapters.Phaser = [
  c("Feedback", 0, 90, 85),
  c("Pitch", 40, 8000, 2000, 20),
  c("LFO Depth", 0, 100, 60),
  c("Beat Modify", 0.125, 4, 4, 0.125),
];
observedControlAdapters["LFO Filter"] = [
  c("Resonance", 0.1, 12, 1.41, 0.1),
  c("LFO Depth", 0, 100, 50),
  { ...shape },
  c("Beat Modify", 0.125, 4, 1, 0.125),
];
observedControlAdapters.Tremolo = [
  { ...shape },
  c("Skew", 5, 95, 50),
  c("Stereo", -100, 100, 0),
  c("Beat Modify", 0.125, 4, 0.25, 0.125),
];
for (const [name, stereo] of [
  ["Transform", 0],
  ["Pansformer", -100],
])
  observedControlAdapters[name] = [
    c("Noise", 0, 100, 50),
    c("Skew", 5, 95, 50),
    c("Stereo", -100, 100, stereo),
    c("Beat Modify", 0.125, 4, 0.25, 0.125),
  ];
for (const [name, feedback] of [
  ["Echo Out", 82],
  ["Clean Echo Out", 90],
])
  observedControlAdapters[name] = [
    c("Max Feedback", 0, 95, feedback),
    c("Filter", 0, 100, 0),
    c("Echo Level", 0, 100, 70),
    c("Beat Modify", 0.125, 4, 1, 0.125),
  ];
// Only the named starting option was observed unless stated otherwise. Additional
// modes are independent operating choices, never a vendor enum inventory.
const mode = (name, value, additional) => ({
  name, value, options: [value, ...additional], observedLabel: true,
  rangeStatus: `${value} observed; additional options independently designed; vendor catalog unknown`,
  defaultStatus: "observed session value used as independent starting mode",
});
observedControlAdapters["Multi Tap Delay"] = [mode("Pattern", "Shreds", ["Even", "Dotted"]), c("Feedback", 0, 90, 50), c("Filter", 0, 100, 20), c("Beat Modify", .125, 4, 1, .125)];
observedControlAdapters["Spiral Echo"] = [c("Speed", -100, 100, 0), c("Low Bypass", 20, 2000, 20, 10), c("High Bypass", 2000, 20000, 20000, 100), c("Beat Modify", .125, 4, 1, .125)];
observedControlAdapters.Distortion = [mode("Type", "Smooth Drive", ["Hard Clip", "Foldback"]), c("Drive", 0, 100, 50), c("Character", 0, 100, 50), c("Tone", -24, 24, 0, .5)];
observedControlAdapters["Drive Filter"] = [c("Resonance", .1, 12, 1.77, .1), c("Drive", 0, 100, 50), c("Slope", 6, 48, 12, 6), mode("Type", "Light Sat.", ["Hard Clip", "Warm"] )];
for (const [name, frequency, type, direction] of [
  ["Infinity Filter", 700, "Peak II", 50], ["Falling Flanger", 212, "Octaves I", -7], ["Infinity Flanger", 800, "Omega", 50],
]) observedControlAdapters[name] = [c("Centre Freq.", 40, 8000, frequency, 10), mode("Type", type, ["Wide", "Narrow"]), c("Direction", -100, 100, direction), c("Beat Modify", .125, 4, 1, .125)];
for (const name of ["Repeater", "Stutter Repeater", "Roll", "Slip Roll", "Stutter Roll"]) {
  const repeat = name.includes("Repeater");
  observedControlAdapters[name] = [repeat ? c("Mix", 0, 100, 70) : c("Repeats", 1, 8, 1), c("Shreds", 0, 100, name === "Stutter Repeater" ? 100 : 0), c("Range", .125, 8, name === "Stutter Repeater" ? 2 : 1, .125), c("Beat Modify", .125, 4, name.startsWith("Stutter") ? .25 : 1, .125)];
}
for (const [name, retrigger, range] of [["Retro Halftime", "On", 2], ["Stretch", "Off", 4]])
  observedControlAdapters[name] = [mode("Retrigger", retrigger, [retrigger === "On" ? "Off" : "On"]), c("Mix", 0, 100, 100), c("Range", 1, 8, range, .25), c("Grains", 10, 150, 90)];
for (const [name, modifier] of [["Spiral", 1], ["Pulse Spiral", .5]])
  observedControlAdapters[name] = [c("Feedback", 0, 90, 70), c("Filter", 0, 100, 0), c("Slide Rate", -100, 100, 50), c("Beat Modify", .125, 4, modifier, .125)];
for (const [name, feedback, modifier] of [["Brake Echo", 70, 1], ["Short Brake Echo", 66, .375]])
  observedControlAdapters[name] = [c("Feedback", 0, 90, feedback), c("Stop Time", 25, 800, 200, 25), c("Stop Curve", -1, 1, name === "Brake Echo" ? -.3 : 0, .05), c("Beat Modify", .125, 4, modifier, .125)];
observedControlAdapters["Combo Fade Echo"] = [c("Feedback", 0, 90, 65), c("Stop Time", 25, 800, 200, 25), c("Drive", 0, 100, 25), c("Beat Modify", .125, 4, 1, .125)];
observedControlAdapters.Braker = [c("Mix", 0, 100, 100), c("Curve", -1, 1, -.3, .05), mode("Mode", "Vinyl", ["Stretch"]), c("Beat Modify", .125, 4, 2, .125)];
for (const [name, time, curve, spin, selected] of [["Brake Rewind", 2, .5, 2, "Vinyl"], ["Epic Stretch Rewind", 8, -1, 5, "Stretch"], ["Turntable Brake", 2, 0, 0, "Vinyl"]])
  observedControlAdapters[name] = [c("Stop Time", .25, 12, time, .25), c("Curve", -1, 1, curve, .05), c("Spinback", 0, 12, spin, .1), mode("Mode", selected, [selected === "Vinyl" ? "Stretch" : "Vinyl"])];
for (const [name, feedback, filter, roll, modifier] of [["Clean Rollout", 10, 19, 10, 2], ["Roll Out", 40, 30, 7, 4], ["Slow Roll Out", 40, 0, 10, 8]])
  observedControlAdapters[name] = [c("Echo/Feedback", 0, 90, feedback), c("Filter", 0, 100, filter), c("Roll", .25, 16, roll, .25), c("Beat Modify", .125, 8, modifier, .125)];
for (const [name, decay, contour, width, selected] of [["Vast Reverb", 75, -20, 100, "Send+Mix"], ["Vast Verb Drop", 85, 63, 145, "Send"]])
  observedControlAdapters[name] = [{...c("Decay", 0, 100, decay), unit: "%", mappingStatus: "independent exponential percentage-to-seconds mapping"}, c("Contour", -100, 100, contour), c("Width", 0, 200, width), {...mixMode(selected), options: ["Wet Mix", "Send", "Send+Mix"], rangeStatus: "three observed examples across reverb strips; vendor catalog incomplete"}];
observedControlAdapters["Epic Reverb Drop"] = [{...c("Decay", 0, 100, 85), unit: "%", mappingStatus: "independent exponential percentage-to-seconds mapping"}, c("Contour", -100, 100, 0), c("Width", 0, 200, 100), c("Drop Range", 0, 36, 24, .5)];
for (const [name, timbre, ambience, direction, modifier] of [["Infinity Tone", 50, 90, 50, 1], ["Space Invader", 0, 100, -100, .125]])
  observedControlAdapters[name] = [c("Timbre", 0, 100, timbre), c("Ambience", 0, 100, ambience), c("Direction", -100, 100, direction), c("Beat Modify", .125, 4, modifier, .125)];
export function parseBeatModifier(value, fallback = 1) {
  const text = String(value ?? fallback),
    match = text.match(/^\s*([\d.]+)(?:\s*\/\s*([\d.]+))?/);
  if (!match) return fallback;
  let result = Number(match[1]) / (Number(match[2]) || 1);
  if (/dotted/i.test(text)) result *= 1.5;
  else if (/triplet/i.test(text)) result *= 2 / 3;
  return Number.isFinite(result) && result > 0 ? result : fallback;
}
export function parseObservedControl(name, value, fallback) {
  if (/lfo shape/i.test(name))
    return ["Sine", "Triangle", "Square", "Saw"].includes(String(value))
      ? String(value)
      : fallback;
  if (/^(type|mode|pattern|retrigger)$/i.test(name)) return String(value);
  if (/mix mode/i.test(name))
    return ["Wet Mix", "Send", "Send+Mix"].includes(String(value))
      ? String(value)
      : fallback;
  const n = parseFloat(value);
  if (!Number.isFinite(n)) return fallback;
  if (/^pitch$/i.test(name)) return n * (/khz/i.test(String(value)) ? 1000 : 1);
  if (/^spinback$/i.test(name)) return n * (/ms/i.test(String(value)) ? .001 : 1);
  if (/^decay$/i.test(name)) return n * (/ms/i.test(String(value)) ? 0.001 : 1);
  if (/beat modify/i.test(name)) return parseBeatModifier(value, fallback);
  if (/downsampling|hpf|min freq|max freq|centre freq|low bypass|high bypass/i.test(name))
    return n * (/khz/i.test(String(value)) ? 1000 : 1);
  return n;
}
