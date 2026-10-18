# Core playback milestone — current desktop0.1.21

18October2026. Jason asked whether work was staying on track. The full independent Serato parity goal remains, but recent LPF refinement had drifted ahead of his immediate milestone: usable two-deck playback, manual beatmatching/Sync and the Hercules controls. **First hands-on acceptance is still pending.** More FX research is deferred behind that milestone.

## Outcome and next action

Outcome: load two local tracks, play/cue them, route master/headphones separately, mix and adjust tempo/jog, engage/disengage Sync from the connected Inpulse300Mk2. Done requires observed actual app behavior and Jason's sound/control confirmation; a mapping count or synthetic command cannot establish it.

Now: current authorized native0.1.21 is prepared with named Hercules four-channel output,master1/2,cue3/4,CueMix0%,CueVolume10%,Master−12dB,levels.8/.8,centeredcrossfader,Sync/keylockoff and both decks stopped at00:00.0. Its272mapping export is unchanged. No new native build or engine rewrite was made.

Next when Jason returns: press physical leftPlay once, confirm deck1clock/speaker sound, then press the same button to stop. Give one action at a time; do not start timed captures while he is away. If this fails, fix that exact path before more extras. Following that first pass, test the right deck/load controls, channel/crossfader/EQ/filter and headphone cue, then tempo/jog/manual beatmatch/Sync. Keep each control's observed result separate; do not infer all hardware behavior from one button.

Later: remaining full55FX/Stems/keylock/reference/provider/hardware work stays in the522requirement inventory. It is not a prerequisite for this first controller test. Existing explicit prototype approval permits the local desktop test build; it does not imply full parity or public release approval.

## Executed current native core check

Used the actual0.1.21macOS Electron app's Checks→RapidSyncandPlay→Run button, then the normal native Save dialog. The existing packaged diagnostic opens a volatile session with all device permissions denied and mutes its physical graph before playback. Its own generated24s stereo pulses are placed in production engine buffers; GUI-handler `.click()` commands and MIDI-editor synthetic Note commands exercise production SmartSync/keylocked playback. These are not physical controller input or localFile-import acceptance. Generic harness text saying no native acceptance remains verbatim; the separate nativeEvidence wrapper identifies this actual native execution without promoting full native acceptance.

Both declared GUI-handler and MIDI cases reached BeatSync, counted exactly one playback, and produced six recorded pulse pairs each. Worst measured phase error: GUI1.473922902ms, syntheticMIDI0.521541950ms, against the existing10ms criterion. Queued secondPlay left the deck stopped/notprocessing/notqueued with no extra play count; right-channel RMS2.182099017e−8<1e−4 in its declared window. The existing keylocked secondary is included. This is a finite pulse test, not musical quality, manual beatmatch, every Sync composition, low latency or physical-controller acceptance. No artificial engine delay, new matrix or repeated run.

Original JSON185754B SHAeb404c0c1129b5d081abe380c634d58795cc9a823784989835caa0f7f882cabe retained privately. Complete encoded master SHAc0c41d815ee7a7011fee1f32e2ce7a4d3039be116b982549b90b5c37f19ec8fe. Browser decoded8.339977s/367793frames/44100Hz/stereo. One independentffmpeg Float32 decode is finite/stereo367794frames (one-frame decoder difference); maximumsample.303640455, fixed cancellation-window rightRMS2.182177076e−8. No independent re-fit of pulse timings or acoustic measurement is claimed.

Six actual native served sources match report-before/report-after and immutable package hashes/no-store. ASAR remains9e1aa183fd2959e69eb7eb3fb1c08acf1a3aead3ad98785f47cf7246133d238b; sourceca5da7d7190aead7a605efcc77a70091cb0a1b30,Electron44.9.0arm64. Browser plan127/128waveform/LPF patches remain unpackaged; this report does not relabel them as native.

Closed only the isolated check using its native close button. Main app read-only AX shows exact21title,0playing,both00:00.0,Master−12dB and the named Hercules quad route without MUTED status. Normal mapping export after the check is272entries/64916B/SHA37b61c1dbf16d43a1f14d7d932c88dc3a4d2ba1a062ae23e5175c91d58953864, matching the prepared profile. Synthetic mapping Reset was confined to the volatile check. Main screen restored; no physical capture requested.

## Deferred FX checkpoint

LPF plan128 is committed atb2bc13a61cc95c38f4ec15162adc171c360f9fd0: eight distinct offline slopes, four update contracts and stopped normalUI save/readback. Odd-slope live cutoff/slot reset is still unverified in a playing app; no new LPF test or production edit occurred in plan129. Re-entry after the core milestone: actual muted app LPF6dB playback→savechangedcutoff→measure output/transport continuity, then18dB and topology return. Preserve original reference endpoints and unverified sonic/6dBresonance limits. Do not resume this ahead of a concrete core failure.

[Current test instructions](TRY_CURRENT_DESKTOP.md) · [Native original-scope result](desktop-0.1.21-core-sync-native-results.json) · [Full plan](../../FULL_BUILD_PLAN.md)

Plan130 found and corrected the hardware fader lockout after out-of-range Smart Sync in browser source. [Relative-tempo review](MIDI_RELATIVE_TEMPO_REVIEW.md) records actual audio/OFF/reload/fallback proof. Native21retains old code; prepare22next before testing these advanced fader transitions. Physical firstPlay remains separately pending.
