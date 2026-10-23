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

Eight different existing MP3s, beyond the previously listened pairs: Czeslawa, DJ W!LD Call Me Later and AC!DMAT!C Jus-Ed remix, Disaffected, Fort Romeau No Limits and Breathe Trip Mix, Hinz & Ruhmhardt Doch, Mike Shannon Only Noodles. Original hashes match the earlier corpus and will be checked again after the session. Current native decoder/production analysis supplies the session's tempo/grid; old corpus fits are selection evidence, not injected ground truth.

Four compact decks, a planned1200-second timeline, a replacement every80seconds while the other three keep playing, master handovers, Horizontal→Vertical→Horizontal, two key-lock enables at400seconds and four by880seconds. Later captures/checks use playing Sync too. Track replacement has intentional paused/preparation intervals; this is not a claim that exactly four voices play every instant. Library rows can prepare previews while music continues. All files stay local in a separately named diagnostic IndexedDB; session settings are memory-only and the original saved session value is compared unchanged. Nothing is written to source audio or the normal desktop profile.

Per30-second windows: callback/interval summaries, rectangle counts, decoded owners,32MiB raster ownership, browser heap estimate, long tasks, master invalid-state counts, physical mute, core control counts and declared-grid phase. Continuous test-only AudioWorklet reports finite/gap/energy telemetry and emits silent output. Its finite signal/RMS, zero-run, invalid-input and silent-witness self-check executes separately. Short master windows remain private. Audio zero runs or high sample differences in real songs are not automatically pops; natural silence/transients require contextual review.

A successful software result requires1200seconds,15rotations, preserved controls/previews, no unhandled/non-finite errors, bounded raster ownership and declared-grid phase within5ms after transitions. Frame target is16.7ms; report per-window tails and outliers honestly rather than asserting every frame meets it. Browser heap/cache measurements do not cap total process/GPU/RSS or prove absence of garbage-collection pauses.

## Current execution checkpoint

The repaired extended run is pending. No long-session completion, new native startup or Trello reconciliation is claimed here yet. Those receipts will be appended after execution. Broader musical/physical pops, unsupported/ambiguous grids and full vendor parity remain OPEN. No effects/stems/video expansion, redesign or broad refactor.

Private protocol, hashes, original failures, raw PCM and screenshots: ignored local-evidence/four-deck-soak-2026-10-23/. Public receipts contain measurements/metadata only, no user audio or proprietary extracted assets.
