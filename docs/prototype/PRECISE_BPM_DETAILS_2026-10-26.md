# Precise BPM in Track Details — 26 October 2026

## Executed defect and smallest repair

On base `67427a2`, the actual Edit grid dialog saved **124.98471158160582 BPM** for the generated After Hours demo. Opening Track Details and changing only its title left Save details blocked: the backing native number field reported `stepMismatch: true`, the dialog stayed open and the library retained its old title. The Astryx field correctly surfaced the backing form's validation failure; the shared form constraint was wrong.

The single production change in `prototype/panels.js` changes Track Details BPM from `step=".01"` to `step="any"`, matching the existing grid editor. Number type and 1–999 bounds remain. Callers, form submission, metadata provenance, persistence and original-file policy are unchanged. No new helper, dependency, engine change or rounding.

## Actual browser acceptance

In the isolated `http://localhost:18846/prototype/workspace-preview.html` origin, after loading the corrected source:

- The same precise BPM was valid.
- Editing only the title to “After Hours — precision check” and pressing Save details closed the dialog and updated its library row.
- Reloading and reopening Track Details retained that title and **124.98471158160582**, with artist Open Play Lab, album Night shift, key 8A, original comment, rating 0, color #ef795d and unlocked grid unchanged.

The isolated generated demo profile used no imported original media; normal 127.0.0.1 preview and native profile were not operated. No Play, Sync or REC was invoked. Private before/after JSON and screenshots are retained under ignored `local-evidence/precise-bpm-details-2026-10-26/`.

## Tracking and limits

[LIB-FIX-01](https://trello.com/c/7shGOJX2) records the executed browser check and remains open for exact desktop acceptance. [LIB-002](https://trello.com/c/yeToZypO) is still a broad open metadata/artwork feature; this repair does not establish format/tag/artwork parity. Existing core listening evidence remains scoped to its tested versions. Intermittent Sync pops/stalls and hardware gates remain open.

Not checked: native package, fresh listening, VoiceOver and out-of-range form interaction. The library's raw long BPM display is separate and unchanged. No broad suite or new regression file was needed for this one-attribute fix; the actual blocked/save/reload path was exercised.
