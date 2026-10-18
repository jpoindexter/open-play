# SCNet mixture-consistent exports — scoped review

18 October 2026. Export conservation improved; separation/listening quality and full Serato parity remain open.

The raw pinned SCNet-large outputs are unchanged. The SCNet worker now defaults to a uniform mixture-consistency projection before writing four Float WAVs: each source receives one quarter of the difference between the input mixture and the sum of estimates. This is the minimum aggregate squared change satisfying the sum constraint before Float32 rounding. It does not determine which instrument owns that residual. The independently written helper processes 65,536-frame scratch blocks; this is not a bound on total worker/model memory.

The projection concept is described in [Wisdom et al., Eq.7](https://arxiv.org/abs/1811.08521). No upstream implementation was copied. SCNet weights, architecture, normalization, windowing and source order are unchanged. Other backends retain raw exports by default. CLI `--mixture-consistency none` keeps raw SCNet output available. Worker manifests retain raw and corrected reconstruction metrics. Standalone cache keys include exact worker and projection source identity; service cache identity also includes both files, preventing old-policy exports from silently reappearing.

## Development evidence

These are the two previously inspected, same-band MUSDB18 excerpts, not new held-out examples. Audio and derived stems remain ignored private research data.

| Excerpt | Raw reconstruction RMS / input RMS | Export RMS / input RMS | Largest per-source SI-SDR decrease |
|---|---:|---:|---:|
| Falcon 69 | 0.0164973 | 2.50888e-8 | none; all four increased slightly |
| SDRNR | 0.0302456 | 2.43336e-8 | drums −0.009695 dB |

Declared development guards before execution: export reconstruction ≤1e-6 and per-source SI-SDR degradation ≤0.1 dB. Both excerpts meet these narrow guards. Seven source scores increased slightly; one fell slightly. SDRNR other remains negative: raw−1.012059dB, export−1.005108dB. The old raw3% reconstruction failure and source-attribution findings are preserved. Passing a sum constraint is not evidence that the model separates instruments well.

Independent residual inspection shows DC accounts for only0.986%/0.0494% of residual power; no DC-only correction was used. The reference stem sum itself differs from the separately AAC-encoded mixture by4.486%/8.464% RMS, so these small-source SI-SDR comparisons need their original codec limitations. No timing alignment, truth-dependent gain/filtering, threshold relaxation or fitting is used in the projection.

## Executed API/default/cache path

One final actual request traversed the existing desktop host18775 API proxy→fresh loopback service8768→pinned CPU SCNet inference→projection→four downloaded Float WAV files. Input299880frames/44100Hz/stereo/6.8seconds; API wall time6.812seconds, including polling and other work, not an isolated performance benchmark. Export reconstruction relative RMS2.433364170882983e-8; manifest preserves raw0.03024555948068662. All source hashes match the tested worker/service/helper. A second identical request returns the same completed job. This proves data/API/export behavior, not native GUI controls, browser audio, physical sockets, latency or perceived quality.

On a separate copy of that export cache, explicit raw mode recomputed under a different key and a subsequent call reused raw output. All four decoded Float32 PCM arrays are bit-identical to the historical raw outputs. The first check incorrectly required container SHA equality: only three header bytes differ in each WAV. That failed expectation is recorded in the raw-cache receipt; application code was not changed to force file identity. Original projected job exports remain immutable. The initial API checkpoint before adding standalone worker-source cache identity has its own receipt/source capsule.

The prior loopback service had no active inference worker; exact PID51915 was stopped and the updated8768 service launched. Completed job files were preserved, but its previous in-memory job IDs are not rehydrated. New preparation requests use the new service. Native0.1.15 main PID95428, ASAR, interface, profile, controller mappings and prepared playback state were not changed. The worker is an external service dependency, not a repackaged native build.

## Evidence and remaining work

- [Development metrics](stem-mixture-consistency-development-results.json)
- [Actual final API job/export/cache](stem-mixture-consistency-api-results.json)
- [Initial API checkpoint](stem-mixture-consistency-initial-api-results.json)
- [Raw cache and sample identity](stem-mixture-consistency-raw-cache-results.json)
- Reproduce the API check with `local-evidence/stems-runtime/venv/bin/python scripts/verify_stem_consistency_export.py local-evidence/stems-runtime/real-fixtures/track2 local-evidence/stem-consistency/new-run` while the existing desktop host and8768 service are running.

Next: broader licensed musical/listening/source-leakage evidence; reference comparison; actual new-export mode-switch playback; longer files/overlap/tails; backend cancellation/failure and resource limits. No raw model quality failure was erased, no full feature accepted, and no trained-model improvement claimed.
