# Recovered official Video manual: behavioral gaps

**Proposed rows only.** The canonical507 requirements are unchanged. The accompanying [JSON](video-manual-gaps.json) has 47 provisional VMG rows with triggers, expected state/actions, current code-path findings, canonical links, falsifiable tests and unchanged per-feature model routing. Some enrich already implemented behavior; this is not 47 newly missing features or executed acceptances.

## Provenance and edition

The recovered [officially linked PDF](https://serato.com/downloads/files/141226/Serato+Video+Software+Manual+for+Serato+DJ.pdf) is 27 pages and 425,843 bytes. Local copy: `local-evidence/claude-fable/official-video-manual-141226.pdf`; SHA-256 `85c57756dc96587b7b4822e2911decb4b9202f5a1d6b1cba047e1159236ae66c`. I independently checked these bytes and `pdfinfo`, then read all 27 pages using its text extraction. Fable recovered the download; the parent independently verified the official URL with a normal browser User-Agent. No native app was controlled.

PDF creation and modification metadata are **2015-04-09**. A 2025 HTTP modification header does not make this a 2025 edition. Current linking makes it a valid historical primary source, not proof that every behavior/default still holds in 4.0.10. Earlier403/404 reports describe failed retrieval attempts and must not now be read as proof that no official manual is accessible.

## High-impact findings

- **Media Crate Next conflict (p12):** the manual distinguishes random automatic selection from pressing Next, which follows crate order even when Random is on. Current `next→resolve(advance:true)` still uses randomMode. Existing random-Next passes establish the independent policy; they do not verify this manual behavior. Preserve those results and reconcile the policy explicitly.
- **Independent Video faders (pp8–13):** per-channel opacity and link/unlink are separate from crossfader linking. Current global linking combines transport, upfaders and crossfade; it does not expose every documented independent state.
- **Directional automatic fades (p9) and speed direction (p23):** the manual supplies left/right actions and slow-left/fast-right speed direction. The current continuous sinusoidal Automatic mix is a different independent behavior. Numeric durations/curves remain unknown.
- **Preparation/save states:** FX Save is scoped to loaded media; overlay New discards unsaved edits, and saving an edited loaded effect updates that loaded definition. Global metadata presets are useful but do not prove these identity/draft transitions.
- **Recording (p16):** Video Mix selection, record gain/meter, unsaved take replacement, named Save and Recording crate entry are distinct actions. Dedicated capture/download proves a useful subset, not the whole recorder workflow. Historical480p/24fps and aspect statements are not current factory-default or performance proof.
- **MIDI (pp17–18):**26 documented control groups cover Video faders, FX/transition selection, link toggles, directional fades, overlays, panels/fullscreen, FX Save and association. Generic MIDI learn rows do not make these Video targets routable.
- **Info (p24):** original input dimensions, GPU buffered frames, source colorspace, output size, calculated-outputFPS, YUV handling, version and conditional debug tools have different meanings. Current CPU submission timing/frame count cannot substitute for all of them.
- **Historical effects (pp19–21):** eight-band Analyzer and hardware-EQ inputs are concrete distinctions from current three-band approximations. Sixteen prior-frame Delay Grid prose merits a separate timing comparison. Broad semantic evidence does not recover exact algorithms or active4.0.10 menus.

## Current Effects / Info evidence reconciled

The parent subsequently observed the installed **4.0.10(4010213) arm64** Effects and Info screens. [Saved observation](VIDEO_REFERENCE_SETTINGS_20261016.json) and [UI record](UI_OBSERVATIONS.md#current-video-effects--info-observation--navigation-gap-closed) supersede earlier navigation failures. This worker read the saved evidence; no additional native operation was performed.

| Proposed row | Now observed | Still unknown |
|---|---|---|
| VMG-041 | Effect Restrictions reads No Restrictions. | Successful invocation of every effect, complete active catalog, cost and restriction behavior on another GPU. |
| VMG-042 | Audio Linked Video Effects is checked. | Factory default, which mappings engage, transfer functions, timing and tails. No effect/playback action was performed. |
| VMG-043 | Idle output resolution400×400; OutputFPS and source resolution fields blank. | Loaded-video values and calculation timing. Blank does not mean zero or measured performance. |
| VMG-044 | Input buffered-frame/colorspace fields blank with no Video loaded. | Actual GPU occupancy and source colorspace. Do not fill in guessed values. |
| VMG-045 | YUV menu offers Default, Software Only, RGB Only; Default selected. Enable Debug and Buffer Debug View unchecked. No version-number readout visible in this viewport. | Actual YUV processing, debug toggle behavior/tool requirements, and whether version information exists elsewhere. |

No media/playback/recording/license activation was performed. YUV selection stayed unchanged, Video was restored OFF with hidden controls verified, and Setup was closed. All current control observations are separate from historical manual semantics and from Open Play native approval/acceptance.

The [minimal registry reconciliation](VIDEO_MANUAL_REGISTRY_RECONCILIATION.md) recommends **14 new requirement rows and zero new feature entries**, plus targeted enrichment of existing requirements. The 47 original VMG rows remain a review index; neither their labels nor this count is a canonical merge.

## Comparison with 507 rows

The inspected baseline has **507 rows, 29 under VID-001/VID-002**. REQ-496–507 add control behavior intentions beyond older label rows, but the recovered source now supplies additional state boundaries and measurable semantics. Generic recording/MIDI/library requirements also partially overlap; the JSON retains those related IDs rather than silently duplicating them.

| Classification | Proposed rows | Merge meaning |
|---|---:|---|
| new-behavior | 21 | Review for a new behavior requirement or a split of a broad existing row. |
| enrich-existing | 24 | Prefer enriching the linked existing row before adding an ID. |
| policy-conflict | 1 | Keep the independent result and source conflict explicit; decide policy before changing tests. |
| covered-generic-needs-video-scope | 1 | Generic requirement exists; add Video applicability/evidence rather than a duplicate. |

## Proposed behavior index

All entries below are **documented historical expectations plus proposed tests**. Code findings are source inspection, not a new runtime verdict. Exact detail, limits and routing are in the JSON.

| ID | Feature | PDF pages | Action/state gap | Related canonical rows |
|---|---|---|---|---|
| VMG-001 | VID-001 | 7,8,27 | Output window lifecycle | REQ-055, REQ-345 |
| VMG-002 | VID-001 | 7 | Four-deck hardware / video capacity | No narrow row found |
| VMG-003 | LIB-001 | 10,11 | Video library import with soundtrack | REQ-055 |
| VMG-004 | LIB-003 | 10 | All Audio / All Videos views | No narrow row found |
| VMG-005 | LIB-003 | 10 | Library media status icons | REQ-346 |
| VMG-006 | VID-001 | 11 | Visual-only load over playing audio | REQ-055 |
| VMG-007 | VID-001 | 11 | Audio/video association lifecycle | REQ-349 |
| VMG-008 | VID-002 | 11,12 | Media Crate enable and library integration | REQ-349 |
| VMG-009 | VID-002 | 12 | Media Crate ordered selection | REQ-349 |
| VMG-010 | VID-002 | 12 | Media Crate Next under Random | REQ-349 |
| VMG-011 | VID-002 | 10,12 | Automatic transition selection | No narrow row found |
| VMG-012 | DEK-014 | 12 | Offline Video player | REQ-076 |
| VMG-013 | VID-002 | 8,13 | Per-channel Video upfaders | No narrow row found |
| VMG-014 | VID-002 | 9,13 | Crossfader-only link | REQ-055 |
| VMG-015 | VID-002 | 9,23 | Directional automatic crossfade | REQ-505 |
| VMG-016 | VID-002 | 23 | Automatic crossfade speed direction | REQ-505 |
| VMG-017 | VID-002 | 13,24 | Cursor crossfade focus policy | REQ-507 |
| VMG-018 | VID-002 | 8,12 | Track-scoped FX Save | REQ-347 |
| VMG-019 | VID-002 | 13,27 | Serial channel effect slots | REQ-347 |
| VMG-020 | VID-002 | 14,15 | New overlay draft and discard | REQ-283, REQ-284 |
| VMG-021 | VID-002 | 14,15 | Saved overlay live update | REQ-283, REQ-284 |
| VMG-022 | VID-002 | 14 | Image format eligibility | REQ-284 |
| VMG-023 | REC-003 | 16 | Video Mix recording input | REQ-199, REQ-200 |
| VMG-024 | VID-001 | 16,22 | Recording size/rate/aspect contract | REQ-498, REQ-106 |
| VMG-025 | REC-003 | 16 | Video recording gain and meter | REQ-199 |
| VMG-026 | REC-001 | 16 | Unsaved Video take/save/Recording crate | REQ-200 |
| VMG-027 | REC-002 | 16 | Video destination/free space/temporary recovery | REQ-201, REQ-367, REQ-368 |
| VMG-028 | REC-002 | 16 | Recording capability conditional | REQ-370 |
| VMG-029 | HW-002 | 17 | Video MIDI learn/unassign state | REQ-206, REQ-208 |
| VMG-030 | HW-002 | 17,18 | Video continuous and selection MIDI targets | REQ-052, REQ-053, REQ-054, REQ-381 |
| VMG-031 | HW-002 | 17,18 | Video MIDI discrete actions and panel targets | REQ-210, REQ-242 |
| VMG-032 | HW-010 | 10 | Hardware/MIDI fader authority | No narrow row found |
| VMG-033 | VID-001 | 22 | Window constraint only | REQ-496, REQ-104 |
| VMG-034 | VID-001 | 22 | Output quality budget | REQ-497, REQ-105 |
| VMG-035 | VID-001 | 22 | Output arrangement behavior | REQ-499, REQ-107 |
| VMG-036 | VID-002 | 23 | Media Treatment semantics | REQ-500, REQ-108 |
| VMG-037 | VID-001 | 23 | V-Sync synchronization | REQ-501 |
| VMG-038 | VID-001 | 23 | Slow-speed frame blending | REQ-502 |
| VMG-039 | VID-001 | 23 | Video buffer allocation | REQ-503 |
| VMG-040 | VID-001 | 23 | Post-mix delay compensation | REQ-504 |
| VMG-041 | VID-002 | 4,13,19,24 | Effect restrictions and cost ratings | REQ-347 |
| VMG-042 | VID-002 | 24 | Global audio-linked effects enable | REQ-348 |
| VMG-043 | VID-001 | 24 | Info input/output dimensions and calculation FPS | No narrow row found |
| VMG-044 | VID-001 | 24 | Info GPU buffering and colorspace | No narrow row found |
| VMG-045 | VID-001 | 24 | YUV handling, version and debug prerequisites | No narrow row found |
| VMG-046 | VID-002 | 19,20 | Historical effect behavioral input distinctions | REQ-347 |
| VMG-047 | VID-002 | 20,21 | Historical temporal/transition semantic contracts | REQ-347 |

## Source boundaries that must survive merge

The manual gives useful new specificity: window aspect applies outside fullscreen; frame blending targets adjacent temporal frames during slow playback; buffer budget is systemRAM; delay compensation is a post-mix video shift over the stated±0.5s span. GPU buffered-frame Info is a different quantity fromRAM budget. Exact sign, step, causal lookahead, blend weights and current implementation still need evidence.

Do not promote historical demo/license/hardware authorization or obsolete QuickTime/DirectShow/Perian guidance into independent browser onboarding requirements. No installation/account changes are proposed. The WAV/AIFF2GB split note does not establish a generic Video-file limit. The 2015 V-Sync default-on statement and an unchecked4.0.10 session value are different observations, not proof of a default contradiction.

The effect-description introduction says five menus while the printed category headings also include Filter. Some transition/name/axis prose appears editorially inconsistent. Do not fix these silently into a definitive catalog. Existing47 effects/7 transitions manifest counts,55/33 candidate unions and the separate Open Play Crossfade baseline remain separate evidence. No catalog/model/runtime files were changed.

## Bounded re-entry

Start by reconciling **VMG-010 (Media Crate Next)** as a small policy/test unit: preserve a random automatic selector, add a distinct sequential Next action only if the parent chooses the documented historical behavior, and prove decodedA/B/C order with Random still enabled. This is a proposed next action, not permission to change runtime in this research task. Other units should remain separately owned.

Every proposed row copies the existing feature registry routing unchanged. VID-001 remains Sol/xhigh; VID-002 and ordinary UI mapping work inherit their own profiles; recording/hardware rows retain their preexistingA/H recommendations. This report neither invokes nor verifies any model. A stronger model cannot replace installed-version, real-browser or hardware execution.

No proposed acceptance was executed by writing these documents. Current independent browser/Node evidence remains scoped to its saved runs. Native approval/runtime, exact reference parity and full feature completeness remain open.

Skills applied: use, gap-analysis, dec-quality-testing.
