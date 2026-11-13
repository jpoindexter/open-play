# Active four-deck analysis and Sync ownership — 24 October 2026

Core DJ reliability. All layouts, custom controls and decoded library waveform previews remain. Original music, normal profile and recordings are preserved; unattended diagnostic audio is physically muted. Work spans23–24October in Europe/Madrid; raw evidence folder uses its initial23October date.

## Outcome / now / next / later

Outcome: mix four real tracks while background analysis keeps the controls in use attached, and overlapping transport requests retain one current owner. Now: verify the in-place analysis refresh and two reproduced Sync cancellation races. Next: measure residual cold completion/structural/unattributed stalls and retain the next actual pop before further audio changes. Later: existing advanced/layout/keyboard/manual-site/modularization cards remain queued. No broad redesign or DSP rewrite.

Done for each software defect means an observed failing reproduction, the same actual path after repair, meaningful regressions, retained controls/previews/source integrity and Trello readback. Source-grid/PCM telemetry does not establish musical tightness, absence of audible pops or physical hardware acceptance. Full core completion remains gated by listening and hardware work.

## Reproductions and targeted repairs

### Analyzed controls replaced during use

A native-worker browser run on0.1.48/source79b0c5b failed `Analysis replaced or changed the focused measured tempo control` after its first loaded result, then stopped safely. The old completion called `renderDecks(index)` and replaced the target article. This is already tracked under DEK-008 and CORE-FIX-07; no duplicate card was created.

The repair updates existing key/title/ARIA and key-Sync state through a21-line helper, preserves Smart Sync reconciliation, and reuses existing frame/gain refreshes. It does not replace control nodes or write active input values. A scoped repaint of the completed track's existing overview keeps BPM/scope/warp overlays current while later jobs continue; a queued-job regression failed before that repaint. Focused tests cover current/duplicate/hidden/replaced identity, manual shifts, unknown keys and active-control identity. The matched three-rotation probe preserves all256retained nodes through each of three actual Worker jobs, including two focused loaded-deck tempo values. The final current-source15rotation run passes8actual jobs with all256retained nodes attached,3loaded focused tempo values retained and5unloaded results. A retained-pointer unit fixture is controlled evidence; actual physical held-pointer release is not claimed.

### Overlapping Sync cancellation corrupts the newer rate

New [CORE-FIX-08](https://trello.com/c/GWdwrMCD) tracks a distinct ownership defect. Actual `createSmartSync.press` through `AudioEngine.synchronize/start` with controlled clock/graph endpoints showed double/triple equal-target requests rejecting the latest while committed audio ran1.05× and nominal controls returned1.0×. A real-control eight-track browser run also timed out waiting for the newest rapid request to engage, then stopped safely; its event-aligned output is retained privately. DOM clicks are diagnostic/untrusted, not human pointer acceptance.

A second controlled reproduction showed Sync followed by Reverse letting the stale catch roll back the newer reverse voice. The guard reuses `rateOwners` and start tokens: completion and rollback require current ownership; explicit Stop can still roll back an uncommitted rate only when fully stopped with no current/pending voice. Six ownership regressions and22deadline/primary tests pass. This repairs reproduced request-state corruption; it does not identify the user's intermittent audible-pop cause.

### Remaining preparation stalls

Retained0.1.48 data nominates nine decode-attributed long-frame scripts: three unloaded Analyze jobs and six cold Loads. Attribution to an `await decodeAudioData` continuation is not decoder CPU proof. Private, equally instrumented copies measure full-channel analysis staging and first source-waveform profile work without changing their algorithms. The matched three-rotation probes use the same new eight-track cohort and equally instrumented preparation copies. Full-channel copy CPU is11.6/17.3/12.2ms before. After bounded1MiB copyFromChannel staging, initial synchronous returns are1.3/0.2/0.8ms; max individual copy calls0.3/2.1/0.3ms; total copy CPU16.1/32.5/16.9ms (yielded waiting excluded). Total work is not reduced. Whole-channel allocation still exists; observed maxima0.6/0.1/0.4ms do not bound GC or future allocation tails. Source-waveform hooks are unchanged. No retained source channel view crosses a yield; cancellation creates no Worker until staging finishes.

## Queue and acceptance

Live initial board inventory:140cards, Core26/Next22/Later85/Blocked4/Approvals2/Evidence1. Three distinct new defects are CORE-FIX-08, ANA-FIX-01 and ANA-FIX-02. Current live inventory is143cards/Core29, other counts unchanged; all9current summaries and parent comment now read back exactly. Original140dispositions are unchanged; no moves/completions. Existing criteria/history/model guidance must stay intact. The analyzed-deck ownership issue and generic stalls already have cards. Only distinct reproduced defects justify additional cards.

Human re-entry: one Sync-OFF manual transition, EQ judgment, temporary Cue hold/release/latch and clean stop; verify fresh visible native preview state. Hardware gates remain MIX-004, AUD-003, HW-003 and HW-011. These cannot be passed by muted computer-audio captures.

Private evidence: `local-evidence/four-deck-active-analysis-2026-10-23/`; separate parallel reviews identify source evidence and do not substitute for runtime checks. The existing local reliability playbook remains an owner-review candidate, not a globally approved procedure.

The probe sessions complete73.529s before/75.201s after with no errors and unchanged isolated session; each has3actual workers,2loaded focused controls retained, sibling/mixer/shared/library nodes retained, and5before/6after lazy previews. Long animation frames are2before/4after, worst53.2/81.7ms. These mixed whole-session figures are not a universal performance pass and include different background preview work. Full-run timing and next-attribution findings remain explicit below.

A controlled posting-failure regression also revealed an owned Worker was not terminated after synchronous postMessage failure. [ANA-FIX-02](https://trello.com/c/svNoGGTE) tracks the narrow existing-cleanup catch; no naturally observed pop is attributed to this fault injection. [ANA-FIX-01](https://trello.com/c/zWRUvuND) tracks bounded staging separately.

128/128 Node regressions and the existing65/65 analysis checks pass. These cover PCM equality/order/options, source attachment and detached-view simulation, abort before/during staging, Worker failure/post cleanup, queued overview freshness and Sync ownership. No new dependency, clock algorithm, DSP or layout redesign.

## Residual attribution and exact re-entry

The matched AFTER probe still has decode-resolve scripts18.1/19.3ms, with0forced-layout time; BEFORE14.7/18.9ms. Their await-stack source location is not a native decoder CPU measurement. First profile chunks2.1/2.8/1.9ms do not account for the entire continuation. The81.7ms frame has no attributed script and0reported blockingDuration. A separate50.9ms MessagePort script is diagnostic capture-export overhead (binary/Base64/JSON/DOM after recording), not an established product Sync/DSP defect. Keep this overhead in ANA-001's evidence limits.

Next unattended action: instrument only the synchronous load() continuation after await engine.buffer(t) through renderTracks(), tagging deck/track and retaining the same real-file action. Separate harness export and unattributed/GC/native allocation pressure. Existing ANA-001/AUD-006/CORE-FIX-07 carry these residuals. Do not rerun broad clean audio matrices or rewrite clocks/DSP without an actual failed event. Current inactive-cache budget does not bound protected active PCM or total process RSS.

Human re-entry remains one manual Sync-OFF transition, EQ judgment, temporary Cue/release/latch and audible clean stop; physical held-pointer release and native moving-frame behavior are not established by DOM identity or Node fixtures. Suitable headphone/master/controller hardware gates remain separate.

## Final exact-source integration result

The current-source run completes320.208s stopped/no queued restart/no reported error. Eight additional real songs,15rotations,8fresh native workers (3loaded/5unloaded), H/V and2→4keylocks. Raw double-Sync and keylock triple-Sync both accept the newest request, keep actual/displayed rates equal and preserve the outgoing master. These use diagnostic DOM clicks, not a human pointer; existing audio deadlines/fades/DSP remain unchanged.

All8analysis checks preserve256existing nodes and current loaded focus/value; active Auto Gain is deferred. Whole-session removals remain39deck articles,6shared canvases and24mixer strips from deliberate replacement/structural layout or keylock transitions; rows/previews0. The eight analysis-specific identity checks preserve all256retained nodes, so those remaining structural redraws are not analysis-completion losses.43Load/20Play and24stopped layout combinations preserve core access across all6choices,2/4decks and requestedH/VCompact. These are feature/node preservation checks, not exhaustive visual/advanced-mode certification. Final library has6lazy previews; differing5/6probe counts remain explicit.

Final callbackp95 is0.8–1.0ms; max frame interval58.1ms;4Long Animation Frames, worst52.9ms;7.1ms summed script-forced layout. Compare the separately instrumented short probes honestly (worst53.2→81.7ms; max interval58→75ms). Distinct workloads/background thumbnail activity prevent a global before/after performance claim.

Independent inspector checks28whole Float32 windows/184s across retained REDs, matched probes and final run, all finite/non-silent. All9targeted worker-ready events fall inside their12s windows. Final sampled source-grid error≤3.8874µs and no post-startup exactly-zero telemetry are software observations, not audible tightness or absence of clicks.16original audio hashes/sizes/mtimes unchanged; isolated original session storage unchanged. Raw music stays private.

Receipts: [run results](active-analysis-results.json), [whole PCM/source inspection](active-analysis-pcm-inspection.json), [matched staging measurements](analysis-staging-probe-results.json), [controlled Sync ownership](sync-request-ownership-results.json). Package/native/Trello delivery follows separately below.

## Delivery and Trello

Candidate0.1.49/sourcebab804202e7803a2651838b1c597ce5cb31c5719 passes5/5archive/host checks, ASAR `ba4023f2e42848e9c1afc216c39375e6b8485e0bf62640e556169148535fb89c`. Native49startup remains pending: old48AX reports16tracks/14previews/0playing, but REC accessibility click had no effect and coordinate input returned noWindowsAvailable. Its recording state was not inspected; no quit/relaunch/profile edit/unlock bypass was attempted. Current/versioned49launchers syntax checked, not executed. [Delivery/re-entry](desktop-0.1.49-playback-delivery.json).

Live143cards/Core29, other lists unchanged;3distinct new defect cards,9current summaries and parent comment exact readback. Original140list/completion/closed states and all retained criteria/history/model guidance preserved. A transient Trello transport failure was recovered by read-before-retry. [Reconciliation](../delivery/CORE_FOUR_DECK_ACTIVE_ANALYSIS_RECONCILIATION_2026-10-24.json). The software repairs are verified within the stated controls/PCM criteria; broader stalls/pops/listening/hardware and physical held-pointer/native moving frames remain open.
