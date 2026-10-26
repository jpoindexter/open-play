# Precise BPM native save: executed, cleanup pending

**Pending cleanup:** the normal0.1.59 library currently retains the temporary title `BX 3 · metadata check`. Restore its title to `BX 3` through Track Details when native input is reliable. Do not change its BPM124.98471158160582 or other metadata. No original audio tags were rewritten. This pass is not closed until restoration is observed.

## Observed native path

Exact running native0.1.59/sourceb10bc82 had BX3 Track Details open with124.98471158160582BPM. A temporary Title edit was made through the accessibility value setter. Screenshot confirmed the edited title and full precise BPM. Save details was invoked once through the observed native button.

Native observations initially remained stale, so an early commentary incorrectly treated Save as unexecuted. A later full native tree proved the modal had closed, deck/library title changed to the temporary value, and the library BPM remained exactly124.98471158160582. Saved evidence is retained privately under local-evidence/precise-bpm-native-59-2026-10-26/saved.txt and edited.png. This proves the narrow native save/precision behavior, not restart persistence or full metadata parity.

## Automation failure and restoration limit

The attempted immediate restore value-set occurred after the details form disappeared and did not restore the saved library title. Subsequent row actions encountered stale IDs; one stale row target opened the unrelated Glass Transit details form. Its observed fields remained original; no save was requested for that form. Screenshot-coordinate input returned noWindowsAvailable. Rebinding the exact59bundle and trying a freshly read Close control still returned AXError.invalidUIElement. Native input attempts stopped; there is no screen-lock claim because the session flag was absent and capture alone does not prove input availability.

The initial optimistic “unsaved title” description was corrected after actual saved-state evidence. Original BX3 title is known and restoration remains explicitly pending. Playback was not started; observed deck positions remained2/3/4/5s, tempo0%, SyncOFF, master meter−∞,16library tracks and controls/previews present. No independent acoustic/mute or current audio quality claim. No quit/restart, profile-file rewrite or lock bypass to force cleanup.

[LIB-FIX-01](https://trello.com/c/7shGOJX2) remains OPEN for restoration and remaining exact acceptance. Current native59/profile/default launchers are retained. Private61 packaging can proceed without touching this live session; its startup/changed Sync/held-gesture checks remain pending. Do not infer broader completion from the successful numeric form save.
