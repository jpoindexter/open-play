# Performance-mode control ownership — 28 October 2026

Actual four-deck Compact Hot Cue → Loops → Auto loop bank → Hot Cue replaced every deck and mixer. Each step retained only117/311observed original controls/canvases/previews outside deck A. Tab changes lost the explicitly focused channel B fader. Outgoing voice/rate/level remained, so this is a presentation-ownership defect, not established audio failure.

Two calls now reuse existing `renderDecks(index)` rather than global `renderDecks()`: the performance-tab branch and loop-bank branch. Existing structural fallback, Slicer release-before-mode-change, controller-pad-mode state and loop-bank focus restoration remain. The selected deck intentionally rebuilds its own structurally different mode controls; unrelated decks, mixer and detail canvas remain. No new runtime module, engine/DSP, style/layout, dependency or format change. Legacy app.js remains debt.

The same actual repaired UI sequence retains316/316observed original outside-deck nodes, all8/8library previews and four Play controls. Both tab changes retain the channel B fader focus/value. Auto loop-bank selection intentionally focuses its new selected button; it is not claimed to retain unrelated fader focus. All three steps preserve outgoing playing voice/rate/level, with physical output muted throughout. The baseline's three versus repaired eight preview nodes reflects lazy rendering timing; retention within each run is the criterion.

One19-line composed regression executes the existing action handler with controlled collaborators. Old tab rendering fails because it lacks a target deck; repaired tab and loop-bank branches pass with owner index, original release/state and intentional focus behavior. No broad suite or clean-song listening rerun.

Native0.1.81was untouched by the diagnostic; source repair needs the next exact package. Native held/playing/controller/listening and broader Sync-pop/stall criteria remain open. No claim of faster frames or silence at hardware outputs beyond the fixture's physical-mute assertion.

[Receipt](performance-mode-controls-2026-10-28.json). Raw fixture/baseline/repaired/screenshot/regression evidence stays ignored in `local-evidence/performance-mode-controls-2026-10-28/`. Owned test stop/clear and source/tab/server cleanup recorded before delivery.
