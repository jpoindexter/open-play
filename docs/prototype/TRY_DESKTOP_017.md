# Try Open Play Keylock Test 0.1.7

Open **Start Open Play Keylock Test.command** from the project folder. The app is also already open and paused. Check the title says **Open Play Keylock Test 0.1.7 — experimental phase keylock**.

1. Deck 2 has the restored synthetic stereo fixture loaded. Press its play button. Key lock is on and tempo is +8%; use Key + / Key − to try independent pitch changes.
2. Pause before loading your own local audio. Use **Import audio**, select the track in the library, then **Load** on the desired deck. Imports stay in this test app's separate local profile.
3. To check your Hercules, open **Devices** and select its output. Open **MIDI** to connect/map controls. This profile does not inherit the old app's mappings or routing. This candidate's hardware behavior needs a fresh test.

The old **Start Open Play Desktop.command** still opens the previous app. Both apps can be open; confirm the title before testing. Close or pause one before playing the other.

Executed here: native import/load/play, keylock with +8% tempo and +2 pitch, pause/reset/seek/resume, two saved master recordings, clean quit/relaunch/import restoration. Both declared stereo frequency tests pass within 1 Hz. Relaunch playback has meter/UI evidence; it was not a third saved recording.

This is a limited local test. Full Serato parity, music quality, precise cue/seek timing, stems/loop/scratch/reverse combinations, long sessions and this build's physical routing/full controller mapping remain unverified. Recording is currently WebM/Opus, with the remaining export/routing work tracked separately. Providers labeled simulation are still simulations. No public release or project-wide licensing clearance is implied.

Evidence: section69 of FULL_BUILD_PLAN.md, the two `desktop-0.1.7-phase-*audio-inspection.json` reports, and `docs/research/DESKTOP_PHASE_017_INDEPENDENT_REVIEW_20261017.md`. The exact original prompt and broader remaining scope are retained in the Claude handoff.
