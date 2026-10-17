# Open Play desktop test

Jason approved HTML revision `f8b0abf33c8e8468c7bec27eabc5be2930ed0086` for this local desktop test. It preserves the existing prototype interface and audio implementation. This is a packaged Electron host, not a rewritten native audio engine or full Serato parity.

Double-click **Start Open Play Desktop.command** in the project root. The current build is `local-evidence/desktop-builds/0.1.1/Open Play Test-darwin-arm64/Open Play Test.app`. The bundle starts its own loopback-only asset server; playback/mixing do not need Python, npm, an account or an internet service. Do not quit the server's app while recording. Port18768 is reserved for this test; startup reports a conflict rather than silently moving storage to another origin.

To reproduce on this Mac: `npm ci --prefix desktop`, then `npm run package --prefix desktop`. Node22.12+ and macOS are build prerequisites; exact Electron44.9.0/packager20.3.0 are locked. Packaging archives approved Git assets, then adds the desktop host. Build output is ignored under local-evidence and preserves previous versions. Build0.1.1 is local/ad-hoc test software, not notarized or a public release.

## Test now

- Import local audio, load a track on each deck, start both, move the crossfader, and try cues/loops/FX. Open REC, record, stop and download. Imported bytes currently require reimport after quitting or reloading; settings/mappings use this app's persistent browser profile.
- MIDI → Connect MIDI inputs. The connected Hercules is enumerated. Its observed browser knob is CC1/channel1, with1/127 values; the saved Library browse mapping uses Relative two's complement. Direction and actual desktop selection movement must be observed. No full controller map, LED feedback or physical audio routing is claimed.
- Audio still uses the browser engine/default system output. Headphone cue is labeled simulated. Separate Hercules master/headphone channel routing remains the next functional gap.

## Boundaries

The renderer has no Node integration, stays sandboxed/isolated, blocks external navigation/new windows and uses a CSP. Permission is scoped to this app window/origin. Electron44 emits its coarse `midiSysex` permission for the existing `requestMIDIAccess({sysex:false})`; the host allows that category only for its own local window. Existing input code keeps `sysex:false` and provides no hardware output path. This is not a general device permission broker.

Optional stems still require the documented local Python/model environment and running model service on127.0.0.1:8768. The desktop host forwards only bounded stem routes/requests to that local service; when unavailable it reports503 and ordinary playback remains available. Models and Python are not bundled in0.1.1. Imported music is not uploaded externally.

Read `docs/research/DESKTOP_HOST_REVIEW.md`, `docs/prototype/desktop-0.1.1-package-inspection.json` and the approval ledger. Source/HTTP tests, ASAR parity, launched runtime, actual recording, physical input and physical output are separate evidence. Full1:1 remains open.
