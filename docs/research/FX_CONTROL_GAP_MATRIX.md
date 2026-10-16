# Observed control gap matrix

**24 of55 extended effects now expose their four observed labels:96 controls.** These controls have independent audio implementations. This does not establish Serato transfer functions, parameter mappings, ranges, factory defaults or complete enum catalogs. The remaining31 extended schemas remain explicit gaps. The four pre-existing native Web Audio effects are outside this55-effect matrix.

[Observed reference strips](FX_OBSERVED_PARAMETERS.md) provide label/value evidence. Runtime adapter metadata marks proposed ranges and incomplete mode catalogs. Source: `prototype/observed-fx-control-adapters.js`.

| Effect | Observed labels | Current executable controls | Schema status |
|---|---|---|---|
| Echo | FEEDBACK; HPF; DRIVE; BEAT MODIFY | Feedback; HPF; Drive; Beat Modify | Observed labels; independent semantics |
| Low Cut Echo | FEEDBACK; HPF; DRIVE; BEAT MODIFY | Feedback; HPF; Drive; Beat Modify | Observed labels; independent semantics |
| Multi Tap Delay | PATTERN; FEEDBACK; FILTER; BEAT MODIFY | Feedback; Tone; Tap Spread | Proposed schema; gap open |
| Ping Pong Delay | FEEDBACK; HPF; WIDTH; BEAT MODIFY | Feedback; HPF; Width; Beat Modify | Observed labels; independent semantics |
| Spiral Echo | SPEED; LOW BYPASS; HIGH BYPASS; BEAT MODIFY | Feedback; Tone; Pitch | Proposed schema; gap open |
| Version Echo | FEEDBACK; BPF; DRIVE; BEAT MODIFY | Feedback; BPF; Drive; Beat Modify | Observed labels; independent semantics |
| Bit Crush | BIT DEPTH; DOWNSAMPLING; CHARACTER; LOW DRIVE | Bit Depth; Downsampling; Character; Low Drive | Observed labels; independent semantics |
| Distortion | TYPE; DRIVE; CHARACTER; TONE | Drive; Tone | Proposed schema; gap open |
| Lo-Fi Crush | BIT DEPTH; DOWNSAMPLING; CHARACTER; LOW DRIVE | Bit Depth; Downsampling; Character; Low Drive | Observed labels; independent semantics |
| Lo-Fi Warmth | BIT DEPTH; DOWNSAMPLING; CHARACTER; LOW DRIVE | Bit Depth; Downsampling; Character; Low Drive | Observed labels; independent semantics |
| Sizzle Crush | BIT DEPTH; DOWNSAMPLING; CHARACTER; LOW DRIVE | Bit Depth; Downsampling; Character; Low Drive | Observed labels; independent semantics |
| Combo Filter | RESONANCE; SLOPE; MIN FREQ; MAX FREQ | Resonance; Slope; Min Freq; Max Freq | Observed labels; independent semantics |
| Drive Filter | RESONANCE; DRIVE; SLOPE; TYPE | Cutoff; Resonance; Drive | Proposed schema; gap open |
| HPF | RESONANCE; SLOPE; MIN FREQ; MAX FREQ | Resonance; Slope; Min Freq; Max Freq | Observed labels; independent semantics |
| Infinity Filter | CENTRE FREQ.; TYPE; DIRECTION; BEAT MODIFY | Rate; Direction; Resonance | Proposed schema; gap open |
| LFO Filter | RESONANCE; LFO DEPTH; LFO SHAPE; BEAT MODIFY | Resonance; LFO Depth; LFO Shape; Beat Modify | Observed labels; independent semantics |
| Repeater | MIX; SHREDS; RANGE; BEAT MODIFY | Length; Speed | Proposed schema; gap open |
| Retro Halftime | RETRIGGER; MIX; RANGE; GRAINS | Length; Pitch Lock; Speed | Proposed schema; gap open |
| Roll | REPEATS; SHREDS; RANGE; BEAT MODIFY | Length; Speed | Proposed schema; gap open |
| Slip Roll | REPEATS; SHREDS; RANGE; BEAT MODIFY | Length; Speed | Proposed schema; gap open |
| Stretch | RETRIGGER; MIX; RANGE; GRAINS | Length; Stretch; Grain | Proposed schema; gap open |
| Stutter Repeater | MIX; SHREDS; RANGE; BEAT MODIFY | Length; Gate; Speed | Proposed schema; gap open |
| Stutter Roll | REPEATS; SHREDS; RANGE; BEAT MODIFY | Length; Gate; Speed; Pulses | Proposed schema; gap open |
| Chorus Basic | FEEDBACK; DELAY; LFO DEPTH; RATE | Feedback; Delay; LFO Depth; Rate | Observed labels; independent semantics |
| Chorus Quad | FEEDBACK; DELAY; LFO DEPTH; RATE | Feedback; Delay; LFO Depth; Rate | Observed labels; independent semantics |
| Falling Flanger | CENTRE FREQ.; TYPE; DIRECTION; BEAT MODIFY | Rate; Mod Depth; Feedback | Proposed schema; gap open |
| Flanger | FEEDBACK; PITCH; LFO DEPTH; BEAT MODIFY | Feedback; Pitch; LFO Depth; Beat Modify | Observed labels; independent semantics |
| Infinity Flanger | CENTRE FREQ.; TYPE; DIRECTION; BEAT MODIFY | Rate; Mod Depth; Feedback; Direction | Proposed schema; gap open |
| Pansformer | NOISE; SKEW; STEREO; BEAT MODIFY | Noise; Skew; Stereo; Beat Modify | Observed labels; independent semantics |
| Phaser | FEEDBACK; PITCH; LFO DEPTH; BEAT MODIFY | Feedback; Pitch; LFO Depth; Beat Modify | Observed labels; independent semantics |
| Pulse Spiral | FEEDBACK; FILTER; SLIDE RATE; BEAT MODIFY | Pitch; Rate; Gate | Proposed schema; gap open |
| Spiral | FEEDBACK; FILTER; SLIDE RATE; BEAT MODIFY | Pitch; Rate | Proposed schema; gap open |
| Transform | NOISE; SKEW; STEREO; BEAT MODIFY | Noise; Skew; Stereo; Beat Modify | Observed labels; independent semantics |
| Tremolo | LFO SHAPE; SKEW; STEREO; BEAT MODIFY | LFO Shape; Skew; Stereo; Beat Modify | Observed labels; independent semantics |
| Brake Echo | FEEDBACK; STOP TIME; STOP CURVE; BEAT MODIFY | Duration; Feedback; Curve | Proposed schema; gap open |
| Brake Rewind | STOP TIME; CURVE; SPINBACK; MODE | Duration; Curve | Proposed schema; gap open |
| Braker | MIX; CURVE; MODE; BEAT MODIFY | Duration; Curve | Proposed schema; gap open |
| Clean Echo Out | MAX FEEDBACK; FILTER; ECHO LEVEL; BEAT MODIFY | Max Feedback; Filter; Echo Level; Beat Modify | Observed labels; independent semantics |
| Clean Rollout | ECHO/FEEDBACK; FILTER; ROLL; BEAT MODIFY | Duration; Curve | Proposed schema; gap open |
| Combo Fade Echo | FEEDBACK; STOP TIME; DRIVE; BEAT MODIFY | Duration; Feedback; Curve | Proposed schema; gap open |
| Echo Out | MAX FEEDBACK; FILTER; ECHO LEVEL; BEAT MODIFY | Max Feedback; Filter; Echo Level; Beat Modify | Observed labels; independent semantics |
| Epic Stretch Rewind | STOP TIME; CURVE; SPINBACK; MODE | Duration; Curve | Proposed schema; gap open |
| Roll Out | ECHO/FEEDBACK; FILTER; ROLL; BEAT MODIFY | Duration; Curve | Proposed schema; gap open |
| Short Brake Echo | FEEDBACK; STOP TIME; STOP CURVE; BEAT MODIFY | Duration; Feedback; Curve | Proposed schema; gap open |
| Slow Roll Out | ECHO/FEEDBACK; FILTER; ROLL; BEAT MODIFY | Duration; Curve | Proposed schema; gap open |
| Turntable Brake | STOP TIME; CURVE; SPINBACK; MODE | Duration; Curve | Proposed schema; gap open |
| Bright Reverb | DECAY; CONTOUR; WIDTH; MIX MODE | Decay; Contour; Width; Mix Mode | Observed labels; independent semantics |
| Empty Mall Verb | DECAY; CONTOUR; WIDTH; MIX MODE | Decay; Contour; Width; Mix Mode | Observed labels; independent semantics |
| Epic Reverb | DECAY; CONTOUR; WIDTH; MIX MODE | Decay; Contour; Width; Mix Mode | Observed labels; independent semantics |
| Epic Reverb Drop | DECAY; CONTOUR; WIDTH; DROP RANGE | Decay; Tone; Width | Proposed schema; gap open |
| Next Door Verb | DECAY; CONTOUR; WIDTH; MIX MODE | Decay; Contour; Width; Mix Mode | Observed labels; independent semantics |
| Vast Reverb | DECAY; CONTOUR; WIDTH; MIX MODE | Decay; Tone; Width | Proposed schema; gap open |
| Vast Verb Drop | DECAY; CONTOUR; WIDTH; MIX MODE | Decay; Tone; Width | Proposed schema; gap open |
| Infinity Tone | TIMBRE; AMBIENCE; DIRECTION; BEAT MODIFY | Frequency; Rate; Direction | Proposed schema; gap open |
| Space Invader | TIMBRE; AMBIENCE; DIRECTION; BEAT MODIFY | Frequency; Rate; Steps | Proposed schema; gap open |

## Implementation and validation

The new adapters cover echo/delay variants, all four crush effects, HPF/Combo Filter, four reverbs whose decay was observed in seconds, both choruses, Flanger/Phaser, LFO Filter, Tremolo/Transform/Pansformer, and both Echo Out variants.

Signal checks test actual echo timing and high-pass rejection, added distortion harmonics, sample-rate reduction holds, quantization strength, bass drive,6/12/18/24dB slope differences, stereo width above100%, Send mode dry preservation, unit parsing, chorus arrival delay, LFO trajectories, channel phase and captured echo decay/level.

Commands:

`node --experimental-default-type=module scripts/test_observed_fx_controls.mjs`

`node --experimental-default-type=module scripts/test_extended_effects.mjs`

The browser graph suite is `prototype/observed-fx-controls-test.html`. Parent-owned CUA execution must confirm the actual graph; Node results alone do not establish browser success.

## Known boundaries

- Observed session values are convenient initial independent settings, never claimed factory defaults.
- Numeric limits are proposed and identified in metadata.
- Wet Mix and Send were observed examples; neither is a complete enum catalog. Sine was observed; Triangle/Square/Saw are explicitly independent additional options.
- Depth-to-frequency mapping, Character and Low Drive transfer functions, contour shaping, stereo phase, and mode semantics are independent designs.
- Reverb variants with percentage Decay and Drop Range need a separate observed-to-independent mapping; no percentage is silently treated as seconds.
- Proposed processors for remaining named effects remain executable; their observed controls are not presented as implemented.
