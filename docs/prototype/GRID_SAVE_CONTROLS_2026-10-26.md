# Save grid without replacing performance controls

## Reproduced cause and repair

On base `360b500`, the actual four-deck rekordbox Compact Edit grid → change BPM → Save grid path removed **234 of 247** observed deck/mixer/control/detail/scrub/library nodes. The dialog's shared success and realignment-error branches both called `renderDecks()`, which rebuilds all decks and the mixer. This is a demonstrated node-ownership failure, not a measured explanation of an audible pop.

Both branches now reuse the existing `a.drawWaves(track)` and `renderTracks()`. The normal display loop already refreshes BPM, percent, tempo, Sync/master and transport state. Grid validation, pre-change ownership capture, asynchronous realignment, persistence and visible errors remain in their original order. No engine/DSP, style, dependency or new production module.

## Executed evidence

The same actual browser workflow on isolated localhost18847 retained **244 of245** observed nodes, including every observed deck/mixer/detail/scrub control and library row. The one removed IMG was investigated rather than discarded: the generated-demo preview key includes seed/BPM/frequency, so changing its BPM regenerates that preview. It remains present afterward. Original media previews use their content hash; no real audio was imported or changed here.

Platter and overview updated to126.0BPM; the follow-up that classified the IMG saved127BPM and reopened at127. All4Play/4tempo/32pads/8rows remained, zero decks playing; browser error log empty. Library lazy-image counts varied4→2 between reloads/viewport composition; node removal counts include only images present at each Save. No claim that every offscreen thumbnail was already painted.

One focused regression executes the actual source-extracted grid editor: original handler2fail/1pass → corrected3pass. Success refreshes the edited track; rejected realignment retains saved metadata and visible error without closing; invalid BPM changes no metadata/playback/presentation. Dialog/realignment/persistence/paint are controlled collaborators; real beatgrid validation is imported. These checks are not a real audio-ACK failure capture.

Private before/after JSON, source baseline, DOM probe and screenshot remain under ignored `local-evidence/grid-save-controls-2026-10-26/`. The diagnostic copy observes product actions; it does not replace handlers. An initial missing18846 listener and private baseline file-URL path setup error are retained as acquisition failures, not product defects. Dedicated18847 reused the existing server allowlist. No broad Node suite or timed soak.

## Tracking and limits

[CORE-FIX-16](https://trello.com/c/qybCEzDj) remains open for exact desktop/playing/held-gesture acceptance; linked to [CORE-FIX-07](https://trello.com/c/QGW47XIJ) and [ANA-003](https://trello.com/c/xa2CyXub). [CORE-FIX-09](https://trello.com/c/ixqGkEo6) still needs actual real-track pending Sync → grid-save integration. This check does not satisfy that separate transport criterion or clear intermittent pops/stalls.

No Play, Sync, REC, normal native/profile operation or original-media change. Native/listening/hardware and measured frame-time improvement remain unverified. Re-entry: use a current-source desktop with reliable input for one playing grid edit, preserving active controls and outgoing master; capture the next actual pop instead of repeating clean cases.
