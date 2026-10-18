# Shared stored track gain — plan122

18 October 2026. Browser source afteree75bdf32cf8f13477bea6d8cb9fda1b6a203d6c. Not included in frozen desktop0.1.16.

## Gap and implementation

Decks ignored the per-track gain already used by the sampler. The Analysis gain button moved channel trim and was limited by that trim's+6.02dB range. Sampler advanced gain stopped at+12dB. Re-loading a track did not restore a shared deck gain.

`track-gain.js` now owns a bounded, finite−24..+24dB per-file value. New `trackGainDb` takes precedence; legacy `sampleGain` is read when the new field is absent. Edits write both fields for compatibility. Stored local-file metadata includes the new value. Manual controls are available on each deck, with0.1dB keyboard increments/Shift0.01, Control/Cmd-click zero, and a learnable Deck N track gain MIDI target. Sampler advanced controls use the same value/range. An edit updates all loaded decks and live sampler voices for that file, while unrelated files, channel trim and slot volume stay separate.

Deck sources now feed a per-deck file-gain stage before the existing mixer input/EQ. The separate Stem Slip cue strip has a matching file-gain stage. Sampler voices have their own file-gain stage before slot volume. Routing sampler output into a deck enters its mixer input after the deck file-gain stage, preventing a second application of the loaded deck's file gain. Existing sampler fixed0.5scaling remains unchanged and is not claimed as calibrated reference behavior. The graph retains10ms gain smoothing. Each load/transport start reads current stored gain; asynchronous sampler construction reads it when the voice is created. Backup metadata restore accepts/refreshes gain, but that restore UI path is code-path-only here.

The Analysis button now applies its measured recommendation to stored track gain without moving physical/channel trim. It still requires the selected track in the focused deck. Its existing measurement remains−14dBFS ungated RMS with the existing sample-peak restriction; this is an explicit user action, not perceived-loudness Auto Gain.

[Track Gain Adjust](https://support.serato.com/hc/en-us/articles/234774728-Track-Gain-Adjust) documents shared deck/sampler track adjustment,±24dB, reset and remembered values. [DJ Preferences](https://support.serato.com/hc/en-us/articles/223363407-DJ-Preferences) describes perceived-loudness-based Auto Gain on load and its reference choices. Read18 October2026. Open Play's current RMS measurement does not establish that algorithm. **Use Auto Gain/reference preferences remain stored-only; perceived normalization, its adjustment/reset modes and reference parity remain unfinished.** This implementation is a necessary shared manual-gain path, not a substitute algorithm or full Auto Gain pass.

## Executed evidence

`node scripts/test_track_gain.mjs` passes five focused groups on actual controller/engine methods with controlled AudioParams and MIDI dispatch: legacy precedence/bounds, no implicit audio initialization, two loaded instances/all matching sampler voices, unrelated-file/trim/slot-volume separation, and absolute/relative MIDI values. Main and Stem Slip cue-strip targets agree in this controlled layer; composed Stem Slip rendered audio remains unverified.

One actual app workflow in isolated18868 passes on its first run. Two owned8s stereo WAVs,440Hz/.02peak and880Hz/.03peak, enter through the production File-input change event (synthetic chooser selection), save original bytes in IndexedDB and receive actual analysis. Normal library selection/deck Load/Play, track-gain sliders/reset, MIDI editor, Analysis recommendation, sampler Load/Repeat/Play/advanced controls/output select/stop drive the graph. Fourteen cases cover±24/zero, re-loading the file at+6, measured recommendation without trim movement, live sampler shared gain, other-file isolation, deck-route bypass and full app reload followed by actual saved-file playback at+6.

Independent existing `fx-tempo-capture-worklet.js` records channel0after the master output. Every case has a fixed300ms settling/300ms Float32 window (13230samples at44100Hz). Known-frequency projection tests actual440/880Hz amplitudes against signal construction and gain/route truth. Declared2% relative error and1e−6absent-tone limit; worst observed relative error **3.86698644e−8**, absent tone **1.75473723e−10**. All14whole captured windows are finite. Independent saved-PCM inspection confirms every sample in the sampler-stop window is exactly zero. This is a stationary channel0gain check, not full stereo/transition/phase/music/physical proof.

Whole recordings are finite/stereo/44100Hz:

- First workflow: **7.859977s,346625frames,122050bytes,SHA2564f3a46e09dccc85080254bb14d02d49e2b98d6182edab9c2481a985ffd240305**.
- New-graph saved-file playback: **.599977s,26459frames,9837bytes,SHA256c2a42ada948e88d8caba8881233338ff80409e932a2e487758ba54f241f4ff11**.

Actual reload restores both original Files byte-for-byte, plus `trackGainDb=6` and legacy alias6. Restored-file playback produces the expected+6dB amplitude in a newly created graph. Nine declared served source hashes remain identical across both phases and match disk. Both recordings use physical graph mute; final screen shows0decks playing. No broad green suites repeated.

Read `track-gain-{contract,browser,pcm-inspection,live-source}-results.json`. Full report/masters/Float32 windows/source capsule ignored under `local-evidence/track-gain/final/`. No raw/proprietary/model assets uploaded. Normal8768service serves current source with no-store; native16ASAR remains a2925237fab3fe2f9064bacb6a62b91cf6cc4f6b02cb166534d90952907076df.

## Remaining scope and next step

Implement/validate perceived-loudness analysis before activating Auto Gain. ReplayGain/BS.1770 source research is background, not shipped code or proof of matching Serato. Remaining manual-gain work includes reference UI/Shift-pointer behavior, Alt-Auto-Gain reset, all MIDI resolutions and physical ownership, actual legacy migration/backup import, same-file concurrent slots/load handoffs, rendered Stem Slip/keylock/scratch/FX compositions, pressure/transition/music tests and native/hardware acceptance. Per-file gain does not imply complete MIX-001/ANA-005/SMP-003 parity.

All110groups/522requirements plus9beta deltas/26release checks/full flags/model+effort routing/original prompt are preserved. Full independent Claude audit unlaunched. User away/no timed controller capture; native16/profile/launchers untouched. Physical re-entry remains left Play→deck1/RCA sound→samebuttonstop. Future desktop packaging must include `track-gain.js` and earlier new modules, then execute a fresh native graph test; do not alter16in place.
