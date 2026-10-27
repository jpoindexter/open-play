# Open Play

## Current core delivery — 27 October 2026

**Private 0.1.73/source a91d657 is packaged and inspected 5/5; native launch is pending.** Last observed running/default remains0.1.71/sourcee92e3d6, paused; this pass left that session untouched. [Delivery and limits](docs/prototype/desktop-0.1.73-playback-delivery.json).

Two reproduced core repairs: stopped reverse Play at zero restarts from the track end (CORE-FIX-26), and ordinary natural end retains deck/mixer control ownership (CORE-FIX-27). Actual isolated four-deck GUI reverse restart retains210/210controls/backward clock; natural end changes0/225to225/225retained controls with other-channel fader focus/value, four Play controls and library previews intact. Generated audio, physical mute asserted, final stopped/no queued Play. Three focused reverse offset regressions pass. [Reverse report](docs/prototype/REVERSE_RESTART_2026-10-27.md) · [Natural-end report](docs/prototype/NATURAL_END_CONTROLS_2026-10-27.md).

Two engine lines including comment and one existing refresh substitution; no new runtime module. Diagnostic254lines/regression23lines; existing oversized engine/app/panels/analysis remain MOD-001 debt. No broad suite/soak, new listening, Sync-pop cause or measured frame-time claim. Repeat/Autoplay runtime not rerun; branch bodies unchanged. Prior53ordinary acceptance and64–71repairs retain scope.

Owner-dependent work is grouped in [CORE-LIVE-01](https://trello.com/c/yJ8r9kCD) / [one practical checklist](docs/delivery/OWNER_CORE_SESSION_2026-10-27.md). Both new cards stay open for native/live criteria. Native held/playing/fault/cold-touch, hardware/headphone/master/listening, intermittent Sync pops/stalls and release gates remain open. Trello175cards/13complete; no duplicate26/27/28.

Source ahead of73: CORE-FIX-28 Fader Start/back-cue now uses existing transport refresh in three places. Actual isolated four-deck Compact MIDI-editor synthetic0→127→0 retains225/225controls per stage, other-channel fader identity/value and library previews; transport/return preserved. Physical mute/stopped cleanup asserted. No extra package/full suite/native attempt; physical/native acceptance stays in the owner session. [Report](docs/prototype/FADER_START_CONTROLS_2026-10-27.md).

Next: preserve any new recording/work, safely launch the inspected73candidate and verify paused recovery before the one owner controller/listening session. Current defaults remain71 until startup is observed. Continue only bounded reproduced software defects; do not rerun clean matrices. [Public beta scope](docs/delivery/PUBLIC_BETA_PLAN.md).

Independent open-source desktop DJ project, with a browser review candidate and ongoing reference investigation. The goal is familiar Serato DJ Pro design and behavior without artificial feature, account or device gates in the independent implementation.

## Historical implementation evidence

**Prior source candidates — core reliability:** Desktop0.1.56/source3667d6f saves Prepare/manual History edits in a focused39-line session-panels module. Actual native insertion and Prepare add survived quit/process exit/reopen; original96history entries retained plus inserted97,16tracks/previews/controls present,0playing. [Evidence and limits](docs/prototype/desktop-0.1.56-session-panels.json). New session archive/read/export passes isolated handler/storage checks; native archive interaction remains open. Prior53listening/focus,54fader resets and55play-count evidence retain scope. Hardware deferred; software continues. Rare Sync pops/stalls and broad feature criteria remain open; no clean-case repeats or broad matrices.

Historical desktop approvals remain in [approvals](docs/approvals.md). Desktop0.1.52/source df48b50: archive/host5/5 and actual normal native startup observed with16savedtracks/14viewport AX waveform previews,0playing decks,Horizontal/Compact and no shown save/recovery warning. Normal48 was quit only after fresh REC00:00/Start available/Download disabled inspection; closed245-file/120391863B profile backup hashes match. Current/versioned52 launchers syntax checked; exact bundle launch observed, launchers not executed. Terminal analysis removes one redundant global overview redraw while retaining per-result controls, focus, status/cancel/re-enqueue and global changed-selection tick recovery. Full Node148/148 plus14original controller-harness checks; matched4→0geometry visits/10.4–14.6→0–0.1ms. Full323.066s/15rotations/8fresh workers on8new songs distinct from44prior sources;43Load/20Play/24stoppedlayouts retain controls/previews. Independent23wholePCMwindows/148s and source/original/session hashes pass. Broader stalls remain:23longframes,worst242.5ms; largest two unattributed. Separate native3.0065s first-job window retains254nodes/focus/gain/master; largest COMPLETE main task22.869ms, actual199.1ms native long frame outside capture. No GC/CSS/DSP cause established. Physical output muted in diagnostics; normal-profile music not started. Trello148cards, two narrow software defects complete, six summaries/comment exact; prior146dispositions unchanged. Audible pops, native moving frames/held gestures, late-song grids, manual listening and hardware remain OPEN. [Delivery/re-entry](docs/prototype/desktop-0.1.52-playback-delivery.json), [executed report/limits](docs/prototype/CORE_TERMINAL_ANALYSIS_REFRESH_2026-10-24.md), [runtime/source](docs/prototype/terminal-analysis-results.json), [PCM](docs/prototype/terminal-analysis-pcm-inspection.json), [native window](docs/prototype/terminal-analysis-native-window.json), [Trello reconciliation](docs/delivery/CORE_TERMINAL_ANALYSIS_RECONCILIATION_2026-10-24.json).

- [Run the HTML prototype](prototype/README.md)
- [Per-file Video FX save/recall evidence](docs/prototype/VIDEO_FILE_FX_REVIEW.md)
- [Semantic Video links and treatment evidence](docs/prototype/VIDEO_LINK_TREATMENT_REVIEW.md)
- [Current Video, karaoke and Media Crate evidence](docs/prototype/VIDEO_FUNCTIONAL_REVIEW.md)
- [Executed review and known gaps](docs/prototype/REVIEW_REPORT.md)
- [Claude independent audit handoff](handoffs/codex-to-claude-completeness-audit.md)
- [Full build plan](FULL_BUILD_PLAN.md)
- [Original execution brief](PROJECT_PROMPT.md)
- [Evidence ledger](docs/research/EVIDENCE_LEDGER.md)
- [Binary findings](docs/research/BINARY_FINDINGS.md)
- [Pre-prototype parity gate](docs/research/PARITY_GATE.md)
- [Feature additions from research](docs/research/PARITY_ADDITIONS.md)
- [110-feature model plan](docs/delivery/FEATURE_MODEL_PLAN.md)
- [Machine-readable feature registry](docs/delivery/feature-registry.json)
- [Manual-to-feature crosswalk](docs/research/MANUAL_FEATURE_CROSSWALK.md)
- [Reviewed interaction requirements](docs/research/INTERACTION_REQUIREMENTS.md)
- [Installed UI observations](docs/research/UI_OBSERVATIONS.md)
- [Official manual source index](docs/research/manual-index.json)
- [Connected Hercules investigation](docs/research/HARDWARE_HERCULES.md)
- [Foundation and product-model recommendation](docs/decisions/001-foundation-and-models.md)
- [Development-model routing](docs/models/DEVELOPMENT_ROUTING.md)
- [Approval record](docs/approvals.md)
- [Private Trello board](https://trello.com/b/OqMGEjpe/open-play-serato-parity)

Reference: installed Serato DJ Pro 4.0.10.213, with Desktop installers 4.0.9 and 4.0.10. Hardware reference: Hercules DJControl Inpulse 300 MK2. The latest recorded session used computer audio with that controller disconnected; no live device claim is made here. Ghidra is the selected deep-analysis tool; Hopper is a demo.

Findings distinguish observed behavior, file evidence, official documentation, inference, proposals and unknowns. Device enumeration and source inspection are not complete hardware compatibility. The original 74 proposed feature groups have expanded to 110; that count is not an assertion that the reference has exactly 110 features or that parity is verified.

Raw binaries, extracted slices, disassembly, private library data, screenshots and vendor article bodies stay outside Git under ignored `local-evidence/`. The repository contains original plans/findings, public-source metadata, diagnostic tooling, original browser prototype code and screenshots of that prototype.

- [Full-scope contract](docs/research/FULL_SCOPE_CONTRACT.md)
- [Feature coverage accountability](docs/research/FEATURE_COVERAGE.md)


- [FX Tap BPM and stem-responsive waveform evidence](docs/prototype/FX_TEMPO_WAVEFORM_REVIEW.md): actual timing/audio/source-display behavior; full reference parity remains open.
