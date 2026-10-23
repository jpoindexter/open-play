# Sync deadline and waveform work — 23 October 2026

Continue the core two-track DJ experience while Jason is unavailable. Preserve all controls, layout variants and library waveform previews. This is a bounded software repair, not full Sync-pop, acoustic or hardware acceptance.

## Reproduced causes

1. Ordinary Sync chose an audio-time boundary30ms ahead, then performed alignment/timeline/source preparation without checking whether that boundary was still in the future. A controlled80ms post-alignment stall in the actual workspace started the new source about51ms late, replaced the follower and produced a discontinuity in physically muted postmaster Float32 PCM. The outgoing master was unchanged. This reproduces one failure mechanism; it does not identify every event Jason previously heard, especially paused-incoming reports.
2. The detail canvas redrew unchanged stopped scenes every animation frame. The app and layout adapter also replaced identical timer, remaining-time, status, limiter and zoom text nodes every frame, forcing unnecessary DOM/layout work before drawing. Instrumented actual-workspace callbacks showed thousands of redundant stopped-readout mutations per2.5s segment.

## Smallest repairs

- Check that a scheduled ordinary source still has at least5ms lead before starting and after any arming continuation, using the same margin as the existing grouped-tempo handoff. If late, dispose only the unconnected replacement, keep old audio/tempo, and show a retry message. Armed ordinary launches use the same gated routing. Roll back a failed paused launch's position only while its generation still owns it; a newer Cue position wins.
- Reuse detail pixels only while every rendered input is unchanged: source/position/rate, profile readiness, grid/cues/markers, dimensions/orientation/DPR, span and colors. Keep live moving positions unmodified. No cosmetic beat snapping or lower drawing resolution.
- Assign readout text only when its displayed value changes. Controls keep their original nodes, handlers, accessible state and update precision.

## Verification contract

The dedicated harness uses memory-only localStorage, a separately named IndexedDB database, muted physical output, actual workspace GUI handlers and a test-only postmaster AudioWorklet capture. Original saved session is checked unchanged. Four compact combinations (2/4decks × Horizontal/Vertical) retain Play, tempo, EQ and scrub controls plus library previews; stopped pixels stay stable and zoom repaints. Callback timings are short local observations, not a general FPS/CPU guarantee.

The late-start criterion requires both old voices/tempo retained, follower still playing without false Sync engagement, zero exactly-silent captured samples, and maximum absolute second sample difference<0.001 on the controlled73Hz tone. A normal retry must preserve the master and align declared grid phase; paused arming/launch must still work. This is not a human musical tightness test.

Five engine regressions cover late playing replacement, normal future start, delayed arming, late paused launch rollback and newer Cue ownership. Two new detail-renderer regressions cover reuse/invalidation and asynchronous profile readiness. Existing actual-phase-offset and 4-lane ruler tests remain.

## Open gates

CORE-FIX-01 remains OPEN. Capture the next actual user-heard pop with transport and event context; do not infer that this guard solves paused-incoming, device underrun, all pitch/warp backends or every transient. Four-deck Horizontal moving waveforms remain the heaviest observed mode and can exceed a16.7ms frame budget. Human manual transition, listening/EQ judgment, current hardware/headphone routing, broader resource soak and the unestablished overnight blank-window recurrence remain separate gates. No stems/video expansion, redesign or repository-wide refactor.

Final source/build, measurements, native observation and Trello readback are recorded below when executed.

## Executed browser and source checks

Frozen baseline `ae478dd` was served separately with no cache; all five product-module hashes match that commit. Runtime guard/cache markers were absent, as expected. Source construction after the injected stall started51.27ms late; follower voice/tempo changed and maximum absolute second difference was0.054799. Both declared failure criteria failed. The original outgoing voice stayed unchanged.

Final current source: deadline rejection retains both audible voices and follower rate, never starts the late source, and shows “Sync start missed its lead; previous audio retained. Try Sync again.” Normal retry has zero declared-grid phase error and the expected121/115.5rate; paused arming/launch returns BEAT with master preserved. Retained whole postmaster PCM:88,200finite Float32 mono frames/44,100Hz, zero exactly-silent frames, maximum second difference0.000006143. Independent Python full-buffer decode confirms the values and records a SHA256. This controlled continuity pass does not close Jason's intermittent musical/physical pop report.

| Compact mode | Mean stopped callback before→after | Mean moving callback before→after |
|---|---:|---:|
|2decks Horizontal|6.32→0.45ms|6.12→3.23ms|
|2decks Vertical|4.15→0.58ms|4.23→1.54ms|
|4decks Vertical|6.49→0.85ms|6.60→2.87ms|
|4decks Horizontal|10.93→0.44ms|12.27→7.65ms|

Each segment is2.5s on this Mac, with instrumentation and normal background load. These are observed main-callback times, not process CPU measurements or guaranteed FPS. The final4Horizontal p95callback12.9ms/p95rAFinterval17.2ms improved, but an earlier current-source run reached20.1ms/25.1ms. Keep that variable heavy mode open. All final stopped segments have zero detail redraws and zero monitored readout mutations. Moving clocks/beat grids continue repainting; no resolution or refresh-rate cap was introduced.

The isolated library retains8metadata tracks,7generated previews in the observed viewport, and2/4Play, EQ, tempo and scrub surfaces. Pixel stability and zoom invalidation passed. Saved persistent session checked unchanged. Full Node suite66/66; all7new regression cases were observed failing before their respective repairs (fixtures refined where necessary). [Frozen baseline](sync-lag-before-results.json), [final browser results](sync-lag-after-results.json), [independent PCM inspection](sync-lag-pcm-inspection.json).

Private originals, PCM, preliminary/final runs and screenshots remain under ignored `local-evidence/sync-lag-2026-10-23/`. Two preliminary cached runs fetched new source bytes while still executing an old module; their discrepancy was detected with runtime markers. They are not the source-pinned baseline or final evidence. The final harness uses memory-only settings and a separate database because existing saved records were present on candidate test origins; it never clears/replaces those originals.
