# Independent experimental SoundTouch engine browser review — 2026-10-17

**Verdict: three cases satisfy the measured harness predicates; five-source 48kHz remains capture-invalid. The full declared cleanup criterion is unverified in all four.** This does not accept an installed/native backend. The parent executed browser UI; this reviewer independently inspected complete saved artifacts offline.

## Executed whole-artifact checks

Executed the NEW `SOUNDTOUCH_ENGINE_BROWSER_INSPECTOR_20261017.py`. All four whole raw files match their original SHA256/byte geometry: 3,201,152 frames across 25,009 rows of 128 frames. Every original sample is finite. Arm/stop counters and row sequence integers match full raw lengths. No original row, timestamp, offset, sample or failed case was repaired, omitted or regraded.

| Case | Frames/channels | Global tag residual | Producer labels | Measured harness verdict |
|---|---:|---:|---|---|
| single-44100 |748,288/6|.0625 sample|contiguous|pass|
| five-44100 |783,104/14|.0625 sample|contiguous|pass|
| single-48000 |814,336/6|.0625 sample|contiguous|pass|
| five-48000 |855,424/14|128.0625 samples|two duplicate/skip pairs|fail|

All four scheduled tags were issued before future integer anchors; capture begins after anchor+256 frames and ends before the declared ramp endpoint. The original .25 sample global gate is retained. Maximum tag sample-to-sample residual is .0625 sample even in the failed fourth case; that cannot override its 256 global-tag mismatches and four discontinuous row transitions.

Recomputed all 192 planned source/engine-monitor channel-window measurements. Crossings reproduce the reports within1e-7Hz and RMS within1e-10; all meet 1Hz/RMS>.01, largest crossing error .130996Hz. Supplemental 16× global Hann estimates also pass all 192, largest error .185464Hz. Whole-capture 307Hz controls meet .01Hz. Both declared pause windows are exact zero in every source and engine monitor channel. Measurements from the failed five48 capture are explicitly diagnostic-only, not an accepted subinterval/cohort.

## Selected owners, windows and source identity

All four reports retain selected group1 across neutral, shifted, keylock-off and warm-follow phases. Rebase selects group2 and the later snapshot contains only group2; resume creates a new adapter/group1 after selected voice removal. Before rebase, window start is positive and end exceeds 8s, demonstrating actual drop/refill beyond the initial append extent. This is selected-group continuity plus actual destination-tone evidence, not exact audible source position or seamless handoff proof.

Verified all 245 preserved served-source snapshots against the report manifest, including reverse reconstruction of the sole import-specifier rewrite. `/prototype/engine.js` is byte-identical to current production SHA `b4683c245c6314432c06f891e85106cf0a1a5c0a615435516930ab5b38f64adf`. The SRC implementation region is byte-identical to production. The server deliberately routes `/prototype/keylock-shadow-live.js` to experimental `live-adapter.js`; the installed application's adapter is not replaced.

Authoritative frozen snapshot `local-evidence/soundtouch-engine-browser-preflight/source-snapshots/prototype/keylock-shadow-live.js:78–98` preflights every node's protected cursor and 11s window capacity before dropping. It chooses a fresh group when unsafe; no one-second jump heuristic is used. The snapshot also passes true duration relative to fixed group origin and forwards effective pitch only once.

The frozen factory SHA is `eb7364e51f6f5b1026e9a88ba19d245083b2e68cf57e6404109a20bb2576845d`, with the unbounded registration await still present. Factory cancellation fixes and subsequent harness/worklet edits occurred after server freeze. Their exact differing hashes are recorded but **not credited to this audio cohort**. Successful registration here does not test canceled or stalled registration.

## Failed clock neighborhood and lifecycle gap

Five48 original rows: seq6645 frame902272; seq6646 repeats902272 while its actual tag starts902400.0625; seq6647 skips to902528. Later seq6673 frame905856; seq6674 repeats905856 while its tag starts905984; seq6675 skips906112. Complete original neighboring labels, tag samples and307Hz control samples remain in the NEW JSON. The control's one-sample recurrence residual across these boundaries is about1.5e-8–4.6e-8; its waveform is not a duplicated128-sample block. Source/monitor PCM becomes exact zero at seq6646, while seq6645 still has peak.140003. This characterizes a label/tag/control relationship, not a repaired clock or a proven platform/CPU cause.

The anomalies occur after the final resume tone window ends18.294s, around the final pause/100ms capture tail. Resume invocation/acknowledgement were16.242667/16.637333s; scheduled output16.794s, and its after-snapshot nominal clock implies18.794667s. Final pause invocation time and actual context-state transitions were not logged. Engine.start does call context.resume(), so my earlier immediate message saying no resume call after initial start was too strong; the recorded anomalies are not contemporaneous with the last recorded resume invocation.

Plan `criteria.cleanup_retained_pcm_bytes=0` is **not measured**: frozen `source-snapshots/engine-harness.mjs:88–94` checks `engine.voices.size===0` after 100ms. Production `engine.js:204–208,236–237` removes voice ownership while adapter.dispose runs asynchronously. No post-disposal retained-byte snapshot/acknowledgement is saved. Selected-voice absence is supported; zero retained processor PCM is not. The report's 3/4 count therefore names measured harness predicates, not execution of every declared lifecycle criterion.

## Preservation and limits

Initial report remains completed false/0 accepted: three InUseError cases, one RenderClockError case, plus the retained incomplete-window analyzer fatal error. Its four raw hashes were rechecked without fitting or accepting missing windows. The initial RenderClockError cause is not proven or fixed by this cohort; the fourth preflight clock failure also remains unresolved. No physical output, native package, MIDI/controller, nonidentical stem reconstruction, acoustic latency, music, exact cursor, EOS tail, CPU or full Serato parity acceptance follows. Engine monitorTap evidence is not a full post-master recording test.

Frozen files: original preflight report `45e7eec838650b4b3257539361279eaaae3e56afbe8d4d63a6d89b7af4f7e687`; initial failed report `d79f9f870143cb9579621f468c2e75ed3112419192a289e99c096f25bb53e4c9`. Owned inspector SHA `718d9d595aa0a9ea39e90a8319145feb1c155e474f4b5864f628410aa8cdf89f`; owned result `SOUNDTOUCH_ENGINE_BROWSER_INDEPENDENT_RESULTS_20261017.json` SHA `01da23e06a1e86b01063b300b1812cda5db01c7b6feb40e9050500bf9989d43f`.

Only the three authorized NEW owned files were written. No existing evidence, production source, UI, service, process, Git or external state was mutated.

Skills applied: use, adversarial-verify, systematic-debugging, dec-quality-testing, dec-software-principles.
