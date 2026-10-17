## Current executed subset —17October2026

Later evidence supersedes early inconclusive captures below. Fresh45s capture received101packets/0parsererrors and Jason confirmed knob/Serato correlation. Jason corrected the wrong-app negative and confirmed browserknob library selection in Electron0.1.1. In0.1.3, actual output enumeration and selection expose the Hercules; explicit master1/2+cue3/4 applied. With Cue Mix0%/Volume10%, Jason confirmed cue-only headphones while powered RCA speakers silent, and master-only speakers while headphones silent. Native saved master recordings independently decode to22.32s exactlyzero duringcue and29.88s finite/nonzero duringmaster. Actual MIDI Connect and retained relative CCch1#1mapping observed0.1.3; no new knob-action test. See desktop-0.1.3-runtime-observation.json and audio-inspection.json. Fullmapping/LEDs/jogs/hot-unplug/latency/quality remain unknown. Existing firmware untouched; Open Play test output route was explicitly changed, not Serato configuration.

The following dated investigation is historical evidence.

# Hercules DJControl Inpulse 300 MK2 investigation

Date: 2026-10-16. Connected reference unit reported by Jason; headphones and RCA speakers also confirmed connected by Jason. No firmware, driver, account, mapping or audio-route changes performed.

## What is established

USB device: vendor `0x06f8`, product `0xb12f`. CoreAudio lists four output channels at the currently configured 44.1 kHz rate. CoreMIDI exposes a source and a destination with the exact device name. These observations establish enumeration, not reliable control, feedback, channel routing or latency.

A 70-second passive MIDI diagnostic connected successfully and observed **zero incoming packets**. Jason subsequently confirmed that he turned the browser knob during the capture. The discrepancy is unresolved: validate the diagnostic receiver, endpoint selection and device transport before attributing it to the controller. It is not proof that MIDI is broken. The diagnostic sent zero output commands. Raw capture remains in ignored local evidence; source is scripts/observe_midi.py.

The installed Serato MIDI settings also list the exact controller. Allow Serato Hardware Remapping is off and Enable Output Lighting is on in the observed session; neither setting was changed.

An isolated receiver self-test (`scripts/check_midi_receiver.py`) created its own temporary CoreMIDI destination, sent two test messages only to that destination, received exact bytes `b01001b0107f`, and disposed of its endpoints. The executed result was PASS. This rules out a completely nonfunctional callback/packet decoder in that test, but does not prove the original source connection, hardware transport, event timing or Serato ownership path.

Jason subsequently confirmed that turning the browser knob moves the highlighted track in Serato. This is **USER-REPORTED runtime behavior**, stronger than enumeration but not a byte-level capture or independent automation observation. The capture discrepancy must not be described as a broken controller.

A second executed self-test (`python3 scripts/check_midi_receiver.py --source`) created an owned temporary virtual source, connected an input port through MIDIPortConnectSource, delivered two messages through MIDIReceived and received exact bytes `b01001b0107f`. PASS. It exercises the same input-port connection and packet-decoding APIs as the passive observer, but does not reproduce the hardware endpoint.

Read-only IORegistry inspection shows MIDIServer as a client of the device's MIDI interface and Serato DJ Pro as a device user client. Coexistence is observed. Exclusive ownership, which interface Serato reads, and whether it uses this CoreMIDI callback remain unknown.

## Additional protocol references

The [Hercules Official forum response](https://community.hercules.com/community/archives/djcontrol-inpulse-300-mk2-traktor-pro-3-mapping/) states that Inpulse 300 and MK2 send the same MIDI commands, while acknowledging mapping revisions for their different control layouts. This improves the protocol hypothesis; it does not establish functional equivalence of an older mapping.

An [MK2-specific community Mixxx mapping](https://github.com/DCinAC/mixxx-inpulse-300-mk2/tree/2acfb3506a6dab38a47c47b93ee653cdb5f393c7) was inspected at commit `2acfb3506a6dab38a47c47b93ee653cdb5f393c7`. Its XML has 212 control entries. Browser rotation is assigned to status B0 / control 01; its alternate layer uses B3 / 01. These are source-defined candidates, not measured bytes from this unit. Two input addresses have multiple bindings; at 96 / 00 the file associates a hot cue, an effect-selection operation and a beat-jump handler. Whether those combinations are intentional and safely dispatched requires runtime review. The repository API declares no license and no license file was listed. Do not adopt its implementation until provenance and permission are resolved. No mapping was installed or executed.

The [manufacturer's macOS test guide](https://support.hercules.com/en/kb/1841-en/) provides master/headphone, MIDI and LED diagnostics for this exact model through HDJSeries2CPL. The documented installation folder is absent on this Mac. No driver was installed. Its guide requires closing DJ software first; an isolated manufacturer test is a distinct follow-up, not a result already obtained.

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

Investigate endpoint ownership/transport and compare source-delivery behavior against the successful isolated receiver test before repeating an unchanged capture. Then coordinate a known 60-second movement window and run `python3 scripts/observe_midi.py 60` from the project root. Correlate individual physical actions with captured messages. Then document expected byte meanings before attempting any output-light command. No mapping from another model should be transmitted merely because the controls look similar.

## Fresh all-source observation — 17 October 2026

After Jason replied **Ready now**, parent executed the new passive45-second observer at08:02:42–08:03:27UTC. [Sanitized evidence](HERCULES_CAPTURE_20261017.json) records one exact-name Hercules source across84 scans, successful input connection/disconnection, offline0, endpoint protocol1 and unchanged initial/final identity properties. It received **zero callbacks before parsing**, zero packets, no parser errors, no identity/property/setup changes or omitted data. Port/client cleanup returned0. Apple SDK ABI assertions passed. No output commands were sent.

This improves endpoint continuity and callback/parser-boundary evidence over the older70-second result. Jason's fresh contemporaneous movement/Serato-response confirmation is pending; a previous report cannot fill that field. Zero callbacks do not prove broken hardware, unsupported MIDI, exclusive Serato access or a particular USB/HID receive path. The original raw report remains ignored and unmodified; its hash is in the sanitized summary. The real connected receive path remains an acceptance gap.
