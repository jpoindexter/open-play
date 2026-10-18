# Calibrated stereo master output — plan121

18 October 2026. Browser source after6a18a28c4c66f84b6425b72e1174bf51ba8c2e9b. This graph/UI change is not in frozen desktop0.1.16.

## Gap and behavior

The former master meter sampled a256frame byte analyser, implicitly combined stereo, multiplied RMS by3 and clamped the result into an uncalibrated0..1display. Opposite-polarity channels could cancel. The master had a hidden fixed0.55gain, no visible master control and no limiter.

The new master control spans−12..+12dB with a0dB default, Control/Cmd-click reset to0 and Alt-click to+3. The preference persists and normal MIDI editor mappings support absolute center/endpoints and relative0.1dB increments. The visible readout names the gain in dB. The meter measures both channels in an audio worklet and displays the higher sample peak relative to nominal, including overload above the threshold. It retains peak300ms and the LIMIT indication750ms after measured reduction. Text supplements the warning color. Existing `meter()` callers receive the stereo peak without the old arbitrary RMS multiplier.

[Official Master Output Level manual](https://support.serato.com/hc/en-us/articles/224966287-Master-Output-Level), read18 October2026, documents the gain range,0/+3reset actions, post-control metering and limiting above the relative+3dB headroom threshold. It also distinguishes Offline Player volume. This does not publish its limiter algorithm, calibration signal or timing.

Independent Open Play policy: master gain is exactly10^(dB/20), followed by an explicit3dB headroom scale10^(−3/20). Pre-headroom peak1 is the displayed0dB nominal reference; displayed+3dB corresponds to the output sample ceiling1. A stereo-linked sample limiter uses instantaneous gain reduction and50ms exponential release, with no lookahead or oversampling. Its envelope is shared across channels. Recording and physical master routing both receive this output. The worklet's statistics retain both channels' peak/RMS, output peaks, reduction and invalid-input count. Nonfinite input samples are sanitized to0 and counted. A processor failure mutes this output and reports an error; that failure route is code-path evidence, not an executed fault-injection test.

**Level change:** the hidden0.55gain is removed. At master0dB below threshold the explicit scale is0.7079458, about2.19dB higher than the old browser default. The existing native16ASAR/profile/level is untouched. The new default is the documented neutral control position; previous recordings/source evidence remain tied to their original graph, not relabeled as this candidate.

## Executed checks

`node scripts/test_master_output.mjs` passes six focused groups on the actual kernel and engine setter: antiphase stereo peak/RMS, exact below-threshold shape/3dB scale, linked limiter ceiling/channel balance, report reset preserving the envelope and release recovery, nonfinite sanitation, threshold/bounds/no implicit AudioContext. The first controlled assertion exposed a−0 reduction report; production reporting now normalizes it to0. No tolerance loosening.

One actual app workflow in isolated port18867 passes on its first browser recording. Owned440Hz/.5peak stereo fixture, right channel opposite polarity, through normal Play/channel/master graph. Production master slider, synthetic Control/Alt modifier events and MIDI editor injection drive the changes. Eleven cases: neutral; GUI−12,+6,+12; reset0/+3; MIDI maximum/center/minimum; relative tenth; pause silence. All UI and engine master gain states agree. The executed modifier events are not a physical keyboard or controller test.

An independent existing `fx-tempo-capture-worklet.js` observer receives the real post-limiter output through a channel splitter and emits only silence to its own output. It captures22Float32 windows,13230samples per channel/window at44100Hz (300ms each). This witness does not use the limiter's own peak calculation. Fixed900ms settling accounts for gain/release/display holds. Declared tolerances: meter.08dB, unlimited RMS2%, limited sample ceiling1.0000001, limited RMS.65..72.

Observed worst stereo-meter error **.000467100dB**; worst unlimited relative RMS error **.000276421**. Both+12overload cases independently capture exact peak **1.0**, RMS about**.7101086** on each channel, with actual LIMIT text/reduction. Non-overload cases recover without LIMIT, and pause captures exact zero on both channels. These are known stationary-signal checks, not a music quality evaluation.

The complete compressed master is finite/stereo: **13.26s,584766frames,44100Hz,201344bytes;SHA2564d6f16dedae8fd6088406197ddb54b436c8fd0e49e2d4ca1706162821af33040**. PCM windows, rather than a lossy codec's reconstructed peaks, prove the sample ceiling. Full reload restores+3dB preference/engine/slider, decks stopped. Ten declared served source hashes are stable across recording and reload and match disk. Recording used physical mute; the freshly reloaded stopped graph is not claimed muted. No broad green suites repeated.

Read `master-output-{contract,browser,live-source}-results.json`. Complete raw report/master/22Float32 captures/source capsule ignored under `local-evidence/master-output/final/`. Normal8768service serves current modules with no-store. Native16ASAR remains a2925237fab3fe2f9064bacb6a62b91cf6cc4f6b02cb166534d90952907076df.

## Remaining scope

Exact reference limiter/knee/release/ballistics/segment layout and Offline Player behavior; reference nominal calibration; intersample true peaks; all master FX/sampler/mono/routing compositions; short transient/browser pressure/failure-injection tests; musical pumping/distortion/listening; physical gain/LED/controller ownership, DAC/sockets and native acceptance remain open. Sample limiting is not a true-peak or acoustic guarantee. This is a substantial MIX-005 browser subset, not full feature/product parity.

All110groups/522requirements plus9beta deltas/26release checks, full flags, original prompt/model+effort routing stay unchanged. Independent full Claude audit unlaunched. User away; no timed hardware capture. Native16/profile/launchers untouched. Physical re-entry remains left Play→deck1/RCA sound→samebuttonstop. Future packaging must declare `master-output.js`, `master-output-kernel.js`, `master-output-worklet.js` as well as earlier `mixer-curves.js`/`stem-crate.js`, and execute a fresh native graph check; do not modify16in place.
