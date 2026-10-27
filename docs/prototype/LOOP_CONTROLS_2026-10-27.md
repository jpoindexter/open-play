# Preserve controls while looping — 27 October 2026

Delivery update: both source repairs are now included in current private0.1.78/sourceae84a50. Protected native startup/recovery observed; paused loop feedback checked once. Relevant held/playing and delayed-Double Stop/listening criteria remain open. See [current delivery](DESKTOP_CORE_078_2026-10-27.md). Original source-slice evidence below retains its scope.

[CORE-FIX-30](https://trello.com/c/43KIYSnq), open for future desktop/native acceptance.

Actual isolated four-deck Compact Loop Half on source71089e3replaced all225observed control/canvas/lane nodes and the other-channel fader, while generated tracks stayed stopped and physical output was muted. The fallback deckAction renderer and shared manual-loop/loop-pad callbacks rebuilt all decks for nonstructural feedback changes.

The repair adds one38-line loop-presentation module. Loop/Half/Double/Beat Jump and manual-loop/Auto Loop/Roll callbacks refresh current loop labels, active/aria-pressed feedback, saved-loop slot and pad text/state in place. Shared-track saved names reach every visible matching pad through existing state. Only the affected source overview redraws for loop shading; original engine calls, error handling, persistence and cancellation remain. Actual schema changes/missing visible controls retain structural fallback. Slicer and explicit pad-mode/schema changes keep their separate existing renderer. The packaging manifest declares the new module for the next normal candidate; no bundle was built in this slice.

Executed actual GUI after repair: same Half retains225/225and length2/Loop2/2→; paused Loop on, IN edit and Save retain225/225. After explicit mode/schema changes, Auto Loop selection and Roll release retain230/230each, with correct selected/released feedback. All retain the same other-channel fader, four Play controls, library preview images, stopped transports and physical mute. Only three previews were visible in this fixture viewport; this is retention evidence, not a complete library inventory.

One composed40-line regression runs the actual deckAction and actual manual-loop/loop-pad callbacks with controlled transport collaborators. It fails at the original global rebuild, then passes after wiring the shared presenter. It covers loop/length/jump, manual fine edit/save/shared-track naming/slot, Auto/Roll state lifecycle and structural fallback. No broad Node suite, real-music replay, soak or repeated listening pass. New helper38lines; existing manual/loop-pad modules62/91lines. Legacy oversized app.js remains modularization debt; the focused presenter does not claim whole-repository compliance.

This proves stopped browser control retention and bounded presentation behavior. It does not prove native held/playing use, musical timing, reduced full-session frame latency or a Sync-pop cause. Those remain open with CORE-LIVE-01 and CORE-FIX-01/07. Native0.1.76/profile/session unchanged; staged0.1.77/source57afcc6predates this repair and stays immutable. No third bundle, Downloads artifact or profile backup was created.

The owned diagnostic frame was stopped, closed before clearing its origin data, and its tab/server closed. Temporary prototype fixture files were removed after matching their ignored evidence copies. The intentional flat-black user preview remains separate. Compact evidence: [results](loop-controls-2026-10-27.json); raw reproduction/test output remains ignored under local-evidence/loop-controls-2026-10-27/.

Re-entry: after unlock preserve Recording/session and execute the protected staged-candidate transition. Include this source repair in the subsequent normal immutable package once retention has room; observe relevant native controls in the existing owner session without repeating accepted ordinary mixing matrices.

Later delivery: protected native0.1.77/source57afcc6startup/recovery observed; defaults now77and only77bundle remains. This loop repair is still newer than that immutable candidate. See [native77evidence](DESKTOP_NATIVE_077_2026-10-27.md).
