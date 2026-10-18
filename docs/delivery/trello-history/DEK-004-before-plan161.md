Checkpoint160 — persistent warped-loop reverse (18 Oct 2026)

Actual MP3/real cached SCNet/selected Melody-Bass-Drums/Q reverse-wrap/forward return/Stop recorded, raw and keylock-key3. Reversed PCM/grid keeps original-coordinate deck clock; already-engaged loop retains Tempo Sync, forward required for bar alignment. Independent raw PCM error<4.25e-8, clock≤3.870ms/10ms, ten full streams checked, Stop peaks0. Nine cache files+mtimes unchanged; no inference/native build. Initial diagnostic pixel-seek failure and actual forward-only refusal retained.

Exact combined Serato policy/musical pitch-quality unverified. Non-loop reverse/Loop-off/edits/overlap/resources/native/full parity remain OPEN. Next reproduce and implement Loop-off during reverse. See docs/prototype/REVERSE_LOOP_160_REVIEW.md and handoffs/stems-160-reverse-exit-followup.md in private repo. Status, acceptance and dated model/effort routing unchanged.

---

## Outcome and acceptance
Manual, automatic and saved loops
Enter/exit/retrigger loops, edit boundaries and verify repeat timing and persistence.

## Evidence
Proposed scope; exact-version and runtime checks pending.

## Dependencies and work
- [ ] Reference evidence and subfeature inventory
- [ ] Screen, controls, states, shortcuts and errors
- [ ] HTML behavior after inventory gate; identify simulations
- [ ] Native stage N1, only after Jason approves prototype
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
Feature ID: DEK-004.

## Exact source crosswalk — 2026-10-16
- [Looping](https://support.serato.com/hc/en-us/articles/226513188-Looping)
- [Auto Looping](https://support.serato.com/hc/en-us/articles/226382007-Auto-Looping)
- [Manual Looping](https://support.serato.com/hc/en-us/articles/226514068-Manual-Looping)
- [Managing Loops](https://support.serato.com/hc/en-us/articles/226383867-Managing-Loops)

Source assignment verified; semantic control/state review and installed-version reconciliation remain open. This is not a parity pass.
Crosswalk: https://github.com/jpoindexter/open-play/blob/main/docs/research/MANUAL_FEATURE_CROSSWALK.md

---
2026-10-17 — current feature parity audit
Evidence category: subset; FULL FEATURE PARITY UNPROVEN.
Actual four-beat loop and engine reverse/loop subset; saved-loop source exists.
Remaining acceptance: Manual boundary edits, retrigger/persistence, discontinuity/quality and compound mode acceptance.
Additional documented5.0 beta deltas: BETA-05; uninstalled/unverified and separate from installed522.
Codex gpt-6-astra/high; Claude Code claude-opus-5/high. Recommendations only; confirm installed equivalents.
Audit: https://github.com/jpoindexter/open-play/blob/main/docs/research/CURRENT_PARITY_AUDIT_20261017.md
Current installed scope110groups/522requirements plus separate9beta deltas. Browser WIP is not physical-tested0.1.3. No completion/public-release claim.


---
2026-10-17 — plan85; browser Auto Loop/Roll pad inputs
Independent adapter uses actual setLoop/seek; Auto Loop nearest-beat snap/resize/same-size exit; momentary Roll captures prior loop and continuing audio clock, original Note Off restores timeline with Slip off. Overlapping/early/replacement ownership checked with collaborators. Show Beat Jump Controls repurposes bottom pads5back/6half/7double/8forward, separate4beat size. Range/UI/legacy-roll shared ownership and compound/changing-rate paths remain open.
Actual editor + explicitly SYNTHETIC input:0–0.25s loop repeats then toggles off; Roll returns1.629637s against1.628027s expected; paused Beat Jump size4→2→4 and source4→2→4s. Complete finite4.679977s stereo master75749B, SHA b829d61e438210cc099477f0472491045d8b49ac5717cf59a1fb24bc95ba50ff. Left320Hz repeats/640Hz after exit/return; right550Hz stable, errors<0.014Hz. Eight hashes stable. First discontinuous330Hz fixture failure retained; corrected320Hz fixture rerun passed without product changes. No listening/music-quality/hardware/native claim.
v5 has164candidate bindings;0x51 Roll-pad2 inferred (absent XML), existing Sampler-alt0x38–0x3F inference retained. Pro guide semantics used rather than custom Mixxx behavior. No proprietary/unlicensed script copied. Native0.1.12/profile/launchers unchanged; Jason away, no physical capture. Physical pages/bytes, full modes/range/UI/manual loop/persistence/compound/quality/reference acceptance remain open.
Evidence: docs/prototype/midi-loop-pads-browser-results.json + policy results; docs/research/HERCULES_MIDI_SEMANTICS_20261017.md; full plan85/updated Claude handoff. Existing per-feature Codex/Claude model+effort routing retained; full Claude audit unlaunched. No full flags or card completion.


---
2026-10-18 — plan87; Manual Loop/Scratch Bank inputs
Actual manual engine setLoop/seek shared by UI IN/OUT/Save and7documented pad functions. Active IN/OUT toggles boundary edit; relative jog1ms/tick adjusts original-source bounds without tempo changes (independent curve, unmeasured hardware). Toggle/reloop/selected-slot save/prev/next, visible/ARIA edit states; no invented pad8. Scratch panel/MIDI share snapshot slot/cue/repeat/keylock load onto addressed deck; Shift assigned pad restores previous source position. Slot settings apply only to accepted/current/decode-success load, closing old playing-lock rejection mutation path.
Actual editor/SYNTHETIC first-run workflow passed:1–2s manual loop becomes1.025–1.95s, nominal rate1, localStorage slot1/2 metadata observed, next/previous/reloop. Eighth Scratch slot assigned through UI; deck1loads cue2s/Repeattrue/Keylockfalse while right continues. Recorded400→800→800→400Hz left/550Hz right, including unchanged voice/settings after locked load rejection and Shift previous exact source-position restoration. Full finite1.62s stereo master26323B, SHA b190d4da1e79211b323c44149f2a92f79fe189c23cffdbfb73d875714e56fe0a; errors<0.011Hz,8hashes stable. Policy collaborators passed; no unrelated test/reviewer matrix.
v7has258candidate bindings. Manual0x60–0x66 and missing Scratch0x77/0x7D inferred/absent XML, earlier hypotheses retained; no physical/default-map proof. Native0.1.12/profile/launchers unchanged, Jason away/no capture. Boundary keyboard/DVS/quantized reloop, full slot/bank/persistence/playing-load/keylock/cold/error/compound/music-quality/reference acceptance remains open.
Evidence: docs/prototype/midi-manual-scratch-browser-results.json + policy; semantics note, plan87/Claude handoff. Existing Codex/Claude model+effort routing retained; full audit unlaunched. No full flags/card completion/public release.


### Plan91 — loop UI and owned Roll (18October2026)
Browser source now exposes Saved loops / Auto Loop / Loop Roll submodes, bounded pad ranges and lower-row Beat Jump. UI Hold Roll and keyboard/pointer pads use the same owned transport as MIDI. Original release, cancellation or blur restores prior loop/backing timeline; stale releases cannot end a newer owner. Mode/range/pad buttons support keyboard; pressed state identifies active size, focus survives redraw; Beat Jump size labels redraw.
Focused lifecycle policy plus actual app UI/master-recording workflow; receipt docs/prototype/loop-ui-browser-results.json. No physical/native/reference/compound musical-quality acceptance. Native0.1.13 remains stopped/unmodified. Full feature status remains open. Existing per-feature model/effort routing retained.


### Plan92 — Simple Sync with active loops (18October2026)
Removed the forward Simple Sync blanket loop refusal. Independent alignment filters inaudible outside-loop events, projects across periodic boundaries and schedules inside unchanged loop bounds. Captures track/loop transport signature around async work; paused Sync still only matches tempo. Focused pre-change regression failed on an outside-loop transient; changed policy passes. Actual app Play/Sync/master recording:120/128BPM loops0–2s/0–1.875s preserve bounds, rates1/0.9375, eight post-Sync pulse pairs within0.522ms vs10ms criterion (initial mismatch up to66.168ms). Whole finite5.759977s stereo master; receipt docs/prototype/loop-simple-sync-browser-results.json. Controlled pulse alignment, not hardware latency/listening or exact vendor algorithm. Smart Sync loops, grid/warp edges, reverse/Stem Slip, live compound/music/native/physical acceptance remain open. Native0.1.13 stopped/unmodified. Existing model/effort routing retained; no full feature promotion.


### Plan93 — Smart Sync flat-grid loops (18October2026)
Removed blanket loop refusal for forward flat grids. Whole-bar future alignment stays inside saved bounds; armed loops and shared tempo work. Non-whole-bar cycles keep tempo and report Tempo Sync; whole-bar restore allows explicit re-Sync. Short-loop policy is independent and exact vendor comparison remains open. Captures transport around async handoff; warped loops still refuse before engine scheduling.
Focused policy plus one actual app Setup/Sync/Play/saved-loop/master-recording workflow passed:120/128BPM loops preserve bounds, each whole-bar segment8beat/2downbeat pairs within0.091/0.182ms vs10ms criteria; short two-beat loop retains0.5s pulse interval/1s downbeat cycle and Tempo labels, then restores measured bar alignment. Full finite10.919977s stereo master; docs/prototype/smart-sync-loops-browser-results.json. First report retained: test clicked re-Sync before saved-loop seek/new voice handoff; final waits actual handoff (no product workaround). Failed capture discarded by old cleanup, not claimed; future failure capture retention added.
Controlled source/browser scope only. Warp-loop/keylock/stems/reverse/short/offgrid/rapid arbitration/music/native/hardware/reference acceptance remains open; no full feature flag promoted. Native0.1.13 stays stopped/unmodified; human away. Existing model/effort routing retained.


### Plan94 — audio-thread warped loops (18October2026)
Beatgrid clock now wraps accumulated musical beats. New original PCM AudioWorklet uses that clock per sample, repeating local source-rate changes without UI-timer lookahead. Engine routes/owns/disposes it through existing gates and rebuilds loop transport on edits. Smart Sync allows warped loops; warped-loop keylock/pitch/reverse/Stem Slip remain explicit gaps.100s kernel projection is analytical, not long browser/device proof.
Actual app editor persists120→150→90 sections, Smart Sync/Play run eight-beat loops0.05–4.05s and0.13–3.73s (90section outside). One finite10.559977s stereo master across two wraps: five3beat-pair windows max0.182ms vs10ms; real worklet voice/clock alternates1/.8/1/.8/1; original bounds retained. docs/prototype/warp-loop-browser-results.json. Focused old-clock regression fails/new PCM policy passes; plan93 policy receipt preserved separately.
Separate keyboard/UI loop-off/recall returned active/inactive states with two decks playing, then stopped. No continuous-sound claim. Tool mouse activation on Play did not visibly start; Enter did; cause unresolved, not physical proof. Keylock/stem/gesture/long-run/late-handoff/music/reference/native/hardware acceptance remains open. Native0.1.13 untouched; no full parity flags promoted; existing model/effort routing retained.


### Plan95 — cached warped-loop keylock/pitch (18October2026)
New periodic loop render uses existing MIT Signalsmith worker, guard context, bounded cache and musical-cycle PCM mapping. Only this offline path uses240ms block/60ms interval, complete seek history and patched schedule/output compensation; no per-tone correction/vendor edit/gate relaxation. Live/default keylock unchanged.
Initial1.3–1.6Hz/136ms failures and whole recording retained. Authorized fresh Fable5.1High consultation diagnosed pitch configuration; oversized sweep stopped, reduced to3cases. Independent same-PCM FFT confirms default1.344Hz vs240/60ms0.301Hz. Narrow consultation report docs/research/claude-fable/warp-loop-keylock-pitch-20261018.md is NOT full Serato audit.
Revised actual app reference-versus-keylock/+3 warped-loop recording passes unchanged gates: five3pair sections max2.654ms vs10ms, independent global20–20000Hz spectrum max0.291Hz vs1Hz, full finite10.559977s stereo master. Receipt docs/prototype/warp-loop-keylock-browser-inspection.json; original failures remain separate. Full keys/rates/music/transients/edits/stems/gestures/live-default/native/hardware/reference acceptance remains open. Native0.1.13 untouched; full parity flags false; existing model/effort routing retained.


Plan101 (18Oct2026; browser source): offline Worker now uses generic pitch resampling+neutral stretching with unchanged WASM/default120/30ms profile. Isolated retained shifted/bass cases pass1Hz; three existingSRC geometries remain byte-identical after helper extraction. Actual Loop8/Key lock/tempo+8%/Play/Key+/Key+/Pause records18.60s; shifted maxerror0.000090Hz. Initial1.21/1.16s preparation gaps retained; single-deck future handoff keeps old loop audible, final key-preparation windows have zero quiet10ms bins. Preparation remains1.318/1.281s (response gap still open). Receipts docs/prototype/offline-resampled-keylock-handoff-browser-{results,inspection}.json and offline-resampled-keylock-transition-inspection.json. Default forward-live shifted-pitch failure and warped-loop method unchanged. No full-rate/music/boundary/compound/native0.1.14/physical/reference acceptance or flag promotion. Model routing retained; full Claude audit unlaunched.

## Plan114 — warped-loop Censor, browser source
Active warped loops no longer reject Censor. Reversed grid/loop uses existing audio-thread kernel; keylock/shift reverse periodic rendered cycles. Original forward owner/grid stays running silently and returns with loop/BeatSync/mute intact. Final actual app U/Stem-pad flow covers raw, locked+2 and unlocked+2:18fixed audio windows max0.481314Hz vs1Hz; reverse90→150→120/wrap, audible forward-return carrier, six mute ratios0.665434–0.667088. Whole29.82s master SHA603d97dffc28a89953da0347915cafbd4733cd20c04c01a9381459c9d3b87a71. Five separate pull inputs/three actual disposal ACKs;13stable source hashes. Known8beat/realPCM contract separate. Initial narrower captures preserved; final output wrappers correct disconnect/input-index handling. No broad green matrix repeated. Native16unchanged, human away/no timed capture. Model quality, selected-stem Slip/Censor, other compositions/ranges/music/physical/full-reference acceptance remain open; full flags/model routing unchanged. Full Claude audit unlaunched.
Review: https://github.com/jpoindexter/open-play/blob/main/docs/prototype/WARPED_LOOP_CENSOR_REVIEW.md
