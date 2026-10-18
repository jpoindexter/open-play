# Observed control gap matrix

**55 of55 extended effects now expose their four observed labels:220 controls.** All exposed controls change independently rendered audio. This closes the extended label-to-executable-control gap; it does not establish Serato transfer functions, parameter mappings, ranges, factory defaults, complete enum catalogs or sonic parity. The four native Web Audio effects are outside this55-effect matrix.

18October2026 scoped native-WebAudio LPF update (outside this55-effect table): actual reference6/48dB endpoints and24/36examples observed. [Review](../prototype/LPF_SLOPE_REVIEW.md) records eight independent audio slopes; complete steps/defaults/transfer/live-continuity remain unverified.

[Observed reference strips](FX_OBSERVED_PARAMETERS.md) provide label/value evidence. Runtime adapter metadata marks proposed ranges and incomplete mode catalogs. Source: `prototype/observed-fx-control-adapters.js`.

| Effect | Observed labels | Current executable controls | Schema status |
|---|---|---|---|
| Echo | FEEDBACK; HPF; DRIVE; BEAT MODIFY | Feedback; HPF; Drive; Beat Modify | Observed labels; independent semantics |
| Low Cut Echo | FEEDBACK; HPF; DRIVE; BEAT MODIFY | Feedback; HPF; Drive; Beat Modify | Observed labels; independent semantics |
| Multi Tap Delay | PATTERN; FEEDBACK; FILTER; BEAT MODIFY | Pattern; Feedback; Filter; Beat Modify | Observed labels; independent semantics |
| Ping Pong Delay | FEEDBACK; HPF; WIDTH; BEAT MODIFY | Feedback; HPF; Width; Beat Modify | Observed labels; independent semantics |
| Spiral Echo | SPEED; LOW BYPASS; HIGH BYPASS; BEAT MODIFY | Speed; Low Bypass; High Bypass; Beat Modify | Observed labels; independent semantics |
| Version Echo | FEEDBACK; BPF; DRIVE; BEAT MODIFY | Feedback; BPF; Drive; Beat Modify | Observed labels; independent semantics |
| Bit Crush | BIT DEPTH; DOWNSAMPLING; CHARACTER; LOW DRIVE | Bit Depth; Downsampling; Character; Low Drive | Observed labels; independent semantics |
| Distortion | TYPE; DRIVE; CHARACTER; TONE | Type; Drive; Character; Tone | Observed labels; independent semantics |
| Lo-Fi Crush | BIT DEPTH; DOWNSAMPLING; CHARACTER; LOW DRIVE | Bit Depth; Downsampling; Character; Low Drive | Observed labels; independent semantics |
| Lo-Fi Warmth | BIT DEPTH; DOWNSAMPLING; CHARACTER; LOW DRIVE | Bit Depth; Downsampling; Character; Low Drive | Observed labels; independent semantics |
| Sizzle Crush | BIT DEPTH; DOWNSAMPLING; CHARACTER; LOW DRIVE | Bit Depth; Downsampling; Character; Low Drive | Observed labels; independent semantics |
| Combo Filter | RESONANCE; SLOPE; MIN FREQ; MAX FREQ | Resonance; Slope; Min Freq; Max Freq | Observed labels; independent semantics |
| Drive Filter | RESONANCE; DRIVE; SLOPE; TYPE | Resonance; Drive; Slope; Type | Observed labels; independent semantics |
| HPF | RESONANCE; SLOPE; MIN FREQ; MAX FREQ | Resonance; Slope; Min Freq; Max Freq | Observed labels; independent semantics |
| Infinity Filter | CENTRE FREQ.; TYPE; DIRECTION; BEAT MODIFY | Centre Freq.; Type; Direction; Beat Modify | Observed labels; independent semantics |
| LFO Filter | RESONANCE; LFO DEPTH; LFO SHAPE; BEAT MODIFY | Resonance; LFO Depth; LFO Shape; Beat Modify | Observed labels; independent semantics |
| Repeater | MIX; SHREDS; RANGE; BEAT MODIFY | Mix; Shreds; Range; Beat Modify | Observed labels; independent semantics |
| Retro Halftime | RETRIGGER; MIX; RANGE; GRAINS | Retrigger; Mix; Range; Grains | Observed labels; independent semantics |
| Roll | REPEATS; SHREDS; RANGE; BEAT MODIFY | Repeats; Shreds; Range; Beat Modify | Observed labels; independent semantics |
| Slip Roll | REPEATS; SHREDS; RANGE; BEAT MODIFY | Repeats; Shreds; Range; Beat Modify | Observed labels; independent semantics |
| Stretch | RETRIGGER; MIX; RANGE; GRAINS | Retrigger; Mix; Range; Grains | Observed labels; independent semantics |
| Stutter Repeater | MIX; SHREDS; RANGE; BEAT MODIFY | Mix; Shreds; Range; Beat Modify | Observed labels; independent semantics |
| Stutter Roll | REPEATS; SHREDS; RANGE; BEAT MODIFY | Repeats; Shreds; Range; Beat Modify | Observed labels; independent semantics |
| Chorus Basic | FEEDBACK; DELAY; LFO DEPTH; RATE | Feedback; Delay; LFO Depth; Rate | Observed labels; independent semantics |
| Chorus Quad | FEEDBACK; DELAY; LFO DEPTH; RATE | Feedback; Delay; LFO Depth; Rate | Observed labels; independent semantics |
| Falling Flanger | CENTRE FREQ.; TYPE; DIRECTION; BEAT MODIFY | Centre Freq.; Type; Direction; Beat Modify | Observed labels; independent semantics |
| Flanger | FEEDBACK; PITCH; LFO DEPTH; BEAT MODIFY | Feedback; Pitch; LFO Depth; Beat Modify | Observed labels; independent semantics |
| Infinity Flanger | CENTRE FREQ.; TYPE; DIRECTION; BEAT MODIFY | Centre Freq.; Type; Direction; Beat Modify | Observed labels; independent semantics |
| Pansformer | NOISE; SKEW; STEREO; BEAT MODIFY | Noise; Skew; Stereo; Beat Modify | Observed labels; independent semantics |
| Phaser | FEEDBACK; PITCH; LFO DEPTH; BEAT MODIFY | Feedback; Pitch; LFO Depth; Beat Modify | Observed labels; independent semantics |
| Pulse Spiral | FEEDBACK; FILTER; SLIDE RATE; BEAT MODIFY | Feedback; Filter; Slide Rate; Beat Modify | Observed labels; independent semantics |
| Spiral | FEEDBACK; FILTER; SLIDE RATE; BEAT MODIFY | Feedback; Filter; Slide Rate; Beat Modify | Observed labels; independent semantics |
| Transform | NOISE; SKEW; STEREO; BEAT MODIFY | Noise; Skew; Stereo; Beat Modify | Observed labels; independent semantics |
| Tremolo | LFO SHAPE; SKEW; STEREO; BEAT MODIFY | LFO Shape; Skew; Stereo; Beat Modify | Observed labels; independent semantics |
| Brake Echo | FEEDBACK; STOP TIME; STOP CURVE; BEAT MODIFY | Feedback; Stop Time; Stop Curve; Beat Modify | Observed labels; independent semantics |
| Brake Rewind | STOP TIME; CURVE; SPINBACK; MODE | Stop Time; Curve; Spinback; Mode | Observed labels; independent semantics |
| Braker | MIX; CURVE; MODE; BEAT MODIFY | Mix; Curve; Mode; Beat Modify | Observed labels; independent semantics |
| Clean Echo Out | MAX FEEDBACK; FILTER; ECHO LEVEL; BEAT MODIFY | Max Feedback; Filter; Echo Level; Beat Modify | Observed labels; independent semantics |
| Clean Rollout | ECHO/FEEDBACK; FILTER; ROLL; BEAT MODIFY | Echo/Feedback; Filter; Roll; Beat Modify | Observed labels; independent semantics |
| Combo Fade Echo | FEEDBACK; STOP TIME; DRIVE; BEAT MODIFY | Feedback; Stop Time; Drive; Beat Modify | Observed labels; independent semantics |
| Echo Out | MAX FEEDBACK; FILTER; ECHO LEVEL; BEAT MODIFY | Max Feedback; Filter; Echo Level; Beat Modify | Observed labels; independent semantics |
| Epic Stretch Rewind | STOP TIME; CURVE; SPINBACK; MODE | Stop Time; Curve; Spinback; Mode | Observed labels; independent semantics |
| Roll Out | ECHO/FEEDBACK; FILTER; ROLL; BEAT MODIFY | Echo/Feedback; Filter; Roll; Beat Modify | Observed labels; independent semantics |
| Short Brake Echo | FEEDBACK; STOP TIME; STOP CURVE; BEAT MODIFY | Feedback; Stop Time; Stop Curve; Beat Modify | Observed labels; independent semantics |
| Slow Roll Out | ECHO/FEEDBACK; FILTER; ROLL; BEAT MODIFY | Echo/Feedback; Filter; Roll; Beat Modify | Observed labels; independent semantics |
| Turntable Brake | STOP TIME; CURVE; SPINBACK; MODE | Stop Time; Curve; Spinback; Mode | Observed labels; independent semantics |
| Bright Reverb | DECAY; CONTOUR; WIDTH; MIX MODE | Decay; Contour; Width; Mix Mode | Observed labels; independent semantics |
| Empty Mall Verb | DECAY; CONTOUR; WIDTH; MIX MODE | Decay; Contour; Width; Mix Mode | Observed labels; independent semantics |
| Epic Reverb | DECAY; CONTOUR; WIDTH; MIX MODE | Decay; Contour; Width; Mix Mode | Observed labels; independent semantics |
| Epic Reverb Drop | DECAY; CONTOUR; WIDTH; DROP RANGE | Decay; Contour; Width; Drop Range | Observed labels; independent semantics |
| Next Door Verb | DECAY; CONTOUR; WIDTH; MIX MODE | Decay; Contour; Width; Mix Mode | Observed labels; independent semantics |
| Vast Reverb | DECAY; CONTOUR; WIDTH; MIX MODE | Decay; Contour; Width; Mix Mode | Observed labels; independent semantics |
| Vast Verb Drop | DECAY; CONTOUR; WIDTH; MIX MODE | Decay; Contour; Width; Mix Mode | Observed labels; independent semantics |
| Infinity Tone | TIMBRE; AMBIENCE; DIRECTION; BEAT MODIFY | Timbre; Ambience; Direction; Beat Modify | Observed labels; independent semantics |
| Space Invader | TIMBRE; AMBIENCE; DIRECTION; BEAT MODIFY | Timbre; Ambience; Direction; Beat Modify | Observed labels; independent semantics |

## Executed signal evidence

The full independent kernel suite checks55 DJ processors plus4 Channel processors, all exposed control contrasts, distinct default signals, timing, capture preservation, transport-independent processing, pitch and lifecycle regressions. The observed-control suite adds33 checks for unit parsing and the concrete mappings below. Numeric contrasts are measured on rendered samples, not parameter state.

- Multitap pattern changes impulse tap positions; Beat Modify scales their times. Tap weights are normalized by their sum so90% feedback decays instead of growing; constructor and live updates allocate history for the actual longest pattern tap. Spiral Echo Speed changes shifted-delay playback, Low/High Bypass preserve live frequency bands around the processed middle band.
- Distortion Type selects saturation, clipping or folding; Character changes shaping. Tone is an independent dB tilt around1kHz. Drive Filter Type selects an independent saturation model before the requested filter slope.
- Infinity Filter and the falling/infinity flangers consume Centre Freq., Type, signed Direction and Beat Modify. Signed direction scales unwrapped elapsed phase before modulo, so fractional speeds do not restart at every base beat. The Space Invader step sequence uses the same continuous phase rule. Their extra Wide/Narrow modes are independent designs.
- Repeater/Roll families consume Range in beats, Shreds as subdivisions/gating, Repeats as subdivision count, Mix as live/captured blend and Beat Modify as repeat timing. Retro Halftime/Stretch consume Range as a duration factor, Grains as grain milliseconds, Mix as blend and Retrigger as periodic recapture of recent source material.
- Spiral variants consume feedback, low-pass Filter, signed Slide Rate and beat timing. Brake/rewind variants consume curved slowdown timing, resampling/granular Mode, full-duration reversed Spinback and Mix. Roll exits consume captured-roll speed, echo feedback, filtering and beat timing. Long spinbacks retain their original history instead of reading overwritten live input. Stretch exit grains read the complete finite absolute stop extent, rather than wrapping the first captured beat.
- Vast percentage Decay and Epic Reverb Drop percentage Decay map independently to seconds as0.15 ×2^(percentage/12). Contour and Width shape the return; Mix Mode includes observed Send+Mix. Drop Range shifts the captured reverberant return downward in semitones.
- Infinity Tone/Space Invader Timbre changes generated spectrum/carrier, Ambience adds a damped delay field, Direction changes spectral motion and Beat Modify changes timing. Silent input remains silent.

Commands:

`node --experimental-default-type=module scripts/test_observed_fx_controls.mjs`

`node --experimental-default-type=module scripts/test_extended_effects.mjs`

The browser graph suite is `prototype/observed-fx-controls-test.html`. It executes220 parameter contrasts through AudioWorklet using a nonperiodic stereo fixture. After four adversarial feedback/history/sweep/grain corrections, parent CUA execution passed a fresh 220/220 contrasts on the frozen runtime, saved in `docs/prototype/observed-fx-controls-browser-results.txt`. Nine longer actual Worklet regressions also pass in `fx-adversarial-browser-results.json`. Node results alone do not establish browser success; these artifacts record separate browser execution.

## Independent mapping boundaries

- Observed session values are convenient initial independent settings, never claimed factory defaults. Numeric limits and additional enum options are identified in metadata.
- Pattern Shreds, Type Smooth Drive/Light Sat./Peak II/Octaves I/Omega, Mode Vinyl/Stretch and Retrigger On/Off were observed examples. Their added operating options do not claim a complete reference enum catalog.
- The three reverb Mix Mode examples Wet Mix, Send and Send+Mix were observed across different strips. Independent Send preserves the live dry path; Send+Mix retains half of that path at full depth. A Drop processor rejects new input to its reverberator after capture; Send may still include the live dry path by design.
- Range, Shreds, Grains, Stop Time, Stop Curve, Spinback, Drop Range, signed sweep speed and all transfer functions are independent interpretations of observed labels. Exit duration is capped at30 seconds; spinback has its own duration and retained history.
- Legacy DSP parameter keys remain accepted for existing callers and regression fixtures. Explicit legacy Duration uses its earlier seconds interpretation; observed Stop Time uses beat-relative factors (percentage for Brake Echo/Short Brake Echo/Combo Fade Echo, multiples for rewind/brake variants).
- Captured/granular quality, parameter switching clicks, full reference enum catalogs, exact value ranges and vendor sonic matching still require further evidence. End-to-end deck routing and live-device performance are separate gates.

Skills applied: use, dec-quality-testing, dec-software-principles.

## Adversarial regression checkpoint

The observed-control suite executes four additional acceptance paths: maximum-feedback multitap tails decay over45seconds without hidden internal growth; timing/pattern updates retain the24-second final tap identically to fresh construction; equivalent signed sweep velocities render the same audio across base-beat boundaries; and a.7-second source marker plays forward and in reverse in Stretch mode while later live input remains excluded. These validate the independent fixes, not reference sound matching.
