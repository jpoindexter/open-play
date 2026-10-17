# Current parity verdict — 17 October 2026

**Open Play is not yet a verified 1:1 match for Serato DJ Pro.** This recheck identifies implemented subsets, concrete mismatches and integrations that are still simulated. A registered control, source match or passing module test does not earn a feature parity pass.

## Reference and scope

The official [download page](https://serato.com/dj/pro/downloads) still lists 4.0.10. REA re-read the installed Info.plist as **4.0.10.213**, evidence `ev_70d315bdd494a9efdba20445607af197cdbc8bbbfa56e6eb1e5ab6392b744f3a`; this is static identity, not feature execution. The current product/manual pages and separate 5.0 beta announcement were reopened; see [source observations](PARITY_RECHECK_SOURCES_20261017.json). The unavailable features/expansions URLs were not treated as empty catalogs.

The [complete existing crosswalk](CURRENT_PARITY_AUDIT_20261017.md) accounts for **110 groups / 522 requirements**. Nine beta deltas and 26 current release checks remain separate (24 macOS, two Windows reference cases). The manual crosswalk's semantic review and exhaustive current-version discovery remain unfinished. No full-feature/full-requirement or release-case parity pass is awarded; that does not mean no functionality exists.

## What prevents a full-match claim

| Area | Evidence-supported current state | Required next evidence |
|---|---|---|
| Decks, library and mixer | Real imported audio playback, cues/loops/mixing and scoped native WAV/MP3 restart evidence exist. Files/metadata/relink/interop and many compound cases remain open. | Original tags/database roundtrip, removable-volume recovery, all transport/loop/cue/grid combinations and representative large libraries. |
| FX, stems and keylock | Independent audio processors, actual SCNet inference and actual Signalsmith processing exist. Stem quality and the later cursor matrix retain failures. | Reference parameter/state/sound comparisons; unchanged stem-quality and cursor/clock gates; compound musical and long-session tests. |
| Sync and services | Smart Sync phase/takeover, Ableton Link networking, provider services and several input/routing paths remain simulated or absent. | Real phase ownership, actual network peers, authorized provider integration/failures and live mic/aux routes. |
| Hardware | Historical user-confirmed Hercules browse and headphone/master isolation are preserved. | Full38-requirement Hercules mapping, jog/touch/pads/LEDs/modifiers, reconnect/latency; DVS/HID/CDJ/Phase and other named hardware cannot be inferred from the Hercules subset. |
| Recording and Video | Real postmaster recordings and scoped Video decode/GPU/capture paths exist. Pre-master/input/split/recovery and external Video output remain open. | Actual recording tap/input/failure recovery, codec/AV/resource comparisons and supported display/output workflows. |
| Appearance and controls | Inspected Vertical composition has known mode/loop/mixer differences; newer browser MIDI code is absent from the unchanged desktop 0.1.5 package. | Same-viewport screen/state comparisons, keyboard/focus/resize/accessibility checks, new exact native candidate tests. |

These are acceptance boundaries, not estimates or a percentage-complete score. Current classifications:68 subset,21 simulation/backend-gap,2 subset+wip,9 engineering-unverified,7 physical-subset,2 observed-mismatch and1 reference-unresolved. Each row's exact source, criteria, evidence and per-feature Codex/Claude model/effort recommendations remain in the JSON crosswalk.

## Concrete corrections during this check

The overlay draft adds28 targets to the44 core Video targets and a shared selected-layer/preset/decoded-image controller. Independent controlled checks first reproduced five integration defects:14-bit Note renumbering, swallowed pre-existing Hold releases, deleting another layer's shared image, a stale preset dropdown, and device scope lost on Reassign. Corrected five-case results are5/5. A separate five-case Hold owner suite tests exact input identity, bank/mapping changes, pending onset, assignment suppression and device disconnect. Broader controlled regression results retain their own source/host boundaries.

Actual browser testing then exposed a sixth defect: a queued close event from an older MIDI dialog cancelled a new panel assignment. The correction scopes cancellation to the view owning the current assignment. All red reports, fixture errors and the invalid repeated-run attempt are retained. Browser subset results are recorded separately in [the overlay review](../prototype/VIDEO_OVERLAY_MIDI_FUNCTIONAL_REVIEW.md); they never establish all 72 targets, full REQ-516, reference sonics, physical MIDI or native acceptance.

## Done and re-entry

The real Done criterion is that every reconciled requirement executes on the identified deliverable with the expected visible/audio/storage/device outcome, including failures and compound states. That criterion has not been met.

Now: preserve the corrected overlay work and exact browser evidence. Next: finish text, selection/size/position/animation/preset and keyboard/pointer workflows, remaining core commands and full REQ-516; then package an approved local desktop candidate and execute native MIDI/reload/audio checks. Later: the broader backend, DSP-quality, visual and hardware gaps above. Preserve old packages, failed PCM/quality evidence, original prompt and per-feature routing. Full Claude completeness audit remains unlaunched.

Skills applied: use, gap-analysis, dec-quality-testing, adversarial-verify, verified-done.
