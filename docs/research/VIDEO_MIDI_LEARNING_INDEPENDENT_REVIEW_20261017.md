# Independent Video MIDI assignment and editor integration review — 2026-10-17

Source and controlled callback execution only. No production edits, GUI/device/native actions, Git, external services or full reference-parity acceptance. Applied adversarial verification, integration testing and explicit ownership boundaries. Parent owns fixes and actual browser execution.

## Confirmed failures at initial integration source

Owned `scripts/test_video_midi_learning_independent_review.mjs` executes the actual assignment/match helpers, extracted receiveMIDI and editor callbacks, actual mixer assets with controlled Image.decode, and actual createVideoControls rendering with bounded document collaborators. The DOM collaborators establish generated markup and callback results; they are not a real browser's native input/default-action execution. Initial immutable evidence grows from 0/2 (`video-midi-learning-independent-initial-results.json`) through 0/3 and 0/4 to **0/5** (`docs/prototype/video-midi-learning-independent-scope-results.json`). No original result was overwritten.

1. **14-bit Note capture changes the actual note number.** `prototype/midi-assignment.js:31` applies number%32 to every 14-bit encoding, unlike the generic editor's CC-only canonicalization. Actual Note 60 becomes mapping Note 28. The real matchesMIDIMap rejects the very Note 60 input that captured it. Apply pairing canonicalization only to CC, or explicitly refuse unsupported Note encodings before writing a mapping.

2. **Assignment consumes a release belonging to an existing Hold sampler.** `prototype/panels.js:1572` returns for every input consumed by assignment, including NoteOff received after an accepted onset. With the actual dispatcher: NoteOn starts Hold sampler; assignment starts; NoteOff is swallowed; calls remain `[play]`, final playing true. Suppression of new actions cannot discard existing release ownership. Release existing MIDI Hold owners explicitly on assignment entry, or allow only owner-matching release cleanup while continuing to consume new actions. Do not let all release messages fall through to continuous controls.

3. **Editor Remove destroys a surviving shared-image consumer's resource.** `prototype/video-controls.js:318` clears imageRef unconditionally before splicing metadata. Two unique layer IDs a/b can share decoded reference shared; removing a leaves b enabled/reference shared but real mixer hasOverlayImage(left,shared) false. This persists despite the prior helper preset-load shared-ref guard. Keep resource bytes while other consumers exist, or explicitly refuse atomically before any mutation. The independent check executes the actual extracted onclick with the actual mixer.

4. **Shared MIDI preset selection is absent from the editor render.** `prototype/video-controls.js:263` renders every preset option with selected argument `''`, while `syncOverlay` rerenders after MIDI changes (`274`). With real controller selection Second, actual createVideoControls generates `<option value="0" >First</option><option value="1" >Second</option>` and never assigns the select value afterward. The editor therefore does not represent the shared selected preset; Reload reads that control and overwrites the controller selection (`324–325`). Render the stored selected name/index. This is a generated-markup/callback finding; parent browser should verify MIDI-selection→GUI-Reload end to end.

5. **Generic Reassign silently broadens a learned device-scoped mapping.** Assignment stores deviceId, and the actual matcher enforces it (`prototype/midi.js:47`). Generic editor mapping construction excludes deviceId (`prototype/panels.js:1690–1700`). Reassigning controller 20→21 for an existing device A mapping removes deviceId; actual device B input now matches. Preserve prior scope during reassign, or require an explicit clear/relearn scope action. No such user choice exists in the reviewed editor.

Initial exact hashes are recorded in every raw result: assignment `d19c09d26dc5d60f63bbb93d7f0323d4473c4dd8595c59dec7bda9855ac5f22e`; assignment UI `a0036b1ba263f7f3ab0d1c9acf72fdff12fd63ac048c9a253a4864f1c7930caa`; panels `84c47724f5add7a42934571afadc2334dfab051743afb8e7fc29e2fab7aec0b9`; controls `520609c921096598bdb60f2edf36e2b21c6185208e73ca526112cd12ae157ab4`; Video router `9346f0a9ec28ddd1166fdd5b57a657409f3212550dde9b17ae712aaafbf715eb`; MIDI `6bff54eef394a4af04e82b1b3f33ed1d6bf902b94002b5cab3975581aa1bcff6`.

## Source observations and acceptance boundaries

- Assignment's commit rolls back state.mappings on synchronous persist refusal; captured is set only after commit (`prototype/midi-assignment.js:8`,34–35). Existing parent nine checks cover basic capture/cancel/command restrictions, but do not cover the above integration cases.
- Source registers capture-phase pointerdown/click/input/change/keydown suppression, Escape exit, close cancellation, window blur and hidden-document cancellation (`prototype/video-midi-assignment-ui.js:21–47`). Tab and toolbar controls deliberately retain native behavior. These code paths alone do not prove actual default-action suppression, focus restoration, disabled-control access or native keyboard event ordering; those need the parent's real browser checks.
- Overlay UI routes and presets now call the shared controller. Image import preserves the selected existing ref, rejects shared replacement, observes decoded===null, checks request identity and current metadata membership before publication (`prototype/video-controls.js:293–305`). No new pending-decode corruption was reproduced in this bounded review.
- Source's new device scope check is exact ID matching. Device names or synthetic messages are not proof of physical compatibility, hardware reconnect identity or latency.
- New overlay registry target coverage does not establish all historical 26 groups, runtime parity with Serato, XML transfer equivalence or full REQ-516 acceptance.

## Unaffected regression gates executed on the initial integration candidate

I executed the existing router 14/14, actual mixer relocation 5/5, Key Shift actual dispatcher 11/11 and Key Shift policy 10/10 checks into new `video-midi-learning-*-independent-results.json` files. The old Key Shift review script was preserved. New `scripts/test_video_midi_learning_keyshift_regression_review.mjs` copies its exact checks and injects only the newly referenced inactive videoMIDI collaborator into the extracted receiveMIDI host; it does not change production or fabricate an assignment success. The source identities are the initial integration candidate above. These controlled regression greens coexist with the five new-feature failures and cannot overrule them or establish browser default-action behavior.

## Independent verification after the five production corrections

The original five desired-state regressions executed **5/5** against the corrected source, retained in `docs/prototype/video-midi-learning-independent-corrected-five-results.json`. Only the newly declared dedicated midiSampleHolds closure was added to the extracted receiveMIDI host. No production was edited and every original red remains immutable.

- 14-bit Note 60 remains number 60 and the exact captured input matches.
- A Hold release accepted before assignment now produces `[play,stop]` instead of being swallowed.
- Actual editor Remove leaves the surviving layer's shared asset present.
- Actual generated editor markup now marks Second selected, matching the shared MIDI preset name.
- Actual Reassign retains deviceId A and rejects device B in the real matcher.

Corrected hashes: assignment `6950ca162de7246140013895993be77c3d4fecabe2bebfdfca5bb457298a1003`; panels `0515787f6b8ef326d11133b8cdd6d80972807ad8ef03d0b26ad3a62b7fb0d171`; controls `f493af06dfbd23cf827e33eacf1b63462eb4ecf451b08a40f9ca138a8413ecda`. Assignment UI/router/MIDI hashes remain as in the initial integration record.

### Exact Hold ownership counterexamples executed

New `scripts/test_video_midi_hold_release_independent_review.mjs` executes actual extracted receiveMIDI **and** onState with real assignment/router helpers, controlled sample-onset/stop witnesses and a dedicated shared closure. All **5/5** pass in `docs/prototype/video-midi-hold-release-independent-results.json`:

1. Wrong device, message type, channel and note cannot release the accepted owner; only the exact input clears it.
2. Replacing mappings and changing the current bank does not change the captured sample destination: release stops original key 0, never current-bank key 8.
3. Ownership exists synchronously before a controlled onset Promise settles; assignment-time release issues the owner stop and clears ownership before that Promise returns.
4. A CC release cleans up its existing Hold while assignment remains active, without reaching another matching Video fader mapping. Cross remains 1 and no additional crossfader-owner stop occurs.
5. Removing input A stops its captured key 0 only; B's key 8 remains owned until B's release.

These checks defend dispatch/ownership and cleanup invocation. The sample collaborator does not render audio or implement actual AudioEngine.sample, so this does not establish sample PCM behavior, processing cancellation timing or physical hot-unplug acoustics. Corrected source reserves exact device/type/channel/number at `prototype/panels.js:1575–1583`/1634–1638, and retires removed sources at1658–1663. There is no generic release fallthrough introduced during assignment.

### Current unaffected regressions re-executed

After corrections: independent dispatcher **5/5**, actual Key Shift dispatcher **11/11**, Key Shift policy **10/10**, Video router **14/14**, assignment policy **9/9**, actual mixer relocation **5/5**, each in new `video-midi-learning-corrected-*-independent-results.json` artifacts. The first corrected dispatcher rerun was 4/5 because the independent onState host omitted the newly referenced sampleVisuals collaborator. That exact intermediate result is preserved as `video-midi-learning-corrected-dispatch-independent-results.json` and classified **test-host wiring failure**, not a production red. Adding the no-op visual collaborator yields the preserved 5/5 `video-midi-learning-corrected-dispatch-host-fixed-independent-results.json`; actual release/disconnect ownership is separately exercised above, so the stub is not treated as cleanup proof.

No further reproduced defect remains in this bounded corrected unit under the executed checks. **Actual learning UI/default-action/focus behavior is still browser-pending**, and these checks award no complete current-feature, native-package, hardware, reference-transfer or Serato parity acceptance. Existing whole-product gaps remain separate; five corrected code paths do not close a feature family by themselves.

Skills applied: adversarial-verify, dec-quality-testing, dec-software-principles.
