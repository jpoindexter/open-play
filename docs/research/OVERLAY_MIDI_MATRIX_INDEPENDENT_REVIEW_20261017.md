# Overlay MIDI matrix — independent artifact and oracle review

Final bounded verdict: the parent's **21/21 initial and 5/5 reload cases**, including the strengthened non-first-owner reopen case, have consistent complete original artifacts and source identities. This reviewer independently decoded **all 115 output PNGs**, both fixture originals, and recomputed **345 exact mask records plus 48 numerical/selection witnesses**. No remaining blocker was found within this bounded review. The parent executed the browser actions; independent execution here was artifact analysis and controlled production callbacks. This does not establish full feature/reference/native/hardware parity.

The sections below preserve the earlier **20+5** cohort, a real controlled editor-reopen RED, its correction, the subsequent failed browser fixture, and a first-owner browser case that was too weak to accept as a regression. The final evidence section supersedes their pending statuses without erasing those originals.

## Evidence and execution

| Original parent evidence | SHA256 | Scope |
| --- | --- | --- |
| `docs/prototype/overlay-matrix-initial-results.json` | `577a683a4490f7d178b70e7d78767d0ec20c31d19166f82ac4d3418e9e2ad75b` | 20/20, 109 complete output PNGs, two complete fixture PNGs |
| `docs/prototype/overlay-matrix-restored-results.json` | `dd43da1d2a381bd0b944c19a254d5e416674483cc59a214c09962d37601d16d0` | 5/5, four complete output PNGs, copies of the same fixtures |

Executed `scripts/inspect_overlay_midi_matrix_independent.py` once per original into the NEW immutable `docs/prototype/overlay-matrix-independent-{initial,restored}-results.json`. Every original was strict-Base64 decoded and loaded through Pillow, with SHA256, dimensions, complete RGBA length, all RGB mask counts, bounding boxes and bounding-box centers independently recomputed. This was not a sample of favorable frames.

All **113 output PNGs are 640×360**; all 113 full-alpha planes are opaque. All **339 color-mask records** match exactly, including empty masks. No decode or duplicate-evidence-reference error occurred. Both 48×32 fixture originals decode to their declared uniform opaque red/blue pixels and match declared SHA256. Reload fixture copies are byte-identical to initial. The mask centers are **bounding-box centers**, not pixel-mass centroids. Threshold masks intentionally ignore alpha, as does the original harness (`prototype/overlay-midi-matrix-harness.js:20`); inspecting every actual alpha value guards this cohort against invisible colored pixels being mistaken for rendered layers. It does not test a partial-opacity compositing curve.

The inspector independently recomputed **41 initial and three reload numerical/pixel predicates**, all true. `scripts/inspect_overlay_midi_matrix_cohort_independent.py` produced NEW `docs/prototype/overlay-matrix-independent-cohort-results.json`: 28 unique executed overlay targets exactly match the 14-per-kind registry (`prototype/video-midi.js:24`), 29 total mappings include the separate crossfader, and all 28 overlay mappings are device-scoped channel-1 seven-bit absolute CC. Initial saved mappings, reload-entry mappings and reload-final mappings are exactly equal. Initial selected-owner snapshot equals the separately frozen reload-entry snapshot; final image selection is intentionally right after the later route test, while the entry remains master. This refutes evidence aliasing for this pair. Both source manifests match before/after and across phases, each with 16 entries.

## Pixel witnesses and oracle limits

The harness marks a target executed after functional assertions, not merely after finding its label (`prototype/overlay-midi-matrix-harness.js:26`, `:58`–`:81`). Both kinds have actual distinct-layer On/selection and held-repeat checks; zero/full opacity produces absence/presence; scale changes measured colored area by 16.99× for text and 16.33× for image. Horizontal displacement is 323/322 pixels, vertical 181/181.5 pixels. Metadata-only success cannot create these independent pixel differences.

All three routes have direct visible-endpoint evidence, including the previously missing right endpoint: text own-color counts left/right/master = 528/524/527; image = 1536/1536/1536. The reload right image is also visible. The current source test is `prototype/overlay-midi-matrix-harness.js:64` and `:96`. This closes the old **direct right-visible pixel** evidence gap for these fixtures; it does not establish arbitrary transition/routing equivalence.

For each kind all seven animation names are asserted, and all three named options of each of the six option-bearing animations are exercised: **36 option selections total**. Scroll acceptance requires a correctly signed, non-wrap movement witness, with all attempted frames retained (`prototype/overlay-midi-matrix-harness.js:67`–`:72`). It establishes directional motion, not constant speed, every phase, timing precision or a vendor transfer curve. None compares complete recorded mask geometry; it is not a full-frame identity assertion. BPM zoom max/min own-color area ratios are 2.456× text and 2.474× image; no exact beat phase or BPM-to-size mapping is accepted.

Bass zoom invokes actual deck Play/Pause and analysis while physical output is muted, then compares actual zoom output against neutral. Recorded bass ranges are 0.00377–0.05080 text and 0.01319–0.04606 image. Own-color max/neutral area ratios are 1.0568× and 1.1068×. These support the specific modest enlargement predicate; the analysis values are **parent runtime metadata**, not independently reconstructed audio. They do not prove frequency isolation, low latency, per-frame causal correlation, stable gain or musical quality. The report does not promote a 5.68% threshold witness into a broad audio-reactivity quality claim.

Preset restoration has stronger static evidence: complete original/restored PNG SHA256 is identical for text (`5e3e07fc7d0c5d6691ad49fbaf5dfd312500933ba5203ddf7a901471453b3998`) and image (`dbaea541fa2a4f0378307fd9d851dd83b3f57488c53b1db0b7e2dd08e20f3f7c`). Image load first disables/clears decoded bytes, refuses On, then actual reimport restores pixels (`prototype/overlay-midi-matrix-harness.js:78`–`:81`). This covers these two owned PNGs and named metadata; it is not all image formats, arbitrary imported metadata, disk failure or concurrent decode acceptance.

Initial/final audio snapshots are identical. The predicate deliberately includes actual play/pause inside bass tests and final paused state (`prototype/overlay-midi-matrix-harness.js:40`, `:72`, `:89`); it does not assert no transient audio activity or contain an independent audio recording. Inputs are controlled seven-bit CC on one synthetic device, not physical MIDI/hardware, all encodings, hot-plug or device jitter.

## Confirmed uncovered defect and bounded correction

The first 20 cases did **not** cover reopening the editor after separately selecting another-kind MIDI owner. NEW `scripts/test_overlay_midi_reopen_selection_review.mjs` imported the actual controls/controller/router/mixer with bounded document/storage collaborators. On old controls hash `b36a439ae26620417b4cf1fefdb20438bee01e64dd41239d39dea8623e4e42df`, it reproduced **0/1**:

1. Keep image `i1` visibly selected; MIDI-select text `t2`.
2. Reopen actual `overlaysDialog()`.
3. Text owner silently becomes `t1`; subsequent text opacity changes `[t1,t2]` to `[0,1]`.

Preserved original `docs/prototype/overlay-midi-reopen-selection-independent-initial-results.json` retains both snapshots, wrong-owner mutation and source hashes. The cause was local `selected=''` → render-first-layer fallback → `overlayMIDI.activate`, not corruption of the saved browser artifacts. Live other-kind synchronization had previously passed; that narrower result did not cover this compound reopen lifecycle.

The parent correction retains `overlayEditingKind` (`prototype/video-controls.js:42`), resolves the existing selected owner before first render (`:251`–`:255`) and records the visible kind (`:265`). Explicit layer/target actions remain their own selection changes. The existing `current(kind)` and `activate` owner policy is in `prototype/video-overlay-midi.js:12`–`:15`, `:27`–`:31`.

Independent rerun produced **1/1** in NEW `docs/prototype/overlay-midi-reopen-selection-independent-final-results.json`: owner remains `t2/i1`, and subsequent opacity changes `[t1,t2]` to `[1,0]`. Fresh rerun of the eight consistency/isolation/state-accessor cases produced **8/8** in NEW `docs/prototype/overlay-matrix-reopen-consistency-independent-results.json`. These are executed controlled callbacks, **not browser event/pixel/native acceptance**.

Current controls hash is `e332bd877adcbb2a80050c800107672107b6cbdb854ba528dd5afdf426f944a5`; helper remains `b02150ca166d8c44ecdf932f1a1615f2c2217873f93802bc258b9ca0f1b5959f`, router `9346f0a9ec28ddd1166fdd5b57a657409f3212550dde9b17ae712aaafbf715eb`, state `fd23bffefc1dbc5411f604e467b960fc209c311fdf0eb21bb97a7e8f615bb548`, mixer `d09978db2178d009281ff38ab8923d33e2c18a5129c8188f7d4066db92f15823`.

The old browser source cohort remains historical. Its controls and matrix-harness hashes differ from the corrected current files; this is an intentional post-run delta, not a retroactive source-stability failure. The parent added a 21st browser case (`prototype/overlay-midi-matrix-harness.js:85`–`:88`) for reopen/On/opacity. That fresh browser run was pending when this historical section was written; see the final evidence section below.

## Verdict

Historical verdict at the first review: complete original artifacts and declared numerical witnesses for **20+5 scoped cases**; exact mapping/entry-selection preservation in saved evidence; all 28 overlay target names have a functional witness. Refuted: that those cases established every compound overlay workflow—the independent reopen RED disproved that broader reading. Corrected reopen behavior had **1+8 controlled cases**, with browser acceptance pending at that point. Final browser evidence is assessed separately below.

No full 72-target Video mapping, 26 manual groups, REQ-516, all110/522 parity, current reference equivalence, native package, physical controller or musical/acoustic claim is awarded. No production, browser, device, Git or shared report was changed by this reviewer.

## First fresh 21-case attempt — retained fixture failure

The parent retained `docs/prototype/overlay-matrix-reopen-initial-results.json` at **20/21**, not accepted. Independent reading confirms the failing reopen case had identical before/reopened owners (text A `722d7c01-36d1-4710-9601-b82b80e19d20`, image A `cab7fc36-eb69-4d08-8d44-7df3ebe4cce5`). Its setup incorrectly assumed CC127 selected B after earlier route operations. Saved master text order was actually `[B,A]`: `moveOverlay` appends on route (`prototype/video.js:228`), and MIDI selection uses the current flattened order (`prototype/video-overlay-midi.js:11`, `:46`–`:48`). Thus the reported error text "Reopen replaced a MIDI owner" was refuted by the recorded equal owners; this attempt did not reach its blue-pixel assertions.

The appropriate test-only correction derives B's CC endpoint from the actual current public order and explicitly asserts B **before** closing the dialog, then retains exact B/image owner preservation and visible On/opacity criteria after reopen. This is a setup correction, not a production fix or weakened post-reopen criterion. The failed original remains a failed run, not promoted into 21/21.

## Limited first-owner case — explicitly not regression acceptance

The next actual browser result, `docs/prototype/overlay-matrix-first-owner-initial-results.json` (SHA256 `faa393abb8e335b6d85e8a1ee423090cd1a0a36d993b879f0fd030096b7ee2e5`), reported 21/21 but still selected the **first** text layer in current order. The parent identified this oracle weakness. Independent reading confirms `textOrder[0]`, before.text.id and reopened.text.id all equal `2a158b47-89f0-46ec-90ef-3bfd40b7195e`. Even the former first-layer fallback could preserve that owner. Its blue On/opacity evidence is a functional first-owner witness, **not acceptance of the reopen regression fix**. It remains separately preserved; none of its 21/21 count is silently reused as a non-first-owner result.

## Final frozen 21+5 cohort — independently inspected

| Final original | SHA256 | Parent browser observation |
| --- | --- | --- |
| `docs/prototype/overlay-matrix-final-initial-results.json` | `18b83a431f90834d494f7dfb3e359e4e398a1672c57b5e985530134d29c5a3ac` | 21/21, 111 output PNGs, zero fatal errors |
| `docs/prototype/overlay-matrix-final-restored-results.json` | `c023d7e15976d74e9d39118883ea6378e2378fe47f3ecce5a16405955e7f6c50` | 5/5, four output PNGs, zero fatal errors |

Executed both independent inspectors against these originals into NEW immutable:

- `docs/prototype/overlay-matrix-independent-final-initial-results.json`
- `docs/prototype/overlay-matrix-independent-final-restored-results.json`
- `docs/prototype/overlay-matrix-independent-final-cohort-results.json`

All **115 complete output PNGs** decode as 640×360, with all actual alpha values 255. **345/345** exact mask/bounds/bounding-box-center records match; no decode, evidence-reference or duplicate-label error exists. Both complete 48×32 fixture PNGs match SHA256 and expected uniform opaque color; fixture copies are exactly equal across phases. **45 initial + three reload predicates** independently recompute true. Every frame, including motion attempts, neutral, image absence, and reopen opacity-zero frames, remains in the originals; no favorable-frame trimming was performed.

The final strengthened case (`prototype/overlay-midi-matrix-harness.js:86`–`:87`) records text order `[f23b9d81-8b57-44d3-9c1c-b610da9f66b4,31406811-2515-48cb-985c-29e677c5cdef]` and intentionally selects the **non-first** owner `31406811-2515-48cb-985c-29e677c5cdef`, with `expectedColor=green`. Independent checks confirm this owner is non-first, its saved text color is `#00ff00`, both kind-owner snapshots are equal before/after reopen, and whole decoded output has **527 green pixels → zero** after its MIDI opacity command. The browser source also asserts the other owner's opacity stays 1. The latter is a parent live assertion, whereas the color masks and stored identities were independently recomputed. This case distinguishes the former first-layer fallback and provides the missing browser-pixel witness for this compound workflow.

The final snapshot pair retains exactly the expected **29 mappings**, all 28 unique overlay target names, exact mappings before/after actual reload, and equal initial/frozen reload-entry selected identities. The later reload right-route deliberately changes only final image location to right; the initial entry snapshot remains master. Initial/final audio snapshot equality remains true, with actual deck Play/Pause permitted only inside bass tests as described above.

All **16** source-before/source-after hashes match each other, across final phases, and current files at inspection. Corrected controls are `e332bd877adcbb2a80050c800107672107b6cbdb854ba528dd5afdf426f944a5`; final harness is `d30d1e5980231e2633ef1d327bfceeb7a47a7ac383810fe085accdc1565b30a2`. Helper/router/state/mixer hashes remain the current hashes listed above. There are **zero current-source deltas** in this final cohort. This manifest is the explicit 16-file cohort, not a claim that every transitive dependency or the native ASAR was independently re-audited.

Final scope remains a controlled-browser workflow/pixel subset with independent artifact corroboration, plus the independently executed 1+8 controlled callback regressions. Both kinds' 14 target names have functional witnesses, including direct right endpoints; this **does not mean every combination, encoding, resource race, format, musical condition, physical input, all 72 Video targets, 26 manual groups or REQ-516 has been accepted**. No new production correctness blocker survived this bounded final review.

Skills applied: adversarial-verify, dec-quality-testing, dec-software-principles.
