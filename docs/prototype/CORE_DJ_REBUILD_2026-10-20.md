# Core DJ implementation and local rebuild — 20 October 2026

## Scope and goal

Jason authorized rebuilding the app after the audit/reconciliation. Finish the two-real-track core: load, independent Play, manual tempo/jog, EQ/filter, temporary Cue/latch, mix, Sync/manual return and clean stop. Preserve the existing rekordbox interface, all variants/custom controls and library waveform previews. No new framework, backend, native DSP engine or advanced parity expansion.

## Changes

- Cue ownership: each deck's current audition owns its track/gesture. Revoke synchronously before replacement, eject, explicit stop, fader-start stop, deck-count reduction and shutdown. Recheck after asynchronous seek/start/gesture boundaries. A stale hold cannot latch the replacement track's Play.
- Shortcut safety: guard typing/editable content, composing input and modal state before playback. Only intended Command/Ctrl combinations pass; retain cue deletion, search/Prepare/undo, Option sampler stop. Cue release uses physical key identity despite later focus/modifier/character changes. Full shortcut inventory remains UI-002.
- Sync actions persist and return without deck/mixer replacement. The existing clock refreshes Sync/OFF/MASTER/tempo state in place for both Simple and Smart modes. This is a focus correction, not an established fix for the pop.
- Headphone CUE has a deck-specific accessible label and `aria-pressed`. Help distinguishes temporary deck Cue audition/latch from monitor-bus selection.
- Local desktop0.1.28 packaging uses immutable current source and opens `workspace-preview.html` directly in the existing sandboxed main frame. Existing playback profile/port and permission policy retained; previous bundles untouched. Assert workspace inline bootstrap matches existing CSP hashes rather than relaxing CSP or adding iframe permissions.

## Executed focused checks

Eight new regressions run against the real cue module and actual extracted keyboard handlers with controlled collaborators. Before the patch, five failed: replacement starts B, missing cancellation, modifier fallthrough, typing/composition guards, changed-character key release. After the patch all eight pass, including normal Cue release/latch.

The 19 existing controlled cue/controller lifecycle checks pass. An initial regression suppressed an old preparation error notification; restored existing error reporting and reran that affected suite. Existing tempo-slider model8/8, jog policy and Sync-master checks pass. Syntax/diff checks pass. These do not prove browser/native sound, rendered focus or hardware. No full matrix was run.

## Pending actual acceptance

Packaging/launch and actual native controls must be observed before native readiness claims. Use two real local songs; one manual-tempo/jog/manual transition segment, per-channel LOW/MID/HIGH/reset, temporary Cue release/latch and final silence/stopped timers. Reuse prior accepted playback/crossfader/filter evidence unless this host exposes a regression.

Keep CORE-FIX-01 open: intermittent Sync pop reported, latest actual retry quiet. Capture next actual event; do not patch audio speculatively or repeat clean matrices. Independent physical headphone/master isolation and Hercules remain hardware-dependent. No full core/parity claim.

## Board and re-entry

CORE-FIX-05 https://trello.com/c/x35fpHyL ; CORE-FIX-06 https://trello.com/c/7qQ76Z2V ; parent CORE-001 https://trello.com/c/LGGdtSa3 . Implementation progress recorded without closing broad criteria. Existing133 cards and model guidance remain.

Next action: package current committed source as0.1.28, verify archive identity, launch the actual new app and record observed workspace/control behavior. Continue one practical listening session; stop extra polish/research when a core gap is ready to test.
