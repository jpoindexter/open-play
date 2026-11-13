# Simple Sync, reverse pitch and Quantize reliability — 25 October 2026

Source **ea70bc0** repairs three reproduced defects without changing DSP algorithms, clocks, fades, layouts or waveform previews. **221/221 Node tests pass**, including27 new cases. No live UI, real playback, native build or normal-profile action was performed. Audible Sync pops and native waveform stalls remain open.

## Reproductions and repairs

**Delayed Simple Sync overwrote newer transport.** The actual Simple Sync module waited for decoded buffers/transient extraction before claiming an engine start. Its validity check covered track identity and loop/reverse flags, allowing a completed Seek/restart/rate change on the same track to be overwritten. In the same original parent reproduction, a manual Seek's token2/1×voice became token3/1.05× with a second source start. The repaired path aborts and retains token2/1×/the same voice with one start.

Simple Sync now keeps a per-deck request identity and checks captured transport ownership, voice, rate, anchors and metadata after buffer preparation and during transient extraction. The handoff checks current request/leader and incoming BPM/grid/revision again during engine preparation. It allows its own incoming start-token change. Twelve cases pass; final immutable baseline10fail/2pass. Coverage includes grid/transient paths, newer Seek, Stop/restart, tempo/equal-rate owner, primary Seek, overlapping presses, grid edits before and inside engine preparation, completed in-place live Seek and existing paused tempo-only behavior. [CORE-FIX-08](https://trello.com/c/GWdwrMCD).

**Reverse pitch rejection stopped valid audio.** Actual reverse playback at1.01×, Key Shift+24, Key Lock on is legal. Turning Key Lock off exceeds the fallback renderer's combined-pitch bound. The renderer rejected correctly, but the reverse branch had already stopped the voice and retained rejected settings; the next Play rejected too. Ordinary playing reverse now reuses the existing guarded pitch handoff, retaining old audio/settings on failure and using the advancing original-source clock on success. Seven cases pass; immutable baseline4fail/3pass. Forward behavior and existing grid/live/Stem Slip/paused branches remain; explicit reverse scratch/censor exclusions retain their previous dispatch. [DEK-007](https://trello.com/c/HwM8mEac).

**Quantize replaced active controls.** Both per-deck and global Q actions rebuilt every deck/mixer/detail/overview despite changing only snapping flags. The shared local refresh now updates original Q active/pressed states, the global true/false/mixed state and focused-deck presentation. Default/override semantics, unloaded decks and all four saved flags under a two-deck view remain. Missing-control/shape fallback remains; a missing global header no longer crashes fallback, but is not recreated by it. Eight cases pass; immutable baseline6fail/2pass. No new audio, persistence or event-prevention behavior. [CORE-FIX-14](https://trello.com/c/9CeRoVLn) / [DEK-012](https://trello.com/c/OB2JRY59).

## Executed evidence and limits

- Final27-case baseline against immutable f9d2715:20fail/7pass; current27/27. Full current suite221/221.
- Existing GUI-tempo8, live-keylock9, handoff4, FX-engine8 and loop-aware Simple Sync4 checks pass. Independent review reran Simple/alignment/master17, Quantize8 and pitch/rate20 cases.
- These use actual engine/controller/Sync/renderer-validation methods with controlled graphs, clocks, buffers, caches, adapter acknowledgements or DOM endpoints. They do not prove native timing, physical gestures/MIDI delivery, worker/stretch/reversal quality, late-song musical accuracy or audible-pop elimination.
- Early private reproduction lacked controlled graph endpoints; the first test fixture lacked explicit processing/live-position fields. Those fixture failures are excluded from accepted evidence. Final byte-identical tests were rerun against the immutable baseline. Review also caught optional-voices collaborator compatibility and metadata edited inside engine.start; original assertions remain and a new held-resume regression executes RED11pass/1fail→GREEN12/12.
- The gesture-exclusion case was added after the pitch change as compatibility coverage and passes on the original baseline. No claim that every new test demonstrated a defect.
- Pending in-place live-command acknowledgements, Simple OFF/mode cancellation and other untested interleavings remain separate open behavior. Snapshot coverage of a completed live Seek is not proof for these cases.

No controls or waveform-preview implementations were removed. Normal desktop0.1.52/source df48b50, its profile, original music and unrelated brand files remain untouched. No new dependency or broad refactor.

## Ready after unlock

The ignored, isolated CURRENT_INTEGRATION assets now pin ea70bc0 with23 selected modules, including sync.js. Prior5e readiness copies and legacy99/ba4 twenty-module orientation comparisons remain separate. Syntax,9trigger/7interval/2injected-script checks, all immutable source hashes and eight original-track hashes pass. No listener or Electron was launched. The generic Run/turn10 workload does not exercise the new Simple-cancel/reverse-pitch/Quantize cases by itself.

From the repository directory, after checking the owned port/process and preserving recordings, start the existing local-only server:

```sh
python3 local-evidence/four-deck-stall-capture-2026-10-24/orientation-server.py current
```

Then launch the isolated, physically muted host in a separate terminal:

```sh
desktop/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron \
  local-evidence/four-deck-stall-capture-2026-10-24/native-orientation-window.cjs current \
  "$PWD/local-evidence/four-deck-stall-capture-2026-10-24/orientation-current-sources.json"
```

Keep normal52 separate. Use visible Import/Run and varied real tracks for the existing four-deck trace/preview/control checks, then execute the additional checklist:

1. Observe a real four-deck orientation event and current control/preview retention. Keep the older matched99/ba4 comparison separate; do not compare its timing as if only orientation changed in current source.
2. Hold another channel's control while toggling per-deck/global Q and changing a pitch range. Check release, mixed/pressed state and snapping behavior without missing controls or preview redraws.
3. In Simple mode with cold preparation, perform a newer Seek/restart/tempo/grid edit before preparation finishes. Capture event ordering and verify the newer voice/rate wins; also check ordinary successful Sync. These actual timing cases still need execution, and pending live ACK/OFF/mode cases need their own capture.
4. Check legal and rejected reverse Key Lock/shift changes, phase/voice/rate ownership and Stop. Retain current-source FX/rate-failure checks from the previous packet.
5. Capture one paused-incoming and one playing-incoming Sync action with the outgoing master unchanged. Retain the next actual pop and stop repeating clean attempts. Manual listening, transition/EQ/Cue/clean stop and independent headphone/master/controller acceptance remain queued.

These commands/assets are local-only and ignored, not distributed in the PR. Actual execution, native measurements and listening remain unaccepted. This pass closes no broad core or parity card.

[Source/test receipt](simple-sync-reliability-results.json) · [Trello readback](../delivery/CORE_SIMPLE_SYNC_RECONCILIATION_2026-10-25.json) · [previous tempo repairs](CORE_TEMPO_RELIABILITY_2026-10-25.md).
