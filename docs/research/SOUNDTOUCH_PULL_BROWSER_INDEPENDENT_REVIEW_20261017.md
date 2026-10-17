# Independent portable SoundTouch transport browser review — 2026-10-17

**Verdict: 0/4 cases accepted.** The whole portable cohort completed, but every case fails the unchanged scheduled-frame-tag capture gate. Passing signal checks cannot override this failure. The parent executed the browser; this review independently inspected saved originals offline and did not operate UI, processes, devices, services or production.

## Executed whole-artifact checks

Executed `python3 docs/research/SOUNDTOUCH_PULL_BROWSER_INSPECTOR_20261017.py`, producing a NEW immutable result. All four complete raw hashes/byte geometries match their reports: 3,226,624 frames in 25,208 producer rows of 128 frames; two 4-channel and two 12-channel originals. Every sample is finite; all sequence/frame labels are strictly contiguous; arm/stop counters match whole raw lengths. Both requested/context sample rates match.

Recomputed all 120 declared-window tone measurements from original raw PCM; crossings match reports within1e-7Hz and RMS within1e-10. Their largest crossing error is .115108Hz. Supplemental16× global Hann estimates also meet 1 Hz, largest error .218685Hz. All 307 Hz controls meet .01 Hz; both declared pause windows are exact zero in every addressed output. Entire corresponding channels of the identical five-source fixtures have matching byte hashes. This is not real separated-stem reconstruction or phase acceptance.

All seven ready acknowledgements preceded the first scheduled start in each report. Preparation timing is honestly null with `preparationClock:unavailable`; no CPU-time or rendering-deadline result is invented. Disposed snapshots contain no active/pending epochs and sourceBytes 0. These observations concern this fixed legal timeline, not arbitrary failing command batches, pending-load cancellation or a general application adapter lifecycle.

Every one of the 20 frozen startup route records matches current source SHA256; independently reconstructed served bytes match served SHA256. Exactly one bare Lanczos import is rewritten to its fixed local URL by `scripts/serve_soundtouch_transport_experiment.py:20–43`; no other source/DSP transformation is present. This source manifest is server-startup metadata, not hardware/runtime attestation.

## Capture failure and bounded diagnosis

| Case | Whole frames | Maximum original frame-tag residual | Inferred ramp-start frame |
|---|---:|---:|---:|
| single-44100 |772,608|510.711914 samples|511.999999|
| five-44100 |772,608|1,011.908203 samples|1,023.999999|
| single-48000 |840,704|893.490234 samples|895.999997|
| five-48000 |840,704|1,389.843750 samples|1,408.000002|

The 0.25-sample original budget fails in all four. All case acceptance flags remain false. No row, origin, sample or timestamp was repaired, trimmed, offset or substituted. Small tag step residuals (maximum .0625 sample) and contiguous producer labels do not rescue the failed global comparison.

`transport-harness.mjs:50–66` resumes a running context, registers modules and then schedules value 0 at past time 0 followed by value60sr at time 60. The source assumes that this produces a frame 0 anchored ramp. The raw tags instead fit an affine model with a positive start anchor B: tag=(frame−B)*60sr/(60sr−B). Nearest render-quantum anchors512/1024/896/1408 fit all original tag samples within .0941/.0981/.0900/.0908sample respectively. This is a strong match to late-start ramp anchoring, not evidence of duplicate/skipped PCM in these rows.

Those anchors are inferred from the same saved data, not recorded scheduling-call times. The fit is **diagnostic only**: it does not independently prove the browser's internal clamping mechanism, establish a universal specification/runtime cause, repair this cohort, or explain the older native cursor-clock failures. A prospective observer must declare a future anchor, retain actual scheduling metadata and arm after it; it must retain the same global gate and its own originals. AudioParam and producer clocks also share a browser renderer; agreement would not become an independent physical-output clock.

## Preserved failure and scope

The first cohort remains a separate operational failure: each of its four originals has 512 captured frames and `performance is not defined`, with every case false. Original report SHA256 `72d99fe67b6cb0f50dd0c241ea652d86a8bb99d4b31a2e7d2f13b51372eebd14`. The portable module replaces that unsupported timing access with optional timing and explicit unavailable metadata; this does not regrade the initial failure.

The current portable cohort is not accepted despite successful conditional signal checks. No main-app/native/MIDI/audio-device behavior, measured audible cursor, earliest release position, transition continuity, EOS tail preservation, musical quality, CPU headroom, long-session stability or Serato-reference parity was established. Core positions remain explicitly nominal. Production assets and the native0.1.6 pitch failure are unchanged.

## Frozen owned identities

- Portable original report: `b9f308246a5452dc7bed05455d720149fedf0b4a7c774bf6db003b540ee0f306`.
- Independent result `SOUNDTOUCH_PULL_BROWSER_INDEPENDENT_RESULTS_20261017.json`: `8c1eff4a4ceff812182725aea63e33a66f61587d9d23833d918092d0612377e7`.
- Owned inspector `SOUNDTOUCH_PULL_BROWSER_INSPECTOR_20261017.py`: `5b369ca11d3707d9e546d7f9ff2e0efac42c50ee869d8976f6c6f912eca555ed`.
- Portable core candidate: `659f49b9a37769839d6826a8e1ca67cf980c75d4bb2fdc0b30727ec9091041ad`; worklet: `81c7ce9b120fdef3a47da33a784c8b2306c38698981a8828b2af21a951607969`.
- Capture source: `355aac09a776361d2d10a1b9a18d8e771b33a307a850a43ac8b97ae115b0a980`; harness: `530c99d41c75637b8c4c6d57b588290cf26e7ef6af5fc45ffe47c1dd6673b3d0`.

Skills applied: use, adversarial-verify, systematic-debugging, dec-quality-testing, dec-software-principles.
