# Open Play Playback Test0.1.24 — core decks and waveforms

Built and launched19October2026. Both real local MP3s are loaded and paused at20seconds in the running app. Master is−12dB, Sync off and pitch neutral. Output is system-default stereo; the Hercules is currently unplugged. Previous apps, versioned launchers and saved mappings remain.

This candidate combines the real-song tempo/grid fix with Serato-derived core visuals: compact dark decks/pads/platters/library, continuous decoded-source frequency-colored waveforms, Retina rendering and1–16second detail zoom. The core audio/control bindings remain the existing implementation.

## What ran in this candidate

- Normal selected-track Analyze recovered115.54/121.01BPM on the two saved real songs; each loaded on its own deck.
- Normal native Play/Sync advanced both songs with nonzero master meter; both displayed115.5BPM. OFF plus native tempo key returned independent deck2 control. Both Pause controls returned the master meter to silence.
- Normal source seek and zoom showed both actual waveforms at20s and a2second window.
- Native mapping Export/Save returned exactly272 mappings/64860B/SHA501316918408b3c08d85ce27d284ad9b1f4dc3280fbf86a3583e71e9d7b8d5ba, including corrected right pitch inversion. No mapping replacement or controller test was performed.

These observations do not establish perceived beat alignment, current physical controller response, acoustic headphones/master separation or full parity. Those are the next useful hands-on checks; no advanced features should interrupt them. Both decks are ready for normal Play now. Reconnect Hercules only for the physical/output test, then use Devices to select it and apply master1/2 and cue3/4. Do not run Serato at the same time.

## Identity and recovery

Source2b0c785e567f9dec6b5a1efae70c427ff8be8984; ASAR02d963932ec8b02dc8096ec281bbded68d6091d02bed25d26cecb5e1c0ace635. Actual title and executable0.1.24 observed; six served production files byte-match the source commit. Package inspection passed5checks, including all484prototype files and retained host isolation. This package/host inspection is separate from the native UI observations above.

Shared playback-test profile was copied while0.1.23 was closed:188files/36703429B, full before/after/copy content hashes equal. Private backup: local-evidence/core-design-190/profile-before-0.1.24. Never reset the profile or overwrite the Alternative mappings. Close one playback version before opening another; they share port18775 and the saved playback-test profile. Deck selection/position resets to generated defaults on restart; the real imports and mappings persist. Use the library Load controls to restore the two tracks after a restart. This existing session-resume gap is retained for core assessment, not silently claimed fixed.

Launch with **Start Open Play Current Test.command**, **Start Open Play Playback Test.command**, or **Start Open Play Playback Test 0.1.24.command**. The versioned0.1.23launcher and bundle remain.

[Observation](desktop-0.1.24-playback-observation.json) · [Package inspection](desktop-0.1.24-playback-core-design.json) · [Visual extraction](CORE_DESIGN_190_REVIEW.md) · [Core plan](../delivery/CORE_DJ_FIRST.md)
