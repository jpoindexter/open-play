# Stateful LPF cutoff, depth and slope changes

18October2026, browser source based on10a41f8. **This change is not packaged in desktop0.1.23. Exact Serato response, physical sound, native execution of this processor and full parity remain unverified.** The prepared23controller test stays unchanged.

## Reproduced playing-audio defect

Plan128 made the six-dB slopes distinct, but their first-order Web Audio IIR coefficients were immutable. A cutoff/depth change returned false from`effect.update`; the owning engine disposed the effect and created one with zero history. A playing generated signal demonstrated the consequence before editing DSP: changing6dB cutoff400→800Hz through the actual advanced Save button produced a0.244793393adjacent-sample jump. The predeclared guard was0.03. Its before/after steady means matched, and the playback voice itself was preserved; the discontinuity came from filter replacement. Stop audio was exactly zero.

The test signal is deliberately diagnostic: DC0.15 plus0.02-amplitude100/2000Hz tones in both channels. Stable LPF DC gain should stay at unity as cutoff changes. This makes a history-reset transient distinguishable from the source's ordinary sample differences. It is not a listening assessment or proof for every musical input. Raw original946415bytes SHA`efd769d802ef683d5204d260a71bafeac7cdcc646ff39135e2d4e79706902a22` is retained privately.

## Implementation and compatibility

`lpf-kernel.js` implements trapezoidal first-order and state-variable low-pass stages in a dedicated AudioWorklet processor. All eight6–48dB branches remain warm; a5ms blend selects a new slope while cutoff/resonance use smoothed AudioParams. Four cascade groups share the even/odd branch stages: ten second-order and four first-order stages, with bounded channel state. No model, external service, account or inference is needed.

This follows published filter mathematics, including[Andrew Simper's trapezoidal state-variable analysis](https://www.cytomic.com/files/dsp/SvfLinearTrapOptimised2.pdf). It preserves the prior Open Play constant-response policy rather than claiming a recovered Serato algorithm. In particular,[Web Audio low-pass Q is measured in dB](https://www.w3.org/TR/webaudio-1.0/#dom-biquadfilternode-q), so each cascade group's damping uses that conversion, not an assumed linear Q. The prior first-order0.49Fs cap and even-stage Nyquist limiting behavior are represented separately. Their extreme/rate-transition permutations were not newly accepted by this test cohort.

LPF cutoff, depth, resonance and slope updates now retain the same processor. Effect name/bypass changes retain the existing slot-replacement behavior. The surrounding dry/wet policy and existing resonance-per-stage mapping remain. A pure6dB first-order branch still has no resonance peak; exact Serato behavior of that control remains an explicit gap. Nothing here establishes a sonic match to Serato.

The new processor is registered in the already prepared effects worklet module; the existing55extended-effect processor body is unchanged. `AudioEngine` already awaits that preparation. Standalone active-LPF callers now also await`prepareExtendedEffects`; four existing browser diagnostic callers were updated accordingly. The advanced dialog's reset note now distinguishes retained LPF updates from other replacements. The packager's future critical-module list includes`lpf-kernel.js`; its recipe version remains23and must be deliberately bumped before another package. No package was built in this unit.

## Executed live workflow

One actual production app workflow drives ordinary advanced Save/depth/Play controls while physical output is muted. Seven states capture actual post-master stereo PCM:

1. 6dB cutoff400→800Hz during playback.

2. 6dB depth100→50% with min400/max4000Hz.

3. Slope6→18dB while keeping the same playback voice.

4. 18dB cutoff→2000Hz.

5. Slope18→6dB.

6. Return to24dB/cutoff500Hz/depth100%.

7. Normal Stop followed by silent output.

All14one-second Float32 windows/44100samples each were independently hash/finite checked. The six transitions preserve the actual playing voice. The original cutoff change's maximum adjacent difference is now0.003851771; the worst across all tested transitions is0.007728055, below the unchanged0.03guard. Steady DC mean changes stay below the unchanged0.005criterion. Both Stop windows are exactly zero.

Avoiding a discontinuity alone could conceal an ignored control or bypass. An independent inspector therefore projects the settled100/2000Hz components and compares them to the analytical native-biquad/one-pole plus dry/wet transfer for each requested endpoint. Fixed1%relative amplitude criteria pass; maximum observed relative error is0.000006722615, approximately0.0006723%. No waveform was fitted to expected output.

The normal Download original report link was executed; its3307532bytes exactly match the retained original SHA`fc46287ad639ec4be60b533b9ed0d6baf3f6c1a2568a34c3f8d8cb05338240bb`. Nine before/after fetched module hashes match final DSP/UI source. `lpf-kernel.js`SHA`c557a18ea0c0f09d171aaa88520314c766c0124b5a3f4eb70e268071d2debef6`;`effects.js`SHA`f1d4a8fc22b4333a95bca2ad89c6898ed77c1a5d840dcddfa197c67684646ab0`.

## Independent native-node comparison and focused neighbors

Eight OfflineAudioContext comparisons cover every slope at48000Hz, cutoff500Hz and resonance1.77. Two distinct stereo signals combine DC, tones and impulses. The production worklet is rendered beside an independently assembled browser-native biquad/IIR chain implementing the prior policy. All32raw output channels/48000samples each are retained and checked sample by sample. Maximum absolute difference is1.490116119×10⁻⁸; maximum relative RMS error is3.872134624×10⁻⁸, below both fixed1e−5criteria. Here “native-node” means browser Web Audio nodes, not the macOS desktop build.

Original comparison JSON8202951bytes SHA`1dfe3f069ed2dd84fc2eb6968506ab2878326a5b88c91df694812863bac0d2bc`. Five fetched before/after source identities match final files. This comparison establishes agreement with the prior independent filter policy on the declared vectors, not every frequency/sample rate or Serato transfer function.

The existing focused lifecycle button also passes5/5: LPF live update/warmed slope, Delay, Reverb/IR replacement, Wah Filter, and Echo→HPF replacement without processor errors. Its LPF preparation and obsolete slope-replacement expectation were updated for the new contract. This checks the changed shared factory/worklet integration; the full59-processor matrix was not repeated. No broad Stems/keylock/native regression matrix was run.

## Current boundary and re-entry

Raw originals,14live and32comparison channels remain in ignored`local-evidence/lpf-live-135/`. Temporary tabs123/124/125closed; only their confirmed-live18876helper was stopped. Main8768remains available. Read-only native AX still shows0.1.23,0playing,both00:00.0,Master−12. Its bundle/profile/272maps/launchers and prepared Hercules route were not modified. Serato was not reopened. The first physical Play test stays pending, with no timed capture while Jason is away.

Remaining: exact vendor response/control mapping, pure6dB resonance, unsupported/nonfinite text validation, extreme/high-resonance/sample-rate/channel-change cases, arbitrary automation/slope sweeps, processor-disposal/resource pressure, long-run CPU/underruns, music/listening and native/physical acceptance. The constant-policy match does not close those requirements. The kernel keeps more stages warm; bounded state is an implementation fact, while sustained performance is unmeasured.

Next concrete browser step: reproduce invalid LPF advanced values being silently saved/falling back, then add explicit validation without losing the last valid live setting. Preserve this new audio evidence and the prepared23app. A later justified desktop batch must deliberately select a new version and exercise this new processor; package23retains the older LPF path. Full110groups/522requirements,9beta deltas/26releasechecks,55extendedFX and Stems/keylock acceptance flags remain unchanged. The full Claude audit remains unlaunched; its handoff is updated with the exact original prompt suffix intact.

[Before audio](lpf-live-before-results.json) · [Live controls/audio](lpf-live-browser-results.json) · [Native-node comparison](lpf-native-node-comparison-results.json) · [Focused lifecycle](lpf-neighbor-lifecycle-results.json) · [Prior slope evidence](LPF_SLOPE_REVIEW.md) · [Prepared desktop](TRY_CURRENT_DESKTOP.md)
