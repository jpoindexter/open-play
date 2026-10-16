import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { videoTransitionCatalog, createVideoTransitions } from "../prototype/video-transitions.js";
import { createTransitionState } from "../prototype/video-transitions-state.js";

const evidence = JSON.parse(await readFile(new URL("../docs/research/video-catalog-evaluation.json", import.meta.url), "utf8"));
const resourceNames = [...evidence.transitions, ...evidence.localizedTransitionCandidates].map((c) => c.name).sort();
assert.deepEqual(videoTransitionCatalog.filter((c) => !c.baseline).map((c) => c.name).sort(), resourceNames);
assert.equal(videoTransitionCatalog.filter((c) => c.provenance === "manifest").length, 7);
assert.equal(videoTransitionCatalog.filter((c) => c.candidate).length, 26);
assert.equal(new Set(videoTransitionCatalog.map((c) => c.name)).size, 34);
assert(videoTransitionCatalog.every((c) => !c.referenceEquivalent && c.referenceRuntimeAvailability === "unverified"));
assert(videoTransitionCatalog.find((c) => c.name === "Upfaders Only").endpointContract.includes("every amount"));
assert.throws(() => createVideoTransitions({ width: 0, height: 3 }), RangeError);
assert.throws(() => createVideoTransitions({ width: 2.5, height: 3 }), RangeError);
assert.throws(() => createVideoTransitions({ width: 4097, height: 3 }), RangeError);

const left = {}, right = {}, state = createTransitionState(); let id = 0;
const step = (name, amount, extra = {}) => state.advance({ name, amount, left, right, time: id, frameId: ++id, ...extra });
let result = step("Scratch", 0); assert(result.resetHistory && result.captureLatch && result.side === 0);
result = step("Scratch", 0.2); assert(result.captureLatch && result.side === 0);
result = step("Scratch", 0.8); assert(!result.captureLatch && result.side === 0);
result = step("Scratch", 1); assert(result.captureLatch && result.side === 1);
result = step("Scratch", 0.7); assert(result.captureLatch && result.side === 1);
result = step("Scratch", 0.3); assert(!result.captureLatch && result.side === 1);
state.reset();
result = step("Latch 50", 0.2); assert(result.captureLatch && result.side === 0);
result = step("Latch 50", 0.3); assert(!result.captureLatch && result.side === 0);
result = step("Latch 50", 0.5); assert(result.captureLatch && result.side === 1);
result = step("Latch 50", 0.8); assert(!result.captureLatch && result.side === 1);
result = step("Latch 50", 0.3); assert(result.captureLatch && result.side === 0);
result = step("Smudge Fade", 0.3); assert(result.resetHistory);
result = step("Smudge Fade", 0.5, { frameId: "duplicate", time: 20 }); assert(result.freshFrame);
result = step("Smudge Fade", 0.5, { frameId: "duplicate", time: 21 }); assert(!result.freshFrame && !result.captureLatch);
result = step("Smudge Fade", 0.5, { time: 22, left: {} }); assert(result.resetHistory, "Input identity changes clear history");
result = step("Smudge Fade", 0.5, { time: 1, left }); assert(result.resetHistory, "Backwards clocks clear history");
const duplicateRegressions = [];
for (const [name, verify] of [
  ["same-frame Latch 50 crossing", () => {
    const s = createTransitionState();
    s.advance({ name: "Latch 50", amount: 0.2, time: 10, frameId: 1, left, right });
    const next = s.advance({ name: "Latch 50", amount: 0.8, time: 10, frameId: 1, left, right });
    assert.equal(next.side, 1); assert(next.captureLatch && !next.freshFrame);
  }],
  ["same-frame Scratch endpoint bookkeeping", () => {
    const s = createTransitionState();
    s.advance({ name: "Scratch", amount: 0, time: 10, frameId: 1, left, right });
    s.advance({ name: "Scratch", amount: 1, time: 10, frameId: 1, left, right });
    const next = s.advance({ name: "Scratch", amount: 0.7, time: 10, frameId: 1, left, right });
    assert.equal(next.side, 1); assert(next.captureLatch && !next.freshFrame);
  }],
  ["same-frame clock 10 to 12 to 11 invalidates history", () => {
    const s = createTransitionState();
    s.advance({ name: "Smudge Fade", amount: 0.5, time: 10, frameId: 1, left, right });
    const forward = s.advance({ name: "Smudge Fade", amount: 0.5, time: 12, frameId: 1, left, right });
    assert(!forward.freshFrame);
    const backward = s.advance({ name: "Smudge Fade", amount: 0.5, time: 11, frameId: 1, left, right });
    assert(backward.resetHistory && backward.freshFrame);
  }],
]) {
  try { verify(); duplicateRegressions.push({ name, passed: true }); }
  catch (error) { duplicateRegressions.push({ name, passed: false, error: error.message }); }
}
console.log(JSON.stringify(duplicateRegressions));
assert(duplicateRegressions.every((r) => r.passed), "Same-frame control/clock regressions failed");
console.log("Node verification passed: 33 resource names + separate baseline, provenance boundaries, dimensions, scratch/latch lifecycle, duplicate-frame/source/time history isolation. This does not compile GLSL or establish rendered pixels.");

if (process.argv.includes("--serve")) {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const port = Number(process.env.VIDEO_TRANSITIONS_PORT || 8786);
  const server = createServer(async (req, res) => {
    const path = new URL(req.url, "http://127.0.0.1").pathname;
    if (!/^\/prototype\/video-transitions(?:-[a-z]+)*\.(?:html|js)$/.test(path)) { res.writeHead(404); res.end("Not found"); return; }
    try {
      const data = await readFile(root + path.slice(1));
      res.writeHead(200, { "Content-Type": path.endsWith(".html") ? "text/html; charset=utf-8" : "text/javascript; charset=utf-8", "Cache-Control": "no-store" }); res.end(data);
    } catch { res.writeHead(404); res.end("Not found"); }
  });
  server.listen(port, "127.0.0.1", () => console.log(`Browser pixel harness: http://127.0.0.1:${port}/prototype/video-transitions-harness.html`));
}
