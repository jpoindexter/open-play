# Minimal Video manual registry reconciliation

**Recommendation: add 14 requirement rows, enrich existing rows, add zero feature-registry entries. Do not append all 47 VMG proposals.** The read baseline remains507 canonical requirements; if the parent approves and appends all 14 additions without another concurrent merge, the result would be521. These MR keys are provisional and reserve no REQ IDs. No canonical requirement, feature registry, routing file or remote record was changed.

## Evidence cut

Sources are the [recovered historical manual review](VIDEO_MANUAL_GAPS.md), [47-row proposal JSON](video-manual-gaps.json), the actual507-row `interaction-requirements.json`, existing feature routing, and the parent's [current Effects/Info observation](VIDEO_REFERENCE_SETTINGS_20261016.json). The manual is 2015-04-09,27 pages, SHA-256`85c57756dc96587b7b4822e2911decb4b9202f5a1d6b1cba047e1159236ae66c`. The current observation is 4.0.10(4010213)arm64. Historical semantics, current control visibility/session selection, code-path findings and executed independent behavior are different evidence classes.

Effects/Info navigation is now observed: No Restrictions; audio-linked checked; source metadata and FPS blank with no Video loaded; idle output400×400; YUV Default/Software Only/RGB Only; debug toggles unchecked. No option changed or media played. These observations update VMG-041–045 without closing algorithm, loaded telemetry, performance, full catalog, native approval or parity gates. No version-number field was visible in that viewport; do not convert historical wording into a current existence/absence claim.

## Why14, and no new feature IDs

The missing independent actions/state owners fall into14 bounded requirement families below. Other proposals refine requirements already present: label-only rows are retained as evidence, generic recording/MIDI/library rows gain Video applicability, and the master Video-FX requirement links to detailed effect contracts rather than adding one canonical row per implementation name. Existing feature IDs cover every proposed row; adding features would duplicate the existing110-feature organization rather than supply behavior.

The rule is semantic coverage, not whether code is currently missing or a nearby test is green. A source-backed requirement can cover an implemented independent behavior while reference acceptance stays open. Conversely, a new current label never substitutes for the state transition or actual output test.

## Exact additions for parent review

Each entry supplies the proposed screen/action, expected result and smallest observable test scope. Keep the source pages and model routing from its mapped VMG rows. All acceptance below is **proposed**, not marked executed by this document.

| Key / feature | VMG source | Proposed requirement | Falsifiable acceptance boundary |
|---|---|---|---|
| MR-01 · VID-001 | VMG-001 | **Output-window lifecycle** — Close, reopen from mix preview and toggle fullscreen. Keep the mix/transport alive; recreate or restore the output without losing current media; provide a recovery path when fullscreen occupies the wrong display. | Browser window/pixels/audio lifecycle; physical secondary-display placement/reconnect separately approved. |
| MR-02 · VID-001 | VMG-003, VMG-006 | **Video load destinations** — Load an AV item to an audio deck, or load visuals only over playing audio. The first path routes soundtrack and visuals coherently; the visual-only path replaces no audio identity/clock. Newer loads retain ownership. | Original AV markers and actual audio/video decode, superseding-load races; enrich import rows with media applicability. |
| MR-03 · LIB-003 | VMG-004 | **Audio/video library subsets** — Select All Audio or All Videos while Video is enabled. Show the applicable media subset without duplicating library items or changing crate membership. | Actual mixed audio/video/karaoke library fixtures and unchanged membership; status icons enrichREQ-083 separately. |
| MR-04 · VID-001 | VMG-007 | **Track video associations** — Associate visuals with an audio track, reload it, then remove the association. Recall the correct visual for that track; removal prevents recall. Missing session/file resources remain explicit. | Actual decoded source identity through reload/unlink and generation races; no fabricated persisted bytes. |
| MR-05 · VID-002 | VMG-013, VMG-014 | **Independent Video fader links** — Unlink each channel opacity control and the Video crossfader independently; move audio and video controls. Each video channel opacity and crossfade obeys its own link state without forcing transport/other fader policy changes. | Actual channel pixel opacity, crossfade endpoints and audio noninterference across the link-state matrix. |
| MR-06 · VID-002 | VMG-015 | **Directional auto-crossfade action** — Request automatic fade left or right at a chosen speed. Travel toward the requested endpoint and finish there; retain speed direction fromREQ-505. Numeric curve/cancel policy stays explicit. | Actual monotonic frames, exact endpoint and stop, reversal/cancellation; preserve separate random transition selection. |
| MR-07 · VID-002 | VMG-011 | **Track-load transition selection** — Enable automatic transition selection and load a track; use manual Next separately. Select on logical track load without implicitly moving a fader; keep Random selection a separate setting. | Actual asynchronous audio/fallback load yields one selection transaction and unchanged faders; transaction edge rules independently declared. |
| MR-08 · VID-002 | VMG-018 | **Track-scoped FX save/recall** — Save selected Video FX/values for loaded media and later reload it. Recall the correct saved FX state with the correct media owner rather than a single global preset. | Distinct media/FX fixtures, actual pixel differences after recall and safe unsaved/canceled-load behavior. |
| MR-09 · HW-002 | VMG-029, VMG-030, VMG-031 | **Video MIDI target registry** — Learn and dispatch every supported Video control group through the generic mapping system. Identify and route Video-specific continuous/enum/discrete actions, including links, directional fades, overlays, panels, save and association. | A complete target-matrix dispatch fixture with actual Video pixels/state; physical WebMIDI assignment and timing separately executed. Generic learn/unassign rows are enriched, not duplicated. |
| MR-10 · HW-010 | VMG-032 | **Linked fader source authority** — Use a mixer and secondary MIDI controller together with linked Video faders. Resolve and expose authority instead of accepting conflicting sources silently; historical mixer precedence remains version-qualified until current execution. | Deterministic competing-event ownership plus separately approved physical connect/disconnect/reconnect test. |
| MR-11 · VID-001 | VMG-043, VMG-044 | **Video Info metric provenance** — Open Info with no clip, then with known left/right clips under a distinct calculation cadence. Show source/output dimensions, GPU-buffer and colorspace availability honestly; distinguish calculationFPS from sourceFPS and CPU submission time. Preserve blank/unavailable states. | Known frame-rate/dimension fixtures, independently measured calculation timestamps and unavailable telemetry checks; current idle400×400 is an observation, not a target default. |
| MR-12 · VID-001 | VMG-045 | **YUV handling selection** — Choose Default, Software Only or RGB Only on a supported backend. Retain the requested mode and apply only a supported declared processing path; show unsupported capability honestly. | Actual color-ramp/backend test and UI selection persistence. Current menu names are observed; conversion behavior is unverified. |
| MR-13 · VID-001 | VMG-045 | **Debug and Buffer Debug view** — Toggle supported debug views and encounter unavailable prerequisites. Expose truthful diagnostic state and gate unsupported telemetry/tools without automatic installation or fabricated values. | Current Enable Debug/Buffer Debug View state transitions and unsupported paths.2015 MovieInfoBatch and version-readout wording remain historical, not mandatory modern dependency/name. |
| MR-14 · VID-002 | VMG-046 | **Distinct effect input contracts** — Exercise an eight-band Analyzer contract separately from hardware-EQ-linked and three-band audio-reactive effects. Use the declared input/control path for each supported effect; mark historical/unregistered or unsupported paths rather than treating names as parity. | Eight isolated tone bands and independently changed hardware-EQ values with actual pixels; exact bins/curves and current registration remain unknown. |

MR-02 also enriches existing importREQ-063/067 with AV compatibility/destination cases; it does not duplicate their general import behavior. MR-09 enrichesREQ-206/208 with Video learn/unassign applicability while adding the missing target registry. MR-06 owns directional actions;REQ-505 still owns speed. MR-11 owns the coherent Info snapshot/metric provenance; MR-12 and MR-13 own distinct user actions. These are deliberate split/merge boundaries, not one row per label.

## Complete disposition of all 47 proposals

| VMG | Screen / behavior | Minimal canonical disposition |
|---|---|---|
| VMG-001 | Output window lifecycle | Add MR-01 |
| VMG-002 | Four-deck hardware / video capacity | Enrich REQ-055 with two-video-stream/decks1–2 scope; no new row |
| VMG-003 | Video library import with soundtrack | Add MR-02 |
| VMG-004 | All Audio / All Videos views | Add MR-03 |
| VMG-005 | Library media status icons | Enrich REQ-083 media/association icon states |
| VMG-006 | Visual-only load over playing audio | Add MR-02 |
| VMG-007 | Audio/video association lifecycle | Add MR-04 |
| VMG-008 | Media Crate enable and library integration | Enrich REQ-349 with special collection, ordering and ordered Next under Random; preserve superseded policy evidence |
| VMG-009 | Media Crate ordered selection | Enrich REQ-349 with special collection, ordering and ordered Next under Random; preserve superseded policy evidence |
| VMG-010 | Media Crate Next under Random | Enrich REQ-349 with special collection, ordering and ordered Next under Random; preserve superseded policy evidence |
| VMG-011 | Automatic transition selection | Add MR-07 |
| VMG-012 | Offline Video player | Enrich REQ-153 practice-mode Video preparation; REQ-076 remains autoplay-specific |
| VMG-013 | Per-channel Video upfaders | Add MR-05 |
| VMG-014 | Crossfader-only link | Add MR-05 |
| VMG-015 | Directional automatic crossfade | Add MR-06 |
| VMG-016 | Automatic crossfade speed direction | Enrich REQ-505 with slow-left/fast-right and relation to MR-06; do not duplicate it |
| VMG-017 | Cursor crossfade focus policy | Enrich REQ-507 with left/right keys and library navigation conflict; steps/focus exceptions still unknown |
| VMG-018 | Track-scoped FX Save | Add MR-08 |
| VMG-019 | Serial channel effect slots | Enrich REQ-347 with serial per-channel slots and current independent pixel evidence; no implementation gap inferred |
| VMG-020 | New overlay draft and discard | Enrich REQ-283 and REQ-284 with draft/discard and saved-definition/live-instance semantics |
| VMG-021 | Saved overlay live update | Enrich REQ-283 and REQ-284 with draft/discard and saved-definition/live-instance semantics |
| VMG-022 | Image format eligibility | Enrich REQ-284 with BMP/JPEG/PNG eligibility and actual decode/error outcome |
| VMG-023 | Video Mix recording input | Enrich REQ-199 with Video Mix selection and record gain/meter scope; do not infer Video pre-master tap from historical wording |
| VMG-024 | Recording size/rate/aspect contract | Enrich REQ-498 with aspect interaction and historical480p/24fps qualification; retain label-only REQ-106 as provenance |
| VMG-025 | Video recording gain and meter | Enrich REQ-199 with Video Mix selection and record gain/meter scope; do not infer Video pre-master tap from historical wording |
| VMG-026 | Unsaved Video take/save/Recording crate | Enrich REQ-200 with named Video take/save/Recording crate applicability |
| VMG-027 | Video destination/free space/temporary recovery | Enrich REQ-367 and REQ-368 for Video destination/temp recovery; preserve REQ-201 aggregate and audio-only split limits |
| VMG-028 | Recording capability conditional | REQ-370 already covers capability conditional; add Video source/test applicability only |
| VMG-029 | Video MIDI learn/unassign state | Add MR-09; enrich existing REQ-206/208 Video applicability |
| VMG-030 | Video continuous and selection MIDI targets | Add MR-09 |
| VMG-031 | Video MIDI discrete actions and panel targets | Add MR-09 |
| VMG-032 | Hardware/MIDI fader authority | Add MR-10 |
| VMG-033 | Window constraint only | Enrich REQ-496 windowed-only constraint; retain REQ-104 label provenance |
| VMG-034 | Output quality budget | Enrich REQ-497 quality/cost intent; no inferred algorithm from labels |
| VMG-035 | Output arrangement behavior | Enrich REQ-499 arrangement members/order; source stage/capture semantics still unknown |
| VMG-036 | Media Treatment semantics | Enrich REQ-500 with historical geometry meanings and current independent treatment evidence; do not claim alpha/filter parity |
| VMG-037 | V-Sync synchronization | Enrich REQ-501 monitor synchronization intent;2015 default does not override current session value |
| VMG-038 | Slow-speed frame blending | Enrich REQ-502 slow-speed adjacent-frame intent; no guessed blend weights |
| VMG-039 | Video buffer allocation | Enrich REQ-503 system-RAM budget; keep decoder GPU buffering distinct |
| VMG-040 | Post-mix delay compensation | Enrich REQ-504 post-mix position and historical±0.5s span; sign/step/current range remain unverified |
| VMG-041 | Effect restrictions and cost ratings | Enrich REQ-060 real capability restrictions and REQ-347 source metadata/cost labels; current No Restrictions is only a session readout |
| VMG-042 | Global audio-linked effects enable | Enrich REQ-348 current checked control evidence and historical intent; Echo/Distortion subset remains explicit |
| VMG-043 | Info input/output dimensions and calculation FPS | Add MR-11 |
| VMG-044 | Info GPU buffering and colorspace | Add MR-11 |
| VMG-045 | YUV handling, version and debug prerequisites | Add MR-13 |
| VMG-046 | Historical effect behavioral input distinctions | Add MR-14 |
| VMG-047 | Historical temporal/transition semantic contracts | Enrich REQ-347 via linked per-effect/transition contracts and historical frame/boundary examples; no extra algorithm-count row |

## Exact enrichment rules

- KeepREQ-103–110 andREQ-496–507 provenance. Prefer enriching the later behavior rows; do not delete the observed-label rows or count their menu choices as new executed tests.
- Fold Media Crate collection/order/Next intoREQ-349 with separate acceptance cases. Recoveredp12 ordered Next supersedes the old independent random-Next expectation; automatic load Random remains independent. Runtime correction and browser results retain their own cutoff, not automatic reference equivalence.
- UseREQ-153 for offline/practice Video preparation;REQ-076 is end-of-track autoplay and should not be overloaded with every offline action.
- ExtendREQ-283/284 for saved overlay drafts, live saved-instance updates and image decode support. A general reusable-preset claim does not already execute those branches.
- Extend generic recordingREQ-199/200/367/368/370 with Video-specific tests. Preserve existing audio-only tap/split facts; the manual's record gain/meter wording does not independently prove a pre-master Video tap or universal2GB Video-container split.
- REQ-060 already requires real capability constraints; add the current No Restrictions observation and historical effect-cost metadata there and inREQ-347 rather than making another capability-label row.
- LinkREQ-347 to per-effect/transition contracts for historical temporal examples. MR-14 is separate because eight-band Analyzer and hardware-EQ authority are missing **input paths**, not additional names in the 55/34 implementation count. Unknown registration still needs explicit unavailable status.

## Model routing: inherited, not escalated by this report

| Added keys | Existing feature/profile | Existing Codex / optional Claude |
|---|---|---|
| MR-01, MR-02, MR-04, MR-11, MR-12, MR-13 | VID-001 / S | gpt-6.1-sol · xhigh / claude-opus-5 · high |
| MR-03 | LIB-003 / U | gpt-6.1-sol · high / claude-sonnet-5 · medium |
| MR-05, MR-06, MR-07, MR-08, MR-14 | VID-002 / U | gpt-6.1-sol · high / claude-sonnet-5 · medium |
| MR-09 | HW-002 / U | gpt-6.1-sol · high / claude-sonnet-5 · medium |
| MR-10 | HW-010 / H | gpt-6-astra · xhigh / claude-opus-5 · xhigh |

All feature routing is copied from the existing registry. None is a fresh availability check, model invocation or global routing change. Generic hardware/recording enrichments retain their own originalHW/REC profiles; do not transfer their recommendations to unrelated UI work.

## Deferred or intentionally excluded

Do not add vendor purchase/activation/demo identity, obsolete QuickTime/DirectShow/Perian installation, a current factory default inferred from 2015, or a nonexistent current version-number control. Historical MovieInfoBatch prerequisites remain qualified until current behavior is established; MR-13 needs truthful debug capability, not that vendor utility by name. Contour Faders remainsREQ-506 with its existing unknown curve. No extra Syphon requirement is needed:REQ-345 already owns native publication. Hardware/native acceptance remains separately blocked until approval.

## Merge and done criterion

Parent merge order: enrich existing rows and attach sources first, then assign final IDs to the 14 independent action families, preserve per-feature routing, validate every VMG disposition and recount canonical requirements. Reconcile any concurrently added rows before assigning numbers;521 is only the isolated507+14 arithmetic.

A documentation merge is verified by canonical IDs/source links/routing and no accidental duplication. Functional acceptance requires each real browser/native/hardware path listed in the requirement; labels, an idle Info readout or a generic controlled collaborator pass cannot satisfy those paths. No full active-reference catalog, algorithm parity, physical output or native acceptance is claimed.

Baseline hashes for this reconciliation:

- `interaction-requirements.json`: `dcc71b21dc3cc2a8437215f7f3d8c0bbaa8c919635aac314f71f2746fef9d1a4`
- `VIDEO_REFERENCE_SETTINGS_20261016.json`: `1476afd897f2316cfa40ca135e839b6f26e3d073941d202f9131d9f3f7bdd2af`
- `feature-registry.json`: `c4df76f65ee8962845daddcc3855e0b2350917572b6e6f8f815fb3b763e3a71c`

Skills applied: use, gap-analysis, dec-quality-testing.


## Parent merge executed — 2026-10-17

REQ-508–521 now encode the14 recommended families. Parent executed the existing
inventory generator and verified521 unique requirements, all507 earlier IDs,
unchanged existing routing, new inherited routing, all47VMG dispositions and110
feature groups. `video-manual-registry-merge.json` records hashes and mappings.
This verifies documentation/generated accounting only; all new reference-parity
flags remainfalse and native development remainsblocked.
