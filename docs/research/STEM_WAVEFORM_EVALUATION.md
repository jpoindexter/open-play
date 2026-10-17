# REQ-183 — stem-responsive source waveforms

Status: source implementation and **10/10 controlled Node checks executed**. Actual browser audio/pixel and main UI acceptance remain pending parent execution. This is a bounded ordinary-mute waveform slice, not a claim that all REQ-183 or Serato Stems parity is closed.

## User-visible behavior and scope

The overview and scrolling detail now derive ordinary partial-mute waveform bars from the enabled prepared stem buffers. Each output-channel sample is the signed sum of the surviving source samples; the waveform then takes the largest absolute value across left/right. Opposite-phase sources therefore cancel instead of becoming larger merely because each stem was loud. Right-only audio remains visible, and mono stems upmix into both sides.

AudioEngine explicitly routes the original buffer when all four stems are on and no stem exit effects are enabled. That case, and tracks without prepared stems, retain the prior original-source waveform branch. The implementation does not subtract muted stems from original audio: an ML reconstruction need not equal its source mix.

All-muted selection produces zero bars immediately. A newly selected uncached mix displays `Preparing stem source waveform…` with no stale bars until its profile is ready. A frame-loop selection check redraws the overview when its selection/profile changes; detail queries the same model. Beat, cue, loop, timeline and playhead overlays retain their existing behavior.

The displayed envelope is **source PCM before keylock/pitch processing, channel EQ, mixer/audio FX and master processing**. Labels say `Stem source mix … pre-FX`, and the detail panel says `SOURCE WAVEFORMS · ±2s · pre-FX`. This is not a sample-accurate output meter and does not represent the approximately 3ms gain smoothing while a mute changes.

Any armed/active Stem Slip state retains an explicitly labeled original-source context (`Stem Slip clocks not shown`). Any requested exit FX, active exit modes or retained effects similarly says `Stem FX/tails not shown`. A single source timeline cannot correctly describe independently moving selected/backing clocks or captured/fading history. These are explicit remaining waveform gaps, not simulated current-mix output.

## Source and geometry contract

Prepared AudioBuffers are treated as immutable, aligned at time zero. All four must share a sample rate/frame length and be mono or stereo. Their duration must be within AudioEngine's existing 0.1s original-duration acceptance contract. Original and prepared sample rates may differ: generated originals use 22,050Hz, while decoded preparation results use AudioContext rate. The original duration remains the displayed timeline; queries use prepared PCM's sample rate and clamp to its available frames.

Mismatched prepared geometry or selected nonfinite PCM explicitly falls back to labeled original-source context, with no fabricated current-mix profile. A nonfinite value in a muted stem is not part of the requested sum. Negative/out-of-range intervals clamp, and invalid/reversed/nonfinite query windows return zero. Mono upmix follows ordinary Web Audio speaker mapping. Greater-than-stereo prepared buffers are outside the waveform contract and receive a labeled boundary.

No new track duration, payment, deck or account limit is introduced by this display model. Existing separation/runtime constraints are unchanged.

## Cost and lifecycle

`prototype/stem-waveform.js` builds a selected source envelope in chunks of 32,768 frames, yielding between chunks. It stores one Float32 maximum per 256 frames, not another complete mixed PCM buffer. A deck retains at most four completed mask profiles. All-muted avoids scanning completely. The profile derives exact partial-block edges from source samples and cached maxima for whole blocks; it cannot incorrectly pull an impulse from outside the requested interval.

A new selection, source replacement, scope boundary or disposal cancels the prior pending promise with `null`; obsolete work cannot publish a profile. Pending token views are **not** entered into the model's retained views map. This prevents settled promises from retaining evicted profiles and their PCM closures. Fixed boundary views and at most one invalid view per mask are bounded; source replacement clears them. Cache hits reuse profiles without processing additional frames. Unload disposes all deck models.

Bounded storage and yielding are code-path properties, **not measured four-deck frame-rate acceptance**. Exact partial-block detail queries still perform sample additions on animation frames. The actual browser harness records preparation, paint and pixel-readback durations without inventing a performance pass threshold. Sustained multi-minute/four-deck responsiveness and source-domain frequency-colour styling remain separate acceptance work.

## Executed controlled evidence

Run:

```sh
node scripts/test_stem_waveform.mjs
node --check prototype/app.js
node --check prototype/stem-waveform.js
node --check prototype/stem-waveform-harness.js
```

The dedicated Node test executed 10 checks:

1. Every ordinary mask 0–14 against a separately written direct signed-stereo sum across full and partial intervals; all-on preserves the original branch.
2. Prepared and original buffers with different sample rates remain aligned in source time.
3. Opposite-phase cancellation, right-only signal and mono upmix.
4. Exact window boundaries, neighboring impulse exclusion, clipping and invalid query inputs.
5. Immediate all-muted zero with no chunk or PCM scan.
6. Mismatched prepared geometry and selected nonfinite PCM produce explicit context boundaries.
7. Missing stems, FX/tails and dual-clock Stem Slip labels remain honest.
8. Selection/reload/disposal cancel promises; canceled work cannot populate cache.
9. More than four masks, repeated eviction/reentry, no cache-hit rescan and no retained pending token views.
10. The actual production overview and detail painter calls both change with a surviving/canceled mix.

These checks exercise real module logic with controlled AudioBuffer-shaped inputs and Canvas-shaped drawing calls. They **do not** establish actual browser pixels, Web Audio processing, SCNet separation, Serato response, hardware or musical acceptance.

## Actual browser harness for parent execution

Open the existing server's `/prototype/stem-waveform-harness.html`, then click **Run actual audio / waveform checks** (`#run`). Exported `runStemWaveformChecks()` returns the report; the result is also `window.stemWaveformHarnessResult` and visible JSON. The harness disconnects the speaker route before resume or source creation and uses zero-gain analyser sinks.

Seven checks use the real AudioEngine, its actual `attachStems`, ordinary `updateStems` routing, captured stereo time-domain PCM windows and real Canvas2D pixels from the same painters used by app.js:

- Known-aligned original plus four synthetic stems create the actual five-source voice; all-on audio matches an intentionally different original, not their reconstruction.
- Vocal-only audio has the fixture RMS and both canvases have bars.
- Equal/opposite enabled sources cancel in measured audio and both canvases.
- Right-only source is visible in both canvases and only the actual right audio channel.
- All-muted captures silence and zero bars.
- Restore full mix returns the original source audio and branch.
- FX/tail and Slip boundaries are explicitly declined, without claiming those audio paths were tested here.

Reports retain four fixed PCM apertures per mask (2,048 samples/channel each, first 128 values retained per window), measured RMS, timing, pixel counts/hashes and raw profile/preparation/paint/readback timing. The first six checks are actual audio-canvas coupling evidence with known sources; the final check is a scope-label boundary check.

The optional **Run local SCNet preparation check** (`#scnet`, result `window.stemWaveformSCNetResult`) invokes the real `createStemPreparation.prepare` adapter, existing local service and installed SCNet runtime. It downloads no weights or dependencies. Missing service/runtime is `unavailable` with an error, never a pass. It chooses the strongest actual prepared stem by measured source PCM RMS, requires a nonzero audio and canvas path, then checks all-muted audio and both canvases. This validates a real preparation-to-display connection, not source separation quality or vendor fidelity.

The download anchor produces `openplay-stem-waveform-6s.wav` for real main UI reimport/preparation. Main UI acceptance should import that WAV, load Deck 1, click `[data-action="tab"][data-deck="0"][data-tab="Stems"]`, prepare through the visible control, then operate ordinary stem pads `[data-action="pad"][data-deck="0"][data-pad="0".."3"]`. Observe both `#wave-0` and Deck 1's column in `#detail-wave`, plus `[data-wave-scope="0"]`. Confirm all-muted bars disappear, surviving audio remains visible, full mix restores the original branch, unavailable preparation retains its explicit state and the original no-stems deck remains unchanged. Keep speakers disconnected by the parent's approved test method. Do not infer main UI handler acceptance from the standalone harness.

## Coordination and remaining parity

Only app.js and newly owned waveform/test/harness/document files were edited. No engine, panels, native, remote, Git or service changes were made by this agent. The same app.js patch also contains the coordinated FX-tempo helper import, normalized state restoration, normalized persist field and fourth `engine.configureFX` argument; the FX-tempo agent and parent own the rest of that feature.

Remaining boundaries include Stem Slip dual-clock source depiction, captured exit-FX/tail visualization, source frequency-colour treatment, transformed/post-FX output envelope if required by reference observation, sustained full-session performance, and independently evaluated separation quality. Existing SCNet reconstruction/bleed/music-quality findings are unchanged. Browser/Node success cannot prove equal Serato waveforms or source separation quality.

## Source candidate hashes before parent browser execution

SHA-256:

```text
abb6f83f72e022ac59793ec47bcd468e0078b892c10dbd4ef32e851b2a93f753  prototype/app.js
4ae9486c83358fa58fd25888b4b74c581fa81be1e43012e66e5c73cfee15fbd5  prototype/stem-waveform.js
aea1d89abf49e1cd6599e2b027e85b6187b736caceb1377b4412bbc4d79aec14  prototype/stem-waveform-harness.js
75cce2f9f42acd47452dbca6bca26a31a0e0464b9946292bb1cd9d54506dd76b  scripts/test_stem_waveform.mjs
```

## Independent review corrections — stereo originals and end padding

The parent reported actual initial browser **7/7**, optional real local SCNet **1/1**, and visible main UI import/preparation/all-muted/Vocal-only waveform screenshots. Those executions apply to the earlier candidate, not automatically to the corrections below. This agent did not execute browser tools.

A separate reviewer defended two gaps in the earlier code. The original/no-prepared/all-on branch still sampled only channel 0, so an original with L=0/R=0.5 had no bars. Separately, a 1s original with accepted 1.09s prepared buffers could return a nonzero profile peak for 1.04–1.06s, leaking preparation padding beyond the deck's source end. Both findings were valid despite the earlier known-source browser suite being green.

The app now calls shared `paintOriginalOverview` and `paintOriginalDetail` functions. These preserve the original branch's inexpensive sampled rendering but take independent absolute peaks across all source channels, so right-only audio and opposite-polarity stereo channels remain visible. They do not cancel left against right. Their original sampled frequency/detail styling remains independently implemented, not vendor-equivalent or a guaranteed exact peak of every sample.

Stem interval queries now clamp their frame interval to `min(prepared.length, ceil(original.duration * prepared.sampleRate))` before any cached/partial-block read. Preparation padding cannot create detail bars after the original source's end, including a window which crosses that endpoint. No playback/runtime gate was added.

Controlled Node acceptance is now **12/12 executed**, adding the right-only/opposite-polarity original painter and post-end padding regressions. The actual browser suite now expects **9 checks**, adding real no-prepared and all-on right-only original audio captures plus pixels from both actual production original painters. The optional SCNet check remains one separate check. Fresh browser execution of these corrected candidates is pending parent acceptance.

Corrected SHA-256:

```text
3dcf9d9aac8a6b419fd4b413a5e407fd50e89a08eba928e4d11deb463ebbbb4e  prototype/app.js
3eb83ccd3b0fe48d3e313418c021d2fa2f26c2e58b341e858a6d273f1e7c7ad2  prototype/stem-waveform.js
36c2ba1fa1069f9813214df569633da63976fe4ce70c83ceb9d70ed226e747b8  prototype/stem-waveform-harness.js
bcbbee473938c64604529313fff42ff36810387deb155497148971dd6cc452ad  scripts/test_stem_waveform.mjs
```
