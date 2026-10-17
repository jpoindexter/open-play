# DEK-007 — verbatim Trello description before plan95

Archived18October2026 to preserve the full prior evidence when the card reached its description limit. Historical approval/status statements retain their original dates; current plan/card governs current authorization. No failed evidence or model routing is discarded.

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


## DSP continuation — 16 October 2026
Signalsmith Stretch 1.3.2 MIT WASM performs actual key-preserving tempo and independent key shift in a cancellable Worker. Browser Worker 12/12 and actual engine 18/18 passed. Buffered preparation latency and music-corpus quality remain open.
Evidence: docs/prototype/DSP_FUNCTIONAL_REVIEW.md. Full parity NOT PASSED; native approval NOT GRANTED. Existing model/effort recommendations preserved.


---
2026-10-17 — functional browser checkpoint7
Source candidate d05c2d114f3cb59f469d6b4c6600f5319dbb87dc. Full1:1 NOT PASSED; native NOT approved.110groups/521requirements, complete_inventory=false.
Production retains earlier actual buffered keylock. Isolated original live-wrapper browser9/11 exposed append processor failure and future schedule ordering. Separate namespaced two-fix copy preserves original vendor/WASM; agent+parent actualWASM14/14. Corrected browser meets11 functional assertions BUTcompleted=false/fatal capture gap128→384 remains after3capture approaches. No full capture acceptance, production streaming/signedscratch/bypass/handoff or deterministic shutdown proof. New authorized Fable5.1/High bounded debug session Keylock capture gap debugging is running; not full independentaudit. Evidence/failures preserved.
Routing retained: Codex gpt-6-astra/high; ClaudeCode claude-opus-5/high; verify IDs before use. No native app before named HTML approval.
Review: https://github.com/jpoindexter/open-play/blob/main/docs/prototype/FX_TEMPO_WAVEFORM_REVIEW.md
Plan/handoff retain full scope and all failed evidence.


---
2026-10-17 — browser checkpoint8
Source candidate2bcde75719ae2f12a2d487bf5cf07ec2d1dcbcc9,217 tracked source hashes; private repository push verified through55368e5. Full1:1 remains NOT PASSED; native approval absent. Existing per-feature Codex/Claude model+effort routing above is retained as recommendations.
Actual isolated two-fix live API11/11 now completes with strict armed coverage1;64 observed processing blocks precede arm, startup gaps/old failures retained. Separate disposable variant has actual shared-context5/5, ten observed terminal retired processors/no later DSP, post-ACK candidatePCM0 with continuing440Hz control; initial ready/abort race reproduced/repaired. Raw scratch prerequisite current7/7 over13 contiguous captures includes audible-before-dispose, signed markers, paused/watchdog silence, Slip reverse/loop phase and real five-source gain routing.
Production AudioEngine/platter/keylock bypass/handoff integration remains OPEN; buffered renderer/range/resource and quality gaps remain. No heap-free or reference claim.
Reviews: https://github.com/jpoindexter/open-play/blob/main/docs/research/KEYLOCK_DISPOSAL_REVIEW.md and https://github.com/jpoindexter/open-play/blob/main/docs/research/DECK_SCRATCH_RUNTIME_EVALUATION.md

---
2026-10-17 — desktop0.1.3: current executed subset
Jason approved switching to the cue test. Actual native Hercules selection + master1/2/cue3/4 applied. USER-CONFIRMED: cue-only headphones play/powered RCA speakers silent; master-only speakers play/headphones silent. First speakers-off report was repeated. Native whole-stream recordings:22.32s cue-only master exactlyzero;29.88s master-only finite/nonzero. Both decks paused.0.1.1 knob navigation remains user-confirmed;0.1.3 retains mapping/enumerates MIDI, no fresh knob action claimed.
197prototypefiles match a8fe82e; fixed own-main-frame host/ASAR9/9 reviewed, original0.1.2 failure retained. Browser graph18/18, actualengine15/15; controller13/13 and Slipgraph6/6 are controlled layers. Source/records f863c05, plan51, desktop-candidate.json and runtime/audio-inspection JSON.0.1.1 preserved, default launcher0.1.3.
Full1:1 false110groups/522requirements. Fullmap/LED/jog/hot-unplug/latency/quality/otherhardware/persistence/keylock/SCNet/Video/providers remain open. Next: imported-audio restart persistence. Existing per-feature Codex/Claude model+effort recommendations retained; no full audit launch/public release or card completion.


---
2026-10-17 — current feature parity audit
Evidence category: subset; FULL FEATURE PARITY UNPROVEN.
Real Signalsmith WASM with buffered and bounded-live implementations; separate source/routed/retained scratch evidence.
Remaining acceptance: Latest current-source continuous handoff, earliest cursor, reverse/loop/Stem Slip composition, music/quality/resource/native reference parity not proven.
Codex gpt-6-astra/high; Claude Code claude-opus-5/high. Recommendations only; confirm installed equivalents.
Audit: https://github.com/jpoindexter/open-play/blob/main/docs/research/CURRENT_PARITY_AUDIT_20261017.md
Current installed scope110groups/522requirements plus separate9beta deltas. Browser WIP is not physical-tested0.1.3. No completion/public-release claim.


---
2026-10-17 — native keylock and scratch evidence
Plan54: actual desktop0.1.5 main UI imported owned330/550Hz WAV, tempo+8%, keylock ON/OFF/ON, backward keyboard scratch/release, nativeREC/Save. Entire59.64s recording inspected; sustained locked330/550 and unlocked356.4/594 within declared1.5Hz, transitions/silence retained. Separate+2semitone stationary Space1200ms hold recorded30.72s; shifted370.412/617.354Hz before/after, intentional quiet1207ms. Independent whole-original decode confirms all91windows/PCM hashes/quiet runs. Wall UI and WebM lack exact release sample: no native main-UI20ms/cursor claim.
Separate packaged real production-engine/WASM harness actually executed inside Electron44100Hz:7/7,0fatal,4strict armed stereo spans coverage1; initial preflight gap retained. Shifted stationary+12/rate1.08 case passes existing pitch/gap criteria. Repeating tones do not prove earliest audible cursor; five-source history check does not grade seamless five-source transitions. Entire armed stereo buffers not exported by legacy harness; release PCM retained. Old IAB3/7 and2/7 invalid captures remain failures, not repaired.
No app source, permission, dependency or old bundle changed. Actual normal main UI restored,0decks/Master0,DevTools closed. Next: nonperiodic audible-cursor calibration+production-engine return matrix with complete stereo PCM/producer rows; reverse/loop/Stem Slip/music/reference/full hardware remain open. Full110groups/522requirements plus9beta deltas remain unverified. Cards stay open; existing Codex/Claude model+effort recommendations retained.
https://github.com/jpoindexter/open-play/blob/main/docs/prototype/DESKTOP_KEYLOCK_REVIEW.md

---
2026-10-17 — cursor matrix failed; complete evidence retained
Plan55: separate officialElectron44.9 source diagnostic (not packagedproduct) executed10actualengine return cases/44100Hz, +12/rate1.08, calibrated nonperiodicmarker+307Hzstereocontrol. Entire985984frames/15775744B four-channel raw finite and preserved with alloriginalproducerrows/fences/source hashes. Three timestamp duplicate/skip pairs cause6armederrors; completed=false/allCriteriaPassed=false,0acceptedcases. Actualrun blocks calibration/case acceptance; no timestamps/PCM repaired or trimmed. Diagnostic quit exits0/port18769closed, existing0.1.5 product/200originalprototypefiles unchanged.
Independent originalcontrol analysis: all3suspect pairs retain continuous307Hzphase, prediction RMSerror5.76e-8–9.16e-8 versus .036–.040 for±128sample alternatives. This is timestamp/control-audio disagreement only; cause/deckcontinuity/cursor unknown.
Independent exploratory contiguous-interval check reproduces all11original800ms intervals, everyacceptanceflag remainsfalse. Five of30caseprobes have insufficient.04uniqueness; backward/same distantalias is not a proven7secondjump. Keep10ms/.8/.04/20ms budgets. Next: independently scheduledAudioParamclock observation alongside originaltimestamps/PCM/control; improve ambiguousmarker information/calibration before any production scheduling change. No identical rerun hoping forgreen.
All110groups/522requirements plus9separatebeta deltas remainopen. Earlier boundednative7/7 and hardware/persistence subsets keep originalscope. ExistingCodex/Claude model+effort recommendations retained; card remainsopen/incomplete.
https://github.com/jpoindexter/open-play/blob/main/docs/prototype/ENGINE_CURSOR_NATIVE_RESULT.md

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
2026-10-17 — scheduled render-clock diagnostic; five of ten only
Separate official Electron44.9.0 host runs unchanged production AudioEngine/WASM. NEW valid full clock capture+calibration:5/10bounded cursor cases;5remain unaccepted due to7nonunique marker probes. All11pitch/gap/control intervals pass;26confident probes incl calibration within10ms;0confidentwrong. Whole985728frames×4PCM+985728actualAudioParamvalues/7701rows independently inspected; max clock/step residual.0625 within predeclared.25sample Float32budget. This is not physical timing precision or common-mode exclusion.
Old invalid matrix remains0accepted, originalraw189c5708/report98f01475 unchanged; cause stillunknown. No production scheduling/DSP/nativebundle modification. Actual native diagnosticRun+Save dialogs executed once; full originalJSON/raw retained, no trimming/repair. Sourcecohort12runtime+11prerun unchanged; host/port cleaned up.
Evidence: docs/research/ENGINE_RENDER_CLOCK_NATIVE_EVIDENCE_REVIEW.md; docs/prototype/render-clock-native-candidate.json; rawinitial and nativeobservation JSON. Plan61/current audits/Claude handoff updated. Next: improve markerinformation/calibration without relaxing.8/.04/10ms/30ms/20ms gates; no identical rerun hoping forgreen. Mainapp native mapping/currentbrowser transfer, music/compound/reverse/loop/StemSlip/hardware/reference and full110/522parity remain open. Models unchanged: Codexgpt-6-astra/high; Claudeclaude-opus-5/high (recommendations, not live catalog verification).

---
2026-10-17 — new32ms marker; native full capture rejected
Plan62: separate owned32ms marker, same seed/carriers/global search/fixed gates. Finite idealgrid1872/1872 vs old1511/1872;42 rejectioncases; independent confirmations. Actual single nativeRun:7695rows/984960frames; one global label repeats/skip pair,128 parameter/global mismatches. Params/control continue; cause unknown. Fullcapture FAILED; calibration not analysed;0/10accepted; completed=false. OriginalJSON6430e621/raw79bb0d99 preserved. Conditional prefix calibration-shaped+9case excerpts:30 confident numerical fits, all acceptanceflagsfalse; lastcaseexcluded. A400ms fit can hidewrongfirst15ms. No engine/package change; old0accepted and priorvalid73ms5/10 unchanged. Evidence: docs/research/CURSOR32_NATIVE_EVIDENCE_REVIEW_20261017.md; docs/prototype/cursor32-native-candidate.json. Next: preserve0.1.5, separately package approved currentbrowser controls and execute main-app MIDI/reload/audio; no identicalclockrerun. Fullparity110/522/currentinventory incomplete;9beta/26release separate. Models retained: Codexgpt-6-astra/high; Claudeclaude-opus-5/high (recommendations, not livecatalog verification).

---
2026-10-17 — plan78; shared original+stem processor
Browser adapter now carries original+four stereo stems through one ten-channel Signalsmith group/map/window, split to five outputs. Vendor/WASM/SRC/gain policy unchanged. One actual app12.66s stereo recording: known550Hz pair cancellation≤.00603% of330Hz over120/150/90 sections vs1% limit; Bass/original leak≤.00807%; Melody pad exposes550/330≈1.333; final mute nearzero. First completed focused run passes; no broad matrix or new ML inference. docs/prototype/stem-coherence-browser-results.json.
Not model/music/transition/cursor/allrates/shifts/channel layouts/FX/cue/scratch/loop/reverse/StemSlip/refill/race/native/hardware/reference acceptance. Earlier76 warp subset archived in docs/delivery/warp-keylock-section76.md. Old0110 R3 app unchanged. Next optional current-source desktop test under prior approval; preserve old apps/default. Plan78/fullhandoff updated;110/522,9beta+26release separate,0fullpasses; fullClaudeaudit unlaunched. Codexgpt-6-astra/high; Claudeclaude-opus-5/high recommendations retained. Pragmatic testing throughout; no completion.
