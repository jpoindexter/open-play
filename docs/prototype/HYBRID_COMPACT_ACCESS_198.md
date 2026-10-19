# Hybrid compact198 — control access audit

19 October2026. HTML prototype only. Current entry point: http://127.0.0.1:8848/prototype/layout-preview.html . Native packaging/integration remains prohibited until Jason approves.

## What changed

- Core loop controls moved out of the optional performance panel: half/double, loop on/off, IN/OUT, Save, beat jump backward/forward, Hold roll and Edit grid remain visible in Compact and Library focus. The existing nodes, data attributes and player handlers are retained; no second transport or DSP implementation.
- The per-deck disclosure now says Pads (or the selected mode) instead of an unexplained arrow. It reopens the five existing performance modes and pads. Expanded still shows these by default.
- Import audio moved into the library toolbar, so collapsing Crates no longer removes disk import. Library tools moved to More panels.
- More panels restores the original Sampler, Scratch, Flip, Video and Coverage & evidence controls. This is navigation to existing functionality; it does not establish algorithm/feature parity. The menu uses native details/summary with Escape-to-close. Existing workspaces also retain this menu so Library tools is not lost outside Hybrid.
- Deck tools remembers its open state when the player redraws the decks. It contains the original track-gain and secondary deck controls. Reset clears that disclosure state.
- Scratch feedback and deck processing/mode text are no longer suppressed. Key, time, BPM/pitch, overview, tempo, transport and mixer remain present.
- Compact vertical waveform height is128px at Medium (96Small/192Large), reducing chrome while keeping the paired A/B region above the mixer. Expanded sizing is unchanged.

## Constraint ledger

Outcome: make the existing Hybrid compact view usable for the core DJ task without hiding essential controls. Target: layout-preview.js/.css and workspace-preview.html. Must preserve the existing engine/control bindings, real imports, all three workspace choices and approval gate. Must not rebuild native, change production index/app/engine/MIDI/DSP/theme files, fabricate key metadata or expand into advanced-feature implementation.

## Executed evidence

Actual IAB1440×1000, two-deck Compact, both real tracks loaded, Pads/Deck tools/More closed and Crates hidden:

- All48 audited core deck action buttons are visible, including looping/beat jumps and key controls. OFF/Censor and other native disabled rules remain state-dependent; disabled is not treated as missing.
- All18 mixer controls are visible, as are the checked readouts/overview/tempo surfaces, master input and disk Import.
- Zero unclassified hidden controls in this particular loaded state. The119 hidden elements have these explicit routes:

| Hidden group | Count | Re-entry |
|---|---:|---|
| Performance pads/mode tabs |26| Pads on the relevant deck |
| Gain/secondary controls |10| Deck tools |
| Secondary panel entries |6| More panels |
| Crate controls/providers |21| Crates |
| Closed Scratch Banks panel internals |53| More panels → Scratch |
| Duplicate detailed zoom buttons |2| Visible top-bar waveform zoom |
| Original layout selector |1| Preview workspace/orientation controls replace it; original Extended/Stack/Library parity remains open |

The audit checks DOM control presence, dimensions and hidden/details ancestors. It is not a browser-computed-style or full accessibility conformance audit. The initial checkVisibility API attempt was unsupported by the tool's DOM representation; the final audit uses geometry plus explicit ancestor state, with actual screenshots and disclosure interactions as corroboration. Generated evidence avoids repeated-reference serialization artifacts.

Real interactions executed: Loop4→2→4 through the relocated buttons; loop on/off active state; Deck tools remained open across deck rerender; Enter opened Pads and exposed Cues/Loops/Stems/Pitch/Slicer; More exposed all six entries; Scratch opened its existing inline Scratch Banks panel and its actual Close performance panel control closed it; Escape closed More. An initial attempt looked for a dialog close button after opening Scratch; inspection established this route is an inline panel, then used the real close control. No unseen advanced behavior inferred.

With deck1fader0, actual real-track playback advanced10.472→37.866→39.340s through Compact Vertical → Horizontal → Library focus. Deck2stayed10s, titles and fader0 remained, one crossfader/two Play buttons. Loop groups remained visible. Both decks were then paused; deck1position40.066s, deck2position10s, deck1level restored0.8, loops off. This was a muted UI/state test, not an acoustic/musical or physical-device acceptance test.

Private evidence: local-evidence/hybrid-compact-198/visibility-audit.json, playback-checks.json and compact-vertical.png. No source MP3s committed. No new DSP/full regression matrix.

## Limits and next boundary

The loaded two-deck Cues-state audit does not establish every mode-dependent control, every popup workflow, four-deck/responsive/touch behavior, full Serato/Traktor layout parity, key-detection accuracy, native acceptance or hardware/headphone/musical acceptance. Original Extended/Stack/Library layouts are intentionally not selectable in this independent preview; that gap remains explicit. The prior IAB observer error is not claimed resolved. Advanced panel navigation was restored, without resuming stems/FX/video development.

Claude: review the exact current HTML and198 evidence first; verify core access before proposing additional UI. Keep this change separate from the desktop build. Native integration requires Jason's approval of the refined prototype. Continue the existing core DJ goal, not a full-feature implementation sprint. Original PROJECT_PROMPT.md suffix remains intact in the completeness handoff.

Skills applied: design dispatcher (layout/composition, density, component states); dec (Nielsen recognition/visibility, accessibility and user control); vd-done-is-executed. No external skill installation or agent invocation.
