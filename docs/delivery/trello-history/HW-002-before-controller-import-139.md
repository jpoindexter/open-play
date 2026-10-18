# HW-002 description before controller catalog checkpoint139

Verbatim Trello description archived before compacting its near-limit field. Card: ari:cloud:trello::card/workspace/6a8f03e71844a6c1103692dc/6ad203d1f6909aef29f9f4b2

## Outcome and acceptance
MIDI learn and mapping editor
Learn, edit, export, import and reset mappings with validation and undo.

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
Primary Codex: gpt-6.1-sol; reasoning high.
Claude Code alternative/reviewer: claude-sonnet-5; effort medium.
Reason: UI and library workflows need state consistency and executed interaction checks.
Escalation: After two materially different failed approaches: obtain missing evidence, then escalate one effort/model tier; never substitute reasoning for a hardware test
Review: Fresh evidence review; Claude is an optional alternative, not automatically invoked.
Source: host Codex catalog; https://code.claude.com/docs/en/model-config and installed CLI 2.1.222. Account invocation untested. Cost unknown; measure usage. Recommendations do not authorize an agent launch.

## Actual status
Local desktop testing authorized. Scoped implementation/evidence exists; full native and reference acceptance remains unverified. Current feature-specific audit below governs older checkpoint prose.

Plan: https://github.com/jpoindexter/open-play/blob/main/FULL_BUILD_PLAN.md
Feature ID: HW-002.

## Exact source crosswalk — 2026-10-16
- [MIDI Overview](https://support.serato.com/hc/en-us/articles/225064908-MIDI-Overview)
- [Remapping primary Serato hardware](https://support.serato.com/hc/en-us/articles/225065388-Remapping-primary-Serato-hardware)
- [Remapping Serato Official Accessories](https://support.serato.com/hc/en-us/articles/360000835176-Remapping-Serato-Official-Accessories)
- [Secondary MIDI Controller Setup](https://support.serato.com/hc/en-us/articles/224913027-Secondary-MIDI-Controller-Setup)
- [Assigning Controls](https://support.serato.com/hc/en-us/articles/225065628-Assigning-Controls)
- [MIDI Platters](https://support.serato.com/hc/en-us/articles/225065788-MIDI-Platters)
- [Assign Other Serato DJ Pro Controls](https://support.serato.com/hc/en-us/articles/224913707-Assign-Other-Serato-DJ-Pro-Controls)
- [Control + Click Functionality](https://support.serato.com/hc/en-us/articles/224913767-Control-Click-Functionality)
- [Presets](https://support.serato.com/hc/en-us/articles/224914007-Presets)
- [MIDI](https://support.serato.com/hc/en-us/articles/223446808-MIDI)

Source assignment verified; semantic control/state review and installed-version reconciliation remain open. This is not a parity pass.
Crosswalk: https://github.com/jpoindexter/open-play/blob/main/docs/research/MANUAL_FEATURE_CROSSWALK.md

## Functional browser evidence — 2026-10-16
Actual browser behavior was added in this feature area. Consult the per-area executed observations and remaining limits in https://github.com/jpoindexter/open-play/blob/main/docs/prototype/FUNCTIONAL_REVIEW.md . The audio/module harness passed 20/20. This is a partial browser implementation, not full Serato/native/hardware acceptance. Native approval remains absent.
Models retained: Codex gpt-6.1-sol / high; Claude Code claude-sonnet-5 / medium. Recommendations only; no agent launch implied.

---
2026-10-17 — desktop0.1.3: current executed subset
Jason approved switching to the cue test. Actual native Hercules selection + master1/2/cue3/4 applied. USER-CONFIRMED: cue-only headphones play/powered RCA speakers silent; master-only speakers play/headphones silent. First speakers-off report was repeated. Native whole-stream recordings:22.32s cue-only master exactlyzero;29.88s master-only finite/nonzero. Both decks paused.0.1.1 knob navigation remains user-confirmed;0.1.3 retains mapping/enumerates MIDI, no fresh knob action claimed.
197prototypefiles match a8fe82e; fixed own-main-frame host/ASAR9/9 reviewed, original0.1.2 failure retained. Browser graph18/18, actualengine15/15; controller13/13 and Slipgraph6/6 are controlled layers. Source/records f863c05, plan51, desktop-candidate.json and runtime/audio-inspection JSON.0.1.1 preserved, default launcher0.1.3.
Full1:1 false110groups/522requirements. Fullmap/LED/jog/hot-unplug/latency/quality/otherhardware/persistence/keylock/SCNet/Video/providers remain open. Next: imported-audio restart persistence. Existing per-feature Codex/Claude model+effort recommendations retained; no full audit launch/public release or card completion.


---
2026-10-17 — current feature parity audit
Evidence category: physical-subset; FULL FEATURE PARITY UNPROVEN.
MIDI learn/export/persist parser subset; saved relative browser-knob mapping user-confirmed Electron0.1.1.
Remaining acceptance: Full edit/import/reset/undo validation and all actual map fields/controls across reconnect.
Codex gpt-6.1-sol/high; Claude Code claude-sonnet-5/medium. Recommendations only; confirm installed equivalents.
Audit: https://github.com/jpoindexter/open-play/blob/main/docs/research/CURRENT_PARITY_AUDIT_20261017.md
Current installed scope110groups/522requirements plus separate9beta deltas. Browser WIP is not physical-tested0.1.3. No completion/public-release claim.


---
2026-10-17 — current-feature parity recheck
Full parity remains false: 110 canonical groups / 522 requirements, nine separate beta deltas. Current-feature report: docs/research/CURRENT_FEATURE_MATCH_20261017.md/json; plan56 and both Claude handoffs updated. This was an evidence/UI check, not all-feature runtime acceptance. Existing model/effort recommendations remain unchanged.

New actual native0.1.5 MIDI→Target inspection has eight options, without Key Shift or Video targets; matching source dispatcher has no handlers. REL-05/current release Key Shift MIDI workflow and canonicalREQ-516 remain unaccepted. Screenshot: docs/prototype/screenshots/parity-current-midi-targets-0.1.5.png. Preserve confirmed old library-knob mapping; implement real target/dispatch/learn/save/reload and measure shifted audio on a new candidate.

---
2026-10-17 — browser Key Shift implemented; native candidate separate
Actual browser Key Shift targets1–4 now dispatch through the real app/engine/WASM. Eight initial integration checks and three after actual reload pass; five mappings restore unchanged, with eight complete stereo recordings. Independent analysis decodes all 573,120 frames and passes the original 16 channel pitch/RMS criteria. Observed tuning offsets reach +1.160701 Hz; this is not exact tuning or latency/transition acceptance.

Controlled regressions:10/10 MIDI policy and11/11 actual dispatcher/app/engine-method boundary checks. Rapid relative steps now preserve desired intent during pending stem commits; CC80/112 no longer alias14-bit CC16/48. Legacy browse mapping is retained. All failed predecessors remain.

No new native package or physical Key Shift test. Old0.1.5 bundle and engine are unchanged; Video mapping and full reference/mapping parity remain open. See docs/prototype/MIDI_KEYSHIFT_FUNCTIONAL_REVIEW.md, both independent reviews, midi-keyshift-candidate.json and plan57. Existing Codex/Claude model+effort recommendations preserved.

---
2026-10-17 — current parity and overlay matrix; subset only
Current browser:21/21 initial +5/5 actual reload; all28 overlay targets have default7-bitCC functional witnesses,29saved mappings,115whole output PNGs and2owned fixtures. Both kinds: multi-layer selection/On, opacity/scale/x/y,7animation families/named options, actual BPM/bass analysis, all3routes incl visible right, MIDI save/select/load/reimport and exact reload. Non-first text owner survives reopening image editor; green527→0 under its opacity control. Three corrected defects: stale option label, MIDI Save ignored typed name, reopen replaced another kind owner. Drafts per layer, strict metadata validation; no draft in presets.
Independent inspection:115PNGs/345masks/48predicates,29maps and16current source identities; no bounded discrepancy. Actual pointer/key smoke: defaults suppressed, Escape focus restored, Enter removes only selected mapping. All failed/weak predecessors retained. Earlier14+4core and9+3overlay keep historical candidates.
Still open: all encodings, Note/relative/14bit, hold/conflicts/errors/resource races/Reduced Motion; remaining core commands; all72Video/fullREQ-516/26manualgroups; native/physical/currentreference equivalence. No new native build;0.1.5ASAR unchanged. Full110/522 parity false;9beta+26release checks separate,0fullreleasepasses. FX/stem/keylock/services/hardware/UI gaps unchanged.
Evidence: docs/prototype/VIDEO_OVERLAY_MIDI_MATRIX_REVIEW.md; video-overlay-midi-matrix-candidate.json; overlay-matrix-final-{initial,restored}-results.json; independent matrix review. Plan60 and Claude handoff updated; full Claude audit unlaunched. Original model/effort routing remains; recommendations are not live catalog verification.

---
2026-10-17 — actual desktop0.1.6 subset; audio accuracy incomplete
New approved wrapper packagesdd068e4:222/222files,ASARf9e85d9e;0.1.5retained. Actualnative syntheticLearn/Add+KeyShift66/62 gives+2/back0 atunchanged+8%tempo. NativeREC/Save stereo originals: +2left error1.046193Hz FAILS fixed1Hz;other3channelchecks pass,causeunknown. ActualVideoopacity8318→0→8318pixels; exactrestoredROI. Cleanquit/newPID94208,3maps exportbyteidentical,3imports reportssaved/0session/noautoplay; savedmaps executeagain andVideo8318→0. Appleftpaused;defaultlauncher006/prior005preserved. No physical/all72/REQ516/reference/fullparity acceptance; oldstem/cursorfailures untouched. Plan63; docs/prototype/DESKTOP_016_FUNCTIONAL_REVIEW.md; desktop-0.1.6-candidate.json. Model/effort recommendations retained; fullClaudeaudit unlaunched.

---
2026-10-18 — plan89; desktop0.1.13core-mixing test
Packaged complete source0c2af74 in same Electron44.9.0host, ASARab7020c105ebb85d1213dbcbaea3f1961b8e1f8ecdf28b1e6f19be28eea44fe4. Actual native title/main process0.1.13; all17declared served module hashes match/no-store. Includes accumulated plans82–88inputs and FX baseline fix, not full acceptance of those features. Prior0.1.12normally quit after observed stopped;8MiB stable test profile backed up then reused. Older bundles/versioned0.1.12launcher+guide preserved. Current/Playback test launchers now0.1.13.
Actual normal native editor enumerates Hercules and explicitly installsv8; exported266single-input-bound candidate maps, allv8/physicalCompatibilityVerifiedfalse, exportSHAb73eda38004ee779b583f4ccc5966dc051221e9af2b7e1cfd28a5208e76ded5d. Explicit named Hercules4channel master1/2cue3/4, CueMix0%,CueVolume10%. Labeled SYNTHETIC bound Notech2/7on→1deck/Master0.09938293; original NoteOff0logged. Normal deck2Double→2AfterHours decks bothdisplay00:29.6/Master0.1739961. Normal controls stop both and restore AfterHours124/GlassTransit126at00:00bothstopped/Master0. No special renderer harness/injection beyond visible synthetic control.
Native meters/displayed positions are not waveform phase, physical input/socket listening, musical Sync/beatmatching or latency proof. No new hardware action while Jason away, restart/importedMP3/hotplug/pad/DSP/quality/full-map/reference acceptance. Old browser/native/physical receipts retain original scope. Next when ready: left physical Play→confirm deck/RCA sound→samebuttonstop, then core controls one at a time. No timed capture while away.
Evidence docs/prototype/desktop-0.1.13-playback-package.json + playback-observation.json; TRY_CURRENT_DESKTOP.md; plan89/current Claude handoff. Raw screenshot/AX/export and profile backup ignored local. Existing per-feature Codex/Claude model+effort routing retained, full independent audit unlaunched. Full flags/card completion/public release unchanged.


Plan99 (18Oct2026): current local desktop0.1.14/source d0949ed. Normal native Play×2/Sync/stop observes2playing, both124BPM Primary/Secondary, then0playing; faders0 throughout, so no acoustic phase/sound claim. Actual editor installs272v9Hercules maps; export byte-identical after one restart. Explicit namedHercules master1/2,cue3/4,CueMix0%,CueVolume10%,notMUTED; stopped tracks atstarts. Receipt docs/prototype/desktop-0.1.14-playback-observation.json. Prior0.1.13/profile backup retained, current launchers→14. Human away: no physical/synthetic capture. Current hardware/music/compound/full reference acceptance remains open; model routing/status unchanged.

---
2026-10-18 — plan104: actual native0.1.15 source02ddc758/ASAR7430617a,29served hashes match. Normal GUI2keylocked decks/secondarykey+2→+3, Play/Sync124→shared133.9BPM; actual REC/Save46.38s stereo finite/nonzero master602103B SHA1d94e7a4. This grades signal generation/export, not pitch/phase/acoustic/hardware/full parity.272mapping export byte-identical to14; named Hercules connected,1/2master+3/4cue reapplied; stopped/resetA/B,levels0.8,crosscenter. Current launcher15;14/versioned launcher+stable profile backup preserved. Human away; no timed capture. Next human action leftPlay→RCA sound→samebuttonstop. Evidence: docs/prototype/desktop-0.1.15-playback-{package,observation}.json; TRY_CURRENT_DESKTOP.md. All full flags remain false; original model routing/history retained.

## Plan113 — desktop0.1.16 core test candidate
Frozen source eaffc59146d40f757ea502f6ac7eb97e0d5a6404; ASAR a2925237fab3fe2f9064bacb6a62b91cf6cc4f6b02cb166534d90952907076df. Actual native Checks/Run/Download workflow: rapid GUI and synthetic MIDI Sync→Play reaches Beat Sync, six pulse pairs each max1.156/1.406ms vs10ms; second Play cancels queued start (count2→2, paused RMS4.059e-8). Whole8.28s stereo master retained. Not physical/acoustic/music/full Sync acceptance. Unique volatile diagnostic session; main272mapping export byte-identical before/after normal restart. Stable profile backup158files/8017227bytes; old15bundle/guide/launcher retained. Main16stopped, Hercules connected and master1/2+cue3/4 selected; routing resets to default stereo after restart. Human away; no timed capture. Re-entry: physical left Play→deck1/RCA sound→same-button stop, one action at a time. Full flags/list/completion/model routing unchanged. Full Claude audit unlaunched.
Review: https://github.com/jpoindexter/open-play/blob/main/docs/prototype/DESKTOP_0.1.16_REVIEW.md


## Live physical checkpoint — 18 October 2026, desktop 0.1.23
Frozen source2a334132ca1a423029fceb8aa3e39953655df525/ASARfa4b2c4629a0f313cefc619878bb333f8ae60cbb4d8ac1e5eebcef1bfa58825e. Jason confirms left and right physical Play/pause with RCA sound. Fresh right-only check: native1playing, left9.187 unchanged/right11.748. Centre-right fader sweep receivesCCch3/0+32; native rightlevel0/left0.8/rightstillrunning, Jason reports speakerssilent. Physical right headphoneCUE: Jason reports headphonesplay/speakerssilent. No socket recording or all-controls claim. Exported272maps normally; no mapping/source/package change. Earlier inconclusive fader observation retained. Pending fader return to speaker playback, then tempo/Sync/EQ/jogs/pads. Scoped receipt docs/prototype/controller-physical-20261018-results.json. Full parity/card completion false; model/effort recommendations retained.

Live continuation: right fader raised→Jason confirms RCA sound returns/deck2runs. Native screenshot shows raised level/rightCUEblue; AX range still0 is stale, not exact volume evidence. Pending rightTEMPOphysical move/BPM+speed response. No map/code/package change. Receipt controller-physical-20261018-results.json; full flags unchanged.

---

End of verbatim Trello description. Trailing source whitespace above is retained intentionally.
