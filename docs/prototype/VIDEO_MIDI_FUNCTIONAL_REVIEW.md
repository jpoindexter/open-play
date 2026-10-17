# Video MIDI: current browser functionality and remaining acceptance

17 October 2026. **Full Serato parity and complete REQ-516 acceptance remain unproven.** This browser candidate adds functional Video routing to the existing mapper. It does not update the running 0.1.5 desktop package.

## What changed

`prototype/video-midi.js` defines 44 independent targets: 10 continuous controls, seven selections and 27 commands. They cover channel opacity and links, crossfader and its link, playback/audio-FX links, six ordered FX slots, transitions, directional fades/speed, panels/fullscreen, per-channel save/recall and association/removal. These are a subset of the historical Video manual's 26 control groups; overlay-specific load/selection/size/animation/placement/on-off targets remain missing.

Continuous mappings use absolute full travel or relative steps of 1/127 of the declared range. Selections cycle relatively and select bounded absolute catalog entries. Commands require 7-bit absolute CC or Note press/release and ignore held repeats. Pitch bend and two-byte CC commands are rejected. Continuous 14-bit pairs are separate for each MIDI input source. These are Open Play policies, not measured Serato tapers or current-version device mappings.

The router calls the existing Video mixer owners and has no AudioEngine collaborator. Linked opacity and crossfader controls retain their ownership guards. Save/recall delegates to existing content-identity and stale-operation checks. Fullscreen calls the real browser API; permission/gesture behavior was not executed in this unit.

The existing mapper now supports individual Remove and Reassign without replacing unrelated mappings. Each matching action starts before waiting for asynchronous completion; an asynchronous Video save no longer delays a same-input sampler onset until after its release. Individual failures still propagate, and multiple failures aggregate after other matching actions start. MIDI enumeration now includes input IDs so unrelated device events preserve held edges; only removed sources are reset. Explicit Clear resets all input tracking.

## Executed evidence

| Layer | Result | What it establishes |
|---|---|---|
| Router policy/collaborator tests | 14/14 | Bounded values, command edges, pair isolation, guarded controls and pending-command behavior with controlled collaborators. |
| Independent extracted dispatcher/editor/device callbacks | 5/5 | Corrected pending-save/Hold-release ordering; unrelated Add/device events preserve edges; refused/invalid targets do not suppress other matching actions. No actual audio or GUI in this layer. |
| Actual app browser integration | 14/14 | Real main-module mapper callbacks, learn/Add/Remove/Reassign, GPU pixels, transition/FX changes, generated local video decode, save/recall and association/removal. Programmatic DOM interactions with synthetic MIDI. |
| Actual browser reload | 4/4 | All 37 saved generic and Video mappings restored; actual output fader/FX control works without relearning. |
| Independent artifact inspection | 20 complete PNGs; 18-frame VP8 fixture | Original bytes, hashes, dimensions and declared pixel outcomes; source identities match both phases and current files. Actual reload itself is the parent's UI observation. |
| Key Shift regressions | 10/10 policy; 11/11 dispatcher | Earlier decoder/pending-pitch behavior still passes against current source. Earlier audio captures retain their original candidate identity; they were not rerun or relabeled. |
| Existing Video state/lifecycle suites | 28/28 and 24/24 | Metadata and controlled resource/async lifecycle regressions. These are not browser playback tests. |

Final browser evidence: `video-midi-browser-final-results.json` and `video-midi-browser-final-restored-results.json`. The initial phase retains 17 full PNG frames plus the original 2,067-byte VP8 fixture. The restored phase retains three full PNGs. The fixture decodes to 18 distinct 320×180 frames over 0.570692 seconds; a small corner changes while the center stays red. The main app audio is paused, so this is not sustained moving-output/AV synchronization evidence.

Actual rendered comparisons include both fader endpoints, zero/partial opacity, mixed Crossfade → Upfaders Only → Crossfade, each of the six FX slots independently, directional right fade, and decoded video red → Negative cyan → recalled red. Independent pixel error is at most one channel unit against the original tolerance of two. Whole before/restored transition images and whole red/recalled images match. No PNG was cropped or repaired.

The browser checks preserve actual audio crossfader, all channel levels, loaded-track identities, stopped transports, rates and key shifts. They do **not** measure audible output under ongoing playback. The controlled sampler-release test is distinct from actual sampler audio acceptance.

Not every registered target has browser acceptance: playback/audio-FX link commands, left/stop directional fade, right save/recall/association/removal and fullscreen remain code-path/controlled evidence only. The `Video open panel` browser predicate found an already-present panel; its controlled routing check is valid, but hidden-to-open behavior needs an explicit test. Selection registration is not full per-target behavior acceptance.

The independent controlled dispatcher suite ran before the final test-only harness expansion. Its production hashes match this candidate; its recorded harness hash is historical and does not represent a browser execution. The final browser and artifact reviews have their own matching current harness identities.

## Failures retained and corrected

- Missing router: 0/12 controlled tests. Missing mapper integration: 0/1 browser check, stopped before Video state mutation.
- A subsequent reload used cached older panel bytes. Its source hashes identify that stale cohort; it is not current-candidate acceptance. Fresh isolated origins and no-store responses were used afterward.
- Review reproduced two-byte CC commands toggling twice and continuous pair contamination across devices: 12/14 controlled tests before correction, 14/14 afterward.
- Independent review reproduced stale sampler onset after Note Off and held-toggle rearming after unrelated Add: 0/2 before correction. The corrected independent suite passes 5/5, including device-event and error-isolation cases.
- Earlier 10/4 and 13/4 browser phases remain separately retained. The earlier 619-byte fixture contains one frame; its passing static decode never establishes moving-video behavior. The final fixture is separately generated and retained.

Read `docs/research/VIDEO_MIDI_SOURCE_REVIEW_20261017.md` and `VIDEO_MIDI_FINAL_ARTIFACT_REVIEW_20261017.md`. `video-midi-candidate.json` freezes current identities; `video-midi-browser-observation.json` records actual CUA/main-view observations and cleanup.

## Still required

Complete the missing overlay-specific target registry and click-on-control learn/unassign workflow, including suppression of normal mouse actions and cancellation on close/focus loss. Test every currently registered command from its actual trigger state, including hidden panels, permission refusal, both channels, failures and compound actions. Full mapping import/presets/modifiers/feedback, physical WebMIDI/controller lifecycle, mixer-versus-secondary-controller authority, native packaging and all current-reference comparisons remain open.

The old keylock cursor diagnostic, stem quality failures, FX sonic/range equivalence, external video outputs, provider/Link/Smart Sync/files/recording/DVS/HID/CDJ and broad hardware gates remain unchanged. All 110 feature groups / 522 canonical requirements, nine separate beta deltas and 26 provisional release checks remain in scope.

Owned test tab 43 was closed. Hosts on 18772–18775 terminated; `lsof` found no listeners. Existing user tabs and old native bundles were preserved.

Skills applied: use, test-driven-development, dec-software-principles, dec-quality-testing, adversarial-verify, claude-codex-handoff, verified-done family.
