# A canceled Sync cannot roll back a newer transport

**Context:** Two same-target Sync requests could cancel the latest request while its voice committed, leaving source and nominal rates different. Sync followed by Reverse had a second stale rollback.
**Dead end:** Comparing track and target rate cannot distinguish two operations that request the same rate. A rate-owner check alone does not detect a newer non-rate start.
**What worked:** Reuse both the current rate owner and start token for completion/rollback; permit explicit Stop to restore an uncommitted rate only when fully stopped with no current/pending voice.
**Why:** Equal values do not establish operation identity.
**Rule:** Test overlapping equal-value requests and a different newer transport, plus a genuine current failure and Stop. This proves request-state integrity, not elimination of an unrecorded acoustic pop.
