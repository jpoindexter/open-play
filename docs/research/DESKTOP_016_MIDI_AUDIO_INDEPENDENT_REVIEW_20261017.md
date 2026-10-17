# Native 0.1.6 MIDI audio independent inspection — 17 October 2026

Skills matched (4): use, adversarial-verify, dec-quality-testing, dec-software-principles.

**The declared two-recording pitch criterion does not fully pass.** In the unchanged 5–7 second +2-semitone recording window, the left channel measures **371.458669 Hz** against **370.412476 Hz**, an absolute error of **1.046193 Hz**, exceeding the predecode **1 Hz** limit. The +2 right channel and both return-to-zero channels pass. Neither threshold nor measurement window was changed. This is a bounded pitch-accuracy failure; this inspection does not identify its cause or disprove the parent's separately observed native mapping/GUI state.

## Executed whole-original inspection

Independently read both original Downloads WebMs, verified their declared byte counts and SHA-256 identities, and compared each byte-for-byte to the retained local copy. Decoded the **entire** original audio stream without trimming, resampling or channel selection. Both originals are stereo Opus decoded at 48,000 Hz. Every decoded sample is finite.

| Original | Encoded bytes / SHA-256 | Complete decoded frames / duration | Nonfinite sample values |
| --- | --- | --- | ---: |
| `open-play-native-016-midi-plus2.webm` | 306,656 / `6fd70a39e30c9eb76abaecf884552214a84a1936c2ade2bb80eae86e3c538daf` | 1,002,240 / 20.88 s | 0 / 2,004,480 |
| `open-play-native-016-midi-minus2-return.webm` | 460,534 / `2462ad14b4ec933b0fe809ebacff3ccc39973c285645a836a1a916cc361a86ff` | 1,474,560 / 30.72 s | 0 / 2,949,120 |

The complete decoded interleaved Float32 artifacts remain under `local-evidence/desktop-0.1.6-midi-audio-independent/`. Their hashes are respectively `a0925231f6ca1a644ea5da87ca8f1001e94283bce6814d300466d34f19f6fcbb` and `ab27ba5eccfec973161a5e7d8915e66d4cd52c7811f2fe9f99827df9cffa88df`. Original synthetic source fixture hash still equals `99833309d13090de63a9fcdb7ca8f6bcf601975bfb8cb2e3ef691bb369a0a119`.

## Declared window and corroboration

The predecode plan specifies the expected shifted/neutral frequencies, stereo, finite whole decode, RMS above .001 and maximum 1 Hz error in the additional **5–7 s** interval (`docs/prototype/desktop-0.1.6-audio-inspection-plan.json:6`). Both channel windows retain exactly 96,000 samples.

| Recording / channel | Expected Hz | Measured dominant Hz | Absolute error Hz | RMS | Declared result |
| --- | ---: | ---: | ---: | ---: | --- |
| +2 / left | 370.412476 | 371.458669 | **1.046193** | .042541 | **Fail** |
| +2 / right | 617.354127 | 617.934592 | .580466 | .042580 | Pass |
| Return / left | 330 | 330.431100 | .431100 | .043489 | Pass |
| Return / right | 550 | 550.426541 | .426541 | .043494 | Pass |

Primary measurement removes the interval mean, applies Hann weighting, searches the global 20–20,000 Hz spectrum, and interpolates the maximum after at least 4× zero padding. It does not search only near the expected frequency. Eight analytic two-second fixture checks at 44.1/48 kHz and all four expected tones have less than .01 Hz estimator error. The actual failed predicate and `passed:false` remain in `docs/prototype/desktop-0.1.6-midi-audio-independent-results.json:196`.

To challenge a numerical/window artifact, independently evaluated the **same unchanged interval** using continuous-frequency Hann projection maximization, rectangular 16×-padded FFT interpolation and positive-crossing rate. The +2 left estimates are **371.458631**, **371.458562** and **371.458719 Hz**. The other channel estimates likewise agree closely. These are corroborative diagnostics, not replacement criteria or a newly selected passing interval. They support retaining the failure rather than dismissing it as FFT bin spacing.

## Whole-window and silence accounting

All **21 + 31 one-second windows**, including the final partial windows, are retained in the independent result. The +2 left discrepancy persists through every full steady window from 1–19 s (approximately 371.4579–371.4595 Hz for windows 1–18; the 19–20 s ending window measures 371.4559). Thus it is not solely a startup or selected-window boundary effect. The +2 right and neutral recording nonquiet windows remain within the frequency budget. Startup and stopping/quiet windows were not removed or silently awarded steady-state acceptance.

Whole-file millisecond RMS-bin runs are retained separately for both channels. The principal quiet spans are about 0–.975/.976 s and 19.442/19.441–20.88 s in the first recording, and 0–1.357/1.358 s and 29.339/29.322–30.72 s in the return recording. Smaller stopping-edge bins also remain recorded. A millisecond RMS bin is **not instantaneous continuity**, a sample-exact release clock, or proof that no individual dropout exists. Whole recordings begin/end with zero samples; no clipping-scale claim follows from their small measured peaks.

## Evidence, ownership and limits

Executed script: `scripts/inspect_desktop_016_midi_audio_independent.py`. Primary result: `docs/prototype/desktop-0.1.6-midi-audio-independent-results.json`, SHA **`3424c69811687797546f42b560f83060f816eb50a6733666be9a81a21819de4a`**. Additional frequency crosscheck: `docs/prototype/desktop-0.1.6-midi-audio-frequency-crosscheck.json`, SHA **`29092a64467e2ba7602415c54d99ccfef042d7434e584f661b54d92188ea7407`**. Original files, full PCM and the failed primary result are preserved. All output creation was new; no source or old evidence was overwritten.

The parent reports actual native 0.1.6 main-app relative CC mapping, +2 and return-to-zero state, recording and native Save. This reviewer did **not** operate or independently observe that UI or physical MIDI input. Earlier unsuccessful numeric automation, including the real −24 clamp and incorrectly named first screenshot, cannot prove +2 and is not used as audio acceptance. The later verified +2 state must remain tied to its own parent runtime observation.

These recordings demonstrate finite stereo output with the measured shifted and restored tones. They do not fully meet the declared +2 pitch budget, establish exact cursor/release latency or uninterrupted sample behavior, isolate decoder/WASM/engine/clock cause, prove musical quality, prove physical controller/output behavior or establish full current Serato parity. Keep the mapping milestone and this accuracy failure separate. Diagnose any proposed correction against the preserved originals and fixed criterion; neither widening the limit nor replacing this report with an identical rerun would close the observed gap.

Skills applied: use, adversarial-verify, dec-quality-testing, dec-software-principles.
