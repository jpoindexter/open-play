# HTML204 — headphone MIX and LEVEL in the bottom bar

19 October2026. Jason requested inline headphone controls like his rekordbox screenshot. The rekordbox HTML preview replaces the old headphone Setup button with an original headphone icon and two rotary controls: MIX and LEVEL. Crossfader remains centered; channel assignments remain beside it. Existing203 mixer spacing and202 library waveform previews are retained.

## Behavior and implementation

- MIX blends cue at0% to master at100%. LEVEL uses the existing gain curve:10% unity; higher values add up to12dB. Existing saved settings are honored.
- Drag vertically; keyboard arrows adjust0.1 percentage points. Shift-drag fine adjustment is implemented. Double-click MIX resets50%; LEVEL resets10% unity.
- Each input calls the existing engine.setMonitorSettings with one field, updates the matching state.settings entry and visible Setup range, then uses the existing persist function on commit. Master Cue/Split Cue/Mono are preserved by partial updates.
- Existing Setup/controller updates are reflected from the current engine monitor-settings reference. This adds no audio graph or routing replacement.
- New module prototype/headphone-preview.js is mounted only by the preview adapter. prototype/app.js only exports its existing unchanged persist function; this is a source export change, not a native build. Preview JS/CSS replace the button, size the two controls and retain keyboard focus outlines.

## Executed acceptance

Actual localhost HTML UI, no hidden runtime mutation: both knobs respond to vertical pointer drags (MIX50→66.2%, LEVEL10→26.2%); both keyboard arrows increment0.1 percentage points. Setup reads the corresponding changes. Changing Setup Cue Mix0/Cue Volume1 updates the knobs. Inline changes to0.1%/1.1% survive normal reload. Double-click returns50%/10%.

Two-deck Horizontal Full and four-deck Vertical Compact retain exactly two controls and no old headphone button. Mixer hide/show hides/restores the controls. Crossfader center offset is0px in these observed layouts. Library previews remain visible. Starting Cue Mix50%/Cue Volume50% restored through Setup; decks paused throughout. Private screenshots and geometry: local-evidence/headphone-controls-204/. Results: HEADPHONE_CONTROLS_204.json.

Syntax checks and diff whitespace checks pass. Native0.1.27 ASAR remains a4d7135432916a3fb0467d008cd6c97ffb293b4ec63aeeba2e36bff50b60afcb. No native package/integration/rebuild.

## Limits and next review

UI settings/persistence are executed evidence. Existing audio graph reuse and external MIDI update following are source-path evidence; no fresh hardware/acoustic acceptance claimed. Shift fine drag and cancellation branches were not separately exercised. User visual approval remains pending. No full-product parity claim. Keep work HTML only until Jason approves native integration; core DJ remains priority.

Trello: [UI-RB-05](https://trello.com/c/lor8EHEW), linked from UI-RB-03. Receipt docs/delivery/headphone-controls-204-trello.json. Model recommendations retained: Codex gpt-6.1-sol/high, Claude Code Sonnet5/medium; verify runtime availability before invoking. Escalate only reproducible control/state/audio regressions. No new agent launched.
