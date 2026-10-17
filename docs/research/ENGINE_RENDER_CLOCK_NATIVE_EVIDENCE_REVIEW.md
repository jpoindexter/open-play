# Independent whole-original native render-clock evidence review

17 October 2026. **This NEW run has a valid full clock capture, accepted calibration and 5/10 bounded cursor cases; the other five remain unaccepted solely because seven marker probes lack uniqueness.** All pitch/gap/control criteria pass in the eleven inspected intervals. No confident position probe exceeds the unchanged 10 ms limit. This result does not explain, repair or supersede the earlier failed global-clock capture.

The parent executed the actual separate Electron diagnostic and native Save dialogs. This reviewer independently read both complete downloaded originals, checked the retained copies, decoded every raw sample and parameter byte, checked all producer rows/clock aliases, reconstructed all eleven intervals and reran the exact known analyzers. No GUI, device, production/harness, original raw, old report, Git or external service was changed.

## Original identity and complete geometry

| Original and exact retained copy | Bytes | SHA256 |
| --- | ---: | --- |
| `/Users/jasonpoindexter/Downloads/open-play-render-clock-native-initial-results.json` → `docs/prototype/render-clock-native-initial-results.json` | 12,466,037 | `adaf92cb1a75de8faee5dd6f12c28e8826566421fb9d2ad138aaf3e7f9a3f075` |
| `/Users/jasonpoindexter/Downloads/open-play-render-clock-native-initial-complete.f32` → `local-evidence/render-clock-native-initial/complete.f32` | 15,771,648 | `6a6d77ce74d9b37e8f5fcd4ac2d4a92aa6498bbfc25527a97a51741923b05572` |

Both retained files are byte-identical to their actual downloaded originals. The complete raw is **985,728 frames ×four little-endian Float32 channels**, deck L/R then control L/R, at 44,100 Hz, spanning approximately 22.3521 seconds. All **3,942,912 samples are finite**. No favorable interval, leading/trailing sample, failed case or parameter row was discarded.

| Channel | Whole RMS | Whole peak |
| --- | ---: | ---: |
| Deck left | 0.0706822111180 | 0.122111134231 |
| Deck right | 0.0588229169520 | 0.148126140237 |
| Control left | 0.0565689049997 | 0.0799999982119 |
| Control right | 0.0565689049997 | 0.0799999982119 |

Control L/R are bit-identical throughout the original raw. These are complete-recording statistics, not acoustic/output-route or musical-quality measurements.

## Every producer row and actual parameter observation

All **7,701** original rows have 128 frames, four equally sized PCM channels and two stereo inputs. Frames are contiguous from 21,504 through exclusive fence 1,007,232; sequences are 168–7,868 with no duplicate or skip. Cumulative received geometry equals the entire original file exactly. The declared preflight, arm and final fence independently pass the unchanged original capture validator as part of the conjunctive new gate.

The requested plan is start frame **20,352**, endpoint **2,666,352**, zero→2,646,000 over 60 seconds, with exact declared frame/time/rate relationships, all required own scalar fields, range below 2^22 and unchanged **.25 sample** measured-value budget. Every Base64 array was independently decoded and its real byte length checked against its original row. All **985,728 actual parameter values** are finite, length 128 per row and strictly inside the ramp. First value is **1,152.0001220703125**, placing arm approximately **26.12245 ms** after the declared ramp start, beyond the planned 25 ms guard.

Across all samples and all row boundaries:

- Absolute parameter-vs-original-frame mismatch count above .25: **0**; maximum error **.0625 sample**.
- Step-vs-+1 mismatch count above .25: **0**; maximum step error **.0625 sample**.
- Missing/invalid parameter lengths, out-of-ramp values, before/after changes and unqualified/globalThis alias disagreements: **0**.
- Maximum `currentTime*sampleRate−currentFrame` absolute residual: **1.1641532182693481e−10 samples**.

The independent output retains the complete signed-error histogram: 381,346 values equal their integer coordinate exactly; the remaining observed residuals are positive binary fractions from 0.0001220703125 through .0625. They were not rounded to zero or fitted away. The original new validator's numeric summaries exactly match the independent whole-array calculations.

This establishes agreement **within the declared budget in this one run**. Automation and clock aliases may share a backend. It is not an independent hardware clock, sub-quarter-sample physical timing proof, an explanation of the old three duplicate/skip pairs, or proof all future captures will be valid.

## Whole control signal and eleven reconstructed analysis intervals

An independent 307 Hz sine/cosine/DC model fitted only the first **4,096 original control samples**, then froze its coefficients and predicted all remaining samples in received order. Prefix RMS residual is **1.4044e−7**; whole RMS residual is **6.7573e−5** and maximum absolute residual **1.6567e−4**, identical for both channels. The maximum per-128-frame block RMS residual is **1.2330e−4**. These nonzero residuals remain recorded; no claim of mathematically exact full-run phase or universal fault absence is made. The control is periodic and does not identify deck position.

Every original **.8-second** calibration/release interval was independently reconstructed from its original global frame coordinates and the full raw, including its 50 ms pre-release portion. No fallback to a later window or received-order timestamp repair was used. All interval first frames, lengths and four channel hashes are retained in the independent result. The actual `inspectReturnPCM`, `inspectCursorProbes` and control metrics were recalculated for all **11** intervals, preserving unchanged thresholds and source identities.

All original boolean verdicts, lengths and classifications reproduce. Of **12,983 numeric diagnostic fields**, only eleven FFT dominant-frequency values differ between native V8 and Node by at most **2.2737367544323206e−13 Hz**. The inspector uses an explicit **1e−9 absolute numeric-comparison budget** for this cross-runtime diagnostic comparison; it does not alter any pitch, gap, cursor, correlation or uniqueness criterion. The initial strict-object-comparison exception is preserved separately in `docs/prototype/render-clock-native-inspector-numerical-initial-failure.json` and is an **inspector-only numeric-equivalence issue**, not an audio/capture failure.

The final inspector also independently recalculates every recorded hold duration, desired release position, release-ACK error/10 ms boolean and quick≤50 ms flag from the recorded stimulus/ACK metadata. Those agree exactly. Metadata consistency is not an independent physical first-sample cursor observation.

## Accepted and unaccepted cases

Calibration passes all three probes, with errors −0.5/−0.5/−0.75 ms and uniqueness margins above .04. Of the ten cases:

| Region / gesture | Bounded case | Unconfident probe offsets and margins |
| --- | --- | --- |
| same / stationary | Accepted | None |
| same / forward | Accepted | None |
| same / backward | Unaccepted: uniqueness | 0 s: .030045688 |
| same / quick | Unaccepted: uniqueness | 0 s: .010912580 |
| same / throw | Unaccepted: uniqueness | 0 s: .002561865; .05 s: .019024064 |
| different / stationary | Accepted | None |
| different / forward | Unaccepted: uniqueness | .05 s: .037011407 |
| different / backward | Accepted | None |
| different / quick | Accepted | None |
| different / throw | Unaccepted: uniqueness | 0 s: .020685847; .05 s: .039623340 |

All seven unconfident probes have correlation above .8 but margin below **.04**. A good score or nearby best fit does not supply missing uniqueness. The different/throw .05 s margin is below the threshold by about .000377, vastly larger than the observed floating-point reanalysis differences; it cannot be rounded into acceptance.

The same/backward first probe's best global alias is about **7.079 seconds** from the desired position, but its margin is only .03005. This is **an ambiguous marker fit, not a proved seven-second audible return error**. Likewise, nearby but unconfident fits are not proved correct audible positions. All **26 confident probes** across calibration plus cases fall within the unchanged 10 ms budget; no confident wrong-position probe appears. First-sample timing is not measured by these 400 ms fits.

Every one of the five existing pitch/gap criteria passes in each of the eleven intervals: **zero pitch-criterion failures**, zero raw-pitch windows and valid control L/R. The largest observed 1 ms-binned low-RMS gap is approximately **1.9955 ms** in same/throw, below the unchanged 20 ms budget. First correct 40 ms FFT windows begin at 0–approximately 10 ms after the recorded release request. These are the original window/RMS criteria; they do not establish instantaneous continuity, exact earliest cursor or musical quality.

Thus the correct aggregate remains **`completed:true` and `allCriteriaPassed:false`**: the run captured all ten cases with valid integrity/source identity, but only five cases satisfy every cursor criterion. No failure is hidden by counting successful pitch as successful cursor acceptance.

## Reproducibility and source cohort

NEW inspector: `scripts/inspect_render_clock_native_independent.mjs`. Final NEW result: `docs/prototype/render-clock-native-independent-final-results.json`. The earlier result without the additional stimulus/ACK-flag recalculation remains separately retained as `render-clock-native-independent-results.json`; neither original parent report was changed.

All **12** runtime source hashes match before/after and current files; all **11** pre-run candidate entries match current files. In particular observer `00ca498588fae8f2e19728139f1d38cf40d7480cb48e35645436bddbca372627`, harness `5db1b8d3340628f1d0a007ca13990713e58b586f2d070974cc5302cb798764b1` and production engine `b4683c245c6314432c06f891e85106cf0a1a5c0a615435516930ab5b38f64adf` retain their frozen identities. There are zero fatal/cleanup errors in the original report. This checks the stated cohorts; it is not a new transitive-dependency, package-security or native-process/UI audit.

The earlier raw `189c5708…` and report `98f01475…` remain the earlier **globally failed, zero-accepted** experiment. The new good observation uses a different test recorder and run; it does not assign a cause to old clock anomalies or retroactively permit their cursor analysis. Next evidence work can investigate marker ambiguity on these preserved valid intervals without changing criteria, fitting away uncertainty, modifying production or rerunning the same matrix merely to seek green. Full keylock composition, music, reference/hardware parity and the wider project remain open.

Skills applied: adversarial-verify, dec-quality-testing, dec-software-principles.
