# Open Play desktop test

**Current local core test:0.1.30.** Use `Start Open Play Current Test.command` or the versioned0.1.30launcher. Jason authorized the rebuild on20October. It opens the existing rekordbox workspace with all custom controls/layouts/library previews, and contains cue/keyboard safety fixes. [Current evidence and acceptance gaps](../docs/prototype/CORE_DJ_REBUILD_2026-10-20.md). Earlier notes below are historical; the separate general desktop launcher is preserved.

The default **Start Open Play Desktop.command** opens local test **0.1.6**. The separate **Start Open Play Desktop 0.1.5.command** preserves the prior persistence/keylock build; earlier0.1.3/0.1.1 launchers remain available. Quit the running test before switching versions. This is the already-approved Electron wrapper around the existing browser implementation, with no native DSP rewrite or public release.

Version0.1.6 packages immutable source `dd068e4dc9338d1f4f131e0c64c9195073fbebed`; approved baseline `f8b0abf` remains separate. Actual ASAR `f9e85d9ef3150fd37c15f5b3d72a4e3f6a06a42a59bf29617a43bdf566cdba6e`:222/222 prototype files match. Host changes are title/About metadata; sandbox, permissions, fixed loopback origin and storage partition remain unchanged. The cleanly closed0.1.5 local profile was backed up before launch; older bundles are unchanged.

Actual0.1.6 native main-app tests: synthetic Learn/Add saved a deck2 relative Key Shift mapping alongside the original browse mapping; verified66/62 input moved+2/backto0 with tempo still+8%. Native REC/Save retained both complete stereo recordings. **The declared audio-accuracy test fails one of four channel checks:** +2left371.4587Hz versus370.4125Hz expected exceeds the1Hz limit; three independent estimates corroborate it. The other three channel checks pass. This is an independent fixture criterion, not an established Serato comparison. No threshold change or cause claim.

Actual native Video mapping controls rendered master-text opacity:8,318 bright pixels →0→8,318 with exact restored ROI. A clean quit removes PID93085/listener; newPID94208 restores all3 mappings and3 saved imported tracks without autoplay. Reopened mappings export byte-identically and execute again. These are synthetic main-app subset tests, not physical MIDI, all72 Video workflows/REQ-516, hardware quality or full parity.

Read `docs/prototype/DESKTOP_016_FUNCTIONAL_REVIEW.md`, exact candidate manifest and independent host/audio/Video/restart reviews. Whole original native screenshots may contain JPEG bytes despite their historical .png filenames; originals are preserved. Failed numeric automation/incorrect6→−24 input and test-only assertions remain recorded. Current0.1.6 is available for local testing with these limits.

## Preserved0.1.5 evidence and runtime requirements

Version0.1.5 packages immutable source48a6d4dad2f217a8ba166b9ca890a287aabc4feb, separately recording original approvedHTMLf8b0abf. All200prototypefiles and actual host bytes were checked; sanitized package metadata is expected. Build output is ignored under local-evidence. Failed0.1.4 title build and0.1.2 permission build remain as evidence, without launch shortcuts.

Actual native test: WAV and MP3 imported through macOS choosers; Files2saved/0session-only. CmdQ removed process47191 and port18768 listener. Relaunch created process47465, restored both tracks without autoaudio/reimport, and both loaded/played on deck2 while deck1 stayed paused. NativeREC/Save recordings were decoded in their entirety; additional declared1–3s analysis confirms330Hz left/550Hz right. This proves the owned-fixture clean-restart/playback path. Crash/eviction/real disk-full/allformats/metadata migration, musical quality and full Serato parity remain open.

Playback/mixing need no Python/npm/account/internet service. The host starts its own loopback server at127.0.0.1:18768; a port conflict fails explicitly so storage never silently changes origins. Imported bytes are stored locally when saving succeeds; Files reports session-only failures and offers retry. Keep original music files. Do not quit while recording.

MIDI input/mapping and selected-output routing retain the existing code. Historical0.1.1 Hercules browser-knob navigation and0.1.3 headphone/master isolation were user-confirmed; no new0.1.5 physical-controller/output/latency acceptance is claimed. New sessions start stereo master-only; choose the specific output and explicitly apply four-channel pairs when needed. Full mappings/jogs/LEDs/hotplug/other devices remain open.

Renderer Node integration stays disabled, sandbox/context isolation/web security enabled. Owned-main-frame/origin/requestingURL checks allow only MIDI, coarse midiSysex and speaker-selection categories. Existing MIDI requests sysex:false and sends no hardware output. Mic/camera remain denied; popups/external navigation blocked. Permission callbacks/package checks do not establish general security acceptance.

Optional stems require the separately documented local Python/model service on127.0.0.1:8768. Models/Python are not bundled. The host forwards only bounded stem API routes; missing service gives503 while ordinary playback remains available. Music is not uploaded externally.

Reproduce on this Mac with existing exact dependencies: npm ci --prefix desktop, then npm run package --prefix desktop. Node22.12+ and macOS required; Electron44.9.0/packager20.3.0 unchanged. Existing-version output is never overwritten; use a new test version for a changed package. Local/ad-hoc build is not notarized.

Read docs/prototype/DESKTOP_PERSISTENCE_REVIEW.md, desktop-0.1.5-runtime-observation.json, package inspection, audio inspection and docs/research/DESKTOP_PERSISTENCE_HOST_REVIEW.md. Source, ASAR, actual native runtime/internal capture and user-confirmed physical sound remain distinct proof layers.
