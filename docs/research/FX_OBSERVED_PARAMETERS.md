# Observed advanced parameter strips — all 59 DJ effects

Reference: Serato DJ Pro 4.0.10.213 arm64, 16 October 2026. Both decks remained paused. Slot 1 was returned to LPF after collection. Screenshots remain private local evidence; the JSON contains hashes and transcribed facts.

All 236 labels were extracted from the visible strips. Session values are OCR transcriptions, not verified defaults. Eighteen single-digit OCR omissions were manually verified as Beat Modify = 1; ranges and additional enum choices were unmeasured in this16Octobercollection. A later [18October LPF observation](LPF_REFERENCE_CONTROLS_20261018.json) establishes6/48dB endpoints and24/36examples only. This closes the missing-label inventory, not control semantics or DSP parity.

| Effect | Parameter 1 | Parameter 2 | Parameter 3 | Parameter 4 |
|---|---|---|---|---|
| Delay | FEEDBACK: 40% | HPF: 20.0 Hz | DRIVE: 0% | BEAT MODIFY: 1 |
| Echo | FEEDBACK: 80% | HPF: 20.0 Hz | DRIVE: 0% | BEAT MODIFY: 1 |
| Low Cut Echo | FEEDBACK: 60% | HPF: 300 Hz | DRIVE: 25% | BEAT MODIFY: 1 |
| Multi Tap Delay | PATTERN: Shreds | FEEDBACK: 50% | FILTER: 20% | BEAT MODIFY: 1 |
| Ping Pong Delay | FEEDBACK: 60.0 | HPF: 20.0 Hz | WIDTH: 100% | BEAT MODIFY: 1 |
| Spiral Echo | SPEED: 0% | LOW BYPASS: 20.0 Hz | HIGH BYPASS: 20.0 kHz | BEAT MODIFY: 1 |
| Version Echo | FEEDBACK: 90% | BPF: 0% | DRIVE: 50% | BEAT MODIFY: 1/2 Dotted |
| Bit Crush | BIT DEPTH: 4.00 | DOWNSAMPLING: 1.32 kHz | CHARACTER: 100% | LOW DRIVE: 50% |
| Distortion | TYPE: Smooth Drive | DRIVE: 50% | CHARACTER: 50% | TONE: 0.00 dB |
| Lo-Fi Crush | BIT DEPTH: 5.08 | DOWNSAMPLING: 10.1 kHz | CHARACTER: 72% | LOW DRIVE: 66% |
| Lo-Fi Warmth | BIT DEPTH: 6.00 | DOWNSAMPLING: 44.1 kHz | CHARACTER: 100% | LOW DRIVE: 100% |
| Sizzle Crush | BIT DEPTH: 6.00 | DOWNSAMPLING: 8.00 kHz | CHARACTER: 100% | LOW DRIVE: 50% |
| Combo Filter | RESONANCE: 1.77 | SLOPE: 18dB | MIN FREQ: 200 Hz | MAX FREQ: 10.0kHz |
| Drive Filter | RESONANCE: 1.77 | DRIVE: 50% | SLOPE: 12dB | TYPE: Light Sat. |
| HPF | RESONANCE: 1.77 | SLOPE: 12dB | MIN FREQ: 40.0 Hz | MAX FREQ: 10.0 kHz |
| Infinity Filter | CENTRE FREQ.: 700 Hz | TYPE: Peak II | DIRECTION: 50% | BEAT MODIFY: 1 |
| LFO Filter | RESONANCE: 1.41 | LFO DEPTH: 50% | LFO SHAPE: Sine | BEAT MODIFY: 1 |
| LPF | RESONANCE: 1.77 | SLOPE: 24dB | MIN FREQ: 200 Hz | MAX FREQ: 20.0 kHz |
| Wah Filter | RESONANCE: 8.00 | RANGE: 4.00 octaves | LFO DEPTH: 0% | RATE: 2 |
| Repeater | MIX: 70% | SHREDS: 0% | RANGE: 1 Beat | BEAT MODIFY: 1 |
| Retro Halftime | RETRIGGER: On | MIX: 100% | RANGE: 2x | GRAINS: 90.0 |
| Roll | REPEATS: 1 | SHREDS: 0% | RANGE: 1 Beat | BEAT MODIFY: 1 |
| Slip Roll | REPEATS: 1 | SHREDS: 0% | RANGE: 1 Beat | BEAT MODIFY: 1 |
| Stretch | RETRIGGER: Off | MIX: 100% | RANGE: 4x | GRAINS: 90.0 |
| Stutter Repeater | MIX: 70% | SHREDS: 100% | RANGE: 2 Beats | BEAT MODIFY: 1/4 |
| Stutter Roll | REPEATS: 1 | SHREDS: 0% | RANGE: 1 Beat | BEAT MODIFY: 1/4 |
| Chorus Basic | FEEDBACK: 0.00 | DELAY: 5.00 ms | LFO DEPTH: 50% | RATE: 4 |
| Chorus Quad | FEEDBACK: 0.00 | DELAY: 5.00 ms | LFO DEPTH: 50% | RATE: 4 |
| Falling Flanger | CENTRE FREQ.: 212 Hz | TYPE: Octaves I | DIRECTION: -7% | BEAT MODIFY: 1 Triplet |
| Flanger | FEEDBACK: 83% | PITCH: 0.20 ms | LFO DEPTH: 17% | BEAT MODIFY: 4 |
| Infinity Flanger | CENTRE FREQ.: 800 Hz | TYPE: Omega | DIRECTION: 50% | BEAT MODIFY: 1 |
| Pansformer | NOISE: 50% | SKEW: 50% | STEREO: -100% | BEAT MODIFY: 1/4 |
| Phaser | FEEDBACK: 85% | PITCH: 2.00 kHz | LFO DEPTH: 60% | BEAT MODIFY: 4 |
| Pulse Spiral | FEEDBACK: 70% | FILTER: 0% | SLIDE RATE: 50% | BEAT MODIFY: 1/2 |
| Spiral | FEEDBACK: 70% | FILTER: 0% | SLIDE RATE: 50% | BEAT MODIFY: 1 |
| Transform | NOISE: 50% | SKEW: 50% | STEREO: 0% | BEAT MODIFY: 1/4 |
| Tremolo | LFO SHAPE: Sine | SKEW: 50% | STEREO: 0% | BEAT MODIFY: 1/4 |
| Brake Echo | FEEDBACK: 70% | STOP TIME: 200% | STOP CURVE: -0.30 | BEAT MODIFY: 1 |
| Brake Rewind | STOP TIME: 2.0x | CURVE: 0.50 | SPINBACK: 2.00 s | MODE: Vinyl |
| Braker | MIX: 100% | CURVE: -0.30 | MODE: Vinyl | BEAT MODIFY: 2 |
| Clean Echo Out | MAX FEEDBACK: 90% | FILTER: 0% | ECHO LEVEL: 70% | BEAT MODIFY: 1 |
| Clean Rollout | ECHO/FEEDBACK: 10% | FILTER: 19% | ROLL: 10.0 | BEAT MODIFY: 2 |
| Combo Fade Echo | FEEDBACK: 65% | STOP TIME: 200% | DRIVE: 25% | BEAT MODIFY: 1 |
| Echo Out | MAX FEEDBACK: 82% | FILTER: 0% | ECHO LEVEL: 70% | BEAT MODIFY: 1 |
| Epic Stretch Rewind | STOP TIME: 8.0x | CURVE: -1.00 | SPINBACK: 5.00 s | MODE: Stretch |
| Roll Out | ECHO/FEEDBACK: 40% | FILTER: 30% | ROLL: 7.00 | BEAT MODIFY: 4 |
| Short Brake Echo | FEEDBACK: 66% | STOP TIME: 200% | STOP CURVE: 0.00 | BEAT MODIFY: 1/4 Dotted |
| Slow Roll Out | ECHO/FEEDBACK: 40% | FILTER: 0% | ROLL: 10.0 | BEAT MODIFY: 8 |
| Turntable Brake | STOP TIME: 2.0x | CURVE: 0.00 | SPINBACK: 0.00 ms | MODE: Vinyl |
| Bright Reverb | DECAY: 1.50 s | CONTOUR: 25% | WIDTH: 155% | MIX MODE: Wet Mix |
| Empty Mall Verb | DECAY: 299 ms | CONTOUR: 0% | WIDTH: 200% | MIX MODE: Wet Mix |
| Epic Reverb | DECAY: 5.00 s | CONTOUR: -20% | WIDTH: 100% | MIX MODE: Send |
| Epic Reverb Drop | DECAY: 85% | CONTOUR: 0% | WIDTH: 100% | DROP RANGE: 24.0 s.t. |
| Next Door Verb | DECAY: 310 ms | CONTOUR: -100% | WIDTH: 166% | MIX MODE: Wet Mix |
| Reverb | DECAY: 1.50 s | CONTOUR: 0% | WIDTH: 100% | MIX MODE: Wet Mix |
| Vast Reverb | DECAY: 75% | CONTOUR: -20% | WIDTH: 100% | MIX MODE: Send+Mix |
| Vast Verb Drop | DECAY: 85% | CONTOUR: 63% | WIDTH: 145% | MIX MODE: Send |
| Infinity Tone | TIMBRE: 50% | AMBIENCE: 90% | DIRECTION: 50% | BEAT MODIFY: 1 |
| Space Invader | TIMBRE: 0% | AMBIENCE: 100% | DIRECTION: -100% | BEAT MODIFY: 1/8 |
