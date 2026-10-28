# Beta status and known issues

This is a private Mac candidate, not an approved public release. Check the window title and supplied build receipt for the exact version. Installation, signing/notarization and clean-machine acceptance are unfinished.

Earlier computer-audio acceptance does not cover every current mode, song, device or long session. Layouts, custom DJ controls and library previews remain available.

## Sync pops and musical alignment

An intermittent pop/click remains open, including with the incoming deck paused. Later clean captures do not resolve it. Estimated grids can align while audible beats remain offset, especially where a song’s timing varies.

Keep the outgoing deck as MASTER. Note Sync mode, positions and playing/paused states; preserve an actual failure once. Different bar numbers alone do not establish failed Sync.

## Four-deck waveform stalls

Waveform/UI stalls remain under investigation. Source repairs preserve controls/previews through affected operations; the Sync presentation repair removes redundant Sync-control writes. Neither establishes stall-free native playback or long-session stability.

Note whether timers/audio also pause and whether a load, analysis, grid edit or Sync coincides. Preserve the library and recording; do not reset the app to troubleshoot.

## Key lock, pitch and Reverse

Some long-file/key-shift/Reverse combinations exceed the pitch-render memory limit. Keep the song unchanged; report duration, key shift, loop/Reverse state and the exact error.

Short-loop, rejected-Reverse and stale-parameter repairs have scoped source/browser evidence. Paused package startup does not establish every native playing/audible transition.

## Local storage and recovery

**Files** reports saved/session-only tracks and offers **Retry local audio storage**. Saving can fail; cleared or space-limited storage affects recovery. Keep original songs separately.

**Export prototype backup** contains metadata/settings/crates, not audio, recordings or a complete session snapshot. Restore updates matching entries. Export current metadata before restoring another file; a session-only result is not durable.

Keep BPM positive on tracks with tempo/warp markers. The current source rejects invalid BPM clears before saving; older private86/87builds can save an invalid warp grid and enter recovery on reload.

Download needed recordings before quitting/upgrading. Broad crash recovery, clean-machine restore and native failed-save/retry acceptance remain open.

## Devices and advanced modes

- Independent headphone monitoring needs suitable channels and **Audio devices and routing** configuration. Computer stereo alone cannot provide it. Physical Hercules/routing/mapping/hot-plug acceptance is pending.
- Provider, external-control and file-operation simulations remain labelled fixtures, not verified streaming, DVS/HID or filesystem services.
- Stems need optional local preparation. Visible advanced controls do not establish full mode/device/vendor parity.
- Keyboard coverage is unfinished. Use current Help; browser-reserved behavior can differ from desktop behavior.

## Report a problem

Use the [Beta bug report checklist](../../.github/ISSUE_TEMPLATE/beta-bug-report.yml). Include:

1. App version/source if supplied, macOS/Mac model, audio output and controller setup.
2. Exact action and steps, expected result and actual result; say if it happened once or repeatedly.
3. Decks, song durations/positions, Sync mode/MASTER, BPM/rate, Key Lock/key shift, loops/Reverse and any concurrent load or analysis.
4. Whether the defect was heard, visible, present in a downloaded master capture, or uncertain; describe how playback and controls recovered.

Show relevant controls/timers/NOW line in screenshots. Describe whether a downloaded master capture contains the defect. Do not attach songs, full mixes, private backups or credentials by default; review images/logs for private paths.

[First-mix guide](QUICK_START.md) · [Current internal evidence and re-entry](../prototype/CORE_DJ_REENTRY_2026-10-28.md)
