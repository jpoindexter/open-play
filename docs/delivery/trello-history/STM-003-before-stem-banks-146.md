## Current checkpoint145 — 18 October2026
Actual browser Play→Prepare via real completed SCNet cache/local API→same live processor→immediate Vocal pad→four-pad mute/restore→Stop passed the existing rate1.1/keylock criterion. Fixed10-channel geometry; original PCM, voice/group and clock retained. Transfer acknowledgment alone was insufficient: first app run failed at0.02397/0.02648RMS ratio. Preparation now remains pending through queried latency plus2render quanta before Ready, with owner checks and finite timeout; no deferred first-pad transfer, gain compensation or relaxed guard. Initial failure/source capsule retained.

Corrected stereo4s:176400frames/channel,1379contiguous quanta, min10msRMS0.9736433371/0.9909125301>=0.85, jumps0.0092541762/0.0155332007<=0.03, nearzero0, clockdifference0. First-pad gains[0,0,1,1,1] prove the original bypass was deselected; all-muted/Stop exactzero, restore nonzero. Original decoded hashes unchanged; source stable. Separate real-browser12channel RPC capture and3new actual-WASM/3controlled engine ownership checks passed. Completed cache, not new inference/music-quality/native/hardware proof. No unrelated fullFX retest.

Review: https://github.com/jpoindexter/open-play/blob/main/docs/prototype/STEM_ACTIVATION_INPLACE_145_REVIEW.md
Receipts: stem-activation-inplace-145-{initial-,}results.json and keylock-channel-replace-145-results.json.
Next: warm-up cancellation, nonzero-origin refill/drop, SRC/key shifts and repeat-preparation rollback when selected Stem channels are already audible. Musical quality, other transports/resources/physical/reference remain open. All full-parity flags false. Native0.1.23/tested272map profile unchanged; no captures/output/repackage. Original model/effort routing and acceptance below remain required; fullClaudeaudit unlaunched. Earlier checkpoint notes below are historical.

## Outcome and acceptance
Stem cache/cancel/fallback
Cancel or fail inference and continue playback; invalidate incompatible model caches.

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
Primary Codex: gpt-6.1-sol; reasoning xhigh.
Claude Code alternative/reviewer: claude-opus-5; effort high.
Reason: Architecture and persistence require reasoning across failure and concurrency boundaries.
Escalation: After two materially different failed approaches: obtain missing evidence, then escalate one effort/model tier; never substitute reasoning for a hardware test
Review: Fresh evidence review; Claude is an optional alternative, not automatically invoked.
Source: host Codex catalog; https://code.claude.com/docs/en/model-config and installed CLI 2.1.222. Account invocation untested. Cost unknown; measure usage. Recommendations do not authorize an agent launch.

## Actual status
Local desktop testing authorized. Scoped implementation/evidence exists; full native and reference acceptance remains unverified. Current feature-specific audit below governs older checkpoint prose.

Plan: https://github.com/jpoindexter/open-play/blob/main/FULL_BUILD_PLAN.md
Feature ID: STM-003.

## Exact source crosswalk — 2026-10-16
- [Stems Overview](https://support.serato.com/hc/en-us/articles/5700968326927-Stems-Overview)
- [Preparing tracks for use with Stems](https://support.serato.com/hc/en-us/articles/5700969287183-Preparing-tracks-for-use-with-Stems)

Source assignment verified; semantic control/state review and installed-version reconciliation remain open. This is not a parity pass.
Crosswalk: https://github.com/jpoindexter/open-play/blob/main/docs/research/MANUAL_FEATURE_CROSSWALK.md


## DSP continuation — 16 October 2026
Matching preparation requests share one job/promise/progress stream; 12 adapter checks passed with mocked network/decode. Actual main UI first-action/load preparation, cancellation feedback and retry with two pending pad actions were executed with the SCNet service. Activation has an explicit cancellation guard. Disk cache indexing/crash recovery and long-file acceptance remain open.
Evidence: docs/prototype/DSP_FUNCTIONAL_REVIEW.md. Full parity NOT PASSED; native approval NOT GRANTED. Existing model/effort recommendations preserved.


---
2026-10-17 — functional browser checkpoint7
Source candidate d05c2d114f3cb59f469d6b4c6600f5319dbb87dc. Full1:1 NOT PASSED; native NOT approved.110groups/521requirements, complete_inventory=false.
REQ183 ordinary-mute source waveforms: signed surviving stereo PCM sum, phase cancellation/right-only, originalmix all-on route, no phantom endpadding; overview/detail share actual painters. Actual9/9 Engine/audio/pixel; real localSCNet1/1; fullUI import/preparation/allmute/Vocal/restore execute. Independent stereo-original/end-padding fixes and12/12 controlled checks. Profiles yield, cancel and retain4masks; this is not a full memory/frame-rate proof. Captured exit tails/StemSlipdual clocks/frequencycolor styling and musical/referencequality remainopen; priorSCNet3.025%>3% reconstruction failure is retained.
Routing retained: Codex gpt-6.1-sol/xhigh; ClaudeCode claude-opus-5/high; validate actual supported IDs before use. Recommendations are not executions.
Review: https://github.com/jpoindexter/open-play/blob/main/docs/prototype/FX_TEMPO_WAVEFORM_REVIEW.md
Plan/handoff retain full scope and all failed evidence.


---
2026-10-17 — current feature parity audit
Evidence category: subset; FULL FEATURE PARITY UNPROVEN.
Model/content parameter cache, cancel/retry/coalescing/failure-fallback UI subset.
Remaining acceptance: Crash/relaunch/long-file/model-change invalidation, resource/performance and full failure matrix.
Codex gpt-6.1-sol/xhigh; Claude Code claude-opus-5/high. Recommendations only; confirm installed equivalents.
Audit: https://github.com/jpoindexter/open-play/blob/main/docs/research/CURRENT_PARITY_AUDIT_20261017.md
Current installed scope110groups/522requirements plus separate9beta deltas. Browser WIP is not physical-tested0.1.3. No completion/public-release claim.


## Plan116 — restart-safe completed cache; quality experiment rejected
Completed service jobs now save atomic path-free receipts. Startup/reuse validates canonical complete manifest and four fixed export hashes; linked/malformed/unfinished records are ignored, changed caches create a new owner and retain evidence. No legacy guessing/interrupted-job resumption. Actual SCNet HTTP job→normal process restart→same completed ID/4identical downloads/status/log/manifest; focused file/fresh-interpreter checks and existing service lifecycle10/10. Updated idle normal8768service PID23214/session1199; existing18775desktop proxy reuses the restored job without worker rerun. Native16/interface/profile untouched; API proof is not native GUI/audio/physical/quality acceptance.
Fixed0/.25/.5s SCNet averaging failed predeclared development guards on2already-seen CC previews (mean−0.214894/+0.162219dB; source regressions). Reject promotion; model/default/oldqualityfailures unchanged. No broad audio matrix repeated. Full flags/model routing unchanged, full Claude audit unlaunched; human away/no timed capture.
Reviews: https://github.com/jpoindexter/open-play/blob/main/docs/prototype/STEM_JOB_CACHE_REVIEW.md and STEM_SHIFT_DEVELOPMENT_REVIEW.md.


## Plan117 — actual cache Trash/regeneration and full-mix restore
Preparation dialog now moves only its canonical generated job to native system Trash, retaining original/loaded playback; job association persisted/cleared and same-track prepare blocked while moving. Active/live/noncanonical jobs refused; failure retains files/state, repeat clear idempotent. Send2Trash1.8.3 already installed; no Trash emptying.
Fix: Restore full mix formerly removed buffers while leaving selected Stem Slip armed. It now disarms/reset masks/FX/cache before resuming previously playing matching decks. Actual UI real SCNet twice on owned8s tones: first cache folder observed in OS Trash with4matching export hashes; same playing split voice/buffers/clock retained, original PCM unchanged, full original loop restores, new job regenerates. Whole10.80s master/fourfixed windows max0.006092Hz;7stable hashes. Focused contracts, adapter12/12, new403guards; no broad green matrix repeat.
Current8768PID25079/session8983; desktop18775proxy serves regenerated job/new route. Native16unchanged. Crate/keyboard/icons/readiness, Finder recovery, music/compound/native/physical/reference remain open; full flags/routing unchanged, full Claude audit unlaunched. Human away/no timed capture.
Review: https://github.com/jpoindexter/open-play/blob/main/docs/prototype/STEM_CLEAR_REVIEW.md


## Plan118 — persistent Stems crate/readiness/removal
Explicit membership survives reload and is separate from decoded buffers. Drop/manual preparation joins crate; new on-demand preparation stays separate, legacy saved refs migrate. Service-verified completed/duration/four-source state plus export-hash validation drives accessible ready/pending/unavailable markers without dropping row focus. Command/Ctrl+Delete/Backspace is scoped to the Stems library and retains original File/loaded audio; unfinished jobs cancel, committing activation finishes before removal, missing-cache messages do not claim a Trash move.
Actual owned File-input/drop→SCNet while unloaded→ready→reload: saved crate ready before decoding, cached prep reuses same job. Actual CUA Command+Backspace removes generated cache/entry while same voice/buffers play. Second reload retains removal and original File hash;4Trash export hashes/timing unchanged. Whole16.68s master/twofixed windows max0.003176Hz;8stable hashes. Focused ownership/cache contracts+adapter12/12; no broad matrices. Main27522/session82214, native16unchanged; future manifest needs stem-crate.js. Batch/context/native-picker/pointer drag/compound/music/device/reference gaps remain open; flags/routing unchanged, full Claude audit unlaunched. Human away/no timed capture.
Review: https://github.com/jpoindexter/open-play/blob/main/docs/prototype/STEM_CRATE_REVIEW.md


Plan137 ·18Oct2026: Prepared Stems attached during ordinary loop caused441nearzero samples/10ms both channels, jumps.1214/.1666, clocklag10ms. New ordinary-forward activation keeps old voices until future-time group readiness/arming, then retires them; rollback/Stop ownership retained. Actual production API/download/decode uses existing real SCNet-large completed cache for owned8sec330/550Hz stereo, not new inference/music-quality proof.12s/channel before/after rawPCM; corrected loop longestnearzero one sample, min10msRMS.9772/1.0>=.85, jumps.00914/.01524<.03, clocklag0/unchanged phase. Actual rate1.1/keylock forward4s capture FAILS sameRMSfloor at.6454/.8148 despite nozero gap/clocklag; phasechanges157.02/−62.09degrees support priming/phase hypothesis. Failure retained, no gain compensation/gate relaxation. Actual4pads muted→zero/restored→nonzero/Stop→zero; original decodedhashes unchanged.4controlled real-attach/coordinator readiness/cache rollback/Stop cases pass; not WASM-fault or two-deck acoustic proof. Normal afterDownloads byte-identical; sixcurrent production hashes plus executed diagnostic capsules match. Source2548d03; https://github.com/jpoindexter/open-play/blob/main/docs/prototype/STEM_ACTIVATION_REVIEW.md . Next: exact old/new live pitch group origin/schedule/seek-history phase; preserve failure. Gesture/reverse/processing/warp/transformed-loop/music/source-leakage/resources/native/physical/fullparity remain open. Native23/ASAR/profile272maps/launchers unchanged/stoppedMaster−12; main8768preserved, own18878closed; humanaway/no timedcaptures. Fullflags/model-effort routing unchanged; fullClaudeaudit unlaunched.

## Phase review — 18 October 2026
Actual unchanged WASM: later2-channel startup and same-start10-channel layout alter original phase; duplicate same-start controls are byte-identical. Independent absolute-audio-time fit of retained browser PCM retains157.01939/−62.08805degrees and amplitude ratios1.000311/1.000173; existing analysis axis was correct. Bounded authorized Fable review proposes deferring original processor transfer to first partial Stem-pad action, explicitly retaining a once-only dip: NOT accepted as closing continuity. No production fix, threshold relaxation or new native package. See docs/prototype/STEM_ACTIVATION_PHASE_REVIEW.md, stem-activation-{phase-isolation,phase-repeatability,absolute-phase}-results.json and docs/research/claude-fable/stem-activation-phase-20261018.md. Physical controller test remains priority; full audit unlaunched/full parity false. Existing model-effort routing preserved.

## Same-instance input experiment — checkpoint139
Bounded serial experiment retained one10-channel production-WASM instance; replaced only8silentStem inputs with actualcachedata. Tone10msRMS continuity ratios0.97460/0.99972, jumps0.005689/0.009420, no nearzero runs. Original output changes slightly after attach, not byteidentical. This is input-array mutation in a serial stub, not a browser atomic-replacement API, actual production engine/pad/transport result or accepted fix. First-pad deferred transfer remains rejected as moving the dip. Browser integration/music/transformed-loop/gesture/native acceptance remain open.
Receipt: https://github.com/jpoindexter/open-play/blob/main/docs/prototype/stem-activation-inplace-138-results.json
Current priority while Jason away: official controller-map extraction and source-labeled bulk import. Preserve current Stems behavior/failures and native23; full acceptance false. Existing per-feature model/effort recommendations remain.
