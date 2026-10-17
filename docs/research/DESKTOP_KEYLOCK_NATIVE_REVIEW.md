# Independent native keylock recording review — 17 October 2026

**Bounded verdict: supported sustained-pitch behavior in both supplied native recordings.** Independently decoding the complete originals reproduces their hashes, complete PCM hashes, geometry, finiteness, whole-file levels, every one-second classification and all one-millisecond quiet runs. This does not establish exact release latency, instantaneous continuity, source cursor, musical quality, physical outputs or Serato parity. No production, UI, device, Git or remote operation was performed in this review.

The parent executed the Electron 0.1.5 UI actions against the reported immutable prototype `48a6d4dad2f217a8ba166b9ca890a287aabc4feb`. Those operations and the native candidate identity are parent-observed evidence; this reviewer independently executed the recorded-audio analysis, not those UI operations. This report does not repeat the separate host/package audit.

## Criterion and method actually executed

The supplied fixture criteria declare stereo 330/550 Hz, tempo +8%, unlocked expectations 356.4/594 Hz, and a 1.5 Hz tolerance (`docs/prototype/desktop-0.1.5-keylock-fixture.json:13–35`). The second supplied criterion declares keylock on, +2 semitones and expected 370.412475942/617.354126570 Hz; it explicitly excludes exact release timing and cursor acceptance (`desktop-0.1.5-keylock-shifted-criterion.json:2–21`). Their pre-recording declaration is the parent's reported chronology; this review verifies the supplied criteria and recordings, not historical filesystem creation times.

Both original Downloads files were read completely and compared byte-for-byte with the ignored retained copies. FFmpeg decoded the entire original to interleaved little-endian Float32 with no seek, trim, resampling or channel reduction:

```text
/opt/homebrew/bin/ffmpeg -v error -i <complete-original.webm> -map 0:a:0 -c:a pcm_f32le -f f32le pipe:1
```

FFprobe independently reports Opus, stereo, 48,000 Hz for both recordings. Every decoded sample was checked for finiteness, and every frame belongs to one retained, nonoverlapping one-second spectral window, including the short final window. The independent estimator demeans, applies a Hann window, selects the global non-DC rFFT maximum, then interpolates three log-magnitude bins. It does not search near an expected frequency. Expected frequencies are used only after estimation to classify the result. A window with both channel RMS values below 0.005 is quiet; its frequencies are null rather than assigning a meaningless silent FFT bin.

Six generated analytic tone controls spanning all expected frequencies had maximum estimator error 0.014786 Hz. This checks this estimator on those tones, not arbitrary music or mixed/transient windows. The parent's estimator gives slightly different Hz values; the independent classifications and declared-tolerance decisions agree in every window. Observed frequencies have small offsets from the ideals, so “exact pitch” would overstate this result.

Complete measurements, all 91 spectral windows and source/report/action-log hashes are in `docs/prototype/desktop-0.1.5-keylock-independent-results.json`.

## Complete recordings

| Recording | Encoded bytes | Decoded stereo frames / duration | Whole RMS, left / right | Whole peak, left / right |
| --- | ---: | --- | --- | --- |
| Keylock on/off and moving scratch | 928,316 | 2,862,720 / 59.640 s | 0.042117618 / 0.042340304 | 0.069642514 / 0.073292598 |
| +2 key shift and stationary scratch | 452,918 | 1,474,560 / 30.720 s | 0.039870994 / 0.039915284 | 0.062712535 / 0.063238531 |

All decoded samples are finite. The retained copies are identical to their respective originals. The original owned WAV also matches the declared fixture SHA and geometry: 21,168,044 bytes, 5,292,000 stereo PCM16 frames at 44,100 Hz, 120 seconds. Fixture rate and decoded Opus rate are separate sample domains.

| Identity | Keylock on/off recording | Shifted stationary recording |
| --- | --- | --- |
| Original and retained WebM SHA-256 | `10cb98d584e1b61ecb859d3b22fb443fdbf77723dc3ae6c4b125ae976b3d02e0` | `8f7900ff1e7367aea6d246b160f751e1446197046219a16926d70f92c4cff88c` |
| Complete decoded Float32 PCM SHA-256 | `eaa5e9e28335eb6242c0bda5d2c0b6949535c1d3b08c0832a9f268d441b8d985` | `26c0be66ba0394cc9b2c39f0e9f2239345a6df1a2ab0446ed28a1b78836a0e72` |

These match the parent analyses (`desktop-0.1.5-keylock-audio-inspection.json:3–20` and `desktop-0.1.5-shifted-keylock-audio-inspection.json:3–20`). SHA values describe complete bytes, not a passing excerpt.

## Pitch verdict, including unclassified windows

| Class | One-second windows | Independent left / right frequency range, Hz | Maximum absolute ideal-frequency error, left / right |
| --- | ---: | --- | --- |
| Locked | 35 | 330.4001–330.4414 / 550.3936–550.4378 | 0.4414 / 0.4378 Hz |
| Unlocked at +8% | 21 | 357.4735–357.4744 / 594.3527–594.3554 | 1.0744 / 0.3554 Hz |
| Locked, +2 semitones | 29 | 371.4477–371.4654 / 617.9272–617.9446 | 1.0530 / 0.5905 Hz |

All tone-classified windows satisfy the supplied 1.5 Hz criterion in both channels. The first complete recording has 60 windows: 35 locked, 21 unlocked, **two transition-or-other and two quiet**. The transition windows at 18–19 s and 49–50 s remain unclassified, with no deletion or promotion. All nine windows starting at 50 through 58 s classify locked after the parent-observed moving scratch. This supports sustained locked pitch returning after that action; it does not establish the first correct release sample. The parent's classification changes and counts explicitly preserve these boundaries (`desktop-0.1.5-keylock-audio-inspection.json:804–844`).

The second complete recording has 31 windows: 29 shifted and two quiet. Windows 9–10 s and 10–11 s include the intentional stationary quiet hold but still contain enough tone to exceed the window RMS threshold and classify shifted. Consequently, **29 shifted windows does not mean 29 continuously sounding seconds**, nor does zero transition-class windows prove an instantaneous handoff. Windows starting 11 through 29 s classify shifted after the quiet interval. These observations support the declared sustained shifted-pitch criterion before and after the hold, within its stated tolerance.

## Quiet runs: verified bin observations, not a release clock

The review evaluated every 48-frame (1 ms) bin across both complete files: 59,640 bins and 30,720 bins. Joint stereo RMS below 0.005 reproduces these complete runs:

| Recording | All observed quiet intervals | Quiet duration |
| --- | --- | --- |
| Keylock on/off | 0–1.470 s; 58.411–59.640 s | 1,470 ms; 1,229 ms |
| Shifted stationary | 0–1.053 s; **9.613–10.820 s**; 29.251–30.720 s | 1,053 ms; **1,207 ms**; 1,469 ms |

Requiring each channel separately to be below the same threshold gives exactly the same bin classifications. The first recording has no qualifying quiet run intersecting 46–53 s. This corroborates `desktop-0.1.5-keylock-quiet-inspection.json:2–18`; the second reproduces all runs at `desktop-0.1.5-shifted-keylock-audio-inspection.json:444–459`.

RMS aggregates 48 frames. A bin above threshold can contain silent or wrong-pitch samples, and a quiet bin need not consist of exact zeros. Absence of a qualifying bin is therefore not sample continuity proof. A sustained spectral classification can coexist with silence inside its window, as the second recording directly demonstrates.

The action logs identify the parent's Left 750 ms and Space 1,200 ms gestures (`local-evidence/desktop-0.1.5-keylock-actions.json:20–28`; `local-evidence/desktop-0.1.5-shifted-keylock-actions.json:12–23`). Their wall-clock timestamps and the WebM samples have no exact shared release-sample clock. The measured 1,207 ms quiet run is **not** a measured 7 ms release delay. No earliest-correct-pitch, 20 ms, source-cursor or end-to-end latency claim follows.

## Claim review and preserved boundary

- **Supported, independently executed:** complete-original identity and finite PCM; all reported one-second classifications; stated sustained locked/unlocked/shifted pitch within 1.5 Hz; all one-millisecond quiet runs.
- **Supported only by combining parent observations with this audio:** native keylock toggling and scratch gestures followed by later expected sustained pitch. The reviewer did not independently operate or watch those native actions.
- **Refuted as an inference:** the recordings prove seamless release, all-window pitch correctness in the first test, 29 uninterrupted shifted seconds, exact scratch position, or a 7 ms release delay. None is established by the executed criterion.
- **Still open:** earliest audible cursor, continuous transition behavior, musical artifacts, physical controller/audio outputs, compound transport states and reference parity. Earlier strict capture/continuity/cursor failures are not superseded by these tone recordings. `FULL_BUILD_PLAN.md:1440–1442` already preserves these boundaries; this review changes no full-feature status.

Only the new review and its unique JSON were written. The result JSON SHA-256 at this review freeze is `56878fa006e8a1b90609df443ef7911528212351c4ad1fa0ccdf817bc6a823e0`. No acceptance criterion was relaxed, no capture trimmed, and no existing result or source was modified.

Skills applied: dec-quality-testing, dec-software-principles, adversarial-verify.
