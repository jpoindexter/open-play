# Independent SoundTouch keylock experiment review — 2026-10-17

Verdict: the retained serial28 and browser6 artifacts support their bounded steady-tone criteria. They do **not** establish a production keylock fix. No product, native runtime, UI, process, service, or original evidence was changed by this review.

## Executed evidence

Executed `python3 docs/research/SOUNDTOUCH_KEYLOCK_INSPECTOR_20261017.py` against all originals, with fresh immutable final output `SOUNDTOUCH_KEYLOCK_INDEPENDENT_FINAL_RESULTS_20261017.json`. Source/geometry/finite/hash predicates are in inspector lines17–55. Its earlier overly strict cross-padding .001Hz comparison failed once; the exact discrepancy and initial inspector hash remain in `SOUNDTOUCH_KEYLOCK_INSPECTOR_INITIAL_COMPARISON_20261017.json`. This was an analysis-assumption failure, not a product failure or a changed 1Hz gate.

- All four exact2.1.1 archives match recorded SHA256 and registry SHA512 integrity; all108 archive files byte-match installed and recorded files. Declared MPL-2.0 notices remain present. This does not verify publisher signatures or audit the dependency's complete behavior.
- All eight held-out original stereo inputs match their whole hashes,14s geometry, finite values and analytic fixture formula within1e-7 per sample; all28 outputs match whole hashes/byte geometry and are finite:12,895,232 stereo frames.
- Serial28/28 satisfy the fixed5–7s1Hz/RMS criterion with no underflow intersecting that interval. Independently recomputed4× Hann estimates reproduce the parent's values within1e-9Hz; separate16× global Hann estimates also pass28/28, maximum error .656082Hz versus parent's4× .655752Hz.2,148 total underflow blocks remain outside the declared window; ten active seconds, seamless tails and real-time speed are not established.
- All six browser originals match whole SHA256/bytes, actual/requested sample rates,128-frame row geometry, strict sequence/frame increments, arm/stop counters and finite samples:2,283,264 four-channel frames across17,838 rows. Both307Hz control channels are bit-identical; independent FFT maximum control error is .00001436Hz. Every reported source snapshot hash matches its mapped current file. The report contains one source-hash snapshot, not independently witnessed before/after runtime identities.
- Recomputed crossings reproduce every reported browser frequency within1e-7Hz and RMS within1e-10. All6 pass the original crossing criteria; independent16× global Hann estimates also pass6/6 under the same1Hz audio/.01Hz control bounds. No interval was trimmed or relabeled.

## API conversion and meaning

Serial source `scripts/diagnose_keylock_soundtouch.mjs:13–17` feeds the real published JS WSOLA/Lanczos pipeline, setting pitchSemitones then stretch.tempo=rate/2^(shift/12). Actual package `core/.dist/SoundTouch.js:163–178,201–226,234–241` sets transposer pitch and reciprocal stretch before the explicit tempo override. This is coherent for these static cases; a later pitch setter recalculates tempo, so it is not an independently accepted dynamic adapter.

Browser `experiments/keylock-soundtouch/harness.js:18–24` matches source.playbackRate and SoundTouchNode.playbackRate, leaving pitch1 and applying pitchSemitones. The supplied publisher README:60,88–92,112,249–253,289 documents this conversion; actual bundled `audio-worklet/.dist/soundtouch-processor.js:1942–1945` divides desired pitch by playbackRate. Thus input frequency×sourceRate×desiredPitch/nodeRate yields the requested pitch; no tone-specific correction was injected. Requested1.08 is the same Float32 value on both AudioParams. Context sample rates match source buffers.

The capture processor `experiments/keylock-history/capture.js:2–3` reads both stereo signal/control inputs while outputting zeros; harness:21–22 also connects through gain0. This supports the experiment's muted graph claim, not independently heard output. Harness:29–30 checks all rows but measures pitch only in5–7s; its6/6 is neither a first-sample/continuity oracle nor proof that signal remains active everywhere.

## Estimator and acceptance limits

44.1kHz low-bass left is49.473130Hz by the declared crossing method versus48.907054Hz by global Hann, expected48.5Hz. Both meet1Hz, but the crossing margin is only .026870Hz. Similarly browser neutral Hann errors are about .026–.047Hz while crossings are within .01Hz. The optional .01 neutral diagnostic therefore remains estimator-specific; do not promote it to spectral purity or inherit it as a changed acceptance threshold. These method differences are retained, not averaged away.

The parent report `KEYLOCK_PITCH_DIAGNOSIS_20261017.md:29–35` is supported at this scope: serial maximum is the4× Hann estimate; browser maximum is the crossing estimate. Its explicit no-production/no-native/no-musical acceptance statement is appropriate. Naming those two methods next to their maxima would improve clarity but does not change any pass decision.

“Production keylock fixed” is refuted. Current `prototype/engine.js:296–298` still imports keylock-shadow-live; `prototype/keylock-shadow-live.js:5` still imports Signalsmith. Engine SHA256 remains `b4683c245c6314432c06f891e85106cf0a1a5c0a615435516930ab5b38f64adf`. This review neither reruns nor regrades native0.1.6's retained1Hz failure. No actual engine adapter, native MIDI/routing, dynamic-rate ownership, seek/loop/reverse/Stem Slip, cursor, latency, CPU headroom, repeated-start stability, music, hardware or Serato-reference acceptance follows from these tones.

## Frozen owned outputs

- Inspector SHA256 `9ad32f87cf41c61ec4405d2af720e8469fcc7c3c8475d801f78bec863c00d351`.
- Final result SHA256 `a7a3a7de2f4ccc5409617e2e0d4a143672bf8476bc17a48578c5f8d8e0c2ff7f`.
- Original browser report SHA256 `5181f5a9010492c9fbb966f5572e9aeb6c5549197d89714e60454b9545f78312`.
- Earlier owned result `SOUNDTOUCH_KEYLOCK_INDEPENDENT_RESULTS_20261017.json` remains unchanged; the final result additionally validates all original holdout inputs.

Skills applied: use, adversarial-verify, systematic-debugging, dec-quality-testing, dec-software-principles.
