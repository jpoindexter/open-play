# Clearing BPM must not invalidate a saved warp grid — 28 October 2026

An actual Track Details form permits an empty BPM. On a valid track with tempo/warp markers, the old transaction turns that empty field into0, mutates metadata and persists it. The modal closes; a fresh reload refuses the saved library as an invalid warp grid and pauses autosaving to protect the original record. Original audio is not rewritten, but the library becomes a recovery session.

Two lines reuse `validateMetadata({bpm},track)` before any grid revocation, mutation or persistence. Invalid warped BPM clears now retain the open editor/typed field and show its inline validation warning. Existing positive-BPM and unwarped empty-BPM behavior remains; markers are not silently discarded. No new runtime module, dependency, DSP or layout change.

## Executed proof

The focused shared-module regression first fails with Missing expected rejection, then passes1/1: invalid edit leaves track/storage/grid hooks unchanged and reload healthy; an unwarped empty BPM still saves/reloads as0.

The actual isolated workspace uses its original Track Details context menu/form/Save handlers. A controlled valid marker{time10,bpm121} is seeded on a generated48s track at120BPM, then saved normally. The unmodified tracked Track Details module (522a5ea, hash in the receipt) is served on one fixed owned route; all other dependencies are current. This is a module baseline, not a full historical-repository run.

Baseline blank Save closes the modal, persistsBPM0and produces a blocked recovery banner after reload. Repaired blank Save keeps BPM120and its marker, leaves the raw saved record byte-identical, retains the open blank field, re-enables Save and displays Invalid library data: warp grid. Nothing was restored. A fresh browser reload returns the same valid BPM/marker with no recovery banner and no playing decks. Settled accessibility observes2Play controls/7library waveform previews; immediate post-load0preview counts are retained as asynchronous observations, not missing-preview defects.

The first repaired probe selected an inner widget status rather than the form's own status. That attempt is retained separately; only the affected repaired warning probe was repeated with the direct form-status selector. No product edit or broad test matrix followed.

Physical output stays muted; no real media is used. Owned frame/storage/tab/server are stopped/cleared and temporary sources removed after exact retained-copy comparison. Current native86and the user profile remain unchanged. Browser save/reload does not establish native save, crash/interrupted-write recovery, all migrations, listening or hardware acceptance.

[Structured evidence](track-details-grid-validity-2026-10-28.json). Raw module/browser baseline, repaired output/screenshots, focused test and fixture/server copies remain private under `local-evidence/track-details-grid-validity-2026-10-28/`.
