# Semantic Video links and Media Treatment — executed continuation

2026-10-16. **Full Serato parity NOT PASSED. Native approval NOT GRANTED.**
This extends the frozen Video checkpoint. Candidate-hashes.json and the Claude
packet pin the final revision; new code is independent, not copied vendor code.

## Actual paths and limits

| Layer | Result | What ran |
|---|---:|---|
| Semantic audio→Video bridge |24/24|Actual AudioEngine.configureFX/query, WebGL2 pixels, live PCM/transport and measured master RMS. Deterministic delay cases explicitly supply render timestamps.|
| Media Treatment |21/21|Actual decoded4:3/wide local Files through the mixer/GPU; marker/circle/padding/alpha checks, previews/transitions, held-frame reset, real seek/resize, metadata and actual recorded-container video/audio decode.|
| Assembled pipeline regression |32/32|Current mixer/pipeline/AudioEngine, reverse/queued seeks,720p/1080p output and actual capture/replay.|
| Media Crate regression |32/32|Actual Files/engine/pixels, ownership, association/fallback and six fresh paused first frames.|
| Karaoke regression |19/19|Actual original audio/CDG/clock/GPU/capture; generic Video treatment bypasses the CDG crop policy.|
| Pure/controlled scripts |16 scripts exit0|Exact scopes retained in video-link-treatment-node-results.json. Semantic planner17; geometry10; independent ownership/resize8; metadata16. These do not replace browser proof.|

Raw artifacts: [semantic bridge](video-audio-fx-browser-results.json),
[treatment](video-treatment-browser-results.json),
[pipeline](video-pipeline-link-treatment-results.json),
[Media](video-media-link-treatment-results.json),
[karaoke](karaoke-link-treatment-results.json),
[Node](video-link-treatment-node-results.json).

The bridge is a persisted opt-in named “Link audio Echo / Distortion”. It reads
configured exact-name audio bank effects, enable/depth, target, BPM/beat/Beat Modify
and supported parameters. Deck1→left, Deck2→right and Master→master are mapped once
per configured bank/slot. Other names/routes are diagnosed; FFT does not infer an
effect identity. Two master-assigned banks remain distinct ordered links. Channel
links precede ordinary Video slots; master links follow the transition before
overlays/ordinary master slots. This is an independent routing contract.

Echo uses three shifted real past-frame taps at1T/2T/3T with finite feedback decay;
16 timestamped samples at up to320×180. It is not recursive video feedback. Missing
past samples contribute nothing. Disable/removal/route/upstream-topology change,
source/load/seek/loop/direction discontinuity, pause/stop and backward render clocks
clear its history. Amount/timing edits retain genuine samples. Reduced Motion
suppresses trails/geometry while retaining static Distortion colour. Distortion
uses independently defined Drive/Character/Tone and Smooth Drive/Hard Clip/Foldback
transforms. Neither helper changes an audio node or audio effect parameter.

Media Treatment offers Preserve(contain), Stretch(fill), Center-Cut(cover) and
Letterbox(width-fit with possible vertical crop), defaulting to Stretch for
compatibility with the earlier prototype. The reference session had Preserve
selected; that observation is not a default or equations proof. Padding outside
content is opaque black; internal source alpha is preserved. Valid new geometry
commits on a decoded non-seeking frame, advances presentation identity and resets
incompatible history. During seek, previous actual pixels remain. Resize resamples
that prior decoded canvas until valid geometry can commit. Audio time, selection,
load tokens and capture dimensions are unchanged by treatment selection.

## Reproduced failures and corrections

- First semantic run21/24 is retained in video-audio-fx-browser-results-initial.json.
  Zero-Feedback Echo evaluated undefined GLSL pow(0,0) at its first tap. Explicit
  first-tap unity corrected both strict timing and straight-red alpha failures.
- The audio comparison initially sampled an unsettled window. The harness now
  establishes measured pre-toggle stationarity, then takes equal fixed off/on/off
  windows using a2048-sample aperture. The0.002 tolerance is unchanged and raw
  windows are retained; there is no adaptive post-toggle wait to force agreement.
- The independent reviewer reproduced a resize-during-seek fatal error (6/7),
  then the real pipeline revealed a placeholder at1080p (31/32). Corrected mixer
  waits for valid decoded frames and carries previous actual raw pixels through
  resize. Both red artifacts remain; independent8/8 and actual32/32 follow.
- Test collaborator changes add actual Canvas context ownership and decoded
  dimensions and resolve the new module import. Existing assertions were retained;
  those controlled passes are not browser decode proof.

## Main UI and persistence

[Main UI evidence](video-link-treatment-ui-results.json) records actual link ON +
Preserve selection surviving reload, then inactive link restoration. The exact
original4:3 File imported through the main left chooser and stayed paused. Selecting
Preserve visibly retains corner markers/pillarboxes; selecting Center-Cut fills
width, enlarges the circle and crops markers. Both screenshots were inspected:
[preserve](video-treatment-main-ui-preserve.png),
[center-cut](video-treatment-main-ui-center-cut.png).

Home+ArrowDown locator presses did not change the select value in this browser;
keyboard option change remains unverified. Direct selector interaction and
persistence passed. This is reported separately from the numeric GPU suite.

## Source coverage, models and remaining scope

REQ-348 now records the actual semantic subset. Twelve observed settings omitted
from detailed rows are added as REQ-496–507, with inherited per-feature model
routing. The working inventory is110 groups/507 rows, complete_inventory=false.
These rows cover Window Aspect Ratio, Output Quality, Recording Quality,
Arrangement, Media Treatment, V-Sync, Frame Blending, Buffer Size, Delay Compensation,
Auto Crossfade Speed, Contour Faders and Cursors Crossfade Video. Only the independent
Media Treatment family is implemented here. Labels/session values are observed;
reference behavior for the others remains open.

All31 hidden AUDIO_LINKED definitions, effects beyond exact Echo/Distortion,
Deck3/4/Sampler/Channel/Stems links, reference timing/algorithms/ranges/defaults/
order/tails/visuals remain open. Generic Video quality/window/recording/arrangement/
buffering/delay/fader controls, second-display/Syphon, codecs/long sessions, native/
physical acceptance, CDG channels/parity and the rest of the project remain open.
No no-limits or full1:1 claim follows from these subsets.

VID-002 recommendation stays Codex gpt-6.1-sol/high; Claude Code claude-sonnet-5/medium.
VID-001 stays Sol/xhigh; Claude Code claude-opus-5/high. Verify actual invocation
support; those recommendations are not execution. Bounded Astra/high escalation
requires a measured unresolved dispute. Jason's separately authorized Claude Code
research session was started on this computer/Open Play with **Fable5.1/High**,
observed in the actual selector. It may write only its separate reference findings;
it has no native/implementation/remote-write authority. Its output requires source
verification and does not replace the full independent audit.

Reproduce the two new public pages video-audio-fx-harness.html and
video-treatment-harness.html. Run buttons use original fixtures and disconnect
speakers; main UI uses the default browser output. Stop playback afterward. Final
candidate/source hashes and raw results retain their individual evidence boundaries.

Measured master RMS after settling: off=0.21118021, on=0.21104439, off again=0.21082229; tolerance0.002. This is held-signal RMS noninterference, not sample-for-sample audio equivalence.
