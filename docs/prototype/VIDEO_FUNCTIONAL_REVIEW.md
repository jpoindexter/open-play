# Video functional review

Later continuation: [semantic links and Media Treatment review](VIDEO_LINK_TREATMENT_REVIEW.md) records current runtime/regressions and507-row inventory; historical cutoffs below remain scoped.

Checkpoint:2026-10-16. **Full Serato parity is NOT PASSED; native development is NOT approved.** The browser executes original implementations with scoped evidence. The final candidate commit is pinned by `candidate-hashes.json` and the Claude handoff; working snapshots are not native acceptance.

## Actual implementation

Two ordered GPU slots on each left/right channel and two on master process real decoded local media. Channel previews show processed pixels. Text/image layers, transition selection, per-channel FFT, audio-linked video transport, separate manual crossfader, resolution selection, fullscreen and processed-canvas/master-audio recording are functional within the tested browser paths. Karaoke and Media Crate have separate detailed reviews below.

Reference provenance is47 XML-declared Video effects plus8 localized candidates, and7 XML transitions plus26 localized candidates. There are **55 original Video algorithms and34 original transition implementations**, including a separate Open Play Crossfade baseline. These are distinct from the59 DJ audio processors/236 observed audio-control labels. Localization does not prove a current visible menu or activation. Exact vendor algorithms, control ranges/defaults/enums, order, colour processing and visual equivalence remain unverified. No vendor shaders/code/assets were copied.

Independent processing order: raw input → two channel FX → channel overlays → transition → master overlays → two master FX. All six slots are editable and available without an activation/paywall check. Ranges/defaults and shader behavior are independent contracts in [the machine-readable inventory](../research/video-implementation-contracts.json), not recovered vendor controls.

## Executed evidence

| Layer | Result | Real path and limit |
|---|---:|---|
| Video effects |72/72|Actual WebGL2 pixels for55 names, amounts/bypass, bands, geometry, keyed alpha, ordered slots and retained history. Synthetic original fixtures; no vendor match.|
| Transitions |51/51|Actual WebGL pixels,34 entries, endpoints/upfaders, latch/scratch/history, alpha edges and Reduced Motion.|
| Text/image overlays |32/32|Actual Canvas pixels/PNG decode, alpha/geometry/fonts/animations, metadata helpers and disposal.|
| Assembled pipeline |32/32|Real AudioEngine/worklets/FFT, six-slot pixels, actual local File decode, queued/continuous reverse and seek retention,720p/1080p readback, actual recording and replay/audio decode.|
| Karaoke |19/19|Real engine position/play/pause/seek/reverse/loop, CDG→GPU pixels, explicit profiles/crop, cancellation, recorded graphics and decoded master tone.|
| Media Crate |32/32|Real encoded File selection/playback, association priority, Random/Next, failure/recovery, ownership, separate transition selection and six fresh paused first-frame imports.|
| Controlled/pure checks |See [Node results](video-node-checks.json)|All13 scripts exited0. Mixer16, decode-helper16, state15, CDG22, bridge19, pair-callback14, selector25 and media-runtime16 cases have controlled/pure limits stated by their scripts; they do not replace browser proof.|

Raw browser results: [FX](video-effects-browser-results.json), [transitions](video-transitions-browser-results.json), [overlays](video-overlays-browser-results.json), [pipeline](video-pipeline-browser-results.json), [karaoke](karaoke-integration-browser-results.json), [Media Crate](video-media-browser-results.json). These counts describe different layers and are not added into an overall parity score.

The latest pipeline capture is 52,081 bytes (`video/webm;codecs=vp9,opus`). Its actual encoded video decoded at640×360, duration1.368s, with decoded-frame callbacks, cyan processed pixels and788 magenta overlay pixels. Its actual container audio decoded with RMS0.031098 and440Hz amplitude0.044090, distinguished from the muted source-video880Hz fixture. This verifies encoded output, not just stream-track presence. The short capture processed36 frames in1404.1ms (about25.64 processed frames/sec). It does not establish sustained30fps, long-session AV sync or HD/device acceptance. Render timings distinguish CPU submission from full GPU/readback timing.

## Bugs reproduced and corrected

- Straight-alpha interpolation darkened transparent red edges. Initial FX71/72 and transition48/49 failures are retained. Input, intermediate and temporal textures now filter premultiplied values and return straight output; strict Canvas2D edge comparisons pass.
- Duplicate-frame threshold/clock changes incorrectly bypassed latch/scratch bookkeeping; temporal/control regression checks preserve their expectations.
- Reverse must follow the real deck.reverse flag. Decoded frames now remain visible during asynchronous seeks, completed decodes are captured before new seeks, and active seeks are not restarted. Initial29/31 seek failures are retained.
- The reverse harness initially used video.width instead of videoWidth, then assumed a previous seek had completed, then read a queued event too early. Fixes preserve strict position/pixel checks and add an explicit second-seek event barrier. Initial diagnostic artifacts remain alongside the final result.
- loadeddata/readyState4 did not guarantee drawable pixels. Same-element/same-File diagnostics proved zero RGBA became opaque only after an actual presented frame. Loads now confirm a decoded frame on the muted source before committing replacement, then pause. Unsupported callback API, invalid dimensions, play rejection and the independently bounded10-second readiness deadline fail visibly; the previous clip is preserved.
- Capture chunks/tracks are owned per session; restart waits for the previous stop; disposal cancels pending start; rebinding preserves active capture canvas. Recording continues while another panel is open.
- Video/association/fallback and audio+CDG import generations preserve newer user intent. Pair callbacks recheck ownership before deck load and after graphics completion. Local image and video replacements release stale candidate resources.

## Main UI paths

[Video UI evidence](video-main-ui-results.json): master Negative ON changed visible output; FX/text persisted after reload; text preset save/edit/reload restored its text; an image actually decoded; image metadata restored OFF with a reimport notice. Recording survived switching to Sampler and back, yielded a19,960-byte download, and that actual file decoded/played through the other video input. These paths ran before later first-frame refinements; the final assembled pipeline supplies current decode/capture regression evidence.

[Karaoke UI evidence](karaoke-main-ui-results.json): the latest runtime imported an actual original MP3+CDG pair, with no autoplay. Selected Deck2 advanced graphics to0.35s and paused at0.41s with0 decks playing. Original fixture hashes and encoding command are recorded. [Screenshot](video-karaoke-main-ui.png).

[Media UI evidence](video-media-main-ui-results.json): two actual Files became left/right fallback sources; Random/Next changed the selected asset; explicit association survived fallback OFF while the unassociated source cleared. Independent media/transition flags survived reload. Local bytes and associations are session assets requiring reimport; restored automatic selection can choose a new transition on the initial deck-load transactions. Flags were returned to an inactive review state afterward. No claim covers every dialog/keyboard/parameter combination.

Read [KARAOKE_FUNCTIONAL_REVIEW.md](KARAOKE_FUNCTIONAL_REVIEW.md) and [MEDIA_CRATE_FUNCTIONAL_REVIEW.md](MEDIA_CRATE_FUNCTIONAL_REVIEW.md) for source conflicts, policies and remaining matrices.

## Remaining gaps and next scope

Current reference menus/conditional states, exact shader/control matching and all31 hidden audio-linked definitions remain open. FFT reaction is not semantic audio-DJ-FX coupling; actual linked echo/distortion mapping is still unimplemented. Generic aspect/arrangement/media-treatment/control/record-quality menus, second-display placement/recovery, Syphon, full codec/container matrix, long-session performance, reference visual comparison and hardware remain open. Browser canvas dimensions do not establish native HD recording.

CDG plays all tile channels; selective channels, parity correction, commercial-file compatibility and physical lyric/AV synchronization remain open. Its explicit transparency/crop/recovery choices are not universal vendor behavior. Reverse/large-file replay needs long-track performance/checkpoint evidence. Media selection uses declared looping, wrap/repeat-exclusion and intent ownership; historical official docs do not prove installed4.0.10 behavior.

Technical bounds remain:1080p GPU output budget;16 temporal samples up to320×180 in the effect renderer;10-second first-frame readiness timeout; browser memory/storage/codec support and session-file reimport. No100-preset application cap remains. These bounds need evaluation against the unrestricted product goal. No release/no-limits/full-feature acceptance is claimed.

## Reproduce and model routing

Reuse `python3 scripts/serve_prototype.py` at http://127.0.0.1:8768/prototype/. Run the public FX, transition, overlay, pipeline, CDG, karaoke and Media Crate harnesses through their Run buttons; read each scope/tolerance. They use original fixtures and disconnect speakers. The main UI uses the browser default output; explicitly pause afterward. Run the13 Node commands listed in `video-node-checks.json` for their separate scopes.

VID-002 retains Codex gpt-6.1-sol/high and Claude Code claude-sonnet-5/medium; VID-001 retains Sol/xhigh and claude-opus-5/high for deeper transport/ownership work. Routine execution can use Sol/high; Astra/high is a bounded escalation for an unresolved measured GPU/DSP dispute. Verify actual model IDs/effort when invoking. Recommendations are not availability, automatic Claude launch or device-proof claims. Full original prompt and independent audit instructions remain in the Claude handoff.

### Final import ownership review

A late older `app.load` could overwrite a newer track after awaiting Stem Slip
disarm. Per-deck request ownership is now claimed before that await, rechecked
before commit and invalidated by eject; the playing-deck lock is rechecked too.
The retained red result and final10/10 extracted real load/eject/pair-callback
checks are `video-import-ownership-results-initial.json` and
`video-import-ownership-results.json`. Controlled collaborators establish the
scheduling correction, not a timed browser race. The actual main UI separately
reimported MP3+CDG without autoplay, advanced to0.24s and paused at0.28s with zero
decks playing: `karaoke-import-ownership-main-ui-results.json`.
