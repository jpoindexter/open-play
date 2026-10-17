# Active muted shadow return — isolated experiment review

2026-10-17. Revised browser execution is pending. Parent executed the initial browser variant: 3/10 aggregate pass; all ten nine-part audio/cursor rows passed, while group churn and two overlong quick stimuli remain failures. Production keylock, the original lead adapter, vendor/WASM, engine and native application were not changed. A new isolated retention-only clone is described below. Full Serato parity remains incomplete; native development remains gated on Jason's approval of an identified HTML prototype.

Skills matched (4): use, dec-software-principles, dec-quality-testing, dec-web-performance.

## Verdict and evidence boundary

The initial browser result supports a bounded retention-only follow-up, not production adoption. A serial controlled host using the actual unchanged WASM and exact experimental adapter produced a nonvacuous stationary result meeting the existing strict measurements. That does **not** establish browser scheduling, physical-device behavior, production return behavior, listening quality or any other matrix cell. No engine integration is justified by the Node result alone.

Executed: `node --check prototype/keylock-shadow-return-harness.js` and `node scripts/test_keylock_shadow_return.mjs` exited 0; the latter reported **9 checks passed / 0 failed**, retaining the original eight checks and adding the actual-driver red-to-green retention regression. The separate real-browser Done criterion is one valid steady calibration followed by all ten individually measured shadow cases, with continuous stereo capture integrity, strict pitch/gap/cursor results and successful bounded cleanup. The revised path has not been executed. Initial browser evidence is parent-executed and separately preserved, not an execution claim by this agent.

## Independent reading of Fable's findings

Input: `docs/research/claude-fable/keylock-return-findings.md`. Its saved evidence supports investigating an active muted owner: the prior paused-owner return measurements contain gaps, while the inactive vendor path processes zeros. Main-UI dominant raw-pitch bins also warrant investigating the raw bridge. These are useful hypotheses, not proof that a shadow will satisfy every release criterion.

Three proposed conclusions require qualification:

1. The asserted follower cursor bound `FOLLOW_MS * deckRate` is not valid generally. The scratch cursor can move at signed velocities independent of deck rate; the UI's independent bound is ±16. Serial fill/scheduling, dropped preroll, pending/coalesced requests and processor analysis history also matter. This experiment measures returned original-time position instead of adopting that bound.
2. Issuing `seek(endPosition)` for output about 40 ms later leaves approximately 43.2 ms of original-time lag at rate 1.08. The independent test reproduces that failure despite an ACK clock matching the emitted audio. The experiment predicts release-clock advancement for the requested future output, then reports actual ACK and audible errors separately. If fill or serialization moves the actual schedule later, that is retained error, not corrected after measurement.
3. A periodic 10 Hz marker can alias by 100 ms. Region tone and ACK position cannot prove a 10 ms original cursor. This experiment uses an aperiodic amplitude barcode, a broad source search, a uniqueness margin and an independent actual-WASM steady-play calibration. Fable's inferred scheduling floors are observations from bounded runs, not universal physical impossibility claims.

Frequent backward seeks can also lose window coverage after normal forward filling drops older PCM; an initially prepared window does not prove that all future backward requests retain it. Replacement groups are recorded, and a shadow cell requiring replacement fails the single-owner criterion.

## Frozen scope and experiment

Open `prototype/keylock-shadow-return-harness.html`, click **Run calibration + 10 actual shadow-return cases**, retain the full JSON and every `.stereo.f32` link. This page is separate from AudioEngine and the main prototype.

The revised page imports only the new `keylock-shadow-follow-experiment.js` clone; the initial page still imports the unchanged lead adapter. The source is a real generated 16-second, stereo AudioBuffer at the actual AudioContext sample rate. Left is a constant 440 Hz source; the independently measured shifted target is 880 Hz at +12 semitones, distinguishable from raw 475.2 Hz at rate 1.08. Right is a 660 Hz carrier with deterministic nonperiodic source-domain amplitude levels, smoothed between 73 ms cells. Source amplitude markers are independent of the left pitch oracle.

Before any shadow case, a separate actual-WASM owner plays steadily from source 2.4 seconds, with no scratch, follower or external mute. Its known schedule calibrates the same barcode analyzer and strict thresholds. The owner is disposed before the experimental owners. Its continuous capture and full analysis are retained. Failed calibration makes subsequent cursor conclusions `oracle-not-established`; it must not be described as proof that shadow position is wrong. A valid global calibration with an ambiguous individual match is separately labeled `ambiguous-correlation`.

Every matrix owner initially warms at source 2.4 seconds. Cases use rate 1.08, keylock on, +12 semitones and the unchanged adapter's 40 ms experimental lead:

| Gesture | Duration | Scripted cursor | Regions |
| --- | --- | --- | --- |
| Stationary | 1 second | Constant | Base 2.4 and 6.2 seconds |
| Forward | 1 second | +0.5 original seconds per context second | Both bases |
| Backward | 1 second | −0.5 original seconds per context second | Both bases |
| Quick | Requested 30 ms; actual maximum still 50 ms | Constant | Both bases |
| Within-window throw | 1 second | +3 original seconds at 65% of hold | Both bases |

The 6.2-second cases really jump from the initial 2.4-second owner. They do not quietly warm at the destination. The throw is inside the initially prepared forward extent, though subsequent retention is not assumed.

The owner remains active behind an external zero gain. The follower samples every 25 ms, keeps at most one pending follow and coalesces the latest desired position. Every sampled/issued position, issue context/wall time, ACK, error and actual scheduled output is retained. At release, the external gain ramps 0→1 over 3 ms and one alignment seek predicts `endPosition + 1.08*(issueTime + .04 - releaseTime)`. It does not pause/restart the owner and does not route raw scratch audio.

Requested quick duration (30 ms in this revision) and actual context-clock hold duration are both retained. A quick case exceeding 50 ms fails its quick criterion. Polling, timer jitter or load are not given an extra tolerance or relabeled as a 50 ms success.

## Criteria and measurements

Existing strict budgets remain unchanged:

- First correct dominant-pitch 40 ms window starts no later than release +30 ms; hop 10 ms, target tolerance ±1%.
- Initial and longest RMS<.005 silence runs, measured in 1 ms bins, are at most 20 ms.
- No wrong dominant-pitch window starting at/after +30 ms, no dominant raw-pitch window, and at least five correct settled windows between +250 and +400 ms.
- No 10 ms level bin after +10 ms falls below half the settled RMS.
- Returned original cursor at release +200 ms is within 10 ms of `endPosition + 1.08*(probeTime - releaseTime)`, with correlation ≥.8 and best-versus-distant-competitor margin ≥.04.
- Actual audible-bus hold RMS and peak are each below 1e−4, with actual pre-gate shifted audio demonstrated before the hold. Exactly one processor group per cell; capture integrity must pass.

The right-channel analyzer uses 8 ms RMS bins at 4 ms hops over a 400 ms probe, searches the entire valid source range at 2 ms increments, then refines locally at .25 ms. The competitor must be at least 50 ms away. It retains the full correlation curve, observed envelope, best/competing matches, confidence and ideal/ACK clock errors. A large best score alone is insufficient.

Pitch measurements identify dominant spectral content over windows; they do not establish every sample's pitch or rule out low-level mixed raw energy. Barcode matching can be distorted by stretching or an ambiguous local envelope. The calibration and confidence checks are gates against overclaiming; they do not make the synthetic fixture equivalent to music or prove a universal cursor estimator.

## Capture integrity, safety and bounds

One steady calibration capture plus two captures per shadow cell means **21 expected continuous raw stereo captures** in a full successful run. Per-cell pre-gate capture observes the actual owner signal; post-gate capture observes the mute and release. Actual zero-valued ConstantSource input feeds explicit, discrete stereo buses, rather than fabricating input-channel counts. Every capture processor zeros every output sample, and the only destination route also has gain zero.

The worklet's actual producer class is exported and used by both browser and controlled tests. It records all preflight rows until 64 contiguous producer quanta, then a real arm ACK, every armed stereo PCM block with producer frame and sequence, and a finish fence. The validator rejects duplicate/skipped frames, sequence gaps, missing stereo, nonfinite PCM, empty armed captures, false preflight claims and mismatched fences. Earlier preflight gaps remain in the raw report; armed gaps are failures. Raw files concatenate the full received blocks without trimming or inventing missing audio, and JSON rows preserve exact frame geometry for reconstruction.

JSON retains complete numeric analyses, adapter events, frame rows, preflight rows and fences. PCM is downloaded separately as native little-endian Float32 interleaved left/right; the JSON includes file name, rate, frame count and byte count. Compact DOM progress does not insert millions of PCM values into the page.

There is a 90-second **cooperative JavaScript** run deadline, an 8-second final cleanup budget, bounded requests, an explicit 12,000 adapter-event limit, 40,000-block per-capture limit and 8,192-row preflight limit. Exceeding limits aborts and remains failure. Cleanup aborts owners, stops follow timers, disconnects capture/output routes, requests disposal, closes the context with a suspend fallback, and retains cleanup errors. A cooperative deadline cannot preempt a synchronously blocked JS thread or a native compiler call. Disposal and retained-byte counters are not a claim that opaque WASM heaps were freed.

## Executed controlled evidence

| Check | Observed result | Does not establish |
| --- | --- | --- |
| Analytic valid cursor/pitch | All strict analyzer criteria true; cursor error approximately zero | Browser capture or WASM quality |
| Analytic wrong original cursor | +180 ms measured error; rejected despite correct pitch/plausible ACK; uniqueness also fails | A uniquely localized wrong cursor in every fixture |
| Raw pitch / 40 ms silent onset | Rejected; silence remains 40 ms even though a 40 ms FFT window starting +10 ms can show correct dominant pitch | Sub-window instantaneous pitch |
| Flat, periodic 10 Hz and silent marker | None obtains confident source position | Every adversarial waveform |
| Direct end-position at +40 ms | Ideal error −43.25 ms; ACK lag −43.2 ms; rejected | Real-browser schedule timing |
| Actual exported capture producer | 64 preflight rows, three armed blocks /384 frames; all physical output zero; seven injected failure types rejected | Actual browser worklet scheduling |
| Actual unchanged WASM steady control | Ideal source position 3.156; measured 3.15725: **+1.25 ms**, score .999635, margin .04722 | Browser steady calibration |
| Actual unchanged WASM stationary shadow | 40 serial seeks; one group; strict result true; **+1.0 ms** cursor error, zero initial gap and first correct window start 0; score .999749, margin .08201 | Browser follow/message/gain timing, other nine cases or production behavior |

The WASM checks execute the exact adapter and vendor in a deterministic serial Node port/clock/gain host. The final check retains `strictExperimentPassed` as measured evidence; a future false experiment result is not discarded merely because it is negative feasibility evidence. Its outer check requires nonvacuous settled PCM and a measured cursor, rather than falsely turning browser acceptance into a Node unit test.

The ninth check uses the actual unchanged WASM and each exact adapter in the same serial Node host, while allowing the actual adapter's normal 50 ms driver timer to run. The original driver creates three groups through warm/start and the backward follow sequence. The revised clone creates one. At the warm witness the old retained extent is 1.5–11 seconds (3,648,000 bytes), versus .5–11 seconds (4,032,000 bytes) in the clone. This is exactly 384,000 additional bytes, one second of 48 kHz stereo Float32 PCM. A separate seek to .9 seconds then creates group 2 in the clone: that cursor is itself retained, but its required full one-second history is not. This proves the regression does not obtain a pass by weakening coverage. It does not establish real-browser driver/follow races.

An earlier analytic adversarial test overasserted that its +180 ms wrong-cursor fixture must itself have a unique match. The unchanged .04 uniqueness threshold found a .03619 margin. The test was corrected to require rejection and the measured wrong cursor, and the actual margin remains in its output. No analyzer threshold was relaxed.

## Browser acceptance still required

Parent must execute the revised identified source in the real browser with a real user-gesture AudioContext and retain full JSON plus all continuous captures. Report steady calibration separately, then every cell's audio criteria, cursor confidence/conclusion, actual gesture duration, groups, issue/ACK/schedule timing, capture gaps and cleanup failures. Preserve failing data and the original retained-return/lead-sweep artifacts. No synthetic or Node output should be filed as browser evidence.

This small single-source matrix excludes other rates/shifts, stems/five-source cost and bus isolation, high-velocity scratches, out-of-window preparation, production engine races, musical quality, external DJ hardware, reference Serato behavior and native runtime. Even ten successful cells would support only the bounded experiment, not full feature parity or immediate native adoption.

## Initial actual-browser evidence and all failure witnesses

Preserved unchanged: `docs/prototype/keylock-shadow-return-browser-initial-results.json` (SHA-256 `3f662bfc8dfc5bf9110d412d670f674111be8d1623cdaba7114ce6ed366cfa47`) and parent's independent `keylock-shadow-return-browser-initial-inspection.json`. Parent retained and independently inspected all 21 actual raw captures in ignored `local-evidence/keylock-shadow-return-browser-initial/`. Every capture is finite stereo with strict armed coverage 1; the steady calibration, every audio/cursor row, every hold mute and cleanup passed. The aggregate remains **3 pass /7 fail**, not 10/10.

| Case index /gesture /region | Groups created | Actual hold | Aggregate failure witness |
| --- | --- | --- | --- |
| 0 stationary same | 2 | 1.013333 s | Extra group |
| 1 forward same | 2 | 1.008000 s | Extra group |
| 2 backward same | 4 | 1.010667 s | Extra groups |
| 3 quick same | 2 | 61.333 ms | Extra group and >50 ms |
| 4 throw same | 2 | 1.013333 s | Extra group |
| 5 stationary different | 1 | 1.005333 s | None; initial pass |
| 6 forward different | 1 | 1.013333 s | None; initial pass |
| 7 backward different | 3 | 1.008000 s | Extra groups |
| 8 quick different | 1 | 50.667 ms | >50 ms |
| 9 throw different | 1 | 1.005333 s | None; initial pass |

All warm witnesses have origin 1.0 seconds, retained start 1.5, and current source cursor approximately 2.726–2.741. Seeking source 2.4 requires coverage from 1.4 seconds, already below the dropped start. For example, case 0 creates group 2 at context 2.634667/source 2.4 after starting group 1 at context 1.712/source 2.4. Case 2 later creates groups 3/4 at source 1.986667/1.949333. Different backward creates groups 2/3 at source 5.986667/5.938667 after its forward jump caused later history to be dropped. This aligns with source tracing and the controlled reproduction; actual audio measurements alone would not identify the retention defect.

## Revised independent policy and red-to-green proof

The new `keylock-shadow-follow-experiment.js` is a clone of unchanged lead adapter `669f76…1535`. Required coverage remains **1 second**. Source preparation origin and drop retention use **2 seconds**, leaving a bounded one-second hysteresis. Chunk size (.5 s), lookahead (8 s), 50 ms driver, scheduling/operation/cancel ownership, gain behavior, 10 ms replacement crossfade, SRC, vendor and caller lead remain unchanged. Snapshot policy explicitly distinguishes `requiredPrerollSeconds`, `retentionPrerollSeconds` and `retentionHysteresisSeconds`. Existing acknowledged PCM accounting includes the actual extra retained chunks; decoded input ownership and opaque-WASM accounting exclusions remain unchanged. This finite hysteresis is not a guarantee for arbitrary/high-velocity reverse gestures.

Executed red phase: after adding the ninth one-group assertion against the original adapter, the command exited 1 with **8 pass /1 fail**, `3 !== 1`. Warm state was source 2.74704, origin 1, start 1.5 and end 11. Source 2.4 created group 2; source 1.95 created group 3. The final regression keeps that original failure as an expected baseline witness and requires the clone to satisfy one group throughout the same sequence. Green phase exited 0, **9 pass /0 fail**. The eight original analyzer/capture/WASM checks remain in place and retain their evidence.

Quick input requests changed from 50 to 30 ms so the browser can produce an actual gesture within the existing ≤50 ms criterion despite polling delay. The report retains requested and actual context duration. Any measured >50 ms remains failure; no timing, audio, cursor, uniqueness or one-group criterion was relaxed.

The revised full JSON includes hashes computed at runtime from fetched bytes of its own `import.meta.url`, new retention clone, original lead adapter and unchanged vendor module; adapter/vendor hashes are checked against the frozen expected values. Source must remain frozen during a run: a fetch hash is evidence of fetched bytes, not a cryptographic guarantee against concurrent file mutation after module loading.

## Preserved initial source

`prototype/keylock-shadow-return-harness-initial.js` is byte-identical to the executed initial main-module source `48f154…c473`. The paired initial HTML is the original HTML with only its module `src` pointing to that preserved file. Its historical worklet-loading URL is still the original current-harness URL; the capture processor implementation is unchanged in this revision. Keep that caveat visible if later capture-code changes make a separately runnable initial worker necessary. Parent also retains the exact initial source in the ignored evidence directory. No initial JSON, raw capture or original lead adapter was overwritten.

## Frozen code hashes

| File | SHA-256 |
| --- | --- |
| `prototype/keylock-shadow-return-harness.html` | `3871c2933da976635d3f468613bb0f2a3b53facda8bd02d27e31fb481b0d2856` |
| `prototype/keylock-shadow-return-harness.js` | `f5c8de99e1a19310131defd41993bd4737e7937d30327426eb4bcabde3bd475c` |
| `scripts/test_keylock_shadow_return.mjs` | `4fd4be91679cec2df476e5ef5dede489a0dffe374239cb1f7da58f61b04d1726` |
| New isolated retention clone | `16707a8f446a503eff022528461ff758b0f47031e34064241bf02d085cd6d9e4` |
| Unchanged lead experimental adapter | `669f76e8482b8c215e41ab791c833a207c025412f33efe2ecefd08e145d21535` |
| Preserved initial harness JS | `48f15499137211ab627008dfcc2ac2a816a1cfc50248d756d74ca9dca114c473` |
| Preserved initial HTML | `a9ceb99f0a57e5c942b755ed9b98373bc9cd5ccd878e99d6b439b5b2a49c3c6c` |
| Unchanged disposable vendor/WASM module | `b2811c519f067cc5a1abd6cdccab46578d1eeef8aba42f666fab2830a9d6f46e` |

Skills applied: use, dec-software-principles, dec-quality-testing, dec-web-performance.
