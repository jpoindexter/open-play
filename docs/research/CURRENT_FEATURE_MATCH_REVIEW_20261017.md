# Independent current-feature recheck review — 17 October 2026

**Confirmed for the recorded Open Play 0.1.5 candidate:** its MIDI mapping target workflow offers neither Key Shift nor Video targets. The saved native menu, AX evidence and exact packaged source agree. **No full-feature or release-case runtime pass follows.** The release accounting remains provisional, with 24 macOS checks and two Windows-only references. The full 110-group / 522-requirement baseline and nine separate beta deltas remain unchanged.

This reviewer independently read the saved screenshot/AX, source and generated reports, verified actual artifact/package bytes, and reopened the official download page. Native interactions and REA collection were the parent's observations; this reviewer performed no GUI, device, Git, reference modification, product edit or shared-report regeneration. No cursor/clock/FX/stem evidence was rerun or overwritten. Only this new review was written.

## Bounded MIDI verdict

| Claim | Verdict and exact evidence |
| --- | --- |
| The observed target menu has eight choices and no Key Shift or Video choice | **Confirmed.** `local-evidence/parity-recheck-20261017/open-play-0.1.5-midi-targets-ax.txt:3–20` lists the same eight entries twice in two AX menu representations, not sixteen distinct targets. The saved `docs/prototype/screenshots/parity-current-midi-targets-0.1.5.png` visibly shows the complete eight-choice menu in the native 0.1.5 window. |
| Source agrees with the captured native target list | **Confirmed.** `prototype/panels.js:1621` enumerates exactly Library browse, Deck 1/2 play, Deck 1/2 cue, Crossfader, Sampler 1 and FX depth. These exact bytes also occur in the actual 0.1.5 ASAR. |
| The mapping dispatcher implements Key Shift/Video handlers | **Refuted for this dispatcher.** `prototype/panels.js:1557–1606` dispatches the listed play/cue, crossfader, browse, sampler and FX-depth actions; no corresponding Key Shift or Video action exists. Learning only captures message/channel data (`:1547–1555`), and Add mapping persists the selected target (`:1650–1659`); neither supplies a hidden target handler. |
| Therefore all MIDI behavior or the Key Shift/Video features themselves are absent | **Unsupported inference.** The finding concerns this mapping target workflow. Existing limited MIDI actions and prior physical browser-knob evidence keep their original scope; they do not establish other targets. Conversely, lack of a MIDI target does not refute existing pointer/keyboard/DSP functionality for those features. |
| This check exercised Serato MIDI Key Shift, changed mappings or connected hardware | **Not established and not claimed.** `current-feature-check-native-observation.json:4` describes inspection without those actions; its limits explicitly exclude reference MIDI runtime and new hardware acceptance. The saved screenshot displays the retained browse mapping and disconnected state, not a new successful physical test. |

The [official Serato download page](https://serato.com/dj/pro/downloads), independently reopened during this review, identifies 4.0.10 and lists a Key Shift MIDI-mapping correction among its bug fixes. That supports treating Key Shift mapping as a current-reference regression obligation. It does not prove Serato's installed runtime behavior or independently establish Video mapping semantics. Video target absence in Open Play is direct candidate UI/source evidence, not an inference from that release note.

One nonblocking citation correction was sent to the parent: the generated target-list link and JSON source evidence point to `panels.js:1622`, which is the following callback; the actual list is on **1621** (`scripts/check_current_release_parity.mjs:62`, `:102`). Dispatch line 1568 is a reasonable entry into the relevant dispatcher, whose action branches continue through 1605. No production change is needed to correct the citation.

## Scope and proposal accounting

**Confirmed without awarding passes:** the 26 distinct provisional rows comprise one current feature, one driver-update group, 17 current regression checks and seven recent-update subjects. The official page separates its recent-update section from its current-release feature/driver/fix sections. The report correctly does not claim that all recent subjects debuted in 4.0.10 (`CURRENT_FEATURE_MATCH_20261017.md:22`; generator `:21–23`, `:24–51`). The 12 named driver devices match the current page's driver list; they are subcases of one grouped obligation, not twelve newly canonical requirements.

The latest correction properly makes REL-07 and REL-18 Windows-only reference rows, outside macOS parity acceptance. The generated JSON therefore records **26 total = 24 macOS + 2 Windows-only reference** (`scripts/check_current_release_parity.mjs:56–59`, `:84`; Markdown `:3`, `:53`). Platform-specific observations are not macOS implementation gaps. No Windows behavior was executed here.

All rows retain `reference_runtime_verified:false`, `open_play_full_parity_verified:false` and the separate provisional namespace. One row records the observed missing target, two record Windows-only scope, and 23 remain unexecuted for that release case. `release_checks_passed` is zero. No row is promoted from a label, matching file hash, existing unrelated audio test or menu inspection to full parity (`generator:55–62`, `:81–91`).

Independent read-only checks confirm 110 registry entries, 110 audited groups totaling 522 requirements, and nine beta deltas in their separate file. The report marks `not_exhaustive:true`, `complete_latest_inventory:false` and `full_parity_verified:false`. Its remaining-gates text does not claim that enumerating these release notes completes the current product inventory (`Markdown:55–63`). This is evidence reconciliation, not an all-feature runtime recheck.

All **73 feature-to-routing links** in the release rows resolve to valid existing feature IDs and exactly copy their registry routing, including both Codex and Claude Code model/effort objects. REL-05 maps appropriately to HW-002 and DEK-007. These are implementation/review recommendations, not proof of live model availability or agent execution; the report explicitly says so (`Markdown:22`; generator `:54–60`). No new routing recommendation or external card update was made by this reviewer.

## Exact identity checks independently executed

- All **200** candidate-listed production prototype files match their candidate hashes locally **and** bytes extracted from the actual ASAR. The packaged production file set has zero missing or extra files. This verifies source correspondence, not behavior.
- The actual ASAR SHA-256 is `251bcc16caf9cfb42a3967db058717373a8c6fcb9ff97d56c330058ec8301b03`. Actual `BUILD_PROVENANCE.json` and packaged metadata identify source `48a6d4dad2f217a8ba166b9ca890a287aabc4feb`, host 0.1.5 and the separate original approval `f8b0abf33c8e8468c7bec27eabc5be2930ed0086`. The report's Git-head field is a distinct accounting revision; this reviewer ran no Git command and did not conflate it with packaged source.
- All five observation artifacts match their recorded hashes and byte lengths. In particular, the target screenshot SHA-256 is `541c33148c57f50d6ed368896508a18850ad592857b01731f2ea68be50b7a02a`, and the target AX SHA-256 is `1cc28b3d1a2c7bc25e1456ab4fc310f7b291cea953b730846ee392705b91fc93`.
- All nine generated report input hashes match their current files at the verification point. The generator itself was read, not executed: it writes shared artifacts and invokes Git, while this review is read-only outside its own new document.
- The installed reference's actual Info.plist identifies short version 4.0.10 / build 4.0.10.213. Independently hashing `/Applications/Serato DJ Pro.app/Contents/MacOS/Serato DJ Pro` reproduces `1df36a8907bf3034b174aeab7c6ceb46a87493f78704c14934eb7210e3fdd2f5`. That verifies artifact identity. Usage strings, URL schemes and a stem-file extension remain static declarations, not protocol/format or feature compatibility proof.

The production `panels.js` SHA-256 is `2063234fa4d209424ec94df373fca9d66eec23cc917302a8ee8dc27ee4b92d89`. Neither source nor package was edited. Reported native PID/title/action chronology was not independently rerun.

## Review snapshot and disposition

| Reviewed artifact | SHA-256 at verification |
| --- | --- |
| `scripts/check_current_release_parity.mjs` | `4eff9179c158d6989f222fc7c2a1162f19d3910d8ac74451781b74886da27637` |
| `docs/research/CURRENT_FEATURE_MATCH_20261017.md` | `5a6040c5a88a23f4947bd8c2dd2569602d319e348f66a140e271265171dad60c` |
| `docs/research/CURRENT_FEATURE_MATCH_20261017.json` | `adc859ba59725e5c026378a149a5b16376e4fca9fb1bebb3470713dae6d92128` |
| `docs/prototype/current-feature-check-native-observation.json` | `00d01c61b9b9101dc41dc752a946c84c83432a28483d99392419e70b1aca7101` |

**No blocking scope inflation found in these reviewed bytes.** The missing-target finding is defensible, and the platform correction preserves the macOS boundary. The next implementation unit may add actual target/dispatch and mapping-persistence behavior in a new candidate, then measure both decks' semitone response and isolation from tempo; the report's proposed test is not already executed acceptance. Preserve 0.1.5 and the existing browse mapping. Full current-reference reconciliation, native compound behavior and required hardware/service/quality gates remain open.

During finalization, the parent corrected both generator references to target-list line 1621 (`scripts/check_current_release_parity.mjs:62`, `:102`), yielding generator SHA-256 `14cc3b7a5f5597378f9ae26dad3f96f9c38e6e37fa69fee11fdbddbc74cafe4b`. This metadata-only correction was independently read; the table above identifies the prior reviewed generator/report snapshot. Generated Markdown/JSON still retained 1622 at that last read, pending the parent's accounting regeneration. No product bytes or acceptance conclusion change with this citation correction.

Skills applied: adversarial-verify, dec-quality-testing, dec-software-principles.
