## Outcome and acceptance
Sync, master and phase
Change leader, disable sync and handle tempo changes with predictable phase behavior.

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
Feature ID: DEK-008.

## Exact source crosswalk — 2026-10-16
- [Beat Matching Display](https://support.serato.com/hc/en-us/articles/225126448-Beat-Matching-Display)
- [Getting the Tracks in Time](https://support.serato.com/hc/en-us/articles/235191007-Getting-the-Tracks-in-Time)
- [Simple Sync (No Beatgrids)](https://support.serato.com/hc/en-us/articles/226378287-Simple-Sync-No-Beatgrids)
- [Snap to Beatgrid](https://support.serato.com/hc/en-us/articles/233088208-Snap-to-Beatgrid)
- [Relative Pitch & Tempo Control (Simple Sync)](https://support.serato.com/hc/en-us/articles/115004047148-Relative-Pitch-Tempo-Control-Simple-Sync)
- [Sync Preferences](https://support.serato.com/hc/en-us/articles/227785587-Sync-Preferences)

Source assignment verified; semantic control/state review and installed-version reconciliation remain open. This is not a parity pass.
Crosswalk: https://github.com/jpoindexter/open-play/blob/main/docs/research/MANUAL_FEATURE_CROSSWALK.md

---
2026-10-17 — current feature parity audit
Evidence category: simulation/backend-gap; FULL FEATURE PARITY UNPROVEN.
Basic tempo matching exists; source toast explicitly says Smart Sync phase/takeover simulated.
Remaining acceptance: Actual leader/beat/phase state machine and measured phase error under tempo/grid changes.
Codex gpt-6-astra/high; Claude Code claude-opus-5/high. Recommendations only; confirm installed equivalents.
Audit: https://github.com/jpoindexter/open-play/blob/main/docs/research/CURRENT_PARITY_AUDIT_20261017.md
Current installed scope110groups/522requirements plus separate9beta deltas. Browser WIP is not physical-tested0.1.3. No completion/public-release claim.


---
2026-10-17 — plan73; actual Simple Sync subset
Independent PCM transient detection + matched tempo and scheduled source alignment replace Simple Sync's tempo-only behavior. Re-SYNC realigns; accessible OFF keeps software tempo and detaches; engaged virtual tempo controls follow together. Actual app DOM + postmaster stereo pulse recording: initial mismatch>30ms; three final pulse pairs each0.522ms apart (10ms criterion). Re-SYNC, actual source tempo following and OFF observed in the same bounded workflow. Whole4.08s original retained; docs/prototype/simple-sync-browser-results.json.
First setup receipt failed on early async mute assertion; second audio passed but Float32 source property assertion was too strict; corrected precision assertion, no audio threshold change. All failures retained. Test stopped after focused workflow passed; no broad FX/hardware repetition.
Only forward two-deck controlled-pulse BufferSource/no-keylock/no-stems path accepted. Music detection, Snap/paused/settings, warp/bar/Smart states, maintain-load, phase-stable group tempo, seamless restart, native/hardware/reference remain open. New source not packaged0.1.10.110/522;0fullpasses. Pragmatic changed-path testing throughout. Plan/Claude handoff updated; fullClaudeaudit unlaunched. Existing Codexgpt-6-astra/high and Claudeclaude-opus-5/high recommendations retained; confirm live equivalents. No card completion.

---
2026-10-17 — plan74; Smart Sync counterpart implemented
Actual constant-grid armed/beat/tempo/bar path now complements plan73 Simple transient Sync. One normal app/continuous6.9s stereo recording: downbeat alignment/re-SYNC0.1814ms≤10ms; playhead move retains tempo/stable offset; software shared tempo/OFF states and analyzed missing-grid load observed. First harness assumption failure retained; no broad matrix reruns. docs/prototype/smart-sync-browser-results.json; plan/fullhandoff updated.
Remaining: piecewise Beat Warp Marker transport first, plus hardware relative/absolute takeover, dynamic group phase, valid-grid maintain-load, keylock/stem/loop/scratch compositions, reference/native/continuity. Software OFF states do not prove hardware takeover.110/522,0fullpasses. New browser source not packaged0110. FullClaudeaudit unlaunched. Project-wide pragmatic testing retained. Codexgpt-6-astra/high; Claudeclaude-opus-5/high recommendations retained. No card completion.

---
2026-10-17 — plan75; piecewise grid clock and warped audio
Actual tempo marker editor and forward Smart Sync now follow120/150/90 source sections through scheduled rate events with a shared source clock. Base-BPM nominal slider meaning preserved after a warp. Constant-grid-only restriction replaced for this executed BufferSource path. Warped keylock, live-edit phase, primary/master takeover, exact reference, hardware/DVS/WIR, atomic group tempo and transition continuity stay open.
Five-observation actual app workflow; whole6.6s stereo recording finite; max pulse difference0.0681ms≤10ms across120→150→90BPM source sections. Actual secondary rates0.8/1.3333, output120.0BPM. Secondary+4% updates actual sources to1.3867/1.04 for124.8BPM. First audio capture also passed; later nominal-slider code issue corrected and directly checked. Both originals preserved. No broad FX/model/hardware rerun. docs/prototype/warp-sync-browser-results.json; plan75/fullClaudehandoff updated.110/522,9beta+26release separate,0fullpasses. Old packaged0110 unchanged; fullClaudeaudit unlaunched. Pragmatic changed-path testing throughout. Codexgpt-6-astra/high; Claudeclaude-opus-5/high recommendations retained. No full acceptance/card completion.

---
2026-10-17 — plan76; actual warped keylock source map
Whole future rate map now reaches the browser Signalsmith processors, with source-clock handoff and current-position PCM refill. One actual app10.56s stereo master recording crosses120/150/90 source sections with keylock: pulse errors≤1.9048ms vs10ms,330/550Hz carrier errors≤.4705Hz vs1Hz. Output120.0BPM. No fitted time/gain or revised threshold; first completed focused flow passed. docs/prototype/warp-keylock-browser-results.json.
Not nativeR3, music quality, all shifts/rates, audible cursor/continuity, stems, scratch/loop/reverse/StemSlip, live-grid phase or exact reference/hardware acceptance. Those stay open. Next live-grid phase retention. Plan/fullhandoff updated;110/522,0fullpasses; fullClaudeaudit unlaunched. Codexgpt-6-astra/high; Claudeclaude-opus-5/high recommendations retained. Pragmatic testing throughout; no completion.

---
2026-10-17 — plan77; actual live-grid synchronization
Live grid saves now retain the prior musical clock/Sync state through scheduled source replacement instead of forcing Tempo Sync. Two actual future-marker edits, one in Beat Sync and one in Tempo Sync, are measured below. Full arbitrary-edit/primary/shared-track, paused/reload/race, stems/transport composition, transition/cursor/nativeR3/hardware/reference acceptance remains open. Next original+4stem shared-processor clock/coherence.
One actual keyed two-deck workflow / whole13.86s stereo master: first future150BPM marker save retains Beat Sync/secondary role,6 pulse pairs max2.7438ms≤10ms. After a waveform seek, second future90BPM marker save retains Tempo Sync: mean offset−189.4444ms→−190.8333ms, change1.3889ms≤10ms,4 pairs each; spread<1.2ms. Both records persisted. First capture's6.69ms offset failed20ms fixture floor; retained. Seek fixture adjusted to0.8source sec; criteria unchanged. No broad rerun. docs/prototype/live-grid-edit-browser-results.json; plan77/fullClaudehandoff updated.110/522,9beta+26release separate,0fullpasses. FullClaudeaudit unlaunched; packaged0110 unchanged. Codexgpt-6-astra/high; Claudeclaude-opus-5/high recommendations retained. Pragmatic testing throughout; no completion.

---
2026-10-17 — plan80/81; MIDI Sync dispatch in native0.1.12
Added independent Hercules starter transport/mixer mappings, including Sync/off. Actual normal native MIDI editor, explicitly labeled SYNTHETIC input bound to the enumerated device: paused deck2 Notech3#5 press/release changed126→124BPM (-1.6%), showed primary/secondary Sync flags, kept0decksplaying. Normal Play buttons then reached2decks/nonzero master, and both were stopped/reset. Eight served source hashes match package/source2708ac1. This is changed native command/state evidence, not measured audible phase or physical MIDI acceptance.
Jason is away; no physical capture/action requested. Next when back: basic hardware playback and mixer test, then both-playing Sync/manual phase adjustment and tempo pickup. Full controller, current sockets, real MP3/import/reload, audible beatmatch and exact reference behavior remain open. Jog target is10ms phase nudge, not touch scratching. Full parity still false; no flag/card completion or full independent Claude audit. Existing model recommendations retained; pragmatic affected-path checks only.
Evidence: docs/prototype/desktop-0.1.12-playback-observation.json; FULL_BUILD_PLAN.md section81; current.md / full Claude handoff. Prior measured browser Sync evidence keeps its own candidate scope.

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


### Plan96 — prepared Sync tempo handoff
Old voices continue until all replacements prepare/arm at one audio time; successful group ownership detaches for later independent pause. Actual cold126/latest124.8BPM workflow: shared anchors, no measured1ms quiet bins, max1.610ms phase/0.272Hz pitch, independent pause; finite6.18s master. docs/prototype/sync-tempo-browser-inspection.json. Cold request→handoff0.419/0.425s remains a low-latency gap. Raw-only path retains prior AudioParam route; existing regression passes. Fault/race/FX-phase/gesture/music/native/hardware/full reference acceptance open.0.1.13 untouched; routing/full flags unchanged.


Plan97: paused warped Smart Sync headers/FX use planned BPM; redraw check passed, no audio/native pass. docs/prototype/paused-tempo-browser-results.json. Routing unchanged.