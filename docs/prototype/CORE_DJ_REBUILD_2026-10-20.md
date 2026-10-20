# Core DJ implementation and local rebuild — 20 October 2026

## Scope and goal

Jason authorized rebuilding the app after the audit/reconciliation. Finish the two-real-track core: load, independent Play, manual tempo/jog, EQ/filter, temporary Cue/latch, mix, Sync/manual return and clean stop. Preserve the existing rekordbox interface, all variants/custom controls and library waveform previews. No new framework, backend, native DSP engine or advanced parity expansion.

## Changes

- Cue ownership: each deck's current audition owns its track/gesture. Revoke synchronously before replacement, eject, explicit stop, fader-start stop, deck-count reduction and shutdown. Recheck after asynchronous seek/start/gesture boundaries. A stale hold cannot latch the replacement track's Play.
- Shortcut safety: guard typing/editable content, composing input and modal and already-handled event state before playback. Only intended Command/Ctrl combinations pass; retain cue deletion, search/Prepare/undo, Option sampler stop. Cue release uses physical key identity despite later focus/modifier/character changes. Full shortcut inventory remains UI-002.
- Sync actions persist and return without deck/mixer replacement. The existing clock refreshes Sync/OFF/MASTER/tempo state in place for both Simple and Smart modes. This is a focus correction, not an established fix for the pop.
- Headphone CUE has a deck-specific accessible label and `aria-pressed`. Help distinguishes temporary deck Cue audition/latch from monitor-bus selection.
- Local desktop0.1.29 packaging uses immutable current source and opens `workspace-preview.html` directly in the existing sandboxed main frame. Existing playback profile/port and permission policy retained; previous bundles untouched. Assert workspace inline bootstrap matches existing CSP hashes rather than relaxing CSP or adding iframe permissions.

## Executed focused checks

Eight new regressions run against the real cue module and actual extracted keyboard handlers with controlled collaborators. Before the patch, five failed: replacement starts B, missing cancellation, modifier fallthrough, typing/composition guards, changed-character key release. After the patch all eight pass, including normal Cue release/latch.

The 19 existing controlled cue/controller lifecycle checks pass. An initial regression suppressed an old preparation error notification; restored existing error reporting and reran that affected suite. Existing tempo-slider model8/8, jog policy and Sync-master checks pass. Syntax/diff checks pass. These do not prove browser/native sound, rendered focus or hardware. No full matrix was run.

## Pending actual acceptance

Packaging/launch and actual native controls must be observed before native readiness claims. Use two real local songs; one manual-tempo/jog/manual transition segment, per-channel LOW/MID/HIGH/reset, temporary Cue release/latch and final silence/stopped timers. Reuse prior accepted playback/crossfader/filter evidence unless this host exposes a regression.

Keep CORE-FIX-01 open: intermittent Sync pop reported, latest actual retry quiet. Capture next actual event; do not patch audio speculatively or repeat clean matrices. Independent physical headphone/master isolation and Hercules remain hardware-dependent. No full core/parity claim.

## Board and re-entry

CORE-FIX-05 https://trello.com/c/x35fpHyL ; CORE-FIX-06 https://trello.com/c/7qQ76Z2V ; parent CORE-001 https://trello.com/c/LGGdtSa3 . Implementation progress recorded without closing broad criteria. Existing133 cards and model guidance remain.

Packaging and actual native startup are recorded below. Next action: use the current0.1.29native window for the practical listening segment. Continue one practical listening session; stop extra polish/research when a core gap is ready to test.

## Native checkpoint0.1.28

Source `b0d607c`, ASAR `880bb08d74bbbc7635a893fe78c4eb117190709e31bfac22fb54907530643cab` launched through CUA as the actual new Electron app. Both saved real MP3s loaded using normal row selection and Shift+Left/Right. Native UI showed independent timer advancement and non-silent master meters for each track, paused counterpart, then both stopped with the meter at −∞. No human listening result is inferred.

Paused incoming Sync matched115.5→121BPM, preserved the same focused Sync button and updated OFF state. Command+I left decks paused. Temporary Cue key press/release returned deck1paused at0; sustained audible audition/latch remains pending. Headphone Cue1selected and deselected exposed the correct deck-specific state; physical routing not tested. All ten library previews were rendered. Private screenshot/AX: `local-evidence/core-desktop-028/`.

Initial all-source archive inspection failed because Electron excludes `prototype/ui/package-lock.json`. Explicitly recorded that development-only omission; runtime inspection then checked520runtime files and all80declared module hashes, staged host/metadata/fixture hashes, exclusion boundaries, entry route, sandbox and device permission decisions (5/5 checks). Both original failed receipt and corrected inspection are preserved. Not a missing runtime module.

A subsequent focused red test exposed already-prevented keyboard events reaching global playback. Added the one-line guard; eight focused tests pass. Final rebuild is0.1.29, retaining0.1.28and all prior bundles. The0.1.28runtime observations remain scoped to that source; observe0.1.29startup and the changed key/control path separately.

## Final current candidate0.1.29

Source `8476d4540e1ae2d3f37de0e903023a30cbda2610`; ASAR `f57ed6327f0512d6d37b64e15a53c59ca1e5c1a234959957409642be27aecb9b`. [Runtime/archive inspection](desktop-0.1.29-playback-core-runtime-inspection.json)5/5 and [actual native observations](desktop-0.1.29-core-observation.json) are separate. Closed the paused0.1.28normally, then launched the exact versioned0.1.29bundle through CUA and observed its title/own-origin workspace. Loaded both saved real MP3s through normal selection plus Shift+Left/Right. Ctrl+O left both Loop In controls inactive and timers at0. Both SyncOFF, pitch0; master−12dB retained from the existing profile. No reset/deletion/profile migration. Ten previews retained; current private screenshot `local-evidence/core-desktop-029/ready.png`.

The only production difference from the observed0.1.28audio candidate is the already-handled-key-event guard. Real-song independent transport/meters, Sync focus and headphone accessible-state observations above remain explicitly tied to0.1.28, not silently promoted to fresh0.1.29listening evidence. New version launch and changed keyboard path were observed. The HTML review banner still says “Desktop app unchanged”; it is historical preview copy, not the native candidate identity shown in the title. Track copy cleanup under existing UI documentation work, not a core audio blocker.

`Start Open Play Current Test.command` and the new versioned0.1.29launcher target this app. Earlier versioned launchers/bundles remain. Source/packaging changes committed; no public release/notarization or full parity claim. Re-entry: use this native window for one manual tempo/jog/manual transition, EQ and temporary-Cue listening session. A readiness question is pending; do not run timed captures while Jason is unavailable. Keep the goal active and the Sync-pop defect open.
