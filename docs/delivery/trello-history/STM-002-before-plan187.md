## Outcome and acceptance
Stem mute/solo/mix controls
Audible controls affect the intended separated component without timing jumps.

## Evidence
Proposed scope; exact-version and runtime checks pending.

## Dependencies and work
- [ ] Reference evidence and subfeature inventory
- [ ] Screen, controls, states, shortcuts and errors
- [ ] HTML behavior after inventory gate; identify simulations
- [ ] Native stage N3, only after Jason approves prototype
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
Feature ID: STM-002.

## Exact source crosswalk — 2026-10-16
- [Stems Overview](https://support.serato.com/hc/en-us/articles/5700968326927-Stems-Overview)
- [Preparing tracks for use with Stems](https://support.serato.com/hc/en-us/articles/5700969287183-Preparing-tracks-for-use-with-Stems)
- [Using Stems](https://support.serato.com/hc/en-us/articles/5700921209615-Using-Stems)
- [Controlling Stems with your DJ hardware](https://support.serato.com/hc/en-us/articles/5700970589583-Controlling-Stems-with-your-DJ-hardware)

Source assignment verified; semantic control/state review and installed-version reconciliation remain open. This is not a parity pass.
Crosswalk: https://github.com/jpoindexter/open-play/blob/main/docs/research/MANUAL_FEATURE_CROSSWALK.md

## DSP continuation — 16 October 2026
Four actual prepared source buffers are mixed independently. All enabled without effects uses the original mix. Master-signal checks verify isolation; SCNet preparation was exercised in the main interface. Model quality and physical pad behavior remain open.
Evidence: docs/prototype/DSP_FUNCTIONAL_REVIEW.md. Full parity NOT PASSED; native approval NOT GRANTED. Existing model/effort recommendations preserved.


---
2026-10-17 — current feature parity audit
Evidence category: subset; FULL FEATURE PARITY UNPROVEN.
Actual isolated buffers/mute controls; all-on original route and ordinary selected-source waveform tests.
Remaining acceptance: Full transition consistency/artifacts/latency and all rates/loops/compound states versus reference.
Codex gpt-6-astra/high; Claude Code claude-opus-5/high. Recommendations only; confirm installed equivalents.
Audit: https://github.com/jpoindexter/open-play/blob/main/docs/research/CURRENT_PARITY_AUDIT_20261017.md
Current installed scope110groups/522requirements plus separate9beta deltas. Browser WIP is not physical-tested0.1.3. No completion/public-release claim.


---
2026-10-17 — grouped stems investigation; full parity open
Plan70: independent SoundTouch source pipes fail processed-stem recombination0/6 (relativeRMS1.04–1.62). Separate shared-overlap/fullsearch serial6/6 and grouped-browser2/2; new geometry-ownership browser2/2 after controlled0/1→1/1 fix. Actual unchanged AudioEngine/SRC/rate/seek/pause/solo cohort1/2: two pitch failures independently reproduced. Recombination and solo routing pass narrower checks; this is not full stem/keylock acceptance.
Exact normalized input has clean tones; frozen serial replay matches all10 actual browser channels bit-exact, logging on/off identical. Installed Rubber Band4.0.0 native CAPI offline case passes pitch/reconstruction/duration; separate RealTime-mode offline caller passes audio but fails by3607frames with audible tail. New endpoint-marker0/6 duration cases; one144 centroid checks exceeds10ms. No clipping/tolerance change. Experimental adapter ACK-accounting0/4→4/4, malformedACK3/6→6/6; independently inspected controlled boundaries, no new browser credit.
All raw/source capsules/failures and independent reviews retained. SCNet3.025%>3%/otherSI-SDR−1.01dB, musical quality, compounds, hardware/reference remain open. Local desktop tests approved; optional017 and default016 unchanged.110groups/522requirements,9beta+26release separate,0fullpasses. FullClaudeaudit unlaunched. docs/delivery/soundtouch-grouped-section70.md and updated full handoff/plan.
Codexgpt-6-astra/high; Claude Codeclaude-opus-5/high recommendations retained; no card completion/public release.

---
2026-10-17 — plan72; real native stem-pad subset
Actual0.1.9 normal import/preparation loads SCNet four real sources; keylocked+8 original+4buffers use the native R3 cache. Overlapping deck starts both reach playback; deck2 paused. One bounded native REC/Save8.34s: first1–2s all-muted exactlyzero; final2s onlyDrums RMS.015549/.015375. Entire original/PCM retained. Two earlier recordings56.4s/27.48s overran48s source before Drums action; both remain failures. CUE reset and one timed UI sequence corrected capture timing; no threshold change or repeated quality matrix.
Found separate0.1.9 EOFstate bug; current0.1.10 committed-source completion handler passes one native6s natural-end path withoutPause (0playing/Master0). Earlier native stem audio remains0.1.9-specific. Source/model identity, allpad combinations, musical separation/coherence, timing/tails/compound/races/hardware/reference remain open. SCNet3.025%>3%/otherSI-SDR−1.01dB unchanged.110/522,9beta+26release separate,0fullpasses. FullClaudeaudit unlaunched. docs/prototype/TRY_CURRENT_DESKTOP.md; plan/fullhandoff updated. Codexgpt-6-astra/high; Claudeclaude-opus-5/high recommendations retained. Pragmatic changed-path testing throughout; no card completion.

---
2026-10-17 — plan78; shared stem transport/coherence
Original+four stereo stems now enter one ten-channel Signalsmith processor/window/warp map, split into five discrete outputs. Vendor/WASM and gain policy unchanged; topology avoids five independent processing owners. Executed cancellation and actual Vocal/Melody controls below. Musical/source reconstruction, all pads/FX/cue/other geometries/ranges, continuity/cursor/refill/races/transport compositions/native/physical/reference stay open. Next optional current-source desktop checkpoint under existing local-test approval; old apps/default preserved.
Actual one-deck Keylock/Smart Sync/Stem-pad workflow; whole12.66s stereo master finite. Known +550/−550 pair cancels to≤.00603% of330Hz across120/150/90 source sections (1% limit), Bass/original leakage≤.00807%. Melody-only pad exposes550/330≈1.333; final mute RMS≈2e−34≤1e−5. Fixed measured bands, no gain/time fit or revised criterion; first completed run passes. docs/prototype/stem-coherence-browser-results.json. Known prepared fixtures, no new ML inference/quality/native/hardware/reference claim. Existing SCNet/R3/cursor/FX failures unchanged. Plan78/fullClaudehandoff updated;110/522,9beta+26release separate,0fullpasses; fullClaudeaudit unlaunched. Codexgpt-6-astra/high; Claudeclaude-opus-5/high recommendations retained. Pragmatic testing throughout; no completion.

---
2026-10-18 — plan86; browser Stems/Pitch MIDI inputs
Shared actual Stem pad action prepares when needed, toggles addressed stem/FX and updates engine; delayed prep checks track/load generation (new cancellation guard is code-path, no fresh worker cancellation test). All4decks expose8Stem/8Pitch/8Shift cue-select targets. Pitch uses existing held transport with release captured before awaiting prep; Note Off/disconnect survives mapping changes. No new DSP/model/entitlement gate.
Actual editor/SYNTHETIC notes, first-run recorded workflow passed: four prepared Stem mutes, vocal-only220Hz restore while right550Hz continues;4FX flags + actual vocal Echo owner observed, not new all4FX acoustic proof. Shift selects/creates quantized cue2 at1s from paused1.23s without playing/pitching. Held Middle+1 yields583.640Hz vs582.705Hz expected (0.935Hz error, criterion1.5Hz). Delete held mapping then original Note Off stops right and returns1s cue; left220Hz continues. Complete finite2.099977s stereo master34067B SHA1d8ad2c6ba44df218c755d392d1b47bcbfe0e41be7f43c83f5187663a3103f6c; eight hashes stable. Scoped policy passed. No unrelated test/reviewer matrix.
v6 has212candidate bindings; Pitch0x44–0x4F inferred/absent inspected XML, no physical capture. Existing Roll0x51/Sampler-alt hypotheses retained. Native0.1.12/profile/launchers unchanged, Jason away. No fresh SCNet run, full FX/pitch/music-quality/native/hardware/reference acceptance. Full cold/compound/range/LED/guide checks remain open.
Evidence: docs/prototype/midi-stems-pitch-browser-results.json + policy; semantics note, plan86/current Claude handoff. Original prompt suffix intact. Existing per-feature Codex/Claude model+effort recommendations retained; full audit unlaunched. No full flags/card completion/public release.


---
2026-10-18 — plan105: actual5source/10channel bounded resampled keylock+2, source120/150/90BPM, normal live warped Key+replacement+3, Stem controls and enabled Deck1Delay50%/halfbeat. Whole18.96s stereo303889B SHA63314cdf. Independent5windows: opposing cancellation≤0.00422%, Bass leakage≤0.00321%, global carrier error≤0.001381Hz. Dry Melody positive≈1.334ratio; allstem mute leaves real wet tailRMS0.00882 then1.51e-6 late (fixed gates). First harness wrongly watched retired adapter; original capture/source preserved, corrected current-voice check passes. No new application code, model inference/music/native/physical/reference/full flags. Native15 remains idle, human away/no capture. docs/prototype/stem-resampled-{browser-results,browser-inspection,old-owner-check-results}.json; plan105/handoff. Model routing/history retained.

---
2026-10-18 — plan106: reproduced unlocked warped+2 pitch error1.069332Hz>1Hz. New bounded piecewise source↔prepared SRC map follows local rate with zero spectral transposition. Actual final2deck13.74s wholemaster SHA6270b38f:4sections/shared124.8BPM,22pulse pairs max1.270ms,global pitch max0.000359Hz; no measured handoff quiet bins. Five-source unlocked→locked key change exposed real LateScheduleError from redundant8s refill after choosing explicit anchor; required coverage now permits deferred top-up. Final5source18.96s SHA5a1a9d97 cancellation/Bass≤0.003692%/0.003391%,carrier≤0.001449Hz,actual Delay tail→late decay pass. Old recordings/source capsules and separate floating metadata assertion retained. Direct-helper future Pause/current-factor underrun margin need focused follow-up; no broader edge/music/model/physical/reference/full acceptance. Native15unchanged/human away/no capture. docs/prototype/variable-pitch-warp-* and stem-variable-pitch-*; plan106/handoff. Existing model/effort routing preserved.

---
2026-10-18 — plan108: SCNet exports default to independent uniform minimum-change mixture projection; explicit raw CLI mode retained, other backends unchanged. Raw model metrics/weights not regraded. Two development excerpts (not new holdouts) export sum relativeRMS≤2.51e-8; seven SI-SDR scores slightly improve, SDRNRdrums−0.009695dB, other stays−1.005dB. Original raw3.02456%reconstruction failure/negativeother remain. Actual desktop18775proxy→8768service→pinned inference→4FloatWAV downloads/completedcache executed; final299880frames/44100stereo,6.812sAPIwall includingpolling. Worker/helper source identity invalidates stale caches. Raw-mode cache-copy produces historical PCM bit-identically; initial whole-container SHA assertion failed solely on3header bytes, retained. No nativeGUI/listening/physical/generalquality/reference pass. Idle service restarted/current running; native15PID95428/package/profile unchanged. docs/prototype/STEM_MIXTURE_CONSISTENCY_REVIEW.md + development/api/initial-api/raw-cache receipts; plan108/fullhandoff updated. Model routing/full flags unchanged; full audit unlaunched.

## Plan111 — non-loop warped Smart Sync Censor (18Oct2026)
Reversed source coordinate plan crosses markers into their original left-side BPM. Existing bounded processor handles locked and unlocked pitch; original+four prepared sources share ten channels/five outputs. Backing lease keeps the exact old forward voice/grid running under silent pull and restores it without seek/rebuild. Whole decoded/reversed buffers are outside processor-copy accounting.

Actual grid/Setup/Key+/Sync/U/Stem-pad workflow passes in both keylock states/+2. Reverse90→150→120 sections use4/3→0.8→1; Beat Sync remains engaged; original forward voice/grid returns with matching10ms state clock (not audible-cursor/sample-phase proof). Vocal mute survives return. Whole14.939977s stereo241479bytes SHA0591455521280d648a074c6e7b333a17496195605f616862947fc63afe7dff58;14fixed1Hz/RMS windows maxerror0.006861Hz; four mute ratios0.667517–0.668096.11stable hashes. Focused reverse-plan/backing contract executed. No model inference/native/physical/full acceptance.

Initial scheduled-mute/setup and rapid Sync/Play premise failures retained; final setup observes armed/Beat Sync first, unchanged criteria. Rapid Sync→Play is a separate core concern, not fixed here. Warped loops, selected-stem Slip, in-hold edits/Flip/onset/quality/long-run/failures/hardware remain open. Native15/profile/launchers unchanged. Next manifest needs censor.js,censor-backing.js,reverse-censor-plan.js,pitch-time-map.js. See docs/prototype/WARPED_CENSOR_REVIEW.md and warped-censor-browser-results.json. Full110/522 flags/model+effort routing preserved; full Claude audit unlaunched.

## Plan114 — warped-loop Censor, browser source
Active warped loops no longer reject Censor. Reversed grid/loop uses existing audio-thread kernel; keylock/shift reverse periodic rendered cycles. Original forward owner/grid stays running silently and returns with loop/BeatSync/mute intact. Final actual app U/Stem-pad flow covers raw, locked+2 and unlocked+2:18fixed audio windows max0.481314Hz vs1Hz; reverse90→150→120/wrap, audible forward-return carrier, six mute ratios0.665434–0.667088. Whole29.82s master SHA603d97dffc28a89953da0347915cafbd4733cd20c04c01a9381459c9d3b87a71. Five separate pull inputs/three actual disposal ACKs;13stable source hashes. Known8beat/realPCM contract separate. Initial narrower captures preserved; final output wrappers correct disconnect/input-index handling. No broad green matrix repeated. Native16unchanged, human away/no timed capture. Model quality, selected-stem Slip/Censor, other compositions/ranges/music/physical/full-reference acceptance remain open; full flags/model routing unchanged. Full Claude audit unlaunched.
Review: https://github.com/jpoindexter/open-play/blob/main/docs/prototype/WARPED_LOOP_CENSOR_REVIEW.md
