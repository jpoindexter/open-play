# Current parity revalidation — 17 October 2026

Skills matched (5): use, adversarial-verify, gap-analysis, dec-quality-testing, dec-software-principles.

**Both bounded claims survive independent refutation: full current Serato parity is not established, and the current evidence accounting is internally consistent. One stale packaging-absence sentence needs correction.** This review executed source/actual-ASAR comparisons, byte/hash/counter checks and saved-evidence inspection at branch reference **be2db05cb966cd6f1189bd5d2676f50d339eed72**. It did not operate the paused0.1.6 app, devices, reference application, Git, services or generators. Only this new owned review was written. The gap-analysis workflow was restricted to the expressly requested read-only scope; no implementation phase or unrelated audit expansion was performed.

## Confirmed wording defect — DEK-007 current packaging

**P2, documentation/current-state clarity:** `scripts/audit_current_parity.mjs:70` still says the browser MIDI Key Shift subset is **“not packaged native”**. Its generated DEK-007 row repeats this at `docs/research/CURRENT_PARITY_AUDIT_20261017.md:64`, then later in the same row correctly describes current0.1.6 packaging and synthetic native behavior. The unqualified absence sentence is stale. The old four-deck browser recordings remain tied to their historical candidate, but the corresponding implementation is now packaged in0.1.6.

Smallest correction: explicitly scope that sentence to **preserved0.1.5**, then point to the separate current0.1.6 native subset. Do not transfer all four-deck browser audio acceptance into native; do not upgrade full mapping, physical or pitch accuracy. Parent was notified; no shared correction was made by this reviewer. The correct baseline/current distinction is already present in the audit opening (`:5`), CA-11 and feature-check report. This wording conflict is not a hash/count defect or evidence of full parity.

## Claim 1 — incomplete parity: confirmed from actual paths

These source checks are deliberately differentiated from the saved runtime evidence:

| Area | Direct source or artifact evidence | Defensible conclusion |
| --- | --- | --- |
| Local media storage | `prototype/local-audio-library.js:37` saves original bytes plus hash-identified catalog/media in one transaction; `:47` re-reads bytes and validates identity. | Real storage implementation, with scoped saved native restart/playback evidence. This source inspection alone does not execute persistence, all formats, crashes, eviction or disk-full recovery. |
| Provider playback | `prototype/engine.js:343` explicitly rejects `d.track.provider` at start. `prototype/panels.js:1783` searches a fixed three-item catalog; connect/cache handlers mutate local fixture status/arrays (`:1805`, `:1817`). | Provider UI state is simulated; no real provider playback follows from the controls. This finding relies on handler/engine behavior, not merely a simulation badge. |
| Ableton Link | State is a plain local object at `prototype/app.js:129`; join/tempo/peers/loss handlers only change local state and refresh at `prototype/panels.js:1375`. No engine Link call exists in those paths. | Local session fixture, not actual network peer synchronization. It must not be awarded real Link acceptance. |
| Sync | `prototype/app.js:817` toggles local sync and calls `engine.setRate` using the other track's BPM/rate. | Basic tempo match is implemented. That handler does not establish the complete leader/phase/takeover state machine; its explicit warning at `:826` agrees with the code. |
| Recording | `prototype/engine.js:75` routes masterInput through master gain; `:81` connects master to the recording destination. `:854` constructs a real MediaRecorder from that stream and gathers chunks. | Real **postmaster** recording, supported by preserved complete native recordings. It is inaccurate to call all recording simulated, or to award documented premaster/input/split/reference behavior from this route. The installed reference's actual recording tap remains unmeasured. |
| Cue/master output | `prototype/audio-monitor.js:40` builds/disconnects actual channel-merger routes; cue/master pair routing occurs at `:51`–`:56`. | Real audio graph behavior exists. This read-only check does not newly prove physical socket routing, device recovery or acoustic output. Historical user-confirmed0.1.3 hardware evidence retains its own scope. |
| External device modes | `prototype/app.js:1287` changes mode metadata and explicitly retains internal playback; `prototype/panels.js:1475` changes connected/LED fixtures. | Mode controls and enumeration do not prove DVS/CDJ/HID/Phase or complete Hercules control/feedback. |
| Current native MIDI/Video | Frozen0.1.6 candidate and independently inspected original output/export artifacts retain the real synthetic main-app subset and restart outcome. | Useful native behavior exists; source registration of84 choices/72 Video targets is not acceptance of all corresponding workflows. |
| Known accuracy failure | `docs/prototype/desktop-0.1.6-midi-audio-independent-results.json:199` retains +2-left371.458669Hz versus370.412476Hz, error1.046193Hz against1Hz, `passed:false`. | Strict declared fixture accuracy is not met; three other channel checks pass. This is not a newly measured Serato sonic difference, physical MIDI failure or identified DSP/decoder/clock cause. |

To ensure these are the current **packaged** paths, independently extracted `engine.js`, `app.js`, `panels.js`, `audio-monitor.js` and `local-audio-library.js` from the actual0.1.6 ASAR and byte-compared each to the inspected source. All five match. Their SHA-256 values are respectively `b4683c245c6314432c06f891e85106cf0a1a5c0a615435516930ab5b38f64adf`, `abc0e15d47fb1546cde931c21072d9dbd6f4d78ba1c65cab0fc5841b12cf02bf`, `0515787f6b8ef326d11133b8cdd6d80972807ad8ef03d0b26ad3a62b7fb0d171`, `31a07bd6277bf19ec05495d207f7228505c8c948a9314531702706596bf4eada` and `38814be027c5a4e614d972ffd814df9760106ca27e374a288a0ccc3d6bca0a21`.

The saved audit also retains the SCNet3.025% reconstruction miss against3%, distinct cursor-clock invalid runs at zero accepted and the separate valid73ms5/10 run. Those failures were read as frozen evidence, not rerun or transferred between candidates. None is converted into a general claim that every stem/keylock feature fails. Conversely, real inference, audio processors, playback and native recordings cannot prove exact sound, first-sample cursor, full compound/hardware/visual or reference acceptance.

The recorded reference artifact identifies **Serato DJ Pro4.0.10.213 arm64**, executable SHA `1df36a8907bf3034b174aeab7c6ceb46a87493f78704c14934eb7210e3fdd2f5`. This review checked its stored identity records; it did not freshly inspect the installed binary/UI or browse the vendor. Therefore this is a current local deliverable/evidence revalidation against that identified reference scope, not new reference runtime or exhaustive latest-version discovery.

## Claim 2 — accounting/identity consistency: confirmed

Executed independent hash/counter checks:

- **169/169 audit source/document snapshot hashes** match current bytes. Audit JSON SHA: **`033ff5735eb238adcf314f77c643d09ab290a7f303a7cf9068b4da9f9859cf0c`**.
- **37/37 feature-check input hashes** match. Feature JSON SHA: **`718a9315f955be6f2a946c049a9b85e4920970219d3b44029666a8690ae91e3d`**.
- 0.1.6 candidate SHA remains **`bacd75509fd3c40dbbea0038a684eb6c1dc46f44363024444d89580dddcde8de`**. All **seven source entries+43 evidence entries+preserved0.1.5 manifest** match. Both current report objects embed that exact0.1.6 candidate.
- Actual0.1.6 ASAR remains **`f9e85d9ef3150fd37c15f5b3d72a4e3f6a06a42a59bf29617a43bdf566cdba6e`**. Current source commit isdd068e4; original approvalf8b0abf and preserved0.1.5/48a6d4d/ASAR251bcc16 remain separately identified. Package identity is not inferred from a window label.
- Parsed actual inventory contains **110 features and522 unique requirements**; all audit requirement IDs equal the actual inventory IDs. Delivery registry independently contains110 unique feature IDs.
- Audit has **110 false full-feature flags**; requirement reference-parity flags are **zero true,46 false,476 null/unset**. Current classes total110:68 subset,21 simulation/backend-gap,two subset+wip,nine engineering-unverified,seven physical-subset,two observed-mismatch,one reference-unresolved. No requirement or feature completion percentage follows.
- **Nine separate beta deltas** remain uninstalled/unexecuted; **26 unique provisional release checks** remain separate, with24 macOS andtwo Windows reference checks (REL-07/REL-18). All26 full-parity and reference-runtime flags are false; release passes remain zero. REL-05 explicitly stays a native synthetic subset with audio accuracy incomplete.
- Actual branch ref was read as **be2db05cb966cd6f1189bd5d2676f50d339eed72** without running Git. Generated `git_head:dd068e4…` is the explicitly dated precommit generation snapshot, not a fresh claim of live HEAD. Its source/document hashes still match at the inspected checkpoint; regeneration solely to change this historical snapshot would not add behavior evidence.
- Latest plan section63 remains the byte-identical prefix of both handoffs. The complete Claude handoff still ends with exact **20,996-byte** PROJECT_PROMPT, SHA **`699d5f1556d148800fda22362be86b6f4acdcaac06dca0f5801b025af1291c8e`**. Full Claude completeness audit is still unlaunched; recommended models are not execution or live-catalog claims.

## Verdict and re-entry

Findings submitted for these two claims: **two confirmed**, neither refuted. Additional defensible wording finding: **one stale packaging sentence**, reported above; it does not invalidate the hashes or promote any acceptance. Current0.1.6 is not the old eight-target package, and old0.1.5 evidence must not be relabeled as new runtime. Parent should correct only that historical wording and retain the original browser/native candidate boundaries.

No full-feature, requirement, release, physical, all72/REQ-516, musical or reference acceptance was earned by this review. Its executed Done criterion is bounded source/ASAR/hash/counter refutation and saved-evidence consistency, not the project's all-features end-to-end criterion. No generator/test writer, native/UI/device operation, shared-file edit, Git or Trello action occurred; paused0.1.6 remains untouched.

Skills applied: use, adversarial-verify, gap-analysis, dec-quality-testing, dec-software-principles.
