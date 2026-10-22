# Core state safety — 22 October 2026

Scope: LIB-011 / SYS-002, the first implementation slice from the 21 October core audit. Existing DJ layouts, controls, waveform renderers and library previews are retained. No audio timing, Sync, EQ DSP, decoder-cache or advanced-feature work is included.

## Changes

- Restore validates a temporary candidate before changing crates, preferences or track metadata. Checks cover scalar types, preference options, finite/ranged values, cue/loop positions, warp grids, analysis display fields, cyclic crate parents and unsafe object keys/colors. Unknown metadata is not assigned to runtime track objects. Older format-1 backups with optional fields omitted remain accepted.
- Artwork/color input attributes are escaped as a second boundary. Backup exports contain supported metadata rather than transient track internals.
- Startup validates saved metadata; rejected originals remain untouched, automatic saves are blocked, and a recovery banner offers original-data export and explicit recovery. Recovery copies the original into a separate localStorage record before replacing the main record. If that copy cannot be saved, the original is not overwritten. Stored audio bytes are not deleted or rewritten.
- Save failures retain a visible warning with export and retry. A successful retry clears it and confirms saving. Restore reports session-only changes if saving fails, rather than claiming success.
- Known source durations constrain cue/loop/warp positions during restore, demo startup and local-file metadata application. Invalid local catalog entries are retained on disk and reported for re-import. Restoring metadata requires paused decks/samples.

## Executed verification

- Before patch: the actual restore handler changed and saved state for invalid cues/settings/color/loops; regression tests failed on those mutations.
- After patch: **49/49 Node tests**, including 14 new state/restore regressions. Real analyzer outputs for generated signal and silence, and all default preferences, survive the validator. Existing tempo (8 checks), jog, keyboard-bend and pending Smart Sync scripts pass.
- Isolated browser origin `127.0.0.1:8872`, actual workspace/file-input handler: four malformed payloads rejected without live/saved mutation; valid backup survived reload with stopped decks; injected quota failure retained edits and warning beyond the old toast timeout; export reached download; successful retry survived reload; malformed startup remained usable, explicit recovery retained original, and next reload stayed stopped. Six integration groups passed.
- 2/4 decks × horizontal/vertical Compact retained Play and mixer controls; eight generated-track library previews were present. Screenshot observation confirmed the current compact interface. The first preview assertion used an incorrect selector, was corrected against the real image markup, and the full test was rerun successfully.
- Harness is `prototype/session-safety-harness.html`, restricted to its dedicated test port and an empty or harness-owned origin. Never point its destructive fixtures at a user profile.

## Boundaries / remaining work

No fresh acoustic listening, hardware routing, real disk-full, crash-during-write, exhaustive legacy migration, malformed IndexedDB media recovery or all-control geometry certification. Browser export handoff was intercepted rather than proving an OS download. Normal audio/Sync behavior is supported by prior scoped acceptance, not retested here. Analysis payload deduplication and decoded PCM bounds remain separate SYS-002/AUD-006 work; full cards stay open. Full core completion remains blocked by the previously documented acceptance/reliability gaps.

Next: finish manual transition with Sync off, per-channel EQ, temporary Cue/release/latch and clean stop; measure/bound inactive decoded resources before wider imports and long sessions. Preserve the intermittent Sync-pop/lag defect.
