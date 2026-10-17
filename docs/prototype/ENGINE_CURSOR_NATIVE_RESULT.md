# Native audible-position matrix: failed capture preserved

17 October 2026. **No new full cursor or parity acceptance.** The first ten-case native matrix captured all ten requested cases but fails its declared whole-armed-span integrity criterion. The app's production engine and the separately tested 0.1.5 bundle remain unchanged.

## Executed path and complete evidence

The separate official Electron44.9 development host ran the reviewed source on port18769 with an ephemeral renderer partition, sandbox/context isolation and denied permissions. Actual native Run, JSON Save and full-PCM Save were executed. This host reads the worktree; it is separate from the packaged product. The normal product app was not replaced. Actual CmdQ closed the diagnostic afterward; its process exited0 and port18769 had no remaining listener.

The complete JSON is `engine-cursor-native-initial-results.json`, 3,261,506bytes, SHA `98f0147512f10a86c302f47dccd766bdf0689d3ab66cab5506747758c28235a8`. It reports22.736seconds at44100Hz, ten captured cases, `completed=false`, `allCriteriaPassed=false` and six armed frame errors. Source hashes stayed unchanged. Calibration and case analysis were deliberately blocked by the full-capture gate; the visible result is0/10 accepted, not ten functional failures and not ten passes.

Every received armed block is retained in `Downloads/engine-cursor-native-initial-complete.f32` and ignored `local-evidence/engine-cursor-native-initial/complete.f32`: 15,775,744bytes, 985,984frames, interleaved Float32 little-endian deckL/deckR/controlL/controlR, SHA `189c5708ef1e35719563f5a0e2011ec737f6c9e5107326d1be7ebb1b5985dc52`. Every sample is finite. The committed JSON contains complete original producer rows, channel counts/lengths, preflight, arm and final fence. No PCM or timestamp was repaired, removed or reordered.

Three duplicate/skip timestamp pairs caused six errors. Duplicate-labeled sequence6700 reports frame857472, then sequence6701 reports857728; the next pairs are7170/7171 at917632/917888 and7406/7407 at947840/948096. Original sequence numbers continue advancing. These are real failures under the declared metadata criterion even though each pair later catches up.

## Independently established control-audio distinction

`../research/ENGINE_CURSOR_CLOCK_EVIDENCE_REVIEW.md` independently analyzes original raw offsets. Both307Hz controls are byte-identical, finite and RMS0.05656874347. At every suspect block the preceding1024samples predict the next128samples in received order with RMS error about5.76e-8–9.16e-8. Forced±128sample alternatives instead have roughly0.036–0.040RMS error; duplicate-labeled blocks do not repeat prior PCM. Thus the control audio continues phase across these specific timestamp anomalies.

This establishes timestamp/control-audio disagreement, not its cause, uninterrupted deck/WASM audio, the accuracy of all runtime clocks, or cursor acceptance. Do not reclassify the global capture as valid from this control result.

## Exploratory original subintervals, not acceptance

`scripts/inspect_engine_cursor_initial.mjs` separately reconstructs original contiguous800ms intervals from the recorded frame/sequence geometry and raw byte offsets. It rejects any requested interval with a gap/overlap/missing input. It never rewrites the preserved run and sets every `acceptedCase=false`; output is `engine-cursor-native-initial-subinterval-diagnostic.json`. The original global armed gate remains failed.

Exploratory calibration fits are confident within about0.5–0.75ms. The ten original release intervals have useful pitch and marker diagnostics, but several early400ms marker windows fail the unchanged.04 uniqueness margin. For example, the backward/same early fit selects a distant alias with insufficient confidence; it does not prove that playback returned seven seconds away. Other throw/forward fits can be near the intended position and still be ambiguous. Such values cannot establish exact cursor or be promoted to passing cases. These finite interval fits also cannot prove first-sample position or short transients inside a400ms window.

Quick active holds were about34.83ms after Begin ACK in this run; physical touch/preparation cancellation is a separate criterion. These timings and raw-return position receipts are retained without promoting source clocks to audible-position proof.

## Preparation defects corrected before execution

The eight analytic/producer checks passed, preserving the initial controlled snapshot. Independent review found evidence-export and control-channel defects before Run: final source identity work needed a bound/catch, validator exceptions needed unconditional original-row retention, and both control channels needed explicit feed/checks. Those corrections were reviewed on frozen harness `b8e45417…` before the actual run. Controlled correction checks are independent of native acceptance; see `../research/ENGINE_CURSOR_DIAGNOSTIC_REVIEW.md` and its unique raw result.

## Next exact diagnostic

Add an independently scheduled AudioParam clock to the test recorder and retain its actual per-block values alongside unmodified currentFrame/currentTime, original PCM and control phase. Compare clocks before changing any production scheduling or capture acceptance. Improve marker information/independent calibration where global fitting is ambiguous; preserve all current confidence/error budgets and the failed original run. Do not repeat the identical matrix hoping for a clean result, invent missing samples, or label an ambiguous fit a proven engine defect.

Primary background is narrower than a cause finding: the [Web Platform timing test](https://chromium.googlesource.com/external/w3c/web-platform-tests/+/master/webaudio/the-audio-api/the-audioworklet-interface/audioworkletglobalscope-timing-info.https.html) checks known OfflineAudioContext quantum boundaries; it does not diagnose this real-time run. A [separate Chromium MediaStream timestamp issue](https://issues.chromium.org/issues/422449024) explicitly distinguishes its AudioData timestamps from worklet currentTime, so it must not be cited as proof of this failure's origin.

Keep the full110-group/522-requirement scope, nine beta deltas, SCNet quality failures, exact FX/reference controls, compound keylock/Stem Slip, Link/providers/files/DVS/HID/Video and physical-device requirements open. No native DSP rewrite or public release is implied. Existing successful native keylock/persistence/hardware subsets keep their original scope.

Skills applied: use, dec-software-principles, dec-quality-testing, adversarial-verify, claude-codex-handoff.
