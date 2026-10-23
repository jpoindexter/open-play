# Unchanged ancestor attributes can force page layout

**Context:** Library waveform refresh wrote a body visibility attribute before measuring candidate preview rows.
**Dead ends:** Counting thumbnail decoding alone missed the layout work; real DOM mutation counts showed90 same-value body writes during15track replacements.
**What worked:** Compared the current dataset value before assigning the preview preference, preserving actual show/hide changes.
**Why:** The ancestor attribute participates in page-wide CSS selectors, so redundant writes can invalidate style before synchronous geometry reads.
**Rule:** Guard unchanged CSS-keyed ancestor attributes before geometry reads and verify both preference transitions and redundant-write counts.
