# Independent timestamp/control-PCM evidence review

17 October 2026. **At all three reported duplicate/skip timestamp pairs, both independent control channels continue their local 307 Hz phase in received sample order. The PCM does not repeat the previous 128-sample control block or show the corresponding 128-sample phase skip.** This is evidence of disagreement between those row timestamps and control-audio progression. It does not identify the cause, establish deck/WASM continuity, repair the timestamps or make the globally failed cursor run acceptable.

This was an offline inspection of the original downloaded four-channel raw bytes and producer transcript. No production/harness file, GUI, device, Git or remote operation was performed. Only this new report and `docs/prototype/engine-cursor-clock-independent-results.json` were written.

## Original artifacts and unchanged failure status

| Artifact | Complete bytes | SHA-256 |
| --- | ---: | --- |
| `docs/prototype/engine-cursor-native-initial-results.json` | 3,261,506 | `98f0147512f10a86c302f47dccd766bdf0689d3ab66cab5506747758c28235a8` |
| Original `/Users/jasonpoindexter/Downloads/engine-cursor-native-initial-complete.f32` and retained `local-evidence/engine-cursor-native-initial/complete.f32` | 15,775,744 each | `189c5708ef1e35719563f5a0e2011ec737f6c9e5107326d1be7ebb1b5985dc52` |

The retained raw copy is byte-identical to the original. Geometry is 985,984 frames × four little-endian Float32 channels, in original order deck-left, deck-right, control-left, control-right, at 44,100 Hz. All samples are finite. All 7,703 producer rows have 128-frame/equal-four-channel geometry, two stereo inputs and contiguous sequence numbers. Their cumulative sample count equals the complete original raw frame count.

Recomputing timestamp progression directly from the producer rows gives the exact same six errors as the initial capture validator: three repeated frame labels followed by three 256-frame increments. No row was dropped or rewritten. Whole control-left and control-right are byte-identical; each has RMS **0.05656874347149677**. Those observations independently verify that both channels contain the control signal, rather than merely having four-channel geometry.

The original status remains: `captureIntegrity.passed=false`, `coverage=null`, ten cases captured, zero accepted, calibration not analyzed, `sourceStable=true`, `completed=false`, `allCriteriaPassed=false`, and no cleanup errors. The source-identity result is separate from clock integrity. See original JSON `:4638` for capture integrity, `:74630` for the separate unmodified transcript and `:190788–190790` for source/aggregate state. These are not ten failed cursor measurements: no valid global capture was available for interpreting the calibration/cursor probes.

## Original raw locations

These offsets locate bytes by summing the lengths of received producer rows. That is how the original file was serialized; **it is not a corrected frame clock or repaired recording**. One four-channel frame occupies 16 bytes.

| Producer sequence | Declared frame | Original raw frame offset | Original raw byte offset | Relationship |
| ---: | ---: | ---: | ---: | --- |
| 6,700 | 857,472 | 845,824 | 13,533,184 | Repeats prior frame label; prior sequence 6,699 also says 857,472 |
| 6,701 | 857,728 | 845,952 | 13,535,232 | Frame label then advances 256 |
| 7,170 | 917,632 | 905,984 | 14,495,744 | Repeats prior frame label; prior sequence 7,169 also says 917,632 |
| 7,171 | 917,888 | 906,112 | 14,497,792 | Frame label then advances 256 |
| 7,406 | 947,840 | 936,192 | 14,979,072 | Repeats prior frame label; prior sequence 7,405 also says 947,840 |
| 7,407 | 948,096 | 936,320 | 14,981,120 | Frame label then advances 256 |

Compared with `arm.firstFrame + cumulative received frames`, only sequences 6,700 / 7,170 / 7,406 have an offset: each label is 128 frames behind that received-order coordinate. The immediately following row recovers that coordinate. This arithmetic helps describe the mismatch; it does not authorize substituting a new clock for the failed original.

## Independent control-phase comparisons

For each event and each control channel, a 307 Hz sine, cosine and DC component was fitted to the **preceding 1,024 original samples**. Those three coefficients were then frozen; no suspect/following samples were used to fit their own prediction. Prediction errors were calculated for both the normal received-order phase and deliberate phase offsets of −256, −128, +128 and +256 samples. Exact equality against the previous received block and one-sample steps across row boundaries were checked separately.

The preceding-sample fit RMS residuals were 3.96e−8, 4.46e−8 and 3.96e−8. Both channels give identical results because their original samples are identical.

| Suspect sequence | RMS error, continuous received-order phase | RMS error, phase −128 samples | RMS error, phase +128 samples |
| ---: | ---: | ---: | ---: |
| 6,700 | 7.68e−8 | 0.03828334 | 0.03589655 |
| 6,701 | 8.37e−8 | 0.03589669 | 0.03682479 |
| 7,170 | 5.76e−8 | 0.03641520 | 0.03912625 |
| 7,171 | 8.33e−8 | 0.03912638 | 0.03990968 |
| 7,406 | 8.07e−8 | 0.03998536 | 0.03783987 |
| 7,407 | 9.16e−8 | 0.03784003 | 0.03578152 |

Every suspect control block differs from its immediately previous received control block. The local model predicts the next samples through both the duplicate-labeled and skip-labeled rows with about 10−7 RMS residual, whereas the specific 128-sample phase-jump alternatives differ by about 0.036–0.040 RMS. Maximum one-sample boundary-step residuals in the inspected neighborhoods are 2.66e−8, 3.19e−8 and 1.21e−8. There is no control-waveform block restart or corresponding phase discontinuity at these boundaries.

The unique independent JSON retains the original producer neighborhoods, exact raw offsets, all 128 original control-left samples for each of six neighboring rows per event, per-channel sample hashes, first/last sample values, all alternative phase residuals and boundary-step measurements. Control-right identity is checked against original samples. All computations read the complete original raw; no alternate audio file was rendered or exported.

## Supported and unsupported conclusions

- **Supported by executed comparisons:** for these specific three events, a repeated timestamp is not a repeated independent-control PCM block; the following timestamp skip is not a 128-sample skip in that control's observed phase. Received sample order gives the phase-continuous interpretation of these neighborhoods.
- **Still failed:** the declared global armed clock/fence criterion. A smooth independent tone cannot turn invalid row timestamps into valid release/cursor timing. No calibration, case or interval is promoted by this diagnosis.
- **Not established:** deck-left/deck-right cursor or phase continuity, correct source-clock mapping, absence of all possible audio faults, or behavior under other runs. The periodic control distinguishes these particular 128-sample hypotheses; it is not a nonperiodic deck-position oracle.
- **Cause unknown:** the evidence does not identify a renderer, browser, operating-system, CPU-load, worklet-global, transport or DSP defect. In particular, the result alone does not justify blaming Chromium or changing production keylock code.

If the parent separately examines wholly contiguous subintervals, they remain diagnostic excerpts from this failed run and must retain the failed global status. A future capture or measurement strategy needs its own declared clock/integrity criterion and new artifacts; this analysis does not rewrite the old criterion after the result.

Independent result JSON SHA-256 at freeze: `4cf23c0f75ac813727b31ef64bcbb988445cd7dc88559a3bb88445c914ace154`. All initial failures, exact timestamps and original raw samples remain unchanged.

Skills applied: adversarial-verify, dec-quality-testing, dec-software-principles.
