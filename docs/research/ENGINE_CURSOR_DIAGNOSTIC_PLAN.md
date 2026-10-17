# Production-engine audible-position diagnostic

17 October 2026. Declared before the first native Run. Previous goal turn was progress: actual 0.1.5 keylock controls and the separate seven-case engine test were executed, independently checked and pushed at `f7a2db6`. Full parity remains open across 110 groups, 522 requirements and nine separately inventoried beta deltas.

## Constraint ledger

- **Outcome:** close real Serato behavior gaps, including pitch, continuity and correct audible return position. This finite diagnostic is evidence toward that outcome, not a substitute for it.
- **Target now:** unchanged real production AudioEngine/WASM, forward unlooped keylock at rate 1.08 and +12 semitones. Test ten same/different-region stationary, forward, backward, quick and throw returns.
- **Must:** execute actual WebAudio; calibrate the source-position estimator; preserve invalid captures, every armed producer row and complete four-channel PCM; use the existing 10 ms position, .8 correlation, .04 uniqueness and 20 ms pitch/gap budgets.
- **Must not:** change the 0.1.5 product bundle, source audio engine, physical device state, activation or vendor code; trim/repair a bad armed span; infer sample-exact audible position or music/reference quality from this test.
- **Authority:** local desktop tests were explicitly approved. This separate official Electron 44.9 diagnostic host uses port 18769, an ephemeral partition, sandbox/context isolation/no Node renderer and denied permission callbacks. The existing product app and its tested bundle remain intact. No native DSP rewrite or public release.
- **Done evidence for this unit:** actual native report, complete raw PCM/hash/producer rows, valid steady calibration, every case's pitch/control/cursor measurements and independent review. A failed result must remain failed and guide the next correction. The full project goal stays active until its complete scope is proven.

## Measurement

An independently generated 16-second stereo source uses 440 Hz left and a 660 Hz carrier with deterministic, nonperiodic 73 ms amplitude cells on the right. At +12 semitones the pitch target is 880 Hz, distinguishable from raw rate-only 475.2 Hz. The marker estimator searches the entire valid source range at 2 ms spacing, refines the best candidate at .25 ms, and requires correlation >=.8, a >=.04 margin against a competitor at least50 ms away, and error <=10 ms against the scripted trajectory. Expected position is used only after fitting, never to restrict the search.

Three 400 ms marker intervals start at release, +50 ms and +200 ms. “Earliest” here means the fitted interval beginning at release; an interval can conceal a shorter wrong-position transient. It is not a first-sample cursor measurement. The steady real-engine calibration measures the same three windows against known start position and the accepted audio-clock anchor before interpreting any scratch result. Failed calibration leaves cursor conclusions oracle-not-established.

One continuous four-channel capture retains deck L/R plus independently generated 307 Hz control L/R. Every armed block's original frame/sequence/input-channel/length information is exported. Both control channels are actually fed by an explicit merger and independently checked. Startup discontinuities may occur before 64 contiguous preflight rows; every armed discontinuity fails the whole capture, with no timestamp rewrite, repair or trimming. Raw bytes concatenate every received block; JSON rows preserve its true geometry even when invalid. Analysis runs only after audio cleanup to avoid adding analysis load during the observed interval.

Quick cases measure the active hold after Begin acknowledgement, requested30 ms and required <=50 ms. They do not prove a physical30 ms touch or cancellation before readiness. Requested motion and acknowledgement times are retained; returned raw position must also match the independently scripted trajectory. Actual renderer scheduling costs remain visible failures, not extra tolerance.

## Preparation and review

`node scripts/test_engine_cursor_diagnostic.mjs` executed8/8 analytic/producer checks. It rejects a180 ms wrong cursor despite correct pitch, ambiguous flat/periodic/silent markers, insufficient early PCM, duplicate armed frames, missing control, nonfinite PCM, changed lengths/sequences/fences, false preflight and premature arm. These are controlled checks, not native runtime evidence.

Independent review caught two initial source defects before Run: a failed final source fetch could prevent evidence export, and mono/discrete control upmix did not prove right-channel control. Corrected source bounds/catches final identity checks, retains transcript even on validator exceptions, explicitly feeds both controls and checks both. Initial controlled snapshot remains preserved. The reviewed frozen harness SHA is `b8e45417bce1fc9411d58ad02416c751c73750339d8792eca5384f73def622a9`; oracle `aadf86b0f524af1fa4a4b30e69214f00fe3c096ecedfc11716d56da982c7b577`; capture `3b605149cb5b6adec647115c25c18818aa5bcb0fe38d2c11214ea81047594a92`.

Run: `./desktop/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron scripts/run_native_cursor_harness.cjs`, then click Run in its native window. Save the full JSON and four-channel PCM under new names. Do not overwrite previous results or equate this source host with the packaged product's main interface.

Next after measurement: fix any demonstrated production error without relaxing these criteria, then extend compound reverse/loop/Stem Slip, varied rates/music and real reference/device comparisons. Full FX/stems quality and other backend gaps remain in the current parity audit.

Skills applied: use, dec-software-principles, dec-quality-testing, adversarial-verify, claude-codex-handoff.
