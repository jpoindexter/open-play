# Current workspace sizing follow-through — 30 October 2026

The owner redirected from the separate reference preview to applying the discovered design to the existing app. Existing graphite controls, restrained semantic accents, sizing and waveform renderers are retained. This slice fixes the remaining observed narrow-panel collision; it is not the complete design-system migration.

## Changes

- Canonical primitive → semantic token sets the existing desktop-host minimum of 1000 CSS px. Below that width the workspace scrolls horizontally, keeping control dimensions rather than scaling them down. This is an Open Play support boundary, not a recovered vendor dimension.
- Old mobile grid/row/library rules no longer fight the flat workspace. Legacy non-flat modes retain those rules.
- One Astryx library-command owner keeps the row unwrapped, gives buttons and selectors their intrinsic width, and permits horizontal scrolling. Import, Analyze, Selected track and Columns no longer ellipsize or stack over waveform rows. The adapter's conflicting fixed-height command row was removed.
- No new stylesheet, dependency, UI widget, transport or waveform code. Existing dialogs, keyboard focus and portaled menus remain.

## Executed

Stopped generated-audio actual workspace: 667×845 viewport keeps a 1000 px scrollable workspace, two 419×280 px decks, 36 px Play controls, 24 px mixer knobs, thirteen tools/deck and eight previews. Library command row is 812 px wide / 851 px scrollable / 40 px high. All inspected button labels and the Selected track text fit. Columns opens its actual dialog and closes; Settings → Mixer → Close works. Four-deck Vertical at 1000×900 has four 371×264 px decks and four 342 px channels with matching client/scroll dimensions, thirteen tools/deck and eight previews. Two-deck Horizontal at 1440×950 retains two 639×280 px decks and no internal overflow. Zero active Play buttons throughout. [Readback](design-reflow-2026-10-30/browser.json) · [Two-deck view](design-reflow-2026-10-30/two-horizontal.png) · [Four-deck view](design-reflow-2026-10-30/four-vertical.png).

Token export validates 248 aliases/cycles; the existing typography ownership guard checks nineteen runtime stylesheets. No broad suite or audio checks were run.

## Limits and re-entry

Delivered in private desktop0.1.134/sourceb1997f6. Exact archive inspection5/5 and native2H startup/screenshot retain paused30.097/34.086s,16tracks/12materialized previews and silentmaster. [Native delivery](../prototype/INSTANT_DOUBLE_SEEK_134_NATIVE_2026-10-30.json). Below1000 px scrolling is intentional; this is not a phone layout. All-layout/day/Unicode/full migration and native-narrow acceptance remain open on UI-DS-01/UI-006. No listening, controller or Sync-pop acceptance is implied.

The separately reproduced Instant Double/newer-seek repair is now delivered in134 after focused source, actual browser baseline/repaired and isolated native acceptance. Its broader listening/controller/Stop/sampler criteria remain separate. Original session/media and unrelated reference/draft directories were preserved.
