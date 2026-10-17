# Independent overlay editor/MIDI consistency review — 2026-10-17

Read-only product review of the current 7cbfaab-era source. The independent tests write only new owned files/results. No shared browser, product edits, Git, device or external service actions. Applied adversarial verification, integration-level checks and least-astonishment principles. Parent owns production corrections and the new complete browser harness.

## Executed bounded result

New `scripts/test_overlay_editor_midi_consistency_review.mjs` executes actual createVideoControls rendering/callbacks, actual overlay MIDI controller/router and real mixer resource methods with bounded document/storage collaborators. This is controlled execution of product code, not real browser rendering/default actions or reference semantics. Immutable `docs/prototype/overlay-editor-midi-consistency-independent-initial-results.json`: **2/4 pass, two confirmed consistency failures**.

### H1 confirmed: Fast numeric value is presented as Custom

Actual MIDI Video text overlay option at 127 selects numeric speed 2 in the scroll-left-right animation (`prototype/video-overlay-midi.js:45–49`). OnChange invokes the real editor render. The generated speed/intensity select in `prototype/video-controls.js:263` always renders labels with selected argument empty, leaving `<option value="">Custom numeric value</option>` ahead of unselected Slow/Medium/Fast entries. The raw test preserves speed 2 and the full option markup. No later explicit select value assignment repairs it. The numeric value functions, but the editor gives contradictory option feedback.

Recommendation: derive the selected documented label from the normalized current speed/intensity value; show Custom only for an actual non-label value. Cover both scrolling speed and reactive intensity labels. Do not change independent numeric mappings to fix display state.

### H2 confirmed: MIDI Save differs from the visible GUI Save name

The visible Preset name input can contain Performance Name while selected overlay.name remains Layer A. Its input has no data-overlay-key and therefore is not retained by the existing oninput metadata handler (`prototype/video-controls.js:280–288`). MIDI router dispatch calls overlay controller without options (`prototype/video-midi.js:67`), whose Save fallback is spec.name (`prototype/video-overlay-midi.js:57–62`). The test observes MIDI-created preset Layer A; with the same visible input, the actual GUI Save handler reads that input and creates Performance Name (`prototype/video-controls.js:320–322`). This is an observable disagreement between two controls addressing the same Save target. This test does not claim a vendor preset-naming policy.

Recommendation: share selected-overlay preset-name draft state between editor and MIDI save, preserving target/kind/identity. A draft typed for an image must not name a different text overlay, and normal rerendering should not discard the draft. Use the layer name as the documented fallback when there is no applicable draft. Parent chooses the minimal implementation.

### H3 refuted in the reproduced sequence: open image editor does not overwrite text selection

The actual editor is switched to image i1. MIDI selects text t2, changes text opacity and routes that text to left. The actual syncOverlay/render path retains image i1/master and text t2/left; only t2 opacity changes (t1/t2/image values 1/0/1). Rendering activates the shown layer, but activate writes only that layer's kind (`prototype/video-overlay-midi.js:16–20`). Thus editingKind-based synchronization does not by itself overwrite the other kind's selected identity. No defect is claimed for H3. This bounded refutation is not proof for every deletion/collision/restoration state.

### H4 scoped consistency supported, not exhaustive acceptance

Actual text On→Save→edit→Load restores text ONE, id t1 and on true; Route Right retains id/metadata. Attempting image On with no decoded asset still throws reimport and stays off. These checks support those routes and existing ownership rules only. They do not establish all 28 overlay targets, every option/encoding, actual image pixels or physical/reference parity.

## Initial identities and preservation

- controls f493af06dfbd23cf827e33eacf1b63462eb4ecf451b08a40f9ca138a8413ecda
- overlay helper 2677e3f57f67cff6a2e422bb383638d631aae70a7cb56257a052381f33627e11
- router 9346f0a9ec28ddd1166fdd5b57a657409f3212550dde9b17ae712aaafbf715eb
- mixer d09978db2178d009281ff38ab8923d33e2c18a5129c8188f7d4066db92f15823

The exact hashes are in the immutable result. Earlier source/audio/browser/clock/FX/stem evidence was not overwritten or rerun. Model recommendations, native-package and hardware status remain unchanged. Complete browser evidence is parent-owned and must retain its own exact source candidate and failures.

## Independent verification after the parent corrections

The parent changed only controls, overlay helper and state sanitizer for this correction. The owned expanded controlled suite executes **8/8** in `overlay-editor-midi-consistency-independent-final-results.json`. Initial 2/4 failure evidence is immutable. A previously chosen filename `overlay-editor-midi-consistency-independent-boundary-red-results.json` contains a **post-correction 6/6 pass**, because the production patch landed before that execution; it is not claimed as an additional red reproduction.

The final executed checks establish:

- MIDI Fast speed 2 is rendered with Fast selected. Reactive Subtle intensity 0.35 is rendered with Subtle selected; a genuine custom 0.71 value retains Custom.
- Real editor input records its scalar presetDraftName on the actual selected overlay. Both MIDI and GUI Save use Performance Name for that owner's typed draft.
- Text A's draft is retained while image i1 is edited with another draft. Offscreen text MIDI Save uses Text A Draft, not Image Draft; text t2 without that draft uses Layer B. Routing retains owner draft and state snapshot/restore retains distinct per-overlay strings. Saved preset metadata excludes the editor draft.
- An explicitly cleared draft stays empty and rejects MIDI Save rather than silently falling back to layer name.
- Actual text on/save/load/route identity roundtrip and missing-image reimport refusal still pass, as does H3's independent-kind selection counterexample.
- State snapshot/restore ignores inherited, accessor, numeric, null, array, boxed and overlength draft fields; preserves own empty and 128-character strings; accessor count remains 0. The typed setter rejects malformed inputs without changing the prior valid draft. This exercises the metadata boundary, not a promise that arbitrary runtime overlay objects cannot contain accessors.

Final source hashes: controls `b36a439ae26620417b4cf1fefdb20438bee01e64dd41239d39dea8623e4e42df`; helper `b02150ca166d8c44ecdf932f1a1615f2c2217873f93802bc258b9ca0f1b5959f`; state `fd23bffefc1dbc5411f604e467b960fc209c311fdf0eb21bb97a7e8f615bb548`. Router/mixer remain the original hashes above. Helper methods presetDraft/setPresetDraft plus per-overlay scalar storage implement the ownership policy; the sanitizer explicitly reads own scalar metadata and the preset format excludes it.

I also reran the existing overlay policy 10/10 and actual mixer relocation 5/5 checks into new `overlay-editor-midi-consistency-{policy,move}-regression-results.json` files. No source blocker remains from the two confirmed consistency cases under these controlled checks. Actual complete 28-target browser/pixel/reload execution is parent-owned and not accepted by this report; native/hardware/model recommendations remain unchanged.

Skills applied: adversarial-verify, dec-quality-testing, dec-software-principles.
