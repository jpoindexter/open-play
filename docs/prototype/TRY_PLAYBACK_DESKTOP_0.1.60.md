# Private playback test0.1.60 — staged, not launched

Built from immutable source8bd3d86b4d9a1ffb84ad9ab61c601c19fe353256. The actual archive and controlled packaged-host inspection passed5/5. This does not prove native startup or audio acceptance. The current0.1.59 app/profile and both unversioned launchers are retained.

Includes the real-track-verified Track Details BPM/pending-Sync repair and the controlled-callback-verified deck Tap scoped refresh. All existing layouts, DJ controls and library waveform preview source remain archived without adapter substitution. No new audio algorithm or framework.

When native input is available:

1. Preserve any unsaved recording/work in the current playback test, then quit that version normally. Both versions share the playback-test profile and port18775; do not run them together.
2. Open the root `Start Open Play Playback Test 0.1.60.command`. It was syntax checked, not executed during staging. The app is private, local and unsigned.
3. Check loaded-track/session recovery without automatic playback. For new acceptance, execute one pending-Sync → Track Details BPM save → fresh Sync path and one Tap while holding another control. Preserve all controls/previews/outgoing master; reset only temporary edits afterward.

Use a separate isolated session for diagnostics. Do not repeat the already accepted0.1.53 manual transition, jog/EQ/Cue/clean-stop checks unless the changed implementation or an actual failure warrants it. Keep the next actual pop/stall context; two clean actions cannot establish universal reliability. Independent headphone/controller hardware remains deferred.

[Package receipt](desktop-0.1.60-playback-package.json), [inspection](desktop-0.1.60-playback-inspection.json), [delivery limits](desktop-0.1.60-playback-delivery.json), [Track Details evidence](TRACK_DETAILS_PENDING_SYNC_2026-10-26.md), [Tap evidence](TAP_CONTROL_REFRESH_2026-10-26.md). No public release or merge.
