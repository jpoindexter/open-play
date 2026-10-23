# Core Cue, EQ and end-of-track — 23 October 2026

Jason requested continued software work without a listening session. Keep the chosen layout, all controls and waveform previews. This pass targets existing DEK-002, DEK-015, CORE-FIX-05, MIX-003 and parent CORE-001; it does not establish full core/hardware/vendor acceptance.

## Reproduced defect and smallest fix

The real `engine.onEnd` handler ignored the boolean returned by `load`, then called `play` even when loading failed or was superseded. It also did not recheck Autoplay after asynchronous loading. Controlled execution of the actual handler reproduced both unwanted start attempts; successful loading was the positive control.

The handler now starts only when `load` succeeds and Autoplay is still enabled. Existing load-generation/track checks already reject superseded loads. No new transport state, DSP, clock, fade, UI control or dependency. Three regressions cover failed load, disabling Autoplay during decoding and successful next-track start.

## Actual-workspace verification

Dedicated owned origin `127.0.0.1:8874`, actual file-input import and UI load/play/EQ/Autoplay handlers, synthetic Cue key events and a complete internal stereo-master recording. The monitor graph is physically muted. Two independently generated 40-second stereo WAVs put three tones on separate channels: A60/1000/10000Hz left; B80/1500/11000Hz right. Manual fixture grids are annotated120BPM, not estimated musical accuracy.

- GUI LOW/MID/HIGH cuts at−18dB on each deck, then neutral. Recorded own-band reductions about12–18dB; other-channel changes stay within the declared1dB tolerance. This confirms channel selection and functional EQ response, not exact vendor filter curves or a human tonal judgment.
- Both decks: overview keyboard seek; temporary Cue set while paused; hold produces recorded signal; release returns paused at cue; Cue+Play continues after release; explicit stop and blur cleanup return silence. All expected-silent channels are below0.0001RMS; expected-active channels exceed0.003RMS in fixed windows after150ms settling.
- Actual natural end with an injected unavailable next-file read makes one decode attempt and stays stopped. Actual delayed next-file decode plus Autoplay OFF does not restart; successful next-file loading still starts playback. Final stop holds all source clocks steady with no pending/processing/playing deck.
- Nineteen predeclared recording windows; whole decoded recording finite. Original recording/base64 and full event metrics retained privately. No Sync-pop acoustic result is inferred.
- Ten metadata tracks retained in the isolated library; the two filtered fixture waveform previews and both Play/mixer control sets remain. Native existing-profile and package evidence is recorded separately.

The fixture is `prototype/core-controls-harness.html` and refuses other ports or unowned localStorage. Do not run against a normal profile. All decoder failures/gates are controlled on owned fixture objects; original user audio was not fault-injected or modified.

## Verification and limits

Final Node suite59/59, including three end-of-track regressions. Source hashes accompany browser evidence. Prior independent tempo/jog, filter and different-song Sync acceptance remain scoped; no repeated clean Sync matrix or speculative pop patch.

Listening/manual transition, actual mouse/keyboard feel, current physical controller/headphone routing and full source/format/advanced transport parity remain open. The intermittent Sync pop/lag remains OPEN. Software recording does not replace Jason's practical session. This pass also does not resolve the previously tracked overnight blank-window condition or wider RSS/GC/large-file soak.

Next: one human manual transition with Sync OFF, EQ judgment, Cue/latch and clean stop when available. Continue only reproduced core blockers while waiting; no layout redesign, stems/video expansion or repository-wide refactor.
