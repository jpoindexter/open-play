# CORE-FIX-43 follow-through: newer movement on the same tempo fader

28 October2026. Private90/source4e01e3a contains the shared Sync queue repair. The per-deck GUI controller still discarded newer movement on the same fader when an older operation failed. This is tracked on the existing43card rather than a duplicate defect.

## Reproduction and repair

The actual controller’s composed regression originally rejected all three callers and dropped the newer target. The same actual four-deck Compact workspace input handlers reproduce A+1%pending→A+3%queued→controlled first endpoint failure→only one endpoint executed and final124.0BPM. The existing shared Sync repair is present in this baseline, isolating the remaining per-deck queue.

Per-operation waiter ownership now extends through `tempo-slider.js`. Latest waiting movements coalesce; active failure rejects its own callers, then the newer target runs. A failed absolute gesture restores its actual coordinate only when there is no newer waiting gesture; relative gestures retain consumed movement and rebase after settlement. Replacement checks, reset, range/relative behavior, saturation and original error propagation remain. No retry of the failed input, dependency, DSP, clock or layout change.

Actual repaired same-fader path: two endpoint calls, final127.72BPM displayed127.7, A1.03×. Both before/after retain423controls/4Play/1materialized preview, masterVolume0and all decks paused. Error remains visible. Only one preview was materialized at measurement; no all-library readiness claim.

One new composed regression covers absolute and relative same-fader queues; two directly affected rejected-coordinate checks and the existing eight GUI-coordinate checks pass. The new position assertion was changed from strict integer equality to the existing1e-9coordinate tolerance after exposing harmless floating-point representation. No broad suite/soak. The source module is56lines; the new regression23lines. Actual source/browser path before/after executed; native playing/failure/listening remains separate.

Owned frame/context/storage cleared and server stopped. Main native90/profile/originals/recordings were not touched by this browser check. Raw evidence and pinned baseline controller: `local-evidence/tempo-slider-queue-2026-10-28/`. [Compact runtime result](TEMPO_SLIDER_QUEUE_2026-10-28.json).

## Separate session-position observation

One native90Checks→GUI Tempo window open/close with no Prepare, Play, Sync or recording retained exact13.229/12.426positions, BLOW−24, silent master and16materialized previews. It does not reproduce the earlier fractional A-position change. The first native read formats values while a subsequent read exposes numeric values; preserve both and require numeric before/after for exact comparisons. This does not resolve the historical13.0formatted→13.229observation or establish a product cross-session defect. No speculative product change is made for that observation. [Probe](NATIVE_SESSION_FOCUS_090_2026-10-28.json).

Re-entry: package the same-fader follow-through in the next immutable candidate, retain exact paused session positions, and keep the current owner/native failure/listening criteria open. Prior native90tone/stop proof and prior53real-song listening retain their original scopes. No full-core, zero-pop, hardware or public-beta claim.
