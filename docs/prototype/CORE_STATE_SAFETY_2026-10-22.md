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
- After patch: **50/50 Node tests**, including 15 new state/restore regressions. Real analyzer outputs for generated signal and silence, and all default preferences, survive the validator. Existing tempo (8 checks), jog, keyboard-bend and pending Smart Sync scripts pass.
- Isolated browser origin `127.0.0.1:8872`, actual workspace/file-input handler: four malformed payloads rejected without live/saved mutation; valid backup survived reload with stopped decks; injected quota failure retained edits and warning beyond the old toast timeout; export reached download; successful retry survived reload; malformed startup remained usable, explicit recovery retained original, and next reload stayed stopped. Six integration groups passed.
- 2/4 decks × horizontal/vertical Compact retained Play and mixer controls; eight generated-track library previews were present. Screenshot observation confirmed the current compact interface. The first preview assertion used an incorrect selector, was corrected against the real image markup, and the full test was rerun successfully.
- Harness is `prototype/session-safety-harness.html`, restricted to its dedicated test port and an empty or harness-owned origin. Never point its destructive fixtures at a user profile.

## Boundaries / remaining work

No fresh acoustic listening, hardware routing, real disk-full, crash-during-write, exhaustive legacy migration, malformed IndexedDB media recovery or all-control geometry certification. Browser export handoff was intercepted rather than proving an OS download. Normal audio/Sync behavior is supported by prior scoped acceptance, not retested here. Analysis payload deduplication and decoded PCM bounds remain separate SYS-002/AUD-006 work; full cards stay open. Full core completion remains blocked by the previously documented acceptance/reliability gaps.

Next: finish manual transition with Sync off, per-channel EQ, temporary Cue/release/latch and clean stop; measure/bound inactive decoded resources before wider imports and long sessions. Preserve the intermittent Sync-pop/lag defect.

## Desktop follow-through and compatibility correction

0.1.38/source386e4ab passed archive checks but **failed native existing-profile acceptance**: Setup historically saved numeric ranges as strings; unanalyzed imported catalog entries have `grid:null`. The first validator rejected those legitimate forms. The recovery guard kept the original saved session untouched; no recovery/reset action was invoked. Do not use0.1.38.

Added a failing compatibility regression, accepted finite nonempty numeric strings only for numeric preferences, kept boolean/enumerated/type/range checks strict, accepted the existing null-grid sentinel, and made Setup save numeric inputs as numbers. The full50-test suite and all six actual-workspace browser groups passed again, including a legacy numeric-string restore/reload.

**Current candidate0.1.39**, source`91bfe92ea7da6ba501e019d26414dc9e2cff2e04`, ASAR`8d51547f62b0b8a673a0f2d39bc6102c6d0c9829aee4ea3e7ccebcba97c2ef73`. Archive/host inspection5/5. Actual native launch shows the original16-track library (55:45.6), existing Smart Sync/headphone/master preferences, two stopped decks, mixer and waveform previews, without a save/recovery warning. This proves existing-profile startup, not fresh musical/hardware acceptance. Earlier bundles retained. Current launcher targets0.1.39.

Trello writes are **not verified**. Connector read/write calls repeatedly ended with Transport closed; browser account reports the board is private. One LIB-011 comment attempt has unknown outcome; read it before retrying. Exact pending updates: `docs/delivery/CORE_STATE_SAFETY_TRELLO_PENDING_2026-10-22.md`. No cards were marked complete or moved by this pass.
