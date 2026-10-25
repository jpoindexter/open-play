# Reference application review

25 October 2026. Source/browser design slice; private desktop 0.1.58 predates it.

## Executed

- REA opened the installed same-hash rekordbox binary, decoded NIB summaries/catalog metadata and captured Performance / 2Deck Horizontal: 279 nodes plus selected-window screenshot. Saved same-binary 2/4 Vertical captures supply historical comparison. [Reference, confidence and mapping](REKORDBOX_REFERENCE_2026-10-25.md).
- Token export: 139 tokens; alias/cycle validation passes. Active white text contrast 5.58:1, selected white text 9.00:1, body on panel 12.27:1, muted on control 6.27:1. These pairs do not establish whole-app accessibility.
- Actual 1280×900 workspace, rekordbox / Compact: four-deck Horizontal retains 32 hot cues, four overview canvases, visible mixer ranges and lazy library previews. Actual two-deck Vertical retains 16 cues, two overview canvases, both tempo/Play controls and all twelve mixer ranges; twelve library images had decoded by that view.
- Settings still presents all six layout choices. Header commands have 0px default border; keyboard Tab in Settings reaches DJ Preferences with a solid 2px focus outline. Active controls render `rgb(36,101,199)`, deck panels `rgb(30,30,30)`, small controls `rgb(40,40,40)`.
- The real review exposed three legacy `!important` row-selection overrides and alternating-row specificity masking the shared selection role. Removed the conflicting selection/row colors and retained one shared selected-row contract.
- Returned to four-deck Horizontal / Compact. Real track positions remain 2/3/4/5s; zero Play buttons active, master meter at silence. No new Play/Sync action was requested during this presentation review. No console errors were returned by the final browser error-log query.
- `git diff --check` passes. No new audio test campaign or desktop package was run.

## Limits / next slice

This applies the reference foundation and selected adapter presentation, not every runtime stylesheet. Typography/icon ownership is the next user-requested slice. Fresh native four-deck reference capture, native Open Play delivery of these styles, all-state/all-layout visual acceptance, zoom/reflow/VoiceOver and whole-app contrast remain unverified. Current source retains all layout/control implementations; source presence alone does not establish every interaction.

UI-DS-01 remains open. Intermittent Sync pops, native cancellation fault windows, recovery and physical routing remain separately tracked core/beta gates.
