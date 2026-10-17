# Independent anchored SoundTouch transport browser review — 2026-10-17

Verdict: **4/4 new cases meet the declared experimental browser criteria.** This is a separate future-anchored observer cohort, not a repair/regrading of portable 0/4 or initial 0/4, and not production/native keylock acceptance. The parent executed the browser; this reviewer independently inspected complete saved artifacts offline.

## Executed checks

Executed the NEW `SOUNDTOUCH_PULL_ANCHORED_BROWSER_INSPECTOR_20261017.py`. All four complete originals match recorded SHA256/byte geometry: 3,224,832 frames in 25,194 producer rows of 128 frames, with two 4-channel and two 12-channel recordings. Every sample is finite; all producer sequences/frame labels and arm/stop counters match raw geometry. No row, origin or sample was dropped, offset, repaired or replaced.

All four original frame-tag arrays meet the unchanged .25-sample global residual limit; observed maximum global and step residuals are .0625 sample in every case. These are direct original-tag versus original-producer comparisons, not affine fits or inferred origin substitutions.

| Case | Whole frames | Future anchor | Observed arm context frame | Global tag residual |
|---|---:|---:|---:|---:|
| single-44100 |772,352|17,792|18,176|.0625 sample|
| five-44100 |772,096|42,112|42,496|.0625 sample|
| single-48000 |840,064|20,736|21,248|.0625 sample|
| five-48000 |840,320|50,560|50,816|.0625 sample|

Independently checked that each anchor is an integer 128-frame boundary, was issued while strictly future, has the declared 30s frame/time span, and that observed arming, processor arm acknowledgement and first raw row occur after anchor+256 frames. Every full raw interval ends before the ramp endpoint. Source `transport-harness.mjs:71–83` supplies matching integer values and frame/sampleRate times to the actual AudioParam calls. The declared .25 sample limit was not widened.

Recomputed all 120 tone-window crossing measurements from original raw; they reproduce report frequencies within1e-7Hz and RMS within1e-10. All meet the original 1Hz/RMS bounds, maximum crossing error .115108Hz. Independent supplemental 16× global Hann estimates also pass all 120, maximum error .218685Hz. All 307Hz controls meet .01Hz. Both declared pause windows are exact zero in every addressed source channel; corresponding channels of the five identical fixtures have equal whole-channel byte hashes. Input-hash metadata also records identical source clones.

All seven ready command acknowledgements preceded initial output start. PreparationMilliseconds remains null with preparationClock unavailable, never a fabricated CPU measurement. Final disposal snapshots contain no epochs and sourceBytes0. All 20 frozen served-route source hashes match current files; reconstructing the sole bare-Lanczos-import rewrite reproduces each served hash. The actual core candidate remains 659f49b9; no DSP algorithm change separates portable and anchored cohorts.

## Historical preservation and identity erratum

Rehashed the initial performance-failure report and portable clock-failure report: both retain their exact prior bytes and false acceptance flags. Preserved `transport-harness-initial.mjs` and `serve_soundtouch_transport_experiment-initial.py` match the source-snapshot manifest hashes. Old independent inspector bytes remain unchanged.

**Correction to my frozen portable prose review only:** its final identity list mistakenly names current anchored harness SHA 530c99d4 as though it were portable. The actual portable harness SHA is `ceb55ec3f47f4510dfb734bcac5c730d8de37259f0fe79151472610337d49641`, retained at `experiments/keylock-soundtouch/transport-harness-initial.mjs`. Both original portable report and my portable JSON inspection correctly retain ceb55ec3. The prose list sampled the subsequently changed disk file. This does not change portable 0/4, its raw hashes or clock failure. The frozen prior review is not edited; this explicit erratum preserves the distinction.

The new anchored report correctly records harness SHA `530c99d41c75637b8c4c6d57b588290cf26e7ef6af5fc45ffe47c1dd6673b3d0`. Its successful prospective frame-tag check supports this observer change; it does not establish a universal cause for earlier native cursor-clock failures. AudioParam/producer clocks still share a renderer rather than providing an independent physical-output clock.

## Limits and frozen identities

Accepted scope is only these four legal, preprepared seven-command experimental browser timelines at 44.1/48kHz with synthetic fixtures. The seek changes the expected broad source-frequency region; it does not prove the exact audible 20s cursor, earliest release sample, phase continuity, EOS tail or complete provenance of each blended WSOLA output sample. Identical five-source fixtures do not establish nonidentical stem reconstruction. No main-app/native/MIDI/device behavior, music, CPU headroom, long sessions or Serato-reference parity was established. Positions remain nominal and native0.1.6 is unchanged.

- Original anchored report: `0e3ca0588b885b142a51b1ac3edfe4bb787de04cf210787bba5f4168cdeaa9be`.
- Owned result `SOUNDTOUCH_PULL_ANCHORED_BROWSER_INDEPENDENT_RESULTS_20261017.json`: `13cb0874488570d1a8dfd66107c1537aee85839f799010834fc8bc0b1b1efe84`.
- Owned inspector: `f02862a6eb3c5ca5a21809a7225942a610db415389c01e819d2c5d443c6fa3b9`.
- Unchanged portable failed report: `b9f308246a5452dc7bed05455d720149fedf0b4a7c774bf6db003b540ee0f306`; initial failed report: `72d99fe67b6cb0f50dd0c241ea652d86a8bb99d4b31a2e7d2f13b51372eebd14`.

No product, existing raw/report/inspector/review, shared UI, process, service, Git, device or external account was mutated. Only the NEW owned inspector/result and this review were written.

Skills applied: use, adversarial-verify, systematic-debugging, dec-quality-testing, dec-software-principles.
