# FX behavior contracts — reference evidence and independent implementation

Reference: **Serato DJ Pro 4.0.10.213 arm64**. Research date: **2026-10-16**.

**These 59 contracts do not close sonic parity.** They define measurable functionality for independent processors, while keeping the reference gaps explicit. The independent kernel suite now passes80/80 checks. That proves the specifically tested independent behavior, not Serato equivalence; the full proposed acceptance row is not automatically passed by the general signal checks.

## Evidence boundary

The installed catalog establishes 59 names. Direct observation now inventories all59 advanced strips and236 labels; see [the complete observed schema](FX_OBSERVED_PARAMETERS.md) and [machine-readable observations](fx-observed-parameters.json). Eighteen OCR omissions were subsequently resolved by manually reading the original screenshots. The public DJ manual documents shared controls but does not supply individual algorithms. Serato says the effects were redesigned in 3.2.0, so historical iZotope descriptions cannot establish 4.0.10 behavior. HEX FX has a detailed effect list but is a different product. Do not copy that list into DJ Pro parity claims.

The independent designs below are deliberate engineering proposals. In particular, the distinction between named variants such as Version Echo, Space Invader, Pulse Spiral and the Out FX remains unresolved. A useful audible processor can be implemented now; exact matching still requires reference observations and audio measurements.

## Shared contracts

- **Documented:** Two units with individual channel assignments; master assignment excludes individual channels.
- **Documented:** Beat duration is 60/BPM times the selected beat value.
- **Documented:** Depth usually spans dry to wet; the manual qualifies this, so Out FX require separate measurement.
- **Documented:** A-D banks recall effects and unit beat values. Advanced selection is distinct from effect enable.
- **Documented:** Advanced presets can be saved under USER and reset to defaults.

## Validation protocol

- All values remain finite at minimum/default/maximum controls, including zero input.
- Depth zero nulls against a latency-aligned dry reference below -90 dBFS unless an explicitly documented generator mode is selected.
- Changing an assigned unit audibly affects only its assigned channels; master assignment affects the complete mix exactly once.
- Processor state survives UI redraws; bypass/re-enable behavior is specified and tested.
- Test at both 44.1 and 48 kHz, mono/stereo, and BPM 60/120/180; sample-rate changes preserve seconds/beat timing.
- Use 5 ms or longer parameter ramps where appropriate to prevent switching clicks; capture/retrigger crossfades are explicit.
- Delay/reverb tails keep processing after source silence until decay completes; stop-all clears feedback buffers and prevents orphan voices.
- A slider test must demonstrate measured audio change, not only a label or state update.
- Record real UI paths as well as offline signal tests; a processor test alone does not establish the routed browser behavior.

Record input fixture hash, reference version, sample rate, BPM, channel assignment, depth, parameter values, trigger time and output hash. Use isolated impulse, two-tone, noise, sustained sine and uniquely marked phrase fixtures. Do not compare only music by ear. Capture dry, active, bypass, paused-source and reset cases. Measure peak/RMS, spectral response, repeat timing, pitch, interchannel energy and tail duration as applicable. Thresholds below are proposed acceptance tolerances, not measurements of Serato.

## Direct reference work needed first

1. All59 advanced labels are now captured. Enumerate selectable modes and actual minimum/maximum values without assuming session values are defaults.
2. For Out FX, compare depth 0, 0.25, 0.5, 0.75 and 1; enable before/after changing depth. Insert a unique new marker after activation to determine whether input remains live. Observe source position separately from the effect return.
3. For loopers, change division during playback, then disable; identify capture alignment, recapture policy and whether the continuing source timeline is restored.
4. For Infinity/Spiral/Tone effects, capture noise and sine to distinguish filters, delays, pitch shifters, oscillator generation, direction and wrap behavior. Do not use a generic tremolo for all names.
5. Compare stopping the source, lowering its fader, disabling FX, switching the selected effect, loading another track and stop-all. These are distinct tail-lifecycle cases.

## Earlier four-strip baseline

| Effect | Observed session values |
|---|---|
| LPF | Resonance: 1.77; Slope: 24 dB; Min Freq: 200 Hz; Max Freq: 20.0 kHz |
| Delay | Feedback: 40%; HPF: 20.0 Hz; Drive: 0%; Beat Modify: 1 |
| Reverb | Decay: 1.50 s; Contour: 0%; Width: 100%; Mix Mode: Wet Mix |
| Wah Filter | Resonance: 8.00; Range: 4.00 octaves; LFO Depth: 0%; Rate: 2 |

Values above are neither verified factory defaults nor range limits.

## Per-effect contracts

Every realization, control list and numeric tolerance below is **proposed independent behavior**. All per-effect Serato trigger, tail, control range and sonic-response contracts remain unverified. Catalog evidence applies to each row; the complete59-strip observation now supplies label/value evidence. The earlier four-strip table remains historical context.

### Delay & Echo

| Effect | Independent behavior | Proposed controls | Measurable acceptance |
|---|---|---|---|
| Delay | Timed feedback delay with a high-pass feedback path and optional soft saturation. | Feedback, high-pass cutoff, drive, beat multiplier. | Impulse repeats recur at T = 60/BPM × beats; consecutive amplitudes follow the configured feedback ratio within 5%; zero feedback yields one delayed impulse. |
| Echo | Feedback delay with progressively darkened repeats. | Feedback, damping, beat multiplier. | A broadband burst produces at least three decaying repeats; later repeats have less high-frequency energy than the first. |
| Low Cut Echo | Feedback echo whose repeats pass a high-pass filter. | Low-cut frequency, feedback, beat multiplier. | A 100 Hz + 4 kHz burst shows at least 12 dB less 100 Hz energy in the repeats after raising low-cut to 1 kHz. |
| Multi Tap Delay | Three independently weighted delayed taps with a shared tempo. | Tap offsets, tap levels, feedback. | An isolated impulse produces the configured three time offsets; moving one offset moves only the corresponding first-cycle peak. |
| Ping Pong Delay | Cross-feedback stereo delay alternating sides. | Feedback, stereo width, beat multiplier. | A centered impulse produces alternating L/R repeat energy; each alternating peak exceeds the opposite channel by at least 12 dB at full width. |
| Spiral Echo | Pitch-shift each trip through a feedback delay using an independent pitch shifter. | Pitch per repeat, feedback, beat multiplier. | A 440 Hz burst produces successive repeats at 440 × 2^(n × semitones/12) within 3%; repeats must not all have the same frequency. |
| Version Echo | A proposed saturated, band-limited feedback echo variant; distinction from Echo must be measured before claiming fidelity. | Drive, feedback, high-pass cutoff, beat multiplier. | At nonzero drive, sine input produces harmonics above the clean Echo control; compare matched feedback and delay to isolate the change. |

### Distortion

| Effect | Independent behavior | Proposed controls | Measurable acceptance |
|---|---|---|---|
| Bit Crush | Uniform amplitude quantization and sample-and-hold rate reduction. | Bit depth, reduction factor, wet mix. | At full wet with dither disabled, a ramp uses no more than 2^bits quantization levels; held samples remain identical for the configured reduction factor. |
| Distortion | Memoryless saturating nonlinear transfer with gain compensation. | Drive, tone, output gain. | A sine develops harmonic energy that increases with drive; output remains finite and bounded at maximum drive. |
| Lo-Fi Crush | Quantization/rate reduction plus a low-pass coloration stage. | Bit depth, sample-hold rate, low-pass cutoff, drive. | Increasing reduction lowers the number of amplitude steps; decreasing cutoff attenuates high-band energy relative to Bit Crush at identical bit settings. |
| Lo-Fi Warmth | Soft saturation with low-pass coloration and small deterministic wow modulation. | Drive, cutoff, wow depth/rate. | A sine shows harmonics and pitch sidebands with wow enabled; wow at zero removes those sidebands while preserving the nonlinear harmonics. |
| Sizzle Crush | Quantization/rate reduction with emphasized upper-band distortion. | Bit depth, reduction factor, high-band emphasis. | At matched bit depth, output high-band energy exceeds the neutral Bit Crush control; emphasis at zero removes that difference. |

### Filter

| Effect | Independent behavior | Proposed controls | Measurable acceptance |
|---|---|---|---|
| Combo Filter | A bipolar low-pass/neutral/high-pass sweep with a neutral center. | Cutoff position, resonance, slope. | Centered position approximately nulls against dry; opposite extremes respectively suppress 8 kHz and 100 Hz by at least 12 dB on a two-tone input. |
| Drive Filter | A resonant filter preceded by controllable saturation. | Filter type, cutoff, resonance, drive. | Changing cutoff moves the measured pass-band edge; increasing drive adds harmonics at unchanged cutoff. |
| HPF | High-pass biquad or cascaded biquads. | Cutoff, resonance, slope. | At cutoff 1 kHz, 100 Hz output is at least 12 dB below 4 kHz output; the response changes when cutoff changes. |
| Infinity Filter | Proposed continuously cycling bank of overlapping resonant sweeps with fade-in/out at wrap boundaries. | Sweep direction, rate, center frequency, band spacing. | A spectrogram shows multiple continuously moving peaks across repeated cycles; no global reversal occurs at wrap and sample discontinuities stay below the chosen click threshold. |
| LFO Filter | Low-pass or band-pass cutoff driven by a tempo-synchronized LFO. | Cutoff range, resonance, LFO depth/shape/rate. | Noise-band energy oscillates at BPM/(60 × beats) within 2%; LFO depth zero removes periodic cutoff movement. |
| LPF | Low-pass stages with resonance and selectable slope, swept between explicit bounds. | Resonance, slope, minimum/maximum frequency. | At cutoff 1 kHz, 8 kHz output is at least 12 dB below 100 Hz output; 24 dB/octave mode attenuates the high band more strongly than 12 dB/octave. |
| Wah Filter | A resonant band-pass sweep with manual center and optional LFO modulation. | Resonance, octave range, LFO depth/rate. | Noise exhibits a moving narrow spectral peak; range changes its frequency span, while depth zero removes automatic movement. |

### Looper

| Effect | Independent behavior | Proposed controls | Measurable acceptance |
|---|---|---|---|
| Repeater | Capture a tempo-length section in an FX ring buffer and repeat it while the source continues. | Capture length, repeats, retrigger, mix. | A unique numbered click sequence repeats the captured section; dry transport after bypass is at the current source time, not the capture point. |
| Retro Halftime | Capture a phrase and read it at half speed, with explicitly selectable pitch-preserving or resampling treatment. | Phrase length, speed, pitch preservation. | The captured transient spacing doubles; resampling lowers 440 Hz to 220 Hz, while pitch-preserving mode retains 440 Hz within 3%. |
| Roll | Capture a beat-sized fragment and repeat it while enabled. | Roll length, quantize, mix. | Impulse spacing equals the selected roll division within one render quantum; bypass restores the continuing source. |
| Slip Roll | Recapture the rolling fragment when the subdivision changes, with an uninterrupted dry timeline. | Roll length, recapture, quantize. | Changing subdivision during a click sequence replaces the repeated fragment; bypass aligns to the uninterrupted reference timeline within one render quantum. |
| Stretch | Granular or phase-vocoder processing of a captured section with independently controlled duration and pitch. | Stretch ratio, grain size, pitch. | A transient pair doubles its separation at stretch 2 while a stable 440 Hz tone stays within 3%; disabling reveals current dry source time. |
| Stutter Repeater | Gated repetitions of a captured tempo fragment with a configurable duty cycle. | Fragment length, gate duty, count. | Measured envelope contains repeated fragments separated by near-silent windows matching the configured duty cycle. |
| Stutter Roll | Beat roll with rhythmic sub-gates inside each repeated fragment. | Roll length, sub-gate count/duty. | A sustained captured tone has the requested number of gate pulses per roll; changing roll length changes cycle time without changing pulse count. |

### Modulation

| Effect | Independent behavior | Proposed controls | Measurable acceptance |
|---|---|---|---|
| Chorus Basic | Two short modulated-delay voices mixed with dry signal. | Delay, modulation depth/rate, width. | A steady sine gains symmetric sidebands; modulation depth zero removes the moving sidebands; dry timing remains unchanged. |
| Chorus Quad | Four independently phased modulated-delay voices. | Voice delay, depth/rate, phase offsets, width. | Impulse/sideband analysis demonstrates four distinct delay trajectories at maximum separation; it must not alias a two-voice chorus preset. |
| Falling Flanger | Short-delay comb filtering with a downward-only repeating sweep and crossfaded resets. | Sweep range/rate, feedback. | A noise spectrogram shows consistently descending comb trajectories; resets are crossfaded rather than a sudden full-band jump. |
| Flanger | Short variable delay plus feedback producing moving comb notches. | Delay, modulation depth/rate, feedback. | Noise reveals multiple comb notches whose spacing changes periodically; feedback increases resonance without instability. |
| Infinity Flanger | Proposed staggered one-direction comb sweeps with complementary envelopes. | Direction, rate, feedback, spacing. | Comb trajectories continue in one direction over at least three cycles without a common turnaround; output remains bounded at maximum feedback. |
| Pansformer | Proposed stereo-alternating rhythmic gate. | Rate, duty, stereo width. | L/R energy alternates at the configured division, with silent gate windows; width zero centers the processed signal. |
| Phaser | Modulated all-pass cascade mixed with the source. | Stages, center/range, rate, feedback. | Noise exhibits moving non-equidistant cancellation notches; disabling modulation fixes those notch positions. |
| Pulse Spiral | Proposed pitch-motion processor combined with a rhythmic amplitude envelope. | Pitch direction/rate, pulse rate/duty. | A sustained tone exhibits both monotonic pitch motion within each crossfaded cycle and envelope pulses; zero pulse depth leaves the pitch motion. |
| Spiral | Proposed continuous pitch-motion processor with crossfaded overlapping grains. | Pitch direction, sweep range/rate, feedback. | A sine spectrogram demonstrates directed pitch motion over repeated cycles; stereo and envelope remain bounded at grain wraps. |
| Transform | Tempo gate approximating rhythmic crossfader cuts. | Rate, duty, smoothing. | The output envelope has the expected on/off ratio and period; closed windows are at least 60 dB below open windows at full depth. |
| Tremolo | Smooth amplitude modulation. | Depth, rate, waveform. | A sine amplitude envelope oscillates at the configured LFO rate; depth zero nulls against the dry signal after latency alignment. |

### Out FX

| Effect | Independent behavior | Proposed controls | Measurable acceptance |
|---|---|---|---|
| Brake Echo | A resampling brake feeding an echo return. | Brake duration/curve, echo time/feedback. | A sine frequency decreases toward zero over the specified duration; delayed copies persist after the brake reaches silence. |
| Brake Rewind | A buffered slowdown followed by negative-rate rewind playback. | Brake duration, rewind speed/duration. | A non-symmetric chirp slows then reverses its temporal order; endpoint discontinuities are faded, and transport remains unchanged. |
| Braker | A triggered resampling slowdown ending in silence. | Brake duration, curve, retrigger. | Instantaneous frequency of a 440 Hz tone falls over the defined interval and output RMS reaches the specified silence floor afterward. |
| Clean Echo Out | Capture a clean echo tail while closing the live input path. | Echo time, feedback, capture trigger, dry fade. | After capture, a later unique input marker is absent from output while earlier echoes decay; new input must not keep feeding the tail. |
| Clean Rollout | Capture a fragment and repeat/fade it without added distortion or filtering. | Roll division, exit duration, fade curve. | Only the captured marker repeats; amplitude decays monotonically to the silence floor without extra harmonic content. |
| Combo Fade Echo | Fade the dry source while introducing a filtered echo return. | Fade duration, filter sweep, feedback. | Dry marker amplitude falls while delayed marker peaks remain; filter movement measurably changes their spectral centroid. |
| Echo Out | Capture/freeze a feedback echo while suppressing subsequent dry/live input. | Capture threshold, feedback, echo time. | A post-trigger marker is absent while pre-trigger repeats remain; feedback below unity decays, and the deliberate hold setting remains bounded. |
| Epic Stretch Rewind | Pitch-preserving granular stretching followed by a reversed captured phrase. | Stretch duration, reversal timing, pitch/size. | A phrase becomes longer with its sustained pitch retained, then replays in reverse marker order; one uninterrupted forward reader does not pass. |
| Roll Out | Capture a tempo fragment, progressively alter roll length, and fade its output. | Initial/final division, exit duration, curve. | Inter-repeat intervals follow the programmed progression and output reaches silence; a fixed-length unchanged roll does not pass. |
| Short Brake Echo | A shorter brake envelope feeding an echo return. | Short brake duration, echo time/feedback. | Measured brake duration is shorter than Brake Echo at the designated comparison presets, while echo tail remains audible after the brake ends. |
| Slow Roll Out | Capture a fragment with progressively lengthening repeats and an exit fade. | Initial division, expansion rate, fade duration. | Measured inter-repeat intervals increase over time; dry source markers after capture remain absent. |
| Turntable Brake | A triggered resampling slowdown with a curved inertia profile and end fade. | Stop duration, curvature, restart behavior. | A sine descends in pitch with the configured nonlinear curve; changing stop duration changes time-to-silence without changing initial pitch. |

### Reverb

| Effect | Independent behavior | Proposed controls | Measurable acceptance |
|---|---|---|---|
| Bright Reverb | A dense reverberator with lightly damped high frequencies. | Decay, brightness, pre-delay, width. | An impulse produces a decaying diffuse tail; high-band tail decay exceeds the corresponding dark setting at matched broadband decay. |
| Empty Mall Verb | Proposed long, sparse early reflections feeding a diffuse tail. | Reflection spacing, decay, damping, width. | Impulse response shows separately measurable early echoes before the dense tail; this profile differs from generic Reverb at matched decay. |
| Epic Reverb | Proposed long, dense, wide reverberation. | Decay, density, width, pre-delay. | An impulse yields a longer decay and lower late L/R correlation than baseline Reverb at declared preset settings. |
| Epic Reverb Drop | A reverb-exit processor that closes dry/live input while retaining a dense decay. | Trigger, fade, decay, width. | A post-trigger input marker is absent; the pre-trigger reverb tail persists and decays; bypass/reset behavior is repeatable. |
| Next Door Verb | Proposed low-pass colored reverberation suggesting sound through a barrier. | Cutoff, damping, decay, wet mix. | An impulse tail has at least 12 dB less high-band energy than Bright Reverb at matched decay; cutoff moves the measured roll-off. |
| Reverb | An independent diffuse reverberator with decay, tonal contour and stereo width. | Decay, contour, width, wet-mix mode. | Impulse decay time follows configured duration within a declared tolerance; width zero produces equal L/R output and nonzero width decorrelates the tail. |
| Vast Reverb | Proposed very long late reverberation with broad stereo spread. | Decay, size, density, width. | Measured tail duration exceeds baseline Reverb at the declared preset; long tails remain finite and decay without CPU or energy growth. |
| Vast Verb Drop | A long reverb-exit effect with captured tail and live-input cutoff. | Trigger, decay, input fade, width. | A late test marker is rejected after capture while the long tail continues; explicit stop clears the tail safely. |

### Tone

| Effect | Independent behavior | Proposed controls | Measurable acceptance |
|---|---|---|---|
| Infinity Tone | Proposed windowed octave-spaced oscillator bank producing a Shepard-style pitch illusion. | Base frequency, direction/rate, octave span, input tracking. | Spectral peaks form an octave-spaced set with rising/falling motion and crossfaded wraps; zero input does not unexpectedly emit tone unless generator mode is explicit. |
| Space Invader | Proposed stepped ring-modulation/oscillator effect with a deliberate new design; vendor behavior unresolved. | Carrier frequency, step sequence/rate, mix. | A 440 Hz sine produces sidebands at carrier plus/minus 440 Hz whose positions follow the programmed steps; dry depth zero removes them. |

## Additional scope outside the 59 names

The official list also identifies four Channel FX (Filter, Dub Echo, Space, Noise). Stems FX routing and Video FX are separate workflows. A count of 59 implemented DJ-FX must never be presented as complete effects coverage for the entire product.

## Sources

- [catalog](fx-catalog.json) — Installed 4.0.10.213 catalog names and categories only.
- [strips](UI_OBSERVATIONS.md) — Four selected parameter strips and their session values; not defaults or ranges.
- [list](https://support.serato.com/hc/en-us/articles/10271055029263-DJ-FX-Channel-FX-list) — Current DJ effect membership; a few names have spelling/spacing differences from the app.
- [controls](https://support.serato.com/hc/en-us/articles/224970027-Using-DJ-FX) — Shared FX controls, channel assignment, beat scaling, tempo and banks.
- [advanced](https://support.serato.com/hc/en-us/articles/10326824275087-Advanced-FX-View) — Selection versus enable, parameter reset, save and USER presets.
- [redesign](https://the-drop.serato.com/announcements/new-serato-dj-fx/) — Serato states all FX were redesigned for 3.2.0. Historical iZotope FX cannot establish current algorithms.
- [hex](https://support.serato.com/hc/en-us/articles/11349213839247-Effect-List) — HEX FX is a separate product. Its detailed parameter inventory is not evidence for DJ Pro parameter parity.
- [hex-overview](https://serato.com/hex-fx) — Describes endless Infinity Filter sweeps and one-direction Infinity Flanger in HEX; provides design inspiration only, not DJ Pro proof.
- [worklet](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor) — Custom audio processing on the audio rendering thread; implementation mechanism, not vendor fidelity.
- [filter-api](https://developer.mozilla.org/en-US/docs/Web/API/BiquadFilterNode) — Available standard filter types and controls; implementation mechanism only.

## Execution status

- Catalog coverage validated by exact name-set comparison: **59/59**.
- Reference parameter evidence: **59/59 strips**,236 labels, all session values transcribed (18 manually recovered from OCR omissions). Ranges and alternative enum choices remain open.
- New reference audio captures: **0**.
- Independent kernel verification: **80/80 checks passed** for55 new DJ-FX and4 separately catalogued Channel FX. The suite includes all controls changing audio, no identical default DJ variants, delay/stereo/filter/quantization/modulation/capture/pitch checks and lifecycle regressions. It does not execute every proposed tolerance in the table.
- Actual browser and engine-route evidence is parent-owned and recorded separately under `docs/prototype`; the kernel result alone cannot establish browser or hardware behavior.

## Implemented independent processors and remaining differences

The runtime is `prototype/extended-effects-kernel.js`, hosted by `extended-effects-worklet.js` through `extended-effects.js`. Fifty-five DJ effects and four Channel effects produce audio. Existing LPF, Delay, Reverb and Wah remain native Web Audio node graphs in `effects.js`. Same-effect updates preserve state; depth changes ramp. LPF slope topology changes and Reverb decay/width IR changes request replacement of that one slot, which resets its tail.

The fresh reference strips demonstrate real schema differences that must remain visible: Spiral Echo exposes Speed and bypass bands; Lo-Fi Warmth exposes quantization/downsampling controls; Echo Out exposes Max Feedback, Filter and Echo Level; Repeater exposes Mix, Shreds and Range. The independent controls in this document are **not renamed to pretend those semantics are implemented**. Distinct sound generation under59 names does not close those parameter gaps.

The captured-loop/halftime/stretch algorithms are compact granular approximations. Tonal tests pass, including440Hz retained while halftime doubles duration, but polyphonic/transient quality is not equivalent to a production phase vocoder. Continuous pitch-delay phases are integrated per sample; Spiral Echo tests measure553/701/883Hz against expected554/698/880Hz over three repeats. This is an independent4-semitone-per-repeat design, not proof of Serato Spiral Echo behavior.

Reviewer regressions now cover Slip Roll recapturing the current fragment when subdivision changes, long Out roll captures surviving beyond the general ring-buffer horizon, and full8-beat/Length8 capture at60BPM. History allocation grows with requested timing instead of silently clipping at4seconds. Long delays at extreme settings consume more memory; a sustained multideck real-time performance benchmark remains required.

Skills applied: use, dec-quality-testing.

## Observed control adapter checkpoint

The [control gap matrix](FX_CONTROL_GAP_MATRIX.md) now tracks24 executable observed schemas /96 labels among the55 extended effects. There are31 extended schemas still using their earlier independent controls. The adapters preserve observed names while labeling proposed bounds and incomplete mode lists. Fifteen targeted signal checks pass; exact vendor semantics and sonic parity remain open.
