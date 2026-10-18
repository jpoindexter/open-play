# Current desktop test: Open Play Playback Test 0.1.22

The app is open and stopped. Deck1: After Hours,124BPM. Deck2: Glass Transit,126BPM. Both clocks show00:00.0. Sync/keylock are off, channel levels are0.8, crossfader centered, Master−12dB.

**Hercules is selected: master1/2, headphones3/4, CueMix0%, CueVolume10%, mute off.** The normal MIDI dialog enumerates DJControl Inpulse300Mk2 as connected. Its272mapping export is byte-identical to the earlier prepared versions. Enumeration and assignments do not prove every control's physical response.

When you return, press the **left physical Hercules Play** once. Confirm deck1starts and the RCA speakers play, then press the same button to stop. Continue one action at a time. No timed capture runs while you are away. Physical sound, controls and headphone/speaker isolation on this version still need your confirmation.

Open **Start Open Play Current Test.command**, **Start Open Play Playback Test.command**, or the versioned **Start Open Play Playback Test0.1.22.command**. Close one playback version before opening another; they share the dedicated saved profile and port18775. Previous21bundle/versionedlauncher/guide remain available, with a stable closed-profile backup before22.

The core tempo fix is now packaged: SmartSync/REL hardware fader movement, Shift-reposition, immediate secondOFF/reload reset when the physical position is known, and explicit takeover from the next packet when it is unknown. The current native isolated check executes11generated-tone/synthetic-input cases through production handlers and actual output recording; it is not a physical-controller or musical-quality test. Browser waveform127and LPF128changes are also included; their full native behavior is not established by the tempo check.

After restart/reload the audio route deliberately returns to system-default stereo. In Devices: Refresh, **expand the output dropdown**, choose the named Hercules, Use selected output; choose Four channels, master1/2, headphones3/4, Apply channels. This setup was executed in22with both decks stopped, without a Play workaround. Displayed mute reports accepted control state, not measured sound.

Source100eacd6226142ae2ff86876006236991424799d. ASAR28504c15e462e0b2111289991374b7d10506d4c65a3c37dc3f914a8ea2800240. Normal mapping272entries/64916B/SHA37b61c1dbf16d43a1f14d7d932c88dc3a4d2ba1a062ae23e5175c91d58953864. Backup before22:188files/7972892B, hashes equal before/after/copy. Main8768prototype/Stems service remains running.

Full Serato parity remains unaccepted; the independent full Claude audit is unlaunched. GUI tempo-slider position outside the selected pitch range remains a known core display gap. Current native report export used read-only Elements UI copying because this diagnostic has no ordinary download button; no console/injected JavaScript was used. Prefer a direct export action in a later diagnostic update rather than repeating that extraction flow.

[Native22review](DESKTOP_0.1.22_REVIEW.md) · [Native recorded result](desktop-0.1.22-relative-tempo-native-results.json) · [Main setup observation](desktop-0.1.22-playback-observation.json) · [Previous21guide](TRY_PLAYBACK_DESKTOP_0.1.21.md) · [Full plan](../../FULL_BUILD_PLAN.md)
