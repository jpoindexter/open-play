# Late worklet acknowledgements can commit discontinuous audio

**Context:** A warped-loop replacement could acknowledge after its scheduled boundary while the old voice was still audible.
**Dead ends:** A clean ordinary transport test did not cover the warped-loop commit; a non-whole-bar fixture confounded phase assertions and was replaced with an exact eight-beat loop.
**What worked:** Injected a late acknowledgement into the real worklet path, guarded commit deadlines, and tested owned metadata rollback in callers.
**Why:** Retiring an old voice after the replacement has already advanced changes phase abruptly, while rejected commits can leave requested metadata attached to retained audio.
**Rule:** Reject audio replacements after their commit deadline and restore only metadata still owned by the rejected request.
