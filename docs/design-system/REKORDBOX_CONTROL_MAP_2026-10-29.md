# Core performance control map — 29 October 2026

Goal: reduce visual overhead while preserving core controls and waveform previews. This is a bounded extension of the [97-entry catalog](REKORDBOX_CATALOG_STATE.md), not a fresh full-app extraction.

## Evidence

- **Historical REA:** four Performance layouts, mixer/panel states and catalog routes recorded25October.58screen/state captures,7private,6AX-only menus,26unvisited routes; the latter remain unknown.
- **Current native accessibility:** installed rekordbox PID17021, main window32477;2Deck Horizontal. Layout pop-up, panel toggles, master volume, deck Sync/key/transport/loop/pads, mixer EQ/Cue/faders, headphone/crossfader controls observed. Recording panel visible and stopped. No vendor playback/settings/data changes made.
- **Fresh REA unavailable:** observe returned no open target; opening resource target and one cleanup attempt returned unconfirmed Hopper document `/private/tmp/rea-6KmsVc`. Evidence export contained0records. No fresh REA extraction claimed; no Hopper document or security setting forced closed.
- AX/screenshot retained privately under `local-evidence/core-listening-104-2026-10-29/rekordbox-reference-current-*`. No vendor images/code committed.

## Mapping and proposed placement

| Region | Observed rekordbox organization | Open Play decision |
|---|---|---|
| Header | Layout selector and FX/MixPointLink/Sampler/Mixer/Rec toggles; Preferences separate | Deck count followed by direct H/V shortcut; retain display/configuration in Settings. |
| Track strip | Track/key/time, Sync/master and semitone controls grouped per deck | Keep deck ownership obvious; avoid duplicate reset/range labels or global floating deck controls. |
| Deck body | Pads plus loop/transport/platter; a side toggle explicitly reveals BPM/Grid and Auto Gain tools | Our always-visible AUTO/Reverse/Repeat/Censor/Double/Load/ResetKey/jump/roll/grid tools compete with performance controls. Group these in existing deck Tools disclosure; preserve keyboard access/state. Proposed next slice, not removed here. |
| Mixer | Channel Trim/EQ/Cue/faders; monitoring/crossfader grouped below | Preserve channel ordering and filter optional/off setting. Do not add another permanent filter row. |
| Library | Separate navigation/browser work area; current main AX omits most row details | Keep waveform/artwork previews. Existing catalog captures supply library reference; no fresh current row-size measurement claimed. |
| Sync feedback | Current snapshot contains separate Sync/master states; no playing phase measurement | Propose optional compact phase meter; no claim vendor has this exact design. |

## Third visual proposal

**TRIZ (Altshuller), separation in space:** replace the need to compare two dense pictures with one small relational display. A centre tick and signed early/late pointer show incoming deck phase relative to the chosen master; four dots show beat-in-bar. Text describes early/late in beats (or milliseconds only when meaningful). Distinguish tempo match, beat phase and bar phase. Show unavailable/uncertain for missing/unreliable grids, pause/armed and changing master; never label audio verified from grid alignment alone. Optional beside Sync, not a third full waveform region. Prototype and owner review first; not implemented in this slice.

## Order

1. Repair actual-pitch fader feedback and deliver direct H/V shortcut without replacing controls.
2. Streamline existing deck Tools grouping against this map; retain every action and preview.
3. Prototype phase meter against reliable, drifting and missing-grid examples; musical acceptance stays separate.

Skills applied: use, design-system-extraction, dec-cognitive-load, dec-norman-principles, ideation-methods.
