# Pending Sync → Save grid on different real tracks

## Executed path

Current HTML on product base `306da63`, through the existing isolated four-deck diagnostic on loopback18847. No broad suite or timed soak. Eight previously pinned original files were imported and analyzed; the actual four playing decks were **Czeslawa, Call Me Later, AC!DMAT!C and Disaffected**. They differ from the previous cancellation check's tracks. A prior commentary mistakenly named the fourth song; the actual record and this report use Disaffected.

Physical mute was asserted before playback and at cleanup. A is the outgoing master; B starts independently at1× with key lock. Rapid Sync requests1.016260162601626×. The actual pending state has processing=true, one transform and start token7; source/adapter rate remains1×. The diagnostic activates the original Edit grid and Save grid handlers, changing B's BPM123→124.23 through its backing input. These actions are programmatic, not trusted human input; no held ACK or injected preparation delay.

Save grid cancels the stale request: all four original voice objects and rates remain, B is Sync off at nominal/source1×, outgoing master unchanged, no processing/queued restart, and233observed deck/mixer/detail/preview nodes remain connected. This executes one real-track integration gap on CORE-FIX-09 and adds playing HTML evidence to CORE-FIX-16.

## Fresh Sync and diagnostic timing correction

Fresh Sync targets125/124.23 = **1.006198180793689×**. The first diagnostic assertion failed and the original result is retained as FAILED/INCONCLUSIVE. It compared nominal and source state without waiting for the scheduled audio boundary; it did not capture its fresh values/boundary, so that exact failed observation is not retrospectively regraded.

The corrected capture records both sides of the boundary: at audioTime57.45777777777778, nominal is1.006198180793689× but source remains1× until57.47104308390023—another13.265ms. After reaching that actual scheduled time, reported source and nominal rates both equal the target; the outgoing master retains its original voice/rate. This directly shows why an immediate equality assertion is an invalid general criterion for a prepared future handoff. No product audio code changed. The diagnostic's final pass flag now follows fresh-Sync checks, rather than preceding them.

Only this failed bounded workflow was repeated after instrumentation; the separate long-session campaign and full Node suite were not run. Reimport/analysis was setup after the required module reload, not additional mixing acceptance. The earlier off-cancellation mode remains unchanged by default; the optional gridSave mode and panels source pin reuse the existing helper.

## Cleanup and evidence limits

All4decks stopped, no queued Play and physical mute retained. Final DOM has4Play/4tempo/12EQ/4filter/4level/32pads/4overviews/16rows and3lazy library preview images. Original session comparison is unchanged. All8original hashes/sizes/mtimes and19runtime source hashes match their actual files;6critical/diagnostic files were additionally frozen before execution. Raw results, failed attempt, manifests and screenshot remain ignored under `local-evidence/grid-save-pending-2026-10-26/`; no original audio or paths are published.

Engine-reported source/adapter rate and retained voice identity do **not** establish independent PCM continuity, heard musical alignment or absence of pops. The pre-handoff Sync event also had a small declared-grid phase error; no sustained post-handoff musical-phase claim is made. Paused stale preparation/armed Play, held ACK timing, newer owners, native/physical gestures, hardware and listening remain open. This is not a desktop rebuild or full core completion.

[CORE-FIX-09](https://trello.com/c/ixqGkEo6) and [CORE-FIX-16](https://trello.com/c/qybCEzDj) remain open with this scoped evidence. Intermittent pop/stall parents remain open. Re-entry: a current exact desktop candidate with reliable input for remaining paused-arming/held-gesture checks and owner listening; preserve the next actual audible failure rather than repeat clean cases.
