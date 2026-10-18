import {prepareExtendedEffects} from './extended-effects.js';
import { createSlicer } from "./slicer.js";
import { decodeMIDI, mappedValue } from "./midi.js";
import { AudioEngine } from "./engine.js";
import { createEffect } from "./effects.js";
import { createCueHolds } from "./holds.js";
import { createFlipAutomation } from "./flip.js";
import { smartMatches, crateMembers, descendantIds } from "./library.js";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const assert = (ok, why) => {
  if (!ok) throw new Error(why);
};
const energy = (a, from = 0, to = a.length) => {
  let n = 0;
  for (let i = from; i < to; i++) n += a[i] ** 2;
  return n;
};
async function renderEffect(name, on, type = "impulse", params = {}) {
  const ctx = new OfflineAudioContext(2, 48000, 24000),
    b = ctx.createBuffer(1, 48000, 24000),
    a = b.getChannelData(0);
  if (type === "impulse") a[0] = 1;
  else
    for (let i = 0; i < a.length; i++)
      a[i] = Math.sin((2 * Math.PI * 6000 * i) / 24000) * 0.2;
  if(name==="LPF"&&on)await prepareExtendedEffects(ctx);
  const source = ctx.createBufferSource();
  source.buffer = b;
  const effect = createEffect(
    ctx,
    { name, on, depth: 100, beat: "1/2", params },
    120,
  );
  source.connect(effect.input);
  effect.output.connect(ctx.destination);
  source.start();
  return (await ctx.startRendering()).getChannelData(0);
}
document.querySelector("#run").onclick = async () => {
  const button = document.querySelector("#run");
  button.disabled = true;
  const results = [];
  document.querySelector("#results").textContent = "";
  async function test(name, fn) {
    let detail, pass;
    try {
      detail = await fn();
      pass = true;
    } catch (e) {
      detail = e.message;
      pass = false;
    }
    results.push({ name, pass, detail });
    const row = document.createElement("tr");
    for (const text of [name, pass ? "PASS" : "FAIL", detail]) {
      const cell = document.createElement("td");
      cell.textContent = text;
      row.append(cell);
    }
    document.querySelector("#results").append(row);
  }
  await test("LPF changes rendered high-frequency energy", async () => {
    const dry = await renderEffect("LPF", false, "tone"),
      wet = await renderEffect("LPF", true, "tone");
    const ratio = energy(wet) / energy(dry);
    assert(ratio < 0.01, `ratio=${ratio}`);
    return `6 kHz output/input energy ${ratio.toExponential(3)}`;
  });
  await test("Delay renders the beat-timed echo", async () => {
    const a = await renderEffect("Delay", true);
    let peak = 0;
    for (let i = 1; i < a.length; i++)
      if (Math.abs(a[i]) > Math.abs(a[peak])) peak = i;
    assert(Math.abs(peak / 24000 - 0.25) < 0.002, `peak=${peak / 24000}`);
    assert(energy(a, 11000, 13000) > 0, "No feedback echo");
    return `First echo ${peak / 24000}s; second echo energy ${energy(a, 11000, 13000).toFixed(5)}`;
  });
  await test("Reverb produces a decaying impulse tail", async () => {
    const a = await renderEffect("Reverb", true);
    const early = energy(a, 2000, 6000),
      late = energy(a, 28000, 32000);
    assert(early > 0 && late < early * 0.1, "Tail missing/nondecaying");
    return `Early energy ${early.toFixed(6)}; late ${late.toFixed(6)}`;
  });
  await test("Wah produces filtered output", async () => {
    const dry = await renderEffect("Wah Filter", false, "tone"),
      wet = await renderEffect("Wah Filter", true, "tone", {
        "LFO Depth": "60%",
      });
    const ratio = energy(wet) / energy(dry);
    assert(ratio > 0 && ratio < 0.5, "No measured filtering");
    return `Output/input energy ${ratio.toFixed(6)} (transfer-function parity untested)`;
  });
  await test("Smart crate all/any and numeric rejection", () => {
    const rules = [
        { field: "bpm", operator: "at least", value: "124" },
        { field: "album", operator: "contains", value: "night" },
      ],
      track = { bpm: 128, album: "Day" };
    assert(!smartMatches({ rules, match: "all" }, track), "AND wrong");
    assert(smartMatches({ rules, match: "any" }, track), "OR wrong");
    assert(
      !smartMatches({ rules: [rules[0]] }, { bpm: "invalid" }),
      "Invalid number accepted",
    );
    return "AND false; OR true; malformed BPM rejected";
  });
  await test("Nested crates union, smart exclusion and cycle guard", () => {
    const crates = [
      { id: "a", parent: "b", tracks: ["1"] },
      { id: "b", parent: "a", tracks: ["2"] },
      { id: "c", parent: "a", smart: true, tracks: ["3"] },
    ];
    assert(descendantIds(crates, "a").size === 3, "Cycle guard wrong");
    assert(
      crateMembers(
        crates[0],
        [{ id: "1" }, { id: "2" }, { id: "3" }],
        crates,
        true,
      ).length === 2,
      "Union wrong",
    );
    return "Cycle terminates; duplicate-free two-track union excludes smart child";
  });
  const engine = new AudioEngine();
  await engine.resume();
  engine.analyser.disconnect();
  const track = {
    id: "verification-tone",
    duration: 20,
    bpm: 120,
    cues: [{ position: 2 }],
    flips: [],
  };
  const buffer = engine.ctx.createBuffer(
    1,
    engine.ctx.sampleRate * 20,
    engine.ctx.sampleRate,
  );
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++)
    data[i] = Math.sin((2 * Math.PI * 440 * i) / engine.ctx.sampleRate) * 0.2;
  engine.buffers.set(track.id, buffer);
  const d = {
    index: 0,
    track,
    position: 0,
    rate: 1,
    playing: false,
    reverse: false,
    loop: false,
    loopIn: 0,
    loopOut: 0,
    cue: 0,
  };
  const state = {
    decks: [d],
    tracks: [track],
    focus: 0,
    flip: { events: [], name: "Verification", loop: false },
  };
  const flip = createFlipAutomation({
    state,
    engine,
    notify: () => {},
    persist: () => {},
    renderDecks: () => {},
  });
  const holds = createCueHolds({
    engine,
    state,
    quantized: (_, p) => p,
    record: flip.record,
    persist: () => {},
    render: () => {},
    notify: () => {},
  });
  await test("Reverse PCM and descending transport", async () => {
    const reversed = engine.reverseBuffer(track.id, buffer);
    assert(
      reversed.getChannelData(0)[0] === data[data.length - 1],
      "PCM not reversed",
    );
    d.position = 3;
    d.reverse = true;
    await engine.start(d);
    await wait(150);
    const p = engine.position(d);
    engine.pause(d);
    d.reverse = false;
    assert(p < 3 && p > 2.5, `position ${p}`);
    return `Reversed PCM matches; 3s → ${p.toFixed(3)}s`;
  });
  await test("Slip loop restores elapsed forward timeline", async () => {
    d.position = 1;
    d.slip = true;
    await engine.start(d);
    engine.beginSlip(d, "loop");
    await engine.setLoop(d, true, 1, 1.05);
    await wait(220);
    await engine.setLoop(d, false, 1, 1.05);
    await engine.endSlip(d, "loop");
    const p = engine.position(d);
    engine.pause(d);
    assert(p > 1.15 && p < 1.6, `position ${p}`);
    return `50ms loop released at underlying ${p.toFixed(3)}s`;
  });
  await test("Slip beyond track end stays stopped", async () => {
    d.position = 1;
    await engine.start(d);
    d.slipOrigin = {
      position: 25,
      time: engine.ctx.currentTime,
      rate: 1,
      reason: "loop",
    };
    await engine.endSlip(d, "loop");
    assert(!d.playing && d.position === 20, "Track restarted");
    return "Stopped at 20s; no wrap to beginning";
  });
  await test("Cue hold plays then releases to its cue", async () => {
    d.slip = false;
    d.position = 0;
    d.cue = 0;
    await holds.press("test", d);
    await wait(150);
    assert(d.playing && engine.position(d) > 0.05, "Hold did not play");
    await holds.release("test");
    assert(!d.playing && d.position === 0, "Release did not return");
    return "Played during hold; stopped exactly at cue on release";
  });
  await test("Play latches a held cue", async () => {
    await holds.press("latch", d);
    assert(holds.latch(d), "Latch not accepted");
    await holds.release("latch");
    assert(d.playing, "Release stopped latched playback");
    engine.pause(d);
    return "Playback remains active after release";
  });
  await test("Rapid cue release cancels pending start", async () => {
    d.position = 0;
    const start = holds.press("quick", d);
    await holds.release("quick");
    await start;
    assert(!d.playing && !engine.voices.has(0), "Stale audio start");
    return "No deck voice remains after immediate release";
  });
  await test("Sampler produces signal and stops on release", async () => {
    await engine.sample(track, "test", { gain: 1, start: 2, rate: 1.5 });
    await wait(180);
    const signal = engine.meter();
    assert(signal > 0.01, `No signal ${signal}`);
    engine.stopSample("test");
    await wait(100);
    const stopped = engine.meter();
    assert(stopped < 0.01, `Leaked signal ${stopped}`);
    return `RMS meter ${signal.toFixed(4)} → ${stopped.toFixed(4)}`;
  });
  await test("Sampler early release cancels decoding/start", async () => {
    const pending = engine.sample(track, "quick");
    engine.stopSample("quick");
    await pending;
    assert(!engine.samples.has("quick"), "Stale sample");
    return "No sample voice after immediate cancellation";
  });
  await test("Sampler mute changes real output", async () => {
    await engine.sample(track, "mute", { gain: 1 });
    await wait(100);
    engine.updateSample("mute", { gain: 0 });
    await wait(180);
    assert(engine.meter() < 0.01, "Mute did not silence");
    engine.stopSample("mute");
    return "Rendered master RMS below 0.01 after mute";
  });
  await test("Flip replays timed cue positions and saves six slots", async () => {
    d.position = 0;
    state.flip.trackId = track.id;
    state.flip.events = [
      { kind: "cue", position: 1, offset: 0 },
      { kind: "cue", position: 10, offset: 0.1 },
    ];
    state.flip.duration = 0.3;
    await flip.start(d);
    await wait(170);
    flip.tick();
    await wait(30);
    const p = engine.position(d);
    assert(p >= 10 && p < 10.3, `position=${p}`);
    for (let i = 0; i < 7; i++) flip.save();
    assert(track.flips.filter(Boolean).length === 6, "Six-slot cap failed");
    flip.stop();
    engine.pause(d);
    return `Timed jump to ${p.toFixed(3)}s; seventh save preserves six slots`;
  });
  await test("Slicer auditions a slice then restores the timeline", async () => {
    const slicer = createSlicer({ engine, render: () => {}, notify: () => {} });
    d.position = 1;
    d.loop = false;
    d.slicerDomain = 8;
    d.sliceQuant = 0.125;
    await engine.start(d);
    await slicer.press("test", d, 4);
    await wait(120);
    const sliced = engine.position(d);
    assert(sliced >= 2 && sliced < 2.07, `Slice position=${sliced}`);
    await slicer.release("test");
    const restored = engine.position(d);
    engine.pause(d);
    assert(restored > 1.08 && restored < 1.5, `Restore position=${restored}`);
    return `Slice ${sliced.toFixed(3)}s → timeline ${restored.toFixed(3)}s`;
  });
  await test("Actual engine FX routing changes deck output", async () => {
    d.position = 1;
    d.loop = false;
    await engine.start(d);
    await wait(120);
    const dry = engine.meter();
    engine.configureFX(
      [[{ name: "LPF", on: true, depth: 100, params: {} }]],
      ["Deck 1"],
      [120],
    );
    await wait(150);
    const filtered = engine.meter();
    assert(filtered < dry * 0.5, `dry=${dry},filtered=${filtered}`);
    engine.configureFX([], [], []);
    engine.pause(d);
    return `Master RMS ${dry.toFixed(4)} → ${filtered.toFixed(4)} through Deck 1 LPF`;
  });
  await test("MIDI channel messages and relative encodings", () => {
    const off = decodeMIDI([0x91, 60, 0]),
      cc = decodeMIDI([0xb2, 1, 127]);
    assert(off.channel === 2 && !off.pressed, "Note release wrong");
    assert(
      cc.channel === 3 && mappedValue(cc, "Relative two’s complement") === -1,
      "Relative value wrong",
    );
    assert(decodeMIDI([0xf0, 1, 2]) === null, "SysEx accepted");
    assert(
      mappedValue({ ...cc, value: 65 }, "Relative offset") === 1,
      "Offset wrong",
    );
    return "Note-on zero releases; channel 3 CC127 = -1; offset65 = +1; SysEx ignored";
  });
  await test("MIDI 14-bit CC and pitch bend assembly", () => {
    const pairs = new Map();
    mappedValue(
      { type: "CC", channel: 1, number: 1, value: 127 },
      "14-bit absolute",
      pairs,
    );
    const full = mappedValue(
      { type: "CC", channel: 1, number: 33, value: 127 },
      "14-bit absolute",
      pairs,
    );
    assert(full === 1, "CC assembly wrong");
    assert(
      mappedValue(decodeMIDI([0xe0, 127, 127]), "14-bit absolute") === 1,
      "Pitch bend wrong",
    );
    return "MSB/LSB and pitch bend reach normalized 1.0; hardware still unverified";
  });
  engine.silence();
  await engine.ctx.close();
  document.querySelector("#summary").textContent =
    `${results.filter((r) => r.pass).length}/${results.length} passed · ${new Date().toISOString()}`;
  button.disabled = false;
};
