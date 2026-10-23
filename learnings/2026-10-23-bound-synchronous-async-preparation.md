# Async preparation can block before returning its promise

**Context:** Library previews requested evicted demo audio while four real tracks played.
**Dead ends:** Synchronous file, decoder-entry and PCM-access probes stayed at or below0.5ms; they did not explain the preview callback stalls.
**What worked:** Measure initial engine.buffer return time by track identity, then chunk only the proven whole-fixture synthesis loop. Real preview calls fell from81–88ms to1.4–2.4ms; two complete reference buffers remained byte-identical in the checked runtime.
**Why:** An async function runs synchronously until its first await; naming it async does not make its CPU loop background work.
**Rule:** Measure synchronous work before a preparation function returns its promise and yield proven CPU loops without changing their sample sequence.
