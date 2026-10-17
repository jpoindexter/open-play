# Keylock live-capture startup gap: findings

2026-10-17. Independent findings-only review requested by Codex (parent). Read-only except this file and the two new isolated diagnostic files beside it: [capture-gap-probe.html](capture-gap-probe.html) and [capture-gap-probe.js](capture-gap-probe.js), which remain **unexecuted**. No existing production, vendor, probe, test or delivery file was modified. No browser was driven; no audio or project data left the machine.

Reconciled 2026-10-17 (second pass) against parent-executed evidence that arrived after the first draft: [preflight keylock run](../../prototype/keylock-live-patched-browser-preflight-results.json) is 11/11, `completed:true`, `fatalErrors:[]`, `captureCoverage:1`, arm at frame 8704 through fence 825472 with the startup jump retained in `capturePreflight.startupGaps`; [startup diagnosis](../AUDIO_CAPTURE_STARTUP_DIAGNOSIS.md) records that design; the separate disposable variant (`SignalsmithStretch-open-play-disposable.mjs`, SHA256 `b2811c51…`) has an actual 5/5 shared-context lifecycle result. Earlier statements in the first draft that the last actual capture was incomplete are superseded by that run. No production integration exists; the three incomplete patched runs and the harness failure are retained below.

## Findings first

1. **The 256-frame hole does not require Signalsmith, the fence or per-block messaging.** It reproduces with no Signalsmith module loaded and with rows retained inside the processor (Codex's continuity harness, case 3), so per-quantum message loss cannot be its cause. That proves the vendor is not required; it does not prove that no wrapper or startup interaction can ever contribute in the keylock graph. In every finite observation so far it is exactly 256 frames and sits between the processor's **first and second** `process()` call; no later gap has been observed in these runs, which is not a guarantee that none can occur.

2. **The keylock probe arms at the context's first-ever render quantum.** In both fenced runs the main-thread clock was ≈0.021–0.027 s when check 2 began, right after the arm acknowledgement, so the device had not rendered during the whole module/WASM/latency setup, and the arm landed in the quantum where rendering began (run 3 ack `firstFrame:0`). Constructor `ready`, `ctx.state==='running'` and a resolved `resume()` are main-thread bookkeeping; none of them is evidence that the render clock is advancing (Chromium source below).

3. **A plausible mechanism class is identified; neither the running build nor the exact trigger is proven.** Chromium `main` source shows the destination render path advancing the context frame counter on every device callback even when graph pulling is disallowed, applying connections and the worklet `currentFrame` refresh only under a try-lock, and handing rendering from the device thread to the worklet thread during startup. Those transitions cluster around the first renders, which fits the "first-to-second call" signature. The parent independently opened the same `Render` source and accepts this as a plausible class, not proof. Which transition fires on this machine is unknown.

4. **Stale-initial-label explanation is unsupported, not refuted.** `currentFrame` and `currentTime` in the worklet scope derive from one clock update, so their mutual agreement (`time === frame/sampleRate` in every harness row) cannot by itself exclude a coherent stale first label. The block-count shortfall is likewise consistent with either a real two-quantum skip or a first label that is 256 frames early. No existing observation separates "two quanta passed without a call" from "the first call's label was stale".

5. **Three hypotheses remain open and the existing data cannot separate them.** H1: the capture processor was skipped while the rest of the graph rendered those frames. H2: the first call's label was stale and no frames were skipped. H3: the frame counter advanced while no node rendered them. The unexecuted ramp probe could separate H1 from {H2, H3}; it cannot separate H2 from H3, because a ramp advancing 128 while the frame label advances 384 fits either. Under all three, measurement that starts after a processor-observed steady span is unaffected by the startup event; the strict armed-span assertion remains the only guard against any later gap.

6. **Processor-observed preflight is the correct measurement correction, and the parent has now executed it.** The preflight keylock run requested preflight after factory and capture readiness, retained the startup jump expected 128 → actual 384 at sequence 1, observed 64 consecutive exact-128 advances (frames 384..8576), armed at 8704, and captured 6381 contiguous blocks to the fence at 825472 with 11/11 functional checks and `completed:true`. The distinction that holds there: readiness decided by the processor from observed contiguity before the first schedule, pre-arm observations published, any gap after the acknowledged arm fatal.

## Observations table

| Run | Graph | First processor call | Next call | Hole | Source |
|---|---|---|---|---|---|
| Unchanged vendor, initial 4/10 | capture + vendor | frame 256 | contiguous | none | `docs/prototype/keylock-live-probe-initial-results.json` (`captureFirstFrame:256`) |
| Patched run 1 | capture + vendor | unknown | unknown | 256 frames (801792/802048) | `docs/prototype/keylock-live-patched-browser-initial-error.txt` |
| Patched run 2 (fence) | capture + vendor | frame 0 | frame 384 | 128..383 | `…-fenced-initial-results.json` (`capturedBlocks:6269`, span 802688 = 6271 quanta) |
| Patched run 3 (arm+fence) | capture + vendor | frame 0 (arm ack) | frame 384 | 128..383 | `…-patched-browser-results.json` (`capturedBlocks:6271`, span 802944 = 6273 quanta) |
| Harness cases 1, 2, 4 | bare worklet (+osc in 4) | frame 256 | 384 | none | `docs/prototype/audio-capture-continuity-browser-results.json` |
| Harness case 3 | bare worklet | frame 256 | frame 640 | 384..639 | same file, `all.gaps[0].missingFrames:256` |
| Patched preflight run (parent, 08:00Z) | capture + vendor | frame 0 (seq 0) | frame 384 (seq 1) | 128..383 retained pre-arm; armed span 8704..825472 contiguous, 11/11, `completed:true` | `docs/prototype/keylock-live-patched-browser-preflight-results.json` (`capturePreflight.startupGaps`, `captureArm.firstFrame:8704`, `captureFence.lastFrame:825472`) |

Rate in these finite runs: 5 of 10 contexts showed the startup jump; 4 of 4 keylock contexts whose first processor call carried label 0 did. Arming at the first-ever labelled quantum maximised exposure. Small samples; no rate claim beyond them.

## Exact file and line evidence

Line numbers refer to the committed probe at `747730c` (`prototype/keylock-live-probe.js`, 68 lines), which produced runs 2 and 3. The parent's later working copy (lines 8–10 and 45–46 add the 64-call preflight) produced the preflight result; its final-extraction assertions are at line 66.

- `prototype/keylock-live-probe.js:16` creates the context and calls `resume()` synchronously; `:41` awaits it; `:42` adds the capture module; `:43` constructs and connects the capture node; `:44` runs `createNode` (vendor factory, `latency`, `setUpdateInterval`), then awaits `captureReady`, then posts `arm` and awaits the ack. Nothing in that sequence observes the render clock.
- `prototype/keylock-live-probe.js:9` (committed processor): the first `process()` after `armId` is set acknowledges `firstFrame:currentFrame` and posts PCM from that same block. Combined with the data, that first block is the context's first render.
- `prototype/keylock-live-probe.js:64` asserts `blocks[0].frame===captureArm.firstFrame`, then strict 128-frame contiguity to `captureFence.lastFrame`. This is the assertion that fails with "not contiguous at frame 128; next received block starts 384" in both fenced results (`fatalErrors[0]`, phase `final PCM extraction`). The check is correct; keep it.
- `docs/prototype/keylock-live-patched-browser-results.json`: `captureArm.firstFrame:0`; `checks[1].evidence.requestedOutput:0.24667` = `ctx.currentTime + 0.12 + 0.1`, so `ctx.currentTime ≈ 0.0267 s` when check 2 started; `inputTelemetry[0].receivedAt:0.02667`. Fenced-initial run: `0.24133` → `≈0.0213 s`; `inputTelemetry[0].receivedAt:0.02133`. `checks[1].evidence.onsetMinusRequestedSeconds:-0.00133` in both: the vendor's `currentTime`-based scheduling and the capture labels agree by 0.24 s, so the clock is coherent after startup.
- `docs/prototype/audio-capture-continuity-browser-results.json` case `early-resume-preflight-arm`: `firstRows` `(seq0, frame256, time0.005333)` then `(seq1, frame640, time0.013333)`; `all.contiguous:false`, `armed.contiguous:true` with arm at `seq64, frame8704`. `prototype/audio-capture-continuity-harness.js:3` retains rows in the processor and posts them once at the end, which is why message loss is excluded.
- `docs/research/KEYLOCK_LIVE_PATH_REVIEW.md:142-148` already states the arm-before-playback design and that the gap is startup, not IPC tail. This document does not reopen the IPC-tail claim.
- `prototype/vendor/signalsmith-stretch/PATCHES.md:15-19`: the two vendor fixes touch schedule pruning and chunk-reader bookkeeping only. Neither touches context clock, connection or startup, and the hole reproduces with the vendor absent, so these patches are not shown to be required for it. That does not exclude a wrapper or startup interaction contributing in the combined graph; it only removes the vendor as a necessary cause.
- `docs/prototype/keylock-live-patched-browser-preflight-results.json`: `capturePreflight` = `{firstFrame:384, lastFrame:8576, consecutive:64, startupGaps:[{expected:128, actual:384, sequence:1}]}`; `captureArm` = `{firstFrame:8704, firstSequence:66}`; `captureFence.lastFrame:825472`, `capturedBlocks:6381` = (825472 − 8704)/128 exactly; `checks[1].evidence.onsetMinusRequestedSeconds:-0.004`. The startup jump is preserved in the acknowledgement, not discarded.

## Mechanism: what Chromium's render path establishes

Source: Chromium `main`, `third_party/blink/renderer/{modules/webaudio,platform/audio}`, fetched 2026-10-17. The exact revision running in the parent's Chrome is unverified, so treat these as a plausible mechanism class, not a line-level proof for this machine or an identification of the trigger. The parent independently read the destination `Render` source and reached the same qualification.

- `realtime_audio_destination_handler.cc` `Render()`: `HandlePreRenderTasks` → `if (IsPullingAudioGraphAllowed()) Input(0).Pull(...) else Zero()` → `HandlePostRenderTasks` → **`AdvanceCurrentSampleFrame(number_of_frames)` unconditionally** → `UpdateWorkletGlobalScopeOnRenderingThread()`. A device callback that arrives while pulling is disallowed moves `currentFrame` by one quantum and calls no processor. Pulling is disabled at the top of `StopPlatformDestination()` ("Stop pulling on the graph, even if the destination is still requesting data") and re-enabled only at the end of `StartPlatformDestination()`, after `Start()`/`StartWithWorkletTaskRunner()`.
- `base_audio_context.cc` `UpdateWorkletGlobalScopeOnRenderingThread()`: try-lock, and the worklet scope's `currentFrame` is refreshed **only when the current render thread is the worklet thread** ("the current render thread could still be a thread of AudioOutputDevice"). `NotifyWorkletIsReady()`: context running → `RestartRendering()` (stop, then start, to switch render thread); context suspended → `PrepareTaskRunnerForWorklet()` → `AudioDestination::SetWorkletTaskRunner()` (no restart; FIFO earmark raised to one callback buffer).
- `audio_context.cc`: a new `AudioContext` is **suspended at construction and transitions to running by a posted main-thread task** (`ScheduleInitialTransitionToRunning`, `PerformInitialTransitionToRunning`); `ResumeInternal` comments "Do not set the state to running here. We wait for the destination to start". `HandlePreRenderTasks` applies `HandleDeferredTasks()` (connections, automatic-pull list) only when `GraphAutoTryLocker` acquires the lock.
- `deferred_task_handler.cc`: `HandleDeferredTasks` order is channel modes → summing junctions → outputs → automatic-pull list. `audio_worklet_node.cc` `Create()` adds every new worklet node to the automatic-pull list ("even without a `connect()` call") under the graph lock; `connect()` later removes it. `audio_worklet_handler.h`: `tail_time_ = infinity`, `RequiresTailProcessing()` true, so an active processor is never silence-skipped; `Process()` skips only when `processor_` is null/errored or output allocation fails.
- `audio_destination.cc`: dual-thread mode posts `RequestRender(frames_to_render)` to the worklet thread; `RequestRender` discards tasks whose session id is stale or when the device is not running; the constructor primes the FIFO with `ceil(callback_buffer_size/128)` silent quanta **without** invoking the graph callback.

Consequences used above: (a) `state`/`resume()`/`ready` do not establish rendering; (b) the frame counter can advance without any `process()`; (c) `currentFrame` and `currentTime` seen by a processor come from one refresh, applied under contention rules, so they agree with each other whether or not they are current; (d) the render thread, pull permission and automatic-pull membership all change around startup. A 256-frame hole equals one callback buffer only if `baseLatency` is 256/48000 ≈ 0.00533 s; `baseLatency` has not been recorded in any run, so that equality is a prediction, not a fact.

## Hypotheses and what would separate them

| Hypothesis | What it claims | Observation that would separate it (unexecuted probe) | Status |
|---|---|---|---|
| H1 capture skipped | Graph rendered frames in the hole; this processor was not pulled for them | Ramp delta across the anomalous pair equals the frame-label delta (384) | open |
| H2 stale first label | First call's label is 256 frames early; nothing was skipped | Ramp delta 128 while label delta 384; **indistinguishable from H3 by the ramp** | open, unsupported by any direct evidence either way |
| H3 counter-only advance | Frame counter advanced; no node rendered the hole | Ramp delta 128 while label delta 384; **indistinguishable from H2 by the ramp** | open |

The ramp is an independent record of frames the graph rendered between two capture calls. It can show whether upstream nodes rendered into the hole (H1) or not ({H2, H3}). It cannot pin physical rendering versus a stale label, because both yield a 128-frame ramp advance against a 384-frame label advance; the probe's verdict string "H3" must be read as "H2 or H3". Separating H2 from H3 would need a clock the worklet scope does not control, such as destination output timestamps correlated with wall time, which is outside this bounded task.

Under all three hypotheses, measurement that begins after a processor-observed steady span is not affected by the startup event. None of them, and no finite set of startup-only observations, guarantees that a later gap cannot occur; the strict armed-span contiguity assertion through the acknowledged fence remains the guard and must stay fatal.

## Diagnostic probe: status and what it would add

[capture-gap-probe.html](capture-gap-probe.html) / [capture-gap-probe.js](capture-gap-probe.js) are **unexecuted**. The parent's preflight run has already achieved the acceptance purpose (complete, fatal-free, acknowledged capture with the startup jump retained), so this probe is not required for acceptance. If run later, it would only classify the startup pair as H1 versus {H2, H3} and record `baseLatency`, `outputLatency` and wall/clock milestones that no existing run captured. Its processor state machine and classifier were exercised under a serial Node shim (scratchpad `probe-logic-check.mjs`): H1 and {H2, H3} fixtures classify as coded, steady arm waits for eight exact advances and publishes the pre-arm anomaly, immediate arm reproduces a failed armed span, and no message follows the fence. That shim verifies code logic only; it is not browser evidence and establishes nothing about the running build.

## Fix: preflight readiness versus ignoring a live gap

Preflight (acceptable):
- The processor itself observes N consecutive calls whose `currentFrame` advances by exactly the block size, then accepts the arm and acknowledges `firstFrame` from that steady run. The parent's executed `preflight` with `consecutive>=64` does this; the unexecuted probe's `steady` policy is the same shape with N=8.
- All pre-arm observations are published in the JSON (`startupGaps`/`preArm.anomalies`, first rows, arm sequence), never cleared.
- The first vendor `schedule` is issued only after the arm acknowledgement, with `output` later than `firstFrame/sampleRate + latency`.
- `completed` still requires: acknowledged arm, every block contiguous from `firstFrame` to the acknowledged fence `lastFrame`, coverage 1, all 11 functional checks, empty `fatalErrors`.

Ignoring a live gap (not acceptable, unchanged from the brief): trimming or re-basing a failed armed span after the fact, filling or dropping frames inside it, arming on main-thread timing without processor acknowledgement of contiguity, or relaxing coverage.

Review notes on the parent's preflight probe (`prototype/keylock-live-probe.js`, working copy, lines 8–10 and 45–46), reconciled with its executed result:
- `startupGaps` is recorded from the processor's first call and was published in `capturePreflight` of the executed run. A run that never reaches preflight would still lose it unless it is also attached to the final report unconditionally; that remains a suggestion, not a defect in the executed evidence.
- The preflight resets `consecutive` to 1 on any discontinuity. Keep that; do not count from the constructor.
- Keep the line-66 first-frame/contiguity assertions exactly as they are. They are what turns a repeat of the hole inside the armed span into `completed:false`, and they are the only guard against a later gap that startup-only observations cannot exclude.
- `ctx.baseLatency`, `ctx.outputLatency` and the main-thread `ctx.currentTime` at `ready`, preflight ack and arm ack are still unrecorded in every run. They would test the one-callback-buffer prediction and the clock-not-advancing-during-setup inference.
- Production implication, outside this probe's scope and not integrated: `output = ctx.currentTime + latency + 0.1` computed before the clock starts schedules relative to a frozen clock. An adapter should not treat `state==='running'` as "clock running".

## What was run and what remains unverified

Ran: read of the listed files, the continuity harness, the parent's preflight result, the startup diagnosis and the disposable-variant result headline; extraction of timing fields from the result JSONs with scratch Python scripts; fetch of the Chromium source files named above; `node --check` on the new probe; a serial Node shim executing the probe's processor source and classifier. Did not run: any browser, any audio, the keylock probe, the new probe, the vendor module.

Unverified: the exact Chromium revision in the parent's Chrome; which startup transition produces the jump, and whether it is a skip (H1), a stale first label (H2) or a counter-only advance (H3); the 256-frame callback-buffer prediction (`baseLatency` unrecorded); the setup-duration inference (the main-thread clock read near zero after setup, but wall-clock milestones were not recorded); the absence of any later gap beyond the finite runs observed; the new probe's behaviour in a browser. No cause is claimed beyond a plausible mechanism class.

## Status and preserved failures

Current: patched preflight run 11/11, `completed:true`, `fatalErrors:[]`, `captureCoverage:1`, startup jump retained pre-arm; disposable variant 5/5 shared-context lifecycle with full-span coverage 1 (parent-executed, headline fields read only). No production integration, ordinary scratch, listening-quality, long-file or vendor-equivalence claim follows.

Preserved, not superseded as records: unchanged vendor 4/10 (append silence) and 9/11 (processorerror, future-schedule order); patched run 1 `801792/802048`; patched run 2 `completed:false`, gap 128..383; patched run 3 arm ack 0, `completed:false`, same gap; harness case 3 `all.contiguous:false`. This document closes the bounded debug task; the full independent completeness audit remains separate and unlaunched.

Skills applied: use, debug, blind-falsification, source-grounded, si-construe-the-situation, si-calibration-gate, vd-report-the-gap.
