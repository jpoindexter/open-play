# Try desktop0.1.29 — current core candidate

Open `Start Open Play Current Test.command` or `Start Open Play Playback Test 0.1.29.command`. Close another playback-test version first; all use the existing profile and port18775. Earlier bundles/launchers remain. This version opens the chosen rekordbox workspace directly with all custom controls and library previews.

The app initially loads demo decks; select each saved real song row and use Shift+Left/Right or its deck Load. Choose Horizontal/Compact, Sync OFF and reset both pitch controls. The last recorded master gain is−12dB; choose a comfortable listening level. Original music is unchanged.

Core session: manual incoming tempo, T/Y left or G/H right momentary jog, one manual transition, each channel LOW/MID/HIGH/reset, temporary Cue set/hold/release then Cue+Play latch, final pause/silence. Keep full keyboard inventory and intermittent Sync pop OPEN; suitable connected hardware is required for independent headphone routing and controller acceptance. Capture the next actual pop instead of repeating clean matrices.

See [current implementation/native evidence](CORE_DJ_REBUILD_2026-10-20.md). Packaging is not listening acceptance or full parity.

---

## Historical0.1.27 guide

# Try desktop0.1.27 — core DJ workflow

Current local candidate adds drag-to-scrub on the detailed RGB waveforms. [Observed results](desktop-0.1.27-playback-observation.json), [focused review](CORE_WAVEFORM_SCRUB_195_REVIEW.md).

Open `Start Open Play Current Test.command` or `Start Open Play Playback Test 0.1.27.command`. Close another playback-test version first; versions share the existing profile and port18775. Current running27session has both saved real MP3s paused20s. After restarting, the app initially loads demo decks; select the saved local rows and Load onto the desired decks. Original music stays unchanged.

- In Horizontal, drag the appropriate detailed row left/right; Vertical uses the corresponding column up/down. Left/up advances; right/down rewinds. A short completed drag waits for preparation to commit its final position. Escape or a new gesture can cancel/replace that pending request.
- Shift held at the start requests ten-times-finer movement. That modifier is controlled-fixture verified; native modifier acceptance remains pending.
- Focus a detailed waveform and hold Left/Right to audition. Release restores prior play/pause mode. Escape ends the gesture; it does not undo movement already auditioned. +/-keys or buttons zoom1–16s.
- Current live mix controls are both Sync on at121BPM (deck1+4.7%, deck2zero), deck1low−24dB; others neutral. Master−12dB/crossfader center. They changed during checks and were preserved. Choose the desired EQ/Sync/manual tempo before mixing.

Actual native paused dragging in both layouts and waveform keyboard release while playing were observed. An uninterrupted playing pointer drag is still needed; the interrupted attempts are not accepted. RGB frequency colors are independent bass-red/mid-green/treble-blue display analysis; user visual match and proprietary rendering are not established. Extended-view Shift-click small/large sizing is documented but not implemented here.

Keep the controller disconnected while Jason is away. When available, do one practical two-song manual and Sync transition, including headphone/master blend and core physical controls. Existing cue/EQ/jog audio proofs are scoped to24. Do not repeat those matrices or resume advanced features. Prior25/26/versioned launchers and closed-profile backups remain. No full parity or public release claim.
