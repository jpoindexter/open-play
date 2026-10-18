# Factory mixer/FX inputs — checkpoint143

18 October2026. Baseline `0373dab4dcc53ebad710bf374a2435569475d98e` plus this checkpoint. **Full reference/controller/native parity is not established.**

The v3 adapter produces19,252 assignments across145 of197 recovered definitions. All197 normalized source trees still reconstruct.52 definitions have no executable assignment; none is fully translated. The Hercules300MK2 profile advances from335 to356 assignments and38 to18 unresolved items. Counts represent adapted graph assignments, not physical knobs or accepted controllers.

## Source findings and behavior

The retained factory `MIDI.xsd` documentation specifies master volume as0–100%, distinguishes effect-slot depth from the misleading legacy `effect_level_1_slot_parameter_1` name, and lists eight unit beat multipliers:1/16,1/8,1/4,1/2,1,2,4,8. It describes Stutter as starting at the temporary cue; held fader-start enable changes how the upfader behaves; and backward browser navigation folds a selected parent crate or otherwise moves focus. These are verified-in-source facts, not source-code copies or proof of exact vendor timing/curves.

One legacy slot annotation says0 is the first slot, while the Hercules resource uses slot1 for both its FX enable/depth actions. The official [device guide](https://support.serato.com/hc/en-us/articles/10173727435151-Hercules-DJControl-Inpulse-300-MK2-Quickstart-Guide) identifies those controls with FX Slot1. The v3 adapter applies that policy only to the exact Hercules vendor/product identity06f8/b12f; it retains other devices' unresolved FX conventions rather than guessing a universal slot offset.

The new independent input path supports:

- A separate0–100% master attenuation stage, including true mute at0, composed with the existing−12..+12dB trim. The main readout exposes0% mute; Mixer preferences expose Master Volume. This controls master output/recording while leaving PFL cue independent. Exact vendor taper, hardware analog interaction and recording-tap equivalence remain unmeasured.
- Cue volume through the existing real monitor bus. The existing independent cue taper remains in use; the native descriptor's read-only cue-gain setting and physical analog behavior do not prove software/hardware gain equivalence.
- First-slot FX enable/depth without altering other slots or the other unit. Per-unit beat multipliers affect the actual effect beat configuration while preserving base slot beat values. The new unit setting persists only when its quantized value changes.
- FX selection with a visible pending list while the FX panel is open, or immediate selection when closed. The pending list commits after an independently chosen2seconds. Manual UI selection and disconnect cancel pending ownership. Note repeats while held do not repeatedly advance selection. Effect-list indexing, selection/reset policy and timeout are independent, not measured vendor equivalence.
- Stutter, rate-compensated deck Tap Tempo, held fader-start/back-cue with release ownership, and browser fold/focus behavior.

`prototype/controller-mixer.js` owns these new input actions. All MIDI is input-only; no hardware lighting, SysEx, firmware or initialization is sent. `prototype/engine.js` adds master attenuation with a default of unity, preserving prior audio behavior until it is changed. `prototype/panels.js` derives effective FX beats once from base values and synchronizes visible controls. Existing alternate mappings and ordinary controls retain their previous routes. An explicit fader-enable action also composes with a user level mapping on the same input; it does not require an Official Serato provenance field. A focused routing test covered this and isolation from another input, not a new physical/native audio claim.

An authenticated graph upgrade can add a new companion action at an already-bound official source address only when the existing assignment is still present in that same reviewed graph. Existing assignments themselves stay byte-for-byte unchanged. User or incompatible-address conflicts still win. Identical assignments are counted separately from conflicts. This permits the source fader-enable action to join its earlier modifier action without replacing user mappings.

## Executed checks

Six authored-XML tests passed. Focused mixer tests covered zero controls, slot/unit isolation, multiplier application without mutating base values, change-filtered persistence, selector deferral/commit/cancellation, held selector repeat gating and fader ownership. The actual197-profile v3 catalog passed parse/content authentication and binding checks; all197 earlier v2 catalogs still authenticated. A manual conflicting assignment remained unchanged.

Actual browser workflow on isolated8783 imported the recovered Hercules v2 profile and bound335 assignments, then imported v3 and added21 while retaining all335. It applied the factory MIDI addresses through the production input/router/engine and measured actual rendered PCM. Physical audio destinations were muted.

| Actual left-bus capture,5,292frames/window | Master RMS | PFL cue RMS |
|---|---:|---:|
| Baseline |0.1138344700|0.2009943250|
| Master volume0 |0|0.2009943250|
| Cue volume0 |0.1138344700|0|
| First-slot LPF depth0 |0.1138344700|0.2009575217|
| First-slot LPF depth100 |0.0000002453|0.2009575217|

Other slot depths17/83 and other-unit depth42 stayed unchanged. The same run exercised visible deferred FX selection, manual selection cancelling the timer, Stutter, Tap Tempo, fader start/back-cue/release and browser fold/focus. Receipt/screenshot: `docs/prototype/controller-controls-143-results.json` and `controller-controls-143.png`.

A separate actual audio test measured production Delay output against a simultaneous undelayed PFL pulse. At120BPM and a base half-beat, source-MIDI multiplier1× produced0.250000seconds and2× produced0.500000seconds. Both measured errors were0 within a declared5ms criterion, each using44,100frames per bus. This was repeated only after adding the multiplier persistence callback; the scoped measurement again passed. Original and final PCM remain private under `local-evidence/factory-controls-143/`; summaries are `controller-fx-beat-143-initial-results.json` and `controller-fx-beat-143-results.json`. A real page reload then showed unit1=2× and unit2=1× with the full fraction-label list, saved in `controller-multiplier-143-reload.json`.

The captures use owned pulses/tones and synthetic MIDI. They prove this master/cue/LPF/Delay input integration, **not musical separation, all59 processors, every multiplier/taper, right-side hardware, physical sockets, native execution or reference sonic identity**. No unrelated eight-mode or all-FX matrix was repeated. Current product hashes are recorded in `controller-controls-143-source-manifest.json`; the fraction-label copy change was inspected through the final reload, not treated as a new audio result.

## Re-entry and remaining gaps

Accepted private catalog: `local-evidence/factory-catalog-143/` (17shards). The v2/v3 Hercules fixtures used by the UI test are the two explicitly allowlisted `factory-001.json` and `factory-002.json` files under `local-evidence/factory-controls-143/`. The same directory also retains private PCM; the server's fixture allowlist excludes it.

```sh
python3 scripts/test_factory_controller_maps.py
node --experimental-default-type=module scripts/test_controller_mixer.mjs
node --experimental-default-type=module scripts/check_factory_controls.mjs local-evidence/factory-catalog-143 local-evidence/factory-controls-143/factory-001.json
python3 scripts/serve_factory_catalog_check.py --catalog-dir local-evidence/factory-controls-143 --port 8783 --harness controller-controls-harness.html
```

Run the printed mixer/FX workflow on a fresh isolated origin. Then open `/prototype/controller-fx-beat-harness.html` on that same origin to use its retained356-assignment profile for the wet-delay measurements. Stop the temporary server afterward. Do not serve the whole evidence directory.

The18 remaining Hercules items still include eight platter-move inputs, two platter-skip inputs, two separate double-click definitions, retained SysEx, output/lighting/initialization and independent-policy/default uncertainties. Existing Load already has a450ms independent Instant Double policy; importing the separate Double Click definition blindly could trigger it twice. The platter range−512..512→−1..1 does **not** by itself establish512ticks/revolution. Do not silently substitute either that assumption or the248tick community calibration and call it official equivalence. Native string lookups made this turn found no direct match for the four tested platter-name spellings; this is a bounded search result, not proof that the implementation is absent.

Next: resolve the native platter-motion unit and skip/double-click contracts, then implement targeted input tests without changing the human-confirmed profile. HID and device feedback/initialization remain separate work. Exact FX curves and selection semantics, physical acceptance/reconnect and reference visual matching are open. V1/v2/v3 source labels attest retained content; they do not establish these behaviors.

Frozen desktop0.1.23, its tested272-assignment alternative profile and right-tempo-only inversion remain untouched. Jason is away; no timed capture request or hardware output. No native repackaging or public release. Raw vendor trees/code/codec input and PCM remain ignored/private. The full build plan, per-feature model/effort routing, controller Trello cards and Claude handoff are maintained. Full Claude audit remains unlaunched. The original20,996-byte prompt remains the byte-exact handoff suffix.

The complete goal remains110 feature groups/522 requirements/9 beta deltas/26 release checks,55extendedFX and actual Stems/keylock. In particular, keylocked Stems activation continuity still needs the browser replacement API/engine/pad integration after the earlier same-instance serial experiment. This turn does not close that gap. All full-parity flags remain false.
