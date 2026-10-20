# HTML211 — Serato-led hybrid with rekordbox mixer and previews

20 October 2026. HTML-only review composition, preserving the existing four workspace options. The new Serato hybrid is the default, Horizontal / Compact. Shared Open Play player nodes and one audio engine remain authoritative; no native rebuild or engine/MIDI/source waveform changes.

## Interface

Flat deck metadata and BPM/scratch surfaces, large shared RGB comparison waveforms, eight A–H cue pads in two rows, permanent transport/mode controls and narrow loop block. Key, key shift/sync/reset, tempo/range, sync/off, key lock, slip, quantize, load/eject, track gain, reverse/repeat/censor/double, loop save and beat jump remain accessible in Compact. Secondary performance modes keep the existing Full guard. Library Focus and Pads disclosure are explicit user choices; Compact itself does not hide the cue banks.

The mixer, inline headphone MIX/LEVEL, master and track-gain rotaries, centered crossfader/assignments and decoded-source library waveform previews reuse the existing rekordbox adapters. Each channel filter is visible in this hybrid; the original rekordbox option retains its reference layout without the added filter row. The scratch surface remains keyboard/pointer interactive despite its flatter presentation.

Reference basis: saved installed Serato disconnected two-deck capture from206 and actual REA rekordbox captures208. Serato capture establishes its waveform/library hierarchy, not connected hardware control parity. The resulting composition is an independently authored hybrid, not an exact native Serato or rekordbox skin. No vendor artwork copied.

## Latest screenshot correction: mixer height

User rejected the centered two-channel mixer island. The final two-channel strips stretch from 4px below the mixer top to 4px above its bottom. Trim begins20px below the mixer top after channel labels; EQ rows distribute vertically and the filter/channel fader ends4px above the bottom. This uses the available deck height instead of leaving large blank margins. Four-channel layouts retain continuous strips rather than a 2×2 mixer arrangement.

## Executed verification

All eight 2/4 decks × Horizontal/Vertical × Compact/Full cases: selected72/144 core controls visible/contained, no selected rotary hit overlaps or mixer/fader escapes, crossfader centered. Final Full Horizontal center width corrected after the rendered check exposed narrow-column collisions. Two-channel stretch geometry measured from the final browser DOM. Compact Loop mode, FX panel below deck/mixer/monitor area, mixer hide/show and existing rekordbox switching checked. These are targeted layout checks, not a DSP test suite.

Actual Play control advanced the deck1 timer from00:00.4 to00:11.2, then paused. Channel1 filter drag0→0.23 and double-click→0 executed; needle/readout matched. Existing master−12dB and track-gain values retained. Reload returned paused deck position to its persisted prior state. No fresh acoustic listening or hardware acceptance claim.

The browser is the1440CSSpx review frame scaled to the current1127px host width. Full/FX/large libraries may scroll; this is not broad viewport/accessibility conformance or full-product parity. Visual approval remains open. Compact core availability does not imply every advanced feature is implemented.

Evidence: public compact receipt `SERATO_HYBRID_211.json`; private screenshots and raw geometry in `local-evidence/serato-hybrid-211/`. Native0.1.27 ASAR SHA256 remains `a4d7135432916a3fb0467d008cd6c97ffb293b4ec63aeeba2e36bff50b60afcb`.

## Tracking and handoff

[UI-HY-01](https://trello.com/c/FkrLm4fa), parent UI-001 linked. Full build plan and Claude handoffs updated; original project prompt retained. Recommended implementation/audit: Codex gpt-6.1-sol/high and Claude Code Sonnet5/medium, actual availability must be checked before invocation. Continue only core DJ and HTML review; no native integration before approval.

## Subsequent direction — Traktor structure, flat visual treatment

User11:39 native Traktor screenshot: prefers its functional arrangement, dislikes its visual skin. Next HTML iteration should use deck-local waveform views beside a full-height central mixer, transport/loop strips at deck bottoms and a dense library. Apply flat Serato/rekordbox surfaces with actual rotary controls and waveform previews. This is recorded direction, not implemented in HTML211; preserve211 for comparison. HTML-only boundary remains.
