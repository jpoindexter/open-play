# HTML206 — shorter Compact decks from actual app references

19 October2026. Jason rejected205's unused deck space. This pass inspects installed apps before changing the HTML layout. CSS only; no native rebuild.

## Reference and correction

Read docs/research/COMPACT_LAYOUT_REFERENCES_206.md for actual screenshots, observed modes and limitations. Observed native rekordbox4V uses short mirrored deck consoles alongside an independently sized center waveform/mixer. Installed Traktor was switched through Essential and actual Micro/Small deck sizes by double-clicking its deck header, then restored to original Mixer layout. Serato's disconnected2deck screen was inspected; connected hardware modes remain documented-only. No claim all vendors have an identical Compact mode.

Root cause in our preview: deck sizing inherited mixer/waveform row budgets. Compact now has44px header,24px overview,88px loop/control band,28px utility and24px footer with4px row gaps. Mode selector stays24px; paired Play/CUE stay36px. The88px control band fits existing loop buttons, platter and Slip/Quantize/MT controls; no new core controls hidden. Two-deck Horizontal Compact reuses the observed mirrored trim/CUE/fader beside EQ arrangement. Four-deck Vertical uses three underlying grid rows so its mixer can span both shorter deck rows independently. Existing mixer knob targets/labels retain205 spacing. Full presentation unchanged; opening Pads still expands it. Prior203 omission of the FILTER row is unchanged, not introduced here.

## Executed results

Normal browser2/4Deck × H/V Compact, Medium wave size,1440CSS-pixel canvas:

| Layout | Before205 | After206 | Per-deck reduction |
|---|---:|---:|---:|
|2H|268px|224px|44px|
|2V|292px|240px|52px|
|4H|268px|224px|44px|
|4V|268px|224px|44px|

Four-deck total deck region is88px shorter, freeing that height for the library. Final measured library tops:2H542px,2V422px,4H738px,4V634px.72 core deck nodes for2decks /144 for4decks are visible and contained. Selected actions include transport, load/eject, sync, key/tempo/range, loops/jumps, utilities and pad disclosure; track key/time/platter/overview are checked. Mixer rotary inputs do not overlap; crossfader center0px. These checks establish the selected geometry, not every optional feature or audio semantics.

Mixer hide/show and Pads→Full→Compact executed.2V/4V Small/Large waveform sizing retains core controls: Small224px decks, Large268px in2V and244px in4V. Explicit larger waveforms intentionally increase height. Decks remained paused; no broad DSP/audio rerun for CSS. Prior205 EQ/fader and204 headphone behavior evidence remains scoped to those revisions.

Private native/HTML screenshots and full geometry local-evidence/compact-decks-206/. A readback attempt for a nonexistent select value attribute timed out after Pads successfully opened Full; actual body state confirmed density expanded/panel open, then normal Compact selection resumed. No app defect inferred from that tool read.

Native0.1.27 ASAR hash unchanged: a4d7135432916a3fb0467d008cd6c97ffb293b4ec63aeeba2e36bff50b60afcb. App/engine/MIDI/waveform JS unchanged. User visual acceptance, other viewport widths/accessibility, fresh hardware/acoustic and exact vendor parity remain open. HTML only until integration approval.

Trello [UI-RB-06](https://trello.com/c/miElcJk0), linked from UI-RB-04. Build plan/Claude handoffs updated; original prompt suffix retained. Models: existing Codex gpt-6.1-sol/high, Claude Code Sonnet5/medium recommendations; verify availability before invoking. No agents launched. Core DJ focus retained.
