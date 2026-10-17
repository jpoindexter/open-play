# Video Setup consistency review

2026-10-17. Scope: three already operational Video settings exposed in Setup → Expansion Packs: recording resolution, media treatment and directional fade speed. Native application development remains gated on prototype approval.

## Finding and ownership

The Setup form in `prototype/panels.js` previously read and wrote only `state.settings` for all three fields. The live Video panel and mixer used separate scalars in `state.video`. Consequently, Setup could show the historical fixture defaults (480p, Preserve, 50) while the real recording/treatment/fade behavior used the existing compatibility defaults (`output`, `stretch`, 2.5 seconds), and Setup edits did not reach those implementations.

The canonical store is now **`state.video`**. Setup derives these controls from it and never reads or writes their old `state.settings` duplicates. Existing saved operational metadata wins. No legacy preference is silently migrated over a real saved Video setting. Inert old duplicate fields can remain in existing generic preference JSON for compatibility; they are not active controls or an alternative authority.

Owned changes:

- `prototype/video-settings.js`: shared normalization/setter, Setup field metadata and guarded Setup operations.
- `prototype/panels.js`: Setup-only rendering, event handling and reset changes, plus the helper import.
- `scripts/test_video_settings.mjs`: scalar/metadata tests and actual Setup module with controlled DOM/mixer collaborators.
- This review.

Parent integration, performed separately: `prototype/video.js` calls the shared setter inside its existing guarded recording-quality method; `prototype/video-controls.js` calls it for treatment and speed. No `app.js`, fixture schema, recording algorithm, geometry equation, fade clock or metadata whitelist change was required for this scope.

## Shared contract

`normalizeVideoSettings(video)` returns a detached three-scalar snapshot using own data properties only. It ignores inherited/accessor values without executing them. Existing normalization functions and compatibility defaults remain:

| Canonical key | Supported values / normalization | Missing or malformed read |
|---|---|---|
| `recordingQuality` | `output`, `360p`, `480p`, `720p`, `1080p` | `output` |
| `mediaTreatment` | `preserve`, `stretch`, `center-cut`, `letterbox` | `stretch` |
| `autoCrossfadeSeconds` | Finite number clamped to existing 0.25–10 seconds | 2.5 seconds |

`setVideoSetting(video,key,value)` commits one validated own scalar and returns it. Invalid quality/treatment choices and nonfinite/non-number durations throw without coercion. It rejects unknown keys, read-only properties and accessor targets, and does not invoke inherited setters. It neither acquires resources nor knows the recorder lifecycle. **The mixer must enforce its existing disposed/pending-start/recording/pending-stop guards before calling it for quality.** The existing mixer method still returns recording dimensions after the scalar commit.

`videoSetupFields`, `videoSetupField(name)` and `videoSetupValue(video,name)` describe/derive the three Setup controls. Recording options use the existing catalog, including “Match live output”; treatment labels and canonical values use the existing treatment catalog. Setup's 0–100 speed maps to the same existing duration equation as the Video panel: `seconds = 10 − speed × 9.75 / 100`, with Slow at 0 and Fast at 100. No new quality budget or guessed output policy is added.

`applyVideoSetupSetting(video,name,value,{setRecordingQuality})` validates the edit and delegates quality to the supplied guarded mixer method. Treatment and speed use the shared setter. `resetVideoSetupSettings(video,{setRecordingQuality})` preflights all three writable scalar targets and calls the guarded quality method **before** committing the other defaults. A capture refusal therefore cannot partially reset Video. The surrounding Setup handler resets fixture fields only after that operation succeeds, so a refused Reset preserves the entire tab.

Setup restores a refused quality selection to its canonical value, displays the actual error in a polite status region, emits the existing notification and does not persist the refused edit. During active capture its quality select is disabled; the guard still protects pending lifecycle changes and Reset. Successful edits persist once and refresh an already open Video panel so both visible controls agree. Reopening Setup derives fresh values from live Video, including edits made through the Video panel.

The synchronous guarded setter is a runtime collaborator, not an arbitrary external transaction: it must retain the mixer's contract of refusing before mutation. Proxies and asynchronous third-party setters are outside this API. Other Video preferences—Output Quality, window aspect/arrangement, V-Sync, Frame Blending, buffer budget, delay, contour and cursor behavior—remain stored simulations. This change supplies no floating output window or resource-budget implementation.

## Executed evidence

Commands run after parent shared-setter integration was visible in the working tree:

```sh
node --check prototype/panels.js
node --check prototype/video-settings.js
node scripts/test_video_settings.mjs
node scripts/test_video_mixer_lifecycle.mjs
node scripts/test_video_state.mjs
node scripts/test_video_crossfade.mjs
```

- **15/15** new settings checks passed: compatibility defaults; own-data/accessor handling; all 20 recording/treatment combinations through real metadata; runtime-field preservation; strict noncoercing setters; speed orientation; mandatory guarded quality seam; atomic refused reset; writable preflight; frozen option metadata; and actual Setup rendering/edit/refusal/reset/reopen handlers using controlled DOM/mixer collaborators.
- **24/24** existing mixer lifecycle checks passed with the actual mixer module and controlled browser/media/pipeline collaborators. These include recording quality refusal during pending start, active capture and pending stop, plus detach/rebind while recording. This is runtime lifecycle logic proof, not real encoded-browser capture.
- **28/28** actual pure Video metadata checks passed, including existing effects, legacy compatibility, presets, own scalar boundaries and recording choices.
- **6/6** finite fade clock checks passed, including snapshotted duration and reduced-motion policy.
- Both syntax checks passed.

No browser, real decoded pixels, actual video recording, persistence reload or hardware path was executed by this scoped agent. Controlled Setup tests execute the full real `panels.js` module; their DOM and mixer are intentional collaborators and must not be reported as actual UI/capture acceptance.

## Parent browser acceptance still required

1. **Cold/reload authority:** with old generic preferences present but canonical defaults or saved Video metadata, open Setup → Expansion Packs. Verify recording/treatment/speed equal the live Video panel. Missing canonical metadata must remain Match live output / Stretch / 2.5 seconds. Old 480p/Preserve/50 fixture defaults must not override it.
2. **Setup → live controls:** select 720p, Letterbox and a known speed (50 = 5.125 seconds). Close Setup and verify the live selectors, duration note and state agree. Use the already generated non-16:9 decoded video fixture to verify actual Letterbox geometry; use an explicit directional fade with crossfader linking disabled to verify the same selected duration. Existing Reduced Motion may select the endpoint immediately; account for that existing policy.
3. **Live controls → Setup/reload:** change the live panel to another recording quality/treatment/speed; reopen Setup and verify it derives those values. Reload and verify the existing metadata persistence restores the same canonical fields. Do not rely on a stale generic preference key in localStorage as proof of either success or failure.
4. **Real capture guard/atomic Reset:** start an actual short recording, then open Setup. Verify quality is disabled. Attempt Reset this tab and observe the visible stop-capture error, no partial treatment/speed/default changes, and preservation of an unrelated changed fixture field on the same tab. Close Setup, stop recording, then Reset successfully; verify output/stretch/2.5 in both surfaces. The controlled tests separately cover a pending-start quality refusal.
5. **Selected recording output:** choose 720p through Setup and make a short actual recording. Decode/export it using the existing recording-quality harness conventions; verify selected capture dimensions and unchanged live output dimensions. This checks the real quality seam rather than only matching labels.
6. **Scope honesty:** confirm Output Quality/window/buffer and the other unimplemented preferences are still described as simulations. Do not claim that changing a stored label changes output/GPU allocation.

The three-field consistency work remains browser-unverified until those actual paths execute. It does not establish Serato's default values, encoder response, fade curve equivalence, full Video Setup parity or native output acceptance.

Skills applied: use, dec-software-principles (one authority; least astonishment), dec-quality-testing (behavioral integration before broad visual claims).

## Parent actual browser acceptance — 17 October

Parent executed the main application, not only the controlled Setup collaborator. [UI observations](video-setup-ui-results.json) record Setup→Video quality360p/treatmentPreserve/speed50=5.125s, reverse Video→Setup720p/Letterbox/speed80, then a full reload retaining those canonical values. Existing metadata was preserved; a new empty-profile/default-conflict test was not performed in the browser. The pure/controlled checks independently cover missing metadata and conflicting inert duplicates.

With an original decoded320×240 green fixture, all six Video FX and overlays were explicitly bypassed through UI. [Actual screenshot pixels](video-setup-geometry-pixels.json) show Preserve's311 green columns inside a413.34CSS-pixel output, with black sidebars, versus Stretch's412 visible green columns. Three visible rows agree. Initial screenshots sampled an obscured canvas and retained active Negative/text processing; their failed measurement is saved separately, not interpreted as a treatment defect. Effect/overlay flags were restored afterward.

Setup-selected720p produced an actual downloaded WebM container. [Inspection and decoded first frame](video-setup-capture-inspection.json) verify1280×720 source content, while the live output stayed640×360. The decoded center row has1280 green pixels. This is encoded-file/content evidence, not sustained30fps, physical routing or audio-quality proof.

During the real capture, quality was disabled. Reset refused with the stop-capture error; quality720p, treatmentStretch, speed50 and unrelated simulated Output Quality Best all remained unchanged. After capture stopped, Reset succeeded: output/stretch/2.5s appeared in live Video, and simulated quality returned to Medium. See [refusal screenshot](video-setup-capture-refusal-v2.png) and [reset screenshot](video-setup-reset.png). No pending-start browser race was manufactured; controlled mixer24/24 separately covers that lifecycle.

The actual finite fade selected in Setup stayed in progress at268ms/−0.9,1512ms/−0.42,2756ms/0.07 and4005ms/0.55, then reached1/stopped at5247ms for the5.125s setting. Host timestamps include automation overhead; this verifies selected duration reaches the real fade, not exact vendor curves/display timing. A single long-wait control call hit the tool's3s observation limit before this bounded state-based observation; that was not an app fade failure.

The three operational settings now have actual shared-state/UI/persistence/geometry/capture/fade evidence. Other Setup preferences remain stored simulations; full Video/reference/native acceptance remains open. Current parent cohort executes seven Node scripts with scoped results in `keylock-scratch-setup-node-results.json`.
