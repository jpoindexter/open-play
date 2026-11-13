# Keep active controls attached when analysis completes

**Context:** Target-scoped analysis redraw still replaced the very deck a user was adjusting.
**Dead end:** Limiting `renderDecks` to current owners protected siblings but not the focused target control.
**What worked:** Update existing key/accessibility/Sync presentation and repaint only current owners' overview canvases; retain frame-loop transport updates and gain deferral.
**Why:** Metadata freshness and structural DOM ownership have different lifetimes. Refresh the completed overview before the next queued job so labels/warp markers do not stay stale.
**Rule:** Assert target control identity, focused input value and sibling/preview identity on the actual asynchronous completion path; no replacement is stronger than a renderer-scope count. Synthetic retained-pointer fixtures do not prove a physical held gesture.
