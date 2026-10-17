# Historical Serato Video manual: effect and transition crosswalk

2026-10-16. **Reference parity remains open.** This report compares the actual current independent implementation to a recovered historical primary manual. No production files, browser or native app were changed or exercised for this report. Every proposed test below is unexecuted.

The authoritative machine-readable companion is [VIDEO_MANUAL_FX_CROSSWALK.json](VIDEO_MANUAL_FX_CROSSWALK.json), containing all 55 effect and 34 transition metadata snapshots, per-entry factual paraphrases, code findings, proposed tests, model routing and source hashes.

## Source and interpretation boundary

The [official manual link](https://serato.com/downloads/files/141226/Serato+Video+Software+Manual+for+Serato+DJ.pdf) was recovered and independently verified by the parent. This review read the local PDF and extracted text: [PDF](../../local-evidence/claude-fable/official-video-manual-141226.pdf), [text](../../local-evidence/claude-fable/official-video-manual-141226.txt). This subagent did not repeat the network retrieval. The file is 425,843 bytes, SHA256 `85c57756dc96587b7b4822e2911decb4b9202f5a1d6b1cba047e1159236ae66c`; its PDF creation/modification metadata is 2015-04-09. Printed pages 19–21 correspond to zero-based PDF pages 18–20.

This is primary evidence of historical effect meaning. A current official link does **not** establish that the document describes installed Serato DJ Pro 4.0.10 exactly. Menu availability, defaults, parameters, curves and exact visuals remain unverified. Descriptions here are factual paraphrases, not copied shaders/resources or manual prose.

Page 20 was also rendered and visually inspected to resolve layout. **Filter is a category heading**, not an individual described effect. The PDF literally prints **TITLE** beside a tiling description; its association with local **Tile** is probable. Spin H and Spin V both use vertical-axis wording, so their intended axis distinction remains ambiguous. The Posterize wording states three colors but does not settle global-palette versus per-channel interpretation. None of these source ambiguities is silently repaired.

Implementation snapshots are pinned by SHA256 in the JSON. This is the pre-correction snapshot; subsequent implementation work does not retroactively change these findings or constitute acceptance.

## What changes in the evidence

The 55 current effects have 52 exact manual-name correspondences (case normalized), one punctuation variant Zoom/Tile→ZOOM TILE, one probable TITLE→Tile correspondence, and one manifest-only Filter entry. Of 34 transitions,27 have manual-name correspondence, six localized candidates are not described on these pages, and Crossfade is the separate Open Play baseline. Historical names can now gain an additional manual-description source after parent review; current 4.0.10 availability remains open.

Existing FX72/72 and transition 51/51 browser results prove the prior original contracts. They do not prove these newly recovered meanings. Several assertions deliberately verify behavior now known to diverge: whole-frame pulse holding, gamma brightening and frozen latch snapshots. Preserve those result files as prior independent evidence; add new tests before changing acceptance labels.

## Ranked work and proposed tests

P1/P2 here rank semantic implementation work, not a claim of a production security/severity standard. P1 is explicit named behavior/count/control dependency; P2 needs interpretation or a narrower missing capability. The following table includes all ranked findings; exact current contracts and full per-feature tests are in the JSON.

| Priority | Feature | Current divergence | Falsifiable next test |
|---|---|---|---|
| P1 | Analyzer (effect, p 19) | Current only three supplied bass/mid/treble columns with fixed band colors; no eight-band input or color parameter. | Use 8 independently isolated frequency fixtures and verify eight distinguishable responses; change color parameter at constant spectrum. Do not upsample 3 values and call it 8 actual bands. |
| P1 | Analyzer Blocks (effect, p 19) | Current overlays colored segmented bars over unchanged image instead of switching source-image regions on/off. | Use uniquely colored source regions; vary spectral input and assert gated regions contain source pixels or declared off pixels, rather than unrelated colored overlays. Band count not specified here. |
| P1 | Audio CSL (effect, p 19) | Current bass rotates hue rather than changing contrast. Mid/treble broadly map to saturation/luminance. | Hold level and sweep bands independently on neutral light/dark patches: verify a genuine contrast response, plus saturation/luminance responses. Bass→contrast is a proposed independent mapping, not an exact routing proof. |
| P1 | Audio Fade (effect, p 19) | Current overall level changes alpha of the entire image. | Hold level constant while varying one band: measure alpha/luminance in each of three regions and assert only the matching region changes; region layout/transfer unknown. |
| P1 | Audio Split (effect, p 19) | Current overall level makes horizontal repetitions/displacement; no three-region band-specific zoom. | Hold level constant; excite bass/mid/treble one at a time and verify only its region scale changes using circle/edge markers. |
| P1 | Block Columns (effect, p 20) | Current three spring columns use bass/mid/treble separately; mid and treble can move columns while bass is zero. | Hold bass 0; excite mid/treble at constant level and assert no bass-driven bounce. Bass impulse must move blocks then decay/fall; layout and dynamics independent. |
| P1 | Brightness (effect, p 19) | Current positive amount darkens at upfader 0, is identity at upfader 0.5 and brightens at 1; manual describes a lighting effect without this dependency. | On gray patches, increasing effect amount must brighten at a held neutral upfader; independently vary upfader to expose any extra coupling, without inventing a vendor exposure curve. |
| P1 | CSL Eq (effect, p 19) | Current manual hue/saturation/luminance controls substitute hue for contrast and have no hardware EQ binding. | Use gray contrast patches and hue patches; at least one declared mapped EQ control must change contrast rather than merely rotating hue, with controls for saturation/luminance. Exact knob-to-component assignment needs evidence. |
| P1 | Delay Grid (effect, p 20) | Current time-spaced age lookup shifts multiple tile assignments on each capture and can repeat oldest available frames; columns are adjustable 2..8. | Feed 16 distinct numbered frames and a 17 th; after warmup assert exactly 16 tiles, exactly one changes per declared update, and the other 15 stay unchanged; startup/cadence policy remains independent. |
| P1 | Flash On BPM (effect, p 19) | Current mixes every pixel toward white; already-bright regions change too, with no luminance region selection. | At a beat boundary compare dark and bright patches: dark changes, bright content stays unchanged under a declared mask; verify BPM cadence and Reduced Motion separately. |
| P1 | Frame Freeze (effect, p 20) | Current capture persists indefinitely until token/bypass/source/reset, with no hold-duration expiry. | Capture red, switch source blue, verify red during a declared finite hold and blue after expiry; exact duration/retrigger behavior requires reference evidence. |
| P1 | Frame Pulse (effect, p 20) | Current whole-frame capture/hold-duty effect freezes interior pixels as well as edges. | Animate independent center and border markers: center must keep advancing while border geometry/appearance pulses over a declared period; manual gives no waveform or width. |
| P1 | Gamma (effect, p 20) | Current positive default gamma 3 uses reciprocal exponent and brightens shadows. Existing tests explicitly require that brightening, so they encode the opposite independent contract. | On gray ramps, verify a declared shadow-darkening setting reduces dark pixel levels while preserving black/white; exact exponent and parameter polarity remain unknown. |
| P1 | Isolator Bass (effect, p 19) | Current red/warm tint attenuates green/blue, preserves all colors in silence and has no hue selection or grayscale background. | Use red/green/blue/gray patches and independent bass sweep; nonselected hues must remain gray while selected hue saturation follows bass. Declare hue and transfer independently. |
| P1 | Posterize (effect, p 20) | Current quantizes each RGB channel to 2..16 levels; default 6 produces up to 216 combinations and full amount produces up to 8. Literal three-color palette versus three channel levels needs explicit interpretation. | Use separated flat color patches: count interior output colors at the declared three-color setting; do not silently substitute 3 levels/channel (up to 27 colors). Record palette-vs-channel ambiguity before implementation. |
| P1 | RGB Eq (effect, p 19) | Current independent manual RGB parameters are not bound to hardware/channel EQ knobs. The helper context has no EQ-control vector. | With held source/audio, change each actual EQ knob independently and assert its mapped RGB channel changes; spectral energy changes alone do not prove hardware-control binding. |
| P1 | Saturation (effect, p 20) | Current default target saturation 0 desaturates as positive amount rises; adjustable range can increase but default behavior opposes the manual wording. Manual default/range itself is not specified. | On a nonclipped colored patch, a declared positive-increase operation must raise chroma while preserving gray; retain independently labeled desaturation if offered separately. |
| P1 | Smudge (effect, p 20) | Current spatial samples follow one global angle; they do not converge from all edges toward center. | Place separate markers on all four borders and track smear directions; each must point inward under a declared radial kernel, center must not inherit an arbitrary global direction. |
| P1 | Split (effect, p 20) | Current repeated vertical panels default 4 and permit 2..12, with alternating vertical offsets. | Use numbered source markers and assert five distinguishable regions at enabled full effect; orientation and mapping need an explicit independent contract. |
| P1 | UV Paint (effect, p 20) | Current neon tint and cyan edge glow retain gray/noncolorful content and do not implement the stated colorfulness gate. | Use gray, low-chroma and moderate-chroma patches: gray must become black and eligible color must become bright/saturated; exact threshold and output hue need declared independent choices. |
| P1 | Box Both (transition, p 20) | Current simultaneously scales both source faces instead of alternating Box H and Box V. Manual does not specify when alternation occurs. | Verify each resolved pass equals one declared H or V box mode and alternating events select the other; establish event/cycle policy independently until reference observed. |
| P1 | Center (transition, p 21) | Current spatial expanding rectangle is a different concept; effect is not a remapped central 50% crossfade. | Use solid moving sources: output entirely left at t<=.25, entirely right at t>=.75, and a spatially uniform blend inside. Linear remap is an independent curve choice. |
| P1 | Grid Fade (transition, p 21) | Current 5 x 4 grid has 20 cells and hashed stagger delays. | Detect 3 x 3 cell boundaries; within each cell verify a continuous fade and declare simple ordering independently. |
| P1 | Grid Sequence (transition, p 21) | Current 4 x 4 grid has 16 cells in deterministic row-major order. | Detect 3 x 3 cells and verify declared seeded/per-event varied ordering rather than always row-major; distribution/repeat policy unknown. |
| P1 | Grid Simple (transition, p 21) | Current 6 x 4 grid has 24 cells. | Use coded source cells and detect exactly 3 x 3 regions through a full sweep; define original simple ordering. |
| P1 | Latch 50 (transition, p 21) | Current captures selected frames and freezes until recrossing/endpoints rather than simply selecting the live source. | At .49 display current left; at .51 display current right; keep .51 fixed and change right frames: output must track live right. At .50 tie policy independent. |
| P1 | Scratch (transition, p 21) | Current captures/fixes endpoint frames and scrubs snapshots across the entire interior; no documented temporal-freeze requirement. Exact cut thresholds/hysteresis are unspecified. | Keep fader fixed away from cuts while sources animate: selected source must remain live; sweep endpoints and verify cuts in declared narrow endpoint regions. Resolve thresholds from reference before equivalence. |
| P1 | Scratch Fade (transition, p 21) | Current freezes departing left then crossfades it across the interior; generic upfader gain exists but snapshot semantics are not documented. | Use independently moving sources; exercise fader endpoint cuts and both upfaders. Sources must not freeze merely on entering the interior; exact fade/cut curve requires reference. |
| P1 | Smudge Fade (transition, p 21) | Current global horizontal/wavy offset with temporal prior-output trail does not converge from image edges toward center. | Track four differently colored border markers during fader movement; all edges should smear inward under declared geometry, with live moving sources. |
| P1 | Tile Wave H (transition, p 21) | Current sinusoidal delays depend on both row and column, with nonmonotonic x order; a side-to-side wave is not enforced. | Track first/half-flip times along each row: tile progress must be monotonic in declared horizontal direction; vertical rows must not reorder that wave unexpectedly. |
| P1 | Tile Wave V (transition, p 21) | Same nonmonotonic two-dimensional delay field as H; changing compression axis alone does not create vertical wave order. | Track flip times down each column and assert monotonic declared vertical direction, with H/V visibly distinct. |
| P2 | Analyzer Line (effect, p 19) | Current interpolates three bands into a fixed white line and exposes no color control. Manual does not specify band count for Line. | Hold spectrum, change declared color and inspect line pixels; test actual spectral detail separately without inventing count. |
| P2 | Center Fade (effect, p 20) | Current radial vignette fades outer pixels and additionally multiplies by transport speed; manual places this in Transform rather than Record. Wording does not uniquely resolve fade polarity. | Compare center/border alpha at several amounts while holding the source static; isolate rate changes. Determine center direction and rate independence from reference before locking an exact expected mask. |
| P2 | Color Photocopy (effect, p 19) | Current per-pixel channel threshold plus edge darkening has no blur stage or region-level fill. Description is too short to recover exact segmentation. | Use small high-frequency texture and broad flat regions; compare smoothing/flat region fill against raw channel thresholding. Define original region/blur policy before adding strict acceptance. |
| P2 | False Color (effect, p 20) | Current offers one continuous heat-like luma mapping, with no selectable palette set. | At held source/amount select at least two explicitly independent presets and verify distinct mappings; vendor palette identities remain unknown. |
| P2 | Upfaders Only (transition, p 21) | Current independently upfaded source addition ignores crossfader, which is compatible; actual hardware mapping is not established by synthetic upfader values. | Exercise actual mapped channel faders and verify independent deck visibility with crossfader fixed and swept; no routing or MIDI acceptance from source alone. |

## Complete effect coverage

“Broad class only” records conceptual consistency with short prose, not exact response, availability or acceptance. “Mismatch” is a code-path contradiction; it has not been re-run as a new manual-conformance browser case.

| Effect | Manual page / status | Meaning and current boundary |
|---|---|---|
| Filter | — / Not described | No individual effect entry; Filter is a category heading on page 20. Local manifest identity is not explained by this manual; do not turn the heading into an algorithm specification. |
| Delay Grid | p 20 / Mismatch | Sixteen past frames tiled; one tile updates per update. Current time-spaced age lookup shifts multiple tile assignments on each capture and can repeat oldest available frames; columns are adjustable 2..8. |
| Frame Freeze | p 20 / Mismatch | Hold a frame for a bounded time. Current capture persists indefinitely until token/bypass/source/reset, with no hold-duration expiry. |
| Frame Pulse | p 20 / Mismatch | Periodic motion/pulsing at the frame edges. Current whole-frame capture/hold-duty effect freezes interior pixels as well as edges. |
| Isolator Bass | p 19 / Mismatch | One hue retained with bass-linked saturation; other hues grayscale. Current red/warm tint attenuates green/blue, preserves all colors in silence and has no hue selection or grayscale background. |
| Flash On BPM | p 19 / Mismatch | Beat-synchronized flashes confined to darker image regions. Current mixes every pixel toward white; already-bright regions change too, with no luminance region selection. |
| Split | p 20 / Mismatch | Divide the image into five regions. Current repeated vertical panels default 4 and permit 2..12, with alternating vertical offsets. |
| Audio Split | p 19 / Mismatch | Three regions zoom separately from bass, middle and high bands. Current overall level makes horizontal repetitions/displacement; no three-region band-specific zoom. |
| Audio Fade | p 19 / Mismatch | Three regions fade separately from the three audio bands. Current overall level changes alpha of the entire image. |
| Analyzer Blocks | p 19 / Mismatch | Image regions switch visibility to form a spectrum display. Current overlays colored segmented bars over unchanged image instead of switching source-image regions on/off. |
| Analyzer Image | p 19 / Broad class only | Image columns form a spectrum display. Current three band-height image masks fit the broad description; column count, range and spectral detail remain unknown. |
| Record Rotate | p 20 / Broad class only | Image rotation follows record motion. Signed position/rate rotation is conceptually compatible; exact scale and reset behavior unknown. |
| Center Fade | p 20 / Needs interpretation | Fade spatially toward the center. Current radial vignette fades outer pixels and additionally multiplies by transport speed; manual places this in Transform rather than Record. Wording does not uniquely resolve fade polarity. |
| Record Fade | p 20 / Broad class only | Image fade follows record speed. Current absolute-rate alpha mapping fits the broad statement; direction, scale and stopped behavior are not specified by manual. |
| Bass Blur | p 19 / Broad class only | Blur strength responds to bass. Current bass-only spatial blur matches the documented dependency, not an exact kernel. |
| Bass Zoom | p 19 / Broad class only | Image zoom responds to bass. Current bass-only zoom matches the broad dependency. |
| Treble Blur | p 19 / Broad class only | Blur strength responds to high frequencies. Current treble-only blur matches dependency. |
| Treble Zoom | p 19 / Broad class only | Image zoom responds to high frequencies. Current treble-only zoom matches dependency. |
| RGB Eq | p 19 / Integration gap | Hardware EQ controls drive red, green and blue channels. Current independent manual RGB parameters are not bound to hardware/channel EQ knobs. The helper context has no EQ-control vector. |
| Audio RGB | p 19 / Broad class only | Three frequency bands drive the RGB channels. Current per-band RGB gain matches the dependency; exact sign/gain/mapping unresolved. |
| CSL Eq | p 19 / Mismatch | Hardware EQ drives contrast, saturation and luminance. Current manual hue/saturation/luminance controls substitute hue for contrast and have no hardware EQ binding. |
| Audio CSL | p 19 / Mismatch | Three frequency bands drive contrast, saturation and luminance. Current bass rotates hue rather than changing contrast. Mid/treble broadly map to saturation/luminance. |
| Brightness | p 19 / Mismatch | Increase image brightness. Current positive amount darkens at upfader 0, is identity at upfader 0.5 and brightens at 1; manual describes a lighting effect without this dependency. |
| Smudge | p 20 / Mismatch | Blend image edges inward toward center. Current spatial samples follow one global angle; they do not converge from all edges toward center. |
| Mirror | p 20 / Broad class only | Reflect one side of a divided image. Current selectable horizontal/vertical/both mirroring includes the described behavior; exact allowed axes unknown. |
| Kaleidoscope | p 20 / Broad class only | Create a kaleidoscopic image. Current reflected polar sectors fit this broad class; sector count and controls unknown. |
| Audio Kaleidoscope | p 19 / Broad class only | Kaleidoscope responds to playing audio. Current audio-driven sectors and angle broadly fit; exact band ownership not described. |
| Saturation | p 20 / Direction | Increase image color intensity. Current default target saturation 0 desaturates as positive amount rises; adjustable range can increase but default behavior opposes the manual wording. Manual default/range itself is not specified. |
| Contrast | p 19 / Broad class only | Alter separation between dark and light. Current pivot-based contrast scaling fits broad class; exact pivot/curve unknown. |
| Gamma | p 20 / Direction | Darken shadow tones. Current positive default gamma 3 uses reciprocal exponent and brightens shadows. Existing tests explicitly require that brightening, so they encode the opposite independent contract. |
| Color Isolator | p 19 / Broad class only | Keep one color while converting others to gray. Current selected-hue interval and grayscale complement match broad meaning. |
| UV Paint | p 20 / Mismatch | Boost saturation/brightness of moderately colorful pixels; others black. Current neon tint and cyan edge glow retain gray/noncolorful content and do not implement the stated colorfulness gate. |
| Anaglyph 3 D | p 19 / Broad class only | Stereoscopic glasses-style color separation. Opposed red/cyan displacement is consistent with the class; glasses standard/separation unknown. |
| Luma Key Black | p 20 / Broad class only | Dark source areas reveal the other deck. Current threshold key with supplied secondary deck fits; master-only or missing secondary behavior remains independent. |
| Luma Key White | p 20 / Broad class only | Bright source areas reveal the other deck. Current inverse luma key with supplied secondary deck fits broad meaning. |
| Chroma Key Green | p 19 / Broad class only | Green source areas reveal the other video. Current green-dominance key/composite fits, thresholds/spill unknown. |
| Color Photocopy | p 19 / Needs interpretation | Replace blurred regions with solid colors. Current per-pixel channel threshold plus edge darkening has no blur stage or region-level fill. Description is too short to recover exact segmentation. |
| Emboss | p 20 / Broad class only | Produce a raised or recessed appearance. Diagonal difference relief fits broad class; direction/kernel unknown. |
| Sharpen | p 20 / Broad class only | Increase edge definition. Current source-minus-blur detail boost fits class. |
| Blur | p 19 / Broad class only | Blur image content. Current Gaussian-like spatial blur fits; kernel radius/range unknown. |
| Edge Detect | p 20 / Broad class only | Keep image edges. Current luma finite-difference edge map fits class; hue edge sensitivity unknown. |
| LED Billboard | p 20 / Broad class only | Represent the image with LED-like points. Current sampled circular apertures fit class. |
| V-Hold | p 20 / Broad class only | Broken-television-style image disturbance. Current vertical wrapping and row jitter fit the broad metaphor; exact cadence unknown. |
| Posterize | p 20 / Mismatch | Reduce image color count to three. Current quantizes each RGB channel to 2..16 levels; default 6 produces up to 216 combinations and full amount produces up to 8. Literal three-color palette versus three channel levels needs explicit interpretation. |
| Negative | p 20 / Broad class only | Invert image color. Current RGB inversion fits broad meaning. |
| Sepia | p 20 / Broad class only | Move image toward a sepia appearance. Current warm monochrome blend fits broad meaning; matrix unknown. |
| Rotoscope | p 20 / Broad class only | Hand-drawn-style rendering. Current smoothed quantized color with dark edges fits broad style; no exact aesthetic proof. |
| Rotate | p 20 / Broad class only | Rotate image content. Current static rotation fits broad meaning; localized candidate now also has a historical manual name. |
| Zoom | p 20 / Broad class only | Zoom into the image center. Current center defaults 0.5,0.5 and scale 4 fit meaning; selectable noncenter controls are an independent extension. |
| Tile | p 20 / Probable label | Printed label TITLE; description concerns increasing image tiling. Local label Tile matches tiling meaning, but manual literally prints TITLE. Do not call this an exact-name match or silently repair the source. |
| Zoom/Tile | p 20 / Broad class only | Combine tiling and zoom. Current wrapped scaled coordinates broadly combine both. |
| False Color | p 20 / Missing capability | Map source colors through several preset palettes. Current offers one continuous heat-like luma mapping, with no selectable palette set. |
| Analyzer | p 19 / Mismatch | Eight spectrum bands; control changes display color. Current only three supplied bass/mid/treble columns with fixed band colors; no eight-band input or color parameter. |
| Analyzer Line | p 19 / Missing capability | Line-style spectrum display with adjustable color. Current interpolates three bands into a fixed white line and exposes no color control. Manual does not specify band count for Line. |
| Block Columns | p 20 / Mismatch | Image blocks bounce and fall with bass. Current three spring columns use bass/mid/treble separately; mid and treble can move columns while bass is zero. |

## Complete transition coverage

| Transition | Manual page / status | Meaning and current boundary |
|---|---|---|
| Luma Key Fade | p 21 / Broad class only | Transition using luminance keying. Current incoming luminance threshold fits class; exact threshold/order unknown. |
| Upfaders Only | p 21 / Integration gap | Video deck levels controlled by hardware channel faders. Current independently upfaded source addition ignores crossfader, which is compatible; actual hardware mapping is not established by synthetic upfader values. |
| Additive Average | p 20 / Broad class only | Blend between ordinary and additive transition behavior. Current normalized additive weighting is a plausible independent interpretation; exact midpoint formula unknown. |
| Additive | p 20 / Broad class only | Mix brighter portions of images. Current additive premultiplied sum fits broad blend class; manual does not specify an explicit luma gate or weights. |
| Difference Fade | p 21 / Broad class only | Ordinary transition passes through image difference. Current difference-weighted midpoint fits broad class. |
| Smudge Fade | p 21 / Mismatch | Blend both videos inward from edges toward center. Current global horizontal/wavy offset with temporal prior-output trail does not converge from image edges toward center. |
| Melt | p 21 / Broad class only | Melt-like combination of two images. Current column drips fit broad metaphor; exact direction/timing unknown. |
| Default | p 21 / Broad class only | Ordinary video transition. Independent linear crossfade is plausible; transfer curve and video gamma remain unknown. |
| Center | p 21 / Mismatch | Ordinary blend restricted to the middle half of fader travel. Current spatial expanding rectangle is a different concept; effect is not a remapped central 50% crossfade. |
| Scratch | p 21 / Mismatch | Rapid switching near fader ends. Current captures/fixes endpoint frames and scrubs snapshots across the entire interior; no documented temporal-freeze requirement. Exact cut thresholds/hysteresis are unspecified. |
| Latch 50 | p 21 / Mismatch | Immediate source cut at fader midpoint. Current captures selected frames and freezes until recrossing/endpoints rather than simply selecting the live source. |
| Scratch Fade | p 21 / Mismatch | Scratch variation allowing channel-upfader mixing. Current freezes departing left then crossfades it across the interior; generic upfader gain exists but snapshot semantics are not documented. |
| Box H | p 21 / Broad class only | Images on outer faces of a horizontally turning box. Current compressed shaded faces approximate the concept; no recovered perspective/projection. |
| Box V | p 21 / Broad class only | Images on outer faces of a vertically turning box. Current vertical compressed shaded faces approximate concept. |
| Box Both | p 20 / Mismatch | Alternate the two box-turn transition directions. Current simultaneously scales both source faces instead of alternating Box H and Box V. Manual does not specify when alternation occurs. |
| Spin H | p 21 / Ambiguous | Manual describes spin about a vertical axis. Current x compression is compatible with a vertical-axis card turn despite contract text calling it horizontal-axis; manual uses vertical-axis wording for both H and V. |
| Spin V | p 21 / Ambiguous | Manual also describes spin about a vertical axis. Current y compression differs from literal duplicate text, but likely editorial ambiguity prevents a confident required-axis conclusion. |
| Spin Both | p 21 / Broad class only | Spin involving both axes. Current both-axis compression and in-plane rotation approximates broad class; exact trajectory unknown. |
| Wipe H | — / Not described | No description in pages 19–21. Localized candidate remains unverified by this manual. |
| Wipe V | — / Not described | No description in pages 19–21. Localized candidate remains unverified by this manual. |
| Swap | p 21 / Broad class only | Animated exchange between the two video sources. Current panel translation fits broad animation class; manual sentence has an apparent text error, so no exact choreography inferred. |
| Push Slide H | p 21 / Broad class only | Incoming image pushes previous image horizontally offscreen. Current translated unscaled panels fit broad description. |
| Push Slide V | p 21 / Broad class only | Incoming image pushes previous image vertically offscreen. Current vertical translated panels fit broad description. |
| Tile Wave H | p 21 / Mismatch | Sideways wipe made from flipping tiles. Current sinusoidal delays depend on both row and column, with nonmonotonic x order; a side-to-side wave is not enforced. |
| Tile Wave V | p 21 / Mismatch | Vertical wipe made from flipping tiles. Same nonmonotonic two-dimensional delay field as H; changing compression axis alone does not create vertical wave order. |
| Water Bar H | — / Not described | No description in pages 19–21. Localized candidate remains independent; neither inclusion nor meaning proved. |
| Water Bar V | — / Not described | No description in pages 19–21. Localized candidate remains independent. |
| Tornado | — / Not described | No description in pages 19–21. Localized candidate remains independent. |
| Grid 2 x 2 | p 21 / Broad class only | Four cells change in a simple pattern with fader travel. Current 2 x 2 delayed local wipes match count and broad class; exact ordering unknown. |
| Grid Simple | p 21 / Mismatch | Nine cells change in a simple pattern. Current 6 x 4 grid has 24 cells. |
| Grid Pop | — / Not described | No description in pages 19–21. Localized candidate remains independent. |
| Grid Fade | p 21 / Mismatch | Nine cells fade in a simple pattern. Current 5 x 4 grid has 20 cells and hashed stagger delays. |
| Grid Sequence | p 21 / Mismatch | Nine cells change in a partly random pattern. Current 4 x 4 grid has 16 cells in deterministic row-major order. |
| Crossfade | — / Open Play baseline | Separate Open Play baseline alias. Never counted as a described reference transition. |

## Implementation and verification order

1. Fix explicit structure and live-source semantics first: Split five regions; three nine-cell grid variants; central-half Center; live midpoint Latch 50; edge-only Frame Pulse; three-region Audio Fade/Audio Split. Each gets marker-based or independently excited-band GPU tests. Frame Freeze and Delay Grid need explicitly declared timing/update semantics before their tests change.
2. Correct documented control ownership/direction: Audio CSL contrast, Bass Isolator grayscale/hue response, bass-only Block Columns, positive Brightness/Saturation and shadow-darkening Gamma. Analyzer requires an actual eight-band analysis input and color parameter; three aggregate bands cannot establish eight independent responses. Hardware EQ binding is a separate executed-control requirement, not an FFT inference.
3. Resolve bounded ambiguities before encoding reference claims: palette interpretation, Center Fade polarity, Box Both alternation event, Scratch thresholds/hysteresis, Spin H/V editorial conflict and TITLE/Tile label. Choose original deterministic policies when necessary and label them independent. Then run actual assembled browser paths plus regression suites. Native/reference acceptance stays open until explicitly authorized and observed.

## Preserved model routing

Source: [VID-002 registry](../delivery/feature-registry.json), [development routing](../models/development-routing.json). Routine bounded shader/control/test work uses existing **`gpt-6.1-sol` / high**. Optional fresh review retains **`claude-sonnet-5` / medium**. Escalate only a bounded disputed numerical/DSP/state case, backed by a measured reproduction, to existing **`gpt-6-astra` / high** (`profiles.A`); this is not a blanket reassignment of all Video effects. Existing VID-001 architecture ownership remains separate. These are recommendations, not claims of availability, invocation or benchmark performance.

## Scope and remaining proof

Executed for this report: PDF hash/length/metadata verification; text reading of pages 19–21; visual PDF page 20 layout inspection; current catalog imports and shader/state code inspection; crosswalk uniqueness/coverage validation. Not executed: any proposed semantic test, shader changes, browser comparison, installed reference app or native acceptance. Only the two new crosswalk files were authored.

Skills applied: use, dec-quality-testing, dec-software-principles, dec-discovery-validation.
