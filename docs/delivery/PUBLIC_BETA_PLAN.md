# Public beta delivery target — 27 October 2026

Ship a useful Mac local-audio DJ beta as soon as its release gates are satisfied. Full Serato/rekordbox/Traktor parity and the entire Trello backlog are not launch prerequisites. No public release has been published or approved by this document.

Current private checkpoint: **0.1.86/source9ef47e3 remains running;0.1.87/sourcece1560a is staged/inspected5/5 and unlaunched**. The Mac explicitly reports locked, so protected87startup waits for manual unlock. Current launchers remain86; current86+staged87only. Prior53manual mix/jog/A-B EQ/Cue/clean-stop listening retains its original scope. Reproduced39late live-parameter rollback and40redundant Sync-attribute work have bounded source/UI repairs; this does not close intermittent Sync pops or long-session stalls. [Current re-entry and evidence](../prototype/CORE_DJ_REENTRY_2026-10-28.md) · [Staged87boundary](../prototype/DESKTOP_087_STAGED_2026-10-28.md).

## Conditional planning estimate — 28 October 2026

For a limited public Mac local-audio beta, the accelerated target is **3–5 working days**, with **5–10 working days** still the safer planning budget once native access and a focused owner session are available. Best case3–4working days if current mixing is clean and distribution/signing setup is ready; allow2–3weeks if a fresh audio defect or distribution prerequisite blocks release. A small private tester build can precede public distribution in approximately2–3working days under the same clean-session assumption. These are forecasts, not a release commitment; signing/notarization setup and clean-machine acceptance are not yet verified.

The remaining time includes the current candidate's relevant listening/held interaction, fresh-install/restart/data safety, targeted repairs from actual failures, readable core navigation, a short first-mix/known-issues/support guide, and the actual distribution/trust path. Stop adding optional features/layout refinement to this beta cut. Re-estimate after the next practical owner session; preserve full release approval and every gate below.

## Now

1. Keep header/Settings navigation readable and all core controls reachable in Compact/two/four decks, using the existing Astryx/token system. Fix concrete access/overlap problems; preserve six layouts, custom DJ controls and waveform previews. Repository-wide style consolidation remains tracked on UI-DS-01 and can follow the beta unless it blocks core use. UI-TOOL-01 / UI-SET-01 criteria remain.
2. Resolve reproduced core playback, Sync/pop, four-deck stall or save/recovery failures that prevent a practical session. Keep unreproduced intermittent reports open with their exact evidence; do not repeatedly run clean matrices or claim zero pops from source checks. CORE-FIX-01 / CORE-FIX-07 / SYS-002.
3. Prepare one immutable beta candidate with a current-source package receipt, actual native startup and a bounded practical mixing/stop check. Reuse prior accepted behavior where the implementation is unchanged.

## Next: release gates

- Core: import/load two real songs; independent tempo/jog, Sync preserving the outgoing master, EQ/filter, cue/latch, crossfade and clean stop. Existing 0.1.53 human acceptance is scoped evidence, not acceptance of future changes.
- Data: saved library/previews and metadata survive restart; backup/restore and failure messages protect existing state. Protected upgrades through86 restored the two loaded tracks and positions;87native recovery remains pending. Clean-machine/restart breadth and native failed-save/retry remain unexecuted; earlier recovery evidence retains its original scope.
- UI: readable header/Settings navigation, all core controls reachable in Compact and four decks, no missing library previews. Continue authored-style migration without hiding legacy literals behind meaningless variables; full consolidation is not an automatic prerequisite for the limited beta when core navigation/access is usable.
- Distribution: inspect the exact package, document supported macOS/architecture, installation/update/uninstall and backup/recovery. Check signing/notarization/distribution trust for the actual beta artifact; no public hosting/upload until the concrete release is ready for owner approval.
- Support: short first-mix guide, keyboard/core controls, limitations, known issues and a reproducible bug-report route. DOC-001's full searchable manual/site may follow the usable beta guide.
- Scope: hardware-dependent Hercules/headphone/master verification is deferred. Do not advertise unverified physical routing, simulated providers or complete competitor parity.

## Later

Full parity, additional hardware certification, advanced DSP and polish not needed for reliable core mixing. Existing Trello criteria/history remain; this release scope does not silently close them.

## Done and re-entry

A public beta is done only when its named artifact is installable, core/data safety gates are observed, limitations/support material are available and the owner authorizes publication. Current86is a private running candidate and87is staged/unlaunched; neither is a public release. Software startup/paused recovery is covered; confirm current state before the owner’s single controller/listening session. Retain the next actual pop/stall rather than repeat clean cases. Remaining UI migration, native failed-save/playing/held controls, listening/hardware and distribution gates stay open.
