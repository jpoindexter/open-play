# HTML217 — Vertical comparison lanes and fader detents

20 October 2026. Base: `497ada0`. HTML prototype only; no native integration, dependency, engine, DSP, MIDI or waveform-analysis change. User visual approval remains open.

## Outcome and boundary

Make two-/four-deck Compact vertical waves useful for timing, with the same retained core controls and library previews as horizontal. Add fader tick marks and meaningful automatic snap points. Stop this pass after the concrete layout and interaction criteria are executed; further subjective refinements await user feedback. Do not interpret this pass as full product parity or permission to rebuild the desktop app.

## Composition

The old two-deck vertical canvas was only 60 CSS pixels high; four decks used 92. A full-height comparison rail now sits beside the existing mixer, within the same deck height. Medium canvases are 96×300 CSS pixels for two decks and 128×472 for four. Two-deck Compact remains 344px high per deck; four-deck remains 256px. No taller performance area is required. The mixer retains its 232px/two-channel or 288px/four-channel budget, with a 4px separator from the comparison rail.

Small/Medium/Large now change vertical rail width: 80/96/112px for two decks, 112/128/160px for four. Large no longer inflates two-deck Compact to 392px. Existing horizontal wave size behavior is retained. Mixer-hidden and Library Focus retain their explicit space-reclaiming behavior.

A–D headings use a 24px strip; provenance has its own 20px footer. Original canvas and focusable scrub lanes share the rectangle between them. Shared playhead lies at the actual canvas midpoint, with subtle lane dividers. This is the original decoded-source RGB renderer, with original beat/grid/cue data, zoom and scrubbing. It is not a decorative replacement or second audio engine. The two existing local MP3s were loaded on C/D for the four-deck evidence; no new files were imported or uploaded.

All eight cues, key/time/BPM, tempo/range, sync/off, load/eject, slip/quantize/key lock, loops/jumps/roll/grid/save, gain and utilities remain. Original mixer/monitor controls and all ten decoded library waveform previews remain. Full mode's tempo rail also stops before transport, correcting the observed Loop Out overlap; its pre-existing smaller controls are not represented as meeting Compact's 24px target criterion.

## Faders

`fader-preview.js` decorates the original ranges; their original delegated handlers still own audio values. Nine evenly spaced travel marks, emphasized endpoints/center, visible focus and blue detent feedback apply in Traktor flat. Other layout variants retain their existing presentation and pointer behavior.

- Crossfader snaps to center (0).
- Tempo snaps to slider center (0). In relative/sync mode this is the existing relative adjustment center, not a forced tempo reset or sync disengagement.
- Channel level snaps only to mute (0) or unity (1). `upfaderGain(1, settings)` is unity for every existing curve. The default .8 is not mislabeled unity or given an arbitrary snap.

Capture radius is 1.5% of the full range. Hold Shift during pointer movement to bypass snaps. Native keyboard steps remain unsnapped: .01 for channel/crossfader, .1 for tempo. Existing modifier shortcuts and MIDI pickup/calibration are retained; physical-controller MIDI values are not snapped. Tempo pointer direction remains negative/slower above center and positive/faster below. No easing or audio automation animation was added.

## Executed evidence

- Two-/four-deck Vertical Compact Medium, two-deck Large and four-deck Small/Large: selected 72/144 core controls present, all eight cues per deck, measured Compact targets at least 24 CSS pixels, no measured interactive collisions or mixer spacing errors.
- Medium direct canvas/scrub geometry: 96×300 / 128×472 CSS pixels. Every original lane remains present. All five/nine visible software faders have nine marks. Ten library preview images decoded and loaded.
- Library Focus, mixer hide/restore, Compact Loops and horizontal regression checks executed. Hidden-mixer audit correctly reports deliberately hidden mixer/monitor controls; this is not an unexpected missing-control pass. Full smoke found and then confirmed correction of the tempo/Loop Out overlap. Its 32 smaller targets remain a documented Full-mode limitation.
- Real pointer input: crossfader near center →0, Shift same point →.02; tempo near center →0, Shift →.1%; level near unity →1, Shift →.99. Channel near mute →0 with blue handle feedback; values restored. Continuous crossfader drag →30% toward B, then center restored.
- Keyboard Right: crossfader →.01, tempo →.1%, preserving precise values inside the pointer snap zone. Restored with Left. Tempo pointer below/above center →+4%/−4%, 129.0/119.0 BPM on the 124 BPM demo, then zero restored.
- Vertical waveform drag advanced paused deck A from 00:03.0 to 00:03.2; detail zoom 4s→2s→4s executed. Final A/B timers reset with Home; all decks paused, channel A .8, crossfader/tempo zero, master −12dB.
- `node prototype/fader-preview.test.mjs`: threshold, bypass, clamping, free positions and meaningful endpoints passed. JS syntax and `git diff --check` passed.
- Native 0.1.27 ASAR SHA256 remains `a4d7135432916a3fb0467d008cd6c97ffb293b4ec63aeeba2e36bff50b60afcb`.

The IAB panel collapsed to near-zero width during this turn. A temporary 1440×960 viewport override was used for pointer/geometry validation and the labeled evidence screenshots, then reset. This does not prove usability at every host-panel width. The existing scaled 1440 CSS pixel comparison shell remains; Open full size is retained.

Evidence: `VERTICAL_FADERS_217.json`; private `local-evidence/vertical-faders-217/checks.json`, `two-vertical-compact.png`, `four-vertical-compact.png`. No fresh acoustic/controller, full accessibility, alternate browser, native runtime or DSP/full-product parity claim.

## Astryx question — researched, not adopted

The user asked whether Meta's Astryx and its components could help. Its official catalog contains Table, Tree List, Power Search, Typeahead, Toolbars, Slider, toggles/selectors, Grid/Layout/Resize Handle, dialogs/tooltips/toasts and other standard UI. These are candidates for library, settings and shell components; waveforms, platters, rotary knobs, meters and DJ-specific interactions still require product components and the existing engine.

The current getting-started page requires React/react-dom ≥19 and the StyleX peer package. Adopting the components would therefore introduce a deliberate migration from this plain HTML/JavaScript prototype, not a drop-in CSS change. No package was installed, no initializer was run, and no instruction/config files were rewritten. Recommendation: borrow region-budget, density, token and state patterns now; evaluate actual component adoption only after layout approval. Do not treat the question as migration approval.

Sources checked 20 October 2026:
- https://astryx.atmeta.com/docs/getting-started
- https://astryx.atmeta.com/components
- https://astryx.atmeta.com/docs/layout
- https://astryx.atmeta.com/docs/cli

## Tracking / Claude re-entry

Trello UI-HY-01: https://trello.com/c/FkrLm4fa. Compare against `497ada0`; inspect original-range ownership, Shift bypass, relative tempo semantics, vertical canvas/lane/playhead alignment and control/preview preservation. Do not rebuild native. Existing model recommendations: Codex gpt-6.1-sol/high; Claude Code Sonnet5/medium, verify availability before invocation. No other agent was invoked in this pass.
