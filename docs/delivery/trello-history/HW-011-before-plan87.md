# HW-011 description before plan87

Captured2026-10-18. Historical checkpoint prose, preserved verbatim below. Current acceptance is governed by the live card, full build plan and dated receipts; old version results are not current hardware or full-parity proof.

## Outcome and acceptance
Hercules Inpulse 300 MK2 full default mapping
Verify every physical control, modifier, pad mode, jog touch, guide LED, reconnect and four-output route on this connected unit.

## Evidence
- [Manual index — exact reference mapping pending](https://support.serato.com/hc/en-us/categories/202698038-Serato-DJ-Pro-manual)
Proposed scope; exact-version and runtime checks pending.

## Dependencies and work
- [ ] Reference evidence and subfeature inventory
- [ ] Screen, controls, states, shortcuts and errors
- [ ] HTML behavior after inventory gate; identify simulations
- [ ] Native stage N3, only after Jason approves prototype
- [ ] Execute acceptance on exact candidate and attach results
Dependencies: reference → specification → prototype → approval → native → acceptance. Physical device tests required for hardware claims.

## AI recommendation — 2026-10-16
Primary Codex: gpt-6-astra; reasoning xhigh.
Claude Code alternative/reviewer: claude-opus-5; effort xhigh.
Reason: Hardware protocols and binary evidence need careful competing hypotheses.
Escalation: After two materially different failed approaches: obtain missing evidence, then escalate one effort/model tier; never substitute reasoning for a hardware test
Review: Fresh evidence review; Claude is an optional alternative, not automatically invoked.
Source: host Codex catalog; https://code.claude.com/docs/en/model-config and installed CLI 2.1.222. Account invocation untested. Cost unknown; measure usage. Recommendations do not authorize an agent launch.

## Actual status
Local desktop testing authorized. Scoped implementation/evidence exists; full native and reference acceptance remains unverified. Current feature-specific audit below governs older checkpoint prose.

Plan: https://github.com/jpoindexter/open-play/blob/main/FULL_BUILD_PLAN.md
Feature ID: HW-011.

---
2026-10-17 — desktop0.1.3: current executed subset
Jason approved switching to the cue test. Actual native Hercules selection + master1/2/cue3/4 applied. USER-CONFIRMED: cue-only headphones play/powered RCA speakers silent; master-only speakers play/headphones silent. First speakers-off report was repeated. Native whole-stream recordings:22.32s cue-only master exactlyzero;29.88s master-only finite/nonzero. Both decks paused.0.1.1 knob navigation remains user-confirmed;0.1.3 retains mapping/enumerates MIDI, no fresh knob action claimed.
197prototypefiles match a8fe82e; fixed own-main-frame host/ASAR9/9 reviewed, original0.1.2 failure retained. Browser graph18/18, actualengine15/15; controller13/13 and Slipgraph6/6 are controlled layers. Source/records f863c05, plan51, desktop-candidate.json and runtime/audio-inspection JSON.0.1.1 preserved, default launcher0.1.3.
Full1:1 false110groups/522requirements. Fullmap/LED/jog/hot-unplug/latency/quality/otherhardware/persistence/keylock/SCNet/Video/providers remain open. Next: imported-audio restart persistence. Existing per-feature Codex/Claude model+effort recommendations retained; no full audit launch/public release or card completion.


---
2026-10-17 — current feature parity audit
Evidence category: physical-subset; FULL FEATURE PARITY UNPROVEN.
One relative browser-knob action user-confirmed0.1.1; actual0.1.3 Hercules cue/master route isolation both directions.
Remaining acceptance: 38 requirements cover many controls: jog/touch/pads/modifiers/guides/LEDs/pitch/full map/hotplug still unverified.
Codex gpt-6-astra/xhigh; Claude Code claude-opus-5/xhigh. Recommendations only; confirm installed equivalents.
Audit: https://github.com/jpoindexter/open-play/blob/main/docs/research/CURRENT_PARITY_AUDIT_20261017.md
Current installed scope110groups/522requirements plus separate9beta deltas. Browser WIP is not physical-tested0.1.3. No completion/public-release claim.


---
2026-10-17 — plan80/81; playback-first candidate0.1.12
Jason prioritizes usable two-deck mixing/controller testing before extras. Independent64-assignment device-bound starter preset plus actual gain/EQ/filter/levels/tempo-pickup/Load/Play/Cue/Sync/loop/nudge/FX controls; existing manual assignments preserved. This is not a verified Serato default. No controller script copied; address facts from authored MK2 community mapping.
Actual normal native app launched; eight served hashes match source2708ac1 / package ASAR411f248d. Explicitly SYNTHETIC bound-input CC moved deck1 level0→0.79; Play reached1deck/nonzero master. Paused SYNTHETIC deck2 Sync changed126→124BPM, showed primary/secondary flags. Normal Play reached2decks/nonzero meter, then stopped. Named Hercules master1/2/cue3/4 configured; CueMix0%, digital CueVolume10%. No physical action/socket/audible phase claim.
Jason replied away. App left with two demo tracks at00:00, stopped. Next when back: left hardware Play, confirm deck starts + RCA sound, stop with same button; then remaining controls one at a time. No timed capture while away. Touch scratch/pad modes/further modifiers/LEDs/guides/hotplug/latency and exact full-map behavior remain open; jog is10ms phase nudge, not scratch acceptance. Master/headphone analog behavior must be observed.
Evidence: docs/prototype/desktop-0.1.12-playback-observation.json; package receipt, TRY_CURRENT_DESKTOP.md; full plan81 and updated Claude handoff. Historical0.1.1/0.1.3 results keep original scope. No full acceptance/card completion. Existing model routing retained; direct scoped testing, no routine independent review. Full Claude audit unlaunched.

---
2026-10-17 — plan82; browser MIDI jog bend, native0.1.12 unchanged
Added independent temporary local jog speed bending instead of seek steps for playing decks. Nominal fader/Sync rate stays unchanged;80ms tick window/up to8%/request nominal return after150ms idle. Paused stepping and explicit old nudge target remain. v2 starter preset replaces only its own earlier version on the selected input when the install button is used; manual assignments remain. Running0.1.12 still has v1/phase steps: no silent native upgrade or new hardware claim.
Actual browser app editor + explicitly synthetic CC + normal Play/Sync: final complete finite1.74s/stereo recording,28255B, SHA ec4bd85482cf7b3838e5794e576e5b67175081081e320f58af39fa8e1324eccd. Addressed carrier330→356.40009→329.99987Hz; opposite synced550Hz stable; nominal rates[1,1]. Existing source owners retained; idle return162.54ms; source-clock phase gain63.1583ms; post-return clock drift0 over450ms. Seven declared hashes stable. Not measured musical beat phase/click quality.
Focused lifecycle policy found/fixed a rejected-update owner leaving its prior bend applied; final policy includes owned nominal restoration and no replacement-voice overwrite. Minimal engine fixture omission and initial browser mute-ACK setup failure retained, along with earlier/final full recordings. No unrelated DSP/model matrix or reviewer invoked.
Evidence: docs/prototype/jog-bend-browser-results.json, jog-bend-policy-results.json, jog-bend-recovery-attempts.json; plan82 and updated Claude handoff. Negative audio/keylocked audio/hardware direction/touch/pad modes/LEDs/warp/gesture/full races/background timing/reference parity remain open; unsupported new-bend compositions explicitly refuse. Jason away; keep0.1.12 ready for first physical Play/mixer/cue/Sync when back. No timed hardware capture or completion/full flag promotion. Existing model routing retained; full independent Claude audit unlaunched.

---
2026-10-17 — plan83; browser MIDI touch/surface scratch routing
Independent adapter uses existing scratch begin/update/end APIs: original sensor Note Off, queued motion during prep, idle hold, final angle/zero velocity, disconnect/replacement ownership and End after rejected final movement. v3 starter has74 address assignments, not74 accepted physical controls. Per-deck Vinyl policy; Shift-touch4×; Shift-Slip toggles Vinyl.248ticks/revolution assumed from authored MK2 mapping; physical calibration/direction still open. Explicit install only; running native0.1.12 remains unchanged with v1/64 maps.
Actual browser editor + explicitly synthetic MIDI + normal Play: one first complete run passed. Prepared330/550Hz stereo fixtures; full finite3s recording48605B, SHA ea0ae7b0d1d11b67e9534b562626e3a396c900d9466cb73f2e5251392d988435. Touch-held left RMS4.7762e-5 below1e-4; right continues. Twenty signed packets each direction move actual worklet cursor +0.10752688s then -0.10752688s, with recorded movement audio. Note Off resumes330.00186Hz. Vinyl-off surface bends the released idle scratch transport to356.39618Hz, then330.00313Hz; right550Hz stable. Final nominal/audible rates[1,1]; cleanup stops both. Eight hashes stable. Idle scratch worklet now accepts bend; active scratch refuses it.
Evidence: docs/prototype/midi-jog-touch-browser-results.json + policy results; plan83/current Claude handoff; raw originals retained ignored. No new DSP or unrelated test/reviewer matrix. Prepared-fixture routing/cursor/audio proof only: hardware feel, cold-start latency, fast/paused/keylocked/stem/Slip/warp/loop/reverse/composed quality/races, LEDs/guides, persistence/hotplug and exact reference remain unverified. Jason away; keep0.1.12 ready for physical Play/mixer/cue/Sync when back. Full flags/card completion unchanged; existing model routing retained; full Claude audit unlaunched.

---
2026-10-17 — plan84; browser MIDI transport/Quantize/Sampler
Actual editor + explicitly synthetic input, prepared fixtures: per-deck Q gives cue0.23s versus0s, deckfalse/true and header mixed; header then sets both on. MIDI range/slider8→16, Slip state, previous track at0.23s and paused stutter reached actual app/engine paths. This is not full Slip/Sync/timing acceptance.
One first-run complete finite1.5s stereo sampler recording22471B, SHA cd7ce2dca6cef74a6c282ce840e476fd0b276c2421b285e95e5904e02fc75471: BankA Hold, A+B, A release after bank switch+mapping deletion, newer B trigger surviving old release, empty-slot8 alt load without play and loaded-slot1 alt stop. Active330/550Hz windows within0.5Hz; silent windows below1e-4RMS; no voices before cleanup. Original Hold owns bank/slot/engine token; legacySampler1 shares that path. Six hashes stable. Focused policy collaborators passed; no unrelated DSP/model/reviewer matrix.
Pro-guide behavior supersedes custom Mixxx action choices. v4 adds documented transport modifiers, cue-clear and8Sampler targets to132 candidate assignments. Sampler-alt0x38–0x3F is INFERRED (not found in inspected XML, not physically captured). Other pad-bank, browser/Prepare, modifier/LED/guide and composed/native/reference requirements remain open; no full-map claim. Hardware response, all modes/slots/pitch/long-session/error/reconnect/persistence/music quality unaccepted. Jason away; no physical capture. Running0.1.12/profile/launcher unchanged.
Evidence: docs/prototype/midi-sampler-buttons-browser-results.json + policy results; docs/research/HERCULES_MIDI_SEMANTICS_20261017.md; full plan84/current Claude handoff. Raw originals retained ignored. Full flags/card completion unchanged; existing model/effort routing retained; full independent Claude audit unlaunched.

---
2026-10-17 — plan85; browser Auto Loop/Roll pad inputs
Independent adapter uses actual setLoop/seek; Auto Loop nearest-beat snap/resize/same-size exit; momentary Roll captures prior loop and continuing audio clock, original Note Off restores timeline with Slip off. Overlapping/early/replacement ownership checked with collaborators. Show Beat Jump Controls repurposes bottom pads5back/6half/7double/8forward, separate4beat size. Range/UI/legacy-roll shared ownership and compound/changing-rate paths remain open.
Actual editor + explicitly SYNTHETIC input:0–0.25s loop repeats then toggles off; Roll returns1.629637s against1.628027s expected; paused Beat Jump size4→2→4 and source4→2→4s. Complete finite4.679977s stereo master75749B, SHA b829d61e438210cc099477f0472491045d8b49ac5717cf59a1fb24bc95ba50ff. Left320Hz repeats/640Hz after exit/return; right550Hz stable, errors<0.014Hz. Eight hashes stable. First discontinuous330Hz fixture failure retained; corrected320Hz fixture rerun passed without product changes. No listening/music-quality/hardware/native claim.
v5 has164candidate bindings;0x51 Roll-pad2 inferred (absent XML), existing Sampler-alt0x38–0x3F inference retained. Pro guide semantics used rather than custom Mixxx behavior. No proprietary/unlicensed script copied. Native0.1.12/profile/launchers unchanged; Jason away, no physical capture. Physical pages/bytes, full modes/range/UI/manual loop/persistence/compound/quality/reference acceptance remain open.
Evidence: docs/prototype/midi-loop-pads-browser-results.json + policy results; docs/research/HERCULES_MIDI_SEMANTICS_20261017.md; full plan85/updated Claude handoff. Existing per-feature Codex/Claude model+effort routing retained; full Claude audit unlaunched. No full flags or card completion.


---
2026-10-18 — plan86; browser Stems/Pitch MIDI inputs
Shared actual Stem pad action prepares when needed, toggles addressed stem/FX and updates engine; delayed prep checks track/load generation (new cancellation guard is code-path, no fresh worker cancellation test). All4decks expose8Stem/8Pitch/8Shift cue-select targets. Pitch uses existing held transport with release captured before awaiting prep; Note Off/disconnect survives mapping changes. No new DSP/model/entitlement gate.
Actual editor/SYNTHETIC notes, first-run recorded workflow passed: four prepared Stem mutes, vocal-only220Hz restore while right550Hz continues;4FX flags + actual vocal Echo owner observed, not new all4FX acoustic proof. Shift selects/creates quantized cue2 at1s from paused1.23s without playing/pitching. Held Middle+1 yields583.640Hz vs582.705Hz expected (0.935Hz error, criterion1.5Hz). Delete held mapping then original Note Off stops right and returns1s cue; left220Hz continues. Complete finite2.099977s stereo master34067B SHA1d8ad2c6ba44df218c755d392d1b47bcbfe0e41be7f43c83f5187663a3103f6c; eight hashes stable. Scoped policy passed. No unrelated test/reviewer matrix.
v6 has212candidate bindings; Pitch0x44–0x4F inferred/absent inspected XML, no physical capture. Existing Roll0x51/Sampler-alt hypotheses retained. Native0.1.12/profile/launchers unchanged, Jason away. No fresh SCNet run, full FX/pitch/music-quality/native/hardware/reference acceptance. Full cold/compound/range/LED/guide checks remain open.
Evidence: docs/prototype/midi-stems-pitch-browser-results.json + policy; semantics note, plan86/current Claude handoff. Original prompt suffix intact. Existing per-feature Codex/Claude model+effort recommendations retained; full audit unlaunched. No full flags/card completion/public release.


