# Audio monitoring: executed browser checkpoint13

17 October2026. New browser cue/output implementation, **not yet in desktop0.1.1**. That existing bundle remains unchanged. Jason separately confirmed its physical Hercules browser-knob library navigation; the prior negative report was a wrong-app observation.

## Real criterion and result

A selected deck must remain in cue when its channel level is zero or its crossfader side is closed, while master recording stays quiet. Cue mix/volume/Master Cue/Split Cue and mono must change the correct buses, stereo physical routing must omit cue, and explicit quad must map distinct pairs. Stem Slip must preserve this through selected/complementary routing, EQ/Channel FX and return to ordinary playback.

- **Executed: offline browser graph18/18.** `audio-monitor-18-browser-results.json` contains actual rendered PCM measurements for explicit channel mapping, gain/blend/PFL/trim, split/mono/Master Cue, mute, capacity rejection and exact-edge cleanup. The initial2/17 and OfflineAudioContext destination-count diagnosis remain preserved. Mono Master Cue follows mono master output. This is one browser's synthetic graph evidence, not physical sockets or universal hardware capacity.
- **Executed: actual AudioEngine/MediaRecorder15/15.** `audio-monitor-engine-browser-results.json` retains all per-channel measures and source hashes. Thirty complete original WebM files remain ignored/local in `local-evidence/audio-monitor-engine-15-final/`. `audio-monitor-evidence-inspection.json` independently matches all byte counts/SHA and current source hashes. Tone/decode checks use settled PCM after the first100ms; encoded recordings are not trimmed. This does not prove earliest-frame continuity, musical quality, physical latency or vendor equivalence.
- **Executed: actual UI/default route.** `audio-monitor-ui-observation.json` and screenshots record cue toggling, Cue Mix50→25→50/reload, refreshed default output, selection/application and safe final master-only state. Only System default was exposed. No specific physical output or quad was selected. Both decks remain paused.
- **Executed: controlled output lifecycle13/13.** Independent `AUDIO_OUTPUT_REVIEW.md` and immutable failure/final result. Parent rerun at current engine is separate `audio-output-current-engine-regression.json`; the original reviewed result bytes remain unchanged. Native setSinkId/enumeration/events are controlled; no actual unplug test.
- **Executed: independent controlled Stem Slip graph6/6.** `STEM_CUE_REVIEW.md`, `stem-cue-independent-results.json`. No unresolved defended defect within its stated cases. Real processor audio/tails are the separate browser layer.
- **Executed regressions:** current engine live orchestration9/9, shadow ownership9/9, Stem Slip kernel/control30/30, recorded in `audio-monitor-*-regression.json`. These do not restore a full keylock continuous-return pass or replace pending native/reference quality checks.

## Reproduced defect and actual fix

The first stronger engine run passed8/9; selected Stem Slip vocal was absent from both cue channels at the opposite crossfader. Its stem route gain preceded the shared cue tap. The complete failure recording and JSON remain in `audio-monitor-engine-stem-slip-failure-results.json` and local-evidence. New pre-route input tees feed a separate cue EQ/Channel FX strip; ordinary and Slip cue gates select one signal path, while selected/complementary main gains retain their existing behavior. EQ automation targets are retained for a strip created mid-ramp. New stem exit effects use the same pre-route inputs. Final15cases include both selections, complementary vocal, changed EQ/filter/Dub Echo, normal-path restoration with a no-double-gain check and global silence.

The first expanded15case run's two failures were test criteria mistakes, preserved in `audio-monitor-engine-15-initial-results.json`: the intentional−12dB EQ output fell below the test's ordinary0.02RMS floor, and the new echo was filled before closing the crossfader. The corrected EQ test retains attenuation and main/cue relative-gain checks with a0.005RMS tone floor; the echo test closes the crossfader before creating that effect. No production defect or magically removed echo tail is claimed. All30 original recordings from that run remain local.

## Implementation and boundaries

`audio-monitor.js` owns only its added nodes/edges. Physical stereo carries master1/2 only; exact4channel matrix can place master1/2+cue3/4 or swap. Output changes reset to stereo; specific selected identity plus available capacity are required for quad. Known identity drift/device-change validation mutes output. Independent controlled failure for drift+enumeration rejection is retained. Real OS fallbacks, sample-rate conversion, channel naming, socket wiring and unplug timing are unverified.

PFL is post-EQ/Channel FX, pre-level/crossfader and includes trim. Deck unit-FX remain in the existing post-channel main chain; no claim that those effects appear in pre-fader cue. Master recording is an independent stereo postmaster connection, before new output mono conversion; selecting Mono does not convert the recorded file to mono. Cue Volume10% unity and maximum+12dB is an independent implementation curve, not a proved exact Serato taper. Mixer curve/assignment preferences outside these controls retain their existing limits. The extra Stem Slip cue processing has not been benchmarked across many stems/decks/rates.

Full1:1 is false. No new public build, native DSP rewrite or physical-output acceptance. Next: frozen-source local desktop test package; actual native output enumeration/selection and explicit physical test with master/headphones. Do not enable quad on system default or infer sockets from4reported channels.

## Reproduce

Use the existing local server at127.0.0.1:8768 and open `prototype/audio-monitor-harness.html`, then Run; separately open `audio-monitor-engine-harness.html`, then Run and download results/captures. The engine harness mutes physical output and captures separate real MediaStream buses. Controlled: `node scripts/test_audio_output_review.mjs` (writes its result filename; preserve earlier immutable result before rerunning) and `node scripts/test_stem_cue_review.mjs`.

## Source snapshot

| File | SHA-256 |
| --- | --- |
| `prototype/engine.js` | `a05bd18fe63d6ad0aee041870699a9c6d7ec9a424370798babf6d69f902b5f57` |
| `prototype/audio-monitor.js` | `31a07bd6277bf19ec05495d207f7228505c8c948a9314531702706596bf4eada` |
| `prototype/audio-output.js` | `8c71a48f800393951f66cf481b2f83b195616d5b8d6174f335b5071007f96150` |
| `prototype/app.js` | `75729a0d34e24932c07eca598c6c7996bc5fa0dbc842f06db0096f60a24ddcf3` |
| `prototype/panels.js` | `aa9ad663f657030a64bedda5b14ba3fcb670ca093f3b63da712cc3406343a86e` |
| `prototype/audio-monitor-harness.js` | `f04246eb0694ecab47228d84c35731958fdaa937f13217b8faef3a7f5590dfa3` |
| `prototype/audio-monitor-engine-harness.js` | `f74ebe9b75778c4a0725ba40e3283b8f749121ec2e14dd92ad571c000eca537e` |

Skills applied: dec-quality-testing, dec-software-principles, adversarial-verify, claude-codex-handoff.
