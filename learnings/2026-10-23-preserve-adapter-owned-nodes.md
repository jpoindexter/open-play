# Partial rendering can delete projected controls

**Context:** Replacing one deck while preserving sibling decks, mixer and shared waveform.
**Dead ends:** The baseline live-load assertion failed because the replacement discarded sibling controls and the shared canvas; replacing only the target would also discard scrub controls projected into it by layout adapters.
**What worked:** Reclaim original projected controls before replacing their temporary container, then let the existing adapter observer restore their placement; keep full rendering for structural shape changes.
**Why:** DOM ownership crosses visual containment when adapters move original controls.
**Rule:** Before replacing a container, identify controls projected into it by adapters and preserve their original nodes.
