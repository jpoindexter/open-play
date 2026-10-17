# Warped-loop keylock pitch error — bounded DSP diagnosis

18 October 2026. Claude Fable 5.1 (High), fresh Claude Code session, authorized by Jason as a narrow DSP consultation while Codex is stuck. Skills matched (4): use, debug, blind-falsification, source-grounded. **Not** the independent Serato parity audit. Full parity and the current pitch gate remain incomplete. No production, harness, vendor, git, native or browser state was touched.

## Verdict in one paragraph

The +1.3–1.6 Hz error on a 440 Hz sine shifted +3 semitones is **not** caused by the warped-loop host, the sample clock, the schedule/seek plumbing or the API semantics. It is the Signalsmith Stretch pitch-mapping algorithm's own frequency quantisation error: the output tone is placed at `f_in + (m−1)·f_centroid` through a bin-translation map plus linear complex interpolation between adjacent FFT bins, and that construction has a residual of order 0.1–0.2 bin. At the default 48 kHz preset one bin is 8.333 Hz, so 0.16 bin is 1.34 Hz. The same unmodified processor at 240 ms / 60 ms measures **+0.30 Hz** and at 480 ms / 120 ms **+0.29 Hz** for this exact case. The MIT backend can therefore meet the 1 Hz gate for this combination with a configuration change, not a tone-specific correction, but it has no frequency-exact mode and the residual is position-dependent, so this is not a general guarantee.

## Implementation facts (read from source)

Pinned upstream header `local-evidence/keylock-pitch-upstream-source/signalsmith-stretch.h` (C++ source behind the embedded WASM; reproducible C++→WASM build remains unproved, per prior reviews).

- `presetDefault` → `configure(ch, sr·0.12, sr·0.03)` (`:63`). Actual WASM accessors at 48 kHz: block 5760, interval 1440, inputLatency 2880, outputLatency 2880, wrapper `bufferLength` 5760. Bin spacing = 48000/5760 = **8.3333 Hz**.
- `mapFreq` (`:850`) is a pure multiply below the tonality limit. `tonalityHz 8000` → limit 8000/48000/√m ≈ 0.153 of sample rate ≈ 7.3 kHz; 440 Hz and 523 Hz are far below it. Tonality limit is not a factor here.
- `findPeaks` (`:858`) finds runs of bins whose energy exceeds a two-pass smoothed energy and takes the **energy-weighted centroid bin index** as `peak.input`; `peak.output = freqToBand(mapFreq(bandToFreq(avgBand)))`.
- `updateOutputMap` (`:880`) with **one peak** writes `outputMap[b] = {b + (input − output), 1}` for every bin. For a single sine the whole map is a constant **translation** by `(1−m)·centroid` bins, not a scaling.
- Phase prediction (`:703–720`): at each new spectrum the per-bin `output` and `prevInput` are rotated by their **integer** bin-centre advance over one interval (`:647–656`). Then for output bin b: `prediction.input = getFractional<input>(inputBin)`, `prevInput = getFractional<prevInput>(inputBin)`, `freqTwist = input·conj(prevInput)`, `output ·= freqTwist`. `getFractional` is **linear interpolation of complex bin values** between `floor(inputBin)` and `floor+1`.
- Re-prediction (`:729–790`) blends the result with the phases of bins b±1 and b±`longVerticalStep` (= fftSamples/interval, 4 at the default preset), again through fractional interpolation.
- `setFreqMap` exists in C++ (`:120`) but **is not exported** by the embedded WASM (`_setFreqMap` count 0 in all three vendored modules). Exported controls are block/interval (`_configure`, via the wrapper `configure` message, which already calls `this.configure()`), transpose, formant, tonality limit.
- `transformWarpedLoop` (uncommitted WIP in `prototype/keylock-dsp.js`) streams `_process(inputCount, count)` with `_setTransposeSemitones(semitones, 8000/sampleRate)` per 128-frame block and no `_seek`; `keylock=true` makes `semitones` constant (+3) across both tempo segments while `rate` changes. It uses the default preset.

## Mechanism (inference from the facts above)

With the per-bin rotation step, the output frequency at bin b is `f_centre(b) + deviation`, where deviation is the phase advance of the interpolated input relative to the interpolated bin centres. With a translation map this gives, to first order, `f_out = f_in + (m−1)·f_centroid`. If the centroid equalled `f_in` exactly the result would be exact, so the error has two sources:

1. **Centroid bias**: the energy centroid of a windowed sine sampled on a bin grid, over an asymmetric set of above-threshold bins, is not exactly `f_in`. Its contribution scales with `(m−1)`.
2. **Fractional-bin interpolation**: at interval = block/4 the centre rotations of adjacent bins differ by exactly 90°, and adjacent bins of a windowed sine are roughly anti-phase. Linearly interpolating such complex values for `input` and for the rotated `prevInput` does not give the true deviation phase; the measured deviation depends non-linearly on the fractional part of `inputBin`. This part does **not** scale with `(m−1)` and changes with where the mapped output lands on the grid.

Both are expressed in **bins**, so the Hz error shrinks as the block grows. Both are properties of the algorithm's design (quality-oriented spectral mapping), not a bug in the wrapper or host.

## Measurements (executed here, finite, three renders)

Harness `local-evidence/warp-loop-keylock/claude/three.mjs` drives the **unmodified** vendored `SignalsmithStretch.mjs` exactly as `transformChannels` does (wrapper seek path, 128-frame blocks, rate 1, +3 semitones, 440 Hz sine amplitude 0.1, 3 s, 48 kHz). Estimators: positive zero-crossing identical to the test, and `fft.py` global 20–20 000 Hz Hann, 16× zero-pad, log-parabolic peak with no expected-frequency window. Window 1.0–2.5 s. Expected 523.2511 Hz. Raw PCM and SHA-256 preserved beside the scripts.

| Config (block/interval) | Actual frames | Bin Hz | Zero-crossing Hz | FFT Hz | Error Hz | Error in bins |
|---|---:|---:|---:|---:|---:|---:|
| default 120/30 ms | 5760/1440 | 8.333 | 524.5951 | 524.5953 | **+1.344** | 0.161 |
| 240/60 ms | 11520/2880 | 4.167 | 523.5523 | 523.5521 | **+0.301** | 0.072 |
| 480/120 ms | 23040/5760 | 2.083 | 523.5393 | 523.5391 | **+0.288** | 0.138 |

Preserved `dsp-first.f32` (original wrapper, warped-loop render) re-measured with the same FFT estimator: +1.5842 / +1.5843 Hz in 0.5–1.5 s and 2.5–3.5 s, corroborating Codex's 524.835 Hz.

Partial data from a semitone sweep the human stopped (default config, zero-crossing, same window; stdout only, not frozen): +5 → +1.014 Hz, +7 → +0.359 Hz, +12 → +0.637 Hz; tempo-only 0.8 → +0.414 Hz; tempo-only 1.25 → ≈+0.31 Hz (window overran the 2.4 s output; approximate). The error does **not** scale with `(m−1)` (7.1, 3.0, 0.72, 0.64 Hz per unit), which falsifies "constant centroid bias" alone and supports the position-dependent interpolation component.

## What this rules out (with the evidence)

- **Host/stream plumbing**: unmodified `transformChannels` at tempo 1/+3 (524.596, Codex), the direct-WASM streaming warped-loop (524.600, Codex), and this harness (524.595) agree within 0.005 Hz at the default preset. The original repeated-seek wrapper (524.835) differs by only +0.24 Hz. Three different feeding strategies, same ~0.16-bin error → the error is inside the spectral processing, not the feed.
- **Sample clock**: the pitch ratio is dimensionless. A wrong `sampleRate` would change block length (and therefore bin width) but the warped-loop and tempo-1 paths share the same geometry and give the same error; the accessor-confirmed geometry matches `sr·0.12`.
- **API semantics**: `setTransposeSemitones(3, …)` → `freqMultiplier = 2^(3/12)`; measured output is 1.0026× the intended ratio, not 2× or a semitone off. No semantic mismatch.
- **Tonality limit**: inactive below ~7.3 kHz.
- **Seek-history shortfall** (prior reviews): a separate ≈0.3–0.45 Hz neutral bias in the wrapper seek path (`bufferLength` = block < `seekLength` = block+interval). It is present in this harness's tempo-only rows and may be most of the +0.29 Hz floor at 480/120 here. It is **not** the shifted error: the streaming warped-loop path has no seek and still shows +1.35 Hz.

## Can the MIT Signalsmith backend meet 1 Hz for this combination?

- **Executed**: yes at 240/60 and 480/120 for 440 Hz/+3/48 kHz, through the wrapper seek path, with no per-tone correction.
- **Not executed**: the same configuration through `transformWarpedLoop`'s direct streaming with both tempo segments. Default-preset agreement between the paths (above) makes agreement likely, not proven.
- **Known limit** (prior configuration review, 17 Oct): 120/10 passed 23/24 held-out cases but regressed 44.1 kHz 97/173 Hz, rate 0.75, −12 to −1.13 Hz. The error is position-dependent, so any single configuration can lose a case. There is no exported frequency-exact mode; `setFreqMap` is unexported and would not fix interpolation anyway.
- **Cost**: for the offline warped-loop render, latency is irrelevant (guard cycles warm the DSP), so block size costs only CPU and time-domain smearing. 240 ms blocks will pre-echo drum transients more than 120 ms; this is audible on DJ loops and is untested here.

## Alternative backends (not evidenced here, listed for completeness)

- SoundTouchJS 2.1.1: already experimented in `experiments/keylock-soundtouch`, declared **MPL-2.0** per the repo's provenance JSON; prior tone cohort 6/6 with a 0.973 Hz worst case. Not an MIT drop-in; adapter contract unbuilt.
- Rubber Band: `experiments/keylock-rubberband` exists; Rubber Band is GPL/commercial. Not a licence match.
- Any other candidate requires fetch + licence + API evidence; none gathered in this session (no downloads authorized).

## Smallest evidenced next change

**One experiment, one line of configuration**: run `scripts/test_warp_loop_keylock.mjs` with `transformWarpedLoop` configuring the disposable processor to **240 ms block / 60 ms interval** before `addBuffers` (wrapper message `configure {blockMs:240, intervalMs:60}`; it calls `this.configure()` and rebuilds `buffersIn/Out` and `bufferLength`, so read those after it). Expected per this diagnosis: both windows within ≈0.3–0.5 Hz of 523.251 Hz; the test's existing 1 Hz assertion passes without edit. If it does not pass, the streaming path has a second, path-specific cause and this diagnosis is incomplete. Keep the default preset for live playback; this change is only justified for the offline periodic warped-loop render where latency does not matter.

Do not: widen the 1 Hz gate, add a per-tone correction, or switch backends on this evidence. The 136 ms pulse-phase lag in the browser render host is a separate latency-compensation defect and was not examined.

## Unknowns

- Exact `fftSamples` (whether the STFT pads 5760 to a larger FFT) — inferred equal to block from the measured 8.33 Hz bin geometry, not read from the linear-algebra header, which is not vendored.
- How much of the +0.29 Hz floor at 480/120 is seek-history bias versus algorithm residual.
- Audible transient quality of 240/60 on real loops.
- Behaviour at rate 0.8 in the second segment under 240/60 (the WIP's second window was +0.2 Hz worse than the first at default).

## Artifacts

`local-evidence/warp-loop-keylock/claude/`: `three.mjs`, `fft.py`, `results.json`, `default.f32` (SHA-256 81aec630a09a790889945edb3730432df234c2dbee33e55aeab0e68f93710966), `240-60.f32` (bbb4258b0c86d9ca734d209289f2cda5cb85402bab5810b2dee1b854796ed865), `480-120.f32` (9ddf9b2a878887137e7e01d7a471520438a08d0a23ed2537b7d460a5d8f30ea2). Source hashes at time of reading: `prototype/keylock-dsp.js` 36749a9f…558e79, `scripts/test_warp_loop_keylock.mjs` 8468379c…74ccd0, `dsp-first.f32` 8b08173f…605a0c (unchanged).

Skills applied: use, debug, blind-falsification.
