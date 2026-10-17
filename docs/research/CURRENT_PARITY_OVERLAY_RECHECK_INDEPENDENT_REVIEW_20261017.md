# Independent current-parity overlay-draft audit review — 2026-10-17

Bounded read-only review of both regenerated audit pairs, their generators, current overlay draft identity and actual saved 0.1.5 ASAR. No report generator was run, no shared report/source modified, no Git/UI/reference/device action performed, and no previous audio/clock/FX/stem evidence rerun. This is claim/accounting inspection, not current reference-runtime acceptance. Applied adversarial verification, evidence-layer separation and integration-quality principles.

## Verdict

**No full-parity or overlay-browser acceptance inflation found.** One concrete freshness correction is required in the current-feature report: its opening “REA freshly read” citation still points at the earlier plist evidence rather than the new recheck. The JSON also separately preserves the correct fresh identity, so version 4.0.10.213 is not contradicted; the attribution of which evidence was fresh is wrong.

- `scripts/check_current_release_parity.mjs:119` interpolates reference.evidence_id from the older `REA_CURRENT_REFERENCE_PLIST_20261017.json`; resulting `CURRENT_FEATURE_MATCH_20261017.md:5` cites ev_fb7043… .
- The new fresh recheck is ev_70d315… observed 14:01:33.580Z, correctly embedded at `CURRENT_FEATURE_MATCH_20261017.json:254–277` and saved in `REA_PARITY_RECHECK_IDENTITY_20261017.json`. Use this identity for the fresh wording; retain the older evidence explicitly as historical if needed.
- The report's top source_checked_at is inherited from the earlier native observation (`scripts/check_current_release_parity.mjs:92`), while the latest identity has its own timestamp. Keep these phases distinct rather than implying that timestamp covers the latest official-page or plist inspection.

## Confirmed accounting and source boundaries

Independent in-memory JSON checks counted 110 unique feature rows and 522 unique requirement IDs/summed requirement counts. All 110 full_feature_parity_verified values are false; all 522 requirement audit_verdict values are UNPROVEN_FULL_REQUIREMENT_PARITY. Canonical requirement flags comprise 46 false and 476 null, **not** 522 explicit false; no true value was found. Null remains unknown, not evidence of absence. Summary scope fields award zero full-feature/full-requirement passes (`CURRENT_PARITY_AUDIT_20261017.json:457–458`). Classification counts sum to 110 and remain evidence classes, not percentages of behavior completed.

The release JSON contains 26 unique checks: 17 current regressions, 7 recent-page updates, one feature and one driver case; 24 macOS obligations and two Windows-only references. All 26 open_play_full_parity_verified values are false. Nine beta deltas remain separate and beta_installed_or_executed is false. These counts confirm `CURRENT_FEATURE_MATCH_20261017.md:3,26`; they do not independently establish exhaustive current Serato discovery or verify the live official pages. This reviewer inspected the parent's saved reference identity/source records, not a new reference session.

Current overlay-draft object embedded in the release JSON exactly equals `docs/prototype/video-overlay-midi-draft-candidate.json`. Its 11 source hashes all match current files. Actual imported registry contains 72 unique Video targets, 28 overlay-specific; these are source definitions, not executed workflows. Draft flags full_parity_verified, browser_workflow_accepted and native_or_physical_accepted are all false. The release Markdown (`13–15`) and HW-002 table row (`CURRENT_PARITY_AUDIT_20261017.md:90`) correctly say overlay/click-to-learn/unassign exists as a controlled draft with browser workflows pending. No stale assertion that those source paths are absent/unimplemented was found.

Historical core Video MIDI 14/4 browser evidence and Key Shift audio evidence are not promoted to this new draft. Generator checks explicit current draft hashes and retains historical candidate lookups (`scripts/check_current_release_parity.mjs:77–87`). This reviewer did not execute those Git lookups; source shows the enforced chain, and preserved core report bytes still match the candidate records checked in the preceding independent artifact unit. The new draft previous_browser_commit is 2e50db4…; its browser acceptance remains false. A source manifest does not supply browser execution.

## Actual unchanged package versus current draft

Independently read the whole original0.1.5 ASAR: 92624764 bytes, SHA256 `251bcc16caf9cfb42a3967db058717373a8c6fcb9ff97d56c330058ec8301b03`. Using the installed read-only @electron/asar API, all 200 actual packaged prototype files match the 48a6d4d candidate manifest, with no missing/mismatched/additional packaged prototype file. Packaged provenance retains source 48a6d4d, host 0.1.5 and original approval f8b0abf separately. No native app was launched.

Compared with that 200-file baseline, exactly seven current existing production files differ: app.js, midi.js, panels.js, styles.css, video-controls.js, video-state.js and video.js. The draft identifies those seven and four new production modules. The audit's eight manifest mismatches include those seven plus its own generator script, so eight overall versus seven production is consistent (`CURRENT_PARITY_AUDIT_20261017.md:5`,CA-03). Fourteen additional prototype files include diagnostic/test assets as well as new production modules; that number must not be read as fourteen shipped features. Unchanged native 0.1.5 still lacks later Key Shift/Video mapper targets; current browser source does not update its package.

## Snapshot freshness and remaining gates

All 24 release-report input hashes matched at inspection. The audit's source/document snapshots matched except this reviewer's learning-review document, which was appended after the parent generated the audit. That is a snapshot timing difference, not a behavior failure: regenerate the audit pair after review freeze before presenting its snapshot hashes as current. Do not rewrite the preserved initial reports.

The controlled draft manifest lists baseline policy/learn/move checks and a preserved red integration artifact; the independent corrected 5/5 and exact-owner 5/5 results are now documented in VIDEO_MIDI_LEARNING_INDEPENDENT_REVIEW_20261017.md. Adding their immutable hashes would make corrected-case evidence easier to follow, but no browser pass may be awarded from them. Actual event suppression, focus/default actions and overlay pixel/reload workflows remain pending; full REQ-516 remains explicitly open (`CURRENT_FEATURE_MATCH_20261017.md:15`,HW-002 boundary). Providers, Link, DVS/CDJs, remaining audio/files/recording integrations, exact effects/stem/keylock quality, UI/reference reconciliation and required physical acceptance remain separate whole-product gaps.

Reviewed initial generated bytes before the requested citation correction:

| File | SHA256 |
|---|---|
| CURRENT_FEATURE_MATCH_20261017.md | 734c0ed997686a85beb40f024013102e97bf015a2d0526a0305a54d588cfdced |
| CURRENT_FEATURE_MATCH_20261017.json | 1cedc63712132992725389d32b5a84cdd6d2166680264c1dd4e07e082f97d735 |
| CURRENT_PARITY_AUDIT_20261017.md | b0f6091e62cb329a3954174f918883728ca12969644abb25dffb9aaae47e4d58 |
| CURRENT_PARITY_AUDIT_20261017.json | 4b9d7e5ca7ffe13c4f7c2facf562c16693d9d2043d216daeb95756439457bdf5 |
| video-overlay-midi-draft-candidate.json | babb395bad4e5893ed3883362016bc6c6c3e546cb8fd91502a28a0b886ac8433 |

The whole-product verdict remains: **current 1:1 parity is not established, and the latest inventory is unfinished**. Existing real subsets and new controlled corrections should remain visible without upgrading their evidence layer.

## Later regenerated audit: citation corrected and browser subset added

At the later 14:15 regeneration, `CURRENT_FEATURE_MATCH_20261017.md:5` and JSON reference.REA_plist_evidence both use the fresh ev_70d315… identity. The old native source timestamp is separately named prior_native_source_checked_at. This resolves the specific fresh-evidence attribution correction; it does not create a runtime-reference pass. All 24 current release input hashes matched at this inspection.

The audit now explicitly adds current_overlay_browser_subset 9/3, seven mappings and 12 output PNGs while preserving previous_core_browser_unit 14/4 as historical. Full overlay browser_workflow_accepted/full_workflow_accepted, complete REQ-516, native/physical and whole-product parity remain false. CA-11/HW-002 describe bounded browser behavior versus open 28-overlay/72-target workflows. The independent original-byte/browser review confirms this bounded subset; it does not award all-target coverage. Direct right-endpoint image rendering remains an explicit gap, and the final cloned restored snapshot closes only its test-reporting issue.

One minor stale broad phrase remained in `CURRENT_FEATURE_MATCH_20261017.md:13`: “its browser workflows remain unaccepted.” The adjacent paragraph now records 9/3 scoped browser checks, so the precise wording should be **full 28-overlay/72-target workflows remain unaccepted**. This is a scope-clarity correction, not a finding that all remaining workflows pass. The initial audit review and its original hashes above remain a historical snapshot, not a current unchanged-source assertion.

Skills applied: adversarial-verify, dec-quality-testing, dec-software-principles.
