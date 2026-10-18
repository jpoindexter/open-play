# Rejected SCNet time-shift averaging experiment

Plan116, 18October2026. No production inference/model/default change.

The [official pinned SCNet apply code](https://github.com/starrytong/SCNet/blob/5d95bf96b19c3eede63248d171efeca8e3abb948/scnet/apply.py) supports averaging inverse time-shifted predictions. An independently written experiment tested a deterministic0/0.25/0.5s leading-pad ensemble with the existing pinned official large weights. It crops only known padding, keeps normalization/source order fixed, and applies the same uniform mixture projection to baseline and candidate. No truth-dependent alignment, gain fitting, offset search, weight training or selection by score.

Declared development guards before execution: mean SI-SDR improvement at least0.2dB on each track, no source worse by more than0.1dB, corrected reconstruction relative RMS≤1e-6. These two same-band6.8s CC BY-NC-SA previews were already inspected; they are development examples, not a fresh held-out cohort or listening comparison. Other inspected test-preview entries in the local source table have restricted terms; no new repertoire was adopted or redistributed in this experiment.

| Existing excerpt | Mean change dB | Drums | Bass | Other | Vocals |
|---|---:|---:|---:|---:|---:|
| Falcon69 | -0.214894 | +0.072883 | +0.211562 | -0.334596 | -0.809423 |
| SDRNR | +0.162219 | +0.486251 | +0.213537 | -0.058513 | +0.007601 |

**Reject promotion.** Both tracks fail the declared mean-improvement guard, and Falcon69 also exceeds source-degradation limits. Sum conservation still holds, but it cannot establish source attribution. The negative-other and broader musical-quality problems remain open; a published technique is not automatically an improvement on these inputs. No threshold was relaxed and no losing source was omitted.

Each0offset reuses the hash-verified historical raw output; two actual new CPU predictions per track use four threads. The experiment's timing fields describe those additional views, not total cost of a fresh ensemble or a benchmark. Exact [safe metric receipt](stem-shift-development-results.json), code experiments/scnet_shift_evaluation.py. Raw predictions/audio/exact source are ignored under local-evidence/stem-shift-evaluation/initial. Current worker/service inference and desktop default remain SCNet-large with the existing mixture projection. No new dependencies/models or remote audio transfers.

Next quality work remains broader permitted independent musical/listening/source-leakage evidence or a separately licensed/evaluated stronger model. This experiment closes a hypothesis, not the separation-quality gap or full Serato parity.
