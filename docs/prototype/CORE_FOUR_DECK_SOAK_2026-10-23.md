# Extended four-deck real-track session — 23 October 2026

Active goal: improve core Sync/waveform reliability in longer sessions with different real local songs, preserving all controls/layouts and library previews. Physical outputs are muted; normal playback-test profile and originals stay separate. Human listening, manual mixing/EQ/Cue/stop and physical routing remain later gates.

## Reproduced failure and smallest repair

The first planned20-minute session failed at404.86seconds. It had completed four paused-incoming real-track rotations and a playing-Sync click. Raw four-deck transport stayed aligned to its declared grids. Enabling key lock while playing introduced approximately216ms phase error on a deck; the driver stopped safely and retained the failure rather than continuing as a pass.

Root cause: `AudioEngine.setPitch` used pause/restart for an ordinary forward non-loop deck. That stopped existing audio and froze its source position during key-lock preparation and output lead. The same engine method already used a scheduled advancing-clock handoff for loops. Removing the loop-only restriction extends that existing handoff to ordinary forward playback. Reverse/paused/live-owner/warped branches retain their existing policies. No new DSP, audio format, waveform algorithm, control or layout.

A new regression failed before the repair because old audio was no longer playing during preparation. It now checks the future anchor against the old advancing source clock; a paused-deck positive check confirms that a key-lock edit does not queue Play. All71Node tests pass, including existing late-deadline, ownership and control checks.

## Actual adapter/audio evidence

Focused actual-workspace GUI key-lock enable, ordinary playing follower,73Hz tone and unchanged97Hz leader; real live adapter, physically muted postmaster capture. Before: old audio was stopped during preparation, source-clock phase lost207.73ms, captured exact-zero gap9033frames/204.83ms, maximum second difference0.024175. After: old audio retained during preparation, source-clock phase error0, zero exact-silent frames, maximum second difference0.0000664. Each whole capture132300finite Float32 mono frames at44100Hz; independent Python decoding verifies the counts, values and SHA256.

This establishes a concrete pitch/key-lock transition failure and its bounded repair. It does not identify every historical Sync pop, prove arbitrary musical quality or close the hardware/output gate. Existing ordinary/key-lock missed-deadline guards remain required.

[Before focused check](four-deck-soak-pitch-before-results.json), [after focused check](four-deck-soak-pitch-after-results.json), [whole PCM inspection](four-deck-soak-pitch-pcm-inspection.json), [retained failed real-track run](four-deck-soak-before-failed-results.json).

## Extended protocol

Eight different existing MP3s, beyond the previously listened pairs: Czeslawa, DJ W!LD Call Me Later and AC!DMAT!C Jus-Ed remix, Disaffected, Fort Romeau No Limits and Breathe Trip Mix, Hinz & Ruhmhardt Doch, Mike Shannon Only Noodles. Original hashes and modification times match the earlier corpus and were verified unchanged after the session. Current native decoder/production analysis supplies the session's tempo/grid; old corpus fits are selection evidence, not injected ground truth.

Four compact decks, a planned1200-second timeline, a replacement every80seconds while the other three keep playing, master handovers, Horizontal→Vertical→Horizontal, two key-lock enables at400seconds and four by880seconds. Later captures/checks use playing Sync too. Track replacement has intentional paused/preparation intervals; this is not a claim that exactly four voices play every instant. Library rows can prepare previews while music continues. All files stay local in a separately named diagnostic IndexedDB; session settings are memory-only and the original saved session value is compared unchanged. Nothing is written to source audio or the normal desktop profile.

Per30-second windows: callback/interval summaries, rectangle counts, decoded owners,32MiB raster ownership, browser heap estimate, long tasks, master invalid-state counts, physical mute, core control counts and declared-grid phase. Continuous test-only AudioWorklet reports finite/gap/energy telemetry and emits silent output. Its finite signal/RMS, zero-run, invalid-input and silent-witness self-check executes separately. Short master windows remain private. Audio zero runs or high sample differences in real songs are not automatically pops; natural silence/transients require contextual review.

A successful software result requires1200seconds,15rotations, preserved controls/previews, no unhandled/non-finite errors, bounded raster ownership and declared-grid phase within5ms after transitions. Frame target is16.7ms; report per-window tails and outliers honestly rather than asserting every frame meets it. Browser heap/cache measurements do not cap total process/GPU/RSS or prove absence of garbage-collection pauses.

## Executed repaired session

The current actual workspace completed **1208.15seconds,15replacements and6playing-Sync actions**, Horizontal/raw→two key locks→Vertical→four key locks/Horizontal. All eight original files retain identical hashes, lengths and modification times. Runtime source hashes match the tested product/harness. Four Play, tempo, EQ and detailed scrub controls remain throughout; previews prepare asynchronously (6images early,15at the end), and all eight new-song preview states reached ready. Session storage was unchanged; the driver stopped all decks and queued starts at the end.

Across303same-audio-timestamp phase samples, largest declared-grid phase error was **5.54microseconds**, below the predeclared5ms bound. This is transport/grid evidence, not measured kick alignment or fresh musical acceptance.1207contiguous worklet blocks cover1208.64seconds with zero non-finite samples. Sequential initial startup contains2233exact-zero frames; after the first four blocks no exact-zero run is recorded. Independently decoded six whole4second postmaster windows contain176400finite Float32 samples each, all nonzero. Natural transients/sample differences in songs do not establish or refute a pop. No physical output or human listening was used.

| Mode | Callback mean range (ms) | Callback p95 range (ms) | Worst frame interval (ms) |
| --- | --- | --- | --- |
| Horizontal, raw |2.85–3.15|5.8–6.4|91.4|
| Horizontal, two key locks |3.07–3.55|5.9–6.5|329.0|
| Vertical, two key locks |2.85–3.49|5.8–7.0|83.3|
| Horizontal, four key locks |3.17–3.73|6.2–7.1|84.2|

**Rare waveform frame stalls remain OPEN.** Callback maximum27.5ms and35observed long tasks (maximum88ms) mean this is not an every-frame16.7ms pass. The329ms interval lacks a corresponding recorded task of that duration; no CPU/GC/GPU diagnosis is asserted. The next software investigation should retain per-event frame timestamps and use a renderer performance trace around replacement/preview work; avoid another speculative waveform rewrite. The existing source-pixel cache stayed below33554432bytes (observed max33552384). Window heap estimates660.8–742.1MB are samples, not total process/RSS or transient allocation limits. Active decoded originals are protected, observed max642.7MB; inactive max162.4MB under268.4MB budget. Final4active originals599.4MB, inactive0. No whole-process cap is claimed.

The existing24actual Canvas orientation/DPR/subpixel/color/stereo-transient cases still pass. An additional offline AudioBuffer-acquisition check leaves an in-flight waveform profile intact; this candidate failure was not reproduced and prompted no waveform product change.

[Complete real-track measurements](four-deck-soak-complete-results.json), [independent inspection and limits](four-deck-soak-complete-summary.json), [Canvas/pending-profile results](four-deck-soak-source-profile-results.json). Full private PCM is retained locally; only measurement receipts enter Git. The waveform renderer itself is unchanged from0.1.43. The only product repair in this pass is the existing ordinary-forward key-lock handoff.

## Delivery checkpoint

Desktop0.1.44 packaging, existing-profile stopped startup and five-card Trello readback are the remaining delivery checks for this slice. Broader musical/physical pops, unsupported/ambiguous grids, rare frame stalls and full vendor parity remain OPEN. No effects/stems/video expansion, redesign or broad refactor.

Private protocol, hashes, original failures, raw PCM and screenshots: ignored local-evidence/four-deck-soak-2026-10-23/. Public receipts contain measurements/metadata only, no user audio or proprietary extracted assets.
