# rekordbox layout follow-up 201 — 19 October 2026

## Scope and authority

HTML preview only. No native rebuild, source engine changes, mappings, user music or vendor asset redistribution. Target: installed rekordbox 7.2.19.0342. User corrections: fix four-deck mixer; show/hide mixer; include library waveform previews in gap tracking; center crossfader; keep filters in their channels. Preserve the core DJ experience.

## Directly observed native app

Cocoa View menu successfully switches 4 Deck Vertical and 4 Deck Horizontal. Both show four mixer strips in one horizontal row. Horizontal labels explicitly read 3 / 1 / 2 / 4. The original Open Play inputs remain tied to engine indices; CSS ordering C / A / B / D changes presentation only. Native lower monitor/assignment/crossfader band runs across the screen, with the crossfader at center. Native mixer visibility is a top toolbar toggle. Native collection has Preview waveform thumbnails, artwork, rating, key, BPM and duration columns. No assumption that a thumbnail is automatically an audition/seek implementation.

Private evidence: `local-evidence/rekordbox-layout-200/native-four-{vertical,horizontal}.png`. Native returned to 2 Deck Horizontal, Mixer On (matching the user's last reference screenshot). Demo track remained paused.

## REA attempt and fallback

`open_binary` for the installed app failed before opening: `cleanup_incomplete` from an older Hopper session. `close_binary` also returned the same failure. REA could not authenticate document shutdown, retained `/tmp/rea-wWEcrQ`; no user analysis documents killed or removed. No claim of full extraction, pseudocode recovery or all-feature coverage. A filesystem-only fallback inventory found 2,812 resource files and 24 XML/QML/CSS/JSON/NIB candidates. It is recorded privately in `resource-inventory.json`; filenames do not establish runtime behavior. Native screenshots/AX are direct observations, not REA evidence.

## Separate Trello records

- [UI-RB-01 — Four-deck mixer](https://trello.com/c/Nsnb1JhR)
- [UI-RB-02 — Mixer visibility](https://trello.com/c/WQ378lGK)
- [UI-RB-03 — Centered shared footer](https://trello.com/c/EULEpME9)
- [UI-RB-04 — Per-channel filters](https://trello.com/c/Rx4NWhjG)
- [LIB-RB-01 — Library waveform previews](https://trello.com/c/NL9aSgOB)
- [REF-RB-01 — Screen/feature inventory and REA blocker](https://trello.com/c/qKTqELoB)

All cards have scope, acceptance criteria, evidence limits, and existing project model recommendations. Recommendations require live availability checks before agent execution. Native/library/feature parity is not marked complete. No native app build authorized by this work.

## Remaining inventory work

Library waveform thumbnails and their optional audition behavior need implementation and acceptance. Compare visible native columns to existing LIB-003, then make an individual linked card for each confirmed missing behavior. Preserve existing key/rating/search/sort functionality; do not duplicate it as new work. Native pad pages beyond the original eight cues, native Master selection semantics, inline headphone knobs, browser subpanels and split browser behavior remain separate gaps. Full rekordbox parity cannot be inferred from these layout captures or its skins directory. Continue a screen-by-screen observed/file-proven/inferred/unknown ledger under REF-RB-01. Keep later advanced features behind the current core DJ priority.
