## Outcome and acceptance
Smart sync state machine and relative-pitch takeover
Exercise armed, beat, tempo, disengaged-relative and absolute states, including a missing-grid load; sources 227627128, 227627168, 227561927, 227561947.

## Evidence
- [Beat Sync](https://support.serato.com/hc/en-us/articles/227627128-Beat-Sync)
- [Tempo Sync](https://support.serato.com/hc/en-us/articles/227627168-Tempo-Sync)
- [Disengage Sync](https://support.serato.com/hc/en-us/articles/227561927-Disengage-Sync)
- [Relative Pitch & Tempo Control (Smart Sync)](https://support.serato.com/hc/en-us/articles/227561947-Relative-Pitch-Tempo-Control-Smart-Sync)
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
Feature ID: DEK-018.

## Source links — 2026-10-16
- [Smart Sync (Using Beatgrids)](https://support.serato.com/hc/en-us/articles/227627088-Smart-Sync-Using-Beatgrids)
- [Beat Position Indicator](https://support.serato.com/hc/en-us/articles/227627108-Beat-Position-Indicator)
- [Arm Beat Sync](https://support.serato.com/hc/en-us/articles/227627148-Arm-Beat-Sync)
- [Loading tracks With No Beatgrid](https://support.serato.com/hc/en-us/articles/227561967-Loading-tracks-With-No-Beatgrid)
- [Sync Preferences](https://support.serato.com/hc/en-us/articles/227785587-Sync-Preferences)
Crosswalk: https://github.com/jpoindexter/open-play/blob/main/docs/research/MANUAL_FEATURE_CROSSWALK.md

---
2026-10-17 — current feature parity audit
Evidence category: simulation/backend-gap; FULL FEATURE PARITY UNPROVEN.
Source explicitly labels Smart Sync phase/takeover simulated; basic tempo match only.
Remaining acceptance: Real armed/beat/tempo/disengaged-relative/absolute state transitions and hardware fader takeover.
Codex gpt-6-astra/high; Claude Code claude-opus-5/high. Recommendations only; confirm installed equivalents.
Audit: https://github.com/jpoindexter/open-play/blob/main/docs/research/CURRENT_PARITY_AUDIT_20261017.md
Current installed scope110groups/522requirements plus separate9beta deltas. Browser WIP is not physical-tested0.1.3. No completion/public-release claim.


---
2026-10-17 — plan73; Smart Sync remains open
Simple Sync now has actual PCM transient/source-clock alignment, re-SYNC, shared software tempo and OFF, with one focused real app/audio workflow (three final pulse errors0.522ms≤10ms). This is not Smart Sync acceptance. Missing-grid/armed/beat/tempo/bar/warp states, maintain-load and hardware relative/absolute takeover remain unimplemented or unverified. Next implementation unit starts with grid-aware state transitions. Browser source differs from packaged0.1.10; no native transfer.110/522,0fullpasses. docs/prototype/simple-sync-browser-results.json; plan/fullClaudehandoff updated; fullClaudeaudit unlaunched. Project-wide testing rule: changed behavior + short integrated smoke when needed, broaden at release milestones/failures, then move on; no routine broad reruns. Codexgpt-6-astra/high; Claudeclaude-opus-5/high recommendations retained. No card completion.

---
2026-10-17 — plan74; actual constant-grid Smart Sync subset
Replaced tempo-only Smart Sync with independent armed/beat/tempo source alignment. First deck establishes tempo; paused Sync arms without autoplay; Play aligns grid/bar at actual scheduled start. Manual playhead move enters gold Tempo Sync; re-SYNC restores blue Beat Sync. Four-beat state indicator. Software shared tempo/OFF→relative→off and analyzed missing-grid load are active. Imported tracks keep null grid until produced; Setup Sync Mode immediately renders controls.
One actual app/continuous6.9s stereo master workflow: beat/re-Sync audible downbeats differ0.1814ms≤10ms; one-source-second seek keeps~500ms intervals and stable phase offset (~1.23ms drift), audible bars offset~1.0565s. Actual software source tempo124.8BPM, OFF states and missing-grid load despite Maintain enabled observed. Whole original/failed receipt retained. First test wrongly demanded Tempo phase alignment after2.133beat seek and set accent threshold below normal max; corrected criteria, no gain/phase fit,10ms bounds retained. No broad FX/hardware rerun.
Full feature stays OPEN. Warp grids, valid-grid maintain acceptance, hardware absolute takeover/Shift/DVS/WIR, compositions/cursor/continuity/group scheduling/native/reference remain open. New source not packaged0110. Next: real Beat Warp Marker model/editing +piecewise clock. docs/prototype/smart-sync-browser-results.json; plan/fullClaudehandoff updated.110/522,9beta+26release separate,0fullpasses; fullClaudeaudit unlaunched. Pragmatic change-focused testing throughout. Existing Codexgpt-6-astra/high and Claudeclaude-opus-5/high recommendations retained; confirm equivalents. No completion.

---
2026-10-17 — plan75; warped forward Smart Sync
New shared piecewise beatgrid schedules AudioParam rate changes at source tempo boundaries, with matching source clock/bar alignment. Global Sync tempo stays fixed. Actual no-keylock/no-stems two-deck audio crosses both variable-tempo sections in time. Keylock/pitch/reverse/loop/StemSlip warping guarded as unavailable. Live grid edits currently refresh into Tempo Sync; preserving prior beat/offset there remains open. Next: keylocked variable-rate transport +live-edit phase retention. Exact reference/primary takeover/compositions/continuity/group atomic/native/hardware gaps remain.
Five-observation actual app workflow; whole6.6s stereo recording finite; max pulse difference0.0681ms≤10ms across120→150→90BPM source sections. Actual secondary rates0.8/1.3333, output120.0BPM. Secondary+4% updates actual sources to1.3867/1.04 for124.8BPM. First audio capture also passed; later nominal-slider code issue corrected and directly checked. Both originals preserved. No broad FX/model/hardware rerun. docs/prototype/warp-sync-browser-results.json; plan75/fullClaudehandoff updated.110/522,9beta+26release separate,0fullpasses. Old packaged0110 unchanged; fullClaudeaudit unlaunched. Pragmatic changed-path testing throughout. Codexgpt-6-astra/high; Claudeclaude-opus-5/high recommendations retained. No full acceptance/card completion.

---
2026-10-17 — plan76; warped keylock actual audio
The browser keylock adapter now installs a complete future rate map on one processor group while ordinary PCM refill follows current time. Actual app original-only two-deck120/150/90 source warp recording10.56s: max steady pulse difference1.9048ms≤10ms,330/550Hz carrier errors≤.4705Hz vs1Hz. Output120.0; actual adapter rates1/.8/4/3. First completed focused workflow passed, no broad rerun. Both source identities/whole original retained; docs/prototype/warp-keylock-browser-results.json.
Earlier no-keylock restriction superseded only for this subset. Live-grid edit phase, musical/transition/cursor/allshift/rate/stem/transport compositions/nativeR3/API/hardware/reference remain open. Source map replacement on seek/rate/pitch is code-path, not artifact-free acceptance. Next live-grid phase retention. Plan/fullClaudehandoff updated;110/522,0fullpasses; fullClaudeaudit unlaunched. Codexgpt-6-astra/high; Claudeclaude-opus-5/high recommendations retained. Pragmatic changed-path testing throughout. No completion.

---
2026-10-17 — plan77; live edit phase retention
Save no longer unconditionally converts Beat Sync to Tempo Sync. Old musical beat is projected onto the new grid at actual source handoff, retaining Beat or Tempo state/role/offset. Existing-owner guards respect superseding actions; failure recovery code paths unaccepted. Executed future-marker edits on one forward original-only keylocked secondary below; arbitrary edits, primary/shared-track, compositions/continuity/cursor/native/hardware/reference remain open. Next shared five-source stem warp/coherence.
One actual keyed two-deck workflow / whole13.86s stereo master: first future150BPM marker save retains Beat Sync/secondary role,6 pulse pairs max2.7438ms≤10ms. After a waveform seek, second future90BPM marker save retains Tempo Sync: mean offset−189.4444ms→−190.8333ms, change1.3889ms≤10ms,4 pairs each; spread<1.2ms. Both records persisted. First capture's6.69ms offset failed20ms fixture floor; retained. Seek fixture adjusted to0.8source sec; criteria unchanged. No broad rerun. docs/prototype/live-grid-edit-browser-results.json; plan77/fullClaudehandoff updated.110/522,9beta+26release separate,0fullpasses. FullClaudeaudit unlaunched; packaged0110 unchanged. Codexgpt-6-astra/high; Claudeclaude-opus-5/high recommendations retained. Pragmatic testing throughout; no completion.

---
2026-10-17 — plan78; five-source shared warp map
Original+four stems now share one ten-channel browser keylock processor and one append/drop/warp map, preserving five selectable outputs. Actual prepared-fixture Stem controls and cancellation waveform cross both source-tempo boundaries below. This is not new separation quality or full musical coherence; model/music/cursor/continuity/compositions/native/hardware/reference remain open. Next optional native checkpoint of current source under existing desktop-test approval, old apps/default intact.
Actual one-deck Keylock/Smart Sync/Stem-pad workflow; whole12.66s stereo master finite. Known +550/−550 pair cancels to≤.00603% of330Hz across120/150/90 source sections (1% limit), Bass/original leakage≤.00807%. Melody-only pad exposes550/330≈1.333; final mute RMS≈2e−34≤1e−5. Fixed measured bands, no gain/time fit or revised criterion; first completed run passes. docs/prototype/stem-coherence-browser-results.json. Known prepared fixtures, no new ML inference/quality/native/hardware/reference claim. Existing SCNet/R3/cursor/FX failures unchanged. Plan78/fullClaudehandoff updated;110/522,9beta+26release separate,0fullpasses; fullClaudeaudit unlaunched. Codexgpt-6-astra/high; Claudeclaude-opus-5/high recommendations retained. Pragmatic testing throughout; no completion.

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


### Plan96 — prepared Sync tempo handoff
Old voices continue until all replacements prepare/arm at one audio time; successful group ownership detaches for later independent pause. Actual cold126/latest124.8BPM workflow: shared anchors, no measured1ms quiet bins, max1.610ms phase/0.272Hz pitch, independent pause; finite6.18s master. docs/prototype/sync-tempo-browser-inspection.json. Cold request→handoff0.419/0.425s remains a low-latency gap. Raw-only path retains prior AudioParam route; existing regression passes. Fault/race/FX-phase/gesture/music/native/hardware/full reference acceptance open.0.1.13 untouched; routing/full flags unchanged.


Plan97: paused warped Smart Sync headers/FX use planned BPM; redraw check passed, no audio/native pass. docs/prototype/paused-tempo-browser-results.json. Routing unchanged.