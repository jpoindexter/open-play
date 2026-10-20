# HTML220 — Rekordbox core DJ goal

20 October 2026. User selected the rekordbox layout and requested an active goal limited to finishing the core DJ loop. No desktop rebuild or integration is authorized. Other layouts are preserved as alternatives; comparative layout work and extra features are deferred.

## Concrete changes

- Default workspace and review title now select rekordbox. Horizontal / Compact / mixer visible is the starting display; current listening session uses two decks. Reset layout returns to Compact.
- Actual rendered inspection found both channel filter controls hidden by an older reference-layout rule. The original controls are restored in their owning channels, without changing their values/engine handlers. Two-channel composition uses the available fifth EQ row; four-channel rules retain a separate filter row.
- Existing centered ticks and 28×14 custom channel caps are available in this layout. Original range inputs and app callbacks remain. Pointer snapping now includes rekordbox; pointer geometry distinguishes a horizontal range from a vertical range so the existing horizontal tempo rail is not treated as vertical. This code path needs its actual interaction in the musical session; unit detent checks alone do not establish it.
- No change to audio engine, source analysis, stored local music, controller mapping or native bundle. Original PROJECT_PROMPT.md remains the exact suffix of the completeness handoff.

## Current observations

- Reload selected rekordbox; actual filter visibility changed from false to true.
- Normal library row selection and Load controls loaded the two existing saved real MP3s separately onto decks 1 and 2. Neither file was replaced by a generated demo. Private source titles stay in local evidence.
- All twelve trim/EQ/filter/level inputs on the two channels have positive visible bounds and retain neutral EQ/filter, trim1 and level0.8.
- Ten decoded-source library previews remain in the DOM; both real tracks' library previews existed before loading. Actual detailed/overview preparation is asynchronous and must finish before treating those views as rendered.
- User reported left timer advances with audible music in response to the left-Play instruction. A later read found both HTML decks at00:00 with Play glyphs. This does not independently corroborate the target window/timing of that report; the user was reminded that this pass targets the browser, not the unchanged desktop. Right-deck confirmation and current hardware availability were requested and remain pending.
- Syntax/whitespace and existing fader-detent checks pass. No new broad regression matrix was run. Native0.1.27 ASAR remains `a4d7135432916a3fb0467d008cd6c97ffb293b4ec63aeeba2e36bff50b60afcb`.

## Done criterion and next action

In this identified HTML candidate, use two real MP3s through normal UI: independent transport and cue; master/headphone separation and blend; channel/mixer/EQ/filter; manual pitch/jog beatmatch and transition; sustained synced transition and manual return; exposed Hercules controls if connected; then clean stop. A reported successful Play, moving meters, matching BPM or layout geometry is not acceptance of the entire loop. Keep human/physical/routing gaps explicit.

Continue the current listening questions first; do not change layouts or playback underneath the user. If a concrete failure occurs, reproduce and fix only that blocker, then repeat the affected action. No further cosmetic refinement, stems, advanced FX, video, DVS or full-device-catalog work. Startup observer error remains open unless its actual throwing path is captured; no suppression or cause claim.

Tracking: [CORE-001](https://trello.com/c/LGGdtSa3), [UI-RB-06](https://trello.com/c/miElcJk0), docs/delivery/CORE_DJ_FIRST.md and current handoffs. Goal active. Local receipt: local-evidence/rekordbox-core-220/current.png. Recommendations remain as tracked: Codex gpt-6.1-sol/high; Claude Code Sonnet5/medium, verify actual availability before invoking. No additional agent used for this implementation. Musical, hardware and full-product acceptance remain open.
