import {currentVideoTransitions,videoMenuEvidence} from './video-reference-menu.js';
import { transitionVertexShader, transitionFragmentShader } from "./video-transitions-kernel.js";
import { createTransitionState } from "./video-transitions-state.js";

// Factual names only: 7 manifest definitions, 26 additional localization labels.
// Algorithms/contracts below are original interpretations, never Serato parity.
// Center/Latch50/Scratch now follow broad historical manual semantics; exact
// curves, threshold bands, hysteresis and current-version behavior remain unknown.
const definitions = [
  ["Luma Key Fade", "Shader", "manifest", "Reveal incoming pixels by their luminance threshold."],
  ["Upfaders Only", "Blend", "manifest", "Ignore crossfader; add both independently upfaded sources, including at endpoints."],
  ["Additive Average", "Blend", "manifest", "Normalize overlapping two-stage additive weights."],
  ["Additive", "Blend", "manifest", "Overlap both sources at full weight in the middle; clamp their sum."],
  ["Difference Fade", "Blend", "manifest", "Crossfade through absolute color difference at the midpoint."],
  ["Smudge Fade", "Shader", "manifest", "Spatial smear with a bounded trail of the preceding rendered frame."],
  ["Melt", "Shader", "manifest", "Independent column-dependent vertical drips reveal the incoming image."],
  ["Default", "Blend", "localized-candidate", "Independent linear premultiplied-alpha crossfade."],
  ["Center", "Blend", "localized-candidate", "Live linear crossfade only across fader25%–75%; independent curve from historical central-half description."],
  ["Scratch", "Latch", "localized-candidate", "Live end-cut selection: independent5%/95% bands, retained side between bands, nearest-side initialization; no frozen frame."],
  ["Latch 50", "Latch", "localized-candidate", "Live hard cut at50%; independent tie selects right. No source-frame capture."],
  ["Scratch Fade", "Latch", "localized-candidate", "Live additive upfader mix in the interior; independent5%/95% end bands gate the opposite channel. No captured frames."],
  ["Box H", "3D", "localized-candidate", "Compress outgoing/incoming horizontal faces with independent depth shading."],
  ["Box V", "3D", "localized-candidate", "Compress outgoing/incoming vertical faces with independent depth shading."],
  ["Box Both", "3D", "localized-candidate", "Alternate exact Box H/V geometry on observed endpoint departures, first H after reset; interior reversals keep the current axis."],
  ["Spin H", "3D", "localized-candidate", "Horizontal-axis coordinate compression simulates a horizontal card flip."],
  ["Spin V", "3D", "localized-candidate", "Vertical-axis coordinate compression simulates a vertical card flip."],
  ["Spin Both", "3D", "localized-candidate", "Combine two-axis compression with an in-plane half turn."],
  ["Wipe H", "Wipe", "localized-candidate", "Incoming image reveals left to right."],
  ["Wipe V", "Wipe", "localized-candidate", "Incoming image reveals top to bottom."],
  ["Swap", "Swap", "localized-candidate", "Translate both panels past each other with a depth-offset changeover."],
  ["Push Slide H", "Slide", "localized-candidate", "Incoming panel pushes outgoing panel left without rescaling."],
  ["Push Slide V", "Slide", "localized-candidate", "Incoming panel pushes outgoing panel up without rescaling."],
  ["Tile Wave H", "3D", "localized-candidate", "Left-to-right column wave of live flips in an independent6×4 tile field; rows share progress."],
  ["Tile Wave V", "3D", "localized-candidate", "Top-to-bottom row wave of live flips in an independent6×4 tile field; columns share progress."],
  ["Water Bar H", "3D", "localized-candidate", "Horizontal reveal with row-dependent beat-clock ripples; level controls ripple depth."],
  ["Water Bar V", "3D", "localized-candidate", "Vertical reveal with column-dependent beat-clock ripples; level controls ripple depth."],
  ["Tornado", "3D", "localized-candidate", "Counter-rotating radial warps with a growing center reveal."],
  ["Grid 2x2", "Slide", "localized-candidate", "Four cells wipe locally with alternating start delays."],
  ["Grid Simple", "Slide", "localized-candidate", "Exactly3×3 cells switch live inputs one at a time in independent row-major order."],
  ["Grid Pop", "Slide", "localized-candidate", "Incoming image grows independently inside 4 by 3 cells."],
  ["Grid Fade", "Slide", "localized-candidate", "Exactly3×3 cells fade live inputs one at a time in independent row-major order, linear local fades."],
  ["Grid Sequence", "Slide", "localized-candidate", "Exactly3×3 cells switch live inputs in an independently seeded Fisher-Yates permutation renewed per observed endpoint departure."],
  ["Crossfade", "Open Play", "open-play-baseline", "Open Play linear baseline alias, separate from reference-name candidates."],
];

export const videoTransitionCatalog = Object.freeze(definitions.map(([name, category, provenance, contract], kernelIndex) => Object.freeze({
  name, category, provenance, kernelIndex, contract,
  functionalIndependentImplementation: true,
  referenceRuntimeAvailability: provenance === "open-play-baseline"?"Independent Open Play baseline":currentVideoTransitions[name]?'Observed installed4.0.10 menu2026-10-17':'Not seen in installed4.0.10 popup; historical resource only',
  referenceMenuVisible:!!currentVideoTransitions[name],referenceMenuLabel:currentVideoTransitions[name]??name,referenceMenuEvidence:videoMenuEvidence,
  referenceAlgorithm: "unknown",
  referenceEquivalent: false,
  candidate: provenance === "localized-candidate",
  baseline: provenance === "open-play-baseline",
  temporal: ["Smudge Fade", "Scratch", "Box Both", "Grid Sequence"].includes(name),
  endpointContract: name === "Upfaders Only" ? "Add independently upfaded sources at every amount" : "Live left at 0, live right at 1, each with its own upfader",
})));

const byName = new Map(videoTransitionCatalog.map((entry) => [entry.name, entry]));
const unit = (value, fallback = 1) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : fallback));

/** Original GPU renderer; amount/upfaders/levels are normalized, time is seconds.
 * A repeated frameId re-renders controls without advancing the history ring.
 * Its latest output replaces that frame's history; threshold/clock updates run.
 * Changing mode/input identity, reversing time, or reset() clears prior history.
 * reducedMotion removes clock-driven motion/trails; direct fader geometry remains.
 * Output is a persistent straight-alpha canvas. Caller owns scheduling/integration.
 */
export function createVideoTransitions({ width = 640, height = 360 } = {}) {
  if (![width, height].every((n) => Number.isInteger(n) && n > 0 && n <= 4096))
    throw new RangeError("Video transition dimensions must be integers from 1 to 4096.");
  const canvas = typeof document !== "undefined" ? document.createElement("canvas") :
    typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(width, height) : null;
  if (!canvas) throw new Error("Video transitions require a browser canvas with WebGL.");
  canvas.width = width; canvas.height = height;
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: true });
  if (!gl) throw new Error("Video transitions require WebGL; no placeholder renderer was substituted.");
  if (Math.max(width, height) > gl.getParameter(gl.MAX_TEXTURE_SIZE))
    throw new RangeError("Video transition dimensions exceed this GPU's texture limit.");
  let disposed = false, historyIndex = 0, historyValid = false, frameHistory = null, frameHistoryValid = false;
  const state = createTransitionState(), textures = [], shaders = [];
  const makeShader = (type, source) => {
    const shader = gl.createShader(type); shaders.push(shader);
    gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader); shaders.forEach((s) => gl.deleteShader(s));
      gl.deleteProgram(program);
      throw new Error("Video transition shader failed: " + message);
    }
    return shader;
  };
  const program = gl.createProgram();
  const precision = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
  const fragment = precision?.precision ? transitionFragmentShader : transitionFragmentShader.replace("precision highp float;", "precision mediump float;");
  gl.attachShader(program, makeShader(gl.VERTEX_SHADER, transitionVertexShader));
  gl.attachShader(program, makeShader(gl.FRAGMENT_SHADER, fragment));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program); gl.deleteProgram(program); shaders.forEach((s) => gl.deleteShader(s));
    throw new Error("Video transition program failed: " + message);
  }
  shaders.forEach((s) => { gl.detachShader(program, s); gl.deleteShader(s); });
  gl.useProgram(program);
  const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  gl.disable(gl.BLEND); gl.disable(gl.DEPTH_TEST); gl.viewport(0, 0, width, height);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  // Filtering must interpolate premultiplied colors, including latch captures.
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
  for (let i = 0; i < 6; i++) {
    const texture = gl.createTexture(); textures.push(texture); gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  }
  const historyFramebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, historyFramebuffer);
  for (const texture of textures.slice(2, 4)) {
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      gl.deleteFramebuffer(historyFramebuffer); textures.forEach((t) => gl.deleteTexture(t));
      gl.deleteBuffer(buffer); gl.deleteProgram(program);
      throw new Error("Video transition history framebuffer is incomplete.");
    }
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  const uniform = Object.fromEntries(["leftSource", "rightSource", "historySource", "latchLeft", "latchRight", "kind", "amount", "clockTime", "tempo", "historyReady", "latchSide", "motion", "upfaders", "levels", "scratchGates", "gridOrder[0]", "premultipliedOutput"].map((name) => [name, gl.getUniformLocation(program, name)]));
  ["leftSource", "rightSource", "historySource", "latchLeft", "latchRight"].forEach((name, i) => gl.uniform1i(uniform[name], i));
  function upload(texture, source) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    const ready = source && (source.readyState === undefined || source.readyState >= 2) &&
      (source.videoWidth ?? source.width ?? 0) > 0 && (source.videoHeight ?? source.height ?? 0) > 0;
    if (ready) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  }
  function reset() {
    state.reset(); historyValid = false; frameHistoryValid = false; frameHistory = null;
  }
  function render(left, right, options = {}) {
    if (disposed) throw new Error("Video transition renderer is disposed.");
    if (gl.isContextLost()) throw new Error("Video transition WebGL context lost; recreate the renderer.");
    const name = options.name ?? "Crossfade", entry = byName.get(name);
    if (!entry) throw new RangeError("Unknown video transition: " + name);
    const amount = unit(options.amount, 0.5), time = Number.isFinite(options.time) ? options.time : 0;
    const transition = state.advance({ name, amount, time, frameId: options.frameId, left, right });
    if (transition.resetHistory) { historyValid = false; frameHistoryValid = false; }
    if (transition.freshFrame) { frameHistory = textures[2 + historyIndex]; frameHistoryValid = historyValid; }
    gl.useProgram(program); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    // Binding uploads to unit zero is safe: all sampler bindings are restored below.
    gl.activeTexture(gl.TEXTURE0); upload(textures[0], left); upload(textures[1], right);
    if (transition.captureLatch) { upload(textures[4], left); upload(textures[5], right); }
    [textures[0], textures[1], frameHistory ?? textures[2], textures[4], textures[5]].forEach((texture, i) => {
      gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, texture);
    });
    gl.uniform1i(uniform.kind, name === "Box Both" ? (transition.boxAxis === 0 ? 12 : 13) : entry.kernelIndex); gl.uniform1f(uniform.amount, transition.mixAmount);
    gl.uniform1f(uniform.clockTime, options.reducedMotion ? 0 : time % 3600);
    gl.uniform1f(uniform.tempo, Math.max(1, Math.min(999, Number.isFinite(options.bpm) ? options.bpm : 120)));
    gl.uniform1f(uniform.historyReady, frameHistoryValid ? 1 : 0);
    gl.uniform1f(uniform.latchSide, transition.side); gl.uniform1f(uniform.motion, options.reducedMotion ? 0 : 1);
    gl.uniform2f(uniform.upfaders, unit(options.upfaders?.[0]), unit(options.upfaders?.[1]));
    gl.uniform2f(uniform.scratchGates, ...transition.upfaderGates);
    gl.uniform1fv(uniform["gridOrder[0]"], transition.sequenceOrder);
    gl.uniform2f(uniform.levels, unit(options.leftLevel, 0), unit(options.rightLevel, 0));
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.uniform1f(uniform.premultipliedOutput, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    if (name === "Smudge Fade") {
      // Never copy straight-alpha display pixels into a filtered history texture.
      // Re-render into the other texture in premultiplied form. Duplicate IDs
      // overwrite their current-frame target without sampling/advancing it.
      const destination = transition.freshFrame ? 1 - historyIndex : historyIndex;
      gl.bindFramebuffer(gl.FRAMEBUFFER, historyFramebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textures[2 + destination], 0);
      gl.uniform1f(uniform.premultipliedOutput, 1);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.uniform1f(uniform.premultipliedOutput, 0);
      historyIndex = destination; historyValid = true;
    }
    return canvas;
  }
  function dispose() {
    if (disposed) return;
    disposed = true; reset(); textures.forEach((t) => gl.deleteTexture(t));
    gl.deleteFramebuffer(historyFramebuffer); gl.deleteBuffer(buffer); gl.deleteProgram(program);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
  return { render, reset, dispose };
}
