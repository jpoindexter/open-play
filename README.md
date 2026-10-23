# Open Play

[Core audit and remaining work — 21 October](docs/prototype/CORE_DJ_AUDIT_2026-10-21.md) · [Trello reconciliation](docs/delivery/CORE_DJ_RECONCILIATION_2026-10-21.json).

Current work is finishing the **core two-track DJ experience**, with the chosen rekordbox layout, all controls and library waveform previews preserved. Jason authorized a new local desktop test build on20October. [Current waveform/native evidence and open acceptance](docs/prototype/WAVEFORM_READABILITY_035.md), [core plan](docs/delivery/CORE_DJ_FIRST.md), [HTML preview](http://127.0.0.1:8848/prototype/layout-preview.html).

Independent open-source desktop DJ project, with a browser review candidate and ongoing reference investigation. The goal is familiar Serato DJ Pro design and behavior without artificial feature, account or device gates in the independent implementation.

Historical local desktop approval for revision `f8b0abf` and previous test builds is retained in [approvals](docs/approvals.md). Native0.1.27/0.1.37 are historical; current local test0.1.40 (source 6fdaef9) passed existing-profile startup with 16 tracks. [Bounded decoded cache and executed limits](docs/prototype/CORE_DECODED_CACHE_2026-10-23.md). [State-safety fixes and verification](docs/prototype/CORE_STATE_SAFETY_2026-10-22.md); [Trello reconciliation](docs/delivery/CORE_RESOURCE_RECONCILIATION_2026-10-23.json). [Earlier desktop instructions](desktop/README.md) describe historical candidates; they do not override the current scope. Full core, vendor parity and physical routing acceptance remain open.

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
