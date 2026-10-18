# Current desktop test: Open Play Playback Test 0.1.15

Open **Start Open Play Current Test.command** or **Start Open Play Playback Test.command**. The 0.1.15 window is already open. After Hours (124 BPM) and Glass Transit (126 BPM) are at 00:00, stopped, with Sync and keylock off. Master is zero, channel levels 0.8 and crossfader centered.

**When you return:** press the left Hercules Play button once, confirm deck 1 starts and the RCA speakers play, then stop with the same button. We will check one action at a time. No timed controller capture runs while you are away.

The 272-entry v9 mapping export is byte-identical to the saved 0.1.14 export. Hercules is enumerated as connected. Most physical assignments still need your hands-on test; enumeration/export are not proof of knob response. No hardware output, LED, SysEx or firmware changes.

Current explicit route: **Hercules master 1/2, headphones 3/4; Cue Mix 0%, Cue Volume 10%, mute off**. After reload/restart, routing returns to system-default stereo. Devices → Refresh audio outputs → named Hercules → Use selected output → Four channels → Apply channels. Keep the controller, headphones and speakers connected for the hands-on test. The frozen bundled guide's sentence “Output starts muted” is inaccurate; actual startup Devices reports system-default stereo without MUTED. This workspace guide corrects it.

Executed on this exact package through its normal GUI: both keylocks, secondary key+2, two-deck Play and Sync at 124 BPM; live secondary key+3 and primary tempo+8% transfer both displayed tempos to 133.9 BPM. Master remains nonzero. Both decks then stop. Normal REC/Save exports a whole 46.38-second, 602103-byte stereo Opus capture with finite/nonzero PCM (48 kHz decode; engine is 44.1 kHz). This checks native audio generation/export, not audible speaker output, pitch/phase accuracy or physical controls. Browser numerical audio measurements remain separate evidence.

All 29 declared served modules match actual ASAR hashes with no-store. Source: **02ddc7586476e45e7e40a6cccb30fa40ca8a3639**. ASAR: **7430617a44d7a23ff25e41342cf231d35397309ef2bc093a1ff962d25fa1fbf3**. Includes playback fixes 100–102; interface retained. Full Serato parity remains open.

Previous 0.1.14 remains available with **Start Open Play Playback Test 0.1.14.command** and its [historical guide](TRY_PLAYBACK_DESKTOP_0.1.14.md). Earlier versions remain too. Close one playback test before opening another; they share the profile/port 18775. Stable pre-switch profile backup: local-evidence/profile-backups/playback-before-0.1.15/.

[Native observations](desktop-0.1.15-playback-observation.json) · [Package receipt](desktop-0.1.15-playback-package.json) · [Full plan](../../FULL_BUILD_PLAN.md) · [Claude handoff](../../handoffs/current.md).

Browser-source plan106 adds variable-pitch warped resampling and an explicit-anchor refill correction. Those changes are outside this frozen0.1.15package; current native/controller testing retains the scope above.

Browser-source plans109–111 add repeat-safe keyboard playback, held pitch bends, basic Censor and non-loop warped Censor in both keylock modes with prepared-source routing. These changes are not in0.1.15. The next fresh package must declare censor.js, censor-backing.js, reverse-censor-plan.js and pitch-time-map.js; keep this version available for the current controller test.
