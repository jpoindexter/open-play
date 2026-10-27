# Open Play

## Current core delivery — 27 October 2026

**Private0.1.76/source0e07f24 remains the running/current candidate, inspected5/5; paused is its last native observation.** Same two real tracks restored at13.073/12.426s,16library tracks,2Play/tempo controls,6EQ controls, decoded waveforms and12AX library previews. Existing channelBLOWcut−24dBwas restored after startup; transient tempo/Sync reset is normal restart behavior. No main Play/Sync/REC Start. [Delivery](docs/prototype/desktop-0.1.76-playback-delivery.json).

Native75exposed hidden-opener focus after FX Back→Escape. One-line visibility guard passed its focused failure check; the same native76path returns/focuses FX then Settings on Escape. Later idle HTML focus is unattributed; sustained focus stability, other Settings destinations/drafts and playing continuity remain open. Existing88-line toolbar and23-line shared panel navigator retained; legacy oversized files remain MOD-001debt. [Evidence and limits](docs/prototype/DESKTOP_SETTINGS_076_2026-10-27.md).

Protected74/75recording preflights were clear; both quit normally before hash-matched closed-profile backups. Inactive74/75bundles and named74starter retired; only76bundle remains(~573MiB), current/default/named starters point76. Real75/76packaging removes staging/tar; a new15-line build preflight prevents a third bundle before temporary files. Original audio/recordings/profile backups remain. No additional runtime rebuild for the build-only guard.

Trello177cards/14complete: SYS-FIX-01's actual packaging gate satisfied; Settings and parent provenance/release criteria remain open. Prior53manual/jog/EQ/Cue/stop acceptance retains its scope; inherited CORE-FIX-26/27/28repairs are packaged, not new playing/held/controller acceptance. No broad suite/soak or Sync-pop/stall-cause claim.

Source ahead of76: CORE-FIX-29repairs shared Reverse/Repeat/Slip/Key Lock full-deck rebuilds. Actual four-deck Compact baseline0/225retained; repaired four actions225/225, other fader/previews retained, stopped/muted. One composed regression includes Stem Slip feedback/two-deck hidden command/structural fallback. Helpers45/159lines; no new runtime module or package. [Evidence and limits](docs/prototype/TRANSPORT_SWITCH_CONTROLS_2026-10-27.md).

User-directed design slice: flat-black canvas and near-black shared surfaces, existing color accents/RGB waveforms retained. Actual two/four-deck Compact, Traktor-flat, Settings and selector review preserves controls/previews; token export213. Source preview on loopback63341 is intentionally open; native76/session unchanged, no new bundle. CORE-FIX-29 source is pushed as ff1411d. [Palette evidence and limits](docs/design-system/FLAT_BLACK_2026-10-27.md). Full style migration and native visual acceptance remain open.

Staged0.1.77/source57afcc6 now packages CORE-FIX-29 and the flat-black palette; immutable archive/controlled-host inspection5/5,618runtime files/102declared modules. Native77not launched: authoritative Mac session flag locked, so no native input/restart/Play/Sync/REC Start. Defaults stay76; transport state not freshly observed. Only76+77bundles remain, stage/tar removed; next build blocked until superseded retirement. [Staged delivery and exact re-entry](docs/prototype/DESKTOP_CORE_077_2026-10-27.md).

Newer source repair CORE-FIX-30 preserves loop/length/beat-jump/manual/Auto/Roll controls. Actual baseline0/225→225/225; Auto/Roll230/230after explicit mode changes; one composed regression RED→GREEN, physical mute/stopped/previews retained. New presenter38lines, no DSP rewrite. Native76and staged77predate it; no new bundle or Downloads file. [Evidence/limits](docs/prototype/LOOP_CONTROLS_2026-10-27.md).

Next: after unlock, fresh Recording preflight → normal76quit/process absence → hash-matched closed-profile backup → exact77startup/recovery/controls; only then promote defaults and retire76. Continue software-only core/beta blockers, preserve current paused two-deck work and keep generated artifacts bounded. [CORE-LIVE-01](https://trello.com/c/yJ8r9kCD) holds the deferred controller/headphone/master/listening session. Retain the next actual pop/stall; do not repeat clean matrices.

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
