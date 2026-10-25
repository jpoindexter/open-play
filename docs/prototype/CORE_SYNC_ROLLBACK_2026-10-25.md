# Original Sync rollback basis — 25 October 2026

Source **5a8f45f** repairs the verified overlapping-request rollback defect tracked in CORE-FIX-08. The same original Simple controller reproduction now ends **nominal1× / audible1×**, original voice retained, no retirements, Sync off and pending/processing clear. **286/286 Node tests pass**, including29 new cases. No UI, real-track playback, PCM/native capture, desktop build or normal-profile action was performed. Audible Sync pops and native stalls remain open.

## Root causes and repairs

An overlapping request saved its predecessor's uncommitted target as `previousRate`. Canceling the latest request therefore restored1.05× instead of the retained voice's original1×. The same defect reproduced in prepared group→group, Sync→group and group→Sync changes. A warped first-primary Sync also saved optimistic control/shared-tempo state from its predecessor.

Both prepared engine rate paths now capture the original nominal rollback basis only while the same pending track, retained voice, start token, controller and requested rate still own the deck. Fresh ordinary/live manual rate owners, committed voices and replacement tracks break inheritance. A warped source's local audible rate is not converted into nominal tempo: actual grid cases retain nominal1× while local rate is0.8×.

Starts that reject in preflight without creating a new generation restore the earlier pending owner and its requested rate. Paused group members have no new start but still inherit an uncommitted group-rate basis while sampler preparation can fail. These paths are deliberately distinguished. Settlement clears only its own pending metadata, releasing previous-owner/audio/controller/track references without clearing a restored owner that is still pending.

Warped-primary Sync captures the prior timeline before revision. It inherits original controls/sharedBPM only for the same owned controller, retained voice, track, rate owner and requested rate. Latest success retains committed state; rejection restores prior controls/tempo; OFF/reset restores the original rate while preserving disabled state. No DSP, scheduler, source clock, fade, layout, control or waveform-preview implementation was replaced.

## Executed proof

- Byte-identical final29cases against immutable5b25836:19fail/10pass; committed source29/29. Simple12:6fail/6pass; shared9:9fail; primary8:4fail/4pass. Compatibility cases are not labeled original defects.
- Cases include2/3 overlapping Simple requests with OFF/Stop/deadline rejection, newest success, manual/replacement/new voice breakers; flat/warped cross-owner groups, preflight owner identity, paused group/sampler failure; primary OFF/reset/mode/rejection, latest success and manual/replacement guards.
- The original parent command was rerun with only its output destination changed. Before: nominal1.05×/audible1×. After:1×/1×, same old voice, zero retirement, both candidates disposed and no pending work. The original RED remains separate.
- Initial implementation exposed a paused-group branch distinction and retained settled ownership references. Their separate REDs are retained; the final regressions cover both. Resource checks establish reference reachability, not a measured heap/GC or native-latency improvement. The shared helper restores prior owners without recursively clearing them.
- Full immutable source286/286; original keylock9, GUI-tempo8, handoff4, Smart-primary5 and FX-engine8 checks pass at controlled scope. Independent shared/combined52, Simple/shared/rate34 and Smart/original47 checks pass; settlement cleanup was reviewed separately.
- Actual controller/module/engine/grid/renderer-validation paths use controlled graph, buffer/cache, clock, live ACK or sampler-preparation endpoints. These do not establish actual DSP/PCM quality, musical timing, physical gestures/MIDI, native frames or audible-pop elimination.

An early Simple test helper accidentally awaited a held request while constructing its wrapper; that canceled-only harness run is excluded. A private diagnostic rerun reused its RED output path; exact RED bytes were restored from the original stdout and verified by hash, with candidate output separated. Accepted baseline proof uses a fresh immutable Git archive and separate outputs. Original source/session/music were not reset or changed by either fixture issue.

## Scope and next gate

The reproduced source rollback gap is repaired; CORE-FIX-08 and related feature cards stay open for current-source native/audio/physical acceptance and other untested interleavings. Prior lifecycle revocation, pending OFF, range/Quantize/orientation retention and library previews remain. All157 Trello cards retain prior list/completion disposition; no new defect card or completion is needed for this existing bug.

Ignored CURRENT_INTEGRATION assets pin5a8f45f with23 selected modules. Exact988/ea70/5e assets and legacy99/ba4 twenty-module comparisons remain separate. Syntax,9trigger/7interval/2injected-script checks, all immutable manifests and eight-original hashes pass. No listener or Electron was launched. Generic Run/turn10 alone does not execute rollback/preflight/paused-sampler fault acceptance.

After unlock, preserve recordings and check the owned local port/process before using the existing isolated, physically muted diagnostic host. From the repository:

```sh
python3 local-evidence/four-deck-stall-capture-2026-10-24/orientation-server.py current
```

In a separate terminal:

```sh
desktop/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron \
  local-evidence/four-deck-stall-capture-2026-10-24/native-orientation-window.cjs current \
  "$PWD/local-evidence/four-deck-stall-capture-2026-10-24/orientation-current-sources.json"
```

Use visible Import/Run for varied-track four-deck controls/previews and the actual orientation trace. Separately capture overlapping requests with latest OFF/Stop/rejection/success, preflight and paused sample-group failure, manual/committed/replacement breakers, first warped-primary state/shared-tempo rollback, and lifecycle live-ACK/manual-intent/OFF behavior. Keep earlier FX/rate/reverse-pitch/held-control checks. Generic trace success cannot replace these event/voice/rate observations.

Retain bounded paused/playing incoming Sync recordings with the outgoing master unchanged and save the next actual pop. Manual transition/EQ/Cue/clean stop, late-song musical grids and independent headphone/master/controller checks remain queued. Normal0.1.52/source df48b50/profile, originals and unrelated files stay separate; these ignored local assets are not distributed in the PR. No full-core/parity or native/audio completion is claimed.

[Source/test receipt](sync-rollback-results.json) · [Trello readback](../delivery/CORE_SYNC_ROLLBACK_RECONCILIATION_2026-10-25.json) · [lifecycle evidence and previous failure](CORE_SYNC_LIFECYCLE_2026-10-25.md).
