# Browser pitch cohort — independent artifact review

17 October 2026. Skills matched (5): use, adversarial-verify, systematic-debugging, dec-quality-testing, dec-software-principles.

**The complete browser artifacts confirm neutral-bias removal and retain the shifted/low-bass failures.** All six captures completed; **only two cases meet their individual criteria**, not six. No product/native/MIDI/music/CPU/reference or full-parity acceptance is established. Parent operated the separate browser experiment; this reviewer performed offline source/hash/PCM/clock/control measurements only.

## Executed whole-capture and identity checks

The original bounded report SHA is **70730b4b13aa59acffede2985f4af892755ce9ced629cf9bfa61af10e1f993b7**. Independently read every complete retained raw file: **2,187,008 four-channel frames /8,748,032 finite Float32 sample values /17,086 producer rows**. All six file hashes/byte counts match; every sequence starts at0 and increments once, every row is128 frames with exact contiguous integer/currentFrame labels, and every arm/stop counter agrees with all retained rows and total frames. No invalid row was omitted or repaired. Durations are8.2547–8.2721s, exceeding the unchanged8.25s minimum; queried latency remains.12s.

Resolved all five actual served-source hashes: `/harness.js` maps to `experiments/keylock-history/harness-bounded.js` (593fa08e…), capture1915c70d…, production processorb2811c51…, history processor1f470f84…, plan6ac4fca9…. The report's embedded plan equals the original plan file. Both relocation-map entries match the retained experiment bytes; no missing temporary source identity was silently reassigned. Independently decoded embedded WASM literals in production/history: identical SHA **83869197b3c5ebf9fc8c517a1586aef1ecf77404842218d62b9c0e82882d8ca3**. The history experiment is not a replacement native006 algorithm.

All six source/control channel geometries match. Both307Hz control channels are bit-identical over each entire capture. Recomputed all24 reported mean-removed positive-crossing frequencies and RMS values from the actual5–7s PCM; they agree within1e−7Hz/1e−10RMS. A separate global-Hann16× spectrum yields the same case pass/fail decisions. All controls meet the predeclared.01Hz budget, approximately306.999985Hz; their identity does not prove an independent hardware clock or repair earlier native timestamp failures. Descriptive whole-span phase-fit residuals remain in the result, not a newly introduced acceptance test.

## Actual numerical outcomes

The neutral cases deliberately use a **.01Hz diagnostic** limit; shifted cases use **1Hz**. The neutral baseline's.43Hz bias is not newly reclassified as failure of the older native0061Hz neutral criterion. Windows, budgets and all six cases are unchanged from the browser plan.

| Case | Independent Hann left/right Hz | Outcome |
|---|---:|---|
|Baseline neutral|330.430930/550.426654|Fail.01Hz diagnostic|
|History neutral|330.000000/550.000000|Pass.01Hz diagnostic|
|Baseline+2|371.458642/617.934324|Left error1.046166Hz, fail|
|History+2|371.450225/617.824146|Left error1.037749Hz, fail|
|Dense+2|370.813502/617.539534|Both within1Hz, pass|
|Dense low bass|47.370392/86.744960|Expected48.5/86.5; left error−1.129608Hz, fail|

These corroborate the serial-WASM diagnosis in a separate actual WebAudio processor runtime: complete history removes the neutral bias, but does not solve shifted accuracy; denser analysis passes the original pair while retaining the known low-tone regression. The raw data do not uniquely establish the remaining intrinsic/configuration cause. Queried latency and successful tones do not prove native scheduling, CPU headroom, music, handoff/cursor or long-session behavior.

## Failure retention and reporter limits

Initial browser report remains **completed:false**, SHA **00bf45bdc996c6419de50ca2ff3502fc37a2b4b1e085ed8f485abceae24d2441**. Its three complete raw files match their original hashes. The fourth history+2 partial PCM has no retained file/reference and is **unavailable**, not zero, reconstructed or accepted. The later six captures are a separate cohort, not repair/regrading of the timeout. A long accessibility traversal preceded the timeout, but these artifacts do not prove the timeout's cause.

Source caveat, not an observed loss in the completed cohort: `experiments/keylock-history/harness-bounded.js:25` awaits disposal before raw serialization/upload at`:26`–`:28`. Cleanup rejection/hang could still prevent that upload, so a universal **“always flushes partial PCM”** guarantee exceeds the code. All six current raws are present and verified; that caveat does not invalidate them. Four-second capture acknowledgments are not a bound on every stretch/cleanup operation.

The first offline inspector emitted NumPy BLAS warnings only during an optional descriptive phase-fit multiplication. Its result was retained. Explicit componentwise finite arithmetic reran offline without warnings and produced a **byte-identical result** and unchanged gates; this was not a browser retry or evidence correction.

## Owned outputs and acceptance boundary

Inspector: `docs/research/KEYLOCK_BROWSER_PITCH_INSPECTOR_20261017.py`, SHA **7e18c072028e02e6e2c90481ff0e128427e00d8926e7cca70fcea42954beaec9**. Final result: `docs/research/KEYLOCK_BROWSER_PITCH_INDEPENDENT_FINAL_RESULTS_20261017.json`, SHA **e48ef4e212f1cabf37e23f205e5554fced875e338f0e597a371b14d5209838d8**; the initial owned result is separately retained with the same bytes/hash. It includes every capture identity, row endpoints/counters, full finite checks, crossing/spectral/RMS measurements, source map, controls and initial-run preservation.

Capture code zeros its outputs and the harness sets destination gain0; no physical acoustic or device-input test was performed by this reviewer. No raw/shared report/production/native bundle/UI/server/Git file or process was changed. The original native0061Hz failure and all prior cohorts retain their own outcomes. History and dense configuration remain experiments; future main-app/native acceptance cannot be inferred from these six standalone captures. SoundTouch work is outside this review.

Skills applied: use, adversarial-verify, systematic-debugging, dec-quality-testing, dec-software-principles.
