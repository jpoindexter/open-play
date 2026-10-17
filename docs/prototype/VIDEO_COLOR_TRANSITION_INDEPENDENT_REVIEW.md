# Independent review: color FX and transition corrections

2026-10-17. Scoped adversarial review of the then-uncommitted Gamma, Saturation, Smudge and UV Paint cohort, plus Scratch Fade, Grid Simple/Fade/Sequence, Box Both and Tile Wave H/V. Production files were read only. No browser, native app, Git mutation or remote write was performed by this reviewer. The parent owns actual GPU and assembled-interface acceptance.

**Confirmed production bugs: 0.** The specific failure hypotheses below were refuted by current source and executed pure checks. This is a bounded review conclusion, not a claim that all Serato parity gaps are closed or that unexecuted browser checks passed.

## Criterion and source boundary

The FX criterion is the independently chosen contract in [VIDEO_NEXT_FX_CORRECTIONS.md](../research/VIDEO_NEXT_FX_CORRECTIONS.md), including explicit earlier-Open-Play restoration. The transition criterion is the narrow historical meaning in [VIDEO_MANUAL_FX_CROSSWALK.md](../research/VIDEO_MANUAL_FX_CROSSWALK.md), together with the current declared traversal, ordering, endpoint-band and additive policies. The locally recovered official manual was read directly for printed pages 20–21. Its 2015 edition gives semantic direction/count/class evidence; it supplies no measured current Serato 4.0.10 shader, curve, threshold, traversal event or alpha contract.

The parent's unfinished video-crossfade/core controls are excluded. Isolator Bass, finite Frame Freeze, eight-band Analyzer and other unresolved crosswalk rows are also outside this correction review. Their existence is not refuted by this report.

## Findings submitted and verdicts

| Failure hypothesis | Verdict and exact evidence | Practical action |
|---|---|---|
| Old Gamma below 1, Smudge angles, UV appearance, OFF/zero or Saturation target zero silently acquire corrected fresh behavior. | **Refuted.** `prototype/video-state.js:40` rebuilds only declared own scalar fields; `:50` inserts Earlier Open Play only at restore when the saved marker is absent; `:52` restores missing old Saturation to 0. `prototype/video-effects-state.js:88`, `:92`, `:93` route distinct branches, preserving angle/gamma bounds. `prototype/video-effects-shaders.js:132`, `:146`, `:151` retain earlier formulas. An additional reviewer-run restore → JSON snapshot → restore check preserved Gamma .1/OFF/amount 0, Smudge -360°, Saturation 0, and consumed zero accessor reads. | No source fix. Keep actual legacy-render GPU evidence separate from corrected fresh behavior. |
| Fresh Gamma still brightens, Saturation still desaturates, or UV still adds cyan boundary glow. | **Refuted at code path / parameter level.** `prototype/video-effects-state.js:91` defaults saturation to 2. Shader `:144` uses the unchanged chroma formula; `:146` uses a direct exponent >=1 for Manual Meaning while the reciprocal expression is confined to legacy. Shader `:152`–`:153` uses a colorfulness smooth gate and saturated hue; the edge glow is confined to the preceding legacy branch. Fresh direct normalized Gamma/Smudge/UV specs were independently checked to carry Manual Meaning. | No source fix. Pixel thresholds and partial alpha require the parent's actual shader run; this reviewer did not execute those pixels. |
| Corrected Smudge follows a single global angle, stretches rays on rectangular output or darkens partial-alpha trails by averaging straight RGB. | **Refuted at code path.** Shader `:136` normalizes the center ray in output-pixel coordinates; `:137` averages nine premultiplied outward samples, clamped to source texel-center coordinates; `:138` performs premultiplied blending and leaves the center beyond the edge mask unchanged. The old global-angle sampler remains only `:133`–`:134`. Shared `blend`/`straight` helpers are `prototype/video-effects-shaders.js:36`–`:38`; final encoding preserves the resulting alpha. | No source fix. Rectangular, corner-marker and partial-alpha GPU fixtures remain the acceptance evidence, not this mathematical trace alone. |
| Grid corrections still use the old 20/24/16-cell geometries; Grid Sequence silently reorders on interior reversal or duplicate frame IDs. | **Refuted.** Grid Simple is 3×3 in `prototype/video-transitions-kernel.js:146`–`:149`; Grid Fade/Sequence are 3×3 in `:157`–`:165`. The seeded nine-cell permutation is inverted to rank, so the public order is cell IDs rather than accidentally used as ranks. `prototype/video-transitions-state.js:28`–`:38` renews only on declared observed endpoint departures. Independent same-frame spot checks yielded cycles 0/1/2 across departures and retained the exact order object through interior reversal. | No source fix. This proves the chosen event policy, not Serato's unknown renewal policy. |
| Box Both still combines H/V scaling, Tile Wave still has nonmonotonic two-dimensional delays, or Scratch Fade still captures departing pixels. | **Refuted.** `prototype/video-transitions.js:159` dispatches Box Both directly to exact Box H or V kernels, using alternating cycle parity. `prototype/video-transitions-kernel.js:110`–`:119` assigns H delay by column alone and V by row alone, with monotonic progress. `prototype/video-transitions-state.js:40`–`:44` declares live Scratch Fade endpoint gates and never requests capture; shader `:74` mixes current premultiplied upfaded inputs. `prototype/video-transitions.js:154` uploads both current sources each render. | No source fix. Preserve the explicit independent 5%/95%, additive and traversal labels until current reference behavior is observed. |

Findings submitted: 5. Confirmed production bugs: 0. Refuted: 5. Review status: complete for these hypotheses and this source snapshot.

## Executed checks and limits

- `node scripts/test_video_effects.mjs`: **20/20**, exit 0. Catalog, uniforms, declared migration-related modes, clock/history planning and static dispatch; no WebGL compilation or pixel output.
- `node scripts/test_video_transitions.mjs`: **13/13**, exit 0. Pure live-cut/traversal/reset/order planning; no actual video textures or pixel output.
- `node scripts/test_video_state.mjs`: **24/24**, exit 0. Pure metadata, accessor/inherited-value protections and migration; the count includes two parent crossfade metadata checks whose broader feature implementation was not audited here.
- Additional inline Node assertions: accessor execution count **0**; old OFF/zero/bounds retained; metadata JSON round trip exactly idempotent; fresh Gamma/Smudge/UV Manual Meaning defaults present; Box Both/Grid Sequence cycles **[0,1,2]** across same-frame control departures, with reversal preserving the order.

No browser suite was run by this reviewer. Passing these checks does not establish actual 81-case FX or 65-case transition browser acceptance, performance, source-codec coverage, hardware control, exact installed-reference appearance or full parity. Existing harness pixel tests were read to assess what they intend to cover, not counted as executed results.

## Source snapshot

SHA256 at review. These hashes pin production inputs; parent changes after this snapshot require proportionate review rather than reusing this conclusion for different code.

| File | SHA256 |
|---|---|
| `prototype/video-effects-catalog.js` | `344ccf65c9d836d9fe97cfba3c9de90ecd3d9a65264b23a18bb4d5af4b9ea231` |
| `prototype/video-effects-state.js` | `2e807a53adec83beac7e19e6a61bfb1685c176c732e94215e3c3d6b322b2c725` |
| `prototype/video-effects-shaders.js` | `1c3343995cafe3fc3c6745c19e1e980ca433d8792f9115bdad3f448c4a0e742e` |
| `prototype/video-state.js` | `269587c7df19dfa5e3fe431657866f3dfa2c2afb6914bce3358d6304c4068d44` |
| `prototype/video-transitions-state.js` | `01eb5536f9f0242a69f665f8a892e47d239c52d9774b6ad7b2919c1eb93998cf` |
| `prototype/video-transitions-kernel.js` | `f247e3f3b7cda1b72014910ad36f0eed3df4a6e3834be7a21e92c4ed5d39f955` |
| `prototype/video-transitions.js` | `6c3503c71079ceaf09e5206749cc2ea6106760638b9d96520400e318ebbcf85b` |

Skills applied: adversarial-verify, dec-quality-testing. Review criterion: preserve actual saved appearance explicitly, meet the named independently specified corrections, and keep source/pure/browser/vendor proof scopes separate.
