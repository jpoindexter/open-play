# Independent review: spectrum8 and Analyzer integration

2026-10-17. Scoped adversarial review of eight-band spectral analysis, AudioEngine fallback/taps, normalized FX context, Analyzer shader/uniform/diagnostic path, pipeline/core aggregation and legacy metadata. Production files were read only. The reviewer added [test_video_spectrum_analyzer_independent_review.mjs](../../scripts/test_video_spectrum_analyzer_independent_review.mjs). No browser, native application, Git or remote operations were performed.

**One concrete integration defect was reproduced and fixed by the parent.** The own-data context boundary initially executed an enumerable spectrum getter before normalization. The desired-state controlled regression now passes **8/8**, including actual pipeline + actual FX diagnostic/uniform calls. No remaining defended production defect survives this scoped review. Real GPU acceptance of the new getter case is a separate parent check.

## Confirmed initial defect and resolution

The direct FX normalizer correctly used an own property descriptor for `spectrum8`. Initially the pipeline constructed channel and master contexts with object spread first, so an enumerable accessor ran before that normalizer could omit it. The initial actual-pipeline controlled reproduction observed:

```json
{
  "calls": 1,
  "error": "spectrum getter executed before normalization"
}
```

That was a pipeline input-contract failure. It was not demonstrated as an ordinary AudioEngine failure or an exploitation finding: current engine taps return ordinary own scalar/array data.

The parent added `contextData()` at `prototype/video-pipeline.js:8`–`:12`, carrying own data descriptors only, then applied it to the root context, nested channel array/records and master before context spreads (`:40`–`:57`). Accessors are omitted, allowing the actual FX normalizer to report unavailable and bypass instead of executing a getter.

The independent desired-state regression executes the **actual pipeline and actual FX renderer control code**, substituting no-op WebGL and identity overlay/link/transition collaborators. It now records **accessorsCalled:0** for channel/master spectrum getters, root `channels`/`master` getters, a channel-array index getter, inherited vectors and a vector-element getter. Actual per-target FX diagnostics report `spectrum8-unavailable` and `sourceBypass:true` where appropriate. This is executed normalization/diagnostic/uniform ownership evidence; it is not shader compilation or actual pixel bypass.

## Other hypotheses tested or refuted

| Hypothesis | Verdict / evidence |
|---|---|
| Eight values are fabricated by repeating three coarse bands. | **Refuted.** `prototype/video-analysis.js:35`–`:47` sums actual FFT-bin power independently for eight declared half-open ranges, clips at Nyquist and returns zero for empty ranges. `normalizeVideoContext()` at `prototype/video-effects-state.js:5`–`:10` reads only the own spectrum vector and never constructs one from bass/mid/treble. Independent assembled test with coarse bands alone remains missing/bypassed. |
| A malformed vector can trigger coercion/getters or silently become valid silence. | **Refuted after pipeline fix.** `prototype/video-analysis.js:22`–`:33` requires exactly eight own finite number data entries in [0,1] and returns a detached copy; it rejects sparse/accessor/inherited/nonfinite/out-of-range data. A valid eight-zero vector stays available. Getter rejection was exercised through the actual assembled control boundary, not only the helper. |
| Missing input is drawn as an invented three-bar/eight-bar signal or silently treated as silence. | **Refuted at source/control level.** `prototype/video-effects.js:161`–`:162` records the unavailable reason only for enabled positive-amount Manual Meaning Analyzer. Shader `prototype/video-effects-shaders.js:188`–`:190` changes RGB only when the corresponding availability uniform is true; missing data leaves the source unchanged. Valid zero data enters the new branch and draws black RGB while preserving source alpha. The internal zero upload for a missing vector is guarded by availability; it is not exposed as available data. Actual pixel identity is parent-owned evidence. |
| Values are reordered between left/right/master or shader array upload. | **Refuted in executed controlled integration.** The actual FX call at `prototype/video-effects.js:93` uploads all eight values unchanged. The independent test passed three asymmetric vectors through actual pipeline targets and observed exact ordered values in each target's `spectrum8[0]` uniform call; each target's availability/diagnostics stayed separate. |
| Analyzer destroys source alpha or changes processing order. | **No supporting source finding.** The new branch writes `z.rgb` only and retains the initial source alpha, then uses existing output encoding at shader `:194`. Channel → overlay → transition → master ordering remains explicit in the pipeline. This source trace does not replace the parent's partial-alpha and target-ownership GPU cases. |
| Old saved Analyzer records silently adopt the eight-band algorithm. | **Refuted.** The restore-only behavior migration inserts Earlier Open Play when an old record lacks a marker; repeated snapshot/restore retains it. The independent assembled test observed the old-mode uniform flag with no missing-eight-vector warning, even without spectrum8. The shader has a distinct earlier three-band branch. Source/runtime vectors remain absent from persisted parameter metadata. |
| Uninitialized, suspended, missing-index or disposed analysis fabricates available zero data. | **Refuted.** Engine fallback `prototype/engine.js:632` and tap read guard `prototype/video-analysis.js:62`–`:63` return null/false unavailable. The actual uninitialized AudioEngine was independently invoked and left `ctx:null`. Existing controlled tap tests also execute suspended/missing-index/disposed paths. Running valid silence is intentionally available, distinct from these states. |

The pipeline aggregates all three actual effect diagnostics at `prototype/video-pipeline.js:82`–`:84`. Core `prototype/video.js` reads those target/slot reasons and appends explicit “eight-band audio unavailable; Analyzer bypassed” status text. Target diagnostics were executed in the controlled pipeline test; the actual main-interface status text was source-inspected, not browser-observed by this reviewer.

## Reviewer-executed checks

- `node scripts/test_video_spectrum_analyzer_independent_review.mjs`: **8/8**, exit 0; actual pipeline + actual FX input/uniform/diagnostic flow with controlled no-op WebGL, plus actual uninitialized AudioEngine fallback. **No actual shader pixels or real audio FFT.**
- `node scripts/test_video_analysis.mjs`: **9/9**, exit 0, plus its earlier direct three-band assertions. Hardcoded isolated-bin ownership, exact boundaries, clipping, power arithmetic, own-vector rejection and controlled tap graph lifecycle. **No real AudioContext execution.**
- `node scripts/test_video_effects.mjs`: **28/28**, exit 0. Catalog, normalization/uniforms and state planning; **not GPU acceptance**.
- `node scripts/test_video_state.mjs`: **26/26**, exit 0. Scalar/legacy metadata; **not browser storage/reload**.

## Assessment of actual-tone and pixel acceptance criteria

The parent-owned [video-spectrum8-browser-results.json](video-spectrum8-browser-results.json) was inspected: **17/17, 0 failed**, actual sample rate **48000**, FFT **2048**, eight independently played bin-centered original PCM tones. The saved source of each tone, full vectors, RMS observations and fixed FFT apertures are retained. This reviewer read the artifact and harness, but did not execute that browser run.

The tone acceptance is substantive rather than “some signal exists”: the intended band must be the peak, at least **1.5× every other band** and at least **65% of total measured band power**. These leakage bounds are explicit independent criteria; the lowest tone at 46.875Hz actually records about **1.93054× / 78.8449%**, rather than claiming zero neighbor leakage. The expected pre-EQ RMS comes from the known injected .15 PCM amplitude (`.15 / sqrt(2)`), not from copying the measured result into its expected value. Fixed-bin/boundary pure cases complement the adaptive bin-centered fixture; a green adaptive fixture alone would not pin the intended frequency edges.

The same artifact includes distinct two-deck ownership, unused-deck silence, pre-EQ versus post-master gain/mute behavior, query noninterference using equal fixed RMS windows, pause, suspended/resumed context and disposal. Those checks do not prove native hardware audio, arbitrary decoded content, all sample rates or sustained performance.

The pre-accessor-fix [video-analyzer8-browser-results.json](video-analyzer8-browser-results.json) was inspected: **102 entries, all status pass**. Its source includes independent unit-vector columns, numeric hue/gain/amount and partial alpha, missing versus zero diagnostics, earlier rendering, per-target pipeline vectors, actual eight PCM tones reaching measured GPU bar heights (±1 pixel), and fixed-window post-master RMS noninterference. Expected bar heights derive from the raw measured vector and declared gain/height contract, with an additional visible intended-column dominance check; they are not justified by a generic nonzero/different-image comparison.

That 102-case run preceded the pipeline descriptor-copy fix, so it does **not** establish pixel acceptance of the getter resolution. The parent owns the new actual-GPU getter test and affected pipeline regression. Do not relabel the no-op controlled GL test as a pixel run. Exact Serato spectral bands, hue, gain curve and visual equivalence remain unmeasured.

## Source snapshot after resolution

| File | SHA256 |
|---|---|
| `prototype/video-analysis.js` | `7a9def40c83401edc5c788acdb7373dc941fa323d41c815f94f24ca1c3b79583` |
| `prototype/engine.js` | `7ac2a824b3bc95e055ca90e2ac66af6f4d7a6ba84742b139146417579d94e60b` |
| `prototype/video-effects-state.js` | `4dd9d8e1557ecaaed83a75b2f692e2281180bb1c91e1479b414646fdb1283e5c` |
| `prototype/video-effects-shaders.js` | `edd8f52428b3a23cddf4f3aa7ed040a52cf389ad2bddac1122bf008d0811c7d8` |
| `prototype/video-effects.js` | `ca9ab02fdc333065402c815b64103e00fcea2ca245d53e00100b4076d564f646` |
| `prototype/video-effects-catalog.js` | `d0baa2808028c7ad2130a3ca2ba27a533a88c45baf4092648f3070334e188c5d` |
| `prototype/video-pipeline.js` | `75507c6ca5c84b45ac485be55e6fb0060e5f809be9caa7f416dc32d920796725` |
| `prototype/video.js` | `609f6c817a351973d157b17a7799abbe1f1071173412007baa80cf09ce4cfa6a` |
| `prototype/video-state.js` | `fb7986288f7e93a898987f93b2fe7dd95b50d201a55a4943f90682665b923dbf` |
| `prototype/video-spectrum8-harness.js` | `e975164c1d593d36ad8e5ab90d6518c8a8f6c578daecd560c21d91f80304c510` |
| `scripts/test_video_spectrum_analyzer_independent_review.mjs` | `7959a91eefde76688aabe50b2dfa6d631ede8213c8394a25c48974ddfb863269` |

Scoped review complete: one confirmed input-boundary defect fixed by parent and independently rechecked at controlled integration level; no remaining defended production findings. Parent post-fix browser proof remains separate. Reviewer-owned files are frozen.

Skills applied: adversarial-verify, dec-quality-testing.
