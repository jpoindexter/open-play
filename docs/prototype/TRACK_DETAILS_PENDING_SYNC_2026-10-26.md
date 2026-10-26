# Track Details BPM edits during pending Sync

One actual current-HTML failure was reproduced and repaired. The existing native0.1.59 package remains unchanged; this repair is not packaged or native-accepted. [Structured receipt](track-details-pending-sync-2026-10-26.json).

## Actual failure

On product base233790b, the existing isolated diagnostic imported eight pinned local originals and played four: Czeslawa, Call Me Later, AC!DMAT!C (Jus-Ed Head Room Remix), and Disaffected. Physical output was muted. A was the125BPM outgoing master; B was independently playing at123BPM/1× with key lock.

Two rapid original Sync actions left B preparing1.016260162601626×: processing true, one transform, start token7, source rate1×. Through the original library context-menu handler, Track Details saved B's BPM123→124.23. The actual library row read back124.23, but the older Sync committed1.016260162601626×. B's old voice was replaced; only5original observed nodes remained. The diagnostic failed its old-voice/rate assertion and stopped all decks.

Root cause: Track Details mutated the shared BPM without the Edit grid ownership callbacks, then rebuilt every deck and mixer. This is a verified stale-grid/control bug; it is not established as the cause of reported audible pops.

## Bounded repair

The29-line track-details module reuses engine.onGridWillChange before metadata mutation and awaits engine.onGridChanged after persistence. Unchanged BPM does not touch grid ownership. Existing precise-number validation, fields, provenance, rating/protection and original-tag policy remain. Existing grid realignment handles engaged decks; no new DSP, clock or fade algorithm.

Track Details now updates title/artist/key metadata on current visible owners, including duplicate loaded tracks, and redraws only the affected waveforms plus existing row-preserving library refresh. It does not rebuild decks/mixer. Save is disabled during the asynchronous transaction; errors stay visible with an accessible status, and completion cannot close a different dialog that replaced the submitted form.

Four focused checks passed: ordering/exact BPM, unchanged-BPM and saved-error behavior, duplicate-owner presentation, and actual form duplicate-submit/replacement-dialog handling. No full Node suite or broad DSP matrix.

## Same workflow after repair

After the necessary module reload/reimport setup, exactly the failing bounded workflow was repeated. Pending preparation was observed again. Save details canceled it: all four old voice objects/rates were retained; B returned to Sync OFF at nominal/source1×; outgoing master stayed unchanged; all233observed performance/control/preview nodes remained connected.

Fresh Sync used125/124.23 =1.006198180793689×. At audioTime75.51129251700681 the nominal target was set while old source1× remained until75.52455782312926. After that recorded handoff boundary, source and nominal equaled the edited target. No immediate pre-handoff equality assumption was used.

Final UI retained4Play,4tempo,12EQ,4filter,4level,32pads,16library rows and3lazy preview images. The dialog closed; all four decks stopped without queued restart; physical mute and isolated-origin original-session comparison remained unchanged. All20runtime hashes match the executed source; all8original SHA256/size/mtime identities match before/after. Private raw results, screenshot and local manifests stay ignored under local-evidence/metadata-sync-2026-10-26; no original audio or private paths are published.

## Remaining acceptance and next step

[CORE-FIX-17](https://trello.com/c/j6WRFA2z) tracks this distinct metadata surface and stays OPEN for exact next desktop/held-gesture acceptance. Related Edit grid CORE-FIX-09/16 and intermittent pop/stall parents remain open. Native input again became unavailable before the unrelated precise-BPM form check; that check did not edit the normal session. A file-chooser setup attempt initially used the wrong manifest field, was rejected before selection, then succeeded with the existing file field; it is not an audio failure.

This proves one current-HTML cancellation/fresh-target/control workflow, not independent PCM continuity, musical tightness, pop-free acoustics, all cancellation interleavings or sustained frame performance. No desktop rebuild, broad soak, hardware action, merge or release. Keep native59 paused. Re-entry: package a verified immutable slice when useful and run this specific native metadata/held-gesture path once reliable input returns; preserve the next actual pop/stall event rather than repeat clean cases.
