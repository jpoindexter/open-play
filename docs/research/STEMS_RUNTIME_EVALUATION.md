# Actual local four-source separation evaluation

Date: 2026-10-16. Scope: HTML-prototype preparation worker, not a native application. Status: HTDemucs and Spleeter inference executed; browser integration is a separate acceptance path. SCNet-large is now the recommended prototype default; Spleeter remains an explicit alternative and HTDemucs a research comparator.

## Executed baseline

`scripts/stem_worker.py` runs actual HTDemucs learned source separation. It does not substitute frequency bands, duplicate the original four times, or mute fake source labels. It produces sample-aligned stereo float WAVs for drums, bass, other and vocals. The UI may call `other` melody, but this is the model's residual accompaniment category, not proof of Serato's exact taxonomy or model.

Runtime is isolated under ignored `local-evidence/stems-runtime/venv`: Python 3.11.13 arm64, Demucs 4.1.0, PyTorch 2.5.1, SoundFile 0.13.1. CPU inference uses four threads. The machine reports 12 physical cores and 48 GiB memory; MPS is available but was not used or benchmarked. Dependencies came from PyPI; no global environment or native application changed. The full installed dependency snapshot is `local-evidence/stems-runtime/requirements.lock.txt`.

The maintained author's [Demucs repository](https://github.com/adefossez/demucs) released 4.1.0 on 2026-07-11, adding lighter dependencies and official safetensors model hosting. This supersedes the older assumption that only the archived Meta repository/runtime is available.

## Exact checkpoint and permission boundary

| Field | Value |
|---|---|
| Architecture / model | HTDemucs / `955717e8` |
| Official author repository | `adefossez/HTDemucs` on Hugging Face |
| Revision | `cbc8a9b1a87023b7fd74e7b3412e6321c0eab003` |
| File | `955717e8.safetensors` |
| Size | 84,025,440 bytes |
| SHA-256 | `d9fa14133cfcc034a6758923bb3a8ca9f8dfd0b582134643bbf83f72c17576dd` |
| Download | [Pinned official weight](https://huggingface.co/adefossez/HTDemucs/resolve/cbc8a9b1a87023b7fd74e7b3412e6321c0eab003/955717e8.safetensors) |
| Code license | [MIT](https://github.com/adefossez/demucs/blob/main/LICENSE) |
| Weight distribution status | Research evaluation only; unrestricted redistribution is not established |

The official [model card history](https://huggingface.co/adefossez/HTDemucs/commits/main/README.md) removed the license field on 2026-08-31. More decisively, the author states in [Demucs issue 327](https://github.com/facebookresearch/demucs/issues/327) that pretrained weights are outside the MIT code license and supplied for scientific purposes. Do not label the checkpoint MIT, ship it as an unrestricted product default, or infer that a third-party mirror's label overrides the author. This is an evaluation dependency, kept outside Git. No model or audio was uploaded.

The worker verifies the complete SHA-256 and expected model class before loading. It makes no network requests or automatic downloads during preparation. Its only supported checkpoint is the pinned one; passing an arbitrary checkpoint path does not bypass verification.

## Runnable interface

From repository root:

```sh
local-evidence/stems-runtime/venv/bin/python scripts/stem_worker.py \
  local-evidence/stems-runtime/fixture/original-generated-mixture.wav \
  local-evidence/stems-runtime/output \
  --status local-evidence/stems-runtime/status.json
```

Arguments are input audio path, output directory, optional `--status`, `--model`, `--segment` (1–7.8 seconds), `--threads` (1–12), and `--max-seconds` (default 1800). These are preparation resource bounds, not paid features. FFmpeg decodes locally to stereo 44.1 kHz; the duration bound rejects longer input rather than silently truncating it. The default 7.8-second analysis windows overlap by 25%, and random shifts are disabled for deterministic evaluation.

Stdout contains one final JSON manifest or failure object. An optional status JSON is atomically replaced at model loading, decoding, each inference segment, writing and completion. Each source uses float WAV without independent gain normalization. A content/model/parameter hash identifies the cache; every output hash is verified on reuse. A completed manifest is written last. The caller owns job queueing, cancellation via process termination, orphan cleanup, and serving only validated output files. It must not expose arbitrary filesystem paths or the model directory over HTTP.

Output: `drums.wav`, `bass.wav`, `other.wav`, `vocals.wav`, `manifest.json`. All four files have the same sample rate, frame count, and timeline origin. A browser should load all four, schedule their sources against one common AudioContext time, and use separate gain controls for mute/isolation; it must avoid a playing-deck time jump when switching from original to prepared sources.

## Executed evidence

An original, deterministically generated 12-second mixture combines synthesized drums, changing bass, chord tones, and a formant-like harmonic voice. Its four original components are retained for measurement. No proprietary song or Serato audio was used. Generator: `local-evidence/stems-runtime/generate_fixture.py`. Input SHA-256: `47af705a4d644f0c53717bc1e64f6cd94bb588613d3ab0e85dd6e19992ccbc7e`.

| Measurement | Observed |
|---|---:|
| Output per source | 529,200 frames, stereo, 44,100 Hz |
| Model load | 1.266 s |
| Inference | 5.254 s |
| Total worker | 6.622 s |
| Inference / audio duration | 0.438 |
| Reconstruction RMS error | 0.002182 |
| Reconstruction error / mixture RMS | 2.257% |
| Synthetic SI-SDR, drums / bass / other / vocals | 14.13 / 21.23 / 18.32 / 25.66 dB |

These SI-SDR values describe this one generated fixture, not a published music benchmark. They neither rank models across genres nor establish live separation or Serato equivalence. Whole-track preparation remains the intended interaction.

Verification script `local-evidence/stems-runtime/verify.py` executed 10/10 checks: expected source files; frame/channel alignment; finite nonzero data; six pairwise nonidentity comparisons; no source equals the original mixture; relative reconstruction RMS below 3%; removing each source changes reconstruction; cache reuse; missing model rejection; and duration limit enforcement even after a cache exists. The duration/cache test exposed a bypass and the worker was corrected before the passing rerun. Raw report: `local-evidence/stems-runtime/verification.json`. An additional `test_failures.py` executed 3/3 checks: malformed audio rejection, mono 22.05 kHz input becoming aligned stereo 44.1 kHz sources, and cancellation leaving no completed manifest. Total: 13/13 executed checks. These checks do not prove speaker output, browser stem synchronization, listening quality, provider support, or native performance.

## Distribution candidate under evaluation

[Spleeter's author-written JOSS paper](https://joss.theoj.org/papers/10.21105/joss.02154.pdf), page 3, explicitly applies MIT to its source and pretrained models. This is stronger checkpoint licensing evidence than the HTDemucs code license. The official [Spleeter repository](https://github.com/deezer/spleeter) provides four-source release weights. A September 2026 [clarification issue](https://github.com/deezer/spleeter/issues/959) remains unanswered because the shorter repository README only names code. Record both the explicit paper statement and the unresolved request; do not substitute third-party claims.

Spleeter is a candidate for a permissive default; it is not assumed equal in quality to HTDemucs or Serato. Runtime evaluation uses a separate `spleeter-venv`, so it cannot alter the working HTDemucs baseline. Executed results follow below.

## Remaining acceptance

- Actual browser import → queue/progress → four-stem loading → audible individual mute/isolation → seek/loop/reverse/keylock integration → cache removal and regeneration.
- Rights-cleared musical corpus and listening comparisons with leakage, phase, transient and reconstruction tests across genres.
- Peak memory, long input, queue cancellation, malformed audio, disk full, stale cache and concurrent 2/4-deck playback stress.
- Model redistribution decision and complete dependency notices before packaging.
- Physical controller stem pads and waveform rendering bound to actual source amplitudes.
- Native application remains unstarted until prototype approval.

## Spleeter fallback executed and selected for prototype preparation

The alternative is now executable with the same worker and manifest contract:

```sh
local-evidence/stems-runtime/spleeter-venv/bin/python scripts/stem_worker.py \
  local-evidence/stems-runtime/fixture/original-generated-mixture.wav \
  local-evidence/stems-runtime/spleeter-worker-output \
  --backend spleeter --status local-evidence/stems-runtime/spleeter-status.json
```

The server should select this explicit backend and interpreter for its default; the worker's default argument remains `htdemucs` only to preserve earlier CLI invocation compatibility. There is no silent fallback between models. Missing dependencies or model files return a failed job.

- Official archive: [Deezer Spleeter v1.4.0 four-source weights](https://github.com/deezer/spleeter/releases/download/v1.4.0/4stems.tar.gz), 146,308,147 bytes, SHA-256 `3adb4a50ad4eb18c7c4d65fcf4cf2367a07d48408a5eb7d03cd20067429dfaa8`.
- Only four named regular checkpoint files were extracted; the archive's AppleDouble metadata file was excluded. Each extracted file's SHA-256 is pinned and verified by the worker before loading.
- Isolated runtime: Python 3.11 arm64, Spleeter 2.4.2, `tensorflow-macos` 2.12.0, TensorFlow I/O filesystem 0.34.0. Stock Spleeter pins TensorFlow 2.12.1 and filesystem 0.32.0; the latter has no compatible wheel on this machine. This is a tested local compatibility override, not an unchanged official dependency installation. Full snapshot: `local-evidence/stems-runtime/spleeter-requirements.lock.txt`.
- First TensorFlow import took 62.99 seconds on this machine. A fresh second worker process loaded in 2.432 seconds and inferred in 2.709 seconds, total 5.230 seconds for 12 seconds of audio. UI must handle a long first load without inventing progress.
- Spleeter preparation uses 30-second windows with 1-second overlapping linear crossfades. Each model result is genuine neural inference; window blending manages preparation memory and discontinuities. It is not sample-exact equivalence with running a whole track through Spleeter once.
- Every output is stereo 44.1 kHz, 529,200 frames for the 12-second input. RMS: drums 0.06015, bass 0.0001565, other 0.02973, vocals 0.06656. Weak bass extraction on this synthetic fixture is an observed limitation, not hidden behind a green functionality test.
- Reconstruction relative RMS is 5.291%, compared with 2.257% for HTDemucs on this fixture. **Spleeter fails the same 3% reconstruction criterion used for the baseline.** Its standard model also limits modeled frequency bands; do not call this lossless separation or infer that enabling all stems exactly recreates the original.

Decision: use the Spleeter path for actual browser preparation with the explicit author-paper MIT grant recorded, keep HTDemucs as a research comparator, and preserve source-model identity in every cache and UI job. This selection is about a usable permissive baseline, not a claim that Spleeter is the best model or reaches Serato quality. A listening/quality upgrade remains open and must retain a compatible checkpoint grant.


Spleeter's equivalent ten checks passed 9/10; the reconstruction-quality threshold failed. Per-source synthetic SI-SDR was drums −5.91 dB, bass −22.54 dB, other 6.49 dB, vocals 20.63 dB. This fixture exposes wrong source assignment for synthesized low-frequency content. Keep this failing quality evidence visible when evaluating production readiness. See `local-evidence/stems-runtime/spleeter-verification.json`.

A 36-second fixture (three repeats of the original mixture) exercised two preparation windows and their overlap. It produced 1,587,600 aligned frames per source, with 5.720 seconds inference and 7.717 seconds total. This is a window-boundary/functionality check, not a long live-session stress test. Raw evidence: `local-evidence/stems-runtime/spleeter-long.json`.

For normal all-stems-enabled playback, keep the original mixture so preparation does not silently discard energy. Isolated/muted playback may use model sources. Any future mixture-consistency residual correction must be explicit and separately measured; the current worker does not hide errors by replacing sources or filling them with copies of the original.

Spleeter also passed the same three error/shape lifecycle checks: malformed input rejection, mono 22.05 kHz resampling, and cancellation without a completion manifest. Its aggregate is **12/13 checks passed, with one quality failure retained**. HTDemucs remained 13/13 on its original fixture/checks after backend integration. No browser or speaker-output claim is included in these worker totals.

## Recreate isolated environments

The following pins reproduce the tested top-level runtime choices; inspect the local lock snapshots before a distributable package is designed. Do not replace an existing working environment in place.

```sh
python3 -m venv local-evidence/stems-runtime/venv
local-evidence/stems-runtime/venv/bin/pip install \
  'torch==2.5.1' 'torchaudio==2.5.1' 'demucs==4.1.0' 'soundfile==0.13.1'

python3 -m venv local-evidence/stems-runtime/spleeter-venv
local-evidence/stems-runtime/spleeter-venv/bin/pip install \
  'tensorflow-macos==2.12.0' 'tensorflow-io-gcs-filesystem==0.34.0' \
  'soundfile==0.13.1' 'ffmpeg-python==0.2.0' 'httpx[http2]==0.19.0' \
  'typer==0.3.2' 'pandas==1.5.3' 'norbert==0.2.1'
local-evidence/stems-runtime/spleeter-venv/bin/pip install --no-deps 'spleeter==2.4.2'
```

Model acquisition is a separate explicit step using the pinned official URLs/hashes above. Do not use HTDemucs download as a shipped production default. For Spleeter extraction, accept only `checkpoint`, `model.data-00000-of-00001`, `model.index`, and `model.meta` as regular files into the `models/4stems` directory, verify the worker's individual hashes, and retain Deezer's applicable MIT notice in any future distribution. No model download occurs inside a user-triggered separation job.

## SCNet-large: stronger permissive candidate, actual comparison

The next evaluation found an explicit grant that resolves the checkpoint-license concern: the repository owner confirmed on 2026-07-17 that both released SCNet and SCNet-large weights use MIT, including redistribution and format conversion with attribution. This is a direct [owner statement in issue 35](https://github.com/starrytong/SCNet/issues/35), not an inference from repository code licensing. The [official repository](https://github.com/starrytong/SCNet) links the original checkpoints and their configurations.

| Pinned component | Value |
|---|---|
| Code commit | `5d95bf96b19c3eede63248d171efeca8e3abb948` |
| Official large checkpoint | [Google Drive file](https://drive.google.com/file/d/1s7QvQwn8ag9oVstGDBQ6KZvacJkvyK7t/view) |
| Checkpoint bytes | 168,848,417 |
| Checkpoint SHA-256 | `719e5abb8ed920305dad546ac3cd6fb0b1e9c3092d14ce21827bfc0423af3070` |
| Official configuration | [Google Drive file](https://drive.google.com/file/d/1qxK7SZx6-Gsp1s3wCrj98X7--UcI4O3K/view) |
| Configuration SHA-256 | `629a4901184bf1d3a75b0b13904f35974785aa042cad3c010fd576248cdce3f0` |
| Local source | `local-evidence/stems-runtime/scnet-source` |
| Local checkpoint | `local-evidence/stems-runtime/models/scnet-large.th` |

The worker pins and verifies the three imported official source files (`scnet/__init__.py`, `scnet/SCNet.py`, `scnet/separation.py`) and the complete checkpoint. Checkpoint loading uses `torch.load(..., weights_only=True)` and strict model state loading. It does not run upstream training scripts or arbitrary downloaded configuration. The released large architecture parameters are explicit in the worker. This path uses the existing isolated PyTorch 2.5.1 environment; the upstream requirements list 2.8.0, so successful execution here is a measured compatibility result, not a claim that all upstream environments were tested.

```sh
local-evidence/stems-runtime/venv/bin/python scripts/stem_worker.py \
  INPUT.wav OUTPUT_DIRECTORY --backend scnet --status STATUS.json
```

Manifest names and timeline contract are unchanged. It uses the same 30-second preparation windows and 1-second crossfades as the Spleeter worker path; each source is still inferred by the model. On the original 12-second fixture, the integrated worker took 8.024 seconds inference and 8.892 seconds total. Reconstruction relative RMS was 1.920%, passing the unchanged 3% criterion. All thirteen structural/cache/error/resampling/cancellation and original reconstruction checks passed. Synthetic SI-SDR: drums 15.78 dB, bass 5.96 dB, other −13.39 dB, vocals 34.97 dB. The poor synthetic `other` assignment remains visible; passing reconstruction does not imply correct source attribution.

### Real music and source license

To avoid ranking models solely on ambiguous synthesized instrument timbres, two short **held-out test** excerpts were selected from the official MUSDB18 preview archive. MedleyDB tracks were not selected because this archive places them in the training split. The two selected tracks have explicit CC BY-NC-SA 3.0 licenses in the [official per-track license list](https://github.com/sigsep/website/blob/master/content/datasets/assets/tracklist.csv); the [dataset documentation](https://sigsep.github.io/datasets/musdb.html) confirms the Easton Ellises source and license. Audio and derived stems stay in ignored research evidence and are not prototype sample assets or distributed product content.

Archive: [official MUSDB18 seven-second preview](https://github.com/sigsep/sigsep-mus-db/releases/download/v0.4.0/MUSDB18-7-STEMS.zip), 147,209,385 bytes, SHA-256 `365f66acffc57282e474a4c24b32afec3678258c50b8d45646ac849b0a287df3`. Only the named two test files were extracted for this evaluation; their five AAC streams were independently decoded with FFmpeg to float WAVs. The reference sources and mixture are separately AAC encoded, so there can be codec reconstruction differences. No timing realignment or reference-dependent filtering was applied to improve scores.

| Track / attribution | Source member SHA-256 | License |
|---|---|---|
| The Easton Ellises — Falcon 69 | `1edfa8b5abac9a7b962b33d9b3f65c9e0f4e6490567fd5bc51af313fedecc0b5` | CC BY-NC-SA 3.0 |
| The Easton Ellises (Baumi) — SDRNR | `04d349ad1f50d54d9433250cc1a099669e02af850cc5fc00435d756b41531d84` | CC BY-NC-SA 3.0 |

Metric: SI-SDR calculated across the complete stereo excerpt after removing means, with one least-squares scale on the ground-truth reference. This differs from the published museval SDR protocol. It is a small local comparison, not a full benchmark, listening test, or new state-of-the-art claim.

| Track | Model | Drums SI-SDR | Bass | Other | Vocals | Mean | Reconstruction relative RMS |
|---|---|---:|---:|---:|---:|---:|---:|
| Falcon 69 | Spleeter | 6.51 | 4.41 | −1.28 | 1.39 | 2.75 | 3.559% |
| Falcon 69 | SCNet-large | 9.94 | 7.14 | 2.51 | 5.24 | 6.21 | 1.650% |
| SDRNR | Spleeter | 5.28 | 3.83 | −4.30 | 3.04 | 1.96 | 16.648% |
| SDRNR | SCNet-large | 8.09 | 5.06 | −1.01 | 5.71 | 4.46 | 3.025% |

SCNet-large improved all eight source scores in these two excerpts. The SDRNR reconstruction result still fails the same 3% gate, and its other-source SI-SDR remains negative. Do not silently relax either criterion or report all quality gaps closed. The two excerpts are from one band, so genre coverage is especially limited.

Raw metric/provenance report: `local-evidence/stems-runtime/real-music-evaluation.json`. Reproduction script: `local-evidence/stems-runtime/evaluate_real.py`. Input and output files remain alongside each track under `real-fixtures`, excluded from Git.

The author's [SCNet paper, Table 2](https://arxiv.org/pdf/2401.13276) reports 9.69 dB average SDR for SCNet-large trained without additional data and 5.91 dB for the cited Spleeter result. The table marks Spleeter's result as non-HQ and the training data differ. These are published results, not values reproduced here; they support choosing a stronger candidate without replacing local tests.

### Updated recommendation

Recommend **SCNet-large as the prototype's default preparation backend**, retaining Spleeter as an explicit alternative and HTDemucs as a research comparator. This supersedes the earlier Spleeter-only default recommendation. The reason is an explicit checkpoint MIT grant plus improved local real-music separation on all eight compared sources, with a comparable total preparation time on these short excerpts. The parent application owns enabling that default and the browser end-to-end verification; this document alone does not claim the UI selected it.

Remaining quality work: a larger licensed held-out corpus across genres, perceptual listening, source leakage, high-frequency retention, loudness and continuity when switching modes, and comparison against the reference product. Keep normal all-stems playback on the original mixture. No model can be declared a universal winner from this two-track result.

BS/RoFormer was considered but not installed: the visible official architecture implementations do not establish a permissive grant for the named third-party pretrained four/six-source checkpoints. A six-source wrapper or an unofficial mirror's MIT label is insufficient provenance. SCNet's explicit owner grant and runnable four-source architecture made it the strongest feasible candidate for this round, without reclassifying restricted HTDemucs weights.

Exact decoded excerpt durations: The Easton Ellises - Falcon 69: 6.800000s, The Easton Ellises (Baumi) - SDRNR: 6.800000s. These are the provider’s nominal seven-second previews, not guaranteed exactly 7.000 seconds.

SCNet’s 36-second two-window overlap execution also completed: 1,587,600 finite aligned frames per source, 37.343 seconds inference and 38.156 seconds total. Another SCNet browser preparation job was running concurrently, so this is concurrent-load evidence rather than an isolated speed benchmark. No dropouts or browser audio behavior were measured by this worker test. Raw report: `local-evidence/stems-runtime/scnet-long.json`. Spleeter’s existing cache command was rerun successfully after the third backend was added.

To recreate the SCNet dependency without installing its training stack, download the pinned repository's `scnet/__init__.py`, `scnet/SCNet.py`, `scnet/separation.py`, and `LICENSE` into `local-evidence/stems-runtime/scnet-source`, preserving subdirectories. Raw URL prefix: `https://raw.githubusercontent.com/starrytong/SCNet/5d95bf96b19c3eede63248d171efeca8e3abb948/`. Download the official large checkpoint to `models/scnet-large.th` using the Google Drive link above (the local evaluation used `gdown==5.2.0` installed only in the existing isolated venv). The worker rejects missing or different source/checkpoint hashes. Retain the MIT notice from the pinned source; the explicit issue-35 grant covers released weights and converted forms. No release assets or executable dependency bytes were committed.

## 18 October2026 — mixture-consistent export policy

SCNet defaults to an independent minimum-change uniform mixture projection before Float WAV export; explicit raw mode remains available. Raw model quality findings and the original table above remain historical/unmodified. See [scoped review](../prototype/STEM_MIXTURE_CONSISTENCY_REVIEW.md) for actual API/default/cache execution, slight SI-SDR tradeoff and negative other result. Sum conservation is not source-attribution quality. No new model or general benchmark claim.

## 18October2026 — completed cache and rejected quality experiment

[Cache review](../prototype/STEM_JOB_CACHE_REVIEW.md) records real SCNet/API/process-restart reuse and current8768service activation. [Fixed-shift evaluation](../prototype/STEM_SHIFT_DEVELOPMENT_REVIEW.md) failed declared development guards; no inference/default change. Historical model/quality results above are unchanged; desktop local testing is approved, full native/reference acceptance remains open.
