# Public beta delivery target — 27 October 2026

Ship a useful Mac local-audio DJ beta as soon as its release gates are satisfied. Full Serato/rekordbox/Traktor parity and the entire Trello backlog are not launch prerequisites. No public release has been published or approved by this document.

Current private checkpoint:0.1.69/sourcebaed140 inspected5/5 and running paused after protected68quit/hashed closed-profile backup. Same4real tracks2/3/4/5s/16library tracks/metadata/core controls/decoded waveforms/previews retained. CORE-FIX-24 headphone Cue on/off preserves all observed controls/unrelated focus in isolated four-deck GUI; one focused handler regression. Actual native paused click-on/Space-off observed with stopped positions and silent master, not DOM/pointer/playing/controller/routing proof. Prior68preparation fix retained. Native playing/cold-touch/held/fault, listening/hardware and rare pop/stall gates remain OPEN. [Delivery](../prototype/desktop-0.1.69-playback-delivery.json) · [one owner checklist](OWNER_CORE_SESSION_2026-10-27.md).

## Now

1. Finish the requested unified header/Settings and migrate shared UI styling through the existing Astryx/token system. Preserve six layouts, custom DJ controls and waveform previews. UI-TOOL-01 / UI-SET-01 / UI-DS-01.
2. Resolve reproduced core playback, Sync/pop, four-deck stall or save/recovery failures that prevent a practical session. Keep unreproduced intermittent reports open with their exact evidence; do not repeatedly run clean matrices or claim zero pops from source checks. CORE-FIX-01 / CORE-FIX-07 / SYS-002.
3. Prepare one immutable beta candidate with a current-source package receipt, actual native startup and a bounded practical mixing/stop check. Reuse prior accepted behavior where the implementation is unchanged.

## Next: release gates

- Core: import/load two real songs; independent tempo/jog, Sync preserving the outgoing master, EQ/filter, cue/latch, crossfade and clean stop. Existing 0.1.53 human acceptance is scoped evidence, not acceptance of future changes.
- Data: saved library/previews and metadata survive restart; backup/restore and failure messages protect existing state. State exactly whether loaded decks/positions restore (59same-version and59→61→62native paused recovery observed;64/65/66/67/68/69native startup observed, current same-version restart not executed).
- UI: readable header/Settings navigation, all core controls reachable in Compact and four decks, no missing library previews. Finish the authored-style migration without hiding legacy literals behind meaningless variables.
- Distribution: inspect the exact package, document supported macOS/architecture, installation/update/uninstall and backup/recovery. Check signing/notarization/distribution trust for the actual beta artifact; no public hosting/upload until the concrete release is ready for owner approval.
- Support: short first-mix guide, keyboard/core controls, limitations, known issues and a reproducible bug-report route. DOC-001's full searchable manual/site may follow the usable beta guide.
- Scope: hardware-dependent Hercules/headphone/master verification is deferred. Do not advertise unverified physical routing, simulated providers or complete competitor parity.

## Later

Full parity, additional hardware certification, advanced DSP and polish not needed for reliable core mixing. Existing Trello criteria/history remain; this release scope does not silently close them.

## Done and re-entry

A public beta is done only when its named artifact is installable, core/data safety gates are observed, limitations/support material are available and the owner authorizes publication. Current69is a private running candidate, not a release. Software startup/paused recovery is covered; confirm current state before the owner’s single controller/listening session. Retain the next actual pop/stall rather than repeat clean cases. Remaining UI migration, native failed-save/playing/held controls, listening/hardware and distribution gates stay open.
