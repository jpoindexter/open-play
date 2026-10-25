# Open Play

[Core audit and remaining work — 21 October](docs/prototype/CORE_DJ_AUDIT_2026-10-21.md) · [Trello reconciliation](docs/delivery/CORE_DJ_RECONCILIATION_2026-10-21.json).

Current work is finishing the **core two-track DJ experience**, with the chosen rekordbox layout, all controls and library waveform previews preserved. Jason authorized a new local desktop test build on20October. [Current waveform/native evidence and open acceptance](docs/prototype/WAVEFORM_READABILITY_035.md), [core plan](docs/delivery/CORE_DJ_FIRST.md), [HTML preview](http://127.0.0.1:8848/prototype/layout-preview.html).

Independent open-source desktop DJ project, with a browser review candidate and ongoing reference investigation. The goal is familiar Serato DJ Pro design and behavior without artificial feature, account or device gates in the independent implementation.

**Current source candidates — core reliability:** Source2a9c027 stops revoked starts before obsolete buffer requests; 5e53ef6 retains pitch-range controls and reuses prepared rate handoffs so rejected changes preserve playback. Full Node194/194, including26 focused cases; original GUI8/keylock9/handoff4/FX8 checks pass. All controls/layouts/library previews remain. Trello155cards: all153prior dispositions preserved, four previous narrow completions, no new completion; Sync pops/native stalls and remaining runtime gates stay OPEN. A distinct current5e integration manifest pins22selected modules; static readiness passed, no live session launched. Older99/ba4 orientation comparison remains isolated. Normal52/package/profile untouched; user requests live checks after unlock. These source checks do not establish native latency, DSP quality or pop-free audio. [Latest report](docs/prototype/CORE_TEMPO_RELIABILITY_2026-10-25.md), [source/test receipt](docs/prototype/tempo-control-reliability-results.json), [board reconciliation](docs/delivery/CORE_TEMPO_RECONCILIATION_2026-10-25.json), [prior native incident](docs/prototype/CORE_NATIVE_STALL_CAPTURE_2026-10-24.md).

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
