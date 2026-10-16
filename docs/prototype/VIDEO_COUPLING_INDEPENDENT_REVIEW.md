# Independent Video coupling boundary review

Scope: source-executed semantic planner, actual `AudioEngine.videoFXLinks` method, and actual Video mixer with controlled DOM/Canvas/pipeline collaborators. No browser control, native execution, audio-output measurement, WebGL pixel claim or actual browser seek-race claim.

Command: `node scripts/test_video_coupling_review.mjs`.

The initial executed result was 6/7. Changing output resolution during a controlled `readyState=2, seeking=true` video state recreated raw canvases and removed their cached source identity. `drawRaw` then called the treatment helper, which rejected the seeking source and set a persistent pipeline error. Becoming ready again did not recover without Reset. Parent corrected the readiness branch to draw ordinary media only when not seeking, using a neutral placeholder when no cached raw frame exists; cached raw frames stay visible. Parent also moved placeholder clearing out of the valid treatment path so the helper validates before touching pixels. The same targeted check now passes; final executed result is 7/7.

Other executed checks: semantic snapshot accepts frozen metadata and cannot access graph collaborators guarded by throwing getters; repeated Master assignments remain distinct ordered bank/slot links represented once; unsupported names/routes create no active target; duplicate frame IDs do not recapture history; changed timing retains real timestamps and leaves unavailable older taps empty; source/transport discontinuities discard prior timestamps.

Evidence: `video-coupling-review-results-initial.json` retains the observed failure message and explicitly labels reconstructed report fields; `video-coupling-review-results.json` is the direct final script output. The initial incorrect expectation that longer timing should fabricate an unavailable third tap was rejected during test review and is not a product finding.

Boundaries still open: actual semantic shader pixels, encoded coupled capture, measured audio-output noninterference, sustained cadence, and vendor equivalence require their dedicated runtime evidence. No additional confirmed defect was found in the reviewed audio source/master identity path. Downstream history ownership for upstream semantic topology changes is being handled by the coupling author; this report does not claim that behavior was executed here.

## Resize retention follow-up

The parent's actual updated pipeline browser run found 31/32 checks passing:1080p output could show the new raw placeholder while a seek was pending. That browser evidence is retained in `video-pipeline-link-treatment-initial.json`; this reviewer did not operate that browser run. Parent changed resize handling to resample prior raw canvases and retain their decoded source identities until a new valid decode commits geometry.

An added controlled test executes the actual updated mixer: the old raw canvas must already have drawn the decoded video, the new1920×1080 raw canvas must copy that specific old canvas with the target dimensions, and it must neither draw the seeking video nor clear the copy via the placeholder path. While seeking, the public presentation identity and generation stay unchanged. On valid seek completion, the decoded video replaces the copy and commits exactly one new presentation generation; the following tick commits none. This exercises retained decoded-source ownership through observed draw behavior, without reading private mixer IDs. Final executed result:8/8. `video-coupling-resize-retention-results.json` is direct post-fix script output; no pre-fix controlled result is claimed for this additional test because the parent correction landed before its first execution. Actual GPU/readback acceptance still belongs to the browser rerun.
