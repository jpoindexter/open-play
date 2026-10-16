import assert from "node:assert/strict";
import fs from "node:fs";
import {
  ExtendedEffectKernel,
  getExtendedEffectControls,
} from "../prototype/extended-effects-kernel.js";
import {
  observedControlAdapters,
  parseBeatModifier,
} from "../prototype/observed-fx-control-adapters.js";
const sr = 24000,
  TAU = 2 * Math.PI;
const sine = (f, seconds = 2, level = 0.3) =>
  Float32Array.from(
    { length: sr * seconds },
    (_, n) => level * Math.sin((TAU * f * n) / sr),
  );
function render(name, params = {}, x = sine(440), depth = 100) {
  const k = new ExtendedEffectKernel(
      { name, on: true, depth, beat: "1/2", params },
      sr,
      120,
    ),
    a = new Float32Array(x.length),
    b = new Float32Array(x.length);
  k.process(x, x, a, b);
  return [a, b, k];
}
function amp(a, f, first = sr / 2, last = a.length) {
  let re = 0,
    im = 0;
  for (let n = first; n < last; n++) {
    re += a[n] * Math.cos((TAU * f * n) / sr);
    im += a[n] * Math.sin((TAU * f * n) / sr);
  }
  return (2 * Math.hypot(re, im)) / (last - first);
}
function diff(a, b) {
  let s = 0;
  for (let n = 0; n < a.length; n++) s += (a[n] - b[n]) ** 2;
  return Math.sqrt(s / a.length);
}
function rms(a) {
  return Math.sqrt(a.reduce((s, v) => s + v * v, 0) / a.length);
}
let passed = 0;
function test(name, fn) {
  const detail = fn();
  console.log("PASS", name, detail ?? "");
  passed++;
}
test("55 observed schemas expose exactly their four observed labels", () => {
  const observed = JSON.parse(
    fs.readFileSync(
      new URL("../docs/research/fx-observed-parameters.json", import.meta.url),
    ),
  );
  const norm = (s) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");
  for (const [name, controls] of Object.entries(observedControlAdapters)) {
    const source = observed.effects.find((e) => e.name === name);
    assert.deepEqual(
      controls.map((c) => norm(c.name)).sort(),
      source.parameters.map((p) => norm(p.label)).sort(),
    );
    assert(controls.every((c) => c.rangeStatus && c.observedLabel));
  }
  return (
    Object.keys(observedControlAdapters).length +
    " observed label schemas; vendor ranges not claimed"
  );
});
test("fraction/dotted/triplet beat modifiers alter actual echo timing", () => {
  assert.equal(parseBeatModifier("1/2 Dotted"), 0.75);
  assert.equal(parseBeatModifier("1 Triplet"), 2 / 3);
  const input = new Float32Array(sr * 2);
  input[0] = 0.5;
  for (const [modifier, seconds] of [
    ["1", 0.25],
    ["1/2 Dotted", 0.1875],
    ["1 Triplet", 1 / 6],
  ]) {
    const a = render(
      "Echo",
      { "Beat Modify": modifier, Feedback: 0, HPF: 20, Drive: 0 },
      input,
    )[0];
    let peak = 0;
    for (let i = 0; i < a.length; i++)
      if (Math.abs(a[i]) > Math.abs(a[peak])) peak = i;
    assert(Math.abs(peak / sr - seconds) < 0.001);
  }
});
test("echo HPF removes bass from delayed audio", () => {
  const x = Float32Array.from(
      { length: sr * 2 },
      (_, n) =>
        0.15 *
        (Math.sin((TAU * 100 * n) / sr) + Math.sin((TAU * 4000 * n) / sr)),
    ),
    a = render("Echo", { Feedback: 0, HPF: 1000, Drive: 0 }, x)[0];
  assert(amp(a, 4000) / amp(a, 100) > 30);
  return { low: amp(a, 100), high: amp(a, 4000) };
});
test("drive adds measurable harmonics independently of echo timing", () => {
  const x = sine(440, 2, 0.7),
    clean = render("Echo", { Feedback: 0, Drive: 0 }, x)[0],
    driven = render("Echo", { Feedback: 0, Drive: 100 }, x)[0];
  assert(amp(driven, 1320) > amp(clean, 1320) + 0.02);
});
test("downsampling uses sample-rate units and aliases unit strings", () => {
  const x = sine(440),
    a = render(
      "Bit Crush",
      {
        Downsampling: "1 kHz",
        "Bit Depth": 16,
        "Low Drive": 0,
        Character: 100,
      },
      x,
    )[0],
    b = render(
      "Bit Crush",
      { Downsampling: 1000, "Bit Depth": 16, "Low Drive": 0, Character: 100 },
      x,
    )[0];
  assert.equal(diff(a, b), 0);
  for (let i = 0; i < a.length - 24; i += 24)
    for (let j = 1; j < 24; j++) assert(a[i] === a[i + j]);
  return "24 held samples at24kHz /1kHz";
});
test("Character changes quantization strength instead of a label", () => {
  const x = Float32Array.from({ length: sr }, (_, n) => (n / sr) * 1.8 - 0.9),
    coarse = render(
      "Bit Crush",
      { "Bit Depth": 3, Downsampling: 48000, Character: 100, "Low Drive": 0 },
      x,
    )[0],
    smooth = render(
      "Bit Crush",
      { "Bit Depth": 3, Downsampling: 48000, Character: 0, "Low Drive": 0 },
      x,
    )[0];
  assert(new Set(coarse).size <= 8);
  assert(new Set(smooth).size > 1000);
});
test("Low Drive creates bass harmonics before quantization", () => {
  const x = sine(100, 2, 0.6),
    a = render(
      "Bit Crush",
      { "Bit Depth": 16, Downsampling: 48000, Character: 0, "Low Drive": 0 },
      x,
    )[0],
    b = render(
      "Bit Crush",
      { "Bit Depth": 16, Downsampling: 48000, Character: 0, "Low Drive": 100 },
      x,
    )[0];
  assert(amp(b, 300) > amp(a, 300) + 0.01);
});
test("HPF18dB slope falls between12dB and24dB response", () => {
  const x = sine(100, 2),
    levels = [6, 12, 18, 24].map((Slope) =>
      amp(render("HPF", { Cutoff: 1000, Resonance: 0.707, Slope }, x)[0], 100),
    );
  for (let i = 1; i < levels.length; i++)
    assert(levels[i] < levels[i - 1] * 0.2);
  return levels;
});
test("reverb width200 doubles side amplitude relative to100", () => {
  const x = new Float32Array(sr * 2);
  x[0] = 0.5;
  const [a, b] = render("Bright Reverb", { Width: 100 }, x),
    [c, d] = render("Bright Reverb", { Width: 200 }, x),
    side1 = Float32Array.from(a, (v, i) => v - b[i]),
    side2 = Float32Array.from(c, (v, i) => v - d[i]);
  assert(Math.abs(rms(side2) / rms(side1) - 2) < 1e-5);
});
test("reverb Send retains dry attack while Wet Mix replaces it", () => {
  const x = new Float32Array(sr).fill(0.2),
    wet = render("Epic Reverb", { "Mix Mode": "Wet Mix" }, x)[0],
    send = render("Epic Reverb", { "Mix Mode": "Send" }, x)[0];
  assert.equal(wet[0], 0);
  assert(Math.abs(send[0] - 0.2) < 1e-7);
});
test("millisecond reverb decay and kHz phaser pitch parse correctly", () => {
  const a = render("Empty Mall Verb", { Decay: "299 ms" })[0],
    b = render("Empty Mall Verb", { Decay: 0.299 })[0];
  assert.equal(diff(a, b), 0);
  const c = render("Phaser", { Pitch: "2.00 kHz" })[0],
    d = render("Phaser", { Pitch: 2000 })[0];
  assert.equal(diff(c, d), 0);
});
test("chorus Delay changes actual first arrival", () => {
  const x = new Float32Array(sr);
  x[0] = 0.4;
  const first = (delay) => {
    const a = render(
      "Chorus Basic",
      { Delay: delay, "LFO Depth": 0, Feedback: 0 },
      x,
    )[0];
    return a.findIndex((v) => Math.abs(v) > 1e-6) / sr;
  };
  assert(Math.abs(first(20) - first(5) - 0.015) < 0.0001);
});
test("LFO shapes produce different filter and tremolo trajectories", () => {
  for (const name of ["LFO Filter", "Tremolo"]) {
    const a = render(name, { "LFO Shape": "Sine" })[0],
      b = render(name, { "LFO Shape": "Square" })[0];
    assert(diff(a, b) > 0.02);
  }
});
test("Stereo moves transform gate timing independently per channel", () => {
  const x = new Float32Array(sr).fill(0.2),
    [a, b] = render(
      "Transform",
      { Noise: 0, Skew: 50, Stereo: 100, "Beat Modify": 1 },
      x,
    );
  assert(diff(a, b) > 0.1);
  for (let i = 0; i < sr; i++) assert(Math.abs(a[i] + b[i] - 0.2) < 1e-6);
});
test("Echo Out Max Feedback extends decay and Echo Level scales only captured output", () => {
  const x = new Float32Array(sr * 3);
  x[100] = 0.4;
  const low = render(
      "Clean Echo Out",
      { "Max Feedback": 20, "Echo Level": 100 },
      x,
    )[0],
    high = render(
      "Clean Echo Out",
      { "Max Feedback": 90, "Echo Level": 100 },
      x,
    )[0],
    half = render(
      "Clean Echo Out",
      { "Max Feedback": 90, "Echo Level": 50 },
      x,
    )[0];
  assert(rms(high.subarray(sr)) > rms(low.subarray(sr)) * 10);
  assert(Math.abs(rms(half) / rms(high) - 0.5) < 1e-6);
});
test("multitap patterns move impulse tap positions and beat modification scales them", () => {
  const x = new Float32Array(sr * 2); x[0] = .5;
  const peak = (pattern, modifier) => {
    const a = render("Multi Tap Delay", {Pattern: pattern, Feedback: 0, Filter: 0, "Beat Modify": modifier}, x)[0];
    return a.findIndex(v => Math.abs(v) > .05) / sr;
  };
  assert(Math.abs(peak("Even", 1) - .25) < .001);
  assert(Math.abs(peak("Dotted", 1) - .1875) < .001);
  assert(Math.abs(peak("Even", .5) - .125) < .001);
});
test("Spiral Echo bypass bands preserve live low and high input before delayed middle arrives", () => {
  const x = sine(100, 2), a = render("Spiral Echo", {"Low Bypass": 1000, "High Bypass": 10000}, x)[0], b = render("Spiral Echo", {"Low Bypass": 20, "High Bypass": 10000}, x)[0];
  assert(amp(a, 100, 1000, 5000) > amp(b, 100, 1000, 5000) * 10);
});
test("distortion topology and character change harmonic structure; dB tone tilts spectral balance", () => {
  const x = sine(440, 2, .5), a = render("Distortion", {Type: "Smooth Drive", Character: 0}, x)[0], b = render("Distortion", {Type: "Foldback", Character: 100}, x)[0];
  assert(diff(a,b) > .1);
  const highTone = sine(4000), source = Float32Array.from(sine(100), (v,i) => v + highTone[i]);
  const dark = render("Distortion", {Tone: -12, Drive: 0}, source)[0], bright = render("Distortion", {Tone: 12, Drive: 0}, source)[0];
  assert(amp(bright,4000) / amp(bright,100) > amp(dark,4000) / amp(dark,100) * 8);
});
test("infinity centers, sweep modes, directions and beat timing each alter rendered trajectories", () => {
  for (const name of ["Infinity Filter", "Infinity Flanger", "Falling Flanger"]) {
    for (const [key,a,b] of [["Centre Freq.",100,3000],["Type","Wide","Narrow"],["Direction",-80,80],["Beat Modify",.25,2]]) {
      assert(diff(render(name,{[key]:a})[0],render(name,{[key]:b})[0]) > .001, `${name}: ${key}`);
    }
  }
});
test("loop Mix zero preserves live input and Shreds create additional closed windows", () => {
  const x = Float32Array.from({length:sr*3},(_,i)=>.2 + .1*Math.sin(TAU*123*i/sr));
  assert(diff(render("Repeater",{Mix:0},x)[0],x) === 0);
  const a = render("Repeater",{Mix:100,Shreds:0},x)[0], b = render("Repeater",{Mix:100,Shreds:100},x)[0];
  const zeros = v => v.subarray(sr).filter(z => Math.abs(z)<1e-7).length;
  assert(zeros(b) > zeros(a) + sr/2);
});
test("roll Repeats shortens the captured marker period while Range changes capture duration", () => {
  const x = new Float32Array(sr*3); x[100] = .5;
  function peaks(repeats) { const a=render("Roll",{Repeats:repeats, Range:1},x)[0]; const p=[]; for(let i=sr;i<a.length;i++) if(a[i]>.4) p.push(i); return p; }
  const a=peaks(1),b=peaks(2);
  assert(a.length>2 && b.length>a.length*1.8);
  assert(Math.abs((a[1]-a[0])/(b[1]-b[0])-2)<.01);
  const a2=render("Repeater",{Range:.25},x)[2],b2=render("Repeater",{Range:2},x)[2];
  assert.equal(b2.captureLength/a2.captureLength,8);
});
test("granular Retrigger recaptures later source material and grains/range alter playback", () => {
  const x=Float32Array.from({length:sr*4},(_,i)=>.3*Math.sin(TAU*(i<sr?220:660)*i/sr));
  for(const name of ["Retro Halftime","Stretch"]) {
    const off=render(name,{Retrigger:"Off",Range:1},x)[0],on=render(name,{Retrigger:"On",Range:1},x)[0];
    assert(diff(off.subarray(sr*2),on.subarray(sr*2))>.05);
    assert(diff(render(name,{Grains:10},x)[0],render(name,{Grains:150},x)[0])>.001);
    assert(diff(render(name,{Range:1},x)[0],render(name,{Range:4},x)[0])>.001);
  }
});
test("spiral feedback creates a tail and filtering removes high-band energy", () => {
  const x=new Float32Array(sr*2); x.set(sine(3000,.1),0);
  for(const name of ["Spiral","Pulse Spiral"]) {
    const low=render(name,{Feedback:0},x)[0],high=render(name,{Feedback:85},x)[0];
    assert(rms(high.subarray(sr/2)) > rms(low.subarray(sr/2)) + .00001);
    const a=render(name,{Filter:0},sine(4000))[0],b=render(name,{Filter:100},sine(4000))[0];
    assert(rms(a)>rms(b)*2);
  }
});
test("stop time and stop curve alter braking while spinback extends reversed playback", () => {
  const x=sine(440,3);
  const short=render("Turntable Brake",{"Stop Time":1,Spinback:0},x)[0],long=render("Turntable Brake",{"Stop Time":4,Spinback:0},x)[0];
  assert(rms(short.subarray(sr/2))===0);
  assert(rms(long.subarray(sr/2,sr))>.001);
  assert(diff(render("Brake Echo",{"Stop Curve":-1},x)[0],render("Brake Echo",{"Stop Curve":1},x)[0])>.01);
  assert(rms(render("Brake Rewind",{"Stop Time":2,Spinback:2},x)[0].subarray(sr/2,sr))>.001);
});
test("roll exits reject later live input, use feedback tails and obey stop envelopes", () => {
  const x=sine(220,4), later=x.slice(); later.fill(0,sr*2);
  for(const name of ["Clean Rollout","Roll Out","Slow Roll Out"]) {
    const a=render(name,{"Beat Modify":.5},x)[0],b=render(name,{"Beat Modify":.5},later)[0];
    assert.equal(diff(a,b),0);
    assert(diff(render(name,{"Echo/Feedback":0},x)[0],render(name,{"Echo/Feedback":80},x)[0])>.01);
    assert(diff(render(name,{Roll:1},x)[0],render(name,{Roll:4},x)[0])>.01);
  }
});
test("percentage reverb decay extends measured tail; Drop Range transposes its return", () => {
  const x=new Float32Array(sr*4);x[0]=.5;
  for(const name of ["Vast Reverb","Vast Verb Drop","Epic Reverb Drop"]) {
    const low=render(name,{Decay:10,"Mix Mode":"Wet Mix"},x)[0],high=render(name,{Decay:90,"Mix Mode":"Wet Mix"},x)[0];
    assert(rms(high.subarray(sr))>rms(low.subarray(sr))*20);
  }
  assert(diff(render("Epic Reverb Drop",{"Drop Range":0},x)[0],render("Epic Reverb Drop",{"Drop Range":24},x)[0])>.0001);
});
test("tone controls change generated spectrum and ambience while silence remains silent", () => {
  for(const name of ["Infinity Tone","Space Invader"]) {
    for(const [key,a,b] of [["Timbre",0,100],["Ambience",0,100],["Direction",-100,100],["Beat Modify",.125,2]]) assert(diff(render(name,{[key]:a})[0],render(name,{[key]:b})[0])>.001, `${name}: ${key}`);
    assert(rms(render(name,{},new Float32Array(sr))[0])===0);
  }
});
test("spinback replays asymmetric source markers in reverse temporal order for its declared duration", () => {
  const x=new Float32Array(sr*3); x[Math.round(sr*.05)]=.25; x[Math.round(sr*.15)]=.75;
  const a=render("Brake Rewind",{"Stop Time":2,Curve:0,Spinback:2,Mode:"Vinyl"},x)[0];
  // Stop at .5s; integrated slowdown captured .25s of source. Two-second reverse
  // crosses the .15s marker at1.3s, then the .05s marker at2.1s.
  assert(Math.abs(a[Math.round(sr*1.3)])>.1);
  assert(Math.abs(a[Math.round(sr*2.1)])>.05);
  assert(rms(a.subarray(Math.round(sr*2.5)))===0);
});
test("long spinback retains its captured history and rejects later live markers", () => {
  const rate=4000, source=new Float32Array(rate*13); source.fill(.2,0,rate/2);
  const later=source.slice();later.fill(.9,rate*12);
  const run=input=>{const k=new ExtendedEffectKernel({name:"Brake Rewind",on:true,depth:100,beat:"1/2",params:{"Stop Time":2,Curve:0,Spinback:12,Mode:"Vinyl"}},rate,120),a=new Float32Array(input.length),b=new Float32Array(input.length);k.process(input,input,a,b);return a;};
  const a=run(source),b=run(later);
  assert.equal(diff(a,b),0);
  assert(rms(a.subarray(rate*12,rate*12.4))>.01);
});
test("multitap maximum feedback decays for45seconds without hidden internal gain growth", () => {
  const rate=4000, input=new Float32Array(rate*45);input.fill(.2,0,rate/20);
  for(const pattern of ["Shreds","Even","Dotted"]) {
    const k=new ExtendedEffectKernel({name:"Multi Tap Delay",on:true,depth:100,beat:"1/2",params:{Pattern:pattern,Feedback:90,Filter:0}},rate,120),a=new Float32Array(input.length),b=new Float32Array(input.length);
    k.process(input,input,a,b);
    assert(a.every(Number.isFinite));
    assert(rms(a.subarray(rate*35,rate*40)) < rms(a.subarray(rate*5,rate*10)) * .001, pattern);
    assert(Math.max(...k.feedbackRing[0].map(Math.abs)) < .001, `${pattern}: internal feedback must decay, not rely on output clipping`);
  }
});
test("multitap timing and pattern updates retain the longest24second tap like fresh construction", () => {
  const rate=1000, input=new Float32Array(rate*27);input[0]=.5;
  const original={name:"Multi Tap Delay",on:true,depth:100,beat:"4",params:{Pattern:"Shreds",Feedback:0,Filter:0,"Beat Modify":1}},
    final={...original,params:{...original.params,Pattern:"Even","Beat Modify":4}},
    updated=new ExtendedEffectKernel(original,rate,120),fresh=new ExtendedEffectKernel(final,rate,120);
  updated.update(final,120);
  const run=k=>{const a=new Float32Array(input.length),b=new Float32Array(input.length);k.process(input,input,a,b);return a;},a=run(updated),b=run(fresh);
  assert.equal(diff(a,b),0);
  assert(a[rate*24] > .05, "third tap at24seconds must survive a live timing update");
  assert(updated.size > rate*24);
});
test("fractional signed sweep direction remains continuous across base beats at equivalent velocities", () => {
  for(const name of ["Infinity Filter","Falling Flanger","Infinity Flanger","Space Invader"]) {
    const a=render(name,{Direction:-7,"Beat Modify":1})[0],b=render(name,{Direction:-28,"Beat Modify":4})[0];
    let maximum=0;for(let i=0;i<a.length;i++)maximum=Math.max(maximum,Math.abs(a[i]-b[i]));
    assert(maximum < .000001, `${name}: equivalent unwrapped phase velocity must render identical audio, max=${maximum}`);
  }
});
test("Stretch exit reads and rewinds markers beyond the first beat without admitting later live input", () => {
  const rate=4000, input=new Float32Array(rate*8);input.fill(.4,rate*.7,rate*.75);
  const later=input.slice();later.fill(.8,rate*3,rate*4);
  const run=source=>{const k=new ExtendedEffectKernel({name:"Epic Stretch Rewind",on:true,depth:100,beat:"1/2",params:{}},rate,120),a=new Float32Array(source.length),b=new Float32Array(source.length);k.process(source,source,a,b);return a;},a=run(input),b=run(later);
  assert(rms(a.subarray(rate*.5,rate*2)) > .001, "forward Stretch must reach the.7s marker");
  assert(rms(a.subarray(rate*2,rate*7)) > .001, "reverse Stretch must replay the.7s marker");
  assert.equal(diff(a,b),0,"post-capture input must not enter finite exit grains");
});
console.log(`${passed}/${passed} observed-control signal checks passed.`);
