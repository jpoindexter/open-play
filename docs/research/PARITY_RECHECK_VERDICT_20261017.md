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

## New default-CC overlay matrix

The newer [functional matrix review](../prototype/VIDEO_OVERLAY_MIDI_MATRIX_REVIEW.md) now supplies executed default 7-bit CC browser witnesses for all 28 overlay targets:21 initial checks and5 actual-reload checks,29 saved mappings and115 wholeoutputPNGs. Both text/image kinds exercise selection, On, geometry, all 7 animation families/named options, actual reactive analysis, all 3 routes with visible right, MIDI preset save/select/load, missing-byte reimport and reload. A non-first text selection survives reopening an image editor; its rendered green pixels527 → 0 when its opacity is changed.

Three further reproduced defects were corrected: named options displaying Custom, MIDI Save ignoring the visible typed name and editor reopen replacing another selected owner. Per-layer drafts now survive metadata reload without leaking into presets. Independent artifact inspection corroborates all115 PNGs,345 mask records,48 predicates,29mappings and16 current source hashes. Actual browser pointer/key smoke separately confirms default suppression, Escape focus and targeted Enter unassign. All failed and weaker test predecessors remain preserved with clear scopes.

These results close the listed defaultCC happy-path evidence gaps; they do not establish every encoding/compound/error/resource/Reduced Motion case, all 72 Video/full REQ-516/26 manual groups, native, physical or current-reference equivalence. The older9+3overlay and14+4coreVideo runs retain original candidate identities. The desktop0.1.5 package is unchanged.

## New keylock/cursor clock evidence

The [new native evidence review](ENGINE_RENDER_CLOCK_NATIVE_EVIDENCE_REVIEW.md) independently checks an actual separate Electron production-engine/WASM run. The strict capture and calibration pass; **five of ten cases** satisfy all criteria. Five remain unaccepted because seven position-marker probes lack uniqueness. Every pitch/gap/control interval passes, and all 26 confident probes including calibration fall within 10 ms. This is not a complete keylock pass or evidence of five audio defects.

All 7,701 rows, 985,728 actual parameter values and complete four-channel PCM were inspected; maximum scheduled-value/global/step residual is 0.0625 sample within the declared Float32 budget. This is one good observation, not an explanation or repair of the old globally failed run. Its original zero-accepted result remains unchanged. Production engine, marker/oracle, old harness and desktop 0.1.5 package remain unchanged. Common-mode, first-sample, musical/compound, main-product, physical and reference behavior remain open.

## Done and re-entry

The real Done criterion is that every reconciled requirement executes on the identified deliverable with the expected visible/audio/storage/device outcome, including failures and compound states. That criterion has not been met. No full-feature, requirement or release-case parity pass is awarded; nine beta deltas remain separately scoped. Counts describe evidence accounting, not a completion percentage.

Now: preserve the valid new clock evidence and unchanged failed predecessors. Next: improve marker information/calibration with fixed confidence/position/pitch/gap gates and a separate declared cohort; then preserve 0.1.5 and package the already-approved desktop test candidate for actual main-app MIDI/reload/audio. Remaining core Video, encoding/compound/error/resource and full REQ-516/manual-group acceptance stays open. Later: the broader backend, DSP-quality, visual and hardware gaps above. Full Claude completeness audit remains unlaunched; the updated handoff retains the original prompt byte-exact.

Skills applied: use, gap-analysis, dec-quality-testing, adversarial-verify, claude-codex-handoff, verified-done.

Independent final accounting review: docs/research/CURRENT_PARITY_OVERLAY_MATRIX_CANDIDATE_REVIEW_20261017.md verifies current/historical source cohorts, raw evidence hashes, 157 audit and 28 feature-check input snapshots, unchanged native ASAR and unpromoted parity flags. No material issue found within that bounded review; it does not execute full parity.
