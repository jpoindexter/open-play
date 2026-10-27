# Public beta delivery target — 27 October 2026

Ship a useful Mac local-audio DJ beta as soon as its release gates are satisfied. Full Serato/rekordbox/Traktor parity and the entire Trello backlog are not launch prerequisites. No public release has been published or approved by this document.

Current private checkpoint:0.1.63/sourcee57e34a is packaged/inspected5/5 but unlaunched;62continues running/default. Last observed native four-track paused2/3/4/5s session and controls/previews retained; paused metadata/Tap/reanalysis common-module checks recorded. New63save-failure repair passes one actual isolated form/retry/reload and six focused module checks. A new confirmed Mac lock stops native input; owner session collects unlock/startup/controller/listening work. [Delivery and limits](../prototype/desktop-0.1.63-playback-delivery.json) · [owner checklist](OWNER_CORE_SESSION_2026-10-27.md).

## Now

1. Finish the requested unified header/Settings and migrate shared UI styling through the existing Astryx/token system. Preserve six layouts, custom DJ controls and waveform previews. UI-TOOL-01 / UI-SET-01 / UI-DS-01.
2. Resolve reproduced core playback, Sync/pop, four-deck stall or save/recovery failures that prevent a practical session. Keep unreproduced intermittent reports open with their exact evidence; do not repeatedly run clean matrices or claim zero pops from source checks. CORE-FIX-01 / CORE-FIX-07 / SYS-002.
3. Prepare one immutable beta candidate with a current-source package receipt, actual native startup and a bounded practical mixing/stop check. Reuse prior accepted behavior where the implementation is unchanged.

## Next: release gates

- Core: import/load two real songs; independent tempo/jog, Sync preserving the outgoing master, EQ/filter, cue/latch, crossfade and clean stop. Existing 0.1.53 human acceptance is scoped evidence, not acceptance of future changes.
- Data: saved library/previews and metadata survive restart; backup/restore and failure messages protect existing state. State exactly whether loaded decks/positions restore (59same-version and59→61→62native paused recovery observed;63native startup pending).
- UI: readable header/Settings navigation, all core controls reachable in Compact and four decks, no missing library previews. Finish the authored-style migration without hiding legacy literals behind meaningless variables.
- Distribution: inspect the exact package, document supported macOS/architecture, installation/update/uninstall and backup/recovery. Check signing/notarization/distribution trust for the actual beta artifact; no public hosting/upload until the concrete release is ready for owner approval.
- Support: short first-mix guide, keyboard/core controls, limitations, known issues and a reproducible bug-report route. DOC-001's full searchable manual/site may follow the usable beta guide.
- Scope: hardware-dependent Hercules/headphone/master verification is deferred. Do not advertise unverified physical routing, simulated providers or complete competitor parity.

## Later

Full parity, additional hardware certification, advanced DSP and polish not needed for reliable core mixing. Existing Trello criteria/history remain; this release scope does not silently close them.

## Done and re-entry

A public beta is done only when the named artifact is installable, core/data safety gates are observed, limitations/support material are available and the owner authorizes publication. Current63is a private staged candidate, not a release. After unlock, preserve current62work/recording and its closed profile before63startup; then use the single controller/listening checklist, recording the next actual pop/stall rather than repeating clean cases. UI migration, native/playing/held controls, listening/hardware and distribution gates remain open. No deadline is inferred from green tests or card counts.
