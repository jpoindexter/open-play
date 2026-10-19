# HTML205 — rekordbox control spacing

19 October2026. CSS-only refinement of the existing reference-based rekordbox layout, preserving all original bound controls and the other workspace variants. Native0.1.27 was not rebuilt or integrated.

## Corrections

Four-deck Compact previously had36px input boxes inside32px knob rows, offset2px; targets extended into the next row. The revised input box exactly fills its label with padding/border/margin reset. Knob indicator pivots now derive from ring size. Consistent Full40px/Compact36px rotary rows with24px/20px rings,10px labels,4px gaps and at least4.5px measured ring-to-text clearance. Channel headers, CUE and faders share axes; two-deck Vertical retains mirrored trim/CUE/fader beside EQ.

Changed spacing uses local --grid-* tokens based on4px. Deck row budgets accommodate the controls instead of allowing controls to escape the grid. Utility and transport rows gain consistent gaps and24px utility buttons/36px transport buttons. The48px bottom band fits headphone controls and both assignment rows; crossfader remains exactly centered. Four-deck Horizontal uses bounded128px fader travel and a vertically grouped mixer, rather than faders stretched over two deck rows. Existing waveform/library dimensions and untargeted legacy styles remain scoped outside this migration.

Design skills applied: design dispatcher routed layout-and-composition, grid-and-spacing, dense-no-scroll-layout and accessibility-and-inclusive-design; user-invoked grid-spacing supplies --grid-* tokens. find-skills reviewed the directory leaderboard; installed skills cover this task, so no new installation. dec supplies Gestalt proximity/continuity, consistent constraints, CSS architecture and keyboard/focus principles. Native reference remains Jason's provided rekordbox screenshots; this pass makes no fresh vendor-feature claims.

## Executed acceptance

Actual localhost browser at1440CSS-pixel internal canvas: all8 combinations of2/4 decks × Horizontal/Vertical × Full/Compact. Each has8/16 visible rotary controls, no rotary target overlap or escape, minimum4.5px ring/text clearance, selected29/55 core controls visible and within their owning deck/channel/footer, crossfader0px center offset, exactly2 monitor inputs and library thumbnails retained. Report scope is the named selection, not every optional panel. Private full geometry and screenshots: local-evidence/rekordbox-spacing-205/; compact public summary REKORDBOX_SPACING_205.json.

Normal keyboard actions: deck1 HIGH0→0.3, preserved through mixer hide/show, restored0; deck3 level0.80→0.79→0.80; headphone MIX50→50.1→50%. All decks paused; no audio session initiated. Five views visually inspected:2H Full,2V Full,4H Full,4V Full and4V Compact. Prior204 pointer/reset/Setup/persistence evidence is unchanged; do not claim those were all rerun here.

Native0.1.27 ASAR hash remains a4d7135432916a3fb0467d008cd6c97ffb293b4ec63aeeba2e36bff50b60afcb; git whitespace check passes. Only prototype/rekordbox-preview.css changes implementation. App/engine/MIDI/source waveform JS unchanged.

## Limits and continuation

User visual acceptance remains open. The selected geometry checks do not establish all viewport sizes, screen-reader/zoom/touch accessibility conformance, sound quality, actual hardware response, native integration or complete vendor parity. No broad audio regression sweep for a CSS change. Keep HTML only until Jason explicitly approves integration; core DJ remains priority. Current review view4Deck Vertical Compact.

Trello: [UI-RB-04](https://trello.com/c/Rx4NWhjG), with prior203 evidence retained. Build plan and both Claude handoffs updated; original project prompt suffix preserved. Model recommendations remain Codex gpt-6.1-sol/high, Claude Code Sonnet5/medium, verify availability before invocation. No agents launched.
