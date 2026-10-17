# Native 0.1.6 postrestart artifact review — 17 October 2026

Skills matched (4): use, adversarial-verify, dec-quality-testing, dec-software-principles.

**The bounded postrestart screenshot/export checks pass.** Independently decoded complete reopened originals: the frozen output-text ROI retains the initial **8,318-pixel** bright mask and exact decoded region bytes; the subsequent off screenshot has **zero** bright pixels. The restored mapping export is byte-identical to the initial original export. Saved parent OS/UI observations support a clean new-process restart and subsequent synthetic mapping behavior, but this reviewer did not operate or independently observe that native runtime. The prior **+2-left 1 Hz audio criterion failure remains open**, with no new audio accepted here.

## Executed original artifact comparison

Used the unchanged ROI **[2100,1370,2750,1510]**, predicate each RGB component **>180**, and initial baseline from `docs/prototype/desktop-0.1.6-video-pixel-plan.json:4`. No new threshold/region or replacement initial baseline was selected. All original screenshots fully decode at **2880×1898**; bytes are **JPEG despite `.png` filenames**, preserving the initial review's format correction.

| Original, under `docs/prototype/screenshots/` | Encoded bytes | SHA-256 | ROI bright pixels |
| --- | ---: | --- | ---: |
| `desktop-0.1.6-video-output-baseline.png` | 636,950 | `09b5b05772f766acad24884dc9a3db3c3924842c513228d44ab6d4a5680207ba` | 8,318 |
| `desktop-0.1.6-video-output-reopened.png` | 658,268 | `9c6f6125f6cca42740206b193d7872084cd3dcafa3748d05a38fccff789e5485` | 8,318 |
| `desktop-0.1.6-video-output-reopened-off.png` | 648,838 | `96222a0f721d3ed955f1be3dc8de8ae186abc93213f1f82b3c275856041d4aaf` | 0 |

The reopened text bounding box equals the original **[2154,1413,2628,1466]**. Its bright-mask SHA equals the original `389a1242bd6bf4dc5f527bc6828078ac7c1ad64be4ea025aeddccdcee204ba89`. Complete decoded ROI SHA also equals the original `c290b61c9fd858c25a3bc53c47342b020158f7adf2b28955c927c3310156fd79`, with **zero changed ROI pixels**. The reopened-off mask has no bright pixels. These comparisons concern rendered output text, not mapping/editor labels; no whole-window pixel identity or temporal/alpha fidelity is claimed.

Original Downloads `open-play-native-016-midi-restored.json` equals `docs/prototype/desktop-0.1.6-midi-restored-export.json` and the initial saved export **byte-for-byte**: SHA **`2b3935a876e55db3a0c0cce2b01f0b3c18e93cbf795b6446bc7ae1a4566ff117`**. Exact three-map metadata is preserved: original Library browse CC1/1 relative two’s complement, Deck 2 key shift CC16/119 relative offset, and text-overlay opacity CC16/118 7-bit absolute. `physicalCompatibilityVerified` remains false. Export equality is direct artifact evidence; native persistence/event delivery requires the following separately attributed runtime observations.

## Reviewed parent process/UI observations

`docs/prototype/desktop-0.1.6-restart-stop-observation.json:2` records old PID **93085 absent** and **port18768 absent** after clean CmdQ. The separate new-process observation records PID **94208**, the actual 0.1.6 executable path and listener127.0.0.1:18768 (`docs/prototype/desktop-0.1.6-restart-new-process.json:3`). The records are internally consistent and identify a new process; this reviewer did not rerun live process checks or prove crash recovery.

Parsed all **23** postrestart saved action/state entries, exactly steps **94–116**, and preserved the initial **93** entries. Assertions use actual saved state text rather than treating action labels as outcomes:

- Step94 contains `0 decks playing`; fresh-session Deck2 tempo is zero. Eleven visible library tracks are not eleven newly imported files.
- Numeric entry failure is retained: step99 shows **646**, step100 **6**. Step101 then shows **66**, before step102's received synthetic log `CC ch16 119=66`. Step103 contains **Glass Transit / F#m (+2)** and Deck2 tempo zero. A read-only view of the saved `desktop-0.1.6-reopened-keyshift.png` places that +2 on Deck2. This postrestart GUI-state test uses the restored demo deck, not a repeat of the prior +8/330–550 Hz audio test.
- Step109 records the subsequent actual synthetic log `CC ch16 118=0`; the complete output screenshot independently shows the text disappearance. Earlier key-shift logs remain in the same state and are not confused with the new opacity event.
- Step114 reports **three imported tracks saved locally; zero session-only**. This is a native Files-status observation. No postrestart decode/hash/play of all three restored media files was performed by this reviewer, so it is not independent whole-media-byte or acoustic acceptance.
- Step116 records **zero decks playing** and no earlier `F#m (+2)` state after reset. The parent reports leaving PID94208 open for hands-on use; this review only verifies its saved final observation, not continued current process state.

These recorded states support the parent's scoped native mapping/text/export restart milestone. They do not turn every labeled action into success. The initial unsuccessful numeric attempts, earlier −24 state, misnamed +2 screenshot and wrong-scroll Video screenshot remain preserved and are not used as passing evidence.

## Preservation, executed outputs and limits

Freshly hashed both actual packages: old0.1.5 ASAR remains **`251bcc16caf9cfb42a3967db058717373a8c6fcb9ff97d56c330058ec8301b03`**; 0.1.6 remains **`f9e85d9ef3150fd37c15f5b3d72a4e3f6a06a42a59bf29617a43bdf566cdba6e`**. Frozen host/audio/initial-Video reviews and primary audio/Video results still match their previously recorded hashes. None was edited or replaced. The retained primary audio result still has `declaredCriteriaPassed:false`.

Executed new script: `scripts/inspect_desktop_016_restart_artifacts_independent.py`. Immutable new result: `docs/prototype/desktop-0.1.6-restart-independent-results.json`, SHA **`64f30dff69e4881eb66e7e4a8474c5b3aa3db32fa07db78248b933beb6a95c9f`**. It retains original file identities/full decode/ROI hashes, all three pixel predicates, original/export equality, saved process/UI record hashes, failed/recovered numeric-state predicates, frozen-evidence/package hashes and explicit acceptance boundaries. No production/shared source, native UI, devices, process state, old reports or original artifacts were changed.

This unit does not establish postrestart audio pitch accuracy, exact cursor/release timing, crash/eviction/disk-full recovery, every mapping/encoding/error composition, all72 Video targets, REQ-516, physical Hercules behavior, external-display routing or full Serato parity. Its genuine direct Done criterion is unchanged artifact equality and output-pixel disappearance after the parent-observed restart; those artifact checks executed. Broader runtime correctness and the measured audio failure remain separate open requirements.

Skills applied: use, adversarial-verify, dec-quality-testing, dec-software-principles.
