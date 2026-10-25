# Public beta delivery target — 25 October 2026

Ship a useful Mac local-audio DJ beta as soon as its release gates are satisfied. Full Serato/rekordbox/Traktor parity and the entire Trello backlog are not launch prerequisites. No public release has been published or approved by this document.

## Now

1. Finish the requested unified header/Settings and migrate shared UI styling through the existing Astryx/token system. Preserve six layouts, custom DJ controls and waveform previews. UI-TOOL-01 / UI-SET-01 / UI-DS-01.
2. Resolve reproduced core playback, Sync/pop, four-deck stall or save/recovery failures that prevent a practical session. Keep unreproduced intermittent reports open with their exact evidence; do not repeatedly run clean matrices or claim zero pops from source checks. CORE-FIX-01 / CORE-FIX-07 / SYS-002.
3. Prepare one immutable beta candidate with a current-source package receipt, actual native startup and a bounded practical mixing/stop check. Reuse prior accepted behavior where the implementation is unchanged.

## Next: release gates

- Core: import/load two real songs; independent tempo/jog, Sync preserving the outgoing master, EQ/filter, cue/latch, crossfade and clean stop. Existing 0.1.53 human acceptance is scoped evidence, not acceptance of future changes.
- Data: saved library/previews and metadata survive restart; backup/restore and failure messages protect existing state. State exactly whether loaded decks/positions restore (0.1.57 currently starts with demo decks; live positions are not restored).
- UI: readable header/Settings navigation, all core controls reachable in Compact and four decks, no missing library previews. Finish the authored-style migration without hiding legacy literals behind meaningless variables.
- Distribution: inspect the exact package, document supported macOS/architecture, installation/update/uninstall and backup/recovery. Check signing/notarization/distribution trust for the actual beta artifact; no public hosting/upload until the concrete release is ready for owner approval.
- Support: short first-mix guide, keyboard/core controls, limitations, known issues and a reproducible bug-report route. DOC-001's full searchable manual/site may follow the usable beta guide.
- Scope: hardware-dependent Hercules/headphone/master verification is deferred. Do not advertise unverified physical routing, simulated providers or complete competitor parity.

## Later

Full parity, additional hardware certification, advanced DSP and polish not needed for reliable core mixing. Existing Trello criteria/history remain; this release scope does not silently close them.

## Done and re-entry

A public beta is done only when the named artifact is installable, its core workflow and data safety gates are observed, its limitations/support material are available and the owner authorizes publication. Private0.1.58/source2ba58bb is now packaged and archive/host-inspected5/5 with the quiet header and paused loaded-deck recovery. Native58startup/restart remains pending after screen lock; Current launcher remains57. Next action: execute one protected58native startup/clean-restart check after unlock, then continue the named Sync fault windows and remaining UI migration/beta blockers. No deadline is inferred from green unit tests or card counts.
