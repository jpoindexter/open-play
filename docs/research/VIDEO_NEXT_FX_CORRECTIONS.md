# Next Video FX corrections: ordered implementation specification

2026-10-16. **Specification only; no source/test changes or new pixel acceptance.** The parent executed the preceding Frame Pulse/Split candidate at [74/74 FX checks](../prototype/video-manual-corrected-fx-browser-results.json). Keep that candidate frozen until its checkpoint. Historical results remain intact. The [complete crosswalk](VIDEO_MANUAL_FX_CROSSWALK.md) and [pinned pre-correction JSON](VIDEO_MANUAL_FX_CROSSWALK.json) remain the broader gap inventory.

## Authority and limits

Read directly: printed pages 19–20 of the [recovered official manual](../../local-evidence/claude-fable/official-video-manual-141226.pdf), with [extracted text](../../local-evidence/claude-fable/official-video-manual-141226.txt). PDF SHA256: `85c57756dc96587b7b4822e2911decb4b9202f5a1d6b1cba047e1159236ae66c`; creation metadata 2015-04-09. The [official download link](https://serato.com/downloads/files/141226/Serato+Video+Software+Manual+for+Serato+DJ.pdf) is current according to the parent's independent recovery. The file is historical primary meaning evidence, **not installed Serato DJ Pro 4.0.10 algorithm or availability proof**.

The seven meanings below are sufficiently specific to correct the present category/count/direction errors. Their curves, palette selection, band edges, timer behavior, region geometry and defaults are not recovered. All numeric parameters, formulas and proposed tolerances below are **independent Open Play contracts** to agree before implementation. They are not measurements of Serato. No vendor shader/resource code is required.

## Order and ownership boundaries

| Order | Correction | Why this position | Required production boundary |
|---|---|---|---|
| 1 | Gamma | Small, numeric, falsifiable direction correction | FX catalog/uniforms/shader; explicit preset migration |
| 2 | Saturation | Existing algorithm already supports increase; correct fresh default | Catalog plus migration/default tests; preserve stored zero |
| 3 | Smudge | Pure geometry, no audio or retained-frame dependency | FX shader/parameters plus legacy directional preset branch |
| 4 | UV Paint | Pure color classification with numeric fixtures | FX shader/parameters plus legacy neon preset branch |
| 5 | Isolator Bass | Reuses independently specified hue isolation; needs actual bass input | FX shader/parameters; current measured bass path remains unchanged |
| 6 | Frame Freeze | Requires an explicit timer/retrigger lifecycle | FX state/shader/renderer and metadata; one retained frame only |
| 7 | Analyzer | Eight independent spectral inputs require a cross-module slice | Analysis → engine query → video context → FX uniforms/shader → controls/persistence |

Run one small actual-pixel cohort before broadening it. The Analyzer cohort must include actual audio-analysis-to-pixels acceptance, not just supplied vectors. Parent ownership of shared engine/video/state/controls must be coordinated before edits. This document authorizes none of those mutations by itself.

## Saved-state policy, chosen before changing defaults

The current metadata schema is version 1. `prototype/video-state.js` rebuilds whitelisted `independentParameters` from own scalar data; undeclared old fields disappear and missing new fields acquire defaults. Therefore a new catalog field alone cannot preserve earlier rendering. The recently added Frame Pulse legacy `periodBeats` handling is a concrete precedent, not an automatic migration for these seven effects.

Use the following explicit policy:

- Fresh selections receive the corrected independent manual-meaning behavior. Changing defaults must never rewrite an explicitly saved numeric zero or false.
- For changed algorithms, add a declared `behavior` enum: `Manual Meaning` and `Earlier Open Play`. The second label describes compatibility, never historical Serato behavior. New catalog specs carry `Manual Meaning` explicitly. On restoring **pre-change saved records lacking that field**, insert `Earlier Open Play` before injecting new defaults, retain the applicable old scalar parameters, and preserve their old bounds. Persist the marker so migration is idempotent.
- Apply that compatibility branch to Gamma, Smudge, UV Paint, Isolator Bass, Frame Freeze and Analyzer. Saturation needs no second algorithm: preserve its saved `saturation` target exactly; only fresh selections change default. Earlier saved records with no target require the old default 0 during restoration, not the new default.
- Implement migration in the metadata restore boundary, using the existing own-data/accessor protections. Direct new renderer calls without a behavior marker follow the new default; this is not a promise of implicit compatibility for arbitrary unversioned programmatic calls. Document that distinction.
- Explicit mode changes release incompatible temporal resources. Do not silently convert a legacy preset to the new branch because a dialog opens, a slot is reselected, a snapshot is saved, or a playback asset changes. Users can deliberately choose the corrected meaning. Disabled slots remain disabled.
- Tests must round-trip an actual prior saved fixture through restore → snapshot → restore, compare the preserved scalars/mode, and test representative legacy output separately from the corrected branch. Keep historical raw browser artifacts. Do not count compatibility rendering as new manual-meaning acceptance.

The `behavior` enum is a proposed implementation decision, not a new vendor control. Preserve earlier appearance explicitly rather than implying the same saved values already meet the corrected meaning.

## 1. Gamma — darken shadows

**Source, p20:** the short clause specifies shadow darkening. It does not define a gamma convention, range, sign, transfer space or default. Current shader effect 29 uses `1 / mix(1, gamma, amount)` with default `gamma: 3`; its default positive amount brightens shadows, and the prior numeric browser test explicitly expects that brightening.

**Proposed corrected contract:** normalized display-RGB power curve, `out = input ^ (1 + amount * (shadowPower - 1))`, with `shadowPower` default 2, independently chosen range 1–4. Preserve source alpha; black and white remain endpoints. With power greater than 1, each interior channel darkens monotonically as amount rises. This is display-RGB arithmetic, not a recovered linear-light or vendor gamma model.

**Fixture and strict pixel acceptance:** opaque flat gray patches 0, 64, 128, 192, 255. At full amount/power 2, expect RGB levels approximately 0, 16, 64, 145, 255, tolerance ±2 channels after actual GPU readback. Half amount must lie strictly between identity and full correction for the three interior patches. Repeat with alpha 128: alpha remains 128 ±1 and straight RGB remains within ±2 of the opaque result. Amount 0 and OFF are exact bypass under the existing <0.01 average-difference rule.

**Compatibility:** earlier presets retain original `gamma` (including values below 1) and the reciprocal-exponent algorithm in `Earlier Open Play`. New `shadowPower` must not clamp or reinterpret that stored legacy field. A deliberate switch to the new mode starts with its own default unless the user explicitly enters a power.

## 2. Saturation — increase color intensity by default

**Source, p20:** color intensity increases proportionally to existing color content. Exact color space, scaling, clipping and range are unspecified. Current effect 27 already scales chroma around display-RGB luma, but fresh default `saturation: 0` desaturates as amount rises.

**Proposed corrected contract:** keep the current luma/chroma algorithm and existing independent `saturation` range 0–3; change the fresh default to 2. Values below 1 remain a clearly labeled desaturation extension. At target 2, interpolate chroma scale from 1 at amount 0 to 2 at amount 1; preserve alpha and gray. No new vendor control claim is needed.

**Fixture and strict pixel acceptance:** use a nonclipping patch `[100,120,140,255]` and gray `[100,100,100,255]`. With the existing Rec.709 luma weights and target 2/full amount, expect the first patch near `[83,123,163,255]`, ±2 per RGB channel. Its max-minus-min channel spread grows from 40 to approximately 80; gray remains unchanged ±1. Half amount lies between source and full target in chroma spread. Explicit `saturation: 0` still yields equal RGB channels within ±1. Repeat alpha 128 without changing alpha.

**Compatibility:** preserve every saved explicit target, especially 0. Fresh target 2 must not be applied by a truthy fallback over saved zero. No `Earlier Open Play` branch is required because the existing algorithm/range is unchanged. A missing target in an old saved record resolves to old default 0 only at the restore boundary.

## 3. Smudge — smear border content inward

**Source, p20:** image-edge blending points toward the center. Kernel length, width, center definition and temporal behavior are unspecified. Current effect 23 uses nine samples along one global `angle`; it does not converge inward from all four borders.

**Proposed corrected contract:** original spatial radial smear with no history. For each output point, sample outward along the ray from image center through that point, so border colors leave an inward visible trail. Use nine normalized, equal-weight, premultiplied samples over `radiusPixels` default 24, independent range 0–96 output pixels, with sample coordinates clamped to valid source texel centers. Blend by amount and an edge mask of `edgeWidth` default 0.25, independent range 0.01–0.45 of nearest-edge normalized distance. The center beyond that edge mask stays unchanged. Use pixel/aspect-correct directions; do not turn this into a time-driven swirl.

**Fixture and strict pixel acceptance:** a 256×256 opaque black image, four distinct 4-pixel border strips (red/green/blue/yellow) and a 20×20 gray center patch. At full amount/radius 24, sample 12 pixels inward from each border at its midpoint: each must contain its own border's expected channel(s) >20, with unrelated channels ≤2. The center remains `[80,80,80,255]` ±1 and alpha stays opaque. A corner/asymmetric marker case must show radial convergence rather than a single horizontal/vertical shift. Compare radius 0 to exact bypass and include the existing straight-red/partial-alpha resize invariant for filtered geometry. These thresholds test direction and a real spatial trail; exact vendor smear radius is unknown.

**Compatibility:** retain old `angle` and its directional sampler in the earlier branch. Do not reinterpret degrees as radius, or discard the stored angle. A mode change needs no temporal recapture because neither branch retains frames.

## 4. UV Paint — colorfulness gate, bright saturated result, otherwise black

**Source, p20:** sufficiently colorful pixels become highly saturated and bright; ineligible pixels are black. It does not specify a purple tint, edge glow, colorfulness formula or threshold. Current effect 31 adds a neon tint and cyan edge contribution instead.

**Proposed corrected contract:** hue-preserving HSV-style transform in display RGB. Let colorfulness be `(maxRGB-minRGB)/maxRGB`, with zero for black. `colorThreshold` default 0.20 and `softness` default 0.05 are independent controls, bounded 0–1 and 0.001–0.25 respectively. At/under threshold output black; at/above threshold+softness output the same hue at saturation 1/value 1; interpolate in between. Blend the result with the original by amount. Preserve original alpha: black means black RGB, not transparent pixels. Exact reference color space and gate are unknown.

**Fixture and strict pixel acceptance:** separated constant patches `[100,100,100]` and `[100,99,99]` become `[0,0,0]` at full amount, ±1. `[120,80,80]`, `[80,120,80]` and `[80,80,120]` become red, green and blue respectively with dominant channel ≥253 and other channels ≤2. `[120,100,80]` becomes approximately `[255,128,0]`, ±2, demonstrating hue preservation rather than arbitrary violet tint. Repeat alpha 128, keeping it at 128 ±1. Moving a patch's boundary must not add an unrelated cyan edge glow. Test threshold/softness contrast with fixed-color patches on both sides of the chosen gate.

**Compatibility:** earlier no-parameter saved presets receive `Earlier Open Play` and retain the original neon/edge algorithm. The new thresholds must not silently change those renders; newly selected UV Paint uses the corrected branch explicitly.

## 5. Isolator Bass — grayscale complement with bass-linked retained hue

**Source, p19:** the image is desaturated except for a color whose saturation follows bass. Hue choice, band detector and response curve are unspecified. Current effect 4 simply attenuates green/blue with bass and leaves all colors unchanged during silence; that does not produce a grayscale complement.

**Proposed corrected contract:** reuse the existing independent Color Isolator hue-distance convention. Add `hue` default 0 degrees, `width` default 0.08 hue turns and `softness` default 0.08 hue turns (bounds mirror Color Isolator). Let `keep` be the selected-hue mask and `g` the current display-RGB luma. At full amount, output `g + (input-g) * keep * clamp(bass,0,1)`. Thus nonselected hues stay gray; selected hue moves continuously from gray in silence to its original saturation at bass 1. Amount 0 restores original pixels. This exact gain, silence policy and default red hue are independent choices, not recovered reference response.

**Fixture and strict pixel acceptance:** red, green, blue and gray patches. With hue 0/bass 1/full amount, red remains near `[255,0,0]`, green becomes approximately `[182,182,182]`, blue `[18,18,18]`, and gray stays gray (RGB ±2). With bass 0, red also becomes approximately `[54,54,54]`. At bass 0.5, selected red has intermediate chroma; nonselected green remains gray. Change only mid/treble/overall level at fixed bass: output must remain unchanged <0.01 average difference. Change selected hue to green and prove color ownership switches. Preserve alpha 128 ±1. Then run an actual low-frequency PCM → measured bass → pixel case and a high-frequency negative control; supplied band vectors alone are not assembled acceptance.

**Compatibility:** earlier presets keep the red/warm attenuation algorithm and its original silence identity in the earlier branch. Do not claim the corrected silence desaturation preserves their appearance. The generic Bass analysis tap remains unchanged in this cohort.

## 6. Frame Freeze — finite one-shot hold with explicit retrigger

**Source, p20:** a frame is held for a specified finite period. The manual does not define retriggering, automatic cycles, timer clock, duration bounds or what paused source playback does to that timer. Current effect 2 retains one frame indefinitely until capture token, bypass/effect/source change or reset.

**Proposed corrected contract:** `durationSeconds` default 1, independent range 0.05–16 seconds; retain existing finite scalar `captureToken`. On entry to an enabled positive-amount interval or a changed token, capture the actual upstream frame once and record supplied monotonic render time. Hold until `captureTime + durationSeconds`, then return live and stay live until an explicit trigger. Do not recapture automatically every frame or every period. Amount changes blend the same capture; duration edits adjust its original deadline without restarting it. Once expired, increasing duration cannot resurrect the old frame. Source/effect/mode changes, OFF, zero amount, explicit reset and backward time invalidate capture/timer; the next eligible trigger captures current content. Timing uses presentation time even if source playback is paused; that is an independent policy. Store at most one frame, not a recording buffer.

**Fixture and strict pixel acceptance:** capture opaque red at time 0/duration 1; replace source with blue. At 0.4/full amount expect red ≥253 and blue ≤2. At 1.001 expect blue ≥253 and red ≤2. Replace source green at 1.1: it stays live green, proving expiry did not start another hold. A changed token at 1.2 captures green; a subsequent blue source remains held green until 2.2. At half amount before expiry, equal-alpha red capture/blue live gives `[128,0,128]` ±2. Independently test duration shorten/extend before expiry, extension after expiry (no resurrection), zero/OFF/re-enable, source replacement, duplicate frame ID with advancing time, backward clock and two independent slots. Repeat a partially transparent capture and assert correct premultiplied blending/straight-alpha output.

**Compatibility:** earlier saved capture-token presets retain indefinite hold in `Earlier Open Play`; explicit manual-meaning mode gets finite timing. Preserve the capture token scalar but never persist captured pixels, capture timestamps, runtime tokens or GPU handles. Any mode switch starts a fresh lifecycle. The UI must show that the earlier mode holds until recapture instead of presenting a nonfunctional duration knob.

## 7. Analyzer — actual eight-band spectrum and a color control

**Source, p19:** the display has eight spectrum bands and a parameter selecting color. The manual does not specify band boundaries, FFT/window size, weighting, visual layout, smoothing or color palette. Current effect 52 draws three fixed-color bars, and the actual analysis/query/context path provides only bass/mid/treble plus RMS. Making eight bars by repeating/interpolating those three values would not close this gap.

**Proposed data contract:** extend the real analysis result with `spectrum8`, eight bounded values derived independently from FFT power, while retaining the current bass/mid/treble/RMS fields and their behavior. Proposed independent frequency boundaries: `[20,63,125,250,500,1000,2000,4000,20000]` Hz. Clip ranges at Nyquist; return zero for empty ranges. Preserve the current FFT size 2048 initially and sum actual bin power using the existing analysis convention; no extra audio connection or audible signal. Do not claim these are vendor bands. Plumb the eight values unchanged through the existing engine query and per-channel/master contexts; validate length/finite values in the FX normalizer. Missing eight-band data must produce explicit `spectrum8-unavailable` diagnostics and source bypass in the corrected branch, rather than fabricating independent bands. Actual silence with a valid zero vector is a valid spectrum, not unavailable.

**Proposed visual contract:** eight equal-width vertical bars over black at full amount, preserving source alpha. New `hue` default 120 degrees, independent range 0–360, selects a single saturated display color; `gain` default 1, range 0–4, scales all eight heights with clamping. Amount blends source into that display. Bar layout, hue mapping, gain and background are independent choices. The earlier three-band/fixed-color display remains an explicitly separate compatibility branch.

**Fixture and strict pixel acceptance:** first, provide eight actual-length unit vectors with one value 0.75 and the rest 0. On 96×64 output, each vector must illuminate its corresponding one of eight 12-pixel columns at center height while all seven other column centers remain black (≤2 channels). The same selected column is black above its 75% height. At hue 120 its bar center is green ≥253 with red/blue ≤2; changing hue to 0 gives red ≥253 with green/blue ≤2 without moving its height. Repeat with alpha 128 and test all-zero valid spectrum separately from a missing/malformed vector.

Then use actual AudioEngine PCM tones at eight independently chosen frequencies safely within the bands (choose FFT-bin-centered tones for the actual sample rate). Require the intended band and corresponding bar to dominate; account explicitly for Blackman-window leakage into neighboring bins instead of demanding mathematical zero everywhere. Keep full measured eight-vectors, sample rate, FFT size, chosen tones and pixel columns in evidence. Changing only the displayed source or color must not alter measured spectrum or audio amplitude. Off/bypass, left/right/master ownership, pause/silence and post-master audio noninterference need actual assembled checks. Deterministic vectors prove geometry only; actual tones prove the expanded analysis path.

**Compatibility:** old Analyzer presets without a behavior marker restore the three-band display. Fresh Manual Meaning presets require real eight-band data; missing data is diagnosed, not silently sent through the old display. Persist only declared hue/gain/behavior, never a measured spectrum or runtime analyser. Independently verify unrelated three-band reactive effects retain their pre-change inputs and output behavior.

## Cross-feature acceptance and remaining unknowns

Before any correction is called accepted, execute its real shader/render path with these fixtures; preserve source/alpha/bypass tolerances and record actual values before assertions. Add pure numerical/state checks where they exercise migration, timer behavior or distinct-frequency integration, not a duplicate of shader source text. Re-run assembled pipeline ownership/audio/capture checks after Analyzer or renderer lifecycle changes; earlier Gamma/Saturation/Smudge/UV tests alone do not establish that integration.

The previously frozen 74/74 result is a starting checkpoint, not a waiver for new failures. Keep the unambiguous historical meaning separate from independently selected curves and from installed 4.0.10 equivalence. Posterize's three-color interpretation, Spin H/V wording and other crosswalk ambiguities are deliberately outside this seven-correction unit.

Model routing remains [VID-002](../delivery/feature-registry.json): routine `gpt-6.1-sol` / high; optional fresh `claude-sonnet-5` / medium review. Use the existing `gpt-6-astra` / high profile only for a bounded measured numerical/state dispute. No model availability or invocation is claimed.

Executed for this specification: primary-source clause reading, current shader/state/catalog/analysis/persistence inspection and prior-result artifact inspection. Not executed: any proposed correction, migration, eight-band analysis or new GPU test. Source/tests remain frozen.

Skills applied: use, dec-quality-testing, dec-software-principles, dec-discovery-validation.


## Subsequent execution — 17 October 2026

The seven proposed independent corrections above now have actual GPU evidence.
Gamma/Saturation/Smudge/UV checkpoint81/81; Isolator Bass/finite Freeze88/88;
current eight-band Analyzer102/102 including actual AudioEngine PCM. Real
eight-band analysis17/17 and assembled pipeline33/33 also execute. Read
../prototype/VIDEO_SPECTRUM_OPACITY_REVIEW.md for exact scope, compatibility,
retained failures and source limitations. This does not turn the independent
frequency bands/curves or the historical manual into current Serato equivalence.
