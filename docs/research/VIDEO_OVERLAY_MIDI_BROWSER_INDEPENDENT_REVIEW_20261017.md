# Independent corrected overlay/assignment browser evidence review — 2026-10-17

**Scoped verdict:** the parent's corrected 9/9 initial and 3/3 restored checks support a bounded browser subset, with the original restored-selection snapshot defect preserved and the final immutable delta verified below. All 12 original output PNGs and the original generated fixture decode intact; runtime source manifests agree. This reviewer did not execute the browser, native package or MIDI hardware. This is not acceptance of all 72 Video targets, all 28 overlay targets, full REQ-516 or Serato parity.

## Source defect and strict criterion

Earlier 6/9 and 8/9 browser attempts remain failed. Instrumented raw shows active assignment consumed CC20zero after the nominal Exit. The next exact-reason raw identified a delayed previous-dialog close canceling a new panel assignment; the proposed focus/hidden accommodation was rejected by its explicit reason criterion. Parent added view ownership in `prototype/video-midi-assignment-ui.js:4,19,27,45–50`: the queued close only cancels a modal-owned assignment while the dialog is closed. Panel ownership and an open/reopened modal survive an old close event; explicit close/Escape/blur/hidden cancellation remains.

Actual listener plus actual assignment controlled event-bus tests independently execute 5/5 in `video-midi-assignment-view-owner-independent-results.json`. That proves the guarded logic against controlled events, not native dialog scheduling. Source UI SHA256 `e7943f249f0b67e1e70018bc4d050a237bc8c1a39407a2808950b74c43aedc2b` is the same in the corrected actual browser report.

Corrected initial raw `overlay-midi-browser-corrected-initial-results.json` SHA256 `02ce86fa16c98fa16c0002836ecbafcfb6f8f84bbd29e5306e59dbe575a34e4a` records assignment **active before Exit**, exact Assigned scopedCC20 status, inactive after Exit, crossLinked/auto false, then actual cross=-1 after CC20zero and output [23,50,59,255]. No workaround or endpoint/tolerance relaxation is present. Later assignments also retain strict toolbar Exit assertions. Browser input is a controlled requestMIDIAccess service; the page uses real app callbacks and compositor, but this is not physical MIDI.

## Complete original pixel/fixture inspection

Independently decoded all 11 initial 640×360 PNGs and the one restored 640×360 PNG with Pillow. Every original PNG SHA256, dimension and recorded center matches actual decoded bytes. Initial 11 expected centers match **exactly**, including learned left [23,50,59,255], relearned right [51,33,39,255], opaque image [255,0,0,255], opacityzero/background, left/master image placement, metadata-reload off and reimported red. The restored missing-image/background pixel is [23,50,59,255]. These are selected-pixel criteria; whole images were decoded, not compared to a complete vendor screenshot.

The original fixture is a 277-byte 64×64 RGBA PNG, SHA256 `9182fcc8431ed52889713159efa32178142066604d9d0fc6a144d3e241820523`. Its entire 16384 decoded RGBA bytes represent exactly 4096 opaque red pixels. Imported-red and opacity-one whole output images are byte-identical. Imported versus routed-master/reimport output images are not byte-identical because their underlying mix/background states differ; their red center matches are not mislabeled as whole-image equivalence.

Routing scope is **left/master visibly red; right placement metadata plus disappearance from the left-endpoint mix**. The right route screenshot is [23,50,59,255] because cross remains left. The original asset later returns through master and controlled mixer tests support ownership transfer, but **no direct right-endpoint visible-image frame exists**. No all-three-target visible-render claim is accepted. No actual text, every animation/option/geometry control, fullscreen or all encoding/device workflows were exercised by these nine cases.

Measurements are immutable in `overlay-midi-corrected-initial-independent-artifact-inspection.json` and `overlay-midi-corrected-restored-independent-artifact-inspection.json`. Original failed reports, all complete original PNGs and fixture bytes remain in their parent JSON files; nothing was trimmed or replaced.

## Runtime source identity and reload metadata

Initial before/after manifests are identical across 14 entries and all entries matched current files at initial inspection. Restored before/after hashes equal the initial manifests. At restored inspection, the test-only harness had since changed; all other 13 source/configuration files still matched. This does not promote the old runtime to the revised harness candidate. These identities include the corrected assignment UI; the app audio engine was not rebuilt. Source equality is not a runtime/provider/physical acceptance claim.

Original restored report `overlay-midi-browser-corrected-restored-results.json`, SHA256 `afa9670dad3c822830754256d6a36715f9858bde6870dfc6c92479dd33b6eacd`, reports 3/3 with no fatal errors. All seven saved mapping objects/order equal the initial phase, including learned device scope. Image ID is preserved; no image bytes are claimed after reload. Parent observed actual page reload; this offline review does not independently execute or prove that UI action.

**Test-only evidence mutation:** At recorded runtime harness b4b45f55…, the first restored check sets e.selection directly to state.video.midiOverlaySelection (`prototype/overlay-midi-harness.js`, restored first check). The later route test updates that same object to left, so the final recorded first-check selection says left whereas initial saved selection was master. The actual source assertion checks equality before that later mutation and reports a pass, but the final selection field is not an immutable snapshot of that observation. Clone recorded selection metadata. Until a corrected snapshot exists, independent artifact acceptance covers seven mappings and the same imageID; initial restoredtarget equality remains parent-executed assertion/code-path evidence, not independently reconstructable from the finalfield. This is a harness reporting defect, not evidence of a production restore failure.

## Acceptance boundary

These 9+3 results establish only their executed synthetic-input/app/compositor/persistence subset at the recorded candidate. They do not repair or relabel earlier failed captures, update native 0.1.5, prove physical controllers, full encodings/control catalog, musical/audio behavior, reference transfer or whole-product current parity. The right-endpoint and immutable restored-selection evidence gaps stay explicit.

## Final immutable-metadata delta: separate actual reload

Parent performed a fresh actual reload after restoring the initial selected target through the real GUI. New `overlay-midi-browser-final-restored-results.json` (SHA256 `09e689f2bdd33c77e377b37ef2ec2048e7d36556d5b8842ce6c47abaadd28736`) is preserved separately, reports 3/3, and has the same seven mappings as the initial phase. Independent inspection confirms its first-check snapshot exactly equals the initial master/imageID selection, while the later saved selection is left with the same imageID. The original mutable 3/3 report remains intact and is not retroactively repaired.

All source hashes are stable before/after the new runtime and match current files. Relative to initial 9/9, only test harness identity changes, from b4b45f55… to 7691b758… . I independently reconstructed the complete old harness hash by reverting **only** e.selection=structuredClone(...) to the prior direct assignment; it exactly equals the initial runtime's hash. Production identities are unchanged, so this is a test evidence-snapshot correction rather than an inferred new product fix.

The one complete final restored 640×360 PNG decodes with original hash/dimensions and exact background [23,50,59,255]. It has the same original PNG byte hash as the older restored image. Immutable measurements are in `overlay-midi-final-restored-independent-artifact-inspection.json`; this final artifact closes the independently inspectable selected-target snapshot gap. Actual GUI route and reload remain parent-observed events.

Latest accepted bounded pair is initial 9/9 with 11 PNGs plus final restored 3/3 with 1 PNG: 12 output artifacts. The older restored PNG is an additional preserved thirteenth artifact instance across these three reports, not another new workflow pass. The missing direct right-endpoint image frame, all 72/all 28/full REQ-516, native/physical/reference and broader musical/quality limits remain unchanged.

Skills applied: adversarial-verify, dec-quality-testing, dec-software-principles.
