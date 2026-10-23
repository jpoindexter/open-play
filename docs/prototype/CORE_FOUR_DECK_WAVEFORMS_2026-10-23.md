# Four-deck waveform and key-lock Sync repair — 23 October 2026

Outcome: continue the core DJ experience without Jason present, preserving every layout/control and the decoded library waveform previews. The next human gate remains a short manual transition, EQ judgment, temporary Cue/latch and clean stop. Broader intermittent pops, physical routing and real-load/long-session lag remain OPEN.

## Reproduced causes and smallest changes

The moving source waveform rebuilt every physical pixel each frame even though its decoded profile never changes. Four-deck Horizontal issued5,380,702 rectangles over a2.5s segment. Detail rendering now reuses64-physical-pixel source-time tiles, paints only new edges, and blits at fractional audio-time positions. Profile IDs are weak; cache entries retain pixels, not decoded PCM. A shared32MiB LRU bounds owned backing-pixel bytes across zoom, source and geometry changes; this is not a process/GPU/RSS cap. Existing direct rendering remains the fallback without a canvas facility or when one view exceeds the cache budget. Overview/library preview rendering is unchanged.

A second reproduced path was a live key-lock Sync acknowledgment arriving after its scheduled start. Before, routing committed and retired the old follower even when the audio boundary had passed. The existing5ms ordinary-Sync margin now also guards key-lock voice commitment after its asynchronous acknowledgment/arming. A missed deadline disposes the unconnected replacement, keeps previous voices/tempo and reports a retry. No new fade, timer, beat snapping, DSP algorithm, resolution cap or layout redesign.

Callers reviewed: shared detail painter, overview/deck/library preview consumers, all startForwardKeylock calls through engine.start, and current Sync deadline/transport collaborators. Controls and grid clocks are untouched. Existing ordinary late-Sync protection remains.

## Executed rendering evidence

Same Mac, actual isolated workspace and generated demo audio, physically muted. Each segment2.5s, instrumented requestAnimationFrame callbacks, with normal background variation. Baseline product hashes match committed0.1.42 source dc267c6; final product hashes match the changed modules. These are observed main-callback costs, not whole-process CPU measurements or guaranteed FPS.

| Compact playing mode | Mean callback before→after | p95 callback before→after | Rectangles before→after |
|---|---:|---:|---:|
|2decks Horizontal|2.72→1.22ms|5.60→4.90ms|2,419,883→14,080|
|2decks Vertical|1.52→1.22ms|5.10→5.80ms|381,007→14,734|
|4decks Vertical|2.41→1.95ms|6.30→5.70ms|657,381→26,644|
|4decks Horizontal|7.30→2.11ms|11.70→6.10ms|5,380,702→29,622|

Four-deck Horizontal p95 rAF interval16.8→8.9ms. No universal improvement is claimed for every metric:2Vertical p95 rose slightly, and stopped mean costs vary. All stopped segments still performed zero detail redraws and zero monitored redundant readout mutations. Zoom repaints and settles;2/4Horizontal/Vertical retain their Play, EQ, tempo and scrub surfaces plus7visible generated library previews. No refresh-rate reduction.

An actual Canvas pixel test covers24 combinations of Horizontal/Vertical, DPR1/1.5/2/3 and small fractional position changes. Bass/mid/treble regions keep their measured red/green/blue dominance; opposite-polarity stereo transients remain tall and within3physical pixels of their expected source-time location, including the profile's128-frame resolution. Source PCM is byte/value unchanged. This does not claim pixel-identical old rendering or proprietary vendor equivalence.

Two unit regressions cover warm movement/seek reuse and32MiB owned-cache eviction/reconstruction. The moving-view regression failed before the cache change. Existing profile tests still cover transient preservation, stereo cancellation, invalid input and task yielding. Existing detail tests cover source/grid/marker/geometry invalidation.

[Before](four-deck-waveforms-before-results.json), [after](four-deck-waveforms-after-results.json), [actual raster pixels](four-deck-waveforms-raster-results.json).

## Executed key-lock deadline evidence

Actual workspace GUI Sync, real live key-lock adapter, test-owned73Hz follower/97Hz leader, physical outputs muted. The injected main-thread stall extends80ms beyond the adapter's declared boundary; it is a controlled counterexample, not an identification of Jason's original pop.

Frozen0.1.42: acknowledgment handled79.61ms after the boundary; old follower replaced, rate changed and false-success Sync engaged. The retained3s postmaster capture has maximum absolute second difference0.001972, exceeding the declared0.001 controlled-tone continuity limit.

After: acknowledgment handled79.61ms late, old leader/follower and prior rate retained; follower keeps playing with Sync off and retry notice. Whole3s capture132,300finite Float32 frames/44,100Hz, zero exactly-silent samples, maximum second difference0.0000260. Independent Python whole-buffer decoding verifies reported values and SHA256. On-time retry preserves the leader, reaches121/115.5rate with zero declared-grid phase error, and paused armed launch reaches BEAT. Ordinary/raw late-Sync rejection, retry and armed launch also pass in the performance run.

One initial150ms stall returned before the adapter's boundary. Both old/new builds correctly committed that on-time response; those preliminary reports are retained privately and are not the late-response counterexample. The fixture was corrected before grading the final boundary failure. One new key-lock ownership regression failed before the guard and passes after. Full Node suite:69/69, including prototype/ui controls.

[Before key-lock](four-deck-waveforms-keylock-before-results.json), [after key-lock](four-deck-waveforms-keylock-after-results.json), [independent PCM inspection](four-deck-waveforms-pcm-inspection.json).

## Boundaries, evidence and re-entry

No normal-profile playback initiated. Diagnostic localStorage is memory-only; its IndexedDB name is separate and each original persistent session value checks unchanged. Raw PCM, screenshots and preliminary observations remain in ignored local-evidence/four-deck-waveforms-2026-10-23/. Only generated fixture measurements, not user audio, are committed.

This does not establish acoustic quality, every user-heard or paused-incoming pop, physical headphone/MIDI behavior, warped-loop/advanced backend deadlines, native moving-frame timing, large real-music/GC/GPU soak, or complete core/vendor parity. A missed key-lock deadline is intentionally rejected rather than silently committing late; retry after load settles. CORE-FIX-01/DEK-008 and ANA-001 remain open for those broader gates.

Next: with Jason present, use the current desktop and two real tracks for the missing manual/EQ/Cue/stop acceptance. Preserve the exact event/transport context and current recording if a pop or lag recurs. Do not broaden into effects, stems, video or a repository-wide refactor.

## Desktop and Trello readback

Desktop0.1.43 archives source4cc4877245443ddf2198802203eea65e50cb2b61. ASAR SHA256 d02d81c41e0f9a1debc377999c63c31d20c840c0657042c7d36fabf89cb4a2ec; all5package checks pass. Actual native startup retains16tracks/55:45.6,14AX library preview images, stopped decks, controls and Horizontal/Compact. Stopped4deck layout displays all4Play/tempo surfaces (C/D tempo correctly disabled while empty); restored2decks. Astryx deck-count AX value lagged its visual selection after keyboard input; screenshot/deck tree verified4then2. That existing accessible-label issue is recorded, not repaired or confused with playback timing. No normal-profile playback initiated. Prior bundles retained. [Native observation](desktop-0.1.43-playback-observation.json), [package](desktop-0.1.43-playback-package.json), [checks](desktop-0.1.43-playback-safety.json).

CORE-001, CORE-FIX-01, DEK-008 and ANA-001 summaries and parent detail comment applied/read back; historical criteria/model guidance preserved byte-for-byte. All140open cards remain: Core26/Next22/Later85/Blocked4/Approvals2/Evidence1. No new/moved/completed cards. [Receipt](../delivery/CORE_FOUR_DECK_WAVEFORMS_RECONCILIATION_2026-10-23.json). Current launcher targets0.1.43; older bundles and versioned launchers remain.
