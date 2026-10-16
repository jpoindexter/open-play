# Media Crate and transition-selection functional review

Snapshot: 2026-10-16. **The independent browser harness passed 32/32; main-UI acceptance, current Serato behavior equivalence and native/full parity remain separate and open.** This report concerns Media Crate source selection, associations, automatic transition selection and the first-frame decode gate. It does not replace the broader Video, karaoke, audio or reference acceptance records.

## Executed evidence and boundaries

| Evidence | Result | Executed path | Does not establish |
|---|---:|---|---|
| [Saved real-media browser run](video-media-browser-results.json) | **32/32**, started `2026-10-16T20:43:43.233Z` | Actual imported mixer/GPU pipeline, real local HTMLVideo File decodes, actual AudioEngine/worklets and PCM decks, actual preview pixels and decoded-frame callbacks | Serato/native/hardware equivalence, full codec coverage, sustained throughput or main-UI click/persistence acceptance |
| `node scripts/test_video_media.mjs` | **25/25** | Actual pure media/transition selection modules with original Blob/File byte references and deterministic state tests | Playback, decoding, GPU pixels, UI or filesystem behavior |
| `node scripts/test_video_media_runtime.mjs` | **16/16** | Actual mixer/selection/decode helper imports with controlled DOM, video-frame callbacks and renderer collaborators; generation/cancellation/association/toggle ownership | Real browser decoding, audio routing, presented pixels or UI |
| `node scripts/test_video_decode.mjs` | **16/16** | Actual `primeDecodedVideo` with controlled play promises, frame callbacks and deterministic deadline adapter | A decoded File or actual browser pixel output; the 32 browser checks provide that separate layer |

All three Node commands were executed against the inspected current source. The helper test reports SHA-256 `8483cec6ed4258ba510c95eac8511351b20cabbbcf70bea06ff0f26de021b04b` for `prototype/video-decode.js`. The saved browser result is the actual 32-case candidate, not a relabeled earlier 26-case run. Counts from different layers are not added into one feature-acceptance total.

The browser harness is [video-media-harness.html](../../prototype/video-media-harness.html), with `Run`, `#status`, `#results` and `window.videoMediaHarnessResult`. It transparently observes actual created video elements, File/object-URL identity and raw Canvas2D `drawImage(video)` calls. Initial distinct red/green fixtures establish the two private raw-canvas deck identities; later checks do not guess ownership from matching filenames. No fake video, AudioEngine or GPU pipeline is used in this browser run.

## What the browser run established

Three original encoded Files were generated: red 43,838 bytes, green 51,055 bytes and blue 42,706 bytes, each MP4 with the browser-reported `avc1.420015,mp4a.40.2` codecs. Fixture video is 320×180 and contains an original 880 Hz tone. Two actual engine decks use original 440/660 Hz PCM. Browser speaker output is disconnected; source video elements remain muted. The fixture count of 148 canvas draws is not an encoded frame count or frame-rate proof.

The 32 executed cases establish:

- Disabled fallback leaves audio-only video sources empty. Enabling fallback decodes sequential red/green Files into their corresponding actual left/right preview pixels. Repeated ticks retain selections and do not allocate duplicate replacement videos.
- Fallback follows the actual audio deck's seek/play/pause clock even with video fader linkage off. Actual source elements remain muted/looped. During a real media change, deck position advanced from about 0.3933 to 0.4307 seconds and its measured RMS remained about 0.0705–0.0708; the change did not stop or replace engine PCM audio.
- Sequential Next reaches the third File and wraps to the first. Five actual random media selections avoid immediate repetition under the declared independent policy and show the expected decoded colour pixels.
- Explicit video associations survive fallback OFF; unassociated fallback clears. Manual decoded video can become a crate association. Association removal, active-asset removal, audio eject and same-ID audio reload behave as asserted, with paused/revoked prior sources where required and the other deck preserved.
- A corrupt real File fails decode visibly while retaining the last actual decoded clip. Removing that candidate permits recovery. Late fallback and manual File decode completions cannot overwrite a newer audio-load generation. A current manual import overrides fallback until the next observed audio load.
- Transition enable changes neither the selected transition nor either crossfader value. One logical audio load plus its asynchronous fallback decode selects exactly one automatic transition. Repeated ticks do not repeat it. Manual Next also works with automatic selection off; six random transition Next selections avoid immediate repetition without moving a fader or replaying audio-load events.
- Six additional fresh File objects and HTMLVideoElements—red, green, blue, twice—commit actual first-frame metadata, remain paused and show opaque expected pixels both directly and in the processed preview **before any harness user-play or seek request**. These are fresh imports of the original encoded bytes, not six unrelated codec fixtures. Each first frame reports 320×180 and at least one presented frame. Direct/preview samples were red `[217,30,21,255]`, green `[19,210,50,255]` or blue `[24,61,225,255]`, within the unchanged declared compression tolerance.
- An actual CDG association takes graphics-source priority over enabled fallback and renders red CDG pixels. Disposal stops actual video inputs and rejects subsequent File loading. This source-priority check is not a complete karaoke-format/synchronization acceptance result.

The clip-end case observed the same media asset after its approximately 1.290-second clip looped: decoded media time about 0.0995 seconds, source position about 0.0928 seconds, engine position about 1.4306 seconds. Neither media selection nor automatic transition selection advanced at clip end. This is the declared independent loop policy, not recovered Serato end behavior.

## Independent source/selection contracts

The implementation is in `prototype/video-media.js`, integrated by `prototype/video.js`; decode priming is in `prototype/video-decode.js`.

The library holds an ordered local asset list with stable session IDs, original immutable Blob/File byte references and metadata warnings. Any `video/*` MIME is a candidate. Recognized video extensions also qualify when MIME is absent/generic/conflicting; known suffixes include MP4/M4V/WebM/OGV/OGG/MOV/AVI/MPG/MPEG/WMV/MKV/3GP/FLV/DIVX. Contradictions are warnings rather than an invented codec gate. Clearly nonvideo metadata without video evidence is rejected. **Actual browser decoding remains authoritative**; accepted metadata does not promise a supported codec or valid bytes. Zero-byte/corrupt candidates can be represented and subsequently fail actual decode visibly.

A valid explicit association wins even when fallback is disabled. Without an association, enabled fallback chooses from the local list. The sequential cursor is shared and wraps; each track caches its resolved fallback until explicit advance, association change or removal. Repeated `resolve` is idempotent for an already resolved track. Random excludes that track's current item when more than one candidate exists. No probability-distribution or vendor repeat policy is claimed. No arbitrary asset/track count cap is imposed; the pure test exercises 20,000 entries and 1,000 cached track selections.

The runtime loops the selected File and uses the audio deck's original timeline for fallback even when fader linking is off. Clip completion never calls Next. Manual video is a separate current-audio-generation override; it is not silently persisted as a track association. Explicit association is a separate action. A manual video import is its own logical transition event; an audio load and its fallback decode share one event. Transition enabled/random/selected state is independent of continuous crossfader motion and Media Crate enabled/random state. Settings toggles do not move a fader.

The transition selector receives the existing catalog: seven manifest-declared names, 26 localization candidates, and the separate Open Play Crossfade baseline. Those 34 implemented independent names are not a verified 34-item Serato menu. Initial baseline choice, sequential wrap, no-immediate-repeat random behavior and disabled-event consumption/deduplication are independently declared policies. Caller transaction IDs identify one logical load, including fallback; clip-end is not a transition event.

Local media bytes and object URLs are runtime assets, not persisted media payloads. Scalar settings can be saved by the parent application; metadata cannot restore missing local File bytes. No filesystem writing or native media library mutation is performed by the pure selector. Main-UI settings/persistence validation remains parent-owned at this report cutoff.

## Retained failures, diagnosis and production corrections

The earlier results remain available; they were not overwritten or declared passing retroactively.

1. [Initial browser run](video-media-browser-results-initial.json): **17/26**. The harness identified sources heuristically by filename/time. Once both decks chose the same File name, it could mistake the right element for the left. Turning fallback off correctly revoked the right source, producing a false left-association failure. A later eject assertion failed before restoring the audio fixture; later cases then encountered a missing left audio track, causing null-source/recovery/manual-override cascades. The random mode also needed restoration when its check threw. These were test identity/state-contamination defects, not nine independently confirmed product bugs.
2. [Diagnostic browser run](video-media-browser-results-diagnostic.json): **24/26** after exact raw-canvas ownership observation, actual readiness checks, finally-restored fixture state and full pre-cleanup snapshots. The remaining two failures were real zero-pixel cases: fallback/manual source elements could report `loadeddata` and readyState 4 yet direct Canvas draw still returned `[0,0,0,0]`. The preview was also transparent. No GPU ownership guess was needed to reproduce this.
3. [Same-source priming diagnostic](video-media-browser-results-priming-diagnostic.json): **24/26, original failures deliberately preserved**. For an original red source and a manual red import, the **same element and same File** changed from zero RGBA to `[217,30,21,255]` after muted play plus an actual `requestVideoFrameCallback`, then pause. The manual case reported presented frame 1 at media time 0. Another source was already drawable when inspected and was recorded honestly without priming. The probes diagnosed the issue; they did not change either failed case into a pass.
4. Production now waits for a real first presented frame plus the play promise before committing a replacement. Priming requires muted source audio and available `requestVideoFrameCallback`, validates positive integer frame dimensions, checks live ownership before playback/at callback/after both readiness paths, and always cancels the callback/timer and pauses the candidate. Unsupported capability rejects explicitly. A **10-second independent deadline** covers both frame and play readiness, including the case where a frame arrives but `play()` stays pending; no hung play promise can defeat that deadline. This is a load-recovery bound, not a media size/duration cap. Production does not inspect arbitrary source pixels or reject legitimately transparent video.
5. Independent ownership review also found stale manual decode could attach after an audio-generation change, and older pending replacements could outlive associate/remove/toggle actions. Production now validates the starting audio key for manual and fallback loads, increments/cancels load ownership on association changes and relevant asset removal, and invalidates pending nonmanual requests/manual-override keys when fallback enable state changes. A committed manual clip is retained across fallback toggles by policy. The 16 controlled runtime tests include these races. The final browser **32/32** run then exercised the real media path and six fresh paused first-frame regressions.

No assertion was weakened to accept transparent expected-opaque fixtures. Compression tolerances remained; expected alpha in the six new checks is exactly 255. The production change solved readiness before commit; it did not ask the harness to play/seek each source to make acceptance pass.

## Reference evidence and open work

[Remaining workflow research](../research/VIDEO_REMAINING_WORKFLOWS.md) records the primary-source boundaries. The official [2014 Media Crate guide](https://serato.com/latest/blog/17141/pro-tips-use-the-media-crate) describes fallback visuals for audio lacking associated video and Random/Next. [ITCH 2.2.2 notes](https://serato.com/itch/downloads/2.2.2/releasenotes) document Media Crate On/Off/Random/Next. [Scratch Live 2.4.3 notes](https://serato.com/scratchlive/downloads/2.4.3/releasenotes) document sequential/random automatic transition selection on track load. These are historical documented behaviors, not freshly observed Serato DJ Pro 4.0.10 runtime behavior.

Current reference repeat avoidance, sequential wrap details, clip-end loop/hold/advance policy, pairing/association persistence, failed-source fallback, transaction deduplication and exact Video menus remain unknown. This implementation makes those choices explicit rather than labeling them recovered behavior.

The final assembled pipeline retest passed32/32 and karaoke passed19/19 after the decoder-gate change; their exact scopes and results belong to their own reports. The earlier 72-effect pixel suite uses synthetic canvases and was not changed by this File-readiness fix, but unchanged lower-layer tests are not a substitute for the parent’s new integration run. Main Media and MP3+G UI paths and flag persistence have separate executed observations below. Broader UI matrices, long-duration AV drift/codec/error coverage, external displays, Syphon, sustained HD capture/performance and full reference/native acceptance remain open. **Native work still requires explicit prototype approval.**

## Existing per-feature model routing

Read from [feature registry](../delivery/feature-registry.json), [feature model plan](../delivery/FEATURE_MODEL_PLAN.md) and [development routing](../models/development-routing.json): routine Media Crate selection, metadata, controls and transition workflow work is **VID-002: `gpt-6.1-sol` / high**, with existing optional fresh reviewer **`claude-sonnet-5` / medium**. Difficult cross-module media/transport ownership can use the existing VID-001 depth (`gpt-6.1-sol` / xhigh; optional `claude-opus-5` / high). A bounded measured numerical/state dispute can escalate to the existing `gpt-6-astra` / high profile after collecting evidence. These are recommendations only; this report establishes no model availability, account access, Claude invocation or benchmark result.

Re-entry: independently challenge the remaining current-version policies, UI matrices, formats, timing and long-session behavior on the pinned candidate. Reproduce pure/controlled layers with the three Node commands above; use the public Run harness for actual File/AudioEngine/pixel behavior.

## Executed main UI continuation

`video-media-main-ui-results.json` records two actual local Files selected through
the main picker, decoded into left/right fallback sources. Random/Next changed
left from media:1 to media:2. Explicit association survived fallback OFF while
right cleared. Separate media Random and transition On/Random flags survived
page reload; file bytes/associations were absent and require reimport. A restored
automatic selector can change its current transition when initial audio decks
load, so this is flag persistence, not a promise to freeze automatic selection.
The controls now persist those flags directly after successful mutation. Flags
were returned to an inactive review state afterward. The final main MP3+CDG path
also imported and played/paused successfully; see the separate karaoke review.
This verifies the named control path, not every possible state or reference policy.
