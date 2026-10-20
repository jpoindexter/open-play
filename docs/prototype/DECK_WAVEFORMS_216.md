# HTML216 — Compact decks and waveforms

20 October2026. Refines the Traktor flat HTML decks to match the mixer215. Two source files change: `traktor-flat-preview.css` and the existing projection in `layout-preview.js`. Original controls, handlers, audio engine, source-waveform analysis and library preview module remain. No dependencies or native build.

## Deck hierarchy and state

Compact now shares a52px header/control grid across two/four decks. Clear numbered badges occupy the existing artwork slot; the generic decorative disc node remains underneath. Track title14px, artist10px, tabular elapsed12px/remaining10px, key11px and aligned sync controls create a stable hierarchy. A104px key region accommodates Unknown without touching the key-step buttons. BPM/pitch has a wider128px field with20px BPM/10px supporting text; tempo remains beside its own deck.

Two-deck Compact reuses the24–28px targets and11px action labels previously limited to four decks. Gain keeps its original range/rotary with a readable auto/value stack. Horizontal cue banks retain two rows; two-deck Vertical retains its larger four-row cue bank. All eight cues and every original core control stay accessible. Active Play has a green fill and pause glyph, active toggles remain blue even on hover, and keyboard focus/owning-deck outlines remain visible. No motion, extra accordion or new hidden control.

Horizontal two-deck height340→344px: larger header/pads/utility targets fit with2px row gutters. Four-deck heights stay296px Horizontal/256px Vertical. Two-deck Vertical344px, Large392px. Explicit Library Focus stays252px rather than being enlarged by the Large-wave preference; four-deck Focus stays204px. Mixer215 composition and44px monitor bar remain.

## Waveform correction

The existing source canvas was fixed at480CSSpx high and almost full workspace width, then its rows were shrunk into the deck canvases. In two-deck Compact, a240px source row was compressed into88px; in four decks,120px became40px. Beat numbers and transient shapes were squeezed with that image.

The projection now measures its existing deck view and gives the hidden source canvas that width and row height×deck count. At the checked two-deck size, source1100×352pixels splits into two1100×176rows, matching the destination1100×176. Four-deck Medium source1058×320 splits into four1058×80rows, matching1058×80. This uses the same decoded-source RGB renderer and immutable frequency profiles; it adds no alternate audio or waveform algorithm. Source sizing applies only to Traktor flat horizontal projection and is absent in Vertical/legacy layouts.

Thin waveform frames, a neutral center playhead/tiny deck-colored pointer and clearer provenance captions improve separation. The marker follows the renderer's existing50% playhead location; pointer events remain on the original scrub lane. The vertical comparison frame and A–D headings use the same treatment. Actual source-audio colors, beat/cue/grid/loop data, detail zoom, overview seek and frequency-coded library thumbnails remain.

## Executed verification

- Four2/4 × Horizontal/Vertical Compact cases: selected72/144 core bounds and mixer spacing clear, all measured interactive targets minimum24CSSpx with no pairwise overlap; eight cue pads per deck. Preserved headings, keys, load/eject, tempo/range, sync/off, slip/Q/key lock, loops/jumps/roll/grid/save, gain and utilities were present in those checks.
- Two/four Compact Loops, Vertical Large, explicit Library Focus and four-deck Full smoke checks clear. A Large-wave preference no longer inflates two-deck Library Focus. Mixer hide/show resized the projected source to the wider deck correctly. Pads restore brought the view back. Switching to legacy Traktor and Vertical left no managed source-size inline style.
- The exact source/destination pixel relationship passed for two-deck Medium/Small, four-deck Medium/Large/Full, Library Focus restore and mixer-hidden paths. Original scrub-lane count remained one per deck. This is a rendered-geometry check, not a new frequency-analysis accuracy benchmark.
- Actual Play timer00:00.2→00:00.3 with active pause glyph and green `rgb(32,92,75)` even under pointer hover; paused and Home restored0. Dragging the projected deck1 waveform moved00:00.0→00:00.2, then Home restored0. Zoom4s→2s→4s. These verify the affected UI/clock/scrub paths, not acoustic quality.
- All ten library waveform preview images loaded, including existing local files. Final two-deck Horizontal Compact/Medium: both timers/tempos0, eight cues each, master−12dB and original gains retained. JavaScript syntax/Git whitespace checks passed; native0.1.27 ASAR SHA256 unchanged: `a4d7135432916a3fb0467d008cd6c97ffb293b4ec63aeeba2e36bff50b60afcb`.

Summary: `DECK_WAVEFORMS_216.json`. Private receipts/screenshots: `local-evidence/deck-waveforms-216/`. Assertions check target bounds, cue count, pixel-size matching, sizing cleanup, zoom/scrub/play response and final paused state. No new test framework. State checks caught hover overriding the active Play fill; specificity was corrected before the final play receipt.

## Scope and re-entry

Design principles: functional/perceptual pattern separation and state precedence (components-and-states); Gestalt alignment/proximity; shared field grid and scoped composition/exception CSS. Ponytail reuses the original projection and controls. This is an HTML presentation change, not full Serato/Traktor/rekordbox parity or native approval.

The existing1440CSSpx review shell scales in narrow windows; Open full size remains. No fresh hardware, acoustic, advanced DSP or full accessibility certification. User visual approval stays open. Keep core DJ priority; no native integration/rebuild before explicit approval.

Trello [UI-HY-01](https://trello.com/c/FkrLm4fa). Claude: compare tod4dd661, check header/control preservation, source/destination pixel matching, resize cleanup and Compact states, and report concrete gaps without native build. Recommendations: Codex gpt-6.1-sol/high; Claude Code Sonnet5/medium; confirm actual availability before invoking.
