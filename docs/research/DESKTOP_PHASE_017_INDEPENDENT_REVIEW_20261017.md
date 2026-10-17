# Optional desktop phase 0.1.7 independent review — 2026-10-17

Both separately predeclared **8–10second stereo audio criteria are met** in the retained native recordings. Actual ASAR routing and preservation checks also agree with the package record. This reviewer independently parsed packaged bytes and decoded whole originals; parent performed native UI actions. No full keylock/native-product parity acceptance is awarded.

## Executed original-audio checks

Ran the two new independent inspector scripts, decoding every original frame through ffmpeg without trimming, resampling, channel changes or source injection. Download originals match retained copies byte-for-byte. Both complete stereo48k decodes are finite, including initial/final silence and transitions. Every1second window plus final partial window is retained separately, with full original frame coverage.

| Case | Whole frames / duration | Original SHA prefix | 8–10s left / right | Absolute errors | RMS left / right |
|---|---:|---|---|---|---|
| +2 shift, keylock on | 1,393,920 /29.04s | 9a4573635e10 | 370.474245 /617.457599Hz | .061769 /.103472Hz | .043568 /.043544 |
| Return shift0 | 2,367,360 /49.32s | 1df72f455f33 | 330.004492 /550.008020Hz | .004492 /.008020Hz | .043554 /.043526 |

Both channels in both declared windows meet original error<=1Hz and RMS>.001. Independent global20–20000Hz Hann FFTs (>=16× padding, log-parabolic interpolation) reproduce parent values; search is not restricted near expected tones. Additional interpolated-crossing estimates are370.480304/617.465497 and330.000955/550.005839Hz. Parent inspection’s30 and50 complete/partial one-second window values also reproduce. These ancillary windows remain descriptive, not a new post-hoc acceptance threshold.

Whole decoded hashes are `e6a9ed0ac2b622600ee9153833f41173f78a2e70b4c2ac308f92c4da17b7a140` and `9757ea110855fb6dac775da5beeb93d73244406938e948b2b682936834ca0066`. The input fixture’s whole original hash matches predeclared `99833309d13090de63a9fcdb7ca8f6bcf601975bfb8cb2e3ef691bb369a0a119`. Return-plan/audio-result are separate records; earlier source/threshold/failure evidence was not replaced.

## Executed package/routing checks

Independently parsed actual ASAR header/tree/offsets and checked payload bounds. Whole new archive SHA is `6d79bff7d0c33a827ff3734ba2485293571a90102275e3fbebe3212b4592b025`, unchanged across both cases. All83 directly staged file hashes match; sanitized root package metadata is checked separately, not falsely counted as matching the unsanitized84th staged entry. Version0.1.7/name/main are correct.

The selected packaged adapter imports `./vendor/open-play-soundtouch/node-factory.mjs` (`assets/prototype/keylock-shadow-live.js:5`); factory imports guarded phase control and the real node-worklet; worklet imports the phase clock/controller; pull transport imports packaged SoundTouch and the registry resolves packaged Lanczos. Critical hashes include adapter `da4fb5992d1cbe64f2525ac96ee7656c0e6655a47db4025907371469b663968d`, factory `32a667c98a2ab38dde9b7dd70438825ffaf5b1554d80708df702cc7f603e154f`, clock `9665c6004131b4acbdc234e8157d8b4c6ee9fd0d05051224d3efed42ce83aecf` and helper `7df4184de9a98bf0d4aa23e11551c903c0a4a44b1b42a504db879715d527a2a9`.

The old0.1.6 archive retains SHA `f9e85d9ef3150fd37c15f5b3d72a4e3f6a06a42a59bf29617a43bdf566cdba6e`. Comparing actual archives gives221 identical of222 baseline prototype payloads, with only the selected keylock adapter differing. Engine remains `b4683c245c6314432c06f891e85106cf0a1a5c0a615435516930ab5b38f64adf`. Packaged main.cjs:5–17 contains separate test profile, port18770, persistent partition and sandbox/contextIsolation/nodeIntegration settings. Reading these bytes is source evidence; parent’s144 controlled permission callback tests were not independently rerun and do not establish physical permissions/hardware acceptance.

## Claim boundaries / defects

No new discrepancy found in the bounded byte/audio checks. `desktop-0.1.7-phase-package-inspection-final.json:609` correctly limits its controlled/packaged evidence; `desktop-0.1.7-phase-audio-inspection.json:776–778` limits the native recording claim to its steady criterion. Packaging alone cannot prove running PID, title, profile noninterference, a selected runtime path, or user actions. Parent supplied those observations; this review did not operate the UI, inspect devices, or independently witness default-launcher/profile state.

The second stationary330/550 fixture supports restored pitch but cannot establish waveform-click seek~60.2s, exact source position, sample cursor, release latency or instantaneous continuity. Neither recording establishes music quality, stereo routing to physical devices, scratch/loop/reverse/stems combinations, all rates, long native sessions, native heap stability, or full Serato parity. Older0.1.6 pitch failure and all prior failed captures keep their original results; these are new separate0.1.7 observations.

Independent originals/results remain separate and immutable: `DESKTOP_PHASE_017_INDEPENDENT_RESULTS_20261017.json` SHA `a24125e6148225a17d376a4b5fe260b55fc84b6653eda30c5e4a81b9a2b0e6ca`; `DESKTOP_PHASE_017_RETURN_INDEPENDENT_RESULTS_20261017.json` SHA `48e9addc65ecf6bc8dff3dba995bb43a94fd2a6d8ce9fa0e75eb3ff3a84f597e`. Inspector scripts bear the corresponding `...INDEPENDENT_INSPECTOR_20261017.py` names.

Skills applied: use, adversarial-verify, systematic-debugging, dec-quality-testing, dec-software-principles.
