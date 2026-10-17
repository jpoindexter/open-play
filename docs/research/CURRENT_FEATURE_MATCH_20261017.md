# Current-feature match check — 17 October 2026

**Open Play 0.1.5 does not have established 1:1 parity with Serato DJ Pro.** This check preserves the 110-group / 522-requirement baseline, nine separate beta deltas, and adds 26 explicit release-page checks: 24 relevant to macOS and two Windows-only reference cases. These are not 26 new canonical requirements or passed implementations. The full current inventory remains unfinished.

REA freshly read installed version **4.0.10.213**, evidence `ev_70d315bdd494a9efdba20445607af197cdbc8bbbfa56e6eb1e5ab6392b744f3a`. Its plist permissions, custom URL scheme and stem extension are declarations, not runtime compatibility. The [official current download page](https://serato.com/dj/pro/downloads) still identifies 4.0.10. The [5.0 beta](https://the-drop.serato.com/announcements/lucid-beatgrids-just-dropped-in-the-serato-dj-5-0-beta/) remains separately scoped and uninstalled.

## Native gap and newer browser implementation

**Key Shift cannot be selected in the unchanged0.1.5 desktop MIDI mapper.** Native MIDI → Target exposed eight options: Library browse, two play targets, two cue targets, Crossfader, Sampler 1 and FX depth. Video targets are also absent. The original packaged source confirms that bounded absence; the newer browser source now has four Key Shift targets. A real browser-knob mapping does not establish these other targets.

Evidence: [current-feature-check-native-observation.json](../../docs/prototype/current-feature-check-native-observation.json), [parity-current-midi-targets-0.1.5.png](../../docs/prototype/screenshots/parity-current-midi-targets-0.1.5.png), [preserved original comparison](../../docs/research/CURRENT_FEATURE_MATCH_20261017_NATIVE015.md). The official release-page Key Shift fix makes this a specific current-version obligation. Serato’s own MIDI behavior was not exercised in this check.

The newer browser source has actual four-deck Key Shift and saved-mapping audio evidence: [functional review](../../docs/prototype/MIDI_KEYSHIFT_FUNCTIONAL_REVIEW.md), eight initial plus three reload checks and eight complete recordings. The prior accepted core Video MIDI candidate changed four existing files relative to0.1.5 and added its router. The current overlay matrix changes seven existing files relative to0.1.5 and includes four new production modules. All28overlay targets have default7bitCC browser witnesses; all encodings/compound/error paths and full72target workflows remain unaccepted. The audio engine is unchanged. Key Shift recordings retain the preceding candidate identity. These browser results are not a new native or physical test and do not establish complete REL-05 equivalence.

Core Video MIDI now has [functional review](../../docs/prototype/VIDEO_MIDI_FUNCTIONAL_REVIEW.md):14initial/4actual-reload browser checks,37saved mappings and20wholeGPU PNGs. Independent review corrected compound dispatch and held edges. The overlay source registers 28 additional targets and visible-control assignment. Prior scoped9/3 browser evidence retains its original checkpoint. The newer [overlay matrix](../../docs/prototype/VIDEO_OVERLAY_MIDI_MATRIX_REVIEW.md) executes21initial/5actualreload checks with29savedmaps and115wholePNGs, including all28defaultCC target witnesses and a non-first owner reopen regression. Three further editor/MIDI name/feedback/ownership defects were corrected. Other encodings/compound/error paths and full72target workflows remain open. Some core commands, physical/native transfer and full REQ-516 remain open.

## New scheduled-clock engine diagnostic

A separate official Electron host executes the unchanged production engine/WASM and a new test-only clock observer. [Whole original review](../../docs/research/ENGINE_RENDER_CLOCK_NATIVE_EVIDENCE_REVIEW.md): valid full capture/calibration, 5/10 bounded cursor cases, all eleven pitch/control intervals pass. Five cases remain unaccepted solely due to seven nonunique marker probes. All 985,728 parameter values and four-channel PCM/7,701 rows were independently inspected. This does not explain or repair the older globally failed run, prove common-mode freedom or accept the main packaged app, physical/musical/compound/reference behavior. No production engine or native bundle changes.

## Executed observations and accounting: separate phases

- This recheck: official production download/manual/product/beta pages were opened and REA re-read installed Info.plist identity as4.0.10.213; no reference runtime comparison or repeated deep Ghidra import. See REA_PARITY_RECHECK_IDENTITY_20261017.json.
- Earlier this date: screenshots of the installed reference and running Open Play 0.1.5; actual MIDI menu inspection, with no mapping or connection change. App restored to paused main view.
- Of the200baseline production files, 7 current browser files differ and four new production modules are present, as recorded by the current scoped overlay matrix manifest. Earlier overlay/core/KeyShift sources are verified through their exact historical commits, not regraded as current runs. Current ASAR still matches the unchanged0.1.5 bundle. Source correspondence alone is not a feature test.
- This generator reconciles evidence for every canonical group and requirement; no runtime test or full-feature pass is awarded. Earlier physical, storage, FX, stem and keylock evidence retains its original scope.

## Current release obligations

Each row inherits the existing per-feature Codex and Claude Code model/effort recommendations in the JSON companion. Recommendations are not a live model-catalog verification. No full release-case parity pass is awarded. REL-05 has newer browser subset evidence while its0.1.5 native target remains absent. REL-07 and REL-18 are Windows-only facts, outside the current macOS parity gate. Recent-update rows are not claimed to have debuted in 4.0.10.

| Check | Feature groups | Subject | Proposed test |
|---|---|---|---|
| REL-01 | HW-001, HW-005, HW-004, STM-005 | Hercules T10 | With the named device, exercise motorized platters, stem controls, Slip Release and display/LED feedback; preserve unavailable-device status. |
| REL-02 | SYS-004, AUD-001, AUD-004 | Tahoe driver compatibility | For each listed device on macOS Tahoe, test driver availability, connection, audio routes and reconnect; do not bundle proprietary drivers as open-source code. |
| REL-03 | SYS-009, LIB-003 | Spotify playlist completeness | With authorized provider access, traverse a playlist exceeding one API page; check IDs, ordering, duplicates, expiry and complete enumeration. |
| REL-04 | LIB-008, LIB-016, MIX-002 | History with crossfader disabled | Disable the crossfader, audition a channel, expose it to the mix, then restart; compare played/unplayed history with the reference. |
| REL-05 | HW-002, DEK-007 | MIDI Key Shift | Learn a controller for each deck Key Shift, move it in both directions, measure semitones and independence from tempo, then save/reload the mapping. |
| REL-06 | DEK-018, HW-004 | XDJ-AZ sync-load BPM display | With Maintain Sync on Track Load enabled, replace a track and compare deck BPM, device BPM and audio rate before and after takeover. |
| REL-07 | AUD-004, HW-004, HW-005 | XDJ-AZ connection completeness | On the documented Windows 11 configuration, connect/reconnect and verify all interfaces, display and button feedback; a macOS result cannot pass this case. |
| REL-08 | LIB-002, HW-004, HW-010 | SYSTEM ONE computer changeover artwork | Switch the device between two authorized computers with loaded media; confirm stale artwork is cleared and the new owner alone updates the display. |
| REL-09 | ANA-001, HW-004 | SYSTEM ONE waveform continuity | With the named device and owned long fixtures, compare complete overview/detail waveforms during scrolling and transport changes. |
| REL-10 | LIB-003, HW-004 | SYSTEM ONE selection centering | Toggle Center on Library Selection and navigate enough rows to scroll; confirm device and software keep the intended row centered. |
| REL-11 | SYS-009, LIB-003, HW-004 | SYSTEM ONE streaming selection stability | Populate a provider catalog in multiple pages while selecting a track; confirm asynchronous insertions preserve the selected identity. |
| REL-12 | DEK-004, HW-004 | SEVENTY-TWO MKII auto-loop feedback | Enter Auto Loop, trigger each supported size, and compare pad colors/state with the reference during loop changes. |
| REL-13 | DEK-003, HW-004, AUD-004 | DJM-S11 hot-cue reconnect feedback | Set owned-fixture cues, reconnect the mixer, then verify every pad displays the current cue state without stale lights. |
| REL-14 | DEK-004, HW-003 | DDJ-FLX6 and DDJ-400 long-press loop | For both named devices, hold the four-beat loop action across a beat boundary; measure unchanged loop start, length, release and retrigger. |
| REL-15 | DEK-003, ANA-001, HW-004, HW-006 | CDJ-3000 cue overview | Create cues at known fixture samples; compare hardware overview markers with software and audible recall at zoom/track changes. |
| REL-16 | HW-004, HW-005 | PRIME 4 deck color | Change deck color/state and verify the named hardware LEDs update for the correct deck after reconnect. |
| REL-17 | SYS-004, AUD-001 | Reloop ELITE driver prompt | On a disposable supported driver-missing setup, connect the device; distinguish install guidance from a generic connection failure and retry safely. |
| REL-18 | SYS-004, AUD-001 | Beatmix 2 and Beatmix 4 Windows prompt | On Windows with each supported device, distinguish actual driver requirements from an unnecessary install prompt; verify connection remains usable. |
| REL-19 | MIX-001, ANA-001, HW-004 | AlphaTheta/Pioneer waveform fader interaction | During playback on named display devices, raise the channel fader; check waveform position/continuity and audible output independently. |
| REL-20 | HW-001, HW-004, HW-005, DEK-005 | XDJ-AN | With the device, exercise touch library navigation, pad modes, Beat Jump and available independent functionality; document each missing protocol. |
| REL-21 | HW-001, HW-004, HW-005, FX-004 | Party Mix III | Test both decks, eight-pad modes, stems, Fade FX and beat-synchronized lights with owned fixtures. |
| REL-22 | HW-001, HW-003, HW-005, FX-004 | MixTrack Go | Test both channels, all five pad modes, stem actions and Fade FX through the physical controls and audio routes. |
| REL-23 | HW-006, HW-004 | CDJ-1500X | Identify the actual interfaces, then exercise connection, decks, browse/load, jog, feedback and reconnect with the named media player. |
| REL-24 | HW-001, HW-003, HW-005 | Inpulse 200 MK3 | Use the named device rather than extrapolating the Inpulse 300 MK2 test; capture controls, audio routing, feedback and reconnect. |
| REL-25 | HW-001, HW-007, HW-008, AUD-003 | DJM-250MK2 / DJM-750MK2 / DJM-450 | For each mixer, verify routing, inputs, calibration, internal/relative/absolute/THRU transitions and changeover using the required physical equipment. |
| REL-26 | SYS-009, LIB-009, LIB-011 | Beatsource migration | With authorized disposable provider/library data, migrate to Beatport and verify retained metadata, identity, missing-media handling and rollback. |

REL-02 includes these 12 named driver devices individually: DDJ-1000SRT, DDJ-SR2, DDJ-SX3, DJM-250MK2, DJM-450, DJM-750MK2, DJM-900NXS2, DJM-S3, DJM-S5, DJM-S7, DJM-S11, XDJ-XZ. REL-07 and REL-18 remain separate Windows references, not missing macOS features. They become acceptance obligations only if Windows is explicitly added to the build scope.

## Remaining match gates

See the existing complete [CURRENT_PARITY_AUDIT_20261017.md](../../docs/research/CURRENT_PARITY_AUDIT_20261017.md) for all 110 groups and all 522 requirement IDs in its JSON. Explicit backend gaps include providers, Link, Smart Sync phase/takeover, files/tags/interoperability, DVS/HID/CDJs, mic/aux and recording input/split/recovery. Exact FX response, stem quality, keylock return/composition, video outputs, controller feedback and long-session acceptance remain open.

The fresh main-view comparison still shows different mode/loop-control presentation and an always-visible mixer in Open Play absent from the inspected Serato state. Different viewport sizes, loaded tracks and play positions prevent pixel or waveform-quality comparison. Other layouts/settings remain untested.

Done means exact-candidate, end-to-end comparison against reconciled current-reference behavior, including failures, compound actions, quality and required devices/services. Feature names, matching file hashes, a packaged wrapper and passing subsets cannot satisfy that criterion.

Reproduce **accounting only**: `node scripts/audit_current_parity.mjs` followed by `node scripts/check_current_release_parity.mjs`. The second command requires the preserved local screenshot/AX evidence and 0.1.5 bundle. It does not control applications or rerun tests.

Skills applied: use, gap-analysis, dec-quality-testing, reverse-engineer-anything, adversarial-verify, claude-codex-handoff, verified-done family.
