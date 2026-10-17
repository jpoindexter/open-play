# Independent review: finite Video crossfade

2026-10-17. Read-only production review against `34132a0`, covering the new finite fade helper, actual mixer integration, separated crossfader link, controls handlers and browser harness. No browser/native/remote/Git mutation by this reviewer. The parent owns browser pixels and the fix.

**Initial confirmed defect: finite actions stop progressing/completing when the Video panel stops being scheduled or its output canvas is detached.** No additional production defect was defended. The initial source and red observation are preserved below. The parent subsequently fixed this defect; the resolution section records fresh controlled acceptance and its browser boundary.

## Confirmed defect and exact reproducer

At initial review `prototype/panels.js:1967` invokes `videoMixer.tick()` only when the Video panel is selected or capture is running. Navigating to another panel without recording stops those calls. Independently, `prototype/video.js:293` returns before sampling the finite action when the bound canvas is disconnected. Crossfade completion/callback is performed later in `crossPosition()` at `prototype/video.js:211`–`:215`, so neither the target position nor persistence callback completes while the output remains detached.

The independent file [test_video_crossfade_independent_review.mjs](../../scripts/test_video_crossfade_independent_review.mjs) executes the actual current mixer with the existing controlled DOM/media/pipeline collaborators. It starts a rightward .25-second action at -1, disconnects the bound output, advances the controlled monotonic clock by 1 second and invokes `tick(true)`. Observed:

```json
{
  "detached": {"active": true, "cross": -1, "completions": 0},
  "returnedAfterReconnectAndTick": {"active": false, "cross": 1, "completions": 1}
}
```

Thus this is not merely an unobserved harness timeout: the actual module preserves an active overdue job and its pending callback until reconnect/tick. The app's scheduler supplies the second independent reason why panel navigation would suspend it. Browser navigation itself was not executed by this reviewer.

**Practical next fix:** advance/complete finite control state independently of panel presence, with app scheduling while a finite action remains active. A lightweight control tick can sample/cancel/finish before the detached-output guard without forcing hidden GPU rendering. Include an actual leave/return-without-capture browser check, endpoint persistence and exactly-once completion. Do not report this as fixed solely because the pure helper completes when directly sampled.

## Refuted failure hypotheses

- **Replacement leaves an old callback alive or causes a direction jump:** refuted in the controlled actual mixer. An action reached cross 0 at its midpoint; reverse started there and reached -.5 after half its new duration. The previous callback fired once on replacement. `prototype/video.js:221` cancels/samples current position and clears the old callback before assigning the new one.
- **Stop leaves the old action running or fails to persist its current position:** refuted under scheduled, connected rendering. Stop held `-.7000000000000002` across a further second/tick; stop callback ran once. `prototype/video.js:226`–`:228` samples cancellation before finishing its callback.
- **Reduced Motion or disposal leaves an active finite job:** refuted under the controlled collaborators. Reduced Motion start immediately selected +1; callback ran once. Disposal canceled the active reverse job and produced one terminal callback. Helper `prototype/video-crossfade.js:24` and mixer `prototype/video.js:415` provide the corresponding paths. A settings change while the panel is not being scheduled falls under the confirmed scheduling defect, not this refutation.
- **Video directional commands inherently move the audio crossfader:** no supporting code path. `crossPosition()` reads `engine.cross` only when `crossLinked` is true; `startCrossfade()` rejects that linked mode before mutation. Finite/manual state lives in `v.cross`, while transport/upfader ownership remains `v.linked`. Actual audible noninterference requires the parent's AudioEngine/pixel harness, not this source trace.
- **Final/cancel persistence depends on detached DOM nodes:** refuted at the callback boundary. Controls pass `changed` (the provided persistence function) as the finite completion callback at `prototype/video-controls.js:84`; it does not look up stale controls. Stop/manual/link handlers call the same persistence path. The completion is nonetheless deferred by the confirmed lack of sampling after navigation.

The callback named `onFinished` intentionally runs on replacement, stop and disposal as well as natural completion; this is how final state is persisted. The review does not mislabel those events as natural endpoint completion.

## Executed tests and strict coverage boundaries

- `node scripts/test_video_crossfade.mjs`: **6/6** pure helper checks, exit 0. Covers finite clock/linear travel, reverse/cancel, snapshot duration, Reduced Motion and backward clocks. It does not cover app scheduling or actual controls.
- `node scripts/test_video_recording_controls.mjs`: **4/4**, exit 0. These existing controlled UI tests exercise recording Start/Stop and DOM replacement; they do **not** execute the new fade handlers and must not count as fade UI acceptance.
- Independent controlled actual-mixer reproduction above: terminal-state suspension confirmed. Additional actual-mixer checks recorded midpoint 0, reverse midpoint -.5, held -.7000000000000002 and exactly the callback sequence `replaced`, `stopped`, `immediate`, `disposed`.

The parent's initial 3/9 GPU result was described in the task but is not a reviewer-run result. Reading the current browser harness supports its corrected premultiplied `assertMix` reference: it uses actual linked source gain levels and retains the ±2 channel tolerance, rather than asserting alpha 255 for .8-gain inputs. This reviewer did not run either version of that suite.

Remaining test boundaries:

- Current browser harness directly invokes mixer fade methods; it does not itself exercise actual new fade buttons, cross-link checkbox or speed-slider event binding.
- The harness does not measure slow-versus-fast durations through the actual speed UI. VMG-016's provisional acceptance requires measured duration ordering. Pure duration normalization alone cannot establish it.
- The implementation snapshots duration at action start, which its pure test explicitly states. Do not infer live retiming of an already active action from that check or the historical manual's unspecified transfer curve.
- The linked-cross GPU test asserts RGB but not alpha in that particular test. Other `assertMix` cases cover alpha. This is a bounded coverage observation, not proof of an alpha bug.

## Initial source hashes

| File | SHA256 |
|---|---|
| `prototype/video-crossfade.js` | `61734c97701edf75551a825ad5cd967991fc7f8658e3a1de93d9613536d471cf` |
| `prototype/video.js` | `204bf3e340ffa1ed294ddb9333f27d22dc83e831387fee8132a81585f1a923db` |
| `prototype/video-controls.js` | `8888a910229b89ad7e4e85b6b094dce74530ec874f6ed7fcbd07957eaf7c897c` |
| `prototype/panels.js` | `19dcb68ed6e47fb9f7d6a7be7e7a3be533684dad57f139e798e9c512b2c22003` |
| `prototype/video-crossfade-harness.js` | `6aba36bbe4550934d9af059f97ab9c76748781abe181e7ee3b17252fa3bd2bed` |

Review status at initial snapshot: initial review complete, defect unresolved. The following resolution supersedes that initial status while retaining its evidence.

Skills applied: adversarial-verify, dec-quality-testing.


## Resolution after parent fix

The parent moved finite control advancement into `advanceCrossfade()` (`prototype/video.js:230`) and invokes it before both detached-output and render-throttle returns (`:306`). The module exposes `fading` (`:450`), and the actual app scheduler now calls the mixer while that flag remains true (`prototype/panels.js:1967`). Source reading confirms the two causes were addressed together. No source fix was made by this reviewer.

The independent reproducer was converted into a **desired-state regression**, preserving the original failing observation above. Executed again with `node scripts/test_video_crossfade_independent_review.mjs`, exit 0:

```json
{
  "detached": {
    "active": false,
    "cross": 1,
    "completions": 1,
    "frames": 0,
    "pipelineAllocationsBeforeReconnect": 0
  },
  "returned": {"active": false, "cross": 1, "completions": 1, "frames": 1},
  "hiddenReducedMotionImmediate": true,
  "hiddenReducedMotionCallbacks": 1,
  "renderThrottleStillAdvancesControl": true
}
```

Three further hidden ticks and reconnect caused no second callback. A separately detached active action responded immediately to a Reduced Motion toggle without allocating a pipeline or rendering a frame. A connected tick inside the 30fps rendering throttle advanced the control position while leaving the rendered-frame count unchanged. Replacement/reverse/stop/immediate/dispose ownership checks also passed unchanged, including callback sequence `replaced`, `stopped`, `immediate`, `disposed` and held position `-.7000000000000002`.

Re-executed pure helper **6/6** and existing recording-controls **4/4**, both exit 0. The latter remains adjacent recording evidence rather than fade-handler acceptance.

**Resolution verdict:** the confirmed defect is resolved for the actual mixer under the controlled detached-output and cadence paths. Scheduler inclusion was source-inspected; actual browser panel navigation, speed-control interactions, pixels and production persistence are still the parent's separate acceptance paths. This is not a claim that those unexecuted paths passed.

Resolution hashes:

| File | SHA256 |
|---|---|
| `prototype/video.js` | `fe683e60b0b1c1b02528b9c7030498644616f8121d24ced4876479a7712db320` |
| `prototype/panels.js` | `6514d2606fc9a0ffc9c77b52a619103f726df9fad705f78248c62bc32042d86f` |
| `scripts/test_video_crossfade_independent_review.mjs` | `52a86ed1f3e954271c76d623c57856a2070fe4cf45075144a895b1ebc8b4bac8` |

Helper and controls hashes are unchanged from the initial snapshot. Final scoped review status: complete; **one confirmed defect, fixed and controlled-path regression executed; no remaining defended production findings in this review**. Browser/UI/speed and vendor-equivalence limits above remain explicit.


### Final hidden-connected refinement

The parent subsequently distinguished control advancement from output rendering: `prototype/panels.js:1968` passes `{render:s.panel === "video"}`, and `prototype/video.js:307` suppresses output rendering for `render:false` while preserving recording as an override. This handles Close, which can leave the Video canvas connected inside a hidden panel, as well as panel replacement, which disconnects it. The resolution hashes above have been refreshed to this final reviewed source/test snapshot.

The independent regression was extended and re-executed, exit 0. With a **connected** output and `render:false`, an action moved to cross 0 and then +1 while frames remained 0 and pipeline allocations remained 0; completion fired once. Rendering on return added one frame with no extra callback. A second action using that already allocated pipeline completed hidden while the frame count stayed 1. Thus the assertion covers both preventing new hidden GPU allocation and preventing extra submissions to an existing pipeline.

Recording override was also executed against actual mixer logic and controlled recorder/stream/pipeline collaborators: with recording active, one `render:false` tick on a connected output and another on a detached output each added a processed frame and advanced the dedicated capture surface. Both ticks together added exactly 2 frames; the shared audio track remained unstopped after capture completion. This confirms control-only requests do not starve ongoing capture at this layer; it is not an encoded browser-file claim.

All earlier detached, Reduced Motion, throttle, reversal/stop and callback tests passed again in the same run. Parent-reported browser 11/11 and main-interface speed/navigation/persistence observations were communicated to this reviewer but were not independently executed here; their authoritative artifacts belong to the parent acceptance record. Final reviewed production has no remaining defended finding from this scoped review. Reviewer files are frozen for checkpoint.
