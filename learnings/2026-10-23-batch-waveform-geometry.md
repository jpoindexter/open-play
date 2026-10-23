# Canvas resizing forces layout between sibling measurements

**Context:** Four-deck replacement and waveform animation mixed DOM geometry reads with presentation writes.
**Dead ends:** Reducing waveform draw frequency did not identify the long frames; call-stack geometry measurements located repeated forced layout.
**What worked:** Measured all overview bounds before any resize or paint, and measured detail geometry before tick presentation writes.
**Why:** Canvas size and DOM writes invalidate layout; a following geometry read can synchronously recompute it.
**Rule:** Batch sibling geometry reads before canvas resizing or presentation writes, then measure the actual frame path.
