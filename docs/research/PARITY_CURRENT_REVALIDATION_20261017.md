# Current Serato parity revalidation — 17 October 2026

**Open Play 0.1.6 is not yet a 1:1 functional or visual match for Serato DJ Pro.** This check revalidates the current package, inventory and evidence. It does not substitute source accounting for executing every behavior.

The current [official production page](https://serato.com/dj/pro/downloads) still lists 4.0.10. Fresh REA inspection identifies the installed reference as 4.0.10.213. Nine previously documented 5.0 beta deltas remain separate; this unit did not install or re-review that beta. See [fresh source observations](PARITY_CURRENT_REVALIDATION_SOURCES_20261017.json) and [REA records](PARITY_CURRENT_REVALIDATION_REA_20261017.json).

The [full matrix](CURRENT_PARITY_AUDIT_20261017.md) accounts for 110 groups and 522 unique requirements. These are the known baseline, not proof that discovery is exhaustive: semantic review of the 168 mapped manual articles remains unfinished. The separate 26 release checks include 24 macOS obligations and two Windows reference cases. None has full parity acceptance.

| Area | What exists and its evidence boundary | What prevents a match |
|---|---|---|
| Decks, library, mixer | Real local audio playback, cues, loops, rate, mixing and imported-file persistence have dated scoped tests. Current package source matches all 222 prototype files. | Full codec/tag/metadata/relocation/interoperability matrix, Smart Sync beat/phase/takeover, compound states and long sessions. |
| Effects | All 59 independent named DJ processors, including the requested 55, and four Channel processors have scoped control/audio evidence. | Exact Serato ranges, modes, presets, parameter response, sound and full chain/compound acceptance. A processor with the same name is not sonic equivalence. |
| Stems and keylock | Actual SCNet inference and actual Signalsmith processing are implemented. Current0.1.6 has actual synthetic MIDI Key Shift UI/recording/restart evidence. | Retained stem reconstruction error3.025% exceeds3%; other-source SI-SDR−1.01dB. Native+2left keyshift error1.046193Hz exceeds the fixed1Hz limit. Cursor cohort failures/unaccepted cases remain. These are independent fixture gates, not Serato sonic comparisons. |
| Hardware and audio | Historical user-confirmed Hercules browser knob and both headphone/master isolation directions; current0.1.6 adds synthetic mapping behavior. | Full38-requirement Hercules mapping/jogs/pads/modifiers/LEDs/reconnect/latency. DVS, HID/CDJs, Phase and named other devices have no full acceptance. Historical physical confirmations do not automatically transfer to0.1.6. |
| Link and streaming | Panels let users explore connection/failure states. Local playback is independent. | Link is a local state simulation; provider catalogs/access are fabricated fixtures. Real sessions, provider playback and failure recovery are missing. Serato documents real network peers and shared tempo in [Using Link](https://support.serato.com/hc/en-us/articles/228009728-Using-Link). |
| Recording and inputs | Real postmaster MediaRecorder captures and native Save exist, with retained complete recordings. | Serato documents MIX recording after channel faders/EQ and before master gain in [Recording Audio](https://support.serato.com/hc/en-us/articles/223459407-Recording-Audio). Open Play's selected actual source connects master output to the recording destination. Full pre-master/input/format/bit-depth/split/recovery contracts remain open; mic/aux paths include simulations. |
| Video | Actual decode/GPU/capture paths, scoped browser MIDI tests and a current native text-opacity/restart subset exist. | All72 MIDI workflows, encodings/compound/error paths, external display, resource handling and full manual/REQ-516 acceptance remain unverified. |
| Visual parity | Fresh native0.1.6 read shows Vertical mode, two decks and the paused main view. | Text mode tabs, compact loop controls and an always-visible full-width mixer still reflect the earlier documented reference-state differences. No fresh matched-viewport Serato comparison or all-layout acceptance is claimed. |

## Checks executed in this unit

- Reopened six official pages: production downloads, product, manual index, Smart Sync, Link and Recording. Did not fetch all168 articles or declare the inventory exhaustive.
- REA re-read the installed reference plist and statically parsed three actual0.1.6 ASAR sources. It parsed all three without parse failures and left740 inventoried files outside semantic analysis. The separate partial-graph Link literal trace had no match; that is not evidence of absence. The actual Link branch was inspected directly.
- Rehashed all169 audit snapshots,37 current-feature inputs and the0.1.6 candidate's7source/43evidence references. Compared actual ASAR payload bytes with all222 current prototype files; no mismatch.
- Reconciled110unique groups/522unique requirements, per-feature Codex/Claude routing,9separate beta deltas and26release checks. Full-requirement flags remain46explicit false/476unset/0true; no unreviewed flag was promoted to a failure or a pass.
- Read the running native0.1.6 main window without changing playback/settings: correct title/origin,0decks playing,44100Hz,Vertical/two-deck state. [Fresh screenshot](../prototype/screenshots/desktop-0.1.6-parity-revalidation.jpg) and [full accessibility state](../prototype/desktop-0.1.6-parity-revalidation-state.txt) are retained. This read is not a playback, physical routing or audio-quality test.

The [reproducible checker](../../scripts/revalidate_current_parity.py) writes [complete machine-readable results](PARITY_CURRENT_REVALIDATION_20261017.json). Its accounting success is not a feature parity pass. It initially stopped on a mistaken checker assumption about which handoff owns the original prompt suffix; the test was corrected, with no product/handoff change to satisfy it. The full Claude audit handoff still ends with the exact20,996-byte original prompt/SHA699d5f15…; rolling current.md references it.

## Corrected reporting defect

Independent review found that DEK-007 still said Key Shift was “not packaged native.” That absence applies to preserved0.1.5. Current0.1.6 packages the controls and has the bounded synthetic native subset above. Corrected the generator and current matrix; also qualified the analogous release-check JSON sentence as historical0.1.5. Four previous matrix artifacts are preserved as `*_PRE_REVALIDATION.md/json`. No product source, bundle, raw recording, quality limit or acceptance flag changed.

[Initial independent review](PARITY_CURRENT_REVALIDATION_REVIEW_20261017.md) records the pre-correction finding. A separate final delta review checks the corrected output. Neither review executes all features or substitutes for the unlaunched full Claude completeness audit.

Next: diagnose the retained pitch error by separating exact source PCM, actual stretcher output and recording path under the unchanged1Hz gate. Then expand native/physical control coverage and the remaining feature/reference comparisons. The terminal criterion remains end-to-end visual and functional evidence for every reconciled requirement; it has not been met.

Skills applied: use, gap-analysis, dec-quality-testing, adversarial-verify, claude-codex-handoff, verified-done.
