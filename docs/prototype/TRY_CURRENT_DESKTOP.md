# Current desktop test: Open Play Playback Test 0.1.16

Open **Start Open Play Current Test.command** or **Start Open Play Playback Test.command**. The 0.1.16 window is already open and stopped: After Hours (124 BPM), Glass Transit (126 BPM), Sync/keylock off, channel levels 0.8, crossfader centered, Master meter zero.

**When you return:** press the left Hercules Play button once, confirm deck 1 starts and the RCA speakers play, then stop with that same button. We will check one action at a time. No timed capture runs while you are away.

Hercules is enumerated connected. The normal main-window mapping export after restart is byte-identical to the pre-switch export: 272 entries, 64916 bytes, SHA256 37b61c1dbf16d43a1f14d7d932c88dc3a4d2ba1a062ae23e5175c91d58953864. This preserves assignments; it does not prove all physical controls respond.

Current explicit route: **Hercules master 1/2, cue/headphones 3/4; Cue Mix 0%, Cue Volume 10%, mute off**. Keep the controller, headphones and speakers connected for hands-on testing. After reload/restart the app returns to system-default stereo. Reapply through Devices → Refresh audio outputs → named Hercules → Use selected output → Four channels → Apply channels. Physical sockets have not been retested on this version.

Executed once on this exact native package: **Checks → Rapid Sync and Play** opens an isolated temporary session, then normal Run/Download captures the real audio engine. GUI and synthetic MIDI rapid Sync→Play both reach Beat Sync with six measured pulse pairs, maximum error 1.156 / 1.406 ms against the existing 10 ms criterion. Rapid Sync→Play→Play cancels with no later counted start or sustained secondary audio. Whole 8.28-second stereo master exported, decoded finite; no acoustic or physical-controller claim. Test fixtures and its two synthetic mappings remain separate from the main profile. Close the check with its red window button; Cmd-W is not supported there.

Source **eaffc59146d40f757ea502f6ac7eb97e0d5a6404**, ASAR **a2925237fab3fe2f9064bacb6a62b91cf6cc4f6b02cb166534d90952907076df**. All 308 prototype files match frozen source; 40 declared modules served by the native host match ASAR with no-store. Includes core keyboard, Censor, mapped-pitch and rapid input fixes through plan112. Existing interface retained. All full Serato parity flags remain unaccepted; full independent Claude audit is unlaunched.

Previous 0.1.15 is preserved: **Start Open Play Playback Test 0.1.15.command** and [historical guide](TRY_PLAYBACK_DESKTOP_0.1.15.md). Close one test before opening another; versions share the dedicated profile and port18775. Stable pre-switch profile backup: local-evidence/profile-backups/playback-before-0.1.16/ (158 files / 8017227 bytes, all hashes match). Earlier bundles remain available too.

[Native observations](desktop-0.1.16-playback-observation.json) · [Scoped review](DESKTOP_0.1.16_REVIEW.md) · [Package receipt](desktop-0.1.16-playback-package.json) · [Full plan](../../FULL_BUILD_PLAN.md) · [Claude handoff](../../handoffs/current.md).

Browser-source plan114 adds [warped-loop Censor](WARPED_LOOP_CENSOR_REVIEW.md); this is not in the frozen0.1.16 desktop candidate. Keep that candidate for the physical core playback test.

Browser-source plan115 adds [selected-stem Censor](STEM_SLIP_CENSOR_REVIEW.md) under the existing independent Stem Slip policy. This is not in the frozen0.1.16 candidate; its physical-test sequence stays unchanged.
