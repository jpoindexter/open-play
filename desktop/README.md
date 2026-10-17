# Open Play desktop test

The default **Start Open Play Desktop.command** opens local test version0.1.5. Separate0.1.3 and0.1.1 launchers preserve the earlier working bundles. Quit the running test before opening another saved version: the host permits one instance. The native window title now identifies the version even while the HTML page retains its prototype title. This is the approved Electron host around the existing interface/audio implementation, not a native DSP rewrite or public release.

Version0.1.5 packages immutable source48a6d4dad2f217a8ba166b9ca890a287aabc4feb, separately recording original approvedHTMLf8b0abf. All200prototypefiles and actual host bytes were checked; sanitized package metadata is expected. Build output is ignored under local-evidence. Failed0.1.4 title build and0.1.2 permission build remain as evidence, without launch shortcuts.

Actual native test: WAV and MP3 imported through macOS choosers; Files2saved/0session-only. CmdQ removed process47191 and port18768 listener. Relaunch created process47465, restored both tracks without autoaudio/reimport, and both loaded/played on deck2 while deck1 stayed paused. NativeREC/Save recordings were decoded in their entirety; additional declared1–3s analysis confirms330Hz left/550Hz right. This proves the owned-fixture clean-restart/playback path. Crash/eviction/real disk-full/allformats/metadata migration, musical quality and full Serato parity remain open.

Playback/mixing need no Python/npm/account/internet service. The host starts its own loopback server at127.0.0.1:18768; a port conflict fails explicitly so storage never silently changes origins. Imported bytes are stored locally when saving succeeds; Files reports session-only failures and offers retry. Keep original music files. Do not quit while recording.

MIDI input/mapping and selected-output routing retain the existing code. Historical0.1.1 Hercules browser-knob navigation and0.1.3 headphone/master isolation were user-confirmed; no new0.1.5 physical-controller/output/latency acceptance is claimed. New sessions start stereo master-only; choose the specific output and explicitly apply four-channel pairs when needed. Full mappings/jogs/LEDs/hotplug/other devices remain open.

Renderer Node integration stays disabled, sandbox/context isolation/web security enabled. Owned-main-frame/origin/requestingURL checks allow only MIDI, coarse midiSysex and speaker-selection categories. Existing MIDI requests sysex:false and sends no hardware output. Mic/camera remain denied; popups/external navigation blocked. Permission callbacks/package checks do not establish general security acceptance.

Optional stems require the separately documented local Python/model service on127.0.0.1:8768. Models/Python are not bundled. The host forwards only bounded stem API routes; missing service gives503 while ordinary playback remains available. Music is not uploaded externally.

Reproduce on this Mac with existing exact dependencies: npm ci --prefix desktop, then npm run package --prefix desktop. Node22.12+ and macOS required; Electron44.9.0/packager20.3.0 unchanged. Existing-version output is never overwritten; use a new test version for a changed package. Local/ad-hoc build is not notarized.

Read docs/prototype/DESKTOP_PERSISTENCE_REVIEW.md, desktop-0.1.5-runtime-observation.json, package inspection, audio inspection and docs/research/DESKTOP_PERSISTENCE_HOST_REVIEW.md. Source, ASAR, actual native runtime/internal capture and user-confirmed physical sound remain distinct proof layers.
