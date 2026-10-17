# Independent recording integration review

2026-10-17. Bounded adversarial review of the dedicated recording surface, mixer ownership, controls and persisted metadata. **One confirmed UI lifecycle defect was reproduced and corrected by the parent; no additional confirmed recording runtime/resource defect remains in this review.** Exact Serato/runtime parity remains open.

## Confirmed finding and disposition

**P2: pending Start/Stop completion dereferenced controls removed by panel navigation.** The previous `video-controls.js` recording handler re-queried `#video-download`, `#video-resolution` and `#video-record-quality` after awaiting the mixer, then assigned `.disabled` without checking for missing elements. The app reuses `#panel` and replaces its children. In the actual handler with controlled DOM lookup/deferred mixer adapters, both Start and Stop completed successfully but emitted `Cannot set properties of null (setting 'disabled')` after panel replacement. This was an erroneous UI failure notification; the reproduction did not establish lost recording data or an audio fault.

Parent reproduced the initial0/2 failure, then changed `prototype/video-controls.js:103`–116 to update only currently present controls. This reviewer extended the actual-handler test to leave-and-return/replacement nodes. Final executed result: **4/4**. Current controls receive the completed session state and Download availability; detached old buttons/selects remain untouched. This is executed source-layer async UI ownership proof, **not an actual browser navigation race observation**. Red evidence remains `video-recording-controls-results-initial.json` and parent's `video-recording-controls-initial.json`; direct final output is `video-recording-controls-review-results.json`.

## Executed verification

- `node scripts/test_video_mixer_lifecycle.mjs`: **24/24** actual mixer checks with controlled DOM/media/pipeline collaborators. Direct output: `video-recording-lifecycle-review-results.txt`.
- Five newly added failure-path cases: audio resume rejection with a waiting Stop settles both calls without allocation; MediaRecorder constructor failure releases the allocated lease/video tracks and permits retry; captureStream failure releases the lease before a recorder exists; a renderer fault during resume rejects before capture allocation and Reset permits retry; asynchronous encoder error followed by final data and stop preserves final chunks and releases the exact surface while retaining the shared master audio track.
- Retained lifecycle cases cover pending start/active/pending stop quality guards, duplicate starts/stops, queued restart, dispose during pending resume/restart, start failure, stale completed recorder isolation, and actual stream-source canvas updates through output detach/rebind. The dedicated stream canvas identity is observed from the controlled captureStream return; the old live-canvas-as-stream-source assumption was corrected without removing the assertion.
- `node scripts/test_video_recording_controls.mjs`: **4/4** after the parent's fix, as described above.
- Helper verification previously executed on the unchanged helper: `node scripts/test_video_recording.mjs`, **10/10**. Immutable lease metadata, exact-owner release/draw, disposal/no resurrection, legacy output-size default, declared width rounding and no live resize. These checks do not encode or decode containers.

## Source review conclusions

`video.js:197`–204 blocks quality edits during pending start, active capture and pending stop before changing metadata. `video.js:331`–365 resumes audio, forces the processed frame, then allocates the dedicated recording lease; failures inside recorder setup stop owned video tracks and release that lease. `video.js:355`–359 releases the session's exact lease on stop and only replaces the result for the current session. `video.js:380`–395 invalidates pending starts immediately and disposes the surface after the existing session finishes. The helper never stops shared audio tracks. Canvas allocation or encoder acceptance beyond the declared dimensions is browser-owned; a selected dimension is not a performance guarantee.

`video-state.js` keeps the normalized scalar recording quality and excludes session canvases/recorders. Missing/invalid saved values become `output`, preserving the prior live-size capture behavior. Historical manual p16 says480p/24fps; p22 lists four heights. Open Play's legacy-preserving default, nearest-even width (16:9 480p→854×480) and current30fps request remain explicitly independent choices. Current-version factory defaults and exact encoder policy are unverified.

## Browser evidence and limits

The parent executed `video-recording-quality-browser-results.json`: **23/23**, five actual recorded containers with presented-frame dimensions/processed-marker pixels and actual decoded master PCM. Its480p sample decoded854×480, corner RGBA[0,255,253,254],440Hz amplitude0.08819 and RMS0.06217. This reviewer read that artifact; did not operate its browser run. `video-recording-quality-main-ui-results.json` records actual main UI480p persistence/import/capture/download, a live640×360 canvas and downloaded854×480 VP9/Opus container inspection.

The parent also appended `panelReturn` evidence for leaving/reopening Video during an already active capture: Stop remained visible, recording quality remained disabled, and stopping produced175,600bytes. This is actual active-session panel-return evidence; it does not reproduce deliberately deferred Start/Stop completion.

The controlled failures above are injected collaborator failures, not real browser encoder/device failures. No actual browser quota/encoder fault, pending-navigation race, long-session AV sync, measured sustained30fps, HD throughput, restart after a real encoder fault, native output or reference-equivalence acceptance was executed here. The main UI run does not by itself prove live-input audio/cadence; the separate container harness supplies its own decoded master-audio evidence. No unsolicited production change was made by this reviewer during this pass.

## Reviewed source hashes

- `prototype/video-recording.js`: `b0e2bb3cdfa2e6d9091ad2f62e61ad0380c1c7b4308a3a648952a009a4491ea1`
- `prototype/video.js`: `c6c7090906b1aefc675633c6a1c97396b35995be8076a71435199d03553b159e`
- `prototype/video-controls.js`: `9a29527753dade793011d82217fdc30912917760ef924becadbb3843e6e6e511`
- `prototype/video-state.js`: `1f0be235ea701e67790f57a8caa43b67541f622f65586626d200880658947666`
