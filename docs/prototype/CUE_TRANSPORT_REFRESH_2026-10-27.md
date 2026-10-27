# Temporary Cue transport refresh — 27 October 2026

One reproduced four-deck control-ownership defect, separate from Cue replacement/cancellation races. Ordinary temporary Cue release called renderDecks, replacing all decks/mixer while another control could be in use.

## Actual failure and repair

Reused the existing core-controls harness with one narrow button; its broad EQ/audio workflow was not run. Dedicated guarded8874origin, generated tracks, physical output muted. Focus Cue, press Space to audition, move focus to another channel’s level fader, release Space through the actual key lifecycle. Baseline retains9of234observed nodes; the other fader’s original node and focus are lost, although Cue returns paused correctly. Repaired path retains237of237observed nodes, other-fader focus/value,4Play controls/4lazy library previews and correct paused Cue return. Different234/237totals reflect1/4lazy previews at observation, not hidden omissions or matched timing. Both cleanups assert physical mute and all decks stopped/no queued restart.

The shared126-line holds module now takes an optional refresh callback defaulting to its original render callback. Product wiring reuses existing Smart Sync reconciliation plus refreshTransportControls. Only ordinary temporary Cue pause, cue-set and release presentation use it. Hot-cue edits and Stem Slip keep existing rendering. Seek/start/pause, cancellation, ownership, latch, persistence, DSP and clock operations are unchanged. No generic framework, new runtime module or dependency. App remains an explicit oversized legacy exception under MOD-001.

Eight focused actual holds-module checks: baseline7pass/1fail, repaired8pass. The added case checks temporary Cue release/set/pause uses transport refresh; existing cancellation/replacement/release-before-preparation/latch cases remain. Other createCueHolds callers retain their existing render fallback; stem-specific rendering is unchanged. No full suite, broad matrix, clean soak or fresh listening.

## Limits and re-entry

This proves actual isolated HTML control identity/focus and Cue return for generated audio. It does not prove native held pointer capture, musical tightness, audible pop/stall absence or controller/headphone/master behavior. Native packaging/startup is recorded separately. CORE-FIX-21 https://trello.com/c/aUUFoC0n stays open for exact native interaction; CORE-LIVE-01 https://trello.com/c/yJ8r9kCD holds the later owner session. Do not repeat prior53ordinary Cue/listening acceptance automatically.

Receipt: cue-transport-refresh-2026-10-27.json. Raw before/after results, screenshots/source identities and focused logs: ignored local-evidence/cue-control-refresh-2026-10-27/. Original music and normal desktop profile untouched by this check.
