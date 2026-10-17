# Keylock residual/configuration — independent review

17 October 2026. Skills matched (5): use, adversarial-verify, systematic-debugging, dec-quality-testing, dec-software-principles.

**Confirmed: residual shifted error survives incremental processing and is configuration-sensitive. Refuted: either history-only or dense120/10 is a complete, regression-free pitch fix.** The held-out counts reproduce, but one formerly passing low-tone case fails both interventions. Frozen native006 accuracy remains failed; no production/native/CPU acceptance is awarded.

## Executed preserved-cohort checks

Independently inspected **82 complete stereo raw outputs**: four incremental, six configuration and72 held-out cases. Every raw/plan/module hash, full-output finite test,128-aligned geometry and fixed5–7s frequency/RMS criterion was checked. Used the prior independent global-Hann16× estimator; every parent4× frequency estimate agrees within.001Hz numerical-analysis tolerance, without changing the1Hz gate. All eight new analytic14s source files reconstruct **bit-exactly** from the declared tones, amplitude.14 and phases.17/.53, and their independent measured frequencies match the declared input tones. No failures or raw prefixes/endings were removed.

The held-out Cartesian cohort is exactly2sample rates×4tone pairs×3rate/shift states×3variants=72 unique cases. Independent both-channel/finite/RMS pass counts and failed-case identities match: **baseline13/24, history-only15/24, dense-analysis23/24**. These are24 bounded synthetic tone cases per variant, not musical/native/reference acceptance or product completion percentages.

## Residual and configuration evidence

`scripts/diagnose_keylock_incremental.mjs:32` invokes actual `_process(integerInputFrames,128)` without repeated `_seek`, with cumulative rounded input consumption. Independent rate1.08/+2 left error remains **+1.037735Hz** (parent+1.037739), so insufficient seek history/constant-seek invocation is not a sufficient explanation for the residual. This diagnostic directly consumes from frame0 and does not execute the wrapper's scheduled.25s handoff; the accepted schedule fields do not make it a latency/cursor-equivalent native path. That does not invalidate the steady pure-tone comparison.

With full queried history, original330/550 tones at rate1.08/+2 give:

| Configuration ms | Queried latency | Independent left/right error Hz | Fixed1Hz result |
|---|---:|---:|---|
|120/30|.12s|+1.037750/+.470171|Fail left|
|120/10|.12s|+.401019/+.189195|Pass both|
|240/60|.24s|+.059845/+.462143|Pass both|

These are configuration effects with unchanged source/transpose ratios and no per-tone compensation. They identify sensitivity, not a proved intrinsic transposition algorithm defect or universal best setting. Neutral identity/history evidence remains separate from this residual.

Upstream documents `blockMs`, `intervalMs` and split-computation controls (`prototype/vendor/signalsmith-stretch/UPSTREAM_README.md:57`); actual wrapper configuration passes block/interval into `_configure` (`SignalsmithStretch.mjs:205`). Independent actual-WASM accessor queries confirm44.1k default5292/1323 and dense5292/441 frames,48k default5760/1440 and dense5760/480, all120ms queried latency;240/60 at44.1k is10584/2646 and240ms. Complete required history is block+interval, respectively6615/5733/7200/6240/13230. This validates actual geometry, not guessed milliseconds. Exact saved C++→embedded-WASM build provenance remains the earlier review's limitation.

## Defensible regression counterexample

At44,100Hz, source97/173Hz, rate.75, shift−12, expected48.5/86.5Hz:

| Variant | Left/right error Hz | Fixed1Hz case result |
|---|---:|---|
|Baseline|−.904557/+.665846|Pass|
|History-only|**−1.428716**/+.275431|Fail|
|Dense120/10|**−1.129609**/+.245042|Fail|

Both interventions therefore lose a previously passing case. Aggregate13→15→23 improvement does not establish a strict improvement for every input. Preserve this counterexample in any proposed namespaced history variant's regression/selection evidence; a neutral-only RED/green does not prove shifted non-regression. Parent was notified before this review froze. This does not require promoting dense configuration, nor justify weakening the frequency bound.

## Limits and frozen outputs

120/10 keeps queried algorithmic latency but triples analysis-hop frequency relative to30ms. Native CPU bursts, worker scheduling, long sessions, music and end-to-end latency are unmeasured; serial Node timings cannot establish those. The14s source is sufficient for5–7s at the maximum1.5 rate, but not ten full seconds of active1.5-rate output after scheduling; retained tail zeros must not be called a dropout or silently discarded. No EOS-duration acceptance is claimed.

Executed new inspector: `scripts/inspect_keylock_pitch_configuration_independent.py`, SHA **a4a1e6eacc0e31c3a49613a583c1c661d11806df47d1e1c9700909fcda1b321f**. New immutable results: `docs/research/KEYLOCK_PITCH_CONFIGURATION_INDEPENDENT_RESULTS_20261017.json`, SHA **cbccb625884d3e0b4fd28a412a760770c83a81208a2aa652a200e0e4cce82b06**. All82 rows, all eight input checks, source identities and retained failure lists are present. Only new owned inspector/result/review files were written; no production/shared raw/plans, original006 recordings, UI/native/services/Git or old reviews were changed. A history-allocation implementation and browser/native evaluation remain separate parent-owned work; neither is accepted by these offline observations.

Skills applied: use, adversarial-verify, systematic-debugging, dec-quality-testing, dec-software-principles.
