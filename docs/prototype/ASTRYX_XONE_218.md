# HTML218 — Astryx standard UI and Xone-inspired DJ markings

20 October 2026. Base `3837658`. User authorized actual Astryx adoption for the prototype and supplied an Allen & Heath Xone:96 photograph as a control-marking reference. Prototype only: no desktop build or integration.

## Implemented

45 actual Astryx Button, ToggleButton, Selector and TextInput controls replace the visible shell/library controls: workspace choices, zoom/display/deck selectors, toolbar actions, library search/analysis/navigation, crates controls and Autoplay. Components are locally bundled from Core/Neutral 0.7.1, React/react-dom 19.3.1 and StyleX 0.19.1 with esbuild 0.28.2. Package versions/lockfile, source, generated browser assets and license notices are committed. No CDN, remote font dependency or Astryx CLI initializer is used.

These are React islands over the existing control handlers. Original controls retain their IDs/state as hidden, non-tabbable, aria-hidden backing elements; actual Astryx components provide the visible UI. Click modifiers and disabled states are preserved. Selectors/search forward real input/change events; the search shortcut focuses the actual input. The global quantize control retains its mixed ARIA state. React observes backing-control changes rather than subscribing to 60Hz deck/timer/meter mutations. The bundle build asserts that the actual four Astryx component modules are present and the DJ engine is absent.

The library table, crate hierarchy, native More disclosure/dialog containers, existing dialog/settings forms and all custom DJ surfaces remain their existing implementations. This is shell/library-control adoption, not a rewrite of every secondary panel. Original waveform thumbnails, sorting/column preference, library row identity, engine, DSP and MIDI ownership stay intact. `prototype/ui` is an isolated frontend build workspace, not a desktop build.

Xone:96-inspired fixed scales surround the existing mixer, master, track-gain and headphone knobs: 13 graduations per scale, a prominent center mark, dark faces and white pointers. Mixer faces are 22px in 44px cells; measured knob-to-label clearance is 5.5px. Library Focus retains tighter cells. Existing angle/range mapping, keyboard/drag/Shift-fine behavior and double-click resets remain.

Channel/tempo/crossfaders retain the nine travel marks and HTML217 detent behavior, now with dark rails, emphasized major marks and contrasting cap center lines. Printed Xone dB scales, four-band EQ and analogue curves are not substituted for our software ranges/algorithms. The reference informs appearance; this is not a Xone sound or hardware emulation.

## Executed verification

- All four 2/4-deck × Horizontal/Vertical Compact cases: 72/144 selected core controls present, eight cues per deck, measured interactive targets at least24 CSSpx, no measured collisions or mixer-spacing errors. All ten library preview images loaded. 45 Astryx controls; 15/27 rotary scales, each with13 marks.
- Actual Astryx selectors switched deck count/orientation; keyboard selection changed to Vertical without starting playback. Library Focus two/four decks, mixer hide/restore, crates hide/restore and FX navigation were checked. Import remains visible with crates hidden; the file chooser/import itself was not exercised again.
- Search filtered Glass Transit to one row with its preview; clearing and crate navigation restored all results and synchronized the visible search field. Command-F focused the actual Astryx search input. GlobalQ off/on and a per-deck change preserved global `aria-pressed=mixed`.
- The Preview waveform checkbox hid the column and restored it (visibility checked, not image count alone). Native columns dialog still opens/closes through the new button.
- Original filter drag0→.18 moved its pointer0→24.3°, double-click restored0. Crossfader near-center pointer input snapped to0; Shift preserved.02. Existing fader detent self-check passed.
- Original Play advanced deck1's timer00:00.1→00:19.0; Pause stopped it at00:19.1, then Home reset it. This confirms the UI transport path, not fresh listening or hardware output.
- Production UI bundle built with its module-boundary assertions; JS syntax and `git diff --check` passed. Existing native0.1.27 ASAR SHA256 remains `a4d7135432916a3fb0467d008cd6c97ffb293b4ec63aeeba2e36bff50b60afcb`.

Screenshots: private `local-evidence/astryx-xone-218/two-horizontal-compact.png` and `four-vertical-compact.png`. Existing local MP3s were loaded on C/D for the latter; nothing new was imported/uploaded. Evidence JSON retains the targeted measurements. The review panel was collapsed to zero width, so the existing1440×960 test override was used for interaction/layout verification and screenshots, then reset.

A few reloads produced an unattributed automation-console MutationObserver/Node error. Temporary shell/frame error listeners did not reproduce/capture it; the component count and tested UI paths remained available. Origin is not established and no blanket clean-console claim is made. Keep this evidence if a startup issue recurs; do not change engine behavior to suppress it.

Visual approval remains open. No fresh acoustic/controller, full accessibility, alternate-browser or complete product-parity claim. No native rebuild/integration is authorized by this pass.

## Tracking and handoff

- Astryx: https://trello.com/c/KOTUJWqC
- Xone markings: https://trello.com/c/OYHKI6Q4
- Parent layout: https://trello.com/c/FkrLm4fa
- Preview: http://127.0.0.1:8848/prototype/layout-preview.html

Build frontend assets only with `npm ci --prefix prototype/ui` then `npm run --prefix prototype/ui build`. Compare to `3837658`. Review actual backing/visible-control event parity, keyboard focus, mixed/disabled states, original-node preservation and scale clearance; do not invoke desktop packaging. Recommendations: Codex gpt-6.1-sol/high; Claude Code Sonnet5/medium for bounded UI review, verify actual availability first. No second agent was invoked.

Sources inspected:
- https://astryx.atmeta.com/components
- https://astryx.atmeta.com/docs/getting-started
- https://support.allen-heath.com/hc/en-gb/articles/43053562464017-Xone-96-User-Guide
- User-supplied Xone:96 photograph; no photo or vendor branding copied into the UI.
