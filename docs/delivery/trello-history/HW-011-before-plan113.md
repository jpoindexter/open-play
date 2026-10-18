# HW-011 description before plan113

Captured 18October2026. Complete previous description preserved verbatim below; historical evidence is not current hardware/full-parity acceptance.

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



## Preserved checkpoint history
Plans80–86 and the entire pre-plan87description are preserved verbatim in [HW-011 history](https://github.com/jpoindexter/open-play/blob/main/docs/delivery/trello-history/HW-011-before-plan87.md). They remain historical scoped evidence; native0.1.12 and old physical0.1.1/0.1.3 results are not acceptance of newer browser source.


---
2026-10-18 — plan87; Manual Loop/Scratch Bank inputs
Actual manual engine setLoop/seek shared by UI IN/OUT/Save and7documented pad functions. Active IN/OUT toggles boundary edit; relative jog1ms/tick adjusts original-source bounds without tempo changes (independent curve, unmeasured hardware). Toggle/reloop/selected-slot save/prev/next, visible/ARIA edit states; no invented pad8. Scratch panel/MIDI share snapshot slot/cue/repeat/keylock load onto addressed deck; Shift assigned pad restores previous source position. Slot settings apply only to accepted/current/decode-success load, closing old playing-lock rejection mutation path.
Actual editor/SYNTHETIC first-run workflow passed:1–2s manual loop becomes1.025–1.95s, nominal rate1, localStorage slot1/2 metadata observed, next/previous/reloop. Eighth Scratch slot assigned through UI; deck1loads cue2s/Repeattrue/Keylockfalse while right continues. Recorded400→800→800→400Hz left/550Hz right, including unchanged voice/settings after locked load rejection and Shift previous exact source-position restoration. Full finite1.62s stereo master26323B, SHA b190d4da1e79211b323c44149f2a92f79fe189c23cffdbfb73d875714e56fe0a; errors<0.011Hz,8hashes stable. Policy collaborators passed; no unrelated test/reviewer matrix.
v7has258candidate bindings. Manual0x60–0x66 and missing Scratch0x77/0x7D inferred/absent XML, earlier hypotheses retained; no physical/default-map proof. Native0.1.12/profile/launchers unchanged, Jason away/no capture. Boundary keyboard/DVS/quantized reloop, full slot/bank/persistence/playing-load/keylock/cold/error/compound/music-quality/reference acceptance remains open.
Evidence: docs/prototype/midi-manual-scratch-browser-results.json + policy; semantics note, plan87/Claude handoff. Existing Codex/Claude model+effort routing retained; full audit unlaunched. No full flags/card completion/public release.


---
2026-10-18 — plan88; everyday controller actions/actual Double/FX baseline
Browser focus routes encoder to actual visible crates or filtered tracks; Shift browse10rows/tick, Prepare add persists selected ID and Shift opens actual panel. FX slot1 next/absolute-relative selection reaches processors; selection disables/reset params like UI. Fixed physical ON explicitly4beats regardless Beat Jump pad setting. Instant Double shared helper replaces old paused settings-copy action: accepted source-file load, transport/rate copy, future-clock playing start/paused seek; MIDI second Load within450ms. Same-file on-load preference delegates with recursion guard. Threshold/list order/source-play mirroring are independent policies; full reference edges open.
Actual app/SYNTHETIC workflow on fresh no-store origin passed: focus/crate/fast browse/Prepare row+storage; Loop1–3s at120BPM despite Beat Jump on; Double playing positions both1.431179138s, recorded330Hz amplitude ratio2.002193; enabled selected Delay yields actual330.209Hz tailRMS0.0112466 after pause. Finite1.68s stereo master27289B SHA4e5f04e00ef048cdc8d333590d1c7750f769c8cd749da03c6463b7b890fb2983;11hashes match saved source. No hardware/native/music-quality/full-FX/Double acceptance.
Real bug fixed: app-mutated slot aliased constructor on/name baseline, leaving bypass/wrong identity; constructors now snapshot spec/params. Targeted factory regression failed before/passed after. Earlier future-onset measurement and cached-old-module failures retained; source hash caught old5994b6a versus saved0185d8a, fresh no-store candidate passed. Use existing no-store serve_prototype.py or immutable host, not cacheable ad-hoc server/reload. No unrelated DSP/model/reviewer matrix.
v8has266candidate assignments; Shift-Assistant0x93note3 and Shift-depth0xB4/0xB5CC6 inferred/absent XML. All earlier hypotheses retained. Native0.1.12/profile/launchers unchanged; Jason away/no capture. Full controller/FX/Double/sampler/4deck/concurrency/compound/reference checks open; next approved immutable native test package for hands-on core mixing.
Evidence: docs/prototype/midi-everyday-browser-results.json + recovery/policy/factory receipts; plan88/current Claude handoff/semantics ledger. Existing model+effort routing retained, full Claude audit unlaunched. No full flags/card completion/public release.


---
2026-10-18 — plan89; desktop0.1.13core-mixing test
Packaged complete source0c2af74 in same Electron44.9.0host, ASARab7020c105ebb85d1213dbcbaea3f1961b8e1f8ecdf28b1e6f19be28eea44fe4. Actual native title/main process0.1.13; all17declared served module hashes match/no-store. Includes accumulated plans82–88inputs and FX baseline fix, not full acceptance of those features. Prior0.1.12normally quit after observed stopped;8MiB stable test profile backed up then reused. Older bundles/versioned0.1.12launcher+guide preserved. Current/Playback test launchers now0.1.13.
Actual normal native editor enumerates Hercules and explicitly installsv8; exported266single-input-bound candidate maps, allv8/physicalCompatibilityVerifiedfalse, exportSHAb73eda38004ee779b583f4ccc5966dc051221e9af2b7e1cfd28a5208e76ded5d. Explicit named Hercules4channel master1/2cue3/4, CueMix0%,CueVolume10%. Labeled SYNTHETIC bound Notech2/7on→1deck/Master0.09938293; original NoteOff0logged. Normal deck2Double→2AfterHours decks bothdisplay00:29.6/Master0.1739961. Normal controls stop both and restore AfterHours124/GlassTransit126at00:00bothstopped/Master0. No special renderer harness/injection beyond visible synthetic control.
Native meters/displayed positions are not waveform phase, physical input/socket listening, musical Sync/beatmatching or latency proof. No new hardware action while Jason away, restart/importedMP3/hotplug/pad/DSP/quality/full-map/reference acceptance. Old browser/native/physical receipts retain original scope. Next when ready: left physical Play→confirm deck/RCA sound→samebuttonstop, then core controls one at a time. No timed capture while away.
Evidence docs/prototype/desktop-0.1.13-playback-package.json + playback-observation.json; TRY_CURRENT_DESKTOP.md; plan89/current Claude handoff. Raw screenshot/AX/export and profile backup ignored local. Existing per-feature Codex/Claude model+effort routing retained, full independent audit unlaunched. Full flags/card completion/public release unchanged.


---
2026-10-18 — plan90; Shift fader/tempo/Tap software actions
Shift fader target controls actual level and temp-cue transport: paused zero sets cue, zero→positive starts cue, positive→zero back-cues/pauses; early lower invalidates pending start. Tempo-ignore accepts shifted14bit motion without rate change and arms ordinary-fader pickup even if that fader was previously caught. Deck Tap reuses independent bounded interval/octave estimator then compensates audible rate, writes manual BPM/revision/metadata through grid hooks, refuses locked grids and leaves PFL alone. Full on-screen Tapper Space/Esc/Enter and exact reference estimator/edge semantics remain open.
Actual no-store app editor/SYNTHETIC first-run workflow passed: immediate fader raise/lower leaves no left voice, raise plays1s temporary cue at440Hz/level100of127, lower pauses/returns1s; right550Hz continues. Ignored and first normal tempo movement keep rate1, then center crossing permits1.02000244/right560.998Hz. Taps7500.6/7901.2/8710.1ms (final doubled interval) write compensated146.14BPM, persisted manual metadata/PFLfalse/right560.999Hz unchanged; locked final tap refuses. Complete finite2.879977s stereo master46673B SHAe6c6358ba867928a010d77d3a871f1cf85af834f0de803e44e31bd6fc7b7db73;8hashes match source. Scoped policy passed; no unrelated test/reviewer matrix.
v9contains272candidate assignments. All6new shifted assignments inferred/absent inspected XML: CC0ch5/6fader,pairedCC8/40ch5/6ignore,Note12ch5/6Tap. Not physical/default-map proof. Native0.1.13/source0c2af74/v8/266maps stays stopped and unchanged for Jason’s core Play/mixer/cue/Sync test. No timed capture while away.
Open: actual Shift data/preferences/calibration, ordinary-vs-shift/cold/concurrent/disconnect/compound transport, relative/pickup edges, full Tapper GUI/metadata/grid/Smart Sync and estimator quality/reference behavior. Approval wording/export flag corrected to reflect granted local native approval only; fullParityVerifiedfalse.
Evidence docs/prototype/midi-shift-controls-browser-results.json + policy; semantics ledger/plan90/current Claude handoff. Existing per-feature Codex/Claude model+effort recommendations retained, full audit unlaunched. No full flags/card completion/public release.


Plan99 (18Oct2026): current local desktop0.1.14/source d0949ed. Normal native Play×2/Sync/stop observes2playing, both124BPM Primary/Secondary, then0playing; faders0 throughout, so no acoustic phase/sound claim. Actual editor installs272v9Hercules maps; export byte-identical after one restart. Explicit namedHercules master1/2,cue3/4,CueMix0%,CueVolume10%,notMUTED; stopped tracks atstarts. Receipt docs/prototype/desktop-0.1.14-playback-observation.json. Prior0.1.13/profile backup retained, current launchers→14. Human away: no physical/synthetic capture. Current hardware/music/compound/full reference acceptance remains open; model routing/status unchanged.

---
2026-10-18 — plan104: actual native0.1.15 source02ddc758/ASAR7430617a,29served hashes match. Normal GUI2keylocked decks/secondarykey+2→+3, Play/Sync124→shared133.9BPM; actual REC/Save46.38s stereo finite/nonzero master602103B SHA1d94e7a4. This grades signal generation/export, not pitch/phase/acoustic/hardware/full parity.272mapping export byte-identical to14; named Hercules connected,1/2master+3/4cue reapplied; stopped/resetA/B,levels0.8,crosscenter. Current launcher15;14/versioned launcher+stable profile backup preserved. Human away; no timed capture. Next human action leftPlay→RCA sound→samebuttonstop. Evidence: docs/prototype/desktop-0.1.15-playback-{package,observation}.json; TRY_CURRENT_DESKTOP.md. All full flags remain false; original model routing/history retained.

## Plan112 — rapid Smart Sync→Play input ordering (18Oct2026)
Actual GUI and MIDI bursts previously entered TempoSync, with pulse offsets92.154/206.145ms (>10ms). Sync/Play/Play still started and counted two extra plays; recorded right RMS0.0142389 failed paused0.0001.

Smart Sync now awaits its pending press and validates owner/track/transport token before alignment. One app-level Play intent can be canceled by a second Play; load/eject clear it, and only its successful current start records history. Play exposes busy feedback. No DSP, controller address or artificial delay changed.

Final actual GUI/MIDI bursts both reach BeatSync/rate1.2, one counted start each, six audible pulse pairs each max1.270/1.338ms at unchanged10ms/min5pair gates. Sync/Play/Play remains stopped/unqueued at600ms, count2→2, recorded350–550ms right RMS1.98214e-8<0.0001. Whole8.159977s stereo131969bytes SHA32a967086f734517a234da5854f5924588f8ddfef3690bd87e6f5cd17772d4c6; finite complete decode;6stable source hashes. Focused controlled cancellation/track/token/failure contract executed. Before evidence retained. See docs/prototype/RAPID_SYNC_PLAY_REVIEW.md and rapid-sync-play-{before,browser}-results.json.

Flat-grid/keylocked-secondary synthetic fixture only; no full-map/native/physical/compound/reference acceptance. Native15/profile/launchers unchanged; fresh approved local desktop package is next. Human away/no capture. Full110/522 flags and model+effort routing preserved; full Claude audit unlaunched.
