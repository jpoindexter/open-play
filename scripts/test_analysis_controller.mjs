// Controller integration: real app function bodies and PCM, stubbed DOM/decode.
import fs from "node:fs";
import vm from "node:vm";
import { webcrypto } from "node:crypto";
import { analyzePCM } from "../prototype/analysis.js";
import { snapshotVideoState } from "../prototype/video-state.js";
import { normalizeFXTempoSettings } from "../prototype/fx-tempo.js";
const source = fs.readFileSync("prototype/app.js", "utf8");
const fixtureSource = fs.readFileSync("scripts/test_analysis.mjs", "utf8");
const fixtureContext = vm.createContext({ Float32Array, Math });
vm.runInContext(
  fixtureSource.slice(
    fixtureSource.indexOf("const sr"),
    fixtureSource.indexOf("const start"),
  ) + ";globalThis.pulse=pulse;globalThis.melody=melody;",
  fixtureContext,
);
function wav(data) {
  const b = Buffer.alloc(44 + data.length * 2);
  b.write("RIFF");
  b.writeUInt32LE(b.length - 8, 4);
  b.write("WAVEfmt ", 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(44100, 24);
  b.writeUInt32LE(88200, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write("data", 36);
  b.writeUInt32LE(data.length * 2, 40);
  for (let i = 0; i < data.length; i++)
    b.writeInt16LE(
      Math.round(Math.max(-1, Math.min(1, data[i])) * 32767),
      44 + i * 2,
    );
  return b;
}
const pulse = fixtureContext.pulse(128, 24),
  melody = fixtureContext.melody(0, false, 24),
  silent = new Float32Array(44100 * 8);
for (const [name, data] of [
  ["pulse-128", pulse],
  ["c-major", melody],
  ["silence", silent],
])
  fs.writeFileSync(`local-evidence/analysis-ui/${name}.wav`, wav(data));
const buffer = {
  numberOfChannels: 1,
  sampleRate: 44100,
  getChannelData: () => pulse,
};
const nodes = new Map();
const node = (id) =>
  nodes.get(id) ||
  nodes
    .set(id, { value: "Selected track", textContent: "", title: "" })
    .get(id);
const state = {
  tracks: [],
  analysisSettings: {
    onImport: true,
    minBpm: 50,
    maxBpm: 220,
    maxSeconds: 180,
  },
  localTags: {},
  decks: [],
  settings: {},
  analysis: false,
};
const saved = {};
const storage = {};
const results = [];
let gate = null;
const context = vm.createContext({
  state,
  snapshotVideoState,
  normalizeFXTempoSettings,
  localStorage: {
    setItem(k, v) {
      storage[k] = v;
    },
  },
  Float32Array,
  Math,
  Number,
  Date,
  DOMException,
  AbortController,
  CustomEvent: class {},
  crypto: webcrypto,
  colors: ["#fff"],
  document: { dispatchEvent() {} },
  $: node,
  notify() {},
  persist() {
    for (const t of state.tracks)
      if (t.contentHash)
        saved[t.contentHash] = structuredClone(t.analysisResult);
  },
  renderTracks() {},
  renderDecks() {},
  drawWaves() {},
  engine: {
    async buffer() {
      if (gate) await gate;
      return buffer;
    },
  },
  analyzeBuffer: async (b, o) =>
    analyzePCM([b.getChannelData(0)], b.sampleRate, o),
  trackById: (id) => state.tracks.find((t) => t.id === id),
  filtered: () => state.tracks,
});
vm.runInContext(
  source.slice(
    source.indexOf("const metadataFields"),
    source.indexOf("function dialog("),
  ),
  context,
);
vm.runInContext(
  source.slice(
    source.indexOf("async function importFiles("),
    source.indexOf("\nfunction download("),
  ),
  context,
);
function check(name, pass) {
  results.push({ name, passed: !!pass });
}
const fresh = { id: "a", title: "fresh", bpm: 0, key: "—", grid: 0 };
state.tracks = [fresh];
state.selected = "a";
await context.analyze();
check(
  "Actual controller writes measured numeric tempo and initial grid",
  Math.abs(fresh.bpm - 128) < 1 &&
    fresh.grid > 0 &&
    fresh.analysisResult.bpm !== null,
);
check(
  "Measured level and unknown key remain honest",
  Number.isFinite(fresh.analysisResult.gain.rmsDbfs) &&
    fresh.analysisResult.key === null &&
    fresh.key === "—",
);
fresh.bpm = 111;
fresh.key = "Fm";
fresh.grid = 1.7;
fresh.metadataSources = { bpm: "manual", key: "manual" };
await context.analyze();
check(
  "Ordinary reanalysis preserves manual BPM/key/grid",
  fresh.bpm === 111 && fresh.key === "Fm" && fresh.grid === 1.7,
);
fresh.locked = true;
await context.analyze({ replaceTempo: true, replaceKey: true });
check(
  "Explicit replace still preserves protected grid and unknown-result key",
  fresh.bpm === 111 && fresh.grid === 1.7 && fresh.key === "Fm",
);
buffer.getChannelData = () => melody;
await context.analyze({ replaceKey: true });
check("Locked file key survives explicit replacement with a known measured key", fresh.key === "Fm" && fresh.analysisResult.key === null && fresh.analysisResult.keyEstimate.reason === "key_analysis_disabled");
buffer.getChannelData = () => pulse;
fresh.locked = false;
await context.analyze({ replaceTempo: true });
check(
  "Explicit unlocked replacement updates tempo and phase",
  Math.abs(fresh.bpm - 128) < 1 && fresh.grid < 1,
);
let release;
gate = new Promise((r) => (release = r));
const task = context.analyze({ replaceTempo: true });
fresh.bpm = 101;
fresh.metadataRevision = 1;
release();
await task;
gate = null;
check(
  "Edit during asynchronous decode wins over queued replacement",
  fresh.bpm === 101,
);
gate = new Promise((r) => (release = r));
const before = fresh.analysisResult.measuredAt;
const cancel = context.analyze();
context.cancelAnalysis();
release();
await cancel;
gate = null;
check(
  "Cancel during decode prevents publishing a replacement result",
  fresh.analysisResult.measuredAt === before && !state.analysis,
);
// Deterministic cancellation handoff: pause decode, clear the old queue,
// enqueue a new track before the cancelled runner resumes, then release it.
const stalePending = {
  id: "stale",
  title: "cancelled pending",
  bpm: 0,
  key: "—",
  grid: 0,
};
const newlyQueued = {
  id: "new",
  title: "queued after cancel",
  bpm: 0,
  key: "—",
  grid: 0,
};
state.tracks.push(stalePending, newlyQueued);
gate = new Promise((r) => (release = r));
const race = context.enqueueAnalysis([fresh, stalePending]);
context.cancelAnalysis();
void context.enqueueAnalysis([newlyQueued]);
release();
await race;
gate = null;
check(
  "Post-cancel enqueue drains without another user action",
  !state.analysis &&
    newlyQueued.analysisResult &&
    Math.abs(newlyQueued.bpm - 128) < 1,
);
check(
  "Post-cancel enqueue does not revive cancelled pending jobs",
  !stalePending.analysisResult,
);
state.analysisSettings.onImport = false;
const bytes = wav(pulse);
const file = {
  name: "pulse-128.wav",
  size: bytes.length,
  arrayBuffer: async () =>
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length),
};
await context.importFiles([file]);
const imported = state.tracks.find((t) => t.contentHash);
check(
  "File import generates content-derived stable identity and obeys analysis disabled",
  imported &&
    imported.id === "local-" + imported.contentHash &&
    !imported.analysisResult,
);
await context.importFiles([file]);
check(
  "Repeated identical file import does not duplicate library row",
  state.tracks.filter((t) => t.contentHash === imported.contentHash).length ===
    1,
);
state.tracks = state.tracks.filter((t) => t !== imported);
state.localTags[imported.contentHash] = {
  bpm: 99,
  key: "Dm",
  metadataSources: { bpm: "manual", key: "manual" },
};
await context.importFiles([file]);
const restored = state.tracks.find((t) => t.contentHash);
check(
  "Same bytes restore persisted manual metadata on re-import",
  restored.bpm === 99 && restored.key === "Dm",
);
context.persist();
const stored = JSON.parse(storage["openplay-review-v1"]);
check(
  "Actual persistence saves analysis settings and imported metadata without file bytes",
  stored.analysisSettings.onImport === false &&
    stored.localTags[restored.contentHash].bpm === 99 &&
    !("file" in stored.localTags[restored.contentHash]),
);
console.log(
  JSON.stringify(
    {
      executedAt: new Date().toISOString(),
      boundary:
        "Actual app controller functions, stub DOM and decode; real analyzePCM. Does not prove browser decoding, Worker or visible controls.",
      passed: results.filter((x) => x.passed).length,
      total: results.length,
      results,
    },
    null,
    2,
  ),
);
if (results.some((x) => !x.passed)) process.exitCode = 1;
