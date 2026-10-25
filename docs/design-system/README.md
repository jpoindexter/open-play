# Open Play design system

One product system, six layout geometries. Standard controls use the installed Astryx Core/Neutral 0.7.1 APIs. Knobs, faders, pads and waveform renderers remain custom DJ components.

## Source and ownership

- `prototype/design-tokens/serato-core.tokens.json` is the canonical DTCG primitive → semantic → component source. Its historical filename and reference provenance are retained; it is an Open Play system, not a vendor's proprietary token export.
- Run `node scripts/build_performance_tokens.mjs` after token changes. Generated CSS and canvas colors must not be edited directly. Day mode changes semantic roles through the same source.
- `prototype/design-system.css` is the workspace entry and records the existing cascade order. This entry is a migration seam, not evidence that every adapter is unified.
- `astryx-preview.css` owns standard component presentation. `workspace-toolbar.css` owns performance chrome and Settings placement. Both consume semantic roles; no raw color or pixel values remain in these files.
- Remaining adapters retain historical deck/mixer geometry and still contain literal values/conflicting presentation rules. Migrate shared control ownership before removing those rules; never hide a control to simplify the stylesheet.
- Raw visual values belong in token primitives. Components consume semantic/component roles. Unitless structural ratios, percentages, viewport constraints, SVG paths and audio-derived waveform data are geometry/data rather than palette tokens. Vendor/generated outputs are not hand-authored migration targets.

## Component contracts

Use actual Astryx Button, IconButton, ToggleButton, Selector, form fields and Dialog through `prototype/ui/controls.jsx`. Original controls retain IDs, state and handlers. Moving controls moves their island host, not a duplicate copy. Accessible names, pressed/current/disabled states, tooltips and focus remain required. Build with `npm run build` in `prototype/ui`.

Standard command buttons use quiet transparent surfaces without default borders. Preserve hover, selected/current and keyboard-focus feedback.

Header: deck count, View, library/mixer visibility, Quantize, panels, REC/FX, Master/meter, audio/help/Settings, waveform zoom. Shared standard controls use a 32px target inside a 40px row; the dense DJ surface keeps its separate control contracts.

Settings → Layouts: six layouts, waveform orientation, deck density, wave size, day/night and display reset. Audio/MIDI retain their original launch controls. Advanced retains useful engine/feature/diagnostic status. Nested pages return to Settings; closing returns focus to the opener. Settings tabs remain visible while scrolling.

## Remaining work

UI-DS-01 tracks all-runtime migration, a real component/state reference and the authored-style guard. Current delivery only migrates the standard bridge/header and establishes the entry/tokens. Legacy layout values are not grandfathered as the finished system. Verify changed controls in the actual workspace, including 2/4 decks and H/V, without repeating unrelated DSP matrices.
