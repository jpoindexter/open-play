# Four-deck waveform and Sync trace — 23 October 2026

**Scope:** core DJ reliability only. Preserve every control, layout and decoded library preview. Eight different real MP3s, loopback-only fixtures, physically muted output and isolated test profiles. No original audio or normal library was modified. Broader intermittent pops, rare stalls, musical listening and hardware acceptance remain **OPEN**.

## Executed changes

- **Waveform layout:** event-aligned Long Animation Frame entries and geometry call stacks located repeated forced layout in `prepareWaveCanvas → drawWaves → renderDecks` during replacement, and `drawDetailWave → tick` after presentation writes. Read all overview bounds before resizing/painting any canvas; measure detail geometry before tick presentation writes. The waveform renderer, grids, controls, preview generation and draw cadence remain intact.
- **Late warped-loop handoff:** `startWarpLoop` lacked the deadline guard already used by ordinary and forward key-lock starts. A real AudioWorklet test delayed acknowledgement past its boundary and reproduced a discontinuity. Reject that late replacement while retaining the existing voice; show the existing retry notice.
- **Caller state:** retained-audio loop changes and standalone primary Sync now restore requested metadata only when the same track, voice, request token and relevant Sync revision still own the rejected change. Stop, load, newer start/MASTER and committed owners take precedence. This prevents the new deadline refusal from leaving the UI describing audio that never committed.

No new dependency, cosmetic grid snapping, speculative crossfade or broad module rewrite.

## Before / after evidence

| Actual path | Before | After | Limit |
|---|---|---|---|
| Eight real tracks; 15 replacements, H/V and two then four key locks | 310.59 s completed | 309.55 s completed | Separate five-minute runs; prior 20-minute evidence retained |
| Per-window waveform callback p95 | 8.6–12.1 ms | 0.8–1.2 ms | Before lacks geometry wrapper; after adds sampled geometry tracing |
| Long Animation Frames | 77 | 61 | Not a universal frame-rate guarantee |
| Worst animation interval | 225 ms | **283.7 ms** | Rare stalls remain; average work improvement does not resolve them |
| Largest declared-grid phase error | 0.830 µs | 0.836 µs | Clock/grid agreement does not prove kicks or musical alignment |
| Continuous telemetry | No non-finite values; no exact-zero gap after startup | Same | Cannot classify all clicks, device underruns or musical transients |
| Matched 8-beat warped-loop delayed acknowledgement | Old voice/rate replaced; max second difference 0.028606 | Old voice/rate retained; 0.000006143 | Owned tones, 2 s whole postmaster Float32 captures, physically muted |
| Late-start refusal, loop rollback and primary rollback regressions | Targeted failures reproduced | **87/87 Node checks pass** | Controlled collaborators supplement, not replace, real worklet capture |

After trace: 33,049 detail geometry reads total 214.6 ms (one 8.3 ms outlier); sibling overview reads after the first measured surface no longer incur repeated layout. Remaining replacement frames still include roughly 27–42 ms of forced layout in full deck/control rebuilds and library geometry. The longest script-unattributed Long Animation Frame lasted 279.6 ms, with rendering starting 268.3 ms after frame start and `scripts: []`. The page API alone cannot distinguish scheduling, GC, compositor or GPU causes. Do not invent a cause or add another throttle on this evidence.

Six whole four-second repaired real-track master windows were independently decoded and hashed, with finite samples throughout. Continuous telemetry after startup contained no exact-zero frames. Four Play/tempo/EQ/scrub controls persisted; preview images progressed from six while pending to fifteen. All eight originals retained SHA-256, size and nanosecond mtime. Active decoded buffers are protected and can exceed the inactive-cache budget; the 32 MiB source raster budget is separate from total process memory.

## Receipts and reproducibility

- [Five-minute before/after summary](four-deck-trace-results.json): exact loaded source hashes, track analysis, windows, controls, grid measurements and remaining worst frame.
- [Independent real-track PCM inspection](four-deck-trace-pcm-inspection.json): six complete captures and original-file preservation.
- [Warp-loop before](four-deck-trace-warp-before-results.json), [after](four-deck-trace-warp-after-results.json), [independent PCM comparison](four-deck-trace-warp-pcm-inspection.json).
- Earlier [20-minute repaired session](CORE_FOUR_DECK_SOAK_2026-10-23.md) remains separate; it was not rerun or relabeled as current native evidence.
- Private raw traces, PCM, initial confounded fixture and reproduction logs: ignored `local-evidence/four-deck-trace-2026-10-23/`. No user music is committed.

`four-deck-soak-harness.html?trace` runs the existing real-track workspace at dedicated port 18844, shortening the original 20-minute fixture to five minutes while retaining 15 rotations. It imports through normal handlers, uses separate in-memory saved state and prefixed IndexedDB, and asserts physical mute. Trace instrumentation is opt-in and absent from normal playback. `sync-lag-harness.html?warp` at port 18842 injects the acknowledgement delay into the actual warped-loop AudioWorklet. Initial non-whole-bar-loop fixture was rejected as a phase acceptance setup; matched before/after uses an exact eight-beat loop.

The five-minute after run loaded the waveform and deadline repairs before the later caller-rollback-only additions. Those additions are covered by targeted rejection/ownership tests; loaded source hashes preserve this distinction. Native profiling and packaged startup are recorded separately below.

## Next focused work

Keep CORE-FIX-01, DEK-008, ANA-001 and CORE-FIX-07 open. Investigate remaining replacement-time DOM/layout work using timestamped native renderer events. Do not repeat clean tone matrices or expand stems/video/FX. Continue the next actual pop capture rather than treating this one reproduced mechanism as every reported pop.

User re-entry: Sync-OFF manual transition, EQ judgment, temporary Cue/release/latch and clean stop. Physical headphone/master isolation and controller acceptance require connected suitable hardware. No unattended result establishes these.

## Native trace follow-up

An isolated Electron 44.9.0 host used sandbox/context isolation, denied device permissions and loaded only eight SHA-verified loopback copies through the normal import handler. Its 64 MiB continuous trace ring reached 99.8%, retaining **19.25 seconds** of renderer events, not the entire requested 90-second interval. CPU-profiler startup itself cost 105 ms; do not attribute that measurement overhead to the product. Raw trace stays private. [Native trace inspection](four-deck-native-trace-inspection.json).

In that retained interval, a replacement/Sync-associated timer occupied 171.19 ms, including a 74.30 ms click dispatch, several layout-tree updates and a 22.01 ms library waveform `refresh` microtask. A main-frame update took 110.29 ms, including a 46.27 ms layout-tree update. The longest recorded main-thread GC event was 6.71 ms; this interval does **not** support blaming a 100–280 ms stall on GC. It does not exclude GC or OS/device problems outside the retained interval. Full deck/control redraw and preview-refresh layout are the next evidenced targets; preview removal is not a fix.
