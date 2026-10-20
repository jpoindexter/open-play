# HTML219 — Astryx forms and readable fader scales

20 October 2026. Prototype only. Desktop 0.1.27 was not rebuilt or integrated.

## Changes

- Actual Astryx CheckboxInput, NumberInput, Slider and TextArea join Button, ToggleButton, Selector and TextInput. A dialog-scoped enhancement bridge handles newly opened or redrawn forms; original input IDs, names, values, FormData and listeners remain intact. Labels are extracted without including select-option text. Existing native color pickers and OS file chooser remain native; DJ ranges/rotaries remain custom.
- The existing native modal retains showModal/close/Escape/focus restoration. Its inner preview surface uses actual Astryx Dialog in documented inline-preview mode; this is not a replacement of the modal lifecycle. Popovers stay inside the modal's top layer using Astryx's own placement behavior.
- Original required/min/max validation remains authoritative. Invalid backing fields prevent submission, display Astryx error status and focus the visible corresponding field. Valid edits clear that error. This fixes a migration regression reproduced with an empty crate name: submission was blocked but focus stayed on Submit without an adjacent visible error.
- Removed the 13-mark rotary graduation rings the user disliked. Existing simple faces and white pointers remain. Channel travel ticks sit beside the slot, with longer endpoint/midpoint marks and a contrasting position stripe on the cap. No analogue dB labels copied from Xone:96: our gain curve is different. Existing endpoint/neutral snaps, Shift bypass, keyboard precision and MIDI calibration unchanged.

## Executed checks

- Frontend-only esbuild production bundle built; build asserts all nine actual Astryx component modules are included and the DJ engine is not.
- Library Columns checkbox hides/shows the actual waveform-preview column, then restores it.
- Setup selector changes Quantize Value from 1 Beat to 1/2 Beat and back through the actual modal popover. Settings slider ArrowRight updates its original value; Home restores 0. Escape closes the modal and returns focus to Open Setup.
- Analysis Minimum BPM 250 with Maximum 220 is rejected by the original cross-field validation; restoring Minimum 50 saves successfully. No analysis/clear/stem button was intentionally triggered for these checks.
- Empty required crate name rejects submission, shows a visible message and focuses an aria-invalid visible input. Typing clears the message; Cancel closes without creation. A temporary default New crate created in an earlier submit-path check was removed through its settings, restoring the original four crates.
- Two-deck Horizontal Compact: 72 selected core controls and ten decoded library previews; selected geometry checks have no errors. Four-deck Vertical Compact: 144 selected core controls, eight cues/deck and ten previews; no measured overlap or undersized custom DJ targets. Zero rotary graduation rings. These are bounded core UI checks, not full feature parity or accessibility certification.
- Actual channel fader pointer at unity reports 100%/unity. Crossfader near center snaps to 0; Shift bypass reports 0.02; restored to 0. Channel restored to 0.8. Fader detent unit checks pass.
- Desktop 0.1.27 ASAR SHA-256 remains `a4d7135432916a3fb0467d008cd6c97ffb293b4ec63aeeba2e36bff50b60afcb`.

## Startup error — OPEN

The intermittent automation-console error is `Failed to execute 'observe' on 'MutationObserver': parameter 1 is not of type 'Node'`. Original errors at 13:17:59 and 13:27:26 UTC contain no stack/source URL. An early, temporary diagnostic wrapper checking `target instanceof Node` logged an injected `_setupGlobalListenersRemovalDetection` / `injectedForWindow` listener receiving a foreign HTMLDocument. Foreign-realm instanceof checks can fail for valid Nodes, so those traces do **not** establish the original throw's cause. A narrower catch/rethrow diagnostic did not capture the original throw during its brief run. All instrumentation was removed. No error suppression, prototype observer null guard or speculative dependency patch was committed. Do not call this startup issue fixed; it remains tracked on UI-AS-01. Normal tested UI paths are available despite this unresolved console report. Next step: capture the actual throwing call and its realm during a failing navigation, before changing Open Play or browser tooling.

## Review and handoff

Private screenshots/full data: `local-evidence/astryx-forms-219/`. The IAB panel was collapsed; the supported temporary 1440×960 test viewport was used for interaction and screenshots and then reset. No hardware, acoustic, full-dialog inventory, full accessibility or Serato/rekordbox/Traktor parity acceptance was performed. Forms migrate generically when opened, but each specialized form still needs its own acceptance when that feature is worked on.

Trello: [Astryx forms](https://trello.com/c/KOTUJWqC), [simplified control scales](https://trello.com/c/OYHKI6Q4), [layout parent](https://trello.com/c/FkrLm4fa). Visual approval open. Recommendations: Codex gpt-6.1-sol/high; Claude Code Sonnet5/medium, verify availability. No other agent invoked. Native integration requires a separate user approval.
