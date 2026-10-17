# Video control gaps and one bounded next family

**Later execution update (2026-10-16):** This proposal remains a historical
cutoff. Media Treatment subsequently passed21/21 actual checks; separate recording
resolution passed23/23 plus mainUI480p download. The141226manual was recovered
and independently validated; Effects/Info screens are now observed. Read
[VIDEO_MANUAL_RECOVERY.md](VIDEO_MANUAL_RECOVERY.md),
[VIDEO_MANUAL_GAPS.md](VIDEO_MANUAL_GAPS.md) and
[the executed review](../prototype/VIDEO_MANUAL_RECORDING_REVIEW.md). The earlier
403 statements below describe those requests, not continued source unavailability.


Research cutoff: **2026-10-16**. This document is a source-bounded plan. No runtime, shared implementation contract, remote record or native application was changed. The implementation and acceptance cases below are **proposed, not executed**. Existing browser results establish their recorded paths, not universal Video parity.

**Next family: Media Treatment for ordinary video sources.** Add one independently defined geometry selector, backed by pixel tests. Defer quality, synchronization, buffering, arrangements and external-output controls until their behavior is specified or observed. The names exist in the recorded installed settings; exact reference algorithms/defaults remain unverified.

## Evidence and support limits

| Evidence | What is established | What is not established |
|---|---|---|
| [Recorded installed settings](UI_OBSERVATIONS.md), “Video settings inspection,” lines 85–104 | Serato DJ Pro / Video **4.0.10.213**, inspected on 2026-10-16. Output and Control tabs and menus were read. | No playback, recording, association or parameter change. Raw screenshots were not committed. Values describe that session, **not factory defaults**. No fresh native inspection in this task. |
| [Official Serato Video 1.1 release notes](https://serato.com/video-legacy/downloads/1.1.0/releasenotes), freshly read | Historical fixes address preserve-mode empty regions, mixed 4:3/16:9 material and crossfader endpoints under all media-treatment modes. | Dated **2012-09-25**. Does not define every mode or prove current 4.0.10 rendering. |
| [Official Video-SL 1.1 notes](https://serato.com/video-sl/downloads/1.1.0/releasenotes), freshly read | Historical arrangements can expose prefader channels with mixed output for an external splitter. Historical frame-blending and adaptive V-Sync timing fixes exist. | Dated **2009-05-11**. Does not establish current geometry, processing order, timing or browser/native equivalence. |
| [Official recording troubleshooting](https://support.serato.com/hc/en-us/articles/203015254-Issues-Recording-Video-with-Serato-Video), freshly read | Distinguishes playback buffering from recording; discusses lowering output/recording quality and recording failures. | Undated/version-unspecific and includes legacy QuickTime/platform guidance and a 24-fps recording statement. Treat these as page claims, not a freshly measured 4.0.10 contract. Do not copy a fixed 24-fps assumption into this browser. |
| [Official supported formats/codecs](https://support.serato.com/hc/en-us/articles/202305724-Serato-Video-supported-formats-and-codecs), freshly read | Recommends MP4/H.264/AAC; explicitly bounds support by OS, software version and codec/container combination. | Codec lists do not define scaling, quality settings, GPU filters, output timing or current device behavior. |
| [Official linked manual](https://serato.com/downloads/files/141226/Serato+Video+Software+Manual+for+Serato+DJ.pdf) | Direct fresh HTTP read followed the official redirect and ended **403 at `dl.sera.to`**. Web reader also could not retrieve the PDF. | Contents and edition remain unverified. Search surfaced third-party manual mirrors; their prose is **not used as a primary specification** here. The older 95193 PDF was previously 404. |
| [Existing workflow research](VIDEO_REMAINING_WORKFLOWS.md) and [catalog evaluation](VIDEO_CATALOG_EVALUATION.md) | Preserve format/profile conflicts and separate public documentation, installed resource metadata and reference runtime evidence. | Neither recovers generic output-quality algorithms or the current reference transfer functions. No vendor code/assets were copied for this plan. |

## Gap → behavior map

“Present” below means inspected implementation code, not a new runtime execution. Priorities are scoped planning judgments: P1 blocks a full Video-parity claim; P2 is a bounded independent enhancement. None is declared a launch-critical P0 without product requirements.

| Family / priority | Recorded installed choices or value | Current Open Play behavior | Concrete missing behavior / evidence needed |
|---|---|---|---|
| **Media Treatment · P2 next** | Preserve selected; Stretch, Center-Cut, Letterbox offered | Ordinary/manual/associated/fallback video ultimately stretches to the channel raw canvas. CDG independently contains/letterboxes its 300×216 or cropped288×192 canvas. No generic treatment field or selector. | Implement the single proposed family below. Record four distinct combined fixture signatures; installed algorithms, matte alpha and applicability remain reference unknowns. |
| Window Aspect Ratio · P1 parity gap | No Constraints selected; 16:9, 4:3 | Processing sizes are640×360,1280×720,1920×1080, all16:9. CSS scales previews; fullscreen requests the canvas element. | First distinguish **window constraint** from processing/capture dimensions. Need reference resize/fullscreen behavior, persistence and interaction with treatments. Do not rename the resolution picker “aspect ratio.” Deferred. |
| Output Quality · P1 parity gap | Poor, Low, Medium selected, High, Best | Fixed processing dimensions chosen by resolution; independent WebGL/Canvas algorithms. No quality enum or measured quality ladder. | Determine whether the reference changes resolution, filtering, effects precision, decoder work or another budget. No evidence maps these five labels to browser dimensions/bitrate. Avoid decorative quality options. Deferred. |
| Recording Quality · P1 parity gap |360p,480p selected,720p,1080p | Recording uses the current output canvas and browser-selected supported MediaRecorder container; only360p/720p/1080p processing sizes. No independent recording-quality control or480p path. | Separate recording canvas size from live-output quality; specify480p dimensions/aspect and encoder policy; prove actual container metadata/pixels/audio and sustainable workload. Current dimension choices do not establish this. Deferred. |
| Arrangement · P1 parity gap | Normal(Output) selected; Left-Right; Left-Output-Right | One mixed output canvas plus separate channel previews. | Need exact source stage: raw vs processed, prefader vs postfader; panel ordering, scaling and capture semantics. A browser mosaic would be an independent layout unless verified. Historical external-splitter notes do not establish current behavior. Deferred. |
| V-Sync / Frame Blending · P1 parity gap | Both unchecked in the recorded session | Caller tick/rAF scheduling and browser interpolation; phase-aligned request toward30 ticks/s. No explicit controls. | Need actual frame timestamps, monitor changes, frame-history/blending method and transport discontinuity policy. `requestAnimationFrame` is not a V-Sync toggle; alpha fading is not proof of reference frame blending. Deferred. |
| Buffer Size · P1 parity gap | Slider labels200Mb,1Gb,2Gb; exact position/steps unknown | Browser-managed decode and explicitly bounded effect history. No matching generic playback buffer. | Determine what resource is buffered, units/steps, memory ownership, eviction and failure behavior. GPU history length is not equivalent. Official support describes playback scope but no current allocation contract. Deferred. |
| Delay Compensation · P1 parity gap |0ms, knob and ±buttons; range unknown | Real audio authority drives linked media/CDG; no user AV-offset control. | Need sign convention, legal range, which audio/video path is delayed, recording inclusion and reset/seek/loop handling. A timer offset alone cannot establish AV compensation. Deferred. |
| External / second display / Syphon · P1 parity gap | Output window/control labels and public feature descriptions | Browser canvas fullscreen only; no native output publisher. | Need display selection, open/close/reconnect recovery and actual physical/native output proof. Fullscreen is not a substitute. Deferred. |

Auto Crossfade Speed, Contour Faders and Cursors Crossfade Video were also recorded; numeric timing, curve and routing were not established. Their absence is not addressed by this geometry family. Source labels and effect catalogs must not be used to infer those transfer functions.

## Proposed next unit: ordinary-video Media Treatment

### Scope and compatibility

One global ordinary-video setting, applied independently to each decoded video input **before** channel FX and overlays. It covers manual, associated and Media Crate videos through their common raw-video draw path. Keep the existing output sizes, transition/FX catalogs, audio authority, muted video-source audio, selector ownership, karaoke crop/profile policy and recording APIs.

The initial unit deliberately leaves **CDG geometry on its existing contain/crop path**, and does not rescale text/image overlays with this setting. Label the control **Video media treatment** with a short scope note if needed. It does not claim the reference excludes karaoke or overlays; their reference applicability is unknown. This keeps one bounded family from silently changing already-verified karaoke presentation.

Proposed saved field: `video.mediaTreatment`, string enum `preserve | stretch | center-cut | letterbox`. Missing/invalid/inherited/accessor values restore **stretch**, maintaining existing ordinary-video behavior. This is an **Open Play compatibility default**, not Serato's observed Preserve selection or factory default. Store only that scalar; no decoded resources, geometry caches, URLs or generation counters.

### Exact independent geometry

Let decoded source dimensions be `(sw,sh)` and raw target dimensions `(W,H)`. Require finite positive dimensions; videos use **`videoWidth/videoHeight`**, never layout `width/height`. Draw centered at `(dx,dy)` with destination size `(dw,dh)`, clipped to the target. These equations are proposed original behavior, not recovered vendor algorithms.

| Choice | Destination size | Origin | Observable contract |
|---|---|---|---|
| Preserve | `s=min(W/sw,H/sh)`; `dw=sw*s`, `dh=sh*s` | `dx=(W-dw)/2`, `dy=(H-dh)/2` | Entire source visible, no aspect distortion; unused strips become black padding. |
| Stretch | `dw=W`, `dh=H` | `(0,0)` | Both dimensions fill the target independently; aspect distortion allowed. Same geometry as existing ordinary video. |
| Center-Cut | `s=max(W/sw,H/sh)`; `dw=sw*s`, `dh=sh*s` | Centered | Aspect preserved, target covered; symmetric clipping of excess. |
| Letterbox | `s=W/sw`; `dw=W`, `dh=sh*s` | `dx=0`, `dy=(H-dh)/2` | Always fit source width. Tall material clips vertically; short material gets top/bottom padding. This independently defined distinction must be visible in help/tests. |

Use explicit **opaque black only in padding outside the drawn content rectangle**; preserve decoded source alpha inside the rectangle. Do not fill black behind the entire source and accidentally flatten transparent video. Stretch and Center-Cut normally have no padding. Matte treatment and interpolation are independent choices; current reference alpha/color/filtering are unknown. Keep existing alpha-edge regressions and compare fractional boundary samples with a separately constructed Canvas reference. Do not round all offsets to integers and claim exact reference sampling.

For a320×240(4:3) source into640×360, Preserve produces480×360 at`(80,0)`; Stretch640×360; Center-Cut/Letterbox640×480 at`(0,-60)`. A420×180(wide) source into640×360 separates the remaining cases: Preserve/Letterbox640×274.286 at`(0,42.857)`; Center-Cut840×360 at`(-100,0)`. Both fixtures are necessary: testing only4:3 would make Letterbox and Center-Cut appear identical.

### Loading, seeking and history

Never assign `currentTime`, restart playback, select media, modify audio or change a File load token as a side effect of geometry selection. If a valid decoded frame is available, commit new geometry on the next normal render. If the source is seeking/unavailable, **retain the last actual decoded raw frame** and apply the pending treatment when a valid same-asset frame is available; do not draw a placeholder or reinterpret an unavailable frame.

Track an effective presentation generation per channel and advance it **when new geometry is actually committed**. Include it in the channel's visual source identity or explicitly reset the affected histories at that commit, so Delay Grid/Frame Freeze/transition history cannot mix old geometry into new. Do not persist this generation. A stale load cannot commit geometry or reset a newer asset. After resolution/source changes, recompute from decoded native dimensions. These are independent lifecycle policies needing the tests below.

The setting may change while recording because capture dimensions remain constant. It changes pixels from the next valid rendered frame onward; it must not restart MediaRecorder or disturb master audio. This is a proposed contract, not an executed capability. If implementation cannot meet it, block treatment edits during active recording visibly and revise the contract before acceptance; do not silently drop changes.

### Minimal code ownership for the later implementer

Prepare a pure geometry helper returning validated draw rectangles/padding, then integrate only the common raw-video draw path in `prototype/video.js`, the scalar whitelist in `prototype/video-state.js`, and one native select in `prototype/video-controls.js`. Prefer a small separate helper over changing effect/transition shaders. Main integration and any live parent-owned edits require explicit ownership transfer before editing. No vendor code, shaders or assets are needed.

Existing per-feature model recommendations remain unchanged: this ordinary Video control is VID-002 scope; a measured cross-module ownership/history dispute may use the existing VID-001 escalation policy. This report authorizes no model invocation or runtime change.

## Proposed acceptance, before claiming the family works

1. **Pure geometry:** validate each enum against the exact4:3/wide cases above, portrait/matching-ratio inputs, invalid/zero dimensions and odd fractional offsets. No hidden source-dimension coercion. These tests establish math only.
2. **Actual pixels:** original source with non-square circle, four uniquely colored corner markers, center marker and transparent/opaque edges. Exercise both4:3 and wide sources in all four modes at actual640×360 output. Verify preserved circle ratio, which corner markers are cropped, padding alpha/color and fractional-edge interpolation against an independent Canvas reference. These actual draw tests are required in addition to math.
3. **Actual decoded input:** generate original local videos in both aspect ratios; require real decoded-frame callbacks, then exercise each mode through `mixer.load` and normal render. A generated canvas alone does not establish video dimension handling. No fixed-delay decode surrogate.
4. **Routing/endpoints:** left4:3/rightwide through actual channel previews and Crossfade at0/.5/1. Endpoint output must contain only the selected treated input, including its padding. Verify channel effects consume treated pixels, while overlays retain their existing target coordinates. Preserve all existing alpha/endpoint thresholds.
5. **Seek/history/ownership:** change treatment while a real seek is pending; retain the previous actual frame, then show new geometry after seek completion. Verify effective geometry resets held/history pixels without losing pending asset generations. Include a delayed old File load versus a newer asset and treatment.
6. **Metadata and UI:** actual native select changes pixels; keyboard operation and visible selected value work. Save/restore each scalar choice, malformed values fall back to Stretch, and inherited/accessor fields cannot execute. Reload must not imply media bytes were restored. No new enum silently replaces an older saved value.
7. **Actual capture:** switch treatment during a short capture, decode the resulting video at actual presented frames before/after the switch, verify marker geometry/padding, and decode the captured master tone. Container dimensions remain unchanged. Report measured run duration/rate without a sustained-fps claim.
8. **Noninterference:** rerun affected pipeline, Media Crate and karaoke browser paths plus existing state/alpha checks on the same frozen bytes. Karaoke geometry/profile/crop, source selection, audio clock and capture audio must retain their contracts. Code-path inspection or an adjacent green test does not close this gate.

No native/ref parity claim follows from these passes. Full reference agreement still requires installed-version source treatment, quality/timing/output observations on the relevant hardware, with separately authorized native work.

## Read cutoff / re-entry

Only this document was written. The following working hashes identify inspected code, not a final candidate or new runtime result:

| File | SHA-256 |
|---|---|
| `UI_OBSERVATIONS.md` | `0eb6db6a427d2ef130d729e2d17ba8147c49b5abaada75e9134b49984b8ac6ad` |
| `prototype/video.js` | `b3790787238f7a4318e99016a135800b5db94364f4ab79e64402a57001fa742a` |
| `prototype/video-state.js` | `18ffdffa184fbf937982b89abc9ee29d99f46698979a669ef3e138d5c5ffe85a` |
| `prototype/video-controls.js` | `fc092952537a3d1c33724eaf45e68e118b51ed3446f11f0e61c55cfa112f6ced` |

Re-entry: obtain bounded ownership of the three integration files, freeze the independent geometry/alpha/default policies above, then implement the helper and first actual pixel test. This task ends at the reviewable plan; none of its acceptance cases is marked executed.

Skills applied: use, gap-analysis, dec-quality-testing. The research-only task scope overrides the gap-analysis skill's implementation phase; no fixes or approval request were inferred from that phase.

## Subsequent execution update

Independent Media Treatment is now implemented with21/21 actual browser cases,
including decoded aspect fixtures and recorded video/audio; source-equivalence
limits above remain. The omitted controls are now explicit REQ-496–507(507 total).
Read `../prototype/VIDEO_LINK_TREATMENT_REVIEW.md`; the initial proposal/read cutoff
above is historical, not the current execution status. Other control families stay
open. A bounded Fable5.1/High reference session is seeking primary evidence; no
reference conclusions from it are accepted yet.
