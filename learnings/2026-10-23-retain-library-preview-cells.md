# Metadata refresh should not reconstruct decoded previews

**Context:** Routine library refreshes recreated rows and lazy waveform images during track loading and Play.
**Dead ends:** The baseline real-DOM regression disconnected unchanged rows, lost row focus and removed the preview cell.
**What worked:** Cache canonical row markup by track identity, update changed metadata cells, keep adapter-owned preview cells attached, and invalidate the cache for explicit table structure changes.
**Why:** Preview generation and its accessible title have separate lifetimes from the row's play count or selection.
**Rule:** Update metadata cells by stable identity while preserving adapter-owned previews and refreshing their accessible names when metadata changes.
