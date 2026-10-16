# Hercules DJControl Inpulse 300 MK2 investigation

Date: 2026-10-16. Connected reference unit reported by Jason; headphones and RCA speakers also confirmed connected by Jason. No firmware, driver, account, mapping or audio-route changes performed.

## What is established

USB device: vendor `0x06f8`, product `0xb12f`. CoreAudio lists four output channels at the currently configured 44.1 kHz rate. CoreMIDI exposes a source and a destination with the exact device name. These observations establish enumeration, not reliable control, feedback, channel routing or latency.

A 70-second passive MIDI diagnostic connected successfully and observed **zero incoming packets**. This is inconclusive: the timing of physical knob movement was not confirmed. It is not proof that MIDI is broken. The diagnostic sent zero output commands. Raw capture remains in ignored local evidence; source is scripts/observe_midi.py.

## Documented behavior

Serato's [Pro quickstart](https://support.serato.com/hc/en-us/articles/10173727435151-Hercules-DJControl-Inpulse-300-MK2-Quickstart-Guide) describes macOS class compliance and paid Pro access. It documents transport, jog, gain/EQ/filter, browsing/loading, monitoring, FX and pad modes, with Shift alternatives. The guide also describes beat/tempo guide lights and relies on analyzed timing data. A promotional DDJ-FLX4 sentence on that page is unrelated to this controller and is excluded from the evidence.

[Hercules states](https://support.hercules.com/en/kb/1835-en/) that its listed controllers are MIDI compliant and can be mapped in software supporting MIDI; it does not guarantee third-party integration quality. This supports an independent mapping approach, subject to measured protocol and physical validation.

## Investigation and acceptance matrix

Every row below is a proposed test, currently unexecuted unless explicitly stated.

| Group | Test sequence | Required observation |
|---|---|---|
| Discovery | Start with connected unit; disconnect/reconnect between controlled sessions | Matching USB identity, MIDI endpoints and audio device; no stale duplicate ownership |
| Browser | Turn left/right, press, then Shift variant | Correlated timestamped messages and correct list/focus behavior |
| Load/assistant | Single load, double load, prepare action, modifier | Intended deck, instant double state, no unexpected playing-deck overwrite |
| Transport | Play, pause, cue audition/release, sync/off and modifier | Actual Serato state transitions and correlated input bytes |
| Jog | Touch/release stationary; slow/fast clockwise and reverse; edge bend; modifier seek | Touch message separated from motion, resolution and relative encoding established |
| Tempo | Sweep endpoints, center, modifier clutch and sync takeover | Range, resolution, center dead band and takeover behavior |
| Mixer | Gain/EQ/filter sweeps, channel and crossfaders | Correct normalized ranges, neutral values and independent channel effects |
| Monitor | Channel cue, master cue, headphone level and split routing | Headphones and RCA outputs heard independently using identifiable low-level test fixtures |
| Pads | Each pad, each mode, Shift alternatives, held/released actions | Full physical-control matrix; pad label alone is not a mode definition |
| Loop | In/out edit, activation, half/double, roll and saved recall | Quantized/free timing, edit ownership and release position |
| FX | Enable, depth, timing and modifier selection | Correct slot/parameter ownership and no unwanted state jumps |
| Feedback | Transport/pad states, level meters, beat/tempo guides | Observed outbound protocol and physical LEDs matching authoritative state |
| Recovery | Reconnect, stale mapping, simultaneous analysis and rapid input | No bursts, stuck notes, frozen feedback or accidental route reassignment |

## Independent implementation trace to establish

1. OS enumeration → device identity and endpoint capabilities.
2. Incoming message → transport decoder → mapping/modifier/deck resolution.
3. Resolved command → transport/mixer state → timestamped audio-engine command.
4. Audio buses → selected CoreAudio channel pairs → physical outputs.
5. Authoritative state → feedback encoder → hardware destination.

Serato imports support investigation of this architecture but do not prove the exact internal path. The connected unit cannot establish compatibility for CDJs, DVS interfaces, turntables, Phase wireless controllers or other Hercules models.

## Next reproducible check

Coordinate a known 60-second movement window and run `python3 scripts/observe_midi.py 60` from the project root. Correlate individual physical actions with captured messages. Then document expected byte meanings before attempting any output-light command. No mapping from another model should be transmitted merely because the controls look similar.
