# Conditional factory controller dispatch — checkpoint142

18 October2026. Baseline `2a4f4561a4b119d5c4b9916150b4595da5b0ed19` plus this checkpoint. **Full controller, native, visual and reference DSP parity remain open.**

The independent v2 adapter increases executable source assignments from5,223 to18,521 across143 of197 recovered definitions. The other54 definitions have no executable input assignment. All197 complete normalized source trees still reconstruct; HID, initialization, lighting/output, unknown predicates and unsupported translations remain retained data. The raw/normalized vendor catalogs and native pseudocode remain private.

| Hercules300MK2 | Before141 | After142 |
|---|---:|---:|
| Retained transport entries |375|375|
| Adapted assignments |56|335|
| Assignments from supported case branches |0|275|
| Unresolved items |309|38|
| Fully translated / physically accepted |No|No|

The275 case assignments mostly resolve documented DJ Pro-versus-Lite app branches at adapter time. They are **not275 separately accepted runtime predicates or physical controls**. Runtime conditions cover bounded conjunctions of known modifiers and supported pad-mode equality/inequality. Unknown states/operators/additional addressing stay inactive. In a compound input event, supported actions can run while unsupported sibling actions remain explicitly unresolved. This does not establish the complete compound behavior.

## Mode identities and independent behavior

Targeted Ghidra12.1.4 analysis of installed ARM64 function`0x1005e0700` succeeded without whole-program analysis. It identifies the source mode-name/ID table. Selected interoperability identities are retained in `factory-pad-mode-protocol-142.json`:0 Hot Cues,2 Loop Roll,5 Sampler,9 Manual Loop,11 Auto Loop,14 Pitch Play,23 Scratch Bank and25 Stems. Native pseudocode stays under ignored `local-evidence/factory-conditions-142/`. These identities alone do not prove runtime behavior.

The official [Hercules quickstart](https://support.serato.com/hc/en-us/articles/10173727435151-Hercules-DJControl-Inpulse-300-MK2-Quickstart-Guide) documents eight pad workflows. Our existing independent cue, loop, sampler, Stems, Pitch Play and Scratch Bank actions now receive the corresponding factory grid-mode input. Shift-pad handling supports cue deletion, Pitch cue selection, sampler stop/load and Scratch Bank previous-track restoration. Unsupported shifted modes report their missing adapter instead of firing another action. [Scratch Bank documentation](https://support.serato.com/hc/en-us/articles/360002234676-Using-Scratch-Banks-with-Serato-DJ-Pro) corroborates track loading and Shift restoration.

`prototype/controller-performance.js` owns input-scoped modifier holds and active-pad routing. Two held modifier buttons do not cancel one another when only one is released. Releases and disconnect clear their owners. Conditions remain separate on sibling assignments at one MIDI address; they are not flattened into simultaneous unconditional commands. The existing deck router owns accepted cue, sampler, Roll and Pitch releases, so changing pad mode before Note Off cannot reinterpret an already-held action. UI tab/loop changes clear or update the corresponding active-pad selection. Status feedback names the selected hardware pad mode. Exact reference pixel/state mirroring across all GUI panels remains unaccepted.

Open Play's initial Hot Cues choice and omitted source translation defaults are explicit independent policies, not proven vendor initialization/default semantics. No license checks or feature entitlements are imported into Open Play. The source Serato application is not patched and no hardware initialization/output is sent.

## Catalog upgrade and provenance

The reviewed digest registry retains both v1 and v2 semantic digests for each recovered source hash. Imported claims cannot add trust. Saved catalogs are reauthenticated, then the newest reviewed adapter revision is selected for the same raw source identity. Earlier private catalog records are retained. A source/profile revision upgrade does not replace live user assignments. Applying the new graph preserves existing MIDI addresses while admitting its incoming sibling case/actions together. In an empty binding, only identical duplicate runtime assignments are deduplicated.

Conditional predicates survive explicit device binding, local persistence, export and reload. Their summary is visible in the MIDI mapping list. Factory-only targets remain selectable when reassigning a saved mapping. An unknown source or modified known-source predicate cannot receive the Official Serato label. Alternative and User categories remain separate.

## Executed evidence

Five authored-XML tests cover semantic retention, known/unknown conditions, app-target selection, partial compound reporting, ranges/pairs, entities and CC modifier rejection. Focused runtime checks cover modifier ownership/device isolation/reset, eight target routes, pad-mode equality/inequality and release routing. The actual197-profile v2 catalog parse/authentication/binding check passed on17 private shards. All197 v1 profiles also authenticated with the compatible registry. Receipts: `factory-conditions-contracts-142-results.json` and `controller-conditions-142-source-manifest.json` under `docs/prototype/`.

Actual browser UI on isolated8782 imported the real Hercules v1 profile, bound56 assignments, imported v2 under the same raw source ID, selected the newer reviewed revision, preserved all56 earlier live assignments and added279. A real page reload restored all335.

The restored workflow then exercised actual factory input packets through the app:

- Normal versus Shift Prepare actions and modifier release.
- Cue creation, second-press audition/release and Shift deletion.
- Auto Loop toggle and momentary Roll release after changing to Hot Cues.
- Manual Loop In/Out, save and toggle.
- Stems mute/restore into an actual five-source prepared playback voice.
- Sampler Hold start/release.
- Pitch Play Shift cue selection, actual playback with keylock and release.
- Scratch Bank track loading and Shift previous-track restoration.

It recorded95,255 finite stereo frames at44,100Hz, RMS0.0457770321/0.0458325717, then stopped. Source data is recovered factory data; MIDI is synthetic and original/prepared stem audio consists of authored tone fixtures. This proves this integration path, **not new model inference, musical separation quality, activation continuity, exact pitch accuracy, all pad variations, all controller models, physical sockets or native behavior**. Receipt/screenshot: `docs/prototype/controller-conditions-142-results.json` and `controller-conditions-142.png`.

Failures are preserved. Initial actual all-profile parsing caught two continuous CC modifier forms that the Note-lifecycle runtime does not support. The adapter now retains those inactive; failed catalog/report remain under142, accepted catalogs are under`local-evidence/factory-catalog-142b/`. The first browser test incorrectly expected an empty cue slot's creation press to audition it; source code and official guide establish creation then audition. The corrected test passed without a product change. See `factory-conditions-142-initial-failure.json`, `controller-conditions-142-first-browser-failure.json`, and the initial/accepted adapter reports. These were different causes; no broad unrelated test matrix was repeated.

For the same private files on a fresh isolated origin:

```sh
python3 scripts/test_factory_controller_maps.py
node --experimental-default-type=module scripts/test_controller_performance.mjs
node --experimental-default-type=module scripts/check_factory_conditions.mjs local-evidence/factory-catalog-142b
python3 scripts/serve_factory_catalog_check.py --catalog-dir local-evidence/factory-conditions-142/ui-fixtures --port 8782 --harness controller-conditions-harness.html
```

Run the catalog upgrade, reload the page, then run the restored performance workflow. The fixture directory contains only the explicitly selected private v1/v2 Hercules profiles; no evidence-directory listing is exposed. Stop the temporary server afterward.

## Remaining gaps and next action

The Hercules38 unresolved items still include output/lighting and initialization, jog scaling, FX/master/cue controls and additional compound semantics. The new335 entries do not replace hardware acceptance of the old272-assignment alternative preset. Full unit compatibility, right-side acceptance, all shifted variations, modifier combinations, reconnection and feedback remain open. Source-only predicates on other models need targeted end-to-end checks as their behavior is implemented. HID and compiled legacy/alias coverage are still unresolved. No definition is fully translated.

Next independent work: adapt the remaining named Hercules FX/master/cue/jog contracts from the source through existing engine actions without hand learning, then test only those added contracts. Preserve Jason's confirmed0.1.23 desktop build,272-map profile and right-tempo-only correction; they were not modified or repackaged. Jason is away, so no physical capture request or hardware output. Hardware acceptance resumes when he returns.

The overall goal remains all110 feature groups/522 requirements/9 beta deltas/26 release checks,55 extended effects and actual Stems/keylock. This turn does not close keylocked Stems activation continuity: checkpoint138's same-instance serial proof still needs browser replacement API/engine/pad integration. The full Claude audit remains unlaunched; the handoff and original byte-exact prompt suffix are preserved.
