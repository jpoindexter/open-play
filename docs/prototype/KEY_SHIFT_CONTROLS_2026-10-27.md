# Key-shift control retention — 27 October 2026

[CORE-FIX-33](https://trello.com/c/6RcQagUr) remains open for packaging and native/held/listening acceptance. Current installed 0.1.79 / source `f9e7511`, normal profile and paused real-track session are unchanged.

## Reproduced failure

On baseline `d510e72`, actual key Up, Down and Reset buttons in an isolated four-deck Compact workspace each replace 241 of 355 observed controls. The other channel’s fader was explicitly focused before each programmatic key-button activation; after completion its control is detached and focus is lost. Its value and three visible library preview images remain. Generated tracks stay stopped and the physical audio graph is muted throughout. This is UI control-owner replacement, not an established pop cause or measured frame-stall duration.

The shared setter calls `renderDecks()` after awaiting pitch preparation, then the button action falls through to another `renderDecks()`. The existing mapped-MIDI entry also uses that setter through `api.setDeckKeyShift` / `api.keyShiftIntent` in panels.js.

## Bounded repair

Extract the existing key-shift request concern into 25-line `deck-key-shift.js`, retaining integer ±24 validation, gesture cancellation, latest-request/track checks, persistence and failure cleanup. Current deck identity is also checked before publishing completion. API names and engine `setPitch` remain unchanged. Buttons return the setter’s promise; the common completion callback uses existing key/switch/loop/transport presentation helpers, including their structural fallback. The legacy app file shrinks; this does not establish whole-repository size compliance.

Actual repaired Up/Down/Reset retains 355/355 controls, other-fader focus/value and 3/3 previews. Labels show Bbm (+1) after Up and Am after Down/Reset, key lock remains on and Key Sync is cleared. No new audio clock, DSP, style/layout implementation or dependency was added.

## Verification and limits

Two focused checks compose the actual app wiring and handler with the shared module: UI and unchanged MIDI API, validation, overlapping intent, replaced tracks/decks and rejected preparation cleanup. Both pass. The browser result proves current DOM/focus and state feedback in that stopped generated-audio setup; it does not prove native held pointer capture, real-time playback continuity, acoustic quality or physical controller behavior. No broad suite, soak or repeated clean listening was run.

The owned diagnostic stopped/cleared its frame and isolated origin, closed its tab/server and removed its two byte-matched copied prototype files. Raw fixture/results remain ignored under `local-evidence/key-shift-controls-2026-10-27/`. No original music, normal profile, recording, desktop bundle or Downloads file changed. New module is included in the existing package manifest for the next inspected candidate.

[Compact receipt](key-shift-controls-2026-10-27.json). Next: package normally and include relevant native key-control use in the existing CORE-LIVE-01 session, without repeating accepted ordinary mixing matrices. Broader DEK-007/CORE-FIX-29 and intermittent Sync-pop/stall criteria remain open.
