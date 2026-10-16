# Video catalog evaluation

Inspected 2026-10-16T16:08:38.481128+00:00. Both installed host and nested Serato Video bundles report **4.0.10 / 4.0.10.213**. This task read local files and official web sources. It did not control Serato, a shared browser, or any remote record.

## Result and proof boundary

The installed Video resources declare **47 slot effects and seven transitions**. A separate localization file supplies eight additional non-sentinel effect labels and 26 additional transition labels: **55 effect-name candidates and 33 transition-name candidates** in the unions. The manifest sets are directly observed; the complete active/visible menu counts remain unknown. Localization and RTTI strings do not prove registration, availability, or runtime behavior.

The old opaque host effect-manifest finding in BINARY_FINDINGS.md concerns the host packed audio resource. These newly located Video XML files are in the nested Video app and were directly parseable. No shader, vendor algorithm or resource asset was copied. Only factual names, flags, defaults and provenance are recorded.

## Official-source findings

- [downloads](https://serato.com/dj/pro/downloads): HTTP200_HTML_READ. Fresh official HTML links Serato Video Manual to file141226; web reader omitted this accordion.
- [replacementManual](https://serato.com/downloads/files/141226/Serato+Video+Software+Manual+for+Serato+DJ.pdf): REDIRECT_THEN_HTTP403. Fresh official link follows signed dl.sera.to/26/141226/141226 redirect, then CloudFront403. Content, edition and catalog not retrieved; old95193 link is not the only official path.
- [legacyDownloads](https://serato.com/video-legacy/downloads/1.1.0): HTTP200_HTML_READ. Links141226 for Serato DJ and141227 for Scratch Live/ITCH. Historical1.1 guidance documents automatic sequential/random transition selection on track load.
- [expansions](https://serato.com/dj/pro/expansions): HTTP200_WEB_READ. Documents channel/master Video effects, two master slots, audio-linked visual echo/distortion, HD recording, MP3+G and Syphon; no exact catalog.
- [video101](https://support.serato.com/hc/en-us/articles/204211070-Serato-Video-101): HTTP200_WEB_READ. Panel supports selecting transitions and FX; no complete named catalog.
- [overlay101](https://support.serato.com/hc/en-us/articles/202305514-Serato-Video-Text-and-Image-Effects-101): HTTP200_WEB_READ. Text/image save/edit/reload/ON, font/color/alignment and animations documented; reactive zoom requires L/R deck and audio overview.
- [release4010](https://serato.com/dj/pro/downloads/4.0.10): HTTP200_WEB_READ. No Video catalog list/change in inspected4.0.10 notes; absence does not prove unchanged behavior.
- [demo](https://support.serato.com/hc/en-us/articles/202538870-Using-Serato-Video-in-Demo-Mode): HTTP200_WEB_READ. Historical link/unlink fader and preview guidance; older95193 PDF previously404 in UI_OBSERVATIONS. Do not replace current behavior with legacy setup instructions.

The replacement manual is a freshly discovered official path, not a successfully retrieved manual. Its signed URL is intentionally omitted. Legacy documentation is evidence of documented behavior, not installed-version observation.

## Manifest slot effects (47)

Category, flags, raw stored default and XML line are factual metadata. ONE_PARAM means the manifest includes that flag, not a proven user-control label or numeric range. No UI min/max, units or enum choices were present in these manifests. Treat 0/128/255 as raw defaults only. RGB Eq and CSL Eq retain historical TTM 57SL Controls category names; this does not prove current hardware support.

| Name | Category | Flags | Raw default | XML line |
|---|---|---|---:|---:|
| Filter | Analyzer | SLOT, ONE_PARAM | 128 | 2 |
| Delay Grid | Delay | SLOT, ONE_PARAM, TWO_PASS | 0 | 15 |
| Frame Freeze | Delay | SLOT, ONE_PARAM, TWO_PASS | 0 | 33 |
| Frame Pulse | Delay | SLOT, ONE_PARAM, TWO_PASS | 0 | 51 |
| Isolator Bass | Colour | SLOT, ONE_PARAM | 0 | 69 |
| Flash On BPM | BPM Sync | SLOT, ONE_PARAM | 255 | 83 |
| Split | Split | SLOT, ONE_PARAM | 0 | 96 |
| Audio Split | Audio Reactive | SLOT, ONE_PARAM | 128 | 111 |
| Audio Fade | Audio Reactive | SLOT, ONE_PARAM | 128 | 129 |
| Analyzer Blocks | Analyzer | SLOT, ONE_PARAM | 128 | 147 |
| Analyzer Image | Analyzer | SLOT, ONE_PARAM | 128 | 166 |
| Record Rotate | Record | SLOT, ONE_PARAM | 255 | 185 |
| Center Fade | Record | SLOT, ONE_PARAM | 255 | 198 |
| Record Fade | Record | SLOT, ONE_PARAM | 255 | 211 |
| Bass Blur | Audio Reactive | SLOT, ONE_PARAM | 128 | 224 |
| Bass Zoom | Audio Reactive | SLOT, ONE_PARAM | 128 | 237 |
| Treble Blur | Audio Reactive | SLOT, ONE_PARAM | 128 | 250 |
| Treble Zoom | Audio Reactive | SLOT, ONE_PARAM | 128 | 263 |
| RGB Eq | TTM 57SL Controls | SLOT | 128 | 276 |
| Audio RGB | Audio Reactive | SLOT, ONE_PARAM | 128 | 290 |
| CSL Eq | TTM 57SL Controls | SLOT | 128 | 304 |
| Audio CSL | Audio Reactive | SLOT | 128 | 318 |
| Brightness | Upfader | SLOT, UPFADER, ONE_PARAM | 128 | 332 |
| Smudge | Image | SLOT, ONE_PARAM | 0 | 346 |
| Mirror | Split | SLOT, ONE_PARAM | 0 | 360 |
| Kaleidoscope | Split | SLOT, ONE_PARAM | 255 | 374 |
| Audio Kaleidoscope | Audio Reactive | SLOT, ONE_PARAM | 128 | 388 |
| Saturation | Image | SLOT, ONE_PARAM | 128 | 405 |
| Contrast | Image | SLOT, ONE_PARAM | 0 | 419 |
| Gamma | Image | SLOT, ONE_PARAM | 128 | 433 |
| Color Isolator | Colour | SLOT, ONE_PARAM | 0 | 447 |
| UV Paint | Colour | SLOT | 0 | 461 |
| Anaglyph 3D | Colour | SLOT, ONE_PARAM | 0 | 475 |
| Luma Key Black | Alpha Based | SLOT, TWO_SOURCE, ONE_PARAM | 0 | 489 |
| Luma Key White | Alpha Based | SLOT, TWO_SOURCE, ONE_PARAM | 0 | 503 |
| Chroma Key Green | Alpha Based | SLOT, TWO_SOURCE, ONE_PARAM | 0 | 517 |
| Color Photocopy | Multisample | SLOT, ONE_PARAM | 0 | 531 |
| Emboss | Multisample | SLOT, ONE_PARAM | 0 | 558 |
| Sharpen | Multisample | SLOT, ONE_PARAM | 0 | 585 |
| Blur | Multisample | SLOT, ONE_PARAM | 0 | 612 |
| Edge Detect | Multisample | SLOT, ONE_PARAM | 128 | 639 |
| LED Billboard | Multisample | SLOT, ONE_PARAM | 0 | 666 |
| V-Hold | Time Based | SLOT, ONE_PARAM | 0 | 693 |
| Posterize | Image | SLOT, ONE_PARAM | 0 | 707 |
| Negative | Image | SLOT | 0 | 721 |
| Sepia | Image | SLOT, ONE_PARAM | 255 | 735 |
| Rotoscope | Image | SLOT, ONE_PARAM | 255 | 749 |

## Manifest transitions (7)

No fader numeric parameter/range/default enum is supplied by faders.xml. These are declared resources, not an observed menu.

| Name | Category | XML line |
|---|---|---:|
| Luma Key Fade | Shader | 2 |
| Upfaders Only | Blend | 13 |
| Additive Average | Blend | 24 |
| Additive | Blend | 35 |
| Difference Fade | Blend | 46 |
| Smudge Fade | Shader | 57 |
| Melt | Shader | 68 |

## Documented slot controls and original contracts

The [official DDJ-SP1 Video control table](https://support.serato.com/hc/en-us/articles/10173705065871-Pioneer-DJ-DDJ-SP1-Quickstart-Guide) documents two independently selected/enabled Video effect slots on each LEFT/RIGHT side, with parameter knobs; image/text opacity and animation selection; and transition cycling/scrolling. Combined with the expansion page's two master slots, the proposed HTML target is **two slots per channel plus two master slots, six positions**. This is public control documentation, not observed current UI/hardware behavior or a verified processing order.

The JSON gives a per-effect `INFERRED_PROPOSAL` contract. These are independent semantic interpretations, not recovered vendor algorithms or equivalence claims. Ambiguous Filter/UV Paint/RGB Eq/CSL Eq/record-driven entries remain explicit unknowns until an original contract is declared. No shader or executable implementation was copied. Ordinary terms such as Blur, Gamma, Negative and Emboss support original implementations with declared parameters; they do not reveal Serato's transfer functions.

## Additional localization labels — provisional

Effect labels (8): Rotate, Zoom, Tile, Zoom/Tile, False Color, Analyzer, Analyzer Line, Block Columns.

Transition labels (26): Default, Center, Scratch, Latch 50, Scratch Fade, Box H, Box V, Box Both, Spin H, Spin V, Spin Both, Wipe H, Wipe V, Swap, Push Slide H, Push Slide V, Tile Wave H, Tile Wave V, Water Bar H, Water Bar V, Tornado, Grid 2x2, Grid Simple, Grid Pop, Grid Fade, Grid Sequence.

Excluded effect sentinels: Empty and ---TEXT---. The JSON records localization keys/lines individually. Matching binary type-family strings exist for rotation, zoom, tile, analyzer, rigid-body and fader families, but these neither count instantiated variants nor prove visible registration. In particular, the five Grid labels could include unused variants; 33 must not be advertised as a verified menu total.

## Hidden audio-linked definitions (31)

These all carry HIDDEN and AUDIO_LINKED flags and are separate from the normal47 SLOT effects. They are not31 extra user-selectable audio effects. Names: delay, echo, reverb, phaser, flanger, lp filter, hp filter, combo filter, distortion, pan delay, epic reverb, bit crush, tremolo, repeater, braker, brake echo, tape echo, looper, time stretch, spiral echo, auto filter, spiral flanger, pitch delay, crush echo, particle delay, noise sweep, shepard filter, space verb, filter echo, filter gate, noise pulse.

Public expansion guidance documents audio-linked visual effects, but the mapping of this legacy internal list to current59 DJ-FX and its exact value transfer remains unknown.

## Controls and observed-versus-documented state

The public overlay guide documents Scroll in four directions (Left-Right, Right-Left, Top-Bottom, Bottom-Top) and three speeds (slow, medium, fast); BPM Zoom and Bass Zoom each offer Subtle, Noticeable and Over the Top. Reactive zoom requires L/R deck context with an audio overview. Text adds font/color; images/text support alignment, saved presets, edit/reload and ON. These are documented controls, not freshly observed4.0.10 menus.

Prior UI_OBSERVATIONS.md lines85 onward observed Output/Control settings including Auto Crossfade Speed, Contour Faders and Cursors Crossfade Video. Its Effects/Info pages did not open and catalog menus were not observed. This task did not re-run those observations. Numeric crossfade speed and contour mappings remain unknown.

Source inspection of panels.js found Crossfade plus illustrative Wipe/Zoom, and a Video FX dialog with Off/Illustrative color shift options lacking connected effect-renderer handlers. These do not satisfy the discovered catalog. Crossfade is an independent prototype choice, not a proved equivalent of the localized Default transition; Zoom is present as an effect label and does not establish a transition named Zoom. This is source evidence, not a new runtime test.

## Independent HTML implementation acceptance — proposed, not executed

### VCAT-01 Evidence-backed names

Expose47 XML slot names and7 XML transition names with stable independent IDs/provenance. Keep8 additional localized effect and26 transition labels provisional; exclude Empty and ---TEXT--- from effect totals. No invented names;55/33 remains candidate-name union, not confirmed active menus.

### VCAT-02 Actual independent rendering

Use moving asymmetric color bars/checkerboards/frame numbers through real Canvas/WebGL. For each enabled effect capture bypass and at least3 distinct parameter states, toggle off and switch effects. Intended pixels change, bypass restores input, amount changes matter, old temporal state releases. Metadata-only entries unavailable. This is not Serato visual equivalence.

### VCAT-03 Slot routing

Apply two independent slots on each left/right channel plus two master slots, six positions. Test isolation, independent selection/on/off/parameter, and noncommuting processor order. Publish the original processing order; reference order and simultaneous hardware behavior remain unknown.

### VCAT-04 Transitions

For each original transition sample minimum, near-minimum, midpoint, near-maximum and maximum crossfader positions in both directions plus channel upfaders. Document a distinct independent contract per family; do not assume conventional A/B endpoints for additive/difference/upfaders-only/latch/grid transitions. Exact reference contour/speed unknown.

### VCAT-05 Auto selection

Load clips with Auto off/on; exercise explicit Next and seeded Random selection at qualifying track loads. Auto retains versus changes selected transition as declared; do not conflate legacy auto-selection with automatic crossfader motion.4.0.10 confirmation open.

### VCAT-06 Reactive inputs

Use silence,bass-only,treble-only,known-BPM and forward/reverse fixtures per deck for any advertised audio/BPM/record-reactive processor. Input dependence follows an explicit original contract. Do not fabricate RGB/CSL/TTM57SL control bindings or equate31 hidden audio-linked names with visible slot catalog.

### VCAT-07 Overlays

Create/save/reload/edit/toggle overlays; four Scroll directions at3 speeds; BPM/Bass Zoom at3 intensities with explicit L/R context. Public documented state lifecycle and target restrictions; no claim of master-only reactive zoom.

### VCAT-08 Reference parity gate

With explicit authorization for later installed-runtime inspection, enumerate current menus and ranges on4.0.10.213 and compare synthetic pixel/timing fixtures. No1:1, full active-catalog, native or physical-output claim before that evidence.

## Remaining gaps

- Actual active menu counts/order/gating, especially localized grid variants and historical TTM57SL categories.
- Raw defaultValue0/128/255 does not establish a UI0..255 range, factory knob position, normalized mapping or meaningful unit.
- Per-effect parameter labels/ranges/enums, threshold curves, audio-reactive inputs, timing response and transfer functions.
- Complete registration of built-in/localized names, unused labels, platform/hardware exclusions and deprecations.
- Current transition endpoints, contour/speed mapping, master-slot processing order and two-source behavior.
- Reference pixels, performance, codecs/HD, physical outputs and Syphon.
- Replacement official PDF content unavailable after CloudFront403.

## Reproducible local provenance

XML source paths, SHA-256 hashes, IDs, raw defaults, source lines and flags are in [video-catalog-evaluation.json](video-catalog-evaluation.json). Binary hashes cover the whole universal Video executable, not the host arm64 slice hash in BINARY_FINDINGS.md.

- `/Applications/Serato DJ Pro.app/Contents/Info.plist` — SHA-256 `128f13364cecee349b684af17b804d42d2e2ec97be80dc044d6ee151283e895b`.
- `/Applications/Serato DJ Pro.app/Contents/MacOS/Serato Video.app/Contents/Info.plist` — SHA-256 `2abb44a462db7fd4d2a3dd614a873d9a4659ac0665f49ec83a21986abea8a13b`.
- `/Applications/Serato DJ Pro.app/Contents/MacOS/Serato Video.app/Contents/Resources/effects/effects.xml` — SHA-256 `6ca84d793deafdc2bf385bf4947ba7de194c111ee67e8554b5363c0fffd09c44`.
- `/Applications/Serato DJ Pro.app/Contents/MacOS/Serato Video.app/Contents/Resources/faders/faders.xml` — SHA-256 `942969ef0787db7805acaeeadb9e9f26c120aa74911432defe36365812f2ae28`.
- `/Applications/Serato DJ Pro.app/Contents/MacOS/Serato Video.app/Contents/Resources/audio_effects/audioeffects.xml` — SHA-256 `d1881739c5a069b0c106a7ec96dcf64bdbe6ef4eaf24937a78c79d7e40b971af`.
- `/Applications/Serato DJ Pro.app/Contents/MacOS/Serato Video.app/Contents/Resources/localization/en.xml` — SHA-256 `1a5a1e541f0de170bf922914bbb16bc97af993ca82ba985e5d735a4533f74338`.
- `/Applications/Serato DJ Pro.app/Contents/MacOS/Serato Video.app/Contents/MacOS/Serato Video` — SHA-256 `90eb3532c8bda98058e0262597672b159ed7c2545d34a1b69b6eb63729be475b`.

Reproduce by reading each Info.plist with plistlib, parsing the three XML manifests with ElementTree, and enumerating name/class/defaultValue/effectType. Read localization/en.xml separately; do not merge its labels into the manifest-declared set. Binary ASCII/RTTI strings may corroborate families only.

Skills applied: use, conducting-research, dec-discovery-validation, dec-quality-testing.
