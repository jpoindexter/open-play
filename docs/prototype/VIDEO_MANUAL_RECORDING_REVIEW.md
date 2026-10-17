# Recovered manual corrections and independent recording resolution

2026-10-16. **Full reference parity remains open. Native development is not approved.**

The official 27-page Video manual is now available and independently hashed, with 2015 PDF metadata. Its historical descriptions expose semantic conflicts that earlier independent algorithm tests could not detect. Read `../research/VIDEO_MANUAL_RECOVERY.md`, `VIDEO_MANUAL_FX_CROSSWALK.md` and `VIDEO_MANUAL_GAPS.md`. Earlier failed retrievals and passing independent contracts remain historical evidence.

## Executed corrections

| Path | Actual browser result | What this establishes |
|---|---|---|
| Video effects |74/74|Frame Pulse now keeps the image live and pulses border alpha; Split defaults to five regions. Includes seconds and explicit legacy beat timing, center/border pixels and Reduced Motion.|
| Transitions |55/55|Center blends through the middle half of fader travel; Latch50 selects live inputs at midpoint; Scratch selects live inputs at independent endpoint bands and retains the selected side through interior travel.|
| Media Crate |32/32|Actual random automatic selection remains enabled; repeated explicit Next advances in crate order and wraps. Supersedes the older random-Next independent policy.|
| Recording resolution |23/23|Five actual MediaRecorder containers, decoded dimensions, processed pixels, geometry and decoded 440Hz master audio.|
| Karaoke / treatment regression |19/19;21/21|Actual CDG/audio/capture and decoded geometry/pixels still pass with the new surface.|
| Assembled pipeline regression |32/32|Actual decode, six slots, routing and capture/replay still pass with the dedicated capture surface.|

Raw artifacts: `video-manual-corrected-fx-browser-results.json`, `video-manual-corrected-transition-browser-results.json`, `video-manual-corrected-media-browser-results.json`, `video-recording-quality-browser-results.json`, `video-manual-recording-pipeline-results.json`, `video-manual-recording-karaoke-results.json` and `video-manual-recording-treatment-results.json`. All18 pure/controlled Node scripts exited0 in `video-manual-recording-node-results.json`; their scopes are narrower than browser acceptance.

Frame Pulse uses an original raised-cosine border-alpha envelope, independent1s default and .12 normalized edge width. Explicit saved periodBeats survives snapshot/restore without a new seconds default silently taking precedence. Center uses an original linear remap; Latch50 ties right at exactly50%; Scratch uses original5%/95% bands and hysteresis. Those curves/thresholds are not vendor measurements. Scratch Fade's older freeze policy and remaining manual mismatches are still open.

## Recording implementation and main UI

A dedicated capture canvas fixes each recording session's dimensions independently of the live output. Options are match-output (backward-compatible independent default),360p,480p,720p and1080p. Width preserves live-output aspect, rounded to a positive even integer;16:9 at480p is854×480. This width/rounding,30fps request and existing match-output default are original policies; the historical manual documents480p/24fps as its default and does not settle exact width. No current-reference cadence/codec/quality equivalence is claimed.

The main UI was exercised through its real selector, reload, local file chooser, capture/stop and download. The480p choice persisted. Quality/live-size controls disabled during capture and re-enabled afterward. The actual downloaded VP9/Opus container measured854×480 via ffprobe while the live canvas remained640×360. See `video-recording-quality-main-ui-results.json` and its PNG. Its video source was paused; this main-UI check does not establish music playback or sustained cadence. The separate23-case browser suite decoded actual master audio and changed processed pixels. Pending-start/active/stop guards, stale callbacks and failed-start cleanup also have controlled mixer tests.

## Reference investigation

The bounded Fable5.1/High conversation completed. Codex independently validated the recovered PDF and persisted55-effect cache. Cache presence is not current-menu/GPU proof; stronger Fable registration claims were rejected in `../research/claude-fable/PARENT_VALIDATION.md`.

Codex also opened installed Serato's Video Effects and Info screens: No Restrictions, enabled audio-linked effects in this session,400×400 output readout, YUV options and debug controls were observed. Video was restored OFF, Setup closed, no media played and no licensing change made. `../research/VIDEO_REFERENCE_SETTINGS_20261016.json` records the exact limits. No Restrictions does not prove every effect renders.

## Remaining acceptance

The manual crosswalk records89 entries and provisional secondary-workflow gaps. Historical conceptual descriptions do not prove current algorithms, menu availability, transfer curves, hardware inputs, providers, native output or full scope. Analyzer/spectral routing, Gamma, Saturation, Isolator Bass, Smudge, UVPaint, Frame Freeze, several transitions, per-track saves and output/settings workflows still require work. The global gate stays open; no check count or this checkpoint grants native approval.


Independent recording review reproduced a stale-panel completion error and the
actual handler was repaired. Four controlled start/stop leave/return cases now
pass;24 mixer lifecycle cases cover resource/failure ownership. A separate real
main-UI active-capture close/reopen/stop path also executed. Pending-start/stop
browser races are not inferred from that active-session path. Read
`VIDEO_RECORDING_INDEPENDENT_REVIEW.md`; initial red evidence is retained.
