## Outcome and acceptance
Key lock and independent key shift
Compare pitch/tempo behavior and artifacts across declared musical/rate ranges.

## Evidence
Proposed scope; exact-version and runtime checks pending.

## Dependencies and work
- [ ] Reference evidence and subfeature inventory
- [ ] Screen, controls, states, shortcuts and errors
- [ ] HTML behavior after inventory gate; identify simulations
- [ ] Native stage N2, only after Jason approves prototype
- [ ] Execute acceptance on exact candidate and attach results
Dependencies: reference → specification → prototype → approval → native → acceptance. Physical device tests required for hardware claims.

## AI recommendation — 2026-10-16
Primary Codex: gpt-6-astra; reasoning high.
Claude Code alternative/reviewer: claude-opus-5; effort high.
Reason: DSP and transport require numerical reasoning backed by measurements.
Escalation: After two materially different failed approaches: obtain missing evidence, then escalate one effort/model tier; never substitute reasoning for a hardware test
Review: Fresh evidence review; Claude is an optional alternative, not automatically invoked.
Source: host Codex catalog; https://code.claude.com/docs/en/model-config and installed CLI 2.1.222. Account invocation untested. Cost unknown; measure usage. Recommendations do not authorize an agent launch.

## Actual status
Local desktop testing authorized. Scoped implementation/evidence exists; full native and reference acceptance remains unverified. Current feature-specific audit below governs older checkpoint prose.

Plan: https://github.com/jpoindexter/open-play/blob/main/FULL_BUILD_PLAN.md
Feature ID: DEK-007.

## Exact source crosswalk — 2026-10-16
- [Keylock](https://support.serato.com/hc/en-us/articles/234962528-Keylock)
- [Serato Expansions](https://support.serato.com/hc/en-us/articles/223365767-Serato-Expansions)

Source assignment verified; semantic control/state review and installed-version reconciliation remain open. This is not a parity pass.
Crosswalk: https://github.com/jpoindexter/open-play/blob/main/docs/research/MANUAL_FEATURE_CROSSWALK.md


## Prior evidence preserved verbatim

Full prior description (including all positive and failed native/DSP/cursor checkpoints): https://github.com/jpoindexter/open-play/blob/main/docs/delivery/trello-history/DEK-007-before-plan95.md . No prior failure is promoted or discarded. Older native-not-approved statements are historical; local desktop tests were subsequently approved. Current native0.1.13/source0c2af74 remains a separate unchanged candidate. Full native/reference/musical/keylock acceptance stays open; live/default-profile failures are not fixed by the new offline loop profile.


### Plan95 — cached warped-loop keylock/pitch (18October2026)
New periodic loop render uses existing MIT Signalsmith worker, guard context, bounded cache and musical-cycle PCM mapping. Only this offline path uses240ms block/60ms interval, complete seek history and patched schedule/output compensation; no per-tone correction/vendor edit/gate relaxation. Live/default keylock unchanged.
Initial1.3–1.6Hz/136ms failures and whole recording retained. Authorized fresh Fable5.1High consultation diagnosed pitch configuration; oversized sweep stopped, reduced to3cases. Independent same-PCM FFT confirms default1.344Hz vs240/60ms0.301Hz. Narrow consultation report docs/research/claude-fable/warp-loop-keylock-pitch-20261018.md is NOT full Serato audit.
Revised actual app reference-versus-keylock/+3 warped-loop recording passes unchanged gates: five3pair sections max2.654ms vs10ms, independent global20–20000Hz spectrum max0.291Hz vs1Hz, full finite10.559977s stereo master. Receipt docs/prototype/warp-loop-keylock-browser-inspection.json; original failures remain separate. Full keys/rates/music/transients/edits/stems/gestures/live-default/native/hardware/reference acceptance remains open. Native0.1.13 untouched; full parity flags false; existing model/effort routing retained.


### Plan96 — prepared Sync tempo handoff
Old voices continue until all replacements prepare/arm at one audio time; successful group ownership detaches for later independent pause. Actual cold126/latest124.8BPM workflow: shared anchors, no measured1ms quiet bins, max1.610ms phase/0.272Hz pitch, independent pause; finite6.18s master. docs/prototype/sync-tempo-browser-inspection.json. Cold request→handoff0.419/0.425s remains a low-latency gap. Raw-only path retains prior AudioParam route; existing regression passes. Fault/race/FX-phase/gesture/music/native/hardware/full reference acceptance open.0.1.13 untouched; routing/full flags unchanged.


Plan100 (18Oct2026, browser source only): actual Key lock→Play→immediate tempo+8% first records silence despite playing UI; implicit controls now preserve queued future Play, while Pause/truly-paused edits stay paused. Actual-WASM pending controls2pass/3fail→5/5. Separate history-capacity wrapper (unchanged WASM/default120/30ms) removes neutral pitch drift: actual15.06s master330/550Hz maxerror0.000154Hz vs0.01Hz diagnostic; queried DSP latency remains0.12s. Shifted left1.037594Hz still FAILS1Hz gate. Original silent/intermediate/final recordings and exact source variants retained. Receipts docs/prototype/neutral-keylock-browser-{results,inspection}.json and keylock-pending-controls-history-results.json. Native0.1.14 unchanged; no physical/music/compound/full-reference acceptance or full flag promotion. Model/effort routing unchanged; full Claude completeness audit unlaunched.

Plan101 (18Oct2026; browser source): offline Worker now uses generic pitch resampling+neutral stretching with unchanged WASM/default120/30ms profile. Isolated retained shifted/bass cases pass1Hz; three existingSRC geometries remain byte-identical after helper extraction. Actual Loop8/Key lock/tempo+8%/Play/Key+/Key+/Pause records18.60s; shifted maxerror0.000090Hz. Initial1.21/1.16s preparation gaps retained; single-deck future handoff keeps old loop audible, final key-preparation windows have zero quiet10ms bins. Preparation remains1.318/1.281s (response gap still open). Receipts docs/prototype/offline-resampled-keylock-handoff-browser-{results,inspection}.json and offline-resampled-keylock-transition-inspection.json. Default forward-live shifted-pitch failure and warped-loop method unchanged. No full-rate/music/boundary/compound/native0.1.14/physical/reference acceptance or flag promotion. Model routing retained; full Claude audit unlaunched.

Plan102 (18Oct2026; browser source): bounded live source resampling+neutral stretch now separates original/public time from prepared PCM. Actual app tone and pulse workflows each record22.98s through Key lock/Play/tempo+8%/Key+/Key+/tempo+4%/Pause. Shifted maxerror0.000211/0.000236Hz meets1Hz; all18pulse intervals≤2.026ms vs10ms; zero quiet10ms bins during key preparations. Scheduled-state readiness222–273ms; acoustic/hardware onset unmeasured. Five actual-WASM region/group/rate/budget/Pause contracts pass; default SRC fixtures bit-identical. Sampled retained copies2.5–6.8MB exclude10.6MB decoded source/opaque heaps. Non-keylocked warped timelines retain spectral mode; exact cross-deck phase, full ranges/music/transients/faults/stems/gesture/native/physical/reference acceptance remain open. Receipts docs/prototype/live-resampled-keylock-*; native0.1.14 unchanged. Model routing/full flags unchanged; full Claude audit unlaunched.

---
2026-10-18 — plan103: actual two keylocked-deck Smart Sync, secondary+2semitones, source120→150→90BPM, then shared124.8BPM. Whole13.74s stereo master retained; independent22pulse pairs across4stages max2.312925ms vs10ms, global carrier max0.000517Hz vs1Hz; zero quiet1ms bins through shared-tempo preparation. Identical future voice anchor on both decks; GUI366.3ms readiness is metadata, not acoustic latency. docs/prototype/live-sync-pitch-browser-{results,inspection}.json. No native/hardware/music/arbitrary-marker/race/full-reference acceptance; all full flags remain false. Human away, no capture. Preserve model routing and historical failures.

---
2026-10-18 — plan104: actual native0.1.15 source02ddc758/ASAR7430617a,29served hashes match. Normal GUI2keylocked decks/secondarykey+2→+3, Play/Sync124→shared133.9BPM; actual REC/Save46.38s stereo finite/nonzero master602103B SHA1d94e7a4. This grades signal generation/export, not pitch/phase/acoustic/hardware/full parity.272mapping export byte-identical to14; named Hercules connected,1/2master+3/4cue reapplied; stopped/resetA/B,levels0.8,crosscenter. Current launcher15;14/versioned launcher+stable profile backup preserved. Human away; no timed capture. Next human action leftPlay→RCA sound→samebuttonstop. Evidence: docs/prototype/desktop-0.1.15-playback-{package,observation}.json; TRY_CURRENT_DESKTOP.md. All full flags remain false; original model routing/history retained.

---
2026-10-18 — plan105: actual5source/10channel bounded resampled keylock+2, source120/150/90BPM, normal live warped Key+replacement+3, Stem controls and enabled Deck1Delay50%/halfbeat. Whole18.96s stereo303889B SHA63314cdf. Independent5windows: opposing cancellation≤0.00422%, Bass leakage≤0.00321%, global carrier error≤0.001381Hz. Dry Melody positive≈1.334ratio; allstem mute leaves real wet tailRMS0.00882 then1.51e-6 late (fixed gates). First harness wrongly watched retired adapter; original capture/source preserved, corrected current-voice check passes. No new application code, model inference/music/native/physical/reference/full flags. Native15 remains idle, human away/no capture. docs/prototype/stem-resampled-{browser-results,browser-inspection,old-owner-check-results}.json; plan105/handoff. Model routing/history retained.

---
2026-10-18 — plan106: reproduced unlocked warped+2 pitch error1.069332Hz>1Hz. New bounded piecewise source↔prepared SRC map follows local rate with zero spectral transposition. Actual final2deck13.74s wholemaster SHA6270b38f:4sections/shared124.8BPM,22pulse pairs max1.270ms,global pitch max0.000359Hz; no measured handoff quiet bins. Five-source unlocked→locked key change exposed real LateScheduleError from redundant8s refill after choosing explicit anchor; required coverage now permits deferred top-up. Final5source18.96s SHA5a1a9d97 cancellation/Bass≤0.003692%/0.003391%,carrier≤0.001449Hz,actual Delay tail→late decay pass. Old recordings/source capsules and separate floating metadata assertion retained. Direct-helper future Pause/current-factor underrun margin need focused follow-up; no broader edge/music/model/physical/reference/full acceptance. Native15unchanged/human away/no capture. docs/prototype/variable-pitch-warp-* and stem-variable-pitch-*; plan106/handoff. Existing model/effort routing preserved.

---
2026-10-18 — plan107: direct actual-WASM mapped futurePause/restart0/1→1/1. Before futurestart, paused nominal rate differs from local map; inactive commands now bypass audible-map equality. Queued1s Play cancelled at0 gives exactzero signal through1.5s, same owner remains alive and restarts at2s with493.883313Hz vs493.883301Hz expected/RMS0.084842, dispose0PCMbytes. Controlled serial clock/ports and simplified gain graph; no new GUI/browser/native/physical/music/full parity acceptance. Underrun lead now uses current mapped factor (source-level, real pressure/underruns unverified). Native15/profile untouched, human away/no timed capture. scripts/test_mapped_keylock_pause.mjs; docs/prototype/mapped-keylock-pause-{before-results,results}.json. Plan/handoff updated, old evidence/model routing preserved, full flags unchanged.

## Plan110 — actual Censor held reverse/forward-clock return (18Oct2026)
New continuous audio-thread Censor keeps its hidden clock independent of Slip; matching release restores prior-rate/loop forward time. Pointer/focused-button/U/J/MIDI share one release-safe owner; early release, Note Off, input focus and blur are handled. Paused/ABS do not activate. Fixed keylock/key shift prepares original-time PCM and live shadow follows the hidden clock. No guessed hardware addresses;272 preset unchanged.

Actual browser pointer/U/J/MIDI/blur workflow records raw reversing chirp and keylocked+2/tempo1.08 reverse/return. Whole5.399977s stereo87373bytes SHAc405ee8e9aee2f73c8c48dc4a09ccfc2897cda92afdf3f6740e8e4ad07cd1fd6; seven fixed1Hz/RMS windows maxerror0.324840Hz;10ms engine return-state criterion passes (not first-frame audible-cursor proof). Ten stable declared hashes. Focused five-output PCM/early-release/MIDI contract also executed. Initial ramp assertion and two pre-scheduled-start baseline failures remain retained; timing setup corrected, audio gates unchanged. See docs/prototype/CENSOR_REVIEW.md and censor-browser-results.json.

Warped Sync, selected-stem Slip, overlap/in-hold edits, Flip, musical-stem/edge/long-run/quality/native/physical/reference acceptance remain open. Native15/profile/launchers untouched; new modules not packaged. Human away/no capture. Full110/522 flags and model+effort routing unchanged; full Claude audit unlaunched. Include censor.js and pitch-time-map.js in next fresh native manifest.

## Plan111 — non-loop warped Smart Sync Censor (18Oct2026)
Reversed source coordinate plan crosses markers into their original left-side BPM. Existing bounded processor handles locked and unlocked pitch; original+four prepared sources share ten channels/five outputs. Backing lease keeps the exact old forward voice/grid running under silent pull and restores it without seek/rebuild. Whole decoded/reversed buffers are outside processor-copy accounting.

Actual grid/Setup/Key+/Sync/U/Stem-pad workflow passes in both keylock states/+2. Reverse90→150→120 sections use4/3→0.8→1; Beat Sync remains engaged; original forward voice/grid returns with matching10ms state clock (not audible-cursor/sample-phase proof). Vocal mute survives return. Whole14.939977s stereo241479bytes SHA0591455521280d648a074c6e7b333a17496195605f616862947fc63afe7dff58;14fixed1Hz/RMS windows maxerror0.006861Hz; four mute ratios0.667517–0.668096.11stable hashes. Focused reverse-plan/backing contract executed. No model inference/native/physical/full acceptance.

Initial scheduled-mute/setup and rapid Sync/Play premise failures retained; final setup observes armed/Beat Sync first, unchanged criteria. Rapid Sync→Play is a separate core concern, not fixed here. Warped loops, selected-stem Slip, in-hold edits/Flip/onset/quality/long-run/failures/hardware remain open. Native15/profile/launchers unchanged. Next manifest needs censor.js,censor-backing.js,reverse-censor-plan.js,pitch-time-map.js. See docs/prototype/WARPED_CENSOR_REVIEW.md and warped-censor-browser-results.json. Full110/522 flags/model+effort routing preserved; full Claude audit unlaunched.

## Plan114 — warped-loop Censor, browser source
Active warped loops no longer reject Censor. Reversed grid/loop uses existing audio-thread kernel; keylock/shift reverse periodic rendered cycles. Original forward owner/grid stays running silently and returns with loop/BeatSync/mute intact. Final actual app U/Stem-pad flow covers raw, locked+2 and unlocked+2:18fixed audio windows max0.481314Hz vs1Hz; reverse90→150→120/wrap, audible forward-return carrier, six mute ratios0.665434–0.667088. Whole29.82s master SHA603d97dffc28a89953da0347915cafbd4733cd20c04c01a9381459c9d3b87a71. Five separate pull inputs/three actual disposal ACKs;13stable source hashes. Known8beat/realPCM contract separate. Initial narrower captures preserved; final output wrappers correct disconnect/input-index handling. No broad green matrix repeated. Native16unchanged, human away/no timed capture. Model quality, selected-stem Slip/Censor, other compositions/ranges/music/physical/full-reference acceptance remain open; full flags/model routing unchanged. Full Claude audit unlaunched.
Review: https://github.com/jpoindexter/open-play/blob/main/docs/prototype/WARPED_LOOP_CENSOR_REVIEW.md
