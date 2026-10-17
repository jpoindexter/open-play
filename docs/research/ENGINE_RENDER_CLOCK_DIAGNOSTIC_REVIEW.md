# Independent scheduled-render-clock diagnostic review

17 October 2026. **Source/controlled go for a NEW diagnostic run, with no native measurement accepted yet.** One declaration-validation defect was reproduced before execution and corrected. The corrected actual validator/processor passes **14/14 independent controlled cases**; the actual harness export statements retain a deliberately invalid capture's original parameter and four-channel PCM bytes. No remaining material measurement blocker survived this bounded review.

This reviewer did not run a browser/native host, change production or test-harness files, invoke Git or external services, repair timestamps, or reinterpret an earlier failed capture. Only NEW independent scripts/results and this report were written. A source/controlled go is permission to obtain evidence, not proof the renderer's actual automation behaves correctly.

## Criterion and design boundaries

The new a-rate parameter is a **separately scheduled render-clock observation**, not an independent hardware clock. Its backend can share state with `currentFrame/currentTime`; aliases are observations of the same API family. Agreement cannot exclude common-mode faults, prove deck cursor/PCM continuity or resolve the existing marker ambiguity. This boundary is explicit in `prototype/render-clock-capture-worklet.js:1`–`:3`, `:63` and the new harness scope.

The harness declares a future integer, quantum-aligned start frame; schedules value 0 at that frame's time and `60*sampleRate` at the endpoint 60 seconds later; requires a range below 2^22; and arms only after `startTime+.025` (`prototype/keylock-engine-render-clock-harness.js:89`–`:94`). This leaves Float32 headroom for the specified runtime. The `.25`-sample budget concerns agreement of observed Float32 values with declared integer-frame coordinates; it is not a physical sub-quarter-sample timing guarantee. Quantization may hide smaller fractional deviations. The previous discrepancy was 128 frames, a materially different scale.

Every actual armed parameter array is copied with its real length (`prototype/render-clock-capture-worklet.js:23`–`:26`). A constant length-one, absent, nonfinite or wrong-length active-ramp observation is **rejected**, never expanded to synthetic per-sample values. Before/after snapshots retain unqualified/globalThis frame/time values from the same process callback (`:12`–`:13`, `:25`, `:65`). They are not normalized, rounded or rebased into a replacement row clock.

Validation compares every parameter value against `declared.startFrame + value` versus the original row frame plus index, and checks +1 progression both within and across rows. It retains maximum errors and bounded examples, not an average whose signed errors could cancel (`prototype/render-clock-capture-worklet.js:48`–`:57`). All armed values must be strictly inside the scheduled range. Endpoint plateaus and invalid spans fail the entire observation. The strict **old** four-channel frame/sequence/preflight/fence gate remains imported and conjunctive (`:3`, `:32`, `:61`). A continuous parameter ramp cannot rescue invalid global row timestamps.

## Confirmed defect, preserved RED and correction

The original new validator, worklet SHA256 `3cf2d7c6e4db2d3f287edb5f2fb242aad2c4e460f3a065306282da1bc4709094`, validated only frame bounds/rate/tolerance. It ignored requested automation `startTime/endTime/fromValue/endValue`, even though those values are the schedule declaration used by the harness. Actual valid retained arrays could therefore earn `passed:true` with contradictory, absent, nonfinite or inherited schedule metadata. The current harness generated coherent fields; this was a validator-contract defect, **not evidence of a faulty native run**.

NEW `scripts/test_render_clock_independent_review.mjs` produced preserved `docs/prototype/render-clock-independent-initial-results.json`, **6/13** (SHA256 `3227f716624116119ac4c7852b581b9ad0f3a2ab1d48a109f8ac263292ec192d`). All seven desired malformed-schedule assertions failed: one-sample start/end time shifts, nonzero initial value, wrong endpoint value, missing requested time, NaN requested time and inherited declaration fields. The other six controlled cases passed. Parent independently reproduced the same contract gap in `render-clock-schedule-parent-red-results.json`; its prior 11/11 suite is retained as evidence of the weaker validation, not retroactively claimed to cover these fields.

The parent correction reads **own numeric data descriptors** for all eight required fields, never evaluating accessors or inherited fields; validates exact frame/time/rate correspondence, initial value zero, endpoint equal to frame span, bounded range and unchanged tolerance; and returns a safe scalar declaration snapshot (`prototype/render-clock-capture-worklet.js:35`–`:38`, `:62`). Current harness fields use exactly those expressions, so no fitting or observed-offset adjustment is introduced.

Independent fresh rerun: **13/13** in `docs/prototype/render-clock-independent-final-results.json` (SHA256 `6d4cbdf729efd5ac9906edff2a44b21d1cbdd13bc425726e811591a0ec5b9f82`). A further own-accessor rejection case exercised every required field, then serialized the result: all eight accessors rejected, **zero getter calls**. Expanded fresh result is **14/14** in `docs/prototype/render-clock-independent-final-boundaries-results.json` (SHA256 `b903c5e5815e8d0653451f96adcc30dfbad2ea19f612c0c35799eaf936225107`).

Other executed independent cases preserve the exact quarter-frame boundary, reject half-frame offsets, reject a whole-row parameter jump followed by recovery, keep coherent duplicate-frame aliases globally failed, reject missing/changed after snapshots, and run the actual exported processor through preflight/arm/finish. That producer test retains a one-value parameter without expansion, exact four-bus PCM, zero output, terminal fence and no messages after terminal `false`. This is controlled producer behavior, not a real WebAudio scheduler.

The parent's suite was independently executed first as **11/11** to NEW `render-clock-independent-parent-suite-results.json`, then after correction as **12/12** to NEW `render-clock-independent-parent-suite-final-results.json`. Its additional cases cover absent/NaN arrays, premature/invalid capture geometry, endpoint overrun and plan corruption. No original test result was overwritten.

## Failure export and lifecycle inspection

NEW `scripts/test_render_clock_export_independent_review.mjs` executes the **actual transcript and raw-export statements extracted from the current harness**, with bounded Node Blob/URL/DOM collaborators. It uses a deliberately failed capture: three original rows, actual parameter lengths `[128,1,128]`, and a changed after-snapshot alias. This is not a reimplementation of serialization.

Both original and post-correction executions produced **1/1**. Final NEW `docs/prototype/render-clock-export-independent-final-results.json` (SHA256 `5a5ec2dffbd185a362b7fb32dce005baa1eef700c591df036a39813484c3eb34`) confirms:

- Every row, original frame/sequence/clock snapshot and actual parameter-array length survives.
- After JSON round-trip, every Base64 parameter byte equals its actual Float32 input bytes, including the invalid length-one row.
- All **6,144 raw bytes** equal the original three rows ×128 frames ×four channels ×four bytes, in the declared channel order. The exported SHA matches those exact bytes.
- Original input objects are unchanged; `completed` and `allCriteriaPassed` stay false.

The harness exports retained transcript even after a validator exception, then closes capture routes/context; interval/cursor analysis is gated by complete strict integrity and occurs after closing audio (`prototype/keylock-engine-render-clock-harness.js:128`–`:140`). Final identity failure is bounded/caught and sets `sourceStable:false`; full raw export remains outside the pass gate (`:142`–`:154`). The whole-run deadline aborts, pauses and clears scratch cache; capture requests and close/final identity calls are bounded (`:29`–`:34`, `:128`, `:134`, `:142`). This is source inspection plus controlled export, **not an executed native timeout/close/Save-dialog test**. Actual browser download/Blob lifecycle and all malformed transport-message possibilities remain untested.

The source cohort is explicit; it is not every transitive dependency, and this review is not a new desktop-host security audit. The separate host uses the existing official Electron/runtime and isolated diagnostic page. No product bundle or audio engine was changed by these test-only observers.

## Frozen identities and preserved earlier failure

| File | SHA256 |
| --- | --- |
| New `prototype/render-clock-capture-worklet.js` | `00ca498588fae8f2e19728139f1d38cf40d7480cb48e35645436bddbca372627` |
| New `prototype/keylock-engine-render-clock-harness.js` | `5db1b8d3340628f1d0a007ca13990713e58b586f2d070974cc5302cb798764b1` |
| New harness HTML | `80015c224688f158719e721b1d5a4c3bdd63aff039fa1be027e23002a189f978` |
| Parent `scripts/test_render_clock_capture.mjs` after contract regression | `00b49c6c8cd83cbe29d3d9b04cbea0e542cca0c79cd14c32ec495be4c5ba08e4` |
| New `scripts/run_native_render_clock_harness.cjs` | `d7bfeec89b34bdfa9faeb2974ad034d9d9de8bd3735466e162546b664ebd7767` |
| **Unchanged** old `prototype/keylock-cursor-capture-worklet.js` | `3b605149cb5b6adec647115c25c18818aa5bcb0fe38d2c11214ea81047594a92` |
| **Unchanged** old `prototype/keylock-engine-cursor-harness.js` | `b8e45417bce1fc9411d58ad02416c751c73750339d8792eca5384f73def622a9` |

Rehashed original failed JSON: `98f0147512f10a86c302f47dccd766bdf0689d3ab66cab5506747758c28235a8`; retained whole original four-channel PCM: `189c5708ef1e35719563f5a0e2011ec737f6c9e5107326d1be7ebb1b5985dc52`. These remain unchanged and **zero cases accepted**. The prior independent timestamp/control evidence report is unchanged. No new parameter observation can relabel, trim or repair those originals.

## Go/no-go interpretation

**Go to collect a NEW bounded native diagnostic** with the frozen source and full original exports. The completed criterion here is adversarial source/measurement review plus executed controlled malformed-plan/alias/producer/export checks. Actual AudioParam automation, native global-vs-parameter agreement, four-channel audio/control progression and cursor-marker confidence are **still unverified** until a new real run and independent original-artifact inspection. Any failed old gate or new parameter gate must block cursor/calibration acceptance; a valid new capture can still fail marker uniqueness, pitch/return or other unchanged criteria. No engine-cause, Chromium-cause, musical/reference/hardware or full-parity conclusion follows.

Skills applied: adversarial-verify, dec-quality-testing, dec-software-principles.
