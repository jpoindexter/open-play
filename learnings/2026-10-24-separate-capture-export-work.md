# Keep recording export out of measured playback tasks

**Context:** A four-deck trace included a50.9ms main-thread continuation after a completed worklet capture.
**Dead ends:** Treating that continuation as audio capture or product Sync/DSP work confounds the diagnosis; its source performs binary/Base64/JSON/DOM export after the requested frames already transferred.
**What worked:** Disconnect capture routing first, encode49152-byte chunks with yields, and preserve exact PCM/startFrame/sampleRate plus existing archive selectors. Actual-function regressions compare full bytes, odd tails and heartbeat interleaving.
**Why:** Base64 chunks must be multiples of3 to concatenate without internal padding, while acquisition time and later publication wall time describe different events. Join/JSON/DOM and all actual browser timings remain separate limits.
**Rule:** Preserve acquisition timestamps and yield export work in encoding-aligned chunks before interpreting playback timing traces.
