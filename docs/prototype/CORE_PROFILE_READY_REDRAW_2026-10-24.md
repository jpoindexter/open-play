# Four-deck profile-ready overview ownership — 24 October 2026

The previous goal turn made verified progress: scoped decoded-load redraw, exact diagnostic capture export, source/browser/package checks and live Trello readback. The full core reliability objective remains active; audible pops, residual frames, native interaction and hardware acceptance are not complete.

This pass isolates the asynchronous source-waveform profile callback. Its subscription is keyed by AudioBuffer, but completion globally redraws all visible overviews. Controlled execution of the actual callback reproduces unnecessary geometry reads and painting for unrelated, replaced, hidden or newly buffered tracks. The expanded six-case regression has five failures and one pass against the pinned baseline, then six passes after repair. Shared-buffer and late-appearing aliases are included; the existing rejection notification already passed.

Outcome: reduce demonstrated four-deck redraw work while preserving current controls, focus, every layout and library waveform previews. Now: full current-source verification after the matched callback comparison. Next: trace remaining cold-decoder/structural/unattributed frames using evidence that distinguishes renderer/native/GC work. Later: the next actual audible pop, native interaction and listening/hardware acceptance. No layout redesign, broad refactor or DSP/clock guessing.

The private exact-source probe pins a860fd1 app/engine. It records callback start/end, current buffer owners and actual overview geometry/refresh-path visits, without another await or scheduling change. Diagnostic bookkeeping is included in both before/after durations; a refresh-path visit does not independently validate waveform pixels. Startup callbacks remain saved but are excluded from timed-session comparisons using their actual start times.

Parallel review of the preceding 140.7 ms frame found no attributed scripts, nearby application operation or visibility change; there is no GC/OS/GPU trace identifying its cause. Five decoder-labelled continuations take 8.2–12.1 ms after 22.8–43 ms has already elapsed in those frames. Await-stack labels and 354–1054 ms asynchronous buffer waits are not native decoder CPU proof. The separate orientation redraw forces 7.8 ms layout. No additional actionable Sync failure was reproduced, so no audio code change is justified by those traces.

## Measured repair

The three matching timed callbacks on the same tracks/decks each refreshed four overviews for exactly one current visible buffer owner before repair. After repair each refreshes that one owner. All nine after-run callbacks, including saved setup completions, match their current visible owners exactly.

| Same profile completions | Before | After |
| --- | --- | --- |
| Callback duration (ms) | 7.2 / 6.3 / 7.6 | 1.8 / 1.6 / 3.2 |
| Geometry reads / refresh-path visits per callback | 4 / 4 | 1 / 1 |
| Current visible owners per callback | 1 | 1 |

The narrow product change derives a Set of current visible track objects inside the existing ready callback, checks their current decoded buffer against the completed buffer, then reuses `drawWaves(track)`. It retains the buffer-keyed WeakSet, rejection handling, current source/stems/pending branches, overlays and explicit global callers. Capturing the first track would miss shared-buffer aliases; capturing owners before the promise completes would miss a later consumer. No new renderer, profile algorithm or audio path was introduced.

Actual extracted callback tests cover owner/ARIA freshness, duplicate and hidden/replaced owners, shared-buffer aliases, an owner appearing after preparation begins, remapped buffers and rejection. The original global overview fallback still passes. These control/pointer sentinels are controlled objects, not a real held-pointer or browser-focus pass. Full Node suite: **142/142**.

The matched short sessions complete 79.481 and 79.410 seconds, stop without reported errors and retain seven complete PCM windows each. They have zero recorded long animation frames, which is not a universal lag result. Their three-rotation schedule never enables key lock; a capture named `overlap-keylock` is a raw triple request here. Actual key-locked triple acceptance belongs to the full fifteen-rotation session, after four key locks are enabled. The same eight originals are reused for controlled comparison; this is not new corpus breadth or whole-song/late-grid acceptance.

Full runtime, independent complete PCM/source verification, Trello and desktop delivery results follow after execution. Physical held gestures, native moving frames, acoustic/manual transition/EQ/Cue/clean stop, headphone/master/controller isolation and full vendor parity remain separate open gates. The core goal remains active.

## Full current-source verification

The full session completed **320.183 seconds / fifteen rotations / eight fresh worker results** on the same eight originals. Each result retains 256 control nodes; three currently loaded results retain focused tempo values, five unloaded targets preserve controls, and active gain/master ownership remains intact. Actual raw double and four-keylocked triple Sync pass with actual/displayed rate agreement; paused/playing incoming Sync, horizontal/vertical views and two-to-four key locks pass their software contracts. All 43 Load / 20 Play checks and 24 stopped compact layout combinations pass. Final core control counts are four each, with six lazy library previews and zero row/preview removals.

Independent inspection of **27 complete PCM windows / 164 seconds** across probes/final verifies finite/non-silent samples, exact acquisition metadata and the three targeted final worker completions within their twelve-second captures. All eight original hashes/sizes/mtimes, the isolated session and eighteen final runtime source hashes match. Physical outputs remained muted. Sampled source-grid error ≤5.1465 µs and no post-startup exact-zero telemetry are not musical/downbeat/pop-free or physical-routing proof. These repeated early-track replacements do not establish whole-song drift or broader corpus acceptance.

Two long animation frames remain, worst **62.0 ms**, with maximum interval 58.3 ms and tick p95 0.7–1.1 ms. One 52.8 ms frame includes a 22.5 ms orientation task (8.3 ms forced layout) and a 14.3 ms frame callback (0.1 ms forced layout). The 62 ms frame includes a 9.8 ms decoder-await-attributed continuation, not native decoder CPU proof. Structural changes still remove 39 deck articles, six shared canvases and 24 mixer strips. The prior unattributed 140.7 ms frame did not recur here; absence in one run does not establish its cause or resolution. The matched callback comparison supports the narrow redraw improvement, not attribution of every whole-session timing difference.

Remaining slow geometry also appears at the final global analysis-queue refresh after its per-track updates. That path needs state/cancellation review before any removal. Existing global layout/analysis callers remain unchanged in this slice.

[Runtime/source/frame/control receipt](profile-ready-results.json) · [Whole PCM/original inspection](profile-ready-pcm-inspection.json). Raw audio, per-file paths and private probes remain ignored.

## Delivery and tracking

Immutable desktop0.1.51 packaging and Trello readback remain pending at this source checkpoint. Normal native startup/listening/hardware remain open; no existing app/profile/recording has been replaced.

An isolated native trace capability smoke executed with a fresh private profile, volatile session, sandbox/context isolation, denied permissions/navigation/popups and host-enforced audio mute. It imported nothing or clicked Play. The installed Electron44.9.0 / Chromium152 runtime returned288 categories and saved a trace, then the owned host exited; normal0.1.48 remains running. The broad capture reached0.9925 reported buffer usage and contained no Open Play marks. This establishes tracing capability only, not a usable long-session trace or a GC/pop cause. A narrower marked capture is being calibrated before actual stall correlation; raw native trace and machine metadata remain private.
