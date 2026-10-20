# HTML215 — Balanced mixer and monitor bar

20 October2026. Refines Traktor flat without replacing the original player, controls, decks or waveform/library modules. Application changes are confined to `prototype/traktor-flat-preview.css`. Native0.1.27 remains untouched.

## Composition

Two decks use a232px center mixer, down from~274px at the1440CSSpx review width. Each channel has a straight TRIM/HIGH/MID/LOW/FILTER stack beside its long inner fader; the right channel mirrors the left. Channel letters sit above the faders and28px headphone CUE buttons anchor the bottoms. This fills the previous disconnected pockets beside the EQ/faders while giving deck content more width. Four decks keep straight channel strips, with44px rotary rows and wider inter-channel gaps. They retain the original channel order for each orientation.

Both counts use24px rotary visuals and4.5px measured knob-to-label clearance. Each knob occupies a40px cell; four-deck rows add4px of vertical spacing. Two-deck rows flex to occupy available height; the labels above the faders avoid requiring an extra full-width heading row in tight vertical views. Light-gray fader handles make their position clearer against the flat dark rails. No faux hardware texture or new graphic assets.

The44px bottom bar now uses the same28px assignment and crossfader targets in two/four decks and Compact/Full. Crossfader travel is184px, centered in the workspace. Four assignments occupy one symmetric row; headphone MIX/LEVEL keep32px input regions, aligned captions and consistent12px group spacing. No old button/modal substitution. This reuses existing nodes and delegated handlers.

All deck sizes, enlarged four-deck Compact targets from214, eight cue pads per deck, key/time/tempo/sync controls, loops/jumps/roll/grid, utility controls and performance modes remain. Mixer trim/EQ/filter/CUE/faders, master/gain knobs, headphone controls and crossfader assignments remain. RGB detailed and overview waveforms, vertical comparison, decoded library row previews, column preference, crates/import, Setup/Devices/MIDI/REC/FX/More panels are preserved. CSS presentation preservation is not a new end-to-end claim for every audio algorithm.

Design reasoning: Gestalt proximity/continuity groups each knob stack with its owning fader; a shared field grid aligns the monitor strip; CUBE-style composition/exception rules remain scoped to Traktor flat. Ponytail full mode keeps the change to the existing CSS adapter.

## Executed verification

- All eight2/4 × Horizontal/Vertical × Compact/Full cases: selected72/144 core bounds and mixer spacing checks clear; mixer/monitor targets minimum24CSSpx with no pairwise overlap. Knob-label gap4.5px throughout; crossfader center offset0px. Mixer/monitor target counts19 in two decks and35 in four.
- Tight two-deck Vertical Large and explicit Library Focus checked with the final28px CUE targets. Four-deck Vertical Large/Library Focus, mixer hide/show and FX clearance also checked; their receipts are unchanged by the last two-deck-only CUE adjustment. No original control nodes removed. All four cue banks retained eight pads.
- Pointer filter drag0→0.18 changed the rotary needle; double-click restored0. Channel fader keyboard0.8→0.81→0.8, crossfader0→0.01→0 and headphone CUE off→on→off executed. Headphone mix accessible feedback50.0%→50.1%→50.0% master; headphone level50.0%→50.1%→50.0%. Initial mix/level range reads were masked by browser output, so verification uses the user-visible accessible value text rather than treating masked fields as evidence.
- All ten library preview images loaded, including the existing local-file tracks. Original waveform renderer/library module unchanged. Final decks paused, pitch0, tested controls restored, master−12dB retained.
- Git whitespace check passed; native0.1.27 ASAR SHA256 unchanged: `a4d7135432916a3fb0467d008cd6c97ffb293b4ec63aeeba2e36bff50b60afcb`.

Summary: `MIXER_BALANCE_215.json`. Private raw receipts/screenshots: `local-evidence/mixer-balance-215/`. The first two-deck spacing pass exposed2.5px label clearance; the final composition restores the established4.5px criterion rather than lowering the test threshold.

## Limits and Claude re-entry

Measurements are CSS pixels in the existing1440CSSpx scaled comparison shell; the Open full size route remains. No fresh acoustic/controller/DSP/full accessibility/full product-parity claim. Full/performance panels may scroll. User visual approval remains open; HTML only, no native integration/rebuild before approval. Core DJ priority.

Trello [UI-HY-01](https://trello.com/c/FkrLm4fa). Claude: compare todb9148f, inspect two-deck mirroring, four-channel order, knob/label clearance and bottom-bar centering; retain every control and library preview, report concrete defects, and do not rebuild native. Recommendations: Codex gpt-6.1-sol/high; Claude Code Sonnet5/medium; verify actual availability before invoking.
