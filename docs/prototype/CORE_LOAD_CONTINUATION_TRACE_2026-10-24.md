# Four-deck load continuation and capture overhead — 24 October 2026

The load-completion redraw now refreshes only current visible owners of the arriving track. Three matched replacement continuations fell from **8.8–9.5 ms to 2.6–3.7 ms**. This is one measured improvement; broader stalls and intermittent audible pops remain open.

The previous analyzed-control and concurrent-Sync ownership repairs remain intact. This pass preserves every layout, custom control and library waveform preview. No audio clock, DSP, analyzer algorithm, normal profile or original music was changed. Native startup is a separate pending gate; the existing 0.1.48 session was left untouched.

Outcome: a stable core four-deck workflow, with measured failures tracked until their actual acceptance passes. Now: deliver this bounded redraw/capture slice. Next: measure asynchronous profile-ready redraw ownership and the remaining cold-decode/structural/unattributed frames. Later: native moving-frame, physical held gestures, listening and hardware acceptance. No broad refactor or new advanced-feature work.

## Measured product repair

A private exact-source probe pins the unmodified 2550182 app/engine and measures the synchronous load continuation after `await engine.buffer(t)` through `renderTracks()`. It adds no await, scheduling or ownership behavior. Subspans cover immediate scratch/analysis/stem prefixes, overview painting and library refresh. Setup marks are retained but excluded using their actual start time; a buffer present after decoding is not evidence of an initial cache hit.

| Same three cold replacements | Before (ms) | After (ms) |
| --- | --- | --- |
| Synchronous continuation | 9.5 / 8.8 / 9.3 | 2.6 / 2.6 / 3.7 |
| Overview paint | 9.1 / 8.5 / 8.8 | 2.4 / 2.3 / 3.4 |
| Library refresh | 0.4 / 0.3 / 0.4 | 0.2 / 0.3 / 0.3 |

One decoded-track completion had repainted all four static overviews. The one-line product repair calls existing `drawWaves(t)`, retaining duplicate owners while skipping hidden/replaced owners. Library refresh, prep/analysis/gain scheduling, shared detailed-waveform ticking and explicit global callers are unchanged. The asynchronous source-profile-ready callback is still global and remains a separate measurement target.

Actual extracted load/draw functions fail 2/3 controlled regressions before and pass 3/3 after: current/duplicate/hidden owners, replacement during pending decoding, fresh labels, library refresh and global fallback. These sentinels do not establish physical/browser gesture acceptance. The first isolated setup was safely closed before any measured playback to correct a collector event-name mismatch; no timed or captured-audio result was discarded.

## Diagnostic capture repair

A retained 50.9 ms post-capture continuation (31.8 ms in another run) performed binary/Base64/JSON/DOM export after the worklet had transferred all requested samples. That is diagnostic overhead, not an established product Sync/pop mechanism. The harness disconnects and closes the capture route first, then encodes 49,152-byte aligned chunks with yields. Labels, acquisition `startFrame`, sample rate, complete PCM and latest/archive/event selectors remain unchanged. The later export wall time is not acquisition time.

Actual capture-function tests were RED 0/2, then GREEN 2/2 for twelve-second and odd-frame outputs. They compare full bytes and Base64, metadata, routing cleanup, bounded encoding calls and control-task interleaving. Final join/JSON/DOM is still synchronous. The known initial capture-port continuation did not appear among the long-frame scripts in either matched probe or the final session; later yielding slices may be timer-attributed, so this is not proof of zero export overhead.

## Executed runtime and remaining stalls

Both matched probes completed about 75 seconds, stopped without reported errors, and retained six lazy library previews. Each had one long animation frame: 59.2 ms before, 52.8 ms after. Decoder-await-attributed scripts were 16.0 and 9.4 ms, with zero forced-layout time. Await attribution does not measure native decoder CPU.

The full current-source session completed **321.152 seconds / 15 rotations / eight fresh analysis jobs** on eight additional verified real songs, distinct from the previous sixteen. All eight results retained 256 controls/nodes; three currently loaded results retained focused tempo values and five unloaded results left controls intact. Gain deferral and outgoing-master ownership passed. Raw double-Sync, key-lock triple-Sync, paused/playing incoming Sync, horizontal/vertical views and two-to-four key locks passed their software contracts. All 43 Load and 20 Play checks, then 24 stopped compact layout combinations, passed. Final core-control counts are four each; six lazy previews remain. No library row or preview nodes were removed.

The final run still has **7 long animation frames, worst 140.7 ms**, and maximum frame interval 141.6 ms; tick p95 spans 0.7–1.3 ms. Five long frames contain decoder-await-attributed scripts of 8.2–12.1 ms. One has no script attribution and is the largest frame; its cause remains unproven. Another includes a 22.1 ms trace-wrapped task and a 13.5 ms frame callback. Its geometry stack resolves to the product orientation-change `renderDecks → drawWaves` path, with 7.8 ms forced layout; the wrapper URL alone is not the cause. Explicit structural changes still remove 39 deck articles, six shared canvases and 24 mixer strips. These results do not support a universal lag fix.

Source-grid error stays within 5.1047 microseconds in sampled checks. All 23 complete PCM windows across probes/final total 148 seconds, finite and non-silent; the three targeted final worker completions fall inside their twelve-second captures. Zero-run telemetry after startup is zero, but source-grid/finite samples do not prove musical downbeats, absence of clicks or physical output quality. All physical outputs were muted. All eight original hashes, sizes and mtimes, the isolated session and all eighteen final runtime source hashes passed independent verification. Four protected active decoded buffers total 573,096,392 bytes; an inactive-cache budget does not cap necessary active buffers or total RSS.

The existing source-waveform browser harness also passed 24 raster cases and pending playback-profile acquisition. No buffer/profile change was justified. The WebAudio standard describes acquisition/detachment ([W3C AudioBuffer](https://www.w3.org/TR/webaudio/#AudioBuffer)); that hypothesis did not reproduce a failure in this browser.

## Sync scope and verification

Three additional actual-engine controlled tests cover pending Sync superseded by Seek, replacement ownership, and temporary Cue. All nine ownership tests and 31 combined focused checks pass, with no new transport failure reproduced. The replacement test is an engine ownership boundary, not full app Load/DOM proof. No speculative audio rewrite was made. The full Node suite passes **136/136**. Three parallel read-only reviews found no blocker in source scope, exact capture bytes or inspector schema/timestamp handling.

[Runtime/source/control/frame receipt](load-continuation-results.json) · [Complete PCM and original-integrity inspection](load-continuation-pcm-inspection.json). Raw audio, per-track file paths and private probes remain in ignored `local-evidence/`.

## Delivery and board

The verified source slice is ready for immutable desktop 0.1.50 packaging and Trello readback. Those delivery gates are pending at this source checkpoint. The prior 0.1.49 package and all older bundles remain unchanged. Native startup, physical held-pointer behavior, audible manual transition/EQ/Cue/clean stop, headphone/master/controller isolation, full parity and the intermittent Sync pop remain open.
