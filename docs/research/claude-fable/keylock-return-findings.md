# Keylock return after scratch — independent findings (Fable 5.1, 2026-10-17)

Read-only bounded diagnosis. Nothing was executed, no browser/test run, no production, harness or vendor source changed. This is the only file written. Not the Serato completeness audit; "full 1:1 incomplete" and "native forbidden until an HTML revision is approved" labels are preserved unchanged.

Inputs read: the six JSON artifacts named in the brief (main-UI observations/audio inspection, adapter, engine, lead sweep, retained-return initial), both review markdowns, `prototype/keylock-live.js`, `keylock-live-lead-experiment.js` (diffed against the adapter), `keylock-retained-return-harness.js`, vendor `SignalsmithStretch-open-play-disposable.mjs` + `PATCHES.md` + `UPSTREAM_README.md`, and `engine.js` scratch/keylock ownership paths only (raw-PCM cache WIP not reviewed, not accepted).

## 1. Evidence ledger

| Status | Claim | Evidence |
|---|---|---|
| Executed (parent) | Main UI: 90/92 active 250 ms bins at 880 Hz; bins 15.00 and 15.25 dominant 476 Hz after a 1 s stationary hold/release | `deck-scratch-main-ui-audio-inspection.json` `windows[60..61]`, `releaseDefect` |
| Executed (parent) | Lead sweep: 8/8 ran, 4/8 pass (40/60/120/200 ms). Fresh onset after requested output: 0 ms→+28.7 ms, 5→+36.7, 10→+14.7, 20→+5.7, ≥40→−1.0…−1.3. Prewarmed restart onset −1 ms at every lead. Live seek first-correct 1100 Hz window start: 0→+60, 5→+50, 10→+50, 20→+40, ≥40→0 ms | `keylock-live-lead-browser-results.json` `checks[*].evidence.{fresh,restart,seek}.observed` |
| Executed (parent) | Lead-0 seek transition is a soft crossfade, not a cut: window RMS .082→.067 (−18 %) over windows starting +0.03…+0.06 s, 880→1100 dominance flips between the +0.05 and +0.06 windows; no 475 Hz window | same file, `checks[0].evidence.seek.observed.windows[5..16]` |
| Executed (parent) | Retained return: 46/54 measured, 0 pass, all 46 settled pitch correct, 0 wrong-pitch windows after +30 ms, initial silence 39–46 / 59–67 / 169–176 ms for 40/60/170 ms leads; onset == gap in every row; 4 "not actually muted" fatals, 1 armed frame duplicate/skip (seq 694 repeats frame 2830464, seq 695 reports 2830720) producing 2 fatals | `keylock-retained-return-browser-initial-results.json` `checks[*].observed`, `fatalErrors[0..5]` |
| Executed (parent) | Missing rows (8): (1.08,−12,.06,different), (1.08,−12,.17,same+different), (2,−12,.06,same+different), (2,+12,.06,same+different), (2,+12,.17,different) | derived from `checks` vs `rates×shifts×leads×regions` |
| Source-proven | `latency()` = `inputLatencySeconds + outputLatencySeconds` from WASM `_inputLatency()/_outputLatency()`; the split is not exposed to the main thread | vendor `.mjs` L58–60, L219–220 |
| Source-proven | `process()` selects the time-map segment at `currentTime + outputLatencySeconds`, maps `inputTime = input + (that − output)·rate`, reads a window of `bufferLength = inputLatency+outputLatency` samples ending at `inputTime + inputLatencySeconds`, then `_seek(bufferLength, rate)` + `_process(0, block)` every block ("constantly seeking") | vendor `.mjs` L250–256, L292–338 |
| Source-proven | Inactive segment: input buffers zero-filled and `_process(block, block)`; the processor keeps running with zeros, so after a pause its internal history is zeros | vendor `.mjs` L271–278 |
| Source-proven | Upstream: "The node compensates for its own latency … otherwise you'll have a softer transition as it catches up"; `latency()` is "how far ahead you might want to schedule" | `UPSTREAM_README.md` L19, L55 |
| Source-proven | Production adapter minimum lead = `group.latency + 2·128/sampleRate` (≈125.3 ms at 48 k); experiment clone differs only in `at()`/`update()`/`seek()` minimum and in issued/ACK telemetry | `keylock-live.js` L78, L94–95; diff vs `keylock-live-lead-experiment.js` |
| Source-proven | Gain gate: `program()` schedules the node; `schedule()` sets per-node gain 1 at `output` (`gainAt`), so pre-roll synthesized before `output` is muted; `pause()` sets gain 0 at `max(currentTime, when)` then programs `active:false` | `keylock-live.js` L79, L87–89, L97 |
| Source-proven | `beginDeckScratch` → `stopSource` → `disposeVoice` → `liveKeylock.dispose()` (owner destroyed). `endDeckScratch` → transport `end` (raw resumes) → `start(d)` → `startForwardKeylock` → new factory (`Stretch()` per source, `latency()`, `fill()` 1 s preroll + 8 s lookahead in .5 s chunks) → `start({when: currentTime + maxLatency + .05})` (=170 ms) with the old raw voice audible until `ack.when` (`handoffBefore`, `retireVoiceAt`) | `engine.js` L1101–1104, L1138–1146, L287–321, L225 |
| Source-proven | Six-case engine harness checks release via `measured(...)` low-RMS/settled tone with `releaseMaximumBelow005Ms: 20`; no short-window pitch criterion across the release instant | `keylock-engine-browser-results.json` `budgets`; `keylock-engine-harness.js` L28–33 |
| Source-proven | `measurePause` computes `spectrum()` then `assert(m.rms<1e-4 && m.peak<1e-4)` before returning; outer `catch` keeps only `pair` fields; `holdStart = max(context.currentTime, pause.when)` read on the main thread | `keylock-retained-return-harness.js` L20, L24 |
| Inferred | The 476 Hz bins are the raw voice between `end` and `ack.when`: build time (factory + 17 chunk copies/ACKs) + 170 ms lead. The 250 ms bin grid bounds the raw interval to roughly 250–750 ms, not exactly | engine path above + inspection bins |
| Inferred | Processor history on the output side is ≈60 ms: a seek applied with lead < ~55 ms becomes audible ≈ issue + 60–65 ms regardless of lead (0→+60, 10→+65, 20→+65 after issue). This matches a 120 ms total split roughly in half, but the split was not read | lead sweep seek rows |
| Inferred | Inactive→active rise is ≈25–40 ms after issue (fresh 0 ms lead onset +28.7 ms = issue+28.7; 5 ms lead issue+41.7; 10 ms issue+24.7; 20 ms issue+25.7). Not monotonic in lead → run-to-run jitter of one or two quanta plus message latency | lead sweep fresh rows |
| Unknown | Whether the four mute fatals are one edge quantum of tail or sustained output. Numeric RMS/peak, first/last nonzero frame were discarded by the assert-before-save | harness L20 |
| Unknown | Exact `_inputLatency`/`_outputLatency` split and whether `_seek` clears the OLA accumulator. Not read from upstream C++ this session | — |
| Unknown | Serato's actual keylock behaviour across scratch release (bypass during scratch, re-engage crossfade length). Not verified; "full 1:1 incomplete" stands | — |

## 2. Q1 — what the queried latency and schedule times mean with preloaded PCM

- **Queried latency (120 ms)** is the WASM's own input+output algorithmic history, not a wall-clock scheduling requirement and not an IPC cost. It is the window length the processor re-analyses every block (`bufferLength`).
- **Schedule `output`** is honoured on the output clock: in steady state the audio emerging at wall time W is the source at `input(W)`. Measured: onset −1 ms and correct pitch at `output` for every lead ≥40 ms and for every prewarmed restart including 0 ms lead. The vendor's "compensation" is the `+outputLatencySeconds` look-ahead when choosing the segment and the `+inputLatencySeconds` offset when filling the window.
- **Explicit lead** only matters when the change must *replace* history already synthesized. Two distinct floors were measured:
  - inactive→active: sound rises ≈25–40 ms after the main-thread issue (from zeros; the adapter gate at `output` hides the ramp if lead ≥ ~40 ms, else there is a gap);
  - active→active seek: the old region persists ≈60 ms after issue as a soft crossfade (RMS dip ≈18 %). With lead ≥ ~55 ms the crossfade completes before `output` and is inaudible as "stale"; with less lead it is exposed.
- **Main-thread ACK** (`scheduleAcknowledgedAt == scheduleIssuedAt` in every row) proves only that the worklet received and pushed the segment; it is not audible timing. The ACK's `position` is the requested input, exact to one sample by construction, not an audible cursor.
- **Old-clock bridging** (`handoffBefore` in engine) is the raw voice; it is the defect, not a latency artefact.
- **Processor history** is the only hard physical constraint found: ≈60 ms of synthesized output cannot be recalled by a later seek, and a paused processor needs ≈25–40 ms to rise from zeros.

Proven: everything in the ledger's "Executed"/"Source-proven" rows. Inferred: the two floors generalise beyond one 48 kHz run on one machine. Unknown: behaviour at 44.1 k, under load, on other hardware.

## 3. Q2 — is a retained/prewarmed owner sufficient?

**No, not as a paused owner.** Retained-return proves the paused owner removes the factory build but still has `gap == lead` (39–46 ms at the smallest tested lead), and the lead sweep proves leads below ≈40 ms produce late onset. Both floors exceed the 20 ms gap budget. Any design that *switches on* the stretcher at release inherits the 25–40 ms rise. Both measured approaches failed for the same physical reason, not for implementation bugs.

### Smallest justified next implementation: a muted, active **shadow follower**

Keep the live owner alive, **active and muted**, continuously re-seeking to the scratch transport's audible cursor during the gesture, so that at release its pipeline is already carrying correct-pitch audio from within a few tens of ms of the right position. Release becomes a *gain switch* (no stretcher activation, no rebuild) plus one alignment seek.

Concrete shape (engine + adapter only; no vendor change):

1. `beginDeckScratch`: instead of `stopSource` disposing `liveKeylock`, move the adapter to `voice.shadowKeylock` with output gains 0 (`gainAt(output.gain, 0, now)` on `adapter.outputs`), keep its `liveOwnerController`. Route the scratch transport as today. Raw scratch sound is unchanged and correct (scratch is supposed to be raw).
2. While a gesture is active, every `FOLLOW_MS` (start at 25 ms) call `shadow.seek(transport.state().audiblePosition, {when: now + FOLLOW_LEAD})` with `FOLLOW_LEAD` = 40 ms (the smallest lead with onset/pitch pass in the sweep). `operation()` already aborts a superseded pending op, so bursts are safe. Position error at any instant ≤ `FOLLOW_MS · rate` (27 ms at 1.08; 100 ms at the policy ceiling of 4).
3. `endDeckScratch`: issue transport `end` **and immediately mute its gates** (`pause` command exists: `disposeVoice` uses it); do not let raw resume. In the same main-thread turn: `gainAt(shadow.output.gain, 1, now)` with a 2–5 ms ramp, then `shadow.seek(result.position, {when: now + .04})` for exact alignment. Promote `shadowKeylock` back to `liveKeylock`; set `d.anchor*` from that ACK.
4. Invalidate the shadow on any rate/key/keylock change, track replace, pause, eject, Stem Slip, out-of-window scratch (coverage fails → `newGroup` runs muted; if still preparing at release, hold **silence**, report it, never raw), reentrant Begin while a shadow exists (dispose the older one), and owner error.

Expected audible result from the measured numbers: pitch correct from the first audible frame (the shadow has been active throughout), low-RMS gap ≤ one or two quanta (2.7–5.3 ms) from the gain switch, a ≤60 ms soft crossfade from "within FOLLOW_MS·rate of cursor" to the exact cursor, RMS dip ≤ ~20 %. No raw bridge, no hidden silence, no offline fallback, no relaxed thresholds.

Tradeoffs and missing proof:
- CPU: the stretcher runs during the scratch (it already does during playback; stems = 5 nodes). Not measured.
- Stationary hold produces a repeating ≤FOLLOW_MS grain inside the muted shadow; harmless while muted, but the first audible ≤100 ms after release is a fragment from up to `FOLLOW_MS·rate` ahead of the cursor. Audibility unproven; the alignment seek bounds it.
- Not proven: that frequent seeks (every 25 ms) keep the 60 ms crossfade well-behaved (overlapping crossfades); that a gain ramp at `now` lands within two quanta in the real engine graph; behaviour at rate 4 or for a hard throw whose cursor leaves the 1 s preroll / 8 s lookahead window.
- Alternative smaller unit if a 40 ms gap is ever accepted by a reference measurement: retained paused owner + mute raw at release + 40 ms lead. Rejected here only because the 20 ms budget is the standing criterion; it is not a relaxed-acceptance proposal.

### Strongest alternative explanation
That the two failures are harness/IPC artefacts (message latency, capture-window alignment) rather than processor physics. Against it: restart onset is −1 ms at *every* lead including 0 (so IPC is not the floor), the seek crossover lands at issue+60–65 ms for three different leads (lead-independent → history-bound), and upstream documents the "softer transition". It is still worth one falsifying check: a seek at 40 ms lead from an active shadow must show **no** 880 Hz window after `output` (this is exactly what the lead sweep's 40 ms seek row already shows: first correct at 0 ms, zero wrong windows).

## 4. Q3 — pause observability before assertion

Change only `measurePause` (harness, not production), preserving the exact `1e-4` RMS and peak criterion and keeping every failed row:

1. Build the record first: `{pause, holdStart, holdEnd, firstFrame, lastFrame, rms, peak, firstNonzeroFrame, lastNonzeroFrame, nonzeroFrames, rms1msBins[], pauseIssuedAt, pauseAckAt, captureBlockFramesCoveringNonzero[]}` where `pauseIssuedAt = context.currentTime` before `adapter.pause()`, `pauseAckAt` after it, and the frame fields come from the already-captured PCM.
2. Push it to `pair.holdAttempts` (and to the final condition row as `actualOneSecondHold`/`intermediateHold`) **then** `assert`. The fatal entry must carry the same record. Blocked return conditions stay listed as `blockedBy: 'hold-not-muted'` rows, not silently absent.
3. Add one request to the capture worklet: `{type:'now'}` → `{frame: currentFrame}` issued immediately after the pause ACK, recorded as `renderFrameAtAck`.

Minimum discrimination rule (recorded, not asserted): nonzero frames confined to `[holdStart·sr, renderFrameAtAck + 384]` (≤3 quanta past the ACK frame) and `lastNonzeroFrame − firstNonzeroFrame ≤ 384` ⇒ consistent with an output-edge quantum rendered before the gain command was applied. Any nonzero frame beyond that, or a second nonzero run, ⇒ genuine residual (gate not applied, stale segment, or another owner). One 128-frame quantum of 0.08 RMS inside a 1 s window already yields RMS ≈ 0.004 ≫ 1e-4, so the existing criterion cannot distinguish these two cases on its own; only the frame geometry can. Do not rerun to obtain green; a rerun is only justified once the record exists, and its result is evidence either way.

Also retain, for the frame duplicate/skip, the compact producer `(frame, sequence)` neighbourhood ±4 blocks around any armed gap. No timestamp rewrite.

## 5. Q4 — patch order and real-browser acceptance

Order (each step reversible, each gated on the previous step's measured result):

1. **Harness observability** (`keylock-retained-return-harness.js` `measurePause` as in §4; `(frame,sequence)` neighbourhood). Mechanical; Codex, low effort.
2. **Shadow-follower experiment harness** (new `prototype/keylock-shadow-return-harness.{html,js}` + Node analyzer test): clone of the retained harness where the owner stays active/muted and re-seeks every 25 ms to a scripted cursor (stationary 1 s; moving ±0.5 s/s; far throw to +6 s), then release = gain 1 at `now` + alignment seek at +40 ms. Source: 440/550 Hz regions **plus a 10 Hz click train with region-specific tone** so return cursor is measured by click phase, not just region. Matrix: rates {.5, 1.08, 2} × shifts {−12, 0, +12} × cursor {same, different, far} × hold {quick 50 ms, held 1 s}. Design review Fable high; implementation Codex; parent executes.
3. **Engine integration** behind the existing `createForwardKeylock` seam (`beginDeckScratch`/`endDeckScratch`/`stopSource` ownership only; no vendor, no adapter DSP change). Codex with Fable review; HITL before merge.
4. **Six-case engine harness extension**: add short-window pitch across release and the criteria below; keep the existing six checks unchanged.
5. **Main-UI recapture** of the original gesture (Space hold 1 s, +12, keylock, 1.08) with the same ffmpeg inspection plus 40 ms/10 ms-hop windows across 14.5–16 s.

Acceptance (all measured in the real browser; Node passes are preparation only):

| Criterion | Pass | Reject |
|---|---|---|
| Release gap (RMS < .005 in 1 ms frames) from release instant | initial gap ≤ 20 ms; longest gap ≤ 20 ms | any > 20 ms |
| First correct-pitch 40 ms window start | ≤ 30 ms after release | later, or none |
| Wrong-pitch windows (dominant outside ±1 % of target) starting ≥ 30 ms after release | 0 | ≥ 1 |
| Raw-pitch windows (±1 % of 440·rate) at distinguishable configs | 0 | ≥ 1; indistinguishable configs report null, never pass |
| Level continuity | no 10 ms frame after release+10 ms below 50 % of settled RMS | any |
| Settled pitch 250–400 ms after release | within 1 %, ≥5 windows | otherwise |
| Return cursor (click-train phase at release+200 ms) | error ≤ 10 ms vs transport `end` position; ACK exact to 1 sample | > 10 ms or wrong region |
| Quick tap (begin→end ≤ 50 ms) | all above hold; no second owner created | rebuild observed, or raw window |
| Far cursor (outside 1 s/8 s window) | silence ≤ measured build time, reported; zero raw windows; labelled **incomplete** until build time < 20 ms or a prebuilt window exists | any raw window |
| Shifted/unshifted/tempo {.5,1.08,2} × {−12,0,+12} | every cell measured and passing individually | aggregate pass without per-cell rows |
| Multi-source (5 buffers) | each stem bus meets the pitch/gap rows; other deck's captured tone unaffected (±1 %, RMS ±5 %) | otherwise |
| Races: cancel during follow, pause during scratch, track load during scratch, reentrant begin | no exception, no orphan owner (`snapshot.disposed` true within 2000 ms), no audio from the replaced track | otherwise |
| Capture integrity | full armed coverage 1, no frame/sequence gap; gaps are fatal rows, never trimmed | otherwise |

Labels preserved: browser prototype only; native forbidden pending Jason's approval of an identified HTML revision; full 1:1 Serato parity incomplete (Serato release behaviour unverified).

## 6. Blockers

None that stop the proposal. Genuine evidence gaps: the four mute fatals cannot be root-caused from the saved JSON (data lost before save, §4), and the inputLatency/outputLatency split was inferred from measurements, not read from the WASM.

Skills applied: use, blind-falsification, blind-steelman, si-calibration-gate, vd-report-the-gap.
