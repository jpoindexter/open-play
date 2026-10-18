# Current desktop test: Open Play Playback Test 0.1.19

The app is open and stopped. After Hours is on deck 1 at 124 BPM; Glass Transit is on deck 2 at 126 BPM. Both clocks show 00:00.0. Sync and key lock are off, channel levels are 0.8, and the crossfader is centered. Master is −12 dB for the first listening test.

**The selected Hercules route is master 1/2 and headphones 3/4.** Cue Mix is 0%, Cue Volume is 10%, and output is unmuted.

When you return, press the **left physical Hercules Play** once. Check that deck 1 starts and the RCA speakers play; press the same button to stop. Continue one action at a time. No timed capture runs while you are away. Physical sound, buttons and socket isolation on this version still need your confirmation.

Open **Start Open Play Current Test.command** or **Start Open Play Playback Test.command** to return to this build. The normal MIDI export preserves all 272 mappings: 64916 bytes, SHA256 37b61c1dbf16d43a1f14d7d932c88dc3a4d2ba1a062ae23e5175c91d58953864. This preserves assignments; it does not verify every physical control.

After restart or reload, routing deliberately returns to system-default stereo. In Devices, press Refresh, **expand the output dropdown**, select the named Hercules, then Use selected output. If the switch remains MUTED while the engine is stopped, close Devices, set deck 1 level to zero with CUE off, and start it silently. Once the named stereo output settles, reopen Devices, choose Four channels, set master 1/2 and headphones 3/4, and Apply channels. Stop playback before restoring the channel level. The pending-switch explanation in the interface still needs improvement.

The earlier missing-output conclusion was an inspection error: a collapsed native selector shows its selected item. The expanded menu and actual discovery counts show the outputs. No permission change was needed.

Source: 89e464721e9b4a44999dfbe1250024e7e0a1baf6. ASAR: 1df2dca8ad4aa2321bfcc5a4a7f356c9ce9c4f7e610349bd40c2df4ce2157b7d. The 20-case native Auto Gain test was executed on 0.1.17; 0.1.19 retains the same DSP source and adds device-discovery status. That audio evidence remains scoped to 0.1.17. The named four-channel route and mapping export were separately executed on 0.1.19. Full Serato parity remains unaccepted; the independent full Claude audit is unlaunched.

The previous build is preserved as **Start Open Play Playback Test 0.1.16.command**, with its [historical guide](TRY_PLAYBACK_DESKTOP_0.1.16.md). Close one version before opening another; they share the dedicated profile and port 18775. Investigation bundles 0.1.17 and 0.1.18 and profile backups remain available. The separate prototype/Stems service on port 8768 remains running. Bundled research is a frozen snapshot; workspace plan 125 corrects the earlier inspection error.

[Review](DESKTOP_0.1.19_REVIEW.md) · [Native observations](desktop-0.1.19-playback-observation.json) · [Full plan](../../FULL_BUILD_PLAN.md) · [Claude handoff](../../handoffs/current.md)
