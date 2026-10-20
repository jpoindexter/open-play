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

## Listening-window correction — continuation

The apparent timer mismatch was resolved by inventorying current browser tabs. The agent had been controlling a separate preview tab209; Jason identified the browser panel inside Codex, and the actual user-facing tab212 retained the older title, Full density and generated After Hours/Glass Transit demos with nonzero playback positions. Therefore Jason's earlier two playback confirmations establish audible demo playback in that older view, **not** current real-MP3 acceptance. They must not be counted toward the real-track requirement.

Control was moved to the user-facing tab212. That paused tab was refreshed to the current committed HTML source35ade3a. Normal library selection/Load put the two saved real MP3s on separate decks; actual DOM shows rekordbox/Compact, both real titles and no decks playing. A fresh LEFT real-track confirmation was requested. Jason also confirmed the Hercules is disconnected and he is using computer audio; physical/headphone separation checks remain explicitly unverified. Do not use the old separate tab as evidence of the user's audible session. Native app unchanged.

## Core continuation221 — horizontal pitch interaction

With control correctly attached to the user-facing panel, actual DOM inspection showed the horizontal pitch input height was2px. Root cause: its label inherited the original vertical writing mode, while its children/row had been laid out horizontally; flex sizing compressed the input inside the20px row. The scoped rekordbox label now explicitly uses horizontal-tb. Actual reload shows both inputs61×15CSSpx. No deck-height redesign or audio-engine change was made.

On real trackA while both decks were paused, an actual pointer click to the right produced+4.8% /126.8BPM; center returned0% /121.0BPM. ArrowRight then produced+0.1% /121.1BPM; ArrowLeft restored0. These establish the affected direction/center/fine UI paths, not audible pitch quality or full manual beatmatching. Both real tracks were restored at0/paused and the existing fresh real-track LEFT-Play question remains pending. Screenshot: private local-evidence/rekordbox-core-221/visible-panel.png. Do not count earlier audible generated demos as real-MP3 acceptance.


## Fresh real-track listening continuation

Jason answered the explicit visible-panel LEFT “Moonglow” question: “Yes—real track plays and timer moves.” A subsequent read of the same tab212 shows the correct real titles, LEFT paused00:06.9 and RIGHT paused00:12.1. Count LEFT audible playback as user-confirmed; transport positions are observed. Do not infer audible RIGHT independence from its nonzero timer. A new single-action RIGHT Play/listening question is pending. Current output is computer audio, Hercules disconnected. Mixing/manual/Sync and clean-stop acceptance remain open; no source/UI/native changes in this continuation.


RIGHT listening follow-up: Jason confirmed “Yes—right plays; left stays paused” on the two identified real MP3s. Subsequent same-panel DOM: LEFT remains00:06.9/paused; RIGHT00:15.3/paused (previously00:12.1). Independent playback is user-confirmed; no simultaneous-mix acceptance inferred. RIGHT channel level reads0.8. Next single practical check is RIGHT channel LEVEL down/up with its transport running. No code/native changes.


## HTML222 — matching crossfader cap; listening progress

Jason confirms channel B LEVEL is silent at bottom/restores sound when raised, then crossfader LEFT silences the right track/RIGHT restores it while its timer continues. DOM subsequently shows LEFT unchanged00:06.9/paused and RIGHT00:38.9/paused; crossfader−0.08, EQ/filter neutral. These are current real-track user listening results, not an accepted complete transition.

Requested presentation fix: `prototype/xone-preview.css` gives rekordbox/Traktor-flat crossfaders the channel-cap material, larger rectangular grip with vertical position stripe, centered scale marks and keyboard focus outline. Original native input, values, handlers, assignments and center detent retained. Actual visible panel checked with pointer travel, center0, keyboard+0.01, Home−1/End+1; two/four-deck Compact render observed. No audio/MIDI/desktop code changes. Refresh required loading the same two real tracks again through normal library/Load; restored two decks, both paused0 and crossfader0. Ten library waveform previews remain. Next core step: EQ/filter listening, then manual/Sync transition and stop; physical cue separation deferred until suitable outputs available. Screenshot: private `local-evidence/rekordbox-core-222/crossfader-cap.png`.
