# Browser PCM analysis: executed measurements and limits

18 October2026 update: this historical RMS/tempo/key evaluation remains scoped to its original checks. Current analysis adds a separate integrated-LUFS field and actual Auto Gain; read [LOUDNESS_AUTO_GAIN_REVIEW.md](../prototype/LOUDNESS_AUTO_GAIN_REVIEW.md). The legacy `gain` object remains explicitly ungated RMS, not LUFS.

Date: 2026-10-16. Scope: local HTML prototype, no native app or remote audio processing.

## Implemented behavior

`prototype/analysis.js` performs signal analysis on decoded PCM. It estimates a constant pulse tempo, initial beat-grid phase and major/minor key; measures RMS level, sample peak and clipped input samples; and calculates a gain recommendation. None of these values come from a fixture name, filename, existing BPM tag or random success state. Silence, unsupported input and insufficiently periodic/tonal material return unknown values or errors instead of fabricated BPM/key.

`prototype/analysis-worker.js` runs the same algorithm in a browser module worker so the analysis loop does not execute on the audio callback or UI thread. `analyzeBuffer` copies source channels before transferring them, preserving the original decoded AudioBuffer. An AbortSignal terminates the worker. Each invocation is independent; the parent should queue analysis jobs rather than launch one for every library item simultaneously. Full PCM copies consume memory proportional to file duration/channel count even when tonal/tempo analysis covers a shorter window.

## Integration contract

```js
import { analyzeBuffer, analyzePCM } from './analysis.js';

const result = await analyzeBuffer(decodedAudioBuffer, {
  signal: abortController.signal,
  onProgress: fraction => updateAnalysisProgress(fraction),
  minBpm: 50,
  maxBpm: 220,
  maxSeconds: 180,
});
// Synchronous pure signal path for a worker/test host:
const sameResult = analyzePCM([leftFloat32, rightFloat32], sampleRate);
```

| Result field | Meaning |
|---|---|
| `version` | `open-play-pcm-v1`; retain with metadata so future algorithms can invalidate/reanalyze |
| `duration` | Entire decoded input duration |
| `analyzedDuration`, `partial` | Tempo/key window coverage; default first 180 seconds |
| `bpm`, `key` | Numeric BPM and conventional key string, or `null` when unknown |
| `tempo` | Heuristic confidence, reason and three autocorrelation candidates; half/double ambiguity remains visible |
| `keyEstimate` | Heuristic confidence, three ranked major/minor candidates, normalized chroma and spectral flatness |
| `grid` | Constant-grid BPM, `firstBeat`, beat times in seconds, `downbeat: null`, `downbeatVerified: false` |
| `gain` | PCM RMS, dBFS RMS, sample peak, sample-peak dBFS, clipped-sample count and recommended gain in dB |
| `warnings` | Explicit silence/short/ambiguous/partial coverage and downbeat-review messages |

`tempo` and `keyEstimate` themselves can be null for silent/very short inputs. Confidence values are heuristic scores, **not calibrated probabilities**. Display estimates as estimates. Do not overwrite a user's locked or manually corrected grid/key without an explicit product action. A null estimate should not silently erase a valid manual value.

The module returns no bar/downbeat inference. `firstBeat` is an estimated pulse phase, not evidence of bar one or musical meter. The beat list spans only the analyzed duration; extending the constant grid through the rest of a track is extrapolation and must remain editable. Variable-tempo maps, swing, compound-meter interpretation, phrase detection and tempo changes require additional algorithms and validation.

## Independent algorithm and primary background

The implementation is independently authored JavaScript with no copied Essentia/librosa code or new runtime dependency. Its FFT uses the standard radix-two transform; spectral frames use Hann windows. The algorithm concepts are informed by primary project documentation:

- [librosa onset strength](https://librosa.org/doc/0.11.0/generated/librosa.onset.onset_strength.html) documents positive spectral-change onset envelopes.
- [librosa tempo](https://librosa.org/doc/0.11.0/generated/librosa.feature.tempo.html) documents onset autocorrelation and tempo-prior ambiguity. Open Play uses its own autocorrelation/ranking and observed-onset regression rather than importing that implementation.
- [librosa chroma](https://librosa.org/doc/0.11.0/generated/librosa.feature.chroma_stft.html) documents spectral pitch-class features and tuning considerations.
- [Essentia Key](https://essentia.upf.edu/reference/std_Key.html) explains profile correlation, competing major/minor scores and Krumhansl profiles. Open Play uses the published twelve-value major/minor profile data with independently implemented correlation; it does not import Essentia algorithms or models.

For tempo/key, the highest-energy channel is selected so opposite-phase stereo does not collapse to silence. Integer averaging reduces the sample rate to roughly 11–16 kHz; a 2048-sample FFT and 128-sample hop produce a positive log-magnitude difference envelope. Normalized onset autocorrelation proposes tempo candidates; onset interval consistency and regression refine the estimate and constant-grid phase. Weak/irregular periodicity is rejected. High-frequency decimation uses a simple averaging filter, not a high-quality resampler; complex spectra and aliasing require further evaluation.

For key, interpolated spectral peaks between 70 Hz and 3.5 kHz contribute to twelve pitch classes. Major/minor profile correlation produces ranked candidates. The best result must meet explicit score, margin, active-pitch-class and spectral-flatness criteria. Broadband noise, isolated sustained tones, and ambiguous profiles remain unknown. This is a useful transparent baseline, not a trained production key detector or equivalence to Serato's key analysis. Tuning far from A440, modulation, dense distortion, unusual scales and genre diversity remain open.

## Level measurement boundary

RMS and sample peak are calculated over all samples and all channels of the decoded input. A peak at or above amplitude 1 counts as a clipped input sample. Silence has null dBFS/gain values; it is never assigned infinite gain. Recommended gain targets −14 dBFS **ungated RMS**, limits positive boosts to 12 dB, and retains at least 1 dB of measured sample-peak headroom where the computed recommendation is applied exactly. Large cuts are allowed so extreme floating-point signals do not bypass that ceiling.

This is **not LUFS, ReplayGain, true-peak measurement, a loudness standard implementation, or proof of intersample-peak safety**. `lufsMeasured` and `truePeakMeasured` are explicitly false. A recommendation does not mutate the PCM, write file tags or change deck gain by itself. The parent must decide when a user action applies it and whether the deck's actual gain range can represent it.

## Executed signal tests

Command: `node scripts/test_analysis.mjs`.

Observed final result after formatting: **59/59 checks passed**, 6.809 seconds on this host, executed 2026-10-16 at 14:32:18 UTC. The test executes the actual browser analysis module against independently generated PCM, then compares output values with signal construction truth. It does not inspect internal implementation methods or merely assert that non-null metadata was produced.

- Eight pulse tempos (60, 80, 95, 110, 128, 150, 174, 200 BPM): each estimate within 1 BPM and initial phase within 65 ms, with downbeat unverified.
- All twelve chromatic roots in major and minor: 24 generated tonal sequences identify their intended keys. These sequences exercise transposition; they do not constitute twenty-four genres or commercial-song accuracy evidence.
- Silence, steady sine, seeded broadband noise and irregular attacks return unknown tempo/key where appropriate.
- An abrupt 120→150 BPM sequence does not receive a confident fixed grid.
- Opposite-phase stereo retains rhythmic information.
- Sine RMS agrees within 0.01 dB and sample peak within 0.001; extreme floating-point input receives a sufficient gain cut and clipped samples are counted.
- Equivalent 95 BPM fixtures at 22.05, 48 and 96 kHz remain within 1 BPM.
- NaN PCM, unequal channel lengths, invalid sample rate and inverted BPM range reject; a limited analysis window is explicitly reported.

Raw local report: `local-evidence/analysis-signal-results.json`. No licensed real-music beat/key ground truth has been evaluated in these tests; the earlier stem-separation audio cannot establish key/BPM truth merely because it has source stems.

## Browser acceptance path

Open `/prototype/analysis-test.html` and press **Run analysis checks**. The page exercises the actual module worker, progress, transfer-copy preservation, cancellation, silence and malformed-input propagation without playing or uploading audio. Seven browser checks are defined. At handoff, this page has not yet been executed by this subtask because the parent owns the shared browser; the parent must record the observed result separately.

The parent application's end-to-end acceptance is distinct: import audio → decode → queued analysis/progress → numeric library/deck metadata → editable grid/key → actual gain application when requested → save/reload. Worker or Node tests alone do not establish that product path. They also do not prove hardware output, live-audio deadlines or Serato parity.

## Application integration and browser test recipe (16 October)

`app.js` now imports `analyzeBuffer` and queues measured analysis of actual `engine.buffer()` PCM. Import defaults to analysis enabled; the Analysis dialog persists enablement, minimum/maximum tempo and the tempo/key window. Main Analyze follows Selected track / Current crate / All tracks. The dialog has a selected-track run button and explicit one-run replacement choices. Cancel terminates the current worker and clears pending jobs; already completed measurements survive. Decode itself cannot be interrupted by the browser API, so cancellation is checked before launching analysis.

Measured results are stored separately from library values. Existing values, manual edits and protected grids survive ordinary analysis; an explicit replacement still cannot overwrite a locked grid. Unknown estimates never erase known values. A metadata revision and value snapshot prevents a result from overwriting hand edits made while the job was running. Confidence and unknown results appear in the dialog and library cell tooltips. Automatic phase is identified as an unverified downbeat.

The gain button applies the measured recommendation through the existing focused deck's real `engine.mix(index, 'trim', linear)` path. The deck currently permits up to +6.02 dB, so a larger recommendation is explicitly limited to that range; negative cuts remain representable. This is a recommendation applied on request, not automatic loudness normalization. Persistence stores the applied gain annotation, not automatic restoration of the mixer's live trim.

Imported audio gets a full-byte SHA-256 identity. Preferences and metadata persist in localStorage; re-importing identical bytes reconnects the saved metadata and avoids duplicate rows. Audio bytes are neither saved nor uploaded. Local imported tracks require re-import after reload. A browser quota failure is reported and the existing metadata export remains available.

### Executed controller checks versus pending browser acceptance

`local-evidence/analysis-ui/test-controller.mjs` executes the actual app controller function bodies and real PCM analysis with a stub DOM and decoder. It checks fresh measured metadata, unknown key handling, manual preservation, locked replacement refusal, explicit unlocked replacement, edits during decode, cancellation before publication, disabled-on-import behavior, content-derived deduplication, metadata reattachment, and persistence without audio bytes. Observed result: **13/13 checks passed** after application formatting and syntax validation. Its JSON output is `local-evidence/analysis-ui/controller-results.json`. This controller test does **not** establish browser file decoding, Worker behavior or visible controls.

Original generated WAV fixtures were written to `local-evidence/analysis-ui/` for the parent-owned browser test:

1. Import `pulse-128.wav` with Analyze on import enabled. Wait for analysis completion; library BPM must be within 1 of 128. Open Analysis and observe actual RMS/peak, confidence, constant grid and unknown key. Load it on the focused deck and apply suggested gain; inspect the visible gain control and engine's live gain parameter. Do not infer acoustic output from a control value.
2. Import `c-major.wav`; measured key must be C. Import `silence.wav`; BPM/key/gain recommendation must be unknown and no infinite boost offered.
3. On the pulse track, use Track details to enter 111 BPM, Fm, and protect the grid. Run analysis; those values must survive. Even enabling replace BPM must preserve the protected grid. Unlock it and explicitly request replacement; BPM must return to approximately 128. An unknown measured key must continue to preserve the manually entered Fm.
4. Save a different BPM range/window and disable import analysis; reload and reopen Analysis to inspect persistence. Re-import identical pulse bytes; the metadata should return. Audio bytes themselves are not recovered by reload.
5. Choose All tracks and Analyze, then Cancel while a worker is active. Pending tracks must not acquire new measurement timestamps after cancellation; completed tracks remain intact. Use the separate worker seam page for deterministic AbortError verification if a short queue completes before a click.

The above public-control steps remain pending until the parent executes them. No 1:1 Serato-analysis accuracy claim follows from the synthetic signal, controller or browser seam tests.

## Parent browser UI verification, 16 October 2026

Imported original pulse-128.wav, c-major.wav and silence.wav through Import audio.
Observed127.99 BPM, C major, and unknown silence respectively. Edited pulse BPM to133
and protected its grid, ran analysis, then reloaded and reimported identical audio:133
and the lock persisted while measured127.99 remained visible. Explicit replacement
also preserved the protected grid. Artifact: `../prototype/analysis-main-ui-results.txt`
and `../prototype/screenshots/analysis-measured-review.jpg`. This is generated-signal
UI evidence, not real-music accuracy.
