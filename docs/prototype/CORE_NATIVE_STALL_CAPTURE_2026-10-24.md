# Native four-deck stall investigation — 24 October 2026

## Current status

An actual **100.3 ms orientation-change stall is now retained and inspected in native data**. The narrow acquisition work on [QA-FIX-02](https://trello.com/c/hifyvb1y) is complete for acquisition and retention only; this does not close waveform lag, Sync pops or the core DJ workflow. [CORE-FIX-09 — grid-save ownership](https://trello.com/c/ixqGkEo6) and [CORE-FIX-10 — orientation rebuild](https://trello.com/c/UiNY8ER3) remain open pending their real-path checks.

The accepted capture serves immutable desktop **0.1.52 / source df48b50**, separately from the newer Sync repair and orientation source candidate. Normal desktop 0.1.52 remains open and paused in its separate profile. Controls, layouts and library previews are preserved. No audio, headphone/master or controller acceptance is claimed.

Public numeric evidence and source identities are in [native-stall-capture-results.json](native-stall-capture-results.json); current source/geometry checks are in [orientation-control-results.json](orientation-control-results.json). Raw traces, profiles and machine/audio metadata remain private local evidence.

## Executed acquisition and attribution

The installed Electron 44.9.0 / Chromium 152.0.7977.167 diagnostic used an owned fresh profile, volatile partition, sandbox/context isolation, denied permissions/popups/foreign navigation, exact-source checks and muted physical output. The parent used visible import/Run controls; no accessibility snapshots were performed during Run. Tracing, polling, invalidation instrumentation and harness work add **unquantified diagnostic overhead**.

The original `recording_mode` request did not select continuous recording: Electron forwards the dictionary, while this Chromium parser expects `record_mode`. Exact upstream sources: [Electron v44.9.0 converter](https://raw.githubusercontent.com/electron/electron/v44.9.0/shell/browser/api/electron_api_content_tracing.cc) and [Chromium 152.0.7977.167 trace configuration](https://raw.githubusercontent.com/chromium/chromium/152.0.7977.167/base/trace_event/trace_config.cc). The corrected host requires actual retention evidence rather than trusting its requested configuration.

- **Rollover calibration — executed:** the private calibration used an 8 MiB continuous buffer. A synthetic 120 ms action produced a 137.2 ms LoAF; native known-action marks span 119.891 ms inside the frame, with 806.4/809.8 ms retained context. Actual counters show 31,469,568 bytes overwritten and zero chunks discarded. This proves the tested rollover/containment path, not loss-free tracing, music or library behavior; no tracks were imported.
- **Natural incident — executed:** the private real-track run imported eight real tracks and retained a 100.3 ms frame at run +220.6506 seconds during the harness's live Vertical → Horizontal selection. Native pre/post context is 741.6/879.6 ms. Eighteen source hashes match before/after; owned-process, visibility and mute gates pass. Afterward there are four each Play/tempo/EQ/scrub controls and nine previews. The partial session is still Running with three active Play buttons during replacement; this is not an uninterrupted full-session acceptance.

Two complete main-thread tasks span 50.576 and 51.937 ms. The timer contains `layout-preview.js` orientation handling and product `renderDecks`/`renderMixer` invalidation stacks; the following frame runs `tick` and forces further layout. The exact frame contains 6,025 invalidation events, including 819 deck-replacement-stack, 353 mixer-replacement-stack, 789 rekordbox-adapter and 1,155 `:has()` records. These categories overlap: **counts are neither unique nodes nor CPU cost**. `getBoundingClientRect` identifies a synchronous flush site; separately recorded earlier writes identify invalidation. Wrapper URLs alone do not identify the original mutating code.

This supports a narrow orientation-rebuild repair. It does not explain every stall or any audible pop. No complete GC-named main-thread event was found inside this exact frame; that is not a general exclusion of GC. Raw thread timing is preserved, but calibration shows thread duration can slightly exceed wall duration, so no exact CPU/off-CPU subtraction is claimed.

## Repair state and next checks

The separate grid-change ownership repair is committed as **99abf2a**: pending Sync/alignment preparation is revoked at the shared grid-change boundary, protecting newer manual starts and rejecting stale asynchronous handoffs. Focused 15/15 and full Node 154/154 checks pass. They execute actual SmartSync/AudioEngine with controlled graph/clock/adapter endpoints; they are not real-track playback or musical acceptance. The defect card remains open until current-grid save/Sync/Play integration is exercised.

The committed ba4f0de 17-line `refreshWaveformOrientation` candidate updates orientation and scrub lanes while retaining existing deck/mixer trees when their shape matches. Focused 7/7 and full Node 161/161 checks pass, including a final rerun. Four targeted Sync/controller scripts (5/5, 5/5, 4/4 and 14/14) and the separate standard-control regression (1/1) also pass with their controlled collaborator limits. Parent-executed fresh UI checks observed two-deck Horizontal → Vertical and four-deck Vertical → Horizontal in Compact, with matching lane geometry/control counts and six/seven library preview images respectively. Those checks used stopped demo tracks: they do not establish real-track node identity or native performance improvement.

The matched comparison is prepared with immutable baseline99abf2a and candidateba4f0de20-module manifests, observing the actual turn10 selector regardless of duration. The launched baseline attempt stopped before import/Run because CUA reported the Mac locked. That attempt is **not executed**, not a failed product test or timing result; its private interruption record is retained and only the owned fresh host/server were closed. Normal52 was not quit or reused. No bypass was attempted.

Next after the Mac is available: repeat the matched live orientation transition with native capture, verify control/focus and real-track preview retention, then exercise grid-save ownership through real Sync/Play. Complete those integrations before building desktop 0.1.53. Keep [CORE-FIX-07](https://trello.com/c/QGW47XIJ) and [CORE-FIX-01](https://trello.com/c/6cK0v0iy) open for waveform/beatmatch and intermittent-pop acceptance. Manual mixing, EQ/Cue/clean stop and hardware monitoring still need their separate user/device evidence.

## Historical evidence retained

- The earlier 134.6 ms synthetic calibration retained its 119.955 ms known interval with 910.2/811.4 ms context. It established containment before buffer rollover; it did **not** establish effective continuous recording.
- The earlier natural 217.3 ms event was observed but **missed by native retention**. Its until-full trace discarded 373,116 chunks and overwrote zero bytes; the run remains failed/excluded. Earlier setup/visibility failures and pre-Run timeouts also remain excluded.
- The accepted 323.066-second browser session still contains an unattributed 242.5 ms frame (231 ms before rendering) and 189.8 ms frame (179.4 ms before rendering). Their short resumed ticks do not explain those gaps. The 172.9 ms orientation/load frame has only partial timer/layout attribution. The earlier 3.0065-second native analysis window missed these events. [Previous terminal report](CORE_TERMINAL_ANALYSIS_REFRESH_2026-10-24.md) and [native receipt](terminal-analysis-native-window.json) retain that scope.

Empty LoAF script attribution is not proof of no JavaScript: the [W3C processing model, §3.2.2](https://w3c.github.io/long-animation-frames/) omits individual script entries of 5 ms or less. Acquisition, causal attribution, repair, performance improvement and audible acceptance remain separate claims.
