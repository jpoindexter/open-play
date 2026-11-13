# Yield PCM staging without retaining detachable source views

**Context:** Real-track probes measured full-channel analysis staging at11.6–17.3ms before Worker posting while four decks played.
**Dead end:** Moving analysis into a Worker does not move its synchronous input preparation. Retaining `getChannelData` views across yields risks WebAudio acquire-contents detachment.
**What worked:** Copy independent1MiB destination slices with `copyFromChannel`, yield between chunks/channels, check cancellation before and during staging and before Worker creation; transfer only staging buffers.
**Why:** This bounds individual copies while preserving exact samples/channel order and allowing controls to run between copies. Whole-channel allocation/GC is still not bounded.
**Rule:** Separate total copy CPU, longest contiguous copy, initial-return CPU and wall time. Verify complete PCM equality/cancellation/transfer ownership and terminate the Worker if posting throws. The no-Worker fallback and allocation tail remain separate limits.
