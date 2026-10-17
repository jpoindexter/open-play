# Keylock pitch isolation — independent skeptic review

17 October 2026. Skills matched (5): use, adversarial-verify, systematic-debugging, dec-quality-testing, dec-software-principles.

**Confirmed: the shifted-tone miss is present in raw WASM output before MediaRecorder/Opus. Confirmed: insufficient seek history produces the neutral-tone bias in these controlled cases. Refuted: that history shortfall is a sufficient explanation/fix for the shifted left-channel failure.** Production/native006 and its fixed1Hz failed recording criterion remain unchanged.

## Executed input, cohort and raw checks

New independent script `scripts/inspect_keylock_pitch_isolation_independent.py` checked both preserved cohorts: ten initial upstream/production/rate/shift/chunk conditions and eight baseline/history-intervention conditions. Every original raw hash, byte/frame/channel geometry, complete-output finite sample test, module hash and plan hash matches. Each output is441,088 stereo frames at44,100Hz—complete ten seconds rounded up to128-frame quantum. No output prefix/end was discarded.

Both retained14-second source prefixes are **bit-exact Float32 conversions of the original PCM16 WAV divided by32768**. Original metadata is stereo44,100Hz/16-bit/120s, hash99833309…. Independent global-Hann16× spectral measurement in5–7s yields329.99999994/549.99999990Hz; the parent's4× measurements330.000028/549.999971 differ only by numerical estimator resolution. Both steady-window channel RMS values for all18 outputs exceed.001 (36 values, minimum.096604). All commands/accepted schedules preserve rate1/1.08, shift0/+2, source input0 and output.25s; source supply extends beyond the measured/output interval. This is actual vendor WASM under a serial Node clock/message collaborator, not browser/native timing or simulated DSP.

Independent16× global20–20,000Hz search agrees with every parent4× estimate within.001Hz numerical-analysis tolerance; the **1Hz acceptance gate is unchanged**. Initial rate1.08/+2 upstream measures **371.458646/617.934472Hz** and production **371.458646/617.934472Hz**, versus370.412476/617.354127Hz expected. Left remains a failure; right passes. This closely reproduces the frozen native371.458669/617.934592Hz before codec/routing, so codec or main-app routing cannot be the sole cause. Similar upstream/production output excludes the local disposable modifications as the sole cause; it does not uniquely assign fault to the DSP core because both share the processor/host/input path.

At rate1.08, whole versus half-second production input chunks are **bit-identical across the entire raw output** for shift0 and+2. Chunk segmentation is therefore refuted as the cause in these cases; arbitrary chunk schedules/races remain untested. The neutral rate1 raw output has an approximately+.445Hz bias in both channels, so there is a separate smaller issue even without transposition.

## Seek-history mechanism: supported, limited causal reach

The upstream wrapper sets staging `bufferLength=inputLatency+outputLatency` at `prototype/vendor/signalsmith-stretch/SignalsmithStretch.mjs:223`, then repeatedly calls `_seek(bufferLength,rate)` and `_process(0,outputBlockSize)` (`:334`). An independent actual upstream-WASM accessor query at44,100Hz/default reports **inputLatency2646/outputLatency2646/block5292/interval1323**. Thus supplied history5292 is1323 samples/30ms short of block+interval6615.

The saved pinned C++ header explicitly recommends `seekLength()` at `local-evidence/keylock-pitch-upstream-source/signalsmith-stretch.h:138`; `seekLength=block+interval` at`:166`. `seek()` zero-initializes6615 samples and copies5292 with `padStart1323` (`:141`–`:156`). `didSeek` causes past-spectrum reanalysis at the interval offset (`:299`–`:337`). That supports a concrete missing-history mechanism, not a guessed extra delay. However, `PROVENANCE.md:7` pins npm-module bytes; its a670 source/license pin is **not a reproduced C++→embedded-WASM build chain**. Actual geometry/intervention evidence strengthens correspondence without proving that exact header was the compiler input.

The diagnostic allocation intervention retains module/WASM, source, accepted schedule, latency and rate/shift while expanding/rebinding staging to6615 samples (`scripts/diagnose_keylock_seek_history.mjs:29`). Independently measured results:

| Rate / shift |5292-history error Hz, left/right|6615-history error Hz, left/right|
|---|---:|---:|
|1 /0|+.445644/+.445089|approximately0/−.000006|
|1.08 /0|+.430962/+.426652|approximately0/0|
|1 /+2|+1.100389/+.614515|**+1.081625**/+.506132|
|1.08 /+2|+1.046170/+.580346|**+1.037750**/+.470171|

The intervention therefore supports a causal history contribution to the neutral bias in these controlled conditions, while **the shifted left channel still fails** at both rates. Biases are not simply additive: subtracting the neutral offset from the shifted error would predict an improvement the intervention does not produce. Do not label this a complete pitch fix or regrade the original native006 recording.

## Frozen outputs and next boundary

Independent result: `docs/research/KEYLOCK_PITCH_ISOLATION_INDEPENDENT_RESULTS_20261017.json`, SHA **43fb083ac900afd86850e633e640605301eb387d4f0f478a065f9b0d5f3dd5c0**. It retains both cohort identities, all18 full raw checks, fixed-window measurements, original-prefix equality, complete chunk equality and actual-WASM geometry. No production/shared-plan/raw/native/UI/service/Git change occurred; this review and new owned inspector/result are the only outputs.

The next useful distinction is incremental `_process(inputCount,outputCount)` versus constant-seek scheduling under declared identical source/rate/transpose/configuration; retain all output and the same frequency gate. That is an experiment proposal, not an established residual cause. FFT resolution, mapping interpolation, frame rounding and core transposition remain hypotheses until isolated. No reference/music/compound/cursor/hardware/full-native/full-parity acceptance is established here.

Skills applied: use, adversarial-verify, systematic-debugging, dec-quality-testing, dec-software-principles.
