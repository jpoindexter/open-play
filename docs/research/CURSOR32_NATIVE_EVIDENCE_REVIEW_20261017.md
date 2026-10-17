# Independent Cursor32 invalid-clock evidence review

17 October 2026. **The new single native Cursor32 run is invalid: zero cases accepted, calibration unanalysed, `completed:false`, `allCriteriaPassed:false`.** Its actual parameter values and independent control PCM continue through one duplicate/skip global-timestamp pair. This confirms disagreement between those global snapshots and the other retained render observations; it does not identify a cause, repair a clock or accept any cursor probe.

The parent executed the native Run/Save actions. This reviewer independently inspected both complete downloaded originals, every retained row/parameter/raw sample and exact source identities. No native rerun, UI/device/Git operation, production/harness/original/raw edit occurred. NEW inspector: `scripts/inspect_cursor32_invalid_clock_independent.mjs`; NEW result: `docs/prototype/cursor32-invalid-clock-independent-results.json`.

## Whole originals and unchanged failure

| Actual Downloads original → retained copy | Bytes | SHA256 |
| --- | ---: | --- |
| `open-play-cursor32-native-initial-results.json` → `docs/prototype/cursor32-native-initial-results.json` | 11,879,195 | `6430e6213827199a795dcdaeb50163d732f01346d558944475a43b611f126e19` |
| `open-play-cursor32-native-initial-complete.f32` → `local-evidence/cursor32-native-initial/complete.f32` | 15,759,360 | `79bb0d99f8aa9ea1057dbe039519d74d9966b5afbf13142a8f13eca64e27c245` |

Each retained copy is byte-identical to the corresponding original in `/Users/jasonpoindexter/Downloads/`. The complete raw has **984,960 frames ×four Float32 little-endian channels**, deck L/R then control L/R, at 44,100 Hz. All **3,939,840 samples are finite**; no trim, splice, timestamp substitution or alternate file was produced. Whole RMS is deck L .0706609613, deck R .0574038668, control L/R .0565689429; control channels are bit-identical across the whole file.

All **7,695** producer rows have 128 frames and complete four-channel geometry; sequence numbers remain contiguous. All **984,960** original parameter values were decoded from their original Base64 bytes, checked finite/active, and checked against every original row. Source identities before/after/current agree for **12 runtime files**; **11 pre-run manifest entries** also match. The manifest and original criteria are unchanged. Actual original case verdicts remain null, with no original calibration/probe objects: analysis was correctly blocked by the full gate.

## Exact clock disagreement

| Sequence | Original global frame | Expected next frame under original validator | Original raw frame offset | Raw byte offset |
| ---: | ---: | ---: | ---: | ---: |
| 7,249 | 927,872 | 927,872 | 906,368 | 14,501,888 |
| **7,250** | **927,872** | **928,000** | **906,496** | **14,503,936** |
| **7,251** | **928,128** | **928,000** after the repeated label | **906,624** | **14,505,984** |

The repeated label produces the same two strict-validator errors as the native report. Locating original bytes by cumulative received row lengths is a **file-offset calculation**, not permission to replace the global clock. The inspector retains all original labels and the original gate remains failed.

At sequence 7,250, the scheduled absolute parameter values begin **928,000** and progress through the next 128 samples, whereas the original global row label begins 927,872. Exactly **128 parameter samples** disagree with original row labels above the fixed .25-sample budget; maximum error is **128.0625 samples**. Outside this row, the values agree within .0625 sample. Parameter progression itself remains +1 within **.0625** across every within-row and cross-row step; no missing/constant/out-of-range parameter array occurs.

All four unqualified/globalThis frame/time forms and before/after snapshots agree with each other, including the one lagged global row. Maximum `time*sampleRate−frame` residual is only 1.1642e−10 samples. Thus alias agreement does not rescue the one-quantum discrepancy. The wrapper's top-level `errors:[]` is not evidence of validity: the original strict errors remain in nested `capture.errors`, and the explicit parameter mismatch count is 128. Overall `passed:false` is correct.

## Independent control PCM at the anomaly

For each original control channel, fitted a 307 Hz sine/cosine/DC model to **only the preceding 1,024 samples**, then froze its coefficients before predicting suspect/following rows. No suspect or following sample was used to fit its own expected continuation.

| Sequence | RMS residual, continuous received-order phase | Forced −128-sample phase | Forced +128-sample phase |
| ---: | ---: | ---: | ---: |
| **7,250** | **8.3907e−8** | **.0399380** | **.0376713** |
| **7,251** | **9.3473e−8** | **.0376715** | **.0357631** |

The preceding fit RMS residual is 4.0925e−8. Both channels give the same results because their original samples are bit-identical. Neither control block equals its immediately preceding received block; boundary-step prediction residuals are −1.2255e−8 and +1.9407e−8. Additional original neighbors and ±256-sample alternatives remain in the independent JSON.

These observations refute a repeated **whole control block** or corresponding ±128-sample control-phase skip at these boundaries. Together with the actual continuous parameter ramp, they strengthen the evidence that the two global row labels disagree with retained render progression. They do **not** prove every deck sample/cursor is correct, exclude independent source faults, identify browser/OS/WASM/CPU/global-getter/scheduler cause, or establish an independent hardware clock. It is not justified to label the issue exclusively a recorder defect or blame Chromium from this evidence.

## Separately authorized exploration — no accepted cases

After the full failure was established, the parent authorized conditional diagnostic fits only on complete original intervals before the anomaly. The inspector uses a conservative cutoff at the **earliest bad declared frame, 927,872**. Each requested .8-second interval must end before that cutoff; it is assembled solely from unchanged original frame/sequence rows and original raw byte offsets, with local frame/parameter agreement checked. No requested origin is shifted, and no suffix or intersecting interval is repaired or analyzed.

Exactly **ten intervals** qualify: the calibration-shaped interval and the first **nine** case intervals. The last different/throw interval reaches the invalid region and is excluded in full. All thirty eligible 400 ms fits are confident and meet unchanged numerical correlation/margin/10 ms predicates; all existing pitch/gap predicates also hold. Minimum observed correlation is **.87935**, minimum uniqueness margin **.08320**, maximum absolute fitted-position error **9.216 ms**, close to the 10 ms bound. No threshold was changed. Different/backward contains the largest errors, so no wide safety margin or broad quality claim follows.

Every exploratory row and probe explicitly has **`fullCaseAccepted:false` / `accepted:false`**; exploratory accepted-case count is **zero**. Original calibration remains unanalysed and the native cohort remains invalid. These numerical excerpts support only that the richer marker survives actual stretcher output in these pre-anomaly windows, beyond its earlier ideal-input tests. They do not establish the last case, complete calibration/cohort acceptance, exact first 15 ms/first-sample position, musical/compound/hardware/reference or main-product behavior. No exploratory fit is transferred into an accepted case.

## Blocker and next action

**Clock integrity is this run's actual blocker.** The valid-prefix diagnostic does not justify another identical native matrix, a threshold change, timestamp repair or production DSP fix. Freeze this evidence and keep the older globally invalid zero-accepted run and separate valid-clock 73 ms five-of-ten run unchanged. A future cursor acceptance experiment needs a separately declared, defensible complete clock observation and original exports; do not retrofit one onto this recording.

The conditional prefix supports keeping the 32 ms fixture available for future controlled work. It is not necessary to abandon the fixture based on ideal-only doubt, nor to treat this invalid run as successful keylock acceptance. The separately authorized main-app MIDI/package testing can continue while this clock diagnosis remains open; preserving desktop 0.1.5 and exact candidate boundaries is essential. The root cause of the recurrent timestamp disagreement remains **unknown**.

Skills applied: adversarial-verify, dec-quality-testing, dec-software-principles.
