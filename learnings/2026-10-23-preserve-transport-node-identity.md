# Transport updates should preserve active controls

**Context:** Play/Pause rebuilt four decks and the mixer while audio was running, triggering preview/layout work and replacing focusable controls.
**Dead ends:** Removing redraws without inventorying their side effects would lose queued-state labels, Censor availability, Sync reconciliation and restored Slicer fields.
**What worked:** Reused one in-place transport presentation update in Play, frame refresh and processing notifications, with a structural fallback when transient cancellation restores other control state.
**Why:** Transport presentation can change without replacing the controls or waveforms; exceptional structural state still needs its existing renderer.
**Rule:** Before removing a structural redraw, enumerate its state side effects and preserve any state the frame loop does not refresh.
