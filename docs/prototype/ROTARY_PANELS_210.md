# HTML210 — rotary audit and performance panel overlap

20 October 2026. User corrections: knobs where appropriate throughout the interface, then a screenshot showing DJ FX controls overlapping the decks and mixer. HTML preview only; no native build or audio/DSP/MIDI implementation changes.

## Rotary controls

Master output and per-track gain now have rotary presentation around their original range inputs. Existing TRIM/HIGH/MID/LOW/FILTER inputs get vertical dragging, Shift fine movement and neutral/unity double-click reset. Existing headphone MIX/LEVEL already use knobs. All six FX depth controls now use knobs with percentage readouts. Channel volume faders, crossfader and tempo remain linear. The existing meter remains a meter. Numeric configuration fields in secondary forms are not indiscriminately converted into performance knobs.

`rotary-preview.js` preserves original nodes, IDs, labels and delegated handlers. Drag emits the normal input/change events, so original engine/persistence behavior remains authoritative. Current values synchronize the needle/readout, including programmatic updates and keyboard changes. Bipolar EQ0 remains centered despite asymmetric boost/cut ranges. Disabled empty-deck track gain stays disabled. Native range semantics/keyboard access and existing gain modifier shortcuts remain. Visual/drag behavior is scoped to the rekordbox workspace; other workspace controls retain their previous presentation.

Executed: Master vertical drag−12→−8.9dB and Home→−12; TRIM1→1.26 then double-click→1; HIGH0→3.833 then double-click→0; track gain9.07397576447929→9.17397576447929→original; FX depth50→63→50 by vertical drag. Tested values restored; decks paused. These demonstrate UI/control paths, not fresh acoustic/DSP acceptance. Shift fine drag, pointer cancellation and every modifier combination were not individually exercised.

## Screenshot collision and correction

Legacy preview rules assigned `#panel` to row3. In four-deck Vertical Compact, that row also contained the lower decks and mixer. The screenshot exposed a real layout failure; initial CSS override also lost to the legacy selector's specificity, which the next rendered check caught. The final selector and row adapter now put performance panels in their own full-width track **after** decks/mixer/headphone bar and **before** the library. Opening a panel expands the library track into separate panel/library tracks; closing it restores the original Compact arrangement. The layout row depends on deck count, orientation, density, mixer visibility and Library Focus.

Executed open FX in2/4 decks × Horizontal/Vertical × Full/Compact: panel top below all visible deck/mixer/monitor bounds and library top below panel bottom. Also executed mixer-hidden and Library Focus: all ten cases clear. Six FX knobs remain present. Closed four-deck Compact retains208px rows,144 selected core nodes contained, no rotary hit-area/spacing errors. Other secondary panels reuse the rule but were not exhaustively opened. On shorter screens, open-panel content/library may require scrolling; no broad responsive or accessibility conformance claim.

Private evidence: `local-evidence/rotary-panels-210/{verification.json,fx-open.png,knobs.png}`. Public compact receipt: `ROTARY_PANELS_210.json`. No vendor assets copied. Original player source, engine, MIDI mappings and waveform renderer unchanged.

## Tracking

[UI-RB-07 — rotary controls](https://trello.com/c/f6Tuij0u) and [UI-RB-08 — panel separation](https://trello.com/c/5Exp15Xq) have separate acceptance/evidence records. Parent UI-RB-04 linked. Build plan and Claude handoffs updated, original project prompt preserved. Recommendations remain Codex gpt-6.1-sol/high and Claude Code Sonnet5/medium, availability to be checked before invocation. Core DJ priority remains; visual acceptance and native integration approval remain open.
