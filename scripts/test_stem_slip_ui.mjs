import assert from "node:assert/strict";
import { AudioEngine } from "../prototype/engine.js";
import { createCueHolds } from "../prototype/holds.js";
import { createStemSlipControls } from "../prototype/stem-slip-ui.js";

// Real UI controllers and real AudioEngine owner methods; voice construction,
// transport commands and DOM rendering are controlled collaborators. This suite
// proves async/lifetime contracts, not browser focus behavior or rendered audio.
const flush = async () => {
  for (let i = 0; i < 30; i++) await Promise.resolve();
};
function deferred() {
  let resolve, reject;
  const promise = new Promise((ok, fail) => { resolve = ok; reject = fail; });
  return { promise, resolve, reject };
}
function engineFixture({ separateRequests = false } = {}) {
  const engine = new AudioEngine(), commands = [], requests = [];
  const shared = deferred();
  const voice = { stemSlipTransport: { command: async (kind, value) => {
    commands.push({ kind, ...value });
  } } };
  engine.init = () => {};
  engine.position = () => 0;
  engine.selectedPosition = () => 0;
  engine.startStemSlip = async () => {
    const request = separateRequests ? deferred() : shared;
    requests.push(request);
    await request.promise;
    engine.voices.set(0, voice);
    return voice;
  };
  const d = { index: 0, track: { id: "fixture", duration: 10,
    cues: [{ position: 2 }] }, stemSlip: "vocal", stemSlipRelease: 2,
    playing: false, cue: 0 };
  return { engine, commands, requests, shared, d };
}
function cueFixture(options) {
  const fixture = engineFixture(options), notices = [];
  const holds = createCueHolds({ engine: fixture.engine,
    state: { decks: [fixture.d] }, quantized: (_, p) => p,
    record: () => {}, persist: () => {}, render: () => {},
    notify: message => notices.push(message) });
  return { ...fixture, holds, notices };
}
function domFixture() {
  const listeners = new Map(), windows = new Map(), nodes = new Map();
  const emit = (type, target, options = {}) => {
    for (const listener of listeners.get(type) || []) listener({ target, ...options });
  };
  const body = { dataset: {}, closest: () => null };
  const document = { body, activeElement: body,
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(listener);
    }, querySelector: selector => nodes.get(selector) || null };
  const window = { addEventListener(type, listener) {
    if (!windows.has(type)) windows.set(type, []);
    windows.get(type).push(listener);
  } };
  globalThis.document = document;
  globalThis.window = window;
  function element(dataset = {}, deckControl = false) {
    return { dataset, deckControl, value: "2", disabled: false,
      closest(selector) { return selector === "[data-stem-slip-scratch]" &&
        this.dataset.stemSlipScratch !== undefined ? this : null; },
      setPointerCapture() {}, focus() {
        document.activeElement = this;
        emit("focusin", this);
      } };
  }
  return { document, nodes, emit, element,
    blur() { for (const fn of windows.get("blur") || []) fn(); } };
}
function scratchFixture(options) {
  const fixture = engineFixture(options), dom = domFixture(), notices = [];
  const controls = createStemSlipControls({ engine: fixture.engine,
    state: { decks: [fixture.d], deckCount: 1 }, prepare: async () => {},
    render: () => {}, notify: message => notices.push(message) });
  const input = dom.element({ stemSlipScratch: "0" }, true);
  return { ...fixture, ...dom, controls, notices, input,
    down: () => dom.emit("pointerdown", input, { button: 0, pointerId: 1 }),
    up: type => dom.emit(type || "pointerup", input, { pointerId: 1 }) };
}
function focusFixture() {
  const dom = domFixture(), ready = deferred(), notices = [], calls = [];
  const d = { index: 0, track: { id: "fixture", duration: 10 }, stemSlip: "off" };
  let controls, select;
  const render = () => {
    if (dom.document.activeElement.deckControl)
      dom.document.activeElement = dom.document.body;
    select = dom.element({ stemSlipMode: "0" }, true);
    select.value = "vocal";
    dom.nodes.set('[data-stem-slip-mode="0"]', select);
    // Same collaboration used by app.renderDecks after replacing the deck DOM.
    controls?.restoreFocus();
  };
  controls = createStemSlipControls({ engine: { stemBuffers: new Map(),
    setStemSlip: async (deck, mode) => { calls.push(mode); deck.stemSlip = mode; } },
    state: { decks: [d], deckCount: 1 }, prepare: () => ready.promise,
    render, notify: message => notices.push(message) });
  render();
  return { ...dom, ready, notices, calls, controls, d, render,
    currentSelect: () => select,
    start() { select.focus(); dom.emit("change", select); } };
}
let passed = 0;
async function test(name, fn) {
  await fn(); passed++;
  console.log("PASS", name);
}

await test("same cue key reused before shared voice readiness retains the second owner", async () => {
  const f = cueFixture(), first = f.holds.press("key:1", f.d, 0);
  await f.holds.release("key:1");
  const second = f.holds.press("key:1", f.d, 0);
  f.shared.resolve(); await Promise.all([first, second]);
  const owner = f.engine.stemSlipOwners.get(0)?.owner;
  assert(owner);
  assert.equal(f.commands.filter(c => c.kind === "cue").length, 1);
  assert(!f.commands.some(c => c.kind === "end" && c.owner === owner));
  await f.holds.release("key:1");
  assert(f.commands.some(c => c.kind === "end" && c.owner === owner));
});
await test("same pointer reused before shared readiness retains the second scratch", async () => {
  const f = scratchFixture();
  f.down(); await flush(); f.up(); f.down(); await flush();
  f.shared.resolve(); await flush();
  const owner = f.engine.stemSlipOwners.get(0)?.owner;
  assert(owner);
  assert(f.commands.some(c => c.kind === "scratch" && c.owner === owner));
  assert(!f.commands.some(c => c.kind === "end" && c.owner === owner));
  f.up(); await flush();
  assert(f.commands.some(c => c.kind === "end" && c.owner === owner));
});
await test("a rejected older cue preparation cannot erase the newer physical-key hold", async () => {
  const f = cueFixture({ separateRequests: true });
  const first = f.holds.press("key:1", f.d, 0);
  await f.holds.release("key:1");
  const second = f.holds.press("key:1", f.d, 0);
  f.requests[1].resolve(); await second;
  const owner = f.engine.stemSlipOwners.get(0)?.owner;
  f.requests[0].reject(new Error("older cue preparation failed")); await first;
  assert.equal(f.engine.stemSlipOwners.get(0)?.owner, owner);
  await f.holds.release("key:1");
  assert(f.commands.some(c => c.kind === "end" && c.owner === owner));
  assert.deepEqual(f.notices, ["older cue preparation failed"]);
});
await test("a rejected older pointer preparation cannot erase a newer scratch", async () => {
  const f = scratchFixture({ separateRequests: true });
  f.down(); await flush(); f.up(); f.down(); await flush();
  f.requests[1].resolve(); await flush();
  const owner = f.engine.stemSlipOwners.get(0)?.owner;
  f.requests[0].reject(new Error("older pointer preparation failed")); await flush();
  f.input.value = "7"; f.emit("input", f.input); await flush();
  assert(f.commands.some(c => c.kind === "scratch" && c.owner === owner && c.position === 7));
  f.up(); await flush();
  assert(f.commands.some(c => c.kind === "end" && c.owner === owner));
  assert.deepEqual(f.notices, ["older pointer preparation failed"]);
});
await test("pointer cancellation rejoins immediately instead of starting a musical release roll", async () => {
  const f = scratchFixture(); f.down(); await flush();
  f.shared.resolve(); await flush(); f.up("pointercancel"); await flush();
  assert(f.commands.some(c => c.kind === "end" && c.beats === 0));
});
await test("keyboard scratch keyup ends its gesture after focus moves elsewhere", async () => {
  const f = scratchFixture();
  f.emit("keydown", f.input, { key: "ArrowRight" }); await flush();
  f.shared.resolve(); await flush();
  const other = f.element(); other.focus();
  f.emit("keyup", other, { key: "ArrowRight" }); await flush();
  assert(f.commands.some(c => c.kind === "end"));
  assert(!f.engine.stemSlipOwners.has(0));
});
await test("progress and final renders restore the requesting mode selector focus", async () => {
  const f = focusFixture(); f.start(); await flush();
  for (let i = 0; i < 3; i++) {
    f.render(); assert.equal(f.document.activeElement, f.currentSelect());
  }
  f.ready.resolve(); await flush();
  assert.equal(f.document.activeElement, f.currentSelect());
  assert.equal(f.d.stemSlip, "vocal");
  assert.equal(f.d.stemSlipPending, false);
});
await test("deferred mode preparation failure clears pending state and retains focus", async () => {
  const f = focusFixture(); f.start(); f.render();
  f.ready.reject(new Error("separation failed")); await flush();
  assert.equal(f.d.stemSlip, "off");
  assert.equal(f.d.stemSlipPending, false);
  assert.equal(f.document.activeElement, f.currentSelect());
  assert.deepEqual(f.notices, ["separation failed"]);
});
await test("focus moved to another deck control is not stolen after that control rerenders", async () => {
  const f = focusFixture(); f.start();
  const other = f.element({ tempo: "1" }, true); other.focus();
  f.render(); f.ready.resolve(); await flush();
  assert.equal(f.document.activeElement, f.document.body);
});
await test("pointer intent elsewhere cancels restoration even before its default focus change", async () => {
  const f = focusFixture(); f.start();
  f.emit("pointerdown", f.element(), { button: 0, pointerId: 5 });
  f.render(); f.ready.resolve(); await flush();
  assert.equal(f.document.activeElement, f.document.body);
});
await test("track-load cancellation prevents deferred preparation from arming the new track", async () => {
  const f = focusFixture(); f.start();
  f.controls.cancelDeck(f.d);
  f.d.track = { id: "replacement", duration: 10 };
  f.render(); f.ready.resolve(); await flush();
  assert.deepEqual(f.calls, []);
  assert.equal(f.d.stemSlipPending, false);
  assert.equal(f.document.activeElement, f.document.body);
});
await test("a later Off selection supersedes an earlier deferred arm request", async () => {
  const f = focusFixture(); f.start();
  const select = f.currentSelect(); select.value = "off";
  f.emit("change", select); await flush();
  f.ready.resolve(); await flush();
  assert.deepEqual(f.calls, ["off"]);
  assert.equal(f.d.stemSlip, "off");
  assert.equal(f.d.stemSlipPending, false);
});
await test("a same-turn pointer cancellation cannot start a deferred stale scratch", async () => {
  const f = scratchFixture(); f.d.playing = true;
  f.down(); f.input.value = "7"; f.emit("input", f.input);
  f.up("pointercancel");
  f.shared.resolve(); await flush();
  assert(!f.commands.some(c => ["begin", "scratch", "cue"].includes(c.kind)), JSON.stringify(f.commands));
  assert(!f.engine.stemSlipOwners.has(0));
});
await test("same-turn blur cancels the queued keyboard gesture without starting stale manipulation", async () => {
  const f = scratchFixture(); f.d.playing = true;
  f.emit("keydown", f.input, { key: "Home" });
  f.input.value = "0"; f.emit("input", f.input); f.blur();
  f.shared.resolve(); await flush();
  assert(!f.commands.some(c => ["begin", "scratch", "cue"].includes(c.kind)), JSON.stringify(f.commands));
  assert(!f.engine.stemSlipOwners.has(0));
});
await test("same-turn keyboard tap applies its requested position and configured normal release", async () => {
  const f = scratchFixture(); f.d.playing = true; f.d.stemSlipRelease = 4;
  // Native fast key dispatch can finish before the begin() microtask runs.
  // Normal release must commit this gesture; cancellation above must discard it.
  f.emit("keydown", f.input, { key: "Home" });
  f.input.value = "0"; f.emit("input", f.input);
  f.emit("keyup", f.input, { key: "Home" });
  f.shared.resolve(); await flush();
  assert(f.commands.some(c => c.kind === "begin"), `Quick tap was dropped; commands=${JSON.stringify(f.commands)}`);
  const scratch = f.commands.find(c => c.kind === "scratch" && c.position === 0);
  assert(scratch, `Requested Home position missing; commands=${JSON.stringify(f.commands)}`);
  const end = f.commands.find(c => c.kind === "end" && c.owner === scratch.owner);
  assert(end && end.beats === 4, `Configured normal release missing; commands=${JSON.stringify(f.commands)}`);
  assert(f.commands.findIndex(c => c === scratch) < f.commands.findIndex(c => c === end), "Scratch must precede its release");
});
await test("a normal quick tap followed by blur before begin cannot create a stale release roll", async () => {
  const f = scratchFixture(); f.d.playing = true; f.d.stemSlipRelease = 4;
  f.emit("keydown", f.input, { key: "Home" });
  f.input.value = "0"; f.emit("input", f.input);
  f.emit("keyup", f.input, { key: "Home" }); f.blur();
  f.shared.resolve(); await flush();
  assert(!f.commands.some(c => ["begin", "scratch", "cue", "end"].includes(c.kind)), JSON.stringify(f.commands));
  assert(!f.engine.stemSlipOwners.has(0));
});
await test("a quick tap on a paused deck never starts a delayed audition", async () => {
  const f = scratchFixture(); f.d.playing = false; f.d.stemSlipRelease = 4;
  f.emit("keydown", f.input, { key: "Home" });
  f.input.value = "0"; f.emit("input", f.input);
  f.emit("keyup", f.input, { key: "Home" });
  f.shared.resolve(); await flush();
  assert(!f.commands.some(c => ["begin", "scratch", "cue", "end"].includes(c.kind)), JSON.stringify(f.commands));
  assert(!f.engine.stemSlipOwners.has(0));
});
await test("a quick tap then a new same-key hold keeps only the current physical epoch", async () => {
  const f = scratchFixture(); f.d.playing = true; f.d.stemSlipRelease = 4;
  f.emit("keydown", f.input, { key: "Home" });
  f.input.value = "0"; f.emit("input", f.input);
  f.emit("keyup", f.input, { key: "Home" });
  f.emit("keydown", f.input, { key: "Home" });
  f.input.value = "7"; f.emit("input", f.input);
  f.shared.resolve(); await flush();
  const owner = f.engine.stemSlipOwners.get(0)?.owner;
  assert(owner);
  assert.equal(f.commands.filter(c => c.kind === "begin").length, 1);
  assert(f.commands.some(c => c.kind === "scratch" && c.owner === owner && c.position === 7));
  assert(!f.commands.some(c => c.kind === "end" && c.owner === owner));
  assert(!f.commands.some(c => c.kind === "scratch" && c.position === 0));
  f.emit("keyup", f.input, { key: "Home" }); await flush();
  assert(f.commands.some(c => c.kind === "end" && c.owner === owner && c.beats === 4));
});
await test("resuming after a paused gesture was released cannot revive its deferred scratch", async () => {
  const f = scratchFixture(); f.d.playing = false; f.d.stemSlipRelease = 4;
  f.emit("keydown", f.input, { key: "Home" });
  f.input.value = "0"; f.emit("input", f.input);
  await flush(); // begin is waiting for voice construction while the key is held.
  f.emit("keyup", f.input, { key: "Home" });
  f.d.playing = true; // Canonical transport resumes before that pending voice resolves.
  f.shared.resolve(); await flush();
  assert(!f.commands.some(c => c.kind === "scratch" || (c.kind === "end" && c.beats > 0)),
    `Released paused gesture revived after resume: ${JSON.stringify(f.commands)}`);
});
console.log(`${passed}/${passed} Stem Slip controller lifecycle checks passed.`);
console.log("Scope: controlled DOM/voice collaborators; actual browser focus, AudioWorklet rendering and routed audio acceptance remain separate.");
