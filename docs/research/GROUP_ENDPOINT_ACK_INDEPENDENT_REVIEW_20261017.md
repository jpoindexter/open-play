# Endpoint markers and append ACK accounting: independent review

**Verdict:** endpoint evidence remains **0/6 accepted**, with all six duration failures and one of 144 centroid checks outside 10 ms. The accounting change passes its bounded controlled cases. A malformed-ACK counterexample was reproduced against `5f787e`; the parent’s subsequent finite-number guard rejects those same cases under independent execution. No browser/native/audio-quality acceptance follows from the ACK tests.

## Endpoint evidence executed

Ran the uniquely owned inspector against all original inputs/outputs. Verified plan/result agreement, script/library/C and C++ header hashes, six whole output hashes and geometry, every retrieved frame count, **1,037,462 ten-channel output frames / 41,498,480 bytes**, and every decoded sample finite. Regenerated both four-second inputs from declared gate/fade/carriers/phases; the complete generated input bytes equal the saved 44.1/48 kHz inputs.

The source really feeds RealTime-mode CAPI from an offline Python loop: pad query, exactly 2,048 leading zero frames, 2,048-frame input blocks, final flag, drain to -1, and delete (`scripts/test_rubberband_endpoint_markers.py:28`–`:41`). API delay 1,825 is used only in analytical coordinates; the complete padded output is retained (`:42`–`:48`). This is not actual callback/deadline evidence.

| Sample rate | Rate | Whole output frames | Expected after API delay | Extra frames |
| --- | ---: | ---: | ---: | ---: |
| 44,100 | 1 | 182,165 | 176,400 | 3,940 |
| 44,100 | 1.08 | 168,809 | 163,333 | 3,651 |
| 44,100 | 1.25 | 146,526 | 141,120 | 3,581 |
| 48,000 | 1 | 197,697 | 192,000 | 3,872 |
| 48,000 | 1.08 | 183,355 | 177,778 | 3,752 |
| 48,000 | 1.25 | 158,910 | 153,600 | 3,485 |

Independently recalculated all **144** energy centroids using the fixed windows and exact input-energy centroids divided by rate, with no searched timing/gain fit. All recorded values agree within 1e-12 seconds. The sole failing check is **44.1 kHz / rate1.08 / first marker / channel8**: expected **0.231471077622 s**, measured **0.242179683490 s**, error **+10.708605868 ms**, exceeding the unchanged 10 ms criterion. Marker geometry and formula are explicit at source `:43`–`:46`.

Recalculated every whole extra-tail channel’s RMS/peak and nonzero count. All six extra tails contain nonzero samples, with maximum peak per case **0.006443154, 0.006013504, 0.004247633, 0.006411735, 0.005346976, 0.004140825** in table order. No tail trimming or duration regrading is justified by claiming those tails are entirely silent. An energy centroid describes the gated signal’s temporal energy distribution; it does not establish first audible sample, exact source cursor, or an internal library cause.

## ACK boundary executed and counterexample resolved

Compared frozen engine adapter `69e4d930…` with accounting candidate `5f787e315d112c25d224dc4a471b930d2d6b19873b8c2b433f5563bdf04643a2`: the scoped change moves `group.chunks.push` past successful append ACK, ownership and extent checks. Reservation remains before copying, and `finally` releases it (`experiments/keylock-soundtouch/group-live-adapter.js:78`–`:79`). These are reserved/accounted byte counters, not measurements of heap allocation or physical memory release.

Reexecuted the parent actual-class test into a new ignored report path: **4/4** for success, rejection, wrong extent and abort. While first append is pending, retained=**0**, in-flight=**960,000**. Success reports retained=**15,360,000**, in-flight=**0**; all terminal states report **0/0** (`scripts/test_group_adapter_ack_accounting.mjs:25`–`:34`). The actual class is imported with only factory substitution and an added test export; AudioBuffer/Gain/ACK collaborators are controlled.

Fresh counterexample against frozen `5f787e`: ACK values **NaN, undefined, numeric-string** all resolved preparation, posted 16 appends and falsely counted **15,360,000** retained bytes. `Math.abs(extent-expected)>tolerance` admits NaN and coerces strings. The independent result preserves all three RED records and the exact original source text; it does not claim the real processor emitted these invalid values.

Parent revision **`b82a073039a4b710dcfa789b91c20389f351b3bb06fde4466b97ec13a592f7ea`** adds only `!Number.isFinite(extent)` to that check. Independently verified that exact one-condition delta and reran all three counterexamples: **3/3 reject at the first append**, retained/in-flight remain **0/0**. Reexecuted the original controlled accounting cases again: **4/4**. Original RED evidence stays in the same independently owned result beside the explicitly separate resolution. No historical browser cohort is credited to this changed source.

No remaining defect was demonstrated within these tests. They do not establish actual transfer/detachment, processor heap cleanup, browser cancellation, sonic behavior, native integration or full Claude audit completion. Duration/centroid failures, earlier cohorts and native017 remain unchanged.

Inspector SHA `8234a7afe3d430f5f211315a45a081b9f40a40e9d71a2874906cf594e97b0bc0`; independent result SHA `65d19b8c76ad2b8741a63ba136483703ad5faabd2f916182066d91c4103409ee`.

Skills applied: use, adversarial-verify, systematic-debugging, dec-quality-testing, dec-software-principles.
