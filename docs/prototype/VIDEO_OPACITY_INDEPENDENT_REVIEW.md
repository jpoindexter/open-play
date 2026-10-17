# Independent review: per-channel Video opacity

2026-10-17. Bounded adversarial review of the parent's opacity normalization, actual mixer methods, actual control handlers, scalar metadata and public opacity harness. Production was read only. The reviewer added only this report and [test_video_opacity_independent_review.mjs](../../scripts/test_video_opacity_independent_review.mjs). No browser, native application, Git or remote operations were performed.

**Confirmed production bugs: 0.** Nine independent controlled actual-mixer/controls checks passed. This does not establish accepted browser pixels or full Serato parity. At report freeze the parent was still iterating a transparent-input test fixture; no browser acceptance is claimed here.

## Scope and criterion

Each channel has a separate normalized manual opacity and audio-link flag. Old records without flags inherit the prior combined `linked` policy once. Explicit mixed flags, manual zero, OFF/false and own scalar data must survive metadata restoration. Unlink must snapshot the current effective audio gain; relink must preserve the saved manual gain. Opacity changes and the playback-link handler must not cancel finite crossfades, change crossfader ownership or write audio gain. Effective Video opacity must reach the real pipeline's channel context and transition upfaders. These are independently specified Open Play controls; native hardware mapping and exact vendor response remain unverified.

Analyzer was actively being edited and is excluded. The finite Freeze/Isolator code received only the timer/mode skim described below; that is not a whole-feature independent pixel audit.

## Hypotheses and verdicts

| Failure hypothesis | Verdict / evidence |
|---|---|
| A partial or mixed new link array overwrites explicit flags with the old global flag. | **Refuted.** `prototype/video-opacity.js:10`–`:13` selects each own boolean separately, using legacy fallback only for that missing/invalid entry. Independent metadata input `{linked:false,crossLinked:true,channelOpacity:[0,.4],channelOpacityLinked:[true]}` round-tripped to manual `[0,.4]`, flags `[true,false]`, playback false and cross-link true. |
| Unlink restores an old manual value instead of the currently displayed linked gain, or relink discards that manual value. | **Refuted.** `prototype/video.js:248`–`:252` samples effective level before disabling an active link. The actual left unlink handler snapshotted audio .2 and persisted .2; later manual .33 stayed stored while relinking followed audio .9. Other channel flags/values remained intact. |
| Opacity handlers cancel an in-progress finite fade, or the playback link still controls opacity/crossfade authority. | **Refuted.** `prototype/video-controls.js:84` writes playback authority without `stopCrossfade`; `:95`–`:96` call only the respective opacity methods, UI enablement and persistence. Independent actual handlers changed left opacity/link, relinked and toggled playback during one active fade; it stayed active with zero terminal callbacks until intentional disposal. `crossLinked` remained false. |
| State/UI appear correct while the assembled mixer still sends old combined-link levels to rendering. | **Refuted at controlled integration level.** `prototype/video.js:365`–`:377` passes effective levels both as per-channel `upfader` and transition `upfaders`. The actual mixer with playback link false, manual left .33 and linked right .7 delivered `[.33,.7]`; changing real controlled audio levels to `[.9,.4]` delivered `[.33,.4]`. These are real mixer-to-pipeline arguments, not actual GPU pixels. |
| Opacity multiplies only RGB, loses straight source color, or bypasses transition alpha. | **No supporting code-path finding.** `prototype/video-transitions-kernel.js:26`–`:27` multiply complete premultiplied RGBA by each effective upfader. Final output `:172`–`:177` divides RGB by the resulting alpha. This is the expected multiplicative alpha path. Actual transparent-input pixels remain the parent's separate acceptance, explicitly pending at this freeze. |
| Metadata saves runtime diagnostics, callbacks, measured values or GPU captures. | **Refuted for the reviewed schema.** `prototype/video-state.js:86` inserts only newly allocated normalized opacity arrays; the rest of the explicit schema remains scalar metadata. The independent actual runtime roundtrip retained manual/link pairs and excluded runtime `opacity`/`crossfade` diagnostics. Four actual handler persistence calls were observed. This is JSON snapshot/restore evidence, not an actual browser storage/reload run. |

No production fixes are requested by this scoped review. Do not reinterpret the alpha code trace or controlled pipeline arguments as accepted pixels.

## Executed evidence

- `node scripts/test_video_opacity_independent_review.mjs`: **9/9**, exit 0. Uses actual `createVideoMixer`, actual `createVideoControls().bind()` handlers, metadata modules and controlled DOM/media/pipeline collaborators. Includes independent mixed migration, initial disabled controls, unlink snapshot, manual persistence, active-fade/playback independence, effective pipeline levels, relink preservation, rejected mutations and runtime metadata exclusions.
- `node scripts/test_video_opacity.mjs`: **5/5**, exit 0. Own-data normalization, no coercion/getter execution, clamping, legacy behavior and exact channel indices.
- `node scripts/test_video_state.mjs`: **26/26**, exit 0. Pure scalar restoration and state corruption cases, including opacity and finite/legacy FX metadata. Not browser localStorage acceptance.
- `node scripts/test_video_effects.mjs`: **25/25**, exit 0 at the reviewed pre-Analyzer-extension moment. This is catalog/uniform/planner evidence; it does not prove shader pixels, actual FFT or vendor equivalence.

Controlled opacity commands did not mutate audio configuration, but the test does not instantiate or hear Web Audio. Audible/master-analysis noninterference requires the parent's actual AudioEngine harness.

## Browser fixture iteration boundary

The parent reported an initial **8/13**, then **10/13**, with raw results retained. The partial-alpha PNG was first composited over an opaque placeholder. A subsequent Luma Key Black attempt also remained opaque because the actual pipeline deliberately supplies the other raw source as the key's background. Neither result justified blaming the opacity multiplier or changing its expected alpha formula.

At freeze the new explicit fixture uses full-amount Audio Fade with actual silent RMS to clear the base **before** compositing the half-alpha PNG. That creates a genuine half-alpha channel image through the real pipeline. Its production gain formulas and ±2 channel tolerance are unchanged. The parent's next actual run was pending; this reviewer neither ran it nor labels it accepted. The separate master-tone fixture increased injected signal gain rather than relaxing the noninterference tolerance. Source inspection supports those as fixture corrections, not proof that the resulting browser test passed.

The parent also reported main-interface keyboard interactions; this reviewer did not perform them. Actual browser navigation, disabled-state presentation, storage/reload, hardware, source-video codecs and recording combinations remain separate proof scopes.

## Finite Freeze / Isolator skim

No bad-timer finding survived this narrow inspection. `prototype/video-effects-state.js:52`–`:65` (line numbers at read) records original capture time, expires once using presentation time, and cannot resurrect an expired hold merely by lengthening duration. A changed token, mode change or zero clears/restarts the intended lifecycle; backward time resets before capture planning. Expiry is outside duplicate-frame gating, so repeated frame IDs or a paused source do not stop the presentation timer. The shader samples the hold only while `holdActive` is supplied. The earlier mode remains indefinite.

Isolator's Manual Meaning branch uses a selected-hue mask multiplied by bass over a grayscale complement; its earlier warm tint remains a separate branch. No timer is introduced. These are source and pure-planner observations; parent-reported **88 FX browser checks** are not reviewer-run evidence. Exact vendor silence, hue and timing behavior is not established. Analyzer input, eight-band rendering and its active changes were not reviewed.

## Reviewed source snapshot

SHA256 pins only the opacity unit and its independent test at freeze. Shared FX/analysis modules were being edited for another cohort; this report does not certify their complete contents.

| File | SHA256 |
|---|---|
| `prototype/video-opacity.js` | `a40cc708ede1e6496be35dfde766813e4bb5988c2228c268265194b161f75d95` |
| `prototype/video.js` | `5ef2eea2d84758d2b861c35f5268555473af2b6104e857f3136856e3179eaa67` |
| `prototype/video-controls.js` | `e57e35f362f51ef4343959d6e9cedf39853cb2bbe35794fec047ff08816e14a0` |
| `prototype/video-state.js` | `fb7986288f7e93a898987f93b2fe7dd95b50d201a55a4943f90682665b923dbf` |
| `prototype/video-opacity-harness.js` | `62035500bff54471444c7a75e6b02989119a93756951c6a8dc6176199052972d` |
| `scripts/test_video_opacity_independent_review.mjs` | `858d89a83cd7089119c85d9923c2b669f0fad4c66f26a1ea99c276a0c0c3fb91` |

Scoped review complete and reviewer files frozen. No completion claim for pending parent browser acceptance, current installed-reference response, hardware or full parity.

Skills applied: adversarial-verify, dec-quality-testing.

## Parent browser acceptance recorded after review freeze

The parent completed the revised fixture run and supplied the authoritative artifacts: [video-opacity-browser-results.json](video-opacity-browser-results.json) records **13/13, 0 failed**; [video-opacity-main-ui-results.json](video-opacity-main-ui-results.json) records **6 main-interface observations**. This reviewer read those saved artifact counts and scopes but did not execute either browser path. The latter covers keyboard/manual/link state, playback-link independence during a fade and reload; pixel/audio/partial-alpha measurements belong to the former. This supersedes the earlier **pending parent run** status, preserving the initial fixture failures and review execution boundary. It does not add hardware, source-codec, vendor-response or full-parity acceptance.
