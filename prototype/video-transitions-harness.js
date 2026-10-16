import { createVideoTransitions, videoTransitionCatalog } from "./video-transitions.js";

const W = 64, H = 48;
const $ = (selector) => document.querySelector(selector);
const makeCanvas = (w = W, h = H) => Object.assign(document.createElement("canvas"), { width: w, height: h });
const left = makeCanvas(), right = makeCanvas();
let renderer, sequence = 0;
function fixture(canvas, side = 0, transparent = false) {
  const ctx = canvas.getContext("2d"), image = ctx.createImageData(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const p = (y * W + x) * 4;
    image.data.set(side ? [(x * 11 + y * 3) % 256, (x * 2 + y * 7 + 70) % 256, 210 - y * 3, 255] :
      [225 - x * 2, (x * 7 + y * 11) % 256, (x * 3 + y * 5) % 256, transparent ? 40 + y * 4 : 255], p);
  }
  // Asymmetric corner markers catch horizontal/vertical inversion and mirroring.
  ctx.putImageData(image, 0, 0);
  ctx.fillStyle = side ? "#00ffff" : "#ff0000"; ctx.fillRect(0, 0, 6, 4);
  ctx.fillStyle = side ? "#ff00ff" : "#00ff00"; ctx.fillRect(W - 9, 0, 9, 7);
  ctx.fillStyle = side ? "#ffff00" : "#0000ff"; ctx.fillRect(0, H - 8, 7, 8);
}
function solid(canvas, color) {
  const ctx = canvas.getContext("2d"); ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = color; ctx.fillRect(0, 0, W, H);
}
function pixels(canvas) {
  const width = canvas.width, height = canvas.height;
  const gl = canvas.getContext("webgl"), bottom = new Uint8Array(width * height * 4), top = new Uint8Array(bottom.length);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, bottom);
  const error = gl.getError(); if (error !== gl.NO_ERROR) throw new Error("WebGL error " + error);
  for (let y = 0; y < height; y++) top.set(bottom.subarray((height - 1 - y) * width * 4, (height - y) * width * 4), y * width * 4);
  return top;
}
function draw(name, amount, options = {}) {
  return pixels(renderer.render(left, right, { name, amount, time: 1.23, bpm: 123, leftLevel: 0.4, rightLevel: 0.8, frameId: ++sequence, ...options }));
}
function assert(value, message) { if (!value) throw new Error(message); }
function same(a, b, tolerance = 2) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (Math.abs(a[i] - b[i]) > tolerance) return false;
  return true;
}
function delta(a, b) { let total = 0; for (let i = 0; i < a.length; i++) total += Math.abs(a[i] - b[i]); return total / a.length; }
function hash(bytes) { let value = 2166136261; for (const b of bytes) value = Math.imul(value ^ b, 16777619); return (value >>> 0).toString(16); }
function middle(bytes) { const p = ((H / 2) * W + W / 2) * 4; return bytes.slice(p, p + 4); }

export async function runVideoTransitionChecks() {
  const checks = [], alphaEdgeProbe = {}, start = performance.now();
  const check = (name, run) => { try { run(); checks.push({ name, passed: true }); } catch (error) { checks.push({ name, passed: false, error: error.message }); } };
  renderer?.dispose(); renderer = createVideoTransitions({ width: W, height: H });
  fixture(left); fixture(right, 1);
  const expectedLeft = left.getContext("2d").getImageData(0, 0, W, H).data;
  const expectedRight = right.getContext("2d").getImageData(0, 0, W, H).data;
  check("33 resource names remain distinct from the Crossfade baseline", () => {
    assert(videoTransitionCatalog.length === 34, "34 entries required");
    assert(videoTransitionCatalog.filter((c) => c.provenance === "manifest").length === 7, "7 manifest entries");
    assert(videoTransitionCatalog.filter((c) => c.candidate).length === 26, "26 candidates");
    assert(videoTransitionCatalog.every((c) => !c.referenceEquivalent), "No reference equivalence claim");
  });
  for (const entry of videoTransitionCatalog) {
    if (entry.name === "Upfaders Only") continue;
    check(entry.name + ": both live endpoints, marker orientation and alpha", () => {
      renderer.reset(); assert(same(draw(entry.name, 0), expectedLeft), "Left endpoint/orientation differs");
      assert(same(draw(entry.name, 1), expectedRight), "Right endpoint/orientation differs");
    });
  }
  check("All 33 independent resource-name behaviors have distinct three-position fingerprints", () => {
    const signatures = new Map();
    for (const entry of videoTransitionCatalog.filter((c) => !c.baseline)) {
      const signature = [0.23, 0.47, 0.71].map((amount) => {
        fixture(left); renderer.reset(); draw(entry.name, 0); draw(entry.name, 0.11);
        const ctx = left.getContext("2d"); ctx.fillStyle = "#00c87a";
        ctx.fillRect(13, 11, 29, 21);
        return hash(draw(entry.name, amount));
      }).join("/");
      assert(!signatures.has(signature), entry.name + " duplicates " + signatures.get(signature));
      signatures.set(signature, entry.name);
    }
  });
  check("Wipe orientation: horizontal is left-to-right, vertical top-to-bottom", () => {
    solid(left, "#ff0000"); solid(right, "#0000ff");
    renderer.reset(); const horizontal = draw("Wipe H", 0.5);
    renderer.reset(); const vertical = draw("Wipe V", 0.5);
    const at = (data, x, y) => data.slice((y * W + x) * 4, (y * W + x) * 4 + 4);
    assert(at(horizontal, 8, 30)[2] > 250 && at(horizontal, 56, 8)[0] > 250, "Horizontal axis reversed");
    assert(at(vertical, 56, 8)[2] > 250 && at(vertical, 8, 40)[0] > 250, "Vertical axis reversed");
  });
  check("Crossfade alpha is premultiplied for mixing and straight in output", () => {
    solid(left, "rgba(255,0,0,.5)"); solid(right, "#0000ff"); renderer.reset();
    const p = middle(draw("Crossfade", 0.5));
    assert(Math.abs(p[0] - 85) <= 2 && Math.abs(p[2] - 170) <= 2 && Math.abs(p[3] - 191) <= 2, "Expected straight RGBA ~85/0/170/191, got " + [...p]);
  });
  check("Upfaders Only ignores amount at endpoints and exposes both input gains", () => {
    solid(left, "#ff0000"); solid(right, "#0000ff"); renderer.reset();
    const at0 = draw("Upfaders Only", 0), at1 = draw("Upfaders Only", 1);
    assert(same(at0, at1), "Crossfader altered Upfaders Only");
    assert(middle(at0)[0] > 250 && middle(at0)[2] > 250, "Both sources must contribute");
    assert(middle(draw("Upfaders Only", 0.8, { upfaders: [1, 0] }))[0] > 250, "Left gain lost");
    const rightOnly = middle(draw("Upfaders Only", 0.2, { upfaders: [0, 1] }));
    assert(rightOnly[0] < 2 && rightOnly[2] > 250, "Right isolation failed");
    assert(draw("Upfaders Only", 0.5, { upfaders: [0, 0] }).every((v) => v === 0), "Zero upfaders must yield transparent black");
  });
  check("Scratch holds captured source in interior and releases at opposite endpoint", () => {
    solid(left, "#ff0000"); solid(right, "#0000ff"); renderer.reset(); draw("Scratch", 0); draw("Scratch", 0.2);
    solid(left, "#00ff00"); const held = middle(draw("Scratch", 0.35));
    assert(held[0] > 250 && held[1] < 2, "Departing source did not latch");
    assert(middle(draw("Scratch", 1))[2] > 250, "Opposite endpoint did not release");
  });
  check("Latch 50 captures each crossing and holds source-frame changes", () => {
    solid(left, "#ff0000"); solid(right, "#0000ff"); renderer.reset(); draw("Latch 50", 0.2);
    solid(left, "#00ff00"); assert(middle(draw("Latch 50", 0.3))[0] > 250, "Left latch updated too soon");
    draw("Latch 50", 0.6); solid(right, "#ffff00");
    assert(middle(draw("Latch 50", 0.8))[2] > 250, "Right latch updated too soon");
    assert(middle(draw("Latch 50", 1))[0] > 250, "Live endpoint did not refresh");
  });
  check("Scratch Fade blends frozen outgoing frame with live incoming frame", () => {
    solid(left, "#ff0000"); solid(right, "#0000ff"); renderer.reset(); draw("Scratch Fade", 0); draw("Scratch Fade", 0.2);
    solid(left, "#00ff00"); const p = middle(draw("Scratch Fade", 0.4));
    assert(p[0] > 100 && p[1] < 2 && p[2] > 80, "Frozen outgoing contribution not retained");
  });
  check("Smudge history, duplicate-frame stability, reset and mode isolation", () => {
    solid(left, "#ff0000"); solid(right, "#0000ff"); renderer.reset(); draw("Smudge Fade", 0.5, { time: 1 });
    solid(left, "#00ff00"); solid(right, "#ffff00");
    const options = { time: 2, frameId: "same-logical-frame" };
    const withHistory = draw("Smudge Fade", 0.5, options), duplicate = draw("Smudge Fade", 0.5, options);
    assert(same(withHistory, duplicate, 0), "Duplicate frame advanced feedback");
    renderer.reset(); const withoutHistory = draw("Smudge Fade", 0.5, { time: 2 });
    assert(delta(withHistory, withoutHistory) > 5, "History did not contribute");
    draw("Default", 0.5); const switched = draw("Smudge Fade", 0.5, { time: 2 });
    assert(same(switched, withoutHistory), "Mode switch leaked history");
  });
  check("Same-frame Latch 50 threshold changes update the selected snapshot", () => {
    solid(left, "#ff0000"); solid(right, "#0000ff"); renderer.reset();
    draw("Latch 50", 0.2, { frameId: "latch-controls", time: 10 });
    const p = middle(draw("Latch 50", 0.8, { frameId: "latch-controls", time: 10 }));
    assert(p[2] > 250 && p[0] < 2, "Same-frame crossing did not select right");
  });
  check("Same-frame Scratch endpoint then interior retains the new endpoint side", () => {
    solid(left, "#ff0000"); solid(right, "#0000ff"); renderer.reset();
    const options = { frameId: "scratch-controls", time: 10 };
    draw("Scratch", 0, options); draw("Scratch", 1, options);
    const p = middle(draw("Scratch", 0.7, options));
    assert(p[2] > 250 && p[0] < 2, "Same-frame endpoint bookkeeping retained old side");
  });
  check("Same-frame clock 10 to 12 to 11 clears actual Smudge feedback", () => {
    solid(left, "#ff0000"); solid(right, "#0000ff"); renderer.reset();
    draw("Smudge Fade", 0.5, { time: 9, frameId: "previous-frame" });
    solid(left, "#00ff00"); solid(right, "#ffff00");
    draw("Smudge Fade", 0.5, { time: 10, frameId: "clock-controls" });
    draw("Smudge Fade", 0.5, { time: 12, frameId: "clock-controls" });
    const backward = draw("Smudge Fade", 0.5, { time: 11, frameId: "clock-controls" });
    renderer.reset(); const clean = draw("Smudge Fade", 0.5, { time: 11 });
    assert(same(backward, clean), "Backwards clock retained preceding-frame feedback");
  });
  check("Same-frame controls replace current history without feeding it back", () => {
    solid(left, "#ff0000"); solid(right, "#0000ff"); renderer.reset();
    draw("Smudge Fade", 0.2, { time: 1, frameId: "current-controls" });
    const latest = draw("Smudge Fade", 0.8, { time: 2, frameId: "current-controls" });
    const repeated = draw("Smudge Fade", 0.8, { time: 2, frameId: "current-controls" });
    assert(same(latest, repeated, 0), "Control rerender advanced feedback");
    solid(left, "#000000"); solid(right, "#000000");
    const next = middle(draw("Smudge Fade", 0.5, { time: 3, frameId: "following-frame" }));
    assert(next[2] > 60 && next[2] > next[0] * 2, "Following frame did not retain the latest blue-dominant control output: " + [...next]);
  });
  check("Scaled transparent edge matches Canvas2D and retains straight red at fractional alpha", () => {
    const edge = makeCanvas(2, 1), expected = makeCanvas(4, 1), ctx = edge.getContext("2d");
    const image = ctx.createImageData(2, 1); image.data.set([255, 0, 0, 255, 0, 0, 0, 0]); ctx.putImageData(image, 0, 0);
    expected.getContext("2d").drawImage(edge, 0, 0, 4, 1);
    const reference = expected.getContext("2d").getImageData(0, 0, 4, 1).data;
    const scaled = createVideoTransitions({ width: 4, height: 1 });
    let actual;
    try { actual = pixels(scaled.render(edge, edge, { name: "Crossfade", amount: 0, frameId: 1 })); }
    finally { scaled.dispose(); }
    alphaEdgeProbe.fixture = "2x1 opaque red / transparent black scaled to 4x1";
    alphaEdgeProbe.expectedCanvas2D = [...reference]; alphaEdgeProbe.actualWebGL = [...actual];
    const fractional = [0, 1, 2, 3].filter((x) => actual[x * 4 + 3] > 0 && actual[x * 4 + 3] < 255);
    alphaEdgeProbe.fractionalAlphaIndices = fractional;
    assert(fractional.length > 0, "Fixture did not exercise a filtered alpha edge");
    assert(fractional.every((x) => actual[x * 4] >= 253), "Straight red was darkened by alpha interpolation: " + [...actual]);
    assert(same(actual, reference), "GPU scaling differs from Canvas2D: " + [...actual] + " vs " + [...reference]);
  });
  check("Latch and filtered history paths retain red chroma at transparent edges", () => {
    const edge = makeCanvas(2, 1), ctx = edge.getContext("2d"), image = ctx.createImageData(2, 1);
    image.data.set([255, 0, 0, 255, 0, 0, 0, 0]); ctx.putImageData(image, 0, 0);
    const scaled = createVideoTransitions({ width: 4, height: 1 });
    alphaEdgeProbe.readPaths = [];
    try {
      for (const name of ["Latch 50", "Scratch", "Scratch Fade", "Smudge Fade"]) {
        scaled.reset(); scaled.render(edge, edge, { name, amount: 0.2, time: 1, frameId: 1 });
        const actual = pixels(scaled.render(edge, edge, { name, amount: 0.3, time: 2, frameId: 2 }));
        alphaEdgeProbe.readPaths.push({ name, actualWebGL: [...actual] });
        const visible = [0, 1, 2, 3].filter((x) => actual[x * 4 + 3] > 0);
        assert(visible.length > 0, name + " unexpectedly blank");
        assert(visible.every((x) => actual[x * 4] >= 253 && actual[x * 4 + 1] <= 2 && actual[x * 4 + 2] <= 2), name + " filtered premultiplied input incorrectly: " + [...actual]);
      }
    } finally { scaled.dispose(); }
  });
  check("Reduced motion removes clock-driven ripple while preserving fader control", () => {
    fixture(left); fixture(right, 1); renderer.reset();
    const a = draw("Water Bar H", 0.47, { time: 1.1, reducedMotion: true });
    const b = draw("Water Bar H", 0.47, { time: 2.4, reducedMotion: true });
    assert(same(a, b, 0), "Reduced motion still depends on time");
    assert(delta(a, draw("Water Bar H", 0.7, { time: 2.4, reducedMotion: true })) > 3, "Fader stopped responding");
    renderer.reset(); const animated = draw("Water Bar H", 0.47, { time: 1.1 });
    assert(delta(animated, draw("Water Bar H", 0.47, { time: 1.3 })) > 0.2, "Clock-driven original ripple is inert");
  });
  check("Unknown names fail explicitly and disposal is final/idempotent", () => {
    let rejected = false; try { draw("Invented unknown transition", 0.5); } catch { rejected = true; }
    assert(rejected, "Unknown transition silently substituted"); renderer.dispose(); renderer.dispose();
    rejected = false; try { draw("Default", 0.5); } catch { rejected = true; } assert(rejected, "Disposed renderer accepted work");
  });
  const timingScope = "CPU performance.now wall-clock around render() plus a WebGL finish() invocation, 640x360 output with synthetic canvas inputs. Not a GPU timer-query measurement, presentation timing, decode/effects/composite/capture pipeline latency, sustained frame rate, or 30fps proof. Browser timer resolution/rounding can report 0 or 0.1 ms; these values do not establish a zero-cost frame.";
  const benchmark = { scope: timingScope, samples: [] };
  try {
    const bench = createVideoTransitions({ width: 640, height: 360 });
    for (const entry of videoTransitionCatalog) {
      const before = performance.now(); const output = bench.render(left, right, { name: entry.name, amount: 0.47, time: 2, frameId: entry.name });
      output.getContext("webgl").finish(); benchmark.samples.push({ name: entry.name, ms: +(performance.now() - before).toFixed(2) });
    }
    bench.dispose();
  } catch (error) { benchmark.error = error.message; }
  checks.push({ name: "640x360 render sample completed for all 34 entries", passed: !benchmark.error && benchmark.samples.length === 34, ...(benchmark.error ? { error: benchmark.error } : {}) });
  const result = { passed: checks.filter((c) => c.passed).length, failed: checks.filter((c) => !c.passed).length, checks, alphaEdgeProbe, benchmark, timingScope, durationMs: +(performance.now() - start).toFixed(1), evidence: "Executed actual WebGL draw/readPixels on original synthetic canvas fixtures; no Serato/UI integration or visual-parity proof." };
  window.videoTransitionHarnessResult = result;
  $("#results").textContent = JSON.stringify(result, null, 2);
  $("#status").textContent = `${result.passed} passed / ${result.failed} failed`;
  renderer = createVideoTransitions({ width: W, height: H }); fixture(left); fixture(right, 1); preview();
  return result;
}
function preview() {
  renderer ??= createVideoTransitions({ width: W, height: H });
  const output = renderer.render(left, right, { name: $("#transition").value || "Crossfade", amount: Number($("#amount").value), time: performance.now() / 1000, frameId: ++sequence });
  $("#preview").replaceChildren(output); output.style.width = "640px";
}
$("#transition").innerHTML = videoTransitionCatalog.map((c) => `<option value="${c.name}">${c.name} (${c.provenance})</option>`).join("");
$("#transition").value = "Crossfade";
$("#run").onclick = async () => {
  $("#run").disabled = true; $("#status").textContent = "Running actual pixel checks…";
  await new Promise((resolve) => requestAnimationFrame(resolve));
  try { await runVideoTransitionChecks(); } catch (error) { $("#status").textContent = "Harness failed"; $("#results").textContent = error.stack; window.videoTransitionHarnessResult = { passed: 0, failed: 1, fatal: error.message }; }
  finally { $("#run").disabled = false; }
};
$("#transition").onchange = () => { renderer?.reset(); preview(); };
$("#amount").oninput = preview;
fixture(left); fixture(right, 1);
try { preview(); } catch (error) { $("#status").textContent = "WebGL initialization failed"; $("#results").textContent = error.stack; }
