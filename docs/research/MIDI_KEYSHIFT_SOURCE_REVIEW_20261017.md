# Independent MIDI Key Shift source review

17 October 2026. **Two concrete production-path defects were reproduced and corrected: lost rapid relative steps during a pending Stem Slip commit, and unrelated high-numbered CC messages entering a 14-bit pair.** The revised four-deck dispatcher/app boundary executes 11/11 owned controlled checks. Two test-harness evidence-loss paths were also corrected. These are source/controlled results; they do not independently establish physical MIDI, browser audio, native packaging or reference parity.

The reviewer wrote only the owned dispatcher script, uniquely named controlled results and this report. No production, GUI, device or Git action was performed. The parent owns source corrections and actual browser execution. `engine.js` remains unchanged at `b4683c245c6314432c06f891e85106cf0a1a5c0a615435516930ab5b38f64adf`.

## Confirmed production defects and corrections

### Relative intent was read from engine state before a pending commit could update it

Originally, `receiveMIDI` converted each relative step from `d.keyShift`; `setDeckKeyShift` then awaited `engine.setPitch`. The actual engine can await a committing Stem Slip promise before writing pitch (`prototype/engine.js:896–906`). Two concurrent +1 messages therefore both requested +1 rather than accumulating +2. A +1/−1 pair incorrectly ended at −1 instead of zero. A same-track mode replacement could similarly lose the newer desired owner.

These were executed using the actual extracted dispatcher/app helper region and actual `AudioEngine.setPitch` method, with controlled pending promises and no audio. The meaningful preserved red is `docs/prototype/midi-keyshift-dispatch-review-red-results.json`: 7 passed / 4 failed, including the requested Deck 3/4 expansion. The parent's separate red replay remains separate evidence.

Current `prototype/app.js:612–635` reserves a desired request in a per-deck WeakMap without prematurely rewriting engine state. `keyShiftIntent` uses that request only for the same loaded track. Only its current owner persists/renders after the engine returns, and only that owner clears the request in `finally`. MIDI conversion uses the intent getter (`prototype/panels.js:1561–1566`); the shared GUI +/- path does too (`prototype/app.js:842–845`). Engine state and rollback remain engine-owned.

Executed corrected outcomes:

- +1/+1 during a held commit: actual pitch remains 0 while desired intent becomes 2, then actual pitch commits 2.
- +1/−1 during that commit: final pitch 0.
- An older mode owner finishing while a newer same-track request waits: desired intent remains 2; another +1 commits 3.
- Track replacement plus a newer GUI request: replacement track retains pitch 5, with only its current request persisting/rendering.
- Two rejected operations: both reject with the exact injected commit error; desired intent falls back to actual pitch 0. The test checks rejection reasons, so an unrelated VM error cannot falsely satisfy rejection coverage.

### A 14-bit CC pair also matched unrelated CC80/112

The original modulo-32 test accepted CC16, CC48, CC80 and CC112 as the same pair. An executed original dispatcher sequence mapped CC16/MSB=1 to −24, then unrelated CC80/value=127 changed pitch to −23. Calling `mappedValue` twice on the **same byte** was not the cause: that pair assignment is idempotent. No double-increment defect was demonstrated from that alone.

Current `prototype/midi.js:46–51` requires both mapped and received 14-bit CC numbers in 0–63, then matches their legitimate MSB/LSB base. `prototype/panels.js:1644–1655` rejects invalid high-numbered 14-bit CC mappings and canonicalizes legal pairs and pitch-bend number 0. Owned controlled execution confirms CC80/112 neither change pitch nor dispatch a persist, while legitimate CC16/MSB=1 followed by CC48/LSB=127 still produces −24 then −23.

The original manual reproduction used `midi.js` SHA `aeac2b847c26eb859d3ef9e6a98ea119a10c50f4caa218f0534cfbbde38776e5`, `app.js` SHA `e60194dcdf779eb770acc6222aab59ec60a1fe03cf42bee20ee7f1ba048aca72`, and `panels.js` SHA `73643bc2a7e21e4e4c14c0f3c950fb312a82b6b75517e453e1e0acd5684991f0`. Those production identities also appear in the preserved initial browser mute-failure record. The pair correction had already landed before the later owned 7/4 red replay; its pair test correctly passes there.

## Other dispatch boundaries checked

`prototype/panels.js:1561–1565` parses the explicit Deck 1–4 target index rather than treating any target without “2” as deck 1. The owned four-deck test observes pitches `[0,0,12,-12]` for Deck 3 and Deck 4 messages. This is dispatch evidence, not four-deck audio/hardware acceptance.

The remaining owned checks execute note-off and zero-velocity-note rejection, legitimate pair conversion, bounded settings on an unloaded deck without starting playback, and existing relative library browsing without changing mappings or any deck pitch. Mapping save/restore uses the existing application persistence path (`prototype/panels.js:1650–1656`; `prototype/app.js:125`, `:214`); actual store reload is a separate browser criterion.

No further concrete blocker was found in the bounded revised source. This does not certify every MIDI encoding/device, high-rate musical transition, cancellation composition or imported malformed mapping. Video MIDI targets remain outside this implementation unit. The installed immutable desktop 0.1.5 bundle is not silently upgraded by editing these prototype sources.

## Harness acceptance and evidence preservation

Two pre-run defects were reported and corrected by the parent:

1. Final source identity fetch/hash failures could previously interrupt final publication. Current identity calls reject non-OK responses, have a five-second bound, and final identity failure records `sourceStable=false` plus a fatal error before publication (`prototype/midi-keyshift-harness.js:5–6`, `:42`). An exact current-source segment executed with an injected identity rejection reaches publication continuation with those failure fields.
2. Recording decode previously happened before encoded evidence entered the report. Current `record()` stores complete encoded bytes, SHA and Base64 **before** bounded decode; a failure attaches `decodeError` (`:24`). Executing that source with a controlled decode rejection retains the complete original five-byte test payload and error. This checks the failure branch, not an actual codec.

The first actual mute test stopped at zero checks and no recordings; its evidence is preserved in `midi-keyshift-browser-mute-initial-results.json`. The source now waits up to two seconds for physical-muted state before fixture replacement or playback (`:26`). The reviewer did not independently operate that native/browser graph.

The harness loads actual index-body DOM and app module on an isolated origin. Only test tone buffers replace the two demo sources; real mapped actions invoke the application helper and real AudioEngine/WASM. Programmatic DOM interaction is explicit. Recordings use the existing postmaster MediaRecorder path (`prototype/engine.js:854–880`), not direct injected expected output. The captured endpoint is internal audio, not acoustic output or a newly packaged native app.

Latest acceptance counts are coherent: **eight initial checks / seven encoded recordings**, and **three restored checks / one encoded recording**. Five mappings—browse plus Deck 1–4 Key Shift—must survive reload. Initial recording expectations cover neutral, +12, −12, relative +1/reset and Deck 3/4; restored playback exercises the saved Deck 2 mapping. The selector assertion checks all four targets even though its historical test name still says “both” (`harness:28`, `:30–42`). This naming issue does not weaken the assertion.

The measurement window is declared at 0.2–1.1 seconds, with whole-recording finite checks and complete encoded artifacts retained. Its zero-crossing pitch estimate and max(1 Hz, 0.5%) tolerance are sustained-tone criteria, not first-sample or musical-quality evidence. Independent complete-file decoding/FFT remains a separate requested audio review. Current source-review approval does not pre-award those results.

## Executed test records and fixture failure

Owned script: `scripts/test_midi_keyshift_dispatch_review.mjs`. It extracts the actual app helper region, including request/getter declarations, and actual dispatcher, and uses the actual engine method with controlled no-audio collaborators. It is not a full app execution or standalone MIDI policy reimplementation. Every invocation requires a fresh output path to preserve prior evidence.

- `midi-keyshift-dispatch-review-initial-results.json` records an **invalid test-host attempt**, 1/10, after a concurrently added `matchesMIDIMap` import was omitted from the extracted-function VM. That result is uninterpretable as production acceptance or production failures. It remains preserved. The VM now injects the real export, and the rejection check verifies exact error reasons.
- `midi-keyshift-dispatch-review-red-results.json`: meaningful 7/4 source-boundary red, after the pair guard but before desired-intent/four-deck fixes.
- `midi-keyshift-dispatch-review-after-fix-results.json`: reviewer-executed **11/11** corrected checks. The parent separately executed the same owned script and saved `midi-keyshift-dispatch-review-final-results.json`; these are separate invocations, not pooled test counts.
- The parent's earlier actual browser 7/7/five-clip result is retained as `midi-keyshift-browser-pre-review-results.json`. It predates the expanded/current boundary and must not be presented as acceptance of all revised cases.

## Source freeze

| File | SHA-256 |
| --- | --- |
| `prototype/midi.js` | `bd1b0ffd6ade3f118b06f4131307ea55e420317c0f3334a1053f710aa7583dc1` |
| `prototype/app.js` | `abc0e15d47fb1546cde931c21072d9dbd6f4d78ba1c65cab0fc5841b12cf02bf` |
| `prototype/panels.js` | `565277e7620f5633e2c1a782fca8552f4a354630804648316a0919c270ae55ef` |
| `prototype/midi-keyshift-harness.js` | `a2795af5840b2ff1ab234a6e9c1d988c4e81e943a81a26e40dd1ac15fb07bdd6` |
| Owned dispatcher script | `df1cfff6b33a5b4b22e540a4e9cad1dbb6abf1b01b6fdd4edba435ffae0b59bc` |
| Reviewer-executed after-fix result | `b40a6c02c0bf6cf9d3f13656e458d10300e7c6ef234844aaaafd1e259b5c94f6` |

The full 110-group / 522-requirement goal, nine beta deltas and 26 provisional release checks remain open. Source correction and passing controlled subsets do not close whole-feature, native-package, physical mapping, Video or reference-compatibility gates.

Skills applied: adversarial-verify, dec-quality-testing, dec-software-principles.

## Subsequent browser/audio evidence — appended without replacing source history

The parent subsequently executed the frozen revised browser harness: initial 8/8 with seven complete recordings, then actual page reload and restored 3/3 with one complete recording. The separate [MIDI_KEYSHIFT_AUDIO_REVIEW_20261017.md](MIDI_KEYSHIFT_AUDIO_REVIEW_20261017.md) independently verifies all eight encoded identities, 573,120 decoded stereo frames for finiteness and all 16 declared channel-pitch/RMS criteria. Both phases' eight source hashes match each other and current files; all five reported restored mappings equal the initial saved array.

The FFT corroborates observable offsets, including relative +1 left-channel +1.160701 Hz initially and +1.097874 Hz after reload. These meet the original max(1 Hz, 0.5%) criterion but must not be described as exact tuning or dismissed as zero-crossing estimator bias. The Deck 4 recording is 1.440 seconds, not 1.500; it remains complete and above the declared minimum. No first-sample/transition, physical MIDI, newly packaged native app or full-reference acceptance is inferred. The parent executed browser/reload actions; the reviewer executed independent offline audio checks.
