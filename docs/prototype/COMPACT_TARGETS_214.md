# HTML214 — Usable four-deck Compact controls

20 October2026. Four-deck Compact gets larger controls without removing features. Only `prototype/traktor-flat-preview.css` changes application presentation; no JavaScript, engine, audio analysis, MIDI, dependency or native-package change.

## Layout correction

- Cue pads18→24px tall; all eight stay in a four-column/two-row bank in both orientations. Names/status remain with their original nodes. General transport, loop, utility, disclosure and assignment targets are28px; key/sync controls are24px. Action labels8–9→11px; key-step symbols16px. Artwork, title, elapsed/remaining time, musical key, BPM, pitch, Sync/Off all remain visible.
- Header52px accommodates two usable24px rows; sufficient width for Unknown key prevents text/button collisions. Deck gutters4→2px reclaim14px across the horizontal rows. Horizontal decks268→296px: the extra28px is occupied by larger controls, not blank padding. Vertical cue bank uses two rows instead of four, allowing decks268→256px with larger controls. Horizontal detail-wave40px remains; overview gets its full24px hit region, clear of cue pads.
- Gain uses its existing rotary at28px with an inline two-line auto-gain/value readout. All utility buttons remain visible. Pitch range gets a full28px rail width; horizontal label writing and vertical row placement keep it inside the deck and away from Loop Out.
- Crossfader assignments share one row around the centered crossfader; their16px targets become28px without increasing the44px monitor bar. Headphone MIX/LEVEL, channel trim/EQ/filter/CUE/faders and master knob remain original controls. Core selectors, load/eject, key shift/sync/reset, tempo/range, slip/quantize/key lock, loops/jumps/roll/grid/save, reverse/repeat/censor/double and all performance modes remain.
- Existing decoded-source RGB library waveform previews, filtering, sorting, column preference and crates/import paths are unchanged. Original two-deck/Full/other workspace layouts remain available. No extra accordion or feature-hiding Compact mode added.

The target criterion is minimum24×24CSSpx interactive regions, larger action text, no pairwise target collision or selected core bounds escape, retained eight cues per deck, and working affected actions. Density reasoning uses the established field grid and CUBE composition/exception scope; Nielsen recognition/consistency and semantic keyboard access remain. Ponytail full mode keeps this to the existing CSS adapter.

## Executed checks

Horizontal/Vertical Compact each retained144 selected core nodes, eight cue nodes per deck, and no selected mixer/knob bounds errors. All211 horizontal and207 vertical visible deck/mixer/monitor interactive targets met the24px criterion with no measured pairwise overlap. Compact Loops, explicit Library Focus, mixer hidden, horizontal Small and vertical Large also had no measured undersized/colliding targets or core escapes. Open FX stayed below the performance/monitor area. Four-deck Full and two-deck Compact smoke checks had no selected core bounds errors.

Pointer CueA set then Shift-delete restored empty. Loop Half changed4→2, Double restored4. Keyboard deckB tempo0→+.1% changed126→126.1BPM, then restored0. DeckC assignmentA→Thru was observed and restoredA. One browser command timed out after the selection; a fresh DOM read confirmed Thru before restoration. This is recorded UI behavior, not acoustic/controller acceptance.

All ten library row preview images loaded, including the existing local-file tracks. Glass Transit filtering retained the matching waveform. Search cleared. Final four-deck Horizontal/Compact/Medium: all timers00:00.0, all tempos0, master−12dB, assignmentsA/B/A/B, CueA empty and Loop4. Screenshots cover both orientations. Git whitespace check passed. Native0.1.27 ASAR SHA256 remains `a4d7135432916a3fb0467d008cd6c97ffb293b4ec63aeeba2e36bff50b60afcb`.

Raw receipt: private `local-evidence/compact-targets-214/checks.json`; summary `COMPACT_TARGETS_214.json`. Screenshots in the same private folder. The first size pass caught inherited pitch overflow, header text collisions and waveform/tempo hit overlap; final receipts are after those corrections.

## Limits and re-entry

The24px values are CSS pixels in the existing1440CSSpx review surface; the comparison shell scales on smaller windows and has an existing Open full size link. These targeted checks are not full WCAG, responsive, acoustic, physical MIDI, DSP or product-parity certification. Other layouts' density was preserved rather than redesigned. Full/performance panels may scroll.

User visual approval remains open. HTML only; no native rebuild/integration until explicit approval. Keep the core DJ experience first. Trello [UI-HY-01](https://trello.com/c/FkrLm4fa). Claude: compare to3b237f2, verify original-node preservation and enlarged Compact control access without rebuilding native. Recommended implementation/review: Codex gpt-6.1-sol/high; Claude Code Sonnet5/medium; confirm availability before invoking.
