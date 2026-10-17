# Grouped SoundTouch stems independent review — 2026-10-17

Complete retained PCM confirms **independent-source reconstruction0/6 → grouped reconstruction6/6** under the original3percent criterion. That does not establish pitch acceptance: independent recomputation confirms **three of48 separate stem-tone measurements fail1Hz**, leaving4/6 spectral cases. No grouped adapter/native promotion is supported by these captures alone.

## Executed whole-artifact and fixture checks

Ran `SOUNDTOUCH_GROUPED_STEMS_INDEPENDENT_INSPECTOR_20261017.py`. All12 whole ten-channel originals match recorded SHA/size/geometry and are entirely finite:829,056frames/33,162,240bytes per cohort. The initial256 scheduled-silence frames remain present; no output shifts, gain fits, phase fits or raw trimming were applied. Recomputed the exact declared0.5–2.5s channel residuals from processed original versus the sum of four processed stems.

Independent residual RMS ratios reproduce the reports: old independent0/6,1.0373370295–1.6221742452; grouped6/6,2.6837972482e-8–4.4711557208e-8. Nonzero original reference RMS prevents a vacuous all-silent reconstruction result. Both channels in every case retain the same3percent bound.

Independently regenerated the declared4second fixtures in Node: all ten input channel hashes per rate match both reports. The four stems have distinct197/311/463/719Hz left and257/383/593/887Hz right components, amplitude.025 and declared per-stem phases; the original is the Float32 cast of their samplewise sum. The actual generation matches `scripts/test_soundtouch_stem_reconstruction.mjs:7`. These are complementary synthetic inputs, not separation-model outputs or identical stem clones.

## Separate pitch failures retained

Recomputed every isolated-stem channel’s global20–20000Hz Hann peak with>=16×padding/log-parabolic interpolation; expected tone was not used to restrict search. All48 estimates reproduce the separate spectral report. Exactly these failures remain:

| State / rate | Stem index / channel | Expected | Observed | Signed error |
|---|---|---:|---:|---:|
| Tempo1.08 /44.1k | 3 /right | 887Hz | 885.795885Hz | -1.204115Hz |
| Tempo1.08 /48k | 1 /right | 383Hz | 384.313794Hz | +1.313794Hz |
| Tempo1.08 /48k | 2 /right | 593Hz | 594.547358Hz | +1.547358Hz |

The spectral plan was declared before analysis of already retained captures, not before those captures. It remains an additional independent acceptance dimension; it does not rewrite the earlier6/6 recombination result. Recombination can remain excellent while every component shares a pitch/timing error, so coherence alone cannot establish sonic fidelity.

## Guide ownership, boundaries and controlled cleanup

`grouped-pull-transport.mjs:149–156` creates a fresh guide per epoch and prepares the original stereo pair first. `shared-overlap-guide.mjs:8–16` wraps each instance’s overlap-decision method, bounds pending decisions, verifies DSP geometry before follower consumption and prunes only decisions consumed by all live participants. The six actual snapshots show five registered readers,30/33 produced decisions,120/132 follower consumptions, matching reader ordinals, queue0 and peak queue1.

Separate controlled execution of the actual grouped transport verifies all five per-instance methods are overridden while active and restored on disposal, all guide readers marked disposed, queue0, sourceBytes0 and epochs empty. Controlled lag-capacity and follower-geometry counterexamples both reject SharedOverlapError; queue clears after reader disposal. `grouped-pull-transport.mjs:90–93,195–199,256–264` owns these retirement paths. This is a bounded stereo5-source check, not exhaustive1–8channel, queue-race, OOM or native-heap coverage.

Upstream files need not be edited to change the processing algorithm: this variant deliberately replaces followers’ independent correlation searches with the original pair’s decisions (`shared-overlap-guide.mjs:9–12`). “Upstream files unchanged” is defensible; “runtime DSP decision algorithm unchanged” would be misleading. No new functional fault was reproduced within the tested shared-guide ownership path, beyond the retained pitch failures.

## Source identity and remaining limits

Both original result files record only their top-level transport SHA. They do not freeze/hash the dependency graph or guide bytes at execution. Current transport hashes match those reports; current guide was independently read/hashed and controlled-tested, but its exact historical run-time bytes cannot be established from the initial report alone. Any future cohort needs a before-run complete source manifest/snapshots; a later hash must not be retroactively called pre-run evidence.

Current grouped transport `eff5ab62fbcb1038623e0fc17d39cfa31843fde331f0c5d2885388d205172682`; current guide `c2b0a4169b40e3b3a2763562940b499ad4b84df009ab53149ebc194ab79e668b`. Original RED report `d8d24fd85d53c1bee25922ed1bd21e7a3070172a76df878bbdbf0f1dd85a43c0`; grouped report `9d4d43547b3b97baf6e8e2372d07f5753b88c73b7992788ff8066faa6afc507c`; separate spectral report `bef2aa8cfa812730d0cfcc0a359c5cd7fcf5a8c9c16e5505d61253e5d66cdc3a`.

No browser/native/app routing, real stems/music, physical outputs, exact source cursor, latency, long-session stability or reference sonic parity was executed here. The serial variant is separate from native017’s independent-node evidence; no fix is transferred to that build and no earlier failure is erased.

Independent inspector SHA `869ccc6abc00837ad0d1d1f4523c208405b15890e6c4517147852676938273b0`; independent result `SOUNDTOUCH_GROUPED_STEMS_INDEPENDENT_RESULTS_20261017.json` SHA `25a7c79d25549240b8be94c7146231cf8c71ebc39461c1c11f7909c6b9879477`.

Skills applied: use, adversarial-verify, systematic-debugging, dec-quality-testing, dec-software-principles.
