# Current desktop test: Open Play Playback Test 0.1.21

The app is open and stopped. Deck 1: After Hours, 124 BPM. Deck 2: Glass Transit, 126 BPM. Both clocks show 00:00.0. Sync/key lock are off, channel levels are 0.8, the crossfader is centered, and Master is −12 dB for the first listening test.

**The selected Hercules route is master 1/2 and headphones 3/4.** Cue Mix is 0%, Cue Volume is 10%, and mute is off.

When you return, press the **left physical Hercules Play** once. Check that deck 1 starts and the RCA speakers play; press the same button to stop. Continue one action at a time. No timed capture runs while you are away. Physical sound, buttons and socket isolation on this version still need your confirmation.

Open **Start Open Play Current Test.command** or **Start Open Play Playback Test.command** to return to this build. Normal MIDI export preserves all 272 mappings: 64916 bytes, SHA256 37b61c1dbf16d43a1f14d7d932c88dc3a4d2ba1a062ae23e5175c91d58953864. This preserves assignments; it does not verify every physical control.

After restart or reload, routing deliberately returns to system-default stereo. In Devices: Refresh, **expand the output dropdown**, select the named Hercules, then Use selected output. Choose Four channels, master 1/2 and headphones 3/4, then Apply channels. This setup was executed in 0.1.21 with both decks stopped. No silent Play or dialog-reopen workaround is required in that observed path. The former stale MUTED label is corrected; displayed mute describes accepted control state, not a physical sound measurement.

Source: ca5da7d7190aead7a605efcc77a70091cb0a1b30. ASAR: 9e1aa183fd2959e69eb7eb3fb1c08acf1a3aead3ad98785f47cf7246133d238b. Current native evidence proves selection/status/channel setup only. Prior 20-case native Auto Gain evidence remains on 0.1.17; native rapid Sync/Play evidence remains on 0.1.16. Full Serato parity remains unaccepted; the independent full Claude audit is unlaunched.

Previous build: **Start Open Play Playback Test 0.1.19.command**, with its [historical guide](TRY_PLAYBACK_DESKTOP_0.1.19.md). Its claim that Play was necessary to settle selection was superseded: the selected sink had completed, but mute status was stale. Earlier bundles and profile backups remain available. Close one version before opening another; they share the dedicated profile and port 18775. The separate prototype/Stems service on port 8768 remains running. Frozen bundled research may contain earlier hypotheses; workspace plan 126 takes precedence.

[Status review](OUTPUT_SELECTION_STATUS_REVIEW.md) · [Native observations](desktop-0.1.21-playback-observation.json) · [Full plan](../../FULL_BUILD_PLAN.md) · [Claude handoff](../../handoffs/current.md)

Browser-source plan127 adds [waveform position/keyboard feedback](WAVEFORM_SEEK_REVIEW.md). It is not packaged in0.1.21; that prepared desktop and its physical-test sequence remain unchanged.
