# Independent MIDI Key Shift browser audio review

17 October 2026. **All eight complete encoded recordings reproduce their declared byte identities, decode to finite stereo PCM, and meet the original sustained-pitch/RMS criteria in both channels.** All eight source identities match before/after both browser phases and current files. This supports the bounded browser integration evidence; it does not establish exact tuning, transition/first-sample continuity, physical MIDI, a new native package or Serato parity.

The parent executed the actual-index-DOM/app-module harness on the isolated browser origin, including reload. This reviewer independently decoded the complete Base64 originals embedded in its two downloaded JSON reports and measured their audio. The reviewer performed no browser/GUI/device/Git operation and changed no product, shared report or earlier failure. Only this review and its unique independent JSON were written for the audio verification.

## Identity and whole-file execution

| Complete input report | Bytes | SHA-256 |
| --- | ---: | --- |
| `docs/prototype/midi-keyshift-browser-final-initial-results.json` | 244,109 | `4e3ca607079cc8f8cad5bd6fae743f3462dfb497a8fda51b1a24c9fc6d1a893d` |
| `docs/prototype/midi-keyshift-browser-restored-results.json` | 38,227 | `577e9ed673721bdb4d778dea67bf0a905507b16924d6f896ae82e5c606614d68` |

The initial report contains eight reported successful checks and **seven complete encoded recordings**; the restored report contains three reported successful checks and **one complete recording**. Both report no fatal errors, `completed:true`, `sourceStable:true` and physical output muted. Those UI/mute/runtime observations remain parent/harness evidence, not independent device observations.

Every payload was strictly Base64-decoded; its complete byte count and SHA-256 match its original recording metadata before codec processing. FFprobe identifies all eight as stereo Opus at 48,000 Hz. FFmpeg decoded each complete original through stdin, with no seek, trim, resampling or channel reduction:

```text
/opt/homebrew/bin/ffmpeg -v error -i pipe:0 -map 0:a:0 -c:a pcm_f32le -f f32le pipe:1
```

The complete output totals **573,120 stereo frames / 1,146,240 Float32 samples**, all finite. Full decoded PCM hashes, whole-file RMS/peak/mean and geometry for each recording are retained in `docs/prototype/midi-keyshift-audio-independent-results.json`.

Seven recordings are 72,000 decoded frames / 1.500 seconds. `deck4-minus12` is **69,120 frames / 1.440 seconds**, retained completely and above the predeclared 1.2-second minimum. It was not extended or trimmed to look like the other captures. Browser `decodeAudioData` reports a 44,100 Hz domain; the independent Opus decode is 48,000 Hz. The short file's browser duration differs by one 44,100 Hz sample; no bit-identical cross-domain PCM claim is made.

## Independently measured declared windows

Only the sustained-pitch measurement uses the predeclared **0.2–1.1 second** window. All other samples remain included in whole-file identity, geometry, finite and level checks. The independent estimator demeans the window, applies Hann, zero-pads its FFT to at least four times the sample count, selects the global non-DC peak, then interpolates three log-magnitude bins. Expected frequencies are applied only afterward to classify the estimate. It does not search only near the desired answer.

Ten ideal-tone analytic controls spanning the expected frequencies show a maximum estimator error of **0.000061 Hz**. That calibrates this estimator on those tones; it is not a calibration of the real engine, codec or musical quality.

| Recording | Expected left / right, Hz | Independent FFT left / right, Hz |
| --- | --- | --- |
| Deck 1 neutral, tempo 1.08 | 330 / 550 | 330.430888 / 550.427259 |
| Deck 1 +12 | 660 / 1100 | 660.629359 / 1100.936237 |
| Deck 1 −12 | 165 / 275 | 165.228067 / 275.876883 |
| Deck 2 relative +1, tempo 0.92 | 466.163762 / 699.245642 | 467.324463 / 700.070481 |
| Deck 2 relative reset, tempo 0.92 | 440 / 660 | 440.401518 / 660.453881 |
| Deck 3 +12 | 660 / 1100 | 660.646638 / 1100.992863 |
| Deck 4 −12 | 220 / 330 | 219.774530 / 330.256708 |
| Reloaded Deck 2 relative +1 | 466.163762 / 699.245642 | 467.261635 / 700.011070 |

All **16 channel checks** satisfy the unchanged per-channel budget `abs(error) ≤ max(1 Hz, expected×0.005)` and RMS >0.01. No threshold was widened after inspecting these results. These are test-fixture channel measurements, not sixteen feature passes.

**Exact pitch must not be claimed.** The largest offset is +1.160701 Hz on the initial Deck 2 relative +1 left channel; the restored version is +1.097874 Hz. Independent FFT corroborates the browser's zero-crossing result, so attributing those offsets merely to zero-crossing estimator bias is unsupported. They satisfy the declared relative tolerance but remain observable tuning differences in the encoded output. Their pipeline cause was not investigated in this bounded review.

The full complete recordings are short steady-state observations taken after the harness's settling wait. They do not measure earliest response, instantaneous pitch, absence of transitional clicks/gaps, precise source cursor or musical artifacts. No new interpretation of prior cursor/clock failures follows.

## Source, mapping and acceptance scope

The complete `sourceBefore` / `sourceAfter` dictionaries are identical across **both phases**, and all eight hashes match current `prototype/` files. The production identities are:

- `app.js`: `abc0e15d47fb1546cde931c21072d9dbd6f4d78ba1c65cab0fc5841b12cf02bf`
- `panels.js`: `565277e7620f5633e2c1a782fca8552f4a354630804648316a0919c270ae55ef`
- `midi.js`: `bd1b0ffd6ade3f118b06f4131307ea55e420317c0f3334a1053f710aa7583dc1`
- Unchanged `engine.js`: `b4683c245c6314432c06f891e85106cf0a1a5c0a615435516930ab5b38f64adf`
- Harness: `a2795af5840b2ff1ab234a6e9c1d988c4e81e943a81a26e40dd1ac15fb07bdd6`

The initial saved mapping array exactly equals the restored phase's reported restored array: one relative browse mapping, Deck 1 absolute Key Shift, Deck 2 relative Key Shift and Deck 3/4 absolute Key Shift. This reviewer compared those payloads; the actual reload and programmatic DOM actions were the parent's separate execution. The restored recording confirms expected later audio from the saved Deck 2 target, rather than establishing audio for every restored target or every persistence failure state.

The harness routes actual application mapping actions into the existing AudioEngine/WASM and its postmaster MediaRecorder. Test tone buffers intentionally replace demo sources. This is independent-source fixture testing through the real browser implementation, not microphone/physical socket measurement, a physical controller run, ordinary music import or a newly packaged native application.

Earlier initial mute failure, pre-review 7/7/five-clip run, controlled red and the invalid first VM-host attempt remain preserved with their original scopes. This later evidence does not erase them. Video MIDI targets, full mapping semantics, device-specific encodings/timing, source/reference ranges, tuning quality and compound transport acceptance remain open. The 110/522 baseline, nine beta deltas and 26 release checks are not marked complete by these scoped results.

## Review freeze

Independent JSON: `docs/prototype/midi-keyshift-audio-independent-results.json`, SHA-256 **`0eff7d25ed2a0b98a5902a4fb61b18a9e495c7f196e47ebd18ce9341fb5078fa`**. It retains every encoded/decoded identity, complete-file metrics, original browser measurements, declared windows and tolerances, independent estimates, source checks and mapping comparison. The original encoded audio remains complete in the immutable input reports.

The executed audio criterion is satisfied within its declared limits. Full feature/reference parity, native deployment and physical compatibility remain unverified by this unit.

Skills applied: adversarial-verify, dec-quality-testing, dec-software-principles.
