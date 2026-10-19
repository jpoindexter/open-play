## Checkpoint185 — warped-primary marker crossing joins correctly

Plan185: actual warped-primary150→90marker no longer falsely cancels a keyed deck join at constant126BPM. Baseline rejected/332.6msphase; after stable/crossing2cases/16whole native48kchannels pass, max waveform2.532e-8/1e-4, phase rounding-level/10ms, nominal error0. Guard now checks nominal source/shared tempo. Nominal/common-change/Pause/owner policy plus pending/loop collaborators pass(controlled). Slider setup/reference22050-vs48000unit errors and failed originals retained; no fitted alignment/gate change.18cachefiles unchanged/no inference. Mixed Sampler/Stems/gesture/transient/quality/vendor/native/hardware/full110/522/9/26/55 parity open. See docs/prototype/PRIMARY_CROSSING_185_REVIEW.md and handoffs/stems-185-mixed-sampler-followup.md.

Evidence: https://github.com/jpoindexter/open-play/blob/main/docs/prototype/PRIMARY_CROSSING_185_REVIEW.md

## Checkpoint184 — calibrated retained-voice reference resolved

Plan184: generated native48k unity-source calibration resolves183retained keyed waveform reference without production audio changes. Chrome155.0.8059.80,3cases/6wholechannels: declared integer offset rule passes(max2.393e-8/1e-4), naive fractional rule fails. Same untouched183after original now passes5cases/40wholechannels; retained voice RMSerror0. Before still fails actual feedback/capture gaps;183failed reports/inspector retained exact. No fitted timing/gain/phase, repaired PCM, gate change, model inference or workflow rerun.18cachebytes/hash/mtime unchanged. Warped-primary crossing/mixed/transient/quality/vendor/native/hardware/full110/522/9/26/55 parity open. See docs/prototype/BUFFER_OFFSET_184_REVIEW.md and handoffs/stems-184-warped-primary-followup.md.

Evidence: https://github.com/jpoindexter/open-play/blob/main/docs/prototype/BUFFER_OFFSET_184_REVIEW.md

## Checkpoint183 — committed source-loss feedback; uniform reference open

Plan183: actual source Pause/Sync Off after scheduled keyed warp join no longer leave playing126BPM audio falsely Sync Off. Source-loss/own Stop/load4cases pass whole native48k rendered-transport/audio/owner gates; all5state checks pass. Five-case cohort remains FALSE: retained unsynced uniform-voice waveform reference fails(~.08-.096vs1e-4); source-start quantization hypothesis unverified. Baseline128frame pre-capture gap retained; after40channels contiguous. Only smart-sync production changed; pending/loop collaborators pass.18cachebytes/hash/mtime unchanged/no inference. Source-coordinate/mixed/transient/quality/vendor/native/hardware/full110/522/9/26/55 acceptance open. See docs/prototype/DECK_LOSS_183_REVIEW.md and handoffs/stems-183-uniform-source-reference-followup.md.

Evidence: https://github.com/jpoindexter/open-play/blob/main/docs/prototype/DECK_LOSS_183_REVIEW.md

## Checkpoint182 — actual playing deck-led warped Sync

Plan182: actual playing deck-to-deck raw/keyed warped joins now prepare at target126BPM; baseline299.6/319.5ms drift, after Beat phase rounding-level/10ms and secondary whole source/rendered transport PCM<=2.535e-8/1e-4. Short-loop Tempo preserves position.3cases/24whole native48kchannels; real Stop/load/cleanup3cases/20channels pass(settled500ms, immediate transient ungraded). Only smart-sync production changed;3affected collaborator commands pass.18cachefiles/bytes/hash/mtime unchanged/no inference. Source-loss/mixed/quality/vendor/native/hardware/full110/522/9/26/55 acceptance open. See docs/prototype/DECK_PLAYING_182_REVIEW.md and handoffs/stems-182-deck-source-loss-followup.md.

Evidence: https://github.com/jpoindexter/open-play/blob/main/docs/prototype/DECK_PLAYING_182_REVIEW.md

## Plan181 — playing warped Sync now prepares its musical backend

Actual already-playing raw/keyed warped-loop decks join a sample-led Beat group; keyed deck also joins2beat Tempo source without forced bar alignment.3cases/24whole48000Hzchannels pass. Before actual drift220.8ms/raw and174.1ms/keyed; raw waveform error1.396. Deck claimed Beat but prepared uniform audio. Owned temporary target timeline now feeds real warp/keylock preparation before public Sync commits, scoped to track/revision/geometry/start token and removed in finally. Whole original/rendered transport PCM error<=3.753e-8relative/1e-4, Beat phase rounding-level/10ms, nominal error0; Tempo prior position preserved exactly. Affected loop-policy collaborator and actual180ownership4cases/32channels pass; settled500ms windows only. Cache18/mtimes unchanged/no inference.

Ordinary deck-led playing warp branch still needs actual test; BPM-only/mixed sources/transition/Stop transients/pitch quality/vendor/native/hardware/full parity remain open. [181 evidence](https://github.com/jpoindexter/open-play/blob/main/docs/prototype/SAMPLER_PLAYING_181_REVIEW.md) · [next handoff](https://github.com/jpoindexter/open-play/blob/main/handoffs/stems-181-deck-led-warp-followup.md). Frozen0.1.23/272Alternative/profile/user servers unchanged/controller unplug; no native build/Claude audit. Formal criteria/status/models/effort/history retained.

## Plan180 — real keyed join ownership and committed feedback

Four actual cases/32whole48000Hzchannel streams pass: deckStop/load during real pitch-backend creation; deckStop after successful future scheduling; sample-sourceStop after that logical commit. OwnStop/load stay silent with no stale voice/queued Play; unrelated unsynced sample keeps the same voice/positive audio. Baseline sourceStop left deck audio playing but indicator armed. External alignment now distinguishes deck ownership from source validity: before future position selection source must be valid; after successful scheduling a still-current Play publishes active state, while deckStop/load revokes it. SourceStop is not an implicit deckStop. Expected silent peaks0/activeRMS>1e-5, finite/SHA/contiguous; no mocked DSP/delay/relaxed gate. Cache18/mtimes unchanged/no inference.

Exact vendor race semantics, playing/mixed/warped/Tempo-only joins and before-scheduling source replacement remain open; full Sync/native/hardware/quality/parityfalse. [180 evidence](https://github.com/jpoindexter/open-play/blob/main/docs/prototype/SAMPLER_OWNERSHIP_180_REVIEW.md) · [next handoff](https://github.com/jpoindexter/open-play/blob/main/handoffs/stems-180-playing-mixed-sync-followup.md). Frozen0.1.23/profile/272Alternative/user servers unchanged; no native build/Claude audit. Formal criteria/status/models/effort/history retained.

## Plan179 — actual sample-led deck joining and member audio

Two raw samples120BPM→stopped deck Sync/Play joins120→Sampler pitch5sets all126→Stopfirst retains second/deck→bankstop samples/deck continues→solid yellow Tempo bar. Six actual stages/48whole48000Hzchannel streams; independent sample/bus PCM error<=4.1e-8relative, source clocks at common epoch<=0.187microseconds/10ms, nominalerror0. Deck PCM nonzero; exact deck waveform/quality ungraded. Baseline deck124/samples120and296.7msphase; later180msoffset/yellow absent. Explicit actual sample clock/grid/BPM/phase/owner descriptor now feeds Smart Sync. First deck-only branch regression caught; corrected null selection and all3affected collaborator suites/final actual browser pass. Failed originals/capsules retained. Cache18/mtimes unchanged/no inference.

Pending source disappearance/cancel, playing/mixed-keylock/warped/Tempo-only joins/quality/vendor/native/hardware/full parity remain open. Frozen0.1.23/profile/272Alternative/user servers preserved; controller may stay unplugged; no native build/Claude audit. [179 evidence](https://github.com/jpoindexter/open-play/blob/main/docs/prototype/SAMPLER_MEMBERSHIP_179_REVIEW.md) · [next handoff](https://github.com/jpoindexter/open-play/blob/main/handoffs/stems-179-sampler-source-ownership-followup.md). Formal criteria/status/models/effort/history retained.

## Plan172 — main warped Auto Loop geometry corrected; full parity remains open

Actual Loop8/half4/double8 on120→150at1s→90at1.8s previously gave7.3/4.3/7.3beats; app.js now uses continuous beat coordinates. Actual selected real Stems raw and keylock+3/SmartSync120 at natural48000Hz give8/4/8, six recorded wraps, max source-clock error2.665e−15s/10ms.14whole finite/contiguous channel streams, positive active RMS, Stop peaks0. Same existing48kSCNet job539aeee35cbe4518a7800f4ebbb004c5;18cache files/mtimes unchanged, no new inference. Before failed original retained. This does not establish gap-free/perceptual/pitch/source quality, exact vendor multi-marker composition, native/hardware/full parity. Next: execute saved-loop creation/save/recall; current base-BPM creation is only a source concern.

Evidence: [172review](https://github.com/jpoindexter/open-play/blob/main/docs/prototype/AUTO_LOOP_172_REVIEW.md), [results](https://github.com/jpoindexter/open-play/blob/main/docs/prototype/auto-loop-172-results.json), [next handoff](https://github.com/jpoindexter/open-play/blob/main/handoffs/stems-172-saved-loop-followup.md). Original formal criteria/dependencies/model/effort/status and prior evidence below are unchanged.

## Checkpoint171 — natural48k Stems/keylock
Ordinary unforced AudioContext48000; MP3/decoded Stems all326400stereo frames/6.8s, zero frame mismatch. Actual selected raw/key+3/relative+6/Stop pass;8whole14400frame/113quanta channels, raw sum error≤3.589e−8/1e−4, clocks0/10ms, Stop peaks0. New canonical48000job539aeee35cbe4518a7800f4ebbb004c5: one uncached7.207s inference, worker44100outputs browser-converted48k. Old44100job9files/mtimes unchanged. No production patch. See NATURAL_RATE_171_REVIEW.md and stems-171-warped-auto-loop-followup.md. Full48k/migration/pitch/source/perceptual/reference/native/hardware/full parity open; frozen0.1.23preserved. Current171evidence governs historical text below; original formal criteria/models unchanged.

## Preserved complete history
Fresh previous description archived verbatim: https://github.com/jpoindexter/open-play/blob/main/docs/delivery/trello-history/DEK-018-before-plan171.md
15397bytes / UTF8 SHA256 02f7b7c4d921b1f6c5c78c082c786987c0aeb6ad5006ea669f39938fe91d371a. All previous checkpoint/archive links remain there. Formal acceptance/dependencies/model/source blocks below are retained verbatim; old scope/status prose is historical.

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
Historical card descriptions through plan133 are preserved verbatim at https://github.com/jpoindexter/open-play/blob/main/docs/delivery/trello-history/DEK-018-before-plan134.md . This archive retains all earlier checkpoint failures, scopes and prior archive links. The original acceptance, sources, dependencies and model/effort routing above remain in place; current scoped evidence follows. Full acceptance remains unverified.

Plan134 ·18Oct2026: Current private desktop0.1.23 from2a334132ca1a423029fceb8aa3e39953655df525; ASARfa4b2c4629a0f313cefc619878bb333f8ae60cbb4d8ac1e5eebcef1bfa58825e. Actual isolated native Checks execute8real-key/pointer GUI states and11generated-tone/synthetic-MIDI Simplecontroller states, with normal report Save dialogs.38retained Float32windows finite; maxglobalFFTerrors.00003135Hz<.3Hz, stoppedexactzero. Whole Simplemaster108719B independently decodes finite48000Hz/stereo325440frames; generic scopes retained separately from native wrappers. Initial limited GUI/AXcoarse-step/source-expiry cohort retained, finalbounded8states completed; no injectedJS/DevTools/broad reruns.5archive/session checks/345prototype files/63critical assets and actual63servedbytes match/no-store. Closed22profilebackup186files/8031631B/hash-equal;22archive/versionedlauncher retained. Normal before/after exports272entries/64916B/SHA37b61c1dbf16d43a1f14d7d932c88dc3a4d2ba1a062ae23e5175c91d58953864 identical. Main23stoppedboth00/Master−12/levels.8/.8/crosscenter; namedHerculesmaster1/2cue3/4,mix0%vol10%,noMUTED, noPlayworkaround. Defaults23; both checksclosed/main8768preserved. Physical firstleftPlay→RCA sound→samebuttonstop remains pending; humanaway/no capture. Exactvendor/music/latency/compositions/fullnative-fullreference parity remain open. See docs/prototype/DESKTOP_0.1.23_REVIEW.md/currentguide. Next independent FX step: plan128LPFlive cutoff/topology continuity. Fullflags/model-effort routing unchanged; fullClaudeaudit unlaunched.