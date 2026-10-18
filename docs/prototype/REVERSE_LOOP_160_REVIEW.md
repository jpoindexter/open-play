# Persistent warped-loop reverse with real prepared music —160

18 October2026, browser source after3d0db1c. **The prototype now plays an active warped loop persistently backward, wraps, returns forward, and stops with actual selected SCNet sources, raw and keylock/key+3.** Full Serato equivalence remains unverified; the frozen desktop0.1.23 is unchanged.

## Reference and implemented behavior

[Keyboard Shortcuts](https://support.serato.com/hc/en-us/articles/233087008-Keyboard-Shortcuts) documents Q/A Reverse. [Beat Sync](https://support.serato.com/hc/en-us/articles/227627128-Beat-Sync) documents matching across Beat Warp Markers. [Tempo Sync](https://support.serato.com/hc/en-us/articles/227627168-Tempo-Sync) documents retaining matched tempo after manual position manipulation without bar lock. The combined persistent reverse/warped-loop policy is not specified there. Current CUA app inventory says Serato is closed. This is an independently implemented composition and explicit open reference question, not observed Serato policy.

Smart Sync now allows an already-engaged reverse loop's transport clock and Play while explicit bar re-alignment still requires forward playback. A direction change moves its state to Tempo Sync. The engine reuses the existing reverse-coordinate/grid planner and periodic loop renderer: raw full-length PCM or rendered musical cycle is reversed, the audio thread advances in reversed grid coordinates, and the public deck clock maps back to original track seconds/loop bounds. Original plus four sources retain the shared voice routing and retirement. No model/worker/postprocessor/reference DSP payload change; no new native package/controller mapping.

## Reproduction and execution

Actual file chooser/import selects the prior private6.8second SDRNR MP3, SHA`cb2e756d1fa4ce264767a4f6adbaf9e3f69a040db7889d830abdb429cc1a5ac3`. Actual Load/Prepare reuses real SCNet job`8266a41f62fc4fc5b92808dd3d988cec`, all four299880frame stereo sources. Same nine cache files/bytes/hashes/mtimes remain unchanged; no inference repeated. Noncommercial research excerpt provenance/quality limits remain in159review; it is not a new holdout or distributable app asset.

The first diagnostic incorrectly demanded1µs seek precision from integer-pixel mouse coordinates. It stopped before Reverse; report9364bytes/SHA`f5921c3a2132d6a76075c284a2971c83f93193ef6ed03a706d4af248eb28ab38` and exact capsule retained. Its corrected10ms mouse-seek criterion reflects the real UI; quantized manual Out still creates exact eight-beat bounds0–4.466666666666667s. This is a diagnostic correction, not a production playback fix.

The second run reaches actual Q on an active120→150→90 warped loop: Reverse stays false, forward playback continues, and notification says the Smart Sync path requires forward decks without Stem Slip. Production failure9505bytes/SHA`5b0af2665f920ee45ab0dad626ea96f2c5c17187677f0ddc889418186f55895e` retained. The engine's additional explicit reverse-loop rejection is removed only after implementing actual playback.

Final actual grid editor/manual IN/OUT/Sync/seek/Stems/Q/Play workflow passes. Original and Vocal gains stay0; Melody/Bass/Drums gains stay1. Two six-second reverse and two two-second forward-return stereo captures include raw and keylock/key+3; final stereo Stop capture is two seconds. Whole ten mono streams retain finite samples, SHA and contiguous producer quanta: reverse264600frames/2068quanta, others88200/690. Both reverse cases wrap; source clocks match independent piecewise beat arithmetic within3.870ms maximum under the predeclared10ms criterion. This is state-clock evidence, not first audible-frame/phase accuracy.

| Case | Settled L/R RMS | Independent raw PCM relative RMS error L/R |
|---|---|---|
| Raw reverse |0.1374557021 /0.1472871568|4.2493416704e−8 /4.2176494256e−8|
| Raw forward return |0.1273723483 /0.1395690718|4.1998166698e−8 /4.2265317803e−8|
| Keylock/key+3 reverse |0.1260804213 /0.1372602236|Not a pitch/direction quality comparison|
| Keylock/key+3 forward return |0.1141129775 /0.1308757431|Not a pitch/direction quality comparison|

Raw comparison uses only observed anchor times and fixed capture+0.3–1.3s, independent known-grid arithmetic and actual hashed exports; no fitted lag/gain/phase. Exact PCM reversal maps sample i to N−1−i, so the declared expected endpoint is source frame−1 on reverse, never an optimized offset. Relative error maximum4.25e−8 is below the predeclared1e−4 guard and establishes raw audio direction, not merely a cursor moving. Periodic keylock path's positive output/control/clock proves that composition executes, not perceptual/pitch/reversed-transient quality. Final Stop+100–250ms peaks0 in both channels under the existing1e−7 functional bound. Physical graph remains muted; tap is internal pre-level, not master/PFL/acoustic proof.

Final original`local-evidence/stem-resource-150/browser-exports/7ecf2a4f9f914de78f3dcb8885eb3903.json`,8865726bytes/SHA`3fc78b914b62460e1542ad855a0042fbf7c6748b2e8197b6d586e83b2c9a0ec7`. Raw PCM/audio/source capsules remain ignored. Independent inspector checks all19 executed source hashes, unchanged original/input/export hashes and all ten full captures. Public results, receipt, screenshot, cache receipts and focused contract results are in this directory. Focused loop/kernel/Smart Sync/reverse-grid checks pass; the periodic offline DSP check was run once. No broad solved FX/controller/tone matrix repeated.

## Remaining gap and exact next step

Non-loop warped reverse remains explicitly refused. In particular, exiting a loop while reversed and related seek/rate/key edits need a complete live reverse timeline rather than a loop-only workaround; do not call the whole Reverse feature finished. In-loop rate/seek/key changes, Censor overlap, races, seamless transitions and exact reference state remain unexecuted here. Continue with `handoffs/stems-160-reverse-exit-followup.md` and reproduce the next missing actual user control before implementing it.

Full110groups/522requirements/9beta/26release/55extendedFX/Stems/keylock scope stays active. Musical source attribution/pitch/perceptual quality, context recovery/full memory/lifecycle, native/hardware/DVS/HID/streaming and full reference acceptance remain open. Frozen0.1.23/tested272Alternative profile/launchers/user8768/18775/18768 preserved. Only owned8799 diagnostics used. No hardware output/timed capture/readiness question, native build or Claude consultation/full audit. Official and Alternative mapping provenance and dated per-feature model/effort routing remain distinct.
