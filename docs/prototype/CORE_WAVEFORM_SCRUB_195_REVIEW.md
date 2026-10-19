# Core195 — detailed waveform positioning

Follow-up to Jason's supplied [Main Waveform Display documentation](https://support.serato.com/hc/en-us/articles/224969307-Main-Waveform-Display). Core194/desktop25 corrected frequency color, source detail, pitch-scaled timing and zoom. This change adds direct positioning from that same detailed waveform, which the reference documents as click/hold scrub.

Horizontal rows and Vertical columns get transparent, deck-specific focusable gesture surfaces. Left/up advances source position; right/down rewinds, using the displayed playback-window span multiplied by nominal pitch. Shift held at the start gives ten times finer movement; zoom/pitch/geometry are snapshotted for the gesture. Focused Left/Right auditions original time; release restores the previous playing/paused mode. Escape, capture/window loss and track/view changes retire the owner. Escape stops the gesture; it does not promise undo of movement already auditioned. Zoom controls remain above the gesture surfaces.

The existing delegated platter controller and AudioEngine begin/update/end scratch transport own preparation, source positions, audio routing and release. No repeated seek, source restart, AudioEngine, waveform spectrum algorithm or MIDI-map change. Preparation is marked busy with a live status; focus has a visible ring. No decorative animation.

Focused controlled controller checks:27/27, including the original23 platter/ownership cases and4 new waveform cases. The new cases cover both axes/decks, pitch-scaled source seconds, final release, Shift sensitivity snapshot, Escape and pending cancellation/invalid input. This is controlled DOM/clock/ACK evidence, not native pointer, AudioEngine or PCM proof. The first native26 run moved deck1 upward20.000→20.658 while paused and left deck2 unchanged, but short follow-up drags discarded movement when preparation had not acknowledged before release. Those failed short gestures are retained as failures, not acceptance. A waveform-only pending-release path now retains the final requested position, commits through the same transport when ready and releases. Escape, source/view changes or a newer gesture retire that owner without replay. The focused checks include the measured short-drag regression and cancellation/supersession; native27 is the next verification path.

Done for this scoped gesture means actual native waveform drag moves only its intended real track, both layouts use the corresponding axis, and release leaves paused playback paused or ongoing playback advancing. Core musical/manual/Sync/headphone/physical and visual acceptance remain open. Existing audio evidence191/192 remains scoped to24; no advanced feature or repeated DSP matrix is planned.


## Native27 observations and boundaries

Built from a20059d5d3b2c3041e80900428e2995d28da3d08; ASAR a4d7135432916a3fb0467d008cd6c97ffb293b4ec63aeeba2e36bff50b60afcb. Five production modules served by the actual app match packaged source; the separate archive/host inspection passed5checks. Both saved real MP3s loaded through normal library controls.

- Vertical paused deck1 upward100screenshot pixels:20.000→20.658s; deck2 stays20.000.
- Horizontal paused deck2 left400pixels:20.000→20.559s; right400pixels returns20.000. Deck1 stays20.658. Both remain paused; visible release status observed.
- Deck2 Play gives an advancing real-track timer and positive master meter. Focused waveform Right-hold/release emits the normal scratch release status and leaves1deck playing, deck1 unchanged. No acoustic quality or pointer-drag result is inferred from this keyboard path.
- A reverse Vertical input and first playing pointer drag were interrupted by computer-control state changes. A later playing pointer input returned no release status. These are not accepted pointer-while-playing observations. Do not repeat a broad matrix; finish one uninterrupted playing drag when the desktop is available.

Both songs are left paused20s in Horizontal. Actual final controls: both Sync on, deck1+4.7%/121BPM, deck2pitch0/121BPM, deck1low−24dB, other EQ/filter0, master−12dB, crossfader center. Sync/EQ changed during live checks; not attributed to the accepted gestures and not silently reset. Record exact state rather than claiming a neutral session. Recorder not started.

Closed-profile backups: before26,198files/36823648B; before27,201files/36723065B. Each before/after/copy content hash comparison matched. Prior25/26remain; mappings were not edited. Original MP3 sizes, mtimes and hashes match188. Raw screenshots/AX/music/profile evidence remains ignored/private. The current launcher targets27. The full build plan and Claude handoff keep the core-only goal and original prompt suffix.

Still open: uninterrupted pointer-drag release during playback, actual native Shift modifier, visual-user acceptance, practical audible manual/Sync transitions and physical/headphone checks. The supplied reference also documents Extended-view Shift-click size changes; that behavior is explicitly inventoried, not claimed by these Horizontal/Vertical controls. No full feature parity is declared.
