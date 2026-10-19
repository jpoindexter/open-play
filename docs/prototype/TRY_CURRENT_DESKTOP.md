# Active goal override — CORE DJ ONLY, 19 October 2026

Jason explicitly narrowed the active goal to the core DJ experience. Load two different real local MP3s, one per deck; play/cue/mix, manual beatmatch and Sync, gain/faders/crossfader/master, headphone cue/mix, EQ/filter/cutoff and Hercules core controls. CORE-001: https://trello.com/c/LGGdtSa3. Read docs/delivery/CORE_DJ_FIRST.md and handoffs/core-dj-first.md first.

Before each action, require a direct connection to enabling or verifying that two-track workflow. If work drifts to stems, sampler combinations, advanced FX, video, broad parity research or quick wins, STOP THAT ACTIVITY IMMEDIATELY and return to the next core blocker. The full parity inventory and quick-win candidates are saved for later; neither is an active goal. Preserve the existing implementation and previous builds. Test pragmatically at changed/failing core paths; a practical audible session is the finish line. Existing local desktop-test approval persists; no public release is authorized.

Earlier next-task instructions below, including keyed Stems after checkpoint187, are superseded. Prior evidence and original prompt remain historical records. Do not launch the full Claude parity audit ahead of the core workflow.

---

# Current desktop test: Open Play Playback Test0.1.23

The app is open and stopped. Deck1: After Hours124BPM. Deck2: Glass Transit126BPM. Both clocks00:00.0; Sync/keylock off, channel levels0.8, crossfader centered, Master−12dB.

**Hercules is selected: master1/2, headphones3/4, CueMix0%, CueVolume10%, mute off.** The normal MIDI dialog enumerates DJControl Inpulse300Mk2 as connected. Its272mapping export is byte-identical before/after the isolated checks. Device enumeration and routing assignments do not prove sound or every physical control.

Serato DJ Pro has been closed after its paused reference inspection, so a controller button will not also drive that app. Keep other DJ applications closed during the physical test.

When you return, press the **left physical Hercules Play** once. Confirm deck1starts and the RCA speakers play, then press the same button to stop. Continue one action at a time. No timed capture runs while you are away. Current physical sound, knobs/faders/jogs/pads and headphone/speaker isolation remain pending.

Use **Start Open Play Current Test.command**, **Start Open Play Playback Test.command**, or **Start Open Play Playback Test0.1.23.command**. Close one playback version before opening another; they share the dedicated saved profile and port18775. Previous22bundle/versionedlauncher/guide remain, with a stable closed-profile backup before23.

This build includes both core fixes: GUI tempo does not jump when Sync goes beyond the selected range; Simple Sync controller movement is relative while synced, and one OFF restores the last received absolute controller pitch. Unknown position preserves software tempo until the first packet takes over. Smart Sync first/secondOFF behavior remains separate. Actual native checks executed8GUI key/pointer states and11synthetic-controller/generated-tone audio states, with38retained finite PCM windows and exact stopped silence. Those checks are not physical hardware, music, latency or full-parity acceptance.

After restart/reload the audio route deliberately returns to system-default stereo. In Devices: Refresh, **expand the output dropdown**, choose the named Hercules, Use selected output; choose Four channels, master1/2, headphones3/4, Apply channels. This setup was executed in23while both decks were stopped, with no Play workaround. Displayed mute/routing reports commanded state, not acoustic output.

Source2a334132ca1a423029fceb8aa3e39953655df525; ASARfa4b2c4629a0f313cefc619878bb333f8ae60cbb4d8ac1e5eebcef1bfa58825e. Mapping272entries/64916B/SHA37b61c1dbf16d43a1f14d7d932c88dc3a4d2ba1a062ae23e5175c91d58953864. Backup before23:186files/8031631B, all before/after/copy hashes equal. Main8768prototype/Stems service stays running.

Full Serato parity remains unaccepted; the full independent Claude audit remains unlaunched. The package contains a frozen source snapshot of research; current workspace plan and handoff govern later work. Preserve this prepared app while independent FX work continues.

[Native23review](DESKTOP_0.1.23_REVIEW.md) · [GUI native audio](desktop-0.1.23-gui-native-results.json) · [Simple Sync native audio](desktop-0.1.23-simple-controller-native-results.json) · [Main observation](desktop-0.1.23-playback-observation.json) · [Previous22guide](TRY_PLAYBACK_DESKTOP_0.1.22.md) · [Full plan](../../FULL_BUILD_PLAN.md)

Browser-only plan135 replaces the LPF history-reset path with a stateful processor and measured live cutoff/depth/slope behavior. [Review](LPF_LIVE_REVIEW.md). This is not packaged in23; the prepared core controller test remains unchanged.

Browser-only plan136 rejects invalid LPF advanced edits without changing saved or live settings; valid corrections and Cancel/readback were exercised with captured audio. [Review](LPF_VALUE_VALIDATION_REVIEW.md). Prepared23 remains unchanged and ready for the physical core test.

Browser-only plan137 removes the measured ordinary-loop10ms gap when prepared Stems attach. Keylocked activation still fails a level-dip guard; see [review and retained failure](STEM_ACTIVATION_REVIEW.md). This patch is not packaged in23; the prepared controller test remains unchanged.
