# Four-deck load and library-row refresh — 23 October 2026

Core DJ reliability only. Preserve the existing layouts, controls, source waveforms and lazy library previews. No audio-engine, Sync clock, analyzer, CSS or dependency changes. All unattended audio is physically muted; isolated in-memory session and separately labeled audio/thumbnail stores protect the normal desktop profile. Original music is read only.

## Reproduction and repairs

The actual baseline Load path discarded all four decks, shared detailed canvas and mixer strips. The real-DOM load contract failed on the first real-track load. A separate library regression failed because an unchanged refresh disconnected rows, their focus and waveform-preview cells.

- `renderDecks(index)` replaces only the loaded deck when the deck count, orientation and Sync mode are unchanged. Preserve siblings, mixer/footer and shared detailed canvas. Reclaim original scrub/status controls projected into the target deck before replacement; the existing layout observer restores their placement. Structural changes retain the full renderer. Load request ownership, decoding, analysis, Sync reconciliation and scratch/hold cancellation remain.
- A 31-line keyed-row helper retains table rows and adapter-owned preview cells. Only changed metadata cells are replaced; keyed reorder/filter/insert/remove stays accurate. Explicit sort-header/column changes rebuild, as do artwork/empty transitions. Library history, Prepare membership and play counts still refresh through the existing callers.
- Retained preview images and Retry controls update their accessible names on a track rename without replacing the control or writing unchanged attributes.

**103/103 Node checks pass.** Focused deck regressions failed before the repair. Ten real-DOM row checks passed after an observed baseline failure: unchanged identity/focus, preview attachment, play counts, changed cells, reorder, filter/rename, columns, artwork and empty-state recovery. Read-only code review found no additional blocking regression; these checks do not establish acoustics or complete feature parity.

## Measured session

The immutable baseline is `ce1414e`. Both labeled sessions use the same eight additional real MP3s, native analysis before loading, 15 replacements, Horizontal/Vertical, two then four key locks, and paused/playing incoming Sync captures. Inputs: Anika Kunst “Tales From The Loop”; Confidential Recipe/Harvey McKay “Bad Man”; Dr Dunks/Zopelar “Plateau Alone”; J.K. Rollin “Hype the Funk”; Fort Romeau “Lovin’ U”; Jewel Kid “Explicit Behaviour”; Mike Shannon “Off World Sparkle”; Tal Fussman “Who’s Who”. Supported-grid selection makes this test executable; it is not full-corpus musical acceptance.

Both sessions completed stopped with no reported errors and unchanged original session. The baseline took 317.65s; the repair took 317.89s. The measured sequence preserves four sets of Play/tempo/EQ/scrub controls and six lazy preview images. AFTER passes 19 measured/setup Load checks and 20 Play node/focus/busy/Censor checks; 24 stopped layout checks add another 24 preserved loads across six layout choices, 2/4 decks and requested Horizontal/Vertical compact modes. Legacy layouts retain their existing supported orientation; these are DOM preservation checks, not full visual/feature certification.

| Measurement | Baseline | Repair |
|---|---:|---:|
| Deck articles removed | 84 | 39 |
| Shared detailed canvases removed | 21 | 6 |
| Mixer strips removed | 84 | 24 |
| Library rows removed | 752 | 0 |
| Library preview images removed | 282 | 0 |
| Long Animation Frames | 35 | 24 |
| Attributed script forced style/layout in those frames | 797.2ms | 155.4ms |
| Worst observed frame interval | 91.6ms | 83.5ms |
| Tick callback p95 range | 0.8–1.3ms | 0.9–1.3ms |

There are still 21 deck-root replacement mutation records in each run: the repair changes 15 full rebuilds into single-deck replacements, retaining six full structural rebuilds for key-lock/orientation changes. Counts must distinguish removed nodes from mutation records. Frame timing is one matched comparison with normal scheduling/GC variance, not a no-stall guarantee. Slow baseline entries include decode-promise continuations in engine.js; that callback attribution alone does not identify decoder CPU as the cause.

[Comparison and source hashes](four-deck-load-rows-results.json). [Independent PCM/source-file inspection](four-deck-load-rows-pcm-inspection.json). Sixteen whole four-second postmaster PCM windows are finite, with no post-startup exact-zero telemetry. Both sessions capture paused-incoming Anika Kunst and playing-incoming Confidential Recipe/Harvey McKay against outgoing Tal Fussman; the harness asserts the master voice/rate remains unchanged. Maximum sampled source-grid error is 2.360µs after repair. These checks do not hear a pop or establish kick/downbeat accuracy. The eight original hashes, sizes and mtimes remain unchanged.

Private trace/PCM evidence: `local-evidence/four-deck-load-rows-2026-10-23/`. No original music, raw audio or personal profile is committed.


## Remaining gates

Broader stalls and intermittent Sync pops remain OPEN. Cold analysis completion still invokes full deck rendering, including for tracks not currently on a deck; benchmark that path separately before changing it. Instant Double and structural performance-mode redraws also remain. Explicit sort/schema changes rebuild the table. No blanket no-stall or pop-free claim is made from finite PCM/source-grid telemetry.

Human re-entry remains one Sync-OFF manual transition, EQ judgment, temporary Cue hold/release/latch and clean stop. Independent headphone/master/controller acceptance requires suitable hardware. Native startup is separate from the moving four-deck browser evidence; no new packaged-native long-session claim.
