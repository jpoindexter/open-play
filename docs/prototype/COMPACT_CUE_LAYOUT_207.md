# HTML207 — match the supplied rekordbox cue-bank composition

19 October2026. Jason rejected206 after supplying the9:21PM native rekordbox4Deck Vertical screenshot. The earlier correction shortened deck heights but retained a stretched loop area while hiding cues. That failed the visual requirement.207 supersedes that direction.

## Screenshot-derived composition

Native reference: A–D/E–H cue rows occupy the outer half of each deck; narrow loop controls sit beside stacked mode/CUE/Play, circular jog/BPM and Slip/Q/MT. The right side mirrors that grouping. Compact now defaults to the actual original eight hot-cue buttons in two columns, not decorative placeholders.64px loop column, stacked20px mode selector and28px CUE/Play,80px jog. Cue rows16px with2px gaps and16px mode selector fit the88px control band; these are dense desktop targets with their original keyboard behavior, not a touch accessibility claim.

Existing loop Save is moved to the deck footer, preserving its bound data-action and handler while avoiding an extra row in the narrow loop block. Utilities, pitch/key, track metadata, overview, sync, mixer and headphone controls remain accessible. Default224px deck height retained (2V240px). No claim of exact proprietary pixel parity; this is the user's supplied composition adapted to existing Open Play controls.

## Presentation behavior

Compact rekordbox defaults to an open cue bank. User may still explicitly hide/reopen it; doing so stays Compact. Other workspace defaults are unchanged. Selecting a non-Cues performance mode expands Full so its existing additional controls are not squeezed into cue-only geometry. Capturing the requested mode before changing density is necessary because decoration refreshes the selector. Initial check caught a fallback to Cues; fixed that ordering, then observed actual Full/Loops. Restored Cues/Compact.

## Executed verification

Actual normal HTML,1440CSS-pixel canvas:2/4decks × H/V Compact each show8visible cue rows/deck,64px loop blocks, Save in footer; selected72/144 core nodes contained, original mixer rotary hit areas clear, crossfader center0px. Full2/4H/V core bounds also inspected because the existing Save node moves there. User screenshot and final HTML view are retained privately in local-evidence/compact-cue-layout-207/; full DOM receipts and compact public summary COMPACT_CUE_LAYOUT_207.json.

Normal deck1 hot cueA set→filled Cue1 at0s, then Shift-clear→empty. Cue panel hide/reopen remains Compact. Non-Cues select expandsFull and preserves Loops, then returns to Cues/Compact. No audible session initiated or broad DSP/hardware testing performed for this layout change. Existing loop Save action remains source-path reuse; only its placement/visibility checked here, not a new loop-save acceptance.

Only prototype/layout-preview.js, rekordbox-preview.js and rekordbox-preview.css changed implementation. Original app/engine/MIDI/waveform JS and native0.1.27 package unchanged. HTML only until explicit integration approval. User visual approval and exact native/full parity remain open.

Trello [UI-RB-06](https://trello.com/c/miElcJk0) renamed/updated; superseded206 retained below the correction. Build plan and Claude handoffs synchronized, original project prompt suffix retained. Existing model recommendations Codex gpt-6.1-sol/high and Claude Code Sonnet5/medium retained; verify availability before invocation. No agents launched; core DJ focus retained.
