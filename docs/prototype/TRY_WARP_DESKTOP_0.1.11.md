# Current optional desktop test: 0.1.11

Open **Start Open Play Current Test.command** or **Start Open Play Warp Test.command**. The app is **Open Play Warp Test 0.1.11 — current source test**. It is already open on the normal screen with both decks stopped.

This build packages browser source `80744b7`, including actual Simple/Smart Sync, tempo-warp markers, keylocked warp maps, live future-marker edit phase retention and shared original/four-stem processing. The UI is the existing Open Play prototype in Electron. The bundled browser Signalsmith path does not require the optional R3 worker or the installed Rubber Band library.

For a real user test, import owned audio, select it in the library, load a deck and press Play. Use Devices to select the desired output and channel layout, and MIDI to configure/import mappings. This build has a separate profile; older library entries, MIDI maps and Hercules routing were not copied. Current physical controller/headphone/speaker behavior remains unverified on this candidate. Earlier confirmations retain their original version scope.

**Checks → Run shared-stem audio check (isolated)** opens a separate temporary native window. Its Run button uses known prepared fixtures and records the real master bus with physical destinations muted. It cannot alter the normal app's library/settings/mappings profile. Closing it returns to the normal screen. This is a diagnostic check, not a stem-separation quality benchmark. Normal first-use model preparation still uses the optional existing local stem service on port 8768; ordinary playback does not require that service.

Executed on this exact package: native launch, Checks/Run/Save, whole 12.66 s stereo recording, one ten-channel processor/five source outputs, known cancellation across 120/150/90 source sections, Melody-only positive control, all-muted output, then normal main window with 0 decks playing and original demo metadata. All seven declared renderer source hashes match the package receipt. See [native result](desktop-0.1.11-native-stem-result.json) and [package identity](desktop-0.1.11-warp-package.json).

This does not establish main-profile import/restart persistence, complete mapping, physical sockets/hot-plug, music/model quality, arbitrary edits, all transport/FX/cue compositions, cursor/transition continuity, provider integrations or full Serato parity. All 110 feature groups / 522 requirements remain tracked; no full acceptance flag was promoted. Full independent Claude completeness audit remains unlaunched.

Earlier apps/default launchers are preserved. **Start Open Play R3 Transport Test.command** opens 0.1.10; its [historical guide](TRY_R3_DESKTOP_0.1.10.md) and version-specific evidence remain available. This is an unsigned private local test, not a public/portable release.
